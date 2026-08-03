from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any
from .adapter_paper_execution import (
    _execution_adapter_paper_execution_specs,
    _execution_adapter_paper_execution_steps,
)
from .common import (
    _parse_payload_datetime,
    _redact_secret_fields,
    _round_number,
    _strict_positive_number,
)
from .contracts import (
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderSimulation,
)
from .paper_execution import (
    _positive_number,
)
from .portfolio_replay import (
    build_portfolio_paper_order_replay,
)

__all__ = [
    '_normalize_portfolio_paper_order_adapter_evidence',
    'build_portfolio_paper_order_simulation_route_risk',
    'create_portfolio_paper_order_simulation',
    'portfolio_paper_order_payload_to_simulation',
    'portfolio_paper_order_simulation_to_payload',
]

def _normalize_portfolio_paper_order_adapter_evidence(
    adapter_paper_execution_id: str,
    adapter_manifest_validation_id: str,
    adapter_paper_execution_evidence: dict[str, Any] | None,
    *,
    expected_symbol: str = "",
    expected_side: str = "",
    expected_quantity: float | None = None,
    expected_price: float | None = None,
    expected_notional: float | None = None,
) -> tuple[str, str, dict[str, Any]]:
    normalized_execution_id = str(adapter_paper_execution_id or "").strip()
    normalized_manifest_validation_id = str(adapter_manifest_validation_id or "").strip()
    normalized_expected_symbol = str(expected_symbol or "").strip()
    normalized_expected_side = str(expected_side or "").strip().lower()
    normalized_expected_quantity = _strict_positive_number(expected_quantity)
    normalized_expected_price = _strict_positive_number(expected_price)
    normalized_expected_notional = _strict_positive_number(expected_notional)
    redacted_evidence = _redact_secret_fields(
        adapter_paper_execution_evidence if isinstance(adapter_paper_execution_evidence, dict) else {}
    )
    evidence_execution_id = str(redacted_evidence.get("adapterPaperExecutionId") or "").strip()
    if evidence_execution_id:
        if normalized_execution_id and evidence_execution_id != normalized_execution_id:
            raise ValueError("portfolio_paper_order_simulation_adapter_execution_id_mismatch")
        normalized_execution_id = evidence_execution_id
    evidence_manifest_validation_id = str(
        redacted_evidence.get("adapterManifestValidationId") or redacted_evidence.get("manifestValidationId") or ""
    ).strip()
    if evidence_manifest_validation_id:
        if normalized_manifest_validation_id and evidence_manifest_validation_id != normalized_manifest_validation_id:
            raise ValueError("portfolio_paper_order_simulation_adapter_manifest_validation_id_mismatch")
        normalized_manifest_validation_id = evidence_manifest_validation_id
    if normalized_execution_id and not normalized_manifest_validation_id:
        raise ValueError("portfolio_paper_order_simulation_adapter_manifest_validation_id_required")
    evidence_event_type = str(redacted_evidence.get("eventType") or "").strip()
    if normalized_execution_id and evidence_event_type and evidence_event_type != "execution_adapter_paper_execution":
        raise ValueError("portfolio_paper_order_simulation_adapter_event_type_mismatch")
    evidence_status = str(redacted_evidence.get("status") or "").strip()
    if normalized_execution_id and evidence_status and evidence_status != "paper_execution_recorded":
        raise ValueError("portfolio_paper_order_simulation_adapter_paper_fill_not_recorded")
    evidence_paper_execution_mode = str(redacted_evidence.get("paperExecutionMode") or "").strip()
    if (
        normalized_execution_id
        and evidence_paper_execution_mode
        and evidence_paper_execution_mode != "manual_adapter_paper_execution"
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_paper_execution_mode_invalid")
    blocked_reasons = redacted_evidence.get("blockedReasons")
    if (
        normalized_execution_id
        and isinstance(blocked_reasons, list)
        and any(str(reason or "").strip() for reason in blocked_reasons)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_blocked_reasons_present")
    paper_execution_steps = redacted_evidence.get("paperExecutionSteps")
    if normalized_execution_id and isinstance(paper_execution_steps, list):
        step_entries = [step for step in paper_execution_steps if isinstance(step, dict)]
        for step in paper_execution_steps:
            if not isinstance(step, dict):
                continue
            step_status = str(step.get("status") or "").strip()
            if step_status and step_status != "recorded":
                raise ValueError("portfolio_paper_order_simulation_adapter_steps_not_recorded")
        if step_entries:
            expected_step_ids = {step["id"] for step in _execution_adapter_paper_execution_steps("recorded")}
            evidence_step_ids = {
                str(step.get("id") or "").strip()
                for step in step_entries
                if str(step.get("id") or "").strip()
            }
            if not expected_step_ids.issubset(evidence_step_ids):
                raise ValueError("portfolio_paper_order_simulation_adapter_steps_missing")
    required_confirmations = redacted_evidence.get("requiredConfirmations")
    if normalized_execution_id and isinstance(required_confirmations, list):
        confirmation_entries = [confirmation for confirmation in required_confirmations if isinstance(confirmation, dict)]
        for confirmation in required_confirmations:
            if not isinstance(confirmation, dict):
                continue
            confirmation_status = str(confirmation.get("status") or "").strip()
            if confirmation_status and confirmation_status != "confirmed":
                raise ValueError("portfolio_paper_order_simulation_adapter_confirmations_not_confirmed")
        if confirmation_entries:
            expected_confirmation_ids = {spec[0] for spec in _execution_adapter_paper_execution_specs()}
            evidence_confirmation_ids = {
                str(confirmation.get("id") or "").strip()
                for confirmation in confirmation_entries
                if str(confirmation.get("id") or "").strip()
            }
            if not expected_confirmation_ids.issubset(evidence_confirmation_ids):
                raise ValueError("portfolio_paper_order_simulation_adapter_confirmations_missing")
    if normalized_execution_id and redacted_evidence.get("paperFillRecorded") is False:
        raise ValueError("portfolio_paper_order_simulation_adapter_paper_fill_not_recorded")
    simulated_fill = redacted_evidence.get("simulatedFill")
    simulated_fill_status = (
        str(simulated_fill.get("status") or "").strip()
        if isinstance(simulated_fill, dict)
        else ""
    )
    if normalized_execution_id and simulated_fill_status and simulated_fill_status != "filled":
        raise ValueError("portfolio_paper_order_simulation_adapter_simulated_fill_not_filled")
    simulated_fill_symbol = (
        str(simulated_fill.get("symbol") or "").strip()
        if isinstance(simulated_fill, dict)
        else ""
    )
    order_intent = redacted_evidence.get("orderIntent")
    if normalized_execution_id and isinstance(order_intent, dict) and bool(order_intent.get("liveTradingAllowed")):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_live_trading_allowed")
    order_intent_symbol = (
        str(order_intent.get("symbol") or "").strip()
        if isinstance(order_intent, dict)
        else ""
    )
    if (
        normalized_execution_id
        and normalized_expected_symbol
        and order_intent_symbol
        and order_intent_symbol != normalized_expected_symbol
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_symbol_mismatch")
    evidence_symbol = str(
        redacted_evidence.get("simulatedSymbol") or redacted_evidence.get("symbol") or simulated_fill_symbol
    ).strip()
    if normalized_execution_id and normalized_expected_symbol and evidence_symbol and evidence_symbol != normalized_expected_symbol:
        raise ValueError("portfolio_paper_order_simulation_adapter_symbol_mismatch")
    simulated_fill_side = (
        str(simulated_fill.get("side") or "").strip().lower()
        if isinstance(simulated_fill, dict)
        else ""
    )
    order_intent_side = (
        str(order_intent.get("side") or "").strip().lower()
        if isinstance(order_intent, dict)
        else ""
    )
    if (
        normalized_execution_id
        and normalized_expected_side
        and order_intent_side
        and order_intent_side != normalized_expected_side
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_side_mismatch")
    evidence_side = str(
        redacted_evidence.get("simulatedSide") or redacted_evidence.get("side") or simulated_fill_side
    ).strip().lower()
    if normalized_execution_id and normalized_expected_side and evidence_side and evidence_side != normalized_expected_side:
        raise ValueError("portfolio_paper_order_simulation_adapter_side_mismatch")
    simulated_fill_quantity = (
        _strict_positive_number(simulated_fill.get("quantity"))
        if isinstance(simulated_fill, dict)
        else None
    )
    order_intent_quantity = (
        _strict_positive_number(order_intent.get("quantity"))
        if isinstance(order_intent, dict)
        else None
    )
    if (
        normalized_execution_id
        and normalized_expected_quantity is not None
        and order_intent_quantity is not None
        and not math.isclose(float(order_intent_quantity), float(normalized_expected_quantity), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_quantity_mismatch")
    evidence_quantity = _strict_positive_number(redacted_evidence.get("simulatedQuantity") or redacted_evidence.get("quantity"))
    if evidence_quantity is None:
        evidence_quantity = simulated_fill_quantity
    if (
        normalized_execution_id
        and normalized_expected_quantity is not None
        and evidence_quantity is not None
        and not math.isclose(float(evidence_quantity), float(normalized_expected_quantity), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_quantity_mismatch")
    simulated_fill_price = (
        _strict_positive_number(simulated_fill.get("price"))
        if isinstance(simulated_fill, dict)
        else None
    )
    order_intent_price = (
        _strict_positive_number(order_intent.get("price"))
        if isinstance(order_intent, dict)
        else None
    )
    if (
        normalized_execution_id
        and normalized_expected_price is not None
        and order_intent_price is not None
        and not math.isclose(float(order_intent_price), float(normalized_expected_price), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_price_mismatch")
    evidence_price = _strict_positive_number(
        redacted_evidence.get("simulatedPrice") or redacted_evidence.get("price") or redacted_evidence.get("fillPrice")
    )
    if evidence_price is None:
        evidence_price = simulated_fill_price
    if (
        normalized_execution_id
        and normalized_expected_price is not None
        and evidence_price is not None
        and not math.isclose(float(evidence_price), float(normalized_expected_price), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_price_mismatch")
    simulated_fill_notional = (
        _strict_positive_number(simulated_fill.get("notionalValue") or simulated_fill.get("notional"))
        if isinstance(simulated_fill, dict)
        else None
    )
    order_intent_notional = (
        _strict_positive_number(order_intent.get("notionalValue") or order_intent.get("notional"))
        if isinstance(order_intent, dict)
        else None
    )
    if (
        normalized_execution_id
        and normalized_expected_notional is not None
        and order_intent_notional is not None
        and not math.isclose(
            float(order_intent_notional),
            float(normalized_expected_notional),
            rel_tol=0.0,
            abs_tol=1e-6,
        )
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_notional_mismatch")
    evidence_notional = _strict_positive_number(
        redacted_evidence.get("simulatedNotional")
        or redacted_evidence.get("notionalValue")
        or redacted_evidence.get("notional")
    )
    if evidence_notional is None:
        evidence_notional = simulated_fill_notional
    if (
        normalized_execution_id
        and normalized_expected_notional is not None
        and evidence_notional is not None
        and not math.isclose(float(evidence_notional), float(normalized_expected_notional), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_notional_mismatch")
    if normalized_execution_id and redacted_evidence.get("paperOnly") is False:
        raise ValueError("portfolio_paper_order_simulation_adapter_not_paper_only")
    if bool(redacted_evidence.get("orderSubmitted")):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_submitted")
    if bool(redacted_evidence.get("liveOrderSubmitted")):
        raise ValueError("portfolio_paper_order_simulation_adapter_live_order_submitted")
    if bool(redacted_evidence.get("routeExecuted")):
        raise ValueError("portfolio_paper_order_simulation_adapter_route_executed")
    if bool(redacted_evidence.get("liveTradingAllowed")):
        raise ValueError("portfolio_paper_order_simulation_adapter_live_trading_allowed")
    return normalized_execution_id, normalized_manifest_validation_id, redacted_evidence


def create_portfolio_paper_order_simulation(
    *,
    batch: PortfolioPaperOrderBatch,
    lifecycle_row: dict[str, Any],
    existing_simulations: list[PortfolioPaperOrderSimulation] | None = None,
    route_risk: dict[str, Any] | None = None,
    adapter_paper_execution_id: str = "",
    adapter_manifest_validation_id: str = "",
    adapter_paper_execution_evidence: dict[str, Any] | None = None,
    simulated_at: datetime | str | None = None,
) -> PortfolioPaperOrderSimulation:
    order_id = str(lifecycle_row.get("orderId") or "").strip()
    if not order_id:
        raise ValueError("portfolio_paper_order_simulation_order_id_required")
    if str(lifecycle_row.get("batchId") or "") != batch.batch_id or str(lifecycle_row.get("baseRunId") or "") != batch.base_run_id:
        raise ValueError("portfolio_paper_order_simulation_lifecycle_context_mismatch")
    if str(lifecycle_row.get("state") or "") != "ready_for_simulation" or not bool(lifecycle_row.get("routable")):
        raise ValueError("portfolio_paper_order_simulation_requires_ready_order")
    side = str(lifecycle_row.get("side") or "")
    if side not in {"buy", "sell"}:
        raise ValueError("portfolio_paper_order_simulation_side_invalid")
    quantity = _strict_positive_number(lifecycle_row.get("quantity"))
    notional_value = _strict_positive_number(lifecycle_row.get("notionalValue"))
    if quantity is None or notional_value is None:
        raise ValueError("portfolio_paper_order_simulation_quantity_notional_required")
    route_guard = build_portfolio_paper_order_simulation_route_risk(
        lifecycle_row,
        base_run_id=batch.base_run_id,
        batch_id=batch.batch_id,
        existing_simulations=existing_simulations,
        route_risk=route_risk,
    )
    if route_guard["status"] == "blocked":
        raise ValueError(
            "portfolio_paper_order_simulation_route_risk_blocked:"
            + ",".join(str(reason) for reason in route_guard["blockedReasons"])
        )
    fill_price = round(notional_value / quantity, 6)
    (
        normalized_adapter_paper_execution_id,
        normalized_adapter_manifest_validation_id,
        normalized_adapter_paper_execution_evidence,
    ) = _normalize_portfolio_paper_order_adapter_evidence(
        adapter_paper_execution_id,
        adapter_manifest_validation_id,
        adapter_paper_execution_evidence,
        expected_symbol=str(lifecycle_row.get("symbol") or ""),
        expected_side=side,
        expected_quantity=quantity,
        expected_price=fill_price,
        expected_notional=notional_value,
    )
    simulated = (
        _parse_payload_datetime(simulated_at, "portfolio_paper_order_simulation_simulated_at_invalid")
        if simulated_at is not None
        else datetime.now(timezone.utc)
    )
    return PortfolioPaperOrderSimulation(
        simulation_id=f"portfolio-paper-order-simulation-{batch.batch_id}-{order_id}",
        base_run_id=batch.base_run_id,
        batch_id=batch.batch_id,
        order_id=order_id,
        simulated_at=simulated,
        mode="portfolio_paper_order_simulation",
        symbol=str(lifecycle_row.get("symbol") or ""),
        source_run_id=str(lifecycle_row.get("sourceRunId") or "").strip() or None,
        side=side,
        quantity=quantity,
        fill_price=fill_price,
        notional_value=notional_value,
        order_state="filled",
        fill_status="filled",
        reason="Paper-only simulation filled the approved portfolio order; live execution remains blocked.",
        approved_by=str(lifecycle_row.get("approvedBy") or "").strip() or None,
        route_risk=route_guard,
        adapter_paper_execution_id=normalized_adapter_paper_execution_id,
        adapter_manifest_validation_id=normalized_adapter_manifest_validation_id,
        adapter_paper_execution_evidence=normalized_adapter_paper_execution_evidence,
    )


def build_portfolio_paper_order_simulation_route_risk(
    lifecycle_row: dict[str, Any],
    *,
    base_run_id: str,
    batch_id: str,
    existing_simulations: list[PortfolioPaperOrderSimulation] | None = None,
    route_risk: dict[str, Any] | None = None,
) -> dict[str, Any]:
    controls = route_risk if isinstance(route_risk, dict) else {}
    initial_cash = _positive_number(controls.get("initialCash"), 100_000)
    min_cash_after = _positive_number(controls.get("minCashAfter"), 0)
    max_symbol_notional = _strict_positive_number(controls.get("maxSymbolNotional"))
    max_batch_notional = _strict_positive_number(controls.get("maxBatchNotional"))
    side = str(lifecycle_row.get("side") or "")
    symbol = str(lifecycle_row.get("symbol") or "")
    order_id = str(lifecycle_row.get("orderId") or "")
    quantity = _positive_number(lifecycle_row.get("quantity"), 0)
    notional_value = _positive_number(lifecycle_row.get("notionalValue"), 0)
    existing = [
        simulation
        for simulation in existing_simulations or []
        if simulation.base_run_id == base_run_id
        and simulation.order_state == "filled"
        and simulation.fill_status == "filled"
    ]
    replay = build_portfolio_paper_order_replay(existing, base_run_id=base_run_id, initial_cash=initial_cash)
    cash_before = _positive_number(replay.get("account", {}).get("cash"), initial_cash)
    cash_after = cash_before - notional_value if side == "buy" else cash_before + notional_value
    replay_positions = replay.get("account", {}).get("positions", {})
    symbol_position_before = _positive_number(
        replay_positions.get(symbol) if isinstance(replay_positions, dict) else 0,
        0,
    )
    symbol_position_after = symbol_position_before + quantity if side == "buy" else symbol_position_before - quantity
    existing_symbol_notional = sum(
        simulation.notional_value
        for simulation in existing
        if simulation.symbol == symbol and simulation.side == side
    )
    existing_batch_notional = sum(
        simulation.notional_value
        for simulation in existing
        if simulation.batch_id == batch_id
    )
    symbol_notional_after = existing_symbol_notional + notional_value
    batch_notional_after = existing_batch_notional + notional_value
    checks = [
        {
            "id": "cash_after_below_minimum",
            "label": "Cash after route",
            "passed": side != "buy" or cash_after >= min_cash_after,
            "value": _round_number(cash_after),
            "limit": _round_number(min_cash_after),
        },
        {
            "id": "insufficient_symbol_position",
            "label": "Sell position coverage",
            "passed": side != "sell" or quantity <= symbol_position_before,
            "value": _round_number(quantity),
            "limit": _round_number(symbol_position_before),
        },
        {
            "id": "symbol_notional_limit_exceeded",
            "label": "Symbol notional limit",
            "passed": max_symbol_notional is None or symbol_notional_after <= max_symbol_notional,
            "value": _round_number(symbol_notional_after),
            "limit": _round_number(max_symbol_notional or 0),
        },
        {
            "id": "batch_notional_limit_exceeded",
            "label": "Batch notional limit",
            "passed": max_batch_notional is None or batch_notional_after <= max_batch_notional,
            "value": _round_number(batch_notional_after),
            "limit": _round_number(max_batch_notional or 0),
        },
    ]
    blocked_reasons = [str(check["id"]) for check in checks if not bool(check["passed"])]
    return {
        "schemaVersion": 1,
        "mode": "portfolio_paper_simulation_route_guard",
        "status": "blocked" if blocked_reasons else "passed",
        "baseRunId": base_run_id,
        "batchId": batch_id,
        "orderId": order_id,
        "symbol": symbol,
        "side": side,
        "orderNotional": _round_number(notional_value),
        "cashBefore": _round_number(cash_before),
        "cashAfter": _round_number(cash_after),
        "symbolPositionBefore": _round_number(symbol_position_before),
        "symbolPositionAfter": _round_number(symbol_position_after),
        "symbolNotionalAfter": _round_number(symbol_notional_after),
        "batchNotionalAfter": _round_number(batch_notional_after),
        "limits": {
            "initialCash": _round_number(initial_cash),
            "minCashAfter": _round_number(min_cash_after),
            "maxSymbolNotional": _round_number(max_symbol_notional or 0),
            "maxBatchNotional": _round_number(max_batch_notional or 0),
        },
        "checks": checks,
        "blockedReasons": blocked_reasons,
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def portfolio_paper_order_simulation_to_payload(simulation: PortfolioPaperOrderSimulation) -> dict[str, Any]:
    return {
        "simulationId": simulation.simulation_id,
        "baseRunId": simulation.base_run_id,
        "batchId": simulation.batch_id,
        "orderId": simulation.order_id,
        "simulatedAt": simulation.simulated_at.isoformat(),
        "mode": simulation.mode,
        "symbol": simulation.symbol,
        "sourceRunId": simulation.source_run_id,
        "side": simulation.side,
        "quantity": simulation.quantity,
        "fillPrice": simulation.fill_price,
        "notionalValue": simulation.notional_value,
        "orderState": simulation.order_state,
        "fillStatus": simulation.fill_status,
        "reason": simulation.reason,
        "approvedBy": simulation.approved_by,
        "routeRisk": simulation.route_risk,
        "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
        "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
        "adapterPaperExecutionEvidence": simulation.adapter_paper_execution_evidence,
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def portfolio_paper_order_payload_to_simulation(payload: dict[str, Any]) -> PortfolioPaperOrderSimulation:
    return PortfolioPaperOrderSimulation(
        simulation_id=str(payload.get("simulationId") or ""),
        base_run_id=str(payload.get("baseRunId") or ""),
        batch_id=str(payload.get("batchId") or ""),
        order_id=str(payload.get("orderId") or ""),
        simulated_at=_parse_payload_datetime(
            payload.get("simulatedAt"),
            "portfolio_paper_order_simulation_simulated_at_invalid",
        ),
        mode=str(payload.get("mode") or "portfolio_paper_order_simulation"),
        symbol=str(payload.get("symbol") or ""),
        source_run_id=str(payload.get("sourceRunId") or "").strip() or None,
        side=str(payload.get("side") or ""),
        quantity=_positive_number(payload.get("quantity"), 0),
        fill_price=_positive_number(payload.get("fillPrice"), 0),
        notional_value=_positive_number(payload.get("notionalValue"), 0),
        order_state=str(payload.get("orderState") or ""),
        fill_status=str(payload.get("fillStatus") or ""),
        reason=str(payload.get("reason") or ""),
        approved_by=str(payload.get("approvedBy") or "").strip() or None,
        route_risk=payload.get("routeRisk") if isinstance(payload.get("routeRisk"), dict) else {},
        adapter_paper_execution_id=str(payload.get("adapterPaperExecutionId") or "").strip(),
        adapter_manifest_validation_id=str(payload.get("adapterManifestValidationId") or "").strip(),
        adapter_paper_execution_evidence=_redact_secret_fields(
            payload.get("adapterPaperExecutionEvidence")
            if isinstance(payload.get("adapterPaperExecutionEvidence"), dict)
            else {}
        ),
    )
