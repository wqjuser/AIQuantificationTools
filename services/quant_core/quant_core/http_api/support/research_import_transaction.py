from __future__ import annotations

from .p0 import _is_importable_strategy_config
from .research_import_archive import (
    _preflight_ai_review_archive_snapshot,
    _restore_ai_review_archive_snapshot,
    _snapshot_ai_review_archive,
)
from .research_import_codecs import (
    _ai_review_run_from_payload,
    _number_or_default,
    _research_note_from_payload,
    _research_run_audit_from_payload,
    _strategy_record_from_payload,
)
from datetime import datetime
from quant_core.ai_review_decisions import AiReviewDecisionStore
from quant_core.ai_review_runs import (
    AiReviewRunRecord,
    AiReviewRunStore,
    AuthoritativeAiReviewRunRecord,
    ai_review_run_record_to_payload,
)
from quant_core.audit_events import (
    AuditEventStore,
    audit_event_payload_matches_record,
    audit_event_record_to_payload,
    is_protected_production_authority_audit_event,
)
from quant_core.execution import (
    PaperExecutionRecord,
    PaperExecutionStore,
    PortfolioPaperOrderApproval,
    PortfolioPaperOrderApprovalStore,
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderSimulation,
    PortfolioPaperOrderSimulationStore,
    PortfolioPaperOrderStore,
    paper_execution_payload_to_record,
    paper_execution_record_to_payload,
    portfolio_paper_order_approval_to_payload,
    portfolio_paper_order_batch_to_payload,
    portfolio_paper_order_payload_to_approval,
    portfolio_paper_order_payload_to_batch,
    portfolio_paper_order_payload_to_simulation,
    portfolio_paper_order_simulation_to_payload,
)
from quant_core.handoff_notes import (
    HandoffNote,
    HandoffNoteStore,
    handoff_note_from_payload,
    handoff_note_to_payload,
)
from quant_core.research_import_undo import ResearchRunImportUndoRecord
from quant_core.research_notes import (
    ResearchNote,
    ResearchNoteStore,
    research_note_to_payload,
)
from quant_core.runs import (
    ResearchRunAudit,
    ResearchRunStore,
    research_run_audit_to_payload,
)
from quant_core.strategy_library import (
    StrategyLibraryRecord,
    StrategyLibraryStore,
    strategy_library_record_to_payload,
)

