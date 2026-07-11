from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


def ensure_quant_core_import_path() -> None:
    quant_core_root = Path(__file__).resolve().parents[1] / "services" / "quant_core"
    if quant_core_root.exists() and str(quant_core_root) not in sys.path:
        sys.path.insert(0, str(quant_core_root))


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


def _smoke_token(value: str) -> str:
    token = "".join(ch.lower() if ch.isalnum() else "-" for ch in str(value or "").strip())
    token = "-".join(part for part in token.split("-") if part)
    return token or "unknown"


def _p2_replay_seed_order_id(run_id: str, symbol: str) -> str:
    return f"portfolio-paper-{_smoke_token(run_id)}-{_smoke_token(symbol)}-buy"


def build_p2_replay_portfolio_order_payload(
    run_id: str,
    market: str,
    symbol: str,
    *,
    quantity: int,
) -> dict[str, Any]:
    quantity_value = float(max(1, int(quantity)))
    fill_price = 9.2
    return {
        "baseRunId": run_id,
        "portfolioName": "P2 paper replay smoke basket",
        "source": "p2_replay_acceptance",
        "orders": [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "eventType": "portfolio_paper_order",
                "orderId": _p2_replay_seed_order_id(run_id, symbol),
                "symbol": symbol,
                "sourceRunId": run_id,
                "side": "buy",
                "notionalValue": round(quantity_value * fill_price, 2),
                "quantity": quantity_value,
                "status": "pending_review",
                "riskStatus": "passed",
                "reason": f"{market} {symbol} P2 replay smoke seed; paper simulation only.",
            }
        ],
    }


def build_p2_replay_portfolio_approval_payload(run_id: str, batch_id: str, order_id: str) -> dict[str, Any]:
    return {
        "baseRunId": run_id,
        "batchId": batch_id,
        "orderId": order_id,
        "approved": True,
        "reviewer": "p1-smoke-operator",
        "reviewedAt": datetime.now(timezone.utc).isoformat(),
        "reason": "Approved for P2 paper replay smoke simulation only.",
    }


def build_p2_replay_portfolio_batch_simulation_payload(
    run_id: str,
    batch_id: str,
    order_id: str,
    market: str,
    symbol: str,
    *,
    quantity: int,
) -> dict[str, Any]:
    quantity_value = float(max(1, int(quantity)))
    fill_price = 9.2
    adapter_token = f"{_smoke_token(run_id)}-{_smoke_token(symbol)}"
    adapter_paper_execution_id = f"execution-adapter-paper-execution-{adapter_token}"
    adapter_manifest_validation_id = f"execution-adapter-secret-manifest-validation-{adapter_token}"
    return {
        "baseRunId": run_id,
        "batchId": batch_id,
        "orderIds": [order_id],
        "simulatedAt": datetime.now(timezone.utc).isoformat(),
        "routeRisk": {
            "initialCash": 100000,
            "minCashAfter": 1000,
            "maxSymbolNotional": 50000,
            "maxBatchNotional": 50000,
        },
        "adapterPaperExecutionEvidenceByOrderId": {
            order_id: {
                "adapterPaperExecutionId": adapter_paper_execution_id,
                "adapterManifestValidationId": adapter_manifest_validation_id,
                "adapterPaperExecutionEvidence": {
                    "adapterPaperExecutionId": adapter_paper_execution_id,
                    "manifestValidationId": adapter_manifest_validation_id,
                    "adapterId": f"{market}-live",
                    "market": market,
                    "symbol": symbol,
                    "route": "paper",
                    "status": "paper_execution_recorded",
                    "fillSummary": f"filled buy {int(quantity_value)} {symbol} @ {fill_price}",
                    "paperFillRecorded": True,
                    "paperOnly": True,
                    "orderSubmitted": False,
                    "liveTradingAllowed": False,
                    "liveOrderSubmitted": False,
                    "routeExecuted": False,
                },
            }
        },
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


def validate_p2_replay_portfolio_order_payload(payload: Any, run_id: str) -> tuple[str, str]:
    response = _require_dict(payload, "P2 replay portfolio order seed")
    batch = response.get("portfolioPaperOrderBatch") or response.get("existingBatch")
    if not isinstance(batch, dict):
        raise RuntimeError("Invalid P2 replay portfolio order seed response: batch is missing")
    if str(batch.get("baseRunId") or "").strip() != run_id:
        raise RuntimeError("Invalid P2 replay portfolio order seed response: baseRunId does not match")
    batch_id = str(batch.get("batchId") or "").strip()
    if not batch_id:
        raise RuntimeError("Invalid P2 replay portfolio order seed response: batchId is missing")
    orders = batch.get("orders")
    if not isinstance(orders, list) or len(orders) != 1 or not isinstance(orders[0], dict):
        raise RuntimeError("Invalid P2 replay portfolio order seed response: exactly one order is required")
    order_id = str(orders[0].get("orderId") or "").strip()
    if not order_id:
        raise RuntimeError("Invalid P2 replay portfolio order seed response: orderId is missing")
    if orders[0].get("status") != "pending_review" or orders[0].get("riskStatus") != "passed":
        raise RuntimeError("Invalid P2 replay portfolio order seed response: order is not review-ready")
    return batch_id, order_id


def validate_p2_replay_portfolio_approval_payload(payload: Any, order_id: str) -> None:
    response = _require_dict(payload, "P2 replay portfolio approval seed")
    approval = response.get("approval")
    if not isinstance(approval, dict) or approval.get("approved") is not True:
        raise RuntimeError("Invalid P2 replay portfolio approval seed response: approval is missing or not approved")
    if str(approval.get("orderId") or order_id).strip() != order_id:
        raise RuntimeError("Invalid P2 replay portfolio approval seed response: orderId does not match")
    lifecycle = response.get("portfolioPaperOrderLifecycle")
    if not isinstance(lifecycle, list) or not any(
        isinstance(row, dict)
        and str(row.get("orderId") or "").strip() == order_id
        and str(row.get("state") or "").strip() == "ready_for_simulation"
        and row.get("routable") is True
        for row in lifecycle
    ):
        raise RuntimeError("Invalid P2 replay portfolio approval seed response: order is not simulation-ready")


def validate_p2_replay_portfolio_batch_simulation_payload(payload: Any, order_id: str) -> int:
    response = _require_dict(payload, "P2 replay portfolio batch simulation seed")
    batch_simulation = response.get("batchSimulation")
    if not isinstance(batch_simulation, dict):
        raise RuntimeError("Invalid P2 replay portfolio batch simulation seed response: batchSimulation is missing")
    if batch_simulation.get("liveExecutionBlocked") is not True:
        raise RuntimeError("Invalid P2 replay portfolio batch simulation seed response: live execution is not blocked")
    simulations = response.get("simulations")
    created_simulations = response.get("createdSimulations")
    simulation_rows = [
        row
        for rows in (simulations, created_simulations)
        if isinstance(rows, list)
        for row in rows
        if isinstance(row, dict)
        and str(row.get("orderId") or "").strip() == order_id
        and str(row.get("orderState") or "").strip() == "filled"
        and str(row.get("fillStatus") or "").strip() == "filled"
    ]
    filled_count = int(batch_simulation.get("filledCount") or 0)
    if filled_count < 1 and simulation_rows:
        filled_count = len(simulation_rows)
    if filled_count < 1:
        raise RuntimeError("Invalid P2 replay portfolio batch simulation seed response: no filled simulation recorded")
    if not simulation_rows:
        raise RuntimeError("Invalid P2 replay portfolio batch simulation seed response: filled simulation row is missing")
    if not all(str(row.get("adapterPaperExecutionId") or "").strip() for row in simulation_rows):
        raise RuntimeError("Invalid P2 replay portfolio batch simulation seed response: adapter evidence is missing")
    return filled_count


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
    if summary.startswith("p1 p2-replay-seed"):
        return "p2-replay-seed"
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


def validate_p2_chain_p1_acceptance_manifest(manifest: Any) -> str:
    summary = validate_p1_acceptance_manifest(manifest)
    checks = manifest.get("checks") if isinstance(manifest, dict) else None
    check_ids = {
        str(check.get("id") or "").strip()
        for check in checks
        if isinstance(check, dict)
    } if isinstance(checks, list) else set()
    missing = sorted({"p2-replay-seed"}.difference(check_ids))
    if missing:
        raise RuntimeError(f"Invalid P2 chain P1 acceptance manifest: missing required checks {', '.join(missing)}")
    return summary.replace("p1 acceptance manifest", "p2 chain p1 acceptance manifest", 1)


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


def build_stage2_strategy_experiment_manifest(
    *,
    run_id: str,
    strategy_revision: str,
    snapshot_id: str,
    experiment_id: str,
    replay_experiment_id: str,
    definition_hash: str,
    result_hash: str,
    candidate_count: int,
    holdout_key: str,
) -> dict[str, Any]:
    return {
        "kind": "aiqt.stage2StrategyExperimentAcceptance",
        "schemaVersion": 1,
        "runId": run_id,
        "strategyRevision": strategy_revision,
        "snapshotId": snapshot_id,
        "experimentId": experiment_id,
        "replayExperimentId": replay_experiment_id,
        "definitionHash": definition_hash,
        "resultHash": result_hash,
        "candidateCount": candidate_count,
        "holdoutKey": holdout_key,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "orderSubmitted": False,
        "routeExecuted": False,
    }


def write_stage2_strategy_experiment_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"stage2 strategy experiment report={path}")
    return path


def load_stage2_strategy_experiment_report(path: Path) -> dict[str, Any]:
    return _load_json_report(path, "Stage 2 strategy experiment manifest")


def validate_stage2_strategy_experiment_manifest(manifest: Any) -> str:
    payload = _require_dict(manifest, "Stage 2 strategy experiment manifest")
    expected_keys = {
        "kind",
        "schemaVersion",
        "runId",
        "strategyRevision",
        "snapshotId",
        "experimentId",
        "replayExperimentId",
        "definitionHash",
        "resultHash",
        "candidateCount",
        "holdoutKey",
        "paperOnly",
        "liveTradingAllowed",
        "orderSubmitted",
        "routeExecuted",
    }
    if set(payload) != expected_keys:
        raise RuntimeError("Invalid Stage 2 strategy experiment manifest: fields are invalid")
    if (
        payload["kind"] != "aiqt.stage2StrategyExperimentAcceptance"
        or type(payload["schemaVersion"]) is not int
        or payload["schemaVersion"] != 1
    ):
        raise RuntimeError("Invalid Stage 2 strategy experiment manifest: kind or schemaVersion is invalid")
    required_strings = (
        "runId",
        "strategyRevision",
        "snapshotId",
        "experimentId",
        "replayExperimentId",
        "definitionHash",
        "resultHash",
        "holdoutKey",
    )
    values = {
        field: payload[field].strip()
        for field in required_strings
        if isinstance(payload[field], str) and payload[field].strip()
    }
    missing = [field for field in required_strings if field not in values]
    if missing:
        raise RuntimeError(
            f"Invalid Stage 2 strategy experiment manifest: missing required fields {', '.join(missing)}"
        )
    if values["experimentId"] == values["replayExperimentId"]:
        raise RuntimeError("Invalid Stage 2 strategy experiment manifest: replay experiment id is not distinct")
    candidate_count = payload.get("candidateCount")
    if type(candidate_count) is not int or candidate_count < 2:
        raise RuntimeError("Invalid Stage 2 strategy experiment manifest: candidateCount must be at least 2")
    if payload.get("paperOnly") is not True:
        raise RuntimeError("Invalid Stage 2 strategy experiment manifest: paperOnly is not true")
    if any(payload.get(field) is not False for field in ("liveTradingAllowed", "orderSubmitted", "routeExecuted")):
        raise RuntimeError("Invalid Stage 2 strategy experiment manifest: live or order route is not blocked")
    return (
        f"stage2 strategy experiment run={values['runId']} candidates={candidate_count} "
        "replayExact=True liveBlocked=True"
    )


_STAGE3_MANIFEST_FIELDS = {
    "kind",
    "schemaVersion",
    "generatedAt",
    "status",
    "sourceRunId",
    "primaryExperimentId",
    "comparisonExperimentIds",
    "strategyLineageKey",
    "evidenceHash",
    "reviewRecordHash",
    "deterministicStance",
    "deterministicConsistency",
    "externalProvider",
    "externalStatus",
    "requestCount",
    "decisions",
    "artifactCounts",
    "exportPackageHash",
    "importedPackageHash",
    "readbackHash",
    "paperOnly",
    "liveTradingAllowed",
    "orderSubmissionAllowed",
    "orderSubmitted",
    "liveOrderSubmitted",
    "routeExecuted",
}
_STAGE3_DECISION_FIELDS = {
    "decisionId",
    "status",
    "supersedesDecisionId",
    "recordHash",
}


