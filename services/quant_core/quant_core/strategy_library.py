from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.domain import StrategyConfig
from quant_core.research import strategy_config_to_payload


@dataclass(frozen=True)
class StrategyLibraryRecord:
    strategy_id: str
    created_at: datetime
    name: str
    revision: str
    market: str
    symbol: str
    timeframe: str
    version: int
    status: str
    audit_run_id: str | None
    strategy_config: dict[str, Any]


class StrategyLibraryStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        if self.path.parent:
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def save(
        self,
        strategy: StrategyConfig,
        *,
        audit_run_id: str | None = None,
        created_at: datetime | None = None,
    ) -> StrategyLibraryRecord:
        timestamp = created_at or datetime.now(timezone.utc)
        strategy_config = strategy_config_to_payload(strategy)
        existing = self.get(strategy.revision)
        final_audit_run_id = audit_run_id or (existing.audit_run_id if existing else None)
        status = "audited" if final_audit_run_id else "draft"
        created_value = existing.created_at if existing else timestamp
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into strategy_versions (
                    revision,
                    created_at,
                    name,
                    market,
                    symbol,
                    timeframe,
                    version,
                    status,
                    audit_run_id,
                    strategy_config_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(revision) do update set
                    status = excluded.status,
                    audit_run_id = excluded.audit_run_id
                """,
                (
                    strategy.revision,
                    created_value.isoformat(),
                    strategy.name,
                    strategy.market,
                    strategy.symbols[0] if strategy.symbols else "",
                    strategy.timeframe,
                    strategy.version,
                    status,
                    final_audit_run_id,
                    json.dumps(strategy_config, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        saved = self.get(strategy.revision)
        if saved is None:
            raise RuntimeError("strategy_library_save_failed")
        return saved

    def save_payload(
        self,
        strategy_config: dict[str, Any],
        *,
        audit_run_id: str | None = None,
        created_at: datetime | None = None,
    ) -> StrategyLibraryRecord:
        config = _normalize_strategy_config_payload(strategy_config)
        revision = str(config.get("revision") or "").strip()
        if not revision:
            raise ValueError("strategy_revision_required")
        timestamp = created_at or datetime.now(timezone.utc)
        existing = self.get(revision)
        final_audit_run_id = audit_run_id or (existing.audit_run_id if existing else None)
        status = "audited" if final_audit_run_id else "draft"
        created_value = existing.created_at if existing else timestamp
        symbols = config.get("symbols") if isinstance(config.get("symbols"), list) else []
        connection = self._connect()
        try:
            connection.execute(
                """
                insert into strategy_versions (
                    revision,
                    created_at,
                    name,
                    market,
                    symbol,
                    timeframe,
                    version,
                    status,
                    audit_run_id,
                    strategy_config_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(revision) do update set
                    status = excluded.status,
                    audit_run_id = excluded.audit_run_id
                """,
                (
                    revision,
                    created_value.isoformat(),
                    str(config.get("name") or "Imported strategy"),
                    str(config.get("market") or "ashare"),
                    str(symbols[0] if symbols else ""),
                    str(config.get("timeframe") or "1d"),
                    int(_number_or_default(config.get("version"), 1)),
                    status,
                    final_audit_run_id,
                    json.dumps(config, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        saved = self.get(revision)
        if saved is None:
            raise RuntimeError("strategy_library_save_failed")
        return saved

    def list_recent(
        self,
        *,
        market: str | None = None,
        symbol: str | None = None,
        limit: int = 20,
    ) -> list[StrategyLibraryRecord]:
        bounded_limit = max(1, min(int(limit), 100))
        clauses: list[str] = []
        params: list[Any] = []
        if market:
            clauses.append("market = ?")
            params.append(market)
        if symbol:
            clauses.append("symbol = ?")
            params.append(symbol)
        where = f"where {' and '.join(clauses)}" if clauses else ""
        connection = self._connect()
        try:
            rows = connection.execute(
                f"""
                select revision, created_at, name, market, symbol, timeframe, version, status, audit_run_id, strategy_config_json
                from strategy_versions
                {where}
                order by created_at desc, rowid desc
                limit ?
                """,
                (*params, bounded_limit),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_record(row) for row in rows]

    def get(self, revision: str) -> StrategyLibraryRecord | None:
        normalized_revision = revision.strip()
        if not normalized_revision:
            return None
        connection = self._connect()
        try:
            row = connection.execute(
                """
                select revision, created_at, name, market, symbol, timeframe, version, status, audit_run_id, strategy_config_json
                from strategy_versions
                where revision = ?
                """,
                (normalized_revision,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_record(row) if row else None

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path)

    def _ensure_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute(
                """
                create table if not exists strategy_versions (
                    revision text primary key,
                    created_at text not null,
                    name text not null,
                    market text not null,
                    symbol text not null,
                    timeframe text not null,
                    version integer not null,
                    status text not null,
                    audit_run_id text,
                    strategy_config_json text not null
                )
                """
            )
            connection.execute(
                "create index if not exists idx_strategy_versions_context on strategy_versions(market, symbol, created_at)"
            )
            connection.commit()
        finally:
            connection.close()


def strategy_library_record_to_payload(record: StrategyLibraryRecord | None) -> dict[str, Any]:
    if record is None:
        raise ValueError("strategy_record_required")
    return {
        "strategyId": record.strategy_id,
        "createdAt": record.created_at.isoformat(),
        "name": record.name,
        "revision": record.revision,
        "market": record.market,
        "symbol": record.symbol,
        "timeframe": record.timeframe,
        "version": record.version,
        "status": record.status,
        "auditRunId": record.audit_run_id,
        "strategyConfig": record.strategy_config,
        "strategySnapshot": strategy_snapshot_from_config_payload(record.strategy_config),
    }


def strategy_library_records_to_payload(records: list[StrategyLibraryRecord]) -> dict[str, Any]:
    return {"strategies": [strategy_library_record_to_payload(record) for record in records]}


def strategy_snapshot_from_config_payload(config: dict[str, Any]) -> dict[str, str]:
    risk = config.get("risk") if isinstance(config.get("risk"), dict) else {}
    entry_conditions = config.get("entryConditions") if isinstance(config.get("entryConditions"), list) else []
    exit_conditions = config.get("exitConditions") if isinstance(config.get("exitConditions"), list) else []
    position_pct = _number_or_default(risk.get("positionPct"), 0.8)
    stop_loss_pct = _number_or_default(risk.get("stopLossPct"), 0.08)
    take_profit_pct = _number_or_default(risk.get("takeProfitPct"), 0.18)
    drawdown_pct = _number_or_default(risk.get("maxDrawdownPct"), 0.2)
    return {
        "name": str(config.get("name") or "SMA trend demo"),
        "entry": _condition_text(entry_conditions[0] if entry_conditions else {}, default="Close > SMA20"),
        "exit": _condition_text(exit_conditions[0] if exit_conditions else {}, default="Close < SMA20"),
        "position": f"{_format_percent(position_pct)} cap per instrument",
        "risk": (
            f"Stop -{_format_percent(stop_loss_pct)}, take profit +{_format_percent(take_profit_pct)}, "
            f"drawdown guard {_format_percent(drawdown_pct)}, paper only"
        ),
    }


def _normalize_strategy_config_payload(value: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("strategy_config_must_be_object")
    symbols = value.get("symbols") if isinstance(value.get("symbols"), list) else []
    entry_conditions = value.get("entryConditions", value.get("entry_conditions", []))
    exit_conditions = value.get("exitConditions", value.get("exit_conditions", []))
    risk = value.get("risk") if isinstance(value.get("risk"), dict) else {}
    return {
        "name": str(value.get("name") or "Imported strategy"),
        "revision": str(value.get("revision") or "").strip(),
        "market": str(value.get("market") or "ashare"),
        "symbols": [str(symbol) for symbol in symbols],
        "timeframe": str(value.get("timeframe") or "1d"),
        "version": int(_number_or_default(value.get("version"), 1)),
        "entryConditions": [
            _normalize_strategy_condition(condition) for condition in entry_conditions if isinstance(condition, dict)
        ],
        "exitConditions": [
            _normalize_strategy_condition(condition) for condition in exit_conditions if isinstance(condition, dict)
        ],
        "risk": {
            "positionPct": _nullable_number(risk.get("positionPct", risk.get("position_pct"))),
            "stopLossPct": _nullable_number(risk.get("stopLossPct", risk.get("stop_loss_pct"))),
            "takeProfitPct": _nullable_number(risk.get("takeProfitPct", risk.get("take_profit_pct"))),
            "maxDrawdownPct": _nullable_number(risk.get("maxDrawdownPct", risk.get("max_drawdown_pct"))),
        },
    }


def _normalize_strategy_condition(value: dict[str, Any]) -> dict[str, Any]:
    params = value.get("params")
    return {
        "kind": str(value.get("kind") or "unknown"),
        "params": dict(params) if isinstance(params, dict) else {},
    }


def _row_to_record(row: tuple[Any, ...]) -> StrategyLibraryRecord:
    created_at = datetime.fromisoformat(row[1])
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    strategy_config = json.loads(row[9])
    return StrategyLibraryRecord(
        strategy_id=f"strategy-{row[0]}",
        created_at=created_at,
        name=row[2],
        revision=row[0],
        market=row[3],
        symbol=row[4],
        timeframe=row[5],
        version=int(row[6]),
        status=row[7],
        audit_run_id=row[8],
        strategy_config=strategy_config if isinstance(strategy_config, dict) else {},
    )


def _condition_text(condition: dict[str, Any], *, default: str) -> str:
    params = condition.get("params") if isinstance(condition.get("params"), dict) else {}
    window = int(_number_or_default(params.get("window"), 20))
    if condition.get("kind") == "close_below_sma":
        return f"Close < SMA{window}"
    return f"Close > SMA{window}" if condition else default


def _format_percent(value: float) -> str:
    percent = round(value * 100, 4)
    return f"{percent:g}%"


def _number_or_default(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _nullable_number(value: Any) -> int | float | None:
    if value is None:
        return None
    return _number_or_default(value, 0)
