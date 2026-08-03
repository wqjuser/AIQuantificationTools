from __future__ import annotations

from dataclasses import dataclass, replace
from contextlib import closing
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import sqlite3
from typing import Any, Iterable, Mapping
from urllib.parse import quote
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.engine import Connection, Engine

from quant_core.adapter_error_ledger import _market_data_adapter_error_event_from_row
from quant_core.ai_review_decisions import _row_to_decision
from quant_core.ai_review_runs import _row_to_ai_review_run_record
from quant_core.audit_events import AuditEventRecord, _row_to_audit_event_record
from quant_core.cache_refresh_runs import _watchlist_cache_refresh_run_from_row
from quant_core.canonical import canonical_sha256
from quant_core.execution_core.certification_store import _row_to_execution_adapter_certification
from quant_core.execution_core.paper_store import _row_to_paper_execution
from quant_core.execution_core.portfolio_stores import (
    _row_to_portfolio_paper_order_approval,
    _row_to_portfolio_paper_order_batch,
    _row_to_portfolio_paper_order_simulation,
)
from quant_core.handoff_notes import _row_to_handoff_note
from quant_core.public_schema import public_users, tenant_records, tenant_settings
from quant_core.research_import_undo import _row_to_import_undo_record
from quant_core.research_notes import ResearchNote
from quant_core.runs import _row_to_research_run_audit
from quant_core.settings import PlatformSettingsStore
from quant_core.strategy_experiment_store import (
    StrategyExperimentDetail,
    _row_to_candidate,
    _row_to_experiment,
    _row_to_snapshot,
)
from quant_core.strategy_library import _row_to_record
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_model_codec import decode_tenant_model, encode_tenant_model
from quant_core.terminal import Instrument
from quant_core.workspace_state import ResearchWorkspaceState


_UNRESOLVED_ORDER_STATES = {
    "submission_pending",
    "open",
    "partially_filled",
    "unknown",
    "reconciliation_required",
}
_ARTIFACT_NAMES = {
    "p0-acceptance.json": "p0_acceptance_report_path",
    "p1-acceptance.json": "p1_acceptance_report_path",
    "p2-pre-live-acceptance.json": "p2_pre_live_acceptance_report_path",
    "p2-paper-replay.json": "p2_paper_replay_report_path",
    "p2-readiness-acceptance.json": "p2_readiness_acceptance_report_path",
    "p2-chain-preflight.json": "p2_manifest_chain_preflight_report_path",
    "stage5-exit-acceptance.json": "stage5_exit_acceptance_report_path",
    "stage6-exit-acceptance.json": "stage6_exit_acceptance_report_path",
    "desktop-release.json": "desktop_release_report_path",
    "stage1-daily-use.json": "stage1_daily_use_report_path",
    "stage1-bootstrap-preflight.json": "stage1_bootstrap_preflight_report_path",
}


@dataclass(frozen=True)
class MigrationRecord:
    kind: str
    record_id: str
    payload: dict[str, Any]
    canonical_hash: str


@dataclass(frozen=True)
class MigrationPlan:
    owner_id: str
    records: tuple[MigrationRecord, ...]
    setting: str | None
    blockers: tuple[str, ...]
    source_digest: str

    def summary(self) -> dict[str, Any]:
        counts: dict[str, int] = {}
        for record in self.records:
            counts[record.kind] = counts.get(record.kind, 0) + 1
        return {
            "ownerId": self.owner_id,
            "sourceDigest": self.source_digest,
            "recordCount": len(self.records),
            "counts": counts,
            "settingsIncluded": self.setting is not None,
            "blockers": list(self.blockers),
        }


