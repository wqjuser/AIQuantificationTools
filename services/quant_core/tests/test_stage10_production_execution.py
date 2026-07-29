from __future__ import annotations

from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import sys
import tempfile
from threading import Event, Thread
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from quant_core.api import QuantApiHandler
from quant_core.audit_events import AuditEventStore, is_protected_production_authority_audit_event
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    authorization_to_audit_event,
    build_stage6_sandbox_batch_authorization,
)
from quant_core.stage9_production_admission import (
    PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS,
    build_production_order_admission_candidate,
    build_production_order_admission_review,
    production_order_admission_candidate_to_audit_event,
    production_order_admission_review_to_audit_event,
)
from quant_core.stage10_production_execution import (
    BinanceSpotProductionTradingRoute,
    PRODUCTION_EXECUTION_CONFIRMATION_IDS,
    DeterministicProductionExecutionAdapter,
    Stage10ProductionExecutionService,
    build_production_trading_permission_verification,
    build_production_trading_credential_preflight,
    build_production_execution_authorization,
    validate_production_execution_attempt,
    validate_production_execution_authorization,
)
from services.quant_core.tests.test_stage6_sandbox import FakeBinance, _authority_chain
from services.quant_core.tests.test_stage9_production_admission import (
    _current_continuity,
    _passing_observation,
)


def _stage9_chain():
    workflow, session, readiness, preflight, sandbox_review = _authority_chain()
    now = datetime.now(timezone.utc)
    route = BinanceSpotTestnetRoute(
        env={"CCXT_SANDBOX_API_KEY": "sandbox-key", "CCXT_SANDBOX_SECRET": "sandbox-secret"},
        ccxt_module=type("Ccxt", (), {"binance": FakeBinance}),
    )
    normalized = route.normalize_orders(workflow)
    orders = [
        {**normalized[0], "quantity": 0.0001, "price": 60_000, "notionalValue": 6},
        {**normalized[1], "quantity": 0.002, "price": 3_000, "notionalValue": 6},
    ]
    sandbox_authorization = build_stage6_sandbox_batch_authorization(
        workflow,
        session,
        readiness,
        preflight,
        sandbox_review,
        orders,
        operator="sandbox-operator",
        generated_at=now.isoformat(),
    )
    sandbox_batch = {
        "authorizationId": sandbox_authorization["authorizationId"],
        "baseRunId": sandbox_authorization["baseRunId"],
        "batchId": sandbox_authorization["batchId"],
        "status": "reconciled",
        "orders": [{**order, "state": "canceled"} for order in orders],
    }
    continuity = _current_continuity(now)
    candidate = build_production_order_admission_candidate(
        workflow,
        sandbox_authorization,
        sandbox_batch,
        continuity,
        _passing_observation(orders, now),
        operator="stage9-operator",
        generated_at=now.isoformat(),
    )
    reviewed_at = now
    review = build_production_order_admission_review(
        candidate,
        continuity,
        _passing_observation(orders, reviewed_at),
        reviewer="stage9-reviewer",
        outcome="approved",
        reason="Approved for the bounded Stage 10 canary preparation.",
        confirmations={item: True for item in PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS},
        reviewed_at=reviewed_at.isoformat(),
    )
    return candidate, review, reviewed_at, workflow, sandbox_authorization


class SafeTradingPermissionExchange:
    calls: list[str] = []

    def __init__(self, config):
        if "apiKey" in config or "secret" in config:
            raise AssertionError("private credentials must not be attached to public market loading")

    def load_markets(self):
        type(self).calls.append("load_markets")
        return {"BTC/USDT": {}}

    def sapi_get_account_apirestrictions(self):
        type(self).calls.append("permissions")
        return {
            "enableReading": True,
            "enableSpotAndMarginTrading": True,
            "enableMargin": False,
            "enableFutures": False,
            "enableVanillaOptions": False,
            "enableWithdrawals": False,
            "enableInternalTransfer": False,
            "permitsUniversalTransfer": False,
        }

    def fetch_balance(self, _params):
        raise AssertionError("trading permission verification must not read balances")

    def create_order(self, *_args):
        raise AssertionError("trading permission verification must not place orders")


