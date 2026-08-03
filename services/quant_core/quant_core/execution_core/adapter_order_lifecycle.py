from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .adapter_order_schema import (
    _sandbox_order_schema_intent_is_valid,
)
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterPaperOrderLifecycleResult,
)

__all__ = [
    '_execution_adapter_paper_order_lifecycle_specs',
    '_execution_adapter_paper_order_lifecycle_steps',
    'build_execution_adapter_paper_order_lifecycle',
    'execution_adapter_paper_order_lifecycle_payload_from_audit_event',
    'execution_adapter_paper_order_lifecycle_to_audit_event_payload',
    'execution_adapter_paper_order_lifecycle_to_payload',
]

def build_execution_adapter_paper_order_lifecycle(
    schema_dry_run: dict[str, Any],
    *,
    adapter_id: str = "",
    lifecycle_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    paper_order_lifecycle_id: str | None = None,
) -> ExecutionAdapterPaperOrderLifecycleResult:
    if not isinstance(schema_dry_run, dict):
        raise ValueError("execution_adapter_paper_order_lifecycle_schema_dry_run_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    schema_dry_run_id = str(schema_dry_run.get("sandboxOrderSchemaDryRunId") or "").strip()
    production_route_review_id = str(schema_dry_run.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(schema_dry_run.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(schema_dry_run.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(schema_dry_run.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(schema_dry_run.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(schema_dry_run.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(schema_dry_run.get("dryRunId") or "").strip()
    acceptance_id = str(schema_dry_run.get("acceptanceId") or "").strip()
    execution_id = str(schema_dry_run.get("executionId") or "").strip()
    plan_id = str(schema_dry_run.get("planId") or "").strip()
    binding_id = str(schema_dry_run.get("bindingId") or "").strip()
    materialization_id = str(schema_dry_run.get("materializationId") or "").strip()
    manifest_validation_id = str(schema_dry_run.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(schema_dry_run.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(schema_dry_run.get("market") or "").strip()
    route = str(schema_dry_run.get("route") or "").strip()
    normalized_lifecycle_mode = str(lifecycle_mode or "manual_paper_order_lifecycle_adapter").strip()
    dry_run_mode = str(schema_dry_run.get("dryRunMode") or "").strip()
    review_mode = str(schema_dry_run.get("reviewMode") or "").strip()
    sandbox_review_mode = str(schema_dry_run.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(schema_dry_run.get("probeExecutionMode") or "").strip()
    probe_mode = str(schema_dry_run.get("probeMode") or "").strip()
    confirmation_mode = str(schema_dry_run.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(schema_dry_run.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(schema_dry_run.get("orchestrationMode") or "").strip()
    acceptance_mode = str(schema_dry_run.get("acceptanceMode") or "").strip()
    execution_mode = str(schema_dry_run.get("executionMode") or "").strip()
    reload_mode = str(schema_dry_run.get("reloadMode") or "").strip()
    maintenance_window_id = str(schema_dry_run.get("maintenanceWindowId") or "").strip()
    binding_mode = str(schema_dry_run.get("bindingMode") or "").strip()
    manifest_path = str(schema_dry_run.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in schema_dry_run.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not schema_dry_run_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_schema_dry_run_id_required")
    if not production_route_review_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_paper_order_lifecycle_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_paper_order_lifecycle_route_invalid")
    if not normalized_lifecycle_mode:
        raise ValueError("execution_adapter_paper_order_lifecycle_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_paper_order_lifecycle_required_env_vars_required")

    order_intent = _redact_secret_fields(schema_dry_run.get("orderIntent") if isinstance(schema_dry_run.get("orderIntent"), dict) else {})
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_paper_order_lifecycle_specs():
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

    if str(schema_dry_run.get("status") or "") != "schema_dry_run_recorded":
        blocked_reasons.append("paper_order_lifecycle_schema_dry_run_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("paper_order_lifecycle_manifest_validation_missing")
    if bool(schema_dry_run.get("orderSubmitted")):
        blocked_reasons.append("paper_order_lifecycle_schema_dry_run_order_submitted")
    if not _sandbox_order_schema_intent_is_valid(order_intent):
        blocked_reasons.append("paper_order_lifecycle_order_intent_invalid")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_paper_order_lifecycle_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterPaperOrderLifecycleResult(
        paper_order_lifecycle_id=str(
            paper_order_lifecycle_id
            or f"execution-adapter-paper-order-lifecycle-{schema_dry_run_id}-{uuid4()}"
        ),
        sandbox_order_schema_dry_run_id=schema_dry_run_id,
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
        status="blocked" if unique_blocked_reasons else "lifecycle_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        lifecycle_mode=normalized_lifecycle_mode,
        dry_run_mode=dry_run_mode,
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
        order_intent=order_intent,
        lifecycle_steps=_execution_adapter_paper_order_lifecycle_steps("blocked" if unique_blocked_reasons else "recorded"),
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_paper_order_lifecycle_to_payload(
    result: ExecutionAdapterPaperOrderLifecycleResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "paperOrderLifecycleId": result.paper_order_lifecycle_id,
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
        "lifecycleMode": result.lifecycle_mode,
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
        "lifecycleSteps": result.lifecycle_steps,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_order_lifecycle_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_paper_order_lifecycle":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    paper_order_lifecycle_id = str(metadata.get("paperOrderLifecycleId") or getattr(event, "event_id", "")).strip()
    schema_dry_run_id = str(metadata.get("sandboxOrderSchemaDryRunId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    route = str(metadata.get("route") or "").strip()
    if not paper_order_lifecycle_id or not schema_dry_run_id or not adapter_id:
        return None
    if status not in {"blocked", "lifecycle_recorded"} or route not in {"paper", "live"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_paper_order_lifecycle_specs():
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
    lifecycle_steps = metadata.get("lifecycleSteps") if isinstance(metadata.get("lifecycleSteps"), list) else []

    return {
        "schemaVersion": 1,
        "paperOrderLifecycleId": paper_order_lifecycle_id,
        "sandboxOrderSchemaDryRunId": schema_dry_run_id,
        "productionRouteReviewId": str(metadata.get("productionRouteReviewId") or "").strip(),
        "sandboxProbeReviewId": str(metadata.get("sandboxProbeReviewId") or "").strip(),
        "sandboxProbeExecutionId": str(metadata.get("sandboxProbeExecutionId") or "").strip(),
        "sandboxProbePlanId": str(metadata.get("sandboxProbePlanId") or "").strip(),
        "humanConfirmationId": str(metadata.get("humanConfirmationId") or "").strip(),
        "orchestrationExecutionId": str(metadata.get("orchestrationExecutionId") or "").strip(),
        "dryRunId": str(metadata.get("dryRunId") or "").strip(),
        "acceptanceId": str(metadata.get("acceptanceId") or "").strip(),
        "executionId": str(metadata.get("executionId") or "").strip(),
        "planId": str(metadata.get("planId") or "").strip(),
        "bindingId": str(metadata.get("bindingId") or "").strip(),
        "materializationId": str(metadata.get("materializationId") or "").strip(),
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": str(metadata.get("market") or "").strip(),
        "route": route,
        "status": status,
        "operator": str(metadata.get("operator") or "local-operator").strip() or "local-operator",
        "recordedAt": recorded_at_value,
        "lifecycleMode": str(metadata.get("lifecycleMode") or "manual_paper_order_lifecycle_adapter").strip(),
        "dryRunMode": str(metadata.get("dryRunMode") or "").strip(),
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
        "lifecycleSteps": [
            _redact_secret_fields(item)
            for item in lifecycle_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
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


def execution_adapter_paper_order_lifecycle_to_audit_event_payload(
    result: ExecutionAdapterPaperOrderLifecycleResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.paper_order_lifecycle_id,
        "eventType": "execution_adapter_paper_order_lifecycle",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-paper-order-lifecycle",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} paper order lifecycle {status_label} as {result.status}.",
        "detail": "Paper order lifecycle adapter records local paper-only transitions; no live order is submitted.",
        "metadata": _redact_secret_fields(
            {
                "paperOrderLifecycleId": result.paper_order_lifecycle_id,
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
                "lifecycleMode": result.lifecycle_mode,
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
                "lifecycleSteps": result.lifecycle_steps,
                "orderSubmitted": False,
                "liveOrderSubmitted": False,
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


def _execution_adapter_paper_order_lifecycle_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "schema-dry-run-accepted",
            "schemaDryRunAccepted",
            "Sandbox order schema dry-run was accepted as lifecycle input",
            "paper_order_lifecycle_schema_dry_run_not_accepted",
        ),
        (
            "paper-router-locked",
            "paperRouterLocked",
            "Paper router remained locked to local simulation",
            "paper_order_lifecycle_router_not_locked",
        ),
        (
            "risk-limits-bound",
            "riskLimitsBound",
            "Risk limits were bound before paper lifecycle",
            "paper_order_lifecycle_risk_limits_not_bound",
        ),
        (
            "simulated-lifecycle-generated",
            "simulatedLifecycleGenerated",
            "Simulated lifecycle was generated without routing",
            "paper_order_lifecycle_not_generated",
        ),
        (
            "operator-confirmed-no-live-order-submitted",
            "operatorConfirmedNoLiveOrderSubmitted",
            "Operator confirmed no live order was submitted",
            "paper_order_lifecycle_no_live_order_boundary_missing",
        ),
    ]


def _execution_adapter_paper_order_lifecycle_steps(status: str) -> list[dict[str, Any]]:
    normalized_status = "recorded" if status == "recorded" else "blocked"
    return [
        {"id": "intent-validated", "label": "Order intent validated", "status": normalized_status},
        {"id": "paper-router-locked", "label": "Paper router locked", "status": normalized_status},
        {"id": "risk-limits-bound", "label": "Risk limits bound", "status": normalized_status},
        {"id": "simulated-lifecycle-recorded", "label": "Simulated lifecycle recorded", "status": normalized_status},
    ]
