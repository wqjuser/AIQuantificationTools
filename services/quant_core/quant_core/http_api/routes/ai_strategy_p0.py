from __future__ import annotations

from ..support.ai_validation import (
    _ai_review_error_detail,
    _ai_review_http_projection,
    _ai_review_read_error_code,
    _is_ai_review_conflict,
    _validated_ai_review_http_request,
    _validated_ai_review_query,
)
from ..support.p0 import (
    _build_p0_ai_review_record,
    _latest_ready_p0_ai_review,
    _p0_ai_review_context_mismatch,
    _p0_backtest_engine_from_payload,
    _p0_data_limit_from_payload,
    _p0_paper_simulation_audit_event_payload,
    _p0_paper_simulation_response_payload,
    _p0_pipeline_response_payload,
    _p0_strategy_snapshot_from_payload,
    _strategy_snapshot_from_payload,
)
from ..support.stage5 import (
    _parse_limit,
    _watchlist_refresh_preparation_evidence,
)
from pathlib import Path
from quant_core.ai_review_runs import (
    AuthoritativeAiReviewRunRecord,
    ai_review_run_record_to_payload,
)
from quant_core.ai_review_stage3 import AiReviewStage3Error
from quant_core.execution import (
    build_promotion_candidate,
    create_paper_execution_from_audit,
    validate_paper_execution_handoff,
)
from quant_core.market_ai_selection import (
    MarketAiSelectionError,
    resolve_market_ai_selection_research_evidence,
)
from quant_core.p0_acceptance import load_p0_acceptance_status
from quant_core.research import (
    run_terminal_research,
    strategy_config_from_snapshot,
)
from quant_core.strategy_ai_drafts import (
    StrategyAiDraftError,
    generate_strategy_ai_draft,
)
from quant_core.strategy_experiments import (
    StrategyExperimentError,
    strategy_experiment_detail_to_payload,
    strategy_experiment_records_to_payload,
)
from quant_core.strategy_library import (
    strategy_library_record_to_payload,
    strategy_library_records_to_payload,
)
from quant_core.strategy_validation import (
    strategy_validation_to_payload,
    validate_strategy_snapshot,
)
from urllib.parse import (
    parse_qs,
    unquote,
)

def delete_strategies(self, parsed):
    revision = unquote(parsed.path.removeprefix("/api/strategies/")).strip()
    if not revision or "/" in revision:
        self._send_json({"error": "strategy_not_found", "revision": revision}, status=404)
        return
    record = self.strategy_store.get(revision)
    if record is None:
        self._send_json({"error": "strategy_not_found", "revision": revision}, status=404)
        return
    binding = self._auto_paper_trading_service().snapshot().get(
        "strategyBinding",
        {},
    )
    if isinstance(binding, dict) and binding.get("revision") == revision:
        self._send_json(
            {
                "error": "strategy_is_active_for_auto_trading",
                "detail": "请先暂停自动交易并恢复内置策略，再删除该版本。",
            },
            status=409,
        )
        return
    self.strategy_store.delete(revision)
    self._send_json({"deleted": True, "revision": revision})
    return


def post_ai_research_evidence(self, parsed, ai_research_review_id):
    if not ai_research_review_id:
        self._send_ai_research_m4_error(ValueError("ai_research_review_not_found"))
        return
    try:
        artifact = self._ai_research_m4_service().create_evidence(
            ai_research_review_id,
            self._read_json_body(),
        )
    except ValueError as error:
        self._send_ai_research_m4_error(error)
        return
    self._send_json({"researchEvidence": artifact}, status=201)
    return


def post_ai_research_outcomes(self, parsed):
    try:
        outcome = self._ai_research_m4_service().evaluate_outcome(
            self._read_json_body()
        )
    except ValueError as error:
        self._send_ai_research_m4_error(error)
        return
    self._send_json({"outcome": outcome}, status=201)
    return


def post_ai_review_decision(self, parsed, decision_review_id):
    if not decision_review_id:
        self._send_json(
            {"error": "ai_review_not_found", "detail": "AI review was not found."},
            status=404,
        )
        return
    try:
        decision = self._current_ai_review_decision_store().append(
            decision_review_id,
            self._read_json_body(),
        )
    except ValueError as error:
        self._send_ai_review_decision_error(error)
        return
    self._send_json({"decision": decision.record}, status=201)
    return


