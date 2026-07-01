from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.desktop_release import DEFAULT_DESKTOP_RELEASE_REPORT_PATH, load_desktop_release_status
from quant_core.p0_acceptance import DEFAULT_P0_ACCEPTANCE_REPORT_PATH, load_p0_acceptance_status
from quant_core.p1_acceptance import DEFAULT_P1_ACCEPTANCE_REPORT_PATH, load_p1_acceptance_status
from quant_core.stage1_daily_use import DEFAULT_STAGE1_DAILY_USE_REPORT_PATH, load_stage1_daily_use_status


DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH = Path("data") / "stage1-bootstrap-preflight.json"
STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_IDS = [
    "package-scripts",
    "p0-acceptance",
    "p1-acceptance",
    "desktop-release",
    "stage1-daily-use",
    "live-blocked-boundary",
]
STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_STATUSES = {"ready", "review", "blocked"}
REQUIRED_PACKAGE_SCRIPTS = {
    "stage1:daily",
    "stage1:daily:validate",
    "desktop:release",
    "desktop:release:record",
    "docker:smoke:p0:validate",
    "docker:smoke:p1:validate",
}
NEXT_ACTIONS = {
    "package-scripts": ("repair-package-scripts", "npm install"),
    "p0-acceptance": ("run-p0-acceptance", "npm run docker:smoke:p0 -- --no-build --down"),
    "p1-acceptance": ("run-p1-acceptance", "npm run docker:smoke:p1 -- --no-build --down"),
    "desktop-release": ("run-desktop-release", "npm run desktop:release"),
    "stage1-daily-use": ("refresh-stage1-daily-use", "npm run stage1:daily"),
    "live-blocked-boundary": ("review-live-blocked-boundary", "npm run stage1:preflight:validate"),
}


