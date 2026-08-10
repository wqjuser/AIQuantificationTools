from __future__ import annotations

import asyncio
import base64
from dataclasses import replace
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import warnings

import httpx
import httpx2
from authlib.deprecate import AuthlibDeprecationWarning
with warnings.catch_warnings():
    warnings.simplefilter("ignore", AuthlibDeprecationWarning)
    from authlib.jose import JsonWebKey, JsonWebToken
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from mcp import Client
from mcp.client.streamable_http import streamable_http_client
from mcp.server.auth.provider import AccessToken
from mcp.server.auth.settings import AuthSettings
from mcp.server.transport_security import TransportSecuritySettings
from mcp.shared.exceptions import MCPError
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from starlette.responses import JSONResponse

from quant_core.deployment import load_deployment_config, load_public_resource_config
from quant_core.mcp_service import McpServiceSettings, create_mcp_server
from quant_core.mcp_service.cli import transport_security_settings
from quant_core.mcp_service.public import (
    _PublicTenantGateway,
    PublicMcpAuthConfig,
    PublicMcpRateLimitMiddleware,
    PublicMcpTokenVerifier,
    create_public_mcp_server,
)
from quant_core.public_identity import PublicIdentityStore
from quant_core.public_coordination import PublicRateLimiter
from quant_core.public_schema import create_public_schema
from quant_core.public_tenant_api import PublicTenantApi
from quant_core.runs import ResearchRunAudit
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_store_adapters import PublicTenantStores
from quant_core.tenancy import TenantContext


RESOURCE_URL = "https://research.example.com/mcp"
ISSUER_URL = "https://identity.example.com"
READ_SCOPE = "aiqt:research:read"
UTC = timezone.utc


class _NoScopeTokenVerifier:
    async def verify_token(self, token: str) -> AccessToken | None:
        return AccessToken(
            token=token,
            client_id="scope-test-client",
            scopes=[],
            expires_at=2_000_000_000,
            resource=RESOURCE_URL,
            subject="scope-test-subject",
            claims={"iss": ISSUER_URL},
        )


class _ReadScopeTokenVerifier:
    async def verify_token(self, token: str) -> AccessToken | None:
        return AccessToken(
            token=token,
            client_id="host-test-client",
            scopes=[READ_SCOPE],
            expires_at=2_000_000_000,
            resource=RESOURCE_URL,
            subject="host-test-subject",
            claims={"iss": ISSUER_URL},
        )


class _TenantTokenVerifier:
    def __init__(self, tenants: dict[str, TenantContext]) -> None:
        self.tenants = tenants

    async def verify_token(self, token: str) -> AccessToken | None:
        tenant = self.tenants.get(token)
        if tenant is None:
            return None
        return AccessToken(
            token=token,
            client_id="test-client",
            scopes=[READ_SCOPE],
            expires_at=2_000_000_000,
            resource=RESOURCE_URL,
            subject=tenant.subject,
            claims={
                "iss": tenant.issuer,
                "owner_id": tenant.owner_id,
                "email": tenant.email,
                "reauthenticated_at": tenant.reauthenticated_at.isoformat(),
            },
        )


def _settings() -> McpServiceSettings:
    return McpServiceSettings(
        api_base_url="http://quant.test",
        api_cookie=None,
        api_csrf_token=None,
        api_origin=None,
        transport="streamable-http",
        host="0.0.0.0",
        port=8766,
        operator=None,
        research_writes_enabled=False,
        request_timeout_seconds=10.0,
    )


class PublicMcpServiceTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        create_public_schema(self.engine)
        self.deployment = load_deployment_config(
            {
                "AIQT_DEPLOYMENT_MODE": "public",
                "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
                "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
                "AIQT_OIDC_ISSUER": ISSUER_URL,
                "AIQT_OIDC_CLIENT_ID": "aiqt-web",
                "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
                "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(b"m" * 32).decode(),
            }
        )

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_public_auth_config_is_derived_from_the_canonical_public_origin(self) -> None:
        config = PublicMcpAuthConfig.from_environment(self.deployment, {})

        self.assertEqual(config.issuer_url, ISSUER_URL)
        self.assertEqual(config.resource_url, RESOURCE_URL)
        self.assertEqual(config.read_scope, READ_SCOPE)
        transport_security = transport_security_settings(config)
        self.assertEqual(
            transport_security.allowed_hosts,
            ["research.example.com", "research.example.com:443"],
        )
        self.assertEqual(
            transport_security.allowed_origins,
            ["https://research.example.com"],
        )
        nondefault = PublicMcpAuthConfig.from_environment(
            replace(
                self.deployment,
                public_origin="https://research.example.com:8443",
            ),
            {},
        )
        self.assertEqual(
            transport_security_settings(nondefault).allowed_hosts,
            ["research.example.com:8443"],
        )
        self.assertEqual(
            PublicMcpAuthConfig.from_environment(
                self.deployment,
                {"AIQT_MCP_RATE_LIMIT_REQUESTS_1M": "7"},
            ).request_limit_per_minute,
            7,
        )
        self.assertEqual(
            PublicMcpAuthConfig.from_environment(
                self.deployment,
                {"AIQT_MCP_RATE_LIMIT_REQUESTS_1M": "999"},
            ).request_limit_per_minute,
            120,
        )
        with self.assertRaisesRegex(ValueError, "mcp_oauth_resource_origin_mismatch"):
            PublicMcpAuthConfig.from_environment(
                self.deployment,
                {"AIQT_MCP_PUBLIC_RESOURCE_URL": "https://evil.example/mcp"},
            )
        with self.assertRaisesRegex(ValueError, "mcp_oauth_resource_path_invalid"):
            PublicMcpAuthConfig.from_environment(
                self.deployment,
                {"AIQT_MCP_PUBLIC_RESOURCE_URL": "https://research.example.com/api"},
            )

    def test_public_resource_process_does_not_require_browser_oidc_secret(self) -> None:
        deployment = load_public_resource_config(
            {
                "AIQT_DEPLOYMENT_MODE": "public",
                "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
                "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
                "AIQT_OIDC_ISSUER": ISSUER_URL,
            }
        )

        self.assertEqual(deployment.mode, "public")
        self.assertEqual(deployment.oidc_issuer, ISSUER_URL)
        self.assertIsNone(deployment.oidc_client_id)
        self.assertIsNone(deployment.oidc_client_secret)
        self.assertIsNone(deployment.settings_master_key)
        for forbidden_secret in (
            "AIQT_OIDC_CLIENT_SECRET",
            "AIQT_SETTINGS_MASTER_KEY",
        ):
            with self.subTest(forbidden_secret=forbidden_secret):
                with self.assertRaisesRegex(
                    ValueError,
                    f"{forbidden_secret} must not be set",
                ):
                    load_public_resource_config(
                        {
                            "AIQT_DEPLOYMENT_MODE": "public",
                            "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
                            "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
                            "AIQT_OIDC_ISSUER": ISSUER_URL,
                            forbidden_secret: "must-not-enter-mcp",
                        }
                    )

    async def test_public_rate_limit_is_scoped_to_server_owned_tenant(self) -> None:
        auth = PublicMcpAuthConfig(
            issuer_url=ISSUER_URL,
            resource_url=RESOURCE_URL,
            read_scope=READ_SCOPE,
            request_limit_per_minute=1,
        )
        middleware = PublicMcpRateLimitMiddleware(
            PublicRateLimiter(self.engine),
            auth,
        )
        token = AccessToken(
            token="redacted",
            client_id="client",
            scopes=[READ_SCOPE],
            subject="subject-a",
            claims={"iss": ISSUER_URL, "owner_id": "owner-a"},
        )
        context = SimpleNamespace(
            method="initialize",
            request_id="request-1",
        )

        async def call_next(_context):
            return {"ok": True}

        with patch(
            "quant_core.mcp_service.public.get_access_token",
            return_value=token,
        ):
            first = await middleware(context, call_next)
            with self.assertRaisesRegex(MCPError, "mcp_rate_limit_exceeded"):
                await middleware(context, call_next)

        self.assertEqual(first, {"ok": True})

    async def test_public_tenant_gateway_denies_non_research_paths_and_mutations(self) -> None:
        calls: list[tuple[str, str]] = []

        class RecordingTenantApi:
            async def __call__(self, request, _tenant):
                calls.append((request.method, request.url.path))
                return JSONResponse({"ok": True})

        gateway = _PublicTenantGateway(RecordingTenantApi())
        token = AccessToken(
            token="redacted",
            client_id="client",
            scopes=[READ_SCOPE],
            subject="subject-a",
            claims={
                "iss": ISSUER_URL,
                "owner_id": "owner-a",
                "email": "a@example.com",
                "reauthenticated_at": datetime.now(UTC).isoformat(),
            },
        )
        with patch(
            "quant_core.mcp_service.public.get_access_token",
            return_value=token,
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=gateway),
                base_url="http://public-tenant.internal",
            ) as client:
                allowed = await client.get("/api/research/runs/run-a")
                forbidden_execution = await client.get(
                    "/api/execution/auto-paper-trading"
                )
                forbidden_mutation = await client.post(
                    "/api/research/runs",
                    json={},
                )
                forbidden_dot_segment = await client.get("/api/research/runs/%2E")

        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(forbidden_execution.status_code, 403)
        self.assertEqual(forbidden_mutation.status_code, 403)
        self.assertEqual(forbidden_dot_segment.status_code, 403)
        self.assertEqual(calls, [("GET", "/api/research/runs/run-a")])

    async def test_research_only_get_does_not_rewrite_acceptance_artifacts(self) -> None:
        now = datetime(2026, 8, 11, 8, 0, tzinfo=UTC)
        user = PublicIdentityStore(self.engine).register_login(
            issuer=ISSUER_URL,
            subject="subject-read-only",
            email="read-only@example.com",
            email_verified=True,
            now=now,
        )
        tenant = TenantContext(
            owner_id=user.owner_id,
            issuer=user.issuer,
            subject=user.subject,
            email=user.email,
            reauthenticated_at=now,
        )
        stores = PublicTenantStores.create(
            self.engine,
            tenant,
            TenantSecretCipher(self.deployment.settings_master_key or ""),
        )
        artifact_id = "stage6_exit_acceptance_report_path"
        stores.report_artifacts.put(
            artifact_id,
            '{"status":"blocked","revision":2}',
        )
        before = stores.records.get_versioned("acceptance_artifact", artifact_id)
        await asyncio.sleep(0.01)

        gateway = _PublicTenantGateway(
            PublicTenantApi(
                replace(self.deployment, settings_master_key=None),
                self.engine,
                research_only=True,
            )
        )
        token = AccessToken(
            token="redacted",
            client_id="client",
            scopes=[READ_SCOPE],
            subject=tenant.subject,
            claims={
                "iss": tenant.issuer,
                "owner_id": tenant.owner_id,
                "email": tenant.email,
                "reauthenticated_at": tenant.reauthenticated_at.isoformat(),
            },
        )
        with patch(
            "quant_core.mcp_service.public.get_access_token",
            return_value=token,
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=gateway),
                base_url="http://public-tenant.internal",
            ) as client:
                response = await client.get("/api/research/runs", params={"limit": 1})

        after = stores.records.get_versioned("acceptance_artifact", artifact_id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(after, before)

    def test_public_compose_and_caddy_expose_only_the_oauth_protected_route(self) -> None:
        root = Path(__file__).resolve().parents[3]
        compose = (root / "compose.public.yaml").read_text()
        caddy = (root / "deploy" / "Caddyfile").read_text()

        public_mcp = compose.split("\n  mcp:\n", 1)[1].split("\n  caddy:\n", 1)[0]
        self.assertIn("profiles: !reset []", public_mcp)
        self.assertIn("ports: !reset []", public_mcp)
        self.assertIn("AIQT_DEPLOYMENT_MODE: public", public_mcp)
        self.assertIn('AIQT_MCP_ENABLE_RESEARCH_WRITES: "false"', public_mcp)
        self.assertIn("AIQT_MCP_PUBLIC_RESOURCE_URL:", public_mcp)
        self.assertNotIn("AIQT_MCP_OPERATOR:", public_mcp)
        self.assertNotIn("AIQT_OIDC_CLIENT_ID:", public_mcp)
        self.assertNotIn("AIQT_OIDC_CLIENT_SECRET:", public_mcp)
        self.assertNotIn("AIQT_SETTINGS_MASTER_KEY:", public_mcp)
        self.assertIn(
            "@mcp path /mcp /.well-known/oauth-protected-resource/mcp",
            caddy,
        )
        self.assertIn("reverse_proxy mcp:8766", caddy)
        self.assertIn("header_up Host {hostport}", caddy)
        cli = (root / "services/quant_core/quant_core/mcp_service/cli.py").read_text()
        self.assertIn("stateless_http=public_auth is not None", cli)

    async def test_unauthenticated_request_returns_oauth_challenge_and_metadata(self) -> None:
        server = create_mcp_server(
            settings=_settings(),
            token_verifier=_ReadScopeTokenVerifier(),
            auth=AuthSettings(
                issuer_url=ISSUER_URL,
                resource_server_url=RESOURCE_URL,
                required_scopes=[READ_SCOPE],
            ),
        )
        app = server.streamable_http_app(
            streamable_http_path="/mcp",
            host="0.0.0.0",
            transport_security=TransportSecuritySettings(
                enable_dns_rebinding_protection=True,
                allowed_hosts=["research.example.com"],
                allowed_origins=["https://research.example.com"],
            ),
        )

        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="https://research.example.com",
            ) as client:
                unauthorized = await client.post("/mcp", json={})
                metadata = await client.get(
                    "/.well-known/oauth-protected-resource/mcp"
                )
                forged_host = await client.post(
                    "/mcp",
                    headers={
                        "Authorization": "Bearer host-test",
                        "Host": "evil.example",
                    },
                    json={},
                )
                forged_origin = await client.post(
                    "/mcp",
                    headers={
                        "Authorization": "Bearer host-test",
                        "Origin": "https://evil.example",
                    },
                    json={},
                )

        self.assertEqual(unauthorized.status_code, 401)
        self.assertIn(
            'resource_metadata="https://research.example.com/.well-known/'
            'oauth-protected-resource/mcp"',
            unauthorized.headers["www-authenticate"],
        )
        self.assertEqual(metadata.status_code, 200)
        self.assertEqual(forged_host.status_code, 421)
        self.assertEqual(forged_origin.status_code, 403)
        self.assertEqual(
            metadata.json(),
            {
                "resource": RESOURCE_URL,
                "authorization_servers": [ISSUER_URL],
                "scopes_supported": [READ_SCOPE],
                "bearer_methods_supported": ["header"],
            },
        )

    async def test_authenticated_token_without_read_scope_is_forbidden(self) -> None:
        server = create_mcp_server(
            settings=_settings(),
            token_verifier=_NoScopeTokenVerifier(),
            auth=AuthSettings(
                issuer_url=ISSUER_URL,
                resource_server_url=RESOURCE_URL,
                required_scopes=[READ_SCOPE],
            ),
        )
        app = server.streamable_http_app(
            streamable_http_path="/mcp",
            host="0.0.0.0",
            transport_security=TransportSecuritySettings(
                enable_dns_rebinding_protection=True,
                allowed_hosts=["research.example.com"],
                allowed_origins=["https://research.example.com"],
            ),
        )

        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="https://research.example.com",
                headers={"Authorization": "Bearer no-read-scope"},
            ) as client:
                response = await client.post("/mcp", json={})

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"], "insufficient_scope")

    async def test_token_verifier_validates_jwt_and_maps_server_owned_tenant(self) -> None:
        now = datetime(2026, 8, 11, 8, 0, tzinfo=UTC)
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private_pem = private_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
        public_pem = private_key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        public_jwk = JsonWebKey.import_key(public_pem).as_dict()
        public_jwk.update({"kid": "mcp-key", "use": "sig", "alg": "RS256"})

        oauth_paths: list[str] = []

        def oauth_response(request: httpx.Request) -> httpx.Response:
            oauth_paths.append(request.url.path)
            if request.url.path == "/.well-known/openid-configuration":
                return httpx.Response(
                    200,
                    json={
                        "issuer": ISSUER_URL,
                        "jwks_uri": f"{ISSUER_URL}/jwks",
                    },
                )
            if request.url.path == "/jwks":
                return httpx.Response(200, json={"keys": [public_jwk]})
            return httpx.Response(404)

        auth = PublicMcpAuthConfig(
            issuer_url=ISSUER_URL,
            resource_url=RESOURCE_URL,
            read_scope=READ_SCOPE,
        )
        identities = PublicIdentityStore(self.engine)
        server_user = identities.register_login(
            issuer=ISSUER_URL,
            subject="subject-a",
            email="a@example.com",
            email_verified=True,
            now=now,
        )
        identities.register_login(
            issuer=ISSUER_URL,
            subject="123",
            email="numeric@example.com",
            email_verified=True,
            now=now,
        )
        http_client = httpx.AsyncClient(transport=httpx.MockTransport(oauth_response))
        verifier = PublicMcpTokenVerifier(
            auth,
            identities,
            http_client=http_client,
            clock=lambda: now,
        )
        signer = JsonWebToken(["RS256"])

        def issue(**overrides: object) -> str:
            claims: dict[str, object] = {
                "iss": ISSUER_URL,
                "sub": "subject-a",
                "aud": RESOURCE_URL,
                "client_id": "mcp-client",
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(minutes=5)).timestamp()),
                "scope": READ_SCOPE,
                "email": "attacker@example.com",
                "email_verified": True,
                "owner_id": "attacker-controlled-owner",
            }
            claims.update(overrides)
            return signer.encode(
                {"alg": "RS256", "kid": "mcp-key"},
                claims,
                private_pem,
            ).decode()

        try:
            accepted = await verifier.verify_token(issue())
            wrong_audience = await verifier.verify_token(
                issue(aud="https://research.example.com/other")
            )
            expired = await verifier.verify_token(
                issue(exp=int((now - timedelta(minutes=1)).timestamp()))
            )
            unknown_user = await verifier.verify_token(issue(sub="subject-unknown"))
            wrong_issuer = await verifier.verify_token(
                issue(iss="https://evil-issuer.example")
            )
            numeric_subject = await verifier.verify_token(issue(sub=123))
            wrong_private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
            ).private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
            wrong_signature = await verifier.verify_token(
                signer.encode(
                    {"alg": "RS256", "kid": "mcp-key"},
                    {
                        "iss": ISSUER_URL,
                        "sub": "subject-a",
                        "aud": RESOURCE_URL,
                        "client_id": "mcp-client",
                        "iat": int(now.timestamp()),
                        "exp": int((now + timedelta(minutes=5)).timestamp()),
                        "scope": READ_SCOPE,
                    },
                    wrong_private_key,
                ).decode()
            )
            registered = identities.list_active()
            identities.disable(server_user.owner_id, now=now)
            disabled_user = await verifier.verify_token(issue())
        finally:
            await verifier.aclose()

        self.assertIsNotNone(accepted)
        assert accepted is not None
        self.assertEqual(accepted.resource, RESOURCE_URL)
        self.assertEqual(accepted.subject, "subject-a")
        self.assertEqual(accepted.scopes, [READ_SCOPE])
        self.assertEqual(accepted.claims["email"], "a@example.com")
        self.assertNotEqual(
            accepted.claims["owner_id"],
            "attacker-controlled-owner",
        )
        self.assertEqual(
            {user.subject for user in registered},
            {"123", server_user.subject},
        )
        self.assertEqual(accepted.claims["owner_id"], server_user.owner_id)
        self.assertIsNone(wrong_audience)
        self.assertIsNone(expired)
        self.assertIsNone(unknown_user)
        self.assertIsNone(wrong_issuer)
        self.assertIsNone(numeric_subject)
        self.assertIsNone(wrong_signature)
        self.assertIsNone(disabled_user)
        self.assertEqual(oauth_paths.count("/jwks"), 1)

    async def test_jwks_rotation_is_ttl_bounded_and_unknown_kid_refresh_is_cooled_down(self) -> None:
        initial_time = datetime(2026, 8, 11, 8, 0, tzinfo=UTC)
        current_time = [initial_time]
        keys = [
            rsa.generate_private_key(public_exponent=65537, key_size=2048)
            for _ in range(2)
        ]
        private_pems = [
            key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
            for key in keys
        ]
        public_jwks = []
        for index, key in enumerate(keys, start=1):
            public_pem = key.public_key().public_bytes(
                serialization.Encoding.PEM,
                serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            public_jwk = JsonWebKey.import_key(public_pem).as_dict()
            public_jwk.update(
                {"kid": f"mcp-key-{index}", "use": "sig", "alg": "RS256"}
            )
            public_jwks.append(public_jwk)
        active_jwks = [[public_jwks[0]]]
        oauth_paths: list[str] = []

        def oauth_response(request: httpx.Request) -> httpx.Response:
            oauth_paths.append(request.url.path)
            if request.url.path == "/.well-known/openid-configuration":
                return httpx.Response(
                    200,
                    json={
                        "issuer": ISSUER_URL,
                        "jwks_uri": f"{ISSUER_URL}/jwks",
                    },
                )
            if request.url.path == "/jwks":
                return httpx.Response(200, json={"keys": active_jwks[0]})
            return httpx.Response(404)

        identities = PublicIdentityStore(self.engine)
        identities.register_login(
            issuer=ISSUER_URL,
            subject="subject-rotation",
            email="rotation@example.com",
            email_verified=True,
            now=initial_time,
        )
        http_client = httpx.AsyncClient(transport=httpx.MockTransport(oauth_response))
        verifier = PublicMcpTokenVerifier(
            PublicMcpAuthConfig(
                issuer_url=ISSUER_URL,
                resource_url=RESOURCE_URL,
                read_scope=READ_SCOPE,
            ),
            identities,
            http_client=http_client,
            clock=lambda: current_time[0],
        )
        signer = JsonWebToken(["RS256"])

        def issue(index: int) -> str:
            return signer.encode(
                {"alg": "RS256", "kid": f"mcp-key-{index + 1}"},
                {
                    "iss": ISSUER_URL,
                    "sub": "subject-rotation",
                    "aud": RESOURCE_URL,
                    "client_id": "mcp-client",
                    "iat": int(initial_time.timestamp()),
                    "exp": int((initial_time + timedelta(hours=1)).timestamp()),
                    "scope": READ_SCOPE,
                },
                private_pems[index],
            ).decode()

        try:
            first = await verifier.verify_token(issue(0))
            active_jwks[0] = [public_jwks[1]]
            cooled_down = await verifier.verify_token(issue(1))
            current_time[0] += timedelta(seconds=31)
            rotated = await verifier.verify_token(issue(1))
            revoked = await verifier.verify_token(issue(0))
            current_time[0] += timedelta(minutes=5, seconds=1)
            ttl_refreshed = await verifier.verify_token(issue(1))
        finally:
            await verifier.aclose()

        self.assertIsNotNone(first)
        self.assertIsNone(cooled_down)
        self.assertIsNotNone(rotated)
        self.assertIsNone(revoked)
        self.assertIsNotNone(ttl_refreshed)
        self.assertEqual(oauth_paths.count("/jwks"), 3)

    async def test_public_factory_reasserts_canonical_resource_and_needs_no_master_key(self) -> None:
        resource_deployment = replace(self.deployment, settings_master_key=None)
        auth = PublicMcpAuthConfig(
            issuer_url=ISSUER_URL,
            resource_url=RESOURCE_URL,
            read_scope=READ_SCOPE,
        )
        server = create_public_mcp_server(
            settings=_settings(),
            deployment=resource_deployment,
            engine=self.engine,
            auth_config=auth,
            token_verifier=_TenantTokenVerifier({}),
        )
        self.assertIsNotNone(server)
        app = server.streamable_http_app(
            streamable_http_path="/mcp",
            host="0.0.0.0",
            stateless_http=True,
        )
        async with app.router.lifespan_context(app):
            pass
        with self.assertRaisesRegex(ValueError, "mcp_public_deployment_required"):
            create_public_mcp_server(
                settings=_settings(),
                deployment=self.deployment,
                engine=self.engine,
                auth_config=auth,
                token_verifier=_TenantTokenVerifier({}),
            )
        with self.assertRaisesRegex(ValueError, "mcp_oauth_resource_mismatch"):
            create_public_mcp_server(
                settings=_settings(),
                deployment=resource_deployment,
                engine=self.engine,
                auth_config=PublicMcpAuthConfig(
                    issuer_url=ISSUER_URL,
                    resource_url="https://research.example.com/other",
                    read_scope=READ_SCOPE,
                ),
                token_verifier=_TenantTokenVerifier({}),
            )

    async def test_valid_tokens_read_only_their_server_owned_tenant(self) -> None:
        identities = PublicIdentityStore(self.engine)
        now = datetime(2026, 8, 11, 8, 0, tzinfo=UTC)
        users = [
            identities.register_login(
                issuer=ISSUER_URL,
                subject=f"subject-{label}",
                email=f"{label}@example.com",
                email_verified=True,
                now=now,
            )
            for label in ("a", "b")
        ]
        tenants = {
            f"token-{label}": TenantContext(
                owner_id=user.owner_id,
                issuer=user.issuer,
                subject=user.subject,
                email=user.email,
                reauthenticated_at=now,
            )
            for label, user in zip(("a", "b"), users, strict=True)
        }
        cipher = TenantSecretCipher(self.deployment.settings_master_key or "")
        for label, tenant in zip(("a", "b"), tenants.values(), strict=True):
            stores = PublicTenantStores.create(self.engine, tenant, cipher)
            stores.platform_settings_store.save(
                {
                    "ccxtDefaultExchange": "binance",
                    "ccxtTimeout": 10_000,
                    "autoTradingIntervalSeconds": 35,
                    "productionTradingEnabled": False,
                    "liveSessionTtlHours": 8,
                    "openaiModel": "",
                    "openaiCompatibleBaseUrl": "",
                    "openaiCompatibleModel": "",
                    "ollamaBaseUrl": "http://127.0.0.1:11434",
                    "ollamaModel": "",
                    "secEdgarUserAgent": "",
                    "monitoringWebhookTimeoutSeconds": 5,
                    "freeStockdbTimeoutSeconds": 3,
                },
                {"ccxtProductionTradingApiKey": f"tenant-{label}-secret"},
                [],
                {},
            )
            stores.run_store.record(
                ResearchRunAudit(
                    run_id="run-shared",
                    created_at=now,
                    market="crypto",
                    symbol="BTC/USDT",
                    timeframe="1m",
                    strategy_name=f"tenant-{label}-strategy",
                    strategy_revision=f"revision-{label}",
                    data_rows=1,
                    metrics={"total_return_pct": 0.0},
                    decisions=[],
                    execution_mode="paper_only",
                )
            )

        authorization_headers: list[str | None] = []
        tenant_api = PublicTenantApi(self.deployment, self.engine)

        class RecordingTenantApi:
            async def __call__(self, request, tenant):
                authorization_headers.append(request.headers.get("authorization"))
                return await tenant_api(request, tenant)

        server = create_public_mcp_server(
            settings=_settings(),
            deployment=replace(self.deployment, settings_master_key=None),
            engine=self.engine,
            auth_config=PublicMcpAuthConfig(
                issuer_url=ISSUER_URL,
                resource_url=RESOURCE_URL,
                read_scope=READ_SCOPE,
            ),
            token_verifier=_TenantTokenVerifier(tenants),
            tenant_api=RecordingTenantApi(),
        )
        app = server.streamable_http_app(
            streamable_http_path="/mcp",
            host="0.0.0.0",
            stateless_http=True,
            transport_security=TransportSecuritySettings(
                enable_dns_rebinding_protection=True,
                allowed_hosts=["research.example.com"],
                allowed_origins=["https://research.example.com"],
            ),
        )

        async def read(
            token: str,
        ) -> tuple[dict[str, object], dict[str, object], set[str]]:
            http = httpx2.AsyncClient(
                transport=httpx2.ASGITransport(app=app),
                base_url="https://research.example.com",
                headers={"Authorization": f"Bearer {token}"},
            )
            transport = streamable_http_client(
                RESOURCE_URL,
                http_client=http,
                terminate_on_close=False,
            )
            try:
                async with Client(transport) as client:
                    tools = await client.list_tools()
                    result = await client.call_tool(
                        "aiqt_get_research_run",
                        {"run_id": "run-shared"},
                    )
                    paper = await client.call_tool("aiqt_get_paper_status", {})
                    assert result.structured_content is not None
                    assert paper.structured_content is not None
                    return result.structured_content, paper.structured_content, {
                        tool.name for tool in tools.tools
                    }
            finally:
                await http.aclose()

        async with app.router.lifespan_context(app):
            first_result, second_result = await asyncio.gather(
                read("token-a"),
                read("token-b"),
            )
        first, first_paper, first_tools = first_result
        second, second_paper, second_tools = second_result

        self.assertEqual(
            first["data"]["run"]["strategyName"],
            "tenant-a-strategy",
        )
        self.assertEqual(
            second["data"]["run"]["strategyName"],
            "tenant-b-strategy",
        )
        self.assertNotIn("ownerId", json.dumps(first))
        self.assertNotIn("ownerId", json.dumps(second))
        self.assertTrue(authorization_headers)
        self.assertEqual(set(authorization_headers), {None})
        self.assertFalse(first_paper["data"]["available"])
        self.assertFalse(second_paper["data"]["available"])
        self.assertEqual(
            first_tools,
            {
                "aiqt_get_system_status",
                "aiqt_search_instruments",
                "aiqt_read_market_context",
                "aiqt_list_research_runs",
                "aiqt_get_research_run",
                "aiqt_get_strategy_research",
                "aiqt_get_paper_status",
                "aiqt_list_research_audit_events",
            },
        )
        self.assertEqual(second_tools, first_tools)


if __name__ == "__main__":
    unittest.main()
