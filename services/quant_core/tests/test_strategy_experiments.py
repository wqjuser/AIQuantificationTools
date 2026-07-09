from __future__ import annotations

import json
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import FrozenInstanceError, replace
from datetime import datetime, timedelta, timezone
from threading import Barrier
from unittest.mock import patch

from quant_core.backtest import BacktestEngine
from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    canonical_sha256,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import (
    BacktestMetrics,
    BacktestRun,
    Condition,
    DataQuality,
    OHLCVBar,
    RiskRules,
    StrategyConfig,
)
from quant_core.research import _data_snapshot_payload
from quant_core.runs import ResearchRunAudit, ResearchRunStore, research_run_export_to_payload, research_run_import_to_audit
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentDetail,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    StrategyExperimentStore,
)
from quant_core.strategy_experiments import (
    DEADLINE_SECONDS,
    MAX_CANDIDATES,
    MAX_EVALUATIONS,
    MAX_SOURCE_BARS,
    MAX_WALK_FORWARD_WINDOWS,
    ParameterDimension,
    StrategyExperimentError,
    StrategyExperimentRunner,
    _result_hash,
    expand_candidates,
    strategy_experiment_detail_to_payload,
    strategy_experiment_records_to_payload,
)
from quant_core.strategy_library import StrategyLibraryStore


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


RUNNER_START = datetime(2026, 1, 1, tzinfo=timezone.utc)


def runner_strategy() -> StrategyConfig:
    return StrategyConfig(
        name="Bounded experiment",
        market="ashare",
        symbols=["600000"],
        timeframe="1d",
        entry_conditions=[Condition(kind="close_above_sma", params={"window": 2})],
        exit_conditions=[Condition(kind="close_below_sma", params={"window": 2})],
        risk=RiskRules(position_pct=0.5, max_drawdown_pct=0.2),
    )


def runner_bars(count: int) -> list[dict[str, object]]:
    return [
        {
            "timestamp": (RUNNER_START + timedelta(days=index)).isoformat(),
            "timestampMs": int((RUNNER_START + timedelta(days=index)).timestamp() * 1000),
            "open": 100 + index % 3,
            "high": 102 + index % 3,
            "low": 99 + index % 3,
            "close": 101 + index % 3,
            "volume": 1_000 + index,
        }
        for index in range(count)
    ]


def runner_audit(run_id: str, strategy: StrategyConfig, count: int = 100) -> ResearchRunAudit:
    bars = runner_bars(count)
    snapshot = {
        "source": "fixture",
        "isComplete": True,
        "warnings": [],
        "rows": len(bars),
        "start": bars[0]["timestamp"],
        "end": bars[-1]["timestamp"],
        "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
        "hash": canonical_data_hash(bars),
        "bars": bars,
    }
    return ResearchRunAudit(
        run_id=run_id,
        created_at=datetime(2026, 7, 10, tzinfo=timezone.utc),
        market=strategy.market,
        symbol=strategy.symbols[0],
        timeframe=strategy.timeframe,
        strategy_name=strategy.name,
        strategy_revision=strategy.revision,
        data_rows=len(bars),
        metrics={},
        decisions=[],
        execution_mode="paper_only",
        data_quality={"source": "fixture", "isComplete": True, "warnings": [], "rows": len(bars)},
        data_snapshot=snapshot,
        strategy_config=strategy_config_to_payload(strategy),
        backtest_assumptions={"initialCash": 100_000, "feeBps": 3, "slippageBps": 2},
    )


