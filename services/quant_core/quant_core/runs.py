from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ResearchRunAudit:
    run_id: str
    created_at: datetime
    market: str
    symbol: str
    timeframe: str
    strategy_name: str
    strategy_revision: str
    data_rows: int
    metrics: dict[str, Any]
    decisions: list[dict[str, Any]]
    execution_mode: str


class ResearchRunStore:
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
                create table if not exists research_runs (
                    run_id text primary key,
                    created_at text not null,
                    market text not null,
                    symbol text not null,
                    timeframe text not null,
                    strategy_name text not null,
                    strategy_revision text not null,
                    data_rows integer not null,
                    metrics_json text not null,
                    decisions_json text not null,
                    execution_mode text not null
                )
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, audit: ResearchRunAudit) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into research_runs (
                    run_id,
                    created_at,
                    market,
                    symbol,
                    timeframe,
                    strategy_name,
                    strategy_revision,
                    data_rows,
                    metrics_json,
                    decisions_json,
                    execution_mode
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(run_id) do update set
                    created_at = excluded.created_at,
                    market = excluded.market,
                    symbol = excluded.symbol,
                    timeframe = excluded.timeframe,
                    strategy_name = excluded.strategy_name,
                    strategy_revision = excluded.strategy_revision,
                    data_rows = excluded.data_rows,
                    metrics_json = excluded.metrics_json,
                    decisions_json = excluded.decisions_json,
                    execution_mode = excluded.execution_mode
                """,
                (
                    audit.run_id,
                    audit.created_at.isoformat(),
                    audit.market,
                    audit.symbol,
                    audit.timeframe,
                    audit.strategy_name,
                    audit.strategy_revision,
                    audit.data_rows,
                    json.dumps(audit.metrics, ensure_ascii=False, sort_keys=True),
                    json.dumps(audit.decisions, ensure_ascii=False, sort_keys=True),
                    audit.execution_mode,
                ),
            )
            connection.commit()
        finally:
            connection.close()

    def list_recent(self, limit: int = 20) -> list[ResearchRunAudit]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select
                    run_id,
                    created_at,
                    market,
                    symbol,
                    timeframe,
                    strategy_name,
                    strategy_revision,
                    data_rows,
                    metrics_json,
                    decisions_json,
                    execution_mode
                from research_runs
                order by created_at desc
                limit ?
                """,
                (limit,),
            ).fetchall()
        finally:
            connection.close()

        return [
            ResearchRunAudit(
                run_id=row[0],
                created_at=datetime.fromisoformat(row[1]),
                market=row[2],
                symbol=row[3],
                timeframe=row[4],
                strategy_name=row[5],
                strategy_revision=row[6],
                data_rows=row[7],
                metrics=json.loads(row[8]),
                decisions=json.loads(row[9]),
                execution_mode=row[10],
            )
            for row in rows
        ]
