from __future__ import annotations

import json
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import FrozenInstanceError, replace
from datetime import datetime, timedelta, timezone
from threading import Barrier

from quant_core.backtest import BacktestEngine
from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import Condition, DataQuality, OHLCVBar, RiskRules, StrategyConfig
from quant_core.research import _data_snapshot_payload
from quant_core.runs import ResearchRunAudit, ResearchRunStore, research_run_export_to_payload, research_run_import_to_audit
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentDetail,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    StrategyExperimentStore,
)


def snapshot_bar(timestamp: str, close: float) -> dict[str, object]:
    return {
        "timestamp": timestamp,
        "timestampMs": 0,
        "open": close,
        "high": close + 1,
        "low": close - 1,
        "close": close,
        "volume": 1_000,
    }


def strategy_payload(*, revision: str) -> dict[str, object]:
    return {
        "name": "Canonical SMA",
        "revision": revision,
        "market": "ashare",
        "symbols": ["600000"],
        "timeframe": "1d",
        "version": 1,
        "entryConditions": [{"kind": "close_above_sma", "params": {"window": 20}}],
        "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
        "risk": {
            "positionPct": 0.8,
            "stopLossPct": 0.08,
            "takeProfitPct": 0.18,
            "maxDrawdownPct": 0.2,
        },
    }


def research_audit(run_id: str, data_snapshot: dict[str, object]) -> ResearchRunAudit:
    return ResearchRunAudit(
        run_id=run_id,
        created_at=datetime(2026, 7, 1, tzinfo=timezone.utc),
        market="ashare",
        symbol="600000",
        timeframe="1d",
        strategy_name="Canonical SMA",
        strategy_revision="strategy-revision",
        data_rows=len(data_snapshot["bars"]),
        metrics={},
        decisions=[],
        execution_mode="paper_only",
        data_snapshot=data_snapshot,
    )


def experiment_snapshot(snapshot_id: str = "snapshot-a") -> StrategyExperimentSnapshot:
    bars = [
        snapshot_bar("2026-07-01T00:00:00+00:00", 100.0),
        snapshot_bar("2026-07-02T00:00:00+00:00", 101.0),
    ]
    return StrategyExperimentSnapshot(
        snapshot_id=snapshot_id,
        created_at=datetime(2026, 7, 10, 1, tzinfo=timezone.utc),
        market="ashare",
        symbol="600000",
        timeframe="1d",
        canonical_data_hash="canonical-data-hash",
        rows=len(bars),
        start_at="2026-07-01T00:00:00+00:00",
        end_at="2026-07-02T00:00:00+00:00",
        bars=bars,
    )


def experiment_record(
    experiment_id: str = "experiment-a",
    *,
    status: str = "completed",
    created_at: datetime | None = None,
    strategy_revision: str = "strategy-a",
    source_run_id: str = "run-a",
    snapshot_id: str = "snapshot-a",
) -> StrategyExperimentRecord:
    failed = status == "failed"
    return StrategyExperimentRecord(
        experiment_id=experiment_id,
        created_at=created_at or datetime(2026, 7, 10, 2, tzinfo=timezone.utc),
        status=status,
        definition_hash=f"definition-{experiment_id}",
        holdout_key="holdout-a",
        strategy_revision=strategy_revision,
        source_run_id=source_run_id,
        snapshot_id=snapshot_id,
        market="ashare",
        symbol="600000",
        timeframe="1d",
        definition={"experimentId": experiment_id, "split": [60, 20, 20]},
        evaluation_count=0 if failed else 5,
        selected_candidate_id=None if failed else "candidate-a",
        completion_reason=None if failed else "selected",
        result_hash=None if failed else f"result-{experiment_id}",
        error_code="experiment_failed" if failed else None,
        error_detail="sanitized failure" if failed else None,
    )


def candidate_record(
    candidate_id: str = "candidate-a",
    *,
    experiment_id: str = "experiment-a",
    rank: int | None = 1,
) -> StrategyExperimentCandidateRecord:
    return StrategyExperimentCandidateRecord(
        experiment_id=experiment_id,
        candidate_id=candidate_id,
        candidate_revision=f"revision-{candidate_id}",
        parameters=[{"conditionSide": "entry", "parameter": "window", "value": 20}],
        train_metrics={"totalReturnPct": 3.0},
        validation_metrics={"totalReturnPct": 2.0},
        test_metrics={"totalReturnPct": 1.0} if rank == 1 else None,
        walk_forward={"validationWindowCount": 0},
        eligible=rank is not None,
        rank=rank,
    )


