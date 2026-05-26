from __future__ import annotations

import json
import os
import time
from contextlib import contextmanager
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Callable
from urllib.parse import urlencode
from urllib.request import ProxyHandler, Request, build_opener, urlopen

from quant_core.adapters import DemoMarketDataAdapter, MarketDataAdapter
from quant_core.domain import DataQuality, Market, MarketDataRequest, OHLCVBar, Timeframe
from quant_core.live_quotes import normalize_ashare_tencent_code, normalize_crypto_symbol

FetchText = Callable[[str, str], str]
Now = Callable[[], float]


class KlineCache:
    def __init__(self, ttl_seconds: int = 90, now: Now | None = None) -> None:
        self.ttl_seconds = ttl_seconds
        self._now = now or time.time
        self._items: dict[str, tuple[float, list[OHLCVBar], DataQuality]] = {}

    def get(self, key: str) -> tuple[list[OHLCVBar], DataQuality] | None:
        item = self._items.get(key)
        if not item:
            return None
        timestamp, bars, quality = item
        if self._now() - timestamp > self.ttl_seconds:
            self._items.pop(key, None)
            return None
        return bars, quality

    def set(self, key: str, bars: list[OHLCVBar], quality: DataQuality) -> tuple[list[OHLCVBar], DataQuality]:
        self._items[key] = (self._now(), bars, quality)
        return bars, quality


