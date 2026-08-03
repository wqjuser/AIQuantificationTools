from __future__ import annotations

from pathlib import Path
import base64
import json
import tempfile
import unittest
from unittest.mock import patch

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.pool import StaticPool

from quant_core.audit_events import AuditEventStore
from quant_core.public_migration import LocalDataMigrator
from quant_core.public_schema import (
    public_metadata,
    public_users,
    tenant_records,
    tenant_settings,
)
from quant_core.public_schema import create_public_schema
from quant_core.public_api import _require_public_schema
from quant_core.settings import PlatformSettingsStore
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_model_codec import decode_tenant_model
from quant_core.tenant_storage import TenantRecordStore


class PublicMigrationTest(unittest.TestCase):
    def test_initial_migration_creates_current_schema_and_is_repeatable(self) -> None:
        core_root = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as tmp:
            database_url = f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}"
            config = Config(str(core_root / "alembic.ini"))
            config.set_main_option("sqlalchemy.url", database_url)

            command.upgrade(config, "head")
            command.upgrade(config, "head")

            engine = create_engine(database_url)
            try:
                tables = set(inspect(engine).get_table_names())
                _require_public_schema(engine)
            finally:
                engine.dispose()

        self.assertTrue(set(public_metadata.tables).issubset(tables))
        self.assertIn("alembic_version", tables)

    def test_local_migration_is_backed_up_atomic_and_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = root / "data"
            source = AuditEventStore(data / "audit_events.sqlite")
            source.record(
                {
                    "schemaVersion": 1,
                    "eventId": "event-1",
                    "eventType": "research_note",
                    "runId": "run-1",
                    "createdAt": "2026-08-03T08:00:00+00:00",
                    "stage": "research",
                    "source": "test",
                    "summary": "Research event",
                    "detail": "Portable evidence",
                    "metadata": {"paperOnly": True},
                }
            )
            (data / "p0-acceptance.json").write_text('{"status":"passed"}', encoding="utf-8")
            engine = create_engine(
                "sqlite+pysqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            create_public_schema(engine)
            key = base64.urlsafe_b64encode(b"m" * 32).decode()
            migrator = LocalDataMigrator(
                engine,
                TenantSecretCipher(key),
                data,
                issuer="https://identity.example.com",
                subject="owner",
                email="owner@example.com",
            )

            before = (data / "audit_events.sqlite").stat().st_mtime_ns
            dry_run = migrator.dry_run()
            applied = migrator.apply(backup_root=root / "backups")
            repeated = migrator.apply(backup_root=root / "backups")
            record = TenantRecordStore(engine, applied["ownerId"]).get("audit_event", "event-1")

            self.assertEqual((data / "audit_events.sqlite").stat().st_mtime_ns, before)
            self.assertEqual(dry_run["recordCount"], 2)
            self.assertTrue(Path(applied["backupPath"]).joinpath("audit_events.sqlite").is_file())
            self.assertTrue(repeated["alreadyApplied"])
            self.assertEqual(decode_tenant_model(record["model"]).event_id, "event-1")
            engine.dispose()

    def test_active_live_state_blocks_migration(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp) / "data"
            source = AuditEventStore(data / "audit_events.sqlite")
            source.record(
                {
                    "schemaVersion": 1,
                    "eventId": "auto-paper-trading-current-state",
                    "eventType": "auto_paper_trading_state",
                    "runId": None,
                    "createdAt": "2026-08-03T08:00:00+00:00",
                    "stage": "auto-paper-trading",
                    "source": "test",
                    "summary": "Live session",
                    "detail": "Active",
                    "metadata": {
                        "state": {
                            "executionMode": "live",
                            "enabled": True,
                            "lastLiveOrder": {"state": "open"},
                        }
                    },
                }
            )
            source.record(
                {
                    "schemaVersion": 1,
                    "eventId": "stage10-order-open",
                    "eventType": "stage10_auto_live_order_transition",
                    "runId": None,
                    "createdAt": "2026-08-03T08:01:00+00:00",
                    "stage": "stage10-auto-live-order-transition",
                    "source": "owner@example.com",
                    "summary": "open production order",
                    "detail": "requires reconciliation",
                    "metadata": {
                        "order": {"clientOrderId": "pending-order"},
                        "evidence": {"state": "open", "operation": "query"},
                    },
                }
            )
            engine = create_engine(
                "sqlite+pysqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            create_public_schema(engine)
            key = base64.urlsafe_b64encode(b"m" * 32).decode()
            migrator = LocalDataMigrator(
                engine,
                TenantSecretCipher(key),
                data,
                issuer="https://identity.example.com",
                subject="owner",
                email="owner@example.com",
            )

            self.assertEqual(
                migrator.dry_run()["blockers"],
                ["active_live_session", "unresolved_order_reconciliation"],
            )
            with self.assertRaisesRegex(ValueError, "public_migration_blocked"):
                migrator.apply()
            engine.dispose()

    def test_failed_readback_rolls_back_the_public_transaction(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = root / "data"
            source = AuditEventStore(data / "audit_events.sqlite")
            source.record(
                {
                    "schemaVersion": 1,
                    "eventId": "event-rollback",
                    "eventType": "research_note",
                    "runId": "run-rollback",
                    "createdAt": "2026-08-03T08:00:00+00:00",
                    "stage": "research",
                    "source": "test",
                    "summary": "rollback",
                    "detail": "rollback",
                    "metadata": {},
                }
            )
            engine = create_engine(
                "sqlite+pysqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            create_public_schema(engine)
            migrator = LocalDataMigrator(
                engine,
                TenantSecretCipher(base64.urlsafe_b64encode(b"m" * 32).decode()),
                data,
                issuer="https://identity.example.com",
                subject="owner",
                email="owner@example.com",
            )

            with patch(
                "quant_core.public_migration.decode_tenant_model",
                side_effect=ValueError("invalid migrated model"),
            ), self.assertRaisesRegex(ValueError, "invalid migrated model"):
                migrator.apply(backup_root=root / "backups")
            with engine.connect() as connection:
                self.assertEqual(connection.execute(select(public_users)).all(), [])
            engine.dispose()

    def test_manifest_and_encrypted_settings_are_verified_on_readback(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = root / "data"
            settings = PlatformSettingsStore(
                data / "platform_settings.sqlite",
                data / "platform-settings.key",
            )
            configuration = settings.configuration_payload({})["values"]
            settings.save(configuration, {"openaiApiKey": "local-secret"}, [], {})
            engine = create_engine(
                "sqlite+pysqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            create_public_schema(engine)
            cipher = TenantSecretCipher(base64.urlsafe_b64encode(b"m" * 32).decode())
            migrator = LocalDataMigrator(
                engine,
                cipher,
                data,
                issuer="https://identity.example.com",
                subject="owner",
                email="owner@example.com",
            )

            applied = migrator.apply(backup_root=root / "backups")
            with engine.connect() as connection:
                manifest = connection.execute(
                    select(tenant_records).where(
                        tenant_records.c.owner_id == applied["ownerId"],
                        tenant_records.c.record_kind == "migration_manifest",
                    )
                ).mappings().one()
                setting = connection.execute(
                    select(tenant_settings).where(
                        tenant_settings.c.owner_id == applied["ownerId"],
                        tenant_settings.c.setting_name == "platform-settings",
                    )
                ).mappings().one()

            self.assertEqual(
                manifest["payload"]["model"]["sourceDigest"],
                applied["sourceDigest"],
            )
            self.assertEqual(
                cipher.decrypt(
                    applied["ownerId"],
                    "platform-settings",
                    setting["encrypted_value"],
                    key_version=setting["key_version"],
                ),
                migrator.inventory().setting,
            )
            engine.dispose()

    def test_public_master_key_does_not_override_default_local_settings_key(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp) / "data"
            settings = PlatformSettingsStore(
                data / "platform_settings.sqlite",
                data / "platform-settings.key",
            )
            configuration = settings.configuration_payload({})["values"]
            settings.save(configuration, {"openaiApiKey": "local-secret"}, [], {})
            engine = create_engine(
                "sqlite+pysqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            create_public_schema(engine)
            public_key = base64.urlsafe_b64encode(b"p" * 32).decode()
            migrator = LocalDataMigrator(
                engine,
                TenantSecretCipher(public_key),
                data,
                issuer="https://identity.example.com",
                subject="owner",
                email="owner@example.com",
                source_environment={"AIQT_SETTINGS_MASTER_KEY": public_key},
            )

            setting = migrator.inventory().setting

            self.assertIsNotNone(setting)
            self.assertEqual(json.loads(setting)["secretValues"]["OPENAI_API_KEY"], "local-secret")
            engine.dispose()

    def test_stage6_pending_order_blocks_migration(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            data = Path(tmp) / "data"
            AuditEventStore(data / "audit_events.sqlite").record(
                {
                    "schemaVersion": 1,
                    "eventId": "stage6-order-pending",
                    "eventType": "stage6_sandbox_order_transition",
                    "runId": None,
                    "createdAt": "2026-08-03T08:00:00+00:00",
                    "stage": "stage6-sandbox-order-transition",
                    "source": "owner@example.com",
                    "summary": "pending sandbox order",
                    "detail": "requires reconciliation",
                    "metadata": {"evidence": {"state": "submission_pending"}},
                }
            )
            engine = create_engine(
                "sqlite+pysqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            create_public_schema(engine)
            migrator = LocalDataMigrator(
                engine,
                TenantSecretCipher(base64.urlsafe_b64encode(b"m" * 32).decode()),
                data,
                issuer="https://identity.example.com",
                subject="owner",
                email="owner@example.com",
            )

            self.assertEqual(
                migrator.dry_run()["blockers"],
                ["unresolved_order_reconciliation"],
            )
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
