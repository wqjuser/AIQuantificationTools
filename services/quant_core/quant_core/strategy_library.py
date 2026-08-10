from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.canonical import strategy_config_from_payload, strategy_config_to_payload
from quant_core.domain import (
    COST_AWARE_RANGE_REVERSION_POLICY_KINDS,
    StrategyConfig,
)


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
    promotion_evidence: dict[str, Any] | None = None


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
        promotion_evidence: dict[str, Any] | None = None,
        created_at: datetime | None = None,
    ) -> StrategyLibraryRecord:
        return self._save_config(
            strategy_config_to_payload(strategy),
            audit_run_id=audit_run_id,
            promotion_evidence=promotion_evidence,
            created_at=created_at,
        )

    def save_payload(
        self,
        strategy_config: dict[str, Any],
        *,
        audit_run_id: str | None = None,
        promotion_evidence: dict[str, Any] | None = None,
        created_at: datetime | None = None,
    ) -> StrategyLibraryRecord:
        config = _normalize_strategy_config_payload(strategy_config)
        return self._save_config(
            config,
            audit_run_id=audit_run_id,
            promotion_evidence=promotion_evidence,
            created_at=created_at,
        )

    def _save_config(
        self,
        config: dict[str, Any],
        *,
        audit_run_id: str | None,
        promotion_evidence: dict[str, Any] | None,
        created_at: datetime | None,
    ) -> StrategyLibraryRecord:
        revision = str(config.get("revision") or "").strip()
        if not revision:
            raise ValueError("strategy_revision_required")
        requested_audit_run_id = str(audit_run_id or "").strip() or None
        requested_promotion = (
            _canonical_object(
                promotion_evidence,
                "strategy_library_promotion_evidence_invalid",
            )
            if promotion_evidence is not None
            else None
        )
        if requested_promotion is not None and requested_audit_run_id is None:
            raise ValueError("strategy_library_promotion_requires_audit_run")
        if requested_promotion is not None and (
            requested_promotion.get("freshSourceRunId") != requested_audit_run_id
            or requested_promotion.get("strategyRevision") != revision
        ):
            raise ValueError("strategy_library_promotion_evidence_invalid")
        timestamp = created_at or datetime.now(timezone.utc)
        symbols = (
            config.get("symbols")
            if isinstance(config.get("symbols"), list)
            else []
        )
        connection = self._connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                select revision, created_at, name, market, symbol, timeframe,
                       version, status, audit_run_id, strategy_config_json,
                       promotion_evidence_json
                from strategy_versions
                where revision = ?
                """,
                (revision,),
            ).fetchone()
            existing = _row_to_record(row) if row is not None else None
            if existing is not None and existing.strategy_config != config:
                raise ValueError("strategy_library_revision_conflict")
            if (
                existing is not None
                and existing.promotion_evidence is not None
                and requested_promotion is not None
                and (
                    existing.audit_run_id == requested_audit_run_id
                    or existing.promotion_evidence.get("experimentId")
                    == requested_promotion.get("experimentId")
                )
                and existing.promotion_evidence != requested_promotion
            ):
                raise ValueError("strategy_library_promotion_evidence_conflict")

            prior_audit_run_id = (
                existing.audit_run_id if existing is not None else None
            )
            if (
                requested_audit_run_id is not None
                and requested_audit_run_id != prior_audit_run_id
            ):
                final_audit_run_id = requested_audit_run_id
                final_promotion = requested_promotion
            else:
                final_audit_run_id = prior_audit_run_id or requested_audit_run_id
                final_promotion = (
                    existing.promotion_evidence if existing is not None else None
                ) or requested_promotion
            if final_promotion is not None and final_audit_run_id is None:
                raise ValueError("strategy_library_promotion_requires_audit_run")
            status = "audited" if final_audit_run_id else "draft"
            created_value = existing.created_at if existing else timestamp
            values = (
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
                _dump_optional_json(final_promotion),
            )
            if existing is None:
                connection.execute(
                    """
                    insert into strategy_versions (
                        revision, created_at, name, market, symbol, timeframe,
                        version, status, audit_run_id, strategy_config_json,
                        promotion_evidence_json
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    values,
                )
            else:
                connection.execute(
                    """
                    update strategy_versions
                    set status = ?, audit_run_id = ?, promotion_evidence_json = ?
                    where revision = ?
                    """,
                    (
                        status,
                        final_audit_run_id,
                        _dump_optional_json(final_promotion),
                        revision,
                    ),
                )
            saved_row = connection.execute(
                """
                select revision, created_at, name, market, symbol, timeframe,
                       version, status, audit_run_id, strategy_config_json,
                       promotion_evidence_json
                from strategy_versions
                where revision = ?
                """,
                (revision,),
            ).fetchone()
            if saved_row is None:
                raise RuntimeError("strategy_library_save_failed")
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()
        return _row_to_record(saved_row)

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
                select revision, created_at, name, market, symbol, timeframe, version,
                       status, audit_run_id, strategy_config_json,
                       promotion_evidence_json
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
                select revision, created_at, name, market, symbol, timeframe, version,
                       status, audit_run_id, strategy_config_json,
                       promotion_evidence_json
                from strategy_versions
                where revision = ?
                """,
                (normalized_revision,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_record(row) if row else None

    def restore(self, record: StrategyLibraryRecord) -> StrategyLibraryRecord:
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
                    strategy_config_json,
                    promotion_evidence_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(revision) do update set
                    created_at = excluded.created_at,
                    name = excluded.name,
                    market = excluded.market,
                    symbol = excluded.symbol,
                    timeframe = excluded.timeframe,
                    version = excluded.version,
                    status = excluded.status,
                    audit_run_id = excluded.audit_run_id,
                    strategy_config_json = excluded.strategy_config_json,
                    promotion_evidence_json = excluded.promotion_evidence_json
                """,
                (
                    record.revision,
                    record.created_at.isoformat(),
                    record.name,
                    record.market,
                    record.symbol,
                    record.timeframe,
                    record.version,
                    record.status,
                    record.audit_run_id,
                    json.dumps(record.strategy_config, ensure_ascii=False, sort_keys=True),
                    _dump_optional_json(record.promotion_evidence),
                ),
            )
            connection.commit()
        finally:
            connection.close()
        restored = self.get(record.revision)
        if restored is None:
            raise RuntimeError("strategy_library_restore_failed")
        return restored

    def delete(self, revision: str) -> None:
        normalized_revision = revision.strip()
        if not normalized_revision:
            return
        connection = self._connect()
        try:
            connection.execute("delete from strategy_versions where revision = ?", (normalized_revision,))
            connection.commit()
        finally:
            connection.close()

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
                    strategy_config_json text not null,
                    promotion_evidence_json text
                )
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute(
                    "pragma table_info(strategy_versions)"
                ).fetchall()
            }
            if "promotion_evidence_json" not in columns:
                connection.execute(
                    "alter table strategy_versions add column promotion_evidence_json text"
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
        "promotionEvidence": record.promotion_evidence,
        "strategyConfig": record.strategy_config,
        "strategySnapshot": strategy_snapshot_from_config_payload(record.strategy_config),
    }


