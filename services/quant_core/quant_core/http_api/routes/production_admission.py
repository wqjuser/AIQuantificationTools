from __future__ import annotations

from ..support.production_evidence import (
    _latest_stage8_production_readonly_access_control,
    _stage6_event_snapshot,
    _stage7_production_route_review_is_current,
    _stage8_production_readonly_continuity,
    _stage9_production_admission_candidate,
    _stage9_production_admission_candidates,
    _stage9_production_admission_reviews,
)
from ..support.stage5 import (
    _parse_limit,
    _required_stage4_string,
)
from datetime import (
    datetime,
    timezone,
)
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.execution import execution_adapter_production_route_review_payload_from_audit_event
from quant_core.execution_adapter_health import (
    probe_ccxt_production_readonly,
    production_readonly_probe_from_audit_event,
    production_readonly_probe_to_audit_event_payload,
    production_readonly_probe_to_evidence,
)
from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot
from quant_core.stage6_exit import load_stage6_exit_acceptance_status
from quant_core.stage8_continuity import (
    build_production_readonly_access_control,
    production_readonly_access_control_to_audit_event,
)
from quant_core.stage9_production_admission import (
    PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS,
    build_production_order_admission_candidate,
    build_production_order_admission_review,
    canonical_production_order_admission_continuity,
    production_order_admission_candidate_from_audit_event,
    production_order_admission_candidate_to_audit_event,
    production_order_admission_review_from_audit_event,
    production_order_admission_review_to_audit_event,
    validate_production_order_admission_preconditions,
)
from urllib.parse import parse_qs

def post_execution_stage8_production_readonly_access_controls(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "action", "operator", "reason", "productionRouteReviewId"
        }:
            raise ValueError("stage8 production read-only access control request fields are invalid")
        action = _required_stage4_string(payload["action"])
        operator = _required_stage4_string(payload["operator"])
        reason = _required_stage4_string(payload["reason"])
        review_id = payload["productionRouteReviewId"]
        if review_id is not None and not isinstance(review_id, str):
            raise ValueError("stage8 production read-only route review id is invalid")
        with type(self).production_readonly_authority_lock:
            current = _latest_stage8_production_readonly_access_control(self.audit_event_store)
            desired = "revoked" if action == "revoke" else "active" if action == "restore" else ""
            if not desired:
                raise ValueError("stage8 production read-only action is invalid")
            if action == "revoke" and review_id is not None:
                raise ValueError("stage8 revoke must not bind a production route review")
            if action == "restore":
                review_id = _required_stage4_string(review_id)
                route_review_event = self.audit_event_store.get(review_id)
                route_review = (
                    execution_adapter_production_route_review_payload_from_audit_event(route_review_event)
                    if route_review_event else None
                )
                if not route_review or not _stage7_production_route_review_is_current(route_review):
                    raise ValueError("stage8 restore requires a current ccxt-live production route review")
            created = False
            equivalent = bool(
                current is not None
                and current["status"] == desired
                and current["operator"] == operator
                and current["reason"] == reason
                and current["productionRouteReviewId"] == (review_id if action == "restore" else None)
            )
            if equivalent:
                control = current
            else:
                control = build_production_readonly_access_control(
                    action=action,
                    operator=operator,
                    reason=reason,
                    previous_control_id=current["controlId"] if current else None,
                    production_route_review_id=review_id if action == "restore" else None,
                )
                self.audit_event_store.record(production_readonly_access_control_to_audit_event(control))
                created = True
            continuity = _stage8_production_readonly_continuity(
                self.audit_event_store, self.stage6_exit_acceptance_report_path
            )
    except ValueError as error:
        self._send_json(
            {"error": "stage8_production_readonly_access_control_blocked", "blockers": [str(error)]},
            status=409,
        )
        return
    self._send_json(
        {"productionReadonlyAccessControl": control, "productionReadonlyContinuity": continuity},
        status=201 if created else 200,
    )
    return


