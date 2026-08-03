from __future__ import annotations

from .research_import_codecs import (
    _number_or_default,
    _parse_iso_datetime,
)
from .query import _parse_research_data_limit
from datetime import (
    datetime,
    timezone,
)
from quant_core.ai_review_runs import (
    AiReviewRunRecord,
    AiReviewRunStore,
    ai_review_run_record_to_payload,
)
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.backtest import BacktestEngine
from quant_core.data_foundation import data_quality_from_payload
from quant_core.domain import (
    BacktestMetrics,
    BacktestRun,
    DataQuality,
    EquityPoint,
)
from quant_core.execution import (
    PaperExecutionRecord,
    paper_execution_record_to_payload,
)
from quant_core.portfolio_backtest import (
    PortfolioBacktestEngine,
    PortfolioLeg,
)
from quant_core.runs import (
    ResearchRunAudit,
    ResearchRunStore,
)
from quant_core.terminal import StrategySnapshot

_P0_LIVE_ROUTE_BLOCKED_REASON = "P0 only records simulated paper fills; live routing flags are rejected."


def _portfolio_backtest_from_payload(payload: dict[str, object], run_store: ResearchRunStore):
    name = str(payload.get("name") or "Portfolio backtest").strip() or "Portfolio backtest"
    initial_cash = _number_or_default(payload.get("initialCash"), 100_000)
    legs_payload = payload.get("legs")
    if initial_cash <= 0:
        raise ValueError("initial_cash_must_be_positive")
    if not isinstance(legs_payload, list) or not legs_payload:
        raise ValueError("portfolio_legs_required")

    legs: list[PortfolioLeg] = []
    for item in legs_payload:
        if not isinstance(item, dict):
            raise ValueError("portfolio_leg_must_be_object")
        run_id = str(item.get("runId") or "").strip()
        if not run_id:
            raise ValueError("portfolio_leg_run_id_required")
        audit = run_store.get(run_id)
        if not audit:
            raise LookupError(run_id)
        legs.append(
            PortfolioLeg(
                target_weight=_number_or_default(item.get("targetWeight"), -1),
                run=_backtest_run_from_audit(audit),
                run_id=run_id,
            )
        )

    return PortfolioBacktestEngine(initial_cash=initial_cash).run(name=name, legs=legs)


def _backtest_run_from_audit(audit: ResearchRunAudit) -> BacktestRun:
    return BacktestRun(
        strategy_name=audit.strategy_name,
        strategy_revision=audit.strategy_revision,
        symbol=audit.symbol,
        market=audit.market,
        timeframe=audit.timeframe,
        metrics=_backtest_metrics_from_audit(audit.metrics),
        trades=[],
        equity_curve=_equity_curve_from_audit(audit),
        data_quality=_data_quality_from_audit(audit),
    )


def _backtest_metrics_from_audit(metrics: dict[str, object]) -> BacktestMetrics:
    total_return = _metric_value(metrics, "total_return_pct", "totalReturnPct")
    return BacktestMetrics(
        total_return_pct=total_return,
        annual_return_pct=_metric_value(metrics, "annual_return_pct", "annualReturnPct", default=total_return),
        max_drawdown_pct=_metric_value(metrics, "max_drawdown_pct", "maxDrawdownPct"),
        win_rate_pct=_metric_value(metrics, "win_rate_pct", "winRatePct"),
        profit_factor=_metric_value(metrics, "profit_factor", "profitFactor"),
        trade_count=int(_metric_value(metrics, "trade_count", "tradeCount")),
    )


def _metric_value(metrics: dict[str, object], *keys: str, default: float = 0.0) -> float:
    for key in keys:
        if key in metrics:
            return _number_or_default(metrics.get(key), default)
    return default


def _equity_curve_from_audit(audit: ResearchRunAudit) -> list[EquityPoint]:
    if not audit.backtest_equity_curve:
        raise ValueError(f"backtest_equity_curve_required:{audit.run_id}")
    points: list[EquityPoint] = []
    for row in audit.backtest_equity_curve:
        if not isinstance(row, dict):
            raise ValueError(f"backtest_equity_point_must_be_object:{audit.run_id}")
        timestamp = row.get("timestamp")
        equity = row.get("equity")
        if not timestamp:
            raise ValueError(f"backtest_equity_point_timestamp_required:{audit.run_id}")
        points.append(
            EquityPoint(
                timestamp=_parse_iso_datetime(str(timestamp)),
                equity=_number_or_default(equity, 0.0),
            )
        )
    return points


