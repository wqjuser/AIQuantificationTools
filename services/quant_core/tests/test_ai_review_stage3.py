from __future__ import annotations

import json
import re
import sqlite3
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.ai_review_stage3 import (
    AiReviewEvidenceAssembler,
    AiReviewStage3Error,
    build_strategy_lineage_key,
)
from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_json,
    canonical_sha256,
    canonical_snapshot_id,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    StrategyExperimentStore,
)


HASH_PATTERN = re.compile(r"^[0-9a-f]{64}$")
NOW = datetime(2026, 7, 10, tzinfo=timezone.utc)


def _bars(seed: int) -> list[dict[str, Any]]:
    return [
        {
            "timestamp": f"2026-07-{day:02d}T00:00:00+00:00",
            "timestampMs": int(datetime(2026, 7, day, tzinfo=timezone.utc).timestamp() * 1000),
            "open": 100 + seed + day,
            "high": 102 + seed + day,
            "low": 99 + seed + day,
            "close": 101 + seed + day,
            "volume": 1_000 + day,
        }
        for day in range(1, 4)
    ]


def _strategy(
    *,
    name: str = "Canonical SMA",
    market: str = "ashare",
    symbol: str = "600000",
    timeframe: str = "1d",
    entry_conditions: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    payload = {
        "name": name,
        "market": market,
        "symbols": [symbol],
        "timeframe": timeframe,
        "version": 1,
        "entryConditions": entry_conditions
        or [
            {"kind": "close_above_sma", "params": {"window": 20}},
            {"kind": "volume_above_sma", "params": {"window": 10}},
        ],
        "exitConditions": [{"kind": "close_below_sma", "params": {"window": 20}}],
        "risk": {
            "positionPct": 0.8,
            "stopLossPct": 0.08,
            "takeProfitPct": 0.18,
            "maxDrawdownPct": 0.2,
        },
    }
    return strategy_config_to_payload(strategy_config_from_payload(payload))


def _result_hash(
    candidates: list[StrategyExperimentCandidateRecord],
    selected_candidate_id: str,
) -> str:
    ordered = sorted(candidates, key=lambda candidate: canonical_json(candidate.parameters))
    selected = next(candidate for candidate in ordered if candidate.candidate_id == selected_candidate_id)
    return canonical_sha256(
        {
            "candidates": [
                {
                    "parameters": candidate.parameters,
                    "trainMetrics": candidate.train_metrics,
                    "validationMetrics": candidate.validation_metrics,
                    "walkForward": candidate.walk_forward,
                }
                for candidate in ordered
            ],
            "selection": {
                "parameters": selected.parameters,
                "testMetrics": selected.test_metrics,
            },
            "completionReason": "selected",
            "schemaVersion": 1,
        }
    )


class AiReviewEvidenceAssemblerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        root = Path(self.temporary_directory.name)
        self.run_store = ResearchRunStore(root / "runs.sqlite3")
        self.experiment_store = StrategyExperimentStore(root / "experiments.sqlite3")
        self.assembler = AiReviewEvidenceAssembler(
            experiment_store=self.experiment_store,
            run_store=self.run_store,
        )

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def _record_experiment(
        self,
        experiment_id: str,
        *,
        seed: int = 0,
        strategy: dict[str, Any] | None = None,
        status: str = "completed",
        parameter_value: int = 20,
    ) -> None:
        strategy = strategy or _strategy()
        market = str(strategy["market"])
        symbol = str(strategy["symbols"][0])
        timeframe = str(strategy["timeframe"])
        revision = str(strategy["revision"])
        run_id = f"run-{experiment_id}"
        bars = _bars(seed)
        data_hash = canonical_data_hash(bars)
        snapshot_id = canonical_snapshot_id(
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            canonical_data_hash=data_hash,
        )
        definition = {
            "baseStrategy": strategy,
            "strategyRevision": revision,
            "sourceRunId": run_id,
            "snapshotId": snapshot_id,
            "canonicalDataHash": data_hash,
            "market": market,
            "symbol": symbol,
            "timeframe": timeframe,
            "resultSchemaVersion": 1,
        }
        definition_hash = canonical_sha256(definition)
        selected_id = f"candidate-{experiment_id}-selected"
        candidates = [
            StrategyExperimentCandidateRecord(
                experiment_id=experiment_id,
                candidate_id=selected_id,
                candidate_revision=f"candidate-revision-{experiment_id}-selected",
                parameters=[
                    {
                        "conditionSide": "entry",
                        "conditionIndex": 0,
                        "parameter": "window",
                        "value": parameter_value,
                    }
                ],
                train_metrics={"tradeCount": 12, "totalReturnPct": 6.0},
                validation_metrics={"tradeCount": 5, "totalReturnPct": 3.0},
                test_metrics={"tradeCount": 4, "totalReturnPct": 2.0},
                walk_forward={"windows": [{"totalReturnPct": 1.0}]},
                eligible=True,
                rank=1,
            ),
            StrategyExperimentCandidateRecord(
                experiment_id=experiment_id,
                candidate_id=f"candidate-{experiment_id}-other",
                candidate_revision=f"candidate-revision-{experiment_id}-other",
                parameters=[
                    {
                        "conditionSide": "entry",
                        "conditionIndex": 0,
                        "parameter": "window",
                        "value": parameter_value + 1,
                    }
                ],
                train_metrics={"tradeCount": 10, "totalReturnPct": 4.0},
                validation_metrics={"tradeCount": 4, "totalReturnPct": 1.0},
                test_metrics=None,
                walk_forward={"windows": [{"totalReturnPct": 0.5}]},
                eligible=True,
                rank=2,
            ),
        ]
        self.run_store.record(
            ResearchRunAudit(
                run_id=run_id,
                created_at=NOW,
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                strategy_name=str(strategy["name"]),
                strategy_revision=revision,
                data_rows=len(bars),
                metrics={"totalReturnPct": 1.0},
                decisions=[],
                execution_mode="paper_only",
                data_quality={"source": "fixture", "isComplete": True, "warnings": [], "rows": len(bars)},
                data_snapshot={
                    "source": "fixture",
                    "isComplete": True,
                    "warnings": [],
                    "rows": len(bars),
                    "start": bars[0]["timestamp"],
                    "end": bars[-1]["timestamp"],
                    "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
                    "hash": data_hash,
                    "bars": bars,
                },
                strategy_config=strategy,
            )
        )
        self.experiment_store.put_snapshot(
            StrategyExperimentSnapshot(
                snapshot_id=snapshot_id,
                created_at=NOW,
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                canonical_data_hash=data_hash,
                rows=len(bars),
                start_at=str(bars[0]["timestamp"]),
                end_at=str(bars[-1]["timestamp"]),
                bars=bars,
                test_definition_hash=definition_hash if status == "completed" else None,
                test_owner_experiment_id=experiment_id if status == "completed" else None,
                test_consumed_at=NOW if status == "completed" else None,
            )
        )
        record = StrategyExperimentRecord(
            experiment_id=experiment_id,
            created_at=NOW,
            status=status,  # type: ignore[arg-type]
            definition_hash=definition_hash,
            holdout_key=canonical_sha256({"snapshotId": snapshot_id, "validationEndIndex": 2}),
            strategy_revision=revision,
            source_run_id=run_id,
            snapshot_id=snapshot_id,
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            definition=definition,
            evaluation_count=5 if status == "completed" else 0,
            selected_candidate_id=selected_id if status == "completed" else None,
            completion_reason="selected" if status == "completed" else None,
            result_hash=_result_hash(candidates, selected_id) if status == "completed" else None,
            error_code="experiment_failed" if status != "completed" else None,
            error_detail="sanitized failure" if status != "completed" else None,
        )
        if status == "completed":
            self.experiment_store.record_completed(record, candidates)
        else:
            self.experiment_store.record_failed(record)

    def _assert_error(self, code: str, status: int, callback: Any) -> AiReviewStage3Error:
        with self.assertRaises(AiReviewStage3Error) as raised:
            callback()
        self.assertEqual(raised.exception.code, code)
        self.assertEqual(raised.exception.status, status)
        self.assertTrue(raised.exception.detail)
        return raised.exception

    def _update_experiment(self, experiment_id: str, assignment: str, values: tuple[Any, ...]) -> None:
        with sqlite3.connect(self.experiment_store.path) as connection:
            connection.execute(
                f"update strategy_experiments set {assignment} where experiment_id = ?",
                (*values, experiment_id),
            )

    def test_rejects_missing_and_incomplete_primary_experiments(self) -> None:
        self._assert_error(
            "ai_review_experiment_not_found",
            404,
            lambda: self.assembler.assemble("missing", []),
        )
        self._record_experiment("failed", status="failed")
        self._assert_error(
            "ai_review_experiment_not_completed",
            409,
            lambda: self.assembler.assemble("failed", []),
        )

    def test_rejects_corrupt_experiment_bindings_and_hashes(self) -> None:
        mutations = {
            "source run": ("source_run_id = ?", ("missing-run",)),
            "strategy revision": ("strategy_revision = ?", ("wrong-revision",)),
            "definition hash": ("definition_hash = ?", ("0" * 64,)),
            "result hash": ("result_hash = ?", ("f" * 64,)),
            "selected candidate": ("selected_candidate_id = ?", ("missing-candidate",)),
        }
        for index, (label, (assignment, values)) in enumerate(mutations.items(), start=1):
            with self.subTest(binding=label):
                experiment_id = f"corrupt-{index}"
                self._record_experiment(experiment_id, seed=index)
                self._update_experiment(experiment_id, assignment, values)
                self._assert_error(
                    "ai_review_evidence_conflict",
                    409,
                    lambda experiment_id=experiment_id: self.assembler.assemble(experiment_id, []),
                )

        self._record_experiment("snapshot-original", seed=20)
        self._record_experiment("snapshot-other", seed=21)
        other = self.experiment_store.get("snapshot-other")
        self.assertIsNotNone(other)
        self._update_experiment(
            "snapshot-original",
            "snapshot_id = ?",
            (other.snapshot.snapshot_id,),  # type: ignore[union-attr]
        )
        self._assert_error(
            "ai_review_evidence_conflict",
            409,
            lambda: self.assembler.assemble("snapshot-original", []),
        )

    def test_rejects_invalid_snapshot_definition_and_source_run_bindings(self) -> None:
        experiment_id = "snapshot-bindings"
        self._record_experiment(experiment_id, seed=30)
        with sqlite3.connect(self.experiment_store.path) as connection:
            connection.execute(
                "update strategy_experiment_snapshots set test_definition_hash = ? where test_owner_experiment_id = ?",
                ("wrong-definition", experiment_id),
            )
        self._assert_error(
            "ai_review_evidence_conflict",
            409,
            lambda: self.assembler.assemble(experiment_id, []),
        )

    def test_accepts_exact_replay_owned_by_the_original_experiment(self) -> None:
        self._record_experiment("original", seed=35)
        original = self.experiment_store.get("original")
        self.assertIsNotNone(original)
        replay_id = "replay"
        self.experiment_store.record_completed(
            replace(original.experiment, experiment_id=replay_id),  # type: ignore[union-attr]
            [
                replace(candidate, experiment_id=replay_id)
                for candidate in original.candidates  # type: ignore[union-attr]
            ],
        )

        bundle = self.assembler.assemble(replay_id, [])
        self.assertEqual(bundle["primaryExperiment"]["experimentId"], replay_id)

        experiment_id = "run-bindings"
        self._record_experiment(experiment_id, seed=31)
        with sqlite3.connect(self.run_store.path) as connection:
            connection.execute(
                "update research_runs set strategy_revision = ? where run_id = ?",
                ("wrong-revision", f"run-{experiment_id}"),
            )
        self._assert_error(
            "ai_review_evidence_conflict",
            409,
            lambda: self.assembler.assemble(experiment_id, []),
        )

    def test_rejects_selected_candidate_without_test_metrics(self) -> None:
        experiment_id = "missing-test"
        self._record_experiment(experiment_id, seed=40)
        detail = self.experiment_store.get(experiment_id)
        self.assertIsNotNone(detail)
        with sqlite3.connect(self.experiment_store.path) as connection:
            connection.execute(
                "update strategy_experiment_candidates set test_metrics_json = null "
                "where experiment_id = ? and candidate_id = ?",
                (experiment_id, detail.experiment.selected_candidate_id),  # type: ignore[union-attr]
            )
        self._assert_error(
            "ai_review_evidence_conflict",
            409,
            lambda: self.assembler.assemble(experiment_id, []),
        )

    def test_rejects_test_metrics_on_an_unselected_candidate(self) -> None:
        experiment_id = "leaked-test"
        self._record_experiment(experiment_id, seed=41)
        detail = self.experiment_store.get(experiment_id)
        self.assertIsNotNone(detail)
        other = next(
            candidate
            for candidate in detail.candidates  # type: ignore[union-attr]
            if candidate.candidate_id != detail.experiment.selected_candidate_id  # type: ignore[union-attr]
        )
        with sqlite3.connect(self.experiment_store.path) as connection:
            connection.execute(
                "update strategy_experiment_candidates set test_metrics_json = ? "
                "where experiment_id = ? and candidate_id = ?",
                (json.dumps({"tradeCount": 1}), experiment_id, other.candidate_id),
            )
        self._assert_error(
            "ai_review_evidence_conflict",
            409,
            lambda: self.assembler.assemble(experiment_id, []),
        )

    def test_rejects_invalid_comparison_id_sets(self) -> None:
        invalid_sets = [
            ["comparison", "comparison"],
            ["primary"],
            ["one", "two", "three", "four", "five"],
        ]
        for comparison_ids in invalid_sets:
            with self.subTest(comparison_ids=comparison_ids):
                self._assert_error(
                    "invalid_ai_review_request",
                    400,
                    lambda comparison_ids=comparison_ids: self.assembler.assemble("primary", comparison_ids),
                )

    def test_rejects_comparisons_with_different_context(self) -> None:
        self._record_experiment("primary", seed=50)
        variants = {
            "market": _strategy(market="us", symbol="AAPL"),
            "symbol": _strategy(symbol="600001"),
            "timeframe": _strategy(timeframe="5m"),
        }
        for index, (label, strategy) in enumerate(variants.items(), start=1):
            with self.subTest(context=label):
                experiment_id = f"context-{label}"
                self._record_experiment(experiment_id, seed=50 + index, strategy=strategy)
                self._assert_error(
                    "ai_review_comparison_ineligible",
                    409,
                    lambda experiment_id=experiment_id: self.assembler.assemble("primary", [experiment_id]),
                )

    def test_rejects_comparisons_with_different_strategy_shape(self) -> None:
        self._record_experiment("primary", seed=60)
        variants = {
            "name": _strategy(name="Canonical SMA!"),
            "condition order": _strategy(
                entry_conditions=[
                    {"kind": "volume_above_sma", "params": {"window": 10}},
                    {"kind": "close_above_sma", "params": {"window": 20}},
                ]
            ),
            "condition kind": _strategy(
                entry_conditions=[
                    {"kind": "rsi_below", "params": {"threshold": 30, "window": 20}},
                    {"kind": "volume_above_sma", "params": {"window": 10}},
                ]
            ),
            "parameter keys": _strategy(
                entry_conditions=[
                    {"kind": "close_above_sma", "params": {"window": 20, "offset": 0}},
                    {"kind": "volume_above_sma", "params": {"window": 10}},
                ]
            ),
        }
        for index, (label, strategy) in enumerate(variants.items(), start=1):
            with self.subTest(shape=label):
                experiment_id = f"shape-{index}"
                self._record_experiment(experiment_id, seed=60 + index, strategy=strategy)
                self._assert_error(
                    "ai_review_comparison_ineligible",
                    409,
                    lambda experiment_id=experiment_id: self.assembler.assemble("primary", [experiment_id]),
                )

    def test_lineage_normalizes_tokens_and_name_but_not_strategy_shape(self) -> None:
        strategy = _strategy(name="  Canonical   SMA  ")
        experiment = {
            "market": " ASHARE ",
            "symbol": " 600000 ",
            "timeframe": " 1D ",
            "strategy": strategy,
        }
        normalized = {
            "timeframe": "1d",
            "symbol": "600000",
            "market": "ashare",
            "strategy": {**strategy, "name": "canonical sma"},
        }
        self.assertEqual(build_strategy_lineage_key(experiment), build_strategy_lineage_key(normalized))
        self.assertRegex(build_strategy_lineage_key(experiment), HASH_PATTERN)

    def test_assembles_single_canonical_evidence_without_raw_bars(self) -> None:
        self._record_experiment("primary", seed=70)
        bundle = self.assembler.assemble("primary", [])

        self.assertEqual(bundle["schemaVersion"], 1)
        self.assertEqual(bundle["mode"], "single")
        self.assertEqual(bundle["primaryExperiment"]["experimentId"], "primary")
        self.assertEqual(bundle["comparisonExperiments"], [])
        self.assertRegex(bundle["strategyLineageKey"], HASH_PATTERN)
        self.assertRegex(bundle["evidenceHash"], HASH_PATTERN)
        self.assertEqual(
            bundle["safetyBoundary"],
            {"paperOnly": True, "liveTradingAllowed": False, "orderSubmissionAllowed": False},
        )
        evidence_ids = [item["id"] for item in bundle["evidenceItems"]]
        self.assertEqual(len(evidence_ids), len(set(evidence_ids)))
        self.assertTrue(all(item_id.startswith("experiment:primary:") for item_id in evidence_ids))
        self.assertNotIn('"bars"', canonical_json(bundle))
        candidate_items = [item for item in bundle["evidenceItems"] if item["kind"] == "candidate_metrics"]
        selected = next(item for item in candidate_items if item["value"]["selected"])
        unselected = next(item for item in candidate_items if not item["value"]["selected"])
        self.assertIn("testMetrics", selected["value"])
        self.assertNotIn("testMetrics", unselected["value"])
        self.assertEqual(
            bundle["evidenceHash"],
            canonical_sha256({key: value for key, value in bundle.items() if key != "evidenceHash"}),
        )

    def test_assembles_four_comparisons_in_user_order_with_stable_hash(self) -> None:
        experiment_ids = ["primary", "comparison-1", "comparison-2", "comparison-3", "comparison-4"]
        for index, experiment_id in enumerate(experiment_ids):
            strategy = _strategy(
                entry_conditions=[
                    {"kind": "close_above_sma", "params": {"window": 20 + index}},
                    {"kind": "volume_above_sma", "params": {"window": 10}},
                ]
            )
            self._record_experiment(
                experiment_id,
                seed=80 + index,
                strategy=strategy,
                parameter_value=20 + index,
            )
        comparison_ids = ["comparison-3", "comparison-1", "comparison-4", "comparison-2"]
        first = self.assembler.assemble("primary", comparison_ids)
        second = self.assembler.assemble("primary", comparison_ids)

        self.assertEqual(first["mode"], "comparison")
        self.assertEqual(
            [item["experimentId"] for item in first["comparisonExperiments"]],
            comparison_ids,
        )
        self.assertEqual(first["evidenceHash"], second["evidenceHash"])
        self.assertEqual(first, second)

    def test_evidence_hash_ignores_persisted_json_key_order(self) -> None:
        experiment_id = "key-order"
        self._record_experiment(experiment_id, seed=90)
        first = self.assembler.assemble(experiment_id, [])
        with sqlite3.connect(self.experiment_store.path) as connection:
            row = connection.execute(
                "select candidate_id, validation_metrics_json from strategy_experiment_candidates "
                "where experiment_id = ? order by candidate_id limit 1",
                (experiment_id,),
            ).fetchone()
            self.assertIsNotNone(row)
            metrics = json.loads(row[1])
            reordered = {key: metrics[key] for key in reversed(metrics)}
            connection.execute(
                "update strategy_experiment_candidates set validation_metrics_json = ? "
                "where experiment_id = ? and candidate_id = ?",
                (json.dumps(reordered), experiment_id, row[0]),
            )
        second = self.assembler.assemble(experiment_id, [])
        self.assertEqual(first["evidenceHash"], second["evidenceHash"])


if __name__ == "__main__":
    unittest.main()
