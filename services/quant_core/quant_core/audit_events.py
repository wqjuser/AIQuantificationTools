from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class AuditEventRecord:
    event_id: str
    event_type: str
    run_id: str | None
    created_at: datetime
    stage: str
    source: str
    summary: str
    detail: str
    metadata: dict[str, Any]


class AuditEventStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists audit_events (
                    event_id text primary key,
                    event_type text not null,
                    run_id text,
                    created_at text not null,
                    stage text not null,
                    source text not null,
                    summary text not null,
                    detail text not null,
                    metadata_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_audit_events_type_created_at
                on audit_events(event_type, created_at desc)
                """
            )
            connection.execute(
                """
                create index if not exists idx_audit_events_run_id_created_at
                on audit_events(run_id, created_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, event: dict[str, Any]) -> AuditEventRecord:
        normalized = _normalize_audit_event(event)
        stored = _normalized_to_audit_event_record(normalized)
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into audit_events (
                    event_id,
                    event_type,
                    run_id,
                    created_at,
                    stage,
                    source,
                    summary,
                    detail,
                    metadata_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(event_id) do update set
                    event_type = excluded.event_type,
                    run_id = excluded.run_id,
                    created_at = excluded.created_at,
                    stage = excluded.stage,
                    source = excluded.source,
                    summary = excluded.summary,
                    detail = excluded.detail,
                    metadata_json = excluded.metadata_json
                """,
                (
                    stored.event_id,
                    stored.event_type,
                    stored.run_id,
                    stored.created_at.isoformat(),
                    stored.stage,
                    stored.source,
                    stored.summary,
                    stored.detail,
                    json.dumps(stored.metadata, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return stored

    def record_if_absent(self, event: dict[str, Any]) -> tuple[AuditEventRecord, bool]:
        normalized = _normalize_audit_event(event)
        candidate = _normalized_to_audit_event_record(normalized)
        connection = self._connect()
        try:
            cursor = connection.execute(
                """
                insert into audit_events (
                    event_id,
                    event_type,
                    run_id,
                    created_at,
                    stage,
                    source,
                    summary,
                    detail,
                    metadata_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(event_id) do nothing
                """,
                (
                    candidate.event_id,
                    candidate.event_type,
                    candidate.run_id,
                    candidate.created_at.isoformat(),
                    candidate.stage,
                    candidate.source,
                    candidate.summary,
                    candidate.detail,
                    json.dumps(candidate.metadata, ensure_ascii=False, sort_keys=True),
                ),
            )
            created = cursor.rowcount == 1
            if created:
                stored = candidate
            else:
                row = connection.execute(
                    """
                    select event_id, event_type, run_id, created_at, stage, source, summary, detail, metadata_json
                    from audit_events
                    where event_id = ?
                    """,
                    (candidate.event_id,),
                ).fetchone()
                if row is None:
                    raise RuntimeError("audit_event_insert_conflict_without_existing_record")
                stored = _row_to_audit_event_record(row)
            connection.commit()
        finally:
            connection.close()
        return stored, created

    def get(self, event_id: str) -> AuditEventRecord | None:
        normalized_event_id = _optional_string(event_id)
        if not normalized_event_id:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select event_id, event_type, run_id, created_at, stage, source, summary, detail, metadata_json
                from audit_events
                where event_id = ?
                """,
                (normalized_event_id,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_audit_event_record(row) if row else None

    def list_recent(
        self,
        *,
        run_id: str | None = None,
        event_type: str | None = None,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AuditEventRecord]:
        bounded_limit = _bounded_limit(limit)
        bounded_offset = max(0, int(_number_or_default(offset, 0)))
        filter_sql, parameters = _filter_parameters(run_id=run_id, event_type=event_type, query=query)
        connection = self._connect()
        try:
            rows = connection.execute(
                f"""
                select event_id, event_type, run_id, created_at, stage, source, summary, detail, metadata_json
                from audit_events
                where {filter_sql}
                order by created_at desc
                limit ?
                offset ?
                """,
                (*parameters, bounded_limit, bounded_offset),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_audit_event_record(row) for row in rows]

    def list_all_by_run(self, run_id: str) -> list[AuditEventRecord]:
        normalized_run_id = _optional_string(run_id)
        if not normalized_run_id:
            return []
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select event_id, event_type, run_id, created_at, stage, source, summary, detail, metadata_json
                from audit_events
                where run_id = ?
                order by created_at desc
                """,
                (normalized_run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_audit_event_record(row) for row in rows]

    def delete_by_run(self, run_id: str) -> None:
        normalized_run_id = _optional_string(run_id)
        if not normalized_run_id:
            return
        connection = self._connect()
        try:
            connection.execute("delete from audit_events where run_id = ?", (normalized_run_id,))
            connection.commit()
        finally:
            connection.close()

    def count(
        self,
        *,
        run_id: str | None = None,
        event_type: str | None = None,
        query: str = "",
    ) -> int:
        filter_sql, parameters = _filter_parameters(run_id=run_id, event_type=event_type, query=query)
        connection = self._connect()
        try:
            row = connection.execute(
                f"""
                select count(*)
                from audit_events
                where {filter_sql}
                """,
                parameters,
            ).fetchone()
        finally:
            connection.close()
        return int(row[0]) if row else 0


def audit_event_record_to_payload(record: AuditEventRecord) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "eventId": record.event_id,
        "eventType": record.event_type,
        "runId": record.run_id,
        "createdAt": record.created_at.isoformat(),
        "stage": record.stage,
        "source": record.source,
        "summary": record.summary,
        "detail": record.detail,
        "metadata": record.metadata,
    }


def _normalize_audit_event(value: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("audit_event_must_be_object")
    if int(_number_or_default(value.get("schemaVersion"), 0)) != 1:
        raise ValueError("unsupported_audit_event_schema_version")

    event_id = _required_string(value.get("eventId"), "event_id_required")
    event_type = _required_string(value.get("eventType"), "event_type_required")
    created_at = _required_string(value.get("createdAt"), "created_at_required")
    stage = _required_string(value.get("stage"), "stage_required")
    source = _required_string(value.get("source"), "source_required")
    summary = _required_string(value.get("summary"), "summary_required")
    detail = _required_string(value.get("detail"), "detail_required")
    _parse_datetime(created_at)

    return {
        "schemaVersion": 1,
        "eventId": event_id,
        "eventType": event_type,
        "runId": _optional_string(value.get("runId")),
        "createdAt": created_at,
        "stage": stage,
        "source": source,
        "summary": summary,
        "detail": detail,
        "metadata": _dict_or_empty(value.get("metadata")),
    }


def _row_to_audit_event_record(row: tuple[Any, ...]) -> AuditEventRecord:
    return AuditEventRecord(
        event_id=str(row[0]),
        event_type=str(row[1]),
        run_id=_optional_string(row[2]),
        created_at=_parse_datetime(str(row[3])),
        stage=str(row[4]),
        source=str(row[5]),
        summary=str(row[6]),
        detail=str(row[7]),
        metadata=_dict_or_empty(json.loads(row[8])),
    )


def _normalized_to_audit_event_record(normalized: dict[str, Any]) -> AuditEventRecord:
    return AuditEventRecord(
        event_id=str(normalized["eventId"]),
        event_type=str(normalized["eventType"]),
        run_id=_optional_string(normalized.get("runId")),
        created_at=_parse_datetime(str(normalized["createdAt"])),
        stage=str(normalized["stage"]),
        source=str(normalized["source"]),
        summary=str(normalized["summary"]),
        detail=str(normalized["detail"]),
        metadata=_dict_or_empty(normalized.get("metadata")),
    )


def _filter_parameters(
    *,
    run_id: str | None,
    event_type: str | None,
    query: str,
) -> tuple[str, tuple[Any, ...]]:
    clauses: list[str] = []
    parameters: list[Any] = []
    normalized_run_id = _optional_string(run_id)
    normalized_event_types = _event_type_filter_values(event_type)
    normalized_query = str(query or "").strip()

    if normalized_run_id:
        clauses.append("run_id = ?")
        parameters.append(normalized_run_id)
    if normalized_event_types:
        if len(normalized_event_types) == 1:
            clauses.append("event_type = ?")
            parameters.append(normalized_event_types[0])
        else:
            placeholders = ", ".join("?" for _ in normalized_event_types)
            clauses.append(f"event_type in ({placeholders})")
            parameters.extend(normalized_event_types)
    if normalized_query:
        clauses.append(
            """(
                lower(event_id) like ?
                or lower(event_type) like ?
                or lower(coalesce(run_id, '')) like ?
                or lower(stage) like ?
                or lower(source) like ?
                or lower(summary) like ?
                or lower(detail) like ?
                or lower(metadata_json) like ?
            )"""
        )
        like_query = f"%{normalized_query.lower()}%"
        parameters.extend([like_query] * 8)

    if not clauses:
        return "1 = 1", tuple()
    return " and ".join(clauses), tuple(parameters)


def _event_type_filter_values(event_type: str | None) -> list[str]:
    normalized = _optional_string(event_type)
    if not normalized:
        return []
    values: list[str] = []
    for value in normalized.split(","):
        item = value.strip()
        if item and item not in values:
            values.append(item)
    return values


def _parse_datetime(value: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _required_string(value: Any, error: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(error)
    return normalized


def _optional_string(value: Any) -> str | None:
    normalized = str(value or "").strip()
    return normalized or None


def _dict_or_empty(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _number_or_default(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _bounded_limit(value: int) -> int:
    return max(1, min(int(_number_or_default(value, 20)), 50))
