from __future__ import annotations

import base64
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Barrier, Event

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import create_engine

from quant_core.canonical import strategy_config_from_payload, strategy_config_to_payload
from quant_core.public_schema import public_metadata
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
)
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_store_adapters import PublicTenantStores
from quant_core.tenancy import TenantContext
from quant_core.terminal import Instrument


def context(owner_id: str, email: str) -> TenantContext:
    return TenantContext(
        owner_id=owner_id,
        issuer="https://issuer.example",
        subject=owner_id,
        email=email,
        reauthenticated_at=datetime.now(timezone.utc),
    )


class TenantStoreAdaptersTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
        public_metadata.create_all(self.engine)
        key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
        cipher = TenantSecretCipher(key)
        self.first = PublicTenantStores.create(
            self.engine,
            context("owner-a", "a@example.com"),
            cipher,
        )
        self.second = PublicTenantStores.create(
            self.engine,
            context("owner-b", "b@example.com"),
            cipher,
        )

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_same_business_ids_are_isolated_across_all_adapters(self) -> None:
        event = {
            "schemaVersion": 1,
            "eventId": "shared-event",
            "eventType": "research",
            "runId": None,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "stage": "research",
            "source": "test",
            "summary": "first",
            "detail": "detail",
            "metadata": {},
        }
        self.first.audit_event_store.record(event)
        self.second.audit_event_store.record({**event, "summary": "second"})
        self.first.watchlist_store.replace_all(
            [Instrument("600000", "浦发银行", "ashare", 0.0)]
        )

        self.assertEqual(
            self.first.audit_event_store.get("shared-event").summary,
            "first",
        )
        self.assertEqual(
            self.second.audit_event_store.get("shared-event").summary,
            "second",
        )
        self.assertEqual(self.first.watchlist_store.list_instruments()[0].symbol, "600000")
        self.assertEqual(self.second.watchlist_store.list_instruments(), [])

    def test_platform_secrets_are_tenant_scoped_and_not_seeded_from_server_env(self) -> None:
        configuration = {
            "ccxtDefaultExchange": "binance",
            "ccxtTimeout": 10000,
            "autoTradingIntervalSeconds": 35,
            "productionTradingEnabled": False,
            "liveSessionTtlHours": 8,
            "openaiModel": "",
            "openaiCompatibleBaseUrl": "",
            "openaiCompatibleModel": "",
            "ollamaBaseUrl": "http://127.0.0.1:11434",
            "ollamaModel": "",
            "secEdgarUserAgent": "AIQT test@example.com",
            "monitoringWebhookTimeoutSeconds": 5,
            "freeStockdbTimeoutSeconds": 3,
        }
        self.first.platform_settings_store.save(
            configuration,
            {"openaiApiKey": "tenant-a-secret"},
            [],
            {"OPENAI_API_KEY": "server-secret"},
        )

        self.assertEqual(
            self.first.platform_settings_store.effective_environment({}).get(
                "OPENAI_API_KEY"
            ),
            "tenant-a-secret",
        )
        self.assertNotIn(
            "OPENAI_API_KEY",
            self.second.platform_settings_store.effective_environment({}),
        )

    def test_audit_event_batch_uses_one_fenced_transaction(self) -> None:
        fence_calls = 0

        def fence(_connection) -> bool:
            nonlocal fence_calls
            fence_calls += 1
            return fence_calls == 1

        self.first.records.write_fence = fence
        now = datetime.now(timezone.utc).isoformat()
        events = [
            {
                "schemaVersion": 1,
                "eventId": f"batch-{suffix}",
                "eventType": "research",
                "runId": None,
                "createdAt": now,
                "stage": "research",
                "source": "test",
                "summary": suffix,
                "detail": suffix,
                "metadata": {},
            }
            for suffix in ("a", "b")
        ]

        self.first.audit_event_store.record_many(events)

        self.assertEqual(fence_calls, 1)
        self.assertIsNotNone(self.first.audit_event_store.get("batch-a"))
        self.assertIsNotNone(self.first.audit_event_store.get("batch-b"))

    def test_v2_strategy_policy_survives_public_tenant_store_round_trip(self) -> None:
        strategy = strategy_config_from_payload(
            {
                "name": "BTC Regime Breakout v2",
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
                        "closeAboveSmaWindow": 200,
                        "smaSlopeLookbackBars": 1,
                    },
                    "breakout": {
                        "lookbackBars": 20,
                        "excludeSignalBar": True,
                        "oneShotPerEvent": True,
                    },
                    "volume": {
                        "smaWindow": 20,
                        "multiplier": 1.5,
                        "excludeSignalBar": True,
                    },
                    "atr": {
                        "window": 14,
                        "smoothing": "wilder",
                        "initialMultiple": 1,
                        "trailingMultiple": 2,
                        "trailingStartsAfterProfit": True,
                        "trailingActivation": "positive_close",
                        "anchor": "highest_high_since_entry",
                        "neverLoosen": True,
                    },
                    "holding": {
                        "maxBars": 48,
                        "exitOnlyWithoutPositiveProgress": True,
                        "progressDefinition": "highest_close_above_entry",
                    },
                    "cooldown": {
                        "bars": 12,
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

        saved = self.first.strategy_store.save(strategy, audit_run_id="run-v2")

        self.assertEqual(saved.strategy_config, strategy_config_to_payload(strategy))
        self.assertEqual(self.first.strategy_store.get(strategy.revision), saved)
        self.assertIsNone(self.second.strategy_store.get(strategy.revision))

    def test_strategy_experiment_gate_evidence_survives_tenant_round_trip(self) -> None:
        now = datetime(2026, 8, 9, tzinfo=timezone.utc)
        snapshot = StrategyExperimentSnapshot(
            snapshot_id="snapshot-gate",
            created_at=now,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            canonical_data_hash="data-hash",
            rows=1,
            start_at=now.isoformat(),
            end_at=now.isoformat(),
            bars=[{"timestamp": now.isoformat(), "close": 100.0}],
        )
        experiment = StrategyExperimentRecord(
            experiment_id="experiment-gate",
            created_at=now,
            status="completed",
            definition_hash="definition-hash",
            holdout_key="holdout-key",
            strategy_revision="strategy-revision",
            source_run_id="run-gate",
            snapshot_id=snapshot.snapshot_id,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            definition={"resultSchemaVersion": 2},
            evaluation_count=3,
            selected_candidate_id="candidate-gate",
            completion_reason="profitability_gate_passed",
            result_hash="result-hash",
            profitability_gate_passed=True,
        )
        candidate = StrategyExperimentCandidateRecord(
            experiment_id=experiment.experiment_id,
            candidate_id="candidate-gate",
            candidate_revision="candidate-revision",
            parameters=[{"policyPath": "breakout.lookbackBars", "value": 20}],
            train_metrics={"roundTripCount": 24},
            validation_metrics={"roundTripCount": 7},
            test_metrics={"totalReturnPct": 1.0},
            walk_forward={"positiveReturnCount": 4, "validationWindowCount": 6},
            eligible=True,
            rank=1,
            gate_evaluation={
                "pretest": {"passed": True},
                "test": {"passed": True},
            },
        )

        self.first.strategy_experiment_store.put_snapshot(snapshot)
        self.first.strategy_experiment_store.record_completed(experiment, [candidate])

        detail = self.first.strategy_experiment_store.get(experiment.experiment_id)
        self.assertIsNotNone(detail)
        assert detail is not None
        self.assertTrue(detail.experiment.profitability_gate_passed)
        self.assertEqual(detail.candidates[0].gate_evaluation, candidate.gate_evaluation)
        self.assertIsNone(
            self.second.strategy_experiment_store.get(experiment.experiment_id)
        )

    def test_strategy_experiment_pending_job_and_promotion_cas_survive_public_store(self) -> None:
        now = datetime(2026, 8, 10, tzinfo=timezone.utc)
        snapshot = StrategyExperimentSnapshot(
            snapshot_id="snapshot-public-job",
            created_at=now,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            canonical_data_hash="data-hash",
            rows=1,
            start_at=now.isoformat(),
            end_at=now.isoformat(),
            bars=[{"timestamp": now.isoformat(), "close": 100.0}],
        )
        pending = StrategyExperimentRecord(
            experiment_id="experiment-public-job",
            created_at=now,
            status="pending",
            definition_hash="definition-hash",
            holdout_key="holdout-key",
            strategy_revision="strategy-revision",
            source_run_id="run-source",
            snapshot_id=snapshot.snapshot_id,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            definition={"resultSchemaVersion": 2},
            evaluation_count=0,
        )
        completed = StrategyExperimentRecord(
            **{
                **pending.__dict__,
                "status": "completed",
                "evaluation_count": 3,
                "selected_candidate_id": "candidate-winner",
                "completion_reason": "profitability_gate_passed",
                "result_hash": "result-hash",
                "profitability_gate_passed": True,
            }
        )
        candidate = StrategyExperimentCandidateRecord(
            experiment_id=completed.experiment_id,
            candidate_id="candidate-winner",
            candidate_revision="winner-revision",
            parameters=[],
            train_metrics={},
            validation_metrics={},
            test_metrics={"totalReturnPct": 1.0},
            walk_forward={},
            eligible=True,
            rank=1,
            gate_evaluation={"pretest": {"passed": True}, "test": {"passed": True}},
        )
        development_candidate = replace(
            candidate,
            test_metrics=None,
            gate_evaluation={"pretest": {"passed": True}},
        )
        development_checkpoint = replace(
            pending,
            evaluation_count=2,
            selected_candidate_id=candidate.candidate_id,
            completion_reason="development_completed",
        )
        store = self.first.strategy_experiment_store
        store.put_snapshot(snapshot)

        store.record_pending(pending)
        store.record_development_checkpoint(
            development_checkpoint,
            [development_candidate],
        )
        checkpoint = store.get(pending.experiment_id)
        self.assertIsNotNone(checkpoint)
        assert checkpoint is not None
        self.assertEqual(checkpoint.experiment, development_checkpoint)
        self.assertEqual(checkpoint.candidates, [development_candidate])
        store.record_completed(completed, [candidate])
        promoted = store.mark_promoted(
            experiment_id=completed.experiment_id,
            expected_result_hash="result-hash",
            promotion_run_id="fresh-p0-run",
            promoted_strategy_revision="winner-revision",
            promotion_lineage_hash="lineage-hash",
            promoted_at=now + timedelta(hours=1),
            promotion_operator="a@example.com",
        )

        self.assertEqual(promoted.experiment.status, "completed")
        self.assertEqual(promoted.experiment.promotion_run_id, "fresh-p0-run")
        self.assertEqual(
            store.get(completed.experiment_id).experiment.promotion_lineage_hash,
            "lineage-hash",
        )

    def test_stale_public_development_checkpoint_cannot_revive_failed_experiment(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
                future=True,
            )
            public_metadata.create_all(engine)
            key = base64.urlsafe_b64encode(
                AESGCM.generate_key(bit_length=256)
            ).decode()
            cipher = TenantSecretCipher(key)
            tenant = context(
                "owner-checkpoint-terminal-race",
                "checkpoint-terminal-race@example.com",
            )
            stores = [
                PublicTenantStores.create(engine, tenant, cipher),
                PublicTenantStores.create(engine, tenant, cipher),
            ]
            now = datetime(2026, 8, 10, tzinfo=timezone.utc)
            snapshot = StrategyExperimentSnapshot(
                snapshot_id="snapshot-checkpoint-terminal-race",
                created_at=now,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash="data-hash",
                rows=1,
                start_at=now.isoformat(),
                end_at=(now + timedelta(minutes=1)).isoformat(),
                bars=[{"timestamp": now.isoformat(), "close": 100.0}],
            )
            pending = StrategyExperimentRecord(
                experiment_id="experiment-checkpoint-terminal-race",
                created_at=now,
                status="pending",
                definition_hash="definition-hash",
                holdout_key="holdout-key",
                strategy_revision="strategy-revision",
                source_run_id="source-run",
                snapshot_id=snapshot.snapshot_id,
                market=snapshot.market,
                symbol=snapshot.symbol,
                timeframe=snapshot.timeframe,
                definition={"resultSchemaVersion": 2},
                evaluation_count=0,
            )
            development_candidate = StrategyExperimentCandidateRecord(
                experiment_id=pending.experiment_id,
                candidate_id="candidate-development-winner",
                candidate_revision="candidate-revision",
                parameters=[],
                train_metrics={"totalReturnPct": 1.0},
                validation_metrics={"totalReturnPct": 0.5},
                test_metrics=None,
                walk_forward={"positiveReturnCount": 1},
                eligible=True,
                rank=1,
                gate_evaluation={"pretest": {"passed": True}},
            )
            checkpoint = replace(
                pending,
                evaluation_count=1,
                selected_candidate_id=development_candidate.candidate_id,
                completion_reason="development_completed",
            )
            failed = replace(
                pending,
                status="failed",
                error_code="forced_failure",
                error_detail="terminal writer won",
            )
            stores[0].strategy_experiment_store.put_snapshot(snapshot)
            stores[0].strategy_experiment_store.record_pending(pending)

            checkpoint_write_started = Event()
            terminal_committed = Event()

            def pause_stale_checkpoint(_connection) -> bool:
                checkpoint_write_started.set()
                if not terminal_committed.wait(timeout=5):
                    raise RuntimeError("terminal writer did not commit")
                return True

            stores[0].records.write_fence = pause_stale_checkpoint

            try:
                with ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(
                        stores[0].strategy_experiment_store.record_development_checkpoint,
                        checkpoint,
                        [development_candidate],
                    )
                    self.assertTrue(checkpoint_write_started.wait(timeout=5))
                    stores[1].strategy_experiment_store.record_failed(failed)
                    terminal_committed.set()
                    with self.assertRaisesRegex(
                        ValueError,
                        "strategy_experiment_conflict",
                    ):
                        future.result(timeout=5)

                stored = stores[1].strategy_experiment_store.get(
                    pending.experiment_id
                )
                self.assertIsNotNone(stored)
                assert stored is not None
                self.assertEqual(stored.experiment, failed)
                self.assertEqual(stored.candidates, [])
            finally:
                terminal_committed.set()
                engine.dispose()

    def test_first_public_terminal_transition_cannot_be_overwritten_by_stale_writer(
        self,
    ) -> None:
        for winner_status in ("completed", "failed"):
            with (
                self.subTest(winner_status=winner_status),
                tempfile.TemporaryDirectory() as tmp,
            ):
                engine = create_engine(
                    f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}",
                    connect_args={"check_same_thread": False},
                    future=True,
                )
                public_metadata.create_all(engine)
                key = base64.urlsafe_b64encode(
                    AESGCM.generate_key(bit_length=256)
                ).decode()
                cipher = TenantSecretCipher(key)
                tenant = context(
                    f"owner-terminal-race-{winner_status}",
                    f"terminal-race-{winner_status}@example.com",
                )
                stores = [
                    PublicTenantStores.create(engine, tenant, cipher),
                    PublicTenantStores.create(engine, tenant, cipher),
                ]
                now = datetime(2026, 8, 10, tzinfo=timezone.utc)
                snapshot = StrategyExperimentSnapshot(
                    snapshot_id=f"snapshot-terminal-race-{winner_status}",
                    created_at=now,
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    canonical_data_hash="data-hash",
                    rows=1,
                    start_at=now.isoformat(),
                    end_at=(now + timedelta(minutes=1)).isoformat(),
                    bars=[{"timestamp": now.isoformat(), "close": 100.0}],
                )
                pending = StrategyExperimentRecord(
                    experiment_id=f"experiment-terminal-race-{winner_status}",
                    created_at=now,
                    status="pending",
                    definition_hash="definition-hash",
                    holdout_key="holdout-key",
                    strategy_revision="strategy-revision",
                    source_run_id="source-run",
                    snapshot_id=snapshot.snapshot_id,
                    market=snapshot.market,
                    symbol=snapshot.symbol,
                    timeframe=snapshot.timeframe,
                    definition={"resultSchemaVersion": 2},
                    evaluation_count=0,
                )
                candidate = StrategyExperimentCandidateRecord(
                    experiment_id=pending.experiment_id,
                    candidate_id="candidate-terminal-winner",
                    candidate_revision="candidate-revision",
                    parameters=[],
                    train_metrics={"totalReturnPct": 1.0},
                    validation_metrics={"totalReturnPct": 0.5},
                    test_metrics={"totalReturnPct": 0.25},
                    walk_forward={"positiveReturnCount": 1},
                    eligible=True,
                    rank=1,
                    gate_evaluation={
                        "pretest": {"passed": True},
                        "test": {"passed": True},
                    },
                )
                completed = replace(
                    pending,
                    status="completed",
                    evaluation_count=1,
                    selected_candidate_id=candidate.candidate_id,
                    completion_reason="profitability_gate_passed",
                    result_hash="result-hash",
                    profitability_gate_passed=True,
                )
                failed = replace(
                    pending,
                    status="failed",
                    error_code="forced_failure",
                    error_detail="terminal writer won",
                )
                stores[0].strategy_experiment_store.put_snapshot(snapshot)
                stores[0].strategy_experiment_store.record_pending(pending)

                stale_write_started = Event()
                winner_committed = Event()

                def pause_stale_terminal(_connection) -> bool:
                    stale_write_started.set()
                    if not winner_committed.wait(timeout=5):
                        raise RuntimeError("winning terminal writer did not commit")
                    return True

                def persist_terminal(index: int, status: str) -> None:
                    store = stores[index].strategy_experiment_store
                    if status == "completed":
                        store.record_completed(completed, [candidate])
                    else:
                        store.record_failed(failed)

                stale_status = (
                    "failed" if winner_status == "completed" else "completed"
                )
                stores[0].records.write_fence = pause_stale_terminal

                try:
                    with ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(persist_terminal, 0, stale_status)
                        self.assertTrue(stale_write_started.wait(timeout=5))
                        persist_terminal(1, winner_status)
                        winner_committed.set()
                        with self.assertRaisesRegex(
                            ValueError,
                            "strategy_experiment_conflict",
                        ):
                            future.result(timeout=5)

                    stored = stores[1].strategy_experiment_store.get(
                        pending.experiment_id
                    )
                    self.assertIsNotNone(stored)
                    assert stored is not None
                    expected_experiment = (
                        completed if winner_status == "completed" else failed
                    )
                    expected_candidates = (
                        [candidate] if winner_status == "completed" else []
                    )
                    self.assertEqual(stored.experiment, expected_experiment)
                    self.assertEqual(stored.candidates, expected_candidates)
                finally:
                    winner_committed.set()
                    engine.dispose()

    def test_racing_public_snapshot_definitions_cannot_overwrite_the_atomic_winner(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
                future=True,
            )
            public_metadata.create_all(engine)
            key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
            cipher = TenantSecretCipher(key)
            tenant = context("owner-snapshot-race", "snapshot-race@example.com")
            stores = [
                PublicTenantStores.create(engine, tenant, cipher),
                PublicTenantStores.create(engine, tenant, cipher),
            ]
            now = datetime(2026, 8, 10, tzinfo=timezone.utc)
            snapshots = [
                StrategyExperimentSnapshot(
                    snapshot_id="snapshot-create-race",
                    created_at=now,
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    canonical_data_hash=f"data-hash-{index}",
                    rows=1,
                    start_at=now.isoformat(),
                    end_at=(now + timedelta(minutes=1)).isoformat(),
                    bars=[
                        {
                            "timestamp": now.isoformat(),
                            "close": 100.0 + index,
                        }
                    ],
                )
                for index in range(2)
            ]
            write_barrier = Barrier(2)

            def synchronize_writes(_connection) -> bool:
                write_barrier.wait()
                return True

            for store in stores:
                store.records.write_fence = synchronize_writes

            def put(index: int) -> tuple[StrategyExperimentSnapshot, str]:
                try:
                    stores[index].strategy_experiment_store.put_snapshot(
                        snapshots[index]
                    )
                    outcome = "stored"
                except ValueError as error:
                    outcome = str(error)
                return snapshots[index], outcome

            try:
                with ThreadPoolExecutor(max_workers=2) as executor:
                    outcomes = list(executor.map(put, range(2)))

                self.assertCountEqual(
                    [outcome for _snapshot, outcome in outcomes],
                    ["stored", "strategy_experiment_conflict"],
                )
                winner = next(
                    snapshot
                    for snapshot, outcome in outcomes
                    if outcome == "stored"
                )
                self.assertEqual(
                    stores[0].strategy_experiment_store.snapshots.get(
                        winner.snapshot_id
                    ),
                    winner,
                )
                self.assertEqual(
                    stores[1].strategy_experiment_store.snapshots.get(
                        winner.snapshot_id
                    ),
                    winner,
                )
            finally:
                engine.dispose()

    def test_racing_public_pending_replays_converge_on_one_definition_winner(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
                future=True,
            )
            public_metadata.create_all(engine)
            key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
            cipher = TenantSecretCipher(key)
            tenant = context("owner-pending-race", "pending-race@example.com")
            stores = [
                PublicTenantStores.create(engine, tenant, cipher),
                PublicTenantStores.create(engine, tenant, cipher),
            ]
            now = datetime(2026, 8, 10, tzinfo=timezone.utc)
            snapshot = StrategyExperimentSnapshot(
                snapshot_id="snapshot-pending-race",
                created_at=now,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash="data-hash",
                rows=1,
                start_at=now.isoformat(),
                end_at=(now + timedelta(minutes=1)).isoformat(),
                bars=[{"timestamp": now.isoformat(), "close": 100.0}],
            )
            stores[0].strategy_experiment_store.put_snapshot(snapshot)
            pending_records = [
                StrategyExperimentRecord(
                    experiment_id="experiment-idempotency-race",
                    created_at=now + timedelta(microseconds=index),
                    status="pending",
                    definition_hash="shared-definition-hash",
                    holdout_key="shared-holdout-key",
                    strategy_revision="strategy-revision",
                    source_run_id="source-run",
                    snapshot_id=snapshot.snapshot_id,
                    market=snapshot.market,
                    symbol=snapshot.symbol,
                    timeframe=snapshot.timeframe,
                    definition={"resultSchemaVersion": 2},
                    evaluation_count=0,
                )
                for index in range(2)
            ]
            write_barrier = Barrier(2)

            def synchronize_writes(_connection) -> bool:
                write_barrier.wait()
                return True

            for store in stores:
                store.records.write_fence = synchronize_writes

            def record(index: int) -> tuple[StrategyExperimentRecord, str]:
                try:
                    stores[index].strategy_experiment_store.record_pending(
                        pending_records[index]
                    )
                    outcome = "recorded"
                except ValueError as error:
                    outcome = str(error)
                return pending_records[index], outcome

            try:
                with ThreadPoolExecutor(max_workers=2) as executor:
                    outcomes = list(executor.map(record, range(2)))

                self.assertCountEqual(
                    [outcome for _record, outcome in outcomes],
                    ["recorded", "strategy_experiment_conflict"],
                )
                winner = next(
                    record
                    for record, outcome in outcomes
                    if outcome == "recorded"
                )
                first_readback = stores[0].strategy_experiment_store.get(
                    winner.experiment_id
                )
                second_readback = stores[1].strategy_experiment_store.get(
                    winner.experiment_id
                )
                self.assertIsNotNone(first_readback)
                self.assertEqual(first_readback, second_readback)
                assert first_readback is not None
                self.assertEqual(first_readback.experiment, winner)
                self.assertEqual(
                    first_readback.experiment.definition_hash,
                    "shared-definition-hash",
                )

                for store in stores:
                    store.records.write_fence = None
                stores[1].strategy_experiment_store.record_pending(winner)
                self.assertEqual(
                    stores[1].strategy_experiment_store.get(winner.experiment_id),
                    first_readback,
                )
            finally:
                engine.dispose()

    def test_racing_public_pending_different_definitions_cannot_overwrite_winner(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
                future=True,
            )
            public_metadata.create_all(engine)
            key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
            cipher = TenantSecretCipher(key)
            tenant = context(
                "owner-pending-conflict-race",
                "pending-conflict-race@example.com",
            )
            stores = [
                PublicTenantStores.create(engine, tenant, cipher),
                PublicTenantStores.create(engine, tenant, cipher),
            ]
            now = datetime(2026, 8, 10, tzinfo=timezone.utc)
            snapshot = StrategyExperimentSnapshot(
                snapshot_id="snapshot-pending-conflict-race",
                created_at=now,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash="data-hash",
                rows=1,
                start_at=now.isoformat(),
                end_at=(now + timedelta(minutes=1)).isoformat(),
                bars=[{"timestamp": now.isoformat(), "close": 100.0}],
            )
            stores[0].strategy_experiment_store.put_snapshot(snapshot)
            pending_records = [
                StrategyExperimentRecord(
                    experiment_id="experiment-definition-race",
                    created_at=now,
                    status="pending",
                    definition_hash=f"definition-hash-{index}",
                    holdout_key=f"holdout-key-{index}",
                    strategy_revision="strategy-revision",
                    source_run_id="source-run",
                    snapshot_id=snapshot.snapshot_id,
                    market=snapshot.market,
                    symbol=snapshot.symbol,
                    timeframe=snapshot.timeframe,
                    definition={
                        "resultSchemaVersion": 2,
                        "candidateSet": index,
                    },
                    evaluation_count=0,
                )
                for index in range(2)
            ]
            write_barrier = Barrier(2)

            def synchronize_writes(_connection) -> bool:
                write_barrier.wait()
                return True

            for store in stores:
                store.records.write_fence = synchronize_writes

            def record(index: int) -> tuple[StrategyExperimentRecord, str]:
                try:
                    stores[index].strategy_experiment_store.record_pending(
                        pending_records[index]
                    )
                    outcome = "recorded"
                except ValueError as error:
                    outcome = str(error)
                return pending_records[index], outcome

            try:
                with ThreadPoolExecutor(max_workers=2) as executor:
                    outcomes = list(executor.map(record, range(2)))

                self.assertCountEqual(
                    [outcome for _record, outcome in outcomes],
                    ["recorded", "strategy_experiment_conflict"],
                )
                winner = next(
                    record
                    for record, outcome in outcomes
                    if outcome == "recorded"
                )
                loser = next(
                    record
                    for record, outcome in outcomes
                    if outcome == "strategy_experiment_conflict"
                )
                stored = stores[0].strategy_experiment_store.get(
                    winner.experiment_id
                )
                self.assertIsNotNone(stored)
                assert stored is not None
                self.assertEqual(stored.experiment, winner)
                self.assertNotEqual(
                    stored.experiment.definition_hash,
                    loser.definition_hash,
                )
                self.assertEqual(
                    stores[1].strategy_experiment_store.get(winner.experiment_id),
                    stored,
                )
            finally:
                engine.dispose()

    def test_racing_public_holdout_definitions_have_one_atomic_winner(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
                future=True,
            )
            public_metadata.create_all(engine)
            key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
            cipher = TenantSecretCipher(key)
            tenant = context("owner-race", "race@example.com")
            stores = [
                PublicTenantStores.create(engine, tenant, cipher),
                PublicTenantStores.create(engine, tenant, cipher),
            ]
            now = datetime(2026, 8, 9, tzinfo=timezone.utc)
            snapshot = StrategyExperimentSnapshot(
                snapshot_id="snapshot-race",
                created_at=now,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash="data-hash",
                rows=1,
                start_at=now.isoformat(),
                end_at=now.isoformat(),
                bars=[{"timestamp": now.isoformat(), "close": 100.0}],
            )
            stores[0].strategy_experiment_store.put_snapshot(snapshot)
            write_barrier = Barrier(2)

            def synchronize_writes(_connection) -> bool:
                write_barrier.wait()
                return True

            for store in stores:
                store.records.write_fence = synchronize_writes

            def claim(index: int) -> tuple[str, str, datetime, str]:
                definition_hash = f"definition-{index}"
                experiment_id = f"experiment-{index}"
                consumed_at = now + timedelta(minutes=index)
                try:
                    outcome = stores[index].strategy_experiment_store.claim_test_holdout(
                        snapshot_id=snapshot.snapshot_id,
                        definition_hash=definition_hash,
                        experiment_id=experiment_id,
                        consumed_at=consumed_at,
                    )
                except ValueError as error:
                    outcome = str(error)
                return definition_hash, experiment_id, consumed_at, outcome

            try:
                with ThreadPoolExecutor(max_workers=2) as executor:
                    outcomes = list(executor.map(claim, range(2)))

                self.assertCountEqual(
                    [outcome[3] for outcome in outcomes],
                    ["claimed", "test_holdout_consumed"],
                )
                winner = next(outcome for outcome in outcomes if outcome[3] == "claimed")
                claimed = stores[0].strategy_experiment_store.snapshots.get(
                    snapshot.snapshot_id
                )
                self.assertEqual(claimed.test_definition_hash, winner[0])
                self.assertEqual(claimed.test_owner_experiment_id, winner[1])
                self.assertEqual(claimed.test_consumed_at, winner[2])

                for store in stores:
                    store.records.write_fence = None
                self.assertEqual(
                    stores[1].strategy_experiment_store.claim_test_holdout(
                        snapshot_id=snapshot.snapshot_id,
                        definition_hash=winner[0],
                        experiment_id="experiment-replay",
                        consumed_at=now + timedelta(hours=1),
                    ),
                    "replay",
                )
                replayed = stores[1].strategy_experiment_store.snapshots.get(
                    snapshot.snapshot_id
                )
                self.assertEqual(replayed.test_owner_experiment_id, winner[1])
                self.assertEqual(replayed.test_consumed_at, winner[2])
            finally:
                engine.dispose()


if __name__ == "__main__":
    unittest.main()