class OrderNotFound(Exception):
    pass


class ProductionOrderExchange:
    def __init__(self, config):
        self.config = config
        self.order = None
        self.open_orders = []
        self.create_calls = 0
        self.ip_restricted = True

    def load_markets(self):
        return {
            "BTC/USDT": {
                "active": True,
                "base": "BTC",
                "quote": "USDT",
                "limits": {
                    "amount": {"min": 0.00001},
                    "price": {},
                    "cost": {"min": 1},
                },
            }
        }

    def fetch_balance(self):
        return {"free": {"BTC": 1, "USDT": 100}}

    def fetch_open_orders(self, _symbol):
        return self.open_orders

    def sapi_get_account_apirestrictions(self):
        return {
            "ipRestrict": self.ip_restricted,
            "enableReading": True,
            "enableSpotAndMarginTrading": True,
            "enableMargin": False,
            "enableFutures": False,
            "enableVanillaOptions": False,
            "enableWithdrawals": False,
            "enableInternalTransfer": False,
            "permitsUniversalTransfer": False,
        }

    def amount_to_precision(self, _symbol, value):
        return f"{value:.6f}"

    def price_to_precision(self, _symbol, value):
        return f"{value:.2f}"

    def fetch_order(self, _exchange_order_id, _symbol, params):
        if self.order is None:
            raise OrderNotFound("Order not found")
        if params["origClientOrderId"] != self.order["clientOrderId"]:
            raise AssertionError("client order id changed")
        return self.order

    def create_order(self, symbol, order_type, side, amount, price, params):
        self.create_calls += 1
        self.order = {
            "id": "production-order-1",
            "clientOrderId": params["newClientOrderId"],
            "status": "closed",
            "filled": amount,
            "amount": amount,
            "remaining": 0,
            "average": price,
            "timestamp": 1,
        }
        return self.order

    def create_market_buy_order_with_cost(self, symbol, cost, params):
        self.create_calls += 1
        amount = cost / 60_000
        self.order = {
            "id": "production-order-1",
            "clientOrderId": params["newClientOrderId"],
            "symbol": symbol,
            "status": "closed",
            "filled": amount,
            "amount": amount,
            "remaining": 0,
            "average": 60_000,
            "cost": cost,
            "timestamp": 1,
        }
        return self.order


def _trading_env() -> dict[str, str]:
    return {
        "CCXT_PRODUCTION_TRADING_API_KEY": "dedicated-trading-key",
        "CCXT_PRODUCTION_TRADING_SECRET": "dedicated-trading-secret",
        "CCXT_PRODUCTION_READONLY_API_KEY": "read-key",
        "CCXT_PRODUCTION_READONLY_SECRET": "read-secret",
        "CCXT_SANDBOX_API_KEY": "sandbox-key",
        "CCXT_SANDBOX_SECRET": "sandbox-secret",
        "CCXT_DEFAULT_TYPE": "spot",
    }


def _activate_gate(
    service: Stage10ProductionExecutionService,
    checked_at: datetime,
) -> None:
    preflight = build_production_trading_credential_preflight(
        environ=_trading_env(),
        operator="stage10-operator",
        checked_at=checked_at.isoformat(),
    )
    service.record_credential_preflight(preflight)
    verification = build_production_trading_permission_verification(
        preflight,
        environ=_trading_env(),
        operator="stage10-operator",
        exchange_factory=lambda _exchange_id, config: SafeTradingPermissionExchange(config),
        verified_at=(checked_at + timedelta(microseconds=1)).isoformat(),
    )
    service.record_permission_verification(verification)
    service.set_control(
        action="restore",
        operator="stage10-operator",
        reason="Allow deterministic Stage 10 preparation only.",
        credential_preflight_id=preflight["preflightId"],
        permission_verification_id=verification["verificationId"],
        recorded_at=(checked_at + timedelta(milliseconds=1)).isoformat(),
    )


