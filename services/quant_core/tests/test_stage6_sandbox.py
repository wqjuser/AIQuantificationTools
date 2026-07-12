from __future__ import annotations

import copy
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
import json
from pathlib import Path
from types import SimpleNamespace
import sys
import tempfile
from threading import Thread
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.quant_core.tests import test_quant_core as quant_core_tests
from services.quant_core.tests import test_stage5_shadow as stage5_tests
from quant_core.execution import (
    execution_adapter_sandbox_probe_execution_payload_from_audit_event,
    execution_adapter_sandbox_probe_review_payload_from_audit_event,
)
from quant_core.audit_events import AuditEventStore, audit_event_record_to_payload
from quant_core.stage5_shadow import (
    build_stage5_sandbox_authorization_preflight,
    build_stage5_sandbox_authorization_review,
    build_stage5_sandbox_readiness_decision,
    build_stage5_shadow_session,
    stage5_sandbox_authorization_preflight_to_audit_event,
    stage5_sandbox_authorization_review_to_audit_event,
    stage5_sandbox_readiness_decision_to_audit_event,
    stage5_shadow_session_to_audit_event,
)
from quant_core.api import QuantApiHandler
from quant_core.runs import research_run_import_audit_events
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    Stage6SandboxExecutionService,
    build_stage6_sandbox_batch_authorization,
    is_active_batch,
    normalize_exchange_order,
    stage6_authorization_hash,
    validate_stage6_sandbox_batch_authorization,
)


class FakeBinance:
    instances: list["FakeBinance"] = []

    def __init__(self, config: dict) -> None:
        self.config = config
        self.calls: list[str] = []
        self.statuses: dict[str, str] = {}
        self.__class__.instances.append(self)

    def set_sandbox_mode(self, enabled: bool) -> None:
        self.calls.append(f"sandbox:{enabled}")

    def load_markets(self) -> dict:
        self.calls.append("markets")
        market = lambda base: {
            "active": True,
            "base": base,
            "quote": "USDT",
            "limits": {"amount": {"min": 0.0001}, "price": {"min": 0.01}, "cost": {"min": 5}},
        }
        return {"BTC/USDT": market("BTC"), "ETH/USDT": market("ETH")}

    def fetch_balance(self) -> dict:
        self.calls.append("balance")
        return {"free": {"BTC": 1_000_000, "ETH": 1_000_000, "USDT": 1_000_000_000}}

    def amount_to_precision(self, _symbol: str, value: float) -> str:
        return f"{value:.4f}"

    def price_to_precision(self, _symbol: str, value: float) -> str:
        return f"{value:.2f}"

    def create_order(self, symbol: str, _type: str, _side: str, amount: float, _price: float, params: dict) -> dict:
        self.calls.append("create")
        self.statuses[params["newClientOrderId"]] = "open"
        return _exchange_order(params["newClientOrderId"], symbol=symbol, amount=amount)

    def fetch_order(self, _order_id: str | None, symbol: str, params: dict) -> dict:
        self.calls.append("fetch")
        client_id = params["origClientOrderId"]
        return _exchange_order(client_id, symbol=symbol, status=self.statuses.get(client_id, "open"))

    def cancel_order(self, _order_id: str | None, symbol: str, params: dict) -> dict:
        self.calls.append("cancel")
        client_id = params["origClientOrderId"]
        self.statuses[client_id] = "canceled"
        return _exchange_order(client_id, symbol=symbol, status="canceled")


class OrderNotFound(Exception):
    pass


class MissingThenCreatedBinance(FakeBinance):
    def fetch_order(self, _order_id: str | None, symbol: str, params: dict) -> dict:
        self.calls.append("fetch")
        raise OrderNotFound("missing")


def _exchange_order(client_order_id: str, *, symbol: str = "BTC/USDT", amount: float = 1, status: str = "open") -> dict:
    return {
        "id": "exchange-1",
        "clientOrderId": client_order_id,
        "symbol": symbol,
        "status": status,
        "amount": amount,
        "filled": 0,
        "remaining": amount,
        "average": None,
        "timestamp": 1,
    }


def _payload(event: dict, converter):
    return converter(
        SimpleNamespace(
            event_type=event["eventType"],
            event_id=event["eventId"],
            metadata=event["metadata"],
            created_at=datetime.fromisoformat(event["createdAt"]),
        )
    )


