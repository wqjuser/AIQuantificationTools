from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterSandboxOrderSchemaDryRunResult,
)

__all__ = [
    '_execution_adapter_sandbox_order_schema_dry_run_specs',
    '_sandbox_order_schema_intent_is_valid',
    'build_execution_adapter_sandbox_order_schema_dry_run',
    'execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event',
    'execution_adapter_sandbox_order_schema_dry_run_to_audit_event_payload',
    'execution_adapter_sandbox_order_schema_dry_run_to_payload',
]

def build_execution_adapter_sandbox_order_schema_dry_run(
    production_route_review: dict[str, Any],
    *,
    adapter_id: str = "",
    dry_run_mode: str = "",
    order_intent: dict[str, Any] | None = None,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    sandbox_order_schema_dry_run_id: str | None = None,
) -> ExecutionAdapterSandboxOrderSchemaDryRunResult:
    if not isinstance(production_route_review, dict):
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_route_review_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    production_route_review_id = str(production_route_review.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(production_route_review.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(production_route_review.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(production_route_review.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(production_route_review.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(production_route_review.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(production_route_review.get("dryRunId") or "").strip()
    acceptance_id = str(production_route_review.get("acceptanceId") or "").strip()
    execution_id = str(production_route_review.get("executionId") or "").strip()
    plan_id = str(production_route_review.get("planId") or "").strip()
    binding_id = str(production_route_review.get("bindingId") or "").strip()
    materialization_id = str(production_route_review.get("materializationId") or "").strip()
    manifest_validation_id = str(production_route_review.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(production_route_review.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(production_route_review.get("market") or "").strip()
    route = str(production_route_review.get("route") or "").strip()
    normalized_dry_run_mode = str(dry_run_mode or "manual_sandbox_order_schema_dry_run").strip()
    review_mode = str(production_route_review.get("reviewMode") or "").strip()
    sandbox_review_mode = str(production_route_review.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(production_route_review.get("probeExecutionMode") or "").strip()
    probe_mode = str(production_route_review.get("probeMode") or "").strip()
    confirmation_mode = str(production_route_review.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(production_route_review.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(production_route_review.get("orchestrationMode") or "").strip()
    acceptance_mode = str(production_route_review.get("acceptanceMode") or "").strip()
    execution_mode = str(production_route_review.get("executionMode") or "").strip()
    reload_mode = str(production_route_review.get("reloadMode") or "").strip()
    maintenance_window_id = str(production_route_review.get("maintenanceWindowId") or "").strip()
    binding_mode = str(production_route_review.get("bindingMode") or "").strip()
    manifest_path = str(production_route_review.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in production_route_review.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not production_route_review_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_route_invalid")
    if not normalized_dry_run_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_mode_required")
    if not review_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_review_mode_required")
    if not sandbox_review_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_sandbox_review_mode_required")
    if not probe_execution_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_execution_mode_required")
    if not probe_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_mode_required")
    if not confirmation_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_required_env_vars_required")

    safe_order_intent = _redact_secret_fields(order_intent if isinstance(order_intent, dict) else {})
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_sandbox_order_schema_dry_run_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(production_route_review.get("status") or "") != "route_review_recorded":
        blocked_reasons.append("sandbox_order_schema_dry_run_route_review_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("sandbox_order_schema_dry_run_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("sandbox_order_schema_dry_run_route_not_live")
    if not _sandbox_order_schema_intent_is_valid(safe_order_intent):
        blocked_reasons.append("sandbox_order_schema_dry_run_order_intent_missing")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_sandbox_order_schema_dry_run_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSandboxOrderSchemaDryRunResult(
        sandbox_order_schema_dry_run_id=str(
            sandbox_order_schema_dry_run_id
            or f"execution-adapter-sandbox-order-schema-dry-run-{production_route_review_id}-{uuid4()}"
        ),
        production_route_review_id=production_route_review_id,
        sandbox_probe_review_id=sandbox_probe_review_id,
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=orchestration_dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "schema_dry_run_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        dry_run_mode=normalized_dry_run_mode,
        review_mode=review_mode,
        sandbox_review_mode=sandbox_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        order_intent=safe_order_intent,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_sandbox_order_schema_dry_run_to_payload(
    result: ExecutionAdapterSandboxOrderSchemaDryRunResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
        "productionRouteReviewId": result.production_route_review_id,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "dryRunMode": result.dry_run_mode,
        "reviewMode": result.review_mode,
        "sandboxReviewMode": result.sandbox_review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "orderIntent": result.order_intent,
        "orderSubmitted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_sandbox_order_schema_dry_run":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    schema_dry_run_id = str(metadata.get("sandboxOrderSchemaDryRunId") or getattr(event, "event_id", "")).strip()
    production_route_review_id = str(metadata.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(metadata.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(metadata.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(metadata.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(metadata.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    if (
        not schema_dry_run_id
        or not production_route_review_id
        or not sandbox_probe_review_id
        or not sandbox_probe_execution_id
        or not sandbox_probe_plan_id
        or not human_confirmation_id
        or not orchestration_execution_id
        or not orchestration_dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
        or not adapter_id
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "schema_dry_run_recorded"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_sandbox_order_schema_dry_run_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )
    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    order_intent = metadata.get("orderIntent") if isinstance(metadata.get("orderIntent"), dict) else {}

    return {
        "schemaVersion": 1,
        "sandboxOrderSchemaDryRunId": schema_dry_run_id,
        "productionRouteReviewId": production_route_review_id,
        "sandboxProbeReviewId": sandbox_probe_review_id,
        "sandboxProbeExecutionId": sandbox_probe_execution_id,
        "sandboxProbePlanId": sandbox_probe_plan_id,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": orchestration_dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": str(metadata.get("operator") or "local-operator").strip() or "local-operator",
        "recordedAt": recorded_at_value,
        "dryRunMode": str(metadata.get("dryRunMode") or "manual_sandbox_order_schema_dry_run").strip(),
        "reviewMode": str(metadata.get("reviewMode") or "").strip(),
        "sandboxReviewMode": str(metadata.get("sandboxReviewMode") or "").strip(),
        "probeExecutionMode": str(metadata.get("probeExecutionMode") or "").strip(),
        "probeMode": str(metadata.get("probeMode") or "").strip(),
        "confirmationMode": str(metadata.get("confirmationMode") or "").strip(),
        "orchestrationExecutionMode": str(metadata.get("orchestrationExecutionMode") or "").strip(),
        "orchestrationMode": str(metadata.get("orchestrationMode") or "").strip(),
        "acceptanceMode": str(metadata.get("acceptanceMode") or "").strip(),
        "executionMode": str(metadata.get("executionMode") or "").strip(),
        "reloadMode": str(metadata.get("reloadMode") or "").strip(),
        "maintenanceWindowId": str(metadata.get("maintenanceWindowId") or "").strip(),
        "bindingMode": str(metadata.get("bindingMode") or "").strip(),
        "manifestPath": str(metadata.get("manifestPath") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in metadata.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "orderIntent": _redact_secret_fields(order_intent),
        "orderSubmitted": False,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_order_schema_dry_run_to_audit_event_payload(
    result: ExecutionAdapterSandboxOrderSchemaDryRunResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.sandbox_order_schema_dry_run_id,
        "eventType": "execution_adapter_sandbox_order_schema_dry_run",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-sandbox-order-schema-dry-run",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} sandbox order schema dry-run {status_label} as {result.status}.",
        "detail": "Sandbox order schema dry-run records order intent validation only; no order is submitted.",
        "metadata": _redact_secret_fields(
            {
                "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
                "productionRouteReviewId": result.production_route_review_id,
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "dryRunMode": result.dry_run_mode,
                "reviewMode": result.review_mode,
                "sandboxReviewMode": result.sandbox_review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "orderIntent": result.order_intent,
                "orderSubmitted": False,
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_sandbox_order_schema_dry_run_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "production-route-review-accepted",
            "productionRouteReviewAccepted",
            "Production route review was accepted as schema dry-run input",
            "sandbox_order_schema_dry_run_route_review_not_accepted",
        ),
        (
            "health-probe-bound",
            "healthProbeBound",
            "Latest sandbox health probe was bound before schema dry-run",
            "sandbox_order_schema_dry_run_health_probe_not_bound",
        ),
        (
            "order-intent-schema-validated",
            "orderIntentSchemaValidated",
            "Order intent schema was validated without submission",
            "sandbox_order_schema_dry_run_order_intent_not_validated",
        ),
        (
            "sandbox-endpoint-still-locked",
            "sandboxEndpointStillLocked",
            "Sandbox/testnet endpoint remains locked",
            "sandbox_order_schema_dry_run_endpoint_not_locked",
        ),
        (
            "operator-confirmed-no-order-submitted",
            "operatorConfirmedNoOrderSubmitted",
            "Operator confirmed no sandbox, paper, or live order was submitted",
            "sandbox_order_schema_dry_run_no_order_boundary_missing",
        ),
    ]


def _sandbox_order_schema_intent_is_valid(order_intent: dict[str, Any]) -> bool:
    symbol = str(order_intent.get("symbol") or "").strip()
    side = str(order_intent.get("side") or "").strip().lower()
    order_type = str(order_intent.get("type") or "").strip().lower()
    quantity = order_intent.get("quantity")
    price = order_intent.get("price")
    return (
        bool(symbol)
        and side in {"buy", "sell"}
        and bool(order_type)
        and isinstance(quantity, (int, float))
        and not isinstance(quantity, bool)
        and math.isfinite(float(quantity))
        and float(quantity) > 0
        and (
            order_type == "market"
            or (
                isinstance(price, (int, float))
                and not isinstance(price, bool)
                and math.isfinite(float(price))
                and float(price) > 0
            )
        )
    )
