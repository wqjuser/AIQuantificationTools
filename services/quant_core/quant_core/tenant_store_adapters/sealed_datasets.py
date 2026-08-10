from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal

from quant_core.canonical import (
    canonical_data_hash,
    flatten_chunked_data_snapshot,
    normalize_snapshot_bar_chunks,
    normalize_snapshot_bars,
)
from quant_core.data_foundation import assess_chunked_market_data_quality
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.sealed_datasets import (
    SEALED_DATASET_HASH_VERSION,
    SealedDatasetIntegrity,
    SealedDatasetSummary,
    SealedTestClaim,
    _aware,
    _aware_datetime,
    _dataset_identity_hash,
    _normalize_large_bar_set,
    _timeframe_step,
    _token_hash,
    _verify_partition,
    _verify_summary_identity,
)

from .base import TenantModelRepository


_MAX_CHUNK_ROWS = 500


@dataclass(frozen=True)
class TenantSealedDatasetChunk:
    dataset_id: str
    partition_name: Literal["development", "test"]
    index: int
    start: str
    end_exclusive: str
    rows: int
    content_hash: str
    bars: tuple[dict[str, Any], ...]


@dataclass(frozen=True)
class TenantSealedDatasetManifest:
    hash_version: str
    summary: SealedDatasetSummary
    data_hash: str
    test_hash: str
    development_chunk_ids: tuple[str, ...]
    test_chunk_ids: tuple[str, ...]
    manifest_token: str
    content_version: int


@dataclass(frozen=True)
class TenantSealedTestClaimRecord:
    dataset_id: str
    claimant_id: str
    token_hash: str
    claimed_at: datetime
    consumed_at: datetime | None


