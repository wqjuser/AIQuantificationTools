from __future__ import annotations

import json
import os
import time
from contextlib import contextmanager
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Any, Callable
from urllib.parse import quote, urlencode
from urllib.request import ProxyHandler, Request, build_opener, urlopen

from quant_core.adapters import (
    AkShareMarketDataAdapter,
    CcxtMarketDataAdapter,
    DemoMarketDataAdapter,
    MarketDataAdapter,
    YFinanceMarketDataAdapter,
)
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
        akshare_adapter: MarketDataAdapter | None = None,
        yfinance_adapter: MarketDataAdapter | None = None,
        ccxt_adapter: MarketDataAdapter | None = None,
        cache_ttl_seconds: int = 90,
        now: Now | None = None,
    ) -> None:
        self.fetch_text = fetch_text or default_fetch_text
        self.fallback_adapter = fallback_adapter or DemoMarketDataAdapter()
        self.akshare_adapter = akshare_adapter or AkShareMarketDataAdapter()
        self.yfinance_adapter = yfinance_adapter or YFinanceMarketDataAdapter()
        self.ccxt_adapter = ccxt_adapter or CcxtMarketDataAdapter()
        self.cache = KlineCache(ttl_seconds=cache_ttl_seconds, now=now)

    def cache_key(self, request: MarketDataRequest, limit: int) -> str:
        start_key = request.start.isoformat() if request.start else ""
        end_key = request.end.isoformat() if request.end else ""
        return f"kline:{request.market}:{request.symbol.strip().upper()}:{request.timeframe}:{limit}:{start_key}:{end_key}"

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
        if request.timeframe not in {"1d", "1w"}:
            bars = self._fetch_eastmoney_ashare_minute_bars(request, limit)
            if bars:
                return bars[-limit:], DataQuality(source="eastmoney", is_complete=True, warnings=[], rows=len(bars[-limit:]))
            try:
                bars, quality = self.akshare_adapter.fetch_ohlcv(request, limit=limit)
                if bars:
                    limited = bars[-limit:]
                    return limited, DataQuality(
                        source=quality.source,
                        is_complete=quality.is_complete,
                        warnings=quality.warnings,
                        rows=len(limited),
                    )
                warning = "AkShare minute K-lines returned no chart bars"
                if quality.warnings:
                    warning = f"{warning}; {'; '.join(quality.warnings)}"
            except Exception as exc:
                warning = str(exc)
            return self._fallback(request, limit, f"Eastmoney unavailable; {warning}")

        code = normalize_ashare_tencent_code(request.symbol).lower()
        period = "week" if request.timeframe == "1w" else "day"
        params = urlencode({"param": f"{code},{period},,,{limit},qfq"})
        payload = json.loads(self.fetch_text(f"https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?{params}", "utf-8"))
        rows = extract_tencent_kline_rows(payload, code, period)
        bars = [
            row_to_ohlcv_bar(row, market="ashare", symbol=request.symbol, timeframe=request.timeframe)
            for row in rows
        ]
        bars = [bar for bar in bars if bar is not None]
        bars.sort(key=lambda bar: bar.timestamp)
        if not bars:
            try:
                bars, quality = self.akshare_adapter.fetch_ohlcv(request, limit=limit)
                if bars:
                    limited = bars[-limit:]
                    return limited, DataQuality(
                        source=quality.source,
                        is_complete=quality.is_complete,
                        warnings=quality.warnings,
                        rows=len(limited),
                    )
                warning = "AkShare daily K-lines returned no chart bars"
                if quality.warnings:
                    warning = f"{warning}; {'; '.join(quality.warnings)}"
            except Exception as exc:
                warning = str(exc)
            return self._fallback(request, limit, f"Tencent fqkline returned no chart bars; {warning}")
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
        yahoo_warning: str | None = None
        try:
            bars = self._fetch_yahoo_us_bars(request, limit)
            if bars:
                return bars[-limit:], DataQuality(source="yahoo", is_complete=True, warnings=[], rows=len(bars[-limit:]))
        except Exception as exc:
            yahoo_warning = str(exc)

        try:
            bars, quality = self.yfinance_adapter.fetch_ohlcv(request, limit=limit)
            if bars:
                limited = bars[-limit:]
                return limited, DataQuality(
                    source=quality.source,
                    is_complete=quality.is_complete,
                    warnings=quality.warnings,
                    rows=len(limited),
                )
            warning = "yfinance returned no chart bars"
            if quality.warnings:
                warning = f"{warning}; {'; '.join(quality.warnings)}"
        except Exception as exc:
            warning = str(exc)
            if yahoo_warning:
                warning = f"{yahoo_warning}; {warning}"
            return self._fallback(request, limit, warning)
        if yahoo_warning:
            warning = f"{yahoo_warning}; {warning}"
        return self._fallback(request, limit, warning)

    def _fetch_yahoo_us_bars(self, request: MarketDataRequest, limit: int) -> list[OHLCVBar]:
        interval, range_label = yahoo_chart_range_interval(request.timeframe)
        params = urlencode({"range": range_label, "interval": interval})
        text = self.fetch_text(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(request.symbol.upper())}?{params}",
            "utf-8",
        )
        return yahoo_chart_to_bars(json.loads(text), symbol=request.symbol, timeframe=request.timeframe)[-limit:]

    def _fetch_crypto_bars(self, request: MarketDataRequest, limit: int) -> tuple[list[OHLCVBar], DataQuality]:
        binance_warning: str | None = None
        try:
            bars = self._fetch_binance_crypto_bars(request, limit)
            if bars:
                return bars[-limit:], DataQuality(source="binance", is_complete=True, warnings=[], rows=len(bars[-limit:]))
        except Exception as exc:
            binance_warning = str(exc)

        coinbase_warning: str | None = None
        if request.timeframe == "1w":
            coinbase_warning = "Coinbase does not provide native weekly candles"
        else:
            try:
                bars = self._fetch_coinbase_crypto_bars(request, limit)
                if bars:
                    return bars[-limit:], DataQuality(source="coinbase", is_complete=True, warnings=[], rows=len(bars[-limit:]))
            except Exception as exc:
                coinbase_warning = str(exc)

        try:
            bars, quality = self.ccxt_adapter.fetch_ohlcv(request, limit=limit)
            if bars:
                limited = bars[-limit:]
                return limited, DataQuality(
                    source=quality.source,
                    is_complete=quality.is_complete,
                    warnings=quality.warnings,
                    rows=len(limited),
                )
            warning = "ccxt returned no chart bars"
            if quality.warnings:
                warning = f"{warning}; {'; '.join(quality.warnings)}"
        except Exception as exc:
            warning = str(exc)
        if binance_warning:
            warning = f"{binance_warning}; {warning}"
        if coinbase_warning:
            warning = f"{coinbase_warning}; {warning}"
        return self._fallback(request, limit, warning)

    def _fetch_binance_crypto_bars(self, request: MarketDataRequest, limit: int) -> list[OHLCVBar]:
        params = urlencode(
            {
                "symbol": binance_symbol(request.symbol),
                "interval": ccxt_timeframe(request.timeframe),
                "limit": max(1, min(limit, 500)),
            }
        )
        payload = json.loads(self.fetch_text(f"https://api.binance.com/api/v3/klines?{params}", "utf-8"))
        return binance_klines_to_bars(payload, symbol=request.symbol, timeframe=request.timeframe)

    def _fetch_coinbase_crypto_bars(self, request: MarketDataRequest, limit: int) -> list[OHLCVBar]:
        params = urlencode({"granularity": coinbase_granularity(request.timeframe)})
        text = self.fetch_text(
            f"https://api.exchange.coinbase.com/products/{coinbase_product(request.symbol)}/candles?{params}",
            "utf-8",
        )
        return coinbase_candles_to_bars(json.loads(text), symbol=request.symbol, timeframe=request.timeframe)[-limit:]

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


