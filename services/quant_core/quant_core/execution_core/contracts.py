from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from quant_core.domain import OrderResult, PaperAccount

__all__ = [
    'ExecutionAdapterCertificationApplyResult',
    'ExecutionAdapterCertificationRun',
    'ExecutionAdapterControlledRestartEvidenceResult',
    'ExecutionAdapterEnvironmentBindingResult',
    'ExecutionAdapterHumanConfirmationResult',
    'ExecutionAdapterOpsStateResult',
    'ExecutionAdapterOrchestrationDryRunResult',
    'ExecutionAdapterOrchestrationExecutionResult',
    'ExecutionAdapterPaperExecutionResult',
    'ExecutionAdapterPaperOrderLifecycleResult',
    'ExecutionAdapterPaperRouteRunbookResult',
    'ExecutionAdapterProductionRouteReviewResult',
    'ExecutionAdapterRestartAcceptanceResult',
    'ExecutionAdapterRuntimeReloadAcceptanceResult',
    'ExecutionAdapterRuntimeReloadExecutionResult',
    'ExecutionAdapterRuntimeReloadPlanResult',
    'ExecutionAdapterSandboxOrderSchemaDryRunResult',
    'ExecutionAdapterSandboxProbeExecutionResult',
    'ExecutionAdapterSandboxProbePlanResult',
    'ExecutionAdapterSandboxProbeReviewResult',
    'ExecutionAdapterSecretManifestValidationResult',
    'ExecutionAdapterSecretMaterializationResult',
    'ExecutionAdapterSecretReferenceResult',
    'PaperExecutionRecord',
    'PortfolioPaperOrderApproval',
    'PortfolioPaperOrderBatch',
    'PortfolioPaperOrderSimulation',
]

@dataclass(frozen=True)
class PaperExecutionRecord:
    execution_id: str
    run_id: str
    created_at: datetime
    mode: str
    account: PaperAccount
    orders: list[OrderResult]
    gates: list[dict[str, Any]]
    preparation_evidence: dict[str, Any] | None = None


@dataclass(frozen=True)
class PortfolioPaperOrderBatch:
    batch_id: str
    base_run_id: str
    portfolio_name: str
    created_at: datetime
    mode: str
    source: str
    orders: list[dict[str, Any]]
    summary: dict[str, Any]


@dataclass(frozen=True)
class PortfolioPaperOrderApproval:
    approval_id: str
    base_run_id: str
    batch_id: str
    order_id: str
    reviewed_at: datetime
    approved: bool
    reviewer: str
    reason: str


