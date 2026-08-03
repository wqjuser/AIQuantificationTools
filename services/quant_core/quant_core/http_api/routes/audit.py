from __future__ import annotations

from ..support.stage5 import (
    _parse_limit,
    _parse_offset,
)
from quant_core.audit_events import (
    audit_event_record_to_payload,
    is_protected_production_authority_audit_event,
)
from quant_core.audit_signing import (
    AUDIT_REPORT_IMPORT_VERIFICATION_INVALID_REASON,
    audit_report_verification_to_payload,
    audit_signing_key_controlled_restart_evidence_to_audit_event_payload,
    audit_signing_key_controlled_restart_evidence_to_payload,
    audit_signing_key_environment_binding_payload_from_audit_event,
    audit_signing_key_environment_binding_to_audit_event_payload,
    audit_signing_key_environment_binding_to_payload,
    audit_signing_key_registry_to_payload,
    audit_signing_key_rotation_acceptance_payload_from_audit_event,
    audit_signing_key_rotation_acceptance_to_audit_event_payload,
    audit_signing_key_rotation_acceptance_to_payload,
    audit_signing_key_rotation_apply_to_payload,
    audit_signing_key_rotation_plan_to_payload,
    audit_signing_key_runtime_reload_execution_payload_from_audit_event,
    audit_signing_key_runtime_reload_execution_to_audit_event_payload,
    audit_signing_key_runtime_reload_execution_to_payload,
    audit_signing_key_runtime_reload_plan_payload_from_audit_event,
    audit_signing_key_runtime_reload_plan_to_audit_event_payload,
    audit_signing_key_runtime_reload_plan_to_payload,
    audit_signing_key_secret_materialization_payload_from_audit_event,
    audit_signing_key_secret_materialization_to_audit_event_payload,
    audit_signing_key_secret_materialization_to_payload,
)
from quant_core.golden_path import build_golden_path_status
from quant_core.market_calendar import build_market_calendar_status
from urllib.parse import parse_qs

def post_audit_events(self, parsed):
    try:
        payload = self._read_json_body()
        event_id = str(payload.get("eventId") or "") if isinstance(payload, dict) else ""
        existing = self.audit_event_store.get(event_id) if event_id else None
        if (
            isinstance(payload, dict)
            and is_protected_production_authority_audit_event(
                payload.get("eventType"), event_id
            )
            or existing is not None
            and is_protected_production_authority_audit_event(
                existing.event_type, existing.event_id
            )
        ):
            raise ValueError("production authority audit events are reserved")
        event = self.audit_event_store.record(payload)
    except ValueError as error:
        self._send_json({"error": "invalid_audit_event", "detail": str(error)}, status=400)
        return
    self._send_json({"event": audit_event_record_to_payload(event)}, status=201)
    return


def post_audit_signing_keys_rotation_plan(self, parsed):
    payload = self._read_json_body()
    try:
        registry = self._audit_report_signer().registry
        rotation_plan = audit_signing_key_rotation_plan_to_payload(
            registry,
            proposed_key_id=str(payload.get("proposedKeyId") or ""),
            proposed_signer=str(payload.get("proposedSigner") or ""),
            proposed_chain_id=str(payload.get("proposedChainId") or ""),
        )
    except ValueError as error:
        self._send_json({"error": "invalid_audit_signing_key_rotation_plan", "detail": str(error)}, status=400)
        return
    self._send_json({"rotationPlan": rotation_plan})
    return


