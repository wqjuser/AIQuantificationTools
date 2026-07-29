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
from quant_core.canonical import canonical_data_hash, canonical_sha256, normalize_snapshot_bars
from quant_core.data_foundation import (
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
                    "quant_core.api.build_free_stockdb_adapter",
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
