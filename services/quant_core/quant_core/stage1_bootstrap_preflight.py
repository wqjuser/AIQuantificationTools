from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.desktop_release import DEFAULT_DESKTOP_RELEASE_REPORT_PATH, load_desktop_release_status
from quant_core.p0_acceptance import DEFAULT_P0_ACCEPTANCE_REPORT_PATH, load_p0_acceptance_status
from quant_core.p1_acceptance import DEFAULT_P1_ACCEPTANCE_REPORT_PATH, load_p1_acceptance_status
from quant_core.p2_manifest_chain_preflight import (
    DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH,
    load_p2_manifest_chain_preflight_status,
)
from quant_core.stage1_daily_use import DEFAULT_STAGE1_DAILY_USE_REPORT_PATH, load_stage1_daily_use_status


DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH = Path("data") / "stage1-bootstrap-preflight.json"
STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_IDS = [
    "package-scripts",
    "p0-acceptance",
    "p1-acceptance",
    "p2-manifest-chain",
    "desktop-release",
    "stage1-daily-use",
    "live-blocked-boundary",
]
STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_STATUSES = {"ready", "review", "blocked"}
REQUIRED_PACKAGE_SCRIPTS = {
    "stage1:daily",
    "stage1:daily:validate",
    "stage1:prepare",
    "stage1:prepare:quick",
    "stage1:prepare:plan",
    "desktop:release",
    "desktop:release:record",
    "docker:smoke:p0:validate",
    "docker:smoke:p1:validate",
    "docker:smoke:p2:preflight",
}
NEXT_ACTIONS = {
    "package-scripts": ("repair-package-scripts", "npm install"),
    "p0-acceptance": ("run-p0-acceptance", "npm run docker:smoke:p0 -- --no-build --down"),
    "p1-acceptance": ("run-p1-acceptance", "npm run docker:smoke:p1 -- --no-build --down"),
    "p2-manifest-chain": ("review-p2-manifest-chain", "npm run docker:smoke:p2:preflight"),
    "desktop-release": ("run-desktop-release", "npm run desktop:release"),
    "stage1-daily-use": ("refresh-stage1-daily-use", "npm run stage1:daily"),
    "live-blocked-boundary": ("review-live-blocked-boundary", "npm run stage1:preflight:validate"),
}
STAGE1_BOOTSTRAP_PREFLIGHT_REFRESH_COMMAND = "npm run stage1:prepare:quick"


