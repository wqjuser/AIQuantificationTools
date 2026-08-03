from __future__ import annotations

from ..support.p0 import _portfolio_backtest_from_payload
from ..support.research_import_codecs import (
    _find_duplicate_portfolio_paper_order_batch,
    _find_portfolio_paper_order_batch,
    _find_portfolio_paper_order_lifecycle_row,
    _parse_positive_float,
    _portfolio_paper_order_adapter_evidence_by_order_id,
)
from ..support.stage5 import (
    _parse_limit,
    _portfolio_m5_query,
    _stage4_portfolio_workflow_from_payload,
    _stage4_portfolio_workflow_query,
)
from datetime import datetime
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.execution import (
    build_portfolio_paper_order_lifecycle,
    build_portfolio_paper_order_replay,
    build_portfolio_paper_order_state_history,
    create_portfolio_paper_order_approval,
    create_portfolio_paper_order_batch,
    create_portfolio_paper_order_simulation,
    portfolio_paper_order_approval_to_audit_event_payload,
    portfolio_paper_order_approval_to_payload,
    portfolio_paper_order_approvals_to_map,
    portfolio_paper_order_batch_to_audit_event_payload,
    portfolio_paper_order_batch_to_payload,
    portfolio_paper_order_simulation_to_audit_event_payload,
    portfolio_paper_order_simulation_to_payload,
)
from quant_core.portfolio_backtest import portfolio_backtest_run_to_payload
from quant_core.stage4_portfolio import validate_stage4_portfolio_workflow_snapshot
from urllib.parse import parse_qs

def post_portfolio_workflows(self, parsed):
    try:
        snapshot, operator = _stage4_portfolio_workflow_from_payload(
            self._read_json_body(),
            run_store=self.run_store,
            batch_store=self.portfolio_paper_order_store,
            approval_store=self.portfolio_paper_order_approval_store,
            simulation_store=self.portfolio_paper_order_simulation_store,
        )
        audit_event = self.audit_event_store.record(
            {
                "schemaVersion": 1,
                "eventId": snapshot["workflowId"],
                "eventType": "stage4_portfolio_workflow",
                "runId": snapshot["baseRunId"],
                "createdAt": snapshot["generatedAt"],
                "stage": "stage4-portfolio-workflow",
                "source": operator,
                "summary": f"Recorded authoritative Stage 4 portfolio workflow for {snapshot['baseRunId']}.",
                "detail": "Portfolio, paper evidence, state history, and replay were rebuilt from server stores.",
                "metadata": {"snapshot": snapshot},
            }
        )
    except LookupError as error:
        self._send_json(
            {"error": "stage4_portfolio_workflow_evidence_not_found", "detail": str(error)},
            status=404,
        )
        return
    except ValueError as error:
        self._send_json({"error": "invalid_stage4_portfolio_workflow", "detail": str(error)}, status=400)
        return
    self._send_json(
        {"workflow": snapshot, "auditEvent": audit_event_record_to_payload(audit_event)},
        status=201,
    )
    return


def post_portfolio_risk_assessments(self, parsed):
    try:
        assessment = self._portfolio_m5_service().create(self._read_json_body())
    except LookupError as error:
        self._send_json({"error": str(error), "detail": str(error)}, status=404)
        return
    except ValueError as error:
        self._send_json(
            {"error": "invalid_portfolio_risk_assessment", "detail": str(error)},
            status=400,
        )
        return
    self._send_json({"assessment": assessment}, status=201)
    return


def post_portfolio_backtest(self, parsed):
    try:
        portfolio = _portfolio_backtest_from_payload(self._read_json_body(), self.run_store)
    except LookupError as error:
        self._send_json({"error": "research_run_not_found", "detail": str(error)}, status=404)
        return
    except ValueError as error:
        self._send_json({"error": "invalid_portfolio_backtest", "detail": str(error)}, status=400)
        return
    self._send_json({"portfolio": portfolio_backtest_run_to_payload(portfolio)})
    return


