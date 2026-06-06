from __future__ import annotations

from dataclasses import dataclass

from typing import Any

from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint, Market, Timeframe
from quant_core.indicators import max_drawdown_pct


@dataclass(frozen=True)
class PortfolioLeg:
    target_weight: float
    run: BacktestRun


@dataclass(frozen=True)
class PortfolioLegResult:
    symbol: str
    target_weight: float
    starting_value: float
    ending_value: float
    contribution_value: float
    contribution_return_pct: float
    max_drawdown_pct: float
    trade_count: int
    data_quality: DataQuality


@dataclass(frozen=True)
class PortfolioCorrelationPair:
    left_symbol: str
    right_symbol: str
    correlation: float


@dataclass(frozen=True)
class PortfolioBacktestRun:
    name: str
    market: Market
    timeframe: Timeframe
    initial_cash: float
    cash_weight: float
    metrics: BacktestMetrics
    equity_curve: list[EquityPoint]
    legs: list[PortfolioLegResult]
    correlation_pairs: list[PortfolioCorrelationPair]
    data_quality: DataQuality


class PortfolioBacktestEngine:
    def __init__(self, initial_cash: float = 100_000) -> None:
        if initial_cash <= 0:
            raise ValueError("portfolio backtest initial_cash must be positive")
        self.initial_cash = initial_cash

    def run(self, name: str, legs: list[PortfolioLeg]) -> PortfolioBacktestRun:
        if not legs:
            raise ValueError("portfolio backtest requires at least one leg")

        total_weight = sum(leg.target_weight for leg in legs)
        if any(leg.target_weight <= 0 for leg in legs):
            raise ValueError("portfolio leg target_weight must be positive")
        if total_weight > 1.0000001:
            raise ValueError("portfolio leg weights cannot exceed 100%")

        first_run = legs[0].run
        if not first_run.equity_curve:
            raise ValueError("portfolio leg equity_curve cannot be empty")

        market = first_run.market
        timeframe = first_run.timeframe
        timestamps = [point.timestamp for point in first_run.equity_curve]
        cash_weight = round(max(0.0, 1.0 - total_weight), 10)
        cash_value = self.initial_cash * cash_weight

        self._validate_leg_runs(legs, market, timeframe, timestamps)

        equity_curve: list[EquityPoint] = []
        leg_results = [self._leg_result(leg) for leg in legs]
        for index, timestamp in enumerate(timestamps):
            equity = cash_value
            for leg in legs:
                starting_equity = leg.run.equity_curve[0].equity
                allocation = self.initial_cash * leg.target_weight
                equity += allocation * (leg.run.equity_curve[index].equity / starting_equity)
            equity_curve.append(EquityPoint(timestamp=timestamp, equity=round(equity, 4)))

        metrics = self._metrics(equity_curve, legs, timeframe)
        data_quality = self._data_quality(legs, rows=len(timestamps))
        correlation_pairs = self._correlation_pairs(legs)
        return PortfolioBacktestRun(
            name=name,
            market=market,
            timeframe=timeframe,
            initial_cash=self.initial_cash,
            cash_weight=cash_weight,
            metrics=metrics,
            equity_curve=equity_curve,
            legs=leg_results,
            correlation_pairs=correlation_pairs,
            data_quality=data_quality,
        )

    def _validate_leg_runs(self, legs: list[PortfolioLeg], market: Market, timeframe: Timeframe, timestamps: list) -> None:
        for leg in legs:
            run = leg.run
            if run.market != market or run.timeframe != timeframe:
                raise ValueError("portfolio legs must share market and timeframe")
            if not run.equity_curve:
                raise ValueError("portfolio leg equity_curve cannot be empty")
            if run.equity_curve[0].equity <= 0:
                raise ValueError("portfolio leg starting equity must be positive")
            if [point.timestamp for point in run.equity_curve] != timestamps:
                raise ValueError("portfolio legs must use aligned equity timestamps")

    def _leg_result(self, leg: PortfolioLeg) -> PortfolioLegResult:
        starting_equity = leg.run.equity_curve[0].equity
        ending_equity = leg.run.equity_curve[-1].equity
        starting_value = self.initial_cash * leg.target_weight
        ending_value = starting_value * (ending_equity / starting_equity)
        equity_values = [point.equity for point in leg.run.equity_curve]
        return PortfolioLegResult(
            symbol=leg.run.symbol,
            target_weight=round(leg.target_weight, 10),
            starting_value=round(starting_value, 4),
            ending_value=round(ending_value, 4),
            contribution_value=round(ending_value - starting_value, 4),
            contribution_return_pct=round((ending_equity / starting_equity - 1) * 100, 4),
            max_drawdown_pct=max_drawdown_pct(equity_values),
            trade_count=leg.run.metrics.trade_count,
            data_quality=leg.run.data_quality,
        )

    def _metrics(self, equity_curve: list[EquityPoint], legs: list[PortfolioLeg], timeframe: Timeframe) -> BacktestMetrics:
        equity_values = [point.equity for point in equity_curve]
        ending_equity = equity_values[-1]
        total_return = (ending_equity / self.initial_cash - 1) * 100
        periods_per_year = 252 if timeframe == "1d" else 252 * 240
        annual_return = ((ending_equity / self.initial_cash) ** (periods_per_year / max(len(equity_curve), 1)) - 1) * 100
        trade_count = sum(leg.run.metrics.trade_count for leg in legs)
        win_rate = self._trade_weighted_metric(legs, "win_rate_pct", trade_count)
        profit_factor = self._trade_weighted_metric(legs, "profit_factor", trade_count)
        return BacktestMetrics(
            total_return_pct=round(total_return, 4),
            annual_return_pct=round(annual_return, 4),
            max_drawdown_pct=max_drawdown_pct(equity_values),
            win_rate_pct=round(win_rate, 4),
            profit_factor=round(profit_factor, 4),
            trade_count=trade_count,
        )

    def _trade_weighted_metric(self, legs: list[PortfolioLeg], field: str, trade_count: int) -> float:
        if trade_count <= 0:
            return 0.0
        return sum(getattr(leg.run.metrics, field) * leg.run.metrics.trade_count for leg in legs) / trade_count

    def _data_quality(self, legs: list[PortfolioLeg], rows: int) -> DataQuality:
        warnings: list[str] = []
        sources: list[str] = []
        for leg in legs:
            sources.append(f"{leg.run.symbol}:{leg.run.data_quality.source}")
            warnings.extend(f"{leg.run.symbol}: {warning}" for warning in leg.run.data_quality.warnings)
        return DataQuality(
            source="portfolio-composite(" + ",".join(sources) + ")",
            is_complete=all(leg.run.data_quality.is_complete for leg in legs),
            warnings=warnings,
            rows=rows,
        )

    def _correlation_pairs(self, legs: list[PortfolioLeg]) -> list[PortfolioCorrelationPair]:
        pairs: list[PortfolioCorrelationPair] = []
        leg_returns = {leg.run.symbol: self._period_returns(leg.run.equity_curve) for leg in legs}
        for left_index, left in enumerate(legs):
            for right in legs[left_index + 1 :]:
                correlation = self._pearson_correlation(leg_returns[left.run.symbol], leg_returns[right.run.symbol])
                pairs.append(
                    PortfolioCorrelationPair(
                        left_symbol=left.run.symbol,
                        right_symbol=right.run.symbol,
                        correlation=round(correlation, 4),
                    )
                )
        return pairs

    def _period_returns(self, equity_curve: list[EquityPoint]) -> list[float]:
        returns: list[float] = []
        for previous, current in zip(equity_curve, equity_curve[1:], strict=False):
            if previous.equity <= 0:
                returns.append(0.0)
            else:
                returns.append(current.equity / previous.equity - 1)
        return returns

    def _pearson_correlation(self, left: list[float], right: list[float]) -> float:
        if len(left) != len(right) or len(left) < 2:
            return 0.0
        left_mean = sum(left) / len(left)
        right_mean = sum(right) / len(right)
        left_centered = [value - left_mean for value in left]
        right_centered = [value - right_mean for value in right]
        numerator = sum(left_value * right_value for left_value, right_value in zip(left_centered, right_centered, strict=True))
        left_variance = sum(value * value for value in left_centered)
        right_variance = sum(value * value for value in right_centered)
        denominator = (left_variance * right_variance) ** 0.5
        if denominator <= 0:
            return 0.0
        return numerator / denominator