class QuantDingerKlineAdapter:
    """K-line adapter modeled after QuantDinger's /api/kline + KlineService path."""

    def __init__(
        self,
        *,
        fetch_text: FetchText | None = None,
        fallback_adapter: MarketDataAdapter | None = None,
        cache_ttl_seconds: int = 90,
        now: Now | None = None,
    ) -> None:
        self.fetch_text = fetch_text or default_fetch_text
        self.fallback_adapter = fallback_adapter or DemoMarketDataAdapter()
        self.cache = KlineCache(ttl_seconds=cache_ttl_seconds, now=now)

    def cache_key(self, request: MarketDataRequest, limit: int) -> str:
        return f"kline:{request.market}:{request.symbol.strip().upper()}:{request.timeframe}:{limit}"

    def fetch_ohlcv(self, request: MarketDataRequest, limit: int = 160) -> tuple[list[OHLCVBar], DataQuality]:
        bounded_limit = max(1, min(int(limit or 160), 500))
        key = self.cache_key(request, bounded_limit)
        cached = self.cache.get(key)
        if cached:
            return cached

        try:
            if request.market == "ashare":
                bars, quality = self._fetch_ashare_bars(request, bounded_limit)
            elif request.market == "us":
                bars, quality = self._fetch_us_bars(request, bounded_limit)
            elif request.market == "crypto":
                bars, quality = self._fetch_crypto_bars(request, bounded_limit)
            else:
                bars, quality = self._fallback(request, bounded_limit, "unsupported market")
        except Exception as exc:
            bars, quality = self._fallback(request, bounded_limit, str(exc))
        return self.cache.set(key, bars, quality)

    def _fetch_ashare_bars(self, request: MarketDataRequest, limit: int) -> tuple[list[OHLCVBar], DataQuality]:
        if request.timeframe != "1d":
            bars = self._fetch_eastmoney_ashare_minute_bars(request, limit)
            if bars:
                return bars[-limit:], DataQuality(source="eastmoney", is_complete=True, warnings=[], rows=len(bars[-limit:]))
            bars = self._fetch_akshare_ashare_minute_bars(request, limit)
            if bars:
                return bars[-limit:], DataQuality(source="akshare", is_complete=True, warnings=[], rows=len(bars[-limit:]))
            return self._fallback(request, limit, "Eastmoney and AkShare minute K-lines returned no chart bars")

        code = normalize_ashare_tencent_code(request.symbol).lower()
        params = urlencode({"param": f"{code},day,,,{limit},qfq"})
        payload = json.loads(self.fetch_text(f"https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?{params}", "utf-8"))
        rows = extract_tencent_kline_rows(payload, code, "day")
        bars = [
            row_to_ohlcv_bar(row, market="ashare", symbol=request.symbol, timeframe=request.timeframe)
            for row in rows
        ]
        bars = [bar for bar in bars if bar is not None]
        bars.sort(key=lambda bar: bar.timestamp)
        if not bars:
            return self._fallback(request, limit, "Tencent fqkline returned no chart bars")
        return bars[-limit:], DataQuality(source="tencent", is_complete=True, warnings=[], rows=len(bars[-limit:]))

    def _fetch_eastmoney_ashare_minute_bars(self, request: MarketDataRequest, limit: int) -> list[OHLCVBar]:
        period = akshare_minute_period(request.timeframe)
        if not period:
            return []
        secid = eastmoney_secid(request.symbol)
        if period == "1":
            params = urlencode(
                {
                    "fields1": "f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13",
                    "fields2": "f51,f52,f53,f54,f55,f56,f57,f58",
                    "ut": "7eea3edcaed734bea9cbfc24409ed989",
                    "ndays": 5,
                    "iscr": 0,
                    "secid": secid,
                }
            )
            payload = json.loads(fetch_text_direct(f"https://push2his.eastmoney.com/api/qt/stock/trends2/get?{params}"))
            rows = ((payload.get("data") or {}) if isinstance(payload, dict) else {}).get("trends") or []
        else:
            params = urlencode(
                {
                    "fields1": "f1,f2,f3,f4,f5,f6",
                    "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
                    "ut": "7eea3edcaed734bea9cbfc24409ed989",
                    "klt": period,
                    "fqt": 1,
                    "secid": secid,
                    "beg": 0,
                    "end": 20500000,
                }
            )
            payload = json.loads(fetch_text_direct(f"https://push2his.eastmoney.com/api/qt/stock/kline/get?{params}"))
            rows = ((payload.get("data") or {}) if isinstance(payload, dict) else {}).get("klines") or []
        return eastmoney_minute_rows_to_bars(rows, market="ashare", symbol=request.symbol, timeframe=request.timeframe)

    def _fetch_akshare_ashare_minute_bars(self, request: MarketDataRequest, limit: int) -> list[OHLCVBar]:
        period = akshare_minute_period(request.timeframe)
        if not period:
            return []
        try:
            import akshare as ak  # type: ignore
        except ImportError:
            return []

        symbol = normalize_ashare_tencent_code(request.symbol)[2:]
        end = request.end or datetime.now()
        if end.tzinfo:
            end = end.astimezone().replace(tzinfo=None)
        start = end - timedelta(days=16)
        adjust = "" if period == "1" else "qfq"
        with bypass_proxy():
            frame = ak.stock_zh_a_hist_min_em(
                symbol=symbol,
                start_date=start.strftime("%Y-%m-%d %H:%M:%S"),
                end_date=end.strftime("%Y-%m-%d %H:%M:%S"),
                period=period,
                adjust=adjust,
            )
        return akshare_minute_frame_to_bars(frame, market="ashare", symbol=request.symbol, timeframe=request.timeframe)

    def _fetch_us_bars(self, request: MarketDataRequest, limit: int) -> tuple[list[OHLCVBar], DataQuality]:
        try:
            import yfinance as yf  # type: ignore
        except ImportError:
            return self._fallback(request, limit, "yfinance is not installed")

        interval, period = yfinance_period(request.timeframe)
        frame = yf.Ticker(request.symbol).history(period=period, interval=interval, auto_adjust=False)
        if frame is None or frame.empty:
            return self._fallback(request, limit, "yfinance returned no chart bars")
        bars: list[OHLCVBar] = []
        for timestamp, row in frame.tail(limit).iterrows():
            bars.append(
                OHLCVBar(
                    symbol=request.symbol,
                    market="us",
                    timeframe=request.timeframe,
                    timestamp=coerce_datetime(timestamp),
                    open=round(float(row["Open"]), 4),
                    high=round(float(row["High"]), 4),
                    low=round(float(row["Low"]), 4),
                    close=round(float(row["Close"]), 4),
                    volume=round(float(row.get("Volume", 0) or 0), 2),
                )
            )
        return bars, DataQuality(source="yfinance", is_complete=True, warnings=[], rows=len(bars))

    def _fetch_crypto_bars(self, request: MarketDataRequest, limit: int) -> tuple[list[OHLCVBar], DataQuality]:
        try:
            import ccxt  # type: ignore
        except ImportError:
            return self._fallback(request, limit, "ccxt is not installed")

        exchange_id = os.getenv("CCXT_DEFAULT_EXCHANGE", "binance").strip().lower() or "binance"
        exchange_class = getattr(ccxt, exchange_id)
        exchange = exchange_class({"enableRateLimit": True, "timeout": int(os.getenv("CCXT_TIMEOUT", "10000"))})
        rows = exchange.fetch_ohlcv(normalize_crypto_symbol(request.symbol), timeframe=ccxt_timeframe(request.timeframe), limit=limit)
        bars = [
            OHLCVBar(
                symbol=request.symbol,
                market="crypto",
                timeframe=request.timeframe,
                timestamp=datetime.fromtimestamp(float(row[0]) / 1000, tz=timezone.utc),
                open=round(float(row[1]), 4),
                high=round(float(row[2]), 4),
                low=round(float(row[3]), 4),
                close=round(float(row[4]), 4),
                volume=round(float(row[5]), 2),
            )
            for row in rows
        ]
        return bars, DataQuality(source=f"ccxt:{exchange_id}", is_complete=True, warnings=[], rows=len(bars))

    def _fallback(self, request: MarketDataRequest, limit: int, reason: str) -> tuple[list[OHLCVBar], DataQuality]:
        bars, quality = self.fallback_adapter.fetch_ohlcv(request)
        limited = bars[-limit:]
        return limited, DataQuality(
            source=f"{quality.source}-fallback",
            is_complete=False,
            warnings=[reason, *quality.warnings],
            rows=len(limited),
        )


