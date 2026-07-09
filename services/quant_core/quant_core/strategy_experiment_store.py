from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, cast


@dataclass(frozen=True)
class StrategyExperimentSnapshot:
    snapshot_id: str
    created_at: datetime
    market: str
    symbol: str
    timeframe: str
    canonical_data_hash: str
    rows: int
    start_at: str
    end_at: str
    bars: list[dict[str, Any]]
    test_definition_hash: str | None = None
    test_owner_experiment_id: str | None = None
    test_consumed_at: datetime | None = None


@dataclass(frozen=True)
class StrategyExperimentRecord:
    experiment_id: str
    created_at: datetime
    status: Literal["completed", "failed"]
    definition_hash: str
    holdout_key: str
    strategy_revision: str
    source_run_id: str
    snapshot_id: str
    market: str
    symbol: str
    timeframe: str
    definition: dict[str, Any]
    evaluation_count: int
    selected_candidate_id: str | None = None
    completion_reason: str | None = None
    result_hash: str | None = None
    error_code: str | None = None
    error_detail: str | None = None


@dataclass(frozen=True)
class StrategyExperimentCandidateRecord:
    experiment_id: str
    candidate_id: str
    candidate_revision: str
    parameters: list[dict[str, Any]]
    train_metrics: dict[str, Any]
    validation_metrics: dict[str, Any]
    test_metrics: dict[str, Any] | None
    walk_forward: dict[str, Any]
    eligible: bool
    rank: int | None


@dataclass(frozen=True)
class StrategyExperimentDetail:
    experiment: StrategyExperimentRecord
    snapshot: StrategyExperimentSnapshot
    candidates: list[StrategyExperimentCandidateRecord]


class StrategyExperimentStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path, timeout=30)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.executescript(
                """
                create table if not exists strategy_experiment_snapshots (
                  snapshot_id text primary key,
                  created_at text not null,
                  market text not null,
                  symbol text not null,
                  timeframe text not null,
                  canonical_data_hash text not null,
                  rows integer not null,
                  start_at text not null,
                  end_at text not null,
                  bars_json text not null,
                  test_definition_hash text,
                  test_owner_experiment_id text,
                  test_consumed_at text
                );

                create table if not exists strategy_experiments (
                  experiment_id text primary key,
                  created_at text not null,
                  status text not null check (status in ('completed', 'failed')),
                  definition_hash text not null,
                  holdout_key text not null,
                  strategy_revision text not null,
                  source_run_id text not null,
                  snapshot_id text not null,
                  market text not null,
                  symbol text not null,
                  timeframe text not null,
                  definition_json text not null,
                  evaluation_count integer not null,
                  selected_candidate_id text,
                  completion_reason text,
                  result_hash text,
                  error_code text,
                  error_detail text
                );

                create table if not exists strategy_experiment_candidates (
                  experiment_id text not null,
                  candidate_id text not null,
                  candidate_revision text not null,
                  parameters_json text not null,
                  train_metrics_json text not null,
                  validation_metrics_json text not null,
                  test_metrics_json text,
                  walk_forward_json text not null,
                  eligible integer not null,
                  rank integer,
                  primary key (experiment_id, candidate_id)
                );

                create index if not exists idx_strategy_experiments_strategy_revision_created_at
                on strategy_experiments(strategy_revision, created_at);
                create index if not exists idx_strategy_experiments_source_run_id_created_at
                on strategy_experiments(source_run_id, created_at);
                create index if not exists idx_strategy_experiments_holdout_key
                on strategy_experiments(holdout_key);
                """
            )
            connection.commit()
        finally:
            connection.close()

    def put_snapshot(self, snapshot: StrategyExperimentSnapshot) -> StrategyExperimentSnapshot:
        immutable = _snapshot_immutable_values(snapshot)
        connection = self._connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute(
                """
                select
                    snapshot_id,
                    created_at,
                    market,
                    symbol,
                    timeframe,
                    canonical_data_hash,
                    rows,
                    start_at,
                    end_at,
                    bars_json,
                    test_definition_hash,
                    test_owner_experiment_id,
                    test_consumed_at
                from strategy_experiment_snapshots
                where snapshot_id = ?
                """,
                (snapshot.snapshot_id,),
            ).fetchone()
            if existing is not None:
                if tuple(existing[:10]) != immutable:
                    raise ValueError("strategy_experiment_conflict")
                connection.commit()
                return _row_to_snapshot(existing)

            connection.execute(
                """
                insert into strategy_experiment_snapshots (
                    snapshot_id,
                    created_at,
                    market,
                    symbol,
                    timeframe,
                    canonical_data_hash,
                    rows,
                    start_at,
                    end_at,
                    bars_json,
                    test_definition_hash,
                    test_owner_experiment_id,
                    test_consumed_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    *immutable,
                    snapshot.test_definition_hash,
                    snapshot.test_owner_experiment_id,
                    _optional_datetime_text(snapshot.test_consumed_at),
                ),
            )
            connection.commit()
            return snapshot
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def claimed_definition(self, snapshot_id: str) -> str | None:
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select test_definition_hash
                from strategy_experiment_snapshots
                where snapshot_id = ?
                """,
                (snapshot_id,),
            ).fetchone()
        finally:
            connection.close()
        return str(row[0]) if row is not None and row[0] is not None else None

    def claim_test_holdout(
        self,
        *,
        snapshot_id: str,
        definition_hash: str,
        experiment_id: str,
        consumed_at: datetime,
    ) -> Literal["claimed", "replay"]:
        connection = self._connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            claimed = connection.execute(
                "select test_definition_hash from strategy_experiment_snapshots where snapshot_id = ?",
                (snapshot_id,),
            ).fetchone()
            if claimed is None:
                raise ValueError("strategy_experiment_snapshot_not_found")
            if claimed[0] == definition_hash:
                connection.commit()
                return "replay"
            if claimed[0] is not None:
                raise ValueError("test_holdout_consumed")
            updated = connection.execute(
                """
                update strategy_experiment_snapshots
                set test_definition_hash = ?, test_owner_experiment_id = ?, test_consumed_at = ?
                where snapshot_id = ? and test_definition_hash is null
                """,
                (definition_hash, experiment_id, _datetime_text(consumed_at), snapshot_id),
            )
            if updated.rowcount != 1:
                raise ValueError("test_holdout_consumed")
            connection.commit()
            return "claimed"
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def record_completed(
        self,
        experiment: StrategyExperimentRecord,
        candidates: list[StrategyExperimentCandidateRecord],
    ) -> None:
        if any(candidate.experiment_id != experiment.experiment_id for candidate in candidates):
            raise ValueError("strategy_experiment_candidate_mismatch")
        connection = self._connect()
        try:
            connection.execute("BEGIN")
            _insert_experiment(connection, experiment)
            for candidate in candidates:
                _insert_candidate(connection, candidate)
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def record_failed(self, experiment: StrategyExperimentRecord) -> None:
        connection = self._connect()
        try:
            _insert_experiment(connection, experiment)
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get(self, experiment_id: str) -> StrategyExperimentDetail | None:
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select
                    experiment.experiment_id,
                    experiment.created_at,
                    experiment.status,
                    experiment.definition_hash,
                    experiment.holdout_key,
                    experiment.strategy_revision,
                    experiment.source_run_id,
                    experiment.snapshot_id,
                    experiment.market,
                    experiment.symbol,
                    experiment.timeframe,
                    experiment.definition_json,
                    experiment.evaluation_count,
                    experiment.selected_candidate_id,
                    experiment.completion_reason,
                    experiment.result_hash,
                    experiment.error_code,
                    experiment.error_detail,
                    snapshot.snapshot_id,
                    snapshot.created_at,
                    snapshot.market,
                    snapshot.symbol,
                    snapshot.timeframe,
                    snapshot.canonical_data_hash,
                    snapshot.rows,
                    snapshot.start_at,
                    snapshot.end_at,
                    snapshot.bars_json,
                    snapshot.test_definition_hash,
                    snapshot.test_owner_experiment_id,
                    snapshot.test_consumed_at
                from strategy_experiments experiment
                join strategy_experiment_snapshots snapshot
                  on snapshot.snapshot_id = experiment.snapshot_id
                where experiment.experiment_id = ?
                """,
                (experiment_id,),
            ).fetchone()
            if row is None:
                return None
            candidate_rows = connection.execute(
                """
                select
                    experiment_id,
                    candidate_id,
                    candidate_revision,
                    parameters_json,
                    train_metrics_json,
                    validation_metrics_json,
                    test_metrics_json,
                    walk_forward_json,
                    eligible,
                    rank
                from strategy_experiment_candidates
                where experiment_id = ?
                order by candidate_id
                """,
                (experiment_id,),
            ).fetchall()
        finally:
            connection.close()
        return StrategyExperimentDetail(
            experiment=_row_to_experiment(row[:18]),
            snapshot=_row_to_snapshot(row[18:]),
            candidates=[_row_to_candidate(candidate_row) for candidate_row in candidate_rows],
        )

    def list_recent(
        self,
        *,
        strategy_revision: str | None = None,
        source_run_id: str | None = None,
        limit: int = 20,
    ) -> list[StrategyExperimentRecord]:
        clauses: list[str] = []
        parameters: list[Any] = []
        if strategy_revision:
            clauses.append("strategy_revision = ?")
            parameters.append(strategy_revision)
        if source_run_id:
            clauses.append("source_run_id = ?")
            parameters.append(source_run_id)
        where = f"where {' and '.join(clauses)}" if clauses else ""
        bounded_limit = max(1, min(int(limit), 50))

        connection = self._connect()
        try:
            rows = connection.execute(
                f"""
                select
                    experiment_id,
                    created_at,
                    status,
                    definition_hash,
                    holdout_key,
                    strategy_revision,
                    source_run_id,
                    snapshot_id,
                    market,
                    symbol,
                    timeframe,
                    definition_json,
                    evaluation_count,
                    selected_candidate_id,
                    completion_reason,
                    result_hash,
                    error_code,
                    error_detail
                from strategy_experiments
                {where}
                order by created_at desc, rowid desc
                limit ?
                """,
                (*parameters, bounded_limit),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_experiment(row) for row in rows]


def _snapshot_immutable_values(snapshot: StrategyExperimentSnapshot) -> tuple[Any, ...]:
    return (
        snapshot.snapshot_id,
        _datetime_text(snapshot.created_at),
        snapshot.market,
        snapshot.symbol,
        snapshot.timeframe,
        snapshot.canonical_data_hash,
        snapshot.rows,
        snapshot.start_at,
        snapshot.end_at,
        _dump_json(snapshot.bars),
    )


def _insert_experiment(connection: sqlite3.Connection, experiment: StrategyExperimentRecord) -> None:
    connection.execute(
        """
        insert into strategy_experiments (
            experiment_id,
            created_at,
            status,
            definition_hash,
            holdout_key,
            strategy_revision,
            source_run_id,
            snapshot_id,
            market,
            symbol,
            timeframe,
            definition_json,
            evaluation_count,
            selected_candidate_id,
            completion_reason,
            result_hash,
            error_code,
            error_detail
        )
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            experiment.experiment_id,
            _datetime_text(experiment.created_at),
            experiment.status,
            experiment.definition_hash,
            experiment.holdout_key,
            experiment.strategy_revision,
            experiment.source_run_id,
            experiment.snapshot_id,
            experiment.market,
            experiment.symbol,
            experiment.timeframe,
            _dump_json(experiment.definition),
            experiment.evaluation_count,
            experiment.selected_candidate_id,
            experiment.completion_reason,
            experiment.result_hash,
            experiment.error_code,
            experiment.error_detail,
        ),
    )


