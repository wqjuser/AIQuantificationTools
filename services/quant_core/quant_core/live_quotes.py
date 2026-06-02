from __future__ import annotations

import json
import os
import time
from contextlib import redirect_stderr
from dataclasses import asdict
from datetime import datetime, timezone
from io import StringIO
from typing import Callable
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from quant_core.domain import Market, MarketQuote
from quant_core.terminal import Instrument, TerminalWorkspace, apply_market_quotes

FetchText = Callable[[str, str], str]
Now = Callable[[], float]


class QuoteCache:
    def __init__(self, ttl_seconds: int = 30, now: Now | None = None) -> None:
        self.ttl_seconds = ttl_seconds
        self._now = now or time.time
        self._items: dict[str, tuple[float, MarketQuote]] = {}

    def get(self, key: str) -> MarketQuote | None:
        item = self._items.get(key)
        if not item:
            return None
        timestamp, quote = item
        if self._now() - timestamp > self.ttl_seconds:
            self._items.pop(key, None)
            return None
        return quote

    def set(self, key: str, quote: MarketQuote) -> MarketQuote:
        self._items[key] = (self._now(), quote)
        return quote


class QuantDingerLiveQuoteAdapter:
    """REST quote adapter modeled after QuantDinger's get_ticker + watchlist cache path."""

    def __init__(
        self,
        *,
        finnhub_api_key: str | None = None,
        fetch_text: FetchText | None = None,
        cache_ttl_seconds: int = 30,
        now: Now | None = None,
    ) -> None:
        self.finnhub_api_key = finnhub_api_key if finnhub_api_key is not None else os.getenv("FINNHUB_API_KEY", "")
        self.fetch_text = fetch_text or default_fetch_text
        self.cache = QuoteCache(ttl_seconds=cache_ttl_seconds, now=now)

    def cache_key(self, market: Market, symbol: str) -> str:
        return f"watchlist_price:{market}:{symbol.strip().upper()}"

    def fetch_quote(self, market: Market, symbol: str) -> MarketQuote:
        normalized_symbol = symbol.strip().upper()
        key = self.cache_key(market, normalized_symbol)
        cached = self.cache.get(key)
        if cached:
            return cached

        try:
            if market == "ashare":
                quote = self._fetch_tencent_ashare_quote(normalized_symbol)
            elif market == "us":
                quote = self._fetch_us_quote(normalized_symbol)
            elif market == "crypto":
                quote = self._fetch_crypto_quote(normalized_symbol)
            else:
                quote = unavailable_quote(market, normalized_symbol, "unsupported market")
        except Exception as exc:
            quote = unavailable_quote(market, normalized_symbol, str(exc))
        return self.cache.set(key, quote)

    def fetch_quotes(self, instruments: list[Instrument]) -> list[MarketQuote]:
        return [self.fetch_quote(instrument.market, instrument.symbol) for instrument in instruments]

    def _fetch_us_quote(self, symbol: str) -> MarketQuote:
        if self.finnhub_api_key:
            params = urlencode({"symbol": symbol, "token": self.finnhub_api_key})
            payload = json.loads(self.fetch_text(f"https://finnhub.io/api/v1/quote?{params}", "utf-8"))
            if payload.get("c"):
                return MarketQuote(
                    market="us",
                    symbol=symbol,
                    price=float(payload.get("c") or 0),
                    change=float(payload.get("d") or 0),
                    change_pct=float(payload.get("dp") or 0),
                    high=float(payload.get("h") or 0),
                    low=float(payload.get("l") or 0),
                    open=float(payload.get("o") or 0),
                    previous_close=float(payload.get("pc") or 0),
                    source="finnhub",
                    as_of=quote_timestamp(payload.get("t")),
                )

        quote = self._fetch_yfinance_quote(symbol)
        if quote:
            return quote
        return unavailable_quote("us", symbol, "FINNHUB_API_KEY not configured and yfinance quote unavailable")

    def _fetch_yfinance_quote(self, symbol: str) -> MarketQuote | None:
        try:
            import yfinance as yf  # type: ignore

            with redirect_stderr(StringIO()):
                ticker = yf.Ticker(symbol)
                fast_info = ticker.fast_info
                price = as_float(fast_info.get("lastPrice") or fast_info.get("last_price"))
                previous_close = as_float(
                    fast_info.get("previousClose")
                    or fast_info.get("previous_close")
                    or fast_info.get("regularMarketPreviousClose")
                )
                high = as_float(fast_info.get("dayHigh") or fast_info.get("day_high") or price)
                low = as_float(fast_info.get("dayLow") or fast_info.get("day_low") or price)
                open_price = as_float(fast_info.get("open") or fast_info.get("regularMarketOpen") or price)
            if not price:
                return None
            change = price - previous_close if previous_close else 0.0
            return MarketQuote(
                market="us",
                symbol=symbol,
                price=price,
                change=round(change, 4),
                change_pct=round(change / previous_close * 100, 2) if previous_close else 0.0,
                high=high,
                low=low,
                open=open_price,
                previous_close=previous_close,
                source="yfinance",
                as_of=datetime.now(timezone.utc),
            )
        except Exception:
            return None

    def _fetch_tencent_ashare_quote(self, symbol: str) -> MarketQuote:
        code = normalize_ashare_tencent_code(symbol)
        text = self.fetch_text(f"https://qt.gtimg.cn/q={code.lower()}", "gbk").strip()
        parts = parse_tencent_payload(text)
        if len(parts) <= 5:
            return unavailable_quote("ashare", symbol, "Tencent quote payload is empty")
        price = part_float(parts, 3)
        previous_close = part_float(parts, 4)
        change = round(price - previous_close, 4) if previous_close else 0.0
        return MarketQuote(
            market="ashare",
            symbol=symbol,
            price=price,
            change=change,
            change_pct=round(change / previous_close * 100, 2) if previous_close else 0.0,
            high=part_float(parts, 33, price),
            low=part_float(parts, 34, price),
            open=part_float(parts, 5, price),
            previous_close=previous_close,
            source="tencent",
            as_of=datetime.now(timezone.utc),
        )

    def _fetch_crypto_quote(self, symbol: str) -> MarketQuote:
        try:
            import ccxt  # type: ignore

            exchange_id = os.getenv("CCXT_DEFAULT_EXCHANGE", "binance").strip().lower() or "binance"
            exchange_class = getattr(ccxt, exchange_id)
            exchange = exchange_class({"enableRateLimit": True, "timeout": int(os.getenv("CCXT_TIMEOUT", "10000"))})
            normalized = normalize_crypto_symbol(symbol)
            ticker = exchange.fetch_ticker(normalized)
            price = as_float(ticker.get("last") or ticker.get("close"))
            previous_close = as_float(ticker.get("previousClose") or ticker.get("open"))
            change = as_float(ticker.get("change"))
            change_pct = as_float(ticker.get("percentage"))
            return MarketQuote(
                market="crypto",
                symbol=symbol,
                price=price,
                change=change,
                change_pct=change_pct,
                high=as_float(ticker.get("high") or price),
                low=as_float(ticker.get("low") or price),
                open=as_float(ticker.get("open") or price),
                previous_close=previous_close,
                source=f"ccxt:{exchange_id}",
                as_of=datetime.now(timezone.utc),
            )
        except Exception as exc:
            return unavailable_quote("crypto", symbol, str(exc))


