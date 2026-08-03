from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterEnvironmentBindingResult,
)

__all__ = [
    '_execution_adapter_environment_binding_confirmation_specs',
    'build_execution_adapter_environment_binding',
    'execution_adapter_environment_binding_payload_from_audit_event',
    'execution_adapter_environment_binding_to_audit_event_payload',
    'execution_adapter_environment_binding_to_payload',
]

def build_execution_adapter_environment_binding(
    materialization: dict[str, Any],
    *,
    adapter_id: str = "",
    binding_mode: str = "",
    manifest_validation: dict[str, Any] | None = None,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    binding_id: str | None = None,
) -> ExecutionAdapterEnvironmentBindingResult:
    if not isinstance(materialization, dict):
        raise ValueError("execution_adapter_secret_materialization_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    materialization_id = str(materialization.get("materializationId") or "").strip()
    materialization_adapter_id = str(materialization.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or materialization_adapter_id).strip()
    market = str(materialization.get("market") or "").strip()
    route = str(materialization.get("route") or "").strip()
    manifest_path = str(materialization.get("manifestPath") or "").strip()
    normalized_binding_mode = str(binding_mode or "container_env_reference").strip()
    manifest_validation_id = ""
    required_env_vars = [
        str(item).strip()
        for item in materialization.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not materialization_id:
        raise ValueError("execution_adapter_environment_binding_materialization_id_required")
    if not materialization_adapter_id:
        raise ValueError("execution_adapter_environment_binding_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_environment_binding_adapter_id_required")
    if requested_adapter_id != materialization_adapter_id:
        raise ValueError("execution_adapter_environment_binding_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_environment_binding_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_environment_binding_route_invalid")
    if not manifest_path:
        raise ValueError("execution_adapter_environment_binding_manifest_path_required")
    if not normalized_binding_mode:
        raise ValueError("execution_adapter_environment_binding_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_environment_binding_required_env_vars_required")

    blocked_reasons = []
    if manifest_validation is not None:
        if not isinstance(manifest_validation, dict):
            raise ValueError("execution_adapter_secret_manifest_validation_required")
        manifest_validation_id = str(manifest_validation.get("validationId") or "").strip()
        validation_materialization_id = str(manifest_validation.get("materializationId") or "").strip()
        validation_adapter_id = str(manifest_validation.get("adapterId") or "").strip()
        validation_manifest_path = str(manifest_validation.get("manifestPath") or "").strip()
        validation_required_env_vars = [
            str(item).strip()
            for item in manifest_validation.get("requiredEnvVars", [])
            if isinstance(item, str) and item.strip()
        ]
        validation_covered_env_vars = {
            str(item).strip()
            for item in manifest_validation.get("coveredEnvVars", [])
            if isinstance(item, str) and item.strip()
        }
        if not manifest_validation_id:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_id_required")
        if validation_materialization_id != materialization_id:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_materialization_mismatch")
        if validation_adapter_id != materialization_adapter_id:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_adapter_mismatch")
        if validation_manifest_path and validation_manifest_path != manifest_path:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_path_mismatch")
        if validation_required_env_vars and validation_required_env_vars != required_env_vars:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_env_vars_mismatch")
        if str(manifest_validation.get("status") or "") != "validated":
            blocked_reasons.append("environment_binding_manifest_validation_not_validated")
        missing_validated_env_vars = [name for name in required_env_vars if name not in validation_covered_env_vars]
        if missing_validated_env_vars:
            blocked_reasons.append("environment_binding_manifest_validation_env_vars_missing")

    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_environment_binding_confirmation_specs():
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

    if str(materialization.get("status") or "") != "manifest_recorded":
        blocked_reasons.append("environment_binding_materialization_not_recorded")
    if route != "live":
        blocked_reasons.append("environment_binding_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_environment_binding_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterEnvironmentBindingResult(
        binding_id=str(binding_id or f"execution-adapter-environment-binding-{materialization_id}-{uuid4()}"),
        materialization_id=materialization_id,
        adapter_id=materialization_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "binding_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        binding_mode=normalized_binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        manifest_validation_id=manifest_validation_id,
        live_trading_allowed=False,
    )


def execution_adapter_environment_binding_to_payload(
    result: ExecutionAdapterEnvironmentBindingResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_environment_binding_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_environment_binding":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    binding_id = str(metadata.get("bindingId") or getattr(event, "event_id", "")).strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    binding_mode = str(metadata.get("bindingMode") or "container_env_reference").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if (
        not binding_id
        or not materialization_id
        or not adapter_id
        or not market
        or not binding_mode
        or not manifest_path
        or not required_env_vars
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "binding_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_environment_binding_confirmation_specs():
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
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
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


def execution_adapter_environment_binding_to_audit_event_payload(
    result: ExecutionAdapterEnvironmentBindingResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.binding_id,
        "eventType": "execution_adapter_environment_binding",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-environment-binding",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} environment binding recorded as {result.status}.",
        "detail": "Environment binding records redacted runtime mapping evidence only; no environment variables are written and live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": list(result.blocked_reasons),
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


def _execution_adapter_environment_binding_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "runtime-env-mapping-verified",
            "runtimeEnvMappingVerified",
            "Runtime environment mapping was verified",
            "environment_binding_runtime_env_mapping_missing",
        ),
        (
            "config-reload-plan-documented",
            "configReloadPlanDocumented",
            "Config reload plan is documented",
            "environment_binding_config_reload_plan_missing",
        ),
        (
            "no-raw-secret-in-payload",
            "noRawSecretInPayload",
            "No raw secret is present in this payload",
            "environment_binding_raw_secret_boundary_not_confirmed",
        ),
        (
            "rollback-snapshot-recorded",
            "rollbackSnapshotRecorded",
            "Rollback snapshot is recorded",
            "environment_binding_rollback_snapshot_missing",
        ),
    ]