def _persist_research_run_import(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    audit_event_store: AuditEventStore,
    audit: ResearchRunAudit,
    imported_note: dict[str, object] | None,
    paper_execution_records: list[PaperExecutionRecord],
    portfolio_paper_order_batches: list[PortfolioPaperOrderBatch],
    portfolio_paper_order_approvals: list[PortfolioPaperOrderApproval],
    portfolio_paper_order_simulations: list[PortfolioPaperOrderSimulation],
    ai_review_records: list[dict[str, object]],
    audit_event_payloads: list[dict[str, object]],
    handoff_note_store: HandoffNoteStore | None = None,
    handoff_note_payloads: list[dict[str, object]] | None = None,
    ai_review_decision_store: AiReviewDecisionStore | None = None,
    ai_review_records_v2: list[dict[str, object]] | None = None,
    ai_review_decision_records: list[dict[str, object]] | None = None,
) -> dict[str, object]:
    handoff_note_payloads = handoff_note_payloads or []
    ai_review_records_v2 = ai_review_records_v2 or []
    ai_review_decision_records = ai_review_decision_records or []
    ai_review_decision_store = ai_review_decision_store or AiReviewDecisionStore(
        ai_review_store.path,
        review_store=ai_review_store,
    )
    if handoff_note_payloads and handoff_note_store is None:
        raise ValueError("handoff_note_store_required")
    ai_review_decision_store.preflight_archive_apply(
        run_id=audit.run_id,
        legacy_records=ai_review_records,
        authoritative_records=ai_review_records_v2,
        decision_records=ai_review_decision_records,
    )
    for audit_event_payload in audit_event_payloads:
        event_id = str(audit_event_payload.get("eventId") or "")
        existing_event = audit_event_store.get(event_id)
        if existing_event is not None and (
            existing_event.run_id != audit.run_id
            or is_protected_production_authority_audit_event(
                existing_event.event_type, existing_event.event_id
            )
            and not audit_event_payload_matches_record(existing_event, audit_event_payload)
        ):
            raise ValueError("audit_event_import_identity_conflict")

    previous_run = run_store.get(audit.run_id)
    previous_note = (
        note_store.get_existing(
            market=str(imported_note["market"]),
            symbol=str(imported_note["symbol"]),
            timeframe=str(imported_note["timeframe"]),
        )
        if imported_note
        else None
    )
    strategy_revision = (
        str(audit.strategy_config.get("revision") or "").strip()
        if _is_importable_strategy_config(audit.strategy_config)
        else ""
    )
    previous_strategy = strategy_store.get(strategy_revision) if strategy_revision else None
    previous_paper_executions = paper_execution_store.list_all_by_run(audit.run_id)
    previous_portfolio_paper_orders = portfolio_paper_order_store.list_all_by_base_run(audit.run_id)
    previous_portfolio_paper_order_approvals = portfolio_paper_order_approval_store.list_all_by_base_run(audit.run_id)
    previous_portfolio_paper_order_simulations = (
        portfolio_paper_order_simulation_store.list_all_by_base_run(audit.run_id)
    )
    previous_ai_reviews = ai_review_store.list_all_by_run(audit.run_id)
    previous_ai_review_archive = _snapshot_ai_review_archive(
        run_id=audit.run_id,
        review_store=ai_review_store,
        decision_store=ai_review_decision_store,
    )
    previous_audit_events = audit_event_store.list_all_by_run(audit.run_id)
    previous_handoff_notes = handoff_note_store.list_by_run(audit.run_id, limit=200) if handoff_note_store else []

    ai_archive_applied = False
    try:
        run_store.record(audit)
        if imported_note:
            note_store.save(
                market=str(imported_note["market"]),
                symbol=str(imported_note["symbol"]),
                timeframe=str(imported_note["timeframe"]),
                body=str(imported_note["body"]),
                updated_at=imported_note["updated_at"],
            )
        if strategy_revision:
            strategy_store.save_payload(
                audit.strategy_config,
                audit_run_id=audit.run_id,
                created_at=audit.created_at,
            )
        for execution_record in paper_execution_records:
            paper_execution_store.record(execution_record)
        portfolio_paper_order_approval_store.delete_by_base_run(audit.run_id)
        portfolio_paper_order_simulation_store.delete_by_base_run(audit.run_id)
        for batch in portfolio_paper_order_batches:
            portfolio_paper_order_store.record(batch)
        for approval in portfolio_paper_order_approvals:
            portfolio_paper_order_approval_store.record(approval)
        for simulation in portfolio_paper_order_simulations:
            portfolio_paper_order_simulation_store.record(simulation)
        ai_review_decision_store.apply_archive_atomic(
            run_id=audit.run_id,
            legacy_records=ai_review_records,
            authoritative_records=ai_review_records_v2,
            decision_records=ai_review_decision_records,
        )
        ai_archive_applied = True
        if handoff_note_payloads and handoff_note_store:
            handoff_note_store.delete_by_subject(subject_type="research_run", subject_id=audit.run_id)
            for handoff_note_payload in handoff_note_payloads:
                handoff_note_store.restore(handoff_note_from_payload(handoff_note_payload))
        for audit_event_payload in audit_event_payloads:
            audit_event_store.record(audit_event_payload)
    except Exception:
        _rollback_research_run_import(
            run_store=run_store,
            note_store=note_store,
            strategy_store=strategy_store,
            paper_execution_store=paper_execution_store,
            ai_review_store=ai_review_store,
            ai_review_decision_store=ai_review_decision_store,
            audit_event_store=audit_event_store,
            run_id=audit.run_id,
            imported_note=imported_note,
            previous_run=previous_run,
            previous_note=previous_note,
            strategy_revision=strategy_revision,
            previous_strategy=previous_strategy,
            previous_paper_executions=previous_paper_executions,
            portfolio_paper_order_store=portfolio_paper_order_store,
            portfolio_paper_order_approval_store=portfolio_paper_order_approval_store,
            portfolio_paper_order_simulation_store=portfolio_paper_order_simulation_store,
            previous_portfolio_paper_orders=previous_portfolio_paper_orders,
            previous_portfolio_paper_order_approvals=previous_portfolio_paper_order_approvals,
            previous_portfolio_paper_order_simulations=previous_portfolio_paper_order_simulations,
            previous_ai_reviews=previous_ai_reviews,
            previous_ai_review_archive=previous_ai_review_archive,
            restore_ai_review_archive=ai_archive_applied,
            previous_audit_events=previous_audit_events,
            handoff_note_store=handoff_note_store,
            previous_handoff_notes=previous_handoff_notes,
        )
        raise
    return _research_run_import_undo_snapshot(
        audit=audit,
        imported_note=imported_note,
        strategy_revision=strategy_revision,
        previous_run=previous_run,
        previous_note=previous_note,
        previous_strategy=previous_strategy,
        previous_paper_executions=previous_paper_executions,
        previous_portfolio_paper_orders=previous_portfolio_paper_orders,
        previous_portfolio_paper_order_approvals=previous_portfolio_paper_order_approvals,
        previous_portfolio_paper_order_simulations=previous_portfolio_paper_order_simulations,
        previous_ai_reviews=previous_ai_reviews,
        previous_ai_review_archive=previous_ai_review_archive,
        previous_audit_events=previous_audit_events,
        imported_handoff_notes=handoff_note_payloads,
        previous_handoff_notes=previous_handoff_notes,
    )


