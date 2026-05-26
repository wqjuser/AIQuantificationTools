from __future__ import annotations

import math
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone

from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar


class MarketDataAdapter(ABC):
    source: str

    @abstractmethod
    def fetch_ohlcv(self, request: MarketDataRequest) -> tuple[list[OHLCVBar], DataQuality]:
        raise NotImplementedError


class DemoMarketDataAdapter(MarketDataAdapter):
    source = "demo"

    def fetch_ohlcv(self, request: MarketDataRequest) -> tuple[list[OHLCVBar], DataQuality]:
        end = request.end or datetime.now(timezone.utc)
        step = timedelta(days=1) if request.timeframe == "1d" else timedelta(minutes=1)
        rows = 120 if request.timeframe == "1d" else 240
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

    def fetch_ohlcv(self, request: MarketDataRequest) -> tuple[list[OHLCVBar], DataQuality]:
        try:
            import akshare as ak  # type: ignore
        except ImportError as exc:
            raise self._missing_dependency() from exc
        raise NotImplementedError("akshare normalization is reserved for the external data integration phase")


class YFinanceMarketDataAdapter(OptionalDependencyAdapter):
    source = "yfinance"
    package_name = "yfinance"

    def fetch_ohlcv(self, request: MarketDataRequest) -> tuple[list[OHLCVBar], DataQuality]:
        try:
            import yfinance as yf  # type: ignore
        except ImportError as exc:
            raise self._missing_dependency() from exc
        raise NotImplementedError("yfinance normalization is reserved for the external data integration phase")


class CcxtMarketDataAdapter(OptionalDependencyAdapter):
    source = "ccxt"
    package_name = "ccxt"

    def fetch_ohlcv(self, request: MarketDataRequest) -> tuple[list[OHLCVBar], DataQuality]:
        try:
            import ccxt  # type: ignore
        except ImportError as exc:
            raise self._missing_dependency() from exc
        raise NotImplementedError("ccxt normalization is reserved for the external data integration phase")
