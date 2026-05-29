# Architecture

## Runtime Shape

AIQuantificationTools 使用一套 React 前端支撑 Web 和桌面端。桌面端通过 Tauri v2 包装同一个 Vite 应用；Python 本地核心作为独立服务运行，默认监听 `127.0.0.1:8765`。

## Backend Core

- `domain.py`：统一 OHLCV、策略、回测、AI 报告、订单和账户模型。
- `adapters.py`：定义 `MarketDataAdapter`，并预留 AKShare、yfinance、ccxt 等免费数据源适配器。
- `cache.py`：SQLite 本地行情缓存，按 `market + symbol + timeframe + timestamp` 去重。
- `backtest.py`：首版长仓回测引擎，支持 SMA 条件、仓位比例、止盈止损、费用和滑点。
- `ai.py`：本地确定性研究助手，后续可替换为 OpenAI 兼容接口或本地模型。
- `execution.py`：Paper Trading 执行器，保留风控拒单、成交和账户快照；同时提供 `PaperExecutionStore`，把模拟执行记录绑定到审计 `runId`，持久化订单、闸门和账户快照。
- `runs.py`：SQLite 研究运行审计记录，保存 run id、结构化策略配置、策略 revision、数据质量、数据快照、研究笔记快照、数据行数、指标、交易流水、权益曲线、诊断、AI 决策和完整 AI 研究报告，并可序列化为带 SHA-256 integrity 的研究运行导出包，也可将导出包恢复为本地审计记录；导出包还可携带该 run 的持久化 paper execution history 和 `artifactCounts.researchNotes`，方便跨机器导入后恢复执行中心与研究上下文。完整性哈希使用 canonical JSON，排除 `integrity`/`exportedAt`，并规范化整数浮点和等价时区时间戳以适配浏览器/工具链 JSON 往返。
- `strategy_library.py`：SQLite 策略版本库，将 Strategy Lab 的结构化草稿保存为稳定 revision、strategy config、可回放 snapshot 和审计状态；同一 revision 只保留一个不可变版本记录，若后续绑定审计 run，会升级为 audited 状态。
- `research_notes.py`：SQLite 研究笔记库，按 `market + symbol + timeframe` 保存 Research Terminal 的本地上下文笔记；研究流水线运行时读取当前笔记并锁定到 `ResearchRunAudit.researchNote`。
- `terminal.py`：终端工作区契约，覆盖 quant loop、terminal modules、AI agent committee、decision log 和 execution safety gates。
- `live_quotes.py`：参考 QuantDinger 的实盘报价路径，按市场路由 REST quote/ticker 源，并用 `watchlist_price:{market}:{symbol}` 短 TTL 缓存 watchlist 报价。
- `market_klines.py`：参考 QuantDinger 的 `/api/kline` + `KlineService` 路径，输出图表用 OHLCV bars；A 股日线走腾讯 `fqkline`，美股走 yfinance，加密货币走 ccxt，失败时保留 demo fallback 并标记 `isComplete=false`。
- `api.py`：标准库 HTTP API，用于前端工作区同步、演示研究闭环和本地验证。

## Frontend Core

