from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from quant_core.ai_review_decisions import (
    AiReviewDecisionRecord,
    _DECISION_BOUNDARY,
    _decision_record,
    _normalize_request,
    _validate_review_binding,
    validate_ai_review_decision_archive_records,
)
from quant_core.ai_review_runs import (
    AiReviewRunRecord,
    AuthoritativeAiReviewRunRecord,
    _authoritative_ai_review_run_record,
    _normalize_ai_review_record,
    validate_ai_review_archive_records,
)
from quant_core.canonical import canonical_sha256

from .base import TenantModelRepository


AiReviewRecord = AiReviewRunRecord | AuthoritativeAiReviewRunRecord


class TenantAiReviewRunStore:
    def __init__(self, repository: TenantModelRepository, owner_id: str):
        self.repository = repository
        self.path = Path(f"/public-tenant/{owner_id}/ai-review-records")

    def record(self, record: dict[str, Any]) -> AiReviewRunRecord:
        normalized = _normalize_ai_review_record(record)
        stored = AiReviewRunRecord(
            str(normalized["aiReviewId"]),
            str(normalized["runId"]),
            datetime.fromisoformat(str(normalized["createdAt"])),
            normalized,
        )
        existing = self.get(stored.ai_review_id)
        if isinstance(existing, AuthoritativeAiReviewRunRecord):
            raise ValueError("ai_review_record_conflict")
        return self.repository.put(stored.ai_review_id, stored)

    def record_v2(self, record: dict[str, Any]) -> AuthoritativeAiReviewRunRecord:
        stored = _authoritative_ai_review_run_record(record)
        existing = self.get(stored.ai_review_id)
        if existing is not None:
            if (
                isinstance(existing, AuthoritativeAiReviewRunRecord)
                and existing.record_hash == stored.record_hash
            ):
                return existing
            raise ValueError("ai_review_record_conflict")
        return self.repository.put(stored.ai_review_id, stored)

    def get(self, ai_review_id: str) -> AiReviewRecord | None:
        return self.repository.get(str(ai_review_id or "").strip())

    def list_recent(
        self,
        *,
        run_id: str | None = None,
        experiment_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AiReviewRecord]:
        needle = query.strip().casefold()
        records = [
            record
            for record in self.repository.all()
            if (run_id is None or record.run_id == run_id)
            and (
                experiment_id is None
                or isinstance(record, AuthoritativeAiReviewRunRecord)
                and record.primary_experiment_id == experiment_id
            )
            and (
                not needle
                or needle
                in f"{record.ai_review_id} {record.run_id} {record.record}".casefold()
            )
        ]
        records.sort(key=lambda record: (record.created_at, record.ai_review_id), reverse=True)
        start = max(0, int(offset))
        return records[start : start + max(1, min(int(limit), 100))]

    def list_by_run(
        self,
        run_id: str,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AiReviewRecord]:
        return self.list_recent(
            run_id=run_id,
            limit=limit,
            offset=offset,
            query=query,
        )

    def list_by_experiment(
        self,
        experiment_id: str,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AuthoritativeAiReviewRunRecord]:
        return [
            record
            for record in self.list_recent(
                experiment_id=experiment_id,
                limit=limit,
                offset=offset,
                query=query,
            )
            if isinstance(record, AuthoritativeAiReviewRunRecord)
        ]

    def list_all_by_run(self, run_id: str) -> list[AiReviewRecord]:
        records = [record for record in self.repository.all() if record.run_id == run_id]
        return sorted(
            records,
            key=lambda record: (record.created_at, record.ai_review_id),
            reverse=True,
        )

    def count_recent(self, **filters: Any) -> int:
        return len(
            [
                record
                for record in self.repository.all()
                if (filters.get("run_id") is None or record.run_id == filters["run_id"])
                and (
                    filters.get("experiment_id") is None
                    or isinstance(record, AuthoritativeAiReviewRunRecord)
                    and record.primary_experiment_id == filters["experiment_id"]
                )
            ]
        )

    def count_by_run(self, run_id: str, query: str = "") -> int:
        return self.count_recent(run_id=run_id, query=query)

    def delete_by_run(self, run_id: str) -> None:
        for record in self.list_all_by_run(run_id):
            self.repository.delete(record.ai_review_id)

    def validate_archive_ownership(
        self,
        *,
        legacy_records: list[AiReviewRunRecord],
        authoritative_records: list[AuthoritativeAiReviewRunRecord],
        replace_run_id: str | None = None,
    ) -> None:
        for incoming in [*legacy_records, *authoritative_records]:
            existing = self.get(incoming.ai_review_id)
            if existing is None:
                continue
            if existing.run_id != incoming.run_id:
                raise ValueError("ai_review_archive_owner_conflict")
            if replace_run_id is not None and existing.run_id == replace_run_id:
                continue
            if type(existing) is not type(incoming):
                raise ValueError("ai_review_archive_owner_conflict")
            if (
                isinstance(incoming, AuthoritativeAiReviewRunRecord)
                and existing.record_hash != incoming.record_hash
            ):
                raise ValueError("ai_review_record_conflict")

    def validate_archive_ownership_in_transaction(self, connection=None, **kwargs: Any) -> None:
        self.validate_archive_ownership(**kwargs)

    def write_archive_records_in_transaction(
        self,
        connection=None,
        *,
        legacy_records: list[AiReviewRunRecord],
        authoritative_records: list[AuthoritativeAiReviewRunRecord],
        replace_run_id: str | None = None,
    ) -> None:
        self.validate_archive_ownership(
            legacy_records=legacy_records,
            authoritative_records=authoritative_records,
            replace_run_id=replace_run_id,
        )
        if replace_run_id is not None:
            self.delete_by_run(replace_run_id)
        for record in [*legacy_records, *authoritative_records]:
            self.repository.put(record.ai_review_id, record)

    def list_archive_by_run_in_transaction(self, connection, run_id: str) -> list[AiReviewRecord]:
        return self.list_all_by_run(run_id)


