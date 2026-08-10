from __future__ import annotations

import tempfile
import unittest
import json
import os
import base64
import sqlite3
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from threading import Thread
from unittest.mock import patch

from quant_core.canonical import (
    canonical_data_hash,
    canonical_snapshot_id,
    normalize_snapshot_bars,
)
from quant_core.domain import (
    BacktestMetrics,
    BacktestRun,
    DataQuality,
    MarketDataRequest,
    OHLCVBar,
)
from quant_core.sealed_datasets import SealedDatasetStore, SealedDevelopmentBarSource


def _bars(start: datetime, rows: int) -> list[OHLCVBar]:
    return [
        OHLCVBar(
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=start + timedelta(minutes=index),
            open=100 + (index % 10) / 100,
            high=101 + (index % 10) / 100,
            low=99 + (index % 10) / 100,
            close=100.5 + (index % 10) / 100,
            volume=10 + index % 7,
        )
        for index in range(rows)
    ]


def _v2_strategy_payload() -> dict[str, object]:
    return {
        "name": "BTC Sealed Regime Breakout v2",
        "version": 2,
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
        "position": {"maxPositionPct": 60},
        "risk": {
            "riskBudgetPct": 0.5,
            "maxDrawdownPct": 3,
            "dailyLossLimitPct": 2,
            "maxTradeGroupsPerHour": 1,
            "maxEntryNotionalQuote": 10,
            "exitNotionalCapQuote": None,
        },
    }


