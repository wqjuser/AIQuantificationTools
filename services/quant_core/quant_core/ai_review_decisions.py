from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from quant_core.ai_review_runs import AiReviewRunStore, AuthoritativeAiReviewRunRecord
from quant_core.canonical import canonical_json, canonical_sha256


_DECISION_STATUSES = {
    "accepted_for_research",
    "revision_requested",
    "rejected",
    "insufficient_evidence",
}
_DECISION_BOUNDARY = {
    "paperOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionAllowed": False,
}
_REQUEST_FIELDS = {
    "operator",
    "status",
    "rationale",
    "supersedesDecisionId",
}
_RECORD_FIELDS = {
    "schemaVersion",
    "recordType",
    "decisionId",
    "aiReviewId",
    "createdAt",
    "operator",
    "status",
    "rationale",
    "supersedesDecisionId",
    "reviewRecordHash",
    "evidenceHash",
    "boundary",
    "recordHash",
}
_SELECT_COLUMNS = (
    "rowid, decision_id, ai_review_id, created_at, supersedes_decision_id, "
    "review_record_hash, evidence_hash, record_json"
)


DecisionStatus = Literal[
    "accepted_for_research",
    "revision_requested",
    "rejected",
    "insufficient_evidence",
]


@dataclass(frozen=True)
class AiReviewDecisionRecord:
    decision_id: str
    ai_review_id: str
    created_at: datetime
    operator: str
    status: DecisionStatus
    rationale: str
    supersedes_decision_id: str | None
    review_record_hash: str
    evidence_hash: str
    record_hash: str
    record: dict[str, Any]


