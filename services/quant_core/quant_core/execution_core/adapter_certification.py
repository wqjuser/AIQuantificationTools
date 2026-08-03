from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from .common import (
    _coerce_optional_datetime,
    _enum_value,
    _execution_adapter_certification_status,
    _normalize_execution_adapter_certification_checks,
    _redact_secret_fields,
    _sorted_counts,
)
from .contracts import (
    ExecutionAdapterCertificationApplyResult,
    ExecutionAdapterCertificationRun,
)

__all__ = [
    '_execution_adapter_certification_apply_confirmation_specs',
    'build_execution_adapter_certification_apply',
    'create_execution_adapter_certification_run',
    'execution_adapter_certification_apply_payload_from_audit_event',
    'execution_adapter_certification_apply_to_audit_event_payload',
    'execution_adapter_certification_apply_to_payload',
    'execution_adapter_certification_to_audit_event_payload',
    'execution_adapter_certification_to_payload',
]

def create_execution_adapter_certification_run(
    *,
    adapter_id: str,
    market: str,
    route: str,
    operator: str = "local-operator",
    checks: list[dict[str, Any]] | None = None,
    metadata: dict[str, Any] | None = None,
    started_at: datetime | str | None = None,
    completed_at: datetime | str | None = None,
    certification_id: str | None = None,
) -> ExecutionAdapterCertificationRun:
    normalized_adapter_id = str(adapter_id or "").strip()
    normalized_market = str(market or "").strip()
    normalized_route = _enum_value(route, {"paper", "live"}, "execution_adapter_certification_route_invalid")
    if not normalized_adapter_id:
        raise ValueError("execution_adapter_certification_adapter_id_required")
    if not normalized_market:
        raise ValueError("execution_adapter_certification_market_required")
    normalized_checks = _normalize_execution_adapter_certification_checks(checks or [])
    status = _execution_adapter_certification_status(normalized_checks)
    started = _coerce_optional_datetime(
        started_at,
        error_code="execution_adapter_certification_started_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    completed = _coerce_optional_datetime(
        completed_at,
        error_code="execution_adapter_certification_completed_at_invalid",
        fallback=None,
    )
    summary = {
        "checkCount": len(normalized_checks),
        "checkStatusCounts": _sorted_counts(str(check.get("status") or "") for check in normalized_checks),
        "passedChecks": sum(1 for check in normalized_checks if check.get("status") == "passed"),
        "blockedChecks": sum(1 for check in normalized_checks if check.get("status") == "blocked"),
        "failedChecks": sum(1 for check in normalized_checks if check.get("status") == "failed"),
        "reviewChecks": sum(1 for check in normalized_checks if check.get("status") == "review"),
    }
    return ExecutionAdapterCertificationRun(
        certification_id=str(certification_id or f"adapter-certification-{uuid4()}"),
        adapter_id=normalized_adapter_id,
        market=normalized_market,
        route=normalized_route,
        status=status,
        operator=str(operator or "local-operator").strip() or "local-operator",
        started_at=started,
        completed_at=completed,
        checks=normalized_checks,
        metadata=_redact_secret_fields(metadata or {}),
        summary=summary,
        live_trading_allowed=False,
    )


def execution_adapter_certification_to_payload(run: ExecutionAdapterCertificationRun) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "certificationId": run.certification_id,
        "adapterId": run.adapter_id,
        "market": run.market,
        "route": run.route,
        "status": run.status,
        "operator": run.operator,
        "startedAt": run.started_at.isoformat(),
        "completedAt": run.completed_at.isoformat() if run.completed_at else None,
        "checks": run.checks,
        "metadata": run.metadata,
        "summary": run.summary,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_certification_to_audit_event_payload(run: ExecutionAdapterCertificationRun) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": run.certification_id,
        "eventType": "execution_adapter_certification",
        "runId": "",
        "createdAt": (run.completed_at or run.started_at).isoformat(),
        "stage": "execution-adapter-certification",
        "source": "execution-adapter-ledger",
        "summary": f"{run.adapter_id} certification recorded as {run.status}.",
        "detail": "Adapter certification evidence is stored without secrets and live trading remains blocked.",
        "metadata": {
            "certificationId": run.certification_id,
            "adapterId": run.adapter_id,
            "market": run.market,
            "route": run.route,
            "status": run.status,
            "operator": run.operator,
            "startedAt": run.started_at.isoformat(),
            "completedAt": run.completed_at.isoformat() if run.completed_at else None,
            "checkStatusCounts": dict(run.summary.get("checkStatusCounts", {})),
            "checkCount": run.summary.get("checkCount", 0),
            "liveTradingAllowed": False,
            "paperOnly": True,
        },
    }


