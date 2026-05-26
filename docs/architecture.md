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
- `runs.py`：SQLite 研究运行审计记录，保存 run id、策略 revision、数据行数、指标和 AI 决策。
- `terminal.py`：终端工作区契约，覆盖 quant loop、terminal modules、AI agent committee、decision log 和 execution safety gates。
- `api.py`：标准库 HTTP API，用于前端工作区同步、演示研究闭环和本地验证。

## Frontend Core

前端提供三栏终端工作台：左侧 quant loop 和模块导航，中间图表、策略、回测、节点流和执行中心，右侧 TradingAgents 风格的 AI 委员会、可追踪决策日志和 Run History。启动时它会通过 `VITE_QUANT_API_BASE` 指向的本地核心调用 `/api/workspace` 和 `/api/research/runs`；若核心不可用，则保留 bundled offline snapshot，保证桌面/Web 首屏仍可打开。点击 Watchlist 标的会切换研究上下文并清除旧审计结果；点击历史运行可把该次审计记录回放到当前终端。

## Local API Surface

- `GET /health`：本地核心健康检查。
- `GET /api/workspace`：返回前端终端工作区契约，字段使用 camelCase，当前 `schemaVersion` 为 `1`。
- `GET /api/research/run?market=ashare&symbol=600000&timeframe=1d`：运行终端研究流水线，复用行情适配器、缓存、回测引擎和本地 AI 助手，写入研究运行审计，并返回可直接渲染的 workspace。
- `GET /api/research/runs?limit=5`：返回最近研究运行审计记录，用于终端 Run History 面板。
- `GET /api/demo?market=ashare&symbol=600000&timeframe=1d`：拉取演示行情、运行策略回测并生成本地 AI 研究报告。

## Next Integration Points

1. 将 `/api/workspace` 和 `/api/research/run` 的结果持久化为 workspace layout、数据快照、backtest run 和 agent run 记录。
2. 将 optional data adapters 从占位实现扩展为实际 AKShare/yfinance/ccxt normalization。
3. 增加策略 DSL 校验和更多可视化条件。
4. 将 AI provider 抽象接到 OpenAI-compatible 和 Ollama-compatible 后端。
5. 在 Paper Trading 稳定后增加 A 股券商适配器接口实现。