def _research_run_import_undo_snapshot(
    *,
    audit: ResearchRunAudit,
    imported_note: dict[str, object] | None,
    strategy_revision: str,
    previous_run: ResearchRunAudit | None,
    previous_note: ResearchNote | None,
    previous_strategy: StrategyLibraryRecord | None,
    previous_paper_executions: list[PaperExecutionRecord],
    previous_portfolio_paper_orders: list[PortfolioPaperOrderBatch],
    previous_portfolio_paper_order_approvals: list[PortfolioPaperOrderApproval],
    previous_portfolio_paper_order_simulations: list[PortfolioPaperOrderSimulation],
    previous_ai_reviews: list[AiReviewRunRecord],
    previous_audit_events: list[object],
    imported_handoff_notes: list[dict[str, object]],
    previous_handoff_notes: list[HandoffNote],
    previous_ai_review_archive: dict[str, object] | None = None,
) -> dict[str, object]:
    return {
        "schemaVersion": 1,
        "runId": audit.run_id,
        "importedRun": research_run_audit_to_payload(audit, include_data_snapshot=True),
        "importedNote": _imported_note_snapshot(imported_note),
        "importedHandoffNotes": imported_handoff_notes,
        "strategyRevision": strategy_revision,
        "previous": {
            "run": research_run_audit_to_payload(previous_run, include_data_snapshot=True) if previous_run else None,
            "note": research_note_to_payload(previous_note) if previous_note else None,
            "strategy": strategy_library_record_to_payload(previous_strategy) if previous_strategy else None,
            "paperExecutions": [
                paper_execution_record_to_payload(execution) for execution in previous_paper_executions
            ],
            "portfolioPaperOrderBatches": [
                portfolio_paper_order_batch_to_payload(batch) for batch in previous_portfolio_paper_orders
            ],
            "portfolioPaperOrderApprovals": [
                portfolio_paper_order_approval_to_payload(approval)
                for approval in previous_portfolio_paper_order_approvals
            ],
            "portfolioPaperOrderSimulations": [
                portfolio_paper_order_simulation_to_payload(simulation)
                for simulation in previous_portfolio_paper_order_simulations
            ],
            "aiReviewRuns": (
                list(previous_ai_review_archive.get("aiReviewRuns", []))
                if previous_ai_review_archive is not None
                else [ai_review_run_record_to_payload(review) for review in previous_ai_reviews]
            ),
            "aiReviewRunsV2": (
                list(previous_ai_review_archive.get("aiReviewRunsV2", []))
                if previous_ai_review_archive is not None
                else []
            ),
            "aiReviewDecisions": (
                list(previous_ai_review_archive.get("aiReviewDecisions", []))
                if previous_ai_review_archive is not None
                else []
            ),
            "auditEvents": [audit_event_record_to_payload(event) for event in previous_audit_events],
            "handoffNotes": [handoff_note_to_payload(note) for note in previous_handoff_notes],
        },
    }


