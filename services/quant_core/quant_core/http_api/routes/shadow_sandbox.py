from __future__ import annotations

from ..support.production_evidence import _stage6_event_snapshot
from ..support.stage5 import (
    _parse_limit,
    _required_stage4_string,
    _stage5_sandbox_authorization_preflight_by_hash,
    _stage5_sandbox_authorization_preflight_from_event,
    _stage5_sandbox_authorization_preflight_query,
    _stage5_sandbox_authorization_preflights,
    _stage5_sandbox_authorization_probe_execution,
    _stage5_sandbox_authorization_probe_review,
    _stage5_sandbox_authorization_review_from_event,
    _stage5_sandbox_authorization_reviews,
    _stage5_sandbox_readiness_adapter_executions,
    _stage5_sandbox_readiness_decision_by_hash,
    _stage5_sandbox_readiness_decisions,
    _stage5_sandbox_readiness_query,
    _stage5_shadow_query,
    _stage5_shadow_sessions,
    _stage5_shadow_source_workflow,
)
from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot
from quant_core.stage5_shadow import (
    build_stage5_sandbox_authorization_preflight,
    build_stage5_sandbox_authorization_review,
    build_stage5_sandbox_readiness_decision,
    build_stage5_shadow_session,
    stage5_sandbox_authorization_preflight_id,
    stage5_sandbox_authorization_preflight_to_audit_event,
    stage5_sandbox_authorization_review_id,
    stage5_sandbox_authorization_review_to_audit_event,
    stage5_sandbox_readiness_decision_to_audit_event,
    stage5_shadow_session_to_audit_event,
    validate_stage5_sandbox_authorization_preflight,
    validate_stage5_sandbox_authorization_review,
    validate_stage5_sandbox_readiness_decision,
    validate_stage5_shadow_session,
)
from quant_core.stage6_sandbox import (
    build_stage6_sandbox_batch_authorization,
    validate_stage6_sandbox_batch_authorization,
)
from urllib.parse import parse_qs

def post_execution_shadow_sessions(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "baseRunId", "workflowHash", "failureMode", "operator"
        }:
            raise ValueError("stage5 shadow request fields are invalid")
        base_run_id = _required_stage4_string(payload["baseRunId"])
        workflow_hash = _required_stage4_string(payload["workflowHash"])
        failure_mode = _required_stage4_string(payload["failureMode"])
        operator = _required_stage4_string(payload["operator"])
        workflow = _stage5_shadow_source_workflow(
            self.audit_event_store, base_run_id, workflow_hash
        )
        existing = _stage5_shadow_sessions(
            self.audit_event_store, base_run_id, workflow_hash
        )
        latest = existing[0] if existing else None
        if latest and latest["failureMode"] != failure_mode:
            raise ValueError("stage5 shadow failureMode does not match existing session")
        if latest and latest["status"] != "recoverable_failure":
            session = latest
            created = False
        else:
            attempt = 2 if latest else 1
            session = build_stage5_shadow_session(
                workflow,
                failure_mode=failure_mode,
                attempt=attempt,
            )
            self.audit_event_store.record(
                stage5_shadow_session_to_audit_event(session, operator)
            )
            created = True
    except LookupError as error:
        self._send_json(
            {"error": "stage5_shadow_workflow_not_found", "detail": str(error)},
            status=404,
        )
        return
    except ValueError as error:
        self._send_json(
            {"error": "invalid_stage5_shadow_session", "detail": str(error)},
            status=400,
        )
        return
    self._send_json({"shadowSession": session}, status=201 if created else 200)
    return


def post_execution_sandbox_readiness_decisions(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "baseRunId", "workflowHash", "sessionHash", "operator", "confirmed"
        }:
            raise ValueError("stage5 sandbox readiness request fields are invalid")
        base_run_id = _required_stage4_string(payload["baseRunId"])
        workflow_hash = _required_stage4_string(payload["workflowHash"])
        session_hash = _required_stage4_string(payload["sessionHash"])
        operator = _required_stage4_string(payload["operator"])
        confirmed = payload["confirmed"]
        if confirmed is not True:
            raise ValueError("stage5 sandbox readiness confirmation is required")
    except ValueError as error:
        self._send_json(
            {"error": "invalid_stage5_sandbox_readiness_request", "detail": str(error)},
            status=400,
        )
        return
    try:
        workflow = _stage5_shadow_source_workflow(
            self.audit_event_store, base_run_id, workflow_hash
        )
        session = next(
            (
                item for item in _stage5_shadow_sessions(
                    self.audit_event_store, base_run_id, workflow_hash
                )
                if item["sessionHash"] == session_hash
            ),
            None,
        )
        if session is None:
            raise LookupError("reconciled Stage 5 shadow session was not found")
        executions = _stage5_sandbox_readiness_adapter_executions(
            self.audit_event_store, workflow
        )
        candidate = build_stage5_sandbox_readiness_decision(
            workflow,
            session,
            executions,
            operator=operator,
            confirmed=True,
        )
        existing = next(
            (
                item for item in _stage5_sandbox_readiness_decisions(
                    self.audit_event_store, base_run_id
                )
                if item["decisionId"] == candidate["decisionId"]
            ),
            None,
        )
        if existing is not None:
            decision = existing
            created = False
        else:
            self.audit_event_store.record(
                stage5_sandbox_readiness_decision_to_audit_event(candidate)
            )
            decision = candidate
            created = True
    except (LookupError, ValueError) as error:
        self._send_json(
            {"error": "stage5_sandbox_readiness_blocked", "blockers": [str(error)]},
            status=409,
        )
        return
    self._send_json(
        {"sandboxReadinessDecision": decision}, status=201 if created else 200
    )
    return


