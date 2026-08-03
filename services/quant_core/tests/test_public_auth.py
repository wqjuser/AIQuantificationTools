from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import hashlib
from pathlib import Path
from tempfile import TemporaryDirectory
import warnings
from urllib.parse import parse_qs, urlparse
import unittest

import httpx
from authlib.deprecate import AuthlibDeprecationWarning
with warnings.catch_warnings():
    warnings.simplefilter("ignore", AuthlibDeprecationWarning)
    from authlib.jose import JsonWebKey, jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from quant_core.deployment import load_deployment_config
from quant_core.public_auth import (
    OidcIdentity,
    OidcProvider,
    OidcTransactionStore,
    PublicAuthService,
)
from quant_core.public_identity import AuthenticationError, PublicIdentityStore, PublicSessionStore
from quant_core.public_schema import create_public_schema
from quant_core.tenant_crypto import TenantSecretCipher


UTC = timezone.utc


class FakeOidcProvider:
    def __init__(self) -> None:
        self.exchanges: list[dict[str, object]] = []

    def authorization_url(self, **parameters) -> str:
        return "https://identity.example.com/authorize?" + httpx.QueryParams(parameters).__str__()

    def exchange_code(self, **parameters) -> OidcIdentity:
        self.exchanges.append(parameters)
        return OidcIdentity(
            issuer="https://identity.example.com",
            subject="subject-1",
            email="user@example.com",
            email_verified=True,
        )


class PublicAuthServiceTest(unittest.TestCase):
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
        self.provider = FakeOidcProvider()
        self.service = PublicAuthService(
            self.config,
            self.engine,
            provider=self.provider,
            cipher=TenantSecretCipher(self.config.settings_master_key or ""),
        )
        self.now = datetime(2026, 8, 3, 8, 0, tzinfo=UTC)

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_login_and_callback_use_state_nonce_and_pkce_s256_once(self) -> None:
        login = self.service.begin_login(return_to="/research", now=self.now)
        query = parse_qs(urlparse(login.authorization_url).query)

        self.assertEqual(query["response_type"], ["code"])
        self.assertEqual(query["client_id"], ["aiqt"])
        self.assertEqual(query["redirect_uri"], ["https://research.example.com/api/auth/callback"])
        self.assertEqual(query["code_challenge_method"], ["S256"])
        self.assertEqual(query["state"], [login.state_cookie])
        self.assertTrue(query["nonce"][0])

        completed = self.service.complete_callback(
            state=query["state"][0],
            state_cookie=login.state_cookie,
            code="authorization-code",
            now=self.now + timedelta(seconds=5),
        )
        exchanged = self.provider.exchanges[0]
        expected_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(str(exchanged["code_verifier"]).encode()).digest()
        ).decode().rstrip("=")
        self.assertEqual(query["code_challenge"], [expected_challenge])
        self.assertEqual(exchanged["nonce"], query["nonce"][0])
        self.assertEqual(completed.return_to, "/research")
        self.assertTrue(completed.session.session_token)

        replayed = self.service.complete_callback(
            state=query["state"][0],
            state_cookie=login.state_cookie,
            code="authorization-code",
            now=self.now + timedelta(seconds=6),
        )

        self.assertEqual(replayed, completed)
        self.assertEqual(len(self.provider.exchanges), 1)

    def test_callback_is_bound_to_browser_state_cookie(self) -> None:
        login = self.service.begin_login(return_to="https://evil.example", now=self.now)
        with self.assertRaisesRegex(AuthenticationError, "oidc_state_mismatch"):
            self.service.complete_callback(
                state=login.state_cookie,
                state_cookie="different-browser",
                code="authorization-code",
                now=self.now + timedelta(seconds=5),
            )

    def test_callback_can_retry_after_provider_failure(self) -> None:
        login = self.service.begin_login(return_to="/research", now=self.now)
        original_exchange = self.provider.exchange_code
        failures = iter([AuthenticationError("oidc_response_invalid"), None])

        def exchange_code(**parameters):
            failure = next(failures)
            if failure is not None:
                raise failure
            return original_exchange(**parameters)

        self.provider.exchange_code = exchange_code
        with self.assertRaisesRegex(AuthenticationError, "oidc_response_invalid"):
            self.service.complete_callback(
                state=login.state_cookie,
                state_cookie=login.state_cookie,
                code="authorization-code",
                now=self.now + timedelta(seconds=5),
            )

        completed = self.service.complete_callback(
            state=login.state_cookie,
            state_cookie=login.state_cookie,
            code="authorization-code",
            now=self.now + timedelta(seconds=6),
        )

        self.assertEqual(completed.return_to, "/research")
        self.assertTrue(completed.session.session_token)

    def test_pending_oidc_transactions_are_bounded(self) -> None:
        self.service.transactions.max_pending = 1
        self.service.begin_login(now=self.now)

        with self.assertRaisesRegex(
            AuthenticationError,
            "oidc_transaction_capacity_exceeded",
        ):
            self.service.begin_login(now=self.now)

    def test_oidc_state_is_consumed_atomically_across_connections(self) -> None:
        with TemporaryDirectory() as directory:
            engine = create_engine(
                f"sqlite+pysqlite:///{Path(directory) / 'public.db'}",
                connect_args={"check_same_thread": False},
            )
            create_public_schema(engine)
            store = OidcTransactionStore(
                engine,
                TenantSecretCipher(self.config.settings_master_key or ""),
            )
            transaction = store.begin(return_to="/", now=self.now)

            def consume() -> str:
                try:
                    store.consume(transaction.state, now=self.now)
                    return "consumed"
                except AuthenticationError as error:
                    return str(error)

            with ThreadPoolExecutor(max_workers=2) as executor:
                outcomes = list(executor.map(lambda _item: consume(), range(2)))
            engine.dispose()

        self.assertEqual(sorted(outcomes), ["consumed", "oidc_state_invalid"])


