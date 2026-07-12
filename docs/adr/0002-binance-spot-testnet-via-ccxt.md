# Stage 6 使用 CCXT 接入 Binance Spot Testnet

Stage 6 只支持通过 CCXT 接入 Binance Spot Testnet，并要求 exchange 创建后的第一个调用是 `set_sandbox_mode(True)`；Sandbox 密钥不得与生产密钥混用。选择单一现货测试网可以复用现有 `ccxt-live + binance` 权威探针，并集中验证委托生命周期与状态未知恢复，不同时承担 Futures、杠杆、保证金或多交易所差异。
