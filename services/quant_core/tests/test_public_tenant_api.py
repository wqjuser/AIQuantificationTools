from __future__ import annotations

import asyncio
import base64
import socket
import time
from threading import RLock
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from starlette.requests import Request
from starlette.testclient import TestClient

from quant_core.deployment import load_deployment_config
from quant_core.public_api import create_public_app
from quant_core.public_auth import OidcIdentity, PublicAuthService
from quant_core.public_schema import create_public_schema
from quant_core.public_tenant_api import PublicTenantApi
from quant_core.stage10_production_execution import BinanceSpotProductionTradingRoute
from quant_core.tenant_crypto import TenantSecretCipher


class MultiUserProvider:
    def authorization_url(self, **parameters) -> str:
        from urllib.parse import urlencode

        return f"https://identity.example.com/authorize?{urlencode(parameters)}"

    def exchange_code(self, **parameters) -> OidcIdentity:
        code = str(parameters["code"])
        return OidcIdentity(
            issuer="https://identity.example.com",
            subject=f"subject-{code}",
            email=f"{code}@example.com",
            email_verified=True,
        )


class PublicTenantApiTest(unittest.TestCase):
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
        self.auth = PublicAuthService(
            self.config,
            self.engine,
            provider=MultiUserProvider(),
            cipher=TenantSecretCipher(self.config.settings_master_key or ""),
        )
        self.tenant_api = PublicTenantApi(self.config, self.engine)
        app = create_public_app(
            self.config,
            self.engine,
            auth_service=self.auth,
            tenant_handler=self.tenant_api,
        )
        self.first = TestClient(app, base_url="https://research.example.com")
        self.second = TestClient(app, base_url="https://research.example.com")

    def tearDown(self) -> None:
        self.first.close()
        self.second.close()
        self.engine.dispose()

    def _login(self, client: TestClient, code: str) -> str:
        client.get("/api/auth/login", follow_redirects=False)
        state = client.cookies.get("aiqt_oidc_state")
        response = client.get(
            f"/api/auth/callback?state={state}&code={code}",
            follow_redirects=False,
        )
        self.assertEqual(response.status_code, 303)
        return str(client.get("/api/auth/session").json()["csrfToken"])

    def test_slow_get_does_not_block_another_read_for_same_tenant(self) -> None:
        runtime = SimpleNamespace(handler_type=object, lock=RLock(), stores=SimpleNamespace())
        tenant = SimpleNamespace(owner_id="owner-1", authenticated_actor="user@example.com")

        class Handler:
            def __init__(self, path: str):
                self.path = path
                self._captured_status = 200
                self._captured_content_type = "application/json; charset=utf-8"
                self._captured_body = b'{"ok":true}'
                self.connection, self._connection_peer = socket.socketpair()

            def _dispatch_get(self, parsed) -> bool:
                if parsed.path == "/api/slow":
                    time.sleep(0.4)
                return True

            _dispatch_post = _dispatch_get

            def _send_json(self, _payload, status: int = 200) -> None:
                self._captured_status = status

        def request(path: str, method: str) -> Request:
            async def receive():
                return {"type": "http.request", "body": b"", "more_body": False}

            return Request(
                {
                    "type": "http",
                    "method": method,
                    "path": path,
                    "raw_path": path.encode(),
                    "query_string": b"",
                    "headers": [],
                    "client": ("127.0.0.1", 12345),
                    "server": ("research.example.com", 443),
                    "scheme": "https",
                    "root_path": "",
                },
                receive,
            )

        async def exercise(method: str) -> tuple[int, float]:
            started_at = time.monotonic()
            slow = asyncio.create_task(
                self.tenant_api(request("/api/slow", method), tenant)
            )
            await asyncio.sleep(0)
            fast = await self.tenant_api(request("/api/fast", method), tenant)
            fast_elapsed = time.monotonic() - started_at
            await slow
            return fast.status_code, fast_elapsed

        with (
            patch.object(self.tenant_api, "_runtime", return_value=runtime),
            patch.object(
                self.tenant_api,
                "_handler",
                side_effect=lambda _type, current, _body, _tenant: Handler(current.url.path),
            ),
            patch.object(self.tenant_api, "_restore_report_files"),
            patch.object(self.tenant_api, "_persist_report_files"),
        ):
            status, elapsed = asyncio.run(exercise("GET"))
            _mutation_status, mutation_elapsed = asyncio.run(exercise("POST"))

        self.assertEqual(status, 200)
        self.assertLess(elapsed, 0.25)
        self.assertGreater(mutation_elapsed, 0.35)

    def test_existing_routes_use_postgres_tenant_stores_without_cross_user_leakage(self) -> None:
        first_csrf = self._login(self.first, "first")
        self._login(self.second, "second")
        update = self.first.put(
            "/api/watchlist",
            json={
                "watchlist": [
                    {
                        "market": "ashare",
                        "symbol": "600000",
                        "name": "租户 A 自选",
                        "changePct": 0,
                    }
                ]
            },
            headers={
                "Origin": "https://research.example.com",
                "X-AIQT-CSRF": first_csrf,
            },
        )

        first = self.first.get("/api/watchlist")
        second = self.second.get("/api/watchlist")
        stage10 = self.first.get(
            "/api/execution/stage10/production-execution-controls"
        )

        self.assertEqual(update.status_code, 200)
        self.assertEqual(first.json()["watchlist"][0]["name"], "租户 A 自选")
        self.assertEqual(len(second.json()["watchlist"]), 4)
        self.assertEqual(second.json()["watchlist"][0]["name"], "浦发银行")
        self.assertEqual(stage10.status_code, 200)
        self.assertEqual(stage10.json()["productionExecutionControl"]["status"], "revoked")

    def test_cors_preflight_does_not_require_a_session_but_rejects_other_origins(self) -> None:
        allowed = self.first.options(
            "/api/watchlist",
            headers={"Origin": "https://research.example.com"},
        )
        blocked = self.first.options(
            "/api/watchlist",
            headers={"Origin": "https://evil.example"},
        )

        self.assertEqual(allowed.status_code, 204)
        self.assertEqual(blocked.status_code, 403)

    def test_actor_is_injected_streaming_works_and_local_file_materialization_is_disabled(self) -> None:
        csrf = self._login(self.first, "first")
        headers = {
            "Origin": "https://research.example.com",
            "X-AIQT-CSRF": csrf,
        }
        reference = self.first.post(
            "/api/execution/adapter-secret-references",
            json={
                "adapterId": "ashare-live",
                "market": "ashare",
                "route": "live",
                "referenceName": "ashare-live/broker",
                "backend": "local-secret-store",
                "requiredEnvVars": ["BROKER_KEY"],
                "confirmations": {},
                "author": "first@example.com",
            },
            headers=headers,
        )
        blocked = self.first.post(
            "/api/execution/adapter-secret-materializations",
            json={"manifestPath": "/tmp/forbidden.json"},
            headers=headers,
        )
        streamed = self.first.post(
            "/api/research/note-drafts",
            json={
                "market": "ashare",
                "symbol": "600000",
                "timeframe": "1d",
                "providerId": "local",
                "externalDataApproved": False,
            },
            headers={**headers, "Accept": "application/x-ndjson"},
        )
        strict_actor = self.first.post(
            "/api/execution/stage10/production-trading-credential-preflights",
            json={"operator": "first@example.com"},
            headers=headers,
        )

        self.assertIn(reference.status_code, {201, 409})
        self.assertEqual(
            reference.json()["adapterSecretReference"]["operator"],
            "first@example.com",
        )
        self.assertEqual(blocked.status_code, 403)
        self.assertEqual(blocked.json()["error"], "public_local_file_workflow_disabled")
        self.assertEqual(streamed.status_code, 200)
        self.assertIn('"type":"started"', streamed.text.replace(" ", ""))
        self.assertNotIn("public_tenant_route_failed", streamed.text)
        self.assertIn(strict_actor.status_code, {201, 409})
        self.assertNotIn("request is invalid", str(strict_actor.json()))

    def test_empty_public_outbound_allowlist_blocks_model_discovery(self) -> None:
        self._login(self.first, "first")
        with patch("quant_core.ai_review_providers.urlopen") as raw_urlopen:
            response = self.first.get(
                "/api/settings/openai-compatible-models?baseUrl=http://127.0.0.1:11434"
            )

        self.assertEqual(response.status_code, 502)
        raw_urlopen.assert_not_called()

    def test_new_tenant_settings_status_uses_writable_contract(self) -> None:
        self._login(self.first, "first")

        response = self.first.get("/api/settings/status")

        self.assertEqual(response.status_code, 200)
        configuration = response.json()["settings"]["configuration"]
        self.assertEqual(configuration["source"], "environment")
        self.assertEqual(configuration["revision"], 0)
        self.assertFalse(configuration["secrets"]["openaiApiKey"]["configured"])

    def test_same_binance_account_cannot_be_claimed_with_rotated_api_key(self) -> None:
        first_csrf = self._login(self.first, "first")
        second_csrf = self._login(self.second, "second")
        first_context = self.auth.sessions.authenticate(
            self.first.cookies.get("aiqt_session"),
            csrf_token=first_csrf,
            require_csrf=True,
        )
        second_context = self.auth.sessions.authenticate(
            self.second.cookies.get("aiqt_session"),
            csrf_token=second_csrf,
            require_csrf=True,
        )

        class SameAccountExchange:
            def __init__(self, config):
                self.config = config

            def fetch_balance(self):
                return {"info": {"uid": "shared-binance-account"}}

        first_runtime = self.tenant_api._runtime(first_context)
        second_runtime = self.tenant_api._runtime(second_context)
        for runtime, api_key in (
            (first_runtime, "first-api-key"),
            (second_runtime, "rotated-api-key"),
        ):
            configuration = runtime.stores.platform_settings_store.configuration_payload(
                {}
            )["values"]
            runtime.stores.platform_settings_store.save(
                configuration,
                {
                    "ccxtProductionTradingApiKey": api_key,
                    "ccxtProductionTradingSecret": f"{api_key}-secret",
                },
                [],
                {},
            )
            runtime.handler_type.execution_adapter_health_exchange_factory = (
                lambda _exchange_id, config: SameAccountExchange(config)
            )

        first_fingerprint = BinanceSpotProductionTradingRoute(
            env=first_runtime.stores.platform_settings_store.effective_environment({}),
            exchange_factory=first_runtime.handler_type.execution_adapter_health_exchange_factory,
        ).account_identity_fingerprint()
        first_runtime.stores.production_accounts.claim(
            first_context.owner_id,
            first_fingerprint,
        )

        class ActiveProduction:
            def __init__(self):
                self.revoked_by = None

            def control(self):
                return {"status": "active", "triggered": False}

            def set_control(self, **payload):
                self.revoked_by = payload

        class ActiveLiveService:
            def __init__(self):
                self.production = ActiveProduction()
                self.enabled = True

            def snapshot(self):
                return {
                    "state": {
                        "executionMode": "live",
                        "enabled": self.enabled,
                        "liveConfirmed": self.enabled,
                    }
                }

            def configure(self, payload):
                self.enabled = bool(payload["enabled"])

            def reload_runtime(self, *_args, **_kwargs):
                return None

        active_live = ActiveLiveService()
        first_runtime.handler_type.auto_paper_trading_service = active_live

        blocked = self.second.post(
            "/api/execution/stage10/production-execution-controls",
            json={"action": "restore", "reason": "test isolation"},
            headers={
                "Origin": "https://research.example.com",
                "X-AIQT-CSRF": second_csrf,
            },
        )

        self.assertEqual(blocked.status_code, 409)
        self.assertEqual(blocked.json()["error"], "stage10_production_account_claim_blocked")

        updated = self.first.put(
            "/api/settings/configuration",
            json={
                "configuration": first_runtime.stores.platform_settings_store.configuration_payload(
                    {}
                )["values"],
                "secretUpdates": {"ccxtProductionTradingApiKey": "new-first-key"},
                "clearSecrets": [],
            },
            headers={
                "Origin": "https://research.example.com",
                "X-AIQT-CSRF": first_csrf,
            },
        )
        self.assertEqual(updated.status_code, 200)
        self.assertFalse(active_live.enabled)
        self.assertEqual(active_live.production.revoked_by["action"], "revoke")
        self.assertEqual(active_live.production.revoked_by["operator"], "first@example.com")
        self.assertTrue(
            second_runtime.stores.production_accounts.claim(
                second_context.owner_id,
                first_fingerprint,
            )
        )

    def test_same_stage10_business_id_has_unique_holder_per_runtime(self) -> None:
        csrf = self._login(self.first, "first")
        tenant = self.auth.sessions.authenticate(
            self.first.cookies.get("aiqt_session"),
            csrf_token=csrf,
            require_csrf=True,
        )
        other_api = PublicTenantApi(self.config, self.engine)
        first = self.tenant_api._runtime(tenant).handler_type
        second = other_api._runtime(tenant).handler_type

        self.assertTrue(first.stage10_account_lease_acquire("same-order"))
        self.assertFalse(second.stage10_account_lease_acquire("same-order"))
        first.stage10_account_lease_release("same-order")
        self.assertTrue(second.stage10_account_lease_acquire("same-order"))
        second.stage10_account_lease_release("same-order")


if __name__ == "__main__":
    unittest.main()
