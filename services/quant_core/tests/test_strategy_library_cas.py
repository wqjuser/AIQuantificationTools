from __future__ import annotations

import base64
import sqlite3
import tempfile
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from threading import Barrier, Event

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import create_engine

from quant_core.public_schema import public_metadata
from quant_core.strategy_library import StrategyLibraryStore
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_store_adapters import PublicTenantStores
from quant_core.tenancy import TenantContext


def _strategy_payload(*, name: str = "CAS strategy") -> dict[str, object]:
    return {
        "name": name,
        "revision": "revision-cas",
        "market": "crypto",
        "symbols": ["BTC/USDT"],
        "timeframe": "1m",
        "version": 1,
        "entryConditions": [
            {"kind": "close_above_sma", "params": {"window": 20}}
        ],
        "exitConditions": [
            {"kind": "close_below_sma", "params": {"window": 20}}
        ],
        "risk": {
            "positionPct": 0.6,
            "stopLossPct": 0.01,
            "takeProfitPct": 0.02,
            "maxDrawdownPct": 0.03,
        },
    }


def _promotion_evidence(
    *,
    lineage_hash: str = "lineage-a",
    fresh_source_run_id: str = "run-a",
    experiment_id: str = "experiment-a",
) -> dict[str, object]:
    return {
        "experimentId": experiment_id,
        "definitionHash": "definition-a",
        "resultHash": "result-a",
        "candidateId": "candidate-a",
        "candidateRevision": "revision-cas",
        "freshSourceRunId": fresh_source_run_id,
        "freshSnapshotHash": "snapshot-a",
        "strategyRevision": "revision-cas",
        "operator": "operator@example.com",
        "profitabilityStatus": "formal_gate_passed",
        "paperOnly": True,
        "bindingBlocked": False,
        "lineageHash": lineage_hash,
    }


def _tenant_context() -> TenantContext:
    return TenantContext(
        owner_id="owner-cas",
        issuer="https://issuer.example",
        subject="subject-cas",
        email="operator@example.com",
        reauthenticated_at=datetime.now(timezone.utc),
    )