class BacktestEvaluationBoundaryTests(unittest.TestCase):
    def setUp(self):
        closes = [10, 12, 10, 12, 10, 12, 11]
        self.bars = [
            OHLCVBar(
                symbol="600000",
                market="ashare",
                timeframe="1d",
                timestamp=datetime(2026, 7, index + 1, tzinfo=timezone.utc),
                open=close,
                high=close,
                low=close,
                close=close,
                volume=1_000,
            )
            for index, close in enumerate(closes)
        ]
        self.strategy = StrategyConfig(
            name="Evaluation boundary",
            market="ashare",
            symbols=["600000"],
            timeframe="1d",
            entry_conditions=[Condition(kind="close_above_sma", params={"window": 2})],
            exit_conditions=[Condition(kind="close_below_sma", params={"window": 2})],
            risk=RiskRules(position_pct=0.5),
        )

    def test_warms_indicators_without_trading_before_evaluation_boundary(self):
        result = BacktestEngine().run(self.strategy, self.bars, evaluation_start_index=5)
        default_result = BacktestEngine().run(self.strategy, self.bars)

        self.assertEqual(result.trades[0].timestamp, self.bars[5].timestamp)
        self.assertTrue(all(trade.timestamp >= self.bars[5].timestamp for trade in result.trades))
        self.assertEqual(result.data_quality.rows, len(self.bars) - 5)
        self.assertEqual(result.equity_curve[0].timestamp, self.bars[5].timestamp)
        self.assertLess(default_result.trades[0].timestamp, self.bars[5].timestamp)
        self.assertEqual(len(default_result.equity_curve), len(self.bars))

    def test_rejects_invalid_evaluation_boundaries(self):
        for boundary in (-1, len(self.bars)):
            with self.subTest(boundary=boundary), self.assertRaisesRegex(
                ValueError, "^invalid_evaluation_start_index$"
            ):
                BacktestEngine().run(self.strategy, self.bars, evaluation_start_index=boundary)

    def test_preserves_empty_bars_error(self):
        with self.assertRaisesRegex(ValueError, "^backtest requires at least one OHLCV bar$"):
            BacktestEngine().run(self.strategy, [])


