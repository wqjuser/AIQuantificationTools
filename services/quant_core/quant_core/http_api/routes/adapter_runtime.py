from __future__ import annotations

from ..support.stage5 import _parse_limit
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.execution import (
    build_execution_adapter_human_confirmation,
    build_execution_adapter_orchestration_dry_run,
    build_execution_adapter_orchestration_execution,
    build_execution_adapter_runtime_reload_acceptance,
    build_execution_adapter_runtime_reload_execution,
    build_execution_adapter_runtime_reload_plan,
    execution_adapter_environment_binding_payload_from_audit_event,
    execution_adapter_human_confirmation_payload_from_audit_event,
    execution_adapter_human_confirmation_to_audit_event_payload,
    execution_adapter_human_confirmation_to_payload,
    execution_adapter_orchestration_dry_run_payload_from_audit_event,
    execution_adapter_orchestration_dry_run_to_audit_event_payload,
    execution_adapter_orchestration_dry_run_to_payload,
    execution_adapter_orchestration_execution_payload_from_audit_event,
    execution_adapter_orchestration_execution_to_audit_event_payload,
    execution_adapter_orchestration_execution_to_payload,
    execution_adapter_runtime_reload_acceptance_payload_from_audit_event,
    execution_adapter_runtime_reload_acceptance_to_audit_event_payload,
    execution_adapter_runtime_reload_acceptance_to_payload,
    execution_adapter_runtime_reload_execution_payload_from_audit_event,
    execution_adapter_runtime_reload_execution_to_audit_event_payload,
    execution_adapter_runtime_reload_execution_to_payload,
    execution_adapter_runtime_reload_plan_payload_from_audit_event,
    execution_adapter_runtime_reload_plan_to_audit_event_payload,
    execution_adapter_runtime_reload_plan_to_payload,
)
from urllib.parse import parse_qs

