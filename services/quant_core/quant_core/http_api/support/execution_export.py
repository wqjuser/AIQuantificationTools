from __future__ import annotations

from quant_core.audit_events import AuditEventStore
from quant_core.cache import MarketDataCache
from quant_core.data_foundation import assess_market_data_quality
from quant_core.domain import (
    DataQuality,
    MarketDataRequest,
    OHLCVBar,
)
from quant_core.execution import execution_adapter_paper_execution_payload_from_audit_event

def _adapter_paper_executions_for_export(
    audit_event_store: AuditEventStore,
    *,
    market: str,
    limit: int = 20,
) -> list[dict[str, object]]:
    expected_market = str(market or "").strip()
    events = audit_event_store.list_recent(event_type="execution_adapter_paper_execution", limit=max(1, limit * 3))
    executions: list[dict[str, object]] = []
    for event in events:
        payload = execution_adapter_paper_execution_payload_from_audit_event(event)
        if not payload:
            continue
        payload_market = str(payload.get("market") or "").strip()
        if expected_market and payload_market not in {expected_market, "multi"}:
            continue
        executions.append(payload)
        if len(executions) >= limit:
            break
    return executions


def _existing_adapter_paper_execution_for_ops_state(
    audit_event_store: AuditEventStore,
    *,
    adapter_id: str,
    adapter_ops_state_id: str,
) -> dict[str, object] | None:
    expected_adapter_id = str(adapter_id or "").strip()
    expected_ops_state_id = str(adapter_ops_state_id or "").strip()
    if not expected_adapter_id or not expected_ops_state_id:
        return None
    events = audit_event_store.list_recent(
        event_type="execution_adapter_paper_execution",
        limit=50,
        query=expected_ops_state_id,
    )
    for event in events:
        payload = execution_adapter_paper_execution_payload_from_audit_event(event)
        if not payload:
            continue
        if (
            payload.get("adapterId") == expected_adapter_id
            and payload.get("adapterOpsStateId") == expected_ops_state_id
            and payload.get("status") == "paper_execution_recorded"
        ):
            return payload
    return None


def _fetch_market_klines_with_cache(
    *,
    cache: MarketDataCache,
    adapter: object,
    request: MarketDataRequest,
    limit: int,
    require_cache_provenance: bool = False,
) -> tuple[list[OHLCVBar], DataQuality]:
    bounded_limit = max(1, min(int(limit or 160), 500))
    upstream_error: str | None = None
    try:
        bars, quality = adapter.fetch_ohlcv(request, limit=bounded_limit)  # type: ignore[attr-defined]
        quality = assess_market_data_quality(request, bars, quality)
    except Exception as error:
        bars = []
        quality = None
        upstream_error = str(error)

    if quality and quality.is_complete:
        cache.upsert_bars(
            bars,
            source=quality.origin_source or quality.source,
            adjustment_mode=quality.adjustment_mode,
            snapshot_id=quality.canonical_hash,
        )
        return bars, quality

    cached_bars = cache.read_bars(
        request.market,
        request.symbol,
        request.timeframe,
        end=request.end,
    )[-bounded_limit:]
    if cached_bars:
        provenance = cache.read_provenance(
            request.market,
            request.symbol,
            request.timeframe,
            start=cached_bars[0].timestamp,
            end=cached_bars[-1].timestamp,
        )
        warnings = _cache_fallback_warnings(quality, upstream_error)
        if provenance is None:
            warnings.append("Persistent cache provenance is unavailable or mixed.")
        return cached_bars, assess_market_data_quality(
            request,
            cached_bars,
            DataQuality(
                source="local-cache",
                origin_source=provenance["source"] if provenance else None,
                is_complete=provenance is not None or not require_cache_provenance,
                warnings=warnings,
                rows=len(cached_bars),
                adjustment_mode=(
                    provenance["adjustmentMode"] if provenance else "none"
                ),
            ),
        )

    if quality is not None:
        return bars, quality

    raise ValueError(upstream_error or "market kline adapter unavailable")


def _cache_fallback_warnings(quality: DataQuality | None, upstream_error: str | None) -> list[str]:
    if upstream_error:
        return [f"served local cache after upstream error: {upstream_error}"]
    if quality is None:
        return ["served local cache because upstream quality was unavailable"]
    reason = f"served local cache instead of incomplete {quality.source}"
    return [reason, *quality.warnings]
