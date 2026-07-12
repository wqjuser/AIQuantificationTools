from __future__ import annotations

import json
import os
import uuid
from dataclasses import asdict
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from quant_core.adapters import DemoMarketDataAdapter
from quant_core.audit_events import AuditEventStore, audit_event_record_to_payload
from quant_core.audit_signing import (
    AUDIT_REPORT_IMPORT_VERIFICATION_INVALID_REASON,
    AuditReportSigner,
    audit_signing_key_controlled_restart_evidence_to_audit_event_payload,
    audit_signing_key_controlled_restart_evidence_to_payload,
    audit_signing_key_environment_binding_payload_from_audit_event,
    audit_signing_key_environment_binding_to_audit_event_payload,
    audit_signing_key_environment_binding_to_payload,
    audit_signing_key_rotation_acceptance_payload_from_audit_event,
    audit_signing_key_rotation_acceptance_to_audit_event_payload,
    audit_signing_key_rotation_acceptance_to_payload,
    audit_signing_key_runtime_reload_execution_payload_from_audit_event,
    audit_signing_key_runtime_reload_execution_to_audit_event_payload,
    audit_signing_key_runtime_reload_execution_to_payload,
    audit_signing_key_runtime_reload_plan_payload_from_audit_event,
    audit_signing_key_runtime_reload_plan_to_audit_event_payload,
    audit_signing_key_runtime_reload_plan_to_payload,
    audit_signing_key_secret_materialization_payload_from_audit_event,
    audit_signing_key_secret_materialization_to_audit_event_payload,
    audit_signing_key_secret_materialization_to_payload,
    audit_report_verification_to_payload,
    audit_signing_key_rotation_apply_to_payload,
    audit_signing_key_registry_to_payload,
    audit_signing_key_rotation_plan_to_payload,
)
from quant_core.ai_review_decisions import (
    AiReviewDecisionStore,
    validate_ai_review_decision_archive_records,
)
from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.ai_review_runs import (
    AiReviewRunRecord,
    AiReviewRunStore,
    AuthoritativeAiReviewRunRecord,
    ai_review_run_record_to_payload,
    validate_ai_review_archive_records,
)
from quant_core.ai_review_stage3 import (
    AiReviewEvidenceAssembler,
    AiReviewStage3Error,
    AiReviewStage3Service,
    DeterministicAiReviewEngine,
)
from quant_core.ai import LocalResearchAssistant
from quant_core.backtest import BacktestEngine
from quant_core.cache import MarketDataCache
from quant_core.cache_refresh_runs import (
    WatchlistCacheRefreshRun,
    WatchlistCacheRefreshRunStore,
    create_watchlist_cache_refresh_run,
    watchlist_cache_refresh_item_from_quality,
    watchlist_cache_refresh_run_to_payload,
)
from quant_core.adapter_error_ledger import (
    MarketDataAdapterErrorStore,
    create_market_data_adapter_error_event,
    market_data_adapter_error_event_to_payload,
)
from quant_core.domain import (
    AiResearchRequest,
    BacktestMetrics,
    BacktestRun,
    Condition,
    DataQuality,
    EquityPoint,
    MarketDataRequest,
    OHLCVBar,
    RiskRules,
    StrategyConfig,
)
from quant_core.execution import (
    ExecutionAdapterCertificationStore,
    PaperExecutionRecord,
    PaperExecutionStore,
    PortfolioPaperOrderApproval,
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderApprovalStore,
    PortfolioPaperOrderSimulation,
    PortfolioPaperOrderSimulationStore,
    PortfolioPaperOrderStore,
    build_portfolio_paper_order_lifecycle,
    build_portfolio_paper_order_replay,
    build_portfolio_paper_order_state_history,
    build_promotion_candidate,
    build_execution_adapter_certification_apply,
    build_execution_adapter_controlled_restart_evidence,
    build_execution_adapter_environment_binding,
    build_execution_adapter_human_confirmation,
    build_execution_adapter_orchestration_dry_run,
    build_execution_adapter_orchestration_execution,
    build_execution_adapter_ops_state,
    build_execution_adapter_paper_execution,
    build_execution_adapter_paper_order_lifecycle,
    build_execution_adapter_paper_route_runbook,
    build_execution_adapter_production_route_review,
    build_execution_adapter_restart_acceptance,
    build_execution_adapter_runtime_reload_acceptance,
    build_execution_adapter_runtime_reload_execution,
    build_execution_adapter_runtime_reload_plan,
    build_execution_adapter_sandbox_order_schema_dry_run,
    build_execution_adapter_sandbox_probe_execution,
    build_execution_adapter_sandbox_probe_plan,
    build_execution_adapter_sandbox_probe_review,
    build_execution_adapter_secret_manifest_validation,
    build_execution_adapter_secret_materialization,
    build_execution_adapter_secret_reference,
    create_execution_adapter_certification_run,
    create_paper_execution_from_audit,
    create_portfolio_paper_order_approval,
    create_portfolio_paper_order_batch,
    create_portfolio_paper_order_simulation,
    execution_adapter_certification_apply_payload_from_audit_event,
    execution_adapter_certification_apply_to_audit_event_payload,
    execution_adapter_certification_apply_to_payload,
    execution_adapter_controlled_restart_evidence_payload_from_audit_event,
    execution_adapter_controlled_restart_evidence_to_audit_event_payload,
    execution_adapter_controlled_restart_evidence_to_payload,
    execution_adapter_environment_binding_payload_from_audit_event,
    execution_adapter_environment_binding_to_audit_event_payload,
    execution_adapter_environment_binding_to_payload,
    execution_adapter_human_confirmation_payload_from_audit_event,
    execution_adapter_human_confirmation_to_audit_event_payload,
    execution_adapter_human_confirmation_to_payload,
    execution_adapter_orchestration_dry_run_payload_from_audit_event,
    execution_adapter_orchestration_dry_run_to_audit_event_payload,
    execution_adapter_orchestration_dry_run_to_payload,
    execution_adapter_orchestration_execution_payload_from_audit_event,
    execution_adapter_orchestration_execution_to_audit_event_payload,
    execution_adapter_orchestration_execution_to_payload,
    execution_adapter_ops_state_payload_from_audit_event,
    execution_adapter_ops_state_to_audit_event_payload,
    execution_adapter_ops_state_to_payload,
    execution_adapter_paper_execution_payload_from_audit_event,
    execution_adapter_paper_execution_to_audit_event_payload,
    execution_adapter_paper_execution_to_payload,
    execution_adapter_paper_order_lifecycle_payload_from_audit_event,
    execution_adapter_paper_order_lifecycle_to_audit_event_payload,
    execution_adapter_paper_order_lifecycle_to_payload,
    execution_adapter_paper_route_runbook_payload_from_audit_event,
    execution_adapter_paper_route_runbook_to_audit_event_payload,
    execution_adapter_paper_route_runbook_to_payload,
    execution_adapter_production_route_review_payload_from_audit_event,
    execution_adapter_production_route_review_to_audit_event_payload,
    execution_adapter_production_route_review_to_payload,
    execution_adapter_restart_acceptance_payload_from_audit_event,
    execution_adapter_restart_acceptance_to_audit_event_payload,
    execution_adapter_restart_acceptance_to_payload,
    execution_adapter_runtime_reload_plan_payload_from_audit_event,
    execution_adapter_runtime_reload_plan_to_audit_event_payload,
    execution_adapter_runtime_reload_plan_to_payload,
    execution_adapter_sandbox_probe_execution_payload_from_audit_event,
    execution_adapter_sandbox_probe_execution_to_audit_event_payload,
    execution_adapter_sandbox_probe_execution_to_payload,
    execution_adapter_sandbox_probe_plan_payload_from_audit_event,
    execution_adapter_sandbox_probe_plan_to_audit_event_payload,
    execution_adapter_sandbox_probe_plan_to_payload,
    execution_adapter_sandbox_probe_review_payload_from_audit_event,
    execution_adapter_sandbox_probe_review_to_audit_event_payload,
    execution_adapter_sandbox_probe_review_to_payload,
    execution_adapter_runtime_reload_acceptance_payload_from_audit_event,
    execution_adapter_runtime_reload_acceptance_to_audit_event_payload,
    execution_adapter_runtime_reload_acceptance_to_payload,
    execution_adapter_runtime_reload_execution_payload_from_audit_event,
    execution_adapter_runtime_reload_execution_to_audit_event_payload,
    execution_adapter_runtime_reload_execution_to_payload,
    execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event,
    execution_adapter_sandbox_order_schema_dry_run_to_audit_event_payload,
    execution_adapter_sandbox_order_schema_dry_run_to_payload,
    execution_adapter_secret_manifest_validation_payload_from_audit_event,
    execution_adapter_secret_manifest_validation_to_audit_event_payload,
    execution_adapter_secret_manifest_validation_to_payload,
    execution_adapter_secret_materialization_payload_from_audit_event,
    execution_adapter_secret_materialization_to_audit_event_payload,
    execution_adapter_secret_materialization_to_payload,
    execution_adapter_secret_reference_payload_from_audit_event,
    execution_adapter_secret_reference_to_audit_event_payload,
    execution_adapter_secret_reference_to_payload,
    materialize_execution_adapter_secret_manifest,
    execution_adapter_certification_to_audit_event_payload,
    execution_adapter_certification_to_payload,
    paper_execution_payload_to_record,
    paper_execution_record_to_payload,
    portfolio_paper_order_approval_to_audit_event_payload,
    portfolio_paper_order_approval_to_payload,
    portfolio_paper_order_approvals_to_map,
    portfolio_paper_order_batch_to_audit_event_payload,
    portfolio_paper_order_batch_to_payload,
    portfolio_paper_order_payload_to_approval,
    portfolio_paper_order_payload_to_batch,
    portfolio_paper_order_payload_to_simulation,
    portfolio_paper_order_simulation_to_audit_event_payload,
    portfolio_paper_order_simulation_to_payload,
    validate_paper_execution_handoff,
)
from quant_core.execution_adapter_health import (
    execution_adapter_health_probe_to_evidence,
    execution_adapter_health_probe_to_payload,
    probe_ccxt_sandbox_health,
)
from quant_core.golden_path import build_golden_path_status
from quant_core.live_quotes import QuantDingerLiveQuoteAdapter, market_quotes_to_payload, workspace_with_live_quotes
from quant_core.market_calendar import build_market_calendar_status
from quant_core.market_klines import QuantDingerKlineAdapter, build_market_data_readiness, market_klines_to_payload
from quant_core.market_search import MarketSymbolSearchAdapter, market_search_to_payload
from quant_core.portfolio_backtest import PortfolioBacktestEngine, PortfolioLeg, portfolio_backtest_run_to_payload
from quant_core.stage4_portfolio import (
    build_stage4_portfolio_workflow_snapshot,
    validate_stage4_portfolio_workflow_snapshot,
)
from quant_core.stage5_shadow import (
    build_stage5_sandbox_authorization_preflight,
    build_stage5_sandbox_authorization_review,
    build_stage5_sandbox_readiness_decision,
    build_stage5_shadow_session,
    stage5_sandbox_authorization_preflight_id,
    stage5_sandbox_authorization_preflight_to_audit_event,
    stage5_sandbox_authorization_review_id,
    stage5_sandbox_authorization_review_to_audit_event,
    stage5_sandbox_readiness_decision_to_audit_event,
    stage5_shadow_session_key,
    stage5_shadow_session_to_audit_event,
    validate_stage5_sandbox_authorization_preflight,
    validate_stage5_sandbox_authorization_review,
    validate_stage5_sandbox_readiness_decision,
    validate_stage5_shadow_session,
)
from quant_core.desktop_release import DEFAULT_DESKTOP_RELEASE_REPORT_PATH, load_desktop_release_status
from quant_core.p0_acceptance import DEFAULT_P0_ACCEPTANCE_REPORT_PATH, load_p0_acceptance_status
from quant_core.p1_acceptance import DEFAULT_P1_ACCEPTANCE_REPORT_PATH, load_p1_acceptance_status
from quant_core.stage1_daily_use import (
    DEFAULT_STAGE1_DAILY_USE_REPORT_PATH,
    load_stage1_daily_use_status,
    write_stage1_daily_use_report,
)
from quant_core.stage1_bootstrap_preflight import (
    DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH,
    load_stage1_bootstrap_preflight_status,
    write_stage1_bootstrap_preflight,
)
from quant_core.p2_acceptance import (
    DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH,
    load_p2_pre_live_acceptance_status,
)
from quant_core.p2_paper_replay import DEFAULT_P2_PAPER_REPLAY_REPORT_PATH, load_p2_paper_replay_status
from quant_core.p2_readiness_acceptance import (
    DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH,
    build_p2_readiness_acceptance_manifest_from_reports,
    load_p2_readiness_acceptance_status,
    p2_readiness_acceptance_to_audit_event_payload,
    write_p2_readiness_acceptance_report,
)
from quant_core.p2_manifest_chain_preflight import (
    DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH,
    build_p2_manifest_chain_preflight,
    load_p2_manifest_chain_preflight_status,
    p2_manifest_chain_preflight_to_audit_event_payload,
    write_p2_manifest_chain_preflight_report,
)
from quant_core.research import run_terminal_research, strategy_config_from_snapshot
from quant_core.research_import_undo import (
    ResearchRunImportUndoRecord,
    ResearchRunImportUndoStore,
    research_run_import_undo_record_to_payload,
)
from quant_core.handoff_notes import (
    HandoffNote,
    HandoffNoteStore,
    create_handoff_note_id,
    handoff_note_from_payload,
    handoff_note_to_audit_event_payload,
    handoff_note_to_payload,
)
from quant_core.research_notes import ResearchNote, ResearchNoteStore, research_note_to_payload
from quant_core.runs import (
    ResearchRunAudit,
    ResearchRunStore,
    research_run_audit_to_payload,
    research_run_audits_to_payload,
    research_run_export_to_payload,
    research_run_import_audit_events,
    research_run_import_ai_review_runs,
    research_run_import_ai_review_runs_v2,
    research_run_import_ai_review_decisions,
    research_run_import_paper_executions,
    research_run_import_portfolio_paper_order_approvals,
    research_run_import_portfolio_paper_orders,
    research_run_import_portfolio_paper_order_simulations,
    research_run_import_handoff_notes,
    research_run_import_precheck,
    research_run_import_to_audit,
)
from quant_core.settings import build_execution_adapter_state_ledger, build_settings_status
from quant_core.strategy_library import (
    StrategyLibraryRecord,
    StrategyLibraryStore,
    strategy_library_record_to_payload,
    strategy_library_records_to_payload,
)
from quant_core.strategy_experiment_store import StrategyExperimentStore
from quant_core.strategy_experiments import (
    StrategyExperimentError,
    StrategyExperimentRunner,
    strategy_experiment_detail_to_payload,
    strategy_experiment_records_to_payload,
)
from quant_core.strategy_validation import strategy_validation_to_payload, validate_strategy_snapshot
from quant_core.terminal import Instrument, StrategySnapshot, build_terminal_workspace, terminal_workspace_to_payload
from quant_core.watchlist import WatchlistStore, instrument_to_payload, watchlist_from_payload, workspace_with_watchlist
from quant_core.workspace_state import (
    ResearchWorkspaceStateStore,
    research_workspace_state_to_payload,
    workspace_with_research_workspace_state,
)


