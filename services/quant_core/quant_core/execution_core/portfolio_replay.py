from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from .common import (
    _redact_secret_fields,
    _round_number,
    _sorted_counts,
)
from .contracts import (
    PortfolioPaperOrderApproval,
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderSimulation,
)
from .paper_execution import (
    _positive_number,
)
from .portfolio_batch import (
    portfolio_paper_order_approvals_to_map,
)

__all__ = [
    '_portfolio_paper_order_lifecycle_row',
    '_portfolio_paper_order_state_event',
    '_portfolio_paper_order_state_label',
    'build_portfolio_paper_order_lifecycle',
    'build_portfolio_paper_order_replay',
    'build_portfolio_paper_order_state_history',
]

def build_portfolio_paper_order_replay(
    simulations: list[PortfolioPaperOrderSimulation],
    *,
    base_run_id: str,
    initial_cash: float = 100_000,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    normalized_base_run_id = str(base_run_id or "").strip()
    if not normalized_base_run_id:
        raise ValueError("portfolio_paper_order_replay_base_run_id_required")
    cash = _positive_number(initial_cash, 100_000)
    starting_cash = cash
    positions: dict[str, float] = {}
    avg_costs: dict[str, float] = {}
    last_prices: dict[str, float] = {}
    orders: list[dict[str, Any]] = []
    warnings: list[str] = []
    buy_notional = 0.0
    sell_notional = 0.0
    realized_pnl = 0.0
    replay_simulations = sorted(
        [simulation for simulation in simulations if simulation.base_run_id == normalized_base_run_id],
        key=lambda simulation: (simulation.simulated_at, simulation.batch_id),
    )

    for simulation in replay_simulations:
        symbol = simulation.symbol
        quantity = _positive_number(simulation.quantity, 0)
        fill_price = _positive_number(simulation.fill_price, 0)
        notional_value = _positive_number(simulation.notional_value, quantity * fill_price)
        replay_state = "applied"
        if simulation.fill_status != "filled" or simulation.order_state != "filled" or quantity <= 0 or fill_price <= 0:
            replay_state = "ignored"
            warnings.append(f"{simulation.order_id}:ignored_non_filled_simulation")
        elif simulation.side == "buy":
            previous_quantity = positions.get(symbol, 0.0)
            previous_cost = avg_costs.get(symbol, fill_price)
            new_quantity = previous_quantity + quantity
            avg_costs[symbol] = (
                ((previous_quantity * previous_cost) + notional_value) / new_quantity if new_quantity else fill_price
            )
            positions[symbol] = new_quantity
            cash -= notional_value
            buy_notional += notional_value
        elif simulation.side == "sell":
            previous_quantity = positions.get(symbol, 0.0)
            previous_cost = avg_costs.get(symbol, fill_price)
            if quantity > previous_quantity:
                warnings.append(f"{simulation.order_id}:sell_exceeds_replayed_position")
            realized_quantity = min(quantity, max(previous_quantity, 0.0))
            realized_pnl += (fill_price - previous_cost) * realized_quantity
            new_quantity = previous_quantity - quantity
            positions[symbol] = new_quantity
            if new_quantity <= 0:
                avg_costs.pop(symbol, None)
            cash += notional_value
            sell_notional += notional_value
        else:
            replay_state = "ignored"
            warnings.append(f"{simulation.order_id}:unsupported_side")
        if symbol:
            last_prices[symbol] = fill_price
        orders.append(
            {
                "simulationId": simulation.simulation_id,
                "batchId": simulation.batch_id,
                "orderId": simulation.order_id,
                "simulatedAt": simulation.simulated_at.isoformat(),
                "symbol": symbol,
                "side": simulation.side,
                "quantity": _round_number(quantity),
                "fillPrice": _round_number(fill_price),
                "notionalValue": _round_number(notional_value),
                "cashAfter": _round_number(cash),
                "positionAfter": _round_number(positions.get(symbol, 0.0)),
                "replayState": replay_state,
                "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
                "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
                "adapterPaperExecutionEvidence": _redact_secret_fields(simulation.adapter_paper_execution_evidence),
                "paperOnly": True,
                "liveExecutionBlocked": True,
            }
        )

    position_rows = []
    account_positions: dict[str, float] = {}
    for symbol in sorted(positions):
        quantity = positions[symbol]
        if abs(quantity) < 1e-9:
            continue
        last_price = last_prices.get(symbol, avg_costs.get(symbol, 0.0))
        avg_cost = avg_costs.get(symbol, last_price)
        market_value = quantity * last_price
        unrealized_pnl = (last_price - avg_cost) * quantity
        account_positions[symbol] = _round_number(quantity)
        position_rows.append(
            {
                "symbol": symbol,
                "quantity": _round_number(quantity),
                "avgCost": _round_number(avg_cost),
                "lastPrice": _round_number(last_price),
                "marketValue": _round_number(market_value),
                "unrealizedPnl": _round_number(unrealized_pnl),
            }
        )
    equity = cash + sum(row["marketValue"] for row in position_rows)
    return {
        "schemaVersion": 1,
        "baseRunId": normalized_base_run_id,
        "generatedAt": (generated_at or datetime.now(timezone.utc)).isoformat(),
        "mode": "portfolio_paper_order_replay",
        "initialCash": _round_number(starting_cash),
        "account": {
            "cash": _round_number(cash),
            "positions": account_positions,
            "equity": _round_number(equity),
        },
        "positions": position_rows,
        "orders": orders,
        "summary": {
            "filledOrders": sum(1 for order in orders if order["replayState"] == "applied"),
            "buyNotional": _round_number(buy_notional),
            "sellNotional": _round_number(sell_notional),
            "netNotional": _round_number(buy_notional - sell_notional),
            "realizedPnl": _round_number(realized_pnl),
            "unrealizedPnl": _round_number(sum(row["unrealizedPnl"] for row in position_rows)),
            "positionCount": len(position_rows),
            "warnings": warnings,
        },
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def build_portfolio_paper_order_state_history(
    batch: PortfolioPaperOrderBatch,
    *,
    approvals: list[PortfolioPaperOrderApproval] | None = None,
    simulations: list[PortfolioPaperOrderSimulation] | None = None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    filtered_approvals = [
        approval
        for approval in approvals or []
        if approval.base_run_id == batch.base_run_id and approval.batch_id == batch.batch_id
    ]
    filtered_simulations = [
        simulation
        for simulation in simulations or []
        if simulation.base_run_id == batch.base_run_id and simulation.batch_id == batch.batch_id
    ]
    approval_map = {approval.order_id: approval for approval in sorted(filtered_approvals, key=lambda item: item.reviewed_at)}
    simulation_map = {
        simulation.order_id: simulation
        for simulation in sorted(filtered_simulations, key=lambda item: (item.simulated_at, item.simulation_id))
    }
    lifecycle_rows = build_portfolio_paper_order_lifecycle(
        batch,
        approvals=portfolio_paper_order_approvals_to_map(filtered_approvals),
    )
    lifecycle_map = {str(row.get("orderId") or ""): row for row in lifecycle_rows}

    order_histories: list[dict[str, Any]] = []
    state_counts: list[str] = []
    approved_orders = 0
    rejected_orders = 0
    filled_orders = 0
    live_blocked_events = 0
    total_events = 0

    for order in batch.orders:
        order_id = str(order.get("orderId") or "")
        lifecycle_row = lifecycle_map.get(order_id, {})
        approval = approval_map.get(order_id)
        simulation = simulation_map.get(order_id)
        events = [
            _portfolio_paper_order_state_event(
                batch=batch,
                order_id=order_id,
                state="created",
                timestamp=str(order.get("timestamp") or batch.created_at.isoformat()),
                label="Paper order created",
                actor=batch.source,
                source=batch.source,
                reason=str(order.get("reason") or "Portfolio paper order candidate was generated."),
                sequence=1,
            )
        ]
        lifecycle_state = str(lifecycle_row.get("state") or "unknown")

        if lifecycle_state in {"risk_rejected", "risk_review", "invalid_order", "skipped"}:
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state=lifecycle_state,
                    timestamp=str(order.get("timestamp") or batch.created_at.isoformat()),
                    label=_portfolio_paper_order_state_label(lifecycle_state),
                    actor="risk" if lifecycle_state in {"risk_rejected", "risk_review"} else "portfolio-engine",
                    source="portfolio-order-lifecycle",
                    reason=str(lifecycle_row.get("reason") or order.get("reason") or ""),
                    sequence=2,
                )
            )

        if approval is not None:
            approved_orders += 1 if approval.approved else 0
            rejected_orders += 0 if approval.approved else 1
            approval_state = "operator_approved" if approval.approved else "operator_rejected"
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state=approval_state,
                    timestamp=approval.reviewed_at.isoformat(),
                    label=_portfolio_paper_order_state_label(approval_state),
                    actor=approval.reviewer,
                    source="operator-review",
                    reason=approval.reason,
                    sequence=3,
                )
            )

        if simulation is not None:
            filled_orders += 1 if simulation.fill_status == "filled" and simulation.order_state == "filled" else 0
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state="simulation_filled" if simulation.fill_status == "filled" else "simulation_recorded",
                    timestamp=simulation.simulated_at.isoformat(),
                    label=_portfolio_paper_order_state_label("simulation_filled"),
                    actor=simulation.approved_by or "paper-simulator",
                    source="paper-simulator",
                    reason=simulation.reason,
                    sequence=4,
                    metadata={
                        "simulationId": simulation.simulation_id,
                        "fillPrice": _round_number(simulation.fill_price),
                        "fillStatus": simulation.fill_status,
                        "orderState": simulation.order_state,
                        "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
                        "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
                        "adapterPaperExecutionEvidence": _redact_secret_fields(
                            simulation.adapter_paper_execution_evidence
                        ),
                    },
                )
            )
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state="live_blocked",
                    timestamp=simulation.simulated_at.isoformat(),
                    label=_portfolio_paper_order_state_label("live_blocked"),
                    actor="execution-guard",
                    source="live-route-guard",
                    reason="Live execution remains blocked; this timeline records paper-only simulation evidence.",
                    sequence=5,
                )
            )

        events.sort(key=lambda event: (str(event.get("timestamp") or ""), int(event.get("sequence") or 0)))
        for event in events:
            event.pop("sequence", None)
        current_state = str(events[-1].get("state") or lifecycle_state) if events else lifecycle_state
        if current_state == "created":
            current_state = lifecycle_state
        if current_state in {"risk_rejected", "operator_rejected", "invalid_order"}:
            rejected_orders += 1 if current_state != "operator_rejected" else 0
        live_blocked_events += sum(1 for event in events if event.get("state") == "live_blocked")
        total_events += len(events)
        state_counts.append(current_state)
        order_histories.append(
            {
                "batchId": batch.batch_id,
                "baseRunId": batch.base_run_id,
                "portfolioName": batch.portfolio_name,
                "orderId": order_id,
                "symbol": str(order.get("symbol") or ""),
                "sourceRunId": order.get("sourceRunId"),
                "side": str(order.get("side") or ""),
                "quantity": _round_number(order.get("quantity")),
                "notionalValue": _round_number(order.get("notionalValue")),
                "originalStatus": str(order.get("status") or ""),
                "riskStatus": str(order.get("riskStatus") or ""),
                "currentState": current_state,
                "currentStateLabel": _portfolio_paper_order_state_label(current_state),
                "events": events,
                "paperOnly": True,
                "liveExecutionBlocked": True,
            }
        )

    return {
        "schemaVersion": 1,
        "baseRunId": batch.base_run_id,
        "batchId": batch.batch_id,
        "portfolioName": batch.portfolio_name,
        "generatedAt": (generated_at or datetime.now(timezone.utc)).isoformat(),
        "mode": "portfolio_paper_order_state_history",
        "summary": {
            "orderCount": len(order_histories),
            "eventCount": total_events,
            "approvedOrders": approved_orders,
            "rejectedOrders": rejected_orders,
            "filledOrders": filled_orders,
            "liveBlockedEvents": live_blocked_events,
            "stateCounts": _sorted_counts(state_counts),
        },
        "orders": order_histories,
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def build_portfolio_paper_order_lifecycle(
    batch: PortfolioPaperOrderBatch,
    *,
    approvals: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    approval_map = approvals or {}
    return [_portfolio_paper_order_lifecycle_row(batch, order, approval_map.get(str(order.get("orderId") or ""))) for order in batch.orders]


def _portfolio_paper_order_lifecycle_row(
    batch: PortfolioPaperOrderBatch,
    order: dict[str, Any],
    approval: dict[str, Any] | None,
) -> dict[str, Any]:
    order_id = str(order.get("orderId") or "")
    status = str(order.get("status") or "")
    risk_status = str(order.get("riskStatus") or "")
    side = str(order.get("side") or "")
    quantity = _positive_number(order.get("quantity"), 0)
    notional_value = _positive_number(order.get("notionalValue"), 0)
    approved = bool(approval.get("approved")) if isinstance(approval, dict) else False
    approval_was_rejected = isinstance(approval, dict) and approval.get("approved") is False

    if status == "skipped" or side == "hold":
        state = "skipped"
        reason = str(order.get("reason") or "No paper order action is required.")
    elif status == "rejected" or risk_status == "blocked":
        state = "risk_rejected"
        reason = str(order.get("reason") or "Pre-trade risk rejected this paper order.")
    elif approval_was_rejected:
        state = "operator_rejected"
        reason = str(approval.get("reason") or "Operator rejected this paper order candidate.")
    elif not approved:
        state = "awaiting_operator_review"
        reason = str(order.get("reason") or "Operator approval is required before paper simulation.")
    elif risk_status != "passed":
        state = "risk_review"
        reason = "Risk review must pass before the approved order can be staged for simulation."
    elif side not in {"buy", "sell"} or quantity <= 0 or notional_value <= 0:
        state = "invalid_order"
        reason = "Only positive buy or sell paper orders can be staged for simulation."
    else:
        state = "ready_for_simulation"
        reason = str(approval.get("reason") or "Operator approved this order for paper simulation only.")

    return {
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "portfolioName": batch.portfolio_name,
        "orderId": order_id,
        "symbol": str(order.get("symbol") or ""),
        "sourceRunId": order.get("sourceRunId"),
        "side": side,
        "quantity": quantity,
        "notionalValue": notional_value,
        "originalStatus": status,
        "riskStatus": risk_status,
        "state": state,
        "routable": state == "ready_for_simulation",
        "paperOnly": True,
        "liveExecutionBlocked": True,
        "approvedBy": str(approval.get("reviewer") or "") if isinstance(approval, dict) and approved else None,
        "reviewedAt": str(approval.get("reviewedAt") or "") if isinstance(approval, dict) and approval.get("reviewedAt") else None,
        "reason": reason,
    }


def _portfolio_paper_order_state_event(
    *,
    batch: PortfolioPaperOrderBatch,
    order_id: str,
    state: str,
    timestamp: str,
    label: str,
    actor: str,
    source: str,
    reason: str,
    sequence: int,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event = {
        "eventId": f"{batch.batch_id}:{order_id}:{state}:{sequence}",
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "orderId": order_id,
        "timestamp": timestamp,
        "state": state,
        "label": label,
        "actor": str(actor or ""),
        "source": str(source or ""),
        "reason": str(reason or ""),
        "paperOnly": True,
        "liveExecutionBlocked": True,
        "sequence": sequence,
    }
    if metadata:
        event["metadata"] = dict(metadata)
    return event


def _portfolio_paper_order_state_label(state: str) -> str:
    labels = {
        "created": "Paper order created",
        "awaiting_operator_review": "Awaiting operator review",
        "operator_approved": "Operator approved",
        "operator_rejected": "Operator rejected",
        "ready_for_simulation": "Ready for paper simulation",
        "simulation_filled": "Paper simulation filled",
        "simulation_recorded": "Paper simulation recorded",
        "live_blocked": "Live route blocked",
        "risk_rejected": "Risk rejected",
        "risk_review": "Risk review required",
        "invalid_order": "Invalid paper order",
        "skipped": "Skipped",
    }
    return labels.get(state, state.replace("_", " ").strip().title())
