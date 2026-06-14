from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def build_settings_status(
    *,
    cache_path: str | Path,
    cache_contexts: list[dict[str, Any]] | None = None,
    cache_stats: dict[str, Any] | None = None,
    finnhub_api_key: str | None = None,
    ccxt_exchange: str | None = None,
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
        "marketDataAdapters": _market_data_adapter_statuses(exchange),
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


def _market_data_adapter_statuses(exchange: str) -> list[dict[str, Any]]:
    return [
        {
            "id": "akshare-ohlcv",
            "market": "ashare",
            "adapter": "AkShareMarketDataAdapter",
            "provider": "akshare",
            "status": "ready",
            "route": "public_ohlcv",
            "capabilities": ["stock_zh_a_hist", "stock_zh_a_hist_min_em"],
            "timeframes": ["1d", "1m", "5m", "15m", "30m", "60m"],
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "note": "Normalizes A-share daily and recent minute OHLCV through public AKShare routes.",
        },
        {
            "id": "yfinance-ohlcv",
            "market": "us",
            "adapter": "YFinanceMarketDataAdapter",
            "provider": "yfinance",
            "status": "ready",
            "route": "public_ohlcv",
            "capabilities": ["Ticker.history"],
            "timeframes": ["1d", "1m", "5m", "15m", "30m", "60m"],
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "note": "Normalizes US equity OHLCV through yfinance without reading trading credentials.",
        },
        {
            "id": "ccxt-ohlcv",
            "market": "crypto",
            "adapter": "CcxtMarketDataAdapter",
            "provider": f"ccxt:{exchange}",
            "status": "ready",
            "route": "public_ohlcv",
            "capabilities": ["fetch_ohlcv"],
            "timeframes": ["1d", "1m", "5m", "15m", "30m", "60m"],
            "requiresApiKey": False,
            "requiresTradingKey": False,
            "cacheScope": "ohlcv",
            "note": "Normalizes public crypto exchange OHLCV; exchange trading keys stay outside this route.",
        },
    ]


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
