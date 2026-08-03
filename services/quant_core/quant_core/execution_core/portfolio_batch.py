from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _enum_value,
    _non_negative_number,
    _parse_payload_datetime,
    _sorted_counts,
)
from .contracts import (
    PortfolioPaperOrderApproval,
    PortfolioPaperOrderBatch,
)

__all__ = [
    '_normalize_portfolio_paper_order',
    '_portfolio_paper_order_summary',
    'create_portfolio_paper_order_approval',
    'create_portfolio_paper_order_batch',
    'portfolio_paper_order_approval_to_payload',
    'portfolio_paper_order_approvals_to_map',
    'portfolio_paper_order_batch_to_payload',
    'portfolio_paper_order_payload_to_approval',
    'portfolio_paper_order_payload_to_batch',
]

def create_portfolio_paper_order_batch(
    *,
    base_run_id: str,
    portfolio_name: str,
    orders: list[dict[str, Any]],
    source: str = "portfolio_backtest",
    created_at: datetime | None = None,
    batch_id: str | None = None,
) -> PortfolioPaperOrderBatch:
    normalized_base_run_id = str(base_run_id or "").strip()
    normalized_portfolio_name = str(portfolio_name or "").strip()
    normalized_source = str(source or "portfolio_backtest").strip() or "portfolio_backtest"
    if not normalized_base_run_id:
        raise ValueError("portfolio_paper_order_base_run_id_required")
    if not normalized_portfolio_name:
        raise ValueError("portfolio_paper_order_portfolio_name_required")
    if not isinstance(orders, list) or not orders:
        raise ValueError("portfolio_paper_order_orders_required")
    normalized_orders = [_normalize_portfolio_paper_order(order) for order in orders]
    return PortfolioPaperOrderBatch(
        batch_id=str(batch_id or f"portfolio-paper-batch-{uuid4().hex[:12]}"),
        base_run_id=normalized_base_run_id,
        portfolio_name=normalized_portfolio_name,
        created_at=created_at or datetime.now(timezone.utc),
        mode="portfolio_paper_order_review",
        source=normalized_source,
        orders=normalized_orders,
        summary=_portfolio_paper_order_summary(normalized_orders),
    )


def portfolio_paper_order_batch_to_payload(batch: PortfolioPaperOrderBatch) -> dict[str, Any]:
    return {
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "portfolioName": batch.portfolio_name,
        "createdAt": batch.created_at.isoformat(),
        "mode": batch.mode,
        "source": batch.source,
        "summary": dict(batch.summary),
        "orders": [dict(order) for order in batch.orders],
    }


def create_portfolio_paper_order_approval(
    *,
    base_run_id: str,
    batch_id: str,
    order_id: str,
    approved: bool,
    reviewer: str,
    reason: str,
    reviewed_at: datetime | str | None = None,
) -> PortfolioPaperOrderApproval:
    normalized_base_run_id = str(base_run_id or "").strip()
    normalized_batch_id = str(batch_id or "").strip()
    normalized_order_id = str(order_id or "").strip()
    normalized_reviewer = str(reviewer or "").strip()
    normalized_reason = str(reason or "").strip()
    if not normalized_base_run_id:
        raise ValueError("portfolio_paper_order_approval_base_run_id_required")
    if not normalized_batch_id:
        raise ValueError("portfolio_paper_order_approval_batch_id_required")
    if not normalized_order_id:
        raise ValueError("portfolio_paper_order_approval_order_id_required")
    if not normalized_reviewer:
        raise ValueError("portfolio_paper_order_approval_reviewer_required")
    if not normalized_reason:
        raise ValueError("portfolio_paper_order_approval_reason_required")
    reviewed = (
        _parse_payload_datetime(reviewed_at, "portfolio_paper_order_approval_reviewed_at_invalid")
        if reviewed_at is not None
        else datetime.now(timezone.utc)
    )
    return PortfolioPaperOrderApproval(
        approval_id=f"portfolio-paper-order-approval-{normalized_batch_id}-{normalized_order_id}",
        base_run_id=normalized_base_run_id,
        batch_id=normalized_batch_id,
        order_id=normalized_order_id,
        reviewed_at=reviewed,
        approved=bool(approved),
        reviewer=normalized_reviewer,
        reason=normalized_reason,
    )


def portfolio_paper_order_approval_to_payload(approval: PortfolioPaperOrderApproval) -> dict[str, Any]:
    return {
        "approvalId": approval.approval_id,
        "baseRunId": approval.base_run_id,
        "batchId": approval.batch_id,
        "orderId": approval.order_id,
        "reviewedAt": approval.reviewed_at.isoformat(),
        "approved": approval.approved,
        "reviewer": approval.reviewer,
        "reason": approval.reason,
    }


