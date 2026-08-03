from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterSecretManifestValidationResult,
)

__all__ = [
    '_execution_adapter_secret_manifest_env_vars',
    '_execution_adapter_secret_manifest_fingerprint',
    '_resolve_execution_adapter_secret_manifest_path',
    'build_execution_adapter_secret_manifest_validation',
    'execution_adapter_secret_manifest_validation_payload_from_audit_event',
    'execution_adapter_secret_manifest_validation_to_audit_event_payload',
    'execution_adapter_secret_manifest_validation_to_payload',
]

def build_execution_adapter_secret_manifest_validation(
    materialization: dict[str, Any],
    *,
    adapter_id: str = "",
    manifest_path: str = "",
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    validation_id: str | None = None,
    secret_store_root: str | Path | None = None,
) -> ExecutionAdapterSecretManifestValidationResult:
    if not isinstance(materialization, dict):
        raise ValueError("execution_adapter_secret_materialization_required")

    materialization_id = str(materialization.get("materializationId") or "").strip()
    reference_id = str(materialization.get("referenceId") or "").strip()
    materialization_adapter_id = str(materialization.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or materialization_adapter_id).strip()
    market = str(materialization.get("market") or "").strip()
    route = str(materialization.get("route") or "").strip()
    reference_name = str(materialization.get("referenceName") or "").strip()
    backend = str(materialization.get("backend") or "").strip()
    normalized_manifest_path = str(manifest_path or materialization.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in materialization.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not materialization_id:
        raise ValueError("execution_adapter_secret_manifest_validation_materialization_id_required")
    if not reference_id:
        raise ValueError("execution_adapter_secret_manifest_validation_reference_id_required")
    if not materialization_adapter_id:
        raise ValueError("execution_adapter_secret_manifest_validation_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_secret_manifest_validation_adapter_id_required")
    if requested_adapter_id != materialization_adapter_id:
        raise ValueError("execution_adapter_secret_manifest_validation_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_secret_manifest_validation_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_secret_manifest_validation_route_invalid")
    if not reference_name:
        raise ValueError("execution_adapter_secret_manifest_validation_reference_name_required")
    if not backend:
        raise ValueError("execution_adapter_secret_manifest_validation_backend_required")
    if not normalized_manifest_path:
        raise ValueError("execution_adapter_secret_manifest_validation_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_secret_manifest_validation_required_env_vars_required")

    blocked_reasons: list[str] = []
    fingerprint = ""
    covered_env_vars: list[str] = []
    manifest_exists = False
    manifest_json_valid = False
    resolved_path = _resolve_execution_adapter_secret_manifest_path(
        normalized_manifest_path,
        secret_store_root=secret_store_root,
    )
    if str(materialization.get("status") or "") != "manifest_recorded":
        blocked_reasons.append("secret_manifest_validation_materialization_not_recorded")
    if route != "live":
        blocked_reasons.append("secret_manifest_validation_route_not_live")
    if resolved_path is None:
        blocked_reasons.append("secret_manifest_path_invalid")
    else:
        try:
            manifest_payload = json.loads(resolved_path.read_text(encoding="utf-8"))
            manifest_exists = True
            manifest_json_valid = isinstance(manifest_payload, dict)
            if not isinstance(manifest_payload, dict):
                blocked_reasons.append("secret_manifest_invalid_json")
            else:
                fingerprint = _execution_adapter_secret_manifest_fingerprint(manifest_payload)
                covered_env_vars = _execution_adapter_secret_manifest_env_vars(manifest_payload)
                if not fingerprint:
                    blocked_reasons.append("secret_manifest_fingerprint_missing")
                missing_env_vars = [name for name in required_env_vars if name not in set(covered_env_vars)]
                if missing_env_vars:
                    blocked_reasons.append("secret_manifest_required_env_vars_missing")
        except FileNotFoundError:
            blocked_reasons.append("secret_manifest_file_missing")
        except OSError:
            blocked_reasons.append("secret_manifest_file_unreadable")
        except json.JSONDecodeError:
            manifest_exists = True
            blocked_reasons.append("secret_manifest_invalid_json")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_secret_manifest_validation_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSecretManifestValidationResult(
        validation_id=str(
            validation_id or f"execution-adapter-secret-manifest-validation-{materialization_id}-{uuid4()}"
        ),
        materialization_id=materialization_id,
        reference_id=reference_id,
        adapter_id=materialization_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "validated",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        validation_mode="local_secret_store_manifest_readonly",
        reference_name=reference_name,
        backend=backend,
        manifest_path=normalized_manifest_path,
        fingerprint=fingerprint,
        required_env_vars=required_env_vars,
        covered_env_vars=covered_env_vars,
        blocked_reasons=unique_blocked_reasons,
        manifest_summary={
            "manifestExists": manifest_exists,
            "manifestJsonValid": manifest_json_valid,
            "requiredEnvVarCount": len(required_env_vars),
            "coveredEnvVarCount": len([name for name in required_env_vars if name in set(covered_env_vars)]),
            "rawValuesReturned": False,
        },
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_secret_manifest_validation_to_payload(
    result: ExecutionAdapterSecretManifestValidationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "validationId": result.validation_id,
        "materializationId": result.materialization_id,
        "referenceId": result.reference_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "validationMode": result.validation_mode,
        "referenceName": result.reference_name,
        "backend": result.backend,
        "manifestPath": result.manifest_path,
        "fingerprint": result.fingerprint,
        "requiredEnvVars": list(result.required_env_vars),
        "coveredEnvVars": list(result.covered_env_vars),
        "blockedReasons": list(result.blocked_reasons),
        "manifestSummary": result.manifest_summary,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_manifest_validation_payload_from_audit_event(
    event: Any,
) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_secret_manifest_validation":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    validation_id = str(metadata.get("validationId") or getattr(event, "event_id", "")).strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    reference_id = str(metadata.get("referenceId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    validation_mode = str(metadata.get("validationMode") or "local_secret_store_manifest_readonly").strip()
    reference_name = str(metadata.get("referenceName") or "").strip()
    backend = str(metadata.get("backend") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    fingerprint = str(metadata.get("fingerprint") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    covered_env_vars = [
        str(item).strip()
        for item in metadata.get("coveredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    manifest_summary = metadata.get("manifestSummary") if isinstance(metadata.get("manifestSummary"), dict) else {}
    if (
        not validation_id
        or not materialization_id
        or not reference_id
        or not adapter_id
        or not market
        or not validation_mode
        or not reference_name
        or not backend
        or not manifest_path
        or not required_env_vars
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "validated"}:
        return None

    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    return {
        "schemaVersion": 1,
        "validationId": validation_id,
        "materializationId": materialization_id,
        "referenceId": reference_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "validationMode": validation_mode,
        "referenceName": reference_name,
        "backend": backend,
        "manifestPath": manifest_path,
        "fingerprint": fingerprint,
        "requiredEnvVars": required_env_vars,
        "coveredEnvVars": covered_env_vars,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "manifestSummary": _redact_secret_fields(manifest_summary),
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_manifest_validation_to_audit_event_payload(
    result: ExecutionAdapterSecretManifestValidationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.validation_id,
        "eventType": "execution_adapter_secret_manifest_validation",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-secret-manifest-validation",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} secret manifest validated as {result.status}.",
        "detail": "Secret manifest validation reads local metadata only; raw secret values and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "validationId": result.validation_id,
                "materializationId": result.materialization_id,
                "referenceId": result.reference_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "validationMode": result.validation_mode,
                "referenceName": result.reference_name,
                "backend": result.backend,
                "manifestPath": result.manifest_path,
                "fingerprint": result.fingerprint,
                "requiredEnvVars": list(result.required_env_vars),
                "coveredEnvVars": list(result.covered_env_vars),
                "blockedReasons": list(result.blocked_reasons),
                "manifestSummary": result.manifest_summary,
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _resolve_execution_adapter_secret_manifest_path(
    manifest_path: str,
    *,
    secret_store_root: str | Path | None = None,
) -> Path | None:
    normalized = str(manifest_path or "").strip()
    if normalized.startswith("local-secret-store://"):
        suffix = normalized.removeprefix("local-secret-store://").replace("\\", "/").strip("/")
        parts = [part for part in suffix.split("/") if part]
        if not parts or any(part in {".", ".."} for part in parts):
            return None
        path = Path(secret_store_root) if secret_store_root else Path("data") / "secret-store"
        for part in parts:
            path = path / part
        return path if path.suffix else path.with_suffix(".json")
    if normalized.startswith("file://"):
        normalized = normalized.removeprefix("file://")
    path = Path(normalized)
    if any(part == ".." for part in path.parts):
        return None
    return path


def _execution_adapter_secret_manifest_fingerprint(manifest: dict[str, Any]) -> str:
    for key in ("fingerprint", "secretFingerprint", "secretFingerprintSha256", "manifestFingerprint"):
        value = manifest.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    metadata = manifest.get("metadata")
    if isinstance(metadata, dict):
        value = metadata.get("fingerprint")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _execution_adapter_secret_manifest_env_vars(manifest: dict[str, Any]) -> list[str]:
    env_vars: list[str] = []
    for key in ("requiredEnvVars", "envVars", "providedEnvVars"):
        value = manifest.get(key)
        if isinstance(value, list):
            env_vars.extend(str(item).strip() for item in value if isinstance(item, str) and item.strip())
    for key in ("env", "secrets", "secretRefs"):
        value = manifest.get(key)
        if isinstance(value, dict):
            env_vars.extend(str(item).strip() for item in value.keys() if str(item).strip())
    return list(dict.fromkeys(env_vars))
