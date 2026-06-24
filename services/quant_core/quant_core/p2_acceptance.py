from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH = Path("data") / "p2-pre-live-acceptance.json"
P2_PRE_LIVE_ACCEPTANCE_REQUIRED_CHECKS = {
    "pre-live-checklist",
    "promotion-gates",
    "paper-execution-replay",
    "adapter-evidence",
    "manual-route-boundary",
    "live-blocked-boundary",
}


def load_p2_pre_live_acceptance_report(
    path: Path = DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH,
) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"P2 pre-live acceptance report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"P2 pre-live acceptance report is not valid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("P2 pre-live acceptance report must be a JSON object")
    return payload


def validate_p2_pre_live_acceptance_manifest(manifest: Any) -> str:
    if not isinstance(manifest, dict):
        raise ValueError("P2 pre-live acceptance manifest must be an object")
    if manifest.get("kind") != "aiqt.p2PreLiveAcceptanceManifest":
        raise ValueError("P2 pre-live acceptance manifest kind must be aiqt.p2PreLiveAcceptanceManifest")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("P2 pre-live acceptance manifest schemaVersion must be 1")
    if manifest.get("status") != "passed":
        raise ValueError("P2 pre-live acceptance manifest status must be passed")

    run_id = _required_string_field(manifest, "runId", "P2 pre-live acceptance manifest runId is required")
    _required_string_field(manifest, "market", "P2 pre-live acceptance manifest market is required")
    _required_string_field(manifest, "symbol", "P2 pre-live acceptance manifest symbol is required")
    _required_string_field(manifest, "timeframe", "P2 pre-live acceptance manifest timeframe is required")
    _required_string_field(manifest, "adapterId", "P2 pre-live acceptance manifest adapterId is required")
    checklist_status = _required_string_field(
        manifest,
        "checklistStatus",
        "P2 pre-live acceptance manifest checklistStatus is required",
    )

    passed_gates = _int_field(manifest, "passedGateCount")
    total_gates = _int_field(manifest, "totalGateCount")
    blocking_gates = _int_field(manifest, "blockingGateCount")
    if total_gates <= 0:
        raise ValueError("P2 pre-live acceptance manifest totalGateCount must be positive")
    if passed_gates < 0 or passed_gates > total_gates:
        raise ValueError("P2 pre-live acceptance manifest passedGateCount is out of range")
    if blocking_gates < 0 or blocking_gates > total_gates:
        raise ValueError("P2 pre-live acceptance manifest blockingGateCount is out of range")

    gate_ids = _string_list(manifest.get("gateIds"))
    if len(gate_ids) != total_gates:
        raise ValueError("P2 pre-live acceptance manifest gateIds must match totalGateCount")
    blocker_ids = _string_list(manifest.get("blockerIds"))
    if len(blocker_ids) != blocking_gates:
        raise ValueError("P2 pre-live acceptance manifest blockerIds must match blockingGateCount")
    audit_event_ids = _string_list(manifest.get("auditEventIds"))
    if not audit_event_ids:
        raise ValueError("P2 pre-live acceptance manifest auditEventIds must be non-empty")

    if manifest.get("paperOnly") is not True:
        raise ValueError("P2 pre-live acceptance manifest must be paper-only")
    if (
        manifest.get("orderSubmissionEnabled") is not False
        or manifest.get("liveTradingAllowed") is not False
        or manifest.get("liveOrderSubmitted") is not False
        or manifest.get("routeExecuted") is not False
        or manifest.get("liveBlockedBoundary") is not True
    ):
        raise ValueError("P2 pre-live acceptance manifest live-blocked boundary is not enforced")

    checks = manifest.get("checks")
    if not isinstance(checks, list) or not checks:
        raise ValueError("P2 pre-live acceptance manifest checks must be a non-empty list")
    if _int_field(manifest, "checkCount") != len(checks):
        raise ValueError("P2 pre-live acceptance manifest checkCount does not match checks")

    check_ids: list[str] = []
    for check in checks:
        if not isinstance(check, dict):
            raise ValueError("P2 pre-live acceptance manifest check must be an object")
        check_id = str(check.get("id") or "").strip()
        if not check_id:
            raise ValueError("P2 pre-live acceptance manifest check id is required")
        if check.get("status") != "passed":
            raise ValueError(f"P2 pre-live acceptance manifest check {check_id} did not pass")
        if not str(check.get("summary") or "").strip():
            raise ValueError(f"P2 pre-live acceptance manifest check {check_id} summary is required")
        check_ids.append(check_id)

    missing_checks = P2_PRE_LIVE_ACCEPTANCE_REQUIRED_CHECKS.difference(check_ids)
    if missing_checks:
        raise ValueError(
            f"P2 pre-live acceptance manifest missing required checks: {', '.join(sorted(missing_checks))}"
        )

    return (
        f"p2 pre-live acceptance manifest run={run_id} checklist={checklist_status} "
        f"gates={passed_gates}/{total_gates} blockers={blocking_gates} liveBlocked=True"
    )


