from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ALLOWED_HANDOFF_NOTE_SUBJECT_TYPES = {
    "research_run",
    "strategy_version",
    "portfolio_order_batch",
    "p0_acceptance",
}


@dataclass(frozen=True)
class HandoffNote:
    note_id: str
    subject_type: str
    subject_id: str
    body: str
    author: str
    source_workspace: str
    updated_at: datetime
    audit_event_id: str | None


class HandoffNoteStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        if self.path.parent:
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def save(
        self,
        *,
        subject_type: str,
        subject_id: str,
        body: str,
        author: str = "local-operator",
        source_workspace: str = "local",
        note_id: str | None = None,
        updated_at: datetime | None = None,
        audit_event_id: str | None = None,
    ) -> HandoffNote:
        normalized_subject_type, normalized_subject_id = _normalize_subject(subject_type, subject_id)
        normalized_note_id = _normalize_note_id(note_id)
        normalized_body = _normalize_body(body)
        normalized_author = _normalize_short_text(author, default="local-operator")
        normalized_source_workspace = _normalize_short_text(source_workspace, default="local")
        timestamp = _normalize_datetime(updated_at) or datetime.now(timezone.utc)
        normalized_audit_event_id = _optional_text(audit_event_id)

        connection = self._connect()
        try:
            connection.execute(
                """
                insert into handoff_notes (
                    note_id,
                    subject_type,
                    subject_id,
                    body,
                    author,
                    source_workspace,
                    updated_at,
                    audit_event_id
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(note_id) do update set
                    subject_type = excluded.subject_type,
                    subject_id = excluded.subject_id,
                    body = excluded.body,
                    author = excluded.author,
                    source_workspace = excluded.source_workspace,
                    updated_at = excluded.updated_at,
                    audit_event_id = excluded.audit_event_id
                """,
                (
                    normalized_note_id,
                    normalized_subject_type,
                    normalized_subject_id,
                    normalized_body,
                    normalized_author,
                    normalized_source_workspace,
                    timestamp.isoformat(),
                    normalized_audit_event_id,
                ),
            )
            connection.commit()
        finally:
            connection.close()
        stored = self.get(normalized_note_id)
        if stored is None:
            raise RuntimeError("handoff_note_write_failed")
        return stored

    def restore(self, note: HandoffNote) -> HandoffNote:
        return self.save(
            note_id=note.note_id,
            subject_type=note.subject_type,
            subject_id=note.subject_id,
            body=note.body,
            author=note.author,
            source_workspace=note.source_workspace,
            updated_at=note.updated_at,
            audit_event_id=note.audit_event_id,
        )

    def get(self, note_id: str) -> HandoffNote | None:
        normalized_note_id = _optional_text(note_id)
        if not normalized_note_id:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select note_id, subject_type, subject_id, body, author, source_workspace, updated_at, audit_event_id
                from handoff_notes
                where note_id = ?
                """,
                (normalized_note_id,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_handoff_note(row) if row else None

    def list_by_subject(self, *, subject_type: str, subject_id: str, limit: int = 50) -> list[HandoffNote]:
        normalized_subject_type, normalized_subject_id = _normalize_subject(subject_type, subject_id)
        bounded_limit = _bounded_limit(limit)
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select note_id, subject_type, subject_id, body, author, source_workspace, updated_at, audit_event_id
                from handoff_notes
                where subject_type = ? and subject_id = ?
                order by updated_at desc, note_id desc
                limit ?
                """,
                (normalized_subject_type, normalized_subject_id, bounded_limit),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_handoff_note(row) for row in rows]

    def count_by_subject(self, *, subject_type: str, subject_id: str) -> int:
        normalized_subject_type, normalized_subject_id = _normalize_subject(subject_type, subject_id)
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select count(*)
                from handoff_notes
                where subject_type = ? and subject_id = ?
                """,
                (normalized_subject_type, normalized_subject_id),
            ).fetchone()
        finally:
            connection.close()
        return int(row[0]) if row else 0

    def list_by_run(self, run_id: str, *, limit: int = 50) -> list[HandoffNote]:
        return self.list_by_subject(subject_type="research_run", subject_id=run_id, limit=limit)

    def delete(self, note_id: str) -> None:
        normalized_note_id = _optional_text(note_id)
        if not normalized_note_id:
            return
        connection = self._connect()
        try:
            connection.execute("delete from handoff_notes where note_id = ?", (normalized_note_id,))
            connection.commit()
        finally:
            connection.close()

    def delete_by_subject(self, *, subject_type: str, subject_id: str) -> None:
        normalized_subject_type, normalized_subject_id = _normalize_subject(subject_type, subject_id)
        connection = self._connect()
        try:
            connection.execute(
                "delete from handoff_notes where subject_type = ? and subject_id = ?",
                (normalized_subject_type, normalized_subject_id),
            )
            connection.commit()
        finally:
            connection.close()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _ensure_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists handoff_notes (
                    note_id text primary key,
                    subject_type text not null,
                    subject_id text not null,
                    body text not null,
                    author text not null,
                    source_workspace text not null,
                    updated_at text not null,
                    audit_event_id text
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_handoff_notes_subject_updated_at
                on handoff_notes(subject_type, subject_id, updated_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()


def create_handoff_note_id() -> str:
    return f"handoff-{uuid.uuid4().hex[:16]}"


def handoff_note_to_payload(note: HandoffNote) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "noteId": note.note_id,
        "subjectType": note.subject_type,
        "subjectId": note.subject_id,
        "body": note.body,
        "author": note.author,
        "sourceWorkspace": note.source_workspace,
        "updatedAt": note.updated_at.isoformat(),
        "auditEventId": note.audit_event_id,
        "paperOnly": True,
        "liveTradingAllowed": False,
    }


def handoff_note_from_payload(payload: dict[str, Any]) -> HandoffNote:
    normalized = normalize_handoff_note_payloads([payload], strict=True)[0]
    return HandoffNote(
        note_id=str(normalized["noteId"]),
        subject_type=str(normalized["subjectType"]),
        subject_id=str(normalized["subjectId"]),
        body=str(normalized["body"]),
        author=str(normalized["author"]),
        source_workspace=str(normalized["sourceWorkspace"]),
        updated_at=_parse_datetime(str(normalized["updatedAt"])),
        audit_event_id=_optional_text(normalized.get("auditEventId")),
    )


def normalize_handoff_note_payloads(
    value: list[dict[str, Any]] | None,
    *,
    subject_type: str | None = None,
    subject_id: str | None = None,
    strict: bool = False,
) -> list[dict[str, Any]]:
    if value is None:
        return []
    if not isinstance(value, list):
        if strict:
            raise ValueError("handoff_notes_must_be_array")
        return []

    expected_subject_type = str(subject_type or "").strip()
    expected_subject_id = str(subject_id or "").strip()
    normalized: list[dict[str, Any]] = []
    for item in value:
        if not isinstance(item, dict):
            if strict:
                raise ValueError("handoff_note_must_be_object")
            continue
        if strict and int(_number_or_default(item.get("schemaVersion"), 0)) != 1:
            raise ValueError("unsupported_handoff_note_schema_version")
        note_id = str(item.get("noteId") or "").strip()
        note_subject_type = str(item.get("subjectType") or expected_subject_type).strip()
        note_subject_id = str(item.get("subjectId") or expected_subject_id).strip()
        if strict and not note_id:
            raise ValueError("handoff_note_id_required")
        if note_subject_type not in ALLOWED_HANDOFF_NOTE_SUBJECT_TYPES:
            if strict:
                raise ValueError("unsupported_handoff_note_subject_type")
            continue
        if not note_subject_id:
            if strict:
                raise ValueError("handoff_note_subject_id_required")
            continue
        if expected_subject_type and note_subject_type != expected_subject_type:
            if strict:
                raise ValueError("handoff_note_subject_type_mismatch")
            continue
        if expected_subject_id and note_subject_id != expected_subject_id:
            if strict:
                raise ValueError("handoff_note_subject_id_mismatch")
            continue
        body = str(item.get("body") or "").strip()
        if strict and not body:
            raise ValueError("handoff_note_body_required")
        updated_at = str(item.get("updatedAt") or "").strip()
        if strict and not updated_at:
            raise ValueError("handoff_note_updated_at_required")
        if updated_at:
            updated_at = _parse_datetime(updated_at).isoformat()
        normalized.append(
            {
                "schemaVersion": 1,
                "noteId": note_id or create_handoff_note_id(),
                "subjectType": note_subject_type,
                "subjectId": note_subject_id,
                "body": body,
                "author": _normalize_short_text(item.get("author"), default="local-operator"),
                "sourceWorkspace": _normalize_short_text(item.get("sourceWorkspace"), default="local"),
                "updatedAt": updated_at or datetime.now(timezone.utc).isoformat(),
                "auditEventId": _optional_text(item.get("auditEventId")),
                "paperOnly": True,
                "liveTradingAllowed": False,
            }
        )
    return normalized


def handoff_note_to_audit_event_payload(note: HandoffNote) -> dict[str, Any]:
    event_id = note.audit_event_id or f"handoff-note:{note.note_id}"
    return {
        "schemaVersion": 1,
        "eventId": event_id,
        "eventType": "handoff_note",
        "runId": note.subject_id if note.subject_type == "research_run" else None,
        "createdAt": note.updated_at.isoformat(),
        "stage": "handoff",
        "source": "local-handoff-notes",
        "summary": f"Handoff note saved for {note.subject_type}:{note.subject_id}",
        "detail": note.body[:1000],
        "metadata": {
            "noteId": note.note_id,
            "subjectType": note.subject_type,
            "subjectId": note.subject_id,
            "author": note.author,
            "sourceWorkspace": note.source_workspace,
            "paperOnly": True,
            "liveTradingAllowed": False,
        },
    }


def _row_to_handoff_note(row: tuple[Any, ...]) -> HandoffNote:
    return HandoffNote(
        note_id=str(row[0]),
        subject_type=str(row[1]),
        subject_id=str(row[2]),
        body=str(row[3]),
        author=str(row[4]),
        source_workspace=str(row[5]),
        updated_at=_parse_datetime(str(row[6])),
        audit_event_id=_optional_text(row[7]),
    )


def _normalize_subject(subject_type: str, subject_id: str) -> tuple[str, str]:
    normalized_subject_type = str(subject_type or "").strip()
    normalized_subject_id = str(subject_id or "").strip()
    if normalized_subject_type not in ALLOWED_HANDOFF_NOTE_SUBJECT_TYPES:
        raise ValueError("unsupported_handoff_note_subject_type")
    if not normalized_subject_id:
        raise ValueError("handoff_note_subject_id_required")
    return normalized_subject_type, normalized_subject_id


def _normalize_note_id(note_id: str | None) -> str:
    normalized = _optional_text(note_id)
    return normalized or create_handoff_note_id()


def _normalize_body(body: str) -> str:
    normalized = str(body or "").strip()
    if not normalized:
        raise ValueError("handoff_note_body_required")
    if len(normalized) > 20_000:
        raise ValueError("handoff_note_too_large")
    return normalized


def _normalize_short_text(value: Any, *, default: str) -> str:
    normalized = str(value or "").strip() or default
    if len(normalized) > 200:
        raise ValueError("handoff_note_field_too_large")
    return normalized


def _optional_text(value: Any) -> str | None:
    normalized = str(value or "").strip()
    return normalized or None


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _parse_datetime(value: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _number_or_default(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _bounded_limit(value: int) -> int:
    return max(1, min(int(_number_or_default(value, 50)), 200))