class AiReviewDecisionStore:
    def __init__(
        self,
        path: str | Path,
        *,
        review_store: AiReviewRunStore,
    ) -> None:
        self.path = Path(path)
        self.review_store = review_store
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path, timeout=30)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            connection.execute(
                """
                create table if not exists ai_review_decisions (
                    decision_id text primary key,
                    ai_review_id text not null,
                    created_at text not null,
                    supersedes_decision_id text,
                    review_record_hash text not null,
                    evidence_hash text not null,
                    record_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_ai_review_decisions_review_created
                on ai_review_decisions(ai_review_id, created_at, decision_id)
                """
            )
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def append(
        self,
        ai_review_id: str,
        request: dict[str, Any],
    ) -> AiReviewDecisionRecord:
        normalized_request = _normalize_request(request)
        review = self._authoritative_review(ai_review_id)
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            decisions = self._validated_rows(connection, review)
            expected_predecessor = decisions[-1].decision_id if decisions else None
            if normalized_request["supersedesDecisionId"] != expected_predecessor:
                raise ValueError("decision_conflict")

            record = {
                "schemaVersion": 1,
                "recordType": "aiqt.aiReviewDecision",
                "decisionId": f"ai-review-decision-{uuid4().hex}",
                "aiReviewId": review.ai_review_id,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                **normalized_request,
                "reviewRecordHash": review.record_hash,
                "evidenceHash": review.evidence_hash,
                "boundary": _DECISION_BOUNDARY,
            }
            record["recordHash"] = canonical_sha256(record)
            stored = _decision_record(record)
            self._insert(connection, stored)
            connection.commit()
            return stored
        except sqlite3.IntegrityError:
            connection.rollback()
            raise ValueError("ai_review_decision_record_conflict") from None
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def restore_validated(self, record: dict[str, Any]) -> AiReviewDecisionRecord:
        stored = _decision_record(record)
        review = self._authoritative_review(stored.ai_review_id)
        _validate_review_binding(stored, review)
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            existing_row = connection.execute(
                f"select {_SELECT_COLUMNS} from ai_review_decisions where decision_id = ?",
                (stored.decision_id,),
            ).fetchone()
            if existing_row is not None:
                existing = _row_to_decision(existing_row)
                if existing.record_hash != stored.record_hash:
                    raise ValueError("ai_review_decision_record_conflict")
                self._validated_rows(connection, review)
                connection.commit()
                return existing

            latest = self._latest_row(connection, stored.ai_review_id)
            expected_predecessor = str(latest[1]) if latest is not None else None
            if stored.supersedes_decision_id != expected_predecessor:
                raise ValueError("decision_conflict")
            self._insert(connection, stored)
            self._validated_rows(connection, review)
            connection.commit()
            return stored
        except sqlite3.IntegrityError:
            connection.rollback()
            raise ValueError("ai_review_decision_record_conflict") from None
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def list_by_review(self, ai_review_id: str) -> list[AiReviewDecisionRecord]:
        review = self._authoritative_review(ai_review_id)
        connection = self._connect()
        try:
            return self._validated_rows(connection, review)
        finally:
            connection.close()

    def latest(self, ai_review_id: str) -> AiReviewDecisionRecord | None:
        decisions = self.list_by_review(ai_review_id)
        return decisions[-1] if decisions else None

    def _authoritative_review(self, ai_review_id: str) -> AuthoritativeAiReviewRunRecord:
        review = self.review_store.get(ai_review_id)
        if review is None:
            raise ValueError("ai_review_not_found")
        if not isinstance(review, AuthoritativeAiReviewRunRecord):
            raise ValueError("ai_review_not_authoritative")
        return review

    def _latest_row(
        self,
        connection: sqlite3.Connection,
        ai_review_id: str,
    ) -> tuple[Any, ...] | None:
        return connection.execute(
            f"""
            select {_SELECT_COLUMNS}
            from ai_review_decisions
            where ai_review_id = ?
            order by rowid desc
            limit 1
            """,
            (ai_review_id,),
        ).fetchone()

    def _validated_rows(
        self,
        connection: sqlite3.Connection,
        review: AuthoritativeAiReviewRunRecord,
    ) -> list[AiReviewDecisionRecord]:
        rows = connection.execute(
            f"""
            select {_SELECT_COLUMNS}
            from ai_review_decisions
            where ai_review_id = ?
            order by rowid
            """,
            (review.ai_review_id,),
        ).fetchall()
        decisions: list[AiReviewDecisionRecord] = []
        expected_predecessor: str | None = None
        for row in rows:
            decision = _row_to_decision(row)
            _validate_review_binding(decision, review)
            if decision.supersedes_decision_id != expected_predecessor:
                raise ValueError("decision_conflict")
            decisions.append(decision)
            expected_predecessor = decision.decision_id
        return decisions

    @staticmethod
    def _insert(
        connection: sqlite3.Connection,
        stored: AiReviewDecisionRecord,
    ) -> None:
        connection.execute(
            """
            insert into ai_review_decisions (
                decision_id,
                ai_review_id,
                created_at,
                supersedes_decision_id,
                review_record_hash,
                evidence_hash,
                record_json
            )
            values (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                stored.decision_id,
                stored.ai_review_id,
                stored.record["createdAt"],
                stored.supersedes_decision_id,
                stored.review_record_hash,
                stored.evidence_hash,
                canonical_json(stored.record),
            ),
        )


def _normalize_request(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != _REQUEST_FIELDS:
        raise ValueError("invalid_ai_review_decision_request")
    operator = _bounded_string(value.get("operator"), minimum=1, maximum=80)
    rationale = _bounded_string(value.get("rationale"), minimum=1, maximum=2000)
    status = value.get("status")
    predecessor = value.get("supersedesDecisionId")
    if (
        not isinstance(status, str)
        or status not in _DECISION_STATUSES
        or not _optional_identifier(predecessor)
    ):
        raise ValueError("invalid_ai_review_decision_request")
    return {
        "operator": operator,
        "status": status,
        "rationale": rationale,
        "supersedesDecisionId": predecessor,
    }


def _decision_record(value: Any) -> AiReviewDecisionRecord:
    if not isinstance(value, dict) or set(value) != _RECORD_FIELDS:
        raise ValueError("ai_review_decision_record_invalid")
    if value.get("schemaVersion") != 1 or value.get("recordType") != "aiqt.aiReviewDecision":
        raise ValueError("ai_review_decision_record_invalid")

    decision_id = _identifier(value.get("decisionId"))
    ai_review_id = _identifier(value.get("aiReviewId"))
    created_at_text = _identifier(value.get("createdAt"))
    try:
        created_at = datetime.fromisoformat(created_at_text.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError("ai_review_decision_record_invalid") from None
    if created_at.tzinfo is None:
        raise ValueError("ai_review_decision_record_invalid")

    try:
        request = _normalize_request(
            {
                "operator": value.get("operator"),
                "status": value.get("status"),
                "rationale": value.get("rationale"),
                "supersedesDecisionId": value.get("supersedesDecisionId"),
            }
        )
    except ValueError:
        raise ValueError("ai_review_decision_record_invalid") from None

    review_record_hash = _hash(value.get("reviewRecordHash"))
    evidence_hash = _hash(value.get("evidenceHash"))
    if value.get("boundary") != _DECISION_BOUNDARY:
        raise ValueError("ai_review_decision_boundary_invalid")
    record_hash = _hash(value.get("recordHash"))
    expected_hash = canonical_sha256(
        {key: item for key, item in value.items() if key != "recordHash"}
    )
    if record_hash != expected_hash:
        raise ValueError("ai_review_decision_record_hash_mismatch")

    normalized = json.loads(canonical_json(value))
    return AiReviewDecisionRecord(
        decision_id=decision_id,
        ai_review_id=ai_review_id,
        created_at=created_at,
        operator=request["operator"],
        status=request["status"],
        rationale=request["rationale"],
        supersedes_decision_id=request["supersedesDecisionId"],
        review_record_hash=review_record_hash,
        evidence_hash=evidence_hash,
        record_hash=record_hash,
        record=normalized,
    )


def _row_to_decision(row: tuple[Any, ...]) -> AiReviewDecisionRecord:
    try:
        decoded = json.loads(str(row[7]))
        stored = _decision_record(decoded)
    except (json.JSONDecodeError, TypeError, ValueError):
        raise ValueError("ai_review_decision_record_conflict") from None
    if (
        stored.decision_id != row[1]
        or stored.ai_review_id != row[2]
        or stored.record["createdAt"] != row[3]
        or stored.supersedes_decision_id != row[4]
        or stored.review_record_hash != row[5]
        or stored.evidence_hash != row[6]
        or canonical_json(stored.record) != row[7]
    ):
        raise ValueError("ai_review_decision_record_conflict")
    return stored


def _validate_review_binding(
    decision: AiReviewDecisionRecord,
    review: AuthoritativeAiReviewRunRecord,
) -> None:
    if decision.review_record_hash != review.record_hash:
        raise ValueError("ai_review_decision_review_hash_mismatch")
    if decision.evidence_hash != review.evidence_hash:
        raise ValueError("ai_review_decision_evidence_hash_mismatch")


def _bounded_string(value: Any, *, minimum: int, maximum: int) -> str:
    if (
        not isinstance(value, str)
        or value != value.strip()
        or not minimum <= len(value) <= maximum
    ):
        raise ValueError("invalid_ai_review_decision_request")
    return value


def _identifier(value: Any) -> str:
    if not isinstance(value, str) or not value or value != value.strip():
        raise ValueError("ai_review_decision_record_invalid")
    return value


def _optional_identifier(value: Any) -> bool:
    return value is None or (
        isinstance(value, str) and bool(value) and value == value.strip()
    )


def _hash(value: Any) -> str:
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(character not in "0123456789abcdef" for character in value)
    ):
        raise ValueError("ai_review_decision_record_invalid")
    return value