class SealedDatasetStoreTests(unittest.TestCase):
    def test_integrity_token_is_persistent_and_content_version_advances_on_bar_drift(self):
        start = datetime(2026, 8, 1, tzinfo=timezone.utc)
        complete = _bars(start, 6)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sealed.sqlite"
            store = SealedDatasetStore(path)
            summary = store.seal_dataset(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=start + timedelta(minutes=len(complete)),
                ),
                [complete],
                [
                    DataQuality(
                        source="binance",
                        origin_source="binance",
                        is_complete=True,
                        rows=len(complete),
                        adjustment_mode="none",
                        canonical_hash=canonical_data_hash(
                            normalize_snapshot_bars(complete)
                        ),
                    )
                ],
                development_end_exclusive=start + timedelta(minutes=5),
                observed_at=start + timedelta(minutes=7),
            )

            first = store.get_integrity(summary.dataset_id)
            restarted = SealedDatasetStore(path)
            restored = restarted.get_integrity(summary.dataset_id)

            self.assertEqual(restored, first)
            self.assertEqual(first.dataset_id, summary.dataset_id)
            self.assertEqual(first.manifest_token, summary.dataset_hash)
            self.assertGreaterEqual(first.content_version, 1)

            connection = sqlite3.connect(path)
            try:
                connection.execute(
                    """
                    update sealed_dataset_bars
                    set close = close + 0.1
                    where dataset_id = ? and partition_name = 'development'
                      and timestamp = ?
                    """,
                    (summary.dataset_id, start.isoformat()),
                )
                connection.commit()
            finally:
                connection.close()

            drifted = restarted.get_integrity(summary.dataset_id)
            self.assertEqual(drifted.manifest_token, first.manifest_token)
            self.assertGreater(drifted.content_version, first.content_version)
            with self.assertRaisesRegex(
                ValueError,
                "sealed_dataset_partition_hash_mismatch",
            ):
                restarted.read_development_bars(summary.dataset_id)

    def test_ninety_day_dataset_survives_restart_and_holdout_requires_one_time_claim(self):
        start = datetime(2026, 5, 2, 2, tzinfo=timezone.utc)
        development_end = start + timedelta(days=72)
        end_exclusive = start + timedelta(days=90)

        class FixtureAdapter:
            def __init__(self) -> None:
                self.calls: list[tuple[datetime, datetime, int]] = []

            def fetch_ohlcv(self, request, limit=500):
                page_start = request.start
                page_end = request.end
                if page_start is None or page_end is None:
                    raise AssertionError("sealed pagination must use explicit page boundaries")
                self.calls.append((page_start, page_end, limit))
                page_rows = int((page_end - page_start) // timedelta(minutes=1)) + 1
                page = _bars(page_start, page_rows)
                return page, DataQuality(
                    source="binance",
                    origin_source="binance",
                    is_complete=True,
                    rows=len(page),
                    adjustment_mode="none",
                    canonical_hash=canonical_data_hash(normalize_snapshot_bars(page)),
                )

        adapter = FixtureAdapter()

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sealed.sqlite"
            store = SealedDatasetStore(path)
            summary = SealedDevelopmentBarSource(store=store, adapter=adapter).seal(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=end_exclusive,
                ),
                development_end_exclusive=development_end,
                observed_at=end_exclusive + timedelta(minutes=1),
            )

            restarted = SealedDatasetStore(path)
            restored = restarted.get_summary(summary.dataset_id)
            development = restarted.read_development_bars(summary.dataset_id)
            claim = restarted.claim_test_partition(
                summary.dataset_id,
                claimant_id="experiment-001",
                expected_dataset_hash=summary.dataset_hash,
            )
            holdout = restarted.read_claimed_test_bars(
                summary.dataset_id,
                claim_token=claim.claim_token,
            )

            self.assertEqual(restored, summary)
            self.assertEqual(summary.rows, 129_600)
            self.assertEqual(summary.development_rows, 103_680)
            self.assertEqual(summary.withheld_rows, 25_920)
            self.assertEqual(len(adapter.calls), 260)
            self.assertTrue(all(1 <= limit <= 500 for _start, _end, limit in adapter.calls))
            self.assertEqual(development[0].timestamp, start)
            self.assertEqual(development[-1].timestamp, development_end - timedelta(minutes=1))
            self.assertEqual(holdout[0].timestamp, development_end)
            self.assertEqual(holdout[-1].timestamp, end_exclusive - timedelta(minutes=1))
            with self.assertRaisesRegex(ValueError, "sealed_test_claim_already_consumed"):
                restarted.read_claimed_test_bars(
                    summary.dataset_id,
                    claim_token=claim.claim_token,
                )

    def test_development_bar_source_pages_an_explicit_half_open_window(self):
        start = datetime(2026, 7, 1, tzinfo=timezone.utc)
        rows = _bars(start, 1_500)

        class FixtureAdapter:
            def __init__(self) -> None:
                self.calls: list[tuple[datetime | None, datetime | None, int]] = []

            def fetch_ohlcv(self, request, limit=500):
                self.calls.append((request.start, request.end, limit))
                page = [
                    bar
                    for bar in rows
                    if (request.start is None or bar.timestamp >= request.start)
                    and (request.end is None or bar.timestamp <= request.end)
                ][-limit:]
                return page, DataQuality(
                    source="binance",
                    origin_source="binance",
                    is_complete=True,
                    rows=len(page),
                    adjustment_mode="none",
                    canonical_hash=canonical_data_hash(normalize_snapshot_bars(page)),
                )

        adapter = FixtureAdapter()
        with tempfile.TemporaryDirectory() as directory:
            store = SealedDatasetStore(Path(directory) / "sealed.sqlite")
            source = SealedDevelopmentBarSource(store=store, adapter=adapter)
            summary = source.seal(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=start + timedelta(minutes=1_500),
                ),
                development_end_exclusive=start + timedelta(minutes=1_000),
                observed_at=start + timedelta(minutes=1_501),
            )
            source.store.claim_test_partition(
                summary.dataset_id,
                claimant_id="experiment-first",
                expected_dataset_hash=summary.dataset_hash,
            )
            with self.assertRaisesRegex(ValueError, "sealed_test_partition_consumed"):
                source.store.claim_test_partition(
                    summary.dataset_id,
                    claimant_id="experiment-second",
                    expected_dataset_hash=summary.dataset_hash,
                )

        self.assertEqual(len(adapter.calls), 3)
        self.assertTrue(all(limit == 500 for _start, _end, limit in adapter.calls))
        self.assertEqual(summary.rows, 1_500)
        self.assertEqual(summary.development_rows, 1_000)
        self.assertEqual(summary.withheld_rows, 500)
        calls_before_rejection = len(adapter.calls)
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(
            ValueError,
            "sealed_dataset_minimum_rows_required:1501",
        ):
            SealedDevelopmentBarSource(
                store=SealedDatasetStore(Path(directory) / "too-short.sqlite"),
                adapter=adapter,
                minimum_rows=1_501,
            ).seal(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=start + timedelta(minutes=1_500),
                ),
                development_end_exclusive=start + timedelta(minutes=1_000),
            )
        self.assertEqual(len(adapter.calls), calls_before_rejection)

    def test_development_bar_source_does_not_sort_away_upstream_disorder(self):
        start = datetime(2026, 7, 1, tzinfo=timezone.utc)

        class DisorderedAdapter:
            def fetch_ohlcv(self, request, limit=500):
                page = list(reversed(_bars(request.start, limit)))
                return page, DataQuality(
                    source="binance",
                    origin_source="binance",
                    is_complete=True,
                    rows=len(page),
                    adjustment_mode="none",
                )

        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(
            ValueError,
            "sealed_dataset_page_timestamp_disorder",
        ):
            SealedDevelopmentBarSource(
                store=SealedDatasetStore(Path(directory) / "sealed.sqlite"),
                adapter=DisorderedAdapter(),
            ).seal(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=start + timedelta(minutes=10),
                ),
                development_end_exclusive=start + timedelta(minutes=8),
            )


