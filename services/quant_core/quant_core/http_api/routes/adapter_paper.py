from __future__ import annotations

from ..support.execution_export import _existing_adapter_paper_execution_for_ops_state
from ..support.stage5 import _parse_limit
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.execution import (
    build_execution_adapter_certification_apply,
    build_execution_adapter_controlled_restart_evidence,
    build_execution_adapter_ops_state,
    build_execution_adapter_paper_execution,
    build_execution_adapter_paper_order_lifecycle,
    build_execution_adapter_paper_route_runbook,
    build_execution_adapter_restart_acceptance,
    create_execution_adapter_certification_run,
    execution_adapter_certification_apply_payload_from_audit_event,
    execution_adapter_certification_apply_to_audit_event_payload,
    execution_adapter_certification_apply_to_payload,
    execution_adapter_certification_to_audit_event_payload,
    execution_adapter_certification_to_payload,
    execution_adapter_controlled_restart_evidence_payload_from_audit_event,
    execution_adapter_controlled_restart_evidence_to_audit_event_payload,
    execution_adapter_controlled_restart_evidence_to_payload,
    execution_adapter_ops_state_payload_from_audit_event,
    execution_adapter_ops_state_to_audit_event_payload,
    execution_adapter_ops_state_to_payload,
    execution_adapter_paper_execution_payload_from_audit_event,
    execution_adapter_paper_execution_to_audit_event_payload,
    execution_adapter_paper_execution_to_payload,
    execution_adapter_paper_order_lifecycle_payload_from_audit_event,
    execution_adapter_paper_order_lifecycle_to_audit_event_payload,
    execution_adapter_paper_order_lifecycle_to_payload,
    execution_adapter_paper_route_runbook_payload_from_audit_event,
    execution_adapter_paper_route_runbook_to_audit_event_payload,
    execution_adapter_paper_route_runbook_to_payload,
    execution_adapter_restart_acceptance_payload_from_audit_event,
    execution_adapter_restart_acceptance_to_audit_event_payload,
    execution_adapter_restart_acceptance_to_payload,
    execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event,
)
from quant_core.settings import build_execution_adapter_state_ledger
from urllib.parse import parse_qs

