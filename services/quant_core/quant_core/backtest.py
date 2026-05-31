from __future__ import annotations

from dataclasses import dataclass

from quant_core.domain import (
    BacktestMetrics,
    BacktestRun,
    Condition,
    DataQuality,
    EquityPoint,
    OHLCVBar,
    StrategyConfig,
    Trade,
)
from quant_core.indicators import max_drawdown_pct, rsi, sma


@dataclass
class _Position:
    quantity: float = 0.0
    entry_price: float = 0.0


class BacktestEngine:
    def __init__(self, initial_cash: float = 100_000, fee_rate: float = 0.0003, slippage_rate: float = 0.0002) -> None:
        self.initial_cash = initial_cash
        self.fee_rate = fee_rate
        self.slippage_rate = slippage_rate

    def run(self, strategy: StrategyConfig, bars: list[OHLCVBar]) -> BacktestRun:
        if not bars:
            raise ValueError("backtest requires at least one OHLCV bar")

        ordered_bars = sorted(bars, key=lambda bar: bar.timestamp)
        closes = [bar.close for bar in ordered_bars]
        volumes = [bar.volume for bar in ordered_bars]
        symbol = strategy.symbols[0]
        cash = self.initial_cash
        position = _Position()
        trades: list[Trade] = []
        equity_curve: list[EquityPoint] = []

        for index, bar in enumerate(ordered_bars):
            if position.quantity <= 0 and self._all_conditions(strategy.entry_conditions, closes, volumes, index):
                budget = cash * max(0.0, min(strategy.risk.position_pct, 1.0))
                execution_price = bar.close * (1 + self.slippage_rate)
                quantity = budget / execution_price if execution_price else 0.0
                fee = budget * self.fee_rate
                if quantity > 0 and budget + fee <= cash:
                    cash -= budget + fee
                    position = _Position(quantity=quantity, entry_price=execution_price)
                    trades.append(
                        Trade(
                            symbol=symbol,
                            side="buy",
                            timestamp=bar.timestamp,
                            price=execution_price,
                            quantity=quantity,
                            fee=fee,
                            reason="entry_conditions",
                        )
                    )

            elif position.quantity > 0:
                exit_reason = self._exit_reason(strategy, position.entry_price, bar.close, closes, volumes, index)
                if exit_reason is not None:
                    execution_price = bar.close * (1 - self.slippage_rate)
                    gross = position.quantity * execution_price
                    fee = gross * self.fee_rate
                    cash += gross - fee
                    trades.append(
                        Trade(
                            symbol=symbol,
                            side="sell",
                            timestamp=bar.timestamp,
                            price=execution_price,
                            quantity=position.quantity,
                            fee=fee,
                            reason=exit_reason,
                        )
                    )
                    position = _Position()

            equity_curve.append(EquityPoint(timestamp=bar.timestamp, equity=cash + position.quantity * bar.close))

        if position.quantity > 0:
            last_bar = ordered_bars[-1]
            execution_price = last_bar.close * (1 - self.slippage_rate)
            gross = position.quantity * execution_price
            fee = gross * self.fee_rate
            cash += gross - fee
            trades.append(
                Trade(
                    symbol=symbol,
                    side="sell",
                    timestamp=last_bar.timestamp,
                    price=execution_price,
                    quantity=position.quantity,
                    fee=fee,
                    reason="end_of_backtest",
                )
            )
            position = _Position()
            equity_curve[-1] = EquityPoint(timestamp=last_bar.timestamp, equity=cash)

        metrics = self._metrics(trades, [point.equity for point in equity_curve], len(ordered_bars), strategy.timeframe)
        return BacktestRun(
            strategy_name=strategy.name,
            strategy_revision=strategy.revision,
            symbol=symbol,
            market=strategy.market,
            timeframe=strategy.timeframe,
            metrics=metrics,
            trades=trades,
            equity_curve=equity_curve,
            data_quality=DataQuality(source="local-cache", is_complete=True, rows=len(ordered_bars)),
        )

    def _all_conditions(self, conditions: list[Condition], closes: list[float], volumes: list[float], index: int) -> bool:
        return bool(conditions) and all(self._condition_met(condition, closes, volumes, index) for condition in conditions)

    def _condition_met(self, condition: Condition, closes: list[float], volumes: list[float], index: int) -> bool:
        if condition.kind == "close_above_sma":
            average = sma(closes, int(condition.params["window"]), index)
            return average is not None and closes[index] > average
        if condition.kind == "close_below_sma":
            average = sma(closes, int(condition.params["window"]), index)
            return average is not None and closes[index] < average
        if condition.kind == "volume_above_sma":
            average = sma(volumes, int(condition.params["window"]), index)
            return average is not None and volumes[index] > average
        if condition.kind == "rsi_below":
            value = rsi(closes, int(condition.params.get("window", 14)), index)
            threshold = float(condition.params.get("threshold", 30))
            return value is not None and value < threshold
        if condition.kind == "rsi_above":
            value = rsi(closes, int(condition.params.get("window", 14)), index)
            threshold = float(condition.params.get("threshold", 70))
            return value is not None and value > threshold
        raise ValueError(f"unsupported condition: {condition.kind}")

    def _exit_reason(
        self,
        strategy: StrategyConfig,
        entry_price: float,
        close: float,
        closes: list[float],
        volumes: list[float],
        index: int,
    ) -> str | None:
        if strategy.risk.stop_loss_pct is not None and close <= entry_price * (1 - strategy.risk.stop_loss_pct):
            return "stop_loss"
        if strategy.risk.take_profit_pct is not None and close >= entry_price * (1 + strategy.risk.take_profit_pct):
            return "take_profit"
        if self._all_conditions(strategy.exit_conditions, closes, volumes, index):
            return "exit_conditions"
        return None

    def _metrics(self, trades: list[Trade], equity_values: list[float], bar_count: int, timeframe: str) -> BacktestMetrics:
        ending_equity = equity_values[-1] if equity_values else self.initial_cash
        total_return = (ending_equity / self.initial_cash - 1) * 100
        periods_per_year = 252 if timeframe == "1d" else 252 * 240
        annual_return = ((ending_equity / self.initial_cash) ** (periods_per_year / max(bar_count, 1)) - 1) * 100

        wins = 0
        losses = 0
        gross_profit = 0.0
        gross_loss = 0.0
        entry: Trade | None = None
        for trade in trades:
            if trade.side == "buy":
                entry = trade
            elif trade.side == "sell" and entry is not None:
                pnl = (trade.price - entry.price) * trade.quantity - entry.fee - trade.fee
                if pnl >= 0:
                    wins += 1
                    gross_profit += pnl
                else:
                    losses += 1
                    gross_loss += abs(pnl)
                entry = None

        closed_trades = wins + losses
        profit_factor = gross_profit / gross_loss if gross_loss else (gross_profit if gross_profit else 0.0)
        return BacktestMetrics(
            total_return_pct=round(total_return, 4),
            annual_return_pct=round(annual_return, 4),
            max_drawdown_pct=max_drawdown_pct(equity_values),
            win_rate_pct=round((wins / closed_trades * 100) if closed_trades else 0.0, 4),
            profit_factor=round(profit_factor, 4),
            trade_count=len(trades),
        )
