from __future__ import annotations


def sma(values: list[float], window: int, index: int) -> float | None:
    if window <= 0:
        raise ValueError("window must be positive")
    if index + 1 < window:
        return None
    sample = values[index + 1 - window : index + 1]
    return sum(sample) / window


def rsi(values: list[float], window: int, index: int) -> float | None:
    if window <= 0:
        raise ValueError("window must be positive")
    if index < window:
        return None

    gains = 0.0
    losses = 0.0
    for current_index in range(index - window + 1, index + 1):
        change = values[current_index] - values[current_index - 1]
        if change >= 0:
            gains += change
        else:
            losses += abs(change)

    average_gain = gains / window
    average_loss = losses / window
    if average_loss == 0:
        return 100.0 if average_gain > 0 else 50.0
    if average_gain == 0:
        return 0.0

    relative_strength = average_gain / average_loss
    return 100 - (100 / (1 + relative_strength))


def max_drawdown_pct(equity_values: list[float]) -> float:
    if not equity_values:
        return 0.0
    peak = equity_values[0]
    max_drawdown = 0.0
    for equity in equity_values:
        peak = max(peak, equity)
        if peak:
            max_drawdown = max(max_drawdown, (peak - equity) / peak)
    return round(max_drawdown * 100, 4)
