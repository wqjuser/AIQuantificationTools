from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
from typing import Any
from uuid import uuid4

from quant_core.execution_adapter_health import validate_production_readonly_probe_evidence


_TTL = timedelta(hours=24)
_BOUNDARY = {
    "productionReadOnly": True,
    "liveTradingAllowed": False,
    "orderRoutingEnabled": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


def build_production_readonly_access_control(
    *,
    action: str,
    operator: str,
    reason: str,
    previous_control_id: str | None = None,
    production_route_review_id: str | None = None,
    recorded_at: datetime | None = None,
) -> dict[str, Any]:
    action = action.strip() if isinstance(action, str) else ""
    operator = operator.strip() if isinstance(operator, str) else ""
    reason = reason.strip() if isinstance(reason, str) else ""
    previous_control_id = previous_control_id.strip() if isinstance(previous_control_id, str) else None
    production_route_review_id = (
        production_route_review_id.strip() if isinstance(production_route_review_id, str) else None
    )
    if action not in {"revoke", "restore"} or not operator or not reason:
        raise ValueError("stage8_production_readonly_access_control_request_invalid")
    if action == "restore" and not production_route_review_id:
        raise ValueError("stage8_production_readonly_restore_review_required")
    if action == "revoke" and production_route_review_id:
        raise ValueError("stage8_production_readonly_revoke_review_invalid")
    value = {
        "kind": "aiqt.stage8ProductionReadonlyAccessControl",
        "schemaVersion": 1,
        "controlId": f"stage8-production-readonly-{action}-{uuid4()}",
        "action": action,
        "status": "revoked" if action == "revoke" else "active",
        "operator": operator,
        "reason": reason,
        "recordedAt": (recorded_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat(),
        "productionRouteReviewId": production_route_review_id,
        "previousControlId": previous_control_id,
        **_BOUNDARY,
    }
    value["controlHash"] = _hash(value)
    return validate_production_readonly_access_control(value)


def validate_production_readonly_access_control(value: Any) -> dict[str, Any]:
    fields = {
        "kind", "schemaVersion", "controlId", "action", "status", "operator", "reason", "recordedAt",
        "productionRouteReviewId", "previousControlId", "controlHash", *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage8_production_readonly_access_control_fields_invalid")
    if value["kind"] != "aiqt.stage8ProductionReadonlyAccessControl" or value["schemaVersion"] != 1:
        raise ValueError("stage8_production_readonly_access_control_schema_invalid")
    action = value["action"]
    if action not in {"revoke", "restore"} or value["status"] != ("revoked" if action == "revoke" else "active"):
        raise ValueError("stage8_production_readonly_access_control_state_invalid")
    for field in ("controlId", "operator", "reason"):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError("stage8_production_readonly_access_control_identity_invalid")
    if not value["controlId"].startswith(f"stage8-production-readonly-{action}-"):
        raise ValueError("stage8_production_readonly_access_control_identity_invalid")
    if value["previousControlId"] is not None and (
        not isinstance(value["previousControlId"], str) or not value["previousControlId"].strip()
    ):
        raise ValueError("stage8_production_readonly_access_control_previous_invalid")
    review_id = value["productionRouteReviewId"]
    if (action == "restore" and (not isinstance(review_id, str) or not review_id.strip())) or (
        action == "revoke" and review_id is not None
    ):
        raise ValueError("stage8_production_readonly_access_control_review_invalid")
    _utc(value["recordedAt"], "stage8_production_readonly_access_control_time_invalid")
    _validate_boundary(value, "stage8_production_readonly_access_control_boundary_invalid")
    if value["controlHash"] != _hash({key: item for key, item in value.items() if key != "controlHash"}):
        raise ValueError("stage8_production_readonly_access_control_hash_invalid")
    return value


def production_readonly_access_control_to_audit_event(value: dict[str, Any]) -> dict[str, Any]:
    control = validate_production_readonly_access_control(value)
    return {
        "schemaVersion": 1,
        "eventId": control["controlId"],
        "eventType": "stage8_production_readonly_access_control",
        "runId": "",
        "createdAt": control["recordedAt"],
        "stage": "stage8-production-readonly-continuity",
        "source": control["operator"],
        "summary": f"Stage 8 production read-only access {control['status']}.",
        "detail": "Local production read-only access control changed; production orders remain disabled.",
        "metadata": {"snapshot": control},
    }


def production_readonly_access_control_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage8_production_readonly_access_control":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_readonly_access_control(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


def build_production_readonly_continuity(
    *,
    latest_probe: dict[str, Any] | None,
    access_control: dict[str, Any] | None,
    stage6_hash_matches: bool,
    route_review_current: bool,
    route_review_recorded_at: str | None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    probe = validate_production_readonly_probe_evidence(latest_probe) if latest_probe is not None else None
    control = validate_production_readonly_access_control(access_control) if access_control is not None else None
    now = (generated_at or datetime.now(timezone.utc)).astimezone(timezone.utc)
    blockers: list[str] = []
    expires_at: datetime | None = None
    probe_fresh = False
    if probe:
        probe_time = _utc(probe["generatedAt"], "stage8_production_readonly_probe_time_invalid")
        probe_expiry = probe_time + _TTL
        expires_at = probe_expiry
        probe_fresh = timedelta(0) <= now - probe_time <= _TTL
        if route_review_recorded_at:
            route_expiry = _utc(
                route_review_recorded_at, "stage8_production_readonly_route_review_time_invalid"
            ) + _TTL
            expires_at = min(expires_at, route_expiry)
    unsafe_permissions = bool(probe and any(
        enabled for name, enabled in probe["apiPermissions"].items() if name != "readingEnabled"
    ))
    if control and control["status"] == "revoked":
        status = "revoked"
        blockers.append("production_readonly_access_revoked")
    elif probe is None:
        status = "missing"
        blockers.append("stage7_production_readonly_probe_missing")
    elif probe["status"] != "ready" or not probe["apiPermissions"]["readingEnabled"] or unsafe_permissions:
        status = "blocked"
        blockers.extend(probe["blockedReasons"] or ["stage7_production_readonly_probe_blocked"])
        if unsafe_permissions:
            blockers.append("production_readonly_permission_drift")
    elif not stage6_hash_matches or not route_review_current or not probe_fresh:
        status = "stale"
        if not stage6_hash_matches:
            blockers.append("stage6_exit_authority_changed")
        if not route_review_current:
            blockers.append("production_route_review_stale")
        if not probe_fresh:
            blockers.append("production_readonly_probe_stale")
    else:
        status = "current"
    latest = None if probe is None else {
        "probeId": probe["probeId"],
        "evidenceHash": probe["evidenceHash"],
        "status": probe["status"],
        "generatedAt": probe["generatedAt"],
        "productionRouteReviewId": probe["productionRouteReviewId"],
    }
    value = {
        "kind": "aiqt.stage8ProductionReadonlyContinuity",
        "schemaVersion": 1,
        "generatedAt": now.isoformat(),
        "status": status,
        "accessState": control["status"] if control else "active",
        "accessControl": control,
        "latestProbe": latest,
        "expiresAt": expires_at.isoformat() if expires_at else None,
        "stage6HashMatches": stage6_hash_matches,
        "routeReviewCurrent": route_review_current,
        "probeFresh": probe_fresh,
        "permissionDrift": unsafe_permissions,
        "blockedReasons": list(dict.fromkeys(blockers)),
        **_BOUNDARY,
    }
    value["continuityHash"] = _hash(value)
    return validate_production_readonly_continuity(value)


def validate_production_readonly_continuity(value: Any) -> dict[str, Any]:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "accessState", "accessControl", "latestProbe",
        "expiresAt", "stage6HashMatches", "routeReviewCurrent", "probeFresh", "permissionDrift",
        "blockedReasons", "continuityHash", *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage8_production_readonly_continuity_fields_invalid")
    if value["kind"] != "aiqt.stage8ProductionReadonlyContinuity" or value["schemaVersion"] != 1:
        raise ValueError("stage8_production_readonly_continuity_schema_invalid")
    if value["status"] not in {"current", "stale", "blocked", "revoked", "missing"}:
        raise ValueError("stage8_production_readonly_continuity_status_invalid")
    if value["accessState"] not in {"active", "revoked"}:
        raise ValueError("stage8_production_readonly_continuity_access_invalid")
    control = value["accessControl"]
    if control is not None and validate_production_readonly_access_control(control)["status"] != value["accessState"]:
        raise ValueError("stage8_production_readonly_continuity_access_invalid")
    if control is None and value["accessState"] != "active":
        raise ValueError("stage8_production_readonly_continuity_access_invalid")
    latest = value["latestProbe"]
    latest_fields = {"probeId", "evidenceHash", "status", "generatedAt", "productionRouteReviewId"}
    if latest is not None and (
        not isinstance(latest, dict) or set(latest) != latest_fields
        or latest["status"] not in {"ready", "review", "blocked"}
        or any(not isinstance(latest[field], str) or not latest[field] for field in latest_fields - {"status"})
        or not latest["probeId"].startswith("stage7-production-readonly-") or not _is_hash(latest["evidenceHash"])
    ):
        raise ValueError("stage8_production_readonly_continuity_probe_invalid")
    if latest is not None:
        _utc(latest["generatedAt"], "stage8_production_readonly_continuity_probe_invalid")
    _utc(value["generatedAt"], "stage8_production_readonly_continuity_time_invalid")
    if value["expiresAt"] is not None:
        _utc(value["expiresAt"], "stage8_production_readonly_continuity_time_invalid")
    for field in ("stage6HashMatches", "routeReviewCurrent", "probeFresh", "permissionDrift"):
        if type(value[field]) is not bool:
            raise ValueError("stage8_production_readonly_continuity_flags_invalid")
    if not isinstance(value["blockedReasons"], list) or any(
        not isinstance(reason, str) or not reason for reason in value["blockedReasons"]
    ):
        raise ValueError("stage8_production_readonly_continuity_blockers_invalid")
    if value["status"] == "current" and (
        latest is None or latest["status"] != "ready" or value["accessState"] != "active"
        or not value["stage6HashMatches"] or not value["routeReviewCurrent"] or not value["probeFresh"]
        or value["permissionDrift"] or value["blockedReasons"]
    ):
        raise ValueError("stage8_production_readonly_continuity_current_invalid")
    if value["status"] == "revoked" and value["accessState"] != "revoked":
        raise ValueError("stage8_production_readonly_continuity_revoked_invalid")
    if value["status"] == "missing" and latest is not None:
        raise ValueError("stage8_production_readonly_continuity_missing_invalid")
    _validate_boundary(value, "stage8_production_readonly_continuity_boundary_invalid")
    if value["continuityHash"] != _hash({key: item for key, item in value.items() if key != "continuityHash"}):
        raise ValueError("stage8_production_readonly_continuity_hash_invalid")
    return value


def _validate_boundary(value: dict[str, Any], error: str) -> None:
    if any(value[field] is not expected for field, expected in _BOUNDARY.items()):
        raise ValueError(error)


def _utc(value: Any, error: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError) as exception:
        raise ValueError(error) from exception
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(error)
    return parsed.astimezone(timezone.utc)


def _hash(value: Any) -> str:
    encoded = json.dumps(value, allow_nan=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def _is_hash(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)
