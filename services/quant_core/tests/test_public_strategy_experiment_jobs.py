from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Barrier, Event, Thread
import tempfile
import time
from types import SimpleNamespace
import unittest

from sqlalchemy import create_engine

from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_sha256,
    strategy_config_to_payload,
)
from quant_core.deployment import load_deployment_config
from quant_core.domain import Condition, RiskRules, StrategyConfig
from quant_core.public_background import PublicBackgroundRunner
from quant_core.public_identity import PublicIdentityStore
from quant_core.public_schema import create_public_schema
from quant_core.public_tenant_api import PublicBridgeHandler, PublicTenantApi
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.strategy_experiment_store import (
    StrategyExperimentCandidateRecord,
    StrategyExperimentRecord,
    StrategyExperimentSnapshot,
    StrategyExperimentStore,
)
from quant_core.strategy_experiments import (
    POLICY_RESULT_SCHEMA_VERSION,
    StrategyExperimentError,
    StrategyExperimentRunner,
    _formal_pretest_gate_evaluation,
    strategy_experiment_id_from_idempotency_key,
    strategy_research_launch_definition_identity,
)
from quant_core.strategy_library import StrategyLibraryStore
from quant_core.tenancy import TenantContext


class _BlockingExperimentTenantApi:
    def __init__(self) -> None:
        self.started = Event()
        self.release = Event()
        self.processed_owner_ids: list[str] = []

    def process_strategy_experiment_jobs(
        self,
        tenant,
        *,
        lease_guard=None,
        lease_fence=None,
    ):
        if lease_guard is not None and not lease_guard():
            raise RuntimeError("public_lease_lost")
        self.processed_owner_ids.append(tenant.owner_id)
        self.started.set()
        self.release.wait(timeout=2)
        if lease_guard is not None and not lease_guard():
            raise RuntimeError("public_lease_lost")
        return {"processed": 1}


