from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from typing import Literal

from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentDetail,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    _snapshot_immutable_values,
)

from .base import TenantModelRepository


class TenantStrategyExperimentStore:
    def __init__(
        self,
        snapshots: TenantModelRepository,
        experiments: TenantModelRepository,
    ) -> None:
        self.snapshots = snapshots
        self.experiments = experiments

    def put_snapshot(self, snapshot: StrategyExperimentSnapshot) -> StrategyExperimentSnapshot:
        existing = self.snapshots.get(snapshot.snapshot_id)
        if existing is not None:
            if (
                _snapshot_immutable_values(existing)
                != _snapshot_immutable_values(snapshot)
            ):
                raise ValueError("strategy_experiment_conflict")
            return existing
        return self.snapshots.put(snapshot.snapshot_id, snapshot)

    def claimed_definition(self, snapshot_id: str) -> str | None:
        snapshot = self.snapshots.get(snapshot_id)
        return snapshot.test_definition_hash if snapshot is not None else None

    def claim_test_holdout(
        self,
        *,
        snapshot_id: str,
        definition_hash: str,
        experiment_id: str,
        consumed_at: datetime,
    ) -> Literal["claimed", "replay"]:
        snapshot = self.snapshots.get(snapshot_id)
        if snapshot is None:
            raise ValueError("strategy_experiment_snapshot_not_found")
        if snapshot.test_definition_hash == definition_hash:
            return "replay"
        if snapshot.test_definition_hash is not None:
            raise ValueError("test_holdout_consumed")
        self.snapshots.put(
            snapshot_id,
            replace(
                snapshot,
                test_definition_hash=definition_hash,
                test_owner_experiment_id=experiment_id,
                test_consumed_at=consumed_at,
            ),
        )
        return "claimed"

    def record_completed(
        self,
        experiment: StrategyExperimentRecord,
        candidates: list[StrategyExperimentCandidateRecord],
    ) -> None:
        if any(candidate.experiment_id != experiment.experiment_id for candidate in candidates):
            raise ValueError("strategy_experiment_candidate_mismatch")
        self._record_detail(experiment, candidates)

    def record_failed(self, experiment: StrategyExperimentRecord) -> None:
        self._record_detail(experiment, [])

    def _record_detail(
        self,
        experiment: StrategyExperimentRecord,
        candidates: list[StrategyExperimentCandidateRecord],
    ) -> None:
        snapshot = self.snapshots.get(experiment.snapshot_id)
        if snapshot is None:
            raise ValueError("strategy_experiment_snapshot_not_found")
        detail = StrategyExperimentDetail(experiment, snapshot, list(candidates))
        existing = self.experiments.get(experiment.experiment_id)
        if existing is not None and existing != detail:
            raise ValueError("strategy_experiment_conflict")
        self.experiments.put(experiment.experiment_id, detail)

    def get(self, experiment_id: str) -> StrategyExperimentDetail | None:
        return self.experiments.get(str(experiment_id or "").strip())

    def list_recent(
        self,
        *,
        strategy_revision: str | None = None,
        source_run_id: str | None = None,
        limit: int = 20,
    ) -> list[StrategyExperimentRecord]:
        records = [
            detail.experiment
            for detail in self.experiments.all()
            if (
                strategy_revision is None
                or detail.experiment.strategy_revision == strategy_revision
            )
            and (
                source_run_id is None
                or detail.experiment.source_run_id == source_run_id
            )
        ]
        records.sort(key=lambda record: record.created_at, reverse=True)
        return records[: max(1, min(int(limit), 50))]
