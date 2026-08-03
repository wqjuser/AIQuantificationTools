from __future__ import annotations

import uuid
from .p0 import _portfolio_backtest_from_payload
from .query import (
    _parse_kline_limit,
    _parse_limit,
    _parse_offset,
    _parse_research_data_limit,
)
from .research_import_codecs import _find_portfolio_paper_order_batch
from datetime import datetime
from quant_core.audit_events import (
    AuditEventStore,
    audit_event_record_to_payload,
)
from quant_core.cache_refresh_runs import WatchlistCacheRefreshRun
from quant_core.execution import (
    PortfolioPaperOrderApprovalStore,
    PortfolioPaperOrderSimulationStore,
    PortfolioPaperOrderStore,
    build_portfolio_paper_order_replay,
    build_portfolio_paper_order_state_history,
    execution_adapter_paper_execution_payload_from_audit_event,
    execution_adapter_sandbox_probe_execution_payload_from_audit_event,
    execution_adapter_sandbox_probe_review_payload_from_audit_event,
    portfolio_paper_order_approval_to_payload,
    portfolio_paper_order_batch_to_payload,
    portfolio_paper_order_simulation_to_payload,
)
from quant_core.runs import ResearchRunStore
from quant_core.stage4_portfolio import (
    build_stage4_portfolio_workflow_snapshot,
    validate_stage4_portfolio_workflow_snapshot,
)
from quant_core.stage5_shadow import (
    build_stage5_sandbox_authorization_preflight,
    build_stage5_sandbox_authorization_review,
    build_stage5_sandbox_readiness_decision,
    build_stage5_shadow_session,
    stage5_shadow_session_key,
    validate_stage5_sandbox_authorization_preflight,
    validate_stage5_sandbox_authorization_review,
    validate_stage5_sandbox_readiness_decision,
    validate_stage5_shadow_session,
)
from urllib.parse import parse_qs

def _watchlist_refresh_preparation_evidence(
    refresh_run: WatchlistCacheRefreshRun | None,
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, object] | None:
    if refresh_run is None:
        return None
    for item in refresh_run.items:
        if item.market == market and item.symbol == symbol and item.timeframe == timeframe:
            return {
                "kind": "watchlist_cache_refresh",
                "runId": refresh_run.run_id,
                "createdAt": refresh_run.created_at.isoformat(),
                "overrideAuditEventId": refresh_run.override_audit_event_id,
                "market": item.market,
                "symbol": item.symbol,
                "name": item.name,
                "timeframe": item.timeframe,
                "status": item.status,
                "requestedLimit": item.requested_limit,
                "upsertedRows": item.upserted_rows,
                "quality": {
                    "source": item.quality.source,
                    "isComplete": item.quality.is_complete,
                    "warnings": list(item.quality.warnings),
                    "rows": item.quality.rows,
                },
                "error": item.error,
            }
    return None