class SealedP0HttpTests(unittest.TestCase):
    def test_p0_backtests_only_development_and_research_detail_redacts_dataset_bars(self):
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        start = datetime(2026, 7, 1, tzinfo=timezone.utc)
        development_end = start + timedelta(minutes=1_000)
        end_exclusive = start + timedelta(minutes=1_500)

        class FixtureAdapter:
            def fetch_ohlcv(self, request, limit=500):
                page_start = request.start or start
                page_end = request.end or end_exclusive - timedelta(minutes=1)
                rows = min(limit, int((page_end - page_start) // timedelta(minutes=1)) + 1)
                page = _bars(page_start, rows)
                return page, DataQuality(
                    source="binance",
                    origin_source="binance",
                    is_complete=True,
                    rows=len(page),
                    adjustment_mode="none",
                    canonical_hash=canonical_data_hash(normalize_snapshot_bars(page)),
                )

        class RecordingEngine:
            def __init__(self) -> None:
                self.initial_cash = 10.0
                self.fee_rate = 0.001
                self.slippage_rate = 0.001
                self.seen: list[OHLCVBar] = []

            def run(self, strategy, bars):
                self.seen = list(bars)
                return BacktestRun(
                    strategy_name=strategy.name,
                    strategy_revision=strategy.revision,
                    symbol=strategy.symbols[0],
                    market=strategy.market,
                    timeframe=strategy.timeframe,
                    metrics=BacktestMetrics(
                        total_return_pct=1,
                        annual_return_pct=1,
                        max_drawdown_pct=1,
                        win_rate_pct=50,
                        profit_factor=1.2,
                        trade_count=0,
                    ),
                    trades=[],
                    equity_curve=[],
                    data_quality=DataQuality(
                        source="binance",
                        is_complete=True,
                        rows=len(bars),
                    ),
                )

        request_payload = {
            "market": "crypto",
            "symbol": "BTC/USDT",
            "timeframe": "1m",
            "strategyConfig": _v2_strategy_payload(),
            "assumptions": {"initialCash": 10, "feeBps": 10, "slippageBps": 10},
            "sealedDataset": {
                "start": start.isoformat(),
                "developmentEndExclusive": development_end.isoformat(),
                "endExclusive": end_exclusive.isoformat(),
            },
        }
        request_payload["strategyConfig"]["risk"]["maxEntryNotionalQuote"] = None
        engine = RecordingEngine()

        with tempfile.TemporaryDirectory() as directory:
            class TestHandler(QuantApiHandler):
                pass

            store_path = Path(directory) / "sealed.sqlite"
            TestHandler.run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            TestHandler.cache = MarketDataCache(Path(directory) / "market.sqlite")
            TestHandler.strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            TestHandler.sealed_dataset_store = SealedDatasetStore(store_path)
            TestHandler.sealed_dataset_minimum_rows = 1_500
            TestHandler.kline_adapter = FixtureAdapter()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=10)
            body = json.dumps(request_payload).encode("utf-8")
            try:
                with patch.dict(os.environ, {"AIQT_DEPLOYMENT_MODE": "local"}), patch(
                    "quant_core.http_api.routes.ai_strategy_p0._p0_backtest_engine_from_payload",
                    return_value=engine,
                ):
                    connection.request(
                        "POST",
                        "/api/p0/pipeline",
                        body=body,
                        headers={
                            "Content-Type": "application/json",
                            "Content-Length": str(len(body)),
                        },
                    )
                    response = connection.getresponse()
                    response_payload = json.loads(response.read().decode("utf-8"))
                    connection.request(
                        "GET",
                        f"/api/research/runs/{response_payload['runId']}",
                    )
                    detail_response = connection.getresponse()
                    detail_payload = json.loads(detail_response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            restarted = SealedDatasetStore(store_path)
            summary = restarted.get_summary(response_payload["sealedDatasetId"])

        self.assertEqual(response.status, 200, response_payload)
        self.assertEqual(detail_response.status, 200, detail_payload)
        self.assertEqual(len(engine.seen), 1_000)
        self.assertIsNone(
            detail_payload["run"]["strategyConfig"]["risk"]["maxEntryNotionalQuote"]
        )
        self.assertEqual(engine.seen[0].timestamp, start)
        self.assertEqual(engine.seen[-1].timestamp, development_end - timedelta(minutes=1))
        snapshot = detail_payload["run"]["dataSnapshot"]
        self.assertNotIn("bars", snapshot)
        self.assertEqual(snapshot["hashVersion"], "aiqt-sealed-v1")
        self.assertEqual(snapshot["sealedDataset"]["developmentRows"], 1_000)
        self.assertEqual(snapshot["sealedDataset"]["withheldRows"], 500)
        self.assertEqual(summary.development_hash, snapshot["hash"])
        self.assertEqual(
            snapshot["snapshotHash"],
            canonical_snapshot_id(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                canonical_data_hash=summary.development_hash,
            ),
        )
        self.assertEqual(
            summary.dataset_hash,
            snapshot["sealedDataset"]["datasetHash"],
        )
        self.assertNotEqual(snapshot["hash"], snapshot["sealedDataset"]["datasetHash"])

    def test_public_p0_rejects_sealed_dataset_before_store_or_adapter_access(self):
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        class ForbiddenDependency:
            def __getattr__(self, _name):
                raise AssertionError("public sealed P0 must fail before dependency access")

        start = datetime(2026, 7, 1, tzinfo=timezone.utc)
        request_payload = {
            "market": "crypto",
            "symbol": "BTC/USDT",
            "timeframe": "1m",
            "strategyConfig": _v2_strategy_payload(),
            "sealedDataset": {
                "start": start.isoformat(),
                "developmentEndExclusive": (start + timedelta(minutes=1_000)).isoformat(),
                "endExclusive": (start + timedelta(minutes=1_500)).isoformat(),
            },
        }
        public_environment = {
            "AIQT_DEPLOYMENT_MODE": "public",
            "AIQT_DATABASE_URL": "postgresql://example.invalid/aiqt",
            "AIQT_PUBLIC_ORIGIN": "https://myqt.example",
            "AIQT_OIDC_ISSUER": "https://issuer.example",
            "AIQT_OIDC_CLIENT_ID": "client",
            "AIQT_OIDC_CLIENT_SECRET": "secret",
            "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(b"m" * 32).decode(),
        }

        with tempfile.TemporaryDirectory() as directory:
            class TestHandler(QuantApiHandler):
                pass

            TestHandler.run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            TestHandler.cache = MarketDataCache(Path(directory) / "market.sqlite")
            TestHandler.strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
            TestHandler.sealed_dataset_store = ForbiddenDependency()
            TestHandler.kline_adapter = ForbiddenDependency()
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            body = json.dumps(request_payload).encode("utf-8")
            try:
                with patch.dict(os.environ, public_environment):
                    connection.request(
                        "POST",
                        "/api/p0/pipeline",
                        body=body,
                        headers={
                            "Content-Type": "application/json",
                            "Content-Length": str(len(body)),
                        },
                    )
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 400, payload)
        self.assertEqual(payload["error"], "invalid_p0_pipeline")
        self.assertEqual(payload["detail"], "sealed_dataset_local_only")


if __name__ == "__main__":
    unittest.main()
