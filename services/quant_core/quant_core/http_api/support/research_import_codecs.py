from __future__ import annotations

import json
from datetime import (
    datetime,
    timezone,
)
from quant_core.ai_review_runs import AiReviewRunRecord
from quant_core.backtest import BacktestEngine
from quant_core.execution import (
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderStore,
)
from quant_core.research_notes import ResearchNote
from quant_core.runs import ResearchRunAudit
from quant_core.strategy_library import StrategyLibraryRecord

def _research_run_audit_from_payload(payload: dict[str, object]) -> ResearchRunAudit:
    created_at = _parse_iso_datetime(str(payload.get("createdAt") or ""))
    return ResearchRunAudit(
        run_id=str(payload.get("runId") or ""),
        created_at=created_at,
        market=str(payload.get("market") or ""),
        symbol=str(payload.get("symbol") or ""),
        timeframe=str(payload.get("timeframe") or ""),
        strategy_name=str(payload.get("strategyName") or ""),
        strategy_revision=str(payload.get("strategyRevision") or ""),
        data_rows=int(_number_or_default(payload.get("dataRows"), 0)),
        metrics=dict(payload.get("metrics")) if isinstance(payload.get("metrics"), dict) else {},
        decisions=list(payload.get("decisions")) if isinstance(payload.get("decisions"), list) else [],
        execution_mode=str(payload.get("executionMode") or "paper_only"),
        ai_report=dict(payload.get("aiReport")) if isinstance(payload.get("aiReport"), dict) else {},
        data_quality=dict(payload.get("dataQuality")) if isinstance(payload.get("dataQuality"), dict) else {},
        data_snapshot=dict(payload.get("dataSnapshot")) if isinstance(payload.get("dataSnapshot"), dict) else {},
        strategy_config=dict(payload.get("strategyConfig")) if isinstance(payload.get("strategyConfig"), dict) else None,
        backtest_assumptions=dict(payload.get("backtestAssumptions"))
        if isinstance(payload.get("backtestAssumptions"), dict)
        else {},
        backtest_trades=list(payload.get("backtestTrades")) if isinstance(payload.get("backtestTrades"), list) else [],
        backtest_equity_curve=list(payload.get("backtestEquityCurve"))
        if isinstance(payload.get("backtestEquityCurve"), list)
        else [],
        backtest_diagnostics=list(payload.get("backtestDiagnostics"))
        if isinstance(payload.get("backtestDiagnostics"), list)
        else [],
        research_note=dict(payload.get("researchNote")) if isinstance(payload.get("researchNote"), dict) else {},
    )


def _research_note_from_payload(payload: dict[str, object]) -> ResearchNote:
    updated_at = payload.get("updatedAt")
    return ResearchNote(
        market=str(payload.get("market") or ""),
        symbol=str(payload.get("symbol") or ""),
        timeframe=str(payload.get("timeframe") or ""),
        body=str(payload.get("body") or ""),
        updated_at=_parse_iso_datetime(str(updated_at)) if updated_at else None,
    )


def _strategy_record_from_payload(payload: dict[str, object]) -> StrategyLibraryRecord:
    strategy_config = payload.get("strategyConfig")
    return StrategyLibraryRecord(
        strategy_id=str(payload.get("strategyId") or f"strategy-{payload.get('revision') or ''}"),
        created_at=_parse_iso_datetime(str(payload.get("createdAt") or "")),
        name=str(payload.get("name") or ""),
        revision=str(payload.get("revision") or ""),
        market=str(payload.get("market") or ""),
        symbol=str(payload.get("symbol") or ""),
        timeframe=str(payload.get("timeframe") or ""),
        version=int(_number_or_default(payload.get("version"), 1)),
        status=str(payload.get("status") or "draft"),
        audit_run_id=str(payload.get("auditRunId") or "").strip() or None,
        strategy_config=dict(strategy_config) if isinstance(strategy_config, dict) else {},
    )


def _ai_review_run_from_payload(payload: dict[str, object]) -> AiReviewRunRecord:
    record = payload.get("record")
    return AiReviewRunRecord(
        ai_review_id=str(payload.get("aiReviewId") or ""),
        run_id=str(payload.get("runId") or ""),
        created_at=_parse_iso_datetime(str(payload.get("createdAt") or "")),
        record=dict(record) if isinstance(record, dict) else {},
    )


