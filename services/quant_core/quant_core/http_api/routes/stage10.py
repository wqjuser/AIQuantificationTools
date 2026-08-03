from __future__ import annotations

from ..support.production_evidence import (
    _stage10_execution_query,
    _stage10_production_execution_attempts,
    _stage10_production_execution_authorization,
    _stage10_production_execution_authorizations,
    _stage9_production_admission_candidate,
    _stage9_production_admission_reviews,
)
from ..support.stage5 import _required_stage4_string
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.stage10_production_execution import (
    PRODUCTION_EXECUTION_CONFIRMATION_IDS,
    build_production_execution_authorization,
    build_production_trading_credential_preflight,
    build_production_trading_permission_verification,
)

def post_execution_stage10_production_trading_credential_preflights(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"operator"}:
            raise ValueError("stage10 production trading credential preflight request is invalid")
        preflight = build_production_trading_credential_preflight(
            environ=self._execution_adapter_environment(),
            operator=_required_stage4_string(payload["operator"]),
        )
        preflight = self._stage10_production_execution_service().record_credential_preflight(
            preflight
        )
        event = self.audit_event_store.get(preflight["preflightId"])
    except (ValueError, RuntimeError) as error:
        self._send_json(
            {
                "error": "stage10_production_trading_credential_preflight_blocked",
                "blockers": [str(error)],
            },
            status=409,
        )
        return
    self._send_json(
        {
            "productionTradingCredentialPreflight": preflight,
            "auditEvent": audit_event_record_to_payload(event),
        },
        status=201,
    )
    return


def post_execution_stage10_production_trading_permission_verifications(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"preflightId", "operator"}:
            raise ValueError(
                "stage10 production trading permission verification request is invalid"
            )
        service = self._stage10_production_execution_service()
        preflight = service.get_credential_preflight(
            _required_stage4_string(payload["preflightId"])
        )
        verification = build_production_trading_permission_verification(
            preflight,
            environ=self._execution_adapter_environment(),
            operator=_required_stage4_string(payload["operator"]),
            exchange_factory=type(self).execution_adapter_health_exchange_factory,
        )
        verification = service.record_permission_verification(verification)
        event = self.audit_event_store.get(verification["verificationId"])
    except (LookupError, ValueError, RuntimeError) as error:
        self._send_json(
            {
                "error": "stage10_production_trading_permission_verification_blocked",
                "blockers": [str(error)],
            },
            status=409,
        )
        return
    self._send_json(
        {
            "productionTradingPermissionVerification": verification,
            "auditEvent": audit_event_record_to_payload(event),
            **(
                {"blockers": verification["blockedReasons"]}
                if verification["status"] == "blocked"
                else {}
            ),
        },
        status=201 if verification["status"] == "verified" else 409,
    )
    return


def post_execution_stage10_production_execution_controls(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "action",
            "operator",
            "reason",
            "credentialPreflightId",
            "permissionVerificationId",
        }:
            raise ValueError("stage10 production execution control request is invalid")
        credential_preflight_id = payload["credentialPreflightId"]
        if credential_preflight_id is not None:
            credential_preflight_id = _required_stage4_string(credential_preflight_id)
        permission_verification_id = payload["permissionVerificationId"]
        if permission_verification_id is not None:
            permission_verification_id = _required_stage4_string(
                permission_verification_id
            )
        with type(self).production_readonly_authority_lock:
            control = self._stage10_production_execution_service().set_control(
                action=_required_stage4_string(payload["action"]),
                operator=_required_stage4_string(payload["operator"]),
                reason=_required_stage4_string(payload["reason"]),
                credential_preflight_id=credential_preflight_id,
                permission_verification_id=permission_verification_id,
            )
            event = self.audit_event_store.get(control["controlId"])
    except (LookupError, ValueError, RuntimeError) as error:
        self._send_json(
            {
                "error": "stage10_production_execution_control_blocked",
                "blockers": [str(error)],
            },
            status=409,
        )
        return
    self._send_json(
        {
            "productionExecutionControl": control,
            "auditEvent": audit_event_record_to_payload(event),
        },
        status=201,
    )
    return


