from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _enum_value,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterSecretReferenceResult,
)

__all__ = [
    '_execution_adapter_secret_reference_confirmation_specs',
    'build_execution_adapter_secret_reference',
    'execution_adapter_secret_reference_payload_from_audit_event',
    'execution_adapter_secret_reference_to_audit_event_payload',
    'execution_adapter_secret_reference_to_payload',
]

def build_execution_adapter_secret_reference(
    *,
    adapter_id: str,
    market: str,
    route: str,
    reference_name: str,
    backend: str,
    required_env_vars: list[Any] | None = None,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    reference_id: str | None = None,
) -> ExecutionAdapterSecretReferenceResult:
    normalized_adapter_id = str(adapter_id or "").strip()
    normalized_market = str(market or "").strip()
    normalized_route = _enum_value(route, {"paper", "live"}, "execution_adapter_secret_reference_route_invalid")
    normalized_reference_name = str(reference_name or "").strip()
    normalized_backend = str(backend or "").strip()
    if not normalized_adapter_id:
        raise ValueError("execution_adapter_secret_reference_adapter_id_required")
    if not normalized_market:
        raise ValueError("execution_adapter_secret_reference_market_required")
    if not normalized_reference_name:
        raise ValueError("execution_adapter_secret_reference_name_required")
    if not normalized_backend:
        raise ValueError("execution_adapter_secret_reference_backend_required")
    normalized_env_vars = [
        str(item).strip()
        for item in (required_env_vars or [])
        if str(item or "").strip()
    ]
    if not normalized_env_vars:
        raise ValueError("execution_adapter_secret_reference_required_env_vars_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_secret_reference_confirmation_specs():
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

    if normalized_route != "live":
        blocked_reasons.append("secret_reference_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_secret_reference_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSecretReferenceResult(
        reference_id=str(reference_id or f"execution-adapter-secret-reference-{normalized_adapter_id}-{uuid4()}"),
        adapter_id=normalized_adapter_id,
        market=normalized_market,
        route=normalized_route,
        status="blocked" if unique_blocked_reasons else "reference_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        reference_name=normalized_reference_name,
        backend=normalized_backend,
        required_env_vars=normalized_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_secret_reference_to_payload(
    result: ExecutionAdapterSecretReferenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "referenceId": result.reference_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "referenceName": result.reference_name,
        "backend": result.backend,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_reference_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_secret_reference":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    reference_id = str(metadata.get("referenceId") or getattr(event, "event_id", "")).strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    reference_name = str(metadata.get("referenceName") or "").strip()
    backend = str(metadata.get("backend") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not reference_id or not adapter_id or not market or not reference_name or not backend or not required_env_vars:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "reference_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_secret_reference_confirmation_specs():
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
        "referenceId": reference_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "referenceName": reference_name,
        "backend": backend,
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


def execution_adapter_secret_reference_to_audit_event_payload(
    result: ExecutionAdapterSecretReferenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.reference_id,
        "eventType": "execution_adapter_secret_reference",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-secret-reference",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} secret reference recorded as {result.status}.",
        "detail": "Secret reference evidence stores names and operator confirmations only; raw secrets and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "referenceId": result.reference_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "referenceName": result.reference_name,
                "backend": result.backend,
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


def _execution_adapter_secret_reference_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "reference-created-outside-ui",
            "referenceCreatedOutsideUi",
            "Secret reference was created outside this UI",
            "secret_reference_not_created",
        ),
        (
            "operator-verified-fingerprint",
            "operatorVerifiedFingerprint",
            "Operator verified the stored secret fingerprint",
            "secret_reference_fingerprint_not_verified",
        ),
        (
            "rotation-plan-documented",
            "rotationPlanDocumented",
            "Secret rotation plan is documented",
            "secret_reference_rotation_plan_not_documented",
        ),
    ]