前端提供三栏终端工作台：左侧 quant loop 和模块导航，中间图表、策略、回测、节点流和执行中心，右侧 TradingAgents 风格的 AI 委员会、可追踪决策日志和 Run History。启动时它会通过 `VITE_QUANT_API_BASE` 指向的本地核心调用 `/api/workspace`、`/api/market/klines` 和 `/api/research/runs`；若核心不可用，则保留 bundled offline snapshot，保证桌面/Web 首屏仍可打开。`/api/workspace` 会尝试附加实盘报价，报价源不可用时保留 bundled fallback 价格，避免未配置 API Key 的环境把首屏价格覆盖为 0。图表区域使用 `klinecharts` canvas 渲染真实 OHLCV，并在数据条显示来源和 bars 数。点击 Watchlist 标的或顶部周期控件会切换研究上下文并清除旧审计结果；点击历史运行会先读取完整 run detail，再把该次审计记录、原始周期、研究笔记快照和审计 K 线快照回放到当前终端；点击历史运行的导出动作会下载包含数据快照、研究笔记、策略、AI 报告、指标、交易流水和执行闸门的 JSON 复现包；点击导入动作可选择 `.json` 复现包写回本地核心，并立即把导入的审计运行回放到当前终端。研究流水线返回的 workspace 若只包含 run summary 且缺少 `researchRun.dataSnapshot`，前端会立刻按 `runId` 调用 `/api/research/runs/{runId}` 补全完整审计详情，再进入 Backtest、AI Review 和 Paper Trading 状态。Backtest 工作区通过 `BacktestReport` 前端模型把已审计 run、费用假设、指标、交易流水、权益曲线、诊断、同数据快照买入持有基准、alpha、参数敏感性、证据包、AI 评审准备状态和执行交接状态合并成一个可复现报告；没有 run id 或数据快照时报告保持对应阻断/待复核状态，不允许伪造 AI/执行准备；当前报告可直接导出为 Markdown，用于人工复核、归档和跨工具阅读，完整复现仍使用 JSON 导出包。参数敏感性扫描由 `researchRun.dataSnapshot.bars` 本地计算，仅比较当前 SMA 窗口附近的候选组合，输出收益、最大回撤、交易数和相对当前审计收益的差异，不作为优化器或交易建议。AI 证据卡、评审 dossier 和 AI Review Markdown 报告只引用已锁定到 run 的研究笔记、回测指标、数据质量、委员会轮次、决策日志和同数据快照基准 Alpha，不读取可变的当前编辑草稿；“解释回测”动作日志也会同时记录策略收益、买入持有收益和 Alpha。审计运行回放或导入完成后，前端会继续读取 `/api/research/runs/{runId}/paper-executions`；若该 run 存在持久化模拟执行记录，执行中心恢复最新订单、账户和闸门结果，否则继续显示当前审计 run 派生的本地预测 paper rows。前端 i18n 语言包位于 `apps/web/src/lib/i18n.ts`，默认 `zh-CN`，并提供 `en-US` 切换。

## Live Quote Flow

实盘数据首版复用 QuantDinger 的同步查询思路，而不是先引入长连接行情流：A 股通过腾讯 quote endpoint 获取快照，美股优先 Finnhub quote 并在无 Key 或失败时降级 yfinance，加密货币通过 ccxt 的 `fetch_ticker` 读取交易所 ticker。内部统一为 `MarketQuote`，由 `QuantDingerLiveQuoteAdapter` 管理 source、时间戳、涨跌幅、不可用原因和 watchlist TTL 缓存。前端展示使用 `/api/workspace` 的 enriched watchlist；调试或单标的刷新可直接调用 `/api/market/quotes?market=ashare&symbol=600000`。

## Live Chart Flow

图表数据与报价快照分开：报价用 ticker/quote，图表用 OHLCV K 线。前端切换标的或周期时调用 `/api/market/klines`，把 `timestampMs/open/high/low/close/volume` 映射为 `klinecharts` 的 `KLineData[]`，并通过 `applyNewData` 刷新蜡烛图和 VOL 副图。A 股 `1d` 使用腾讯 `fqkline`；分钟线在首版保留 demo fallback 和 warning，后续接 AKShare 近期分钟线缓存。

## Local API Surface

