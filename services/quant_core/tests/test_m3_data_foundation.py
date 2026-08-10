from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
import json
import tempfile
from threading import Thread
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from quant_core.adapter_error_ledger import (
    MarketDataAdapterErrorStore,
    create_market_data_adapter_error_event,
    market_data_adapter_error_event_to_payload,
)
from quant_core.adapters import FreeStockDbMarketDataAdapter
from quant_core.ai import LocalResearchAssistant
from quant_core.api import QuantApiHandler, _adapter_error_message, _adapter_error_target
from quant_core.cache import MarketDataCache
from quant_core.canonical import (
    CHUNKED_DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_sha256,
    flatten_chunked_data_snapshot,
    normalize_snapshot_bar_chunks,
    normalize_snapshot_bars,
    verify_chunked_data_snapshot,
)
from quant_core.data_foundation import (
    assess_chunked_market_data_quality,
    assess_market_data_quality,
    build_cross_source_difference_report,
    normalize_cross_source_difference_report,
)
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.research import run_terminal_research
from quant_core.runs import ResearchRunStore
from quant_core.settings import build_settings_status
from quant_core.strategy_library import StrategyLibraryStore


def daily_bars(
    count: int = 30,
    *,
    close_multiplier: float = 1.0,
    start: datetime = datetime(2026, 6, 1, tzinfo=timezone.utc),
) -> list[OHLCVBar]:
    bars = []
    for index in range(count):
        open_price = 100 + index
        close = open_price * close_multiplier
        bars.append(OHLCVBar(
            market="ashare",
            symbol="600000",
            timeframe="1d",
            timestamp=start + timedelta(days=index),
            open=open_price,
            high=max(open_price, close) + 1,
            low=min(open_price, close) - 1,
            close=close,
            volume=10_000 + index,
        ))
    return bars


def minute_bars(
    count: int,
    *,
    start: datetime = datetime(2026, 5, 1, tzinfo=timezone.utc),
) -> list[OHLCVBar]:
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
            volume=1_000 + index,
        )
        for index in range(count)
    ]


class FixedAdapter:
    def __init__(self, bars, source="tencent"):
        self.bars = bars
        self.source = source

    def fetch_ohlcv(self, _request, limit=None):
        rows = self.bars[-int(limit or len(self.bars)):]
        return rows, DataQuality(
            source=self.source,
            is_complete=True,
            rows=len(rows),
        )


class FailingAdapter:
    source = "offline"

    def fetch_ohlcv(self, _request, limit=None):
        raise RuntimeError("network unavailable")


class CountingAssistant:
    def __init__(self):
        self.calls = 0

    def analyze(self, _request):
        self.calls += 1
        raise AssertionError("assistant must not run after a data-quality blocker")


