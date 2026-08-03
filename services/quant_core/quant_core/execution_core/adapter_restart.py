from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterControlledRestartEvidenceResult,
    ExecutionAdapterRestartAcceptanceResult,
)

__all__ = [
    '_execution_adapter_controlled_restart_evidence_confirmation_specs',
    '_execution_adapter_restart_acceptance_confirmation_specs',
    'build_execution_adapter_controlled_restart_evidence',
    'build_execution_adapter_restart_acceptance',
    'execution_adapter_controlled_restart_evidence_payload_from_audit_event',
    'execution_adapter_controlled_restart_evidence_to_audit_event_payload',
    'execution_adapter_controlled_restart_evidence_to_payload',
    'execution_adapter_restart_acceptance_payload_from_audit_event',
    'execution_adapter_restart_acceptance_to_audit_event_payload',
    'execution_adapter_restart_acceptance_to_payload',
]

def build_execution_adapter_controlled_restart_evidence(
    certification_apply: dict[str, Any],
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    evidence_id: str | None = None,
) -> ExecutionAdapterControlledRestartEvidenceResult:
    if not isinstance(certification_apply, dict):
        raise ValueError("execution_adapter_certification_apply_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    apply_id = str(certification_apply.get("applyId") or "").strip()
    certification_id = str(certification_apply.get("certificationId") or "").strip()
    adapter_id = str(certification_apply.get("adapterId") or "").strip()
    market = str(certification_apply.get("market") or "").strip()
    route = str(certification_apply.get("route") or "").strip()
    if not apply_id:
        raise ValueError("execution_adapter_certification_apply_id_required")
    if not certification_id:
        raise ValueError("execution_adapter_certification_id_required")
    if not adapter_id:
        raise ValueError("execution_adapter_certification_adapter_id_required")
    if not market:
        raise ValueError("execution_adapter_certification_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_certification_route_invalid")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_controlled_restart_evidence_confirmation_specs():
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

    if str(certification_apply.get("status") or "") != "ready_for_restart":
        blocked_reasons.append("certification_apply_not_ready_for_restart")
    if route != "live":
        blocked_reasons.append("certification_apply_route_not_live")
    restart_required = bool(certification_apply.get("restartRequired", True))
    if not restart_required:
        blocked_reasons.append("controlled_restart_not_required")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_controlled_restart_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterControlledRestartEvidenceResult(
        evidence_id=str(evidence_id or f"execution-adapter-controlled-restart-{apply_id}-{uuid4()}"),
        apply_id=apply_id,
        certification_id=certification_id,
        adapter_id=adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "evidence_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        evidence_mode="manual_controlled_restart",
        restart_required=restart_required,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_controlled_restart_evidence_to_payload(
    result: ExecutionAdapterControlledRestartEvidenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "evidenceId": result.evidence_id,
        "applyId": result.apply_id,
        "certificationId": result.certification_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "evidenceMode": result.evidence_mode,
        "restartRequired": result.restart_required,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_controlled_restart_evidence_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_controlled_restart_evidence":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    evidence_id = str(metadata.get("evidenceId") or getattr(event, "event_id", "")).strip()
    apply_id = str(metadata.get("applyId") or "").strip()
    certification_id = str(metadata.get("certificationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    if not evidence_id or not apply_id or not certification_id or not adapter_id or not market:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "evidence_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_controlled_restart_evidence_confirmation_specs():
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
        "evidenceId": evidence_id,
        "applyId": apply_id,
        "certificationId": certification_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "evidenceMode": str(metadata.get("evidenceMode") or "manual_controlled_restart"),
        "restartRequired": bool(metadata.get("restartRequired", True)),
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


def execution_adapter_controlled_restart_evidence_to_audit_event_payload(
    result: ExecutionAdapterControlledRestartEvidenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.evidence_id,
        "eventType": "execution_adapter_controlled_restart_evidence",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-controlled-restart",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} controlled restart evidence recorded as {result.status}.",
        "detail": "Controlled restart evidence is an operator-reviewed paper-only ledger entry; live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "evidenceId": result.evidence_id,
                "applyId": result.apply_id,
                "certificationId": result.certification_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "evidenceMode": result.evidence_mode,
                "restartRequired": result.restart_required,
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


def _execution_adapter_controlled_restart_evidence_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "restart-window-executed",
            "restartWindowExecuted",
            "Controlled restart window was executed",
            "restart_window_not_confirmed",
        ),
        (
            "rollback-plan-confirmed",
            "rollbackPlanConfirmed",
            "Rollback plan is available and confirmed",
            "rollback_plan_not_confirmed",
        ),
        (
            "post-restart-validation-passed",
            "postRestartValidationPassed",
            "Post-restart validation passed",
            "post_restart_validation_not_confirmed",
        ),
        (
            "operator-reviewed-restart-logs",
            "operatorReviewedRestartLogs",
            "Operator reviewed restart logs and adapter status",
            "restart_logs_not_confirmed",
        ),
    ]


def build_execution_adapter_restart_acceptance(
    controlled_restart_evidence: dict[str, Any],
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    acceptance_id: str | None = None,
) -> ExecutionAdapterRestartAcceptanceResult:
    if not isinstance(controlled_restart_evidence, dict):
        raise ValueError("execution_adapter_controlled_restart_evidence_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    evidence_id = str(controlled_restart_evidence.get("evidenceId") or "").strip()
    apply_id = str(controlled_restart_evidence.get("applyId") or "").strip()
    certification_id = str(controlled_restart_evidence.get("certificationId") or "").strip()
    adapter_id = str(controlled_restart_evidence.get("adapterId") or "").strip()
    market = str(controlled_restart_evidence.get("market") or "").strip()
    route = str(controlled_restart_evidence.get("route") or "").strip()
    if not evidence_id:
        raise ValueError("execution_adapter_controlled_restart_evidence_id_required")
    if not apply_id:
        raise ValueError("execution_adapter_certification_apply_id_required")
    if not certification_id:
        raise ValueError("execution_adapter_certification_id_required")
    if not adapter_id:
        raise ValueError("execution_adapter_certification_adapter_id_required")
    if not market:
        raise ValueError("execution_adapter_certification_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_certification_route_invalid")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_restart_acceptance_confirmation_specs():
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

    if str(controlled_restart_evidence.get("status") or "") != "evidence_recorded":
        blocked_reasons.append("controlled_restart_evidence_not_recorded")
    if route != "live":
        blocked_reasons.append("controlled_restart_evidence_route_not_live")
    restart_required = bool(controlled_restart_evidence.get("restartRequired", True))
    if not restart_required:
        blocked_reasons.append("controlled_restart_not_required")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_restart_acceptance_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterRestartAcceptanceResult(
        acceptance_id=str(acceptance_id or f"execution-adapter-restart-acceptance-{evidence_id}-{uuid4()}"),
        evidence_id=evidence_id,
        apply_id=apply_id,
        certification_id=certification_id,
        adapter_id=adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "acceptance_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        acceptance_mode="manual_post_restart_acceptance",
        restart_required=restart_required,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_restart_acceptance_to_payload(
    result: ExecutionAdapterRestartAcceptanceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "acceptanceId": result.acceptance_id,
        "evidenceId": result.evidence_id,
        "applyId": result.apply_id,
        "certificationId": result.certification_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "acceptanceMode": result.acceptance_mode,
        "restartRequired": result.restart_required,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_restart_acceptance_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_restart_acceptance":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    acceptance_id = str(metadata.get("acceptanceId") or getattr(event, "event_id", "")).strip()
    evidence_id = str(metadata.get("evidenceId") or "").strip()
    apply_id = str(metadata.get("applyId") or "").strip()
    certification_id = str(metadata.get("certificationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    if not acceptance_id or not evidence_id or not apply_id or not certification_id or not adapter_id or not market:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "acceptance_recorded"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_restart_acceptance_confirmation_specs():
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
        "acceptanceId": acceptance_id,
        "evidenceId": evidence_id,
        "applyId": apply_id,
        "certificationId": certification_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "acceptanceMode": str(metadata.get("acceptanceMode") or "manual_post_restart_acceptance"),
        "restartRequired": bool(metadata.get("restartRequired", True)),
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


def execution_adapter_restart_acceptance_to_audit_event_payload(
    result: ExecutionAdapterRestartAcceptanceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.acceptance_id,
        "eventType": "execution_adapter_restart_acceptance",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-restart-acceptance",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} restart acceptance recorded as {result.status}.",
        "detail": "Post-restart acceptance is a paper-only operator ledger entry; live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "acceptanceId": result.acceptance_id,
                "evidenceId": result.evidence_id,
                "applyId": result.apply_id,
                "certificationId": result.certification_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "acceptanceMode": result.acceptance_mode,
                "restartRequired": result.restart_required,
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


def _execution_adapter_restart_acceptance_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "core-health-checked",
            "coreHealthChecked",
            "Local core health was checked after restart",
            "local_core_health_not_confirmed",
        ),
        (
            "settings-reload-observed",
            "settingsReloadObserved",
            "Adapter settings reload was observed",
            "settings_reload_not_confirmed",
        ),
        (
            "paper-route-handshake-passed",
            "paperRouteHandshakePassed",
            "Sandbox or paper route handshake passed",
            "paper_route_handshake_not_confirmed",
        ),
        (
            "emergency-stop-armed",
            "emergencyStopArmed",
            "Emergency stop remains armed",
            "emergency_stop_not_confirmed",
        ),
        (
            "account-sync-dry-run-passed",
            "accountSyncDryRunPassed",
            "Account sync dry-run passed",
            "account_sync_dry_run_not_confirmed",
        ),
    ]