class OidcProviderValidationTest(unittest.TestCase):
    def test_provider_validates_signature_issuer_audience_expiry_and_nonce(self) -> None:
        now = datetime(2026, 8, 3, 8, 0, tzinfo=UTC)
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
        public_jwk.update({"kid": "test-key", "use": "sig", "alg": "RS256"})
        token = jwt.encode(
            {"alg": "RS256", "kid": "test-key"},
            {
                "iss": "https://identity.example.com",
                "sub": "subject-1",
                "aud": "aiqt",
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(minutes=5)).timestamp()),
                "nonce": "expected-nonce",
                "email": "user@example.com",
                "email_verified": True,
            },
            private_pem,
        ).decode()

        def respond(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/.well-known/openid-configuration":
                return httpx.Response(
                    200,
                    json={
                        "issuer": "https://identity.example.com",
                        "authorization_endpoint": "https://identity.example.com/authorize",
                        "token_endpoint": "https://identity.example.com/token",
                        "jwks_uri": "https://identity.example.com/jwks",
                    },
                )
            if request.url.path == "/token":
                return httpx.Response(200, json={"id_token": token, "access_token": "access", "token_type": "Bearer"})
            if request.url.path == "/jwks":
                return httpx.Response(200, json={"keys": [public_jwk]})
            return httpx.Response(404)

        client = httpx.Client(transport=httpx.MockTransport(respond))
        provider = OidcProvider(
            issuer="https://identity.example.com",
            client_id="aiqt",
            client_secret="secret",
            http_client=client,
        )
        try:
            identity = provider.exchange_code(
                code="code",
                code_verifier="verifier",
                redirect_uri="https://research.example.com/api/auth/callback",
                nonce="expected-nonce",
                now=now,
            )
            self.assertEqual(identity.subject, "subject-1")
            with self.assertRaises(AuthenticationError):
                provider.exchange_code(
                    code="code",
                    code_verifier="verifier",
                    redirect_uri="https://research.example.com/api/auth/callback",
                    nonce="wrong-nonce",
                    now=now,
                )
        finally:
            client.close()


if __name__ == "__main__":
    unittest.main()
