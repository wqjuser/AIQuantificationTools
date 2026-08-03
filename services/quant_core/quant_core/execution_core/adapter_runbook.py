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
    ExecutionAdapterPaperRouteRunbookResult,
)

__all__ = [
    '_execution_adapter_paper_route_runbook_specs',
    '_execution_adapter_paper_route_runbook_steps',
    'build_execution_adapter_paper_route_runbook',
    'execution_adapter_paper_route_runbook_payload_from_audit_event',
    'execution_adapter_paper_route_runbook_to_audit_event_payload',
    'execution_adapter_paper_route_runbook_to_payload',
]

def build_execution_adapter_paper_route_runbook(
    paper_order_lifecycle: dict[str, Any],
    *,
    adapter_id: str = "",
    runbook_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    paper_route_runbook_id: str | None = None,
) -> ExecutionAdapterPaperRouteRunbookResult:
    if not isinstance(paper_order_lifecycle, dict):
        raise ValueError("execution_adapter_paper_route_runbook_lifecycle_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    paper_order_lifecycle_id = str(paper_order_lifecycle.get("paperOrderLifecycleId") or "").strip()
    schema_dry_run_id = str(paper_order_lifecycle.get("sandboxOrderSchemaDryRunId") or "").strip()
    production_route_review_id = str(paper_order_lifecycle.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(paper_order_lifecycle.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(paper_order_lifecycle.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(paper_order_lifecycle.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(paper_order_lifecycle.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(paper_order_lifecycle.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(paper_order_lifecycle.get("dryRunId") or "").strip()
    acceptance_id = str(paper_order_lifecycle.get("acceptanceId") or "").strip()
    execution_id = str(paper_order_lifecycle.get("executionId") or "").strip()
    plan_id = str(paper_order_lifecycle.get("planId") or "").strip()
    binding_id = str(paper_order_lifecycle.get("bindingId") or "").strip()
    materialization_id = str(paper_order_lifecycle.get("materializationId") or "").strip()
    manifest_validation_id = str(paper_order_lifecycle.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(paper_order_lifecycle.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(paper_order_lifecycle.get("market") or "").strip()
    route = str(paper_order_lifecycle.get("route") or "").strip()
    normalized_runbook_mode = str(runbook_mode or "manual_paper_route_runbook").strip()
    lifecycle_mode = str(paper_order_lifecycle.get("lifecycleMode") or "").strip()
    dry_run_mode = str(paper_order_lifecycle.get("dryRunMode") or "").strip()
    review_mode = str(paper_order_lifecycle.get("reviewMode") or "").strip()
    sandbox_review_mode = str(paper_order_lifecycle.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(paper_order_lifecycle.get("probeExecutionMode") or "").strip()
    probe_mode = str(paper_order_lifecycle.get("probeMode") or "").strip()
    confirmation_mode = str(paper_order_lifecycle.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(paper_order_lifecycle.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(paper_order_lifecycle.get("orchestrationMode") or "").strip()
    acceptance_mode = str(paper_order_lifecycle.get("acceptanceMode") or "").strip()
    execution_mode = str(paper_order_lifecycle.get("executionMode") or "").strip()
    reload_mode = str(paper_order_lifecycle.get("reloadMode") or "").strip()
    maintenance_window_id = str(paper_order_lifecycle.get("maintenanceWindowId") or "").strip()
    binding_mode = str(paper_order_lifecycle.get("bindingMode") or "").strip()
    manifest_path = str(paper_order_lifecycle.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in paper_order_lifecycle.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not paper_order_lifecycle_id:
        raise ValueError("execution_adapter_paper_route_runbook_lifecycle_id_required")
    if not schema_dry_run_id:
        raise ValueError("execution_adapter_paper_route_runbook_schema_dry_run_id_required")
    if not production_route_review_id:
        raise ValueError("execution_adapter_paper_route_runbook_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_paper_route_runbook_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_paper_route_runbook_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_paper_route_runbook_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_paper_route_runbook_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_paper_route_runbook_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_paper_route_runbook_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_paper_route_runbook_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_paper_route_runbook_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_paper_route_runbook_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_paper_route_runbook_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_paper_route_runbook_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_paper_route_runbook_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_paper_route_runbook_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_paper_route_runbook_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_paper_route_runbook_route_invalid")
    if not normalized_runbook_mode:
        raise ValueError("execution_adapter_paper_route_runbook_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_paper_route_runbook_required_env_vars_required")

    order_intent = _redact_secret_fields(
        paper_order_lifecycle.get("orderIntent") if isinstance(paper_order_lifecycle.get("orderIntent"), dict) else {}
    )
    lifecycle_steps = [
        _redact_secret_fields(item)
        for item in paper_order_lifecycle.get("lifecycleSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_paper_route_runbook_specs():
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

    if str(paper_order_lifecycle.get("status") or "") != "lifecycle_recorded":
        blocked_reasons.append("paper_route_runbook_lifecycle_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("paper_route_runbook_manifest_validation_missing")
    if bool(paper_order_lifecycle.get("orderSubmitted")) or bool(paper_order_lifecycle.get("liveOrderSubmitted")):
        blocked_reasons.append("paper_route_runbook_prior_order_submission_detected")
    if not _sandbox_order_schema_intent_is_valid(order_intent):
        blocked_reasons.append("paper_route_runbook_order_intent_invalid")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_paper_route_runbook_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterPaperRouteRunbookResult(
        paper_route_runbook_id=str(
            paper_route_runbook_id
            or f"execution-adapter-paper-route-runbook-{paper_order_lifecycle_id}-{uuid4()}"
        ),
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
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "runbook_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        runbook_mode=normalized_runbook_mode,
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
        runbook_steps=_execution_adapter_paper_route_runbook_steps(
            "blocked" if unique_blocked_reasons else "recorded"
        ),
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_paper_route_runbook_to_payload(
    result: ExecutionAdapterPaperRouteRunbookResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
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
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_route_runbook_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_paper_route_runbook":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    paper_route_runbook_id = str(metadata.get("paperRouteRunbookId") or getattr(event, "event_id", "")).strip()
    paper_order_lifecycle_id = str(metadata.get("paperOrderLifecycleId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    route = str(metadata.get("route") or "").strip()
    if not paper_route_runbook_id or not paper_order_lifecycle_id or not adapter_id:
        return None
    if status not in {"blocked", "runbook_recorded"} or route not in {"paper", "live"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_paper_route_runbook_specs():
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
    runbook_steps = metadata.get("runbookSteps") if isinstance(metadata.get("runbookSteps"), list) else []

    return {
        "schemaVersion": 1,
        "paperRouteRunbookId": paper_route_runbook_id,
        "paperOrderLifecycleId": paper_order_lifecycle_id,
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
        "runbookMode": str(metadata.get("runbookMode") or "manual_paper_route_runbook").strip(),
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


def execution_adapter_paper_route_runbook_to_audit_event_payload(
    result: ExecutionAdapterPaperRouteRunbookResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.paper_route_runbook_id,
        "eventType": "execution_adapter_paper_route_runbook",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-paper-route-runbook",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} paper route runbook {status_label} as {result.status}.",
        "detail": "Paper route runbook records the controlled simulation plan only; no route is executed.",
        "metadata": _redact_secret_fields(
            {
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


def _execution_adapter_paper_route_runbook_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "paper-lifecycle-accepted",
            "paperLifecycleAccepted",
            "Paper order lifecycle was accepted as runbook input",
            "paper_route_runbook_lifecycle_not_accepted",
        ),
        (
            "paper-account-snapshot-captured",
            "paperAccountSnapshotCaptured",
            "Paper account snapshot was captured before simulation",
            "paper_route_runbook_account_snapshot_missing",
        ),
        (
            "risk-controls-verified",
            "riskControlsVerified",
            "Risk controls were verified before simulated routing",
            "paper_route_runbook_risk_controls_not_verified",
        ),
        (
            "replay-plan-recorded",
            "replayPlanRecorded",
            "Replay plan was recorded before simulation",
            "paper_route_runbook_replay_plan_missing",
        ),
        (
            "operator-confirmed-no-live-routing",
            "operatorConfirmedNoLiveRouting",
            "Operator confirmed no live route will be executed",
            "paper_route_runbook_no_live_route_boundary_missing",
        ),
    ]


def _execution_adapter_paper_route_runbook_steps(status: str) -> list[dict[str, Any]]:
    normalized_status = "recorded" if status == "recorded" else "blocked"
    return [
        {"id": "lifecycle-evidence-linked", "label": "Paper lifecycle evidence linked", "status": normalized_status},
        {"id": "paper-account-snapshot-bound", "label": "Paper account snapshot bound", "status": normalized_status},
        {"id": "risk-controls-verified", "label": "Risk controls verified", "status": normalized_status},
        {"id": "replay-plan-recorded", "label": "Replay plan recorded", "status": normalized_status},
    ]