def post_execution_sandbox_authorization_preflights(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "baseRunId", "readinessDecisionHash", "sandboxProbeExecutionId",
            "sandboxProbeReviewId", "operator", "confirmed",
        }:
            raise ValueError("stage5 sandbox authorization preflight request fields are invalid")
        base_run_id = _required_stage4_string(payload["baseRunId"])
        decision_hash = _required_stage4_string(payload["readinessDecisionHash"])
        execution_id = _required_stage4_string(payload["sandboxProbeExecutionId"])
        review_id = _required_stage4_string(payload["sandboxProbeReviewId"])
        operator = _required_stage4_string(payload["operator"])
        if payload["confirmed"] is not True:
            raise ValueError("stage5 sandbox authorization preflight confirmation is required")
    except ValueError as error:
        self._send_json(
            {"error": "invalid_stage5_sandbox_authorization_preflight_request", "detail": str(error)},
            status=400,
        )
        return
    try:
        decision = _stage5_sandbox_readiness_decision_by_hash(
            self.audit_event_store, base_run_id, decision_hash
        )
        execution_event = self.audit_event_store.get(execution_id)
        review_event = self.audit_event_store.get(review_id)
        execution = _stage5_sandbox_authorization_probe_execution(execution_event)
        review = _stage5_sandbox_authorization_probe_review(review_event)
        if decision is None or execution is None or review is None:
            raise LookupError("stage5 sandbox authorization preflight source evidence was not found")
        existing_event = self.audit_event_store.get(
            stage5_sandbox_authorization_preflight_id(
                decision_hash, execution_id, review_id
            )
        )
        existing = (
            _stage5_sandbox_authorization_preflight_from_event(
                self.audit_event_store, base_run_id, existing_event
            )
            if existing_event is not None
            else None
        )
        if existing is not None:
            self._send_json({"sandboxAuthorizationPreflight": existing})
            return
        candidate = build_stage5_sandbox_authorization_preflight(
            decision,
            execution,
            review,
            operator=operator,
            confirmed=True,
        )
        self.audit_event_store.record(
            stage5_sandbox_authorization_preflight_to_audit_event(candidate)
        )
        preflight, created = candidate, True
    except (LookupError, ValueError) as error:
        self._send_json(
            {"error": "stage5_sandbox_authorization_preflight_blocked", "blockers": [str(error)]},
            status=409,
        )
        return
    self._send_json(
        {"sandboxAuthorizationPreflight": preflight}, status=201 if created else 200
    )
    return


def post_execution_sandbox_authorization_reviews(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "baseRunId", "preflightHash", "reviewer", "outcome", "reason", "confirmations",
        }:
            raise ValueError("stage5 sandbox authorization review request fields are invalid")
        base_run_id = _required_stage4_string(payload["baseRunId"])
        preflight_hash = _required_stage4_string(payload["preflightHash"])
        reviewer = _required_stage4_string(payload["reviewer"])
        outcome = _required_stage4_string(payload["outcome"])
        reason = _required_stage4_string(payload["reason"])
        confirmations = payload["confirmations"]
    except ValueError as error:
        self._send_json(
            {"error": "invalid_stage5_sandbox_authorization_review_request", "detail": str(error)},
            status=400,
        )
        return
    try:
        preflight = _stage5_sandbox_authorization_preflight_by_hash(
            self.audit_event_store, base_run_id, preflight_hash
        )
        if preflight is None:
            raise LookupError("stage5 sandbox authorization review preflight was not found")
        existing_event = self.audit_event_store.get(
            stage5_sandbox_authorization_review_id(preflight_hash)
        )
        if existing_event is not None:
            review = _stage5_sandbox_authorization_review_from_event(
                self.audit_event_store, base_run_id, existing_event
            )
            self._send_json({"sandboxAuthorizationReview": review})
            return
        execution = _stage5_sandbox_authorization_probe_execution(
            self.audit_event_store.get(preflight["sandboxProbeExecutionId"])
        )
        if execution is None:
            raise LookupError("stage5 sandbox authorization review probe evidence was not found")
        review = build_stage5_sandbox_authorization_review(
            preflight,
            execution,
            reviewer=reviewer,
            outcome=outcome,
            reason=reason,
            confirmations=confirmations,
        )
        stored_event, created = self.audit_event_store.record_if_absent(
            stage5_sandbox_authorization_review_to_audit_event(review)
        )
        review = _stage5_sandbox_authorization_review_from_event(
            self.audit_event_store, base_run_id, stored_event
        )
    except (LookupError, ValueError) as error:
        self._send_json(
            {"error": "stage5_sandbox_authorization_review_blocked", "blockers": [str(error)]},
            status=409,
        )
        return
    self._send_json({"sandboxAuthorizationReview": review}, status=201 if created else 200)
    return


