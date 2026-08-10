from __future__ import annotations

import copy
import json
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from quant_core.ai_review_providers import AiReviewProviderRegistry, ProviderStatus
from quant_core.ai_review_runs import AiReviewRunStore
from quant_core.ai_review_stage3 import (
    AiReviewStage3Error,
    AiReviewEvidenceAssembler,
    AiReviewStage3Service,
    DeterministicAiReviewEngine,
    render_external_prompt,
)
from quant_core.canonical import (
    canonical_data_hash,
    canonical_json,
    canonical_sha256,
    canonical_snapshot_id,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.sealed_datasets import SealedDatasetStore, sealed_research_snapshot_payload
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    StrategyExperimentStore,
)
from quant_core.strategy_experiments import PolicyParameterDimension, expand_candidates


NOW = datetime(2026, 8, 10, tzinfo=timezone.utc)


def _bars(rows: int = 6) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=NOW - timedelta(minutes=rows - index),
            open=100 + index,
            high=101 + index,
            low=99 + index,
            close=100.5 + index,
            volume=10 + index,
        )
        for index in range(rows)
    ]


def _strategy_payload() -> dict[str, Any]:
    strategy = strategy_config_from_payload(
        {
            "name": "Sealed formal review fixture",
            "market": "crypto",
            "symbols": ["BTC/USDT"],
            "timeframe": "1m",
            "version": 2,
            "entryConditions": [],
            "exitConditions": [],
            "policy": {
                "kind": "regime_breakout_v2",
                "decisionTimeframe": "5m",
                "completedBarsOnly": True,
                "fillTiming": "next_completed_bar_open",
                "regime": {
                    "timeframe": "60m",
                    "closeAboveSmaWindow": 2,
                    "smaSlopeLookbackBars": 1,
                },
                "breakout": {
                    "lookbackBars": 3,
                    "excludeSignalBar": True,
                    "oneShotPerEvent": True,
                },
                "volume": {
                    "smaWindow": 2,
                    "multiplier": 1.5,
                    "excludeSignalBar": True,
                },
                "atr": {
                    "window": 2,
                    "smoothing": "wilder",
                    "initialMultiple": 1,
                    "trailingMultiple": 2,
                    "trailingStartsAfterProfit": True,
                    "trailingActivation": "positive_close",
                    "anchor": "highest_high_since_entry",
                    "neverLoosen": True,
                },
                "holding": {
                    "maxBars": 8,
                    "exitOnlyWithoutPositiveProgress": True,
                    "progressDefinition": "highest_close_above_entry",
                },
                "cooldown": {
                    "bars": 2,
                    "startsAfter": "filled_exit",
                    "requiresNewBreakoutEvent": True,
                },
            },
            "risk": {
                "positionPct": 0.6,
                "riskBudgetPct": 0.005,
                "stopLossPct": None,
                "takeProfitPct": None,
                "maxDrawdownPct": 0.03,
                "dailyLossLimitPct": 0.02,
                "maxTradeGroupsPerHour": 1,
                "maxEntryNotionalQuote": 10,
                "exitNotionalCapQuote": None,
            },
        }
    )
    return strategy_config_to_payload(strategy)


def _metrics(total_return: float) -> dict[str, Any]:
    return {
        "totalReturnPct": total_return,
        "annualReturnPct": total_return * 2,
        "maxDrawdownPct": 1.0,
        "winRatePct": 60.0,
        "profitFactor": 1.5,
        "tradeCount": 16,
        "roundTripCount": 8,
        "profitFactorInfinite": False,
    }


def _walk_forward(total_return: float) -> dict[str, Any]:
    return {
        "validationWindowCount": 7,
        "positiveReturnCount": 7,
        "medianReturnPct": total_return,
        "worstDrawdownPct": 1.0,
        "windows": [
            {
                "index": index,
                "validationMetrics": _metrics(total_return),
            }
            for index in range(7)
        ],
    }