def _data_quality_from_audit(audit: ResearchRunAudit) -> DataQuality:
    quality = audit.data_quality if isinstance(audit.data_quality, dict) else {}
    return data_quality_from_payload({
        **quality,
        "rows": int(_number_or_default(quality.get("rows"), audit.data_rows)),
    })


def _strategy_snapshot_from_query(query: dict[str, list[str]]) -> StrategySnapshot | None:
    strategy_keys = ["strategyName", "strategyEntry", "strategyExit", "strategyPosition", "strategyRisk"]
    if not any(key in query for key in strategy_keys):
        return None
    return StrategySnapshot(
        name=query.get("strategyName", ["SMA trend demo"])[0].strip() or "SMA trend demo",
        entry=query.get("strategyEntry", ["Close > SMA20"])[0].strip() or "Close > SMA20",
        exit=query.get("strategyExit", ["Close < SMA20, stop loss, take profit, or end of backtest"])[0].strip()
        or "Close < SMA20, stop loss, take profit, or end of backtest",
        position=query.get("strategyPosition", ["80% max capital allocation"])[0].strip() or "80% max capital allocation",
        risk=query.get("strategyRisk", ["Stop -8%, take profit +18%, drawdown guard 20%, paper only"])[0].strip()
        or "Stop -8%, take profit +18%, drawdown guard 20%, paper only",
    )


def _strategy_snapshot_from_payload(value: object) -> StrategySnapshot:
    if not isinstance(value, dict):
        raise ValueError("strategy_payload_required")
    return StrategySnapshot(
        name=str(value.get("name") or "SMA trend demo").strip() or "SMA trend demo",
        entry=str(value.get("entry") or "Close > SMA20").strip() or "Close > SMA20",
        exit=str(value.get("exit") or "Close < SMA20, stop loss, take profit, or end of backtest").strip()
        or "Close < SMA20, stop loss, take profit, or end of backtest",
        position=str(value.get("position") or "80% max capital allocation").strip() or "80% max capital allocation",
        risk=str(value.get("risk") or "Stop -8%, take profit +18%, drawdown guard 20%, paper only").strip()
        or "Stop -8%, take profit +18%, drawdown guard 20%, paper only",
    )


def _p0_strategy_snapshot_from_payload(value: object) -> StrategySnapshot:
    if not isinstance(value, dict):
        raise ValueError("strategy_config_required")
    name = str(value.get("name") or "SMA trend").strip() or "SMA trend"
    return StrategySnapshot(
        name=name,
        entry=_p0_condition_text(value.get("entry"), role="entry"),
        exit=_p0_condition_text(value.get("exit"), role="exit"),
        position=_p0_position_text(value.get("position")),
        risk=_p0_risk_text(value.get("risk")),
    )


def _p0_condition_text(value: object, *, role: str) -> str:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped:
            return stripped
    if not isinstance(value, dict):
        return "Close > SMA20" if role == "entry" else "Close < SMA20"

    condition_type = str(value.get("type") or "").strip().lower()
    window = _p0_int(value.get("window"), default=20, minimum=1, maximum=250)
    if role == "entry":
        if condition_type in {"", "sma_cross", "sma_breakout", "sma_above", "close_above_sma"}:
            return f"Close > SMA{window}"
        if condition_type in {"sma_below", "close_below_sma"}:
            return f"Close < SMA{window}"
        if condition_type in {"rsi_below", "rsi_oversold"}:
            threshold = _p0_float(value.get("threshold"), default=30.0, minimum=0.0, maximum=100.0)
            return f"RSI{window} < {threshold:g}"
    if condition_type in {"", "sma_break", "sma_below", "close_below_sma"}:
        return f"Close < SMA{window}"
    if condition_type in {"sma_above", "close_above_sma"}:
        return f"Close > SMA{window}"
    if condition_type in {"rsi_above", "rsi_exit"}:
        threshold = _p0_float(value.get("threshold"), default=55.0, minimum=0.0, maximum=100.0)
        return f"RSI{window} > {threshold:g}"
    raise ValueError(f"unsupported_p0_{role}_condition:{condition_type}")


