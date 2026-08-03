from __future__ import annotations

from ..support.research_import_archive import _preflight_ai_review_archive
from ..support.research_import_codecs import _importable_research_note_payload
from ..support.research_import_transaction import (
    _persist_research_run_import,
    _undo_research_run_import_from_record,
    _undo_research_run_import_from_snapshot,
)
from quant_core.execution import (
    paper_execution_payload_to_record,
    portfolio_paper_order_payload_to_approval,
    portfolio_paper_order_payload_to_batch,
    portfolio_paper_order_payload_to_simulation,
)
from quant_core.research_import_undo import research_run_import_undo_record_to_payload
from quant_core.runs import (
    research_run_audit_to_payload,
    research_run_import_audit_events,
    research_run_import_handoff_notes,
    research_run_import_paper_executions,
    research_run_import_portfolio_paper_order_approvals,
    research_run_import_portfolio_paper_order_simulations,
    research_run_import_portfolio_paper_orders,
    research_run_import_precheck,
    research_run_import_to_audit,
)

def post_research_runs_import_undo(self, parsed):
    payload = self._read_json_body()
    undo_token = str(payload.get("undoToken") or "").strip()
    expected_run_id = str(payload.get("expectedRunId") or "").strip()
    if not expected_run_id:
        self._send_json(
            {
                "error": "research_run_import_undo_expected_run_required",
                "undoToken": undo_token,
            },
            status=400,
        )
        return
    undo_record = self.import_undo_store.get(undo_token)
    if not undo_record:
        self._send_json({"error": "research_run_import_undo_not_found", "undoToken": undo_token}, status=404)
        return
    if undo_record.run_id != expected_run_id:
        self._send_json(
            {
                "error": "research_run_import_undo_run_mismatch",
                "runId": undo_record.run_id,
                "expectedRunId": expected_run_id,
                "undo": research_run_import_undo_record_to_payload(undo_record),
            },
            status=409,
        )
        return
    if undo_record.consumed_at:
        self._send_json(
            {
                "error": "research_run_import_undo_already_consumed",
                "undo": research_run_import_undo_record_to_payload(undo_record),
            },
            status=409,
        )
        return
    try:
        previous_run = _undo_research_run_import_from_record(
            run_store=self.run_store,
            note_store=self.note_store,
            strategy_store=self.strategy_store,
            paper_execution_store=self.paper_execution_store,
            portfolio_paper_order_store=self.portfolio_paper_order_store,
            portfolio_paper_order_approval_store=self.portfolio_paper_order_approval_store,
            portfolio_paper_order_simulation_store=self.portfolio_paper_order_simulation_store,
            ai_review_store=self.ai_review_store,
            ai_review_decision_store=self._current_ai_review_decision_store(),
            audit_event_store=self.audit_event_store,
            handoff_note_store=self.handoff_note_store,
            undo_record=undo_record,
        )
        consumed = self.import_undo_store.mark_consumed(undo_record.undo_token)
    except ValueError as error:
        self._send_json({"error": "invalid_research_run_import_undo", "detail": str(error)}, status=400)
        return
    self._send_json(
        {
            "undo": {
                **research_run_import_undo_record_to_payload(consumed or undo_record),
                "status": "undone",
            },
            "run": research_run_audit_to_payload(previous_run, include_data_snapshot=True) if previous_run else None,
        }
    )
    return