- `GET /health`：本地核心健康检查。
- `GET /api/workspace`：返回前端终端工作区契约，字段使用 camelCase，当前 `schemaVersion` 为 `1`，并尽力附加实盘 watchlist 报价。
- `GET /api/market/quotes?market=ashare&symbol=600000`：返回单标的实盘报价；不传参数时返回默认 watchlist 报价。
- `GET /api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=160`：返回图表用 OHLCV bars、数据质量、source 和 warning。
- `POST /api/strategies`：保存当前 Strategy Lab 草稿为本地策略版本，返回稳定 revision、strategy config、可回放 snapshot 和 `draft/audited` 状态。
- `GET /api/strategies?market=ashare&symbol=600000&limit=8`：按标的读取最近策略版本，用于 Strategy Lab 快速复用。
- `GET /api/strategies/{revision}`：按 revision 读取单个策略版本详情；缺失返回 `strategy_not_found`。
- `GET /api/research/notes?market=ashare&symbol=600000&timeframe=1d`：读取当前研究上下文的本地笔记；未保存时返回空 body 和 `updatedAt=null`。
- `POST /api/research/notes`：保存当前研究上下文笔记，按 `market/symbol/timeframe` 覆盖同一上下文的最新版本。
- `GET /api/research/run?market=ashare&symbol=600000&timeframe=1d`：运行终端研究流水线，复用行情适配器、缓存、回测引擎和本地 AI 助手，读取当前上下文研究笔记并锁定为 `researchRun.researchNote`，写入研究运行审计，把本次通过审计的策略 revision 绑定到 `StrategyLibraryStore` 并标记为 `audited`，然后返回可直接渲染的 workspace；返回契约包含 `selectedTimeframe` 和 `researchRun.dataSnapshot`，用于前端立即计算回测基准对比。
- `GET /api/research/runs?limit=5`：返回最近研究运行审计记录，用于终端 Run History 面板；每条记录包含 `strategyConfig`、`dataQuality`、`researchNote` 和 `aiReport`，分别记录结构化策略规则、数据源质量、研究上下文与 AI 研究摘要；列表不返回完整 K 线快照，避免历史面板 payload 过重。
- `GET /api/research/runs/{runId}`：返回单次研究运行的完整审计详情，用于按 id 回放、导出、AI 报告和后续执行绑定；详情同样携带 `strategyConfig`、`dataQuality`、`dataSnapshot`、`researchNote` 和 `aiReport`，回放时优先用结构化策略生成策略快照、用 `dataSnapshot.bars` 刷新图表，并在缺少原始决策日志时从 `aiReport` 恢复 AI Summary、Risk Manager、Portfolio Manager 和 AI Boundary 记录。
- `GET /api/research/runs/{runId}/export`：返回 `aiqt.researchRun.export` JSON 包，用于离线复现和后续执行交接；包内包含 manifest、完整 `researchRun` 详情、数据快照、研究笔记快照、artifact counts、paper execution history、paper-only execution handoff 和 top-level `integrity`，实盘闸门默认保持关闭。导出时间 `exportedAt` 属于包元数据，不参与内容完整性哈希。
- `POST /api/research/runs/import`：导入 `aiqt.researchRun.export` JSON 包，将其中的 `researchRun` 写入本地审计库，将 `paperExecutions` 还原到本地 `PaperExecutionStore`，并返回完整 run detail；若导入包声称允许实盘交易、integrity hash 校验失败、manifest 与数据快照/交易流水/研究笔记/模拟执行数量不一致，则返回 `invalid_research_run_export`，导入不能绕过本地风控闸门。
- `POST /api/research/runs/{runId}/paper-executions`：从审计运行的数据快照、回测假设和仓位上限派生一笔本地模拟委托，经过 `PaperExecutionAdapter` 风控后写入 `PaperExecutionStore`；返回订单、账户快照和 `audit-run-bound`、`paper-risk-check`、`live-route-blocked` 闸门。
- `GET /api/research/runs/{runId}/paper-executions`：返回该审计运行的近期模拟执行记录，用于后续回放和执行中心展示；前端 replay/import 会读取最新一条记录恢复执行中心；缺失 run id 返回 `research_run_not_found`。
- `GET /api/demo?market=ashare&symbol=600000&timeframe=1d`：拉取演示行情、运行策略回测并生成本地 AI 研究报告。

## Next Integration Points

1. 将 `/api/workspace` 和 `/api/research/run` 的结果持久化为 workspace layout、数据快照、backtest run 和 agent run 记录。
2. 将 optional data adapters 从占位实现扩展为实际 AKShare/yfinance/ccxt normalization，并复用 `MarketQuote` 的源状态和缓存约定。
3. 增加策略 DSL 校验和更多可视化条件。
4. 将 AI provider 抽象接到 OpenAI-compatible 和 Ollama-compatible 后端。
5. 在 Paper Trading 稳定后增加 A 股券商适配器接口实现。
