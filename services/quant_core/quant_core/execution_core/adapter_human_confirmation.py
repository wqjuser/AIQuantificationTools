from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterHumanConfirmationResult,
)

__all__ = [
    '_execution_adapter_human_confirmation_specs',
    'build_execution_adapter_human_confirmation',
    'execution_adapter_human_confirmation_payload_from_audit_event',
    'execution_adapter_human_confirmation_to_audit_event_payload',
    'execution_adapter_human_confirmation_to_payload',
]

def build_execution_adapter_human_confirmation(
    orchestration_execution: dict[str, Any],
    *,
    adapter_id: str = "",
    confirmation_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    human_confirmation_id: str | None = None,
) -> ExecutionAdapterHumanConfirmationResult:
    if not isinstance(orchestration_execution, dict):
        raise ValueError("execution_adapter_orchestration_execution_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    orchestration_execution_id = str(orchestration_execution.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(orchestration_execution.get("dryRunId") or "").strip()
    acceptance_id = str(orchestration_execution.get("acceptanceId") or "").strip()
    execution_id = str(orchestration_execution.get("executionId") or "").strip()
    plan_id = str(orchestration_execution.get("planId") or "").strip()
    binding_id = str(orchestration_execution.get("bindingId") or "").strip()
    materialization_id = str(orchestration_execution.get("materializationId") or "").strip()
    manifest_validation_id = str(orchestration_execution.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(orchestration_execution.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(orchestration_execution.get("market") or "").strip()
    route = str(orchestration_execution.get("route") or "").strip()
    normalized_confirmation_mode = str(confirmation_mode or "manual_final_human_confirmation").strip()
    orchestration_execution_mode = str(orchestration_execution.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(orchestration_execution.get("orchestrationMode") or "").strip()
    acceptance_mode = str(orchestration_execution.get("acceptanceMode") or "").strip()
    execution_mode = str(orchestration_execution.get("executionMode") or "").strip()
    reload_mode = str(orchestration_execution.get("reloadMode") or "").strip()
    maintenance_window_id = str(orchestration_execution.get("maintenanceWindowId") or "").strip()
    binding_mode = str(orchestration_execution.get("bindingMode") or "").strip()
    manifest_path = str(orchestration_execution.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in orchestration_execution.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not orchestration_execution_id:
        raise ValueError("execution_adapter_human_confirmation_orchestration_execution_id_required")
    if not dry_run_id:
        raise ValueError("execution_adapter_human_confirmation_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_human_confirmation_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_human_confirmation_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_human_confirmation_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_human_confirmation_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_human_confirmation_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_human_confirmation_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_human_confirmation_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_human_confirmation_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_human_confirmation_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_human_confirmation_route_invalid")
    if not normalized_confirmation_mode:
        raise ValueError("execution_adapter_human_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_human_confirmation_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_human_confirmation_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_human_confirmation_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_human_confirmation_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_human_confirmation_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_human_confirmation_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_human_confirmation_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_human_confirmation_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_human_confirmation_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_human_confirmation_specs():
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

    if str(orchestration_execution.get("status") or "") != "execution_recorded":
        blocked_reasons.append("human_confirmation_orchestration_execution_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("human_confirmation_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("human_confirmation_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_human_confirmation_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterHumanConfirmationResult(
        human_confirmation_id=str(
            human_confirmation_id
            or f"execution-adapter-human-confirmation-{orchestration_execution_id}-{uuid4()}"
        ),
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "confirmation_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        confirmation_mode=normalized_confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_human_confirmation_to_payload(
    result: ExecutionAdapterHumanConfirmationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
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
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_human_confirmation_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_human_confirmation":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    human_confirmation_id = str(metadata.get("humanConfirmationId") or getattr(event, "event_id", "")).strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
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
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    confirmation_mode = str(metadata.get("confirmationMode") or "manual_final_human_confirmation").strip()
    orchestration_execution_mode = str(metadata.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not human_confirmation_id
        or not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "confirmation_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_human_confirmation_specs():
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
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
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
        "operator": operator,
        "recordedAt": recorded_at_value,
        "confirmationMode": confirmation_mode,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
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


def execution_adapter_human_confirmation_to_audit_event_payload(
    result: ExecutionAdapterHumanConfirmationResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.human_confirmation_id,
        "eventType": "execution_adapter_human_confirmation",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-human-confirmation",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter human confirmation {status_label} as {result.status}.",
        "detail": "Adapter human confirmation records final review evidence only; broker connections and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
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


def _execution_adapter_human_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "orchestration-execution-reviewed",
            "orchestrationExecutionReviewed",
            "Controlled adapter orchestration execution evidence was reviewed",
            "human_confirmation_orchestration_execution_not_reviewed",
        ),
        (
            "risk-approval-still-valid",
            "riskApprovalStillValid",
            "Risk approval remains valid for the selected strategy and adapter",
            "human_confirmation_risk_approval_not_current",
        ),
        (
            "paper-execution-reviewed",
            "paperExecutionReviewed",
            "Paper execution result was reviewed before final confirmation",
            "human_confirmation_paper_execution_not_reviewed",
        ),
        (
            "kill-switch-ready",
            "killSwitchReady",
            "Kill switch and rollback contacts are ready",
            "human_confirmation_kill_switch_not_ready",
        ),
        (
            "operator-confirmed-final-boundary",
            "operatorConfirmedFinalBoundary",
            "Operator confirmed no automatic live routing is enabled by this record",
            "human_confirmation_final_boundary_missing",
        ),
    ]