def load_p2_pre_live_acceptance_status(
    path: Path = DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH,
) -> dict[str, Any]:
    source_path = Path(path)
    try:
        manifest = load_p2_pre_live_acceptance_report(source_path)
        summary = validate_p2_pre_live_acceptance_manifest(manifest)
    except FileNotFoundError as error:
        return _p2_pre_live_acceptance_status(
            None,
            status="missing",
            available=False,
            source_path=source_path,
            summary="P2 pre-live acceptance manifest is missing.",
            reason=str(error),
        )
    except ValueError as error:
        manifest = _read_manifest_for_invalid_status(source_path)
        return _p2_pre_live_acceptance_status(
            manifest,
            status="invalid",
            available=False,
            source_path=source_path,
            summary="P2 pre-live acceptance manifest is invalid.",
            reason=str(error),
        )

    return _p2_pre_live_acceptance_status(
        manifest,
        status="passed",
        available=True,
        source_path=source_path,
        summary=summary,
        reason="",
    )


def _read_manifest_for_invalid_status(source_path: Path) -> dict[str, Any] | None:
    try:
        payload = json.loads(source_path.read_text(encoding="utf-8"))
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def _p2_pre_live_acceptance_status(
    manifest: dict[str, Any] | None,
    *,
    status: str,
    available: bool,
    source_path: Path,
    summary: str,
    reason: str,
) -> dict[str, Any]:
    check_ids = _p2_pre_live_acceptance_check_ids(manifest)
    return {
        "kind": "aiqt.p2PreLiveAcceptanceStatus",
        "schemaVersion": 1,
        "status": status,
        "available": available,
        "sourcePath": str(source_path),
        "summary": summary,
        "reason": reason,
        "generatedAt": _string_field(manifest, "generatedAt"),
        "runId": _string_field(manifest, "runId"),
        "market": _string_field(manifest, "market"),
        "symbol": _string_field(manifest, "symbol"),
        "timeframe": _string_field(manifest, "timeframe"),
        "adapterId": _string_field(manifest, "adapterId"),
        "promotionStatus": _string_field(manifest, "promotionStatus"),
        "checklistStatus": _string_field(manifest, "checklistStatus"),
        "passedGateCount": _int_field(manifest, "passedGateCount") if manifest else 0,
        "totalGateCount": _int_field(manifest, "totalGateCount") if manifest else 0,
        "blockingGateCount": _int_field(manifest, "blockingGateCount") if manifest else 0,
        "gateIds": _string_list(manifest.get("gateIds")) if manifest else [],
        "blockerIds": _string_list(manifest.get("blockerIds")) if manifest else [],
        "auditEventIds": _string_list(manifest.get("auditEventIds")) if manifest else [],
        "checkCount": len(check_ids),
        "requiredCheckCount": len(P2_PRE_LIVE_ACCEPTANCE_REQUIRED_CHECKS),
        "checkIds": check_ids,
        "manualRouteCandidate": bool(manifest.get("manualRouteCandidate")) if manifest else False,
        "paperOnly": bool(manifest.get("paperOnly")) if manifest else False,
        "orderSubmissionEnabled": bool(manifest.get("orderSubmissionEnabled")) if manifest else False,
        "liveTradingAllowed": bool(manifest.get("liveTradingAllowed")) if manifest else False,
        "liveOrderSubmitted": bool(manifest.get("liveOrderSubmitted")) if manifest else False,
        "routeExecuted": bool(manifest.get("routeExecuted")) if manifest else False,
        "liveBlockedBoundary": bool(manifest.get("liveBlockedBoundary")) if manifest else False,
        "manifest": manifest,
    }


def _p2_pre_live_acceptance_check_ids(manifest: dict[str, Any] | None) -> list[str]:
    if not manifest:
        return []
    checks = manifest.get("checks")
    if not isinstance(checks, list):
        return []
    return [
        str(check.get("id") or "").strip()
        for check in checks
        if isinstance(check, dict) and str(check.get("id") or "").strip()
    ]


def _required_string_field(manifest: dict[str, Any], field: str, message: str) -> str:
    value = _string_field(manifest, field)
    if not value:
        raise ValueError(message)
    return value


def _string_field(manifest: dict[str, Any] | None, field: str) -> str | None:
    if not manifest:
        return None
    value = manifest.get(field)
    return str(value).strip() if value is not None and str(value).strip() else None


def _int_field(manifest: dict[str, Any] | None, field: str) -> int:
    if not manifest:
        return 0
    try:
        return int(manifest.get(field, 0))
    except (TypeError, ValueError):
        return 0


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]
