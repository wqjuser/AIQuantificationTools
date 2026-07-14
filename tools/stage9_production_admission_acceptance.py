from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import sys
import tempfile
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "quant_core"))

from quant_core.api import _stage9_production_admission_candidate
from quant_core.audit_events import AuditEventStore
from quant_core.stage6_sandbox import (
    BinanceSpotTestnetRoute,
    authorization_to_audit_event,
    build_stage6_sandbox_batch_authorization,
)
from quant_core.stage9_production_admission import (
    BinanceSpotProductionAdmissionRoute,
    build_production_order_admission_candidate,
    build_production_order_admission_review,
    production_order_admission_candidate_to_audit_event,
    production_order_admission_review_to_audit_event,
)
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
    batch = {
        "authorizationId": authorization["authorizationId"],
        "baseRunId": authorization["baseRunId"],
        "batchId": authorization["batchId"],
        "status": "reconciled",
        "orders": [{**order, "state": "canceled"} for order in orders],
    }
    continuity = _current_continuity(now)

    no_credential_blocker = ""
    try:
        BinanceSpotProductionAdmissionRoute(env={}).observe(orders, observed_at=now)
    except ValueError as error:
        no_credential_blocker = str(error)

    candidate = build_production_order_admission_candidate(
        workflow, authorization, batch, continuity, _passing_observation(orders, now),
        operator="stage9-acceptance", generated_at=now.isoformat(),
    )
    reviewed_at = now + timedelta(minutes=1)
    review = build_production_order_admission_review(
        candidate, continuity, _passing_observation(orders, reviewed_at),
        reviewer="stage9-acceptance-reviewer", outcome="approved",
        reason="Docker acceptance reviewed the immutable read-only admission evidence.",
        confirmations={item: True for item in (
            "candidate-hash-reviewed", "production-envelope-reviewed",
            "market-and-funding-checks-reviewed", "stage8-continuity-current",
            "no-production-execution-authority",
        )},
        reviewed_at=reviewed_at.isoformat(),
    )

    drift_blocked = False
    try:
        drift_time = now + timedelta(seconds=2)
        build_production_order_admission_review(
            candidate, _current_continuity(drift_time), _passing_observation(orders, drift_time),
            reviewer="stage9-acceptance-reviewer", outcome="approved", reason="drift drill",
            confirmations={item: True for item in review["confirmedScopeIds"]},
            reviewed_at=drift_time.isoformat(),
        )
    except ValueError as error:
        drift_blocked = "continuity" in str(error)

    expired_blocked = False
    try:
        expired_at = now + timedelta(minutes=11)
        build_production_order_admission_review(
            candidate, continuity, _passing_observation(orders, expired_at),
            reviewer="stage9-acceptance-reviewer", outcome="approved", reason="expiry drill",
            confirmations={item: True for item in review["confirmedScopeIds"]},
            reviewed_at=expired_at.isoformat(),
        )
    except ValueError as error:
        expired_blocked = "expired" in str(error)

    detached_blocked = False
    with tempfile.TemporaryDirectory() as directory:
        detached_store = AuditEventStore(Path(directory) / "audit.sqlite")
        event = production_order_admission_candidate_to_audit_event(candidate)
        event["metadata"] = {**event["metadata"], "detached": True}
        detached_store.record(event)
        try:
            _stage9_production_admission_candidate(detached_store, candidate["candidateId"])
        except LookupError:
            detached_blocked = True

    store = AuditEventStore("data/audit_events.sqlite")
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
    store.record(authorization_to_audit_event(authorization))
    store.record(production_order_admission_candidate_to_audit_event(candidate))
    store.record(production_order_admission_review_to_audit_event(review))
    return {
        "baseRunId": workflow["baseRunId"],
        "candidate": candidate,
        "review": review,
        "noCredentialBlocker": no_credential_blocker,
        "continuityDriftBlocked": drift_blocked,
        "expiredCandidateBlocked": expired_blocked,
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


def _manifest(exercise: dict[str, Any], readback: dict[str, Any]) -> dict[str, Any]:
    candidate = exercise.get("candidate") if isinstance(exercise.get("candidate"), dict) else {}
    review = exercise.get("review") if isinstance(exercise.get("review"), dict) else {}
    candidates = readback.get("candidates") if isinstance(readback.get("candidates"), list) else []
    reviews = readback.get("reviews") if isinstance(readback.get("reviews"), list) else []
    restored_candidate = next((row for row in candidates if row.get("candidateId") == candidate.get("candidateId")), {})
    restored_review = next((row for row in reviews if row.get("reviewId") == review.get("reviewId")), {})
    checks = [
        {"id": "two-order-candidate-prepared", "passed": len(candidate.get("orders", [])) == 2},
        {"id": "immutable-review-non-effective", "passed": review.get("outcome") == "approved" and review.get("authorizationEffective") is False},
        {"id": "no-credential-fail-closed", "passed": exercise.get("noCredentialBlocker") == "stage9_production_readonly_credentials_required"},
        {"id": "continuity-drift-blocked", "passed": exercise.get("continuityDriftBlocked") is True},
        {"id": "expired-candidate-blocked", "passed": exercise.get("expiredCandidateBlocked") is True},
        {"id": "detached-authority-blocked", "passed": exercise.get("detachedAuthorityBlocked") is True},
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
        "productionNetworkReached": False,
        **BOUNDARY,
    }
    value["manifestHash"] = _hash(value)
    return value


def validate(value: Any) -> str:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "candidateId", "candidateHash",
        "reviewId", "reviewHash", "restartCandidateHash", "restartReviewHash", "orderCount",
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
        "two-order-candidate-prepared", "immutable-review-non-effective", "no-credential-fail-closed",
        "continuity-drift-blocked", "expired-candidate-blocked", "detached-authority-blocked",
        "api-restart-readback", "production-order-route-disabled",
    }
    if not isinstance(value["checks"], list) or {row.get("id") for row in value["checks"] if isinstance(row, dict)} != expected_checks or any(
        not isinstance(row, dict) or set(row) != {"id", "passed"} or row["passed"] is not True
        for row in value["checks"]
    ):
        raise ValueError("stage9 production admission acceptance check failed")
    if not value["candidateId"] or not value["reviewId"] or value["orderCount"] != 2:
        raise ValueError("stage9 production admission acceptance identity is invalid")
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


def _orchestrate(repo: Path, report: Path, *, build: bool) -> dict[str, Any]:
    env = dict(os.environ)
    env["COMPOSE_PROJECT_NAME"] = "stage9-production-admission"
    try:
        _run(["docker", "compose", "up", "-d", *(["--build"] if build else []), "api"], repo, env)
        _wait_for_api(repo, env)
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
        validate(manifest)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        return manifest
    finally:
        _run(["docker", "compose", "down", "-v"], repo, env)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, default=Path("data/stage9-production-admission.json"))
    parser.add_argument("--validate", type=Path)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--container-exercise", action="store_true")
    parser.add_argument("--container-readback")
    args = parser.parse_args()
    if args.validate:
        value = validate(json.loads(args.validate.read_text()))
    elif args.container_exercise:
        value = _container_exercise()
    elif args.container_readback:
        value = _container_readback(args.container_readback)
    else:
        value = _orchestrate(Path(__file__).resolve().parents[1], args.report, build=not args.no_build)
    print(value if isinstance(value, str) else json.dumps(value, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