def post_audit_signing_keys_rotation_apply(self, parsed):
    payload = self._read_json_body()
    try:
        registry = self._audit_report_signer().registry
        rotation_apply = audit_signing_key_rotation_apply_to_payload(
            registry,
            rotation_plan=payload.get("rotationPlan") if isinstance(payload.get("rotationPlan"), dict) else {},
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_audit_signing_key_rotation_apply", "detail": str(error)}, status=400)
        return
    self._send_json(
        {"rotationApply": rotation_apply},
        status=409 if rotation_apply["status"] == "blocked" else 200,
    )
    return


def post_audit_signing_keys_rotation_restart_evidence(self, parsed):
    payload = self._read_json_body()
    apply_event_id = str(payload.get("applyEventId") or "").strip()
    apply_event = self.audit_event_store.get(apply_event_id)
    if not apply_event:
        self._send_json({"error": "audit_signing_key_rotation_apply_event_not_found", "applyEventId": apply_event_id}, status=404)
        return
    try:
        restart_evidence = audit_signing_key_controlled_restart_evidence_to_payload(
            apply_event,
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
        audit_event = self.audit_event_store.record(
            audit_signing_key_controlled_restart_evidence_to_audit_event_payload(restart_evidence)
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_audit_signing_key_controlled_restart_evidence", "detail": str(error)},
            status=400,
        )
        return
    self._send_json(
        {
            "restartEvidence": restart_evidence,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if restart_evidence["status"] == "blocked" else 201,
    )
    return


def post_audit_signing_keys_secret_materializations(self, parsed):
    payload = self._read_json_body()
    plan_event_id = str(payload.get("planEventId") or "").strip()
    plan_event = self.audit_event_store.get(plan_event_id)
    if not plan_event:
        self._send_json({"error": "audit_signing_key_rotation_plan_event_not_found", "planEventId": plan_event_id}, status=404)
        return
    try:
        secret_materialization = audit_signing_key_secret_materialization_to_payload(
            plan_event,
            backend=str(payload.get("backend") or ""),
            manifest_path=str(payload.get("manifestPath") or ""),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
        audit_event = self.audit_event_store.record(
            audit_signing_key_secret_materialization_to_audit_event_payload(secret_materialization)
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_audit_signing_key_secret_materialization", "detail": str(error)},
            status=400,
        )
        return
    self._send_json(
        {
            "secretMaterialization": secret_materialization,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if secret_materialization["status"] == "blocked" else 201,
    )
    return


def post_audit_signing_keys_environment_bindings(self, parsed):
    payload = self._read_json_body()
    materialization_id = str(payload.get("materializationId") or "").strip()
    materialization_event = self.audit_event_store.get(materialization_id)
    materialization = (
        audit_signing_key_secret_materialization_payload_from_audit_event(materialization_event)
        if materialization_event
        else None
    )
    if not materialization:
        self._send_json(
            {
                "error": "audit_signing_key_secret_materialization_not_found",
                "materializationId": materialization_id,
            },
            status=404,
        )
        return
    try:
        environment_binding = audit_signing_key_environment_binding_to_payload(
            materialization,
            binding_mode=str(payload.get("bindingMode") or "container_env_reference"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
        audit_event = self.audit_event_store.record(
            audit_signing_key_environment_binding_to_audit_event_payload(environment_binding)
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_audit_signing_key_environment_binding", "detail": str(error)},
            status=400,
        )
        return
    self._send_json(
        {
            "environmentBinding": environment_binding,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if environment_binding["status"] == "blocked" else 201,
    )
    return


def post_audit_signing_keys_runtime_reload_plans(self, parsed):
    payload = self._read_json_body()
    binding_id = str(payload.get("bindingId") or "").strip()
    binding_event = self.audit_event_store.get(binding_id)
    environment_binding = (
        audit_signing_key_environment_binding_payload_from_audit_event(binding_event)
        if binding_event
        else None
    )
    if not environment_binding:
        self._send_json(
            {
                "error": "audit_signing_key_environment_binding_not_found",
                "bindingId": binding_id,
            },
            status=404,
        )
        return
    try:
        runtime_reload_plan = audit_signing_key_runtime_reload_plan_to_payload(
            environment_binding,
            reload_mode=str(payload.get("reloadMode") or "manual_container_reload_plan"),
            maintenance_window_id=str(payload.get("maintenanceWindowId") or ""),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
        audit_event = self.audit_event_store.record(
            audit_signing_key_runtime_reload_plan_to_audit_event_payload(runtime_reload_plan)
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_audit_signing_key_runtime_reload_plan", "detail": str(error)},
            status=400,
        )
        return
    self._send_json(
        {
            "runtimeReloadPlan": runtime_reload_plan,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if runtime_reload_plan["status"] == "blocked" else 201,
    )
    return


def post_audit_signing_keys_runtime_reload_executions(self, parsed):
    payload = self._read_json_body()
    plan_id = str(payload.get("planId") or "").strip()
    plan_event = self.audit_event_store.get(plan_id)
    runtime_reload_plan = (
        audit_signing_key_runtime_reload_plan_payload_from_audit_event(plan_event)
        if plan_event
        else None
    )
    if not runtime_reload_plan:
        self._send_json(
            {
                "error": "audit_signing_key_runtime_reload_plan_not_found",
                "planId": plan_id,
            },
            status=404,
        )
        return
    try:
        runtime_reload_execution = audit_signing_key_runtime_reload_execution_to_payload(
            runtime_reload_plan,
            execution_mode=str(payload.get("executionMode") or "manual_controlled_reload_evidence"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
        audit_event = self.audit_event_store.record(
            audit_signing_key_runtime_reload_execution_to_audit_event_payload(runtime_reload_execution)
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_audit_signing_key_runtime_reload_execution", "detail": str(error)},
            status=400,
        )
        return
    self._send_json(
        {
            "runtimeReloadExecution": runtime_reload_execution,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if runtime_reload_execution["status"] == "blocked" else 201,
    )
    return


def post_audit_signing_keys_rotation_acceptances(self, parsed):
    payload = self._read_json_body()
    execution_id = str(payload.get("executionId") or "").strip()
    execution_event = self.audit_event_store.get(execution_id)
    runtime_reload_execution = (
        audit_signing_key_runtime_reload_execution_payload_from_audit_event(execution_event)
        if execution_event
        else None
    )
    if not runtime_reload_execution:
        self._send_json(
            {
                "error": "audit_signing_key_runtime_reload_execution_not_found",
                "executionId": execution_id,
            },
            status=404,
        )
        return
    try:
        rotation_acceptance = audit_signing_key_rotation_acceptance_to_payload(
            runtime_reload_execution,
            acceptance_mode=str(payload.get("acceptanceMode") or "manual_rotation_acceptance"),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
        audit_event = self.audit_event_store.record(
            audit_signing_key_rotation_acceptance_to_audit_event_payload(rotation_acceptance)
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_audit_signing_key_rotation_acceptance", "detail": str(error)},
            status=400,
        )
        return
    self._send_json(
        {
            "rotationAcceptance": rotation_acceptance,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if rotation_acceptance["status"] == "blocked" else 201,
    )
    return


def post_audit_reports_sign(self, parsed):
    payload = self._read_json_body()
    event_id = str(payload.get("eventId") or "").strip()
    record = self.audit_event_store.get(event_id)
    if not record:
        self._send_json({"error": "audit_event_not_found", "eventId": event_id}, status=404)
        return
    try:
        signer = self._audit_report_signer()
        signed_event = self.audit_event_store.record(signer.sign_event(record))
        verification, verified_event_payload = signer.verify_event(signed_event)
        verified_event = self.audit_event_store.record(verified_event_payload)
    except ValueError as error:
        detail = str(error)
        self._send_json(
            {"error": "invalid_audit_report_signature", "detail": detail},
            status=409 if detail == AUDIT_REPORT_IMPORT_VERIFICATION_INVALID_REASON else 400,
        )
        return
    signature = verified_event.metadata.get("signature") if isinstance(verified_event.metadata, dict) else {}
    self._send_json(
        {
            "event": audit_event_record_to_payload(verified_event),
            "signature": signature if isinstance(signature, dict) else {},
            "verification": audit_report_verification_to_payload(verification),
        }
    )
    return


def post_audit_reports_verify(self, parsed):
    payload = self._read_json_body()
    event_id = str(payload.get("eventId") or "").strip()
    record = self.audit_event_store.get(event_id)
    if not record:
        self._send_json({"error": "audit_event_not_found", "eventId": event_id}, status=404)
        return
    try:
        verification, verified_event_payload = self._audit_report_signer().verify_event(record)
        verified_event = self.audit_event_store.record(verified_event_payload)
    except ValueError as error:
        self._send_json({"error": "invalid_audit_report_signature", "detail": str(error)}, status=400)
        return
    signature = verified_event.metadata.get("signature") if isinstance(verified_event.metadata, dict) else {}
    self._send_json(
        {
            "event": audit_event_record_to_payload(verified_event),
            "signature": signature if isinstance(signature, dict) else {},
            "verification": audit_report_verification_to_payload(verification),
        },
        status=409 if verification.status == "invalid" else 200,
    )
    return


def post_audit_reports_verify_package(self, parsed):
    payload = self._read_json_body()
    try:
        verification, verified_event_payload = self._audit_report_signer().verify_report_artifact(
            payload.get("report") if isinstance(payload.get("report"), dict) else {}
        )
    except ValueError as error:
        self._send_json({"error": "invalid_audit_report_package_signature", "detail": str(error)}, status=400)
        return
    metadata = verified_event_payload.get("metadata", {})
    signature = metadata.get("signature", {}) if isinstance(metadata, dict) else {}
    self._send_json(
        {
            "event": verified_event_payload,
            "signature": signature if isinstance(signature, dict) else {},
            "verification": audit_report_verification_to_payload(verification),
        },
        status=409 if verification.status == "invalid" else 200,
    )
    return


def post_audit_reports_revoke(self, parsed):
    payload = self._read_json_body()
    event_id = str(payload.get("eventId") or "").strip()
    reason = str(payload.get("reason") or "manual audit revocation").strip()
    record = self.audit_event_store.get(event_id)
    if not record:
        self._send_json({"error": "audit_event_not_found", "eventId": event_id}, status=404)
        return
    try:
        verification, revoked_event_payload = self._audit_report_signer().revoke_event(record, reason=reason)
        revoked_event = self.audit_event_store.record(revoked_event_payload)
    except ValueError as error:
        self._send_json({"error": "invalid_audit_report_signature", "detail": str(error)}, status=409)
        return
    signature = revoked_event.metadata.get("signature") if isinstance(revoked_event.metadata, dict) else {}
    self._send_json(
        {
            "event": audit_event_record_to_payload(revoked_event),
            "signature": signature if isinstance(signature, dict) else {},
            "verification": audit_report_verification_to_payload(verification),
        }
    )
    return


def get_audit_signing_keys(self, parsed):
    try:
        registry = self._audit_report_signer().registry
    except ValueError as error:
        self._send_json({"error": "invalid_audit_signing_key_registry", "detail": str(error)}, status=400)
        return
    self._send_json({"registry": audit_signing_key_registry_to_payload(registry)})
    return


def get_audit_signing_keys_secret_materializations(self, parsed):
    query = parse_qs(parsed.query)
    proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
    limit = _parse_limit(query.get("limit", ["20"])[0])
    materialization_events = self.audit_event_store.list_recent(
        event_type="audit_signing_key_secret_materialization",
        limit=50,
        query=proposed_key_id,
    )
    materializations = []
    for event in materialization_events:
        payload = audit_signing_key_secret_materialization_payload_from_audit_event(event)
        if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
            materializations.append(payload)
        if len(materializations) >= limit:
            break
    self._send_json({"secretMaterializations": materializations})
    return


def get_audit_signing_keys_environment_bindings(self, parsed):
    query = parse_qs(parsed.query)
    proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
    limit = _parse_limit(query.get("limit", ["20"])[0])
    binding_events = self.audit_event_store.list_recent(
        event_type="audit_signing_key_environment_binding",
        limit=50,
        query=proposed_key_id,
    )
    environment_bindings = []
    for event in binding_events:
        payload = audit_signing_key_environment_binding_payload_from_audit_event(event)
        if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
            environment_bindings.append(payload)
        if len(environment_bindings) >= limit:
            break
    self._send_json({"environmentBindings": environment_bindings})
    return


def get_audit_signing_keys_runtime_reload_plans(self, parsed):
    query = parse_qs(parsed.query)
    proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
    limit = _parse_limit(query.get("limit", ["20"])[0])
    plan_events = self.audit_event_store.list_recent(
        event_type="audit_signing_key_runtime_reload_plan",
        limit=50,
        query=proposed_key_id,
    )
    runtime_reload_plans = []
    for event in plan_events:
        payload = audit_signing_key_runtime_reload_plan_payload_from_audit_event(event)
        if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
            runtime_reload_plans.append(payload)
        if len(runtime_reload_plans) >= limit:
            break
    self._send_json({"runtimeReloadPlans": runtime_reload_plans})
    return


def get_audit_signing_keys_runtime_reload_executions(self, parsed):
    query = parse_qs(parsed.query)
    proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
    limit = _parse_limit(query.get("limit", ["20"])[0])
    execution_events = self.audit_event_store.list_recent(
        event_type="audit_signing_key_runtime_reload_execution",
        limit=50,
        query=proposed_key_id,
    )
    runtime_reload_executions = []
    for event in execution_events:
        payload = audit_signing_key_runtime_reload_execution_payload_from_audit_event(event)
        if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
            runtime_reload_executions.append(payload)
        if len(runtime_reload_executions) >= limit:
            break
    self._send_json({"runtimeReloadExecutions": runtime_reload_executions})
    return


def get_audit_signing_keys_rotation_acceptances(self, parsed):
    query = parse_qs(parsed.query)
    proposed_key_id = query.get("proposedKeyId", [""])[0].strip()
    limit = _parse_limit(query.get("limit", ["20"])[0])
    acceptance_events = self.audit_event_store.list_recent(
        event_type="audit_signing_key_rotation_acceptance",
        limit=50,
        query=proposed_key_id,
    )
    rotation_acceptances = []
    for event in acceptance_events:
        payload = audit_signing_key_rotation_acceptance_payload_from_audit_event(event)
        if payload and (not proposed_key_id or payload.get("proposedActiveKeyId") == proposed_key_id):
            rotation_acceptances.append(payload)
        if len(rotation_acceptances) >= limit:
            break
    self._send_json({"rotationAcceptances": rotation_acceptances})
    return


def get_golden_path_status(self, parsed):
    query = parse_qs(parsed.query)
    market = query.get("market", ["ashare"])[0]
    symbol = query.get("symbol", ["600000"])[0]
    timeframe = query.get("timeframe", ["1d"])[0]
    context_runs = [
        run
        for run in self.run_store.list_recent(limit=50)
        if run.market == market and run.symbol == symbol and run.timeframe == timeframe
    ]
    latest_run = context_runs[0] if context_runs else None
    paper_executions = self.paper_execution_store.list_by_run(latest_run.run_id, limit=20) if latest_run else []
    try:
        market_calendar = None if latest_run else build_market_calendar_status(market)
    except ValueError:
        market_calendar = None
    cache_context = self.cache.context(market, symbol, timeframe)
    auto_trading = self._auto_paper_trading_service().snapshot()
    self._send_json(
        {
            "goldenPath": build_golden_path_status(
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                settings=self._settings_status_payload(
                    cache_contexts=[cache_context] if cache_context else [],
                    auto_trading=auto_trading,
                ),
                runs=context_runs,
                paper_executions=paper_executions,
                ai_reviews=self.ai_review_store.list_by_run(latest_run.run_id, limit=20) if latest_run else [],
                watchlist_refreshes=self.watchlist_cache_refresh_store.list_recent(limit=10),
                market_calendar=market_calendar,
                auto_trading=auto_trading,
            )
        }
    )
    return


def get_audit_events(self, parsed):
    query = parse_qs(parsed.query)
    run_id = query.get("runId", [""])[0].strip() or None
    event_type = query.get("eventType", [""])[0].strip() or None
    limit = _parse_limit(query.get("limit", ["20"])[0])
    offset = _parse_offset(query.get("offset", ["0"])[0])
    search_query = query.get("query", [""])[0].strip()
    events = self.audit_event_store.list_recent(
        run_id=run_id,
        event_type=event_type,
        limit=limit,
        offset=offset,
        query=search_query,
    )
    total = self.audit_event_store.count(run_id=run_id, event_type=event_type, query=search_query)
    self._send_json(
        {
            "events": [audit_event_record_to_payload(event) for event in events],
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total,
                "query": search_query,
            },
        }
    )
    return