def strategy_library_records_to_payload(records: list[StrategyLibraryRecord]) -> dict[str, Any]:
    return {"strategies": [strategy_library_record_to_payload(record) for record in records]}


def strategy_snapshot_from_config_payload(config: dict[str, Any]) -> dict[str, str]:
    if int(_number_or_default(config.get("version"), 1)) == 2 and isinstance(config.get("policy"), dict):
        policy = config["policy"]
        if policy.get("kind") in COST_AWARE_RANGE_REVERSION_POLICY_KINDS:
            default_anchor_bars = (
                139
                if policy.get("kind") == "cost_aware_range_reversion_v1_1"
                else 42
            )
            default_name = (
                "BTC Cost-Aware Range Reversion v1.1"
                if policy.get("kind") == "cost_aware_range_reversion_v1_1"
                else "BTC Cost-Aware Range Reversion v1"
            )
            range_regime = (
                policy.get("rangeRegime")
                if isinstance(policy.get("rangeRegime"), dict)
                else {}
            )
            reversion = (
                policy.get("reversion")
                if isinstance(policy.get("reversion"), dict)
                else {}
            )
            atr = policy.get("atr") if isinstance(policy.get("atr"), dict) else {}
            exit_rule = (
                policy.get("exit") if isinstance(policy.get("exit"), dict) else {}
            )
            holding = (
                policy.get("holding")
                if isinstance(policy.get("holding"), dict)
                else {}
            )
            cooldown = (
                policy.get("cooldown")
                if isinstance(policy.get("cooldown"), dict)
                else {}
            )
            risk = config.get("risk") if isinstance(config.get("risk"), dict) else {}
            return {
                "name": str(config.get("name") or default_name),
                "entry": (
                    f"{policy.get('decisionTimeframe', '4h')} "
                    f"{range_regime.get('indicatorAnchorBars', default_anchor_bars)}-bar indicator anchor; range "
                    f"|EMA{range_regime.get('fastEmaWindow', 6)}/"
                    f"EMA{range_regime.get('slowEmaWindow', 42)}-1| <= "
                    f"{_format_percent(_number_or_default(range_regime.get('maximumSeparationPct'), 0.01))}; "
                    f"Z{reversion.get('zScoreWindow', 24)} <= "
                    f"{_number_or_default(reversion.get('entryZThreshold'), -2):g}; "
                    f"recover within {reversion.get('recoveryWindowBars', 3)} bars; "
                    f"mean distance >= "
                    f"{_format_percent(_number_or_default(reversion.get('minimumExpectedDistancePct'), 0.012))}"
                ),
                "exit": (
                    f"Z{reversion.get('zScoreWindow', 24)} >= "
                    f"{_number_or_default(exit_rule.get('zScoreThreshold'), 0):g}, "
                    f"ATR{atr.get('window', 14)} fixed "
                    f"{_number_or_default(atr.get('initialMultiple'), 2.5):g}x, "
                    f"range close, max hold {holding.get('maxBars', 18)} bars, "
                    f"cooldown {cooldown.get('bars', 6)} bars"
                ),
                "position": (
                    f"{_format_percent(_number_or_default(risk.get('positionPct'), 0.6))} "
                    "cap per instrument"
                ),
                "risk": (
                    f"Risk budget {_format_percent(_number_or_default(risk.get('riskBudgetPct'), 0.015))}, "
                    f"drawdown guard {_format_percent(_number_or_default(risk.get('maxDrawdownPct'), 0.03))}, "
                    f"daily loss {_format_percent(_number_or_default(risk.get('dailyLossLimitPct'), 0.02))}, "
                    "paper only"
                ),
            }
        regime = policy.get("regime") if isinstance(policy.get("regime"), dict) else {}
        breakout = policy.get("breakout") if isinstance(policy.get("breakout"), dict) else {}
        volume = policy.get("volume") if isinstance(policy.get("volume"), dict) else {}
        atr = policy.get("atr") if isinstance(policy.get("atr"), dict) else {}
        holding = policy.get("holding") if isinstance(policy.get("holding"), dict) else {}
        cooldown = policy.get("cooldown") if isinstance(policy.get("cooldown"), dict) else {}
        risk = config.get("risk") if isinstance(config.get("risk"), dict) else {}
        return {
            "name": str(config.get("name") or "BTC Regime Breakout v2"),
            "entry": (
                f"{regime.get('timeframe', '60m')} Close > SMA{regime.get('closeAboveSmaWindow', 200)} rising; "
                f"5m prior-high breakout {breakout.get('lookbackBars', 20)}; "
                f"volume >= prior SMA{volume.get('smaWindow', 20)} x {volume.get('multiplier', 1.5)}"
            ),
            "exit": (
                f"ATR{atr.get('window', 14)} initial {atr.get('initialMultiple', 1)}x, "
                f"trail {atr.get('trailingMultiple', 2)}x; holding {holding.get('maxBars', 48)} bars; "
                f"cooldown {cooldown.get('bars', 12)} bars"
            ),
            "position": f"{_format_percent(_number_or_default(risk.get('positionPct'), 0.6))} cap per instrument",
            "risk": (
                f"Risk budget {_format_percent(_number_or_default(risk.get('riskBudgetPct'), 0.005))}, "
                f"drawdown guard {_format_percent(_number_or_default(risk.get('maxDrawdownPct'), 0.03))}, "
                "ATR exits, paper only"
            ),
        }
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
    version = int(_number_or_default(value.get("version"), 1))
    if version == 2:
        canonical = strategy_config_to_payload(strategy_config_from_payload(value))
        supplied_revision = str(value.get("revision") or "").strip()
        if supplied_revision and supplied_revision != canonical["revision"]:
            raise ValueError("strategy_revision_mismatch")
        return canonical
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
        "version": version,
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
    promotion_evidence = (
        json.loads(row[10]) if len(row) > 10 and row[10] is not None else None
    )
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
        promotion_evidence=(
            promotion_evidence if isinstance(promotion_evidence, dict) else None
        ),
    )


def _canonical_object(value: Any, error: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(error)
    try:
        normalized = json.loads(
            json.dumps(
                value,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
                allow_nan=False,
            )
        )
    except (TypeError, ValueError) as exc:
        raise ValueError(error) from exc
    if not isinstance(normalized, dict):
        raise ValueError(error)
    return normalized


def _dump_optional_json(value: dict[str, Any] | None) -> str | None:
    if value is None:
        return None
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
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
