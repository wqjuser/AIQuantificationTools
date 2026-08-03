from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .ai_validation import (
    _ai_research_m4_error_detail,
    _ai_research_m4_error_status,
    _ai_review_error_detail,
)
from .execution_export import _fetch_market_klines_with_cache
from .runtime import (
    _build_auto_paper_trading_service,
    _build_monitoring_service,
)
from quant_core.ai_research_m4 import AiResearchM4Service
from quant_core.ai_review_decisions import AiReviewDecisionStore
from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.ai_review_stage3 import (
    AiReviewEvidenceAssembler,
    AiReviewStage3Service,
    DeterministicAiReviewEngine,
)
from quant_core.audit_signing import AuditReportSigner
from quant_core.auto_paper_trading import AutoPaperTradingService
from quant_core.market_ai_selection import MarketAiSelectionService
from quant_core.monitoring import MonitoringService
from quant_core.portfolio_m5 import PortfolioM5Service
from quant_core.stage10_production_execution import (
    BinanceSpotProductionTradingRoute,
    Stage10ProductionExecutionService,
)
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    Stage6SandboxExecutionService,
)
from quant_core.stage9_production_admission import BinanceSpotProductionAdmissionRoute
from quant_core.strategy_experiments import StrategyExperimentRunner
from quant_core.terminal import build_terminal_workspace
from quant_core.watchlist import workspace_with_watchlist
from quant_core.workspace_state import workspace_with_research_workspace_state


def build_market_ai_selection_service(
    handler_type: type[Any],
    *,
    environment: Mapping[str, str],
    provider_registry: AiReviewProviderRegistry,
) -> MarketAiSelectionService:
    configured = handler_type.__dict__.get("market_ai_selection_service")
    if configured is None:
        configured = MarketAiSelectionService(
            discovery_service=handler_type.market_discovery_service,
            market_information_service=handler_type.market_information_service,
            kline_loader=handler_type.kline_adapter.fetch_ohlcv,
            watchlist_store=handler_type.watchlist_store,
            audit_store=handler_type.audit_event_store,
            provider_registry=provider_registry,
            run_store=handler_type.run_store,
            review_kline_loader=lambda request, limit: _fetch_market_klines_with_cache(
                cache=handler_type.cache,
                adapter=handler_type.kline_adapter,
                request=request,
                limit=limit,
                require_cache_provenance=True,
            ),
            sec_user_agent=environment.get("SEC_EDGAR_USER_AGENT", ""),
        )
        handler_type.market_ai_selection_service = configured
    update_runtime = getattr(configured, "update_runtime", None)
    if callable(update_runtime):
        update_runtime(
            provider_registry=provider_registry,
            sec_user_agent=environment.get("SEC_EDGAR_USER_AGENT", ""),
        )
    return configured

class HandlerServicesMixin:
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

    def _ai_research_m4_service(self) -> AiResearchM4Service:
        return AiResearchM4Service(
            review_store=self.ai_review_store,
            run_store=self.run_store,
            audit_store=self.audit_event_store,
        )

    def _market_ai_selection_service(self) -> MarketAiSelectionService:
        handler_type = type(self)
        environment = self._effective_platform_settings_environment()
        provider_registry = self._current_ai_review_provider_registry()
        return build_market_ai_selection_service(
            handler_type,
            environment=environment,
            provider_registry=provider_registry,
        )

    def _portfolio_m5_service(self) -> PortfolioM5Service:
        return PortfolioM5Service(audit_store=self.audit_event_store)

    def _current_ai_review_provider_registry(self) -> AiReviewProviderRegistry:
        return self.ai_review_provider_registry or AiReviewProviderRegistry.from_environment(
            self._effective_platform_settings_environment()
        )

    def _current_ai_review_decision_store(self) -> AiReviewDecisionStore:
        decision_store = self.ai_review_decision_store
        review_store = self.ai_review_store
        if getattr(decision_store, "review_store", None) is review_store:
            return decision_store
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

    def _send_ai_research_m4_error(self, error: ValueError) -> None:
        code = str(error) or "invalid_ai_research_request"
        self._send_json(
            {"error": code, "detail": _ai_research_m4_error_detail(code)},
            status=_ai_research_m4_error_status(code),
        )

    def _stage6_sandbox_service(self) -> Stage6SandboxExecutionService:
        factory = self.stage6_sandbox_route_factory
        route = (
            factory()
            if callable(factory)
            else BinanceSpotTestnetRoute(env=self._execution_adapter_environment())
        )
        return Stage6SandboxExecutionService(self.audit_event_store, route)

    def _stage9_production_admission_route(self) -> BinanceSpotProductionAdmissionRoute:
        factory = self.stage9_production_admission_route_factory
        if callable(factory):
            return factory()
        return BinanceSpotProductionAdmissionRoute(
            env=self._execution_adapter_environment(),
            exchange_factory=type(self).execution_adapter_health_exchange_factory,
        )

    def _stage10_production_execution_service(self) -> Stage10ProductionExecutionService:
        route = BinanceSpotProductionTradingRoute(
            env=self._execution_adapter_environment(),
            exchange_factory=type(self).execution_adapter_health_exchange_factory,
        )
        return Stage10ProductionExecutionService(
            self.audit_event_store,
            auto_route=route,
            acquire_account_lease=type(self).stage10_account_lease_acquire,
            release_account_lease=type(self).stage10_account_lease_release,
        )

    def _auto_paper_trading_service(self) -> AutoPaperTradingService:
        return (
            type(self).auto_paper_trading_service
            or _build_auto_paper_trading_service(type(self))
        )

    def _monitoring_service(self) -> MonitoringService:
        return type(self).monitoring_service or _build_monitoring_service(type(self))
