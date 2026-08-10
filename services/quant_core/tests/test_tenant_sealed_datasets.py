from __future__ import annotations

import base64
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Barrier, BrokenBarrierError, Lock

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import create_engine

from quant_core.canonical import canonical_data_hash, normalize_snapshot_bars
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.public_schema import public_metadata
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_store_adapters import PublicTenantStores
from quant_core.tenancy import TenantContext


def _context(owner_id: str, email: str) -> TenantContext:
    return TenantContext(
        owner_id=owner_id,
        issuer="https://issuer.example",
        subject=owner_id,
        email=email,
        reauthenticated_at=datetime.now(timezone.utc),
    )


def _bars(start: datetime, rows: int) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=start + timedelta(minutes=index),
            open=100 + index / 100,
            high=101 + index / 100,
            low=99 + index / 100,
            close=100.5 + index / 100,
            volume=10 + index,
        )
        for index in range(rows)
    ]


def _quality(chunk: list[OHLCVBar]) -> DataQuality:
    return DataQuality(
        source="binance",
        origin_source="binance",
        is_complete=True,
        rows=len(chunk),
        adjustment_mode="none",
        canonical_hash=canonical_data_hash(normalize_snapshot_bars(chunk)),
    )


class TenantSealedDatasetStoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
        public_metadata.create_all(self.engine)
        key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
        self.cipher = TenantSecretCipher(key)
        self.first = PublicTenantStores.create(
            self.engine,
            _context("owner-a", "a@example.com"),
            self.cipher,
        )
        self.second = PublicTenantStores.create(
            self.engine,
            _context("owner-b", "b@example.com"),
            self.cipher,
        )

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_same_dataset_id_is_owner_isolated_and_development_can_be_read(self) -> None:
        start = datetime(2026, 8, 1, tzinfo=timezone.utc)
        chunks = [_bars(start, 4), _bars(start + timedelta(minutes=4), 2)]
        request = MarketDataRequest(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            start=start,
            end=start + timedelta(minutes=6),
        )

        first_summary = self.first.sealed_dataset_store.seal_dataset(
            request,
            chunks,
            [_quality(chunk) for chunk in chunks],
            development_end_exclusive=start + timedelta(minutes=4),
            observed_at=start + timedelta(minutes=7),
        )

        self.assertIsNone(self.second.sealed_dataset_store.get_summary(first_summary.dataset_id))
        second_summary = self.second.sealed_dataset_store.seal_dataset(
            request,
            chunks,
            [_quality(chunk) for chunk in chunks],
            development_end_exclusive=start + timedelta(minutes=4),
            observed_at=start + timedelta(minutes=7),
        )

        self.assertEqual(second_summary.dataset_id, first_summary.dataset_id)
        self.assertEqual(
            self.first.sealed_dataset_store.read_development_bars(first_summary.dataset_id),
            chunks[0],
        )
        self.assertEqual(
            self.second.sealed_dataset_store.read_development_bars(second_summary.dataset_id),
            chunks[0],
        )
        first_claim = self.first.sealed_dataset_store.claim_test_partition(
            first_summary.dataset_id,
            claimant_id="experiment-owner-a",
            expected_dataset_hash=first_summary.dataset_hash,
        )
        second_claim = self.second.sealed_dataset_store.claim_test_partition(
            second_summary.dataset_id,
            claimant_id="experiment-owner-b",
            expected_dataset_hash=second_summary.dataset_hash,
        )
        self.assertEqual(first_claim.claimant_id, "experiment-owner-a")
        self.assertEqual(second_claim.claimant_id, "experiment-owner-b")

    def test_large_partitions_use_bounded_chunks_and_integrity_survives_recreation(self) -> None:
        start = datetime(2026, 8, 1, tzinfo=timezone.utc)
        bars = _bars(start, 1_201)
        chunks = [bars[:500], bars[500:1_000], bars[1_000:]]
        summary = self.first.sealed_dataset_store.seal_dataset(
            MarketDataRequest(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                start=start,
                end=start + timedelta(minutes=len(bars)),
            ),
            chunks,
            [_quality(chunk) for chunk in chunks],
            development_end_exclusive=start + timedelta(minutes=1_001),
            observed_at=start + timedelta(minutes=1_202),
        )

        first_integrity = self.first.sealed_dataset_store.get_integrity(summary.dataset_id)
        restarted = PublicTenantStores.create(
            self.engine,
            _context("owner-a", "a@example.com"),
            self.cipher,
        )

        self.assertEqual(
            len(restarted.sealed_dataset_store.read_development_bars(summary.dataset_id)),
            1_001,
        )
        self.assertEqual(
            restarted.sealed_dataset_store.get_integrity(summary.dataset_id),
            first_integrity,
        )
        self.assertEqual(first_integrity.dataset_id, summary.dataset_id)
        self.assertEqual(first_integrity.manifest_token, summary.dataset_hash)
        self.assertGreaterEqual(first_integrity.content_version, 1)

    def test_integrity_never_reads_withheld_partition_and_development_drift_fails_closed(
        self,
    ) -> None:
        start = datetime(2026, 8, 1, tzinfo=timezone.utc)
        bars = _bars(start, 8)
        store = self.first.sealed_dataset_store
        summary = store.seal_dataset(
            MarketDataRequest(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                start=start,
                end=start + timedelta(minutes=len(bars)),
            ),
            [bars],
            [_quality(bars)],
            development_end_exclusive=start + timedelta(minutes=5),
            observed_at=start + timedelta(minutes=9),
        )
        partition_reads = {"development": 0, "test": 0}
        original_read_partition = store._read_partition

        def counting_read_partition(manifest, partition_name, chunk_ids):
            partition_reads[partition_name] += 1
            return original_read_partition(manifest, partition_name, chunk_ids)

        store._read_partition = counting_read_partition  # type: ignore[method-assign]

        integrity = store.get_integrity(summary.dataset_id)

        self.assertEqual(integrity.manifest_token, summary.dataset_hash)
        self.assertEqual(partition_reads, {"development": 1, "test": 0})

        manifest = store.manifests.get(summary.dataset_id)
        chunk_id = manifest.development_chunk_ids[0]
        chunk = store.chunks.get(chunk_id)
        drifted_bars = list(chunk.bars)
        drifted_bars[0] = {
            **drifted_bars[0],
            "close": drifted_bars[0]["close"] + 0.1,
        }
        store.chunks.put(
            chunk_id,
            replace(chunk, bars=tuple(drifted_bars)),
        )

        with self.assertRaisesRegex(ValueError, "sealed_dataset_chunk_hash_mismatch"):
            store.get_integrity(summary.dataset_id)
        self.assertEqual(partition_reads, {"development": 2, "test": 0})

    def test_test_partition_claim_token_can_be_consumed_only_once(self) -> None:
        start = datetime(2026, 8, 2, tzinfo=timezone.utc)
        bars = _bars(start, 8)
        summary = self.first.sealed_dataset_store.seal_dataset(
            MarketDataRequest(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                start=start,
                end=start + timedelta(minutes=len(bars)),
            ),
            [bars],
            [_quality(bars)],
            development_end_exclusive=start + timedelta(minutes=5),
            observed_at=start + timedelta(minutes=9),
        )

        with self.assertRaisesRegex(ValueError, "sealed_dataset_hash_mismatch"):
            self.first.sealed_dataset_store.claim_test_partition(
                summary.dataset_id,
                claimant_id="experiment-wrong-hash",
                expected_dataset_hash="0" * 64,
            )
        claim = self.first.sealed_dataset_store.claim_test_partition(
            summary.dataset_id,
            claimant_id="experiment-winner",
            expected_dataset_hash=summary.dataset_hash,
        )
        with self.assertRaisesRegex(ValueError, "sealed_test_claim_invalid"):
            self.first.sealed_dataset_store.read_claimed_test_bars(
                summary.dataset_id,
                claim_token="wrong-token",
            )

        self.assertEqual(
            self.first.sealed_dataset_store.read_claimed_test_bars(
                summary.dataset_id,
                claim_token=claim.claim_token,
            ),
            bars[5:],
        )
        with self.assertRaisesRegex(ValueError, "sealed_test_claim_already_consumed"):
            self.first.sealed_dataset_store.read_claimed_test_bars(
                summary.dataset_id,
                claim_token=claim.claim_token,
            )
        with self.assertRaisesRegex(ValueError, "sealed_test_partition_consumed"):
            self.first.sealed_dataset_store.claim_test_partition(
                summary.dataset_id,
                claimant_id="experiment-second",
                expected_dataset_hash=summary.dataset_hash,
            )

    def test_two_store_instances_have_only_one_concurrent_claim_winner(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
                future=True,
            )
            public_metadata.create_all(engine)
            key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
            cipher = TenantSecretCipher(key)
            tenant = _context("owner-race", "race@example.com")
            stores = [
                PublicTenantStores.create(engine, tenant, cipher),
                PublicTenantStores.create(engine, tenant, cipher),
            ]
            start = datetime(2026, 8, 3, tzinfo=timezone.utc)
            bars = _bars(start, 8)
            summary = stores[0].sealed_dataset_store.seal_dataset(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=start + timedelta(minutes=len(bars)),
                ),
                [bars],
                [_quality(bars)],
                development_end_exclusive=start + timedelta(minutes=5),
                observed_at=start + timedelta(minutes=9),
            )
            barrier = Barrier(2)

            def synchronize_claim_writes(_connection) -> bool:
                barrier.wait()
                return True

            for store in stores:
                store.records.write_fence = synchronize_claim_writes

            def claim(index: int) -> str:
                try:
                    stores[index].sealed_dataset_store.claim_test_partition(
                        summary.dataset_id,
                        claimant_id=f"experiment-{index}",
                        expected_dataset_hash=summary.dataset_hash,
                    )
                except ValueError as error:
                    return str(error)
                return "claimed"

            try:
                with ThreadPoolExecutor(max_workers=2) as executor:
                    outcomes = list(executor.map(claim, range(2)))
            finally:
                engine.dispose()

        self.assertCountEqual(outcomes, ["claimed", "sealed_test_partition_consumed"])

    def test_concurrent_reads_consume_token_before_opening_test_partition(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.sqlite'}",
                connect_args={"check_same_thread": False},
                future=True,
            )
            public_metadata.create_all(engine)
            key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
            cipher = TenantSecretCipher(key)
            tenant = _context("owner-read-race", "read-race@example.com")
            stores = [
                PublicTenantStores.create(engine, tenant, cipher),
                PublicTenantStores.create(engine, tenant, cipher),
            ]
            start = datetime(2026, 8, 3, 1, tzinfo=timezone.utc)
            bars = _bars(start, 8)
            summary = stores[0].sealed_dataset_store.seal_dataset(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=start + timedelta(minutes=len(bars)),
                ),
                [bars],
                [_quality(bars)],
                development_end_exclusive=start + timedelta(minutes=5),
                observed_at=start + timedelta(minutes=9),
            )
            claim = stores[0].sealed_dataset_store.claim_test_partition(
                summary.dataset_id,
                claimant_id="experiment-read-race",
                expected_dataset_hash=summary.dataset_hash,
            )
            start_barrier = Barrier(2)
            partition_barrier = Barrier(2, timeout=1)
            count_lock = Lock()
            partition_reads = 0

            for tenant_stores in stores:
                store = tenant_stores.sealed_dataset_store
                original_read_partition = store._read_partition

                def counting_read_partition(
                    manifest,
                    partition_name,
                    chunk_ids,
                    *,
                    original=original_read_partition,
                ):
                    nonlocal partition_reads
                    if partition_name == "test":
                        with count_lock:
                            partition_reads += 1
                        try:
                            partition_barrier.wait()
                        except BrokenBarrierError:
                            pass
                    return original(manifest, partition_name, chunk_ids)

                store._read_partition = counting_read_partition  # type: ignore[method-assign]

            def read(index: int) -> tuple[str, object]:
                start_barrier.wait()
                try:
                    result = stores[index].sealed_dataset_store.read_claimed_test_bars(
                        summary.dataset_id,
                        claim_token=claim.claim_token,
                    )
                except ValueError as error:
                    return ("error", str(error))
                return ("read", result)

            try:
                with ThreadPoolExecutor(max_workers=2) as executor:
                    outcomes = list(executor.map(read, range(2)))
            finally:
                engine.dispose()

        self.assertEqual(partition_reads, 1)
        self.assertCountEqual(
            outcomes,
            [
                ("read", bars[5:]),
                ("error", "sealed_test_claim_already_consumed"),
            ],
        )

    def test_test_partition_read_failure_does_not_restore_consumed_token(self) -> None:
        start = datetime(2026, 8, 3, 2, tzinfo=timezone.utc)
        bars = _bars(start, 8)
        store = self.first.sealed_dataset_store
        summary = store.seal_dataset(
            MarketDataRequest(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                start=start,
                end=start + timedelta(minutes=len(bars)),
            ),
            [bars],
            [_quality(bars)],
            development_end_exclusive=start + timedelta(minutes=5),
            observed_at=start + timedelta(minutes=9),
        )
        claim = store.claim_test_partition(
            summary.dataset_id,
            claimant_id="experiment-failed-read",
            expected_dataset_hash=summary.dataset_hash,
        )
        manifest = store.manifests.get(summary.dataset_id)
        chunk_id = manifest.test_chunk_ids[0]
        chunk = store.chunks.get(chunk_id)
        drifted_bars = list(chunk.bars)
        drifted_bars[0] = {
            **drifted_bars[0],
            "close": drifted_bars[0]["close"] + 0.1,
        }
        store.chunks.put(
            chunk_id,
            replace(chunk, bars=tuple(drifted_bars)),
        )

        with self.assertRaisesRegex(ValueError, "sealed_dataset_chunk_hash_mismatch"):
            store.read_claimed_test_bars(
                summary.dataset_id,
                claim_token=claim.claim_token,
            )
        with self.assertRaisesRegex(ValueError, "sealed_test_claim_already_consumed"):
            store.read_claimed_test_bars(
                summary.dataset_id,
                claim_token=claim.claim_token,
            )

    def test_persisted_content_drift_fails_closed(self) -> None:
        start = datetime(2026, 8, 4, tzinfo=timezone.utc)
        bars = _bars(start, 8)
        summary = self.first.sealed_dataset_store.seal_dataset(
            MarketDataRequest(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                start=start,
                end=start + timedelta(minutes=len(bars)),
            ),
            [bars],
            [_quality(bars)],
            development_end_exclusive=start + timedelta(minutes=5),
            observed_at=start + timedelta(minutes=9),
        )
        manifest = self.first.sealed_dataset_store.manifests.get(summary.dataset_id)
        chunk_id = manifest.development_chunk_ids[0]
        chunk = self.first.sealed_dataset_store.chunks.get(chunk_id)
        drifted_bars = list(chunk.bars)
        drifted_bars[0] = {**drifted_bars[0], "close": drifted_bars[0]["close"] + 0.1}
        self.first.sealed_dataset_store.chunks.put(
            chunk_id,
            replace(chunk, bars=tuple(drifted_bars)),
        )

        with self.assertRaisesRegex(ValueError, "sealed_dataset_chunk_hash_mismatch"):
            self.first.sealed_dataset_store.get_integrity(summary.dataset_id)
        with self.assertRaisesRegex(ValueError, "sealed_dataset_chunk_hash_mismatch"):
            self.first.sealed_dataset_store.read_development_bars(summary.dataset_id)

    def test_persisted_manifest_tampering_fails_closed(self) -> None:
        start = datetime(2026, 8, 5, tzinfo=timezone.utc)
        bars = _bars(start, 8)
        summary = self.first.sealed_dataset_store.seal_dataset(
            MarketDataRequest(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                start=start,
                end=start + timedelta(minutes=len(bars)),
            ),
            [bars],
            [_quality(bars)],
            development_end_exclusive=start + timedelta(minutes=5),
            observed_at=start + timedelta(minutes=9),
        )
        manifest = self.first.sealed_dataset_store.manifests.get(summary.dataset_id)
        self.first.sealed_dataset_store.manifests.put(
            summary.dataset_id,
            replace(manifest, manifest_token="0" * 64),
        )

        with self.assertRaisesRegex(
            ValueError,
            "sealed_dataset_integrity_manifest_mismatch",
        ):
            self.first.sealed_dataset_store.get_summary(summary.dataset_id)
        with self.assertRaisesRegex(
            ValueError,
            "sealed_dataset_integrity_manifest_mismatch",
        ):
            self.first.sealed_dataset_store.get_integrity(summary.dataset_id)


if __name__ == "__main__":
    unittest.main()
