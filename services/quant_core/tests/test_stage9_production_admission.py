from __future__ import annotations

import copy
from datetime import datetime, timedelta, timezone
import hashlib
from http.client import HTTPConnection
from http.server import HTTPServer
import json
from pathlib import Path
import sys
import tempfile
from threading import Thread
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from quant_core.audit_events import AuditEventStore
from quant_core.api import QuantApiHandler
from quant_core.execution_adapter_health import (
    probe_ccxt_production_readonly,
    production_readonly_probe_to_evidence,
)
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    Stage6SandboxExecutionService,
    authorization_to_audit_event,
    build_stage6_sandbox_batch_authorization,
)
from quant_core.stage8_continuity import build_production_readonly_continuity
from quant_core.stage9_production_admission import (
    BinanceSpotProductionAdmissionRoute,
    build_production_order_admission_review,
    build_production_order_admission_candidate,
    production_order_admission_candidate_to_audit_event,
    production_order_admission_review_to_audit_event,
    validate_production_order_admission_review,
    validate_production_order_admission_candidate,
)
from services.quant_core.tests.test_stage6_sandbox import FakeBinance, _authority_chain


def _hash(value):
    return hashlib.sha256(
        json.dumps(value, allow_nan=False, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


class SafeProbeExchange:
    def __init__(self, _config):
        pass

    def load_markets(self):
        return {"BTC/USDT": {}, "ETH/USDT": {}}

    def sapi_get_account_apirestrictions(self):
        return {
            "enableReading": True,
            "enableSpotAndMarginTrading": False,
            "enableMargin": False,
            "enableFutures": False,
            "enableVanillaOptions": False,
            "enableWithdrawals": False,
            "enableInternalTransfer": False,
            "permitsUniversalTransfer": False,
        }

    def fetch_balance(self, _params):
        return {"total": {}, "info": {"accountType": "SPOT"}}


def _current_continuity(now):
    probe = probe_ccxt_production_readonly(
        adapter_id="ccxt-live",
        exchange_id="binance",
        environ={
            "CCXT_PRODUCTION_READONLY_API_KEY": "read-key",
            "CCXT_PRODUCTION_READONLY_SECRET": "read-secret",
        },
        exchange_factory=lambda _exchange_id, config: SafeProbeExchange(config),
        generated_at=now,
    )
    evidence = production_readonly_probe_to_evidence(
        probe,
        stage6_exit_hash="a" * 64,
        production_route_review_id="production-route-review-1",
        operator="readonly-operator",
        eligibility_confirmed=True,
    )
    return build_production_readonly_continuity(
        latest_probe=evidence,
        access_control=None,
        stage6_hash_matches=True,
        route_review_current=True,
        route_review_recorded_at=now.isoformat(),
        generated_at=now,
    )


def _passing_observation(orders, now):
    observation = {
        "kind": "aiqt.stage9ProductionAdmissionObservation",
        "schemaVersion": 1,
        "observedAt": now.isoformat(),
        "exchangeId": "binance",
        "marketChecks": [{"orderId": row["orderId"], "passed": True} for row in orders],
        "priceChecks": [
            {
                "orderId": row["orderId"],
                "quoteObservedAt": now.isoformat(),
                "referencePrice": row["price"],
                "adverseDeviationPct": 0.0,
                "passed": True,
            }
            for row in orders
        ],
        "fundingChecks": [{"orderId": row["orderId"], "passed": True} for row in orders],
        "passed": True,
        "blockedReasons": [],
        "productionReadOnly": True,
        "liveTradingAllowed": False,
        "orderSubmissionEnabled": False,
        "orderRoutingEnabled": False,
        "liveOrderSubmitted": False,
        "liveRouteExecuted": False,
        "liveBlockedBoundary": True,
    }
    observation["observationHash"] = _hash(observation)
    return observation


class Stage9ProductionAdmissionTest(unittest.TestCase):
    def test_readonly_route_checks_market_price_and_funding_without_mutation_or_balance_leak(self) -> None:
        observed_at = datetime(2026, 7, 14, 6, 0, tzinfo=timezone.utc)
        instances = []

        class FakeExchange:
            def __init__(self, config):
                self.config = config
                self.calls = []
                instances.append(self)

            def load_markets(self):
                self.calls.append("load_markets")
                return {
                    "BTC/USDT": {
                        "active": True,
                        "base": "BTC",
                        "quote": "USDT",
                        "limits": {
                            "amount": {"min": 0.0001},
                            "price": {"min": 0.01},
                            "cost": {"min": 5},
                        },
                    },
                    "ETH/USDT": {
                        "active": True,
                        "base": "ETH",
                        "quote": "USDT",
                        "limits": {
                            "amount": {"min": 0.001},
                            "price": {"min": 0.01},
                            "cost": {"min": 5},
                        },
                    },
                }

            def amount_to_precision(self, _symbol, value):
                return f"{value:.4f}"

            def price_to_precision(self, _symbol, value):
                return f"{value:.2f}"

            def fetch_ticker(self, symbol):
                self.calls.append(f"ticker:{symbol}")
                price = 60_000 if symbol == "BTC/USDT" else 3_000
                return {
                    "bid": price,
                    "ask": price,
                    "timestamp": int(observed_at.timestamp() * 1000),
                }

            def fetch_balance(self, params):
                self.calls.append(("fetch_balance", params))
                return {
                    "free": {"BTC": 1, "ETH": 1, "USDT": 100},
                    "info": {"accountType": "SPOT", "secret": "must-not-leak"},
                }

            def create_order(self, *_args, **_kwargs):
                raise AssertionError("production order API must not be called")

        orders = [
            {
                "orderId": "order-btc",
                "clientOrderId": "stage6-btc",
                "symbol": "BTC/USDT",
                "side": "buy",
                "type": "limit",
                "timeInForce": "GTC",
                "quantity": 0.0001,
                "price": 60_000,
                "notionalValue": 6,
            },
            {
                "orderId": "order-eth",
                "clientOrderId": "stage6-eth",
                "symbol": "ETH/USDT",
                "side": "buy",
                "type": "limit",
                "timeInForce": "GTC",
                "quantity": 0.002,
                "price": 3_000,
                "notionalValue": 6,
            },
        ]
        route = BinanceSpotProductionAdmissionRoute(
            env={
                "CCXT_PRODUCTION_READONLY_API_KEY": "read-key",
                "CCXT_PRODUCTION_READONLY_SECRET": "read-secret",
                "CCXT_DEFAULT_TYPE": "spot",
            },
            exchange_factory=lambda _exchange_id, config: FakeExchange(config),
        )

        observation = route.observe(orders, observed_at=observed_at)
        serialized = json.dumps(observation, sort_keys=True)

        self.assertTrue(observation["passed"])
        self.assertTrue(all(row["passed"] for row in observation["marketChecks"]))
        self.assertTrue(all(row["passed"] for row in observation["priceChecks"]))
        self.assertTrue(all(row["passed"] for row in observation["fundingChecks"]))
        self.assertEqual(instances[0].calls, ["load_markets", "ticker:BTC/USDT", "ticker:ETH/USDT"])
        self.assertEqual(instances[1].calls, [("fetch_balance", {"type": "spot", "omitZeroBalances": False})])
        self.assertNotIn("BTC", serialized)
        self.assertNotIn("USDT", serialized)
        self.assertNotIn("must-not-leak", serialized)
        self.assertNotIn("read-secret", serialized)
        self.assertFalse(observation["orderSubmissionEnabled"])
        self.assertFalse(observation["liveTradingAllowed"])
        self.assertTrue(observation["liveBlockedBoundary"])

    def test_candidate_binds_terminal_sandbox_batch_current_continuity_and_exact_orders(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        now = datetime.now(timezone.utc)
        sandbox_route = BinanceSpotTestnetRoute(
            env={"CCXT_SANDBOX_API_KEY": "sandbox-key", "CCXT_SANDBOX_SECRET": "sandbox-secret"},
            ccxt_module=type("Ccxt", (), {"binance": FakeBinance}),
        )
        normalized = sandbox_route.normalize_orders(workflow)
        orders = [
            {**normalized[0], "quantity": 0.0001, "price": 60_000, "notionalValue": 6},
            {**normalized[1], "quantity": 0.002, "price": 3_000, "notionalValue": 6},
        ]
        authorization = build_stage6_sandbox_batch_authorization(
            workflow,
            session,
            readiness,
            preflight,
            review,
            orders,
            operator="sandbox-operator",
            generated_at=now.isoformat(),
        )
        with tempfile.TemporaryDirectory() as directory:
            service = Stage6SandboxExecutionService(
                AuditEventStore(Path(directory) / "audit.sqlite"), sandbox_route
            )
            service.record_authorization(authorization)
            for order in orders:
                service._record_transition(
                    authorization,
                    order,
                    "canceled",
                    attempt=1,
                    exchange_evidence={
                        "operation": "cancel",
                        "clientOrderId": order["clientOrderId"],
                    },
                )
            batch = service.batch(authorization["authorizationId"])

        continuity = _current_continuity(now)
        observation = _passing_observation(orders, now)

        candidate = build_production_order_admission_candidate(
            workflow,
            authorization,
            batch,
            continuity,
            observation,
            operator="production-admission-operator",
            generated_at=now.isoformat(),
        )

        self.assertEqual(validate_production_order_admission_candidate(candidate), candidate)
        self.assertEqual(candidate["status"], "ready_for_review")
        self.assertEqual(candidate["orders"], orders)
        self.assertEqual(candidate["productionRouteReviewId"], "production-route-review-1")
        self.assertEqual(candidate["expiresAt"], (now + timedelta(minutes=10)).isoformat())
        self.assertFalse(candidate["orderSubmissionEnabled"])
        self.assertFalse(candidate["liveTradingAllowed"])
        self.assertTrue(candidate["liveBlockedBoundary"])

    def test_candidate_http_post_is_idempotent_and_get_restores_persisted_evidence(self) -> None:
        workflow, session, readiness, preflight, review = _authority_chain()
        now = datetime.now(timezone.utc)
        sandbox_route = BinanceSpotTestnetRoute(
            env={"CCXT_SANDBOX_API_KEY": "sandbox-key", "CCXT_SANDBOX_SECRET": "sandbox-secret"},
            ccxt_module=type("Ccxt", (), {"binance": FakeBinance}),
        )
        normalized = sandbox_route.normalize_orders(workflow)
        orders = [
            {**normalized[0], "quantity": 0.0001, "price": 60_000, "notionalValue": 6},
            {**normalized[1], "quantity": 0.002, "price": 3_000, "notionalValue": 6},
        ]
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, review, orders,
            operator="sandbox-operator", generated_at=now.isoformat(),
        )
        continuity = _current_continuity(now)
        observation = _passing_observation(orders, now)

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
            service = Stage6SandboxExecutionService(store, sandbox_route)
            service.record_authorization(authorization)
            for order in orders:
                service._record_transition(
                    authorization, order, "canceled", attempt=1,
                    exchange_evidence={"operation": "cancel", "clientOrderId": order["clientOrderId"]},
                )

            class Route:
                def observe(self, candidate_orders, *, observed_at=None):
                    self.assert_orders = candidate_orders
                    return _passing_observation(
                        candidate_orders, observed_at or datetime.now(timezone.utc)
                    )

            class Handler(QuantApiHandler):
                audit_event_store = store
                stage6_sandbox_route_factory = staticmethod(lambda: sandbox_route)
                stage9_production_admission_route_factory = staticmethod(Route)

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            with patch("quant_core.api._stage8_production_readonly_continuity", return_value=continuity):
                thread.start()
                connection = HTTPConnection(*server.server_address, timeout=5)
                body = json.dumps({
                    "authorizationId": authorization["authorizationId"],
                    "operator": "production-admission-operator",
                })
                try:
                    connection.request(
                        "POST", "/api/execution/stage9/production-order-admission-candidates", body,
                        {"Content-Type": "application/json"},
                    )
                    created_response = connection.getresponse()
                    created = json.loads(created_response.read())
                    connection.request(
                        "POST", "/api/execution/stage9/production-order-admission-candidates", body,
                        {"Content-Type": "application/json"},
                    )
                    repeated_response = connection.getresponse()
                    repeated = json.loads(repeated_response.read())
                    connection.request(
                        "GET",
                        f"/api/execution/stage9/production-order-admission-candidates?baseRunId={workflow['baseRunId']}",
                    )
                    read_response = connection.getresponse()
                    readback = json.loads(read_response.read())
                    review_body = json.dumps({
                        "candidateId": created["productionOrderAdmissionCandidate"]["candidateId"],
                        "reviewer": "named-reviewer",
                        "outcome": "approved",
                        "reason": "已核对候选与生产只读证据。",
                        "confirmations": {
                            "candidate-hash-reviewed": True,
                            "production-envelope-reviewed": True,
                            "market-and-funding-checks-reviewed": True,
                            "stage8-continuity-current": True,
                            "no-production-execution-authority": True,
                        },
                    })
                    connection.request(
                        "POST", "/api/execution/stage9/production-order-admission-reviews", review_body,
                        {"Content-Type": "application/json"},
                    )
                    review_response = connection.getresponse()
                    review_result = json.loads(review_response.read())
                    connection.request(
                        "POST", "/api/execution/stage9/production-order-admission-reviews", review_body,
                        {"Content-Type": "application/json"},
                    )
                    repeated_review_response = connection.getresponse()
                    repeated_review = json.loads(repeated_review_response.read())
                    connection.request(
                        "GET",
                        f"/api/execution/stage9/production-order-admission-reviews?baseRunId={workflow['baseRunId']}",
                    )
                    review_read_response = connection.getresponse()
                    review_readback = json.loads(review_read_response.read())
                finally:
                    connection.close()
                    server.shutdown()
                    thread.join(timeout=5)
                    server.server_close()

        self.assertEqual(created_response.status, 201, created)
        self.assertEqual(repeated_response.status, 200, repeated)
        self.assertEqual(read_response.status, 200, readback)
        self.assertEqual(created["productionOrderAdmissionCandidate"], repeated["productionOrderAdmissionCandidate"])
        self.assertEqual(readback["productionOrderAdmissionCandidates"], [created["productionOrderAdmissionCandidate"]])
        self.assertEqual(created["auditEvent"]["eventType"], "stage9_production_order_admission_candidate")
        self.assertEqual(review_response.status, 201, review_result)
        self.assertEqual(repeated_review_response.status, 200, repeated_review)
        self.assertEqual(review_read_response.status, 200, review_readback)
        self.assertEqual(review_result, repeated_review)
        self.assertEqual(
            review_readback["productionOrderAdmissionReviews"],
            [review_result["productionOrderAdmissionReview"]],
        )
        self.assertFalse(review_result["productionOrderAdmissionReview"]["authorizationEffective"])
        self.assertEqual(review_result["auditEvent"]["eventType"], "stage9_production_order_admission_review")

    def test_review_revalidates_fresh_candidate_without_granting_execution_authority(self) -> None:
        workflow, session, readiness, preflight, stage5_review = _authority_chain()
        now = datetime.now(timezone.utc)
        route = BinanceSpotTestnetRoute(
            env={"CCXT_SANDBOX_API_KEY": "sandbox-key", "CCXT_SANDBOX_SECRET": "sandbox-secret"},
            ccxt_module=type("Ccxt", (), {"binance": FakeBinance}),
        )
        orders = [
            {**route.normalize_orders(workflow)[0], "quantity": 0.0001, "price": 60_000, "notionalValue": 6},
            {**route.normalize_orders(workflow)[1], "quantity": 0.002, "price": 3_000, "notionalValue": 6},
        ]
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, stage5_review, orders,
            operator="sandbox-operator", generated_at=now.isoformat(),
        )
        batch = {
            "authorizationId": authorization["authorizationId"],
            "baseRunId": authorization["baseRunId"],
            "batchId": authorization["batchId"],
            "status": "reconciled",
            "orders": [{**order, "state": "canceled"} for order in orders],
        }
        continuity = _current_continuity(now)
        candidate = build_production_order_admission_candidate(
            workflow, authorization, batch, continuity, _passing_observation(orders, now),
            operator="candidate-operator", generated_at=now.isoformat(),
        )
        reviewed_at = now + timedelta(minutes=1)

        review = build_production_order_admission_review(
            candidate,
            continuity,
            _passing_observation(orders, reviewed_at),
            reviewer="named-reviewer",
            outcome="approved",
            reason="已核对候选、账户连续性与只读生产检查。",
            confirmations={
                "candidate-hash-reviewed": True,
                "production-envelope-reviewed": True,
                "market-and-funding-checks-reviewed": True,
                "stage8-continuity-current": True,
                "no-production-execution-authority": True,
            },
            reviewed_at=reviewed_at.isoformat(),
        )

        self.assertEqual(validate_production_order_admission_review(review), review)
        self.assertEqual(review["candidateHash"], candidate["candidateHash"])
        self.assertEqual(review["reviewObservation"]["observedAt"], reviewed_at.isoformat())
        self.assertFalse(review["authorizationEffective"])
        self.assertFalse(review["orderSubmissionEnabled"])
        self.assertFalse(review["liveTradingAllowed"])
        self.assertTrue(review["liveBlockedBoundary"])

        changed_continuity = {**continuity, "continuityHash": "b" * 64}
        with self.assertRaisesRegex(ValueError, "continuity"):
            build_production_order_admission_review(
                candidate,
                changed_continuity,
                _passing_observation(orders, reviewed_at),
                reviewer="named-reviewer",
                outcome="approved",
                reason="不得接受连续性漂移。",
                confirmations={
                    "candidate-hash-reviewed": True,
                    "production-envelope-reviewed": True,
                    "market-and-funding-checks-reviewed": True,
                    "stage8-continuity-current": True,
                    "no-production-execution-authority": True,
                },
                reviewed_at=reviewed_at.isoformat(),
            )

    def test_research_package_preserves_stage9_chain_as_detached_audit_only_evidence(self) -> None:
        from services.quant_core.tests import test_quant_core as quant_core_tests
        from quant_core.runs import (
            research_run_export_to_payload,
            research_run_import_audit_events,
            research_run_import_to_audit,
        )

        workflow, session, readiness, preflight, stage5_review = _authority_chain()
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
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, session, readiness, preflight, stage5_review, orders,
            operator="sandbox-operator", generated_at=now.isoformat(),
        )
        batch = {
            "authorizationId": authorization["authorizationId"],
            "baseRunId": authorization["baseRunId"],
            "batchId": authorization["batchId"],
            "status": "reconciled",
            "orders": [{**order, "state": "canceled"} for order in orders],
        }
        continuity = _current_continuity(now)
        candidate = build_production_order_admission_candidate(
            workflow, authorization, batch, continuity, _passing_observation(orders, now),
            operator="candidate-operator", generated_at=now.isoformat(),
        )
        reviewed_at = now + timedelta(minutes=1)
        review = build_production_order_admission_review(
            candidate, continuity, _passing_observation(orders, reviewed_at),
            reviewer="named-reviewer", outcome="approved", reason="只读准入证据复核通过。",
            confirmations={item: True for item in (
                "candidate-hash-reviewed",
                "production-envelope-reviewed",
                "market-and-funding-checks-reviewed",
                "stage8-continuity-current",
                "no-production-execution-authority",
            )},
            reviewed_at=reviewed_at.isoformat(),
        )
        events = [
            {
                "schemaVersion": 1,
                "eventId": workflow["workflowId"],
                "eventType": "stage4_portfolio_workflow",
                "runId": workflow["baseRunId"],
                "createdAt": workflow["generatedAt"],
                "stage": "stage4-portfolio-workflow",
                "source": "test",
                "summary": "Stage 4 source.",
                "detail": "Authoritative workflow.",
                "metadata": {"snapshot": workflow},
            },
            authorization_to_audit_event(authorization),
            production_order_admission_candidate_to_audit_event(candidate),
            production_order_admission_review_to_audit_event(review),
        ]
        audit = quant_core_tests.QuantCoreContractTest()._sample_research_run_audit(
            run_id=workflow["baseRunId"], strategy_revision="rev-stage9"
        )
        exported = research_run_export_to_payload(audit, audit_events=events)

        self.assertEqual(exported["manifest"]["artifactCounts"]["stage9ProductionAdmissionCandidates"], 1)
        self.assertEqual(exported["manifest"]["artifactCounts"]["stage9ProductionAdmissionReviews"], 1)
        imported = research_run_import_to_audit(exported)
        imported_events = research_run_import_audit_events(exported, run_id=imported.run_id)
        stage9_events = [event for event in imported_events if event["eventType"].startswith("stage9_")]
        self.assertEqual(len(stage9_events), 2)
        self.assertTrue(all(event["metadata"]["detached"] for event in stage9_events))

        missing_candidate = research_run_export_to_payload(audit, audit_events=[*events[:2], events[3]])
        with self.assertRaisesRegex(ValueError, "stage9_production_admission_review_source_missing"):
            research_run_import_to_audit(missing_candidate)

        tampered = copy.deepcopy(exported)
        tampered.pop("integrity")
        review_snapshot = tampered["auditEvents"][3]["metadata"]["snapshot"]
        review_snapshot["candidateHash"] = "b" * 64
        review_snapshot["reviewId"] = "stage9-production-admission-review-" + hashlib.sha256(
            review_snapshot["candidateHash"].encode()
        ).hexdigest()[:24]
        review_snapshot["reviewHash"] = _hash({
            key: value for key, value in review_snapshot.items() if key != "reviewHash"
        })
        tampered["auditEvents"][3]["eventId"] = review_snapshot["reviewId"]
        with self.assertRaisesRegex(ValueError, "stage9_production_admission_review_source_missing"):
            research_run_import_to_audit(tampered)

    def test_stage9_acceptance_manifest_requires_restart_exact_and_live_blocked(self) -> None:
        from tools.stage9_production_admission_acceptance import _manifest, validate

        exercise = {
            "candidate": {
                "candidateId": "candidate-a", "candidateHash": "a" * 64,
                "orders": [{}, {}], "orderSubmissionEnabled": False, "liveTradingAllowed": False,
                "liveRouteExecuted": False, "liveBlockedBoundary": True,
            },
            "review": {
                "reviewId": "review-a", "reviewHash": "b" * 64, "outcome": "approved",
                "authorizationEffective": False, "orderSubmissionEnabled": False,
                "liveTradingAllowed": False, "liveRouteExecuted": False, "liveBlockedBoundary": True,
            },
            "noCredentialBlocker": "stage9_production_readonly_credentials_required",
            "continuityDriftBlocked": True,
            "expiredCandidateBlocked": True,
            "detachedAuthorityBlocked": True,
        }
        readback = {"status": 200, "candidates": [exercise["candidate"]], "reviews": [exercise["review"]]}
        manifest = _manifest(exercise, readback)

        self.assertIn("restartExact=true", validate(manifest))
        self.assertEqual(manifest["status"], "accepted")
        self.assertFalse(manifest["orderSubmissionEnabled"])
        self.assertFalse(manifest["liveTradingAllowed"])
        self.assertTrue(manifest["liveBlockedBoundary"])


if __name__ == "__main__":
    unittest.main()
