from __future__ import annotations

from dataclasses import asdict, replace
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
import json
import math
from pathlib import Path
import sqlite3
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
from quant_core.auto_paper_trading import (
    CONTROL_EVENT_ID,
    AutoPaperTradingRunner,
    AutoPaperTradingService,
)
from quant_core.backtest import BacktestEngine
from quant_core.api import (
    QuantApiHandler,
    build_auto_paper_trading_runner,
    evaluate_auto_paper_trading_once,
)
from quant_core.decision_contract import (
    build_decision_contract,
    build_order_intent,
    build_order_result,
    build_risk_adjusted_target,
    normalize_strategy_evaluation_identity,
    replay_decision_proposal,
    validate_order_intent_identity,
)
from quant_core.binance_spot_orders import (
    check_spot_account_coverage,
    create_spot_market_order,
    prepare_spot_market_order,
)
from quant_core.cache import MarketDataCache
from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_sha256,
    canonical_snapshot_id,
    normalize_snapshot_bars,
    strategy_config_from_payload,
    strategy_config_to_payload,
)
from quant_core.domain import (
    Condition,
    DataQuality,
    MarketDataRequest,
    OHLCVBar,
    RiskRules,
    StrategyConfig,
)
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.sealed_datasets import (
    SealedDatasetStore,
    sealed_research_snapshot_payload,
)
from quant_core.settings import PlatformSettingsStore
from quant_core.stage6_sandbox import BinanceSpotTestnetRoute
from quant_core.strategy_experiment_store import StrategyExperimentStore
from quant_core.strategy_experiments import (
    StrategyExperimentError,
    StrategyExperimentRunner,
)
from quant_core.strategy_library import StrategyLibraryStore
from services.quant_core.tests.test_regime_breakout_v2 import (
    _expand_to_one_minute as regime_one_minute_bars,
    _five_minute_fixture as regime_five_minute_fixture,
    _profitable_fresh_reaudit_bars,
    _seed_promotable_experiment,
    _strategy as regime_breakout_strategy,
)
from services.quant_core.tests.test_cost_aware_range_reversion_backtest import (
    INDICATOR_ANCHOR_BARS as COST_AWARE_INDICATOR_ANCHOR_BARS,
    LEGACY_INDICATOR_ANCHOR_BARS as LEGACY_COST_AWARE_INDICATOR_ANCHOR_BARS,
    _one_minute_bars as cost_aware_one_minute_bars,
    _strategy as cost_aware_range_reversion_strategy,
)


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
        self.enabled = True
        self.triggered = False
        self.evidence_fresh = True
        self.orders = []
        self.preparations = []
        self.account_covered = True
        self.account_snapshot = None
        self.account_checks = 0
        self.control_id = "stage10-control-live"
        self.authorization_calls = 0

    def auto_live_status(self):
        return {
            "enabled": self.enabled,
            "credentialsConfigured": True,
            "controlActive": self.enabled and not self.triggered and self.evidence_fresh,
            "controlRecordedActive": not self.triggered,
            "evidenceFresh": self.evidence_fresh,
            "blockingReason": (
                "stage10_production_live_route_disabled"
                if not self.enabled
                else None
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
            **(
                {"accountSnapshot": self.account_snapshot}
                if self.account_snapshot is not None
                else {}
            ),
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
        self.apiKey = _config.get("apiKey")
        self.open_orders = []
        self.balance = {
            "free": {"BTC": 1.0, "USDT": 100.0},
            "used": {"BTC": 0.0, "USDT": 0.0},
            "total": {"BTC": 1.0, "USDT": 100.0},
        }
        self.tickers = {
            "BTC/USDT": {
                "bid": 60_000.0,
                "last": 60_000.0,
            },
            "ETH/USDT": {
                "bid": 3_000.0,
                "last": 3_000.0,
            },
        }
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
            },
            "ETH/USDT": {
                "active": True,
                "base": "ETH",
                "quote": "USDT",
                "precision": {"amount": 0.000001, "price": 0.01},
                "limits": {"amount": {"min": 0.00001}, "price": {}, "cost": {"min": 1}},
                "taker": 0.001,
            },
        }

    def fetch_balance(self):
        return self.balance

    def fetch_ticker(self, symbol):
        self.calls.append(("fetch-ticker", symbol))
        return self.tickers[symbol]

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


class ConflictingOrderIntentStore(AuditEventStore):
    def record_if_absent(self, event):
        if event.get("eventType") == "auto_testnet_order_intent":
            metadata = event["metadata"]
            order = metadata["order"]
            self.record(
                {
                    **event,
                    "metadata": {
                        **metadata,
                        "order": {
                            **order,
                            "quantity": float(order["quantity"]) * 2,
                        },
                    },
                }
            )
        return super().record_if_absent(event)


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


def small_account_policy_bars() -> list[OHLCVBar]:
    """Keep the signal and next open equal while making 0.00008 BTC the risk-sized lot."""
    scale = 610.0

    def scaled(value: float) -> float:
        return 65_000.0 + (value - 102.0) * scale

    return [
        replace(
            bar,
            open=scaled(bar.open),
            high=scaled(bar.high),
            low=scaled(bar.low),
            close=scaled(bar.close),
        )
        for bar in regime_one_minute_bars(regime_five_minute_fixture())
    ]


def low_atr_dynamic_entry_policy_bars() -> list[OHLCVBar]:
    """Keep venue-scale prices while making the 60% equity cap bind sizing."""
    scale = 0.01

    def scaled(value: float) -> float:
        return 66_000.0 + (value - 102.0) * scale

    return [
        replace(
            bar,
            open=scaled(bar.open),
            high=scaled(bar.high),
            low=scaled(bar.low),
            close=scaled(bar.close),
        )
        for bar in regime_one_minute_bars(regime_five_minute_fixture())
    ]


def evaluate_and_settle_paper(
    service: AutoPaperTradingService,
    signal_bars: list[OHLCVBar],
    *,
    data_source: str = "test",
    fill_open: float | None = None,
) -> dict:
    signaled = service.evaluate(signal_bars, data_source=data_source)
    if signaled["state"]["status"] != "order_pending":
        return signaled
    price = float(fill_open if fill_open is not None else signal_bars[-1].close)
    fill_bar = OHLCVBar(
        symbol=signal_bars[-1].symbol,
        market=signal_bars[-1].market,
        timeframe=signal_bars[-1].timeframe,
        timestamp=signal_bars[-1].timestamp + timedelta(minutes=1),
        open=price,
        high=price,
        low=price,
        close=price,
        volume=signal_bars[-1].volume,
    )
    return service.evaluate([*signal_bars, fill_bar], data_source=data_source)


def rewrite_auto_state(store: AuditEventStore, mutate) -> None:
    current = store.get(CONTROL_EVENT_ID)
    assert current is not None
    state = json.loads(json.dumps(current.metadata["state"]))
    mutate(state)
    store.record(
        {
            "schemaVersion": 1,
            "eventId": CONTROL_EVENT_ID,
            "eventType": "auto_paper_trading_state",
            "runId": None,
            "createdAt": current.created_at.isoformat(),
            "stage": "auto-paper-trading",
            "source": "auto-paper-trading",
            "summary": "tampered pending paper fixture",
            "detail": "tampered pending paper fixture",
            "metadata": {"state": state},
        }
    )


def reset_clean_ten_usdt_paper_ledger(
    service: AutoPaperTradingService,
) -> None:
    service.configure(
        {
            "enabled": False,
            "initialCash": 10,
            "paperAccountResetConfirmed": True,
        }
    )


def audited_strategy_stores(
    directory: str,
    *,
    entry_window: int = 3,
    strategy: StrategyConfig | None = None,
    audit_bars: list[OHLCVBar] | None = None,
) -> tuple[StrategyConfig, StrategyLibraryStore, ResearchRunStore]:
    strategy = strategy or StrategyConfig(
        name="BTC 一分钟均线策略",
        market="crypto",
        symbols=["BTC/USDT"],
        timeframe="1m",
        entry_conditions=[
            Condition(kind="close_above_sma", params={"window": entry_window})
        ],
        exit_conditions=[
            Condition(kind="close_below_sma", params={"window": entry_window})
        ],
        risk=RiskRules(
            position_pct=0.2,
            stop_loss_pct=0.01,
            take_profit_pct=0.02,
            max_drawdown_pct=0.05,
        ),
    )
    audit_bars = audit_bars or bars([100 + index for index in range(max(6, entry_window))])
    backtest = BacktestEngine().run(strategy, audit_bars)
    normalized = normalize_snapshot_bars(audit_bars)
    data_hash = canonical_data_hash(normalized)
    snapshot_hash = canonical_snapshot_id(
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        canonical_data_hash=data_hash,
    )
    run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
    run_store.record(
        ResearchRunAudit(
            run_id="run-live-strategy",
            created_at=datetime(2026, 7, 30, tzinfo=timezone.utc),
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            strategy_name=strategy.name,
            strategy_revision=strategy.revision,
            data_rows=len(normalized),
            metrics=asdict(backtest.metrics),
            decisions=[],
            execution_mode="paper_only",
            data_quality={
                "source": "test",
                "isComplete": True,
                "warnings": [],
                "rows": len(normalized),
                "canonicalHash": data_hash,
            },
            data_snapshot={
                "source": "test",
                "isComplete": True,
                "warnings": [],
                "rows": len(normalized),
                "hash": data_hash,
                "snapshotHash": snapshot_hash,
                "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
                "bars": normalized,
            },
            strategy_config=strategy_config_to_payload(strategy),
            backtest_assumptions={
                "initialCash": 100_000,
                "feeBps": 3,
                "slippageBps": 2,
            },
            backtest_trades=[
                {
                    "timestamp": trade.timestamp.isoformat(),
                    "side": trade.side.upper(),
                    "status": "filled",
                    "price": trade.price,
                    "quantity": trade.quantity,
                }
                for trade in backtest.trades
            ],
            backtest_equity_curve=[
                {
                    "timestamp": point.timestamp.isoformat(),
                    "equity": round(point.equity, 4),
                }
                for point in backtest.equity_curve
            ],
        )
    )
    strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
    strategy_store.save(strategy, audit_run_id="run-live-strategy")
    return strategy, strategy_store, run_store


def promoted_sealed_strategy_stores(
    directory: str,
    *,
    promote: bool = True,
    audit_bars: list[OHLCVBar] | None = None,
    base_strategy: StrategyConfig | None = None,
) -> tuple[
    StrategyConfig,
    StrategyLibraryStore,
    ResearchRunStore,
    StrategyExperimentStore,
    SealedDatasetStore,
    dict | None,
]:
    strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
    run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
    experiment_store = StrategyExperimentStore(Path(directory) / "experiments.sqlite")
    sealed_store = SealedDatasetStore(Path(directory) / "sealed.sqlite")
    base_strategy = base_strategy or regime_breakout_strategy()
    strategy_store.save(base_strategy)
    winner, experiment = _seed_promotable_experiment(
        experiment_store,
        base_strategy=base_strategy,
    )

    development = audit_bars or _profitable_fresh_reaudit_bars()
    withheld = replace(
        development[-1],
        timestamp=development[-1].timestamp + timedelta(minutes=1),
    )
    complete_dataset = [*development, withheld]
    request = MarketDataRequest(
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        start=complete_dataset[0].timestamp,
        end=withheld.timestamp + timedelta(minutes=1),
    )
    summary = sealed_store.seal_dataset(
        request,
        [
            complete_dataset[index : index + 500]
            for index in range(0, len(complete_dataset), 500)
        ],
        [
            DataQuality(
                source="fresh-sealed-fixture",
                origin_source="fresh-sealed-fixture",
                is_complete=True,
                rows=len(chunk),
                adjustment_mode="none",
                canonical_hash=canonical_data_hash(
                    normalize_snapshot_bars(chunk)
                ),
            )
            for chunk in [
                complete_dataset[index : index + 500]
                for index in range(0, len(complete_dataset), 500)
            ]
        ],
        development_end_exclusive=withheld.timestamp,
        observed_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
    )
    backtest = BacktestEngine(
        initial_cash=10,
        fee_rate=0.001,
        slippage_rate=0.001,
    ).run(winner.strategy, development)
    run_store.record(
        ResearchRunAudit(
            run_id="fresh-sealed-p0-run",
            created_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            strategy_name=winner.strategy.name,
            strategy_revision=winner.strategy.revision,
            data_rows=len(development),
            metrics=asdict(backtest.metrics),
            decisions=[],
            execution_mode="paper_only",
            data_quality={
                "source": summary.source,
                "originSource": summary.source,
                "isComplete": True,
                "warnings": [],
                "rows": summary.development_rows,
                "adjustmentMode": summary.adjustment_mode,
                "coverage": {
                    "actualRows": summary.development_rows,
                    "expectedRows": summary.development_rows,
                    "gapCount": 0,
                    "ratio": 1.0,
                },
                "canonicalHash": summary.development_hash,
                "issues": [],
            },
            data_snapshot=sealed_research_snapshot_payload(summary),
            strategy_config=strategy_config_to_payload(winner.strategy),
            backtest_assumptions={
                "initialCash": 10,
                "feeBps": 10,
                "slippageBps": 10,
            },
            backtest_trades=[
                {
                    "timestamp": trade.timestamp.isoformat(),
                    "side": trade.side,
                    "status": "filled",
                    "price": trade.price,
                    "quantity": trade.quantity,
                }
                for trade in backtest.trades
            ],
            backtest_equity_curve=[
                {
                    "timestamp": point.timestamp.isoformat(),
                    "equity": round(point.equity, 4),
                }
                for point in backtest.equity_curve
            ],
        )
    )
    class DevelopmentOnlySealedSource:
        def get_summary(self, dataset_id):
            return sealed_store.get_summary(dataset_id)

        def read_development_bars(self, dataset_id):
            return sealed_store.read_development_bars(dataset_id)

        def claim_test_partition(self, *_args, **_kwargs):
            raise AssertionError("fresh promotion must not claim the test partition")

        def read_claimed_test_bars(self, *_args, **_kwargs):
            raise AssertionError("fresh promotion must not read the test partition")

    promotion = (
        StrategyExperimentRunner(
            strategy_store=strategy_store,
            run_store=run_store,
            experiment_store=experiment_store,
            sealed_bar_source=DevelopmentOnlySealedSource(),
        ).promote_winner(
            experiment.experiment_id,
            fresh_source_run_id="fresh-sealed-p0-run",
            operator="operator@example.com",
            confirmed=True,
        )
        if promote
        else None
    )
    if not promote:
        strategy_store.save(
            winner.strategy,
            audit_run_id="fresh-sealed-p0-run",
        )
    return (
        winner.strategy,
        strategy_store,
        run_store,
        experiment_store,
        sealed_store,
        promotion,
    )


def forward_trial_strategy_stores(
    directory: str,
    *,
    audit_bars: list[OHLCVBar] | None = None,
    initial_cash: float = 10,
    fee_bps: float = 10,
    slippage_bps: float = 10,
) -> tuple[
    StrategyConfig,
    StrategyLibraryStore,
    ResearchRunStore,
    SealedDatasetStore,
]:
    strategy = cost_aware_range_reversion_strategy()
    development = audit_bars or cost_aware_one_minute_bars(
        [
            *[100.0] * COST_AWARE_INDICATOR_ANCHOR_BARS,
            98.0,
            98.6,
            100.5,
        ],
        following_open=101.0,
    )
    return draft_sealed_forward_trial_strategy_stores(
        directory,
        strategy=strategy,
        development=development,
        initial_cash=initial_cash,
        fee_bps=fee_bps,
        slippage_bps=slippage_bps,
    )


def draft_sealed_forward_trial_strategy_stores(
    directory: str,
    *,
    strategy: StrategyConfig,
    development: list[OHLCVBar],
    initial_cash: float = 10,
    fee_bps: float = 10,
    slippage_bps: float = 10,
) -> tuple[
    StrategyConfig,
    StrategyLibraryStore,
    ResearchRunStore,
    SealedDatasetStore,
]:
    withheld = replace(
        development[-1],
        timestamp=development[-1].timestamp + timedelta(minutes=1),
    )
    complete_dataset = [*development, withheld]
    request = MarketDataRequest(
        market="crypto",
        symbol="BTC/USDT",
        timeframe="1m",
        start=complete_dataset[0].timestamp,
        end=withheld.timestamp + timedelta(minutes=1),
    )
    sealed_store = SealedDatasetStore(Path(directory) / "sealed.sqlite")
    chunks = [
        complete_dataset[index : index + 500]
        for index in range(0, len(complete_dataset), 500)
    ]
    summary = sealed_store.seal_dataset(
        request,
        chunks,
        [
            DataQuality(
                source="forward-trial-fixture",
                origin_source="forward-trial-fixture",
                is_complete=True,
                rows=len(chunk),
                adjustment_mode="none",
                canonical_hash=canonical_data_hash(normalize_snapshot_bars(chunk)),
            )
            for chunk in chunks
        ],
        development_end_exclusive=withheld.timestamp,
        observed_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
    )
    backtest = BacktestEngine(
        initial_cash=initial_cash,
        fee_rate=fee_bps / 10_000,
        slippage_rate=slippage_bps / 10_000,
    ).run(strategy, development)
    run_store = ResearchRunStore(Path(directory) / "runs.sqlite")
    run_store.record(
        ResearchRunAudit(
            run_id="fresh-sealed-p0-run",
            created_at=datetime(2026, 8, 11, tzinfo=timezone.utc),
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            strategy_name=strategy.name,
            strategy_revision=strategy.revision,
            data_rows=len(development),
            metrics=asdict(backtest.metrics),
            decisions=[],
            execution_mode="paper_only",
            data_quality={
                "source": summary.source,
                "originSource": summary.source,
                "isComplete": True,
                "warnings": [],
                "rows": summary.development_rows,
                "adjustmentMode": summary.adjustment_mode,
                "coverage": {
                    "actualRows": summary.development_rows,
                    "expectedRows": summary.development_rows,
                    "gapCount": 0,
                    "ratio": 1.0,
                },
                "canonicalHash": summary.development_hash,
                "issues": [],
            },
            data_snapshot=sealed_research_snapshot_payload(summary),
            strategy_config=strategy_config_to_payload(strategy),
            backtest_assumptions={
                "initialCash": initial_cash,
                "feeBps": fee_bps,
                "slippageBps": slippage_bps,
            },
            backtest_trades=[
                {
                    "timestamp": trade.timestamp.isoformat(),
                    "side": trade.side,
                    "status": "filled",
                    "price": trade.price,
                    "quantity": trade.quantity,
                }
                for trade in backtest.trades
            ],
            backtest_equity_curve=[
                {
                    "timestamp": point.timestamp.isoformat(),
                    "equity": round(point.equity, 4),
                }
                for point in backtest.equity_curve
            ],
        )
    )
    strategy_store = StrategyLibraryStore(Path(directory) / "strategies.sqlite")
    strategy_store.save(strategy)
    return strategy, strategy_store, run_store, sealed_store