class TenantAiReviewDecisionStore:
    def __init__(
        self,
        repository: TenantModelRepository,
        *,
        review_store: TenantAiReviewRunStore,
    ) -> None:
        self.repository = repository
        self.review_store = review_store
        self.path = review_store.path

    def append(self, ai_review_id: str, request: dict[str, Any]) -> AiReviewDecisionRecord:
        normalized = _normalize_request(request)
        review = self._authoritative_review(ai_review_id)
        decisions = self.list_by_review(ai_review_id)
        predecessor = decisions[-1].decision_id if decisions else None
        if normalized["supersedesDecisionId"] != predecessor:
            raise ValueError("decision_conflict")
        record = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiReviewDecision",
            "decisionId": f"ai-review-decision-{uuid4().hex}",
            "aiReviewId": review.ai_review_id,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            **normalized,
            "reviewRecordHash": review.record_hash,
            "evidenceHash": review.evidence_hash,
            "boundary": _DECISION_BOUNDARY,
        }
        record["recordHash"] = canonical_sha256(record)
        return self.restore_validated(record)

    def restore_validated(self, record: dict[str, Any]) -> AiReviewDecisionRecord:
        stored = _decision_record(record)
        review = self._authoritative_review(stored.ai_review_id)
        _validate_review_binding(stored, review)
        existing = self.repository.get(stored.decision_id)
        if existing is not None:
            if existing.record_hash != stored.record_hash:
                raise ValueError("ai_review_decision_record_conflict")
            return existing
        decisions = self.list_by_review(stored.ai_review_id)
        predecessor = decisions[-1].decision_id if decisions else None
        if stored.supersedes_decision_id != predecessor:
            raise ValueError("decision_conflict")
        return self.repository.put(stored.decision_id, stored)

    def list_by_review(self, ai_review_id: str) -> list[AiReviewDecisionRecord]:
        review = self._authoritative_review(ai_review_id)
        decisions = [
            record
            for record in self.repository.all()
            if record.ai_review_id == ai_review_id
        ]
        decisions.sort(key=lambda record: (record.created_at, record.decision_id))
        predecessor = None
        for decision in decisions:
            _validate_review_binding(decision, review)
            if decision.supersedes_decision_id != predecessor:
                raise ValueError("decision_conflict")
            predecessor = decision.decision_id
        return decisions

    def latest(self, ai_review_id: str) -> AiReviewDecisionRecord | None:
        decisions = self.list_by_review(ai_review_id)
        return decisions[-1] if decisions else None

    def delete_by_reviews(self, ai_review_ids: list[str]) -> None:
        review_ids = set(ai_review_ids)
        for decision in self.repository.all():
            if decision.ai_review_id in review_ids:
                self.repository.delete(decision.decision_id)

    def preflight_archive_apply(
        self,
        *,
        run_id: str,
        legacy_records: list[dict[str, Any]],
        authoritative_records: list[dict[str, Any]],
        decision_records: list[dict[str, Any]],
    ) -> None:
        legacy, authoritative = validate_ai_review_archive_records(
            run_id=run_id,
            legacy_records=legacy_records,
            authoritative_records=authoritative_records,
        )
        decisions = validate_ai_review_decision_archive_records(
            decision_records,
            authoritative,
        )
        self.review_store.validate_archive_ownership(
            legacy_records=legacy,
            authoritative_records=authoritative,
        )
        self._validate_decision_conflicts(decisions)

    def apply_archive_atomic(self, **kwargs: Any) -> None:
        self.preflight_archive_apply(**kwargs)
        legacy, authoritative = validate_ai_review_archive_records(
            run_id=kwargs["run_id"],
            legacy_records=kwargs["legacy_records"],
            authoritative_records=kwargs["authoritative_records"],
        )
        decisions = validate_ai_review_decision_archive_records(
            kwargs["decision_records"],
            authoritative,
        )
        self.review_store.write_archive_records_in_transaction(
            legacy_records=legacy,
            authoritative_records=authoritative,
        )
        for decision in decisions:
            existing = self.repository.get(decision.decision_id)
            if existing is None:
                self.repository.put(decision.decision_id, decision)

    def preflight_archive_replace(self, *, preserve_existing_decisions: bool, **kwargs: Any) -> None:
        if preserve_existing_decisions:
            current = self.review_store.list_all_by_run(kwargs["run_id"])
            current_ids = {
                review.ai_review_id
                for review in current
                if isinstance(review, AuthoritativeAiReviewRunRecord)
            }
            kwargs = {
                **kwargs,
                "decision_records": [
                    decision.record
                    for review_id in current_ids
                    for decision in self.list_by_review(review_id)
                ],
            }
        self.preflight_archive_apply(**kwargs)

    def replace_archive_atomic(
        self,
        *,
        preserve_existing_decisions: bool,
        **kwargs: Any,
    ) -> None:
        self.preflight_archive_replace(
            preserve_existing_decisions=preserve_existing_decisions,
            **kwargs,
        )
        current = self.review_store.list_all_by_run(kwargs["run_id"])
        current_ids = {review.ai_review_id for review in current}
        if not preserve_existing_decisions:
            self.delete_by_reviews(list(current_ids))
        self.review_store.delete_by_run(kwargs["run_id"])
        self.apply_archive_atomic(**kwargs)

    def _authoritative_review(self, ai_review_id: str) -> AuthoritativeAiReviewRunRecord:
        review = self.review_store.get(ai_review_id)
        if review is None:
            raise ValueError("ai_review_not_found")
        if not isinstance(review, AuthoritativeAiReviewRunRecord):
            raise ValueError("ai_review_not_authoritative")
        return review

    def _validate_decision_conflicts(self, decisions: list[AiReviewDecisionRecord]) -> None:
        for decision in decisions:
            existing = self.repository.get(decision.decision_id)
            if existing is not None and (
                existing.record_hash != decision.record_hash
                or existing.ai_review_id != decision.ai_review_id
            ):
                raise ValueError("ai_review_decision_record_conflict")