class LocalDataMigrator:
    def __init__(
        self,
        engine: Engine,
        cipher: TenantSecretCipher,
        data_dir: str | Path,
        *,
        issuer: str,
        subject: str,
        email: str,
        source_environment: Mapping[str, str] | None = None,
    ) -> None:
        self.engine = engine
        self.cipher = cipher
        self.data_dir = Path(data_dir).resolve()
        self.issuer = issuer.rstrip("/")
        self.subject = subject.strip()
        self.email = email.strip().lower()
        self.source_environment = dict(source_environment or {})
        source_master_key = self.source_environment.pop(
            "AIQT_SOURCE_SETTINGS_MASTER_KEY",
            "",
        ).strip()
        self.source_environment.pop("AIQT_SETTINGS_MASTER_KEY", None)
        if source_master_key:
            self.source_environment["AIQT_SETTINGS_MASTER_KEY"] = source_master_key
        if not self.issuer or not self.subject or "@" not in self.email:
            raise ValueError("public_migration_identity_invalid")

    def inventory(self) -> MigrationPlan:
        records = list(_collect_records(self.data_dir))
        setting = _read_platform_setting(self.data_dir, self.source_environment)
        blockers = tuple(_migration_blockers(records))
        owner_id = self._existing_owner_id() or str(
            uuid5(NAMESPACE_URL, f"{self.issuer}\0{self.subject}")
        )
        digest = canonical_sha256(
            {
                "records": [
                    [record.kind, record.record_id, record.canonical_hash]
                    for record in records
                ],
                "setting": canonical_sha256(setting) if setting is not None else None,
            }
        )
        return MigrationPlan(owner_id, tuple(records), setting, blockers, digest)

    def dry_run(self) -> dict[str, Any]:
        return {"mode": "dry-run", **self.inventory().summary()}

    def apply(self, *, backup_root: str | Path | None = None) -> dict[str, Any]:
        plan = self.inventory()
        if plan.blockers:
            raise ValueError(f"public_migration_blocked:{','.join(plan.blockers)}")
        existing = self._migration_digest(plan.owner_id)
        if existing is not None:
            if existing != plan.source_digest:
                raise ValueError("public_migration_source_changed")
            self._verify(plan)
            return {"mode": "apply", "alreadyApplied": True, **plan.summary()}
        if self._tenant_has_records(plan.owner_id):
            raise ValueError("public_migration_target_not_empty")
        backup = self._backup(backup_root)
        now = datetime.now(timezone.utc)
        insert_factory = (
            postgresql_insert
            if self.engine.dialect.name == "postgresql"
            else sqlite_insert
        )
        manifest = _record(
            "migration_manifest",
            "local-data-v1",
            {"sourceDigest": plan.source_digest, "migratedAt": now.isoformat()},
        )
        with self.engine.begin() as connection:
            connection.execute(
                insert_factory(public_users)
                .values(
                    owner_id=plan.owner_id,
                    issuer=self.issuer,
                    subject=self.subject,
                    email=self.email,
                    status="active",
                    created_at=now,
                    updated_at=now,
                )
                .on_conflict_do_nothing(index_elements=["issuer", "subject"])
            )
            user = connection.execute(
                select(public_users).where(
                    public_users.c.issuer == self.issuer,
                    public_users.c.subject == self.subject,
                )
            ).mappings().one()
            if user["owner_id"] != plan.owner_id or user["status"] != "active":
                raise ValueError("public_migration_identity_conflict")
            for item in (*plan.records, manifest):
                connection.execute(
                    insert_factory(tenant_records)
                    .values(
                        owner_id=plan.owner_id,
                        record_kind=item.kind,
                        record_id=item.record_id,
                        payload=item.payload,
                        canonical_hash=item.canonical_hash,
                        created_at=now,
                        updated_at=now,
                    )
                    .on_conflict_do_update(
                        index_elements=["owner_id", "record_kind", "record_id"],
                        set_={
                            "payload": item.payload,
                            "canonical_hash": item.canonical_hash,
                            "updated_at": now,
                        },
                    )
                )
            if plan.setting is not None:
                encrypted = self.cipher.encrypt(
                    plan.owner_id,
                    "platform-settings",
                    plan.setting,
                    key_version=1,
                )
                connection.execute(
                    insert_factory(tenant_settings)
                    .values(
                        owner_id=plan.owner_id,
                        setting_name="platform-settings",
                        key_version=1,
                        encrypted_value=encrypted,
                        updated_at=now,
                    )
                    .on_conflict_do_update(
                        index_elements=["owner_id", "setting_name"],
                        set_={
                            "key_version": 1,
                            "encrypted_value": encrypted,
                            "updated_at": now,
                        },
                    )
                )
            self._verify(plan, connection)
        return {
            "mode": "apply",
            "alreadyApplied": False,
            "backupPath": str(backup),
            **plan.summary(),
        }

    def _existing_owner_id(self) -> str | None:
        with self.engine.connect() as connection:
            return connection.execute(
                select(public_users.c.owner_id).where(
                    public_users.c.issuer == self.issuer,
                    public_users.c.subject == self.subject,
                )
            ).scalar_one_or_none()

    def _migration_digest(self, owner_id: str) -> str | None:
        with self.engine.connect() as connection:
            payload = connection.execute(
                select(tenant_records.c.payload).where(
                    tenant_records.c.owner_id == owner_id,
                    tenant_records.c.record_kind == "migration_manifest",
                    tenant_records.c.record_id == "local-data-v1",
                )
            ).scalar_one_or_none()
        return str(payload.get("model", {}).get("sourceDigest") or "") if payload else None

    def _tenant_has_records(self, owner_id: str) -> bool:
        with self.engine.connect() as connection:
            return connection.execute(
                select(tenant_records.c.record_id)
                .where(tenant_records.c.owner_id == owner_id)
                .limit(1)
            ).first() is not None

    def _verify(self, plan: MigrationPlan, connection: Connection | None = None) -> None:
        if connection is None:
            with self.engine.connect() as opened:
                self._verify(plan, opened)
            return
        expected = {(item.kind, item.record_id): item for item in plan.records}
        rows = connection.execute(
            select(
                tenant_records.c.record_kind,
                tenant_records.c.record_id,
                tenant_records.c.payload,
                tenant_records.c.canonical_hash,
            ).where(
                tenant_records.c.owner_id == plan.owner_id,
                tenant_records.c.record_kind != "migration_manifest",
            )
        ).mappings()
        actual = {(row["record_kind"], row["record_id"]): row for row in rows}
        if set(actual) != set(expected):
            raise ValueError("public_migration_record_count_mismatch")
        for key, item in expected.items():
            row = actual[key]
            if row["canonical_hash"] != item.canonical_hash or canonical_sha256(row["payload"]) != item.canonical_hash:
                raise ValueError("public_migration_hash_mismatch")
            decode_tenant_model(row["payload"]["model"])
        manifests = connection.execute(
            select(
                tenant_records.c.record_id,
                tenant_records.c.payload,
                tenant_records.c.canonical_hash,
            ).where(
                tenant_records.c.owner_id == plan.owner_id,
                tenant_records.c.record_kind == "migration_manifest",
            )
        ).mappings().all()
        if (
            len(manifests) != 1
            or manifests[0]["record_id"] != "local-data-v1"
            or manifests[0]["canonical_hash"]
            != canonical_sha256(manifests[0]["payload"])
            or decode_tenant_model(manifests[0]["payload"].get("model", {})).get(
                "sourceDigest"
            )
            != plan.source_digest
        ):
            raise ValueError("public_migration_manifest_mismatch")
        setting = connection.execute(
            select(
                tenant_settings.c.key_version,
                tenant_settings.c.encrypted_value,
            ).where(
                tenant_settings.c.owner_id == plan.owner_id,
                tenant_settings.c.setting_name == "platform-settings",
            )
        ).mappings().one_or_none()
        if plan.setting is None:
            if setting is not None:
                raise ValueError("public_migration_settings_mismatch")
        elif (
            setting is None
            or setting["key_version"] != 1
            or self.cipher.decrypt(
                plan.owner_id,
                "platform-settings",
                setting["encrypted_value"],
                key_version=setting["key_version"],
            )
            != plan.setting
        ):
            raise ValueError("public_migration_settings_mismatch")

    def _backup(self, backup_root: str | Path | None) -> Path:
        root = (
            Path(backup_root).resolve()
            if backup_root is not None
            else self.data_dir.parent / "data-backups"
        )
        if root == self.data_dir or self.data_dir in root.parents:
            raise ValueError("public_migration_backup_must_be_outside_data")
        root.mkdir(parents=True, exist_ok=True)
        target = root / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        shutil.copytree(self.data_dir, target)
        return target