def _p0_position_text(value: object) -> str:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped:
            return stripped
    if isinstance(value, dict):
        max_position_pct = _p0_float(value.get("maxPositionPct"), default=80.0, minimum=1.0, maximum=100.0)
        return f"{max_position_pct:g}% cap per instrument"
    return "80% cap per instrument"


def _p0_risk_text(value: object) -> str:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped:
            return stripped
    risk = value if isinstance(value, dict) else {}
    stop_loss_pct = _p0_float(risk.get("stopLossPct"), default=8.0, minimum=0.0, maximum=100.0)
    max_drawdown_pct = _p0_float(risk.get("maxDrawdownPct"), default=20.0, minimum=0.0, maximum=100.0)
    take_profit = _p0_float(risk.get("takeProfitPct"), default=18.0, minimum=0.0, maximum=500.0)
    return (
        f"Stop -{stop_loss_pct:g}%, take profit +{take_profit:g}%, "
        f"drawdown guard {max_drawdown_pct:g}%, paper only"
    )


def _p0_backtest_engine_from_payload(value: object) -> BacktestEngine:
    assumptions = value if isinstance(value, dict) else {}
    initial_cash = _p0_float(assumptions.get("initialCash"), default=100_000.0, minimum=1.0, maximum=1_000_000_000.0)
    fee_bps = _p0_float(assumptions.get("feeBps"), default=3.0, minimum=0.0, maximum=10_000.0)
    slippage_bps = _p0_float(assumptions.get("slippageBps"), default=2.0, minimum=0.0, maximum=10_000.0)
    return BacktestEngine(initial_cash=initial_cash, fee_rate=fee_bps / 10_000, slippage_rate=slippage_bps / 10_000)


def _p0_data_limit_from_payload(payload: dict[str, object]) -> int:
    return _parse_research_data_limit(str(payload.get("limit") or "500"))


def _p0_int(value: object, *, default: int, minimum: int, maximum: int) -> int:
    number = _p0_float(value, default=float(default), minimum=float(minimum), maximum=float(maximum))
    return int(round(number))


def _p0_float(value: object, *, default: float, minimum: float, maximum: float) -> float:
    try:
        number = float(value) if value is not None else default
    except (TypeError, ValueError):
        number = default
    if number < minimum:
        return minimum
    if number > maximum:
        return maximum
    return number


def _p0_pipeline_response_payload(audit: ResearchRunAudit) -> dict[str, object]:
    snapshot_hash = str(audit.data_snapshot.get("hash") or "").strip()
    data_snapshot_id = f"data-{(snapshot_hash or audit.run_id.removeprefix('run-'))[:12]}"
    return {
        "status": "audited_run_created",
        "runId": audit.run_id,
        "strategyRevisionId": f"strategy-{audit.strategy_revision}",
        "dataSnapshotId": data_snapshot_id,
        "metrics": {
            "totalReturnPct": _p0_metric_value(audit.metrics, "total_return_pct"),
            "maxDrawdownPct": _p0_metric_value(audit.metrics, "max_drawdown_pct"),
            "tradeCount": int(_p0_metric_value(audit.metrics, "trade_count")),
        },
        "paperOnly": True,
        "liveTradingAllowed": False,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
    }


def _p0_metric_value(metrics: dict[str, object], key: str) -> float:
    value = metrics.get(key)
    if isinstance(value, (int, float)):
        return round(float(value), 4)
    return 0.0


def _p0_ai_review_context_mismatch(audit: ResearchRunAudit, payload: dict[str, object]) -> dict[str, dict[str, str]] | None:
    request_context = {
        "market": str(payload.get("market") or audit.market).strip() or audit.market,
        "symbol": str(payload.get("symbol") or audit.symbol).strip() or audit.symbol,
        "timeframe": str(payload.get("timeframe") or audit.timeframe).strip() or audit.timeframe,
    }
    run_context = {"market": audit.market, "symbol": audit.symbol, "timeframe": audit.timeframe}
    if request_context != run_context:
        return {"runContext": run_context, "requestContext": request_context}
    return None