def yahoo_chart_to_bars(payload: dict[str, object], *, symbol: str, timeframe: Timeframe) -> list[OHLCVBar]:
    chart = payload.get("chart")
    if not isinstance(chart, dict):
        return []
    result = chart.get("result")
    if not isinstance(result, list) or not result:
        return []
    first = result[0]
    if not isinstance(first, dict):
        return []
    timestamps = first.get("timestamp")
    indicators = first.get("indicators")
    if not isinstance(timestamps, list) or not isinstance(indicators, dict):
        return []
    quotes = indicators.get("quote")
    if not isinstance(quotes, list) or not quotes or not isinstance(quotes[0], dict):
        return []
    quote_payload = quotes[0]
    opens = quote_payload.get("open")
    highs = quote_payload.get("high")
    lows = quote_payload.get("low")
    closes = quote_payload.get("close")
    volumes = quote_payload.get("volume")
    if not all(isinstance(values, list) for values in (opens, highs, lows, closes, volumes)):
        return []

    bars: list[OHLCVBar] = []
    for index, timestamp in enumerate(timestamps):
        try:
            bars.append(
                OHLCVBar(
                    symbol=symbol,
                    market="us",
                    timeframe=timeframe,
                    timestamp=datetime.fromtimestamp(float(timestamp), tz=timezone.utc),
                    open=round(float(opens[index]), 4),  # type: ignore[index]
                    high=round(float(highs[index]), 4),  # type: ignore[index]
                    low=round(float(lows[index]), 4),  # type: ignore[index]
                    close=round(float(closes[index]), 4),  # type: ignore[index]
                    volume=round(float(volumes[index] or 0), 2),  # type: ignore[index]
                )
            )
        except (IndexError, TypeError, ValueError):
            continue
    bars.sort(key=lambda bar: bar.timestamp)
    return bars


