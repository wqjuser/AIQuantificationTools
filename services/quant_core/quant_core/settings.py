from __future__ import annotations

import os
from importlib.util import find_spec
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_PROVIDER_ERROR_CATEGORIES = ("rate_limit", "dependency", "network", "upstream", "incomplete_data", "unknown")
_PROVIDER_ERROR_CATEGORY_PRIORITY = {category: index for index, category in enumerate(_PROVIDER_ERROR_CATEGORIES)}


def build_settings_status(
    *,
    cache_path: str | Path,
    cache_contexts: list[dict[str, Any]] | None = None,
    cache_stats: dict[str, Any] | None = None,
    finnhub_api_key: str | None = None,
    ccxt_exchange: str | None = None,
    adapter_dependency_statuses: dict[str, bool] | None = None,
    adapter_error_events: list[dict[str, Any]] | None = None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    """Build a read-only platform settings status payload without returning secrets."""

    cache = Path(cache_path)
    stats = _normalize_cache_stats(cache_stats)
    generated_timestamp = generated_at or datetime.now(timezone.utc)
    cache_context_payloads = [
        _cache_context_to_payload(context, generated_at=generated_timestamp) for context in (cache_contexts or [])
    ]
    finnhub_configured = bool((finnhub_api_key if finnhub_api_key is not None else os.getenv("FINNHUB_API_KEY", "")).strip())
    exchange = (ccxt_exchange if ccxt_exchange is not None else os.getenv("CCXT_DEFAULT_EXCHANGE", "binance")).strip() or "binance"

    return {
        "schemaVersion": 1,
        "generatedAt": generated_timestamp.isoformat(),
        "dataSources": [
            {
                "market": "ashare",
                "label": "A shares",
                "quoteSource": "tencent",
                "klineSource": "tencent / eastmoney / akshare",
                "status": "ready",
                "optionalKeyName": None,
                "optionalKeyConfigured": False,
                "note": "Tencent daily K-lines and Eastmoney minute K-lines do not require local API keys.",
            },
            {
                "market": "us",
                "label": "US equities",
                "quoteSource": "finnhub / yfinance",
                "klineSource": "yahoo / yfinance",
                "status": "ready" if finnhub_configured else "degraded",
                "optionalKeyName": "FINNHUB_API_KEY",
                "optionalKeyConfigured": finnhub_configured,
                "note": (
                    "Finnhub quote key is configured; secret value is only read locally."
                    if finnhub_configured
                    else "FINNHUB_API_KEY is optional; yfinance remains available as a no-key fallback."
                ),
            },
            {
                "market": "crypto",
                "label": "Crypto",
                "quoteSource": f"ccxt:{exchange}",
                "klineSource": f"binance / coinbase / ccxt:{exchange}",
                "status": "ready",
                "optionalKeyName": "CCXT_DEFAULT_EXCHANGE",
                "optionalKeyConfigured": bool(os.getenv("CCXT_DEFAULT_EXCHANGE", "").strip()),
                "note": "Public OHLCV and ticker routes stay paper-only until exchange trade keys are explicitly certified.",
            },
        ],
        "marketDataAdapters": _market_data_adapter_statuses(
            exchange,
            cache_context_payloads,
            adapter_dependency_statuses=adapter_dependency_statuses,
            adapter_error_events=adapter_error_events,
            generated_at=generated_timestamp,
        ),
        "cache": {
            "engine": "sqlite",
            "path": str(cache),
            "exists": cache.exists(),
            "scope": "ohlcv",
            "rowCount": stats["row_count"],
            "contextCount": stats["context_count"],
            "latestTimestamp": stats["latest_timestamp"],
            "freshnessSummary": _cache_freshness_summary(cache_context_payloads),
            "contexts": cache_context_payloads,
        },
        "executionAdapters": [
            {
                "id": "paper-local",
                "market": "multi",
                "adapter": "Paper Trading",
                "route": "paper",
                "status": "paper_ready",
                "certification": "local",
                "liveTradingAllowed": False,
                "note": "Local paper execution is available after audited run and risk handoff checks.",
            },
            {
                "id": "ashare-live",
                "market": "ashare",
                "adapter": "A-share broker adapter",
                "route": "live",
                "status": "blocked",
                "certification": "interface_only",
                "liveTradingAllowed": False,
                "note": "Real A-share trading stays blocked until a legal broker adapter is certified.",
            },
            {
                "id": "us-live",
                "market": "us",
                "adapter": "IBKR / Alpaca adapter shape",
                "route": "live",
                "status": "config_required",
                "certification": "not_configured",
                "liveTradingAllowed": False,
                "note": "US live adapters require sandbox credentials, order lifecycle tests, and manual confirmation.",
            },
            {
                "id": "crypto-live",
                "market": "crypto",
                "adapter": "ccxt exchange adapter shape",
                "route": "live",
                "status": "config_required",
                "certification": "not_configured",
                "liveTradingAllowed": False,
                "note": "Exchange trading keys are not read by this status endpoint and live routing remains blocked.",
            },
        ],
        "safety": {
            "liveTradingAllowed": False,
            "requiredGates": ["adapter-certified", "risk-approved", "human-confirmed"],
        },
    }


def _market_data_adapter_statuses(
    exchange: str,
    cache_contexts: list[dict[str, Any]],
    *,
    adapter_dependency_statuses: dict[str, bool] | None,
    adapter_error_events: list[dict[str, Any]] | None,
    generated_at: datetime,
) -> list[dict[str, Any]]:
    akshare_telemetry = _market_data_adapter_external_telemetry(
        adapter_id="akshare-ohlcv",
        dependency="akshare",
        dependency_statuses=adapter_dependency_statuses,
        adapter_error_events=adapter_error_events,
        generated_at=generated_at,
    )
    yfinance_telemetry = _market_data_adapter_external_telemetry(
        adapter_id="yfinance-ohlcv",
        dependency="yfinance",
        dependency_statuses=adapter_dependency_statuses,
        adapter_error_events=adapter_error_events,
        generated_at=generated_at,
    )
    ccxt_telemetry = _market_data_adapter_external_telemetry(
        adapter_id="ccxt-ohlcv",
        dependency="ccxt",
        dependency_statuses=adapter_dependency_statuses,
        adapter_error_events=adapter_error_events,
        generated_at=generated_at,
    )
    return [
        {
            "id": "akshare-ohlcv",
            "market": "ashare",
            "adapter": "AkShareMarketDataAdapter",
            "provider": "akshare",
            "status": _market_data_adapter_status_from_telemetry(akshare_telemetry),
            "route": "public_ohlcv",
            "capabilities": ["stock_zh_a_hist", "stock_zh_a_hist_min_em"],
            "timeframes": ["1d", "1m", "5m", "15m", "30m", "60m"],
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "cacheDiagnostics": _market_data_adapter_cache_diagnostics("ashare", cache_contexts),
            "externalTelemetry": akshare_telemetry,
            "note": "Normalizes A-share daily and recent minute OHLCV through public AKShare routes.",
        },
        {
            "id": "yfinance-ohlcv",
            "market": "us",
            "adapter": "YFinanceMarketDataAdapter",
            "provider": "yfinance",
            "status": _market_data_adapter_status_from_telemetry(yfinance_telemetry),
            "route": "public_ohlcv",
            "capabilities": ["Ticker.history"],
            "timeframes": ["1d", "1m", "5m", "15m", "30m", "60m"],
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "cacheDiagnostics": _market_data_adapter_cache_diagnostics("us", cache_contexts),
            "externalTelemetry": yfinance_telemetry,
            "note": "Normalizes US equity OHLCV through yfinance without reading trading credentials.",
        },
        {
            "id": "ccxt-ohlcv",
            "market": "crypto",
            "adapter": "CcxtMarketDataAdapter",
            "provider": f"ccxt:{exchange}",
            "status": _market_data_adapter_status_from_telemetry(ccxt_telemetry),
            "route": "public_ohlcv",
            "capabilities": ["fetch_ohlcv"],
            "timeframes": ["1d", "1m", "5m", "15m", "30m", "60m"],
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "cacheDiagnostics": _market_data_adapter_cache_diagnostics("crypto", cache_contexts),
            "externalTelemetry": ccxt_telemetry,
            "note": "Normalizes public crypto exchange OHLCV; exchange trading keys stay outside this route.",
        },
    ]


def _market_data_adapter_external_telemetry(
    *,
    adapter_id: str,
    dependency: str,
    dependency_statuses: dict[str, bool] | None,
    adapter_error_events: list[dict[str, Any]] | None,
    generated_at: datetime,
) -> dict[str, Any]:
    available = _adapter_dependency_available(dependency, dependency_statuses)
    last_provider_error = _latest_provider_error_for_adapter(adapter_id, adapter_error_events)
    provider_health = _provider_health_for_adapter(
        adapter_id,
        adapter_error_events,
        dependency_available=available,
    )
    if available:
        if last_provider_error:
            return {
                "status": "degraded",
                "dependency": dependency,
                "dependencyAvailable": True,
                "lastError": last_provider_error["message"],
                "retryState": "provider_error",
                "checkedAt": generated_at.isoformat(),
                "installGuidance": _market_data_adapter_install_guidance(dependency),
                "lastProviderError": last_provider_error,
                "providerHealth": provider_health,
            }
        return {
            "status": "ok",
            "dependency": dependency,
            "dependencyAvailable": True,
            "lastError": None,
            "retryState": "idle",
            "checkedAt": generated_at.isoformat(),
            "installGuidance": _market_data_adapter_install_guidance(dependency),
            "lastProviderError": None,
            "providerHealth": provider_health,
        }
    return {
        "status": "blocked",
        "dependency": dependency,
        "dependencyAvailable": False,
        "lastError": f"optional package '{dependency}' is not installed",
        "retryState": "dependency_missing",
        "checkedAt": generated_at.isoformat(),
        "installGuidance": _market_data_adapter_install_guidance(dependency),
        "lastProviderError": last_provider_error,
        "providerHealth": provider_health,
    }


def _adapter_dependency_available(dependency: str, dependency_statuses: dict[str, bool] | None) -> bool:
    if dependency_statuses is not None and dependency in dependency_statuses:
        return bool(dependency_statuses[dependency])
    return find_spec(dependency) is not None


def _market_data_adapter_install_guidance(dependency: str) -> dict[str, str]:
    return {
        "packageName": dependency,
        "dockerBuildArg": "INSTALL_DATA_DEPS=true",
        "packageInstallCommand": f"pip install {dependency}",
        "projectExtraInstallCommand": 'pip install -e "services/quant_core[data]"',
        "note": (
            "Installs optional public market data dependencies only; "
            "it does not configure API keys or enable live trading."
        ),
    }


def _latest_provider_error_for_adapter(adapter_id: str, events: list[dict[str, Any]] | None) -> dict[str, str] | None:
    matching_events = [
        _provider_error_payload(event)
        for event in (events or [])
        if isinstance(event, dict) and event.get("adapterId") == adapter_id
    ]
    matching_events = [event for event in matching_events if event is not None]
    if not matching_events:
        return None
    return max(matching_events, key=lambda event: (event["createdAt"], event["eventId"]))


def _provider_health_for_adapter(
    adapter_id: str,
    events: list[dict[str, Any]] | None,
    *,
    dependency_available: bool,
) -> dict[str, Any]:
    matching_events = [
        _provider_error_payload(event)
        for event in (events or [])
        if isinstance(event, dict) and event.get("adapterId") == adapter_id
    ]
    matching_events = [event for event in matching_events if event is not None]
    recent_error_count = len(matching_events)
    last_error_at = None
    if matching_events:
        latest_event = max(matching_events, key=lambda event: (event["createdAt"], event["eventId"]))
        last_error_at = latest_event["createdAt"]
    category_summary = _provider_error_category_summary(matching_events)
    dominant_category = _dominant_provider_error_category(category_summary)

    if not dependency_available:
        status = "blocked"
        reason = "dependency_missing"
        retry_after_seconds = 0
    elif recent_error_count >= 3:
        status = "cooldown"
        reason = "provider_cooldown"
        retry_after_seconds = 900
    elif recent_error_count:
        status = "watch"
        reason = "recent_provider_errors"
        retry_after_seconds = 60 if recent_error_count == 1 else 300
    else:
        status = "ok"
        reason = "no_recent_provider_errors"
        retry_after_seconds = 0

    return {
        "status": status,
        "recentErrorCount": recent_error_count,
        "lastErrorAt": last_error_at,
        "affectedSymbols": sorted({event["symbol"] for event in matching_events}),
        "affectedContexts": sorted({event["context"] for event in matching_events}),
        "categorySummary": category_summary,
        "dominantCategory": dominant_category,
        "retryAfterSeconds": retry_after_seconds,
        "reason": reason,
    }


def _provider_error_payload(event: dict[str, Any]) -> dict[str, str] | None:
    required = ["eventId", "createdAt", "adapterId", "provider", "market", "symbol", "timeframe", "source", "context", "message"]
    if not all(isinstance(event.get(field), str) for field in required):
        return None
    payload = {field: str(event[field]) for field in required}
    payload["category"] = _provider_error_category(
        message=payload["message"],
        source=payload["source"],
        context=payload["context"],
    )
    return payload


def _provider_error_category(*, message: str, source: str, context: str) -> str:
    text = " ".join([message, source, context]).lower()
    if any(marker in text for marker in ["429", "too many requests", "rate limit", "rate-limit", "throttle", "throttled", "quota"]):
        return "rate_limit"
    if any(marker in text for marker in ["not installed", "no module named", "module not found", "importerror", "dependency"]):
        return "dependency"
    if any(marker in text for marker in ["incomplete", "empty response", "no rows", "missing data", "insufficient data"]):
        return "incomplete_data"
    if any(marker in text for marker in ["timeout", "timed out", "connection", "network", "dns", "ssl", "socket", "unreachable"]):
        return "network"
    if any(marker in text for marker in ["http 5", "500", "502", "503", "504", "bad gateway", "service unavailable", "upstream"]):
        return "upstream"
    return "unknown"


def _provider_error_category_summary(events: list[dict[str, str]]) -> dict[str, int]:
    summary = {category: 0 for category in _PROVIDER_ERROR_CATEGORIES}
    for event in events:
        category = event.get("category", "unknown")
        if category not in summary:
            category = "unknown"
        summary[category] += 1
    return summary


def _dominant_provider_error_category(summary: dict[str, int]) -> str | None:
    non_zero_categories = [(category, count) for category, count in summary.items() if count > 0]
    if not non_zero_categories:
        return None
    return sorted(
        non_zero_categories,
        key=lambda item: (-item[1], _PROVIDER_ERROR_CATEGORY_PRIORITY.get(item[0], len(_PROVIDER_ERROR_CATEGORIES))),
    )[0][0]


def _market_data_adapter_status_from_telemetry(telemetry: dict[str, Any]) -> str:
    if telemetry.get("status") == "degraded":
        return "degraded"
    return "ready" if telemetry.get("status") == "ok" else "blocked"


def _market_data_adapter_cache_diagnostics(market: str, cache_contexts: list[dict[str, Any]]) -> dict[str, Any]:
    matching_contexts = [context for context in cache_contexts if context.get("market") == market]
    freshness_summary = _cache_freshness_summary(matching_contexts)
    row_count = sum(_non_negative_int(context.get("rowCount")) for context in matching_contexts)
    return {
        "freshness": _market_data_adapter_cache_freshness(
            context_count=len(matching_contexts),
            row_count=row_count,
            freshness_summary=freshness_summary,
        ),
        "contextCount": len(matching_contexts),
        "rowCount": row_count,
        "latestTimestamp": _latest_cache_context_timestamp(matching_contexts),
        "freshnessSummary": freshness_summary,
    }


def _market_data_adapter_cache_freshness(
    *,
    context_count: int,
    row_count: int,
    freshness_summary: dict[str, int],
) -> str:
    if context_count <= 0 or row_count <= 0:
        return "empty"
    if freshness_summary.get("stale", 0) > 0:
        return "stale"
    if freshness_summary.get("fresh", 0) > 0:
        return "fresh"
    return "empty"


def _latest_cache_context_timestamp(contexts: list[dict[str, Any]]) -> str | None:
    end_timestamps = [
        context.get("endTimestamp") if isinstance(context.get("endTimestamp"), str) else None for context in contexts
    ]
    timestamps = [
        parsed
        for parsed in (_parse_timestamp(end_timestamp) for end_timestamp in end_timestamps)
        if parsed is not None
    ]
    if not timestamps:
        return None
    return max(timestamps).isoformat()


def build_execution_adapter_state_ledger(
    settings: dict[str, Any],
    *,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    """Build a read-only execution adapter state ledger from platform settings."""

    generated_timestamp = generated_at or datetime.now(timezone.utc)
    adapters = settings.get("executionAdapters") if isinstance(settings, dict) else []
    safety = settings.get("safety") if isinstance(settings, dict) else {}
    required_gates = [
        str(gate)
        for gate in (safety.get("requiredGates") if isinstance(safety, dict) else []) or []
        if str(gate).strip()
    ]
    adapter_payloads = [
        _execution_adapter_state_payload(adapter, required_gates=required_gates, generated_at=generated_timestamp)
        for adapter in adapters
        if isinstance(adapter, dict)
    ]
    live_adapters = [adapter for adapter in adapter_payloads if adapter["route"] == "live"]
    status_counts = _string_counts(adapter["currentState"] for adapter in adapter_payloads)
    return {
        "schemaVersion": 1,
        "generatedAt": generated_timestamp.isoformat(),
        "mode": "execution_adapter_state_ledger",
        "liveTradingAllowed": bool(safety.get("liveTradingAllowed")) if isinstance(safety, dict) else False,
        "requiredGates": required_gates,
        "summary": {
            "adapterCount": len(adapter_payloads),
            "liveAdapterCount": len(live_adapters),
            "certifiedLiveAdapters": sum(1 for adapter in live_adapters if adapter["liveTradingAllowed"]),
            "paperReadyAdapters": sum(1 for adapter in adapter_payloads if adapter["currentState"] == "paper_ready"),
            "blockedLiveAdapters": sum(1 for adapter in live_adapters if not adapter["liveTradingAllowed"]),
            "configRequiredAdapters": sum(1 for adapter in adapter_payloads if adapter["currentState"] == "config_required"),
            "requiredGateCount": len(required_gates),
            "stateCounts": status_counts,
        },
        "adapters": adapter_payloads,
    }


def _normalize_cache_stats(cache_stats: dict[str, Any] | None) -> dict[str, int | str | None]:
    if not cache_stats:
        return {"row_count": 0, "context_count": 0, "latest_timestamp": None}
    latest_timestamp = cache_stats.get("latest_timestamp")
    return {
        "row_count": _non_negative_int(cache_stats.get("row_count")),
        "context_count": _non_negative_int(cache_stats.get("context_count")),
        "latest_timestamp": latest_timestamp if isinstance(latest_timestamp, str) else None,
    }


def _cache_context_to_payload(context: dict[str, Any], *, generated_at: datetime) -> dict[str, int | str | None]:
    row_count = _non_negative_int(context.get("row_count"))
    end_timestamp = context.get("end_timestamp") if isinstance(context.get("end_timestamp"), str) else None
    freshness, age_hours = _cache_context_freshness(
        row_count=row_count,
        timeframe=str(context.get("timeframe") or ""),
        end_timestamp=end_timestamp,
        generated_at=generated_at,
    )
    return {
        "market": str(context.get("market") or ""),
        "symbol": str(context.get("symbol") or ""),
        "timeframe": str(context.get("timeframe") or ""),
        "rowCount": row_count,
        "startTimestamp": context.get("start_timestamp") if isinstance(context.get("start_timestamp"), str) else None,
        "endTimestamp": end_timestamp,
        "freshness": freshness,
        "ageHours": age_hours,
    }


def _cache_freshness_summary(contexts: list[dict[str, Any]]) -> dict[str, int]:
    summary = {"fresh": 0, "stale": 0, "empty": 0}
    for context in contexts:
        freshness = context.get("freshness")
        if freshness in summary:
            summary[freshness] += 1
    return summary


def _execution_adapter_state_payload(
    adapter: dict[str, Any],
    *,
    required_gates: list[str],
    generated_at: datetime,
) -> dict[str, Any]:
    adapter_id = str(adapter.get("id") or "")
    route = str(adapter.get("route") or "")
    status = str(adapter.get("status") or "")
    live_trading_allowed = bool(adapter.get("liveTradingAllowed")) and route == "live"
    current_state = _execution_adapter_current_state(route=route, status=status, live_trading_allowed=live_trading_allowed)
    gates = _execution_adapter_gates(
        adapter=adapter,
        current_state=current_state,
        required_gates=required_gates,
    )
    return {
        "id": adapter_id,
        "market": str(adapter.get("market") or ""),
        "adapter": str(adapter.get("adapter") or ""),
        "route": route,
        "status": status,
        "certification": str(adapter.get("certification") or ""),
        "currentState": current_state,
        "liveTradingAllowed": live_trading_allowed,
        "note": str(adapter.get("note") or ""),
        "nextStep": _execution_adapter_next_step(adapter, current_state=current_state),
        "gates": gates,
        "events": [
            {
                "eventId": f"adapter-ledger:{adapter_id}:{_execution_adapter_event_state(current_state)}",
                "adapterId": adapter_id,
                "timestamp": generated_at.isoformat(),
                "state": _execution_adapter_event_state(current_state),
                "label": _execution_adapter_state_label(current_state),
                "actor": "execution-safety",
                "source": "settings-status",
                "reason": _execution_adapter_event_reason(adapter, current_state=current_state),
                "liveTradingAllowed": live_trading_allowed,
            }
        ],
    }


def _execution_adapter_current_state(*, route: str, status: str, live_trading_allowed: bool) -> str:
    if route == "paper" and status == "paper_ready":
        return "paper_ready"
    if route == "live" and live_trading_allowed:
        return "live_ready"
    if status == "config_required":
        return "config_required"
    if status == "interface_only":
        return "blocked"
    if status == "blocked":
        return "blocked"
    return status or "unknown"


def _execution_adapter_gates(
    *,
    adapter: dict[str, Any],
    current_state: str,
    required_gates: list[str],
) -> list[dict[str, Any]]:
    if str(adapter.get("route") or "") == "paper":
        return [
            {
                "id": "paper-order-risk",
                "label": "Paper risk check",
                "passed": current_state == "paper_ready",
                "reason": "Local audited run, paper order, and risk checks are available before simulated fills.",
            }
        ]
    return [
        {
            "id": gate,
            "label": _execution_adapter_gate_label(gate),
            "passed": False,
            "reason": _execution_adapter_gate_reason(gate, adapter),
        }
        for gate in required_gates
    ]


def _execution_adapter_event_state(current_state: str) -> str:
    if current_state == "blocked":
        return "live_blocked"
    if current_state == "live_ready":
        return "live_ready"
    if current_state == "config_required":
        return "config_required"
    return current_state


def _execution_adapter_state_label(current_state: str) -> str:
    labels = {
        "paper_ready": "Paper adapter ready",
        "live_ready": "Live route ready",
        "blocked": "Live route blocked",
        "config_required": "Configuration required",
    }
    return labels.get(current_state, current_state.replace("_", " ").title())


def _execution_adapter_event_reason(adapter: dict[str, Any], *, current_state: str) -> str:
    note = str(adapter.get("note") or "").strip()
    if current_state == "paper_ready":
        return note or "Paper execution is available locally after audited run and risk checks."
    if current_state == "config_required":
        return note or "Adapter configuration is required before certification can start."
    if current_state == "live_ready":
        return note or "Live adapter certification is complete, but order routing still requires explicit controls."
    return "Live execution remains blocked until adapter certification, risk approval, and human confirmation pass."


def _execution_adapter_next_step(adapter: dict[str, Any], *, current_state: str) -> str:
    if current_state == "paper_ready":
        return "Use paper execution for audited research runs before certifying live adapters."
    if current_state == "config_required":
        return "Configure sandbox credentials, order lifecycle tests, and emergency-stop limits before certification."
    if current_state == "live_ready":
        return "Keep human confirmation and risk approval gates attached to every promoted order."
    note = str(adapter.get("note") or "").strip()
    return note or "Keep live trading blocked until a legal adapter certification passes."


def _execution_adapter_gate_label(gate: str) -> str:
    return {
        "adapter-certified": "Adapter certified",
        "risk-approved": "Risk approved",
        "human-confirmed": "Human confirmed",
    }.get(gate, gate.replace("-", " ").title())


def _execution_adapter_gate_reason(gate: str, adapter: dict[str, Any]) -> str:
    if gate == "adapter-certified":
        return str(adapter.get("note") or "No certified live adapter is connected.")
    if gate == "risk-approved":
        return "Live routing requires an audited risk approval for the selected run and adapter."
    if gate == "human-confirmed":
        return "Live routing requires explicit human confirmation after adapter and risk checks."
    return "Required live execution gate is not satisfied."


def _string_counts(values: Any) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        key = str(value or "")
        if not key:
            continue
        counts[key] = counts.get(key, 0) + 1
    return dict(sorted(counts.items()))


def _cache_context_freshness(
    *, row_count: int, timeframe: str, end_timestamp: str | None, generated_at: datetime
) -> tuple[str, int | None]:
    end = _parse_timestamp(end_timestamp)
    if row_count <= 0 or end is None:
        return "empty", None
    reference = generated_at if generated_at.tzinfo else generated_at.replace(tzinfo=timezone.utc)
    age_hours = max(0, int((reference.astimezone(timezone.utc) - end).total_seconds() // 3600))
    fresh_threshold_hours = 96 if timeframe == "1d" else 24
    return ("fresh" if age_hours <= fresh_threshold_hours else "stale"), age_hours


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _non_negative_int(value: object) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int) and value >= 0:
        return value
    return 0
