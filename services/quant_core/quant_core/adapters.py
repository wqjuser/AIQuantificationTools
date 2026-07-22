from __future__ import annotations

import math
import os
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any

from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.live_quotes import normalize_ashare_tencent_code, normalize_crypto_symbol

_AKSHARE_UNSET = object()
_CCXT_UNSET = object()
_YFINANCE_UNSET = object()


class MarketDataAdapter(ABC):
    source: str

    @abstractmethod
    def fetch_ohlcv(self, request: MarketDataRequest, limit: int | None = None) -> tuple[list[OHLCVBar], DataQuality]:
        raise NotImplementedError


class DemoMarketDataAdapter(MarketDataAdapter):
    source = "demo"

    def fetch_ohlcv(self, request: MarketDataRequest, limit: int | None = None) -> tuple[list[OHLCVBar], DataQuality]:
        end = request.end or datetime.now(timezone.utc)
        step = (
            timedelta(days=7)
            if request.timeframe == "1w"
            else timedelta(days=1)
            if request.timeframe == "1d"
            else timedelta(minutes=1)
        )
        default_rows = 120 if request.timeframe in {"1d", "1w"} else 240
        rows = max(1, min(int(limit or default_rows), 500))
        start = request.start or (end - step * rows)

        bars: list[OHLCVBar] = []
        current = start
        index = 0
        while current <= end and len(bars) < rows:
            base = 100 + index * 0.08 + math.sin(index / 6) * 3
            close = base + math.sin(index / 3)
            bars.append(
                OHLCVBar(
                    symbol=request.symbol,
                    market=request.market,
                    timeframe=request.timeframe,
                    timestamp=current,
                    open=round(base, 4),
                    high=round(max(base, close) + 1.2, 4),
                    low=round(min(base, close) - 1.2, 4),
                    close=round(close, 4),
                    volume=round(10_000 + index * 23, 2),
                )
            )
            current += step
            index += 1

        warnings = []
        if request.timeframe not in {"1d", "1w"}:
            warnings.append("分钟级数据当前使用近期窗口和本地缓存策略。")
        return bars, DataQuality(source=self.source, is_complete=True, warnings=warnings, rows=len(bars))


class OptionalDependencyAdapter(MarketDataAdapter):
    package_name: str

    def _missing_dependency(self) -> RuntimeError:
        return RuntimeError(f"{self.source} adapter requires optional package '{self.package_name}'")


class AkShareMarketDataAdapter(OptionalDependencyAdapter):
    source = "akshare"
    package_name = "akshare"

    def __init__(self, *, akshare_module: Any = _AKSHARE_UNSET) -> None:
        self.akshare_module = akshare_module

    def fetch_ohlcv(self, request: MarketDataRequest, limit: int | None = None) -> tuple[list[OHLCVBar], DataQuality]:
        if request.market != "ashare":
            raise ValueError("akshare adapter only supports A-share market")

        ak = self._load_akshare_module()
        bounded_limit = max(1, min(int(limit or 160), 500))
        symbol = ashare_digits(request.symbol)
        if request.timeframe in {"1d", "1w"}:
            fallback_days = bounded_limit * (10 if request.timeframe == "1w" else 3)
            start = request.start or (request.end - timedelta(days=fallback_days) if request.end else None)
            frame = ak.stock_zh_a_hist(
                symbol=symbol,
                period="weekly" if request.timeframe == "1w" else "daily",
                start_date=akshare_daily_date(start, fallback_days=fallback_days),
                end_date=akshare_daily_date(request.end),
                adjust="qfq",
            )
            bars = akshare_frame_to_bars(frame, request=request, time_column="日期", limit=bounded_limit)
        else:
            period = akshare_minute_period(request.timeframe)
            if not period:
                return [], DataQuality(source=self.source, is_complete=False, warnings=[f"unsupported A-share timeframe {request.timeframe}"], rows=0)
            start, end = akshare_minute_range(request, bounded_limit)
            frame = ak.stock_zh_a_hist_min_em(
                symbol=symbol,
                start_date=start.strftime("%Y-%m-%d %H:%M:%S"),
                end_date=end.strftime("%Y-%m-%d %H:%M:%S"),
                period=period,
                adjust="" if period == "1" else "qfq",
            )
            bars = akshare_frame_to_bars(frame, request=request, time_column="时间", limit=bounded_limit)
        if not bars:
            return [], DataQuality(
                source=self.source,
                is_complete=False,
                warnings=["akshare returned no OHLCV bars"],
                rows=0,
            )
        return bars[-bounded_limit:], DataQuality(
            source=self.source,
            is_complete=True,
            warnings=[],
            rows=len(bars[-bounded_limit:]),
        )

    def _load_akshare_module(self) -> Any:
        if self.akshare_module is not _AKSHARE_UNSET:
            if self.akshare_module is None:
                raise self._missing_dependency()
            return self.akshare_module
        try:
            import akshare as ak  # type: ignore
        except ImportError as exc:
            raise self._missing_dependency() from exc
        return ak