class CanonicalContractTests(unittest.TestCase):
    def test_canonical_json_normalizes_integral_float_and_negative_zero(self):
        self.assertEqual(canonical_json({"b": -0.0, "a": 1.0}), '{"a":1,"b":0}')

    def test_v2_snapshot_hash_survives_persistence_normalization(self):
        bars = normalize_snapshot_bars([snapshot_bar("2026-07-01T00:00:00+00:00", 100.0)])
        self.assertEqual(len(canonical_data_hash(bars)), 64)
        self.assertEqual(canonical_data_hash(json.loads(json.dumps(bars))), canonical_data_hash(bars))

    def test_strategy_payload_recomputes_revision_instead_of_trusting_external_value(self):
        payload = strategy_payload(revision="external-revision")
        strategy = strategy_config_from_payload(payload)
        self.assertNotEqual(strategy.revision, "external-revision")
        self.assertEqual(strategy_config_to_payload(strategy)["revision"], strategy.revision)

    def test_new_research_snapshot_uses_v2_full_canonical_hash(self):
        bar = OHLCVBar(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            timestamp=datetime(2026, 7, 1, tzinfo=timezone.utc),
            open=100.0,
            high=101.0,
            low=99.0,
            close=100.0,
            volume=1_000.0,
        )

        snapshot = _data_snapshot_payload(
            [bar],
            DataQuality(source="fixture", is_complete=True, rows=1),
        )

        self.assertEqual(snapshot["hashVersion"], DATA_SNAPSHOT_HASH_VERSION)
        self.assertEqual(snapshot["hash"], canonical_data_hash(snapshot["bars"]))
        self.assertEqual(len(snapshot["hash"]), 64)

    def test_store_preserves_legacy_version_and_validates_v2_snapshot(self):
        bars = normalize_snapshot_bars([snapshot_bar("2026-07-01T00:00:00+00:00", 100.0)])
        legacy_snapshot = {"rows": 1, "hash": "legacy-hash", "bars": bars}
        v2_snapshot = {
            "rows": 1,
            "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
            "hash": canonical_data_hash(bars),
            "bars": bars,
        }

        with tempfile.TemporaryDirectory() as tmp:
            store = ResearchRunStore(f"{tmp}/runs.sqlite")
            store.record(research_audit("legacy-run", legacy_snapshot))
            store.record(research_audit("v2-run", v2_snapshot))
            legacy = store.get("legacy-run")
            v2 = store.get("v2-run")

        assert legacy is not None
        assert v2 is not None
        self.assertNotIn("hashVersion", legacy.data_snapshot)
        self.assertEqual(legacy.data_snapshot["hash"], "legacy-hash")
        self.assertEqual(v2.data_snapshot["hashVersion"], DATA_SNAPSHOT_HASH_VERSION)

    def test_import_rejects_tampered_v2_snapshot_even_when_manifest_hash_matches(self):
        bars = normalize_snapshot_bars([snapshot_bar("2026-07-01T00:00:00+00:00", 100.0)])
        snapshot = {
            "rows": 1,
            "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
            "hash": canonical_data_hash(bars),
            "bars": bars,
        }
        tampered_v2_package = research_run_export_to_payload(research_audit("v2-import", snapshot))
        tampered_v2_package.pop("integrity", None)
        data_snapshot = tampered_v2_package["researchRun"]["dataSnapshot"]
        data_snapshot["hashVersion"] = DATA_SNAPSHOT_HASH_VERSION
        data_snapshot["bars"][0]["close"] = 100.5

        with self.assertRaisesRegex(ValueError, "data_snapshot_hash_mismatch"):
            research_run_import_to_audit(tampered_v2_package)


class StrategyExperimentStoreTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.database_path = f"{self.temporary_directory.name}/strategy-experiments.sqlite"
        self.store = StrategyExperimentStore(self.database_path)

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_initializes_exact_tables_and_query_indexes(self):
        with sqlite3.connect(self.database_path) as connection:
            tables = {
                row[0]
                for row in connection.execute(
                    "select name from sqlite_master where type = 'table'"
                ).fetchall()
            }
            indexes = {
                row[0]: row[1]
                for row in connection.execute(
                    "select name, sql from sqlite_master where type = 'index' and sql is not null"
                ).fetchall()
            }

        self.assertEqual(
            tables,
            {
                "strategy_experiment_snapshots",
                "strategy_experiments",
                "strategy_experiment_candidates",
            },
        )
        self.assertTrue(
            any("(strategy_revision, created_at)" in sql for sql in indexes.values())
        )
        self.assertTrue(any("(source_run_id, created_at)" in sql for sql in indexes.values()))
        self.assertTrue(any("(holdout_key)" in sql for sql in indexes.values()))

    def test_records_are_frozen(self):
        snapshot = experiment_snapshot()
        experiment = experiment_record()
        candidate = candidate_record()
        detail = StrategyExperimentDetail(experiment=experiment, snapshot=snapshot, candidates=[candidate])

        for record, field in (
            (snapshot, "snapshot_id"),
            (experiment, "experiment_id"),
            (candidate, "candidate_id"),
            (detail, "candidates"),
        ):
            with self.subTest(record=type(record).__name__), self.assertRaises(FrozenInstanceError):
                setattr(record, field, "changed")

    def test_put_snapshot_deduplicates_identical_content(self):
        snapshot = experiment_snapshot()

        first = self.store.put_snapshot(snapshot)
        second = self.store.put_snapshot(snapshot)

        self.assertEqual(first, snapshot)
        self.assertEqual(second.snapshot_id, first.snapshot_id)
        with sqlite3.connect(self.database_path) as connection:
            count = connection.execute(
                "select count(*) from strategy_experiment_snapshots"
            ).fetchone()[0]
        self.assertEqual(count, 1)

    def test_put_snapshot_rejects_any_immutable_field_mismatch(self):
        snapshot = experiment_snapshot()
        self.store.put_snapshot(snapshot)
        mismatches = {
            "created_at": snapshot.created_at + timedelta(seconds=1),
            "market": "crypto",
            "symbol": "000001",
            "timeframe": "1h",
            "canonical_data_hash": "different-hash",
            "rows": 3,
            "start_at": "2026-06-30T00:00:00+00:00",
            "end_at": "2026-07-03T00:00:00+00:00",
            "bars": [*snapshot.bars, snapshot_bar("2026-07-03T00:00:00+00:00", 102.0)],
        }

        for field, value in mismatches.items():
            with self.subTest(field=field), self.assertRaisesRegex(
                ValueError, "^strategy_experiment_conflict$"
            ):
                self.store.put_snapshot(replace(snapshot, **{field: value}))

        with sqlite3.connect(self.database_path) as connection:
            count = connection.execute(
                "select count(*) from strategy_experiment_snapshots"
            ).fetchone()[0]
        self.assertEqual(count, 1)

    def test_holdout_claim_is_write_once_and_exact_definition_replays(self):
        snapshot = experiment_snapshot()
        now = datetime(2026, 7, 10, 3, tzinfo=timezone.utc)
        self.store.put_snapshot(snapshot)

        self.assertIsNone(self.store.claimed_definition(snapshot.snapshot_id))
        self.assertEqual(
            self.store.claim_test_holdout(
                snapshot_id=snapshot.snapshot_id,
                definition_hash="definition-a",
                experiment_id="experiment-a",
                consumed_at=now,
            ),
            "claimed",
        )
        self.assertEqual(
            self.store.claim_test_holdout(
                snapshot_id=snapshot.snapshot_id,
                definition_hash="definition-a",
                experiment_id="experiment-replay",
                consumed_at=now + timedelta(hours=1),
            ),
            "replay",
        )
        self.assertEqual(self.store.claimed_definition(snapshot.snapshot_id), "definition-a")
        with sqlite3.connect(self.database_path) as connection:
            owner, consumed_at = connection.execute(
                """
                select test_owner_experiment_id, test_consumed_at
                from strategy_experiment_snapshots
                where snapshot_id = ?
                """,
                (snapshot.snapshot_id,),
            ).fetchone()
        self.assertEqual(owner, "experiment-a")
        self.assertEqual(consumed_at, now.isoformat())

        with self.assertRaisesRegex(ValueError, "^test_holdout_consumed$"):
            self.store.claim_test_holdout(
                snapshot_id=snapshot.snapshot_id,
                definition_hash="definition-b",
                experiment_id="experiment-b",
                consumed_at=now,
            )

    def test_holdout_claim_rejects_missing_snapshot(self):
        self.assertIsNone(self.store.claimed_definition("missing"))
        with self.assertRaisesRegex(
            ValueError, "^strategy_experiment_snapshot_not_found$"
        ):
            self.store.claim_test_holdout(
                snapshot_id="missing",
                definition_hash="definition-a",
                experiment_id="experiment-a",
                consumed_at=datetime(2026, 7, 10, 3, tzinfo=timezone.utc),
            )

    def test_racing_holdout_definitions_have_one_winner_and_one_stable_conflict(self):
        snapshot = experiment_snapshot()
        self.store.put_snapshot(snapshot)
        stores = [StrategyExperimentStore(self.database_path), StrategyExperimentStore(self.database_path)]
        barrier = Barrier(2)

        def claim(index: int) -> tuple[str, str, str]:
            definition_hash = f"definition-{index}"
            experiment_id = f"experiment-{index}"
            barrier.wait()
            try:
                result = stores[index].claim_test_holdout(
                    snapshot_id=snapshot.snapshot_id,
                    definition_hash=definition_hash,
                    experiment_id=experiment_id,
                    consumed_at=datetime(2026, 7, 10, 3, index, tzinfo=timezone.utc),
                )
            except ValueError as error:
                result = str(error)
            return definition_hash, experiment_id, result

        with ThreadPoolExecutor(max_workers=2) as executor:
            outcomes = list(executor.map(claim, range(2)))

        self.assertCountEqual(
            [outcome[2] for outcome in outcomes],
            ["claimed", "test_holdout_consumed"],
        )
        winning_definition, winning_experiment, _ = next(
            outcome for outcome in outcomes if outcome[2] == "claimed"
        )
        with sqlite3.connect(self.database_path) as connection:
            stored = connection.execute(
                """
                select test_definition_hash, test_owner_experiment_id
                from strategy_experiment_snapshots
                where snapshot_id = ?
                """,
                (snapshot.snapshot_id,),
            ).fetchone()
        self.assertEqual(stored, (winning_definition, winning_experiment))

    def test_record_completed_atomically_persists_experiment_and_all_candidates(self):
        snapshot = experiment_snapshot()
        experiment = experiment_record()
        candidates = [candidate_record(), candidate_record("candidate-b", rank=None)]
        self.store.put_snapshot(snapshot)

        self.store.record_completed(experiment, candidates)

        detail = self.store.get(experiment.experiment_id)
        self.assertEqual(
            detail,
            StrategyExperimentDetail(
                experiment=experiment,
                snapshot=snapshot,
                candidates=candidates,
            ),
        )
        with sqlite3.connect(self.database_path) as connection:
            experiment_count = connection.execute(
                "select count(*) from strategy_experiments"
            ).fetchone()[0]
            candidate_count = connection.execute(
                "select count(*) from strategy_experiment_candidates"
            ).fetchone()[0]
        self.assertEqual((experiment_count, candidate_count), (1, 2))

    def test_record_completed_rolls_back_experiment_when_candidate_insert_fails(self):
        snapshot = experiment_snapshot()
        experiment = experiment_record()
        duplicate = candidate_record()
        self.store.put_snapshot(snapshot)

        with self.assertRaises(sqlite3.IntegrityError):
            self.store.record_completed(experiment, [duplicate, duplicate])

        self.assertIsNone(self.store.get(experiment.experiment_id))
        with sqlite3.connect(self.database_path) as connection:
            experiment_count = connection.execute(
                "select count(*) from strategy_experiments"
            ).fetchone()[0]
            candidate_count = connection.execute(
                "select count(*) from strategy_experiment_candidates"
            ).fetchone()[0]
        self.assertEqual((experiment_count, candidate_count), (0, 0))

    def test_record_failed_persists_only_the_experiment(self):
        snapshot = experiment_snapshot()
        experiment = experiment_record("experiment-failed", status="failed")
        self.store.put_snapshot(snapshot)

        self.store.record_failed(experiment)

        detail = self.store.get(experiment.experiment_id)
        self.assertIsNotNone(detail)
        assert detail is not None
        self.assertEqual(detail.experiment, experiment)
        self.assertEqual(detail.snapshot, snapshot)
        self.assertEqual(detail.candidates, [])
        with sqlite3.connect(self.database_path) as connection:
            candidate_count = connection.execute(
                "select count(*) from strategy_experiment_candidates"
            ).fetchone()[0]
        self.assertEqual(candidate_count, 0)

    def test_list_recent_filters_summaries_and_clamps_limit_to_one_through_fifty(self):
        start = datetime(2026, 7, 10, tzinfo=timezone.utc)
        for index in range(52):
            self.store.record_failed(
                experiment_record(
                    f"experiment-{index:02d}",
                    status="failed",
                    created_at=start + timedelta(seconds=index),
                    strategy_revision="strategy-target" if index % 2 == 0 else "strategy-other",
                    source_run_id="run-target" if index % 3 == 0 else "run-other",
                )
            )

        self.assertEqual(len(self.store.list_recent(limit=0)), 1)
        self.assertEqual(len(self.store.list_recent(limit=100)), 50)
        filtered = self.store.list_recent(
            strategy_revision="strategy-target",
            source_run_id="run-target",
            limit=50,
        )
        self.assertTrue(filtered)
        self.assertTrue(all(isinstance(record, StrategyExperimentRecord) for record in filtered))
        self.assertTrue(all(record.strategy_revision == "strategy-target" for record in filtered))
        self.assertTrue(all(record.source_run_id == "run-target" for record in filtered))
        self.assertEqual(
            [record.created_at for record in filtered],
            sorted((record.created_at for record in filtered), reverse=True),
        )

    def test_store_has_no_update_or_delete_api(self):
        self.assertFalse(hasattr(self.store, "update"))
        self.assertFalse(hasattr(self.store, "delete"))


if __name__ == "__main__":
    unittest.main()