def post_execution_stage6_sandbox_authorizations(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "workflowId", "shadowSessionId", "readinessDecisionId", "preflightId", "reviewId", "operator"
        }:
            raise ValueError("stage6 sandbox authorization request fields are invalid")
        workflow = _stage6_event_snapshot(
            self.audit_event_store, payload["workflowId"], "stage4_portfolio_workflow",
            validate_stage4_portfolio_workflow_snapshot,
        )
        shadow = _stage6_event_snapshot(
            self.audit_event_store, payload["shadowSessionId"], "stage5_shadow_execution_session",
            validate_stage5_shadow_session,
        )
        readiness = _stage6_event_snapshot(
            self.audit_event_store, payload["readinessDecisionId"], "stage5_sandbox_readiness_decision",
            validate_stage5_sandbox_readiness_decision,
        )
        preflight = _stage6_event_snapshot(
            self.audit_event_store, payload["preflightId"], "stage5_sandbox_authorization_preflight",
            validate_stage5_sandbox_authorization_preflight,
        )
        review = _stage6_event_snapshot(
            self.audit_event_store, payload["reviewId"], "stage5_sandbox_authorization_review",
            validate_stage5_sandbox_authorization_review,
        )
        service = self._stage6_sandbox_service()
        orders = service.route.normalize_orders(workflow)
        authorization = build_stage6_sandbox_batch_authorization(
            workflow, shadow, readiness, preflight, review, orders,
            operator=_required_stage4_string(payload["operator"]),
        )
        service.record_authorization(authorization)
    except (LookupError, ValueError, RuntimeError) as error:
        self._send_json(
            {"error": "stage6_sandbox_authorization_blocked", "blockers": [str(error)]}, status=409
        )
        return
    self._send_json({"sandboxBatchAuthorization": authorization}, status=201)
    return


def post_execution_stage6_sandbox_batches(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"authorizationId"}:
            raise ValueError("stage6 sandbox submit request fields are invalid")
        batch = self._stage6_sandbox_service().submit(_required_stage4_string(payload["authorizationId"]))
    except (ValueError, RuntimeError) as error:
        self._send_json({"error": "stage6_sandbox_submit_blocked", "blockers": [str(error)]}, status=409)
        return
    self._send_json({"sandboxBatch": batch}, status=200)
    return


def post_execution_stage6_sandbox_reconciliations(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"authorizationId"}:
            raise ValueError("stage6 sandbox reconcile request fields are invalid")
        batch = self._stage6_sandbox_service().reconcile(_required_stage4_string(payload["authorizationId"]))
    except (ValueError, RuntimeError) as error:
        self._send_json({"error": "stage6_sandbox_reconciliation_blocked", "blockers": [str(error)]}, status=409)
        return
    self._send_json({"sandboxBatch": batch})
    return


def post_execution_stage6_sandbox_cancellations(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"authorizationId", "orderId"}:
            raise ValueError("stage6 sandbox cancel request fields are invalid")
        batch = self._stage6_sandbox_service().cancel(
            _required_stage4_string(payload["authorizationId"]),
            _required_stage4_string(payload["orderId"]),
        )
    except (ValueError, RuntimeError) as error:
        self._send_json({"error": "stage6_sandbox_cancel_blocked", "blockers": [str(error)]}, status=409)
        return
    self._send_json({"sandboxBatch": batch})
    return


