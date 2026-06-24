from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence
from urllib.error import URLError
from urllib.request import Request, urlopen


def compose_up_args(build: bool = True) -> list[str]:
    args = ["docker", "compose", "up", "-d"]
    if build:
        args.append("--build")
    return args


def validate_workspace_payload(payload: Any) -> str:
    if not isinstance(payload, dict):
        raise RuntimeError("Invalid /api/workspace response: body is not an object")
    selected = payload.get("selectedInstrument")
    watchlist = payload.get("watchlist")
    schema_version = payload.get("schemaVersion")
    if schema_version != 1 or not isinstance(selected, dict) or not isinstance(watchlist, list):
        raise RuntimeError("Invalid /api/workspace response: missing schema, selected instrument, or watchlist")
    symbol = selected.get("symbol")
    if not isinstance(symbol, str) or not symbol.strip():
        raise RuntimeError("Invalid /api/workspace response: selected instrument symbol is missing")
    return f"workspace schema={schema_version} selected={symbol} watchlist={len(watchlist)}"


def validate_health_payload(payload: Any) -> str:
    if not isinstance(payload, dict) or payload.get("status") != "ok" or payload.get("service") != "quant-core":
        raise RuntimeError("Invalid /health response")
    return f"health status={payload['status']} service={payload['service']}"


