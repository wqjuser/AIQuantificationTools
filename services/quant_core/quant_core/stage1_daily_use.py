from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.desktop_release import DEFAULT_DESKTOP_RELEASE_REPORT_PATH, load_desktop_release_status
from quant_core.p0_acceptance import DEFAULT_P0_ACCEPTANCE_REPORT_PATH, load_p0_acceptance_status
from quant_core.p1_acceptance import DEFAULT_P1_ACCEPTANCE_REPORT_PATH, load_p1_acceptance_status


DEFAULT_STAGE1_DAILY_USE_REPORT_PATH = Path("data") / "stage1-daily-use.json"
STAGE1_DAILY_USE_ROW_IDS = [
    "clean-open",
    "market-refresh-recovery",
    "research-entry",
    "daily-start",
    "desktop-release",
]
STAGE1_DAILY_USE_ROW_STATUSES = {"ready", "review", "blocked"}
STAGE1_DAILY_USE_REPORT_STATUSES = STAGE1_DAILY_USE_ROW_STATUSES


def build_stage1_daily_use_report(
    *,
    project_root: Path,
    p0_path: Path | None = None,
    p1_path: Path | None = None,
    desktop_path: Path | None = None,
    generated_at: str | None = None,
) -> dict[str, Any]:
    root = project_root.resolve()
    p0_report_path = _resolve_under_root(root, p0_path or DEFAULT_P0_ACCEPTANCE_REPORT_PATH)
    p1_report_path = _resolve_under_root(root, p1_path or DEFAULT_P1_ACCEPTANCE_REPORT_PATH)
    desktop_report_path = _resolve_under_root(root, desktop_path or DEFAULT_DESKTOP_RELEASE_REPORT_PATH)

    p0_status = load_p0_acceptance_status(p0_report_path)
    p1_status = load_p1_acceptance_status(p1_report_path)
    desktop_status = load_desktop_release_status(desktop_report_path)

    clean_open_row = _build_clean_open_row(p0_status, p1_status)
    market_refresh_row = _build_market_refresh_recovery_row(p1_status)
    research_entry_row = _build_research_entry_row(p1_status)
    daily_start_row = _build_daily_start_row(clean_open_row, market_refresh_row, research_entry_row)
    desktop_release_row = _build_desktop_release_row(desktop_status)
    rows = [clean_open_row, market_refresh_row, research_entry_row, daily_start_row, desktop_release_row]
    status = _overall_status(rows)
    report = {
        "kind": "aiqt.stage1DailyUseReport",
        "schemaVersion": 1,
        "generatedAt": generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "status": status,
        "summary": _summary_for_status(status, rows),
        "readyCount": sum(1 for row in rows if row["status"] == "ready"),
        "totalCount": len(rows),
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "sourcePaths": {
            "p0Acceptance": _display_path(root, p0_report_path),
            "p1Acceptance": _display_path(root, p1_report_path),
            "desktopRelease": _display_path(root, desktop_report_path),
        },
        "rows": rows,
    }
    validate_stage1_daily_use_report(report)
    return report