def binance_symbol(symbol: str) -> str:
    return normalize_crypto_symbol(symbol).replace("/", "")


def binance_klines_to_bars(rows: object, *, symbol: str, timeframe: Timeframe) -> list[OHLCVBar]:
    if not isinstance(rows, list):
        return []
    bars: list[OHLCVBar] = []
    for row in rows:
        if not isinstance(row, (list, tuple)) or len(row) < 6:
            continue
        try:
            bars.append(
                OHLCVBar(
                    symbol=symbol,
                    market="crypto",
                    timeframe=timeframe,
                    timestamp=datetime.fromtimestamp(float(row[0]) / 1000, tz=timezone.utc),
                    open=round(float(row[1]), 4),
                    high=round(float(row[2]), 4),
                    low=round(float(row[3]), 4),
                    close=round(float(row[4]), 4),
                    volume=round(float(row[5]), 2),
                )
            )
        except (TypeError, ValueError):
            continue
    bars.sort(key=lambda bar: bar.timestamp)
    return bars


def coinbase_product(symbol: str) -> str:
    normalized = normalize_crypto_symbol(symbol)
    base, quote_symbol = normalized.split("/", 1)
    if quote_symbol == "USDT":
        quote_symbol = "USD"
    return f"{base}-{quote_symbol}"


def coinbase_granularity(timeframe: Timeframe) -> int:
    return {
        "1m": 60,
        "5m": 300,
        "15m": 900,
        "30m": 1800,
        "60m": 3600,
        "1d": 86400,
    }[timeframe]