class YFinanceMarketDataAdapter(OptionalDependencyAdapter):
    source = "yfinance"
    package_name = "yfinance"

    def __init__(self, *, yfinance_module: Any = _YFINANCE_UNSET) -> None:
        self.yfinance_module = yfinance_module

    def fetch_ohlcv(self, request: MarketDataRequest, limit: int | None = None) -> tuple[list[OHLCVBar], DataQuality]:
        if request.market != "us":
            raise ValueError("yfinance adapter only supports US market")

        yf = self._load_yfinance_module()
        bounded_limit = max(1, min(int(limit or 160), 500))
        interval, period = yfinance_period(request.timeframe)
        if request.end:
            step_seconds = {
                "1m": 60,
                "5m": 300,
                "15m": 900,
                "30m": 1800,
                "60m": 3600,
                "1d": 86400,
                "1w": 604800,
            }[request.timeframe]
            multiplier = 2 if request.timeframe in {"1d", "1w"} else 4
            start = request.start or request.end - timedelta(seconds=step_seconds * bounded_limit * multiplier)
            frame = yf.Ticker(request.symbol.upper()).history(
                start=start,
                end=request.end + timedelta(seconds=1),
                interval=interval,
                auto_adjust=False,
            )
        else:
            frame = yf.Ticker(request.symbol.upper()).history(period=period, interval=interval, auto_adjust=False)
        bars = yfinance_history_to_bars(frame, request=request, limit=bounded_limit)
        if not bars:
            return [], DataQuality(
                source=self.source,
                is_complete=False,
                warnings=["yfinance returned no chart bars"],
                rows=0,
            )
        return bars[-bounded_limit:], DataQuality(
            source=self.source,
            is_complete=True,
            warnings=[],
            rows=len(bars[-bounded_limit:]),
        )

    def _load_yfinance_module(self) -> Any:
        if self.yfinance_module is not _YFINANCE_UNSET:
            if self.yfinance_module is None:
                raise self._missing_dependency()
            return self.yfinance_module
        try:
            import yfinance as yf  # type: ignore
        except ImportError as exc:
            raise self._missing_dependency() from exc
        return yf