@dataclass(frozen=True)
class PortfolioPaperOrderSimulation:
    simulation_id: str
    base_run_id: str
    batch_id: str
    order_id: str
    simulated_at: datetime
    mode: str
    symbol: str
    source_run_id: str | None
    side: str
    quantity: float
    fill_price: float
    notional_value: float
    order_state: str
    fill_status: str
    reason: str
    approved_by: str | None
    route_risk: dict[str, Any] = field(default_factory=dict)
    adapter_paper_execution_id: str = ""
    adapter_manifest_validation_id: str = ""
    adapter_paper_execution_evidence: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ExecutionAdapterCertificationRun:
    certification_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    started_at: datetime
    completed_at: datetime | None
    checks: list[dict[str, Any]]
    metadata: dict[str, Any]
    summary: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterCertificationApplyResult:
    apply_id: str
    certification_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    generated_at: datetime
    apply_mode: str
    restart_required: bool
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    manifest_validation_id: str = ""
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterControlledRestartEvidenceResult:
    evidence_id: str
    apply_id: str
    certification_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    evidence_mode: str
    restart_required: bool
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterRestartAcceptanceResult:
    acceptance_id: str
    evidence_id: str
    apply_id: str
    certification_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    acceptance_mode: str
    restart_required: bool
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterSecretReferenceResult:
    reference_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    reference_name: str
    backend: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterSecretMaterializationResult:
    materialization_id: str
    reference_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    materialization_mode: str
    reference_name: str
    backend: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterSecretManifestValidationResult:
    validation_id: str
    materialization_id: str
    reference_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    validation_mode: str
    reference_name: str
    backend: str
    manifest_path: str
    fingerprint: str
    required_env_vars: list[str]
    covered_env_vars: list[str]
    blocked_reasons: list[str]
    manifest_summary: dict[str, Any]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterEnvironmentBindingResult:
    binding_id: str
    materialization_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    manifest_validation_id: str = ""
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterRuntimeReloadPlanResult:
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterRuntimeReloadExecutionResult:
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterRuntimeReloadAcceptanceResult:
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterOrchestrationDryRunResult:
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterOrchestrationExecutionResult:
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterHumanConfirmationResult:
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterSandboxProbePlanResult:
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterSandboxProbeExecutionResult:
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterSandboxProbeReviewResult:
    sandbox_probe_review_id: str
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    review_mode: str
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterProductionRouteReviewResult:
    production_route_review_id: str
    sandbox_probe_review_id: str
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    review_mode: str
    sandbox_review_mode: str
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterSandboxOrderSchemaDryRunResult:
    sandbox_order_schema_dry_run_id: str
    production_route_review_id: str
    sandbox_probe_review_id: str
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    dry_run_mode: str
    review_mode: str
    sandbox_review_mode: str
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    order_intent: dict[str, Any]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterPaperOrderLifecycleResult:
    paper_order_lifecycle_id: str
    sandbox_order_schema_dry_run_id: str
    production_route_review_id: str
    sandbox_probe_review_id: str
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    lifecycle_mode: str
    dry_run_mode: str
    review_mode: str
    sandbox_review_mode: str
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    order_intent: dict[str, Any]
    lifecycle_steps: list[dict[str, Any]]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterPaperRouteRunbookResult:
    paper_route_runbook_id: str
    paper_order_lifecycle_id: str
    sandbox_order_schema_dry_run_id: str
    production_route_review_id: str
    sandbox_probe_review_id: str
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    runbook_mode: str
    lifecycle_mode: str
    dry_run_mode: str
    review_mode: str
    sandbox_review_mode: str
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    order_intent: dict[str, Any]
    lifecycle_steps: list[dict[str, Any]]
    runbook_steps: list[dict[str, Any]]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterOpsStateResult:
    adapter_ops_state_id: str
    paper_route_runbook_id: str
    paper_order_lifecycle_id: str
    sandbox_order_schema_dry_run_id: str
    production_route_review_id: str
    sandbox_probe_review_id: str
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    ops_mode: str
    runbook_mode: str
    lifecycle_mode: str
    dry_run_mode: str
    review_mode: str
    sandbox_review_mode: str
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    order_intent: dict[str, Any]
    lifecycle_steps: list[dict[str, Any]]
    runbook_steps: list[dict[str, Any]]
    ops_steps: list[dict[str, Any]]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False


@dataclass(frozen=True)
class ExecutionAdapterPaperExecutionResult:
    adapter_paper_execution_id: str
    adapter_ops_state_id: str
    paper_route_runbook_id: str
    paper_order_lifecycle_id: str
    sandbox_order_schema_dry_run_id: str
    production_route_review_id: str
    sandbox_probe_review_id: str
    sandbox_probe_execution_id: str
    sandbox_probe_plan_id: str
    human_confirmation_id: str
    orchestration_execution_id: str
    dry_run_id: str
    acceptance_id: str
    execution_id: str
    plan_id: str
    binding_id: str
    materialization_id: str
    manifest_validation_id: str
    adapter_id: str
    market: str
    route: str
    status: str
    operator: str
    recorded_at: datetime
    paper_execution_mode: str
    ops_mode: str
    runbook_mode: str
    lifecycle_mode: str
    dry_run_mode: str
    review_mode: str
    sandbox_review_mode: str
    probe_execution_mode: str
    probe_mode: str
    confirmation_mode: str
    orchestration_execution_mode: str
    orchestration_mode: str
    acceptance_mode: str
    execution_mode: str
    reload_mode: str
    maintenance_window_id: str
    binding_mode: str
    manifest_path: str
    required_env_vars: list[str]
    order_intent: dict[str, Any]
    lifecycle_steps: list[dict[str, Any]]
    runbook_steps: list[dict[str, Any]]
    ops_steps: list[dict[str, Any]]
    paper_execution_steps: list[dict[str, Any]]
    simulated_fill: dict[str, Any]
    required_confirmations: list[dict[str, Any]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    live_trading_allowed: bool = False
