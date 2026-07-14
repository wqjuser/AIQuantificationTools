from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
import json
import os
from pathlib import Path
import sys
import tempfile
from threading import Thread
from typing import Any
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "quant_core"))

from quant_core.api import QuantApiHandler, _stage9_production_admission_candidate
from quant_core.audit_events import AuditEventStore
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    Stage6SandboxExecutionService,
    build_stage6_sandbox_batch_authorization,
)
from quant_core.stage9_production_admission import (
    BinanceSpotProductionAdmissionRoute,
    PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS,
    build_production_order_admission_candidate,
    build_production_order_admission_review,
    production_order_admission_candidate_to_audit_event,
)
from quant_core.stage8_continuity import build_production_readonly_access_control
from services.quant_core.tests.test_stage6_sandbox import FakeBinance, _authority_chain
from services.quant_core.tests.test_stage9_production_admission import _current_continuity, _passing_observation

try:
    from tools.stage7_production_readonly_acceptance import _hash, _is_hash, _run, _wait_for_api
except ModuleNotFoundError:
    from stage7_production_readonly_acceptance import _hash, _is_hash, _run, _wait_for_api


BOUNDARY = {
    "productionReadOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "orderRoutingEnabled": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}
REAL_READONLY_METHODS = frozenset({
    "load_markets", "amount_to_precision", "price_to_precision", "fetch_ticker", "fetch_balance"
})
REAL_REQUIRED_METHODS = frozenset({"load_markets", "fetch_ticker", "fetch_balance"})


class _DeterministicProductionExchange:
    def __init__(
        self, config: dict[str, Any], *, now: datetime, orders: list[dict[str, Any]], fault: str | None
    ) -> None:
        self.config = config
        self.now = now
        self.orders = {order["symbol"]: order for order in orders}
        self.fault = fault

    def load_markets(self) -> dict[str, Any]:
        markets = {
            "BTC/USDT": {
                "active": True, "base": "BTC", "quote": "USDT",
                "limits": {"amount": {"min": 0.0001}, "price": {"min": 0.01}, "cost": {"min": 5}},
            },
            "ETH/USDT": {
                "active": True, "base": "ETH", "quote": "USDT",
                "limits": {"amount": {"min": 0.001}, "price": {"min": 0.01}, "cost": {"min": 5}},
            },
        }
        if self.fault == "rule-drift":
            markets["BTC/USDT"]["limits"]["cost"] = {}
        return markets

    def amount_to_precision(self, _symbol: str, value: float) -> str:
        return str(value)

    def price_to_precision(self, _symbol: str, value: float) -> str:
        return str(value)

    def fetch_ticker(self, symbol: str) -> dict[str, Any]:
        order = self.orders[symbol]
        reference = float(order["price"])
        if self.fault == "adverse-price":
            reference = reference / 1.02 if order["side"] == "buy" else reference * 1.02
        quoted_at = self.now - timedelta(seconds=31) if self.fault == "stale-quote" else self.now
        return {"bid": reference, "ask": reference, "timestamp": int(quoted_at.timestamp() * 1000)}

    def fetch_balance(self, _params: dict[str, Any]) -> dict[str, Any]:
        available = 0 if self.fault == "insufficient-funds" else 100
        return {"free": {"USDT": available, "BTC": available, "ETH": available}}


def _deterministic_observation(
    orders: list[dict[str, Any]], now: datetime, fault: str | None = None
) -> dict[str, Any]:
    return BinanceSpotProductionAdmissionRoute(
        env={
            "CCXT_PRODUCTION_READONLY_API_KEY": "deterministic-readonly-key",
            "CCXT_PRODUCTION_READONLY_SECRET": "deterministic-readonly-secret",
        },
        exchange_factory=lambda _exchange_id, config: _DeterministicProductionExchange(
            config, now=now, orders=orders, fault=fault
        ),
    ).observe(orders, observed_at=now)


def _container_exercise() -> dict[str, Any]:
    workflow, session, readiness, preflight, stage5_review = _authority_chain()
    now = datetime.now(timezone.utc)
    sandbox_route = BinanceSpotTestnetRoute(
        env={"CCXT_SANDBOX_API_KEY": "acceptance", "CCXT_SANDBOX_SECRET": "acceptance"},
        ccxt_module=type("Ccxt", (), {"binance": FakeBinance}),
    )
    normalized = sandbox_route.normalize_orders(workflow)
    orders = [
        {**normalized[0], "quantity": 0.0001, "price": 60_000, "notionalValue": 6},
        {**normalized[1], "quantity": 0.002, "price": 3_000, "notionalValue": 6},
    ]
    authorization = build_stage6_sandbox_batch_authorization(
        workflow, session, readiness, preflight, stage5_review, orders,
        operator="stage9-acceptance", generated_at=now.isoformat(),
    )
    continuity = _current_continuity(now)

    store = AuditEventStore("data/audit_events.sqlite")
    candidate_count_before_no_credential = len(store.list_recent(
        event_type="stage9_production_order_admission_candidate", limit=100
    ))
    review_count_before_no_credential = len(store.list_recent(
        event_type="stage9_production_order_admission_review", limit=100
    ))
    no_credential_blocker = ""
    no_credential_factory_called = False

    def forbidden_factory(_exchange_id: str, _config: dict[str, Any]) -> Any:
        nonlocal no_credential_factory_called
        no_credential_factory_called = True
        raise RuntimeError("production network must not be constructed")

    store.record({
        "schemaVersion": 1,
        "eventId": workflow["workflowId"],
        "eventType": "stage4_portfolio_workflow",
        "runId": workflow["baseRunId"],
        "createdAt": workflow["generatedAt"],
        "stage": "stage4-portfolio-workflow",
        "source": "stage9-acceptance",
        "summary": "Stage 4 source for Stage 9 Docker acceptance.",
        "detail": "Authoritative source remains paper and sandbox only.",
        "metadata": {"snapshot": workflow},
    })
    service = Stage6SandboxExecutionService(store, sandbox_route)
    service.record_authorization(authorization)
    for order in orders:
        service._record_transition(
            authorization, order, "canceled", attempt=1,
            exchange_evidence={"operation": "cancel", "clientOrderId": order["clientOrderId"]},
        )
    batch = service.batch(authorization["authorizationId"])
    candidate_request = {
        "authorizationId": authorization["authorizationId"],
        "operator": "stage9-acceptance",
    }

    def post(connection: HTTPConnection, path: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        connection.request(
            "POST", path, json.dumps(payload), {"Content-Type": "application/json"}
        )
        response = connection.getresponse()
        return response.status, json.loads(response.read())

    class NoCredentialHandler(QuantApiHandler):
        audit_event_store = store
        stage6_sandbox_route_factory = staticmethod(lambda: sandbox_route)
        stage9_production_admission_route_factory = staticmethod(lambda: (
            BinanceSpotProductionAdmissionRoute(
                env={
                    "CCXT_API_KEY": "generic-key-must-not-be-used",
                    "CCXT_SECRET": "generic-secret-must-not-be-used",
                    "CCXT_SANDBOX_API_KEY": "sandbox-key-must-not-be-used",
                    "CCXT_SANDBOX_SECRET": "sandbox-secret-must-not-be-used",
                },
                exchange_factory=forbidden_factory,
            )
        ))

    no_credential_server = HTTPServer(("127.0.0.1", 0), NoCredentialHandler)
    no_credential_thread = Thread(target=no_credential_server.serve_forever, daemon=True)
    with patch("quant_core.api._stage8_production_readonly_continuity", return_value=continuity):
        no_credential_thread.start()
        no_credential_connection = HTTPConnection(*no_credential_server.server_address, timeout=10)
        try:
            no_credential_status, no_credential_payload = post(
                no_credential_connection,
                "/api/execution/stage9/production-order-admission-candidates",
                candidate_request,
            )
        finally:
            no_credential_connection.close()
            no_credential_server.shutdown()
            no_credential_thread.join(timeout=5)
            no_credential_server.server_close()
    if no_credential_status == 409:
        no_credential_blocker = ";".join(no_credential_payload.get("blockers", []))
    no_credential_candidate_count = len(store.list_recent(
        event_type="stage9_production_order_admission_candidate", limit=100
    ))
    no_credential_review_count = len(store.list_recent(
        event_type="stage9_production_order_admission_review", limit=100
    ))
    no_credential_artifact_counts_unchanged = (
        no_credential_candidate_count == candidate_count_before_no_credential
        and no_credential_review_count == review_count_before_no_credential
    )

    ready_observation = _deterministic_observation(orders, now)
    model_candidate = build_production_order_admission_candidate(
        workflow, authorization, batch, continuity, ready_observation,
        operator="stage9-acceptance", generated_at=now.isoformat(),
    )
    reviewed_at = now + timedelta(minutes=1)
    review_observation = _deterministic_observation(orders, reviewed_at)
    model_review = build_production_order_admission_review(
        model_candidate, continuity, review_observation,
        reviewer="stage9-acceptance-reviewer", outcome="approved",
        reason="Docker acceptance reviewed the immutable read-only admission evidence.",
        confirmations={item: True for item in PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS},
        reviewed_at=reviewed_at.isoformat(),
    )

    fault_observations = {
        fault: _deterministic_observation(orders, now, fault)
        for fault in ("rule-drift", "stale-quote", "adverse-price", "insufficient-funds")
    }

    drift_blocked = False
    try:
        drift_time = now + timedelta(seconds=2)
        build_production_order_admission_review(
            model_candidate, _current_continuity(drift_time), _passing_observation(orders, drift_time),
            reviewer="stage9-acceptance-reviewer", outcome="approved", reason="drift drill",
            confirmations={item: True for item in model_review["confirmedScopeIds"]},
            reviewed_at=drift_time.isoformat(),
        )
    except ValueError as error:
        drift_blocked = "continuity" in str(error)

    expired_blocked = False
    try:
        expired_at = now + timedelta(minutes=11)
        build_production_order_admission_review(
            model_candidate, continuity, _passing_observation(orders, expired_at),
            reviewer="stage9-acceptance-reviewer", outcome="approved", reason="expiry drill",
            confirmations={item: True for item in model_review["confirmedScopeIds"]},
            reviewed_at=expired_at.isoformat(),
        )
    except ValueError as error:
        expired_blocked = "expired" in str(error)

    control = build_production_readonly_access_control(
        action="revoke", operator="stage9-acceptance", reason="network precondition drill"
    )
    revoked = {
        **continuity,
        "status": "revoked",
        "accessState": "revoked",
        "accessControl": control,
        "blockedReasons": ["production_readonly_access_revoked"],
    }
    revoked["continuityHash"] = _hash({
        key: value for key, value in revoked.items() if key != "continuityHash"
    })
    detached_blocked = False
    with tempfile.TemporaryDirectory() as directory:
        detached_store = AuditEventStore(Path(directory) / "audit.sqlite")
        event = production_order_admission_candidate_to_audit_event(model_candidate)
        event["metadata"] = {**event["metadata"], "detached": True}
        detached_store.record(event)
        try:
            _stage9_production_admission_candidate(detached_store, model_candidate["candidateId"])
        except LookupError:
            detached_blocked = True

    class DeterministicRoute:
        calls = 0

        def observe(self, candidate_orders: list[dict[str, Any]], *, observed_at: datetime | None = None) -> dict[str, Any]:
            type(self).calls += 1
            return _deterministic_observation(
                candidate_orders, observed_at or datetime.now(timezone.utc)
            )

    class Handler(QuantApiHandler):
        audit_event_store = store
        stage6_sandbox_route_factory = staticmethod(lambda: sandbox_route)
        stage9_production_admission_route_factory = staticmethod(DeterministicRoute)

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    review_request = {
        "candidateId": "",
        "reviewer": "stage9-acceptance-reviewer",
        "outcome": "approved",
        "reason": "Docker acceptance reviewed the immutable read-only admission evidence.",
        "confirmations": {item: True for item in PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS},
    }
    with patch("quant_core.api._stage8_production_readonly_continuity", return_value=continuity) as continuity_patch:
        thread.start()
        connection = HTTPConnection(*server.server_address, timeout=10)
        try:
            candidate_status, candidate_payload = post(
                connection, "/api/execution/stage9/production-order-admission-candidates", candidate_request
            )
            duplicate_candidate_status, duplicate_candidate_payload = post(
                connection, "/api/execution/stage9/production-order-admission-candidates", candidate_request
            )
            candidate = candidate_payload["productionOrderAdmissionCandidate"]
            review_request["candidateId"] = candidate["candidateId"]
            review_status, review_payload = post(
                connection, "/api/execution/stage9/production-order-admission-reviews", review_request
            )
            duplicate_review_status, duplicate_review_payload = post(
                connection, "/api/execution/stage9/production-order-admission-reviews", review_request
            )
            review = review_payload["productionOrderAdmissionReview"]
            continuity_patch.return_value = revoked
            calls_before_revoke = DeterministicRoute.calls
            revoked_status, revoked_payload = post(
                connection, "/api/execution/stage9/production-order-admission-candidates", candidate_request
            )
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

    return {
        "baseRunId": workflow["baseRunId"],
        "candidate": candidate,
        "review": review,
        "noCredentialBlocker": no_credential_blocker,
        "noCredentialFactoryCalled": no_credential_factory_called,
        "noCredentialCandidateCount": no_credential_candidate_count,
        "noCredentialReviewCount": no_credential_review_count,
        "noCredentialArtifactCountsUnchanged": no_credential_artifact_counts_unchanged,
        "readyObservationPassed": ready_observation["passed"],
        "ruleDriftBlocked": not fault_observations["rule-drift"]["passed"],
        "staleQuoteBlocked": not fault_observations["stale-quote"]["passed"],
        "adversePriceBlocked": not fault_observations["adverse-price"]["passed"],
        "insufficientFundsBlocked": not fault_observations["insufficient-funds"]["passed"],
        "continuityDriftBlocked": drift_blocked,
        "expiredCandidateBlocked": expired_blocked,
        "revokeBlockedBeforeNetwork": revoked_status == 409
        and "current_continuity_required" in ";".join(revoked_payload.get("blockers", []))
        and DeterministicRoute.calls == calls_before_revoke,
        "duplicateCandidateExact": candidate_status == 201
        and duplicate_candidate_status == 200
        and duplicate_candidate_payload["productionOrderAdmissionCandidate"] == candidate,
        "duplicateReviewExact": review_status == 201
        and duplicate_review_status == 200
        and duplicate_review_payload["productionOrderAdmissionReview"] == review,
        "detachedAuthorityBlocked": detached_blocked,
    }


def _container_readback(base_run_id: str) -> dict[str, Any]:
    def get(path: str) -> tuple[int, dict[str, Any]]:
        try:
            with urlopen(f"http://127.0.0.1:8765{path}", timeout=30) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.loads(error.read())

    candidate_status, candidates = get(
        "/api/execution/stage9/production-order-admission-candidates?baseRunId=" + quote(base_run_id)
    )
    review_status, reviews = get(
        "/api/execution/stage9/production-order-admission-reviews?baseRunId=" + quote(base_run_id)
    )
    return {
        "status": candidate_status if candidate_status != 200 else review_status,
        "candidates": candidates.get("productionOrderAdmissionCandidates", []),
        "reviews": reviews.get("productionOrderAdmissionReviews", []),
    }


def _container_real_request(path: Path) -> dict[str, Any]:
    request = json.loads(path.read_text())
    if not isinstance(request, dict) or set(request) != {"authorizationId", "operator"}:
        raise ValueError("stage9 real acceptance request fields are invalid")

    import ccxt  # type: ignore

    store = AuditEventStore("data/audit_events.sqlite")
    sandbox_route = BinanceSpotTestnetRoute(env={})
    authorization = Stage6SandboxExecutionService(store, sandbox_route).get_authorization(
        request["authorizationId"]
    )
    called_methods: list[str] = []
    unexpected_methods: list[str] = []
    observations: list[dict[str, Any]] = []

    class GuardedExchange:
        def __init__(self, exchange: Any) -> None:
            self.exchange = exchange

        def __getattr__(self, name: str) -> Any:
            value = getattr(self.exchange, name)
            if not callable(value):
                return value

            def guarded(*args: Any, **kwargs: Any) -> Any:
                called_methods.append(name)
                if name not in REAL_READONLY_METHODS:
                    unexpected_methods.append(name)
                    raise RuntimeError(f"stage9_production_mutation_method_blocked:{name}")
                return value(*args, **kwargs)

            return guarded

    class GuardedRoute:
        def observe(
            self, orders: list[dict[str, Any]], *, observed_at: datetime | None = None
        ) -> dict[str, Any]:
            observation = BinanceSpotProductionAdmissionRoute(
                env=dict(os.environ),
                exchange_factory=lambda _exchange_id, config: GuardedExchange(ccxt.binance(config)),
            ).observe(orders, observed_at=observed_at)
            observations.append(observation)
            return observation

    class Handler(QuantApiHandler):
        audit_event_store = store
        stage6_sandbox_route_factory = staticmethod(lambda: sandbox_route)
        stage9_production_admission_route_factory = staticmethod(GuardedRoute)

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    connection = HTTPConnection(*server.server_address, timeout=90)
    try:
        connection.request(
            "POST", "/api/execution/stage9/production-order-admission-candidates",
            json.dumps(request), {"Content-Type": "application/json"},
        )
        response = connection.getresponse()
        status, payload = response.status, json.loads(response.read())
    finally:
        connection.close()
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()

    observation = observations[-1] if observations else {}
    candidate = payload.get("productionOrderAdmissionCandidate")
    blockers = payload.get("blockers")
    return {
        "status": status,
        "baseRunId": authorization["baseRunId"],
        "authorizationId": request["authorizationId"],
        "candidateId": candidate.get("candidateId", "") if isinstance(candidate, dict) else "",
        "candidateHash": candidate.get("candidateHash", "") if isinstance(candidate, dict) else "",
        "blockers": blockers if isinstance(blockers, list) else [],
        "observationPassed": observation.get("passed"),
        "observationBlockedReasons": observation.get("blockedReasons", []),
        "readOnlyMethodsCalled": called_methods,
        "unexpectedMethodsCalled": unexpected_methods,
        "candidateBoundarySafe": bool(
            isinstance(candidate, dict)
            and candidate.get("productionReadOnly") is True
            and candidate.get("orderSubmissionEnabled") is False
            and candidate.get("orderRoutingEnabled") is False
            and candidate.get("liveOrderSubmitted") is False
            and candidate.get("liveRouteExecuted") is False
            and candidate.get("liveBlockedBoundary") is True
        ),
        "redacted": not any(
            marker in json.dumps(payload).lower()
            for marker in ('"free"', '"balance"', '"assets"', '"apikey"', '"secret"', '"info"')
        ),
    }


def _real_manifest(exercise: dict[str, Any], readback: dict[str, Any]) -> dict[str, Any]:
    blockers = (
        exercise.get("observationBlockedReasons")
        if isinstance(exercise.get("observationBlockedReasons"), list) else []
    )
    called_methods = (
        exercise.get("readOnlyMethodsCalled")
        if isinstance(exercise.get("readOnlyMethodsCalled"), list) else []
    )
    unexpected_methods = (
        exercise.get("unexpectedMethodsCalled")
        if isinstance(exercise.get("unexpectedMethodsCalled"), list) else []
    )
    ready = (
        exercise.get("observationPassed") is True
        and exercise.get("status") in {200, 201}
        and exercise.get("candidateBoundarySafe") is True
    )
    funding_blocked = (
        exercise.get("observationPassed") is False
        and exercise.get("status") == 409
        and bool(blockers)
        and exercise.get("blockers") == [";".join(blockers)]
        and all(
            isinstance(blocker, str) and blocker.startswith("production_funding_check_blocked:")
            for blocker in blockers
        )
    )
    candidates = readback.get("candidates") if isinstance(readback.get("candidates"), list) else []
    restored = next((
        row for row in candidates
        if isinstance(row, dict) and row.get("sandboxAuthorizationId") == exercise.get("authorizationId")
    ), {})
    restart_consistent = (
        readback.get("status") == 200
        and (
            restored.get("candidateHash") == exercise.get("candidateHash")
            if ready else not restored
        )
    )
    guarded_observation_complete = REAL_REQUIRED_METHODS.issubset(called_methods)
    mutation_blocked = (
        not unexpected_methods
        and set(called_methods) <= REAL_READONLY_METHODS
    )
    ready = ready and guarded_observation_complete
    funding_blocked = funding_blocked and guarded_observation_complete
    checks = [
        {"id": "real-readonly-ready-or-funding-blocked", "passed": ready or funding_blocked},
        {"id": "real-evidence-redacted", "passed": exercise.get("redacted") is True},
        {"id": "production-mutation-disabled", "passed": mutation_blocked},
        {"id": "api-restart-readback", "passed": restart_consistent},
    ]
    value = {
        "kind": "aiqt.stage9ProductionOrderAdmissionRealReadonlyAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted" if all(row["passed"] for row in checks) else "blocked",
        "checks": checks,
        "outcome": "ready" if ready else "funding_blocked" if funding_blocked else "blocked",
        "authorizationId": str(exercise.get("authorizationId") or ""),
        "candidateId": str(exercise.get("candidateId") or ""),
        "candidateHash": str(exercise.get("candidateHash") or ""),
        "restartCandidateHash": str(restored.get("candidateHash") or ""),
        "blockedReasons": blockers,
        "readOnlyMethodsCalled": called_methods,
        "productionMutationReached": bool(unexpected_methods),
        **BOUNDARY,
    }
    value["manifestHash"] = _hash(value)
    return value


def _validate_real(value: Any) -> str:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "outcome", "authorizationId",
        "candidateId", "candidateHash", "restartCandidateHash", "blockedReasons", "readOnlyMethodsCalled",
        "productionMutationReached", "manifestHash", *BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage9 real production admission acceptance fields are invalid")
    if value["kind"] != "aiqt.stage9ProductionOrderAdmissionRealReadonlyAcceptance" or value["schemaVersion"] != 1:
        raise ValueError("stage9 real production admission acceptance schema is invalid")
    generated = datetime.fromisoformat(value["generatedAt"])
    if generated.tzinfo is None or generated.utcoffset() is None or value["status"] != "accepted":
        raise ValueError("stage9 real production admission acceptance status is invalid")
    if (
        not isinstance(value["checks"], list)
        or {row.get("id") for row in value["checks"] if isinstance(row, dict)} != {
            "real-readonly-ready-or-funding-blocked", "real-evidence-redacted",
            "production-mutation-disabled", "api-restart-readback"
        }
        or any(not isinstance(row, dict) or set(row) != {"id", "passed"} or row["passed"] is not True for row in value["checks"])
    ):
        raise ValueError("stage9 real production admission acceptance check failed")
    if not value["authorizationId"] or value["outcome"] not in {"ready", "funding_blocked"}:
        raise ValueError("stage9 real production admission acceptance outcome is invalid")
    if value["outcome"] == "ready" and (
        not value["candidateId"] or not _is_hash(value["candidateHash"])
        or value["restartCandidateHash"] != value["candidateHash"]
    ):
        raise ValueError("stage9 real production admission acceptance candidate is invalid")
    if value["outcome"] == "funding_blocked" and (
        value["candidateId"] or value["candidateHash"] or value["restartCandidateHash"]
        or not value["blockedReasons"]
        or any(
            not isinstance(reason, str) or not reason.startswith("production_funding_check_blocked:")
            for reason in value["blockedReasons"]
        )
    ):
        raise ValueError("stage9 real production admission acceptance funding block is invalid")
    if (
        not isinstance(value["readOnlyMethodsCalled"], list)
        or not REAL_REQUIRED_METHODS.issubset(value["readOnlyMethodsCalled"])
        or not set(value["readOnlyMethodsCalled"]) <= REAL_READONLY_METHODS
    ):
        raise ValueError("stage9 real production admission acceptance read-only calls are invalid")
    if value["productionMutationReached"] is not False:
        raise ValueError("stage9 real production admission acceptance mutation boundary is invalid")
    for field, expected in BOUNDARY.items():
        if value[field] is not expected:
            raise ValueError(f"stage9 real production admission acceptance {field} is immutable")
    if value["manifestHash"] != _hash({key: item for key, item in value.items() if key != "manifestHash"}):
        raise ValueError("stage9 real production admission acceptance manifest hash is invalid")
    return f"stage9 production-admission real-readonly=accepted outcome={value['outcome']} liveBlocked=true"


def _manifest(exercise: dict[str, Any], readback: dict[str, Any]) -> dict[str, Any]:
    candidate = exercise.get("candidate") if isinstance(exercise.get("candidate"), dict) else {}
    review = exercise.get("review") if isinstance(exercise.get("review"), dict) else {}
    candidates = readback.get("candidates") if isinstance(readback.get("candidates"), list) else []
    reviews = readback.get("reviews") if isinstance(readback.get("reviews"), list) else []
    restored_candidate = next((row for row in candidates if row.get("candidateId") == candidate.get("candidateId")), {})
    restored_review = next((row for row in reviews if row.get("reviewId") == review.get("reviewId")), {})
    source_hashes = {
        "workflowHash": candidate.get("workflowHash", ""),
        "sandboxAuthorizationHash": candidate.get("sandboxAuthorizationHash", ""),
        "stage8ContinuityHash": candidate.get("stage8ContinuityHash", ""),
        "ordersHash": candidate.get("ordersHash", ""),
        "candidateHash": candidate.get("candidateHash", ""),
        "reviewHash": review.get("reviewHash", ""),
    }
    checks = [
        {"id": "deterministic-ready-observation", "passed": exercise.get("readyObservationPassed") is True and len(candidate.get("orders", [])) == 2},
        {"id": "immutable-review-non-effective", "passed": review.get("outcome") == "approved" and review.get("authorizationEffective") is False},
        {"id": "dedicated-credential-fail-closed-before-network", "passed": exercise.get("noCredentialBlocker") == "stage9_production_readonly_credentials_required" and exercise.get("noCredentialFactoryCalled") is False},
        {"id": "no-credential-zero-stage9-artifacts", "passed": exercise.get("noCredentialCandidateCount") == 0 and exercise.get("noCredentialReviewCount") == 0 and exercise.get("noCredentialArtifactCountsUnchanged") is True},
        {"id": "production-rule-drift-blocked", "passed": exercise.get("ruleDriftBlocked") is True},
        {"id": "stale-quote-blocked", "passed": exercise.get("staleQuoteBlocked") is True},
        {"id": "adverse-price-blocked", "passed": exercise.get("adversePriceBlocked") is True},
        {"id": "insufficient-funds-blocked", "passed": exercise.get("insufficientFundsBlocked") is True},
        {"id": "continuity-drift-blocked", "passed": exercise.get("continuityDriftBlocked") is True},
        {"id": "expired-candidate-blocked", "passed": exercise.get("expiredCandidateBlocked") is True},
        {"id": "stage8-revoke-blocked-before-network", "passed": exercise.get("revokeBlockedBeforeNetwork") is True},
        {"id": "duplicate-candidate-readback-exact", "passed": exercise.get("duplicateCandidateExact") is True},
        {"id": "duplicate-review-readback-exact", "passed": exercise.get("duplicateReviewExact") is True},
        {"id": "detached-authority-blocked", "passed": exercise.get("detachedAuthorityBlocked") is True},
        {"id": "source-hashes-bound", "passed": all(_is_hash(item) for item in source_hashes.values())},
        {"id": "api-restart-readback", "passed": readback.get("status") == 200 and restored_candidate.get("candidateHash") == candidate.get("candidateHash") and restored_review.get("reviewHash") == review.get("reviewHash")},
        {"id": "production-order-route-disabled", "passed": candidate.get("orderSubmissionEnabled") is False and review.get("orderSubmissionEnabled") is False and candidate.get("liveRouteExecuted") is False and review.get("liveRouteExecuted") is False},
    ]
    value = {
        "kind": "aiqt.stage9ProductionOrderAdmissionAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted" if all(row["passed"] for row in checks) else "blocked",
        "checks": checks,
        "candidateId": candidate.get("candidateId", ""),
        "candidateHash": candidate.get("candidateHash", ""),
        "reviewId": review.get("reviewId", ""),
        "reviewHash": review.get("reviewHash", ""),
        "restartCandidateHash": restored_candidate.get("candidateHash", ""),
        "restartReviewHash": restored_review.get("reviewHash", ""),
        "orderCount": len(candidate.get("orders", [])),
        "noCredentialCandidateCount": exercise.get("noCredentialCandidateCount", -1),
        "noCredentialReviewCount": exercise.get("noCredentialReviewCount", -1),
        "sourceHashes": source_hashes,
        "productionNetworkReached": False,
        **BOUNDARY,
    }
    value["manifestHash"] = _hash(value)
    return value


def validate(value: Any) -> str:
    if isinstance(value, dict) and value.get("kind") == "aiqt.stage9ProductionOrderAdmissionRealReadonlyAcceptance":
        return _validate_real(value)
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "candidateId", "candidateHash",
        "reviewId", "reviewHash", "restartCandidateHash", "restartReviewHash", "orderCount",
        "noCredentialCandidateCount", "noCredentialReviewCount", "sourceHashes",
        "productionNetworkReached", "manifestHash", *BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage9 production admission acceptance fields are invalid")
    if value["kind"] != "aiqt.stage9ProductionOrderAdmissionAcceptance" or value["schemaVersion"] != 1:
        raise ValueError("stage9 production admission acceptance schema is invalid")
    generated = datetime.fromisoformat(value["generatedAt"])
    if generated.tzinfo is None or generated.utcoffset() is None or value["status"] != "accepted":
        raise ValueError("stage9 production admission acceptance status is invalid")
    expected_checks = {
        "deterministic-ready-observation", "immutable-review-non-effective",
        "dedicated-credential-fail-closed-before-network", "no-credential-zero-stage9-artifacts",
        "production-rule-drift-blocked", "stale-quote-blocked", "adverse-price-blocked",
        "insufficient-funds-blocked", "continuity-drift-blocked", "expired-candidate-blocked",
        "stage8-revoke-blocked-before-network", "duplicate-candidate-readback-exact",
        "duplicate-review-readback-exact", "detached-authority-blocked", "source-hashes-bound",
        "api-restart-readback", "production-order-route-disabled",
    }
    if not isinstance(value["checks"], list) or {row.get("id") for row in value["checks"] if isinstance(row, dict)} != expected_checks or any(
        not isinstance(row, dict) or set(row) != {"id", "passed"} or row["passed"] is not True
        for row in value["checks"]
    ):
        raise ValueError("stage9 production admission acceptance check failed")
    if not value["candidateId"] or not value["reviewId"] or value["orderCount"] != 2:
        raise ValueError("stage9 production admission acceptance identity is invalid")
    if value["noCredentialCandidateCount"] != 0 or value["noCredentialReviewCount"] != 0:
        raise ValueError("stage9 production admission no-credential artifacts are invalid")
    source_hashes = value["sourceHashes"]
    if (
        not isinstance(source_hashes, dict)
        or set(source_hashes) != {
            "workflowHash", "sandboxAuthorizationHash", "stage8ContinuityHash",
            "ordersHash", "candidateHash", "reviewHash",
        }
        or any(not _is_hash(item) for item in source_hashes.values())
        or source_hashes["candidateHash"] != value["candidateHash"]
        or source_hashes["reviewHash"] != value["reviewHash"]
    ):
        raise ValueError("stage9 production admission acceptance source hashes are invalid")
    if not all(_is_hash(value[field]) for field in (
        "candidateHash", "reviewHash", "restartCandidateHash", "restartReviewHash"
    )) or value["candidateHash"] != value["restartCandidateHash"] or value["reviewHash"] != value["restartReviewHash"]:
        raise ValueError("stage9 production admission acceptance restart readback is invalid")
    if value["productionNetworkReached"] is not False:
        raise ValueError("stage9 production admission acceptance network boundary is invalid")
    for field, expected in BOUNDARY.items():
        if value[field] is not expected:
            raise ValueError(f"stage9 production admission acceptance {field} is immutable")
    if value["manifestHash"] != _hash({key: item for key, item in value.items() if key != "manifestHash"}):
        raise ValueError("stage9 production admission acceptance manifest hash is invalid")
    return "stage9 production-admission=accepted orders=2 restartExact=true liveBlocked=true"


def _orchestrate(repo: Path, report: Path, real_request: Path | None, *, build: bool) -> dict[str, Any]:
    env = dict(os.environ)
    if real_request:
        env["INSTALL_DATA_DEPS"] = "true"
    else:
        env["COMPOSE_PROJECT_NAME"] = "stage9-production-admission"
        env["CCXT_PRODUCTION_READONLY_API_KEY"] = ""
        env["CCXT_PRODUCTION_READONLY_SECRET"] = ""
    try:
        _run(["docker", "compose", "up", "-d", *(["--build"] if build else []), "api"], repo, env)
        _wait_for_api(repo, env)
        if real_request:
            _run(["docker", "compose", "cp", str(real_request), "api:/tmp/stage9-real-request.json"], repo, env)
            output = _run([
                "docker", "compose", "exec", "-T", "api", "python",
                "tools/stage9_production_admission_acceptance.py", "--container-real-request",
                "/tmp/stage9-real-request.json",
            ], repo, env)
            exercise = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
            _run(["docker", "compose", "restart", "api"], repo, env)
            _wait_for_api(repo, env)
            output = _run([
                "docker", "compose", "exec", "-T", "api", "python",
                "tools/stage9_production_admission_acceptance.py", "--container-readback", exercise["baseRunId"],
            ], repo, env)
            readback = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
            manifest = _real_manifest(exercise, readback)
            report.parent.mkdir(parents=True, exist_ok=True)
            report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
            validate(manifest)
            return manifest
        output = _run([
            "docker", "compose", "exec", "-T", "api", "python",
            "tools/stage9_production_admission_acceptance.py", "--container-exercise",
        ], repo, env)
        exercise = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        _run(["docker", "compose", "restart", "api"], repo, env)
        _wait_for_api(repo, env)
        output = _run([
            "docker", "compose", "exec", "-T", "api", "python",
            "tools/stage9_production_admission_acceptance.py", "--container-readback", exercise["baseRunId"],
        ], repo, env)
        readback = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        manifest = _manifest(exercise, readback)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        validate(manifest)
        return manifest
    finally:
        if not real_request:
            _run(["docker", "compose", "down", "-v"], repo, env)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, default=Path("data/stage9-production-admission.json"))
    parser.add_argument("--validate", type=Path)
    parser.add_argument("--real-request", type=Path)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--container-exercise", action="store_true")
    parser.add_argument("--container-readback")
    parser.add_argument("--container-real-request", type=Path)
    args = parser.parse_args()
    if args.validate:
        value = validate(json.loads(args.validate.read_text()))
    elif args.container_exercise:
        value = _container_exercise()
    elif args.container_readback:
        value = _container_readback(args.container_readback)
    elif args.container_real_request:
        value = _container_real_request(args.container_real_request)
    else:
        value = _orchestrate(
            Path(__file__).resolve().parents[1], args.report, args.real_request, build=not args.no_build
        )
    print(value if isinstance(value, str) else json.dumps(value, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