def _insert_candidate(
    connection: sqlite3.Connection,
    candidate: StrategyExperimentCandidateRecord,
) -> None:
    connection.execute(
        """
        insert into strategy_experiment_candidates (
            experiment_id,
            candidate_id,
            candidate_revision,
            parameters_json,
            train_metrics_json,
            validation_metrics_json,
            test_metrics_json,
            walk_forward_json,
            eligible,
            rank
        )
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            candidate.experiment_id,
            candidate.candidate_id,
            candidate.candidate_revision,
            _dump_json(candidate.parameters),
            _dump_json(candidate.train_metrics),
            _dump_json(candidate.validation_metrics),
            _dump_json(candidate.test_metrics) if candidate.test_metrics is not None else None,
            _dump_json(candidate.walk_forward),
            int(candidate.eligible),
            candidate.rank,
        ),
    )


def _row_to_snapshot(row: tuple[Any, ...]) -> StrategyExperimentSnapshot:
    return StrategyExperimentSnapshot(
        snapshot_id=str(row[0]),
        created_at=_parse_datetime(str(row[1])),
        market=str(row[2]),
        symbol=str(row[3]),
        timeframe=str(row[4]),
        canonical_data_hash=str(row[5]),
        rows=int(row[6]),
        start_at=str(row[7]),
        end_at=str(row[8]),
        bars=cast(list[dict[str, Any]], json.loads(row[9])),
        test_definition_hash=str(row[10]) if row[10] is not None else None,
        test_owner_experiment_id=str(row[11]) if row[11] is not None else None,
        test_consumed_at=_parse_datetime(str(row[12])) if row[12] is not None else None,
    )


def _row_to_experiment(row: tuple[Any, ...]) -> StrategyExperimentRecord:
    return StrategyExperimentRecord(
        experiment_id=str(row[0]),
        created_at=_parse_datetime(str(row[1])),
        status=cast(Literal["completed", "failed"], str(row[2])),
        definition_hash=str(row[3]),
        holdout_key=str(row[4]),
        strategy_revision=str(row[5]),
        source_run_id=str(row[6]),
        snapshot_id=str(row[7]),
        market=str(row[8]),
        symbol=str(row[9]),
        timeframe=str(row[10]),
        definition=cast(dict[str, Any], json.loads(row[11])),
        evaluation_count=int(row[12]),
        selected_candidate_id=str(row[13]) if row[13] is not None else None,
        completion_reason=str(row[14]) if row[14] is not None else None,
        result_hash=str(row[15]) if row[15] is not None else None,
        error_code=str(row[16]) if row[16] is not None else None,
        error_detail=str(row[17]) if row[17] is not None else None,
    )


def _row_to_candidate(row: tuple[Any, ...]) -> StrategyExperimentCandidateRecord:
    return StrategyExperimentCandidateRecord(
        experiment_id=str(row[0]),
        candidate_id=str(row[1]),
        candidate_revision=str(row[2]),
        parameters=cast(list[dict[str, Any]], json.loads(row[3])),
        train_metrics=cast(dict[str, Any], json.loads(row[4])),
        validation_metrics=cast(dict[str, Any], json.loads(row[5])),
        test_metrics=cast(dict[str, Any], json.loads(row[6])) if row[6] is not None else None,
        walk_forward=cast(dict[str, Any], json.loads(row[7])),
        eligible=bool(row[8]),
        rank=int(row[9]) if row[9] is not None else None,
    )


def _dump_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )


def _parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)


def _datetime_text(value: datetime) -> str:
    if value.tzinfo is not None and value.utcoffset() is not None:
        value = value.astimezone(timezone.utc)
    return value.isoformat()


def _optional_datetime_text(value: datetime | None) -> str | None:
    return _datetime_text(value) if value is not None else None