def build_stage1_bootstrap_preflight(*, project_root: Path, generated_at: str | None = None) -> dict[str, Any]:
    root = project_root.resolve()
    p0_status = load_p0_acceptance_status(_resolve_under_root(root, DEFAULT_P0_ACCEPTANCE_REPORT_PATH))
    p1_status = load_p1_acceptance_status(_resolve_under_root(root, DEFAULT_P1_ACCEPTANCE_REPORT_PATH))
    p2_manifest_chain_status = load_p2_manifest_chain_preflight_status(
        _resolve_under_root(root, DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH)
    )
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
        _p2_manifest_chain_check(p2_manifest_chain_status),
        _manifest_check(
            check_id="desktop-release",
            label="Desktop release",
            status_payload=desktop_status,
            ready_status="passed",
            source_path=str(DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
        ),
        _daily_use_check(daily_use_status),
        _live_blocked_boundary_check([p0_status, p1_status, p2_manifest_chain_status, desktop_status, daily_use_status]),
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
            "p2ManifestChainPreflight": str(DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH),
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
        report = _project_stale_source_review(load_stage1_bootstrap_preflight_report(source_path), source_path)
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


def _project_stale_source_review(report: dict[str, Any], report_path: Path) -> dict[str, Any]:
    stale_sources = _stage1_bootstrap_preflight_stale_source_paths(report, report_path)
    if not stale_sources:
        return report

    projected = deepcopy(report)
    stale_check_ids = _stage1_bootstrap_preflight_stale_check_ids(projected, stale_sources)
    for check in projected["checks"]:
        if check["id"] not in stale_check_ids or check["status"] != "ready":
            continue
        check["status"] = "review"
        check["summary"] = f"{check['summary']} Source file changed after this bootstrap preflight was generated."
        check["recommendedCommand"] = STAGE1_BOOTSTRAP_PREFLIGHT_REFRESH_COMMAND

    projected["status"] = _overall_status(projected["checks"])
    projected["ready"] = projected["status"] == "ready"
    projected["readyCount"] = sum(1 for check in projected["checks"] if check["status"] == "ready")
    projected["reviewCount"] = sum(1 for check in projected["checks"] if check["status"] == "review")
    projected["blockedCount"] = sum(1 for check in projected["checks"] if check["status"] == "blocked")
    projected["blockerIds"] = [check["id"] for check in projected["checks"] if check["status"] == "blocked"]
    projected["reviewIds"] = [check["id"] for check in projected["checks"] if check["status"] == "review"]
    projected["summary"] = (
        "Stage 1 bootstrap preflight needs refresh because source files changed: "
        f"{', '.join(stale_sources)}."
    )
    projected["reason"] = projected["summary"]
    projected["staleSourcePaths"] = stale_sources
    if projected["status"] == "review":
        projected["nextAction"] = "refresh-stage1-bootstrap-preflight"
        projected["recommendedCommand"] = STAGE1_BOOTSTRAP_PREFLIGHT_REFRESH_COMMAND
    else:
        projected["nextAction"], projected["recommendedCommand"] = _next_action(projected["checks"])
    validate_stage1_bootstrap_preflight(projected)
    return projected


def _stage1_bootstrap_preflight_stale_source_paths(report: dict[str, Any], report_path: Path) -> list[str]:
    try:
        report_mtime_ns = Path(report_path).stat().st_mtime_ns
    except OSError:
        return []
    project_root = _stage1_bootstrap_preflight_project_root_for_report(Path(report_path))
    source_paths = report.get("sourcePaths")
    if not isinstance(source_paths, dict):
        source_paths = {}
    candidate_sources = [
        "package.json",
        str(source_paths.get("p0Acceptance") or DEFAULT_P0_ACCEPTANCE_REPORT_PATH),
        str(source_paths.get("p1Acceptance") or DEFAULT_P1_ACCEPTANCE_REPORT_PATH),
        str(source_paths.get("p2ManifestChainPreflight") or DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH),
        str(source_paths.get("desktopRelease") or DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
        str(source_paths.get("stage1DailyUse") or DEFAULT_STAGE1_DAILY_USE_REPORT_PATH),
    ]
    stale_paths: list[str] = []
    for source_label in candidate_sources:
        source_label = str(source_label or "").strip()
        if not source_label:
            continue
        source_path = _resolve_under_root(project_root, Path(source_label))
        try:
            source_mtime_ns = source_path.stat().st_mtime_ns
        except OSError:
            stale_paths.append(_display_path_for_status(source_path) if Path(source_label).is_absolute() else source_label)
            continue
        if source_mtime_ns > report_mtime_ns:
            stale_paths.append(_display_path_for_status(source_path) if Path(source_label).is_absolute() else source_label)
    return stale_paths


def _stage1_bootstrap_preflight_stale_check_ids(report: dict[str, Any], stale_sources: list[str]) -> set[str]:
    source_paths = report.get("sourcePaths") if isinstance(report.get("sourcePaths"), dict) else {}
    source_to_checks = {
        "package.json": {"package-scripts"},
        str(source_paths.get("p0Acceptance") or DEFAULT_P0_ACCEPTANCE_REPORT_PATH): {"p0-acceptance"},
        str(source_paths.get("p1Acceptance") or DEFAULT_P1_ACCEPTANCE_REPORT_PATH): {"p1-acceptance"},
        str(source_paths.get("p2ManifestChainPreflight") or DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH): {
            "p2-manifest-chain"
        },
        str(source_paths.get("desktopRelease") or DEFAULT_DESKTOP_RELEASE_REPORT_PATH): {"desktop-release"},
        str(source_paths.get("stage1DailyUse") or DEFAULT_STAGE1_DAILY_USE_REPORT_PATH): {"stage1-daily-use"},
    }
    check_ids: set[str] = set()
    for source in stale_sources:
        check_ids.update(source_to_checks.get(source, set()))
    return check_ids


def _stage1_bootstrap_preflight_project_root_for_report(report_path: Path) -> Path:
    resolved = report_path.resolve()
    if resolved.parent.name == "data":
        return resolved.parent.parent
    return resolved.parent


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
            "p2ManifestChainPreflight": str(DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH),
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
        summary="Required Stage 1 prepare, daily, desktop, acceptance, and P2 chain scripts are present.",
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


def _p2_manifest_chain_check(status_payload: dict[str, Any]) -> dict[str, Any]:
    report_status = str(status_payload.get("status") or "")
    is_ready = (
        report_status == "ready"
        and status_payload.get("ready") is True
        and status_payload.get("validStageCount") == status_payload.get("totalStageCount")
    )
    if is_ready:
        status = "ready"
        recommended_command = "npm run stage1:preflight:validate"
    elif report_status == "missing":
        status = "review"
        recommended_command = NEXT_ACTIONS["p2-manifest-chain"][1]
    elif report_status == "blocked":
        status = "review"
        recommended_command = str(status_payload.get("nextCommand") or "").strip() or NEXT_ACTIONS["p2-manifest-chain"][1]
    else:
        status = "blocked"
        recommended_command = NEXT_ACTIONS["p2-manifest-chain"][1]
    return _check(
        check_id="p2-manifest-chain",
        label="P2 manifest chain",
        status=status,
        summary=str(
            status_payload.get("summary")
            or status_payload.get("reason")
            or "P2 manifest chain preflight status is unavailable."
        ),
        recommended_command=recommended_command,
        source_path=str(DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH),
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
    if payload.get("kind") == "aiqt.p2ManifestChainPreflightStatus":
        return str(payload.get("status") or "") != "missing" and bool(payload.get("sourcePath"))
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
            action, default_command = NEXT_ACTIONS[check["id"]]
            return action, str(check.get("recommendedCommand") or default_command)
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
        "p2-manifest-chain": "P2 manifest chain",
        "desktop-release": "Desktop release",
        "stage1-daily-use": "Stage 1 daily use",
        "live-blocked-boundary": "Live-blocked boundary",
    }.get(check_id, check_id)


def _default_check_source_path(check_id: str) -> str:
    return {
        "package-scripts": "package.json",
        "p0-acceptance": str(DEFAULT_P0_ACCEPTANCE_REPORT_PATH),
        "p1-acceptance": str(DEFAULT_P1_ACCEPTANCE_REPORT_PATH),
        "p2-manifest-chain": str(DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH),
        "desktop-release": str(DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
        "stage1-daily-use": str(DEFAULT_STAGE1_DAILY_USE_REPORT_PATH),
        "live-blocked-boundary": "data",
    }.get(check_id, "data")