def build_stage3_ai_review_manifest(
    *,
    source_run_id: str,
    primary_experiment_id: str,
    comparison_experiment_ids: list[str],
    strategy_lineage_key: str,
    evidence_hash: str,
    review_record_hash: str,
    deterministic_stance: str,
    deterministic_consistency: str,
    external_provider: str,
    external_status: str,
    request_count: int,
    decisions: list[dict[str, Any]],
    export_package_hash: str,
    imported_package_hash: str,
    readback_hash: str,
    artifact_counts: dict[str, int],
) -> dict[str, Any]:
    return {
        "kind": "aiqt.stage3AiReviewAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "passed",
        "sourceRunId": source_run_id,
        "primaryExperimentId": primary_experiment_id,
        "comparisonExperimentIds": list(comparison_experiment_ids),
        "strategyLineageKey": strategy_lineage_key,
        "evidenceHash": evidence_hash,
        "reviewRecordHash": review_record_hash,
        "deterministicStance": deterministic_stance,
        "deterministicConsistency": deterministic_consistency,
        "externalProvider": external_provider,
        "externalStatus": external_status,
        "requestCount": request_count,
        "decisions": json.loads(json.dumps(decisions)),
        "artifactCounts": dict(artifact_counts),
        "exportPackageHash": export_package_hash,
        "importedPackageHash": imported_package_hash,
        "readbackHash": readback_hash,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "orderSubmissionAllowed": False,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
    }


def write_stage3_ai_review_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"stage3 ai-review report={path}")
    return path


def load_stage3_ai_review_report(path: Path) -> dict[str, Any]:
    return _load_json_report(path, "Stage 3 AI review acceptance manifest")


def _stage3_hash(value: Any, field: str) -> str:
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(character not in "0123456789abcdef" for character in value)
    ):
        raise RuntimeError(f"Invalid Stage 3 AI review manifest: {field} is not a SHA-256 hash")
    return value


def _stage3_text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip() or value != value.strip():
        raise RuntimeError(f"Invalid Stage 3 AI review manifest: {field} is invalid")
    return value


def validate_stage3_ai_review_manifest(manifest: Any) -> str:
    payload = _require_dict(manifest, "Stage 3 AI review acceptance manifest")
    if set(payload) != _STAGE3_MANIFEST_FIELDS:
        raise RuntimeError("Invalid Stage 3 AI review manifest: fields are invalid")
    if (
        payload["kind"] != "aiqt.stage3AiReviewAcceptance"
        or type(payload["schemaVersion"]) is not int
        or payload["schemaVersion"] != 1
        or payload["status"] != "passed"
    ):
        raise RuntimeError("Invalid Stage 3 AI review manifest: identity is invalid")
    generated_at = _stage3_text(payload["generatedAt"], "generatedAt")
    try:
        parsed_generated_at = datetime.fromisoformat(generated_at)
    except ValueError:
        raise RuntimeError("Invalid Stage 3 AI review manifest: generatedAt is invalid") from None
    if parsed_generated_at.tzinfo != timezone.utc or parsed_generated_at.isoformat() != generated_at:
        raise RuntimeError("Invalid Stage 3 AI review manifest: generatedAt is not canonical UTC")

    source_run_id = _stage3_text(payload["sourceRunId"], "sourceRunId")
    primary_experiment_id = _stage3_text(
        payload["primaryExperimentId"], "primaryExperimentId"
    )
    comparisons = payload["comparisonExperimentIds"]
    if (
        not isinstance(comparisons, list)
        or len(comparisons) > 4
        or any(not isinstance(item, str) or not item.strip() or item != item.strip() for item in comparisons)
        or len(set(comparisons)) != len(comparisons)
        or primary_experiment_id in comparisons
    ):
        raise RuntimeError("Invalid Stage 3 AI review manifest: comparison experiment ids are invalid")
    for field in (
        "strategyLineageKey",
        "evidenceHash",
        "reviewRecordHash",
        "exportPackageHash",
        "importedPackageHash",
        "readbackHash",
    ):
        _stage3_hash(payload[field], field)
    if payload["deterministicStance"] not in {
        "supported",
        "caution",
        "blocked",
        "insufficient_evidence",
    } or payload["deterministicConsistency"] not in {
        "consistent",
        "mixed",
        "divergent",
        "insufficient",
    }:
        raise RuntimeError("Invalid Stage 3 AI review manifest: deterministic assessment is invalid")

    provider = payload["externalProvider"]
    external_status = payload["externalStatus"]
    request_count = payload["requestCount"]
    if type(request_count) is not int or not 0 <= request_count <= 1:
        raise RuntimeError("Invalid Stage 3 AI review manifest: requestCount is invalid")
    if provider == "local":
        if external_status != "skipped" or request_count != 0:
            raise RuntimeError("Invalid Stage 3 AI review manifest: local Provider evidence is invalid")
    elif provider == "openai-compatible":
        if external_status not in {"completed", "failed"} or request_count != 1:
            raise RuntimeError("Invalid Stage 3 AI review manifest: live Provider evidence is invalid")
    else:
        raise RuntimeError("Invalid Stage 3 AI review manifest: externalProvider is invalid")

    decisions = payload["decisions"]
    if not isinstance(decisions, list) or len(decisions) != 2:
        raise RuntimeError("Invalid Stage 3 AI review manifest: Decision chain length is invalid")
    predecessor = None
    decision_ids: set[str] = set()
    for decision in decisions:
        if not isinstance(decision, dict) or set(decision) != _STAGE3_DECISION_FIELDS:
            raise RuntimeError("Invalid Stage 3 AI review manifest: Decision fields are invalid")
        decision_id = _stage3_text(decision["decisionId"], "decisionId")
        if (
            not decision_id.startswith("ai-review-decision-")
            or len(decision_id) != len("ai-review-decision-") + 32
            or any(character not in "0123456789abcdef" for character in decision_id.removeprefix("ai-review-decision-"))
            or decision_id in decision_ids
            or decision["status"] not in {
                "accepted_for_research",
                "revision_requested",
                "rejected",
                "insufficient_evidence",
            }
            or decision["supersedesDecisionId"] != predecessor
        ):
            raise RuntimeError("Invalid Stage 3 AI review manifest: Decision chain is invalid")
        _stage3_hash(decision["recordHash"], "Decision recordHash")
        decision_ids.add(decision_id)
        predecessor = decision_id
    if [decision["status"] for decision in decisions] != [
        "accepted_for_research",
        "revision_requested",
    ]:
        raise RuntimeError("Invalid Stage 3 AI review manifest: Decision status sequence is invalid")

    counts = payload["artifactCounts"]
    if (
        not isinstance(counts, dict)
        or set(counts) != {"aiReviewRunsV2", "aiReviewDecisions"}
        or type(counts["aiReviewRunsV2"]) is not int
        or counts["aiReviewRunsV2"] != 1
        or type(counts["aiReviewDecisions"]) is not int
        or counts["aiReviewDecisions"] != len(decisions)
    ):
        raise RuntimeError("Invalid Stage 3 AI review manifest: artifact counts are invalid")
    if payload["paperOnly"] is not True or any(
        payload[field] is not False
        for field in (
            "liveTradingAllowed",
            "orderSubmissionAllowed",
            "orderSubmitted",
            "liveOrderSubmitted",
            "routeExecuted",
        )
    ):
        raise RuntimeError("Invalid Stage 3 AI review manifest: live or order route is not blocked")
    return (
        f"stage3 ai-review run={source_run_id} provider={provider} requests={request_count} "
        f"decisions={len(decisions)} liveBlocked=True"
    )