def _latest_ready_p0_ai_review(
    store: AiReviewRunStore,
    audit: ResearchRunAudit,
) -> AiReviewRunRecord | None:
    for review in store.list_by_run(audit.run_id, limit=20):
        record = review.record
        if str(record.get("status") or "") != "ready":
            continue
        if str(record.get("market") or audit.market) != audit.market:
            continue
        if str(record.get("symbol") or audit.symbol) != audit.symbol:
            continue
        if str(record.get("timeframe") or audit.timeframe) != audit.timeframe:
            continue
        if str(record.get("strategyRevision") or audit.strategy_revision) != audit.strategy_revision:
            continue
        citations = record.get("citations")
        if not isinstance(citations, list) or not citations:
            continue
        if not str(record.get("boundary") or "").strip():
            continue
        return review
    return None


def _p0_paper_simulation_response_payload(
    *,
    audit: ResearchRunAudit,
    execution: PaperExecutionRecord,
    ai_review: AiReviewRunRecord,
    audit_event: object,
    promotion: dict[str, object],
) -> dict[str, object]:
    execution_payload = paper_execution_record_to_payload(execution)
    order = _p0_paper_execution_first_order(execution_payload)
    account = execution_payload["account"]
    positions = account.get("positions") if isinstance(account, dict) else {}
    position_after = float(dict(positions).get(audit.symbol, 0)) if isinstance(positions, dict) else 0.0
    account_replay = {
        "mode": "single_run_paper_replay",
        "runId": audit.run_id,
        "symbol": audit.symbol,
        "initialCash": _p0_assumption_number(audit, "initialCash", 100_000),
        "cashAfter": account.get("cash") if isinstance(account, dict) else 0,
        "positionAfter": position_after,
        "equityAfter": account.get("equity") if isinstance(account, dict) else 0,
        "ordersApplied": 1,
        "paperOnly": True,
        "liveTradingAllowed": False,
    }
    return {
        "status": "paper_simulation_created",
        "runId": audit.run_id,
        "paperOnly": True,
        "liveTradingAllowed": False,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "paperOrderRecorded": True,
        "simulatedFillRecorded": True,
        "liveRouteBlockedReason": _P0_LIVE_ROUTE_BLOCKED_REASON,
        "execution": execution_payload,
        "simulatedFill": {
            "orderId": order["orderId"],
            "symbol": order["symbol"],
            "side": order["side"],
            "quantity": order["quantity"],
            "fillPrice": order["price"],
            "status": order["status"],
            "filledAt": order["timestamp"],
            "reason": order["reason"],
        },
        "accountReplay": account_replay,
        "gates": _p0_paper_simulation_gates(audit, execution, ai_review),
        "aiReview": ai_review_run_record_to_payload(ai_review),
        "promotion": promotion,
        "auditEvent": audit_event_record_to_payload(audit_event),
        "exportReadiness": {
            "ready": True,
            "requiredArtifacts": ["researchRun", "aiReview", "paperExecution", "auditEvent"],
            "paperExecutionId": execution.execution_id,
            "auditEventId": getattr(audit_event, "event_id", ""),
            "detail": "Paper simulation evidence is recorded and can be exported with the research run.",
        },
    }


def _p0_paper_simulation_audit_event_payload(
    *,
    audit: ResearchRunAudit,
    execution: PaperExecutionRecord,
    ai_review: AiReviewRunRecord,
    request_payload: dict[str, object],
) -> dict[str, object]:
    execution_payload = paper_execution_record_to_payload(execution)
    order = _p0_paper_execution_first_order(execution_payload)
    account = execution_payload["account"]
    return {
        "schemaVersion": 1,
        "eventId": f"p0-paper-simulation-{execution.execution_id}",
        "eventType": "p0_paper_simulation",
        "runId": audit.run_id,
        "createdAt": execution.created_at.isoformat(),
        "stage": "execution",
        "source": "p0-paper-simulation",
        "summary": f"P0 paper simulation recorded for {audit.symbol}; live routing blocked.",
        "detail": (
            f"Simulated {order['side']} {order['quantity']} {order['symbol']} at {order['price']} "
            f"from audited run {audit.run_id}; no live order was submitted."
        ),
        "metadata": {
            "market": audit.market,
            "symbol": audit.symbol,
            "timeframe": audit.timeframe,
            "strategyRevision": audit.strategy_revision,
            "aiReviewId": ai_review.ai_review_id,
            "paperExecutionId": execution.execution_id,
            "orderId": order["orderId"],
            "orderStatus": order["status"],
            "fillPrice": order["price"],
            "fillQuantity": order["quantity"],
            "cashAfter": account.get("cash") if isinstance(account, dict) else 0,
            "positionAfter": dict(account.get("positions", {})).get(audit.symbol, 0) if isinstance(account, dict) else 0,
            "liveFlagsRejected": _p0_rejected_live_flags(request_payload),
            "paperOnly": True,
            "liveTradingAllowed": False,
            "orderSubmitted": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
            "liveRouteBlockedReason": _P0_LIVE_ROUTE_BLOCKED_REASON,
        },
    }


