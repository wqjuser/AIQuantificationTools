from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterRuntimeReloadPlanResult,
)

__all__ = [
    '_execution_adapter_runtime_reload_plan_confirmation_specs',
    'build_execution_adapter_runtime_reload_plan',
    'execution_adapter_runtime_reload_plan_payload_from_audit_event',
    'execution_adapter_runtime_reload_plan_to_audit_event_payload',
    'execution_adapter_runtime_reload_plan_to_payload',
]

def build_execution_adapter_runtime_reload_plan(
    environment_binding: dict[str, Any],
    *,
    adapter_id: str = "",
    reload_mode: str = "",
    maintenance_window_id: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    plan_id: str | None = None,
) -> ExecutionAdapterRuntimeReloadPlanResult:
    if not isinstance(environment_binding, dict):
        raise ValueError("execution_adapter_environment_binding_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    binding_id = str(environment_binding.get("bindingId") or "").strip()
    materialization_id = str(environment_binding.get("materializationId") or "").strip()
    manifest_validation_id = str(environment_binding.get("manifestValidationId") or "").strip()
    binding_adapter_id = str(environment_binding.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or binding_adapter_id).strip()
    market = str(environment_binding.get("market") or "").strip()
    route = str(environment_binding.get("route") or "").strip()
    normalized_reload_mode = str(reload_mode or "manual_container_reload_plan").strip()
    normalized_window_id = str(maintenance_window_id or "").strip()
    binding_mode = str(environment_binding.get("bindingMode") or "").strip()
    manifest_path = str(environment_binding.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in environment_binding.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not binding_id:
        raise ValueError("execution_adapter_runtime_reload_plan_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_runtime_reload_plan_materialization_id_required")
    if not binding_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_plan_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_plan_adapter_id_required")
    if requested_adapter_id != binding_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_plan_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_runtime_reload_plan_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_runtime_reload_plan_route_invalid")
    if not normalized_reload_mode:
        raise ValueError("execution_adapter_runtime_reload_plan_mode_required")
    if not normalized_window_id:
        raise ValueError("execution_adapter_runtime_reload_plan_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_runtime_reload_plan_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_runtime_reload_plan_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_runtime_reload_plan_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_runtime_reload_plan_confirmation_specs():
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

    if str(environment_binding.get("status") or "") != "binding_recorded":
        blocked_reasons.append("runtime_reload_environment_binding_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("runtime_reload_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("runtime_reload_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_runtime_reload_plan_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterRuntimeReloadPlanResult(
        plan_id=str(plan_id or f"execution-adapter-runtime-reload-plan-{binding_id}-{uuid4()}"),
        binding_id=binding_id,
        materialization_id=materialization_id,
        adapter_id=binding_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "plan_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        reload_mode=normalized_reload_mode,
        maintenance_window_id=normalized_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        manifest_validation_id=manifest_validation_id,
        live_trading_allowed=False,
    )


def execution_adapter_runtime_reload_plan_to_payload(
    result: ExecutionAdapterRuntimeReloadPlanResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
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


def execution_adapter_runtime_reload_plan_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_runtime_reload_plan":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    plan_id = str(metadata.get("planId") or getattr(event, "event_id", "")).strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if not plan_id or not binding_id or not materialization_id or not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "plan_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_runtime_reload_plan_confirmation_specs():
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


def execution_adapter_runtime_reload_plan_to_audit_event_payload(
    result: ExecutionAdapterRuntimeReloadPlanResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.plan_id,
        "eventType": "execution_adapter_runtime_reload_plan",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-runtime-reload-plan",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} runtime reload plan {status_label} as {result.status}.",
        "detail": "Runtime reload plan stores orchestration evidence only; no restart is executed and live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
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


def _execution_adapter_runtime_reload_plan_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "maintenance-window-approved",
            "maintenanceWindowApproved",
            "Maintenance window is approved",
            "runtime_reload_maintenance_window_missing",
        ),
        (
            "health-baseline-captured",
            "healthBaselineCaptured",
            "Pre-reload health baseline was captured",
            "runtime_reload_health_baseline_missing",
        ),
        (
            "config-diff-reviewed",
            "configDiffReviewed",
            "Configuration diff was reviewed",
            "runtime_reload_config_diff_missing",
        ),
        (
            "post-reload-smoke-plan-documented",
            "postReloadSmokePlanDocumented",
            "Post-reload smoke plan is documented",
            "runtime_reload_smoke_plan_missing",
        ),
        (
            "rollback-owner-assigned",
            "rollbackOwnerAssigned",
            "Rollback trigger owner is assigned",
            "runtime_reload_rollback_owner_missing",
        ),
    ]