def post_execution_stage10_production_execution_authorizations(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {
            "candidateId", "operator", "reason", "confirmations"
        }:
            raise ValueError("stage10 production execution authorization request fields are invalid")
        candidate_id = _required_stage4_string(payload["candidateId"])
        operator = _required_stage4_string(payload["operator"])
        reason = _required_stage4_string(payload["reason"])
        confirmations = payload["confirmations"]
        if (
            not isinstance(confirmations, dict)
            or set(confirmations) != set(PRODUCTION_EXECUTION_CONFIRMATION_IDS)
        ):
            raise ValueError("stage10 production execution confirmations are invalid")
        with type(self).production_readonly_authority_lock:
            candidate = _stage9_production_admission_candidate(
                self.audit_event_store, candidate_id
            )
            review = next(
                (
                    item
                    for item in _stage9_production_admission_reviews(
                        self.audit_event_store, candidate["baseRunId"], limit=None
                    )
                    if item["candidateId"] == candidate_id and item["outcome"] == "approved"
                ),
                None,
            )
            if review is None:
                raise ValueError("stage10 approved Stage 9 review was not found")
            existing = next(
                (
                    item
                    for item in _stage10_production_execution_authorizations(
                        self.audit_event_store, candidate["baseRunId"], limit=None
                    )
                    if item["candidateId"] == candidate_id
                    and item["admissionReviewId"] == review["reviewId"]
                ),
                None,
            )
            if existing is not None:
                if (
                    existing["operator"] != operator
                    or existing["reason"] != reason
                    or existing["confirmedScopeIds"]
                    != list(PRODUCTION_EXECUTION_CONFIRMATION_IDS)
                    or any(confirmations[item] is not True for item in confirmations)
                ):
                    raise ValueError(
                        "stage10 production execution authorization conflicts with immutable evidence"
                    )
                event = self.audit_event_store.get(existing["authorizationId"])
                self._send_json(
                    {
                        "productionExecutionAuthorization": existing,
                        "auditEvent": audit_event_record_to_payload(event),
                    }
                )
                return
            authorization = build_production_execution_authorization(
                candidate,
                review,
                operator=operator,
                reason=reason,
                confirmations=confirmations,
            )
            event_existed = self.audit_event_store.get(authorization["authorizationId"]) is not None
            authorization = self._stage10_production_execution_service().record_authorization(
                authorization
            )
            event = self.audit_event_store.get(authorization["authorizationId"])
    except (LookupError, ValueError, RuntimeError) as error:
        self._send_json(
            {
                "error": "stage10_production_execution_authorization_blocked",
                "blockers": [str(error)],
            },
            status=409,
        )
        return
    self._send_json(
        {
            "productionExecutionAuthorization": authorization,
            "auditEvent": audit_event_record_to_payload(event),
        },
        status=200 if event_existed else 201,
    )
    return


def post_execution_stage10_production_execution_attempts(self, parsed):
    try:
        payload = self._read_json_body()
        if not isinstance(payload, dict) or set(payload) != {"authorizationId", "operator"}:
            raise ValueError("stage10 production execution attempt request fields are invalid")
        authorization_id = _required_stage4_string(payload["authorizationId"])
        operator = _required_stage4_string(payload["operator"])
        with type(self).production_readonly_authority_lock:
            authorization = _stage10_production_execution_authorization(
                self.audit_event_store, authorization_id
            )
            existing = next(
                (
                    item
                    for item in _stage10_production_execution_attempts(
                        self.audit_event_store, authorization["baseRunId"], limit=None
                    )
                    if item["authorizationId"] == authorization_id
                ),
                None,
            )
            attempt = self._stage10_production_execution_service().attempt(
                authorization_id,
                operator=operator,
            )
            event = self.audit_event_store.get(attempt["attemptId"])
    except (LookupError, ValueError, RuntimeError) as error:
        self._send_json(
            {
                "error": "stage10_production_execution_attempt_blocked",
                "blockers": [str(error)],
            },
            status=409,
        )
        return
    self._send_json(
        {
            "productionExecutionAttempt": attempt,
            "auditEvent": audit_event_record_to_payload(event),
        },
        status=200 if existing is not None else 201,
    )
    return


def get_execution_stage10_production_trading_credential_preflights(self, parsed):
    try:
        preflight = self._stage10_production_execution_service().latest_credential_preflight()
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_stage10_production_trading_credential_preflight_store",
                "detail": str(error),
            },
            status=500,
        )
        return
    self._send_json({"productionTradingCredentialPreflight": preflight})
    return


def get_execution_stage10_production_trading_permission_verifications(self, parsed):
    try:
        verification = (
            self._stage10_production_execution_service().latest_permission_verification()
        )
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_stage10_production_trading_permission_verification_store",
                "detail": str(error),
            },
            status=500,
        )
        return
    self._send_json({"productionTradingPermissionVerification": verification})
    return


def get_execution_stage10_production_execution_controls(self, parsed):
    try:
        control = self._stage10_production_execution_service().control()
    except ValueError as error:
        self._send_json(
            {
                "error": "invalid_stage10_production_execution_control_store",
                "detail": str(error),
            },
            status=500,
        )
        return
    self._send_json({"productionExecutionControl": control})
    return


def get_execution_stage10_production_execution_authorizations(self, parsed):
    try:
        base_run_id, limit = _stage10_execution_query(parsed.query)
        authorizations = _stage10_production_execution_authorizations(
            self.audit_event_store, base_run_id, limit=limit
        )
    except (LookupError, ValueError) as error:
        code = (
            "invalid_stage10_production_execution_authorization_query"
            if str(error) == "invalid_stage10_production_execution_query"
            else "invalid_stage10_production_execution_authorization_store"
        )
        self._send_json(
            {"error": code, "detail": str(error)},
            status=400 if code.endswith("query") else 500,
        )
        return
    self._send_json({"productionExecutionAuthorizations": authorizations})
    return


def get_execution_stage10_production_execution_attempts(self, parsed):
    try:
        base_run_id, limit = _stage10_execution_query(parsed.query)
        attempts = _stage10_production_execution_attempts(
            self.audit_event_store, base_run_id, limit=limit
        )
    except (LookupError, ValueError) as error:
        code = (
            "invalid_stage10_production_execution_attempt_query"
            if str(error) == "invalid_stage10_production_execution_query"
            else "invalid_stage10_production_execution_attempt_store"
        )
        self._send_json(
            {"error": code, "detail": str(error)},
            status=400 if code.endswith("query") else 500,
        )
        return
    self._send_json({"productionExecutionAttempts": attempts})
    return