def _stage4_portfolio_workflow_from_payload(
    payload: dict[str, object],
    *,
    run_store: ResearchRunStore,
    batch_store: PortfolioPaperOrderStore,
    approval_store: PortfolioPaperOrderApprovalStore,
    simulation_store: PortfolioPaperOrderSimulationStore,
) -> tuple[dict[str, object], str]:
    expected_fields = {"baseRunId", "name", "initialCash", "legs", "riskTemplate", "batchId", "operator"}
    if not isinstance(payload, dict) or set(payload) != expected_fields:
        raise ValueError("stage4 portfolio workflow request fields are invalid")
    base_run_id = _required_stage4_string(payload["baseRunId"])
    name = _required_stage4_string(payload["name"])
    batch_id = _required_stage4_string(payload["batchId"])
    operator = _required_stage4_string(payload["operator"])
    initial_cash = payload["initialCash"]
    if isinstance(initial_cash, bool) or not isinstance(initial_cash, (int, float)) or initial_cash <= 0:
        raise ValueError("stage4 portfolio workflow initialCash must be positive")
    legs = payload["legs"]
    if not isinstance(legs, list) or len(legs) < 2:
        raise ValueError("stage4 portfolio workflow requires at least two legs")
    for leg in legs:
        if not isinstance(leg, dict) or set(leg) != {"runId", "targetWeight"}:
            raise ValueError("stage4 portfolio workflow leg fields are invalid")
        _required_stage4_string(leg["runId"])
        weight = leg["targetWeight"]
        if isinstance(weight, bool) or not isinstance(weight, (int, float)):
            raise ValueError("stage4 portfolio workflow targetWeight must be numeric")
    risk_template = payload["riskTemplate"]
    if not isinstance(risk_template, dict) or set(risk_template) != {
        "minCashAfter",
        "maxSymbolNotional",
        "maxBatchNotional",
    }:
        raise ValueError("stage4 portfolio workflow riskTemplate fields are invalid")

    portfolio_input = {"name": name, "initialCash": initial_cash, "legs": legs}
    portfolio = _portfolio_backtest_from_payload(portfolio_input, run_store)
    audits = [run_store.get(str(leg["runId"])) for leg in legs]
    if any(audit is None for audit in audits):
        raise LookupError("stage4 portfolio workflow run not found")
    portfolio_request = {
        "name": name,
        "initialCash": initial_cash,
        "legs": [
            {
                "runId": leg["runId"],
                "symbol": audit.symbol,
                "market": audit.market,
                "timeframe": audit.timeframe,
                "targetWeight": leg["targetWeight"],
            }
            for leg, audit in zip(legs, audits, strict=True)
        ],
    }
    batch = _find_portfolio_paper_order_batch(batch_store, base_run_id, batch_id)
    if batch.portfolio_name != name:
        raise ValueError("stage4 portfolio workflow batch portfolio name does not match")
    order_ids = [str(order.get("orderId") or "") for order in batch.orders]
    approvals = _stage4_ordered_evidence(
        approval_store.list_by_batch(base_run_id, batch_id), order_ids, "approval"
    )
    simulations = _stage4_ordered_evidence(
        simulation_store.list_by_batch(base_run_id, batch_id), order_ids, "simulation"
    )
    run_symbols = {str(leg["runId"]): audit.symbol for leg, audit in zip(legs, audits, strict=True)}
    for order, simulation in zip(batch.orders, simulations, strict=True):
        source_run_id = str(order.get("sourceRunId") or "")
        if (
            run_symbols.get(source_run_id) != str(order.get("symbol") or "")
            or simulation.symbol != order.get("symbol")
            or simulation.source_run_id != source_run_id
            or simulation.side != order.get("side")
            or simulation.quantity != order.get("quantity")
            or simulation.notional_value != order.get("notionalValue")
        ):
            raise ValueError("stage4 portfolio workflow simulation does not match batch order")
    approval_payloads = [portfolio_paper_order_approval_to_payload(item) for item in approvals]
    simulation_payloads = [portfolio_paper_order_simulation_to_payload(item) for item in simulations]
    state_history = build_portfolio_paper_order_state_history(
        batch,
        approvals=approvals,
        simulations=simulations,
    )
    replay = build_portfolio_paper_order_replay(
        simulations,
        base_run_id=base_run_id,
        initial_cash=float(initial_cash),
    )
    snapshot = build_stage4_portfolio_workflow_snapshot(
        workflow_id=f"stage4-portfolio-workflow-{uuid.uuid4().hex}",
        base_run_id=base_run_id,
        portfolio_request=portfolio_request,
        portfolio=portfolio,
        risk_template=risk_template,
        batch=portfolio_paper_order_batch_to_payload(batch),
        approvals=approval_payloads,
        simulations=simulation_payloads,
        state_history=state_history,
        replay=replay,
    )
    return snapshot, operator


