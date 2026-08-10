from __future__ import annotations

import hashlib
import secrets
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from quant_core.canonical import (
    canonical_data_hash,
    canonical_sha256,
    canonical_snapshot_id,
    flatten_chunked_data_snapshot,
    normalize_snapshot_bar_chunks,
    normalize_snapshot_bars,
)
from quant_core.data_foundation import assess_chunked_market_data_quality
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar


SEALED_DATASET_HASH_VERSION = "aiqt-sealed-v1"
FORMAL_MINIMUM_BTC_1M_ROWS = 90 * 24 * 60


@dataclass(frozen=True)
class SealedDatasetSummary:
    dataset_id: str
    market: str
    symbol: str
    timeframe: str
    source: str
    adjustment_mode: str
    start: datetime
    development_end_exclusive: datetime
    end_exclusive: datetime
    rows: int
    development_rows: int
    withheld_rows: int
    dataset_hash: str
    development_hash: str

    def to_payload(self) -> dict[str, object]:
        return {
            "datasetId": self.dataset_id,
            "market": self.market,
            "symbol": self.symbol,
            "timeframe": self.timeframe,
            "source": self.source,
            "adjustmentMode": self.adjustment_mode,
            "start": self.start.isoformat(),
            "developmentEndExclusive": self.development_end_exclusive.isoformat(),
            "endExclusive": self.end_exclusive.isoformat(),
            "rows": self.rows,
            "developmentRows": self.development_rows,
            "withheldRows": self.withheld_rows,
            "datasetHash": self.dataset_hash,
            "developmentHash": self.development_hash,
        }

    @classmethod
    def from_payload(cls, value: object) -> "SealedDatasetSummary":
        if not isinstance(value, dict):
            raise ValueError("sealed_dataset_summary_must_be_object")
        required = {
            "datasetId",
            "market",
            "symbol",
            "timeframe",
            "source",
            "adjustmentMode",
            "start",
            "developmentEndExclusive",
            "endExclusive",
            "rows",
            "developmentRows",
            "withheldRows",
            "datasetHash",
            "developmentHash",
        }
        if set(value) != required:
            raise ValueError("sealed_dataset_summary_fields_invalid")
        dataset_hash = _hash_string(value.get("datasetHash"), "sealed_dataset_hash_invalid")
        development_hash = _hash_string(
            value.get("developmentHash"),
            "sealed_dataset_development_hash_invalid",
        )
        dataset_id = str(value.get("datasetId") or "").strip()
        if dataset_id != f"sealed-{dataset_hash[:24]}":
            raise ValueError("sealed_dataset_id_invalid")
        rows = _positive_int(value.get("rows"), "sealed_dataset_rows_invalid")
        development_rows = _positive_int(
            value.get("developmentRows"),
            "sealed_dataset_development_rows_invalid",
        )
        withheld_rows = _positive_int(
            value.get("withheldRows"),
            "sealed_dataset_withheld_rows_invalid",
        )
        if rows != development_rows + withheld_rows:
            raise ValueError("sealed_dataset_partition_rows_invalid")
        start = _payload_datetime(value.get("start"), "sealed_dataset_start_invalid")
        development_end = _payload_datetime(
            value.get("developmentEndExclusive"),
            "sealed_dataset_development_end_invalid",
        )
        end_exclusive = _payload_datetime(
            value.get("endExclusive"),
            "sealed_dataset_end_exclusive_invalid",
        )
        if not start < development_end < end_exclusive:
            raise ValueError("sealed_dataset_partition_range_invalid")
        market = str(value.get("market") or "").strip()
        symbol = str(value.get("symbol") or "").strip()
        timeframe = str(value.get("timeframe") or "").strip()
        source = str(value.get("source") or "").strip()
        adjustment_mode = str(value.get("adjustmentMode") or "").strip()
        if not all((market, symbol, timeframe, source, adjustment_mode)):
            raise ValueError("sealed_dataset_summary_identity_required")
        return cls(
            dataset_id=dataset_id,
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            source=source,
            adjustment_mode=adjustment_mode,
            start=start,
            development_end_exclusive=development_end,
            end_exclusive=end_exclusive,
            rows=rows,
            development_rows=development_rows,
            withheld_rows=withheld_rows,
            dataset_hash=dataset_hash,
            development_hash=development_hash,
        )


