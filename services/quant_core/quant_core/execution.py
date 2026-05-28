from __future__ import annotations

import json
import math
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from quant_core.domain import OrderResult, PaperAccount


@dataclass(frozen=True)
class PaperExecutionRecord:
    execution_id: str
    run_id: str
    created_at: datetime
    mode: str
    account: PaperAccount
    orders: list[OrderResult]
    gates: list[dict[str, Any]]


class PaperExecutionAdapter:
    def __init__(self, initial_cash: float = 100_000, max_position_value: float = 20_000) -> None:
        self.cash = initial_cash
        self.max_position_value = max_position_value
        self.positions: dict[str, float] = {}
        self.last_prices: dict[str, float] = {}
        self.orders: list[OrderResult] = []

    def submit_order(self, symbol: str, side: str, quantity: float, price: float) -> OrderResult:
        if quantity <= 0 or price <= 0:
            return self._record(symbol, side, quantity, price, "rejected", "quantity_and_price_must_be_positive")

        current_position = self.positions.get(symbol, 0.0)
        value = quantity * price
        if side == "buy":
            if current_position * price + value > self.max_position_value:
                return self._record(symbol, side, quantity, price, "rejected", "max_position_value_exceeded")
            if value > self.cash:
                return self._record(symbol, side, quantity, price, "rejected", "insufficient_cash")
            self.cash -= value
            self.positions[symbol] = current_position + quantity
        elif side == "sell":
            if quantity > current_position:
                return self._record(symbol, side, quantity, price, "rejected", "insufficient_position")
            self.cash += value
            remaining = current_position - quantity
            if remaining:
                self.positions[symbol] = remaining
            else:
                self.positions.pop(symbol, None)
        else:
            return self._record(symbol, side, quantity, price, "rejected", "unsupported_side")

        self.last_prices[symbol] = price
        return self._record(symbol, side, quantity, price, "filled", "filled_immediately")

    def account(self) -> PaperAccount:
        position_value = sum(quantity * self.last_prices.get(symbol, 0.0) for symbol, quantity in self.positions.items())
        return PaperAccount(cash=self.cash, positions=dict(self.positions), equity=self.cash + position_value)

    def _record(self, symbol: str, side: str, quantity: float, price: float, status: str, reason: str) -> OrderResult:
        order = OrderResult(
            order_id=str(uuid4()),
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            status=status,
            reason=reason,
            timestamp=datetime.now(timezone.utc),
        )
        self.orders.append(order)
        return order


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
                    gates_json text not null
                )
                """
            )
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
                    gates_json
                )
                values (?, ?, ?, ?, ?, ?, ?)
                on conflict(execution_id) do update set
                    run_id = excluded.run_id,
                    created_at = excluded.created_at,
                    mode = excluded.mode,
                    account_json = excluded.account_json,
                    orders_json = excluded.orders_json,
                    gates_json = excluded.gates_json
                """,
                (
                    execution.execution_id,
                    execution.run_id,
                    execution.created_at.isoformat(),
                    execution.mode,
                    json.dumps(_account_to_payload(execution.account), ensure_ascii=False, sort_keys=True),
                    json.dumps([_order_to_payload(order) for order in execution.orders], ensure_ascii=False, sort_keys=True),
                    json.dumps(_normalize_gates(execution.gates), ensure_ascii=False, sort_keys=True),
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
                select execution_id, run_id, created_at, mode, account_json, orders_json, gates_json
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


def create_paper_execution_from_audit(audit: Any, *, created_at: datetime | None = None) -> PaperExecutionRecord:
    created = created_at or datetime.now(timezone.utc)
    price = _latest_close(audit)
    assumptions = audit.backtest_assumptions if isinstance(getattr(audit, "backtest_assumptions", None), dict) else {}
    initial_cash = _positive_number(assumptions.get("initialCash"), 100_000)
    max_position_value = _paper_target_notional(audit, initial_cash)
    quantity = _paper_quantity(str(getattr(audit, "market", "")), price, max_position_value)
    paper = PaperExecutionAdapter(initial_cash=initial_cash, max_position_value=max_position_value)
    order = paper.submit_order(symbol=str(getattr(audit, "symbol", "")), side="buy", quantity=quantity, price=price)
    return PaperExecutionRecord(
        execution_id=f"paper-{uuid4().hex[:12]}",
        run_id=str(getattr(audit, "run_id", "")),
        created_at=created,
        mode="paper_only",
        account=paper.account(),
        orders=[order],
        gates=[
            {
                "id": "audit-run-bound",
                "label": "Audit run bound",
                "passed": bool(getattr(audit, "run_id", "")),
                "reason": f"Paper execution is linked to audited run {getattr(audit, 'run_id', '')}.",
            },
            {
                "id": "paper-risk-check",
                "label": "Paper risk check",
                "passed": order.status == "filled",
                "reason": order.reason,
            },
            {
                "id": "live-route-blocked",
                "label": "Live route blocked",
                "passed": False,
                "reason": "Live execution is blocked; this record is paper-only.",
            },
        ],
    )


def paper_execution_record_to_payload(execution: PaperExecutionRecord) -> dict[str, Any]:
    return {
        "executionId": execution.execution_id,
        "runId": execution.run_id,
        "createdAt": execution.created_at.isoformat(),
        "mode": execution.mode,
        "account": _account_to_payload(execution.account),
        "orders": [_order_to_payload(order) for order in execution.orders],
        "gates": _normalize_gates(execution.gates),
    }


def _latest_close(audit: Any) -> float:
    snapshot = getattr(audit, "data_snapshot", {})
    bars = snapshot.get("bars") if isinstance(snapshot, dict) else None
    if not isinstance(bars, list) or not bars:
        raise ValueError("paper_execution_requires_data_snapshot_bars")
    latest = bars[-1]
    close = latest.get("close") if isinstance(latest, dict) else None
    price = _positive_number(close, 0)
    if price <= 0:
        raise ValueError("paper_execution_requires_positive_close")
    return price


def _paper_target_notional(audit: Any, initial_cash: float) -> float:
    strategy_config = getattr(audit, "strategy_config", None)
    risk = strategy_config.get("risk") if isinstance(strategy_config, dict) else None
    position_pct = _positive_number(risk.get("positionPct") if isinstance(risk, dict) else None, 0.2)
    return max(1.0, min(initial_cash * position_pct, 20_000.0))


def _paper_quantity(market: str, price: float, target_notional: float) -> float:
    raw_quantity = max(1, math.floor(target_notional / price))
    if market == "ashare":
        return max(100, math.floor(raw_quantity / 100) * 100)
    if market == "crypto":
        return max(1, math.floor(raw_quantity))
    return raw_quantity


def _positive_number(value: Any, fallback: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if not math.isfinite(number) or number <= 0:
        return fallback
    return number


def _account_to_payload(account: PaperAccount) -> dict[str, Any]:
    return {
        "cash": account.cash,
        "positions": {str(symbol): quantity for symbol, quantity in account.positions.items()},
        "equity": account.equity,
    }


def _order_to_payload(order: OrderResult) -> dict[str, Any]:
    return {
        "orderId": order.order_id,
        "symbol": order.symbol,
        "side": order.side,
        "quantity": order.quantity,
        "price": order.price,
        "status": order.status,
        "reason": order.reason,
        "timestamp": order.timestamp.isoformat(),
    }


def _normalize_gates(gates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for gate in gates:
        normalized.append(
            {
                "id": str(gate.get("id", "")),
                "label": str(gate.get("label", "")),
                "passed": bool(gate.get("passed")),
                "reason": str(gate.get("reason", "")),
            }
        )
    return normalized


def _row_to_paper_execution(row: sqlite3.Row | tuple[Any, ...]) -> PaperExecutionRecord:
    account_payload = json.loads(row[4])
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
    )


def _payload_to_order(payload: dict[str, Any]) -> OrderResult:
    return OrderResult(
        order_id=str(payload.get("orderId", "")),
        symbol=str(payload.get("symbol", "")),
        side=str(payload.get("side", "buy")),
        quantity=float(payload.get("quantity", 0)),
        price=float(payload.get("price", 0)),
        status=str(payload.get("status", "rejected")),
        reason=str(payload.get("reason", "")),
        timestamp=datetime.fromisoformat(str(payload.get("timestamp"))),
    )
