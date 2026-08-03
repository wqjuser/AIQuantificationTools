from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from quant_core.domain import OrderResult, PaperAccount
from .common import (
    _payload_to_order,
)
from .contracts import (
    PaperExecutionRecord,
)
from .paper_execution import (
    _account_to_payload,
    _normalize_gates,
    _order_to_payload,
)

__all__ = [
    'PaperExecutionStore',
    '_row_to_paper_execution',
]

class PaperExecutionStore:
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
                create table if not exists paper_executions (
                    execution_id text primary key,
                    run_id text not null,
                    created_at text not null,
                    mode text not null,
                    account_json text not null,
                    orders_json text not null,
                    gates_json text not null,
                    preparation_evidence_json text
                )
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute("pragma table_info(paper_executions)").fetchall()
            }
            if "preparation_evidence_json" not in columns:
                connection.execute("alter table paper_executions add column preparation_evidence_json text")
            connection.execute(
                """
                create index if not exists idx_paper_executions_run_id_created_at
                on paper_executions(run_id, created_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, execution: PaperExecutionRecord) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into paper_executions (
                    execution_id,
                    run_id,
                    created_at,
                    mode,
                    account_json,
                    orders_json,
                    gates_json,
                    preparation_evidence_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(execution_id) do update set
                    run_id = excluded.run_id,
                    created_at = excluded.created_at,
                    mode = excluded.mode,
                    account_json = excluded.account_json,
                    orders_json = excluded.orders_json,
                    gates_json = excluded.gates_json,
                    preparation_evidence_json = excluded.preparation_evidence_json
                """,
                (
                    execution.execution_id,
                    execution.run_id,
                    execution.created_at.isoformat(),
                    execution.mode,
                    json.dumps(_account_to_payload(execution.account), ensure_ascii=False, sort_keys=True),
                    json.dumps([_order_to_payload(order) for order in execution.orders], ensure_ascii=False, sort_keys=True),
                    json.dumps(_normalize_gates(execution.gates), ensure_ascii=False, sort_keys=True),
                    json.dumps(execution.preparation_evidence, ensure_ascii=False, sort_keys=True)
                    if execution.preparation_evidence
                    else None,
                ),
            )
            connection.commit()
        finally:
            connection.close()

    def list_by_run(self, run_id: str, limit: int = 20) -> list[PaperExecutionRecord]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select execution_id, run_id, created_at, mode, account_json, orders_json, gates_json, preparation_evidence_json
                from paper_executions
                where run_id = ?
                order by created_at desc
                limit ?
                """,
                (run_id, max(1, min(limit, 50))),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_paper_execution(row) for row in rows]

    def list_all_by_run(self, run_id: str) -> list[PaperExecutionRecord]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select execution_id, run_id, created_at, mode, account_json, orders_json, gates_json, preparation_evidence_json
                from paper_executions
                where run_id = ?
                order by created_at desc
                """,
                (run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_paper_execution(row) for row in rows]

    def delete_by_run(self, run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from paper_executions where run_id = ?", (run_id,))
            connection.commit()
        finally:
            connection.close()


def _row_to_paper_execution(row: sqlite3.Row | tuple[Any, ...]) -> PaperExecutionRecord:
    account_payload = json.loads(row[4])
    preparation_evidence = json.loads(row[7]) if len(row) > 7 and row[7] else None
    return PaperExecutionRecord(
        execution_id=row[0],
        run_id=row[1],
        created_at=datetime.fromisoformat(row[2]),
        mode=row[3],
        account=PaperAccount(
            cash=float(account_payload.get("cash", 0)),
            positions={str(symbol): float(quantity) for symbol, quantity in dict(account_payload.get("positions", {})).items()},
            equity=float(account_payload.get("equity", 0)),
        ),
        orders=[_payload_to_order(order) for order in json.loads(row[5])],
        gates=_normalize_gates(json.loads(row[6])),
        preparation_evidence=dict(preparation_evidence) if isinstance(preparation_evidence, dict) else None,
    )