class PublicStrategyExperimentJobTest(unittest.TestCase):
    def test_only_one_public_instance_runs_a_tenants_pending_experiment_jobs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
            )
            create_public_schema(engine)
            user = PublicIdentityStore(engine).register_login(
                issuer="https://identity.example.com",
                subject="researcher",
                email="researcher@example.com",
                email_verified=True,
                now=datetime(2026, 8, 10, tzinfo=timezone.utc),
            )
            api = _BlockingExperimentTenantApi()
            first = PublicBackgroundRunner(engine, api)  # type: ignore[arg-type]
            second = PublicBackgroundRunner(engine, api)  # type: ignore[arg-type]
            first_result: list[int] = []

            thread = Thread(
                target=lambda: first_result.append(
                    first.run_strategy_experiments_once()
                )
            )
            thread.start()
            self.assertTrue(api.started.wait(timeout=1))
            second_result = second.run_strategy_experiments_once()
            api.release.set()
            thread.join(timeout=2)
            engine.dispose()

        self.assertEqual(first_result, [1])
        self.assertEqual(second_result, 0)
        self.assertEqual(api.processed_owner_ids, [user.owner_id])

    def test_recovery_fails_closed_without_reclaiming_an_already_consumed_holdout(self) -> None:
        class CountingSealedSource:
            claims = 0
            test_reads = 0

            def claim_test_partition(self, *_args, **_kwargs):
                self.claims += 1
                raise AssertionError("recovery must not reclaim a consumed holdout")

            def read_claimed_test_bars(self, *_args, **_kwargs):
                self.test_reads += 1
                raise AssertionError("recovery must not reread a consumed holdout")

        with tempfile.TemporaryDirectory() as directory:
            store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            consumed_at = datetime(2026, 8, 10, 1, tzinfo=timezone.utc)
            snapshot = StrategyExperimentSnapshot(
                snapshot_id="snapshot-consumed",
                created_at=consumed_at,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash="development-hash",
                rows=129_600,
                start_at="2026-05-01T00:00:00+00:00",
                end_at="2026-07-30T00:00:00+00:00",
                bars=[],
                test_definition_hash="definition-consumed",
                test_owner_experiment_id="experiment-consumed",
                test_consumed_at=consumed_at,
            )
            pending = StrategyExperimentRecord(
                experiment_id="experiment-consumed",
                created_at=consumed_at,
                status="pending",
                definition_hash="definition-consumed",
                holdout_key="holdout-consumed",
                strategy_revision="strategy-v2",
                source_run_id="run-v2",
                snapshot_id=snapshot.snapshot_id,
                market=snapshot.market,
                symbol=snapshot.symbol,
                timeframe=snapshot.timeframe,
                definition={},
                evaluation_count=0,
            )
            store.put_snapshot(snapshot)
            store.record_pending(pending)
            source = CountingSealedSource()
            runner = StrategyExperimentRunner(
                strategy_store=object(),  # type: ignore[arg-type]
                run_store=object(),  # type: ignore[arg-type]
                experiment_store=store,
                sealed_bar_source=source,  # type: ignore[arg-type]
            )

            recovered = runner.resume_pending(pending.experiment_id)
            repeated = runner.resume_pending(pending.experiment_id)

        self.assertEqual(recovered.experiment.status, "failed")
        self.assertEqual(
            recovered.experiment.error_code,
            "test_holdout_consumed_before_recovery",
        )
        self.assertEqual(repeated, recovered)
        self.assertEqual((source.claims, source.test_reads), (0, 0))

    def test_local_recovery_fails_closed_when_launch_audit_evidence_is_missing(self) -> None:
        class CountingSealedSource:
            claims = 0
            test_reads = 0

            def claim_test_partition(self, *_args, **_kwargs):
                self.claims += 1
                raise AssertionError("recovery must not claim the holdout")

            def read_claimed_test_bars(self, *_args, **_kwargs):
                self.test_reads += 1
                raise AssertionError("recovery must not read the holdout")

        with tempfile.TemporaryDirectory() as directory:
            store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            experiment_id = _seed_recoverable_pending(
                store,
                Path(directory),
                strategy_research_proposal_id=(
                    "strategy-research-proposal-" + "a" * 24
                ),
            )
            source = CountingSealedSource()
            runner = StrategyExperimentRunner(
                strategy_store=object(),  # type: ignore[arg-type]
                run_store=object(),  # type: ignore[arg-type]
                experiment_store=store,
                sealed_bar_source=source,  # type: ignore[arg-type]
                launch_evidence_loader=lambda _event_id: None,
            )

            failed = runner.resume_pending(experiment_id)
            repeated = runner.resume_pending(experiment_id)

        self.assertEqual(failed.experiment.status, "failed")
        self.assertEqual(
            failed.experiment.error_code,
            "strategy_research_launch_evidence_invalid",
        )
        self.assertEqual(failed.experiment.evaluation_count, 0)
        self.assertEqual(repeated, failed)
        self.assertEqual((source.claims, source.test_reads), (0, 0))

    def test_invalid_pending_job_is_failed_once_instead_of_retried_forever(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            created_at = datetime(2026, 8, 10, 1, tzinfo=timezone.utc)
            snapshot = StrategyExperimentSnapshot(
                snapshot_id="snapshot-invalid",
                created_at=created_at,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash="development-hash",
                rows=129_600,
                start_at="2026-05-01T00:00:00+00:00",
                end_at="2026-07-30T00:00:00+00:00",
                bars=[],
            )
            pending = StrategyExperimentRecord(
                experiment_id="experiment-invalid",
                created_at=created_at,
                status="pending",
                definition_hash="invalid-definition-hash",
                holdout_key="holdout-invalid",
                strategy_revision="strategy-v2",
                source_run_id="run-v2",
                snapshot_id=snapshot.snapshot_id,
                market=snapshot.market,
                symbol=snapshot.symbol,
                timeframe=snapshot.timeframe,
                definition={},
                evaluation_count=0,
            )
            store.put_snapshot(snapshot)
            store.record_pending(pending)
            runner = StrategyExperimentRunner(
                strategy_store=object(),  # type: ignore[arg-type]
                run_store=object(),  # type: ignore[arg-type]
                experiment_store=store,
            )

            failed = runner.resume_pending(pending.experiment_id)
            repeated = runner.resume_pending(pending.experiment_id)

        self.assertEqual(failed.experiment.status, "failed")
        self.assertEqual(failed.experiment.error_code, "strategy_experiment_recovery_invalid")
        self.assertEqual(repeated, failed)

    def test_holdout_is_durably_reserved_before_the_external_partition_claim(self) -> None:
        class StopAfterClaim(RuntimeError):
            pass

        class ReservingExperimentStore:
            reserved = False

            def claim_test_holdout(self, **_kwargs):
                self.reserved = True
                return "claimed"

        store = ReservingExperimentStore()

        class InterruptingSource:
            def claim_test_partition(self, *_args, **_kwargs):
                if not store.reserved:
                    raise AssertionError(
                        "the durable experiment reservation must precede the source claim"
                    )
                raise StopAfterClaim

        runner = StrategyExperimentRunner(
            strategy_store=object(),  # type: ignore[arg-type]
            run_store=object(),  # type: ignore[arg-type]
            experiment_store=store,  # type: ignore[arg-type]
            sealed_bar_source=InterruptingSource(),  # type: ignore[arg-type]
        )
        definition = SimpleNamespace(
            sealed_dataset_id="sealed-source",
            sealed_dataset_hash="dataset-hash",
            snapshot=SimpleNamespace(snapshot_id="snapshot-source"),
            definition_hash="definition-source",
        )

        with self.assertRaises(StopAfterClaim):
            runner._claim_and_read_sealed_test(  # type: ignore[arg-type]
                definition,
                experiment_id="experiment-source",
            )

        self.assertTrue(store.reserved)

    def test_recovery_reuses_durable_development_ranking_before_holdout_claim(self) -> None:
        class SimulatedProcessDeath(BaseException):
            pass

        strategy = StrategyConfig(
            name="Checkpoint strategy",
            market="crypto",
            symbols=["BTC/USDT"],
            timeframe="1m",
            entry_conditions=[Condition(kind="close_above_sma", params={"window": 2})],
            exit_conditions=[Condition(kind="close_below_sma", params={"window": 2})],
        )
        candidate = SimpleNamespace(
            candidate_id="candidate-checkpoint",
            strategy=strategy,
            parameters=[],
        )
        guardrails = {
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
            "stability": {"requirePositiveAdjacentCandidates": False},
        }
        train_metrics = {
            "totalReturnPct": 2.0,
            "maxDrawdownPct": 1.0,
            "profitFactor": 1.5,
            "profitFactorInfinite": False,
            "roundTripCount": 24,
        }
        validation_metrics = {
            "totalReturnPct": 1.0,
            "maxDrawdownPct": 1.0,
            "profitFactor": 1.5,
            "profitFactorInfinite": False,
            "roundTripCount": 6,
        }
        walk_forward = {
            "validationWindowCount": 7,
            "positiveReturnCount": 5,
        }
        gate = _formal_pretest_gate_evaluation(
            train_metrics=train_metrics,
            validation_metrics=validation_metrics,
            walk_forward=walk_forward,
            guardrails=guardrails,
        )
        record = StrategyExperimentCandidateRecord(
            experiment_id="experiment-checkpoint",
            candidate_id=candidate.candidate_id,
            candidate_revision=strategy.revision,
            parameters=[],
            train_metrics=train_metrics,
            validation_metrics=validation_metrics,
            test_metrics=None,
            walk_forward=walk_forward,
            eligible=True,
            rank=1,
            gate_evaluation=gate,
        )
        snapshot = StrategyExperimentSnapshot(
            snapshot_id="snapshot-checkpoint",
            created_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            canonical_data_hash="dataset-hash",
            rows=129_600,
            start_at="2026-05-01T00:00:00+00:00",
            end_at="2026-07-30T00:00:00+00:00",
            bars=[],
        )
        definition_body = {
            "sourceRunId": "run-checkpoint",
            "guardrails": guardrails,
            "dimensions": [],
            "resultSchemaVersion": POLICY_RESULT_SCHEMA_VERSION,
        }
        definition = SimpleNamespace(
            definition=definition_body,
            definition_hash=canonical_sha256(definition_body),
            holdout_key="holdout-checkpoint",
            snapshot=snapshot,
            strategy=strategy,
            candidates=(candidate,),
            bars=(),
            train_end=0,
            validation_end=0,
            score_start_index=0,
            sealed_dataset_id="sealed-checkpoint",
            sealed_dataset_hash="dataset-hash",
        )

        class CheckpointRunner(StrategyExperimentRunner):
            development_calls = 0

            def _definition_from_record(self, _prior):
                return definition

            def _evaluate_development_candidates(self, *_args, **_kwargs):
                self.development_calls += 1
                if self.development_calls > 1:
                    raise AssertionError("recovery must not repeat development ranking")
                return [record]

            def _claim_and_read_sealed_test(self, *_args, **_kwargs):
                raise SimulatedProcessDeath

        with tempfile.TemporaryDirectory() as directory:
            store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            store.put_snapshot(snapshot)
            store.record_pending(
                StrategyExperimentRecord(
                    experiment_id=record.experiment_id,
                    created_at=snapshot.created_at,
                    status="pending",
                    definition_hash=definition.definition_hash,
                    holdout_key=definition.holdout_key,
                    strategy_revision=strategy.revision,
                    source_run_id="run-checkpoint",
                    snapshot_id=snapshot.snapshot_id,
                    market=snapshot.market,
                    symbol=snapshot.symbol,
                    timeframe=snapshot.timeframe,
                    definition=definition_body,
                    evaluation_count=0,
                )
            )
            runner = CheckpointRunner(
                strategy_store=object(),  # type: ignore[arg-type]
                run_store=object(),  # type: ignore[arg-type]
                experiment_store=store,
            )
            with self.assertRaises(SimulatedProcessDeath):
                runner._execute_formal_job(
                    definition,
                    experiment_id=record.experiment_id,
                    created_at=snapshot.created_at,
                )
            checkpoint = store.get(record.experiment_id)
            assert checkpoint is not None
            self.assertEqual(checkpoint.experiment.completion_reason, "development_completed")
            self.assertEqual(checkpoint.candidates, [record])

            with self.assertRaises(SimulatedProcessDeath):
                runner.resume_pending(record.experiment_id)

        self.assertEqual(runner.development_calls, 1)

    def test_formal_queue_idempotency_converges_and_rejects_definition_drift(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
            snapshot = _queue_snapshot()
            store.put_snapshot(snapshot)
            jobs: list[object] = []

            class PreparedRunner(StrategyExperimentRunner):
                prepared_definition = _queue_definition(snapshot, variant="original")

                def _definition_from_source(self, _payload):
                    return self.prepared_definition

            runner = PreparedRunner(
                strategy_store=object(),  # type: ignore[arg-type]
                run_store=object(),  # type: ignore[arg-type]
                experiment_store=store,
                job_launcher=jobs.append,
            )

            first = runner.run_new(
                {},
                idempotency_key="strategy-research-proposal-fixed",
            )
            repeated = runner.run_new(
                {},
                idempotency_key="strategy-research-proposal-fixed",
            )
            runner.prepared_definition = _queue_definition(snapshot, variant="drifted")
            with self.assertRaises(StrategyExperimentError) as raised:
                runner.run_new(
                    {},
                    idempotency_key="strategy-research-proposal-fixed",
                )

        self.assertEqual(
            first.experiment.experiment_id,
            "experiment-41e812636bad31a9bb8afff5",
        )
        self.assertEqual(repeated, first)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(
            (raised.exception.status, raised.exception.error),
            (409, "strategy_experiment_idempotency_conflict"),
        )

    def test_concurrent_pending_insert_conflict_reads_back_one_idempotent_winner(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "experiments.sqlite"
            stores = [StrategyExperimentStore(path), StrategyExperimentStore(path)]
            snapshot = _queue_snapshot()
            stores[0].put_snapshot(snapshot)
            barrier = Barrier(2)

            class RacingStore:
                def __init__(self, delegate) -> None:
                    self.delegate = delegate

                def __getattr__(self, name):
                    return getattr(self.delegate, name)

                def record_pending(self, experiment):
                    barrier.wait(timeout=2)
                    return self.delegate.record_pending(experiment)

            jobs: list[object] = []
            runners = [
                StrategyExperimentRunner(
                    strategy_store=object(),  # type: ignore[arg-type]
                    run_store=object(),  # type: ignore[arg-type]
                    experiment_store=RacingStore(store),  # type: ignore[arg-type]
                    job_launcher=jobs.append,
                )
                for store in stores
            ]
            definition = _queue_definition(snapshot, variant="original")

            with ThreadPoolExecutor(max_workers=2) as executor:
                results = list(
                    executor.map(
                        lambda runner: runner._queue_formal(  # type: ignore[arg-type]
                            definition,
                            idempotency_key="strategy-research-proposal-fixed",
                        ),
                        runners,
                    )
                )

        self.assertEqual(
            {result.experiment.experiment_id for result in results},
            {"experiment-41e812636bad31a9bb8afff5"},
        )
        self.assertTrue(all(result.experiment.status == "pending" for result in results))
        self.assertEqual(len(jobs), 1)

    def test_public_tenant_api_recovers_pending_jobs_after_runtime_restart_once(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.sqlite'}"
            )
            create_public_schema(engine)
            config = load_deployment_config(
                {
                    "AIQT_DEPLOYMENT_MODE": "public",
                    "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
                    "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
                    "AIQT_OIDC_ISSUER": "https://identity.example.com",
                    "AIQT_OIDC_CLIENT_ID": "aiqt",
                    "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
                    "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(
                        b"m" * 32
                    ).decode(),
                }
            )
            tenant = TenantContext(
                owner_id="owner-researcher",
                issuer="https://identity.example.com",
                subject="researcher",
                email="researcher@example.com",
                reauthenticated_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
            )
            first_api = PublicTenantApi(config, engine)
            first_runtime = first_api._runtime(tenant)
            experiment_id = _seed_recoverable_pending(
                first_runtime.stores.strategy_experiment_store,
                Path(directory),
            )

            result = first_api.process_strategy_experiment_jobs(
                tenant,
                lease_guard=lambda: True,
                lease_fence=lambda _connection: True,
            )
            completed = first_runtime.stores.strategy_experiment_store.get(experiment_id)
            restarted_api = PublicTenantApi(config, engine)
            repeated = restarted_api.process_strategy_experiment_jobs(
                tenant,
                lease_guard=lambda: True,
                lease_fence=lambda _connection: True,
            )
            engine.dispose()

        self.assertEqual(result["processed"], 1)
        self.assertEqual(result["completed"], 1)
        self.assertIsNotNone(completed)
        assert completed is not None
        self.assertEqual(completed.experiment.status, "completed")
        self.assertEqual(repeated["processed"], 0)

    def test_public_recovery_fails_closed_without_matching_strategy_research_launch_evidence(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.sqlite'}"
            )
            create_public_schema(engine)
            config = load_deployment_config(
                {
                    "AIQT_DEPLOYMENT_MODE": "public",
                    "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
                    "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
                    "AIQT_OIDC_ISSUER": "https://identity.example.com",
                    "AIQT_OIDC_CLIENT_ID": "aiqt",
                    "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
                    "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(
                        b"m" * 32
                    ).decode(),
                }
            )
            tenant = TenantContext(
                owner_id="owner-researcher",
                issuer="https://identity.example.com",
                subject="researcher",
                email="researcher@example.com",
                reauthenticated_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
            )
            api = PublicTenantApi(config, engine)
            store = api._runtime(tenant).stores.strategy_experiment_store
            seeded_id = _seed_recoverable_pending(
                store,
                Path(directory),
                strategy_research_proposal_id=(
                    "strategy-research-proposal-" + "a" * 24
                ),
            )

            result = api.process_strategy_experiment_jobs(
                tenant,
                lease_guard=lambda: True,
                lease_fence=lambda _connection: True,
            )
            failed = store.get(seeded_id)
            engine.dispose()

        self.assertEqual(result, {"processed": 1, "completed": 0, "failed": 1, "pending": 0})
        self.assertIsNotNone(failed)
        assert failed is not None
        self.assertEqual(failed.experiment.status, "failed")
        self.assertEqual(
            failed.experiment.error_code,
            "strategy_research_launch_evidence_invalid",
        )
        self.assertEqual(failed.experiment.evaluation_count, 0)

    def test_public_recovery_does_not_starve_pending_job_older_than_fifty_terminal_rows(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.sqlite'}"
            )
            create_public_schema(engine)
            config = load_deployment_config(
                {
                    "AIQT_DEPLOYMENT_MODE": "public",
                    "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
                    "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
                    "AIQT_OIDC_ISSUER": "https://identity.example.com",
                    "AIQT_OIDC_CLIENT_ID": "aiqt",
                    "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
                    "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(
                        b"m" * 32
                    ).decode(),
                }
            )
            tenant = TenantContext(
                owner_id="owner-researcher",
                issuer="https://identity.example.com",
                subject="researcher",
                email="researcher@example.com",
                reauthenticated_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
            )
            api = PublicTenantApi(config, engine)
            store = api._runtime(tenant).stores.strategy_experiment_store
            experiment_id = _seed_recoverable_pending(store, Path(directory))
            pending_detail = store.get(experiment_id)
            self.assertIsNotNone(pending_detail)
            assert pending_detail is not None
            for index in range(50):
                store.record_failed(
                    replace(
                        pending_detail.experiment,
                        experiment_id=f"terminal-newer-{index:02d}",
                        created_at=pending_detail.experiment.created_at
                        + timedelta(minutes=index + 1),
                        status="failed",
                        completion_reason="seeded_terminal_record",
                        error_code="seeded_terminal_record",
                        error_detail="terminal fixture",
                    )
                )

            result = api.process_strategy_experiment_jobs(
                tenant,
                lease_guard=lambda: True,
                lease_fence=lambda _connection: True,
            )
            recovered = store.get(experiment_id)
            engine.dispose()

        self.assertEqual(result["processed"], 1)
        self.assertIsNotNone(recovered)
        assert recovered is not None
        self.assertEqual(recovered.experiment.status, "completed")

    def test_background_scheduler_recovers_strategy_experiment_jobs_without_a_browser(self) -> None:
        class ScheduledTenantApi:
            processed = Event()

            def process_strategy_experiment_jobs(
                self,
                tenant,
                *,
                lease_guard=None,
                lease_fence=None,
            ):
                if lease_guard is not None and not lease_guard():
                    raise RuntimeError("public_lease_lost")
                self.processed.set()
                return {"processed": 0}

            def review_due_selections(self, *_args, **_kwargs):
                return {"reviewed": 0}

            def process_auto_trading_once(self, *_args, **_kwargs):
                return {"processed": 0}

        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
            )
            create_public_schema(engine)
            PublicIdentityStore(engine).register_login(
                issuer="https://identity.example.com",
                subject="researcher",
                email="researcher@example.com",
                email_verified=True,
                now=datetime(2026, 8, 10, tzinfo=timezone.utc),
            )
            api = ScheduledTenantApi()
            runner = PublicBackgroundRunner(engine, api)  # type: ignore[arg-type]
            runner.selection_interval = 3_600
            runner.auto_interval = 3_600
            runner.strategy_experiment_interval = 0.01

            runner.start()
            observed = api.processed.wait(timeout=1)
            still_running = runner.running
            runner.stop()
            time.sleep(0.01)
            engine.dispose()

        self.assertTrue(observed)
        self.assertTrue(still_running)

    def test_public_http_bridge_only_persists_formal_jobs_for_the_leased_runner(self) -> None:
        handler = object.__new__(PublicBridgeHandler)
        handler.strategy_store = object()  # type: ignore[assignment]
        handler.run_store = object()  # type: ignore[assignment]
        handler.strategy_experiment_store = object()  # type: ignore[assignment]
        sealed_source = object()
        handler.sealed_dataset_store = sealed_source  # type: ignore[assignment]
        executed = Event()

        runner = handler._strategy_experiment_runner()
        runner.job_launcher(executed.set)

        self.assertFalse(executed.wait(timeout=0.1))
        self.assertIs(runner.sealed_bar_source, sealed_source)


