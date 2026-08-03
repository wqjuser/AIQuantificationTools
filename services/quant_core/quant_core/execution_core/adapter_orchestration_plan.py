from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterOrchestrationDryRunResult,
)

__all__ = [
    '_execution_adapter_orchestration_dry_run_confirmation_specs',
    'build_execution_adapter_orchestration_dry_run',
    'execution_adapter_orchestration_dry_run_payload_from_audit_event',
    'execution_adapter_orchestration_dry_run_to_audit_event_payload',
    'execution_adapter_orchestration_dry_run_to_payload',
]

def build_execution_adapter_orchestration_dry_run(
    runtime_reload_acceptance: dict[str, Any],
    *,
    adapter_id: str = "",
    orchestration_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    dry_run_id: str | None = None,
) -> ExecutionAdapterOrchestrationDryRunResult:
    if not isinstance(runtime_reload_acceptance, dict):
        raise ValueError("execution_adapter_runtime_reload_acceptance_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    acceptance_id = str(runtime_reload_acceptance.get("acceptanceId") or "").strip()
    execution_id = str(runtime_reload_acceptance.get("executionId") or "").strip()
    plan_id = str(runtime_reload_acceptance.get("planId") or "").strip()
    binding_id = str(runtime_reload_acceptance.get("bindingId") or "").strip()
    materialization_id = str(runtime_reload_acceptance.get("materializationId") or "").strip()
    manifest_validation_id = str(runtime_reload_acceptance.get("manifestValidationId") or "").strip()
    acceptance_adapter_id = str(runtime_reload_acceptance.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or acceptance_adapter_id).strip()
    market = str(runtime_reload_acceptance.get("market") or "").strip()
    route = str(runtime_reload_acceptance.get("route") or "").strip()
    acceptance_mode = str(runtime_reload_acceptance.get("acceptanceMode") or "").strip()
    execution_mode = str(runtime_reload_acceptance.get("executionMode") or "").strip()
    reload_mode = str(runtime_reload_acceptance.get("reloadMode") or "").strip()
    maintenance_window_id = str(runtime_reload_acceptance.get("maintenanceWindowId") or "").strip()
    binding_mode = str(runtime_reload_acceptance.get("bindingMode") or "").strip()
    manifest_path = str(runtime_reload_acceptance.get("manifestPath") or "").strip()
    normalized_orchestration_mode = str(orchestration_mode or "manual_adapter_orchestration_dry_run").strip()
    required_env_vars = [
        str(item).strip()
        for item in runtime_reload_acceptance.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not acceptance_id:
        raise ValueError("execution_adapter_orchestration_dry_run_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_orchestration_dry_run_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_orchestration_dry_run_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_orchestration_dry_run_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_orchestration_dry_run_materialization_id_required")
    if not acceptance_adapter_id:
        raise ValueError("execution_adapter_orchestration_dry_run_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_orchestration_dry_run_adapter_id_required")
    if requested_adapter_id != acceptance_adapter_id:
        raise ValueError("execution_adapter_orchestration_dry_run_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_orchestration_dry_run_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_orchestration_dry_run_route_invalid")
    if not normalized_orchestration_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_orchestration_dry_run_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_orchestration_dry_run_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_orchestration_dry_run_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_orchestration_dry_run_confirmation_specs():
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

    if str(runtime_reload_acceptance.get("status") or "") != "acceptance_recorded":
        blocked_reasons.append("orchestration_dry_run_acceptance_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("orchestration_dry_run_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("orchestration_dry_run_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_orchestration_dry_run_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterOrchestrationDryRunResult(
        dry_run_id=str(dry_run_id or f"execution-adapter-orchestration-dry-run-{acceptance_id}-{uuid4()}"),
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=acceptance_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "dry_run_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        orchestration_mode=normalized_orchestration_mode,
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


def execution_adapter_orchestration_dry_run_to_payload(
    result: ExecutionAdapterOrchestrationDryRunResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
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


def execution_adapter_orchestration_dry_run_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_orchestration_dry_run":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    dry_run_id = str(metadata.get("dryRunId") or getattr(event, "event_id", "")).strip()
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
    orchestration_mode = str(metadata.get("orchestrationMode") or "manual_adapter_orchestration_dry_run").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if not dry_run_id or not acceptance_id or not execution_id or not plan_id or not binding_id or not materialization_id:
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "dry_run_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_orchestration_dry_run_confirmation_specs():
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


def execution_adapter_orchestration_dry_run_to_audit_event_payload(
    result: ExecutionAdapterOrchestrationDryRunResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.dry_run_id,
        "eventType": "execution_adapter_orchestration_dry_run",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-orchestration-dry-run",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter orchestration dry run {status_label} as {result.status}.",
        "detail": "Adapter orchestration dry run records pre-live evidence only; broker connections and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
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


def _execution_adapter_orchestration_dry_run_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "accepted-chain-reviewed",
            "acceptedChainReviewed",
            "Runtime reload acceptance chain was reviewed",
            "orchestration_dry_run_acceptance_not_reviewed",
        ),
        (
            "sandbox-handshake-dry-run-passed",
            "sandboxHandshakeDryRunPassed",
            "Sandbox or paper adapter handshake dry run passed",
            "orchestration_dry_run_sandbox_handshake_missing",
        ),
        (
            "order-schema-dry-run-passed",
            "orderSchemaDryRunPassed",
            "Order schema dry run passed without submission",
            "orchestration_dry_run_order_schema_missing",
        ),
        (
            "account-sync-dry-run-passed",
            "accountSyncDryRunPassed",
            "Account sync dry run passed without broker mutation",
            "orchestration_dry_run_account_sync_missing",
        ),
        (
            "operator-confirmed-no-live-orders",
            "operatorConfirmedNoLiveOrders",
            "Operator confirmed no live orders were routed",
            "orchestration_dry_run_live_order_boundary_missing",
        ),
    ]
