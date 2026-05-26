from __future__ import annotations


def sma(values: list[float], window: int, index: int) -> float | None:
    if window <= 0:
        raise ValueError("window must be positive")
    if index + 1 < window:
        return None
    sample = values[index + 1 - window : index + 1]
    return sum(sample) / window


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