def _seed_recoverable_pending(
    target_store,
    root: Path,
    *,
    experiment_id: str | None = None,
    strategy_research_proposal_id: str | None = None,
) -> str:
    strategy = StrategyConfig(
        name="Recoverable experiment",
        market="ashare",
        symbols=["600000"],
        timeframe="1d",
        entry_conditions=[Condition(kind="close_above_sma", params={"window": 2})],
        exit_conditions=[Condition(kind="close_below_sma", params={"window": 2})],
        risk=RiskRules(position_pct=0.5, max_drawdown_pct=0.2),
    )
    started = datetime(2026, 1, 1, tzinfo=timezone.utc)
    bars = [
        {
            "timestamp": (started + timedelta(days=index)).isoformat(),
            "timestampMs": int((started + timedelta(days=index)).timestamp() * 1000),
            "open": 100 + index % 3,
            "high": 102 + index % 3,
            "low": 99 + index % 3,
            "close": 101 + index % 3,
            "volume": 1_000 + index,
        }
        for index in range(100)
    ]
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
    strategy_store = StrategyLibraryStore(root / "seed-strategies.sqlite")
    run_store = ResearchRunStore(root / "seed-runs.sqlite")
    experiment_store = StrategyExperimentStore(root / "seed-experiments.sqlite")
    strategy_store.save(strategy)
    run_store.record(
        ResearchRunAudit(
            run_id="seed-run",
            created_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
            market=strategy.market,
            symbol=strategy.symbols[0],
            timeframe=strategy.timeframe,
            strategy_name=strategy.name,
            strategy_revision=strategy.revision,
            data_rows=len(bars),
            metrics={},
            decisions=[],
            execution_mode="paper_only",
            data_quality={
                "source": "fixture",
                "isComplete": True,
                "warnings": [],
                "rows": len(bars),
            },
            data_snapshot=snapshot,
            strategy_config=strategy_config_to_payload(strategy),
            backtest_assumptions={
                "initialCash": 100_000,
                "feeBps": 3,
                "slippageBps": 2,
            },
        )
    )
    completed = StrategyExperimentRunner(
        strategy_store=strategy_store,
        run_store=run_store,
        experiment_store=experiment_store,
    ).run_new(
        {
            "strategyRevision": strategy.revision,
            "sourceRunId": "seed-run",
            "assumptions": {
                "initialCash": 100_000,
                "feeBps": 3,
                "slippageBps": 2,
            },
            "dimensions": [
                {
                    "conditionSide": "entry",
                    "conditionIndex": 0,
                    "parameter": "window",
                    "values": [2],
                }
            ],
            "guardrails": {
                "minimumTradeCount": 999,
                "maximumDrawdownPct": 20,
            },
            "walkForward": None,
        }
    )
    pending_snapshot = replace(
        completed.snapshot,
        test_definition_hash=None,
        test_owner_experiment_id=None,
        test_consumed_at=None,
    )
    definition = dict(completed.experiment.definition)
    if strategy_research_proposal_id is not None:
        experiment_id = strategy_experiment_id_from_idempotency_key(
            strategy_research_proposal_id
        )
        definition["strategyResearchLaunch"] = {
            "proposalId": strategy_research_proposal_id,
            "experimentId": experiment_id,
            "eventId": f"strategy-research-launch-{experiment_id}",
            "definitionIdentityHash": strategy_research_launch_definition_identity(
                definition
            ),
        }
    pending = replace(
        completed.experiment,
        experiment_id=experiment_id or completed.experiment.experiment_id,
        status="pending",
        definition=definition,
        definition_hash=canonical_sha256(definition),
        evaluation_count=0,
        selected_candidate_id=None,
        completion_reason=None,
        result_hash=None,
        profitability_gate_passed=False,
        error_code=None,
        error_detail=None,
    )
    target_store.put_snapshot(pending_snapshot)
    target_store.record_pending(pending)
    return pending.experiment_id


def _queue_snapshot() -> StrategyExperimentSnapshot:
    return StrategyExperimentSnapshot(
        snapshot_id="snapshot-idempotent-formal",
        created_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        canonical_data_hash="development-hash",
        rows=129_600,
        start_at="2026-05-01T00:00:00+00:00",
        end_at="2026-07-30T00:00:00+00:00",
        bars=[],
    )


def _queue_definition(
    snapshot: StrategyExperimentSnapshot,
    *,
    variant: str,
):
    body = {
        "sourceRunId": "run-idempotent-formal",
        "variant": variant,
    }
    return SimpleNamespace(
        definition=body,
        definition_hash=canonical_sha256(body),
        holdout_key="holdout-idempotent-formal",
        snapshot=snapshot,
        strategy=SimpleNamespace(revision="strategy-idempotent-formal"),
        sealed_dataset_id="sealed-idempotent-formal",
        sealed_dataset_hash="sealed-idempotent-formal-hash",
    )


if __name__ == "__main__":
    unittest.main()
