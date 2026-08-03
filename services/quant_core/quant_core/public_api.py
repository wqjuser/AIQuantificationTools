from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os
from pathlib import Path
from typing import Awaitable, Callable
from urllib.parse import urlparse

from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import Engine
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, RedirectResponse, Response
from starlette.routing import Route
import uvicorn
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory

from quant_core.deployment import DeploymentConfig
from quant_core.public_auth import PublicAuthService
from quant_core.public_background import PublicBackgroundRunner
from quant_core.public_coordination import PublicRateLimiter, RateLimitPolicy
from quant_core.public_identity import AuthenticationError
from quant_core.public_tenant_api import PublicTenantApi
from quant_core.public_schema import public_metadata
from quant_core.tenancy import TenantContext


TenantHandler = Callable[[Request, TenantContext], Awaitable[Response]]
SESSION_COOKIE = "aiqt_session"
CSRF_COOKIE = "aiqt_csrf"
OIDC_STATE_COOKIE = "aiqt_oidc_state"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, origin: str):
        super().__init__(app)
        self.origin = origin

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        origin = request.headers.get("Origin", "").rstrip("/")
        if origin == self.origin:
            response.headers["Access-Control-Allow-Origin"] = self.origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, X-AIQT-CSRF"
            )
        return response


def create_public_app(
    config: DeploymentConfig,
    engine: Engine,
    *,
    auth_service: PublicAuthService | None = None,
    tenant_handler: TenantHandler | None = None,
    rate_limiter: PublicRateLimiter | None = None,
    enable_background_tasks: bool = False,
) -> Starlette:
    if config.mode != "public" or not config.public_origin:
        raise ValueError("public ASGI app requires public deployment mode")
    auth = auth_service or PublicAuthService(config, engine)
    limiter = rate_limiter or PublicRateLimiter(engine)
    policies = RateLimitPolicy.from_environment(os.environ)
    dispatch = tenant_handler or PublicTenantApi(config, engine)
    background = (
        PublicBackgroundRunner(engine, dispatch)
        if enable_background_tasks and isinstance(dispatch, PublicTenantApi)
        else None
    )
    allowed_host = urlparse(config.public_origin).hostname or ""

    async def health(request: Request) -> Response:
        return JSONResponse({"status": "ok"})

    async def session(request: Request) -> Response:
        session_token = request.cookies.get(SESSION_COOKIE, "")
        if not session_token:
            return JSONResponse({"authenticated": False})
        csrf_token = request.cookies.get(CSRF_COOKIE, "")
        try:
            context = auth.sessions.authenticate(
                session_token,
                csrf_token=csrf_token,
                require_csrf=bool(csrf_token),
            )
            if not csrf_token:
                context, csrf_token = auth.sessions.issue_csrf(session_token)
        except AuthenticationError:
            response = JSONResponse({"authenticated": False})
            _clear_auth_cookies(response)
            return response
        response = JSONResponse(
            {
                "authenticated": True,
                "ownerId": context.owner_id,
                "email": context.email,
                "csrfToken": csrf_token,
                "reauthenticationRequired": not context.reauthenticated_recently(),
            }
        )
        if request.cookies.get(CSRF_COOKIE) != csrf_token:
            _set_csrf_cookie(response, csrf_token)
        return response

    async def login(request: Request) -> Response:
        blocked = _rate_limit(limiter, "login", _client_ip(request), policies["login"])
        if blocked:
            return blocked
        try:
            result = auth.begin_login(return_to=request.query_params.get("returnTo", "/"))
        except AuthenticationError as error:
            return _error(str(error), 503)
        response = RedirectResponse(result.authorization_url, status_code=307)
        response.set_cookie(
            OIDC_STATE_COOKIE,
            result.state_cookie,
            max_age=600,
            path="/api/auth",
            secure=True,
            httponly=True,
            samesite="lax",
        )
        return response

    async def reauthenticate(request: Request) -> Response:
        blocked = _rate_limit(limiter, "login", _client_ip(request), policies["login"])
        if blocked:
            return blocked
        session_token = request.cookies.get(SESSION_COOKIE, "")
        if not session_token:
            return _error("authentication_required", 401)
        try:
            result = auth.begin_reauthentication(
                session_token,
                return_to=request.query_params.get("returnTo", "/"),
            )
        except AuthenticationError as error:
            return _error(
                str(error),
                503 if str(error) == "oidc_transaction_capacity_exceeded" else 401,
            )
        response = RedirectResponse(result.authorization_url, status_code=307)
        response.set_cookie(
            OIDC_STATE_COOKIE,
            result.state_cookie,
            max_age=600,
            path="/api/auth",
            secure=True,
            httponly=True,
            samesite="lax",
        )
        return response

    async def callback(request: Request) -> Response:
        blocked = _rate_limit(limiter, "login", _client_ip(request), policies["login"])
        if blocked:
            return blocked
        try:
            completed = auth.complete_callback(
                state=request.query_params.get("state", ""),
                state_cookie=request.cookies.get(OIDC_STATE_COOKIE, ""),
                code=request.query_params.get("code", ""),
                session_token=request.cookies.get(SESSION_COOKIE),
            )
        except AuthenticationError as error:
            return _error(str(error), 401)
        response = RedirectResponse(completed.return_to, status_code=303)
        max_age = max(
            0,
            int((completed.session.absolute_expires_at - datetime.now(timezone.utc)).total_seconds()),
        )
        response.set_cookie(
            SESSION_COOKIE,
            completed.session.session_token,
            max_age=max_age,
            path="/",
            secure=True,
            httponly=True,
            samesite="lax",
        )
        _set_csrf_cookie(response, completed.session.csrf_token, max_age=max_age)
        response.delete_cookie(OIDC_STATE_COOKIE, path="/api/auth", secure=True, httponly=True, samesite="lax")
        return response

    async def logout(request: Request) -> Response:
        blocked = _mutation_blocker(request, config)
        if blocked:
            return blocked
        session_token = request.cookies.get(SESSION_COOKIE, "")
        try:
            tenant = auth.sessions.authenticate(
                session_token,
                csrf_token=request.headers.get("X-AIQT-CSRF"),
                require_csrf=True,
            )
        except AuthenticationError as error:
            return _error(str(error), 403 if str(error) == "csrf_invalid" else 401)
        blocked = _rate_limit(limiter, "mutation", tenant.owner_id, policies["mutation"])
        if blocked:
            return blocked
        auth.sessions.revoke(session_token)
        response = JSONResponse({"loggedOut": True})
        _clear_auth_cookies(response)
        return response

    async def tenant_route(request: Request) -> Response:
        if request.method == "OPTIONS":
            if request.headers.get("Origin", "").rstrip("/") != config.public_origin:
                return _error("origin_not_allowed", 403)
            return Response(status_code=204)
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            blocked = _mutation_blocker(request, config)
            if blocked:
                return blocked
            blocked = _request_size_blocker(request)
            if blocked:
                return blocked
        elif request.headers.get("Origin", "").rstrip("/") not in {"", config.public_origin}:
            return _error("origin_not_allowed", 403)
        session_token = request.cookies.get(SESSION_COOKIE, "")
        try:
            tenant = auth.sessions.authenticate(
                session_token,
                csrf_token=request.headers.get("X-AIQT-CSRF"),
                require_csrf=request.method in {"POST", "PUT", "PATCH", "DELETE"},
            )
        except AuthenticationError as error:
            return _error(str(error), 403 if str(error) == "csrf_invalid" else 401)
        request.state.tenant = tenant
        request.state.authenticated_actor = tenant.authenticated_actor
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            try:
                payload = await request.json()
            except ValueError:
                return _error("request_body_must_be_json", 400)
            if _contains_forged_actor(payload, tenant.authenticated_actor):
                return _error("authenticated_actor_mismatch", 403)
            if _requires_recent_reauthentication(request.url.path, payload) and not tenant.reauthenticated_recently():
                return _error("reauthentication_required", 428)
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            blocked = _rate_limit(limiter, "mutation", tenant.owner_id, policies["mutation"])
            if blocked:
                return blocked
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and (request.url.path in {
            "/api/market/ai-selections",
            "/api/market/ai-selection-reviews",
            "/api/ai-reviews",
            "/api/p0/ai-reviews",
        } or request.url.path.endswith("/ai-reviews")):
            blocked = _rate_limit(limiter, "ai", tenant.owner_id, policies["ai"])
            if blocked:
                return blocked
        if request.url.path == "/api/research/runs/import":
            blocked = _rate_limit(limiter, "import", tenant.owner_id, policies["import"])
            if blocked:
                return blocked
        return await dispatch(request, tenant)

    routes = [
        Route("/health", health, methods=["GET"]),
        Route("/api/auth/session", session, methods=["GET"]),
        Route("/api/auth/login", login, methods=["GET"]),
        Route("/api/auth/callback", callback, methods=["GET"]),
        Route("/api/auth/logout", logout, methods=["POST"]),
        Route("/api/auth/reauthenticate", reauthenticate, methods=["GET"]),
        Route("/{path:path}", tenant_route, methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]),
    ]
    @asynccontextmanager
    async def lifespan(_app):
        if background is not None:
            background.start()
        try:
            yield
        finally:
            if background is not None:
                background.stop()

    app = Starlette(
        routes=routes,
        lifespan=lifespan,
        middleware=[
            Middleware(SecurityHeadersMiddleware, origin=config.public_origin),
            Middleware(TrustedHostMiddleware, allowed_hosts=[allowed_host, "127.0.0.1", "localhost"]),
        ],
    )
    return app