def post_ai_reviews(self, parsed):
    try:
        request = _validated_ai_review_http_request(self._read_json_body())
        review = self._ai_review_stage3_service().create_review(
            primary_experiment_id=request["primaryExperimentId"],
            comparison_experiment_ids=request["comparisonExperimentIds"],
            provider_id=request["providerId"],
            external_data_approved=request["externalDataApproved"],
        )
    except AiReviewStage3Error as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=error.status,
        )
        return
    except ValueError as error:
        code = str(error) or "invalid_ai_review_request"
        if code.startswith("request_body_"):
            code = "invalid_ai_review_request"
        status = 409 if _is_ai_review_conflict(code) else 400
        self._send_json({"error": code, "detail": _ai_review_error_detail(code)}, status=status)
        return
    self._send_json(
        {
            "review": {**review, "authority": "authoritative"},
            "latestDecision": None,
        },
        status=201,
    )
    return


def post_strategy_experiments(self, parsed):
    try:
        payload = self._read_json_body()
        replay_id: str | None = None
        if "replayOfExperimentId" in payload:
            raw_replay_id = payload.get("replayOfExperimentId")
            if (
                set(payload) != {"replayOfExperimentId"}
                or not isinstance(raw_replay_id, str)
                or not raw_replay_id.strip()
            ):
                raise ValueError("invalid_strategy_experiment")
            replay_id = raw_replay_id.strip()
        else:
            if set(payload) != {
                "strategyRevision",
                "sourceRunId",
                "assumptions",
                "dimensions",
                "guardrails",
                "walkForward",
            }:
                raise ValueError("invalid_strategy_experiment")
    except ValueError:
        self._send_json(
            {
                "error": "invalid_strategy_experiment",
                "detail": "Strategy experiment request fields are invalid.",
            },
            status=400,
        )
        return

    try:
        runner = self._strategy_experiment_runner()
        detail = runner.replay(replay_id) if replay_id is not None else runner.run_new(payload)
        experiment_payload = strategy_experiment_detail_to_payload(detail)
    except StrategyExperimentError as error:
        error_payload = {"error": error.error, "detail": error.detail}
        if error.experiment_id:
            error_payload["experimentId"] = error.experiment_id
        self._send_json(error_payload, status=error.status)
        return
    except Exception:
        self._send_json(
            {
                "error": "strategy_experiment_failed",
                "detail": "Strategy experiment execution failed.",
            },
            status=500,
        )
        return
    self._send_json({"experiment": experiment_payload}, status=201)
    return


def post_p0_pipeline(self, parsed):
    try:
        payload = self._read_json_body()
        market = str(payload.get("market") or "ashare").strip() or "ashare"
        symbol = str(payload.get("symbol") or "600000").strip() or "600000"
        timeframe = str(payload.get("timeframe") or "1d").strip() or "1d"
        watchlist_refresh_run_id = str(payload.get("watchlistRefreshRunId") or "").strip()
        strategy_snapshot = _p0_strategy_snapshot_from_payload(payload.get("strategyConfig"))
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
        data_preparation_evidence = _watchlist_refresh_preparation_evidence(
            self.watchlist_cache_refresh_store.get(watchlist_refresh_run_id),
            market=market,
            symbol=symbol,
            timeframe=timeframe,
        )
        selection_evidence = resolve_market_ai_selection_research_evidence(
            payload.get("selectionOrigin"),
            audit_store=self.audit_event_store,
            market=market,
            symbol=symbol,
            timeframe=timeframe,
        )
        workspace = run_terminal_research(
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            adapter=self.kline_adapter,
            assistant=self.assistant,
            engine=_p0_backtest_engine_from_payload(payload.get("assumptions")),
            cache=self.cache,
            run_store=self.run_store,
            data_limit=_p0_data_limit_from_payload(payload),
            strategy_snapshot=strategy_snapshot,
            data_preparation_evidence=data_preparation_evidence,
            market_ai_selection_evidence=selection_evidence,
            comparison_adapter=self._comparison_market_data_adapter(market, timeframe),
        )
        if not workspace.research_run:
            raise ValueError("p0_pipeline_run_missing")
        strategy = strategy_config_from_snapshot(
            workspace.strategy,
            market=workspace.selected_instrument.market,
            symbol=workspace.selected_instrument.symbol,
            timeframe=workspace.selected_timeframe,
        )
        self.strategy_store.save(strategy, audit_run_id=workspace.research_run.run_id)
        audit = self.run_store.get(workspace.research_run.run_id)
        if audit is None:
            raise ValueError("p0_pipeline_audit_missing")
    except MarketAiSelectionError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=error.status,
        )
        return
    except ValueError as error:
        self._send_json({"error": "invalid_p0_pipeline", "detail": str(error)}, status=400)
        return
    self._send_json(_p0_pipeline_response_payload(audit))
    return