def extract_tencent_kline_rows(payload: dict[str, object], code: str, period: str) -> list[object]:
    data = payload.get("data")
    if not isinstance(data, dict):
        return []
    root = data.get(code)
    if not isinstance(root, dict):
        return []
    for key in (f"qfq{period}", period):
        rows = root.get(key)
        if isinstance(rows, list):
            return rows
    for key, value in root.items():
        if str(key).lower().endswith(period) and isinstance(value, list):
            return value
    return []


def row_to_ohlcv_bar(row: object, *, market: Market, symbol: str, timeframe: Timeframe) -> OHLCVBar | None:
    if not isinstance(row, (list, tuple)) or len(row) < 6:
        return None
    try:
        return OHLCVBar(
            symbol=symbol,
            market=market,
            timeframe=timeframe,
            timestamp=parse_tencent_time(str(row[0])),
            open=round(float(row[1]), 4),
            close=round(float(row[2]), 4),
            high=round(float(row[3]), 4),
            low=round(float(row[4]), 4),
            volume=round(float(row[5]), 2),
        )
    except (TypeError, ValueError):
        return None


def parse_tencent_time(value: str) -> datetime:
    raw = value.strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            parsed = datetime.strptime(raw, fmt)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    timestamp = float(raw)
    if timestamp > 10**12:
        timestamp /= 1000
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def akshare_minute_period(timeframe: Timeframe) -> str | None:
    return {"1m": "1", "5m": "5", "15m": "15", "30m": "30", "60m": "60"}.get(timeframe)


def eastmoney_secid(symbol: str) -> str:
    code = normalize_ashare_tencent_code(symbol)
    digits = code[2:] if len(code) >= 8 else code
    market_id = "1" if code.upper().startswith("SH") or digits.startswith("6") else "0"
    return f"{market_id}.{digits}"


def eastmoney_minute_rows_to_bars(
    rows: list[object],
    *,
    market: Market,
    symbol: str,
    timeframe: Timeframe,
) -> list[OHLCVBar]:
    bars: list[OHLCVBar] = []
    for row in rows:
        parts = str(row).split(",")
        if len(parts) < 6:
            continue
        try:
            bars.append(
                OHLCVBar(
                    symbol=symbol,
                    market=market,
                    timeframe=timeframe,
                    timestamp=coerce_datetime(parts[0]),
                    open=round(float(parts[1]), 4),
                    close=round(float(parts[2]), 4),
                    high=round(float(parts[3]), 4),
                    low=round(float(parts[4]), 4),
                    volume=round(float(parts[5]), 2),
                )
            )
        except (TypeError, ValueError):
            continue
    bars.sort(key=lambda bar: bar.timestamp)
    return bars