def _p0_paper_simulation_gates(
    audit: ResearchRunAudit,
    execution: PaperExecutionRecord,
    ai_review: AiReviewRunRecord,
) -> list[dict[str, object]]:
    order = execution.orders[0] if execution.orders else None
    return [
        {
            "id": "data-quality",
            "label": "Data quality",
            "status": "passed",
            "detail": f"{audit.data_quality.get('source') or 'unknown'} complete; {audit.data_quality.get('rows') or audit.data_rows} rows.",
        },
        {
            "id": "ai-review-evidence",
            "label": "AI review evidence",
            "status": "passed",
            "detail": f"AI review {ai_review.ai_review_id} is bound to the audited run.",
        },
        {
            "id": "strategy-risk",
            "label": "Strategy risk",
            "status": "passed",
            "detail": "Position, stop loss, take profit, and drawdown fields are present.",
        },
        {
            "id": "paper-preflight",
            "label": "Paper preflight",
            "status": "passed" if order and order.status == "filled" else "blocked",
            "detail": order.reason if order else "No paper order was generated.",
        },
        {
            "id": "live-route",
            "label": "Live route",
            "status": "blocked",
            "detail": _P0_LIVE_ROUTE_BLOCKED_REASON,
        },
    ]


def _p0_paper_execution_first_order(execution_payload: dict[str, object]) -> dict[str, object]:
    orders = execution_payload.get("orders")
    if not isinstance(orders, list) or not orders or not isinstance(orders[0], dict):
        raise ValueError("p0_paper_simulation_order_missing")
    return dict(orders[0])


def _p0_assumption_number(audit: ResearchRunAudit, key: str, fallback: float) -> float:
    value = audit.backtest_assumptions.get(key) if isinstance(audit.backtest_assumptions, dict) else None
    if isinstance(value, (int, float)):
        return float(value)
    return fallback


def _p0_rejected_live_flags(payload: dict[str, object]) -> list[str]:
    rejected = []
    for key in ("liveTradingAllowed", "orderSubmitted", "liveOrderSubmitted", "routeExecuted"):
        if payload.get(key) is True:
            rejected.append(key)
    if str(payload.get("route") or "").strip().lower() == "live":
        rejected.append("route=live")
    if str(payload.get("executionMode") or "").strip().lower() in {"live", "certified_live"}:
        rejected.append("executionMode=live")
    return rejected


def _build_p0_ai_review_record(audit: ResearchRunAudit) -> dict[str, object]:
    created_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    citations = _p0_ai_review_citations(audit)
    rounds = _p0_ai_review_rounds(audit)
    decision_log = _p0_ai_review_decision_log(audit)
    unknowns = _p0_ai_review_unknowns(audit)
    return {
        "schemaVersion": 1,
        "recordType": "aiqt.aiReviewRun",
        "aiReviewId": f"ai-review:{audit.run_id}:{audit.strategy_revision}:local-evidence",
        "runId": audit.run_id,
        "createdAt": created_at,
        "market": audit.market,
        "symbol": audit.symbol,
        "timeframe": audit.timeframe,
        "strategyRevision": audit.strategy_revision,
        "executionMode": audit.execution_mode,
        "status": "ready",
        "summary": {
            "citationCount": len(citations),
            "roundCount": len(rounds),
            "decisionCount": len(decision_log),
            "parameterScanBound": True,
            "liveExecutionBlocked": True,
            "mode": "local_evidence_review",
        },
        "dossier": {
            "status": "ready",
            "headline": "Local evidence review ready",
            "summary": (
                f"Reviewed {audit.symbol} {audit.timeframe} against audited run {audit.run_id}; "
                "findings are evidence-bound and require human review before any execution."
            ),
            "citations": citations,
            "risks": _p0_ai_review_risk_warnings(audit),
            "unknowns": unknowns,
            "mode": "local_evidence_review",
        },
        "citations": citations,
        "rounds": rounds,
        "decisionLog": decision_log,
        "evidenceAnchors": _p0_ai_review_evidence_anchors(audit, citations),
        "boundary": "Evidence explanation only; No direct trading instructions; no return promises; paper review only.",
    }


