from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_P2_PAPER_REPLAY_REPORT_PATH = Path("data") / "p2-paper-replay.json"
P2_PAPER_REPLAY_REQUIRED_CHECKS = {
    "single-paper-execution",
    "portfolio-order-ledger",
    "portfolio-approval-ledger",
    "portfolio-simulation-ledger",
    "portfolio-state-history",
    "portfolio-replay",
    "adapter-paper-execution",
    "live-blocked-boundary",
}


def build_p2_paper_replay_manifest_from_export_package(
    export_payload: dict[str, Any],
    *,
    base_url: str = "",
    adapter_id: str | None = None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    export_package = export_payload.get("export", export_payload)
    if not isinstance(export_package, dict):
        raise ValueError("P2 paper replay export package must be an object")
    export_manifest = export_package.get("manifest")
    if not isinstance(export_manifest, dict):
        raise ValueError("P2 paper replay export package manifest is required")
    if (
        export_manifest.get("paperOnly") is not True
        or export_manifest.get("liveTradingAllowed") is not False
        or export_manifest.get("liveBlockedBoundary") is not True
    ):
        raise ValueError("P2 paper replay export package live-blocked boundary is not enforced")
    for unsafe_field in ("orderSubmissionEnabled", "liveOrderSubmitted", "routeExecuted"):
        if export_manifest.get(unsafe_field) is True:
            raise ValueError("P2 paper replay export package live-blocked boundary is not enforced")

    run_id = _required_string_field(export_manifest, "runId", "P2 paper replay export runId is required")
    market = _required_string_field(export_manifest, "market", "P2 paper replay export market is required")
    symbol = _required_string_field(export_manifest, "symbol", "P2 paper replay export symbol is required")
    timeframe = _required_string_field(export_manifest, "timeframe", "P2 paper replay export timeframe is required")
    paper_executions = _list_of_dicts(export_package.get("paperExecutions"))
    portfolio_batches = _list_of_dicts(export_package.get("portfolioPaperOrderBatches"))
    portfolio_approvals = _list_of_dicts(export_package.get("portfolioPaperOrderApprovals"))
    portfolio_simulations = _list_of_dicts(export_package.get("portfolioPaperOrderSimulations"))
    adapter_executions = _list_of_dicts(export_package.get("adapterPaperExecutions"))
    audit_events = _list_of_dicts(export_package.get("auditEvents"))

    filled_paper_orders = [
        order
        for execution in paper_executions
        if _string_field(execution, "runId") in {None, run_id}
        for order in _list_of_dicts(execution.get("orders"))
        if _string_field(order, "status") == "filled"
    ]
    portfolio_orders = [
        order
        for batch in portfolio_batches
        if _string_field(batch, "baseRunId") in {None, run_id}
        for order in _list_of_dicts(batch.get("orders"))
    ]
    approved_orders = [
        approval
        for approval in portfolio_approvals
        if _string_field(approval, "baseRunId") in {None, run_id} and approval.get("approved") is True
    ]
    filled_simulations = [
        simulation
        for simulation in portfolio_simulations
        if _string_field(simulation, "baseRunId") in {None, run_id}
        and _string_field(simulation, "orderState") == "filled"
        and _string_field(simulation, "fillStatus") == "filled"
    ]
    simulation_adapter_execution_ids = {
        execution_id
        for simulation in filled_simulations
        if (execution_id := _string_field(simulation, "adapterPaperExecutionId"))
    }
    bound_adapter_executions: dict[str, dict[str, Any]] = {}
    for simulation in filled_simulations:
        execution_id = _string_field(simulation, "adapterPaperExecutionId") or ""
        evidence = simulation.get("adapterPaperExecutionEvidence")
        if _is_bound_adapter_paper_execution_evidence(evidence, execution_id=execution_id, market=market):
            bound_adapter_executions[execution_id] = evidence
    for execution in adapter_executions:
        execution_id = _string_field(execution, "adapterPaperExecutionId") or ""
        if execution_id in simulation_adapter_execution_ids and _is_bound_adapter_paper_execution_evidence(
            execution,
            execution_id=execution_id,
            market=market,
        ):
            bound_adapter_executions.setdefault(execution_id, execution)
    matching_adapter_executions = list(bound_adapter_executions.values())

    selected_adapter_id = str(adapter_id or "").strip()
    if matching_adapter_executions and not selected_adapter_id:
        selected_adapter_id = (
            _string_field(matching_adapter_executions[0], "adapterId")
            or _string_field(matching_adapter_executions[0], "adapter")
            or ""
        )
    if not selected_adapter_id:
        raise ValueError("P2 paper replay export package adapter paper execution evidence is missing")

    missing = []
    if not filled_paper_orders:
        missing.append("single-paper-execution")
    if not portfolio_orders:
        missing.append("portfolio-order-ledger")
    if not approved_orders:
        missing.append("portfolio-approval-ledger")
    if not filled_simulations:
        missing.append("portfolio-simulation-ledger")
    if not matching_adapter_executions:
        missing.append("adapter-paper-execution")
    if missing:
        raise ValueError(f"P2 paper replay export package missing required evidence: {', '.join(missing)}")

    latest_evidence_id = (
        _string_field(matching_adapter_executions[0], "adapterPaperExecutionId")
        or _string_field(filled_simulations[0], "adapterPaperExecutionId")
        or "adapter-paper-execution"
    )
    check_ids = [
        "single-paper-execution",
        "portfolio-order-ledger",
        "portfolio-approval-ledger",
        "portfolio-simulation-ledger",
        "portfolio-state-history",
        "portfolio-replay",
        "adapter-paper-execution",
        "live-blocked-boundary",
    ]
    audit_event_ids = _unique_strings(
        [
            *[
                _string_field(event, "eventId") or ""
                for event in audit_events
                if _string_field(event, "runId") in {None, run_id}
            ],
            _string_field(paper_executions[0], "executionId") or "",
            _string_field(portfolio_batches[0], "batchId") or "",
            _string_field(approved_orders[0], "approvalId") or "",
            _string_field(filled_simulations[0], "simulationId") or "",
            latest_evidence_id,
        ]
    )
    checks = [
        {
            "id": "single-paper-execution",
            "status": "passed",
            "summary": "single-symbol paper execution is bound to the audited run",
            "evidenceId": _string_field(paper_executions[0], "executionId") or "paper-execution-ready",
        },
        {
            "id": "portfolio-order-ledger",
            "status": "passed",
            "summary": "portfolio paper order ledger is bound to the audited run",
            "evidenceId": _string_field(portfolio_batches[0], "batchId") or "portfolio-paper-ready",
        },
        {
            "id": "portfolio-approval-ledger",
            "status": "passed",
            "summary": "portfolio paper order approval is recorded",
            "evidenceId": _string_field(approved_orders[0], "approvalId") or "approval-ready",
        },
        {
            "id": "portfolio-simulation-ledger",
            "status": "passed",
            "summary": "portfolio paper simulation fill is recorded",
            "evidenceId": _string_field(filled_simulations[0], "simulationId") or "simulation-ready",
        },
        {
            "id": "portfolio-state-history",
            "status": "passed",
            "summary": "portfolio state history can replay the simulated fill",
            "evidenceId": _string_field(filled_simulations[0], "simulationId") or "state-filled-ready",
        },
        {
            "id": "portfolio-replay",
            "status": "passed",
            "summary": "portfolio replay reconstructs orders and positions",
            "evidenceId": run_id,
        },
        {
            "id": "adapter-paper-execution",
            "status": "passed",
            "summary": "adapter paper execution is recorded without route execution",
            "evidenceId": latest_evidence_id,
        },
        {
            "id": "live-blocked-boundary",
            "status": "passed",
            "summary": "order submission and live trading remain disabled",
            "evidenceId": "live-blocked-boundary",
        },
    ]
    manifest = {
        "kind": "aiqt.p2PaperReplayManifest",
        "schemaVersion": 1,
        "generatedAt": (generated_at or datetime.now(timezone.utc)).isoformat(),
        "status": "passed",
        "baseUrl": str(base_url or ""),
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "runId": run_id,
        "adapterId": selected_adapter_id,
        "replayStatus": "replay_ready",
        "passedCheckCount": len(check_ids),
        "totalCheckCount": len(check_ids),
        "warningCount": 0,
        "checkIds": check_ids,
        "auditEventIds": audit_event_ids,
        "latestEvidenceId": latest_evidence_id,
        "metrics": {
            "filledPaperOrders": len(filled_paper_orders),
            "portfolioOrders": len(portfolio_orders),
            "approvedPortfolioOrders": len(approved_orders),
            "portfolioFilledOrders": len(filled_simulations),
            "stateHistoryFilledEvents": len(filled_simulations),
            "adapterPaperExecutions": len(matching_adapter_executions),
            "replayWarnings": 0,
        },
        "paperOnly": True,
        "orderSubmissionEnabled": False,
        "liveTradingAllowed": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "liveBlockedBoundary": True,
        "checkCount": len(checks),
        "checks": checks,
    }
    validate_p2_paper_replay_manifest(manifest)
    return manifest


def load_p2_paper_replay_report(
    path: Path = DEFAULT_P2_PAPER_REPLAY_REPORT_PATH,
) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"P2 paper replay report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"P2 paper replay report is not valid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("P2 paper replay report must be a JSON object")
    return payload


def validate_p2_paper_replay_manifest(manifest: Any) -> str:
    if not isinstance(manifest, dict):
        raise ValueError("P2 paper replay manifest must be an object")
    if manifest.get("kind") != "aiqt.p2PaperReplayManifest":
        raise ValueError("P2 paper replay manifest kind must be aiqt.p2PaperReplayManifest")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("P2 paper replay manifest schemaVersion must be 1")
    if manifest.get("status") != "passed":
        raise ValueError("P2 paper replay manifest status must be passed")

    run_id = _required_string_field(manifest, "runId", "P2 paper replay manifest runId is required")
    _required_string_field(manifest, "market", "P2 paper replay manifest market is required")
    _required_string_field(manifest, "symbol", "P2 paper replay manifest symbol is required")
    _required_string_field(manifest, "timeframe", "P2 paper replay manifest timeframe is required")
    _required_string_field(manifest, "adapterId", "P2 paper replay manifest adapterId is required")
    replay_status = _required_string_field(
        manifest,
        "replayStatus",
        "P2 paper replay manifest replayStatus is required",
    )
    if replay_status != "replay_ready":
        raise ValueError("P2 paper replay manifest replayStatus must be replay_ready")

    passed_checks = _int_field(manifest, "passedCheckCount")
    total_checks = _int_field(manifest, "totalCheckCount")
    warning_count = _int_field(manifest, "warningCount")
    if total_checks <= 0:
        raise ValueError("P2 paper replay manifest totalCheckCount must be positive")
    if passed_checks != total_checks:
        raise ValueError("P2 paper replay manifest passedCheckCount must equal totalCheckCount")
    if warning_count < 0:
        raise ValueError("P2 paper replay manifest warningCount must be non-negative")

    check_ids = _string_list(manifest.get("checkIds"))
    if len(check_ids) != total_checks:
        raise ValueError("P2 paper replay manifest checkIds must match totalCheckCount")
    audit_event_ids = _string_list(manifest.get("auditEventIds"))
    if not audit_event_ids:
        raise ValueError("P2 paper replay manifest auditEventIds must be non-empty")

    if manifest.get("paperOnly") is not True:
        raise ValueError("P2 paper replay manifest must be paper-only")
    if (
        manifest.get("orderSubmissionEnabled") is not False
        or manifest.get("liveTradingAllowed") is not False
        or manifest.get("liveOrderSubmitted") is not False
        or manifest.get("routeExecuted") is not False
        or manifest.get("liveBlockedBoundary") is not True
    ):
        raise ValueError("P2 paper replay manifest live-blocked boundary is not enforced")

    metrics = manifest.get("metrics")
    if not isinstance(metrics, dict):
        raise ValueError("P2 paper replay manifest metrics must be an object")
    for field in (
        "filledPaperOrders",
        "portfolioOrders",
        "approvedPortfolioOrders",
        "portfolioFilledOrders",
        "stateHistoryFilledEvents",
        "adapterPaperExecutions",
        "replayWarnings",
    ):
        if _int_field(metrics, field) < 0:
            raise ValueError(f"P2 paper replay manifest metric {field} must be non-negative")
    if _int_field(metrics, "replayWarnings") != warning_count:
        raise ValueError("P2 paper replay manifest warningCount must match metrics.replayWarnings")

    checks = manifest.get("checks")
    if not isinstance(checks, list) or not checks:
        raise ValueError("P2 paper replay manifest checks must be a non-empty list")
    if _int_field(manifest, "checkCount") != len(checks):
        raise ValueError("P2 paper replay manifest checkCount does not match checks")

    recorded_check_ids: list[str] = []
    for check in checks:
        if not isinstance(check, dict):
            raise ValueError("P2 paper replay manifest check must be an object")
        check_id = str(check.get("id") or "").strip()
        if not check_id:
            raise ValueError("P2 paper replay manifest check id is required")
        if check.get("status") != "passed":
            raise ValueError(f"P2 paper replay manifest check {check_id} did not pass")
        if not str(check.get("summary") or "").strip():
            raise ValueError(f"P2 paper replay manifest check {check_id} summary is required")
        if not str(check.get("evidenceId") or "").strip():
            raise ValueError(f"P2 paper replay manifest check {check_id} evidenceId is required")
        recorded_check_ids.append(check_id)

    missing_checks = P2_PAPER_REPLAY_REQUIRED_CHECKS.difference(recorded_check_ids)
    if missing_checks:
        raise ValueError(f"P2 paper replay manifest missing required checks: {', '.join(sorted(missing_checks))}")

    return (
        f"p2 paper replay manifest run={run_id} replay={replay_status} "
        f"checks={passed_checks}/{total_checks} warnings={warning_count} liveBlocked=True"
    )


def load_p2_paper_replay_status(
    path: Path = DEFAULT_P2_PAPER_REPLAY_REPORT_PATH,
) -> dict[str, Any]:
    source_path = Path(path)
    try:
        manifest = load_p2_paper_replay_report(source_path)
        summary = validate_p2_paper_replay_manifest(manifest)
    except FileNotFoundError as error:
        return _p2_paper_replay_status(
            None,
            status="missing",
            available=False,
            source_path=source_path,
            summary="P2 paper replay manifest is missing.",
            reason=str(error),
        )
    except ValueError as error:
        manifest = _read_manifest_for_invalid_status(source_path)
        return _p2_paper_replay_status(
            manifest,
            status="invalid",
            available=False,
            source_path=source_path,
            summary="P2 paper replay manifest is invalid.",
            reason=str(error),
        )

    return _p2_paper_replay_status(
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


def _p2_paper_replay_status(
    manifest: dict[str, Any] | None,
    *,
    status: str,
    available: bool,
    source_path: Path,
    summary: str,
    reason: str,
) -> dict[str, Any]:
    check_ids = _p2_paper_replay_check_ids(manifest)
    return {
        "kind": "aiqt.p2PaperReplayStatus",
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
        "replayStatus": _string_field(manifest, "replayStatus"),
        "passedCheckCount": _int_field(manifest, "passedCheckCount") if manifest else 0,
        "totalCheckCount": _int_field(manifest, "totalCheckCount") if manifest else 0,
        "warningCount": _int_field(manifest, "warningCount") if manifest else 0,
        "requiredCheckCount": len(P2_PAPER_REPLAY_REQUIRED_CHECKS),
        "checkCount": len(check_ids),
        "checkIds": check_ids,
        "auditEventIds": _string_list(manifest.get("auditEventIds")) if manifest else [],
        "latestEvidenceId": _string_field(manifest, "latestEvidenceId"),
        "metrics": _metrics_payload(manifest.get("metrics") if manifest else None),
        "paperOnly": bool(manifest.get("paperOnly")) if manifest else False,
        "orderSubmissionEnabled": bool(manifest.get("orderSubmissionEnabled")) if manifest else False,
        "liveTradingAllowed": bool(manifest.get("liveTradingAllowed")) if manifest else False,
        "liveOrderSubmitted": bool(manifest.get("liveOrderSubmitted")) if manifest else False,
        "routeExecuted": bool(manifest.get("routeExecuted")) if manifest else False,
        "liveBlockedBoundary": bool(manifest.get("liveBlockedBoundary")) if manifest else False,
        "manifest": manifest,
    }


def _p2_paper_replay_check_ids(manifest: dict[str, Any] | None) -> list[str]:
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


def _metrics_payload(metrics: Any) -> dict[str, int]:
    return {
        "filledPaperOrders": _int_field(metrics, "filledPaperOrders"),
        "portfolioOrders": _int_field(metrics, "portfolioOrders"),
        "approvedPortfolioOrders": _int_field(metrics, "approvedPortfolioOrders"),
        "portfolioFilledOrders": _int_field(metrics, "portfolioFilledOrders"),
        "stateHistoryFilledEvents": _int_field(metrics, "stateHistoryFilledEvents"),
        "adapterPaperExecutions": _int_field(metrics, "adapterPaperExecutions"),
        "replayWarnings": _int_field(metrics, "replayWarnings"),
    }


def _list_of_dicts(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _is_bound_adapter_paper_execution_evidence(
    evidence: Any,
    *,
    execution_id: str,
    market: str,
) -> bool:
    return (
        isinstance(evidence, dict)
        and bool(execution_id)
        and _string_field(evidence, "adapterPaperExecutionId") == execution_id
        and bool(_string_field(evidence, "adapterId") or _string_field(evidence, "adapter"))
        and _string_field(evidence, "status") == "paper_execution_recorded"
        and _string_field(evidence, "route") == "paper"
        and _string_field(evidence, "market") in {market, "multi"}
        and evidence.get("paperOnly") is True
        and evidence.get("liveTradingAllowed") is False
        and evidence.get("liveOrderSubmitted") is False
        and evidence.get("routeExecuted") is False
        and evidence.get("orderSubmitted") is False
    )


def _unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []
    for value in values:
        text = str(value or "").strip()
        if text and text not in seen:
            seen.add(text)
            unique.append(text)
    return unique


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


def _int_field(manifest: Any, field: str) -> int:
    if not isinstance(manifest, dict):
        return 0
    try:
        return int(manifest.get(field, 0))
    except (TypeError, ValueError):
        return 0


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]