def akshare_minute_frame_to_bars(frame: object, *, market: Market, symbol: str, timeframe: Timeframe) -> list[OHLCVBar]:
    if frame is None or getattr(frame, "empty", True):
        return []
    columns = [str(column) for column in getattr(frame, "columns", [])]
    time_column = "时间" if "时间" in columns else (columns[0] if len(columns) > 5 else "")
    open_column = pick_column(columns, "开盘", 1)
    close_column = pick_column(columns, "收盘", 2)
    high_column = pick_column(columns, "最高", 3)
    low_column = pick_column(columns, "最低", 4)
    volume_column = pick_column(columns, "成交量", 5)
    if not all([time_column, open_column, close_column, high_column, low_column, volume_column]):
        return []

    bars: list[OHLCVBar] = []
    for _, row in frame.iterrows():  # type: ignore[attr-defined]
        try:
            timestamp = coerce_datetime(row[time_column])
            bars.append(
                OHLCVBar(
                    symbol=symbol,
                    market=market,
                    timeframe=timeframe,
                    timestamp=timestamp,
                    open=round(float(row[open_column]), 4),
                    close=round(float(row[close_column]), 4),
                    high=round(float(row[high_column]), 4),
                    low=round(float(row[low_column]), 4),
                    volume=round(float(row[volume_column]), 2),
                )
            )
        except (TypeError, ValueError):
            continue
    bars.sort(key=lambda bar: bar.timestamp)
    return bars


def pick_column(columns: list[str], preferred: str, index: int) -> str:
    if preferred in columns:
        return preferred
    return columns[index] if len(columns) > index else ""


@contextmanager
def bypass_proxy():
    proxy_keys = ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy")
    saved: dict[str, str] = {}
    for key in proxy_keys:
        value = os.environ.pop(key, None)
        if value is not None:
            saved[key] = value
    try:
        yield
    finally:
        for key, value in saved.items():
            os.environ[key] = value


def market_klines_to_payload(
    market: Market,
    symbol: str,
    timeframe: Timeframe,
    bars: list[OHLCVBar],
    quality: DataQuality,
) -> dict[str, object]:
    quality_payload = asdict(quality)
    quality_payload["isComplete"] = quality_payload.pop("is_complete")
    return {
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "quality": quality_payload,
        "bars": [bar_to_payload(bar) for bar in bars],
    }


def bar_to_payload(bar: OHLCVBar) -> dict[str, object]:
    return {
        "timestamp": bar.timestamp.isoformat(),
        "timestampMs": int(bar.timestamp.timestamp() * 1000),
        "open": bar.open,
        "high": bar.high,
        "low": bar.low,
        "close": bar.close,
        "volume": bar.volume,
    }


def yfinance_period(timeframe: Timeframe) -> tuple[str, str]:
    if timeframe == "1d":
        return "1d", "1y"
    if timeframe == "60m":
        return "60m", "3mo"
    return timeframe, "1mo"


def ccxt_timeframe(timeframe: Timeframe) -> str:
    return "1d" if timeframe == "1d" else timeframe


def coerce_datetime(value: object) -> datetime:
    if hasattr(value, "to_pydatetime"):
        value = value.to_pydatetime()
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return datetime.fromisoformat(str(value)).replace(tzinfo=timezone.utc)


def default_fetch_text(url: str, encoding: str = "utf-8") -> str:
    request = Request(url, headers={"User-Agent": "AIQuantificationTools/0.1"})
    with urlopen(request, timeout=10) as response:
        return response.read().decode(encoding, errors="ignore")


def fetch_text_direct(url: str, encoding: str = "utf-8") -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 AIQuantificationTools/0.1",
            "Referer": "https://quote.eastmoney.com/",
        },
    )
    opener = build_opener(ProxyHandler({}))
    with opener.open(request, timeout=15) as response:
        return response.read().decode(encoding, errors="ignore")
