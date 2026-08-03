from __future__ import annotations

from .stage5 import _required_stage4_string
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from pathlib import Path
from quant_core.audit_events import AuditEventStore
from quant_core.domain import DataQuality
from quant_core.execution import execution_adapter_production_route_review_payload_from_audit_event
from quant_core.execution_adapter_health import production_readonly_probe_from_audit_event
from quant_core.stage10_production_execution import (
    PRODUCTION_EXECUTION_CONFIRMATION_IDS,
    build_production_execution_attempt,
    build_production_execution_authorization,
    production_execution_attempt_from_audit_event,
    production_execution_authorization_from_audit_event,
)
from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot
from quant_core.stage6_exit import load_stage6_exit_acceptance_status
from quant_core.stage6_sandbox import validate_stage6_sandbox_batch_authorization
from quant_core.stage8_continuity import (
    build_production_readonly_continuity,
    production_readonly_access_control_from_audit_event,
)
from quant_core.stage9_production_admission import (
    production_order_admission_candidate_from_audit_event,
    production_order_admission_review_from_audit_event,
)
from urllib.parse import parse_qs

def _adapter_error_target(market: str, *, source: str | None) -> tuple[str, str] | None:
    normalized_source = str(source or "").casefold()
    if market == "ashare" and normalized_source.startswith("akshare"):
        return "akshare-ohlcv", "akshare"
    if market == "us" and normalized_source.startswith("yfinance"):
        return "yfinance-ohlcv", "yfinance"
    if market == "crypto" and normalized_source.startswith("ccxt"):
        return "ccxt-ohlcv", "ccxt"
    return None


def _stage6_event_snapshot(
    store: AuditEventStore,
    event_id: object,
    event_type: str,
    validator,
) -> dict[str, object]:
    normalized_id = _required_stage4_string(event_id)
    event = store.get(normalized_id)
    if event is None or event.event_type != event_type:
        raise LookupError(f"{event_type} source evidence was not found")
    snapshot = validator(event.metadata.get("snapshot"))
    if event.event_id != normalized_id or snapshot.get("baseRunId") != event.run_id:
        raise ValueError(f"{event_type} audit binding does not match")
    return snapshot


def _stage7_production_route_review_is_current(value: dict[str, object]) -> bool:
    try:
        recorded_at = datetime.fromisoformat(str(value.get("recordedAt") or ""))
    except ValueError:
        return False
    if recorded_at.tzinfo is None or recorded_at.utcoffset() is None:
        return False
    age = datetime.now(timezone.utc) - recorded_at.astimezone(timezone.utc)
    return (
        value.get("status") == "route_review_recorded"
        and value.get("adapterId") == "ccxt-live"
        and value.get("market") == "crypto"
        and value.get("route") == "live"
        and bool(str(value.get("maintenanceWindowId") or "").strip())
        and timedelta(0) <= age <= timedelta(hours=24)
    )


def _latest_stage8_production_readonly_access_control(
    audit_event_store: AuditEventStore,
) -> dict[str, object] | None:
    events = audit_event_store.list_recent(
        event_type="stage8_production_readonly_access_control", limit=1
    )
    if not events:
        return None
    control = production_readonly_access_control_from_audit_event(events[0])
    if control is None:
        raise ValueError("stage8_production_readonly_access_control_invalid")
    return control


def _stage8_production_readonly_continuity(
    audit_event_store: AuditEventStore,
    stage6_exit_acceptance_report_path: Path,
) -> dict[str, object]:
    control = _latest_stage8_production_readonly_access_control(audit_event_store)
    probe_events = audit_event_store.list_recent(
        event_type="stage7_production_readonly_probe", limit=1
    )
    probe = None
    if probe_events:
        probe = production_readonly_probe_from_audit_event(probe_events[0])
        if probe is None:
            raise ValueError("stage7_production_readonly_evidence_invalid")
    stage6_status = load_stage6_exit_acceptance_status(stage6_exit_acceptance_report_path)
    stage6_hash_matches = bool(
        probe
        and stage6_status["status"] == "accepted"
        and stage6_status["exitHash"] == probe["stage6ExitHash"]
    )
    route_review = None
    if probe:
        review_event = audit_event_store.get(probe["productionRouteReviewId"])
        route_review = (
            execution_adapter_production_route_review_payload_from_audit_event(review_event)
            if review_event else None
        )
    route_review_recorded_at = route_review.get("recordedAt") if route_review else None
    return build_production_readonly_continuity(
        latest_probe=probe,
        access_control=control,
        stage6_hash_matches=stage6_hash_matches,
        route_review_current=bool(route_review and _stage7_production_route_review_is_current(route_review)),
        route_review_recorded_at=(
            route_review_recorded_at.strip()
            if isinstance(route_review_recorded_at, str) and route_review_recorded_at.strip()
            else None
        ),
    )


