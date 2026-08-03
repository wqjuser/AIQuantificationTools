from __future__ import annotations

from http.server import BaseHTTPRequestHandler
from .routes.dispatch import RouteDispatchMixin
from .support.handler_runtime import HandlerRuntimeMixin
from .support.handler_services import HandlerServicesMixin
from .support.handler_transport import HandlerTransportMixin
import os
from pathlib import Path
from quant_core.adapter_error_ledger import MarketDataAdapterErrorStore
from quant_core.adapters import DemoMarketDataAdapter
from quant_core.ai import LocalResearchAssistant
from quant_core.ai_review_decisions import AiReviewDecisionStore
from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.ai_review_runs import AiReviewRunStore
from quant_core.audit_events import AuditEventStore
from quant_core.auto_paper_trading import (
    AutoPaperTradingRunner,
    AutoPaperTradingService,
)
from quant_core.backtest import BacktestEngine
from quant_core.cache import MarketDataCache
from quant_core.cache_refresh_runs import WatchlistCacheRefreshRunStore
from quant_core.desktop_release import DEFAULT_DESKTOP_RELEASE_REPORT_PATH
from quant_core.execution import (
    ExecutionAdapterCertificationStore,
    PaperExecutionStore,
    PortfolioPaperOrderApprovalStore,
    PortfolioPaperOrderSimulationStore,
    PortfolioPaperOrderStore,
)
from quant_core.handoff_notes import HandoffNoteStore
from quant_core.live_quotes import QuantDingerLiveQuoteAdapter
from quant_core.market_ai_selection import MarketAiSelectionService
from quant_core.market_discovery import MarketDiscoveryService
from quant_core.market_information import MarketInformationService
from quant_core.market_klines import QuantDingerKlineAdapter
from quant_core.market_search import MarketSymbolSearchAdapter
from quant_core.monitoring import MonitoringService
from quant_core.p0_acceptance import DEFAULT_P0_ACCEPTANCE_REPORT_PATH
from quant_core.p1_acceptance import DEFAULT_P1_ACCEPTANCE_REPORT_PATH
from quant_core.p2_acceptance import DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH
from quant_core.p2_manifest_chain_preflight import DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH
from quant_core.p2_paper_replay import DEFAULT_P2_PAPER_REPLAY_REPORT_PATH
from quant_core.p2_readiness_acceptance import DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH
from quant_core.research_import_undo import ResearchRunImportUndoStore
from quant_core.research_notes import ResearchNoteStore
from quant_core.runs import ResearchRunStore
from quant_core.settings import PlatformSettingsStore
from quant_core.stage1_bootstrap_preflight import DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH
from quant_core.stage1_daily_use import DEFAULT_STAGE1_DAILY_USE_REPORT_PATH
from quant_core.stage5_exit import DEFAULT_STAGE5_EXIT_ACCEPTANCE_REPORT_PATH
from quant_core.stage6_exit import DEFAULT_STAGE6_EXIT_ACCEPTANCE_REPORT_PATH
from quant_core.strategy_experiment_store import StrategyExperimentStore
from quant_core.strategy_library import StrategyLibraryStore
from quant_core.watchlist import WatchlistStore
from quant_core.workspace_state import ResearchWorkspaceStateStore
from threading import Lock
from urllib.parse import urlparse

class ComposedQuantApiHandler(
    RouteDispatchMixin,
    HandlerTransportMixin,
    HandlerServicesMixin,
    HandlerRuntimeMixin,
    BaseHTTPRequestHandler,
):
    # ponytail: one local API process has low-volume admission authority changes and writes;
    # use a DB uniqueness constraint for multi-worker deployment.
    production_readonly_authority_lock = Lock()
    # ponytail: one local install at a time is enough; use a shared job queue for multi-worker deployment.
    optional_dependency_install_lock = Lock()
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
    market_ai_selection_service: MarketAiSelectionService | None = None
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
    platform_settings_store = PlatformSettingsStore(
        Path("data/platform_settings.sqlite"),
        Path("data/platform-settings.key"),
    )
    platform_settings_environ = None
    settings_restart_required = False
    auto_paper_trading_service: AutoPaperTradingService | None = None
    auto_paper_trading_runner: AutoPaperTradingRunner | None = None
    quote_adapter = QuantDingerLiveQuoteAdapter()
    kline_adapter = QuantDingerKlineAdapter(fallback_adapter=adapter)
    search_adapter = MarketSymbolSearchAdapter()
    market_discovery_service = MarketDiscoveryService()
    market_information_service = MarketInformationService(
        market_discovery_service=market_discovery_service
    )
    audit_signing_secret = os.environ.get("AIQT_AUDIT_SIGNING_SECRET", "local-dev-audit-secret")
    audit_signing_key_id = os.environ.get("AIQT_AUDIT_SIGNING_KEY_ID", "local-audit-key")
    audit_signer_name = os.environ.get("AIQT_AUDIT_SIGNER_NAME", "Local Audit Key")
    audit_chain_id = os.environ.get("AIQT_AUDIT_CHAIN_ID", "audit-chain-local")
    audit_signing_keys_json = os.environ.get("AIQT_AUDIT_SIGNING_KEYS_JSON", "")
    execution_adapter_health_exchange_factory = None
    execution_adapter_health_environ = None
    monitoring_environ = None
    monitoring_service: MonitoringService | None = None
    data_foundation_environ = None
    stage6_sandbox_route_factory = None
    stage9_production_admission_route_factory = None
    p0_acceptance_report_path = DEFAULT_P0_ACCEPTANCE_REPORT_PATH
    p1_acceptance_report_path = DEFAULT_P1_ACCEPTANCE_REPORT_PATH
    p2_pre_live_acceptance_report_path = DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH
    p2_paper_replay_report_path = DEFAULT_P2_PAPER_REPLAY_REPORT_PATH
    p2_readiness_acceptance_report_path = DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH
    stage5_exit_acceptance_report_path = DEFAULT_STAGE5_EXIT_ACCEPTANCE_REPORT_PATH
    stage6_exit_acceptance_report_path = DEFAULT_STAGE6_EXIT_ACCEPTANCE_REPORT_PATH
    p2_manifest_chain_preflight_report_path = DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH
    desktop_release_report_path = DEFAULT_DESKTOP_RELEASE_REPORT_PATH
    stage1_daily_use_report_path = DEFAULT_STAGE1_DAILY_USE_REPORT_PATH
    stage1_bootstrap_preflight_report_path = DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH
