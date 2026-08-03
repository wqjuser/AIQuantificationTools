from __future__ import annotations

from .execution_export import _fetch_market_klines_with_cache
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from pathlib import Path
from quant_core.auto_paper_trading import AutoPaperTradingService
from quant_core.cache import MarketDataCache
from quant_core.domain import (
    DataQuality,
    MarketDataRequest,
)

def evaluate_auto_paper_trading_once(
    service: AutoPaperTradingService,
    *,
    cache: MarketDataCache,
    adapter: object,
) -> tuple[dict[str, object], DataQuality]:
    state = service.snapshot()["state"]
    request = MarketDataRequest(
        market=state["market"],
        symbol=state["symbol"],
        timeframe=state["timeframe"],
    )
    required_bars = service.required_bar_count()
    bars, quality = _fetch_market_klines_with_cache(
        cache=cache,
        adapter=adapter,
        request=request,
        limit=min(required_bars + 1, 500),
    )
    if not quality.is_complete:
        return (
            service.record_data_blocked("行情数据不完整，已跳过本轮决策。"),
            quality,
        )
    now = datetime.now(timezone.utc)
    interval = timedelta(minutes=1)
    closed = sorted(
        (
            bar
            for bar in bars
            if bar.timestamp + interval <= now
        ),
        key=lambda bar: bar.timestamp,
    )
    if len(closed) < required_bars:
        return (
            service.record_data_blocked(
                f"完整 K 线不足 {required_bars} 根，已跳过本轮决策。"
            ),
            quality,
        )
    if closed[-1].timestamp + interval < now - interval * 2:
        return (
            service.record_data_blocked("最新完整 K 线已过期，已跳过本轮决策。"),
            quality,
        )
    window = closed[-required_bars:]
    if any(
        current.timestamp - previous.timestamp != interval
        for previous, current in zip(window, window[1:])
    ):
        return (
            service.record_data_blocked("完整 K 线时间不连续，已跳过本轮决策。"),
            quality,
        )
    return service.evaluate(window, data_source=quality.source), quality


def _stage1_daily_use_project_root(report_path: Path) -> Path:
    resolved = report_path.resolve()
    if resolved.parent.name == "data":
        return resolved.parent.parent
    return Path.cwd()