def build_p0_pipeline_payload(
    market: str,
    symbol: str,
    timeframe: str,
    *,
    watchlist_refresh_run_id: str | None = None,
) -> dict[str, Any]:
    payload = {
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "limit": 240,
        "strategyConfig": {
            "name": "SMA trend",
            "entry": {"type": "sma_cross", "window": 20},
            "exit": {"type": "sma_break", "window": 20},
            "position": {"maxPositionPct": 20},
            "risk": {"stopLossPct": 8, "maxDrawdownPct": 12},
        },
        "assumptions": {"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
    }
    if watchlist_refresh_run_id:
        payload["watchlistRefreshRunId"] = watchlist_refresh_run_id
    return payload


def build_p0_ai_review_payload(run_id: str, market: str, symbol: str, timeframe: str) -> dict[str, Any]:
    return {
        "runId": run_id,
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
    }


def build_p0_paper_simulation_payload(
    run_id: str,
    market: str,
    symbol: str,
    timeframe: str,
    *,
    quantity: int,
) -> dict[str, Any]:
    return {
        "runId": run_id,
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "quantity": max(1, int(quantity)),
        "route": "paper",
        "liveTradingAllowed": False,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
    }


def _require_dict(payload: Any, label: str) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise RuntimeError(f"Invalid {label} response: body is not an object")
    return payload


def _require_paper_boundary(payload: dict[str, Any], label: str) -> None:
    if payload.get("paperOnly") is not True:
        raise RuntimeError(f"Invalid {label} response: paperOnly is not true")
    if payload.get("liveTradingAllowed") is not False:
        raise RuntimeError(f"Invalid {label} response: liveTradingAllowed is not false")


def validate_p0_pipeline_payload(payload: Any) -> tuple[str, str]:
    response = _require_dict(payload, "P0 pipeline")
    if response.get("status") != "audited_run_created":
        raise RuntimeError("Invalid P0 pipeline response: status is not audited_run_created")
    _require_paper_boundary(response, "P0 pipeline")
    run_id = str(response.get("runId") or "").strip()
    if not run_id:
        raise RuntimeError("Invalid P0 pipeline response: runId is missing")
    if not isinstance(response.get("metrics"), dict):
        raise RuntimeError("Invalid P0 pipeline response: metrics are missing")
    return run_id, f"p0 pipeline run={run_id}"


def validate_p0_ai_review_payload(payload: Any, run_id: str) -> str:
    response = _require_dict(payload, "P0 AI review")
    if response.get("status") != "ai_review_saved":
        raise RuntimeError("Invalid P0 AI review response: status is not ai_review_saved")
    _require_paper_boundary(response, "P0 AI review")
    if response.get("directTradingInstructionBlocked") is not True:
        raise RuntimeError("Invalid P0 AI review response: direct trading instructions are not blocked")
    if not isinstance(response.get("aiReview"), dict):
        raise RuntimeError("Invalid P0 AI review response: aiReview is missing")
    mode = response.get("mode") or "unknown"
    return f"p0 ai-review run={run_id} mode={mode}"


def validate_p0_paper_simulation_payload(payload: Any, run_id: str) -> str:
    response = _require_dict(payload, "P0 paper simulation")
    if response.get("status") != "paper_simulation_created":
        raise RuntimeError("Invalid P0 paper simulation response: status is not paper_simulation_created")
    _require_paper_boundary(response, "P0 paper simulation")
    if response.get("liveOrderSubmitted") is not False or response.get("routeExecuted") is not False:
        raise RuntimeError("Invalid P0 paper simulation response: live order route was not blocked")
    audit_event = response.get("auditEvent")
    if not isinstance(audit_event, dict) or audit_event.get("eventType") != "p0_paper_simulation":
        raise RuntimeError("Invalid P0 paper simulation response: p0_paper_simulation audit event is missing")
    export_readiness = response.get("exportReadiness")
    if not isinstance(export_readiness, dict) or export_readiness.get("ready") is not True:
        raise RuntimeError("Invalid P0 paper simulation response: export readiness is not ready")
    return f"p0 paper-simulation run={run_id} liveBlocked=True"


def _p0_export_package_from_payload(payload: Any) -> dict[str, Any]:
    response = _require_dict(payload, "P0 export")
    export_package = response.get("export", response)
    if not isinstance(export_package, dict):
        raise RuntimeError("Invalid P0 export response: export package is not an object")
    return export_package


def validate_p0_export_payload(payload: Any, run_id: str) -> str:
    export_package = _p0_export_package_from_payload(payload)
    manifest = export_package.get("manifest")
    audit_events = export_package.get("auditEvents")
    completeness = export_package.get("p0PackageCompleteness")
    if not isinstance(manifest, dict) or not isinstance(audit_events, list) or not isinstance(completeness, dict):
        raise RuntimeError("Invalid P0 export response: missing manifest, auditEvents, or p0PackageCompleteness")
    if str(manifest.get("runId") or "").strip() != run_id:
        raise RuntimeError("Invalid P0 export response: manifest runId does not match the accepted run")
    counts = manifest.get("artifactCounts")
    expected_audit_events = int(counts.get("auditEvents", -1)) if isinstance(counts, dict) else -1
    if expected_audit_events != len(audit_events):
        raise RuntimeError("Invalid P0 export response: auditEvents count does not match manifest")
    if not any(isinstance(event, dict) and event.get("eventType") == "p0_paper_simulation" for event in audit_events):
        raise RuntimeError("Invalid P0 export response: p0_paper_simulation audit event is missing")
    if completeness.get("ready") is not True or completeness.get("status") != "complete":
        raise RuntimeError("Invalid P0 export response: P0 package completeness is not complete")
    if completeness.get("paperOnly") is not True:
        raise RuntimeError("Invalid P0 export response: P0 package is not paper-only")
    if completeness.get("liveTradingAllowed") is not False or completeness.get("liveBlockedBoundary") is not True:
        raise RuntimeError("Invalid P0 export response: live-blocked boundary is not enforced")
    passed = int(completeness.get("passed", 0))
    total = int(completeness.get("total", 0))
    return f"p0 export run={run_id} completeness={passed}/{total} auditEvents={len(audit_events)} liveBlocked=True"


def validate_p0_import_payload(payload: Any, run_id: str) -> str:
    response = _require_dict(payload, "P0 import")
    run = response.get("run")
    if not isinstance(run, dict):
        raise RuntimeError("Invalid P0 import response: run is missing")
    if str(run.get("runId") or "").strip() != run_id:
        raise RuntimeError("Invalid P0 import response: imported runId does not match")
    if str(run.get("executionMode") or "").strip() != "paper_only":
        raise RuntimeError("Invalid P0 import response: imported run is not paper-only")
    data_snapshot = run.get("dataSnapshot")
    bars = data_snapshot.get("bars") if isinstance(data_snapshot, dict) else None
    if not isinstance(bars, list) or not bars:
        raise RuntimeError("Invalid P0 import response: imported data snapshot is missing bars")
    if run.get("liveTradingAllowed") is True:
        raise RuntimeError("Invalid P0 import response: liveTradingAllowed is true")
    undo_token = str(response.get("undoToken") or "").strip()
    undo = response.get("undo")
    if not undo_token or not isinstance(undo, dict):
        raise RuntimeError("Invalid P0 import response: undo evidence is missing")
    return f"p0 import run={run_id} undo={undo_token}"


def _p0_acceptance_check_id(summary: str) -> str:
    if summary.startswith("p0 imported-export"):
        return "imported-export"
    if summary.startswith("p0 paper-simulation"):
        return "paper-simulation"
    if summary.startswith("p0 ai-review"):
        return "ai-review"
    if summary.startswith("p0 pipeline"):
        return "pipeline"
    if summary.startswith("p0 export"):
        return "export"
    if summary.startswith("p0 import"):
        return "import"
    return "unknown"


def build_p0_acceptance_manifest(
    *,
    base_url: str,
    import_base_url: str | None,
    market: str,
    symbol: str,
    timeframe: str,
    run_id: str,
    summaries: Sequence[str],
) -> dict[str, Any]:
    checks = [
        {
            "id": _p0_acceptance_check_id(summary),
            "status": "passed",
            "summary": summary,
        }
        for summary in summaries
    ]
    return {
        "kind": "aiqt.p0AcceptanceManifest",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "passed" if checks and all(check["status"] == "passed" for check in checks) else "blocked",
        "baseUrl": base_url,
        "importBaseUrl": import_base_url or base_url,
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "runId": run_id,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "checkCount": len(checks),
        "checks": checks,
    }


def write_p0_acceptance_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"p0 acceptance report={path}")
    return path


