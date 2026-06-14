# ccxt Market Data Adapter

## Goal

把加密货币 K 线里的临时 ccxt 调用收敛为正式 `CcxtMarketDataAdapter`，让研究、缓存、后续执行风控和测试都复用同一个 OHLCV schema。

## Scope

- 实现 `CcxtMarketDataAdapter.fetch_ohlcv(request, limit)`。
- 支持交易所 id、timeout、rate limit 和 fake ccxt module 注入，便于无网络单测。
- 归一化 symbol、timeframe、timestamp、OHLCV 精度和 `DataQuality(source="ccxt:<exchange>")`。
- 让 `QuantDingerKlineAdapter` 在 Binance/Coinbase 公共 REST 不可用时复用正式 adapter。
- 保持安全边界：只读公开行情，不传输密钥，不创建订单，不改变实盘闸门。

## Verification

- [x] RED: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k ccxt_market_data_adapter` failed with missing constructor/implementation.
- [x] RED: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k public_sources_are_unavailable` failed because `QuantDingerKlineAdapter` did not accept an injected ccxt adapter.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k ccxt_market_data_adapter`.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k public_sources_are_unavailable`.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k crypto_kline_adapter`.

## Follow-ups

- Extend AKShare/yfinance adapters from placeholders to the same normalization contract.
- Add rate-limit/backoff telemetry for external data adapter failures.
- Connect ccxt adapter freshness and source status into Settings cache diagnostics.