def run_public_api(
    config: DeploymentConfig,
    *,
    host: str | None = None,
    port: int | str | None = None,
) -> None:
    engine = create_engine(config.database_url or "", pool_pre_ping=True)
    _require_public_schema(engine)
    try:
        bind_port = int(port or os.environ.get("QUANT_CORE_PORT", "8765"))
    except ValueError:
        bind_port = 8765
    uvicorn.run(
        create_public_app(config, engine, enable_background_tasks=True),
        host=host or os.environ.get("QUANT_CORE_HOST", "0.0.0.0"),
        port=bind_port,
        proxy_headers=True,
        forwarded_allow_ips=os.environ.get("AIQT_TRUSTED_PROXY_IPS", "127.0.0.1"),
    )


def _mutation_blocker(request: Request, config: DeploymentConfig) -> Response | None:
    if request.headers.get("Origin", "").rstrip("/") != config.public_origin:
        return _error("origin_not_allowed", 403)
    if request.headers.get("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
        return _error("application_json_required", 415)
    return None


def _request_size_blocker(request: Request) -> Response | None:
    raw = request.headers.get("Content-Length")
    if raw is None or not raw.isascii() or not raw.isdecimal():
        return _error("request_body_invalid_content_length", 400)
    if int(raw) > 10_000_000:
        return _error("request_body_too_large", 413)
    return None


def _error(code: str, status: int) -> JSONResponse:
    return JSONResponse({"error": code}, status_code=status)


def _rate_limit(
    limiter: PublicRateLimiter,
    scope: str,
    subject: str,
    policy: RateLimitPolicy,
) -> Response | None:
    decision = limiter.check(scope, subject, policy)
    if decision.allowed:
        return None
    response = _error("rate_limit_exceeded", 429)
    response.headers["Retry-After"] = str(decision.retry_after_seconds)
    return response


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _contains_forged_actor(payload: object, authenticated_actor: str) -> bool:
    actor_fields = {"operator", "reviewer", "author", "approvedBy", "liveOperator"}
    return isinstance(payload, dict) and any(
        key in actor_fields
        and value != authenticated_actor
        for key, value in payload.items()
    )


def _requires_recent_reauthentication(path: str, payload: object) -> bool:
    if path == "/api/settings/configuration":
        if not isinstance(payload, dict):
            return False
        production_secrets = {
            "ccxtProductionReadonlyApiKey",
            "ccxtProductionReadonlySecret",
            "ccxtProductionTradingApiKey",
            "ccxtProductionTradingSecret",
        }
        configuration = payload.get("configuration")
        updates = payload.get("secretUpdates")
        cleared = payload.get("clearSecrets")
        return (
            isinstance(configuration, dict)
            and configuration.get("productionTradingEnabled") is True
        ) or (
            isinstance(updates, dict)
            and bool(production_secrets & set(updates))
        ) or (
            isinstance(cleared, list)
            and bool(production_secrets & {item for item in cleared if isinstance(item, str)})
        )
    return (
        path == "/api/execution/auto-paper-trading"
        or path.startswith("/api/execution/stage10/")
    )


def _set_csrf_cookie(response: Response, value: str, *, max_age: int = 43_200) -> None:
    response.set_cookie(
        CSRF_COOKIE,
        value,
        max_age=max_age,
        path="/",
        secure=True,
        httponly=False,
        samesite="lax",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/", secure=True, httponly=True, samesite="lax")
    response.delete_cookie(CSRF_COOKIE, path="/", secure=True, httponly=False, samesite="lax")


async def _unavailable_tenant_handler(request: Request, tenant: TenantContext) -> Response:
    return _error("public_tenant_storage_not_ready", 503)


def _require_public_schema(engine: Engine) -> None:
    missing = set(public_metadata.tables) - set(inspect(engine).get_table_names())
    if missing:
        raise RuntimeError(f"public database migration required: {', '.join(sorted(missing))}")
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    expected = ScriptDirectory.from_config(config).get_current_head()
    with engine.connect() as connection:
        current = MigrationContext.configure(connection).get_current_revision()
    if current != expected:
        raise RuntimeError(f"public database migration required: current={current} expected={expected}")
