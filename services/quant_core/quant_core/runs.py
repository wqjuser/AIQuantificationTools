from __future__ import annotations

import json
import sqlite3
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_BACKTEST_ASSUMPTIONS = {"initialCash": 100_000, "feeBps": 3, "slippageBps": 2}
DEFAULT_DATA_QUALITY = {"source": "unknown", "isComplete": False, "warnings": [], "rows": 0}
DEFAULT_AI_REPORT = {"summary": "", "risks": [], "improvements": [], "disclaimer": ""}
DEFAULT_DATA_SNAPSHOT = {
    "source": "unknown",
    "isComplete": False,
    "warnings": [],
    "rows": 0,
    "start": None,
    "end": None,
    "hash": "",
    "bars": [],
}


def _default_ai_report() -> dict[str, Any]:
    return {
        "summary": DEFAULT_AI_REPORT["summary"],
        "risks": [],
        "improvements": [],
        "disclaimer": DEFAULT_AI_REPORT["disclaimer"],
    }


def _default_data_snapshot() -> dict[str, Any]:
    return {
        "source": DEFAULT_DATA_SNAPSHOT["source"],
        "isComplete": DEFAULT_DATA_SNAPSHOT["isComplete"],
        "warnings": [],
        "rows": DEFAULT_DATA_SNAPSHOT["rows"],
        "start": DEFAULT_DATA_SNAPSHOT["start"],
        "end": DEFAULT_DATA_SNAPSHOT["end"],
        "hash": DEFAULT_DATA_SNAPSHOT["hash"],
        "bars": [],
    }


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
    ai_report: dict[str, Any] = field(default_factory=_default_ai_report)
    data_quality: dict[str, Any] = field(default_factory=lambda: dict(DEFAULT_DATA_QUALITY))
    data_snapshot: dict[str, Any] = field(default_factory=_default_data_snapshot)
    strategy_config: dict[str, Any] | None = None
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
                    ai_report_json text not null default '{"summary": "", "risks": [], "improvements": [], "disclaimer": ""}',
                    data_quality_json text not null default '{"source": "unknown", "isComplete": false, "warnings": [], "rows": 0}',
                    data_snapshot_json text not null default '{"source": "unknown", "isComplete": false, "warnings": [], "rows": 0, "start": null, "end": null, "hash": "", "bars": []}',
                    strategy_config_json text not null default '{}',
                    backtest_assumptions_json text not null default '{"initialCash": 100000, "feeBps": 3, "slippageBps": 2}',
                    backtest_trades_json text not null default '[]',
                    backtest_equity_curve_json text not null default '[]',
                    backtest_diagnostics_json text not null default '[]'
                )
                """
            )
            columns = {row[1] for row in connection.execute("pragma table_info(research_runs)").fetchall()}
            if "ai_report_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column ai_report_json text not null
                    default '{"summary": "", "risks": [], "improvements": [], "disclaimer": ""}'
                    """
                )
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
            if "data_snapshot_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column data_snapshot_json text not null
                    default '{"source": "unknown", "isComplete": false, "warnings": [], "rows": 0, "start": null, "end": null, "hash": "", "bars": []}'
                    """
                )
            if "strategy_config_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column strategy_config_json text not null
                    default '{}'
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
                    ai_report_json,
                    data_quality_json,
                    data_snapshot_json,
                    strategy_config_json,
                    backtest_assumptions_json,
                    backtest_trades_json,
                    backtest_equity_curve_json,
                    backtest_diagnostics_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    ai_report_json = excluded.ai_report_json,
                    data_quality_json = excluded.data_quality_json,
                    data_snapshot_json = excluded.data_snapshot_json,
                    strategy_config_json = excluded.strategy_config_json,
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
                    json.dumps(_normalize_ai_report(audit.ai_report), ensure_ascii=False, sort_keys=True),
                    json.dumps(_normalize_data_quality(audit.data_quality, data_rows=audit.data_rows), ensure_ascii=False, sort_keys=True),
                    json.dumps(_normalize_data_snapshot(audit.data_snapshot), ensure_ascii=False, sort_keys=True),
                    json.dumps(_normalize_strategy_config(audit.strategy_config, audit=audit), ensure_ascii=False, sort_keys=True),
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
                    ai_report_json,
                    data_quality_json,
                    data_snapshot_json,
                    strategy_config_json,
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
                    ai_report_json,
                    data_quality_json,
                    data_snapshot_json,
                    strategy_config_json,
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


def research_run_audit_to_payload(audit: ResearchRunAudit, *, include_data_snapshot: bool = False) -> dict[str, Any]:
    payload = {
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
        "aiReport": _normalize_ai_report(audit.ai_report),
        "dataQuality": _normalize_data_quality(audit.data_quality, data_rows=audit.data_rows),
        "strategyConfig": _normalize_strategy_config(audit.strategy_config, audit=audit),
        "backtestAssumptions": _normalize_backtest_assumptions(audit.backtest_assumptions),
        "backtestTrades": audit.backtest_trades,
        "backtestEquityCurve": audit.backtest_equity_curve,
        "backtestDiagnostics": audit.backtest_diagnostics,
    }
    if include_data_snapshot:
        payload["dataSnapshot"] = _normalize_data_snapshot(audit.data_snapshot)
    return payload


def research_run_audits_to_payload(audits: list[ResearchRunAudit]) -> dict[str, Any]:
    return {"runs": [research_run_audit_to_payload(audit) for audit in audits]}


def research_run_export_to_payload(audit: ResearchRunAudit, *, exported_at: datetime | None = None) -> dict[str, Any]:
    exported = exported_at or datetime.now(timezone.utc)
    run_payload = research_run_audit_to_payload(audit, include_data_snapshot=True)
    data_snapshot = run_payload.get("dataSnapshot", {})
    ai_report = run_payload.get("aiReport", {})
    artifact_counts = {
        "bars": len(data_snapshot.get("bars", [])) if isinstance(data_snapshot, dict) else 0,
        "trades": len(run_payload.get("backtestTrades", [])),
        "equityPoints": len(run_payload.get("backtestEquityCurve", [])),
        "decisions": len(run_payload.get("decisions", [])),
        "aiRisks": len(ai_report.get("risks", [])) if isinstance(ai_report, dict) else 0,
    }
    return {
        "kind": "aiqt.researchRun.export",
        "packageVersion": 1,
        "exportedAt": exported.isoformat(),
        "manifest": {
            "runId": audit.run_id,
            "createdAt": audit.created_at.isoformat(),
            "market": audit.market,
            "symbol": audit.symbol,
            "timeframe": audit.timeframe,
            "strategyRevision": audit.strategy_revision,
            "dataHash": data_snapshot.get("hash", "") if isinstance(data_snapshot, dict) else "",
            "dataRows": audit.data_rows,
            "executionMode": audit.execution_mode,
            "paperOnly": True,
            "liveTradingAllowed": False,
            "artifactCounts": artifact_counts,
        },
        "researchRun": run_payload,
        "executionHandoff": {
            "mode": audit.execution_mode,
            "paperOnly": True,
            "liveTradingAllowed": False,
            "requiredGates": [
                {
                    "id": "adapter-certified",
                    "label": "Adapter certified",
                    "passed": False,
                    "reason": "No certified live adapter is bound to this audited run.",
                },
                {
                    "id": "risk-approved",
                    "label": "Risk approved",
                    "passed": False,
                    "reason": "Risk approval must be rerun before any live route.",
                },
                {
                    "id": "human-confirmed",
                    "label": "Human confirmed",
                    "passed": False,
                    "reason": "Human confirmation is required for execution.",
                },
            ],
        },
    }


def research_run_import_to_audit(payload: dict[str, Any]) -> ResearchRunAudit:
    export_package = payload.get("export", payload)
    if not isinstance(export_package, dict):
        raise ValueError("export_package_must_be_object")
    if export_package.get("kind") != "aiqt.researchRun.export":
        raise ValueError("unsupported_export_kind")
    if int(_number_or_default(export_package.get("packageVersion"), 0)) != 1:
        raise ValueError("unsupported_export_package_version")

    manifest = export_package.get("manifest")
    research_run = export_package.get("researchRun")
    handoff = export_package.get("executionHandoff")
    if not isinstance(manifest, dict):
        raise ValueError("manifest_must_be_object")
    if not isinstance(research_run, dict):
        raise ValueError("research_run_must_be_object")
    if not isinstance(handoff, dict):
        raise ValueError("execution_handoff_must_be_object")
    if bool(manifest.get("liveTradingAllowed")) or bool(handoff.get("liveTradingAllowed")):
        raise ValueError("live_trading_exports_cannot_be_imported")

    run_id = _required_text(research_run, "runId")
    data_snapshot = research_run.get("dataSnapshot")
    if not isinstance(data_snapshot, dict):
        raise ValueError("data_snapshot_must_be_object")

    created_at_raw = _required_text(research_run, "createdAt")
    try:
        created_at = datetime.fromisoformat(created_at_raw)
    except ValueError as error:
        raise ValueError("created_at_must_be_iso_datetime") from error
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    data_rows = int(_number_or_default(research_run.get("dataRows"), data_snapshot.get("rows", 0)))
    return ResearchRunAudit(
        run_id=run_id,
        created_at=created_at,
        market=_required_text(research_run, "market"),
        symbol=_required_text(research_run, "symbol"),
        timeframe=_required_text(research_run, "timeframe"),
        strategy_name=_required_text(research_run, "strategyName"),
        strategy_revision=_required_text(research_run, "strategyRevision"),
        data_rows=max(0, data_rows),
        metrics=_dict_or_empty(research_run.get("metrics")),
        decisions=_list_of_dicts(research_run.get("decisions")),
        execution_mode=str(research_run.get("executionMode") or manifest.get("executionMode") or "paper_only"),
        ai_report=_dict_or_empty(research_run.get("aiReport")),
        data_quality=_dict_or_empty(research_run.get("dataQuality")),
        data_snapshot=data_snapshot,
        strategy_config=_dict_or_empty(research_run.get("strategyConfig")),
        backtest_assumptions=_dict_or_empty(research_run.get("backtestAssumptions")),
        backtest_trades=_list_of_dicts(research_run.get("backtestTrades")),
        backtest_equity_curve=_list_of_dicts(research_run.get("backtestEquityCurve")),
        backtest_diagnostics=_list_of_dicts(research_run.get("backtestDiagnostics")),
    )


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
        ai_report=_normalize_ai_report(json.loads(row[11])),
        data_quality=_normalize_data_quality(json.loads(row[12]), data_rows=row[7]),
        data_snapshot=_normalize_data_snapshot(json.loads(row[13])),
        strategy_config=_normalize_strategy_config(
            json.loads(row[14]),
            audit_fields={
                "strategy_name": row[5],
                "strategy_revision": row[6],
                "market": row[2],
                "symbol": row[3],
                "timeframe": row[4],
            },
        ),
        backtest_assumptions=_normalize_backtest_assumptions(json.loads(row[15])),
        backtest_trades=json.loads(row[16]),
        backtest_equity_curve=json.loads(row[17]),
        backtest_diagnostics=json.loads(row[18]),
    )


def _required_text(mapping: dict[str, Any], key: str) -> str:
    value = mapping.get(key)
    text = str(value).strip() if value is not None else ""
    if not text:
        raise ValueError(f"{key}_is_required")
    return text


def _dict_or_empty(value: Any) -> dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _list_of_dicts(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [dict(item) for item in value if isinstance(item, dict)]


def _normalize_ai_report(value: dict[str, Any] | None) -> dict[str, Any]:
    report = value or {}
    risks = report.get("risks")
    improvements = report.get("improvements")
    if not isinstance(risks, list):
        risks = []
    if not isinstance(improvements, list):
        improvements = []
    return {
        "summary": str(report.get("summary") or DEFAULT_AI_REPORT["summary"]),
        "risks": [str(risk) for risk in risks],
        "improvements": [str(improvement) for improvement in improvements],
        "disclaimer": str(report.get("disclaimer") or DEFAULT_AI_REPORT["disclaimer"]),
    }


def _normalize_data_snapshot(value: dict[str, Any] | None) -> dict[str, Any]:
    snapshot = value or {}
    bars = snapshot.get("bars")
    if not isinstance(bars, list):
        bars = []
    normalized_bars = [_normalize_snapshot_bar(bar) for bar in bars if isinstance(bar, dict)]
    normalized_bars = [bar for bar in normalized_bars if bar is not None]
    warnings = snapshot.get("warnings")
    if not isinstance(warnings, list):
        warnings = []
    rows = int(_number_or_default(snapshot.get("rows"), len(normalized_bars)))
    source = str(snapshot.get("source") or DEFAULT_DATA_SNAPSHOT["source"]).strip() or DEFAULT_DATA_SNAPSHOT["source"]
    digest = str(snapshot.get("hash") or "").strip() or _snapshot_hash(normalized_bars)
    return {
        "source": source,
        "isComplete": bool(snapshot.get("isComplete", snapshot.get("is_complete", DEFAULT_DATA_SNAPSHOT["isComplete"]))),
        "warnings": [str(warning) for warning in warnings],
        "rows": max(0, rows),
        "start": _nullable_string(snapshot.get("start")),
        "end": _nullable_string(snapshot.get("end")),
        "hash": digest,
        "bars": normalized_bars,
    }


def _normalize_snapshot_bar(value: dict[str, Any]) -> dict[str, Any] | None:
    timestamp = value.get("timestamp")
    if not timestamp:
        return None
    return {
        "timestamp": str(timestamp),
        "timestampMs": int(_number_or_default(value.get("timestampMs"), 0)),
        "open": _number_or_default(value.get("open"), 0),
        "high": _number_or_default(value.get("high"), 0),
        "low": _number_or_default(value.get("low"), 0),
        "close": _number_or_default(value.get("close"), 0),
        "volume": _number_or_default(value.get("volume"), 0),
    }


def _snapshot_hash(bars: list[dict[str, Any]]) -> str:
    if not bars:
        return ""
    raw = json.dumps(bars, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


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


def _normalize_strategy_config(
    value: dict[str, Any] | None,
    *,
    audit: ResearchRunAudit | None = None,
    audit_fields: dict[str, Any] | None = None,
) -> dict[str, Any]:
    config = value or {}
    fields = audit_fields or {}
    name = config.get("name") or (audit.strategy_name if audit else fields.get("strategy_name")) or "Unknown strategy"
    revision = config.get("revision") or (audit.strategy_revision if audit else fields.get("strategy_revision")) or "unknown"
    market = config.get("market") or (audit.market if audit else fields.get("market")) or "ashare"
    symbol = audit.symbol if audit else fields.get("symbol")
    symbols = config.get("symbols") if isinstance(config.get("symbols"), list) else ([symbol] if symbol else [])
    timeframe = config.get("timeframe") or (audit.timeframe if audit else fields.get("timeframe")) or "1d"
    entry_conditions = config.get("entryConditions", config.get("entry_conditions", []))
    exit_conditions = config.get("exitConditions", config.get("exit_conditions", []))
    return {
        "name": str(name),
        "revision": str(revision),
        "market": str(market),
        "symbols": [str(item) for item in symbols],
        "timeframe": str(timeframe),
        "version": int(_number_or_default(config.get("version"), 1)),
        "entryConditions": [_normalize_condition(condition) for condition in entry_conditions if isinstance(condition, dict)],
        "exitConditions": [_normalize_condition(condition) for condition in exit_conditions if isinstance(condition, dict)],
        "risk": _normalize_strategy_risk(config.get("risk") if isinstance(config.get("risk"), dict) else {}),
    }


def _normalize_condition(value: dict[str, Any]) -> dict[str, Any]:
    params = value.get("params")
    return {
        "kind": str(value.get("kind") or "unknown"),
        "params": dict(params) if isinstance(params, dict) else {},
    }


def _normalize_strategy_risk(value: dict[str, Any]) -> dict[str, Any]:
    return {
        "positionPct": _nullable_number(value.get("positionPct", value.get("position_pct"))),
        "stopLossPct": _nullable_number(value.get("stopLossPct", value.get("stop_loss_pct"))),
        "takeProfitPct": _nullable_number(value.get("takeProfitPct", value.get("take_profit_pct"))),
        "maxDrawdownPct": _nullable_number(value.get("maxDrawdownPct", value.get("max_drawdown_pct"))),
    }


def _normalize_backtest_assumptions(value: dict[str, Any] | None) -> dict[str, Any]:
    assumptions = value or {}
    return {
        "initialCash": _number_or_default(assumptions.get("initialCash"), DEFAULT_BACKTEST_ASSUMPTIONS["initialCash"]),
        "feeBps": _number_or_default(assumptions.get("feeBps"), DEFAULT_BACKTEST_ASSUMPTIONS["feeBps"]),
        "slippageBps": _number_or_default(assumptions.get("slippageBps"), DEFAULT_BACKTEST_ASSUMPTIONS["slippageBps"]),
    }


def _nullable_number(value: Any) -> int | float | None:
    if value is None:
        return None
    parsed = _number_or_default(value, 0)
    return parsed


def _nullable_string(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _number_or_default(value: Any, default: int | float) -> int | float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    if parsed.is_integer():
        return int(parsed)
    return parsed