class CcxtMarketDataAdapter(OptionalDependencyAdapter):
    source = "ccxt"
    package_name = "ccxt"

    def __init__(
        self,
        *,
        exchange_id: str | None = None,
        ccxt_module: Any = _CCXT_UNSET,
        timeout_ms: int | None = None,
        enable_rate_limit: bool = True,
    ) -> None:
        self.exchange_id = (exchange_id or os.getenv("CCXT_DEFAULT_EXCHANGE", "binance")).strip().lower() or "binance"
        self.ccxt_module = ccxt_module
        self.timeout_ms = timeout_ms
        self.enable_rate_limit = enable_rate_limit

    def fetch_ohlcv(self, request: MarketDataRequest, limit: int | None = None) -> tuple[list[OHLCVBar], DataQuality]:
        if request.market != "crypto":
            raise ValueError("ccxt adapter only supports crypto market")

        ccxt_module = self._load_ccxt_module()
        exchange_class = getattr(ccxt_module, self.exchange_id, None)
        if exchange_class is None:
            raise RuntimeError(f"ccxt exchange '{self.exchange_id}' is not available")

        bounded_limit = max(1, min(int(limit or 160), 500))
        exchange = exchange_class(
            {
                "enableRateLimit": self.enable_rate_limit,
                "timeout": self._timeout_ms(),
            }
        )
        fetch_kwargs: dict[str, Any] = {
            "timeframe": ccxt_timeframe(request.timeframe),
            "limit": bounded_limit,
        }
        if request.start:
            fetch_kwargs["since"] = int(request.start.timestamp() * 1000)
        elif request.end:
            step_ms = {
                "1m": 60_000,
                "5m": 300_000,
                "15m": 900_000,
                "30m": 1_800_000,
                "60m": 3_600_000,
                "1d": 86_400_000,
                "1w": 604_800_000,
            }[request.timeframe]
            fetch_kwargs["since"] = int(request.end.timestamp() * 1000) - step_ms * (bounded_limit - 1)
        rows = exchange.fetch_ohlcv(normalize_crypto_symbol(request.symbol), **fetch_kwargs)
        bars = ccxt_ohlcv_rows_to_bars(rows, request=request)
        if request.end:
            bars = [
                bar
                for bar in bars
                if (request.start is None or bar.timestamp >= request.start) and bar.timestamp <= request.end
            ]
        if not bars:
            return [], DataQuality(
                source=f"ccxt:{self.exchange_id}",
                is_complete=False,
                warnings=["ccxt returned no OHLCV bars"],
                rows=0,
            )
        return bars[-bounded_limit:], DataQuality(
            source=f"ccxt:{self.exchange_id}",
            is_complete=True,
            warnings=[],
            rows=len(bars[-bounded_limit:]),
        )

    def _load_ccxt_module(self) -> Any:
        if self.ccxt_module is not _CCXT_UNSET:
            if self.ccxt_module is None:
                raise self._missing_dependency()
            return self.ccxt_module
        try:
            import ccxt  # type: ignore
        except ImportError as exc:
            raise self._missing_dependency() from exc
        return ccxt

    def _timeout_ms(self) -> int:
        if self.timeout_ms is not None:
            return max(1, int(self.timeout_ms))
        raw_timeout = os.getenv("CCXT_TIMEOUT", "10000")
        try:
            return max(1, int(raw_timeout))
        except ValueError:
            return 10000


def ccxt_timeframe(timeframe: str) -> str:
    return "1d" if timeframe == "1d" else timeframe


def yfinance_period(timeframe: str) -> tuple[str, str]:
    if timeframe == "1d":
        return "1d", "1y"
    if timeframe == "1w":
        return "1wk", "10y"
    if timeframe == "60m":
        return "60m", "3mo"
    return timeframe, "1mo"


def akshare_minute_period(timeframe: str) -> str | None:
    return {"1m": "1", "5m": "5", "15m": "15", "30m": "30", "60m": "60"}.get(timeframe)


def ashare_digits(symbol: str) -> str:
    code = normalize_ashare_tencent_code(symbol)
    return code[2:] if len(code) >= 8 and code[:2].upper() in {"SH", "SZ"} else code


def akshare_daily_date(value: datetime | None, *, fallback_days: int = 365) -> str:
    target = value or (datetime.now(timezone.utc) - timedelta(days=fallback_days))
    if target.tzinfo:
        target = target.astimezone(timezone.utc)
    return target.strftime("%Y%m%d")


def akshare_minute_range(request: MarketDataRequest, limit: int) -> tuple[datetime, datetime]:
    end = request.end or datetime.now(timezone.utc)
    if end.tzinfo:
        end = end.astimezone(timezone.utc).replace(tzinfo=None)
    start = request.start
    if start is None:
        start = end - timedelta(days=16)
    elif start.tzinfo:
        start = start.astimezone(timezone.utc).replace(tzinfo=None)
    return start, end


