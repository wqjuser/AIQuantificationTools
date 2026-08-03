from __future__ import annotations

from contextlib import nullcontext
from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path
import socket
import tempfile
from threading import RLock
from typing import Any, Callable, Mapping
from urllib.parse import urlparse
from uuid import uuid4

from sqlalchemy.engine import Connection, Engine
from starlette.concurrency import run_in_threadpool
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from quant_core.deployment import DeploymentConfig
from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.http_api.handler import ComposedQuantApiHandler
from quant_core.http_api.support.handler_services import build_market_ai_selection_service
from quant_core.http_api.support.market_data import evaluate_auto_paper_trading_once
from quant_core.http_api.support.runtime import _build_auto_paper_trading_service
from quant_core.http_api.support.transport import _response
from quant_core.live_quotes import QuantDingerLiveQuoteAdapter
from quant_core.market_discovery import MarketDiscoveryService
from quant_core.market_information import MarketInformationService
from quant_core.market_klines import QuantDingerKlineAdapter
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenant_store_adapters import PublicTenantStores
from quant_core.tenant_storage import ProductionAccountClaimError
from quant_core.tenancy import TenantContext
from quant_core.stage10_production_execution import BinanceSpotProductionTradingRoute


_REPORT_PATH_ATTRIBUTES = (
    "p0_acceptance_report_path",
    "p1_acceptance_report_path",
    "p2_pre_live_acceptance_report_path",
    "p2_paper_replay_report_path",
    "p2_readiness_acceptance_report_path",
    "stage5_exit_acceptance_report_path",
    "stage6_exit_acceptance_report_path",
    "p2_manifest_chain_preflight_report_path",
    "desktop_release_report_path",
    "stage1_daily_use_report_path",
    "stage1_bootstrap_preflight_report_path",
)
_PUBLIC_LOCAL_FILE_ROUTES = {
    "/api/execution/adapter-secret-materializations",
    "/api/execution/adapter-secret-manifest-validations",
    "/api/execution/adapter-environment-bindings",
    "/api/audit/signing-keys/secret-materializations",
    "/api/audit/signing-keys/environment-bindings",
}
_ACTOR_FIELDS = ("operator", "reviewer", "author", "approvedBy", "liveOperator")


@dataclass
class _TenantRuntime:
    stores: PublicTenantStores
    handler_type: type["PublicBridgeHandler"]
    lock: RLock


class PublicBridgeHandler(ComposedQuantApiHandler):
    def _read_json_body(self) -> dict[str, object]:
        payload = super()._read_json_body()
        actor = str(self.authenticated_actor)
        present = [field for field in _ACTOR_FIELDS if field in payload]
        for field in _ACTOR_FIELDS:
            payload.pop(field, None)
        required = _legacy_default_actor_field(urlparse(self.path).path)
        if required:
            payload[required] = actor
        else:
            for field in present:
                payload[field] = actor
        return payload

    def _send_json(self, payload: object, status: int = 200) -> None:
        self._captured_status = status
        self._captured_content_type = "application/json; charset=utf-8"
        self._captured_body = _response(payload)

    def _begin_ndjson_stream(self) -> None:
        self._captured_status = 200
        self._captured_content_type = "application/x-ndjson; charset=utf-8"
        self._captured_body = b""

    def _send_ndjson_event(self, payload: object) -> bool:
        self._captured_body += _response(payload) + b"\n"
        return True