def _required_stage4_string(value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("stage4 portfolio workflow string field is required")
    return value.strip()


def _stage4_ordered_evidence(items: list[object], order_ids: list[str], label: str) -> list[object]:
    by_order_id = {str(getattr(item, "order_id", "")): item for item in items}
    if not order_ids or len(items) != len(order_ids) or set(by_order_id) != set(order_ids):
        raise ValueError(f"stage4 portfolio workflow {label}s do not match batch orders")
    return [by_order_id[order_id] for order_id in order_ids]


def _stage4_portfolio_workflow_query(raw_query: str) -> tuple[str, int]:
    query = parse_qs(raw_query, keep_blank_values=True)
    if set(query) - {"baseRunId", "limit"} or len(query.get("baseRunId", [])) != 1:
        raise ValueError("invalid_stage4_portfolio_workflow_query")
    base_run_id = query["baseRunId"][0].strip()
    raw_limit = query.get("limit", ["20"])
    if not base_run_id or len(raw_limit) != 1 or not raw_limit[0].isdigit():
        raise ValueError("invalid_stage4_portfolio_workflow_query")
    limit = int(raw_limit[0])
    if not 1 <= limit <= 50:
        raise ValueError("invalid_stage4_portfolio_workflow_query")
    return base_run_id, limit


def _portfolio_m5_query(raw_query: str) -> tuple[str, int]:
    query = parse_qs(raw_query, keep_blank_values=True)
    if set(query) - {"baseRunId", "limit"} or len(query.get("baseRunId", [])) != 1:
        raise ValueError("portfolio_m5_query_invalid")
    base_run_id = query["baseRunId"][0].strip()
    raw_limit = query.get("limit", ["20"])
    if (
        not base_run_id
        or len(raw_limit) != 1
        or not raw_limit[0].isdigit()
        or not 1 <= int(raw_limit[0]) <= 100
    ):
        raise ValueError("portfolio_m5_query_invalid")
    return base_run_id, int(raw_limit[0])


def _stage5_shadow_source_workflow(
    store: AuditEventStore, base_run_id: str, workflow_hash: str
) -> dict[str, Any]:
    for event in store.list_recent(
        run_id=base_run_id, event_type="stage4_portfolio_workflow", limit=50
    ):
        workflow = validate_stage4_portfolio_workflow_snapshot(
            event.metadata.get("snapshot")
        )
        if (
            workflow["workflowId"] != event.event_id
            or workflow["baseRunId"] != base_run_id
            or datetime.fromisoformat(workflow["generatedAt"]) != event.created_at
        ):
            raise ValueError("stage4 portfolio workflow audit binding does not match")
        if workflow["workflowHash"] == workflow_hash:
            return workflow
    raise LookupError("authoritative Stage 4 workflow was not found")


def _stage5_shadow_sessions(
    store: AuditEventStore,
    base_run_id: str,
    workflow_hash: str | None,
    *,
    limit: int = 50,
) -> list[dict[str, Any]]:
    expected_key = stage5_shadow_session_key(workflow_hash) if workflow_hash else None
    sessions = []
    for event in store.list_recent(
        run_id=base_run_id,
        event_type="stage5_shadow_execution_session",
        limit=50,
    ):
        session = validate_stage5_shadow_session(event.metadata.get("snapshot"))
        if (
            session["sessionId"] != event.event_id
            or session["baseRunId"] != base_run_id
        ):
            raise ValueError("stage5 shadow audit binding does not match")
        if expected_key and session["sessionKey"] != expected_key:
            continue
        workflow = _stage5_shadow_source_workflow(
            store, base_run_id, session["workflowHash"]
        )
        rebuilt = build_stage5_shadow_session(
            workflow,
            failure_mode=session["failureMode"],
            attempt=session["attempt"],
            generated_at=session["generatedAt"],
        )
        if rebuilt != session:
            raise ValueError("stage5 shadow session does not match source workflow")
        sessions.append(session)
        if len(sessions) >= limit:
            break
    return sessions


def _stage5_shadow_query(raw_query: str) -> tuple[str, int]:
    query = parse_qs(raw_query, keep_blank_values=True)
    if set(query) - {"baseRunId", "limit"} or len(query.get("baseRunId", [])) != 1:
        raise ValueError("invalid_stage5_shadow_session_query")
    base_run_id = query["baseRunId"][0].strip()
    raw_limit = query.get("limit", ["20"])
    if not base_run_id or len(raw_limit) != 1 or not raw_limit[0].isdigit():
        raise ValueError("invalid_stage5_shadow_session_query")
    limit = int(raw_limit[0])
    if not 1 <= limit <= 50:
        raise ValueError("invalid_stage5_shadow_session_query")
    return base_run_id, limit


def _stage5_sandbox_readiness_adapter_executions(
    store: AuditEventStore, workflow: dict[str, Any]
) -> list[dict[str, Any]]:
    executions = []
    for simulation in workflow["simulations"]:
        execution_id = str(simulation.get("adapterPaperExecutionId") or "").strip()
        if not execution_id:
            raise LookupError("terminal adapter paper execution id is missing")
        event = store.get(execution_id)
        if event is None:
            raise LookupError(f"terminal adapter paper execution {execution_id} was not found")
        execution = execution_adapter_paper_execution_payload_from_audit_event(event)
        if execution is None or execution.get("adapterPaperExecutionId") != event.event_id:
            raise ValueError("terminal adapter paper execution audit binding does not match")
        executions.append(execution)
    return executions


def _stage5_sandbox_readiness_decisions(
    store: AuditEventStore,
    base_run_id: str,
    *,
    limit: int = 50,
) -> list[dict[str, Any]]:
    decisions = []
    for event in store.list_recent(
        run_id=base_run_id,
        event_type="stage5_sandbox_readiness_decision",
        limit=50,
    ):
        decisions.append(_stage5_sandbox_readiness_decision_from_event(store, base_run_id, event))
        if len(decisions) >= limit:
            break
    return decisions


def _stage5_sandbox_readiness_decision_from_event(
    store: AuditEventStore, base_run_id: str, event: Any
) -> dict[str, Any]:
    decision = validate_stage5_sandbox_readiness_decision(event.metadata.get("snapshot"))
    if (
        decision["decisionId"] != event.event_id
        or decision["baseRunId"] != base_run_id
        or datetime.fromisoformat(decision["generatedAt"]) != event.created_at
        or event.stage != "stage5-sandbox-readiness"
        or event.source != decision["operator"]
    ):
        raise ValueError("stage5 sandbox readiness audit binding does not match")
    workflow = _stage5_shadow_source_workflow(store, base_run_id, decision["workflowHash"])
    session = next(
        (
            item for item in _stage5_shadow_sessions(store, base_run_id, decision["workflowHash"])
            if item["sessionHash"] == decision["shadowSessionHash"]
        ),
        None,
    )
    if session is None or session["sessionId"] != decision["shadowSessionId"]:
        raise ValueError("stage5 sandbox readiness source session is missing")
    rebuilt = build_stage5_sandbox_readiness_decision(
        workflow,
        session,
        _stage5_sandbox_readiness_adapter_executions(store, workflow),
        operator=decision["operator"],
        confirmed=True,
        generated_at=decision["generatedAt"],
    )
    if rebuilt != decision:
        raise ValueError("stage5 sandbox readiness decision does not match source evidence")
    return decision


def _stage5_sandbox_readiness_decision_by_hash(
    store: AuditEventStore, base_run_id: str, decision_hash: str
) -> dict[str, Any] | None:
    events = store.list_recent(
        run_id=base_run_id,
        event_type="stage5_sandbox_readiness_decision",
        query=decision_hash,
        limit=1,
    )
    if not events:
        return None
    decision = _stage5_sandbox_readiness_decision_from_event(store, base_run_id, events[0])
    return decision if decision["decisionHash"] == decision_hash else None


def _stage5_sandbox_readiness_query(raw_query: str) -> tuple[str, int]:
    query = parse_qs(raw_query, keep_blank_values=True)
    if set(query) - {"baseRunId", "limit"} or len(query.get("baseRunId", [])) != 1:
        raise ValueError("invalid_stage5_sandbox_readiness_query")
    base_run_id = query["baseRunId"][0].strip()
    raw_limit = query.get("limit", ["20"])
    if not base_run_id or len(raw_limit) != 1 or not raw_limit[0].isdigit():
        raise ValueError("invalid_stage5_sandbox_readiness_query")
    limit = int(raw_limit[0])
    if not 1 <= limit <= 50:
        raise ValueError("invalid_stage5_sandbox_readiness_query")
    return base_run_id, limit


def _stage5_sandbox_authorization_preflights(
    store: AuditEventStore,
    base_run_id: str,
    *,
    limit: int = 50,
) -> list[dict[str, Any]]:
    preflights = []
    for event in store.list_recent(
        run_id=base_run_id,
        event_type="stage5_sandbox_authorization_preflight",
        limit=50,
    ):
        preflights.append(
            _stage5_sandbox_authorization_preflight_from_event(store, base_run_id, event)
        )
        if len(preflights) >= limit:
            break
    return preflights


def _stage5_sandbox_authorization_preflight_from_event(
    store: AuditEventStore, base_run_id: str, event: Any
) -> dict[str, Any]:
    preflight = validate_stage5_sandbox_authorization_preflight(event.metadata.get("snapshot"))
    if (
        preflight["preflightId"] != event.event_id
        or preflight["baseRunId"] != base_run_id
        or datetime.fromisoformat(preflight["generatedAt"]) != event.created_at
        or event.stage != "stage5-sandbox-authorization-preflight"
        or event.source != preflight["operator"]
    ):
        raise ValueError("stage5 sandbox authorization preflight audit binding does not match")
    decision_event = store.get(preflight["readinessDecisionId"])
    decision = (
        _stage5_sandbox_readiness_decision_from_event(store, base_run_id, decision_event)
        if decision_event is not None
        else None
    )
    execution = _stage5_sandbox_authorization_probe_execution(
        store.get(preflight["sandboxProbeExecutionId"])
    )
    review = _stage5_sandbox_authorization_probe_review(
        store.get(preflight["sandboxProbeReviewId"])
    )
    if decision is None or execution is None or review is None:
        raise ValueError("stage5 sandbox authorization preflight source evidence is missing")
    rebuilt = build_stage5_sandbox_authorization_preflight(
        decision,
        execution,
        review,
        operator=preflight["operator"],
        confirmed=True,
        generated_at=preflight["generatedAt"],
    )
    if rebuilt != preflight:
        raise ValueError("stage5 sandbox authorization preflight does not match source evidence")
    return preflight


def _stage5_sandbox_authorization_preflight_by_hash(
    store: AuditEventStore, base_run_id: str, preflight_hash: str
) -> dict[str, Any] | None:
    events = store.list_recent(
        run_id=base_run_id,
        event_type="stage5_sandbox_authorization_preflight",
        query=preflight_hash,
        limit=1,
    )
    if not events:
        return None
    preflight = _stage5_sandbox_authorization_preflight_from_event(
        store, base_run_id, events[0]
    )
    return preflight if preflight["preflightHash"] == preflight_hash else None


def _stage5_sandbox_authorization_reviews(
    store: AuditEventStore, base_run_id: str, *, limit: int = 50
) -> list[dict[str, Any]]:
    reviews = []
    for event in store.list_recent(
        run_id=base_run_id,
        event_type="stage5_sandbox_authorization_review",
        limit=50,
    ):
        reviews.append(
            _stage5_sandbox_authorization_review_from_event(store, base_run_id, event)
        )
        if len(reviews) >= limit:
            break
    return reviews


def _stage5_sandbox_authorization_review_from_event(
    store: AuditEventStore, base_run_id: str, event: Any
) -> dict[str, Any]:
    review = validate_stage5_sandbox_authorization_review(event.metadata.get("snapshot"))
    if (
        review["reviewId"] != event.event_id
        or review["baseRunId"] != base_run_id
        or datetime.fromisoformat(review["generatedAt"]) != event.created_at
        or event.stage != "stage5-sandbox-authorization-review"
        or event.source != review["reviewer"]
    ):
        raise ValueError("stage5 sandbox authorization review audit binding does not match")
    preflight_event = store.get(review["preflightId"])
    preflight = (
        _stage5_sandbox_authorization_preflight_from_event(store, base_run_id, preflight_event)
        if preflight_event is not None
        else None
    )
    execution = (
        _stage5_sandbox_authorization_probe_execution(
            store.get(preflight["sandboxProbeExecutionId"])
        )
        if preflight is not None
        else None
    )
    if preflight is None or preflight["preflightHash"] != review["preflightHash"] or execution is None:
        raise ValueError("stage5 sandbox authorization review source evidence is missing")
    rebuilt = build_stage5_sandbox_authorization_review(
        preflight,
        execution,
        reviewer=review["reviewer"],
        outcome=review["outcome"],
        reason=review["reason"],
        confirmations={item: True for item in review["confirmedScopeIds"]},
        generated_at=review["generatedAt"],
    )
    if rebuilt != review:
        raise ValueError("stage5 sandbox authorization review does not match source evidence")
    return review


def _stage5_sandbox_authorization_preflight_query(raw_query: str) -> tuple[str, int]:
    try:
        return _stage5_sandbox_readiness_query(raw_query)
    except ValueError as error:
        raise ValueError("invalid_stage5_sandbox_authorization_preflight_query") from error


def _stage5_sandbox_authorization_probe_event_is_safe(event: Any, expected_stage: str) -> bool:
    metadata = getattr(event, "metadata", None)
    return bool(
        getattr(event, "stage", "") == expected_stage
        and getattr(event, "source", "") == "execution-adapter-ledger"
        and isinstance(metadata, dict)
        and metadata.get("paperOnly") is True
        and metadata.get("liveTradingAllowed") is False
    )


def _stage5_sandbox_authorization_sources_for_export(
    store: AuditEventStore, run_id: str, audit_events: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    result = list(audit_events)
    event_ids = {event["eventId"] for event in result}
    source_ids = [
        source_id
        for event in result
        if event.get("eventType") == "stage5_sandbox_authorization_preflight"
        for source_id in (
            event.get("metadata", {}).get("snapshot", {}).get("readinessDecisionId"),
            event.get("metadata", {}).get("snapshot", {}).get("sandboxProbeExecutionId"),
            event.get("metadata", {}).get("snapshot", {}).get("sandboxProbeReviewId"),
        )
        if isinstance(source_id, str) and source_id
    ]
    for source_id in source_ids:
        source_event = store.get(source_id)
        if source_event is not None and source_id not in event_ids:
            result.append({**audit_event_record_to_payload(source_event), "runId": run_id})
            event_ids.add(source_id)
    return result


def _stage5_sandbox_authorization_probe_execution(event: Any) -> dict[str, Any] | None:
    payload = (
        execution_adapter_sandbox_probe_execution_payload_from_audit_event(event)
        if event and _stage5_sandbox_authorization_probe_event_is_safe(
            event, "execution-adapter-sandbox-probe-execution"
        )
        else None
    )
    return payload if payload and payload["sandboxProbeExecutionId"] == event.event_id else None


def _stage5_sandbox_authorization_probe_review(event: Any) -> dict[str, Any] | None:
    payload = (
        execution_adapter_sandbox_probe_review_payload_from_audit_event(event)
        if event and _stage5_sandbox_authorization_probe_event_is_safe(
            event, "execution-adapter-sandbox-probe-review"
        )
        else None
    )
    return payload if payload and payload["sandboxProbeReviewId"] == event.event_id else None
