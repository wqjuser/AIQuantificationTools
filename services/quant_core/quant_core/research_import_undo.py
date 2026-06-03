from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


@dataclass(frozen=True)
class ResearchRunImportUndoRecord:
    undo_token: str
    run_id: str
    created_at: datetime
    consumed_at: datetime | None
    snapshot: dict[str, Any]


class ResearchRunImportUndoStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def record(
        self,
        *,
        run_id: str,
        snapshot: dict[str, Any],
        created_at: datetime | None = None,
        undo_token: str | None = None,
    ) -> ResearchRunImportUndoRecord:
        token = undo_token or f"import-undo-{uuid4().hex}"
        created = created_at or datetime.now(timezone.utc)
        stored = ResearchRunImportUndoRecord(
            undo_token=token,
            run_id=run_id,
            created_at=created,
            consumed_at=None,
            snapshot=dict(snapshot),
        )
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into research_import_undo (
                    undo_token,
                    run_id,
                    created_at,
                    consumed_at,
                    snapshot_json
                )
                values (?, ?, ?, ?, ?)
                on conflict(undo_token) do update set
                    run_id = excluded.run_id,
                    created_at = excluded.created_at,
                    consumed_at = excluded.consumed_at,
                    snapshot_json = excluded.snapshot_json
                """,
                (
                    stored.undo_token,
                    stored.run_id,
                    stored.created_at.isoformat(),
                    None,
                    json.dumps(stored.snapshot, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return stored

    def get(self, undo_token: str | None) -> ResearchRunImportUndoRecord | None:
        token = str(undo_token or "").strip()
        if not token:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select undo_token, run_id, created_at, consumed_at, snapshot_json
                from research_import_undo
                where undo_token = ?
                limit 1
                """,
                (token,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_import_undo_record(row) if row else None

    def mark_consumed(self, undo_token: str, *, consumed_at: datetime | None = None) -> ResearchRunImportUndoRecord | None:
        token = str(undo_token or "").strip()
        if not token:
            return None
        consumed = consumed_at or datetime.now(timezone.utc)
        connection = self._connect()
        try:
            connection.execute(
                """
                update research_import_undo
                set consumed_at = ?
                where undo_token = ?
                """,
                (consumed.isoformat(), token),
            )
            connection.commit()
        finally:
            connection.close()
        return self.get(token)

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists research_import_undo (
                    undo_token text primary key,
                    run_id text not null,
                    created_at text not null,
                    consumed_at text,
                    snapshot_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_research_import_undo_run_created
                on research_import_undo(run_id, created_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()


def research_run_import_undo_record_to_payload(record: ResearchRunImportUndoRecord) -> dict[str, Any]:
    return {
        "undoToken": record.undo_token,
        "runId": record.run_id,
        "createdAt": record.created_at.isoformat(),
        "consumedAt": record.consumed_at.isoformat() if record.consumed_at else None,
        "status": "consumed" if record.consumed_at else "available",
    }


def _row_to_import_undo_record(row: tuple[Any, ...]) -> ResearchRunImportUndoRecord:
    consumed_at = _parse_optional_datetime(row[3])
    snapshot = json.loads(row[4])
    return ResearchRunImportUndoRecord(
        undo_token=str(row[0]),
        run_id=str(row[1]),
        created_at=_parse_datetime(str(row[2])),
        consumed_at=consumed_at,
        snapshot=snapshot if isinstance(snapshot, dict) else {},
    )


def _parse_optional_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    return _parse_datetime(str(value))


def _parse_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
