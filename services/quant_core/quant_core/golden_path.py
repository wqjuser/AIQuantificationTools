from __future__ import annotations

from datetime import datetime
from typing import Any

from quant_core.execution import PaperExecutionRecord, validate_paper_execution_handoff


GoldenPathPayload = dict[str, Any]


def build_golden_path_status(
    *,
    market: str,
    symbol: str,
    timeframe: str,
    settings: dict[str, Any],
    runs: list[Any],
    paper_executions: list[PaperExecutionRecord],
) -> GoldenPathPayload:
    context_runs = _matching_runs(runs, market=market, symbol=symbol, timeframe=timeframe)
    latest_run = context_runs[0] if context_runs else None
    cache_context = _matching_cache_context(settings, market=market, symbol=symbol, timeframe=timeframe)

    market_step = _market_data_step(cache_context)
    research_step = _research_run_step(latest_run)
    backtest_step = _backtest_report_step(latest_run)
    ai_step = _ai_review_step(latest_run)
    paper_step = _paper_execution_step(latest_run, paper_executions)
    live_step = _live_gate_step(settings)
    steps = [market_step, research_step, backtest_step, ai_step, paper_step, live_step]

    current_step = next((step for step in steps if not step["passed"]), None)
    return {
        "schemaVersion": 1,
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "status": _overall_status(current_step),
        "currentStepId": current_step["id"] if current_step else None,
        "latestRunId": str(getattr(latest_run, "run_id", "")) if latest_run else None,
        "nextAction": _next_action(current_step),
        "summary": _summary_from_steps(steps, current_step, settings),
        "runbook": _runbook_from_steps(steps, current_step),
        "workspaces": _workspaces_from_steps(steps, current_step),
        "steps": steps,
    }


def _matching_runs(runs: list[Any], *, market: str, symbol: str, timeframe: str) -> list[Any]:
    matches = [
        run
        for run in runs
        if str(getattr(run, "market", "")) == market
        and str(getattr(run, "symbol", "")) == symbol
        and str(getattr(run, "timeframe", "")) == timeframe
    ]
    return sorted(matches, key=_created_at_sort_key, reverse=True)


def _created_at_sort_key(run: Any) -> datetime:
    created_at = getattr(run, "created_at", None)
    if isinstance(created_at, datetime):
        return created_at
    return datetime.min


def _matching_cache_context(settings: dict[str, Any], *, market: str, symbol: str, timeframe: str) -> dict[str, Any] | None:
    cache = settings.get("cache") if isinstance(settings, dict) else None
    contexts = cache.get("contexts") if isinstance(cache, dict) else None
    if not isinstance(contexts, list):
        return None
    for context in contexts:
        if not isinstance(context, dict):
            continue
        if (
            str(context.get("market") or "") == market
            and str(context.get("symbol") or "") == symbol
            and str(context.get("timeframe") or "") == timeframe
        ):
            return context
    return None


def _market_data_step(cache_context: dict[str, Any] | None) -> GoldenPathPayload:
    if not cache_context:
        return _step(
            "market-data",
            "Market data",
            "blocked",
            "No cached K-line context exists for the selected instrument.",
            "refresh-data",
        )
    row_count = _positive_int(cache_context.get("rowCount"))
    freshness = str(cache_context.get("freshness") or "empty")
    if row_count <= 0 or freshness == "empty":
        return _step(
            "market-data",
            "Market data",
            "blocked",
            "The selected context has no usable cached K-line rows.",
            "refresh-data",
        )
    if freshness == "stale":
        return _step(
            "market-data",
            "Market data",
            "review",
            f"{row_count} cached rows exist, but the context is stale.",
            "refresh-data",
        )
    return _step("market-data", "Market data", "passed", f"{row_count} fresh cached K-line rows are available.")


def _research_run_step(latest_run: Any | None) -> GoldenPathPayload:
    if not latest_run:
        return _step(
            "research-run",
            "Audited research run",
            "blocked",
            "Run the research pipeline to bind data, strategy, backtest, and AI evidence.",
            "run-pipeline",
        )
    return _step(
        "research-run",
        "Audited research run",
        "passed",
        f"Audit run {getattr(latest_run, 'run_id', '')} is bound to this context.",
    )


def _backtest_report_step(latest_run: Any | None) -> GoldenPathPayload:
    if not latest_run:
        return _step(
            "backtest-report",
            "Backtest report",
            "blocked",
            "Backtest evidence is unavailable until an audited research run exists.",
            "run-pipeline",
        )
    if _positive_int(getattr(latest_run, "data_rows", 0)) <= 0:
        return _step(
            "backtest-report",
            "Backtest report",
            "blocked",
            "The latest audited run has no market data rows.",
            "run-pipeline",
        )
    if not getattr(latest_run, "backtest_equity_curve", []) and not isinstance(getattr(latest_run, "metrics", None), dict):
        return _step(
            "backtest-report",
            "Backtest report",
            "blocked",
            "The latest audited run does not include metrics or an equity curve.",
            "run-pipeline",
        )
    return _step(
        "backtest-report",
        "Backtest report",
        "passed",
        f"{getattr(latest_run, 'data_rows', 0)} rows are available for audited backtest review.",
    )


