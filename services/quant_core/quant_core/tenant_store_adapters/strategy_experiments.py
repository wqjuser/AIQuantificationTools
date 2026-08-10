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
        stored, _created = self.snapshots.put_if_absent(
            snapshot.snapshot_id,
            snapshot,
        )
        if (
            _snapshot_immutable_values(stored)
            != _snapshot_immutable_values(snapshot)
        ):
            raise ValueError("strategy_experiment_conflict")
        return stored

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
        claimed = self.snapshots.compare_and_swap_field(
            snapshot_id,
            field="test_definition_hash",
            expected=None,
            value=replace(
                snapshot,
                test_definition_hash=definition_hash,
                test_owner_experiment_id=experiment_id,
                test_consumed_at=consumed_at,
            ),
        )
        if claimed:
            return "claimed"
        winner = self.snapshots.get(snapshot_id)
        if winner is None:
            raise ValueError("strategy_experiment_snapshot_not_found")
        if winner.test_definition_hash == definition_hash:
            return "replay"
        raise ValueError("test_holdout_consumed")

    def record_completed(
        self,
        experiment: StrategyExperimentRecord,
        candidates: list[StrategyExperimentCandidateRecord],
    ) -> None:
        if experiment.status != "completed":
            raise ValueError("strategy_experiment_status_invalid")
        if any(candidate.experiment_id != experiment.experiment_id for candidate in candidates):
            raise ValueError("strategy_experiment_candidate_mismatch")
        self._record_detail(experiment, candidates)

    def record_pending(self, experiment: StrategyExperimentRecord) -> None:
        if experiment.status != "pending":
            raise ValueError("strategy_experiment_status_invalid")
        snapshot = self.snapshots.get(experiment.snapshot_id)
        if snapshot is None:
            raise ValueError("strategy_experiment_snapshot_not_found")
        detail = StrategyExperimentDetail(experiment, snapshot, [])
        stored, _created = self.experiments.put_if_absent(
            experiment.experiment_id,
            detail,
        )
        if stored != detail:
            raise ValueError("strategy_experiment_conflict")

    def record_development_checkpoint(
        self,
        experiment: StrategyExperimentRecord,
        candidates: list[StrategyExperimentCandidateRecord],
    ) -> None:
        if (
            experiment.status != "pending"
            or experiment.completion_reason != "development_completed"
            or not experiment.selected_candidate_id
            or not candidates
            or any(
                candidate.experiment_id != experiment.experiment_id
                or candidate.test_metrics is not None
                for candidate in candidates
            )
        ):
            raise ValueError("strategy_experiment_development_checkpoint_invalid")
        versioned = self.experiments.get_versioned(experiment.experiment_id)
        existing = versioned[0] if versioned is not None else None
        if (
            existing is None
            or existing.experiment.status != "pending"
            or existing.experiment.definition_hash != experiment.definition_hash
            or existing.experiment.snapshot_id != experiment.snapshot_id
            or existing.experiment.completion_reason is not None
            or existing.candidates
        ):
            raise ValueError("strategy_experiment_conflict")
        checkpoint = StrategyExperimentDetail(
            experiment,
            existing.snapshot,
            list(candidates),
        )
        assert versioned is not None
        if not self.experiments.compare_and_swap_model(
            experiment.experiment_id,
            expected_version=versioned[1],
            value=checkpoint,
        ):
            raise ValueError("strategy_experiment_conflict")

    def record_failed(self, experiment: StrategyExperimentRecord) -> None:
        if experiment.status != "failed":
            raise ValueError("strategy_experiment_status_invalid")
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
        versioned = self.experiments.get_versioned(experiment.experiment_id)
        if versioned is None:
            _stored, created = self.experiments.put_if_absent(
                experiment.experiment_id,
                detail,
            )
            if created:
                return
            versioned = self.experiments.get_versioned(experiment.experiment_id)
            if versioned is None:
                raise ValueError("strategy_experiment_conflict")
        existing, expected_version = versioned
        if existing == detail:
            return
        if not (
            existing.experiment.status == "pending"
            and experiment.status in {"completed", "failed"}
            and existing.experiment.definition_hash == experiment.definition_hash
            and existing.experiment.snapshot_id == experiment.snapshot_id
        ):
            raise ValueError("strategy_experiment_conflict")
        if self.experiments.compare_and_swap_model(
            experiment.experiment_id,
            expected_version=expected_version,
            value=detail,
        ):
            return
        if self.experiments.get(experiment.experiment_id) == detail:
            return
        raise ValueError("strategy_experiment_conflict")

    def mark_promoted(
        self,
        *,
        experiment_id: str,
        expected_result_hash: str,
        promotion_run_id: str,
        promoted_strategy_revision: str,
        promotion_lineage_hash: str,
        promoted_at: datetime,
        promotion_operator: str,
    ) -> StrategyExperimentDetail:
        existing = self.experiments.get(experiment_id)
        if existing is None:
            raise ValueError("strategy_experiment_not_found")
        record = existing.experiment
        if (
            record.status != "completed"
            or record.result_hash != expected_result_hash
            or not record.profitability_gate_passed
        ):
            raise ValueError("strategy_experiment_not_promotable")
        if record.promotion_lineage_hash is not None:
            if (
                record.promotion_run_id == promotion_run_id
                and record.promoted_strategy_revision == promoted_strategy_revision
                and record.promotion_lineage_hash == promotion_lineage_hash
                and record.promotion_operator == promotion_operator
            ):
                return existing
            raise ValueError("strategy_experiment_already_promoted")
        promoted = replace(
            existing,
            experiment=replace(
                record,
                promotion_run_id=promotion_run_id,
                promoted_strategy_revision=promoted_strategy_revision,
                promotion_lineage_hash=promotion_lineage_hash,
                promoted_at=promoted_at,
                promotion_operator=promotion_operator,
            ),
        )
        if self.experiments.compare_and_swap_model_field(
            experiment_id,
            path=("experiment", "fields", "promotion_lineage_hash"),
            expected=None,
            value=promoted,
        ):
            return promoted
        winner = self.experiments.get(experiment_id)
        if winner is not None and (
            winner.experiment.promotion_run_id == promotion_run_id
            and winner.experiment.promoted_strategy_revision == promoted_strategy_revision
            and winner.experiment.promotion_lineage_hash == promotion_lineage_hash
            and winner.experiment.promotion_operator == promotion_operator
        ):
            return winner
        raise ValueError("strategy_experiment_already_promoted")

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

    def list_pending(
        self,
        *,
        after: tuple[datetime, str] | None = None,
        limit: int = 50,
    ) -> list[StrategyExperimentRecord]:
        records = sorted(
            (
                detail.experiment
                for detail in self.experiments.all()
                if detail.experiment.status == "pending"
            ),
            key=lambda record: (record.created_at, record.experiment_id),
        )
        if after is not None:
            records = [
                record
                for record in records
                if (record.created_at, record.experiment_id) > after
            ]
        return records[: max(1, min(int(limit), 200))]
