from __future__ import annotations

import base64
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import json
import secrets
import warnings
from urllib.parse import urlencode, urlparse

from authlib.deprecate import AuthlibDeprecationWarning
with warnings.catch_warnings():
    warnings.simplefilter("ignore", AuthlibDeprecationWarning)
    from authlib.jose import jwt
    from authlib.jose.errors import JoseError
import httpx
from sqlalchemy import delete, insert, select, update
from sqlalchemy.engine import Engine

from quant_core.deployment import DeploymentConfig
from quant_core.public_identity import (
    AuthenticationError,
    PublicIdentityStore,
    PublicSessionStore,
    SessionCredentials,
)
from quant_core.public_schema import oidc_transactions
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenancy import _aware


@dataclass(frozen=True)
class OidcIdentity:
    issuer: str
    subject: str
    email: str
    email_verified: bool


@dataclass(frozen=True)
class AuthLogin:
    authorization_url: str
    state_cookie: str


@dataclass(frozen=True)
class AuthCompletion:
    session: SessionCredentials
    return_to: str


@dataclass(frozen=True)
class _OidcTransaction:
    state: str
    nonce: str
    code_verifier: str
    return_to: str
    purpose: str = "login"
    owner_id: str | None = None


class OidcTransactionStore:
    ttl = timedelta(minutes=10)
    max_pending = 10_000

    def __init__(self, engine: Engine, cipher: TenantSecretCipher):
        self.engine = engine
        self.cipher = cipher

    def begin(
        self,
        *,
        return_to: str,
        now: datetime,
        purpose: str = "login",
        owner_id: str | None = None,
    ) -> _OidcTransaction:
        transaction = _OidcTransaction(
            state=secrets.token_urlsafe(32),
            nonce=secrets.token_urlsafe(32),
            code_verifier=secrets.token_urlsafe(64),
            return_to=_safe_return_to(return_to),
            purpose=purpose,
            owner_id=owner_id,
        )
        state_hash = _hash(transaction.state)
        encrypted = self.cipher.encrypt(
            "oidc",
            state_hash.hex(),
            json.dumps(transaction.__dict__, separators=(",", ":")),
            key_version=1,
        )
        with self.engine.begin() as connection:
            if self.engine.dialect.name == "postgresql":
                connection.exec_driver_sql(
                    "SELECT pg_advisory_xact_lock(1095849054)"
                )
            connection.execute(
                delete(oidc_transactions).where(oidc_transactions.c.expires_at <= now)
            )
            if connection.execute(
                select(oidc_transactions.c.state_hash)
                .order_by(oidc_transactions.c.created_at)
                .limit(1)
                .offset(self.max_pending - 1)
            ).first() is not None:
                raise AuthenticationError("oidc_transaction_capacity_exceeded")
            connection.execute(
                insert(oidc_transactions).values(
                    state_hash=state_hash,
                    encrypted_payload=encrypted,
                    created_at=now,
                    expires_at=now + self.ttl,
                )
            )
        return transaction

    def read(self, state: str, *, now: datetime) -> _OidcTransaction | AuthCompletion:
        state_hash = _hash(state)
        with self.engine.connect() as connection:
            row = connection.execute(
                select(oidc_transactions).where(
                    oidc_transactions.c.state_hash == state_hash
                )
            ).mappings().one_or_none()
            if row is None:
                raise AuthenticationError("oidc_state_invalid")
        return self._decode(state, state_hash, row, now=now)

    def consume(self, state: str, *, now: datetime) -> _OidcTransaction | AuthCompletion:
        state_hash = _hash(state)
        with self.engine.begin() as connection:
            row = connection.execute(
                delete(oidc_transactions)
                .where(oidc_transactions.c.state_hash == state_hash)
                .returning(*oidc_transactions.c)
            ).mappings().one_or_none()
            if row is None:
                raise AuthenticationError("oidc_state_invalid")
        return self._decode(state, state_hash, row, now=now)

    def complete(
        self,
        state: str,
        completion: AuthCompletion,
        *,
        now: datetime,
    ) -> AuthCompletion:
        state_hash = _hash(state)
        encrypted = self.cipher.encrypt(
            "oidc",
            state_hash.hex(),
            json.dumps(
                {
                    "completed": True,
                    "returnTo": completion.return_to,
                    "sessionToken": completion.session.session_token,
                    "csrfToken": completion.session.csrf_token,
                    "absoluteExpiresAt": completion.session.absolute_expires_at.isoformat(),
                },
                separators=(",", ":"),
            ),
            key_version=1,
        )
        with self.engine.begin() as connection:
            changed = connection.execute(
                update(oidc_transactions)
                .where(
                    oidc_transactions.c.state_hash == state_hash,
                    oidc_transactions.c.expires_at > now,
                )
                .values(encrypted_payload=encrypted)
            ).rowcount
        if changed != 1:
            raise AuthenticationError("oidc_state_invalid")
        return completion

    def _decode(
        self,
        state: str,
        state_hash: bytes,
        row,
        *,
        now: datetime,
    ) -> _OidcTransaction | AuthCompletion:
        if now > _aware(row["expires_at"]):
            raise AuthenticationError("oidc_state_expired")
        try:
            payload = json.loads(
                self.cipher.decrypt(
                    "oidc",
                    state_hash.hex(),
                    row["encrypted_payload"],
                    key_version=1,
                )
            )
        except (ValueError, JoseError) as error:
            raise AuthenticationError("oidc_state_invalid") from error
        if payload.get("completed") is True:
            try:
                return AuthCompletion(
                    session=SessionCredentials(
                        session_token=str(payload["sessionToken"]),
                        csrf_token=str(payload["csrfToken"]),
                        absolute_expires_at=datetime.fromisoformat(
                            str(payload["absoluteExpiresAt"])
                        ),
                    ),
                    return_to=str(payload["returnTo"]),
                )
            except (KeyError, TypeError, ValueError) as error:
                raise AuthenticationError("oidc_state_invalid") from error
        if payload.get("state") != state:
            raise AuthenticationError("oidc_state_invalid")
        return _OidcTransaction(**payload)


