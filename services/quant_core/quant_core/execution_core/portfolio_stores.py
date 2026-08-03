from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from .common import (
    _json_object_from_text,
)
from .contracts import (
    PortfolioPaperOrderApproval,
    PortfolioPaperOrderBatch,
    PortfolioPaperOrderSimulation,
)
from .portfolio_batch import (
    _normalize_portfolio_paper_order,
)

__all__ = [
    'PortfolioPaperOrderApprovalStore',
    'PortfolioPaperOrderSimulationStore',
    'PortfolioPaperOrderStore',
    '_row_to_portfolio_paper_order_approval',
    '_row_to_portfolio_paper_order_batch',
    '_row_to_portfolio_paper_order_simulation',
]

class PortfolioPaperOrderStore:
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
                create table if not exists portfolio_paper_order_batches (
                    batch_id text primary key,
                    base_run_id text not null,
                    created_at text not null,
                    portfolio_name text not null,
                    mode text not null,
                    source text not null,
                    orders_json text not null,
                    summary_json text not null
                )
                """
            )
            connection.execute(
                """
                create index if not exists idx_portfolio_paper_order_batches_base_run_created
                on portfolio_paper_order_batches(base_run_id, created_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, batch: PortfolioPaperOrderBatch) -> PortfolioPaperOrderBatch:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into portfolio_paper_order_batches (
                    batch_id,
                    base_run_id,
                    created_at,
                    portfolio_name,
                    mode,
                    source,
                    orders_json,
                    summary_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(batch_id) do update set
                    base_run_id = excluded.base_run_id,
                    created_at = excluded.created_at,
                    portfolio_name = excluded.portfolio_name,
                    mode = excluded.mode,
                    source = excluded.source,
                    orders_json = excluded.orders_json,
                    summary_json = excluded.summary_json
                """,
                (
                    batch.batch_id,
                    batch.base_run_id,
                    batch.created_at.isoformat(),
                    batch.portfolio_name,
                    batch.mode,
                    batch.source,
                    json.dumps(batch.orders, ensure_ascii=False, sort_keys=True),
                    json.dumps(batch.summary, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return batch

    def list_by_base_run(self, base_run_id: str, limit: int = 20) -> list[PortfolioPaperOrderBatch]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select batch_id, base_run_id, created_at, portfolio_name, mode, source, orders_json, summary_json
                from portfolio_paper_order_batches
                where base_run_id = ?
                order by created_at desc
                limit ?
                """,
                (base_run_id, max(1, min(limit, 50))),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_batch(row) for row in rows]

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderBatch]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select batch_id, base_run_id, created_at, portfolio_name, mode, source, orders_json, summary_json
                from portfolio_paper_order_batches
                where base_run_id = ?
                order by created_at desc
                """,
                (base_run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_batch(row) for row in rows]

    def delete_by_base_run(self, base_run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from portfolio_paper_order_batches where base_run_id = ?", (base_run_id,))
            connection.commit()
        finally:
            connection.close()


class PortfolioPaperOrderApprovalStore:
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
                create table if not exists portfolio_paper_order_approvals (
                    approval_id text primary key,
                    base_run_id text not null,
                    batch_id text not null,
                    order_id text not null,
                    reviewed_at text not null,
                    approved integer not null,
                    reviewer text not null,
                    reason text not null
                )
                """
            )
            connection.execute(
                """
                create unique index if not exists idx_portfolio_paper_order_approvals_order
                on portfolio_paper_order_approvals(base_run_id, batch_id, order_id)
                """
            )
            connection.execute(
                """
                create index if not exists idx_portfolio_paper_order_approvals_batch
                on portfolio_paper_order_approvals(base_run_id, batch_id, reviewed_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, approval: PortfolioPaperOrderApproval) -> PortfolioPaperOrderApproval:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into portfolio_paper_order_approvals (
                    approval_id,
                    base_run_id,
                    batch_id,
                    order_id,
                    reviewed_at,
                    approved,
                    reviewer,
                    reason
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(base_run_id, batch_id, order_id) do update set
                    approval_id = excluded.approval_id,
                    reviewed_at = excluded.reviewed_at,
                    approved = excluded.approved,
                    reviewer = excluded.reviewer,
                    reason = excluded.reason
                """,
                (
                    approval.approval_id,
                    approval.base_run_id,
                    approval.batch_id,
                    approval.order_id,
                    approval.reviewed_at.isoformat(),
                    1 if approval.approved else 0,
                    approval.reviewer,
                    approval.reason,
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return approval

    def list_by_batch(self, base_run_id: str, batch_id: str) -> list[PortfolioPaperOrderApproval]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select approval_id, base_run_id, batch_id, order_id, reviewed_at, approved, reviewer, reason
                from portfolio_paper_order_approvals
                where base_run_id = ? and batch_id = ?
                order by reviewed_at desc
                """,
                (base_run_id, batch_id),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_approval(row) for row in rows]

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderApproval]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select approval_id, base_run_id, batch_id, order_id, reviewed_at, approved, reviewer, reason
                from portfolio_paper_order_approvals
                where base_run_id = ?
                order by reviewed_at desc
                """,
                (base_run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_approval(row) for row in rows]

    def delete_by_base_run(self, base_run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from portfolio_paper_order_approvals where base_run_id = ?", (base_run_id,))
            connection.commit()
        finally:
            connection.close()


class PortfolioPaperOrderSimulationStore:
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
                create table if not exists portfolio_paper_order_simulations (
                    simulation_id text primary key,
                    base_run_id text not null,
                    batch_id text not null,
                    order_id text not null,
                    simulated_at text not null,
                    mode text not null,
                    symbol text not null,
                    source_run_id text,
                    side text not null,
                    quantity real not null,
                    fill_price real not null,
                    notional_value real not null,
                    order_state text not null,
                    fill_status text not null,
                    reason text not null,
                    approved_by text,
                    route_risk_json text not null default '{}',
                    adapter_paper_execution_id text not null default '',
                    adapter_manifest_validation_id text not null default '',
                    adapter_paper_execution_evidence_json text not null default '{}'
                )
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute("pragma table_info(portfolio_paper_order_simulations)").fetchall()
            }
            if "route_risk_json" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column route_risk_json text not null default '{}'"
                )
            if "adapter_paper_execution_id" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column adapter_paper_execution_id text not null default ''"
                )
            if "adapter_manifest_validation_id" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column adapter_manifest_validation_id text not null default ''"
                )
            if "adapter_paper_execution_evidence_json" not in columns:
                connection.execute(
                    "alter table portfolio_paper_order_simulations add column adapter_paper_execution_evidence_json text not null default '{}'"
                )
            connection.execute(
                """
                create unique index if not exists idx_portfolio_paper_order_simulations_order
                on portfolio_paper_order_simulations(base_run_id, batch_id, order_id)
                """
            )
            connection.execute(
                """
                create index if not exists idx_portfolio_paper_order_simulations_batch
                on portfolio_paper_order_simulations(base_run_id, batch_id, simulated_at desc)
                """
            )
            connection.commit()
        finally:
            connection.close()

    def record(self, simulation: PortfolioPaperOrderSimulation) -> PortfolioPaperOrderSimulation:
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into portfolio_paper_order_simulations (
                    simulation_id,
                    base_run_id,
                    batch_id,
                    order_id,
                    simulated_at,
                    mode,
                    symbol,
                    source_run_id,
                    side,
                    quantity,
                    fill_price,
                    notional_value,
                    order_state,
                    fill_status,
                    reason,
                    approved_by,
                    route_risk_json,
                    adapter_paper_execution_id,
                    adapter_manifest_validation_id,
                    adapter_paper_execution_evidence_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(base_run_id, batch_id, order_id) do update set
                    simulation_id = excluded.simulation_id,
                    simulated_at = excluded.simulated_at,
                    mode = excluded.mode,
                    symbol = excluded.symbol,
                    source_run_id = excluded.source_run_id,
                    side = excluded.side,
                    quantity = excluded.quantity,
                    fill_price = excluded.fill_price,
                    notional_value = excluded.notional_value,
                    order_state = excluded.order_state,
                    fill_status = excluded.fill_status,
                    reason = excluded.reason,
                    approved_by = excluded.approved_by,
                    route_risk_json = excluded.route_risk_json,
                    adapter_paper_execution_id = excluded.adapter_paper_execution_id,
                    adapter_manifest_validation_id = excluded.adapter_manifest_validation_id,
                    adapter_paper_execution_evidence_json = excluded.adapter_paper_execution_evidence_json
                """,
                (
                    simulation.simulation_id,
                    simulation.base_run_id,
                    simulation.batch_id,
                    simulation.order_id,
                    simulation.simulated_at.isoformat(),
                    simulation.mode,
                    simulation.symbol,
                    simulation.source_run_id,
                    simulation.side,
                    simulation.quantity,
                    simulation.fill_price,
                    simulation.notional_value,
                    simulation.order_state,
                    simulation.fill_status,
                    simulation.reason,
                    simulation.approved_by,
                    json.dumps(simulation.route_risk, ensure_ascii=False),
                    simulation.adapter_paper_execution_id,
                    simulation.adapter_manifest_validation_id,
                    json.dumps(simulation.adapter_paper_execution_evidence, ensure_ascii=False),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        return simulation

    def list_by_batch(self, base_run_id: str, batch_id: str) -> list[PortfolioPaperOrderSimulation]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select simulation_id, base_run_id, batch_id, order_id, simulated_at, mode, symbol, source_run_id,
                       side, quantity, fill_price, notional_value, order_state, fill_status, reason, approved_by,
                       route_risk_json, adapter_paper_execution_id, adapter_manifest_validation_id,
                       adapter_paper_execution_evidence_json
                from portfolio_paper_order_simulations
                where base_run_id = ? and batch_id = ?
                order by simulated_at desc, rowid asc
                """,
                (base_run_id, batch_id),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_simulation(row) for row in rows]

    def list_all_by_base_run(self, base_run_id: str) -> list[PortfolioPaperOrderSimulation]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select simulation_id, base_run_id, batch_id, order_id, simulated_at, mode, symbol, source_run_id,
                       side, quantity, fill_price, notional_value, order_state, fill_status, reason, approved_by,
                       route_risk_json, adapter_paper_execution_id, adapter_manifest_validation_id,
                       adapter_paper_execution_evidence_json
                from portfolio_paper_order_simulations
                where base_run_id = ?
                order by simulated_at desc, rowid asc
                """,
                (base_run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_portfolio_paper_order_simulation(row) for row in rows]

    def delete_by_base_run(self, base_run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from portfolio_paper_order_simulations where base_run_id = ?", (base_run_id,))
            connection.commit()
        finally:
            connection.close()


def _row_to_portfolio_paper_order_batch(row: sqlite3.Row | tuple[Any, ...]) -> PortfolioPaperOrderBatch:
    return PortfolioPaperOrderBatch(
        batch_id=str(row[0]),
        base_run_id=str(row[1]),
        created_at=datetime.fromisoformat(str(row[2])),
        portfolio_name=str(row[3]),
        mode=str(row[4]),
        source=str(row[5]),
        orders=[_normalize_portfolio_paper_order(order) for order in json.loads(row[6])],
        summary=dict(json.loads(row[7])),
    )


def _row_to_portfolio_paper_order_approval(row: sqlite3.Row | tuple[Any, ...]) -> PortfolioPaperOrderApproval:
    return PortfolioPaperOrderApproval(
        approval_id=str(row[0]),
        base_run_id=str(row[1]),
        batch_id=str(row[2]),
        order_id=str(row[3]),
        reviewed_at=datetime.fromisoformat(str(row[4])),
        approved=bool(row[5]),
        reviewer=str(row[6]),
        reason=str(row[7]),
    )


def _row_to_portfolio_paper_order_simulation(row: sqlite3.Row | tuple[Any, ...]) -> PortfolioPaperOrderSimulation:
    return PortfolioPaperOrderSimulation(
        simulation_id=str(row[0]),
        base_run_id=str(row[1]),
        batch_id=str(row[2]),
        order_id=str(row[3]),
        simulated_at=datetime.fromisoformat(str(row[4])),
        mode=str(row[5]),
        symbol=str(row[6]),
        source_run_id=str(row[7]).strip() if row[7] is not None else None,
        side=str(row[8]),
        quantity=float(row[9]),
        fill_price=float(row[10]),
        notional_value=float(row[11]),
        order_state=str(row[12]),
        fill_status=str(row[13]),
        reason=str(row[14]),
        approved_by=str(row[15]).strip() if row[15] is not None else None,
        route_risk=_json_object_from_text(str(row[16]) if len(row) > 16 else "{}"),
        adapter_paper_execution_id=str(row[17]).strip() if len(row) > 17 and row[17] is not None else "",
        adapter_manifest_validation_id=str(row[18]).strip() if len(row) > 18 and row[18] is not None else "",
        adapter_paper_execution_evidence=_json_object_from_text(str(row[19]) if len(row) > 19 else "{}"),
    )