def workspace_with_live_quotes(
    workspace: TerminalWorkspace,
    adapter: QuantDingerLiveQuoteAdapter,
) -> tuple[TerminalWorkspace, list[MarketQuote]]:
    quotes = adapter.fetch_quotes(workspace.watchlist)
    return apply_market_quotes(workspace, quotes), quotes


def market_quotes_to_payload(quotes: list[MarketQuote]) -> dict[str, object]:
    return {"quotes": [quote_to_payload(quote) for quote in quotes]}


def quote_to_payload(quote: MarketQuote) -> dict[str, object]:
    payload = asdict(quote)
    payload["changePct"] = payload.pop("change_pct")
    payload["previousClose"] = payload.pop("previous_close")
    payload["isLive"] = payload.pop("is_live")
    payload["asOf"] = payload.pop("as_of").isoformat()
    return payload


def normalize_ashare_tencent_code(symbol: str) -> str:
    value = symbol.strip().upper()
    if value.endswith(".SH") or value.endswith(".SS"):
        return "SH" + value[:6]
    if value.endswith(".SZ"):
        return "SZ" + value[:6]
    if value.isdigit() and len(value) == 6:
        return ("SH" if value.startswith("6") else "SZ") + value
    return value


def normalize_crypto_symbol(symbol: str) -> str:
    value = symbol.strip().upper()
    if "/" in value:
        return value.split(":", 1)[0]
    for quote in ("USDT", "USDC", "USD", "BTC", "ETH"):
        if value.endswith(quote) and len(value) > len(quote):
            return f"{value[:-len(quote)]}/{quote}"
    return f"{value}/USDT"


def parse_tencent_payload(text: str) -> list[str]:
    if not text or "~" not in text:
        return []
    try:
        start = text.index('="') + 2
        end = text.rindex('"')
    except ValueError:
        return []
    return text[start:end].split("~")


def unavailable_quote(market: Market, symbol: str, warning: str) -> MarketQuote:
    return MarketQuote(
        market=market,
        symbol=symbol,
        price=0.0,
        change=0.0,
        change_pct=0.0,
        source="unavailable",
        as_of=datetime.now(timezone.utc),
        is_live=False,
        warning=warning,
    )


def quote_timestamp(value: object) -> datetime:
    try:
        timestamp = int(float(value))
    except (TypeError, ValueError):
        timestamp = 0
    if timestamp <= 0:
        return datetime.now(timezone.utc)
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def part_float(parts: list[str], index: int, default: float = 0.0) -> float:
    try:
        return float(parts[index])
    except (IndexError, TypeError, ValueError):
        return default


def as_float(value: object, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def default_fetch_text(url: str, encoding: str = "utf-8") -> str:
    request = Request(url, headers={"User-Agent": "AIQuantificationTools/0.1"})
    with urlopen(request, timeout=8) as response:
        return response.read().decode(encoding, errors="ignore")
