from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterRuntimeReloadExecutionResult,
)

__all__ = [
    '_execution_adapter_runtime_reload_execution_confirmation_specs',
    'build_execution_adapter_runtime_reload_execution',
    'execution_adapter_runtime_reload_execution_payload_from_audit_event',
    'execution_adapter_runtime_reload_execution_to_audit_event_payload',
    'execution_adapter_runtime_reload_execution_to_payload',
]

def build_execution_adapter_runtime_reload_execution(
    runtime_reload_plan: dict[str, Any],
    *,
    adapter_id: str = "",
    execution_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    execution_id: str | None = None,
) -> ExecutionAdapterRuntimeReloadExecutionResult:
    if not isinstance(runtime_reload_plan, dict):
        raise ValueError("execution_adapter_runtime_reload_plan_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    plan_id = str(runtime_reload_plan.get("planId") or "").strip()
    binding_id = str(runtime_reload_plan.get("bindingId") or "").strip()
    materialization_id = str(runtime_reload_plan.get("materializationId") or "").strip()
    manifest_validation_id = str(runtime_reload_plan.get("manifestValidationId") or "").strip()
    plan_adapter_id = str(runtime_reload_plan.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or plan_adapter_id).strip()
    market = str(runtime_reload_plan.get("market") or "").strip()
    route = str(runtime_reload_plan.get("route") or "").strip()
    normalized_execution_mode = str(execution_mode or "manual_controlled_reload").strip()
    reload_mode = str(runtime_reload_plan.get("reloadMode") or "").strip()
    maintenance_window_id = str(runtime_reload_plan.get("maintenanceWindowId") or "").strip()
    binding_mode = str(runtime_reload_plan.get("bindingMode") or "").strip()
    manifest_path = str(runtime_reload_plan.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in runtime_reload_plan.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not plan_id:
        raise ValueError("execution_adapter_runtime_reload_execution_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_runtime_reload_execution_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_runtime_reload_execution_materialization_id_required")
    if not plan_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_execution_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_execution_adapter_id_required")
    if requested_adapter_id != plan_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_execution_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_runtime_reload_execution_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_runtime_reload_execution_route_invalid")
    if not normalized_execution_mode:
        raise ValueError("execution_adapter_runtime_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_runtime_reload_execution_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_runtime_reload_execution_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_runtime_reload_execution_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_runtime_reload_execution_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_runtime_reload_execution_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_runtime_reload_execution_confirmation_specs():
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

    if str(runtime_reload_plan.get("status") or "") != "plan_recorded":
        blocked_reasons.append("runtime_reload_execution_plan_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("runtime_reload_execution_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("runtime_reload_execution_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_runtime_reload_execution_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterRuntimeReloadExecutionResult(
        execution_id=str(execution_id or f"execution-adapter-runtime-reload-execution-{plan_id}-{uuid4()}"),
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=plan_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "execution_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        execution_mode=normalized_execution_mode,
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


def execution_adapter_runtime_reload_execution_to_payload(
    result: ExecutionAdapterRuntimeReloadExecutionResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
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


def execution_adapter_runtime_reload_execution_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_runtime_reload_execution":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    execution_id = str(metadata.get("executionId") or getattr(event, "event_id", "")).strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if not execution_id or not plan_id or not binding_id or not materialization_id or not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "execution_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_runtime_reload_execution_confirmation_specs():
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


def execution_adapter_runtime_reload_execution_to_audit_event_payload(
    result: ExecutionAdapterRuntimeReloadExecutionResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.execution_id,
        "eventType": "execution_adapter_runtime_reload_execution",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-runtime-reload-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} runtime reload execution {status_label} as {result.status}.",
        "detail": "Runtime reload execution stores operator evidence only; no restart is executed and live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
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


def _execution_adapter_runtime_reload_execution_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "pre-reload-health-verified",
            "preReloadHealthVerified",
            "Pre-reload health is verified",
            "runtime_reload_execution_pre_health_missing",
        ),
        (
            "reload-action-recorded",
            "reloadActionRecorded",
            "Reload action is recorded",
            "runtime_reload_execution_action_record_missing",
        ),
        (
            "post-reload-smoke-passed",
            "postReloadSmokePassed",
            "Post-reload smoke passed",
            "runtime_reload_execution_post_smoke_missing",
        ),
        (
            "rollback-readiness-confirmed",
            "rollbackReadinessConfirmed",
            "Rollback readiness is confirmed",
            "runtime_reload_execution_rollback_readiness_missing",
        ),
        (
            "operator-confirmed-live-blocked",
            "operatorConfirmedLiveBlocked",
            "Operator confirmed live routing remains blocked",
            "runtime_reload_execution_live_block_boundary_missing",
        ),
    ]
