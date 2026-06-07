from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from typing import Any, Literal

from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, EquityPoint, Market, Timeframe
from quant_core.indicators import max_drawdown_pct


@dataclass(frozen=True)
class PortfolioLeg:
    target_weight: float
    run: BacktestRun
    run_id: str | None = None


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
class PortfolioCovarianceRiskContribution:
    symbol: str
    source_run_id: str | None
    target_weight: float
    annualized_volatility_pct: float
    marginal_contribution_pct: float
    contribution_pct: float


@dataclass(frozen=True)
class PortfolioCovarianceRiskSummary:
    method: Literal["population_covariance"]
    observations: int
    period_volatility_pct: float
    annualized_volatility_pct: float
    contributions: list[PortfolioCovarianceRiskContribution]


@dataclass(frozen=True)
class PortfolioAllocationEvent:
    timestamp: datetime
    event_type: Literal["allocate", "cash_buffer"]
    symbol: str
    source_run_id: str | None
    target_weight: float
    notional_value: float
    reason: str


@dataclass(frozen=True)
class PortfolioRebalanceEvent:
    timestamp: datetime
    event_type: Literal["rebalance_review"]
    symbol: str
    source_run_id: str | None
    target_weight: float
    ending_weight: float
    current_value: float
    target_value: float
    delta_value: float
    drift_pct: float
    status: Literal["within_band", "review", "blocked"]
    reason: str


