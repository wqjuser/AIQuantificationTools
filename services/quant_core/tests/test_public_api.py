from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
import unittest

from sqlalchemy import create_engine, update
from sqlalchemy.pool import StaticPool
from starlette.responses import JSONResponse
from starlette.testclient import TestClient

from quant_core.deployment import load_deployment_config
from quant_core.public_api import create_public_app
from quant_core.public_auth import OidcIdentity, PublicAuthService
from quant_core.public_schema import create_public_schema
from quant_core.public_schema import public_sessions
from quant_core.tenant_crypto import TenantSecretCipher


class FakeProvider:
    def authorization_url(self, **parameters) -> str:
        from urllib.parse import urlencode

        return f"https://identity.example.com/authorize?{urlencode(parameters)}"

    def exchange_code(self, **parameters) -> OidcIdentity:
        return OidcIdentity(
            issuer="https://identity.example.com",
            subject="subject-1",
            email="user@example.com",
            email_verified=True,
        )


class PublicApiSecurityTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        create_public_schema(self.engine)
        self.config = load_deployment_config(
            {
                "AIQT_DEPLOYMENT_MODE": "public",
                "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
                "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
                "AIQT_OIDC_ISSUER": "https://identity.example.com",
                "AIQT_OIDC_CLIENT_ID": "aiqt",
                "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
                "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(b"m" * 32).decode(),
            }
        )
        auth = PublicAuthService(
            self.config,
            self.engine,
            provider=FakeProvider(),
            cipher=TenantSecretCipher(self.config.settings_master_key or ""),
        )

        async def tenant_handler(request, tenant):
            return JSONResponse({"ownerId": tenant.owner_id, "actor": tenant.authenticated_actor})

        self.client = TestClient(
            create_public_app(self.config, self.engine, auth_service=auth, tenant_handler=tenant_handler),
            base_url="https://research.example.com",
        )

    def tearDown(self) -> None:
        self.client.close()
        self.engine.dispose()

    def test_login_session_csrf_and_logout_are_fail_closed(self) -> None:
        anonymous = self.client.get("/api/auth/session")
        protected = self.client.get("/api/research/runs")
        login = self.client.get("/api/auth/login?returnTo=/research", follow_redirects=False)

        self.assertEqual(anonymous.json(), {"authenticated": False})
        self.assertEqual(protected.status_code, 401)
        self.assertEqual(login.status_code, 307)
        state = self.client.cookies.get("aiqt_oidc_state")
        self.assertTrue(state)
        state_cookie = login.headers.get("set-cookie", "")
        self.assertIn("Secure", state_cookie)
        self.assertIn("HttpOnly", state_cookie)
        self.assertIn("SameSite=lax", state_cookie)

        callback = self.client.get(
            f"/api/auth/callback?state={state}&code=code",
            follow_redirects=False,
        )
        self.assertEqual(callback.status_code, 303)
        self.assertEqual(callback.headers["location"], "/research")
        session_cookie = callback.headers.get("set-cookie", "")
        self.assertIn("aiqt_session=", session_cookie)
        self.assertIn("Secure", session_cookie)
        self.assertIn("HttpOnly", session_cookie)
        self.assertIn("SameSite=lax", session_cookie)

        session = self.client.get("/api/auth/session")
        self.assertTrue(session.json()["authenticated"])
        csrf = session.json()["csrfToken"]
        tenant_response = self.client.get("/api/research/runs", headers={"X-AIQT-Owner": "forged"})
        self.assertEqual(tenant_response.json()["actor"], "user@example.com")

        cross_origin = self.client.post(
            "/api/auth/logout",
            json={},
            headers={"Origin": "https://evil.example", "X-AIQT-CSRF": csrf},
        )
        missing_json = self.client.post(
            "/api/auth/logout",
            content=b"",
            headers={"Origin": "https://research.example.com", "X-AIQT-CSRF": csrf},
        )
        wrong_csrf = self.client.post(
            "/api/auth/logout",
            json={},
            headers={"Origin": "https://research.example.com", "X-AIQT-CSRF": "wrong"},
        )
        logout = self.client.post(
            "/api/auth/logout",
            json={},
            headers={"Origin": "https://research.example.com", "X-AIQT-CSRF": csrf},
        )

        self.assertEqual(cross_origin.status_code, 403)
        self.assertEqual(missing_json.status_code, 415)
        self.assertEqual(wrong_csrf.status_code, 403)
        self.assertEqual(logout.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/session").json(), {"authenticated": False})

    def test_security_headers_host_and_health_are_minimal(self) -> None:
        health = self.client.get("/health")
        internal_health = self.client.get("/health", headers={"Host": "127.0.0.1:8765"})
        bad_host = self.client.get("/health", headers={"Host": "evil.example"})

        self.assertEqual(health.json(), {"status": "ok"})
        self.assertEqual(health.headers["x-content-type-options"], "nosniff")
        self.assertIn("max-age=31536000", health.headers["strict-transport-security"])
        self.assertIn("frame-ancestors 'none'", health.headers["content-security-policy"])
        self.assertEqual(internal_health.json(), {"status": "ok"})
        self.assertEqual(bad_host.status_code, 400)

    def test_login_rate_limit_cannot_be_disabled(self) -> None:
        responses = [
            self.client.get("/api/auth/login", follow_redirects=False)
            for _ in range(11)
        ]

        self.assertTrue(all(response.status_code == 307 for response in responses[:10]))
        self.assertEqual(responses[-1].status_code, 429)
        self.assertGreater(int(responses[-1].headers["retry-after"]), 0)

    def test_actor_is_server_bound_and_sensitive_routes_require_recent_reauthentication(self) -> None:
        login = self.client.get("/api/auth/login", follow_redirects=False)
        state = self.client.cookies.get("aiqt_oidc_state")
        self.client.get(f"/api/auth/callback?state={state}&code=code", follow_redirects=False)
        csrf = self.client.get("/api/auth/session").json()["csrfToken"]
        headers = {"Origin": "https://research.example.com", "X-AIQT-CSRF": csrf}

        forged = self.client.post(
            "/api/execution/stage10/production-execution-controls",
            json={"operator": "another-user@example.com"},
            headers=headers,
        )
        empty_actor = self.client.post(
            "/api/research/notes",
            json={"author": ""},
            headers=headers,
        )
        with self.engine.begin() as connection:
            connection.execute(
                update(public_sessions).values(
                    reauthenticated_at=datetime.now(timezone.utc) - timedelta(minutes=6)
                )
            )
        stale = self.client.post(
            "/api/execution/stage10/production-execution-controls",
            json={"operator": "user@example.com"},
            headers=headers,
        )

        self.assertEqual(login.status_code, 307)
        self.assertEqual(forged.status_code, 403)
        self.assertEqual(forged.json()["error"], "authenticated_actor_mismatch")
        self.assertEqual(empty_actor.status_code, 403)
        self.assertEqual(stale.status_code, 428)
        self.assertEqual(stale.json()["error"], "reauthentication_required")

    def test_stale_session_can_save_non_sensitive_but_not_production_settings(self) -> None:
        self.client.get("/api/auth/login", follow_redirects=False)
        state = self.client.cookies.get("aiqt_oidc_state")
        self.client.get(f"/api/auth/callback?state={state}&code=code", follow_redirects=False)
        csrf = self.client.get("/api/auth/session").json()["csrfToken"]
        headers = {"Origin": "https://research.example.com", "X-AIQT-CSRF": csrf}
        with self.engine.begin() as connection:
            connection.execute(
                update(public_sessions).values(
                    reauthenticated_at=datetime.now(timezone.utc) - timedelta(minutes=6)
                )
            )

        ordinary = self.client.put(
            "/api/settings/configuration",
            json={
                "configuration": {"secEdgarUserAgent": "AIQT test@example.com"},
                "secretUpdates": {},
                "clearSecrets": [],
            },
            headers=headers,
        )
        production_secret = self.client.put(
            "/api/settings/configuration",
            json={
                "configuration": {"productionTradingEnabled": False},
                "secretUpdates": {"ccxtProductionReadonlyApiKey": "secret"},
                "clearSecrets": [],
            },
            headers=headers,
        )
        production_enable = self.client.put(
            "/api/settings/configuration",
            json={
                "configuration": {"productionTradingEnabled": True},
                "secretUpdates": {},
                "clearSecrets": [],
            },
            headers=headers,
        )

        self.assertEqual(ordinary.status_code, 200)
        self.assertEqual(production_secret.status_code, 428)
        self.assertEqual(production_enable.status_code, 428)

    def test_mutation_body_is_bounded_before_json_parsing(self) -> None:
        self.client.get("/api/auth/login", follow_redirects=False)
        state = self.client.cookies.get("aiqt_oidc_state")
        self.client.get(f"/api/auth/callback?state={state}&code=code", follow_redirects=False)
        csrf = self.client.get("/api/auth/session").json()["csrfToken"]

        response = self.client.post(
            "/api/research/notes",
            content=b"{}",
            headers={
                "Origin": "https://research.example.com",
                "X-AIQT-CSRF": csrf,
                "Content-Type": "application/json",
                "Content-Length": "10000001",
            },
        )

        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.json()["error"], "request_body_too_large")

    def test_historical_actor_inside_imported_evidence_is_not_treated_as_browser_identity(self) -> None:
        self.client.get("/api/auth/login", follow_redirects=False)
        state = self.client.cookies.get("aiqt_oidc_state")
        self.client.get(f"/api/auth/callback?state={state}&code=code", follow_redirects=False)
        csrf = self.client.get("/api/auth/session").json()["csrfToken"]

        response = self.client.post(
            "/api/research/runs/import",
            json={
                "operator": "user@example.com",
                "artifact": {"author": "historical-author@example.com"},
            },
            headers={
                "Origin": "https://research.example.com",
                "X-AIQT-CSRF": csrf,
            },
        )

        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
