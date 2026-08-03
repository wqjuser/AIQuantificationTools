from __future__ import annotations

import queue
from ..support.ai_validation import _ai_review_http_projection
from ..support.execution_export import _adapter_paper_executions_for_export
from ..support.p0 import _strategy_snapshot_from_query
from ..support.research_import_archive import _ai_review_decision_archive_payload
from ..support.research_import_codecs import (
    _backtest_engine_from_query,
    _parse_kline_end,
    _parse_optional_datetime,
)
from ..support.stage5 import (
    _parse_limit,
    _parse_offset,
    _parse_research_data_limit,
    _stage5_sandbox_authorization_sources_for_export,
    _watchlist_refresh_preparation_evidence,
)
from ..support.transport import _client_connection_closed
from quant_core.ai_review_runs import (
    AiReviewRunRecord,
    AuthoritativeAiReviewRunRecord,
    ai_review_run_record_to_payload,
)
from quant_core.audit_events import (
    audit_event_record_to_payload,
    is_protected_production_authority_audit_event,
)
from quant_core.execution import (
    build_promotion_candidate,
    create_paper_execution_from_audit,
    paper_execution_record_to_payload,
    portfolio_paper_order_approval_to_payload,
    portfolio_paper_order_batch_to_payload,
    portfolio_paper_order_simulation_to_payload,
    validate_paper_execution_handoff,
)
from quant_core.handoff_notes import (
    create_handoff_note_id,
    handoff_note_to_audit_event_payload,
    handoff_note_to_payload,
)
from quant_core.research import (
    run_terminal_research,
    strategy_config_from_snapshot,
)
from quant_core.research_note_drafts import (
    ResearchNoteDraftError,
    generate_research_note_draft,
    iter_generate_research_note_draft_stream_events,
)
from quant_core.research_notes import research_note_to_payload
from quant_core.runs import (
    research_run_audit_to_payload,
    research_run_audits_to_payload,
    research_run_export_to_payload,
)
from quant_core.strategy_validation import (
    strategy_validation_to_payload,
    validate_strategy_snapshot,
)
from quant_core.terminal import terminal_workspace_to_payload
from quant_core.workspace_state import research_workspace_state_to_payload
from threading import (
    Event,
    Thread,
)
from urllib.parse import (
    parse_qs,
    unquote,
)

def put_research_workspace_state(self, parsed):
    try:
        payload = self._read_json_body()
        raw_state = payload.get("state")
        if not isinstance(raw_state, dict):
            raise ValueError("workspace_state_must_be_object")
        state = self.workspace_state_store.save(raw_state)
    except ValueError as error:
        self._send_json({"error": "invalid_workspace_state", "detail": str(error)}, status=400)
        return
    self._send_json({"state": research_workspace_state_to_payload(state)})
    return


def post_research_note_drafts(self, parsed):
    try:
        payload = self._read_json_body()
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_research_note_draft_request",
                "detail": str(error),
            },
            status=400,
        )
        return
    stream_requested = "application/x-ndjson" in (
        self.headers.get("Accept") or ""
    ).casefold()
    if stream_requested:
        self._begin_ndjson_stream()
        if not self._send_ndjson_event({"type": "started"}):
            return
        cancelled = Event()
        stream_items: queue.Queue[object] = queue.Queue()
        stream_end = object()

        def generate_stream_events() -> None:
            try:
                for event in iter_generate_research_note_draft_stream_events(
                    cache=self.cache,
                    provider_registry=self._current_ai_review_provider_registry(),
                    payload=payload,
                    cancelled=cancelled,
                ):
                    if cancelled.is_set():
                        break
                    stream_items.put(event)
            except Exception as error:
                stream_items.put(error)
            finally:
                stream_items.put(stream_end)

        worker = Thread(
            target=generate_stream_events,
            name="research-note-draft-stream",
            daemon=True,
        )
        worker.start()
        try:
            while True:
                if _client_connection_closed(self.connection):
                    return
                try:
                    item = stream_items.get(timeout=0.1)
                except queue.Empty:
                    continue
                if item is stream_end:
                    return
                if isinstance(item, Exception):
                    raise item
                if not self._send_ndjson_event(item):
                    return
        except ResearchNoteDraftError as error:
            self._send_ndjson_event(
                {
                    "type": "error",
                    "error": error.code,
                    "detail": error.detail,
                    "status": error.status,
                }
            )
        finally:
            cancelled.set()
            worker.join(timeout=0.5)
        return
    try:
        draft = generate_research_note_draft(
            cache=self.cache,
            provider_registry=self._current_ai_review_provider_registry(),
            payload=payload,
        )
    except ResearchNoteDraftError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=error.status,
        )
        return
    self._send_json(draft)
    return