def build_stage1_bootstrap_preflight(*, project_root: Path, generated_at: str | None = None) -> dict[str, Any]:
    root = project_root.resolve()
    p0_status = load_p0_acceptance_status(_resolve_under_root(root, DEFAULT_P0_ACCEPTANCE_REPORT_PATH))
    p1_status = load_p1_acceptance_status(_resolve_under_root(root, DEFAULT_P1_ACCEPTANCE_REPORT_PATH))
    desktop_status = load_desktop_release_status(_resolve_under_root(root, DEFAULT_DESKTOP_RELEASE_REPORT_PATH))
    daily_use_status = load_stage1_daily_use_status(_resolve_under_root(root, DEFAULT_STAGE1_DAILY_USE_REPORT_PATH))

    checks = [
        _package_scripts_check(root),
        _manifest_check(
            check_id="p0-acceptance",
            label="P0 acceptance",
            status_payload=p0_status,
            ready_status="passed",
            source_path=str(DEFAULT_P0_ACCEPTANCE_REPORT_PATH),
        ),
        _manifest_check(
            check_id="p1-acceptance",
            label="P1 acceptance",
            status_payload=p1_status,
            ready_status="passed",
            source_path=str(DEFAULT_P1_ACCEPTANCE_REPORT_PATH),
        ),
        _manifest_check(
            check_id="desktop-release",
            label="Desktop release",
            status_payload=desktop_status,
            ready_status="passed",
            source_path=str(DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
        ),
        _daily_use_check(daily_use_status),
        _live_blocked_boundary_check([p0_status, p1_status, desktop_status, daily_use_status]),
    ]
    status = _overall_status(checks)
    ready_count = sum(1 for check in checks if check["status"] == "ready")
    review_count = sum(1 for check in checks if check["status"] == "review")
    blocked_count = sum(1 for check in checks if check["status"] == "blocked")
    next_action, recommended_command = _next_action(checks)
    preflight = {
        "kind": "aiqt.stage1BootstrapPreflight",
        "schemaVersion": 1,
        "generatedAt": generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "status": status,
        "summary": _summary_for_status(status, ready_count, len(checks)),
        "ready": status == "ready",
        "readyCount": ready_count,
        "reviewCount": review_count,
        "blockedCount": blocked_count,
        "totalCount": len(checks),
        "nextAction": next_action,
        "recommendedCommand": recommended_command,
        "blockerIds": [check["id"] for check in checks if check["status"] == "blocked"],
        "reviewIds": [check["id"] for check in checks if check["status"] == "review"],
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "sourcePaths": {
            "p0Acceptance": str(DEFAULT_P0_ACCEPTANCE_REPORT_PATH),
            "p1Acceptance": str(DEFAULT_P1_ACCEPTANCE_REPORT_PATH),
            "desktopRelease": str(DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
            "stage1DailyUse": str(DEFAULT_STAGE1_DAILY_USE_REPORT_PATH),
        },
        "checks": checks,
    }
    validate_stage1_bootstrap_preflight(preflight)
    return preflight


def write_stage1_bootstrap_preflight(
    *,
    project_root: Path,
    output_path: Path,
    generated_at: str | None = None,
) -> dict[str, Any]:
    root = project_root.resolve()
    output = _resolve_under_root(root, output_path)
    preflight = build_stage1_bootstrap_preflight(project_root=root, generated_at=generated_at)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(preflight, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return preflight


def load_stage1_bootstrap_preflight_report(path: Path = DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"Stage 1 bootstrap preflight report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"Stage 1 bootstrap preflight report is not valid JSON: {error}") from error
    validate_stage1_bootstrap_preflight(payload)
    return payload


def load_stage1_bootstrap_preflight_status(
    path: Path = DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH,
) -> dict[str, Any]:
    source_path = Path(path)
    try:
        report = load_stage1_bootstrap_preflight_report(source_path)
    except FileNotFoundError as error:
        return _stage1_bootstrap_preflight_status(
            status="missing",
            source_path=source_path,
            summary="Stage 1 bootstrap preflight report is missing.",
            reason=str(error),
        )
    except ValueError as error:
        return _stage1_bootstrap_preflight_status(
            status="invalid",
            source_path=source_path,
            summary="Stage 1 bootstrap preflight report is invalid.",
            reason=str(error),
        )
    return {
        **report,
        "sourcePath": _display_path_for_status(source_path),
    }


def validate_stage1_bootstrap_preflight(preflight: Any) -> str:
    if not isinstance(preflight, dict):
        raise ValueError("Stage 1 bootstrap preflight must be an object")
    if preflight.get("kind") != "aiqt.stage1BootstrapPreflight":
        raise ValueError("Stage 1 bootstrap preflight kind must be aiqt.stage1BootstrapPreflight")
    if preflight.get("schemaVersion") != 1:
        raise ValueError("Stage 1 bootstrap preflight schemaVersion must be 1")
    status = str(preflight.get("status") or "").strip()
    if status not in STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_STATUSES:
        raise ValueError("Stage 1 bootstrap preflight status must be ready, review, or blocked")
    if not str(preflight.get("generatedAt") or "").strip():
        raise ValueError("Stage 1 bootstrap preflight generatedAt is required")
    if preflight.get("paperOnly") is not True:
        raise ValueError("Stage 1 bootstrap preflight must be paper-only")
    if preflight.get("liveTradingAllowed") is not False:
        raise ValueError("Stage 1 bootstrap preflight live trading must remain disabled")
    if preflight.get("liveBlockedBoundary") is not True:
        raise ValueError("Stage 1 bootstrap preflight live-blocked boundary must be enforced")

    checks = preflight.get("checks")
    if not isinstance(checks, list) or len(checks) != len(STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_IDS):
        raise ValueError("Stage 1 bootstrap preflight checks must contain all required checks")
    check_ids = []
    ready_count = 0
    review_count = 0
    blocked_count = 0
    for check in checks:
        if not isinstance(check, dict):
            raise ValueError("Stage 1 bootstrap preflight check must be an object")
        check_id = str(check.get("id") or "").strip()
        check_status = str(check.get("status") or "").strip()
        if check_status not in STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_STATUSES:
            raise ValueError(f"Stage 1 bootstrap preflight check {check_id} status is invalid")
        if not str(check.get("summary") or "").strip():
            raise ValueError(f"Stage 1 bootstrap preflight check {check_id} summary is required")
        if not str(check.get("recommendedCommand") or "").strip():
            raise ValueError(f"Stage 1 bootstrap preflight check {check_id} recommendedCommand is required")
        check_ids.append(check_id)
        ready_count += 1 if check_status == "ready" else 0
        review_count += 1 if check_status == "review" else 0
        blocked_count += 1 if check_status == "blocked" else 0

    if check_ids != STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_IDS:
        raise ValueError("Stage 1 bootstrap preflight check order is invalid")
    if preflight.get("readyCount") != ready_count:
        raise ValueError("Stage 1 bootstrap preflight readyCount does not match checks")
    if preflight.get("reviewCount") != review_count:
        raise ValueError("Stage 1 bootstrap preflight reviewCount does not match checks")
    if preflight.get("blockedCount") != blocked_count:
        raise ValueError("Stage 1 bootstrap preflight blockedCount does not match checks")
    if preflight.get("totalCount") != len(checks):
        raise ValueError("Stage 1 bootstrap preflight totalCount does not match checks")
    if status != _overall_status(checks):
        raise ValueError("Stage 1 bootstrap preflight status does not match checks")
    if preflight.get("ready") is not (status == "ready"):
        raise ValueError("Stage 1 bootstrap preflight ready flag does not match status")
    if not str(preflight.get("nextAction") or "").strip():
        raise ValueError("Stage 1 bootstrap preflight nextAction is required")
    if not str(preflight.get("recommendedCommand") or "").strip():
        raise ValueError("Stage 1 bootstrap preflight recommendedCommand is required")

    return f"stage1 bootstrap preflight status={status} ready={ready_count}/{len(checks)} next={preflight['nextAction']}"


def _stage1_bootstrap_preflight_status(
    *,
    status: str,
    source_path: Path,
    summary: str,
    reason: str,
) -> dict[str, Any]:
    checks = [
        _check(
            check_id=check_id,
            label=_default_check_label(check_id),
            status="blocked",
            summary=summary,
            recommended_command=NEXT_ACTIONS.get(check_id, ("review-bootstrap-preflight", "npm run stage1:preflight"))[1],
            source_path=_default_check_source_path(check_id),
        )
        for check_id in STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_IDS
    ]
    return {
        "kind": "aiqt.stage1BootstrapPreflight",
        "schemaVersion": 1,
        "generatedAt": None,
        "status": status,
        "summary": summary,
        "reason": reason,
        "ready": False,
        "readyCount": 0,
        "reviewCount": 0,
        "blockedCount": len(checks),
        "totalCount": len(checks),
        "nextAction": "run-stage1-bootstrap-preflight",
        "recommendedCommand": "npm run stage1:preflight",
        "blockerIds": STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_IDS.copy(),
        "reviewIds": [],
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "sourcePath": _display_path_for_status(source_path),
        "sourcePaths": {
            "p0Acceptance": str(DEFAULT_P0_ACCEPTANCE_REPORT_PATH),
            "p1Acceptance": str(DEFAULT_P1_ACCEPTANCE_REPORT_PATH),
            "desktopRelease": str(DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
            "stage1DailyUse": str(DEFAULT_STAGE1_DAILY_USE_REPORT_PATH),
        },
        "checks": checks,
    }


def _package_scripts_check(project_root: Path) -> dict[str, Any]:
    package_path = project_root / "package.json"
    try:
        package_json = json.loads(package_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        missing_scripts = sorted(REQUIRED_PACKAGE_SCRIPTS)
    except json.JSONDecodeError:
        missing_scripts = sorted(REQUIRED_PACKAGE_SCRIPTS)
    else:
        scripts = package_json.get("scripts") if isinstance(package_json, dict) else {}
        missing_scripts = sorted(REQUIRED_PACKAGE_SCRIPTS.difference(scripts if isinstance(scripts, dict) else {}))
    if missing_scripts:
        return _check(
            check_id="package-scripts",
            label="Package scripts",
            status="blocked",
            summary=f"Missing required Stage 1 scripts: {', '.join(missing_scripts)}.",
            recommended_command="npm install",
            source_path="package.json",
        )
    return _check(
        check_id="package-scripts",
        label="Package scripts",
        status="ready",
        summary="Required Stage 1 daily, desktop, and acceptance validation scripts are present.",
        recommended_command="npm run stage1:preflight:validate",
        source_path="package.json",
    )


def _manifest_check(
    *,
    check_id: str,
    label: str,
    status_payload: dict[str, Any],
    ready_status: str,
    source_path: str,
) -> dict[str, Any]:
    status = "ready" if status_payload.get("status") == ready_status else "blocked"
    return _check(
        check_id=check_id,
        label=label,
        status=status,
        summary=str(status_payload.get("summary") or status_payload.get("reason") or f"{label} status is unavailable."),
        recommended_command=NEXT_ACTIONS[check_id][1] if status == "blocked" else "npm run stage1:preflight:validate",
        source_path=source_path,
    )


def _daily_use_check(status_payload: dict[str, Any]) -> dict[str, Any]:
    report_status = str(status_payload.get("status") or "")
    if report_status == "ready":
        status = "ready"
    elif report_status in {"review", "missing"}:
        status = "review"
    else:
        status = "blocked"
    return _check(
        check_id="stage1-daily-use",
        label="Stage 1 daily use",
        status=status,
        summary=str(status_payload.get("summary") or status_payload.get("reason") or "Stage 1 daily-use report is unavailable."),
        recommended_command="npm run stage1:daily" if status != "ready" else "npm run stage1:daily:validate",
        source_path=str(DEFAULT_STAGE1_DAILY_USE_REPORT_PATH),
    )


def _live_blocked_boundary_check(status_payloads: list[dict[str, Any]]) -> dict[str, Any]:
    unsafe_sources: list[str] = []
    for payload in status_payloads:
        if not _payload_has_recorded_evidence(payload):
            continue
        if payload.get("paperOnly") is not True or payload.get("liveTradingAllowed") is not False or payload.get("liveBlockedBoundary") is not True:
            unsafe_sources.append(str(payload.get("sourcePath") or payload.get("kind") or "unknown"))
    if unsafe_sources:
        return _check(
            check_id="live-blocked-boundary",
            label="Live-blocked boundary",
            status="blocked",
            summary=f"Unsafe live boundary detected in: {', '.join(unsafe_sources)}.",
            recommended_command="npm run stage1:preflight:validate",
            source_path="data",
        )
    return _check(
        check_id="live-blocked-boundary",
        label="Live-blocked boundary",
        status="ready",
        summary="Recorded Stage 1 evidence keeps paper-only and live-blocked boundaries enforced.",
        recommended_command="npm run stage1:preflight:validate",
        source_path="data",
    )


def _payload_has_recorded_evidence(payload: dict[str, Any]) -> bool:
    if payload.get("manifest") is not None:
        return True
    return payload.get("kind") == "aiqt.stage1DailyUseReport" and payload.get("generatedAt") is not None


def _check(
    *,
    check_id: str,
    label: str,
    status: str,
    summary: str,
    recommended_command: str,
    source_path: str,
) -> dict[str, Any]:
    return {
        "id": check_id,
        "label": label,
        "status": status,
        "summary": summary,
        "recommendedCommand": recommended_command,
        "sourcePath": source_path,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
    }


def _overall_status(checks: list[dict[str, Any]]) -> str:
    statuses = {check["status"] for check in checks}
    if "blocked" in statuses:
        return "blocked"
    if "review" in statuses:
        return "review"
    return "ready"


def _next_action(checks: list[dict[str, Any]]) -> tuple[str, str]:
    for check in checks:
        if check["status"] != "ready":
            return NEXT_ACTIONS[check["id"]]
    return "open-daily-workbench", "npm run dev"


def _summary_for_status(status: str, ready_count: int, total_count: int) -> str:
    if status == "ready":
        return f"Stage 1 bootstrap preflight is ready ({ready_count}/{total_count} checks ready)."
    if status == "review":
        return f"Stage 1 bootstrap preflight needs review ({ready_count}/{total_count} checks ready)."
    return f"Stage 1 bootstrap preflight is blocked ({ready_count}/{total_count} checks ready)."


def _resolve_under_root(project_root: Path, path: Path) -> Path:
    return path if path.is_absolute() else project_root / path


def _display_path_for_status(path: Path) -> str:
    if not path.is_absolute():
        return str(path)
    resolved = path.resolve()
    if resolved.parent.name == "data":
        return str(Path("data") / resolved.name)
    return str(path)


def _default_check_label(check_id: str) -> str:
    return {
        "package-scripts": "Package scripts",
        "p0-acceptance": "P0 acceptance",
        "p1-acceptance": "P1 acceptance",
        "desktop-release": "Desktop release",
        "stage1-daily-use": "Stage 1 daily use",
        "live-blocked-boundary": "Live-blocked boundary",
    }.get(check_id, check_id)


def _default_check_source_path(check_id: str) -> str:
    return {
        "package-scripts": "package.json",
        "p0-acceptance": str(DEFAULT_P0_ACCEPTANCE_REPORT_PATH),
        "p1-acceptance": str(DEFAULT_P1_ACCEPTANCE_REPORT_PATH),
        "desktop-release": str(DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
        "stage1-daily-use": str(DEFAULT_STAGE1_DAILY_USE_REPORT_PATH),
        "live-blocked-boundary": "data",
    }.get(check_id, "data")
