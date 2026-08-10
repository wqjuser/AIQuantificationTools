from __future__ import annotations

from .execution_export import _fetch_market_klines_with_cache
from dataclasses import replace
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from pathlib import Path
from quant_core.auto_paper_trading import AutoPaperTradingService
from quant_core.cache import MarketDataCache
from quant_core.data_foundation import assess_chunked_market_data_quality
from quant_core.domain import (
    DataQuality,
    MarketDataRequest,
    OHLCVBar,
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
    fetch_count = getattr(service, "required_fetch_bar_count", service.required_bar_count)
    fetch_bars = fetch_count()
    bars, quality = _fetch_recent_market_window(
        cache=cache,
        adapter=adapter,
        request=request,
        limit=fetch_bars + 1,
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
    if len(closed) < fetch_bars:
        return (
            service.record_data_blocked(
                f"完整 K 线不足 {fetch_bars} 根，已跳过本轮决策。"
            ),
            quality,
        )
    if closed[-1].timestamp + interval < now - interval * 2:
        return (
            service.record_data_blocked("最新完整 K 线已过期，已跳过本轮决策。"),
            quality,
        )
    window = closed[-fetch_bars:]
    if any(
        current.timestamp - previous.timestamp != interval
        for previous, current in zip(window, window[1:])
    ):
        return (
            service.record_data_blocked("完整 K 线时间不连续，已跳过本轮决策。"),
            quality,
        )
    return service.evaluate(window, data_source=quality.source), quality


def _fetch_recent_market_window(
    *,
    cache: MarketDataCache,
    adapter: object,
    request: MarketDataRequest,
    limit: int,
) -> tuple[list[OHLCVBar], DataQuality]:
    target = max(1, int(limit))
    first, first_quality = _fetch_market_klines_with_cache(
        cache=cache,
        adapter=adapter,
        request=request,
        limit=min(target, 500),
    )
    if target <= 500 or not first:
        return first, first_quality

    interval = timedelta(minutes=1)
    combined = {bar.timestamp: bar for bar in first}
    origin = first_quality.origin_source or first_quality.source
    cached = cache.read_bars(
        request.market,
        request.symbol,
        request.timeframe,
        end=max(combined),
    )
    if cached:
        cached_window = cached[-target:]
        provenance = cache.read_provenance(
            request.market,
            request.symbol,
            request.timeframe,
            start=cached_window[0].timestamp,
            end=cached_window[-1].timestamp,
        )
        if (
            len(cached_window) >= target
            and _minute_contiguous(cached_window)
            and provenance is not None
            and provenance["source"] == origin
        ):
            chunks = [cached_window[index : index + 500] for index in range(0, len(cached_window), 500)]
            qualities = [
                DataQuality(
                    source=origin,
                    origin_source=origin,
                    is_complete=True,
                    rows=len(chunk),
                    adjustment_mode=provenance["adjustmentMode"],
                )
                for chunk in chunks
            ]
            return cached_window, _assess_recent_window(
                request,
                chunks,
                qualities,
                target=target,
            )

    pages = [first]
    qualities = [first_quality]
    seen = {bar.timestamp for bar in first}
    duplicate_timestamp = len(seen) != len(first)
    while len(combined) < target:
        earliest = min(combined)
        page_request = replace(request, end=earliest - interval)
        page, page_quality = _fetch_market_klines_with_cache(
            cache=cache,
            adapter=adapter,
            request=page_request,
            limit=min(500, target - len(combined)),
            require_cache_provenance=True,
        )
        page_origin = page_quality.origin_source or page_quality.source
        if (
            not page
            or not page_quality.is_complete
            or page_origin != origin
            or min(bar.timestamp for bar in page) >= earliest
        ):
            qualities.append(page_quality)
            break
        qualities.append(page_quality)
        page_timestamps = [bar.timestamp for bar in page]
        if len(set(page_timestamps)) != len(page_timestamps) or any(
            timestamp in seen for timestamp in page_timestamps
        ):
            duplicate_timestamp = True
            break
        pages.append(page)
        seen.update(page_timestamps)
        before = len(combined)
        combined.update({bar.timestamp: bar for bar in page})
        if len(combined) == before:
            break

    ordered = sorted(combined.values(), key=lambda bar: bar.timestamp)[-target:]
    chronological = sorted(
        zip(pages, qualities[: len(pages)]),
        key=lambda item: min(bar.timestamp for bar in item[0]),
    )
    assessed = _assess_recent_window(
        request,
        [page for page, _quality in chronological],
        [quality for _page, quality in chronological],
        target=target,
    )
    if duplicate_timestamp:
        assessed = replace(
            assessed,
            is_complete=False,
            warnings=[*assessed.warnings, "paginated market history contains duplicate timestamps"],
            issues=[
                *assessed.issues,
                {
                    "code": "duplicate_timestamp",
                    "severity": "blocked",
                    "count": 1,
                    "message": "Paginated market history contains duplicate timestamps.",
                },
            ],
        )
    return ordered, assessed


def _assess_recent_window(
    request: MarketDataRequest,
    chunks: list[list[OHLCVBar]],
    qualities: list[DataQuality],
    *,
    target: int,
) -> DataQuality:
    ordered = sorted(
        (bar for chunk in chunks for bar in chunk),
        key=lambda bar: bar.timestamp,
    )
    if not ordered:
        return DataQuality(
            source="unknown",
            is_complete=False,
            warnings=["paginated market history is empty"],
            rows=0,
        )
    interval = timedelta(minutes=1)
    assessed = assess_chunked_market_data_quality(
        replace(
            request,
            start=ordered[0].timestamp,
            end=ordered[-1].timestamp + interval,
        ),
        chunks,
        qualities,
        observed_at=datetime.now(timezone.utc),
    )
    complete = assessed.is_complete and len(ordered) >= target and _minute_contiguous(ordered)
    if complete:
        return assessed
    return replace(
        assessed,
        is_complete=False,
        warnings=list(
            dict.fromkeys(
                [*assessed.warnings, "paginated market history is incomplete or discontinuous"]
            )
        ),
    )


def _minute_contiguous(bars: list[OHLCVBar]) -> bool:
    return all(
        current.timestamp - previous.timestamp == timedelta(minutes=1)
        for previous, current in zip(bars, bars[1:])
    )


def _stage1_daily_use_project_root(report_path: Path) -> Path:
    resolved = report_path.resolve()
    if resolved.parent.name == "data":
        return resolved.parent.parent
    return Path.cwd()
