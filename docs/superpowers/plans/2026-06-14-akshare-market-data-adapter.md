# AKShare Market Data Adapter

## Goal

把 A 股 AKShare 从占位 adapter 补成正式 `AkShareMarketDataAdapter`，与 yfinance/ccxt 一起形成统一 OHLCV 数据层。

## Scope

- 实现 `AkShareMarketDataAdapter.fetch_ohlcv(request, limit)`。
- 支持 fake AKShare module 注入，便于无网络单测。
- 日线使用 `stock_zh_a_hist`，分钟线使用 `stock_zh_a_hist_min_em`。
- 归一化 AKShare 中文列名到内部 `OHLCVBar` schema。
- 让 `QuantDingerKlineAdapter` 在腾讯/东方财富不可用时复用正式 adapter。

## Safety Boundary

该切片只读取公开行情，不读取密钥，不连接券商账户，不创建订单，不改变 Paper Trading 或实盘执行闸门。

## Verification

- [x] RED: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k akshare_market_data_adapter` failed with missing constructor/implementation.
- [x] RED: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k tencent_is_unavailable` failed because `QuantDingerKlineAdapter` did not accept an injected AKShare adapter.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k akshare_market_data_adapter`.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k tencent_is_unavailable`.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k quantdinger_style_kline_adapter_maps`.

## Follow-ups

- Surface adapter-level freshness/source status in Settings.
- Add shared retry/backoff telemetry for external data source failures.
- Add a no-network adapter conformance test suite shared by AKShare, yfinance and ccxt.
