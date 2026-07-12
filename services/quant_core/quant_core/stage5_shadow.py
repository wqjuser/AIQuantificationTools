from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
from typing import Any

from quant_core.execution_adapter_health import validate_execution_adapter_health_probe_evidence
from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot


_SAFETY = {
    "paperOnly": True,
    "shadowOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}
_FAILURE_MODES = {"none", "timeout_once", "adapter_rejected", "reconciliation_mismatch", "kill_switch"}
_STATUSES = {"reconciled", "recoverable_failure", "blocked"}
_READINESS_MAX_SOURCE_AGE = timedelta(hours=24)
_SANDBOX_PREFLIGHT_MAX_PROBE_AGE = timedelta(hours=24)
_READINESS_SAFETY = {
    "paperOnly": True,
    "shadowOnly": True,
    "sandboxOrderSubmissionAllowed": False,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}
_SANDBOX_PREFLIGHT_SAFETY = {
    "humanAuthorizationRequired": True,
    "sandboxOrderSubmissionAllowed": False,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}


def stage5_shadow_session_key(workflow_hash: str) -> str:
    return hashlib.sha256(f"stage5-shadow:{workflow_hash}".encode()).hexdigest()


def build_stage5_shadow_session(
    workflow: dict[str, Any],
    *,
    failure_mode: str = "none",
    attempt: int = 1,
    generated_at: str | None = None,
) -> dict[str, Any]:
    workflow = validate_stage4_portfolio_workflow_snapshot(workflow)
    if failure_mode not in _FAILURE_MODES:
        raise ValueError("stage5 shadow failureMode is invalid")
    if type(attempt) is not int or attempt not in {1, 2}:
        raise ValueError("stage5 shadow attempt must be one or two")
    if attempt == 2 and failure_mode != "timeout_once":
        raise ValueError("stage5 shadow retry is only allowed after timeout")

    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    _utc(generated_at, "generatedAt")
    session_key = stage5_shadow_session_key(workflow["workflowHash"])
    orders = workflow["batch"]["orders"]
    limits = {
        "maxOrders": len(orders),
        "maxGrossNotional": workflow["riskTemplate"]["maxBatchNotional"],
        "timeoutSeconds": 3,
        "maxAttempts": 2,
    }
    gross_notional = math.fsum(float(order["notionalValue"]) for order in orders)
    limit_blocked = len(orders) > limits["maxOrders"] or gross_notional > limits["maxGrossNotional"]
    kill_switch_triggered = failure_mode == "kill_switch"
    projected_orders = []
    for index, order in enumerate(orders):
        if kill_switch_triggered or limit_blocked:
            state, reason = "blocked", "kill_switch_triggered" if kill_switch_triggered else "limit_exceeded"
        elif failure_mode == "timeout_once" and attempt == 1:
            state, reason = ("timeout", "adapter_timeout") if index == 0 else ("not_attempted", "prior_timeout")
        elif failure_mode == "adapter_rejected":
            state, reason = "rejected", "fake_adapter_rejected"
        else:
            state, reason = "shadow_acknowledged", "shadow_projection_only"
        projected_orders.append(
            {
                "orderId": order["orderId"],
                "clientOrderId": _client_order_id(workflow["workflowHash"], order["orderId"]),
                "symbol": order["symbol"],
                "side": order["side"],
                "quantity": order["quantity"],
                "notionalValue": order["notionalValue"],
                "state": state,
                "reason": reason,
                "transitions": _transitions(generated_at, state),
            }
        )

    if failure_mode == "reconciliation_mismatch":
        status, reconciled, reconciliation_reason = "blocked", False, "shadow_reconciliation_mismatch"
    elif any(order["state"] in {"blocked", "rejected"} for order in projected_orders):
        status, reconciled, reconciliation_reason = "blocked", False, "shadow_orders_blocked"
    elif any(order["state"] == "timeout" for order in projected_orders):
        status, reconciled, reconciliation_reason = "recoverable_failure", False, "shadow_timeout_retry_required"
    else:
        status, reconciled, reconciliation_reason = "reconciled", True, "shadow_projection_matches_stage4"

    session = {
        "kind": "aiqt.stage5ShadowExecutionSession",
        "schemaVersion": 1,
        "sessionId": f"stage5-shadow-{session_key[:24]}-attempt-{attempt}",
        "sessionKey": session_key,
        "generatedAt": generated_at,
        "baseRunId": workflow["baseRunId"],
        "workflowId": workflow["workflowId"],
        "workflowHash": workflow["workflowHash"],
        "adapter": {"id": "local-fake-shadow", "environment": "isolated-local", "mode": "shadow"},
        "attempt": attempt,
        "failureMode": failure_mode,
        "status": status,
        "limits": limits,
        "killSwitch": {"enabled": True, "triggered": kill_switch_triggered},
        "orders": projected_orders,
        "reconciliation": {
            "reconciled": reconciled,
            "reason": reconciliation_reason,
            "stage4OrderCount": len(orders),
            "shadowOrderCount": len(projected_orders),
            "grossNotional": gross_notional,
        },
        **_SAFETY,
    }
    session["sessionHash"] = stage5_shadow_session_hash(session)
    return validate_stage5_shadow_session(session)


def validate_stage5_shadow_session(value: Any) -> dict[str, Any]:
    required = {
        "kind", "schemaVersion", "sessionId", "sessionKey", "generatedAt", "baseRunId",
        "workflowId", "workflowHash", "adapter", "attempt", "failureMode", "status", "limits",
        "killSwitch", "orders", "reconciliation", *_SAFETY, "sessionHash",
    }
    if not isinstance(value, dict) or set(value) != required:
        raise ValueError("stage5 shadow session must contain exact fields")
    if (
        value["kind"] != "aiqt.stage5ShadowExecutionSession"
        or type(value["schemaVersion"]) is not int
        or value["schemaVersion"] != 1
    ):
        raise ValueError("stage5 shadow session schema is invalid")
    for field in ("sessionId", "sessionKey", "generatedAt", "baseRunId", "workflowId", "workflowHash"):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError(f"stage5 shadow {field} is required")
    _utc(value["generatedAt"], "generatedAt")
    if len(value["sessionKey"]) != 64 or len(value["workflowHash"]) != 64 or len(value["sessionHash"]) != 64:
        raise ValueError("stage5 shadow hashes are invalid")
    if value["sessionKey"] != stage5_shadow_session_key(value["workflowHash"]):
        raise ValueError("stage5 shadow sessionKey does not match workflow")
    if value["failureMode"] not in _FAILURE_MODES or value["status"] not in _STATUSES:
        raise ValueError("stage5 shadow state is invalid")
    if type(value["attempt"]) is not int or value["attempt"] not in {1, 2}:
        raise ValueError("stage5 shadow attempt is invalid")
    if value["attempt"] == 2 and value["failureMode"] != "timeout_once":
        raise ValueError("stage5 shadow retry is invalid")
    for field, expected in _SAFETY.items():
        if value[field] is not expected:
            raise ValueError(f"stage5 shadow {field} is immutable")
    if value["adapter"] != {"id": "local-fake-shadow", "environment": "isolated-local", "mode": "shadow"}:
        raise ValueError("stage5 shadow adapter boundary is invalid")
    limits = value["limits"]
    if not isinstance(limits, dict) or set(limits) != {"maxOrders", "maxGrossNotional", "timeoutSeconds", "maxAttempts"}:
        raise ValueError("stage5 shadow limits are invalid")
    if (
        type(limits["maxOrders"]) is not int
        or limits["maxOrders"] <= 0
        or isinstance(limits["maxGrossNotional"], bool)
        or not isinstance(limits["maxGrossNotional"], (int, float))
        or limits["maxGrossNotional"] <= 0
        or limits["timeoutSeconds"] != 3
        or limits["maxAttempts"] != 2
    ):
        raise ValueError("stage5 shadow limits are invalid")
    kill_switch = value["killSwitch"]
    if not isinstance(kill_switch, dict) or set(kill_switch) != {"enabled", "triggered"} or kill_switch["enabled"] is not True:
        raise ValueError("stage5 shadow kill switch is invalid")
    orders = value["orders"]
    if not isinstance(orders, list) or not orders:
        raise ValueError("stage5 shadow orders are required")
    client_ids = []
    gross_notional = math.fsum(
        float(order.get("notionalValue", 0)) for order in orders if isinstance(order, dict)
    )
    limit_blocked = len(orders) > limits["maxOrders"] or gross_notional > limits["maxGrossNotional"]
    expected_states = (
        [("blocked", "limit_exceeded")] * len(orders)
        if limit_blocked
        else _expected_order_states(value["failureMode"], value["attempt"], len(orders))
    )
    for order, (expected_state, expected_reason) in zip(orders, expected_states, strict=True):
        if not isinstance(order, dict) or set(order) != {
            "orderId", "clientOrderId", "symbol", "side", "quantity", "notionalValue", "state", "reason", "transitions"
        }:
            raise ValueError("stage5 shadow order fields are invalid")
        if not all(isinstance(order[field], str) and order[field] for field in ("orderId", "clientOrderId", "symbol", "side", "state", "reason")):
            raise ValueError("stage5 shadow order identity is invalid")
        if order["clientOrderId"] != _client_order_id(value["workflowHash"], order["orderId"]):
            raise ValueError("stage5 shadow clientOrderId is invalid")
        if (
            order["state"] != expected_state
            or order["reason"] != expected_reason
            or order["transitions"] != _transitions(value["generatedAt"], expected_state)
        ):
            raise ValueError("stage5 shadow order state is invalid")
        for field in ("quantity", "notionalValue"):
            if isinstance(order[field], bool) or not isinstance(order[field], (int, float)) or order[field] <= 0:
                raise ValueError("stage5 shadow order amount is invalid")
        client_ids.append(order["clientOrderId"])
    if len(set(client_ids)) != len(client_ids):
        raise ValueError("stage5 shadow clientOrderId values must be unique")
    reconciliation = value["reconciliation"]
    if not isinstance(reconciliation, dict) or set(reconciliation) != {
        "reconciled", "reason", "stage4OrderCount", "shadowOrderCount", "grossNotional"
    }:
        raise ValueError("stage5 shadow reconciliation is invalid")
    if (
        limits["maxOrders"] != len(orders)
        or reconciliation["stage4OrderCount"] != len(orders)
        or reconciliation["shadowOrderCount"] != len(orders)
        or reconciliation["grossNotional"] != gross_notional
    ):
        raise ValueError("stage5 shadow reconciliation count is invalid")
    expected_status, expected_reconciled, expected_reason = (
        ("blocked", False, "shadow_orders_blocked")
        if limit_blocked
        else _expected_session_state(value["failureMode"], value["attempt"])
    )
    if (
        kill_switch["triggered"] is not (value["failureMode"] == "kill_switch")
        or value["status"] != expected_status
        or reconciliation["reconciled"] is not expected_reconciled
        or reconciliation["reason"] != expected_reason
    ):
        raise ValueError("stage5 shadow reconciliation status is invalid")
    if value["sessionHash"] != stage5_shadow_session_hash(value):
        raise ValueError("stage5 shadow sessionHash does not match")
    return json.loads(json.dumps(value))


def stage5_shadow_session_hash(value: dict[str, Any]) -> str:
    payload = {key: item for key, item in value.items() if key != "sessionHash"}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def stage5_shadow_session_to_audit_event(session: dict[str, Any], operator: str) -> dict[str, Any]:
    session = validate_stage5_shadow_session(session)
    return {
        "schemaVersion": 1,
        "eventId": session["sessionId"],
        "eventType": "stage5_shadow_execution_session",
        "runId": session["baseRunId"],
        "createdAt": session["generatedAt"],
        "stage": "stage5-shadow-execution",
        "source": operator,
        "summary": f"Recorded Stage 5 shadow attempt {session['attempt']} for {session['baseRunId']}.",
        "detail": "Local fake adapter projection only; no broker connection or order route was used.",
        "metadata": {"snapshot": session},
    }


def build_stage5_sandbox_readiness_decision(
    workflow: dict[str, Any],
    session: dict[str, Any],
    adapter_paper_executions: list[dict[str, Any]],
    *,
    operator: str,
    confirmed: bool,
    generated_at: str | None = None,
) -> dict[str, Any]:
    workflow = validate_stage4_portfolio_workflow_snapshot(workflow)
    session = validate_stage5_shadow_session(session)
    if confirmed is not True:
        raise ValueError("stage5 sandbox readiness scope confirmation is required")
    operator = operator.strip() if isinstance(operator, str) else ""
    if not operator:
        raise ValueError("stage5 sandbox readiness operator is required")
    if (
        session["baseRunId"] != workflow["baseRunId"]
        or session["workflowId"] != workflow["workflowId"]
        or session["workflowHash"] != workflow["workflowHash"]
    ):
        raise ValueError("stage5 sandbox readiness shadow identity does not match workflow")
    if session["status"] != "reconciled" or (
        (session["failureMode"], session["attempt"]) not in {("none", 1), ("timeout_once", 2)}
    ):
        raise ValueError("stage5 sandbox readiness requires a reconciled shadow session")

    simulations = workflow["simulations"]
    if not isinstance(adapter_paper_executions, list) or len(adapter_paper_executions) != len(simulations):
        raise ValueError("stage5 sandbox readiness adapter evidence count does not match simulations")
    executions_by_id = {
        execution.get("adapterPaperExecutionId"): execution
        for execution in adapter_paper_executions
        if isinstance(execution, dict) and isinstance(execution.get("adapterPaperExecutionId"), str)
    }
    execution_ids = []
    manifest_ids = []
    adapter_ids = set()
    markets = set()
    source_times = [
        datetime.fromisoformat(workflow["generatedAt"]),
        datetime.fromisoformat(session["generatedAt"]),
    ]
    for simulation in simulations:
        execution_id = _required_string(simulation.get("adapterPaperExecutionId"), "adapterPaperExecutionId")
        manifest_id = _required_string(simulation.get("adapterManifestValidationId"), "adapterManifestValidationId")
        inline = simulation.get("adapterPaperExecutionEvidence")
        execution = executions_by_id.get(execution_id)
        if not isinstance(inline, dict) or not isinstance(execution, dict):
            raise ValueError("stage5 sandbox readiness terminal adapter evidence is missing")
        expected = {
            "adapterPaperExecutionId": execution_id,
            "manifestValidationId": manifest_id,
            "adapterId": _required_string(execution.get("adapterId"), "adapterId"),
            "market": _required_string(execution.get("market"), "market"),
            "route": "paper",
            "status": "paper_execution_recorded",
            "paperFillRecorded": True,
            "paperOnly": True,
            "orderSubmitted": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
            "liveTradingAllowed": False,
        }
        for field, expected_value in expected.items():
            if execution.get(field) != expected_value or inline.get(field) != expected_value:
                raise ValueError(f"stage5 sandbox readiness adapter evidence {field} does not match")
        order_intent = execution.get("orderIntent")
        expected_intent = {
            "symbol": simulation.get("symbol"),
            "side": simulation.get("side"),
            "quantity": simulation.get("quantity"),
        }
        if not isinstance(order_intent, dict) or any(
            order_intent.get(field) != expected_value or inline.get(field) != expected_value
            for field, expected_value in expected_intent.items()
        ):
            raise ValueError("stage5 sandbox readiness adapter order intent does not match simulation")
        recorded_at = _timestamp(execution.get("recordedAt"), "adapter recordedAt")
        source_times.append(recorded_at)
        execution_ids.append(execution_id)
        manifest_ids.append(manifest_id)
        adapter_ids.add(expected["adapterId"])
        markets.add(expected["market"])
    if len(executions_by_id) != len(simulations) or len(set(execution_ids)) != len(execution_ids):
        raise ValueError("stage5 sandbox readiness adapter evidence ids must be unique")
    if len(adapter_ids) != 1 or len(markets) != 1 or next(iter(markets)) != workflow["portfolio"]["market"]:
        raise ValueError("stage5 sandbox readiness adapter market binding does not match")

    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    generated_time = _timestamp(generated_at, "generatedAt")
    if generated_time < max(source_times):
        raise ValueError("stage5 sandbox readiness generatedAt precedes source evidence")
    if any(generated_time - source_time > _READINESS_MAX_SOURCE_AGE for source_time in source_times):
        raise ValueError("stage5 sandbox readiness source evidence is stale")
    adapter_id = next(iter(adapter_ids))
    market = next(iter(markets))
    decision_id = _stage5_sandbox_readiness_decision_id(session["sessionHash"], execution_ids)
    decision = {
        "kind": "aiqt.stage5SandboxReadinessDecision",
        "schemaVersion": 1,
        "decisionId": decision_id,
        "generatedAt": generated_at,
        "baseRunId": workflow["baseRunId"],
        "workflowId": workflow["workflowId"],
        "workflowHash": workflow["workflowHash"],
        "shadowSessionId": session["sessionId"],
        "shadowSessionHash": session["sessionHash"],
        "adapterId": adapter_id,
        "market": market,
        "adapterPaperExecutionIds": execution_ids,
        "adapterManifestValidationIds": manifest_ids,
        "adapterAuditEventIds": list(execution_ids),
        "operator": operator,
        "status": "ready_for_manually_authorized_sandbox_phase",
        **_READINESS_SAFETY,
    }
    decision["decisionHash"] = stage5_sandbox_readiness_decision_hash(decision)
    return validate_stage5_sandbox_readiness_decision(decision)


def validate_stage5_sandbox_readiness_decision(value: Any) -> dict[str, Any]:
    required = {
        "kind", "schemaVersion", "decisionId", "decisionHash", "generatedAt", "baseRunId",
        "workflowId", "workflowHash", "shadowSessionId", "shadowSessionHash", "adapterId", "market",
        "adapterPaperExecutionIds", "adapterManifestValidationIds", "adapterAuditEventIds", "operator",
        "status", *_READINESS_SAFETY,
    }
    if not isinstance(value, dict) or set(value) != required:
        raise ValueError("stage5 sandbox readiness decision must contain exact fields")
    if value["kind"] != "aiqt.stage5SandboxReadinessDecision" or value["schemaVersion"] != 1:
        raise ValueError("stage5 sandbox readiness decision schema is invalid")
    for field in (
        "decisionId", "generatedAt", "baseRunId", "workflowId", "workflowHash", "shadowSessionId",
        "shadowSessionHash", "adapterId", "market", "operator", "status", "decisionHash",
    ):
        _required_string(value[field], field)
    _timestamp(value["generatedAt"], "generatedAt")
    if value["status"] != "ready_for_manually_authorized_sandbox_phase":
        raise ValueError("stage5 sandbox readiness status is invalid")
    for field in ("workflowHash", "shadowSessionHash", "decisionHash"):
        if len(value[field]) != 64:
            raise ValueError(f"stage5 sandbox readiness {field} is invalid")
    evidence_lists = [
        value["adapterPaperExecutionIds"],
        value["adapterManifestValidationIds"],
        value["adapterAuditEventIds"],
    ]
    if (
        any(not isinstance(items, list) or not items or not all(isinstance(item, str) and item for item in items) for items in evidence_lists)
        or len({len(items) for items in evidence_lists}) != 1
        or len(set(value["adapterPaperExecutionIds"])) != len(value["adapterPaperExecutionIds"])
        or value["adapterAuditEventIds"] != value["adapterPaperExecutionIds"]
    ):
        raise ValueError("stage5 sandbox readiness adapter evidence references are invalid")
    for field, expected in _READINESS_SAFETY.items():
        if value[field] is not expected:
            raise ValueError(f"stage5 sandbox readiness {field} is immutable")
    if value["decisionId"] != _stage5_sandbox_readiness_decision_id(
        value["shadowSessionHash"], value["adapterPaperExecutionIds"]
    ):
        raise ValueError("stage5 sandbox readiness decisionId does not match evidence")
    if value["decisionHash"] != stage5_sandbox_readiness_decision_hash(value):
        raise ValueError("stage5 sandbox readiness decisionHash does not match")
    return json.loads(json.dumps(value))


def stage5_sandbox_readiness_decision_hash(value: dict[str, Any]) -> str:
    payload = {key: item for key, item in value.items() if key != "decisionHash"}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def stage5_sandbox_readiness_decision_to_audit_event(decision: dict[str, Any]) -> dict[str, Any]:
    decision = validate_stage5_sandbox_readiness_decision(decision)
    return {
        "schemaVersion": 1,
        "eventId": decision["decisionId"],
        "eventType": "stage5_sandbox_readiness_decision",
        "runId": decision["baseRunId"],
        "createdAt": decision["generatedAt"],
        "stage": "stage5-sandbox-readiness",
        "source": decision["operator"],
        "summary": f"Recorded Stage 5 sandbox readiness decision for {decision['baseRunId']}.",
        "detail": "Ready only for a separately authorized sandbox phase; order submission and live routing remain blocked.",
        "metadata": {"snapshot": decision},
    }


def build_stage5_sandbox_authorization_preflight(
    readiness_decision: dict[str, Any],
    sandbox_probe_execution: dict[str, Any],
    sandbox_probe_review: dict[str, Any],
    *,
    operator: str,
    confirmed: bool,
    generated_at: str | None = None,
) -> dict[str, Any]:
    decision = validate_stage5_sandbox_readiness_decision(readiness_decision)
    operator = operator.strip() if isinstance(operator, str) else ""
    if not operator or confirmed is not True:
        raise ValueError("stage5 sandbox authorization preflight scope confirmation is required")
    if not isinstance(sandbox_probe_execution, dict) or not isinstance(sandbox_probe_review, dict):
        raise ValueError("stage5 sandbox authorization preflight probe evidence is required")
    execution_id = _required_string(
        sandbox_probe_execution.get("sandboxProbeExecutionId"), "sandboxProbeExecutionId"
    )
    review_id = _required_string(
        sandbox_probe_review.get("sandboxProbeReviewId"), "sandboxProbeReviewId"
    )
    if (
        sandbox_probe_execution.get("status") != "probe_execution_recorded"
        or sandbox_probe_review.get("status") != "probe_review_recorded"
        or sandbox_probe_review.get("sandboxProbeExecutionId") != execution_id
    ):
        raise ValueError("stage5 sandbox authorization preflight requires a recorded probe review")
    review_confirmations = sandbox_probe_review.get("requiredConfirmations")
    if not isinstance(review_confirmations, list) or not review_confirmations or any(
        not isinstance(row, dict) or row.get("status") != "confirmed"
        for row in review_confirmations
    ):
        raise ValueError("stage5 sandbox authorization preflight review confirmations are incomplete")
    adapter_id = decision["adapterId"]
    market = decision["market"]
    if adapter_id != "ccxt-live" or market != "crypto" or any(
        source.get("adapterId") != adapter_id or source.get("market") != market
        for source in (sandbox_probe_execution, sandbox_probe_review)
    ):
        raise ValueError("stage5 sandbox authorization preflight adapter or market does not match")
    if any(source.get("route") != "live" for source in (sandbox_probe_execution, sandbox_probe_review)):
        raise ValueError("stage5 sandbox authorization preflight probe route is invalid")
    metadata = sandbox_probe_execution.get("metadata")
    health = validate_execution_adapter_health_probe_evidence(
        metadata.get("authoritativeHealthProbe") if isinstance(metadata, dict) else None
    )
    if (
        health["status"] != "ready"
        or health["adapterId"] != adapter_id
        or health["readOnly"] is not True
        or health["paperOnly"] is not True
        or health["liveTradingAllowed"] is not False
        or health["orderRoutingEnabled"] is not False
        or health["blockedReasons"]
    ):
        raise ValueError("stage5 sandbox authorization preflight authoritative health is not ready")

    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    generated_time = _timestamp(generated_at, "generatedAt")
    decision_time = _timestamp(decision["generatedAt"], "readiness generatedAt")
    execution_time = _timestamp(sandbox_probe_execution.get("recordedAt"), "probe recordedAt")
    review_time = _timestamp(sandbox_probe_review.get("recordedAt"), "review recordedAt")
    health_time = _timestamp(health["generatedAt"], "health generatedAt")
    if not decision_time <= generated_time or not health_time <= execution_time <= review_time <= generated_time:
        raise ValueError("stage5 sandbox authorization preflight evidence time order is invalid")
    if generated_time - health_time > _SANDBOX_PREFLIGHT_MAX_PROBE_AGE:
        raise ValueError("stage5 sandbox authorization preflight health evidence is stale")

    preflight_id = stage5_sandbox_authorization_preflight_id(
        decision["decisionHash"], execution_id, review_id
    )
    preflight = {
        "kind": "aiqt.stage5SandboxAuthorizationPreflight",
        "schemaVersion": 1,
        "preflightId": preflight_id,
        "generatedAt": generated_at,
        "baseRunId": decision["baseRunId"],
        "readinessDecisionId": decision["decisionId"],
        "readinessDecisionHash": decision["decisionHash"],
        "adapterId": adapter_id,
        "market": market,
        "sandboxProbeExecutionId": execution_id,
        "authoritativeHealthEvidenceHash": health["evidenceHash"],
        "sandboxProbeReviewId": review_id,
        "operator": operator,
        "status": "ready_for_separate_sandbox_authorization",
        **_SANDBOX_PREFLIGHT_SAFETY,
    }
    preflight["preflightHash"] = stage5_sandbox_authorization_preflight_hash(preflight)
    return validate_stage5_sandbox_authorization_preflight(preflight)


def validate_stage5_sandbox_authorization_preflight(value: Any) -> dict[str, Any]:
    required = {
        "kind", "schemaVersion", "preflightId", "preflightHash", "generatedAt", "baseRunId",
        "readinessDecisionId", "readinessDecisionHash", "adapterId", "market",
        "sandboxProbeExecutionId", "authoritativeHealthEvidenceHash", "sandboxProbeReviewId",
        "operator", "status", *_SANDBOX_PREFLIGHT_SAFETY,
    }
    if not isinstance(value, dict) or set(value) != required:
        raise ValueError("stage5 sandbox authorization preflight must contain exact fields")
    if value["kind"] != "aiqt.stage5SandboxAuthorizationPreflight" or value["schemaVersion"] != 1:
        raise ValueError("stage5 sandbox authorization preflight schema is invalid")
    for field in required - {"schemaVersion", *_SANDBOX_PREFLIGHT_SAFETY}:
        _required_string(value[field], field)
    _timestamp(value["generatedAt"], "generatedAt")
    if value["adapterId"] != "ccxt-live" or value["market"] != "crypto":
        raise ValueError("stage5 sandbox authorization preflight adapter boundary is invalid")
    if value["status"] != "ready_for_separate_sandbox_authorization":
        raise ValueError("stage5 sandbox authorization preflight status is invalid")
    for field in ("preflightHash", "readinessDecisionHash", "authoritativeHealthEvidenceHash"):
        if len(value[field]) != 64:
            raise ValueError(f"stage5 sandbox authorization preflight {field} is invalid")
    for field, expected in _SANDBOX_PREFLIGHT_SAFETY.items():
        if value[field] is not expected:
            raise ValueError(f"stage5 sandbox authorization preflight {field} is immutable")
    if value["preflightId"] != stage5_sandbox_authorization_preflight_id(
        value["readinessDecisionHash"], value["sandboxProbeExecutionId"], value["sandboxProbeReviewId"]
    ):
        raise ValueError("stage5 sandbox authorization preflight id does not match evidence")
    if value["preflightHash"] != stage5_sandbox_authorization_preflight_hash(value):
        raise ValueError("stage5 sandbox authorization preflight hash does not match")
    return json.loads(json.dumps(value))


def stage5_sandbox_authorization_preflight_hash(value: dict[str, Any]) -> str:
    payload = {key: item for key, item in value.items() if key != "preflightHash"}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def stage5_sandbox_authorization_preflight_to_audit_event(preflight: dict[str, Any]) -> dict[str, Any]:
    preflight = validate_stage5_sandbox_authorization_preflight(preflight)
    return {
        "schemaVersion": 1,
        "eventId": preflight["preflightId"],
        "eventType": "stage5_sandbox_authorization_preflight",
        "runId": preflight["baseRunId"],
        "createdAt": preflight["generatedAt"],
        "stage": "stage5-sandbox-authorization-preflight",
        "source": preflight["operator"],
        "summary": f"Recorded Stage 5 sandbox authorization preflight for {preflight['baseRunId']}.",
        "detail": "Ready only for separate human authorization; sandbox and live order submission remain blocked.",
        "metadata": {"snapshot": preflight},
    }


def _stage5_sandbox_readiness_decision_id(session_hash: str, execution_ids: list[str]) -> str:
    digest = hashlib.sha256(
        f"stage5-sandbox-readiness:{session_hash}:{','.join(execution_ids)}".encode()
    ).hexdigest()
    return f"stage5-sandbox-readiness-{digest[:24]}"


def stage5_sandbox_authorization_preflight_id(
    decision_hash: str, execution_id: str, review_id: str
) -> str:
    digest = hashlib.sha256(
        f"stage5-sandbox-authorization-preflight:{decision_hash}:{execution_id}:{review_id}".encode()
    ).hexdigest()
    return f"stage5-sandbox-authorization-preflight-{digest[:24]}"


def _required_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"stage5 sandbox readiness {field} is required")
    return value.strip()