def post_execution_adapter_paper_order_lifecycles(self, parsed):
    payload = self._read_json_body()
    schema_dry_run_id = str(payload.get("sandboxOrderSchemaDryRunId") or "").strip()
    schema_dry_run_event = self.audit_event_store.get(schema_dry_run_id)
    schema_dry_run = (
        execution_adapter_sandbox_order_schema_dry_run_payload_from_audit_event(schema_dry_run_event)
        if schema_dry_run_event
        else None
    )
    if not schema_dry_run:
        self._send_json(
            {
                "error": "execution_adapter_sandbox_order_schema_dry_run_not_found",
                "sandboxOrderSchemaDryRunId": schema_dry_run_id,
            },
            status=404,
        )
        return
    try:
        paper_order_lifecycle = build_execution_adapter_paper_order_lifecycle(
            schema_dry_run,
            adapter_id=str(payload.get("adapterId") or ""),
            lifecycle_mode=str(payload.get("lifecycleMode") or "manual_paper_order_lifecycle_adapter"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_execution_adapter_paper_order_lifecycle", "detail": str(error)},
            status=400,
        )
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_paper_order_lifecycle_to_audit_event_payload(paper_order_lifecycle)
    )
    self._send_json(
        {
            "adapterPaperOrderLifecycle": execution_adapter_paper_order_lifecycle_to_payload(
                paper_order_lifecycle
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if paper_order_lifecycle.status == "blocked" else 201,
    )
    return


def post_execution_adapter_paper_route_runbooks(self, parsed):
    payload = self._read_json_body()
    paper_order_lifecycle_id = str(payload.get("paperOrderLifecycleId") or "").strip()
    paper_order_lifecycle_event = self.audit_event_store.get(paper_order_lifecycle_id)
    paper_order_lifecycle = (
        execution_adapter_paper_order_lifecycle_payload_from_audit_event(paper_order_lifecycle_event)
        if paper_order_lifecycle_event
        else None
    )
    if not paper_order_lifecycle:
        self._send_json(
            {
                "error": "execution_adapter_paper_order_lifecycle_not_found",
                "paperOrderLifecycleId": paper_order_lifecycle_id,
            },
            status=404,
        )
        return
    try:
        paper_route_runbook = build_execution_adapter_paper_route_runbook(
            paper_order_lifecycle,
            adapter_id=str(payload.get("adapterId") or ""),
            runbook_mode=str(payload.get("runbookMode") or "manual_paper_route_runbook"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_execution_adapter_paper_route_runbook", "detail": str(error)},
            status=400,
        )
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_paper_route_runbook_to_audit_event_payload(paper_route_runbook)
    )
    self._send_json(
        {
            "adapterPaperRouteRunbook": execution_adapter_paper_route_runbook_to_payload(
                paper_route_runbook
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if paper_route_runbook.status == "blocked" else 201,
    )
    return


def post_execution_adapter_ops_states(self, parsed):
    payload = self._read_json_body()
    paper_route_runbook_id = str(payload.get("paperRouteRunbookId") or "").strip()
    paper_route_runbook_event = self.audit_event_store.get(paper_route_runbook_id)
    paper_route_runbook = (
        execution_adapter_paper_route_runbook_payload_from_audit_event(paper_route_runbook_event)
        if paper_route_runbook_event
        else None
    )
    if not paper_route_runbook:
        self._send_json(
            {
                "error": "execution_adapter_paper_route_runbook_not_found",
                "paperRouteRunbookId": paper_route_runbook_id,
            },
            status=404,
        )
        return
    try:
        adapter_ops_state = build_execution_adapter_ops_state(
            paper_route_runbook,
            adapter_id=str(payload.get("adapterId") or ""),
            ops_mode=str(payload.get("opsMode") or "manual_adapter_ops_state"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_execution_adapter_ops_state", "detail": str(error)},
            status=400,
        )
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_ops_state_to_audit_event_payload(adapter_ops_state)
    )
    self._send_json(
        {
            "adapterOpsState": execution_adapter_ops_state_to_payload(adapter_ops_state),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if adapter_ops_state.status == "blocked" else 201,
    )
    return


def post_execution_adapter_paper_executions(self, parsed):
    payload = self._read_json_body()
    adapter_ops_state_id = str(payload.get("adapterOpsStateId") or "").strip()
    adapter_ops_state_event = self.audit_event_store.get(adapter_ops_state_id)
    adapter_ops_state = (
        execution_adapter_ops_state_payload_from_audit_event(adapter_ops_state_event)
        if adapter_ops_state_event
        else None
    )
    if not adapter_ops_state:
        self._send_json(
            {
                "error": "execution_adapter_ops_state_not_found",
                "adapterOpsStateId": adapter_ops_state_id,
            },
            status=404,
        )
        return
    try:
        adapter_paper_execution = build_execution_adapter_paper_execution(
            adapter_ops_state,
            adapter_id=str(payload.get("adapterId") or ""),
            paper_execution_mode=str(
                payload.get("paperExecutionMode") or "manual_adapter_paper_execution"
            ),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_execution_adapter_paper_execution", "detail": str(error)},
            status=400,
        )
        return
    if adapter_paper_execution.status == "paper_execution_recorded":
        existing_paper_execution = _existing_adapter_paper_execution_for_ops_state(
            self.audit_event_store,
            adapter_id=adapter_paper_execution.adapter_id,
            adapter_ops_state_id=adapter_paper_execution.adapter_ops_state_id,
        )
        if existing_paper_execution:
            self._send_json(
                {
                    "error": "execution_adapter_paper_execution_already_recorded",
                    "adapterOpsStateId": adapter_paper_execution.adapter_ops_state_id,
                    "existingAdapterPaperExecution": existing_paper_execution,
                },
                status=409,
            )
            return
    audit_event = self.audit_event_store.record(
        execution_adapter_paper_execution_to_audit_event_payload(adapter_paper_execution)
    )
    self._send_json(
        {
            "adapterPaperExecution": execution_adapter_paper_execution_to_payload(
                adapter_paper_execution
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if adapter_paper_execution.status == "blocked" else 201,
    )
    return


def post_execution_adapter_certifications(self, parsed):
    try:
        payload = self._read_json_body()
        certification = create_execution_adapter_certification_run(
            adapter_id=str(payload.get("adapterId") or ""),
            market=str(payload.get("market") or ""),
            route=str(payload.get("route") or ""),
            operator=str(payload.get("operator") or "local-operator"),
            started_at=payload.get("startedAt"),
            completed_at=payload.get("completedAt"),
            checks=payload.get("checks") if isinstance(payload.get("checks"), list) else [],
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_certification", "detail": str(error)}, status=400)
        return
    self.execution_adapter_certification_store.record(certification)
    audit_event = self.audit_event_store.record(
        execution_adapter_certification_to_audit_event_payload(certification)
    )
    self._send_json(
        {
            "adapterCertification": execution_adapter_certification_to_payload(certification),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=201,
    )
    return


def post_execution_adapter_certifications_apply(self, parsed):
    payload = self._read_json_body()
    certification_id = str(payload.get("certificationId") or "").strip()
    certification = self.execution_adapter_certification_store.get(certification_id)
    if not certification:
        self._send_json(
            {"error": "execution_adapter_certification_not_found", "certificationId": certification_id},
            status=404,
        )
        return
    try:
        certification_apply = build_execution_adapter_certification_apply(
            certification,
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_certification_apply", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_certification_apply_to_audit_event_payload(certification_apply)
    )
    self._send_json(
        {
            "certificationApply": execution_adapter_certification_apply_to_payload(certification_apply),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if certification_apply.status == "blocked" else 200,
    )
    return


def post_execution_adapter_certifications_restart_evidence(self, parsed):
    payload = self._read_json_body()
    apply_id = str(payload.get("applyId") or "").strip()
    apply_event = self.audit_event_store.get(apply_id)
    certification_apply = (
        execution_adapter_certification_apply_payload_from_audit_event(apply_event) if apply_event else None
    )
    if not certification_apply:
        self._send_json(
            {"error": "execution_adapter_certification_apply_not_found", "applyId": apply_id},
            status=404,
        )
        return
    try:
        restart_evidence = build_execution_adapter_controlled_restart_evidence(
            certification_apply,
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_controlled_restart_evidence", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_controlled_restart_evidence_to_audit_event_payload(restart_evidence)
    )
    self._send_json(
        {
            "controlledRestartEvidence": execution_adapter_controlled_restart_evidence_to_payload(
                restart_evidence
            ),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if restart_evidence.status == "blocked" else 200,
    )
    return


def post_execution_adapter_certifications_restart_acceptance(self, parsed):
    payload = self._read_json_body()
    evidence_id = str(payload.get("evidenceId") or "").strip()
    evidence_event = self.audit_event_store.get(evidence_id)
    controlled_restart_evidence = (
        execution_adapter_controlled_restart_evidence_payload_from_audit_event(evidence_event)
        if evidence_event
        else None
    )
    if not controlled_restart_evidence:
        self._send_json(
            {"error": "execution_adapter_controlled_restart_evidence_not_found", "evidenceId": evidence_id},
            status=404,
        )
        return
    try:
        restart_acceptance = build_execution_adapter_restart_acceptance(
            controlled_restart_evidence,
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_restart_acceptance", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_restart_acceptance_to_audit_event_payload(restart_acceptance)
    )
    self._send_json(
        {
            "restartAcceptance": execution_adapter_restart_acceptance_to_payload(restart_acceptance),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if restart_acceptance.status == "blocked" else 200,
    )
    return


def get_execution_adapter_ledger(self, parsed):
    settings = self._settings_status_payload()
    self._send_json({"adapterLedger": build_execution_adapter_state_ledger(settings)})
    return


def get_execution_adapter_paper_order_lifecycles(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_paper_order_lifecycle_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    lifecycle_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_paper_order_lifecycle",
        limit=50,
        query=adapter_id,
    )
    lifecycles = []
    for event in lifecycle_events:
        payload = execution_adapter_paper_order_lifecycle_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            lifecycles.append(payload)
        if len(lifecycles) >= limit:
            break
    self._send_json({"adapterPaperOrderLifecycles": lifecycles})
    return


def get_execution_adapter_paper_route_runbooks(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_paper_route_runbook_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    runbook_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_paper_route_runbook",
        limit=50,
        query=adapter_id,
    )
    runbooks = []
    for event in runbook_events:
        payload = execution_adapter_paper_route_runbook_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            runbooks.append(payload)
        if len(runbooks) >= limit:
            break
    self._send_json({"adapterPaperRouteRunbooks": runbooks})
    return


def get_execution_adapter_ops_states(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_ops_state_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    ops_state_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_ops_state",
        limit=50,
        query=adapter_id,
    )
    ops_states = []
    for event in ops_state_events:
        payload = execution_adapter_ops_state_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            ops_states.append(payload)
        if len(ops_states) >= limit:
            break
    self._send_json({"adapterOpsStates": ops_states})
    return


def get_execution_adapter_paper_executions(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_paper_execution_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    paper_execution_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_paper_execution",
        limit=50,
        query=adapter_id,
    )
    paper_executions = []
    for event in paper_execution_events:
        payload = execution_adapter_paper_execution_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            paper_executions.append(payload)
        if len(paper_executions) >= limit:
            break
    self._send_json({"adapterPaperExecutions": paper_executions})
    return


def get_execution_adapter_certifications_restart_acceptance(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_restart_acceptance_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    acceptance_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_restart_acceptance",
        limit=50,
        query=adapter_id,
    )
    restart_acceptances = []
    for event in acceptance_events:
        payload = execution_adapter_restart_acceptance_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            restart_acceptances.append(payload)
        if len(restart_acceptances) >= limit:
            break
    self._send_json({"restartAcceptances": restart_acceptances})
    return


def get_execution_adapter_certifications_restart_evidence(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_controlled_restart_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    evidence_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_controlled_restart_evidence",
        limit=50,
        query=adapter_id,
    )
    restart_evidence = []
    for event in evidence_events:
        payload = execution_adapter_controlled_restart_evidence_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            restart_evidence.append(payload)
        if len(restart_evidence) >= limit:
            break
    self._send_json({"controlledRestartEvidence": restart_evidence})
    return


def get_execution_adapter_certifications_applies(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_certification_apply_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    apply_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_certification_apply",
        limit=50,
        query=adapter_id,
    )
    certification_applies = []
    for event in apply_events:
        payload = execution_adapter_certification_apply_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            certification_applies.append(payload)
        if len(certification_applies) >= limit:
            break
    self._send_json({"certificationApplies": certification_applies})
    return


def get_execution_adapter_certifications(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_certification_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    certifications = self.execution_adapter_certification_store.list_by_adapter(adapter_id, limit=limit)
    self._send_json(
        {
            "adapterCertifications": [
                execution_adapter_certification_to_payload(certification) for certification in certifications
            ]
        }
    )
    return
