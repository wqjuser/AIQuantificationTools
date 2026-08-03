from __future__ import annotations

from typing import Any
from .common import (
    _sorted_counts,
)
from .contracts import (
    PortfolioPaperOrderApproval,
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderSimulation,
)
from .portfolio_replay import (
    build_portfolio_paper_order_lifecycle,
)

__all__ = [
    'portfolio_paper_order_approval_to_audit_event_payload',
    'portfolio_paper_order_batch_to_audit_event_payload',
    'portfolio_paper_order_simulation_to_audit_event_payload',
]

def portfolio_paper_order_batch_to_audit_event_payload(batch: PortfolioPaperOrderBatch) -> dict[str, Any]:
    lifecycle = build_portfolio_paper_order_lifecycle(batch)
    lifecycle_state_counts = _sorted_counts(str(row.get("state") or "") for row in lifecycle)
    return {
        "schemaVersion": 1,
        "eventId": f"portfolio-paper-order-batch-{batch.batch_id}",
        "eventType": "portfolio_paper_order_batch",
        "runId": batch.base_run_id,
        "createdAt": batch.created_at.isoformat(),
        "stage": "portfolio-paper-order-review",
        "source": batch.source,
        "summary": f"{batch.portfolio_name} recorded {batch.summary['totalOrders']} portfolio paper order candidates.",
        "detail": "Portfolio paper order batch is paper-only and requires operator review before any simulated routing.",
        "metadata": {
            "batchId": batch.batch_id,
            "baseRunId": batch.base_run_id,
            "portfolioName": batch.portfolio_name,
            "mode": batch.mode,
            "source": batch.source,
            "totalOrders": batch.summary["totalOrders"],
            "totalNotionalValue": batch.summary["totalNotionalValue"],
            "statusCounts": dict(batch.summary["statusCounts"]),
            "riskStatusCounts": dict(batch.summary["riskStatusCounts"]),
            "lifecycleStateCounts": lifecycle_state_counts,
            "routableOrders": sum(1 for row in lifecycle if bool(row.get("routable"))),
            "orderIds": [str(order.get("orderId") or "") for order in batch.orders],
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
    }


def portfolio_paper_order_approval_to_audit_event_payload(
    approval: PortfolioPaperOrderApproval,
    *,
    batch: PortfolioPaperOrderBatch,
    lifecycle_row: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": approval.approval_id,
        "eventType": "portfolio_paper_order_approval",
        "runId": approval.base_run_id,
        "createdAt": approval.reviewed_at.isoformat(),
        "stage": "portfolio-paper-order-approval",
        "source": "operator-review",
        "summary": f"{approval.reviewer} {'approved' if approval.approved else 'rejected'} {approval.order_id} for paper-only review.",
        "detail": lifecycle_row.get("reason") or approval.reason,
        "metadata": {
            "approvalId": approval.approval_id,
            "baseRunId": approval.base_run_id,
            "batchId": approval.batch_id,
            "portfolioName": batch.portfolio_name,
            "orderId": approval.order_id,
            "approved": approval.approved,
            "reviewer": approval.reviewer,
            "approvalState": lifecycle_row.get("state"),
            "routable": bool(lifecycle_row.get("routable")),
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
    }


def portfolio_paper_order_simulation_to_audit_event_payload(
    simulation: PortfolioPaperOrderSimulation,
    *,
    batch: PortfolioPaperOrderBatch,
    lifecycle_row: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": simulation.simulation_id,
        "eventType": "portfolio_paper_order_simulation",
        "runId": simulation.base_run_id,
        "createdAt": simulation.simulated_at.isoformat(),
        "stage": "portfolio-paper-order-simulation",
        "source": "paper-simulator",
        "summary": f"Paper simulation filled {simulation.order_id} for {batch.portfolio_name}.",
        "detail": simulation.reason,
        "metadata": {
            "simulationId": simulation.simulation_id,
            "baseRunId": simulation.base_run_id,
            "batchId": simulation.batch_id,
            "portfolioName": batch.portfolio_name,
            "orderId": simulation.order_id,
            "symbol": simulation.symbol,
            "side": simulation.side,
            "quantity": simulation.quantity,
            "fillPrice": simulation.fill_price,
            "notionalValue": simulation.notional_value,
            "orderState": simulation.order_state,
            "fillStatus": simulation.fill_status,
            "approvalState": lifecycle_row.get("state"),
            "approvedBy": simulation.approved_by,
            "routeRiskStatus": simulation.route_risk.get("status"),
            "routeRiskBlockedReasons": simulation.route_risk.get("blockedReasons", []),
            "routeRisk": simulation.route_risk,
            "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
            "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
            "adapterPaperExecutionEvidence": simulation.adapter_paper_execution_evidence,
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
    }