def write_stage1_daily_use_report(
    *,
    project_root: Path,
    output_path: Path,
    p0_path: Path | None = None,
    p1_path: Path | None = None,
    desktop_path: Path | None = None,
    generated_at: str | None = None,
) -> dict[str, Any]:
    root = project_root.resolve()
    output = _resolve_under_root(root, output_path)
    report = build_stage1_daily_use_report(
        project_root=root,
        p0_path=p0_path,
        p1_path=p1_path,
        desktop_path=desktop_path,
        generated_at=generated_at,
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def load_stage1_daily_use_report(path: Path = DEFAULT_STAGE1_DAILY_USE_REPORT_PATH) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"Stage 1 daily-use report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"Stage 1 daily-use report is not valid JSON: {error}") from error
    validate_stage1_daily_use_report(payload)
    return payload


def load_stage1_daily_use_status(path: Path = DEFAULT_STAGE1_DAILY_USE_REPORT_PATH) -> dict[str, Any]:
    source_path = Path(path)
    try:
        return _project_stale_source_review(load_stage1_daily_use_report(source_path), source_path)
    except FileNotFoundError as error:
        return _stage1_daily_use_status(
            status="missing",
            source_path=source_path,
            summary="Stage 1 daily-use report is missing.",
            reason=str(error),
        )
    except ValueError as error:
        return _stage1_daily_use_status(
            status="invalid",
            source_path=source_path,
            summary="Stage 1 daily-use report is invalid.",
            reason=str(error),
        )


def _project_stale_source_review(report: dict[str, Any], report_path: Path) -> dict[str, Any]:
    stale_sources = _stage1_daily_use_stale_source_paths(report, report_path)
    if not stale_sources:
        return report
    projected = deepcopy(report)
    stale_row_ids = _stage1_daily_use_stale_row_ids(projected, stale_sources)
    for row in projected["rows"]:
        if row["id"] not in stale_row_ids or row["status"] != "ready":
            continue
        row["status"] = "review"
        row["value"] = "Daily-use evidence should be refreshed"
        row["summary"] = f"{row['summary']} Source manifest changed after this daily-use report was generated."
        row["action"] = "npm run stage1:daily"
    projected["status"] = _overall_status(projected["rows"])
    projected["readyCount"] = sum(1 for row in projected["rows"] if row["status"] == "ready")
    projected["summary"] = (
        "Stage 1 daily-use report needs refresh because source manifests changed: "
        f"{', '.join(stale_sources)}."
    )
    projected["reason"] = projected["summary"]
    projected["staleSourcePaths"] = stale_sources
    validate_stage1_daily_use_report(projected)
    return projected


def _stage1_daily_use_stale_source_paths(report: dict[str, Any], report_path: Path) -> list[str]:
    try:
        report_mtime_ns = Path(report_path).stat().st_mtime_ns
    except OSError:
        return []
    project_root = _stage1_daily_use_project_root_for_report(Path(report_path))
    source_paths = report.get("sourcePaths")
    if not isinstance(source_paths, dict):
        return []
    stale_paths: list[str] = []
    for value in source_paths.values():
        source_label = str(value or "").strip()
        if not source_label:
            continue
        source_path = _resolve_under_root(project_root, Path(source_label))
        try:
            source_mtime_ns = source_path.stat().st_mtime_ns
        except OSError:
            stale_paths.append(source_label)
            continue
        if source_mtime_ns > report_mtime_ns:
            stale_paths.append(source_label)
    return stale_paths


def _stage1_daily_use_project_root_for_report(report_path: Path) -> Path:
    resolved = report_path.resolve()
    if resolved.parent.name == "data":
        return resolved.parent.parent
    return resolved.parent


def _stage1_daily_use_stale_row_ids(report: dict[str, Any], stale_sources: list[str]) -> set[str]:
    source_paths = report.get("sourcePaths") if isinstance(report.get("sourcePaths"), dict) else {}
    source_to_rows = {
        str(source_paths.get("p0Acceptance") or ""): {"clean-open", "daily-start"},
        str(source_paths.get("p1Acceptance") or ""): {
            "clean-open",
            "market-refresh-recovery",
            "research-entry",
            "daily-start",
        },
        str(source_paths.get("desktopRelease") or ""): {"desktop-release"},
    }
    row_ids: set[str] = set()
    for source in stale_sources:
        row_ids.update(source_to_rows.get(source, set()))
    return row_ids


def validate_stage1_daily_use_report(report: Any) -> str:
    if not isinstance(report, dict):
        raise ValueError("Stage 1 daily-use report must be an object")
    if report.get("kind") != "aiqt.stage1DailyUseReport":
        raise ValueError("Stage 1 daily-use report kind must be aiqt.stage1DailyUseReport")
    if report.get("schemaVersion") != 1:
        raise ValueError("Stage 1 daily-use report schemaVersion must be 1")
    status = str(report.get("status") or "").strip()
    if status not in STAGE1_DAILY_USE_REPORT_STATUSES:
        raise ValueError("Stage 1 daily-use report status must be ready, review, or blocked")
    if not str(report.get("generatedAt") or "").strip():
        raise ValueError("Stage 1 daily-use report generatedAt is required")
    if report.get("paperOnly") is not True:
        raise ValueError("Stage 1 daily-use report must be paper-only")
    if report.get("liveTradingAllowed") is not False:
        raise ValueError("Stage 1 daily-use report live trading must remain disabled")
    if report.get("liveBlockedBoundary") is not True:
        raise ValueError("Stage 1 daily-use report live-blocked boundary must be enforced")

    source_paths = report.get("sourcePaths")
    if not isinstance(source_paths, dict):
        raise ValueError("Stage 1 daily-use report sourcePaths must be an object")

    rows = report.get("rows")
    if not isinstance(rows, list) or not rows:
        raise ValueError("Stage 1 daily-use report rows must be a non-empty list")

    ready_count = 0
    row_ids: list[str] = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Stage 1 daily-use report row must be an object")
        row_id = str(row.get("id") or "").strip()
        row_status = str(row.get("status") or "").strip()
        if not row_id:
            raise ValueError("Stage 1 daily-use report row id is required")
        if row_status not in STAGE1_DAILY_USE_ROW_STATUSES:
            raise ValueError(f"Stage 1 daily-use report row {row_id} status is invalid")
        if not str(row.get("summary") or "").strip():
            raise ValueError(f"Stage 1 daily-use report row {row_id} summary is required")
        if not str(row.get("action") or "").strip():
            raise ValueError(f"Stage 1 daily-use report row {row_id} action is required")
        if row.get("paperOnly") is not True:
            raise ValueError(f"Stage 1 daily-use report row {row_id} must be paper-only")
        if row.get("liveTradingAllowed") is not False:
            raise ValueError(f"Stage 1 daily-use report row {row_id} live trading must remain disabled")
        if row.get("liveBlockedBoundary") is not True:
            raise ValueError(f"Stage 1 daily-use report row {row_id} live-blocked boundary must be enforced")
        if row_status == "ready":
            ready_count += 1
        row_ids.append(row_id)

    if row_ids != STAGE1_DAILY_USE_ROW_IDS:
        raise ValueError(
            "Stage 1 daily-use report row order must be clean-open, market-refresh-recovery, research-entry, daily-start, desktop-release"
        )
    if report.get("readyCount") != ready_count:
        raise ValueError("Stage 1 daily-use report readyCount does not match rows")
    if report.get("totalCount") != len(rows):
        raise ValueError("Stage 1 daily-use report totalCount does not match rows")
    if status != _overall_status(rows):
        raise ValueError("Stage 1 daily-use report status does not match rows")

    return f"stage1 daily-use report status={status} ready={ready_count}/{len(rows)} liveBlocked=True"


def _stage1_daily_use_status(*, status: str, source_path: Path, summary: str, reason: str) -> dict[str, Any]:
    return {
        "kind": "aiqt.stage1DailyUseReport",
        "schemaVersion": 1,
        "generatedAt": None,
        "status": status,
        "summary": summary,
        "reason": reason,
        "readyCount": 0,
        "totalCount": len(STAGE1_DAILY_USE_ROW_IDS),
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "sourcePath": str(source_path),
        "sourcePaths": {
            "p0Acceptance": str(DEFAULT_P0_ACCEPTANCE_REPORT_PATH),
            "p1Acceptance": str(DEFAULT_P1_ACCEPTANCE_REPORT_PATH),
            "desktopRelease": str(DEFAULT_DESKTOP_RELEASE_REPORT_PATH),
        },
        "rows": [
            _fallback_row(
                row_id="clean-open",
                label="Clean environment startup",
                value="Stage 1 report unavailable",
                summary=summary,
                action="npm run stage1:daily",
            ),
            _fallback_row(
                row_id="market-refresh-recovery",
                label="Market refresh recovery",
                value="Stage 1 report unavailable",
                summary=summary,
                action="npm run stage1:daily",
            ),
            _fallback_row(
                row_id="research-entry",
                label="Research entry",
                value="Stage 1 report unavailable",
                summary=summary,
                action="npm run stage1:daily",
            ),
            _fallback_row(
                row_id="daily-start",
                label="Daily start path",
                value="Stage 1 report unavailable",
                summary=summary,
                action="npm run stage1:daily",
            ),
            _fallback_row(
                row_id="desktop-release",
                label="Desktop release",
                value="Stage 1 report unavailable",
                summary=summary,
                action="npm run stage1:daily",
            ),
        ],
    }


def _fallback_row(*, row_id: str, label: str, value: str, summary: str, action: str) -> dict[str, Any]:
    return {
        "id": row_id,
        "label": label,
        "status": "blocked",
        "value": value,
        "summary": summary,
        "action": action,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
    }


def _build_market_refresh_recovery_row(p1_status: dict[str, Any]) -> dict[str, Any]:
    if _p1_status_has_ready_check(p1_status, "watchlist-refresh"):
        status = "ready"
        value = "Watchlist refresh recovery evidence is ready"
        refresh_run = p1_status.get("watchlistRefreshRunId") or "recorded refresh"
        watchlist_count = p1_status.get("watchlistCount") or 0
        summary = f"P1 acceptance includes watchlist refresh {refresh_run} for {watchlist_count} symbols."
        action = "npm run stage1:daily:validate"
    elif p1_status.get("status") == "invalid":
        status = "blocked"
        value = "P1 refresh recovery evidence is invalid"
        summary = f"P1 acceptance is invalid: {p1_status['summary']}"
        action = "npm run docker:smoke:p1 -- --no-build --down"
    else:
        status = "review"
        value = "Refresh recovery evidence should be refreshed"
        summary = f"P1 acceptance is {p1_status['status']}: {p1_status['summary']}"
        action = "npm run docker:smoke:p1 -- --no-build --down"
    return {
        "id": "market-refresh-recovery",
        "label": "Market refresh recovery",
        "status": status,
        "value": value,
        "summary": summary,
        "action": action,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "p1Status": p1_status,
    }


def _build_research_entry_row(p1_status: dict[str, Any]) -> dict[str, Any]:
    if _p1_status_has_ready_check(p1_status, "queue-pipeline"):
        status = "ready"
        value = "Research queue entry evidence is ready"
        run_id = p1_status.get("runId") or "recorded run"
        symbol = p1_status.get("queuedSymbol") or "queued symbol"
        refresh_run = p1_status.get("watchlistRefreshRunId") or "recorded refresh"
        summary = f"P1 acceptance includes queued research pipeline {run_id} for {symbol} from {refresh_run}."
        action = "npm run stage1:daily:validate"
    elif p1_status.get("status") == "invalid":
        status = "blocked"
        value = "P1 research entry evidence is invalid"
        summary = f"P1 acceptance is invalid: {p1_status['summary']}"
        action = "npm run docker:smoke:p1 -- --no-build --down"
    else:
        status = "review"
        value = "Research entry evidence should be refreshed"
        summary = f"P1 acceptance is {p1_status['status']}: {p1_status['summary']}"
        action = "npm run docker:smoke:p1 -- --no-build --down"
    return {
        "id": "research-entry",
        "label": "Research entry",
        "status": status,
        "value": value,
        "summary": summary,
        "action": action,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "p1Status": p1_status,
    }


def _build_daily_start_row(*upstream_rows: dict[str, Any]) -> dict[str, Any]:
    status = _overall_status(list(upstream_rows))
    blocked_ids = [row["id"] for row in upstream_rows if row["status"] == "blocked"]
    review_ids = [row["id"] for row in upstream_rows if row["status"] == "review"]
    if status == "ready":
        value = "Daily start path is ready"
        summary = "Daily start has clean-open, refresh recovery, and research entry evidence."
        action = "npm run stage1:daily:validate"
    elif status == "blocked":
        value = "Daily start path is blocked"
        summary = f"Daily start is blocked by: {', '.join(blocked_ids)}."
        action = "npm run stage1:daily"
    else:
        value = "Daily start path needs review"
        summary = f"Daily start should review: {', '.join(review_ids)}."
        action = "npm run stage1:daily:validate"
    return {
        "id": "daily-start",
        "label": "Daily start path",
        "status": status,
        "value": value,
        "summary": summary,
        "action": action,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "blockedRowIds": blocked_ids,
        "reviewRowIds": review_ids,
    }


def _build_clean_open_row(p0_status: dict[str, Any], p1_status: dict[str, Any]) -> dict[str, Any]:
    p0_ready = _status_passed_with_live_blocked_boundary(p0_status)
    p1_ready = _status_passed_with_live_blocked_boundary(p1_status)
    if not p0_ready:
        status = "blocked"
        value = "P0 acceptance needs to pass before daily use"
        summary = f"P0 acceptance is {p0_status['status']}: {p0_status['summary']}"
        action = "npm run docker:smoke:p0 -- --no-build --down"
    elif not p1_ready:
        status = "review"
        value = "P1 acceptance should be refreshed for team daily use"
        summary = f"P1 acceptance is {p1_status['status']}: {p1_status['summary']}"
        action = "npm run docker:smoke:p1 -- --no-build --down"
    else:
        status = "ready"
        value = "P0/P1 acceptance evidence is ready"
        summary = "Clean environment startup has current P0 and P1 acceptance evidence."
        action = "npm run stage1:daily:validate"
    return {
        "id": "clean-open",
        "label": "Clean environment startup",
        "status": status,
        "value": value,
        "summary": summary,
        "action": action,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "p0Status": p0_status,
        "p1Status": p1_status,
    }


def _build_desktop_release_row(desktop_status: dict[str, Any]) -> dict[str, Any]:
    if _status_passed_with_live_blocked_boundary(desktop_status):
        status = "ready"
        value = "Desktop release manifest is ready"
        summary = desktop_status["summary"]
        action = "npm run stage1:daily:validate"
    elif desktop_status["status"] == "invalid":
        status = "blocked"
        value = "Desktop release manifest is invalid"
        summary = desktop_status["summary"]
        action = "npm run desktop:release"
    else:
        status = "review"
        value = "Desktop release manifest is missing"
        summary = desktop_status["summary"]
        action = "npm run desktop:release"
    return {
        "id": "desktop-release",
        "label": "Desktop release",
        "status": status,
        "value": value,
        "summary": summary,
        "action": action,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "desktopReleaseStatus": desktop_status,
    }


def _status_passed_with_live_blocked_boundary(status: dict[str, Any]) -> bool:
    return (
        status.get("status") == "passed"
        and status.get("paperOnly") is True
        and status.get("liveTradingAllowed") is False
        and status.get("liveBlockedBoundary") is True
    )


def _p1_status_has_ready_check(p1_status: dict[str, Any], check_id: str) -> bool:
    return _status_passed_with_live_blocked_boundary(p1_status) and check_id in set(p1_status.get("checkIds") or [])


def _overall_status(rows: list[dict[str, Any]]) -> str:
    statuses = {row["status"] for row in rows}
    if "blocked" in statuses:
        return "blocked"
    if "review" in statuses:
        return "review"
    return "ready"


def _summary_for_status(status: str, rows: list[dict[str, Any]]) -> str:
    ready_count = sum(1 for row in rows if row["status"] == "ready")
    if status == "ready":
        return f"Stage 1 daily use is ready ({ready_count}/{len(rows)} checks ready)."
    if status == "blocked":
        return f"Stage 1 daily use is blocked ({ready_count}/{len(rows)} checks ready)."
    return f"Stage 1 daily use needs review ({ready_count}/{len(rows)} checks ready)."


def _resolve_under_root(project_root: Path, path: Path) -> Path:
    return path if path.is_absolute() else project_root / path


def _display_path(project_root: Path, path: Path) -> str:
    try:
        return path.relative_to(project_root).as_posix()
    except ValueError:
        return path.as_posix()