@dataclass(frozen=True)
class PortfolioTradeReviewEvent:
    timestamp: datetime
    event_type: Literal["trade_review"]
    symbol: str
    source_run_id: str | None
    side: Literal["buy", "sell", "hold"]
    notional_value: float
    target_weight: float
    ending_weight: float
    status: Literal["paper_review", "blocked", "no_action"]
    reason: str


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
    allocation_events: list[PortfolioAllocationEvent]
    rebalance_events: list[PortfolioRebalanceEvent]
    trade_review_events: list[PortfolioTradeReviewEvent]
    correlation_pairs: list[PortfolioCorrelationPair]
    covariance_risk: PortfolioCovarianceRiskSummary
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
        allocation_events = self._allocation_events(legs, cash_weight, timestamps[0])
        rebalance_events = self._rebalance_events(
            legs=legs,
            leg_results=leg_results,
            cash_weight=cash_weight,
            cash_value=cash_value,
            ending_equity=equity_curve[-1].equity,
            timestamp=timestamps[-1],
        )
        trade_review_events = self._trade_review_events(rebalance_events)
        correlation_pairs = self._correlation_pairs(legs)
        covariance_risk = self._covariance_risk(legs, timeframe)
        return PortfolioBacktestRun(
            name=name,
            market=market,
            timeframe=timeframe,
            initial_cash=self.initial_cash,
            cash_weight=cash_weight,
            metrics=metrics,
            equity_curve=equity_curve,
            legs=leg_results,
            allocation_events=allocation_events,
            rebalance_events=rebalance_events,
            trade_review_events=trade_review_events,
            correlation_pairs=correlation_pairs,
            covariance_risk=covariance_risk,
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

    def _allocation_events(
        self, legs: list[PortfolioLeg], cash_weight: float, timestamp: datetime
    ) -> list[PortfolioAllocationEvent]:
        events = [
            PortfolioAllocationEvent(
                timestamp=timestamp,
                event_type="allocate",
                symbol=leg.run.symbol,
                source_run_id=leg.run_id,
                target_weight=round(leg.target_weight, 10),
                notional_value=round(self.initial_cash * leg.target_weight, 4),
                reason="static target allocation from audited single-symbol run",
            )
            for leg in legs
        ]
        if cash_weight > 0:
            events.append(
                PortfolioAllocationEvent(
                    timestamp=timestamp,
                    event_type="cash_buffer",
                    symbol="CASH",
                    source_run_id=None,
                    target_weight=cash_weight,
                    notional_value=round(self.initial_cash * cash_weight, 4),
                    reason="unallocated cash buffer; no order is routed",
                )
            )
        return events

    def _rebalance_events(
        self,
        legs: list[PortfolioLeg],
        leg_results: list[PortfolioLegResult],
        cash_weight: float,
        cash_value: float,
        ending_equity: float,
        timestamp: datetime,
    ) -> list[PortfolioRebalanceEvent]:
        if ending_equity <= 0:
            return []

        events: list[PortfolioRebalanceEvent] = []
        for leg, result in zip(legs, leg_results, strict=True):
            events.append(
                self._rebalance_event(
                    timestamp=timestamp,
                    symbol=result.symbol,
                    source_run_id=leg.run_id,
                    target_weight=result.target_weight,
                    current_value=result.ending_value,
                    ending_equity=ending_equity,
                )
            )
        if cash_weight > 0:
            events.append(
                self._rebalance_event(
                    timestamp=timestamp,
                    symbol="CASH",
                    source_run_id=None,
                    target_weight=cash_weight,
                    current_value=cash_value,
                    ending_equity=ending_equity,
                )
            )
        return events

    def _rebalance_event(
        self,
        timestamp: datetime,
        symbol: str,
        source_run_id: str | None,
        target_weight: float,
        current_value: float,
        ending_equity: float,
    ) -> PortfolioRebalanceEvent:
        ending_weight = current_value / ending_equity
        target_value = ending_equity * target_weight
        delta_value = target_value - current_value
        drift = ending_weight - target_weight
        status: Literal["within_band", "review", "blocked"]
        if abs(drift) >= 0.1:
            status = "blocked"
        elif abs(drift) > 0.02:
            status = "review"
        else:
            status = "within_band"
        reason = (
            "ending weight drift exceeds the hard threshold; no order is routed"
            if status == "blocked"
            else "ending weight drift requires review; no order is routed"
            if status == "review"
            else "ending weight remains inside the review band"
        )
        return PortfolioRebalanceEvent(
            timestamp=timestamp,
            event_type="rebalance_review",
            symbol=symbol,
            source_run_id=source_run_id,
            target_weight=round(target_weight, 10),
            ending_weight=round(ending_weight, 4),
            current_value=round(current_value, 4),
            target_value=round(target_value, 4),
            delta_value=round(delta_value, 4),
            drift_pct=round(drift * 100, 4),
            status=status,
            reason=reason,
        )

    def _trade_review_events(self, rebalance_events: list[PortfolioRebalanceEvent]) -> list[PortfolioTradeReviewEvent]:
        events: list[PortfolioTradeReviewEvent] = []
        for event in rebalance_events:
            if event.symbol == "CASH":
                continue
            side: Literal["buy", "sell", "hold"]
            if event.status == "within_band" or event.delta_value == 0:
                side = "hold"
                notional_value = 0.0
                status: Literal["paper_review", "blocked", "no_action"] = "no_action"
                reason = "ending weight remains inside the review band; no trade review required"
            else:
                side = "buy" if event.delta_value > 0 else "sell"
                notional_value = abs(event.delta_value)
                status = "blocked" if event.status == "blocked" else "paper_review"
                reason = (
                    "rebalance drift is blocked; manual portfolio review required before any paper order"
                    if status == "blocked"
                    else "paper-only rebalance intent generated from audited portfolio drift; no order is routed"
                )
            events.append(
                PortfolioTradeReviewEvent(
                    timestamp=event.timestamp,
                    event_type="trade_review",
                    symbol=event.symbol,
                    source_run_id=event.source_run_id,
                    side=side,
                    notional_value=round(notional_value, 4),
                    target_weight=event.target_weight,
                    ending_weight=event.ending_weight,
                    status=status,
                    reason=reason,
                )
            )
        return events

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

    def _covariance_risk(self, legs: list[PortfolioLeg], timeframe: Timeframe) -> PortfolioCovarianceRiskSummary:
        returns_by_leg = [self._period_returns(leg.run.equity_curve) for leg in legs]
        observations = min((len(returns) for returns in returns_by_leg), default=0)
        periods_per_year = self._periods_per_year(timeframe)

        if observations <= 0:
            return PortfolioCovarianceRiskSummary(
                method="population_covariance",
                observations=0,
                period_volatility_pct=0.0,
                annualized_volatility_pct=0.0,
                contributions=[
                    PortfolioCovarianceRiskContribution(
                        symbol=leg.run.symbol,
                        source_run_id=leg.run_id,
                        target_weight=round(leg.target_weight, 10),
                        annualized_volatility_pct=0.0,
                        marginal_contribution_pct=0.0,
                        contribution_pct=0.0,
                    )
                    for leg in legs
                ],
            )

        clipped_returns = [returns[:observations] for returns in returns_by_leg]
        covariance_matrix = self._covariance_matrix(clipped_returns)
        weights = [leg.target_weight for leg in legs]
        weighted_covariance = [
            sum(covariance_matrix[row_index][column_index] * weights[column_index] for column_index in range(len(weights)))
            for row_index in range(len(weights))
        ]
        portfolio_variance = sum(weights[index] * weighted_covariance[index] for index in range(len(weights)))
        portfolio_variance = max(portfolio_variance, 0.0)
        period_volatility = portfolio_variance ** 0.5
        annualization = periods_per_year ** 0.5

        contributions = []
        for index, leg in enumerate(legs):
            leg_variance = max(covariance_matrix[index][index], 0.0)
            marginal_period_risk = weighted_covariance[index] / period_volatility if period_volatility > 0 else 0.0
            contribution_share = (
                weights[index] * weighted_covariance[index] / portfolio_variance
                if portfolio_variance > 0
                else 0.0
            )
            contributions.append(
                PortfolioCovarianceRiskContribution(
                    symbol=leg.run.symbol,
                    source_run_id=leg.run_id,
                    target_weight=round(leg.target_weight, 10),
                    annualized_volatility_pct=round((leg_variance ** 0.5) * annualization * 100, 4),
                    marginal_contribution_pct=round(marginal_period_risk * annualization * 100, 4),
                    contribution_pct=round(contribution_share * 100, 4),
                )
            )

        return PortfolioCovarianceRiskSummary(
            method="population_covariance",
            observations=observations,
            period_volatility_pct=round(period_volatility * 100, 4),
            annualized_volatility_pct=round(period_volatility * annualization * 100, 4),
            contributions=contributions,
        )

    def _covariance_matrix(self, returns_by_leg: list[list[float]]) -> list[list[float]]:
        if not returns_by_leg:
            return []
        observations = len(returns_by_leg[0])
        means = [sum(returns) / observations if observations else 0.0 for returns in returns_by_leg]
        matrix: list[list[float]] = []
        for left_index, left_returns in enumerate(returns_by_leg):
            row: list[float] = []
            for right_index, right_returns in enumerate(returns_by_leg):
                if observations <= 0:
                    row.append(0.0)
                    continue
                covariance = sum(
                    (left_returns[index] - means[left_index]) * (right_returns[index] - means[right_index])
                    for index in range(observations)
                ) / observations
                row.append(covariance)
            matrix.append(row)
        return matrix

    def _periods_per_year(self, timeframe: Timeframe) -> int:
        return 252 if timeframe == "1d" else 252 * 240

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
        "allocationEvents": [
            {
                "timestamp": event.timestamp.isoformat(),
                "eventType": event.event_type,
                "symbol": event.symbol,
                "sourceRunId": event.source_run_id,
                "targetWeight": event.target_weight,
                "notionalValue": event.notional_value,
                "reason": event.reason,
            }
            for event in run.allocation_events
        ],
        "rebalanceEvents": [
            {
                "timestamp": event.timestamp.isoformat(),
                "eventType": event.event_type,
                "symbol": event.symbol,
                "sourceRunId": event.source_run_id,
                "targetWeight": event.target_weight,
                "endingWeight": event.ending_weight,
                "currentValue": event.current_value,
                "targetValue": event.target_value,
                "deltaValue": event.delta_value,
                "driftPct": event.drift_pct,
                "status": event.status,
                "reason": event.reason,
            }
            for event in run.rebalance_events
        ],
        "tradeReviewEvents": [
            {
                "timestamp": event.timestamp.isoformat(),
                "eventType": event.event_type,
                "symbol": event.symbol,
                "sourceRunId": event.source_run_id,
                "side": event.side,
                "notionalValue": event.notional_value,
                "targetWeight": event.target_weight,
                "endingWeight": event.ending_weight,
                "status": event.status,
                "reason": event.reason,
            }
            for event in run.trade_review_events
        ],
        "correlationPairs": [
            {
                "leftSymbol": pair.left_symbol,
                "rightSymbol": pair.right_symbol,
                "correlation": pair.correlation,
            }
            for pair in run.correlation_pairs
        ],
        "covarianceRisk": {
            "method": run.covariance_risk.method,
            "observations": run.covariance_risk.observations,
            "periodVolatilityPct": run.covariance_risk.period_volatility_pct,
            "annualizedVolatilityPct": run.covariance_risk.annualized_volatility_pct,
            "contributions": [
                {
                    "symbol": contribution.symbol,
                    "sourceRunId": contribution.source_run_id,
                    "targetWeight": contribution.target_weight,
                    "annualizedVolatilityPct": contribution.annualized_volatility_pct,
                    "marginalContributionPct": contribution.marginal_contribution_pct,
                    "contributionPct": contribution.contribution_pct,
                }
                for contribution in run.covariance_risk.contributions
            ],
        },
        "dataQuality": _data_quality_to_payload(run.data_quality),
    }


def _data_quality_to_payload(quality: DataQuality) -> dict[str, Any]:
    return {
        "source": quality.source,
        "isComplete": quality.is_complete,
        "warnings": list(quality.warnings),
        "rows": quality.rows,
    }