def _collect_records(data_dir: Path) -> Iterable[MigrationRecord]:
    for row in _rows(data_dir / "research_runs.sqlite", "select run_id, created_at, market, symbol, timeframe, strategy_name, strategy_revision, data_rows, metrics_json, decisions_json, execution_mode, ai_report_json, data_quality_json, data_snapshot_json, strategy_config_json, backtest_assumptions_json, backtest_trades_json, backtest_equity_curve_json, backtest_diagnostics_json, research_note_json from research_runs"):
        value = _row_to_research_run_audit(row)
        if len(row) > 19:
            value = replace(value, research_note=json.loads(row[19]))
        yield _record("research_run", value.run_id, value)
    for row in _rows(data_dir / "audit_events.sqlite", "select event_id, event_type, run_id, created_at, stage, source, summary, detail, metadata_json from audit_events"):
        value = _row_to_audit_event_record(row)
        if _historical_production_event(value):
            original = value
            value = AuditEventRecord(
                event_id=f"public-migration-history-{original.event_id}",
                event_type="public_migration_historical_production_event",
                run_id=original.run_id,
                created_at=original.created_at,
                stage="public-migration",
                source="local-migration",
                summary=f"历史生产证据：{original.summary}",
                detail="该记录仅供审计，不恢复生产授权、控制或委托。",
                metadata={"originalEvent": encode_tenant_model(original), "historicalOnly": True},
            )
        yield _record("audit_event", value.event_id, value)
    watchlist = [
        Instrument(
            symbol=str(row[1]),
            name=str(row[2]),
            market=str(row[0]),
            change_pct=float(row[4]),
            price=float(row[5]) if row[5] is not None else None,
            quote_source=str(row[6]) if row[6] else None,
            quote_as_of=_datetime(row[7]),
        )
        for row in _rows(data_dir / "watchlist.sqlite", "select market, symbol, name, position, change_pct, price, quote_source, quote_as_of from watchlist order by position")
    ]
    if watchlist:
        yield _record("watchlist", "current", watchlist)
    for row in _rows(data_dir / "research_workspace_state.sqlite", "select market, symbol, name, timeframe, workspace_id, updated_at from research_workspace_state where id = 1"):
        yield _record("research_workspace_state", "current", ResearchWorkspaceState(str(row[0]), str(row[1]), str(row[2]), str(row[3]), str(row[4]), _datetime(row[5]) or datetime.now(timezone.utc)))
    for row in _rows(data_dir / "research_notes.sqlite", "select market, symbol, timeframe, body, updated_at from research_notes"):
        value = ResearchNote(str(row[0]), str(row[1]), str(row[2]), str(row[3]), _datetime(row[4]))
        yield _record("research_note", f"{value.market}\x1f{value.symbol}\x1f{value.timeframe}", value)
    for row in _rows(data_dir / "handoff_notes.sqlite", "select note_id, subject_type, subject_id, body, author, source_workspace, updated_at, audit_event_id from handoff_notes"):
        value = _row_to_handoff_note(row)
        yield _record("handoff_note", value.note_id, value)
    for row in _rows(data_dir / "strategies.sqlite", "select revision, created_at, name, market, symbol, timeframe, version, status, audit_run_id, strategy_config_json from strategy_versions"):
        value = _row_to_record(row)
        yield _record("strategy", value.revision, value)
    for row in _rows(data_dir / "ai_review_runs.sqlite", "select ai_review_id, run_id, created_at, record_json, schema_version, primary_experiment_id, evidence_hash, record_hash, authority from ai_review_runs"):
        value = _row_to_ai_review_run_record(row)
        yield _record("ai_review_run", value.ai_review_id, value)
    for row in _rows(data_dir / "ai_review_runs.sqlite", "select rowid, decision_id, ai_review_id, created_at, supersedes_decision_id, review_record_hash, evidence_hash, record_json from ai_review_decisions"):
        value = _row_to_decision(row)
        yield _record("ai_review_decision", value.decision_id, value)
    for row in _rows(data_dir / "research_import_undo.sqlite", "select undo_token, run_id, created_at, consumed_at, snapshot_json from research_import_undo"):
        value = _row_to_import_undo_record(row)
        yield _record("research_import_undo", value.undo_token, value)
    yield from _experiment_records(data_dir / "strategy_experiments.sqlite")
    yield from _execution_records(data_dir)
    for row in _rows(data_dir / "watchlist_cache_refreshes.sqlite", "select run_id, created_at, timeframe, requested_limit, summary_json, items_json, override_audit_event_id from watchlist_cache_refresh_runs"):
        value = _watchlist_cache_refresh_run_from_row(row)
        yield _record("watchlist_cache_refresh", value.run_id, value)
    for row in _rows(data_dir / "adapter_errors.sqlite", "select event_id, created_at, adapter_id, provider, market, symbol, timeframe, source, context, message from market_data_adapter_errors"):
        value = _market_data_adapter_error_event_from_row(row)
        yield _record("market_data_adapter_error", value.event_id, value)
    for path in sorted(data_dir.glob("*.json")):
        yield _record("acceptance_artifact", _ARTIFACT_NAMES.get(path.name, path.name), path.read_text(encoding="utf-8"))


