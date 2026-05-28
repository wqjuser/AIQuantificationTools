from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any


DEFAULT_BACKTEST_ASSUMPTIONS = {"initialCash": 100_000, "feeBps": 3, "slippageBps": 2}
DEFAULT_DATA_QUALITY = {"source": "unknown", "isComplete": False, "warnings": [], "rows": 0}


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
    data_quality: dict[str, Any] = field(default_factory=lambda: dict(DEFAULT_DATA_QUALITY))
    backtest_assumptions: dict[str, Any] = field(default_factory=lambda: dict(DEFAULT_BACKTEST_ASSUMPTIONS))
    backtest_trades: list[dict[str, Any]] = field(default_factory=list)
    backtest_equity_curve: list[dict[str, Any]] = field(default_factory=list)
    backtest_diagnostics: list[dict[str, Any]] = field(default_factory=list)


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
                    execution_mode text not null,
                    data_quality_json text not null default '{"source": "unknown", "isComplete": false, "warnings": [], "rows": 0}',
                    backtest_assumptions_json text not null default '{"initialCash": 100000, "feeBps": 3, "slippageBps": 2}',
                    backtest_trades_json text not null default '[]',
                    backtest_equity_curve_json text not null default '[]',
                    backtest_diagnostics_json text not null default '[]'
                )
                """
            )
            columns = {row[1] for row in connection.execute("pragma table_info(research_runs)").fetchall()}
            if "backtest_assumptions_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column backtest_assumptions_json text not null
                    default '{"initialCash": 100000, "feeBps": 3, "slippageBps": 2}'
                    """
                )
            if "data_quality_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column data_quality_json text not null
                    default '{"source": "unknown", "isComplete": false, "warnings": [], "rows": 0}'
                    """
                )
            if "backtest_trades_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column backtest_trades_json text not null
                    default '[]'
                    """
                )
            if "backtest_equity_curve_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column backtest_equity_curve_json text not null
                    default '[]'
                    """
                )
            if "backtest_diagnostics_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column backtest_diagnostics_json text not null
                    default '[]'
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
                    execution_mode,
                    data_quality_json,
                    backtest_assumptions_json,
                    backtest_trades_json,
                    backtest_equity_curve_json,
                    backtest_diagnostics_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    execution_mode = excluded.execution_mode,
                    data_quality_json = excluded.data_quality_json,
                    backtest_assumptions_json = excluded.backtest_assumptions_json,
                    backtest_trades_json = excluded.backtest_trades_json,
                    backtest_equity_curve_json = excluded.backtest_equity_curve_json,
                    backtest_diagnostics_json = excluded.backtest_diagnostics_json
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
                    json.dumps(_normalize_data_quality(audit.data_quality, data_rows=audit.data_rows), ensure_ascii=False, sort_keys=True),
                    json.dumps(_normalize_backtest_assumptions(audit.backtest_assumptions), ensure_ascii=False, sort_keys=True),
                    json.dumps(audit.backtest_trades, ensure_ascii=False, sort_keys=True),
                    json.dumps(audit.backtest_equity_curve, ensure_ascii=False, sort_keys=True),
                    json.dumps(audit.backtest_diagnostics, ensure_ascii=False, sort_keys=True),
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
                    execution_mode,
                    data_quality_json,
                    backtest_assumptions_json,
                    backtest_trades_json,
                    backtest_equity_curve_json,
                    backtest_diagnostics_json
                from research_runs
                order by created_at desc
                limit ?
                """,
                (limit,),
            ).fetchall()
        finally:
            connection.close()

        return [_row_to_research_run_audit(row) for row in rows]

    def get(self, run_id: str) -> ResearchRunAudit | None:
        connection = self._connect()
        try:
            row = connection.execute(
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
                    execution_mode,
                    data_quality_json,
                    backtest_assumptions_json,
                    backtest_trades_json,
                    backtest_equity_curve_json,
                    backtest_diagnostics_json
                from research_runs
                where run_id = ?
                limit 1
                """,
                (run_id,),
            ).fetchone()
        finally:
            connection.close()

        return _row_to_research_run_audit(row) if row else None


def research_run_audit_to_payload(audit: ResearchRunAudit) -> dict[str, Any]:
    return {
        "runId": audit.run_id,
        "createdAt": audit.created_at.isoformat(),
        "market": audit.market,
        "symbol": audit.symbol,
        "timeframe": audit.timeframe,
        "strategyName": audit.strategy_name,
        "strategyRevision": audit.strategy_revision,
        "dataRows": audit.data_rows,
        "metrics": audit.metrics,
        "decisions": audit.decisions,
        "executionMode": audit.execution_mode,
        "dataQuality": _normalize_data_quality(audit.data_quality, data_rows=audit.data_rows),
        "backtestAssumptions": _normalize_backtest_assumptions(audit.backtest_assumptions),
        "backtestTrades": audit.backtest_trades,
        "backtestEquityCurve": audit.backtest_equity_curve,
        "backtestDiagnostics": audit.backtest_diagnostics,
    }


def research_run_audits_to_payload(audits: list[ResearchRunAudit]) -> dict[str, Any]:
    return {"runs": [research_run_audit_to_payload(audit) for audit in audits]}


def _row_to_research_run_audit(row: sqlite3.Row | tuple[Any, ...]) -> ResearchRunAudit:
    return ResearchRunAudit(
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
        data_quality=_normalize_data_quality(json.loads(row[11]), data_rows=row[7]),
        backtest_assumptions=_normalize_backtest_assumptions(json.loads(row[12])),
        backtest_trades=json.loads(row[13]),
        backtest_equity_curve=json.loads(row[14]),
        backtest_diagnostics=json.loads(row[15]),
    )


def _normalize_data_quality(value: dict[str, Any] | None, *, data_rows: int) -> dict[str, Any]:
    quality = value or {}
    source = str(quality.get("source") or DEFAULT_DATA_QUALITY["source"]).strip() or DEFAULT_DATA_QUALITY["source"]
    warnings = quality.get("warnings")
    if not isinstance(warnings, list):
        warnings = []
    return {
        "source": source,
        "isComplete": bool(quality.get("isComplete", quality.get("is_complete", DEFAULT_DATA_QUALITY["isComplete"]))),
        "warnings": [str(warning) for warning in warnings],
        "rows": max(0, int(_number_or_default(quality.get("rows"), data_rows))),
    }


def _normalize_backtest_assumptions(value: dict[str, Any] | None) -> dict[str, Any]:
    assumptions = value or {}
    return {
        "initialCash": _number_or_default(assumptions.get("initialCash"), DEFAULT_BACKTEST_ASSUMPTIONS["initialCash"]),
        "feeBps": _number_or_default(assumptions.get("feeBps"), DEFAULT_BACKTEST_ASSUMPTIONS["feeBps"]),
        "slippageBps": _number_or_default(assumptions.get("slippageBps"), DEFAULT_BACKTEST_ASSUMPTIONS["slippageBps"]),
    }


def _number_or_default(value: Any, default: int | float) -> int | float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    if parsed.is_integer():
        return int(parsed)
    return parsed