def _stage9_production_admission_candidates(
    audit_event_store: AuditEventStore,
    base_run_id: str,
    *,
    limit: int | None,
) -> list[dict[str, object]]:
    candidates = []
    events = (
        audit_event_store.list_recent(
            run_id=base_run_id,
            event_type="stage9_production_order_admission_candidate",
            limit=limit,
        )
        if limit is not None
        else [
            event for event in audit_event_store.list_all_by_run(base_run_id)
            if event.event_type == "stage9_production_order_admission_candidate"
        ]
    )
    for event in events:
        if event.metadata.get("detached") is True:
            continue
        candidate = production_order_admission_candidate_from_audit_event(event)
        if (
            candidate is None
            or candidate["candidateId"] != event.event_id
            or candidate["baseRunId"] != event.run_id
            or datetime.fromisoformat(candidate["generatedAt"]) != event.created_at
            or event.stage != "stage9-production-order-admission"
            or event.source != candidate["operator"]
        ):
            raise ValueError("stage9_production_admission_candidate_audit_binding_invalid")
        _validate_stage9_production_admission_candidate_authority(audit_event_store, candidate)
        candidates.append(candidate)
    return candidates


def _stage9_production_admission_candidate(
    audit_event_store: AuditEventStore,
    candidate_id: str,
) -> dict[str, object]:
    event = audit_event_store.get(candidate_id)
    if event is None or event.metadata.get("detached") is True:
        raise LookupError("stage9 production admission candidate was not found")
    candidate = production_order_admission_candidate_from_audit_event(event)
    if (
        candidate is None
        or candidate["candidateId"] != event.event_id
        or candidate["baseRunId"] != event.run_id
        or datetime.fromisoformat(candidate["generatedAt"]) != event.created_at
        or event.stage != "stage9-production-order-admission"
        or event.source != candidate["operator"]
    ):
        raise ValueError("stage9_production_admission_candidate_audit_binding_invalid")
    _validate_stage9_production_admission_candidate_authority(audit_event_store, candidate)
    return candidate


def _validate_stage9_production_admission_candidate_authority(
    audit_event_store: AuditEventStore,
    candidate: dict[str, object],
) -> None:
    authorization_event = audit_event_store.get(str(candidate["sandboxAuthorizationId"]))
    if (
        authorization_event is None
        or authorization_event.event_type != "stage6_sandbox_batch_authorization"
        or authorization_event.metadata.get("detached") is True
    ):
        raise ValueError("stage9_production_admission_candidate_authorization_missing")
    authorization = validate_stage6_sandbox_batch_authorization(
        authorization_event.metadata.get("snapshot")
    )
    workflow_event = audit_event_store.get(str(candidate["workflowId"]))
    if (
        workflow_event is None
        or workflow_event.event_type != "stage4_portfolio_workflow"
        or workflow_event.metadata.get("detached") is True
    ):
        raise ValueError("stage9_production_admission_candidate_workflow_missing")
    workflow = validate_stage4_portfolio_workflow_snapshot(
        workflow_event.metadata.get("snapshot")
    )
    if (
        authorization["authorizationId"] != authorization_event.event_id
        or authorization["authorizationHash"] != candidate["sandboxAuthorizationHash"]
        or authorization["baseRunId"] != candidate["baseRunId"]
        or authorization["workflowId"] != candidate["workflowId"]
        or authorization["workflowHash"] != candidate["workflowHash"]
        or authorization["batchId"] != candidate["batchId"]
        or authorization["orders"] != candidate["orders"]
        or authorization["ordersHash"] != candidate["ordersHash"]
        or workflow["workflowId"] != workflow_event.event_id
        or workflow["baseRunId"] != candidate["baseRunId"]
        or workflow["workflowHash"] != candidate["workflowHash"]
    ):
        raise ValueError("stage9_production_admission_candidate_authority_invalid")