def runner_payload(
    strategy: StrategyConfig,
    *,
    run_id: str = "runner-run",
    values: tuple[int | float, ...] = (2, 3, 4, 5, 6),
    minimum_trade_count: int = 2,
    maximum_drawdown_pct: int | float | None = 20,
    walk_forward: dict[str, int] | None = None,
) -> dict[str, object]:
    return {
        "strategyRevision": strategy.revision,
        "sourceRunId": run_id,
        "assumptions": {"initialCash": 100_000.0, "feeBps": 3.0, "slippageBps": 2.0},
        "dimensions": [
            {
                "conditionSide": "entry",
                "conditionIndex": 0,
                "parameter": "window",
                "values": list(values),
            }
        ],
        "guardrails": {
            "minimumTradeCount": minimum_trade_count,
            "maximumDrawdownPct": maximum_drawdown_pct,
        },
        "walkForward": walk_forward,
    }


class RecordingBacktestEngine:
    calls: list[dict[str, object]] = []

    def __init__(self, initial_cash: float, fee_rate: float, slippage_rate: float) -> None:
        self.assumptions = (initial_cash, fee_rate, slippage_rate)

    def run(
        self,
        strategy: StrategyConfig,
        bars: list[OHLCVBar],
        *,
        evaluation_start_index: int = 0,
    ) -> BacktestRun:
        window = int(strategy.entry_conditions[0].params["window"])
        start_index = (bars[0].timestamp - RUNNER_START).days
        end_index = (bars[-1].timestamp - RUNNER_START).days
        self.calls.append(
            {
                "window": window,
                "startIndex": start_index,
                "endIndex": end_index,
                "evaluationStartIndex": evaluation_start_index,
                "assumptions": self.assumptions,
            }
        )
        if end_index == 79:
            ranking = {
                2: (9, 4, 2, 0),
                3: (10, 5, 1, 2),
                4: (10, 4, 1, 2),
                5: (10, 4, 2, 2),
                6: (10, 4, 2, 2),
            }
            total_return, drawdown, profit_factor, trade_count = ranking.get(window, (1, 1, 1, 2))
        elif end_index == 99:
            total_return, drawdown, profit_factor, trade_count = (42, 3, 4, 2)
        else:
            total_return, drawdown, profit_factor, trade_count = (window * 100, window, window, 2)
        metrics = BacktestMetrics(
            total_return_pct=total_return,
            annual_return_pct=total_return,
            max_drawdown_pct=drawdown,
            win_rate_pct=50,
            profit_factor=profit_factor,
            trade_count=trade_count,
        )
        return BacktestRun(
            strategy_name=strategy.name,
            strategy_revision=strategy.revision,
            symbol=strategy.symbols[0],
            market=strategy.market,
            timeframe=strategy.timeframe,
            metrics=metrics,
            trades=[],
            equity_curve=[],
            data_quality=DataQuality(
                source="recording-engine",
                is_complete=True,
                rows=len(bars) - evaluation_start_index,
            ),
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

    def test_record_completed_rejects_candidate_owned_by_another_experiment(self):
        experiment = experiment_record()
        wrong_owner = candidate_record(experiment_id="experiment-other")

        with self.assertRaisesRegex(
            ValueError, "^strategy_experiment_candidate_mismatch$"
        ):
            self.store.record_completed(experiment, [wrong_owner])

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

    def test_normalizes_aware_datetimes_to_utc_before_sorting_and_readback(self):
        utc_plus_eight = timezone(timedelta(hours=8))
        snapshot = replace(
            experiment_snapshot(),
            created_at=datetime(2026, 7, 10, 1, tzinfo=utc_plus_eight),
        )
        earlier = experiment_record(
            "experiment-earlier",
            created_at=datetime(2026, 7, 10, 1, tzinfo=utc_plus_eight),
        )
        later = experiment_record(
            "experiment-later",
            status="failed",
            created_at=datetime(
                2026,
                7,
                9,
                14,
                tzinfo=timezone(-timedelta(hours=4)),
            ),
        )
        consumed_at = datetime(2026, 7, 10, 2, tzinfo=utc_plus_eight)
        self.store.put_snapshot(snapshot)
        self.store.claim_test_holdout(
            snapshot_id=snapshot.snapshot_id,
            definition_hash=earlier.definition_hash,
            experiment_id=earlier.experiment_id,
            consumed_at=consumed_at,
        )
        self.store.record_completed(
            earlier,
            [candidate_record(experiment_id=earlier.experiment_id)],
        )
        self.store.record_failed(later)

        recent = self.store.list_recent()
        detail = self.store.get(earlier.experiment_id)
        with sqlite3.connect(self.database_path) as connection:
            stored_snapshot_times = connection.execute(
                """
                select created_at, test_consumed_at
                from strategy_experiment_snapshots
                where snapshot_id = ?
                """,
                (snapshot.snapshot_id,),
            ).fetchone()
            stored_experiment_times = dict(
                connection.execute(
                    "select experiment_id, created_at from strategy_experiments"
                ).fetchall()
            )

        self.assertEqual(
            (stored_snapshot_times, stored_experiment_times),
            (
                ("2026-07-09T17:00:00+00:00", "2026-07-09T18:00:00+00:00"),
                {
                    earlier.experiment_id: "2026-07-09T17:00:00+00:00",
                    later.experiment_id: "2026-07-09T18:00:00+00:00",
                },
            ),
        )
        self.assertEqual(
            [record.experiment_id for record in recent],
            [later.experiment_id, earlier.experiment_id],
        )
        assert detail is not None
        self.assertEqual(
            detail.experiment.created_at,
            datetime(2026, 7, 9, 17, tzinfo=timezone.utc),
        )
        self.assertEqual(
            detail.snapshot.created_at,
            datetime(2026, 7, 9, 17, tzinfo=timezone.utc),
        )
        self.assertEqual(
            detail.snapshot.test_consumed_at,
            datetime(2026, 7, 9, 18, tzinfo=timezone.utc),
        )

    def test_store_has_no_update_or_delete_api(self):
        self.assertFalse(hasattr(self.store, "update"))
        self.assertFalse(hasattr(self.store, "delete"))


class StrategyExperimentDefinitionTests(unittest.TestCase):
    def setUp(self):
        self.strategy = runner_strategy()

    def test_expands_canonical_candidates_independent_of_dimension_order(self):
        dimensions = (
            ParameterDimension("entry", 0, "window", (15, 20.0, 20, 25)),
            ParameterDimension("exit", 0, "window", (15, 20, 25)),
        )

        candidates = expand_candidates(self.strategy, dimensions)

        self.assertEqual(len(candidates), 9)
        self.assertEqual(candidates, expand_candidates(self.strategy, tuple(reversed(dimensions))))
        self.assertTrue(all(len(candidate.candidate_id) == 12 for candidate in candidates))
        self.assertTrue(all(candidate.candidate_id == canonical_sha256(candidate.parameters)[:12] for candidate in candidates))
        self.assertEqual(
            candidates[0].parameters,
            [
                {
                    "conditionSide": "entry",
                    "conditionIndex": 0,
                    "parameter": "window",
                    "value": 15,
                },
                {
                    "conditionSide": "exit",
                    "conditionIndex": 0,
                    "parameter": "window",
                    "value": 15,
                },
            ],
        )
        self.assertEqual(self.strategy.entry_conditions[0].params["window"], 2)

    def test_normalizes_threshold_numbers_and_removes_duplicates(self):
        rsi_strategy = replace(
            self.strategy,
            entry_conditions=[Condition(kind="rsi_below", params={"window": 14, "threshold": 30})],
        )

        candidates = expand_candidates(
            rsi_strategy,
            (ParameterDimension("entry", 0, "threshold", (-0.0, 0, 30.0, 30, 30.5)),),
        )

        self.assertEqual(
            [candidate.parameters[0]["value"] for candidate in candidates],
            [0, 30, 30.5],
        )

    def test_rejects_unsupported_duplicate_or_out_of_range_dimensions(self):
        invalid_dimensions = (
            (ParameterDimension("entry", 0, "threshold", (30,)),),
            (
                ParameterDimension("entry", 0, "window", (2,)),
                ParameterDimension("entry", 0, "window", (3,)),
            ),
            (ParameterDimension("entry", 0, "window", (0,)),),
            (ParameterDimension("entry", 0, "window", (2.5,)),),
            (ParameterDimension("entry", 0, "window", ("2",)),),
            (ParameterDimension("entry", 9, "window", (2,)),),
        )

        for dimensions in invalid_dimensions:
            with self.subTest(dimensions=dimensions), self.assertRaises(StrategyExperimentError) as raised:
                expand_candidates(self.strategy, dimensions)
            self.assertEqual((raised.exception.status, raised.exception.error), (400, "invalid_strategy_experiment"))

    def test_rejects_large_cartesian_product_before_materializing_candidates(self):
        multi_condition_strategy = replace(
            self.strategy,
            entry_conditions=[
                Condition(kind="close_above_sma", params={"window": 2}),
                Condition(kind="volume_above_sma", params={"window": 2}),
            ],
        )
        dimensions = (
            ParameterDimension("entry", 0, "window", tuple(range(1, 251))),
            ParameterDimension("entry", 1, "window", tuple(range(1, 251))),
        )

        with (
            patch("quant_core.strategy_experiments.itertools.product", side_effect=AssertionError("materialized")),
            self.assertRaises(StrategyExperimentError) as raised,
        ):
            expand_candidates(multi_condition_strategy, dimensions)

        self.assertEqual((raised.exception.status, raised.exception.error), (400, "invalid_strategy_experiment"))

    def test_result_hash_excludes_derived_eligibility_and_rank(self):
        candidate = candidate_record()

        first = _result_hash(
            "definition-a",
            [candidate],
            selected_candidate_id=None,
            completion_reason="no_eligible_candidate",
        )
        second = _result_hash(
            "definition-a",
            [replace(candidate, eligible=False, rank=None)],
            selected_candidate_id=None,
            completion_reason="no_eligible_candidate",
        )

        self.assertEqual(first, second)


class StrategyExperimentRunnerTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.strategy = runner_strategy()
        self.strategy_store = StrategyLibraryStore(f"{self.temporary_directory.name}/strategies.sqlite")
        self.run_store = ResearchRunStore(f"{self.temporary_directory.name}/runs.sqlite")
        self.experiment_store = StrategyExperimentStore(
            f"{self.temporary_directory.name}/experiments.sqlite"
        )
        self.strategy_store.save(self.strategy, audit_run_id="runner-run")
        self.run_store.record(runner_audit("runner-run", self.strategy))
        self.runner = StrategyExperimentRunner(
            strategy_store=self.strategy_store,
            run_store=self.run_store,
            experiment_store=self.experiment_store,
        )
        RecordingBacktestEngine.calls = []

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_exact_constants_and_hard_limits_fail_before_engine_call(self):
        self.assertEqual(
            (MAX_SOURCE_BARS, MAX_CANDIDATES, MAX_WALK_FORWARD_WINDOWS, MAX_EVALUATIONS, DEADLINE_SECONDS),
            (500, 81, 12, 512, 15.0),
        )
        requests: list[tuple[StrategyExperimentRunner, dict[str, object]]] = [
            (self.runner, runner_payload(self.strategy, values=tuple(range(1, 83)))),
            (
                self.runner,
                runner_payload(
                    self.strategy,
                    values=(2,),
                    walk_forward={"trainBars": 20, "validationBars": 10, "stepBars": 4},
                ),
            ),
            (
                self.runner,
                runner_payload(
                    self.strategy,
                    values=tuple(range(1, 33)),
                    walk_forward={"trainBars": 20, "validationBars": 10, "stepBars": 8},
                ),
            ),
        ]
        oversized_audit = runner_audit("run-501", self.strategy, 501)

        class StaticRunStore:
            def get(self, run_id: str) -> ResearchRunAudit | None:
                return oversized_audit if run_id == oversized_audit.run_id else None

        requests.append(
            (
                StrategyExperimentRunner(
                    strategy_store=self.strategy_store,
                    run_store=StaticRunStore(),  # type: ignore[arg-type]
                    experiment_store=self.experiment_store,
                ),
                runner_payload(self.strategy, run_id="run-501", values=(2,)),
            )
        )

        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            for runner, payload in requests:
                with self.subTest(payload=payload), self.assertRaises(StrategyExperimentError) as raised:
                    runner.run_new(payload)
                self.assertEqual((raised.exception.status, raised.exception.error), (400, "invalid_strategy_experiment"))

        self.assertEqual(RecordingBacktestEngine.calls, [])
        self.assertEqual(self.experiment_store.list_recent(), [])
        with sqlite3.connect(self.experiment_store.path) as connection:
            snapshot_count = connection.execute(
                "select count(*) from strategy_experiment_snapshots"
            ).fetchone()[0]
        self.assertEqual(snapshot_count, 0)

    def test_accepts_exact_bar_candidate_and_walk_forward_limits(self):
        self.run_store.record(runner_audit("run-500", self.strategy, 500))
        candidate_limit = runner_payload(
            self.strategy,
            run_id="run-500",
            values=tuple(range(1, 82)),
            minimum_trade_count=99,
        )
        window_limit = runner_payload(
            self.strategy,
            run_id="run-500",
            values=(2,),
            minimum_trade_count=99,
            walk_forward={"trainBars": 100, "validationBars": 50, "stepBars": 22},
        )

        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            candidates = self.runner.run_new(candidate_limit)
            windows = self.runner.run_new(window_limit)

        self.assertEqual(len(candidates.candidates), 81)
        self.assertEqual(candidates.experiment.evaluation_count, 162)
        self.assertEqual(windows.candidates[0].walk_forward["validationWindowCount"], 12)
        self.assertEqual(windows.experiment.evaluation_count, 26)

    def test_verifies_both_strategy_bodies_and_requires_complete_v2_snapshot(self):
        mismatched = runner_audit("mismatched-run", self.strategy)
        mismatched.strategy_config["name"] = "Tampered body"  # type: ignore[index]
        self.run_store.record(mismatched)
        legacy = replace(
            runner_audit("legacy-run", self.strategy),
            data_snapshot={
                key: value
                for key, value in runner_audit("legacy-run", self.strategy).data_snapshot.items()
                if key != "hashVersion"
            },
        )
        self.run_store.record(legacy)

        for run_id, expected_error in (
            ("mismatched-run", "strategy_experiment_conflict"),
            ("legacy-run", "source_snapshot_reaudit_required"),
        ):
            with self.subTest(run_id=run_id), self.assertRaises(StrategyExperimentError) as raised:
                self.runner.run_new(runner_payload(self.strategy, run_id=run_id, values=(2,)))
            self.assertEqual(raised.exception.status, 409)
            self.assertEqual(raised.exception.error, expected_error)

        self.assertEqual(self.experiment_store.list_recent(), [])

    def test_executes_train_and_validation_for_all_candidates_and_ranks_validation_only(self):
        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            detail = self.runner.run_new(runner_payload(self.strategy))

        self.assertEqual(len([call for call in RecordingBacktestEngine.calls if call["endIndex"] == 59]), 5)
        self.assertEqual(len([call for call in RecordingBacktestEngine.calls if call["endIndex"] == 79]), 5)
        self.assertEqual(len([call for call in RecordingBacktestEngine.calls if call["endIndex"] == 99]), 1)
        self.assertTrue(
            all(call["assumptions"] == (100_000, 0.0003, 0.0002) for call in RecordingBacktestEngine.calls)
        )
        for call in RecordingBacktestEngine.calls:
            warmup = call["window"] + 1
            self.assertEqual(call["evaluationStartIndex"], warmup)
            if call["endIndex"] == 79:
                self.assertEqual(call["startIndex"], 60 - warmup)
            if call["endIndex"] == 99:
                self.assertEqual(call["startIndex"], 80 - warmup)
        ineligible = next(candidate for candidate in detail.candidates if candidate.parameters[0]["value"] == 2)
        self.assertFalse(ineligible.eligible)
        self.assertIsNone(ineligible.rank)
        eligible = [candidate for candidate in detail.candidates if candidate.eligible]
        expected = sorted(
            eligible,
            key=lambda candidate: (
                -candidate.validation_metrics["totalReturnPct"],
                candidate.validation_metrics["maxDrawdownPct"],
                -candidate.validation_metrics["profitFactor"],
                candidate.candidate_id,
            ),
        )
        self.assertEqual([candidate.rank for candidate in expected], list(range(1, len(expected) + 1)))
        selected = expected[0]
        self.assertEqual(detail.experiment.selected_candidate_id, selected.candidate_id)
        self.assertEqual(
            [candidate.candidate_id for candidate in detail.candidates if candidate.test_metrics is not None],
            [selected.candidate_id],
        )
        self.assertEqual(detail.experiment.evaluation_count, 11)

    def test_no_eligible_candidate_does_not_claim_or_read_test(self):
        payload = runner_payload(self.strategy, values=(2, 3), minimum_trade_count=99)

        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            detail = self.runner.run_new(payload)

        self.assertEqual(detail.experiment.completion_reason, "no_eligible_candidate")
        self.assertIsNone(detail.experiment.selected_candidate_id)
        self.assertTrue(all(candidate.rank is None and candidate.test_metrics is None for candidate in detail.candidates))
        self.assertFalse(any(call["endIndex"] == 99 for call in RecordingBacktestEngine.calls))
        self.assertIsNone(self.experiment_store.claimed_definition(detail.snapshot.snapshot_id))

    def test_walk_forward_windows_never_cross_into_final_test(self):
        payload = runner_payload(
            self.strategy,
            values=(2,),
            minimum_trade_count=99,
            walk_forward={"trainBars": 20, "validationBars": 10, "stepBars": 10},
        )

        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            detail = self.runner.run_new(payload)

        evidence = detail.candidates[0].walk_forward
        self.assertEqual(evidence["validationWindowCount"], 6)
        self.assertEqual(len(evidence["windows"]), 6)
        self.assertTrue(all(window["validationEndIndex"] <= 80 for window in evidence["windows"]))
        self.assertFalse(any(call["endIndex"] >= 80 for call in RecordingBacktestEngine.calls))
        self.assertEqual(detail.experiment.evaluation_count, 14)

    def test_early_holdout_preflight_blocks_a_different_definition_before_candidate_work(self):
        first = runner_payload(self.strategy, values=(3,))
        second = runner_payload(
            self.strategy,
            values=(3,),
            maximum_drawdown_pct=19,
        )
        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            self.runner.run_new(first)
            RecordingBacktestEngine.calls = []
            with self.assertRaises(StrategyExperimentError) as raised:
                self.runner.run_new(second)

        self.assertEqual((raised.exception.status, raised.exception.error), (409, "test_holdout_consumed"))
        self.assertEqual(RecordingBacktestEngine.calls, [])

    def test_atomic_holdout_claim_happens_before_the_only_test_engine_call(self):
        payload = runner_payload(self.strategy, values=(3,))
        with (
            patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine),
            patch.object(
                self.experiment_store,
                "claim_test_holdout",
                side_effect=ValueError("test_holdout_consumed"),
            ),
            self.assertRaises(StrategyExperimentError) as raised,
        ):
            self.runner.run_new(payload)

        self.assertEqual((raised.exception.status, raised.exception.error), (409, "test_holdout_consumed"))
        self.assertEqual([call["endIndex"] for call in RecordingBacktestEngine.calls], [59, 79])

    def test_deadline_crossing_persists_timeout_without_candidates(self):
        ticks = iter((0.0, DEADLINE_SECONDS))
        runner = StrategyExperimentRunner(
            strategy_store=self.strategy_store,
            run_store=self.run_store,
            experiment_store=self.experiment_store,
            monotonic=lambda: next(ticks),
        )

        with (
            patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine),
            self.assertRaises(StrategyExperimentError) as raised,
        ):
            runner.run_new(runner_payload(self.strategy, values=(3,)))

        self.assertEqual(raised.exception.error, "strategy_experiment_failed")
        self.assertIsNotNone(raised.exception.experiment_id)
        assert raised.exception.experiment_id is not None
        failed = self.experiment_store.get(raised.exception.experiment_id)
        self.assertIsNotNone(failed)
        assert failed is not None
        self.assertEqual(failed.experiment.error_code, "experiment_timeout")
        self.assertEqual(failed.experiment.evaluation_count, 0)
        self.assertEqual(failed.candidates, [])
        self.assertEqual(RecordingBacktestEngine.calls, [])

    def test_unknown_engine_errors_are_sanitized_and_persisted(self):
        class FailingBacktestEngine(RecordingBacktestEngine):
            def run(self, *args, **kwargs):
                raise RuntimeError("secret adapter credential")

        with (
            patch("quant_core.strategy_experiments.BacktestEngine", FailingBacktestEngine),
            self.assertRaises(StrategyExperimentError) as raised,
        ):
            self.runner.run_new(runner_payload(self.strategy, values=(3,)))

        self.assertEqual(raised.exception.error, "strategy_experiment_failed")
        self.assertNotIn("secret", raised.exception.detail)
        assert raised.exception.experiment_id is not None
        failed = self.experiment_store.get(raised.exception.experiment_id)
        assert failed is not None
        self.assertEqual(failed.experiment.error_code, "strategy_experiment_failed")
        self.assertNotIn("secret", failed.experiment.error_detail or "")
        self.assertEqual(failed.candidates, [])

    def test_exact_replay_uses_persisted_definition_and_snapshot(self):
        payload = runner_payload(self.strategy, values=(3, 4))
        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            original = self.runner.run_new(payload)
            self.run_store.delete("runner-run")
            self.strategy_store.delete(self.strategy.revision)
            RecordingBacktestEngine.calls = []
            replay = self.runner.replay(original.experiment.experiment_id)

        self.assertNotEqual(replay.experiment.experiment_id, original.experiment.experiment_id)
        self.assertEqual(replay.experiment.definition_hash, original.experiment.definition_hash)
        self.assertEqual(replay.experiment.result_hash, original.experiment.result_hash)
        self.assertEqual(replay.experiment.definition, original.experiment.definition)
        self.assertEqual(replay.snapshot.bars, original.snapshot.bars)
        self.assertEqual(len([call for call in RecordingBacktestEngine.calls if call["endIndex"] == 99]), 1)

    def test_payload_codecs_include_detail_evidence_and_keep_list_rows_compact(self):
        with patch("quant_core.strategy_experiments.BacktestEngine", RecordingBacktestEngine):
            detail = self.runner.run_new(runner_payload(self.strategy, values=(3, 4)))

        detail_payload = strategy_experiment_detail_to_payload(detail)
        records_payload = strategy_experiment_records_to_payload([detail.experiment])

        self.assertEqual(detail_payload["experimentId"], detail.experiment.experiment_id)
        self.assertEqual(detail_payload["snapshot"]["bars"], detail.snapshot.bars)
        self.assertEqual(len(detail_payload["candidates"]), 2)
        self.assertEqual(records_payload[0]["definitionHash"], detail.experiment.definition_hash)
        self.assertNotIn("snapshot", records_payload[0])
        self.assertNotIn("candidates", records_payload[0])
        encoded = json.dumps(detail_payload, sort_keys=True)
        for forbidden in ("trades", "equityCurve", "auditRunId", "liveTradingAllowed", "orderSubmitted"):
            self.assertNotIn(forbidden, encoded)


if __name__ == "__main__":
    unittest.main()