def _ai_review_step(latest_run: Any | None) -> GoldenPathPayload:
    if not latest_run:
        return _step(
            "ai-review",
            "AI review",
            "blocked",
            "AI review waits for audited backtest evidence.",
            "run-pipeline",
        )
    ai_report = getattr(latest_run, "ai_report", None)
    summary = str(ai_report.get("summary") or "").strip() if isinstance(ai_report, dict) else ""
    if not summary:
        return _step(
            "ai-review",
            "AI review",
            "blocked",
            "The latest audited run does not include an AI evidence summary.",
            "run-ai-review",
        )
    return _step("ai-review", "AI review", "passed", "AI review evidence is bound to the audited run.")


def _paper_execution_step(latest_run: Any | None, paper_executions: list[PaperExecutionRecord]) -> GoldenPathPayload:
    if not latest_run:
        return _step(
            "paper-execution",
            "Paper execution",
            "blocked",
            "Paper execution requires an audited research run first.",
            "run-pipeline",
        )
    try:
        validate_paper_execution_handoff(latest_run)
    except ValueError as error:
        return _step(
            "paper-execution",
            "Paper execution",
            "blocked",
            f"Paper handoff is blocked by {error}.",
            "fix-paper-handoff",
        )
    if _paper_execution_passed(str(getattr(latest_run, "run_id", "")), paper_executions):
        return _step("paper-execution", "Paper execution", "passed", "A filled paper execution passed local risk checks.")
    return _step(
        "paper-execution",
        "Paper execution",
        "review",
        "Audited AI evidence is ready, but no filled paper execution is bound.",
        "submit-paper-order",
    )


def _paper_execution_passed(run_id: str, paper_executions: list[PaperExecutionRecord]) -> bool:
    for execution in paper_executions:
        if execution.run_id != run_id:
            continue
        has_fill = any(order.status == "filled" for order in execution.orders)
        has_risk_pass = any(gate.get("id") == "paper-risk-check" and bool(gate.get("passed")) for gate in execution.gates)
        if has_fill and has_risk_pass:
            return True
    return False


def _live_gate_step(settings: dict[str, Any]) -> GoldenPathPayload:
    safety = settings.get("safety") if isinstance(settings, dict) else None
    live_allowed = bool(safety.get("liveTradingAllowed")) if isinstance(safety, dict) else False
    if live_allowed:
        return _step("live-gate", "Live trading gate", "passed", "Live trading gates are open for this environment.")
    return _step(
        "live-gate",
        "Live trading gate",
        "blocked",
        "Live routing remains blocked until adapter certification, risk approval, and human confirmation pass.",
        "certify-live-adapter",
    )


def _step(step_id: str, label: str, status: str, detail: str, action_id: str | None = None) -> GoldenPathPayload:
    return {
        "id": step_id,
        "label": label,
        "status": status,
        "passed": status == "passed",
        "detail": detail,
        "actionId": action_id,
    }


def _overall_status(current_step: GoldenPathPayload | None) -> str:
    if not current_step:
        return "ready"
    if current_step["id"] == "live-gate":
        return "review"
    if current_step["status"] == "review":
        return "review"
    return "blocked"


def _next_action(current_step: GoldenPathPayload | None) -> GoldenPathPayload | None:
    if not current_step:
        return None
    actions = {
        "refresh-data": {
            "id": "refresh-data",
            "label": "Refresh market data",
            "targetWorkspace": "market",
            "reason": current_step["detail"],
        },
        "run-pipeline": {
            "id": "run-pipeline",
            "label": "Run research pipeline",
            "targetWorkspace": "research",
            "reason": current_step["detail"],
        },
        "run-ai-review": {
            "id": "run-ai-review",
            "label": "Run AI review",
            "targetWorkspace": "ai-review",
            "reason": current_step["detail"],
        },
        "fix-paper-handoff": {
            "id": "fix-paper-handoff",
            "label": "Fix paper handoff",
            "targetWorkspace": "execution",
            "reason": current_step["detail"],
        },
        "submit-paper-order": {
            "id": "submit-paper-order",
            "label": "Submit paper order",
            "targetWorkspace": "execution",
            "reason": current_step["detail"],
        },
        "certify-live-adapter": {
            "id": "certify-live-adapter",
            "label": "Certify live adapter",
            "targetWorkspace": "settings",
            "reason": current_step["detail"],
        },
    }
    action_id = current_step.get("actionId")
    return actions.get(action_id) if isinstance(action_id, str) else None