def _experiment_records(path: Path) -> Iterable[MigrationRecord]:
    snapshots = {str(row[0]): _row_to_snapshot(row) for row in _rows(path, "select snapshot_id, created_at, market, symbol, timeframe, canonical_data_hash, rows, start_at, end_at, bars_json, test_definition_hash, test_owner_experiment_id, test_consumed_at from strategy_experiment_snapshots")}
    for snapshot in snapshots.values():
        yield _record("strategy_experiment_snapshot", snapshot.snapshot_id, snapshot)
    candidates: dict[str, list[Any]] = {}
    for row in _rows(path, "select experiment_id, candidate_id, candidate_revision, parameters_json, train_metrics_json, validation_metrics_json, test_metrics_json, walk_forward_json, eligible, rank from strategy_experiment_candidates"):
        value = _row_to_candidate(row)
        candidates.setdefault(value.experiment_id, []).append(value)
    for row in _rows(path, "select experiment_id, created_at, status, definition_hash, holdout_key, strategy_revision, source_run_id, snapshot_id, market, symbol, timeframe, definition_json, evaluation_count, selected_candidate_id, completion_reason, result_hash, error_code, error_detail from strategy_experiments"):
        experiment = _row_to_experiment(row)
        snapshot = snapshots[experiment.snapshot_id]
        yield _record("strategy_experiment", experiment.experiment_id, StrategyExperimentDetail(experiment, snapshot, candidates.get(experiment.experiment_id, [])))