def validate_p0_acceptance_manifest(manifest: Any) -> str:
    payload = _require_dict(manifest, "P0 acceptance manifest")
    if payload.get("kind") != "aiqt.p0AcceptanceManifest" or payload.get("schemaVersion") != 1:
        raise RuntimeError("Invalid P0 acceptance manifest: kind or schemaVersion is invalid")
    if payload.get("status") != "passed":
        raise RuntimeError("Invalid P0 acceptance manifest: status is not passed")
    run_id = str(payload.get("runId") or "").strip()
    if not run_id:
        raise RuntimeError("Invalid P0 acceptance manifest: runId is missing")
    if payload.get("paperOnly") is not True:
        raise RuntimeError("Invalid P0 acceptance manifest: paperOnly is not true")
    if payload.get("liveTradingAllowed") is not False or payload.get("liveBlockedBoundary") is not True:
        raise RuntimeError("Invalid P0 acceptance manifest: live-blocked boundary is not enforced")
    checks = payload.get("checks")
    if not isinstance(checks, list) or not checks:
        raise RuntimeError("Invalid P0 acceptance manifest: checks are missing")
    check_ids = []
    for check in checks:
        if not isinstance(check, dict):
            raise RuntimeError("Invalid P0 acceptance manifest: check is not an object")
        check_id = str(check.get("id") or "").strip()
        if not check_id or check.get("status") != "passed":
            raise RuntimeError("Invalid P0 acceptance manifest: check is not passed")
        check_ids.append(check_id)
    required = {"pipeline", "ai-review", "paper-simulation", "export"}
    missing = sorted(required.difference(check_ids))
    if missing:
        raise RuntimeError(f"Invalid P0 acceptance manifest: missing required checks {', '.join(missing)}")
    if "imported-export" in check_ids and "import" not in check_ids:
        raise RuntimeError("Invalid P0 acceptance manifest: imported-export check requires import check")
    check_count = int(payload.get("checkCount", len(checks)))
    if check_count != len(checks):
        raise RuntimeError("Invalid P0 acceptance manifest: checkCount does not match checks")
    return f"p0 acceptance manifest run={run_id} checks={len(checks)} liveBlocked=True"