class OidcProvider:
    def __init__(
        self,
        *,
        issuer: str,
        client_id: str,
        client_secret: str,
        http_client: httpx.Client | None = None,
    ):
        self.issuer = issuer.rstrip("/")
        self.client_id = client_id
        self.client_secret = client_secret
        self.http_client = http_client or httpx.Client(timeout=10, follow_redirects=False)
        self._discovery: dict[str, object] | None = None

    def authorization_url(self, **parameters) -> str:
        discovery = self._discover()
        return f"{discovery['authorization_endpoint']}?{urlencode(parameters)}"

    def exchange_code(
        self,
        *,
        code: str,
        code_verifier: str,
        redirect_uri: str,
        nonce: str,
        now: datetime,
    ) -> OidcIdentity:
        discovery = self._discover()
        try:
            token_response = self.http_client.post(
                str(discovery["token_endpoint"]),
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "code_verifier": code_verifier,
                },
                auth=(self.client_id, self.client_secret),
                headers={"Accept": "application/json"},
            )
            token_response.raise_for_status()
            id_token = str(token_response.json().get("id_token", ""))
            jwks_response = self.http_client.get(str(discovery["jwks_uri"]), headers={"Accept": "application/json"})
            jwks_response.raise_for_status()
            claims = jwt.decode(
                id_token,
                jwks_response.json(),
                claims_options={
                    "iss": {"essential": True, "value": self.issuer},
                    "sub": {"essential": True},
                    "aud": {"essential": True, "value": self.client_id},
                    "exp": {"essential": True},
                    "iat": {"essential": True},
                    "nonce": {"essential": True, "value": nonce},
                    "email": {"essential": True},
                    "email_verified": {"essential": True, "value": True},
                },
            )
            claims.validate(now=int(now.timestamp()), leeway=30)
        except (httpx.HTTPError, JoseError, KeyError, TypeError, ValueError) as error:
            raise AuthenticationError("oidc_response_invalid") from error
        return OidcIdentity(
            issuer=str(claims["iss"]),
            subject=str(claims["sub"]),
            email=str(claims["email"]),
            email_verified=claims["email_verified"] is True,
        )

    def _discover(self) -> dict[str, object]:
        if self._discovery is not None:
            return self._discovery
        try:
            response = self.http_client.get(
                f"{self.issuer}/.well-known/openid-configuration",
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            discovery = response.json()
            if discovery.get("issuer", "").rstrip("/") != self.issuer:
                raise AuthenticationError("oidc_issuer_mismatch")
            for name in ("authorization_endpoint", "token_endpoint", "jwks_uri"):
                if urlparse(str(discovery.get(name, ""))).scheme != "https":
                    raise AuthenticationError("oidc_endpoint_invalid")
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as error:
            raise AuthenticationError("oidc_discovery_invalid") from error
        self._discovery = discovery
        return discovery


class PublicAuthService:
    def __init__(
        self,
        config: DeploymentConfig,
        engine: Engine,
        *,
        provider: OidcProvider | None = None,
        cipher: TenantSecretCipher | None = None,
    ):
        if not config.authentication_required:
            raise ValueError("public auth requires public deployment mode")
        self.config = config
        self.identities = PublicIdentityStore(engine)
        self.sessions = PublicSessionStore(engine)
        state_cipher = cipher or TenantSecretCipher(config.settings_master_key or "")
        self.transactions = OidcTransactionStore(engine, state_cipher)
        self.provider = provider or OidcProvider(
            issuer=config.oidc_issuer or "",
            client_id=config.oidc_client_id or "",
            client_secret=config.oidc_client_secret or "",
        )

    def begin_login(self, *, return_to: str = "/", now: datetime | None = None) -> AuthLogin:
        timestamp = now or datetime.now(timezone.utc)
        transaction = self.transactions.begin(return_to=return_to, now=timestamp)
        return self._authorization(transaction)

    def begin_reauthentication(
        self,
        session_token: str,
        *,
        return_to: str = "/",
        now: datetime | None = None,
    ) -> AuthLogin:
        timestamp = now or datetime.now(timezone.utc)
        context = self.sessions.authenticate(session_token, now=timestamp)
        transaction = self.transactions.begin(
            return_to=return_to,
            now=timestamp,
            purpose="reauthenticate",
            owner_id=context.owner_id,
        )
        return self._authorization(transaction)

    def _authorization(self, transaction: _OidcTransaction) -> AuthLogin:
        challenge = base64.urlsafe_b64encode(hashlib.sha256(transaction.code_verifier.encode()).digest()).decode().rstrip("=")
        return AuthLogin(
            authorization_url=self.provider.authorization_url(
                response_type="code",
                client_id=self.config.oidc_client_id or "",
                redirect_uri=self.config.oidc_callback_url or "",
                scope="openid email profile",
                state=transaction.state,
                nonce=transaction.nonce,
                code_challenge=challenge,
                code_challenge_method="S256",
            ),
            state_cookie=transaction.state,
        )

    def complete_callback(
        self,
        *,
        state: str,
        state_cookie: str,
        code: str,
        session_token: str | None = None,
        now: datetime | None = None,
    ) -> AuthCompletion:
        if not state or not state_cookie or not secrets.compare_digest(state, state_cookie):
            raise AuthenticationError("oidc_state_mismatch")
        timestamp = now or datetime.now(timezone.utc)
        transaction = self.transactions.read(state, now=timestamp)
        if isinstance(transaction, AuthCompletion):
            return transaction
        identity = self.provider.exchange_code(
            code=code,
            code_verifier=transaction.code_verifier,
            redirect_uri=self.config.oidc_callback_url or "",
            nonce=transaction.nonce,
            now=timestamp,
        )
        user = self.identities.register_login(
            issuer=identity.issuer,
            subject=identity.subject,
            email=identity.email,
            email_verified=identity.email_verified,
            now=timestamp,
        )
        if transaction.purpose == "reauthenticate":
            if not session_token or user.owner_id != transaction.owner_id:
                raise AuthenticationError("reauthentication_identity_mismatch")
            session = self.sessions.mark_reauthenticated(
                session_token,
                user.owner_id,
                now=timestamp,
            )
        else:
            session = self.sessions.create(user.owner_id, now=timestamp)
        return self.transactions.complete(
            state,
            AuthCompletion(session=session, return_to=transaction.return_to),
            now=timestamp,
        )


def _safe_return_to(value: str) -> str:
    return value if value.startswith("/") and not value.startswith("//") else "/"


def _hash(value: str) -> bytes:
    return hashlib.sha256(value.encode()).digest()