def _imported_note_snapshot(imported_note: dict[str, object] | None) -> dict[str, object] | None:
    if not imported_note:
        return None
    updated_at = imported_note.get("updated_at")
    return {
        "market": str(imported_note.get("market") or ""),
        "symbol": str(imported_note.get("symbol") or ""),
        "timeframe": str(imported_note.get("timeframe") or ""),
        "body": str(imported_note.get("body") or ""),
        "updatedAt": updated_at.isoformat() if isinstance(updated_at, datetime) else updated_at,
    }


def _undo_research_run_import_from_record(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    ai_review_decision_store: AiReviewDecisionStore,
    audit_event_store: AuditEventStore,
    handoff_note_store: HandoffNoteStore,
    undo_record: ResearchRunImportUndoRecord,
) -> ResearchRunAudit | None:
    return _undo_research_run_import_from_snapshot(
        run_store=run_store,
        note_store=note_store,
        strategy_store=strategy_store,
        paper_execution_store=paper_execution_store,
        portfolio_paper_order_store=portfolio_paper_order_store,
        portfolio_paper_order_approval_store=portfolio_paper_order_approval_store,
        portfolio_paper_order_simulation_store=portfolio_paper_order_simulation_store,
        ai_review_store=ai_review_store,
        ai_review_decision_store=ai_review_decision_store,
        audit_event_store=audit_event_store,
        handoff_note_store=handoff_note_store,
        snapshot=undo_record.snapshot,
    )