def _json_default(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "__dataclass_fields__"):
        return asdict(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _response(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False, default=_json_default).encode("utf-8")


def _execution_adapter_secret_store_root(audit_event_store: AuditEventStore) -> Path:
    store_path = getattr(audit_event_store, "path", None)
    if store_path:
        return Path(store_path).parent / "secret-store"
    return Path("data") / "secret-store"


def _adapter_paper_executions_for_export(
    audit_event_store: AuditEventStore,
    *,
    market: str,
    limit: int = 20,
) -> list[dict[str, object]]:
    expected_market = str(market or "").strip()
    events = audit_event_store.list_recent(event_type="execution_adapter_paper_execution", limit=max(1, limit * 3))
    executions: list[dict[str, object]] = []
    for event in events:
        payload = execution_adapter_paper_execution_payload_from_audit_event(event)
        if not payload:
            continue
        payload_market = str(payload.get("market") or "").strip()
        if expected_market and payload_market not in {expected_market, "multi"}:
            continue
        executions.append(payload)
        if len(executions) >= limit:
            break
    return executions


def _existing_adapter_paper_execution_for_ops_state(
    audit_event_store: AuditEventStore,
    *,
    adapter_id: str,
    adapter_ops_state_id: str,
) -> dict[str, object] | None:
    expected_adapter_id = str(adapter_id or "").strip()
    expected_ops_state_id = str(adapter_ops_state_id or "").strip()
    if not expected_adapter_id or not expected_ops_state_id:
        return None
    events = audit_event_store.list_recent(
        event_type="execution_adapter_paper_execution",
        limit=50,
        query=expected_ops_state_id,
    )
    for event in events:
        payload = execution_adapter_paper_execution_payload_from_audit_event(event)
        if not payload:
            continue
        if (
            payload.get("adapterId") == expected_adapter_id
            and payload.get("adapterOpsStateId") == expected_ops_state_id
            and payload.get("status") == "paper_execution_recorded"
        ):
            return payload
    return None


def _fetch_market_klines_with_cache(
    *,
    cache: MarketDataCache,
    adapter: object,
    request: MarketDataRequest,
    limit: int,
) -> tuple[list[OHLCVBar], DataQuality]:
    bounded_limit = max(1, min(int(limit or 160), 500))
    upstream_error: str | None = None
    try:
        bars, quality = adapter.fetch_ohlcv(request, limit=bounded_limit)  # type: ignore[attr-defined]
    except Exception as error:
        bars = []
        quality = None
        upstream_error = str(error)

    if quality and quality.is_complete:
        cache.upsert_bars(bars)
        return bars, quality

    cached_bars = cache.read_bars(
        request.market,
        request.symbol,
        request.timeframe,
        end=request.end,
    )[-bounded_limit:]
    if cached_bars:
        warnings = _cache_fallback_warnings(quality, upstream_error)
        return cached_bars, DataQuality(
            source="local-cache",
            is_complete=True,
            warnings=warnings,
            rows=len(cached_bars),
        )

    if quality is not None:
        return bars, quality

    raise ValueError(upstream_error or "market kline adapter unavailable")


def _cache_fallback_warnings(quality: DataQuality | None, upstream_error: str | None) -> list[str]:
    if upstream_error:
        return [f"served local cache after upstream error: {upstream_error}"]
    if quality is None:
        return ["served local cache because upstream quality was unavailable"]
    reason = f"served local cache instead of incomplete {quality.source}"
    return [reason, *quality.warnings]


def _stage1_daily_use_project_root(report_path: Path) -> Path:
    resolved = report_path.resolve()
    if resolved.parent.name == "data":
        return resolved.parent.parent
    return Path.cwd()


class QuantApiHandler(BaseHTTPRequestHandler):
    cache = MarketDataCache(Path("data/market.sqlite"))
    adapter = DemoMarketDataAdapter()
    assistant = LocalResearchAssistant()
    engine = BacktestEngine()
    run_store = ResearchRunStore(Path("data/research_runs.sqlite"))
    paper_execution_store = PaperExecutionStore(Path("data/paper_executions.sqlite"))
    portfolio_paper_order_store = PortfolioPaperOrderStore(Path("data/portfolio_paper_orders.sqlite"))
    portfolio_paper_order_approval_store = PortfolioPaperOrderApprovalStore(Path("data/portfolio_paper_order_approvals.sqlite"))
    portfolio_paper_order_simulation_store = PortfolioPaperOrderSimulationStore(Path("data/portfolio_paper_order_simulations.sqlite"))
    execution_adapter_certification_store = ExecutionAdapterCertificationStore(Path("data/execution_adapter_certifications.sqlite"))
    ai_review_store = AiReviewRunStore(Path("data/ai_review_runs.sqlite"))
    ai_review_decision_store = AiReviewDecisionStore(ai_review_store.path, review_store=ai_review_store)
    ai_review_provider_registry: AiReviewProviderRegistry | None = None
    audit_event_store = AuditEventStore(Path("data/audit_events.sqlite"))
    import_undo_store = ResearchRunImportUndoStore(Path("data/research_import_undo.sqlite"))
    strategy_store = StrategyLibraryStore(Path("data/strategies.sqlite"))
    strategy_experiment_store = StrategyExperimentStore(Path("data/strategy_experiments.sqlite"))
    note_store = ResearchNoteStore(Path("data/research_notes.sqlite"))
    handoff_note_store = HandoffNoteStore(Path("data/handoff_notes.sqlite"))
    watchlist_store = WatchlistStore(Path("data/watchlist.sqlite"))
    workspace_state_store = ResearchWorkspaceStateStore(Path("data/research_workspace_state.sqlite"))
    watchlist_cache_refresh_store = WatchlistCacheRefreshRunStore(Path("data/watchlist_cache_refreshes.sqlite"))
    adapter_error_store = MarketDataAdapterErrorStore(Path("data/adapter_errors.sqlite"))
    quote_adapter = QuantDingerLiveQuoteAdapter()
    kline_adapter = QuantDingerKlineAdapter(fallback_adapter=adapter)
    search_adapter = MarketSymbolSearchAdapter()
    audit_signing_secret = os.environ.get("AIQT_AUDIT_SIGNING_SECRET", "local-dev-audit-secret")
    audit_signing_key_id = os.environ.get("AIQT_AUDIT_SIGNING_KEY_ID", "local-audit-key")
    audit_signer_name = os.environ.get("AIQT_AUDIT_SIGNER_NAME", "Local Audit Key")
    audit_chain_id = os.environ.get("AIQT_AUDIT_CHAIN_ID", "audit-chain-local")
    audit_signing_keys_json = os.environ.get("AIQT_AUDIT_SIGNING_KEYS_JSON", "")
    execution_adapter_health_exchange_factory = None
    execution_adapter_health_environ = None
    p0_acceptance_report_path = DEFAULT_P0_ACCEPTANCE_REPORT_PATH
    p1_acceptance_report_path = DEFAULT_P1_ACCEPTANCE_REPORT_PATH
    p2_pre_live_acceptance_report_path = DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH
    p2_paper_replay_report_path = DEFAULT_P2_PAPER_REPLAY_REPORT_PATH
    p2_readiness_acceptance_report_path = DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH
    p2_manifest_chain_preflight_report_path = DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH
    desktop_release_report_path = DEFAULT_DESKTOP_RELEASE_REPORT_PATH
    stage1_daily_use_report_path = DEFAULT_STAGE1_DAILY_USE_REPORT_PATH
    stage1_bootstrap_preflight_report_path = DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH

    def do_OPTIONS(self) -> None:
        self._send_json({})

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/research/workspace-state":
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
        if parsed.path == "/api/watchlist":
            try:
                payload = self._read_json_body()
                instruments = watchlist_from_payload(payload.get("watchlist"))
                watchlist = self.watchlist_store.replace_all(instruments)
            except ValueError as error:
                self._send_json({"error": "invalid_watchlist", "detail": str(error)}, status=400)
                return
            self._send_json({"watchlist": [instrument_to_payload(instrument) for instrument in watchlist]})
            return
        self._send_json({"error": "not_found"}, status=404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        decision_review_id = _ai_review_decision_route_id(parsed.path)
        if decision_review_id is not None:
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
        if parsed.path == "/api/ai-reviews":
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
        if parsed.path == "/api/strategy-experiments":
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
        if parsed.path == "/api/stage1/daily-use":
            try:
                report_path = Path(self.stage1_daily_use_report_path)
                write_stage1_daily_use_report(
                    project_root=_stage1_daily_use_project_root(report_path),
                    output_path=report_path,
                    p0_path=Path(self.p0_acceptance_report_path),
                    p1_path=Path(self.p1_acceptance_report_path),
                    desktop_path=Path(self.desktop_release_report_path),
                )
                daily_use = load_stage1_daily_use_status(report_path)
            except (OSError, ValueError) as error:
                self._send_json({"error": "invalid_stage1_daily_use", "detail": str(error)}, status=400)
                return
            self._send_json(
                {
                    "status": "daily_use_generated",
                    "dailyUse": daily_use,
                    "paperOnly": True,
                    "orderSubmissionEnabled": False,
                    "liveTradingAllowed": False,
                    "liveOrderSubmitted": False,
                    "routeExecuted": False,
                },
                status=201,
            )
            return
        if parsed.path == "/api/stage1/bootstrap-preflight":
            try:
                report_path = Path(self.stage1_bootstrap_preflight_report_path)
                write_stage1_bootstrap_preflight(
                    project_root=_stage1_daily_use_project_root(report_path),
                    output_path=report_path,
                )
                preflight = load_stage1_bootstrap_preflight_status(report_path)
            except (OSError, ValueError) as error:
                self._send_json({"error": "invalid_stage1_bootstrap_preflight", "detail": str(error)}, status=400)
                return
            self._send_json(
                {
                    "status": "preflight_generated",
                    "preflight": preflight,
                    "paperOnly": True,
                    "orderSubmissionEnabled": False,
                    "liveTradingAllowed": False,
                    "liveOrderSubmitted": False,
                    "routeExecuted": False,
                },
                status=201,
            )
            return
        if parsed.path == "/api/p2/readiness/acceptance":
            try:
                manifest = build_p2_readiness_acceptance_manifest_from_reports(
                    p1_acceptance_report=Path(self.p1_acceptance_report_path),
                    p2_paper_replay_report=Path(self.p2_paper_replay_report_path),
                    p2_pre_live_acceptance_report=Path(self.p2_pre_live_acceptance_report_path),
                    base_url="",
                    run_id="run-p2-readiness",
                )
                write_p2_readiness_acceptance_report(
                    Path(self.p2_readiness_acceptance_report_path),
                    manifest,
                )
                audit_event = self.audit_event_store.record(
                    p2_readiness_acceptance_to_audit_event_payload(
                        manifest,
                        source_path=Path(self.p2_readiness_acceptance_report_path),
                    )
                )
                acceptance = load_p2_readiness_acceptance_status(
                    Path(self.p2_readiness_acceptance_report_path)
                )
            except (OSError, ValueError) as error:
                self._send_json({"error": "invalid_p2_readiness_acceptance", "detail": str(error)}, status=400)
                return
            self._send_json(
                {
                    "status": "acceptance_generated",
                    "acceptance": acceptance,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                    "paperOnly": True,
                    "orderSubmissionEnabled": False,
                    "liveTradingAllowed": False,
                    "liveOrderSubmitted": False,
                    "routeExecuted": False,
                },
                status=201,
            )
            return
        if parsed.path == "/api/p2/manifest-chain/preflight":
            try:
                manifest = build_p2_manifest_chain_preflight(
                    p1_acceptance_report=Path(self.p1_acceptance_report_path),
                    p2_paper_replay_report=Path(self.p2_paper_replay_report_path),
                    p2_pre_live_acceptance_report=Path(self.p2_pre_live_acceptance_report_path),
                    p2_readiness_acceptance_report=Path(self.p2_readiness_acceptance_report_path),
                )
                write_p2_manifest_chain_preflight_report(
                    Path(self.p2_manifest_chain_preflight_report_path),
                    manifest,
                )
                audit_event = self.audit_event_store.record(
                    p2_manifest_chain_preflight_to_audit_event_payload(
                        manifest,
                        source_path=Path(self.p2_manifest_chain_preflight_report_path),
                    )
                )
                preflight = load_p2_manifest_chain_preflight_status(
                    Path(self.p2_manifest_chain_preflight_report_path)
                )
            except (OSError, ValueError) as error:
                self._send_json({"error": "invalid_p2_manifest_chain_preflight", "detail": str(error)}, status=400)
                return
            self._send_json(
                {
                    "status": "preflight_generated",
                    "preflight": preflight,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                    "paperOnly": True,
                    "orderSubmissionEnabled": False,
                    "liveTradingAllowed": False,
                    "liveOrderSubmitted": False,
                    "routeExecuted": False,
                },
                status=201,
            )
            return
        if parsed.path == "/api/p0/pipeline":
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
            except ValueError as error:
                self._send_json({"error": "invalid_p0_pipeline", "detail": str(error)}, status=400)
                return
            self._send_json(_p0_pipeline_response_payload(audit))
            return
        if parsed.path == "/api/p0/ai-reviews":
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
        if parsed.path == "/api/p0/paper-simulations":
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
        if parsed.path == "/api/strategies/validate":
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
        if parsed.path == "/api/strategies":
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
        if parsed.path == "/api/cache/refresh":
            try:
                payload = self._read_json_body()
                market = str(payload.get("market") or "ashare")
                symbol = str(payload.get("symbol") or "600000")
                timeframe = str(payload.get("timeframe") or "1d")
                limit = _parse_kline_limit(str(payload.get("limit") or "160"))
                override_audit_event_id = _optional_audit_event_id(payload.get("overrideAuditEventId"))
                request = MarketDataRequest(market=market, symbol=symbol, timeframe=timeframe)
                bars, quality = self.kline_adapter.fetch_ohlcv(request, limit=limit)
                self._record_adapter_error_if_needed(request, quality=quality, context="cache-refresh")
                upserted_rows = self.cache.upsert_bars(bars) if quality.is_complete else 0
                refresh_run = self.watchlist_cache_refresh_store.record(
                    create_watchlist_cache_refresh_run(
                        items=[
                            watchlist_cache_refresh_item_from_quality(
                                instrument=Instrument(
                                    market=market,  # type: ignore[arg-type]
                                    symbol=symbol,
                                    name=symbol,
                                    change_pct=0.0,
                                ),
                                timeframe=timeframe,
                                requested_limit=limit,
                                quality=quality,
                                upserted_rows=upserted_rows,
                            )
                        ],
                        timeframe=timeframe,
                        requested_limit=limit,
                        override_audit_event_id=override_audit_event_id,
                    )
                )
            except ValueError as error:
                self._send_json({"error": "invalid_cache_refresh", "detail": str(error)}, status=400)
                return
            quality_payload = asdict(quality)
            quality_payload["isComplete"] = quality_payload.pop("is_complete")
            self._send_json(
                {
                    "refresh": {
                        "market": market,
                        "symbol": symbol,
                        "timeframe": timeframe,
                        "requestedLimit": limit,
                        "upsertedRows": upserted_rows,
                        "overrideAuditEventId": override_audit_event_id,
                        "quality": quality_payload,
                    },
                    "watchlistRefresh": watchlist_cache_refresh_run_to_payload(refresh_run),
                    "settings": self._settings_status_payload(),
                }
            )
            return
        if parsed.path == "/api/cache/watchlist-refreshes":
            try:
                payload = self._read_json_body()
                instruments = watchlist_from_payload(payload.get("watchlist"))
                timeframe = str(payload.get("timeframe") or "1d")
                limit = _parse_kline_limit(str(payload.get("limit") or "160"))
                override_audit_event_id = _optional_audit_event_id(payload.get("overrideAuditEventId"))
                items = []
                for instrument in instruments:
                    request = MarketDataRequest(market=instrument.market, symbol=instrument.symbol, timeframe=timeframe)
                    try:
                        bars, quality = self.kline_adapter.fetch_ohlcv(request, limit=limit)
                        self._record_adapter_error_if_needed(
                            request,
                            quality=quality,
                            context="watchlist-cache-refresh",
                        )
                        upserted_rows = self.cache.upsert_bars(bars) if quality.is_complete else 0
                        items.append(
                            watchlist_cache_refresh_item_from_quality(
                                instrument=instrument,
                                timeframe=timeframe,
                                requested_limit=limit,
                                quality=quality,
                                upserted_rows=upserted_rows,
                            )
                        )
                    except Exception as error:
                        self._record_adapter_error_if_needed(
                            request,
                            quality=None,
                            context="watchlist-cache-refresh",
                            error=str(error),
                        )
                        items.append(
                            watchlist_cache_refresh_item_from_quality(
                                instrument=instrument,
                                timeframe=timeframe,
                                requested_limit=limit,
                                quality=DataQuality(
                                    source="unavailable",
                                    is_complete=False,
                                    warnings=[str(error)],
                                    rows=0,
                                ),
                                upserted_rows=0,
                                error=str(error),
                            )
                        )
                refresh_run = self.watchlist_cache_refresh_store.record(
                    create_watchlist_cache_refresh_run(
                        items=items,
                        timeframe=timeframe,
                        requested_limit=limit,
                        override_audit_event_id=override_audit_event_id,
                    )
                )
            except ValueError as error:
                self._send_json({"error": "invalid_watchlist_cache_refresh", "detail": str(error)}, status=400)
                return
            self._send_json(
                {
                    "watchlistRefresh": watchlist_cache_refresh_run_to_payload(refresh_run),
                    "settings": self._settings_status_payload(),
                },
                status=201,
            )
            return
        if parsed.path == "/api/execution/adapter-secret-references":
            try:
                payload = self._read_json_body()
                secret_reference = build_execution_adapter_secret_reference(
                    adapter_id=str(payload.get("adapterId") or ""),
                    market=str(payload.get("market") or ""),
                    route=str(payload.get("route") or ""),
                    reference_name=str(payload.get("referenceName") or ""),
                    backend=str(payload.get("backend") or ""),
                    required_env_vars=payload.get("requiredEnvVars") if isinstance(payload.get("requiredEnvVars"), list) else [],
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_secret_reference", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_secret_reference_to_audit_event_payload(secret_reference)
            )
            self._send_json(
                {
                    "adapterSecretReference": execution_adapter_secret_reference_to_payload(secret_reference),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if secret_reference.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-secret-materializations":
            payload = self._read_json_body()
            reference_id = str(payload.get("referenceId") or "").strip()
            reference_event = self.audit_event_store.get(reference_id)
            secret_reference = (
                execution_adapter_secret_reference_payload_from_audit_event(reference_event) if reference_event else None
            )
            if not secret_reference:
                self._send_json(
                    {"error": "execution_adapter_secret_reference_not_found", "referenceId": reference_id},
                    status=404,
                )
                return
            try:
                materialization = build_execution_adapter_secret_materialization(
                    secret_reference,
                    adapter_id=str(payload.get("adapterId") or ""),
                    manifest_path=str(payload.get("manifestPath") or ""),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_secret_materialization", "detail": str(error)}, status=400)
                return
            materialize_execution_adapter_secret_manifest(
                materialization,
                secret_store_root=_execution_adapter_secret_store_root(self.audit_event_store),
            )
            audit_event = self.audit_event_store.record(
                execution_adapter_secret_materialization_to_audit_event_payload(materialization)
            )
            self._send_json(
                {
                    "adapterSecretMaterialization": execution_adapter_secret_materialization_to_payload(materialization),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if materialization.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-secret-manifest-validations":
            payload = self._read_json_body()
            materialization_id = str(payload.get("materializationId") or "").strip()
            materialization_event = self.audit_event_store.get(materialization_id)
            materialization = (
                execution_adapter_secret_materialization_payload_from_audit_event(materialization_event)
                if materialization_event
                else None
            )
            if not materialization:
                self._send_json(
                    {
                        "error": "execution_adapter_secret_materialization_not_found",
                        "materializationId": materialization_id,
                    },
                    status=404,
                )
                return
            try:
                validation = build_execution_adapter_secret_manifest_validation(
                    materialization,
                    adapter_id=str(payload.get("adapterId") or ""),
                    manifest_path=str(payload.get("manifestPath") or ""),
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                    secret_store_root=_execution_adapter_secret_store_root(self.audit_event_store),
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_execution_adapter_secret_manifest_validation", "detail": str(error)},
                    status=400,
                )
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_secret_manifest_validation_to_audit_event_payload(validation)
            )
            self._send_json(
                {
                    "adapterSecretManifestValidation": execution_adapter_secret_manifest_validation_to_payload(validation),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if validation.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-environment-bindings":
            payload = self._read_json_body()
            manifest_validation_id = str(payload.get("manifestValidationId") or "").strip()
            manifest_validation = None
            if manifest_validation_id:
                validation_event = self.audit_event_store.get(manifest_validation_id)
                manifest_validation = (
                    execution_adapter_secret_manifest_validation_payload_from_audit_event(validation_event)
                    if validation_event
                    else None
                )
                if not manifest_validation:
                    self._send_json(
                        {
                            "error": "execution_adapter_secret_manifest_validation_not_found",
                            "manifestValidationId": manifest_validation_id,
                        },
                        status=404,
                    )
                    return
            materialization_id = str(payload.get("materializationId") or "").strip()
            if not materialization_id and manifest_validation:
                materialization_id = str(manifest_validation.get("materializationId") or "").strip()
            materialization_event = self.audit_event_store.get(materialization_id)
            materialization = (
                execution_adapter_secret_materialization_payload_from_audit_event(materialization_event)
                if materialization_event
                else None
            )
            if not materialization:
                self._send_json(
                    {
                        "error": "execution_adapter_secret_materialization_not_found",
                        "materializationId": materialization_id,
                    },
                    status=404,
                )
                return
            try:
                environment_binding = build_execution_adapter_environment_binding(
                    materialization,
                    adapter_id=str(payload.get("adapterId") or ""),
                    binding_mode=str(payload.get("bindingMode") or "container_env_reference"),
                    manifest_validation=manifest_validation,
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_environment_binding", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_environment_binding_to_audit_event_payload(environment_binding)
            )
            self._send_json(
                {
                    "adapterEnvironmentBinding": execution_adapter_environment_binding_to_payload(environment_binding),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if environment_binding.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-runtime-reload-plans":
            payload = self._read_json_body()
            binding_id = str(payload.get("bindingId") or "").strip()
            binding_event = self.audit_event_store.get(binding_id)
            environment_binding = (
                execution_adapter_environment_binding_payload_from_audit_event(binding_event) if binding_event else None
            )
            if not environment_binding:
                self._send_json(
                    {
                        "error": "execution_adapter_environment_binding_not_found",
                        "bindingId": binding_id,
                    },
                    status=404,
                )
                return
            try:
                runtime_reload_plan = build_execution_adapter_runtime_reload_plan(
                    environment_binding,
                    adapter_id=str(payload.get("adapterId") or ""),
                    reload_mode=str(payload.get("reloadMode") or "manual_container_reload_plan"),
                    maintenance_window_id=str(payload.get("maintenanceWindowId") or ""),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_runtime_reload_plan", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_runtime_reload_plan_to_audit_event_payload(runtime_reload_plan)
            )
            self._send_json(
                {
                    "adapterRuntimeReloadPlan": execution_adapter_runtime_reload_plan_to_payload(runtime_reload_plan),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if runtime_reload_plan.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-runtime-reload-executions":
            payload = self._read_json_body()
            plan_id = str(payload.get("planId") or "").strip()
            plan_event = self.audit_event_store.get(plan_id)
            runtime_reload_plan = (
                execution_adapter_runtime_reload_plan_payload_from_audit_event(plan_event) if plan_event else None
            )
            if not runtime_reload_plan:
                self._send_json(
                    {
                        "error": "execution_adapter_runtime_reload_plan_not_found",
                        "planId": plan_id,
                    },
                    status=404,
                )
                return
            try:
                runtime_reload_execution = build_execution_adapter_runtime_reload_execution(
                    runtime_reload_plan,
                    adapter_id=str(payload.get("adapterId") or ""),
                    execution_mode=str(payload.get("executionMode") or "manual_controlled_reload"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_runtime_reload_execution", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_runtime_reload_execution_to_audit_event_payload(runtime_reload_execution)
            )
            self._send_json(
                {
                    "adapterRuntimeReloadExecution": execution_adapter_runtime_reload_execution_to_payload(runtime_reload_execution),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if runtime_reload_execution.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-runtime-reload-acceptances":
            payload = self._read_json_body()
            execution_id = str(payload.get("executionId") or "").strip()
            execution_event = self.audit_event_store.get(execution_id)
            runtime_reload_execution = (
                execution_adapter_runtime_reload_execution_payload_from_audit_event(execution_event)
                if execution_event
                else None
            )
            if not runtime_reload_execution:
                self._send_json(
                    {
                        "error": "execution_adapter_runtime_reload_execution_not_found",
                        "executionId": execution_id,
                    },
                    status=404,
                )
                return
            try:
                runtime_reload_acceptance = build_execution_adapter_runtime_reload_acceptance(
                    runtime_reload_execution,
                    adapter_id=str(payload.get("adapterId") or ""),
                    acceptance_mode=str(payload.get("acceptanceMode") or "manual_runtime_reload_acceptance"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_runtime_reload_acceptance", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_runtime_reload_acceptance_to_audit_event_payload(runtime_reload_acceptance)
            )
            self._send_json(
                {
                    "adapterRuntimeReloadAcceptance": execution_adapter_runtime_reload_acceptance_to_payload(runtime_reload_acceptance),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if runtime_reload_acceptance.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-orchestration-dry-runs":
            payload = self._read_json_body()
            acceptance_id = str(payload.get("acceptanceId") or "").strip()
            acceptance_event = self.audit_event_store.get(acceptance_id)
            runtime_reload_acceptance = (
                execution_adapter_runtime_reload_acceptance_payload_from_audit_event(acceptance_event)
                if acceptance_event
                else None
            )
            if not runtime_reload_acceptance:
                self._send_json(
                    {
                        "error": "execution_adapter_runtime_reload_acceptance_not_found",
                        "acceptanceId": acceptance_id,
                    },
                    status=404,
                )
                return
            try:
                orchestration_dry_run = build_execution_adapter_orchestration_dry_run(
                    runtime_reload_acceptance,
                    adapter_id=str(payload.get("adapterId") or ""),
                    orchestration_mode=str(payload.get("orchestrationMode") or "manual_adapter_orchestration_dry_run"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_orchestration_dry_run", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_orchestration_dry_run_to_audit_event_payload(orchestration_dry_run)
            )
            self._send_json(
                {
                    "adapterOrchestrationDryRun": execution_adapter_orchestration_dry_run_to_payload(orchestration_dry_run),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if orchestration_dry_run.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-orchestration-executions":
            payload = self._read_json_body()
            dry_run_id = str(payload.get("dryRunId") or "").strip()
            dry_run_event = self.audit_event_store.get(dry_run_id)
            orchestration_dry_run = (
                execution_adapter_orchestration_dry_run_payload_from_audit_event(dry_run_event)
                if dry_run_event
                else None
            )
            if not orchestration_dry_run:
                self._send_json(
                    {
                        "error": "execution_adapter_orchestration_dry_run_not_found",
                        "dryRunId": dry_run_id,
                    },
                    status=404,
                )
                return
            try:
                orchestration_execution = build_execution_adapter_orchestration_execution(
                    orchestration_dry_run,
                    adapter_id=str(payload.get("adapterId") or ""),
                    orchestration_execution_mode=str(
                        payload.get("orchestrationExecutionMode") or "manual_adapter_orchestration_execution"
                    ),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_orchestration_execution", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_orchestration_execution_to_audit_event_payload(orchestration_execution)
            )
            self._send_json(
                {
                    "adapterOrchestrationExecution": execution_adapter_orchestration_execution_to_payload(orchestration_execution),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if orchestration_execution.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-human-confirmations":
            payload = self._read_json_body()
            orchestration_execution_id = str(payload.get("orchestrationExecutionId") or "").strip()
            orchestration_execution_event = self.audit_event_store.get(orchestration_execution_id)
            orchestration_execution = (
                execution_adapter_orchestration_execution_payload_from_audit_event(orchestration_execution_event)
                if orchestration_execution_event
                else None
            )
            if not orchestration_execution:
                self._send_json(
                    {
                        "error": "execution_adapter_orchestration_execution_not_found",
                        "orchestrationExecutionId": orchestration_execution_id,
                    },
                    status=404,
                )
                return
            try:
                human_confirmation = build_execution_adapter_human_confirmation(
                    orchestration_execution,
                    adapter_id=str(payload.get("adapterId") or ""),
                    confirmation_mode=str(payload.get("confirmationMode") or "manual_final_human_confirmation"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_human_confirmation", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_human_confirmation_to_audit_event_payload(human_confirmation)
            )
            self._send_json(
                {
                    "adapterHumanConfirmation": execution_adapter_human_confirmation_to_payload(human_confirmation),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if human_confirmation.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-sandbox-probe-plans":
            payload = self._read_json_body()
            human_confirmation_id = str(payload.get("humanConfirmationId") or "").strip()
            human_confirmation_event = self.audit_event_store.get(human_confirmation_id)
            human_confirmation = (
                execution_adapter_human_confirmation_payload_from_audit_event(human_confirmation_event)
                if human_confirmation_event
                else None
            )
            if not human_confirmation:
                self._send_json(
                    {
                        "error": "execution_adapter_human_confirmation_not_found",
                        "humanConfirmationId": human_confirmation_id,
                    },
                    status=404,
                )
                return
            try:
                sandbox_probe_plan = build_execution_adapter_sandbox_probe_plan(
                    human_confirmation,
                    adapter_id=str(payload.get("adapterId") or ""),
                    probe_mode=str(payload.get("probeMode") or "manual_sandbox_probe_plan"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_sandbox_probe_plan", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_sandbox_probe_plan_to_audit_event_payload(sandbox_probe_plan)
            )
            self._send_json(
                {
                    "adapterSandboxProbePlan": execution_adapter_sandbox_probe_plan_to_payload(sandbox_probe_plan),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if sandbox_probe_plan.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-sandbox-probe-executions":
            payload = self._read_json_body()
            sandbox_probe_plan_id = str(payload.get("sandboxProbePlanId") or "").strip()
            sandbox_probe_plan_event = self.audit_event_store.get(sandbox_probe_plan_id)
            sandbox_probe_plan = (
                execution_adapter_sandbox_probe_plan_payload_from_audit_event(sandbox_probe_plan_event)
                if sandbox_probe_plan_event
                else None
            )
            if not sandbox_probe_plan:
                self._send_json(
                    {
                        "error": "execution_adapter_sandbox_probe_plan_not_found",
                        "sandboxProbePlanId": sandbox_probe_plan_id,
                    },
                    status=404,
                )
                return
            health_probe = None
            health_probe_evidence = None
            if (
                sandbox_probe_plan.get("adapterId") == "ccxt-live"
                and sandbox_probe_plan.get("market") == "crypto"
            ):
                exchange_id = (
                    str(payload.get("exchangeId") or "").strip()
                    or os.environ.get("CCXT_DEFAULT_EXCHANGE", "binance").strip()
                    or "binance"
                )
                health_probe = probe_ccxt_sandbox_health(
                    adapter_id="ccxt-live",
                    exchange_id=exchange_id,
                    environ=type(self).execution_adapter_health_environ,
                    exchange_factory=type(self).execution_adapter_health_exchange_factory,
                )
                health_probe_evidence = execution_adapter_health_probe_to_evidence(health_probe)
            try:
                sandbox_probe_execution = build_execution_adapter_sandbox_probe_execution(
                    sandbox_probe_plan,
                    health_probe_evidence=health_probe_evidence,
                    adapter_id=str(payload.get("adapterId") or ""),
                    probe_execution_mode=str(payload.get("probeExecutionMode") or "manual_readonly_sandbox_probe"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_sandbox_probe_execution", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_sandbox_probe_execution_to_audit_event_payload(sandbox_probe_execution)
            )
            self._send_json(
                {
                    "adapterSandboxProbeExecution": execution_adapter_sandbox_probe_execution_to_payload(
                        sandbox_probe_execution
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                    **(
                        {"adapterHealthProbe": execution_adapter_health_probe_to_payload(health_probe)}
                        if health_probe
                        else {}
                    ),
                },
                status=409 if sandbox_probe_execution.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-sandbox-probe-reviews":
            payload = self._read_json_body()
            sandbox_probe_execution_id = str(payload.get("sandboxProbeExecutionId") or "").strip()
            sandbox_probe_execution_event = self.audit_event_store.get(sandbox_probe_execution_id)
            sandbox_probe_execution = (
                execution_adapter_sandbox_probe_execution_payload_from_audit_event(sandbox_probe_execution_event)
                if sandbox_probe_execution_event
                else None
            )
            if not sandbox_probe_execution:
                self._send_json(
                    {
                        "error": "execution_adapter_sandbox_probe_execution_not_found",
                        "sandboxProbeExecutionId": sandbox_probe_execution_id,
                    },
                    status=404,
                )
                return
            try:
                sandbox_probe_review = build_execution_adapter_sandbox_probe_review(
                    sandbox_probe_execution,
                    adapter_id=str(payload.get("adapterId") or ""),
                    review_mode=str(payload.get("reviewMode") or "manual_sandbox_probe_review"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_sandbox_probe_review", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_sandbox_probe_review_to_audit_event_payload(sandbox_probe_review)
            )
            self._send_json(
                {
                    "adapterSandboxProbeReview": execution_adapter_sandbox_probe_review_to_payload(
                        sandbox_probe_review
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if sandbox_probe_review.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-production-route-reviews":
            payload = self._read_json_body()
            sandbox_probe_review_id = str(payload.get("sandboxProbeReviewId") or "").strip()
            sandbox_probe_review_event = self.audit_event_store.get(sandbox_probe_review_id)
            sandbox_probe_review = (
                execution_adapter_sandbox_probe_review_payload_from_audit_event(sandbox_probe_review_event)
                if sandbox_probe_review_event
                else None
            )
            if not sandbox_probe_review:
                self._send_json(
                    {
                        "error": "execution_adapter_sandbox_probe_review_not_found",
                        "sandboxProbeReviewId": sandbox_probe_review_id,
                    },
                    status=404,
                )
                return
            try:
                production_route_review = build_execution_adapter_production_route_review(
                    sandbox_probe_review,
                    adapter_id=str(payload.get("adapterId") or ""),
                    review_mode=str(payload.get("reviewMode") or "manual_production_route_review"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_production_route_review", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_production_route_review_to_audit_event_payload(production_route_review)
            )
            self._send_json(
                {
                    "adapterProductionRouteReview": execution_adapter_production_route_review_to_payload(
                        production_route_review
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if production_route_review.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-sandbox-order-schema-dry-runs":
            payload = self._read_json_body()
            production_route_review_id = str(payload.get("productionRouteReviewId") or "").strip()
            production_route_review_event = self.audit_event_store.get(production_route_review_id)
            production_route_review = (
                execution_adapter_production_route_review_payload_from_audit_event(production_route_review_event)
                if production_route_review_event
                else None
            )
            if not production_route_review:
                self._send_json(
                    {
                        "error": "execution_adapter_production_route_review_not_found",
                        "productionRouteReviewId": production_route_review_id,
                    },
                    status=404,
                )
                return
            try:
                schema_dry_run = build_execution_adapter_sandbox_order_schema_dry_run(
                    production_route_review,
                    adapter_id=str(payload.get("adapterId") or ""),
                    dry_run_mode=str(payload.get("dryRunMode") or "manual_sandbox_order_schema_dry_run"),
                    order_intent=payload.get("orderIntent") if isinstance(payload.get("orderIntent"), dict) else {},
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_execution_adapter_sandbox_order_schema_dry_run", "detail": str(error)},
                    status=400,
                )
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_sandbox_order_schema_dry_run_to_audit_event_payload(schema_dry_run)
            )
            self._send_json(
                {
                    "adapterSandboxOrderSchemaDryRun": execution_adapter_sandbox_order_schema_dry_run_to_payload(
                        schema_dry_run
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if schema_dry_run.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-paper-order-lifecycles":
            payload = self._read_json_body()
            schema_dry_run_id = str(payload.get("sandboxOrderSchemaDryRunId") or "").strip()
            schema_dry_run_event = self.audit_event_store.get(schema_dry_run_id)
            schema_dry_run = (
                execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event(schema_dry_run_event)
                if schema_dry_run_event
                else None
            )
            if not schema_dry_run:
                self._send_json(
                    {
                        "error": "execution_adapter_sandbox_order_schema_dry_run_not_found",
                        "sandboxOrderSchemaDryRunId": schema_dry_run_id,
                    },
                    status=404,
                )
                return
            try:
                paper_order_lifecycle = build_execution_adapter_paper_order_lifecycle(
                    schema_dry_run,
                    adapter_id=str(payload.get("adapterId") or ""),
                    lifecycle_mode=str(payload.get("lifecycleMode") or "manual_paper_order_lifecycle_adapter"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_execution_adapter_paper_order_lifecycle", "detail": str(error)},
                    status=400,
                )
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_paper_order_lifecycle_to_audit_event_payload(paper_order_lifecycle)
            )
            self._send_json(
                {
                    "adapterPaperOrderLifecycle": execution_adapter_paper_order_lifecycle_to_payload(
                        paper_order_lifecycle
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if paper_order_lifecycle.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-paper-route-runbooks":
            payload = self._read_json_body()
            paper_order_lifecycle_id = str(payload.get("paperOrderLifecycleId") or "").strip()
            paper_order_lifecycle_event = self.audit_event_store.get(paper_order_lifecycle_id)
            paper_order_lifecycle = (
                execution_adapter_paper_order_lifecycle_payload_from_audit_event(paper_order_lifecycle_event)
                if paper_order_lifecycle_event
                else None
            )
            if not paper_order_lifecycle:
                self._send_json(
                    {
                        "error": "execution_adapter_paper_order_lifecycle_not_found",
                        "paperOrderLifecycleId": paper_order_lifecycle_id,
                    },
                    status=404,
                )
                return
            try:
                paper_route_runbook = build_execution_adapter_paper_route_runbook(
                    paper_order_lifecycle,
                    adapter_id=str(payload.get("adapterId") or ""),
                    runbook_mode=str(payload.get("runbookMode") or "manual_paper_route_runbook"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_execution_adapter_paper_route_runbook", "detail": str(error)},
                    status=400,
                )
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_paper_route_runbook_to_audit_event_payload(paper_route_runbook)
            )
            self._send_json(
                {
                    "adapterPaperRouteRunbook": execution_adapter_paper_route_runbook_to_payload(
                        paper_route_runbook
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if paper_route_runbook.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-ops-states":
            payload = self._read_json_body()
            paper_route_runbook_id = str(payload.get("paperRouteRunbookId") or "").strip()
            paper_route_runbook_event = self.audit_event_store.get(paper_route_runbook_id)
            paper_route_runbook = (
                execution_adapter_paper_route_runbook_payload_from_audit_event(paper_route_runbook_event)
                if paper_route_runbook_event
                else None
            )
            if not paper_route_runbook:
                self._send_json(
                    {
                        "error": "execution_adapter_paper_route_runbook_not_found",
                        "paperRouteRunbookId": paper_route_runbook_id,
                    },
                    status=404,
                )
                return
            try:
                adapter_ops_state = build_execution_adapter_ops_state(
                    paper_route_runbook,
                    adapter_id=str(payload.get("adapterId") or ""),
                    ops_mode=str(payload.get("opsMode") or "manual_adapter_ops_state"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_execution_adapter_ops_state", "detail": str(error)},
                    status=400,
                )
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_ops_state_to_audit_event_payload(adapter_ops_state)
            )
            self._send_json(
                {
                    "adapterOpsState": execution_adapter_ops_state_to_payload(adapter_ops_state),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if adapter_ops_state.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-paper-executions":
            payload = self._read_json_body()
            adapter_ops_state_id = str(payload.get("adapterOpsStateId") or "").strip()
            adapter_ops_state_event = self.audit_event_store.get(adapter_ops_state_id)
            adapter_ops_state = (
                execution_adapter_ops_state_payload_from_audit_event(adapter_ops_state_event)
                if adapter_ops_state_event
                else None
            )
            if not adapter_ops_state:
                self._send_json(
                    {
                        "error": "execution_adapter_ops_state_not_found",
                        "adapterOpsStateId": adapter_ops_state_id,
                    },
                    status=404,
                )
                return
            try:
                adapter_paper_execution = build_execution_adapter_paper_execution(
                    adapter_ops_state,
                    adapter_id=str(payload.get("adapterId") or ""),
                    paper_execution_mode=str(
                        payload.get("paperExecutionMode") or "manual_adapter_paper_execution"
                    ),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_execution_adapter_paper_execution", "detail": str(error)},
                    status=400,
                )
                return
            if adapter_paper_execution.status == "paper_execution_recorded":
                existing_paper_execution = _existing_adapter_paper_execution_for_ops_state(
                    self.audit_event_store,
                    adapter_id=adapter_paper_execution.adapter_id,
                    adapter_ops_state_id=adapter_paper_execution.adapter_ops_state_id,
                )
                if existing_paper_execution:
                    self._send_json(
                        {
                            "error": "execution_adapter_paper_execution_already_recorded",
                            "adapterOpsStateId": adapter_paper_execution.adapter_ops_state_id,
                            "existingAdapterPaperExecution": existing_paper_execution,
                        },
                        status=409,
                    )
                    return
            audit_event = self.audit_event_store.record(
                execution_adapter_paper_execution_to_audit_event_payload(adapter_paper_execution)
            )
            self._send_json(
                {
                    "adapterPaperExecution": execution_adapter_paper_execution_to_payload(
                        adapter_paper_execution
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if adapter_paper_execution.status == "blocked" else 201,
            )
            return
        if parsed.path == "/api/execution/adapter-certifications":
            try:
                payload = self._read_json_body()
                certification = create_execution_adapter_certification_run(
                    adapter_id=str(payload.get("adapterId") or ""),
                    market=str(payload.get("market") or ""),
                    route=str(payload.get("route") or ""),
                    operator=str(payload.get("operator") or "local-operator"),
                    started_at=payload.get("startedAt"),
                    completed_at=payload.get("completedAt"),
                    checks=payload.get("checks") if isinstance(payload.get("checks"), list) else [],
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_certification", "detail": str(error)}, status=400)
                return
            self.execution_adapter_certification_store.record(certification)
            audit_event = self.audit_event_store.record(
                execution_adapter_certification_to_audit_event_payload(certification)
            )
            self._send_json(
                {
                    "adapterCertification": execution_adapter_certification_to_payload(certification),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=201,
            )
            return
        if parsed.path == "/api/execution/adapter-certifications/apply":
            payload = self._read_json_body()
            certification_id = str(payload.get("certificationId") or "").strip()
            certification = self.execution_adapter_certification_store.get(certification_id)
            if not certification:
                self._send_json(
                    {"error": "execution_adapter_certification_not_found", "certificationId": certification_id},
                    status=404,
                )
                return
            try:
                certification_apply = build_execution_adapter_certification_apply(
                    certification,
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_certification_apply", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_certification_apply_to_audit_event_payload(certification_apply)
            )
            self._send_json(
                {
                    "certificationApply": execution_adapter_certification_apply_to_payload(certification_apply),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if certification_apply.status == "blocked" else 200,
            )
            return
        if parsed.path == "/api/execution/adapter-certifications/restart-evidence":
            payload = self._read_json_body()
            apply_id = str(payload.get("applyId") or "").strip()
            apply_event = self.audit_event_store.get(apply_id)
            certification_apply = (
                execution_adapter_certification_apply_payload_from_audit_event(apply_event) if apply_event else None
            )
            if not certification_apply:
                self._send_json(
                    {"error": "execution_adapter_certification_apply_not_found", "applyId": apply_id},
                    status=404,
                )
                return
            try:
                restart_evidence = build_execution_adapter_controlled_restart_evidence(
                    certification_apply,
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_controlled_restart_evidence", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_controlled_restart_evidence_to_audit_event_payload(restart_evidence)
            )
            self._send_json(
                {
                    "controlledRestartEvidence": execution_adapter_controlled_restart_evidence_to_payload(
                        restart_evidence
                    ),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if restart_evidence.status == "blocked" else 200,
            )
            return
        if parsed.path == "/api/execution/adapter-certifications/restart-acceptance":
            payload = self._read_json_body()
            evidence_id = str(payload.get("evidenceId") or "").strip()
            evidence_event = self.audit_event_store.get(evidence_id)
            controlled_restart_evidence = (
                execution_adapter_controlled_restart_evidence_payload_from_audit_event(evidence_event)
                if evidence_event
                else None
            )
            if not controlled_restart_evidence:
                self._send_json(
                    {"error": "execution_adapter_controlled_restart_evidence_not_found", "evidenceId": evidence_id},
                    status=404,
                )
                return
            try:
                restart_acceptance = build_execution_adapter_restart_acceptance(
                    controlled_restart_evidence,
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_execution_adapter_restart_acceptance", "detail": str(error)}, status=400)
                return
            audit_event = self.audit_event_store.record(
                execution_adapter_restart_acceptance_to_audit_event_payload(restart_acceptance)
            )
            self._send_json(
                {
                    "restartAcceptance": execution_adapter_restart_acceptance_to_payload(restart_acceptance),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if restart_acceptance.status == "blocked" else 200,
            )
            return
        if parsed.path == "/api/portfolio/workflows":
            try:
                snapshot, operator = _stage4_portfolio_workflow_from_payload(
                    self._read_json_body(),
                    run_store=self.run_store,
                    batch_store=self.portfolio_paper_order_store,
                    approval_store=self.portfolio_paper_order_approval_store,
                    simulation_store=self.portfolio_paper_order_simulation_store,
                )
                audit_event = self.audit_event_store.record(
                    {
                        "schemaVersion": 1,
                        "eventId": snapshot["workflowId"],
                        "eventType": "stage4_portfolio_workflow",
                        "runId": snapshot["baseRunId"],
                        "createdAt": snapshot["generatedAt"],
                        "stage": "stage4-portfolio-workflow",
                        "source": operator,
                        "summary": f"Recorded authoritative Stage 4 portfolio workflow for {snapshot['baseRunId']}.",
                        "detail": "Portfolio, paper evidence, state history, and replay were rebuilt from server stores.",
                        "metadata": {"snapshot": snapshot},
                    }
                )
            except LookupError as error:
                self._send_json(
                    {"error": "stage4_portfolio_workflow_evidence_not_found", "detail": str(error)},
                    status=404,
                )
                return
            except ValueError as error:
                self._send_json({"error": "invalid_stage4_portfolio_workflow", "detail": str(error)}, status=400)
                return
            self._send_json(
                {"workflow": snapshot, "auditEvent": audit_event_record_to_payload(audit_event)},
                status=201,
            )
            return
        if parsed.path == "/api/execution/shadow-sessions":
            try:
                payload = self._read_json_body()
                if not isinstance(payload, dict) or set(payload) != {
                    "baseRunId", "workflowHash", "failureMode", "operator"
                }:
                    raise ValueError("stage5 shadow request fields are invalid")
                base_run_id = _required_stage4_string(payload["baseRunId"])
                workflow_hash = _required_stage4_string(payload["workflowHash"])
                failure_mode = _required_stage4_string(payload["failureMode"])
                operator = _required_stage4_string(payload["operator"])
                workflow = _stage5_shadow_source_workflow(
                    self.audit_event_store, base_run_id, workflow_hash
                )
                existing = _stage5_shadow_sessions(
                    self.audit_event_store, base_run_id, workflow_hash
                )
                latest = existing[0] if existing else None
                if latest and latest["failureMode"] != failure_mode:
                    raise ValueError("stage5 shadow failureMode does not match existing session")
                if latest and latest["status"] != "recoverable_failure":
                    session = latest
                    created = False
                else:
                    attempt = 2 if latest else 1
                    session = build_stage5_shadow_session(
                        workflow,
                        failure_mode=failure_mode,
                        attempt=attempt,
                    )
                    self.audit_event_store.record(
                        stage5_shadow_session_to_audit_event(session, operator)
                    )
                    created = True
            except LookupError as error:
                self._send_json(
                    {"error": "stage5_shadow_workflow_not_found", "detail": str(error)},
                    status=404,
                )
                return
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_stage5_shadow_session", "detail": str(error)},
                    status=400,
                )
                return
            self._send_json({"shadowSession": session}, status=201 if created else 200)
            return
        if parsed.path == "/api/execution/sandbox-readiness-decisions":
            try:
                payload = self._read_json_body()
                if not isinstance(payload, dict) or set(payload) != {
                    "baseRunId", "workflowHash", "sessionHash", "operator", "confirmed"
                }:
                    raise ValueError("stage5 sandbox readiness request fields are invalid")
                base_run_id = _required_stage4_string(payload["baseRunId"])
                workflow_hash = _required_stage4_string(payload["workflowHash"])
                session_hash = _required_stage4_string(payload["sessionHash"])
                operator = _required_stage4_string(payload["operator"])
                confirmed = payload["confirmed"]
                if confirmed is not True:
                    raise ValueError("stage5 sandbox readiness confirmation is required")
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_stage5_sandbox_readiness_request", "detail": str(error)},
                    status=400,
                )
                return
            try:
                workflow = _stage5_shadow_source_workflow(
                    self.audit_event_store, base_run_id, workflow_hash
                )
                session = next(
                    (
                        item for item in _stage5_shadow_sessions(
                            self.audit_event_store, base_run_id, workflow_hash
                        )
                        if item["sessionHash"] == session_hash
                    ),
                    None,
                )
                if session is None:
                    raise LookupError("reconciled Stage 5 shadow session was not found")
                executions = _stage5_sandbox_readiness_adapter_executions(
                    self.audit_event_store, workflow
                )
                candidate = build_stage5_sandbox_readiness_decision(
                    workflow,
                    session,
                    executions,
                    operator=operator,
                    confirmed=True,
                )
                existing = next(
                    (
                        item for item in _stage5_sandbox_readiness_decisions(
                            self.audit_event_store, base_run_id
                        )
                        if item["decisionId"] == candidate["decisionId"]
                    ),
                    None,
                )
                if existing is not None:
                    decision = existing
                    created = False
                else:
                    self.audit_event_store.record(
                        stage5_sandbox_readiness_decision_to_audit_event(candidate)
                    )
                    decision = candidate
                    created = True
            except (LookupError, ValueError) as error:
                self._send_json(
                    {"error": "stage5_sandbox_readiness_blocked", "blockers": [str(error)]},
                    status=409,
                )
                return
            self._send_json(
                {"sandboxReadinessDecision": decision}, status=201 if created else 200
            )
            return
        if parsed.path == "/api/execution/sandbox-authorization-preflights":
            try:
                payload = self._read_json_body()
                if not isinstance(payload, dict) or set(payload) != {
                    "baseRunId", "readinessDecisionHash", "sandboxProbeExecutionId",
                    "sandboxProbeReviewId", "operator", "confirmed",
                }:
                    raise ValueError("stage5 sandbox authorization preflight request fields are invalid")
                base_run_id = _required_stage4_string(payload["baseRunId"])
                decision_hash = _required_stage4_string(payload["readinessDecisionHash"])
                execution_id = _required_stage4_string(payload["sandboxProbeExecutionId"])
                review_id = _required_stage4_string(payload["sandboxProbeReviewId"])
                operator = _required_stage4_string(payload["operator"])
                if payload["confirmed"] is not True:
                    raise ValueError("stage5 sandbox authorization preflight confirmation is required")
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_stage5_sandbox_authorization_preflight_request", "detail": str(error)},
                    status=400,
                )
                return
            try:
                decision = _stage5_sandbox_readiness_decision_by_hash(
                    self.audit_event_store, base_run_id, decision_hash
                )
                execution_event = self.audit_event_store.get(execution_id)
                review_event = self.audit_event_store.get(review_id)
                execution = _stage5_sandbox_authorization_probe_execution(execution_event)
                review = _stage5_sandbox_authorization_probe_review(review_event)
                if decision is None or execution is None or review is None:
                    raise LookupError("stage5 sandbox authorization preflight source evidence was not found")
                existing_event = self.audit_event_store.get(
                    stage5_sandbox_authorization_preflight_id(
                        decision_hash, execution_id, review_id
                    )
                )
                existing = (
                    _stage5_sandbox_authorization_preflight_from_event(
                        self.audit_event_store, base_run_id, existing_event
                    )
                    if existing_event is not None
                    else None
                )
                if existing is not None:
                    self._send_json({"sandboxAuthorizationPreflight": existing})
                    return
                candidate = build_stage5_sandbox_authorization_preflight(
                    decision,
                    execution,
                    review,
                    operator=operator,
                    confirmed=True,
                )
                self.audit_event_store.record(
                    stage5_sandbox_authorization_preflight_to_audit_event(candidate)
                )
                preflight, created = candidate, True
            except (LookupError, ValueError) as error:
                self._send_json(
                    {"error": "stage5_sandbox_authorization_preflight_blocked", "blockers": [str(error)]},
                    status=409,
                )
                return
            self._send_json(
                {"sandboxAuthorizationPreflight": preflight}, status=201 if created else 200
            )
            return
        if parsed.path == "/api/execution/sandbox-authorization-reviews":
            try:
                payload = self._read_json_body()
                if not isinstance(payload, dict) or set(payload) != {
                    "baseRunId", "preflightHash", "reviewer", "outcome", "reason", "confirmations",
                }:
                    raise ValueError("stage5 sandbox authorization review request fields are invalid")
                base_run_id = _required_stage4_string(payload["baseRunId"])
                preflight_hash = _required_stage4_string(payload["preflightHash"])
                reviewer = _required_stage4_string(payload["reviewer"])
                outcome = _required_stage4_string(payload["outcome"])
                reason = _required_stage4_string(payload["reason"])
                confirmations = payload["confirmations"]
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_stage5_sandbox_authorization_review_request", "detail": str(error)},
                    status=400,
                )
                return
            try:
                preflight = _stage5_sandbox_authorization_preflight_by_hash(
                    self.audit_event_store, base_run_id, preflight_hash
                )
                if preflight is None:
                    raise LookupError("stage5 sandbox authorization review preflight was not found")
                existing_event = self.audit_event_store.get(
                    stage5_sandbox_authorization_review_id(preflight_hash)
                )
                if existing_event is not None:
                    review = _stage5_sandbox_authorization_review_from_event(
                        self.audit_event_store, base_run_id, existing_event
                    )
                    self._send_json({"sandboxAuthorizationReview": review})
                    return
                execution = _stage5_sandbox_authorization_probe_execution(
                    self.audit_event_store.get(preflight["sandboxProbeExecutionId"])
                )
                if execution is None:
                    raise LookupError("stage5 sandbox authorization review probe evidence was not found")
                review = build_stage5_sandbox_authorization_review(
                    preflight,
                    execution,
                    reviewer=reviewer,
                    outcome=outcome,
                    reason=reason,
                    confirmations=confirmations,
                )
                stored_event, created = self.audit_event_store.record_if_absent(
                    stage5_sandbox_authorization_review_to_audit_event(review)
                )
                review = _stage5_sandbox_authorization_review_from_event(
                    self.audit_event_store, base_run_id, stored_event
                )
            except (LookupError, ValueError) as error:
                self._send_json(
                    {"error": "stage5_sandbox_authorization_review_blocked", "blockers": [str(error)]},
                    status=409,
                )
                return
            self._send_json({"sandboxAuthorizationReview": review}, status=201 if created else 200)
            return
        if parsed.path == "/api/portfolio/backtest":
            try:
                portfolio = _portfolio_backtest_from_payload(self._read_json_body(), self.run_store)
            except LookupError as error:
                self._send_json({"error": "research_run_not_found", "detail": str(error)}, status=404)
                return
            except ValueError as error:
                self._send_json({"error": "invalid_portfolio_backtest", "detail": str(error)}, status=400)
                return
            self._send_json({"portfolio": portfolio_backtest_run_to_payload(portfolio)})
            return
        if parsed.path == "/api/portfolio/paper-orders":
            try:
                payload = self._read_json_body()
                batch = create_portfolio_paper_order_batch(
                    base_run_id=str(payload.get("baseRunId") or ""),
                    portfolio_name=str(payload.get("portfolioName") or ""),
                    orders=payload.get("orders") if isinstance(payload.get("orders"), list) else [],
                    source=str(payload.get("source") or "portfolio_backtest"),
                )
            except ValueError as error:
                self._send_json({"error": "invalid_portfolio_paper_orders", "detail": str(error)}, status=400)
                return
            existing_batch = _find_duplicate_portfolio_paper_order_batch(
                self.portfolio_paper_order_store,
                batch,
            )
            if existing_batch is not None:
                self._send_json(
                    {
                        "error": "portfolio_paper_order_batch_already_recorded",
                        "detail": existing_batch.batch_id,
                        "existingBatch": portfolio_paper_order_batch_to_payload(existing_batch),
                        "portfolioPaperOrderLifecycle": build_portfolio_paper_order_lifecycle(existing_batch),
                    },
                    status=409,
                )
                return
            self.portfolio_paper_order_store.record(batch)
            audit_event = self.audit_event_store.record(portfolio_paper_order_batch_to_audit_event_payload(batch))
            self._send_json(
                {
                    "portfolioPaperOrderBatch": portfolio_paper_order_batch_to_payload(batch),
                    "portfolioPaperOrderLifecycle": build_portfolio_paper_order_lifecycle(batch),
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=201,
            )
            return
        if parsed.path == "/api/portfolio/paper-order-approvals":
            try:
                payload = self._read_json_body()
                approval = create_portfolio_paper_order_approval(
                    base_run_id=str(payload.get("baseRunId") or ""),
                    batch_id=str(payload.get("batchId") or ""),
                    order_id=str(payload.get("orderId") or ""),
                    approved=bool(payload.get("approved")),
                    reviewer=str(payload.get("reviewer") or ""),
                    reviewed_at=payload.get("reviewedAt"),
                    reason=str(payload.get("reason") or ""),
                )
                batch = _find_portfolio_paper_order_batch(
                    self.portfolio_paper_order_store,
                    approval.base_run_id,
                    approval.batch_id,
                )
                if not any(str(order.get("orderId") or "") == approval.order_id for order in batch.orders):
                    raise ValueError("portfolio_paper_order_approval_order_not_found")
                existing_simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(
                    approval.base_run_id
                )
                if any(
                    simulation.batch_id == approval.batch_id
                    and simulation.order_id == approval.order_id
                    and simulation.order_state == "filled"
                    and simulation.fill_status == "filled"
                    for simulation in existing_simulations
                ):
                    approvals = self.portfolio_paper_order_approval_store.list_by_batch(
                        approval.base_run_id,
                        approval.batch_id,
                    )
                    lifecycle = build_portfolio_paper_order_lifecycle(
                        batch,
                        approvals=portfolio_paper_order_approvals_to_map(approvals),
                    )
                    existing_approval = next(
                        (item for item in approvals if item.order_id == approval.order_id),
                        None,
                    )
                    existing_simulation = next(
                        (
                            simulation
                            for simulation in existing_simulations
                            if simulation.batch_id == approval.batch_id
                            and simulation.order_id == approval.order_id
                            and simulation.order_state == "filled"
                            and simulation.fill_status == "filled"
                        ),
                        None,
                    )
                    self._send_json(
                        {
                            "error": "portfolio_paper_order_approval_locked_after_simulation",
                            "detail": approval.order_id,
                            "existingApproval": (
                                portfolio_paper_order_approval_to_payload(existing_approval)
                                if existing_approval is not None
                                else None
                            ),
                            "existingSimulation": (
                                portfolio_paper_order_simulation_to_payload(existing_simulation)
                                if existing_simulation is not None
                                else None
                            ),
                            "approvals": [portfolio_paper_order_approval_to_payload(item) for item in approvals],
                            "portfolioPaperOrderLifecycle": lifecycle,
                        },
                        status=409,
                    )
                    return
            except LookupError as error:
                self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
                return
            except ValueError as error:
                self._send_json({"error": "invalid_portfolio_paper_order_approval", "detail": str(error)}, status=400)
                return
            self.portfolio_paper_order_approval_store.record(approval)
            approvals = self.portfolio_paper_order_approval_store.list_by_batch(approval.base_run_id, approval.batch_id)
            lifecycle = build_portfolio_paper_order_lifecycle(
                batch,
                approvals=portfolio_paper_order_approvals_to_map(approvals),
            )
            lifecycle_row = _find_portfolio_paper_order_lifecycle_row(lifecycle, approval.order_id)
            audit_event = self.audit_event_store.record(
                portfolio_paper_order_approval_to_audit_event_payload(approval, batch=batch, lifecycle_row=lifecycle_row)
            )
            self._send_json(
                {
                    "approval": portfolio_paper_order_approval_to_payload(approval),
                    "approvals": [portfolio_paper_order_approval_to_payload(item) for item in approvals],
                    "portfolioPaperOrderLifecycle": lifecycle,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=201,
            )
            return
        if parsed.path == "/api/portfolio/paper-order-simulations/batch":
            try:
                payload = self._read_json_body()
                base_run_id = str(payload.get("baseRunId") or "").strip()
                batch_id = str(payload.get("batchId") or "").strip()
                if not base_run_id or not batch_id:
                    raise ValueError("portfolio_paper_order_simulation_context_required")
                batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
                approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
                lifecycle = build_portfolio_paper_order_lifecycle(
                    batch,
                    approvals=portfolio_paper_order_approvals_to_map(approvals),
                )
                requested_order_ids = [
                    str(order_id).strip()
                    for order_id in payload.get("orderIds", [])
                    if str(order_id).strip()
                ] if isinstance(payload.get("orderIds"), list) else []
                requested_order_id_set = set(requested_order_ids)
                lifecycle_rows = [
                    row
                    for row in lifecycle
                    if not requested_order_id_set or str(row.get("orderId") or "") in requested_order_id_set
                ]
                if requested_order_ids and len(lifecycle_rows) != len(requested_order_id_set):
                    raise ValueError("portfolio_paper_order_simulation_order_not_found")
                adapter_evidence_by_order_id = _portfolio_paper_order_adapter_evidence_by_order_id(payload)
                existing_simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(base_run_id)
                existing_simulation_keys = {
                    (simulation.base_run_id, simulation.batch_id, simulation.order_id)
                    for simulation in existing_simulations
                    if simulation.order_state == "filled" and simulation.fill_status == "filled"
                }
                created_simulations: list[PortfolioPaperOrderSimulation] = []
                audit_events = []
                blocked_orders = []
                skipped_orders = []
                for row in lifecycle_rows:
                    order_id = str(row.get("orderId") or "").strip()
                    order_label = {
                        "orderId": order_id,
                        "symbol": str(row.get("symbol") or ""),
                        "side": str(row.get("side") or ""),
                    }
                    if (base_run_id, batch_id, order_id) in existing_simulation_keys:
                        skipped_orders.append({**order_label, "reason": "already_simulated"})
                        continue
                    if str(row.get("state") or "") != "ready_for_simulation" or not bool(row.get("routable")):
                        skipped_orders.append({**order_label, "reason": str(row.get("state") or "not_routable")})
                        continue
                    try:
                        adapter_evidence = adapter_evidence_by_order_id.get(order_id, {})
                        simulation = create_portfolio_paper_order_simulation(
                            batch=batch,
                            lifecycle_row=row,
                            existing_simulations=[*existing_simulations, *created_simulations],
                            route_risk=payload.get("routeRisk") if isinstance(payload.get("routeRisk"), dict) else None,
                            adapter_paper_execution_id=str(
                                adapter_evidence.get("adapterPaperExecutionId")
                                or payload.get("adapterPaperExecutionId")
                                or ""
                            ).strip(),
                            adapter_manifest_validation_id=str(
                                adapter_evidence.get("adapterManifestValidationId")
                                or payload.get("adapterManifestValidationId")
                                or ""
                            ).strip(),
                            adapter_paper_execution_evidence=(
                                adapter_evidence.get("adapterPaperExecutionEvidence")
                                if isinstance(adapter_evidence.get("adapterPaperExecutionEvidence"), dict)
                                else payload.get("adapterPaperExecutionEvidence")
                                if isinstance(payload.get("adapterPaperExecutionEvidence"), dict)
                                else None
                            ),
                            simulated_at=payload.get("simulatedAt"),
                        )
                    except ValueError as error:
                        blocked_orders.append({**order_label, "detail": str(error)})
                        break
                    self.portfolio_paper_order_simulation_store.record(simulation)
                    created_simulations.append(simulation)
                    audit_events.append(
                        self.audit_event_store.record(
                            portfolio_paper_order_simulation_to_audit_event_payload(
                                simulation,
                                batch=batch,
                                lifecycle_row=row,
                            )
                        )
                    )
                simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
                if blocked_orders and not created_simulations:
                    batch_status = "blocked"
                    response_status = 409
                elif blocked_orders or skipped_orders:
                    batch_status = "partial"
                    response_status = 201
                elif created_simulations:
                    batch_status = "filled"
                    response_status = 201
                else:
                    batch_status = "skipped"
                    response_status = 200
                self._send_json(
                    {
                        "batchSimulation": {
                            "schemaVersion": 1,
                            "mode": "portfolio_paper_order_batch_simulation",
                            "status": batch_status,
                            "baseRunId": base_run_id,
                            "batchId": batch_id,
                            "requestedCount": len(lifecycle_rows),
                            "filledCount": len(created_simulations),
                            "blockedCount": len(blocked_orders),
                            "skippedCount": len(skipped_orders),
                            "filledOrderIds": [simulation.order_id for simulation in created_simulations],
                            "blockedOrders": blocked_orders,
                            "skippedOrders": skipped_orders,
                            "paperOnly": True,
                            "liveExecutionBlocked": True,
                        },
                        "simulations": [portfolio_paper_order_simulation_to_payload(item) for item in simulations],
                        "createdSimulations": [
                            portfolio_paper_order_simulation_to_payload(item) for item in created_simulations
                        ],
                        "portfolioPaperOrderLifecycle": lifecycle,
                        "auditEvents": [audit_event_record_to_payload(event) for event in audit_events],
                    },
                    status=response_status,
                )
                return
            except LookupError as error:
                self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
                return
            except ValueError as error:
                self._send_json({"error": "invalid_portfolio_paper_order_simulation_batch", "detail": str(error)}, status=400)
                return
        if parsed.path == "/api/portfolio/paper-order-simulations":
            try:
                payload = self._read_json_body()
                base_run_id = str(payload.get("baseRunId") or "").strip()
                batch_id = str(payload.get("batchId") or "").strip()
                order_id = str(payload.get("orderId") or "").strip()
                if not base_run_id or not batch_id or not order_id:
                    raise ValueError("portfolio_paper_order_simulation_context_required")
                batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
                approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
                lifecycle = build_portfolio_paper_order_lifecycle(
                    batch,
                    approvals=portfolio_paper_order_approvals_to_map(approvals),
                )
                lifecycle_row = _find_portfolio_paper_order_lifecycle_row(lifecycle, order_id)
                existing_simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(base_run_id)
                existing_simulation = next(
                    (
                        simulation
                        for simulation in existing_simulations
                        if simulation.base_run_id == base_run_id
                        and simulation.batch_id == batch_id
                        and simulation.order_id == order_id
                        and simulation.order_state == "filled"
                        and simulation.fill_status == "filled"
                    ),
                    None,
                )
                if existing_simulation is not None:
                    simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
                    self._send_json(
                        {
                            "error": "portfolio_paper_order_simulation_already_recorded",
                            "detail": order_id,
                            "existingSimulation": portfolio_paper_order_simulation_to_payload(existing_simulation),
                            "simulations": [portfolio_paper_order_simulation_to_payload(item) for item in simulations],
                            "portfolioPaperOrderLifecycle": lifecycle,
                        },
                        status=409,
                    )
                    return
                simulation = create_portfolio_paper_order_simulation(
                    batch=batch,
                    lifecycle_row=lifecycle_row,
                    existing_simulations=existing_simulations,
                    route_risk=payload.get("routeRisk") if isinstance(payload.get("routeRisk"), dict) else None,
                    adapter_paper_execution_id=str(payload.get("adapterPaperExecutionId") or "").strip(),
                    adapter_manifest_validation_id=str(payload.get("adapterManifestValidationId") or "").strip(),
                    adapter_paper_execution_evidence=(
                        payload.get("adapterPaperExecutionEvidence")
                        if isinstance(payload.get("adapterPaperExecutionEvidence"), dict)
                        else None
                    ),
                    simulated_at=payload.get("simulatedAt"),
                )
            except LookupError as error:
                self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
                return
            except ValueError as error:
                self._send_json({"error": "invalid_portfolio_paper_order_simulation", "detail": str(error)}, status=400)
                return
            self.portfolio_paper_order_simulation_store.record(simulation)
            simulations = self.portfolio_paper_order_simulation_store.list_by_batch(simulation.base_run_id, simulation.batch_id)
            audit_event = self.audit_event_store.record(
                portfolio_paper_order_simulation_to_audit_event_payload(
                    simulation,
                    batch=batch,
                    lifecycle_row=lifecycle_row,
                )
            )
            self._send_json(
                {
                    "simulation": portfolio_paper_order_simulation_to_payload(simulation),
                    "simulations": [portfolio_paper_order_simulation_to_payload(item) for item in simulations],
                    "portfolioPaperOrderLifecycle": lifecycle,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=201,
            )
            return
        if parsed.path == "/api/research/notes":
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
        if parsed.path == "/api/handoff-notes":
            try:
                payload = self._read_json_body()
                note_id = str(payload.get("noteId") or "").strip() or create_handoff_note_id()
                audit_event_id = str(payload.get("auditEventId") or "").strip() or f"handoff-note:{note_id}"
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
        if parsed.path == "/api/audit/events":
            try:
                event = self.audit_event_store.record(self._read_json_body())
            except ValueError as error:
                self._send_json({"error": "invalid_audit_event", "detail": str(error)}, status=400)
                return
            self._send_json({"event": audit_event_record_to_payload(event)}, status=201)
            return
        if parsed.path == "/api/audit/signing-keys/rotation-plan":
            payload = self._read_json_body()
            try:
                registry = self._audit_report_signer().registry
                rotation_plan = audit_signing_key_rotation_plan_to_payload(
                    registry,
                    proposed_key_id=str(payload.get("proposedKeyId") or ""),
                    proposed_signer=str(payload.get("proposedSigner") or ""),
                    proposed_chain_id=str(payload.get("proposedChainId") or ""),
                )
            except ValueError as error:
                self._send_json({"error": "invalid_audit_signing_key_rotation_plan", "detail": str(error)}, status=400)
                return
            self._send_json({"rotationPlan": rotation_plan})
            return
        if parsed.path == "/api/audit/signing-keys/rotation-apply":
            payload = self._read_json_body()
            try:
                registry = self._audit_report_signer().registry
                rotation_apply = audit_signing_key_rotation_apply_to_payload(
                    registry,
                    rotation_plan=payload.get("rotationPlan") if isinstance(payload.get("rotationPlan"), dict) else {},
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                )
            except ValueError as error:
                self._send_json({"error": "invalid_audit_signing_key_rotation_apply", "detail": str(error)}, status=400)
                return
            self._send_json(
                {"rotationApply": rotation_apply},
                status=409 if rotation_apply["status"] == "blocked" else 200,
            )
            return
        if parsed.path == "/api/audit/signing-keys/rotation-restart-evidence":
            payload = self._read_json_body()
            apply_event_id = str(payload.get("applyEventId") or "").strip()
            apply_event = self.audit_event_store.get(apply_event_id)
            if not apply_event:
                self._send_json({"error": "audit_signing_key_rotation_apply_event_not_found", "applyEventId": apply_event_id}, status=404)
                return
            try:
                restart_evidence = audit_signing_key_controlled_restart_evidence_to_payload(
                    apply_event,
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
                audit_event = self.audit_event_store.record(
                    audit_signing_key_controlled_restart_evidence_to_audit_event_payload(restart_evidence)
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_audit_signing_key_controlled_restart_evidence", "detail": str(error)},
                    status=400,
                )
                return
            self._send_json(
                {
                    "restartEvidence": restart_evidence,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if restart_evidence["status"] == "blocked" else 201,
            )
            return
        if parsed.path == "/api/audit/signing-keys/secret-materializations":
            payload = self._read_json_body()
            plan_event_id = str(payload.get("planEventId") or "").strip()
            plan_event = self.audit_event_store.get(plan_event_id)
            if not plan_event:
                self._send_json({"error": "audit_signing_key_rotation_plan_event_not_found", "planEventId": plan_event_id}, status=404)
                return
            try:
                secret_materialization = audit_signing_key_secret_materialization_to_payload(
                    plan_event,
                    backend=str(payload.get("backend") or ""),
                    manifest_path=str(payload.get("manifestPath") or ""),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
                audit_event = self.audit_event_store.record(
                    audit_signing_key_secret_materialization_to_audit_event_payload(secret_materialization)
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_audit_signing_key_secret_materialization", "detail": str(error)},
                    status=400,
                )
                return
            self._send_json(
                {
                    "secretMaterialization": secret_materialization,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if secret_materialization["status"] == "blocked" else 201,
            )
            return
        if parsed.path == "/api/audit/signing-keys/environment-bindings":
            payload = self._read_json_body()
            materialization_id = str(payload.get("materializationId") or "").strip()
            materialization_event = self.audit_event_store.get(materialization_id)
            materialization = (
                audit_signing_key_secret_materialization_payload_from_audit_event(materialization_event)
                if materialization_event
                else None
            )
            if not materialization:
                self._send_json(
                    {
                        "error": "audit_signing_key_secret_materialization_not_found",
                        "materializationId": materialization_id,
                    },
                    status=404,
                )
                return
            try:
                environment_binding = audit_signing_key_environment_binding_to_payload(
                    materialization,
                    binding_mode=str(payload.get("bindingMode") or "container_env_reference"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
                audit_event = self.audit_event_store.record(
                    audit_signing_key_environment_binding_to_audit_event_payload(environment_binding)
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_audit_signing_key_environment_binding", "detail": str(error)},
                    status=400,
                )
                return
            self._send_json(
                {
                    "environmentBinding": environment_binding,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if environment_binding["status"] == "blocked" else 201,
            )
            return
        if parsed.path == "/api/audit/signing-keys/runtime-reload-plans":
            payload = self._read_json_body()
            binding_id = str(payload.get("bindingId") or "").strip()
            binding_event = self.audit_event_store.get(binding_id)
            environment_binding = (
                audit_signing_key_environment_binding_payload_from_audit_event(binding_event)
                if binding_event
                else None
            )
            if not environment_binding:
                self._send_json(
                    {
                        "error": "audit_signing_key_environment_binding_not_found",
                        "bindingId": binding_id,
                    },
                    status=404,
                )
                return
            try:
                runtime_reload_plan = audit_signing_key_runtime_reload_plan_to_payload(
                    environment_binding,
                    reload_mode=str(payload.get("reloadMode") or "manual_container_reload_plan"),
                    maintenance_window_id=str(payload.get("maintenanceWindowId") or ""),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
                audit_event = self.audit_event_store.record(
                    audit_signing_key_runtime_reload_plan_to_audit_event_payload(runtime_reload_plan)
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_audit_signing_key_runtime_reload_plan", "detail": str(error)},
                    status=400,
                )
                return
            self._send_json(
                {
                    "runtimeReloadPlan": runtime_reload_plan,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if runtime_reload_plan["status"] == "blocked" else 201,
            )
            return
        if parsed.path == "/api/audit/signing-keys/runtime-reload-executions":
            payload = self._read_json_body()
            plan_id = str(payload.get("planId") or "").strip()
            plan_event = self.audit_event_store.get(plan_id)
            runtime_reload_plan = (
                audit_signing_key_runtime_reload_plan_payload_from_audit_event(plan_event)
                if plan_event
                else None
            )
            if not runtime_reload_plan:
                self._send_json(
                    {
                        "error": "audit_signing_key_runtime_reload_plan_not_found",
                        "planId": plan_id,
                    },
                    status=404,
                )
                return
            try:
                runtime_reload_execution = audit_signing_key_runtime_reload_execution_to_payload(
                    runtime_reload_plan,
                    execution_mode=str(payload.get("executionMode") or "manual_controlled_reload_evidence"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
                audit_event = self.audit_event_store.record(
                    audit_signing_key_runtime_reload_execution_to_audit_event_payload(runtime_reload_execution)
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_audit_signing_key_runtime_reload_execution", "detail": str(error)},
                    status=400,
                )
                return
            self._send_json(
                {
                    "runtimeReloadExecution": runtime_reload_execution,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if runtime_reload_execution["status"] == "blocked" else 201,
            )
            return
        if parsed.path == "/api/audit/signing-keys/rotation-acceptances":
            payload = self._read_json_body()
            execution_id = str(payload.get("executionId") or "").strip()
            execution_event = self.audit_event_store.get(execution_id)
            runtime_reload_execution = (
                audit_signing_key_runtime_reload_execution_payload_from_audit_event(execution_event)
                if execution_event
                else None
            )
            if not runtime_reload_execution:
                self._send_json(
                    {
                        "error": "audit_signing_key_runtime_reload_execution_not_found",
                        "executionId": execution_id,
                    },
                    status=404,
                )
                return
            try:
                rotation_acceptance = audit_signing_key_rotation_acceptance_to_payload(
                    runtime_reload_execution,
                    acceptance_mode=str(payload.get("acceptanceMode") or "manual_rotation_acceptance"),
                    confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
                    operator=str(payload.get("operator") or "local-operator"),
                    metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
                )
                audit_event = self.audit_event_store.record(
                    audit_signing_key_rotation_acceptance_to_audit_event_payload(rotation_acceptance)
                )
            except ValueError as error:
                self._send_json(
                    {"error": "invalid_audit_signing_key_rotation_acceptance", "detail": str(error)},
                    status=400,
                )
                return
            self._send_json(
                {
                    "rotationAcceptance": rotation_acceptance,
                    "auditEvent": audit_event_record_to_payload(audit_event),
                },
                status=409 if rotation_acceptance["status"] == "blocked" else 201,
            )
            return
        if parsed.path == "/api/audit/reports/sign":
            payload = self._read_json_body()
            event_id = str(payload.get("eventId") or "").strip()
            record = self.audit_event_store.get(event_id)
            if not record:
                self._send_json({"error": "audit_event_not_found", "eventId": event_id}, status=404)
                return
            try:
                signer = self._audit_report_signer()
                signed_event = self.audit_event_store.record(signer.sign_event(record))
                verification, verified_event_payload = signer.verify_event(signed_event)
                verified_event = self.audit_event_store.record(verified_event_payload)
            except ValueError as error:
                detail = str(error)
                self._send_json(
                    {"error": "invalid_audit_report_signature", "detail": detail},
                    status=409 if detail == AUDIT_REPORT_IMPORT_VERIFICATION_INVALID_REASON else 400,
                )
                return
            signature = verified_event.metadata.get("signature") if isinstance(verified_event.metadata, dict) else {}
            self._send_json(
                {
                    "event": audit_event_record_to_payload(verified_event),
                    "signature": signature if isinstance(signature, dict) else {},
                    "verification": audit_report_verification_to_payload(verification),
                }
            )
            return
        if parsed.path == "/api/audit/reports/verify":
            payload = self._read_json_body()
            event_id = str(payload.get("eventId") or "").strip()
            record = self.audit_event_store.get(event_id)
            if not record:
                self._send_json({"error": "audit_event_not_found", "eventId": event_id}, status=404)
                return
            try:
                verification, verified_event_payload = self._audit_report_signer().verify_event(record)
                verified_event = self.audit_event_store.record(verified_event_payload)
            except ValueError as error:
                self._send_json({"error": "invalid_audit_report_signature", "detail": str(error)}, status=400)
                return
            signature = verified_event.metadata.get("signature") if isinstance(verified_event.metadata, dict) else {}
            self._send_json(
                {
                    "event": audit_event_record_to_payload(verified_event),
                    "signature": signature if isinstance(signature, dict) else {},
                    "verification": audit_report_verification_to_payload(verification),
                },
                status=409 if verification.status == "invalid" else 200,
            )
            return
        if parsed.path == "/api/audit/reports/verify-package":
            payload = self._read_json_body()
            try:
                verification, verified_event_payload = self._audit_report_signer().verify_report_artifact(
                    payload.get("report") if isinstance(payload.get("report"), dict) else {}
                )
            except ValueError as error:
                self._send_json({"error": "invalid_audit_report_package_signature", "detail": str(error)}, status=400)
                return
            metadata = verified_event_payload.get("metadata", {})
            signature = metadata.get("signature", {}) if isinstance(metadata, dict) else {}
            self._send_json(
                {
                    "event": verified_event_payload,
                    "signature": signature if isinstance(signature, dict) else {},
                    "verification": audit_report_verification_to_payload(verification),
                },
                status=409 if verification.status == "invalid" else 200,
            )
            return
        if parsed.path == "/api/audit/reports/revoke":
            payload = self._read_json_body()
            event_id = str(payload.get("eventId") or "").strip()
            reason = str(payload.get("reason") or "manual audit revocation").strip()
            record = self.audit_event_store.get(event_id)
            if not record:
                self._send_json({"error": "audit_event_not_found", "eventId": event_id}, status=404)
                return
            try:
                verification, revoked_event_payload = self._audit_report_signer().revoke_event(record, reason=reason)
                revoked_event = self.audit_event_store.record(revoked_event_payload)
            except ValueError as error:
                self._send_json({"error": "invalid_audit_report_signature", "detail": str(error)}, status=409)
                return
            signature = revoked_event.metadata.get("signature") if isinstance(revoked_event.metadata, dict) else {}
            self._send_json(
                {
                    "event": audit_event_record_to_payload(revoked_event),
                    "signature": signature if isinstance(signature, dict) else {},
                    "verification": audit_report_verification_to_payload(verification),
                }
            )
            return
        if parsed.path == "/api/research/runs/import/undo":
            payload = self._read_json_body()
            undo_token = str(payload.get("undoToken") or "").strip()
            expected_run_id = str(payload.get("expectedRunId") or "").strip()
            if not expected_run_id:
                self._send_json(
                    {
                        "error": "research_run_import_undo_expected_run_required",
                        "undoToken": undo_token,
                    },
                    status=400,
                )
                return
            undo_record = self.import_undo_store.get(undo_token)
            if not undo_record:
                self._send_json({"error": "research_run_import_undo_not_found", "undoToken": undo_token}, status=404)
                return
            if undo_record.run_id != expected_run_id:
                self._send_json(
                    {
                        "error": "research_run_import_undo_run_mismatch",
                        "runId": undo_record.run_id,
                        "expectedRunId": expected_run_id,
                        "undo": research_run_import_undo_record_to_payload(undo_record),
                    },
                    status=409,
                )
                return
            if undo_record.consumed_at:
                self._send_json(
                    {
                        "error": "research_run_import_undo_already_consumed",
                        "undo": research_run_import_undo_record_to_payload(undo_record),
                    },
                    status=409,
                )
                return
            try:
                previous_run = _undo_research_run_import_from_record(
                    run_store=self.run_store,
                    note_store=self.note_store,
                    strategy_store=self.strategy_store,
                    paper_execution_store=self.paper_execution_store,
                    portfolio_paper_order_store=self.portfolio_paper_order_store,
                    portfolio_paper_order_approval_store=self.portfolio_paper_order_approval_store,
                    portfolio_paper_order_simulation_store=self.portfolio_paper_order_simulation_store,
                    ai_review_store=self.ai_review_store,
                    ai_review_decision_store=self._current_ai_review_decision_store(),
                    audit_event_store=self.audit_event_store,
                    handoff_note_store=self.handoff_note_store,
                    undo_record=undo_record,
                )
                consumed = self.import_undo_store.mark_consumed(undo_record.undo_token)
            except ValueError as error:
                self._send_json({"error": "invalid_research_run_import_undo", "detail": str(error)}, status=400)
                return
            self._send_json(
                {
                    "undo": {
                        **research_run_import_undo_record_to_payload(consumed or undo_record),
                        "status": "undone",
                    },
                    "run": research_run_audit_to_payload(previous_run, include_data_snapshot=True) if previous_run else None,
                }
            )
            return
        if parsed.path == "/api/research/runs/import":
            try:
                payload = self._read_json_body()
                run_id = research_run_import_precheck(payload)
                ai_review_records, ai_review_records_v2, ai_review_decision_records = (
                    _preflight_ai_review_archive(
                        payload,
                        run_id=run_id,
                        review_store=self.ai_review_store,
                        decision_store=self._current_ai_review_decision_store(),
                    )
                )
                audit = research_run_import_to_audit(payload)
                paper_executions = research_run_import_paper_executions(payload, run_id=audit.run_id)
                portfolio_paper_orders = research_run_import_portfolio_paper_orders(payload, base_run_id=audit.run_id)
                portfolio_paper_order_approvals = research_run_import_portfolio_paper_order_approvals(
                    payload,
                    base_run_id=audit.run_id,
                )
                portfolio_paper_order_simulations = research_run_import_portfolio_paper_order_simulations(
                    payload,
                    base_run_id=audit.run_id,
                )
                audit_events = research_run_import_audit_events(payload, run_id=audit.run_id)
                handoff_notes = research_run_import_handoff_notes(payload, run_id=audit.run_id)
                paper_execution_records = [
                    paper_execution_payload_to_record(execution_payload) for execution_payload in paper_executions
                ]
                portfolio_paper_order_batches = [
                    portfolio_paper_order_payload_to_batch(batch_payload) for batch_payload in portfolio_paper_orders
                ]
                portfolio_paper_order_approval_records = [
                    portfolio_paper_order_payload_to_approval(approval_payload)
                    for approval_payload in portfolio_paper_order_approvals
                ]
                portfolio_paper_order_simulation_records = [
                    portfolio_paper_order_payload_to_simulation(simulation_payload)
                    for simulation_payload in portfolio_paper_order_simulations
                ]
                imported_note = _importable_research_note_payload(
                    audit.research_note,
                    market=audit.market,
                    symbol=audit.symbol,
                    timeframe=audit.timeframe,
                )
            except ValueError as error:
                self._send_json({"error": "invalid_research_run_export", "detail": str(error)}, status=400)
                return
            undo_snapshot = None
            try:
                undo_snapshot = _persist_research_run_import(
                    run_store=self.run_store,
                    note_store=self.note_store,
                    strategy_store=self.strategy_store,
                    paper_execution_store=self.paper_execution_store,
                    portfolio_paper_order_store=self.portfolio_paper_order_store,
                    portfolio_paper_order_approval_store=self.portfolio_paper_order_approval_store,
                    portfolio_paper_order_simulation_store=self.portfolio_paper_order_simulation_store,
                    ai_review_store=self.ai_review_store,
                    ai_review_decision_store=self._current_ai_review_decision_store(),
                    audit_event_store=self.audit_event_store,
                    handoff_note_store=self.handoff_note_store,
                    audit=audit,
                    imported_note=imported_note,
                    paper_execution_records=paper_execution_records,
                    portfolio_paper_order_batches=portfolio_paper_order_batches,
                    portfolio_paper_order_approvals=portfolio_paper_order_approval_records,
                    portfolio_paper_order_simulations=portfolio_paper_order_simulation_records,
                    ai_review_records=ai_review_records,
                    ai_review_records_v2=ai_review_records_v2,
                    ai_review_decision_records=ai_review_decision_records,
                    audit_event_payloads=audit_events,
                    handoff_note_payloads=handoff_notes,
                )
                undo_record = self.import_undo_store.record(run_id=audit.run_id, snapshot=undo_snapshot)
            except Exception as error:
                if undo_snapshot:
                    _undo_research_run_import_from_snapshot(
                        run_store=self.run_store,
                        note_store=self.note_store,
                        strategy_store=self.strategy_store,
                        paper_execution_store=self.paper_execution_store,
                        portfolio_paper_order_store=self.portfolio_paper_order_store,
                        portfolio_paper_order_approval_store=self.portfolio_paper_order_approval_store,
                        portfolio_paper_order_simulation_store=self.portfolio_paper_order_simulation_store,
                        ai_review_store=self.ai_review_store,
                        ai_review_decision_store=self._current_ai_review_decision_store(),
                        audit_event_store=self.audit_event_store,
                        handoff_note_store=self.handoff_note_store,
                        snapshot=undo_snapshot,
                    )
                self._send_json({"error": "research_run_import_write_failed", "detail": str(error)}, status=500)
                return
            self._send_json(
                {
                    "run": research_run_audit_to_payload(audit, include_data_snapshot=True),
                    "undoToken": undo_record.undo_token,
                    "undo": research_run_import_undo_record_to_payload(undo_record),
                },
                status=201,
            )
            return
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/ai-reviews"):
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
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/paper-executions"):
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
        self._send_json({"error": "not_found"}, status=404)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._send_json({"status": "ok", "service": "quant-core"})
            return
        if parsed.path == "/api/ai-review/providers":
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
        decision_review_id = _ai_review_decision_route_id(parsed.path)
        if decision_review_id is not None:
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
        if parsed.path == "/api/ai-reviews":
            try:
                query = _validated_ai_review_query(parsed.query)
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
                code = str(error) or "invalid_ai_review_query"
                if not _is_ai_review_conflict(code):
                    code = "invalid_ai_review_query"
                status = 409 if _is_ai_review_conflict(code) else 400
                self._send_json({"error": code, "detail": _ai_review_error_detail(code)}, status=status)
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
        if parsed.path.startswith("/api/ai-reviews/"):
            ai_review_id = unquote(parsed.path.removeprefix("/api/ai-reviews/")).strip()
            try:
                review = self.ai_review_store.get(ai_review_id) if ai_review_id and "/" not in ai_review_id else None
            except ValueError as error:
                code = str(error) or "ai_review_record_conflict"
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
        if parsed.path == "/api/strategy-experiments":
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
        if parsed.path.startswith("/api/strategy-experiments/"):
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
        if parsed.path == "/api/demo":
            query = parse_qs(parsed.query)
            payload = self._demo_payload(
                market=query.get("market", ["ashare"])[0],
                symbol=query.get("symbol", ["600000"])[0],
                timeframe=query.get("timeframe", ["1d"])[0],
            )
            self._send_json(payload)
            return
        if parsed.path == "/api/workspace":
            workspace = self._workspace_with_saved_watchlist()
            saved_state = self.workspace_state_store.get()
            workspace, _quotes = workspace_with_live_quotes(workspace, self.quote_adapter)
            payload = terminal_workspace_to_payload(workspace)
            if saved_state:
                payload["researchWorkspaceState"] = research_workspace_state_to_payload(saved_state)
            self._send_json(payload)
            return
        if parsed.path == "/api/watchlist":
            watchlist = self.watchlist_store.list_instruments() or build_terminal_workspace().watchlist
            self._send_json({"watchlist": [instrument_to_payload(instrument) for instrument in watchlist]})
            return
        if parsed.path == "/api/research/workspace-state":
            state = self.workspace_state_store.get()
            self._send_json({"state": research_workspace_state_to_payload(state) if state else None})
            return
        if parsed.path == "/api/settings/status":
            self._send_json({"settings": self._settings_status_payload()})
            return
        if parsed.path == "/api/p0/acceptance/latest":
            self._send_json({"acceptance": load_p0_acceptance_status(Path(self.p0_acceptance_report_path))})
            return
        if parsed.path == "/api/p1/acceptance/latest":
            self._send_json({"acceptance": load_p1_acceptance_status(Path(self.p1_acceptance_report_path))})
            return
        if parsed.path == "/api/desktop/release/latest":
            self._send_json({"release": load_desktop_release_status(Path(self.desktop_release_report_path))})
            return
        if parsed.path == "/api/stage1/daily-use/latest":
            self._send_json({"dailyUse": load_stage1_daily_use_status(Path(self.stage1_daily_use_report_path))})
            return
        if parsed.path == "/api/stage1/bootstrap-preflight/latest":
            self._send_json(
                {"preflight": load_stage1_bootstrap_preflight_status(Path(self.stage1_bootstrap_preflight_report_path))}
            )
            return
        if parsed.path == "/api/p2/pre-live/acceptance/latest":
            self._send_json(
                {"acceptance": load_p2_pre_live_acceptance_status(Path(self.p2_pre_live_acceptance_report_path))}
            )
            return
        if parsed.path == "/api/p2/paper-replay/latest":
            self._send_json({"replay": load_p2_paper_replay_status(Path(self.p2_paper_replay_report_path))})
            return
        if parsed.path == "/api/p2/readiness/acceptance/latest":
            self._send_json(
                {"acceptance": load_p2_readiness_acceptance_status(Path(self.p2_readiness_acceptance_report_path))}
            )
            return
        if parsed.path == "/api/p2/manifest-chain/preflight/latest":
            self._send_json(
                {"preflight": load_p2_manifest_chain_preflight_status(Path(self.p2_manifest_chain_preflight_report_path))}
            )
            return
        if parsed.path == "/api/cache/watchlist-refreshes":
            query = parse_qs(parsed.query)
            limit = _parse_limit(query.get("limit", ["10"])[0])
            refreshes = self.watchlist_cache_refresh_store.list_recent(limit=limit)
            self._send_json({"watchlistRefreshes": [watchlist_cache_refresh_run_to_payload(run) for run in refreshes]})
            return
        if parsed.path == "/api/execution/adapter-ledger":
            settings = self._settings_status_payload()
            self._send_json({"adapterLedger": build_execution_adapter_state_ledger(settings)})
            return
        if parsed.path == "/api/execution/adapter-secret-references":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_secret_reference_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            reference_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_secret_reference",
                limit=50,
                query=adapter_id,
            )
            secret_references = []
            for event in reference_events:
                payload = execution_adapter_secret_reference_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    secret_references.append(payload)
                if len(secret_references) >= limit:
                    break
            self._send_json({"adapterSecretReferences": secret_references})
            return
        if parsed.path == "/api/execution/adapter-secret-materializations":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_secret_materialization_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            materialization_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_secret_materialization",
                limit=50,
                query=adapter_id,
            )
            materializations = []
            for event in materialization_events:
                payload = execution_adapter_secret_materialization_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    materializations.append(payload)
                if len(materializations) >= limit:
                    break
            self._send_json({"adapterSecretMaterializations": materializations})
            return
        if parsed.path == "/api/execution/adapter-secret-manifest-validations":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_secret_manifest_validation_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            validation_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_secret_manifest_validation",
                limit=50,
                query=adapter_id,
            )
            validations = []
            for event in validation_events:
                payload = execution_adapter_secret_manifest_validation_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    validations.append(payload)
                if len(validations) >= limit:
                    break
            self._send_json({"adapterSecretManifestValidations": validations})
            return
        if parsed.path == "/api/execution/adapter-environment-bindings":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_environment_binding_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            binding_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_environment_binding",
                limit=50,
                query=adapter_id,
            )
            environment_bindings = []
            for event in binding_events:
                payload = execution_adapter_environment_binding_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    environment_bindings.append(payload)
                if len(environment_bindings) >= limit:
                    break
            self._send_json({"adapterEnvironmentBindings": environment_bindings})
            return
        if parsed.path == "/api/execution/adapter-runtime-reload-plans":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_runtime_reload_plan_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            reload_plan_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_runtime_reload_plan",
                limit=50,
                query=adapter_id,
            )
            runtime_reload_plans = []
            for event in reload_plan_events:
                payload = execution_adapter_runtime_reload_plan_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    runtime_reload_plans.append(payload)
                if len(runtime_reload_plans) >= limit:
                    break
            self._send_json({"adapterRuntimeReloadPlans": runtime_reload_plans})
            return
        if parsed.path == "/api/execution/adapter-runtime-reload-executions":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_runtime_reload_execution_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            reload_execution_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_runtime_reload_execution",
                limit=50,
                query=adapter_id,
            )
            runtime_reload_executions = []
            for event in reload_execution_events:
                payload = execution_adapter_runtime_reload_execution_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    runtime_reload_executions.append(payload)
                if len(runtime_reload_executions) >= limit:
                    break
            self._send_json({"adapterRuntimeReloadExecutions": runtime_reload_executions})
            return
        if parsed.path == "/api/execution/adapter-runtime-reload-acceptances":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_runtime_reload_acceptance_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            reload_acceptance_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_runtime_reload_acceptance",
                limit=50,
                query=adapter_id,
            )
            runtime_reload_acceptances = []
            for event in reload_acceptance_events:
                payload = execution_adapter_runtime_reload_acceptance_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    runtime_reload_acceptances.append(payload)
                if len(runtime_reload_acceptances) >= limit:
                    break
            self._send_json({"adapterRuntimeReloadAcceptances": runtime_reload_acceptances})
            return
        if parsed.path == "/api/execution/adapter-orchestration-dry-runs":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_orchestration_dry_run_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            dry_run_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_orchestration_dry_run",
                limit=50,
                query=adapter_id,
            )
            orchestration_dry_runs = []
            for event in dry_run_events:
                payload = execution_adapter_orchestration_dry_run_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    orchestration_dry_runs.append(payload)
                if len(orchestration_dry_runs) >= limit:
                    break
            self._send_json({"adapterOrchestrationDryRuns": orchestration_dry_runs})
            return
        if parsed.path == "/api/execution/adapter-orchestration-executions":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_orchestration_execution_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            orchestration_execution_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_orchestration_execution",
                limit=50,
                query=adapter_id,
            )
            orchestration_executions = []
            for event in orchestration_execution_events:
                payload = execution_adapter_orchestration_execution_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    orchestration_executions.append(payload)
                if len(orchestration_executions) >= limit:
                    break
            self._send_json({"adapterOrchestrationExecutions": orchestration_executions})
            return
        if parsed.path == "/api/execution/adapter-human-confirmations":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_human_confirmation_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            human_confirmation_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_human_confirmation",
                limit=50,
                query=adapter_id,
            )
            human_confirmations = []
            for event in human_confirmation_events:
                payload = execution_adapter_human_confirmation_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    human_confirmations.append(payload)
                if len(human_confirmations) >= limit:
                    break
            self._send_json({"adapterHumanConfirmations": human_confirmations})
            return
        if parsed.path == "/api/execution/adapter-sandbox-probe-plans":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_sandbox_probe_plan_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            sandbox_probe_plan_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_sandbox_probe_plan",
                limit=50,
                query=adapter_id,
            )
            sandbox_probe_plans = []
            for event in sandbox_probe_plan_events:
                payload = execution_adapter_sandbox_probe_plan_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    sandbox_probe_plans.append(payload)
                if len(sandbox_probe_plans) >= limit:
                    break
            self._send_json({"adapterSandboxProbePlans": sandbox_probe_plans})
            return
        if parsed.path == "/api/execution/adapter-sandbox-probe-executions":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_sandbox_probe_execution_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            sandbox_probe_execution_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_sandbox_probe_execution",
                limit=50,
                query=adapter_id,
            )
            sandbox_probe_executions = []
            for event in sandbox_probe_execution_events:
                payload = execution_adapter_sandbox_probe_execution_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    sandbox_probe_executions.append(payload)
                if len(sandbox_probe_executions) >= limit:
                    break
            self._send_json({"adapterSandboxProbeExecutions": sandbox_probe_executions})
            return
        if parsed.path == "/api/execution/adapter-sandbox-probe-reviews":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_sandbox_probe_review_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            sandbox_probe_review_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_sandbox_probe_review",
                limit=50,
                query=adapter_id,
            )
            sandbox_probe_reviews = []
            for event in sandbox_probe_review_events:
                payload = execution_adapter_sandbox_probe_review_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    sandbox_probe_reviews.append(payload)
                if len(sandbox_probe_reviews) >= limit:
                    break
            self._send_json({"adapterSandboxProbeReviews": sandbox_probe_reviews})
            return
        if parsed.path == "/api/execution/adapter-production-route-reviews":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_production_route_review_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            production_route_review_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_production_route_review",
                limit=50,
                query=adapter_id,
            )
            production_route_reviews = []
            for event in production_route_review_events:
                payload = execution_adapter_production_route_review_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    production_route_reviews.append(payload)
                if len(production_route_reviews) >= limit:
                    break
            self._send_json({"adapterProductionRouteReviews": production_route_reviews})
            return
        if parsed.path == "/api/execution/adapter-sandbox-order-schema-dry-runs":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_sandbox_order_schema_dry_run_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            schema_dry_run_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_sandbox_order_schema_dry_run",
                limit=50,
                query=adapter_id,
            )
            schema_dry_runs = []
            for event in schema_dry_run_events:
                payload = execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    schema_dry_runs.append(payload)
                if len(schema_dry_runs) >= limit:
                    break
            self._send_json({"adapterSandboxOrderSchemaDryRuns": schema_dry_runs})
            return
        if parsed.path == "/api/execution/adapter-paper-order-lifecycles":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_paper_order_lifecycle_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            lifecycle_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_paper_order_lifecycle",
                limit=50,
                query=adapter_id,
            )
            lifecycles = []
            for event in lifecycle_events:
                payload = execution_adapter_paper_order_lifecycle_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    lifecycles.append(payload)
                if len(lifecycles) >= limit:
                    break
            self._send_json({"adapterPaperOrderLifecycles": lifecycles})
            return
        if parsed.path == "/api/execution/adapter-paper-route-runbooks":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_paper_route_runbook_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            runbook_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_paper_route_runbook",
                limit=50,
                query=adapter_id,
            )
            runbooks = []
            for event in runbook_events:
                payload = execution_adapter_paper_route_runbook_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    runbooks.append(payload)
                if len(runbooks) >= limit:
                    break
            self._send_json({"adapterPaperRouteRunbooks": runbooks})
            return
        if parsed.path == "/api/execution/adapter-ops-states":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_ops_state_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            ops_state_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_ops_state",
                limit=50,
                query=adapter_id,
            )
            ops_states = []
            for event in ops_state_events:
                payload = execution_adapter_ops_state_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    ops_states.append(payload)
                if len(ops_states) >= limit:
                    break
            self._send_json({"adapterOpsStates": ops_states})
            return
        if parsed.path == "/api/execution/adapter-paper-executions":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_paper_execution_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            paper_execution_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_paper_execution",
                limit=50,
                query=adapter_id,
            )
            paper_executions = []
            for event in paper_execution_events:
                payload = execution_adapter_paper_execution_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    paper_executions.append(payload)
                if len(paper_executions) >= limit:
                    break
            self._send_json({"adapterPaperExecutions": paper_executions})
            return
        if parsed.path == "/api/execution/adapter-health/ccxt-sandbox":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", ["ccxt-live"])[0].strip() or "ccxt-live"
            production_route_review_id = query.get("productionRouteReviewId", [""])[0].strip()
            production_route_review = None
            if production_route_review_id:
                production_route_review_event = self.audit_event_store.get(production_route_review_id)
                production_route_review = (
                    execution_adapter_production_route_review_payload_from_audit_event(production_route_review_event)
                    if production_route_review_event
                    else None
                )
                if not production_route_review:
                    self._send_json(
                        {
                            "error": "execution_adapter_production_route_review_not_found",
                            "productionRouteReviewId": production_route_review_id,
                        },
                        status=404,
                    )
                    return
                if production_route_review.get("adapterId") != adapter_id:
                    self._send_json(
                        {
                            "error": "execution_adapter_health_route_review_adapter_mismatch",
                            "adapterId": adapter_id,
                            "productionRouteReviewId": production_route_review_id,
                        },
                        status=400,
                    )
                    return
                if production_route_review.get("status") != "route_review_recorded":
                    self._send_json(
                        {
                            "error": "execution_adapter_health_route_review_not_recorded",
                            "adapterProductionRouteReview": production_route_review,
                        },
                        status=409,
                    )
                    return
            exchange_id = (
                query.get("exchange", [""])[0].strip()
                or os.environ.get("CCXT_DEFAULT_EXCHANGE", "binance").strip()
                or "binance"
            )
            probe = probe_ccxt_sandbox_health(
                adapter_id=adapter_id,
                exchange_id=exchange_id,
                environ=type(self).execution_adapter_health_environ,
                exchange_factory=type(self).execution_adapter_health_exchange_factory,
            )
            probe_payload = execution_adapter_health_probe_to_payload(probe)
            if production_route_review:
                _attach_production_route_review_to_health_probe(probe_payload, production_route_review)
            self._send_json({"adapterHealthProbe": probe_payload})
            return
        if parsed.path == "/api/execution/adapter-certifications/restart-acceptance":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_restart_acceptance_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            acceptance_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_restart_acceptance",
                limit=50,
                query=adapter_id,
            )
            restart_acceptances = []
            for event in acceptance_events:
                payload = execution_adapter_restart_acceptance_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    restart_acceptances.append(payload)
                if len(restart_acceptances) >= limit:
                    break
            self._send_json({"restartAcceptances": restart_acceptances})
            return
        if parsed.path == "/api/execution/adapter-certifications/restart-evidence":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_controlled_restart_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            evidence_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_controlled_restart_evidence",
                limit=50,
                query=adapter_id,
            )
            restart_evidence = []
            for event in evidence_events:
                payload = execution_adapter_controlled_restart_evidence_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    restart_evidence.append(payload)
                if len(restart_evidence) >= limit:
                    break
            self._send_json({"controlledRestartEvidence": restart_evidence})
            return
        if parsed.path == "/api/execution/adapter-certifications/applies":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_certification_apply_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            apply_events = self.audit_event_store.list_recent(
                event_type="execution_adapter_certification_apply",
                limit=50,
                query=adapter_id,
            )
            certification_applies = []
            for event in apply_events:
                payload = execution_adapter_certification_apply_payload_from_audit_event(event)
                if payload and payload.get("adapterId") == adapter_id:
                    certification_applies.append(payload)
                if len(certification_applies) >= limit:
                    break
            self._send_json({"certificationApplies": certification_applies})
            return
        if parsed.path == "/api/execution/adapter-certifications":
            query = parse_qs(parsed.query)
            adapter_id = query.get("adapterId", [""])[0].strip()
            if not adapter_id:
                self._send_json({"error": "execution_adapter_certification_adapter_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            certifications = self.execution_adapter_certification_store.list_by_adapter(adapter_id, limit=limit)
            self._send_json(
                {
                    "adapterCertifications": [
                        execution_adapter_certification_to_payload(certification) for certification in certifications
                    ]
                }
            )
            return
        if parsed.path == "/api/portfolio/workflows":
            try:
                base_run_id, limit = _stage4_portfolio_workflow_query(parsed.query)
                events = self.audit_event_store.list_recent(
                    run_id=base_run_id,
                    event_type="stage4_portfolio_workflow",
                    limit=limit,
                )
                workflows = []
                for event in events:
                    snapshot = validate_stage4_portfolio_workflow_snapshot(event.metadata.get("snapshot"))
                    generated_at = datetime.fromisoformat(snapshot["generatedAt"])
                    if (
                        snapshot["baseRunId"] != base_run_id
                        or snapshot["workflowId"] != event.event_id
                        or event.created_at.tzinfo is None
                        or event.created_at.utcoffset() is None
                        or event.created_at != generated_at
                    ):
                        raise ValueError("stage4 portfolio workflow audit binding does not match")
                    workflows.append(snapshot)
            except ValueError as error:
                code = (
                    "invalid_stage4_portfolio_workflow_query"
                    if str(error) == "invalid_stage4_portfolio_workflow_query"
                    else "invalid_stage4_portfolio_workflow_store"
                )
                self._send_json({"error": code, "detail": str(error)}, status=400 if code.endswith("query") else 500)
                return
            self._send_json(
                {
                    "workflows": workflows,
                    "pagination": {
                        "limit": limit,
                        "total": self.audit_event_store.count(
                            run_id=base_run_id,
                            event_type="stage4_portfolio_workflow",
                        ),
                    },
                }
            )
            return
        if parsed.path == "/api/execution/shadow-sessions":
            try:
                base_run_id, limit = _stage5_shadow_query(parsed.query)
                sessions = _stage5_shadow_sessions(
                    self.audit_event_store, base_run_id, None, limit=limit
                )
            except ValueError as error:
                code = (
                    "invalid_stage5_shadow_session_query"
                    if str(error) == "invalid_stage5_shadow_session_query"
                    else "invalid_stage5_shadow_session_store"
                )
                self._send_json(
                    {"error": code, "detail": str(error)},
                    status=400 if code.endswith("query") else 500,
                )
                return
            self._send_json({"shadowSessions": sessions})
            return
        if parsed.path == "/api/execution/sandbox-readiness-decisions":
            try:
                base_run_id, limit = _stage5_sandbox_readiness_query(parsed.query)
                decisions = _stage5_sandbox_readiness_decisions(
                    self.audit_event_store, base_run_id, limit=limit
                )
            except ValueError as error:
                code = (
                    "invalid_stage5_sandbox_readiness_query"
                    if str(error) == "invalid_stage5_sandbox_readiness_query"
                    else "invalid_stage5_sandbox_readiness_store"
                )
                self._send_json(
                    {"error": code, "detail": str(error)},
                    status=400 if code.endswith("query") else 500,
                )
                return
            self._send_json({"sandboxReadinessDecisions": decisions})
            return
        if parsed.path == "/api/execution/sandbox-authorization-preflights":
            try:
                base_run_id, limit = _stage5_sandbox_authorization_preflight_query(parsed.query)
                preflights = _stage5_sandbox_authorization_preflights(
                    self.audit_event_store, base_run_id, limit=limit
                )
            except ValueError as error:
                code = (
                    "invalid_stage5_sandbox_authorization_preflight_query"
                    if str(error) == "invalid_stage5_sandbox_authorization_preflight_query"
                    else "invalid_stage5_sandbox_authorization_preflight_store"
                )
                self._send_json(
                    {"error": code, "detail": str(error)},
                    status=400 if code.endswith("query") else 500,
                )
                return
            self._send_json({"sandboxAuthorizationPreflights": preflights})
            return
        if parsed.path == "/api/execution/sandbox-authorization-reviews":
            try:
                base_run_id, limit = _stage5_sandbox_authorization_preflight_query(parsed.query)
                reviews = _stage5_sandbox_authorization_reviews(
                    self.audit_event_store, base_run_id, limit=limit
                )
            except ValueError as error:
                code = (
                    "invalid_stage5_sandbox_authorization_review_query"
                    if str(error) == "invalid_stage5_sandbox_authorization_preflight_query"
                    else "invalid_stage5_sandbox_authorization_review_store"
                )
                self._send_json(
                    {"error": code, "detail": str(error)},
                    status=400 if code.endswith("query") else 500,
                )
                return
            self._send_json({"sandboxAuthorizationReviews": reviews})
            return
        if parsed.path == "/api/portfolio/paper-orders":
            query = parse_qs(parsed.query)
            base_run_id = query.get("baseRunId", [""])[0].strip()
            if not base_run_id:
                self._send_json({"error": "portfolio_paper_order_base_run_id_required"}, status=400)
                return
            limit = _parse_limit(query.get("limit", ["20"])[0])
            batches = self.portfolio_paper_order_store.list_by_base_run(base_run_id, limit=limit)
            self._send_json(
                {
                    "portfolioPaperOrderBatches": [
                        portfolio_paper_order_batch_to_payload(batch) for batch in batches
                    ]
                }
            )
            return
        if parsed.path == "/api/portfolio/paper-order-replay":
            query = parse_qs(parsed.query)
            base_run_id = query.get("baseRunId", [""])[0].strip()
            if not base_run_id:
                self._send_json({"error": "portfolio_paper_order_replay_base_run_id_required"}, status=400)
                return
            initial_cash = _parse_positive_float(query.get("initialCash", ["100000"])[0], default=100_000.0)
            simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(base_run_id)
            replay = build_portfolio_paper_order_replay(
                simulations,
                base_run_id=base_run_id,
                initial_cash=initial_cash,
            )
            self._send_json({"replay": replay})
            return
        if parsed.path == "/api/portfolio/paper-order-state-history":
            query = parse_qs(parsed.query)
            base_run_id = query.get("baseRunId", [""])[0].strip()
            batch_id = query.get("batchId", [""])[0].strip()
            if not base_run_id or not batch_id:
                self._send_json({"error": "portfolio_paper_order_state_history_context_required"}, status=400)
                return
            try:
                batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
            except LookupError as error:
                self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
                return
            approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
            simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
            self._send_json(
                {
                    "stateHistory": build_portfolio_paper_order_state_history(
                        batch,
                        approvals=approvals,
                        simulations=simulations,
                    )
                }
            )
            return
        if parsed.path == "/api/portfolio/paper-order-approvals":
            query = parse_qs(parsed.query)
            base_run_id = query.get("baseRunId", [""])[0].strip()
            batch_id = query.get("batchId", [""])[0].strip()
            if not base_run_id or not batch_id:
                self._send_json({"error": "portfolio_paper_order_approval_context_required"}, status=400)
                return
            try:
                batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
            except LookupError as error:
                self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
                return
            approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
            lifecycle = build_portfolio_paper_order_lifecycle(
                batch,
                approvals=portfolio_paper_order_approvals_to_map(approvals),
            )
            self._send_json(
                {
                    "approvals": [portfolio_paper_order_approval_to_payload(approval) for approval in approvals],
                    "portfolioPaperOrderLifecycle": lifecycle,
                }
            )
            return
        if parsed.path == "/api/portfolio/paper-order-simulations":
            query = parse_qs(parsed.query)
            base_run_id = query.get("baseRunId", [""])[0].strip()
            batch_id = query.get("batchId", [""])[0].strip()
            if not base_run_id or not batch_id:
                self._send_json({"error": "portfolio_paper_order_simulation_context_required"}, status=400)
                return
            try:
                batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
            except LookupError as error:
                self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
                return
            approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
            lifecycle = build_portfolio_paper_order_lifecycle(
                batch,
                approvals=portfolio_paper_order_approvals_to_map(approvals),
            )
            simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
            self._send_json(
                {
                    "simulations": [portfolio_paper_order_simulation_to_payload(simulation) for simulation in simulations],
                    "portfolioPaperOrderLifecycle": lifecycle,
                }
            )
            return
        if parsed.path == "/api/audit/signing-keys":
            try:
                registry = self._audit_report_signer().registry
            except ValueError as error:
                self._send_json({"error": "invalid_audit_signing_key_registry", "detail": str(error)}, status=400)
                return
            self._send_json({"registry": audit_signing_key_registry_to_payload(registry)})
            return
        if parsed.path == "/api/audit/signing-keys/secret-materializations":
            query = parse_qs(parsed.query)
            proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
            limit = _parse_limit(query.get("limit", ["20"])[0])
            materialization_events = self.audit_event_store.list_recent(
                event_type="audit_signing_key_secret_materialization",
                limit=50,
                query=proposed_key_id,
            )
            materializations = []
            for event in materialization_events:
                payload = audit_signing_key_secret_materialization_payload_from_audit_event(event)
                if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
                    materializations.append(payload)
                if len(materializations) >= limit:
                    break
            self._send_json({"secretMaterializations": materializations})
            return
        if parsed.path == "/api/audit/signing-keys/environment-bindings":
            query = parse_qs(parsed.query)
            proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
            limit = _parse_limit(query.get("limit", ["20"])[0])
            binding_events = self.audit_event_store.list_recent(
                event_type="audit_signing_key_environment_binding",
                limit=50,
                query=proposed_key_id,
            )
            environment_bindings = []
            for event in binding_events:
                payload = audit_signing_key_environment_binding_payload_from_audit_event(event)
                if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
                    environment_bindings.append(payload)
                if len(environment_bindings) >= limit:
                    break
            self._send_json({"environmentBindings": environment_bindings})
            return
        if parsed.path == "/api/audit/signing-keys/runtime-reload-plans":
            query = parse_qs(parsed.query)
            proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
            limit = _parse_limit(query.get("limit", ["20"])[0])
            plan_events = self.audit_event_store.list_recent(
                event_type="audit_signing_key_runtime_reload_plan",
                limit=50,
                query=proposed_key_id,
            )
            runtime_reload_plans = []
            for event in plan_events:
                payload = audit_signing_key_runtime_reload_plan_payload_from_audit_event(event)
                if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
                    runtime_reload_plans.append(payload)
                if len(runtime_reload_plans) >= limit:
                    break
            self._send_json({"runtimeReloadPlans": runtime_reload_plans})
            return
        if parsed.path == "/api/audit/signing-keys/runtime-reload-executions":
            query = parse_qs(parsed.query)
            proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
            limit = _parse_limit(query.get("limit", ["20"])[0])
            execution_events = self.audit_event_store.list_recent(
                event_type="audit_signing_key_runtime_reload_execution",
                limit=50,
                query=proposed_key_id,
            )
            runtime_reload_executions = []
            for event in execution_events:
                payload = audit_signing_key_runtime_reload_execution_payload_from_audit_event(event)
                if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
                    runtime_reload_executions.append(payload)
                if len(runtime_reload_executions) >= limit:
                    break
            self._send_json({"runtimeReloadExecutions": runtime_reload_executions})
            return
        if parsed.path == "/api/audit/signing-keys/rotation-acceptances":
            query = parse_qs(parsed.query)
            proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
            limit = _parse_limit(query.get("limit", ["20"])[0])
            acceptance_events = self.audit_event_store.list_recent(
                event_type="audit_signing_key_rotation_acceptance",
                limit=50,
                query=proposed_key_id,
            )
            rotation_acceptances = []
            for event in acceptance_events:
                payload = audit_signing_key_rotation_acceptance_payload_from_audit_event(event)
                if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
                    rotation_acceptances.append(payload)
                if len(rotation_acceptances) >= limit:
                    break
            self._send_json({"rotationAcceptances": rotation_acceptances})
            return
        if parsed.path == "/api/golden-path/status":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            symbol = query.get("symbol", ["600000"])[0]
            timeframe = query.get("timeframe", ["1d"])[0]
            context_runs = [
                run
                for run in self.run_store.list_recent(limit=50)
                if run.market == market and run.symbol == symbol and run.timeframe == timeframe
            ]
            latest_run = context_runs[0] if context_runs else None
            paper_executions = self.paper_execution_store.list_by_run(latest_run.run_id, limit=20) if latest_run else []
            try:
                market_calendar = None if latest_run else build_market_calendar_status(market)
            except ValueError:
                market_calendar = None
            self._send_json(
                {
                    "goldenPath": build_golden_path_status(
                        market=market,
                        symbol=symbol,
                        timeframe=timeframe,
                        settings=self._settings_status_payload(),
                        runs=context_runs,
                        paper_executions=paper_executions,
                        watchlist_refreshes=self.watchlist_cache_refresh_store.list_recent(limit=10),
                        market_calendar=market_calendar,
                    )
                }
            )
            return
        if parsed.path == "/api/audit/events":
            query = parse_qs(parsed.query)
            run_id = query.get("runId", [""])[0].strip() or None
            event_type = query.get("eventType", [""])[0].strip() or None
            limit = _parse_limit(query.get("limit", ["20"])[0])
            offset = _parse_offset(query.get("offset", ["0"])[0])
            search_query = query.get("query", [""])[0].strip()
            events = self.audit_event_store.list_recent(
                run_id=run_id,
                event_type=event_type,
                limit=limit,
                offset=offset,
                query=search_query,
            )
            total = self.audit_event_store.count(run_id=run_id, event_type=event_type, query=search_query)
            self._send_json(
                {
                    "events": [audit_event_record_to_payload(event) for event in events],
                    "pagination": {
                        "limit": limit,
                        "offset": offset,
                        "total": total,
                        "query": search_query,
                    },
                }
            )
            return
        if parsed.path == "/api/market/quotes":
            query = parse_qs(parsed.query)
            workspace = self._workspace_with_saved_watchlist()
            instruments = workspace.watchlist
            market = query.get("market", [""])[0]
            symbol = query.get("symbol", [""])[0]
            if market and symbol:
                instruments = [instrument for instrument in instruments if instrument.market == market and instrument.symbol == symbol]
                if not instruments:
                    from quant_core.terminal import Instrument

                    instruments = [Instrument(symbol=symbol, name=symbol, market=market, change_pct=0.0)]
            quotes = self.quote_adapter.fetch_quotes(instruments)
            self._send_json(market_quotes_to_payload(quotes))
            return
        if parsed.path == "/api/market/calendar":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            at = query.get("at", [""])[0].strip() or None
            try:
                calendar = build_market_calendar_status(market, at=at)
            except ValueError as error:
                self._send_json({"error": "invalid_market_calendar_request", "detail": str(error)}, status=400)
                return
            self._send_json({"calendar": calendar})
            return
        if parsed.path == "/api/market/search":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            search_query = query.get("query", [""])[0]
            limit = _parse_search_limit(query.get("limit", ["8"])[0])
            timeframe = query.get("timeframe", [""])[0].strip() or None
            results = self.search_adapter.search(market=market, query=search_query, limit=limit)
            cache_contexts = [
                self.cache.context(result.market, result.symbol, timeframe)
                for result in results
            ] if timeframe else None
            self._send_json(
                market_search_to_payload(
                    market,
                    search_query,
                    results,
                    timeframe=timeframe,
                    cache_contexts=cache_contexts,
                )
            )
            return
        if parsed.path == "/api/market/data-readiness":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            symbol = query.get("symbol", ["600000"])[0]
            timeframe = query.get("timeframe", ["1d"])[0]
            payload = build_market_data_readiness(
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                cache_context=self.cache.context(market, symbol, timeframe),
                watchlist_refreshes=[
                    watchlist_cache_refresh_run_to_payload(run)
                    for run in self.watchlist_cache_refresh_store.list_recent(limit=25)
                ],
                adapter_error_events=[
                    market_data_adapter_error_event_to_payload(event)
                    for event in self.adapter_error_store.list_recent(limit=50)
                ],
            )
            self._send_json(payload)
            return
        if parsed.path == "/api/market/klines":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            symbol = query.get("symbol", ["600000"])[0]
            timeframe = query.get("timeframe", ["1d"])[0]
            limit = _parse_kline_limit(query.get("limit", ["160"])[0])
            request = MarketDataRequest(
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                end=_parse_kline_end(query.get("end", [""])[0]),
            )
            try:
                bars, quality = _fetch_market_klines_with_cache(
                    cache=self.cache,
                    adapter=self.kline_adapter,
                    request=request,
                    limit=limit,
                )
            except ValueError as error:
                self._record_adapter_error_if_needed(
                    request,
                    quality=None,
                    context="market-klines",
                    error=str(error),
                )
                self._send_json({"error": "market_klines_unavailable", "detail": str(error)}, status=502)
                return
            self._record_adapter_error_if_needed(request, quality=quality, context="market-klines")
            self._send_json(market_klines_to_payload(market, symbol, timeframe, bars, quality))
            return
        if parsed.path == "/api/strategies":
            query = parse_qs(parsed.query)
            market = query.get("market", [""])[0].strip() or None
            symbol = query.get("symbol", [""])[0].strip() or None
            limit = _parse_limit(query.get("limit", ["20"])[0])
            records = self.strategy_store.list_recent(market=market, symbol=symbol, limit=limit)
            self._send_json(strategy_library_records_to_payload(records))
            return
        if parsed.path.startswith("/api/strategies/"):
            revision = unquote(parsed.path.removeprefix("/api/strategies/")).strip()
            record = self.strategy_store.get(revision)
            if not record:
                self._send_json({"error": "strategy_not_found", "revision": revision}, status=404)
                return
            self._send_json({"strategy": strategy_library_record_to_payload(record)})
            return
        if parsed.path == "/api/research/notes":
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
        if parsed.path == "/api/handoff-notes":
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
        if parsed.path == "/api/research/run":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            symbol = query.get("symbol", ["600000"])[0]
            timeframe = query.get("timeframe", ["1d"])[0]
            watchlist_refresh_run_id = query.get("watchlistRefreshRunId", [""])[0].strip()
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
                strategy_snapshot=strategy_snapshot,
                research_note=research_note,
                data_preparation_evidence=data_preparation_evidence,
            )
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
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/paper-executions"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/paper-executions")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            executions = self.paper_execution_store.list_by_run(run_id, limit=20)
            self._send_json({"executions": [paper_execution_record_to_payload(execution) for execution in executions]})
            return
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/ai-reviews"):
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
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/promotion"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/promotion")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            executions = self.paper_execution_store.list_by_run(run_id, limit=20)
            self._send_json({"promotion": build_promotion_candidate(audit, executions)})
            return
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/export"):
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
        if parsed.path.startswith("/api/research/runs/"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            self._send_json({"run": research_run_audit_to_payload(audit, include_data_snapshot=True)})
            return
        if parsed.path == "/api/research/runs":
            query = parse_qs(parsed.query)
            limit = _parse_limit(query.get("limit", ["10"])[0])
            self._send_json(research_run_audits_to_payload(self.run_store.list_recent(limit=limit)))
            return
        self._send_json({"error": "not_found"}, status=404)

    def _demo_payload(self, market: str, symbol: str, timeframe: str) -> dict[str, object]:
        request = MarketDataRequest(
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            end=datetime.now(timezone.utc),
        )
        bars, quality = self.adapter.fetch_ohlcv(request)
        self.cache.upsert_bars(bars)
        strategy = StrategyConfig(
            name="SMA trend demo",
            market=market,
            symbols=[symbol],
            timeframe=timeframe,
            entry_conditions=[Condition(kind="close_above_sma", params={"window": 20})],
            exit_conditions=[Condition(kind="close_below_sma", params={"window": 20})],
            risk=RiskRules(position_pct=0.8, stop_loss_pct=0.08, take_profit_pct=0.18, max_drawdown_pct=0.2),
        )
        result = self.engine.run(strategy, bars)
        report = self.assistant.analyze(
            AiResearchRequest(
                strategy_name=result.strategy_name,
                market=result.market,
                risk_preference="balanced",
                metrics=result.metrics,
                notes=quality.warnings,
            )
        )
        return {
            "quality": quality,
            "strategy": json.loads(strategy.to_json()),
            "backtest": result,
            "aiReport": report,
            "bars": bars[-80:],
        }

    def _send_json(self, payload: object, status: int = 200) -> None:
        body = _response(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, object]:
        raw_content_length = self.headers.get("Content-Length")
        if raw_content_length is None:
            raise ValueError("request_body_required")
        if not raw_content_length.isascii() or not raw_content_length.isdecimal():
            raise ValueError("request_body_invalid_content_length")
        try:
            content_length = int(raw_content_length)
        except ValueError:
            raise ValueError("request_body_invalid_content_length") from None
        if content_length == 0:
            raise ValueError("request_body_required")
        if content_length > 10_000_000:
            raise ValueError("request_body_too_large")
        raw = self.rfile.read(content_length)
        if len(raw) != content_length:
            raise ValueError("request_body_incomplete")
        try:
            decoded = raw.decode("utf-8")
        except UnicodeDecodeError:
            raise ValueError("request_body_must_be_utf8") from None
        try:
            payload = json.loads(decoded)
        except json.JSONDecodeError:
            raise ValueError("request_body_must_be_json") from None
        if not isinstance(payload, dict):
            raise ValueError("request_body_must_be_object")
        return payload

    def _workspace_with_saved_watchlist(self):
        workspace = build_terminal_workspace()
        saved_watchlist = self.watchlist_store.list_instruments()
        if saved_watchlist:
            workspace = workspace_with_watchlist(workspace, saved_watchlist)
        saved_state = self.workspace_state_store.get()
        return workspace_with_research_workspace_state(workspace, saved_state)

    def _audit_report_signer(self) -> AuditReportSigner:
        return AuditReportSigner(
            secret=str(self.audit_signing_secret or ""),
            key_id=str(self.audit_signing_key_id or "local-audit-key"),
            signer=str(self.audit_signer_name or "Local Audit Key"),
            chain_id=str(self.audit_chain_id or "audit-chain-local"),
            keys_json=str(self.audit_signing_keys_json or ""),
        )

    def _strategy_experiment_runner(self) -> StrategyExperimentRunner:
        return StrategyExperimentRunner(
            strategy_store=self.strategy_store,
            run_store=self.run_store,
            experiment_store=self.strategy_experiment_store,
        )

    def _ai_review_stage3_service(self) -> AiReviewStage3Service:
        return AiReviewStage3Service(
            evidence_assembler=AiReviewEvidenceAssembler(
                experiment_store=self.strategy_experiment_store,
                run_store=self.run_store,
            ),
            deterministic_engine=DeterministicAiReviewEngine(),
            provider_registry=self._current_ai_review_provider_registry(),
            review_store=self.ai_review_store,
        )

    def _current_ai_review_provider_registry(self) -> AiReviewProviderRegistry:
        return self.ai_review_provider_registry or AiReviewProviderRegistry.from_environment()

    def _current_ai_review_decision_store(self) -> AiReviewDecisionStore:
        decision_store = self.ai_review_decision_store
        review_store = self.ai_review_store
        if (
            decision_store.review_store is review_store
            and decision_store.path.resolve() == review_store.path.resolve()
        ):
            return decision_store
        decision_store = AiReviewDecisionStore(review_store.path, review_store=review_store)
        type(self).ai_review_decision_store = decision_store
        return decision_store

    def _send_ai_review_decision_error(self, error: ValueError) -> None:
        code = str(error) or "invalid_ai_review_decision_request"
        if code.startswith("request_body_"):
            code = "invalid_ai_review_decision_request"
        if code == "ai_review_not_found":
            status = 404
        elif code == "invalid_ai_review_decision_request":
            status = 400
        else:
            status = 409
        self._send_json({"error": code, "detail": _ai_review_error_detail(code)}, status=status)

    def _settings_status_payload(self) -> dict[str, object]:
        return build_settings_status(
            cache_path=self.cache.path,
            cache_contexts=self.cache.contexts(limit=8),
            cache_stats=self.cache.stats(),
            finnhub_api_key=getattr(self.quote_adapter, "finnhub_api_key", ""),
            adapter_error_events=[
                market_data_adapter_error_event_to_payload(event)
                for event in self.adapter_error_store.list_recent(limit=50)
            ],
        )

    def _record_adapter_error_if_needed(
        self,
        request: MarketDataRequest,
        *,
        quality: DataQuality | None,
        context: str,
        error: str | None = None,
    ) -> None:
        target = _adapter_error_target(request.market)
        if not target:
            return
        message = _adapter_error_message(quality=quality, error=error)
        if not message:
            return
        adapter_id, provider = target
        self.adapter_error_store.record(
            create_market_data_adapter_error_event(
                adapter_id=adapter_id,
                provider=provider,
                market=request.market,
                symbol=request.symbol,
                timeframe=request.timeframe,
                source=quality.source if quality else "unavailable",
                context=context,
                message=message,
            )
        )

    def log_message(self, format: str, *args) -> None:
        return


def _adapter_error_target(market: str) -> tuple[str, str] | None:
    if market == "ashare":
        return "akshare-ohlcv", "akshare"
    if market == "us":
        return "yfinance-ohlcv", "yfinance"
    if market == "crypto":
        return "ccxt-ohlcv", "ccxt"
    return None


def _adapter_error_message(*, quality: DataQuality | None, error: str | None) -> str | None:
    if error:
        return str(error)
    if quality is None:
        return "provider quality unavailable"
    if quality.warnings:
        return quality.warnings[0]
    if not quality.is_complete:
        return f"incomplete provider response from {quality.source}"
    return None


def _attach_production_route_review_to_health_probe(
    probe_payload: dict[str, object],
    production_route_review: dict[str, object],
) -> None:
    review_id = str(production_route_review.get("productionRouteReviewId") or "").strip()
    review_status = str(production_route_review.get("status") or "").strip()
    route_review_summary = {
        "productionRouteReviewId": review_id,
        "status": review_status,
        "adapterId": str(production_route_review.get("adapterId") or "").strip(),
        "market": str(production_route_review.get("market") or "").strip(),
        "route": str(production_route_review.get("route") or "").strip(),
        "maintenanceWindowId": str(production_route_review.get("maintenanceWindowId") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in production_route_review.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "liveTradingAllowed": False,
        "paperOnly": True,
    }
    metadata = probe_payload.get("metadata")
    if not isinstance(metadata, dict):
        metadata = {}
    probe_payload["metadata"] = {
        **metadata,
        "productionRouteReviewId": review_id,
        "productionRouteReviewStatus": review_status,
    }
    probe_payload["productionRouteReviewId"] = review_id
    probe_payload["productionRouteReviewStatus"] = review_status
    probe_payload["routeReview"] = route_review_summary


def _validated_ai_review_http_request(payload: dict[str, object]) -> dict[str, object]:
    fields = {
        "primaryExperimentId",
        "comparisonExperimentIds",
        "providerId",
        "externalDataApproved",
    }
    comparison_ids = payload.get("comparisonExperimentIds")
    if (
        set(payload) != fields
        or not isinstance(payload.get("primaryExperimentId"), str)
        or not isinstance(comparison_ids, list)
        or any(not isinstance(item, str) for item in comparison_ids)
        or not isinstance(payload.get("providerId"), str)
        or type(payload.get("externalDataApproved")) is not bool
    ):
        raise ValueError("invalid_ai_review_request")
    return payload


def _validated_ai_review_query(raw_query: str) -> dict[str, object]:
    values = parse_qs(raw_query, keep_blank_values=True)
    allowed = {"runId", "experimentId", "limit", "offset", "query"}
    if not set(values) <= allowed or any(len(items) != 1 for items in values.values()):
        raise ValueError("invalid_ai_review_query")
    try:
        limit = int(values.get("limit", ["20"])[0])
        offset = int(values.get("offset", ["0"])[0])
    except ValueError:
        raise ValueError("invalid_ai_review_query") from None
    if not 1 <= limit <= 50 or offset < 0:
        raise ValueError("invalid_ai_review_query")
    return {
        "runId": values.get("runId", [""])[0].strip() or None,
        "experimentId": values.get("experimentId", [""])[0].strip() or None,
        "limit": limit,
        "offset": offset,
        "query": values.get("query", [""])[0].strip(),
    }


def _ai_review_decision_route_id(path: str) -> str | None:
    prefix = "/api/ai-reviews/"
    suffix = "/decisions"
    if not path.startswith(prefix) or not path.endswith(suffix):
        return None
    ai_review_id = unquote(path[len(prefix) : -len(suffix)]).strip()
    return ai_review_id if ai_review_id and "/" not in ai_review_id else ""


def _ai_review_http_projection(
    record: AiReviewRunRecord | AuthoritativeAiReviewRunRecord,
) -> dict[str, object]:
    return {**record.record, "authority": record.authority}


def _is_ai_review_conflict(code: str) -> bool:
    return any(
        token in code
        for token in ("conflict", "evidence", "lineage", "hash_mismatch", "not_authoritative")
    )


def _ai_review_error_detail(code: str) -> str:
    details = {
        "invalid_ai_review_request": "AI review request fields are invalid.",
        "invalid_ai_review_query": "AI review query parameters are invalid.",
        "invalid_ai_review_decision_request": "AI review decision request fields are invalid.",
        "ai_review_not_found": "AI review was not found.",
        "ai_review_not_authoritative": "AI review decisions require an authoritative review.",
        "decision_conflict": "The decision does not supersede the current latest decision.",
    }
    return details.get(code, "Stored AI review evidence conflicts with the requested operation.")


def resolve_api_bind(
    host: str | None = None,
    port: int | str | None = None,
    environ: dict[str, str] | None = None,
) -> tuple[str, int]:
    source = os.environ if environ is None else environ
    bind_host = (host or source.get("QUANT_CORE_HOST") or "127.0.0.1").strip() or "127.0.0.1"
    raw_port = port if port is not None else source.get("QUANT_CORE_PORT", "8765")
    try:
        bind_port = int(raw_port)
    except (TypeError, ValueError):
        bind_port = 8765
    if bind_port < 1 or bind_port > 65535:
        bind_port = 8765
    return bind_host, bind_port


def run(host: str | None = None, port: int | str | None = None) -> None:
    bind_host, bind_port = resolve_api_bind(host=host, port=port)
    server = ThreadingHTTPServer((bind_host, bind_port), QuantApiHandler)
    print(f"quant-core API listening on http://{bind_host}:{bind_port}")
    server.serve_forever()


def _parse_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 10
    return max(1, min(value, 50))


def _parse_offset(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 0
    return max(0, value)


def _parse_kline_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 160
    return max(1, min(value, 500))


def _parse_research_data_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 500
    return max(1, min(value, 500))


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
    raw_warnings = quality.get("warnings", [])
    warnings = [str(warning) for warning in raw_warnings] if isinstance(raw_warnings, list) else []
    return DataQuality(
        source=str(quality.get("source") or "unknown"),
        is_complete=bool(quality.get("isComplete", quality.get("is_complete", False))),
        warnings=warnings,
        rows=int(_number_or_default(quality.get("rows"), audit.data_rows)),
    )


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


_P0_LIVE_ROUTE_BLOCKED_REASON = "P0 only records simulated paper fills; live routing flags are rejected."


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


def _preflight_ai_review_archive(
    payload: dict[str, object],
    *,
    run_id: str,
    review_store: AiReviewRunStore | None = None,
    decision_store: AiReviewDecisionStore | None = None,
) -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]]]:
    legacy_envelopes = research_run_import_ai_review_runs(payload, run_id=run_id)
    v2_envelopes = research_run_import_ai_review_runs_v2(payload, run_id=run_id)
    decision_envelopes = research_run_import_ai_review_decisions(payload)

    legacy_payloads = [dict(envelope["record"]) for envelope in legacy_envelopes]
    authoritative_payloads = [dict(envelope["record"]) for envelope in v2_envelopes]
    decision_payloads = [dict(envelope["record"]) for envelope in decision_envelopes]
    legacy, authoritative = validate_ai_review_archive_records(
        run_id=run_id,
        legacy_records=legacy_payloads,
        authoritative_records=authoritative_payloads,
    )
    decisions = validate_ai_review_decision_archive_records(
        decision_payloads,
        authoritative,
    )
    if (review_store is None) != (decision_store is None):
        raise ValueError("ai_review_archive_stores_must_be_paired")
    if review_store is not None and decision_store is not None:
        if review_store.path.resolve() != decision_store.path.resolve():
            raise ValueError("ai_review_decision_store_path_mismatch")
        decision_store.preflight_archive_apply(
            run_id=run_id,
            legacy_records=legacy_payloads,
            authoritative_records=authoritative_payloads,
            decision_records=decision_payloads,
        )

    return (
        [dict(record.record) for record in legacy],
        [dict(review.record) for review in authoritative],
        [dict(decision.record) for decision in decisions],
    )


def _ai_review_decision_archive_payload(decision: object) -> dict[str, object]:
    record = dict(decision.record)
    return {
        "decisionId": decision.decision_id,
        "aiReviewId": decision.ai_review_id,
        "createdAt": decision.created_at.isoformat(),
        "record": record,
    }


def _snapshot_ai_review_archive(
    *,
    run_id: str,
    review_store: AiReviewRunStore,
    decision_store: AiReviewDecisionStore,
) -> dict[str, object]:
    reviews = review_store.list_all_by_run(run_id)
    legacy = [review for review in reviews if isinstance(review, AiReviewRunRecord)]
    authoritative = [
        review for review in reviews if isinstance(review, AuthoritativeAiReviewRunRecord)
    ]
    decisions = [
        decision
        for review in authoritative
        for decision in decision_store.list_by_review(review.ai_review_id)
    ]
    return {
        "aiReviewRuns": [ai_review_run_record_to_payload(review) for review in legacy],
        "aiReviewRunsV2": [ai_review_run_record_to_payload(review) for review in authoritative],
        "aiReviewDecisions": [
            _ai_review_decision_archive_payload(decision) for decision in decisions
        ],
    }


def _preflight_ai_review_archive_snapshot(
    *,
    run_id: str,
    review_store: AiReviewRunStore,
    decision_store: AiReviewDecisionStore,
    snapshot: dict[str, object],
) -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]], bool]:
    if review_store.path.resolve() != decision_store.path.resolve():
        raise ValueError("ai_review_decision_store_path_mismatch")
    mixed_legacy = snapshot.get("aiReviewRuns", [])
    if not isinstance(mixed_legacy, list):
        raise ValueError("import_undo_ai_review_archive_must_use_arrays")
    has_v2_array = "aiReviewRunsV2" in snapshot
    has_decision_array = "aiReviewDecisions" in snapshot
    if has_v2_array:
        v2_envelopes = snapshot.get("aiReviewRunsV2")
        if not isinstance(v2_envelopes, list):
            raise ValueError("import_undo_ai_review_archive_must_use_arrays")
        legacy_envelopes = mixed_legacy
    else:
        legacy_envelopes = []
        v2_envelopes = []
        for item in mixed_legacy:
            record = item.get("record") if isinstance(item, dict) else None
            if isinstance(record, dict) and record.get("schemaVersion") == 2:
                v2_envelopes.append(item)
            else:
                legacy_envelopes.append(item)
    decision_envelopes = snapshot.get("aiReviewDecisions", [])
    if not isinstance(decision_envelopes, list):
        raise ValueError("import_undo_ai_review_archive_must_use_arrays")

    legacy_normalized = research_run_import_ai_review_runs(
        {"aiReviewRuns": legacy_envelopes},
        run_id=run_id,
    )
    authoritative_normalized = research_run_import_ai_review_runs_v2(
        {"aiReviewRunsV2": v2_envelopes},
        run_id=run_id,
    )
    decision_normalized = research_run_import_ai_review_decisions(
        {"aiReviewDecisions": decision_envelopes}
    )
    legacy_payloads = [dict(item["record"]) for item in legacy_normalized]
    authoritative_payloads = [dict(item["record"]) for item in authoritative_normalized]
    decision_payloads = [dict(item["record"]) for item in decision_normalized]
    legacy, authoritative = validate_ai_review_archive_records(
        run_id=run_id,
        legacy_records=legacy_payloads,
        authoritative_records=authoritative_payloads,
    )
    decisions = validate_ai_review_decision_archive_records(
        decision_payloads,
        authoritative,
    )
    preserve_existing_decisions = not has_decision_array
    decision_store.preflight_archive_replace(
        run_id=run_id,
        legacy_records=[record.record for record in legacy],
        authoritative_records=[record.record for record in authoritative],
        decision_records=[record.record for record in decisions],
        preserve_existing_decisions=preserve_existing_decisions,
    )
    return (
        [dict(record.record) for record in legacy],
        [dict(record.record) for record in authoritative],
        [dict(record.record) for record in decisions],
        preserve_existing_decisions,
    )


def _restore_ai_review_archive_snapshot(
    *,
    run_id: str,
    review_store: AiReviewRunStore,
    decision_store: AiReviewDecisionStore,
    snapshot: dict[str, object],
) -> None:
    legacy, authoritative, decisions, preserve_existing_decisions = (
        _preflight_ai_review_archive_snapshot(
            run_id=run_id,
            review_store=review_store,
            decision_store=decision_store,
            snapshot=snapshot,
        )
    )
    decision_store.replace_archive_atomic(
        run_id=run_id,
        legacy_records=legacy,
        authoritative_records=authoritative,
        decision_records=decisions,
        preserve_existing_decisions=preserve_existing_decisions,
    )


def _persist_research_run_import(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    audit_event_store: AuditEventStore,
    audit: ResearchRunAudit,
    imported_note: dict[str, object] | None,
    paper_execution_records: list[PaperExecutionRecord],
    portfolio_paper_order_batches: list[PortfolioPaperOrderBatch],
    portfolio_paper_order_approvals: list[PortfolioPaperOrderApproval],
    portfolio_paper_order_simulations: list[PortfolioPaperOrderSimulation],
    ai_review_records: list[dict[str, object]],
    audit_event_payloads: list[dict[str, object]],
    handoff_note_store: HandoffNoteStore | None = None,
    handoff_note_payloads: list[dict[str, object]] | None = None,
    ai_review_decision_store: AiReviewDecisionStore | None = None,
    ai_review_records_v2: list[dict[str, object]] | None = None,
    ai_review_decision_records: list[dict[str, object]] | None = None,
) -> dict[str, object]:
    handoff_note_payloads = handoff_note_payloads or []
    ai_review_records_v2 = ai_review_records_v2 or []
    ai_review_decision_records = ai_review_decision_records or []
    ai_review_decision_store = ai_review_decision_store or AiReviewDecisionStore(
        ai_review_store.path,
        review_store=ai_review_store,
    )
    if handoff_note_payloads and handoff_note_store is None:
        raise ValueError("handoff_note_store_required")
    ai_review_decision_store.preflight_archive_apply(
        run_id=audit.run_id,
        legacy_records=ai_review_records,
        authoritative_records=ai_review_records_v2,
        decision_records=ai_review_decision_records,
    )

    previous_run = run_store.get(audit.run_id)
    previous_note = (
        note_store.get_existing(
            market=str(imported_note["market"]),
            symbol=str(imported_note["symbol"]),
            timeframe=str(imported_note["timeframe"]),
        )
        if imported_note
        else None
    )
    strategy_revision = (
        str(audit.strategy_config.get("revision") or "").strip()
        if _is_importable_strategy_config(audit.strategy_config)
        else ""
    )
    previous_strategy = strategy_store.get(strategy_revision) if strategy_revision else None
    previous_paper_executions = paper_execution_store.list_all_by_run(audit.run_id)
    previous_portfolio_paper_orders = portfolio_paper_order_store.list_all_by_base_run(audit.run_id)
    previous_portfolio_paper_order_approvals = portfolio_paper_order_approval_store.list_all_by_base_run(audit.run_id)
    previous_portfolio_paper_order_simulations = (
        portfolio_paper_order_simulation_store.list_all_by_base_run(audit.run_id)
    )
    previous_ai_reviews = ai_review_store.list_all_by_run(audit.run_id)
    previous_ai_review_archive = _snapshot_ai_review_archive(
        run_id=audit.run_id,
        review_store=ai_review_store,
        decision_store=ai_review_decision_store,
    )
    previous_audit_events = audit_event_store.list_all_by_run(audit.run_id)
    previous_handoff_notes = handoff_note_store.list_by_run(audit.run_id, limit=200) if handoff_note_store else []

    ai_archive_applied = False
    try:
        run_store.record(audit)
        if imported_note:
            note_store.save(
                market=str(imported_note["market"]),
                symbol=str(imported_note["symbol"]),
                timeframe=str(imported_note["timeframe"]),
                body=str(imported_note["body"]),
                updated_at=imported_note["updated_at"],
            )
        if strategy_revision:
            strategy_store.save_payload(
                audit.strategy_config,
                audit_run_id=audit.run_id,
                created_at=audit.created_at,
            )
        for execution_record in paper_execution_records:
            paper_execution_store.record(execution_record)
        portfolio_paper_order_approval_store.delete_by_base_run(audit.run_id)
        portfolio_paper_order_simulation_store.delete_by_base_run(audit.run_id)
        for batch in portfolio_paper_order_batches:
            portfolio_paper_order_store.record(batch)
        for approval in portfolio_paper_order_approvals:
            portfolio_paper_order_approval_store.record(approval)
        for simulation in portfolio_paper_order_simulations:
            portfolio_paper_order_simulation_store.record(simulation)
        ai_review_decision_store.apply_archive_atomic(
            run_id=audit.run_id,
            legacy_records=ai_review_records,
            authoritative_records=ai_review_records_v2,
            decision_records=ai_review_decision_records,
        )
        ai_archive_applied = True
        if handoff_note_payloads and handoff_note_store:
            handoff_note_store.delete_by_subject(subject_type="research_run", subject_id=audit.run_id)
            for handoff_note_payload in handoff_note_payloads:
                handoff_note_store.restore(handoff_note_from_payload(handoff_note_payload))
        for audit_event_payload in audit_event_payloads:
            audit_event_store.record(audit_event_payload)
    except Exception:
        _rollback_research_run_import(
            run_store=run_store,
            note_store=note_store,
            strategy_store=strategy_store,
            paper_execution_store=paper_execution_store,
            ai_review_store=ai_review_store,
            ai_review_decision_store=ai_review_decision_store,
            audit_event_store=audit_event_store,
            run_id=audit.run_id,
            imported_note=imported_note,
            previous_run=previous_run,
            previous_note=previous_note,
            strategy_revision=strategy_revision,
            previous_strategy=previous_strategy,
            previous_paper_executions=previous_paper_executions,
            portfolio_paper_order_store=portfolio_paper_order_store,
            portfolio_paper_order_approval_store=portfolio_paper_order_approval_store,
            portfolio_paper_order_simulation_store=portfolio_paper_order_simulation_store,
            previous_portfolio_paper_orders=previous_portfolio_paper_orders,
            previous_portfolio_paper_order_approvals=previous_portfolio_paper_order_approvals,
            previous_portfolio_paper_order_simulations=previous_portfolio_paper_order_simulations,
            previous_ai_reviews=previous_ai_reviews,
            previous_ai_review_archive=previous_ai_review_archive,
            restore_ai_review_archive=ai_archive_applied,
            previous_audit_events=previous_audit_events,
            handoff_note_store=handoff_note_store,
            previous_handoff_notes=previous_handoff_notes,
        )
        raise
    return _research_run_import_undo_snapshot(
        audit=audit,
        imported_note=imported_note,
        strategy_revision=strategy_revision,
        previous_run=previous_run,
        previous_note=previous_note,
        previous_strategy=previous_strategy,
        previous_paper_executions=previous_paper_executions,
        previous_portfolio_paper_orders=previous_portfolio_paper_orders,
        previous_portfolio_paper_order_approvals=previous_portfolio_paper_order_approvals,
        previous_portfolio_paper_order_simulations=previous_portfolio_paper_order_simulations,
        previous_ai_reviews=previous_ai_reviews,
        previous_ai_review_archive=previous_ai_review_archive,
        previous_audit_events=previous_audit_events,
        imported_handoff_notes=handoff_note_payloads,
        previous_handoff_notes=previous_handoff_notes,
    )


def _research_run_import_undo_snapshot(
    *,
    audit: ResearchRunAudit,
    imported_note: dict[str, object] | None,
    strategy_revision: str,
    previous_run: ResearchRunAudit | None,
    previous_note: ResearchNote | None,
    previous_strategy: StrategyLibraryRecord | None,
    previous_paper_executions: list[PaperExecutionRecord],
    previous_portfolio_paper_orders: list[PortfolioPaperOrderBatch],
    previous_portfolio_paper_order_approvals: list[PortfolioPaperOrderApproval],
    previous_portfolio_paper_order_simulations: list[PortfolioPaperOrderSimulation],
    previous_ai_reviews: list[AiReviewRunRecord],
    previous_audit_events: list[object],
    imported_handoff_notes: list[dict[str, object]],
    previous_handoff_notes: list[HandoffNote],
    previous_ai_review_archive: dict[str, object] | None = None,
) -> dict[str, object]:
    return {
        "schemaVersion": 1,
        "runId": audit.run_id,
        "importedRun": research_run_audit_to_payload(audit, include_data_snapshot=True),
        "importedNote": _imported_note_snapshot(imported_note),
        "importedHandoffNotes": imported_handoff_notes,
        "strategyRevision": strategy_revision,
        "previous": {
            "run": research_run_audit_to_payload(previous_run, include_data_snapshot=True) if previous_run else None,
            "note": research_note_to_payload(previous_note) if previous_note else None,
            "strategy": strategy_library_record_to_payload(previous_strategy) if previous_strategy else None,
            "paperExecutions": [
                paper_execution_record_to_payload(execution) for execution in previous_paper_executions
            ],
            "portfolioPaperOrderBatches": [
                portfolio_paper_order_batch_to_payload(batch) for batch in previous_portfolio_paper_orders
            ],
            "portfolioPaperOrderApprovals": [
                portfolio_paper_order_approval_to_payload(approval)
                for approval in previous_portfolio_paper_order_approvals
            ],
            "portfolioPaperOrderSimulations": [
                portfolio_paper_order_simulation_to_payload(simulation)
                for simulation in previous_portfolio_paper_order_simulations
            ],
            "aiReviewRuns": (
                list(previous_ai_review_archive.get("aiReviewRuns", []))
                if previous_ai_review_archive is not None
                else [ai_review_run_record_to_payload(review) for review in previous_ai_reviews]
            ),
            "aiReviewRunsV2": (
                list(previous_ai_review_archive.get("aiReviewRunsV2", []))
                if previous_ai_review_archive is not None
                else []
            ),
            "aiReviewDecisions": (
                list(previous_ai_review_archive.get("aiReviewDecisions", []))
                if previous_ai_review_archive is not None
                else []
            ),
            "auditEvents": [audit_event_record_to_payload(event) for event in previous_audit_events],
            "handoffNotes": [handoff_note_to_payload(note) for note in previous_handoff_notes],
        },
    }


def _imported_note_snapshot(imported_note: dict[str, object] | None) -> dict[str, object] | None:
    if not imported_note:
        return None
    updated_at = imported_note.get("updated_at")
    return {
        "market": str(imported_note.get("market") or ""),
        "symbol": str(imported_note.get("symbol") or ""),
        "timeframe": str(imported_note.get("timeframe") or ""),
        "body": str(imported_note.get("body") or ""),
        "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime) else updated_at,
    }


def _undo_research_run_import_from_record(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    ai_review_decision_store: AiReviewDecisionStore,
    audit_event_store: AuditEventStore,
    handoff_note_store: HandoffNoteStore,
    undo_record: ResearchRunImportUndoRecord,
) -> ResearchRunAudit | None:
    return _undo_research_run_import_from_snapshot(
        run_store=run_store,
        note_store=note_store,
        strategy_store=strategy_store,
        paper_execution_store=paper_execution_store,
        portfolio_paper_order_store=portfolio_paper_order_store,
        portfolio_paper_order_approval_store=portfolio_paper_order_approval_store,
        portfolio_paper_order_simulation_store=portfolio_paper_order_simulation_store,
        ai_review_store=ai_review_store,
        ai_review_decision_store=ai_review_decision_store,
        audit_event_store=audit_event_store,
        handoff_note_store=handoff_note_store,
        snapshot=undo_record.snapshot,
    )


def _undo_research_run_import_from_snapshot(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    ai_review_decision_store: AiReviewDecisionStore,
    audit_event_store: AuditEventStore,
    handoff_note_store: HandoffNoteStore,
    snapshot: dict[str, object],
) -> ResearchRunAudit | None:
    if int(_number_or_default(snapshot.get("schemaVersion"), 0)) != 1:
        raise ValueError("unsupported_import_undo_snapshot_schema")
    previous = snapshot.get("previous")
    if not isinstance(previous, dict):
        raise ValueError("import_undo_previous_snapshot_required")
    run_id = str(snapshot.get("runId") or "").strip()
    if not run_id:
        raise ValueError("import_undo_run_id_required")

    imported_note = snapshot.get("importedNote")
    previous_run_payload = previous.get("run")
    previous_note_payload = previous.get("note")
    previous_strategy_payload = previous.get("strategy")
    previous_paper_payloads = previous.get("paperExecutions", [])
    previous_portfolio_paper_payloads = previous.get("portfolioPaperOrderBatches", [])
    previous_portfolio_paper_approval_payloads = previous.get("portfolioPaperOrderApprovals", [])
    previous_portfolio_paper_simulation_payloads = previous.get("portfolioPaperOrderSimulations", [])
    previous_ai_review_payloads = previous.get("aiReviewRuns", [])
    previous_ai_review_v2_payloads = previous.get("aiReviewRunsV2", [])
    previous_ai_review_decision_payloads = previous.get("aiReviewDecisions", [])
    previous_audit_event_payloads = previous.get("auditEvents", [])
    previous_handoff_note_payloads = previous.get("handoffNotes", [])

    if previous_paper_payloads is None:
        previous_paper_payloads = []
    if previous_portfolio_paper_payloads is None:
        previous_portfolio_paper_payloads = []
    if previous_portfolio_paper_approval_payloads is None:
        previous_portfolio_paper_approval_payloads = []
    if previous_portfolio_paper_simulation_payloads is None:
        previous_portfolio_paper_simulation_payloads = []
    if previous_ai_review_payloads is None:
        previous_ai_review_payloads = []
    if previous_ai_review_v2_payloads is None:
        previous_ai_review_v2_payloads = []
    if previous_ai_review_decision_payloads is None:
        previous_ai_review_decision_payloads = []
    if previous_audit_event_payloads is None:
        previous_audit_event_payloads = []
    if previous_handoff_note_payloads is None:
        previous_handoff_note_payloads = []
    if not isinstance(previous_paper_payloads, list):
        raise ValueError("import_undo_paper_executions_must_be_array")
    if not isinstance(previous_portfolio_paper_payloads, list):
        raise ValueError("import_undo_portfolio_paper_order_batches_must_be_array")
    if not isinstance(previous_portfolio_paper_approval_payloads, list):
        raise ValueError("import_undo_portfolio_paper_order_approvals_must_be_array")
    if not isinstance(previous_portfolio_paper_simulation_payloads, list):
        raise ValueError("import_undo_portfolio_paper_order_simulations_must_be_array")
    if not isinstance(previous_ai_review_payloads, list):
        raise ValueError("import_undo_ai_reviews_must_be_array")
    if not isinstance(previous_ai_review_v2_payloads, list):
        raise ValueError("import_undo_ai_reviews_v2_must_be_array")
    if not isinstance(previous_ai_review_decision_payloads, list):
        raise ValueError("import_undo_ai_review_decisions_must_be_array")
    if not isinstance(previous_audit_event_payloads, list):
        raise ValueError("import_undo_audit_events_must_be_array")
    if not isinstance(previous_handoff_note_payloads, list):
        raise ValueError("import_undo_handoff_notes_must_be_array")

    previous_run = (
        _research_run_audit_from_payload(previous_run_payload) if isinstance(previous_run_payload, dict) else None
    )
    previous_note = (
        _research_note_from_payload(previous_note_payload) if isinstance(previous_note_payload, dict) else None
    )
    previous_strategy = (
        _strategy_record_from_payload(previous_strategy_payload) if isinstance(previous_strategy_payload, dict) else None
    )
    previous_paper_executions = [
        paper_execution_payload_to_record(item) for item in previous_paper_payloads if isinstance(item, dict)
    ]
    previous_portfolio_paper_orders = [
        portfolio_paper_order_payload_to_batch(item)
        for item in previous_portfolio_paper_payloads
        if isinstance(item, dict)
    ]
    previous_portfolio_paper_approvals = [
        portfolio_paper_order_payload_to_approval(item)
        for item in previous_portfolio_paper_approval_payloads
        if isinstance(item, dict)
    ]
    previous_portfolio_paper_simulations = [
        portfolio_paper_order_payload_to_simulation(item)
        for item in previous_portfolio_paper_simulation_payloads
        if isinstance(item, dict)
    ]
    previous_ai_reviews = [
        _ai_review_run_from_payload(item) for item in previous_ai_review_payloads if isinstance(item, dict)
    ]
    previous_ai_review_archive = {"aiReviewRuns": previous_ai_review_payloads}
    if "aiReviewRunsV2" in previous:
        previous_ai_review_archive["aiReviewRunsV2"] = previous_ai_review_v2_payloads
    if "aiReviewDecisions" in previous:
        previous_ai_review_archive["aiReviewDecisions"] = previous_ai_review_decision_payloads
    previous_audit_events = [dict(item) for item in previous_audit_event_payloads if isinstance(item, dict)]
    previous_handoff_notes = [
        handoff_note_from_payload(item) for item in previous_handoff_note_payloads if isinstance(item, dict)
    ]

    _preflight_ai_review_archive_snapshot(
        run_id=run_id,
        review_store=ai_review_store,
        decision_store=ai_review_decision_store,
        snapshot=previous_ai_review_archive,
    )
    _rollback_research_run_import(
        run_store=run_store,
        note_store=note_store,
        strategy_store=strategy_store,
        paper_execution_store=paper_execution_store,
        portfolio_paper_order_store=portfolio_paper_order_store,
        ai_review_store=ai_review_store,
        ai_review_decision_store=ai_review_decision_store,
        run_id=run_id,
        imported_note=dict(imported_note) if isinstance(imported_note, dict) else None,
        previous_run=previous_run,
        previous_note=previous_note,
        strategy_revision=str(snapshot.get("strategyRevision") or "").strip(),
        previous_strategy=previous_strategy,
        previous_paper_executions=previous_paper_executions,
        previous_portfolio_paper_orders=previous_portfolio_paper_orders,
        portfolio_paper_order_approval_store=portfolio_paper_order_approval_store,
        portfolio_paper_order_simulation_store=portfolio_paper_order_simulation_store,
        previous_portfolio_paper_order_approvals=previous_portfolio_paper_approvals,
        previous_portfolio_paper_order_simulations=previous_portfolio_paper_simulations,
        previous_ai_reviews=previous_ai_reviews,
        previous_ai_review_archive=previous_ai_review_archive,
        audit_event_store=audit_event_store,
        previous_audit_events=previous_audit_events,
        handoff_note_store=handoff_note_store,
        previous_handoff_notes=previous_handoff_notes,
    )
    return previous_run


def _research_run_audit_from_payload(payload: dict[str, object]) -> ResearchRunAudit:
    created_at = _parse_iso_datetime(str(payload.get("createdAt") or ""))
    return ResearchRunAudit(
        run_id=str(payload.get("runId") or ""),
        created_at=created_at,
        market=str(payload.get("market") or ""),
        symbol=str(payload.get("symbol") or ""),
        timeframe=str(payload.get("timeframe") or ""),
        strategy_name=str(payload.get("strategyName") or ""),
        strategy_revision=str(payload.get("strategyRevision") or ""),
        data_rows=int(_number_or_default(payload.get("dataRows"), 0)),
        metrics=dict(payload.get("metrics")) if isinstance(payload.get("metrics"), dict) else {},
        decisions=list(payload.get("decisions")) if isinstance(payload.get("decisions"), list) else [],
        execution_mode=str(payload.get("executionMode") or "paper_only"),
        ai_report=dict(payload.get("aiReport")) if isinstance(payload.get("aiReport"), dict) else {},
        data_quality=dict(payload.get("dataQuality")) if isinstance(payload.get("dataQuality"), dict) else {},
        data_snapshot=dict(payload.get("dataSnapshot")) if isinstance(payload.get("dataSnapshot"), dict) else {},
        strategy_config=dict(payload.get("strategyConfig")) if isinstance(payload.get("strategyConfig"), dict) else None,
        backtest_assumptions=dict(payload.get("backtestAssumptions"))
        if isinstance(payload.get("backtestAssumptions"), dict)
        else {},
        backtest_trades=list(payload.get("backtestTrades")) if isinstance(payload.get("backtestTrades"), list) else [],
        backtest_equity_curve=list(payload.get("backtestEquityCurve"))
        if isinstance(payload.get("backtestEquityCurve"), list)
        else [],
        backtest_diagnostics=list(payload.get("backtestDiagnostics"))
        if isinstance(payload.get("backtestDiagnostics"), list)
        else [],
        research_note=dict(payload.get("researchNote")) if isinstance(payload.get("researchNote"), dict) else {},
    )


def _research_note_from_payload(payload: dict[str, object]) -> ResearchNote:
    updated_at = payload.get("updatedAt")
    return ResearchNote(
        market=str(payload.get("market") or ""),
        symbol=str(payload.get("symbol") or ""),
        timeframe=str(payload.get("timeframe") or ""),
        body=str(payload.get("body") or ""),
        updated_at=_parse_iso_datetime(str(updated_at)) if updated_at else None,
    )


def _strategy_record_from_payload(payload: dict[str, object]) -> StrategyLibraryRecord:
    strategy_config = payload.get("strategyConfig")
    return StrategyLibraryRecord(
        strategy_id=str(payload.get("strategyId") or f"strategy-{payload.get('revision') or ''}"),
        created_at=_parse_iso_datetime(str(payload.get("createdAt") or "")),
        name=str(payload.get("name") or ""),
        revision=str(payload.get("revision") or ""),
        market=str(payload.get("market") or ""),
        symbol=str(payload.get("symbol") or ""),
        timeframe=str(payload.get("timeframe") or ""),
        version=int(_number_or_default(payload.get("version"), 1)),
        status=str(payload.get("status") or "draft"),
        audit_run_id=str(payload.get("auditRunId") or "").strip() or None,
        strategy_config=dict(strategy_config) if isinstance(strategy_config, dict) else {},
    )


def _ai_review_run_from_payload(payload: dict[str, object]) -> AiReviewRunRecord:
    record = payload.get("record")
    return AiReviewRunRecord(
        ai_review_id=str(payload.get("aiReviewId") or ""),
        run_id=str(payload.get("runId") or ""),
        created_at=_parse_iso_datetime(str(payload.get("createdAt") or "")),
        record=dict(record) if isinstance(record, dict) else {},
    )


def _parse_iso_datetime(value: str) -> datetime:
    if not value:
        raise ValueError("datetime_required")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _number_or_default(value: object, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _rollback_research_run_import(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    audit_event_store: AuditEventStore,
    handoff_note_store: HandoffNoteStore | None,
    run_id: str,
    imported_note: dict[str, object] | None,
    previous_run: ResearchRunAudit | None,
    previous_note: ResearchNote | None,
    strategy_revision: str,
    previous_strategy: StrategyLibraryRecord | None,
    previous_paper_executions: list[PaperExecutionRecord],
    previous_portfolio_paper_orders: list[PortfolioPaperOrderBatch],
    previous_portfolio_paper_order_approvals: list[PortfolioPaperOrderApproval],
    previous_portfolio_paper_order_simulations: list[PortfolioPaperOrderSimulation],
    previous_ai_reviews: list[AiReviewRunRecord],
    previous_audit_events: list[object],
    previous_handoff_notes: list[HandoffNote],
    ai_review_decision_store: AiReviewDecisionStore | None = None,
    previous_ai_review_archive: dict[str, object] | None = None,
    restore_ai_review_archive: bool = True,
) -> None:
    audit_event_store.delete_by_run(run_id)
    for event in previous_audit_events:
        if isinstance(event, dict):
            audit_event_store.record(event)
        else:
            audit_event_store.record(audit_event_record_to_payload(event))

    if handoff_note_store:
        handoff_note_store.delete_by_subject(subject_type="research_run", subject_id=run_id)
        for note in previous_handoff_notes:
            handoff_note_store.restore(note)

    if not restore_ai_review_archive:
        pass
    elif previous_ai_review_archive is not None:
        if ai_review_decision_store is None:
            raise ValueError("ai_review_decision_store_required")
        _restore_ai_review_archive_snapshot(
            run_id=run_id,
            review_store=ai_review_store,
            decision_store=ai_review_decision_store,
            snapshot=previous_ai_review_archive,
        )
    else:
        ai_review_store.delete_by_run(run_id)
        for review in previous_ai_reviews:
            if isinstance(review, AuthoritativeAiReviewRunRecord):
                ai_review_store.record_v2(review.record)
            else:
                ai_review_store.record(review.record)

    paper_execution_store.delete_by_run(run_id)
    for execution in previous_paper_executions:
        paper_execution_store.record(execution)

    portfolio_paper_order_store.delete_by_base_run(run_id)
    for batch in previous_portfolio_paper_orders:
        portfolio_paper_order_store.record(batch)

    portfolio_paper_order_approval_store.delete_by_base_run(run_id)
    for approval in previous_portfolio_paper_order_approvals:
        portfolio_paper_order_approval_store.record(approval)

    portfolio_paper_order_simulation_store.delete_by_base_run(run_id)
    for simulation in previous_portfolio_paper_order_simulations:
        portfolio_paper_order_simulation_store.record(simulation)

    if strategy_revision:
        if previous_strategy:
            strategy_store.restore(previous_strategy)
        else:
            strategy_store.delete(strategy_revision)

    if imported_note:
        if previous_note:
            note_store.save(
                market=previous_note.market,
                symbol=previous_note.symbol,
                timeframe=previous_note.timeframe,
                body=previous_note.body,
                updated_at=previous_note.updated_at,
            )
        else:
            note_store.delete(
                market=str(imported_note["market"]),
                symbol=str(imported_note["symbol"]),
                timeframe=str(imported_note["timeframe"]),
            )

    if previous_run:
        run_store.record(previous_run)
    else:
        run_store.delete(run_id)


def _importable_research_note_payload(
    value: object,
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, object] | None:
    if not isinstance(value, dict):
        return None
    body = str(value.get("body") or "").strip()
    if not body:
        return None
    return {
        "market": str(value.get("market") or market or "").strip(),
        "symbol": str(value.get("symbol") or symbol or "").strip(),
        "timeframe": str(value.get("timeframe") or timeframe or "").strip(),
        "body": body,
        "updated_at": _parse_optional_datetime(value.get("updatedAt", value.get("updated_at"))),
    }


def _parse_optional_datetime(value: object) -> datetime | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    normalized = text[:-1] + "+00:00" if text.endswith("Z") else text
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _optional_audit_event_id(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _find_portfolio_paper_order_batch(
    store: PortfolioPaperOrderStore,
    base_run_id: str,
    batch_id: str,
) -> PortfolioPaperOrderBatch:
    for batch in store.list_all_by_base_run(base_run_id):
        if batch.batch_id == batch_id:
            return batch
    raise LookupError(batch_id)


def _find_duplicate_portfolio_paper_order_batch(
    store: PortfolioPaperOrderStore,
    candidate: PortfolioPaperOrderBatch,
) -> PortfolioPaperOrderBatch | None:
    candidate_signature = _portfolio_paper_order_batch_signature(candidate)
    for batch in store.list_all_by_base_run(candidate.base_run_id):
        if _portfolio_paper_order_batch_signature(batch) == candidate_signature:
            return batch
    return None


def _portfolio_paper_order_batch_signature(batch: PortfolioPaperOrderBatch) -> tuple[str, str, str]:
    orders_signature = json.dumps(batch.orders, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return (batch.portfolio_name, batch.source, orders_signature)


def _find_portfolio_paper_order_lifecycle_row(
    lifecycle: list[dict[str, object]],
    order_id: str,
) -> dict[str, object]:
    for row in lifecycle:
        if str(row.get("orderId") or "") == order_id:
            return row
    raise ValueError("portfolio_paper_order_approval_lifecycle_row_not_found")


def _portfolio_paper_order_adapter_evidence_by_order_id(payload: dict[str, object]) -> dict[str, dict[str, object]]:
    raw = payload.get("adapterPaperExecutionEvidenceByOrderId")
    if not isinstance(raw, dict):
        return {}
    normalized: dict[str, dict[str, object]] = {}
    for order_id, evidence in raw.items():
        normalized_order_id = str(order_id).strip()
        if normalized_order_id and isinstance(evidence, dict):
            normalized[normalized_order_id] = evidence
    return normalized


def _parse_kline_end(raw: str) -> datetime | None:
    value = raw.strip()
    if not value:
        return None
    try:
        timestamp = float(value)
        if timestamp > 10**12:
            timestamp /= 1000
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)
    except ValueError:
        pass
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _parse_search_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 8
    return max(1, min(value, 20))


def _backtest_engine_from_query(query: dict[str, list[str]]) -> BacktestEngine:
    initial_cash = _parse_positive_float(query.get("initialCash", ["100000"])[0], default=100_000)
    fee_bps = _parse_bps(query.get("feeBps", ["3"])[0], default=3)
    slippage_bps = _parse_bps(query.get("slippageBps", ["2"])[0], default=2)
    return BacktestEngine(initial_cash=initial_cash, fee_rate=fee_bps / 10_000, slippage_rate=slippage_bps / 10_000)


def _parse_positive_float(raw: str, *, default: float) -> float:
    try:
        value = float(raw)
    except ValueError:
        return default
    return value if value > 0 else default


def _parse_bps(raw: str, *, default: float) -> float:
    try:
        value = float(raw)
    except ValueError:
        return default
    if value < 0:
        return default
    return min(value, 1_000)


if __name__ == "__main__":
    run()
