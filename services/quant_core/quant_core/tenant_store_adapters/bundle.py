from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.engine import Engine

from quant_core.public_coordination import PublicLeaseStore
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_storage import (
    ProductionAccountClaimStore,
    TenantRecordStore,
    TenantSettingsStore,
)
from quant_core.tenancy import TenantContext

from .ai_review import TenantAiReviewDecisionStore, TenantAiReviewRunStore
from .base import TenantModelRepository
from .core import (
    TenantAuditEventStore,
    TenantHandoffNoteStore,
    TenantImportUndoStore,
    TenantResearchNoteStore,
    TenantResearchRunStore,
    TenantSimpleRecordStore,
    TenantStrategyStore,
    TenantWatchlistStore,
    TenantWorkspaceStateStore,
)
from .execution import (
    TenantExecutionCertificationStore,
    TenantPaperExecutionStore,
    TenantPortfolioApprovalStore,
    TenantPortfolioPaperOrderStore,
    TenantPortfolioSimulationStore,
)
from .settings import TenantPlatformSettingsAdapter
from .strategy_experiments import TenantStrategyExperimentStore


@dataclass(frozen=True)
class PublicTenantStores:
    context: TenantContext
    records: TenantRecordStore
    run_store: TenantResearchRunStore
    paper_execution_store: TenantPaperExecutionStore
    portfolio_paper_order_store: TenantPortfolioPaperOrderStore
    portfolio_paper_order_approval_store: TenantPortfolioApprovalStore
    portfolio_paper_order_simulation_store: TenantPortfolioSimulationStore
    execution_adapter_certification_store: TenantExecutionCertificationStore
    ai_review_store: TenantAiReviewRunStore
    ai_review_decision_store: TenantAiReviewDecisionStore
    audit_event_store: TenantAuditEventStore
    import_undo_store: TenantImportUndoStore
    strategy_store: TenantStrategyStore
    strategy_experiment_store: TenantStrategyExperimentStore
    note_store: TenantResearchNoteStore
    handoff_note_store: TenantHandoffNoteStore
    watchlist_store: TenantWatchlistStore
    workspace_state_store: TenantWorkspaceStateStore
    watchlist_cache_refresh_store: TenantSimpleRecordStore
    adapter_error_store: TenantSimpleRecordStore
    platform_settings_store: TenantPlatformSettingsAdapter
    leases: PublicLeaseStore
    production_accounts: ProductionAccountClaimStore
    report_artifacts: TenantModelRepository

    @classmethod
    def create(
        cls,
        engine: Engine,
        context: TenantContext,
        cipher: TenantSecretCipher,
        *,
        allowed_outbound_origins: tuple[str, ...] = (),
    ) -> "PublicTenantStores":
        records = TenantRecordStore(engine, context.owner_id)

        def repository(kind: str) -> TenantModelRepository:
            return TenantModelRepository(records, kind)

        ai_reviews = TenantAiReviewRunStore(
            repository("ai_review_run"),
            context.owner_id,
        )
        return cls(
            context=context,
            records=records,
            run_store=TenantResearchRunStore(repository("research_run")),
            paper_execution_store=TenantPaperExecutionStore(
                repository("paper_execution")
            ),
            portfolio_paper_order_store=TenantPortfolioPaperOrderStore(
                repository("portfolio_paper_order_batch")
            ),
            portfolio_paper_order_approval_store=TenantPortfolioApprovalStore(
                repository("portfolio_paper_order_approval")
            ),
            portfolio_paper_order_simulation_store=TenantPortfolioSimulationStore(
                repository("portfolio_paper_order_simulation")
            ),
            execution_adapter_certification_store=TenantExecutionCertificationStore(
                repository("execution_adapter_certification")
            ),
            ai_review_store=ai_reviews,
            ai_review_decision_store=TenantAiReviewDecisionStore(
                repository("ai_review_decision"),
                review_store=ai_reviews,
            ),
            audit_event_store=TenantAuditEventStore(repository("audit_event")),
            import_undo_store=TenantImportUndoStore(repository("research_import_undo")),
            strategy_store=TenantStrategyStore(repository("strategy")),
            strategy_experiment_store=TenantStrategyExperimentStore(
                repository("strategy_experiment_snapshot"),
                repository("strategy_experiment"),
            ),
            note_store=TenantResearchNoteStore(repository("research_note")),
            handoff_note_store=TenantHandoffNoteStore(repository("handoff_note")),
            watchlist_store=TenantWatchlistStore(repository("watchlist")),
            workspace_state_store=TenantWorkspaceStateStore(
                repository("research_workspace_state")
            ),
            watchlist_cache_refresh_store=TenantSimpleRecordStore(
                repository("watchlist_cache_refresh"),
                "run_id",
            ),
            adapter_error_store=TenantSimpleRecordStore(
                repository("market_data_adapter_error"),
                "event_id",
            ),
            platform_settings_store=TenantPlatformSettingsAdapter(
                TenantSettingsStore(engine, context.owner_id, cipher),
                allowed_outbound_origins=allowed_outbound_origins,
            ),
            leases=PublicLeaseStore(engine),
            production_accounts=ProductionAccountClaimStore(engine),
            report_artifacts=repository("acceptance_artifact"),
        )