def portfolio_paper_order_payload_to_approval(payload: dict[str, Any]) -> PortfolioPaperOrderApproval:
    return PortfolioPaperOrderApproval(
        approval_id=str(payload.get("approvalId") or ""),
        base_run_id=str(payload.get("baseRunId") or ""),
        batch_id=str(payload.get("batchId") or ""),
        order_id=str(payload.get("orderId") or ""),
        reviewed_at=_parse_payload_datetime(payload.get("reviewedAt"), "portfolio_paper_order_approval_reviewed_at_invalid"),
        approved=bool(payload.get("approved")),
        reviewer=str(payload.get("reviewer") or ""),
        reason=str(payload.get("reason") or ""),
    )


def portfolio_paper_order_approvals_to_map(
    approvals: list[PortfolioPaperOrderApproval],
) -> dict[str, dict[str, Any]]:
    return {approval.order_id: portfolio_paper_order_approval_to_payload(approval) for approval in approvals}


def portfolio_paper_order_payload_to_batch(payload: dict[str, Any]) -> PortfolioPaperOrderBatch:
    if not isinstance(payload, dict):
        raise ValueError("portfolio_paper_order_batch_must_be_object")
    batch_id = str(payload.get("batchId") or "").strip()
    if not batch_id:
        raise ValueError("portfolio_paper_order_batch_id_required")
    if str(payload.get("mode") or "").strip() != "portfolio_paper_order_review":
        raise ValueError("portfolio_paper_order_batch_mode_invalid")
    raw_orders = payload.get("orders")
    if not isinstance(raw_orders, list):
        raise ValueError("portfolio_paper_order_orders_required")
    created_at = _parse_payload_datetime(payload.get("createdAt"), "portfolio_paper_order_batch_created_at_invalid")
    return create_portfolio_paper_order_batch(
        base_run_id=str(payload.get("baseRunId") or ""),
        portfolio_name=str(payload.get("portfolioName") or ""),
        source=str(payload.get("source") or "portfolio_backtest"),
        created_at=created_at,
        batch_id=batch_id,
        orders=raw_orders,
    )


def _normalize_portfolio_paper_order(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("portfolio_paper_order_must_be_object")
    event_type = str(payload.get("eventType") or "").strip()
    if event_type != "portfolio_paper_order":
        raise ValueError("portfolio_paper_order_event_type_invalid")
    order_id = str(payload.get("orderId") or "").strip()
    symbol = str(payload.get("symbol") or "").strip()
    if not order_id:
        raise ValueError("portfolio_paper_order_id_required")
    if not symbol:
        raise ValueError("portfolio_paper_order_symbol_required")
    side = _enum_value(payload.get("side"), {"buy", "sell", "hold"}, "portfolio_paper_order_side_invalid")
    status = _enum_value(
        payload.get("status"),
        {"pending_review", "rejected", "skipped"},
        "portfolio_paper_order_status_invalid",
    )
    risk_status = _enum_value(
        payload.get("riskStatus"),
        {"passed", "review", "blocked"},
        "portfolio_paper_order_risk_status_invalid",
    )
    timestamp = _parse_payload_datetime(payload.get("timestamp"), "portfolio_paper_order_timestamp_invalid")
    notional_value = _non_negative_number(payload.get("notionalValue"), "portfolio_paper_order_notional_invalid")
    quantity = _non_negative_number(payload.get("quantity"), "portfolio_paper_order_quantity_invalid")
    raw_source_run_id = payload.get("sourceRunId")
    source_run_id = str(raw_source_run_id).strip() if raw_source_run_id is not None else None
    return {
        "timestamp": timestamp.isoformat(),
        "eventType": event_type,
        "orderId": order_id,
        "symbol": symbol,
        "sourceRunId": source_run_id or None,
        "side": side,
        "notionalValue": notional_value,
        "quantity": quantity,
        "status": status,
        "riskStatus": risk_status,
        "reason": str(payload.get("reason") or "").strip(),
    }


def _portfolio_paper_order_summary(orders: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "totalOrders": len(orders),
        "totalNotionalValue": round(sum(float(order.get("notionalValue", 0)) for order in orders), 4),
        "statusCounts": _sorted_counts(str(order.get("status")) for order in orders),
        "riskStatusCounts": _sorted_counts(str(order.get("riskStatus")) for order in orders),
    }