def _stage9_production_admission_reviews(
    audit_event_store: AuditEventStore,
    base_run_id: str,
    *,
    limit: int | None,
) -> list[dict[str, object]]:
    reviews = []
    events = (
        audit_event_store.list_recent(
            run_id=base_run_id,
            event_type="stage9_production_order_admission_review",
            limit=limit,
        )
        if limit is not None
        else [
            event for event in audit_event_store.list_all_by_run(base_run_id)
            if event.event_type == "stage9_production_order_admission_review"
        ]
    )
    for event in events:
        if event.metadata.get("detached") is True:
            continue
        review = production_order_admission_review_from_audit_event(event)
        if (
            review is None
            or review["reviewId"] != event.event_id
            or review["baseRunId"] != event.run_id
            or datetime.fromisoformat(review["reviewedAt"]) != event.created_at
            or event.stage != "stage9-production-order-admission-review"
            or event.source != review["reviewer"]
        ):
            raise ValueError("stage9_production_admission_review_audit_binding_invalid")
        candidate = _stage9_production_admission_candidate(
            audit_event_store, review["candidateId"]
        )
        if (
            review["candidateHash"] != candidate["candidateHash"]
            or review["sandboxAuthorizationId"] != candidate["sandboxAuthorizationId"]
            or review["stage8ContinuityHash"] != candidate["stage8ContinuityHash"]
            or any(
                [row["orderId"] for row in review["reviewObservation"][field]]
                != [row["orderId"] for row in candidate["orders"]]
                for field in ("marketChecks", "priceChecks", "fundingChecks")
            )
            or not datetime.fromisoformat(candidate["generatedAt"])
            <= datetime.fromisoformat(review["reviewObservation"]["observedAt"])
            <= datetime.fromisoformat(review["reviewedAt"])
            <= datetime.fromisoformat(candidate["expiresAt"])
        ):
            raise ValueError("stage9_production_admission_review_authority_invalid")
        reviews.append(review)
    return reviews


def _stage10_execution_query(query_string: str) -> tuple[str, int]:
    query = parse_qs(query_string, keep_blank_values=True)
    if set(query) - {"baseRunId", "limit"} or len(query.get("baseRunId", [])) != 1:
        raise ValueError("invalid_stage10_production_execution_query")
    base_run_id = query["baseRunId"][0].strip()
    raw_limit = query.get("limit", ["20"])
    if not base_run_id or len(raw_limit) != 1 or not raw_limit[0].isdigit():
        raise ValueError("invalid_stage10_production_execution_query")
    limit = int(raw_limit[0])
    if not 1 <= limit <= 50:
        raise ValueError("invalid_stage10_production_execution_query")
    return base_run_id, limit


def _stage10_production_execution_authorizations(
    audit_event_store: AuditEventStore,
    base_run_id: str,
    *,
    limit: int | None,
) -> list[dict[str, object]]:
    events = (
        audit_event_store.list_recent(
            run_id=base_run_id,
            event_type="stage10_production_execution_authorization",
            limit=limit,
        )
        if limit is not None
        else [
            event
            for event in audit_event_store.list_all_by_run(base_run_id)
            if event.event_type == "stage10_production_execution_authorization"
        ]
    )
    return [
        _stage10_production_execution_authorization(
            audit_event_store, event.event_id, expected_run_id=base_run_id
        )
        for event in events
        if event.metadata.get("detached") is not True
    ]


