from __future__ import annotations

from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
import json
from pathlib import Path
import sys
import tempfile
from threading import Event, Thread
import time
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from quant_core.ai_review_providers import (
    AiReviewProviderRegistry,
    ProviderAttempt,
    ProviderStatus,
)
from quant_core.audit_events import AuditEventStore
from quant_core.auto_paper_trading import AutoPaperTradingRunner, AutoPaperTradingService
from quant_core.api import (
    QuantApiHandler,
    build_auto_paper_trading_runner,
    evaluate_auto_paper_trading_once,
)
from quant_core.decision_contract import (
    build_order_intent,
    build_order_result,
    build_risk_adjusted_target,
    replay_decision_proposal,
)
from quant_core.binance_spot_orders import (
    check_spot_account_coverage,
    create_spot_market_order,
    prepare_spot_market_order,
)
from quant_core.cache import MarketDataCache
from quant_core.domain import DataQuality, OHLCVBar
from quant_core.stage6_sandbox import BinanceSpotTestnetRoute


class FakeProvider:
    endpoint = "https://example.invalid/chat/completions"

    def assess(self, **_kwargs):
        return ProviderAttempt(
            provider_id="openai-compatible",
            model="fake",
            sanitized_base_url="https://example.invalid",
            assessment={"action": "buy", "confidence": 0.01, "reason": "上涨动量仍在。"},
            usage={"inputTokens": 1, "outputTokens": 1, "totalTokens": 2},
            latency_ms=1,
        )


class FakeSandboxService:
    def __init__(self, *, triggered: bool = False) -> None:
        self.triggered = triggered
        self.orders = []
        self.preparations = []
        self.account_covered = True

    def kill_switch(self):
        return {"enabled": True, "triggered": self.triggered, "recordedAt": None, "operator": None}

    def verify_auto_account_coverage(self, expected_position, required_quote):
        return {
            "accountCovered": self.account_covered,
            "positionCovered": self.account_covered,
            "quoteCovered": self.account_covered,
            "unexpectedOpenAutoOrderCount": 0 if self.account_covered else 1,
        }

    def submit_auto_market_order(self, order):
        self.orders.append(order)
        return {
            "exchangeOrderId": "testnet-order-1",
            "clientOrderId": order["clientOrderId"],
            "state": "filled",
            "filledQuantity": order["quantity"],
            "remainingQuantity": 0,
            "averagePrice": order["referencePrice"],
            "exchangeStatus": "closed",
            "timestamp": 1,
        }

    def prepare_auto_market_order(self, order):
        self.preparations.append(order)
        return {
            **order,
            "marketRules": {
                "source": "ccxt",
                "quantityPrecision": 0.000001,
                "pricePrecision": 0.01,
                "minimumQuantity": 0.00001,
                "minimumNotional": 1,
            },
            "executionAssumptions": {
                "feeRate": 0.001,
                "feeEstimated": True,
                "slippageBps": None,
                "slippageModel": "venue_market_fill",
            },
        }


class FakePendingSandboxService(FakeSandboxService):
    def __init__(self) -> None:
        super().__init__()
        self.reconciliation_calls = 0

    def submit_auto_market_order(self, order):
        self.orders.append(order)
        return {
            "exchangeOrderId": "testnet-order-pending",
            "clientOrderId": order["clientOrderId"],
            "state": "open",
            "filledQuantity": 0,
            "remainingQuantity": order["quantity"],
            "averagePrice": 0,
            "exchangeStatus": "open",
            "timestamp": 1,
        }

    def reconcile_auto_market_order(self, order, evidence):
        self.reconciliation_calls += 1
        return {
            "exchangeOrderId": evidence["exchangeOrderId"],
            "clientOrderId": order["clientOrderId"],
            "state": "filled",
            "filledQuantity": order["quantity"],
            "remainingQuantity": 0,
            "averagePrice": order["referencePrice"],
            "exchangeStatus": "closed",
            "timestamp": 2,
            "operation": "query",
        }


class FakeRejectedPreparationSandboxService(FakeSandboxService):
    def prepare_auto_market_order(self, order):
        self.preparations.append(order)
        raise ValueError("stage6_sandbox_cost_below_minimum")


class FakeDustFillSandboxService(FakePendingSandboxService):
    def submit_auto_market_order(self, order):
        self.orders.append(order)
        return {
            "exchangeOrderId": "testnet-order-dust",
            "clientOrderId": order["clientOrderId"],
            "state": "partially_filled",
            "filledQuantity": 0.00001,
            "remainingQuantity": max(0, order["quantity"] - 0.00001),
            "averagePrice": order["referencePrice"],
            "filledNotional": 0.00001 * order["referencePrice"],
            "fees": [],
            "exchangeStatus": "open",
            "timestamp": 1,
        }

    def reconcile_auto_market_order(self, order, evidence):
        self.reconciliation_calls += 1
        return {
            **evidence,
            "state": "canceled",
            "remainingQuantity": order["quantity"] - evidence["filledQuantity"],
            "exchangeStatus": "canceled",
            "timestamp": 2,
            "operation": "query",
        }

    def prepare_auto_market_order(self, order):
        self.preparations.append(order)
        if order["side"] == "sell" and order["notionalValue"] < 1:
            raise ValueError("stage6_sandbox_cost_below_minimum")
        return super().prepare_auto_market_order(order)


class FakePartialFillSandboxService(FakePendingSandboxService):
    def submit_auto_market_order(self, order):
        self.orders.append(order)
        filled_quantity = order["quantity"] / 2
        return {
            "exchangeOrderId": "testnet-order-partial",
            "clientOrderId": order["clientOrderId"],
            "state": "partially_filled",
            "filledQuantity": filled_quantity,
            "remainingQuantity": filled_quantity,
            "averagePrice": order["referencePrice"],
            "filledNotional": order["notionalValue"] / 2,
            "fees": [{"currency": "USDT", "cost": 0.001}],
            "exchangeStatus": "open",
            "timestamp": 1,
        }

    def reconcile_auto_market_order(self, order, evidence):
        self.reconciliation_calls += 1
        return {
            **evidence,
            "state": "canceled",
            "remainingQuantity": order["quantity"] - evidence["filledQuantity"],
            "exchangeStatus": "canceled",
            "timestamp": 2,
            "operation": "query",
        }


class FakeFeeSandboxService(FakeSandboxService):
    fee_currency = "USDT"
    fee_cost = 0.002

    def submit_auto_market_order(self, order):
        self.orders.append(order)
        return {
            "exchangeOrderId": "testnet-order-with-fee",
            "clientOrderId": order["clientOrderId"],
            "state": "filled",
            "filledQuantity": order["quantity"],
            "remainingQuantity": 0,
            "averagePrice": order["referencePrice"],
            "filledNotional": order["notionalValue"],
            "fees": [{
                "currency": self.fee_currency,
                "cost": self.fee_cost,
            }],
            "exchangeStatus": "closed",
            "timestamp": 1,
        }


class FakeBaseFeeSandboxService(FakeFeeSandboxService):
    fee_currency = "BTC"
    fee_cost = 0.001


class FakeThirdCurrencyFeeSandboxService(FakeFeeSandboxService):
    fee_currency = "BNB"
    fee_cost = 0.00001


class FakeProductionService:
    def __init__(self) -> None:
        self.triggered = False
        self.evidence_fresh = True
        self.orders = []
        self.preparations = []
        self.account_covered = True
        self.account_checks = 0
        self.control_id = "stage10-control-live"
        self.authorization_calls = 0

    def auto_live_status(self):
        return {
            "enabled": True,
            "credentialsConfigured": True,
            "controlActive": not self.triggered and self.evidence_fresh,
            "controlRecordedActive": not self.triggered,
            "evidenceFresh": self.evidence_fresh,
            "blockingReason": (
                None
                if self.evidence_fresh
                else "stage10_production_execution_control_evidence_stale"
            ),
            "controlId": self.control_id,
            "triggered": self.triggered,
        }

    def authorize_auto_session(self):
        self.authorization_calls += 1
        if self.triggered:
            raise ValueError("stage10_production_execution_kill_switch_triggered")
        if not self.evidence_fresh:
            raise ValueError("stage10_production_execution_control_evidence_stale")
        return {
            "controlId": self.control_id,
            "autoRouteSafety": {"ipRestricted": True},
        }

    def require_auto_session(self, control_id):
        if self.triggered or control_id != self.control_id:
            raise ValueError("stage10_production_execution_kill_switch_triggered")

    def verify_auto_account_coverage(
        self,
        expected_position,
        required_quote,
        *,
        control_id,
        operator,
    ):
        self.require_auto_session(control_id)
        self.account_checks += 1
        return {
            "accountCovered": self.account_covered,
            "positionCovered": self.account_covered,
            "quoteCovered": self.account_covered,
            "unexpectedOpenAutoOrderCount": 0 if self.account_covered else 1,
        }

    def submit_auto_market_order(self, order, *, control_id, operator):
        self.require_auto_session(control_id)
        self.orders.append({**order, "operator": operator})
        return {
            "exchangeOrderId": "live-order-1",
            "clientOrderId": order["clientOrderId"],
            "state": "filled",
            "filledQuantity": order["quantity"],
            "remainingQuantity": 0,
            "averagePrice": order["referencePrice"],
            "exchangeStatus": "closed",
            "timestamp": 1,
            "operation": "create",
        }

    def prepare_auto_market_order(self, order, *, control_id, operator):
        self.require_auto_session(control_id)
        self.preparations.append({**order, "operator": operator})
        return {
            "symbol": order["symbol"],
            "side": order["side"],
            "quantity": order["quantity"],
            "referencePrice": order["referencePrice"],
            "notionalValue": order["notionalValue"],
            "marketRules": {
                "source": "ccxt",
                "quantityPrecision": 0.000001,
                "pricePrecision": 0.01,
                "minimumQuantity": 0.00001,
                "minimumNotional": 1,
            },
            "executionAssumptions": {
                "feeRate": 0.001,
                "feeEstimated": True,
                "slippageBps": None,
                "slippageModel": "venue_market_fill",
            },
        }


