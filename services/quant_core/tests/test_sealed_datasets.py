from __future__ import annotations

import asyncio
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

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from starlette.requests import Request

from quant_core.canonical import (
    canonical_data_hash,
    canonical_snapshot_id,
    normalize_snapshot_bars,
    strategy_config_to_payload,
)
from quant_core.ai_review_providers import AiReviewProviderRegistry, ProviderStatus
from quant_core.audit_events import AuditEventStore
from quant_core.domain import (
    BacktestMetrics,
    BacktestRun,
    DataQuality,
    MarketDataRequest,
    OHLCVBar,
)
from quant_core.deployment import load_deployment_config
from quant_core.public_schema import create_public_schema
from quant_core.public_tenant_api import PublicTenantApi
from quant_core.sealed_datasets import SealedDatasetStore, SealedDevelopmentBarSource
from quant_core.strategy_research import StrategyResearchCapabilityRegistry
from quant_core.tenancy import TenantContext


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

    def test_development_bar_source_pins_the_first_upstream_source(self):
        start = datetime(2026, 7, 1, tzinfo=timezone.utc)

        class SwitchingAdapter:
            def __init__(self) -> None:
                self.normal_calls = 0
                self.pinned_calls: list[str] = []

            def fetch_ohlcv(self, request, limit=500):
                self.normal_calls += 1
                return _bars(request.start, limit), DataQuality(
                    source="binance" if self.normal_calls == 1 else "coinbase",
                    origin_source="binance" if self.normal_calls == 1 else "coinbase",
                    is_complete=True,
                    rows=limit,
                    adjustment_mode="none",
                )

            def fetch_ohlcv_from_source(self, request, *, limit, source):
                self.pinned_calls.append(source)
                return _bars(request.start, limit), DataQuality(
                    source=source,
                    origin_source=source,
                    is_complete=True,
                    rows=limit,
                    adjustment_mode="none",
                )

        adapter = SwitchingAdapter()
        with tempfile.TemporaryDirectory() as directory:
            summary = SealedDevelopmentBarSource(
                store=SealedDatasetStore(Path(directory) / "sealed.sqlite"),
                adapter=adapter,
                page_size=1_000,
            ).seal(
                MarketDataRequest(
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    start=start,
                    end=start + timedelta(minutes=2_500),
                ),
                development_end_exclusive=start + timedelta(minutes=2_000),
            )

        self.assertEqual(summary.source, "binance")
        self.assertEqual(adapter.normal_calls, 1)
        self.assertEqual(adapter.pinned_calls, ["binance", "binance"])

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
    def test_registered_template_bootstraps_a_canonical_p0_that_can_propose(self):
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        start = datetime(2026, 3, 1, tzinfo=timezone.utc)
        total_rows = 142_919
        withheld_rows = 25_920
        end_exclusive = start + timedelta(minutes=total_rows)
        development_end = end_exclusive - timedelta(minutes=withheld_rows)

        class FixtureAdapter:
            def fetch_ohlcv(self, request, limit=500):
                page_start = request.start or start
                page_end = request.end or end_exclusive - timedelta(minutes=1)
                rows = min(
                    limit,
                    int((page_end - page_start) // timedelta(minutes=1)) + 1,
                )
                page = _bars(page_start, rows)
                return page, DataQuality(
                    source="binance",
                    origin_source="binance",
                    is_complete=True,
                    rows=len(page),
                    adjustment_mode="none",
                    canonical_hash=canonical_data_hash(normalize_snapshot_bars(page)),
                )

        with tempfile.TemporaryDirectory() as directory:
            class TestHandler(QuantApiHandler):
                ai_review_provider_registry = AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                )

                def log_message(self, format, *args):
                    del format, args

            TestHandler.run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            TestHandler.cache = MarketDataCache(Path(directory) / "market.sqlite")
            TestHandler.strategy_store = StrategyLibraryStore(
                Path(directory) / "strategies.sqlite"
            )
            TestHandler.sealed_dataset_store = SealedDatasetStore(
                Path(directory) / "sealed.sqlite"
            )
            TestHandler.sealed_dataset_minimum_rows = total_rows
            TestHandler.audit_event_store = AuditEventStore(
                Path(directory) / "audit.sqlite"
            )
            TestHandler.kline_adapter = FixtureAdapter()

            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=180)
            p0_request = {
                "market": "crypto",
                "symbol": "BTC/USDT",
                "timeframe": "1m",
                "registeredTemplateId": "regime-breakout-v2",
                "sealedDataset": {
                    "start": start.isoformat(),
                    "developmentEndExclusive": development_end.isoformat(),
                    "endExclusive": end_exclusive.isoformat(),
                },
            }
            p0_body = json.dumps(p0_request).encode("utf-8")
            try:
                with patch.dict(os.environ, {"AIQT_DEPLOYMENT_MODE": "local"}):
                    connection.request(
                        "POST",
                        "/api/p0/pipeline",
                        body=p0_body,
                        headers={
                            "Content-Type": "application/json",
                            "Content-Length": str(len(p0_body)),
                        },
                    )
                    p0_response = connection.getresponse()
                    p0_payload = json.loads(p0_response.read().decode("utf-8"))
                    proposal_request = {
                        "sourceRunId": p0_payload.get("runId"),
                        "goal": "使用服务端注册能力启动可审计的正式策略研发",
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                    proposal_body = json.dumps(proposal_request).encode("utf-8")
                    connection.request(
                        "POST",
                        "/api/strategy-research/proposals",
                        body=proposal_body,
                        headers={
                            "Content-Type": "application/json",
                            "Content-Length": str(len(proposal_body)),
                        },
                    )
                    proposal_response = connection.getresponse()
                    proposal_payload = json.loads(
                        proposal_response.read().decode("utf-8")
                    )
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

            audit = TestHandler.run_store.get(str(p0_payload.get("runId") or ""))

        expected_strategy = StrategyResearchCapabilityRegistry().resolve_base_strategy(
            "regime-breakout-v2",
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
        )
        self.assertEqual(p0_response.status, 200, p0_payload)
        self.assertIsNotNone(audit)
        self.assertEqual(
            audit.strategy_config,
            strategy_config_to_payload(expected_strategy),
        )
        self.assertEqual(
            audit.backtest_assumptions,
            {"initialCash": 10, "feeBps": 10, "slippageBps": 10},
        )
        scoring_start = start + timedelta(minutes=13_319)
        self.assertEqual(audit.data_snapshot.get("preRollVersion"), "formal-pre-roll-v2")
        self.assertEqual(
            audit.data_snapshot.get("scoringWindow"),
            {
                "start": scoring_start.isoformat(),
                "endExclusive": end_exclusive.isoformat(),
                "rows": 90 * 24 * 60,
                "preRollRows": 13_319,
            },
        )
        self.assertEqual(len(audit.backtest_equity_curve), 72 * 24 * 60)
        self.assertEqual(
            audit.backtest_equity_curve[0]["timestamp"],
            scoring_start.isoformat(),
        )
        self.assertEqual(proposal_response.status, 200, proposal_payload)
        self.assertEqual(
            proposal_payload["proposal"]["template"]["templateId"],
            "regime-breakout-v2",
        )

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

    def test_public_p0_seals_only_for_current_owner_and_returns_safe_summary(self):
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
        public_environment = {
            "AIQT_DEPLOYMENT_MODE": "public",
            "AIQT_DATABASE_URL": "postgresql://example.invalid/aiqt",
            "AIQT_PUBLIC_ORIGIN": "https://myqt.example",
            "AIQT_OIDC_ISSUER": "https://issuer.example",
            "AIQT_OIDC_CLIENT_ID": "client",
            "AIQT_OIDC_CLIENT_SECRET": "secret",
            "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(b"m" * 32).decode(),
        }
        config = load_deployment_config(public_environment)
        engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        create_public_schema(engine)
        self.addCleanup(engine.dispose)
        tenant_api = PublicTenantApi(config, engine)
        tenant_a = TenantContext(
            owner_id="owner-a",
            issuer="https://issuer.example",
            subject="subject-a",
            email="a@example.com",
            reauthenticated_at=start,
        )
        tenant_b = TenantContext(
            owner_id="owner-b",
            issuer="https://issuer.example",
            subject="subject-b",
            email="b@example.com",
            reauthenticated_at=start,
        )
        runtime_a = tenant_api._runtime(tenant_a)
        runtime_b = tenant_api._runtime(tenant_b)
        runtime_a.handler_type.kline_adapter = FixtureAdapter()
        runtime_a.handler_type.sealed_dataset_minimum_rows = 1_500
        backtest_engine = RecordingEngine()

        async def send(method: str, path: str, tenant: TenantContext, payload=None):
            body = json.dumps(payload).encode("utf-8") if payload is not None else b""
            delivered = False

            async def receive():
                nonlocal delivered
                if delivered:
                    return {"type": "http.disconnect"}
                delivered = True
                return {"type": "http.request", "body": body, "more_body": False}

            request = Request(
                {
                    "type": "http",
                    "method": method,
                    "path": path,
                    "raw_path": path.encode(),
                    "query_string": b"",
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(body)).encode()),
                    ],
                    "client": ("127.0.0.1", 12345),
                    "server": ("myqt.example", 443),
                    "scheme": "https",
                    "root_path": "",
                },
                receive,
            )
            return await tenant_api(request, tenant)

        with patch.dict(os.environ, public_environment), patch(
            "quant_core.http_api.routes.ai_strategy_p0._p0_backtest_engine_from_payload",
            return_value=backtest_engine,
        ):
            response = asyncio.run(
                send("POST", "/api/p0/pipeline", tenant_a, request_payload)
            )
            response_payload = json.loads(response.body.decode("utf-8"))
            run_id = str(response_payload.get("runId") or "")
            owner_detail = asyncio.run(
                send("GET", f"/api/research/runs/{run_id}", tenant_a)
            )
            other_detail = asyncio.run(
                send("GET", f"/api/research/runs/{run_id}", tenant_b)
            )

        self.assertEqual(response.status_code, 200, response_payload)
        self.assertEqual(owner_detail.status_code, 200, owner_detail.body)
        self.assertEqual(other_detail.status_code, 404, other_detail.body)
        self.assertEqual(len(backtest_engine.seen), 1_000)
        dataset_id = response_payload["sealedDatasetId"]
        self.assertIsNotNone(runtime_a.stores.sealed_dataset_store.get_summary(dataset_id))
        self.assertIsNone(runtime_b.stores.sealed_dataset_store.get_summary(dataset_id))
        owner_payload = json.loads(owner_detail.body.decode("utf-8"))
        response_summary = response_payload["sealedDataset"]
        run_snapshot = owner_payload["run"]["dataSnapshot"]
        expected_safe_fields = {
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
        self.assertEqual(set(response_summary), expected_safe_fields)
        self.assertEqual(set(run_snapshot["sealedDataset"]), expected_safe_fields)
        self.assertNotIn("bars", run_snapshot)
        self.assertNotIn("testHash", json.dumps(response_payload))
        self.assertNotIn("testHash", json.dumps(owner_payload))

    def test_public_p0_does_not_fall_back_to_a_local_sealed_store(self):
        from quant_core.api import QuantApiHandler
        from quant_core.cache import MarketDataCache
        from quant_core.runs import ResearchRunStore
        from quant_core.strategy_library import StrategyLibraryStore

        class ForbiddenAdapter:
            def fetch_ohlcv(self, *_args, **_kwargs):
                raise AssertionError("public sealed P0 must fail before market access")

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

        with tempfile.TemporaryDirectory() as directory:
            class TestHandler(QuantApiHandler):
                pass

            TestHandler.deployment_mode = "public"
            TestHandler.tenant_owner_id = "owner-a"
            TestHandler.run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
            TestHandler.cache = MarketDataCache(Path(directory) / "market.sqlite")
            TestHandler.strategy_store = StrategyLibraryStore(
                Path(directory) / "strategies.sqlite"
            )
            TestHandler.sealed_dataset_store = SealedDatasetStore(
                Path(directory) / "local-sealed.sqlite"
            )
            TestHandler.kline_adapter = ForbiddenAdapter()
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            body = json.dumps(request_payload).encode("utf-8")
            try:
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
        self.assertEqual(payload["detail"], "sealed_dataset_tenant_store_unavailable")


if __name__ == "__main__":
    unittest.main()