def post_research_notes(self, parsed):
    try:
        payload = self._read_json_body()
        note = self.note_store.save(
            market=str(payload.get("market") or ""),
            symbol=str(payload.get("symbol") or ""),
            timeframe=str(payload.get("timeframe") or ""),
            body=str(payload.get("body") or ""),
        )
    except ValueError as error:
        self._send_json({"error": "invalid_research_note", "detail": str(error)}, status=400)
        return
    self._send_json({"note": research_note_to_payload(note)}, status=201)
    return


def post_handoff_notes(self, parsed):
    try:
        payload = self._read_json_body()
        note_id = str(payload.get("noteId") or "").strip() or create_handoff_note_id()
        audit_event_id = str(payload.get("auditEventId") or "").strip() or f"handoff-note:{note_id}"
        existing_event = self.audit_event_store.get(audit_event_id)
        if (
            is_protected_production_authority_audit_event("", audit_event_id)
            or existing_event is not None
            and is_protected_production_authority_audit_event(
                existing_event.event_type, existing_event.event_id
            )
        ):
            raise ValueError("production authority audit events are reserved")
        note = self.handoff_note_store.save(
            note_id=note_id,
            subject_type=str(payload.get("subjectType") or ""),
            subject_id=str(payload.get("subjectId") or ""),
            body=str(payload.get("body") or ""),
            author=str(payload.get("author") or "local-operator"),
            source_workspace=str(payload.get("sourceWorkspace") or "local"),
            updated_at=_parse_optional_datetime(payload.get("updatedAt")),
            audit_event_id=audit_event_id,
        )
        audit_event = self.audit_event_store.record(handoff_note_to_audit_event_payload(note))
    except ValueError as error:
        self._send_json({"error": "invalid_handoff_note", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "handoffNote": handoff_note_to_payload(note),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=201,
    )
    return


def post_legacy_research_run_ai_reviews(self, parsed):
    self._send_json(
        {
            "error": "legacy_ai_review_write_retired",
            "detail": (
                "Client-supplied v1 AI review writes are retired; use experiment-backed "
                "POST /api/ai-reviews."
            ),
        },
        status=410,
    )
    return


def post_research_run_paper_executions(self, parsed):
    run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/paper-executions")).strip()
    audit = self.run_store.get(run_id) if run_id else None
    if not audit:
        self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
        return
    try:
        validate_paper_execution_handoff(audit)
        execution = create_paper_execution_from_audit(audit)
    except ValueError as error:
        self._send_json({"error": "invalid_paper_execution", "detail": str(error)}, status=400)
        return
    self.paper_execution_store.record(execution)
    executions = self.paper_execution_store.list_by_run(run_id, limit=20)
    self._send_json(
        {
            "execution": paper_execution_record_to_payload(execution),
            "promotion": build_promotion_candidate(audit, executions),
        },
        status=201,
    )
    return


def get_research_workspace_state(self, parsed):
    state = self.workspace_state_store.get()
    self._send_json({"state": research_workspace_state_to_payload(state) if state else None})
    return


def get_research_notes(self, parsed):
    query = parse_qs(parsed.query)
    try:
        note = self.note_store.get(
            market=query.get("market", ["ashare"])[0],
            symbol=query.get("symbol", ["600000"])[0],
            timeframe=query.get("timeframe", ["1d"])[0],
        )
    except ValueError as error:
        self._send_json({"error": "invalid_research_note", "detail": str(error)}, status=400)
        return
    self._send_json({"note": research_note_to_payload(note)})
    return


def get_handoff_notes(self, parsed):
    query = parse_qs(parsed.query)
    subject_type = query.get("subjectType", [""])[0].strip()
    subject_id = query.get("subjectId", [""])[0].strip()
    limit = _parse_limit(query.get("limit", ["20"])[0])
    try:
        notes = self.handoff_note_store.list_by_subject(
            subject_type=subject_type,
            subject_id=subject_id,
            limit=limit,
        )
        total = self.handoff_note_store.count_by_subject(
            subject_type=subject_type,
            subject_id=subject_id,
        )
    except ValueError as error:
        self._send_json({"error": "invalid_handoff_note_query", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "handoffNotes": [handoff_note_to_payload(note) for note in notes],
            "pagination": {
                "limit": limit,
                "offset": 0,
                "total": total,
            },
        }
    )
    return


def get_research_run(self, parsed):
    query = parse_qs(parsed.query)
    market = query.get("market", ["ashare"])[0]
    symbol = query.get("symbol", ["600000"])[0]
    timeframe = query.get("timeframe", ["1d"])[0]
    watchlist_refresh_run_id = query.get("watchlistRefreshRunId", [""])[0].strip()
    try:
        data_end = _parse_kline_end(query.get("end", [""])[0])
    except ValueError as error:
        self._send_json({"error": "invalid_kline_end", "detail": str(error)}, status=400)
        return
    strategy_snapshot = _strategy_snapshot_from_query(query)
    if strategy_snapshot:
        validation = validate_strategy_snapshot(
            strategy_snapshot,
            market=market,
            symbol=symbol,
            timeframe=timeframe,
        )
        if validation.status == "blocked":
            self._send_json(
                {
                    "error": "strategy_not_ready",
                    "detail": "strategy_preflight_blocked",
                    "validation": strategy_validation_to_payload(validation),
                },
                status=400,
            )
            return
    research_note = research_note_to_payload(
        self.note_store.get(market=market, symbol=symbol, timeframe=timeframe)
    )
    data_preparation_evidence = _watchlist_refresh_preparation_evidence(
        self.watchlist_cache_refresh_store.get(watchlist_refresh_run_id),
        market=market,
        symbol=symbol,
        timeframe=timeframe,
    )
    try:
        workspace = run_terminal_research(
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            adapter=self.kline_adapter,
            assistant=self.assistant,
            engine=_backtest_engine_from_query(query),
            cache=self.cache,
            run_store=self.run_store,
            data_limit=_parse_research_data_limit(query.get("limit", ["500"])[0]),
            data_end=data_end,
            strategy_snapshot=strategy_snapshot,
            research_note=research_note,
            data_preparation_evidence=data_preparation_evidence,
            comparison_adapter=self._comparison_market_data_adapter(market, timeframe),
        )
    except ValueError as error:
        detail = str(error)
        status = 409 if detail.startswith(("research_data_quality_blocked", "research_cross_source")) else 400
        self._send_json({"error": "research_run_blocked", "detail": detail}, status=status)
        return
    if workspace.research_run:
        strategy = strategy_config_from_snapshot(
            workspace.strategy,
            market=workspace.selected_instrument.market,
            symbol=workspace.selected_instrument.symbol,
            timeframe=workspace.selected_timeframe,
        )
        self.strategy_store.save(strategy, audit_run_id=workspace.research_run.run_id)
    self._send_json(terminal_workspace_to_payload(workspace))
    return


def get_research_run_production_strategy_handoff(self, parsed):
    run_id = unquote(
        parsed.path
        .removeprefix("/api/research/runs/")
        .removesuffix("/production-strategy-handoff")
    ).strip()
    try:
        handoff = self._auto_paper_trading_service().preflight_strategy_binding(
            run_id
        )
    except ValueError as error:
        detail = str(error)
        status = (
            404
            if detail in {
                "strategy_binding_audit_run_not_found",
                "strategy_binding_strategy_not_found",
            }
            else 500
            if detail == "strategy_binding_store_unavailable"
            else 409
        )
        self._send_json(
            {
                "error": "production_strategy_handoff_blocked",
                "detail": detail,
            },
            status=status,
        )
        return
    self._send_json({"productionStrategyHandoff": handoff})
    return


def get_research_run_paper_executions(self, parsed):
    run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/paper-executions")).strip()
    audit = self.run_store.get(run_id) if run_id else None
    if not audit:
        self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
        return
    executions = self.paper_execution_store.list_by_run(run_id, limit=20)
    self._send_json({"executions": [paper_execution_record_to_payload(execution) for execution in executions]})
    return


def get_research_run_ai_reviews(self, parsed):
    run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/ai-reviews")).strip()
    audit = self.run_store.get(run_id) if run_id else None
    if not audit:
        self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
        return
    query = parse_qs(parsed.query)
    limit = _parse_limit(query.get("limit", ["20"])[0])
    offset = _parse_offset(query.get("offset", ["0"])[0])
    search_query = query.get("query", [""])[0].strip()
    reviews = self.ai_review_store.list_by_run(run_id, limit=limit, offset=offset, query=search_query)
    total = self.ai_review_store.count_by_run(run_id, query=search_query)
    self._send_json(
        {
            "aiReviews": [ai_review_run_record_to_payload(review) for review in reviews],
            "authoritativeAiReviews": [
                _ai_review_http_projection(review)
                for review in reviews
                if isinstance(review, AuthoritativeAiReviewRunRecord)
            ],
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total,
                "query": search_query,
            },
        }
    )
    return


