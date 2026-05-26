# Architecture

## Runtime Shape

AIQuantificationTools 使用一套 React 前端支撑 Web 和桌面端。桌面端通过 Tauri v2 包装同一个 Vite 应用；Python 本地核心作为独立服务运行，默认监听 `127.0.0.1:8765`。

## Backend Core

- `domain.py`：统一 OHLCV、策略、回测、AI 报告、订单和账户模型。
- `adapters.py`：定义 `MarketDataAdapter`，并预留 AKShare、yfinance、ccxt 等免费数据源适配器。
- `cache.py`：SQLite 本地行情缓存，按 `market + symbol + timeframe + timestamp` 去重。
- `backtest.py`：首版长仓回测引擎，支持 SMA 条件、仓位比例、止盈止损、费用和滑点。
- `ai.py`：本地确定性研究助手，后续可替换为 OpenAI 兼容接口或本地模型。
- `execution.py`：Paper Trading 执行器，保留风控拒单、成交和账户快照。
- `api.py`：标准库 HTTP API，用于前端演示和本地闭环验证。

## Frontend Core

前端提供市场/标的/周期选择、回测指标、资金曲线、AI 研究报告、数据缓存状态和模拟执行日志。它默认展示演示数据；当本地 Python API 可用时，通过 `/api/demo` 获取真实后端结果。

## Next Integration Points

1. 将 optional data adapters 从占位实现扩展为实际 AKShare/yfinance/ccxt normalization。
2. 增加策略 DSL 校验和更多可视化条件。
3. 将 AI provider 抽象接到 OpenAI-compatible 和 Ollama-compatible 后端。
4. 在 Paper Trading 稳定后增加 A 股券商适配器接口实现。