def _execution_records(data_dir: Path) -> Iterable[MigrationRecord]:
    specifications = (
        ("paper_executions.sqlite", "paper_execution", "select execution_id, run_id, created_at, mode, account_json, orders_json, gates_json, preparation_evidence_json from paper_executions", _row_to_paper_execution, 0),
        ("portfolio_paper_orders.sqlite", "portfolio_paper_order_batch", "select batch_id, base_run_id, created_at, portfolio_name, mode, source, orders_json, summary_json from portfolio_paper_order_batches", _row_to_portfolio_paper_order_batch, 0),
        ("portfolio_paper_order_approvals.sqlite", "portfolio_paper_order_approval", "select approval_id, base_run_id, batch_id, order_id, reviewed_at, approved, reviewer, reason from portfolio_paper_order_approvals", _row_to_portfolio_paper_order_approval, 0),
        ("portfolio_paper_order_simulations.sqlite", "portfolio_paper_order_simulation", "select simulation_id, base_run_id, batch_id, order_id, simulated_at, mode, symbol, source_run_id, side, quantity, fill_price, notional_value, order_state, fill_status, reason, approved_by, route_risk_json, adapter_paper_execution_id, adapter_manifest_validation_id, adapter_paper_execution_evidence_json from portfolio_paper_order_simulations", _row_to_portfolio_paper_order_simulation, 0),
        ("execution_adapter_certifications.sqlite", "execution_adapter_certification", "select certification_id, adapter_id, market, route, status, operator, started_at, completed_at, live_trading_allowed, checks_json, metadata_json, summary_json from execution_adapter_certifications", _row_to_execution_adapter_certification, 0),
    )
    for filename, kind, query, convert, id_index in specifications:
        for row in _rows(data_dir / filename, query):
            yield _record(kind, str(row[id_index]), convert(row))