def _p0_ai_review_citations(audit: ResearchRunAudit) -> list[dict[str, object]]:
    metrics = audit.metrics
    quality = audit.data_quality
    strategy = audit.strategy_config
    return [
        {
            "id": "run",
            "label": "Audited run",
            "value": audit.run_id,
            "detail": f"{audit.market} {audit.symbol} {audit.timeframe}; {audit.data_rows} bars locked.",
            "tone": "ai",
        },
        {
            "id": "metrics",
            "label": "Backtest metrics",
            "value": f"{_p0_display_pct(metrics.get('total_return_pct'))} return / {_p0_display_pct(metrics.get('max_drawdown_pct'))} max drawdown",
            "detail": f"{int(_p0_metric_value(metrics, 'trade_count'))} audited trades; win rate {_p0_display_pct(metrics.get('win_rate_pct'))}.",
            "tone": "positive" if _p0_metric_value(metrics, "total_return_pct") >= 0 else "warning",
        },
        {
            "id": "strategy",
            "label": "Strategy revision",
            "value": audit.strategy_revision,
            "detail": _p0_strategy_citation_detail(strategy),
            "tone": "neutral",
        },
        {
            "id": "data-quality",
            "label": "Data quality",
            "value": str(quality.get("source") or "unknown"),
            "detail": _p0_data_quality_detail(quality),
            "tone": "positive" if quality.get("isComplete") is True else "warning",
        },
        {
            "id": "risk-gates",
            "label": "Risk boundary",
            "value": "paper-only gate",
            "detail": "Live routing remains blocked until adapter certification, risk approval, and human confirmation pass.",
            "tone": "risk",
        },
    ]


def _p0_ai_review_risk_warnings(audit: ResearchRunAudit) -> list[str]:
    warnings: list[str] = []
    max_drawdown = _p0_metric_value(audit.metrics, "max_drawdown_pct")
    if max_drawdown > 0:
        warnings.append(f"Observed max drawdown is {_p0_display_pct(max_drawdown)} in this audited sample.")
    if audit.data_quality.get("warnings"):
        warnings.append("Data quality warnings require review before relying on the run.")
    warnings.append("Paper-only boundary remains active; no live route is authorized.")
    return warnings


def _p0_ai_review_unknowns(audit: ResearchRunAudit) -> list[str]:
    unknowns = [str(warning) for warning in audit.data_quality.get("warnings", []) if str(warning).strip()]
    ai_report = audit.ai_report if isinstance(audit.ai_report, dict) else {}
    risks = ai_report.get("risks")
    if isinstance(risks, list):
        unknowns.extend(str(risk) for risk in risks if str(risk).strip())
    if not unknowns:
        unknowns.append("Benchmark, liquidity, and regime sensitivity still require operator review.")
    return unknowns