class Stage10ProductionExecutionTest(unittest.TestCase):
    def test_auto_live_status_marks_expired_control_evidence_stale(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            route = BinanceSpotProductionTradingRoute(
                env={**_trading_env(), "AIQT_ENABLE_PRODUCTION_TRADING": "true"},
                exchange_factory=lambda _exchange_id, _config: ProductionOrderExchange({}),
            )
            service = Stage10ProductionExecutionService(store, auto_route=route)
            _activate_gate(service, datetime.now(timezone.utc) - timedelta(hours=1))

            status = service.auto_live_status()

            self.assertTrue(status["controlRecordedActive"])
            self.assertFalse(status["controlActive"])
            self.assertFalse(status["evidenceFresh"])
            self.assertEqual(
                status["blockingReason"],
                "stage10_production_execution_control_evidence_stale",
            )

    def test_auto_live_session_rechecks_credential_isolation_after_restart(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            exchange = ProductionOrderExchange({})
            route = BinanceSpotProductionTradingRoute(
                env={
                    **_trading_env(),
                    "AIQT_ENABLE_PRODUCTION_TRADING": "true",
                    "CCXT_PRODUCTION_TRADING_API_KEY": "read-key",
                },
                exchange_factory=lambda _exchange_id, _config: exchange,
            )
            service = Stage10ProductionExecutionService(store, auto_route=route)
            _activate_gate(service, datetime.now(timezone.utc))

            with self.assertRaisesRegex(
                ValueError,
                "stage10_production_trading_credentials_not_isolated",
            ):
                service.authorize_auto_session()

            self.assertEqual(exchange.create_calls, 0)

    def test_auto_live_account_coverage_detects_untracked_order(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            exchange = ProductionOrderExchange({})
            exchange.open_orders = [{"clientOrderId": "aiqt-auto-l-orphan"}]
            route = BinanceSpotProductionTradingRoute(
                env={**_trading_env(), "AIQT_ENABLE_PRODUCTION_TRADING": "true"},
                exchange_factory=lambda _exchange_id, _config: exchange,
            )
            service = Stage10ProductionExecutionService(store, auto_route=route)
            _activate_gate(service, datetime.now(timezone.utc))
            control = service.authorize_auto_session()

            coverage = service.verify_auto_account_coverage(
                0,
                10,
                control_id=control["controlId"],
                operator="wenqingjie",
            )

            self.assertFalse(coverage["accountCovered"])
            self.assertEqual(coverage["unexpectedOpenAutoOrderCount"], 1)
            self.assertEqual(exchange.create_calls, 0)

    def test_auto_live_order_preparation_rechecks_permissions_before_intent(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            exchange = ProductionOrderExchange({})
            route = BinanceSpotProductionTradingRoute(
                env={**_trading_env(), "AIQT_ENABLE_PRODUCTION_TRADING": "true"},
                exchange_factory=lambda _exchange_id, _config: exchange,
            )
            service = Stage10ProductionExecutionService(store, auto_route=route)
            _activate_gate(service, datetime.now(timezone.utc))
            control = service.authorize_auto_session()
            order = {
                "symbol": "BTC/USDT",
                "side": "buy",
                "quantity": 0.0001,
                "referencePrice": 60_000,
                "notionalValue": 6,
                "riskBudgetNotional": 6,
            }

            exchange.ip_restricted = False
            with self.assertRaisesRegex(ValueError, "permissions_or_ip_invalid"):
                service.prepare_auto_market_order(
                    order,
                    control_id=control["controlId"],
                    operator="wenqingjie",
                )
            exchange.ip_restricted = True

            prepared = service.prepare_auto_market_order(
                order,
                control_id=control["controlId"],
                operator="wenqingjie",
            )

            self.assertEqual(prepared["quantity"], order["quantity"])
            self.assertEqual(prepared["marketRules"]["minimumQuantity"], 0.00001)
            self.assertEqual(
                prepared["executionAssumptions"]["slippageModel"],
                "venue_market_fill",
            )
            self.assertEqual(exchange.create_calls, 0)

    def test_auto_live_order_is_gated_query_first_and_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            exchange = ProductionOrderExchange({})
            route = BinanceSpotProductionTradingRoute(
                env={**_trading_env(), "AIQT_ENABLE_PRODUCTION_TRADING": "true"},
                exchange_factory=lambda _exchange_id, config: (
                    setattr(exchange, "config", config) or exchange
                ),
            )
            service = Stage10ProductionExecutionService(store, auto_route=route)
            checked_at = datetime.now(timezone.utc)
            _activate_gate(service, checked_at)
            exchange.ip_restricted = False
            with self.assertRaisesRegex(
                ValueError,
                "permissions_or_ip_invalid",
            ):
                service.authorize_auto_session()
            exchange.ip_restricted = True
            control = service.authorize_auto_session()
            order = {
                "clientOrderId": "aiqt-auto-l-123",
                "symbol": "BTC/USDT",
                "side": "buy",
                "quantity": 0.0001,
                "referencePrice": 60_000,
                "notionalValue": 6,
                "riskBudgetNotional": 6,
            }

            exchange.ip_restricted = False
            with self.assertRaisesRegex(
                ValueError,
                "permissions_or_ip_invalid",
            ):
                service.submit_auto_market_order(
                    order,
                    control_id=control["controlId"],
                    operator="wenqingjie",
                )
            self.assertEqual(exchange.create_calls, 0)
            exchange.ip_restricted = True

            first = service.submit_auto_market_order(
                order,
                control_id=control["controlId"],
                operator="wenqingjie",
            )
            exchange.ip_restricted = False
            second = service.submit_auto_market_order(
                order,
                control_id=control["controlId"],
                operator="wenqingjie",
            )

            self.assertEqual(first["state"], "filled")
            self.assertEqual(second["state"], "filled")
            self.assertEqual(exchange.create_calls, 1)
            self.assertEqual(exchange.config["options"]["defaultType"], "spot")
            self.assertNotIn("sandbox", exchange.config)
            self.assertGreaterEqual(
                store.count(event_type="stage10_auto_live_order_transition"),
                2,
            )

            service.set_control(
                action="revoke",
                operator="wenqingjie",
                reason="Stop production auto trading.",
            )
            with self.assertRaisesRegex(ValueError, "kill_switch_triggered"):
                service.submit_auto_market_order(
                    {
                        **order,
                        "clientOrderId": "aiqt-auto-l-456",
                    },
                    control_id=control["controlId"],
                    operator="wenqingjie",
                )

    def test_auto_live_reconciliation_only_queries_existing_order_after_revoke(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            exchange = ProductionOrderExchange({})
            route = BinanceSpotProductionTradingRoute(
                env={**_trading_env(), "AIQT_ENABLE_PRODUCTION_TRADING": "true"},
                exchange_factory=lambda _exchange_id, config: (
                    setattr(exchange, "config", config) or exchange
                ),
            )
            service = Stage10ProductionExecutionService(store, auto_route=route)
            _activate_gate(service, datetime.now(timezone.utc))
            order = {
                "clientOrderId": "aiqt-auto-l-existing",
                "symbol": "BTC/USDT",
                "side": "buy",
                "quantity": 0.0001,
                "referencePrice": 60_000,
                "notionalValue": 6,
                "riskBudgetNotional": 6,
            }
            exchange.order = {
                "id": "production-order-existing",
                "clientOrderId": order["clientOrderId"],
                "status": "closed",
                "filled": order["quantity"],
                "amount": order["quantity"],
                "remaining": 0,
                "average": order["referencePrice"],
                "timestamp": 1,
            }
            service.set_control(
                action="revoke",
                operator="wenqingjie",
                reason="Stop new production orders.",
            )

            evidence = service.reconcile_auto_market_order(
                order,
                {
                    "exchangeOrderId": exchange.order["id"],
                    "state": "open",
                },
                operator="wenqingjie",
            )

            self.assertEqual(evidence["state"], "filled")
            self.assertEqual(evidence["operation"], "query")
            self.assertEqual(exchange.create_calls, 0)

    def test_authorization_and_deterministic_attempt_are_bound_and_fail_closed(self) -> None:
        candidate, review, reviewed_at, _workflow, _sandbox_authorization = _stage9_chain()
        authorization = build_production_execution_authorization(
            candidate,
            review,
            operator="stage10-operator",
            reason="Prepare the bounded deterministic production execution path.",
            confirmations={item: True for item in PRODUCTION_EXECUTION_CONFIRMATION_IDS},
            authorized_at=(reviewed_at + timedelta(seconds=1)).isoformat(),
        )

        self.assertEqual(validate_production_execution_authorization(authorization), authorization)
        self.assertEqual(len(authorization["orders"]), 1)
        self.assertEqual(authorization["orders"][0]["symbol"], "BTC/USDT")
        self.assertLessEqual(authorization["orders"][0]["notionalValue"], 10)
        self.assertTrue(authorization["deterministicAuthorizationEffective"])
        self.assertFalse(authorization["productionAuthorizationEffective"])
        self.assertFalse(authorization["orderSubmissionEnabled"])

        attempt = DeterministicProductionExecutionAdapter().execute(
            authorization,
            operator="stage10-operator",
            attempted_at=(reviewed_at + timedelta(seconds=2)).isoformat(),
        )

        self.assertEqual(validate_production_execution_attempt(attempt), attempt)
        self.assertEqual(attempt["status"], "blocked_before_network")
        self.assertEqual(attempt["networkCallCount"], 0)
        self.assertFalse(attempt["productionTradingCredentialsRead"])
        self.assertFalse(attempt["liveOrderSubmitted"])
        self.assertTrue(attempt["liveBlockedBoundary"])
        self.assertEqual(attempt["orders"][0]["state"], "blocked_before_network")

    def test_authorization_rejects_incomplete_confirmation(self) -> None:
        candidate, review, reviewed_at, _workflow, _sandbox_authorization = _stage9_chain()
        confirmations = {item: True for item in PRODUCTION_EXECUTION_CONFIRMATION_IDS}
        confirmations[PRODUCTION_EXECUTION_CONFIRMATION_IDS[0]] = False
        with self.assertRaisesRegex(ValueError, "stage10_production_execution_confirmations_incomplete"):
            build_production_execution_authorization(
                candidate,
                review,
                operator="stage10-operator",
                reason="Incomplete confirmation must fail closed.",
                confirmations=confirmations,
                authorized_at=(reviewed_at + timedelta(seconds=1)).isoformat(),
            )

    def test_service_persists_idempotent_authorization_and_attempt(self) -> None:
        candidate, review, reviewed_at, _workflow, _sandbox_authorization = _stage9_chain()
        authorization = build_production_execution_authorization(
            candidate,
            review,
            operator="stage10-operator",
            reason="Persist deterministic execution evidence.",
            confirmations={item: True for item in PRODUCTION_EXECUTION_CONFIRMATION_IDS},
            authorized_at=(reviewed_at + timedelta(seconds=1)).isoformat(),
        )

        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = Stage10ProductionExecutionService(store)
            self.assertEqual(service.record_authorization(authorization), authorization)
            _activate_gate(service, reviewed_at + timedelta(seconds=1))
            first = service.attempt(
                authorization["authorizationId"],
                operator="stage10-operator",
                attempted_at=(reviewed_at + timedelta(seconds=2)).isoformat(),
            )
            second = service.attempt(
                authorization["authorizationId"],
                operator="stage10-operator",
                attempted_at=(reviewed_at + timedelta(seconds=2)).isoformat(),
            )

            self.assertEqual(first, second)
            self.assertEqual(store.count(event_type="stage10_production_execution_authorization"), 1)
            self.assertEqual(store.count(event_type="stage10_production_execution_attempt"), 1)
            self.assertTrue(
                is_protected_production_authority_audit_event(
                    "stage10_production_execution_attempt",
                    first["attemptId"],
                )
            )

    def test_offline_credentials_persistent_gate_and_account_lease_fail_closed(self) -> None:
        candidate, review, reviewed_at, _workflow, _sandbox_authorization = _stage9_chain()
        authorization = build_production_execution_authorization(
            candidate,
            review,
            operator="stage10-operator",
            reason="Exercise the persistent Stage 10 safety gate.",
            confirmations={item: True for item in PRODUCTION_EXECUTION_CONFIRMATION_IDS},
            authorized_at=(reviewed_at + timedelta(seconds=1)).isoformat(),
        )
        good_env = _trading_env()
        preflight = build_production_trading_credential_preflight(
            environ=good_env,
            operator="stage10-operator",
            checked_at=(reviewed_at + timedelta(seconds=1)).isoformat(),
        )
        self.assertEqual(preflight["status"], "configured_offline")
        self.assertEqual(preflight["networkCallCount"], 0)
        self.assertFalse(preflight["permissionsVerified"])
        self.assertNotIn("dedicated-trading-key", json.dumps(preflight))
        self.assertEqual(
            build_production_trading_credential_preflight(
                environ={
                    **good_env,
                    "CCXT_PRODUCTION_TRADING_API_KEY": good_env[
                        "CCXT_PRODUCTION_READONLY_API_KEY"
                    ],
                },
                operator="stage10-operator",
                checked_at=(reviewed_at + timedelta(seconds=1)).isoformat(),
            )["status"],
            "blocked",
        )
        SafeTradingPermissionExchange.calls = []
        verification = build_production_trading_permission_verification(
            preflight,
            environ=good_env,
            operator="stage10-operator",
            exchange_factory=lambda _exchange_id, config: SafeTradingPermissionExchange(config),
            verified_at=(reviewed_at + timedelta(seconds=1, microseconds=1)).isoformat(),
        )
        self.assertEqual(verification["status"], "verified")
        self.assertTrue(verification["permissions"]["spotTradingEnabled"])
        self.assertFalse(verification["permissions"]["withdrawalsEnabled"])
        self.assertEqual(SafeTradingPermissionExchange.calls, ["load_markets", "permissions"])
        self.assertNotIn("dedicated-trading-secret", json.dumps(verification))

        class UnsafeTradingPermissionExchange(SafeTradingPermissionExchange):
            def sapi_get_account_apirestrictions(self):
                return {
                    **super().sapi_get_account_apirestrictions(),
                    "enableWithdrawals": True,
                }

        self.assertEqual(
            build_production_trading_permission_verification(
                preflight,
                environ=good_env,
                operator="stage10-operator",
                exchange_factory=lambda _exchange_id, config: UnsafeTradingPermissionExchange(
                    config
                ),
                verified_at=(reviewed_at + timedelta(seconds=1, microseconds=1)).isoformat(),
            )["status"],
            "blocked",
        )

        started = Event()
        release = Event()

        class BlockingAdapter:
            def execute(self, value, *, operator, attempted_at=None):
                started.set()
                if not release.wait(timeout=5):
                    raise RuntimeError("test adapter release timed out")
                return DeterministicProductionExecutionAdapter().execute(
                    value,
                    operator=operator,
                    attempted_at=attempted_at,
                )

        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            first_service = Stage10ProductionExecutionService(store, BlockingAdapter())
            second_service = Stage10ProductionExecutionService(store)
            first_service.record_authorization(authorization)
            with self.assertRaisesRegex(ValueError, "kill_switch_triggered"):
                first_service.attempt(
                    authorization["authorizationId"],
                    operator="stage10-operator",
                    attempted_at=(reviewed_at + timedelta(seconds=2)).isoformat(),
                )
            first_service.record_credential_preflight(preflight)
            with self.assertRaisesRegex(ValueError, "permission_verification_required"):
                first_service.set_control(
                    action="restore",
                    operator="stage10-operator",
                    reason="Missing online permission evidence must block.",
                    credential_preflight_id=preflight["preflightId"],
                    recorded_at=(reviewed_at + timedelta(seconds=1, milliseconds=1)).isoformat(),
                )
            first_service.record_permission_verification(verification)
            first_service.set_control(
                action="restore",
                operator="stage10-operator",
                reason="Allow deterministic Stage 10 preparation only.",
                credential_preflight_id=preflight["preflightId"],
                permission_verification_id=verification["verificationId"],
                recorded_at=(reviewed_at + timedelta(seconds=1, milliseconds=1)).isoformat(),
            )
            self.assertFalse(
                Stage10ProductionExecutionService(store).control()[
                    "productionAuthorizationEffective"
                ]
            )
            result = []
            thread = Thread(
                target=lambda: result.append(
                    first_service.attempt(
                        authorization["authorizationId"],
                        operator="stage10-operator",
                        attempted_at=(reviewed_at + timedelta(seconds=2)).isoformat(),
                    )
                )
            )
            thread.start()
            self.assertTrue(started.wait(timeout=2))
            with self.assertRaisesRegex(ValueError, "account_lease_active"):
                second_service.attempt(
                    authorization["authorizationId"],
                    operator="stage10-operator",
                    attempted_at=(reviewed_at + timedelta(seconds=2)).isoformat(),
                )
            release.set()
            thread.join(timeout=5)

        self.assertFalse(thread.is_alive())
        self.assertEqual(result[0]["status"], "blocked_before_network")

    def test_http_api_is_idempotent_readable_and_blocked_before_network(self) -> None:
        candidate, review, _reviewed_at, workflow, sandbox_authorization = _stage9_chain()
        confirmations = {item: True for item in PRODUCTION_EXECUTION_CONFIRMATION_IDS}

        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            store.record(
                {
                    "schemaVersion": 1,
                    "eventId": workflow["workflowId"],
                    "eventType": "stage4_portfolio_workflow",
                    "runId": workflow["baseRunId"],
                    "createdAt": workflow["generatedAt"],
                    "stage": "stage4-portfolio-workflow",
                    "source": "test",
                    "summary": "Stage 4 workflow.",
                    "detail": "Authoritative workflow.",
                    "metadata": {"snapshot": workflow},
                }
            )
            store.record(authorization_to_audit_event(sandbox_authorization))
            store.record(production_order_admission_candidate_to_audit_event(candidate))
            store.record(production_order_admission_review_to_audit_event(review))

            class Handler(QuantApiHandler):
                audit_event_store = store
                execution_adapter_health_environ = _trading_env()
                execution_adapter_health_exchange_factory = staticmethod(
                    lambda _exchange_id, config: SafeTradingPermissionExchange(config)
                )

            server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                connection.request(
                    "POST",
                    "/api/execution/stage10/production-trading-credential-preflights",
                    json.dumps({"operator": "stage10-operator"}),
                    {"Content-Type": "application/json"},
                )
                preflight_response = connection.getresponse()
                preflight_result = json.loads(preflight_response.read())
                preflight = preflight_result["productionTradingCredentialPreflight"]
                connection.request(
                    "POST",
                    "/api/execution/stage10/production-trading-permission-verifications",
                    json.dumps(
                        {
                            "preflightId": preflight["preflightId"],
                            "operator": "stage10-operator",
                        }
                    ),
                    {"Content-Type": "application/json"},
                )
                verification_response = connection.getresponse()
                verification_result = json.loads(verification_response.read())
                verification = verification_result["productionTradingPermissionVerification"]
                connection.request(
                    "POST",
                    "/api/execution/stage10/production-execution-controls",
                    json.dumps(
                        {
                            "action": "restore",
                            "operator": "stage10-operator",
                            "reason": "Allow deterministic Stage 10 preparation only.",
                            "credentialPreflightId": preflight["preflightId"],
                            "permissionVerificationId": verification["verificationId"],
                        }
                    ),
                    {"Content-Type": "application/json"},
                )
                control_response = connection.getresponse()
                control_result = json.loads(control_response.read())
                authorization_body = json.dumps(
                    {
                        "candidateId": candidate["candidateId"],
                        "operator": "stage10-operator",
                        "reason": "Prepare the bounded deterministic production path.",
                        "confirmations": confirmations,
                    }
                )
                connection.request(
                    "POST",
                    "/api/execution/stage10/production-execution-authorizations",
                    authorization_body,
                    {"Content-Type": "application/json"},
                )
                authorization_response = connection.getresponse()
                authorization_result = json.loads(authorization_response.read())
                connection.request(
                    "POST",
                    "/api/execution/stage10/production-execution-authorizations",
                    authorization_body,
                    {"Content-Type": "application/json"},
                )
                repeated_authorization_response = connection.getresponse()
                repeated_authorization_result = json.loads(repeated_authorization_response.read())

                self.assertEqual(authorization_response.status, 201, authorization_result)
                authorization = authorization_result["productionExecutionAuthorization"]
                attempt_body = json.dumps(
                    {
                        "authorizationId": authorization["authorizationId"],
                        "operator": "stage10-operator",
                    }
                )
                connection.request(
                    "POST",
                    "/api/execution/stage10/production-execution-attempts",
                    attempt_body,
                    {"Content-Type": "application/json"},
                )
                attempt_response = connection.getresponse()
                attempt_result = json.loads(attempt_response.read())
                connection.request(
                    "POST",
                    "/api/execution/stage10/production-execution-attempts",
                    attempt_body,
                    {"Content-Type": "application/json"},
                )
                repeated_attempt_response = connection.getresponse()
                repeated_attempt_result = json.loads(repeated_attempt_response.read())

                query = f"?baseRunId={workflow['baseRunId']}"
                connection.request(
                    "GET",
                    "/api/execution/stage10/production-execution-authorizations" + query,
                )
                authorization_read_response = connection.getresponse()
                authorization_read_result = json.loads(authorization_read_response.read())
                connection.request(
                    "GET",
                    "/api/execution/stage10/production-execution-attempts" + query,
                )
                attempt_read_response = connection.getresponse()
                attempt_read_result = json.loads(attempt_read_response.read())
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(authorization_response.status, 201, authorization_result)
        self.assertEqual(preflight_response.status, 201, preflight_result)
        self.assertEqual(preflight["status"], "configured_offline")
        self.assertNotIn("dedicated-trading-key", json.dumps(preflight_result))
        self.assertEqual(verification_response.status, 201, verification_result)
        self.assertEqual(verification["status"], "verified")
        self.assertNotIn("dedicated-trading-key", json.dumps(verification_result))
        self.assertEqual(control_response.status, 201, control_result)
        self.assertEqual(control_result["productionExecutionControl"]["status"], "active")
        self.assertFalse(
            control_result["productionExecutionControl"]["productionAuthorizationEffective"]
        )
        self.assertEqual(repeated_authorization_response.status, 200, repeated_authorization_result)
        self.assertEqual(authorization_result, repeated_authorization_result)
        self.assertEqual(attempt_response.status, 201, attempt_result)
        self.assertEqual(repeated_attempt_response.status, 200, repeated_attempt_result)
        self.assertEqual(attempt_result, repeated_attempt_result)
        self.assertEqual(attempt_result["productionExecutionAttempt"]["networkCallCount"], 0)
        self.assertFalse(attempt_result["productionExecutionAttempt"]["liveOrderSubmitted"])
        self.assertEqual(authorization_read_response.status, 200, authorization_read_result)
        self.assertEqual(
            authorization_read_result["productionExecutionAuthorizations"],
            [authorization_result["productionExecutionAuthorization"]],
        )
        self.assertEqual(attempt_read_response.status, 200, attempt_read_result)
        self.assertEqual(
            attempt_read_result["productionExecutionAttempts"],
            [attempt_result["productionExecutionAttempt"]],
        )


if __name__ == "__main__":
    unittest.main()