def build_execution_adapter_certification_apply(
    certification: ExecutionAdapterCertificationRun,
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    generated_at: datetime | str | None = None,
    apply_id: str | None = None,
) -> ExecutionAdapterCertificationApplyResult:
    if not isinstance(confirmations, dict):
        confirmations = {}
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_certification_apply_confirmation_specs():
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

    if certification.route != "live":
        blocked_reasons.append("certification_route_not_live")
    if certification.status != "passed":
        blocked_reasons.append("certification_not_passed")

    generated = _coerce_optional_datetime(
        generated_at,
        error_code="execution_adapter_certification_apply_generated_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterCertificationApplyResult(
        apply_id=str(apply_id or f"execution-adapter-certification-apply-{certification.certification_id}-{uuid4()}"),
        certification_id=certification.certification_id,
        adapter_id=certification.adapter_id,
        market=certification.market,
        route=certification.route,
        status="blocked" if unique_blocked_reasons else "ready_for_restart",
        operator=str(operator or "local-operator").strip() or "local-operator",
        generated_at=generated or datetime.now(timezone.utc),
        apply_mode="manual_secret_store",
        restart_required=True,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_certification_apply_to_payload(result: ExecutionAdapterCertificationApplyResult) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "applyId": result.apply_id,
        "certificationId": result.certification_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "generatedAt": result.generated_at.isoformat(),
        "applyMode": result.apply_mode,
        "restartRequired": result.restart_required,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_certification_apply_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_certification_apply":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    apply_id = str(metadata.get("applyId") or getattr(event, "event_id", "")).strip()
    certification_id = str(metadata.get("certificationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    if not apply_id or not certification_id or not adapter_id or not market:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "ready_for_restart"}:
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
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_certification_apply_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    generated_at = getattr(event, "created_at", None)
    if isinstance(generated_at, datetime):
        generated_at_value = generated_at.isoformat()
    else:
        generated_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "applyId": apply_id,
        "certificationId": certification_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "generatedAt": generated_at_value,
        "applyMode": str(metadata.get("applyMode") or "manual_secret_store"),
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


def execution_adapter_certification_apply_to_audit_event_payload(
    result: ExecutionAdapterCertificationApplyResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.apply_id,
        "eventType": "execution_adapter_certification_apply",
        "runId": "",
        "createdAt": result.generated_at.isoformat(),
        "stage": "execution-adapter-certification-apply",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} certification apply preflight recorded as {result.status}.",
        "detail": "Certification apply preflight records manual secret-store and restart confirmations without secrets or live trading.",
        "metadata": _redact_secret_fields(
            {
                "applyId": result.apply_id,
                "certificationId": result.certification_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "applyMode": result.apply_mode,
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


def _execution_adapter_certification_apply_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "secret-reference-stored",
            "secretReferenceStored",
            "Secret-store reference is saved outside the UI",
            "secret_reference_not_confirmed",
        ),
        (
            "controlled-restart-window-approved",
            "controlledRestartWindowApproved",
            "Controlled restart window is approved",
            "controlled_restart_not_confirmed",
        ),
        (
            "operator-reviewed-certification",
            "operatorReviewedCertification",
            "Operator reviewed certification evidence and restart impact",
            "operator_review_not_confirmed",
        ),
    ]