def _read_platform_setting(data_dir: Path, environment: Mapping[str, str]) -> str | None:
    rows = _rows(data_dir / "platform_settings.sqlite", "select revision, public_json, secret_blob, updated_at from platform_settings where id = 1")
    if not rows:
        return None
    row = rows[0]
    store = PlatformSettingsStore(data_dir / "platform_settings.sqlite", data_dir / "platform-settings.key")
    public_values = json.loads(str(row[1]))
    secret_values = json.loads(store._decrypt(bytes(row[2]), environment))
    public_values["AIQT_ENABLE_PRODUCTION_TRADING"] = "false"
    public_values["OPENAI_COMPATIBLE_BASE_URL"] = ""
    public_values["OLLAMA_BASE_URL"] = str(environment.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434"))
    for key in (
        "CCXT_PRODUCTION_READONLY_API_KEY",
        "CCXT_PRODUCTION_READONLY_SECRET",
        "CCXT_PRODUCTION_TRADING_API_KEY",
        "CCXT_PRODUCTION_TRADING_SECRET",
        "OPENAI_COMPATIBLE_API_KEY",
        "AIQT_MONITORING_WEBHOOK_URL",
        "AIQT_FREE_STOCKDB_URL",
        "HTTPS_PROXY",
    ):
        secret_values[key] = ""
    return json.dumps(
        {
            "revision": int(row[0]),
            "publicValues": public_values,
            "secretValues": secret_values,
            "updatedAt": str(row[3]),
        },
        ensure_ascii=False,
        sort_keys=True,
    )


def _migration_blockers(records: Iterable[MigrationRecord]) -> list[str]:
    blockers = set()
    for item in records:
        if item.kind != "audit_event":
            continue
        event = decode_tenant_model(item.payload["model"])
        original = event.metadata.get("originalEvent") if isinstance(event.metadata, dict) else None
        if isinstance(original, dict):
            original = decode_tenant_model(original)
        inspected = original if isinstance(original, AuditEventRecord) else event
        if inspected.event_type == "stage10_production_execution_control":
            snapshot = inspected.metadata.get("snapshot", {})
            if isinstance(snapshot, dict) and snapshot.get("status") == "active":
                blockers.add("active_production_control")
        if inspected.event_type in {
            "stage6_sandbox_order_transition",
            "stage10_auto_live_order_transition",
        }:
            evidence = inspected.metadata.get("evidence", {})
            if (
                isinstance(evidence, dict)
                and evidence.get("state") in _UNRESOLVED_ORDER_STATES
            ):
                blockers.add("unresolved_order_reconciliation")
        if inspected.event_id == "auto-paper-trading-current-state":
            state = inspected.metadata.get("state", {})
            if isinstance(state, dict):
                if state.get("executionMode") == "live" and state.get("enabled") is True:
                    blockers.add("active_live_session")
                for key in ("lastLiveOrder", "lastTestnetOrder"):
                    order = state.get(key)
                    if isinstance(order, dict) and order.get("state") in _UNRESOLVED_ORDER_STATES:
                        blockers.add("unresolved_order_reconciliation")
    return sorted(blockers)


def _historical_production_event(event: AuditEventRecord) -> bool:
    return event.event_type.startswith("stage10_") or event.event_type.startswith("auto_live_")


def _record(kind: str, record_id: str, value: Any) -> MigrationRecord:
    payload = {"model": encode_tenant_model(value)}
    return MigrationRecord(kind, record_id, payload, canonical_sha256(payload))


def _rows(path: Path, query: str) -> list[tuple[Any, ...]]:
    if not path.is_file():
        return []
    uri = f"file:{quote(str(path))}?mode=ro"
    try:
        with closing(sqlite3.connect(uri, uri=True)) as connection:
            return connection.execute(query).fetchall()
    except sqlite3.OperationalError as error:
        if "no such table" in str(error):
            return []
        raise


def _datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    parsed = datetime.fromisoformat(str(value))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
