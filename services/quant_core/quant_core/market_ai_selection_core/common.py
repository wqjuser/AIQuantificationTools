from __future__ import annotations

import json
import math
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.request import Request, urlopen

from quant_core.market_calendar import build_market_calendar_status

from .contracts import _US_QUOTE_FRESHNESS

def _market_ai_selection_rate(numerator: int, denominator: int) -> float | None:
    return round(numerator / denominator * 100, 2) if denominator else None

def _split_crypto_symbol(value: str) -> tuple[str, str]:
    normalized = value.strip().upper()
    if "/" in normalized:
        base, target = normalized.split("/", 1)
    elif normalized.endswith("USDT"):
        base, target = normalized[:-4], "USDT"
    else:
        return normalized, ""
    return base, target

def _us_quote_is_fresh(quote_at: datetime, *, cutoff: datetime) -> bool:
    normalized_quote = _as_utc(quote_at)
    normalized_cutoff = _as_utc(cutoff)
    if normalized_quote > normalized_cutoff:
        return False
    calendar = build_market_calendar_status("us", at=normalized_cutoff)
    if calendar.get("status") == "open":
        return normalized_cutoff - normalized_quote <= _US_QUOTE_FRESHNESS
    trading_day = _parse_datetime(str(calendar.get("tradingDay") or ""))
    return (
        trading_day is not None
        and normalized_quote.date()
        >= trading_day.date() - timedelta(days=4)
    )

def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return _as_utc(value)
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.strip().replace("Z", "+00:00")
    try:
        return _as_utc(datetime.fromisoformat(normalized))
    except ValueError:
        for pattern in ("%Y%m%d", "%Y-%m-%d", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(normalized, pattern).replace(
                    tzinfo=timezone.utc
                )
            except ValueError:
                continue
    return None

def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

def _finite_or_none(value: Any) -> float | None:
    if isinstance(value, bool) or value is None or isinstance(value, (str, bytes)):
        return None
    try:
        normalized = float(value)
    except (TypeError, ValueError):
        return None
    return normalized if math.isfinite(normalized) else None

def _positive_or_none(value: Any) -> float | None:
    normalized = _finite_or_none(value)
    return normalized if normalized is not None and normalized > 0 else None

def _positive_number(value: Any) -> bool:
    return _positive_or_none(value) is not None

def _default_fetch_json(
    url: str,
    headers: Mapping[str, str],
    timeout_seconds: float = 10.0,
) -> Any:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "AIQuantificationTools/1.0",
            **dict(headers),
        },
        method="GET",
    )
    with urlopen(
        request,
        timeout=max(0.1, min(10.0, timeout_seconds)),
    ) as response:
        return json.loads(response.read().decode("utf-8"))
