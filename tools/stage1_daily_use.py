from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence


def ensure_quant_core_import_path(project_root: Path | None = None) -> None:
    root = project_root or Path(__file__).resolve().parents[1]
    quant_core_root = root / "services" / "quant_core"
    if quant_core_root.exists() and str(quant_core_root) not in sys.path:
        sys.path.insert(0, str(quant_core_root))


ensure_quant_core_import_path()

from quant_core.desktop_release import DEFAULT_DESKTOP_RELEASE_REPORT_PATH, load_desktop_release_status  # noqa: E402
from quant_core.p0_acceptance import DEFAULT_P0_ACCEPTANCE_REPORT_PATH, load_p0_acceptance_status  # noqa: E402
from quant_core.p1_acceptance import DEFAULT_P1_ACCEPTANCE_REPORT_PATH, load_p1_acceptance_status  # noqa: E402


DEFAULT_STAGE1_DAILY_USE_REPORT_PATH = Path("data") / "stage1-daily-use.json"
STAGE1_ROW_STATUSES = {"ready", "review", "blocked"}


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

    rows = [
        _build_clean_open_row(p0_status, p1_status),
        _build_desktop_release_row(desktop_status),
    ]
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


def load_stage1_daily_use_report(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"Stage 1 daily-use report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"Stage 1 daily-use report is not valid JSON: {error}") from error
    validate_stage1_daily_use_report(payload)
    return payload


def validate_stage1_daily_use_report(report: Any) -> str:
    if not isinstance(report, dict):
        raise ValueError("Stage 1 daily-use report must be an object")
    if report.get("kind") != "aiqt.stage1DailyUseReport":
        raise ValueError("Stage 1 daily-use report kind must be aiqt.stage1DailyUseReport")
    if report.get("schemaVersion") != 1:
        raise ValueError("Stage 1 daily-use report schemaVersion must be 1")
    status = str(report.get("status") or "").strip()
    if status not in STAGE1_ROW_STATUSES:
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
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Stage 1 daily-use report row must be an object")
        row_id = str(row.get("id") or "").strip()
        row_status = str(row.get("status") or "").strip()
        if not row_id:
            raise ValueError("Stage 1 daily-use report row id is required")
        if row_status not in STAGE1_ROW_STATUSES:
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

    if report.get("readyCount") != ready_count:
        raise ValueError("Stage 1 daily-use report readyCount does not match rows")
    if report.get("totalCount") != len(rows):
        raise ValueError("Stage 1 daily-use report totalCount does not match rows")
    if status != _overall_status(rows):
        raise ValueError("Stage 1 daily-use report status does not match rows")

    return f"stage1 daily-use report status={status} ready={ready_count}/{len(rows)} liveBlocked=True"


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build or validate the local Stage 1 daily-use report.")
    parser.add_argument("--project-root", default=str(Path(__file__).resolve().parents[1]), help="Repository root.")
    parser.add_argument("--output", default=str(DEFAULT_STAGE1_DAILY_USE_REPORT_PATH), help="Report output path.")
    parser.add_argument("--validate", help="Validate an existing Stage 1 daily-use report path.")
    parser.add_argument("--p0-acceptance", help="P0 acceptance manifest path.")
    parser.add_argument("--p1-acceptance", help="P1 acceptance manifest path.")
    parser.add_argument("--desktop-release", help="Desktop release manifest path.")
    parser.add_argument("--print-json", action="store_true", help="Print the full report JSON.")
    args = parser.parse_args(argv)

    project_root = Path(args.project_root)
    if args.validate:
        report = load_stage1_daily_use_report(_resolve_under_root(project_root.resolve(), Path(args.validate)))
        summary = validate_stage1_daily_use_report(report)
        if args.print_json:
            print(json.dumps(report, ensure_ascii=False, indent=2))
        else:
            print(f"{summary} input={args.validate}")
        return 0

    report = write_stage1_daily_use_report(
        project_root=project_root,
        output_path=Path(args.output),
        p0_path=Path(args.p0_acceptance) if args.p0_acceptance else None,
        p1_path=Path(args.p1_acceptance) if args.p1_acceptance else None,
        desktop_path=Path(args.desktop_release) if args.desktop_release else None,
    )
    if args.print_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(
            "stage1 daily-use report "
            f"status={report['status']} ready={report['readyCount']}/{report['totalCount']} output={Path(args.output)}"
        )
    return 0


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


if __name__ == "__main__":
    raise SystemExit(main())
