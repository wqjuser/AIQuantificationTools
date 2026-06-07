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


@dataclass(frozen=True)
class PortfolioPaperOrderBatch:
    batch_id: str
    base_run_id: str
    portfolio_name: str
    created_at: datetime
    mode: str
    source: str
    orders: list[dict[str, Any]]
    summary: dict[str, Any]


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

    def list_all_by_run(self, run_id: str) -> list[PaperExecutionRecord]:
        connection = self._connect()
        try:
            rows = connection.execute(
                """
                select execution_id, run_id, created_at, mode, account_json, orders_json, gates_json
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


def validate_paper_execution_handoff(audit: Any) -> None:
    data_quality = getattr(audit, "data_quality", None)
    if not _paper_execution_data_quality_is_complete(data_quality):
        raise ValueError("paper_execution_data_quality_incomplete")

    strategy_config = getattr(audit, "strategy_config", None)
    risk = strategy_config.get("risk") if isinstance(strategy_config, dict) else None
    required_risk_fields = ("positionPct", "stopLossPct", "takeProfitPct", "maxDrawdownPct")
    if not isinstance(risk, dict) or any(_strict_positive_number(risk.get(field)) is None for field in required_risk_fields):
        raise ValueError("paper_execution_strategy_risk_incomplete")


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


def create_portfolio_paper_order_batch(
    *,
    base_run_id: str,
    portfolio_name: str,
    orders: list[dict[str, Any]],
    source: str = "portfolio_backtest",
    created_at: datetime | None = None,
    batch_id: str | None = None,
) -> PortfolioPaperOrderBatch:
    normalized_base_run_id = str(base_run_id or "").strip()
    normalized_portfolio_name = str(portfolio_name or "").strip()
    normalized_source = str(source or "portfolio_backtest").strip() or "portfolio_backtest"
    if not normalized_base_run_id:
        raise ValueError("portfolio_paper_order_base_run_id_required")
    if not normalized_portfolio_name:
        raise ValueError("portfolio_paper_order_portfolio_name_required")
    if not isinstance(orders, list) or not orders:
        raise ValueError("portfolio_paper_order_orders_required")
    normalized_orders = [_normalize_portfolio_paper_order(order) for order in orders]
    return PortfolioPaperOrderBatch(
        batch_id=str(batch_id or f"portfolio-paper-batch-{uuid4().hex[:12]}"),
        base_run_id=normalized_base_run_id,
        portfolio_name=normalized_portfolio_name,
        created_at=created_at or datetime.now(timezone.utc),
        mode="portfolio_paper_order_review",
        source=normalized_source,
        orders=normalized_orders,
        summary=_portfolio_paper_order_summary(normalized_orders),
    )


def portfolio_paper_order_batch_to_payload(batch: PortfolioPaperOrderBatch) -> dict[str, Any]:
    return {
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "portfolioName": batch.portfolio_name,
        "createdAt": batch.created_at.isoformat(),
        "mode": batch.mode,
        "source": batch.source,
        "summary": dict(batch.summary),
        "orders": [dict(order) for order in batch.orders],
    }


def portfolio_paper_order_batch_to_audit_event_payload(batch: PortfolioPaperOrderBatch) -> dict[str, Any]:
    lifecycle = build_portfolio_paper_order_lifecycle(batch)
    lifecycle_state_counts = _sorted_counts(str(row.get("state") or "") for row in lifecycle)
    return {
        "schemaVersion": 1,
        "eventId": f"portfolio-paper-order-batch-{batch.batch_id}",
        "eventType": "portfolio_paper_order_batch",
        "runId": batch.base_run_id,
        "createdAt": batch.created_at.isoformat(),
        "stage": "portfolio-paper-order-review",
        "source": batch.source,
        "summary": f"{batch.portfolio_name} recorded {batch.summary['totalOrders']} portfolio paper order candidates.",
        "detail": "Portfolio paper order batch is paper-only and requires operator review before any simulated routing.",
        "metadata": {
            "batchId": batch.batch_id,
            "baseRunId": batch.base_run_id,
            "portfolioName": batch.portfolio_name,
            "mode": batch.mode,
            "source": batch.source,
            "totalOrders": batch.summary["totalOrders"],
            "totalNotionalValue": batch.summary["totalNotionalValue"],
            "statusCounts": dict(batch.summary["statusCounts"]),
            "riskStatusCounts": dict(batch.summary["riskStatusCounts"]),
            "lifecycleStateCounts": lifecycle_state_counts,
            "routableOrders": sum(1 for row in lifecycle if bool(row.get("routable"))),
            "orderIds": [str(order.get("orderId") or "") for order in batch.orders],
            "paperOnly": True,
            "liveExecutionBlocked": True,
        },
    }


def build_portfolio_paper_order_lifecycle(
    batch: PortfolioPaperOrderBatch,
    *,
    approvals: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    approval_map = approvals or {}
    return [_portfolio_paper_order_lifecycle_row(batch, order, approval_map.get(str(order.get("orderId") or ""))) for order in batch.orders]


def portfolio_paper_order_payload_to_batch(payload: dict[str, Any]) -> PortfolioPaperOrderBatch:
    if not isinstance(payload, dict):
        raise ValueError("portfolio_paper_order_batch_must_be_object")
    batch_id = str(payload.get("batchId") or "").strip()
    if not batch_id:
        raise ValueError("portfolio_paper_order_batch_id_required")
    if str(payload.get("mode") or "").strip() != "portfolio_paper_order_review":
        raise ValueError("portfolio_paper_order_batch_mode_invalid")
    raw_orders = payload.get("orders")
    if not isinstance(raw_orders, list):
        raise ValueError("portfolio_paper_order_orders_required")
    created_at = _parse_payload_datetime(payload.get("createdAt"), "portfolio_paper_order_batch_created_at_invalid")
    return create_portfolio_paper_order_batch(
        base_run_id=str(payload.get("baseRunId") or ""),
        portfolio_name=str(payload.get("portfolioName") or ""),
        source=str(payload.get("source") or "portfolio_backtest"),
        created_at=created_at,
        batch_id=batch_id,
        orders=raw_orders,
    )


def _paper_execution_data_quality_is_complete(data_quality: Any) -> bool:
    if not isinstance(data_quality, dict):
        return False
    source = str(data_quality.get("source") or "").strip()
    return (
        bool(source)
        and source not in {"unknown", "demo-fallback"}
        and data_quality.get("isComplete") is True
        and _strict_positive_number(data_quality.get("rows")) is not None
    )


def build_promotion_candidate(audit: Any, paper_executions: list[PaperExecutionRecord]) -> dict[str, Any]:
    executions = [execution for execution in paper_executions if execution.run_id == str(getattr(audit, "run_id", ""))]
    executions.sort(key=lambda execution: execution.created_at, reverse=True)
    latest_execution = executions[0] if executions else None
    filled_orders = [order for execution in executions for order in execution.orders if order.status == "filled"]
    passed_paper_risk_checks = sum(
        1
        for execution in executions
        if any(gate.get("id") == "paper-risk-check" and bool(gate.get("passed")) for gate in execution.gates)
    )
    try:
        validate_paper_execution_handoff(audit)
        risk_approved = True
    except ValueError:
        risk_approved = False
    paper_passed = bool(filled_orders) and passed_paper_risk_checks > 0
    if not risk_approved:
        status = "blocked"
        headline = "Promotion queue blocked"
        summary = "A strategy needs audited evidence and risk approval before it can enter execution promotion."
    else:
        status = "certification_pending" if paper_passed else "paper_pending"
        headline = "Live promotion pending certification" if paper_passed else "Paper execution required"
        summary = (
            "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass."
            if paper_passed
            else "The audited run is risk-approved for paper trading, but no filled paper execution is bound yet."
        )
    filled_value = _count_label(len(filled_orders), "filled order")

    return {
        "candidateId": f"promotion-{getattr(audit, 'run_id', '')}",
        "runId": str(getattr(audit, "run_id", "")),
        "createdAt": (latest_execution.created_at if latest_execution else getattr(audit, "created_at")).isoformat(),
        "market": str(getattr(audit, "market", "")),
        "symbol": str(getattr(audit, "symbol", "")),
        "timeframe": str(getattr(audit, "timeframe", "")),
        "strategyRevision": str(getattr(audit, "strategy_revision", "")),
        "latestPaperExecutionId": latest_execution.execution_id if latest_execution else None,
        "status": status,
        "headline": headline,
        "summary": summary,
        "liveTradingAllowed": False,
        "evidence": {
            "paperExecutions": len(executions),
            "filledOrders": len(filled_orders),
            "passedPaperRiskChecks": passed_paper_risk_checks,
        },
        "stages": [
            {
                "id": "audited-run",
                "label": "Audited run",
                "value": str(getattr(audit, "run_id", "")),
                "detail": f"{getattr(audit, 'data_rows', 0)} {getattr(audit, 'timeframe', '')} bars are bound to the promotion queue.",
                "status": "passed" if bool(getattr(audit, "run_id", "")) else "blocked",
                "tone": "positive" if bool(getattr(audit, "run_id", "")) else "risk",
                "passed": bool(getattr(audit, "run_id", "")),
                "reason": f"{getattr(audit, 'data_rows', 0)} {getattr(audit, 'timeframe', '')} bars are bound to the promotion queue.",
            },
            {
                "id": "risk-approval",
                "label": "Risk approval",
                "value": "paper approved" if risk_approved else "risk blocked",
                "detail": (
                    "Audited evidence can enter paper-to-live promotion review; live routing remains blocked."
                    if risk_approved
                    else "Audited strategy risk configuration is incomplete; paper-to-live promotion is blocked."
                ),
                "status": "passed" if risk_approved else "blocked",
                "tone": "positive" if risk_approved else "risk",
                "passed": risk_approved,
                "reason": (
                    "Audited evidence can enter paper-to-live promotion review; live routing remains blocked."
                    if risk_approved
                    else "Audited strategy risk configuration is incomplete; paper-to-live promotion is blocked."
                ),
            },
            {
                "id": "paper-execution",
                "label": "Paper execution",
                "value": filled_value if paper_passed else "No paper fill",
                "detail": (
                    f"Paper snapshot {latest_execution.execution_id} passed local risk checks before live promotion."
                    if paper_passed and latest_execution
                    else "Submit a paper order from the active audited run before live promotion review."
                ),
                "status": "passed" if paper_passed else "blocked",
                "tone": "positive" if paper_passed else "warning",
                "passed": paper_passed,
                "reason": (
                    f"Paper snapshot {latest_execution.execution_id} passed local risk checks before live promotion."
                    if paper_passed and latest_execution
                    else "Submit a paper order from the active audited run before live promotion review."
                ),
            },
            {
                "id": "adapter-certification",
                "label": "Adapter certification",
                "value": "0 certified live adapters",
                "detail": "Live adapters remain interface-only or configuration-required until certification passes.",
                "status": "blocked",
                "tone": "risk",
                "passed": False,
                "reason": "Live adapters remain interface-only or configuration-required until certification passes.",
            },
            {
                "id": "human-confirmation",
                "label": "Human confirmation",
                "value": "manual approval required",
                "detail": "Live promotion requires explicit human confirmation after adapter certification.",
                "status": "blocked",
                "tone": "warning",
                "passed": False,
                "reason": "Live promotion requires explicit human confirmation after adapter certification.",
            },
        ],
    }


def paper_execution_payload_to_record(payload: dict[str, Any]) -> PaperExecutionRecord:
    account_payload = payload.get("account")
    orders_payload = payload.get("orders")
    gates_payload = payload.get("gates")
    if not isinstance(account_payload, dict):
        raise ValueError("paper_execution_account_must_be_object")
    if not isinstance(orders_payload, list):
        raise ValueError("paper_execution_orders_must_be_array")
    if not isinstance(gates_payload, list):
        raise ValueError("paper_execution_gates_must_be_array")
    if any(not isinstance(order, dict) for order in orders_payload):
        raise ValueError("paper_execution_order_must_be_object")
    if any(not isinstance(gate, dict) for gate in gates_payload):
        raise ValueError("paper_execution_gate_must_be_object")
    execution_id = str(payload.get("executionId") or "").strip()
    run_id = str(payload.get("runId") or "").strip()
    if not execution_id:
        raise ValueError("paper_execution_id_is_required")
    if not run_id:
        raise ValueError("paper_execution_run_id_is_required")
    mode = str(payload.get("mode") or "paper_only")
    if mode != "paper_only":
        raise ValueError("paper_execution_must_be_paper_only")
    try:
        created_at = datetime.fromisoformat(str(payload.get("createdAt")))
    except ValueError as error:
        raise ValueError("paper_execution_created_at_must_be_iso_datetime") from error
    return PaperExecutionRecord(
        execution_id=execution_id,
        run_id=run_id,
        created_at=created_at,
        mode=mode,
        account=PaperAccount(
            cash=float(account_payload.get("cash", 0)),
            positions={str(symbol): float(quantity) for symbol, quantity in dict(account_payload.get("positions", {})).items()},
            equity=float(account_payload.get("equity", 0)),
        ),
        orders=[_payload_to_order(order) for order in orders_payload],
        gates=_normalize_gates(gates_payload),
    )


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


def _strict_positive_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number) or number <= 0:
        return None
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


def _count_label(count: int, singular: str) -> str:
    return f"{count} {singular}" if count == 1 else f"{count} {singular}s"


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


def _normalize_portfolio_paper_order(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("portfolio_paper_order_must_be_object")
    event_type = str(payload.get("eventType") or "").strip()
    if event_type != "portfolio_paper_order":
        raise ValueError("portfolio_paper_order_event_type_invalid")
    order_id = str(payload.get("orderId") or "").strip()
    symbol = str(payload.get("symbol") or "").strip()
    if not order_id:
        raise ValueError("portfolio_paper_order_id_required")
    if not symbol:
        raise ValueError("portfolio_paper_order_symbol_required")
    side = _enum_value(payload.get("side"), {"buy", "sell", "hold"}, "portfolio_paper_order_side_invalid")
    status = _enum_value(
        payload.get("status"),
        {"pending_review", "rejected", "skipped"},
        "portfolio_paper_order_status_invalid",
    )
    risk_status = _enum_value(
        payload.get("riskStatus"),
        {"passed", "review", "blocked"},
        "portfolio_paper_order_risk_status_invalid",
    )
    timestamp = _parse_payload_datetime(payload.get("timestamp"), "portfolio_paper_order_timestamp_invalid")
    notional_value = _non_negative_number(payload.get("notionalValue"), "portfolio_paper_order_notional_invalid")
    quantity = _non_negative_number(payload.get("quantity"), "portfolio_paper_order_quantity_invalid")
    raw_source_run_id = payload.get("sourceRunId")
    source_run_id = str(raw_source_run_id).strip() if raw_source_run_id is not None else None
    return {
        "timestamp": timestamp.isoformat(),
        "eventType": event_type,
        "orderId": order_id,
        "symbol": symbol,
        "sourceRunId": source_run_id or None,
        "side": side,
        "notionalValue": notional_value,
        "quantity": quantity,
        "status": status,
        "riskStatus": risk_status,
        "reason": str(payload.get("reason") or "").strip(),
    }


def _portfolio_paper_order_lifecycle_row(
    batch: PortfolioPaperOrderBatch,
    order: dict[str, Any],
    approval: dict[str, Any] | None,
) -> dict[str, Any]:
    order_id = str(order.get("orderId") or "")
    status = str(order.get("status") or "")
    risk_status = str(order.get("riskStatus") or "")
    side = str(order.get("side") or "")
    quantity = _positive_number(order.get("quantity"), 0)
    notional_value = _positive_number(order.get("notionalValue"), 0)
    approved = bool(approval.get("approved")) if isinstance(approval, dict) else False
    approval_was_rejected = isinstance(approval, dict) and approval.get("approved") is False

    if status == "skipped" or side == "hold":
        state = "skipped"
        reason = str(order.get("reason") or "No paper order action is required.")
    elif status == "rejected" or risk_status == "blocked":
        state = "risk_rejected"
        reason = str(order.get("reason") or "Pre-trade risk rejected this paper order.")
    elif approval_was_rejected:
        state = "operator_rejected"
        reason = str(approval.get("reason") or "Operator rejected this paper order candidate.")
    elif not approved:
        state = "awaiting_operator_review"
        reason = str(order.get("reason") or "Operator approval is required before paper simulation.")
    elif risk_status != "passed":
        state = "risk_review"
        reason = "Risk review must pass before the approved order can be staged for simulation."
    elif side not in {"buy", "sell"} or quantity <= 0 or notional_value <= 0:
        state = "invalid_order"
        reason = "Only positive buy or sell paper orders can be staged for simulation."
    else:
        state = "ready_for_simulation"
        reason = str(approval.get("reason") or "Operator approved this order for paper simulation only.")

    return {
        "batchId": batch.batch_id,
        "baseRunId": batch.base_run_id,
        "portfolioName": batch.portfolio_name,
        "orderId": order_id,
        "symbol": str(order.get("symbol") or ""),
        "sourceRunId": order.get("sourceRunId"),
        "side": side,
        "quantity": quantity,
        "notionalValue": notional_value,
        "originalStatus": status,
        "riskStatus": risk_status,
        "state": state,
        "routable": state == "ready_for_simulation",
        "paperOnly": True,
        "liveExecutionBlocked": True,
        "approvedBy": str(approval.get("reviewer") or "") if isinstance(approval, dict) and approved else None,
        "reviewedAt": str(approval.get("reviewedAt") or "") if isinstance(approval, dict) and approval.get("reviewedAt") else None,
        "reason": reason,
    }


def _portfolio_paper_order_summary(orders: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "totalOrders": len(orders),
        "totalNotionalValue": round(sum(float(order.get("notionalValue", 0)) for order in orders), 4),
        "statusCounts": _sorted_counts(str(order.get("status")) for order in orders),
        "riskStatusCounts": _sorted_counts(str(order.get("riskStatus")) for order in orders),
    }


def _sorted_counts(values: Any) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return {key: counts[key] for key in sorted(counts)}


def _enum_value(value: Any, allowed: set[str], error_code: str) -> str:
    normalized = str(value or "").strip()
    if normalized not in allowed:
        raise ValueError(error_code)
    return normalized


def _parse_payload_datetime(value: Any, error_code: str) -> datetime:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(error_code) from error


def _non_negative_number(value: Any, error_code: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(error_code) from error
    if not math.isfinite(number) or number < 0:
        raise ValueError(error_code)
    return number
