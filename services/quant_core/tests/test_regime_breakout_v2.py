import unittest
import tempfile
import copy
import json
from dataclasses import asdict, replace
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from threading import Thread
from types import SimpleNamespace
from unittest.mock import patch

from quant_core.api import QuantApiHandler
from quant_core.backtest import BacktestEngine
from quant_core.canonical import (
    canonical_data_hash,
    canonical_sha256,
    normalize_snapshot_bar_chunks,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import BacktestMetrics, BacktestRun, DataQuality, OHLCVBar
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.sealed_datasets import SealedDatasetSummary, sealed_research_snapshot_payload
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    StrategyExperimentStore,
)
from quant_core.strategy_experiments import (
    FORMAL_BACKTEST_ASSUMPTIONS,
    FORMAL_PRE_ROLL_VERSION,
    FORMAL_PROFITABILITY_GUARDRAILS,
    PolicyParameterDimension,
    StrategyExperimentError,
    StrategyExperimentRunner,
    _ExperimentDefinition,
    expand_candidates,
    formal_scoring_metadata,
    strategy_experiment_detail_to_payload,
)
from quant_core.strategy_library import StrategyLibraryStore
from quant_core.strategy_evaluator import (
    initial_runtime_state,
    runtime_state_from_payload,
    runtime_state_to_payload,
    size_entry,
)