def load_p0_acceptance_report(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeError(f"Invalid P0 acceptance manifest: report file not found {path}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid P0 acceptance manifest: report is not valid JSON {path}") from error
    return _require_dict(payload, "P0 acceptance manifest")


def _p1_acceptance_check_id(summary: str) -> str:
    if summary.startswith("p1 imported-export"):
        return "imported-export"
    if summary.startswith("p1 watchlist-refresh"):
        return "watchlist-refresh"
    if summary.startswith("p1 queue-pipeline"):
        return "queue-pipeline"
    if summary.startswith("p1 paper-simulation"):
        return "paper-simulation"
    if summary.startswith("p1 ai-review"):
        return "ai-review"
    if summary.startswith("p1 workspace"):
        return "workspace"
    if summary.startswith("p1 export"):
        return "export"
    if summary.startswith("p1 import"):
        return "import"
    return "unknown"


def build_p1_acceptance_manifest(
    *,
    base_url: str,
    import_base_url: str | None,
    timeframe: str,
    run_id: str,
    watchlist_refresh_run_id: str,
    queued_market: str,
    queued_symbol: str,
    watchlist: Sequence[dict[str, Any]],
    summaries: Sequence[str],
) -> dict[str, Any]:
    checks = [
        {
            "id": _p1_acceptance_check_id(summary),
            "status": "passed",
            "summary": summary,
        }
        for summary in summaries
    ]
    normalized_watchlist = [
        {
            "market": str(item.get("market") or "").strip(),
            "symbol": str(item.get("symbol") or "").strip(),
            "name": str(item.get("name") or "").strip(),
        }
        for item in watchlist
    ]
    return {
        "kind": "aiqt.p1AcceptanceManifest",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "passed" if checks and all(check["status"] == "passed" for check in checks) else "blocked",
        "baseUrl": base_url,
        "importBaseUrl": import_base_url or base_url,
        "timeframe": timeframe,
        "runId": run_id,
        "watchlistRefreshRunId": watchlist_refresh_run_id,
        "queuedMarket": queued_market,
        "queuedSymbol": queued_symbol,
        "watchlistCount": len(normalized_watchlist),
        "watchlist": normalized_watchlist,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "liveBlockedBoundary": True,
        "checkCount": len(checks),
        "checks": checks,
    }


def validate_p1_acceptance_manifest(manifest: Any) -> str:
    payload = _require_dict(manifest, "P1 acceptance manifest")
    if payload.get("kind") != "aiqt.p1AcceptanceManifest" or payload.get("schemaVersion") != 1:
        raise RuntimeError("Invalid P1 acceptance manifest: kind or schemaVersion is invalid")
    if payload.get("status") != "passed":
        raise RuntimeError("Invalid P1 acceptance manifest: status is not passed")
    run_id = str(payload.get("runId") or "").strip()
    if not run_id:
        raise RuntimeError("Invalid P1 acceptance manifest: runId is missing")
    if not str(payload.get("watchlistRefreshRunId") or "").strip():
        raise RuntimeError("Invalid P1 acceptance manifest: watchlistRefreshRunId is missing")
    if not str(payload.get("queuedSymbol") or "").strip() or not str(payload.get("queuedMarket") or "").strip():
        raise RuntimeError("Invalid P1 acceptance manifest: queued instrument is missing")
    watchlist_count = int(payload.get("watchlistCount", 0))
    if watchlist_count < 3:
        raise RuntimeError("Invalid P1 acceptance manifest: watchlistCount must be at least 3")
    if payload.get("paperOnly") is not True:
        raise RuntimeError("Invalid P1 acceptance manifest: paperOnly is not true")
    if payload.get("liveTradingAllowed") is not False or payload.get("liveBlockedBoundary") is not True:
        raise RuntimeError("Invalid P1 acceptance manifest: live-blocked boundary is not enforced")
    checks = payload.get("checks")
    if not isinstance(checks, list) or not checks:
        raise RuntimeError("Invalid P1 acceptance manifest: checks are missing")
    check_ids = []
    for check in checks:
        if not isinstance(check, dict):
            raise RuntimeError("Invalid P1 acceptance manifest: check is not an object")
        check_id = str(check.get("id") or "").strip()
        if not check_id or check.get("status") != "passed":
            raise RuntimeError("Invalid P1 acceptance manifest: check is not passed")
        if not str(check.get("summary") or "").strip():
            raise RuntimeError("Invalid P1 acceptance manifest: check summary is missing")
        check_ids.append(check_id)
    required = {
        "workspace",
        "watchlist-refresh",
        "queue-pipeline",
        "ai-review",
        "paper-simulation",
        "export",
        "import",
        "imported-export",
    }
    missing = sorted(required.difference(check_ids))
    if missing:
        raise RuntimeError(f"Invalid P1 acceptance manifest: missing required checks {', '.join(missing)}")
    check_count = int(payload.get("checkCount", len(checks)))
    if check_count != len(checks):
        raise RuntimeError("Invalid P1 acceptance manifest: checkCount does not match checks")
    return f"p1 acceptance manifest run={run_id} watchlist={watchlist_count} checks={len(checks)} liveBlocked=True"


def write_p1_acceptance_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"p1 acceptance report={path}")
    return path


