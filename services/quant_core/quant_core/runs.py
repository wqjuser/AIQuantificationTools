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
DEFAULT_RESEARCH_NOTE = {"market": "", "symbol": "", "timeframe": "", "body": "", "updatedAt": None}
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
EXPORT_PACKAGE_INTEGRITY_METADATA_KEYS = {
    "integrity",
    "exportedAt",
    "auditEvidenceSummary",
    "auditReport",
    "backtestReport",
}


def _default_ai_report() -> dict[str, Any]:
    return {
        "summary": DEFAULT_AI_REPORT["summary"],
        "risks": [],
        "improvements": [],
        "disclaimer": DEFAULT_AI_REPORT["disclaimer"],
    }


def _default_research_note() -> dict[str, Any]:
    return dict(DEFAULT_RESEARCH_NOTE)


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
    research_note: dict[str, Any] = field(default_factory=_default_research_note)


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
                    backtest_diagnostics_json text not null default '[]',
                    research_note_json text not null default '{"market": "", "symbol": "", "timeframe": "", "body": "", "updatedAt": null}'
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
            columns = {row[1] for row in connection.execute("pragma table_info(research_runs)").fetchall()}
            if "research_note_json" not in columns:
                connection.execute(
                    """
                    alter table research_runs
                    add column research_note_json text not null
                    default '{"market": "", "symbol": "", "timeframe": "", "body": "", "updatedAt": null}'
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
                    backtest_diagnostics_json,
                    research_note_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    backtest_diagnostics_json = excluded.backtest_diagnostics_json,
                    research_note_json = excluded.research_note_json
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
                    json.dumps(_normalize_research_note(audit.research_note, audit=audit), ensure_ascii=False, sort_keys=True),
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
                    backtest_diagnostics_json,
                    research_note_json
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
                    backtest_diagnostics_json,
                    research_note_json
                from research_runs
                where run_id = ?
                limit 1
                """,
                (run_id,),
            ).fetchone()
        finally:
            connection.close()

        return _row_to_research_run_audit(row) if row else None

    def delete(self, run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from research_runs where run_id = ?", (run_id,))
            connection.commit()
        finally:
            connection.close()


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
        "researchNote": _normalize_research_note(audit.research_note, audit=audit),
    }
    if include_data_snapshot:
        payload["dataSnapshot"] = _normalize_data_snapshot(audit.data_snapshot)
    return payload


def research_run_audits_to_payload(audits: list[ResearchRunAudit]) -> dict[str, Any]:
    return {"runs": [research_run_audit_to_payload(audit) for audit in audits]}