_STAGE4_ACCEPTANCE_FIELDS = {
    "kind",
    "schemaVersion",
    "generatedAt",
    "status",
    "portfolioHash",
    "workflowHash",
    "workflow",
    "riskEvidence",
    "retryEvidence",
    "exportReadback",
    "paperOnly",
    "liveTradingAllowed",
    "orderSubmissionEnabled",
    "routeExecuted",
    "liveBlockedBoundary",
}
_STAGE4_SAFETY = {
    "paperOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}


def _stage4_acceptance_hash(value: Any) -> str:
    try:
        canonical = json.dumps(value, allow_nan=False, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    except (TypeError, ValueError) as error:
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: evidence is not canonical JSON") from error
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _stage4_risk_evidence(workflow: dict[str, Any]) -> dict[str, Any]:
    checks = workflow.get("portfolio", {}).get("preTradeRiskChecks", [])
    statuses = [check.get("status") for check in checks if isinstance(check, dict)]
    return {
        "totalCount": len(checks) if isinstance(checks, list) else 0,
        "passedCount": statuses.count("passed"),
        "reviewCount": statuses.count("review"),
        "blockedCount": statuses.count("blocked"),
        "rejectionReasons": sorted(
            str(check.get("reason") or "").strip()
            for check in checks
            if isinstance(check, dict) and check.get("status") == "blocked"
        ) if isinstance(checks, list) else [],
    }


def _stage4_utc(value: Any, field: str) -> str:
    try:
        parsed = datetime.fromisoformat(value) if isinstance(value, str) else None
    except ValueError:
        parsed = None
    if parsed is None or parsed.tzinfo != timezone.utc or parsed.isoformat() != value:
        raise RuntimeError(f"Invalid Stage 4 portfolio acceptance manifest: {field} is not canonical UTC")
    return value


def build_stage4_portfolio_acceptance_manifest(
    *,
    workflow: dict[str, Any],
    retry_evidence: dict[str, Any],
    export_readback: dict[str, Any],
) -> dict[str, Any]:
    return {
        "kind": "aiqt.stage4PortfolioPaperAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "passed",
        "portfolioHash": _stage4_acceptance_hash(workflow.get("portfolio")),
        "workflowHash": workflow.get("workflowHash"),
        "workflow": json.loads(json.dumps(workflow)),
        "riskEvidence": _stage4_risk_evidence(workflow),
        "retryEvidence": json.loads(json.dumps(retry_evidence)),
        "exportReadback": json.loads(json.dumps(export_readback)),
        **_STAGE4_SAFETY,
    }


def write_stage4_portfolio_acceptance_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"stage4 portfolio acceptance report={path}")
    return path


def load_stage4_portfolio_acceptance_report(path: Path) -> dict[str, Any]:
    return _load_json_report(path, "Stage 4 portfolio acceptance manifest")


def validate_stage4_portfolio_acceptance_manifest(manifest: Any) -> str:
    payload = _require_dict(manifest, "Stage 4 portfolio acceptance manifest")
    if set(payload) != _STAGE4_ACCEPTANCE_FIELDS:
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: fields are invalid")
    if (
        payload["kind"] != "aiqt.stage4PortfolioPaperAcceptance"
        or type(payload["schemaVersion"]) is not int
        or payload["schemaVersion"] != 1
        or payload["status"] != "passed"
    ):
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: identity is invalid")
    _stage4_utc(payload["generatedAt"], "generatedAt")
    if any(payload.get(field) is not expected for field, expected in _STAGE4_SAFETY.items()):
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: paper/live boundary is invalid")

    validator = _quant_core_validator("stage4_portfolio", "validate_stage4_portfolio_workflow_snapshot")
    try:
        workflow = validator(payload["workflow"])
    except (TypeError, ValueError) as error:
        raise RuntimeError(f"Invalid Stage 4 portfolio acceptance manifest: workflow is invalid: {error}") from error
    legs = workflow["portfolioRequest"].get("legs")
    if not isinstance(legs, list) or len(legs) != 2:
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: exactly two legs are required")
    if payload["workflowHash"] != workflow["workflowHash"]:
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: workflow hash does not match")
    if payload["portfolioHash"] != _stage4_acceptance_hash(workflow["portfolio"]):
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: portfolio hash does not match")

    for field, evidence in (
        ("workflow.generatedAt", workflow.get("generatedAt")),
        ("workflow.stateHistory.generatedAt", workflow.get("stateHistory", {}).get("generatedAt")),
        ("workflow.replay.generatedAt", workflow.get("replay", {}).get("generatedAt")),
    ):
        _stage4_utc(evidence, field)

    portfolio_legs = workflow["portfolio"].get("legs")
    leg_bindings = [(leg.get("runId"), leg.get("symbol")) for leg in legs if isinstance(leg, dict)]
    portfolio_symbols = [leg.get("symbol") for leg in portfolio_legs or [] if isinstance(leg, dict)]
    order_bindings = [
        (order.get("sourceRunId"), order.get("symbol"))
        for order in workflow["batch"].get("orders", [])
        if isinstance(order, dict)
    ]
    if (
        len(leg_bindings) != 2
        or len(set(leg_bindings)) != 2
        or len({run_id for run_id, _symbol in leg_bindings}) != 2
        or len(portfolio_symbols) != 2
        or len(set(portfolio_symbols)) != 2
        or [symbol for _run_id, symbol in leg_bindings] != portfolio_symbols
        or order_bindings != leg_bindings
    ):
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: leg and batch order bindings are invalid")

    risk_checks = workflow["portfolio"].get("preTradeRiskChecks")
    expected_risk_ids = {
        ("portfolio", "portfolio_data_quality", None, None),
        *{
            ("trade", check_id, run_id, symbol)
            for run_id, symbol in leg_bindings
            for check_id in ("trade_review_status", "trade_notional_limit")
        },
    }
    risk_ids = [
        (check.get("scope"), check.get("checkId"), check.get("sourceRunId"), check.get("symbol"))
        for check in risk_checks or []
        if isinstance(check, dict)
    ]
    if (
        not isinstance(risk_checks, list)
        or len(risk_checks) != 5
        or len(set(risk_ids)) != 5
        or set(risk_ids) != expected_risk_ids
        or any(
            not isinstance(check, dict)
            or check.get("status") not in {"passed", "review", "blocked"}
            or not str(check.get("reason") or "").strip()
            for check in risk_checks
        )
        or payload["riskEvidence"] != _stage4_risk_evidence(workflow)
        or payload["riskEvidence"].get("blockedCount") != 0
        or payload["riskEvidence"].get("rejectionReasons") != []
    ):
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: risk checks are invalid")

    orders_by_id = {order.get("orderId"): order for order in workflow["batch"]["orders"]}
    simulations_by_id = {
        simulation.get("orderId"): simulation for simulation in workflow["simulations"]
    }
    if len(orders_by_id) != 2 or len(simulations_by_id) != 2 or set(simulations_by_id) != set(orders_by_id):
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: simulation order binding is invalid")
    for order_id, order in orders_by_id.items():
        simulation = simulations_by_id[order_id]
        quantity = order.get("quantity")
        notional = order.get("notionalValue")
        if (
            isinstance(quantity, bool)
            or not isinstance(quantity, (int, float))
            or quantity <= 0
            or isinstance(notional, bool)
            or not isinstance(notional, (int, float))
            or notional <= 0
            or any(
                simulation.get(field) != order.get(field)
                for field in ("symbol", "sourceRunId", "side", "quantity", "notionalValue")
            )
            or simulation.get("fillPrice") != round(notional / quantity, 6)
        ):
            raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: simulation facts do not match order")

    try:
        to_simulation = _quant_core_validator("execution", "portfolio_paper_order_payload_to_simulation")
        build_replay = _quant_core_validator("execution", "build_portfolio_paper_order_replay")
        replay = workflow["replay"]
        expected_replay = build_replay(
            [to_simulation(simulation) for simulation in workflow["simulations"]],
            base_run_id=workflow["baseRunId"],
            initial_cash=workflow["portfolioRequest"]["initialCash"],
            generated_at=datetime.fromisoformat(replay["generatedAt"]),
        )
    except (KeyError, TypeError, ValueError) as error:
        raise RuntimeError(f"Invalid Stage 4 portfolio acceptance manifest: replay evidence is invalid: {error}") from error
    if replay != expected_replay:
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: replay evidence is not exact")

    order_ids = [order.get("orderId") for order in workflow["batch"]["orders"]]
    retry = payload["retryEvidence"]
    if not isinstance(retry, dict) or set(retry) != {
        "requestedOrderIds",
        "initialFilledOrderIds",
        "retryCreatedOrderIds",
        "retrySkippedOrderIds",
    } or retry["requestedOrderIds"] != order_ids or retry["initialFilledOrderIds"] != order_ids or retry[
        "retryCreatedOrderIds"
    ] != [] or retry["retrySkippedOrderIds"] != order_ids:
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: idempotent retry evidence is invalid")

    readback = payload["exportReadback"]
    if not isinstance(readback, dict) or set(readback) != {
        "exportArtifactCount",
        "importedArtifactCount",
        "readbackArtifactCount",
        "exportWorkflowHash",
        "importedWorkflowHash",
        "readbackWorkflowHash",
    } or any(
        type(readback[field]) is not int or readback[field] != 1
        for field in ("exportArtifactCount", "importedArtifactCount", "readbackArtifactCount")
    ) or any(
        readback[field] != workflow["workflowHash"]
        for field in ("exportWorkflowHash", "importedWorkflowHash", "readbackWorkflowHash")
    ):
        raise RuntimeError("Invalid Stage 4 portfolio acceptance manifest: export readback evidence is invalid")
    return (
        f"stage4 portfolio acceptance run={workflow['baseRunId']} legs=2 orders={len(order_ids)} "
        "replayExact=True liveBlocked=True"
    )


def _load_json_report(path: Path, label: str) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeError(f"Invalid {label}: report file not found {path}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid {label}: report is not valid JSON {path}") from error
    return _require_dict(payload, label)


def _quant_core_validator(module_name: str, function_name: str):
    ensure_quant_core_import_path()
    module = __import__(f"quant_core.{module_name}", fromlist=[function_name])
    return getattr(module, function_name)


def load_p2_pre_live_acceptance_report(path: Path) -> dict[str, Any]:
    return _load_json_report(path, "P2 pre-live acceptance manifest")


def load_p2_paper_replay_report(path: Path) -> dict[str, Any]:
    return _load_json_report(path, "P2 paper replay manifest")


def load_p2_readiness_acceptance_report(path: Path) -> dict[str, Any]:
    return _load_json_report(path, "P2 readiness acceptance manifest")


def validate_p2_pre_live_acceptance_manifest(manifest: Any) -> str:
    validator = _quant_core_validator("p2_acceptance", "validate_p2_pre_live_acceptance_manifest")
    try:
        return validator(manifest)
    except ValueError as error:
        raise RuntimeError(f"Invalid P2 pre-live acceptance manifest: {error}") from error


def build_p2_pre_live_acceptance_manifest(
    p1_acceptance_manifest: dict[str, Any],
    p2_paper_replay_manifest: dict[str, Any],
    *,
    base_url: str,
    run_id: str,
    adapter_id: str | None = None,
) -> dict[str, Any]:
    builder = _quant_core_validator("p2_acceptance", "build_p2_pre_live_acceptance_manifest")
    try:
        return builder(
            p1_acceptance_manifest,
            p2_paper_replay_manifest,
            base_url=base_url,
            run_id=run_id,
            adapter_id=adapter_id,
        )
    except ValueError as error:
        raise RuntimeError(f"Invalid P2 pre-live acceptance inputs: {error}") from error


def validate_p2_paper_replay_manifest(manifest: Any) -> str:
    validator = _quant_core_validator("p2_paper_replay", "validate_p2_paper_replay_manifest")
    try:
        return validator(manifest)
    except ValueError as error:
        raise RuntimeError(f"Invalid P2 paper replay manifest: {error}") from error


def build_p2_paper_replay_manifest_from_export_package(
    export_package: dict[str, Any],
    *,
    base_url: str,
    adapter_id: str | None = None,
) -> dict[str, Any]:
    builder = _quant_core_validator("p2_paper_replay", "build_p2_paper_replay_manifest_from_export_package")
    try:
        return builder(export_package, base_url=base_url, adapter_id=adapter_id)
    except ValueError as error:
        raise RuntimeError(f"Invalid P2 paper replay export package: {error}") from error


def validate_p2_readiness_acceptance_manifest(manifest: Any) -> str:
    validator = _quant_core_validator("p2_readiness_acceptance", "validate_p2_readiness_acceptance_manifest")
    try:
        return validator(manifest)
    except ValueError as error:
        raise RuntimeError(f"Invalid P2 readiness acceptance manifest: {error}") from error


def _p2_manifest_stage(
    *,
    stage_id: str,
    label: str,
    path: Path,
    loader,
    validator,
    next_action: str,
    next_command: str,
) -> dict[str, Any]:
    try:
        manifest = loader(path)
        summary = validator(manifest)
    except RuntimeError as error:
        reason = str(error)
        status = "missing" if "file not found" in reason else "invalid"
        return {
            "id": stage_id,
            "label": label,
            "status": status,
            "path": str(path),
            "summary": "",
            "reason": reason,
            "nextAction": next_action,
            "nextCommand": next_command,
        }
    return {
        "id": stage_id,
        "label": label,
        "status": "valid",
        "path": str(path),
        "summary": summary,
        "reason": "",
        "nextAction": "",
        "nextCommand": "",
    }


def build_p2_manifest_chain_preflight(
    *,
    p1_acceptance_report: Path = Path("data") / "p1-acceptance.json",
    p2_paper_replay_report: Path = Path("data") / "p2-paper-replay.json",
    p2_pre_live_acceptance_report: Path = Path("data") / "p2-pre-live-acceptance.json",
    p2_readiness_acceptance_report: Path = Path("data") / "p2-readiness-acceptance.json",
) -> dict[str, Any]:
    stages = [
        _p2_manifest_stage(
            stage_id="p1-acceptance",
            label="P1 acceptance",
            path=p1_acceptance_report,
            loader=load_p1_acceptance_report,
            validator=validate_p2_chain_p1_acceptance_manifest,
            next_action="run-p1-acceptance",
            next_command="npm run docker:smoke:p1 -- --no-build",
        ),
        _p2_manifest_stage(
            stage_id="p2-paper-replay",
            label="P2 paper replay",
            path=p2_paper_replay_report,
            loader=load_p2_paper_replay_report,
            validator=validate_p2_paper_replay_manifest,
            next_action="run-p2-paper-replay",
            next_command="npm run docker:smoke:p2:paper-replay -- --no-build",
        ),
        _p2_manifest_stage(
            stage_id="p2-pre-live-acceptance",
            label="P2 pre-live acceptance",
            path=p2_pre_live_acceptance_report,
            loader=load_p2_pre_live_acceptance_report,
            validator=validate_p2_pre_live_acceptance_manifest,
            next_action="run-p2-pre-live",
            next_command="npm run docker:smoke:p2:pre-live -- --no-build",
        ),
        _p2_manifest_stage(
            stage_id="p2-readiness-acceptance",
            label="P2 readiness acceptance",
            path=p2_readiness_acceptance_report,
            loader=load_p2_readiness_acceptance_report,
            validator=validate_p2_readiness_acceptance_manifest,
            next_action="run-p2-readiness",
            next_command="npm run docker:smoke:p2 -- --no-build",
        ),
    ]
    valid_stage_count = sum(1 for stage in stages if stage["status"] == "valid")
    first_blocker = next((stage for stage in stages if stage["status"] != "valid"), None)
    ready = first_blocker is None
    blocker_ids = [stage["id"] for stage in stages if stage["status"] != "valid"]
    return {
        "kind": "aiqt.p2ManifestChainPreflight",
        "schemaVersion": 1,
        "status": "ready" if ready else "blocked",
        "ready": ready,
        "validStageCount": valid_stage_count,
        "totalStageCount": len(stages),
        "blockerIds": blocker_ids,
        "nextAction": "" if ready else str(first_blocker["nextAction"]),
        "nextCommand": "" if ready else str(first_blocker["nextCommand"]),
        "stages": stages,
        "paperOnly": True,
        "orderSubmissionEnabled": False,
        "liveTradingAllowed": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "liveBlockedBoundary": True,
    }


def validate_p2_manifest_chain_preflight(preflight: dict[str, Any]) -> str:
    status = str(preflight.get("status") or "").strip()
    valid_stage_count = int(preflight.get("validStageCount") or 0)
    total_stage_count = int(preflight.get("totalStageCount") or 0)
    next_action = str(preflight.get("nextAction") or "none").strip() or "none"
    return (
        f"p2 manifest chain preflight status={status} "
        f"valid={valid_stage_count}/{total_stage_count} next={next_action}"
    )


def write_p2_manifest_chain_preflight(path: Path, preflight: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(preflight, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"p2 manifest chain preflight report={path}")
    return path


def _manifest_string(manifest: dict[str, Any], field: str) -> str:
    return str(manifest.get(field) or "").strip()


def _require_manifest_string(manifest: dict[str, Any], field: str, label: str) -> str:
    value = _manifest_string(manifest, field)
    if not value:
        raise RuntimeError(f"Invalid {label}: {field} is missing")
    return value


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _dedupe_strings(values: Sequence[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for value in values:
        item = str(value).strip()
        if item and item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped


def _assert_same_manifest_field(
    expected: str,
    manifest: dict[str, Any],
    field: str,
    *,
    label: str,
) -> None:
    actual = _require_manifest_string(manifest, field, label)
    if actual != expected:
        raise RuntimeError(f"Invalid P2 readiness acceptance inputs: {label}.{field} {actual} != {expected}")


def build_p2_readiness_acceptance_manifest(
    *,
    base_url: str,
    run_id: str,
    p1_acceptance_manifest: dict[str, Any],
    p1_acceptance_path: Path,
    p2_pre_live_acceptance_manifest: dict[str, Any],
    p2_pre_live_acceptance_path: Path,
    p2_paper_replay_manifest: dict[str, Any],
    p2_paper_replay_path: Path,
    operator_runbook_audit_event_id: str | None = None,
) -> dict[str, Any]:
    validate_p1_acceptance_manifest(p1_acceptance_manifest)
    paper_replay_summary = validate_p2_paper_replay_manifest(p2_paper_replay_manifest)
    pre_live_summary = validate_p2_pre_live_acceptance_manifest(p2_pre_live_acceptance_manifest)

    p1_run_id = _require_manifest_string(p1_acceptance_manifest, "runId", "P1 acceptance manifest")
    pre_live_run_id = _require_manifest_string(
        p2_pre_live_acceptance_manifest,
        "runId",
        "P2 pre-live acceptance manifest",
    )
    paper_replay_run_id = _require_manifest_string(p2_paper_replay_manifest, "runId", "P2 paper replay manifest")
    market = _require_manifest_string(p2_pre_live_acceptance_manifest, "market", "P2 pre-live acceptance manifest")
    symbol = _require_manifest_string(p2_pre_live_acceptance_manifest, "symbol", "P2 pre-live acceptance manifest")
    timeframe = _require_manifest_string(
        p2_pre_live_acceptance_manifest,
        "timeframe",
        "P2 pre-live acceptance manifest",
    )
    adapter_id = _require_manifest_string(
        p2_pre_live_acceptance_manifest,
        "adapterId",
        "P2 pre-live acceptance manifest",
    )

    _assert_same_manifest_field(market, p2_paper_replay_manifest, "market", label="P2 paper replay manifest")
    _assert_same_manifest_field(symbol, p2_paper_replay_manifest, "symbol", label="P2 paper replay manifest")
    _assert_same_manifest_field(timeframe, p2_paper_replay_manifest, "timeframe", label="P2 paper replay manifest")
    _assert_same_manifest_field(adapter_id, p2_paper_replay_manifest, "adapterId", label="P2 paper replay manifest")
    _assert_same_manifest_field(symbol, p1_acceptance_manifest, "queuedSymbol", label="P1 acceptance manifest")
    _assert_same_manifest_field(timeframe, p1_acceptance_manifest, "timeframe", label="P1 acceptance manifest")

    operator_event_id = (
        str(operator_runbook_audit_event_id or "").strip()
        or f"operator-runbook-report-{adapter_id}-{symbol}-{timeframe}-{run_id}"
    )
    criterion_ids = [
        "p1-acceptance",
        "paper-execution-replay",
        "pre-live-checklist",
        "p2-pre-live-manifest",
        "readiness-evidence-coverage",
        "live-blocked-boundary",
    ]
    audit_event_ids = _dedupe_strings(
        [
            f"p1-acceptance-{p1_run_id}",
            *_string_list(p2_paper_replay_manifest.get("auditEventIds")),
            *_string_list(p2_pre_live_acceptance_manifest.get("auditEventIds")),
            operator_event_id,
        ]
    )
    manifest_paths = {
        "p1Acceptance": str(p1_acceptance_path),
        "p2PreLiveAcceptance": str(p2_pre_live_acceptance_path),
        "p2PaperReplay": str(p2_paper_replay_path),
    }
    checks = [
        {
            "id": "p1-acceptance",
            "status": "passed",
            "summary": "P1 research workflow acceptance is valid and live trading remains blocked.",
            "evidenceId": manifest_paths["p1Acceptance"],
        },
        {
            "id": "paper-execution-replay",
            "status": "passed",
            "summary": paper_replay_summary,
            "evidenceId": manifest_paths["p2PaperReplay"],
        },
        {
            "id": "pre-live-checklist",
            "status": "passed",
            "summary": (
                "P2 pre-live checklist evidence is present for manual review; "
                f"promotionStatus={_manifest_string(p2_pre_live_acceptance_manifest, 'promotionStatus') or 'unknown'}"
            ),
            "evidenceId": pre_live_run_id,
        },
        {
            "id": "p2-pre-live-manifest",
            "status": "passed",
            "summary": pre_live_summary,
            "evidenceId": manifest_paths["p2PreLiveAcceptance"],
        },
        {
            "id": "readiness-evidence-coverage",
            "status": "passed",
            "summary": "P1 acceptance, P2 paper replay, P2 pre-live manifest, and operator runbook evidence are traceable.",
            "evidenceId": "p2-evidence-coverage",
        },
        {
            "id": "live-blocked-boundary",
            "status": "passed",
            "summary": "No direct order submission, live order, route execution, or live trading is allowed.",
            "evidenceId": "forced-platform-boundary",
        },
    ]
    return {
        "kind": "aiqt.p2ReadinessAcceptanceManifest",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted",
        "baseUrl": base_url,
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "runId": run_id,
        "adapterId": adapter_id,
        "p1AcceptanceRunId": p1_run_id,
        "p2PreLiveAcceptanceRunId": pre_live_run_id,
        "p2PaperReplayRunId": paper_replay_run_id,
        "operatorRunbookAuditEventId": operator_event_id,
        "readinessCoverageStatus": "covered",
        "acceptedCriterionCount": len(criterion_ids),
        "totalCriterionCount": len(criterion_ids),
        "blockingCriterionCount": 0,
        "criterionIds": criterion_ids,
        "auditEventIds": audit_event_ids,
        "manifestPaths": manifest_paths,
        "paperOnly": True,
        "orderSubmissionEnabled": False,
        "liveTradingAllowed": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "liveBlockedBoundary": True,
        "checkCount": len(checks),
        "checks": checks,
    }


def write_p2_readiness_acceptance_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"p2 readiness acceptance report={path}")
    return path


def write_p2_pre_live_acceptance_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"p2 pre-live acceptance report={path}")
    return path


def write_p2_paper_replay_report(path: Path, manifest: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"p2 paper replay report={path}")
    return path


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


def post_json_with_status(
    url: str,
    payload: dict[str, Any],
    timeout_seconds: int,
) -> tuple[int, Any]:
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
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        try:
            payload = json.loads(error.read().decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            payload = {}
        return error.code, payload


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


def _stage4_export_workflow(payload: Any, run_id: str) -> tuple[dict[str, Any], int]:
    package = _require_dict(_require_dict(payload, "Stage 4 research export").get("export"), "Stage 4 export")
    manifest = _require_dict(package.get("manifest"), "Stage 4 export manifest")
    counts = _require_dict(manifest.get("artifactCounts"), "Stage 4 export artifact counts")
    count = counts.get("stage4PortfolioWorkflows")
    events = package.get("auditEvents")
    workflows = [
        event.get("metadata", {}).get("snapshot")
        for event in events or []
        if isinstance(event, dict)
        and event.get("eventType") == "stage4_portfolio_workflow"
        and isinstance(event.get("metadata"), dict)
    ]
    if manifest.get("runId") != run_id or type(count) is not int or count != 1 or len(workflows) != 1:
        raise RuntimeError("Invalid Stage 4 research export: workflow count or run binding is invalid")
    return _require_dict(workflows[0], "Stage 4 exported workflow"), count


def run_stage4_portfolio_acceptance(
    base_url: str,
    *,
    timeout_seconds: int,
    report_path: Path | None = None,
) -> list[str]:
    run_ids = []
    for symbol in ("600000", "000001"):
        response = post_json(
            join_url(base_url, "/api/p0/pipeline"),
            build_p0_pipeline_payload("ashare", symbol, "1d"),
            timeout_seconds=timeout_seconds,
        )
        run_id, _summary = validate_p0_pipeline_payload(response)
        run_ids.append(run_id)
    base_run_id = run_ids[0]
    portfolio_request = {
        "name": "Stage 4 Golden Path",
        "initialCash": 100000,
        "legs": [
            {"runId": run_ids[0], "targetWeight": 0.5},
            {"runId": run_ids[1], "targetWeight": 0.4},
        ],
    }
    portfolio = _require_dict(
        _require_dict(
            post_json(
                join_url(base_url, "/api/portfolio/backtest"),
                portfolio_request,
                timeout_seconds=timeout_seconds,
            ),
            "Stage 4 portfolio backtest",
        ).get("portfolio"),
        "Stage 4 portfolio",
    )
    legs = portfolio.get("legs")
    if not isinstance(legs, list) or len(legs) != 2:
        raise RuntimeError("Invalid Stage 4 portfolio response: exactly two legs are required")
    now = datetime.now(timezone.utc).isoformat()
    orders = [
        {
            "timestamp": now,
            "eventType": "portfolio_paper_order",
            "orderId": f"stage4-{_smoke_token(run_id)}-{_smoke_token(str(leg.get('symbol') or ''))}-buy",
            "symbol": str(leg.get("symbol") or ""),
            "sourceRunId": run_id,
            "side": "buy",
            "quantity": 10,
            "notionalValue": 1000,
            "status": "pending_review",
            "riskStatus": "passed",
            "reason": "Stage 4 paper-only acceptance order.",
        }
        for run_id, leg in zip(run_ids, legs, strict=True)
    ]
    batch_response = _require_dict(
        post_json(
            join_url(base_url, "/api/portfolio/paper-orders"),
            {
                "baseRunId": base_run_id,
                "portfolioName": portfolio_request["name"],
                "source": "stage4_portfolio_acceptance",
                "orders": orders,
            },
            timeout_seconds=timeout_seconds,
        ),
        "Stage 4 portfolio paper-order batch",
    )
    batch = _require_dict(batch_response.get("portfolioPaperOrderBatch"), "Stage 4 portfolio paper-order batch")
    batch_id = str(batch.get("batchId") or "").strip()
    order_ids = [str(order.get("orderId") or "").strip() for order in batch.get("orders", [])]
    if batch.get("baseRunId") != base_run_id or not batch_id or order_ids != [order["orderId"] for order in orders]:
        raise RuntimeError("Invalid Stage 4 portfolio paper-order batch: binding is invalid")

    for order_id in order_ids:
        approval_response = _require_dict(
            post_json(
                join_url(base_url, "/api/portfolio/paper-order-approvals"),
                {
                    "baseRunId": base_run_id,
                    "batchId": batch_id,
                    "orderId": order_id,
                    "approved": True,
                    "reviewer": "stage4-smoke-operator",
                    "reviewedAt": datetime.now(timezone.utc).isoformat(),
                    "reason": "Approved for Stage 4 paper-only acceptance.",
                },
                timeout_seconds=timeout_seconds,
            ),
            "Stage 4 portfolio approval",
        )
        approval = _require_dict(approval_response.get("approval"), "Stage 4 portfolio approval")
        if approval.get("orderId") != order_id or approval.get("approved") is not True:
            raise RuntimeError("Invalid Stage 4 portfolio approval: exact approval sequence is invalid")

    simulation_request = {
        "baseRunId": base_run_id,
        "batchId": batch_id,
        "orderIds": order_ids,
        "simulatedAt": datetime.now(timezone.utc).isoformat(),
        "routeRisk": {
            "initialCash": 100000,
            "minCashAfter": 10000,
            "maxSymbolNotional": 50000,
            "maxBatchNotional": 90000,
        },
    }
    first_simulation = _require_dict(
        post_json(
            join_url(base_url, "/api/portfolio/paper-order-simulations/batch"),
            simulation_request,
            timeout_seconds=timeout_seconds,
        ),
        "Stage 4 batch simulation",
    )
    retry_simulation = _require_dict(
        post_json(
            join_url(base_url, "/api/portfolio/paper-order-simulations/batch"),
            simulation_request,
            timeout_seconds=timeout_seconds,
        ),
        "Stage 4 batch simulation retry",
    )
    created = first_simulation.get("createdSimulations")
    retry_created = retry_simulation.get("createdSimulations")
    retry_batch = _require_dict(retry_simulation.get("batchSimulation"), "Stage 4 retry summary")
    skipped = retry_batch.get("skippedOrders")
    if (
        not isinstance(created, list)
        or [row.get("orderId") for row in created if isinstance(row, dict)] != order_ids
        or any(row.get("orderState") != "filled" or row.get("fillStatus") != "filled" for row in created)
        or retry_created != []
        or not isinstance(skipped, list)
        or [row.get("orderId") for row in skipped if isinstance(row, dict)] != order_ids
        or any(row.get("reason") != "already_simulated" for row in skipped)
    ):
        raise RuntimeError("Invalid Stage 4 batch simulation: fill or idempotent retry evidence is invalid")

    context = urlencode({"baseRunId": base_run_id, "batchId": batch_id})
    state_history = _require_dict(
        _require_dict(
            request_json(
                join_url(base_url, f"/api/portfolio/paper-order-state-history?{context}"),
                timeout_seconds,
            ),
            "Stage 4 state history",
        ).get("stateHistory"),
        "Stage 4 state history",
    )
    replay = _require_dict(
        _require_dict(
            request_json(
                join_url(
                    base_url,
                    f"/api/portfolio/paper-order-replay?{urlencode({'baseRunId': base_run_id, 'initialCash': 100000})}",
                ),
                timeout_seconds,
            ),
            "Stage 4 replay",
        ).get("replay"),
        "Stage 4 replay",
    )
    workflow_response = _require_dict(
        post_json(
            join_url(base_url, "/api/portfolio/workflows"),
            {
                **portfolio_request,
                "baseRunId": base_run_id,
                "riskTemplate": {
                    field: simulation_request["routeRisk"][field]
                    for field in ("minCashAfter", "maxSymbolNotional", "maxBatchNotional")
                },
                "batchId": batch_id,
                "operator": "stage4-smoke-operator",
            },
            timeout_seconds=timeout_seconds,
        ),
        "Stage 4 authoritative workflow",
    )
    workflow = _require_dict(workflow_response.get("workflow"), "Stage 4 authoritative workflow")
    if (
        {key: value for key, value in workflow.get("stateHistory", {}).items() if key != "generatedAt"}
        != {key: value for key, value in state_history.items() if key != "generatedAt"}
        or {key: value for key, value in workflow.get("replay", {}).items() if key != "generatedAt"}
        != {key: value for key, value in replay.items() if key != "generatedAt"}
    ):
        raise RuntimeError("Invalid Stage 4 authoritative workflow: state or replay readback differs")

    export_url = join_url(base_url, f"/api/research/runs/{quote(base_run_id, safe='')}/export")
    export_payload = request_json(export_url, timeout_seconds)
    exported_workflow, export_count = _stage4_export_workflow(export_payload, base_run_id)
    export_package = _require_dict(_require_dict(export_payload, "Stage 4 research export").get("export"), "Stage 4 export")
    import_payload = post_json(
        join_url(base_url, "/api/research/runs/import"),
        export_package,
        timeout_seconds=timeout_seconds,
    )
    validate_p0_import_payload(import_payload, base_run_id)
    imported_export = request_json(export_url, timeout_seconds)
    imported_workflow, imported_count = _stage4_export_workflow(imported_export, base_run_id)
    readback_payload = _require_dict(
        request_json(
            join_url(base_url, f"/api/portfolio/workflows?{urlencode({'baseRunId': base_run_id, 'limit': 1})}"),
            timeout_seconds,
        ),
        "Stage 4 workflow readback",
    )
    workflows = readback_payload.get("workflows")
    if not isinstance(workflows, list) or len(workflows) != 1:
        raise RuntimeError("Invalid Stage 4 workflow readback: exactly one workflow is required")
    readback_workflow = _require_dict(workflows[0], "Stage 4 workflow readback")
    manifest = build_stage4_portfolio_acceptance_manifest(
        workflow=workflow,
        retry_evidence={
            "requestedOrderIds": order_ids,
            "initialFilledOrderIds": order_ids,
            "retryCreatedOrderIds": [],
            "retrySkippedOrderIds": order_ids,
        },
        export_readback={
            "exportArtifactCount": export_count,
            "importedArtifactCount": imported_count,
            "readbackArtifactCount": 1,
            "exportWorkflowHash": exported_workflow.get("workflowHash"),
            "importedWorkflowHash": imported_workflow.get("workflowHash"),
            "readbackWorkflowHash": readback_workflow.get("workflowHash"),
        },
    )
    summary = validate_stage4_portfolio_acceptance_manifest(manifest)
    print(summary)
    if report_path is not None:
        write_stage4_portfolio_acceptance_report(report_path, manifest)
    return [summary]


def _stage2_experiment(payload: Any, label: str) -> dict[str, Any]:
    response = _require_dict(payload, label)
    experiment = _require_dict(response.get("experiment"), label)
    if experiment.get("status") != "completed":
        raise RuntimeError(f"Invalid {label} response: experiment is not completed")
    for field in (
        "experimentId",
        "definitionHash",
        "resultHash",
        "holdoutKey",
        "strategyRevision",
        "sourceRunId",
        "snapshotId",
    ):
        if not str(experiment.get(field) or "").strip():
            raise RuntimeError(f"Invalid {label} response: {field} is missing")
    candidates = experiment.get("candidates")
    if not isinstance(candidates, list) or len(candidates) < 2:
        raise RuntimeError(f"Invalid {label} response: at least two candidates are required")
    return experiment


def _stage2_source_run(payload: Any, run_id: str) -> dict[str, Any]:
    run = _require_dict(_require_dict(payload, "Stage 2 source run").get("run"), "Stage 2 source run")
    snapshot = _require_dict(run.get("dataSnapshot"), "Stage 2 source run snapshot")
    strategy = _require_dict(run.get("strategyConfig"), "Stage 2 source run strategy")
    if run.get("runId") != run_id or not str(snapshot.get("hash") or "").strip():
        raise RuntimeError("Invalid Stage 2 source run: run id or canonical data hash is missing")
    if not str(strategy.get("revision") or "").strip():
        raise RuntimeError("Invalid Stage 2 source run: canonical strategy revision is missing")
    return run


def _matching_stage2_experiment(
    experiments: Any,
    *,
    experiment_request: dict[str, Any],
    source_run: dict[str, Any],
) -> dict[str, Any] | None:
    if not isinstance(experiments, list):
        raise RuntimeError("Invalid Stage 2 strategy experiment history response: experiments are missing")
    snapshot = _require_dict(source_run.get("dataSnapshot"), "Stage 2 source run snapshot")
    strategy = _require_dict(source_run.get("strategyConfig"), "Stage 2 source run strategy")
    strategy_revision = str(experiment_request["strategyRevision"])
    if source_run.get("strategyRevision") != strategy_revision or strategy.get("revision") != strategy_revision:
        raise RuntimeError("Invalid Stage 2 source run: strategy revision does not match the pipeline")
    snapshot_id = _quant_core_validator("canonical", "canonical_snapshot_id")(
        market=str(source_run.get("market") or ""),
        symbol=str(source_run.get("symbol") or ""),
        timeframe=str(source_run.get("timeframe") or ""),
        canonical_data_hash=str(snapshot["hash"]),
    )
    expected = {
        "baseStrategy": strategy,
        "strategyRevision": strategy_revision,
        "snapshotId": snapshot_id,
        "canonicalDataHash": snapshot["hash"],
        "market": source_run.get("market"),
        "symbol": source_run.get("symbol"),
        "timeframe": source_run.get("timeframe"),
        "assumptions": experiment_request["assumptions"],
        "split": {"trainPct": 60, "validationPct": 20, "testPct": 20},
        "dimensions": experiment_request["dimensions"],
        "guardrails": experiment_request["guardrails"],
        "walkForward": experiment_request["walkForward"],
        "evaluationBudget": 5,
        "engineVersion": "backtest-v1",
        "resultSchemaVersion": 1,
    }
    definition_keys = {*expected, "sourceRunId"}
    for item in experiments:
        if not isinstance(item, dict) or item.get("status") != "completed":
            continue
        definition = item.get("definition")
        if not isinstance(definition, dict) or set(definition) != definition_keys:
            continue
        if any(definition.get(field) != value for field, value in expected.items()):
            continue
        if (
            item.get("strategyRevision") != strategy_revision
            or item.get("sourceRunId") != definition.get("sourceRunId")
            or item.get("snapshotId") != definition.get("snapshotId")
            or item.get("market") != source_run.get("market")
            or item.get("symbol") != source_run.get("symbol")
            or item.get("timeframe") != source_run.get("timeframe")
            or not str(item.get("experimentId") or "").strip()
            or not str(item.get("definitionHash") or "").strip()
            or not str(item.get("resultHash") or "").strip()
        ):
            continue
        return item
    return None


def _require_stage2_experiment_binding(
    experiment: dict[str, Any],
    expected: dict[str, Any],
    label: str,
) -> None:
    for field in ("sourceRunId", "strategyRevision", "snapshotId"):
        if experiment.get(field) != expected.get(field):
            raise RuntimeError(f"Invalid {label}: {field} binding does not match")


def run_stage2_strategy_experiment_acceptance(
    base_url: str,
    *,
    timeout_seconds: int,
    report_path: Path | None = None,
) -> list[str]:
    pipeline_payload = post_json(
        join_url(base_url, "/api/p0/pipeline"),
        build_p0_pipeline_payload("ashare", "600000", "1d"),
        timeout_seconds=timeout_seconds,
    )
    pipeline_response = _require_dict(pipeline_payload, "Stage 2 P0 v2 pipeline")
    run_id, _pipeline_summary = validate_p0_pipeline_payload(pipeline_response)
    strategy_revision_id = str(pipeline_response.get("strategyRevisionId") or "").strip()
    snapshot_id = str(pipeline_response.get("dataSnapshotId") or "").strip()
    if not strategy_revision_id.startswith("strategy-") or not snapshot_id:
        raise RuntimeError("Invalid Stage 2 P0 v2 pipeline response: strategy revision or snapshot is missing")
    if any(
        pipeline_response.get(field) is not False
        for field in ("orderSubmitted", "liveOrderSubmitted", "routeExecuted")
    ):
        raise RuntimeError("Invalid Stage 2 P0 v2 pipeline response: live or order route is not blocked")
    strategy_revision = strategy_revision_id.removeprefix("strategy-")
    source_run = _stage2_source_run(
        request_json(
            join_url(base_url, f"/api/research/runs/{quote(run_id, safe='')}"),
            timeout_seconds,
        ),
        run_id,
    )

    experiment_request = {
        "strategyRevision": strategy_revision,
        "sourceRunId": run_id,
        "assumptions": {"initialCash": 100000, "feeBps": 3, "slippageBps": 2},
        "dimensions": [
            {
                "conditionSide": "entry",
                "conditionIndex": 0,
                "parameter": "window",
                "values": [10, 20],
            }
        ],
        "guardrails": {"minimumTradeCount": 2, "maximumDrawdownPct": 20},
        "walkForward": None,
    }
    prior_history_query = urlencode({"strategyRevision": strategy_revision, "limit": 50})
    prior_history_payload = _require_dict(
        request_json(
            join_url(base_url, f"/api/strategy-experiments?{prior_history_query}"),
            timeout_seconds,
        ),
        "Stage 2 strategy experiment history",
    )
    experiment = _matching_stage2_experiment(
        prior_history_payload.get("experiments"),
        experiment_request=experiment_request,
        source_run=source_run,
    )
    reused = experiment is not None
    if not reused:
        experiment = _stage2_experiment(
            post_json(
                join_url(base_url, "/api/strategy-experiments"),
                experiment_request,
                timeout_seconds=timeout_seconds,
            ),
            "Stage 2 strategy experiment",
        )
        if experiment.get("sourceRunId") != experiment_request["sourceRunId"] or _matching_stage2_experiment(
            [experiment],
            experiment_request=experiment_request,
            source_run=source_run,
        ) is not experiment:
            raise RuntimeError("Invalid Stage 2 strategy experiment: fresh definition binding does not match")
    experiment_id = str(experiment["experimentId"])
    experiment_source_run_id = str(experiment["sourceRunId"])
    replay = _stage2_experiment(
        post_json(
            join_url(base_url, "/api/strategy-experiments"),
            {"replayOfExperimentId": experiment_id},
            timeout_seconds=timeout_seconds,
        ),
        "Stage 2 strategy experiment replay",
    )
    _require_stage2_experiment_binding(replay, experiment, "Stage 2 strategy experiment replay")
    replay_experiment_id = str(replay["experimentId"])
    if replay_experiment_id == experiment_id:
        raise RuntimeError("Invalid Stage 2 strategy experiment response: replay experiment id is not distinct")
    if any(replay[field] != experiment[field] for field in ("definitionHash", "resultHash")):
        raise RuntimeError("Invalid Stage 2 strategy experiment response: exact replay hashes do not match")

    history_query = urlencode(
        {"strategyRevision": strategy_revision, "sourceRunId": experiment_source_run_id, "limit": 5}
    )
    history_payload = _require_dict(
        request_json(join_url(base_url, f"/api/strategy-experiments?{history_query}"), timeout_seconds),
        "Stage 2 strategy experiment history",
    )
    history = history_payload.get("experiments")
    if not isinstance(history, list):
        raise RuntimeError("Invalid Stage 2 strategy experiment history response: experiments are missing")
    history_by_id = {
        str(item.get("experimentId") or "").strip(): item
        for item in history
        if isinstance(item, dict)
    }
    if not {experiment_id, replay_experiment_id}.issubset(history_by_id):
        raise RuntimeError("Invalid Stage 2 strategy experiment history response: experiment pair is missing")
    for pair_id, expected in ((experiment_id, experiment), (replay_experiment_id, replay)):
        history_row = history_by_id[pair_id]
        _require_stage2_experiment_binding(
            history_row,
            expected,
            "Stage 2 strategy experiment history response",
        )
        if history_row.get("status") != "completed" or any(
            history_row.get(field) != expected.get(field) for field in ("definitionHash", "resultHash")
        ):
            raise RuntimeError("Invalid Stage 2 strategy experiment history response: evidence binding does not match")
    detail = _stage2_experiment(
        request_json(
            join_url(base_url, f"/api/strategy-experiments/{quote(experiment_id, safe='')}"),
            timeout_seconds,
        ),
        "Stage 2 strategy experiment detail",
    )
    _require_stage2_experiment_binding(detail, experiment, "Stage 2 strategy experiment detail response")
    if detail["experimentId"] != experiment_id or any(
        detail[field] != experiment[field] for field in ("definitionHash", "resultHash")
    ):
        raise RuntimeError("Invalid Stage 2 strategy experiment detail response: experiment evidence does not match")
    experiment = detail

    manifest = build_stage2_strategy_experiment_manifest(
        run_id=experiment_source_run_id,
        strategy_revision=strategy_revision,
        snapshot_id=str(experiment["snapshotId"]),
        experiment_id=experiment_id,
        replay_experiment_id=replay_experiment_id,
        definition_hash=str(experiment["definitionHash"]),
        result_hash=str(experiment["resultHash"]),
        candidate_count=len(experiment["candidates"]),
        holdout_key=str(experiment["holdoutKey"]),
    )
    summaries = [
        f"stage2 p0-v2 run={run_id} snapshot={snapshot_id}",
        validate_stage2_strategy_experiment_manifest(manifest),
    ]
    for summary in summaries:
        print(summary)
    if report_path is not None:
        write_stage2_strategy_experiment_report(report_path, manifest)
    return summaries


def _stage3_experiment_manifest(
    base_url: str,
    *,
    timeout_seconds: int,
) -> dict[str, Any]:
    with tempfile.TemporaryDirectory() as directory:
        report_path = Path(directory) / "stage2-strategy-experiment.json"
        run_stage2_strategy_experiment_acceptance(
            base_url,
            timeout_seconds=timeout_seconds,
            report_path=report_path,
        )
        manifest = load_stage2_strategy_experiment_report(report_path)
    validate_stage2_strategy_experiment_manifest(manifest)
    return manifest


def _stage3_review_record(
    payload: Any,
    *,
    primary_experiment_id: str,
    comparison_experiment_ids: list[str],
    provider: str,
) -> Any:
    response = _require_dict(payload, "Stage 3 AI review")
    projected = _require_dict(response.get("review"), "Stage 3 AI review")
    if projected.get("authority") != "authoritative":
        raise RuntimeError("Invalid Stage 3 AI review: authority is not authoritative")
    record = {key: value for key, value in projected.items() if key != "authority"}
    validator = _quant_core_validator(
        "ai_review_runs",
        "validate_authoritative_ai_review_run_record",
    )
    try:
        stored = validator(record)
    except ValueError as error:
        raise RuntimeError(f"Invalid Stage 3 AI review: {error}") from error
    if (
        stored.primary_experiment_id != primary_experiment_id
        or [item["experimentId"] for item in stored.record["comparisonExperiments"]]
        != comparison_experiment_ids
    ):
        raise RuntimeError("Invalid Stage 3 AI review: experiment binding does not match")
    canonical_sha256 = _quant_core_validator("canonical", "canonical_sha256")
    bundle = stored.record["evidenceBundle"]
    if stored.evidence_hash != canonical_sha256(
        {key: value for key, value in bundle.items() if key != "evidenceHash"}
    ) or stored.record_hash != canonical_sha256(
        {key: value for key, value in stored.record.items() if key != "recordHash"}
    ):
        raise RuntimeError("Invalid Stage 3 AI review: canonical hash does not match")
    external = stored.record["externalAssessment"]
    expected_statuses = {"skipped"} if provider == "local" else {"completed", "failed"}
    if external.get("provider") != provider or external.get("status") not in expected_statuses:
        raise RuntimeError("Invalid Stage 3 AI review: Provider evidence does not match")
    return stored


def _stage3_decision_record(payload: Any, *, review: Any) -> Any:
    response = _require_dict(payload, "Stage 3 AI review Decision")
    record = _require_dict(response.get("decision"), "Stage 3 AI review Decision")
    validator = _quant_core_validator(
        "ai_review_decisions",
        "validate_ai_review_decision_record",
    )
    try:
        stored = validator(record)
    except ValueError as error:
        raise RuntimeError(f"Invalid Stage 3 AI review Decision: {error}") from error
    if (
        stored.ai_review_id != review.ai_review_id
        or stored.review_record_hash != review.record_hash
        or stored.evidence_hash != review.evidence_hash
    ):
        raise RuntimeError("Invalid Stage 3 AI review Decision: Review binding does not match")
    return stored


def _stage3_export_package(payload: Any) -> dict[str, Any]:
    response = _require_dict(payload, "Stage 3 research export")
    package = response.get("export", response)
    return _require_dict(package, "Stage 3 research export package")


def _stage3_archive_snapshot(
    package: dict[str, Any],
    *,
    source_run_id: str,
    review_id: str,
    decision_ids: list[str],
) -> dict[str, Any]:
    manifest = _require_dict(package.get("manifest"), "Stage 3 research export manifest")
    counts = _require_dict(manifest.get("artifactCounts"), "Stage 3 research export artifact counts")
    if (
        manifest.get("runId") != source_run_id
        or manifest.get("paperOnly") is not True
        or manifest.get("liveTradingAllowed") is not False
        or manifest.get("orderSubmissionEnabled") is not False
        or manifest.get("liveOrderSubmitted") is not False
        or manifest.get("routeExecuted") is not False
        or manifest.get("liveBlockedBoundary") is not True
    ):
        raise RuntimeError("Invalid Stage 3 research export: paper-only boundary is invalid")
    reviews = package.get("aiReviewRunsV2")
    decisions = package.get("aiReviewDecisions")
    if (
        not isinstance(reviews, list)
        or not isinstance(decisions, list)
        or type(counts.get("aiReviewRunsV2")) is not int
        or counts["aiReviewRunsV2"] != len(reviews)
        or type(counts.get("aiReviewDecisions")) is not int
        or counts["aiReviewDecisions"] != len(decisions)
    ):
        raise RuntimeError("Invalid Stage 3 research export: artifact counts do not match")
    matching_reviews = [
        item
        for item in reviews
        if isinstance(item, dict) and item.get("aiReviewId") == review_id
    ]
    matching_decisions = [
        item
        for item in decisions
        if isinstance(item, dict) and item.get("aiReviewId") == review_id
    ]
    if len(matching_reviews) != 1 or len(matching_decisions) != len(decision_ids):
        raise RuntimeError("Invalid Stage 3 research export: accepted Review or Decision is missing")
    review_envelope = _require_dict(
        matching_reviews[0],
        "Stage 3 authoritative Review envelope",
    )
    review_record = _require_dict(review_envelope.get("record"), "Stage 3 authoritative Review record")
    review_validator = _quant_core_validator(
        "ai_review_runs",
        "validate_authoritative_ai_review_run_record",
    )
    decision_validator = _quant_core_validator(
        "ai_review_decisions",
        "validate_ai_review_decision_archive_records",
    )
    try:
        review = review_validator(review_record)
        decision_records = [
            _require_dict(
                _require_dict(item, "Stage 3 Decision envelope").get("record"),
                "Stage 3 Decision record",
            )
            for item in matching_decisions
        ]
        stored_decisions = decision_validator(decision_records, [review])
    except ValueError as error:
        raise RuntimeError(f"Invalid Stage 3 research export: {error}") from error
    if (
        review.ai_review_id != review_id
        or review.run_id != source_run_id
        or [decision.decision_id for decision in stored_decisions] != decision_ids
    ):
        raise RuntimeError("Invalid Stage 3 research export: Review or Decision identity does not match")
    integrity = _require_dict(package.get("integrity"), "Stage 3 research export integrity")
    if integrity.get("algorithm") != "sha256":
        raise RuntimeError("Invalid Stage 3 research export: integrity algorithm is invalid")
    package_hash = _stage3_hash(integrity.get("hash"), "research export integrity hash")
    return {
        "packageHash": package_hash,
        "review": review,
        "decisions": stored_decisions,
        "artifactCounts": {
            "aiReviewRunsV2": 1,
            "aiReviewDecisions": len(stored_decisions),
        },
    }


def _run_stage3_ai_review_flow(
    *,
    base_url: str,
    import_base_url: str,
    timeout_seconds: int,
    source_run_id: str,
    primary_experiment_id: str,
    comparison_experiment_ids: list[str],
    provider: str,
    external_data_approved: bool,
    request_count: int,
) -> dict[str, Any]:
    if (
        (provider == "local" and (external_data_approved or request_count != 0))
        or (
            provider == "openai-compatible"
            and (external_data_approved is not True or request_count != 1)
        )
        or provider not in {"local", "openai-compatible"}
    ):
        raise RuntimeError("Invalid Stage 3 AI review flow: Provider authorization is invalid")
    review_payload = post_json(
        join_url(base_url, "/api/ai-reviews"),
        {
            "primaryExperimentId": primary_experiment_id,
            "comparisonExperimentIds": comparison_experiment_ids,
            "providerId": provider,
            "externalDataApproved": external_data_approved,
        },
        timeout_seconds,
    )
    created_review = _stage3_review_record(
        review_payload,
        primary_experiment_id=primary_experiment_id,
        comparison_experiment_ids=comparison_experiment_ids,
        provider=provider,
    )
    decision_url = join_url(
        base_url,
        f"/api/ai-reviews/{quote(created_review.ai_review_id, safe='')}/decisions",
    )
    first = _stage3_decision_record(
        post_json(
            decision_url,
            {
                "operator": "stage3-smoke",
                "status": "accepted_for_research",
                "rationale": "Stage 3 evidence passed deterministic paper-only acceptance.",
                "supersedesDecisionId": None,
            },
            timeout_seconds,
        ),
        review=created_review,
    )
    second = _stage3_decision_record(
        post_json(
            decision_url,
            {
                "operator": "stage3-smoke",
                "status": "revision_requested",
                "rationale": "Stage 3 acceptance verifies an auditable Decision revision chain.",
                "supersedesDecisionId": first.decision_id,
            },
            timeout_seconds,
        ),
        review=created_review,
    )
    conflict_status, conflict_payload = post_json_with_status(
        decision_url,
        {
            "operator": "stage3-smoke",
            "status": "rejected",
            "rationale": "This stale predecessor must be rejected by the Decision ledger.",
            "supersedesDecisionId": first.decision_id,
        },
        timeout_seconds,
    )
    if (
        conflict_status != 409
        or not isinstance(conflict_payload, dict)
        or conflict_payload.get("error") != "decision_conflict"
    ):
        raise RuntimeError("Invalid Stage 3 AI review: stale Decision predecessor was not rejected")
    detail = _require_dict(
        request_json(
            join_url(
                base_url,
                f"/api/ai-reviews/{quote(created_review.ai_review_id, safe='')}",
            ),
            timeout_seconds,
        ),
        "Stage 3 AI review detail",
    )
    detail_review = _stage3_review_record(
        detail,
        primary_experiment_id=primary_experiment_id,
        comparison_experiment_ids=comparison_experiment_ids,
        provider=provider,
    )
    latest_decision = _require_dict(
        detail.get("latestDecision"),
        "Stage 3 latest Decision",
    )
    if (
        detail_review.record_hash != created_review.record_hash
        or latest_decision.get("decisionId") != second.decision_id
        or latest_decision.get("recordHash") != second.record_hash
    ):
        raise RuntimeError("Invalid Stage 3 AI review detail: readback hash does not match")

    export_package = _stage3_export_package(
        request_json(
            join_url(
                base_url,
                f"/api/research/runs/{quote(source_run_id, safe='')}/export",
            ),
            timeout_seconds,
        )
    )
    decision_ids = [first.decision_id, second.decision_id]
    exported = _stage3_archive_snapshot(
        export_package,
        source_run_id=source_run_id,
        review_id=created_review.ai_review_id,
        decision_ids=decision_ids,
    )
    import_payload = _require_dict(
        post_json(
            join_url(import_base_url, "/api/research/runs/import"),
            export_package,
            timeout_seconds,
        ),
        "Stage 3 research import",
    )
    imported_run = _require_dict(import_payload.get("run"), "Stage 3 imported research run")
    if imported_run.get("runId") != source_run_id:
        raise RuntimeError("Invalid Stage 3 research import: source run does not match")
    imported_package = _stage3_export_package(
        request_json(
            join_url(
                import_base_url,
                f"/api/research/runs/{quote(source_run_id, safe='')}/export",
            ),
            timeout_seconds,
        )
    )
    imported = _stage3_archive_snapshot(
        imported_package,
        source_run_id=source_run_id,
        review_id=created_review.ai_review_id,
        decision_ids=decision_ids,
    )
    if (
        imported["review"].record_hash != exported["review"].record_hash
        or [item.record_hash for item in imported["decisions"]]
        != [item.record_hash for item in exported["decisions"]]
    ):
        raise RuntimeError("Invalid Stage 3 research import: readback hashes do not match")
    canonical_sha256 = _quant_core_validator("canonical", "canonical_sha256")
    readback_hash = canonical_sha256(
        {
            "reviewRecordHash": imported["review"].record_hash,
            "decisionRecordHashes": [
                decision.record_hash for decision in imported["decisions"]
            ],
        }
    )
    assessment = created_review.record["deterministicAssessment"]
    external = created_review.record["externalAssessment"]
    return build_stage3_ai_review_manifest(
        source_run_id=source_run_id,
        primary_experiment_id=primary_experiment_id,
        comparison_experiment_ids=comparison_experiment_ids,
        strategy_lineage_key=created_review.record["strategyLineageKey"],
        evidence_hash=created_review.evidence_hash,
        review_record_hash=created_review.record_hash,
        deterministic_stance=assessment["stance"],
        deterministic_consistency=assessment["consistency"],
        external_provider=external["provider"],
        external_status=external["status"],
        request_count=request_count,
        decisions=[
            {
                "decisionId": decision.decision_id,
                "status": decision.status,
                "supersedesDecisionId": decision.supersedes_decision_id,
                "recordHash": decision.record_hash,
            }
            for decision in imported["decisions"]
        ],
        export_package_hash=exported["packageHash"],
        imported_package_hash=imported["packageHash"],
        readback_hash=readback_hash,
        artifact_counts=imported["artifactCounts"],
    )


def run_stage3_ai_review_acceptance(
    base_url: str,
    *,
    timeout_seconds: int,
    import_base_url: str | None = None,
    report_path: Path | None = None,
) -> list[str]:
    experiment = _stage3_experiment_manifest(base_url, timeout_seconds=timeout_seconds)
    manifest = _run_stage3_ai_review_flow(
        base_url=base_url,
        import_base_url=import_base_url or base_url,
        timeout_seconds=timeout_seconds,
        source_run_id=experiment["runId"],
        primary_experiment_id=experiment["experimentId"],
        comparison_experiment_ids=[experiment["replayExperimentId"]],
        provider="local",
        external_data_approved=False,
        request_count=0,
    )
    summary = validate_stage3_ai_review_manifest(manifest)
    summaries = [summary, "stage3 ai-review decision-conflict=passed archive-readback=passed"]
    for item in summaries:
        print(item)
    if report_path is not None:
        write_stage3_ai_review_report(report_path, manifest)
    return summaries


def run_stage3_ai_review_live_acceptance(
    base_url: str,
    *,
    timeout_seconds: int,
    provider: str,
    external_data_approved: bool,
    import_base_url: str | None = None,
    report_path: Path | None = None,
) -> dict[str, Any]:
    if provider != "openai-compatible" or external_data_approved is not True:
        raise RuntimeError(
            "Stage 3 live AI review requires provider=openai-compatible and explicit external evidence approval"
        )
    status_payload = _require_dict(
        request_json(join_url(base_url, "/api/ai-review/providers"), timeout_seconds),
        "Stage 3 AI review Provider status",
    )
    providers = status_payload.get("providers")
    status = next(
        (
            item
            for item in providers
            if isinstance(providers, list)
            and isinstance(item, dict)
            and item.get("providerId") == provider
        ),
        None,
    ) if isinstance(providers, list) else None
    if not isinstance(status, dict) or status.get("configured") is not True:
        raise RuntimeError("Stage 3 live AI review Provider is not configured; requestCount=0")
    experiment = _stage3_experiment_manifest(base_url, timeout_seconds=timeout_seconds)
    manifest = _run_stage3_ai_review_flow(
        base_url=base_url,
        import_base_url=import_base_url or base_url,
        timeout_seconds=timeout_seconds,
        source_run_id=experiment["runId"],
        primary_experiment_id=experiment["experimentId"],
        comparison_experiment_ids=[],
        provider=provider,
        external_data_approved=True,
        request_count=1,
    )
    print(validate_stage3_ai_review_manifest(manifest))
    if report_path is not None:
        write_stage3_ai_review_report(report_path, manifest)
    return manifest


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


def seed_p2_replay_portfolio_evidence(
    base_url: str,
    *,
    run_id: str,
    market: str,
    symbol: str,
    quantity: int,
    timeout_seconds: int,
) -> str:
    order_seed_payload = post_json(
        join_url(base_url, "/api/portfolio/paper-orders"),
        build_p2_replay_portfolio_order_payload(run_id, market, symbol, quantity=quantity),
        timeout_seconds=timeout_seconds,
    )
    batch_id, order_id = validate_p2_replay_portfolio_order_payload(order_seed_payload, run_id)

    approval_seed_payload = post_json(
        join_url(base_url, "/api/portfolio/paper-order-approvals"),
        build_p2_replay_portfolio_approval_payload(run_id, batch_id, order_id),
        timeout_seconds=timeout_seconds,
    )
    validate_p2_replay_portfolio_approval_payload(approval_seed_payload, order_id)

    simulation_seed_payload = post_json(
        join_url(base_url, "/api/portfolio/paper-order-simulations/batch"),
        build_p2_replay_portfolio_batch_simulation_payload(
            run_id,
            batch_id,
            order_id,
            market,
            symbol,
            quantity=quantity,
        ),
        timeout_seconds=timeout_seconds,
    )
    filled_count = validate_p2_replay_portfolio_batch_simulation_payload(simulation_seed_payload, order_id)
    return f"p1 p2-replay-seed run={run_id} batch={batch_id} filled={filled_count} liveBlocked=True"


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

    summaries.append(
        seed_p2_replay_portfolio_evidence(
            base_url,
            run_id=run_id,
            market=queued_market,
            symbol=queued_symbol,
            quantity=quantity,
            timeout_seconds=timeout_seconds,
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


def run_p2_readiness_acceptance(
    base_url: str,
    *,
    run_id: str,
    p1_acceptance_report: Path,
    p2_pre_live_acceptance_report: Path,
    p2_paper_replay_report: Path,
    report_path: Path | None = None,
    operator_runbook_audit_event_id: str | None = None,
) -> list[str]:
    p1_acceptance_manifest = load_p1_acceptance_report(p1_acceptance_report)
    p2_pre_live_acceptance_manifest = load_p2_pre_live_acceptance_report(p2_pre_live_acceptance_report)
    p2_paper_replay_manifest = load_p2_paper_replay_report(p2_paper_replay_report)

    validate_p1_acceptance_manifest(p1_acceptance_manifest)
    validate_p2_pre_live_acceptance_manifest(p2_pre_live_acceptance_manifest)
    validate_p2_paper_replay_manifest(p2_paper_replay_manifest)

    p1_run_id = _require_manifest_string(p1_acceptance_manifest, "runId", "P1 acceptance manifest")
    pre_live_run_id = _require_manifest_string(
        p2_pre_live_acceptance_manifest,
        "runId",
        "P2 pre-live acceptance manifest",
    )
    paper_replay_run_id = _require_manifest_string(p2_paper_replay_manifest, "runId", "P2 paper replay manifest")

    manifest = build_p2_readiness_acceptance_manifest(
        base_url=base_url,
        run_id=run_id,
        p1_acceptance_manifest=p1_acceptance_manifest,
        p1_acceptance_path=p1_acceptance_report,
        p2_pre_live_acceptance_manifest=p2_pre_live_acceptance_manifest,
        p2_pre_live_acceptance_path=p2_pre_live_acceptance_report,
        p2_paper_replay_manifest=p2_paper_replay_manifest,
        p2_paper_replay_path=p2_paper_replay_report,
        operator_runbook_audit_event_id=operator_runbook_audit_event_id,
    )
    readiness_summary = validate_p2_readiness_acceptance_manifest(manifest)
    summaries = [
        f"p2 readiness p1-acceptance run={p1_run_id} liveBlocked=True",
        f"p2 readiness paper-replay run={paper_replay_run_id} liveBlocked=True",
        f"p2 readiness pre-live run={pre_live_run_id} liveBlocked=True",
        readiness_summary,
    ]
    for summary in summaries:
        print(summary)
    if report_path is not None:
        write_p2_readiness_acceptance_report(report_path, manifest)
    return summaries


def run_p2_paper_replay(
    base_url: str,
    *,
    p1_acceptance_report: Path,
    report_path: Path | None = None,
    timeout_seconds: int,
    run_id: str | None = None,
    adapter_id: str | None = None,
) -> list[str]:
    p1_acceptance_manifest = load_p1_acceptance_report(p1_acceptance_report)
    validate_p2_chain_p1_acceptance_manifest(p1_acceptance_manifest)
    source_run_id = str(run_id or p1_acceptance_manifest.get("runId") or "").strip()
    if not source_run_id:
        raise RuntimeError("Invalid P2 paper replay smoke: source run id is missing")

    export_payload = request_json(join_url(base_url, f"/api/research/runs/{source_run_id}/export"), timeout_seconds)
    export_package = _p0_export_package_from_payload(export_payload)
    manifest = build_p2_paper_replay_manifest_from_export_package(
        export_package,
        base_url=base_url,
        adapter_id=adapter_id,
    )
    replay_summary = validate_p2_paper_replay_manifest(manifest)
    summaries = [replay_summary]
    for summary in summaries:
        print(summary)
    if report_path is not None:
        write_p2_paper_replay_report(report_path, manifest)
    return summaries


def run_p2_pre_live_acceptance(
    base_url: str,
    *,
    run_id: str,
    p1_acceptance_report: Path,
    p2_paper_replay_report: Path,
    report_path: Path | None = None,
    adapter_id: str | None = None,
) -> list[str]:
    p1_acceptance_manifest = load_p1_acceptance_report(p1_acceptance_report)
    p2_paper_replay_manifest = load_p2_paper_replay_report(p2_paper_replay_report)
    manifest = build_p2_pre_live_acceptance_manifest(
        p1_acceptance_manifest,
        p2_paper_replay_manifest,
        base_url=base_url,
        run_id=run_id,
        adapter_id=adapter_id,
    )
    pre_live_summary = validate_p2_pre_live_acceptance_manifest(manifest)
    summaries = [pre_live_summary]
    for summary in summaries:
        print(summary)
    if report_path is not None:
        write_p2_pre_live_acceptance_report(report_path, manifest)
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
    stage2_strategy_experiment: bool = False,
    stage2_strategy_experiment_report: Path | None = None,
    stage3_ai_review: bool = False,
    stage3_ai_review_report: Path | None = None,
    stage3_ai_review_import_base_url: str | None = None,
    stage3_ai_review_live_provider: str | None = None,
    stage3_ai_review_live_report: Path | None = None,
    stage4_portfolio_paper: bool = False,
    stage4_portfolio_paper_report: Path | None = None,
    approve_external_evidence: bool = False,
    p2_readiness_acceptance: bool = False,
    p2_run_id: str = "run-p2-readiness-smoke",
    p2_p1_acceptance_report: Path = Path("data") / "p1-acceptance.json",
    p2_pre_live_acceptance_report: Path = Path("data") / "p2-pre-live-acceptance.json",
    p2_paper_replay_report: Path = Path("data") / "p2-paper-replay.json",
    p2_readiness_acceptance_report: Path | None = None,
    p2_operator_runbook_audit_event_id: str | None = None,
    p2_paper_replay: bool = False,
    p2_paper_replay_run_id: str | None = None,
    p2_paper_replay_p1_acceptance_report: Path = Path("data") / "p1-acceptance.json",
    p2_paper_replay_adapter_id: str | None = None,
    p2_pre_live_acceptance: bool = False,
    p2_pre_live_run_id: str = "run-p2-pre-live-smoke",
    p2_pre_live_p1_acceptance_report: Path = Path("data") / "p1-acceptance.json",
    p2_pre_live_paper_replay_report: Path = Path("data") / "p2-paper-replay.json",
    p2_pre_live_adapter_id: str | None = None,
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
        if stage2_strategy_experiment:
            run_stage2_strategy_experiment_acceptance(
                base_url,
                timeout_seconds=timeout_seconds,
                report_path=stage2_strategy_experiment_report,
            )
        if stage3_ai_review:
            run_stage3_ai_review_acceptance(
                base_url,
                timeout_seconds=timeout_seconds,
                import_base_url=stage3_ai_review_import_base_url,
                report_path=stage3_ai_review_report,
            )
        if stage3_ai_review_live_provider:
            run_stage3_ai_review_live_acceptance(
                base_url,
                timeout_seconds=timeout_seconds,
                provider=stage3_ai_review_live_provider,
                external_data_approved=approve_external_evidence,
                import_base_url=stage3_ai_review_import_base_url,
                report_path=stage3_ai_review_live_report,
            )
        if stage4_portfolio_paper:
            run_stage4_portfolio_acceptance(
                base_url,
                timeout_seconds=timeout_seconds,
                report_path=stage4_portfolio_paper_report,
            )
        if p2_paper_replay:
            run_p2_paper_replay(
                base_url,
                p1_acceptance_report=p2_paper_replay_p1_acceptance_report,
                report_path=p2_paper_replay_report,
                timeout_seconds=timeout_seconds,
                run_id=p2_paper_replay_run_id,
                adapter_id=p2_paper_replay_adapter_id,
            )
        if p2_pre_live_acceptance:
            run_p2_pre_live_acceptance(
                base_url,
                run_id=p2_pre_live_run_id,
                p1_acceptance_report=p2_pre_live_p1_acceptance_report,
                p2_paper_replay_report=p2_pre_live_paper_replay_report,
                report_path=p2_pre_live_acceptance_report,
                adapter_id=p2_pre_live_adapter_id,
            )
        if p2_readiness_acceptance:
            run_p2_readiness_acceptance(
                base_url,
                run_id=p2_run_id,
                p1_acceptance_report=p2_p1_acceptance_report,
                p2_pre_live_acceptance_report=p2_pre_live_acceptance_report,
                p2_paper_replay_report=p2_paper_replay_report,
                report_path=p2_readiness_acceptance_report,
                operator_runbook_audit_event_id=p2_operator_runbook_audit_event_id,
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
    parser.add_argument(
        "--stage2-strategy-experiment",
        action="store_true",
        help="Run a fresh P0 v2 strategy experiment and exact replay acceptance smoke.",
    )
    parser.add_argument(
        "--stage2-strategy-experiment-report",
        default=None,
        help="Optional path for a JSON Stage 2 strategy experiment acceptance manifest.",
    )
    parser.add_argument(
        "--validate-stage2-strategy-experiment-report",
        default=None,
        help="Validate an existing Stage 2 strategy experiment acceptance manifest and exit.",
    )
    parser.add_argument(
        "--stage3-ai-review",
        action="store_true",
        help="Run deterministic local Stage 3 AI review acceptance.",
    )
    parser.add_argument(
        "--stage3-ai-review-report",
        default=None,
        help="Optional path for a JSON Stage 3 AI review acceptance manifest.",
    )
    parser.add_argument(
        "--validate-stage3-ai-review-report",
        default=None,
        help="Validate an existing Stage 3 AI review acceptance manifest and exit.",
    )
    parser.add_argument(
        "--stage3-ai-review-import-base-url",
        default=None,
        help="Optional isolated API URL used for Stage 3 archive import and readback.",
    )
    parser.add_argument(
        "--stage3-ai-review-live-provider",
        default=None,
        help="Explicit external Provider for a live Stage 3 evidence request.",
    )
    parser.add_argument(
        "--stage3-ai-review-live-report",
        default=None,
        help="Optional path for a redacted live Stage 3 AI review acceptance manifest.",
    )
    parser.add_argument(
        "--approve-external-evidence",
        action="store_true",
        help="Explicitly approve the single external Stage 3 evidence request.",
    )
    parser.add_argument(
        "--stage4-portfolio-paper",
        action="store_true",
        help="Run the Stage 4 portfolio paper golden-path acceptance smoke.",
    )
    parser.add_argument(
        "--stage4-portfolio-paper-report",
        default=None,
        help="Optional path for a JSON Stage 4 portfolio paper acceptance manifest.",
    )
    parser.add_argument(
        "--validate-stage4-portfolio-paper-report",
        default=None,
        help="Validate an existing Stage 4 portfolio paper acceptance manifest and exit.",
    )
    parser.add_argument("--p2-readiness-acceptance", action="store_true", help="Aggregate P1/P2 evidence into a P2 readiness acceptance manifest.")
    parser.add_argument("--p2-run-id", default="run-p2-readiness-smoke", help="P2 readiness acceptance run id.")
    parser.add_argument("--p2-p1-acceptance-report", default="data/p1-acceptance.json", help="Path to the P1 acceptance manifest used as P2 evidence.")
    parser.add_argument(
        "--p2-pre-live-acceptance-report",
        default="data/p2-pre-live-acceptance.json",
        help="Path to the P2 pre-live acceptance manifest used as P2 evidence.",
    )
    parser.add_argument(
        "--p2-paper-replay-report",
        default="data/p2-paper-replay.json",
        help="Path to the P2 paper replay manifest used as P2 evidence.",
    )
    parser.add_argument(
        "--p2-paper-replay",
        action="store_true",
        help="Generate a P2 paper replay manifest from an exported audited run package.",
    )
    parser.add_argument(
        "--p2-paper-replay-run-id",
        default=None,
        help="Optional audited run id for P2 paper replay generation; defaults to the P1 acceptance run id.",
    )
    parser.add_argument(
        "--p2-paper-replay-p1-acceptance-report",
        default="data/p1-acceptance.json",
        help="Path to the P1 acceptance manifest used to infer the P2 paper replay source run.",
    )
    parser.add_argument(
        "--p2-paper-replay-adapter-id",
        default=None,
        help="Optional adapter id override for the generated P2 paper replay manifest.",
    )
    parser.add_argument(
        "--p2-pre-live-acceptance",
        action="store_true",
        help="Generate a P2 pre-live acceptance manifest from P1 acceptance and P2 paper replay evidence.",
    )
    parser.add_argument("--p2-pre-live-run-id", default="run-p2-pre-live-smoke", help="P2 pre-live acceptance run id.")
    parser.add_argument(
        "--p2-pre-live-p1-acceptance-report",
        default="data/p1-acceptance.json",
        help="Path to the P1 acceptance manifest used to generate P2 pre-live evidence.",
    )
    parser.add_argument(
        "--p2-pre-live-paper-replay-report",
        default="data/p2-paper-replay.json",
        help="Path to the P2 paper replay manifest used to generate P2 pre-live evidence.",
    )
    parser.add_argument(
        "--p2-pre-live-adapter-id",
        default=None,
        help="Optional adapter id override for the generated P2 pre-live acceptance manifest.",
    )
    parser.add_argument(
        "--p2-readiness-acceptance-report",
        default=None,
        help="Optional path for a JSON P2 readiness acceptance manifest.",
    )
    parser.add_argument(
        "--p2-operator-runbook-audit-event-id",
        default=None,
        help="Optional operator runbook audit event id to bind into the P2 readiness manifest.",
    )
    parser.add_argument(
        "--validate-p2-readiness-acceptance-report",
        default=None,
        help="Validate an existing P2 readiness acceptance manifest and exit.",
    )
    parser.add_argument(
        "--validate-p2-paper-replay-report",
        default=None,
        help="Validate an existing P2 paper replay manifest and exit.",
    )
    parser.add_argument(
        "--validate-p2-pre-live-acceptance-report",
        default=None,
        help="Validate an existing P2 pre-live acceptance manifest and exit.",
    )
    parser.add_argument(
        "--p2-chain-preflight-report",
        default=None,
        help="Write an offline P2 manifest chain preflight report and exit.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    live_requested = args.stage3_ai_review_live_provider is not None
    if live_requested != args.approve_external_evidence:
        raise RuntimeError(
            "Stage 3 live AI review requires both --stage3-ai-review-live-provider "
            "and --approve-external-evidence; requestCount=0"
        )
    if live_requested and (
        args.stage3_ai_review_live_provider != "openai-compatible"
        or args.stage3_ai_review
    ):
        raise RuntimeError(
            "Stage 3 live AI review only permits provider=openai-compatible and cannot run with local mode; requestCount=0"
        )
    if args.validate_p0_acceptance_report:
        manifest = load_p0_acceptance_report(Path(args.validate_p0_acceptance_report))
        print(validate_p0_acceptance_manifest(manifest))
        return 0
    if args.validate_p1_acceptance_report:
        manifest = load_p1_acceptance_report(Path(args.validate_p1_acceptance_report))
        print(validate_p1_acceptance_manifest(manifest))
        return 0
    if args.validate_stage2_strategy_experiment_report:
        manifest = load_stage2_strategy_experiment_report(Path(args.validate_stage2_strategy_experiment_report))
        print(validate_stage2_strategy_experiment_manifest(manifest))
        return 0
    if args.validate_stage3_ai_review_report:
        manifest = load_stage3_ai_review_report(Path(args.validate_stage3_ai_review_report))
        print(validate_stage3_ai_review_manifest(manifest))
        return 0
    if args.validate_stage4_portfolio_paper_report:
        manifest = load_stage4_portfolio_acceptance_report(Path(args.validate_stage4_portfolio_paper_report))
        print(validate_stage4_portfolio_acceptance_manifest(manifest))
        return 0
    if args.validate_p2_paper_replay_report:
        manifest = load_p2_paper_replay_report(Path(args.validate_p2_paper_replay_report))
        print(validate_p2_paper_replay_manifest(manifest))
        return 0
    if args.validate_p2_pre_live_acceptance_report:
        manifest = load_p2_pre_live_acceptance_report(Path(args.validate_p2_pre_live_acceptance_report))
        print(validate_p2_pre_live_acceptance_manifest(manifest))
        return 0
    if args.validate_p2_readiness_acceptance_report:
        manifest = load_p2_readiness_acceptance_report(Path(args.validate_p2_readiness_acceptance_report))
        print(validate_p2_readiness_acceptance_manifest(manifest))
        return 0
    if args.p2_chain_preflight_report:
        preflight = build_p2_manifest_chain_preflight(
            p1_acceptance_report=Path(args.p2_p1_acceptance_report),
            p2_paper_replay_report=Path(args.p2_paper_replay_report),
            p2_pre_live_acceptance_report=Path(args.p2_pre_live_acceptance_report),
            p2_readiness_acceptance_report=(
                Path(args.p2_readiness_acceptance_report)
                if args.p2_readiness_acceptance_report
                else Path("data") / "p2-readiness-acceptance.json"
            ),
        )
        print(validate_p2_manifest_chain_preflight(preflight))
        write_p2_manifest_chain_preflight(Path(args.p2_chain_preflight_report), preflight)
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
        stage2_strategy_experiment=args.stage2_strategy_experiment,
        stage2_strategy_experiment_report=(
            Path(args.stage2_strategy_experiment_report) if args.stage2_strategy_experiment_report else None
        ),
        stage3_ai_review=args.stage3_ai_review,
        stage3_ai_review_report=(
            Path(args.stage3_ai_review_report) if args.stage3_ai_review_report else None
        ),
        stage3_ai_review_import_base_url=args.stage3_ai_review_import_base_url,
        stage3_ai_review_live_provider=args.stage3_ai_review_live_provider,
        stage3_ai_review_live_report=(
            Path(args.stage3_ai_review_live_report)
            if args.stage3_ai_review_live_report
            else None
        ),
        approve_external_evidence=args.approve_external_evidence,
        stage4_portfolio_paper=args.stage4_portfolio_paper,
        stage4_portfolio_paper_report=(
            Path(args.stage4_portfolio_paper_report) if args.stage4_portfolio_paper_report else None
        ),
        p2_readiness_acceptance=args.p2_readiness_acceptance,
        p2_run_id=args.p2_run_id,
        p2_p1_acceptance_report=Path(args.p2_p1_acceptance_report),
        p2_pre_live_acceptance_report=Path(args.p2_pre_live_acceptance_report),
        p2_paper_replay_report=Path(args.p2_paper_replay_report),
        p2_readiness_acceptance_report=(
            Path(args.p2_readiness_acceptance_report) if args.p2_readiness_acceptance_report else None
        ),
        p2_operator_runbook_audit_event_id=args.p2_operator_runbook_audit_event_id,
        p2_paper_replay=args.p2_paper_replay,
        p2_paper_replay_run_id=args.p2_paper_replay_run_id,
        p2_paper_replay_p1_acceptance_report=Path(args.p2_paper_replay_p1_acceptance_report),
        p2_paper_replay_adapter_id=args.p2_paper_replay_adapter_id,
        p2_pre_live_acceptance=args.p2_pre_live_acceptance,
        p2_pre_live_run_id=args.p2_pre_live_run_id,
        p2_pre_live_p1_acceptance_report=Path(args.p2_pre_live_p1_acceptance_report),
        p2_pre_live_paper_replay_report=Path(args.p2_pre_live_paper_replay_report),
        p2_pre_live_adapter_id=args.p2_pre_live_adapter_id,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
