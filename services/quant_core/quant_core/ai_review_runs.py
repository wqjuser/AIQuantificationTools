from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class AiReviewRunRecord:
    ai_review_id: str
    run_id: str
    created_at: datetime
    record: dict[str, Any]


class AiReviewRunStore:
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
                create table if not exists ai_review_runs (
                    ai_review_id text primary key,
                    run_id text not null,
                    created_at text not null,
                    record_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_ai_review_runs_run_id_created_at
                on ai_review_runs(run_id, created_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, record: dict[str, Any]) -> AiReviewRunRecord:
        normalized = _normalize_ai_review_record(record)
        stored = AiReviewRunRecord(
            ai_review_id=str(normalized["aiReviewId"]),
            run_id=str(normalized["runId"]),
            created_at=_parse_datetime(str(normalized["createdAt"])),
            record=normalized,
        )
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into ai_review_runs (
                    ai_review_id,
                    run_id,
                    created_at,
                    record_json
                )
                values (?, ?, ?, ?)
                on conflict(ai_review_id) do update set
                    run_id = excluded.run_id,
                    created_at = excluded.created_at,
                    record_json = excluded.record_json
                """,
                (
                    stored.ai_review_id,
                    stored.run_id,
                    stored.created_at.isoformat(),
                    json.dumps(stored.record, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return stored

    def list_by_run(self, run_id: str, limit: int = 20) -> list[AiReviewRunRecord]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select ai_review_id, run_id, created_at, record_json
                from ai_review_runs
                where run_id = ?
                order by created_at desc
                limit ?
                """,
                (run_id, max(1, min(limit, 50))),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_ai_review_run_record(row) for row in rows]


def ai_review_run_record_to_payload(record: AiReviewRunRecord) -> dict[str, Any]:
    return {
        "aiReviewId": record.ai_review_id,
        "runId": record.run_id,
        "createdAt": record.created_at.isoformat(),
        "record": record.record,
    }


def _normalize_ai_review_record(value: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("ai_review_record_must_be_object")
    if int(_number_or_default(value.get("schemaVersion"), 0)) != 1:
        raise ValueError("unsupported_ai_review_schema_version")
    if value.get("recordType") != "aiqt.aiReviewRun":
        raise ValueError("unsupported_ai_review_record_type")

    ai_review_id = str(value.get("aiReviewId") or "").strip()
    run_id = str(value.get("runId") or "").strip()
    created_at = str(value.get("createdAt") or "").strip()
    boundary = str(value.get("boundary") or "").strip()
    if not ai_review_id:
        raise ValueError("ai_review_id_required")
    if not run_id:
        raise ValueError("run_id_required")
    if not created_at:
        raise ValueError("created_at_required")
    _parse_datetime(created_at)
    if not boundary:
        raise ValueError("ai_review_boundary_required")

    return {
        **value,
        "schemaVersion": 1,
        "recordType": "aiqt.aiReviewRun",
        "aiReviewId": ai_review_id,
        "runId": run_id,
        "createdAt": created_at,
        "status": str(value.get("status") or "ready"),
        "summary": _dict_or_empty(value.get("summary")),
        "dossier": _dict_or_empty(value.get("dossier")),
        "citations": _list_or_empty(value.get("citations")),
        "rounds": _list_or_empty(value.get("rounds")),
        "decisionLog": _list_or_empty(value.get("decisionLog")),
        "boundary": boundary,
    }


def _row_to_ai_review_run_record(row: tuple[Any, ...]) -> AiReviewRunRecord:
    return AiReviewRunRecord(
        ai_review_id=str(row[0]),
        run_id=str(row[1]),
        created_at=_parse_datetime(str(row[2])),
        record=_dict_or_empty(json.loads(row[3])),
    )


def _parse_datetime(value: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _dict_or_empty(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _list_or_empty(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _number_or_default(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