class FakePendingProductionService(FakeProductionService):
    def __init__(self) -> None:
        super().__init__()
        self.reconciliation_calls = 0

    def submit_auto_market_order(self, order, *, control_id, operator):
        self.require_auto_session(control_id)
        self.orders.append({**order, "operator": operator})
        return {
            "exchangeOrderId": "live-order-pending",
            "clientOrderId": order["clientOrderId"],
            "state": "open",
            "filledQuantity": 0,
            "remainingQuantity": order["quantity"],
            "averagePrice": 0,
            "exchangeStatus": "open",
            "timestamp": 1,
            "operation": "create",
        }

    def reconcile_auto_market_order(self, order, evidence, *, operator):
        self.reconciliation_calls += 1
        return {
            "exchangeOrderId": evidence["exchangeOrderId"],
            "clientOrderId": order["clientOrderId"],
            "state": "filled",
            "filledQuantity": order["quantity"],
            "remainingQuantity": 0,
            "averagePrice": order["referencePrice"],
            "exchangeStatus": "closed",
            "timestamp": 2,
            "operation": "query",
        }


class FakeBinanceTestnet:
    instances = []

    def __init__(self, _config):
        self.calls = []
        self.open_orders = []
        type(self).instances.append(self)

    def set_sandbox_mode(self, enabled):
        self.calls.append(("sandbox", enabled))

    def load_markets(self):
        return {
            "BTC/USDT": {
                "active": True,
                "base": "BTC",
                "quote": "USDT",
                "precision": {"amount": 0.000001, "price": 0.01},
                "limits": {"amount": {"min": 0.00001}, "price": {}, "cost": {"min": 1}},
                "taker": 0.001,
            }
        }

    def fetch_balance(self):
        return {"free": {"BTC": 1, "USDT": 100}}

    def fetch_open_orders(self, symbol):
        self.calls.append(("fetch-open-orders", symbol))
        return self.open_orders

    def amount_to_precision(self, _symbol, value):
        return f"{value:.6f}"

    def price_to_precision(self, _symbol, value):
        return f"{value:.2f}"

    def create_order(self, symbol, order_type, side, amount, price, params):
        self.calls.append(("create", symbol, order_type, side, amount, price, params))
        return {
            "id": "testnet-1",
            "clientOrderId": params["newClientOrderId"],
            "status": "closed",
            "filled": amount,
            "amount": amount,
            "remaining": 0,
            "average": price,
            "cost": None,
            "timestamp": 1,
        }

    def create_market_buy_order_with_cost(self, symbol, cost, params):
        self.calls.append(("create-with-cost", symbol, cost, params))
        amount = cost / 60_000
        return {
            "id": "testnet-1",
            "clientOrderId": params["newClientOrderId"],
            "status": "closed",
            "filled": amount,
            "amount": amount,
            "remaining": 0,
            "average": 60_000,
            "cost": cost,
            "fee": {"currency": "USDT", "cost": 0.006},
            "timestamp": 1,
        }


class FakeKlineAdapter:
    def fetch_ohlcv(self, _request, *, limit):
        current_minute = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        values = bars(
            [100, 100, 100, 100, 100, 101, 999],
            start=current_minute - timedelta(minutes=6),
        )[-limit:]
        return (
            values,
            DataQuality(
                source="backend-market-adapter",
                is_complete=True,
                warnings=[],
                rows=len(values),
            ),
        )


class CrashAfterFirstLiveTradeStore(AuditEventStore):
    def __init__(self, path):
        super().__init__(path)
        self._crash_before_state = False
        self._crashed = False

    def record(self, event):
        if (
            event.get("eventType") == "auto_paper_trading_state"
            and self._crash_before_state
        ):
            self._crash_before_state = False
            self._crashed = True
            raise RuntimeError("simulated_state_save_crash")
        stored = super().record(event)
        if event.get("eventType") == "auto_live_trade" and not self._crashed:
            self._crash_before_state = True
        return stored

    def record_if_absent(self, event):
        stored = super().record_if_absent(event)
        if event.get("eventType") == "auto_live_trade" and not self._crashed:
            self._crash_before_state = True
        return stored


class CrashAfterLiveOrderIntentStore(AuditEventStore):
    def __init__(self, path):
        super().__init__(path)
        self._crash_before_state = False

    def record(self, event):
        if (
            event.get("eventType") == "auto_paper_trading_state"
            and self._crash_before_state
        ):
            self._crash_before_state = False
            raise RuntimeError("simulated_order_state_save_crash")
        return super().record(event)

    def record_if_absent(self, event):
        stored = super().record_if_absent(event)
        if event.get("eventType") == "auto_live_order_intent":
            self._crash_before_state = True
        return stored


def bars(prices: list[float], *, start: datetime | None = None) -> list[OHLCVBar]:
    started = start or datetime(2026, 7, 26, tzinfo=timezone.utc)
    return [
        OHLCVBar(
            symbol="BTC/USDT",
            market="crypto",
            timeframe="1m",
            timestamp=started + timedelta(minutes=index),
            open=price,
            high=price,
            low=price,
            close=price,
            volume=1,
        )
        for index, price in enumerate(prices)
    ]