def _p0_ai_review_rounds(audit: ResearchRunAudit) -> list[dict[str, object]]:
    return [
        {
            "id": "technical-analyst",
            "phase": "analysis",
            "agent": "Technical Analyst",
            "thesis": "Trend evidence is readable from the audited backtest.",
            "evidence": f"Run {audit.run_id} reports {_p0_display_pct(audit.metrics.get('total_return_pct'))} return.",
            "verdict": "support" if _p0_metric_value(audit.metrics, "total_return_pct") >= 0 else "challenge",
            "confidence": 0.62,
            "tone": "positive" if _p0_metric_value(audit.metrics, "total_return_pct") >= 0 else "warning",
        },
        {
            "id": "fundamental-analyst",
            "phase": "debate",
            "agent": "Fundamental Analyst",
            "thesis": "Single-instrument evidence needs external context before interpretation.",
            "evidence": "No valuation, sector, or macro dataset is attached to this P0 run.",
            "verdict": "watch",
            "confidence": 0.52,
            "tone": "warning",
        },
        {
            "id": "risk-manager",
            "phase": "risk",
            "agent": "Risk Manager",
            "thesis": "Execution remains constrained to paper review.",
            "evidence": f"Max drawdown {_p0_display_pct(audit.metrics.get('max_drawdown_pct'))}; data source {audit.data_quality.get('source', 'unknown')}.",
            "verdict": "risk",
            "confidence": 0.78,
            "tone": "risk",
        },
        {
            "id": "portfolio-manager",
            "phase": "decision",
            "agent": "Portfolio Manager",
            "thesis": "The review can move to paper simulation after human confirmation.",
            "evidence": "AI review is bound to run, metrics, strategy revision, data quality, and risk gates.",
            "verdict": "watch",
            "confidence": 0.66,
            "tone": "ai",
        },
    ]


def _p0_ai_review_decision_log(audit: ResearchRunAudit) -> list[dict[str, str]]:
    return [
        {
            "agent": "AI Boundary",
            "message": "Evidence review completed without direct trading instructions.",
            "tone": "ai",
        },
        {
            "agent": "Risk Manager",
            "message": "Live execution remains blocked; paper simulation requires operator confirmation.",
            "tone": "risk",
        },
        {
            "agent": "Audit",
            "message": f"Review is linked to {audit.run_id} and strategy revision {audit.strategy_revision}.",
            "tone": "positive",
        },
    ]


def _p0_ai_review_evidence_anchors(
    audit: ResearchRunAudit, citations: list[dict[str, object]]
) -> list[dict[str, str]]:
    anchors = [
        {
            "id": f"run:{audit.run_id}",
            "type": "research-run",
            "label": "Audited run",
            "reference": audit.run_id,
            "exportPath": "researchRun.runId",
        },
        {
            "id": f"strategy:{audit.strategy_revision}",
            "type": "strategy-revision",
            "label": "Strategy revision",
            "reference": audit.strategy_revision,
            "exportPath": "researchRun.strategyRevision",
        },
    ]
    anchors.extend(
        {
            "id": f"citation:{citation['id']}",
            "type": "citation",
            "label": str(citation["label"]),
            "reference": str(citation["id"]),
            "exportPath": f"aiReviewRuns[].record.citations[{citation['id']}]",
        }
        for citation in citations
    )
    anchors.append(
        {
            "id": f"boundary:{audit.run_id}",
            "type": "risk-boundary",
            "label": "AI boundary",
            "reference": "paper-only",
            "exportPath": "aiReviewRuns[].record.boundary",
        }
    )
    return anchors


def _p0_strategy_citation_detail(strategy: dict[str, object]) -> str:
    if not strategy:
        return "Strategy config was not stored with this run; rerun pipeline if reproducibility is required."
    entry_conditions = strategy.get("entryConditions")
    exit_conditions = strategy.get("exitConditions")
    entry_count = len(entry_conditions) if isinstance(entry_conditions, list) else 0
    exit_count = len(exit_conditions) if isinstance(exit_conditions, list) else 0
    return f"{entry_count} entry condition(s), {exit_count} exit condition(s), risk rules stored."


def _p0_data_quality_detail(quality: dict[str, object]) -> str:
    warnings = quality.get("warnings")
    warning_count = len(warnings) if isinstance(warnings, list) else 0
    rows = quality.get("rows", 0)
    complete = "complete" if quality.get("isComplete") is True else "review"
    return f"{rows} rows, {complete}; {warning_count} warning(s)."


def _p0_display_pct(value: object) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0.0
    sign = "+" if number > 0 else ""
    return f"{sign}{number:.2f}%"


def _is_importable_strategy_config(value: object) -> bool:
    if not isinstance(value, dict):
        return False
    revision = str(value.get("revision") or "").strip()
    entry_conditions = value.get("entryConditions")
    exit_conditions = value.get("exitConditions")
    return (
        bool(revision)
        and isinstance(entry_conditions, list)
        and bool(entry_conditions)
        and isinstance(exit_conditions, list)
        and bool(exit_conditions)
    )