def research_run_export_to_payload(
    audit: ResearchRunAudit,
    *,
    exported_at: datetime | None = None,
    paper_executions: list[dict[str, Any]] | None = None,
    portfolio_paper_orders: list[dict[str, Any]] | None = None,
    portfolio_paper_order_approvals: list[dict[str, Any]] | None = None,
    portfolio_paper_order_simulations: list[dict[str, Any]] | None = None,
    promotion_candidate: dict[str, Any] | None = None,
    ai_review_runs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    exported = exported_at or datetime.now(timezone.utc)
    run_payload = research_run_audit_to_payload(audit, include_data_snapshot=True)
    data_snapshot = run_payload.get("dataSnapshot", {})
    ai_report = run_payload.get("aiReport", {})
    research_note = _dict_or_empty(run_payload.get("researchNote"))
    paper_execution_payloads = _normalize_paper_execution_payloads(paper_executions, run_id=audit.run_id)
    portfolio_paper_order_payloads = _normalize_portfolio_paper_order_payloads(
        portfolio_paper_orders,
        base_run_id=audit.run_id,
    )
    portfolio_paper_order_approval_payloads = _normalize_portfolio_paper_order_approval_payloads(
        portfolio_paper_order_approvals,
        base_run_id=audit.run_id,
    )
    portfolio_paper_order_simulation_payloads = _normalize_portfolio_paper_order_simulation_payloads(
        portfolio_paper_order_simulations,
        base_run_id=audit.run_id,
    )
    normalized_promotion_candidate = _normalize_promotion_candidate(promotion_candidate, run_id=audit.run_id)
    ai_review_run_payloads = _normalize_ai_review_run_payloads(ai_review_runs, run_id=audit.run_id)
    artifact_counts = {
        "bars": len(data_snapshot.get("bars", [])) if isinstance(data_snapshot, dict) else 0,
        "trades": len(run_payload.get("backtestTrades", [])),
        "equityPoints": len(run_payload.get("backtestEquityCurve", [])),
        "decisions": len(run_payload.get("decisions", [])),
        "aiRisks": len(ai_report.get("risks", [])) if isinstance(ai_report, dict) else 0,
        "paperExecutions": len(paper_execution_payloads),
        "portfolioPaperOrderBatches": len(portfolio_paper_order_payloads),
        "portfolioPaperOrderApprovals": len(portfolio_paper_order_approval_payloads),
        "portfolioPaperOrderSimulations": len(portfolio_paper_order_simulation_payloads),
        "promotionCandidates": 1 if normalized_promotion_candidate else 0,
        "researchNotes": 1 if _research_note_has_body(research_note) else 0,
        "aiReviewRuns": len(ai_review_run_payloads),
    }
    export_package = {
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
        "paperExecutions": paper_execution_payloads,
        "portfolioPaperOrderBatches": portfolio_paper_order_payloads,
        "portfolioPaperOrderApprovals": portfolio_paper_order_approval_payloads,
        "portfolioPaperOrderSimulations": portfolio_paper_order_simulation_payloads,
        "promotionCandidate": normalized_promotion_candidate,
        "aiReviewRuns": ai_review_run_payloads,
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
    export_package["integrity"] = {"algorithm": "sha256", "hash": _export_package_hash(export_package)}
    return export_package


def research_run_import_paper_executions(payload: dict[str, Any], *, run_id: str | None = None) -> list[dict[str, Any]]:
    export_package = payload.get("export", payload)
    if not isinstance(export_package, dict):
        raise ValueError("export_package_must_be_object")
    raw_executions = export_package.get("paperExecutions", [])
    if raw_executions is None:
        return []
    if not isinstance(raw_executions, list):
        raise ValueError("paper_executions_must_be_array")
    executions = []
    for item in raw_executions:
        if not isinstance(item, dict):
            raise ValueError("paper_execution_must_be_object")
        execution = dict(item)
        if run_id is not None and str(execution.get("runId") or "") != run_id:
            raise ValueError("paper_execution_run_id_mismatch")
        executions.append(execution)
    return executions


def research_run_import_portfolio_paper_orders(
    payload: dict[str, Any],
    *,
    base_run_id: str | None = None,
) -> list[dict[str, Any]]:
    export_package = payload.get("export", payload)
    if not isinstance(export_package, dict):
        raise ValueError("export_package_must_be_object")
    raw_batches = export_package.get("portfolioPaperOrderBatches", [])
    if raw_batches is None:
        return []
    if not isinstance(raw_batches, list):
        raise ValueError("portfolio_paper_order_batches_must_be_array")
    return _normalize_portfolio_paper_order_payloads(raw_batches, base_run_id=base_run_id, strict=True)


def research_run_import_portfolio_paper_order_approvals(
    payload: dict[str, Any],
    *,
    base_run_id: str | None = None,
) -> list[dict[str, Any]]:
    export_package = payload.get("export", payload)
    if not isinstance(export_package, dict):
        raise ValueError("export_package_must_be_object")
    raw_approvals = export_package.get("portfolioPaperOrderApprovals", [])
    if raw_approvals is None:
        return []
    if not isinstance(raw_approvals, list):
        raise ValueError("portfolio_paper_order_approvals_must_be_array")
    return _normalize_portfolio_paper_order_approval_payloads(raw_approvals, base_run_id=base_run_id, strict=True)


def research_run_import_portfolio_paper_order_simulations(
    payload: dict[str, Any],
    *,
    base_run_id: str | None = None,
) -> list[dict[str, Any]]:
    export_package = payload.get("export", payload)
    if not isinstance(export_package, dict):
        raise ValueError("export_package_must_be_object")
    raw_simulations = export_package.get("portfolioPaperOrderSimulations", [])
    if raw_simulations is None:
        return []
    if not isinstance(raw_simulations, list):
        raise ValueError("portfolio_paper_order_simulations_must_be_array")
    return _normalize_portfolio_paper_order_simulation_payloads(raw_simulations, base_run_id=base_run_id, strict=True)


def research_run_import_ai_review_runs(payload: dict[str, Any], *, run_id: str | None = None) -> list[dict[str, Any]]:
    export_package = payload.get("export", payload)
    if not isinstance(export_package, dict):
        raise ValueError("export_package_must_be_object")
    raw_reviews = export_package.get("aiReviewRuns", [])
    if raw_reviews is None:
        return []
    if not isinstance(raw_reviews, list):
        raise ValueError("ai_review_runs_must_be_array")
    return _normalize_ai_review_run_payloads(raw_reviews, run_id=run_id)


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
    _validate_export_integrity(export_package)
    if bool(manifest.get("liveTradingAllowed")) or bool(handoff.get("liveTradingAllowed")):
        raise ValueError("live_trading_exports_cannot_be_imported")

    run_id = _required_text(research_run, "runId")
    paper_executions = research_run_import_paper_executions(export_package, run_id=run_id)
    portfolio_paper_orders = research_run_import_portfolio_paper_orders(export_package, base_run_id=run_id)
    portfolio_paper_order_approvals = research_run_import_portfolio_paper_order_approvals(
        export_package,
        base_run_id=run_id,
    )
    portfolio_paper_order_simulations = research_run_import_portfolio_paper_order_simulations(
        export_package,
        base_run_id=run_id,
    )
    ai_review_runs = research_run_import_ai_review_runs(export_package, run_id=run_id)
    promotion_candidate = _normalize_promotion_candidate(export_package.get("promotionCandidate"), run_id=run_id)
    data_snapshot = research_run.get("dataSnapshot")
    if not isinstance(data_snapshot, dict):
        raise ValueError("data_snapshot_must_be_object")
    _validate_manifest_consistency(
        manifest,
        research_run,
        data_snapshot,
        handoff,
        paper_executions=paper_executions,
        portfolio_paper_orders=portfolio_paper_orders,
        portfolio_paper_order_approvals=portfolio_paper_order_approvals,
        portfolio_paper_order_simulations=portfolio_paper_order_simulations,
        ai_review_runs=ai_review_runs,
        promotion_candidate=promotion_candidate,
    )

    created_at_raw = _required_text(research_run, "createdAt")
    try:
        created_at = datetime.fromisoformat(created_at_raw)
    except ValueError as error:
        raise ValueError("created_at_must_be_iso_datetime") from error
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    data_rows = int(_number_or_default(research_run.get("dataRows"), data_snapshot.get("rows", 0)))
    market = _required_text(research_run, "market")
    symbol = _required_text(research_run, "symbol")
    timeframe = _required_text(research_run, "timeframe")
    return ResearchRunAudit(
        run_id=run_id,
        created_at=created_at,
        market=market,
        symbol=symbol,
        timeframe=timeframe,
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
        research_note=_normalize_research_note(
            _dict_or_empty(research_run.get("researchNote")),
            audit_fields={"market": market, "symbol": symbol, "timeframe": timeframe},
        ),
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
        research_note=_normalize_research_note(
            json.loads(row[19]),
            audit_fields={"market": row[2], "symbol": row[3], "timeframe": row[4]},
        ),
    )


def _export_package_hash(export_package: dict[str, Any]) -> str:
    payload = {key: value for key, value in export_package.items() if key not in EXPORT_PACKAGE_INTEGRITY_METADATA_KEYS}
    raw = json.dumps(_canonical_integrity_value(payload), ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _canonical_integrity_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _canonical_integrity_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_canonical_integrity_value(item) for item in value]
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str):
        return _canonical_integrity_text(value)
    return value


def _canonical_integrity_text(value: str) -> str:
    if "T" not in value:
        return value
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return value
    if parsed.tzinfo is None:
        return value
    return parsed.astimezone(timezone.utc).isoformat()


def _validate_export_integrity(export_package: dict[str, Any]) -> None:
    integrity = export_package.get("integrity")
    if integrity is None:
        return
    if not isinstance(integrity, dict):
        raise ValueError("integrity_must_be_object")
    if integrity.get("algorithm") != "sha256":
        raise ValueError("integrity_algorithm_must_be_sha256")
    supplied_hash = str(integrity.get("hash") or "").lower()
    if supplied_hash != _export_package_hash(export_package):
        raise ValueError("integrity_hash_mismatch")


def _validate_manifest_consistency(
    manifest: dict[str, Any],
    research_run: dict[str, Any],
    data_snapshot: dict[str, Any],
    handoff: dict[str, Any],
    *,
    paper_executions: list[dict[str, Any]] | None = None,
    portfolio_paper_orders: list[dict[str, Any]] | None = None,
    portfolio_paper_order_approvals: list[dict[str, Any]] | None = None,
    portfolio_paper_order_simulations: list[dict[str, Any]] | None = None,
    ai_review_runs: list[dict[str, Any]] | None = None,
    promotion_candidate: dict[str, Any] | None = None,
) -> None:
    for manifest_key, run_key, error_code in [
        ("runId", "runId", "manifest_run_id_mismatch"),
        ("createdAt", "createdAt", "manifest_created_at_mismatch"),
        ("market", "market", "manifest_market_mismatch"),
        ("symbol", "symbol", "manifest_symbol_mismatch"),
        ("timeframe", "timeframe", "manifest_timeframe_mismatch"),
        ("strategyRevision", "strategyRevision", "manifest_strategy_revision_mismatch"),
        ("executionMode", "executionMode", "manifest_execution_mode_mismatch"),
    ]:
        if str(manifest.get(manifest_key) or "") != str(research_run.get(run_key) or ""):
            raise ValueError(error_code)
    if str(handoff.get("mode") or "") != str(research_run.get("executionMode") or ""):
        raise ValueError("execution_handoff_mode_mismatch")

    bars = data_snapshot.get("bars")
    if not isinstance(bars, list):
        raise ValueError("data_snapshot_bars_must_be_array")
    manifest_hash = str(manifest.get("dataHash") or "")
    snapshot_hash = str(data_snapshot.get("hash") or "")
    if manifest_hash != snapshot_hash:
        raise ValueError("data_hash_mismatch")

    bar_count = len(bars)
    manifest_rows = int(_number_or_default(manifest.get("dataRows"), -1))
    run_rows = int(_number_or_default(research_run.get("dataRows"), -1))
    snapshot_rows = int(_number_or_default(data_snapshot.get("rows"), -1))
    if manifest_rows != run_rows or run_rows != snapshot_rows or snapshot_rows != bar_count:
        raise ValueError("data_rows_mismatch")

    counts = manifest.get("artifactCounts")
    if not isinstance(counts, dict):
        raise ValueError("artifact_counts_must_be_object")
    expected_counts = {
        "bars": bar_count,
        "trades": len(_list_of_dicts(research_run.get("backtestTrades"))),
        "equityPoints": len(_list_of_dicts(research_run.get("backtestEquityCurve"))),
        "decisions": len(_list_of_dicts(research_run.get("decisions"))),
        "aiRisks": len(_safe_string_list(_dict_or_empty(research_run.get("aiReport")).get("risks"))),
    }
    if "paperExecutions" in counts or paper_executions:
        expected_counts["paperExecutions"] = len(paper_executions or [])
    if "portfolioPaperOrderBatches" in counts or portfolio_paper_orders:
        expected_counts["portfolioPaperOrderBatches"] = len(portfolio_paper_orders or [])
    if "portfolioPaperOrderApprovals" in counts or portfolio_paper_order_approvals:
        expected_counts["portfolioPaperOrderApprovals"] = len(portfolio_paper_order_approvals or [])
    if "portfolioPaperOrderSimulations" in counts or portfolio_paper_order_simulations:
        expected_counts["portfolioPaperOrderSimulations"] = len(portfolio_paper_order_simulations or [])
    if "promotionCandidates" in counts or promotion_candidate:
        expected_counts["promotionCandidates"] = 1 if promotion_candidate else 0
    if "aiReviewRuns" in counts or ai_review_runs:
        expected_counts["aiReviewRuns"] = len(ai_review_runs or [])
    research_note = _normalize_research_note(
        _dict_or_empty(research_run.get("researchNote")),
        audit_fields={
            "market": str(research_run.get("market") or ""),
            "symbol": str(research_run.get("symbol") or ""),
            "timeframe": str(research_run.get("timeframe") or ""),
        },
    )
    if "researchNotes" in counts or _research_note_has_body(research_note):
        expected_counts["researchNotes"] = 1 if _research_note_has_body(research_note) else 0
    for key, expected in expected_counts.items():
        actual = int(_number_or_default(counts.get(key), -1))
        if actual != expected:
            raise ValueError(f"artifact_count_{_camel_to_snake(key)}_mismatch")


def _required_text(mapping: dict[str, Any], key: str) -> str:
    value = mapping.get(key)
    text = str(value).strip() if value is not None else ""
    if not text:
        raise ValueError(f"{key}_is_required")
    return text


def _dict_or_empty(value: Any) -> dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _normalize_research_note(
    value: dict[str, Any] | None,
    *,
    audit: ResearchRunAudit | None = None,
    audit_fields: dict[str, Any] | None = None,
) -> dict[str, Any]:
    note = _dict_or_empty(value)
    fields = audit_fields or {}
    market = str(note.get("market") or fields.get("market") or (audit.market if audit else "") or "").strip()
    symbol = str(note.get("symbol") or fields.get("symbol") or (audit.symbol if audit else "") or "").strip()
    timeframe = str(note.get("timeframe") or fields.get("timeframe") or (audit.timeframe if audit else "") or "").strip()
    updated_at = note.get("updatedAt", note.get("updated_at"))
    updated_at_text = str(updated_at).strip() if updated_at is not None else ""
    return {
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "body": str(note.get("body") or "").strip(),
        "updatedAt": updated_at_text or None,
    }


def _research_note_has_body(value: dict[str, Any]) -> bool:
    return bool(str(value.get("body") or "").strip())


def _list_of_dicts(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [dict(item) for item in value if isinstance(item, dict)]


def _normalize_paper_execution_payloads(value: list[dict[str, Any]] | None, *, run_id: str) -> list[dict[str, Any]]:
    normalized = []
    for item in value or []:
        if not isinstance(item, dict):
            continue
        execution_run_id = str(item.get("runId") or run_id)
        if execution_run_id != run_id:
            continue
        normalized.append(
            {
                "executionId": str(item.get("executionId") or ""),
                "runId": execution_run_id,
                "createdAt": str(item.get("createdAt") or ""),
                "mode": str(item.get("mode") or "paper_only"),
                "account": _dict_or_empty(item.get("account")),
                "orders": _list_of_dicts(item.get("orders")),
                "gates": _list_of_dicts(item.get("gates")),
            }
        )
    return normalized


def _normalize_portfolio_paper_order_payloads(
    value: list[dict[str, Any]] | None,
    *,
    base_run_id: str | None = None,
    strict: bool = False,
) -> list[dict[str, Any]]:
    normalized = []
    expected_base_run_id = str(base_run_id or "").strip()
    for item in value or []:
        if not isinstance(item, dict):
            if strict:
                raise ValueError("portfolio_paper_order_batch_must_be_object")
            continue
        batch_base_run_id = str(item.get("baseRunId") or expected_base_run_id).strip()
        if expected_base_run_id and batch_base_run_id != expected_base_run_id:
            if strict:
                raise ValueError("portfolio_paper_order_base_run_id_mismatch")
            continue
        batch_id = str(item.get("batchId") or "").strip()
        if strict and not batch_id:
            raise ValueError("portfolio_paper_order_batch_id_required")
        mode = str(item.get("mode") or "portfolio_paper_order_review").strip()
        if strict and mode != "portfolio_paper_order_review":
            raise ValueError("portfolio_paper_order_batch_mode_invalid")
        orders = item.get("orders")
        if not isinstance(orders, list):
            if strict:
                raise ValueError("portfolio_paper_order_orders_required")
            orders = []
        normalized.append(
            {
                "batchId": batch_id,
                "baseRunId": batch_base_run_id,
                "portfolioName": str(item.get("portfolioName") or ""),
                "createdAt": str(item.get("createdAt") or ""),
                "mode": mode,
                "source": str(item.get("source") or "portfolio_backtest"),
                "summary": _dict_or_empty(item.get("summary")),
                "orders": _list_of_dicts(orders),
            }
        )
    return normalized


def _normalize_portfolio_paper_order_approval_payloads(
    value: list[dict[str, Any]] | None,
    *,
    base_run_id: str | None = None,
    strict: bool = False,
) -> list[dict[str, Any]]:
    normalized = []
    expected_base_run_id = str(base_run_id or "").strip()
    for item in value or []:
        if not isinstance(item, dict):
            if strict:
                raise ValueError("portfolio_paper_order_approval_must_be_object")
            continue
        approval_base_run_id = str(item.get("baseRunId") or expected_base_run_id).strip()
        if expected_base_run_id and approval_base_run_id != expected_base_run_id:
            if strict:
                raise ValueError("portfolio_paper_order_approval_base_run_id_mismatch")
            continue
        approval_id = str(item.get("approvalId") or "").strip()
        batch_id = str(item.get("batchId") or "").strip()
        order_id = str(item.get("orderId") or "").strip()
        reviewed_at = str(item.get("reviewedAt") or "").strip()
        if strict:
            if not approval_id:
                raise ValueError("portfolio_paper_order_approval_id_required")
            if not batch_id:
                raise ValueError("portfolio_paper_order_approval_batch_id_required")
            if not order_id:
                raise ValueError("portfolio_paper_order_approval_order_id_required")
            if not reviewed_at:
                raise ValueError("portfolio_paper_order_approval_reviewed_at_required")
            if not isinstance(item.get("approved"), bool):
                raise ValueError("portfolio_paper_order_approval_approved_must_be_boolean")
            if not str(item.get("reviewer") or "").strip():
                raise ValueError("portfolio_paper_order_approval_reviewer_required")
            if not str(item.get("reason") or "").strip():
                raise ValueError("portfolio_paper_order_approval_reason_required")
        normalized.append(
            {
                "approvalId": approval_id,
                "baseRunId": approval_base_run_id,
                "batchId": batch_id,
                "orderId": order_id,
                "reviewedAt": reviewed_at,
                "approved": bool(item.get("approved")),
                "reviewer": str(item.get("reviewer") or ""),
                "reason": str(item.get("reason") or ""),
            }
        )
    return normalized


def _normalize_portfolio_paper_order_simulation_payloads(
    value: list[dict[str, Any]] | None,
    *,
    base_run_id: str | None = None,
    strict: bool = False,
) -> list[dict[str, Any]]:
    normalized = []
    expected_base_run_id = str(base_run_id or "").strip()
    for item in value or []:
        if not isinstance(item, dict):
            if strict:
                raise ValueError("portfolio_paper_order_simulation_must_be_object")
            continue
        simulation_base_run_id = str(item.get("baseRunId") or expected_base_run_id).strip()
        if expected_base_run_id and simulation_base_run_id != expected_base_run_id:
            if strict:
                raise ValueError("portfolio_paper_order_simulation_base_run_id_mismatch")
            continue
        simulation_id = str(item.get("simulationId") or "").strip()
        batch_id = str(item.get("batchId") or "").strip()
        order_id = str(item.get("orderId") or "").strip()
        simulated_at = str(item.get("simulatedAt") or "").strip()
        mode = str(item.get("mode") or "portfolio_paper_order_simulation").strip()
        side = str(item.get("side") or "").strip()
        quantity = _number_or_default(item.get("quantity"), 0)
        fill_price = _number_or_default(item.get("fillPrice"), 0)
        notional_value = _number_or_default(item.get("notionalValue"), 0)
        if strict:
            if not simulation_id:
                raise ValueError("portfolio_paper_order_simulation_id_required")
            if not batch_id:
                raise ValueError("portfolio_paper_order_simulation_batch_id_required")
            if not order_id:
                raise ValueError("portfolio_paper_order_simulation_order_id_required")
            if not simulated_at:
                raise ValueError("portfolio_paper_order_simulation_simulated_at_required")
            if mode != "portfolio_paper_order_simulation":
                raise ValueError("portfolio_paper_order_simulation_mode_invalid")
            if side not in {"buy", "sell"}:
                raise ValueError("portfolio_paper_order_simulation_side_invalid")
            if quantity <= 0 or fill_price <= 0 or notional_value <= 0:
                raise ValueError("portfolio_paper_order_simulation_fill_values_required")
            if str(item.get("orderState") or "") != "filled":
                raise ValueError("portfolio_paper_order_simulation_order_state_invalid")
            if str(item.get("fillStatus") or "") != "filled":
                raise ValueError("portfolio_paper_order_simulation_fill_status_invalid")
        normalized.append(
            {
                "simulationId": simulation_id,
                "baseRunId": simulation_base_run_id,
                "batchId": batch_id,
                "orderId": order_id,
                "simulatedAt": simulated_at,
                "mode": mode,
                "symbol": str(item.get("symbol") or ""),
                "sourceRunId": str(item.get("sourceRunId") or "").strip() or None,
                "side": side,
                "quantity": quantity,
                "fillPrice": fill_price,
                "notionalValue": notional_value,
                "orderState": str(item.get("orderState") or ""),
                "fillStatus": str(item.get("fillStatus") or ""),
                "reason": str(item.get("reason") or ""),
                "approvedBy": str(item.get("approvedBy") or "").strip() or None,
                "paperOnly": True,
                "liveExecutionBlocked": True,
            }
        )
    return normalized


def _normalize_ai_review_run_payloads(
    value: list[dict[str, Any]] | None,
    *,
    run_id: str | None = None,
) -> list[dict[str, Any]]:
    normalized = []
    expected_run_id = str(run_id or "").strip()
    for item in value or []:
        if not isinstance(item, dict):
            raise ValueError("ai_review_run_must_be_object")
        record = item.get("record")
        if not isinstance(record, dict):
            raise ValueError("ai_review_record_must_be_object")
        envelope_run_id = str(item.get("runId") or "").strip()
        record_run_id = str(record.get("runId") or "").strip()
        if expected_run_id and envelope_run_id != expected_run_id:
            raise ValueError("ai_review_run_id_mismatch")
        if expected_run_id and record_run_id != expected_run_id:
            raise ValueError("ai_review_record_run_id_mismatch")
        if envelope_run_id and record_run_id and envelope_run_id != record_run_id:
            raise ValueError("ai_review_record_run_id_mismatch")
        ai_review_id = str(item.get("aiReviewId") or "").strip()
        record_ai_review_id = str(record.get("aiReviewId") or "").strip()
        if not ai_review_id or not record_ai_review_id:
            raise ValueError("ai_review_id_is_required")
        if ai_review_id != record_ai_review_id:
            raise ValueError("ai_review_id_mismatch")
        created_at = str(item.get("createdAt") or record.get("createdAt") or "").strip()
        if not created_at:
            raise ValueError("ai_review_created_at_is_required")
        if int(_number_or_default(record.get("schemaVersion"), 0)) != 1:
            raise ValueError("ai_review_schema_version_must_be_1")
        if str(record.get("recordType") or "") != "aiqt.aiReviewRun":
            raise ValueError("ai_review_record_type_mismatch")
        if not str(record.get("boundary") or "").strip():
            raise ValueError("ai_review_boundary_is_required")
        normalized.append(
            {
                "aiReviewId": ai_review_id,
                "runId": envelope_run_id or record_run_id or expected_run_id,
                "createdAt": created_at,
                "record": dict(record),
            }
        )
    return normalized


def _normalize_promotion_candidate(value: dict[str, Any] | None, *, run_id: str) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        return None
    candidate_run_id = str(value.get("runId") or "")
    if candidate_run_id != run_id:
        return None
    return {
        "candidateId": str(value.get("candidateId") or f"promotion-{run_id}"),
        "runId": candidate_run_id,
        "createdAt": str(value.get("createdAt") or ""),
        "market": str(value.get("market") or ""),
        "symbol": str(value.get("symbol") or ""),
        "timeframe": str(value.get("timeframe") or ""),
        "strategyRevision": str(value.get("strategyRevision") or ""),
        "latestPaperExecutionId": value.get("latestPaperExecutionId"),
        "status": str(value.get("status") or "paper_pending"),
        "headline": str(value.get("headline") or ""),
        "summary": str(value.get("summary") or ""),
        "liveTradingAllowed": bool(value.get("liveTradingAllowed")),
        "evidence": _dict_or_empty(value.get("evidence")),
        "stages": _list_of_dicts(value.get("stages")),
    }


def _safe_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item) for item in value]


def _camel_to_snake(value: str) -> str:
    result = []
    for character in value:
        if character.isupper():
            result.append("_")
            result.append(character.lower())
        else:
            result.append(character)
    return "".join(result).lstrip("_")


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
