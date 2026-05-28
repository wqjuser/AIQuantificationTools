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
- `runs.py`：SQLite 研究运行审计记录，保存 run id、策略 revision、数据质量、数据行数、指标、交易流水、权益曲线、诊断和 AI 决策。
- `terminal.py`：终端工作区契约，覆盖 quant loop、terminal modules、AI agent committee、decision log 和 execution safety gates。
- `live_quotes.py`：参考 QuantDinger 的实盘报价路径，按市场路由 REST quote/ticker 源，并用 `watchlist_price:{market}:{symbol}` 短 TTL 缓存 watchlist 报价。
- `market_klines.py`：参考 QuantDinger 的 `/api/kline` + `KlineService` 路径，输出图表用 OHLCV bars；A 股日线走腾讯 `fqkline`，美股走 yfinance，加密货币走 ccxt，失败时保留 demo fallback 并标记 `isComplete=false`。
- `api.py`：标准库 HTTP API，用于前端工作区同步、演示研究闭环和本地验证。

## Frontend Core

前端提供三栏终端工作台：左侧 quant loop 和模块导航，中间图表、策略、回测、节点流和执行中心，右侧 TradingAgents 风格的 AI 委员会、可追踪决策日志和 Run History。启动时它会通过 `VITE_QUANT_API_BASE` 指向的本地核心调用 `/api/workspace`、`/api/market/klines` 和 `/api/research/runs`；若核心不可用，则保留 bundled offline snapshot，保证桌面/Web 首屏仍可打开。`/api/workspace` 会尝试附加实盘报价，报价源不可用时保留 bundled fallback 价格，避免未配置 API Key 的环境把首屏价格覆盖为 0。图表区域使用 `klinecharts` canvas 渲染真实 OHLCV，并在数据条显示来源和 bars 数。点击 Watchlist 标的或顶部周期控件会切换研究上下文并清除旧审计结果；点击历史运行可把该次审计记录和原始周期回放到当前终端。前端 i18n 语言包位于 `apps/web/src/lib/i18n.ts`，默认 `zh-CN`，并提供 `en-US` 切换。

## Live Quote Flow

实盘数据首版复用 QuantDinger 的同步查询思路，而不是先引入长连接行情流：A 股通过腾讯 quote endpoint 获取快照，美股优先 Finnhub quote 并在无 Key 或失败时降级 yfinance，加密货币通过 ccxt 的 `fetch_ticker` 读取交易所 ticker。内部统一为 `MarketQuote`，由 `QuantDingerLiveQuoteAdapter` 管理 source、时间戳、涨跌幅、不可用原因和 watchlist TTL 缓存。前端展示使用 `/api/workspace` 的 enriched watchlist；调试或单标的刷新可直接调用 `/api/market/quotes?market=ashare&symbol=600000`。

## Live Chart Flow

图表数据与报价快照分开：报价用 ticker/quote，图表用 OHLCV K 线。前端切换标的或周期时调用 `/api/market/klines`，把 `timestampMs/open/high/low/close/volume` 映射为 `klinecharts` 的 `KLineData[]`，并通过 `applyNewData` 刷新蜡烛图和 VOL 副图。A 股 `1d` 使用腾讯 `fqkline`；分钟线在首版保留 demo fallback 和 warning，后续接 AKShare 近期分钟线缓存。

## Local API Surface

- `GET /health`：本地核心健康检查。
- `GET /api/workspace`：返回前端终端工作区契约，字段使用 camelCase，当前 `schemaVersion` 为 `1`，并尽力附加实盘 watchlist 报价。
- `GET /api/market/quotes?market=ashare&symbol=600000`：返回单标的实盘报价；不传参数时返回默认 watchlist 报价。
- `GET /api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=160`：返回图表用 OHLCV bars、数据质量、source 和 warning。
- `GET /api/research/run?market=ashare&symbol=600000&timeframe=1d`：运行终端研究流水线，复用行情适配器、缓存、回测引擎和本地 AI 助手，写入研究运行审计，并返回可直接渲染的 workspace；返回契约包含 `selectedTimeframe`。
- `GET /api/research/runs?limit=5`：返回最近研究运行审计记录，用于终端 Run History 面板；每条记录包含 `dataQuality`，标记 source、完整性、warning 和 rows。
- `GET /api/research/runs/{runId}`：返回单次研究运行的完整审计详情，用于按 id 回放、导出、AI 报告和后续执行绑定；详情同样携带 `dataQuality`，回放时会把不完整或 fallback 数据显示为 warning。
- `GET /api/demo?market=ashare&symbol=600000&timeframe=1d`：拉取演示行情、运行策略回测并生成本地 AI 研究报告。

## Next Integration Points

1. 将 `/api/workspace` 和 `/api/research/run` 的结果持久化为 workspace layout、数据快照、backtest run 和 agent run 记录。
2. 将 optional data adapters 从占位实现扩展为实际 AKShare/yfinance/ccxt normalization，并复用 `MarketQuote` 的源状态和缓存约定。
3. 增加策略 DSL 校验和更多可视化条件。
4. 将 AI provider 抽象接到 OpenAI-compatible 和 Ollama-compatible 后端。
5. 在 Paper Trading 稳定后增加 A 股券商适配器接口实现。
