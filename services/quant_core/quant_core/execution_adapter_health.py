from __future__ import annotations

import hashlib
import hmac
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Callable
from uuid import uuid4

from quant_core.audit_signing import AuditSigningKeyRegistry


_CCXT_UNSET = object()


@dataclass(frozen=True)
class ExecutionAdapterHealthCheck:
    check_id: str
    label: str
    status: str
    detail: str
    latency_ms: int | None = None


@dataclass(frozen=True)
class ExecutionAdapterHealthProbe:
    probe_id: str
    adapter_id: str
    provider: str
    exchange_id: str
    mode: str
    status: str
    generated_at: datetime
    checks: list[ExecutionAdapterHealthCheck]
    capabilities: dict[str, bool]
    credentials: dict[str, Any]
    market_count: int
    exchange_status: str | None
    server_time_ms: int | None
    account_sync_state: str
    blocked_reasons: list[str]
    metadata: dict[str, Any]
    paper_only: bool = True
    live_trading_allowed: bool = False
    order_routing_enabled: bool = False


ExchangeFactory = Callable[[str, dict[str, Any]], Any]


def probe_ccxt_sandbox_health(
    *,
    adapter_id: str,
    exchange_id: str,
    environ: dict[str, str] | None = None,
    exchange_factory: ExchangeFactory | None = None,
    ccxt_module: Any = _CCXT_UNSET,
    generated_at: datetime | None = None,
) -> ExecutionAdapterHealthProbe:
    env = environ if environ is not None else os.environ
    now = generated_at or datetime.now(timezone.utc)
    clean_adapter_id = adapter_id.strip() or "ccxt-live"
    clean_exchange_id = exchange_id.strip().lower() or "binance"
    checks: list[ExecutionAdapterHealthCheck] = []
    blocked_reasons: list[str] = []
    market_count = 0
    exchange_status: str | None = None
    server_time_ms: int | None = None
    account_sync_state = "not_run"
    capabilities = {
        "sandboxMode": False,
        "loadMarkets": False,
        "fetchStatus": False,
        "fetchTime": False,
        "fetchBalance": False,
        "createOrder": False,
    }
    credentials = _resolve_ccxt_credentials(clean_exchange_id, env)

    if exchange_factory is None:
        ccxt_module = _load_ccxt_module(ccxt_module)
        if ccxt_module is None:
            blocked_reasons.append("ccxt_not_installed")
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="ccxt-installed",
                    label="ccxt package installed",
                    status="blocked",
                    detail="Install optional data dependencies with INSTALL_DATA_DEPS=true or pip install ccxt.",
                )
            )
            return _build_probe(
                adapter_id=clean_adapter_id,
                exchange_id=clean_exchange_id,
                generated_at=now,
                checks=checks,
                capabilities=capabilities,
                credentials=credentials,
                market_count=market_count,
                exchange_status=exchange_status,
                server_time_ms=server_time_ms,
                account_sync_state="blocked",
                blocked_reasons=blocked_reasons,
            )
        exchange_class = getattr(ccxt_module, clean_exchange_id, None)
        if not callable(exchange_class):
            blocked_reasons.append("ccxt_exchange_not_found")
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="ccxt-exchange",
                    label="ccxt exchange class",
                    status="blocked",
                    detail=f"Exchange '{clean_exchange_id}' is not available in ccxt.",
                )
            )
            return _build_probe(
                adapter_id=clean_adapter_id,
                exchange_id=clean_exchange_id,
                generated_at=now,
                checks=checks,
                capabilities=capabilities,
                credentials=credentials,
                market_count=market_count,
                exchange_status=exchange_status,
                server_time_ms=server_time_ms,
                account_sync_state="blocked",
                blocked_reasons=blocked_reasons,
            )

        def exchange_factory(exchange_id_arg: str, config: dict[str, Any]) -> Any:
            return exchange_class(config)

        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="ccxt-installed",
                label="ccxt package installed",
                status="passed",
                detail="ccxt is importable and exchange class lookup succeeded.",
            )
        )
    else:
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="ccxt-installed",
                label="ccxt provider factory",
                status="passed",
                detail="Injected exchange factory is available for this probe.",
            )
        )

    config = _build_ccxt_config(credentials, env)
    try:
        exchange = exchange_factory(clean_exchange_id, config)
    except Exception as error:
        blocked_reasons.append("ccxt_exchange_init_failed")
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="exchange-init",
                label="exchange instance created",
                status="blocked",
                detail=f"Exchange initialization failed: {type(error).__name__}",
            )
        )
        return _build_probe(
            adapter_id=clean_adapter_id,
            exchange_id=clean_exchange_id,
            generated_at=now,
            checks=checks,
            capabilities=capabilities,
            credentials=credentials,
            market_count=market_count,
            exchange_status=exchange_status,
            server_time_ms=server_time_ms,
            account_sync_state="blocked",
            blocked_reasons=blocked_reasons,
        )

    capabilities = _ccxt_capabilities(exchange)
    if hasattr(exchange, "set_sandbox_mode"):
        try:
            _timed(lambda: exchange.set_sandbox_mode(True))
            capabilities["sandboxMode"] = True
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="sandbox-mode",
                    label="sandbox mode enabled",
                    status="passed",
                    detail="set_sandbox_mode(True) was called before any exchange API call.",
                )
            )
        except Exception as error:
            blocked_reasons.append("ccxt_sandbox_mode_failed")
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="sandbox-mode",
                    label="sandbox mode enabled",
                    status="blocked",
                    detail=f"Sandbox mode setup failed: {type(error).__name__}",
                )
            )
    else:
        blocked_reasons.append("ccxt_sandbox_mode_unavailable")
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="sandbox-mode",
                label="sandbox mode enabled",
                status="blocked",
                detail="Exchange object does not expose set_sandbox_mode.",
            )
        )

    if blocked_reasons:
        return _build_probe(
            adapter_id=clean_adapter_id,
            exchange_id=clean_exchange_id,
            generated_at=now,
            checks=checks,
            capabilities=capabilities,
            credentials=credentials,
            market_count=market_count,
            exchange_status=exchange_status,
            server_time_ms=server_time_ms,
            account_sync_state="blocked",
            blocked_reasons=blocked_reasons,
        )

    try:
        markets, latency_ms = _timed(exchange.load_markets)
        market_count = len(markets or {})
        capabilities["loadMarkets"] = True
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="markets-loaded",
                label="markets loaded",
                status="passed" if market_count > 0 else "review",
                detail=f"Loaded {market_count} markets from sandbox/testnet.",
                latency_ms=latency_ms,
            )
        )
    except Exception as error:
        blocked_reasons.append("ccxt_load_markets_failed")
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="markets-loaded",
                label="markets loaded",
                status="blocked",
                detail=f"load_markets failed: {type(error).__name__}",
            )
        )
        return _build_probe(
            adapter_id=clean_adapter_id,
            exchange_id=clean_exchange_id,
            generated_at=now,
            checks=checks,
            capabilities=capabilities,
            credentials=credentials,
            market_count=market_count,
            exchange_status=exchange_status,
            server_time_ms=server_time_ms,
            account_sync_state="blocked",
            blocked_reasons=blocked_reasons,
        )

    if capabilities["fetchStatus"] and hasattr(exchange, "fetch_status"):
        try:
            status_payload, latency_ms = _timed(exchange.fetch_status)
            exchange_status = str((status_payload or {}).get("status") or "unknown")
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="exchange-status",
                    label="exchange status",
                    status="passed" if exchange_status in {"ok", "normal"} else "review",
                    detail=f"Exchange status reported as {exchange_status}.",
                    latency_ms=latency_ms,
                )
            )
        except Exception as error:
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="exchange-status",
                    label="exchange status",
                    status="review",
                    detail=f"fetch_status failed: {type(error).__name__}",
                )
            )
    else:
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="exchange-status",
                label="exchange status",
                status="passed",
                detail="Optional fetchStatus is not advertised by this exchange.",
            )
        )

    if capabilities["fetchTime"] and hasattr(exchange, "fetch_time"):
        try:
            raw_time, latency_ms = _timed(exchange.fetch_time)
            server_time_ms = int(raw_time) if raw_time is not None else None
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="server-time",
                    label="server time",
                    status="passed" if server_time_ms is not None else "review",
                    detail="Fetched exchange server time from sandbox/testnet.",
                    latency_ms=latency_ms,
                )
            )
        except Exception as error:
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="server-time",
                    label="server time",
                    status="review",
                    detail=f"fetch_time failed: {type(error).__name__}",
                )
            )
    else:
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="server-time",
                label="server time",
                status="skipped",
                detail="Exchange does not advertise fetchTime.",
            )
        )

    if credentials["apiKeyConfigured"] and credentials["secretConfigured"]:
        if capabilities["fetchBalance"] and hasattr(exchange, "fetch_balance"):
            try:
                _balance, latency_ms = _timed(exchange.fetch_balance)
                account_sync_state = "ready"
                checks.append(
                    ExecutionAdapterHealthCheck(
                        check_id="account-sync",
                        label="account sync",
                        status="passed",
                        detail="Sandbox/testnet credentials allowed a redacted balance read.",
                        latency_ms=latency_ms,
                    )
                )
            except Exception as error:
                account_sync_state = "review"
                checks.append(
                    ExecutionAdapterHealthCheck(
                        check_id="account-sync",
                        label="account sync",
                        status="review",
                        detail=f"fetch_balance failed: {type(error).__name__}",
                    )
                )
        else:
            account_sync_state = "unsupported"
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="account-sync",
                    label="account sync",
                    status="skipped",
                    detail="Exchange does not advertise fetchBalance.",
                )
            )
    else:
        account_sync_state = "credentials_missing"
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="account-sync",
                label="account sync",
                status="review",
                detail="Sandbox/testnet API key and secret are not both configured; balance sync was skipped.",
            )
        )

    checks.append(
        ExecutionAdapterHealthCheck(
            check_id="order-routing-disabled",
            label="order routing disabled",
            status="passed",
            detail="Probe is read-only and does not call create_order, cancel_order, or any live routing method.",
        )
    )

    return _build_probe(
        adapter_id=clean_adapter_id,
        exchange_id=clean_exchange_id,
        generated_at=now,
        checks=checks,
        capabilities=capabilities,
        credentials=credentials,
        market_count=market_count,
        exchange_status=exchange_status,
        server_time_ms=server_time_ms,
        account_sync_state=account_sync_state,
        blocked_reasons=blocked_reasons,
    )


