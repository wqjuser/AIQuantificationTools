from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEFAULT_DESKTOP_RELEASE_REPORT_PATH = Path("data") / "desktop-release.json"
DESKTOP_RELEASE_REQUIRED_CHECKS = {
    "web-build",
    "cargo-check",
    "tauri-icon",
    "desktop-bundle",
    "live-blocked-boundary",
}


def load_desktop_release_report(path: Path = DEFAULT_DESKTOP_RELEASE_REPORT_PATH) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"Desktop release report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"Desktop release report is not valid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("Desktop release report must be a JSON object")
    return payload


def validate_desktop_release_manifest(manifest: Any) -> str:
    if not isinstance(manifest, dict):
        raise ValueError("Desktop release manifest must be an object")
    if manifest.get("kind") != "aiqt.desktopReleaseManifest":
        raise ValueError("Desktop release manifest kind must be aiqt.desktopReleaseManifest")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("Desktop release manifest schemaVersion must be 1")
    if manifest.get("status") != "passed":
        raise ValueError("Desktop release manifest status must be passed")
    platform = _required_string_field(manifest, "platform", "Desktop release manifest platform is required")
    _required_string_field(manifest, "version", "Desktop release manifest version is required")
    _required_string_field(manifest, "tauriConfigPath", "Desktop release manifest tauriConfigPath is required")
    _required_string_field(manifest, "desktopArtifactPath", "Desktop release manifest desktopArtifactPath is required")
    if manifest.get("paperOnly") is not True:
        raise ValueError("Desktop release manifest must be paper-only")
    if manifest.get("liveTradingAllowed") is not False or manifest.get("liveBlockedBoundary") is not True:
        raise ValueError("Desktop release manifest live-blocked boundary is not enforced")

    checks = manifest.get("checks")
    if not isinstance(checks, list) or not checks:
        raise ValueError("Desktop release manifest checks must be a non-empty list")
    if _int_field(manifest, "checkCount") != len(checks):
        raise ValueError("Desktop release manifest checkCount does not match checks")

    check_ids: list[str] = []
    for check in checks:
        if not isinstance(check, dict):
            raise ValueError("Desktop release manifest check must be an object")
        check_id = str(check.get("id") or "").strip()
        if not check_id:
            raise ValueError("Desktop release manifest check id is required")
        if check.get("status") != "passed":
            raise ValueError(f"Desktop release manifest check {check_id} did not pass")
        if not str(check.get("summary") or "").strip():
            raise ValueError(f"Desktop release manifest check {check_id} summary is required")
        check_ids.append(check_id)

    missing_checks = DESKTOP_RELEASE_REQUIRED_CHECKS.difference(check_ids)
    if missing_checks:
        raise ValueError(f"Desktop release manifest missing required checks: {', '.join(sorted(missing_checks))}")

    return f"desktop release manifest platform={platform} checks={len(checks)} liveBlocked=True"


def load_desktop_release_status(path: Path = DEFAULT_DESKTOP_RELEASE_REPORT_PATH) -> dict[str, Any]:
    source_path = Path(path)
    try:
        manifest = load_desktop_release_report(source_path)
        summary = validate_desktop_release_manifest(manifest)
    except FileNotFoundError as error:
        return _desktop_release_status(
            None,
            status="missing",
            available=False,
            source_path=source_path,
            summary="Desktop release manifest is missing.",
            reason=str(error),
        )
    except ValueError as error:
        manifest = _read_manifest_for_invalid_status(source_path)
        return _desktop_release_status(
            manifest,
            status="invalid",
            available=False,
            source_path=source_path,
            summary="Desktop release manifest is invalid.",
            reason=str(error),
        )

    return _desktop_release_status(
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


def _desktop_release_status(
    manifest: dict[str, Any] | None,
    *,
    status: str,
    available: bool,
    source_path: Path,
    summary: str,
    reason: str,
) -> dict[str, Any]:
    check_ids = _desktop_release_check_ids(manifest)
    return {
        "kind": "aiqt.desktopReleaseStatus",
        "schemaVersion": 1,
        "status": status,
        "available": available,
        "sourcePath": str(source_path),
        "summary": summary,
        "reason": reason,
        "generatedAt": _string_field(manifest, "generatedAt"),
        "platform": _string_field(manifest, "platform"),
        "version": _string_field(manifest, "version"),
        "tauriConfigPath": _string_field(manifest, "tauriConfigPath"),
        "desktopArtifactPath": _string_field(manifest, "desktopArtifactPath"),
        "checkCount": len(check_ids),
        "requiredCheckCount": len(DESKTOP_RELEASE_REQUIRED_CHECKS),
        "checkIds": check_ids,
        "paperOnly": bool(manifest.get("paperOnly")) if manifest else False,
        "liveTradingAllowed": bool(manifest.get("liveTradingAllowed")) if manifest else False,
        "liveBlockedBoundary": bool(manifest.get("liveBlockedBoundary")) if manifest else False,
        "manifest": manifest,
    }


def _desktop_release_check_ids(manifest: dict[str, Any] | None) -> list[str]:
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
