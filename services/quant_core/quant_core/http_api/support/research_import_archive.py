from __future__ import annotations

from quant_core.ai_review_decisions import (
    AiReviewDecisionStore,
    validate_ai_review_decision_archive_records,
)
from quant_core.ai_review_runs import (
    AiReviewRunRecord,
    AiReviewRunStore,
    AuthoritativeAiReviewRunRecord,
    ai_review_run_record_to_payload,
    validate_ai_review_archive_records,
)
from quant_core.runs import (
    research_run_import_ai_review_decisions,
    research_run_import_ai_review_runs,
    research_run_import_ai_review_runs_v2,
)

def _preflight_ai_review_archive(
    payload: dict[str, object],
    *,
    run_id: str,
    review_store: AiReviewRunStore | None = None,
    decision_store: AiReviewDecisionStore | None = None,
) -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]]]:
    legacy_envelopes = research_run_import_ai_review_runs(payload, run_id=run_id)
    v2_envelopes = research_run_import_ai_review_runs_v2(payload, run_id=run_id)
    decision_envelopes = research_run_import_ai_review_decisions(payload)

    legacy_payloads = [dict(envelope["record"]) for envelope in legacy_envelopes]
    authoritative_payloads = [dict(envelope["record"]) for envelope in v2_envelopes]
    decision_payloads = [dict(envelope["record"]) for envelope in decision_envelopes]
    legacy, authoritative = validate_ai_review_archive_records(
        run_id=run_id,
        legacy_records=legacy_payloads,
        authoritative_records=authoritative_payloads,
    )
    decisions = validate_ai_review_decision_archive_records(
        decision_payloads,
        authoritative,
    )
    if (review_store is None) != (decision_store is None):
        raise ValueError("ai_review_archive_stores_must_be_paired")
    if review_store is not None and decision_store is not None:
        if review_store.path.resolve() != decision_store.path.resolve():
            raise ValueError("ai_review_decision_store_path_mismatch")
        decision_store.preflight_archive_apply(
            run_id=run_id,
            legacy_records=legacy_payloads,
            authoritative_records=authoritative_payloads,
            decision_records=decision_payloads,
        )

    return (
        [dict(record.record) for record in legacy],
        [dict(review.record) for review in authoritative],
        [dict(decision.record) for decision in decisions],
    )


def _ai_review_decision_archive_payload(decision: object) -> dict[str, object]:
    record = dict(decision.record)
    return {
        "decisionId": decision.decision_id,
        "aiReviewId": decision.ai_review_id,
        "createdAt": decision.created_at.isoformat(),
        "record": record,
    }


def _snapshot_ai_review_archive(
    *,
    run_id: str,
    review_store: AiReviewRunStore,
    decision_store: AiReviewDecisionStore,
) -> dict[str, object]:
    reviews = review_store.list_all_by_run(run_id)
    legacy = [review for review in reviews if isinstance(review, AiReviewRunRecord)]
    authoritative = [
        review for review in reviews if isinstance(review, AuthoritativeAiReviewRunRecord)
    ]
    decisions = [
        decision
        for review in authoritative
        for decision in decision_store.list_by_review(review.ai_review_id)
    ]
    return {
        "aiReviewRuns": [ai_review_run_record_to_payload(review) for review in legacy],
        "aiReviewRunsV2": [ai_review_run_record_to_payload(review) for review in authoritative],
        "aiReviewDecisions": [
            _ai_review_decision_archive_payload(decision) for decision in decisions
        ],
    }


def _preflight_ai_review_archive_snapshot(
    *,
    run_id: str,
    review_store: AiReviewRunStore,
    decision_store: AiReviewDecisionStore,
    snapshot: dict[str, object],
) -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]], bool]:
    if review_store.path.resolve() != decision_store.path.resolve():
        raise ValueError("ai_review_decision_store_path_mismatch")
    mixed_legacy = snapshot.get("aiReviewRuns", [])
    if not isinstance(mixed_legacy, list):
        raise ValueError("import_undo_ai_review_archive_must_use_arrays")
    has_v2_array = "aiReviewRunsV2" in snapshot
    has_decision_array = "aiReviewDecisions" in snapshot
    if has_v2_array:
        v2_envelopes = snapshot.get("aiReviewRunsV2")
        if not isinstance(v2_envelopes, list):
            raise ValueError("import_undo_ai_review_archive_must_use_arrays")
        legacy_envelopes = mixed_legacy
    else:
        legacy_envelopes = []
        v2_envelopes = []
        for item in mixed_legacy:
            record = item.get("record") if isinstance(item, dict) else None
            if isinstance(record, dict) and record.get("schemaVersion") == 2:
                v2_envelopes.append(item)
            else:
                legacy_envelopes.append(item)
    decision_envelopes = snapshot.get("aiReviewDecisions", [])
    if not isinstance(decision_envelopes, list):
        raise ValueError("import_undo_ai_review_archive_must_use_arrays")

    legacy_normalized = research_run_import_ai_review_runs(
        {"aiReviewRuns": legacy_envelopes},
        run_id=run_id,
    )
    authoritative_normalized = research_run_import_ai_review_runs_v2(
        {"aiReviewRunsV2": v2_envelopes},
        run_id=run_id,
    )
    decision_normalized = research_run_import_ai_review_decisions(
        {"aiReviewDecisions": decision_envelopes}
    )
    legacy_payloads = [dict(item["record"]) for item in legacy_normalized]
    authoritative_payloads = [dict(item["record"]) for item in authoritative_normalized]
    decision_payloads = [dict(item["record"]) for item in decision_normalized]
    legacy, authoritative = validate_ai_review_archive_records(
        run_id=run_id,
        legacy_records=legacy_payloads,
        authoritative_records=authoritative_payloads,
    )
    decisions = validate_ai_review_decision_archive_records(
        decision_payloads,
        authoritative,
    )
    preserve_existing_decisions = not has_decision_array
    decision_store.preflight_archive_replace(
        run_id=run_id,
        legacy_records=[record.record for record in legacy],
        authoritative_records=[record.record for record in authoritative],
        decision_records=[record.record for record in decisions],
        preserve_existing_decisions=preserve_existing_decisions,
    )
    return (
        [dict(record.record) for record in legacy],
        [dict(record.record) for record in authoritative],
        [dict(record.record) for record in decisions],
        preserve_existing_decisions,
    )


def _restore_ai_review_archive_snapshot(
    *,
    run_id: str,
    review_store: AiReviewRunStore,
    decision_store: AiReviewDecisionStore,
    snapshot: dict[str, object],
) -> None:
    legacy, authoritative, decisions, preserve_existing_decisions = (
        _preflight_ai_review_archive_snapshot(
            run_id=run_id,
            review_store=review_store,
            decision_store=decision_store,
            snapshot=snapshot,
        )
    )
    decision_store.replace_archive_atomic(
        run_id=run_id,
        legacy_records=legacy,
        authoritative_records=authoritative,
        decision_records=decisions,
        preserve_existing_decisions=preserve_existing_decisions,
    )