def _formal_gate(
    *,
    selected: bool,
    sealed_dataset_hash: str | None = None,
) -> dict[str, Any]:
    validation_metrics = _metrics(3.0 if selected else 1.0)
    gate: dict[str, Any] = {
        "development": {
            "passed": True,
            "actualRoundTripCount": 32,
            "minimumRoundTripCount": 30,
        },
        "validation": {
            "passed": True,
            "failures": [],
            "metrics": validation_metrics,
            "guardrails": {
                "requirePositiveReturn": True,
                "minimumProfitFactor": 1.2,
                "maximumDrawdownPct": 3,
                "minimumRoundTripCount": 6,
            },
        },
        "rolling": {
            "passed": True,
            "positiveReturnCount": 7,
            "validationWindowCount": 7,
            "actualPositiveReturnPct": 100.0,
            "requiredWindowCount": 7,
            "minimumPositiveWindowCount": 5,
        },
        "stability": {
            "passed": True,
            "pending": False,
            "completeNeighborhood": True,
            "neighbors": [],
        },
        "pretest": {"passed": True},
    }
    if selected:
        gate["test"] = {
            "passed": True,
            "failures": [],
            "metrics": _metrics(2.0),
            "guardrails": {
                "requirePositiveReturn": True,
                "minimumProfitFactor": 1.2,
                "maximumDrawdownPct": 3,
                "minimumRoundTripCount": 6,
            },
            "withheldRowsCount": 1,
            "unknownTestIdentity": {"testHash": "f" * 64},
        }
        gate["sealedDatasetHash"] = sealed_dataset_hash
        gate["unknownFormalField"] = "must-not-leave-the-server"
    return gate


def _formal_result_hash(
    candidates: list[StrategyExperimentCandidateRecord],
    *,
    selected_candidate_id: str,
) -> str:
    ordered = sorted(candidates, key=lambda item: canonical_json(item.parameters))
    selected = next(item for item in ordered if item.candidate_id == selected_candidate_id)
    return canonical_sha256(
        {
            "candidates": [
                {
                    "parameters": item.parameters,
                    "trainMetrics": item.train_metrics,
                    "validationMetrics": item.validation_metrics,
                    "walkForward": item.walk_forward,
                    "gateEvaluation": item.gate_evaluation,
                }
                for item in ordered
            ],
            "selection": {
                "parameters": selected.parameters,
                "testMetrics": selected.test_metrics,
            },
            "completionReason": "profitability_gate_passed",
            "schemaVersion": 2,
            "profitabilityGatePassed": True,
        }
    )


class _NoTestReadSealedSource:
    def __init__(self, delegate: SealedDatasetStore) -> None:
        self.delegate = delegate
        self.development_reads = 0
        self.test_reads = 0

    def get_summary(self, dataset_id: str):
        return self.delegate.get_summary(dataset_id)

    def get_integrity(self, dataset_id: str):
        return self.delegate.get_integrity(dataset_id)

    def read_development_bars(self, dataset_id: str):
        self.development_reads += 1
        return self.delegate.read_development_bars(dataset_id)

    def read_claimed_test_bars(self, *args: Any, **kwargs: Any):
        self.test_reads += 1
        raise AssertionError("AI review must never read the claimed test partition")


class SealedFormalAiReviewTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        root = Path(self.temporary_directory.name)
        self.run_store = ResearchRunStore(root / "runs.sqlite3")
        self.experiment_store = StrategyExperimentStore(root / "experiments.sqlite3")
        self.review_store = AiReviewRunStore(root / "reviews.sqlite3")
        sealed_store = SealedDatasetStore(root / "sealed.sqlite3")
        bars = _bars()
        normalized = normalize_snapshot_bars(bars)
        summary = sealed_store.seal_dataset(
            MarketDataRequest(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                start=bars[0].timestamp,
                end=bars[-1].timestamp + timedelta(minutes=1),
            ),
            [bars],
            [
                DataQuality(
                    source="binance",
                    origin_source="binance",
                    is_complete=True,
                    rows=len(bars),
                    adjustment_mode="none",
                    canonical_hash=canonical_data_hash(normalized),
                )
            ],
            development_end_exclusive=bars[-1].timestamp,
            observed_at=NOW,
        )
        self.summary = summary
        self.sealed_source = _NoTestReadSealedSource(sealed_store)
        self._record_formal_experiment()

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def _record_formal_experiment(self) -> None:
        strategy_payload = _strategy_payload()
        strategy = strategy_config_from_payload(strategy_payload)
        expanded = expand_candidates(
            strategy,
            (PolicyParameterDimension("breakout.lookbackBars", (2, 3, 4)),),
        )
        experiment_id = "sealed-formal-review"
        run_id = "run-sealed-formal-review"
        definition = {
            "baseStrategy": strategy_payload,
            "strategyRevision": strategy.revision,
            "sourceRunId": run_id,
            "snapshotId": self.summary.dataset_id,
            "canonicalDataHash": self.summary.dataset_hash,
            "developmentDataHash": self.summary.development_hash,
            "sealedDataset": self.summary.to_payload(),
            "market": "crypto",
            "symbol": "BTC/USDT",
            "timeframe": "1m",
            "dimensions": [
                {"policyPath": "breakout.lookbackBars", "values": [2, 3, 4]}
            ],
            "resultSchemaVersion": 2,
        }
        definition_hash = canonical_sha256(definition)
        candidates = []
        for rank, expanded_candidate in enumerate(reversed(expanded), start=1):
            selected = expanded_candidate.parameters == [
                {"policyPath": "breakout.lookbackBars", "value": 3}
            ]
            gate = _formal_gate(
                selected=selected,
                sealed_dataset_hash=self.summary.dataset_hash,
            )
            candidates.append(
                StrategyExperimentCandidateRecord(
                    experiment_id=experiment_id,
                    candidate_id=expanded_candidate.candidate_id,
                    candidate_revision=expanded_candidate.strategy.revision,
                    parameters=expanded_candidate.parameters,
                    train_metrics=_metrics(4.0),
                    validation_metrics=_metrics(3.0 if selected else 1.0),
                    test_metrics=_metrics(2.0) if selected else None,
                    walk_forward=_walk_forward(1.0),
                    eligible=True,
                    rank=1 if selected else rank + 1,
                    gate_evaluation=gate,
                )
            )
        selected = next(item for item in candidates if item.rank == 1)
        result_hash = _formal_result_hash(
            candidates,
            selected_candidate_id=selected.candidate_id,
        )
        source_snapshot = sealed_research_snapshot_payload(self.summary)
        self.run_store.record(
            ResearchRunAudit(
                run_id=run_id,
                created_at=NOW,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                strategy_name=strategy.name,
                strategy_revision=strategy.revision,
                data_rows=self.summary.development_rows,
                metrics={},
                decisions=[],
                execution_mode="paper_only",
                data_quality={
                    "source": "binance",
                    "isComplete": True,
                    "warnings": [],
                    "rows": self.summary.development_rows,
                    "canonicalHash": self.summary.development_hash,
                },
                data_snapshot=source_snapshot,
                strategy_config=strategy_payload,
            )
        )
        development_bars = normalize_snapshot_bars(
            self.sealed_source.delegate.read_development_bars(self.summary.dataset_id)
        )
        self.experiment_store.put_snapshot(
            StrategyExperimentSnapshot(
                snapshot_id=self.summary.dataset_id,
                created_at=NOW,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash=self.summary.dataset_hash,
                rows=self.summary.rows,
                start_at=self.summary.start.isoformat(),
                end_at=self.summary.end_exclusive.isoformat(),
                bars=development_bars,
                test_definition_hash=definition_hash,
                test_owner_experiment_id=experiment_id,
                test_consumed_at=NOW,
            )
        )
        self.experiment_store.record_completed(
            StrategyExperimentRecord(
                experiment_id=experiment_id,
                created_at=NOW,
                status="completed",
                definition_hash=definition_hash,
                holdout_key=canonical_sha256({"sealed": self.summary.dataset_id}),
                strategy_revision=strategy.revision,
                source_run_id=run_id,
                snapshot_id=self.summary.dataset_id,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                definition=definition,
                evaluation_count=17,
                selected_candidate_id=selected.candidate_id,
                completion_reason="profitability_gate_passed",
                result_hash=result_hash,
                profitability_gate_passed=True,
            ),
            candidates,
        )

    def _assembler(self, sealed_source: Any | None = None) -> AiReviewEvidenceAssembler:
        return AiReviewEvidenceAssembler(
            experiment_store=self.experiment_store,
            run_store=self.run_store,
            sealed_bar_source=self.sealed_source if sealed_source is None else sealed_source,
        )

    def test_assembles_and_persists_formal_review_without_exposing_sealed_test_identity(self) -> None:
        assembler = self._assembler()

        bundle = assembler.assemble("sealed-formal-review", [])
        service = AiReviewStage3Service(
            evidence_assembler=assembler,
            deterministic_engine=DeterministicAiReviewEngine(),
            provider_registry=AiReviewProviderRegistry(
                (ProviderStatus("local", True, None, None),),
                {},
            ),
            review_store=self.review_store,
        )
        review = service.create_review(
            primary_experiment_id="sealed-formal-review",
            comparison_experiment_ids=[],
            provider_id="local",
            external_data_approved=False,
        )
        rendered_prompt, _ = render_external_prompt(bundle)

        bundle_text = canonical_json(bundle)
        prompt_text = canonical_json(json.loads(rendered_prompt))
        for forbidden in (
            self.summary.dataset_id,
            self.summary.dataset_hash,
            "datasetId",
            "datasetHash",
            "withheldRows",
            "testHash",
            "completed_klines",
        ):
            self.assertNotIn(forbidden, bundle_text)
            self.assertNotIn(forbidden, prompt_text)
        selected = next(
            item["value"]
            for item in bundle["evidenceItems"]
            if item["kind"] == "candidate_metrics" and item["value"]["selected"]
        )
        self.assertEqual(selected["parameters"], [
            {"policyPath": "breakout.lookbackBars", "value": 3}
        ])
        self.assertEqual(selected["testMetrics"]["totalReturnPct"], 2.0)
        self.assertTrue(selected["gateEvaluation"]["test"]["passed"])
        self.assertEqual(
            set(selected["gateEvaluation"]),
            {"development", "validation", "rolling", "stability", "pretest", "test"},
        )
        self.assertEqual(
            set(selected["gateEvaluation"]["test"]),
            {"passed", "failures", "metrics", "guardrails"},
        )
        self.assertEqual(selected["completionReason"], "profitability_gate_passed")
        self.assertIs(selected["profitabilityGatePassed"], True)
        self.assertEqual(
            bundle["primaryExperiment"]["snapshotId"],
            canonical_snapshot_id(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash=self.summary.development_hash,
            ),
        )
        self.assertEqual(review["evidenceHash"], bundle["evidenceHash"])
        self.assertGreaterEqual(self.sealed_source.development_reads, 2)
        self.assertEqual(self.sealed_source.test_reads, 0)

    def test_provider_projection_reapplies_the_exact_formal_gate_allowlist(self) -> None:
        bundle = self._assembler().assemble("sealed-formal-review", [])
        selected = next(
            item["value"]
            for item in bundle["evidenceItems"]
            if item["kind"] == "candidate_metrics" and item["value"]["selected"]
        )
        selected["gateEvaluation"]["sealedDatasetHash"] = self.summary.dataset_hash
        selected["gateEvaluation"]["test"]["withheldRowsCount"] = 1
        selected["gateEvaluation"]["test"]["unknownTestIdentity"] = {
            "testHash": "f" * 64
        }
        bundle["evidenceHash"] = canonical_sha256(
            {key: value for key, value in bundle.items() if key != "evidenceHash"}
        )

        rendered_prompt, _ = render_external_prompt(bundle)
        external = json.loads(rendered_prompt)["evidence"]
        projected = next(
            item["value"]
            for item in external["evidenceItems"]
            if item["kind"] == "candidate_metrics" and item["value"]["selected"]
        )

        self.assertEqual(
            set(projected["gateEvaluation"]),
            {"development", "validation", "rolling", "stability", "pretest", "test"},
        )
        self.assertEqual(
            set(projected["gateEvaluation"]["test"]),
            {"passed", "failures", "metrics", "guardrails"},
        )
        self.assertEqual(projected["completionReason"], "profitability_gate_passed")
        self.assertIs(projected["profitabilityGatePassed"], True)

    def test_persisted_formal_gate_rejects_unknown_and_test_identity_fields(self) -> None:
        service = AiReviewStage3Service(
            evidence_assembler=self._assembler(),
            deterministic_engine=DeterministicAiReviewEngine(),
            provider_registry=AiReviewProviderRegistry(
                (ProviderStatus("local", True, None, None),),
                {},
            ),
            review_store=self.review_store,
        )
        stored = service.create_review(
            primary_experiment_id="sealed-formal-review",
            comparison_experiment_ids=[],
            provider_id="local",
            external_data_approved=False,
        )
        cases = {
            "sealed hash": ("sealedDatasetHash", self.summary.dataset_hash),
            "withheld rows": ("withheldRowsCount", 1),
            "unknown identity": ("unknownTestIdentity", {"testHash": "f" * 64}),
        }
        for index, (label, (field, value)) in enumerate(cases.items(), start=1):
            with self.subTest(field=label):
                record = copy.deepcopy(stored)
                record["aiReviewId"] = f"ai-review-{index:032x}"
                candidate = next(
                    item["value"]
                    for item in record["evidenceBundle"]["evidenceItems"]
                    if item["kind"] == "candidate_metrics" and item["value"]["selected"]
                )
                candidate["gateEvaluation"]["test"][field] = value
                bundle = record["evidenceBundle"]
                bundle["evidenceHash"] = canonical_sha256(
                    {key: item for key, item in bundle.items() if key != "evidenceHash"}
                )
                record["evidenceHash"] = bundle["evidenceHash"]
                record["externalAssessment"]["evidenceHash"] = bundle["evidenceHash"]
                record["recordHash"] = canonical_sha256(
                    {key: item for key, item in record.items() if key != "recordHash"}
                )

                with self.assertRaisesRegex(
                    ValueError,
                    "^ai_review_evidence_items_invalid$",
                ):
                    self.review_store.record_v2(record)

    def test_handler_service_uses_its_current_sealed_dataset_store(self) -> None:
        from quant_core.api import QuantApiHandler

        class Handler(QuantApiHandler):
            pass

        Handler.run_store = self.run_store
        Handler.strategy_experiment_store = self.experiment_store
        Handler.ai_review_store = self.review_store
        Handler.sealed_dataset_store = self.sealed_source
        handler = object.__new__(Handler)

        review = handler._ai_review_stage3_service().create_review(
            primary_experiment_id="sealed-formal-review",
            comparison_experiment_ids=[],
            provider_id="local",
            external_data_approved=False,
        )

        self.assertEqual(
            review["primaryExperiment"]["experimentId"],
            "sealed-formal-review",
        )
        self.assertEqual(self.sealed_source.test_reads, 0)

    def test_missing_store_and_mutated_sealed_content_fail_closed(self) -> None:
        missing = AiReviewEvidenceAssembler(
            experiment_store=self.experiment_store,
            run_store=self.run_store,
        )
        with self.assertRaises(AiReviewStage3Error) as missing_error:
            missing.assemble("sealed-formal-review", [])
        self.assertEqual(missing_error.exception.code, "ai_review_evidence_conflict")

        connection = sqlite3.connect(self.sealed_source.delegate.path)
        try:
            connection.execute(
                "update sealed_dataset_bars set close = close + 0.1 "
                "where dataset_id = ? and partition_name = 'development'",
                (self.summary.dataset_id,),
            )
            connection.commit()
        finally:
            connection.close()
        with self.assertRaises(AiReviewStage3Error) as mutation_error:
            self._assembler().assemble("sealed-formal-review", [])
        self.assertEqual(mutation_error.exception.code, "ai_review_evidence_conflict")
        self.assertEqual(self.sealed_source.test_reads, 0)


if __name__ == "__main__":
    unittest.main()
