from __future__ import annotations

from typing import Any

from quant_core.execution import (
    ExecutionAdapterCertificationRun,
    PaperExecutionRecord,
    PortfolioPaperOrderApproval,
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderSimulation,
)

from .base import TenantModelRepository


class TenantPaperExecutionStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(self, execution: PaperExecutionRecord) -> None:
        self.repository.put(execution.execution_id, execution)

    def list_by_run(self, run_id: str, limit: int = 20) -> list[PaperExecutionRecord]:
        return self.list_all_by_run(run_id)[: max(1, min(int(limit), 100))]

    def list_all_by_run(self, run_id: str) -> list[PaperExecutionRecord]:
        records = [record for record in self.repository.all() if record.run_id == run_id]
        return sorted(records, key=lambda record: record.created_at, reverse=True)

    def delete_by_run(self, run_id: str) -> None:
        for record in self.list_all_by_run(run_id):
            self.repository.delete(record.execution_id)


class TenantPortfolioPaperOrderStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(self, batch: PortfolioPaperOrderBatch) -> PortfolioPaperOrderBatch:
        return self.repository.put(batch.batch_id, batch)

    def list_by_base_run(
        self,
        base_run_id: str,
        limit: int = 20,
    ) -> list[PortfolioPaperOrderBatch]:
        return self.list_all_by_base_run(base_run_id)[: max(1, min(int(limit), 100))]

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderBatch]:
        records = [
            record for record in self.repository.all() if record.base_run_id == base_run_id
        ]
        return sorted(records, key=lambda record: record.created_at, reverse=True)

    def delete_by_base_run(self, base_run_id: str) -> None:
        for record in self.list_all_by_base_run(base_run_id):
            self.repository.delete(record.batch_id)


class TenantPortfolioApprovalStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(self, approval: PortfolioPaperOrderApproval) -> PortfolioPaperOrderApproval:
        return self.repository.put(approval.approval_id, approval)

    def list_by_batch(
        self,
        base_run_id: str,
        batch_id: str,
    ) -> list[PortfolioPaperOrderApproval]:
        records = [
            record
            for record in self.repository.all()
            if record.base_run_id == base_run_id and record.batch_id == batch_id
        ]
        return sorted(records, key=lambda record: record.reviewed_at)

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderApproval]:
        records = [
            record for record in self.repository.all() if record.base_run_id == base_run_id
        ]
        return sorted(records, key=lambda record: record.reviewed_at)

    def delete_by_base_run(self, base_run_id: str) -> None:
        for record in self.list_all_by_base_run(base_run_id):
            self.repository.delete(record.approval_id)


class TenantPortfolioSimulationStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(
        self,
        simulation: PortfolioPaperOrderSimulation,
    ) -> PortfolioPaperOrderSimulation:
        return self.repository.put(simulation.simulation_id, simulation)

    def list_by_batch(
        self,
        base_run_id: str,
        batch_id: str,
    ) -> list[PortfolioPaperOrderSimulation]:
        records = [
            record
            for record in self.repository.all()
            if record.base_run_id == base_run_id and record.batch_id == batch_id
        ]
        return sorted(records, key=lambda record: record.simulated_at)

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderSimulation]:
        records = [
            record for record in self.repository.all() if record.base_run_id == base_run_id
        ]
        return sorted(records, key=lambda record: record.simulated_at)

    def delete_by_base_run(self, base_run_id: str) -> None:
        for record in self.list_all_by_base_run(base_run_id):
            self.repository.delete(record.simulation_id)


class TenantExecutionCertificationStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(
        self,
        run: ExecutionAdapterCertificationRun,
    ) -> ExecutionAdapterCertificationRun:
        return self.repository.put(run.certification_id, run)

    def get(self, certification_id: str) -> ExecutionAdapterCertificationRun | None:
        return self.repository.get(str(certification_id or "").strip())

    def list_by_adapter(
        self,
        adapter_id: str,
        limit: int = 20,
    ) -> list[ExecutionAdapterCertificationRun]:
        records = [
            record for record in self.repository.all() if record.adapter_id == adapter_id
        ]
        records.sort(key=lambda record: record.started_at, reverse=True)
        return records[: max(1, min(int(limit), 100))]
