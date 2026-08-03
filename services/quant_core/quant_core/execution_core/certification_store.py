from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from .contracts import (
    ExecutionAdapterCertificationRun,
)

__all__ = [
    'ExecutionAdapterCertificationStore',
    '_row_to_execution_adapter_certification',
]

class ExecutionAdapterCertificationStore:
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
                create table if not exists execution_adapter_certifications (
                    certification_id text primary key,
                    adapter_id text not null,
                    market text not null,
                    route text not null,
                    status text not null,
                    operator text not null,
                    started_at text not null,
                    completed_at text,
                    live_trading_allowed integer not null,
                    checks_json text not null,
                    metadata_json text not null,
                    summary_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_execution_adapter_certifications_adapter_started
                on execution_adapter_certifications(adapter_id, started_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, run: ExecutionAdapterCertificationRun) -> ExecutionAdapterCertificationRun:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into execution_adapter_certifications (
                    certification_id,
                    adapter_id,
                    market,
                    route,
                    status,
                    operator,
                    started_at,
                    completed_at,
                    live_trading_allowed,
                    checks_json,
                    metadata_json,
                    summary_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(certification_id) do update set
                    adapter_id = excluded.adapter_id,
                    market = excluded.market,
                    route = excluded.route,
                    status = excluded.status,
                    operator = excluded.operator,
                    started_at = excluded.started_at,
                    completed_at = excluded.completed_at,
                    live_trading_allowed = excluded.live_trading_allowed,
                    checks_json = excluded.checks_json,
                    metadata_json = excluded.metadata_json,
                    summary_json = excluded.summary_json
                """,
                (
                    run.certification_id,
                    run.adapter_id,
                    run.market,
                    run.route,
                    run.status,
                    run.operator,
                    run.started_at.isoformat(),
                    run.completed_at.isoformat() if run.completed_at else None,
                    1 if run.live_trading_allowed else 0,
                    json.dumps(run.checks, ensure_ascii=False, sort_keys=True),
                    json.dumps(run.metadata, ensure_ascii=False, sort_keys=True),
                    json.dumps(run.summary, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return run

    def get(self, certification_id: str) -> ExecutionAdapterCertificationRun | None:
        normalized_id = str(certification_id or "").strip()
        if not normalized_id:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select certification_id, adapter_id, market, route, status, operator, started_at,
                       completed_at, live_trading_allowed, checks_json, metadata_json, summary_json
                from execution_adapter_certifications
                where certification_id = ?
                """,
                (normalized_id,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_execution_adapter_certification(row) if row else None

    def list_by_adapter(self, adapter_id: str, limit: int = 20) -> list[ExecutionAdapterCertificationRun]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select certification_id, adapter_id, market, route, status, operator, started_at,
                       completed_at, live_trading_allowed, checks_json, metadata_json, summary_json
                from execution_adapter_certifications
                where adapter_id = ?
                order by started_at desc
                limit ?
                """,
                (adapter_id, max(1, min(limit, 50))),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_execution_adapter_certification(row) for row in rows]


def _row_to_execution_adapter_certification(row: sqlite3.Row | tuple[Any, ...]) -> ExecutionAdapterCertificationRun:
    return ExecutionAdapterCertificationRun(
        certification_id=str(row[0]),
        adapter_id=str(row[1]),
        market=str(row[2]),
        route=str(row[3]),
        status=str(row[4]),
        operator=str(row[5]),
        started_at=datetime.fromisoformat(str(row[6])),
        completed_at=datetime.fromisoformat(str(row[7])) if row[7] else None,
        live_trading_allowed=False,
        checks=[dict(check) for check in json.loads(row[9])],
        metadata=dict(json.loads(row[10])),
        summary=dict(json.loads(row[11])),
    )