def _undo_research_run_import_from_snapshot(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    ai_review_decision_store: AiReviewDecisionStore,
    audit_event_store: AuditEventStore,
    handoff_note_store: HandoffNoteStore,
    snapshot: dict[str, object],
) -> ResearchRunAudit | None:
    if int(_number_or_default(snapshot.get("schemaVersion"), 0)) != 1:
        raise ValueError("unsupported_import_undo_snapshot_schema")
    previous = snapshot.get("previous")
    if not isinstance(previous, dict):
        raise ValueError("import_undo_previous_snapshot_required")
    run_id = str(snapshot.get("runId") or "").strip()
    if not run_id:
        raise ValueError("import_undo_run_id_required")

    imported_note = snapshot.get("importedNote")
    previous_run_payload = previous.get("run")
    previous_note_payload = previous.get("note")
    previous_strategy_payload = previous.get("strategy")
    previous_paper_payloads = previous.get("paperExecutions", [])
    previous_portfolio_paper_payloads = previous.get("portfolioPaperOrderBatches", [])
    previous_portfolio_paper_approval_payloads = previous.get("portfolioPaperOrderApprovals", [])
    previous_portfolio_paper_simulation_payloads = previous.get("portfolioPaperOrderSimulations", [])
    previous_ai_review_payloads = previous.get("aiReviewRuns", [])
    previous_ai_review_v2_payloads = previous.get("aiReviewRunsV2", [])
    previous_ai_review_decision_payloads = previous.get("aiReviewDecisions", [])
    previous_audit_event_payloads = previous.get("auditEvents", [])
    previous_handoff_note_payloads = previous.get("handoffNotes", [])

    if previous_paper_payloads is None:
        previous_paper_payloads = []
    if previous_portfolio_paper_payloads is None:
        previous_portfolio_paper_payloads = []
    if previous_portfolio_paper_approval_payloads is None:
        previous_portfolio_paper_approval_payloads = []
    if previous_portfolio_paper_simulation_payloads is None:
        previous_portfolio_paper_simulation_payloads = []
    if previous_ai_review_payloads is None:
        previous_ai_review_payloads = []
    if previous_ai_review_v2_payloads is None:
        previous_ai_review_v2_payloads = []
    if previous_ai_review_decision_payloads is None:
        previous_ai_review_decision_payloads = []
    if previous_audit_event_payloads is None:
        previous_audit_event_payloads = []
    if previous_handoff_note_payloads is None:
        previous_handoff_note_payloads = []
    if not isinstance(previous_paper_payloads, list):
        raise ValueError("import_undo_paper_executions_must_be_array")
    if not isinstance(previous_portfolio_paper_payloads, list):
        raise ValueError("import_undo_portfolio_paper_order_batches_must_be_array")
    if not isinstance(previous_portfolio_paper_approval_payloads, list):
        raise ValueError("import_undo_portfolio_paper_order_approvals_must_be_array")
    if not isinstance(previous_portfolio_paper_simulation_payloads, list):
        raise ValueError("import_undo_portfolio_paper_order_simulations_must_be_array")
    if not isinstance(previous_ai_review_payloads, list):
        raise ValueError("import_undo_ai_reviews_must_be_array")
    if not isinstance(previous_ai_review_v2_payloads, list):
        raise ValueError("import_undo_ai_reviews_v2_must_be_array")
    if not isinstance(previous_ai_review_decision_payloads, list):
        raise ValueError("import_undo_ai_review_decisions_must_be_array")
    if not isinstance(previous_audit_event_payloads, list):
        raise ValueError("import_undo_audit_events_must_be_array")
    if not isinstance(previous_handoff_note_payloads, list):
        raise ValueError("import_undo_handoff_notes_must_be_array")

    previous_run = (
        _research_run_audit_from_payload(previous_run_payload) if isinstance(previous_run_payload, dict) else None
    )
    previous_note = (
        _research_note_from_payload(previous_note_payload) if isinstance(previous_note_payload, dict) else None
    )
    previous_strategy = (
        _strategy_record_from_payload(previous_strategy_payload) if isinstance(previous_strategy_payload, dict) else None
    )
    previous_paper_executions = [
        paper_execution_payload_to_record(item) for item in previous_paper_payloads if isinstance(item, dict)
    ]
    previous_portfolio_paper_orders = [
        portfolio_paper_order_payload_to_batch(item)
        for item in previous_portfolio_paper_payloads
        if isinstance(item, dict)
    ]
    previous_portfolio_paper_approvals = [
        portfolio_paper_order_payload_to_approval(item)
        for item in previous_portfolio_paper_approval_payloads
        if isinstance(item, dict)
    ]
    previous_portfolio_paper_simulations = [
        portfolio_paper_order_payload_to_simulation(item)
        for item in previous_portfolio_paper_simulation_payloads
        if isinstance(item, dict)
    ]
    previous_ai_reviews = [
        _ai_review_run_from_payload(item) for item in previous_ai_review_payloads if isinstance(item, dict)
    ]
    previous_ai_review_archive = {"aiReviewRuns": previous_ai_review_payloads}
    if "aiReviewRunsV2" in previous:
        previous_ai_review_archive["aiReviewRunsV2"] = previous_ai_review_v2_payloads
    if "aiReviewDecisions" in previous:
        previous_ai_review_archive["aiReviewDecisions"] = previous_ai_review_decision_payloads
    previous_audit_events = [dict(item) for item in previous_audit_event_payloads if isinstance(item, dict)]
    previous_handoff_notes = [
        handoff_note_from_payload(item) for item in previous_handoff_note_payloads if isinstance(item, dict)
    ]

    _preflight_ai_review_archive_snapshot(
        run_id=run_id,
        review_store=ai_review_store,
        decision_store=ai_review_decision_store,
        snapshot=previous_ai_review_archive,
    )
    _rollback_research_run_import(
        run_store=run_store,
        note_store=note_store,
        strategy_store=strategy_store,
        paper_execution_store=paper_execution_store,
        portfolio_paper_order_store=portfolio_paper_order_store,
        ai_review_store=ai_review_store,
        ai_review_decision_store=ai_review_decision_store,
        run_id=run_id,
        imported_note=dict(imported_note) if isinstance(imported_note, dict) else None,
        previous_run=previous_run,
        previous_note=previous_note,
        strategy_revision=str(snapshot.get("strategyRevision") or "").strip(),
        previous_strategy=previous_strategy,
        previous_paper_executions=previous_paper_executions,
        previous_portfolio_paper_orders=previous_portfolio_paper_orders,
        portfolio_paper_order_approval_store=portfolio_paper_order_approval_store,
        portfolio_paper_order_simulation_store=portfolio_paper_order_simulation_store,
        previous_portfolio_paper_order_approvals=previous_portfolio_paper_approvals,
        previous_portfolio_paper_order_simulations=previous_portfolio_paper_simulations,
        previous_ai_reviews=previous_ai_reviews,
        previous_ai_review_archive=previous_ai_review_archive,
        audit_event_store=audit_event_store,
        previous_audit_events=previous_audit_events,
        handoff_note_store=handoff_note_store,
        previous_handoff_notes=previous_handoff_notes,
    )
    return previous_run


