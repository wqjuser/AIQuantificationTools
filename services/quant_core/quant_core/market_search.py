from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Callable
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from quant_core.domain import Market

FetchText = Callable[[str, str], str]

EASTMONEY_TOKEN = "44c9d251add88e27b65ed86506f6e5da"


@dataclass(frozen=True)
class MarketSearchResult:
    market: Market
    symbol: str
    name: str
    source: str
    exchange: str | None = None
    pinyin: str | None = None


LOCAL_SYMBOL_CATALOG: tuple[MarketSearchResult, ...] = (
    MarketSearchResult(market="ashare", symbol="600000", name="浦发银行", source="local", exchange="沪A", pinyin="PFYH"),
    MarketSearchResult(market="ashare", symbol="600519", name="贵州茅台", source="local", exchange="沪A", pinyin="GZMT"),
    MarketSearchResult(market="ashare", symbol="601318", name="中国平安", source="local", exchange="沪A", pinyin="ZGPA"),
    MarketSearchResult(market="ashare", symbol="000001", name="平安银行", source="local", exchange="深A", pinyin="PAYH"),
    MarketSearchResult(market="ashare", symbol="300750", name="宁德时代", source="local", exchange="创业板", pinyin="NDSD"),
    MarketSearchResult(market="us", symbol="AAPL", name="Apple Inc.", source="local", exchange="NASDAQ"),
    MarketSearchResult(market="us", symbol="MSFT", name="Microsoft Corp.", source="local", exchange="NASDAQ"),
    MarketSearchResult(market="us", symbol="NVDA", name="NVIDIA Corp.", source="local", exchange="NASDAQ"),
    MarketSearchResult(market="us", symbol="TSLA", name="Tesla Inc.", source="local", exchange="NASDAQ"),
    MarketSearchResult(market="crypto", symbol="BTC/USDT", name="Bitcoin", source="local", exchange="Coinbase/Binance"),
    MarketSearchResult(market="crypto", symbol="ETH/USDT", name="Ethereum", source="local", exchange="Coinbase/Binance"),
    MarketSearchResult(market="crypto", symbol="SOL/USDT", name="Solana", source="local", exchange="Coinbase/Binance"),
)


class MarketSymbolSearchAdapter:
    def __init__(self, *, fetch_text: FetchText | None = None) -> None:
        self.fetch_text = fetch_text or default_fetch_text

    def search(self, market: Market, query: str, limit: int = 8) -> list[MarketSearchResult]:
        clean_query = query.strip()
        bounded_limit = max(1, min(int(limit or 8), 20))
        if not clean_query:
            return []
        if market == "ashare":
            try:
                results = self._search_eastmoney_ashare(clean_query, bounded_limit)
                if results:
                    return results[:bounded_limit]
            except Exception:
                pass
        return local_symbol_search(market, clean_query, bounded_limit)

    def _search_eastmoney_ashare(self, query: str, limit: int) -> list[MarketSearchResult]:
        params = urlencode(
            {
                "input": query,
                "count": limit,
                "type": 14,
                "token": EASTMONEY_TOKEN,
            }
        )
        payload = json.loads(self.fetch_text(f"https://searchapi.eastmoney.com/api/suggest/get?{params}", "utf-8"))
        return eastmoney_search_payload_to_results(payload)


def eastmoney_search_payload_to_results(payload: dict[str, object]) -> list[MarketSearchResult]:
    table = payload.get("QuotationCodeTable")
    if not isinstance(table, dict):
        return []
    rows = table.get("Data")
    if not isinstance(rows, list):
        return []
    results: list[MarketSearchResult] = []
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict):
            continue
        if str(row.get("Classify", "")).lower() != "astock":
            continue
        symbol = str(row.get("Code", "")).strip().upper()
        name = str(row.get("Name", "")).strip()
        if not symbol or not name or symbol in seen:
            continue
        seen.add(symbol)
        results.append(
            MarketSearchResult(
                market="ashare",
                symbol=symbol,
                name=name,
                source="eastmoney",
                exchange=str(row.get("SecurityTypeName") or "") or None,
                pinyin=str(row.get("PinYin") or "") or None,
            )
        )
    return results