def probe_ccxt_production_readonly(
    *,
    adapter_id: str,
    exchange_id: str,
    environ: dict[str, str] | None = None,
    exchange_factory: ExchangeFactory | None = None,
    ccxt_module: Any = _CCXT_UNSET,
    generated_at: datetime | None = None,
) -> ExecutionAdapterHealthProbe:
    env = environ if environ is not None else os.environ
    now = generated_at or datetime.now(timezone.utc)
    clean_adapter_id = adapter_id.strip() or "ccxt-live"
    clean_exchange_id = exchange_id.strip().lower() or "binance"
    checks: list[ExecutionAdapterHealthCheck] = []
    blocked_reasons: list[str] = []
    credentials = _resolve_production_readonly_credentials(env)
    capabilities = {
        "loadMarkets": False,
        "fetchTime": False,
        "fetchBalance": False,
        "apiRestrictions": False,
        "createOrder": False,
    }
    metadata: dict[str, Any] = {
        "readOnly": True,
        "productionReadOnly": True,
        "accountDataAccessed": False,
        "nonZeroAssetCount": 0,
        "accountType": None,
        "observedAt": None,
        "apiPermissions": _empty_production_permissions(),
    }

    if clean_exchange_id != "binance":
        blocked_reasons.append("production_readonly_exchange_not_allowed")
    if (env.get("CCXT_DEFAULT_TYPE", "spot").strip().lower() or "spot") != "spot":
        blocked_reasons.append("production_readonly_spot_required")
    if not credentials["apiKeyConfigured"] or not credentials["secretConfigured"]:
        blocked_reasons.append("production_readonly_credentials_missing")
    if blocked_reasons:
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="production-boundary",
                label="production read-only boundary",
                status="blocked",
                detail="Binance Spot and a complete dedicated production read-only credential pair are required.",
            )
        )
        return _build_production_probe(
            adapter_id=clean_adapter_id,
            exchange_id=clean_exchange_id,
            generated_at=now,
            checks=checks,
            capabilities=capabilities,
            credentials=credentials,
            blocked_reasons=blocked_reasons,
            metadata=metadata,
        )

    if exchange_factory is None:
        ccxt_module = _load_ccxt_module(ccxt_module)
        exchange_class = getattr(ccxt_module, clean_exchange_id, None) if ccxt_module is not None else None
        if not callable(exchange_class):
            blocked_reasons.append("ccxt_exchange_not_found")
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="ccxt-exchange",
                    label="ccxt exchange class",
                    status="blocked",
                    detail="Binance exchange class is not available in ccxt.",
                )
            )
            return _build_production_probe(
                adapter_id=clean_adapter_id,
                exchange_id=clean_exchange_id,
                generated_at=now,
                checks=checks,
                capabilities=capabilities,
                credentials=credentials,
                blocked_reasons=blocked_reasons,
                metadata=metadata,
            )

        def exchange_factory(exchange_id_arg: str, config: dict[str, Any]) -> Any:
            return exchange_class(config)

    try:
        config = _build_ccxt_config(credentials, env)
        config["options"]["defaultType"] = "spot"
        api_key = config.pop("apiKey")
        secret = config.pop("secret")
        exchange = exchange_factory(clean_exchange_id, config)
    except Exception as error:
        blocked_reasons.append("ccxt_exchange_init_failed")
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="exchange-init",
                label="production exchange instance",
                status="blocked",
                detail=f"Exchange initialization failed: {type(error).__name__}",
            )
        )
        return _build_production_probe(
            adapter_id=clean_adapter_id,
            exchange_id=clean_exchange_id,
            generated_at=now,
            checks=checks,
            capabilities=capabilities,
            credentials=credentials,
            blocked_reasons=blocked_reasons,
            metadata=metadata,
        )

    try:
        markets, latency_ms = _timed(exchange.load_markets)
        market_count = len(markets or {})
        capabilities["loadMarkets"] = True
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="production-markets-loaded",
                label="production markets loaded",
                status="passed" if market_count else "blocked",
                detail=f"Loaded {market_count} Binance Spot production markets.",
                latency_ms=latency_ms,
            )
        )
        if not market_count:
            blocked_reasons.append("production_readonly_markets_empty")
    except Exception as error:
        market_count = 0
        blocked_reasons.append("production_readonly_load_markets_failed")
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="production-markets-loaded",
                label="production markets loaded",
                status="blocked",
                detail=f"load_markets failed: {type(error).__name__}",
            )
        )
    if blocked_reasons:
        return _build_production_probe(
            adapter_id=clean_adapter_id,
            exchange_id=clean_exchange_id,
            generated_at=now,
            checks=checks,
            capabilities=capabilities,
            credentials=credentials,
            blocked_reasons=blocked_reasons,
            metadata=metadata,
            market_count=market_count,
        )

    exchange.apiKey = api_key
    exchange.secret = secret
    permission_reader = _production_permission_reader(exchange)
    if permission_reader is None:
        blocked_reasons.append("production_readonly_permission_check_unavailable")
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="api-key-permissions",
                label="API key permissions",
                status="blocked",
                detail="Binance API key restrictions endpoint is unavailable.",
            )
        )
    else:
        try:
            raw_permissions, latency_ms = _timed(permission_reader)
            permissions, permissions_authoritative = _production_permissions(raw_permissions)
            metadata["apiPermissions"] = permissions
            capabilities["apiRestrictions"] = True
            permissions_safe = permissions_authoritative and permissions["readingEnabled"] and not any(
                permissions[field]
                for field in (
                    "spotTradingEnabled", "marginTradingEnabled", "futuresTradingEnabled",
                    "optionsTradingEnabled", "withdrawalsEnabled",
                    "internalTransferEnabled", "universalTransferEnabled",
                )
            )
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="api-key-permissions",
                    label="API key permissions",
                    status="passed" if permissions_safe else "blocked",
                    detail="API key is read-only." if permissions_safe else "API key exposes trading, withdrawal, transfer, or missing read permission.",
                    latency_ms=latency_ms,
                )
            )
            if not permissions_safe:
                blocked_reasons.append("production_readonly_permissions_unsafe")
        except Exception as error:
            blocked_reasons.append("production_readonly_permission_check_failed")
            checks.append(
                ExecutionAdapterHealthCheck(
                    check_id="api-key-permissions",
                    label="API key permissions",
                    status="blocked",
                    detail=f"API key permission check failed: {type(error).__name__}",
                )
            )
    if blocked_reasons:
        return _build_production_probe(
            adapter_id=clean_adapter_id,
            exchange_id=clean_exchange_id,
            generated_at=now,
            checks=checks,
            capabilities=capabilities,
            credentials=credentials,
            blocked_reasons=blocked_reasons,
            metadata=metadata,
            market_count=market_count,
        )

    try:
        balance, latency_ms = _timed(lambda: exchange.fetch_balance({"type": "spot", "omitZeroBalances": True}))
        capabilities["fetchBalance"] = True
        metadata.update(_redacted_production_account_snapshot(balance, now))
        metadata["accountDataAccessed"] = True
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="redacted-account-summary",
                label="redacted account summary",
                status="passed",
                detail=f"Read a redacted production account summary with {metadata['nonZeroAssetCount']} non-zero assets.",
                latency_ms=latency_ms,
            )
        )
    except Exception as error:
        blocked_reasons.append("production_readonly_account_sync_failed")
        checks.append(
            ExecutionAdapterHealthCheck(
                check_id="redacted-account-summary",
                label="redacted account summary",
                status="blocked",
                detail=f"fetch_balance failed: {type(error).__name__}",
            )
        )

    checks.append(
        ExecutionAdapterHealthCheck(
            check_id="production-order-routing-disabled",
            label="production order routing disabled",
            status="passed",
            detail="Probe does not call order, trade, transfer, withdrawal, or mutation APIs.",
        )
    )
    return _build_production_probe(
        adapter_id=clean_adapter_id,
        exchange_id=clean_exchange_id,
        generated_at=now,
        checks=checks,
        capabilities=capabilities,
        credentials=credentials,
        blocked_reasons=blocked_reasons,
        metadata=metadata,
        market_count=market_count,
        account_sync_state="ready" if not blocked_reasons else "blocked",
    )


