from __future__ import annotations

import json
import math
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from quant_core.domain import OrderResult, PaperAccount


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


class PaperExecutionAdapter:
    def __init__(self, initial_cash: float = 100_000, max_position_value: float = 20_000) -> None:
        self.cash = initial_cash
        self.max_position_value = max_position_value
        self.positions: dict[str, float] = {}
        self.last_prices: dict[str, float] = {}
        self.orders: list[OrderResult] = []

    def submit_order(self, symbol: str, side: str, quantity: float, price: float) -> OrderResult:
        if quantity <= 0 or price <= 0:
            return self._record(symbol, side, quantity, price, "rejected", "quantity_and_price_must_be_positive")

        current_position = self.positions.get(symbol, 0.0)
        value = quantity * price
        if side == "buy":
            if current_position * price + value > self.max_position_value:
                return self._record(symbol, side, quantity, price, "rejected", "max_position_value_exceeded")
            if value > self.cash:
                return self._record(symbol, side, quantity, price, "rejected", "insufficient_cash")
            self.cash -= value
            self.positions[symbol] = current_position + quantity
        elif side == "sell":
            if quantity > current_position:
                return self._record(symbol, side, quantity, price, "rejected", "insufficient_position")
            self.cash += value
            remaining = current_position - quantity
            if remaining:
                self.positions[symbol] = remaining
            else:
                self.positions.pop(symbol, None)
        else:
            return self._record(symbol, side, quantity, price, "rejected", "unsupported_side")

        self.last_prices[symbol] = price
        return self._record(symbol, side, quantity, price, "filled", "filled_immediately")

    def account(self) -> PaperAccount:
        position_value = sum(quantity * self.last_prices.get(symbol, 0.0) for symbol, quantity in self.positions.items())
        return PaperAccount(cash=self.cash, positions=dict(self.positions), equity=self.cash + position_value)

    def _record(self, symbol: str, side: str, quantity: float, price: float, status: str, reason: str) -> OrderResult:
        order = OrderResult(
            order_id=str(uuid4()),
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            status=status,
            reason=reason,
            timestamp=datetime.now(timezone.utc),
        )
        self.orders.append(order)
        return order


class PaperExecutionStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists paper_executions (
                    execution_id text primary key,
                    run_id text not null,
                    created_at text not null,
                    mode text not null,
                    account_json text not null,
                    orders_json text not null,
                    gates_json text not null,
                    preparation_evidence_json text
                )
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute("pragma table_info(paper_executions)").fetchall()
            }
            if "preparation_evidence_json" not in columns:
                connection.execute("alter table paper_executions add column preparation_evidence_json text")
            connection.execute(
                """
                create index if not exists idx_paper_executions_run_id_created_at
                on paper_executions(run_id, created_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, execution: PaperExecutionRecord) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into paper_executions (
                    execution_id,
                    run_id,
                    created_at,
                    mode,
                    account_json,
                    orders_json,
                    gates_json,
                    preparation_evidence_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(execution_id) do update set
                    run_id = excluded.run_id,
                    created_at = excluded.created_at,
                    mode = excluded.mode,
                    account_json = excluded.account_json,
                    orders_json = excluded.orders_json,
                    gates_json = excluded.gates_json,
                    preparation_evidence_json = excluded.preparation_evidence_json
                """,
                (
                    execution.execution_id,
                    execution.run_id,
                    execution.created_at.isoformat(),
                    execution.mode,
                    json.dumps(_account_to_payload(execution.account), ensure_ascii=False, sort_keys=True),
                    json.dumps([_order_to_payload(order) for order in execution.orders], ensure_ascii=False, sort_keys=True),
                    json.dumps(_normalize_gates(execution.gates), ensure_ascii=False, sort_keys=True),
                    json.dumps(execution.preparation_evidence, ensure_ascii=False, sort_keys=True)
                    if execution.preparation_evidence
                    else None,
                ),
            )
            connection.commit()
        finally:
            connection.close()

    def list_by_run(self, run_id: str, limit: int = 20) -> list[PaperExecutionRecord]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select execution_id, run_id, created_at, mode, account_json, orders_json, gates_json, preparation_evidence_json
                from paper_executions
                where run_id = ?
                order by created_at desc
                limit ?
                """,
                (run_id, max(1, min(limit, 50))),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_paper_execution(row) for row in rows]

    def list_all_by_run(self, run_id: str) -> list[PaperExecutionRecord]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select execution_id, run_id, created_at, mode, account_json, orders_json, gates_json, preparation_evidence_json
                from paper_executions
                where run_id = ?
                order by created_at desc
                """,
                (run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_paper_execution(row) for row in rows]

    def delete_by_run(self, run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from paper_executions where run_id = ?", (run_id,))
            connection.commit()
        finally:
            connection.close()


class ExecutionAdapterCertificationStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists execution_adapter_certifications (
                    certification_id text primary key,
                    adapter_id text not null,
                    market text not null,
                    route text not null,
                    status text not null,
                    operator text not null,
                    started_at text not null,
                    completed_at text,
                    live_trading_allowed integer not null,
                    checks_json text not null,
                    metadata_json text not null,
                    summary_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_execution_adapter_certifications_adapter_started
                on execution_adapter_certifications(adapter_id, started_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, run: ExecutionAdapterCertificationRun) -> ExecutionAdapterCertificationRun:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into execution_adapter_certifications (
                    certification_id,
                    adapter_id,
                    market,
                    route,
                    status,
                    operator,
                    started_at,
                    completed_at,
                    live_trading_allowed,
                    checks_json,
                    metadata_json,
                    summary_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(certification_id) do update set
                    adapter_id = excluded.adapter_id,
                    market = excluded.market,
                    route = excluded.route,
                    status = excluded.status,
                    operator = excluded.operator,
                    started_at = excluded.started_at,
                    completed_at = excluded.completed_at,
                    live_trading_allowed = excluded.live_trading_allowed,
                    checks_json = excluded.checks_json,
                    metadata_json = excluded.metadata_json,
                    summary_json = excluded.summary_json
                """,
                (
                    run.certification_id,
                    run.adapter_id,
                    run.market,
                    run.route,
                    run.status,
                    run.operator,
                    run.started_at.isoformat(),
                    run.completed_at.isoformat() if run.completed_at else None,
                    1 if run.live_trading_allowed else 0,
                    json.dumps(run.checks, ensure_ascii=False, sort_keys=True),
                    json.dumps(run.metadata, ensure_ascii=False, sort_keys=True),
                    json.dumps(run.summary, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return run

    def get(self, certification_id: str) -> ExecutionAdapterCertificationRun | None:
        normalized_id = str(certification_id or "").strip()
        if not normalized_id:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select certification_id, adapter_id, market, route, status, operator, started_at,
                       completed_at, live_trading_allowed, checks_json, metadata_json, summary_json
                from execution_adapter_certifications
                where certification_id = ?
                """,
                (normalized_id,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_execution_adapter_certification(row) if row else None

    def list_by_adapter(self, adapter_id: str, limit: int = 20) -> list[ExecutionAdapterCertificationRun]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select certification_id, adapter_id, market, route, status, operator, started_at,
                       completed_at, live_trading_allowed, checks_json, metadata_json, summary_json
                from execution_adapter_certifications
                where adapter_id = ?
                order by started_at desc
                limit ?
                """,
                (adapter_id, max(1, min(limit, 50))),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_execution_adapter_certification(row) for row in rows]


class PortfolioPaperOrderStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists portfolio_paper_order_batches (
                    batch_id text primary key,
                    base_run_id text not null,
                    created_at text not null,
                    portfolio_name text not null,
                    mode text not null,
                    source text not null,
                    orders_json text not null,
                    summary_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_portfolio_paper_order_batches_base_run_created
                on portfolio_paper_order_batches(base_run_id, created_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, batch: PortfolioPaperOrderBatch) -> PortfolioPaperOrderBatch:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into portfolio_paper_order_batches (
                    batch_id,
                    base_run_id,
                    created_at,
                    portfolio_name,
                    mode,
                    source,
                    orders_json,
                    summary_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(batch_id) do update set
                    base_run_id = excluded.base_run_id,
                    created_at = excluded.created_at,
                    portfolio_name = excluded.portfolio_name,
                    mode = excluded.mode,
                    source = excluded.source,
                    orders_json = excluded.orders_json,
                    summary_json = excluded.summary_json
                """,
                (
                    batch.batch_id,
                    batch.base_run_id,
                    batch.created_at.isoformat(),
                    batch.portfolio_name,
                    batch.mode,
                    batch.source,
                    json.dumps(batch.orders, ensure_ascii=False, sort_keys=True),
                    json.dumps(batch.summary, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return batch

    def list_by_base_run(self, base_run_id: str, limit: int = 20) -> list[PortfolioPaperOrderBatch]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select batch_id, base_run_id, created_at, portfolio_name, mode, source, orders_json, summary_json
                from portfolio_paper_order_batches
                where base_run_id = ?
                order by created_at desc
                limit ?
                """,
                (base_run_id, max(1, min(limit, 50))),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_batch(row) for row in rows]

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderBatch]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select batch_id, base_run_id, created_at, portfolio_name, mode, source, orders_json, summary_json
                from portfolio_paper_order_batches
                where base_run_id = ?
                order by created_at desc
                """,
                (base_run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_batch(row) for row in rows]

    def delete_by_base_run(self, base_run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from portfolio_paper_order_batches where base_run_id = ?", (base_run_id,))
            connection.commit()
        finally:
            connection.close()


class PortfolioPaperOrderApprovalStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists portfolio_paper_order_approvals (
                    approval_id text primary key,
                    base_run_id text not null,
                    batch_id text not null,
                    order_id text not null,
                    reviewed_at text not null,
                    approved integer not null,
                    reviewer text not null,
                    reason text not null
                )
                """
            )
            connection.execute(
                """
                create unique index if not exists idx_portfolio_paper_order_approvals_order
                on portfolio_paper_order_approvals(base_run_id, batch_id, order_id)
                """
            )
            connection.execute(
                """
                create index if not exists idx_portfolio_paper_order_approvals_batch
                on portfolio_paper_order_approvals(base_run_id, batch_id, reviewed_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, approval: PortfolioPaperOrderApproval) -> PortfolioPaperOrderApproval:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into portfolio_paper_order_approvals (
                    approval_id,
                    base_run_id,
                    batch_id,
                    order_id,
                    reviewed_at,
                    approved,
                    reviewer,
                    reason
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(base_run_id, batch_id, order_id) do update set
                    approval_id = excluded.approval_id,
                    reviewed_at = excluded.reviewed_at,
                    approved = excluded.approved,
                    reviewer = excluded.reviewer,
                    reason = excluded.reason
                """,
                (
                    approval.approval_id,
                    approval.base_run_id,
                    approval.batch_id,
                    approval.order_id,
                    approval.reviewed_at.isoformat(),
                    1 if approval.approved else 0,
                    approval.reviewer,
                    approval.reason,
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return approval

    def list_by_batch(self, base_run_id: str, batch_id: str) -> list[PortfolioPaperOrderApproval]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select approval_id, base_run_id, batch_id, order_id, reviewed_at, approved, reviewer, reason
                from portfolio_paper_order_approvals
                where base_run_id = ? and batch_id = ?
                order by reviewed_at desc
                """,
                (base_run_id, batch_id),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_approval(row) for row in rows]

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderApproval]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select approval_id, base_run_id, batch_id, order_id, reviewed_at, approved, reviewer, reason
                from portfolio_paper_order_approvals
                where base_run_id = ?
                order by reviewed_at desc
                """,
                (base_run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_approval(row) for row in rows]

    def delete_by_base_run(self, base_run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from portfolio_paper_order_approvals where base_run_id = ?", (base_run_id,))
            connection.commit()
        finally:
            connection.close()


class PortfolioPaperOrderSimulationStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists portfolio_paper_order_simulations (
                    simulation_id text primary key,
                    base_run_id text not null,
                    batch_id text not null,
                    order_id text not null,
                    simulated_at text not null,
                    mode text not null,
                    symbol text not null,
                    source_run_id text,
                    side text not null,
                    quantity real not null,
                    fill_price real not null,
                    notional_value real not null,
                    order_state text not null,
                    fill_status text not null,
                    reason text not null,
                    approved_by text,
                    route_risk_json text not null default '{}',
                    adapter_paper_execution_id text not null default '',
                    adapter_manifest_validation_id text not null default '',
                    adapter_paper_execution_evidence_json text not null default '{}'
                )
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute("pragma table_info(portfolio_paper_order_simulations)").fetchall()
            }
            if "route_risk_json" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column route_risk_json text not null default '{}'"
                )
            if "adapter_paper_execution_id" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column adapter_paper_execution_id text not null default ''"
                )
            if "adapter_manifest_validation_id" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column adapter_manifest_validation_id text not null default ''"
                )
            if "adapter_paper_execution_evidence_json" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column adapter_paper_execution_evidence_json text not null default '{}'"
                )
            connection.execute(
                """
                create unique index if not exists idx_portfolio_paper_order_simulations_order
                on portfolio_paper_order_simulations(base_run_id, batch_id, order_id)
                """
            )
            connection.execute(
                """
                create index if not exists idx_portfolio_paper_order_simulations_batch
                on portfolio_paper_order_simulations(base_run_id, batch_id, simulated_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, simulation: PortfolioPaperOrderSimulation) -> PortfolioPaperOrderSimulation:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into portfolio_paper_order_simulations (
                    simulation_id,
                    base_run_id,
                    batch_id,
                    order_id,
                    simulated_at,
                    mode,
                    symbol,
                    source_run_id,
                    side,
                    quantity,
                    fill_price,
                    notional_value,
                    order_state,
                    fill_status,
                    reason,
                    approved_by,
                    route_risk_json,
                    adapter_paper_execution_id,
                    adapter_manifest_validation_id,
                    adapter_paper_execution_evidence_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(base_run_id, batch_id, order_id) do update set
                    simulation_id = excluded.simulation_id,
                    simulated_at = excluded.simulated_at,
                    mode = excluded.mode,
                    symbol = excluded.symbol,
                    source_run_id = excluded.source_run_id,
                    side = excluded.side,
                    quantity = excluded.quantity,
                    fill_price = excluded.fill_price,
                    notional_value = excluded.notional_value,
                    order_state = excluded.order_state,
                    fill_status = excluded.fill_status,
                    reason = excluded.reason,
                    approved_by = excluded.approved_by,
                    route_risk_json = excluded.route_risk_json,
                    adapter_paper_execution_id = excluded.adapter_paper_execution_id,
                    adapter_manifest_validation_id = excluded.adapter_manifest_validation_id,
                    adapter_paper_execution_evidence_json = excluded.adapter_paper_execution_evidence_json
                """,
                (
                    simulation.simulation_id,
                    simulation.base_run_id,
                    simulation.batch_id,
                    simulation.order_id,
                    simulation.simulated_at.isoformat(),
                    simulation.mode,
                    simulation.symbol,
                    simulation.source_run_id,
                    simulation.side,
                    simulation.quantity,
                    simulation.fill_price,
                    simulation.notional_value,
                    simulation.order_state,
                    simulation.fill_status,
                    simulation.reason,
                    simulation.approved_by,
                    json.dumps(simulation.route_risk, ensure_ascii=False),
                    simulation.adapter_paper_execution_id,
                    simulation.adapter_manifest_validation_id,
                    json.dumps(simulation.adapter_paper_execution_evidence, ensure_ascii=False),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return simulation

    def list_by_batch(self, base_run_id: str, batch_id: str) -> list[PortfolioPaperOrderSimulation]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select simulation_id, base_run_id, batch_id, order_id, simulated_at, mode, symbol, source_run_id,
                       side, quantity, fill_price, notional_value, order_state, fill_status, reason, approved_by,
                       route_risk_json, adapter_paper_execution_id, adapter_manifest_validation_id,
                       adapter_paper_execution_evidence_json
                from portfolio_paper_order_simulations
                where base_run_id = ? and batch_id = ?
                order by simulated_at desc
                """,
                (base_run_id, batch_id),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_simulation(row) for row in rows]

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderSimulation]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select simulation_id, base_run_id, batch_id, order_id, simulated_at, mode, symbol, source_run_id,
                       side, quantity, fill_price, notional_value, order_state, fill_status, reason, approved_by,
                       route_risk_json, adapter_paper_execution_id, adapter_manifest_validation_id,
                       adapter_paper_execution_evidence_json
                from portfolio_paper_order_simulations
                where base_run_id = ?
                order by simulated_at desc
                """,
                (base_run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_simulation(row) for row in rows]

    def delete_by_base_run(self, base_run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from portfolio_paper_order_simulations where base_run_id = ?", (base_run_id,))
            connection.commit()
        finally:
            connection.close()


def create_paper_execution_from_audit(audit: Any, *, created_at: datetime | None = None) -> PaperExecutionRecord:
    created = created_at or datetime.now(timezone.utc)
    price = _latest_close(audit)
    assumptions = audit.backtest_assumptions if isinstance(getattr(audit, "backtest_assumptions", None), dict) else {}
    initial_cash = _positive_number(assumptions.get("initialCash"), 100_000)
    max_position_value = _paper_target_notional(audit, initial_cash)
    quantity = _paper_quantity(str(getattr(audit, "market", "")), price, max_position_value)
    paper = PaperExecutionAdapter(initial_cash=initial_cash, max_position_value=max_position_value)
    order = paper.submit_order(symbol=str(getattr(audit, "symbol", "")), side="buy", quantity=quantity, price=price)
    return PaperExecutionRecord(
        execution_id=f"paper-{uuid4().hex[:12]}",
        run_id=str(getattr(audit, "run_id", "")),
        created_at=created,
        mode="paper_only",
        account=paper.account(),
        orders=[order],
        gates=[
            {
                "id": "audit-run-bound",
                "label": "Audit run bound",
                "passed": bool(getattr(audit, "run_id", "")),
                "reason": f"Paper execution is linked to audited run {getattr(audit, 'run_id', '')}.",
            },
            {
                "id": "paper-risk-check",
                "label": "Paper risk check",
                "passed": order.status == "filled",
                "reason": order.reason,
            },
            {
                "id": "live-route-blocked",
                "label": "Live route blocked",
                "passed": False,
                "reason": "Live execution is blocked; this record is paper-only.",
            },
        ],
        preparation_evidence=_paper_preparation_evidence_from_audit(audit),
    )


def validate_paper_execution_handoff(audit: Any) -> None:
    data_quality = getattr(audit, "data_quality", None)
    if not _paper_execution_data_quality_is_complete(data_quality):
        raise ValueError("paper_execution_data_quality_incomplete")

    strategy_config = getattr(audit, "strategy_config", None)
    risk = strategy_config.get("risk") if isinstance(strategy_config, dict) else None
    required_risk_fields = ("positionPct", "stopLossPct", "takeProfitPct", "maxDrawdownPct")
    if not isinstance(risk, dict) or any(_strict_positive_number(risk.get(field)) is None for field in required_risk_fields):
        raise ValueError("paper_execution_strategy_risk_incomplete")


def paper_execution_record_to_payload(execution: PaperExecutionRecord) -> dict[str, Any]:
    payload = {
        "executionId": execution.execution_id,
        "runId": execution.run_id,
        "createdAt": execution.created_at.isoformat(),
        "mode": execution.mode,
        "account": _account_to_payload(execution.account),
        "orders": [_order_to_payload(order) for order in execution.orders],
        "gates": _normalize_gates(execution.gates),
    }
    if execution.preparation_evidence:
        payload["preparationEvidence"] = dict(execution.preparation_evidence)
    return payload


def create_portfolio_paper_order_batch(
    *,
    base_run_id: str,
    portfolio_name: str,
    orders: list[dict[str, Any]],
    source: str = "portfolio_backtest",
    created_at: datetime | None = None,
    batch_id: str | None = None,
) -> PortfolioPaperOrderBatch:
    normalized_base_run_id = str(base_run_id or "").strip()
    normalized_portfolio_name = str(portfolio_name or "").strip()
    normalized_source = str(source or "portfolio_backtest").strip() or "portfolio_backtest"
    if not normalized_base_run_id:
        raise ValueError("portfolio_paper_order_base_run_id_required")
    if not normalized_portfolio_name:
        raise ValueError("portfolio_paper_order_portfolio_name_required")
    if not isinstance(orders, list) or not orders:
        raise ValueError("portfolio_paper_order_orders_required")
    normalized_orders = [_normalize_portfolio_paper_order(order) for order in orders]
    return PortfolioPaperOrderBatch(
        batch_id=str(batch_id or f"portfolio-paper-batch-{uuid4().hex[:12]}"),
        base_run_id=normalized_base_run_id,
        portfolio_name=normalized_portfolio_name,
        created_at=created_at or datetime.now(timezone.utc),
        mode="portfolio_paper_order_review",
        source=normalized_source,
        orders=normalized_orders,
        summary=_portfolio_paper_order_summary(normalized_orders),
    )


def portfolio_paper_order_batch_to_payload(batch: PortfolioPaperOrderBatch) -> dict[str, Any]:
    return {
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "portfolioName": batch.portfolio_name,
        "createdAt": batch.created_at.isoformat(),
        "mode": batch.mode,
        "source": batch.source,
        "summary": dict(batch.summary),
        "orders": [dict(order) for order in batch.orders],
    }


def create_portfolio_paper_order_approval(
    *,
    base_run_id: str,
    batch_id: str,
    order_id: str,
    approved: bool,
    reviewer: str,
    reason: str,
    reviewed_at: datetime | str | None = None,
) -> PortfolioPaperOrderApproval:
    normalized_base_run_id = str(base_run_id or "").strip()
    normalized_batch_id = str(batch_id or "").strip()
    normalized_order_id = str(order_id or "").strip()
    normalized_reviewer = str(reviewer or "").strip()
    normalized_reason = str(reason or "").strip()
    if not normalized_base_run_id:
        raise ValueError("portfolio_paper_order_approval_base_run_id_required")
    if not normalized_batch_id:
        raise ValueError("portfolio_paper_order_approval_batch_id_required")
    if not normalized_order_id:
        raise ValueError("portfolio_paper_order_approval_order_id_required")
    if not normalized_reviewer:
        raise ValueError("portfolio_paper_order_approval_reviewer_required")
    if not normalized_reason:
        raise ValueError("portfolio_paper_order_approval_reason_required")
    reviewed = (
        _parse_payload_datetime(reviewed_at, "portfolio_paper_order_approval_reviewed_at_invalid")
        if reviewed_at is not None
        else datetime.now(timezone.utc)
    )
    return PortfolioPaperOrderApproval(
        approval_id=f"portfolio-paper-order-approval-{normalized_batch_id}-{normalized_order_id}",
        base_run_id=normalized_base_run_id,
        batch_id=normalized_batch_id,
        order_id=normalized_order_id,
        reviewed_at=reviewed,
        approved=bool(approved),
        reviewer=normalized_reviewer,
        reason=normalized_reason,
    )


def portfolio_paper_order_approval_to_payload(approval: PortfolioPaperOrderApproval) -> dict[str, Any]:
    return {
        "approvalId": approval.approval_id,
        "baseRunId": approval.base_run_id,
        "batchId": approval.batch_id,
        "orderId": approval.order_id,
        "reviewedAt": approval.reviewed_at.isoformat(),
        "approved": approval.approved,
        "reviewer": approval.reviewer,
        "reason": approval.reason,
    }


def portfolio_paper_order_payload_to_approval(payload: dict[str, Any]) -> PortfolioPaperOrderApproval:
    return PortfolioPaperOrderApproval(
        approval_id=str(payload.get("approvalId") or ""),
        base_run_id=str(payload.get("baseRunId") or ""),
        batch_id=str(payload.get("batchId") or ""),
        order_id=str(payload.get("orderId") or ""),
        reviewed_at=_parse_payload_datetime(payload.get("reviewedAt"), "portfolio_paper_order_approval_reviewed_at_invalid"),
        approved=bool(payload.get("approved")),
        reviewer=str(payload.get("reviewer") or ""),
        reason=str(payload.get("reason") or ""),
    )


def _normalize_portfolio_paper_order_adapter_evidence(
    adapter_paper_execution_id: str,
    adapter_manifest_validation_id: str,
    adapter_paper_execution_evidence: dict[str, Any] | None,
    *,
    expected_symbol: str = "",
    expected_side: str = "",
    expected_quantity: float | None = None,
    expected_price: float | None = None,
    expected_notional: float | None = None,
) -> tuple[str, str, dict[str, Any]]:
    normalized_execution_id = str(adapter_paper_execution_id or "").strip()
    normalized_manifest_validation_id = str(adapter_manifest_validation_id or "").strip()
    normalized_expected_symbol = str(expected_symbol or "").strip()
    normalized_expected_side = str(expected_side or "").strip().lower()
    normalized_expected_quantity = _strict_positive_number(expected_quantity)
    normalized_expected_price = _strict_positive_number(expected_price)
    normalized_expected_notional = _strict_positive_number(expected_notional)
    redacted_evidence = _redact_secret_fields(
        adapter_paper_execution_evidence if isinstance(adapter_paper_execution_evidence, dict) else {}
    )
    evidence_execution_id = str(redacted_evidence.get("adapterPaperExecutionId") or "").strip()
    if evidence_execution_id:
        if normalized_execution_id and evidence_execution_id != normalized_execution_id:
            raise ValueError("portfolio_paper_order_simulation_adapter_execution_id_mismatch")
        normalized_execution_id = evidence_execution_id
    evidence_manifest_validation_id = str(
        redacted_evidence.get("adapterManifestValidationId") or redacted_evidence.get("manifestValidationId") or ""
    ).strip()
    if evidence_manifest_validation_id:
        if normalized_manifest_validation_id and evidence_manifest_validation_id != normalized_manifest_validation_id:
            raise ValueError("portfolio_paper_order_simulation_adapter_manifest_validation_id_mismatch")
        normalized_manifest_validation_id = evidence_manifest_validation_id
    if normalized_execution_id and not normalized_manifest_validation_id:
        raise ValueError("portfolio_paper_order_simulation_adapter_manifest_validation_id_required")
    evidence_event_type = str(redacted_evidence.get("eventType") or "").strip()
    if normalized_execution_id and evidence_event_type and evidence_event_type != "execution_adapter_paper_execution":
        raise ValueError("portfolio_paper_order_simulation_adapter_event_type_mismatch")
    evidence_status = str(redacted_evidence.get("status") or "").strip()
    if normalized_execution_id and evidence_status and evidence_status != "paper_execution_recorded":
        raise ValueError("portfolio_paper_order_simulation_adapter_paper_fill_not_recorded")
    evidence_paper_execution_mode = str(redacted_evidence.get("paperExecutionMode") or "").strip()
    if (
        normalized_execution_id
        and evidence_paper_execution_mode
        and evidence_paper_execution_mode != "manual_adapter_paper_execution"
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_paper_execution_mode_invalid")
    blocked_reasons = redacted_evidence.get("blockedReasons")
    if (
        normalized_execution_id
        and isinstance(blocked_reasons, list)
        and any(str(reason or "").strip() for reason in blocked_reasons)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_blocked_reasons_present")
    paper_execution_steps = redacted_evidence.get("paperExecutionSteps")
    if normalized_execution_id and isinstance(paper_execution_steps, list):
        step_entries = [step for step in paper_execution_steps if isinstance(step, dict)]
        for step in paper_execution_steps:
            if not isinstance(step, dict):
                continue
            step_status = str(step.get("status") or "").strip()
            if step_status and step_status != "recorded":
                raise ValueError("portfolio_paper_order_simulation_adapter_steps_not_recorded")
        if step_entries:
            expected_step_ids = {step["id"] for step in _execution_adapter_paper_execution_steps("recorded")}
            evidence_step_ids = {
                str(step.get("id") or "").strip()
                for step in step_entries
                if str(step.get("id") or "").strip()
            }
            if not expected_step_ids.issubset(evidence_step_ids):
                raise ValueError("portfolio_paper_order_simulation_adapter_steps_missing")
    required_confirmations = redacted_evidence.get("requiredConfirmations")
    if normalized_execution_id and isinstance(required_confirmations, list):
        confirmation_entries = [confirmation for confirmation in required_confirmations if isinstance(confirmation, dict)]
        for confirmation in required_confirmations:
            if not isinstance(confirmation, dict):
                continue
            confirmation_status = str(confirmation.get("status") or "").strip()
            if confirmation_status and confirmation_status != "confirmed":
                raise ValueError("portfolio_paper_order_simulation_adapter_confirmations_not_confirmed")
        if confirmation_entries:
            expected_confirmation_ids = {spec[0] for spec in _execution_adapter_paper_execution_specs()}
            evidence_confirmation_ids = {
                str(confirmation.get("id") or "").strip()
                for confirmation in confirmation_entries
                if str(confirmation.get("id") or "").strip()
            }
            if not expected_confirmation_ids.issubset(evidence_confirmation_ids):
                raise ValueError("portfolio_paper_order_simulation_adapter_confirmations_missing")
    if normalized_execution_id and redacted_evidence.get("paperFillRecorded") is False:
        raise ValueError("portfolio_paper_order_simulation_adapter_paper_fill_not_recorded")
    simulated_fill = redacted_evidence.get("simulatedFill")
    simulated_fill_status = (
        str(simulated_fill.get("status") or "").strip()
        if isinstance(simulated_fill, dict)
        else ""
    )
    if normalized_execution_id and simulated_fill_status and simulated_fill_status != "filled":
        raise ValueError("portfolio_paper_order_simulation_adapter_simulated_fill_not_filled")
    simulated_fill_symbol = (
        str(simulated_fill.get("symbol") or "").strip()
        if isinstance(simulated_fill, dict)
        else ""
    )
    order_intent = redacted_evidence.get("orderIntent")
    if normalized_execution_id and isinstance(order_intent, dict) and bool(order_intent.get("liveTradingAllowed")):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_live_trading_allowed")
    order_intent_symbol = (
        str(order_intent.get("symbol") or "").strip()
        if isinstance(order_intent, dict)
        else ""
    )
    if (
        normalized_execution_id
        and normalized_expected_symbol
        and order_intent_symbol
        and order_intent_symbol != normalized_expected_symbol
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_symbol_mismatch")
    evidence_symbol = str(
        redacted_evidence.get("simulatedSymbol") or redacted_evidence.get("symbol") or simulated_fill_symbol
    ).strip()
    if normalized_execution_id and normalized_expected_symbol and evidence_symbol and evidence_symbol != normalized_expected_symbol:
        raise ValueError("portfolio_paper_order_simulation_adapter_symbol_mismatch")
    simulated_fill_side = (
        str(simulated_fill.get("side") or "").strip().lower()
        if isinstance(simulated_fill, dict)
        else ""
    )
    order_intent_side = (
        str(order_intent.get("side") or "").strip().lower()
        if isinstance(order_intent, dict)
        else ""
    )
    if (
        normalized_execution_id
        and normalized_expected_side
        and order_intent_side
        and order_intent_side != normalized_expected_side
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_side_mismatch")
    evidence_side = str(
        redacted_evidence.get("simulatedSide") or redacted_evidence.get("side") or simulated_fill_side
    ).strip().lower()
    if normalized_execution_id and normalized_expected_side and evidence_side and evidence_side != normalized_expected_side:
        raise ValueError("portfolio_paper_order_simulation_adapter_side_mismatch")
    simulated_fill_quantity = (
        _strict_positive_number(simulated_fill.get("quantity"))
        if isinstance(simulated_fill, dict)
        else None
    )
    order_intent_quantity = (
        _strict_positive_number(order_intent.get("quantity"))
        if isinstance(order_intent, dict)
        else None
    )
    if (
        normalized_execution_id
        and normalized_expected_quantity is not None
        and order_intent_quantity is not None
        and not math.isclose(float(order_intent_quantity), float(normalized_expected_quantity), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_quantity_mismatch")
    evidence_quantity = _strict_positive_number(redacted_evidence.get("simulatedQuantity") or redacted_evidence.get("quantity"))
    if evidence_quantity is None:
        evidence_quantity = simulated_fill_quantity
    if (
        normalized_execution_id
        and normalized_expected_quantity is not None
        and evidence_quantity is not None
        and not math.isclose(float(evidence_quantity), float(normalized_expected_quantity), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_quantity_mismatch")
    simulated_fill_price = (
        _strict_positive_number(simulated_fill.get("price"))
        if isinstance(simulated_fill, dict)
        else None
    )
    order_intent_price = (
        _strict_positive_number(order_intent.get("price"))
        if isinstance(order_intent, dict)
        else None
    )
    if (
        normalized_execution_id
        and normalized_expected_price is not None
        and order_intent_price is not None
        and not math.isclose(float(order_intent_price), float(normalized_expected_price), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_price_mismatch")
    evidence_price = _strict_positive_number(
        redacted_evidence.get("simulatedPrice") or redacted_evidence.get("price") or redacted_evidence.get("fillPrice")
    )
    if evidence_price is None:
        evidence_price = simulated_fill_price
    if (
        normalized_execution_id
        and normalized_expected_price is not None
        and evidence_price is not None
        and not math.isclose(float(evidence_price), float(normalized_expected_price), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_price_mismatch")
    simulated_fill_notional = (
        _strict_positive_number(simulated_fill.get("notionalValue") or simulated_fill.get("notional"))
        if isinstance(simulated_fill, dict)
        else None
    )
    order_intent_notional = (
        _strict_positive_number(order_intent.get("notionalValue") or order_intent.get("notional"))
        if isinstance(order_intent, dict)
        else None
    )
    if (
        normalized_execution_id
        and normalized_expected_notional is not None
        and order_intent_notional is not None
        and not math.isclose(
            float(order_intent_notional),
            float(normalized_expected_notional),
            rel_tol=0.0,
            abs_tol=1e-6,
        )
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_intent_notional_mismatch")
    evidence_notional = _strict_positive_number(
        redacted_evidence.get("simulatedNotional")
        or redacted_evidence.get("notionalValue")
        or redacted_evidence.get("notional")
    )
    if evidence_notional is None:
        evidence_notional = simulated_fill_notional
    if (
        normalized_execution_id
        and normalized_expected_notional is not None
        and evidence_notional is not None
        and not math.isclose(float(evidence_notional), float(normalized_expected_notional), rel_tol=0.0, abs_tol=1e-6)
    ):
        raise ValueError("portfolio_paper_order_simulation_adapter_notional_mismatch")
    if normalized_execution_id and redacted_evidence.get("paperOnly") is False:
        raise ValueError("portfolio_paper_order_simulation_adapter_not_paper_only")
    if bool(redacted_evidence.get("orderSubmitted")):
        raise ValueError("portfolio_paper_order_simulation_adapter_order_submitted")
    if bool(redacted_evidence.get("liveOrderSubmitted")):
        raise ValueError("portfolio_paper_order_simulation_adapter_live_order_submitted")
    if bool(redacted_evidence.get("routeExecuted")):
        raise ValueError("portfolio_paper_order_simulation_adapter_route_executed")
    if bool(redacted_evidence.get("liveTradingAllowed")):
        raise ValueError("portfolio_paper_order_simulation_adapter_live_trading_allowed")
    return normalized_execution_id, normalized_manifest_validation_id, redacted_evidence


def create_portfolio_paper_order_simulation(
    *,
    batch: PortfolioPaperOrderBatch,
    lifecycle_row: dict[str, Any],
    existing_simulations: list[PortfolioPaperOrderSimulation] | None = None,
    route_risk: dict[str, Any] | None = None,
    adapter_paper_execution_id: str = "",
    adapter_manifest_validation_id: str = "",
    adapter_paper_execution_evidence: dict[str, Any] | None = None,
    simulated_at: datetime | str | None = None,
) -> PortfolioPaperOrderSimulation:
    order_id = str(lifecycle_row.get("orderId") or "").strip()
    if not order_id:
        raise ValueError("portfolio_paper_order_simulation_order_id_required")
    if str(lifecycle_row.get("batchId") or "") != batch.batch_id or str(lifecycle_row.get("baseRunId") or "") != batch.base_run_id:
        raise ValueError("portfolio_paper_order_simulation_lifecycle_context_mismatch")
    if str(lifecycle_row.get("state") or "") != "ready_for_simulation" or not bool(lifecycle_row.get("routable")):
        raise ValueError("portfolio_paper_order_simulation_requires_ready_order")
    side = str(lifecycle_row.get("side") or "")
    if side not in {"buy", "sell"}:
        raise ValueError("portfolio_paper_order_simulation_side_invalid")
    quantity = _strict_positive_number(lifecycle_row.get("quantity"))
    notional_value = _strict_positive_number(lifecycle_row.get("notionalValue"))
    if quantity is None or notional_value is None:
        raise ValueError("portfolio_paper_order_simulation_quantity_notional_required")
    route_guard = build_portfolio_paper_order_simulation_route_risk(
        lifecycle_row,
        base_run_id=batch.base_run_id,
        batch_id=batch.batch_id,
        existing_simulations=existing_simulations,
        route_risk=route_risk,
    )
    if route_guard["status"] == "blocked":
        raise ValueError(
            "portfolio_paper_order_simulation_route_risk_blocked:"
            + ",".join(str(reason) for reason in route_guard["blockedReasons"])
        )
    fill_price = round(notional_value / quantity, 6)
    (
        normalized_adapter_paper_execution_id,
        normalized_adapter_manifest_validation_id,
        normalized_adapter_paper_execution_evidence,
    ) = _normalize_portfolio_paper_order_adapter_evidence(
        adapter_paper_execution_id,
        adapter_manifest_validation_id,
        adapter_paper_execution_evidence,
        expected_symbol=str(lifecycle_row.get("symbol") or ""),
        expected_side=side,
        expected_quantity=quantity,
        expected_price=fill_price,
        expected_notional=notional_value,
    )
    simulated = (
        _parse_payload_datetime(simulated_at, "portfolio_paper_order_simulation_simulated_at_invalid")
        if simulated_at is not None
        else datetime.now(timezone.utc)
    )
    return PortfolioPaperOrderSimulation(
        simulation_id=f"portfolio-paper-order-simulation-{batch.batch_id}-{order_id}",
        base_run_id=batch.base_run_id,
        batch_id=batch.batch_id,
        order_id=order_id,
        simulated_at=simulated,
        mode="portfolio_paper_order_simulation",
        symbol=str(lifecycle_row.get("symbol") or ""),
        source_run_id=str(lifecycle_row.get("sourceRunId") or "").strip() or None,
        side=side,
        quantity=quantity,
        fill_price=fill_price,
        notional_value=notional_value,
        order_state="filled",
        fill_status="filled",
        reason="Paper-only simulation filled the approved portfolio order; live execution remains blocked.",
        approved_by=str(lifecycle_row.get("approvedBy") or "").strip() or None,
        route_risk=route_guard,
        adapter_paper_execution_id=normalized_adapter_paper_execution_id,
        adapter_manifest_validation_id=normalized_adapter_manifest_validation_id,
        adapter_paper_execution_evidence=normalized_adapter_paper_execution_evidence,
    )


def build_portfolio_paper_order_simulation_route_risk(
    lifecycle_row: dict[str, Any],
    *,
    base_run_id: str,
    batch_id: str,
    existing_simulations: list[PortfolioPaperOrderSimulation] | None = None,
    route_risk: dict[str, Any] | None = None,
) -> dict[str, Any]:
    controls = route_risk if isinstance(route_risk, dict) else {}
    initial_cash = _positive_number(controls.get("initialCash"), 100_000)
    min_cash_after = _positive_number(controls.get("minCashAfter"), 0)
    max_symbol_notional = _strict_positive_number(controls.get("maxSymbolNotional"))
    max_batch_notional = _strict_positive_number(controls.get("maxBatchNotional"))
    side = str(lifecycle_row.get("side") or "")
    symbol = str(lifecycle_row.get("symbol") or "")
    order_id = str(lifecycle_row.get("orderId") or "")
    quantity = _positive_number(lifecycle_row.get("quantity"), 0)
    notional_value = _positive_number(lifecycle_row.get("notionalValue"), 0)
    existing = [
        simulation
        for simulation in existing_simulations or []
        if simulation.base_run_id == base_run_id
        and simulation.order_state == "filled"
        and simulation.fill_status == "filled"
    ]
    replay = build_portfolio_paper_order_replay(existing, base_run_id=base_run_id, initial_cash=initial_cash)
    cash_before = _positive_number(replay.get("account", {}).get("cash"), initial_cash)
    cash_after = cash_before - notional_value if side == "buy" else cash_before + notional_value
    replay_positions = replay.get("account", {}).get("positions", {})
    symbol_position_before = _positive_number(
        replay_positions.get(symbol) if isinstance(replay_positions, dict) else 0,
        0,
    )
    symbol_position_after = symbol_position_before + quantity if side == "buy" else symbol_position_before - quantity
    existing_symbol_notional = sum(
        simulation.notional_value
        for simulation in existing
        if simulation.symbol == symbol and simulation.side == side
    )
    existing_batch_notional = sum(
        simulation.notional_value
        for simulation in existing
        if simulation.batch_id == batch_id
    )
    symbol_notional_after = existing_symbol_notional + notional_value
    batch_notional_after = existing_batch_notional + notional_value
    checks = [
        {
            "id": "cash_after_below_minimum",
            "label": "Cash after route",
            "passed": side != "buy" or cash_after >= min_cash_after,
            "value": _round_number(cash_after),
            "limit": _round_number(min_cash_after),
        },
        {
            "id": "insufficient_symbol_position",
            "label": "Sell position coverage",
            "passed": side != "sell" or quantity <= symbol_position_before,
            "value": _round_number(quantity),
            "limit": _round_number(symbol_position_before),
        },
        {
            "id": "symbol_notional_limit_exceeded",
            "label": "Symbol notional limit",
            "passed": max_symbol_notional is None or symbol_notional_after <= max_symbol_notional,
            "value": _round_number(symbol_notional_after),
            "limit": _round_number(max_symbol_notional or 0),
        },
        {
            "id": "batch_notional_limit_exceeded",
            "label": "Batch notional limit",
            "passed": max_batch_notional is None or batch_notional_after <= max_batch_notional,
            "value": _round_number(batch_notional_after),
            "limit": _round_number(max_batch_notional or 0),
        },
    ]
    blocked_reasons = [str(check["id"]) for check in checks if not bool(check["passed"])]
    return {
        "schemaVersion": 1,
        "mode": "portfolio_paper_simulation_route_guard",
        "status": "blocked" if blocked_reasons else "passed",
        "baseRunId": base_run_id,
        "batchId": batch_id,
        "orderId": order_id,
        "symbol": symbol,
        "side": side,
        "orderNotional": _round_number(notional_value),
        "cashBefore": _round_number(cash_before),
        "cashAfter": _round_number(cash_after),
        "symbolPositionBefore": _round_number(symbol_position_before),
        "symbolPositionAfter": _round_number(symbol_position_after),
        "symbolNotionalAfter": _round_number(symbol_notional_after),
        "batchNotionalAfter": _round_number(batch_notional_after),
        "limits": {
            "initialCash": _round_number(initial_cash),
            "minCashAfter": _round_number(min_cash_after),
            "maxSymbolNotional": _round_number(max_symbol_notional or 0),
            "maxBatchNotional": _round_number(max_batch_notional or 0),
        },
        "checks": checks,
        "blockedReasons": blocked_reasons,
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def portfolio_paper_order_simulation_to_payload(simulation: PortfolioPaperOrderSimulation) -> dict[str, Any]:
    return {
        "simulationId": simulation.simulation_id,
        "baseRunId": simulation.base_run_id,
        "batchId": simulation.batch_id,
        "orderId": simulation.order_id,
        "simulatedAt": simulation.simulated_at.isoformat(),
        "mode": simulation.mode,
        "symbol": simulation.symbol,
        "sourceRunId": simulation.source_run_id,
        "side": simulation.side,
        "quantity": simulation.quantity,
        "fillPrice": simulation.fill_price,
        "notionalValue": simulation.notional_value,
        "orderState": simulation.order_state,
        "fillStatus": simulation.fill_status,
        "reason": simulation.reason,
        "approvedBy": simulation.approved_by,
        "routeRisk": simulation.route_risk,
        "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
        "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
        "adapterPaperExecutionEvidence": simulation.adapter_paper_execution_evidence,
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def portfolio_paper_order_payload_to_simulation(payload: dict[str, Any]) -> PortfolioPaperOrderSimulation:
    return PortfolioPaperOrderSimulation(
        simulation_id=str(payload.get("simulationId") or ""),
        base_run_id=str(payload.get("baseRunId") or ""),
        batch_id=str(payload.get("batchId") or ""),
        order_id=str(payload.get("orderId") or ""),
        simulated_at=_parse_payload_datetime(
            payload.get("simulatedAt"),
            "portfolio_paper_order_simulation_simulated_at_invalid",
        ),
        mode=str(payload.get("mode") or "portfolio_paper_order_simulation"),
        symbol=str(payload.get("symbol") or ""),
        source_run_id=str(payload.get("sourceRunId") or "").strip() or None,
        side=str(payload.get("side") or ""),
        quantity=_positive_number(payload.get("quantity"), 0),
        fill_price=_positive_number(payload.get("fillPrice"), 0),
        notional_value=_positive_number(payload.get("notionalValue"), 0),
        order_state=str(payload.get("orderState") or ""),
        fill_status=str(payload.get("fillStatus") or ""),
        reason=str(payload.get("reason") or ""),
        approved_by=str(payload.get("approvedBy") or "").strip() or None,
        route_risk=payload.get("routeRisk") if isinstance(payload.get("routeRisk"), dict) else {},
        adapter_paper_execution_id=str(payload.get("adapterPaperExecutionId") or "").strip(),
        adapter_manifest_validation_id=str(payload.get("adapterManifestValidationId") or "").strip(),
        adapter_paper_execution_evidence=_redact_secret_fields(
            payload.get("adapterPaperExecutionEvidence")
            if isinstance(payload.get("adapterPaperExecutionEvidence"), dict)
            else {}
        ),
    )


def build_portfolio_paper_order_replay(
    simulations: list[PortfolioPaperOrderSimulation],
    *,
    base_run_id: str,
    initial_cash: float = 100_000,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    normalized_base_run_id = str(base_run_id or "").strip()
    if not normalized_base_run_id:
        raise ValueError("portfolio_paper_order_replay_base_run_id_required")
    cash = _positive_number(initial_cash, 100_000)
    starting_cash = cash
    positions: dict[str, float] = {}
    avg_costs: dict[str, float] = {}
    last_prices: dict[str, float] = {}
    orders: list[dict[str, Any]] = []
    warnings: list[str] = []
    buy_notional = 0.0
    sell_notional = 0.0
    realized_pnl = 0.0
    replay_simulations = sorted(
        [simulation for simulation in simulations if simulation.base_run_id == normalized_base_run_id],
        key=lambda simulation: (simulation.simulated_at, simulation.batch_id, simulation.order_id),
    )

    for simulation in replay_simulations:
        symbol = simulation.symbol
        quantity = _positive_number(simulation.quantity, 0)
        fill_price = _positive_number(simulation.fill_price, 0)
        notional_value = _positive_number(simulation.notional_value, quantity * fill_price)
        replay_state = "applied"
        if simulation.fill_status != "filled" or simulation.order_state != "filled" or quantity <= 0 or fill_price <= 0:
            replay_state = "ignored"
            warnings.append(f"{simulation.order_id}:ignored_non_filled_simulation")
        elif simulation.side == "buy":
            previous_quantity = positions.get(symbol, 0.0)
            previous_cost = avg_costs.get(symbol, fill_price)
            new_quantity = previous_quantity + quantity
            avg_costs[symbol] = (
                ((previous_quantity * previous_cost) + notional_value) / new_quantity if new_quantity else fill_price
            )
            positions[symbol] = new_quantity
            cash -= notional_value
            buy_notional += notional_value
        elif simulation.side == "sell":
            previous_quantity = positions.get(symbol, 0.0)
            previous_cost = avg_costs.get(symbol, fill_price)
            if quantity > previous_quantity:
                warnings.append(f"{simulation.order_id}:sell_exceeds_replayed_position")
            realized_quantity = min(quantity, max(previous_quantity, 0.0))
            realized_pnl += (fill_price - previous_cost) * realized_quantity
            new_quantity = previous_quantity - quantity
            positions[symbol] = new_quantity
            if new_quantity <= 0:
                avg_costs.pop(symbol, None)
            cash += notional_value
            sell_notional += notional_value
        else:
            replay_state = "ignored"
            warnings.append(f"{simulation.order_id}:unsupported_side")
        if symbol:
            last_prices[symbol] = fill_price
        orders.append(
            {
                "simulationId": simulation.simulation_id,
                "batchId": simulation.batch_id,
                "orderId": simulation.order_id,
                "simulatedAt": simulation.simulated_at.isoformat(),
                "symbol": symbol,
                "side": simulation.side,
                "quantity": _round_number(quantity),
                "fillPrice": _round_number(fill_price),
                "notionalValue": _round_number(notional_value),
                "cashAfter": _round_number(cash),
                "positionAfter": _round_number(positions.get(symbol, 0.0)),
                "replayState": replay_state,
                "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
                "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
                "adapterPaperExecutionEvidence": _redact_secret_fields(simulation.adapter_paper_execution_evidence),
                "paperOnly": True,
                "liveExecutionBlocked": True,
            }
        )

    position_rows = []
    account_positions: dict[str, float] = {}
    for symbol in sorted(positions):
        quantity = positions[symbol]
        if abs(quantity) < 1e-9:
            continue
        last_price = last_prices.get(symbol, avg_costs.get(symbol, 0.0))
        avg_cost = avg_costs.get(symbol, last_price)
        market_value = quantity * last_price
        unrealized_pnl = (last_price - avg_cost) * quantity
        account_positions[symbol] = _round_number(quantity)
        position_rows.append(
            {
                "symbol": symbol,
                "quantity": _round_number(quantity),
                "avgCost": _round_number(avg_cost),
                "lastPrice": _round_number(last_price),
                "marketValue": _round_number(market_value),
                "unrealizedPnl": _round_number(unrealized_pnl),
            }
        )
    equity = cash + sum(row["marketValue"] for row in position_rows)
    return {
        "schemaVersion": 1,
        "baseRunId": normalized_base_run_id,
        "generatedAt": (generated_at or datetime.now(timezone.utc)).isoformat(),
        "mode": "portfolio_paper_order_replay",
        "initialCash": _round_number(starting_cash),
        "account": {
            "cash": _round_number(cash),
            "positions": account_positions,
            "equity": _round_number(equity),
        },
        "positions": position_rows,
        "orders": orders,
        "summary": {
            "filledOrders": sum(1 for order in orders if order["replayState"] == "applied"),
            "buyNotional": _round_number(buy_notional),
            "sellNotional": _round_number(sell_notional),
            "netNotional": _round_number(buy_notional - sell_notional),
            "realizedPnl": _round_number(realized_pnl),
            "unrealizedPnl": _round_number(sum(row["unrealizedPnl"] for row in position_rows)),
            "positionCount": len(position_rows),
            "warnings": warnings,
        },
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def build_portfolio_paper_order_state_history(
    batch: PortfolioPaperOrderBatch,
    *,
    approvals: list[PortfolioPaperOrderApproval] | None = None,
    simulations: list[PortfolioPaperOrderSimulation] | None = None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    filtered_approvals = [
        approval
        for approval in approvals or []
        if approval.base_run_id == batch.base_run_id and approval.batch_id == batch.batch_id
    ]
    filtered_simulations = [
        simulation
        for simulation in simulations or []
        if simulation.base_run_id == batch.base_run_id and simulation.batch_id == batch.batch_id
    ]
    approval_map = {approval.order_id: approval for approval in sorted(filtered_approvals, key=lambda item: item.reviewed_at)}
    simulation_map = {
        simulation.order_id: simulation
        for simulation in sorted(filtered_simulations, key=lambda item: (item.simulated_at, item.simulation_id))
    }
    lifecycle_rows = build_portfolio_paper_order_lifecycle(
        batch,
        approvals=portfolio_paper_order_approvals_to_map(filtered_approvals),
    )
    lifecycle_map = {str(row.get("orderId") or ""): row for row in lifecycle_rows}

    order_histories: list[dict[str, Any]] = []
    state_counts: list[str] = []
    approved_orders = 0
    rejected_orders = 0
    filled_orders = 0
    live_blocked_events = 0
    total_events = 0

    for order in batch.orders:
        order_id = str(order.get("orderId") or "")
        lifecycle_row = lifecycle_map.get(order_id, {})
        approval = approval_map.get(order_id)
        simulation = simulation_map.get(order_id)
        events = [
            _portfolio_paper_order_state_event(
                batch=batch,
                order_id=order_id,
                state="created",
                timestamp=str(order.get("timestamp") or batch.created_at.isoformat()),
                label="Paper order created",
                actor=batch.source,
                source=batch.source,
                reason=str(order.get("reason") or "Portfolio paper order candidate was generated."),
                sequence=1,
            )
        ]
        lifecycle_state = str(lifecycle_row.get("state") or "unknown")

        if lifecycle_state in {"risk_rejected", "risk_review", "invalid_order", "skipped"}:
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state=lifecycle_state,
                    timestamp=str(order.get("timestamp") or batch.created_at.isoformat()),
                    label=_portfolio_paper_order_state_label(lifecycle_state),
                    actor="risk" if lifecycle_state in {"risk_rejected", "risk_review"} else "portfolio-engine",
                    source="portfolio-order-lifecycle",
                    reason=str(lifecycle_row.get("reason") or order.get("reason") or ""),
                    sequence=2,
                )
            )

        if approval is not None:
            approved_orders += 1 if approval.approved else 0
            rejected_orders += 0 if approval.approved else 1
            approval_state = "operator_approved" if approval.approved else "operator_rejected"
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state=approval_state,
                    timestamp=approval.reviewed_at.isoformat(),
                    label=_portfolio_paper_order_state_label(approval_state),
                    actor=approval.reviewer,
                    source="operator-review",
                    reason=approval.reason,
                    sequence=3,
                )
            )

        if simulation is not None:
            filled_orders += 1 if simulation.fill_status == "filled" and simulation.order_state == "filled" else 0
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state="simulation_filled" if simulation.fill_status == "filled" else "simulation_recorded",
                    timestamp=simulation.simulated_at.isoformat(),
                    label=_portfolio_paper_order_state_label("simulation_filled"),
                    actor=simulation.approved_by or "paper-simulator",
                    source="paper-simulator",
                    reason=simulation.reason,
                    sequence=4,
                    metadata={
                        "simulationId": simulation.simulation_id,
                        "fillPrice": _round_number(simulation.fill_price),
                        "fillStatus": simulation.fill_status,
                        "orderState": simulation.order_state,
                        "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
                        "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
                        "adapterPaperExecutionEvidence": _redact_secret_fields(
                            simulation.adapter_paper_execution_evidence
                        ),
                    },
                )
            )
            events.append(
                _portfolio_paper_order_state_event(
                    batch=batch,
                    order_id=order_id,
                    state="live_blocked",
                    timestamp=simulation.simulated_at.isoformat(),
                    label=_portfolio_paper_order_state_label("live_blocked"),
                    actor="execution-guard",
                    source="live-route-guard",
                    reason="Live execution remains blocked; this timeline records paper-only simulation evidence.",
                    sequence=5,
                )
            )

        events.sort(key=lambda event: (str(event.get("timestamp") or ""), int(event.get("sequence") or 0)))
        for event in events:
            event.pop("sequence", None)
        current_state = str(events[-1].get("state") or lifecycle_state) if events else lifecycle_state
        if current_state == "created":
            current_state = lifecycle_state
        if current_state in {"risk_rejected", "operator_rejected", "invalid_order"}:
            rejected_orders += 1 if current_state != "operator_rejected" else 0
        live_blocked_events += sum(1 for event in events if event.get("state") == "live_blocked")
        total_events += len(events)
        state_counts.append(current_state)
        order_histories.append(
            {
                "batchId": batch.batch_id,
                "baseRunId": batch.base_run_id,
                "portfolioName": batch.portfolio_name,
                "orderId": order_id,
                "symbol": str(order.get("symbol") or ""),
                "sourceRunId": order.get("sourceRunId"),
                "side": str(order.get("side") or ""),
                "quantity": _round_number(order.get("quantity")),
                "notionalValue": _round_number(order.get("notionalValue")),
                "originalStatus": str(order.get("status") or ""),
                "riskStatus": str(order.get("riskStatus") or ""),
                "currentState": current_state,
                "currentStateLabel": _portfolio_paper_order_state_label(current_state),
                "events": events,
                "paperOnly": True,
                "liveExecutionBlocked": True,
            }
        )

    return {
        "schemaVersion": 1,
        "baseRunId": batch.base_run_id,
        "batchId": batch.batch_id,
        "portfolioName": batch.portfolio_name,
        "generatedAt": (generated_at or datetime.now(timezone.utc)).isoformat(),
        "mode": "portfolio_paper_order_state_history",
        "summary": {
            "orderCount": len(order_histories),
            "eventCount": total_events,
            "approvedOrders": approved_orders,
            "rejectedOrders": rejected_orders,
            "filledOrders": filled_orders,
            "liveBlockedEvents": live_blocked_events,
            "stateCounts": _sorted_counts(state_counts),
        },
        "orders": order_histories,
        "paperOnly": True,
        "liveExecutionBlocked": True,
    }


def create_execution_adapter_certification_run(
    *,
    adapter_id: str,
    market: str,
    route: str,
    operator: str = "local-operator",
    checks: list[dict[str, Any]] | None = None,
    metadata: dict[str, Any] | None = None,
    started_at: datetime | str | None = None,
    completed_at: datetime | str | None = None,
    certification_id: str | None = None,
) -> ExecutionAdapterCertificationRun:
    normalized_adapter_id = str(adapter_id or "").strip()
    normalized_market = str(market or "").strip()
    normalized_route = _enum_value(route, {"paper", "live"}, "execution_adapter_certification_route_invalid")
    if not normalized_adapter_id:
        raise ValueError("execution_adapter_certification_adapter_id_required")
    if not normalized_market:
        raise ValueError("execution_adapter_certification_market_required")
    normalized_checks = _normalize_execution_adapter_certification_checks(checks or [])
    status = _execution_adapter_certification_status(normalized_checks)
    started = _coerce_optional_datetime(
        started_at,
        error_code="execution_adapter_certification_started_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    completed = _coerce_optional_datetime(
        completed_at,
        error_code="execution_adapter_certification_completed_at_invalid",
        fallback=None,
    )
    summary = {
        "checkCount": len(normalized_checks),
        "checkStatusCounts": _sorted_counts(str(check.get("status") or "") for check in normalized_checks),
        "passedChecks": sum(1 for check in normalized_checks if check.get("status") == "passed"),
        "blockedChecks": sum(1 for check in normalized_checks if check.get("status") == "blocked"),
        "failedChecks": sum(1 for check in normalized_checks if check.get("status") == "failed"),
        "reviewChecks": sum(1 for check in normalized_checks if check.get("status") == "review"),
    }
    return ExecutionAdapterCertificationRun(
        certification_id=str(certification_id or f"adapter-certification-{uuid4()}"),
        adapter_id=normalized_adapter_id,
        market=normalized_market,
        route=normalized_route,
        status=status,
        operator=str(operator or "local-operator").strip() or "local-operator",
        started_at=started,
        completed_at=completed,
        checks=normalized_checks,
        metadata=_redact_secret_fields(metadata or {}),
        summary=summary,
        live_trading_allowed=False,
    )


def execution_adapter_certification_to_payload(run: ExecutionAdapterCertificationRun) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "certificationId": run.certification_id,
        "adapterId": run.adapter_id,
        "market": run.market,
        "route": run.route,
        "status": run.status,
        "operator": run.operator,
        "startedAt": run.started_at.isoformat(),
        "completedAt": run.completed_at.isoformat() if run.completed_at else None,
        "checks": run.checks,
        "metadata": run.metadata,
        "summary": run.summary,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_certification_to_audit_event_payload(run: ExecutionAdapterCertificationRun) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": run.certification_id,
        "eventType": "execution_adapter_certification",
        "runId": "",
        "createdAt": (run.completed_at or run.started_at).isoformat(),
        "stage": "execution-adapter-certification",
        "source": "execution-adapter-ledger",
        "summary": f"{run.adapter_id} certification recorded as {run.status}.",
        "detail": "Adapter certification evidence is stored without secrets and live trading remains blocked.",
        "metadata": {
            "certificationId": run.certification_id,
            "adapterId": run.adapter_id,
            "market": run.market,
            "route": run.route,
            "status": run.status,
            "operator": run.operator,
            "startedAt": run.started_at.isoformat(),
            "completedAt": run.completed_at.isoformat() if run.completed_at else None,
            "checkStatusCounts": dict(run.summary.get("checkStatusCounts", {})),
            "checkCount": run.summary.get("checkCount", 0),
            "liveTradingAllowed": False,
            "paperOnly": True,
        },
    }


def build_execution_adapter_certification_apply(
    certification: ExecutionAdapterCertificationRun,
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    generated_at: datetime | str | None = None,
    apply_id: str | None = None,
) -> ExecutionAdapterCertificationApplyResult:
    if not isinstance(confirmations, dict):
        confirmations = {}
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_certification_apply_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if certification.route != "live":
        blocked_reasons.append("certification_route_not_live")
    if certification.status != "passed":
        blocked_reasons.append("certification_not_passed")

    generated = _coerce_optional_datetime(
        generated_at,
        error_code="execution_adapter_certification_apply_generated_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterCertificationApplyResult(
        apply_id=str(apply_id or f"execution-adapter-certification-apply-{certification.certification_id}-{uuid4()}"),
        certification_id=certification.certification_id,
        adapter_id=certification.adapter_id,
        market=certification.market,
        route=certification.route,
        status="blocked" if unique_blocked_reasons else "ready_for_restart",
        operator=str(operator or "local-operator").strip() or "local-operator",
        generated_at=generated or datetime.now(timezone.utc),
        apply_mode="manual_secret_store",
        restart_required=True,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_certification_apply_to_payload(result: ExecutionAdapterCertificationApplyResult) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "applyId": result.apply_id,
        "certificationId": result.certification_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "generatedAt": result.generated_at.isoformat(),
        "applyMode": result.apply_mode,
        "restartRequired": result.restart_required,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_certification_apply_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_certification_apply":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    apply_id = str(metadata.get("applyId") or getattr(event, "event_id", "")).strip()
    certification_id = str(metadata.get("certificationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    if not apply_id or not certification_id or not adapter_id or not market:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "ready_for_restart"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_certification_apply_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    generated_at = getattr(event, "created_at", None)
    if isinstance(generated_at, datetime):
        generated_at_value = generated_at.isoformat()
    else:
        generated_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "applyId": apply_id,
        "certificationId": certification_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "generatedAt": generated_at_value,
        "applyMode": str(metadata.get("applyMode") or "manual_secret_store"),
        "restartRequired": bool(metadata.get("restartRequired", True)),
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_certification_apply_to_audit_event_payload(
    result: ExecutionAdapterCertificationApplyResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.apply_id,
        "eventType": "execution_adapter_certification_apply",
        "runId": "",
        "createdAt": result.generated_at.isoformat(),
        "stage": "execution-adapter-certification-apply",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} certification apply preflight recorded as {result.status}.",
        "detail": "Certification apply preflight records manual secret-store and restart confirmations without secrets or live trading.",
        "metadata": _redact_secret_fields(
            {
                "applyId": result.apply_id,
                "certificationId": result.certification_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "applyMode": result.apply_mode,
                "restartRequired": result.restart_required,
                "blockedReasons": list(result.blocked_reasons),
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_certification_apply_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "secret-reference-stored",
            "secretReferenceStored",
            "Secret-store reference is saved outside the UI",
            "secret_reference_not_confirmed",
        ),
        (
            "controlled-restart-window-approved",
            "controlledRestartWindowApproved",
            "Controlled restart window is approved",
            "controlled_restart_not_confirmed",
        ),
        (
            "operator-reviewed-certification",
            "operatorReviewedCertification",
            "Operator reviewed certification evidence and restart impact",
            "operator_review_not_confirmed",
        ),
    ]


def build_execution_adapter_controlled_restart_evidence(
    certification_apply: dict[str, Any],
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    evidence_id: str | None = None,
) -> ExecutionAdapterControlledRestartEvidenceResult:
    if not isinstance(certification_apply, dict):
        raise ValueError("execution_adapter_certification_apply_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    apply_id = str(certification_apply.get("applyId") or "").strip()
    certification_id = str(certification_apply.get("certificationId") or "").strip()
    adapter_id = str(certification_apply.get("adapterId") or "").strip()
    market = str(certification_apply.get("market") or "").strip()
    route = str(certification_apply.get("route") or "").strip()
    if not apply_id:
        raise ValueError("execution_adapter_certification_apply_id_required")
    if not certification_id:
        raise ValueError("execution_adapter_certification_id_required")
    if not adapter_id:
        raise ValueError("execution_adapter_certification_adapter_id_required")
    if not market:
        raise ValueError("execution_adapter_certification_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_certification_route_invalid")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_controlled_restart_evidence_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(certification_apply.get("status") or "") != "ready_for_restart":
        blocked_reasons.append("certification_apply_not_ready_for_restart")
    if route != "live":
        blocked_reasons.append("certification_apply_route_not_live")
    restart_required = bool(certification_apply.get("restartRequired", True))
    if not restart_required:
        blocked_reasons.append("controlled_restart_not_required")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_controlled_restart_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterControlledRestartEvidenceResult(
        evidence_id=str(evidence_id or f"execution-adapter-controlled-restart-{apply_id}-{uuid4()}"),
        apply_id=apply_id,
        certification_id=certification_id,
        adapter_id=adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "evidence_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        evidence_mode="manual_controlled_restart",
        restart_required=restart_required,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_controlled_restart_evidence_to_payload(
    result: ExecutionAdapterControlledRestartEvidenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "evidenceId": result.evidence_id,
        "applyId": result.apply_id,
        "certificationId": result.certification_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "evidenceMode": result.evidence_mode,
        "restartRequired": result.restart_required,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_controlled_restart_evidence_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_controlled_restart_evidence":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    evidence_id = str(metadata.get("evidenceId") or getattr(event, "event_id", "")).strip()
    apply_id = str(metadata.get("applyId") or "").strip()
    certification_id = str(metadata.get("certificationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    if not evidence_id or not apply_id or not certification_id or not adapter_id or not market:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "evidence_recorded"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_controlled_restart_evidence_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "evidenceId": evidence_id,
        "applyId": apply_id,
        "certificationId": certification_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "evidenceMode": str(metadata.get("evidenceMode") or "manual_controlled_restart"),
        "restartRequired": bool(metadata.get("restartRequired", True)),
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_controlled_restart_evidence_to_audit_event_payload(
    result: ExecutionAdapterControlledRestartEvidenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.evidence_id,
        "eventType": "execution_adapter_controlled_restart_evidence",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-controlled-restart",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} controlled restart evidence recorded as {result.status}.",
        "detail": "Controlled restart evidence is an operator-reviewed paper-only ledger entry; live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "evidenceId": result.evidence_id,
                "applyId": result.apply_id,
                "certificationId": result.certification_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "evidenceMode": result.evidence_mode,
                "restartRequired": result.restart_required,
                "blockedReasons": list(result.blocked_reasons),
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_controlled_restart_evidence_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "restart-window-executed",
            "restartWindowExecuted",
            "Controlled restart window was executed",
            "restart_window_not_confirmed",
        ),
        (
            "rollback-plan-confirmed",
            "rollbackPlanConfirmed",
            "Rollback plan is available and confirmed",
            "rollback_plan_not_confirmed",
        ),
        (
            "post-restart-validation-passed",
            "postRestartValidationPassed",
            "Post-restart validation passed",
            "post_restart_validation_not_confirmed",
        ),
        (
            "operator-reviewed-restart-logs",
            "operatorReviewedRestartLogs",
            "Operator reviewed restart logs and adapter status",
            "restart_logs_not_confirmed",
        ),
    ]


def build_execution_adapter_restart_acceptance(
    controlled_restart_evidence: dict[str, Any],
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    acceptance_id: str | None = None,
) -> ExecutionAdapterRestartAcceptanceResult:
    if not isinstance(controlled_restart_evidence, dict):
        raise ValueError("execution_adapter_controlled_restart_evidence_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    evidence_id = str(controlled_restart_evidence.get("evidenceId") or "").strip()
    apply_id = str(controlled_restart_evidence.get("applyId") or "").strip()
    certification_id = str(controlled_restart_evidence.get("certificationId") or "").strip()
    adapter_id = str(controlled_restart_evidence.get("adapterId") or "").strip()
    market = str(controlled_restart_evidence.get("market") or "").strip()
    route = str(controlled_restart_evidence.get("route") or "").strip()
    if not evidence_id:
        raise ValueError("execution_adapter_controlled_restart_evidence_id_required")
    if not apply_id:
        raise ValueError("execution_adapter_certification_apply_id_required")
    if not certification_id:
        raise ValueError("execution_adapter_certification_id_required")
    if not adapter_id:
        raise ValueError("execution_adapter_certification_adapter_id_required")
    if not market:
        raise ValueError("execution_adapter_certification_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_certification_route_invalid")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_restart_acceptance_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(controlled_restart_evidence.get("status") or "") != "evidence_recorded":
        blocked_reasons.append("controlled_restart_evidence_not_recorded")
    if route != "live":
        blocked_reasons.append("controlled_restart_evidence_route_not_live")
    restart_required = bool(controlled_restart_evidence.get("restartRequired", True))
    if not restart_required:
        blocked_reasons.append("controlled_restart_not_required")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_restart_acceptance_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterRestartAcceptanceResult(
        acceptance_id=str(acceptance_id or f"execution-adapter-restart-acceptance-{evidence_id}-{uuid4()}"),
        evidence_id=evidence_id,
        apply_id=apply_id,
        certification_id=certification_id,
        adapter_id=adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "acceptance_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        acceptance_mode="manual_post_restart_acceptance",
        restart_required=restart_required,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_restart_acceptance_to_payload(
    result: ExecutionAdapterRestartAcceptanceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "acceptanceId": result.acceptance_id,
        "evidenceId": result.evidence_id,
        "applyId": result.apply_id,
        "certificationId": result.certification_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "acceptanceMode": result.acceptance_mode,
        "restartRequired": result.restart_required,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_restart_acceptance_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_restart_acceptance":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    acceptance_id = str(metadata.get("acceptanceId") or getattr(event, "event_id", "")).strip()
    evidence_id = str(metadata.get("evidenceId") or "").strip()
    apply_id = str(metadata.get("applyId") or "").strip()
    certification_id = str(metadata.get("certificationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    if not acceptance_id or not evidence_id or not apply_id or not certification_id or not adapter_id or not market:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "acceptance_recorded"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_restart_acceptance_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "acceptanceId": acceptance_id,
        "evidenceId": evidence_id,
        "applyId": apply_id,
        "certificationId": certification_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "acceptanceMode": str(metadata.get("acceptanceMode") or "manual_post_restart_acceptance"),
        "restartRequired": bool(metadata.get("restartRequired", True)),
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_restart_acceptance_to_audit_event_payload(
    result: ExecutionAdapterRestartAcceptanceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.acceptance_id,
        "eventType": "execution_adapter_restart_acceptance",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-restart-acceptance",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} restart acceptance recorded as {result.status}.",
        "detail": "Post-restart acceptance is a paper-only operator ledger entry; live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "acceptanceId": result.acceptance_id,
                "evidenceId": result.evidence_id,
                "applyId": result.apply_id,
                "certificationId": result.certification_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "acceptanceMode": result.acceptance_mode,
                "restartRequired": result.restart_required,
                "blockedReasons": list(result.blocked_reasons),
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_restart_acceptance_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "core-health-checked",
            "coreHealthChecked",
            "Local core health was checked after restart",
            "local_core_health_not_confirmed",
        ),
        (
            "settings-reload-observed",
            "settingsReloadObserved",
            "Adapter settings reload was observed",
            "settings_reload_not_confirmed",
        ),
        (
            "paper-route-handshake-passed",
            "paperRouteHandshakePassed",
            "Sandbox or paper route handshake passed",
            "paper_route_handshake_not_confirmed",
        ),
        (
            "emergency-stop-armed",
            "emergencyStopArmed",
            "Emergency stop remains armed",
            "emergency_stop_not_confirmed",
        ),
        (
            "account-sync-dry-run-passed",
            "accountSyncDryRunPassed",
            "Account sync dry-run passed",
            "account_sync_dry_run_not_confirmed",
        ),
    ]


def build_execution_adapter_secret_reference(
    *,
    adapter_id: str,
    market: str,
    route: str,
    reference_name: str,
    backend: str,
    required_env_vars: list[Any] | None = None,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    reference_id: str | None = None,
) -> ExecutionAdapterSecretReferenceResult:
    normalized_adapter_id = str(adapter_id or "").strip()
    normalized_market = str(market or "").strip()
    normalized_route = _enum_value(route, {"paper", "live"}, "execution_adapter_secret_reference_route_invalid")
    normalized_reference_name = str(reference_name or "").strip()
    normalized_backend = str(backend or "").strip()
    if not normalized_adapter_id:
        raise ValueError("execution_adapter_secret_reference_adapter_id_required")
    if not normalized_market:
        raise ValueError("execution_adapter_secret_reference_market_required")
    if not normalized_reference_name:
        raise ValueError("execution_adapter_secret_reference_name_required")
    if not normalized_backend:
        raise ValueError("execution_adapter_secret_reference_backend_required")
    normalized_env_vars = [
        str(item).strip()
        for item in (required_env_vars or [])
        if str(item or "").strip()
    ]
    if not normalized_env_vars:
        raise ValueError("execution_adapter_secret_reference_required_env_vars_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_secret_reference_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if normalized_route != "live":
        blocked_reasons.append("secret_reference_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_secret_reference_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSecretReferenceResult(
        reference_id=str(reference_id or f"execution-adapter-secret-reference-{normalized_adapter_id}-{uuid4()}"),
        adapter_id=normalized_adapter_id,
        market=normalized_market,
        route=normalized_route,
        status="blocked" if unique_blocked_reasons else "reference_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        reference_name=normalized_reference_name,
        backend=normalized_backend,
        required_env_vars=normalized_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_secret_reference_to_payload(
    result: ExecutionAdapterSecretReferenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "referenceId": result.reference_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "referenceName": result.reference_name,
        "backend": result.backend,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_reference_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_secret_reference":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    reference_id = str(metadata.get("referenceId") or getattr(event, "event_id", "")).strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    reference_name = str(metadata.get("referenceName") or "").strip()
    backend = str(metadata.get("backend") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not reference_id or not adapter_id or not market or not reference_name or not backend or not required_env_vars:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "reference_recorded"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_secret_reference_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "referenceId": reference_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "referenceName": reference_name,
        "backend": backend,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_reference_to_audit_event_payload(
    result: ExecutionAdapterSecretReferenceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.reference_id,
        "eventType": "execution_adapter_secret_reference",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-secret-reference",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} secret reference recorded as {result.status}.",
        "detail": "Secret reference evidence stores names and operator confirmations only; raw secrets and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "referenceId": result.reference_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "referenceName": result.reference_name,
                "backend": result.backend,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": list(result.blocked_reasons),
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_secret_reference_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "reference-created-outside-ui",
            "referenceCreatedOutsideUi",
            "Secret reference was created outside this UI",
            "secret_reference_not_created",
        ),
        (
            "operator-verified-fingerprint",
            "operatorVerifiedFingerprint",
            "Operator verified the stored secret fingerprint",
            "secret_reference_fingerprint_not_verified",
        ),
        (
            "rotation-plan-documented",
            "rotationPlanDocumented",
            "Secret rotation plan is documented",
            "secret_reference_rotation_plan_not_documented",
        ),
    ]


def build_execution_adapter_secret_materialization(
    secret_reference: dict[str, Any],
    *,
    adapter_id: str = "",
    manifest_path: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    materialization_id: str | None = None,
) -> ExecutionAdapterSecretMaterializationResult:
    if not isinstance(secret_reference, dict):
        raise ValueError("execution_adapter_secret_reference_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    reference_id = str(secret_reference.get("referenceId") or "").strip()
    reference_adapter_id = str(secret_reference.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or reference_adapter_id).strip()
    market = str(secret_reference.get("market") or "").strip()
    route = str(secret_reference.get("route") or "").strip()
    reference_name = str(secret_reference.get("referenceName") or "").strip()
    backend = str(secret_reference.get("backend") or "").strip()
    normalized_manifest_path = str(manifest_path or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in secret_reference.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not reference_id:
        raise ValueError("execution_adapter_secret_materialization_reference_id_required")
    if not reference_adapter_id:
        raise ValueError("execution_adapter_secret_materialization_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_secret_materialization_adapter_id_required")
    if requested_adapter_id != reference_adapter_id:
        raise ValueError("execution_adapter_secret_materialization_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_secret_materialization_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_secret_materialization_route_invalid")
    if not reference_name:
        raise ValueError("execution_adapter_secret_materialization_reference_name_required")
    if not backend:
        raise ValueError("execution_adapter_secret_materialization_backend_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_secret_materialization_required_env_vars_required")
    if not normalized_manifest_path:
        raise ValueError("execution_adapter_secret_materialization_manifest_path_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_secret_materialization_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(secret_reference.get("status") or "") != "reference_recorded":
        blocked_reasons.append("secret_materialization_reference_not_recorded")
    if route != "live":
        blocked_reasons.append("secret_materialization_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_secret_materialization_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSecretMaterializationResult(
        materialization_id=str(
            materialization_id or f"execution-adapter-secret-materialization-{reference_id}-{uuid4()}"
        ),
        reference_id=reference_id,
        adapter_id=reference_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "manifest_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        materialization_mode="local_secret_store_manifest",
        reference_name=reference_name,
        backend=backend,
        manifest_path=normalized_manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_secret_materialization_to_payload(
    result: ExecutionAdapterSecretMaterializationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "materializationId": result.materialization_id,
        "referenceId": result.reference_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "materializationMode": result.materialization_mode,
        "referenceName": result.reference_name,
        "backend": result.backend,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_materialization_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_secret_materialization":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    materialization_id = str(metadata.get("materializationId") or getattr(event, "event_id", "")).strip()
    reference_id = str(metadata.get("referenceId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    materialization_mode = str(metadata.get("materializationMode") or "local_secret_store_manifest").strip()
    reference_name = str(metadata.get("referenceName") or "").strip()
    backend = str(metadata.get("backend") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if (
        not materialization_id
        or not reference_id
        or not adapter_id
        or not market
        or not materialization_mode
        or not reference_name
        or not backend
        or not manifest_path
        or not required_env_vars
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "manifest_recorded"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_secret_materialization_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "materializationId": materialization_id,
        "referenceId": reference_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "materializationMode": materialization_mode,
        "referenceName": reference_name,
        "backend": backend,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_materialization_to_audit_event_payload(
    result: ExecutionAdapterSecretMaterializationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.materialization_id,
        "eventType": "execution_adapter_secret_materialization",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-secret-materialization",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} secret materialization manifest recorded as {result.status}.",
        "detail": "Secret materialization stores a redacted local manifest reference only; raw secrets and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "materializationId": result.materialization_id,
                "referenceId": result.reference_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "materializationMode": result.materialization_mode,
                "referenceName": result.reference_name,
                "backend": result.backend,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": list(result.blocked_reasons),
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def materialize_execution_adapter_secret_manifest(
    result: ExecutionAdapterSecretMaterializationResult,
    *,
    secret_store_root: str | Path | None = None,
) -> dict[str, Any]:
    if result.status != "manifest_recorded":
        return {"written": False, "reason": "materialization_not_recorded", "rawSecretValuesStored": False}
    if result.backend != "local-secret-store":
        return {"written": False, "reason": "backend_not_local_secret_store", "rawSecretValuesStored": False}

    resolved_path = _resolve_execution_adapter_secret_manifest_path(
        result.manifest_path,
        secret_store_root=secret_store_root,
    )
    if resolved_path is None:
        return {"written": False, "reason": "manifest_path_invalid", "rawSecretValuesStored": False}

    fingerprint = _execution_adapter_secret_manifest_fingerprint(result.metadata)
    if not fingerprint:
        return {"written": False, "reason": "fingerprint_missing", "rawSecretValuesStored": False}

    manifest = {
        "schemaVersion": 1,
        "kind": "aiqt.executionAdapterSecretManifest",
        "adapterId": result.adapter_id,
        "referenceId": result.reference_id,
        "materializationId": result.materialization_id,
        "market": result.market,
        "route": result.route,
        "backend": result.backend,
        "referenceName": result.reference_name,
        "manifestPath": result.manifest_path,
        "fingerprint": fingerprint,
        "requiredEnvVars": list(result.required_env_vars),
        "secretRefs": {name: {"backend": result.backend, "valueStoredOutsideManifest": True} for name in result.required_env_vars},
        "metadata": {
            "source": result.metadata.get("source", ""),
            "operator": result.operator,
            "recordedAt": result.recorded_at.isoformat(),
        },
        "rawSecretValuesStored": False,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }
    try:
        resolved_path.parent.mkdir(parents=True, exist_ok=True)
        resolved_path.write_text(
            json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
            encoding="utf-8",
        )
    except OSError:
        return {"written": False, "reason": "manifest_file_write_failed", "rawSecretValuesStored": False}
    return {
        "written": True,
        "manifestPath": result.manifest_path,
        "requiredEnvVarCount": len(result.required_env_vars),
        "rawSecretValuesStored": False,
    }


def _execution_adapter_secret_materialization_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "local-secret-store-write-verified",
            "localSecretStoreWriteVerified",
            "Local secret-store write was verified",
            "secret_materialization_local_store_not_verified",
        ),
        (
            "no-raw-secret-in-payload",
            "noRawSecretInPayload",
            "No raw secret is present in this payload",
            "secret_materialization_raw_secret_boundary_not_confirmed",
        ),
        (
            "env-binding-plan-documented",
            "envBindingPlanDocumented",
            "Environment binding plan is documented",
            "secret_materialization_env_binding_plan_missing",
        ),
        (
            "rollback-plan-documented",
            "rollbackPlanDocumented",
            "Rollback plan is documented",
            "secret_materialization_rollback_plan_missing",
        ),
    ]


def build_execution_adapter_secret_manifest_validation(
    materialization: dict[str, Any],
    *,
    adapter_id: str = "",
    manifest_path: str = "",
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    validation_id: str | None = None,
    secret_store_root: str | Path | None = None,
) -> ExecutionAdapterSecretManifestValidationResult:
    if not isinstance(materialization, dict):
        raise ValueError("execution_adapter_secret_materialization_required")

    materialization_id = str(materialization.get("materializationId") or "").strip()
    reference_id = str(materialization.get("referenceId") or "").strip()
    materialization_adapter_id = str(materialization.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or materialization_adapter_id).strip()
    market = str(materialization.get("market") or "").strip()
    route = str(materialization.get("route") or "").strip()
    reference_name = str(materialization.get("referenceName") or "").strip()
    backend = str(materialization.get("backend") or "").strip()
    normalized_manifest_path = str(manifest_path or materialization.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in materialization.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not materialization_id:
        raise ValueError("execution_adapter_secret_manifest_validation_materialization_id_required")
    if not reference_id:
        raise ValueError("execution_adapter_secret_manifest_validation_reference_id_required")
    if not materialization_adapter_id:
        raise ValueError("execution_adapter_secret_manifest_validation_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_secret_manifest_validation_adapter_id_required")
    if requested_adapter_id != materialization_adapter_id:
        raise ValueError("execution_adapter_secret_manifest_validation_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_secret_manifest_validation_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_secret_manifest_validation_route_invalid")
    if not reference_name:
        raise ValueError("execution_adapter_secret_manifest_validation_reference_name_required")
    if not backend:
        raise ValueError("execution_adapter_secret_manifest_validation_backend_required")
    if not normalized_manifest_path:
        raise ValueError("execution_adapter_secret_manifest_validation_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_secret_manifest_validation_required_env_vars_required")

    blocked_reasons: list[str] = []
    fingerprint = ""
    covered_env_vars: list[str] = []
    manifest_exists = False
    manifest_json_valid = False
    resolved_path = _resolve_execution_adapter_secret_manifest_path(
        normalized_manifest_path,
        secret_store_root=secret_store_root,
    )
    if str(materialization.get("status") or "") != "manifest_recorded":
        blocked_reasons.append("secret_manifest_validation_materialization_not_recorded")
    if route != "live":
        blocked_reasons.append("secret_manifest_validation_route_not_live")
    if resolved_path is None:
        blocked_reasons.append("secret_manifest_path_invalid")
    else:
        try:
            manifest_payload = json.loads(resolved_path.read_text(encoding="utf-8"))
            manifest_exists = True
            manifest_json_valid = isinstance(manifest_payload, dict)
            if not isinstance(manifest_payload, dict):
                blocked_reasons.append("secret_manifest_invalid_json")
            else:
                fingerprint = _execution_adapter_secret_manifest_fingerprint(manifest_payload)
                covered_env_vars = _execution_adapter_secret_manifest_env_vars(manifest_payload)
                if not fingerprint:
                    blocked_reasons.append("secret_manifest_fingerprint_missing")
                missing_env_vars = [name for name in required_env_vars if name not in set(covered_env_vars)]
                if missing_env_vars:
                    blocked_reasons.append("secret_manifest_required_env_vars_missing")
        except FileNotFoundError:
            blocked_reasons.append("secret_manifest_file_missing")
        except OSError:
            blocked_reasons.append("secret_manifest_file_unreadable")
        except json.JSONDecodeError:
            manifest_exists = True
            blocked_reasons.append("secret_manifest_invalid_json")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_secret_manifest_validation_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSecretManifestValidationResult(
        validation_id=str(
            validation_id or f"execution-adapter-secret-manifest-validation-{materialization_id}-{uuid4()}"
        ),
        materialization_id=materialization_id,
        reference_id=reference_id,
        adapter_id=materialization_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "validated",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        validation_mode="local_secret_store_manifest_readonly",
        reference_name=reference_name,
        backend=backend,
        manifest_path=normalized_manifest_path,
        fingerprint=fingerprint,
        required_env_vars=required_env_vars,
        covered_env_vars=covered_env_vars,
        blocked_reasons=unique_blocked_reasons,
        manifest_summary={
            "manifestExists": manifest_exists,
            "manifestJsonValid": manifest_json_valid,
            "requiredEnvVarCount": len(required_env_vars),
            "coveredEnvVarCount": len([name for name in required_env_vars if name in set(covered_env_vars)]),
            "rawValuesReturned": False,
        },
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_secret_manifest_validation_to_payload(
    result: ExecutionAdapterSecretManifestValidationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "validationId": result.validation_id,
        "materializationId": result.materialization_id,
        "referenceId": result.reference_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "validationMode": result.validation_mode,
        "referenceName": result.reference_name,
        "backend": result.backend,
        "manifestPath": result.manifest_path,
        "fingerprint": result.fingerprint,
        "requiredEnvVars": list(result.required_env_vars),
        "coveredEnvVars": list(result.covered_env_vars),
        "blockedReasons": list(result.blocked_reasons),
        "manifestSummary": result.manifest_summary,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_manifest_validation_payload_from_audit_event(
    event: Any,
) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_secret_manifest_validation":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    validation_id = str(metadata.get("validationId") or getattr(event, "event_id", "")).strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    reference_id = str(metadata.get("referenceId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    validation_mode = str(metadata.get("validationMode") or "local_secret_store_manifest_readonly").strip()
    reference_name = str(metadata.get("referenceName") or "").strip()
    backend = str(metadata.get("backend") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    fingerprint = str(metadata.get("fingerprint") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    covered_env_vars = [
        str(item).strip()
        for item in metadata.get("coveredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    manifest_summary = metadata.get("manifestSummary") if isinstance(metadata.get("manifestSummary"), dict) else {}
    if (
        not validation_id
        or not materialization_id
        or not reference_id
        or not adapter_id
        or not market
        or not validation_mode
        or not reference_name
        or not backend
        or not manifest_path
        or not required_env_vars
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "validated"}:
        return None

    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    return {
        "schemaVersion": 1,
        "validationId": validation_id,
        "materializationId": materialization_id,
        "referenceId": reference_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "validationMode": validation_mode,
        "referenceName": reference_name,
        "backend": backend,
        "manifestPath": manifest_path,
        "fingerprint": fingerprint,
        "requiredEnvVars": required_env_vars,
        "coveredEnvVars": covered_env_vars,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "manifestSummary": _redact_secret_fields(manifest_summary),
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_secret_manifest_validation_to_audit_event_payload(
    result: ExecutionAdapterSecretManifestValidationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.validation_id,
        "eventType": "execution_adapter_secret_manifest_validation",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-secret-manifest-validation",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} secret manifest validated as {result.status}.",
        "detail": "Secret manifest validation reads local metadata only; raw secret values and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "validationId": result.validation_id,
                "materializationId": result.materialization_id,
                "referenceId": result.reference_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "validationMode": result.validation_mode,
                "referenceName": result.reference_name,
                "backend": result.backend,
                "manifestPath": result.manifest_path,
                "fingerprint": result.fingerprint,
                "requiredEnvVars": list(result.required_env_vars),
                "coveredEnvVars": list(result.covered_env_vars),
                "blockedReasons": list(result.blocked_reasons),
                "manifestSummary": result.manifest_summary,
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _resolve_execution_adapter_secret_manifest_path(
    manifest_path: str,
    *,
    secret_store_root: str | Path | None = None,
) -> Path | None:
    normalized = str(manifest_path or "").strip()
    if normalized.startswith("local-secret-store://"):
        suffix = normalized.removeprefix("local-secret-store://").replace("\\", "/").strip("/")
        parts = [part for part in suffix.split("/") if part]
        if not parts or any(part in {".", ".."} for part in parts):
            return None
        path = Path(secret_store_root) if secret_store_root else Path("data") / "secret-store"
        for part in parts:
            path = path / part
        return path if path.suffix else path.with_suffix(".json")
    if normalized.startswith("file://"):
        normalized = normalized.removeprefix("file://")
    path = Path(normalized)
    if any(part == ".." for part in path.parts):
        return None
    return path


def _execution_adapter_secret_manifest_fingerprint(manifest: dict[str, Any]) -> str:
    for key in ("fingerprint", "secretFingerprint", "secretFingerprintSha256", "manifestFingerprint"):
        value = manifest.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    metadata = manifest.get("metadata")
    if isinstance(metadata, dict):
        value = metadata.get("fingerprint")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _execution_adapter_secret_manifest_env_vars(manifest: dict[str, Any]) -> list[str]:
    env_vars: list[str] = []
    for key in ("requiredEnvVars", "envVars", "providedEnvVars"):
        value = manifest.get(key)
        if isinstance(value, list):
            env_vars.extend(str(item).strip() for item in value if isinstance(item, str) and item.strip())
    for key in ("env", "secrets", "secretRefs"):
        value = manifest.get(key)
        if isinstance(value, dict):
            env_vars.extend(str(item).strip() for item in value.keys() if str(item).strip())
    return list(dict.fromkeys(env_vars))


def build_execution_adapter_environment_binding(
    materialization: dict[str, Any],
    *,
    adapter_id: str = "",
    binding_mode: str = "",
    manifest_validation: dict[str, Any] | None = None,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    binding_id: str | None = None,
) -> ExecutionAdapterEnvironmentBindingResult:
    if not isinstance(materialization, dict):
        raise ValueError("execution_adapter_secret_materialization_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    materialization_id = str(materialization.get("materializationId") or "").strip()
    materialization_adapter_id = str(materialization.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or materialization_adapter_id).strip()
    market = str(materialization.get("market") or "").strip()
    route = str(materialization.get("route") or "").strip()
    manifest_path = str(materialization.get("manifestPath") or "").strip()
    normalized_binding_mode = str(binding_mode or "container_env_reference").strip()
    manifest_validation_id = ""
    required_env_vars = [
        str(item).strip()
        for item in materialization.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not materialization_id:
        raise ValueError("execution_adapter_environment_binding_materialization_id_required")
    if not materialization_adapter_id:
        raise ValueError("execution_adapter_environment_binding_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_environment_binding_adapter_id_required")
    if requested_adapter_id != materialization_adapter_id:
        raise ValueError("execution_adapter_environment_binding_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_environment_binding_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_environment_binding_route_invalid")
    if not manifest_path:
        raise ValueError("execution_adapter_environment_binding_manifest_path_required")
    if not normalized_binding_mode:
        raise ValueError("execution_adapter_environment_binding_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_environment_binding_required_env_vars_required")

    blocked_reasons = []
    if manifest_validation is not None:
        if not isinstance(manifest_validation, dict):
            raise ValueError("execution_adapter_secret_manifest_validation_required")
        manifest_validation_id = str(manifest_validation.get("validationId") or "").strip()
        validation_materialization_id = str(manifest_validation.get("materializationId") or "").strip()
        validation_adapter_id = str(manifest_validation.get("adapterId") or "").strip()
        validation_manifest_path = str(manifest_validation.get("manifestPath") or "").strip()
        validation_required_env_vars = [
            str(item).strip()
            for item in manifest_validation.get("requiredEnvVars", [])
            if isinstance(item, str) and item.strip()
        ]
        validation_covered_env_vars = {
            str(item).strip()
            for item in manifest_validation.get("coveredEnvVars", [])
            if isinstance(item, str) and item.strip()
        }
        if not manifest_validation_id:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_id_required")
        if validation_materialization_id != materialization_id:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_materialization_mismatch")
        if validation_adapter_id != materialization_adapter_id:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_adapter_mismatch")
        if validation_manifest_path and validation_manifest_path != manifest_path:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_path_mismatch")
        if validation_required_env_vars and validation_required_env_vars != required_env_vars:
            raise ValueError("execution_adapter_environment_binding_manifest_validation_env_vars_mismatch")
        if str(manifest_validation.get("status") or "") != "validated":
            blocked_reasons.append("environment_binding_manifest_validation_not_validated")
        missing_validated_env_vars = [name for name in required_env_vars if name not in validation_covered_env_vars]
        if missing_validated_env_vars:
            blocked_reasons.append("environment_binding_manifest_validation_env_vars_missing")

    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_environment_binding_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(materialization.get("status") or "") != "manifest_recorded":
        blocked_reasons.append("environment_binding_materialization_not_recorded")
    if route != "live":
        blocked_reasons.append("environment_binding_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_environment_binding_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterEnvironmentBindingResult(
        binding_id=str(binding_id or f"execution-adapter-environment-binding-{materialization_id}-{uuid4()}"),
        materialization_id=materialization_id,
        adapter_id=materialization_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "binding_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        binding_mode=normalized_binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        manifest_validation_id=manifest_validation_id,
        live_trading_allowed=False,
    )


def execution_adapter_environment_binding_to_payload(
    result: ExecutionAdapterEnvironmentBindingResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_environment_binding_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_environment_binding":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    binding_id = str(metadata.get("bindingId") or getattr(event, "event_id", "")).strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    binding_mode = str(metadata.get("bindingMode") or "container_env_reference").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in metadata.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if (
        not binding_id
        or not materialization_id
        or not adapter_id
        or not market
        or not binding_mode
        or not manifest_path
        or not required_env_vars
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "binding_recorded"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_environment_binding_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_environment_binding_to_audit_event_payload(
    result: ExecutionAdapterEnvironmentBindingResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": result.binding_id,
        "eventType": "execution_adapter_environment_binding",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-environment-binding",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} environment binding recorded as {result.status}.",
        "detail": "Environment binding records redacted runtime mapping evidence only; no environment variables are written and live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": list(result.blocked_reasons),
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_environment_binding_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "runtime-env-mapping-verified",
            "runtimeEnvMappingVerified",
            "Runtime environment mapping was verified",
            "environment_binding_runtime_env_mapping_missing",
        ),
        (
            "config-reload-plan-documented",
            "configReloadPlanDocumented",
            "Config reload plan is documented",
            "environment_binding_config_reload_plan_missing",
        ),
        (
            "no-raw-secret-in-payload",
            "noRawSecretInPayload",
            "No raw secret is present in this payload",
            "environment_binding_raw_secret_boundary_not_confirmed",
        ),
        (
            "rollback-snapshot-recorded",
            "rollbackSnapshotRecorded",
            "Rollback snapshot is recorded",
            "environment_binding_rollback_snapshot_missing",
        ),
    ]


def build_execution_adapter_runtime_reload_plan(
    environment_binding: dict[str, Any],
    *,
    adapter_id: str = "",
    reload_mode: str = "",
    maintenance_window_id: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    plan_id: str | None = None,
) -> ExecutionAdapterRuntimeReloadPlanResult:
    if not isinstance(environment_binding, dict):
        raise ValueError("execution_adapter_environment_binding_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    binding_id = str(environment_binding.get("bindingId") or "").strip()
    materialization_id = str(environment_binding.get("materializationId") or "").strip()
    manifest_validation_id = str(environment_binding.get("manifestValidationId") or "").strip()
    binding_adapter_id = str(environment_binding.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or binding_adapter_id).strip()
    market = str(environment_binding.get("market") or "").strip()
    route = str(environment_binding.get("route") or "").strip()
    normalized_reload_mode = str(reload_mode or "manual_container_reload_plan").strip()
    normalized_window_id = str(maintenance_window_id or "").strip()
    binding_mode = str(environment_binding.get("bindingMode") or "").strip()
    manifest_path = str(environment_binding.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in environment_binding.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not binding_id:
        raise ValueError("execution_adapter_runtime_reload_plan_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_runtime_reload_plan_materialization_id_required")
    if not binding_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_plan_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_plan_adapter_id_required")
    if requested_adapter_id != binding_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_plan_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_runtime_reload_plan_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_runtime_reload_plan_route_invalid")
    if not normalized_reload_mode:
        raise ValueError("execution_adapter_runtime_reload_plan_mode_required")
    if not normalized_window_id:
        raise ValueError("execution_adapter_runtime_reload_plan_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_runtime_reload_plan_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_runtime_reload_plan_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_runtime_reload_plan_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_runtime_reload_plan_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(environment_binding.get("status") or "") != "binding_recorded":
        blocked_reasons.append("runtime_reload_environment_binding_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("runtime_reload_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("runtime_reload_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_runtime_reload_plan_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterRuntimeReloadPlanResult(
        plan_id=str(plan_id or f"execution-adapter-runtime-reload-plan-{binding_id}-{uuid4()}"),
        binding_id=binding_id,
        materialization_id=materialization_id,
        adapter_id=binding_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "plan_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        reload_mode=normalized_reload_mode,
        maintenance_window_id=normalized_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        manifest_validation_id=manifest_validation_id,
        live_trading_allowed=False,
    )


def execution_adapter_runtime_reload_plan_to_payload(
    result: ExecutionAdapterRuntimeReloadPlanResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_runtime_reload_plan_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_runtime_reload_plan":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    plan_id = str(metadata.get("planId") or getattr(event, "event_id", "")).strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if not plan_id or not binding_id or not materialization_id or not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "plan_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_runtime_reload_plan_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_runtime_reload_plan_to_audit_event_payload(
    result: ExecutionAdapterRuntimeReloadPlanResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.plan_id,
        "eventType": "execution_adapter_runtime_reload_plan",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-runtime-reload-plan",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} runtime reload plan {status_label} as {result.status}.",
        "detail": "Runtime reload plan stores orchestration evidence only; no restart is executed and live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_runtime_reload_plan_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "maintenance-window-approved",
            "maintenanceWindowApproved",
            "Maintenance window is approved",
            "runtime_reload_maintenance_window_missing",
        ),
        (
            "health-baseline-captured",
            "healthBaselineCaptured",
            "Pre-reload health baseline was captured",
            "runtime_reload_health_baseline_missing",
        ),
        (
            "config-diff-reviewed",
            "configDiffReviewed",
            "Configuration diff was reviewed",
            "runtime_reload_config_diff_missing",
        ),
        (
            "post-reload-smoke-plan-documented",
            "postReloadSmokePlanDocumented",
            "Post-reload smoke plan is documented",
            "runtime_reload_smoke_plan_missing",
        ),
        (
            "rollback-owner-assigned",
            "rollbackOwnerAssigned",
            "Rollback trigger owner is assigned",
            "runtime_reload_rollback_owner_missing",
        ),
    ]


def build_execution_adapter_runtime_reload_execution(
    runtime_reload_plan: dict[str, Any],
    *,
    adapter_id: str = "",
    execution_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    execution_id: str | None = None,
) -> ExecutionAdapterRuntimeReloadExecutionResult:
    if not isinstance(runtime_reload_plan, dict):
        raise ValueError("execution_adapter_runtime_reload_plan_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    plan_id = str(runtime_reload_plan.get("planId") or "").strip()
    binding_id = str(runtime_reload_plan.get("bindingId") or "").strip()
    materialization_id = str(runtime_reload_plan.get("materializationId") or "").strip()
    manifest_validation_id = str(runtime_reload_plan.get("manifestValidationId") or "").strip()
    plan_adapter_id = str(runtime_reload_plan.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or plan_adapter_id).strip()
    market = str(runtime_reload_plan.get("market") or "").strip()
    route = str(runtime_reload_plan.get("route") or "").strip()
    normalized_execution_mode = str(execution_mode or "manual_controlled_reload").strip()
    reload_mode = str(runtime_reload_plan.get("reloadMode") or "").strip()
    maintenance_window_id = str(runtime_reload_plan.get("maintenanceWindowId") or "").strip()
    binding_mode = str(runtime_reload_plan.get("bindingMode") or "").strip()
    manifest_path = str(runtime_reload_plan.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in runtime_reload_plan.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not plan_id:
        raise ValueError("execution_adapter_runtime_reload_execution_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_runtime_reload_execution_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_runtime_reload_execution_materialization_id_required")
    if not plan_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_execution_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_execution_adapter_id_required")
    if requested_adapter_id != plan_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_execution_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_runtime_reload_execution_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_runtime_reload_execution_route_invalid")
    if not normalized_execution_mode:
        raise ValueError("execution_adapter_runtime_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_runtime_reload_execution_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_runtime_reload_execution_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_runtime_reload_execution_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_runtime_reload_execution_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_runtime_reload_execution_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_runtime_reload_execution_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(runtime_reload_plan.get("status") or "") != "plan_recorded":
        blocked_reasons.append("runtime_reload_execution_plan_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("runtime_reload_execution_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("runtime_reload_execution_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_runtime_reload_execution_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterRuntimeReloadExecutionResult(
        execution_id=str(execution_id or f"execution-adapter-runtime-reload-execution-{plan_id}-{uuid4()}"),
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=plan_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "execution_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        execution_mode=normalized_execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_runtime_reload_execution_to_payload(
    result: ExecutionAdapterRuntimeReloadExecutionResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_runtime_reload_execution_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_runtime_reload_execution":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    execution_id = str(metadata.get("executionId") or getattr(event, "event_id", "")).strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if not execution_id or not plan_id or not binding_id or not materialization_id or not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "execution_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_runtime_reload_execution_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_runtime_reload_execution_to_audit_event_payload(
    result: ExecutionAdapterRuntimeReloadExecutionResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.execution_id,
        "eventType": "execution_adapter_runtime_reload_execution",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-runtime-reload-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} runtime reload execution {status_label} as {result.status}.",
        "detail": "Runtime reload execution stores operator evidence only; no restart is executed and live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_runtime_reload_execution_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "pre-reload-health-verified",
            "preReloadHealthVerified",
            "Pre-reload health is verified",
            "runtime_reload_execution_pre_health_missing",
        ),
        (
            "reload-action-recorded",
            "reloadActionRecorded",
            "Reload action is recorded",
            "runtime_reload_execution_action_record_missing",
        ),
        (
            "post-reload-smoke-passed",
            "postReloadSmokePassed",
            "Post-reload smoke passed",
            "runtime_reload_execution_post_smoke_missing",
        ),
        (
            "rollback-readiness-confirmed",
            "rollbackReadinessConfirmed",
            "Rollback readiness is confirmed",
            "runtime_reload_execution_rollback_readiness_missing",
        ),
        (
            "operator-confirmed-live-blocked",
            "operatorConfirmedLiveBlocked",
            "Operator confirmed live routing remains blocked",
            "runtime_reload_execution_live_block_boundary_missing",
        ),
    ]


def build_execution_adapter_runtime_reload_acceptance(
    runtime_reload_execution: dict[str, Any],
    *,
    adapter_id: str = "",
    acceptance_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    acceptance_id: str | None = None,
) -> ExecutionAdapterRuntimeReloadAcceptanceResult:
    if not isinstance(runtime_reload_execution, dict):
        raise ValueError("execution_adapter_runtime_reload_execution_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    execution_id = str(runtime_reload_execution.get("executionId") or "").strip()
    plan_id = str(runtime_reload_execution.get("planId") or "").strip()
    binding_id = str(runtime_reload_execution.get("bindingId") or "").strip()
    materialization_id = str(runtime_reload_execution.get("materializationId") or "").strip()
    manifest_validation_id = str(runtime_reload_execution.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(runtime_reload_execution.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(runtime_reload_execution.get("market") or "").strip()
    route = str(runtime_reload_execution.get("route") or "").strip()
    normalized_acceptance_mode = str(acceptance_mode or "manual_runtime_reload_acceptance").strip()
    execution_mode = str(runtime_reload_execution.get("executionMode") or "").strip()
    reload_mode = str(runtime_reload_execution.get("reloadMode") or "").strip()
    maintenance_window_id = str(runtime_reload_execution.get("maintenanceWindowId") or "").strip()
    binding_mode = str(runtime_reload_execution.get("bindingMode") or "").strip()
    manifest_path = str(runtime_reload_execution.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in runtime_reload_execution.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not execution_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_runtime_reload_acceptance_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_runtime_reload_acceptance_route_invalid")
    if not normalized_acceptance_mode:
        raise ValueError("execution_adapter_runtime_reload_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_runtime_reload_acceptance_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_runtime_reload_acceptance_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_runtime_reload_acceptance_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_runtime_reload_acceptance_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_runtime_reload_acceptance_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_runtime_reload_acceptance_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_runtime_reload_acceptance_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(runtime_reload_execution.get("status") or "") != "execution_recorded":
        blocked_reasons.append("runtime_reload_acceptance_execution_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("runtime_reload_acceptance_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("runtime_reload_acceptance_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_runtime_reload_acceptance_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterRuntimeReloadAcceptanceResult(
        acceptance_id=str(acceptance_id or f"execution-adapter-runtime-reload-acceptance-{execution_id}-{uuid4()}"),
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "acceptance_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        acceptance_mode=normalized_acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_runtime_reload_acceptance_to_payload(
    result: ExecutionAdapterRuntimeReloadAcceptanceResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_runtime_reload_acceptance_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_runtime_reload_acceptance":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    acceptance_id = str(metadata.get("acceptanceId") or getattr(event, "event_id", "")).strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    acceptance_mode = str(metadata.get("acceptanceMode") or "manual_runtime_reload_acceptance").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if not acceptance_id or not execution_id or not plan_id or not binding_id or not materialization_id or not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "acceptance_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_runtime_reload_acceptance_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_runtime_reload_acceptance_to_audit_event_payload(
    result: ExecutionAdapterRuntimeReloadAcceptanceResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.acceptance_id,
        "eventType": "execution_adapter_runtime_reload_acceptance",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-runtime-reload-acceptance",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} runtime reload acceptance {status_label} as {result.status}.",
        "detail": "Runtime reload acceptance records final operator evidence only; live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_runtime_reload_acceptance_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "execution-evidence-reviewed",
            "executionEvidenceReviewed",
            "Runtime reload execution evidence was reviewed",
            "runtime_reload_acceptance_execution_evidence_not_reviewed",
        ),
        (
            "post-reload-health-verified",
            "postReloadHealthVerified",
            "Post-reload health was verified",
            "runtime_reload_acceptance_post_health_missing",
        ),
        (
            "adapter-handshake-verified",
            "adapterHandshakeVerified",
            "Sandbox or paper adapter handshake was verified",
            "runtime_reload_acceptance_adapter_handshake_missing",
        ),
        (
            "kill-switch-still-enabled",
            "killSwitchStillEnabled",
            "Kill switch remains enabled",
            "runtime_reload_acceptance_kill_switch_missing",
        ),
        (
            "operator-confirmed-live-blocked",
            "operatorConfirmedLiveBlocked",
            "Operator confirmed live routing remains blocked",
            "runtime_reload_acceptance_live_block_boundary_missing",
        ),
    ]


def build_execution_adapter_orchestration_dry_run(
    runtime_reload_acceptance: dict[str, Any],
    *,
    adapter_id: str = "",
    orchestration_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    dry_run_id: str | None = None,
) -> ExecutionAdapterOrchestrationDryRunResult:
    if not isinstance(runtime_reload_acceptance, dict):
        raise ValueError("execution_adapter_runtime_reload_acceptance_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    acceptance_id = str(runtime_reload_acceptance.get("acceptanceId") or "").strip()
    execution_id = str(runtime_reload_acceptance.get("executionId") or "").strip()
    plan_id = str(runtime_reload_acceptance.get("planId") or "").strip()
    binding_id = str(runtime_reload_acceptance.get("bindingId") or "").strip()
    materialization_id = str(runtime_reload_acceptance.get("materializationId") or "").strip()
    manifest_validation_id = str(runtime_reload_acceptance.get("manifestValidationId") or "").strip()
    acceptance_adapter_id = str(runtime_reload_acceptance.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or acceptance_adapter_id).strip()
    market = str(runtime_reload_acceptance.get("market") or "").strip()
    route = str(runtime_reload_acceptance.get("route") or "").strip()
    acceptance_mode = str(runtime_reload_acceptance.get("acceptanceMode") or "").strip()
    execution_mode = str(runtime_reload_acceptance.get("executionMode") or "").strip()
    reload_mode = str(runtime_reload_acceptance.get("reloadMode") or "").strip()
    maintenance_window_id = str(runtime_reload_acceptance.get("maintenanceWindowId") or "").strip()
    binding_mode = str(runtime_reload_acceptance.get("bindingMode") or "").strip()
    manifest_path = str(runtime_reload_acceptance.get("manifestPath") or "").strip()
    normalized_orchestration_mode = str(orchestration_mode or "manual_adapter_orchestration_dry_run").strip()
    required_env_vars = [
        str(item).strip()
        for item in runtime_reload_acceptance.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not acceptance_id:
        raise ValueError("execution_adapter_orchestration_dry_run_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_orchestration_dry_run_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_orchestration_dry_run_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_orchestration_dry_run_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_orchestration_dry_run_materialization_id_required")
    if not acceptance_adapter_id:
        raise ValueError("execution_adapter_orchestration_dry_run_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_orchestration_dry_run_adapter_id_required")
    if requested_adapter_id != acceptance_adapter_id:
        raise ValueError("execution_adapter_orchestration_dry_run_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_orchestration_dry_run_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_orchestration_dry_run_route_invalid")
    if not normalized_orchestration_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_orchestration_dry_run_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_orchestration_dry_run_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_orchestration_dry_run_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_orchestration_dry_run_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_orchestration_dry_run_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(runtime_reload_acceptance.get("status") or "") != "acceptance_recorded":
        blocked_reasons.append("orchestration_dry_run_acceptance_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("orchestration_dry_run_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("orchestration_dry_run_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_orchestration_dry_run_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterOrchestrationDryRunResult(
        dry_run_id=str(dry_run_id or f"execution-adapter-orchestration-dry-run-{acceptance_id}-{uuid4()}"),
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=acceptance_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "dry_run_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        orchestration_mode=normalized_orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_orchestration_dry_run_to_payload(
    result: ExecutionAdapterOrchestrationDryRunResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_orchestration_dry_run_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_orchestration_dry_run":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    dry_run_id = str(metadata.get("dryRunId") or getattr(event, "event_id", "")).strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    orchestration_mode = str(metadata.get("orchestrationMode") or "manual_adapter_orchestration_dry_run").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if not dry_run_id or not acceptance_id or not execution_id or not plan_id or not binding_id or not materialization_id:
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "dry_run_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_orchestration_dry_run_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_orchestration_dry_run_to_audit_event_payload(
    result: ExecutionAdapterOrchestrationDryRunResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.dry_run_id,
        "eventType": "execution_adapter_orchestration_dry_run",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-orchestration-dry-run",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter orchestration dry run {status_label} as {result.status}.",
        "detail": "Adapter orchestration dry run records pre-live evidence only; broker connections and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_orchestration_dry_run_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "accepted-chain-reviewed",
            "acceptedChainReviewed",
            "Runtime reload acceptance chain was reviewed",
            "orchestration_dry_run_acceptance_not_reviewed",
        ),
        (
            "sandbox-handshake-dry-run-passed",
            "sandboxHandshakeDryRunPassed",
            "Sandbox or paper adapter handshake dry run passed",
            "orchestration_dry_run_sandbox_handshake_missing",
        ),
        (
            "order-schema-dry-run-passed",
            "orderSchemaDryRunPassed",
            "Order schema dry run passed without submission",
            "orchestration_dry_run_order_schema_missing",
        ),
        (
            "account-sync-dry-run-passed",
            "accountSyncDryRunPassed",
            "Account sync dry run passed without broker mutation",
            "orchestration_dry_run_account_sync_missing",
        ),
        (
            "operator-confirmed-no-live-orders",
            "operatorConfirmedNoLiveOrders",
            "Operator confirmed no live orders were routed",
            "orchestration_dry_run_live_order_boundary_missing",
        ),
    ]


def build_execution_adapter_orchestration_execution(
    orchestration_dry_run: dict[str, Any],
    *,
    adapter_id: str = "",
    orchestration_execution_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    orchestration_execution_id: str | None = None,
) -> ExecutionAdapterOrchestrationExecutionResult:
    if not isinstance(orchestration_dry_run, dict):
        raise ValueError("execution_adapter_orchestration_dry_run_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    dry_run_id = str(orchestration_dry_run.get("dryRunId") or "").strip()
    acceptance_id = str(orchestration_dry_run.get("acceptanceId") or "").strip()
    execution_id = str(orchestration_dry_run.get("executionId") or "").strip()
    plan_id = str(orchestration_dry_run.get("planId") or "").strip()
    binding_id = str(orchestration_dry_run.get("bindingId") or "").strip()
    materialization_id = str(orchestration_dry_run.get("materializationId") or "").strip()
    manifest_validation_id = str(orchestration_dry_run.get("manifestValidationId") or "").strip()
    dry_run_adapter_id = str(orchestration_dry_run.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or dry_run_adapter_id).strip()
    market = str(orchestration_dry_run.get("market") or "").strip()
    route = str(orchestration_dry_run.get("route") or "").strip()
    orchestration_mode = str(orchestration_dry_run.get("orchestrationMode") or "").strip()
    acceptance_mode = str(orchestration_dry_run.get("acceptanceMode") or "").strip()
    execution_mode = str(orchestration_dry_run.get("executionMode") or "").strip()
    reload_mode = str(orchestration_dry_run.get("reloadMode") or "").strip()
    maintenance_window_id = str(orchestration_dry_run.get("maintenanceWindowId") or "").strip()
    binding_mode = str(orchestration_dry_run.get("bindingMode") or "").strip()
    manifest_path = str(orchestration_dry_run.get("manifestPath") or "").strip()
    normalized_execution_mode = str(
        orchestration_execution_mode or "manual_adapter_orchestration_execution"
    ).strip()
    required_env_vars = [
        str(item).strip()
        for item in orchestration_dry_run.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]
    if not dry_run_id:
        raise ValueError("execution_adapter_orchestration_execution_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_orchestration_execution_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_orchestration_execution_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_orchestration_execution_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_orchestration_execution_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_orchestration_execution_materialization_id_required")
    if not dry_run_adapter_id:
        raise ValueError("execution_adapter_orchestration_execution_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_orchestration_execution_adapter_id_required")
    if requested_adapter_id != dry_run_adapter_id:
        raise ValueError("execution_adapter_orchestration_execution_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_orchestration_execution_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_orchestration_execution_route_invalid")
    if not normalized_execution_mode:
        raise ValueError("execution_adapter_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_orchestration_execution_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_orchestration_execution_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_orchestration_execution_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_orchestration_execution_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_orchestration_execution_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_orchestration_execution_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_orchestration_execution_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_orchestration_execution_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_orchestration_execution_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(orchestration_dry_run.get("status") or "") != "dry_run_recorded":
        blocked_reasons.append("orchestration_execution_dry_run_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("orchestration_execution_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("orchestration_execution_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_orchestration_execution_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterOrchestrationExecutionResult(
        orchestration_execution_id=str(
            orchestration_execution_id
            or f"execution-adapter-orchestration-execution-{dry_run_id}-{uuid4()}"
        ),
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=dry_run_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "execution_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        orchestration_execution_mode=normalized_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_orchestration_execution_to_payload(
    result: ExecutionAdapterOrchestrationExecutionResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_orchestration_execution_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_orchestration_execution":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    orchestration_execution_id = str(
        metadata.get("orchestrationExecutionId") or getattr(event, "event_id", "")
    ).strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    orchestration_execution_mode = str(
        metadata.get("orchestrationExecutionMode") or "manual_adapter_orchestration_execution"
    ).strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "execution_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_orchestration_execution_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_orchestration_execution_to_audit_event_payload(
    result: ExecutionAdapterOrchestrationExecutionResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.orchestration_execution_id,
        "eventType": "execution_adapter_orchestration_execution",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-orchestration-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter orchestration execution {status_label} as {result.status}.",
        "detail": "Adapter orchestration execution records controlled handoff evidence only; broker connections and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_orchestration_execution_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "dry-run-evidence-reviewed",
            "dryRunEvidenceReviewed",
            "Adapter orchestration dry-run evidence was reviewed",
            "orchestration_execution_dry_run_not_reviewed",
        ),
        (
            "sandbox-route-locked",
            "sandboxRouteLocked",
            "Sandbox or paper route remains locked for the handoff",
            "orchestration_execution_sandbox_route_not_locked",
        ),
        (
            "kill-switch-armed",
            "killSwitchArmed",
            "Kill switch remains armed during orchestration",
            "orchestration_execution_kill_switch_not_armed",
        ),
        (
            "idempotency-key-recorded",
            "idempotencyKeyRecorded",
            "Idempotency key or replay guard was recorded",
            "orchestration_execution_idempotency_key_missing",
        ),
        (
            "operator-confirmed-no-capital",
            "operatorConfirmedNoCapital",
            "Operator confirmed no capital was routed",
            "orchestration_execution_live_capital_boundary_missing",
        ),
    ]


def build_execution_adapter_human_confirmation(
    orchestration_execution: dict[str, Any],
    *,
    adapter_id: str = "",
    confirmation_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    human_confirmation_id: str | None = None,
) -> ExecutionAdapterHumanConfirmationResult:
    if not isinstance(orchestration_execution, dict):
        raise ValueError("execution_adapter_orchestration_execution_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    orchestration_execution_id = str(orchestration_execution.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(orchestration_execution.get("dryRunId") or "").strip()
    acceptance_id = str(orchestration_execution.get("acceptanceId") or "").strip()
    execution_id = str(orchestration_execution.get("executionId") or "").strip()
    plan_id = str(orchestration_execution.get("planId") or "").strip()
    binding_id = str(orchestration_execution.get("bindingId") or "").strip()
    materialization_id = str(orchestration_execution.get("materializationId") or "").strip()
    manifest_validation_id = str(orchestration_execution.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(orchestration_execution.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(orchestration_execution.get("market") or "").strip()
    route = str(orchestration_execution.get("route") or "").strip()
    normalized_confirmation_mode = str(confirmation_mode or "manual_final_human_confirmation").strip()
    orchestration_execution_mode = str(orchestration_execution.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(orchestration_execution.get("orchestrationMode") or "").strip()
    acceptance_mode = str(orchestration_execution.get("acceptanceMode") or "").strip()
    execution_mode = str(orchestration_execution.get("executionMode") or "").strip()
    reload_mode = str(orchestration_execution.get("reloadMode") or "").strip()
    maintenance_window_id = str(orchestration_execution.get("maintenanceWindowId") or "").strip()
    binding_mode = str(orchestration_execution.get("bindingMode") or "").strip()
    manifest_path = str(orchestration_execution.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in orchestration_execution.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not orchestration_execution_id:
        raise ValueError("execution_adapter_human_confirmation_orchestration_execution_id_required")
    if not dry_run_id:
        raise ValueError("execution_adapter_human_confirmation_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_human_confirmation_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_human_confirmation_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_human_confirmation_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_human_confirmation_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_human_confirmation_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_human_confirmation_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_human_confirmation_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_human_confirmation_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_human_confirmation_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_human_confirmation_route_invalid")
    if not normalized_confirmation_mode:
        raise ValueError("execution_adapter_human_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_human_confirmation_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_human_confirmation_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_human_confirmation_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_human_confirmation_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_human_confirmation_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_human_confirmation_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_human_confirmation_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_human_confirmation_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_human_confirmation_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_human_confirmation_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(orchestration_execution.get("status") or "") != "execution_recorded":
        blocked_reasons.append("human_confirmation_orchestration_execution_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("human_confirmation_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("human_confirmation_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_human_confirmation_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterHumanConfirmationResult(
        human_confirmation_id=str(
            human_confirmation_id
            or f"execution-adapter-human-confirmation-{orchestration_execution_id}-{uuid4()}"
        ),
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "confirmation_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        confirmation_mode=normalized_confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_human_confirmation_to_payload(
    result: ExecutionAdapterHumanConfirmationResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_human_confirmation_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_human_confirmation":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    human_confirmation_id = str(metadata.get("humanConfirmationId") or getattr(event, "event_id", "")).strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    confirmation_mode = str(metadata.get("confirmationMode") or "manual_final_human_confirmation").strip()
    orchestration_execution_mode = str(metadata.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not human_confirmation_id
        or not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "confirmation_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_human_confirmation_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "confirmationMode": confirmation_mode,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_human_confirmation_to_audit_event_payload(
    result: ExecutionAdapterHumanConfirmationResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.human_confirmation_id,
        "eventType": "execution_adapter_human_confirmation",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-human-confirmation",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter human confirmation {status_label} as {result.status}.",
        "detail": "Adapter human confirmation records final review evidence only; broker connections and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_human_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "orchestration-execution-reviewed",
            "orchestrationExecutionReviewed",
            "Controlled adapter orchestration execution evidence was reviewed",
            "human_confirmation_orchestration_execution_not_reviewed",
        ),
        (
            "risk-approval-still-valid",
            "riskApprovalStillValid",
            "Risk approval remains valid for the selected strategy and adapter",
            "human_confirmation_risk_approval_not_current",
        ),
        (
            "paper-execution-reviewed",
            "paperExecutionReviewed",
            "Paper execution result was reviewed before final confirmation",
            "human_confirmation_paper_execution_not_reviewed",
        ),
        (
            "kill-switch-ready",
            "killSwitchReady",
            "Kill switch and rollback contacts are ready",
            "human_confirmation_kill_switch_not_ready",
        ),
        (
            "operator-confirmed-final-boundary",
            "operatorConfirmedFinalBoundary",
            "Operator confirmed no automatic live routing is enabled by this record",
            "human_confirmation_final_boundary_missing",
        ),
    ]


def build_execution_adapter_sandbox_probe_plan(
    human_confirmation: dict[str, Any],
    *,
    adapter_id: str = "",
    probe_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    sandbox_probe_plan_id: str | None = None,
) -> ExecutionAdapterSandboxProbePlanResult:
    if not isinstance(human_confirmation, dict):
        raise ValueError("execution_adapter_human_confirmation_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    human_confirmation_id = str(human_confirmation.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(human_confirmation.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(human_confirmation.get("dryRunId") or "").strip()
    acceptance_id = str(human_confirmation.get("acceptanceId") or "").strip()
    execution_id = str(human_confirmation.get("executionId") or "").strip()
    plan_id = str(human_confirmation.get("planId") or "").strip()
    binding_id = str(human_confirmation.get("bindingId") or "").strip()
    materialization_id = str(human_confirmation.get("materializationId") or "").strip()
    manifest_validation_id = str(human_confirmation.get("manifestValidationId") or "").strip()
    confirmation_adapter_id = str(human_confirmation.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or confirmation_adapter_id).strip()
    market = str(human_confirmation.get("market") or "").strip()
    route = str(human_confirmation.get("route") or "").strip()
    normalized_probe_mode = str(probe_mode or "manual_sandbox_probe_plan").strip()
    confirmation_mode = str(human_confirmation.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(human_confirmation.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(human_confirmation.get("orchestrationMode") or "").strip()
    acceptance_mode = str(human_confirmation.get("acceptanceMode") or "").strip()
    execution_mode = str(human_confirmation.get("executionMode") or "").strip()
    reload_mode = str(human_confirmation.get("reloadMode") or "").strip()
    maintenance_window_id = str(human_confirmation.get("maintenanceWindowId") or "").strip()
    binding_mode = str(human_confirmation.get("bindingMode") or "").strip()
    manifest_path = str(human_confirmation.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in human_confirmation.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not human_confirmation_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_orchestration_execution_id_required")
    if not dry_run_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_materialization_id_required")
    if not confirmation_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_adapter_id_required")
    if requested_adapter_id != confirmation_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_sandbox_probe_plan_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_sandbox_probe_plan_route_invalid")
    if not normalized_probe_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_mode_required")
    if not confirmation_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_sandbox_probe_plan_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_sandbox_probe_plan_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_sandbox_probe_plan_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_sandbox_probe_plan_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_sandbox_probe_plan_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(human_confirmation.get("status") or "") != "confirmation_recorded":
        blocked_reasons.append("sandbox_probe_human_confirmation_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("sandbox_probe_plan_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("sandbox_probe_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_sandbox_probe_plan_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSandboxProbePlanResult(
        sandbox_probe_plan_id=str(
            sandbox_probe_plan_id
            or f"execution-adapter-sandbox-probe-plan-{human_confirmation_id}-{uuid4()}"
        ),
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=confirmation_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "probe_plan_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        probe_mode=normalized_probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_sandbox_probe_plan_to_payload(
    result: ExecutionAdapterSandboxProbePlanResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_probe_plan_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_sandbox_probe_plan":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    sandbox_probe_plan_id = str(metadata.get("sandboxProbePlanId") or getattr(event, "event_id", "")).strip()
    human_confirmation_id = str(metadata.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    probe_mode = str(metadata.get("probeMode") or "manual_sandbox_probe_plan").strip()
    confirmation_mode = str(metadata.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(metadata.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not sandbox_probe_plan_id
        or not human_confirmation_id
        or not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "probe_plan_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_sandbox_probe_plan_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "sandboxProbePlanId": sandbox_probe_plan_id,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "probeMode": probe_mode,
        "confirmationMode": confirmation_mode,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_probe_plan_to_audit_event_payload(
    result: ExecutionAdapterSandboxProbePlanResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.sandbox_probe_plan_id,
        "eventType": "execution_adapter_sandbox_probe_plan",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-sandbox-probe-plan",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter sandbox probe plan {status_label} as {result.status}.",
        "detail": "Sandbox probe planning records operator readiness only; broker connections, probe execution, and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_sandbox_probe_plan_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "human-confirmation-reviewed",
            "humanConfirmationReviewed",
            "Final human confirmation was reviewed before sandbox probe planning",
            "sandbox_probe_human_confirmation_not_reviewed",
        ),
        (
            "testnet-endpoint-locked",
            "testnetEndpointLocked",
            "Sandbox or testnet endpoint is locked for this probe",
            "sandbox_probe_testnet_endpoint_not_locked",
        ),
        (
            "credentials-are-sandbox-only",
            "credentialsAreSandboxOnly",
            "Credentials are sandbox/testnet only",
            "sandbox_probe_credentials_not_sandbox_only",
        ),
        (
            "order-routing-disabled",
            "orderRoutingDisabled",
            "Order routing remains disabled while planning the probe",
            "sandbox_probe_order_routing_not_disabled",
        ),
        (
            "probe-limits-documented",
            "probeLimitsDocumented",
            "Probe limits and rollback owner are documented",
            "sandbox_probe_limits_not_documented",
        ),
    ]


def build_execution_adapter_sandbox_probe_execution(
    sandbox_probe_plan: dict[str, Any],
    *,
    adapter_id: str = "",
    probe_execution_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    sandbox_probe_execution_id: str | None = None,
) -> ExecutionAdapterSandboxProbeExecutionResult:
    if not isinstance(sandbox_probe_plan, dict):
        raise ValueError("execution_adapter_sandbox_probe_plan_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    sandbox_probe_plan_id = str(sandbox_probe_plan.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(sandbox_probe_plan.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(sandbox_probe_plan.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(sandbox_probe_plan.get("dryRunId") or "").strip()
    acceptance_id = str(sandbox_probe_plan.get("acceptanceId") or "").strip()
    execution_id = str(sandbox_probe_plan.get("executionId") or "").strip()
    plan_id = str(sandbox_probe_plan.get("planId") or "").strip()
    binding_id = str(sandbox_probe_plan.get("bindingId") or "").strip()
    materialization_id = str(sandbox_probe_plan.get("materializationId") or "").strip()
    manifest_validation_id = str(sandbox_probe_plan.get("manifestValidationId") or "").strip()
    plan_adapter_id = str(sandbox_probe_plan.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or plan_adapter_id).strip()
    market = str(sandbox_probe_plan.get("market") or "").strip()
    route = str(sandbox_probe_plan.get("route") or "").strip()
    normalized_probe_execution_mode = str(probe_execution_mode or "manual_readonly_sandbox_probe").strip()
    probe_mode = str(sandbox_probe_plan.get("probeMode") or "").strip()
    confirmation_mode = str(sandbox_probe_plan.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(sandbox_probe_plan.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(sandbox_probe_plan.get("orchestrationMode") or "").strip()
    acceptance_mode = str(sandbox_probe_plan.get("acceptanceMode") or "").strip()
    execution_mode = str(sandbox_probe_plan.get("executionMode") or "").strip()
    reload_mode = str(sandbox_probe_plan.get("reloadMode") or "").strip()
    maintenance_window_id = str(sandbox_probe_plan.get("maintenanceWindowId") or "").strip()
    binding_mode = str(sandbox_probe_plan.get("bindingMode") or "").strip()
    manifest_path = str(sandbox_probe_plan.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in sandbox_probe_plan.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_orchestration_execution_id_required")
    if not dry_run_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_materialization_id_required")
    if not plan_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_adapter_id_required")
    if requested_adapter_id != plan_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_sandbox_probe_execution_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_sandbox_probe_execution_route_invalid")
    if not normalized_probe_execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_mode_required")
    if not probe_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_probe_mode_required")
    if not confirmation_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_sandbox_probe_execution_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_sandbox_probe_execution_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_sandbox_probe_execution_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(sandbox_probe_plan.get("status") or "") != "probe_plan_recorded":
        blocked_reasons.append("sandbox_probe_execution_plan_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("sandbox_probe_execution_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("sandbox_probe_execution_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_sandbox_probe_execution_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSandboxProbeExecutionResult(
        sandbox_probe_execution_id=str(
            sandbox_probe_execution_id
            or f"execution-adapter-sandbox-probe-execution-{sandbox_probe_plan_id}-{uuid4()}"
        ),
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=plan_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "probe_execution_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        probe_execution_mode=normalized_probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_sandbox_probe_execution_to_payload(
    result: ExecutionAdapterSandboxProbeExecutionResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_probe_execution_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_sandbox_probe_execution":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    sandbox_probe_execution_id = str(metadata.get("sandboxProbeExecutionId") or getattr(event, "event_id", "")).strip()
    sandbox_probe_plan_id = str(metadata.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(metadata.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    probe_execution_mode = str(metadata.get("probeExecutionMode") or "manual_readonly_sandbox_probe").strip()
    probe_mode = str(metadata.get("probeMode") or "").strip()
    confirmation_mode = str(metadata.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(metadata.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not sandbox_probe_execution_id
        or not sandbox_probe_plan_id
        or not human_confirmation_id
        or not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "probe_execution_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_sandbox_probe_execution_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "sandboxProbeExecutionId": sandbox_probe_execution_id,
        "sandboxProbePlanId": sandbox_probe_plan_id,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "probeExecutionMode": probe_execution_mode,
        "probeMode": probe_mode,
        "confirmationMode": confirmation_mode,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_probe_execution_to_audit_event_payload(
    result: ExecutionAdapterSandboxProbeExecutionResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.sandbox_probe_execution_id,
        "eventType": "execution_adapter_sandbox_probe_execution",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-sandbox-probe-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter sandbox probe execution {status_label} as {result.status}.",
        "detail": "Sandbox probe execution records read-only handshake and order-schema evidence only; order submission and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_sandbox_probe_execution_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "probe-plan-reviewed",
            "probePlanReviewed",
            "Sandbox probe plan was reviewed before execution evidence was recorded",
            "sandbox_probe_execution_plan_not_reviewed",
        ),
        (
            "readonly-handshake-captured",
            "readonlyHandshakeCaptured",
            "Read-only sandbox or testnet handshake evidence was captured",
            "sandbox_probe_execution_readonly_handshake_missing",
        ),
        (
            "account-snapshot-redacted",
            "accountSnapshotRedacted",
            "Account snapshot evidence is redacted and contains no secret values",
            "sandbox_probe_execution_account_snapshot_not_redacted",
        ),
        (
            "order-schema-validated",
            "orderSchemaValidated",
            "Order schema validation was performed without submitting an order",
            "sandbox_probe_execution_order_schema_not_validated",
        ),
        (
            "operator-confirmed-no-orders-submitted",
            "operatorConfirmedNoOrdersSubmitted",
            "Operator confirmed no sandbox, paper, or live orders were submitted",
            "sandbox_probe_execution_no_order_boundary_missing",
        ),
    ]


def build_execution_adapter_sandbox_probe_review(
    sandbox_probe_execution: dict[str, Any],
    *,
    adapter_id: str = "",
    review_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    sandbox_probe_review_id: str | None = None,
) -> ExecutionAdapterSandboxProbeReviewResult:
    if not isinstance(sandbox_probe_execution, dict):
        raise ValueError("execution_adapter_sandbox_probe_review_execution_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    sandbox_probe_execution_id = str(sandbox_probe_execution.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(sandbox_probe_execution.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(sandbox_probe_execution.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(sandbox_probe_execution.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(sandbox_probe_execution.get("dryRunId") or "").strip()
    acceptance_id = str(sandbox_probe_execution.get("acceptanceId") or "").strip()
    execution_id = str(sandbox_probe_execution.get("executionId") or "").strip()
    plan_id = str(sandbox_probe_execution.get("planId") or "").strip()
    binding_id = str(sandbox_probe_execution.get("bindingId") or "").strip()
    materialization_id = str(sandbox_probe_execution.get("materializationId") or "").strip()
    manifest_validation_id = str(sandbox_probe_execution.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(sandbox_probe_execution.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(sandbox_probe_execution.get("market") or "").strip()
    route = str(sandbox_probe_execution.get("route") or "").strip()
    normalized_review_mode = str(review_mode or "manual_sandbox_probe_review").strip()
    probe_execution_mode = str(sandbox_probe_execution.get("probeExecutionMode") or "").strip()
    probe_mode = str(sandbox_probe_execution.get("probeMode") or "").strip()
    confirmation_mode = str(sandbox_probe_execution.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(sandbox_probe_execution.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(sandbox_probe_execution.get("orchestrationMode") or "").strip()
    acceptance_mode = str(sandbox_probe_execution.get("acceptanceMode") or "").strip()
    execution_mode = str(sandbox_probe_execution.get("executionMode") or "").strip()
    reload_mode = str(sandbox_probe_execution.get("reloadMode") or "").strip()
    maintenance_window_id = str(sandbox_probe_execution.get("maintenanceWindowId") or "").strip()
    binding_mode = str(sandbox_probe_execution.get("bindingMode") or "").strip()
    manifest_path = str(sandbox_probe_execution.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in sandbox_probe_execution.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_sandbox_probe_review_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_sandbox_probe_review_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_sandbox_probe_review_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_sandbox_probe_review_orchestration_execution_id_required")
    if not dry_run_id:
        raise ValueError("execution_adapter_sandbox_probe_review_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_sandbox_probe_review_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_sandbox_probe_review_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_sandbox_probe_review_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_sandbox_probe_review_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_sandbox_probe_review_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_review_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_review_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_review_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_sandbox_probe_review_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_sandbox_probe_review_route_invalid")
    if not normalized_review_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_mode_required")
    if not probe_execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_probe_execution_mode_required")
    if not probe_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_probe_mode_required")
    if not confirmation_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_sandbox_probe_review_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_sandbox_probe_review_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_sandbox_probe_review_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_sandbox_probe_review_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_sandbox_probe_review_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(sandbox_probe_execution.get("status") or "") != "probe_execution_recorded":
        blocked_reasons.append("sandbox_probe_review_execution_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("sandbox_probe_review_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("sandbox_probe_review_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_sandbox_probe_review_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSandboxProbeReviewResult(
        sandbox_probe_review_id=str(
            sandbox_probe_review_id
            or f"execution-adapter-sandbox-probe-review-{sandbox_probe_execution_id}-{uuid4()}"
        ),
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "probe_review_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        review_mode=normalized_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_sandbox_probe_review_to_payload(
    result: ExecutionAdapterSandboxProbeReviewResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "reviewMode": result.review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_probe_review_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_sandbox_probe_review":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    sandbox_probe_review_id = str(metadata.get("sandboxProbeReviewId") or getattr(event, "event_id", "")).strip()
    sandbox_probe_execution_id = str(metadata.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(metadata.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(metadata.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    review_mode = str(metadata.get("reviewMode") or "manual_sandbox_probe_review").strip()
    probe_execution_mode = str(metadata.get("probeExecutionMode") or "").strip()
    probe_mode = str(metadata.get("probeMode") or "").strip()
    confirmation_mode = str(metadata.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(metadata.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not sandbox_probe_review_id
        or not sandbox_probe_execution_id
        or not sandbox_probe_plan_id
        or not human_confirmation_id
        or not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "probe_review_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_sandbox_probe_review_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "sandboxProbeReviewId": sandbox_probe_review_id,
        "sandboxProbeExecutionId": sandbox_probe_execution_id,
        "sandboxProbePlanId": sandbox_probe_plan_id,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "reviewMode": review_mode,
        "probeExecutionMode": probe_execution_mode,
        "probeMode": probe_mode,
        "confirmationMode": confirmation_mode,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_probe_review_to_audit_event_payload(
    result: ExecutionAdapterSandboxProbeReviewResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.sandbox_probe_review_id,
        "eventType": "execution_adapter_sandbox_probe_review",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-sandbox-probe-review",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter sandbox probe review {status_label} as {result.status}.",
        "detail": "Sandbox probe review records operator attestation for read-only evidence; production routing remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "reviewMode": result.review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_sandbox_probe_review_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "probe-execution-reviewed",
            "probeExecutionReviewed",
            "Read-only sandbox probe execution evidence was reviewed",
            "sandbox_probe_review_execution_not_reviewed",
        ),
        (
            "readonly-evidence-matches-plan",
            "readonlyEvidenceMatchesPlan",
            "Read-only evidence matches the approved sandbox probe plan",
            "sandbox_probe_review_evidence_plan_mismatch",
        ),
        (
            "redacted-snapshot-archived",
            "redactedSnapshotArchived",
            "Redacted account and response snapshots were archived",
            "sandbox_probe_review_redacted_snapshot_not_archived",
        ),
        (
            "order-schema-risk-reviewed",
            "orderSchemaRiskReviewed",
            "Order schema and routing risk were reviewed without order submission",
            "sandbox_probe_review_order_schema_risk_not_reviewed",
        ),
        (
            "production-route-still-blocked",
            "productionRouteStillBlocked",
            "Production route remains blocked after sandbox probe review",
            "sandbox_probe_review_production_route_not_blocked",
        ),
    ]


def build_execution_adapter_production_route_review(
    sandbox_probe_review: dict[str, Any],
    *,
    adapter_id: str = "",
    review_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    production_route_review_id: str | None = None,
) -> ExecutionAdapterProductionRouteReviewResult:
    if not isinstance(sandbox_probe_review, dict):
        raise ValueError("execution_adapter_production_route_review_probe_review_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    sandbox_probe_review_id = str(sandbox_probe_review.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(sandbox_probe_review.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(sandbox_probe_review.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(sandbox_probe_review.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(sandbox_probe_review.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(sandbox_probe_review.get("dryRunId") or "").strip()
    acceptance_id = str(sandbox_probe_review.get("acceptanceId") or "").strip()
    execution_id = str(sandbox_probe_review.get("executionId") or "").strip()
    plan_id = str(sandbox_probe_review.get("planId") or "").strip()
    binding_id = str(sandbox_probe_review.get("bindingId") or "").strip()
    materialization_id = str(sandbox_probe_review.get("materializationId") or "").strip()
    manifest_validation_id = str(sandbox_probe_review.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(sandbox_probe_review.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(sandbox_probe_review.get("market") or "").strip()
    route = str(sandbox_probe_review.get("route") or "").strip()
    normalized_review_mode = str(review_mode or "manual_production_route_review").strip()
    sandbox_review_mode = str(sandbox_probe_review.get("reviewMode") or "").strip()
    probe_execution_mode = str(sandbox_probe_review.get("probeExecutionMode") or "").strip()
    probe_mode = str(sandbox_probe_review.get("probeMode") or "").strip()
    confirmation_mode = str(sandbox_probe_review.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(sandbox_probe_review.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(sandbox_probe_review.get("orchestrationMode") or "").strip()
    acceptance_mode = str(sandbox_probe_review.get("acceptanceMode") or "").strip()
    execution_mode = str(sandbox_probe_review.get("executionMode") or "").strip()
    reload_mode = str(sandbox_probe_review.get("reloadMode") or "").strip()
    maintenance_window_id = str(sandbox_probe_review.get("maintenanceWindowId") or "").strip()
    binding_mode = str(sandbox_probe_review.get("bindingMode") or "").strip()
    manifest_path = str(sandbox_probe_review.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in sandbox_probe_review.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_production_route_review_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_production_route_review_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_production_route_review_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_production_route_review_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_production_route_review_orchestration_execution_id_required")
    if not dry_run_id:
        raise ValueError("execution_adapter_production_route_review_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_production_route_review_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_production_route_review_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_production_route_review_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_production_route_review_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_production_route_review_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_production_route_review_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_production_route_review_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_production_route_review_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_production_route_review_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_production_route_review_route_invalid")
    if not normalized_review_mode:
        raise ValueError("execution_adapter_production_route_review_mode_required")
    if not sandbox_review_mode:
        raise ValueError("execution_adapter_production_route_review_sandbox_review_mode_required")
    if not probe_execution_mode:
        raise ValueError("execution_adapter_production_route_review_probe_execution_mode_required")
    if not probe_mode:
        raise ValueError("execution_adapter_production_route_review_probe_mode_required")
    if not confirmation_mode:
        raise ValueError("execution_adapter_production_route_review_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_production_route_review_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_production_route_review_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_production_route_review_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_production_route_review_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_production_route_review_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_production_route_review_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_production_route_review_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_production_route_review_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_production_route_review_required_env_vars_required")

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_production_route_review_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(sandbox_probe_review.get("status") or "") != "probe_review_recorded":
        blocked_reasons.append("production_route_review_sandbox_review_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("production_route_review_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("production_route_review_route_not_live")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_production_route_review_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterProductionRouteReviewResult(
        production_route_review_id=str(
            production_route_review_id
            or f"execution-adapter-production-route-review-{sandbox_probe_review_id}-{uuid4()}"
        ),
        sandbox_probe_review_id=sandbox_probe_review_id,
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "route_review_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        review_mode=normalized_review_mode,
        sandbox_review_mode=sandbox_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_production_route_review_to_payload(
    result: ExecutionAdapterProductionRouteReviewResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "productionRouteReviewId": result.production_route_review_id,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "reviewMode": result.review_mode,
        "sandboxReviewMode": result.sandbox_review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_production_route_review_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_production_route_review":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    production_route_review_id = str(metadata.get("productionRouteReviewId") or getattr(event, "event_id", "")).strip()
    sandbox_probe_review_id = str(metadata.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(metadata.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(metadata.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(metadata.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    review_mode = str(metadata.get("reviewMode") or "manual_production_route_review").strip()
    sandbox_review_mode = str(metadata.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(metadata.get("probeExecutionMode") or "").strip()
    probe_mode = str(metadata.get("probeMode") or "").strip()
    confirmation_mode = str(metadata.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(metadata.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not production_route_review_id
        or not sandbox_probe_review_id
        or not sandbox_probe_execution_id
        or not sandbox_probe_plan_id
        or not human_confirmation_id
        or not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "route_review_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_production_route_review_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    return {
        "schemaVersion": 1,
        "productionRouteReviewId": production_route_review_id,
        "sandboxProbeReviewId": sandbox_probe_review_id,
        "sandboxProbeExecutionId": sandbox_probe_execution_id,
        "sandboxProbePlanId": sandbox_probe_plan_id,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "reviewMode": review_mode,
        "sandboxReviewMode": sandbox_review_mode,
        "probeExecutionMode": probe_execution_mode,
        "probeMode": probe_mode,
        "confirmationMode": confirmation_mode,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_production_route_review_to_audit_event_payload(
    result: ExecutionAdapterProductionRouteReviewResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.production_route_review_id,
        "eventType": "execution_adapter_production_route_review",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-production-route-review",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter production route review {status_label} as {result.status}.",
        "detail": "Production route review records operator attestation for live-route controls; live trading remains blocked.",
        "metadata": _redact_secret_fields(
            {
                "productionRouteReviewId": result.production_route_review_id,
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "reviewMode": result.review_mode,
                "sandboxReviewMode": result.sandbox_review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_production_route_review_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "sandbox-probe-review-accepted",
            "sandboxProbeReviewAccepted",
            "Recorded sandbox probe review was accepted as route-policy input",
            "production_route_review_sandbox_review_not_accepted",
        ),
        (
            "kill-switch-policy-reviewed",
            "killSwitchPolicyReviewed",
            "Kill-switch and emergency stop policy were reviewed",
            "production_route_review_kill_switch_policy_not_reviewed",
        ),
        (
            "order-routing-disabled-verified",
            "orderRoutingDisabledVerified",
            "Production order routing remains disabled after policy review",
            "production_route_review_order_routing_not_disabled",
        ),
        (
            "position-limit-policy-reviewed",
            "positionLimitPolicyReviewed",
            "Position limits and notional caps were reviewed",
            "production_route_review_position_limit_policy_not_reviewed",
        ),
        (
            "rollback-owner-recorded",
            "rollbackOwnerRecorded",
            "Rollback owner and escalation responsibility were recorded",
            "production_route_review_rollback_owner_not_recorded",
        ),
    ]


def build_execution_adapter_sandbox_order_schema_dry_run(
    production_route_review: dict[str, Any],
    *,
    adapter_id: str = "",
    dry_run_mode: str = "",
    order_intent: dict[str, Any] | None = None,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    sandbox_order_schema_dry_run_id: str | None = None,
) -> ExecutionAdapterSandboxOrderSchemaDryRunResult:
    if not isinstance(production_route_review, dict):
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_route_review_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    production_route_review_id = str(production_route_review.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(production_route_review.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(production_route_review.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(production_route_review.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(production_route_review.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(production_route_review.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(production_route_review.get("dryRunId") or "").strip()
    acceptance_id = str(production_route_review.get("acceptanceId") or "").strip()
    execution_id = str(production_route_review.get("executionId") or "").strip()
    plan_id = str(production_route_review.get("planId") or "").strip()
    binding_id = str(production_route_review.get("bindingId") or "").strip()
    materialization_id = str(production_route_review.get("materializationId") or "").strip()
    manifest_validation_id = str(production_route_review.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(production_route_review.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(production_route_review.get("market") or "").strip()
    route = str(production_route_review.get("route") or "").strip()
    normalized_dry_run_mode = str(dry_run_mode or "manual_sandbox_order_schema_dry_run").strip()
    review_mode = str(production_route_review.get("reviewMode") or "").strip()
    sandbox_review_mode = str(production_route_review.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(production_route_review.get("probeExecutionMode") or "").strip()
    probe_mode = str(production_route_review.get("probeMode") or "").strip()
    confirmation_mode = str(production_route_review.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(production_route_review.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(production_route_review.get("orchestrationMode") or "").strip()
    acceptance_mode = str(production_route_review.get("acceptanceMode") or "").strip()
    execution_mode = str(production_route_review.get("executionMode") or "").strip()
    reload_mode = str(production_route_review.get("reloadMode") or "").strip()
    maintenance_window_id = str(production_route_review.get("maintenanceWindowId") or "").strip()
    binding_mode = str(production_route_review.get("bindingMode") or "").strip()
    manifest_path = str(production_route_review.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in production_route_review.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not production_route_review_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_route_invalid")
    if not normalized_dry_run_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_mode_required")
    if not review_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_review_mode_required")
    if not sandbox_review_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_sandbox_review_mode_required")
    if not probe_execution_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_execution_mode_required")
    if not probe_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_probe_mode_required")
    if not confirmation_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_sandbox_order_schema_dry_run_required_env_vars_required")

    safe_order_intent = _redact_secret_fields(order_intent if isinstance(order_intent, dict) else {})
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_sandbox_order_schema_dry_run_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(production_route_review.get("status") or "") != "route_review_recorded":
        blocked_reasons.append("sandbox_order_schema_dry_run_route_review_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("sandbox_order_schema_dry_run_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("sandbox_order_schema_dry_run_route_not_live")
    if not _sandbox_order_schema_intent_is_valid(safe_order_intent):
        blocked_reasons.append("sandbox_order_schema_dry_run_order_intent_missing")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_sandbox_order_schema_dry_run_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSandboxOrderSchemaDryRunResult(
        sandbox_order_schema_dry_run_id=str(
            sandbox_order_schema_dry_run_id
            or f"execution-adapter-sandbox-order-schema-dry-run-{production_route_review_id}-{uuid4()}"
        ),
        production_route_review_id=production_route_review_id,
        sandbox_probe_review_id=sandbox_probe_review_id,
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=orchestration_dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "schema_dry_run_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        dry_run_mode=normalized_dry_run_mode,
        review_mode=review_mode,
        sandbox_review_mode=sandbox_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        order_intent=safe_order_intent,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_sandbox_order_schema_dry_run_to_payload(
    result: ExecutionAdapterSandboxOrderSchemaDryRunResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
        "productionRouteReviewId": result.production_route_review_id,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "dryRunMode": result.dry_run_mode,
        "reviewMode": result.review_mode,
        "sandboxReviewMode": result.sandbox_review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "orderIntent": result.order_intent,
        "orderSubmitted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_sandbox_order_schema_dry_run":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    schema_dry_run_id = str(metadata.get("sandboxOrderSchemaDryRunId") or getattr(event, "event_id", "")).strip()
    production_route_review_id = str(metadata.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(metadata.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(metadata.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(metadata.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(metadata.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    if (
        not schema_dry_run_id
        or not production_route_review_id
        or not sandbox_probe_review_id
        or not sandbox_probe_execution_id
        or not sandbox_probe_plan_id
        or not human_confirmation_id
        or not orchestration_execution_id
        or not orchestration_dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
        or not adapter_id
    ):
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "schema_dry_run_recorded"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_sandbox_order_schema_dry_run_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )
    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    order_intent = metadata.get("orderIntent") if isinstance(metadata.get("orderIntent"), dict) else {}

    return {
        "schemaVersion": 1,
        "sandboxOrderSchemaDryRunId": schema_dry_run_id,
        "productionRouteReviewId": production_route_review_id,
        "sandboxProbeReviewId": sandbox_probe_review_id,
        "sandboxProbeExecutionId": sandbox_probe_execution_id,
        "sandboxProbePlanId": sandbox_probe_plan_id,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": orchestration_dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": str(metadata.get("operator") or "local-operator").strip() or "local-operator",
        "recordedAt": recorded_at_value,
        "dryRunMode": str(metadata.get("dryRunMode") or "manual_sandbox_order_schema_dry_run").strip(),
        "reviewMode": str(metadata.get("reviewMode") or "").strip(),
        "sandboxReviewMode": str(metadata.get("sandboxReviewMode") or "").strip(),
        "probeExecutionMode": str(metadata.get("probeExecutionMode") or "").strip(),
        "probeMode": str(metadata.get("probeMode") or "").strip(),
        "confirmationMode": str(metadata.get("confirmationMode") or "").strip(),
        "orchestrationExecutionMode": str(metadata.get("orchestrationExecutionMode") or "").strip(),
        "orchestrationMode": str(metadata.get("orchestrationMode") or "").strip(),
        "acceptanceMode": str(metadata.get("acceptanceMode") or "").strip(),
        "executionMode": str(metadata.get("executionMode") or "").strip(),
        "reloadMode": str(metadata.get("reloadMode") or "").strip(),
        "maintenanceWindowId": str(metadata.get("maintenanceWindowId") or "").strip(),
        "bindingMode": str(metadata.get("bindingMode") or "").strip(),
        "manifestPath": str(metadata.get("manifestPath") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in metadata.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "orderIntent": _redact_secret_fields(order_intent),
        "orderSubmitted": False,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_order_schema_dry_run_to_audit_event_payload(
    result: ExecutionAdapterSandboxOrderSchemaDryRunResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.sandbox_order_schema_dry_run_id,
        "eventType": "execution_adapter_sandbox_order_schema_dry_run",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-sandbox-order-schema-dry-run",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} sandbox order schema dry-run {status_label} as {result.status}.",
        "detail": "Sandbox order schema dry-run records order intent validation only; no order is submitted.",
        "metadata": _redact_secret_fields(
            {
                "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
                "productionRouteReviewId": result.production_route_review_id,
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "dryRunMode": result.dry_run_mode,
                "reviewMode": result.review_mode,
                "sandboxReviewMode": result.sandbox_review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "orderIntent": result.order_intent,
                "orderSubmitted": False,
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def build_execution_adapter_paper_order_lifecycle(
    schema_dry_run: dict[str, Any],
    *,
    adapter_id: str = "",
    lifecycle_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    paper_order_lifecycle_id: str | None = None,
) -> ExecutionAdapterPaperOrderLifecycleResult:
    if not isinstance(schema_dry_run, dict):
        raise ValueError("execution_adapter_paper_order_lifecycle_schema_dry_run_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    schema_dry_run_id = str(schema_dry_run.get("sandboxOrderSchemaDryRunId") or "").strip()
    production_route_review_id = str(schema_dry_run.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(schema_dry_run.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(schema_dry_run.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(schema_dry_run.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(schema_dry_run.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(schema_dry_run.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(schema_dry_run.get("dryRunId") or "").strip()
    acceptance_id = str(schema_dry_run.get("acceptanceId") or "").strip()
    execution_id = str(schema_dry_run.get("executionId") or "").strip()
    plan_id = str(schema_dry_run.get("planId") or "").strip()
    binding_id = str(schema_dry_run.get("bindingId") or "").strip()
    materialization_id = str(schema_dry_run.get("materializationId") or "").strip()
    manifest_validation_id = str(schema_dry_run.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(schema_dry_run.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(schema_dry_run.get("market") or "").strip()
    route = str(schema_dry_run.get("route") or "").strip()
    normalized_lifecycle_mode = str(lifecycle_mode or "manual_paper_order_lifecycle_adapter").strip()
    dry_run_mode = str(schema_dry_run.get("dryRunMode") or "").strip()
    review_mode = str(schema_dry_run.get("reviewMode") or "").strip()
    sandbox_review_mode = str(schema_dry_run.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(schema_dry_run.get("probeExecutionMode") or "").strip()
    probe_mode = str(schema_dry_run.get("probeMode") or "").strip()
    confirmation_mode = str(schema_dry_run.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(schema_dry_run.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(schema_dry_run.get("orchestrationMode") or "").strip()
    acceptance_mode = str(schema_dry_run.get("acceptanceMode") or "").strip()
    execution_mode = str(schema_dry_run.get("executionMode") or "").strip()
    reload_mode = str(schema_dry_run.get("reloadMode") or "").strip()
    maintenance_window_id = str(schema_dry_run.get("maintenanceWindowId") or "").strip()
    binding_mode = str(schema_dry_run.get("bindingMode") or "").strip()
    manifest_path = str(schema_dry_run.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in schema_dry_run.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not schema_dry_run_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_schema_dry_run_id_required")
    if not production_route_review_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_paper_order_lifecycle_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_paper_order_lifecycle_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_paper_order_lifecycle_route_invalid")
    if not normalized_lifecycle_mode:
        raise ValueError("execution_adapter_paper_order_lifecycle_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_paper_order_lifecycle_required_env_vars_required")

    order_intent = _redact_secret_fields(schema_dry_run.get("orderIntent") if isinstance(schema_dry_run.get("orderIntent"), dict) else {})
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_paper_order_lifecycle_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(schema_dry_run.get("status") or "") != "schema_dry_run_recorded":
        blocked_reasons.append("paper_order_lifecycle_schema_dry_run_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("paper_order_lifecycle_manifest_validation_missing")
    if bool(schema_dry_run.get("orderSubmitted")):
        blocked_reasons.append("paper_order_lifecycle_schema_dry_run_order_submitted")
    if not _sandbox_order_schema_intent_is_valid(order_intent):
        blocked_reasons.append("paper_order_lifecycle_order_intent_invalid")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_paper_order_lifecycle_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterPaperOrderLifecycleResult(
        paper_order_lifecycle_id=str(
            paper_order_lifecycle_id
            or f"execution-adapter-paper-order-lifecycle-{schema_dry_run_id}-{uuid4()}"
        ),
        sandbox_order_schema_dry_run_id=schema_dry_run_id,
        production_route_review_id=production_route_review_id,
        sandbox_probe_review_id=sandbox_probe_review_id,
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=orchestration_dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "lifecycle_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        lifecycle_mode=normalized_lifecycle_mode,
        dry_run_mode=dry_run_mode,
        review_mode=review_mode,
        sandbox_review_mode=sandbox_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        order_intent=order_intent,
        lifecycle_steps=_execution_adapter_paper_order_lifecycle_steps("blocked" if unique_blocked_reasons else "recorded"),
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_paper_order_lifecycle_to_payload(
    result: ExecutionAdapterPaperOrderLifecycleResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "paperOrderLifecycleId": result.paper_order_lifecycle_id,
        "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
        "productionRouteReviewId": result.production_route_review_id,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "lifecycleMode": result.lifecycle_mode,
        "dryRunMode": result.dry_run_mode,
        "reviewMode": result.review_mode,
        "sandboxReviewMode": result.sandbox_review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "orderIntent": result.order_intent,
        "lifecycleSteps": result.lifecycle_steps,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_order_lifecycle_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_paper_order_lifecycle":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    paper_order_lifecycle_id = str(metadata.get("paperOrderLifecycleId") or getattr(event, "event_id", "")).strip()
    schema_dry_run_id = str(metadata.get("sandboxOrderSchemaDryRunId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    route = str(metadata.get("route") or "").strip()
    if not paper_order_lifecycle_id or not schema_dry_run_id or not adapter_id:
        return None
    if status not in {"blocked", "lifecycle_recorded"} or route not in {"paper", "live"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_paper_order_lifecycle_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )
    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    order_intent = metadata.get("orderIntent") if isinstance(metadata.get("orderIntent"), dict) else {}
    lifecycle_steps = metadata.get("lifecycleSteps") if isinstance(metadata.get("lifecycleSteps"), list) else []

    return {
        "schemaVersion": 1,
        "paperOrderLifecycleId": paper_order_lifecycle_id,
        "sandboxOrderSchemaDryRunId": schema_dry_run_id,
        "productionRouteReviewId": str(metadata.get("productionRouteReviewId") or "").strip(),
        "sandboxProbeReviewId": str(metadata.get("sandboxProbeReviewId") or "").strip(),
        "sandboxProbeExecutionId": str(metadata.get("sandboxProbeExecutionId") or "").strip(),
        "sandboxProbePlanId": str(metadata.get("sandboxProbePlanId") or "").strip(),
        "humanConfirmationId": str(metadata.get("humanConfirmationId") or "").strip(),
        "orchestrationExecutionId": str(metadata.get("orchestrationExecutionId") or "").strip(),
        "dryRunId": str(metadata.get("dryRunId") or "").strip(),
        "acceptanceId": str(metadata.get("acceptanceId") or "").strip(),
        "executionId": str(metadata.get("executionId") or "").strip(),
        "planId": str(metadata.get("planId") or "").strip(),
        "bindingId": str(metadata.get("bindingId") or "").strip(),
        "materializationId": str(metadata.get("materializationId") or "").strip(),
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": str(metadata.get("market") or "").strip(),
        "route": route,
        "status": status,
        "operator": str(metadata.get("operator") or "local-operator").strip() or "local-operator",
        "recordedAt": recorded_at_value,
        "lifecycleMode": str(metadata.get("lifecycleMode") or "manual_paper_order_lifecycle_adapter").strip(),
        "dryRunMode": str(metadata.get("dryRunMode") or "").strip(),
        "reviewMode": str(metadata.get("reviewMode") or "").strip(),
        "sandboxReviewMode": str(metadata.get("sandboxReviewMode") or "").strip(),
        "probeExecutionMode": str(metadata.get("probeExecutionMode") or "").strip(),
        "probeMode": str(metadata.get("probeMode") or "").strip(),
        "confirmationMode": str(metadata.get("confirmationMode") or "").strip(),
        "orchestrationExecutionMode": str(metadata.get("orchestrationExecutionMode") or "").strip(),
        "orchestrationMode": str(metadata.get("orchestrationMode") or "").strip(),
        "acceptanceMode": str(metadata.get("acceptanceMode") or "").strip(),
        "executionMode": str(metadata.get("executionMode") or "").strip(),
        "reloadMode": str(metadata.get("reloadMode") or "").strip(),
        "maintenanceWindowId": str(metadata.get("maintenanceWindowId") or "").strip(),
        "bindingMode": str(metadata.get("bindingMode") or "").strip(),
        "manifestPath": str(metadata.get("manifestPath") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in metadata.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "orderIntent": _redact_secret_fields(order_intent),
        "lifecycleSteps": [
            _redact_secret_fields(item)
            for item in lifecycle_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_order_lifecycle_to_audit_event_payload(
    result: ExecutionAdapterPaperOrderLifecycleResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.paper_order_lifecycle_id,
        "eventType": "execution_adapter_paper_order_lifecycle",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-paper-order-lifecycle",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} paper order lifecycle {status_label} as {result.status}.",
        "detail": "Paper order lifecycle adapter records local paper-only transitions; no live order is submitted.",
        "metadata": _redact_secret_fields(
            {
                "paperOrderLifecycleId": result.paper_order_lifecycle_id,
                "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
                "productionRouteReviewId": result.production_route_review_id,
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "lifecycleMode": result.lifecycle_mode,
                "dryRunMode": result.dry_run_mode,
                "reviewMode": result.review_mode,
                "sandboxReviewMode": result.sandbox_review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "orderIntent": result.order_intent,
                "lifecycleSteps": result.lifecycle_steps,
                "orderSubmitted": False,
                "liveOrderSubmitted": False,
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def build_execution_adapter_paper_route_runbook(
    paper_order_lifecycle: dict[str, Any],
    *,
    adapter_id: str = "",
    runbook_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    paper_route_runbook_id: str | None = None,
) -> ExecutionAdapterPaperRouteRunbookResult:
    if not isinstance(paper_order_lifecycle, dict):
        raise ValueError("execution_adapter_paper_route_runbook_lifecycle_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    paper_order_lifecycle_id = str(paper_order_lifecycle.get("paperOrderLifecycleId") or "").strip()
    schema_dry_run_id = str(paper_order_lifecycle.get("sandboxOrderSchemaDryRunId") or "").strip()
    production_route_review_id = str(paper_order_lifecycle.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(paper_order_lifecycle.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(paper_order_lifecycle.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(paper_order_lifecycle.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(paper_order_lifecycle.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(paper_order_lifecycle.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(paper_order_lifecycle.get("dryRunId") or "").strip()
    acceptance_id = str(paper_order_lifecycle.get("acceptanceId") or "").strip()
    execution_id = str(paper_order_lifecycle.get("executionId") or "").strip()
    plan_id = str(paper_order_lifecycle.get("planId") or "").strip()
    binding_id = str(paper_order_lifecycle.get("bindingId") or "").strip()
    materialization_id = str(paper_order_lifecycle.get("materializationId") or "").strip()
    manifest_validation_id = str(paper_order_lifecycle.get("manifestValidationId") or "").strip()
    execution_adapter_id = str(paper_order_lifecycle.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or execution_adapter_id).strip()
    market = str(paper_order_lifecycle.get("market") or "").strip()
    route = str(paper_order_lifecycle.get("route") or "").strip()
    normalized_runbook_mode = str(runbook_mode or "manual_paper_route_runbook").strip()
    lifecycle_mode = str(paper_order_lifecycle.get("lifecycleMode") or "").strip()
    dry_run_mode = str(paper_order_lifecycle.get("dryRunMode") or "").strip()
    review_mode = str(paper_order_lifecycle.get("reviewMode") or "").strip()
    sandbox_review_mode = str(paper_order_lifecycle.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(paper_order_lifecycle.get("probeExecutionMode") or "").strip()
    probe_mode = str(paper_order_lifecycle.get("probeMode") or "").strip()
    confirmation_mode = str(paper_order_lifecycle.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(paper_order_lifecycle.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(paper_order_lifecycle.get("orchestrationMode") or "").strip()
    acceptance_mode = str(paper_order_lifecycle.get("acceptanceMode") or "").strip()
    execution_mode = str(paper_order_lifecycle.get("executionMode") or "").strip()
    reload_mode = str(paper_order_lifecycle.get("reloadMode") or "").strip()
    maintenance_window_id = str(paper_order_lifecycle.get("maintenanceWindowId") or "").strip()
    binding_mode = str(paper_order_lifecycle.get("bindingMode") or "").strip()
    manifest_path = str(paper_order_lifecycle.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in paper_order_lifecycle.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not paper_order_lifecycle_id:
        raise ValueError("execution_adapter_paper_route_runbook_lifecycle_id_required")
    if not schema_dry_run_id:
        raise ValueError("execution_adapter_paper_route_runbook_schema_dry_run_id_required")
    if not production_route_review_id:
        raise ValueError("execution_adapter_paper_route_runbook_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_paper_route_runbook_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_paper_route_runbook_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_paper_route_runbook_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_paper_route_runbook_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_paper_route_runbook_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_paper_route_runbook_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_paper_route_runbook_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_paper_route_runbook_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_paper_route_runbook_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_paper_route_runbook_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_paper_route_runbook_materialization_id_required")
    if not execution_adapter_id:
        raise ValueError("execution_adapter_paper_route_runbook_adapter_id_required")
    if requested_adapter_id != execution_adapter_id:
        raise ValueError("execution_adapter_paper_route_runbook_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_paper_route_runbook_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_paper_route_runbook_route_invalid")
    if not normalized_runbook_mode:
        raise ValueError("execution_adapter_paper_route_runbook_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_paper_route_runbook_required_env_vars_required")

    order_intent = _redact_secret_fields(
        paper_order_lifecycle.get("orderIntent") if isinstance(paper_order_lifecycle.get("orderIntent"), dict) else {}
    )
    lifecycle_steps = [
        _redact_secret_fields(item)
        for item in paper_order_lifecycle.get("lifecycleSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]
    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_paper_route_runbook_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(paper_order_lifecycle.get("status") or "") != "lifecycle_recorded":
        blocked_reasons.append("paper_route_runbook_lifecycle_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("paper_route_runbook_manifest_validation_missing")
    if bool(paper_order_lifecycle.get("orderSubmitted")) or bool(paper_order_lifecycle.get("liveOrderSubmitted")):
        blocked_reasons.append("paper_route_runbook_prior_order_submission_detected")
    if not _sandbox_order_schema_intent_is_valid(order_intent):
        blocked_reasons.append("paper_route_runbook_order_intent_invalid")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_paper_route_runbook_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterPaperRouteRunbookResult(
        paper_route_runbook_id=str(
            paper_route_runbook_id
            or f"execution-adapter-paper-route-runbook-{paper_order_lifecycle_id}-{uuid4()}"
        ),
        paper_order_lifecycle_id=paper_order_lifecycle_id,
        sandbox_order_schema_dry_run_id=schema_dry_run_id,
        production_route_review_id=production_route_review_id,
        sandbox_probe_review_id=sandbox_probe_review_id,
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=orchestration_dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=execution_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "runbook_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        runbook_mode=normalized_runbook_mode,
        lifecycle_mode=lifecycle_mode,
        dry_run_mode=dry_run_mode,
        review_mode=review_mode,
        sandbox_review_mode=sandbox_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        order_intent=order_intent,
        lifecycle_steps=lifecycle_steps,
        runbook_steps=_execution_adapter_paper_route_runbook_steps(
            "blocked" if unique_blocked_reasons else "recorded"
        ),
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_paper_route_runbook_to_payload(
    result: ExecutionAdapterPaperRouteRunbookResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "paperRouteRunbookId": result.paper_route_runbook_id,
        "paperOrderLifecycleId": result.paper_order_lifecycle_id,
        "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
        "productionRouteReviewId": result.production_route_review_id,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "runbookMode": result.runbook_mode,
        "lifecycleMode": result.lifecycle_mode,
        "dryRunMode": result.dry_run_mode,
        "reviewMode": result.review_mode,
        "sandboxReviewMode": result.sandbox_review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "orderIntent": result.order_intent,
        "lifecycleSteps": result.lifecycle_steps,
        "runbookSteps": result.runbook_steps,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_route_runbook_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_paper_route_runbook":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    paper_route_runbook_id = str(metadata.get("paperRouteRunbookId") or getattr(event, "event_id", "")).strip()
    paper_order_lifecycle_id = str(metadata.get("paperOrderLifecycleId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    route = str(metadata.get("route") or "").strip()
    if not paper_route_runbook_id or not paper_order_lifecycle_id or not adapter_id:
        return None
    if status not in {"blocked", "runbook_recorded"} or route not in {"paper", "live"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_paper_route_runbook_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )
    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    order_intent = metadata.get("orderIntent") if isinstance(metadata.get("orderIntent"), dict) else {}
    lifecycle_steps = metadata.get("lifecycleSteps") if isinstance(metadata.get("lifecycleSteps"), list) else []
    runbook_steps = metadata.get("runbookSteps") if isinstance(metadata.get("runbookSteps"), list) else []

    return {
        "schemaVersion": 1,
        "paperRouteRunbookId": paper_route_runbook_id,
        "paperOrderLifecycleId": paper_order_lifecycle_id,
        "sandboxOrderSchemaDryRunId": str(metadata.get("sandboxOrderSchemaDryRunId") or "").strip(),
        "productionRouteReviewId": str(metadata.get("productionRouteReviewId") or "").strip(),
        "sandboxProbeReviewId": str(metadata.get("sandboxProbeReviewId") or "").strip(),
        "sandboxProbeExecutionId": str(metadata.get("sandboxProbeExecutionId") or "").strip(),
        "sandboxProbePlanId": str(metadata.get("sandboxProbePlanId") or "").strip(),
        "humanConfirmationId": str(metadata.get("humanConfirmationId") or "").strip(),
        "orchestrationExecutionId": str(metadata.get("orchestrationExecutionId") or "").strip(),
        "dryRunId": str(metadata.get("dryRunId") or "").strip(),
        "acceptanceId": str(metadata.get("acceptanceId") or "").strip(),
        "executionId": str(metadata.get("executionId") or "").strip(),
        "planId": str(metadata.get("planId") or "").strip(),
        "bindingId": str(metadata.get("bindingId") or "").strip(),
        "materializationId": str(metadata.get("materializationId") or "").strip(),
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": str(metadata.get("market") or "").strip(),
        "route": route,
        "status": status,
        "operator": str(metadata.get("operator") or "local-operator").strip() or "local-operator",
        "recordedAt": recorded_at_value,
        "runbookMode": str(metadata.get("runbookMode") or "manual_paper_route_runbook").strip(),
        "lifecycleMode": str(metadata.get("lifecycleMode") or "").strip(),
        "dryRunMode": str(metadata.get("dryRunMode") or "").strip(),
        "reviewMode": str(metadata.get("reviewMode") or "").strip(),
        "sandboxReviewMode": str(metadata.get("sandboxReviewMode") or "").strip(),
        "probeExecutionMode": str(metadata.get("probeExecutionMode") or "").strip(),
        "probeMode": str(metadata.get("probeMode") or "").strip(),
        "confirmationMode": str(metadata.get("confirmationMode") or "").strip(),
        "orchestrationExecutionMode": str(metadata.get("orchestrationExecutionMode") or "").strip(),
        "orchestrationMode": str(metadata.get("orchestrationMode") or "").strip(),
        "acceptanceMode": str(metadata.get("acceptanceMode") or "").strip(),
        "executionMode": str(metadata.get("executionMode") or "").strip(),
        "reloadMode": str(metadata.get("reloadMode") or "").strip(),
        "maintenanceWindowId": str(metadata.get("maintenanceWindowId") or "").strip(),
        "bindingMode": str(metadata.get("bindingMode") or "").strip(),
        "manifestPath": str(metadata.get("manifestPath") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in metadata.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "orderIntent": _redact_secret_fields(order_intent),
        "lifecycleSteps": [
            _redact_secret_fields(item)
            for item in lifecycle_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "runbookSteps": [
            _redact_secret_fields(item)
            for item in runbook_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_route_runbook_to_audit_event_payload(
    result: ExecutionAdapterPaperRouteRunbookResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.paper_route_runbook_id,
        "eventType": "execution_adapter_paper_route_runbook",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-paper-route-runbook",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} paper route runbook {status_label} as {result.status}.",
        "detail": "Paper route runbook records the controlled simulation plan only; no route is executed.",
        "metadata": _redact_secret_fields(
            {
                "paperRouteRunbookId": result.paper_route_runbook_id,
                "paperOrderLifecycleId": result.paper_order_lifecycle_id,
                "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
                "productionRouteReviewId": result.production_route_review_id,
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "runbookMode": result.runbook_mode,
                "lifecycleMode": result.lifecycle_mode,
                "dryRunMode": result.dry_run_mode,
                "reviewMode": result.review_mode,
                "sandboxReviewMode": result.sandbox_review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "orderIntent": result.order_intent,
                "lifecycleSteps": result.lifecycle_steps,
                "runbookSteps": result.runbook_steps,
                "orderSubmitted": False,
                "liveOrderSubmitted": False,
                "routeExecuted": False,
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_paper_route_runbook_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "paper-lifecycle-accepted",
            "paperLifecycleAccepted",
            "Paper order lifecycle was accepted as runbook input",
            "paper_route_runbook_lifecycle_not_accepted",
        ),
        (
            "paper-account-snapshot-captured",
            "paperAccountSnapshotCaptured",
            "Paper account snapshot was captured before simulation",
            "paper_route_runbook_account_snapshot_missing",
        ),
        (
            "risk-controls-verified",
            "riskControlsVerified",
            "Risk controls were verified before simulated routing",
            "paper_route_runbook_risk_controls_not_verified",
        ),
        (
            "replay-plan-recorded",
            "replayPlanRecorded",
            "Replay plan was recorded before simulation",
            "paper_route_runbook_replay_plan_missing",
        ),
        (
            "operator-confirmed-no-live-routing",
            "operatorConfirmedNoLiveRouting",
            "Operator confirmed no live route will be executed",
            "paper_route_runbook_no_live_route_boundary_missing",
        ),
    ]


def _execution_adapter_paper_route_runbook_steps(status: str) -> list[dict[str, Any]]:
    normalized_status = "recorded" if status == "recorded" else "blocked"
    return [
        {"id": "lifecycle-evidence-linked", "label": "Paper lifecycle evidence linked", "status": normalized_status},
        {"id": "paper-account-snapshot-bound", "label": "Paper account snapshot bound", "status": normalized_status},
        {"id": "risk-controls-verified", "label": "Risk controls verified", "status": normalized_status},
        {"id": "replay-plan-recorded", "label": "Replay plan recorded", "status": normalized_status},
    ]


def build_execution_adapter_ops_state(
    paper_route_runbook: dict[str, Any],
    *,
    adapter_id: str = "",
    ops_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    adapter_ops_state_id: str | None = None,
) -> ExecutionAdapterOpsStateResult:
    if not isinstance(paper_route_runbook, dict):
        raise ValueError("execution_adapter_ops_state_runbook_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    paper_route_runbook_id = str(paper_route_runbook.get("paperRouteRunbookId") or "").strip()
    paper_order_lifecycle_id = str(paper_route_runbook.get("paperOrderLifecycleId") or "").strip()
    schema_dry_run_id = str(paper_route_runbook.get("sandboxOrderSchemaDryRunId") or "").strip()
    production_route_review_id = str(paper_route_runbook.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(paper_route_runbook.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(paper_route_runbook.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(paper_route_runbook.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(paper_route_runbook.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(paper_route_runbook.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(paper_route_runbook.get("dryRunId") or "").strip()
    acceptance_id = str(paper_route_runbook.get("acceptanceId") or "").strip()
    execution_id = str(paper_route_runbook.get("executionId") or "").strip()
    plan_id = str(paper_route_runbook.get("planId") or "").strip()
    binding_id = str(paper_route_runbook.get("bindingId") or "").strip()
    materialization_id = str(paper_route_runbook.get("materializationId") or "").strip()
    manifest_validation_id = str(paper_route_runbook.get("manifestValidationId") or "").strip()
    runbook_adapter_id = str(paper_route_runbook.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or runbook_adapter_id).strip()
    market = str(paper_route_runbook.get("market") or "").strip()
    route = str(paper_route_runbook.get("route") or "").strip()
    normalized_ops_mode = str(ops_mode or "manual_adapter_ops_state").strip()
    runbook_mode = str(paper_route_runbook.get("runbookMode") or "").strip()
    lifecycle_mode = str(paper_route_runbook.get("lifecycleMode") or "").strip()
    dry_run_mode = str(paper_route_runbook.get("dryRunMode") or "").strip()
    review_mode = str(paper_route_runbook.get("reviewMode") or "").strip()
    sandbox_review_mode = str(paper_route_runbook.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(paper_route_runbook.get("probeExecutionMode") or "").strip()
    probe_mode = str(paper_route_runbook.get("probeMode") or "").strip()
    confirmation_mode = str(paper_route_runbook.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(paper_route_runbook.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(paper_route_runbook.get("orchestrationMode") or "").strip()
    acceptance_mode = str(paper_route_runbook.get("acceptanceMode") or "").strip()
    execution_mode = str(paper_route_runbook.get("executionMode") or "").strip()
    reload_mode = str(paper_route_runbook.get("reloadMode") or "").strip()
    maintenance_window_id = str(paper_route_runbook.get("maintenanceWindowId") or "").strip()
    binding_mode = str(paper_route_runbook.get("bindingMode") or "").strip()
    manifest_path = str(paper_route_runbook.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in paper_route_runbook.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not paper_route_runbook_id:
        raise ValueError("execution_adapter_ops_state_runbook_id_required")
    if not paper_order_lifecycle_id:
        raise ValueError("execution_adapter_ops_state_lifecycle_id_required")
    if not schema_dry_run_id:
        raise ValueError("execution_adapter_ops_state_schema_dry_run_id_required")
    if not production_route_review_id:
        raise ValueError("execution_adapter_ops_state_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_ops_state_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_ops_state_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_ops_state_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_ops_state_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_ops_state_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_ops_state_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_ops_state_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_ops_state_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_ops_state_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_ops_state_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_ops_state_materialization_id_required")
    if not runbook_adapter_id:
        raise ValueError("execution_adapter_ops_state_adapter_id_required")
    if requested_adapter_id != runbook_adapter_id:
        raise ValueError("execution_adapter_ops_state_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_ops_state_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_ops_state_route_invalid")
    if not normalized_ops_mode:
        raise ValueError("execution_adapter_ops_state_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_ops_state_required_env_vars_required")

    order_intent = _redact_secret_fields(
        paper_route_runbook.get("orderIntent") if isinstance(paper_route_runbook.get("orderIntent"), dict) else {}
    )
    lifecycle_steps = [
        _redact_secret_fields(item)
        for item in paper_route_runbook.get("lifecycleSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]
    runbook_steps = [
        _redact_secret_fields(item)
        for item in paper_route_runbook.get("runbookSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_ops_state_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(paper_route_runbook.get("status") or "") != "runbook_recorded":
        blocked_reasons.append("adapter_ops_paper_route_runbook_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("adapter_ops_state_manifest_validation_missing")
    if (
        bool(paper_route_runbook.get("orderSubmitted"))
        or bool(paper_route_runbook.get("liveOrderSubmitted"))
        or bool(paper_route_runbook.get("routeExecuted"))
    ):
        blocked_reasons.append("adapter_ops_prior_route_or_order_execution_detected")
    if not _sandbox_order_schema_intent_is_valid(order_intent):
        blocked_reasons.append("adapter_ops_order_intent_invalid")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_ops_state_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterOpsStateResult(
        adapter_ops_state_id=str(
            adapter_ops_state_id or f"execution-adapter-ops-state-{paper_route_runbook_id}-{uuid4()}"
        ),
        paper_route_runbook_id=paper_route_runbook_id,
        paper_order_lifecycle_id=paper_order_lifecycle_id,
        sandbox_order_schema_dry_run_id=schema_dry_run_id,
        production_route_review_id=production_route_review_id,
        sandbox_probe_review_id=sandbox_probe_review_id,
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=orchestration_dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=runbook_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "ops_state_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        ops_mode=normalized_ops_mode,
        runbook_mode=runbook_mode,
        lifecycle_mode=lifecycle_mode,
        dry_run_mode=dry_run_mode,
        review_mode=review_mode,
        sandbox_review_mode=sandbox_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        order_intent=order_intent,
        lifecycle_steps=lifecycle_steps,
        runbook_steps=runbook_steps,
        ops_steps=_execution_adapter_ops_state_steps("blocked" if unique_blocked_reasons else "recorded"),
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_ops_state_to_payload(result: ExecutionAdapterOpsStateResult) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "adapterOpsStateId": result.adapter_ops_state_id,
        "paperRouteRunbookId": result.paper_route_runbook_id,
        "paperOrderLifecycleId": result.paper_order_lifecycle_id,
        "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
        "productionRouteReviewId": result.production_route_review_id,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "opsMode": result.ops_mode,
        "runbookMode": result.runbook_mode,
        "lifecycleMode": result.lifecycle_mode,
        "dryRunMode": result.dry_run_mode,
        "reviewMode": result.review_mode,
        "sandboxReviewMode": result.sandbox_review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "orderIntent": result.order_intent,
        "lifecycleSteps": result.lifecycle_steps,
        "runbookSteps": result.runbook_steps,
        "opsSteps": result.ops_steps,
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_ops_state_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_ops_state":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    adapter_ops_state_id = str(metadata.get("adapterOpsStateId") or getattr(event, "event_id", "")).strip()
    paper_route_runbook_id = str(metadata.get("paperRouteRunbookId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    route = str(metadata.get("route") or "").strip()
    if not adapter_ops_state_id or not paper_route_runbook_id or not adapter_id:
        return None
    if status not in {"blocked", "ops_state_recorded"} or route not in {"paper", "live"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_ops_state_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )
    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    order_intent = metadata.get("orderIntent") if isinstance(metadata.get("orderIntent"), dict) else {}
    lifecycle_steps = metadata.get("lifecycleSteps") if isinstance(metadata.get("lifecycleSteps"), list) else []
    runbook_steps = metadata.get("runbookSteps") if isinstance(metadata.get("runbookSteps"), list) else []
    ops_steps = metadata.get("opsSteps") if isinstance(metadata.get("opsSteps"), list) else []

    return {
        "schemaVersion": 1,
        "adapterOpsStateId": adapter_ops_state_id,
        "paperRouteRunbookId": paper_route_runbook_id,
        "paperOrderLifecycleId": str(metadata.get("paperOrderLifecycleId") or "").strip(),
        "sandboxOrderSchemaDryRunId": str(metadata.get("sandboxOrderSchemaDryRunId") or "").strip(),
        "productionRouteReviewId": str(metadata.get("productionRouteReviewId") or "").strip(),
        "sandboxProbeReviewId": str(metadata.get("sandboxProbeReviewId") or "").strip(),
        "sandboxProbeExecutionId": str(metadata.get("sandboxProbeExecutionId") or "").strip(),
        "sandboxProbePlanId": str(metadata.get("sandboxProbePlanId") or "").strip(),
        "humanConfirmationId": str(metadata.get("humanConfirmationId") or "").strip(),
        "orchestrationExecutionId": str(metadata.get("orchestrationExecutionId") or "").strip(),
        "dryRunId": str(metadata.get("dryRunId") or "").strip(),
        "acceptanceId": str(metadata.get("acceptanceId") or "").strip(),
        "executionId": str(metadata.get("executionId") or "").strip(),
        "planId": str(metadata.get("planId") or "").strip(),
        "bindingId": str(metadata.get("bindingId") or "").strip(),
        "materializationId": str(metadata.get("materializationId") or "").strip(),
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": str(metadata.get("market") or "").strip(),
        "route": route,
        "status": status,
        "operator": str(metadata.get("operator") or "local-operator").strip() or "local-operator",
        "recordedAt": recorded_at_value,
        "opsMode": str(metadata.get("opsMode") or "manual_adapter_ops_state").strip(),
        "runbookMode": str(metadata.get("runbookMode") or "").strip(),
        "lifecycleMode": str(metadata.get("lifecycleMode") or "").strip(),
        "dryRunMode": str(metadata.get("dryRunMode") or "").strip(),
        "reviewMode": str(metadata.get("reviewMode") or "").strip(),
        "sandboxReviewMode": str(metadata.get("sandboxReviewMode") or "").strip(),
        "probeExecutionMode": str(metadata.get("probeExecutionMode") or "").strip(),
        "probeMode": str(metadata.get("probeMode") or "").strip(),
        "confirmationMode": str(metadata.get("confirmationMode") or "").strip(),
        "orchestrationExecutionMode": str(metadata.get("orchestrationExecutionMode") or "").strip(),
        "orchestrationMode": str(metadata.get("orchestrationMode") or "").strip(),
        "acceptanceMode": str(metadata.get("acceptanceMode") or "").strip(),
        "executionMode": str(metadata.get("executionMode") or "").strip(),
        "reloadMode": str(metadata.get("reloadMode") or "").strip(),
        "maintenanceWindowId": str(metadata.get("maintenanceWindowId") or "").strip(),
        "bindingMode": str(metadata.get("bindingMode") or "").strip(),
        "manifestPath": str(metadata.get("manifestPath") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in metadata.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "orderIntent": _redact_secret_fields(order_intent),
        "lifecycleSteps": [
            _redact_secret_fields(item)
            for item in lifecycle_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "runbookSteps": [
            _redact_secret_fields(item)
            for item in runbook_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "opsSteps": [
            _redact_secret_fields(item)
            for item in ops_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_ops_state_to_audit_event_payload(
    result: ExecutionAdapterOpsStateResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.adapter_ops_state_id,
        "eventType": "execution_adapter_ops_state",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-ops-state",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter ops state {status_label} as {result.status}.",
        "detail": "Adapter ops state records monitoring, kill-switch and reconciliation readiness only; live trading remains disabled.",
        "metadata": _redact_secret_fields(
            {
                "adapterOpsStateId": result.adapter_ops_state_id,
                "paperRouteRunbookId": result.paper_route_runbook_id,
                "paperOrderLifecycleId": result.paper_order_lifecycle_id,
                "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
                "productionRouteReviewId": result.production_route_review_id,
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "opsMode": result.ops_mode,
                "runbookMode": result.runbook_mode,
                "lifecycleMode": result.lifecycle_mode,
                "dryRunMode": result.dry_run_mode,
                "reviewMode": result.review_mode,
                "sandboxReviewMode": result.sandbox_review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "orderIntent": result.order_intent,
                "lifecycleSteps": result.lifecycle_steps,
                "runbookSteps": result.runbook_steps,
                "opsSteps": result.ops_steps,
                "orderSubmitted": False,
                "liveOrderSubmitted": False,
                "routeExecuted": False,
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def build_execution_adapter_paper_execution(
    adapter_ops_state: dict[str, Any],
    *,
    adapter_id: str = "",
    paper_execution_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    adapter_paper_execution_id: str | None = None,
) -> ExecutionAdapterPaperExecutionResult:
    if not isinstance(adapter_ops_state, dict):
        raise ValueError("execution_adapter_paper_execution_ops_state_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    adapter_ops_state_id = str(adapter_ops_state.get("adapterOpsStateId") or "").strip()
    paper_route_runbook_id = str(adapter_ops_state.get("paperRouteRunbookId") or "").strip()
    paper_order_lifecycle_id = str(adapter_ops_state.get("paperOrderLifecycleId") or "").strip()
    schema_dry_run_id = str(adapter_ops_state.get("sandboxOrderSchemaDryRunId") or "").strip()
    production_route_review_id = str(adapter_ops_state.get("productionRouteReviewId") or "").strip()
    sandbox_probe_review_id = str(adapter_ops_state.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_execution_id = str(adapter_ops_state.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_plan_id = str(adapter_ops_state.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(adapter_ops_state.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(adapter_ops_state.get("orchestrationExecutionId") or "").strip()
    orchestration_dry_run_id = str(adapter_ops_state.get("dryRunId") or "").strip()
    acceptance_id = str(adapter_ops_state.get("acceptanceId") or "").strip()
    execution_id = str(adapter_ops_state.get("executionId") or "").strip()
    plan_id = str(adapter_ops_state.get("planId") or "").strip()
    binding_id = str(adapter_ops_state.get("bindingId") or "").strip()
    materialization_id = str(adapter_ops_state.get("materializationId") or "").strip()
    manifest_validation_id = str(adapter_ops_state.get("manifestValidationId") or "").strip()
    ops_adapter_id = str(adapter_ops_state.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or ops_adapter_id).strip()
    market = str(adapter_ops_state.get("market") or "").strip()
    route = str(adapter_ops_state.get("route") or "").strip()
    normalized_paper_execution_mode = str(
        paper_execution_mode or "manual_adapter_paper_execution"
    ).strip()
    ops_mode = str(adapter_ops_state.get("opsMode") or "").strip()
    runbook_mode = str(adapter_ops_state.get("runbookMode") or "").strip()
    lifecycle_mode = str(adapter_ops_state.get("lifecycleMode") or "").strip()
    dry_run_mode = str(adapter_ops_state.get("dryRunMode") or "").strip()
    review_mode = str(adapter_ops_state.get("reviewMode") or "").strip()
    sandbox_review_mode = str(adapter_ops_state.get("sandboxReviewMode") or "").strip()
    probe_execution_mode = str(adapter_ops_state.get("probeExecutionMode") or "").strip()
    probe_mode = str(adapter_ops_state.get("probeMode") or "").strip()
    confirmation_mode = str(adapter_ops_state.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(adapter_ops_state.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(adapter_ops_state.get("orchestrationMode") or "").strip()
    acceptance_mode = str(adapter_ops_state.get("acceptanceMode") or "").strip()
    execution_mode = str(adapter_ops_state.get("executionMode") or "").strip()
    reload_mode = str(adapter_ops_state.get("reloadMode") or "").strip()
    maintenance_window_id = str(adapter_ops_state.get("maintenanceWindowId") or "").strip()
    binding_mode = str(adapter_ops_state.get("bindingMode") or "").strip()
    manifest_path = str(adapter_ops_state.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in adapter_ops_state.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not adapter_ops_state_id:
        raise ValueError("execution_adapter_paper_execution_ops_state_id_required")
    if not paper_route_runbook_id:
        raise ValueError("execution_adapter_paper_execution_runbook_id_required")
    if not paper_order_lifecycle_id:
        raise ValueError("execution_adapter_paper_execution_lifecycle_id_required")
    if not schema_dry_run_id:
        raise ValueError("execution_adapter_paper_execution_schema_dry_run_id_required")
    if not production_route_review_id:
        raise ValueError("execution_adapter_paper_execution_route_review_id_required")
    if not sandbox_probe_review_id:
        raise ValueError("execution_adapter_paper_execution_probe_review_id_required")
    if not sandbox_probe_execution_id:
        raise ValueError("execution_adapter_paper_execution_probe_execution_id_required")
    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_paper_execution_probe_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_paper_execution_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_paper_execution_orchestration_execution_id_required")
    if not orchestration_dry_run_id:
        raise ValueError("execution_adapter_paper_execution_orchestration_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_paper_execution_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_paper_execution_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_paper_execution_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_paper_execution_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_paper_execution_materialization_id_required")
    if not ops_adapter_id:
        raise ValueError("execution_adapter_paper_execution_adapter_id_required")
    if requested_adapter_id != ops_adapter_id:
        raise ValueError("execution_adapter_paper_execution_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_paper_execution_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_paper_execution_route_invalid")
    if not normalized_paper_execution_mode:
        raise ValueError("execution_adapter_paper_execution_mode_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_paper_execution_required_env_vars_required")

    order_intent = _redact_secret_fields(
        adapter_ops_state.get("orderIntent") if isinstance(adapter_ops_state.get("orderIntent"), dict) else {}
    )
    lifecycle_steps = [
        _redact_secret_fields(item)
        for item in adapter_ops_state.get("lifecycleSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]
    runbook_steps = [
        _redact_secret_fields(item)
        for item in adapter_ops_state.get("runbookSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]
    ops_steps = [
        _redact_secret_fields(item)
        for item in adapter_ops_state.get("opsSteps", [])
        if isinstance(item, dict) and str(item.get("id") or "").strip()
    ]

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_paper_execution_specs():
        confirmed = bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(adapter_ops_state.get("status") or "") != "ops_state_recorded":
        blocked_reasons.append("adapter_paper_execution_ops_state_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("adapter_paper_execution_manifest_validation_missing")
    if (
        bool(adapter_ops_state.get("orderSubmitted"))
        or bool(adapter_ops_state.get("liveOrderSubmitted"))
        or bool(adapter_ops_state.get("routeExecuted"))
    ):
        blocked_reasons.append("adapter_paper_execution_prior_route_or_order_execution_detected")
    if bool(adapter_ops_state.get("liveTradingAllowed")):
        blocked_reasons.append("adapter_paper_execution_live_trading_enabled_detected")
    if not _sandbox_order_schema_intent_is_valid(order_intent):
        blocked_reasons.append("adapter_paper_execution_order_intent_invalid")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_paper_execution_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    paper_execution_id = str(
        adapter_paper_execution_id
        or f"execution-adapter-paper-execution-{adapter_ops_state_id}-{uuid4()}"
    )
    return ExecutionAdapterPaperExecutionResult(
        adapter_paper_execution_id=paper_execution_id,
        adapter_ops_state_id=adapter_ops_state_id,
        paper_route_runbook_id=paper_route_runbook_id,
        paper_order_lifecycle_id=paper_order_lifecycle_id,
        sandbox_order_schema_dry_run_id=schema_dry_run_id,
        production_route_review_id=production_route_review_id,
        sandbox_probe_review_id=sandbox_probe_review_id,
        sandbox_probe_execution_id=sandbox_probe_execution_id,
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=orchestration_dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=ops_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "paper_execution_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        paper_execution_mode=normalized_paper_execution_mode,
        ops_mode=ops_mode,
        runbook_mode=runbook_mode,
        lifecycle_mode=lifecycle_mode,
        dry_run_mode=dry_run_mode,
        review_mode=review_mode,
        sandbox_review_mode=sandbox_review_mode,
        probe_execution_mode=probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        order_intent=order_intent,
        lifecycle_steps=lifecycle_steps,
        runbook_steps=runbook_steps,
        ops_steps=ops_steps,
        paper_execution_steps=_execution_adapter_paper_execution_steps(
            "blocked" if unique_blocked_reasons else "recorded"
        ),
        simulated_fill=_execution_adapter_paper_execution_simulated_fill(
            order_intent,
            adapter_paper_execution_id=paper_execution_id,
            blocked=bool(unique_blocked_reasons),
        ),
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_secret_fields(metadata or {}),
        live_trading_allowed=False,
    )


def execution_adapter_paper_execution_to_payload(
    result: ExecutionAdapterPaperExecutionResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "adapterPaperExecutionId": result.adapter_paper_execution_id,
        "adapterOpsStateId": result.adapter_ops_state_id,
        "paperRouteRunbookId": result.paper_route_runbook_id,
        "paperOrderLifecycleId": result.paper_order_lifecycle_id,
        "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
        "productionRouteReviewId": result.production_route_review_id,
        "sandboxProbeReviewId": result.sandbox_probe_review_id,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "paperExecutionMode": result.paper_execution_mode,
        "opsMode": result.ops_mode,
        "runbookMode": result.runbook_mode,
        "lifecycleMode": result.lifecycle_mode,
        "dryRunMode": result.dry_run_mode,
        "reviewMode": result.review_mode,
        "sandboxReviewMode": result.sandbox_review_mode,
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "orderIntent": result.order_intent,
        "lifecycleSteps": result.lifecycle_steps,
        "runbookSteps": result.runbook_steps,
        "opsSteps": result.ops_steps,
        "paperExecutionSteps": result.paper_execution_steps,
        "simulatedFill": result.simulated_fill,
        "paperFillRecorded": result.status == "paper_execution_recorded",
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_execution_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_paper_execution":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    adapter_paper_execution_id = str(
        metadata.get("adapterPaperExecutionId") or getattr(event, "event_id", "")
    ).strip()
    adapter_ops_state_id = str(metadata.get("adapterOpsStateId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    route = str(metadata.get("route") or "").strip()
    if not adapter_paper_execution_id or not adapter_ops_state_id or not adapter_id:
        return None
    if status not in {"blocked", "paper_execution_recorded"} or route not in {"paper", "live"}:
        return None

    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_paper_execution_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )
    recorded_at = getattr(event, "created_at", None)
    recorded_at_value = (
        recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    )
    order_intent = metadata.get("orderIntent") if isinstance(metadata.get("orderIntent"), dict) else {}
    lifecycle_steps = metadata.get("lifecycleSteps") if isinstance(metadata.get("lifecycleSteps"), list) else []
    runbook_steps = metadata.get("runbookSteps") if isinstance(metadata.get("runbookSteps"), list) else []
    ops_steps = metadata.get("opsSteps") if isinstance(metadata.get("opsSteps"), list) else []
    paper_execution_steps = (
        metadata.get("paperExecutionSteps") if isinstance(metadata.get("paperExecutionSteps"), list) else []
    )
    simulated_fill = metadata.get("simulatedFill") if isinstance(metadata.get("simulatedFill"), dict) else {}

    return {
        "schemaVersion": 1,
        "adapterPaperExecutionId": adapter_paper_execution_id,
        "adapterOpsStateId": adapter_ops_state_id,
        "paperRouteRunbookId": str(metadata.get("paperRouteRunbookId") or "").strip(),
        "paperOrderLifecycleId": str(metadata.get("paperOrderLifecycleId") or "").strip(),
        "sandboxOrderSchemaDryRunId": str(metadata.get("sandboxOrderSchemaDryRunId") or "").strip(),
        "productionRouteReviewId": str(metadata.get("productionRouteReviewId") or "").strip(),
        "sandboxProbeReviewId": str(metadata.get("sandboxProbeReviewId") or "").strip(),
        "sandboxProbeExecutionId": str(metadata.get("sandboxProbeExecutionId") or "").strip(),
        "sandboxProbePlanId": str(metadata.get("sandboxProbePlanId") or "").strip(),
        "humanConfirmationId": str(metadata.get("humanConfirmationId") or "").strip(),
        "orchestrationExecutionId": str(metadata.get("orchestrationExecutionId") or "").strip(),
        "dryRunId": str(metadata.get("dryRunId") or "").strip(),
        "acceptanceId": str(metadata.get("acceptanceId") or "").strip(),
        "executionId": str(metadata.get("executionId") or "").strip(),
        "planId": str(metadata.get("planId") or "").strip(),
        "bindingId": str(metadata.get("bindingId") or "").strip(),
        "materializationId": str(metadata.get("materializationId") or "").strip(),
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": str(metadata.get("market") or "").strip(),
        "route": route,
        "status": status,
        "operator": str(metadata.get("operator") or "local-operator").strip() or "local-operator",
        "recordedAt": recorded_at_value,
        "paperExecutionMode": str(metadata.get("paperExecutionMode") or "manual_adapter_paper_execution").strip(),
        "opsMode": str(metadata.get("opsMode") or "manual_adapter_ops_state").strip(),
        "runbookMode": str(metadata.get("runbookMode") or "").strip(),
        "lifecycleMode": str(metadata.get("lifecycleMode") or "").strip(),
        "dryRunMode": str(metadata.get("dryRunMode") or "").strip(),
        "reviewMode": str(metadata.get("reviewMode") or "").strip(),
        "sandboxReviewMode": str(metadata.get("sandboxReviewMode") or "").strip(),
        "probeExecutionMode": str(metadata.get("probeExecutionMode") or "").strip(),
        "probeMode": str(metadata.get("probeMode") or "").strip(),
        "confirmationMode": str(metadata.get("confirmationMode") or "").strip(),
        "orchestrationExecutionMode": str(metadata.get("orchestrationExecutionMode") or "").strip(),
        "orchestrationMode": str(metadata.get("orchestrationMode") or "").strip(),
        "acceptanceMode": str(metadata.get("acceptanceMode") or "").strip(),
        "executionMode": str(metadata.get("executionMode") or "").strip(),
        "reloadMode": str(metadata.get("reloadMode") or "").strip(),
        "maintenanceWindowId": str(metadata.get("maintenanceWindowId") or "").strip(),
        "bindingMode": str(metadata.get("bindingMode") or "").strip(),
        "manifestPath": str(metadata.get("manifestPath") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in metadata.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "orderIntent": _redact_secret_fields(order_intent),
        "lifecycleSteps": [
            _redact_secret_fields(item)
            for item in lifecycle_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "runbookSteps": [
            _redact_secret_fields(item)
            for item in runbook_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "opsSteps": [
            _redact_secret_fields(item)
            for item in ops_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "paperExecutionSteps": [
            _redact_secret_fields(item)
            for item in paper_execution_steps
            if isinstance(item, dict) and str(item.get("id") or "").strip()
        ],
        "simulatedFill": _redact_secret_fields(simulated_fill),
        "paperFillRecorded": status == "paper_execution_recorded",
        "orderSubmitted": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_paper_execution_to_audit_event_payload(
    result: ExecutionAdapterPaperExecutionResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.adapter_paper_execution_id,
        "eventType": "execution_adapter_paper_execution",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-paper-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter paper execution {status_label} as {result.status}.",
        "detail": "Adapter paper execution records local simulated fill evidence only; no live route or order submission is allowed.",
        "metadata": _redact_secret_fields(
            {
                "adapterPaperExecutionId": result.adapter_paper_execution_id,
                "adapterOpsStateId": result.adapter_ops_state_id,
                "paperRouteRunbookId": result.paper_route_runbook_id,
                "paperOrderLifecycleId": result.paper_order_lifecycle_id,
                "sandboxOrderSchemaDryRunId": result.sandbox_order_schema_dry_run_id,
                "productionRouteReviewId": result.production_route_review_id,
                "sandboxProbeReviewId": result.sandbox_probe_review_id,
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "paperExecutionMode": result.paper_execution_mode,
                "opsMode": result.ops_mode,
                "runbookMode": result.runbook_mode,
                "lifecycleMode": result.lifecycle_mode,
                "dryRunMode": result.dry_run_mode,
                "reviewMode": result.review_mode,
                "sandboxReviewMode": result.sandbox_review_mode,
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "orderIntent": result.order_intent,
                "lifecycleSteps": result.lifecycle_steps,
                "runbookSteps": result.runbook_steps,
                "opsSteps": result.ops_steps,
                "paperExecutionSteps": result.paper_execution_steps,
                "simulatedFill": result.simulated_fill,
                "paperFillRecorded": result.status == "paper_execution_recorded",
                "orderSubmitted": False,
                "liveOrderSubmitted": False,
                "routeExecuted": False,
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_ops_state_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "paper-route-runbook-accepted",
            "paperRouteRunbookAccepted",
            "Paper route runbook was accepted as ops input",
            "adapter_ops_paper_route_runbook_not_accepted",
        ),
        (
            "monitoring-channel-ready",
            "monitoringChannelReady",
            "Monitoring channel is ready",
            "adapter_ops_monitoring_channel_missing",
        ),
        (
            "kill-switch-drill-recorded",
            "killSwitchDrillRecorded",
            "Kill-switch drill was recorded",
            "adapter_ops_kill_switch_drill_missing",
        ),
        (
            "paper-account-reconciled",
            "paperAccountReconciled",
            "Paper account was reconciled",
            "adapter_ops_paper_account_reconciliation_missing",
        ),
        (
            "operator-confirmed-live-trading-disabled",
            "operatorConfirmedLiveTradingDisabled",
            "Operator confirmed live trading remains disabled",
            "adapter_ops_live_trading_disabled_boundary_missing",
        ),
    ]


def _execution_adapter_ops_state_steps(status: str) -> list[dict[str, Any]]:
    normalized_status = "recorded" if status == "recorded" else "blocked"
    return [
        {"id": "paper-route-runbook-linked", "label": "Paper route runbook linked", "status": normalized_status},
        {"id": "monitoring-channel-ready", "label": "Monitoring channel ready", "status": normalized_status},
        {"id": "kill-switch-drill-recorded", "label": "Kill-switch drill recorded", "status": normalized_status},
        {"id": "paper-account-reconciled", "label": "Paper account reconciled", "status": normalized_status},
    ]


def _execution_adapter_paper_execution_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "ops-state-accepted",
            "opsStateAccepted",
            "Adapter ops state was accepted as paper execution input",
            "adapter_paper_execution_ops_state_not_accepted",
        ),
        (
            "paper-account-synced",
            "paperAccountSynced",
            "Paper account snapshot was synced",
            "adapter_paper_execution_account_not_synced",
        ),
        (
            "risk-budget-bound",
            "riskBudgetBound",
            "Risk budget was bound before paper fill",
            "adapter_paper_execution_risk_budget_not_bound",
        ),
        (
            "simulated-fill-generated",
            "simulatedFillGenerated",
            "Simulated fill was generated locally",
            "adapter_paper_execution_fill_not_generated",
        ),
        (
            "operator-confirmed-no-live-routing",
            "operatorConfirmedNoLiveRouting",
            "Operator confirmed no live route was touched",
            "adapter_paper_execution_no_live_route_boundary_missing",
        ),
    ]


def _execution_adapter_paper_execution_steps(status: str) -> list[dict[str, Any]]:
    normalized_status = "recorded" if status == "recorded" else "blocked"
    return [
        {"id": "ops-state-linked", "label": "Adapter ops state linked", "status": normalized_status},
        {"id": "paper-account-synced", "label": "Paper account synced", "status": normalized_status},
        {"id": "risk-budget-bound", "label": "Risk budget bound", "status": normalized_status},
        {"id": "simulated-fill-recorded", "label": "Simulated fill recorded", "status": normalized_status},
    ]


def _execution_adapter_paper_execution_simulated_fill(
    order_intent: dict[str, Any],
    *,
    adapter_paper_execution_id: str,
    blocked: bool,
) -> dict[str, Any]:
    return _redact_secret_fields(
        {
            "fillId": f"paper-fill-{adapter_paper_execution_id}",
            "status": "blocked" if blocked else "filled",
            "symbol": str(order_intent.get("symbol") or "").strip(),
            "side": str(order_intent.get("side") or "").strip(),
            "type": str(order_intent.get("type") or "").strip(),
            "quantity": order_intent.get("quantity"),
            "price": order_intent.get("price"),
            "timeInForce": str(order_intent.get("timeInForce") or "").strip(),
            "source": "local-paper-ledger",
            "orderSubmitted": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
        }
    )


def _execution_adapter_paper_order_lifecycle_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "schema-dry-run-accepted",
            "schemaDryRunAccepted",
            "Sandbox order schema dry-run was accepted as lifecycle input",
            "paper_order_lifecycle_schema_dry_run_not_accepted",
        ),
        (
            "paper-router-locked",
            "paperRouterLocked",
            "Paper router remained locked to local simulation",
            "paper_order_lifecycle_router_not_locked",
        ),
        (
            "risk-limits-bound",
            "riskLimitsBound",
            "Risk limits were bound before paper lifecycle",
            "paper_order_lifecycle_risk_limits_not_bound",
        ),
        (
            "simulated-lifecycle-generated",
            "simulatedLifecycleGenerated",
            "Simulated lifecycle was generated without routing",
            "paper_order_lifecycle_not_generated",
        ),
        (
            "operator-confirmed-no-live-order-submitted",
            "operatorConfirmedNoLiveOrderSubmitted",
            "Operator confirmed no live order was submitted",
            "paper_order_lifecycle_no_live_order_boundary_missing",
        ),
    ]


def _execution_adapter_paper_order_lifecycle_steps(status: str) -> list[dict[str, Any]]:
    normalized_status = "recorded" if status == "recorded" else "blocked"
    return [
        {"id": "intent-validated", "label": "Order intent validated", "status": normalized_status},
        {"id": "paper-router-locked", "label": "Paper router locked", "status": normalized_status},
        {"id": "risk-limits-bound", "label": "Risk limits bound", "status": normalized_status},
        {"id": "simulated-lifecycle-recorded", "label": "Simulated lifecycle recorded", "status": normalized_status},
    ]


def _execution_adapter_sandbox_order_schema_dry_run_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "production-route-review-accepted",
            "productionRouteReviewAccepted",
            "Production route review was accepted as schema dry-run input",
            "sandbox_order_schema_dry_run_route_review_not_accepted",
        ),
        (
            "health-probe-bound",
            "healthProbeBound",
            "Latest sandbox health probe was bound before schema dry-run",
            "sandbox_order_schema_dry_run_health_probe_not_bound",
        ),
        (
            "order-intent-schema-validated",
            "orderIntentSchemaValidated",
            "Order intent schema was validated without submission",
            "sandbox_order_schema_dry_run_order_intent_not_validated",
        ),
        (
            "sandbox-endpoint-still-locked",
            "sandboxEndpointStillLocked",
            "Sandbox/testnet endpoint remains locked",
            "sandbox_order_schema_dry_run_endpoint_not_locked",
        ),
        (
            "operator-confirmed-no-order-submitted",
            "operatorConfirmedNoOrderSubmitted",
            "Operator confirmed no sandbox, paper, or live order was submitted",
            "sandbox_order_schema_dry_run_no_order_boundary_missing",
        ),
    ]


def _sandbox_order_schema_intent_is_valid(order_intent: dict[str, Any]) -> bool:
    symbol = str(order_intent.get("symbol") or "").strip()
    side = str(order_intent.get("side") or "").strip().lower()
    order_type = str(order_intent.get("type") or "").strip().lower()
    quantity = order_intent.get("quantity")
    price = order_intent.get("price")
    return (
        bool(symbol)
        and side in {"buy", "sell"}
        and bool(order_type)
        and isinstance(quantity, (int, float))
        and not isinstance(quantity, bool)
        and math.isfinite(float(quantity))
        and float(quantity) > 0
        and (
            order_type == "market"
            or (
                isinstance(price, (int, float))
                and not isinstance(price, bool)
                and math.isfinite(float(price))
                and float(price) > 0
            )
        )
    )


def portfolio_paper_order_approvals_to_map(
    approvals: list[PortfolioPaperOrderApproval],
) -> dict[str, dict[str, Any]]:
    return {approval.order_id: portfolio_paper_order_approval_to_payload(approval) for approval in approvals}


def portfolio_paper_order_batch_to_audit_event_payload(batch: PortfolioPaperOrderBatch) -> dict[str, Any]:
    lifecycle = build_portfolio_paper_order_lifecycle(batch)
    lifecycle_state_counts = _sorted_counts(str(row.get("state") or "") for row in lifecycle)
    return {
        "schemaVersion": 1,
        "eventId": f"portfolio-paper-order-batch-{batch.batch_id}",
        "eventType": "portfolio_paper_order_batch",
        "runId": batch.base_run_id,
        "createdAt": batch.created_at.isoformat(),
        "stage": "portfolio-paper-order-review",
        "source": batch.source,
        "summary": f"{batch.portfolio_name} recorded {batch.summary['totalOrders']} portfolio paper order candidates.",
        "detail": "Portfolio paper order batch is paper-only and requires operator review before any simulated routing.",
        "metadata": {
            "batchId": batch.batch_id,
            "baseRunId": batch.base_run_id,
            "portfolioName": batch.portfolio_name,
            "mode": batch.mode,
            "source": batch.source,
            "totalOrders": batch.summary["totalOrders"],
            "totalNotionalValue": batch.summary["totalNotionalValue"],
            "statusCounts": dict(batch.summary["statusCounts"]),
            "riskStatusCounts": dict(batch.summary["riskStatusCounts"]),
            "lifecycleStateCounts": lifecycle_state_counts,
            "routableOrders": sum(1 for row in lifecycle if bool(row.get("routable"))),
            "orderIds": [str(order.get("orderId") or "") for order in batch.orders],
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
    }


def portfolio_paper_order_approval_to_audit_event_payload(
    approval: PortfolioPaperOrderApproval,
    *,
    batch: PortfolioPaperOrderBatch,
    lifecycle_row: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": approval.approval_id,
        "eventType": "portfolio_paper_order_approval",
        "runId": approval.base_run_id,
        "createdAt": approval.reviewed_at.isoformat(),
        "stage": "portfolio-paper-order-approval",
        "source": "operator-review",
        "summary": f"{approval.reviewer} {'approved' if approval.approved else 'rejected'} {approval.order_id} for paper-only review.",
        "detail": lifecycle_row.get("reason") or approval.reason,
        "metadata": {
            "approvalId": approval.approval_id,
            "baseRunId": approval.base_run_id,
            "batchId": approval.batch_id,
            "portfolioName": batch.portfolio_name,
            "orderId": approval.order_id,
            "approved": approval.approved,
            "reviewer": approval.reviewer,
            "approvalState": lifecycle_row.get("state"),
            "routable": bool(lifecycle_row.get("routable")),
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
    }


def portfolio_paper_order_simulation_to_audit_event_payload(
    simulation: PortfolioPaperOrderSimulation,
    *,
    batch: PortfolioPaperOrderBatch,
    lifecycle_row: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": simulation.simulation_id,
        "eventType": "portfolio_paper_order_simulation",
        "runId": simulation.base_run_id,
        "createdAt": simulation.simulated_at.isoformat(),
        "stage": "portfolio-paper-order-simulation",
        "source": "paper-simulator",
        "summary": f"Paper simulation filled {simulation.order_id} for {batch.portfolio_name}.",
        "detail": simulation.reason,
        "metadata": {
            "simulationId": simulation.simulation_id,
            "baseRunId": simulation.base_run_id,
            "batchId": simulation.batch_id,
            "portfolioName": batch.portfolio_name,
            "orderId": simulation.order_id,
            "symbol": simulation.symbol,
            "side": simulation.side,
            "quantity": simulation.quantity,
            "fillPrice": simulation.fill_price,
            "notionalValue": simulation.notional_value,
            "orderState": simulation.order_state,
            "fillStatus": simulation.fill_status,
            "approvalState": lifecycle_row.get("state"),
            "approvedBy": simulation.approved_by,
            "routeRiskStatus": simulation.route_risk.get("status"),
            "routeRiskBlockedReasons": simulation.route_risk.get("blockedReasons", []),
            "routeRisk": simulation.route_risk,
            "adapterPaperExecutionId": simulation.adapter_paper_execution_id,
            "adapterManifestValidationId": simulation.adapter_manifest_validation_id,
            "adapterPaperExecutionEvidence": simulation.adapter_paper_execution_evidence,
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
    }


def build_portfolio_paper_order_lifecycle(
    batch: PortfolioPaperOrderBatch,
    *,
    approvals: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    approval_map = approvals or {}
    return [_portfolio_paper_order_lifecycle_row(batch, order, approval_map.get(str(order.get("orderId") or ""))) for order in batch.orders]


def portfolio_paper_order_payload_to_batch(payload: dict[str, Any]) -> PortfolioPaperOrderBatch:
    if not isinstance(payload, dict):
        raise ValueError("portfolio_paper_order_batch_must_be_object")
    batch_id = str(payload.get("batchId") or "").strip()
    if not batch_id:
        raise ValueError("portfolio_paper_order_batch_id_required")
    if str(payload.get("mode") or "").strip() != "portfolio_paper_order_review":
        raise ValueError("portfolio_paper_order_batch_mode_invalid")
    raw_orders = payload.get("orders")
    if not isinstance(raw_orders, list):
        raise ValueError("portfolio_paper_order_orders_required")
    created_at = _parse_payload_datetime(payload.get("createdAt"), "portfolio_paper_order_batch_created_at_invalid")
    return create_portfolio_paper_order_batch(
        base_run_id=str(payload.get("baseRunId") or ""),
        portfolio_name=str(payload.get("portfolioName") or ""),
        source=str(payload.get("source") or "portfolio_backtest"),
        created_at=created_at,
        batch_id=batch_id,
        orders=raw_orders,
    )


def _paper_execution_data_quality_is_complete(data_quality: Any) -> bool:
    if not isinstance(data_quality, dict):
        return False
    source = str(data_quality.get("source") or "").strip()
    return (
        bool(source)
        and source not in {"unknown", "demo-fallback"}
        and data_quality.get("isComplete") is True
        and _strict_positive_number(data_quality.get("rows")) is not None
    )


def build_promotion_candidate(audit: Any, paper_executions: list[PaperExecutionRecord]) -> dict[str, Any]:
    executions = [execution for execution in paper_executions if execution.run_id == str(getattr(audit, "run_id", ""))]
    executions.sort(key=lambda execution: execution.created_at, reverse=True)
    latest_execution = executions[0] if executions else None
    filled_orders = [order for execution in executions for order in execution.orders if order.status == "filled"]
    passed_paper_risk_checks = sum(
        1
        for execution in executions
        if any(gate.get("id") == "paper-risk-check" and bool(gate.get("passed")) for gate in execution.gates)
    )
    try:
        validate_paper_execution_handoff(audit)
        risk_approved = True
    except ValueError:
        risk_approved = False
    paper_passed = bool(filled_orders) and passed_paper_risk_checks > 0
    if not risk_approved:
        status = "blocked"
        headline = "Promotion queue blocked"
        summary = "A strategy needs audited evidence and risk approval before it can enter execution promotion."
    else:
        status = "certification_pending" if paper_passed else "paper_pending"
        headline = "Live promotion pending certification" if paper_passed else "Paper execution required"
        summary = (
            "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass."
            if paper_passed
            else "The audited run is risk-approved for paper trading, but no filled paper execution is bound yet."
        )
    filled_value = _count_label(len(filled_orders), "filled order")

    return {
        "candidateId": f"promotion-{getattr(audit, 'run_id', '')}",
        "runId": str(getattr(audit, "run_id", "")),
        "createdAt": (latest_execution.created_at if latest_execution else getattr(audit, "created_at")).isoformat(),
        "market": str(getattr(audit, "market", "")),
        "symbol": str(getattr(audit, "symbol", "")),
        "timeframe": str(getattr(audit, "timeframe", "")),
        "strategyRevision": str(getattr(audit, "strategy_revision", "")),
        "latestPaperExecutionId": latest_execution.execution_id if latest_execution else None,
        "status": status,
        "headline": headline,
        "summary": summary,
        "liveTradingAllowed": False,
        "evidence": {
            "paperExecutions": len(executions),
            "filledOrders": len(filled_orders),
            "passedPaperRiskChecks": passed_paper_risk_checks,
        },
        "stages": [
            {
                "id": "audited-run",
                "label": "Audited run",
                "value": str(getattr(audit, "run_id", "")),
                "detail": f"{getattr(audit, 'data_rows', 0)} {getattr(audit, 'timeframe', '')} bars are bound to the promotion queue.",
                "status": "passed" if bool(getattr(audit, "run_id", "")) else "blocked",
                "tone": "positive" if bool(getattr(audit, "run_id", "")) else "risk",
                "passed": bool(getattr(audit, "run_id", "")),
                "reason": f"{getattr(audit, 'data_rows', 0)} {getattr(audit, 'timeframe', '')} bars are bound to the promotion queue.",
            },
            {
                "id": "risk-approval",
                "label": "Risk approval",
                "value": "paper approved" if risk_approved else "risk blocked",
                "detail": (
                    "Audited evidence can enter paper-to-live promotion review; live routing remains blocked."
                    if risk_approved
                    else "Audited strategy risk configuration is incomplete; paper-to-live promotion is blocked."
                ),
                "status": "passed" if risk_approved else "blocked",
                "tone": "positive" if risk_approved else "risk",
                "passed": risk_approved,
                "reason": (
                    "Audited evidence can enter paper-to-live promotion review; live routing remains blocked."
                    if risk_approved
                    else "Audited strategy risk configuration is incomplete; paper-to-live promotion is blocked."
                ),
            },
            {
                "id": "paper-execution",
                "label": "Paper execution",
                "value": filled_value if paper_passed else "No paper fill",
                "detail": (
                    f"Paper snapshot {latest_execution.execution_id} passed local risk checks before live promotion."
                    if paper_passed and latest_execution
                    else "Submit a paper order from the active audited run before live promotion review."
                ),
                "status": "passed" if paper_passed else "blocked",
                "tone": "positive" if paper_passed else "warning",
                "passed": paper_passed,
                "reason": (
                    f"Paper snapshot {latest_execution.execution_id} passed local risk checks before live promotion."
                    if paper_passed and latest_execution
                    else "Submit a paper order from the active audited run before live promotion review."
                ),
            },
            {
                "id": "adapter-certification",
                "label": "Adapter certification",
                "value": "0 certified live adapters",
                "detail": "Live adapters remain interface-only or configuration-required until certification passes.",
                "status": "blocked",
                "tone": "risk",
                "passed": False,
                "reason": "Live adapters remain interface-only or configuration-required until certification passes.",
            },
            {
                "id": "human-confirmation",
                "label": "Human confirmation",
                "value": "manual approval required",
                "detail": "Live promotion requires explicit human confirmation after adapter certification.",
                "status": "blocked",
                "tone": "warning",
                "passed": False,
                "reason": "Live promotion requires explicit human confirmation after adapter certification.",
            },
        ],
    }


def paper_execution_payload_to_record(payload: dict[str, Any]) -> PaperExecutionRecord:
    account_payload = payload.get("account")
    orders_payload = payload.get("orders")
    gates_payload = payload.get("gates")
    if not isinstance(account_payload, dict):
        raise ValueError("paper_execution_account_must_be_object")
    if not isinstance(orders_payload, list):
        raise ValueError("paper_execution_orders_must_be_array")
    if not isinstance(gates_payload, list):
        raise ValueError("paper_execution_gates_must_be_array")
    if any(not isinstance(order, dict) for order in orders_payload):
        raise ValueError("paper_execution_order_must_be_object")
    if any(not isinstance(gate, dict) for gate in gates_payload):
        raise ValueError("paper_execution_gate_must_be_object")
    execution_id = str(payload.get("executionId") or "").strip()
    run_id = str(payload.get("runId") or "").strip()
    if not execution_id:
        raise ValueError("paper_execution_id_is_required")
    if not run_id:
        raise ValueError("paper_execution_run_id_is_required")
    mode = str(payload.get("mode") or "paper_only")
    if mode != "paper_only":
        raise ValueError("paper_execution_must_be_paper_only")
    try:
        created_at = datetime.fromisoformat(str(payload.get("createdAt")))
    except ValueError as error:
        raise ValueError("paper_execution_created_at_must_be_iso_datetime") from error
    return PaperExecutionRecord(
        execution_id=execution_id,
        run_id=run_id,
        created_at=created_at,
        mode=mode,
        account=PaperAccount(
            cash=float(account_payload.get("cash", 0)),
            positions={str(symbol): float(quantity) for symbol, quantity in dict(account_payload.get("positions", {})).items()},
            equity=float(account_payload.get("equity", 0)),
        ),
        orders=[_payload_to_order(order) for order in orders_payload],
        gates=_normalize_gates(gates_payload),
        preparation_evidence=dict(payload["preparationEvidence"])
        if isinstance(payload.get("preparationEvidence"), dict)
        else None,
    )


def _paper_preparation_evidence_from_audit(audit: Any) -> dict[str, Any] | None:
    snapshot = getattr(audit, "data_snapshot", None)
    preparation_evidence = snapshot.get("preparationEvidence") if isinstance(snapshot, dict) else None
    return dict(preparation_evidence) if isinstance(preparation_evidence, dict) else None


def _latest_close(audit: Any) -> float:
    snapshot = getattr(audit, "data_snapshot", {})
    bars = snapshot.get("bars") if isinstance(snapshot, dict) else None
    if not isinstance(bars, list) or not bars:
        raise ValueError("paper_execution_requires_data_snapshot_bars")
    latest = bars[-1]
    close = latest.get("close") if isinstance(latest, dict) else None
    price = _positive_number(close, 0)
    if price <= 0:
        raise ValueError("paper_execution_requires_positive_close")
    return price


def _paper_target_notional(audit: Any, initial_cash: float) -> float:
    strategy_config = getattr(audit, "strategy_config", None)
    risk = strategy_config.get("risk") if isinstance(strategy_config, dict) else None
    position_pct = _positive_number(risk.get("positionPct") if isinstance(risk, dict) else None, 0.2)
    return max(1.0, min(initial_cash * position_pct, 20_000.0))


def _paper_quantity(market: str, price: float, target_notional: float) -> float:
    raw_quantity = max(1, math.floor(target_notional / price))
    if market == "ashare":
        return max(100, math.floor(raw_quantity / 100) * 100)
    if market == "crypto":
        return max(1, math.floor(raw_quantity))
    return raw_quantity


def _positive_number(value: Any, fallback: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if not math.isfinite(number) or number <= 0:
        return fallback
    return number


def _strict_positive_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number) or number <= 0:
        return None
    return number


def _round_number(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0.0
    if not math.isfinite(number):
        number = 0.0
    rounded = round(number, 6)
    return 0.0 if rounded == -0.0 else rounded


def _account_to_payload(account: PaperAccount) -> dict[str, Any]:
    return {
        "cash": account.cash,
        "positions": {str(symbol): quantity for symbol, quantity in account.positions.items()},
        "equity": account.equity,
    }


def _order_to_payload(order: OrderResult) -> dict[str, Any]:
    return {
        "orderId": order.order_id,
        "symbol": order.symbol,
        "side": order.side,
        "quantity": order.quantity,
        "price": order.price,
        "status": order.status,
        "reason": order.reason,
        "timestamp": order.timestamp.isoformat(),
    }


def _normalize_gates(gates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for gate in gates:
        normalized.append(
            {
                "id": str(gate.get("id", "")),
                "label": str(gate.get("label", "")),
                "passed": bool(gate.get("passed")),
                "reason": str(gate.get("reason", "")),
            }
        )
    return normalized


def _count_label(count: int, singular: str) -> str:
    return f"{count} {singular}" if count == 1 else f"{count} {singular}s"


def _row_to_paper_execution(row: sqlite3.Row | tuple[Any, ...]) -> PaperExecutionRecord:
    account_payload = json.loads(row[4])
    preparation_evidence = json.loads(row[7]) if len(row) > 7 and row[7] else None
    return PaperExecutionRecord(
        execution_id=row[0],
        run_id=row[1],
        created_at=datetime.fromisoformat(row[2]),
        mode=row[3],
        account=PaperAccount(
            cash=float(account_payload.get("cash", 0)),
            positions={str(symbol): float(quantity) for symbol, quantity in dict(account_payload.get("positions", {})).items()},
            equity=float(account_payload.get("equity", 0)),
        ),
        orders=[_payload_to_order(order) for order in json.loads(row[5])],
        gates=_normalize_gates(json.loads(row[6])),
        preparation_evidence=dict(preparation_evidence) if isinstance(preparation_evidence, dict) else None,
    )


def _row_to_execution_adapter_certification(row: sqlite3.Row | tuple[Any, ...]) -> ExecutionAdapterCertificationRun:
    return ExecutionAdapterCertificationRun(
        certification_id=str(row[0]),
        adapter_id=str(row[1]),
        market=str(row[2]),
        route=str(row[3]),
        status=str(row[4]),
        operator=str(row[5]),
        started_at=datetime.fromisoformat(str(row[6])),
        completed_at=datetime.fromisoformat(str(row[7])) if row[7] else None,
        live_trading_allowed=False,
        checks=[dict(check) for check in json.loads(row[9])],
        metadata=dict(json.loads(row[10])),
        summary=dict(json.loads(row[11])),
    )


def _row_to_portfolio_paper_order_batch(row: sqlite3.Row | tuple[Any, ...]) -> PortfolioPaperOrderBatch:
    return PortfolioPaperOrderBatch(
        batch_id=str(row[0]),
        base_run_id=str(row[1]),
        created_at=datetime.fromisoformat(str(row[2])),
        portfolio_name=str(row[3]),
        mode=str(row[4]),
        source=str(row[5]),
        orders=[_normalize_portfolio_paper_order(order) for order in json.loads(row[6])],
        summary=dict(json.loads(row[7])),
    )


def _row_to_portfolio_paper_order_approval(row: sqlite3.Row | tuple[Any, ...]) -> PortfolioPaperOrderApproval:
    return PortfolioPaperOrderApproval(
        approval_id=str(row[0]),
        base_run_id=str(row[1]),
        batch_id=str(row[2]),
        order_id=str(row[3]),
        reviewed_at=datetime.fromisoformat(str(row[4])),
        approved=bool(row[5]),
        reviewer=str(row[6]),
        reason=str(row[7]),
    )


def _json_object_from_text(value: str) -> dict[str, Any]:
    try:
        payload = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return {}
    return dict(payload) if isinstance(payload, dict) else {}


def _row_to_portfolio_paper_order_simulation(row: sqlite3.Row | tuple[Any, ...]) -> PortfolioPaperOrderSimulation:
    return PortfolioPaperOrderSimulation(
        simulation_id=str(row[0]),
        base_run_id=str(row[1]),
        batch_id=str(row[2]),
        order_id=str(row[3]),
        simulated_at=datetime.fromisoformat(str(row[4])),
        mode=str(row[5]),
        symbol=str(row[6]),
        source_run_id=str(row[7]).strip() if row[7] is not None else None,
        side=str(row[8]),
        quantity=float(row[9]),
        fill_price=float(row[10]),
        notional_value=float(row[11]),
        order_state=str(row[12]),
        fill_status=str(row[13]),
        reason=str(row[14]),
        approved_by=str(row[15]).strip() if row[15] is not None else None,
        route_risk=_json_object_from_text(str(row[16]) if len(row) > 16 else "{}"),
        adapter_paper_execution_id=str(row[17]).strip() if len(row) > 17 and row[17] is not None else "",
        adapter_manifest_validation_id=str(row[18]).strip() if len(row) > 18 and row[18] is not None else "",
        adapter_paper_execution_evidence=_json_object_from_text(str(row[19]) if len(row) > 19 else "{}"),
    )


def _payload_to_order(payload: dict[str, Any]) -> OrderResult:
    return OrderResult(
        order_id=str(payload.get("orderId", "")),
        symbol=str(payload.get("symbol", "")),
        side=str(payload.get("side", "buy")),
        quantity=float(payload.get("quantity", 0)),
        price=float(payload.get("price", 0)),
        status=str(payload.get("status", "rejected")),
        reason=str(payload.get("reason", "")),
        timestamp=datetime.fromisoformat(str(payload.get("timestamp"))),
    )


def _normalize_portfolio_paper_order(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("portfolio_paper_order_must_be_object")
    event_type = str(payload.get("eventType") or "").strip()
    if event_type != "portfolio_paper_order":
        raise ValueError("portfolio_paper_order_event_type_invalid")
    order_id = str(payload.get("orderId") or "").strip()
    symbol = str(payload.get("symbol") or "").strip()
    if not order_id:
        raise ValueError("portfolio_paper_order_id_required")
    if not symbol:
        raise ValueError("portfolio_paper_order_symbol_required")
    side = _enum_value(payload.get("side"), {"buy", "sell", "hold"}, "portfolio_paper_order_side_invalid")
    status = _enum_value(
        payload.get("status"),
        {"pending_review", "rejected", "skipped"},
        "portfolio_paper_order_status_invalid",
    )
    risk_status = _enum_value(
        payload.get("riskStatus"),
        {"passed", "review", "blocked"},
        "portfolio_paper_order_risk_status_invalid",
    )
    timestamp = _parse_payload_datetime(payload.get("timestamp"), "portfolio_paper_order_timestamp_invalid")
    notional_value = _non_negative_number(payload.get("notionalValue"), "portfolio_paper_order_notional_invalid")
    quantity = _non_negative_number(payload.get("quantity"), "portfolio_paper_order_quantity_invalid")
    raw_source_run_id = payload.get("sourceRunId")
    source_run_id = str(raw_source_run_id).strip() if raw_source_run_id is not None else None
    return {
        "timestamp": timestamp.isoformat(),
        "eventType": event_type,
        "orderId": order_id,
        "symbol": symbol,
        "sourceRunId": source_run_id or None,
        "side": side,
        "notionalValue": notional_value,
        "quantity": quantity,
        "status": status,
        "riskStatus": risk_status,
        "reason": str(payload.get("reason") or "").strip(),
    }


def _normalize_execution_adapter_certification_checks(checks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for index, check in enumerate(checks):
        if not isinstance(check, dict):
            raise ValueError("execution_adapter_certification_check_must_be_object")
        check_id = str(check.get("id") or f"check-{index + 1}").strip()
        status = _enum_value(
            check.get("status") or "review",
            {"passed", "blocked", "failed", "review"},
            "execution_adapter_certification_check_status_invalid",
        )
        metadata = check.get("metadata") if isinstance(check.get("metadata"), dict) else {}
        normalized.append(
            {
                "id": check_id,
                "label": str(check.get("label") or check_id.replace("-", " ").title()),
                "status": status,
                "detail": str(check.get("detail") or ""),
                "metadata": _redact_secret_fields(metadata),
            }
        )
    return normalized


def _execution_adapter_certification_status(checks: list[dict[str, Any]]) -> str:
    statuses = {str(check.get("status") or "") for check in checks}
    if "blocked" in statuses:
        return "blocked"
    if "failed" in statuses:
        return "failed"
    if checks and statuses == {"passed"}:
        return "passed"
    return "review"


def _coerce_optional_datetime(value: datetime | str | None, *, error_code: str, fallback: datetime | None) -> datetime | None:
    if value is None:
        return fallback
    if isinstance(value, datetime):
        return value
    return _parse_payload_datetime(value, error_code)


def _redact_secret_fields(value: Any) -> Any:
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            text_key = str(key)
            redacted[text_key] = "[redacted]" if _is_secret_key(text_key) else _redact_secret_fields(item)
        return redacted
    if isinstance(value, list):
        return [_redact_secret_fields(item) for item in value]
    return value


def _is_secret_key(key: str) -> bool:
    normalized = key.replace("_", "").replace("-", "").lower()
    return any(marker in normalized for marker in ("secret", "token", "apikey", "privatekey", "password"))


def _portfolio_paper_order_lifecycle_row(
    batch: PortfolioPaperOrderBatch,
    order: dict[str, Any],
    approval: dict[str, Any] | None,
) -> dict[str, Any]:
    order_id = str(order.get("orderId") or "")
    status = str(order.get("status") or "")
    risk_status = str(order.get("riskStatus") or "")
    side = str(order.get("side") or "")
    quantity = _positive_number(order.get("quantity"), 0)
    notional_value = _positive_number(order.get("notionalValue"), 0)
    approved = bool(approval.get("approved")) if isinstance(approval, dict) else False
    approval_was_rejected = isinstance(approval, dict) and approval.get("approved") is False

    if status == "skipped" or side == "hold":
        state = "skipped"
        reason = str(order.get("reason") or "No paper order action is required.")
    elif status == "rejected" or risk_status == "blocked":
        state = "risk_rejected"
        reason = str(order.get("reason") or "Pre-trade risk rejected this paper order.")
    elif approval_was_rejected:
        state = "operator_rejected"
        reason = str(approval.get("reason") or "Operator rejected this paper order candidate.")
    elif not approved:
        state = "awaiting_operator_review"
        reason = str(order.get("reason") or "Operator approval is required before paper simulation.")
    elif risk_status != "passed":
        state = "risk_review"
        reason = "Risk review must pass before the approved order can be staged for simulation."
    elif side not in {"buy", "sell"} or quantity <= 0 or notional_value <= 0:
        state = "invalid_order"
        reason = "Only positive buy or sell paper orders can be staged for simulation."
    else:
        state = "ready_for_simulation"
        reason = str(approval.get("reason") or "Operator approved this order for paper simulation only.")

    return {
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "portfolioName": batch.portfolio_name,
        "orderId": order_id,
        "symbol": str(order.get("symbol") or ""),
        "sourceRunId": order.get("sourceRunId"),
        "side": side,
        "quantity": quantity,
        "notionalValue": notional_value,
        "originalStatus": status,
        "riskStatus": risk_status,
        "state": state,
        "routable": state == "ready_for_simulation",
        "paperOnly": True,
        "liveExecutionBlocked": True,
        "approvedBy": str(approval.get("reviewer") or "") if isinstance(approval, dict) and approved else None,
        "reviewedAt": str(approval.get("reviewedAt") or "") if isinstance(approval, dict) and approval.get("reviewedAt") else None,
        "reason": reason,
    }


def _portfolio_paper_order_state_event(
    *,
    batch: PortfolioPaperOrderBatch,
    order_id: str,
    state: str,
    timestamp: str,
    label: str,
    actor: str,
    source: str,
    reason: str,
    sequence: int,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event = {
        "eventId": f"{batch.batch_id}:{order_id}:{state}:{sequence}",
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "orderId": order_id,
        "timestamp": timestamp,
        "state": state,
        "label": label,
        "actor": str(actor or ""),
        "source": str(source or ""),
        "reason": str(reason or ""),
        "paperOnly": True,
        "liveExecutionBlocked": True,
        "sequence": sequence,
    }
    if metadata:
        event["metadata"] = dict(metadata)
    return event


def _portfolio_paper_order_state_label(state: str) -> str:
    labels = {
        "created": "Paper order created",
        "awaiting_operator_review": "Awaiting operator review",
        "operator_approved": "Operator approved",
        "operator_rejected": "Operator rejected",
        "ready_for_simulation": "Ready for paper simulation",
        "simulation_filled": "Paper simulation filled",
        "simulation_recorded": "Paper simulation recorded",
        "live_blocked": "Live route blocked",
        "risk_rejected": "Risk rejected",
        "risk_review": "Risk review required",
        "invalid_order": "Invalid paper order",
        "skipped": "Skipped",
    }
    return labels.get(state, state.replace("_", " ").strip().title())


def _portfolio_paper_order_summary(orders: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "totalOrders": len(orders),
        "totalNotionalValue": round(sum(float(order.get("notionalValue", 0)) for order in orders), 4),
        "statusCounts": _sorted_counts(str(order.get("status")) for order in orders),
        "riskStatusCounts": _sorted_counts(str(order.get("riskStatus")) for order in orders),
    }


def _sorted_counts(values: Any) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return {key: counts[key] for key in sorted(counts)}


def _enum_value(value: Any, allowed: set[str], error_code: str) -> str:
    normalized = str(value or "").strip()
    if normalized not in allowed:
        raise ValueError(error_code)
    return normalized


def _parse_payload_datetime(value: Any, error_code: str) -> datetime:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(error_code) from error


def _non_negative_number(value: Any, error_code: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(error_code) from error
    if not math.isfinite(number) or number < 0:
        raise ValueError(error_code)
    return number