@dataclass(frozen=True)
class SealedTestClaim:
    dataset_id: str
    claimant_id: str
    claim_token: str
    claimed_at: datetime


@dataclass(frozen=True)
class SealedDatasetIntegrity:
    """Cheap, persistent identity for an immutable sealed dataset."""

    dataset_id: str
    manifest_token: str
    content_version: int


def sealed_dataset_window_from_payload(
    value: object,
) -> tuple[datetime, datetime, datetime] | None:
    if value is None:
        return None
    if not isinstance(value, dict) or set(value) != {
        "start",
        "developmentEndExclusive",
        "endExclusive",
    }:
        raise ValueError("sealed_dataset_window_fields_invalid")
    start = _payload_datetime(value.get("start"), "sealed_dataset_start_invalid")
    development_end = _payload_datetime(
        value.get("developmentEndExclusive"),
        "sealed_dataset_development_end_invalid",
    )
    end_exclusive = _payload_datetime(
        value.get("endExclusive"),
        "sealed_dataset_end_exclusive_invalid",
    )
    if not start < development_end < end_exclusive:
        raise ValueError("sealed_dataset_partition_range_invalid")
    return start, development_end, end_exclusive


def sealed_research_snapshot_payload(
    summary: SealedDatasetSummary,
    *,
    warnings: list[str] | None = None,
) -> dict[str, object]:
    normalized: dict[str, Any] = {
        "source": summary.source,
        "isComplete": True,
        "warnings": list(warnings or []),
        "rows": summary.development_rows,
        "start": summary.start.isoformat(),
        "endExclusive": summary.development_end_exclusive.isoformat(),
        "hashVersion": SEALED_DATASET_HASH_VERSION,
        "hash": summary.development_hash,
        "snapshotHash": canonical_snapshot_id(
            market=summary.market,
            symbol=summary.symbol,
            timeframe=summary.timeframe,
            canonical_data_hash=summary.development_hash,
        ),
        "adjustmentMode": summary.adjustment_mode,
        "coverage": {
            "actualRows": summary.development_rows,
            "expectedRows": summary.development_rows,
            "gapCount": 0,
            "ratio": 1.0,
        },
        "qualityIssues": [],
        "sealedDataset": summary.to_payload(),
    }
    return normalized