def load_p1_acceptance_report(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeError(f"Invalid P1 acceptance manifest: report file not found {path}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid P1 acceptance manifest: report is not valid JSON {path}") from error
    return _require_dict(payload, "P1 acceptance manifest")


def request_json(url: str, timeout_seconds: int) -> Any:
    with urlopen(url, timeout=timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def post_json(url: str, payload: dict[str, Any], timeout_seconds: int) -> Any:
    body = json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Content-Length": str(len(body)),
        },
    )
    with urlopen(request, timeout=timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def request_text(url: str, timeout_seconds: int) -> str:
    with urlopen(url, timeout=timeout_seconds) as response:
        return response.read().decode("utf-8", errors="replace")


def wait_for_json(url: str, timeout_seconds: int) -> Any:
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            return request_json(url, timeout_seconds=5)
        except (OSError, URLError, json.JSONDecodeError) as error:
            last_error = error
            time.sleep(1)
    raise RuntimeError(f"Timed out waiting for JSON from {url}: {last_error}")


def wait_for_text(url: str, timeout_seconds: int) -> str:
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            return request_text(url, timeout_seconds=5)
        except (OSError, URLError) as error:
            last_error = error
            time.sleep(1)
    raise RuntimeError(f"Timed out waiting for text from {url}: {last_error}")


def join_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def run_command(args: Sequence[str], cwd: Path, check: bool = True) -> subprocess.CompletedProcess[str]:
    print(f"$ {' '.join(args)}")
    result = subprocess.run(
        args,
        cwd=cwd,
        check=False,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if check and result.returncode:
        if result.stdout:
            print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
        raise subprocess.CalledProcessError(result.returncode, args, output=result.stdout)
    return result


def run_p0_acceptance(
    base_url: str,
    *,
    timeout_seconds: int,
    market: str,
    symbol: str,
    timeframe: str,
    quantity: int,
    import_check: bool = False,
    import_base_url: str | None = None,
    report_path: Path | None = None,
) -> list[str]:
    summaries: list[str] = []

    pipeline_payload = post_json(
        join_url(base_url, "/api/p0/pipeline"),
        build_p0_pipeline_payload(market, symbol, timeframe),
        timeout_seconds=timeout_seconds,
    )
    run_id, pipeline_summary = validate_p0_pipeline_payload(pipeline_payload)
    summaries.append(pipeline_summary)

    ai_review_payload = post_json(
        join_url(base_url, "/api/p0/ai-reviews"),
        build_p0_ai_review_payload(run_id, market, symbol, timeframe),
        timeout_seconds=timeout_seconds,
    )
    summaries.append(validate_p0_ai_review_payload(ai_review_payload, run_id))

    paper_payload = post_json(
        join_url(base_url, "/api/p0/paper-simulations"),
        build_p0_paper_simulation_payload(run_id, market, symbol, timeframe, quantity=quantity),
        timeout_seconds=timeout_seconds,
    )
    summaries.append(validate_p0_paper_simulation_payload(paper_payload, run_id))

    export_payload = request_json(join_url(base_url, f"/api/research/runs/{run_id}/export"), timeout_seconds)
    summaries.append(validate_p0_export_payload(export_payload, run_id))
    if import_check:
        summaries.extend(
            run_p0_import_acceptance(
                import_base_url or base_url,
                export_package=_p0_export_package_from_payload(export_payload),
                run_id=run_id,
                timeout_seconds=timeout_seconds,
            )
        )
    for summary in summaries:
        print(summary)
    if report_path is not None:
        write_p0_acceptance_report(
            report_path,
            build_p0_acceptance_manifest(
                base_url=base_url,
                import_base_url=import_base_url,
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                run_id=run_id,
                summaries=summaries,
            ),
        )
    return summaries


def run_p0_import_acceptance(
    import_base_url: str,
    *,
    export_package: dict[str, Any],
    run_id: str,
    timeout_seconds: int,
) -> list[str]:
    import_payload = post_json(
        join_url(import_base_url, "/api/research/runs/import"),
        export_package,
        timeout_seconds=timeout_seconds,
    )
    import_summary = validate_p0_import_payload(import_payload, run_id)
    imported_export_payload = request_json(
        join_url(import_base_url, f"/api/research/runs/{run_id}/export"),
        timeout_seconds,
    )
    imported_export_summary = validate_p0_export_payload(imported_export_payload, run_id).replace(
        "p0 export",
        "p0 imported-export",
        1,
    )
    return [import_summary, imported_export_summary]


def p1_watchlist_from_workspace_payload(payload: Any, *, min_symbols: int = 3) -> tuple[list[dict[str, Any]], str, str]:
    workspace = _require_dict(payload, "P1 workspace")
    if workspace.get("schemaVersion") != 1:
        raise RuntimeError("Invalid P1 workspace response: schemaVersion is not 1")
    selected = workspace.get("selectedInstrument")
    watchlist = workspace.get("watchlist")
    if not isinstance(selected, dict) or not isinstance(watchlist, list):
        raise RuntimeError("Invalid P1 workspace response: selected instrument or watchlist is missing")
    selected_symbol = str(selected.get("symbol") or "").strip()
    if not selected_symbol:
        raise RuntimeError("Invalid P1 workspace response: selected symbol is missing")
    normalized: list[dict[str, Any]] = []
    for item in watchlist:
        if not isinstance(item, dict):
            raise RuntimeError("Invalid P1 workspace response: watchlist item is not an object")
        market = str(item.get("market") or "").strip()
        symbol = str(item.get("symbol") or "").strip()
        if not market or not symbol:
            raise RuntimeError("Invalid P1 workspace response: watchlist item market or symbol is missing")
        normalized.append(
            {
                "market": market,
                "symbol": symbol,
                "name": str(item.get("name") or "").strip(),
            }
        )
    if len(normalized) < min_symbols:
        raise RuntimeError(f"Invalid P1 workspace response: watchlist must contain at least {min_symbols} symbols")
    return normalized, selected_symbol, f"p1 workspace watchlist={len(normalized)} selected={selected_symbol}"


def build_p1_watchlist_refresh_payload(
    watchlist: Sequence[dict[str, Any]],
    *,
    timeframe: str,
    limit: int,
) -> dict[str, Any]:
    return {
        "timeframe": timeframe,
        "limit": max(1, int(limit)),
        "overrideAuditEventId": "p1-watchlist-refresh-smoke",
        "watchlist": [
            {
                "market": str(item.get("market") or "").strip(),
                "symbol": str(item.get("symbol") or "").strip(),
                "name": str(item.get("name") or "").strip(),
            }
            for item in watchlist
        ],
    }


def validate_p1_watchlist_refresh_payload(
    payload: Any,
    *,
    timeframe: str,
    min_symbols: int = 3,
) -> tuple[str, str, str, str]:
    response = _require_dict(payload, "P1 watchlist refresh")
    refresh = _require_dict(response.get("watchlistRefresh"), "P1 watchlist refresh")
    run_id = str(refresh.get("runId") or "").strip()
    if not run_id:
        raise RuntimeError("Invalid P1 watchlist refresh response: runId is missing")
    summary = refresh.get("summary")
    if not isinstance(summary, dict):
        raise RuntimeError("Invalid P1 watchlist refresh response: summary is missing")
    total_symbols = int(summary.get("totalSymbols", 0))
    refreshed = int(summary.get("refreshed", 0))
    if total_symbols < min_symbols:
        raise RuntimeError("Invalid P1 watchlist refresh response: totalSymbols is below P1 minimum")
    if refreshed < 1:
        raise RuntimeError("Invalid P1 watchlist refresh response: no refreshed symbols are available")
    items = refresh.get("items")
    if not isinstance(items, list) or len(items) < min_symbols:
        raise RuntimeError("Invalid P1 watchlist refresh response: per-symbol evidence is incomplete")
    queued_market = ""
    queued_symbol = ""
    for item in items:
        if not isinstance(item, dict):
            raise RuntimeError("Invalid P1 watchlist refresh response: item is not an object")
        item_timeframe = str(item.get("timeframe") or timeframe).strip()
        if item.get("status") == "refreshed" and item_timeframe == timeframe:
            queued_market = str(item.get("market") or "").strip()
            queued_symbol = str(item.get("symbol") or "").strip()
            if queued_market and queued_symbol:
                break
    if not queued_market or not queued_symbol:
        raise RuntimeError("Invalid P1 watchlist refresh response: no queue-ready refreshed symbol found")
    return (
        run_id,
        queued_market,
        queued_symbol,
        f"p1 watchlist-refresh run={run_id} symbols={total_symbols} refreshed={refreshed} queued={queued_symbol}",
    )


def validate_p1_export_payload(
    payload: Any,
    run_id: str,
    watchlist_refresh_run_id: str,
    *,
    imported: bool = False,
) -> str:
    validate_p0_export_payload(payload, run_id)
    export_package = _p0_export_package_from_payload(payload)
    research_run = export_package.get("researchRun")
    if not isinstance(research_run, dict):
        raise RuntimeError("Invalid P1 export response: researchRun is missing")
    data_snapshot = research_run.get("dataSnapshot")
    preparation = data_snapshot.get("preparationEvidence") if isinstance(data_snapshot, dict) else None
    if not isinstance(preparation, dict):
        raise RuntimeError("Invalid P1 export response: watchlist preparation evidence is missing")
    if preparation.get("kind") != "watchlist_cache_refresh":
        raise RuntimeError("Invalid P1 export response: preparation evidence is not watchlist cache refresh")
    if str(preparation.get("runId") or "").strip() != watchlist_refresh_run_id:
        raise RuntimeError("Invalid P1 export response: watchlist refresh run id does not match")
    if str(preparation.get("status") or "").strip() != "refreshed":
        raise RuntimeError("Invalid P1 export response: watchlist preparation evidence is not refreshed")
    label = "imported-export" if imported else "export"
    return f"p1 {label} run={run_id} refresh={watchlist_refresh_run_id} liveBlocked=True"


def run_p1_import_acceptance(
    import_base_url: str,
    *,
    export_package: dict[str, Any],
    run_id: str,
    watchlist_refresh_run_id: str,
    timeout_seconds: int,
) -> list[str]:
    import_payload = post_json(
        join_url(import_base_url, "/api/research/runs/import"),
        export_package,
        timeout_seconds=timeout_seconds,
    )
    import_summary = validate_p0_import_payload(import_payload, run_id).replace("p0 import", "p1 import", 1)
    imported_export_payload = request_json(
        join_url(import_base_url, f"/api/research/runs/{run_id}/export"),
        timeout_seconds,
    )
    imported_export_summary = validate_p1_export_payload(
        imported_export_payload,
        run_id,
        watchlist_refresh_run_id,
        imported=True,
    )
    return [import_summary, imported_export_summary]


def run_p1_acceptance(
    base_url: str,
    *,
    timeout_seconds: int,
    timeframe: str,
    limit: int,
    quantity: int,
    import_base_url: str | None = None,
    report_path: Path | None = None,
) -> list[str]:
    summaries: list[str] = []
    workspace_payload = request_json(join_url(base_url, "/api/workspace"), timeout_seconds)
    watchlist, _selected_symbol, workspace_summary = p1_watchlist_from_workspace_payload(workspace_payload)
    summaries.append(workspace_summary)

    refresh_payload = post_json(
        join_url(base_url, "/api/cache/watchlist-refreshes"),
        build_p1_watchlist_refresh_payload(watchlist, timeframe=timeframe, limit=limit),
        timeout_seconds=timeout_seconds,
    )
    watchlist_refresh_run_id, queued_market, queued_symbol, refresh_summary = validate_p1_watchlist_refresh_payload(
        refresh_payload,
        timeframe=timeframe,
    )
    summaries.append(refresh_summary)

    pipeline_payload = post_json(
        join_url(base_url, "/api/p0/pipeline"),
        build_p0_pipeline_payload(
            queued_market,
            queued_symbol,
            timeframe,
            watchlist_refresh_run_id=watchlist_refresh_run_id,
        ),
        timeout_seconds=timeout_seconds,
    )
    run_id, _pipeline_summary = validate_p0_pipeline_payload(pipeline_payload)
    summaries.append(
        f"p1 queue-pipeline run={run_id} symbol={queued_symbol} refresh={watchlist_refresh_run_id}"
    )

    ai_review_payload = post_json(
        join_url(base_url, "/api/p0/ai-reviews"),
        build_p0_ai_review_payload(run_id, queued_market, queued_symbol, timeframe),
        timeout_seconds=timeout_seconds,
    )
    summaries.append(validate_p0_ai_review_payload(ai_review_payload, run_id).replace("p0 ai-review", "p1 ai-review", 1))

    paper_payload = post_json(
        join_url(base_url, "/api/p0/paper-simulations"),
        build_p0_paper_simulation_payload(run_id, queued_market, queued_symbol, timeframe, quantity=quantity),
        timeout_seconds=timeout_seconds,
    )
    summaries.append(
        validate_p0_paper_simulation_payload(paper_payload, run_id).replace(
            "p0 paper-simulation",
            "p1 paper-simulation",
            1,
        )
    )

    export_payload = request_json(join_url(base_url, f"/api/research/runs/{run_id}/export"), timeout_seconds)
    summaries.append(validate_p1_export_payload(export_payload, run_id, watchlist_refresh_run_id))
    summaries.extend(
        run_p1_import_acceptance(
            import_base_url or base_url,
            export_package=_p0_export_package_from_payload(export_payload),
            run_id=run_id,
            watchlist_refresh_run_id=watchlist_refresh_run_id,
            timeout_seconds=timeout_seconds,
        )
    )
    for summary in summaries:
        print(summary)
    if report_path is not None:
        write_p1_acceptance_report(
            report_path,
            build_p1_acceptance_manifest(
                base_url=base_url,
                import_base_url=import_base_url,
                timeframe=timeframe,
                run_id=run_id,
                watchlist_refresh_run_id=watchlist_refresh_run_id,
                queued_market=queued_market,
                queued_symbol=queued_symbol,
                watchlist=watchlist,
                summaries=summaries,
            ),
        )
    return summaries


def run_smoke(
    repo_root: Path,
    base_url: str,
    timeout_seconds: int,
    build: bool,
    down: bool,
    *,
    p0_acceptance: bool = False,
    p0_market: str = "ashare",
    p0_symbol: str = "600000",
    p0_timeframe: str = "1d",
    p0_quantity: int = 2100,
    p0_import_check: bool = False,
    p0_import_base_url: str | None = None,
    p0_acceptance_report: Path | None = None,
    p1_acceptance: bool = False,
    p1_timeframe: str = "1d",
    p1_limit: int = 240,
    p1_quantity: int = 2100,
    p1_import_base_url: str | None = None,
    p1_acceptance_report: Path | None = None,
) -> None:
    try:
        run_command(["docker", "compose", "config"], cwd=repo_root)
        run_command(compose_up_args(build=build), cwd=repo_root)

        health_payload = wait_for_json(join_url(base_url, "/health"), timeout_seconds)
        print(validate_health_payload(health_payload))

        index_html = wait_for_text(base_url, timeout_seconds)
        if "AI Quantification Tools" not in index_html:
            raise RuntimeError("Invalid web response: missing AI Quantification Tools title")
        print(f"web status=ok url={base_url}")

        workspace_payload = wait_for_json(join_url(base_url, "/api/workspace"), timeout_seconds)
        print(validate_workspace_payload(workspace_payload))
        if p0_acceptance:
            run_p0_acceptance(
                base_url,
                timeout_seconds=timeout_seconds,
                market=p0_market,
                symbol=p0_symbol,
                timeframe=p0_timeframe,
                quantity=p0_quantity,
                import_check=p0_import_check,
                import_base_url=p0_import_base_url,
                report_path=p0_acceptance_report,
            )
        if p1_acceptance:
            run_p1_acceptance(
                base_url,
                timeout_seconds=timeout_seconds,
                timeframe=p1_timeframe,
                limit=p1_limit,
                quantity=p1_quantity,
                import_base_url=p1_import_base_url,
                report_path=p1_acceptance_report,
            )
    finally:
        if down:
            run_command(["docker", "compose", "down"], cwd=repo_root, check=False)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a Docker Compose smoke test for AIQuantificationTools.")
    parser.add_argument("--base-url", default="http://127.0.0.1:5173", help="Web service URL to verify.")
    parser.add_argument("--timeout", type=int, default=90, help="Seconds to wait for services to become reachable.")
    parser.add_argument("--no-build", action="store_true", help="Start Compose without rebuilding images.")
    parser.add_argument("--down", action="store_true", help="Run docker compose down after the smoke test.")
    parser.add_argument("--p0-acceptance", action="store_true", help="Run the P0 pipeline, AI review, paper simulation, and export acceptance smoke.")
    parser.add_argument("--p0-market", default="ashare", help="P0 acceptance market.")
    parser.add_argument("--p0-symbol", default="600000", help="P0 acceptance symbol.")
    parser.add_argument("--p0-timeframe", default="1d", help="P0 acceptance timeframe.")
    parser.add_argument("--p0-quantity", type=int, default=2100, help="P0 paper simulation quantity.")
    parser.add_argument("--p0-import-check", action="store_true", help="Import the exported P0 package and revalidate the imported export.")
    parser.add_argument("--p0-import-base-url", default=None, help="Optional clean service URL used as the P0 import target.")
    parser.add_argument("--p0-acceptance-report", default=None, help="Optional path for a JSON P0 acceptance manifest.")
    parser.add_argument("--validate-p0-acceptance-report", default=None, help="Validate an existing P0 acceptance manifest and exit.")
    parser.add_argument("--p1-acceptance", action="store_true", help="Run the P1 watchlist research-ops acceptance smoke.")
    parser.add_argument("--p1-timeframe", default="1d", help="P1 acceptance timeframe.")
    parser.add_argument("--p1-limit", type=int, default=240, help="P1 watchlist refresh data limit.")
    parser.add_argument("--p1-quantity", type=int, default=2100, help="P1 paper simulation quantity.")
    parser.add_argument("--p1-import-base-url", default=None, help="Optional clean service URL used as the P1 import target.")
    parser.add_argument("--p1-acceptance-report", default=None, help="Optional path for a JSON P1 acceptance manifest.")
    parser.add_argument("--validate-p1-acceptance-report", default=None, help="Validate an existing P1 acceptance manifest and exit.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    if args.validate_p0_acceptance_report:
        manifest = load_p0_acceptance_report(Path(args.validate_p0_acceptance_report))
        print(validate_p0_acceptance_manifest(manifest))
        return 0
    if args.validate_p1_acceptance_report:
        manifest = load_p1_acceptance_report(Path(args.validate_p1_acceptance_report))
        print(validate_p1_acceptance_manifest(manifest))
        return 0
    repo_root = Path(__file__).resolve().parents[1]
    run_smoke(
        repo_root=repo_root,
        base_url=args.base_url,
        timeout_seconds=max(1, args.timeout),
        build=not args.no_build,
        down=args.down,
        p0_acceptance=args.p0_acceptance,
        p0_market=args.p0_market,
        p0_symbol=args.p0_symbol,
        p0_timeframe=args.p0_timeframe,
        p0_quantity=max(1, args.p0_quantity),
        p0_import_check=args.p0_import_check,
        p0_import_base_url=args.p0_import_base_url,
        p0_acceptance_report=Path(args.p0_acceptance_report) if args.p0_acceptance_report else None,
        p1_acceptance=args.p1_acceptance,
        p1_timeframe=args.p1_timeframe,
        p1_limit=max(1, args.p1_limit),
        p1_quantity=max(1, args.p1_quantity),
        p1_import_base_url=args.p1_import_base_url,
        p1_acceptance_report=Path(args.p1_acceptance_report) if args.p1_acceptance_report else None,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