def execution_adapter_health_probe_to_payload(probe: ExecutionAdapterHealthProbe) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "probeId": probe.probe_id,
        "adapterId": probe.adapter_id,
        "provider": probe.provider,
        "exchangeId": probe.exchange_id,
        "mode": probe.mode,
        "status": probe.status,
        "generatedAt": probe.generated_at.isoformat(),
        "checks": [
            {
                "id": check.check_id,
                "label": check.label,
                "status": check.status,
                "detail": check.detail,
                "latencyMs": check.latency_ms,
            }
            for check in probe.checks
        ],
        "capabilities": dict(probe.capabilities),
        "credentials": dict(probe.credentials),
        "marketCount": probe.market_count,
        "exchangeStatus": probe.exchange_status,
        "serverTimeMs": probe.server_time_ms,
        "accountSyncState": probe.account_sync_state,
        "blockedReasons": list(probe.blocked_reasons),
        "metadata": dict(probe.metadata),
        "paperOnly": probe.paper_only,
        "liveTradingAllowed": probe.live_trading_allowed,
        "orderRoutingEnabled": probe.order_routing_enabled,
    }


def production_readonly_probe_to_evidence(
    probe: ExecutionAdapterHealthProbe,
    *,
    stage6_exit_hash: str,
    production_route_review_id: str,
    operator: str,
    eligibility_confirmed: bool,
) -> dict[str, Any]:
    payload = execution_adapter_health_probe_to_payload(probe)
    metadata = payload["metadata"]
    value = {
        "kind": "aiqt.stage7ProductionReadonlyProbe",
        "schemaVersion": 1,
        "probeId": payload["probeId"],
        "adapterId": payload["adapterId"],
        "exchangeId": payload["exchangeId"],
        "mode": payload["mode"],
        "status": payload["status"],
        "generatedAt": payload["generatedAt"],
        "stage6ExitHash": stage6_exit_hash,
        "productionRouteReviewId": production_route_review_id,
        "operator": operator.strip() or "local-operator",
        "eligibilityConfirmed": eligibility_confirmed,
        "checks": [{"id": row["id"], "status": row["status"]} for row in payload["checks"]],
        "credentialFlags": {
            "keyConfigured": payload["credentials"]["apiKeyConfigured"],
            "signingConfigured": payload["credentials"]["secretConfigured"],
        },
        "marketCount": payload["marketCount"],
        "apiPermissions": dict(metadata.get("apiPermissions") or _empty_production_permissions()),
        "accountSummary": {
            "accountType": metadata.get("accountType"),
            "nonZeroAssetCount": metadata.get("nonZeroAssetCount", 0),
            "observedAt": metadata.get("observedAt"),
        },
        "accountSyncState": payload["accountSyncState"],
        "accountDataAccessed": metadata.get("accountDataAccessed") is True,
        "blockedReasons": payload["blockedReasons"],
        "productionReadOnly": True,
        "paperOnly": False,
        "liveTradingAllowed": False,
        "orderRoutingEnabled": False,
        "liveOrderSubmitted": False,
        "liveRouteExecuted": False,
        "liveBlockedBoundary": True,
    }
    value["evidenceHash"] = _execution_adapter_health_evidence_hash(value)
    return validate_production_readonly_probe_evidence(value)