class M3DataFoundationTests(unittest.TestCase):
    def test_cache_half_open_window_and_provenance_exclude_end_boundary(self):
        values = minute_bars(6)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "market.sqlite"
            cache = MarketDataCache(path)
            cache.upsert_bars(
                values[:4],
                source="binance",
                adjustment_mode="none",
                snapshot_id="snapshot-binance",
            )
            cache.upsert_bars(
                values[4:],
                source="coinbase",
                adjustment_mode="none",
                snapshot_id="snapshot-coinbase",
            )
            cache = MarketDataCache(path)

            selected = cache.read_bars_half_open(
                "crypto",
                "BTC/USDT",
                "1m",
                start=values[1].timestamp.astimezone(timezone(timedelta(hours=8))),
                end_exclusive=values[4].timestamp.astimezone(timezone(timedelta(hours=8))),
            )
            mixed_provenance = cache.read_provenance_half_open(
                "crypto",
                "BTC/USDT",
                "1m",
                start=values[1].timestamp,
                end_exclusive=values[5].timestamp,
            )
            provenance = cache.read_provenance_half_open(
                "crypto",
                "BTC/USDT",
                "1m",
                start=values[1].timestamp.astimezone(timezone(timedelta(hours=8))),
                end_exclusive=values[4].timestamp.astimezone(timezone(timedelta(hours=8))),
            )

        self.assertEqual(selected, values[1:4])
        self.assertEqual(
            provenance,
            {
                "source": "binance",
                "adjustmentMode": "none",
                "snapshotId": "snapshot-binance",
            },
        )
        self.assertIsNone(mixed_provenance)

    def test_chunked_canonical_snapshot_hash_matches_flat_hash_and_not_chunk_size(self):
        values = minute_bars(6)
        snapshots = [
            normalize_snapshot_bar_chunks(
                [values[index : index + chunk_rows] for index in range(0, len(values), chunk_rows)],
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
            )
            for chunk_rows in (2, 3)
        ]
        expected = normalize_snapshot_bars(values)

        self.assertTrue(all(snapshot["hashVersion"] == CHUNKED_DATA_SNAPSHOT_HASH_VERSION for snapshot in snapshots))
        self.assertEqual(snapshots[0]["hash"], canonical_data_hash(expected))
        self.assertEqual(snapshots[0]["hash"], snapshots[1]["hash"])
        self.assertEqual(
            flatten_chunked_data_snapshot(
                snapshots[0],
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
            ),
            expected,
        )
        self.assertEqual(
            verify_chunked_data_snapshot(
                snapshots[0],
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
            ),
            snapshots[0],
        )
        self.assertTrue(all(len(chunk["bars"]) <= 500 for chunk in snapshots[0]["chunks"]))
        self.assertTrue(all(chunk["hash"] == canonical_data_hash(chunk["bars"]) for chunk in snapshots[0]["chunks"]))

    def test_chunked_canonical_snapshot_rejects_boundaries_context_and_invalid_data(self):
        values = minute_bars(502)
        cases = {
            "oversized": ([values[:501], values[501:]], "data_snapshot_chunk_too_many_bars"),
            "duplicate": ([values[:2], values[1:3]], "data_snapshot_duplicate_timestamp"),
            "gap": ([values[:2], values[3:5]], "data_snapshot_missing_bar_gap"),
            "disorder": ([[values[1], values[0]], values[2:4]], "data_snapshot_timestamp_disorder"),
            "context": (
                [values[:2], [replace(values[2], symbol="ETH/USDT"), values[3]]],
                "data_snapshot_context_mismatch",
            ),
            "invalid": (
                [[replace(values[0], high=values[0].close - 1), values[1]]],
                "data_snapshot_ohlc_relationship_invalid",
            ),
        }

        for name, (chunks, error) in cases.items():
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, error):
                normalize_snapshot_bar_chunks(
                    chunks,
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                )

    def test_chunked_canonical_snapshot_detects_tampered_chunk_and_manifest(self):
        values = minute_bars(6)
        snapshot = normalize_snapshot_bar_chunks(
            [values[:3], values[3:]],
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
        )
        tampered_chunk = json.loads(json.dumps(snapshot))
        tampered_chunk["chunks"][0]["bars"][0]["close"] = 999
        tampered_index = json.loads(json.dumps(snapshot))
        tampered_index["chunks"][0]["index"] = False
        missing_chunk = {**snapshot, "chunks": snapshot["chunks"][:1]}
        tampered_hash = {**snapshot, "hash": "0" * 64}

        for name, payload, error in (
            ("chunk", tampered_chunk, "data_snapshot_chunk_hash_mismatch"),
            ("index", tampered_index, "data_snapshot_chunk_index_invalid"),
            ("missing", missing_chunk, "data_snapshot_rows_mismatch"),
            ("manifest", tampered_hash, "data_snapshot_hash_mismatch"),
        ):
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, error):
                verify_chunked_data_snapshot(
                    payload,
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                )

    def test_chunked_quality_reuses_full_contract_and_rejects_mixed_incomplete_or_demo_sources(self):
        values = minute_bars(600)
        chunks = [values[:500], values[500:]]
        request = MarketDataRequest(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            start=values[0].timestamp,
            end=values[-1].timestamp + timedelta(minutes=1),
        )
        observed_at = values[-1].timestamp + timedelta(minutes=2)
        complete = assess_chunked_market_data_quality(
            request,
            chunks,
            [
                DataQuality(source="binance", origin_source="binance", is_complete=True, rows=500),
                DataQuality(source="binance", origin_source="binance", is_complete=True, rows=100),
            ],
            observed_at=observed_at,
        )

        self.assertTrue(complete.is_complete)
        self.assertEqual(complete.rows, 600)
        self.assertEqual(complete.origin_source, "binance")
        self.assertEqual(complete.coverage, {"actualRows": 600, "expectedRows": 600, "gapCount": 0, "ratio": 1.0})
        expected_bars = normalize_snapshot_bars(values[:500]) + normalize_snapshot_bars(values[500:])
        self.assertEqual(complete.canonical_hash, canonical_data_hash(expected_bars))
        self.assertIsNotNone(complete.observed_at)
        self.assertIsNotNone(complete.market_time)
        self.assertIsNotNone(complete.calendar_id)

        shortened = assess_chunked_market_data_quality(
            request,
            [values[:500], values[500:599]],
            [
                DataQuality(source="binance", is_complete=True, rows=500),
                DataQuality(source="binance", is_complete=True, rows=99),
            ],
            observed_at=observed_at,
        )
        self.assertFalse(shortened.is_complete)
        self.assertEqual(shortened.coverage["actualRows"], 599)
        self.assertEqual(shortened.coverage["expectedRows"], 600)
        self.assertIn(
            "requested_window_boundary_mismatch",
            {issue["code"] for issue in shortened.issues},
        )
        self.assertIn(
            "requested_window_rows_mismatch",
            {issue["code"] for issue in shortened.issues},
        )

        invalid_qualities = {
            "mixed": [
                DataQuality(source="binance", is_complete=True, rows=500),
                DataQuality(source="coinbase", is_complete=True, rows=100),
            ],
            "incomplete": [
                DataQuality(source="binance", is_complete=True, rows=500),
                DataQuality(source="binance", is_complete=False, rows=100),
            ],
            "demo": [
                DataQuality(source="demo", is_complete=True, rows=500),
                DataQuality(source="demo", is_complete=True, rows=100),
            ],
            "page_issue": [
                DataQuality(
                    source="binance",
                    is_complete=True,
                    rows=500,
                    issues=[{
                        "code": "upstream_page_blocked",
                        "severity": "blocked",
                        "count": 1,
                        "message": "A source page failed validation.",
                    }],
                ),
                DataQuality(source="binance", is_complete=True, rows=100),
            ],
            "hash": [
                DataQuality(
                    source="binance",
                    is_complete=True,
                    rows=500,
                    canonical_hash="0" * 64,
                ),
                DataQuality(source="binance", is_complete=True, rows=100),
            ],
        }
        expected_codes = {
            "mixed": "mixed_source",
            "incomplete": "upstream_incomplete",
            "demo": "demo_source",
            "page_issue": "upstream_page_blocked",
            "hash": "page_canonical_hash_mismatch",
        }
        for name, qualities in invalid_qualities.items():
            with self.subTest(name=name):
                assessed = assess_chunked_market_data_quality(
                    request,
                    chunks,
                    qualities,
                    observed_at=observed_at,
                )
                self.assertFalse(assessed.is_complete)
                self.assertIn(expected_codes[name], {issue["code"] for issue in assessed.issues})

    def test_quality_contract_detects_structure_gaps_freshness_and_identity(self):
        request = MarketDataRequest(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            end=datetime(2026, 7, 28, 8, tzinfo=timezone.utc),
        )
        first = OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=datetime(2026, 7, 28, 7, 56, tzinfo=timezone.utc),
            open=100,
            high=102,
            low=99,
            close=101,
            volume=5,
        )
        second = OHLCVBar(
            **{
                **first.to_record(),
                "timestamp": datetime(2026, 7, 28, 7, 58, tzinfo=timezone.utc),
            }
        )

        quality = assess_market_data_quality(
            request,
            [first, second],
            DataQuality(source="binance", is_complete=True),
            observed_at=datetime(2026, 7, 28, 8, tzinfo=timezone.utc),
        )

        self.assertFalse(quality.is_complete)
        self.assertEqual(quality.calendar_id, "crypto:UTC:static-session-template")
        self.assertEqual(quality.freshness, "fresh")
        self.assertEqual(quality.coverage["gapCount"], 1)
        self.assertEqual(quality.canonical_hash, canonical_data_hash(normalize_snapshot_bars([first, second])))
        self.assertIn("missing_bar_gap", {issue["code"] for issue in quality.issues})

    def test_quality_contract_blocks_duplicates_disorder_invalid_ohlc_and_forming_bars(self):
        observed = datetime(2026, 7, 28, 8, tzinfo=timezone.utc)
        request = MarketDataRequest(market="crypto", symbol="BTC/USDT", timeframe="1m", end=observed)
        valid = OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=observed - timedelta(minutes=2),
            open=100,
            high=102,
            low=99,
            close=101,
            volume=5,
        )
        invalid = OHLCVBar(
            **{
                **valid.to_record(),
                "timestamp": observed - timedelta(minutes=1),
                "high": 100,
                "close": 101,
            }
        )
        forming = OHLCVBar(**{**valid.to_record(), "timestamp": observed})
        quality = assess_market_data_quality(
            request,
            [forming, valid, valid, invalid],
            DataQuality(source="fixture", is_complete=True),
            observed_at=observed,
        )
        codes = {issue["code"] for issue in quality.issues}

        self.assertFalse(quality.is_complete)
        self.assertIn("duplicate_timestamp", codes)
        self.assertIn("timestamp_disorder", codes)
        self.assertIn("forming_bar", codes)

    def test_quality_contract_rejects_invalid_ohlc_and_non_finite_values(self):
        observed = datetime(2026, 7, 28, 8, tzinfo=timezone.utc)
        request = MarketDataRequest(market="crypto", symbol="BTC/USDT", timeframe="1m", end=observed)
        valid = OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=observed - timedelta(minutes=2),
            open=100,
            high=102,
            low=99,
            close=101,
            volume=5,
        )
        invalid_ohlc = replace(valid, high=100)
        non_finite = replace(valid, timestamp=observed - timedelta(minutes=3), volume=float("nan"))

        ohlc_quality = assess_market_data_quality(
            request,
            [invalid_ohlc],
            DataQuality(source="fixture", is_complete=True),
            observed_at=observed,
        )
        finite_quality = assess_market_data_quality(
            request,
            [non_finite],
            DataQuality(source="fixture", is_complete=True),
            observed_at=observed,
        )

        self.assertIn("data_snapshot_ohlc_relationship_invalid", {issue["code"] for issue in ohlc_quality.issues})
        self.assertIn("data_snapshot_number_must_be_finite", {issue["code"] for issue in finite_quality.issues})
        self.assertFalse(ohlc_quality.is_complete)
        self.assertFalse(finite_quality.is_complete)

    def test_daily_gap_detection_counts_missing_weekdays_but_not_weekends(self):
        request = MarketDataRequest(market="ashare", symbol="600000", timeframe="1d")
        friday = daily_bars(1, start=datetime(2026, 7, 24, tzinfo=timezone.utc))[0]
        monday = replace(friday, timestamp=datetime(2026, 7, 27, tzinfo=timezone.utc))
        tuesday = replace(friday, timestamp=datetime(2026, 7, 28, tzinfo=timezone.utc))

        weekend_quality = assess_market_data_quality(
            request,
            [friday, monday],
            DataQuality(source="fixture", is_complete=True),
            observed_at=datetime(2026, 7, 29, tzinfo=timezone.utc),
        )
        gap_quality = assess_market_data_quality(
            request,
            [friday, tuesday],
            DataQuality(source="fixture", is_complete=True),
            observed_at=datetime(2026, 7, 29, tzinfo=timezone.utc),
        )

        self.assertEqual(weekend_quality.coverage["gapCount"], 0)
        self.assertEqual(gap_quality.coverage["gapCount"], 1)
        self.assertIn("missing_bar_gap", {issue["code"] for issue in gap_quality.issues})

    def test_cross_source_report_classifies_thresholds_without_merging_values(self):
        primary = daily_bars(3)
        agreement = build_cross_source_difference_report("tencent", primary, "free-stockdb", daily_bars(3, close_multiplier=1.004))
        warning = build_cross_source_difference_report("tencent", primary, "free-stockdb", daily_bars(3, close_multiplier=1.01))
        blocked = build_cross_source_difference_report("tencent", primary, "free-stockdb", daily_bars(3, close_multiplier=1.05))

        self.assertEqual(agreement["status"], "agreement")
        self.assertEqual(warning["status"], "warning")
        self.assertEqual(blocked["status"], "blocked")
        self.assertFalse(blocked["valuesMerged"])
        self.assertEqual(normalize_cross_source_difference_report(blocked), blocked)
        tampered = {**blocked, "status": "agreement"}
        with self.assertRaisesRegex(ValueError, "source_comparison_hash_mismatch"):
            normalize_cross_source_difference_report(tampered)
        for field, invalid_value in {
            "primarySource": None,
            "primaryRows": "3",
            "overlapRatio": "1",
            "fields": [],
            "differences": {},
            "reason": 0,
        }.items():
            with self.subTest(field=field):
                malformed = {**blocked, field: invalid_value}
                malformed["reportHash"] = canonical_sha256({
                    key: value for key, value in malformed.items() if key != "reportHash"
                })
                with self.assertRaisesRegex(ValueError, "source_comparison_schema_invalid"):
                    normalize_cross_source_difference_report(malformed)
        with self.assertRaisesRegex(ValueError, "source_comparison_schema_invalid"):
            normalize_cross_source_difference_report({**blocked, "reportHash": 1})

    def test_free_stockdb_adapter_only_uses_read_only_daily_get_protocol(self):
        calls = []

        def fetch_json(url, timeout):
            calls.append((url, timeout))
            return [
                ["日k:600000:20260725", {
                    "date": 20260725,
                    "open": 10,
                    "high": 11,
                    "low": 9,
                    "close": 10.5,
                    "volume": 1234,
                }],
            ]

        adapter = FreeStockDbMarketDataAdapter(
            base_url="http://127.0.0.1:7899",
            timeout_seconds=4,
            fetch_json=fetch_json,
        )
        bars, quality = adapter.fetch_ohlcv(
            MarketDataRequest(
                market="ashare",
                symbol="600000",
                timeframe="1d",
                end=datetime(2026, 7, 28, tzinfo=timezone.utc),
            ),
        )
        query = parse_qs(urlparse(calls[0][0]).query)

        self.assertEqual(query["cmd"], ["get"])
        self.assertEqual(query["t"], ["日k:600000:*"])
        self.assertNotIn("set", calls[0][0])
        self.assertEqual(calls[0][1], 4)
        self.assertEqual(len(bars), 1)
        self.assertEqual(quality.adjustment_mode, "none")

    def test_adapter_error_ledger_uses_actual_provider_and_ignores_non_blocking_warnings(self):
        warning_quality = DataQuality(
            source="tencent",
            is_complete=True,
            warnings=["Expected bar intervals are missing."],
            rows=20,
        )
        blocked_quality = replace(warning_quality, source="akshare", is_complete=False)

        self.assertIsNone(_adapter_error_target("ashare", source=warning_quality.source))
        self.assertIsNone(_adapter_error_message(quality=warning_quality, error=None))
        self.assertEqual(_adapter_error_target("ashare", source=blocked_quality.source), ("akshare-ohlcv", "akshare"))
        self.assertEqual(
            _adapter_error_message(quality=blocked_quality, error=None),
            "Expected bar intervals are missing.",
        )
        legacy_event = create_market_data_adapter_error_event(
            adapter_id="akshare-ohlcv",
            provider="akshare",
            market="ashare",
            symbol="600000",
            timeframe="1d",
            source="tencent",
            context="market-klines",
            message="Expected bar intervals are missing.",
            created_at=datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc),
        )
        settings = build_settings_status(
            cache_path="unused.sqlite",
            adapter_dependency_statuses={"akshare": True, "yfinance": True, "ccxt": True},
            adapter_error_events=[market_data_adapter_error_event_to_payload(legacy_event)],
            generated_at=datetime(2026, 7, 28, 14, 1, tzinfo=timezone.utc),
        )
        akshare = next(
            item for item in settings["marketDataAdapters"]
            if item["id"] == "akshare-ohlcv"
        )
        self.assertEqual(akshare["externalTelemetry"]["providerHealth"]["status"], "ok")

    def test_research_blocks_invalid_primary_and_material_source_difference_before_ai(self):
        invalid = daily_bars()
        invalid[-1] = replace(invalid[-1], high=invalid[-1].close - 1)
        assistant = CountingAssistant()
        data_end = invalid[-1].timestamp + timedelta(days=1)
        with tempfile.TemporaryDirectory() as directory:
            cache = MarketDataCache(Path(directory) / "market.sqlite")
            store = ResearchRunStore(Path(directory) / "runs.sqlite")
            with self.assertRaisesRegex(ValueError, "research_data_quality_blocked"):
                run_terminal_research(
                    adapter=FixedAdapter(invalid),
                    assistant=assistant,
                    cache=cache,
                    run_store=store,
                    data_end=data_end,
                )
            with self.assertRaisesRegex(ValueError, "research_cross_source_difference_blocked"):
                run_terminal_research(
                    adapter=FixedAdapter(daily_bars()),
                    comparison_adapter=FixedAdapter(daily_bars(close_multiplier=1.05), source="free-stockdb"),
                    assistant=assistant,
                    cache=cache,
                    run_store=store,
                    data_end=data_end,
                )
        self.assertEqual(assistant.calls, 0)

    def test_cached_snapshot_replays_offline_with_the_same_canonical_hash(self):
        bars = daily_bars()
        expected_hash = canonical_data_hash(normalize_snapshot_bars(bars))
        with tempfile.TemporaryDirectory() as directory:
            cache = MarketDataCache(Path(directory) / "market.sqlite")
            store = ResearchRunStore(Path(directory) / "runs.sqlite")
            cache.upsert_bars(bars)

            workspace = run_terminal_research(
                adapter=FailingAdapter(),
                cache=cache,
                run_store=store,
                data_end=bars[-1].timestamp + timedelta(days=1),
            )
            audit = store.get(workspace.research_run.run_id)

        self.assertIsNotNone(audit)
        assert audit is not None
        self.assertEqual(audit.data_snapshot["hash"], expected_hash)
        self.assertEqual(audit.data_snapshot["offlineReplay"]["status"], "verified")
        self.assertFalse(audit.data_snapshot["offlineReplay"]["networkRequired"])
        self.assertEqual(audit.data_quality["source"], "local-cache")
        self.assertEqual(audit.data_quality["freshness"], "historical")

    def test_settings_api_exposes_complete_capability_matrix_without_endpoint_value(self):
        with tempfile.TemporaryDirectory() as directory:
            class Handler(QuantApiHandler):
                cache = MarketDataCache(Path(directory) / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(Path(directory) / "errors.sqlite")
                data_foundation_environ = {
                    "AIQT_FREE_STOCKDB_URL": "http://127.0.0.1:7899/private",
                }

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                connection.request("GET", "/api/settings/status")
                response = connection.getresponse()
                payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

        adapters = payload["settings"]["marketDataAdapters"]
        free_stockdb = next(item for item in adapters if item["id"] == "free-stockdb-ohlcv")
        self.assertEqual(response.status, 200)
        self.assertTrue(all({
            "market",
            "timeframes",
            "historyDepth",
            "adjustmentModes",
            "freshnessSemantics",
            "credentialRequirements",
            "readOnly",
        } <= item.keys() for item in adapters))
        self.assertTrue(free_stockdb["readOnly"])
        self.assertEqual(free_stockdb["capabilities"], ["daily_ohlcv_comparison"])
        self.assertNotIn("http://127.0.0.1:7899/private", json.dumps(payload))

    def test_settings_api_can_probe_free_stockdb_with_a_bounded_read_only_get(self):
        with tempfile.TemporaryDirectory() as directory:
            class Handler(QuantApiHandler):
                cache = MarketDataCache(Path(directory) / "market.sqlite")
                adapter_error_store = MarketDataAdapterErrorStore(Path(directory) / "errors.sqlite")
                data_foundation_environ = {
                    "AIQT_FREE_STOCKDB_URL": "http://127.0.0.1:7899/private",
                }

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                with patch(
                    "quant_core.http_api.support.handler_runtime.build_free_stockdb_adapter",
                    return_value=FixedAdapter(daily_bars(1), source="free-stockdb"),
                ):
                    connection.request("GET", "/api/settings/status?probe=free-stockdb")
                    response = connection.getresponse()
                    payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

        free_stockdb = next(
            item for item in payload["settings"]["marketDataAdapters"]
            if item["id"] == "free-stockdb-ohlcv"
        )
        self.assertEqual(response.status, 200)
        self.assertEqual(free_stockdb["status"], "ready")
        self.assertEqual(free_stockdb["externalTelemetry"]["providerHealth"]["status"], "ok")
        self.assertEqual(
            free_stockdb["externalTelemetry"]["providerHealth"]["reason"],
            "probe_succeeded",
        )

    def test_research_api_persists_the_quality_comparison_and_offline_replay_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            class Handler(QuantApiHandler):
                cache = MarketDataCache(Path(directory) / "market.sqlite")
                run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
                strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
                assistant = LocalResearchAssistant()
                kline_adapter = FixedAdapter(daily_bars(), source="tencent")
                data_foundation_environ = {}

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                connection.request(
                    "GET",
                    "/api/research/run?market=ashare&symbol=600000&timeframe=1d"
                    "&limit=30&end=2026-07-02T00%3A00%3A00Z",
                )
                response = connection.getresponse()
                payload = json.loads(response.read())
                run_id = payload["researchRun"]["runId"]
                connection.request("GET", f"/api/research/runs/{run_id}")
                detail_response = connection.getresponse()
                detail = json.loads(detail_response.read())["run"]
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

        snapshot = detail["dataSnapshot"]
        quality = detail["dataQuality"]
        self.assertEqual(response.status, 200)
        self.assertEqual(detail_response.status, 200)
        self.assertEqual(quality["canonicalHash"], snapshot["hash"])
        self.assertEqual(quality["calendarId"], "ashare:Asia/Shanghai:static-session-template")
        self.assertEqual(snapshot["sourceComparison"]["status"], "unavailable")
        self.assertEqual(snapshot["sourceComparison"]["reason"], "secondary_source_not_configured")
        self.assertFalse(snapshot["sourceComparison"]["valuesMerged"])
        self.assertEqual(snapshot["offlineReplay"]["status"], "verified")
        self.assertFalse(snapshot["offlineReplay"]["networkRequired"])


if __name__ == "__main__":
    unittest.main()