def _authority_chain() -> tuple[dict, dict, dict, dict, dict]:
    workflow, executions = stage5_tests.stage4_workflow_with_adapter_evidence(
        market="crypto", adapter_id="ccxt-live"
    )
    now = datetime.now(timezone.utc)
    session = build_stage5_shadow_session(workflow, generated_at=workflow["generatedAt"])
    readiness = build_stage5_sandbox_readiness_decision(
        workflow, session, executions, operator="test", confirmed=True, generated_at=now.isoformat()
    )
    health = quant_core_tests.QuantCoreContractTest()._ccxt_health_evidence(generated_at=now)
    execution_event, review_event = stage5_tests.sandbox_probe_audit_events(health)
    execution = _payload(execution_event, execution_adapter_sandbox_probe_execution_payload_from_audit_event)
    probe_review = _payload(review_event, execution_adapter_sandbox_probe_review_payload_from_audit_event)
    preflight = build_stage5_sandbox_authorization_preflight(
        readiness, execution, probe_review, operator="test", confirmed=True, generated_at=now.isoformat()
    )
    review = build_stage5_sandbox_authorization_review(
        preflight,
        execution,
        reviewer="reviewer",
        outcome="approved",
        reason="Sandbox scope approved.",
        confirmations={
            "preflight-hash-reviewed": True,
            "sandbox-only-scope": True,
            "no-order-submission": True,
            "no-live-funds": True,
            "kill-switch-and-rollback-owner-reviewed": True,
        },
        generated_at=now.isoformat(),
    )
    return workflow, session, readiness, preflight, review