def _workspaces_from_steps(steps: list[GoldenPathPayload], current_step: GoldenPathPayload | None) -> list[GoldenPathPayload]:
    by_id = {step["id"]: step for step in steps}
    market = by_id["market-data"]
    research = by_id["research-run"]
    backtest = by_id["backtest-report"]
    ai_review = by_id["ai-review"]
    paper = by_id["paper-execution"]
    live_gate = by_id["live-gate"]

    return [
        _workspace_from_step("market", "Market", market, current_step, blocked_status="needs_run"),
        _workspace_from_step("research", "Research", research, current_step, blocked_status="needs_run"),
        _workspace(
            "strategy",
            "Strategy",
            "ready" if market["status"] in {"passed", "review"} else "needs_run",
            current_step,
            ["market-data", "research-run"],
            "Strategy drafts can be edited, but an audited run is required before execution.",
            "run-pipeline" if research["status"] != "passed" else None,
        ),
        _workspace_from_step("backtest", "Backtest", backtest, current_step, blocked_status="needs_run"),
        _workspace_from_step("ai-review", "AI review", ai_review, current_step, blocked_status="needs_run"),
        _workspace_from_step("portfolio", "Portfolio", paper, current_step, blocked_status="blocked"),
        _workspace_from_step("execution", "Execution", paper, current_step, blocked_status="blocked"),
        _workspace(
            "audit",
            "Audit",
            "ready" if research["status"] == "passed" else "needs_run",
            current_step,
            ["research-run", "backtest-report", "ai-review", "paper-execution"],
            "Audit history becomes useful after a research run is bound.",
            "run-pipeline" if research["status"] != "passed" else None,
        ),
        _workspace_from_step("settings", "Settings", live_gate, current_step, blocked_status="blocked"),
    ]


def _summary_from_steps(
    steps: list[GoldenPathPayload],
    current_step: GoldenPathPayload | None,
    settings: dict[str, Any],
) -> GoldenPathPayload:
    next_action = _next_action(current_step)
    safety = settings.get("safety") if isinstance(settings, dict) else None
    return {
        "totalSteps": len(steps),
        "passedSteps": sum(1 for step in steps if step["status"] == "passed"),
        "reviewSteps": sum(1 for step in steps if step["status"] == "review"),
        "blockedSteps": sum(1 for step in steps if step["status"] == "blocked"),
        "currentStepLabel": str(current_step["label"]) if current_step else None,
        "nextActionId": next_action.get("id") if isinstance(next_action, dict) else None,
        "liveTradingAllowed": bool(safety.get("liveTradingAllowed")) if isinstance(safety, dict) else False,
    }


def _runbook_from_steps(steps: list[GoldenPathPayload], current_step: GoldenPathPayload | None) -> list[GoldenPathPayload]:
    return [_runbook_item(step, current_step) for step in steps]


def _runbook_item(step: GoldenPathPayload, current_step: GoldenPathPayload | None) -> GoldenPathPayload:
    action = _next_action(step)
    is_passed = bool(step["passed"])
    return {
        "stepId": step["id"],
        "label": step["label"],
        "workspaceId": _workspace_id_for_step(str(step["id"])),
        "status": step["status"],
        "current": bool(current_step and current_step["id"] == step["id"]),
        "passed": is_passed,
        "detail": step["detail"],
        "blocker": None if is_passed else step["detail"],
        "actionId": action.get("id") if isinstance(action, dict) else None,
        "actionLabel": action.get("label") if isinstance(action, dict) else None,
    }


def _workspace_id_for_step(step_id: str) -> str:
    return {
        "market-data": "market",
        "research-run": "research",
        "backtest-report": "backtest",
        "ai-review": "ai-review",
        "paper-execution": "execution",
        "live-gate": "settings",
    }.get(step_id, "audit")


def _workspace_from_step(
    workspace_id: str,
    label: str,
    step: GoldenPathPayload,
    current_step: GoldenPathPayload | None,
    *,
    blocked_status: str,
) -> GoldenPathPayload:
    if step["status"] == "passed":
        status = "ready"
        action_id = None
    elif step["status"] == "review":
        status = "needs_run"
        action_id = step.get("actionId")
    else:
        status = blocked_status
        action_id = step.get("actionId")
    return _workspace(workspace_id, label, status, current_step, [step["id"]], step["detail"], action_id)


def _workspace(
    workspace_id: str,
    label: str,
    status: str,
    current_step: GoldenPathPayload | None,
    step_ids: list[str],
    reason: str,
    action_id: Any,
) -> GoldenPathPayload:
    return {
        "id": workspace_id,
        "label": label,
        "status": status,
        "current": bool(current_step and current_step["id"] in step_ids),
        "stepIds": step_ids,
        "reason": reason,
        "actionId": action_id if isinstance(action_id, str) else None,
    }


def _positive_int(value: Any) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int) and value > 0:
        return value
    return 0