def post_p0_ai_reviews(self, parsed):
    try:
        payload = self._read_json_body()
        run_id = str(payload.get("runId") or "").strip()
        audit = self.run_store.get(run_id) if run_id else None
        if not audit:
            self._send_json(
                {"status": "blocked", "error": "research_run_not_found", "runId": run_id},
                status=404,
            )
            return
        mismatch = _p0_ai_review_context_mismatch(audit, payload)
        if mismatch:
            self._send_json(
                {
                    "status": "blocked",
                    "error": "ai_review_context_mismatch",
                    "runContext": mismatch["runContext"],
                    "requestContext": mismatch["requestContext"],
                },
                status=409,
            )
            return
        review = self.ai_review_store.record(_build_p0_ai_review_record(audit))
    except ValueError as error:
        self._send_json({"status": "blocked", "error": "invalid_p0_ai_review", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "status": "ai_review_saved",
            "mode": "local_evidence_review",
            "aiReview": ai_review_run_record_to_payload(review),
            "paperOnly": True,
            "liveTradingAllowed": False,
            "directTradingInstructionBlocked": True,
        },
        status=201,
    )
    return


def post_p0_paper_simulations(self, parsed):
    try:
        payload = self._read_json_body()
        run_id = str(payload.get("runId") or "").strip()
        audit = self.run_store.get(run_id) if run_id else None
        if not audit:
            self._send_json(
                {"status": "blocked", "error": "research_run_not_found", "runId": run_id},
                status=404,
            )
            return
        mismatch = _p0_ai_review_context_mismatch(audit, payload)
        if mismatch:
            self._send_json(
                {
                    "status": "blocked",
                    "error": "paper_simulation_context_mismatch",
                    "runContext": mismatch["runContext"],
                    "requestContext": mismatch["requestContext"],
                },
                status=409,
            )
            return
        ai_review = _latest_ready_p0_ai_review(self.ai_review_store, audit)
        if ai_review is None:
            self._send_json(
                {
                    "status": "blocked",
                    "error": "p0_ai_review_required",
                    "runId": audit.run_id,
                    "detail": "Run P0 AI review before submitting a paper simulation.",
                    "paperOnly": True,
                    "liveTradingAllowed": False,
                    "orderSubmitted": False,
                    "liveOrderSubmitted": False,
                    "routeExecuted": False,
                },
                status=409,
            )
            return
        validate_paper_execution_handoff(audit)
        execution = create_paper_execution_from_audit(audit)
        self.paper_execution_store.record(execution)
        audit_event = self.audit_event_store.record(
            _p0_paper_simulation_audit_event_payload(
                audit=audit,
                execution=execution,
                ai_review=ai_review,
                request_payload=payload,
            )
        )
        executions = self.paper_execution_store.list_by_run(run_id, limit=20)
    except ValueError as error:
        self._send_json(
            {
                "status": "blocked",
                "error": "invalid_p0_paper_simulation",
                "detail": str(error),
                "paperOnly": True,
                "liveTradingAllowed": False,
                "orderSubmitted": False,
                "liveOrderSubmitted": False,
                "routeExecuted": False,
            },
            status=400,
        )
        return
    self._send_json(
        _p0_paper_simulation_response_payload(
            audit=audit,
            execution=execution,
            ai_review=ai_review,
            audit_event=audit_event,
            promotion=build_promotion_candidate(audit, executions),
        ),
        status=201,
    )
    return