def post_execution_adapter_runtime_reload_plans(self, parsed):
    payload = self._read_json_body()
    binding_id = str(payload.get("bindingId") or "").strip()
    binding_event = self.audit_event_store.get(binding_id)
    environment_binding = (
        execution_adapter_environment_binding_payload_from_audit_event(binding_event) if binding_event else None
    )
    if not environment_binding:
        self._send_json(
            {
                "error": "execution_adapter_environment_binding_not_found",
                "bindingId": binding_id,
            },
            status=404,
        )
        return
    try:
        runtime_reload_plan = build_execution_adapter_runtime_reload_plan(
            environment_binding,
            adapter_id=str(payload.get("adapterId") or ""),
            reload_mode=str(payload.get("reloadMode") or "manual_container_reload_plan"),
            maintenance_window_id=str(payload.get("maintenanceWindowId") or ""),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_runtime_reload_plan", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_runtime_reload_plan_to_audit_event_payload(runtime_reload_plan)
    )
    self._send_json(
        {
            "adapterRuntimeReloadPlan": execution_adapter_runtime_reload_plan_to_payload(runtime_reload_plan),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if runtime_reload_plan.status == "blocked" else 201,
    )
    return


def post_execution_adapter_runtime_reload_executions(self, parsed):
    payload = self._read_json_body()
    plan_id = str(payload.get("planId") or "").strip()
    plan_event = self.audit_event_store.get(plan_id)
    runtime_reload_plan = (
        execution_adapter_runtime_reload_plan_payload_from_audit_event(plan_event) if plan_event else None
    )
    if not runtime_reload_plan:
        self._send_json(
            {
                "error": "execution_adapter_runtime_reload_plan_not_found",
                "planId": plan_id,
            },
            status=404,
        )
        return
    try:
        runtime_reload_execution = build_execution_adapter_runtime_reload_execution(
            runtime_reload_plan,
            adapter_id=str(payload.get("adapterId") or ""),
            execution_mode=str(payload.get("executionMode") or "manual_controlled_reload"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_runtime_reload_execution", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_runtime_reload_execution_to_audit_event_payload(runtime_reload_execution)
    )
    self._send_json(
        {
            "adapterRuntimeReloadExecution": execution_adapter_runtime_reload_execution_to_payload(runtime_reload_execution),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if runtime_reload_execution.status == "blocked" else 201,
    )
    return


def post_execution_adapter_runtime_reload_acceptances(self, parsed):
    payload = self._read_json_body()
    execution_id = str(payload.get("executionId") or "").strip()
    execution_event = self.audit_event_store.get(execution_id)
    runtime_reload_execution = (
        execution_adapter_runtime_reload_execution_payload_from_audit_event(execution_event)
        if execution_event
        else None
    )
    if not runtime_reload_execution:
        self._send_json(
            {
                "error": "execution_adapter_runtime_reload_execution_not_found",
                "executionId": execution_id,
            },
            status=404,
        )
        return
    try:
        runtime_reload_acceptance = build_execution_adapter_runtime_reload_acceptance(
            runtime_reload_execution,
            adapter_id=str(payload.get("adapterId") or ""),
            acceptance_mode=str(payload.get("acceptanceMode") or "manual_runtime_reload_acceptance"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_runtime_reload_acceptance", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_runtime_reload_acceptance_to_audit_event_payload(runtime_reload_acceptance)
    )
    self._send_json(
        {
            "adapterRuntimeReloadAcceptance": execution_adapter_runtime_reload_acceptance_to_payload(runtime_reload_acceptance),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if runtime_reload_acceptance.status == "blocked" else 201,
    )
    return


def post_execution_adapter_orchestration_dry_runs(self, parsed):
    payload = self._read_json_body()
    acceptance_id = str(payload.get("acceptanceId") or "").strip()
    acceptance_event = self.audit_event_store.get(acceptance_id)
    runtime_reload_acceptance = (
        execution_adapter_runtime_reload_acceptance_payload_from_audit_event(acceptance_event)
        if acceptance_event
        else None
    )
    if not runtime_reload_acceptance:
        self._send_json(
            {
                "error": "execution_adapter_runtime_reload_acceptance_not_found",
                "acceptanceId": acceptance_id,
            },
            status=404,
        )
        return
    try:
        orchestration_dry_run = build_execution_adapter_orchestration_dry_run(
            runtime_reload_acceptance,
            adapter_id=str(payload.get("adapterId") or ""),
            orchestration_mode=str(payload.get("orchestrationMode") or "manual_adapter_orchestration_dry_run"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_orchestration_dry_run", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_orchestration_dry_run_to_audit_event_payload(orchestration_dry_run)
    )
    self._send_json(
        {
            "adapterOrchestrationDryRun": execution_adapter_orchestration_dry_run_to_payload(orchestration_dry_run),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if orchestration_dry_run.status == "blocked" else 201,
    )
    return


def post_execution_adapter_orchestration_executions(self, parsed):
    payload = self._read_json_body()
    dry_run_id = str(payload.get("dryRunId") or "").strip()
    dry_run_event = self.audit_event_store.get(dry_run_id)
    orchestration_dry_run = (
        execution_adapter_orchestration_dry_run_payload_from_audit_event(dry_run_event)
        if dry_run_event
        else None
    )
    if not orchestration_dry_run:
        self._send_json(
            {
                "error": "execution_adapter_orchestration_dry_run_not_found",
                "dryRunId": dry_run_id,
            },
            status=404,
        )
        return
    try:
        orchestration_execution = build_execution_adapter_orchestration_execution(
            orchestration_dry_run,
            adapter_id=str(payload.get("adapterId") or ""),
            orchestration_execution_mode=str(
                payload.get("orchestrationExecutionMode") or "manual_adapter_orchestration_execution"
            ),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_orchestration_execution", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_orchestration_execution_to_audit_event_payload(orchestration_execution)
    )
    self._send_json(
        {
            "adapterOrchestrationExecution": execution_adapter_orchestration_execution_to_payload(orchestration_execution),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if orchestration_execution.status == "blocked" else 201,
    )
    return


def post_execution_adapter_human_confirmations(self, parsed):
    payload = self._read_json_body()
    orchestration_execution_id = str(payload.get("orchestrationExecutionId") or "").strip()
    orchestration_execution_event = self.audit_event_store.get(orchestration_execution_id)
    orchestration_execution = (
        execution_adapter_orchestration_execution_payload_from_audit_event(orchestration_execution_event)
        if orchestration_execution_event
        else None
    )
    if not orchestration_execution:
        self._send_json(
            {
                "error": "execution_adapter_orchestration_execution_not_found",
                "orchestrationExecutionId": orchestration_execution_id,
            },
            status=404,
        )
        return
    try:
        human_confirmation = build_execution_adapter_human_confirmation(
            orchestration_execution,
            adapter_id=str(payload.get("adapterId") or ""),
            confirmation_mode=str(payload.get("confirmationMode") or "manual_final_human_confirmation"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_human_confirmation", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_human_confirmation_to_audit_event_payload(human_confirmation)
    )
    self._send_json(
        {
            "adapterHumanConfirmation": execution_adapter_human_confirmation_to_payload(human_confirmation),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if human_confirmation.status == "blocked" else 201,
    )
    return


def get_execution_adapter_runtime_reload_plans(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_runtime_reload_plan_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    reload_plan_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_runtime_reload_plan",
        limit=50,
        query=adapter_id,
    )
    runtime_reload_plans = []
    for event in reload_plan_events:
        payload = execution_adapter_runtime_reload_plan_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            runtime_reload_plans.append(payload)
        if len(runtime_reload_plans) >= limit:
            break
    self._send_json({"adapterRuntimeReloadPlans": runtime_reload_plans})
    return


def get_execution_adapter_runtime_reload_executions(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_runtime_reload_execution_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    reload_execution_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_runtime_reload_execution",
        limit=50,
        query=adapter_id,
    )
    runtime_reload_executions = []
    for event in reload_execution_events:
        payload = execution_adapter_runtime_reload_execution_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            runtime_reload_executions.append(payload)
        if len(runtime_reload_executions) >= limit:
            break
    self._send_json({"adapterRuntimeReloadExecutions": runtime_reload_executions})
    return


def get_execution_adapter_runtime_reload_acceptances(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_runtime_reload_acceptance_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    reload_acceptance_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_runtime_reload_acceptance",
        limit=50,
        query=adapter_id,
    )
    runtime_reload_acceptances = []
    for event in reload_acceptance_events:
        payload = execution_adapter_runtime_reload_acceptance_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            runtime_reload_acceptances.append(payload)
        if len(runtime_reload_acceptances) >= limit:
            break
    self._send_json({"adapterRuntimeReloadAcceptances": runtime_reload_acceptances})
    return


def get_execution_adapter_orchestration_dry_runs(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_orchestration_dry_run_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    dry_run_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_orchestration_dry_run",
        limit=50,
        query=adapter_id,
    )
    orchestration_dry_runs = []
    for event in dry_run_events:
        payload = execution_adapter_orchestration_dry_run_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            orchestration_dry_runs.append(payload)
        if len(orchestration_dry_runs) >= limit:
            break
    self._send_json({"adapterOrchestrationDryRuns": orchestration_dry_runs})
    return


def get_execution_adapter_orchestration_executions(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_orchestration_execution_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    orchestration_execution_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_orchestration_execution",
        limit=50,
        query=adapter_id,
    )
    orchestration_executions = []
    for event in orchestration_execution_events:
        payload = execution_adapter_orchestration_execution_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            orchestration_executions.append(payload)
        if len(orchestration_executions) >= limit:
            break
    self._send_json({"adapterOrchestrationExecutions": orchestration_executions})
    return


def get_execution_adapter_human_confirmations(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_human_confirmation_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    human_confirmation_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_human_confirmation",
        limit=50,
        query=adapter_id,
    )
    human_confirmations = []
    for event in human_confirmation_events:
        payload = execution_adapter_human_confirmation_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            human_confirmations.append(payload)
        if len(human_confirmations) >= limit:
            break
    self._send_json({"adapterHumanConfirmations": human_confirmations})
    return