def portfolio_backtest_run_to_payload(run: PortfolioBacktestRun) -> dict[str, Any]:
    return {
        "name": run.name,
        "market": run.market,
        "timeframe": run.timeframe,
        "initialCash": run.initial_cash,
        "cashWeight": run.cash_weight,
        "metrics": {
            "totalReturnPct": run.metrics.total_return_pct,
            "annualReturnPct": run.metrics.annual_return_pct,
            "maxDrawdownPct": run.metrics.max_drawdown_pct,
            "winRatePct": run.metrics.win_rate_pct,
            "profitFactor": run.metrics.profit_factor,
            "tradeCount": run.metrics.trade_count,
        },
        "equityCurve": [
            {"timestamp": point.timestamp.isoformat(), "equity": point.equity}
            for point in run.equity_curve
        ],
        "legs": [
            {
                "symbol": leg.symbol,
                "targetWeight": leg.target_weight,
                "startingValue": leg.starting_value,
                "endingValue": leg.ending_value,
                "contributionValue": leg.contribution_value,
                "contributionReturnPct": leg.contribution_return_pct,
                "maxDrawdownPct": leg.max_drawdown_pct,
                "tradeCount": leg.trade_count,
                "dataQuality": _data_quality_to_payload(leg.data_quality),
            }
            for leg in run.legs
        ],
        "correlationPairs": [
            {
                "leftSymbol": pair.left_symbol,
                "rightSymbol": pair.right_symbol,
                "correlation": pair.correlation,
            }
            for pair in run.correlation_pairs
        ],
        "dataQuality": _data_quality_to_payload(run.data_quality),
    }


def _data_quality_to_payload(quality: DataQuality) -> dict[str, Any]:
    return {
        "source": quality.source,
        "isComplete": quality.is_complete,
        "warnings": list(quality.warnings),
        "rows": quality.rows,
    }