def _rollback_research_run_import(
    *,
    run_store: ResearchRunStore,
    note_store: ResearchNoteStore,
    strategy_store: StrategyLibraryStore,
    paper_execution_store: PaperExecutionStore,
    portfolio_paper_order_store: PortfolioPaperOrderStore,
    portfolio_paper_order_approval_store: PortfolioPaperOrderApprovalStore,
    portfolio_paper_order_simulation_store: PortfolioPaperOrderSimulationStore,
    ai_review_store: AiReviewRunStore,
    audit_event_store: AuditEventStore,
    handoff_note_store: HandoffNoteStore | None,
    run_id: str,
    imported_note: dict[str, object] | None,
    previous_run: ResearchRunAudit | None,
    previous_note: ResearchNote | None,
    strategy_revision: str,
    previous_strategy: StrategyLibraryRecord | None,
    previous_paper_executions: list[PaperExecutionRecord],
    previous_portfolio_paper_orders: list[PortfolioPaperOrderBatch],
    previous_portfolio_paper_order_approvals: list[PortfolioPaperOrderApproval],
    previous_portfolio_paper_order_simulations: list[PortfolioPaperOrderSimulation],
    previous_ai_reviews: list[AiReviewRunRecord],
    previous_audit_events: list[object],
    previous_handoff_notes: list[HandoffNote],
    ai_review_decision_store: AiReviewDecisionStore | None = None,
    previous_ai_review_archive: dict[str, object] | None = None,
    restore_ai_review_archive: bool = True,
) -> None:
    audit_event_store.delete_by_run(run_id)
    for event in previous_audit_events:
        if isinstance(event, dict):
            audit_event_store.record(event)
        else:
            audit_event_store.record(audit_event_record_to_payload(event))

    if handoff_note_store:
        handoff_note_store.delete_by_subject(subject_type="research_run", subject_id=run_id)
        for note in previous_handoff_notes:
            handoff_note_store.restore(note)

    if not restore_ai_review_archive:
        pass
    elif previous_ai_review_archive is not None:
        if ai_review_decision_store is None:
            raise ValueError("ai_review_decision_store_required")
        _restore_ai_review_archive_snapshot(
            run_id=run_id,
            review_store=ai_review_store,
            decision_store=ai_review_decision_store,
            snapshot=previous_ai_review_archive,
        )
    else:
        ai_review_store.delete_by_run(run_id)
        for review in previous_ai_reviews:
            if isinstance(review, AuthoritativeAiReviewRunRecord):
                ai_review_store.record_v2(review.record)
            else:
                ai_review_store.record(review.record)

    paper_execution_store.delete_by_run(run_id)
    for execution in previous_paper_executions:
        paper_execution_store.record(execution)

    portfolio_paper_order_store.delete_by_base_run(run_id)
    for batch in previous_portfolio_paper_orders:
        portfolio_paper_order_store.record(batch)

    portfolio_paper_order_approval_store.delete_by_base_run(run_id)
    for approval in previous_portfolio_paper_order_approvals:
        portfolio_paper_order_approval_store.record(approval)

    portfolio_paper_order_simulation_store.delete_by_base_run(run_id)
    for simulation in previous_portfolio_paper_order_simulations:
        portfolio_paper_order_simulation_store.record(simulation)

    if strategy_revision:
        if previous_strategy:
            strategy_store.restore(previous_strategy)
        else:
            strategy_store.delete(strategy_revision)

    if imported_note:
        if previous_note:
            note_store.save(
                market=previous_note.market,
                symbol=previous_note.symbol,
                timeframe=previous_note.timeframe,
                body=previous_note.body,
                updated_at=previous_note.updated_at,
            )
        else:
            note_store.delete(
                market=str(imported_note["market"]),
                symbol=str(imported_note["symbol"]),
                timeframe=str(imported_note["timeframe"]),
            )

    if previous_run:
        run_store.record(previous_run)
    else:
        run_store.delete(run_id)
