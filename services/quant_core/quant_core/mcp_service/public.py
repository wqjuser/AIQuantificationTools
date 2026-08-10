from __future__ import annotations

import asyncio
import base64
from collections.abc import Callable
from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
import json
import re
from typing import Any, Mapping
from urllib.parse import urlparse
import warnings

import httpx
from authlib.deprecate import AuthlibDeprecationWarning
with warnings.catch_warnings():
    warnings.simplefilter("ignore", AuthlibDeprecationWarning)
    from authlib.jose import JoseError, JsonWebToken
from mcp.server import MCPServer
from mcp.server.auth.provider import AccessToken, TokenVerifier
from mcp.server.auth.middleware.auth_context import get_access_token
from mcp.server.auth.settings import AuthSettings
from mcp.shared.exceptions import MCPError
from sqlalchemy.engine import Engine
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import Receive, Scope, Send

from quant_core.deployment import DeploymentConfig
from quant_core.mcp_service.api_client import QuantApiClient
from quant_core.mcp_service.config import McpServiceSettings
from quant_core.mcp_service.server import create_mcp_server
from quant_core.public_identity import AuthenticationError, PublicIdentityStore
from quant_core.public_coordination import PublicRateLimiter, RateLimitPolicy
from quant_core.public_tenant_api import PublicTenantApi
from quant_core.tenancy import TenantContext


UTC = timezone.utc
_JWT = JsonWebToken(["RS256", "ES256"])
_JWKS_TTL = timedelta(minutes=5)
_JWKS_REFRESH_COOLDOWN = timedelta(seconds=30)
_PUBLIC_TENANT_READ_PATHS = frozenset(
    {
        "/health",
        "/api/market/search",
        "/api/market/quotes",
        "/api/market/klines",
        "/api/market/data-readiness",
        "/api/market/calendar",
        "/api/research/runs",
        "/api/strategy-research/capabilities",
        "/api/audit/events",
    }
)
_PUBLIC_TENANT_READ_PATH_PATTERNS = (
    re.compile(r"^/api/research/runs/(?P<identifier>[A-Za-z0-9_.:-]{1,200})$"),
    re.compile(
        r"^/api/strategy-research/experiments/"
        r"(?P<identifier>[A-Za-z0-9_.:-]{1,200})$"
    ),
    re.compile(r"^/api/ai-reviews/(?P<identifier>[A-Za-z0-9_.:-]{1,200})$"),
)


@dataclass(frozen=True)
class PublicMcpAuthConfig:
    issuer_url: str
    resource_url: str
    read_scope: str = "aiqt:research:read"
    request_limit_per_minute: int = 120

    def __post_init__(self) -> None:
        object.__setattr__(self, "issuer_url", _https_url(self.issuer_url, allow_path=True))
        object.__setattr__(self, "resource_url", _https_url(self.resource_url, allow_path=True))
        if not self.read_scope.strip() or any(character.isspace() for character in self.read_scope):
            raise ValueError("mcp_oauth_scope_invalid")
        if (
            isinstance(self.request_limit_per_minute, bool)
            or not 1 <= self.request_limit_per_minute <= 120
        ):
            raise ValueError("mcp_rate_limit_invalid")

    @classmethod
    def from_environment(
        cls,
        deployment: DeploymentConfig,
        environment: Mapping[str, str],
    ) -> "PublicMcpAuthConfig":
        if (
            deployment.mode != "public"
            or not deployment.public_origin
            or not deployment.oidc_issuer
        ):
            raise ValueError("mcp_public_deployment_required")
        configured_resource = str(
            environment.get("AIQT_MCP_PUBLIC_RESOURCE_URL", "")
        ).strip()
        resource_url = configured_resource or f"{deployment.public_origin}/mcp"
        normalized_resource = _https_url(resource_url, allow_path=True)
        resource = urlparse(normalized_resource)
        public_origin = urlparse(deployment.public_origin)
        if (resource.scheme, resource.netloc) != (
            public_origin.scheme,
            public_origin.netloc,
        ):
            raise ValueError("mcp_oauth_resource_origin_mismatch")
        if resource.path != "/mcp":
            raise ValueError("mcp_oauth_resource_path_invalid")
        return cls(
            issuer_url=deployment.oidc_issuer,
            resource_url=normalized_resource,
            request_limit_per_minute=_tightened_rate_limit(
                environment.get("AIQT_MCP_RATE_LIMIT_REQUESTS_1M")
            ),
        )