def post_portfolio_paper_orders(self, parsed):
    try:
        payload = self._read_json_body()
        batch = create_portfolio_paper_order_batch(
            base_run_id=str(payload.get("baseRunId") or ""),
            portfolio_name=str(payload.get("portfolioName") or ""),
            orders=payload.get("orders") if isinstance(payload.get("orders"), list) else [],
            source=str(payload.get("source") or "portfolio_backtest"),
        )
    except ValueError as error:
        self._send_json({"error": "invalid_portfolio_paper_orders", "detail": str(error)}, status=400)
        return
    existing_batch = _find_duplicate_portfolio_paper_order_batch(
        self.portfolio_paper_order_store,
        batch,
    )
    if existing_batch is not None:
        self._send_json(
            {
                "error": "portfolio_paper_order_batch_already_recorded",
                "detail": existing_batch.batch_id,
                "existingBatch": portfolio_paper_order_batch_to_payload(existing_batch),
                "portfolioPaperOrderLifecycle": build_portfolio_paper_order_lifecycle(existing_batch),
            },
            status=409,
        )
        return
    self.portfolio_paper_order_store.record(batch)
    audit_event = self.audit_event_store.record(portfolio_paper_order_batch_to_audit_event_payload(batch))
    self._send_json(
        {
            "portfolioPaperOrderBatch": portfolio_paper_order_batch_to_payload(batch),
            "portfolioPaperOrderLifecycle": build_portfolio_paper_order_lifecycle(batch),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=201,
    )
    return


def post_portfolio_paper_order_approvals(self, parsed):
    try:
        payload = self._read_json_body()
        approval = create_portfolio_paper_order_approval(
            base_run_id=str(payload.get("baseRunId") or ""),
            batch_id=str(payload.get("batchId") or ""),
            order_id=str(payload.get("orderId") or ""),
            approved=bool(payload.get("approved")),
            reviewer=str(payload.get("reviewer") or ""),
            reviewed_at=payload.get("reviewedAt"),
            reason=str(payload.get("reason") or ""),
        )
        batch = _find_portfolio_paper_order_batch(
            self.portfolio_paper_order_store,
            approval.base_run_id,
            approval.batch_id,
        )
        if not any(str(order.get("orderId") or "") == approval.order_id for order in batch.orders):
            raise ValueError("portfolio_paper_order_approval_order_not_found")
        existing_simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(
            approval.base_run_id
        )
        if any(
            simulation.batch_id == approval.batch_id
            and simulation.order_id == approval.order_id
            and simulation.order_state == "filled"
            and simulation.fill_status == "filled"
            for simulation in existing_simulations
        ):
            approvals = self.portfolio_paper_order_approval_store.list_by_batch(
                approval.base_run_id,
                approval.batch_id,
            )
            lifecycle = build_portfolio_paper_order_lifecycle(
                batch,
                approvals=portfolio_paper_order_approvals_to_map(approvals),
            )
            existing_approval = next(
                (item for item in approvals if item.order_id == approval.order_id),
                None,
            )
            existing_simulation = next(
                (
                    simulation
                    for simulation in existing_simulations
                    if simulation.batch_id == approval.batch_id
                    and simulation.order_id == approval.order_id
                    and simulation.order_state == "filled"
                    and simulation.fill_status == "filled"
                ),
                None,
            )
            self._send_json(
                {
                    "error": "portfolio_paper_order_approval_locked_after_simulation",
                    "detail": approval.order_id,
                    "existingApproval": (
                        portfolio_paper_order_approval_to_payload(existing_approval)
                        if existing_approval is not None
                        else None
                    ),
                    "existingSimulation": (
                        portfolio_paper_order_simulation_to_payload(existing_simulation)
                        if existing_simulation is not None
                        else None
                    ),
                    "approvals": [portfolio_paper_order_approval_to_payload(item) for item in approvals],
                    "portfolioPaperOrderLifecycle": lifecycle,
                },
                status=409,
            )
            return
    except LookupError as error:
        self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
        return
    except ValueError as error:
        self._send_json({"error": "invalid_portfolio_paper_order_approval", "detail": str(error)}, status=400)
        return
    self.portfolio_paper_order_approval_store.record(approval)
    approvals = self.portfolio_paper_order_approval_store.list_by_batch(approval.base_run_id, approval.batch_id)
    lifecycle = build_portfolio_paper_order_lifecycle(
        batch,
        approvals=portfolio_paper_order_approvals_to_map(approvals),
    )
    lifecycle_row = _find_portfolio_paper_order_lifecycle_row(lifecycle, approval.order_id)
    audit_event = self.audit_event_store.record(
        portfolio_paper_order_approval_to_audit_event_payload(approval, batch=batch, lifecycle_row=lifecycle_row)
    )
    self._send_json(
        {
            "approval": portfolio_paper_order_approval_to_payload(approval),
            "approvals": [portfolio_paper_order_approval_to_payload(item) for item in approvals],
            "portfolioPaperOrderLifecycle": lifecycle,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=201,
    )
    return


def post_portfolio_paper_order_simulations_batch(self, parsed):
    try:
        payload = self._read_json_body()
        base_run_id = str(payload.get("baseRunId") or "").strip()
        batch_id = str(payload.get("batchId") or "").strip()
        if not base_run_id or not batch_id:
            raise ValueError("portfolio_paper_order_simulation_context_required")
        batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
        approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
        lifecycle = build_portfolio_paper_order_lifecycle(
            batch,
            approvals=portfolio_paper_order_approvals_to_map(approvals),
        )
        requested_order_ids = [
            str(order_id).strip()
            for order_id in payload.get("orderIds", [])
            if str(order_id).strip()
        ] if isinstance(payload.get("orderIds"), list) else []
        requested_order_id_set = set(requested_order_ids)
        lifecycle_rows = [
            row
            for row in lifecycle
            if not requested_order_id_set or str(row.get("orderId") or "") in requested_order_id_set
        ]
        if requested_order_ids and len(lifecycle_rows) != len(requested_order_id_set):
            raise ValueError("portfolio_paper_order_simulation_order_not_found")
        adapter_evidence_by_order_id = _portfolio_paper_order_adapter_evidence_by_order_id(payload)
        existing_simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(base_run_id)
        existing_simulation_keys = {
            (simulation.base_run_id, simulation.batch_id, simulation.order_id)
            for simulation in existing_simulations
            if simulation.order_state == "filled" and simulation.fill_status == "filled"
        }
        created_simulations: list[PortfolioPaperOrderSimulation] = []
        audit_events = []
        blocked_orders = []
        skipped_orders = []
        for row in lifecycle_rows:
            order_id = str(row.get("orderId") or "").strip()
            order_label = {
                "orderId": order_id,
                "symbol": str(row.get("symbol") or ""),
                "side": str(row.get("side") or ""),
            }
            if (base_run_id, batch_id, order_id) in existing_simulation_keys:
                skipped_orders.append({**order_label, "reason": "already_simulated"})
                continue
            if str(row.get("state") or "") != "ready_for_simulation" or not bool(row.get("routable")):
                skipped_orders.append({**order_label, "reason": str(row.get("state") or "not_routable")})
                continue
            try:
                adapter_evidence = adapter_evidence_by_order_id.get(order_id, {})
                simulation = create_portfolio_paper_order_simulation(
                    batch=batch,
                    lifecycle_row=row,
                    existing_simulations=[*existing_simulations, *created_simulations],
                    route_risk=payload.get("routeRisk") if isinstance(payload.get("routeRisk"), dict) else None,
                    adapter_paper_execution_id=str(
                        adapter_evidence.get("adapterPaperExecutionId")
                        or payload.get("adapterPaperExecutionId")
                        or ""
                    ).strip(),
                    adapter_manifest_validation_id=str(
                        adapter_evidence.get("adapterManifestValidationId")
                        or payload.get("adapterManifestValidationId")
                        or ""
                    ).strip(),
                    adapter_paper_execution_evidence=(
                        adapter_evidence.get("adapterPaperExecutionEvidence")
                        if isinstance(adapter_evidence.get("adapterPaperExecutionEvidence"), dict)
                        else payload.get("adapterPaperExecutionEvidence")
                        if isinstance(payload.get("adapterPaperExecutionEvidence"), dict)
                        else None
                    ),
                    simulated_at=payload.get("simulatedAt"),
                )
            except ValueError as error:
                blocked_orders.append({**order_label, "detail": str(error)})
                break
            self.portfolio_paper_order_simulation_store.record(simulation)
            created_simulations.append(simulation)
            audit_events.append(
                self.audit_event_store.record(
                    portfolio_paper_order_simulation_to_audit_event_payload(
                        simulation,
                        batch=batch,
                        lifecycle_row=row,
                    )
                )
            )
        simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
        if blocked_orders and not created_simulations:
            batch_status = "blocked"
            response_status = 409
        elif blocked_orders or skipped_orders:
            batch_status = "partial"
            response_status = 201
        elif created_simulations:
            batch_status = "filled"
            response_status = 201
        else:
            batch_status = "skipped"
            response_status = 200
        self._send_json(
            {
                "batchSimulation": {
                    "schemaVersion": 1,
                    "mode": "portfolio_paper_order_batch_simulation",
                    "status": batch_status,
                    "baseRunId": base_run_id,
                    "batchId": batch_id,
                    "requestedCount": len(lifecycle_rows),
                    "filledCount": len(created_simulations),
                    "blockedCount": len(blocked_orders),
                    "skippedCount": len(skipped_orders),
                    "filledOrderIds": [simulation.order_id for simulation in created_simulations],
                    "blockedOrders": blocked_orders,
                    "skippedOrders": skipped_orders,
                    "paperOnly": True,
                    "liveExecutionBlocked": True,
                },
                "simulations": [portfolio_paper_order_simulation_to_payload(item) for item in simulations],
                "createdSimulations": [
                    portfolio_paper_order_simulation_to_payload(item) for item in created_simulations
                ],
                "portfolioPaperOrderLifecycle": lifecycle,
                "auditEvents": [audit_event_record_to_payload(event) for event in audit_events],
            },
            status=response_status,
        )
        return
    except LookupError as error:
        self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
        return
    except ValueError as error:
        self._send_json({"error": "invalid_portfolio_paper_order_simulation_batch", "detail": str(error)}, status=400)
        return


def post_portfolio_paper_order_simulations(self, parsed):
    try:
        payload = self._read_json_body()
        base_run_id = str(payload.get("baseRunId") or "").strip()
        batch_id = str(payload.get("batchId") or "").strip()
        order_id = str(payload.get("orderId") or "").strip()
        if not base_run_id or not batch_id or not order_id:
            raise ValueError("portfolio_paper_order_simulation_context_required")
        batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
        approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
        lifecycle = build_portfolio_paper_order_lifecycle(
            batch,
            approvals=portfolio_paper_order_approvals_to_map(approvals),
        )
        lifecycle_row = _find_portfolio_paper_order_lifecycle_row(lifecycle, order_id)
        existing_simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(base_run_id)
        existing_simulation = next(
            (
                simulation
                for simulation in existing_simulations
                if simulation.base_run_id == base_run_id
                and simulation.batch_id == batch_id
                and simulation.order_id == order_id
                and simulation.order_state == "filled"
                and simulation.fill_status == "filled"
            ),
            None,
        )
        if existing_simulation is not None:
            simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
            self._send_json(
                {
                    "error": "portfolio_paper_order_simulation_already_recorded",
                    "detail": order_id,
                    "existingSimulation": portfolio_paper_order_simulation_to_payload(existing_simulation),
                    "simulations": [portfolio_paper_order_simulation_to_payload(item) for item in simulations],
                    "portfolioPaperOrderLifecycle": lifecycle,
                },
                status=409,
            )
            return
        simulation = create_portfolio_paper_order_simulation(
            batch=batch,
            lifecycle_row=lifecycle_row,
            existing_simulations=existing_simulations,
            route_risk=payload.get("routeRisk") if isinstance(payload.get("routeRisk"), dict) else None,
            adapter_paper_execution_id=str(payload.get("adapterPaperExecutionId") or "").strip(),
            adapter_manifest_validation_id=str(payload.get("adapterManifestValidationId") or "").strip(),
            adapter_paper_execution_evidence=(
                payload.get("adapterPaperExecutionEvidence")
                if isinstance(payload.get("adapterPaperExecutionEvidence"), dict)
                else None
            ),
            simulated_at=payload.get("simulatedAt"),
        )
    except LookupError as error:
        self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
        return
    except ValueError as error:
        self._send_json({"error": "invalid_portfolio_paper_order_simulation", "detail": str(error)}, status=400)
        return
    self.portfolio_paper_order_simulation_store.record(simulation)
    simulations = self.portfolio_paper_order_simulation_store.list_by_batch(simulation.base_run_id, simulation.batch_id)
    audit_event = self.audit_event_store.record(
        portfolio_paper_order_simulation_to_audit_event_payload(
            simulation,
            batch=batch,
            lifecycle_row=lifecycle_row,
        )
    )
    self._send_json(
        {
            "simulation": portfolio_paper_order_simulation_to_payload(simulation),
            "simulations": [portfolio_paper_order_simulation_to_payload(item) for item in simulations],
            "portfolioPaperOrderLifecycle": lifecycle,
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=201,
    )
    return


def get_portfolio_workflows(self, parsed):
    try:
        base_run_id, limit = _stage4_portfolio_workflow_query(parsed.query)
        events = self.audit_event_store.list_recent(
            run_id=base_run_id,
            event_type="stage4_portfolio_workflow",
            limit=limit,
        )
        workflows = []
        for event in events:
            snapshot = validate_stage4_portfolio_workflow_snapshot(event.metadata.get("snapshot"))
            generated_at = datetime.fromisoformat(snapshot["generatedAt"])
            if (
                snapshot["baseRunId"] != base_run_id
                or snapshot["workflowId"] != event.event_id
                or event.created_at.tzinfo is None
                or event.created_at.utcoffset() is None
                or event.created_at != generated_at
            ):
                raise ValueError("stage4 portfolio workflow audit binding does not match")
            workflows.append(snapshot)
    except ValueError as error:
        code = (
            "invalid_stage4_portfolio_workflow_query"
            if str(error) == "invalid_stage4_portfolio_workflow_query"
            else "invalid_stage4_portfolio_workflow_store"
        )
        self._send_json({"error": code, "detail": str(error)}, status=400 if code.endswith("query") else 500)
        return
    self._send_json(
        {
            "workflows": workflows,
            "pagination": {
                "limit": limit,
                "total": self.audit_event_store.count(
                    run_id=base_run_id,
                    event_type="stage4_portfolio_workflow",
                ),
            },
        }
    )
    return


def get_portfolio_risk_assessments(self, parsed):
    try:
        base_run_id, limit = _portfolio_m5_query(parsed.query)
    except ValueError as error:
        self._send_json(
            {"error": "invalid_portfolio_risk_assessment_query", "detail": str(error)},
            status=400,
        )
        return
    try:
        assessments = self._portfolio_m5_service().list_recent(base_run_id, limit)
    except ValueError as error:
        self._send_json(
            {"error": "invalid_portfolio_risk_assessment_store", "detail": str(error)},
            status=500,
        )
        return
    self._send_json({"assessments": assessments})
    return


def get_portfolio_paper_orders(self, parsed):
    query = parse_qs(parsed.query)
    base_run_id = query.get("baseRunId", [""])[0].strip()
    if not base_run_id:
        self._send_json({"error": "portfolio_paper_order_base_run_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    batches = self.portfolio_paper_order_store.list_by_base_run(base_run_id, limit=limit)
    self._send_json(
        {
            "portfolioPaperOrderBatches": [
                portfolio_paper_order_batch_to_payload(batch) for batch in batches
            ]
        }
    )
    return


def get_portfolio_paper_order_replay(self, parsed):
    query = parse_qs(parsed.query)
    base_run_id = query.get("baseRunId", [""])[0].strip()
    if not base_run_id:
        self._send_json({"error": "portfolio_paper_order_replay_base_run_id_required"}, status=400)
        return
    initial_cash = _parse_positive_float(query.get("initialCash", ["100000"])[0], default=100_000.0)
    simulations = self.portfolio_paper_order_simulation_store.list_all_by_base_run(base_run_id)
    replay = build_portfolio_paper_order_replay(
        simulations,
        base_run_id=base_run_id,
        initial_cash=initial_cash,
    )
    self._send_json({"replay": replay})
    return


def get_portfolio_paper_order_state_history(self, parsed):
    query = parse_qs(parsed.query)
    base_run_id = query.get("baseRunId", [""])[0].strip()
    batch_id = query.get("batchId", [""])[0].strip()
    if not base_run_id or not batch_id:
        self._send_json({"error": "portfolio_paper_order_state_history_context_required"}, status=400)
        return
    try:
        batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
    except LookupError as error:
        self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
        return
    approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
    simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
    self._send_json(
        {
            "stateHistory": build_portfolio_paper_order_state_history(
                batch,
                approvals=approvals,
                simulations=simulations,
            )
        }
    )
    return


def get_portfolio_paper_order_approvals(self, parsed):
    query = parse_qs(parsed.query)
    base_run_id = query.get("baseRunId", [""])[0].strip()
    batch_id = query.get("batchId", [""])[0].strip()
    if not base_run_id or not batch_id:
        self._send_json({"error": "portfolio_paper_order_approval_context_required"}, status=400)
        return
    try:
        batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
    except LookupError as error:
        self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
        return
    approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
    lifecycle = build_portfolio_paper_order_lifecycle(
        batch,
        approvals=portfolio_paper_order_approvals_to_map(approvals),
    )
    self._send_json(
        {
            "approvals": [portfolio_paper_order_approval_to_payload(approval) for approval in approvals],
            "portfolioPaperOrderLifecycle": lifecycle,
        }
    )
    return


def get_portfolio_paper_order_simulations(self, parsed):
    query = parse_qs(parsed.query)
    base_run_id = query.get("baseRunId", [""])[0].strip()
    batch_id = query.get("batchId", [""])[0].strip()
    if not base_run_id or not batch_id:
        self._send_json({"error": "portfolio_paper_order_simulation_context_required"}, status=400)
        return
    try:
        batch = _find_portfolio_paper_order_batch(self.portfolio_paper_order_store, base_run_id, batch_id)
    except LookupError as error:
        self._send_json({"error": "portfolio_paper_order_batch_not_found", "detail": str(error)}, status=404)
        return
    approvals = self.portfolio_paper_order_approval_store.list_by_batch(base_run_id, batch_id)
    lifecycle = build_portfolio_paper_order_lifecycle(
        batch,
        approvals=portfolio_paper_order_approvals_to_map(approvals),
    )
    simulations = self.portfolio_paper_order_simulation_store.list_by_batch(base_run_id, batch_id)
    self._send_json(
        {
            "simulations": [portfolio_paper_order_simulation_to_payload(simulation) for simulation in simulations],
            "portfolioPaperOrderLifecycle": lifecycle,
        }
    )
    return
