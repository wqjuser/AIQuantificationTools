from __future__ import annotations

import math
import os
from abc import ABC, abstractmethod
from contextlib import redirect_stderr
from datetime import datetime, timedelta, timezone
from io import StringIO
from typing import Any

from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.live_quotes import normalize_crypto_symbol

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
        step = timedelta(days=1) if request.timeframe == "1d" else timedelta(minutes=1)
        default_rows = 120 if request.timeframe == "1d" else 240
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
        if request.timeframe != "1d":
            warnings.append("分钟级数据当前使用近期窗口和本地缓存策略。")
        return bars, DataQuality(source=self.source, is_complete=True, warnings=warnings, rows=len(bars))


class OptionalDependencyAdapter(MarketDataAdapter):
    package_name: str

    def _missing_dependency(self) -> RuntimeError:
        return RuntimeError(f"{self.source} adapter requires optional package '{self.package_name}'")


class AkShareMarketDataAdapter(OptionalDependencyAdapter):
    source = "akshare"
    package_name = "akshare"

    def fetch_ohlcv(self, request: MarketDataRequest, limit: int | None = None) -> tuple[list[OHLCVBar], DataQuality]:
        try:
            import akshare as ak  # type: ignore
        except ImportError as exc:
            raise self._missing_dependency() from exc
        raise NotImplementedError("akshare normalization is reserved for the external data integration phase")


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
        with redirect_stderr(StringIO()):
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
        rows = exchange.fetch_ohlcv(normalize_crypto_symbol(request.symbol), **fetch_kwargs)
        bars = ccxt_ohlcv_rows_to_bars(rows, request=request)
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
    if timeframe == "60m":
        return "60m", "3mo"
    return timeframe, "1mo"


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