class PublicTenantApi:
    def __init__(self, config: DeploymentConfig, engine: Engine):
        if not config.settings_master_key:
            raise ValueError("public tenant API requires settings master key")
        self.config = config
        self.engine = engine
        self.cipher = TenantSecretCipher(config.settings_master_key)
        self.allowed_outbound_origins = tuple(
            value.strip()
            for value in os.environ.get("AIQT_OUTBOUND_ORIGIN_ALLOWLIST", "").split(",")
            if value.strip()
        )
        self._runtimes: dict[str, _TenantRuntime] = {}
        self._runtime_lock = RLock()

    async def __call__(self, request: Request, tenant: TenantContext) -> Response:
        if request.url.path.startswith("/api/settings/dependencies/"):
            return JSONResponse(
                {"error": "public_optional_dependency_install_admin_only"},
                status_code=403,
            )
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and request.url.path in _PUBLIC_LOCAL_FILE_ROUTES:
            return JSONResponse(
                {"error": "public_local_file_workflow_disabled"},
                status_code=403,
            )
        runtime = self._runtime(tenant)
        body = await request.body()
        return await run_in_threadpool(
            self._dispatch_request,
            runtime,
            request,
            tenant,
            body,
        )

    def _dispatch_request(
        self,
        runtime: _TenantRuntime,
        request: Request,
        tenant: TenantContext,
        body: bytes,
    ) -> Response:
        # ponytail: serialize mutations; add endpoint locks only if a legacy GET
        # starts writing shared report artifacts.
        request_lock = runtime.lock if request.method != "GET" else nullcontext()
        with request_lock:
            self._restore_report_files(runtime)
            action = _production_control_action(request, body)
            credentials_changed = _production_credentials_changed(request, body)
            fingerprint = None
            claim_created = False
            if action == "restore":
                environment = runtime.stores.platform_settings_store.effective_environment(
                    _public_platform_environment(os.environ)
                )
                try:
                    fingerprint = BinanceSpotProductionTradingRoute(
                        env=environment,
                        exchange_factory=runtime.handler_type.execution_adapter_health_exchange_factory,
                    ).account_identity_fingerprint()
                    claim_created = runtime.stores.production_accounts.claim(
                        tenant.owner_id,
                        fingerprint,
                    )
                except (ProductionAccountClaimError, ValueError) as error:
                    return JSONResponse(
                        {
                            "error": "stage10_production_account_claim_blocked",
                            "blockers": [str(error)],
                        },
                        status_code=409,
                    )
            if credentials_changed:
                try:
                    _invalidate_production_access(
                        runtime,
                        tenant.authenticated_actor,
                    )
                except Exception:
                    return JSONResponse(
                        {"error": "production_credentials_invalidation_failed"},
                        status_code=409,
                    )
            handler = self._handler(runtime.handler_type, request, body, tenant)
            try:
                parsed = urlparse(handler.path)
                dispatch = getattr(handler, f"_dispatch_{request.method.lower()}", None)
                handled = bool(dispatch(parsed)) if callable(dispatch) else False
                if not handled:
                    handler._send_json({"error": "not_found"}, status=404)
            except Exception:
                handler._send_json({"error": "public_tenant_route_failed"}, status=500)
            finally:
                self._persist_report_files(runtime)
                handler.connection.close()
                handler._connection_peer.close()
            if handler._captured_status >= 400 and claim_created and fingerprint:
                runtime.stores.production_accounts.release(tenant.owner_id, fingerprint)
            elif action == "revoke" and handler._captured_status < 400:
                runtime.stores.production_accounts.release_owner(tenant.owner_id)
            elif (
                handler._captured_status < 400
                and credentials_changed
            ):
                runtime.stores.production_accounts.release_owner(tenant.owner_id)
            return Response(
                handler._captured_body,
                status_code=handler._captured_status,
                media_type=handler._captured_content_type.split(";", 1)[0],
            )

    def review_due_selections(
        self,
        tenant: TenantContext,
        *,
        lease_guard: Callable[[], bool] | None = None,
        lease_fence: Callable[[Connection], bool] | None = None,
    ) -> dict[str, Any]:
        runtime = self._runtime(tenant)
        with runtime.lock:
            environment = runtime.stores.platform_settings_store.effective_environment(
                _public_platform_environment(os.environ)
            )
            service = build_market_ai_selection_service(
                runtime.handler_type,
                environment=environment,
                provider_registry=AiReviewProviderRegistry.from_environment(environment),
            )
            runtime.stores.records.write_fence = lease_fence
            try:
                return service.review_due_selections(lease_guard=lease_guard)
            finally:
                runtime.stores.records.write_fence = None

    def process_auto_trading_once(
        self,
        tenant: TenantContext,
        *,
        lease_guard: Callable[[], bool] | None = None,
        lease_fence: Callable[[Connection], bool] | None = None,
    ) -> dict[str, Any]:
        runtime = self._runtime(tenant)
        with runtime.lock:
            _require_lease(lease_guard)
            service = runtime.handler_type.auto_paper_trading_service
            if service is None:
                service = _build_auto_paper_trading_service(runtime.handler_type)
                runtime.handler_type.auto_paper_trading_service = service
            runtime.stores.records.write_fence = lease_fence
            service.execution_guard = lease_guard
            if service.production is not None:
                service.production.execution_guard = lease_guard
            try:
                reconciled = service.reconcile_pending_order()
                if not reconciled and service.snapshot()["state"]["enabled"]:
                    _require_lease(lease_guard)
                    evaluate_auto_paper_trading_once(
                        service,
                        cache=runtime.handler_type.cache,
                        adapter=runtime.handler_type.kline_adapter,
                    )
                return service.snapshot()
            finally:
                runtime.stores.records.write_fence = None
                service.execution_guard = None
                if service.production is not None:
                    service.production.execution_guard = None

    def _runtime(self, tenant: TenantContext) -> _TenantRuntime:
        with self._runtime_lock:
            existing = self._runtimes.get(tenant.owner_id)
            if existing is not None:
                return existing
            stores = PublicTenantStores.create(
                self.engine,
                tenant,
                self.cipher,
                allowed_outbound_origins=self.allowed_outbound_origins,
            )
            tenant_hash = sha256(tenant.owner_id.encode()).hexdigest()[:24]
            report_root = Path(tempfile.gettempdir()) / "aiqt-public" / tenant_hash
            lock = RLock()
            account_lease_tokens: dict[str, str] = {}

            def acquire_account_lease(holder: str) -> bool:
                token = f"{holder}:{uuid4().hex}"
                acquired = stores.leases.acquire(
                    tenant.owner_id,
                    "stage10-production-account",
                    token,
                )
                if acquired:
                    account_lease_tokens[holder] = token
                return acquired

            def release_account_lease(holder: str) -> None:
                token = account_lease_tokens.pop(holder, None)
                if token:
                    stores.leases.release(
                        tenant.owner_id,
                        "stage10-production-account",
                        token,
                    )

            base_environment = _public_platform_environment(os.environ)
            base_environment["AIQT_DEPLOYMENT_MODE"] = "public"
            base_environment["AIQT_PUBLIC_ORIGIN"] = self.config.public_origin or ""
            discovery = MarketDiscoveryService()
            handler_type = type(
                f"PublicTenantHandler_{tenant_hash}",
                (PublicBridgeHandler,),
                {
                    "run_store": stores.run_store,
                    "paper_execution_store": stores.paper_execution_store,
                    "portfolio_paper_order_store": stores.portfolio_paper_order_store,
                    "portfolio_paper_order_approval_store": stores.portfolio_paper_order_approval_store,
                    "portfolio_paper_order_simulation_store": stores.portfolio_paper_order_simulation_store,
                    "execution_adapter_certification_store": stores.execution_adapter_certification_store,
                    "ai_review_store": stores.ai_review_store,
                    "ai_review_decision_store": stores.ai_review_decision_store,
                    "ai_review_provider_registry": None,
                    "market_ai_selection_service": None,
                    "audit_event_store": stores.audit_event_store,
                    "import_undo_store": stores.import_undo_store,
                    "strategy_store": stores.strategy_store,
                    "strategy_experiment_store": stores.strategy_experiment_store,
                    "note_store": stores.note_store,
                    "handoff_note_store": stores.handoff_note_store,
                    "watchlist_store": stores.watchlist_store,
                    "workspace_state_store": stores.workspace_state_store,
                    "watchlist_cache_refresh_store": stores.watchlist_cache_refresh_store,
                    "adapter_error_store": stores.adapter_error_store,
                    "platform_settings_store": stores.platform_settings_store,
                    "platform_settings_environ": base_environment,
                    "settings_restart_required": False,
                    "auto_paper_trading_service": None,
                    "auto_paper_trading_runner": None,
                    "monitoring_service": None,
                    "production_readonly_authority_lock": lock,
                    "stage10_account_lease_acquire": acquire_account_lease,
                    "stage10_account_lease_release": release_account_lease,
                    "quote_adapter": QuantDingerLiveQuoteAdapter(),
                    "kline_adapter": QuantDingerKlineAdapter(
                        fallback_adapter=ComposedQuantApiHandler.adapter
                    ),
                    "market_discovery_service": discovery,
                    "market_information_service": MarketInformationService(
                        market_discovery_service=discovery
                    ),
                    "audit_signing_secret": sha256(
                        self.cipher.master_key + tenant.owner_id.encode()
                    ).hexdigest(),
                    "audit_signing_key_id": "tenant-audit-key-v1",
                    "audit_signer_name": tenant.authenticated_actor,
                    "audit_chain_id": f"tenant-{tenant_hash}",
                    "audit_signing_keys_json": "",
                    **{
                        attribute: report_root / f"{attribute}.json"
                        for attribute in _REPORT_PATH_ATTRIBUTES
                    },
                },
            )
            runtime = _TenantRuntime(stores, handler_type, lock)
            self._runtimes[tenant.owner_id] = runtime
            return runtime

    @staticmethod
    def _handler(
        handler_type: type[PublicBridgeHandler],
        request: Request,
        body: bytes,
        tenant: TenantContext,
    ) -> PublicBridgeHandler:
        handler = object.__new__(handler_type)
        handler.path = request.url.path + (f"?{request.url.query}" if request.url.query else "")
        handler.command = request.method
        handler.headers = request.headers
        handler.rfile = BytesIO(body)
        handler.client_address = (request.client.host if request.client else "unknown", 0)
        handler.request_version = "HTTP/1.1"
        handler.close_connection = True
        handler.connection, handler._connection_peer = socket.socketpair()
        handler.authenticated_actor = tenant.authenticated_actor
        handler._captured_status = 500
        handler._captured_content_type = "application/json; charset=utf-8"
        handler._captured_body = _response({"error": "public_tenant_route_failed"})
        return handler

    @staticmethod
    def _restore_report_files(runtime: _TenantRuntime) -> None:
        for attribute in _REPORT_PATH_ATTRIBUTES:
            path = Path(getattr(runtime.handler_type, attribute))
            content = runtime.stores.report_artifacts.get(attribute)
            if content is None:
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(str(content), encoding="utf-8")

    @staticmethod
    def _persist_report_files(runtime: _TenantRuntime) -> None:
        for attribute in _REPORT_PATH_ATTRIBUTES:
            path = Path(getattr(runtime.handler_type, attribute))
            if path.exists() and path.is_file():
                runtime.stores.report_artifacts.put(
                    attribute,
                    path.read_text(encoding="utf-8"),
                )