class AutoPaperTradingTests(unittest.TestCase):
    def test_forward_trial_binding_api_requires_an_exact_object_body(self):
        service = AutoPaperTradingService(
            AuditEventStore(":memory:"),
            AiReviewProviderRegistry(
                (ProviderStatus("local", True, None, None),),
                {},
            ),
        )

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
                "/api/execution/auto-paper-trading/forward-trial-bindings",
                body=json.dumps([{"strategyRevision": "not-an-object"}]),
                headers={"Content-Type": "application/json"},
            )
            response = connection.getresponse()
            payload = json.loads(response.read())
        finally:
            connection.close()
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

        self.assertEqual(response.status, 400)
        self.assertEqual(payload["error"], "invalid_forward_trial_binding")
        self.assertEqual(payload["detail"], "request_body_must_be_object")

    def test_v1_decision_contract_identity_remains_compatible(self):
        fixture_bars = [
            OHLCVBar(
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                timestamp=datetime(2026, 8, 1, tzinfo=timezone.utc)
                + timedelta(minutes=index),
                open=100 + index,
                high=101 + index,
                low=99 + index,
                close=100.5 + index,
                volume=10 + index,
            )
            for index in range(6)
        ]

        contract = build_decision_contract(
            bars=fixture_bars,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            data_source="test",
            strategy_id="auto-pct-v1",
            strategy_revision="revision-v1",
            proposal_action="buy",
            proposal_confidence=1,
            proposal_reason="fixture-buy",
            provider_id="rules",
            current_quantity=0,
            reference_price=105.5,
            available_cash=100,
            order_notional=10,
            fee_rate=0.001,
            daily_drawdown_pct=0,
            daily_loss_limit_pct=2,
            profit_drawdown_pct=0,
            profit_drawdown_limit_pct=2,
            recent_trade_count=0,
            max_trades_per_hour=3,
            generated_at=datetime(2026, 8, 1, 0, 6, tzinfo=timezone.utc),
        )

        self.assertEqual(
            contract["marketSnapshot"]["snapshotHash"],
            "6714085f4a60e7b882bf533acd74491f894d9df0c6edcbfc9d6f985b1d18065e",
        )
        self.assertEqual(
            contract["decisionProposal"]["proposalId"],
            "6eef7bb9d6def2bfb918ffd4d56a3a7c9a5a33e1ab7f07020f14e2c3fd62f5b4",
        )
        self.assertEqual(
            contract["signal"]["signalId"],
            "4dd634bb97235787ad6d69c94fa203fc53e415538965b7b5a6d2ea5d32335675",
        )
        self.assertEqual(
            contract["orderIntent"]["orderIntentId"],
            "588145cff82f180e090c128e796c0cb2c27ed9e42a322af4eba3822314ea65da",
        )
        self.assertEqual(
            contract["decisionProposal"]["evidenceReferences"],
            [contract["marketSnapshot"]["snapshotHash"]],
        )
        self.assertEqual(contract["contractVersion"], "aiqt-decision-v1")
        validate_order_intent_identity(contract["orderIntent"])

    def test_policy_evaluation_evidence_changes_every_downstream_identity(self):
        fixture_bars = bars([100, 101, 102, 103, 104, 105])
        identities = [
            {
                "contextHash": "1" * 64,
                "evaluationId": "2" * 24,
                "stateBeforeHash": "3" * 64,
                "evaluationHash": "7" * 64,
            },
            {
                "contextHash": "4" * 64,
                "evaluationId": "2" * 24,
                "stateBeforeHash": "3" * 64,
                "evaluationHash": "7" * 64,
            },
            {
                "contextHash": "1" * 64,
                "evaluationId": "5" * 24,
                "stateBeforeHash": "3" * 64,
                "evaluationHash": "7" * 64,
            },
            {
                "contextHash": "1" * 64,
                "evaluationId": "2" * 24,
                "stateBeforeHash": "6" * 64,
                "evaluationHash": "7" * 64,
            },
            {
                "contextHash": "1" * 64,
                "evaluationId": "2" * 24,
                "stateBeforeHash": "3" * 64,
                "evaluationHash": "8" * 64,
            },
        ]

        contracts = [
            build_decision_contract(
                bars=fixture_bars,
                market="crypto",
                symbol="BTC/USDT",
                timeframe="1m",
                data_source="test",
                strategy_id="regime-breakout-v2",
                strategy_revision="revision-v2",
                proposal_action="buy",
                proposal_confidence=1,
                proposal_reason="regime_breakout",
                provider_id="rules",
                current_quantity=0,
                reference_price=105,
                available_cash=10,
                order_notional=5,
                fee_rate=0.001,
                daily_drawdown_pct=0,
                daily_loss_limit_pct=2,
                profit_drawdown_pct=0,
                profit_drawdown_limit_pct=2,
                recent_trade_count=0,
                max_trades_per_hour=1,
                generated_at=datetime(2026, 8, 1, 0, 6, tzinfo=timezone.utc),
                strategy_evaluation_identity=identity,
            )
            for identity in identities
        ]

        self.assertEqual(
            {contract["marketSnapshot"]["snapshotHash"] for contract in contracts},
            {contracts[0]["marketSnapshot"]["snapshotHash"]},
        )
        for field, identity_field in (
            ("decisionProposal", "proposalId"),
            ("signal", "signalId"),
            ("orderIntent", "orderIntentId"),
        ):
            self.assertEqual(
                len({contract[field][identity_field] for contract in contracts}),
                len(identities),
            )
        expected_references = [
            contracts[0]["marketSnapshot"]["snapshotHash"],
            identities[0]["contextHash"],
            identities[0]["evaluationId"],
            identities[0]["stateBeforeHash"],
            identities[0]["evaluationHash"],
        ]
        for field in ("decisionProposal", "signal", "orderIntent"):
            self.assertEqual(
                contracts[0][field]["strategyEvaluationIdentity"],
                identities[0],
            )
            self.assertEqual(
                contracts[0][field]["evidenceReferences"],
                expected_references,
            )
        self.assertEqual(contracts[0]["contractVersion"], "aiqt-decision-v2")
        self.assertEqual(
            normalize_strategy_evaluation_identity(identities[0]),
            identities[0],
        )
        with self.assertRaisesRegex(
            ValueError,
            "strategy_evaluation_identity_invalid",
        ):
            normalize_strategy_evaluation_identity(
                {**identities[0], "contextHash": "not-a-64-byte-hash"}
            )
        validate_order_intent_identity(contracts[0]["orderIntent"])
        replayed = replay_decision_proposal(
            contracts[0]["decisionProposal"],
            bars=fixture_bars,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            data_source="test",
            strategy_id="regime-breakout-v2",
            current_quantity=0,
            reference_price=105,
            available_cash=10,
            order_notional=5,
            fee_rate=0.001,
            daily_drawdown_pct=0,
            daily_loss_limit_pct=2,
            profit_drawdown_pct=0,
            profit_drawdown_limit_pct=2,
            recent_trade_count=0,
            max_trades_per_hour=1,
            generated_at=datetime(2026, 8, 1, 0, 6, tzinfo=timezone.utc),
        )
        self.assertEqual(replayed, contracts[0])

    def test_four_hour_decision_contract_replay_preserves_signal_identity(self):
        fixture_bars = bars([100, 100, 100, 98, 98.6, 100.5])
        generated_at = datetime(2026, 8, 1, 0, 6, tzinfo=timezone.utc)
        evaluated_bar_at = fixture_bars[-2].timestamp.isoformat()
        contract = build_decision_contract(
            bars=fixture_bars,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            data_source="test",
            strategy_id="cost-aware-range-reversion-v1",
            strategy_revision="cost-aware-revision",
            proposal_action="buy",
            proposal_confidence=1,
            proposal_reason="range_reversion_recovery",
            provider_id="rules",
            current_quantity=0,
            reference_price=100.5,
            available_cash=10,
            order_notional=5,
            fee_rate=0.001,
            daily_drawdown_pct=0,
            daily_loss_limit_pct=2,
            profit_drawdown_pct=0,
            profit_drawdown_limit_pct=2,
            recent_trade_count=0,
            max_trades_per_hour=1,
            generated_at=generated_at,
            signal_timeframe="4h",
            evaluated_bar_at=evaluated_bar_at,
        )

        replayed = replay_decision_proposal(
            contract["decisionProposal"],
            bars=fixture_bars,
            market="crypto",
            symbol="BTC/USDT",
            timeframe="1m",
            data_source="test",
            strategy_id="cost-aware-range-reversion-v1",
            current_quantity=0,
            reference_price=100.5,
            available_cash=10,
            order_notional=5,
            fee_rate=0.001,
            daily_drawdown_pct=0,
            daily_loss_limit_pct=2,
            profit_drawdown_pct=0,
            profit_drawdown_limit_pct=2,
            recent_trade_count=0,
            max_trades_per_hour=1,
            generated_at=generated_at,
            signal_timeframe="4h",
            evaluated_bar_at=evaluated_bar_at,
        )

        self.assertEqual(replayed, contract)
        self.assertEqual(replayed["signal"]["horizon"], "4h")
        self.assertEqual(replayed["signal"]["evaluatedBarAt"], evaluated_bar_at)

    def test_background_evaluation_paginates_policy_warmup_beyond_500_bars(self):
        current_minute = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        history = bars(
            [100.0] * 700,
            start=current_minute - timedelta(minutes=700),
        )

        class PaginatedAdapter:
            def __init__(self):
                self.calls = []

            def fetch_ohlcv(self, request, *, limit):
                self.calls.append({"end": request.end, "limit": limit})
                eligible = [
                    bar for bar in history if request.end is None or bar.timestamp <= request.end
                ]
                page = eligible[-limit:]
                return page, DataQuality(
                    source="binance",
                    origin_source="binance",
                    is_complete=True,
                    rows=len(page),
                )

        class RecordingService:
            evaluated = None

            def snapshot(self):
                return {
                    "state": {
                        "market": "crypto",
                        "symbol": "BTC/USDT",
                        "timeframe": "1m",
                    }
                }

            def required_bar_count(self):
                return 541

            def required_fetch_bar_count(self):
                return 600

            def evaluate(self, values, *, data_source):
                self.evaluated = (values, data_source)
                return {"state": {"status": "monitoring"}}

            def record_data_blocked(self, detail):
                return {"state": {"status": "data_blocked", "detail": detail}}

        with tempfile.TemporaryDirectory() as directory:
            service = RecordingService()
            adapter = PaginatedAdapter()
            result, quality = evaluate_auto_paper_trading_once(
                service,
                cache=MarketDataCache(Path(directory) / "market.sqlite"),
                adapter=adapter,
            )

        self.assertEqual(result["state"]["status"], "monitoring")
        self.assertTrue(quality.is_complete)
        self.assertEqual([call["limit"] for call in adapter.calls], [500, 101])
        self.assertIsNotNone(service.evaluated)
        evaluated, source = service.evaluated
        self.assertEqual(len(evaluated), 600)
        self.assertEqual(source, "binance")
        self.assertEqual(evaluated[-1].timestamp, current_minute - timedelta(minutes=1))

    def test_regime_breakout_policy_persists_across_restart_and_matches_backtest_timing(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = regime_breakout_strategy()
            frozen_bars = regime_one_minute_bars(regime_five_minute_fixture())
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(directory)
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            registry = AiReviewProviderRegistry(
                (ProviderStatus("local", True, None, None),),
                {},
            )
            service = AutoPaperTradingService(
                store,
                registry,
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            with self.assertRaisesRegex(ValueError, "strategy_policy_paper_only"):
                service.configure({"executionMode": "testnet"})
            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )

            signaled = service.evaluate(frozen_bars[: 38 * 5], data_source="test")

            self.assertEqual(signaled["state"]["status"], "order_pending")
            self.assertEqual(signaled["state"]["lastDecision"]["action"], "buy")
            self.assertEqual(
                signaled["state"]["pendingPaperOrder"]["signalBarAt"],
                datetime(2026, 8, 1, 3, 9, tzinfo=timezone.utc).isoformat(),
            )
            self.assertEqual(
                signaled["state"]["pendingPaperOrder"]["strategyEvaluation"]["reason"],
                "regime_breakout",
            )
            strategy_evaluation = signaled["state"]["pendingPaperOrder"][
                "strategyEvaluation"
            ]
            strategy_evaluation_identity = {
                "contextHash": strategy_evaluation["contextHash"],
                "evaluationId": strategy_evaluation["evaluationId"],
                "stateBeforeHash": strategy_evaluation["stateBeforeHash"],
                "evaluationHash": canonical_sha256(strategy_evaluation),
            }
            decision_contract = signaled["state"]["lastDecisionContract"]
            evidence_references = [
                decision_contract["marketSnapshot"]["snapshotHash"],
                strategy_evaluation_identity["contextHash"],
                strategy_evaluation_identity["evaluationId"],
                strategy_evaluation_identity["stateBeforeHash"],
                strategy_evaluation_identity["evaluationHash"],
            ]
            for field in ("decisionProposal", "signal", "orderIntent"):
                self.assertEqual(
                    decision_contract[field]["strategyEvaluationIdentity"],
                    strategy_evaluation_identity,
                )
                self.assertEqual(
                    decision_contract[field]["evidenceReferences"],
                    evidence_references,
                )

            restarted = AutoPaperTradingService(
                store,
                registry,
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            bought = restarted.evaluate(frozen_bars[: 38 * 5 + 1], data_source="test")
            self.assertEqual(bought["state"]["status"], "traded")
            self.assertGreater(bought["state"]["position"], 0)
            self.assertEqual(bought["state"]["lastTrade"]["price"], 103.0)
            self.assertEqual(
                bought["state"]["strategyRuntimeState"]["entryFilledAt"],
                datetime(2026, 8, 1, 3, 10, tzinfo=timezone.utc).isoformat(),
            )

            exit_signal = restarted.evaluate(frozen_bars[: 40 * 5], data_source="test")
            self.assertEqual(exit_signal["state"]["lastDecision"]["action"], "sell")
            sold = restarted.evaluate(frozen_bars[: 40 * 5 + 1], data_source="test")
            self.assertEqual(sold["state"]["position"], 0)

            restarted = AutoPaperTradingService(
                store,
                registry,
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            cooldown = restarted.evaluate(frozen_bars[: 43 * 5], data_source="test")
            self.assertIsNone(cooldown["state"]["pendingPaperOrder"])
            second_signal = restarted.evaluate(frozen_bars[: 50 * 5], data_source="test")
            self.assertEqual(second_signal["state"]["lastDecision"]["action"], "buy")
            self.assertEqual(second_signal["state"]["status"], "order_pending")
            duplicate = AutoPaperTradingService(
                store,
                registry,
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            ).evaluate(frozen_bars[: 50 * 5], data_source="test")
            self.assertEqual(duplicate["state"]["tradeCount"], 2)
            self.assertEqual(
                duplicate["state"]["pendingPaperOrder"]["strategyEvaluation"]["evaluationId"],
                second_signal["state"]["pendingPaperOrder"]["strategyEvaluation"]["evaluationId"],
            )

    def test_small_account_same_open_fill_matches_backtest_risk_sized_quantity(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = regime_breakout_strategy()
            frozen_bars = small_account_policy_bars()
            signal_index = 38 * 5
            self.assertEqual(frozen_bars[signal_index - 1].close, 65_610.0)
            self.assertEqual(frozen_bars[signal_index].open, 65_610.0)
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(
                directory,
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((ProviderStatus("local", True, None, None),), {}),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure({"initialCash": 10, "paperAccountResetConfirmed": True})
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )

            signaled = service.evaluate(frozen_bars[:signal_index], data_source="test")
            bought = service.evaluate(frozen_bars[: signal_index + 1], data_source="test")
            replay = BacktestEngine(
                initial_cash=10,
                fee_rate=0.001,
                slippage_rate=0.001,
            ).run(strategy, frozen_bars[: signal_index + 1])

            self.assertEqual(signaled["state"]["status"], "order_pending")
            self.assertEqual(
                signaled["state"]["pendingPaperOrder"]["orderIntent"]["quantity"],
                0.00008,
            )
            self.assertEqual(bought["state"]["status"], "traded")
            self.assertEqual(bought["state"]["lastTrade"]["quantity"], 0.00008)
            self.assertEqual(bought["state"]["lastTrade"]["price"], 65_610.0)
            self.assertEqual(
                [(trade.side, trade.quantity) for trade in replay.trades],
                [("buy", 0.00008), ("sell", 0.00008)],
            )

    def test_dynamic_entry_cap_uses_grown_equity_above_legacy_ten_quote_limit_with_backtest_paper_parity(self):
        with tempfile.TemporaryDirectory() as directory:
            dynamic_payload = strategy_config_to_payload(regime_breakout_strategy())
            dynamic_payload["risk"]["maxEntryNotionalQuote"] = None
            dynamic_strategy = strategy_config_from_payload(dynamic_payload)
            frozen_bars = low_atr_dynamic_entry_policy_bars()
            signal_index = 38 * 5
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(
                directory,
                base_strategy=dynamic_strategy,
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure(
                {"initialCash": 100, "paperAccountResetConfirmed": True}
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )

            signaled = service.evaluate(
                frozen_bars[:signal_index],
                data_source="test",
            )
            bought = service.evaluate(
                frozen_bars[: signal_index + 1],
                data_source="test",
            )
            grown_replay = BacktestEngine(
                initial_cash=100,
                fee_rate=0.001,
                slippage_rate=0.001,
            ).run(strategy, frozen_bars[: signal_index + 1])
            initial_replay = BacktestEngine(
                initial_cash=10,
                fee_rate=0.001,
                slippage_rate=0.001,
            ).run(strategy, frozen_bars[: signal_index + 1])

            order_intent = signaled["state"]["pendingPaperOrder"]["orderIntent"]
            paper_trade = bought["state"]["lastTrade"]
            backtest_buy = grown_replay.trades[0]
            initial_buy = initial_replay.trades[0]
            self.assertGreater(float(order_intent["notionalValue"]), 10)
            self.assertGreater(
                float(paper_trade["quantity"]) * float(paper_trade["price"]),
                10,
            )
            self.assertGreater(backtest_buy.quantity * backtest_buy.price, 10)
            self.assertGreaterEqual(
                float(order_intent["quantity"]),
                float(paper_trade["quantity"]),
            )
            self.assertEqual(float(paper_trade["quantity"]), 0.0009)
            self.assertAlmostEqual(backtest_buy.quantity, 0.0009)
            self.assertLessEqual(initial_buy.quantity * initial_buy.price, 10)

    def test_policy_pending_paper_order_requires_strategy_evaluation_before_fill(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = regime_breakout_strategy()
            frozen_bars = regime_one_minute_bars(regime_five_minute_fixture())
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(
                directory,
            )
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )
            signal_index = 38 * 5
            signaled = service.evaluate(
                frozen_bars[:signal_index],
                data_source="test",
            )
            self.assertEqual(signaled["state"]["status"], "order_pending")
            cash_before = signaled["state"]["cash"]
            base_state = json.loads(json.dumps(signaled["state"]))

            rewrite_auto_state(
                store,
                lambda state: state["pendingPaperOrder"].pop("strategyEvaluation"),
            )
            blocked = service.evaluate(
                frozen_bars[: signal_index + 1],
                data_source="test",
            )

            self.assertEqual(blocked["state"]["status"], "evaluation_error")
            self.assertEqual(blocked["state"]["cash"], cash_before)
            self.assertEqual(blocked["state"]["position"], 0)
            self.assertEqual(blocked["state"]["tradeCount"], 0)
            self.assertIsInstance(blocked["state"]["pendingPaperOrder"], dict)

            def hide_all_policy_markers(state):
                state.clear()
                state.update(json.loads(json.dumps(base_state)))
                state["activeStrategyConfig"]["policy"] = None
                state["activeStrategyConfigHash"] = canonical_sha256(
                    state["activeStrategyConfig"]
                )
                state["pendingPaperOrder"].pop("strategyEvaluation")
                state["pendingPaperOrder"]["orderIntent"].pop(
                    "strategyEvaluationIdentity"
                )
                state["pendingPaperOrder"]["orderIntent"].pop(
                    "evidenceReferences"
                )

            rewrite_auto_state(store, hide_all_policy_markers)
            blocked = service.evaluate(
                frozen_bars[: signal_index + 1],
                data_source="test",
            )

            self.assertEqual(blocked["state"]["status"], "evaluation_error")
            self.assertEqual(blocked["state"]["cash"], cash_before)
            self.assertEqual(blocked["state"]["position"], 0)
            self.assertEqual(blocked["state"]["tradeCount"], 0)
            self.assertIsInstance(blocked["state"]["pendingPaperOrder"], dict)

    def test_policy_pending_paper_order_rejects_mismatched_policy_evidence_before_fill(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = regime_breakout_strategy()
            frozen_bars = regime_one_minute_bars(regime_five_minute_fixture())
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(
                directory,
            )
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )
            signal_index = 38 * 5
            signaled = service.evaluate(
                frozen_bars[:signal_index],
                data_source="test",
            )
            self.assertEqual(signaled["state"]["status"], "order_pending")
            cash_before = signaled["state"]["cash"]
            base_state = json.loads(json.dumps(signaled["state"]))

            def flip_first_gate(pending):
                gates = pending["strategyEvaluation"]["gates"]
                field = next(iter(gates))
                gates[field] = not gates[field]

            def rehash_intent(intent):
                intent_payload = dict(intent)
                intent_payload.pop("orderIntentId")
                intent["orderIntentId"] = canonical_sha256(intent_payload)

            def synchronize_intent_identity(
                pending,
                field,
                length,
                evidence_index,
            ):
                intent = pending["orderIntent"]
                replacement = "f" * length
                intent["strategyEvaluationIdentity"][field] = replacement
                intent["evidenceReferences"][evidence_index] = replacement
                rehash_intent(intent)

            def change_intent_evidence(pending, index):
                intent = pending["orderIntent"]
                intent["evidenceReferences"][index] = "f" * len(
                    intent["evidenceReferences"][index]
                )
                rehash_intent(intent)

            def synchronize_changed_atr(pending):
                evaluation = pending["strategyEvaluation"]
                evaluation["atr"] = float(evaluation["atr"] or 0) + 1
                identity = {
                    "contextHash": evaluation["contextHash"],
                    "evaluationId": evaluation["evaluationId"],
                    "stateBeforeHash": evaluation["stateBeforeHash"],
                    "evaluationHash": canonical_sha256(evaluation),
                }
                intent = pending["orderIntent"]
                intent["strategyEvaluationIdentity"] = identity
                intent["evidenceReferences"] = [
                    intent["marketSnapshotHash"],
                    identity["contextHash"],
                    identity["evaluationId"],
                    identity["stateBeforeHash"],
                    identity["evaluationHash"],
                ]
                rehash_intent(intent)

            mutations = [
                (
                    "identity-missing",
                    lambda pending: pending["orderIntent"].pop(
                        "strategyEvaluationIdentity"
                    ),
                ),
                (
                    "evidence-missing",
                    lambda pending: pending["orderIntent"].pop(
                        "evidenceReferences"
                    ),
                ),
                (
                    "evaluation-action",
                    lambda pending: pending["strategyEvaluation"].__setitem__(
                        "action", "sell"
                    ),
                ),
                (
                    "evaluation-atr",
                    lambda pending: pending["strategyEvaluation"].__setitem__(
                        "atr",
                        float(pending["strategyEvaluation"]["atr"] or 0) + 1,
                    ),
                ),
                (
                    "evaluation-gates",
                    flip_first_gate,
                ),
                (
                    "evaluation-state-after-hash",
                    lambda pending: pending["strategyEvaluation"].__setitem__(
                        "stateAfterHash", "f" * 64
                    ),
                ),
                (
                    "evaluation-atr-synchronized",
                    synchronize_changed_atr,
                ),
            ]
            for field, length, evidence_index in (
                ("contextHash", 64, 1),
                ("evaluationId", 24, 2),
                ("stateBeforeHash", 64, 3),
                ("evaluationHash", 64, 4),
            ):
                mutations.append(
                    (
                        f"identity-{field}",
                        lambda pending,
                        field=field,
                        length=length,
                        evidence_index=evidence_index: synchronize_intent_identity(
                            pending,
                            field,
                            length,
                            evidence_index,
                        ),
                    )
                )
            for index in range(5):
                mutations.append(
                    (
                        f"evidence-{index}",
                        lambda pending, index=index: change_intent_evidence(
                            pending,
                            index,
                        ),
                    )
                )

            for label, mutate_pending in mutations:
                with self.subTest(label=label):
                    def install_tampered_pending(state):
                        state.clear()
                        state.update(json.loads(json.dumps(base_state)))
                        mutate_pending(state["pendingPaperOrder"])

                    rewrite_auto_state(store, install_tampered_pending)
                    blocked = service.evaluate(
                        frozen_bars[: signal_index + 1],
                        data_source="test",
                    )

                    self.assertEqual(blocked["state"]["status"], "evaluation_error")
                    self.assertEqual(blocked["state"]["cash"], cash_before)
                    self.assertEqual(blocked["state"]["position"], 0)
                    self.assertEqual(blocked["state"]["tradeCount"], 0)
                    self.assertIsInstance(
                        blocked["state"]["pendingPaperOrder"],
                        dict,
                    )

    def test_active_policy_runtime_rejects_non_paper_mode_before_preparation(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = regime_breakout_strategy()
            frozen_bars = regime_one_minute_bars(regime_five_minute_fixture())
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(
                directory,
            )
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            sandbox = FakeSandboxService()
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                sandbox,  # type: ignore[arg-type]
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            configured = service.configure({"enabled": True})
            base_state = json.loads(json.dumps(configured["state"]))

            def force_testnet_policy(state):
                state["executionMode"] = "testnet"
                state["testnetConfirmed"] = True

            rewrite_auto_state(store, force_testnet_policy)
            blocked = service.evaluate(
                frozen_bars[: 38 * 5],
                data_source="test",
            )

            self.assertEqual(blocked["state"]["status"], "risk_paused")
            self.assertEqual(blocked["state"]["detail"], "strategy_policy_paper_only")
            self.assertEqual(blocked["state"]["position"], 0)
            self.assertEqual(blocked["state"]["tradeCount"], 0)
            self.assertEqual(sandbox.preparations, [])
            self.assertEqual(sandbox.orders, [])

            def hide_policy_in_frozen_snapshot(state):
                state.clear()
                state.update(json.loads(json.dumps(base_state)))
                state["executionMode"] = "testnet"
                state["testnetConfirmed"] = True
                state["activeStrategyConfig"]["policy"] = None
                state["activeStrategyConfigHash"] = canonical_sha256(
                    state["activeStrategyConfig"]
                )

            rewrite_auto_state(store, hide_policy_in_frozen_snapshot)
            blocked = service.evaluate(
                frozen_bars[: 38 * 5],
                data_source="test",
            )

            self.assertEqual(blocked["state"]["status"], "risk_paused")
            self.assertEqual(blocked["state"]["detail"], "strategy_policy_paper_only")
            self.assertEqual(blocked["state"]["position"], 0)
            self.assertEqual(blocked["state"]["tradeCount"], 0)
            self.assertEqual(sandbox.preparations, [])
            self.assertEqual(sandbox.orders, [])

    def test_regime_breakout_gap_down_rejects_signal_quantity_below_venue_minimum(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = regime_breakout_strategy()
            frozen_bars = regime_one_minute_bars(regime_five_minute_fixture())
            fill_index = 38 * 5
            fill_bar = frozen_bars[fill_index]
            frozen_bars[fill_index] = replace(
                fill_bar,
                open=90.0,
                low=89.9,
            )
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(directory)
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((ProviderStatus("local", True, None, None),), {}),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure(
                {"initialCash": 10, "paperAccountResetConfirmed": True}
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )

            signaled = service.evaluate(frozen_bars[:fill_index], data_source="test")
            intended_notional = float(
                signaled["state"]["pendingPaperOrder"]["orderIntent"]["notionalValue"]
            )
            filled = service.evaluate(frozen_bars[: fill_index + 1], data_source="test")
            replay = BacktestEngine(
                initial_cash=10,
                fee_rate=0.001,
                slippage_rate=0.001,
            ).run(strategy, frozen_bars[: fill_index + 1])

            self.assertGreaterEqual(intended_notional, 5)
            self.assertEqual(filled["state"]["status"], "order_rejected")
            self.assertEqual(filled["state"]["cash"], 10)
            self.assertEqual(filled["state"]["position"], 0)
            self.assertEqual(filled["state"]["tradeCount"], 0)
            self.assertEqual(
                filled["state"]["lastOrderResult"]["error"],
                "venue_minimum_notional",
            )
            self.assertEqual(replay.trades, [])

    def test_legacy_paper_session_identity_is_stable_across_read_only_snapshots(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
            )
            service.configure({"enabled": False})
            current = store.get(CONTROL_EVENT_ID)
            assert current is not None
            legacy_state = dict(current.metadata["state"])
            legacy_state.pop("paperSessionId")
            legacy_state.pop("paperSessionStartedAt")
            store.record({
                "schemaVersion": 1,
                "eventId": CONTROL_EVENT_ID,
                "eventType": "auto_paper_trading_state",
                "runId": None,
                "createdAt": current.created_at.isoformat(),
                "stage": "auto-paper-trading",
                "source": "auto-paper-trading",
                "summary": "legacy",
                "detail": "legacy",
                "metadata": {"state": legacy_state},
            })

            first = service.snapshot()["state"]
            second = service.snapshot()["state"]

            self.assertEqual(first["paperSessionId"], second["paperSessionId"])
            self.assertEqual(
                first["paperSessionStartedAt"],
                second["paperSessionStartedAt"],
            )

    def test_paper_account_initial_cash_requires_an_audited_session_reset(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
            )

            initial = service.snapshot()["state"]
            self.assertEqual(initial["initialCash"], 100.0)
            self.assertEqual(initial["cash"], 100.0)
            self.assertEqual(initial["equity"], 100.0)
            self.assertTrue(initial["paperSessionId"])

            with self.assertRaisesRegex(
                ValueError,
                "paper_account_reset_confirmation_required",
            ):
                service.configure({"initialCash": 25_000})
            with self.assertRaisesRegex(ValueError, "orderNotional_out_of_range"):
                service.configure({"executionMode": "testnet", "orderNotional": 11})

            started = service.configure(
                {
                    "initialCash": 25_000,
                    "orderNotional": 5_000,
                    "paperAccountResetConfirmed": True,
                    "enabled": True,
                }
            )
            state = started["state"]
            self.assertTrue(state["enabled"])
            self.assertEqual(state["executionMode"], "paper")
            self.assertEqual(state["initialCash"], 25_000)
            self.assertEqual(state["orderNotional"], 5_000)
            self.assertEqual(state["cash"], 25_000)
            self.assertEqual(state["availableCash"], 25_000)
            self.assertEqual(state["equity"], 25_000)
            self.assertEqual(state["dailyStartEquity"], 25_000)
            self.assertEqual(state["dailyPeakEquity"], 25_000)
            self.assertNotEqual(state["paperSessionId"], initial["paperSessionId"])
            self.assertTrue(state["paperSessionStartedAt"])
            self.assertFalse(started["liveTradingAllowed"])
            self.assertFalse(started["orderSubmissionEnabled"])
            self.assertFalse(started["routeExecuted"])

            repeated = service.configure(
                {
                    "initialCash": 25_000,
                    "orderNotional": 5_000,
                    "paperAccountResetConfirmed": True,
                    "enabled": True,
                }
            )
            self.assertEqual(repeated["state"]["paperSessionId"], state["paperSessionId"])
            self.assertEqual(
                store.count(event_type="auto_paper_account_session_reset"),
                1,
            )

            reset_event = store.list_recent(
                event_type="auto_paper_account_session_reset",
                limit=1,
            )[0]
            self.assertEqual(
                reset_event.metadata["paperSessionId"],
                state["paperSessionId"],
            )
            self.assertEqual(reset_event.metadata["initialCash"], 25_000)
            self.assertEqual(
                reset_event.metadata["previousSession"]["paperSessionId"],
                initial["paperSessionId"],
            )
            self.assertEqual(
                reset_event.metadata["previousSession"]["finalEquity"],
                100.0,
            )
            self.assertTrue(reset_event.metadata["paperOnly"])
            self.assertFalse(reset_event.metadata["orderSubmissionAllowed"])
            self.assertFalse(reset_event.metadata["routeExecuted"])

            restarted = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
            ).snapshot()["state"]
            self.assertEqual(restarted["paperSessionId"], state["paperSessionId"])
            self.assertEqual(restarted["initialCash"], 25_000)
            self.assertEqual(restarted["cash"], 25_000)

            with self.assertRaisesRegex(
                ValueError,
                "paper_account_must_be_paused_before_reset",
            ):
                service.configure(
                    {
                        "initialCash": 50_000,
                        "paperAccountResetConfirmed": True,
                    }
                )

            service.configure({"enabled": False})
            with self.assertRaisesRegex(ValueError, "orderNotional_out_of_range"):
                service.configure({"executionMode": "testnet"})

            service.configure({"orderNotional": 10})
            testnet = service.configure({"executionMode": "testnet"})
            self.assertEqual(testnet["state"]["initialCash"], 25_000)
            returned = service.configure({"executionMode": "paper"})
            self.assertEqual(returned["state"]["initialCash"], 25_000)
            self.assertEqual(returned["state"]["cash"], 25_000)
            self.assertNotEqual(returned["state"]["paperSessionId"], state["paperSessionId"])
            self.assertEqual(
                store.count(event_type="auto_paper_account_session_reset"),
                2,
            )
            closed = next(
                event.metadata["closedPaperSession"]
                for event in store.list_recent(
                    event_type="auto_paper_trading_control_change",
                    limit=10,
                )
                if event.metadata.get("closedPaperSession")
            )
            self.assertEqual(closed["paperSessionId"], state["paperSessionId"])

    def test_paper_signal_settles_at_the_next_completed_bar_open(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
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
            )
            service.configure({
                "enabled": True,
                "triggerPct": 0.3,
                "dailyLossLimitPct": 0.5,
            })
            signal_bars = bars([100, 100, 100, 100, 100, 101])

            signaled = service.evaluate(signal_bars, data_source="test")
            approved_notional = signaled["state"]["pendingPaperOrder"]["orderIntent"]["notionalValue"]
            service.configure({"orderNotional": 1})

            self.assertEqual(signaled["state"]["status"], "order_pending")
            self.assertEqual(signaled["state"]["tradeCount"], 0)
            self.assertEqual(
                signaled["state"]["pendingPaperOrder"]["signalBarAt"],
                signal_bars[-1].timestamp.isoformat(),
            )
            self.assertFalse(signaled["orderSubmissionEnabled"])
            self.assertFalse(signaled["routeExecuted"])

            fill_bar = OHLCVBar(
                symbol="BTC/USDT",
                market="crypto",
                timeframe="1m",
                timestamp=signal_bars[-1].timestamp + timedelta(minutes=1),
                open=103,
                high=105,
                low=89,
                close=90,
                volume=2,
            )
            later_bar = OHLCVBar(
                symbol="BTC/USDT",
                market="crypto",
                timeframe="1m",
                timestamp=fill_bar.timestamp + timedelta(minutes=1),
                open=110,
                high=111,
                low=109,
                close=110,
                volume=3,
            )
            restarted = AutoPaperTradingService(store, service.providers)
            missing_signal = restarted.evaluate(
                [*signal_bars[:-1], fill_bar],
                data_source="test",
            )
            self.assertEqual(missing_signal["state"]["status"], "data_blocked")
            self.assertEqual(missing_signal["state"]["tradeCount"], 0)
            self.assertIsNotNone(missing_signal["state"]["pendingPaperOrder"])

            missing_minute = restarted.evaluate(
                [*signal_bars, later_bar],
                data_source="test",
            )
            self.assertEqual(missing_minute["state"]["status"], "data_blocked")
            self.assertEqual(missing_minute["state"]["tradeCount"], 0)

            with patch.object(
                restarted,
                "_save",
                side_effect=RuntimeError("simulated_state_save_crash"),
            ):
                with self.assertRaisesRegex(RuntimeError, "simulated_state_save_crash"):
                    restarted.evaluate(
                        [*signal_bars, fill_bar, later_bar],
                        data_source="test",
                    )
            self.assertEqual(store.count(event_type="auto_paper_trade"), 1)
            restarted = AutoPaperTradingService(store, service.providers)
            filled = restarted.evaluate(
                [*signal_bars, fill_bar, later_bar],
                data_source="test",
            )

            self.assertEqual(filled["state"]["status"], "risk_paused")
            self.assertEqual(filled["state"]["tradeCount"], 1)
            self.assertEqual(filled["state"]["lastTrade"]["price"], 103)
            self.assertLessEqual(
                filled["state"]["lastTrade"]["notional"],
                approved_notional,
            )
            self.assertGreater(filled["state"]["lastTrade"]["notional"], 1)
            self.assertEqual(
                filled["state"]["lastBarTimestamp"],
                fill_bar.timestamp.isoformat(),
            )
            self.assertGreater(filled["state"]["dailyLossDrawdownPct"], 0)
            self.assertEqual(
                filled["state"]["dailyRiskHaltReason"],
                "已达到当日亏损回撤上限。",
            )
            self.assertEqual(
                filled["state"]["lastOrderResult"]["averagePrice"],
                103,
            )
            self.assertEqual(
                filled["state"]["lastOrderResult"]["state"],
                "canceled",
            )
            self.assertGreater(
                filled["state"]["lastOrderResult"]["remainingQuantity"],
                0,
            )
            self.assertEqual(
                filled["state"]["lastOrderResult"]["error"],
                "paper_budget_remainder_canceled",
            )
            self.assertIsNone(filled["state"]["pendingPaperOrder"])
            self.assertFalse(filled["orderSubmissionEnabled"])
            self.assertFalse(filled["routeExecuted"])
            trade_event = store.list_recent(event_type="auto_paper_trade", limit=1)[0]
            self.assertEqual(
                trade_event.metadata["fillPriceSource"],
                "next_completed_bar_open",
            )
            self.assertEqual(
                trade_event.metadata["paperSessionId"],
                filled["state"]["paperSessionId"],
            )

            duplicate = restarted.evaluate(
                [*signal_bars, fill_bar, later_bar],
                data_source="test",
            )
            self.assertEqual(duplicate["state"]["tradeCount"], 1)
            self.assertEqual(store.count(event_type="auto_paper_trade"), 1)

    def test_pausing_cancels_an_unfilled_paper_signal_with_control_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
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
            )
            service.configure({"enabled": True, "triggerPct": 0.3})
            signaled = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            intent_id = signaled["state"]["pendingPaperOrder"]["orderIntent"]["orderIntentId"]

            paused = service.configure({"enabled": False})

            self.assertIsNone(paused["state"]["pendingPaperOrder"])
            control = next(
                event
                for event in store.list_recent(
                    event_type="auto_paper_trading_control_change",
                    limit=5,
                )
                if event.metadata.get("cancelledPaperOrderIntentId") == intent_id
            )
            self.assertEqual(control.metadata["cancelledPaperOrderIntentId"], intent_id)

    def test_audited_strategy_binding_stays_paused_and_drives_the_next_rule_evaluation(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )
            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_operator_required",
            ):
                service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": {"name": "wenqingjie"},
                        "confirmed": True,
                    }
                )

            bound = service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "run-live-strategy",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )

            self.assertFalse(bound["state"]["enabled"])
            self.assertFalse(bound["orderSubmissionEnabled"])
            self.assertFalse(bound["routeExecuted"])
            self.assertEqual(
                bound["strategyBinding"]["revision"],
                strategy.revision,
            )
            binding_event = store.list_recent(
                event_type="auto_trading_strategy_binding",
                limit=1,
            )[0]
            self.assertIsNone(binding_event.run_id)
            self.assertEqual(
                binding_event.metadata["auditRunId"],
                "run-live-strategy",
            )
            self.assertFalse(binding_event.metadata["routeExecuted"])

            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )
            evaluated = evaluate_and_settle_paper(
                service,
                bars([100, 100, 101, 102, 103, 104]),
            )

            self.assertEqual(evaluated["state"]["lastDecision"]["action"], "buy")
            self.assertEqual(
                evaluated["state"]["lastDecisionContract"]["strategyRevision"],
                strategy.revision,
            )
            self.assertEqual(
                evaluated["state"]["lastDecisionContract"]["signal"]["strategyId"],
                f"strategy-{strategy.revision}",
            )
            self.assertEqual(
                evaluated["state"]["lastDecisionContract"]["marketSnapshot"]["barCount"],
                6,
            )
            risk_evidence = evaluated["state"]["lastDecisionContract"][
                "riskAdjustedTarget"
            ]["evidence"]
            self.assertEqual(risk_evidence["dailyLossLimitPct"], 5)
            self.assertEqual(risk_evidence["dailyProfitDrawdownLimitPct"], 5)

    def test_formally_promoted_sealed_strategy_preflights_and_binds_paper_without_starting(self):
        with tempfile.TemporaryDirectory() as directory:
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                promotion,
            ) = promoted_sealed_strategy_stores(directory)
            self.assertIsNotNone(promotion)
            production = FakeProductionService()
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                production=production,  # type: ignore[arg-type]
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )

            preflight = service.preflight_strategy_binding("fresh-sealed-p0-run")
            bound = service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )

            self.assertEqual(preflight["status"], "ready")
            self.assertTrue(preflight["switchAllowed"])
            self.assertEqual(preflight["strategyRevision"], strategy.revision)
            self.assertEqual(bound["state"]["executionMode"], "paper")
            self.assertEqual(bound["state"]["status"], "paused")
            self.assertFalse(bound["state"]["enabled"])
            self.assertEqual(bound["state"]["position"], 0)
            self.assertIsNone(bound["state"]["pendingPaperOrder"])
            self.assertTrue(bound["strategyBinding"]["paperOnly"])
            self.assertFalse(bound["orderSubmissionEnabled"])
            self.assertFalse(bound["routeExecuted"])
            self.assertEqual(production.authorization_calls, 0)
            self.assertEqual(production.account_checks, 0)
            self.assertEqual(production.preparations, [])
            self.assertEqual(production.orders, [])
            self.assertEqual(audit_store.count(event_type="auto_paper_trade"), 0)
            self.assertEqual(audit_store.count(event_type="auto_live_trade"), 0)

    def test_forward_trial_binding_api_binds_a_draft_v2_sealed_run_without_starting(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            production = FakeProductionService()
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                production=production,  # type: ignore[arg-type]
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)

            class Handler(QuantApiHandler):
                def _auto_paper_trading_service(self):
                    return service

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=30)
            try:
                connection.request(
                    "POST",
                    "/api/execution/auto-paper-trading/forward-trial-bindings",
                    body=json.dumps(
                        {
                            "strategyRevision": strategy.revision,
                            "sourceRunId": "fresh-sealed-p0-run",
                            "operator": "operator@example.com",
                            "confirmed": True,
                        }
                    ),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

            self.assertEqual(response.status, 201)
            self.assertEqual(payload["state"]["executionMode"], "paper")
            self.assertEqual(payload["state"]["status"], "paused")
            self.assertFalse(payload["state"]["enabled"])
            self.assertEqual(payload["state"]["position"], 0)
            self.assertIsNone(payload["state"]["pendingPaperOrder"])
            self.assertIsNone(payload["state"]["activeStrategyAuditRunId"])
            self.assertIsNone(payload["state"]["activeStrategyAuditHash"])
            self.assertEqual(payload["strategyBinding"]["kind"], "forward_trial")
            self.assertEqual(
                payload["strategyBinding"]["profitabilityStatus"],
                "unverified_forward_trial",
            )
            self.assertEqual(
                payload["strategyBinding"]["sourceRunId"],
                "fresh-sealed-p0-run",
            )
            self.assertTrue(payload["strategyBinding"]["developmentEvidence"]["passed"])
            self.assertGreater(
                payload["strategyBinding"]["developmentEvidence"]["totalReturnPct"],
                0,
            )
            self.assertGreaterEqual(
                payload["strategyBinding"]["developmentEvidence"]["roundTripCount"],
                1,
            )
            self.assertGreaterEqual(
                payload["strategyBinding"]["developmentEvidence"][
                    "naturalRoundTripCount"
                ],
                1,
            )
            self.assertFalse(
                payload["strategyBinding"]["developmentEvidence"][
                    "profitFactorInfinite"
                ]
            )
            self.assertTrue(
                math.isfinite(
                    payload["strategyBinding"]["developmentEvidence"][
                        "profitFactor"
                    ]
                )
            )
            json.dumps(payload, allow_nan=False)
            self.assertFalse(payload["strategyBinding"]["formalGatePassed"])
            self.assertTrue(payload["strategyBinding"]["paperOnly"])
            self.assertFalse(payload["sandboxOrderSubmissionEnabled"])
            self.assertFalse(payload["liveTradingAllowed"])
            self.assertFalse(payload["orderSubmissionEnabled"])
            self.assertFalse(payload["routeExecuted"])
            self.assertEqual(production.authorization_calls, 0)
            self.assertEqual(production.account_checks, 0)
            self.assertEqual(production.preparations, [])
            self.assertEqual(production.orders, [])
            self.assertEqual(audit_store.count(event_type="auto_live_order_intent"), 0)
            self.assertEqual(audit_store.count(event_type="auto_live_trade"), 0)
            binding = audit_store.list_recent(
                event_type="auto_trading_strategy_binding",
                limit=1,
            )[0]
            self.assertIsNone(binding.run_id)
            self.assertEqual(binding.metadata["bindingKind"], "forward_trial")
            self.assertEqual(
                binding.metadata["profitabilityStatus"],
                "unverified_forward_trial",
            )
            self.assertTrue(binding.metadata["paperOnly"])
            self.assertFalse(binding.metadata["routeExecuted"])

    def test_forward_trial_binding_rejects_forged_source_run_metrics(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            source_run = run_store.get("fresh-sealed-p0-run")
            self.assertIsNotNone(source_run)
            forged_metrics = dict(source_run.metrics)
            forged_metrics["total_return_pct"] = (
                float(forged_metrics["total_return_pct"]) + 1
            )
            connection = sqlite3.connect(run_store.path)
            try:
                connection.execute(
                    "update research_runs set metrics_json = ? where run_id = ?",
                    (
                        json.dumps(forged_metrics, sort_keys=True),
                        "fresh-sealed-p0-run",
                    ),
                )
                connection.commit()
            finally:
                connection.close()
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)

            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_backtest_replay_mismatch",
            ):
                service.bind_forward_trial(
                    {
                        "strategyRevision": strategy.revision,
                        "sourceRunId": "fresh-sealed-p0-run",
                        "operator": "operator@example.com",
                        "confirmed": True,
                    }
                )

    def test_forward_trial_binding_requires_the_exact_ten_dollar_cost_model(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(
                    directory,
                    initial_cash=100,
                    fee_bps=0,
                    slippage_bps=0,
                )
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)

            with self.assertRaisesRegex(
                ValueError,
                "forward_trial_backtest_assumptions_required",
            ):
                service.bind_forward_trial(
                    {
                        "strategyRevision": strategy.revision,
                        "sourceRunId": "fresh-sealed-p0-run",
                        "operator": "operator@example.com",
                        "confirmed": True,
                    }
                )

    def test_forward_trial_binding_requires_a_clean_ten_usdt_paper_ledger(self):
        for dirty_state in (
            None,
            {"realizedPnl": 0.1},
            {"tradeCount": 1},
        ):
            with (
                self.subTest(dirty_state=dirty_state),
                tempfile.TemporaryDirectory() as directory,
            ):
                audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
                service = AutoPaperTradingService(
                    audit_store,
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                )
                if dirty_state is not None:
                    service.configure(
                        {
                            "enabled": False,
                            "initialCash": 10,
                            "paperAccountResetConfirmed": True,
                        }
                    )
                    rewrite_auto_state(
                        audit_store,
                        lambda state: state.update(dirty_state),
                    )

                with self.assertRaisesRegex(
                    ValueError,
                    "forward_trial_binding_requires_clean_ten_usdt_ledger",
                ):
                    service.bind_forward_trial(
                        {
                            "strategyRevision": "draft-strategy",
                            "sourceRunId": "sealed-source",
                            "operator": "operator@example.com",
                            "confirmed": True,
                        }
                    )

    def test_forward_trial_binding_rejects_profit_created_only_by_end_of_backtest_exit(self):
        with tempfile.TemporaryDirectory() as directory:
            forced_exit_only_bars = cost_aware_one_minute_bars(
                [
                    *[100.0] * COST_AWARE_INDICATOR_ANCHOR_BARS,
                    98.0,
                    98.6,
                    100.5,
                ]
            )
            forced_exit_only_bars[-1] = replace(
                forced_exit_only_bars[-1],
                open=102.0,
                high=102.1,
                low=101.9,
                close=102.0,
            )
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(
                    directory,
                    audit_bars=forced_exit_only_bars,
                )
            )
            source_run = run_store.get("fresh-sealed-p0-run")
            self.assertIsNotNone(source_run)
            self.assertGreater(float(source_run.metrics["total_return_pct"]), 0)
            self.assertEqual(int(source_run.metrics["round_trip_count"]), 1)
            self.assertEqual(
                [trade["side"] for trade in source_run.backtest_trades],
                ["buy", "sell"],
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)

            with self.assertRaisesRegex(
                ValueError,
                "forward_trial_development_evidence_failed",
            ):
                service.bind_forward_trial(
                    {
                        "strategyRevision": strategy.revision,
                        "sourceRunId": "fresh-sealed-p0-run",
                        "operator": "operator@example.com",
                        "confirmed": True,
                    }
                )

    def test_forward_trial_binding_rejects_legacy_regime_breakout_draft(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                draft_sealed_forward_trial_strategy_stores(
                    directory,
                    strategy=regime_breakout_strategy(),
                    development=_profitable_fresh_reaudit_bars(),
                )
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)

            with self.assertRaisesRegex(
                ValueError,
                "forward_trial_cost_aware_policy_required",
            ):
                service.bind_forward_trial(
                    {
                        "strategyRevision": strategy.revision,
                        "sourceRunId": "fresh-sealed-p0-run",
                        "operator": "operator@example.com",
                        "confirmed": True,
                    }
                )

    def test_forward_trial_binding_rejects_the_persisted_v1_anchor_profile(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                draft_sealed_forward_trial_strategy_stores(
                    directory,
                    strategy=cost_aware_range_reversion_strategy(
                        policy_kind="cost_aware_range_reversion_v1",
                        indicator_anchor_bars=(
                            LEGACY_COST_AWARE_INDICATOR_ANCHOR_BARS
                        ),
                    ),
                    development=cost_aware_one_minute_bars(
                        [
                            *[100.0] * LEGACY_COST_AWARE_INDICATOR_ANCHOR_BARS,
                            98.0,
                            98.6,
                            100.5,
                        ],
                        following_open=101.0,
                    ),
                )
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)

            with self.assertRaisesRegex(
                ValueError,
                "^forward_trial_v11_policy_required$",
            ):
                service.bind_forward_trial(
                    {
                        "strategyRevision": strategy.revision,
                        "sourceRunId": "fresh-sealed-p0-run",
                        "operator": "operator@example.com",
                        "confirmed": True,
                    }
                )

    def test_forward_trial_binding_rejects_neighbor_entry_threshold_revisions(self):
        development = cost_aware_one_minute_bars(
            [
                *[100.0] * COST_AWARE_INDICATOR_ANCHOR_BARS,
                98.0,
                98.6,
                100.5,
            ],
            following_open=101.0,
        )
        for threshold in (-2.5, -1.5):
            with (
                self.subTest(threshold=threshold),
                tempfile.TemporaryDirectory() as directory,
            ):
                strategy, strategy_store, run_store, sealed_store = (
                    draft_sealed_forward_trial_strategy_stores(
                        directory,
                        strategy=cost_aware_range_reversion_strategy(
                            entry_z_threshold=threshold
                        ),
                        development=development,
                    )
                )
                service = AutoPaperTradingService(
                    AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                    strategy_store=strategy_store,
                    run_store=run_store,
                    sealed_dataset_store=sealed_store,
                )
                reset_clean_ten_usdt_paper_ledger(service)

                with self.assertRaisesRegex(
                    ValueError,
                    "forward_trial_fixed_profile_required",
                ):
                    service.bind_forward_trial(
                        {
                            "strategyRevision": strategy.revision,
                            "sourceRunId": "fresh-sealed-p0-run",
                            "operator": "operator@example.com",
                            "confirmed": True,
                        }
                    )

    def test_forward_trial_start_blocks_source_run_and_strategy_record_drift(self):
        for drift, expected in (
            ("source_run", "forward_trial_source_run_changed"),
            ("strategy_record", "forward_trial_strategy_record_changed"),
        ):
            with self.subTest(drift=drift), tempfile.TemporaryDirectory() as directory:
                strategy, strategy_store, run_store, sealed_store = (
                    forward_trial_strategy_stores(directory)
                )
                service = AutoPaperTradingService(
                    AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                    strategy_store=strategy_store,
                    run_store=run_store,
                    sealed_dataset_store=sealed_store,
                )
                reset_clean_ten_usdt_paper_ledger(service)
                service.bind_forward_trial(
                    {
                        "strategyRevision": strategy.revision,
                        "sourceRunId": "fresh-sealed-p0-run",
                        "operator": "operator@example.com",
                        "confirmed": True,
                    }
                )
                if drift == "source_run":
                    connection = sqlite3.connect(run_store.path)
                    statement = (
                        "update research_runs set research_note_json = ? "
                        "where run_id = ?"
                    )
                    values = (
                        json.dumps(
                            {
                                "market": "crypto",
                                "symbol": "BTC/USDT",
                                "timeframe": "1m",
                                "body": "drift",
                                "updatedAt": "2026-08-10T00:00:00+00:00",
                            },
                            sort_keys=True,
                        ),
                        "fresh-sealed-p0-run",
                    )
                else:
                    connection = sqlite3.connect(strategy_store.path)
                    statement = (
                        "update strategy_versions set name = name || ' drift' "
                        "where revision = ?"
                    )
                    values = (strategy.revision,)
                try:
                    connection.execute(statement, values)
                    connection.commit()
                finally:
                    connection.close()

                blocked_binding = service.snapshot()["strategyBinding"]
                self.assertEqual(blocked_binding["status"], "blocked")
                self.assertIn("Paper forward trial", blocked_binding["detail"])
                self.assertNotIn("生产策略", blocked_binding["detail"])
                with self.assertRaisesRegex(ValueError, expected):
                    service.configure({"enabled": True})

    def test_forward_trial_binding_api_fails_closed_for_corrupt_pending_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure({"enabled": False})
            rewrite_auto_state(
                audit_store,
                lambda state: state.update({"pendingPaperOrder": "corrupt"}),
            )

            class Handler(QuantApiHandler):
                def _auto_paper_trading_service(self):
                    return service

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=30)
            try:
                connection.request(
                    "POST",
                    "/api/execution/auto-paper-trading/forward-trial-bindings",
                    body=json.dumps(
                        {
                            "strategyRevision": strategy.revision,
                            "sourceRunId": "fresh-sealed-p0-run",
                            "operator": "operator@example.com",
                            "confirmed": True,
                        }
                    ),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

            self.assertEqual(response.status, 409)
            self.assertEqual(
                payload["detail"],
                "forward_trial_binding_requires_no_pending_order",
            )
            self.assertEqual(
                audit_store.count(event_type="auto_trading_strategy_binding"),
                0,
            )

    def test_forward_trial_start_api_must_be_a_separate_exact_request(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)
            service.bind_forward_trial(
                {
                    "strategyRevision": strategy.revision,
                    "sourceRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )

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
                    "/api/execution/auto-paper-trading",
                    body=json.dumps({"enabled": True, "triggerPct": 0.5}),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

            self.assertEqual(response.status, 400)
            self.assertEqual(
                payload["detail"],
                "forward_trial_start_request_must_be_separate",
            )
            snapshot = service.snapshot()
            self.assertFalse(snapshot["state"]["enabled"])
            self.assertEqual(snapshot["state"]["status"], "paused")

    def test_forward_trial_start_rechecks_the_clean_ten_usdt_ledger(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)
            service.bind_forward_trial(
                {
                    "strategyRevision": strategy.revision,
                    "sourceRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )
            service.configure(
                {
                    "enabled": False,
                    "initialCash": 100,
                    "paperAccountResetConfirmed": True,
                }
            )

            with self.assertRaisesRegex(
                ValueError,
                "forward_trial_binding_requires_clean_ten_usdt_ledger",
            ):
                service.configure({"enabled": True})

    def test_forward_trial_start_rejects_same_session_ledger_drift(self):
        cases = (
            (
                {"cash": 9.0, "availableCash": 9.0, "equity": 9.0},
                "forward_trial_binding_requires_clean_ten_usdt_ledger",
            ),
            (
                {"position": 0.00008},
                "forward_trial_binding_requires_flat_position",
            ),
            (
                {"pendingPaperOrder": {"side": "buy"}},
                "forward_trial_binding_requires_no_pending_order",
            ),
        )
        for dirty_state, expected in cases:
            with (
                self.subTest(dirty_state=dirty_state),
                tempfile.TemporaryDirectory() as directory,
            ):
                strategy, strategy_store, run_store, sealed_store = (
                    forward_trial_strategy_stores(directory)
                )
                audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
                service = AutoPaperTradingService(
                    audit_store,
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                    strategy_store=strategy_store,
                    run_store=run_store,
                    sealed_dataset_store=sealed_store,
                )
                reset_clean_ten_usdt_paper_ledger(service)
                service.bind_forward_trial(
                    {
                        "strategyRevision": strategy.revision,
                        "sourceRunId": "fresh-sealed-p0-run",
                        "operator": "operator@example.com",
                        "confirmed": True,
                    }
                )
                rewrite_auto_state(
                    audit_store,
                    lambda state: state.update(dirty_state),
                )

                with self.assertRaisesRegex(ValueError, expected):
                    service.configure({"enabled": True})

    def test_forward_trial_start_api_rechecks_sealed_evidence_before_enabling(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)
            service.bind_forward_trial(
                {
                    "strategyRevision": strategy.revision,
                    "sourceRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )
            source_run = run_store.get("fresh-sealed-p0-run")
            self.assertIsNotNone(source_run)
            dataset_id = source_run.data_snapshot["sealedDataset"]["datasetId"]
            connection = sqlite3.connect(sealed_store.path)
            try:
                connection.execute(
                    """
                    update sealed_dataset_bars set close = close + 1
                    where dataset_id = ? and partition_name = 'development'
                      and timestamp = (
                        select min(timestamp) from sealed_dataset_bars
                        where dataset_id = ? and partition_name = 'development'
                      )
                    """,
                    (dataset_id, dataset_id),
                )
                connection.commit()
            finally:
                connection.close()

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
                    "/api/execution/auto-paper-trading",
                    body=json.dumps({"enabled": True}),
                    headers={"Content-Type": "application/json"},
                )
                response = connection.getresponse()
                payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

            self.assertEqual(response.status, 400)
            self.assertEqual(payload["detail"], "forward_trial_sealed_evidence_changed")
            snapshot = service.snapshot()
            self.assertFalse(snapshot["state"]["enabled"])
            self.assertEqual(snapshot["state"]["status"], "paused")
            self.assertEqual(snapshot["strategyBinding"]["status"], "blocked")

    def test_forward_trial_evaluation_blocks_tampered_live_state_before_account_or_route_calls(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            production = FakeProductionService()
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                production=production,  # type: ignore[arg-type]
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)
            service.bind_forward_trial(
                {
                    "strategyRevision": strategy.revision,
                    "sourceRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )
            rewrite_auto_state(
                audit_store,
                lambda state: state.update(
                    {
                        "executionMode": "live",
                        "enabled": True,
                        "status": "monitoring",
                        "liveConfirmed": True,
                        "liveIpRestricted": True,
                        "liveControlId": production.control_id,
                        "liveOperator": "operator@example.com",
                        "liveAuthorizedUntil": (
                            datetime.now(timezone.utc) + timedelta(hours=1)
                        ).isoformat(),
                        "activeStrategyConfig": {},
                    }
                ),
            )

            result = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            self.assertEqual(result["state"]["status"], "risk_paused")
            self.assertEqual(
                result["state"]["detail"],
                "forward_trial_binding_paper_only",
            )
            self.assertEqual(production.account_checks, 0)
            self.assertEqual(production.preparations, [])
            self.assertEqual(production.orders, [])

    def test_forward_trial_binding_rejects_nonfinite_and_negative_position_state(self):
        for position in (-0.1, float("nan"), float("inf")):
            with self.subTest(position=position), tempfile.TemporaryDirectory() as directory:
                audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
                service = AutoPaperTradingService(
                    audit_store,
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                )
                service.configure({"enabled": False})
                rewrite_auto_state(
                    audit_store,
                    lambda state: state.update({"position": position}),
                )

                with self.assertRaisesRegex(
                    ValueError,
                    "forward_trial_binding_requires_flat_position",
                ):
                    service.bind_forward_trial(
                        {
                            "strategyRevision": "draft-strategy",
                            "sourceRunId": "sealed-source",
                            "operator": "operator@example.com",
                            "confirmed": True,
                        }
                    )

    def test_forward_trial_binding_rejects_unknown_or_corrupt_external_order_state(self):
        for key in ("lastTestnetOrder", "lastLiveOrder"):
            for order in ({}, {"state": "unknown"}, "corrupt"):
                with (
                    self.subTest(key=key, order=order),
                    tempfile.TemporaryDirectory() as directory,
                ):
                    audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
                    service = AutoPaperTradingService(
                        audit_store,
                        AiReviewProviderRegistry(
                            (ProviderStatus("local", True, None, None),),
                            {},
                        ),
                    )
                    service.configure({"enabled": False})
                    rewrite_auto_state(
                        audit_store,
                        lambda state: state.update({key: order}),
                    )

                    with self.assertRaisesRegex(
                        ValueError,
                        "forward_trial_binding_requires_no_pending_order",
                    ):
                        service.bind_forward_trial(
                            {
                                "strategyRevision": "draft-strategy",
                                "sourceRunId": "sealed-source",
                                "operator": "operator@example.com",
                                "confirmed": True,
                            }
                        )

    def test_forward_trial_snapshot_never_advertises_testnet_or_live_order_capability(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                sandbox=FakeSandboxService(),  # type: ignore[arg-type]
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            reset_clean_ten_usdt_paper_ledger(service)
            service.bind_forward_trial(
                {
                    "strategyRevision": strategy.revision,
                    "sourceRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )
            rewrite_auto_state(
                audit_store,
                lambda state: state.update(
                    {
                        "executionMode": "testnet",
                        "enabled": True,
                        "status": "monitoring",
                        "testnetConfirmed": True,
                        "activeStrategyConfig": {},
                    }
                ),
            )

            snapshot = service.snapshot()

            self.assertEqual(snapshot["strategyBinding"]["kind"], "forward_trial")
            self.assertEqual(snapshot["strategyBinding"]["status"], "blocked")
            self.assertFalse(snapshot["sandboxOrderSubmissionEnabled"])
            self.assertFalse(snapshot["sandboxRouteExecuted"])
            self.assertFalse(snapshot["liveTradingAllowed"])
            self.assertFalse(snapshot["orderSubmissionEnabled"])
            self.assertFalse(snapshot["routeExecuted"])

    def test_auto_fetch_window_covers_slow_ema_from_a_non_aligned_minute(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy = cost_aware_range_reversion_strategy()
            audit_store = AuditEventStore(Path(directory) / "auto-audit.sqlite")
            service = AutoPaperTradingService(
                audit_store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
            )
            service.configure({"enabled": False})
            strategy_snapshot = strategy_config_to_payload(strategy)
            rewrite_auto_state(
                audit_store,
                lambda state: state.update(
                    {
                        "activeStrategyBindingKind": "forward_trial",
                        "activeStrategyRevision": strategy.revision,
                        "activeStrategyConfig": strategy_snapshot,
                        "activeStrategyConfigHash": canonical_sha256(
                            strategy_snapshot
                        ),
                    }
                ),
            )

            fetch_bars = service.required_fetch_bar_count()
            start = datetime(2026, 8, 1, 0, 37, tzinfo=timezone.utc)
            bucket_counts: dict[datetime, int] = {}
            for index in range(fetch_bars):
                timestamp = start + timedelta(minutes=index)
                bucket = timestamp.replace(
                    hour=(timestamp.hour // 4) * 4,
                    minute=0,
                    second=0,
                    microsecond=0,
                )
                bucket_counts[bucket] = bucket_counts.get(bucket, 0) + 1

            self.assertEqual(
                fetch_bars,
                COST_AWARE_INDICATOR_ANCHOR_BARS * 240 + 239,
            )
            self.assertGreaterEqual(
                sum(count == 240 for count in bucket_counts.values()),
                COST_AWARE_INDICATOR_ANCHOR_BARS,
            )

    def test_cost_aware_forward_trial_signal_matches_backtest_four_hour_bar_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store, sealed_store = (
                forward_trial_strategy_stores(directory)
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                sealed_dataset_store=sealed_store,
            )
            service.configure(
                {
                    "enabled": False,
                    "initialCash": 10,
                    "paperAccountResetConfirmed": True,
                }
            )
            service.bind_forward_trial(
                {
                    "strategyRevision": strategy.revision,
                    "sourceRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )
            service.configure({"enabled": True})
            source_bars = cost_aware_one_minute_bars(
                [
                    *[100.0] * COST_AWARE_INDICATOR_ANCHOR_BARS,
                    98.0,
                    98.6,
                    100.5,
                ],
                following_open=101.0,
            )
            evaluation_bars = source_bars[
                : (COST_AWARE_INDICATOR_ANCHOR_BARS + 2) * 240
            ]

            service.evaluate(
                source_bars[
                    : (COST_AWARE_INDICATOR_ANCHOR_BARS + 1) * 240
                ],
                data_source="test",
            )
            evaluated = service.evaluate(evaluation_bars, data_source="test")
            backtest = BacktestEngine(
                initial_cash=10,
                fee_rate=0.001,
                slippage_rate=0.001,
            ).run(strategy, source_bars)
            buy = next(trade for trade in backtest.trades if trade.side == "buy")
            sell = next(trade for trade in backtest.trades if trade.side == "sell")
            contract = evaluated["state"]["lastDecisionContract"]

            self.assertEqual(evaluated["state"]["status"], "order_pending")
            self.assertEqual(contract["marketSnapshot"]["timeframe"], "1m")
            self.assertEqual(contract["signal"]["horizon"], "4h")
            self.assertEqual(
                contract["signal"]["evaluatedBarAt"],
                (buy.timestamp - timedelta(hours=4)).isoformat(),
            )
            self.assertEqual(
                contract["signal"]["evaluatedBarAt"],
                contract["strategyEvaluation"]["decisionBarAt"],
            )
            self.assertEqual(
                datetime.fromisoformat(contract["signal"]["expiresAt"]),
                datetime.fromisoformat(contract["signal"]["generatedAt"])
                + timedelta(hours=4),
            )

            bought = service.evaluate(
                source_bars[
                    : (COST_AWARE_INDICATOR_ANCHOR_BARS + 2) * 240 + 1
                ],
                data_source="test",
            )
            sell_signaled = service.evaluate(
                source_bars[
                    : (COST_AWARE_INDICATOR_ANCHOR_BARS + 3) * 240
                ],
                data_source="test",
            )
            sold = service.evaluate(source_bars, data_source="test")

            self.assertEqual(bought["state"]["lastTrade"]["side"], "buy")
            self.assertAlmostEqual(
                bought["state"]["lastTrade"]["price"],
                buy.price,
                places=8,
            )
            self.assertAlmostEqual(
                bought["state"]["lastTrade"]["quantity"],
                buy.quantity,
                places=12,
            )
            self.assertEqual(sell_signaled["state"]["status"], "order_pending")
            self.assertEqual(sold["state"]["lastTrade"]["side"], "sell")
            self.assertAlmostEqual(
                sold["state"]["lastTrade"]["price"],
                sell.price,
                places=8,
            )
            self.assertAlmostEqual(
                sold["state"]["lastTrade"]["quantity"],
                sell.quantity,
                places=12,
            )
            self.assertEqual(
                sold["state"]["lastTrade"]["fillPriceSource"],
                "next_completed_bar_open_with_10bps_slippage",
            )

    def test_cached_sealed_binding_rechecks_persistent_integrity_without_rereading_bars(self):
        with tempfile.TemporaryDirectory() as directory:
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(directory)

            class CountingSealedDatasetStore(SealedDatasetStore):
                def __init__(self, path):
                    super().__init__(path)
                    self.integrity_reads = 0
                    self.development_reads = 0

                def get_integrity(self, dataset_id):
                    self.integrity_reads += 1
                    return super().get_integrity(dataset_id)

                def read_development_bars(self, dataset_id):
                    self.development_reads += 1
                    return super().read_development_bars(dataset_id)

            class CountingExperimentStore(StrategyExperimentStore):
                def __init__(self, path):
                    super().__init__(path)
                    self.detail_reads = 0

                def get(self, experiment_id):
                    self.detail_reads += 1
                    return super().get(experiment_id)

            counting_store = CountingSealedDatasetStore(sealed_store.path)
            counting_experiments = CountingExperimentStore(experiment_store.path)
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=counting_experiments,
                sealed_dataset_store=counting_store,
            )

            service.preflight_strategy_binding("fresh-sealed-p0-run")
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )
            for _ in range(3):
                payload = service.snapshot()
                self.assertEqual(payload["strategyBinding"]["status"], "ready")

            self.assertEqual(counting_store.development_reads, 1)
            self.assertGreaterEqual(counting_store.integrity_reads, 4)
            self.assertEqual(counting_experiments.detail_reads, 1)

            dataset_id = str(
                run_store.get("fresh-sealed-p0-run").data_snapshot["sealedDataset"][
                    "datasetId"
                ]
            )
            connection = sqlite3.connect(counting_store.path)
            try:
                timestamp = str(
                    connection.execute(
                        """
                        select timestamp from sealed_dataset_bars
                        where dataset_id = ? and partition_name = 'development'
                        order by timestamp asc limit 1
                        """,
                        (dataset_id,),
                    ).fetchone()[0]
                )
                connection.execute(
                    """
                    update sealed_dataset_bars set close = close + 1
                    where dataset_id = ? and timestamp = ?
                    """,
                    (dataset_id, timestamp),
                )
                connection.commit()
            finally:
                connection.close()

            blocked = service.snapshot()
            self.assertEqual(blocked["strategyBinding"]["status"], "blocked")
            self.assertIn("完整性", blocked["strategyBinding"]["detail"])
            self.assertEqual(counting_store.development_reads, 1)

    def test_sealed_binding_recomputes_fresh_profitability_gate_from_replayed_audit(self):
        with tempfile.TemporaryDirectory() as directory:
            (
                _strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(directory)
            record = strategy_store.get(
                run_store.get("fresh-sealed-p0-run").strategy_revision
            )
            self.assertIsNotNone(record)
            forged = json.loads(json.dumps(record.promotion_evidence))
            forged["freshGateEvaluation"]["metrics"]["totalReturnPct"] = 99
            forged["freshGateHash"] = canonical_sha256(
                forged["freshGateEvaluation"]
            )
            forged["lineageHash"] = canonical_sha256(
                {key: value for key, value in forged.items() if key != "lineageHash"}
            )
            connection = sqlite3.connect(strategy_store.path)
            try:
                connection.execute(
                    """
                    update strategy_versions set promotion_evidence_json = ?
                    where revision = ?
                    """,
                    (json.dumps(forged, sort_keys=True), record.revision),
                )
                connection.commit()
            finally:
                connection.close()
            connection = sqlite3.connect(experiment_store.path)
            try:
                connection.execute(
                    """
                    update strategy_experiments set promotion_lineage_hash = ?
                    where experiment_id = ?
                    """,
                    (forged["lineageHash"], forged["experimentId"]),
                )
                connection.commit()
            finally:
                connection.close()

            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )

            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_promotion_evidence_invalid",
            ):
                service.preflight_strategy_binding("fresh-sealed-p0-run")

    def test_formally_promoted_dynamic_entry_cap_binds_paper_without_starting(self):
        with tempfile.TemporaryDirectory() as directory:
            dynamic_payload = strategy_config_to_payload(regime_breakout_strategy())
            dynamic_payload["risk"]["maxEntryNotionalQuote"] = None
            dynamic_strategy = strategy_config_from_payload(dynamic_payload)
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(
                directory,
                base_strategy=dynamic_strategy,
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )

            preflight = service.preflight_strategy_binding("fresh-sealed-p0-run")
            bound = service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "fresh-sealed-p0-run",
                    "operator": "operator@example.com",
                    "confirmed": True,
                }
            )

            self.assertEqual(preflight["status"], "ready")
            self.assertIsNone(
                bound["state"]["activeStrategyConfig"]["risk"][
                    "maxEntryNotionalQuote"
                ]
            )
            self.assertEqual(bound["state"]["status"], "paused")
            self.assertFalse(bound["state"]["enabled"])
            self.assertFalse(bound["orderSubmissionEnabled"])
            self.assertFalse(bound["routeExecuted"])

    def test_sealed_strategy_binding_fails_closed_for_snapshot_quality_or_store_drift(self):
        mutation_cases = {
            "dataset": lambda audit: replace(
                audit,
                data_snapshot={
                    **audit.data_snapshot,
                    "sealedDataset": {
                        **audit.data_snapshot["sealedDataset"],
                        "datasetHash": "f" * 64,
                    },
                },
            ),
            "context": lambda audit: replace(
                audit,
                data_snapshot={
                    **audit.data_snapshot,
                    "sealedDataset": {
                        **audit.data_snapshot["sealedDataset"],
                        "symbol": "ETH/USDT",
                    },
                },
            ),
            "development_hash": lambda audit: replace(
                audit,
                data_snapshot={**audit.data_snapshot, "hash": "e" * 64},
            ),
            "data_quality": lambda audit: replace(
                audit,
                data_quality={
                    **audit.data_quality,
                    "canonicalHash": "d" * 64,
                },
            ),
        }
        for label, mutate in mutation_cases.items():
            with self.subTest(label=label), tempfile.TemporaryDirectory() as directory:
                (
                    _strategy,
                    strategy_store,
                    run_store,
                    experiment_store,
                    sealed_store,
                    _promotion,
                ) = promoted_sealed_strategy_stores(directory)
                audit = run_store.get("fresh-sealed-p0-run")
                self.assertIsNotNone(audit)
                tampered_audit = mutate(audit)

                class TamperedRunStore:
                    def get(self, run_id):
                        return tampered_audit if run_id == "fresh-sealed-p0-run" else None

                production = FakeProductionService()
                service = AutoPaperTradingService(
                    AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                    production=production,  # type: ignore[arg-type]
                    strategy_store=strategy_store,
                    run_store=TamperedRunStore(),  # type: ignore[arg-type]
                    strategy_experiment_store=experiment_store,
                    sealed_dataset_store=sealed_store,
                )

                with self.assertRaisesRegex(ValueError, "strategy_binding_"):
                    service.preflight_strategy_binding("fresh-sealed-p0-run")

                self.assertEqual(production.authorization_calls, 0)
                self.assertEqual(production.orders, [])

        for missing_dependency in ("sealed", "experiment"):
            with self.subTest(missing=missing_dependency), tempfile.TemporaryDirectory() as directory:
                (
                    _strategy,
                    strategy_store,
                    run_store,
                    experiment_store,
                    sealed_store,
                    _promotion,
                ) = promoted_sealed_strategy_stores(directory)
                service = AutoPaperTradingService(
                    AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                    strategy_store=strategy_store,
                    run_store=run_store,
                    strategy_experiment_store=(
                        None if missing_dependency == "experiment" else experiment_store
                    ),
                    sealed_dataset_store=(
                        None if missing_dependency == "sealed" else sealed_store
                    ),
                )

                with self.assertRaisesRegex(ValueError, "strategy_binding_"):
                    service.preflight_strategy_binding("fresh-sealed-p0-run")

    def test_version_two_audited_save_without_formal_promotion_cannot_bind(self):
        with tempfile.TemporaryDirectory() as directory:
            (
                _strategy,
                strategy_store,
                run_store,
                experiment_store,
                sealed_store,
                promotion,
            ) = promoted_sealed_strategy_stores(directory, promote=False)
            self.assertIsNone(promotion)
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "auto-audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
                strategy_experiment_store=experiment_store,
                sealed_dataset_store=sealed_store,
            )

            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_promotion_evidence_required",
            ):
                service.preflight_strategy_binding("fresh-sealed-p0-run")

    def test_fresh_sealed_promotion_fails_closed_without_the_dataset_store(self):
        with tempfile.TemporaryDirectory() as directory:
            (
                strategy,
                strategy_store,
                run_store,
                experiment_store,
                _sealed_store,
                _promotion,
            ) = promoted_sealed_strategy_stores(directory, promote=False)
            runner = StrategyExperimentRunner(
                strategy_store=strategy_store,
                run_store=run_store,
                experiment_store=experiment_store,
            )

            with self.assertRaises(StrategyExperimentError) as raised:
                runner.promote_winner(
                    "experiment-promotable",
                    fresh_source_run_id="fresh-sealed-p0-run",
                    operator="operator@example.com",
                    confirmed=True,
                )

            self.assertEqual(raised.exception.error, "sealed_dataset_unavailable")
            saved = strategy_store.get(strategy.revision)
            self.assertIsNotNone(saved)
            self.assertIsNone(saved.promotion_evidence)
            detail = experiment_store.get("experiment-promotable")
            self.assertIsNotNone(detail)
            self.assertIsNone(detail.experiment.promotion_run_id)

    def test_strategy_binding_preflight_is_read_only_and_reports_production_replay(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )

            preflight = service.preflight_strategy_binding("run-live-strategy")

            self.assertEqual(preflight["status"], "ready")
            self.assertTrue(preflight["switchAllowed"])
            self.assertFalse(preflight["alreadyBound"])
            self.assertEqual(preflight["strategyRevision"], strategy.revision)
            self.assertEqual(preflight["productionReplay"]["feeBps"], 10)
            self.assertEqual(preflight["productionReplay"]["slippageBps"], 10)
            self.assertEqual(
                preflight["boundary"],
                {
                    "authorizesLive": False,
                    "startsMonitoring": False,
                    "evaluatesNow": False,
                    "submitsOrder": False,
                },
            )
            self.assertEqual(store.list_recent(limit=100), [])

            service.configure({"enabled": True})
            event_ids = [
                event.event_id for event in store.list_recent(limit=100)
            ]
            blocked = service.preflight_strategy_binding("run-live-strategy")

            self.assertEqual(blocked["status"], "review")
            self.assertFalse(blocked["switchAllowed"])
            self.assertEqual(
                blocked["switchBlockedReason"],
                "strategy_switch_requires_paused_monitoring",
            )
            self.assertEqual(
                [event.event_id for event in store.list_recent(limit=100)],
                event_ids,
            )

    def test_strategy_binding_rejects_non_backtest_execution_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            audit = run_store.get("run-live-strategy")
            self.assertIsNotNone(audit)
            run_store.record(replace(audit, execution_mode="certified_live"))
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )

            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_audit_execution_mode_invalid",
            ):
                service.preflight_strategy_binding("run-live-strategy")

    def test_active_strategy_keeps_its_pinned_audit_when_a_new_backtest_becomes_current(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "run-live-strategy",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            original = run_store.get("run-live-strategy")
            self.assertIsNotNone(original)
            run_store.record(
                replace(
                    original,
                    run_id="run-live-strategy-new",
                    created_at=datetime(2026, 7, 30, 1, tzinfo=timezone.utc),
                )
            )
            strategy_store.save(
                strategy,
                audit_run_id="run-live-strategy-new",
            )

            snapshot = service.snapshot()
            active = service.preflight_strategy_binding("run-live-strategy")
            candidate = service.preflight_strategy_binding(
                "run-live-strategy-new"
            )
            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_audit_run_mismatch",
            ):
                AutoPaperTradingService(
                    AuditEventStore(Path(directory) / "new-audit.sqlite"),
                    AiReviewProviderRegistry(
                        (ProviderStatus("local", True, None, None),),
                        {},
                    ),
                    strategy_store=strategy_store,
                    run_store=run_store,
                ).configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": "wenqingjie",
                        "confirmed": True,
                    }
                )
            new_current = run_store.get("run-live-strategy-new")
            self.assertIsNotNone(new_current)
            run_store.record(
                replace(
                    new_current,
                    execution_mode="certified_live",
                )
            )
            service.configure({"enabled": True})
            evaluated = evaluate_and_settle_paper(
                service,
                bars([100, 100, 101, 102, 103, 104]),
            )
            trade = store.list_recent(
                event_type="auto_paper_trade",
                limit=1,
            )[0]

            self.assertEqual(
                snapshot["strategyBinding"]["auditRunId"],
                "run-live-strategy",
            )
            self.assertEqual(active["status"], "active")
            self.assertTrue(active["alreadyBound"])
            self.assertEqual(candidate["status"], "ready")
            self.assertFalse(candidate["alreadyBound"])
            self.assertEqual(evaluated["state"]["lastDecision"]["action"], "buy")
            self.assertEqual(trade.metadata["auditRunId"], "run-live-strategy")
            self.assertEqual(
                trade.metadata["auditHash"],
                snapshot["state"]["activeStrategyAuditHash"],
            )

    def test_strategy_binding_state_and_audit_event_are_written_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )
            request = {
                "strategyRevision": strategy.revision,
                "auditRunId": "run-live-strategy",
                "operator": "wenqingjie",
                "confirmed": True,
            }
            connection = sqlite3.connect(store.path)
            try:
                connection.execute(
                    """
                    create trigger fail_strategy_binding
                    before insert on audit_events
                    when new.event_type = 'auto_trading_strategy_binding'
                    begin
                        select raise(abort, 'injected_batch_failure');
                    end
                    """
                )
                connection.commit()
            finally:
                connection.close()

            with self.assertRaisesRegex(
                sqlite3.IntegrityError,
                "injected_batch_failure",
            ):
                service.configure(request)

            self.assertEqual(store.list_recent(limit=100), [])
            connection = sqlite3.connect(store.path)
            try:
                connection.execute("drop trigger fail_strategy_binding")
                connection.commit()
            finally:
                connection.close()
            bound = service.configure(request)
            self.assertEqual(
                bound["strategyBinding"]["auditRunId"],
                "run-live-strategy",
            )
            self.assertEqual(
                len(
                    store.list_recent(
                        event_type="auto_trading_strategy_binding",
                        limit=10,
                    )
                ),
                1,
            )

    def test_repeated_strategy_binding_requires_confirmation_and_writes_no_events(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )
            request = {
                "strategyRevision": strategy.revision,
                "auditRunId": "run-live-strategy",
                "operator": "wenqingjie",
                "confirmed": True,
            }
            first = service.configure(request)
            event_ids = [event.event_id for event in store.list_recent(limit=100)]

            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_confirmation_required",
            ):
                service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": "wenqingjie",
                    }
                )
            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_operator_required",
            ):
                service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "confirmed": True,
                    }
                )
            repeated = service.configure(request)

            self.assertEqual(repeated["state"]["updatedAt"], first["state"]["updatedAt"])
            self.assertEqual(
                [event.event_id for event in store.list_recent(limit=100)],
                event_ids,
            )

    def test_strategy_binding_requires_paused_flat_state_and_fetches_strategy_warmup(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(
                directory,
                entry_window=20,
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )
            service.configure({"enabled": True})

            with self.assertRaisesRegex(
                ValueError,
                "strategy_switch_requires_paused_monitoring",
            ):
                service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": "wenqingjie",
                        "confirmed": True,
                    }
                )

            service.configure({"enabled": False})
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "run-live-strategy",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            self.assertEqual(service.required_bar_count(), 20)

    def test_strategy_binding_rejects_position_and_unreconciled_order_switches(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
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
            position_service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "position-audit.sqlite"),
                registry,
                strategy_store=strategy_store,
                run_store=run_store,
            )
            position_service.configure(
                {"enabled": True, "triggerPct": 0.3}
            )
            bought = evaluate_and_settle_paper(
                position_service,
                bars([100, 100, 100, 100, 100, 101]),
            )
            self.assertGreater(bought["state"]["position"], 0)
            position_service.configure({"enabled": False})
            with self.assertRaisesRegex(
                ValueError,
                "strategy_switch_requires_flat_position",
            ):
                position_service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": "wenqingjie",
                        "confirmed": True,
                    }
                )

            pending_service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "pending-audit.sqlite"),
                registry,
                FakePendingSandboxService(),  # type: ignore[arg-type]
                strategy_store=strategy_store,
                run_store=run_store,
            )
            pending_service.configure(
                {
                    "enabled": True,
                    "executionMode": "testnet",
                    "testnetConfirmed": True,
                    "triggerPct": 0.3,
                }
            )
            pending = pending_service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            self.assertEqual(pending["state"]["status"], "order_pending")
            pending_service.configure({"enabled": False})
            with self.assertRaisesRegex(
                ValueError,
                "strategy_switch_requires_reconciled_orders",
            ):
                pending_service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": "wenqingjie",
                        "confirmed": True,
                    }
                )

    def test_strategy_binding_preserves_risk_and_trade_ledger(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
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
                strategy_store=strategy_store,
                run_store=run_store,
            )
            service.configure(
                {
                    "enabled": True,
                    "triggerPct": 0.3,
                    "dailyLossLimitPct": 0.1,
                }
            )
            evaluate_and_settle_paper(
                service,
                bars([100, 100, 100, 100, 100, 101]),
            )
            exited = evaluate_and_settle_paper(
                service,
                bars(
                    [101, 101, 101, 101, 101, 99],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
            )
            self.assertEqual(exited["state"]["position"], 0)
            self.assertTrue(exited["state"]["dailyRiskHaltReason"])
            service.configure({"enabled": False})
            before = service.snapshot()["state"]

            bound = service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "run-live-strategy",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            after = bound["state"]

            for field in (
                "cash",
                "equity",
                "realizedPnl",
                "dailyStartEquity",
                "dailyPeakEquity",
                "dailyLossDrawdownPct",
                "dailyRiskHaltReason",
                "tradeCount",
                "tradeTimestamps",
                "lastTrade",
                "lastOrderResult",
            ):
                self.assertEqual(after[field], before[field], field)
            self.assertIsNone(after["lastBarTimestamp"])
            self.assertIsNone(after["lastDecisionContract"])

            service.configure({"enabled": True})
            blocked = service.evaluate(
                bars(
                    [99, 99, 99, 99, 99, 100],
                    start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            self.assertEqual(blocked["state"]["position"], 0)
            self.assertEqual(blocked["state"]["tradeCount"], before["tradeCount"])
            self.assertEqual(blocked["state"]["status"], "risk_paused")

    def test_strategy_binding_pins_audit_identity_and_keeps_trade_events_detached_from_research_export(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )
            service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "run-live-strategy",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            control = store.list_recent(
                event_type="auto_paper_trading_control_change",
                limit=1,
            )[0]
            self.assertIsNone(control.run_id)
            self.assertEqual(control.metadata["auditRunId"], "run-live-strategy")
            self.assertTrue(control.metadata["auditHash"])

            original = run_store.get("run-live-strategy")
            self.assertIsNotNone(original)
            run_store.record(
                replace(
                    original,
                    metrics={
                        **original.metrics,
                        "total_return_pct": (
                            float(original.metrics["total_return_pct"]) + 1
                        ),
                    },
                )
            )

            snapshot = service.snapshot()
            self.assertEqual(snapshot["strategyBinding"]["status"], "blocked")
            self.assertIn("绑定的审计证据已变更", snapshot["strategyBinding"]["detail"])

    def test_strategy_binding_audit_drift_blocks_entry_but_keeps_frozen_exit_rules(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(
                directory,
                entry_window=20,
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )
            bound = service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "run-live-strategy",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )
            self.assertTrue(bound["state"]["activeStrategyConfigHash"])
            service.configure(
                {
                    "enabled": True,
                    "dailyLossLimitPct": 20,
                    "dailyProfitDrawdownLimitPct": 20,
                }
            )
            bought = evaluate_and_settle_paper(
                service,
                bars([100 + index for index in range(20)]),
            )
            self.assertGreater(bought["state"]["position"], 0)

            original = run_store.get("run-live-strategy")
            self.assertIsNotNone(original)
            run_store.record(
                replace(
                    original,
                    metrics={
                        **original.metrics,
                        "total_return_pct": (
                            float(original.metrics["total_return_pct"]) + 1
                        ),
                    },
                )
            )

            self.assertEqual(service.required_bar_count(), 20)
            exited = evaluate_and_settle_paper(
                service,
                bars(
                    [119] * 19 + [118.5],
                    start=datetime(2026, 7, 27, tzinfo=timezone.utc),
                ),
            )
            self.assertEqual(exited["state"]["position"], 0)
            self.assertEqual(exited["state"]["lastDecision"]["action"], "sell")

            blocked = service.evaluate(
                bars(
                    [118.5] * 19 + [119],
                    start=datetime(2026, 7, 28, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            self.assertEqual(blocked["state"]["status"], "risk_paused")
            self.assertIn("已禁止开新仓", blocked["state"]["detail"])

    def test_strategy_binding_rejects_forged_backtest_metrics(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            audit = run_store.get("run-live-strategy")
            self.assertIsNotNone(audit)
            run_store.record(
                replace(
                    audit,
                    metrics={
                        **audit.metrics,
                        "trade_count": int(audit.metrics["trade_count"]) + 1,
                    },
                )
            )
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )

            with self.assertRaisesRegex(
                ValueError,
                "strategy_binding_backtest_replay_mismatch",
            ):
                service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": "wenqingjie",
                        "confirmed": True,
                    }
                )

    def test_strategy_binding_accepts_legacy_v1_metrics_without_round_trip_count(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            audit = run_store.get("run-live-strategy")
            self.assertIsNotNone(audit)
            metrics = dict(audit.metrics)
            metrics.pop("round_trip_count", None)
            run_store.record(replace(audit, metrics=metrics))
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )

            result = service.configure(
                {
                    "strategyRevision": strategy.revision,
                    "auditRunId": "run-live-strategy",
                    "operator": "wenqingjie",
                    "confirmed": True,
                }
            )

        self.assertEqual(result["strategyBinding"]["status"], "ready")

    def test_strategy_binding_compares_full_strategy_payload_not_only_short_revision(self):
        with tempfile.TemporaryDirectory() as directory:
            strategy, strategy_store, run_store = audited_strategy_stores(directory)
            collision = replace(strategy, name="伪造的同短版本策略")
            object.__setattr__(collision, "revision", strategy.revision)
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                strategy_store=strategy_store,
                run_store=run_store,
            )

            with patch(
                "quant_core.auto_paper_trading.strategy_config_from_payload",
                side_effect=(strategy, collision),
            ), self.assertRaisesRegex(
                ValueError,
                "strategy_binding_audit_strategy_mismatch",
            ):
                service.configure(
                    {
                        "strategyRevision": strategy.revision,
                        "auditRunId": "run-live-strategy",
                        "operator": "wenqingjie",
                        "confirmed": True,
                    }
                )

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

            self.assertEqual(result["state"]["status"], "order_pending")
            self.assertIsNotNone(result["state"]["pendingPaperOrder"])
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
            self.assertEqual(state["tradeCount"], 0)
            self.assertIsNotNone(state["pendingPaperOrder"])
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

    def test_backend_runner_adopts_interval_without_direct_evaluation(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((), {}),
            )
            evaluations = 0

            def evaluate_once():
                nonlocal evaluations
                evaluations += 1

            runner = AutoPaperTradingRunner(
                service,
                evaluate_once,
                interval_seconds=60,
            )
            runner.start()
            try:
                deadline = time.monotonic() + 0.5
                while (
                    service.snapshot()["state"]["runnerCycleCount"] < 1
                    and time.monotonic() < deadline
                ):
                    time.sleep(0.01)
                runner.update_interval(0.05)
                self.assertEqual(evaluations, 0)
                deadline = time.monotonic() + 1.2
                while (
                    service.snapshot()["state"]["runnerCycleCount"] < 2
                    and time.monotonic() < deadline
                ):
                    time.sleep(0.01)
            finally:
                runner.stop()

            self.assertGreaterEqual(
                service.snapshot()["state"]["runnerCycleCount"],
                2,
            )
            self.assertEqual(evaluations, 0)
            self.assertEqual(runner.interval_seconds, 0.05)

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

            self.assertEqual(state["tradeCount"], 0)
            self.assertIsNotNone(state["pendingPaperOrder"])

    def test_api_runner_reads_interval_from_platform_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            class Handler(QuantApiHandler):
                audit_event_store = AuditEventStore(Path(directory) / "audit.sqlite")
                platform_settings_environ = {
                    "AIQT_AUTO_TRADING_INTERVAL_SECONDS": "17",
                }
                platform_settings_store = PlatformSettingsStore(
                    Path(directory) / "settings.sqlite",
                    Path(directory) / "settings.key",
                )
                strategy_experiment_store = StrategyExperimentStore(
                    Path(directory) / "experiments.sqlite"
                )
                sealed_dataset_store = SealedDatasetStore(
                    Path(directory) / "sealed.sqlite"
                )
                execution_adapter_health_environ = {}
                execution_adapter_health_exchange_factory = None
                stage6_sandbox_route_factory = None

            runner = build_auto_paper_trading_runner(Handler)

            self.assertEqual(runner.interval_seconds, 17)
            self.assertIs(
                runner.service.strategy_experiment_store,
                Handler.strategy_experiment_store,
            )
            self.assertIs(
                runner.service.sealed_dataset_store,
                Handler.sealed_dataset_store,
            )

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

    def test_production_strategy_handoff_preflight_api_is_read_only(self):
        class PreflightService:
            def __init__(self) -> None:
                self.calls = []

            def preflight_strategy_binding(self, run_id):
                self.calls.append(run_id)
                return {
                    "runId": run_id,
                    "strategyRevision": "rev-production",
                    "status": "ready",
                    "evidenceStatus": "eligible",
                    "switchAllowed": True,
                    "alreadyBound": False,
                    "boundary": {
                        "authorizesLive": False,
                        "startsMonitoring": False,
                        "evaluatesNow": False,
                        "submitsOrder": False,
                    },
                }

        service = PreflightService()

        class Handler(QuantApiHandler):
            def _auto_paper_trading_service(self):
                return service

        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(*server.server_address, timeout=5)
        try:
            connection.request(
                "GET",
                "/api/research/runs/run-production/production-strategy-handoff",
            )
            response = connection.getresponse()
            payload = json.loads(response.read())
        finally:
            connection.close()
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

        self.assertEqual(response.status, 200)
        self.assertEqual(service.calls, ["run-production"])
        self.assertEqual(
            payload["productionStrategyHandoff"]["boundary"]["submitsOrder"],
            False,
        )

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
            filled = evaluate_and_settle_paper(
                service,
                rising,
                data_source="manual",
            )
            self.assertEqual(filled["state"]["tradeCount"], 1)
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

            production.enabled = False
            disabled = service.snapshot()
            self.assertEqual(disabled["state"]["executionMode"], "live")
            self.assertTrue(disabled["state"]["enabled"])
            self.assertFalse(disabled["productionLive"]["enabled"])
            self.assertFalse(disabled["liveTradingAllowed"])
            self.assertFalse(disabled["orderSubmissionEnabled"])
            production.enabled = True

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

    def test_live_exit_can_sell_managed_position_above_buy_notional_limit(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
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
            production = FakeProductionService()
            service = AutoPaperTradingService(
                store,
                registry,
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "initialCash": 10,
                "paperAccountResetConfirmed": True,
                "orderNotional": 10,
            })
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 0.3,
                "takeProfitPct": 2,
            })

            entered = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            self.assertEqual(entered["state"]["tradeCount"], 1)
            self.assertEqual(production.orders[0]["side"], "buy")
            self.assertLessEqual(production.orders[0]["notionalValue"], 10)
            entered_position = entered["state"]["position"]

            exited = service.evaluate(
                bars(
                    [104, 104, 104, 104, 104, 104],
                    start=datetime(2026, 7, 26, 0, 6, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(len(production.orders), 2)
            self.assertEqual(production.orders[1]["side"], "sell")
            self.assertEqual(production.orders[1]["quantity"], entered_position)
            self.assertGreater(production.orders[1]["notionalValue"], 10)
            self.assertLessEqual(production.orders[1]["riskBudgetNotional"], 10)
            self.assertEqual(exited["state"]["status"], "traded")
            self.assertEqual(exited["state"]["tradeCount"], 2)
            self.assertEqual(exited["state"]["position"], 0)
            self.assertEqual(exited["state"]["lastTrade"]["side"], "sell")
            self.assertEqual(store.count(event_type="auto_live_trade"), 2)

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

    def test_live_first_account_snapshot_establishes_real_baseline_without_order(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            production = FakeProductionService()
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:30:00+08:00",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 14.74497057,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-snapshot-first",
                "assets": {
                    "BTC": {
                        "free": 0.0,
                        "used": 0.0,
                        "total": 0.0,
                        "priceUsdt": 64_500.0,
                        "valueUsdt": 0.0,
                    },
                    "USDT": {
                        "free": 14.74497057,
                        "used": 0.0,
                        "total": 14.74497057,
                        "priceUsdt": 1.0,
                        "valueUsdt": 14.74497057,
                    },
                },
            }
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

            self.assertEqual(result["state"]["status"], "account_synchronized")
            self.assertEqual(result["state"]["cash"], 14.74497057)
            self.assertEqual(result["state"]["position"], 0.0)
            self.assertEqual(result["state"]["equity"], 14.74497057)
            self.assertEqual(result["state"]["dailyStartEquity"], 14.74497057)
            self.assertEqual(result["state"]["dailyPeakEquity"], 14.74497057)
            self.assertEqual(
                result["state"]["lastAccountCheck"]["accountSnapshotHash"],
                "account-snapshot-first",
            )
            self.assertTrue(
                result["state"]["lastAccountCheck"]["accountCovered"]
            )
            self.assertEqual(
                store.count(event_type="auto_live_account_sync"),
                1,
            )
            self.assertEqual(production.orders, [])

    def test_live_account_identity_change_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            production = FakeProductionService()
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:30:00+08:00",
                "accountFingerprint": "binance-account-a",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 20.0,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-a-snapshot",
                "assets": {
                    "BTC": {
                        "free": 0.0,
                        "used": 0.0,
                        "total": 0.0,
                        "priceUsdt": 64_500.0,
                        "valueUsdt": 0.0,
                    },
                    "USDT": {
                        "free": 20.0,
                        "used": 0.0,
                        "total": 20.0,
                        "priceUsdt": 1.0,
                        "valueUsdt": 20.0,
                    },
                },
            }
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
                production=production,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "live",
                "liveConfirmed": True,
                "liveOperator": "wenqingjie",
                "triggerPct": 10.0,
            })
            service.evaluate(
                bars([100, 100, 100, 100, 100, 100]),
                data_source="test",
            )
            production.account_snapshot = None
            missing = service.evaluate(
                bars(
                    [100, 100, 100, 100, 100, 100],
                    start=datetime(2026, 7, 26, 0, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            self.assertEqual(missing["state"]["status"], "account_mismatch")
            self.assertEqual(
                missing["state"]["lastAccountCheck"]["checkCode"],
                "binance_spot_account_snapshot_required",
            )
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:31:00+08:00",
                "accountFingerprint": "binance-account-b",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 20.0,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-b-snapshot",
                "assets": {
                    "BTC": {
                        "free": 0.0,
                        "used": 0.0,
                        "total": 0.0,
                        "priceUsdt": 64_500.0,
                        "valueUsdt": 0.0,
                    },
                    "USDT": {
                        "free": 20.0,
                        "used": 0.0,
                        "total": 20.0,
                        "priceUsdt": 1.0,
                        "valueUsdt": 20.0,
                    },
                },
            }

            blocked = service.evaluate(
                bars(
                    [100, 100, 100, 100, 100, 100],
                    start=datetime(2026, 7, 26, 0, 2, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(blocked["state"]["status"], "account_mismatch")
            self.assertEqual(
                blocked["state"]["accountFingerprint"],
                "binance-account-a",
            )
            self.assertFalse(
                blocked["state"]["lastAccountCheck"]["accountCovered"]
            )
            self.assertEqual(
                blocked["state"]["lastAccountCheck"]["checkCode"],
                "binance_spot_account_identity_changed",
            )
            self.assertIn("账户身份变化", blocked["state"]["detail"])
            self.assertEqual(production.orders, [])

    def test_live_account_conversion_syncs_asset_mix_without_drawdown_or_order(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            production = FakeProductionService()
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:30:00+08:00",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 14.74497057,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-snapshot-with-btc",
                "assets": {
                    "BTC": {
                        "free": 0.00001985,
                        "used": 0.0,
                        "total": 0.00001985,
                        "priceUsdt": 64_500.0,
                        "valueUsdt": 1.280325,
                    },
                    "USDT": {
                        "free": 13.46464557,
                        "used": 0.0,
                        "total": 13.46464557,
                        "priceUsdt": 1.0,
                        "valueUsdt": 13.46464557,
                    },
                },
            }
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
            baseline = service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:31:00+08:00",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 14.74497057,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-snapshot-usdt-only",
                "assets": {
                    "BTC": {
                        "free": 0.0,
                        "used": 0.0,
                        "total": 0.0,
                        "priceUsdt": 64_500.0,
                        "valueUsdt": 0.0,
                    },
                    "USDT": {
                        "free": 14.74497057,
                        "used": 0.0,
                        "total": 14.74497057,
                        "priceUsdt": 1.0,
                        "valueUsdt": 14.74497057,
                    },
                },
            }

            synchronized = service.evaluate(
                bars(
                    [100, 100, 100, 100, 101, 99],
                    start=datetime(2026, 7, 26, 0, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(baseline["state"]["status"], "account_synchronized")
            self.assertEqual(synchronized["state"]["status"], "account_synchronized")
            self.assertEqual(synchronized["state"]["cash"], 14.74497057)
            self.assertEqual(synchronized["state"]["position"], 0.0)
            self.assertEqual(synchronized["state"]["equity"], 14.74497057)
            self.assertEqual(synchronized["state"]["dailyLossDrawdownPct"], 0.0)
            self.assertEqual(synchronized["state"]["dailyProfitDrawdownPct"], 0.0)
            self.assertEqual(synchronized["state"]["lastExternalFlowUsdt"], 0.0)
            self.assertEqual(
                synchronized["state"]["lastAccountCheck"]["accountSnapshotHash"],
                "account-snapshot-usdt-only",
            )
            self.assertEqual(
                store.count(event_type="auto_live_account_sync"),
                2,
            )
            self.assertEqual(production.orders, [])

    def test_live_account_snapshot_does_not_reclassify_own_trade_as_external_flow(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            production = FakeProductionService()
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:30:00+08:00",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 100.0,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-snapshot-before-own-trade",
                "assets": {
                    "BTC": {
                        "free": 0.0,
                        "used": 0.0,
                        "total": 0.0,
                        "priceUsdt": 101.0,
                        "valueUsdt": 0.0,
                    },
                    "USDT": {
                        "free": 100.0,
                        "used": 0.0,
                        "total": 100.0,
                        "priceUsdt": 1.0,
                        "valueUsdt": 100.0,
                    },
                },
            }
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
            service.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )
            traded = service.evaluate(
                bars(
                    [100, 100, 100, 100, 101, 102],
                    start=datetime(2026, 7, 26, 0, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            position = traded["state"]["position"]
            cash = traded["state"]["cash"]
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:32:00+08:00",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": round(cash + position * 102.0, 8),
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-snapshot-after-own-trade",
                "assets": {
                    "BTC": {
                        "free": position,
                        "used": 0.0,
                        "total": position,
                        "priceUsdt": 102.0,
                        "valueUsdt": round(position * 102.0, 8),
                    },
                    "USDT": {
                        "free": cash,
                        "used": 0.0,
                        "total": cash,
                        "priceUsdt": 1.0,
                        "valueUsdt": cash,
                    },
                },
            }

            after_sync = service.evaluate(
                bars(
                    [102, 102, 102, 102, 102, 102],
                    start=datetime(2026, 7, 26, 0, 2, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(traded["state"]["status"], "traded")
            self.assertEqual(after_sync["state"]["position"], position)
            self.assertEqual(after_sync["state"]["cash"], cash)
            self.assertEqual(after_sync["state"]["lastExternalFlowUsdt"], 0.0)
            self.assertEqual(
                store.count(event_type="auto_live_account_sync"),
                1,
            )
            self.assertEqual(len(production.orders), 1)

    def test_live_account_equity_includes_other_spot_assets_without_fake_cash_flow(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            production = FakeProductionService()
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:30:00+08:00",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 6_010.0,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-snapshot-eth-3000",
                "assets": {
                    "BTC": {
                        "free": 0.0,
                        "used": 0.0,
                        "total": 0.0,
                        "priceUsdt": 64_500.0,
                        "valueUsdt": 0.0,
                    },
                    "ETH": {
                        "free": 2.0,
                        "used": 0.0,
                        "total": 2.0,
                        "priceUsdt": 3_000.0,
                        "valueUsdt": 6_000.0,
                    },
                    "USDT": {
                        "free": 10.0,
                        "used": 0.0,
                        "total": 10.0,
                        "priceUsdt": 1.0,
                        "valueUsdt": 10.0,
                    },
                },
            }
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
                "triggerPct": 10.0,
            })
            service.evaluate(
                bars([100, 100, 100, 100, 100, 100]),
                data_source="test",
            )
            production.account_snapshot = {
                **production.account_snapshot,
                "observedAt": "2026-07-30T20:31:00+08:00",
                "totalEquityUsdt": 6_210.0,
                "snapshotHash": "account-snapshot-eth-3100",
                "assets": {
                    **production.account_snapshot["assets"],
                    "ETH": {
                        "free": 2.0,
                        "used": 0.0,
                        "total": 2.0,
                        "priceUsdt": 3_100.0,
                        "valueUsdt": 6_200.0,
                    },
                },
            }

            repriced = service.evaluate(
                bars(
                    [100, 100, 100, 100, 100, 100],
                    start=datetime(2026, 7, 26, 0, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(repriced["state"]["cash"], 10.0)
            self.assertEqual(repriced["state"]["availableCash"], 10.0)
            self.assertEqual(repriced["state"]["position"], 0.0)
            self.assertEqual(repriced["state"]["equity"], 6_210.0)
            self.assertEqual(repriced["state"]["lastExternalFlowUsdt"], 0.0)
            self.assertEqual(repriced["state"]["dailyStartEquity"], 6_010.0)
            self.assertEqual(repriced["state"]["dailyPeakEquity"], 6_210.0)
            self.assertEqual(production.orders, [])

    def test_live_account_uses_total_for_equity_but_free_quote_for_new_buy(self):
        with tempfile.TemporaryDirectory() as directory:
            production = FakeProductionService()
            production.account_snapshot = {
                "observedAt": "2026-07-30T20:30:00+08:00",
                "quoteCurrency": "USDT",
                "totalEquityUsdt": 100.0,
                "valuationComplete": True,
                "unpricedAssets": [],
                "snapshotHash": "account-snapshot-locked-usdt",
                "assets": {
                    "BTC": {
                        "free": 0.0,
                        "used": 0.0,
                        "total": 0.0,
                        "priceUsdt": 64_500.0,
                        "valueUsdt": 0.0,
                    },
                    "USDT": {
                        "free": 0.0,
                        "used": 100.0,
                        "total": 100.0,
                        "priceUsdt": 1.0,
                        "valueUsdt": 100.0,
                    },
                },
            }
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

            evaluated = service.evaluate(
                bars(
                    [100, 100, 100, 100, 101, 102],
                    start=datetime(2026, 7, 26, 0, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(evaluated["state"]["cash"], 100.0)
            self.assertEqual(evaluated["state"]["availableCash"], 0.0)
            self.assertEqual(evaluated["state"]["equity"], 100.0)
            self.assertEqual(evaluated["state"]["position"], 0.0)
            self.assertEqual(production.orders, [])

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
            bought = evaluate_and_settle_paper(service, rising)
            self.assertEqual(bought["state"]["lastDecision"]["action"], "buy")
            self.assertEqual(bought["state"]["lastDecision"]["confidence"], 0.01)
            self.assertGreater(bought["state"]["position"], 0)
            self.assertEqual(bought["state"]["tradeCount"], 1)
            self.assertEqual(
                bought["economics"]["tradingFees"],
                bought["state"]["lastTrade"]["fee"],
            )
            self.assertTrue(bought["economics"]["tradingFeesEstimated"])
            self.assertEqual(bought["economics"]["estimatedFeeCount"], 1)
            self.assertTrue(bought["economics"]["feeEvidenceComplete"])
            self.assertEqual(
                bought["economics"]["aiUsage"],
                {
                    "callCount": 1,
                    "inputTokens": 1,
                    "outputTokens": 1,
                    "totalTokens": 2,
                    "providerId": "openai-compatible",
                    "model": "fake",
                    "latencyMs": 1,
                },
            )
            self.assertTrue(bought["economics"]["aiUsageEvidenceComplete"])
            self.assertIsNone(bought["economics"]["aiCostUsdt"])
            self.assertEqual(bought["economics"]["aiCostStatus"], "unpriced")
            self.assertIsNone(bought["economics"]["netPnlAfterAi"])

            duplicate = service.evaluate(rising, data_source="test")
            self.assertEqual(duplicate["state"]["tradeCount"], 1)
            self.assertEqual(duplicate["economics"], bought["economics"])

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
            self.assertEqual(held["economics"]["aiUsage"]["callCount"], 2)
            self.assertEqual(held["economics"]["aiUsage"]["totalTokens"], 4)

            falling = bars(
                [101, 101, 101, 101, 101, 98],
                start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
            )
            sold = evaluate_and_settle_paper(service, falling, fill_open=200)
            self.assertEqual(sold["state"]["lastDecision"]["action"], "sell")
            self.assertEqual(sold["state"]["lastDecision"]["providerId"], "risk")
            self.assertEqual(sold["state"]["position"], 0)
            self.assertEqual(sold["state"]["tradeCount"], 2)
            self.assertEqual(store.count(event_type="auto_paper_trade"), 2)
            self.assertEqual(sold["economics"]["estimatedFeeCount"], 2)
            self.assertEqual(sold["economics"]["aiUsage"]["callCount"], 2)
            self.assertEqual(sold["economics"]["unrealizedPnl"], 0)
            self.assertEqual(
                sold["economics"]["tradingPnlBeforeAi"],
                sold["economics"]["realizedPnl"],
            )
            restarted = AutoPaperTradingService(store, registry).snapshot()
            self.assertEqual(restarted["economics"], sold["economics"])
            switched = service.configure({
                "enabled": False,
                "executionMode": "testnet",
            })
            self.assertEqual(switched["economics"]["tradingFees"], 0)
            self.assertEqual(switched["economics"]["estimatedFeeCount"], 0)
            self.assertIsNone(switched["economics"]["aiUsage"])
            self.assertTrue(switched["economics"]["aiUsageEvidenceComplete"])

    def test_ai_usage_marks_known_provider_gaps_incomplete(self):
        class PartialUsageProvider(FakeProvider):
            def assess(self, **_kwargs):
                return ProviderAttempt(
                    provider_id="openai-compatible",
                    model="fake",
                    sanitized_base_url="https://example.invalid",
                    assessment={
                        "action": "buy",
                        "confidence": 0.01,
                        "reason": "上涨动量仍在。",
                    },
                    usage={"inputTokens": 3},
                    latency_ms=1,
                )

        class FailingProvider(FakeProvider):
            def assess(self, **_kwargs):
                raise ValueError("provider_timeout")

        with tempfile.TemporaryDirectory() as directory:
            status = (
                ProviderStatus(
                    "openai-compatible",
                    True,
                    "fake",
                    "https://example.invalid",
                ),
            )
            partial = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "partial.sqlite"),
                AiReviewProviderRegistry(
                    status,
                    {"openai-compatible": PartialUsageProvider()},
                ),
            )
            partial.configure({"enabled": True, "triggerPct": 0.3})
            recorded = partial.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            self.assertEqual(recorded["economics"]["aiUsage"]["callCount"], 1)
            self.assertEqual(recorded["economics"]["aiUsage"]["inputTokens"], 3)
            self.assertFalse(recorded["economics"]["aiUsageEvidenceComplete"])

            failed = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "failed.sqlite"),
                AiReviewProviderRegistry(
                    status,
                    {"openai-compatible": FailingProvider()},
                ),
            )
            failed.configure({"enabled": True, "triggerPct": 0.3})
            result = failed.evaluate(
                bars([100, 100, 100, 100, 100, 101]),
                data_source="test",
            )

            self.assertEqual(result["state"]["status"], "ai_error")
            self.assertIsNone(result["economics"]["aiUsage"])
            self.assertFalse(result["economics"]["aiUsageEvidenceComplete"])

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
            filled = evaluate_and_settle_paper(service, rising)

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
            result = filled["state"]["lastOrderResult"]
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
            self.assertIsNone(duplicate["state"]["lastOrderResult"])
            self.assertEqual(filled["state"]["lastDecisionContract"], contract)
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
            bought = evaluate_and_settle_paper(
                service,
                bars([100, 100, 100, 100, 100, 101]),
            )
            self.assertGreater(bought["state"]["position"], 0)

            exited = evaluate_and_settle_paper(
                service,
                bars(
                    [101, 101, 101, 101, 101, 98],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
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

            bought = evaluate_and_settle_paper(
                service,
                bars([100, 100, 100, 100, 100, 101]),
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
            exited = evaluate_and_settle_paper(
                service,
                bars(
                    [98, 98, 98, 98, 98, 98],
                    start=datetime(2026, 7, 26, 3, tzinfo=timezone.utc),
                ),
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
            self.assertEqual(exited["state"]["status"], "risk_paused")
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
            evaluate_and_settle_paper(
                service,
                bars([100, 100, 100, 100, 100, 101]),
            )
            exited = evaluate_and_settle_paper(
                service,
                bars(
                    [98, 98, 98, 98, 98, 98],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
            )

            self.assertEqual(exited["state"]["status"], "risk_paused")
            self.assertEqual(exited["state"]["position"], 0)
            self.assertGreater(exited["state"]["dailyLossDrawdownPct"], 0.2)
            self.assertEqual(exited["state"]["dailyProfitDrawdownPct"], 0)
            self.assertEqual(
                exited["state"]["dailyRiskHaltReason"],
                "已达到当日亏损回撤上限。",
            )

            tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
            with patch("quant_core.auto_paper_trading._now", return_value=tomorrow):
                resumed = evaluate_and_settle_paper(
                    service,
                    bars(
                        [99, 99, 99, 99, 99, 100],
                        start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
                    ),
                )

            self.assertEqual(resumed["state"]["status"], "traded")
            self.assertGreater(resumed["state"]["position"], 0)
            self.assertIsNone(resumed["state"]["dailyRiskHaltReason"])
            self.assertGreater(resumed["state"]["dailyLossDrawdownPct"], 0)
            self.assertLess(resumed["state"]["dailyLossDrawdownPct"], 0.2)
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

    def test_conflicting_order_intent_identity_fails_closed_before_submission(self):
        with tempfile.TemporaryDirectory() as directory:
            sandbox = FakeSandboxService()
            service = AutoPaperTradingService(
                ConflictingOrderIntentStore(Path(directory) / "audit.sqlite"),
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
                sandbox,  # type: ignore[arg-type]
            )
            service.configure(
                {
                    "enabled": True,
                    "executionMode": "testnet",
                    "testnetConfirmed": True,
                    "triggerPct": 0.3,
                }
            )

            with self.assertRaisesRegex(
                ValueError,
                "auto_trading_order_intent_identity_conflict",
            ):
                service.evaluate(
                    bars([100, 100, 100, 100, 100, 101]),
                    data_source="test",
                )

            self.assertEqual(sandbox.orders, [])

    def test_recovery_ignores_research_scoped_order_intent(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = AutoPaperTradingService(
                store,
                AiReviewProviderRegistry(
                    (ProviderStatus("local", True, None, None),),
                    {},
                ),
            )
            service.configure({"executionMode": "testnet"})
            store.record(
                {
                    "schemaVersion": 1,
                    "eventId": "auto-testnet-order-intent-imported",
                    "eventType": "auto_testnet_order_intent",
                    "runId": "imported-run",
                    "createdAt": datetime(2030, 1, 1, tzinfo=timezone.utc).isoformat(),
                    "stage": "auto-paper-trading",
                    "source": "auto-paper-trading",
                    "summary": "导入的伪造委托",
                    "detail": "运行器不得恢复研究包中的委托。",
                    "metadata": {"executionMode": "testnet", "order": {}},
                }
            )

            snapshot = service.snapshot()

            self.assertIsNone(snapshot["state"]["lastTestnetOrder"])

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

    def test_authoritative_account_keeps_released_dust_in_equity_not_managed_position(self):
        class AccountDustSandbox(FakeRejectedPreparationSandboxService):
            def __init__(self):
                super().__init__()
                self.account_snapshot = {
                    "observedAt": "2026-07-30T20:30:00+08:00",
                    "quoteCurrency": "USDT",
                    "totalEquityUsdt": 10.65,
                    "valuationComplete": True,
                    "unpricedAssets": [],
                    "snapshotHash": "dust-at-65000",
                    "assets": {
                        "BTC": {
                            "free": 0.00001,
                            "used": 0.0,
                            "total": 0.00001,
                            "priceUsdt": 65_000.0,
                            "valueUsdt": 0.65,
                        },
                        "USDT": {
                            "free": 10.0,
                            "used": 0.0,
                            "total": 10.0,
                            "priceUsdt": 1.0,
                            "valueUsdt": 10.0,
                        },
                    },
                }

            def verify_auto_account_coverage(self, expected_position, required_quote):
                return {
                    "accountCovered": True,
                    "positionCovered": True,
                    "quoteCovered": True,
                    "unexpectedOpenAutoOrderCount": 0,
                    "unexpectedOpenOrderCount": 0,
                    "accountSnapshot": self.account_snapshot,
                }

        with tempfile.TemporaryDirectory() as directory:
            sandbox = AccountDustSandbox()
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
                sandbox,  # type: ignore[arg-type]
            )
            service.configure({
                "enabled": True,
                "executionMode": "testnet",
                "testnetConfirmed": True,
                "triggerPct": 0.3,
            })
            service.evaluate(
                bars([65_000, 65_000, 65_000, 65_000, 65_000, 65_000]),
                data_source="test",
            )
            released = service.evaluate(
                bars(
                    [65_000, 65_000, 65_000, 65_000, 65_000, 63_500],
                    start=datetime(2026, 7, 26, 1, tzinfo=timezone.utc),
                ),
                data_source="test",
            )
            sandbox.account_snapshot = {
                **sandbox.account_snapshot,
                "observedAt": "2026-07-30T20:31:00+08:00",
                "totalEquityUsdt": 10.6351,
                "snapshotHash": "dust-at-63510",
                "assets": {
                    **sandbox.account_snapshot["assets"],
                    "BTC": {
                        "free": 0.00001,
                        "used": 0.0,
                        "total": 0.00001,
                        "priceUsdt": 63_510.0,
                        "valueUsdt": 0.6351,
                    },
                },
            }
            repriced = service.evaluate(
                bars(
                    [63_500, 63_500, 63_500, 63_500, 63_500, 63_510],
                    start=datetime(2026, 7, 26, 2, tzinfo=timezone.utc),
                ),
                data_source="test",
            )

            self.assertEqual(released["state"]["position"], 0)
            self.assertEqual(repriced["state"]["position"], 0)
            self.assertEqual(repriced["state"]["unmanagedBaseQuantity"], 0.00001)
            self.assertEqual(repriced["state"]["equity"], 10.6351)
            self.assertEqual(len(sandbox.preparations), 1)

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
            self.assertEqual(result["economics"]["tradingFees"], 0.002)
            self.assertEqual(result["economics"]["estimatedFeeCount"], 0)
            self.assertTrue(result["economics"]["feeEvidenceComplete"])

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
            self.assertEqual(
                result["economics"]["tradingFees"],
                result["state"]["lastTrade"]["fee"],
            )
            self.assertEqual(result["economics"]["estimatedFeeCount"], 0)

    def test_sell_base_fee_uses_removed_inventory_cost_and_rejects_overdraw(self):
        with tempfile.TemporaryDirectory() as directory:
            service = AutoPaperTradingService(
                AuditEventStore(Path(directory) / "audit.sqlite"),
                AiReviewProviderRegistry((), {}),
            )
            state = service.snapshot()["state"]
            state.update({
                "executionMode": "testnet",
                "cash": 90.0,
                "position": 1.0,
                "avgCost": 100.0,
                "realizedPnl": 0.0,
            })
            routed = {
                "request": {
                    "side": "sell",
                    "referencePrice": 110.0,
                },
                "state": "filled",
                "filledQuantity": 0.5,
                "averagePrice": 110.0,
                "filledNotional": 55.0,
                "fees": [{"currency": "BTC", "cost": 0.01}],
            }

            trade = service._settle_routed_trade(state, routed)

            self.assertIsNotNone(trade)
            self.assertEqual(state["cash"], 145.0)
            self.assertEqual(state["position"], 0.49)
            self.assertEqual(state["realizedPnl"], 4.0)
            self.assertEqual(trade["fee"], 1.1)

            overdrawn = {
                **state,
                "cash": 90.0,
                "position": 0.5,
                "avgCost": 100.0,
                "realizedPnl": 0.0,
            }
            before = dict(overdrawn)
            self.assertIsNone(
                service._settle_routed_trade(
                    overdrawn,
                    {
                        **routed,
                        "settled": False,
                    },
                )
            )
            self.assertEqual(overdrawn, before)

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
            self.assertEqual(result["economics"]["tradingFees"], trade["fee"])
            self.assertEqual(result["economics"]["estimatedFeeCount"], 1)
            self.assertTrue(result["economics"]["tradingFeesEstimated"])

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

    def test_shared_spot_account_coverage_blocks_manual_open_order_for_managed_account(self):
        exchange = FakeBinanceTestnet({})
        exchange.open_orders = [{
            "clientOrderId": "manual-order",
            "symbol": "BTC/USDT",
            "status": "open",
        }]

        coverage = check_spot_account_coverage(
            exchange,
            symbol="BTC/USDT",
            expected_base=0.0,
            required_quote=10.0,
        )

        self.assertFalse(coverage["accountCovered"])
        self.assertEqual(coverage["unexpectedOpenAutoOrderCount"], 0)
        self.assertEqual(coverage["unexpectedOpenOrderCount"], 1)

    def test_shared_spot_account_snapshot_values_all_direct_usdt_assets(self):
        exchange = FakeBinanceTestnet({})
        exchange.apiKey = "account-one"
        exchange.balance = {
            "free": {"BTC": 0.1, "ETH": 1.5, "USDT": 10.0},
            "used": {"BTC": 0.02, "ETH": 0.5, "USDT": 0.0},
            "total": {"BTC": 0.12, "ETH": 2.0, "USDT": 10.0},
        }

        coverage = check_spot_account_coverage(
            exchange,
            symbol="BTC/USDT",
            expected_base=0.1,
            required_quote=10.0,
        )

        snapshot = coverage["accountSnapshot"]
        self.assertTrue(snapshot["valuationComplete"])
        self.assertEqual(snapshot["unpricedAssets"], [])
        self.assertEqual(snapshot["assets"]["BTC"]["free"], 0.1)
        self.assertEqual(snapshot["assets"]["BTC"]["used"], 0.02)
        self.assertEqual(snapshot["assets"]["BTC"]["total"], 0.12)
        self.assertEqual(snapshot["assets"]["ETH"]["valueUsdt"], 6_000.0)
        self.assertEqual(snapshot["assets"]["USDT"]["valueUsdt"], 10.0)
        self.assertEqual(snapshot["totalEquityUsdt"], 13_210.0)
        self.assertTrue(snapshot["accountFingerprint"])
        self.assertTrue(snapshot["snapshotHash"])

    def test_shared_spot_account_snapshot_blocks_new_risk_when_asset_is_unpriced(self):
        exchange = FakeBinanceTestnet({})
        exchange.balance = {
            "free": {"BTC": 0.0, "DOGE": 10.0, "USDT": 10.0},
            "used": {"BTC": 0.0, "DOGE": 0.0, "USDT": 0.0},
            "total": {"BTC": 0.0, "DOGE": 10.0, "USDT": 10.0},
        }

        coverage = check_spot_account_coverage(
            exchange,
            symbol="BTC/USDT",
            expected_base=0.0,
            required_quote=10.0,
        )

        self.assertFalse(coverage["accountCovered"])
        self.assertTrue(coverage["positionCovered"])
        self.assertTrue(coverage["quoteCovered"])
        self.assertFalse(coverage["accountSnapshot"]["valuationComplete"])
        self.assertEqual(
            coverage["accountSnapshot"]["unpricedAssets"],
            ["DOGE"],
        )

    def test_shared_spot_account_can_be_healthy_while_order_source_is_unavailable(self):
        exchange = FakeBinanceTestnet({})
        exchange.balance = {
            "free": {"BTC": 0.0, "ETH": 1.0, "USDT": 0.0},
            "used": {"BTC": 0.0, "ETH": 0.0, "USDT": 0.0},
            "total": {"BTC": 0.0, "ETH": 1.0, "USDT": 0.0},
        }

        coverage = check_spot_account_coverage(
            exchange,
            symbol="BTC/USDT",
            expected_base=0.0,
            required_quote=0.0,
        )

        self.assertTrue(coverage["accountCovered"])
        self.assertEqual(
            coverage["accountSnapshot"]["totalEquityUsdt"],
            3_000.0,
        )
        with self.assertRaisesRegex(
            ValueError,
            "stage10_production_balance_insufficient",
        ):
            prepare_spot_market_order(
                exchange,
                {
                    "symbol": "BTC/USDT",
                    "side": "buy",
                    "quantity": 0.0001,
                    "referencePrice": 60_000,
                    "notionalValue": 6,
                },
                market_or_balance_error=(
                    "stage10_auto_live_market_or_balance_unavailable"
                ),
                balance_error="stage10_production_balance_insufficient",
            )


if __name__ == "__main__":
    unittest.main()
