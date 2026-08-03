from __future__ import annotations

import os
from ..support.production_evidence import _attach_production_route_review_to_health_probe
from ..support.stage5 import _parse_limit
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.execution import (
    build_execution_adapter_production_route_review,
    build_execution_adapter_sandbox_order_schema_dry_run,
    build_execution_adapter_sandbox_probe_execution,
    build_execution_adapter_sandbox_probe_plan,
    build_execution_adapter_sandbox_probe_review,
    execution_adapter_human_confirmation_payload_from_audit_event,
    execution_adapter_production_route_review_payload_from_audit_event,
    execution_adapter_production_route_review_to_audit_event_payload,
    execution_adapter_production_route_review_to_payload,
    execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event,
    execution_adapter_sandbox_order_schema_dry_run_to_audit_event_payload,
    execution_adapter_sandbox_order_schema_dry_run_to_payload,
    execution_adapter_sandbox_probe_execution_payload_from_audit_event,
    execution_adapter_sandbox_probe_execution_to_audit_event_payload,
    execution_adapter_sandbox_probe_execution_to_payload,
    execution_adapter_sandbox_probe_plan_payload_from_audit_event,
    execution_adapter_sandbox_probe_plan_to_audit_event_payload,
    execution_adapter_sandbox_probe_plan_to_payload,
    execution_adapter_sandbox_probe_review_payload_from_audit_event,
    execution_adapter_sandbox_probe_review_to_audit_event_payload,
    execution_adapter_sandbox_probe_review_to_payload,
)
from quant_core.execution_adapter_health import (
    execution_adapter_health_probe_to_evidence,
    execution_adapter_health_probe_to_payload,
    probe_ccxt_sandbox_health,
)
from urllib.parse import parse_qs

