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
    expected = {
        "baseStrategy": strategy,
        "strategyRevision": strategy_revision,
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
    definition_keys = {*expected, "sourceRunId", "snapshotId"}
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
        if experiment["sourceRunId"] != run_id:
            raise RuntimeError("Invalid Stage 2 strategy experiment: fresh source run binding does not match")
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
    for pair_id in (experiment_id, replay_experiment_id):
        _require_stage2_experiment_binding(
            history_by_id[pair_id],
            experiment,
            "Stage 2 strategy experiment history response",
        )
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