def local_symbol_search(market: Market, query: str, limit: int) -> list[MarketSearchResult]:
    normalized = query.strip().upper().replace(" ", "")
    compact = normalized.replace("/", "")
    scored: list[tuple[int, MarketSearchResult]] = []
    for item in LOCAL_SYMBOL_CATALOG:
        if item.market != market:
            continue
        symbol = item.symbol.upper()
        name = item.name.upper()
        pinyin = (item.pinyin or "").upper()
        symbol_compact = symbol.replace("/", "")
        if symbol.startswith(normalized) or symbol_compact.startswith(compact):
            scored.append((0, item))
        elif name.startswith(normalized) or pinyin.startswith(normalized):
            scored.append((1, item))
        elif normalized in symbol or compact in symbol_compact or normalized in name or normalized in pinyin:
            scored.append((2, item))
    scored.sort(key=lambda entry: (entry[0], entry[1].symbol))
    return [item for _score, item in scored[:limit]]


def market_search_to_payload(
    market: Market,
    query: str,
    results: list[MarketSearchResult],
    *,
    timeframe: str | None = None,
    cache_contexts: list[dict[str, object] | None] | None = None,
    generated_at: datetime | None = None,
) -> dict[str, object]:
    context_by_key = {
        _cache_context_key(context): context
        for context in (cache_contexts or [])
        if context is not None and _cache_context_key(context)
    }
    rows: list[dict[str, object]] = []
    for result in results:
        row = asdict(result)
        if timeframe:
            row["cache"] = _market_search_cache_payload(
                context_by_key.get(f"{result.market}:{result.symbol}:{timeframe}"),
                timeframe=timeframe,
                generated_at=generated_at,
            )
        rows.append(row)
    return {
        "market": market,
        "query": query,
        **({"timeframe": timeframe} if timeframe else {}),
        "results": rows,
    }


def _cache_context_key(context: dict[str, object] | None) -> str:
    if not context:
        return ""
    market = str(context.get("market") or "")
    symbol = str(context.get("symbol") or "")
    timeframe = str(context.get("timeframe") or "")
    return f"{market}:{symbol}:{timeframe}" if market and symbol and timeframe else ""


def _market_search_cache_payload(
    context: dict[str, object] | None, *, timeframe: str, generated_at: datetime | None = None
) -> dict[str, object]:
    if not context:
        return {
            "freshness": "empty",
            "rowCount": 0,
            "ageHours": None,
            "startTimestamp": None,
            "endTimestamp": None,
        }
    row_count = _non_negative_int(context.get("row_count"))
    end_timestamp = _optional_string(context.get("end_timestamp"))
    freshness, age_hours = _cache_context_freshness(
        row_count=row_count,
        timeframe=timeframe,
        end_timestamp=end_timestamp,
        generated_at=generated_at or datetime.now(timezone.utc),
    )
    return {
        "freshness": freshness,
        "rowCount": row_count,
        "ageHours": age_hours,
        "startTimestamp": _optional_string(context.get("start_timestamp")),
        "endTimestamp": end_timestamp,
    }


def _cache_context_freshness(
    *, row_count: int, timeframe: str, end_timestamp: str | None, generated_at: datetime
) -> tuple[str, int | None]:
    end = _parse_timestamp(end_timestamp)
    if row_count <= 0 or end is None:
        return "empty", None
    reference = generated_at if generated_at.tzinfo else generated_at.replace(tzinfo=timezone.utc)
    age_hours = max(0, int((reference.astimezone(timezone.utc) - end).total_seconds() // 3600))
    fresh_threshold_hours = {"1d": 96, "1w": 240}.get(timeframe, 24)
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


def _optional_string(value: object) -> str | None:
    return value if isinstance(value, str) and value else None


def default_fetch_text(url: str, encoding: str = "utf-8") -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 AIQuantificationTools/0.1",
            "Referer": "https://quote.eastmoney.com/",
        },
    )
    with urlopen(request, timeout=10) as response:
        return response.read().decode(encoding, errors="ignore")