def validate_production_readonly_probe_evidence(value: Any) -> dict[str, Any]:
    fields = {
        "kind", "schemaVersion", "probeId", "adapterId", "exchangeId", "mode", "status", "generatedAt",
        "stage6ExitHash", "productionRouteReviewId", "operator", "eligibilityConfirmed", "checks",
        "credentialFlags", "marketCount", "apiPermissions", "accountSummary", "accountSyncState",
        "accountDataAccessed", "blockedReasons", "productionReadOnly", "paperOnly", "liveTradingAllowed",
        "orderRoutingEnabled", "liveOrderSubmitted", "liveRouteExecuted", "liveBlockedBoundary", "evidenceHash",
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage7_production_readonly_evidence_fields_invalid")
    if value["kind"] != "aiqt.stage7ProductionReadonlyProbe" or value["schemaVersion"] != 1:
        raise ValueError("stage7_production_readonly_evidence_schema_invalid")
    if value["exchangeId"] != "binance" or value["mode"] != "production-readonly":
        raise ValueError("stage7_production_readonly_evidence_route_invalid")
    if value["status"] not in {"ready", "review", "blocked"}:
        raise ValueError("stage7_production_readonly_evidence_status_invalid")
    for field in ("probeId", "adapterId", "productionRouteReviewId", "operator", "accountSyncState"):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError(f"stage7_production_readonly_evidence_{field}_invalid")
    if not _is_sha256(value["stage6ExitHash"]):
        raise ValueError("stage7_production_readonly_evidence_stage6_hash_invalid")
    try:
        generated_at = datetime.fromisoformat(value["generatedAt"])
    except (TypeError, ValueError) as error:
        raise ValueError("stage7_production_readonly_evidence_generated_at_invalid") from error
    if generated_at.tzinfo is None or generated_at.utcoffset() is None:
        raise ValueError("stage7_production_readonly_evidence_generated_at_invalid")
    if type(value["eligibilityConfirmed"]) is not bool:
        raise ValueError("stage7_production_readonly_evidence_eligibility_invalid")
    if type(value["marketCount"]) is not int or value["marketCount"] < 0:
        raise ValueError("stage7_production_readonly_evidence_market_count_invalid")
    if not isinstance(value["checks"], list) or not value["checks"] or any(
        not isinstance(row, dict) or set(row) != {"id", "status"}
        or not isinstance(row["id"], str) or not row["id"].strip()
        or row["status"] not in {"passed", "review", "blocked", "skipped"}
        for row in value["checks"]
    ):
        raise ValueError("stage7_production_readonly_evidence_checks_invalid")
    credential_flags = value["credentialFlags"]
    if not isinstance(credential_flags, dict) or set(credential_flags) != {"keyConfigured", "signingConfigured"} or any(
        type(flag) is not bool for flag in credential_flags.values()
    ):
        raise ValueError("stage7_production_readonly_evidence_credentials_invalid")
    permissions = value["apiPermissions"]
    if not isinstance(permissions, dict) or set(permissions) != set(_empty_production_permissions()) or any(
        type(flag) is not bool for flag in permissions.values()
    ):
        raise ValueError("stage7_production_readonly_evidence_permissions_invalid")
    account = value["accountSummary"]
    if not isinstance(account, dict) or set(account) != {"accountType", "nonZeroAssetCount", "observedAt"}:
        raise ValueError("stage7_production_readonly_evidence_account_invalid")
    if type(account["nonZeroAssetCount"]) is not int or account["nonZeroAssetCount"] < 0:
        raise ValueError("stage7_production_readonly_evidence_account_invalid")
    if account["accountType"] is not None and (not isinstance(account["accountType"], str) or not account["accountType"]):
        raise ValueError("stage7_production_readonly_evidence_account_invalid")
    if account["observedAt"] is not None:
        try:
            observed_at = datetime.fromisoformat(account["observedAt"])
        except (TypeError, ValueError) as error:
            raise ValueError("stage7_production_readonly_evidence_account_invalid") from error
        if observed_at.tzinfo is None or observed_at.utcoffset() is None:
            raise ValueError("stage7_production_readonly_evidence_account_invalid")
    if not isinstance(value["blockedReasons"], list) or any(
        not isinstance(reason, str) or not reason.strip() for reason in value["blockedReasons"]
    ):
        raise ValueError("stage7_production_readonly_evidence_blockers_invalid")
    boundaries = {
        "productionReadOnly": True, "paperOnly": False, "liveTradingAllowed": False,
        "orderRoutingEnabled": False, "liveOrderSubmitted": False, "liveRouteExecuted": False,
        "liveBlockedBoundary": True,
    }
    if any(value[field] is not expected for field, expected in boundaries.items()) or type(value["accountDataAccessed"]) is not bool:
        raise ValueError("stage7_production_readonly_evidence_boundary_invalid")
    unsafe_permissions = any(
        permissions[field]
        for field in (
            "spotTradingEnabled", "marginTradingEnabled", "futuresTradingEnabled",
            "optionsTradingEnabled", "withdrawalsEnabled",
            "internalTransferEnabled", "universalTransferEnabled",
        )
    )
    if value["status"] == "ready" and (
        value["adapterId"] != "ccxt-live" or not value["probeId"].startswith("stage7-production-readonly-")
        or not value["eligibilityConfirmed"] or not credential_flags["keyConfigured"]
        or not credential_flags["signingConfigured"] or value["marketCount"] <= 0
        or not permissions["readingEnabled"] or unsafe_permissions or not value["accountDataAccessed"]
        or value["accountSyncState"] != "ready" or value["blockedReasons"]
        or account["accountType"] != "SPOT" or account["observedAt"] is None
        or not {"production-markets-loaded", "api-key-permissions", "redacted-account-summary",
                "production-order-routing-disabled"}.issubset({
                    row["id"] for row in value["checks"] if row["status"] == "passed"
                })
    ):
        raise ValueError("stage7_production_readonly_evidence_ready_invalid")
    if value["evidenceHash"] != _execution_adapter_health_evidence_hash(value):
        raise ValueError("stage7_production_readonly_evidence_hash_invalid")
    return value


def production_readonly_probe_to_audit_event_payload(value: dict[str, Any]) -> dict[str, Any]:
    evidence = validate_production_readonly_probe_evidence(value)
    return {
        "schemaVersion": 1,
        "eventId": evidence["probeId"],
        "eventType": "stage7_production_readonly_probe",
        "runId": "",
        "createdAt": evidence["generatedAt"],
        "stage": "stage7-production-readonly-probe",
        "source": evidence["operator"],
        "summary": f"Stage 7 production read-only probe {evidence['status']}.",
        "detail": "Binance Spot production access was evaluated without order, trade, transfer, or withdrawal APIs.",
        "metadata": {"snapshot": evidence},
    }


def production_readonly_probe_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage7_production_readonly_probe":
        return None
    metadata = getattr(event, "metadata", None)
    snapshot = metadata.get("snapshot") if isinstance(metadata, dict) else None
    try:
        return validate_production_readonly_probe_evidence(snapshot)
    except ValueError:
        return None


def execution_adapter_health_probe_to_evidence(
    probe: ExecutionAdapterHealthProbe,
    *,
    signing_secret: str | None = None,
    signing_key_id: str | None = None,
    signing_keys_json: str | None = None,
) -> dict[str, Any]:
    payload = execution_adapter_health_probe_to_payload(probe)
    evidence = {
        "kind": "aiqt.executionAdapterSandboxHealthEvidence",
        "schemaVersion": 1,
        "probeId": payload["probeId"],
        "adapterId": payload["adapterId"],
        "provider": payload["provider"],
        "exchangeId": payload["exchangeId"],
        "mode": payload["mode"],
        "status": payload["status"],
        "generatedAt": payload["generatedAt"],
        "checks": [{"id": row["id"], "status": row["status"]} for row in payload["checks"]],
        "capabilities": payload["capabilities"],
        "credentialFlags": {
            "keyConfigured": payload["credentials"]["apiKeyConfigured"],
            "signingConfigured": payload["credentials"]["secretConfigured"],
            "passphraseConfigured": payload["credentials"]["passwordConfigured"],
        },
        "marketCount": payload["marketCount"],
        "accountSyncState": payload["accountSyncState"],
        "blockedReasons": payload["blockedReasons"],
        "readOnly": payload["metadata"].get("readOnly") is True,
        "paperOnly": payload["paperOnly"],
        "liveTradingAllowed": payload["liveTradingAllowed"],
        "orderRoutingEnabled": payload["orderRoutingEnabled"],
    }
    evidence["evidenceHash"] = _execution_adapter_health_evidence_hash(evidence)
    registry = _execution_adapter_health_signing_registry(
        signing_secret=signing_secret,
        signing_key_id=signing_key_id,
        signing_keys_json=signing_keys_json,
    )
    key = registry.active_key
    evidence["authority"] = {
        "algorithm": "hmac-sha256",
        "keyId": key.key_id,
        "keyFingerprint": key.fingerprint,
        "value": "",
    }
    evidence["authority"]["value"] = _execution_adapter_health_authority_mac(evidence, key.secret)
    return validate_execution_adapter_health_probe_evidence(
        evidence,
        signing_secret=signing_secret,
        signing_key_id=signing_key_id,
        signing_keys_json=signing_keys_json,
    )


def validate_execution_adapter_health_probe_evidence(
    value: Any,
    *,
    signing_secret: str | None = None,
    signing_key_id: str | None = None,
    signing_keys_json: str | None = None,
) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("execution_adapter_health_evidence_required")
    required_fields = {
        "kind", "schemaVersion", "probeId", "adapterId", "provider", "exchangeId", "mode", "status",
        "generatedAt", "checks", "capabilities", "credentialFlags", "marketCount", "accountSyncState",
        "blockedReasons", "readOnly", "paperOnly", "liveTradingAllowed", "orderRoutingEnabled", "evidenceHash",
        "authority",
    }
    if set(value) != required_fields:
        raise ValueError("execution_adapter_health_evidence_fields_invalid")
    if value["kind"] != "aiqt.executionAdapterSandboxHealthEvidence" or value["schemaVersion"] != 1:
        raise ValueError("execution_adapter_health_evidence_schema_invalid")
    for field in ("probeId", "adapterId", "exchangeId", "accountSyncState"):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError(f"execution_adapter_health_evidence_{field}_invalid")
    if value["provider"] != "ccxt" or value["mode"] != "sandbox":
        raise ValueError("execution_adapter_health_evidence_provider_invalid")
    if value["status"] not in {"ready", "review", "blocked"}:
        raise ValueError("execution_adapter_health_evidence_status_invalid")
    try:
        generated_at = datetime.fromisoformat(value["generatedAt"])
    except (TypeError, ValueError) as error:
        raise ValueError("execution_adapter_health_evidence_generated_at_invalid") from error
    if generated_at.tzinfo is None or generated_at.utcoffset() is None:
        raise ValueError("execution_adapter_health_evidence_generated_at_invalid")
    if type(value["marketCount"]) is not int or value["marketCount"] < 0:
        raise ValueError("execution_adapter_health_evidence_market_count_invalid")
    checks = value["checks"]
    if not isinstance(checks, list) or not checks:
        raise ValueError("execution_adapter_health_evidence_checks_invalid")
    check_ids = []
    for row in checks:
        if (
            not isinstance(row, dict)
            or set(row) != {"id", "status"}
            or not isinstance(row["id"], str)
            or not row["id"].strip()
            or row["status"] not in {"passed", "review", "blocked", "skipped"}
        ):
            raise ValueError("execution_adapter_health_evidence_checks_invalid")
        check_ids.append(row["id"])
    if len(check_ids) != len(set(check_ids)):
        raise ValueError("execution_adapter_health_evidence_checks_invalid")
    if not isinstance(value["capabilities"], dict) or any(
        not isinstance(key, str) or type(enabled) is not bool
        for key, enabled in value["capabilities"].items()
    ):
        raise ValueError("execution_adapter_health_evidence_capabilities_invalid")
    credential_flags = value["credentialFlags"]
    if (
        not isinstance(credential_flags, dict)
        or set(credential_flags) != {"keyConfigured", "signingConfigured", "passphraseConfigured"}
        or any(type(configured) is not bool for configured in credential_flags.values())
    ):
        raise ValueError("execution_adapter_health_evidence_credentials_invalid")
    if not isinstance(value["blockedReasons"], list) or any(
        not isinstance(reason, str) or not reason.strip() for reason in value["blockedReasons"]
    ):
        raise ValueError("execution_adapter_health_evidence_blockers_invalid")
    if any(
        type(value[field]) is not bool
        for field in ("readOnly", "paperOnly", "liveTradingAllowed", "orderRoutingEnabled")
    ):
        raise ValueError("execution_adapter_health_evidence_boundary_invalid")
    if value["readOnly"] is not True or value["paperOnly"] is not True or value["liveTradingAllowed"] or value["orderRoutingEnabled"]:
        raise ValueError("execution_adapter_health_evidence_boundary_invalid")
    if not isinstance(value["evidenceHash"], str) or value["evidenceHash"] != _execution_adapter_health_evidence_hash(value):
        raise ValueError("execution_adapter_health_evidence_hash_invalid")
    authority = value["authority"]
    if not isinstance(authority, dict) or set(authority) != {
        "algorithm", "keyId", "keyFingerprint", "value"
    } or authority["algorithm"] != "hmac-sha256":
        raise ValueError("execution_adapter_health_evidence_authority_invalid")
    registry = _execution_adapter_health_signing_registry(
        signing_secret=signing_secret,
        signing_key_id=signing_key_id,
        signing_keys_json=signing_keys_json,
    )
    key = registry.find(str(authority["keyId"]))
    if (
        key is None
        or not key.can_verify
        or authority["keyFingerprint"] != key.fingerprint
        or not isinstance(authority["value"], str)
        or not hmac.compare_digest(
            authority["value"], _execution_adapter_health_authority_mac(value, key.secret)
        )
    ):
        raise ValueError("execution_adapter_health_evidence_authority_invalid")
    return value


def _execution_adapter_health_evidence_hash(value: dict[str, Any]) -> str:
    payload = {key: item for key, item in value.items() if key not in {"evidenceHash", "authority"}}
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def _is_sha256(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _execution_adapter_health_authority_mac(value: dict[str, Any], secret: str) -> str:
    payload = {
        **value,
        "authority": {
            key: item
            for key, item in value["authority"].items()
            if key != "value"
        },
    }
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def _execution_adapter_health_signing_registry(
    *,
    signing_secret: str | None,
    signing_key_id: str | None,
    signing_keys_json: str | None,
) -> AuditSigningKeyRegistry:
    active_secret = signing_secret if signing_secret is not None else os.environ.get(
        "AIQT_AUDIT_SIGNING_SECRET", "local-dev-audit-secret"
    )
    active_key_id = signing_key_id if signing_key_id is not None else os.environ.get(
        "AIQT_AUDIT_SIGNING_KEY_ID", "local-audit-key"
    )
    return AuditSigningKeyRegistry.from_config(
        secret=active_secret.strip() or "local-dev-audit-secret",
        key_id=active_key_id.strip() or "local-audit-key",
        signer="Execution Adapter Health Authority",
        chain_id=os.environ.get("AIQT_AUDIT_CHAIN_ID", "audit-chain-local"),
        keys_json=signing_keys_json if signing_keys_json is not None else os.environ.get(
            "AIQT_AUDIT_SIGNING_KEYS_JSON", ""
        ),
    )


def _build_probe(
    *,
    adapter_id: str,
    exchange_id: str,
    generated_at: datetime,
    checks: list[ExecutionAdapterHealthCheck],
    capabilities: dict[str, bool],
    credentials: dict[str, Any],
    market_count: int,
    exchange_status: str | None,
    server_time_ms: int | None,
    account_sync_state: str,
    blocked_reasons: list[str],
) -> ExecutionAdapterHealthProbe:
    status = _probe_status(checks, blocked_reasons)
    return ExecutionAdapterHealthProbe(
        probe_id=f"execution-adapter-health-{adapter_id}-{uuid4()}",
        adapter_id=adapter_id,
        provider="ccxt",
        exchange_id=exchange_id,
        mode="sandbox",
        status=status,
        generated_at=generated_at,
        checks=checks,
        capabilities=capabilities,
        credentials=credentials,
        market_count=market_count,
        exchange_status=exchange_status,
        server_time_ms=server_time_ms,
        account_sync_state=account_sync_state,
        blocked_reasons=blocked_reasons,
        metadata={
            "readOnly": True,
        },
    )


def _build_production_probe(
    *,
    adapter_id: str,
    exchange_id: str,
    generated_at: datetime,
    checks: list[ExecutionAdapterHealthCheck],
    capabilities: dict[str, bool],
    credentials: dict[str, Any],
    blocked_reasons: list[str],
    metadata: dict[str, Any],
    market_count: int = 0,
    account_sync_state: str = "blocked",
) -> ExecutionAdapterHealthProbe:
    return ExecutionAdapterHealthProbe(
        probe_id=f"stage7-production-readonly-{uuid4()}",
        adapter_id=adapter_id,
        provider="ccxt",
        exchange_id=exchange_id,
        mode="production-readonly",
        status=_probe_status(checks, blocked_reasons),
        generated_at=generated_at,
        checks=checks,
        capabilities=capabilities,
        credentials=credentials,
        market_count=market_count,
        exchange_status=None,
        server_time_ms=None,
        account_sync_state=account_sync_state,
        blocked_reasons=list(dict.fromkeys(blocked_reasons)),
        metadata=metadata,
        paper_only=False,
        live_trading_allowed=False,
        order_routing_enabled=False,
    )


def _probe_status(checks: list[ExecutionAdapterHealthCheck], blocked_reasons: list[str]) -> str:
    if blocked_reasons or any(check.status == "blocked" for check in checks):
        return "blocked"
    if any(
        check.status in {"review", "skipped"}
        and check.check_id not in {"exchange-status", "server-time"}
        for check in checks
    ):
        return "review"
    return "ready"


def _load_ccxt_module(ccxt_module: Any) -> Any | None:
    if ccxt_module is not _CCXT_UNSET:
        return ccxt_module
    try:
        import ccxt  # type: ignore

        return ccxt
    except Exception:
        return None


def _resolve_ccxt_credentials(exchange_id: str, env: dict[str, str]) -> dict[str, Any]:
    prefix = exchange_id.upper().replace("-", "_")
    dedicated_api_key = env.get("CCXT_SANDBOX_API_KEY", "").strip()
    dedicated_secret = env.get("CCXT_SANDBOX_SECRET", "").strip()
    if exchange_id == "binance" and dedicated_api_key and dedicated_secret:
        api_key_source, api_key_value = "CCXT_SANDBOX_API_KEY", dedicated_api_key
        secret_source, secret_value = "CCXT_SANDBOX_SECRET", dedicated_secret
    else:
        api_key_source, api_key_value = _first_env(env, [f"CCXT_{prefix}_API_KEY", "CCXT_API_KEY"])
        secret_source, secret_value = _first_env(
            env,
            [f"CCXT_{prefix}_SECRET", f"CCXT_{prefix}_API_SECRET", "CCXT_SECRET", "CCXT_API_SECRET"],
        )
    password_source, password_value = _first_env(env, [f"CCXT_{prefix}_PASSWORD", "CCXT_PASSWORD"])
    return {
        "apiKeyConfigured": bool(api_key_value),
        "apiKeySource": api_key_source,
        "secretConfigured": bool(secret_value),
        "secretSource": secret_source,
        "passwordConfigured": bool(password_value),
        "passwordSource": password_source,
    }


def _resolve_production_readonly_credentials(env: dict[str, str]) -> dict[str, Any]:
    api_key = env.get("CCXT_PRODUCTION_READONLY_API_KEY", "").strip()
    secret = env.get("CCXT_PRODUCTION_READONLY_SECRET", "").strip()
    return {
        "apiKeyConfigured": bool(api_key),
        "apiKeySource": "CCXT_PRODUCTION_READONLY_API_KEY" if api_key else None,
        "secretConfigured": bool(secret),
        "secretSource": "CCXT_PRODUCTION_READONLY_SECRET" if secret else None,
        "passwordConfigured": False,
        "passwordSource": None,
    }


def _build_ccxt_config(credentials: dict[str, Any], env: dict[str, str]) -> dict[str, Any]:
    config: dict[str, Any] = {
        "enableRateLimit": True,
        "options": {"defaultType": env.get("CCXT_DEFAULT_TYPE", "spot")},
    }
    timeout = _parse_positive_int(env.get("CCXT_TIMEOUT"))
    if timeout is not None:
        config["timeout"] = timeout
    https_proxy = (env.get("HTTPS_PROXY") or env.get("https_proxy") or "").strip()
    if https_proxy:
        config["httpsProxy"] = https_proxy
    if credentials.get("apiKeyConfigured") and credentials.get("apiKeySource"):
        config["apiKey"] = env[str(credentials["apiKeySource"])].strip()
    if credentials.get("secretConfigured") and credentials.get("secretSource"):
        config["secret"] = env[str(credentials["secretSource"])].strip()
    if credentials.get("passwordConfigured") and credentials.get("passwordSource"):
        config["password"] = env[str(credentials["passwordSource"])].strip()
    return config


def _first_env(env: dict[str, str], keys: list[str]) -> tuple[str | None, str | None]:
    for key in keys:
        value = env.get(key, "").strip()
        if value:
            return key, value
    return None, None


def _production_permission_reader(exchange: Any) -> Callable[[], Any] | None:
    for name in ("sapi_get_account_apirestrictions", "sapiGetAccountApiRestrictions"):
        reader = getattr(exchange, name, None)
        if callable(reader):
            return reader
    return None


def _empty_production_permissions() -> dict[str, bool]:
    return {
        "readingEnabled": False,
        "spotTradingEnabled": False,
        "marginTradingEnabled": False,
        "futuresTradingEnabled": False,
        "optionsTradingEnabled": False,
        "withdrawalsEnabled": False,
        "internalTransferEnabled": False,
        "universalTransferEnabled": False,
    }


def _production_permissions(value: Any) -> tuple[dict[str, bool], bool]:
    payload = value if isinstance(value, dict) else {}
    fields = {
        "readingEnabled": "enableReading",
        "spotTradingEnabled": "enableSpotAndMarginTrading",
        "marginTradingEnabled": "enableMargin",
        "futuresTradingEnabled": "enableFutures",
        "optionsTradingEnabled": "enableVanillaOptions",
        "withdrawalsEnabled": "enableWithdrawals",
        "internalTransferEnabled": "enableInternalTransfer",
        "universalTransferEnabled": "permitsUniversalTransfer",
    }
    return (
        {target: payload.get(source) is True for target, source in fields.items()},
        all(type(payload.get(source)) is bool for source in fields.values()),
    )


def _redacted_production_account_snapshot(value: Any, observed_at: datetime) -> dict[str, Any]:
    balance = value if isinstance(value, dict) else {}
    totals = balance.get("total") if isinstance(balance.get("total"), dict) else {}
    non_zero_asset_count = sum(
        1
        for amount in totals.values()
        if isinstance(amount, (int, float)) and not isinstance(amount, bool) and float(amount) != 0
    )
    info = balance.get("info") if isinstance(balance.get("info"), dict) else {}
    return {
        "nonZeroAssetCount": non_zero_asset_count,
        "accountType": str(info.get("accountType") or "SPOT").strip().upper() or "SPOT",
        "observedAt": observed_at.isoformat(),
    }


def _parse_positive_int(raw: str | None) -> int | None:
    if raw is None:
        return None
    try:
        value = int(raw)
    except ValueError:
        return None
    return value if value > 0 else None


def _ccxt_capabilities(exchange: Any) -> dict[str, bool]:
    has = getattr(exchange, "has", {})
    has_map = has if isinstance(has, dict) else {}
    return {
        "sandboxMode": hasattr(exchange, "set_sandbox_mode"),
        "loadMarkets": hasattr(exchange, "load_markets"),
        "fetchStatus": bool(has_map["fetchStatus"]) if "fetchStatus" in has_map else hasattr(exchange, "fetch_status"),
        "fetchTime": bool(has_map["fetchTime"]) if "fetchTime" in has_map else hasattr(exchange, "fetch_time"),
        "fetchBalance": bool(has_map["fetchBalance"]) if "fetchBalance" in has_map else hasattr(exchange, "fetch_balance"),
        "createOrder": bool(has_map["createOrder"]) if "createOrder" in has_map else hasattr(exchange, "create_order"),
    }


def _timed(operation: Callable[[], Any]) -> tuple[Any, int]:
    start = perf_counter()
    result = operation()
    return result, int((perf_counter() - start) * 1000)