class PublicMcpTokenVerifier:
    """Validate audience-bound JWT access tokens and map them to server tenants."""

    def __init__(
        self,
        config: PublicMcpAuthConfig,
        identities: PublicIdentityStore,
        *,
        http_client: httpx.AsyncClient | None = None,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self.config = config
        self.identities = identities
        self.http_client = http_client or httpx.AsyncClient(
            timeout=10,
            follow_redirects=False,
        )
        self.clock = clock or (lambda: datetime.now(UTC))
        self._discovery: dict[str, Any] | None = None
        self._jwks: dict[str, Any] | None = None
        self._jwks_loaded_at: datetime | None = None
        self._jwks_retry_after: datetime | None = None
        self._metadata_lock = asyncio.Lock()

    async def verify_token(self, token: str) -> AccessToken | None:
        if not token or len(token) > 16_384:
            return None
        try:
            header = _jwt_header(token)
            key_id = _required_header(header, "kid")
            algorithm = _required_header(header, "alg")
            if algorithm not in {"RS256", "ES256"}:
                return None
            jwks = await self._load_jwks()
            matching = _matching_jwks(jwks, key_id=key_id, algorithm=algorithm)
            if not matching:
                jwks = await self._load_jwks(refresh_for_unknown_kid=True)
                matching = _matching_jwks(
                    jwks,
                    key_id=key_id,
                    algorithm=algorithm,
                )
            if not matching:
                return None
            claims = self._decode(token, {"keys": matching})
        except (httpx.HTTPError, JoseError, KeyError, TypeError, ValueError):
            return None

        scopes = _scopes(claims.get("scope"))
        client_id = claims.get("client_id", claims.get("azp"))
        if not isinstance(client_id, str) or not client_id.strip():
            return None
        subject = claims.get("sub")
        if not isinstance(subject, str) or not subject.strip():
            return None
        try:
            issued_at = int(claims["iat"])
            expires_at = int(claims["exp"])
            user = await asyncio.to_thread(
                self.identities.require_active_identity,
                issuer=str(claims["iss"]),
                subject=subject,
            )
        except (AuthenticationError, KeyError, TypeError, ValueError):
            return None
        return AccessToken(
            token=token,
            client_id=client_id.strip(),
            scopes=scopes,
            expires_at=expires_at,
            resource=self.config.resource_url,
            subject=user.subject,
            claims={
                "iss": user.issuer,
                "owner_id": user.owner_id,
                "email": user.email,
                "reauthenticated_at": datetime.fromtimestamp(
                    issued_at,
                    tz=UTC,
                ).isoformat(),
            },
        )

    async def aclose(self) -> None:
        await self.http_client.aclose()

    def _decode(self, token: str, jwks: Mapping[str, Any]) -> Mapping[str, Any]:
        claims = _JWT.decode(
            token,
            jwks,
            claims_options={
                "iss": {"essential": True, "value": self.config.issuer_url},
                "sub": {"essential": True},
                "aud": {"essential": True, "value": self.config.resource_url},
                "exp": {"essential": True},
                "iat": {"essential": True},
            },
        )
        claims.validate(now=int(self.clock().timestamp()), leeway=30)
        return claims

    async def _load_jwks(
        self,
        *,
        refresh_for_unknown_kid: bool = False,
    ) -> dict[str, Any]:
        async with self._metadata_lock:
            now = self.clock()
            cache_fresh = (
                self._jwks is not None
                and self._jwks_loaded_at is not None
                and now - self._jwks_loaded_at < _JWKS_TTL
            )
            if cache_fresh and not refresh_for_unknown_kid:
                return self._jwks
            if self._jwks_retry_after is not None and now < self._jwks_retry_after:
                if cache_fresh and self._jwks is not None:
                    return self._jwks
                raise ValueError("mcp_oidc_jwks_refresh_deferred")
            self._jwks_retry_after = now + _JWKS_REFRESH_COOLDOWN
            if self._discovery is None:
                response = await self.http_client.get(
                    f"{self.config.issuer_url}/.well-known/openid-configuration",
                    headers={"Accept": "application/json"},
                )
                response.raise_for_status()
                discovery = response.json()
                if not isinstance(discovery, dict):
                    raise ValueError("mcp_oidc_discovery_invalid")
                if str(discovery.get("issuer", "")).rstrip("/") != self.config.issuer_url:
                    raise ValueError("mcp_oidc_issuer_mismatch")
                jwks_uri = _https_url(discovery.get("jwks_uri"), allow_path=True)
                self._discovery = {**discovery, "jwks_uri": jwks_uri}
            response = await self.http_client.get(
                str(self._discovery["jwks_uri"]),
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            jwks = response.json()
            if (
                not isinstance(jwks, dict)
                or not isinstance(jwks.get("keys"), list)
                or not jwks["keys"]
            ):
                raise ValueError("mcp_oidc_jwks_invalid")
            self._jwks = jwks
            self._jwks_loaded_at = now
            return self._jwks


class _PublicTenantGateway:
    def __init__(self, tenant_api: PublicTenantApi) -> None:
        self.tenant_api = tenant_api

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await JSONResponse({"error": "mcp_tenant_gateway_http_required"}, status_code=400)(
                scope,
                receive,
                send,
            )
            return
        method = str(scope.get("method") or "").upper()
        path = str(scope.get("path") or "")
        if method != "GET" or not _public_tenant_read_path_allowed(path):
            await JSONResponse(
                {"error": "mcp_tenant_route_forbidden"},
                status_code=403,
            )(scope, receive, send)
            return
        tenant = _tenant_from_access_token()
        if tenant is None:
            await JSONResponse({"error": "mcp_tenant_context_missing"}, status_code=401)(
                scope,
                receive,
                send,
            )
            return
        if path == "/health":
            await JSONResponse(
                {"status": "ok", "service": "quant-core-public-tenant"}
            )(scope, receive, send)
            return
        request = Request(scope, receive=receive)
        response = await self.tenant_api(request, tenant)
        await response(scope, receive, send)


class PublicMcpRateLimitMiddleware:
    def __init__(
        self,
        limiter: PublicRateLimiter,
        config: PublicMcpAuthConfig,
    ) -> None:
        self.limiter = limiter
        self.policy = RateLimitPolicy(
            config.request_limit_per_minute,
            timedelta(minutes=1),
        )

    async def __call__(self, context, call_next):
        if (
            context.request_id is None
            or context.method not in {"initialize", "tools/call", "resources/read"}
        ):
            return await call_next(context)
        access_token = get_access_token()
        claims = access_token.claims if access_token is not None else None
        if not isinstance(claims, Mapping):
            raise MCPError(-32001, "mcp_tenant_context_missing")
        try:
            owner_id = _required_claim(claims, "owner_id")
        except ValueError as error:
            raise MCPError(-32001, "mcp_tenant_context_missing") from error
        decision = await asyncio.to_thread(
            self.limiter.check,
            "mcp_research_read",
            owner_id,
            self.policy,
        )
        if not decision.allowed:
            raise MCPError(
                -32002,
                "mcp_rate_limit_exceeded",
                {"retryAfterSeconds": decision.retry_after_seconds},
            )
        return await call_next(context)


class _PublicResearchApiClient(QuantApiClient):
    async def paper_status(self) -> dict[str, Any]:
        return {
            "available": False,
            "status": "unavailable",
            "reason": "public_mcp_paper_runtime_not_exposed",
        }


def create_public_mcp_server(
    *,
    settings: McpServiceSettings,
    deployment: DeploymentConfig,
    engine: Engine,
    auth_config: PublicMcpAuthConfig,
    token_verifier: TokenVerifier | None = None,
    tenant_api: PublicTenantApi | None = None,
    rate_limiter: PublicRateLimiter | None = None,
) -> MCPServer:
    if (
        deployment.mode != "public"
        or not deployment.public_origin
        or deployment.settings_master_key is not None
    ):
        raise ValueError("mcp_public_deployment_required")
    if deployment.oidc_issuer != auth_config.issuer_url:
        raise ValueError("mcp_oauth_issuer_mismatch")
    if auth_config.resource_url != f"{deployment.public_origin.rstrip('/')}/mcp":
        raise ValueError("mcp_oauth_resource_mismatch")
    identities = PublicIdentityStore(engine)
    owns_verifier = token_verifier is None
    verifier = token_verifier or PublicMcpTokenVerifier(auth_config, identities)
    public_tenant_api = tenant_api or PublicTenantApi(
        deployment,
        engine,
        research_only=True,
    )
    public_settings = replace(
        settings,
        api_base_url="http://public-tenant.internal",
        api_cookie=None,
        api_csrf_token=None,
        api_origin=None,
        operator=None,
        research_writes_enabled=False,
    )
    api = _PublicResearchApiClient(
        public_settings,
        transport=httpx.ASGITransport(app=_PublicTenantGateway(public_tenant_api)),
    )
    return create_mcp_server(
        settings=public_settings,
        api=api,
        token_verifier=verifier,
        auth=AuthSettings(
            issuer_url=auth_config.issuer_url,
            resource_server_url=auth_config.resource_url,
            required_scopes=[auth_config.read_scope],
        ),
        closeables=(verifier,) if owns_verifier else (),
        expose_research_write_tools=False,
        middleware=(
            PublicMcpRateLimitMiddleware(
                rate_limiter or PublicRateLimiter(engine),
                auth_config,
            ),
        ),
    )


def _tenant_from_access_token() -> TenantContext | None:
    access_token = get_access_token()
    claims = access_token.claims if access_token is not None else None
    if not isinstance(claims, Mapping):
        return None
    try:
        owner_id = _required_claim(claims, "owner_id")
        issuer = _required_claim(claims, "iss")
        email = _required_claim(claims, "email")
        raw_subject = access_token.subject
        if not isinstance(raw_subject, str):
            raise ValueError("mcp_token_subject_invalid")
        subject = raw_subject.strip()
        reauthenticated_at = datetime.fromisoformat(
            _required_claim(claims, "reauthenticated_at")
        )
    except (TypeError, ValueError):
        return None
    if not subject or reauthenticated_at.tzinfo is None:
        return None
    return TenantContext(
        owner_id=owner_id,
        issuer=issuer,
        subject=subject,
        email=email,
        reauthenticated_at=reauthenticated_at,
    )


def _required_claim(claims: Mapping[str, Any], name: str) -> str:
    value = claims.get(name)
    if not isinstance(value, str) or not value.strip():
        raise ValueError("mcp_token_claim_invalid")
    return value.strip()


def _scopes(value: object) -> list[str]:
    if isinstance(value, str):
        scopes = value.split()
    elif isinstance(value, list) and all(isinstance(item, str) for item in value):
        scopes = list(value)
    else:
        return []
    return list(dict.fromkeys(scope for scope in scopes if scope))


def _https_url(value: object, *, allow_path: bool) -> str:
    if not isinstance(value, str):
        raise ValueError("mcp_oauth_url_invalid")
    normalized = value.strip().rstrip("/")
    parsed = urlparse(normalized)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or (not allow_path and parsed.path not in {"", "/"})
    ):
        raise ValueError("mcp_oauth_url_invalid")
    return normalized


def _tightened_rate_limit(value: object) -> int:
    try:
        configured = int(str(value or ""))
    except ValueError:
        return 120
    return min(configured, 120) if configured > 0 else 120


def _jwt_header(token: str) -> Mapping[str, Any]:
    segments = token.split(".")
    if len(segments) != 3 or not segments[0] or len(segments[0]) > 2_048:
        raise ValueError("mcp_jwt_header_invalid")
    padding = "=" * (-len(segments[0]) % 4)
    decoded = base64.urlsafe_b64decode((segments[0] + padding).encode())
    header = json.loads(decoded)
    if not isinstance(header, dict):
        raise ValueError("mcp_jwt_header_invalid")
    return header


def _required_header(header: Mapping[str, Any], name: str) -> str:
    value = header.get(name)
    if (
        not isinstance(value, str)
        or not value
        or value.strip() != value
        or len(value) > 256
    ):
        raise ValueError("mcp_jwt_header_invalid")
    return value


def _matching_jwks(
    jwks: Mapping[str, Any],
    *,
    key_id: str,
    algorithm: str,
) -> list[Mapping[str, Any]]:
    keys = jwks.get("keys")
    if not isinstance(keys, list):
        return []
    return [
        key
        for key in keys
        if isinstance(key, Mapping)
        and key.get("kid") == key_id
        and key.get("alg") in {None, algorithm}
        and key.get("use") in {None, "sig"}
    ]


def _public_tenant_read_path_allowed(path: str) -> bool:
    if path in _PUBLIC_TENANT_READ_PATHS:
        return True
    for pattern in _PUBLIC_TENANT_READ_PATH_PATTERNS:
        match = pattern.fullmatch(path)
        if match is not None and match.group("identifier") not in {".", ".."}:
            return True
    return False