def _public_platform_environment(environment: Mapping[str, str]) -> dict[str, str]:
    allowed = {
        "AIQT_DEPLOYMENT_MODE",
        "AIQT_PUBLIC_ORIGIN",
        "AIQT_FREE_STOCKDB_URL",
        "AIQT_FREE_STOCKDB_TIMEOUT_SECONDS",
        "AIQT_MONITORING_WEBHOOK_TIMEOUT_SECONDS",
        "AIQT_OUTBOUND_ORIGIN_ALLOWLIST",
        "CCXT_DEFAULT_EXCHANGE",
        "CCXT_TIMEOUT",
        "OLLAMA_BASE_URL",
        "SSL_CERT_DIR",
        "SSL_CERT_FILE",
    }
    return {key: value for key, value in environment.items() if key in allowed}


def _legacy_default_actor_field(path: str) -> str | None:
    if path == "/api/handoff-notes":
        return "author"
    if path.startswith(("/api/execution/adapter-", "/api/audit/signing-keys/")):
        return "operator"
    return None


def _require_lease(lease_guard: Callable[[], bool] | None) -> None:
    if lease_guard is not None and not lease_guard():
        raise RuntimeError("public_lease_lost")


def _production_control_action(request: Request, body: bytes) -> str | None:
    if (
        request.method != "POST"
        or request.url.path != "/api/execution/stage10/production-execution-controls"
    ):
        return None
    try:
        payload = json.loads(body)
    except (TypeError, ValueError):
        return None
    action = payload.get("action") if isinstance(payload, dict) else None
    return action if action in {"restore", "revoke"} else None