def coinbase_candles_to_bars(rows: object, *, symbol: str, timeframe: Timeframe) -> list[OHLCVBar]:
    if not isinstance(rows, list):
        return []
    bars: list[OHLCVBar] = []
    for row in rows:
        if not isinstance(row, (list, tuple)) or len(row) < 6:
            continue
        try:
            bars.append(
                OHLCVBar(
                    symbol=symbol,
                    market="crypto",
                    timeframe=timeframe,
                    timestamp=datetime.fromtimestamp(float(row[0]), tz=timezone.utc),
                    open=round(float(row[3]), 4),
                    high=round(float(row[2]), 4),
                    low=round(float(row[1]), 4),
                    close=round(float(row[4]), 4),
                    volume=round(float(row[5]), 2),
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


def build_market_data_readiness(
    *,
    market: str,
    symbol: str,
    timeframe: str,
    cache_context: dict[str, Any] | None,
    watchlist_refreshes: list[dict[str, Any]] | None = None,
    adapter_error_events: list[dict[str, Any]] | None = None,
    generated_at: datetime | None = None,
) -> dict[str, object]:
    generated = generated_at or datetime.now(timezone.utc)
    cache_payload = _market_data_readiness_cache_payload(
        cache_context,
        timeframe=timeframe,
        generated_at=generated,
    )
    latest_refresh = _latest_market_data_readiness_refresh(
        watchlist_refreshes or [],
        market=market,
        symbol=symbol,
        timeframe=timeframe,
    )
    latest_error = _latest_market_data_readiness_provider_error(
        adapter_error_events or [],
        market=market,
        symbol=symbol,
        timeframe=timeframe,
    )
    provider_health_state = "degraded" if latest_error else "healthy"
    cache_state = str(cache_payload["freshness"])
    bar_count = int(cache_payload["rowCount"])
    blocking_reasons: list[str] = []
    repair_actions: list[dict[str, str]] = []

    if cache_state == "empty" or bar_count <= 0:
        blocking_reasons.append("no_cached_bars")
        repair_actions.append(_market_data_readiness_repair_action("refresh-cache", market, symbol, timeframe))
    elif cache_state == "stale":
        repair_actions.append(_market_data_readiness_repair_action("refresh-cache", market, symbol, timeframe))

    if latest_error:
        if cache_state == "empty":
            blocking_reasons.append("provider_unhealthy")
        repair_actions.append(_market_data_readiness_repair_action("review-provider-health", market, symbol, timeframe))

    state = "ready" if cache_state == "fresh" and not blocking_reasons else ("stale" if bar_count > 0 else "blocked")
    return {
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "state": state,
        "source": _market_data_readiness_source(market, latest_refresh),
        "cacheState": cache_state,
        "barCount": bar_count,
        "latestBarAt": cache_payload["endTimestamp"],
        "startBarAt": cache_payload["startTimestamp"],
        "ageHours": cache_payload["ageHours"],
        "providerHealthState": provider_health_state,
        "blockingReasons": blocking_reasons,
        "repairActions": repair_actions,
        "latestRefreshRunId": latest_refresh["runId"] if latest_refresh else None,
        "latestProviderErrorId": latest_error.get("eventId") if latest_error else None,
        "dataQualityWarnings": _market_data_readiness_quality_warnings(latest_refresh),
    }


def _market_data_readiness_cache_payload(
    context: dict[str, Any] | None,
    *,
    timeframe: str,
    generated_at: datetime,
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
    freshness, age_hours = _market_data_readiness_cache_freshness(
        row_count=row_count,
        timeframe=timeframe,
        end_timestamp=end_timestamp,
        generated_at=generated_at,
    )
    return {
        "freshness": freshness,
        "rowCount": row_count,
        "ageHours": age_hours,
        "startTimestamp": _optional_string(context.get("start_timestamp")),
        "endTimestamp": end_timestamp,
    }


def _latest_market_data_readiness_refresh(
    refreshes: list[dict[str, Any]],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, Any] | None:
    for refresh in refreshes:
        items = refresh.get("items")
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            if (
                str(item.get("market") or "") == market
                and str(item.get("symbol") or "") == symbol
                and str(item.get("timeframe") or "") == timeframe
            ):
                return {"runId": refresh.get("runId"), "createdAt": refresh.get("createdAt"), "item": item}
    return None


def _latest_market_data_readiness_provider_error(
    events: list[dict[str, Any]],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, Any] | None:
    adapter_id = _market_data_readiness_adapter_id(market)
    for event in events:
        if not isinstance(event, dict):
            continue
        if adapter_id and str(event.get("adapterId") or "") != adapter_id:
            continue
        if str(event.get("market") or "") != market:
            continue
        if str(event.get("symbol") or "") != symbol:
            continue
        if str(event.get("timeframe") or "") != timeframe:
            continue
        return event
    return None


def _market_data_readiness_source(market: str, refresh: dict[str, Any] | None) -> str:
    item = refresh.get("item") if refresh else None
    quality = item.get("quality") if isinstance(item, dict) else None
    source = quality.get("source") if isinstance(quality, dict) else None
    if isinstance(source, str) and source.strip():
        return source.strip()
    return {
        "ashare": "tencent",
        "us": "yfinance",
        "crypto": "ccxt",
    }.get(market, "unknown")


def _market_data_readiness_quality_warnings(refresh: dict[str, Any] | None) -> list[str]:
    item = refresh.get("item") if refresh else None
    quality = item.get("quality") if isinstance(item, dict) else None
    warnings = quality.get("warnings") if isinstance(quality, dict) else None
    if not isinstance(warnings, list):
        return []
    return [str(warning) for warning in warnings if str(warning).strip()]


def _market_data_readiness_adapter_id(market: str) -> str:
    return {
        "ashare": "akshare-ohlcv",
        "us": "yfinance-ohlcv",
        "crypto": "ccxt-ohlcv",
    }.get(market, "")


def _market_data_readiness_repair_action(action_id: str, market: str, symbol: str, timeframe: str) -> dict[str, str]:
    if action_id == "review-provider-health":
        return {
            "id": action_id,
            "label": "Review provider health",
            "target": "/api/settings/status",
            "method": "GET",
        }
    return {
        "id": action_id,
        "label": "Refresh market cache",
        "target": f"/api/cache/refresh?market={market}&symbol={symbol}&timeframe={timeframe}",
        "method": "POST",
    }


def _market_data_readiness_cache_freshness(
    *, row_count: int, timeframe: str, end_timestamp: str | None, generated_at: datetime
) -> tuple[str, int | None]:
    end = _parse_optional_datetime(end_timestamp)
    if row_count <= 0 or end is None:
        return "empty", None
    reference = generated_at if generated_at.tzinfo else generated_at.replace(tzinfo=timezone.utc)
    age_hours = max(0, int((reference.astimezone(timezone.utc) - end).total_seconds() // 3600))
    fresh_threshold_hours = {"1d": 96, "1w": 240}.get(timeframe, 24)
    return ("fresh" if age_hours <= fresh_threshold_hours else "stale"), age_hours


def _parse_optional_datetime(value: str | None) -> datetime | None:
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


def _optional_string(value: object) -> str | None:
    return value if isinstance(value, str) and value else None


def _non_negative_int(value: object) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int) and value >= 0:
        return value
    return 0


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
    if timeframe == "1w":
        return "1wk", "10y"
    if timeframe == "60m":
        return "60m", "3mo"
    return timeframe, "1mo"


def yahoo_chart_range_interval(timeframe: Timeframe) -> tuple[str, str]:
    if timeframe == "1d":
        return "1d", "1y"
    if timeframe == "1w":
        return "1wk", "10y"
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
