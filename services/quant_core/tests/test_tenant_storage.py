from __future__ import annotations

import base64
from datetime import datetime, timezone
import unittest

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool

from quant_core.public_identity import PublicIdentityStore
from quant_core.public_schema import create_public_schema
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_storage import (
    ProductionAccountClaimError,
    ProductionAccountClaimStore,
    TenantRecordStore,
    TenantSettingsStore,
)


UTC = timezone.utc


class TenantStorageTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        create_public_schema(self.engine)
        identities = PublicIdentityStore(self.engine)
        now = datetime(2026, 8, 3, 8, 0, tzinfo=UTC)
        self.owner_a = identities.register_login(
            issuer="https://identity.example.com",
            subject="a",
            email="a@example.com",
            email_verified=True,
            now=now,
        ).owner_id
        self.owner_b = identities.register_login(
            issuer="https://identity.example.com",
            subject="b",
            email="b@example.com",
            email_verified=True,
            now=now,
        ).owner_id
        self.cipher = TenantSecretCipher(base64.urlsafe_b64encode(b"m" * 32).decode())

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_same_business_id_is_isolated_and_owner_is_not_added_to_payload(self) -> None:
        records_a = TenantRecordStore(self.engine, self.owner_a)
        records_b = TenantRecordStore(self.engine, self.owner_b)
        records_a.put("research-run", "run-shared", {"runId": "run-shared", "hash": "same-hash"})
        records_b.put("research-run", "run-shared", {"runId": "run-shared", "hash": "same-hash"})

        self.assertEqual(records_a.get("research-run", "run-shared")["runId"], "run-shared")
        self.assertEqual(records_b.get("research-run", "run-shared")["runId"], "run-shared")
        self.assertNotIn("ownerId", records_a.get("research-run", "run-shared"))
        records_a.delete("research-run", "run-shared")
        self.assertIsNone(records_a.get("research-run", "run-shared"))
        self.assertIsNotNone(records_b.get("research-run", "run-shared"))

    def test_settings_are_encrypted_and_tenant_scoped(self) -> None:
        settings_a = TenantSettingsStore(self.engine, self.owner_a, self.cipher)
        settings_b = TenantSettingsStore(self.engine, self.owner_b, self.cipher)
        settings_a.set("OPENAI_COMPATIBLE_API_KEY", "secret-a")
        settings_b.set("OPENAI_COMPATIBLE_API_KEY", "secret-b")

        self.assertEqual(settings_a.get("OPENAI_COMPATIBLE_API_KEY"), "secret-a")
        self.assertEqual(settings_b.get("OPENAI_COMPATIBLE_API_KEY"), "secret-b")
        self.assertIsNone(settings_a.get("CCXT_PRODUCTION_TRADING_SECRET"))

    def test_batch_write_is_atomic_and_checks_the_fence_once(self) -> None:
        records = TenantRecordStore(self.engine, self.owner_a)
        fence_calls = 0

        def fence(_connection) -> bool:
            nonlocal fence_calls
            fence_calls += 1
            return fence_calls == 1

        records.write_fence = fence
        records.put_many(
            [
                ("audit_event", "event-a", {"value": "a"}),
                ("audit_event", "event-b", {"value": "b"}),
            ]
        )
        self.assertEqual(fence_calls, 1)
        self.assertEqual(records.get("audit_event", "event-b"), {"value": "b"})

        records.write_fence = None
        with self.assertRaises(IntegrityError):
            records.put_many(
                [
                    ("audit_event", "event-c", {"value": "c"}),
                    ("audit_event", None, {"value": "invalid"}),  # type: ignore[list-item]
                ]
            )
        self.assertIsNone(records.get("audit_event", "event-c"))

    def test_active_production_account_fingerprint_is_globally_unique(self) -> None:
        claims = ProductionAccountClaimStore(self.engine)
        claims.claim(self.owner_a, "binance:fingerprint-1")
        claims.claim(self.owner_a, "binance:fingerprint-1")

        with self.assertRaisesRegex(ProductionAccountClaimError, "production_account_already_claimed"):
            claims.claim(self.owner_b, "binance:fingerprint-1")

        claims.release(self.owner_a, "binance:fingerprint-1")
        claims.claim(self.owner_b, "binance:fingerprint-1")


if __name__ == "__main__":
    unittest.main()