def _production_credentials_changed(request: Request, body: bytes) -> bool:
    if request.method != "PUT" or request.url.path != "/api/settings/configuration":
        return False
    try:
        payload = json.loads(body)
    except (TypeError, ValueError):
        return False
    if not isinstance(payload, dict):
        return False
    fields = {"ccxtProductionTradingApiKey", "ccxtProductionTradingSecret"}
    updates = payload.get("secretUpdates")
    cleared = payload.get("clearSecrets")
    return (
        isinstance(updates, dict) and bool(fields & set(updates))
    ) or (
        isinstance(cleared, list) and bool(fields & {item for item in cleared if isinstance(item, str)})
    )


def _invalidate_production_access(runtime: _TenantRuntime, actor: str) -> None:
    service = runtime.handler_type.auto_paper_trading_service
    if service is None:
        service = _build_auto_paper_trading_service(runtime.handler_type)
        runtime.handler_type.auto_paper_trading_service = service
    production = service.production
    if production is not None and production.control().get("status") == "active":
        production.set_control(
            action="revoke",
            operator=actor,
            reason="生产交易凭据已更新，必须重新完成权限验证与授权。",
        )
    state = service.snapshot().get("state", {})
    if (
        isinstance(state, dict)
        and state.get("executionMode") == "live"
        and (state.get("enabled") is True or state.get("liveConfirmed") is True)
    ):
        service.configure({"enabled": False})
