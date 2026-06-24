from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_P1_ACCEPTANCE_REPORT_PATH = Path("data") / "p1-acceptance.json"
P1_ACCEPTANCE_REQUIRED_CHECKS = {
    "workspace",
    "watchlist-refresh",
    "queue-pipeline",
    "ai-review",
    "paper-simulation",
    "export",
    "import",
    "imported-export",
}


def load_p1_acceptance_report(path: Path = DEFAULT_P1_ACCEPTANCE_REPORT_PATH) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"P1 acceptance report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"P1 acceptance report is not valid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("P1 acceptance report must be a JSON object")
    return payload


def validate_p1_acceptance_manifest(manifest: Any) -> str:
    if not isinstance(manifest, dict):
        raise ValueError("P1 acceptance manifest must be an object")
    if manifest.get("kind") != "aiqt.p1AcceptanceManifest":
        raise ValueError("P1 acceptance manifest kind must be aiqt.p1AcceptanceManifest")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("P1 acceptance manifest schemaVersion must be 1")
    if manifest.get("status") != "passed":
        raise ValueError("P1 acceptance manifest status must be passed")

    run_id = _required_string_field(manifest, "runId", "P1 acceptance manifest runId is required")
    _required_string_field(manifest, "watchlistRefreshRunId", "P1 acceptance manifest watchlistRefreshRunId is required")
    _required_string_field(manifest, "queuedMarket", "P1 acceptance manifest queued market is required")
    _required_string_field(manifest, "queuedSymbol", "P1 acceptance manifest queued symbol is required")

    watchlist_count = _int_field(manifest, "watchlistCount")
    if watchlist_count < 3:
        raise ValueError("P1 acceptance manifest watchlistCount must be at least 3")
    if manifest.get("paperOnly") is not True:
        raise ValueError("P1 acceptance manifest must be paper-only")
    if manifest.get("liveTradingAllowed") is not False or manifest.get("liveBlockedBoundary") is not True:
        raise ValueError("P1 acceptance manifest live-blocked boundary is not enforced")

    checks = manifest.get("checks")
    if not isinstance(checks, list) or not checks:
        raise ValueError("P1 acceptance manifest checks must be a non-empty list")
    if _int_field(manifest, "checkCount") != len(checks):
        raise ValueError("P1 acceptance manifest checkCount does not match checks")

    check_ids: list[str] = []
    for check in checks:
        if not isinstance(check, dict):
            raise ValueError("P1 acceptance manifest check must be an object")
        check_id = str(check.get("id") or "").strip()
        if not check_id:
            raise ValueError("P1 acceptance manifest check id is required")
        if check.get("status") != "passed":
            raise ValueError(f"P1 acceptance manifest check {check_id} did not pass")
        if not str(check.get("summary") or "").strip():
            raise ValueError(f"P1 acceptance manifest check {check_id} summary is required")
        check_ids.append(check_id)

    missing_checks = P1_ACCEPTANCE_REQUIRED_CHECKS.difference(check_ids)
    if missing_checks:
        raise ValueError(f"P1 acceptance manifest missing required checks: {', '.join(sorted(missing_checks))}")

    return f"p1 acceptance manifest run={run_id} watchlist={watchlist_count} checks={len(checks)} liveBlocked=True"


def load_p1_acceptance_status(path: Path = DEFAULT_P1_ACCEPTANCE_REPORT_PATH) -> dict[str, Any]:
    source_path = Path(path)
    try:
        manifest = load_p1_acceptance_report(source_path)
        summary = validate_p1_acceptance_manifest(manifest)
    except FileNotFoundError as error:
        return _p1_acceptance_status(
            None,
            status="missing",
            available=False,
            source_path=source_path,
            summary="P1 acceptance manifest is missing.",
            reason=str(error),
        )
    except ValueError as error:
        manifest = _read_manifest_for_invalid_status(source_path)
        return _p1_acceptance_status(
            manifest,
            status="invalid",
            available=False,
            source_path=source_path,
            summary="P1 acceptance manifest is invalid.",
            reason=str(error),
        )

    return _p1_acceptance_status(
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


def _p1_acceptance_status(
    manifest: dict[str, Any] | None,
    *,
    status: str,
    available: bool,
    source_path: Path,
    summary: str,
    reason: str,
) -> dict[str, Any]:
    check_ids = _p1_acceptance_check_ids(manifest)
    return {
        "kind": "aiqt.p1AcceptanceStatus",
        "schemaVersion": 1,
        "status": status,
        "available": available,
        "sourcePath": str(source_path),
        "summary": summary,
        "reason": reason,
        "generatedAt": _string_field(manifest, "generatedAt"),
        "runId": _string_field(manifest, "runId"),
        "timeframe": _string_field(manifest, "timeframe"),
        "watchlistRefreshRunId": _string_field(manifest, "watchlistRefreshRunId"),
        "queuedMarket": _string_field(manifest, "queuedMarket"),
        "queuedSymbol": _string_field(manifest, "queuedSymbol"),
        "watchlistCount": _int_field(manifest, "watchlistCount") if manifest else 0,
        "checkCount": len(check_ids),
        "requiredCheckCount": len(P1_ACCEPTANCE_REQUIRED_CHECKS),
        "checkIds": check_ids,
        "paperOnly": bool(manifest.get("paperOnly")) if manifest else False,
        "liveTradingAllowed": bool(manifest.get("liveTradingAllowed")) if manifest else False,
        "liveBlockedBoundary": bool(manifest.get("liveBlockedBoundary")) if manifest else False,
        "manifest": manifest,
    }


def _p1_acceptance_check_ids(manifest: dict[str, Any] | None) -> list[str]:
    if not manifest:
        return []
    checks = manifest.get("checks")
    if not isinstance(checks, list):
        return []
    return [str(check.get("id") or "").strip() for check in checks if isinstance(check, dict) and str(check.get("id") or "").strip()]


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
