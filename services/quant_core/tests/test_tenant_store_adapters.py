from __future__ import annotations

import base64
from datetime import datetime, timezone
import unittest

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import create_engine

from quant_core.public_schema import public_metadata
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_store_adapters import PublicTenantStores
from quant_core.tenancy import TenantContext
from quant_core.terminal import Instrument


def context(owner_id: str, email: str) -> TenantContext:
    return TenantContext(
        owner_id=owner_id,
        issuer="https://issuer.example",
        subject=owner_id,
        email=email,
        reauthenticated_at=datetime.now(timezone.utc),
    )


class TenantStoreAdaptersTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
        public_metadata.create_all(self.engine)
        key = base64.urlsafe_b64encode(AESGCM.generate_key(bit_length=256)).decode()
        cipher = TenantSecretCipher(key)
        self.first = PublicTenantStores.create(
            self.engine,
            context("owner-a", "a@example.com"),
            cipher,
        )
        self.second = PublicTenantStores.create(
            self.engine,
            context("owner-b", "b@example.com"),
            cipher,
        )

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_same_business_ids_are_isolated_across_all_adapters(self) -> None:
        event = {
            "schemaVersion": 1,
            "eventId": "shared-event",
            "eventType": "research",
            "runId": None,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "stage": "research",
            "source": "test",
            "summary": "first",
            "detail": "detail",
            "metadata": {},
        }
        self.first.audit_event_store.record(event)
        self.second.audit_event_store.record({**event, "summary": "second"})
        self.first.watchlist_store.replace_all(
            [Instrument("600000", "浦发银行", "ashare", 0.0)]
        )

        self.assertEqual(
            self.first.audit_event_store.get("shared-event").summary,
            "first",
        )
        self.assertEqual(
            self.second.audit_event_store.get("shared-event").summary,
            "second",
        )
        self.assertEqual(self.first.watchlist_store.list_instruments()[0].symbol, "600000")
        self.assertEqual(self.second.watchlist_store.list_instruments(), [])

    def test_platform_secrets_are_tenant_scoped_and_not_seeded_from_server_env(self) -> None:
        configuration = {
            "ccxtDefaultExchange": "binance",
            "ccxtTimeout": 10000,
            "autoTradingIntervalSeconds": 35,
            "productionTradingEnabled": False,
            "liveSessionTtlHours": 8,
            "openaiModel": "",
            "openaiCompatibleBaseUrl": "",
            "openaiCompatibleModel": "",
            "ollamaBaseUrl": "http://127.0.0.1:11434",
            "ollamaModel": "",
            "secEdgarUserAgent": "AIQT test@example.com",
            "monitoringWebhookTimeoutSeconds": 5,
            "freeStockdbTimeoutSeconds": 3,
        }
        self.first.platform_settings_store.save(
            configuration,
            {"openaiApiKey": "tenant-a-secret"},
            [],
            {"OPENAI_API_KEY": "server-secret"},
        )

        self.assertEqual(
            self.first.platform_settings_store.effective_environment({}).get(
                "OPENAI_API_KEY"
            ),
            "tenant-a-secret",
        )
        self.assertNotIn(
            "OPENAI_API_KEY",
            self.second.platform_settings_store.effective_environment({}),
        )

    def test_audit_event_batch_uses_one_fenced_transaction(self) -> None:
        fence_calls = 0

        def fence(_connection) -> bool:
            nonlocal fence_calls
            fence_calls += 1
            return fence_calls == 1

        self.first.records.write_fence = fence
        now = datetime.now(timezone.utc).isoformat()
        events = [
            {
                "schemaVersion": 1,
                "eventId": f"batch-{suffix}",
                "eventType": "research",
                "runId": None,
                "createdAt": now,
                "stage": "research",
                "source": "test",
                "summary": suffix,
                "detail": suffix,
                "metadata": {},
            }
            for suffix in ("a", "b")
        ]

        self.first.audit_event_store.record_many(events)

        self.assertEqual(fence_calls, 1)
        self.assertIsNotNone(self.first.audit_event_store.get("batch-a"))
        self.assertIsNotNone(self.first.audit_event_store.get("batch-b"))


if __name__ == "__main__":
    unittest.main()