class LocalStrategyLibraryCasTests(unittest.TestCase):
    def test_audited_revision_is_monotonic_and_promotion_replay_is_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            payload = _strategy_payload()

            draft = store.save_payload(payload)
            audited = store.save_payload(
                payload,
                audit_run_id="run-a",
                promotion_evidence=_promotion_evidence(),
            )
            replayed = store.save_payload(
                payload,
                audit_run_id="run-a",
                promotion_evidence=_promotion_evidence(),
            )
            draft_replay = store.save_payload(payload)

            self.assertEqual(draft.status, "draft")
            self.assertEqual(audited.status, "audited")
            self.assertEqual(replayed, audited)
            self.assertEqual(draft_replay, audited)
            self.assertEqual(audited.audit_run_id, "run-a")
            self.assertEqual(audited.promotion_evidence, _promotion_evidence())

            with self.assertRaisesRegex(
                ValueError, "strategy_library_promotion_evidence_conflict"
            ):
                store.save_payload(
                    payload,
                    audit_run_id="run-a",
                    promotion_evidence=_promotion_evidence(
                        lineage_hash="lineage-conflict"
                    ),
                )
            with self.assertRaisesRegex(
                ValueError, "strategy_library_promotion_evidence_conflict"
            ):
                store.save_payload(
                    payload,
                    audit_run_id="run-b",
                    promotion_evidence=_promotion_evidence(
                        lineage_hash="lineage-b",
                        fresh_source_run_id="run-b",
                    ),
                )
            with self.assertRaisesRegex(
                ValueError, "strategy_library_revision_conflict"
            ):
                store.save_payload(
                    _strategy_payload(name="Conflicting body"),
                    audit_run_id="run-a",
                )

            updated = store.save_payload(
                payload,
                audit_run_id="run-b",
                promotion_evidence=_promotion_evidence(
                    lineage_hash="lineage-b",
                    fresh_source_run_id="run-b",
                    experiment_id="experiment-b",
                ),
            )
            self.assertEqual(updated.audit_run_id, "run-b")
            self.assertEqual(
                updated.promotion_evidence,
                _promotion_evidence(
                    lineage_hash="lineage-b",
                    fresh_source_run_id="run-b",
                    experiment_id="experiment-b",
                ),
            )
            self.assertEqual(store.save_payload(payload), updated)
            cleared = store.save_payload(payload, audit_run_id="run-c")
            self.assertEqual(cleared.audit_run_id, "run-c")
            self.assertIsNone(cleared.promotion_evidence)

    def test_racing_audit_pointer_updates_are_serialized(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "strategies.sqlite"
            StrategyLibraryStore(database)
            contenders = 8
            barrier = Barrier(contenders)

            def save(index: int) -> str:
                store = StrategyLibraryStore(database)
                barrier.wait()
                try:
                    store.save_payload(
                        _strategy_payload(),
                        audit_run_id=f"run-{index}",
                        promotion_evidence=_promotion_evidence(
                            lineage_hash=f"lineage-{index}",
                            fresh_source_run_id=f"run-{index}",
                            experiment_id=f"experiment-{index}",
                        ),
                    )
                    return "saved"
                except ValueError as error:
                    return str(error)

            with ThreadPoolExecutor(max_workers=contenders) as executor:
                outcomes = list(executor.map(save, range(contenders)))

            self.assertEqual(outcomes, ["saved"] * contenders)
            winner = StrategyLibraryStore(database).get("revision-cas")
            self.assertIsNotNone(winner)
            assert winner is not None
            self.assertEqual(winner.status, "audited")
            self.assertIn(winner.audit_run_id, {f"run-{i}" for i in range(contenders)})
            self.assertIsNotNone(winner.promotion_evidence)
            assert winner.promotion_evidence is not None
            self.assertEqual(
                winner.promotion_evidence["freshSourceRunId"],
                winner.audit_run_id,
            )

    def test_racing_stale_draft_cannot_downgrade_local_audited_write(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "strategies.sqlite"
            StrategyLibraryStore(database)
            blocker = sqlite3.connect(database)
            blocker.execute("BEGIN IMMEDIATE")
            barrier = Barrier(9)

            def save_draft(_index: int) -> None:
                barrier.wait()
                StrategyLibraryStore(database).save_payload(_strategy_payload())

            def save_audit(_index: int) -> None:
                barrier.wait()
                StrategyLibraryStore(database).save_payload(
                    _strategy_payload(), audit_run_id="run-a"
                )

            with ThreadPoolExecutor(max_workers=9) as executor:
                futures = [executor.submit(save_draft, index) for index in range(8)]
                futures.append(executor.submit(save_audit, 8))
                time.sleep(0.05)
                blocker.commit()
                blocker.close()
                for future in futures:
                    future.result(timeout=5)

            winner = StrategyLibraryStore(database).get("revision-cas")
            self.assertIsNotNone(winner)
            assert winner is not None
            self.assertEqual((winner.status, winner.audit_run_id), ("audited", "run-a"))

    def test_racing_promotion_evidence_has_one_atomic_winner(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "strategies.sqlite"
            StrategyLibraryStore(database).save_payload(
                _strategy_payload(), audit_run_id="run-a"
            )
            barrier = Barrier(2)

            def promote(index: int) -> str:
                store = StrategyLibraryStore(database)
                barrier.wait()
                try:
                    store.save_payload(
                        _strategy_payload(),
                        audit_run_id="run-a",
                        promotion_evidence=_promotion_evidence(
                            lineage_hash=f"lineage-{index}"
                        ),
                    )
                    return "saved"
                except ValueError as error:
                    return str(error)

            with ThreadPoolExecutor(max_workers=2) as executor:
                outcomes = list(executor.map(promote, range(2)))

            self.assertCountEqual(
                outcomes,
                ["saved", "strategy_library_promotion_evidence_conflict"],
            )
            winner = StrategyLibraryStore(database).get("revision-cas")
            self.assertIsNotNone(winner)
            assert winner is not None
            self.assertIn(
                winner.promotion_evidence,
                [
                    _promotion_evidence(lineage_hash="lineage-0"),
                    _promotion_evidence(lineage_hash="lineage-1"),
                ],
            )


class TenantStrategyLibraryCasTests(unittest.TestCase):
    def setUp(self) -> None:
        self.directory = tempfile.TemporaryDirectory()
        self.engine = create_engine(
            f"sqlite+pysqlite:///{Path(self.directory.name) / 'public.sqlite'}",
            connect_args={"check_same_thread": False},
            future=True,
        )
        public_metadata.create_all(self.engine)
        key = base64.urlsafe_b64encode(
            AESGCM.generate_key(bit_length=256)
        ).decode()
        self.cipher = TenantSecretCipher(key)

    def tearDown(self) -> None:
        self.engine.dispose()
        self.directory.cleanup()

    def stores(self) -> PublicTenantStores:
        return PublicTenantStores.create(
            self.engine,
            _tenant_context(),
            self.cipher,
        )

    def test_audited_revision_is_monotonic_and_public_promotion_is_scoped(self) -> None:
        store = self.stores().strategy_store
        payload = _strategy_payload()

        store.save_payload(payload)
        audited = store.save_payload(
            payload,
            audit_run_id="run-a",
            promotion_evidence=_promotion_evidence(),
        )

        self.assertEqual(store.save_payload(payload), audited)
        self.assertEqual(
            store.save_payload(
                payload,
                audit_run_id="run-a",
                promotion_evidence=_promotion_evidence(),
            ),
            audited,
        )
        with self.assertRaisesRegex(
            ValueError, "strategy_library_promotion_evidence_conflict"
        ):
            store.save_payload(
                payload,
                audit_run_id="run-a",
                promotion_evidence=_promotion_evidence(
                    lineage_hash="lineage-conflict"
                ),
            )
        with self.assertRaisesRegex(
            ValueError, "strategy_library_promotion_evidence_conflict"
        ):
            store.save_payload(
                payload,
                audit_run_id="run-b",
                promotion_evidence=_promotion_evidence(
                    lineage_hash="lineage-b",
                    fresh_source_run_id="run-b",
                ),
            )
        with self.assertRaisesRegex(
            ValueError, "strategy_library_revision_conflict"
        ):
            store.save_payload(
                _strategy_payload(name="Conflicting body"),
                audit_run_id="run-a",
            )

        updated = store.save_payload(
            payload,
            audit_run_id="run-b",
            promotion_evidence=_promotion_evidence(
                lineage_hash="lineage-b",
                fresh_source_run_id="run-b",
                experiment_id="experiment-b",
            ),
        )
        self.assertEqual(updated.audit_run_id, "run-b")
        self.assertEqual(
            updated.promotion_evidence,
            _promotion_evidence(
                lineage_hash="lineage-b",
                fresh_source_run_id="run-b",
                experiment_id="experiment-b",
            ),
        )
        self.assertEqual(store.save_payload(payload), updated)
        cleared = store.save_payload(payload, audit_run_id="run-c")
        self.assertEqual(cleared.audit_run_id, "run-c")
        self.assertIsNone(cleared.promotion_evidence)

    def test_racing_public_audit_pointer_updates_are_serialized(self) -> None:
        stores = [self.stores(), self.stores()]
        write_barrier = Barrier(2)
        first_write_seen = [False, False]

        def fence(index: int):
            def synchronize_first_write(_connection) -> bool:
                if not first_write_seen[index]:
                    first_write_seen[index] = True
                    write_barrier.wait()
                return True

            return synchronize_first_write

        for index, bundle in enumerate(stores):
            bundle.records.write_fence = fence(index)

        def save(index: int) -> str:
            try:
                stores[index].strategy_store.save_payload(
                    _strategy_payload(),
                    audit_run_id=f"run-{index}",
                    promotion_evidence=_promotion_evidence(
                        lineage_hash=f"lineage-{index}",
                        fresh_source_run_id=f"run-{index}",
                        experiment_id=f"experiment-{index}",
                    ),
                )
                return "saved"
            except ValueError as error:
                return str(error)

        with ThreadPoolExecutor(max_workers=2) as executor:
            outcomes = list(executor.map(save, range(2)))

        self.assertEqual(outcomes, ["saved", "saved"])
        for bundle in stores:
            bundle.records.write_fence = None
        winner = stores[0].strategy_store.get("revision-cas")
        self.assertIsNotNone(winner)
        assert winner is not None
        self.assertEqual(winner.status, "audited")
        self.assertIn(winner.audit_run_id, {"run-0", "run-1"})
        self.assertIsNotNone(winner.promotion_evidence)
        assert winner.promotion_evidence is not None
        self.assertEqual(
            winner.promotion_evidence["freshSourceRunId"], winner.audit_run_id
        )

    def test_racing_stale_public_draft_cannot_downgrade_audited_write(self) -> None:
        stores = [self.stores(), self.stores()]
        draft_ready = Event()
        audit_done = Event()

        def pause_stale_draft(_connection) -> bool:
            draft_ready.set()
            self.assertTrue(audit_done.wait(timeout=5))
            return True

        stores[0].records.write_fence = pause_stale_draft

        def save_draft() -> None:
            stores[0].strategy_store.save_payload(_strategy_payload())

        def save_audit() -> None:
            try:
                stores[1].strategy_store.save_payload(
                    _strategy_payload(), audit_run_id="run-a"
                )
            finally:
                audit_done.set()

        with ThreadPoolExecutor(max_workers=2) as executor:
            draft_future = executor.submit(save_draft)
            self.assertTrue(draft_ready.wait(timeout=5))
            audit_future = executor.submit(save_audit)
            audit_future.result(timeout=5)
            draft_future.result(timeout=5)

        stores[0].records.write_fence = None
        winner = stores[0].strategy_store.get("revision-cas")
        self.assertIsNotNone(winner)
        assert winner is not None
        self.assertEqual((winner.status, winner.audit_run_id), ("audited", "run-a"))

    def test_racing_public_promotion_evidence_has_one_cas_winner(self) -> None:
        stores = [self.stores(), self.stores()]
        stores[0].strategy_store.save_payload(
            _strategy_payload(), audit_run_id="run-a"
        )
        write_barrier = Barrier(2)

        def synchronize_writes(_connection) -> bool:
            write_barrier.wait()
            return True

        for bundle in stores:
            bundle.records.write_fence = synchronize_writes

        def promote(index: int) -> str:
            try:
                stores[index].strategy_store.save_payload(
                    _strategy_payload(),
                    audit_run_id="run-a",
                    promotion_evidence=_promotion_evidence(
                        lineage_hash=f"lineage-{index}"
                    ),
                )
                return "saved"
            except ValueError as error:
                return str(error)

        with ThreadPoolExecutor(max_workers=2) as executor:
            outcomes = list(executor.map(promote, range(2)))

        self.assertCountEqual(
            outcomes,
            ["saved", "strategy_library_promotion_evidence_conflict"],
        )
        for bundle in stores:
            bundle.records.write_fence = None
        winner = stores[0].strategy_store.get("revision-cas")
        self.assertIsNotNone(winner)
        assert winner is not None
        self.assertIn(
            winner.promotion_evidence,
            [
                _promotion_evidence(lineage_hash="lineage-0"),
                _promotion_evidence(lineage_hash="lineage-1"),
            ],
        )


if __name__ == "__main__":
    unittest.main()
