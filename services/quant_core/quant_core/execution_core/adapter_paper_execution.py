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
    ExecutionAdapterPaperExecutionResult,
)

__all__ = [
    '_execution_adapter_paper_execution_simulated_fill',
    '_execution_adapter_paper_execution_specs',
    '_execution_adapter_paper_execution_steps',
    'build_execution_adapter_paper_execution',
    'execution_adapter_paper_execution_payload_from_audit_event',
    'execution_adapter_paper_execution_to_audit_event_payload',
    'execution_adapter_paper_execution_to_payload',
]

def build_execution_adapter_paper_execution(
    adapter_ops_state: dict[str, Any],
    *,
    adapter_id: str = "",
    paper_execution_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    adapter_paper_execution_id: str | None = None,
) -> ExecutionAdapterPaperExecutionResult:
    if not isinstance(adapter_ops_state, dict):
        raise ValueError("execution_adapter_paper_execution_ops_state_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    adapter_ops_state_id = str(adapter_ops_state.get("adapterOpsStateId") or "").strip()
    paper_route_runbook_id = str(adapter_ops_state.get("paperRouteRunbookId") or "").strip()
    paper_order_lifecycle_id = str(adapter_ops_state.get("paperOrderLifecycleId") or "").strip()
    schema_dry_run_id = str(adapter_ops_state.get("sandboxOrderSchemaDryRunId") or "").strip()
    production_route_review_id = str(adapter_ops_state.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(adapter_ops_state.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(adapter_ops_state.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(adapter_ops_state.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(adapter_ops_state.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(adapter_ops_state.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(adapter_ops_state.get("dryRunId") or "").strip()
    acceptance_id = str(adapter_ops_state.get("acceptanceId") or "").strip()
    execution_id = str(adapter_ops_state.get("executionId") or "").strip()
    plan_id = str(adapter_ops_state.get("planId") or "").strip()
    binding_id = str(adapter_ops_state.get("bindingId") or "").strip()
    materialization_id = str(adapter_ops_state.get("materializationId") or "").strip()
    manifest_validation_id = str(adapter_ops_state.get("manifestValidationId") or "").strip()
    ops_adapter_id = str(adapter_ops_state.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or ops_adapter_id).strip()
    market = str(adapter_ops_state.get("market") or "").strip()
    route = str(adapter_ops_state.get("route") or "").strip()
    normalized_paper_execution_mode = str(
        paper_execution_mode or "manual_adapter_paper_execution"
    ).strip()
    ops_mode = str(adapter_ops_state.get("opsMode") or "").strip()
    runbook_mode = str(adapter_ops_state.get("runbookMode") or "").strip()
    lifecycle_mode = str(adapter_ops_state.get("lifecycleMode") or "").strip()
    dry_run_mode = str(adapter_ops_state.get("dryRunMode") or "").strip()
    review_mode = str(adapter_ops_state.get("reviewMode") or "").strip()
    sandbox_review_mode = str(adapter_ops_state.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(adapter_ops_state.get("probeExecutionMode") or "").strip()
    probe_mode = str(adapter_ops_state.get("probeMode") or "").strip()
    confirmation_mode = str(adapter_ops_state.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(adapter_ops_state.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(adapter_ops_state.get("orchestrationMode") or "").strip()
    acceptance_mode = str(adapter_ops_state.get("acceptanceMode") or "").strip()
    execution_mode = str(adapter_ops_state.get("executionMode") or "").strip()
    reload_mode = str(adapter_ops_state.get("reloadMode") or "").strip()
    maintenance_window_id = str(adapter_ops_state.get("maintenanceWindowId") or "").strip()
    binding_mode = str(adapter_ops_state.get("bindingMode") or "").strip()
    manifest_path = str(adapter_ops_state.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in adapter_ops_state.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not adapter_ops_state_id:
        raise ValueError("execution_adapter_paper_execution_ops_state_id_required")
    if not paper_route_runbook_id:
        raise ValueError("execution_adapter_paper_execution_runbook_id_required")
    if not paper_order_lifecycle_id:
        raise ValueError("execution_adapter_paper_execution_lifecycle_id_required")
    if not schema_dry_run_id:
        raise ValueError("execution_adapter_paper_execution_schema_dry_run_id_required")
    if not production_route_review_id:
        raise ValueError("execution_adapter_paper_execution_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_paper_execution_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_paper_execution_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_paper_execution_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_paper_execution_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_paper_execution_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_paper_execution_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_paper_execution_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_paper_execution_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_paper_execution_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_paper_execution_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_paper_execution_materialization_id_required")
    if not ops_adapter_id:
        raise ValueError("execution_adapter_paper_execution_adapter_id_required")
    if requested_adapter_id != ops_adapter_id:
        raise ValueError("execution_adapter_paper_execution_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_paper_execution_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_paper_execution_route_invalid")
    if not normalized_paper_execution_mode:
        raise ValueError("execution_adapter_paper_execution_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_paper_execution_required_env_vars_required")

    order_intent = _redact_secret_fields(
        adapter_ops_state.get("orderIntent") if isinstance(adapter_ops_state.get("orderIntent"), dict) else {}
    )
    lifecycle_steps = [
        _redact_secret_fields(item)
        for item in adapter_ops_state.get("lifecycleSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]
    runbook_steps = [
        _redact_secret_fields(item)
        for item in adapter_ops_state.get("runbookSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]
    ops_steps = [
        _redact_secret_fields(item)
        for item in adapter_ops_state.get("opsSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_paper_execution_specs():
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

    if str(adapter_ops_state.get("status") or "") != "ops_state_recorded":
        blocked_reasons.append("adapter_paper_execution_ops_state_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("adapter_paper_execution_manifest_validation_missing")
    if (
        bool(adapter_ops_state.get("orderSubmitted"))
        or bool(adapter_ops_state.get("liveOrderSubmitted"))
        or bool(adapter_ops_state.get("routeExecuted"))
    ):
        blocked_reasons.append("adapter_paper_execution_prior_route_or_order_execution_detected")
    if bool(adapter_ops_state.get("liveTradingAllowed")):
        blocked_reasons.append("adapter_paper_execution_live_trading_enabled_detected")
    if not _sandbox_order_schema_intent_is_valid(order_intent):
        blocked_reasons.append("adapter_paper_execution_order_intent_invalid")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_paper_execution_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    paper_execution_id = str(
        adapter_paper_execution_id
        or f"execution-adapter-paper-execution-{adapter_ops_state_id}-{uuid4()}"
    )
    return ExecutionAdapterPaperExecutionResult(
        adapter_paper_execution_id=paper_execution_id,
        adapter_ops_state_id=adapter_ops_state_id,
        paper_route_runbook_id=paper_route_runbook_id,
        paper_order_lifecycle_id=paper_order_lifecycle_id,
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
        adapter_id=ops_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "paper_execution_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        paper_execution_mode=normalized_paper_execution_mode,
        ops_mode=ops_mode,
        runbook_mode=runbook_mode,
        lifecycle_mode=lifecycle_mode,
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
        lifecycle_steps=lifecycle_steps,
        runbook_steps=runbook_steps,
        ops_steps=ops_steps,
        paper_execution_steps=_execution_adapter_paper_execution_steps(
            "blocked" if unique_blocked_reasons else "recorded"
        ),
        simulated_fill=_execution_adapter_paper_execution_simulated_fill(
            order_intent,
            adapter_paper_execution_id=paper_execution_id,
            blocked=bool(unique_blocked_reasons),
        ),
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_paper_execution_to_payload(
    result: ExecutionAdapterPaperExecutionResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "adapterPaperExecutionId": result.adapter_paper_execution_id,
        "adapterOpsStateId": result.adapter_ops_state_id,
        "paperRouteRunbookId": result.paper_route_runbook_id,
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
        "paperExecutionMode": result.paper_execution_mode,
        "opsMode": result.ops_mode,
        "runbookMode": result.runbook_mode,
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
        "runbookSteps": result.runbook_steps,
        "opsSteps": result.ops_steps,
        "paperExecutionSteps": result.paper_execution_steps,
        "simulatedFill": result.simulated_fill,
        "paperFillRecorded": result.status == "paper_execution_recorded",
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_execution_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_paper_execution":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    adapter_paper_execution_id = str(
        metadata.get("adapterPaperExecutionId") or getattr(event, "event_id", "")
    ).strip()
    adapter_ops_state_id = str(metadata.get("adapterOpsStateId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    route = str(metadata.get("route") or "").strip()
    if not adapter_paper_execution_id or not adapter_ops_state_id or not adapter_id:
        return None
    if status not in {"blocked", "paper_execution_recorded"} or route not in {"paper", "live"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_paper_execution_specs():
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
    recorded_at_value = (
        recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    )
    order_intent = metadata.get("orderIntent") if isinstance(metadata.get("orderIntent"), dict) else {}
    lifecycle_steps = metadata.get("lifecycleSteps") if isinstance(metadata.get("lifecycleSteps"), list) else []
    runbook_steps = metadata.get("runbookSteps") if isinstance(metadata.get("runbookSteps"), list) else []
    ops_steps = metadata.get("opsSteps") if isinstance(metadata.get("opsSteps"), list) else []
    paper_execution_steps = (
        metadata.get("paperExecutionSteps") if isinstance(metadata.get("paperExecutionSteps"), list) else []
    )
    simulated_fill = metadata.get("simulatedFill") if isinstance(metadata.get("simulatedFill"), dict) else {}

    return {
        "schemaVersion": 1,
        "adapterPaperExecutionId": adapter_paper_execution_id,
        "adapterOpsStateId": adapter_ops_state_id,
        "paperRouteRunbookId": str(metadata.get("paperRouteRunbookId") or "").strip(),
        "paperOrderLifecycleId": str(metadata.get("paperOrderLifecycleId") or "").strip(),
        "sandboxOrderSchemaDryRunId": str(metadata.get("sandboxOrderSchemaDryRunId") or "").strip(),
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
        "paperExecutionMode": str(metadata.get("paperExecutionMode") or "manual_adapter_paper_execution").strip(),
        "opsMode": str(metadata.get("opsMode") or "manual_adapter_ops_state").strip(),
        "runbookMode": str(metadata.get("runbookMode") or "").strip(),
        "lifecycleMode": str(metadata.get("lifecycleMode") or "").strip(),
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
        "runbookSteps": [
            _redact_secret_fields(item)
            for item in runbook_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "opsSteps": [
            _redact_secret_fields(item)
            for item in ops_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "paperExecutionSteps": [
            _redact_secret_fields(item)
            for item in paper_execution_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "simulatedFill": _redact_secret_fields(simulated_fill),
        "paperFillRecorded": status == "paper_execution_recorded",
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
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


def execution_adapter_paper_execution_to_audit_event_payload(
    result: ExecutionAdapterPaperExecutionResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.adapter_paper_execution_id,
        "eventType": "execution_adapter_paper_execution",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-paper-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter paper execution {status_label} as {result.status}.",
        "detail": "Adapter paper execution records local simulated fill evidence only; no live route or order submission is allowed.",
        "metadata": _redact_secret_fields(
            {
                "adapterPaperExecutionId": result.adapter_paper_execution_id,
                "adapterOpsStateId": result.adapter_ops_state_id,
                "paperRouteRunbookId": result.paper_route_runbook_id,
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
                "paperExecutionMode": result.paper_execution_mode,
                "opsMode": result.ops_mode,
                "runbookMode": result.runbook_mode,
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
                "runbookSteps": result.runbook_steps,
                "opsSteps": result.ops_steps,
                "paperExecutionSteps": result.paper_execution_steps,
                "simulatedFill": result.simulated_fill,
                "paperFillRecorded": result.status == "paper_execution_recorded",
                "orderSubmitted": False,
                "liveOrderSubmitted": False,
                "routeExecuted": False,
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


def _execution_adapter_paper_execution_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "ops-state-accepted",
            "opsStateAccepted",
            "Adapter ops state was accepted as paper execution input",
            "adapter_paper_execution_ops_state_not_accepted",
        ),
        (
            "paper-account-synced",
            "paperAccountSynced",
            "Paper account snapshot was synced",
            "adapter_paper_execution_account_not_synced",
        ),
        (
            "risk-budget-bound",
            "riskBudgetBound",
            "Risk budget was bound before paper fill",
            "adapter_paper_execution_risk_budget_not_bound",
        ),
        (
            "simulated-fill-generated",
            "simulatedFillGenerated",
            "Simulated fill was generated locally",
            "adapter_paper_execution_fill_not_generated",
        ),
        (
            "operator-confirmed-no-live-routing",
            "operatorConfirmedNoLiveRouting",
            "Operator confirmed no live route was touched",
            "adapter_paper_execution_no_live_route_boundary_missing",
        ),
    ]


def _execution_adapter_paper_execution_steps(status: str) -> list[dict[str, Any]]:
    normalized_status = "recorded" if status == "recorded" else "blocked"
    return [
        {"id": "ops-state-linked", "label": "Adapter ops state linked", "status": normalized_status},
        {"id": "paper-account-synced", "label": "Paper account synced", "status": normalized_status},
        {"id": "risk-budget-bound", "label": "Risk budget bound", "status": normalized_status},
        {"id": "simulated-fill-recorded", "label": "Simulated fill recorded", "status": normalized_status},
    ]


def _execution_adapter_paper_execution_simulated_fill(
    order_intent: dict[str, Any],
    *,
    adapter_paper_execution_id: str,
    blocked: bool,
) -> dict[str, Any]:
    return _redact_secret_fields(
        {
            "fillId": f"paper-fill-{adapter_paper_execution_id}",
            "status": "blocked" if blocked else "filled",
            "symbol": str(order_intent.get("symbol") or "").strip(),
            "side": str(order_intent.get("side") or "").strip(),
            "type": str(order_intent.get("type") or "").strip(),
            "quantity": order_intent.get("quantity"),
            "price": order_intent.get("price"),
            "timeInForce": str(order_intent.get("timeInForce") or "").strip(),
            "source": "local-paper-ledger",
            "orderSubmitted": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
        }
    )