def post_execution_stage6_kill_switch(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"triggered", "operator"} or type(payload["triggered"]) is not bool:
            raise ValueError("stage6 sandbox kill switch request fields are invalid")
        kill_switch = self._stage6_sandbox_service().set_kill_switch(
            triggered=payload["triggered"], operator=_required_stage4_string(payload["operator"])
        )
    except (ValueError, RuntimeError) as error:
        self._send_json({"error": "stage6_sandbox_kill_switch_blocked", "blockers": [str(error)]}, status=409)
        return
    self._send_json({"killSwitch": kill_switch})
    return


def get_execution_shadow_sessions(self, parsed):
    try:
        base_run_id, limit = _stage5_shadow_query(parsed.query)
        sessions = _stage5_shadow_sessions(
            self.audit_event_store, base_run_id, None, limit=limit
        )
    except ValueError as error:
        code = (
            "invalid_stage5_shadow_session_query"
            if str(error) == "invalid_stage5_shadow_session_query"
            else "invalid_stage5_shadow_session_store"
        )
        self._send_json(
            {"error": code, "detail": str(error)},
            status=400 if code.endswith("query") else 500,
        )
        return
    self._send_json({"shadowSessions": sessions})
    return


def get_execution_sandbox_readiness_decisions(self, parsed):
    try:
        base_run_id, limit = _stage5_sandbox_readiness_query(parsed.query)
        decisions = _stage5_sandbox_readiness_decisions(
            self.audit_event_store, base_run_id, limit=limit
        )
    except ValueError as error:
        code = (
            "invalid_stage5_sandbox_readiness_query"
            if str(error) == "invalid_stage5_sandbox_readiness_query"
            else "invalid_stage5_sandbox_readiness_store"
        )
        self._send_json(
            {"error": code, "detail": str(error)},
            status=400 if code.endswith("query") else 500,
        )
        return
    self._send_json({"sandboxReadinessDecisions": decisions})
    return


def get_execution_sandbox_authorization_preflights(self, parsed):
    try:
        base_run_id, limit = _stage5_sandbox_authorization_preflight_query(parsed.query)
        preflights = _stage5_sandbox_authorization_preflights(
            self.audit_event_store, base_run_id, limit=limit
        )
    except ValueError as error:
        code = (
            "invalid_stage5_sandbox_authorization_preflight_query"
            if str(error) == "invalid_stage5_sandbox_authorization_preflight_query"
            else "invalid_stage5_sandbox_authorization_preflight_store"
        )
        self._send_json(
            {"error": code, "detail": str(error)},
            status=400 if code.endswith("query") else 500,
        )
        return
    self._send_json({"sandboxAuthorizationPreflights": preflights})
    return


def get_execution_sandbox_authorization_reviews(self, parsed):
    try:
        base_run_id, limit = _stage5_sandbox_authorization_preflight_query(parsed.query)
        reviews = _stage5_sandbox_authorization_reviews(
            self.audit_event_store, base_run_id, limit=limit
        )
    except ValueError as error:
        code = (
            "invalid_stage5_sandbox_authorization_review_query"
            if str(error) == "invalid_stage5_sandbox_authorization_preflight_query"
            else "invalid_stage5_sandbox_authorization_review_store"
        )
        self._send_json(
            {"error": code, "detail": str(error)},
            status=400 if code.endswith("query") else 500,
        )
        return
    self._send_json({"sandboxAuthorizationReviews": reviews})
    return


def get_execution_stage6_sandbox_authorizations(self, parsed):
    try:
        query = parse_qs(parsed.query)
        base_run_id = query.get("baseRunId", [""])[0].strip()
        limit = _parse_limit(query.get("limit", ["20"])[0])
        events = self.audit_event_store.list_recent(
            run_id=base_run_id or None,
            event_type="stage6_sandbox_batch_authorization",
            limit=limit,
        )
        authorizations = [
            validate_stage6_sandbox_batch_authorization(event.metadata.get("snapshot"))
            for event in events
        ]
    except ValueError as error:
        self._send_json({"error": "invalid_stage6_sandbox_authorization_store", "detail": str(error)}, status=500)
        return
    self._send_json({"sandboxBatchAuthorizations": authorizations})
    return


def get_execution_stage6_sandbox_batches(self, parsed):
    authorization_id = parse_qs(parsed.query).get("authorizationId", [""])[0].strip()
    if not authorization_id:
        self._send_json({"error": "stage6_sandbox_authorization_id_required"}, status=400)
        return
    try:
        batch = self._stage6_sandbox_service().batch(authorization_id)
    except ValueError as error:
        self._send_json({"error": "stage6_sandbox_batch_not_found", "detail": str(error)}, status=404)
        return
    self._send_json({"sandboxBatch": batch})
    return


def get_execution_stage6_kill_switch(self, parsed):
    self._send_json({"killSwitch": self._stage6_sandbox_service().kill_switch()})
    return