def akshare_frame_to_bars(frame: Any, *, request: MarketDataRequest, time_column: str, limit: int) -> list[OHLCVBar]:
    if frame is None or getattr(frame, "empty", True):
        return []
    rows = frame.tail(limit) if hasattr(frame, "tail") else frame
    columns = [str(column) for column in getattr(rows, "columns", getattr(frame, "columns", []))]
    timestamp_column = time_column if time_column in columns else (columns[0] if len(columns) > 5 else "")
    open_column = pick_column(columns, "开盘", 1)
    close_column = pick_column(columns, "收盘", 2)
    high_column = pick_column(columns, "最高", 3)
    low_column = pick_column(columns, "最低", 4)
    volume_column = pick_column(columns, "成交量", 5)
    if not all([timestamp_column, open_column, close_column, high_column, low_column, volume_column]):
        return []
    if not hasattr(rows, "iterrows"):
        return []
    bars: list[OHLCVBar] = []
    for _, row in rows.iterrows():
        try:
            bars.append(
                OHLCVBar(
                    symbol=request.symbol,
                    market="ashare",
                    timeframe=request.timeframe,
                    timestamp=coerce_datetime(row_value(row, timestamp_column)),
                    open=round(float(row_value(row, open_column)), 4),
                    close=round(float(row_value(row, close_column)), 4),
                    high=round(float(row_value(row, high_column)), 4),
                    low=round(float(row_value(row, low_column)), 4),
                    volume=round(float(row_value(row, volume_column)), 2),
                )
            )
        except (TypeError, ValueError, KeyError):
            continue
    bars.sort(key=lambda bar: bar.timestamp)
    return bars


def pick_column(columns: list[str], preferred: str, index: int) -> str:
    if preferred in columns:
        return preferred
    return columns[index] if len(columns) > index else ""


def yfinance_history_to_bars(frame: Any, *, request: MarketDataRequest, limit: int) -> list[OHLCVBar]:
    if frame is None or getattr(frame, "empty", False):
        return []
    rows = frame.tail(limit) if hasattr(frame, "tail") else frame
    if not hasattr(rows, "iterrows"):
        return []
    bars: list[OHLCVBar] = []
    for timestamp, row in rows.iterrows():
        try:
            bars.append(
                OHLCVBar(
                    symbol=request.symbol.upper(),
                    market="us",
                    timeframe=request.timeframe,
                    timestamp=coerce_datetime(timestamp),
                    open=round(float(row_value(row, "Open")), 4),
                    high=round(float(row_value(row, "High")), 4),
                    low=round(float(row_value(row, "Low")), 4),
                    close=round(float(row_value(row, "Close")), 4),
                    volume=round(float(row_value(row, "Volume", 0) or 0), 2),
                )
            )
        except (TypeError, ValueError, KeyError):
            continue
    bars.sort(key=lambda bar: bar.timestamp)
    return bars


def ccxt_ohlcv_rows_to_bars(rows: Any, *, request: MarketDataRequest) -> list[OHLCVBar]:
    if not isinstance(rows, list):
        return []
    bars: list[OHLCVBar] = []
    for row in rows:
        if not isinstance(row, (list, tuple)) or len(row) < 6:
            continue
        try:
            bars.append(
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
            )
        except (TypeError, ValueError):
            continue
    bars.sort(key=lambda bar: bar.timestamp)
    return bars


def row_value(row: Any, key: str, default: Any = None) -> Any:
    if hasattr(row, "get"):
        return row.get(key, default)
    try:
        return row[key]
    except (KeyError, TypeError, IndexError):
        return default


def coerce_datetime(value: Any) -> datetime:
    if hasattr(value, "to_pydatetime"):
        value = value.to_pydatetime()
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    parsed = datetime.fromisoformat(str(value))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