def post_execution_stage7_production_readonly_probes(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "productionRouteReviewId", "operator", "eligibilityConfirmed"
        } or type(payload["eligibilityConfirmed"]) is not bool:
            raise ValueError("stage7 production read-only request fields are invalid")
        production_route_review_id = _required_stage4_string(payload["productionRouteReviewId"])
        operator = _required_stage4_string(payload["operator"])
        if payload["eligibilityConfirmed"] is not True:
            raise ValueError("stage7 production eligibility confirmation is required")
        with type(self).production_readonly_authority_lock:
            access_control = _latest_stage8_production_readonly_access_control(self.audit_event_store)
            if access_control is not None and access_control["status"] == "revoked":
                raise ValueError("stage8_production_readonly_access_revoked")
            stage6_status = load_stage6_exit_acceptance_status(self.stage6_exit_acceptance_report_path)
            if stage6_status["status"] != "accepted" or not stage6_status["exitHash"]:
                raise ValueError("stage7 requires accepted Stage 6 exit evidence")
            route_review_event = self.audit_event_store.get(production_route_review_id)
            route_review = (
                execution_adapter_production_route_review_payload_from_audit_event(route_review_event)
                if route_review_event else None
            )
            if (
                not route_review or not _stage7_production_route_review_is_current(route_review)
            ):
                raise ValueError("stage7 requires a current ccxt-live production route review")
            probe = probe_ccxt_production_readonly(
                adapter_id="ccxt-live",
                exchange_id="binance",
                environ=self._execution_adapter_environment(),
                exchange_factory=type(self).execution_adapter_health_exchange_factory,
            )
            evidence = production_readonly_probe_to_evidence(
                probe,
                stage6_exit_hash=stage6_status["exitHash"],
                production_route_review_id=production_route_review_id,
                operator=operator,
                eligibility_confirmed=True,
            )
            audit_event = self.audit_event_store.record(
                production_readonly_probe_to_audit_event_payload(evidence)
            )
    except ValueError as error:
        self._send_json(
            {"error": "stage7_production_readonly_probe_blocked", "blockers": [str(error)]}, status=409
        )
        return
    self._send_json(
        {
            "productionReadonlyProbe": evidence,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=201 if evidence["status"] == "ready" else 409,
    )
    return


def post_execution_stage9_production_order_admission_candidates(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"authorizationId", "operator"}:
            raise ValueError("stage9 production admission request fields are invalid")
        authorization_id = _required_stage4_string(payload["authorizationId"])
        operator = _required_stage4_string(payload["operator"])
        with type(self).production_readonly_authority_lock:
            service = self._stage6_sandbox_service()
            authorization = service.get_authorization(authorization_id)
            workflow = _stage6_event_snapshot(
                self.audit_event_store,
                authorization["workflowId"],
                "stage4_portfolio_workflow",
                validate_stage4_portfolio_workflow_snapshot,
            )
            batch = service.batch(authorization_id)
            continuity = _stage8_production_readonly_continuity(
                self.audit_event_store, self.stage6_exit_acceptance_report_path
            )
            validate_production_order_admission_preconditions(
                workflow, authorization, batch, continuity
            )
            continuity = canonical_production_order_admission_continuity(continuity)
            existing = next((
                candidate
                for candidate in _stage9_production_admission_candidates(
                    self.audit_event_store, authorization["baseRunId"], limit=None
                )
                if candidate["sandboxAuthorizationId"] == authorization_id
                and candidate["stage8ContinuityHash"] == continuity["continuityHash"]
                and datetime.fromisoformat(candidate["expiresAt"]) >= datetime.now(timezone.utc)
            ), None)
            if existing is not None:
                if existing["operator"] != operator:
                    raise ValueError("stage9 production admission candidate request conflicts with immutable evidence")
                event = self.audit_event_store.get(existing["candidateId"])
                self._send_json({
                    "productionOrderAdmissionCandidate": existing,
                    "auditEvent": audit_event_record_to_payload(event),
                })
                return
            observation = self._stage9_production_admission_route().observe(authorization["orders"])
            if not observation["passed"]:
                raise ValueError(";".join(observation["blockedReasons"]))
            candidate = build_production_order_admission_candidate(
                workflow,
                authorization,
                batch,
                continuity,
                observation,
                operator=operator,
            )
            event, created = self.audit_event_store.record_if_absent(
                production_order_admission_candidate_to_audit_event(candidate)
            )
            stored = production_order_admission_candidate_from_audit_event(event)
            if stored != candidate:
                raise ValueError("stage9 production admission candidate conflict")
    except (LookupError, ValueError, RuntimeError) as error:
        self._send_json(
            {"error": "stage9_production_order_admission_candidate_blocked", "blockers": [str(error)]},
            status=409,
        )
        return
    self._send_json(
        {
            "productionOrderAdmissionCandidate": candidate,
            "auditEvent": audit_event_record_to_payload(event),
        },
        status=201 if created else 200,
    )
    return


def post_execution_stage9_production_order_admission_reviews(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "candidateId", "reviewer", "outcome", "reason", "confirmations"
        }:
            raise ValueError("stage9 production admission review request fields are invalid")
        candidate_id = _required_stage4_string(payload["candidateId"])
        reviewer = _required_stage4_string(payload["reviewer"])
        outcome = _required_stage4_string(payload["outcome"])
        reason = _required_stage4_string(payload["reason"])
        confirmations = payload["confirmations"]
        expected_confirmations = set(PRODUCTION_ADMISSION_REVIEW_SCOPE_IDS)
        if (
            outcome not in {"approved", "rejected"}
            or not isinstance(confirmations, dict)
            or set(confirmations) != expected_confirmations
            or any(confirmations[item] is not True for item in expected_confirmations)
        ):
            raise ValueError("stage9 production admission review request is invalid")
        with type(self).production_readonly_authority_lock:
            candidate = _stage9_production_admission_candidate(
                self.audit_event_store, candidate_id
            )
            existing = next((
                review for review in _stage9_production_admission_reviews(
                    self.audit_event_store, candidate["baseRunId"], limit=None
                )
                if review["candidateId"] == candidate_id
            ), None)
            if existing is not None:
                if (
                    existing["reviewer"] != reviewer
                    or existing["outcome"] != outcome
                    or existing["reason"] != reason
                ):
                    raise ValueError("stage9 production admission review request conflicts with immutable evidence")
                event = self.audit_event_store.get(existing["reviewId"])
                self._send_json({
                    "productionOrderAdmissionReview": existing,
                    "auditEvent": audit_event_record_to_payload(event),
                })
                return
            service = self._stage6_sandbox_service()
            authorization = service.get_authorization(candidate["sandboxAuthorizationId"])
            workflow = _stage6_event_snapshot(
                self.audit_event_store,
                authorization["workflowId"],
                "stage4_portfolio_workflow",
                validate_stage4_portfolio_workflow_snapshot,
            )
            batch = service.batch(authorization["authorizationId"])
            continuity = _stage8_production_readonly_continuity(
                self.audit_event_store, self.stage6_exit_acceptance_report_path
            )
            rebuilt = build_production_order_admission_candidate(
                workflow,
                authorization,
                batch,
                continuity,
                candidate["observation"],
                operator=candidate["operator"],
                generated_at=candidate["generatedAt"],
            )
            if rebuilt != candidate:
                raise ValueError("stage9 production admission candidate authority changed")
            observation = self._stage9_production_admission_route().observe(candidate["orders"])
            if not observation["passed"]:
                raise ValueError(";".join(observation["blockedReasons"]))
            review = build_production_order_admission_review(
                candidate,
                continuity,
                observation,
                reviewer=reviewer,
                outcome=outcome,
                reason=reason,
                confirmations=confirmations,
            )
            event, created = self.audit_event_store.record_if_absent(
                production_order_admission_review_to_audit_event(review)
            )
            stored = production_order_admission_review_from_audit_event(event)
            if stored != review:
                raise ValueError("stage9 production admission review conflict")
    except (LookupError, ValueError, RuntimeError) as error:
        self._send_json(
            {"error": "stage9_production_order_admission_review_blocked", "blockers": [str(error)]},
            status=409,
        )
        return
    self._send_json(
        {
            "productionOrderAdmissionReview": review,
            "auditEvent": audit_event_record_to_payload(event),
        },
        status=201 if created else 200,
    )
    return


def get_execution_stage8_production_readonly_continuity(self, parsed):
    try:
        continuity = _stage8_production_readonly_continuity(
            self.audit_event_store, self.stage6_exit_acceptance_report_path
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_stage8_production_readonly_continuity_store", "detail": str(error)},
            status=500,
        )
        return
    self._send_json({"productionReadonlyContinuity": continuity})
    return


def get_execution_stage7_production_readonly_probes(self, parsed):
    try:
        limit = _parse_limit(parse_qs(parsed.query).get("limit", ["20"])[0])
        events = self.audit_event_store.list_recent(
            event_type="stage7_production_readonly_probe", limit=limit
        )
        stage6_status = load_stage6_exit_acceptance_status(self.stage6_exit_acceptance_report_path)
        probes = []
        for event in events:
            probe = production_readonly_probe_from_audit_event(event)
            if probe is None:
                raise ValueError("stage7 production read-only evidence is invalid")
            if stage6_status["status"] != "accepted" or stage6_status["exitHash"] != probe["stage6ExitHash"]:
                raise ValueError("stage7 production read-only Stage 6 authority is invalid")
            route_review_event = self.audit_event_store.get(probe["productionRouteReviewId"])
            route_review = (
                execution_adapter_production_route_review_payload_from_audit_event(route_review_event)
                if route_review_event else None
            )
            if (
                not route_review or not _stage7_production_route_review_is_current(route_review)
            ):
                raise ValueError("stage7 production read-only route review authority is invalid")
            probes.append(probe)
    except ValueError as error:
        self._send_json(
            {"error": "invalid_stage7_production_readonly_probe_store", "detail": str(error)}, status=500
        )
        return
    self._send_json({"productionReadonlyProbes": probes})
    return


def get_execution_stage9_production_order_admission_candidates(self, parsed):
    try:
        query = parse_qs(parsed.query, keep_blank_values=True)
        if set(query) - {"baseRunId", "limit"} or len(query.get("baseRunId", [])) != 1:
            raise ValueError("invalid_stage9_production_admission_candidate_query")
        base_run_id = query["baseRunId"][0].strip()
        raw_limit = query.get("limit", ["20"])
        if not base_run_id or len(raw_limit) != 1 or not raw_limit[0].isdigit():
            raise ValueError("invalid_stage9_production_admission_candidate_query")
        limit = int(raw_limit[0])
        if not 1 <= limit <= 50:
            raise ValueError("invalid_stage9_production_admission_candidate_query")
        candidates = _stage9_production_admission_candidates(
            self.audit_event_store, base_run_id, limit=limit
        )
    except ValueError as error:
        code = (
            "invalid_stage9_production_admission_candidate_query"
            if str(error) == "invalid_stage9_production_admission_candidate_query"
            else "invalid_stage9_production_admission_candidate_store"
        )
        self._send_json({"error": code, "detail": str(error)}, status=400 if code.endswith("query") else 500)
        return
    self._send_json({"productionOrderAdmissionCandidates": candidates})
    return


def get_execution_stage9_production_order_admission_reviews(self, parsed):
    try:
        query = parse_qs(parsed.query, keep_blank_values=True)
        if set(query) - {"baseRunId", "limit"} or len(query.get("baseRunId", [])) != 1:
            raise ValueError("invalid_stage9_production_admission_review_query")
        base_run_id = query["baseRunId"][0].strip()
        raw_limit = query.get("limit", ["20"])
        if not base_run_id or len(raw_limit) != 1 or not raw_limit[0].isdigit():
            raise ValueError("invalid_stage9_production_admission_review_query")
        limit = int(raw_limit[0])
        if not 1 <= limit <= 50:
            raise ValueError("invalid_stage9_production_admission_review_query")
        reviews = _stage9_production_admission_reviews(
            self.audit_event_store, base_run_id, limit=limit
        )
    except (LookupError, ValueError) as error:
        code = (
            "invalid_stage9_production_admission_review_query"
            if str(error) == "invalid_stage9_production_admission_review_query"
            else "invalid_stage9_production_admission_review_store"
        )
        self._send_json({"error": code, "detail": str(error)}, status=400 if code.endswith("query") else 500)
        return
    self._send_json({"productionOrderAdmissionReviews": reviews})
    return
