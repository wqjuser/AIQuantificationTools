from __future__ import annotations

import base64
from datetime import datetime, timezone
import os
import unittest
from uuid import uuid4

from sqlalchemy import create_engine, delete
from starlette.testclient import TestClient

from quant_core.deployment import load_deployment_config
from quant_core.public_api import create_public_app
from quant_core.public_auth import OidcIdentity, PublicAuthService
from quant_core.public_identity import PublicIdentityStore
from quant_core.public_schema import public_users
from quant_core.public_tenant_api import PublicTenantApi
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_storage import (
    ProductionAccountClaimStore,
    ProductionAccountClaimError,
    TenantRecordStore,
    TenantSettingsStore,
)
from quant_core.public_coordination import PublicLeaseStore


@unittest.skipUnless(
    os.environ.get("AIQT_TEST_POSTGRES_URL"),
    "AIQT_TEST_POSTGRES_URL is required for PostgreSQL integration",
)
class PublicPostgresIntegrationTest(unittest.TestCase):
    def test_same_ids_remain_isolated_across_private_record_categories(self) -> None:
        engine = create_engine(os.environ["AIQT_TEST_POSTGRES_URL"], pool_pre_ping=True)
        identities = PublicIdentityStore(engine)
        suffix = uuid4().hex
        now = datetime.now(timezone.utc)
        users = [
            identities.register_login(
                issuer="https://integration.example.com",
                subject=f"{name}-{suffix}",
                email=f"{name}-{suffix}@example.com",
                email_verified=True,
                now=now,
            )
            for name in ("first", "second")
        ]
        first = TenantRecordStore(engine, users[0].owner_id)
        second = TenantRecordStore(engine, users[1].owner_id)
        kinds = (
            "research_run",
            "strategy",
            "ai_review_run",
            "research_note",
            "watchlist",
            "audit_event",
            "portfolio_paper_order_batch",
            "paper_execution",
            "auto_trading_state",
            "acceptance_artifact",
        )
        cipher = TenantSecretCipher(base64.urlsafe_b64encode(b"p" * 32).decode())
        first_settings = TenantSettingsStore(engine, users[0].owner_id, cipher)
        second_settings = TenantSettingsStore(engine, users[1].owner_id, cipher)
        leases = PublicLeaseStore(engine)

        try:
            for kind in kinds:
                first.put(kind, "shared-id", {"owner": "first"})
                second.put(kind, "shared-id", {"owner": "second"})
            first_settings.set("platform-settings", "first-secret")
            second_settings.set("platform-settings", "second-secret")

            self.assertTrue(
                all(first.get(kind, "shared-id") == {"owner": "first"} for kind in kinds)
            )
            self.assertTrue(
                all(second.get(kind, "shared-id") == {"owner": "second"} for kind in kinds)
            )
            self.assertEqual(first_settings.get("platform-settings"), "first-secret")
            self.assertEqual(second_settings.get("platform-settings"), "second-secret")
            self.assertTrue(leases.acquire(users[0].owner_id, "review", "worker-a"))
            self.assertTrue(leases.acquire(users[1].owner_id, "review", "worker-b"))
            self.assertTrue(
                leases.is_held(users[0].owner_id, "review", "worker-a")
            )
            claims = ProductionAccountClaimStore(engine)
            self.assertTrue(claims.claim(users[0].owner_id, f"account-{suffix}"))
            with self.assertRaises(ProductionAccountClaimError):
                claims.claim(users[1].owner_id, f"account-{suffix}")
        finally:
            with engine.begin() as connection:
                connection.execute(
                    delete(public_users).where(
                        public_users.c.owner_id.in_([user.owner_id for user in users])
                    )
                )
            engine.dispose()

    def test_public_http_routes_isolate_same_research_context(self) -> None:
        class Provider:
            def authorization_url(self, **parameters) -> str:
                return "https://integration.example.com/authorize"

            def exchange_code(self, **parameters) -> OidcIdentity:
                code = str(parameters["code"])
                return OidcIdentity(
                    issuer="https://integration.example.com",
                    subject=code,
                    email=f"{code}@example.com",
                    email_verified=True,
                )

        database_url = os.environ["AIQT_TEST_POSTGRES_URL"]
        engine = create_engine(database_url, pool_pre_ping=True)
        key = base64.urlsafe_b64encode(b"h" * 32).decode()
        config = load_deployment_config(
            {
                "AIQT_DEPLOYMENT_MODE": "public",
                "AIQT_DATABASE_URL": database_url,
                "AIQT_PUBLIC_ORIGIN": "https://integration.example.com",
                "AIQT_OIDC_ISSUER": "https://integration.example.com",
                "AIQT_OIDC_CLIENT_ID": "aiqt-integration",
                "AIQT_OIDC_CLIENT_SECRET": "integration-only",
                "AIQT_SETTINGS_MASTER_KEY": key,
            }
        )
        auth = PublicAuthService(
            config,
            engine,
            provider=Provider(),
            cipher=TenantSecretCipher(key),
        )
        app = create_public_app(
            config,
            engine,
            auth_service=auth,
            tenant_handler=PublicTenantApi(config, engine),
        )
        clients = [
            TestClient(app, base_url="https://integration.example.com")
            for _ in range(2)
        ]
        suffix = uuid4().hex
        subjects = [f"http-first-{suffix}", f"http-second-{suffix}"]

        try:
            csrf_tokens = []
            for client, subject in zip(clients, subjects):
                client.get("/api/auth/login", follow_redirects=False)
                state = client.cookies.get("aiqt_oidc_state")
                response = client.get(
                    f"/api/auth/callback?state={state}&code={subject}",
                    follow_redirects=False,
                )
                self.assertEqual(response.status_code, 303)
                csrf_tokens.append(client.get("/api/auth/session").json()["csrfToken"])
            for client, csrf, body in zip(clients, csrf_tokens, ("first", "second")):
                response = client.post(
                    "/api/research/notes",
                    json={
                        "market": "ashare",
                        "symbol": "600000",
                        "timeframe": "1d",
                        "body": body,
                    },
                    headers={
                        "Origin": "https://integration.example.com",
                        "X-AIQT-CSRF": csrf,
                    },
                )
                self.assertEqual(response.status_code, 201)
            first = clients[0].get(
                "/api/research/notes?market=ashare&symbol=600000&timeframe=1d"
            )
            second = clients[1].get(
                "/api/research/notes?market=ashare&symbol=600000&timeframe=1d"
            )
            self.assertEqual(first.json()["note"]["body"], "first")
            self.assertEqual(second.json()["note"]["body"], "second")
        finally:
            for client in clients:
                client.close()
            with engine.begin() as connection:
                connection.execute(
                    delete(public_users).where(public_users.c.subject.in_(subjects))
                )
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