def get_research_run_promotion(self, parsed):
    run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/promotion")).strip()
    audit = self.run_store.get(run_id) if run_id else None
    if not audit:
        self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
        return
    executions = self.paper_execution_store.list_by_run(run_id, limit=20)
    self._send_json({"promotion": build_promotion_candidate(audit, executions)})
    return


def get_research_run_export(self, parsed):
    run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/export")).strip()
    audit = self.run_store.get(run_id) if run_id else None
    if not audit:
        self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
        return
    executions = [
        paper_execution_record_to_payload(execution)
        for execution in self.paper_execution_store.list_by_run(run_id, limit=20)
    ]
    adapter_paper_executions = _adapter_paper_executions_for_export(
        self.audit_event_store,
        market=audit.market,
        limit=20,
    )
    portfolio_paper_orders = [
        portfolio_paper_order_batch_to_payload(batch)
        for batch in self.portfolio_paper_order_store.list_by_base_run(run_id, limit=20)
    ]
    portfolio_paper_order_approvals = [
        portfolio_paper_order_approval_to_payload(approval)
        for approval in self.portfolio_paper_order_approval_store.list_all_by_base_run(run_id)
    ]
    portfolio_paper_order_simulations = [
        portfolio_paper_order_simulation_to_payload(simulation)
        for simulation in self.portfolio_paper_order_simulation_store.list_all_by_base_run(run_id)
    ]
    try:
        stored_ai_reviews = self.ai_review_store.list_all_by_run(run_id)
        ai_reviews = [
            ai_review_run_record_to_payload(review)
            for review in stored_ai_reviews
            if isinstance(review, AiReviewRunRecord)
        ]
        authoritative_ai_reviews = [
            review
            for review in stored_ai_reviews
            if isinstance(review, AuthoritativeAiReviewRunRecord)
        ]
        ai_review_decisions = [
            _ai_review_decision_archive_payload(decision)
            for review in authoritative_ai_reviews
            for decision in self._current_ai_review_decision_store().list_by_review(
                review.ai_review_id
            )
        ]
    except ValueError:
        self._send_json({"error": "invalid_ai_review_archive"}, status=400)
        return
    audit_events = [
        audit_event_record_to_payload(event)
        for event in self.audit_event_store.list_all_by_run(run_id)
    ]
    audit_events = _stage5_sandbox_authorization_sources_for_export(
        self.audit_event_store, run_id, audit_events
    )
    handoff_notes = [handoff_note_to_payload(note) for note in self.handoff_note_store.list_by_run(run_id, limit=50)]
    promotion_candidate = build_promotion_candidate(audit, self.paper_execution_store.list_by_run(run_id, limit=20))
    self._send_json(
        {
            "export": research_run_export_to_payload(
                audit,
                paper_executions=executions,
                adapter_paper_executions=adapter_paper_executions,
                portfolio_paper_orders=portfolio_paper_orders,
                portfolio_paper_order_approvals=portfolio_paper_order_approvals,
                portfolio_paper_order_simulations=portfolio_paper_order_simulations,
                promotion_candidate=promotion_candidate,
                ai_review_runs=ai_reviews,
                ai_review_runs_v2=[
                    ai_review_run_record_to_payload(review)
                    for review in authoritative_ai_reviews
                ],
                ai_review_decisions=ai_review_decisions,
                audit_events=audit_events,
                handoff_notes=handoff_notes,
            )
        }
    )
    return


def get_research_run_detail(self, parsed):
    run_id = unquote(parsed.path.removeprefix("/api/research/runs/")).strip()
    audit = self.run_store.get(run_id) if run_id else None
    if not audit:
        self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
        return
    self._send_json({"run": research_run_audit_to_payload(audit, include_data_snapshot=True)})
    return


def get_research_run_history(self, parsed):
    query = parse_qs(parsed.query)
    limit = _parse_limit(query.get("limit", ["10"])[0])
    self._send_json(research_run_audits_to_payload(self.run_store.list_recent(limit=limit)))
    return
