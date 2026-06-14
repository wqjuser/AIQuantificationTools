# yfinance Market Data Adapter

## Goal

把美股 K 线里的临时 yfinance fallback 收敛为正式 `YFinanceMarketDataAdapter`，与 ccxt adapter 形成统一的 OHLCV 数据层。

## Scope

- 实现 `YFinanceMarketDataAdapter.fetch_ohlcv(request, limit)`。
- 支持 fake yfinance module 注入，便于无网络单测。
- 归一化 yfinance `Ticker.history` 输出到内部 `OHLCVBar` schema。
- 复用周期映射、stderr 抑制和 `DataQuality(source="yfinance")`。
- 让 `QuantDingerKlineAdapter` 在 Yahoo chart 不可用时复用正式 adapter。

## Safety Boundary

该切片只读取公开历史行情，不读取密钥，不连接券商账户，不创建订单，不改变 Paper Trading 或实盘执行闸门。

## Verification

- [x] RED: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k yfinance_market_data_adapter` failed with missing constructor/implementation.
- [x] RED: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k yahoo_chart_is_unavailable` failed because `QuantDingerKlineAdapter` did not accept an injected yfinance adapter.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k yfinance_market_data_adapter`.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k yahoo_chart_is_unavailable`.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k us_kline_adapter`.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k yfinance_quote_fallback`.

## Follow-ups

- Extend AKShare adapter to the same normalization contract.
- Surface adapter-level source/freshness status in Settings.
- Add shared retry/backoff telemetry for external data source failures.
