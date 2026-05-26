from __future__ import annotations

import json
from dataclasses import asdict, dataclass
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


def market_search_to_payload(market: Market, query: str, results: list[MarketSearchResult]) -> dict[str, object]:
    return {
        "market": market,
        "query": query,
        "results": [asdict(result) for result in results],
    }


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