def post_execution_adapter_sandbox_probe_plans(self, parsed):
    payload = self._read_json_body()
    human_confirmation_id = str(payload.get("humanConfirmationId") or "").strip()
    human_confirmation_event = self.audit_event_store.get(human_confirmation_id)
    human_confirmation = (
        execution_adapter_human_confirmation_payload_from_audit_event(human_confirmation_event)
        if human_confirmation_event
        else None
    )
    if not human_confirmation:
        self._send_json(
            {
                "error": "execution_adapter_human_confirmation_not_found",
                "humanConfirmationId": human_confirmation_id,
            },
            status=404,
        )
        return
    try:
        sandbox_probe_plan = build_execution_adapter_sandbox_probe_plan(
            human_confirmation,
            adapter_id=str(payload.get("adapterId") or ""),
            probe_mode=str(payload.get("probeMode") or "manual_sandbox_probe_plan"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_sandbox_probe_plan", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_sandbox_probe_plan_to_audit_event_payload(sandbox_probe_plan)
    )
    self._send_json(
        {
            "adapterSandboxProbePlan": execution_adapter_sandbox_probe_plan_to_payload(sandbox_probe_plan),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if sandbox_probe_plan.status == "blocked" else 201,
    )
    return


def post_execution_adapter_sandbox_probe_executions(self, parsed):
    payload = self._read_json_body()
    sandbox_probe_plan_id = str(payload.get("sandboxProbePlanId") or "").strip()
    sandbox_probe_plan_event = self.audit_event_store.get(sandbox_probe_plan_id)
    sandbox_probe_plan = (
        execution_adapter_sandbox_probe_plan_payload_from_audit_event(sandbox_probe_plan_event)
        if sandbox_probe_plan_event
        else None
    )
    if not sandbox_probe_plan:
        self._send_json(
            {
                "error": "execution_adapter_sandbox_probe_plan_not_found",
                "sandboxProbePlanId": sandbox_probe_plan_id,
            },
            status=404,
        )
        return
    health_probe = None
    health_probe_evidence = None
    if (
        sandbox_probe_plan.get("adapterId") == "ccxt-live"
        and sandbox_probe_plan.get("market") == "crypto"
    ):
        exchange_id = (
            str(payload.get("exchangeId") or "").strip()
            or os.environ.get("CCXT_DEFAULT_EXCHANGE", "binance").strip()
            or "binance"
        )
        health_probe = probe_ccxt_sandbox_health(
            adapter_id="ccxt-live",
            exchange_id=exchange_id,
            environ=self._execution_adapter_environment(),
            exchange_factory=type(self).execution_adapter_health_exchange_factory,
        )
        health_probe_evidence = execution_adapter_health_probe_to_evidence(health_probe)
    try:
        sandbox_probe_execution = build_execution_adapter_sandbox_probe_execution(
            sandbox_probe_plan,
            health_probe_evidence=health_probe_evidence,
            adapter_id=str(payload.get("adapterId") or ""),
            probe_execution_mode=str(payload.get("probeExecutionMode") or "manual_readonly_sandbox_probe"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_sandbox_probe_execution", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_sandbox_probe_execution_to_audit_event_payload(sandbox_probe_execution)
    )
    self._send_json(
        {
            "adapterSandboxProbeExecution": execution_adapter_sandbox_probe_execution_to_payload(
                sandbox_probe_execution
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
            **(
                {"adapterHealthProbe": execution_adapter_health_probe_to_payload(health_probe)}
                if health_probe
                else {}
            ),
        },
        status=409 if sandbox_probe_execution.status == "blocked" else 201,
    )
    return


def post_execution_adapter_sandbox_probe_reviews(self, parsed):
    payload = self._read_json_body()
    sandbox_probe_execution_id = str(payload.get("sandboxProbeExecutionId") or "").strip()
    sandbox_probe_execution_event = self.audit_event_store.get(sandbox_probe_execution_id)
    sandbox_probe_execution = (
        execution_adapter_sandbox_probe_execution_payload_from_audit_event(sandbox_probe_execution_event)
        if sandbox_probe_execution_event
        else None
    )
    if not sandbox_probe_execution:
        self._send_json(
            {
                "error": "execution_adapter_sandbox_probe_execution_not_found",
                "sandboxProbeExecutionId": sandbox_probe_execution_id,
            },
            status=404,
        )
        return
    try:
        sandbox_probe_review = build_execution_adapter_sandbox_probe_review(
            sandbox_probe_execution,
            adapter_id=str(payload.get("adapterId") or ""),
            review_mode=str(payload.get("reviewMode") or "manual_sandbox_probe_review"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_sandbox_probe_review", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_sandbox_probe_review_to_audit_event_payload(sandbox_probe_review)
    )
    self._send_json(
        {
            "adapterSandboxProbeReview": execution_adapter_sandbox_probe_review_to_payload(
                sandbox_probe_review
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if sandbox_probe_review.status == "blocked" else 201,
    )
    return


def post_execution_adapter_production_route_reviews(self, parsed):
    payload = self._read_json_body()
    sandbox_probe_review_id = str(payload.get("sandboxProbeReviewId") or "").strip()
    sandbox_probe_review_event = self.audit_event_store.get(sandbox_probe_review_id)
    sandbox_probe_review = (
        execution_adapter_sandbox_probe_review_payload_from_audit_event(sandbox_probe_review_event)
        if sandbox_probe_review_event
        else None
    )
    if not sandbox_probe_review:
        self._send_json(
            {
                "error": "execution_adapter_sandbox_probe_review_not_found",
                "sandboxProbeReviewId": sandbox_probe_review_id,
            },
            status=404,
        )
        return
    try:
        production_route_review = build_execution_adapter_production_route_review(
            sandbox_probe_review,
            adapter_id=str(payload.get("adapterId") or ""),
            review_mode=str(payload.get("reviewMode") or "manual_production_route_review"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_production_route_review", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_production_route_review_to_audit_event_payload(production_route_review)
    )
    self._send_json(
        {
            "adapterProductionRouteReview": execution_adapter_production_route_review_to_payload(
                production_route_review
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if production_route_review.status == "blocked" else 201,
    )
    return


def post_execution_adapter_sandbox_order_schema_dry_runs(self, parsed):
    payload = self._read_json_body()
    production_route_review_id = str(payload.get("productionRouteReviewId") or "").strip()
    production_route_review_event = self.audit_event_store.get(production_route_review_id)
    production_route_review = (
        execution_adapter_production_route_review_payload_from_audit_event(production_route_review_event)
        if production_route_review_event
        else None
    )
    if not production_route_review:
        self._send_json(
            {
                "error": "execution_adapter_production_route_review_not_found",
                "productionRouteReviewId": production_route_review_id,
            },
            status=404,
        )
        return
    try:
        schema_dry_run = build_execution_adapter_sandbox_order_schema_dry_run(
            production_route_review,
            adapter_id=str(payload.get("adapterId") or ""),
            dry_run_mode=str(payload.get("dryRunMode") or "manual_sandbox_order_schema_dry_run"),
            order_intent=payload.get("orderIntent") if isinstance(payload.get("orderIntent"), dict) else {},
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_execution_adapter_sandbox_order_schema_dry_run", "detail": str(error)},
            status=400,
        )
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_sandbox_order_schema_dry_run_to_audit_event_payload(schema_dry_run)
    )
    self._send_json(
        {
            "adapterSandboxOrderSchemaDryRun": execution_adapter_sandbox_order_schema_dry_run_to_payload(
                schema_dry_run
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if schema_dry_run.status == "blocked" else 201,
    )
    return


def get_execution_adapter_sandbox_probe_plans(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_sandbox_probe_plan_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    sandbox_probe_plan_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_sandbox_probe_plan",
        limit=50,
        query=adapter_id,
    )
    sandbox_probe_plans = []
    for event in sandbox_probe_plan_events:
        payload = execution_adapter_sandbox_probe_plan_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            sandbox_probe_plans.append(payload)
        if len(sandbox_probe_plans) >= limit:
            break
    self._send_json({"adapterSandboxProbePlans": sandbox_probe_plans})
    return


def get_execution_adapter_sandbox_probe_executions(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_sandbox_probe_execution_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    sandbox_probe_execution_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_sandbox_probe_execution",
        limit=50,
        query=adapter_id,
    )
    sandbox_probe_executions = []
    for event in sandbox_probe_execution_events:
        payload = execution_adapter_sandbox_probe_execution_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            sandbox_probe_executions.append(payload)
        if len(sandbox_probe_executions) >= limit:
            break
    self._send_json({"adapterSandboxProbeExecutions": sandbox_probe_executions})
    return


def get_execution_adapter_sandbox_probe_reviews(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_sandbox_probe_review_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    sandbox_probe_review_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_sandbox_probe_review",
        limit=50,
        query=adapter_id,
    )
    sandbox_probe_reviews = []
    for event in sandbox_probe_review_events:
        payload = execution_adapter_sandbox_probe_review_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            sandbox_probe_reviews.append(payload)
        if len(sandbox_probe_reviews) >= limit:
            break
    self._send_json({"adapterSandboxProbeReviews": sandbox_probe_reviews})
    return


def get_execution_adapter_production_route_reviews(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_production_route_review_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    production_route_review_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_production_route_review",
        limit=50,
        query=adapter_id,
    )
    production_route_reviews = []
    for event in production_route_review_events:
        payload = execution_adapter_production_route_review_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            production_route_reviews.append(payload)
        if len(production_route_reviews) >= limit:
            break
    self._send_json({"adapterProductionRouteReviews": production_route_reviews})
    return


def get_execution_adapter_sandbox_order_schema_dry_runs(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_sandbox_order_schema_dry_run_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    schema_dry_run_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_sandbox_order_schema_dry_run",
        limit=50,
        query=adapter_id,
    )
    schema_dry_runs = []
    for event in schema_dry_run_events:
        payload = execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            schema_dry_runs.append(payload)
        if len(schema_dry_runs) >= limit:
            break
    self._send_json({"adapterSandboxOrderSchemaDryRuns": schema_dry_runs})
    return


def get_execution_adapter_health_ccxt_sandbox(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", ["ccxt-live"])[0].strip() or "ccxt-live"
    production_route_review_id = query.get("productionRouteReviewId", [""])[0].strip()
    production_route_review = None
    if production_route_review_id:
        production_route_review_event = self.audit_event_store.get(production_route_review_id)
        production_route_review = (
            execution_adapter_production_route_review_payload_from_audit_event(production_route_review_event)
            if production_route_review_event
            else None
        )
        if not production_route_review:
            self._send_json(
                {
                    "error": "execution_adapter_production_route_review_not_found",
                    "productionRouteReviewId": production_route_review_id,
                },
                status=404,
            )
            return
        if production_route_review.get("adapterId") != adapter_id:
            self._send_json(
                {
                    "error": "execution_adapter_health_route_review_adapter_mismatch",
                    "adapterId": adapter_id,
                    "productionRouteReviewId": production_route_review_id,
                },
                status=400,
            )
            return
        if production_route_review.get("status") != "route_review_recorded":
            self._send_json(
                {
                    "error": "execution_adapter_health_route_review_not_recorded",
                    "adapterProductionRouteReview": production_route_review,
                },
                status=409,
            )
            return
    exchange_id = (
        query.get("exchange", [""])[0].strip()
        or os.environ.get("CCXT_DEFAULT_EXCHANGE", "binance").strip()
        or "binance"
    )
    probe = probe_ccxt_sandbox_health(
        adapter_id=adapter_id,
        exchange_id=exchange_id,
        environ=self._execution_adapter_environment(),
        exchange_factory=type(self).execution_adapter_health_exchange_factory,
    )
    probe_payload = execution_adapter_health_probe_to_payload(probe)
    if production_route_review:
        _attach_production_route_review_to_health_probe(probe_payload, production_route_review)
    self._send_json({"adapterHealthProbe": probe_payload})
    return