def _stage10_production_execution_authorization(
    audit_event_store: AuditEventStore,
    authorization_id: str,
    *,
    expected_run_id: str | None = None,
) -> dict[str, object]:
    event = audit_event_store.get(authorization_id)
    authorization = (
        production_execution_authorization_from_audit_event(event) if event else None
    )
    if event is None or authorization is None or event.metadata.get("detached") is True:
        raise LookupError("stage10 production execution authorization was not found")
    if (
        authorization["authorizationId"] != event.event_id
        or authorization["baseRunId"] != event.run_id
        or (expected_run_id is not None and authorization["baseRunId"] != expected_run_id)
        or datetime.fromisoformat(authorization["authorizedAt"]) != event.created_at
        or event.stage != "stage10-production-execution-authorization"
        or event.source != authorization["operator"]
    ):
        raise ValueError("stage10_production_execution_authorization_audit_binding_invalid")
    candidate = _stage9_production_admission_candidate(
        audit_event_store, str(authorization["candidateId"])
    )
    review = next(
        (
            item
            for item in _stage9_production_admission_reviews(
                audit_event_store, str(authorization["baseRunId"]), limit=None
            )
            if item["reviewId"] == authorization["admissionReviewId"]
            and item["candidateId"] == authorization["candidateId"]
        ),
        None,
    )
    if review is None:
        raise ValueError("stage10_production_execution_admission_review_missing")
    rebuilt = build_production_execution_authorization(
        candidate,
        review,
        operator=str(authorization["operator"]),
        reason=str(authorization["reason"]),
        confirmations={item: True for item in PRODUCTION_EXECUTION_CONFIRMATION_IDS},
        authorized_at=str(authorization["authorizedAt"]),
    )
    if rebuilt != authorization:
        raise ValueError("stage10_production_execution_authority_invalid")
    return authorization


def _stage10_production_execution_attempts(
    audit_event_store: AuditEventStore,
    base_run_id: str,
    *,
    limit: int | None,
) -> list[dict[str, object]]:
    events = (
        audit_event_store.list_recent(
            run_id=base_run_id,
            event_type="stage10_production_execution_attempt",
            limit=limit,
        )
        if limit is not None
        else [
            event
            for event in audit_event_store.list_all_by_run(base_run_id)
            if event.event_type == "stage10_production_execution_attempt"
        ]
    )
    attempts = []
    for event in events:
        if event.metadata.get("detached") is True:
            continue
        attempt = production_execution_attempt_from_audit_event(event)
        if (
            attempt is None
            or attempt["attemptId"] != event.event_id
            or attempt["baseRunId"] != event.run_id
            or attempt["baseRunId"] != base_run_id
            or datetime.fromisoformat(attempt["attemptedAt"]) != event.created_at
            or event.stage != "stage10-production-execution-attempt"
            or event.source != attempt["operator"]
        ):
            raise ValueError("stage10_production_execution_attempt_audit_binding_invalid")
        authorization = _stage10_production_execution_authorization(
            audit_event_store,
            str(attempt["authorizationId"]),
            expected_run_id=base_run_id,
        )
        rebuilt = build_production_execution_attempt(
            authorization,
            operator=str(attempt["operator"]),
            attempted_at=str(attempt["attemptedAt"]),
        )
        if rebuilt != attempt:
            raise ValueError("stage10_production_execution_attempt_authority_invalid")
        attempts.append(attempt)
    return attempts


def _adapter_error_message(*, quality: DataQuality | None, error: str | None) -> str | None:
    if error:
        return str(error)
    if quality is None:
        return "provider quality unavailable"
    if quality.is_complete:
        return None
    return quality.warnings[0] if quality.warnings else f"incomplete provider response from {quality.source}"


def _attach_production_route_review_to_health_probe(
    probe_payload: dict[str, object],
    production_route_review: dict[str, object],
) -> None:
    review_id = str(production_route_review.get("productionRouteReviewId") or "").strip()
    review_status = str(production_route_review.get("status") or "").strip()
    route_review_summary = {
        "productionRouteReviewId": review_id,
        "status": review_status,
        "adapterId": str(production_route_review.get("adapterId") or "").strip(),
        "market": str(production_route_review.get("market") or "").strip(),
        "route": str(production_route_review.get("route") or "").strip(),
        "maintenanceWindowId": str(production_route_review.get("maintenanceWindowId") or "").strip(),
        "requiredEnvVars": [
            str(name).strip()
            for name in production_route_review.get("requiredEnvVars", [])
            if isinstance(name, str) and name.strip()
        ],
        "liveTradingAllowed": False,
        "paperOnly": True,
    }
    metadata = probe_payload.get("metadata")
    if not isinstance(metadata, dict):
        metadata = {}
    probe_payload["metadata"] = {
        **metadata,
        "productionRouteReviewId": review_id,
        "productionRouteReviewStatus": review_status,
    }
    probe_payload["productionRouteReviewId"] = review_id
    probe_payload["productionRouteReviewStatus"] = review_status
    probe_payload["routeReview"] = route_review_summary