class TenantSealedDatasetStore:
    """Tenant-record backed immutable sealed datasets."""

    def __init__(
        self,
        manifests: TenantModelRepository,
        chunks: TenantModelRepository,
        claims: TenantModelRepository,
    ) -> None:
        owner_ids = {
            manifests.records.owner_id,
            chunks.records.owner_id,
            claims.records.owner_id,
        }
        if len(owner_ids) != 1:
            raise ValueError("sealed_dataset_tenant_store_owner_mismatch")
        self.owner_id = owner_ids.pop()
        self.manifests = manifests
        self.chunks = chunks
        self.claims = claims

    def seal_dataset(
        self,
        request: MarketDataRequest,
        chunks: list[list[OHLCVBar]],
        page_qualities: list[DataQuality],
        *,
        development_end_exclusive: datetime,
        observed_at: datetime | None = None,
    ) -> SealedDatasetSummary:
        start = _aware_datetime(request.start, "sealed_dataset_start_required")
        end_exclusive = _aware_datetime(
            request.end,
            "sealed_dataset_end_exclusive_required",
        )
        development_end = _aware_datetime(
            development_end_exclusive,
            "sealed_dataset_development_end_required",
        )
        if not start < development_end < end_exclusive:
            raise ValueError("sealed_dataset_partition_range_invalid")

        quality = assess_chunked_market_data_quality(
            request,
            chunks,
            page_qualities,
            observed_at=observed_at,
        )
        if not quality.is_complete:
            codes = ",".join(
                str(issue.get("code") or "unknown")
                for issue in quality.issues
                if issue.get("severity") == "blocked"
            )
            raise ValueError(f"sealed_dataset_quality_blocked:{codes or 'unknown'}")

        snapshot = normalize_snapshot_bar_chunks(
            chunks,
            market=request.market,
            symbol=request.symbol,
            timeframe=request.timeframe,
        )
        normalized = flatten_chunked_data_snapshot(
            snapshot,
            market=request.market,
            symbol=request.symbol,
            timeframe=request.timeframe,
        )
        bars = [bar for chunk in chunks for bar in chunk]
        development = [bar for bar in bars if _aware(bar.timestamp) < development_end]
        test = [bar for bar in bars if _aware(bar.timestamp) >= development_end]
        if not development or not test:
            raise ValueError("sealed_dataset_partitions_must_be_nonempty")

        development_hash = canonical_data_hash(_normalize_large_bar_set(development))
        test_hash = canonical_data_hash(_normalize_large_bar_set(test))
        data_hash = str(snapshot["hash"])
        dataset_hash = _dataset_identity_hash(
            market=request.market,
            symbol=request.symbol,
            timeframe=request.timeframe,
            source=quality.origin_source or quality.source,
            adjustment_mode=quality.adjustment_mode,
            start=start,
            development_end_exclusive=development_end,
            end_exclusive=end_exclusive,
            rows=len(normalized),
            development_rows=len(development),
            withheld_rows=len(test),
            data_hash=data_hash,
            development_hash=development_hash,
            test_hash=test_hash,
        )
        dataset_id = f"sealed-{dataset_hash[:24]}"
        summary = SealedDatasetSummary(
            dataset_id=dataset_id,
            market=request.market,
            symbol=request.symbol,
            timeframe=request.timeframe,
            source=quality.origin_source or quality.source,
            adjustment_mode=quality.adjustment_mode,
            start=start,
            development_end_exclusive=development_end,
            end_exclusive=end_exclusive,
            rows=len(normalized),
            development_rows=len(development),
            withheld_rows=len(test),
            dataset_hash=dataset_hash,
            development_hash=development_hash,
        )
        development_chunks = self._partition_chunks(summary, "development", development)
        test_chunks = self._partition_chunks(summary, "test", test)
        manifest = TenantSealedDatasetManifest(
            hash_version=SEALED_DATASET_HASH_VERSION,
            summary=summary,
            data_hash=data_hash,
            test_hash=test_hash,
            development_chunk_ids=tuple(
                self._chunk_id(dataset_id, "development", item.index)
                for item in development_chunks
            ),
            test_chunk_ids=tuple(
                self._chunk_id(dataset_id, "test", item.index)
                for item in test_chunks
            ),
            manifest_token=dataset_hash,
            content_version=1,
        )

        for item in (*development_chunks, *test_chunks):
            chunk_id = self._chunk_id(dataset_id, item.partition_name, item.index)
            stored, _created = self.chunks.put_if_absent(chunk_id, item)
            if stored != item:
                raise ValueError("sealed_dataset_chunk_conflict")
        stored_manifest, _created = self.manifests.put_if_absent(dataset_id, manifest)
        if stored_manifest != manifest:
            raise ValueError("sealed_dataset_identity_collision")
        return summary

    def get_summary(self, dataset_id: str) -> SealedDatasetSummary | None:
        manifest = self._manifest(dataset_id)
        return manifest.summary if manifest is not None else None

    def get_integrity(self, dataset_id: str) -> SealedDatasetIntegrity | None:
        """Verify the public manifest and development evidence without opening holdout."""

        manifest = self._manifest(dataset_id)
        if manifest is None:
            return None
        development = self._read_partition(
            manifest,
            "development",
            manifest.development_chunk_ids,
        )
        _verify_partition(
            development,
            expected_rows=manifest.summary.development_rows,
            expected_hash=manifest.summary.development_hash,
            expected_start=manifest.summary.start,
            expected_end_exclusive=manifest.summary.development_end_exclusive,
        )
        return SealedDatasetIntegrity(
            dataset_id=manifest.summary.dataset_id,
            manifest_token=manifest.manifest_token,
            content_version=manifest.content_version,
        )

    def read_development_bars(self, dataset_id: str) -> list[OHLCVBar]:
        manifest = self._required_manifest(dataset_id)
        bars = self._read_partition(
            manifest,
            "development",
            manifest.development_chunk_ids,
        )
        _verify_partition(
            bars,
            expected_rows=manifest.summary.development_rows,
            expected_hash=manifest.summary.development_hash,
            expected_start=manifest.summary.start,
            expected_end_exclusive=manifest.summary.development_end_exclusive,
        )
        return bars

    def claim_test_partition(
        self,
        dataset_id: str,
        *,
        claimant_id: str,
        expected_dataset_hash: str,
    ) -> SealedTestClaim:
        normalized_claimant = str(claimant_id or "").strip()
        if not normalized_claimant:
            raise ValueError("sealed_test_claimant_required")
        manifest = self._required_manifest(dataset_id)
        if not secrets.compare_digest(
            manifest.summary.dataset_hash,
            str(expected_dataset_hash or ""),
        ):
            raise ValueError("sealed_dataset_hash_mismatch")
        token = secrets.token_urlsafe(32)
        claimed_at = datetime.now(timezone.utc)
        record = TenantSealedTestClaimRecord(
            dataset_id=manifest.summary.dataset_id,
            claimant_id=normalized_claimant,
            token_hash=_token_hash(token),
            claimed_at=claimed_at,
            consumed_at=None,
        )
        stored, created = self.claims.put_if_absent(manifest.summary.dataset_id, record)
        if not created:
            if not isinstance(stored, TenantSealedTestClaimRecord):
                raise ValueError("sealed_test_claim_invalid")
            raise ValueError("sealed_test_partition_consumed")
        return SealedTestClaim(
            dataset_id=manifest.summary.dataset_id,
            claimant_id=normalized_claimant,
            claim_token=token,
            claimed_at=claimed_at,
        )

    def read_claimed_test_bars(
        self,
        dataset_id: str,
        *,
        claim_token: str,
    ) -> list[OHLCVBar]:
        manifest = self._required_manifest(dataset_id)
        token_hash = _token_hash(str(claim_token or ""))
        record = self.claims.get(manifest.summary.dataset_id)
        if (
            not isinstance(record, TenantSealedTestClaimRecord)
            or record.dataset_id != manifest.summary.dataset_id
            or not secrets.compare_digest(record.token_hash, token_hash)
        ):
            raise ValueError("sealed_test_claim_invalid")
        if record.consumed_at is not None:
            raise ValueError("sealed_test_claim_already_consumed")
        consumed_at = datetime.now(timezone.utc)
        consumed = self.claims.compare_and_swap_field(
            manifest.summary.dataset_id,
            field="consumed_at",
            expected=None,
            value=TenantSealedTestClaimRecord(
                dataset_id=record.dataset_id,
                claimant_id=record.claimant_id,
                token_hash=record.token_hash,
                claimed_at=record.claimed_at,
                consumed_at=consumed_at,
            ),
        )
        if not consumed:
            raise ValueError("sealed_test_claim_already_consumed")
        bars = self._read_partition(manifest, "test", manifest.test_chunk_ids)
        _verify_partition(
            bars,
            expected_rows=manifest.summary.withheld_rows,
            expected_hash=manifest.test_hash,
            expected_start=manifest.summary.development_end_exclusive,
            expected_end_exclusive=manifest.summary.end_exclusive,
        )
        return bars

    def _manifest(self, dataset_id: str) -> TenantSealedDatasetManifest | None:
        normalized_id = str(dataset_id or "").strip()
        if not normalized_id:
            return None
        value = self.manifests.get(normalized_id)
        if value is None:
            return None
        if not isinstance(value, TenantSealedDatasetManifest):
            raise ValueError("sealed_dataset_manifest_invalid")
        summary = SealedDatasetSummary.from_payload(value.summary.to_payload())
        if summary.dataset_id != normalized_id:
            raise ValueError("sealed_dataset_manifest_id_mismatch")
        if value.hash_version != SEALED_DATASET_HASH_VERSION:
            raise ValueError("sealed_dataset_manifest_hash_version_invalid")
        _verify_summary_identity(
            summary,
            test_hash=value.test_hash,
            data_hash=value.data_hash,
        )
        if not secrets.compare_digest(value.manifest_token, summary.dataset_hash):
            raise ValueError("sealed_dataset_integrity_manifest_mismatch")
        if (
            isinstance(value.content_version, bool)
            or not isinstance(value.content_version, int)
            or value.content_version < 1
        ):
            raise ValueError("sealed_dataset_integrity_version_invalid")
        self._verify_chunk_ids(value)
        return value

    def _required_manifest(self, dataset_id: str) -> TenantSealedDatasetManifest:
        manifest = self._manifest(dataset_id)
        if manifest is None:
            raise ValueError("sealed_dataset_not_found")
        return manifest

    def _partition_chunks(
        self,
        summary: SealedDatasetSummary,
        partition_name: Literal["development", "test"],
        bars: list[OHLCVBar],
    ) -> list[TenantSealedDatasetChunk]:
        step = _timeframe_step(summary.timeframe)
        result: list[TenantSealedDatasetChunk] = []
        for index, offset in enumerate(range(0, len(bars), _MAX_CHUNK_ROWS)):
            normalized = normalize_snapshot_bars(bars[offset : offset + _MAX_CHUNK_ROWS])
            result.append(
                TenantSealedDatasetChunk(
                    dataset_id=summary.dataset_id,
                    partition_name=partition_name,
                    index=index,
                    start=str(normalized[0]["timestamp"]),
                    end_exclusive=(
                        datetime.fromisoformat(str(normalized[-1]["timestamp"])) + step
                    ).isoformat(),
                    rows=len(normalized),
                    content_hash=canonical_data_hash(normalized),
                    bars=tuple(normalized),
                )
            )
        return result

    def _read_partition(
        self,
        manifest: TenantSealedDatasetManifest,
        partition_name: Literal["development", "test"],
        chunk_ids: tuple[str, ...],
    ) -> list[OHLCVBar]:
        result: list[OHLCVBar] = []
        step = _timeframe_step(manifest.summary.timeframe)
        for expected_index, chunk_id in enumerate(chunk_ids):
            value = self.chunks.get(chunk_id)
            if value is None:
                raise ValueError("sealed_dataset_chunk_missing")
            if not isinstance(value, TenantSealedDatasetChunk):
                raise ValueError("sealed_dataset_chunk_invalid")
            if (
                value.dataset_id != manifest.summary.dataset_id
                or value.partition_name != partition_name
                or value.index != expected_index
                or chunk_id
                != self._chunk_id(value.dataset_id, partition_name, expected_index)
            ):
                raise ValueError("sealed_dataset_chunk_identity_mismatch")
            if (
                isinstance(value.rows, bool)
                or not isinstance(value.rows, int)
                or value.rows < 1
                or value.rows > _MAX_CHUNK_ROWS
                or len(value.bars) != value.rows
            ):
                raise ValueError("sealed_dataset_chunk_rows_invalid")
            normalized = normalize_snapshot_bars(list(value.bars))
            if normalized != list(value.bars):
                raise ValueError("sealed_dataset_chunk_not_canonical")
            if not secrets.compare_digest(
                canonical_data_hash(normalized),
                value.content_hash,
            ):
                raise ValueError("sealed_dataset_chunk_hash_mismatch")
            if (
                value.start != str(normalized[0]["timestamp"])
                or value.end_exclusive
                != (
                    datetime.fromisoformat(str(normalized[-1]["timestamp"])) + step
                ).isoformat()
            ):
                raise ValueError("sealed_dataset_chunk_range_mismatch")
            result.extend(
                OHLCVBar(
                    market=manifest.summary.market,  # type: ignore[arg-type]
                    symbol=manifest.summary.symbol,
                    timeframe=manifest.summary.timeframe,  # type: ignore[arg-type]
                    timestamp=datetime.fromisoformat(str(bar["timestamp"])),
                    open=float(bar["open"]),
                    high=float(bar["high"]),
                    low=float(bar["low"]),
                    close=float(bar["close"]),
                    volume=float(bar["volume"]),
                )
                for bar in normalized
            )
        return result

    def _verify_chunk_ids(self, manifest: TenantSealedDatasetManifest) -> None:
        expected = (
            ("development", manifest.development_chunk_ids, manifest.summary.development_rows),
            ("test", manifest.test_chunk_ids, manifest.summary.withheld_rows),
        )
        all_ids: list[str] = []
        for partition_name, chunk_ids, rows in expected:
            expected_count = (rows + _MAX_CHUNK_ROWS - 1) // _MAX_CHUNK_ROWS
            if len(chunk_ids) != expected_count or chunk_ids != tuple(
                self._chunk_id(manifest.summary.dataset_id, partition_name, index)
                for index in range(expected_count)
            ):
                raise ValueError("sealed_dataset_manifest_chunks_invalid")
            all_ids.extend(chunk_ids)
        if len(set(all_ids)) != len(all_ids):
            raise ValueError("sealed_dataset_manifest_chunks_invalid")

    @staticmethod
    def _chunk_id(dataset_id: str, partition_name: str, index: int) -> str:
        return f"{dataset_id}:{partition_name}:{index:06d}"