def _strategy():
    return strategy_config_from_payload(
        {
            "name": "Regime Breakout fixture",
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
                    "lookbackBars": 2,
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


def _five_minute_fixture(*, breakout_volume: float = 400.0) -> list[dict[str, float]]:
    rows: list[dict[str, float]] = []
    for hour_close in (100.0, 101.0, 102.0):
        for _ in range(12):
            rows.append(
                {
                    "open": hour_close,
                    "high": hour_close + 0.1,
                    "low": hour_close - 0.1,
                    "close": hour_close,
                    "volume": 100.0,
                }
            )
    rows.extend(
        [
            {"open": 102.0, "high": 102.1, "low": 101.9, "close": 102.0, "volume": 100.0},
            {
                "open": 102.0,
                "high": 103.1,
                "low": 101.9,
                "close": 103.0,
                "volume": breakout_volume,
            },
            {"open": 103.0, "high": 103.5, "low": 102.9, "close": 103.3, "volume": 100.0},
            {"open": 103.3, "high": 103.4, "low": 101.5, "close": 101.8, "volume": 100.0},
            {"open": 101.8, "high": 101.9, "low": 100.9, "close": 101.0, "volume": 100.0},
            {"open": 101.0, "high": 101.3, "low": 100.9, "close": 101.2, "volume": 100.0},
            *[
                {"open": 103.0, "high": 103.2, "low": 102.9, "close": 103.0, "volume": 100.0}
                for _ in range(7)
            ],
            {
                "open": 103.0,
                "high": 104.6,
                "low": 102.9,
                "close": 104.5,
                "volume": breakout_volume,
            },
            {"open": 104.5, "high": 104.8, "low": 104.4, "close": 104.7, "volume": 100.0},
        ]
    )
    return rows


def _profitable_fresh_reaudit_bars() -> list[OHLCVBar]:
    def flat(price: float) -> dict[str, float]:
        return {
            "open": price,
            "high": price + 0.1,
            "low": price - 0.1,
            "close": price,
            "volume": 100.0,
        }

    rows: list[dict[str, float]] = []
    for hourly_close in (100.0, 101.0, 102.0):
        rows.extend(flat(hourly_close) for _ in range(12))
    base = 102.0
    for cycle in range(6):
        pattern = [
                {
                    "open": base,
                    "high": base + 1.1,
                    "low": base - 0.1,
                    "close": base + 1,
                    "volume": 400.0,
                },
                {
                    "open": base + 1,
                    "high": base + 3.1,
                    "low": base + 0.9,
                    "close": base + 3,
                    "volume": 100.0,
                },
                {
                    "open": base + 3,
                    "high": base + 5.1,
                    "low": base + 2.9,
                    "close": base + 5,
                    "volume": 100.0,
                },
                {
                    "open": base + 5,
                    "high": base + 5.1,
                    "low": base + 1.9,
                    "close": base + 2,
                    "volume": 100.0,
                },
                flat(base + 2),
        ]
        rows.extend(
            pattern[:4]
            if cycle == 5
            else [*pattern, *(flat(base + 2) for _ in range(7))]
        )
        base += 2
    return _expand_to_one_minute(rows)


def _expand_to_one_minute(rows: list[dict[str, float]]) -> list[OHLCVBar]:
    start = datetime(2026, 8, 1, tzinfo=timezone.utc)
    bars: list[OHLCVBar] = []
    for bucket_index, row in enumerate(rows):
        bucket_start = start + timedelta(minutes=bucket_index * 5)
        for minute in range(5):
            close = row["close"] if minute == 4 else row["open"]
            high = row["high"] if minute == 4 else max(row["open"], close)
            low = row["low"] if minute == 0 else min(row["open"], close)
            bars.append(
                OHLCVBar(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    timestamp=bucket_start + timedelta(minutes=minute),
                    open=row["open"],
                    high=high,
                    low=low,
                    close=close,
                    volume=row["volume"] / 5,
                )
            )
    return bars


def _experiment_bars(
    count: int = 500,
    *,
    started: datetime | None = None,
) -> list[OHLCVBar]:
    started = started or datetime(2026, 1, 1, tzinfo=timezone.utc)
    return [
        OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=started + timedelta(minutes=index),
            open=100,
            high=100.1,
            low=99.9,
            close=100,
            volume=100,
        )
        for index in range(count)
    ]


class _ProfitableRecordingEngine:
    calls: list[dict[str, int]] = []

    def __init__(self, initial_cash: float, fee_rate: float, slippage_rate: float) -> None:
        self.initial_cash = initial_cash

    def run(self, strategy, bars, *, evaluation_start_index=0):
        start = int((bars[0].timestamp - datetime(2026, 1, 1, tzinfo=timezone.utc)).total_seconds() // 60)
        end = int((bars[-1].timestamp - datetime(2026, 1, 1, tzinfo=timezone.utc)).total_seconds() // 60)
        self.calls.append({"start": start, "end": end})
        breakout_window = strategy.policy.breakout.lookback_bars
        volume_multiplier = strategy.policy.volume.multiplier
        distance = abs(breakout_window - 3) + abs(volume_multiplier - 1.5) * 2
        is_main_train = start == 0 and end == 299
        is_main_validation = start == 120 and end == 399
        is_test = start == 220 and end == 499
        total_return = 5 - distance
        round_trips = 25 if is_main_train else 6 if is_main_validation else 8 if is_test else 2
        metrics = BacktestMetrics(
            total_return_pct=total_return,
            annual_return_pct=total_return,
            max_drawdown_pct=1,
            win_rate_pct=60,
            profit_factor=1.5,
            trade_count=round_trips * 2,
            round_trip_count=round_trips,
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
                source="fixture",
                is_complete=True,
                rows=len(bars) - evaluation_start_index,
            ),
        )


class _SealedBarSource:
    def __init__(self, bars: list[OHLCVBar], development_rows: int) -> None:
        self.development = bars[:development_rows]
        self.test = bars[development_rows:]
        development_snapshot = normalize_snapshot_bar_chunks(
            [
                self.development[index : index + 500]
                for index in range(0, len(self.development), 500)
            ],
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
        )
        full_snapshot = normalize_snapshot_bar_chunks(
            [bars[index : index + 500] for index in range(0, len(bars), 500)],
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
        )
        dataset_hash = canonical_sha256(
            {
                "hashVersion": "aiqt-sealed-v1",
                "dataHash": full_snapshot["hash"],
                "developmentHash": development_snapshot["hash"],
                "testPartition": "withheld",
            }
        )
        self.summary = SealedDatasetSummary(
            dataset_id=f"sealed-{dataset_hash[:24]}",
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            source="fixture-primary",
            adjustment_mode="none",
            start=bars[0].timestamp,
            development_end_exclusive=bars[development_rows].timestamp,
            end_exclusive=bars[-1].timestamp + timedelta(minutes=1),
            rows=len(bars),
            development_rows=development_rows,
            withheld_rows=len(bars) - development_rows,
            dataset_hash=dataset_hash,
            development_hash=development_snapshot["hash"],
        )
        if self.summary.dataset_hash == full_snapshot["hash"]:
            raise AssertionError("the fixture must model a manifest hash, not a bars hash")
        self.summary_reads = 0
        self.development_reads = 0
        self.claims = 0
        self.test_reads = 0

    def get_summary(self, dataset_id: str):
        self.summary_reads += 1
        if dataset_id != self.summary.dataset_id:
            return None
        return self.summary

    def read_development_bars(self, dataset_id: str):
        self.development_reads += 1
        if dataset_id != self.summary.dataset_id:
            raise ValueError("sealed_dataset_not_found")
        return list(self.development)

    def claim_test_partition(self, dataset_id: str, *, claimant_id: str, expected_dataset_hash: str):
        self.claims += 1
        if self.claims != 1:
            raise ValueError("sealed_test_partition_consumed")
        if dataset_id != self.summary.dataset_id or expected_dataset_hash != self.summary.dataset_hash:
            raise ValueError("sealed_dataset_conflict")
        self._claimant_id = claimant_id
        return SimpleNamespace(
            dataset_id=dataset_id,
            claimant_id=claimant_id,
            claim_token=f"claim:{claimant_id}",
            claimed_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
        )

    def read_claimed_test_bars(self, dataset_id: str, *, claim_token: str):
        self.test_reads += 1
        if self.test_reads != 1 or claim_token != f"claim:{self.claimant_id}":
            raise ValueError("sealed_test_claim_invalid")
        return list(self.test)

    @property
    def claimant_id(self) -> str:
        return getattr(self, "_claimant_id", "")


class _MetadataOnlySealedSource:
    def __init__(self) -> None:
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        self.summary = SealedDatasetSummary(
            dataset_id=f"sealed-{'c' * 24}",
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            source="fixture-primary",
            adjustment_mode="none",
            start=start,
            development_end_exclusive=start + timedelta(days=72),
            end_exclusive=start + timedelta(days=90),
            rows=129_600,
            development_rows=103_680,
            withheld_rows=25_920,
            dataset_hash="c" * 64,
            development_hash="d" * 64,
        )
        self.development_reads = 0

    def get_summary(self, dataset_id: str):
        return self.summary if dataset_id == self.summary.dataset_id else None

    def read_development_bars(self, dataset_id: str):
        self.development_reads += 1
        raise AssertionError("invalid formal policy must fail before reading bars")


class _SealedProfitableEngine:
    calls: list[dict[str, object]] = []
    development_rows = 0
    total_rows = 0
    started = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def __init__(self, initial_cash: float, fee_rate: float, slippage_rate: float) -> None:
        if (initial_cash, fee_rate, slippage_rate) != (10, 0.001, 0.001):
            raise AssertionError("formal assumptions were not server frozen")

    def run(self, strategy, bars, *, evaluation_start_index=0):
        start = int((bars[0].timestamp - self.started).total_seconds() // 60)
        end = int((bars[-1].timestamp - self.started).total_seconds() // 60)
        scoring_start = start + evaluation_start_index
        is_test = end == self.total_rows - 1
        breakout_window = strategy.policy.breakout.lookback_bars
        self.calls.append(
            {
                "start": start,
                "end": end,
                "evaluationStartIndex": evaluation_start_index,
                "scoringStart": scoring_start,
                "breakout": breakout_window,
                "isTest": is_test,
            }
        )
        distance = abs(breakout_window - 3)
        is_main_train = scoring_start == self.total_rows - (90 * 24 * 60)
        is_main_validation = end == self.development_rows - 1 and not is_test
        round_trips = 25 if is_main_train else 6 if is_main_validation else 8 if is_test else 2
        total_return = 5 - distance
        metrics = BacktestMetrics(
            total_return_pct=total_return,
            annual_return_pct=total_return,
            max_drawdown_pct=1,
            win_rate_pct=60,
            profit_factor=1.5,
            trade_count=round_trips * 2,
            round_trip_count=round_trips,
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
                source="sealed-fixture",
                is_complete=True,
                rows=len(bars) - evaluation_start_index,
            ),
        )


class _SingleRoundTripTestEngine:
    calls: list[dict[str, object]] = []
    started = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def __init__(self, initial_cash: float, fee_rate: float, slippage_rate: float) -> None:
        if (initial_cash, fee_rate, slippage_rate) != (10, 0.001, 0.001):
            raise AssertionError("formal assumptions were not server frozen")

    def run(self, strategy, bars, *, evaluation_start_index=0):
        start = int((bars[0].timestamp - self.started).total_seconds() // 60)
        end = int((bars[-1].timestamp - self.started).total_seconds() // 60)
        is_test = end == 499
        self.calls.append(
            {
                "candidateRevision": strategy.revision,
                "start": start,
                "end": end,
                "isTest": is_test,
            }
        )
        distance = abs(strategy.policy.breakout.lookback_bars - 3)
        if is_test:
            round_trips = 1
        elif start == 0 and end == 299:
            round_trips = 25
        elif end == 399:
            round_trips = 6
        else:
            round_trips = 6
        total_return = 5 - distance
        return BacktestRun(
            strategy_name=strategy.name,
            strategy_revision=strategy.revision,
            symbol=strategy.symbols[0],
            market=strategy.market,
            timeframe=strategy.timeframe,
            metrics=BacktestMetrics(
                total_return_pct=total_return,
                annual_return_pct=total_return,
                max_drawdown_pct=1,
                win_rate_pct=100,
                profit_factor=999,
                trade_count=round_trips * 2,
                round_trip_count=round_trips,
            ),
            trades=[],
            equity_curve=[],
            data_quality=DataQuality(
                source="sealed-fixture",
                is_complete=True,
                rows=len(bars) - evaluation_start_index,
            ),
        )


def _seed_promotable_experiment(
    store: StrategyExperimentStore,
    *,
    base_strategy,
    experiment_id: str = "experiment-promotable",
    formal_pre_roll_version: str | None = None,
):
    winner = expand_candidates(
        base_strategy,
        (
            PolicyParameterDimension(
                policy_path="breakout.lookbackBars",
                values=(3,),
            ),
        ),
    )[0]
    now = datetime(2026, 8, 10, tzinfo=timezone.utc)
    prior_start = "2026-05-01T00:00:00+00:00"
    prior_rows = 129_600
    prior_development_rows = 103_680
    if formal_pre_roll_version is not None:
        prior_start = "2026-04-30T20:01:00+00:00"
        prior_rows += 239
        prior_development_rows += 239
    definition = {
        "baseStrategy": strategy_config_to_payload(base_strategy),
        "strategyRevision": base_strategy.revision,
        "sourceRunId": "sealed-source-run",
        "snapshotId": "sealed-original",
        "canonicalDataHash": "a" * 64,
        "developmentDataHash": "b" * 64,
        "sealedDataset": {
            "datasetId": "sealed-original",
            "market": "crypto",
            "symbol": "BTC/USDT",
            "timeframe": "1m",
            "source": "fixture",
            "adjustmentMode": "none",
            "start": prior_start,
            "developmentEndExclusive": "2026-07-12T00:00:00+00:00",
            "endExclusive": "2026-07-30T00:00:00+00:00",
            "rows": prior_rows,
            "developmentRows": prior_development_rows,
            "withheldRows": 25_920,
            "datasetHash": "a" * 64,
            "developmentHash": "b" * 64,
        },
        "market": "crypto",
        "symbol": "BTC/USDT",
        "timeframe": "1m",
        "assumptions": {"initialCash": 10, "feeBps": 10, "slippageBps": 10},
        "costModel": {
            "feeBpsPerSide": 10,
            "slippageBpsPerSide": 10,
            "estimatedRoundTripBps": 40,
        },
        "split": {"trainPct": 60, "validationPct": 20, "testPct": 20},
        "dimensions": [{"policyPath": "breakout.lookbackBars", "values": [3]}],
        "guardrails": {
            "development": {"minimumRoundTripCount": 30},
            "validation": {
                "requirePositiveReturn": True,
                "minimumProfitFactor": 1.2,
                "maximumDrawdownPct": 3,
                "minimumRoundTripCount": 6,
            },
            "test": {
                "requirePositiveReturn": True,
                "minimumProfitFactor": 1.2,
                "maximumDrawdownPct": 3,
                "minimumRoundTripCount": 6,
            },
            "rolling": {
                "requiredWindowCount": 7,
                "minimumPositiveWindowCount": 5,
            },
            "stability": {"requirePositiveAdjacentCandidates": True},
        },
        "walkForward": {"trainBars": 43_200, "validationBars": 8_640, "stepBars": 8_640},
        "evaluationBudget": 17,
        "engineVersion": "backtest-v2",
        "evaluatorVersion": "strategy-evaluator-v2",
        "resultSchemaVersion": 2,
    }
    if formal_pre_roll_version is not None:
        definition.update(
            {
                "preRollVersion": formal_pre_roll_version,
                "scoringWindow": {
                    "start": "2026-05-01T00:00:00+00:00",
                    "endExclusive": "2026-07-30T00:00:00+00:00",
                    "rows": 129_600,
                    "preRollRows": 239,
                },
            }
        )
    definition_hash = canonical_sha256(definition)
    snapshot = StrategyExperimentSnapshot(
        snapshot_id="sealed-original",
        created_at=now,
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        canonical_data_hash="a" * 64,
        rows=prior_rows,
        start_at=prior_start,
        end_at="2026-07-30T00:00:00+00:00",
        bars=[],
        test_definition_hash=definition_hash,
        test_owner_experiment_id=experiment_id,
        test_consumed_at=now,
    )
    record = StrategyExperimentRecord(
        experiment_id=experiment_id,
        created_at=now,
        status="completed",
        definition_hash=definition_hash,
        holdout_key="holdout-promotable",
        strategy_revision=base_strategy.revision,
        source_run_id="sealed-source-run",
        snapshot_id=snapshot.snapshot_id,
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        definition=definition,
        evaluation_count=15,
        selected_candidate_id=winner.candidate_id,
        completion_reason="profitability_gate_passed",
        result_hash="result-profitable",
        profitability_gate_passed=True,
    )
    candidate = StrategyExperimentCandidateRecord(
        experiment_id=experiment_id,
        candidate_id=winner.candidate_id,
        candidate_revision=winner.strategy.revision,
        parameters=winner.parameters,
        train_metrics={"roundTripCount": 25, "totalReturnPct": 4.0},
        validation_metrics={"roundTripCount": 6, "totalReturnPct": 3.0},
        test_metrics={"roundTripCount": 8, "totalReturnPct": 2.0},
        walk_forward={"positiveReturnCount": 6, "validationWindowCount": 7},
        eligible=True,
        rank=1,
        gate_evaluation={
            "pretest": {"passed": True},
            "test": {"passed": True},
        },
    )
    store.put_snapshot(snapshot)
    store.record_completed(record, [candidate])
    return winner, record


class _FreshSealedDevelopmentSource:
    def __init__(
        self,
        summary: SealedDatasetSummary,
        development: list[OHLCVBar],
        *,
        fail_on_development_read: bool = False,
    ) -> None:
        self.summary = summary
        self.development = development
        self.fail_on_development_read = fail_on_development_read

    def get_summary(self, dataset_id: str):
        return self.summary if dataset_id == self.summary.dataset_id else None

    def read_development_bars(self, dataset_id: str):
        if dataset_id != self.summary.dataset_id:
            raise ValueError("sealed_dataset_not_found")
        if self.fail_on_development_read:
            raise AssertionError("insufficient pre-roll must fail before bar replay")
        return list(self.development)

    def claim_test_partition(self, *_args, **_kwargs):
        raise AssertionError("fresh promotion must not claim the test partition")

    def read_claimed_test_bars(self, *_args, **_kwargs):
        raise AssertionError("fresh promotion must not read the test partition")


def _record_fresh_sealed_p0_run(
    run_store: ResearchRunStore,
    winner,
    *,
    development: list[OHLCVBar],
    summary: SealedDatasetSummary,
    formal_scoring: dict[str, object] | None = None,
) -> None:
    snapshot = sealed_research_snapshot_payload(summary)
    if formal_scoring is not None:
        snapshot.update(formal_scoring)
    run_store.record(
        ResearchRunAudit(
            run_id="fresh-sealed-p0-run",
            created_at=datetime(2026, 8, 12, tzinfo=timezone.utc),
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            strategy_name=winner.name,
            strategy_revision=winner.revision,
            data_rows=summary.development_rows,
            metrics={
                "total_return_pct": 1.0,
                "annual_return_pct": 1.0,
                "max_drawdown_pct": 1.0,
                "win_rate_pct": 60.0,
                "profit_factor": 1.5,
                "trade_count": 12,
                "round_trip_count": 6,
            },
            decisions=[],
            execution_mode="paper_only",
            data_quality={
                "source": summary.source,
                "originSource": summary.source,
                "isComplete": True,
                "warnings": [],
                "rows": summary.development_rows,
                "adjustmentMode": summary.adjustment_mode,
                "coverage": {
                    "actualRows": summary.development_rows,
                    "expectedRows": summary.development_rows,
                    "gapCount": 0,
                    "ratio": 1.0,
                },
                "canonicalHash": summary.development_hash,
                "issues": [],
            },
            data_snapshot=snapshot,
            strategy_config=strategy_config_to_payload(winner),
            backtest_assumptions=FORMAL_BACKTEST_ASSUMPTIONS,
            backtest_trades=[],
            backtest_equity_curve=[],
        )
    )


def _record_fresh_p0_run(
    run_store: ResearchRunStore,
    winner,
    *,
    fresh_bars: list[OHLCVBar] | None = None,
    created_at: datetime | None = None,
    metrics: dict[str, object] | None = None,
) -> None:
    fresh_bars = (
        fresh_bars if fresh_bars is not None else _profitable_fresh_reaudit_bars()
    )
    created_at = created_at or datetime(2026, 8, 10, 1, tzinfo=timezone.utc)
    normalized = normalize_snapshot_bars(fresh_bars)
    fresh_hash = canonical_data_hash(normalized)
    replay = BacktestEngine(
        initial_cash=10,
        fee_rate=0.001,
        slippage_rate=0.001,
    ).run(winner, fresh_bars)
    run_store.record(
        ResearchRunAudit(
            run_id="fresh-p0-run",
            created_at=created_at,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            strategy_name=winner.name,
            strategy_revision=winner.revision,
            data_rows=len(normalized),
            metrics=(
                metrics
                if metrics is not None
                else asdict(replay.metrics)
            ),
            decisions=[],
            execution_mode="paper_only",
            data_quality={
                "source": "fresh-fixture",
                "isComplete": True,
                "warnings": [],
                "rows": len(normalized),
                "canonicalHash": fresh_hash,
                "issues": [],
            },
            data_snapshot={
                "source": "fresh-fixture",
                "isComplete": True,
                "warnings": [],
                "rows": len(normalized),
                "start": normalized[0]["timestamp"],
                "end": normalized[-1]["timestamp"],
                "hashVersion": "aiqt-data-v2",
                "hash": fresh_hash,
                "bars": normalized,
                "qualityIssues": [],
            },
            strategy_config=strategy_config_to_payload(winner),
            backtest_assumptions={"initialCash": 10, "feeBps": 10, "slippageBps": 10},
        )
    )


class RegimeBreakoutBacktestContractTests(unittest.TestCase):
    def test_sealed_builder_receives_legacy_none_and_research_launch_intent(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = _strategy()
            strategy_store = StrategyLibraryStore(
                Path(directory) / "strategies.sqlite"
            )
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(
                Path(directory) / "experiments.sqlite"
            )
            strategy_store.save(strategy)
            run_store.record(
                ResearchRunAudit(
                    run_id="run-launch-intent-forwarding",
                    created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
                    market=strategy.market,
                    symbol=strategy.symbols[0],
                    timeframe=strategy.timeframe,
                    strategy_name=strategy.name,
                    strategy_revision=strategy.revision,
                    data_rows=0,
                    metrics={},
                    decisions=[],
                    execution_mode="paper_only",
                    data_quality={},
                    data_snapshot={},
                    strategy_config=strategy_config_to_payload(strategy),
                    backtest_assumptions=FORMAL_BACKTEST_ASSUMPTIONS,
                )
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
            )
            payload = {
                "strategyRevision": strategy.revision,
                "sourceRunId": "run-launch-intent-forwarding",
                "assumptions": FORMAL_BACKTEST_ASSUMPTIONS,
                "dimensions": [],
                "guardrails": FORMAL_PROFITABILITY_GUARDRAILS,
                "walkForward": None,
            }
            sentinel = object()
            launch_intent = {
                "proposalId": "strategy-research-proposal-forwarding",
                "experimentId": "experiment-forwarding",
                "eventId": "strategy-research-launch-experiment-forwarding",
                "definitionIdentityHash": "a" * 64,
            }

            with patch.object(
                runner,
                "_definition_from_sealed_source",
                return_value=sentinel,
            ) as sealed_builder:
                self.assertIs(runner._definition_from_source(payload), sentinel)
                self.assertIsNone(sealed_builder.call_args.kwargs["launch_intent"])

                sealed_builder.reset_mock()
                self.assertIs(
                    runner._definition_from_source(
                        payload,
                        launch_intent=launch_intent,
                    ),
                    sentinel,
                )
                self.assertEqual(
                    sealed_builder.call_args.kwargs["launch_intent"],
                    launch_intent,
                )

    def test_formal_policy_requires_candidate_warmup_and_utc_alignment_before_bar_read(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = _strategy()
            source = _MetadataOnlySealedSource()
            start = source.summary.start + timedelta(minutes=59)
            pre_roll_rows = 300
            source.summary = SealedDatasetSummary(
                dataset_id=source.summary.dataset_id,
                market=source.summary.market,
                symbol=source.summary.symbol,
                timeframe=source.summary.timeframe,
                source=source.summary.source,
                adjustment_mode=source.summary.adjustment_mode,
                start=start,
                development_end_exclusive=start
                + timedelta(minutes=pre_roll_rows + (72 * 24 * 60)),
                end_exclusive=start
                + timedelta(minutes=pre_roll_rows + (90 * 24 * 60)),
                rows=pre_roll_rows + (90 * 24 * 60),
                development_rows=pre_roll_rows + (72 * 24 * 60),
                withheld_rows=18 * 24 * 60,
                dataset_hash=source.summary.dataset_hash,
                development_hash=source.summary.development_hash,
            )
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            strategy_store.save(strategy)
            run_store.record(
                ResearchRunAudit(
                    run_id="run-insufficient-preroll",
                    created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    strategy_name=strategy.name,
                    strategy_revision=strategy.revision,
                    data_rows=source.summary.development_rows,
                    metrics={},
                    decisions=[],
                    execution_mode="paper_only",
                    data_quality={
                        "source": source.summary.source,
                        "isComplete": True,
                        "warnings": [],
                        "rows": source.summary.development_rows,
                        "canonicalHash": source.summary.development_hash,
                    },
                    data_snapshot=sealed_research_snapshot_payload(source.summary),
                    strategy_config=strategy_config_to_payload(strategy),
                    backtest_assumptions=FORMAL_BACKTEST_ASSUMPTIONS,
                )
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
                sealed_bar_source=source,
            )
            payload = {
                "strategyRevision": strategy.revision,
                "sourceRunId": "run-insufficient-preroll",
                "assumptions": FORMAL_BACKTEST_ASSUMPTIONS,
                "dimensions": [
                    {
                        "policyPath": "regime.closeAboveSmaWindow",
                        "values": [2, 3, 4],
                    }
                ],
                "guardrails": FORMAL_PROFITABILITY_GUARDRAILS,
                "walkForward": {
                    "trainBars": 43_200,
                    "validationBars": 8_640,
                    "stepBars": 8_640,
                },
            }

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.run_new(payload)

            self.assertEqual(
                (raised.exception.status, raised.exception.error),
                (400, "invalid_strategy_experiment"),
            )
            self.assertEqual(source.development_reads, 0)

    def test_formal_policy_rejects_client_cost_drift_before_reading_sealed_bars(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = _strategy()
            source = _MetadataOnlySealedSource()
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            strategy_store.save(strategy)
            run_store.record(
                ResearchRunAudit(
                    run_id="run-invalid-cost",
                    created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    strategy_name=strategy.name,
                    strategy_revision=strategy.revision,
                    data_rows=source.summary.development_rows,
                    metrics={},
                    decisions=[],
                    execution_mode="paper_only",
                    data_quality={
                        "source": source.summary.source,
                        "isComplete": True,
                        "warnings": [],
                        "rows": source.summary.development_rows,
                        "canonicalHash": source.summary.development_hash,
                    },
                    data_snapshot=sealed_research_snapshot_payload(source.summary),
                    strategy_config=strategy_config_to_payload(strategy),
                    backtest_assumptions={"initialCash": 10, "feeBps": 10, "slippageBps": 10},
                )
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
                sealed_bar_source=source,
            )
            payload = {
                "strategyRevision": strategy.revision,
                "sourceRunId": "run-invalid-cost",
                "assumptions": {"initialCash": 11, "feeBps": 10, "slippageBps": 10},
                "dimensions": [
                    {"policyPath": "breakout.lookbackBars", "values": [2, 3, 4]}
                ],
                "guardrails": {
                    "development": {"minimumRoundTripCount": 30},
                    "validation": {
                        "requirePositiveReturn": True,
                        "minimumProfitFactor": 1.2,
                        "maximumDrawdownPct": 3,
                        "minimumRoundTripCount": 6,
                    },
                    "test": {
                        "requirePositiveReturn": True,
                        "minimumProfitFactor": 1.2,
                        "maximumDrawdownPct": 3,
                        "minimumRoundTripCount": 6,
                    },
                    "rolling": {
                        "requiredWindowCount": 7,
                        "minimumPositiveWindowCount": 5,
                    },
                    "stability": {"requirePositiveAdjacentCandidates": True},
                },
                "walkForward": {
                    "trainBars": 43_200,
                    "validationBars": 8_640,
                    "stepBars": 8_640,
                },
            }

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.run_new(payload)

            self.assertEqual(
                (raised.exception.status, raised.exception.error),
                (400, "invalid_strategy_experiment"),
            )
            self.assertEqual(source.development_reads, 0)

    def test_runtime_state_rejects_missing_hash_unknown_fields_and_revision_drift(self):
        strategy = _strategy()
        canonical = runtime_state_to_payload(initial_runtime_state(strategy))
        invalid_payloads = []
        missing_hash = dict(canonical)
        missing_hash.pop("stateHash")
        invalid_payloads.append(missing_hash)
        unknown = dict(canonical)
        unknown["ignored"] = True
        invalid_payloads.append(unknown)
        drifted = dict(canonical)
        drifted["strategyRevision"] = "forged"
        invalid_payloads.append(drifted)

        for payload in invalid_payloads:
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                runtime_state_from_payload(strategy, payload)

    def test_version_two_canonical_parser_rejects_lossy_or_ambiguous_fields(self):
        canonical = strategy_config_to_payload(_strategy())
        invalid_payloads = []
        for version in ("2", 2.5, True):
            value = copy.deepcopy(canonical)
            value["version"] = version
            invalid_payloads.append(value)
        missing_position = copy.deepcopy(canonical)
        del missing_position["risk"]["positionPct"]
        invalid_payloads.append(missing_position)
        extra_root = copy.deepcopy(canonical)
        extra_root["ignored"] = True
        invalid_payloads.append(extra_root)
        extra_risk = copy.deepcopy(canonical)
        extra_risk["risk"]["ignored"] = 1
        invalid_payloads.append(extra_risk)

        for payload in invalid_payloads:
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                strategy_config_from_payload(payload)

    def test_version_two_canonical_round_trip_preserves_dynamic_entry_cap(self):
        payload = strategy_config_to_payload(_strategy())
        payload["risk"]["maxEntryNotionalQuote"] = None

        strategy = strategy_config_from_payload(payload)

        self.assertIsNone(strategy.risk.max_entry_notional_quote)
        self.assertIsNone(
            strategy_config_to_payload(strategy)["risk"]["maxEntryNotionalQuote"]
        )

    def test_version_two_canonical_rejects_non_positive_fixed_entry_cap(self):
        for cap in (0, -1):
            payload = strategy_config_to_payload(_strategy())
            payload["risk"]["maxEntryNotionalQuote"] = cap

            with self.subTest(cap=cap), self.assertRaisesRegex(
                ValueError,
                "regime_breakout_v2_risk_invalid",
            ):
                strategy_config_from_payload(payload)

    def test_dynamic_entry_sizing_grows_with_equity_without_exceeding_cash_or_position_cap(self):
        dynamic_payload = strategy_config_to_payload(_strategy())
        dynamic_payload["risk"]["maxEntryNotionalQuote"] = None
        dynamic = strategy_config_from_payload(dynamic_payload)

        initial = size_entry(
            dynamic,
            equity=10,
            available_cash=10,
            execution_price=100,
            atr_value=0.01,
            fee_rate=0.001,
            slippage_rate=0.001,
        )
        grown = size_entry(
            dynamic,
            equity=20,
            available_cash=20,
            execution_price=100,
            atr_value=0.01,
            fee_rate=0.001,
            slippage_rate=0.001,
        )
        fixed = size_entry(
            _strategy(),
            equity=20,
            available_cash=20,
            execution_price=100,
            atr_value=0.01,
            fee_rate=0.001,
            slippage_rate=0.001,
        )

        self.assertEqual((initial.reason, grown.reason, fixed.reason), ("ready",) * 3)
        self.assertAlmostEqual(initial.notional, 5.999)
        self.assertAlmostEqual(grown.notional, 11.999)
        self.assertAlmostEqual(fixed.notional, 10.0)

    def test_policy_backtest_streams_more_than_the_legacy_snapshot_limit(self):
        result = BacktestEngine(
            initial_cash=10,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(_strategy(), _experiment_bars(1_001))

        self.assertEqual(result.data_quality.rows, 1_001)
        self.assertEqual(result.trades, [])

    def test_policy_backtest_skips_context_hashes_for_hold_only_bars(self):
        context_hashes = 0

        def count_context_hashes(value):
            nonlocal context_hashes
            if isinstance(value, dict) and value.get("aggregationVersion") == "ohlcv-utc-v1":
                context_hashes += 1
            return canonical_sha256(value)

        with patch(
            "quant_core.strategy_evaluator.canonical_sha256",
            side_effect=count_context_hashes,
        ):
            result = BacktestEngine().run(_strategy(), _experiment_bars(1_001))

        self.assertEqual(result.trades, [])
        self.assertEqual(context_hashes, 0)

    def test_formal_profitability_gate_reads_only_the_winners_test_partition(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = _strategy()
            scoring_rows = 90 * 24 * 60
            pre_roll_rows = 239
            total_rows = pre_roll_rows + scoring_rows
            development_rows = pre_roll_rows + (72 * 24 * 60)
            train_end = pre_roll_rows + (54 * 24 * 60)
            bars = _experiment_bars(total_rows)
            sealed_source = _SealedBarSource(bars, development_rows)
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            strategy_store.save(strategy)
            run_store.record(
                ResearchRunAudit(
                    run_id="run-v2-experiment",
                    created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    strategy_name=strategy.name,
                    strategy_revision=strategy.revision,
                    data_rows=development_rows,
                    metrics={},
                    decisions=[],
                    execution_mode="paper_only",
                    data_quality={
                        "source": "fixture-primary",
                        "isComplete": True,
                        "warnings": [],
                        "rows": development_rows,
                        "canonicalHash": sealed_source.summary.development_hash,
                    },
                    data_snapshot=sealed_research_snapshot_payload(sealed_source.summary),
                    strategy_config=strategy_config_to_payload(strategy),
                    backtest_assumptions={"initialCash": 10, "feeBps": 10, "slippageBps": 10},
                )
            )
            jobs = []
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
                sealed_bar_source=sealed_source,
                job_launcher=jobs.append,
            )
            payload = {
                "strategyRevision": strategy.revision,
                "sourceRunId": "run-v2-experiment",
                "assumptions": {"initialCash": 10, "feeBps": 10, "slippageBps": 10},
                "dimensions": [{"policyPath": "breakout.lookbackBars", "values": [2, 3, 4]}],
                "guardrails": {
                    "development": {"minimumRoundTripCount": 30},
                    "validation": {
                        "requirePositiveReturn": True,
                        "minimumProfitFactor": 1.2,
                        "maximumDrawdownPct": 3,
                        "minimumRoundTripCount": 6,
                    },
                    "test": {
                        "requirePositiveReturn": True,
                        "minimumProfitFactor": 1.2,
                        "maximumDrawdownPct": 3,
                        "minimumRoundTripCount": 6,
                    },
                    "rolling": {
                        "requiredWindowCount": 7,
                        "minimumPositiveWindowCount": 5,
                    },
                    "stability": {"requirePositiveAdjacentCandidates": True},
                },
                "walkForward": {
                    "trainBars": 43_200,
                    "validationBars": 8_640,
                    "stepBars": 8_640,
                },
            }
            _SealedProfitableEngine.calls = []
            _SealedProfitableEngine.development_rows = development_rows
            _SealedProfitableEngine.total_rows = total_rows

            with patch(
                "quant_core.strategy_experiments.BacktestEngine",
                _SealedProfitableEngine,
            ):
                pending = runner.run_new(payload)
                self.assertEqual(pending.experiment.status, "pending")
                self.assertEqual((sealed_source.claims, sealed_source.test_reads), (0, 0))
                self.assertEqual(len(jobs), 1)
                jobs[0]()
                detail = experiment_store.get(pending.experiment.experiment_id)
                assert detail is not None
                replay = runner.replay(detail.experiment.experiment_id)
                drifted_definition = {
                    **detail.experiment.definition,
                    "preRollVersion": "formal-pre-roll-drifted",
                }
                drifted = replace(
                    detail,
                    experiment=replace(
                        detail.experiment,
                        definition=drifted_definition,
                        definition_hash=canonical_sha256(drifted_definition),
                    ),
                )
                with self.assertRaises(StrategyExperimentError):
                    runner._definition_from_record(drifted)
                legacy_definition = dict(detail.experiment.definition)
                legacy_definition.pop("preRollVersion")
                legacy = replace(
                    detail,
                    experiment=replace(
                        detail.experiment,
                        definition=legacy_definition,
                        definition_hash=canonical_sha256(legacy_definition),
                    ),
                )
                self.assertEqual(
                    runner._definition_from_record(legacy).definition.get(
                        "preRollVersion"
                    ),
                    None,
                )

        self.assertTrue(detail.experiment.profitability_gate_passed)
        self.assertEqual(detail.experiment.completion_reason, "profitability_gate_passed")
        self.assertEqual(
            detail.experiment.definition["preRollVersion"],
            "formal-pre-roll-v2",
        )
        selected = next(
            candidate
            for candidate in detail.candidates
            if candidate.candidate_id == detail.experiment.selected_candidate_id
        )
        self.assertEqual(
            selected.parameters,
            [{"policyPath": "breakout.lookbackBars", "value": 3}],
        )
        self.assertTrue(selected.gate_evaluation["test"]["passed"])
        self.assertEqual(
            len([call for call in _SealedProfitableEngine.calls if call["isTest"]]),
            1,
        )
        self.assertEqual((sealed_source.claims, sealed_source.test_reads), (1, 1))
        self.assertEqual(replay.experiment.evaluation_count, 0)
        self.assertEqual((sealed_source.claims, sealed_source.test_reads), (1, 1))
        self.assertNotIn("bars", strategy_experiment_detail_to_payload(detail)["snapshot"])
        self.assertEqual(
            [candidate.candidate_id for candidate in detail.candidates if candidate.test_metrics is not None],
            [selected.candidate_id],
        )
        self.assertEqual(
            detail.experiment.definition["scoringWindow"],
            {
                "start": bars[pre_roll_rows].timestamp.isoformat(),
                "endExclusive": (bars[-1].timestamp + timedelta(minutes=1)).isoformat(),
                "rows": scoring_rows,
                "preRollRows": pre_roll_rows,
            },
        )
        scored_ranges = [
            (int(call["scoringStart"]), int(call["end"]) + 1)
            for call in _SealedProfitableEngine.calls
        ]
        expected_ranges = []
        for _ in range(3):
            expected_ranges.extend(
                [
                    (pre_roll_rows, train_end),
                    (train_end, development_rows),
                ]
            )
            for offset in range(0, 7 * 8_640, 8_640):
                expected_ranges.extend(
                    [
                        (pre_roll_rows + offset, pre_roll_rows + offset + 43_200),
                        (
                            pre_roll_rows + offset + 43_200,
                            pre_roll_rows + offset + 51_840,
                        ),
                    ]
                )
        expected_ranges.append((development_rows, total_rows))
        self.assertCountEqual(scored_ranges, expected_ranges)
        self.assertTrue(
            all(
                int(call["evaluationStartIndex"]) == pre_roll_rows
                for call in _SealedProfitableEngine.calls
            )
        )

    def test_one_round_trip_infinite_profit_factor_fails_test_without_trying_rank_two(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = _strategy()
            bars = _experiment_bars(500)
            sealed_source = _SealedBarSource(bars, 400)
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            snapshot = StrategyExperimentSnapshot(
                snapshot_id=sealed_source.summary.dataset_id,
                created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash=sealed_source.summary.dataset_hash,
                rows=500,
                start_at=sealed_source.summary.start.isoformat(),
                end_at=sealed_source.summary.end_exclusive.isoformat(),
                bars=normalize_snapshot_bars(sealed_source.development),
            )
            experiment_store.put_snapshot(snapshot)
            dimensions = (
                PolicyParameterDimension(
                    policy_path="breakout.lookbackBars",
                    values=(2, 3, 4),
                ),
            )
            candidates = expand_candidates(strategy, dimensions)
            definition = _ExperimentDefinition(
                definition={
                    "assumptions": FORMAL_BACKTEST_ASSUMPTIONS,
                    "guardrails": FORMAL_PROFITABILITY_GUARDRAILS,
                    "dimensions": [
                        {"policyPath": "breakout.lookbackBars", "values": [2, 3, 4]}
                    ],
                    "resultSchemaVersion": 2,
                    "sealedDataset": sealed_source.summary.to_payload(),
                },
                definition_hash="formal-test-definition",
                holdout_key="formal-test-holdout",
                snapshot=snapshot,
                strategy=strategy,
                candidates=candidates,
                bars=tuple(sealed_source.development),
                train_end=300,
                validation_end=400,
                walk_forward_windows=tuple(
                    (180 + start, 180 + start + 20, 180 + start + 30)
                    for start in range(0, 70, 10)
                ),
                score_start_index=180,
                sealed_dataset_id=sealed_source.summary.dataset_id,
                sealed_dataset_hash=sealed_source.summary.dataset_hash,
            )
            runner = StrategyExperimentRunner(
                strategy_store=StrategyLibraryStore(Path(directory) / "strategies.sqlite"),
                run_store=ResearchRunStore(Path(directory) / "runs.sqlite"),
                experiment_store=experiment_store,
                sealed_bar_source=sealed_source,
            )
            _SingleRoundTripTestEngine.calls = []

            with patch(
                "quant_core.strategy_experiments.BacktestEngine",
                _SingleRoundTripTestEngine,
            ):
                records, selected_id, reason, passed = runner._evaluate_candidates(
                    definition,
                    experiment_id="experiment-test-gate",
                    deadline=None,
                )

            self.assertFalse(passed)
            self.assertEqual(reason, "test_gate_failed")
            selected = next(record for record in records if record.candidate_id == selected_id)
            self.assertEqual(selected.rank, 1)
            self.assertEqual(
                selected.gate_evaluation["test"]["failures"],
                ["round_trip_count_below_minimum"],
            )
            self.assertEqual(
                [call for call in _SingleRoundTripTestEngine.calls if call["isTest"]],
                [
                    next(
                        call
                        for call in _SingleRoundTripTestEngine.calls
                        if call["candidateRevision"] == selected.candidate_revision
                        and call["isTest"]
                    )
                ],
            )
            self.assertEqual(
                [record.candidate_id for record in records if record.test_metrics is not None],
                [selected.candidate_id],
            )

    def test_policy_parameter_grid_produces_canonical_neighbor_revisions(self):
        base = _strategy()

        candidates = expand_candidates(
            base,
            (
                PolicyParameterDimension(
                    policy_path="regime.closeAboveSmaWindow",
                    values=(2, 3, 4),
                ),
                PolicyParameterDimension(
                    policy_path="breakout.lookbackBars",
                    values=(2, 3, 4),
                ),
            ),
        )

        self.assertEqual(len(candidates), 9)
        self.assertEqual(len({candidate.strategy.revision for candidate in candidates}), 9)
        center = next(
            candidate
            for candidate in candidates
            if candidate.parameters
            == [
                {"policyPath": "breakout.lookbackBars", "value": 2},
                {"policyPath": "regime.closeAboveSmaWindow", "value": 2},
            ]
        )
        self.assertEqual(center.strategy.revision, base.revision)

    def test_complete_bars_next_open_atr_exit_and_cooldown_share_one_timeline(self):
        bars = _expand_to_one_minute(_five_minute_fixture())
        engine = BacktestEngine(initial_cash=100, fee_rate=0.001, slippage_rate=0.001)

        result = engine.run(_strategy(), bars)

        self.assertEqual([trade.side for trade in result.trades], ["buy", "sell", "buy", "sell"])
        self.assertEqual(result.trades[0].timestamp, datetime(2026, 8, 1, 3, 10, tzinfo=timezone.utc))
        self.assertEqual(result.trades[0].price, 103.0 * 1.001)
        self.assertEqual(result.trades[0].reason, "regime_breakout")
        self.assertEqual(result.trades[1].timestamp, datetime(2026, 8, 1, 3, 20, tzinfo=timezone.utc))
        self.assertEqual(result.trades[1].reason, "atr_stop")
        self.assertEqual(result.trades[2].timestamp, datetime(2026, 8, 1, 4, 10, tzinfo=timezone.utc))
        self.assertEqual(result.trades[-1].reason, "end_of_backtest")

        prefix = engine.run(_strategy(), bars[: 42 * 5])
        self.assertEqual(result.trades[:2], prefix.trades[:2])

    def test_volume_gate_blocks_breakout_without_fabricating_a_trade(self):
        bars = _expand_to_one_minute(_five_minute_fixture(breakout_volume=100.0))

        result = BacktestEngine(initial_cash=100, fee_rate=0.001, slippage_rate=0.001).run(
            _strategy(), bars
        )

        self.assertEqual(result.trades, [])
        self.assertEqual(result.metrics.trade_count, 0)

    def test_strategy_max_drawdown_blocks_new_entries_independently_of_daily_limit(self):
        payload = strategy_config_to_payload(_strategy())
        payload["risk"]["dailyLossLimitPct"] = 1.0
        payload["risk"]["maxDrawdownPct"] = 0.0001
        strategy = strategy_config_from_payload(payload)

        result = BacktestEngine(
            initial_cash=100,
            fee_rate=0.001,
            slippage_rate=0.001,
        ).run(strategy, _expand_to_one_minute(_five_minute_fixture()))

        self.assertEqual([trade.side for trade in result.trades], ["buy", "sell"])
        self.assertGreaterEqual(result.metrics.max_drawdown_pct, 0.01)

    def test_profitable_rank_one_promotes_only_through_a_distinct_fresh_p0_run(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
            )
            _record_fresh_p0_run(run_store, winner.strategy)
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
            )

            promotion = runner.promote_winner(
                experiment.experiment_id,
                fresh_source_run_id="fresh-p0-run",
                operator="operator@example.com",
                confirmed=True,
            )
            replayed = runner.promote_winner(
                experiment.experiment_id,
                fresh_source_run_id="fresh-p0-run",
                operator="operator@example.com",
                confirmed=True,
            )

            saved = strategy_store.get(winner.strategy.revision)
            self.assertIsNotNone(saved)
            assert saved is not None
            self.assertEqual((saved.status, saved.audit_run_id), ("audited", "fresh-p0-run"))
            self.assertEqual(saved.promotion_evidence, {
                key: value
                for key, value in promotion.items()
                if key not in {"promotedAt", "libraryStatus", "auditRunId"}
            })
            self.assertEqual(replayed, promotion)
            self.assertEqual(promotion["experimentId"], experiment.experiment_id)
            self.assertEqual(promotion["candidateId"], experiment.selected_candidate_id)
            self.assertEqual(promotion["freshSourceRunId"], "fresh-p0-run")
            self.assertEqual(
                promotion["priorDataRange"],
                {
                    "start": "2026-05-01T00:00:00+00:00",
                    "endExclusive": "2026-07-30T00:00:00+00:00",
                },
            )
            self.assertEqual(
                promotion["freshDataRange"],
                {
                    "start": "2026-08-01T00:00:00+00:00",
                    "endExclusive": "2026-08-01T08:20:00+00:00",
                },
            )
            self.assertTrue(promotion["freshSnapshotDistinct"])
            self.assertTrue(promotion["freshDataRangeDistinct"])
            self.assertNotEqual(
                promotion["freshDataRange"], promotion["priorDataRange"]
            )
            self.assertEqual(
                promotion["freshGateEvaluation"],
                {
                    "passed": True,
                    "failures": [],
                    "metrics": {
                        "totalReturnPct": 1.6636,
                        "maxDrawdownPct": 1.661,
                        "profitFactor": 0.1664,
                        "profitFactorInfinite": True,
                        "roundTripCount": 6,
                    },
                    "guardrails": FORMAL_PROFITABILITY_GUARDRAILS["test"],
                },
            )
            self.assertEqual(
                promotion["freshGateHash"],
                canonical_sha256(promotion["freshGateEvaluation"]),
            )
            self.assertEqual(promotion["strategyRevision"], winner.strategy.revision)
            self.assertEqual(
                promotion["profitabilityStatus"],
                "formal_gate_passed",
            )
            self.assertTrue(promotion["paperOnly"])
            self.assertFalse(promotion["bindingBlocked"])
            promoted = experiment_store.get(experiment.experiment_id)
            assert promoted is not None
            self.assertEqual(promoted.experiment.promotion_run_id, "fresh-p0-run")
            self.assertEqual(
                promoted.experiment.promoted_strategy_revision,
                winner.strategy.revision,
            )

    def test_v2_promotion_rejects_fresh_sealed_run_without_formal_scoring_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
                formal_pre_roll_version=FORMAL_PRE_ROLL_VERSION,
            )
            development = _experiment_bars(
                500,
                started=datetime(2026, 8, 1, tzinfo=timezone.utc),
            )
            development_hash = canonical_data_hash(normalize_snapshot_bars(development))
            summary = SealedDatasetSummary(
                dataset_id=f"sealed-{'c' * 24}",
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                source="fresh-sealed-fixture",
                adjustment_mode="none",
                start=development[0].timestamp,
                development_end_exclusive=development[-1].timestamp
                + timedelta(minutes=1),
                end_exclusive=development[-1].timestamp + timedelta(minutes=2),
                rows=501,
                development_rows=500,
                withheld_rows=1,
                dataset_hash="c" * 64,
                development_hash=development_hash,
            )
            _record_fresh_sealed_p0_run(
                run_store,
                winner.strategy,
                development=development,
                summary=summary,
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
                sealed_bar_source=_FreshSealedDevelopmentSource(summary, development),
            )

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.promote_winner(
                    experiment.experiment_id,
                    fresh_source_run_id="fresh-sealed-p0-run",
                    operator="operator@example.com",
                    confirmed=True,
                )

            self.assertEqual(raised.exception.error, "fresh_p0_snapshot_invalid")
            self.assertIsNone(strategy_store.get(winner.strategy.revision))
            stored = experiment_store.get(experiment.experiment_id)
            assert stored is not None
            self.assertIsNone(stored.experiment.promotion_run_id)

    def test_v2_promotion_rejects_formal_identity_without_required_pre_roll(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
                formal_pre_roll_version=FORMAL_PRE_ROLL_VERSION,
            )
            start = datetime(2026, 5, 1, tzinfo=timezone.utc)
            development_end = start + timedelta(days=72)
            end_exclusive = start + timedelta(days=90)
            summary = SealedDatasetSummary(
                dataset_id=f"sealed-{'d' * 24}",
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                source="fresh-sealed-fixture",
                adjustment_mode="none",
                start=start,
                development_end_exclusive=development_end,
                end_exclusive=end_exclusive,
                rows=129_600,
                development_rows=103_680,
                withheld_rows=25_920,
                dataset_hash="d" * 64,
                development_hash="e" * 64,
            )
            _record_fresh_sealed_p0_run(
                run_store,
                winner.strategy,
                development=[],
                summary=summary,
                formal_scoring=formal_scoring_metadata(summary),
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
                sealed_bar_source=_FreshSealedDevelopmentSource(
                    summary,
                    [],
                    fail_on_development_read=True,
                ),
            )

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.promote_winner(
                    experiment.experiment_id,
                    fresh_source_run_id="fresh-sealed-p0-run",
                    operator="operator@example.com",
                    confirmed=True,
                )

            self.assertEqual(raised.exception.error, "fresh_p0_snapshot_invalid")
            self.assertIsNone(strategy_store.get(winner.strategy.revision))

    def test_v2_promotion_rejects_drifted_fresh_formal_scoring_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
                formal_pre_roll_version=FORMAL_PRE_ROLL_VERSION,
            )
            score_start = datetime(2026, 5, 1, tzinfo=timezone.utc)
            summary = SealedDatasetSummary(
                dataset_id=f"sealed-{'f' * 24}",
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                source="fresh-sealed-fixture",
                adjustment_mode="none",
                start=score_start - timedelta(minutes=180),
                development_end_exclusive=score_start + timedelta(days=72),
                end_exclusive=score_start + timedelta(days=90),
                rows=129_780,
                development_rows=103_860,
                withheld_rows=25_920,
                dataset_hash="f" * 64,
                development_hash="1" * 64,
            )
            drifted_scoring = formal_scoring_metadata(summary)
            drifted_scoring["preRollVersion"] = "formal-pre-roll-drifted"
            _record_fresh_sealed_p0_run(
                run_store,
                winner.strategy,
                development=[],
                summary=summary,
                formal_scoring=drifted_scoring,
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
                sealed_bar_source=_FreshSealedDevelopmentSource(
                    summary,
                    [],
                    fail_on_development_read=True,
                ),
            )

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.promote_winner(
                    experiment.experiment_id,
                    fresh_source_run_id="fresh-sealed-p0-run",
                    operator="operator@example.com",
                    confirmed=True,
                )

            self.assertEqual(raised.exception.error, "fresh_p0_snapshot_invalid")
            self.assertIsNone(strategy_store.get(winner.strategy.revision))

    def test_v2_promotion_rejects_fresh_facts_that_do_not_match_formal_replay(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
                formal_pre_roll_version=FORMAL_PRE_ROLL_VERSION,
            )
            score_start = datetime(2026, 5, 1, tzinfo=timezone.utc)
            development = _experiment_bars(
                103_860,
                started=score_start - timedelta(minutes=180),
            )
            development_hash = str(
                normalize_snapshot_bar_chunks(
                    [
                        development[index : index + 500]
                        for index in range(0, len(development), 500)
                    ],
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                )["hash"]
            )
            summary = SealedDatasetSummary(
                dataset_id=f"sealed-{'2' * 24}",
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                source="fresh-sealed-fixture",
                adjustment_mode="none",
                start=development[0].timestamp,
                development_end_exclusive=score_start + timedelta(days=72),
                end_exclusive=score_start + timedelta(days=90),
                rows=129_780,
                development_rows=103_860,
                withheld_rows=25_920,
                dataset_hash="2" * 64,
                development_hash=development_hash,
            )
            _record_fresh_sealed_p0_run(
                run_store,
                winner.strategy,
                development=development,
                summary=summary,
                formal_scoring=formal_scoring_metadata(summary),
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
                sealed_bar_source=_FreshSealedDevelopmentSource(summary, development),
            )

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.promote_winner(
                    experiment.experiment_id,
                    fresh_source_run_id="fresh-sealed-p0-run",
                    operator="operator@example.com",
                    confirmed=True,
                )

            self.assertEqual(raised.exception.error, "fresh_p0_snapshot_invalid")
            self.assertIsNone(strategy_store.get(winner.strategy.revision))

    def test_strategy_library_save_failure_does_not_partially_mark_experiment_promoted(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
            )
            _record_fresh_p0_run(run_store, winner.strategy)
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
            )

            with patch.object(
                strategy_store,
                "save",
                side_effect=ValueError("strategy_library_revision_conflict"),
            ):
                with self.assertRaises(StrategyExperimentError) as raised:
                    runner.promote_winner(
                        experiment.experiment_id,
                        fresh_source_run_id="fresh-p0-run",
                        operator="operator@example.com",
                        confirmed=True,
                    )

            self.assertEqual(
                raised.exception.error,
                "strategy_library_revision_conflict",
            )
            stored_experiment = experiment_store.get(experiment.experiment_id)
            self.assertIsNotNone(stored_experiment)
            assert stored_experiment is not None
            self.assertIsNone(stored_experiment.experiment.promotion_lineage_hash)
            self.assertIsNone(strategy_store.get(winner.strategy.revision))

    def test_promotion_requires_fresh_p0_to_pass_formal_test_economic_gate_before_writes(self):
        failing_metrics = {
            "non_positive_return": {
                "total_return_pct": 0.0,
                "max_drawdown_pct": 1.0,
                "win_rate_pct": 60.0,
                "profit_factor": 1.5,
                "round_trip_count": 6,
            },
            "profit_factor_below_minimum": {
                "total_return_pct": 0.5,
                "max_drawdown_pct": 1.0,
                "win_rate_pct": 60.0,
                "profit_factor": 1.19,
                "round_trip_count": 6,
            },
            "drawdown_above_maximum": {
                "total_return_pct": 0.5,
                "max_drawdown_pct": 3.01,
                "win_rate_pct": 60.0,
                "profit_factor": 1.5,
                "round_trip_count": 6,
            },
            "round_trip_count_below_minimum": {
                "total_return_pct": 0.5,
                "max_drawdown_pct": 1.0,
                "win_rate_pct": 60.0,
                "profit_factor": 1.5,
                "round_trip_count": 5,
            },
        }

        for failure, metrics in failing_metrics.items():
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as directory:
                strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
                run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
                experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
                base = _strategy()
                strategy_store.save(base)
                winner, experiment = _seed_promotable_experiment(
                    experiment_store,
                    base_strategy=base,
                )
                _record_fresh_p0_run(run_store, winner.strategy, metrics=metrics)
                runner = StrategyExperimentRunner(
                    strategy_store=strategy_store,
                    run_store=run_store,
                    experiment_store=experiment_store,
                )

                with self.assertRaises(StrategyExperimentError) as raised:
                    runner.promote_winner(
                        experiment.experiment_id,
                        fresh_source_run_id="fresh-p0-run",
                        operator="operator@example.com",
                        confirmed=True,
                    )

                self.assertEqual(raised.exception.error, "fresh_p0_profitability_gate_failed")
                self.assertIn(failure, raised.exception.detail)
                self.assertIsNone(strategy_store.get(winner.strategy.revision))
                stored = experiment_store.get(experiment.experiment_id)
                assert stored is not None
                self.assertIsNone(stored.experiment.promotion_run_id)

    def test_promotion_accepts_fresh_p0_infinite_profit_factor_semantics(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
            )
            _record_fresh_p0_run(
                run_store,
                winner.strategy,
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
            )

            promotion = runner.promote_winner(
                experiment.experiment_id,
                fresh_source_run_id="fresh-p0-run",
                operator="operator@example.com",
                confirmed=True,
            )

            self.assertEqual(promotion["profitabilityStatus"], "formal_gate_passed")
            self.assertTrue(
                promotion["freshGateEvaluation"]["metrics"][
                    "profitFactorInfinite"
                ]
            )
            self.assertLess(
                promotion["freshGateEvaluation"]["metrics"]["profitFactor"],
                FORMAL_PROFITABILITY_GUARDRAILS["test"]["minimumProfitFactor"],
            )
            saved = strategy_store.get(winner.strategy.revision)
            assert saved is not None
            self.assertEqual(saved.audit_run_id, "fresh-p0-run")

    def test_promotion_rejects_a_fresh_snapshot_containing_a_forming_bar(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
            )
            created_at = datetime(2026, 8, 10, 1, tzinfo=timezone.utc)
            forming_bars = _experiment_bars(
                500,
                started=created_at - timedelta(minutes=499),
            )
            _record_fresh_p0_run(
                run_store,
                winner.strategy,
                fresh_bars=forming_bars,
                created_at=created_at,
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
            )

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.promote_winner(
                    experiment.experiment_id,
                    fresh_source_run_id="fresh-p0-run",
                    operator="operator@example.com",
                    confirmed=True,
                )

            self.assertEqual(raised.exception.error, "fresh_p0_snapshot_invalid")
            self.assertIsNone(
                experiment_store.get(experiment.experiment_id).experiment.promotion_run_id
            )
            self.assertIsNone(strategy_store.get(winner.strategy.revision))

    def test_promotion_rejects_the_formal_experiment_data_range_even_with_a_new_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
            )
            same_range = _experiment_bars(
                500,
                started=datetime(2026, 5, 1, tzinfo=timezone.utc),
            )
            same_range[-1] = replace(
                same_range[-1],
                timestamp=datetime(2026, 7, 29, 23, 59, tzinfo=timezone.utc),
            )
            _record_fresh_p0_run(
                run_store,
                winner.strategy,
                fresh_bars=same_range,
                metrics={
                    "total_return_pct": 0.5,
                    "max_drawdown_pct": 1.0,
                    "win_rate_pct": 60.0,
                    "profit_factor": 1.5,
                    "round_trip_count": 6,
                },
            )
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
            )

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.promote_winner(
                    experiment.experiment_id,
                    fresh_source_run_id="fresh-p0-run",
                    operator="operator@example.com",
                    confirmed=True,
                )

            self.assertEqual(raised.exception.error, "fresh_p0_snapshot_invalid")
            self.assertIn("different data range", raised.exception.detail)
            self.assertIsNone(strategy_store.get(winner.strategy.revision))
            stored = experiment_store.get(experiment.experiment_id)
            assert stored is not None
            self.assertIsNone(stored.experiment.promotion_run_id)

    def test_http_promotion_requires_exact_confirmation_and_never_binds_execution(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            base = _strategy()
            strategy_store.save(base)
            winner, experiment = _seed_promotable_experiment(
                experiment_store,
                base_strategy=base,
            )
            _record_fresh_p0_run(run_store, winner.strategy)

            class TestHandler(QuantApiHandler):
                pass

            TestHandler.strategy_store = strategy_store
            TestHandler.run_store = run_store
            TestHandler.strategy_experiment_store = experiment_store
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                connection.request(
                    "POST",
                    f"/api/strategy-experiments/{experiment.experiment_id}/promotion",
                    body=json.dumps(
                        {
                            "freshSourceRunId": "fresh-p0-run",
                            "operator": "operator@example.com",
                            "confirmed": True,
                        }
                    ).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            self.assertEqual(response.status, 201)
            self.assertEqual(payload["promotion"]["experimentId"], experiment.experiment_id)
            self.assertEqual(
                payload["promotion"]["profitabilityStatus"],
                "formal_gate_passed",
            )
            self.assertTrue(payload["promotion"]["paperOnly"])
            self.assertFalse(payload["promotion"]["bindingBlocked"])
            encoded = json.dumps(payload, sort_keys=True)
            self.assertNotIn("bindingId", encoded)
            self.assertNotIn("enabled", encoded)


if __name__ == "__main__":
    unittest.main()