def _parse_iso_datetime(value: str) -> datetime:
    if not value:
        raise ValueError("datetime_required")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _number_or_default(value: object, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _importable_research_note_payload(
    value: object,
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, object] | None:
    if not isinstance(value, dict):
        return None
    body = str(value.get("body") or "").strip()
    if not body:
        return None
    return {
        "market": str(value.get("market") or market or "").strip(),
        "symbol": str(value.get("symbol") or symbol or "").strip(),
        "timeframe": str(value.get("timeframe") or timeframe or "").strip(),
        "body": body,
        "updated_at": _parse_optional_datetime(value.get("updatedAt", value.get("updated_at"))),
    }


def _parse_optional_datetime(value: object) -> datetime | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    normalized = text[:-1] + "+00:00" if text.endswith("Z") else text
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _optional_audit_event_id(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _find_portfolio_paper_order_batch(
    store: PortfolioPaperOrderStore,
    base_run_id: str,
    batch_id: str,
) -> PortfolioPaperOrderBatch:
    for batch in store.list_all_by_base_run(base_run_id):
        if batch.batch_id == batch_id:
            return batch
    raise LookupError(batch_id)


def _find_duplicate_portfolio_paper_order_batch(
    store: PortfolioPaperOrderStore,
    candidate: PortfolioPaperOrderBatch,
) -> PortfolioPaperOrderBatch | None:
    candidate_signature = _portfolio_paper_order_batch_signature(candidate)
    for batch in store.list_all_by_base_run(candidate.base_run_id):
        if _portfolio_paper_order_batch_signature(batch) == candidate_signature:
            return batch
    return None


def _portfolio_paper_order_batch_signature(batch: PortfolioPaperOrderBatch) -> tuple[str, str, str]:
    orders_signature = json.dumps(batch.orders, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return (batch.portfolio_name, batch.source, orders_signature)


def _find_portfolio_paper_order_lifecycle_row(
    lifecycle: list[dict[str, object]],
    order_id: str,
) -> dict[str, object]:
    for row in lifecycle:
        if str(row.get("orderId") or "") == order_id:
            return row
    raise ValueError("portfolio_paper_order_approval_lifecycle_row_not_found")


def _portfolio_paper_order_adapter_evidence_by_order_id(payload: dict[str, object]) -> dict[str, dict[str, object]]:
    raw = payload.get("adapterPaperExecutionEvidenceByOrderId")
    if not isinstance(raw, dict):
        return {}
    normalized: dict[str, dict[str, object]] = {}
    for order_id, evidence in raw.items():
        normalized_order_id = str(order_id).strip()
        if normalized_order_id and isinstance(evidence, dict):
            normalized[normalized_order_id] = evidence
    return normalized


def _parse_kline_end(raw: str) -> datetime | None:
    value = raw.strip()
    if not value:
        return None
    try:
        timestamp = float(value)
        if timestamp > 10**12:
            timestamp /= 1000
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)
    except (ValueError, OverflowError, OSError):
        pass
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as error:
        raise ValueError("invalid_kline_end") from error
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _parse_search_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 8
    return max(1, min(value, 20))


def _backtest_engine_from_query(query: dict[str, list[str]]) -> BacktestEngine:
    initial_cash = _parse_positive_float(query.get("initialCash", ["100000"])[0], default=100_000)
    fee_bps = _parse_bps(query.get("feeBps", ["3"])[0], default=3)
    slippage_bps = _parse_bps(query.get("slippageBps", ["2"])[0], default=2)
    return BacktestEngine(initial_cash=initial_cash, fee_rate=fee_bps / 10_000, slippage_rate=slippage_bps / 10_000)


def _parse_positive_float(raw: str, *, default: float) -> float:
    try:
        value = float(raw)
    except ValueError:
        return default
    return value if value > 0 else default


def _parse_bps(raw: str, *, default: float) -> float:
    try:
        value = float(raw)
    except ValueError:
        return default
    if value < 0:
        return default
    return min(value, 1_000)