def normalize_sealed_research_snapshot(
    value: object,
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("sealed_research_snapshot_must_be_object")
    if str(value.get("hashVersion") or "") != SEALED_DATASET_HASH_VERSION:
        raise ValueError("sealed_research_snapshot_hash_version_invalid")
    if "bars" in value:
        raise ValueError("sealed_research_snapshot_bars_forbidden")
    summary = SealedDatasetSummary.from_payload(value.get("sealedDataset"))
    if (summary.market, summary.symbol, summary.timeframe) != (
        market,
        symbol,
        timeframe,
    ):
        raise ValueError("sealed_research_snapshot_context_mismatch")
    if str(value.get("hash") or "") != summary.development_hash:
        raise ValueError("sealed_research_snapshot_hash_mismatch")
    if int(value.get("rows", -1)) != summary.development_rows:
        raise ValueError("sealed_research_snapshot_rows_mismatch")
    if str(value.get("start") or "") != summary.start.isoformat():
        raise ValueError("sealed_research_snapshot_start_mismatch")
    if str(value.get("endExclusive") or "") != summary.development_end_exclusive.isoformat():
        raise ValueError("sealed_research_snapshot_end_mismatch")
    expected_snapshot_hash = canonical_snapshot_id(
        market=market,
        symbol=symbol,
        timeframe=timeframe,
        canonical_data_hash=summary.development_hash,
    )
    supplied_snapshot_hash = str(value.get("snapshotHash") or "")
    if supplied_snapshot_hash and supplied_snapshot_hash != expected_snapshot_hash:
        raise ValueError("sealed_research_snapshot_identity_mismatch")
    warnings = value.get("warnings")
    coverage = value.get("coverage")
    issues = value.get("qualityIssues")
    normalized: dict[str, Any] = {
        "source": summary.source,
        "isComplete": bool(value.get("isComplete", True)),
        "warnings": [str(item) for item in warnings] if isinstance(warnings, list) else [],
        "rows": summary.development_rows,
        "start": summary.start.isoformat(),
        "endExclusive": summary.development_end_exclusive.isoformat(),
        "hashVersion": SEALED_DATASET_HASH_VERSION,
        "hash": summary.development_hash,
        "snapshotHash": expected_snapshot_hash,
        "adjustmentMode": summary.adjustment_mode,
        "coverage": dict(coverage) if isinstance(coverage, dict) else {},
        "qualityIssues": [dict(item) for item in issues if isinstance(item, dict)]
        if isinstance(issues, list)
        else [],
        "sealedDataset": summary.to_payload(),
    }
    has_pre_roll_version = "preRollVersion" in value
    has_scoring_window = "scoringWindow" in value
    if has_pre_roll_version or has_scoring_window:
        pre_roll_version = value.get("preRollVersion")
        scoring_window = value.get("scoringWindow")
        if (
            not has_pre_roll_version
            or not has_scoring_window
            or not isinstance(pre_roll_version, str)
            or not isinstance(scoring_window, dict)
        ):
            raise ValueError("sealed_research_snapshot_scoring_invalid")
        normalized["preRollVersion"] = pre_roll_version
        normalized["scoringWindow"] = dict(scoring_window)
    return normalized


class SealedDevelopmentBarSource:
    """Fetch and freeze an explicit half-open market window in bounded pages."""

    def __init__(
        self,
        *,
        store: "SealedDatasetStore",
        adapter: object,
        page_size: int = 500,
        minimum_rows: int = 1,
    ) -> None:
        self.store = store
        self.adapter = adapter
        self.page_size = max(1, min(int(page_size), 500))
        self.minimum_rows = max(1, int(minimum_rows))

    def seal(
        self,
        request: MarketDataRequest,
        *,
        development_end_exclusive: datetime,
        observed_at: datetime | None = None,
    ) -> SealedDatasetSummary:
        start = _aware_datetime(request.start, "sealed_dataset_start_required")
        end_exclusive = _aware_datetime(request.end, "sealed_dataset_end_exclusive_required")
        if end_exclusive <= start:
            raise ValueError("sealed_dataset_window_invalid")
        step = _timeframe_step(request.timeframe)
        duration = end_exclusive - start
        if duration % step:
            raise ValueError("sealed_dataset_window_must_align_to_timeframe")
        total_rows = int(duration // step)
        if total_rows < self.minimum_rows:
            raise ValueError(
                f"sealed_dataset_minimum_rows_required:{self.minimum_rows}"
            )

        reverse_chunks: list[list[OHLCVBar]] = []
        reverse_qualities: list[DataQuality] = []
        cursor_end = end_exclusive
        while cursor_end > start:
            remaining_rows = int((cursor_end - start) // step)
            page_rows = min(self.page_size, remaining_rows)
            page_start = cursor_end - step * page_rows
            page_end_inclusive = cursor_end - step
            page_request = MarketDataRequest(
                market=request.market,
                symbol=request.symbol,
                timeframe=request.timeframe,
                start=page_start,
                end=page_end_inclusive,
            )
            page, quality = self.adapter.fetch_ohlcv(  # type: ignore[attr-defined]
                page_request,
                limit=page_rows,
            )
            bounded = [
                bar
                for bar in page
                if page_start <= _aware(bar.timestamp) < cursor_end
            ]
            if len(bounded) != page_rows:
                raise ValueError("sealed_dataset_page_incomplete")
            if any(
                _aware(current.timestamp) <= _aware(previous.timestamp)
                for previous, current in zip(bounded, bounded[1:])
            ):
                raise ValueError("sealed_dataset_page_timestamp_disorder")
            reverse_chunks.append(bounded)
            reverse_qualities.append(
                DataQuality(
                    source=quality.source,
                    origin_source=quality.origin_source,
                    is_complete=quality.is_complete,
                    warnings=list(quality.warnings),
                    rows=len(bounded),
                    observed_at=quality.observed_at,
                    market_time=quality.market_time,
                    calendar_id=quality.calendar_id,
                    adjustment_mode=quality.adjustment_mode,
                    freshness=quality.freshness,
                    coverage=dict(quality.coverage),
                    canonical_hash=quality.canonical_hash,
                    issues=[dict(issue) for issue in quality.issues],
                )
            )
            cursor_end = page_start

        return self.store.seal_dataset(
            request,
            list(reversed(reverse_chunks)),
            list(reversed(reverse_qualities)),
            development_end_exclusive=development_end_exclusive,
            observed_at=observed_at,
        )


class SealedDatasetStore:
    """Immutable local OHLCV datasets with an access-controlled test partition."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.execute("pragma foreign_keys = on")
        return connection

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.executescript(
                """
                create table if not exists sealed_datasets (
                    dataset_id text primary key,
                    hash_version text not null,
                    market text not null,
                    symbol text not null,
                    timeframe text not null,
                    source text not null,
                    adjustment_mode text not null,
                    start text not null,
                    development_end_exclusive text not null,
                    end_exclusive text not null,
                    rows integer not null,
                    development_rows integer not null,
                    withheld_rows integer not null,
                    dataset_hash text not null unique,
                    data_hash text not null,
                    development_hash text not null,
                    test_hash text not null,
                    created_at text not null
                );
                create table if not exists sealed_dataset_bars (
                    dataset_id text not null references sealed_datasets(dataset_id),
                    partition_name text not null check (partition_name in ('development', 'test')),
                    timestamp text not null,
                    open real not null,
                    high real not null,
                    low real not null,
                    close real not null,
                    volume real not null,
                    primary key (dataset_id, timestamp)
                );
                create index if not exists sealed_dataset_bars_partition
                    on sealed_dataset_bars(dataset_id, partition_name, timestamp);
                create table if not exists sealed_test_claims (
                    dataset_id text primary key references sealed_datasets(dataset_id),
                    claimant_id text not null,
                    token_hash text not null unique,
                    claimed_at text not null,
                    consumed_at text
                );
                create table if not exists sealed_dataset_integrity (
                    dataset_id text primary key references sealed_datasets(dataset_id),
                    manifest_token text not null,
                    content_version integer not null check (content_version >= 1)
                );
                insert or ignore into sealed_dataset_integrity (
                    dataset_id, manifest_token, content_version
                )
                select dataset_id, dataset_hash, 1 from sealed_datasets;
                create trigger if not exists sealed_dataset_bars_integrity_insert
                after insert on sealed_dataset_bars
                when exists (
                    select 1 from sealed_dataset_integrity
                    where dataset_id = new.dataset_id
                )
                begin
                    update sealed_dataset_integrity
                    set content_version = content_version + 1
                    where dataset_id = new.dataset_id;
                end;
                create trigger if not exists sealed_dataset_bars_integrity_update
                after update on sealed_dataset_bars
                begin
                    update sealed_dataset_integrity
                    set content_version = content_version + 1
                    where dataset_id = old.dataset_id;
                    update sealed_dataset_integrity
                    set content_version = content_version + 1
                    where dataset_id = new.dataset_id
                      and new.dataset_id != old.dataset_id;
                end;
                create trigger if not exists sealed_dataset_bars_integrity_delete
                after delete on sealed_dataset_bars
                begin
                    update sealed_dataset_integrity
                    set content_version = content_version + 1
                    where dataset_id = old.dataset_id;
                end;
                create trigger if not exists sealed_dataset_manifest_integrity_update
                after update on sealed_datasets
                begin
                    update sealed_dataset_integrity
                    set content_version = content_version + 1
                    where dataset_id = old.dataset_id;
                    update sealed_dataset_integrity
                    set content_version = content_version + 1
                    where dataset_id = new.dataset_id
                      and new.dataset_id != old.dataset_id;
                end;
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute("pragma table_info(sealed_datasets)").fetchall()
            }
            if "data_hash" not in columns:
                connection.execute("alter table sealed_datasets add column data_hash text")
            connection.commit()
        finally:
            connection.close()

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
        end_exclusive = _aware_datetime(request.end, "sealed_dataset_end_exclusive_required")
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
        self._insert_dataset(
            summary,
            data_hash=data_hash,
            test_hash=test_hash,
            bars=bars,
            created_at=observed_at,
        )
        return summary

    def get_summary(self, dataset_id: str) -> SealedDatasetSummary | None:
        normalized_id = str(dataset_id or "").strip()
        if not normalized_id:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select dataset_id, market, symbol, timeframe, source, adjustment_mode,
                       start, development_end_exclusive, end_exclusive, rows,
                       development_rows, withheld_rows, dataset_hash, development_hash,
                       test_hash, data_hash
                from sealed_datasets
                where dataset_id = ? and hash_version = ?
                """,
                (normalized_id, SEALED_DATASET_HASH_VERSION),
            ).fetchone()
        finally:
            connection.close()
        if row is None:
            return None
        summary = _summary_from_row(row)
        _verify_summary_identity(
            summary,
            test_hash=str(row[14]),
            data_hash=str(row[15]),
        )
        return summary

    def get_integrity(self, dataset_id: str) -> SealedDatasetIntegrity | None:
        """Return a constant-size token that changes after any dataset content write."""

        normalized_id = str(dataset_id or "").strip()
        if not normalized_id:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select d.dataset_id, d.market, d.symbol, d.timeframe, d.source,
                       d.adjustment_mode, d.start, d.development_end_exclusive,
                       d.end_exclusive, d.rows, d.development_rows,
                       d.withheld_rows, d.dataset_hash, d.development_hash,
                       d.test_hash, d.data_hash, i.manifest_token,
                       i.content_version
                from sealed_datasets d
                left join sealed_dataset_integrity i
                  on i.dataset_id = d.dataset_id
                where d.dataset_id = ? and d.hash_version = ?
                """,
                (normalized_id, SEALED_DATASET_HASH_VERSION),
            ).fetchone()
        finally:
            connection.close()
        if row is None:
            return None
        summary = _summary_from_row(row)
        _verify_summary_identity(
            summary,
            test_hash=str(row[14]),
            data_hash=str(row[15]),
        )
        manifest_token = str(row[16] or "")
        content_version = row[17]
        if not secrets.compare_digest(manifest_token, summary.dataset_hash):
            raise ValueError("sealed_dataset_integrity_manifest_mismatch")
        if (
            isinstance(content_version, bool)
            or not isinstance(content_version, int)
            or content_version < 1
        ):
            raise ValueError("sealed_dataset_integrity_version_invalid")
        return SealedDatasetIntegrity(
            dataset_id=summary.dataset_id,
            manifest_token=manifest_token,
            content_version=content_version,
        )

    def read_development_bars(self, dataset_id: str) -> list[OHLCVBar]:
        summary = self._required_summary(dataset_id)
        bars = self._read_partition(summary, "development")
        _verify_partition(
            bars,
            expected_rows=summary.development_rows,
            expected_hash=summary.development_hash,
            expected_start=summary.start,
            expected_end_exclusive=summary.development_end_exclusive,
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
        summary = self._required_summary(dataset_id)
        if not secrets.compare_digest(summary.dataset_hash, str(expected_dataset_hash or "")):
            raise ValueError("sealed_dataset_hash_mismatch")
        token = secrets.token_urlsafe(32)
        token_hash = _token_hash(token)
        claimed_at = datetime.now(timezone.utc)
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            existing = connection.execute(
                "select claimant_id, consumed_at from sealed_test_claims where dataset_id = ?",
                (summary.dataset_id,),
            ).fetchone()
            if existing is not None:
                raise ValueError("sealed_test_partition_consumed")
            connection.execute(
                """
                insert into sealed_test_claims (
                    dataset_id, claimant_id, token_hash, claimed_at, consumed_at
                ) values (?, ?, ?, ?, null)
                """,
                (
                    summary.dataset_id,
                    normalized_claimant,
                    token_hash,
                    claimed_at.isoformat(),
                ),
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()
        return SealedTestClaim(
            dataset_id=summary.dataset_id,
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
        summary = self._required_summary(dataset_id)
        token_hash = _token_hash(str(claim_token or ""))
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            claim = connection.execute(
                """
                select consumed_at from sealed_test_claims
                where dataset_id = ? and token_hash = ?
                """,
                (summary.dataset_id, token_hash),
            ).fetchone()
            if claim is None:
                raise ValueError("sealed_test_claim_invalid")
            if claim[0] is not None:
                raise ValueError("sealed_test_claim_already_consumed")
            rows = connection.execute(
                """
                select timestamp, open, high, low, close, volume
                from sealed_dataset_bars
                where dataset_id = ? and partition_name = 'test'
                order by julianday(timestamp) asc
                """,
                (summary.dataset_id,),
            ).fetchall()
            bars = [_stored_row_to_bar(summary, row) for row in rows]
            test_hash = str(
                connection.execute(
                    "select test_hash from sealed_datasets where dataset_id = ?",
                    (summary.dataset_id,),
                ).fetchone()[0]
            )
            _verify_partition(
                bars,
                expected_rows=summary.withheld_rows,
                expected_hash=test_hash,
                expected_start=summary.development_end_exclusive,
                expected_end_exclusive=summary.end_exclusive,
            )
            changed = connection.execute(
                """
                update sealed_test_claims
                set consumed_at = ?
                where dataset_id = ? and token_hash = ? and consumed_at is null
                """,
                (datetime.now(timezone.utc).isoformat(), summary.dataset_id, token_hash),
            ).rowcount
            if changed != 1:
                raise ValueError("sealed_test_claim_already_consumed")
            connection.commit()
            return bars
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _required_summary(self, dataset_id: str) -> SealedDatasetSummary:
        summary = self.get_summary(dataset_id)
        if summary is None:
            raise ValueError("sealed_dataset_not_found")
        return summary

    def _insert_dataset(
        self,
        summary: SealedDatasetSummary,
        *,
        data_hash: str,
        test_hash: str,
        bars: list[OHLCVBar],
        created_at: datetime | None,
    ) -> None:
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            existing = connection.execute(
                "select dataset_hash from sealed_datasets where dataset_id = ?",
                (summary.dataset_id,),
            ).fetchone()
            if existing is not None:
                if str(existing[0]) != summary.dataset_hash:
                    raise ValueError("sealed_dataset_identity_collision")
                connection.rollback()
                return
            connection.execute(
                """
                insert into sealed_datasets (
                    dataset_id, hash_version, market, symbol, timeframe, source,
                    adjustment_mode, start, development_end_exclusive, end_exclusive,
                    rows, development_rows, withheld_rows, dataset_hash,
                    data_hash, development_hash, test_hash, created_at
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    summary.dataset_id,
                    SEALED_DATASET_HASH_VERSION,
                    summary.market,
                    summary.symbol,
                    summary.timeframe,
                    summary.source,
                    summary.adjustment_mode,
                    summary.start.isoformat(),
                    summary.development_end_exclusive.isoformat(),
                    summary.end_exclusive.isoformat(),
                    summary.rows,
                    summary.development_rows,
                    summary.withheld_rows,
                    summary.dataset_hash,
                    data_hash,
                    summary.development_hash,
                    test_hash,
                    _aware(created_at or datetime.now(timezone.utc)).isoformat(),
                ),
            )
            connection.executemany(
                """
                insert into sealed_dataset_bars (
                    dataset_id, partition_name, timestamp, open, high, low, close, volume
                ) values (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        summary.dataset_id,
                        "development"
                        if _aware(bar.timestamp) < summary.development_end_exclusive
                        else "test",
                        _aware(bar.timestamp).isoformat(),
                        bar.open,
                        bar.high,
                        bar.low,
                        bar.close,
                        bar.volume,
                    )
                    for bar in bars
                ],
            )
            connection.execute(
                """
                insert into sealed_dataset_integrity (
                    dataset_id, manifest_token, content_version
                ) values (?, ?, 1)
                """,
                (summary.dataset_id, summary.dataset_hash),
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _read_partition(
        self,
        summary: SealedDatasetSummary,
        partition_name: str,
    ) -> list[OHLCVBar]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select timestamp, open, high, low, close, volume
                from sealed_dataset_bars
                where dataset_id = ? and partition_name = ?
                order by julianday(timestamp) asc
                """,
                (summary.dataset_id, partition_name),
            ).fetchall()
        finally:
            connection.close()
        return [_stored_row_to_bar(summary, row) for row in rows]


def _summary_from_row(row: tuple[object, ...]) -> SealedDatasetSummary:
    return SealedDatasetSummary(
        dataset_id=str(row[0]),
        market=str(row[1]),
        symbol=str(row[2]),
        timeframe=str(row[3]),
        source=str(row[4]),
        adjustment_mode=str(row[5]),
        start=_stored_datetime(row[6]),
        development_end_exclusive=_stored_datetime(row[7]),
        end_exclusive=_stored_datetime(row[8]),
        rows=int(row[9]),
        development_rows=int(row[10]),
        withheld_rows=int(row[11]),
        dataset_hash=str(row[12]),
        development_hash=str(row[13]),
    )


def _verify_summary_identity(
    summary: SealedDatasetSummary,
    *,
    test_hash: str,
    data_hash: str,
) -> None:
    SealedDatasetSummary.from_payload(summary.to_payload())
    normalized_test_hash = _hash_string(test_hash, "sealed_dataset_test_hash_invalid")
    normalized_data_hash = _hash_string(data_hash, "sealed_dataset_data_hash_invalid")
    step = _timeframe_step(summary.timeframe)
    if (
        (summary.end_exclusive - summary.start) % step
        or (summary.development_end_exclusive - summary.start) % step
        or int((summary.end_exclusive - summary.start) // step) != summary.rows
        or int((summary.development_end_exclusive - summary.start) // step)
        != summary.development_rows
    ):
        raise ValueError("sealed_dataset_summary_window_rows_mismatch")
    expected = _dataset_identity_hash(
        market=summary.market,
        symbol=summary.symbol,
        timeframe=summary.timeframe,
        source=summary.source,
        adjustment_mode=summary.adjustment_mode,
        start=summary.start,
        development_end_exclusive=summary.development_end_exclusive,
        end_exclusive=summary.end_exclusive,
        rows=summary.rows,
        development_rows=summary.development_rows,
        withheld_rows=summary.withheld_rows,
        data_hash=normalized_data_hash,
        development_hash=summary.development_hash,
        test_hash=normalized_test_hash,
    )
    if not secrets.compare_digest(expected, summary.dataset_hash):
        raise ValueError("sealed_dataset_manifest_hash_mismatch")


def _dataset_identity_hash(
    *,
    market: str,
    symbol: str,
    timeframe: str,
    source: str,
    adjustment_mode: str,
    start: datetime,
    development_end_exclusive: datetime,
    end_exclusive: datetime,
    rows: int,
    development_rows: int,
    withheld_rows: int,
    data_hash: str,
    development_hash: str,
    test_hash: str,
) -> str:
    return canonical_sha256(
        {
            "hashVersion": SEALED_DATASET_HASH_VERSION,
            "market": market,
            "symbol": symbol,
            "timeframe": timeframe,
            "source": source,
            "adjustmentMode": adjustment_mode,
            "start": start.isoformat(),
            "developmentEndExclusive": development_end_exclusive.isoformat(),
            "endExclusive": end_exclusive.isoformat(),
            "rows": rows,
            "developmentRows": development_rows,
            "withheldRows": withheld_rows,
            "dataHash": data_hash,
            "developmentHash": development_hash,
            "testHash": test_hash,
        }
    )


def _stored_row_to_bar(
    summary: SealedDatasetSummary,
    row: tuple[object, ...],
) -> OHLCVBar:
    return OHLCVBar(
        market=summary.market,  # type: ignore[arg-type]
        symbol=summary.symbol,
        timeframe=summary.timeframe,  # type: ignore[arg-type]
        timestamp=_stored_datetime(row[0]),
        open=float(row[1]),
        high=float(row[2]),
        low=float(row[3]),
        close=float(row[4]),
        volume=float(row[5]),
    )


def _verify_partition(
    bars: list[OHLCVBar],
    *,
    expected_rows: int,
    expected_hash: str,
    expected_start: datetime,
    expected_end_exclusive: datetime,
) -> None:
    if len(bars) != expected_rows:
        raise ValueError("sealed_dataset_partition_rows_mismatch")
    if not bars or _aware(bars[0].timestamp) != expected_start:
        raise ValueError("sealed_dataset_partition_start_mismatch")
    step = _timeframe_step(bars[0].timeframe)
    if _aware(bars[-1].timestamp) + step != expected_end_exclusive:
        raise ValueError("sealed_dataset_partition_end_mismatch")
    if any(
        _aware(current.timestamp) - _aware(previous.timestamp) != step
        for previous, current in zip(bars, bars[1:])
    ):
        raise ValueError("sealed_dataset_partition_gap")
    actual_hash = canonical_data_hash(_normalize_large_bar_set(bars))
    if not secrets.compare_digest(actual_hash, expected_hash):
        raise ValueError("sealed_dataset_partition_hash_mismatch")


def _normalize_large_bar_set(bars: list[OHLCVBar]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for index in range(0, len(bars), 500):
        normalized.extend(normalize_snapshot_bars(bars[index : index + 500]))
    return normalized


def _timeframe_step(timeframe: str) -> timedelta:
    seconds = {
        "1m": 60,
        "5m": 300,
        "15m": 900,
        "30m": 1_800,
        "60m": 3_600,
        "1d": 86_400,
        "1w": 604_800,
    }.get(timeframe)
    if seconds is None:
        raise ValueError("sealed_dataset_timeframe_unsupported")
    return timedelta(seconds=seconds)


def _aware_datetime(value: datetime | None, error_code: str) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise ValueError(error_code)
    return value.astimezone(timezone.utc)


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("sealed_dataset_timestamp_timezone_required")
    return value.astimezone(timezone.utc)


def _stored_datetime(value: object) -> datetime:
    parsed = datetime.fromisoformat(str(value))
    if parsed.tzinfo is None:
        raise ValueError("sealed_dataset_stored_timestamp_timezone_required")
    return parsed.astimezone(timezone.utc)


def _token_hash(token: str) -> str:
    if not token:
        raise ValueError("sealed_test_claim_token_required")
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _hash_string(value: object, error_code: str) -> str:
    normalized = str(value or "").strip().lower()
    if len(normalized) != 64 or any(character not in "0123456789abcdef" for character in normalized):
        raise ValueError(error_code)
    return normalized


def _positive_int(value: object, error_code: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(error_code)
    return value


def _payload_datetime(value: object, error_code: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(error_code)
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as error:
        raise ValueError(error_code) from error
    if parsed.tzinfo is None:
        raise ValueError(error_code)
    return parsed.astimezone(timezone.utc)