def _timestamp(value: Any, field: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"stage5 sandbox readiness {field} is invalid") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"stage5 sandbox readiness {field} must include timezone")
    return parsed


def _transitions(generated_at: str, state: str) -> list[dict[str, str]]:
    rows = [{"state": "projected", "at": generated_at}]
    if state != "not_attempted":
        rows.append({"state": state, "at": generated_at})
    if state == "shadow_acknowledged":
        rows.append({"state": "reconciled", "at": generated_at})
    return rows


def _client_order_id(workflow_hash: str, order_id: str) -> str:
    return "shadow-" + hashlib.sha256(f"{workflow_hash}:{order_id}".encode()).hexdigest()[:24]


def _expected_order_states(failure_mode: str, attempt: int, count: int) -> list[tuple[str, str]]:
    if failure_mode == "kill_switch":
        return [("blocked", "kill_switch_triggered")] * count
    if failure_mode == "adapter_rejected":
        return [("rejected", "fake_adapter_rejected")] * count
    if failure_mode == "timeout_once" and attempt == 1:
        return [("timeout", "adapter_timeout"), *[("not_attempted", "prior_timeout")] * (count - 1)]
    return [("shadow_acknowledged", "shadow_projection_only")] * count


def _expected_session_state(failure_mode: str, attempt: int) -> tuple[str, bool, str]:
    if failure_mode == "reconciliation_mismatch":
        return "blocked", False, "shadow_reconciliation_mismatch"
    if failure_mode in {"kill_switch", "adapter_rejected"}:
        return "blocked", False, "shadow_orders_blocked"
    if failure_mode == "timeout_once" and attempt == 1:
        return "recoverable_failure", False, "shadow_timeout_retry_required"
    return "reconciled", True, "shadow_projection_matches_stage4"


def _utc(value: str, field: str) -> None:
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"stage5 shadow {field} is invalid") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"stage5 shadow {field} must include timezone")