def post_research_runs_import(self, parsed):
    try:
        payload = self._read_json_body()
        run_id = research_run_import_precheck(payload)
        ai_review_records, ai_review_records_v2, ai_review_decision_records = (
            _preflight_ai_review_archive(
                payload,
                run_id=run_id,
                review_store=self.ai_review_store,
                decision_store=self._current_ai_review_decision_store(),
            )
        )
        audit = research_run_import_to_audit(payload)
        paper_executions = research_run_import_paper_executions(payload, run_id=audit.run_id)
        portfolio_paper_orders = research_run_import_portfolio_paper_orders(payload, base_run_id=audit.run_id)
        portfolio_paper_order_approvals = research_run_import_portfolio_paper_order_approvals(
            payload,
            base_run_id=audit.run_id,
        )
        portfolio_paper_order_simulations = research_run_import_portfolio_paper_order_simulations(
            payload,
            base_run_id=audit.run_id,
        )
        audit_events = research_run_import_audit_events(payload, run_id=audit.run_id)
        handoff_notes = research_run_import_handoff_notes(payload, run_id=audit.run_id)
        paper_execution_records = [
            paper_execution_payload_to_record(execution_payload) for execution_payload in paper_executions
        ]
        portfolio_paper_order_batches = [
            portfolio_paper_order_payload_to_batch(batch_payload) for batch_payload in portfolio_paper_orders
        ]
        portfolio_paper_order_approval_records = [
            portfolio_paper_order_payload_to_approval(approval_payload)
            for approval_payload in portfolio_paper_order_approvals
        ]
        portfolio_paper_order_simulation_records = [
            portfolio_paper_order_payload_to_simulation(simulation_payload)
            for simulation_payload in portfolio_paper_order_simulations
        ]
        imported_note = _importable_research_note_payload(
            audit.research_note,
            market=audit.market,
            symbol=audit.symbol,
            timeframe=audit.timeframe,
        )
    except ValueError as error:
        self._send_json({"error": "invalid_research_run_export", "detail": str(error)}, status=400)
        return
    undo_snapshot = None
    try:
        undo_snapshot = _persist_research_run_import(
            run_store=self.run_store,
            note_store=self.note_store,
            strategy_store=self.strategy_store,
            paper_execution_store=self.paper_execution_store,
            portfolio_paper_order_store=self.portfolio_paper_order_store,
            portfolio_paper_order_approval_store=self.portfolio_paper_order_approval_store,
            portfolio_paper_order_simulation_store=self.portfolio_paper_order_simulation_store,
            ai_review_store=self.ai_review_store,
            ai_review_decision_store=self._current_ai_review_decision_store(),
            audit_event_store=self.audit_event_store,
            handoff_note_store=self.handoff_note_store,
            audit=audit,
            imported_note=imported_note,
            paper_execution_records=paper_execution_records,
            portfolio_paper_order_batches=portfolio_paper_order_batches,
            portfolio_paper_order_approvals=portfolio_paper_order_approval_records,
            portfolio_paper_order_simulations=portfolio_paper_order_simulation_records,
            ai_review_records=ai_review_records,
            ai_review_records_v2=ai_review_records_v2,
            ai_review_decision_records=ai_review_decision_records,
            audit_event_payloads=audit_events,
            handoff_note_payloads=handoff_notes,
        )
        undo_record = self.import_undo_store.record(run_id=audit.run_id, snapshot=undo_snapshot)
    except Exception as error:
        if undo_snapshot:
            _undo_research_run_import_from_snapshot(
                run_store=self.run_store,
                note_store=self.note_store,
                strategy_store=self.strategy_store,
                paper_execution_store=self.paper_execution_store,
                portfolio_paper_order_store=self.portfolio_paper_order_store,
                portfolio_paper_order_approval_store=self.portfolio_paper_order_approval_store,
                portfolio_paper_order_simulation_store=self.portfolio_paper_order_simulation_store,
                ai_review_store=self.ai_review_store,
                ai_review_decision_store=self._current_ai_review_decision_store(),
                audit_event_store=self.audit_event_store,
                handoff_note_store=self.handoff_note_store,
                snapshot=undo_snapshot,
            )
        self._send_json({"error": "research_run_import_write_failed", "detail": str(error)}, status=500)
        return
    self._send_json(
        {
            "run": research_run_audit_to_payload(audit, include_data_snapshot=True),
            "undoToken": undo_record.undo_token,
            "undo": research_run_import_undo_record_to_payload(undo_record),
        },
        status=201,
    )
    return