class AutoPaperTradingTests(unittest.TestCase):
    def test_stale_market_data_blocks_ai_and_trading(self):
        class CountingProvider(FakeProvider):
            calls = 0

            def assess(self, **kwargs):
                self.calls += 1
                return super().assess(**kwargs)

        class StaleKlineAdapter:
            def fetch_ohlcv(self, _request, *, limit):
                values = bars(
                    [100, 100, 100, 100, 100, 101, 102],
                    start=datetime.now(timezone.utc) - timedelta(minutes=20),
                )
                return values[-limit:], DataQuality(
                    source="stale-market-adapter",
                    is_complete=True,
                    warnings=[],
                    rows=len(values[-limit:]),
                )

        with tempfile.TemporaryDirectory() as directory:
            provider = CountingProvider()
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": provider},
                ),
            )
            service.configure({"enabled": True, "triggerPct": 0.3})

            result, _quality = evaluate_auto_paper_trading_once(
                service,
                cache=MarketDataCache(Path(directory) / "market.sqlite"),
                adapter=StaleKlineAdapter(),
            )

            self.assertEqual(result["state"]["status"], "data_blocked")
            self.assertEqual(result["state"]["tradeCount"], 0)
            self.assertEqual(provider.calls, 0)

    def test_current_open_candle_is_excluded_from_ai_evaluation(self):
        current_minute = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        expected_bars = bars(
            [100, 100, 100, 100, 100, 101, 999],
            start=current_minute - timedelta(minutes=6),
        )

        class CurrentKlineAdapter:
            def fetch_ohlcv(self, _request, *, limit):
                values = expected_bars[-limit:]
                return values, DataQuality(
                    source="current-market-adapter",
                    is_complete=True,
                    warnings=[],
                    rows=len(values),
                )

        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": FakeProvider()},
                ),
            )
            service.configure({"enabled": True, "triggerPct": 0.3})

            result, _quality = evaluate_auto_paper_trading_once(
                service,
                cache=MarketDataCache(Path(directory) / "market.sqlite"),
                adapter=CurrentKlineAdapter(),
            )

            self.assertEqual(result["state"]["status"], "traded")
            self.assertEqual(result["state"]["lastPrice"], 101)
            self.assertEqual(
                result["state"]["lastBarTimestamp"],
                expected_bars[-2].timestamp.isoformat(),
            )

    def test_gapped_closed_candles_block_account_ai_and_order_routing(self):
        class CountingProvider(FakeProvider):
            calls = 0

            def assess(self, **kwargs):
                self.calls += 1
                return super().assess(**kwargs)

        current_minute = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        complete = bars(
            [100, 100, 100, 100, 100, 100, 101, 102],
            start=current_minute - timedelta(minutes=8),
        )
        gapped = [*complete[:3], *complete[4:]]

        class GappedKlineAdapter:
            def fetch_ohlcv(self, _request, *, limit):
                values = gapped[-limit:]
                return values, DataQuality(
                    source="gapped-market-adapter",
                    is_complete=True,
                    warnings=[],
                    rows=len(values),
                )

        with tempfile.TemporaryDirectory() as directory:
            provider = CountingProvider()
            production = FakeProductionService()
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": provider},
                ),
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })

            result, _quality = evaluate_auto_paper_trading_once(
                service,
                cache=MarketDataCache(Path(directory) / "market.sqlite"),
                adapter=GappedKlineAdapter(),
            )

            self.assertEqual(result["state"]["status"], "data_blocked")
            self.assertEqual(production.account_checks, 0)
            self.assertEqual(provider.calls, 0)
            self.assertEqual(production.orders, [])

    def test_incomplete_market_data_enters_visible_blocked_state(self):
        class IncompleteKlineAdapter:
            def fetch_ohlcv(self, _request, *, limit):
                values = bars(
                    [100, 100, 100, 100, 100, 101, 102],
                    start=datetime.now(timezone.utc) - timedelta(minutes=7),
                )[-limit:]
                return values, DataQuality(
                    source="incomplete-market-adapter",
                    is_complete=False,
                    warnings=["missing candle"],
                    rows=len(values),
                )

        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((), {}),
            )
            service.configure({"enabled": True})

            result, _quality = evaluate_auto_paper_trading_once(
                service,
                cache=MarketDataCache(Path(directory) / "market.sqlite"),
                adapter=IncompleteKlineAdapter(),
            )

            self.assertEqual(result["state"]["status"], "data_blocked")
            self.assertIn("不完整", result["state"]["detail"])

    def test_backend_runner_evaluates_enabled_session_without_http_request(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            service = AutoPaperTradingService(store, registry)
            service.configure({"enabled": True, "triggerPct": 0.3})
            evaluated = Event()

            def evaluate_once() -> None:
                service.evaluate(
                    bars([100, 100, 100, 100, 100, 101]),
                    data_source="backend-runner",
                )
                evaluated.set()

            runner = AutoPaperTradingRunner(
                service,
                evaluate_once,
                interval_seconds=0.01,
            )
            runner.start()
            try:
                self.assertTrue(evaluated.wait(0.5))
            finally:
                runner.stop()

            state = service.snapshot()["state"]
            self.assertEqual(state["dataSource"], "backend-runner")
            self.assertEqual(state["tradeCount"], 1)
            self.assertFalse(runner.running)

    def test_backend_runner_exposes_running_and_stopped_states(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((), {}),
            )
            runner = AutoPaperTradingRunner(
                service,
                lambda: None,
                interval_seconds=60,
            )

            runner.start()
            self.assertEqual(service.snapshot()["state"]["runnerState"], "running")
            self.assertEqual(service.snapshot()["state"]["runnerIntervalSeconds"], 60)

            runner.stop()
            self.assertEqual(service.snapshot()["state"]["runnerState"], "stopped")

    def test_backend_runner_records_heartbeat_and_recovery_after_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((), {}),
            )
            service.configure({"enabled": True})
            recovered = Event()
            calls = 0

            def evaluate_once():
                nonlocal calls
                calls += 1
                if calls == 1:
                    raise RuntimeError("temporary_market_failure")
                recovered.set()

            runner = AutoPaperTradingRunner(
                service,
                evaluate_once,
                interval_seconds=0.01,
            )
            runner.start()
            try:
                self.assertTrue(recovered.wait(0.5))
                deadline = time.monotonic() + 0.5
                while time.monotonic() < deadline:
                    state = service.snapshot()["state"]
                    if state.get("runnerCycleCount", 0) >= 2:
                        break
                    time.sleep(0.01)
            finally:
                runner.stop()

            state = service.snapshot()["state"]
            self.assertGreaterEqual(state["runnerCycleCount"], 2)
            self.assertEqual(state["consecutiveRunnerFailures"], 0)
            self.assertIsNotNone(state["lastRunnerCycleAt"])
            self.assertIsNotNone(state["lastRunnerSuccessAt"])
            self.assertIsNotNone(state["lastRunnerErrorAt"])
            self.assertEqual(state["lastRunnerError"], "temporary_market_failure")
            self.assertEqual(state["status"], "monitoring")

    def test_snapshot_classifies_runner_health_delay_offline_and_recovery(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((), {}),
            )
            started = datetime(2026, 7, 27, 8, tzinfo=timezone.utc)

            with patch("quant_core.auto_paper_trading._now", return_value=started):
                service.record_runner_state("running", 35)
                service.record_runner_cycle("temporary_failure")
                blocked = service.snapshot()["state"]["runnerHealth"]

            with patch(
                "quant_core.auto_paper_trading._now",
                return_value=started + timedelta(seconds=35),
            ):
                service.record_runner_cycle()
                recovered = service.snapshot()["state"]["runnerHealth"]

            with patch(
                "quant_core.auto_paper_trading._now",
                return_value=started + timedelta(seconds=150),
            ):
                delayed = service.snapshot()["state"]["runnerHealth"]
                service.record_runner_state("stopped", 35)
                offline = service.snapshot()["state"]["runnerHealth"]

            self.assertEqual(blocked["status"], "blocked")
            self.assertEqual(blocked["reason"], "runner_failures")
            self.assertFalse(blocked["recovered"])
            self.assertEqual(recovered["status"], "running")
            self.assertTrue(recovered["recovered"])
            self.assertEqual(recovered["heartbeatAgeSeconds"], 0)
            self.assertEqual(delayed["status"], "delayed")
            self.assertEqual(delayed["reason"], "heartbeat_stale")
            self.assertEqual(delayed["staleAfterSeconds"], 105)
            self.assertEqual(offline["status"], "offline")
            self.assertEqual(offline["reason"], "runner_stopped")

    def test_api_runner_fetches_market_data_without_frontend_evaluation_request(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )

            class Handler(QuantApiHandler):
                audit_event_store = store
                ai_review_provider_registry = registry
                cache = MarketDataCache(Path(directory) / "market.sqlite")
                kline_adapter = FakeKlineAdapter()
                execution_adapter_health_environ = {}
                execution_adapter_health_exchange_factory = None
                stage6_sandbox_route_factory = None

            AutoPaperTradingService(store, registry).configure(
                {"enabled": True, "triggerPct": 0.3}
            )
            runner = build_auto_paper_trading_runner(
                Handler,
                interval_seconds=0.01,
            )
            runner.start()
            try:
                deadline = time.monotonic() + 1
                while time.monotonic() < deadline:
                    state = AutoPaperTradingService(store, registry).snapshot()["state"]
                    if state["dataSource"] == "backend-market-adapter":
                        break
                    time.sleep(0.01)
                else:
                    self.fail("backend runner did not evaluate market data")
            finally:
                runner.stop()

            self.assertEqual(state["tradeCount"], 1)

    def test_manual_reconciliation_api_returns_snapshot_without_evaluating_market_data(self):
        class ReconciliationService:
            def __init__(self) -> None:
                self.reconciliation_calls = 0
                self.snapshot_calls = 0

            def reconcile_pending_order(self):
                self.reconciliation_calls += 1
                return None

            def snapshot(self):
                self.snapshot_calls += 1
                return {"state": {"status": "order_closed"}}

        service = ReconciliationService()

        class Handler(QuantApiHandler):
            def _auto_paper_trading_service(self):
                return service

        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(*server.server_address, timeout=5)
        try:
            connection.request(
                "POST",
                "/api/execution/auto-paper-trading/reconciliations",
            )
            response = connection.getresponse()
            payload = json.loads(response.read())
        finally:
            connection.close()
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

        self.assertEqual(response.status, 200)
        self.assertEqual(payload, {"state": {"status": "order_closed"}})
        self.assertEqual(service.reconciliation_calls, 1)
        self.assertEqual(service.snapshot_calls, 1)

    def test_backend_and_manual_evaluations_cannot_duplicate_the_same_bar(self):
        provider_started = Event()
        release_provider = Event()

        class BlockingProvider(FakeProvider):
            def assess(self, **kwargs):
                provider_started.set()
                release_provider.wait(0.5)
                return super().assess(**kwargs)

        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": BlockingProvider()},
            )
            service = AutoPaperTradingService(store, registry)
            service.configure({"enabled": True, "triggerPct": 0.3})
            rising = bars([100, 100, 100, 100, 100, 101])
            runner = AutoPaperTradingRunner(
                service,
                lambda: service.evaluate(rising, data_source="backend-runner"),
                interval_seconds=60,
            )
            runner.start()
            self.assertTrue(provider_started.wait(0.5))

            manual_done = Event()

            def evaluate_manually() -> None:
                service.evaluate(rising, data_source="manual")
                manual_done.set()

            manual = Thread(target=evaluate_manually)
            manual.start()
            self.assertFalse(manual_done.wait(0.02))
            release_provider.set()
            manual.join(timeout=0.5)
            runner.stop()

            state = service.snapshot()["state"]
            self.assertEqual(state["tradeCount"], 1)
            self.assertEqual(store.count(event_type="auto_paper_trade"), 1)

    def test_live_mode_requires_confirmation_and_routes_through_stage10_control(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            production = FakeProductionService()
            service = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            )
            with self.assertRaisesRegex(ValueError, "live_confirmation_required"):
                service.configure({
                    "enabled": True,
                    "executionMode": "live",
                    "liveOperator": "wenqingjie",
                })
            configured = service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })
            self.assertTrue(configured["liveTradingAllowed"])
            self.assertTrue(configured["orderSubmissionEnabled"])
            self.assertFalse(configured["liveBlockedBoundary"])

            production.evidence_fresh = False
            authorized = service.snapshot()
            self.assertFalse(authorized["productionLive"]["evidenceFresh"])
            self.assertTrue(authorized["liveTradingAllowed"])
            self.assertTrue(authorized["orderSubmissionEnabled"])
            self.assertFalse(authorized["liveBlockedBoundary"])

            updated = service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.4,
            })
            self.assertEqual(updated["state"]["triggerPct"], 0.4)
            self.assertEqual(production.authorization_calls, 1)
            self.assertTrue(updated["liveTradingAllowed"])

            result = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            self.assertEqual(len(production.orders), 1)
            self.assertEqual(production.orders[0]["operator"], "wenqingjie")
            self.assertEqual(result["state"]["lastTrade"]["executionMode"], "live")
            self.assertEqual(result["state"]["lastOrderResult"]["executionMode"], "live")
            self.assertEqual(result["state"]["lastOrderResult"]["state"], "filled")
            self.assertEqual(
                result["state"]["lastOrderResult"]["orderIntentId"],
                result["state"]["lastDecisionContract"]["orderIntent"]["orderIntentId"],
            )
            self.assertEqual(store.count(event_type="auto_live_trade"), 1)
            self.assertTrue(result["routeExecuted"])

            production.triggered = True
            stopped = service.evaluate(
                bars(
                    [101, 101, 101, 101, 101, 102],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            self.assertEqual(stopped["state"]["status"], "risk_paused")
            self.assertEqual(len(production.orders), 1)
            service.configure({"enabled": False})
            with self.assertRaisesRegex(
                ValueError,
                "live_position_or_order_must_be_reconciled",
            ):
                service.configure({"enabled": False, "executionMode": "paper"})

    def test_live_session_expires_after_eight_hours_and_blocks_new_orders(self):
        with tempfile.TemporaryDirectory() as directory:
            production = FakeProductionService()
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": FakeProvider()},
                ),
                production=production,  # type: ignore[arg-type]
            )
            started = datetime(2026, 7, 27, 8, tzinfo=timezone.utc)
            with patch("quant_core.auto_paper_trading._now", return_value=started):
                configured = service.configure({
                    "enabled": True,
                    "executionMode": "live",
                    "liveConfirmed": True,
                    "liveOperator": "wenqingjie",
                    "triggerPct": 0.3,
                })

            with patch(
                "quant_core.auto_paper_trading._now",
                return_value=started + timedelta(hours=8, seconds=1),
            ):
                expired = service.evaluate(
                    bars([100, 100, 100, 100, 100, 101]),
                    data_source="test",
                )

            self.assertEqual(
                configured["state"]["liveAuthorizedUntil"],
                (started + timedelta(hours=8)).isoformat(),
            )
            self.assertEqual(expired["state"]["status"], "risk_paused")
            self.assertEqual(production.account_checks, 0)
            self.assertEqual(production.orders, [])

    def test_zero_hour_live_session_remains_authorized_until_manually_revoked(self):
        with tempfile.TemporaryDirectory() as directory:
            production = FakeProductionService()
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": FakeProvider()},
                ),
                production=production,  # type: ignore[arg-type]
                live_session_ttl_hours=0,
            )
            started = datetime(2026, 7, 27, 8, tzinfo=timezone.utc)
            with patch("quant_core.auto_paper_trading._now", return_value=started):
                configured = service.configure({
                    "enabled": True,
                    "executionMode": "live",
                    "liveConfirmed": True,
                    "liveOperator": "wenqingjie",
                })
            with patch(
                "quant_core.auto_paper_trading._now",
                return_value=started + timedelta(days=3650),
            ):
                later = service.snapshot()

            self.assertEqual(configured["state"]["liveSessionTtlHours"], 0)
            self.assertIsNone(configured["state"]["liveAuthorizedUntil"])
            self.assertTrue(later["liveTradingAllowed"])

    def test_runtime_ttl_change_applies_only_to_the_next_live_authorization(self):
        with tempfile.TemporaryDirectory() as directory:
            production = FakeProductionService()
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus(
                        "openai-compatible",
                        True,
                        "fake",
                        "https://example.invalid",
                    ),
                ),
                {"openai-compatible": FakeProvider()},
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                registry,
                production=production,  # type: ignore[arg-type]
            )
            started = datetime(2026, 7, 27, 8, tzinfo=timezone.utc)
            with patch("quant_core.auto_paper_trading._now", return_value=started):
                service.configure({
                    "enabled": True,
                    "executionMode": "live",
                    "liveConfirmed": True,
                    "liveOperator": "wenqingjie",
                })
            service.reload_runtime(
                registry,
                None,
                production,  # type: ignore[arg-type]
                live_session_ttl_hours=0,
            )
            after_expiry = started + timedelta(hours=9)
            with patch("quant_core.auto_paper_trading._now", return_value=after_expiry):
                expired = service.snapshot()
                reauthorized = service.configure({
                    "liveConfirmed": True,
                    "liveOperator": "wenqingjie",
                })

            self.assertFalse(expired["liveTradingAllowed"])
            self.assertEqual(reauthorized["state"]["liveSessionTtlHours"], 0)
            self.assertIsNone(reauthorized["state"]["liveAuthorizedUntil"])
            self.assertTrue(reauthorized["liveTradingAllowed"])
            self.assertEqual(production.authorization_calls, 2)

    def test_expired_live_session_still_reconciles_existing_order_read_only(self):
        with tempfile.TemporaryDirectory() as directory:
            production = FakePendingProductionService()
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": FakeProvider()},
                ),
                production=production,  # type: ignore[arg-type]
            )
            started = datetime(2026, 7, 27, 8, tzinfo=timezone.utc)
            with patch("quant_core.auto_paper_trading._now", return_value=started):
                service.configure({
                    "enabled": True,
                    "executionMode": "live",
                    "liveConfirmed": True,
                    "liveOperator": "wenqingjie",
                    "triggerPct": 0.3,
                })
                pending = service.evaluate(
                    bars([100, 100, 100, 100, 100, 101]),
                    data_source="test",
                )

            with patch(
                "quant_core.auto_paper_trading._now",
                return_value=started + timedelta(hours=8, seconds=1),
            ):
                reconciled = service.evaluate(
                    bars([100, 100, 100, 100, 101, 102]),
                    data_source="test",
                )

            self.assertEqual(pending["state"]["status"], "order_pending")
            self.assertEqual(reconciled["state"]["tradeCount"], 1)
            self.assertEqual(production.reconciliation_calls, 1)
            self.assertEqual(len(production.orders), 1)

    def test_live_account_mismatch_blocks_ai_and_order_submission(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            production = FakeProductionService()
            production.account_covered = False
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": FakeProvider()},
                ),
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })

            result = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            self.assertEqual(result["state"]["status"], "account_mismatch")
            self.assertFalse(result["state"]["lastAccountCheck"]["accountCovered"])
            self.assertEqual(production.account_checks, 1)
            self.assertEqual(production.orders, [])
            self.assertEqual(store.count(event_type="auto_live_trade"), 0)

    def test_pending_live_order_is_reconciled_and_recorded_once(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            production = FakePendingProductionService()
            service = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })
            rising = bars([100, 100, 100, 100, 100, 101])

            pending = service.evaluate(rising, data_source="test")
            self.assertEqual(pending["state"]["status"], "order_pending")
            self.assertEqual(pending["state"]["tradeCount"], 0)
            pending_result = pending["state"]["lastOrderResult"]
            self.assertEqual(pending_result["executionMode"], "live")
            self.assertEqual(pending_result["state"], "open")

            filled = service.evaluate(rising, data_source="test")
            duplicate = service.evaluate(rising, data_source="test")

            self.assertEqual(production.reconciliation_calls, 1)
            self.assertEqual(len(production.orders), 1)
            self.assertEqual(filled["state"]["lastLiveOrder"]["state"], "filled")
            self.assertEqual(filled["state"]["lastOrderResult"]["state"], "filled")
            self.assertEqual(
                filled["state"]["lastOrderResult"]["orderIntentId"],
                pending_result["orderIntentId"],
            )
            self.assertEqual(filled["state"]["tradeCount"], 1)
            self.assertGreater(filled["state"]["position"], 0)
            self.assertEqual(duplicate["state"]["tradeCount"], 1)
            self.assertEqual(store.count(event_type="auto_live_trade"), 1)

    def test_live_trade_audit_is_idempotent_across_state_save_crash(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CrashAfterFirstLiveTradeStore(
                Path(directory) / "audit.sqlite"
            )
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus(
                        "openai-compatible",
                        True,
                        "fake",
                        "https://example.invalid",
                    ),
                ),
                {"openai-compatible": FakeProvider()},
            )
            production = FakePendingProductionService()
            service = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })
            rising = bars([100, 100, 100, 100, 100, 101])
            service.evaluate(rising, data_source="test")

            with self.assertRaisesRegex(
                RuntimeError,
                "simulated_state_save_crash",
            ):
                service.evaluate(rising, data_source="test")
            self.assertEqual(store.count(event_type="auto_live_trade"), 1)

            recovered = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            ).evaluate(rising, data_source="test")

            self.assertEqual(recovered["state"]["tradeCount"], 1)
            self.assertEqual(store.count(event_type="auto_live_trade"), 1)

    def test_live_order_intent_recovers_after_route_succeeds_before_state_save(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CrashAfterLiveOrderIntentStore(
                Path(directory) / "audit.sqlite"
            )
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus(
                        "openai-compatible",
                        True,
                        "fake",
                        "https://example.invalid",
                    ),
                ),
                {"openai-compatible": FakeProvider()},
            )
            production = FakePendingProductionService()
            service = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })
            started = datetime(2026, 7, 26, tzinfo=timezone.utc)

            with self.assertRaisesRegex(
                RuntimeError,
                "simulated_order_state_save_crash",
            ):
                service.evaluate(
                    bars([100, 100, 100, 100, 100, 101], start=started),
                    data_source="test",
                )
            self.assertEqual(len(production.orders), 1)
            self.assertEqual(
                service.snapshot()["state"]["lastLiveOrder"]["state"],
                "submission_pending",
            )
            self.assertEqual(
                store.count(event_type="auto_live_order_intent"),
                1,
            )

            recovered = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            ).evaluate(
                bars(
                    [100, 100, 100, 100, 101, 102],
                    start=started + timedelta(minutes=1),
                ),
                data_source="test",
            )

            self.assertEqual(len(production.orders), 1)
            self.assertEqual(production.reconciliation_calls, 1)
            self.assertEqual(recovered["state"]["tradeCount"], 1)
            self.assertEqual(
                recovered["state"]["lastLiveOrder"]["request"]["clientOrderId"],
                production.orders[0]["clientOrderId"],
            )

    def test_backend_runner_reconciles_pending_order_while_monitoring_is_paused(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            production = FakePendingProductionService()
            service = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })
            rising = bars([100, 100, 100, 100, 100, 101])
            service.evaluate(rising, data_source="test")
            service.configure({"enabled": False})
            market_data_calls = 0

            def evaluate_once():
                nonlocal market_data_calls
                market_data_calls += 1
                service.evaluate(rising, data_source="backend-runner")

            runner = AutoPaperTradingRunner(
                service,
                evaluate_once,
                interval_seconds=0.01,
            )

            runner.start()
            try:
                deadline = time.monotonic() + 0.5
                while service.snapshot()["state"]["tradeCount"] == 0:
                    if time.monotonic() >= deadline:
                        self.fail("backend runner did not reconcile pending order")
                    time.sleep(0.01)
            finally:
                runner.stop()

            state = service.snapshot()["state"]
            self.assertFalse(state["enabled"])
            self.assertEqual(state["status"], "paused")
            self.assertEqual(state["tradeCount"], 1)
            self.assertEqual(len(production.orders), 1)
            self.assertEqual(production.reconciliation_calls, 1)
            self.assertEqual(market_data_calls, 0)

    def test_manual_reconciliation_returns_updated_state_while_monitoring_is_paused(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            production = FakePendingProductionService()
            service = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
            })
            service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            service.configure({"enabled": False})

            result = service.reconcile_pending_order()

            self.assertIsNotNone(result)
            self.assertFalse(result["state"]["enabled"])
            self.assertEqual(result["state"]["status"], "paused")
            self.assertEqual(result["state"]["tradeCount"], 1)
            self.assertEqual(production.reconciliation_calls, 1)
            self.assertEqual(len(production.orders), 1)

    def test_testnet_mode_requires_explicit_confirmation(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((), {}),
                FakeSandboxService(),  # type: ignore[arg-type]
            )
            with self.assertRaisesRegex(ValueError, "testnet_confirmation_required"):
                service.configure({"enabled": True, "executionMode": "testnet"})

    def test_low_confidence_ai_signal_trades_once_and_risk_stop_can_exit(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai", False, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                    ProviderStatus("ollama", False, None, None),
                ),
                {"openai-compatible": FakeProvider()},
            )
            service = AutoPaperTradingService(store, registry)
            state = service.configure({"enabled": True, "triggerPct": 0.3})
            self.assertTrue(state["paperOnly"])
            self.assertFalse(state["liveTradingAllowed"])

            rising = bars([100, 100, 100, 100, 100, 101])
            bought = service.evaluate(rising, data_source="test")
            self.assertEqual(bought["state"]["lastDecision"]["action"], "buy")
            self.assertEqual(bought["state"]["lastDecision"]["confidence"], 0.01)
            self.assertGreater(bought["state"]["position"], 0)
            self.assertEqual(bought["state"]["tradeCount"], 1)

            duplicate = service.evaluate(rising, data_source="test")
            self.assertEqual(duplicate["state"]["tradeCount"], 1)

            next_rising = bars(
                [101, 101, 101, 101, 101, 102],
                start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
            )
            held = service.evaluate(next_rising, data_source="test")
            self.assertEqual(
                held["state"]["lastDecisionContract"]["decisionProposal"]["action"],
                "buy",
            )
            self.assertEqual(
                held["state"]["lastDecisionContract"]["signal"]["action"],
                "hold",
            )
            self.assertEqual(held["state"]["lastDecision"]["action"], "hold")
            self.assertEqual(
                held["state"]["lastDecision"]["reason"],
                held["state"]["lastDecisionContract"]["signal"]["reason"],
            )
            self.assertEqual(held["state"]["tradeCount"], 1)

            falling = bars(
                [101, 101, 101, 101, 101, 98],
                start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
            )
            sold = service.evaluate(falling, data_source="test")
            self.assertEqual(sold["state"]["lastDecision"]["action"], "sell")
            self.assertEqual(sold["state"]["lastDecision"]["providerId"], "risk")
            self.assertEqual(sold["state"]["position"], 0)
            self.assertEqual(sold["state"]["tradeCount"], 2)
            self.assertEqual(store.count(event_type="auto_paper_trade"), 2)

    def test_evaluation_exposes_stable_snapshot_proposal_and_signal_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry((), {}),
            )
            service.configure({"enabled": True, "triggerPct": 5})
            complete_bars = bars([100, 100, 100, 100, 100, 101])

            evaluated = service.evaluate(complete_bars, data_source="test")
            duplicate = service.evaluate(complete_bars, data_source="test")

            contract = evaluated["state"]["lastDecisionContract"]
            self.assertEqual(contract["contractVersion"], "aiqt-decision-v1")
            self.assertEqual(contract["marketSnapshot"]["market"], "crypto")
            self.assertEqual(contract["marketSnapshot"]["symbol"], "BTC/USDT")
            self.assertEqual(contract["marketSnapshot"]["timeframe"], "1m")
            self.assertEqual(contract["marketSnapshot"]["barCount"], 6)
            self.assertEqual(len(contract["marketSnapshot"]["snapshotHash"]), 64)
            self.assertEqual(len(contract["strategyRevision"]), 64)
            self.assertEqual(contract["decisionProposal"]["providerId"], "rules")
            self.assertEqual(contract["decisionProposal"]["action"], "hold")
            self.assertIsNone(contract["decisionProposal"]["model"])
            self.assertIsNone(contract["decisionProposal"]["usage"])
            self.assertEqual(contract["decisionProposal"]["latencyMs"], 0)
            self.assertEqual(contract["signal"]["action"], "hold")
            self.assertEqual(contract["signal"]["strategyId"], "auto-pct-v1")
            self.assertEqual(contract["signal"]["horizon"], "1m")
            self.assertEqual(
                contract["signal"]["evaluatedBarAt"],
                complete_bars[-1].timestamp.isoformat(),
            )
            self.assertEqual(
                datetime.fromisoformat(contract["signal"]["expiresAt"]),
                datetime.fromisoformat(contract["signal"]["generatedAt"])
                + timedelta(minutes=1),
            )
            self.assertEqual(
                contract["signal"]["proposalId"],
                contract["decisionProposal"]["proposalId"],
            )
            self.assertEqual(contract["portfolioTarget"]["currentQuantity"], 0)
            self.assertEqual(contract["portfolioTarget"]["targetQuantity"], 0)
            self.assertEqual(
                contract["portfolioTarget"]["signalId"],
                contract["signal"]["signalId"],
            )
            self.assertEqual(contract["riskAdjustedTarget"]["decision"], "preserve")
            self.assertEqual(contract["riskAdjustedTarget"]["approvedTargetQuantity"], 0)
            self.assertEqual(
                contract["riskAdjustedTarget"]["evidence"],
                {
                    "dailyDrawdownPct": 0,
                    "dailyLossDrawdownPct": 0,
                    "dailyLossLimitPct": 2,
                    "dailyProfitDrawdownPct": 0,
                    "dailyProfitDrawdownLimitPct": 2,
                    "recentTradeCount": 0,
                    "maxTradesPerHour": 3,
                },
            )
            self.assertEqual(
                contract["riskAdjustedTarget"]["portfolioTargetId"],
                contract["portfolioTarget"]["portfolioTargetId"],
            )
            self.assertIsNone(contract["orderIntent"])
            self.assertIsNone(evaluated["state"]["lastOrderResult"])
            self.assertEqual(duplicate["state"]["lastDecisionContract"], contract)
            restarted = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry((), {}),
            ).snapshot()
            self.assertEqual(restarted["state"]["lastDecisionContract"], contract)

    def test_approved_target_generates_a_stable_evidence_bound_order_intent(self):
        class CountingProvider(FakeProvider):
            def __init__(self):
                self.calls = 0

            def assess(self, **kwargs):
                self.calls += 1
                return super().assess(**kwargs)

        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            provider = CountingProvider()
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus(
                        "openai-compatible",
                        True,
                        "fake",
                        "https://example.invalid",
                    ),
                ),
                {"openai-compatible": provider},
            )
            service = AutoPaperTradingService(store, registry)
            service.configure({"enabled": True, "triggerPct": 0.3})
            rising = bars([100, 100, 100, 100, 100, 101])

            evaluated = service.evaluate(rising, data_source="test")
            duplicate = service.evaluate(rising, data_source="test")

            contract = evaluated["state"]["lastDecisionContract"]
            intent = contract["orderIntent"]
            proposal = contract["decisionProposal"]
            self.assertEqual(proposal["model"], "fake")
            self.assertEqual(
                proposal["promptTemplateVersion"],
                "aiqt-auto-decision-v1",
            )
            self.assertEqual(
                proposal["outputSchemaVersion"],
                "aiqt-auto-decision-output-v1",
            )
            self.assertEqual(
                proposal["usage"],
                {"inputTokens": 1, "outputTokens": 1, "totalTokens": 2},
            )
            self.assertEqual(proposal["latencyMs"], 1)
            self.assertEqual(
                proposal["evidenceReferences"],
                [contract["marketSnapshot"]["snapshotHash"]],
            )
            account_check = contract["accountCheck"]
            self.assertEqual(account_check["source"], "strategy_ledger")
            self.assertTrue(account_check["accountCovered"])
            self.assertEqual(
                intent["accountCheckId"],
                account_check["accountCheckId"],
            )
            self.assertEqual(len(intent["orderIntentId"]), 64)
            self.assertEqual(intent["side"], "buy")
            self.assertEqual(intent["type"], "market")
            self.assertEqual(intent["symbol"], "BTC/USDT")
            self.assertEqual(
                intent["quantity"],
                contract["riskAdjustedTarget"]["approvedDeltaQuantity"],
            )
            self.assertEqual(
                intent["marketSnapshotHash"],
                contract["marketSnapshot"]["snapshotHash"],
            )
            self.assertEqual(
                intent["proposalId"],
                contract["decisionProposal"]["proposalId"],
            )
            self.assertEqual(intent["signalId"], contract["signal"]["signalId"])
            self.assertEqual(
                intent["portfolioTargetId"],
                contract["portfolioTarget"]["portfolioTargetId"],
            )
            self.assertEqual(
                intent["riskAdjustedTargetId"],
                contract["riskAdjustedTarget"]["riskAdjustedTargetId"],
            )
            result = evaluated["state"]["lastOrderResult"]
            self.assertEqual(result["executionMode"], "paper")
            self.assertEqual(result["state"], "filled")
            self.assertEqual(result["orderIntentId"], intent["orderIntentId"])
            self.assertEqual(result["filledQuantity"], intent["quantity"])
            self.assertEqual(
                result["fees"],
                [{
                    "currency": "USDT",
                    "cost": round(result["filledNotional"] * 0.001, 8),
                }],
            )
            self.assertTrue(result["feeEstimated"])
            self.assertEqual(result["clientOrderId"], "")
            self.assertEqual(duplicate["state"]["lastDecisionContract"], contract)
            self.assertEqual(duplicate["state"]["lastOrderResult"], result)
            replayed = replay_decision_proposal(
                proposal,
                bars=rising,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                data_source="test",
                strategy_id="auto-pct-v1",
                current_quantity=0,
                reference_price=101,
                available_cash=100,
                order_notional=10,
                fee_rate=0.001,
                daily_drawdown_pct=0,
                daily_loss_limit_pct=2,
                recent_trade_count=0,
                max_trades_per_hour=3,
                generated_at=datetime.fromisoformat(proposal["proposedAt"]),
                profit_drawdown_pct=0,
                profit_drawdown_limit_pct=2,
            )
            self.assertEqual(provider.calls, 1)
            self.assertEqual(replayed, contract)

    def test_frequency_limit_does_not_block_a_risk_reducing_exit_target(self):
        with tempfile.TemporaryDirectory() as directory:
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus(
                        "openai-compatible",
                        True,
                        "fake",
                        "https://example.invalid",
                    ),
                ),
                {"openai-compatible": FakeProvider()},
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                registry,
            )
            service.configure({
                "enabled": True,
                "triggerPct": 0.3,
                "maxTradesPerHour": 1,
            })
            bought = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            self.assertGreater(bought["state"]["position"], 0)

            exited = service.evaluate(
                bars(
                    [101, 101, 101, 101, 101, 98],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(exited["state"]["status"], "traded")
            self.assertEqual(exited["state"]["position"], 0)
            self.assertEqual(exited["state"]["tradeCount"], 2)
            self.assertEqual(
                exited["state"]["lastDecisionContract"]["portfolioTarget"]["targetQuantity"],
                0,
            )
            self.assertEqual(
                exited["state"]["lastDecisionContract"]["riskAdjustedTarget"]["decision"],
                "preserve",
            )

            blocked = service.evaluate(
                bars(
                    [98, 98, 98, 98, 98, 99],
                    start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            blocked_contract = blocked["state"]["lastDecisionContract"]
            self.assertEqual(blocked["state"]["status"], "risk_paused")
            self.assertEqual(blocked["state"]["position"], 0)
            self.assertEqual(blocked["state"]["tradeCount"], 2)
            self.assertEqual(blocked_contract["signal"]["action"], "buy")
            self.assertGreater(blocked_contract["portfolioTarget"]["targetQuantity"], 0)
            self.assertEqual(blocked_contract["riskAdjustedTarget"]["decision"], "reject")
            self.assertEqual(
                blocked_contract["riskAdjustedTarget"]["approvedTargetQuantity"],
                0,
            )
            self.assertIsNone(blocked_contract["orderIntent"])

    def test_profit_drawdown_halts_new_risk_but_still_allows_an_exit(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": FakeProvider()},
                ),
            )
            configured = service.configure({
                "enabled": True,
                "triggerPct": 0.3,
                "takeProfitPct": 50,
                "dailyLossLimitPct": 20,
                "dailyProfitDrawdownLimitPct": 0.5,
                "maxTradesPerHour": 60,
            })
            self.assertEqual(configured["state"]["dailyProfitDrawdownLimitPct"], 0.5)

            bought = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            peaked = service.evaluate(
                bars(
                    [120, 120, 120, 120, 120, 120],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            pulled_back = service.evaluate(
                bars(
                    [110, 110, 110, 110, 110, 110],
                    start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            exited = service.evaluate(
                bars(
                    [98, 98, 98, 98, 98, 98],
                    start=datetime(2026, 7, 26, 3, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            blocked = service.evaluate(
                bars(
                    [98, 98, 98, 98, 98, 99],
                    start=datetime(2026, 7, 26, 4, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertGreater(bought["state"]["position"], 0)
            self.assertGreater(peaked["state"]["dailyPeakEquity"], 100)
            self.assertEqual(pulled_back["state"]["status"], "risk_paused")
            self.assertGreater(pulled_back["state"]["dailyProfitDrawdownPct"], 0.5)
            self.assertEqual(
                pulled_back["state"]["dailyRiskHaltReason"],
                "已达到当日盈利回撤上限。",
            )
            self.assertEqual(exited["state"]["status"], "traded")
            self.assertEqual(exited["state"]["position"], 0)
            self.assertEqual(blocked["state"]["status"], "risk_paused")
            self.assertEqual(blocked["state"]["position"], 0)
            self.assertEqual(
                blocked["state"]["lastDecisionContract"]["riskAdjustedTarget"]["decision"],
                "reject",
            )
            self.assertIn("盈利回撤", blocked["state"]["detail"])

    def test_loss_drawdown_is_independent_and_resets_on_the_next_risk_day(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (
                        ProviderStatus("local", True, None, None),
                        ProviderStatus(
                            "openai-compatible",
                            True,
                            "fake",
                            "https://example.invalid",
                        ),
                    ),
                    {"openai-compatible": FakeProvider()},
                ),
            )
            service.configure({
                "enabled": True,
                "triggerPct": 0.3,
                "dailyLossLimitPct": 0.2,
                "dailyProfitDrawdownLimitPct": 20,
                "maxTradesPerHour": 60,
            })
            service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            exited = service.evaluate(
                bars(
                    [98, 98, 98, 98, 98, 98],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(exited["state"]["status"], "traded")
            self.assertEqual(exited["state"]["position"], 0)
            self.assertGreater(exited["state"]["dailyLossDrawdownPct"], 0.2)
            self.assertEqual(exited["state"]["dailyProfitDrawdownPct"], 0)
            self.assertEqual(
                exited["state"]["dailyRiskHaltReason"],
                "已达到当日亏损回撤上限。",
            )

            tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
            with patch("quant_core.auto_paper_trading._now", return_value=tomorrow):
                resumed = service.evaluate(
                    bars(
                        [99, 99, 99, 99, 99, 100],
                        start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
                    ),
                    data_source="test",
                )

            self.assertEqual(resumed["state"]["status"], "traded")
            self.assertGreater(resumed["state"]["position"], 0)
            self.assertIsNone(resumed["state"]["dailyRiskHaltReason"])
            self.assertEqual(resumed["state"]["dailyLossDrawdownPct"], 0)
            self.assertEqual(resumed["state"]["dailyProfitDrawdownPct"], 0)

    def test_risk_adjustment_can_reduce_or_zero_but_never_amplify_a_target(self):
        target = {
            "portfolioTargetId": "target-1",
            "currentQuantity": 0,
            "targetQuantity": 1,
            "referencePrice": 100,
        }

        reduced = build_risk_adjusted_target(
            target,
            decision="reduce",
            approved_target_quantity=0.5,
            reason="风险预算只允许一半目标。",
        )
        zeroed = build_risk_adjusted_target(
            target,
            decision="zero",
            reason="风险预算要求清零。",
        )

        self.assertEqual(reduced["approvedTargetQuantity"], 0.5)
        self.assertEqual(zeroed["approvedTargetQuantity"], 0)
        with self.assertRaisesRegex(ValueError, "risk_adjustment_amplifies_target"):
            build_risk_adjusted_target(
                target,
                decision="reduce",
                approved_target_quantity=1.1,
                reason="无效放大。",
            )

    def test_order_result_cannot_exceed_its_order_intent(self):
        with self.assertRaisesRegex(ValueError, "order_result_exceeds_intent"):
            build_order_result(
                {"orderIntentId": "intent-1", "quantity": 1},
                execution_mode="testnet",
                evidence={
                    "state": "filled",
                    "filledQuantity": 2,
                    "averagePrice": 100,
                },
            )

    def test_order_intent_requires_covered_account_evidence(self):
        with self.assertRaisesRegex(ValueError, "order_intent_account_not_covered"):
            build_order_intent(
                market_snapshot_hash="snapshot-1",
                strategy_revision="revision-1",
                proposal_id="proposal-1",
                signal_id="signal-1",
                portfolio_target={
                    "portfolioTargetId": "target-1",
                    "referencePrice": 100,
                    "symbol": "BTC/USDT",
                },
                risk_adjusted_target={
                    "riskAdjustedTargetId": "risk-target-1",
                    "approvedDeltaQuantity": 1,
                },
                account_check={
                    "accountCheckId": "account-check-1",
                    "accountCovered": False,
                },
                fee_rate=0.001,
            )

    def test_explicit_testnet_mode_routes_ai_trade_without_enabling_live_trading(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai", False, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                    ProviderStatus("ollama", False, None, None),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakeSandboxService()
            service = AutoPaperTradingService(store, registry, sandbox)  # type: ignore[arg-type]
            configured = service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })
            self.assertTrue(configured["sandboxOnly"])
            self.assertTrue(configured["sandboxOrderSubmissionEnabled"])
            self.assertFalse(configured["liveTradingAllowed"])

            result = service.evaluate(bars([100, 100, 100, 100, 100, 101]), data_source="test")
            self.assertEqual(len(sandbox.orders), 1)
            self.assertEqual(result["state"]["lastTrade"]["executionMode"], "testnet")
            self.assertEqual(result["state"]["lastTrade"]["testnetOrder"]["state"], "filled")
            self.assertTrue(result["state"]["lastTrade"]["feeEstimated"])
            self.assertEqual(store.count(event_type="auto_testnet_order_intent"), 1)
            self.assertEqual(store.count(event_type="auto_testnet_trade"), 1)
            self.assertEqual(
                result["state"]["lastTestnetOrder"]["orderIntent"]["orderIntentId"],
                result["state"]["lastDecisionContract"]["orderIntent"]["orderIntentId"],
            )
            contract = result["state"]["lastDecisionContract"]
            self.assertEqual(len(sandbox.preparations), 1)
            self.assertEqual(contract["accountCheck"]["source"], "venue_account")
            self.assertEqual(
                contract["accountCheck"]["checkedAt"],
                result["state"]["lastAccountCheck"]["checkedAt"],
            )
            self.assertEqual(
                contract["orderIntent"]["accountCheckId"],
                contract["accountCheck"]["accountCheckId"],
            )
            self.assertEqual(
                contract["orderIntent"]["marketRules"],
                {
                    "source": "ccxt",
                    "quantityPrecision": 0.000001,
                    "pricePrecision": 0.01,
                    "minimumQuantity": 0.00001,
                    "minimumNotional": 1.0,
                },
            )
            self.assertEqual(
                contract["orderIntent"]["executionAssumptions"]["slippageModel"],
                "venue_market_fill",
            )
            self.assertEqual(
                sandbox.orders[0]["quantity"],
                contract["orderIntent"]["quantity"],
            )
            intent = contract["orderIntent"]
            replayed = replay_decision_proposal(
                contract["decisionProposal"],
                bars=bars([100, 100, 100, 100, 100, 101]),
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                data_source="test",
                strategy_id="auto-pct-v1",
                current_quantity=0,
                reference_price=101,
                available_cash=100,
                order_notional=10,
                fee_rate=0.001,
                daily_drawdown_pct=0,
                daily_loss_limit_pct=2,
                recent_trade_count=0,
                max_trades_per_hour=3,
                generated_at=datetime.fromisoformat(
                    contract["decisionProposal"]["proposedAt"]
                ),
                profit_drawdown_pct=0,
                profit_drawdown_limit_pct=2,
                account_check=result["state"]["lastAccountCheck"],
                execution_preparation={
                    key: intent[key]
                    for key in (
                        "symbol",
                        "side",
                        "quantity",
                        "referencePrice",
                        "notionalValue",
                        "marketRules",
                        "executionAssumptions",
                    )
                },
            )
            self.assertEqual(replayed, contract)
            order_result = result["state"]["lastOrderResult"]
            self.assertEqual(order_result["executionMode"], "testnet")
            self.assertEqual(order_result["state"], "filled")
            self.assertEqual(
                order_result["orderIntentId"],
                result["state"]["lastDecisionContract"]["orderIntent"]["orderIntentId"],
            )
            self.assertEqual(
                order_result["clientOrderId"],
                result["state"]["lastTestnetOrder"]["request"]["clientOrderId"],
            )
            self.assertFalse(result["liveTradingAllowed"])
            self.assertFalse(result["routeExecuted"])

            sandbox.triggered = True
            stopped = service.evaluate(
                bars([101, 101, 101, 101, 101, 102], start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc)),
                data_source="test",
            )
            self.assertEqual(stopped["state"]["status"], "risk_paused")
            self.assertEqual(len(sandbox.orders), 1)

    def test_pending_testnet_order_blocks_mode_switch_and_reconciles_once(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakePendingSandboxService()
            service = AutoPaperTradingService(
                store,
                registry,
                sandbox,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })
            rising = bars([100, 100, 100, 100, 100, 101])
            pending = service.evaluate(rising, data_source="test")
            pending_result = pending["state"]["lastOrderResult"]
            self.assertEqual(pending_result["state"], "open")
            self.assertEqual(pending_result["filledQuantity"], 0)

            with self.assertRaisesRegex(
                ValueError,
                "testnet_position_or_order_must_be_reconciled",
            ):
                service.configure({"enabled": False, "executionMode": "paper"})

            filled = service.evaluate(rising, data_source="test")
            duplicate = service.evaluate(rising, data_source="test")

            self.assertEqual(sandbox.reconciliation_calls, 1)
            self.assertEqual(len(sandbox.orders), 1)
            self.assertEqual(filled["state"]["tradeCount"], 1)
            self.assertEqual(duplicate["state"]["tradeCount"], 1)
            self.assertEqual(filled["state"]["lastOrderResult"]["state"], "filled")
            self.assertEqual(
                filled["state"]["lastOrderResult"]["orderIntentId"],
                pending_result["orderIntentId"],
            )

    def test_market_rules_reject_before_final_order_intent_and_submission(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakeRejectedPreparationSandboxService()
            service = AutoPaperTradingService(store, registry, sandbox)  # type: ignore[arg-type]
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })

            result = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            self.assertEqual(result["state"]["status"], "order_rejected")
            self.assertEqual(result["state"]["detail"], "stage6_sandbox_cost_below_minimum")
            self.assertIsNone(result["state"]["lastDecisionContract"]["orderIntent"])
            self.assertEqual(len(sandbox.preparations), 1)
            self.assertEqual(sandbox.orders, [])
            self.assertEqual(store.count(event_type="auto_testnet_order_intent"), 0)

    def test_untradeable_exit_dust_is_audited_once_and_no_longer_blocks_mode_switch(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakeDustFillSandboxService()
            service = AutoPaperTradingService(
                store,
                registry,
                sandbox,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })
            rising = bars([65_000, 65_000, 65_000, 65_000, 65_000, 65_500])

            pending = service.evaluate(rising, data_source="test")
            settled = service.evaluate(rising, data_source="test")
            released = service.evaluate(
                bars(
                    [65_000, 65_000, 65_000, 65_000, 65_000, 63_500],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            repeated = service.evaluate(
                bars(
                    [63_500, 63_500, 63_500, 63_500, 63_500, 63_510],
                    start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            switched = service.configure({"enabled": False, "executionMode": "paper"})

            self.assertEqual(pending["state"]["status"], "order_pending")
            self.assertEqual(settled["state"]["position"], 0.00001)
            self.assertEqual(released["state"]["status"], "monitoring")
            self.assertEqual(released["state"]["position"], 0)
            self.assertEqual(released["state"]["avgCost"], 0)
            self.assertEqual(
                released["state"]["lastDustDisposition"]["reason"],
                "stage6_sandbox_cost_below_minimum",
            )
            self.assertEqual(released["state"]["lastDustDisposition"]["quantity"], 0.00001)
            self.assertFalse(released["state"]["lastDustDisposition"]["orderSubmitted"])
            self.assertEqual(
                released["state"]["dailyReleasedDustNotional"],
                released["state"]["lastDustDisposition"]["estimatedNotional"],
            )
            adjusted_start_equity = (
                released["state"]["dailyStartEquity"]
                - released["state"]["dailyReleasedDustNotional"]
            )
            adjusted_drawdown_pct = (
                adjusted_start_equity - released["state"]["equity"]
            ) / adjusted_start_equity * 100
            self.assertLess(adjusted_drawdown_pct, 0.1)
            self.assertEqual(store.count(event_type="auto_testnet_dust_disposition"), 1)
            dust_event = store.list_recent(
                event_type="auto_testnet_dust_disposition",
                limit=1,
            )[0]
            self.assertFalse(dust_event.metadata["liveTradingAllowed"])
            self.assertFalse(dust_event.metadata["orderSubmissionEnabled"])
            self.assertFalse(dust_event.metadata["routeExecuted"])
            self.assertEqual(len(sandbox.orders), 1)
            self.assertEqual(repeated["state"]["position"], 0)
            self.assertEqual(switched["state"]["executionMode"], "paper")

    def test_partial_testnet_fill_settles_actual_quantity_and_fee_once(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakePartialFillSandboxService()
            service = AutoPaperTradingService(
                store,
                registry,
                sandbox,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })
            rising = bars([100, 100, 100, 100, 100, 101])

            pending = service.evaluate(rising, data_source="test")
            settled = service.evaluate(rising, data_source="test")
            duplicate = service.evaluate(rising, data_source="test")

            self.assertEqual(pending["state"]["status"], "order_pending")
            self.assertEqual(settled["state"]["lastTestnetOrder"]["state"], "canceled")
            self.assertEqual(settled["state"]["lastOrderResult"]["state"], "canceled")
            self.assertGreater(settled["state"]["lastOrderResult"]["filledQuantity"], 0)
            self.assertAlmostEqual(
                settled["state"]["lastTrade"]["quantity"],
                sandbox.orders[0]["quantity"] / 2,
            )
            self.assertEqual(settled["state"]["lastTrade"]["fee"], 0.001)
            self.assertEqual(duplicate["state"]["tradeCount"], 1)
            self.assertEqual(store.count(event_type="auto_testnet_trade"), 1)

    def test_testnet_trade_uses_exchange_reported_quote_fee(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakeFeeSandboxService()
            service = AutoPaperTradingService(
                store,
                registry,
                sandbox,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })

            result = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            order = sandbox.orders[0]
            self.assertEqual(result["state"]["lastTrade"]["fee"], 0.002)
            self.assertFalse(result["state"]["lastTrade"]["feeEstimated"])
            self.assertEqual(
                result["state"]["lastOrderResult"]["fees"],
                [{"currency": "USDT", "cost": 0.002}],
            )
            self.assertFalse(result["state"]["lastOrderResult"]["feeEstimated"])
            self.assertAlmostEqual(
                result["state"]["cash"],
                100 - order["notionalValue"] - 0.002,
            )

    def test_testnet_buy_deducts_exchange_reported_base_fee_from_position(self):
        with tempfile.TemporaryDirectory() as directory:
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakeBaseFeeSandboxService()
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                registry,
                sandbox,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })

            result = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            order = sandbox.orders[0]
            self.assertAlmostEqual(
                result["state"]["position"],
                order["quantity"] - sandbox.fee_cost,
            )
            self.assertAlmostEqual(
                result["state"]["cash"],
                100 - order["notionalValue"],
            )
            self.assertEqual(
                result["state"]["lastTrade"]["fee"],
                sandbox.fee_cost * order["referencePrice"],
            )
            self.assertFalse(result["state"]["lastTrade"]["feeEstimated"])

    def test_testnet_trade_preserves_third_currency_fee_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (
                    ProviderStatus("local", True, None, None),
                    ProviderStatus("openai-compatible", True, "fake", "https://example.invalid"),
                ),
                {"openai-compatible": FakeProvider()},
            )
            sandbox = FakeThirdCurrencyFeeSandboxService()
            service = AutoPaperTradingService(
                store,
                registry,
                sandbox,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })

            result = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            trade = result["state"]["lastTrade"]
            self.assertTrue(trade["feeEstimated"])
            self.assertEqual(
                trade["feeBreakdown"],
                [{"currency": "BNB", "cost": 0.00001}],
            )
            self.assertEqual(
                result["state"]["lastOrderResult"]["fees"],
                trade["feeBreakdown"],
            )
            self.assertTrue(result["state"]["lastOrderResult"]["feeEstimated"])
            self.assertEqual(
                store.get(trade["tradeId"]).metadata["feeBreakdown"],
                trade["feeBreakdown"],
            )

    def test_testnet_market_order_uses_ccxt_sandbox_route(self):
        FakeBinanceTestnet.instances.clear()
        route = BinanceSpotTestnetRoute(
            env={"CCXT_SANDBOX_API_KEY": "key", "CCXT_SANDBOX_SECRET": "secret"},
            ccxt_module=type("Ccxt", (), {"binance": FakeBinanceTestnet}),
        )
        evidence = route.create_market_order({
            "clientOrderId": "auto-123",
            "symbol": "BTC/USDT",
            "side": "buy",
            "quantity": 0.0001,
            "referencePrice": 60_000,
            "notionalValue": 6,
        })
        self.assertEqual(evidence["state"], "filled")
        self.assertEqual(evidence["filledNotional"], 6)
        self.assertEqual(
            evidence["fees"],
            [{"currency": "USDT", "cost": 0.006}],
        )
        self.assertEqual(
            FakeBinanceTestnet.instances[0].calls,
            [
                ("sandbox", True),
                (
                    "create-with-cost",
                    "BTC/USDT",
                    6.0,
                    {"newClientOrderId": "auto-123"},
                ),
            ],
        )

    def test_shared_spot_runtime_blocks_post_precision_buy_notional_over_limit(self):
        exchange = FakeBinanceTestnet({})
        with self.assertRaisesRegex(
            ValueError,
            "stage10_auto_live_order_notional_exceeded",
        ):
            create_spot_market_order(
                exchange,
                {
                    "clientOrderId": "auto-live-limit",
                    "symbol": "BTC/USDT",
                    "side": "buy",
                    "quantity": 0.0002,
                    "referencePrice": 60_000,
                    "notionalValue": 12,
                },
                market_or_balance_error="stage10_auto_live_market_or_balance_unavailable",
                balance_error="stage10_production_balance_insufficient",
                max_buy_notional=10,
                notional_error="stage10_auto_live_order_notional_exceeded",
            )

        self.assertFalse(any(call[0] == "create" for call in exchange.calls))

    def test_shared_spot_preparation_exposes_normalized_rules_and_assumptions(self):
        exchange = FakeBinanceTestnet({})

        prepared = prepare_spot_market_order(
            exchange,
            {
                "symbol": "BTC/USDT",
                "side": "buy",
                "quantity": 0.0001004,
                "referencePrice": 60_000.004,
                "notionalValue": 6.024,
            },
            market_or_balance_error="stage6_auto_sandbox_market_or_balance_unavailable",
            balance_error="stage6_sandbox_balance_insufficient",
        )

        self.assertEqual(prepared["quantity"], 0.0001)
        self.assertEqual(prepared["referencePrice"], 60_000)
        self.assertEqual(prepared["notionalValue"], 6)
        self.assertEqual(
            prepared["marketRules"],
            {
                "source": "ccxt",
                "quantityPrecision": 0.000001,
                "pricePrecision": 0.01,
                "minimumQuantity": 0.00001,
                "minimumNotional": 1.0,
            },
        )
        self.assertEqual(
            prepared["executionAssumptions"],
            {
                "feeRate": 0.001,
                "feeEstimated": True,
                "slippageBps": None,
                "slippageModel": "venue_market_fill",
            },
        )

    def test_shared_spot_preparation_normalizes_below_minimum_before_ccxt_precision(self):
        class StrictPrecisionExchange(FakeBinanceTestnet):
            def amount_to_precision(self, symbol, value):
                if value < 0.00001:
                    raise RuntimeError(
                        f"binance amount of {symbol} must be greater than minimum amount precision of 0.00001"
                    )
                return super().amount_to_precision(symbol, value)

        with self.assertRaisesRegex(
            ValueError,
            "stage6_sandbox_amount_below_minimum",
        ):
            prepare_spot_market_order(
                StrictPrecisionExchange({}),
                {
                    "symbol": "BTC/USDT",
                    "side": "sell",
                    "quantity": 0.00000986,
                    "referencePrice": 64_000,
                    "notionalValue": 0.63104,
                },
                market_or_balance_error="stage10_auto_live_market_or_balance_unavailable",
                balance_error="stage10_production_balance_insufficient",
            )

    def test_shared_spot_runtime_derives_missing_filled_notional(self):
        exchange = FakeBinanceTestnet({})

        evidence = create_spot_market_order(
            exchange,
            {
                "clientOrderId": "auto-testnet-sell",
                "symbol": "BTC/USDT",
                "side": "sell",
                "quantity": 0.0001,
                "referencePrice": 60_000,
                "notionalValue": 6,
            },
            market_or_balance_error="stage6_auto_sandbox_market_or_balance_unavailable",
            balance_error="stage6_sandbox_balance_insufficient",
        )

        self.assertEqual(evidence["filledNotional"], 6)

    def test_shared_spot_account_coverage_blocks_orphan_auto_order(self):
        exchange = FakeBinanceTestnet({})
        exchange.open_orders = [{
            "clientOrderId": "aiqt-auto-l-orphan",
            "symbol": "BTC/USDT",
            "status": "open",
        }]

        coverage = check_spot_account_coverage(
            exchange,
            symbol="BTC/USDT",
            expected_base=0.5,
            required_quote=10,
        )

        self.assertFalse(coverage["accountCovered"])
        self.assertTrue(coverage["positionCovered"])
        self.assertTrue(coverage["quoteCovered"])
        self.assertEqual(coverage["unexpectedOpenAutoOrderCount"], 1)


if __name__ == "__main__":
    unittest.main()