def post_strategies_ai_drafts(self, parsed):
    try:
        payload = self._read_json_body()
        draft = generate_strategy_ai_draft(
            provider_registry=self._current_ai_review_provider_registry(),
            payload=payload,
        )
    except StrategyAiDraftError as error:
        self._send_json(
            {"error": error.code, "detail": error.detail},
            status=error.status,
        )
        return
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_strategy_ai_draft_request",
                "detail": str(error),
            },
            status=400,
        )
        return
    self._send_json(draft)
    return


def post_strategies_validate(self, parsed):
    try:
        payload = self._read_json_body()
        market = str(payload.get("market") or "ashare")
        symbol = str(payload.get("symbol") or "600000")
        timeframe = str(payload.get("timeframe") or "1d")
        audit_run_id = str(payload.get("auditRunId") or "").strip() or None
        snapshot = _strategy_snapshot_from_payload(payload.get("strategy"))
        validation = validate_strategy_snapshot(
            snapshot,
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            audit_run_id=audit_run_id,
        )
    except ValueError as error:
        self._send_json({"error": "invalid_strategy", "detail": str(error)}, status=400)
        return
    self._send_json({"validation": strategy_validation_to_payload(validation)})
    return


def post_strategies(self, parsed):
    try:
        payload = self._read_json_body()
        market = str(payload.get("market") or "ashare")
        symbol = str(payload.get("symbol") or "600000")
        timeframe = str(payload.get("timeframe") or "1d")
        snapshot = _strategy_snapshot_from_payload(payload.get("strategy"))
        audit_run_id = str(payload.get("auditRunId") or "").strip() or None
        validation = validate_strategy_snapshot(
            snapshot,
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            audit_run_id=audit_run_id,
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
        strategy = strategy_config_from_snapshot(snapshot, market=market, symbol=symbol, timeframe=timeframe)
        record = self.strategy_store.save(strategy, audit_run_id=audit_run_id)
    except ValueError as error:
        self._send_json({"error": "invalid_strategy", "detail": str(error)}, status=400)
        return
    self._send_json({"strategy": strategy_library_record_to_payload(record)}, status=201)
    return


def get_ai_research_evidence(self, parsed, ai_research_review_id):
    if not ai_research_review_id:
        self._send_ai_research_m4_error(ValueError("ai_research_review_not_found"))
        return
    try:
        artifact = self._ai_research_m4_service().get_latest(ai_research_review_id)
        outcomes = self._ai_research_m4_service().list_outcomes(ai_research_review_id)
    except ValueError as error:
        self._send_ai_research_m4_error(error)
        return
    self._send_json({"researchEvidence": artifact, "outcomes": outcomes})
    return


def get_ai_review_providers(self, parsed):
    self._send_json(
        {
            "providers": [
                {
                    "providerId": status.provider_id,
                    "configured": status.configured,
                    "model": status.model,
                    "sanitizedBaseUrl": status.sanitized_base_url,
                }
                for status in self._current_ai_review_provider_registry().statuses()
            ]
        }
    )
    return


def get_ai_review_decision(self, parsed, decision_review_id):
    if not decision_review_id:
        self._send_json(
            {"error": "ai_review_not_found", "detail": "AI review was not found."},
            status=404,
        )
        return
    try:
        decisions = self._current_ai_review_decision_store().list_by_review(
            decision_review_id
        )
    except ValueError as error:
        self._send_ai_review_decision_error(error)
        return
    self._send_json({"decisions": [decision.record for decision in decisions]})
    return


def get_ai_reviews(self, parsed):
    try:
        query = _validated_ai_review_query(parsed.query)
    except ValueError:
        self._send_json(
            {
                "error": "invalid_ai_review_query",
                "detail": _ai_review_error_detail("invalid_ai_review_query"),
            },
            status=400,
        )
        return
    try:
        reviews = self.ai_review_store.list_recent(
            run_id=query["runId"],
            experiment_id=query["experimentId"],
            limit=query["limit"],
            offset=query["offset"],
            query=query["query"],
        )
        total = self.ai_review_store.count_recent(
            run_id=query["runId"],
            experiment_id=query["experimentId"],
            query=query["query"],
        )
    except ValueError as error:
        code = _ai_review_read_error_code(error)
        self._send_json(
            {"error": code, "detail": _ai_review_error_detail(code)},
            status=409,
        )
        return
    self._send_json(
        {
            "reviews": [_ai_review_http_projection(review) for review in reviews],
            "pagination": {
                "limit": query["limit"],
                "offset": query["offset"],
                "total": total,
                "query": query["query"],
            },
        }
    )
    return


def get_ai_review_detail(self, parsed):
    ai_review_id = unquote(parsed.path.removeprefix("/api/ai-reviews/")).strip()
    try:
        review = self.ai_review_store.get(ai_review_id) if ai_review_id and "/" not in ai_review_id else None
    except ValueError as error:
        code = _ai_review_read_error_code(error)
        self._send_json({"error": code, "detail": _ai_review_error_detail(code)}, status=409)
        return
    if review is None:
        self._send_json(
            {"error": "ai_review_not_found", "detail": "AI review was not found."},
            status=404,
        )
        return
    latest_decision = None
    if isinstance(review, AuthoritativeAiReviewRunRecord):
        try:
            latest_decision = self._current_ai_review_decision_store().latest(
                ai_review_id
            )
        except ValueError as error:
            self._send_ai_review_decision_error(error)
            return
    self._send_json(
        {
            "review": _ai_review_http_projection(review),
            "latestDecision": latest_decision.record if latest_decision is not None else None,
        }
    )
    return


def get_strategy_experiments(self, parsed):
    query = parse_qs(parsed.query)
    try:
        records = self.strategy_experiment_store.list_recent(
            strategy_revision=query.get("strategyRevision", [""])[0].strip() or None,
            source_run_id=query.get("sourceRunId", [""])[0].strip() or None,
            limit=_parse_limit(query.get("limit", ["20"])[0]),
        )
        experiments_payload = strategy_experiment_records_to_payload(records)
    except Exception:
        self._send_json(
            {
                "error": "strategy_experiment_failed",
                "detail": "Strategy experiment history could not be loaded.",
            },
            status=500,
        )
        return
    self._send_json({"experiments": experiments_payload})
    return


def get_strategy_experiment_detail(self, parsed):
    experiment_id = unquote(parsed.path.removeprefix("/api/strategy-experiments/")).strip()
    try:
        detail = self.strategy_experiment_store.get(experiment_id) if experiment_id else None
        experiment_payload = strategy_experiment_detail_to_payload(detail) if detail is not None else None
    except Exception:
        self._send_json(
            {
                "error": "strategy_experiment_failed",
                "detail": "Strategy experiment could not be loaded.",
            },
            status=500,
        )
        return
    if detail is None:
        self._send_json(
            {
                "error": "strategy_experiment_not_found",
                "detail": f"Strategy experiment {experiment_id} was not found.",
            },
            status=404,
        )
        return
    self._send_json({"experiment": experiment_payload})
    return


def get_p0_acceptance_latest(self, parsed):
    self._send_json({"acceptance": load_p0_acceptance_status(Path(self.p0_acceptance_report_path))})
    return


def get_strategies(self, parsed):
    query = parse_qs(parsed.query)
    market = query.get("market", [""])[0].strip() or None
    symbol = query.get("symbol", [""])[0].strip() or None
    limit = _parse_limit(query.get("limit", ["20"])[0])
    records = self.strategy_store.list_recent(market=market, symbol=symbol, limit=limit)
    self._send_json(strategy_library_records_to_payload(records))
    return


def get_strategy_detail(self, parsed):
    revision = unquote(parsed.path.removeprefix("/api/strategies/")).strip()
    record = self.strategy_store.get(revision)
    if not record:
        self._send_json({"error": "strategy_not_found", "revision": revision}, status=404)
        return
    self._send_json({"strategy": strategy_library_record_to_payload(record)})
    return
