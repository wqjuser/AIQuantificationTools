from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4
from .adapter_secret_validation import (
    _execution_adapter_secret_manifest_fingerprint,
    _resolve_execution_adapter_secret_manifest_path,
)
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterSecretMaterializationResult,
)

__all__ = [
    '_execution_adapter_secret_materialization_confirmation_specs',
    'build_execution_adapter_secret_materialization',
    'execution_adapter_secret_materialization_payload_from_audit_event',
    'execution_adapter_secret_materialization_to_audit_event_payload',
    'execution_adapter_secret_materialization_to_payload',
    'materialize_execution_adapter_secret_manifest',
]

def build_execution_adapter_secret_materialization(
    secret_reference: dict[str, Any],
    *,
    adapter_id: str = "",
    manifest_path: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    materialization_id: str | None = None,
) -> ExecutionAdapterSecretMaterializationResult:
    if not isinstance(secret_reference, dict):
        raise ValueError("execution_adapter_secret_reference_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    reference_id = str(secret_reference.get("referenceId") or "").strip()
    reference_adapter_id = str(secret_reference.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or reference_adapter_id).strip()
    market = str(secret_reference.get("market") or "").strip()
    route = str(secret_reference.get("route") or "").strip()
    reference_name = str(secret_reference.get("referenceName") or "").strip()
    backend = str(secret_reference.get("backend") or "").strip()
    normalized_manifest_path = str(manifest_path or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in secret_reference.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not reference_id:
        raise ValueError("execution_adapter_secret_materialization_reference_id_required")
    if not reference_adapter_id:
        raise ValueError("execution_adapter_secret_materialization_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_secret_materialization_adapter_id_required")
    if requested_adapter_id != reference_adapter_id:
        raise ValueError("execution_adapter_secret_materialization_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_secret_materialization_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_secret_materialization_route_invalid")
    if not reference_name:
        raise ValueError("execution_adapter_secret_materialization_reference_name_required")
    if not backend:
        raise ValueError("execution_adapter_secret_materialization_backend_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_secret_materialization_required_env_vars_required")
    if not normalized_manifest_path:
        raise ValueError("execution_adapter_secret_materialization_manifest_path_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_secret_materialization_confirmation_specs():
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

    if str(secret_reference.get("status") or "") != "reference_recorded":
        blocked_reasons.append("secret_materialization_reference_not_recorded")
    if route != "live":
        blocked_reasons.append("secret_materialization_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_secret_materialization_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSecretMaterializationResult(
        materialization_id=str(
            materialization_id or f"execution-adapter-secret-materialization-{reference_id}-{uuid4()}"
        ),
        reference_id=reference_id,
        adapter_id=reference_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "manifest_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        materialization_mode="local_secret_store_manifest",
        reference_name=reference_name,
        backend=backend,
        manifest_path=normalized_manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_secret_materialization_to_payload(
    result: ExecutionAdapterSecretMaterializationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "materializationId": result.materialization_id,
        "referenceId": result.reference_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "materializationMode": result.materialization_mode,
        "referenceName": result.reference_name,
        "backend": result.backend,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_materialization_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_secret_materialization":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    materialization_id = str(metadata.get("materializationId") or getattr(event, "event_id", "")).strip()
    reference_id = str(metadata.get("referenceId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    materialization_mode = str(metadata.get("materializationMode") or "local_secret_store_manifest").strip()
    reference_name = str(metadata.get("referenceName") or "").strip()
    backend = str(metadata.get("backend") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if (
        not materialization_id
        or not reference_id
        or not adapter_id
        or not market
        or not materialization_mode
        or not reference_name
        or not backend
        or not manifest_path
        or not required_env_vars
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "manifest_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_secret_materialization_confirmation_specs():
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
        "materializationId": materialization_id,
        "referenceId": reference_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "materializationMode": materialization_mode,
        "referenceName": reference_name,
        "backend": backend,
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


def execution_adapter_secret_materialization_to_audit_event_payload(
    result: ExecutionAdapterSecretMaterializationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.materialization_id,
        "eventType": "execution_adapter_secret_materialization",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-secret-materialization",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} secret materialization manifest recorded as {result.status}.",
        "detail": "Secret materialization stores a redacted local manifest reference only; raw secrets and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "materializationId": result.materialization_id,
                "referenceId": result.reference_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "materializationMode": result.materialization_mode,
                "referenceName": result.reference_name,
                "backend": result.backend,
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


def materialize_execution_adapter_secret_manifest(
    result: ExecutionAdapterSecretMaterializationResult,
    *,
    secret_store_root: str | Path | None = None,
) -> dict[str, Any]:
    if result.status != "manifest_recorded":
        return {"written": False, "reason": "materialization_not_recorded", "rawSecretValuesStored": False}
    if result.backend != "local-secret-store":
        return {"written": False, "reason": "backend_not_local_secret_store", "rawSecretValuesStored": False}

    resolved_path = _resolve_execution_adapter_secret_manifest_path(
        result.manifest_path,
        secret_store_root=secret_store_root,
    )
    if resolved_path is None:
        return {"written": False, "reason": "manifest_path_invalid", "rawSecretValuesStored": False}

    fingerprint = _execution_adapter_secret_manifest_fingerprint(result.metadata)
    if not fingerprint:
        return {"written": False, "reason": "fingerprint_missing", "rawSecretValuesStored": False}

    manifest = {
        "schemaVersion": 1,
        "kind": "aiqt.executionAdapterSecretManifest",
        "adapterId": result.adapter_id,
        "referenceId": result.reference_id,
        "materializationId": result.materialization_id,
        "market": result.market,
        "route": result.route,
        "backend": result.backend,
        "referenceName": result.reference_name,
        "manifestPath": result.manifest_path,
        "fingerprint": fingerprint,
        "requiredEnvVars": list(result.required_env_vars),
        "secretRefs": {name: {"backend": result.backend, "valueStoredOutsideManifest": True} for name in result.required_env_vars},
        "metadata": {
            "source": result.metadata.get("source", ""),
            "operator": result.operator,
            "recordedAt": result.recorded_at.isoformat(),
        },
        "rawSecretValuesStored": False,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }
    try:
        resolved_path.parent.mkdir(parents=True, exist_ok=True)
        resolved_path.write_text(
            json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
            encoding="utf-8",
        )
    except OSError:
        return {"written": False, "reason": "manifest_file_write_failed", "rawSecretValuesStored": False}
    return {
        "written": True,
        "manifestPath": result.manifest_path,
        "requiredEnvVarCount": len(result.required_env_vars),
        "rawSecretValuesStored": False,
    }


def _execution_adapter_secret_materialization_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "local-secret-store-write-verified",
            "localSecretStoreWriteVerified",
            "Local secret-store write was verified",
            "secret_materialization_local_store_not_verified",
        ),
        (
            "no-raw-secret-in-payload",
            "noRawSecretInPayload",
            "No raw secret is present in this payload",
            "secret_materialization_raw_secret_boundary_not_confirmed",
        ),
        (
            "env-binding-plan-documented",
            "envBindingPlanDocumented",
            "Environment binding plan is documented",
            "secret_materialization_env_binding_plan_missing",
        ),
        (
            "rollback-plan-documented",
            "rollbackPlanDocumented",
            "Rollback plan is documented",
            "secret_materialization_rollback_plan_missing",
        ),
    ]