class Stage6SandboxTest(unittest.TestCase):
    def setUp(self) -> None:
        FakeBinance.instances.clear()
        self.route = BinanceSpotTestnetRoute(
            env={"CCXT_SANDBOX_API_KEY": "sandbox-key", "CCXT_SANDBOX_SECRET": "sandbox-secret"},
            ccxt_module=SimpleNamespace(binance=FakeBinance),
        )

    def test_route_enables_sandbox_before_market_or_order_calls(self) -> None:
        workflow, *_ = _authority_chain()
        orders = self.route.normalize_orders(workflow)
        exchange = FakeBinance.instances[-1]
        self.assertEqual(exchange.calls[:3], ["sandbox:True", "markets", "balance"])
        self.assertEqual([row["timeInForce"] for row in orders], ["GTC", "GTC"])
        self.assertLessEqual(sum(row["notionalValue"] for row in orders), workflow["riskTemplate"]["maxBatchNotional"])
        created = self.route.create_order(orders[0])
        self.assertEqual(created["state"], "open")
        self.assertEqual(self.route.cancel_order(orders[0], created["exchangeOrderId"])["state"], "canceled")

    def test_write_route_never_falls_back_to_generic_credentials(self) -> None:
        route = BinanceSpotTestnetRoute(
            env={"CCXT_API_KEY": "production-shaped-key", "CCXT_SECRET": "secret"},
            ccxt_module=SimpleNamespace(binance=FakeBinance),
        )
        with self.assertRaisesRegex(ValueError, "credentials_required"):
            route.exchange()
        self.assertEqual(FakeBinance.instances, [])

    def test_authorization_binds_chain_orders_and_ten_minute_expiry(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        orders = self.route.normalize_orders(workflow)
        generated = datetime.now(timezone.utc)
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, orders,
            operator="operator", generated_at=generated.isoformat(),
        )
        self.assertEqual(datetime.fromisoformat(authorization["expiresAt"]) - generated, timedelta(minutes=10))
        self.assertTrue(authorization["sandboxOrderSubmissionAllowed"])
        self.assertFalse(authorization["liveTradingAllowed"])
        validate_stage6_sandbox_batch_authorization(
            authorization, now=generated + timedelta(minutes=9), require_fresh=True
        )
        with self.assertRaisesRegex(ValueError, "expired"):
            validate_stage6_sandbox_batch_authorization(
                authorization, now=generated + timedelta(minutes=11), require_fresh=True
            )
        tampered = copy.deepcopy(authorization)
        tampered["orders"][0]["price"] += 1
        tampered["authorizationHash"] = stage6_authorization_hash(tampered)
        with self.assertRaises(ValueError):
            validate_stage6_sandbox_batch_authorization(tampered)

    def test_exchange_state_is_minimal_and_active_batch_is_fail_closed(self) -> None:
        row = normalize_exchange_order(
            {**_exchange_order("client-1", amount=2), "filled": 0.5, "remaining": 1.5},
            expected_client_order_id="client-1",
        )
        self.assertEqual(row["state"], "partially_filled")
        self.assertTrue(is_active_batch([row]))
        self.assertFalse(is_active_batch([{**row, "state": "filled"}]))

    def test_service_persists_submit_cancel_kill_switch_and_restart_readback(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, self.route.normalize_orders(workflow),
            operator="operator",
        )
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = Stage6SandboxExecutionService(store, self.route)
            service.record_authorization(authorization)
            submitted = service.submit(authorization["authorizationId"])
            self.assertEqual(submitted["status"], "active")
            self.assertEqual([row["state"] for row in submitted["orders"]], ["open", "open"])
            self.assertEqual(
                Stage6SandboxExecutionService(store, self.route).recover_active_batches()[0]["status"], "active"
            )
            canceled = service.cancel(authorization["authorizationId"], submitted["orders"][0]["orderId"])
            self.assertEqual(canceled["orders"][0]["state"], "canceled")
            switch = service.set_kill_switch(triggered=True, operator="operator")
            self.assertTrue(switch["triggered"])
            recovered = Stage6SandboxExecutionService(store, self.route).batch(authorization["authorizationId"])
            self.assertEqual([row["state"] for row in recovered["orders"]], ["canceled", "canceled"])
            self.assertFalse(service.set_kill_switch(triggered=False, operator="operator")["triggered"])

    def test_expiry_blocks_only_initial_submission(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, self.route.normalize_orders(workflow),
            operator="operator",
        )
        generated = datetime.now(timezone.utc) - timedelta(minutes=11)
        authorization["generatedAt"] = generated.isoformat()
        authorization["expiresAt"] = (generated + timedelta(minutes=10)).isoformat()
        authorization["authorizationHash"] = stage6_authorization_hash(authorization)
        with tempfile.TemporaryDirectory() as directory:
            service = Stage6SandboxExecutionService(AuditEventStore(Path(directory) / "audit.sqlite"), self.route)
            service.record_authorization(authorization)
            with self.assertRaisesRegex(ValueError, "expired"):
                service.submit(authorization["authorizationId"])
            first = authorization["orders"][0]
            service._record_transition(
                authorization, first, "open", attempt=1,
                exchange_evidence=normalize_exchange_order(
                    _exchange_order(first["clientOrderId"], amount=first["quantity"]),
                    expected_client_order_id=first["clientOrderId"],
                ),
            )
            self.assertEqual(service.submit(authorization["authorizationId"])["orders"][0]["state"], "open")

    def test_restart_retries_pending_order_once_after_query_proves_missing(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        route = BinanceSpotTestnetRoute(
            env={"CCXT_SANDBOX_API_KEY": "sandbox-key", "CCXT_SANDBOX_SECRET": "sandbox-secret"},
            ccxt_module=SimpleNamespace(binance=MissingThenCreatedBinance),
        )
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, route.normalize_orders(workflow), operator="operator"
        )
        with tempfile.TemporaryDirectory() as directory:
            service = Stage6SandboxExecutionService(AuditEventStore(Path(directory) / "audit.sqlite"), route)
            service.record_authorization(authorization)
            first = authorization["orders"][0]
            service._record_transition(authorization, first, "submission_pending", attempt=1)
            recovered = service.reconcile(authorization["authorizationId"])
            row = recovered["orders"][0]
            self.assertEqual((row["state"], row["attempt"]), ("open", 2))
            self.assertEqual(MissingThenCreatedBinance.instances[-1].calls[-3:], ["fetch", "fetch", "create"])

    def test_transition_readback_paginates_beyond_store_page_limit(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, self.route.normalize_orders(workflow), operator="operator"
        )
        with tempfile.TemporaryDirectory() as directory:
            service = Stage6SandboxExecutionService(AuditEventStore(Path(directory) / "audit.sqlite"), self.route)
            service.record_authorization(authorization)
            first = authorization["orders"][0]
            for sequence in range(55):
                service._record_transition(
                    authorization,
                    first,
                    "open" if sequence < 54 else "canceled",
                    attempt=1,
                    exchange_evidence={"operation": "query", "clientOrderId": first["clientOrderId"]},
                )
            transitions = service._transitions(authorization["authorizationId"])
            self.assertEqual(len(transitions), 55)
            self.assertEqual(service.batch(authorization["authorizationId"])["orders"][0]["state"], "canceled")

    def test_cancel_reconciliation_never_turns_missing_order_into_submission(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        route = BinanceSpotTestnetRoute(
            env={"CCXT_SANDBOX_API_KEY": "sandbox-key", "CCXT_SANDBOX_SECRET": "sandbox-secret"},
            ccxt_module=SimpleNamespace(binance=MissingThenCreatedBinance),
        )
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, route.normalize_orders(workflow), operator="operator"
        )
        with tempfile.TemporaryDirectory() as directory:
            service = Stage6SandboxExecutionService(AuditEventStore(Path(directory) / "audit.sqlite"), route)
            service.record_authorization(authorization)
            first = authorization["orders"][0]
            service._record_transition(authorization, first, "submission_pending", attempt=1)
            result = service.cancel(authorization["authorizationId"], first["orderId"])
            calls = MissingThenCreatedBinance.instances[-1].calls
            self.assertEqual(result["orders"][0]["state"], "reconciliation_required")
            self.assertNotIn("create", calls)

    def test_http_golden_path_rebuilds_authority_then_submits(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            store.record({
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
            })
            for event in (
                stage5_shadow_session_to_audit_event(session, "test"),
                stage5_sandbox_readiness_decision_to_audit_event(readiness),
                stage5_sandbox_authorization_preflight_to_audit_event(preflight),
                stage5_sandbox_authorization_review_to_audit_event(review),
            ):
                store.record(event)

            class Handler(QuantApiHandler):
                audit_event_store = store
                stage6_sandbox_route_factory = staticmethod(lambda: self.route)

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                body = json.dumps({
                    "workflowId": workflow["workflowId"],
                    "shadowSessionId": session["sessionId"],
                    "readinessDecisionId": readiness["decisionId"],
                    "preflightId": preflight["preflightId"],
                    "reviewId": review["reviewId"],
                    "operator": "operator",
                })
                connection.request("POST", "/api/execution/stage6/sandbox-authorizations", body, {"Content-Type": "application/json"})
                response = connection.getresponse()
                authorization_payload = json.loads(response.read())
                self.assertEqual(response.status, 201, authorization_payload)
                authorization_id = authorization_payload["sandboxBatchAuthorization"]["authorizationId"]
                body = json.dumps({"authorizationId": authorization_id})
                connection.request("POST", "/api/execution/stage6/sandbox-batches", body, {"Content-Type": "application/json"})
                response = connection.getresponse()
                batch_payload = json.loads(response.read())
                self.assertEqual(response.status, 200, batch_payload)
                self.assertEqual([row["state"] for row in batch_payload["sandboxBatch"]["orders"]], ["open", "open"])
                connection.request("GET", f"/api/execution/stage6/sandbox-batches?authorizationId={authorization_id}")
                response = connection.getresponse()
                self.assertEqual(json.loads(response.read())["sandboxBatch"]["status"], "active")
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

    def test_imported_stage6_events_are_detached_and_cannot_execute(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, self.route.normalize_orders(workflow), operator="operator"
        )
        with tempfile.TemporaryDirectory() as directory:
            source = AuditEventStore(Path(directory) / "source.sqlite")
            service = Stage6SandboxExecutionService(source, self.route)
            service.record_authorization(authorization)
            service.submit(authorization["authorizationId"])
            service.set_kill_switch(triggered=True, operator="operator")
            payload = {"export": {
                "adapterPaperExecutions": [],
                "auditEvents": [audit_event_record_to_payload(event) for event in source.list_all_by_run(workflow["baseRunId"])],
            }}
            imported = research_run_import_audit_events(payload, run_id=workflow["baseRunId"])
            self.assertTrue(all(event["metadata"]["detached"] for event in imported))
            target = AuditEventStore(Path(directory) / "target.sqlite")
            for event in imported:
                target.record(event)
            detached = Stage6SandboxExecutionService(target, self.route)
            self.assertEqual(detached.batch(authorization["authorizationId"])["status"], "reconciled")
            self.assertFalse(detached.kill_switch()["triggered"])
            for action in (detached.submit, detached.reconcile):
                with self.assertRaisesRegex(ValueError, "detached"):
                    action(authorization["authorizationId"])


if __name__ == "__main__":
    unittest.main()
