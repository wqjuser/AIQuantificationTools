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
) -> dict[str, Any]:
    """Build a read-only platform settings status payload without returning secrets."""

    cache = Path(cache_path)
    stats = _normalize_cache_stats(cache_stats)
    finnhub_configured = bool((finnhub_api_key if finnhub_api_key is not None else os.getenv("FINNHUB_API_KEY", "")).strip())
    exchange = (ccxt_exchange if ccxt_exchange is not None else os.getenv("CCXT_DEFAULT_EXCHANGE", "binance")).strip() or "binance"

    return {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
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
        "cache": {
            "engine": "sqlite",
            "path": str(cache),
            "exists": cache.exists(),
            "scope": "ohlcv",
            "rowCount": stats["row_count"],
            "contextCount": stats["context_count"],
            "latestTimestamp": stats["latest_timestamp"],
            "contexts": [_cache_context_to_payload(context) for context in (cache_contexts or [])],
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


def _normalize_cache_stats(cache_stats: dict[str, Any] | None) -> dict[str, int | str | None]:
    if not cache_stats:
        return {"row_count": 0, "context_count": 0, "latest_timestamp": None}
    latest_timestamp = cache_stats.get("latest_timestamp")
    return {
        "row_count": _non_negative_int(cache_stats.get("row_count")),
        "context_count": _non_negative_int(cache_stats.get("context_count")),
        "latest_timestamp": latest_timestamp if isinstance(latest_timestamp, str) else None,
    }


def _cache_context_to_payload(context: dict[str, Any]) -> dict[str, int | str | None]:
    return {
        "market": str(context.get("market") or ""),
        "symbol": str(context.get("symbol") or ""),
        "timeframe": str(context.get("timeframe") or ""),
        "rowCount": _non_negative_int(context.get("row_count")),
        "startTimestamp": context.get("start_timestamp") if isinstance(context.get("start_timestamp"), str) else None,
        "endTimestamp": context.get("end_timestamp") if isinstance(context.get("end_timestamp"), str) else None,
    }


def _non_negative_int(value: object) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int) and value >= 0:
        return value
    return 0
