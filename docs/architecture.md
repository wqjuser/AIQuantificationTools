# Architecture

## Runtime Shape

AIQuantificationTools 使用一套 React 前端支撑 Web 和桌面端。桌面端通过 Tauri v2 包装同一个 Vite 应用；Python 本地核心作为独立服务运行，默认监听 `127.0.0.1:8765`。

Docker 部署使用 `compose.yaml` 启动 `api` 和 `web` 两个服务：`api` 运行 Python quant-core，并通过 `QUANT_CORE_HOST=0.0.0.0` 暴露容器内 `8765`；`web` 使用 Node 22 构建 Vite 静态资源，再由 Nginx Alpine 托管页面并把 `/api/*` 与 `/health` 反向代理到 `api:8765`。生产 Web 构建时 `VITE_QUANT_API_BASE=/`，前端 API client 会生成同源 `/api/...` URL，避免浏览器在容器部署中访问用户机器的 `127.0.0.1:8765`。SQLite 行情缓存、研究运行、策略库、笔记和模拟执行记录持久化在 Compose 命名卷 `quant-data`。

## Backend Core

- `domain.py`：统一 OHLCV、策略、回测、AI 报告、订单和账户模型。
- `adapters.py`：定义 `MarketDataAdapter`，并预留 AKShare、yfinance、ccxt 等免费数据源适配器。
- `cache.py`：SQLite 本地行情缓存，按 `market + symbol + timeframe + timestamp` 去重，并提供总行数、上下文数量、最新 K 线时间和最近缓存上下文清单的只读统计。
- `backtest.py`：首版长仓回测引擎，支持 SMA、RSI 和成交量确认条件、仓位比例、止盈止损、费用和滑点。
- `backtest.py` 的入场条件支持 `volume_above_sma`、`rsi_below` 和 `rsi_above`，且多个入场条件采用 AND 语义，用于把 Strategy Lab/AI draft 中的 SMA 主条件、RSI 动量确认和成交量确认纳入真实回测触发，而不是只停留在文本描述。
- `ai.py`：本地确定性研究助手，后续可替换为 OpenAI 兼容接口或本地模型。
- `ai_review_runs.py`：SQLite AI 评审运行记录库，保存 `aiqt.aiReviewRun` JSON，按审计 run id 查询，供 AI 委员会历史、风控审批和审计回放复用。
- `execution.py`：Paper Trading 执行器，保留风控拒单、成交和账户快照；同时提供 `validate_paper_execution_handoff` 和 `PaperExecutionStore`，在 API 提交前检查审计数据质量完整性和策略风控字段完整性，并把模拟执行记录绑定到审计 `runId`，持久化订单、闸门和账户快照；`build_promotion_candidate` 也复用该风险交接校验，缺失完整数据质量或结构化风控时晋级候选保持 blocked，即使已有历史模拟成交。
- `runs.py`：SQLite 研究运行审计记录，保存 run id、结构化策略配置、策略 revision、数据质量、数据快照、研究笔记快照、数据行数、指标、交易流水、权益曲线、诊断、AI 决策和完整 AI 研究报告，并可序列化为带 SHA-256 integrity 的研究运行导出包，也可将导出包恢复为本地审计记录；导出包还可携带该 run 的持久化 paper execution history、promotion candidate、AI review run records、`artifactCounts.researchNotes` 和 `artifactCounts.aiReviewRuns`，方便跨机器导入后恢复执行中心、AI 委员会历史与研究上下文。完整性哈希使用 canonical JSON，排除 `integrity`/`exportedAt`，并规范化整数浮点和等价时区时间戳以适配浏览器/工具链 JSON 往返；导入时会校验 `artifactCounts.promotionCandidates` 与包内 `promotionCandidate` 是否一致。
- `strategy_library.py`：SQLite 策略版本库，将 Strategy Lab 的结构化草稿保存为稳定 revision、strategy config、可回放 snapshot 和审计状态；同一 revision 只保留一个不可变版本记录，若后续绑定审计 run，会升级为 audited 状态。导入研究运行包时，策略库也可用包内 `researchRun.strategyConfig.revision` 保存外部审计 revision，避免跨机器导入后 Strategy Lab 与 Audit run revision 断链。
- `research_notes.py`：SQLite 研究笔记库，按 `market + symbol + timeframe` 保存 Research Terminal 的本地上下文笔记；研究流水线运行时读取当前笔记并锁定到 `ResearchRunAudit.researchNote`。导入研究运行包时，包内非空 `researchRun.researchNote` 也会按原上下文写回该库，方便跨机器回放后继续编辑研究上下文。
- `terminal.py`：终端工作区契约，覆盖 quant loop、terminal modules、AI agent committee、decision log 和 execution safety gates。
- `live_quotes.py`：参考 QuantDinger 的实盘报价路径，按市场路由 REST quote/ticker 源，并用 `watchlist_price:{market}:{symbol}` 短 TTL 缓存 watchlist 报价。
- `market_klines.py`：参考 QuantDinger 的 `/api/kline` + `KlineService` 路径，输出图表用 OHLCV bars；A 股日线走腾讯 `fqkline`，美股走 yfinance，加密货币走 ccxt，失败时保留 demo fallback 并标记 `isComplete=false`。
- `api.py`：标准库 HTTP API，用于前端工作区同步、演示研究闭环和本地验证；`/api/market/klines` 在外部 K 线适配器失败或只返回 incomplete fallback 时会读取 SQLite `MarketDataCache`，并用 `local-cache` 数据质量标记返回。
- `research.py`：研究流水线编排层，负责拉取 K 线、生成策略配置、运行回测、调用本地 AI 助手并写入审计 run；它与图表接口复用本地行情缓存约定，上游异常或 incomplete fallback 时优先使用 `local-cache` 完成研究 run，且只把完整真实上游数据写入缓存。即时 workspace summary 会携带与审计记录一致的 `dataQuality` 和 `strategyConfig`，供前端工作流闸门直接使用。
- `settings.py`：平台设置状态契约，汇总数据源、可选本地 API Key 配置标志、SQLite 行情缓存路径/行数/上下文/最新时间、最近缓存上下文清单、缓存 freshness 明细与汇总和执行适配器安全状态；该模块不返回任何密钥值，也不解锁实盘交易。

## Frontend Core

前端提供三栏终端工作台：左侧 quant loop 和模块导航，中间图表、策略、回测、节点流和执行中心，右侧 TradingAgents 风格的 AI 委员会、可追踪决策日志和 Run History。启动时它会通过 `VITE_QUANT_API_BASE` 指向的本地核心调用 `/api/workspace`、`/api/market/klines` 和 `/api/research/runs`；若核心不可用，则保留 bundled offline snapshot，保证桌面/Web 首屏仍可打开。生产构建通过 Vite/Rollup `manualChunks` 把 React、`klinecharts`、`lucide-react`、Tauri bridge 和其他第三方依赖拆成稳定 vendor chunk，避免 Web/Tauri 打包时重新聚合成单个大入口包。`/api/workspace` 会尝试附加实盘报价，报价源不可用时保留 bundled fallback 价格，避免未配置 API Key 的环境把首屏价格覆盖为 0。图表区域使用 `klinecharts` canvas 渲染真实 OHLCV，并在数据条显示来源和 bars 数；Market 工作区的数据源健康面板会读取 Settings 返回的当前 `market + symbol + timeframe` 缓存上下文，并通过 `/api/cache/refresh` 刷新当前 K 线缓存，刷新后同步 Settings 状态和图表数据；同一面板还会按当前 watchlist 汇总所选周期的 fresh/stale/empty 缓存状态，并通过 `refreshMarketCacheBatch` 按顺序复用单上下文刷新接口准备整组自选数据。点击 Watchlist 标的或顶部周期控件会切换研究上下文并清除旧审计结果；Strategy Lab 里的最近策略版本会先按上下文、名称、入场、出场、仓位和风控生成差异摘要，再允许按保存记录切换市场、标的和周期，把该版本载入为新的策略草稿，并清空旧审计 run、交易流水、指标和执行状态，要求重新运行流水线；Strategy Lab 的结构化构建器可在 SMA 价格条件和 RSI 阈值条件之间切换，分别维护入场/出场条件类型、窗口和 RSI 阈值，入场侧还可打开 RSI 确认和成交量确认，配置 RSI 窗口/阈值与 VOL 窗口，生成可审计的 `Close > SMA20`、`RSI14 < 30`、`Close > SMA5 AND RSI14 > 55 AND Volume > VOL10` 等 snapshot；`buildStrategyRuleDraft` 也会从已有审计文本恢复同一组草稿字段，保证版本载入和运行回放后仍可编辑；`buildStrategyTemplateOptions` 和 `workspaceWithStrategyTemplate` 提供 SMA 趋势、RSI 反转和放量突破内置模板，套用模板会生成新的结构化草稿并清空旧审计证据。Strategy Lab 同时通过 `buildStrategyReadinessGates` 汇总策略结构、风控参数、执行模式和审计证据四个就绪闸门，让用户在保存版本或运行流水线前看到草稿是否仍处于阻断/待复核状态；点击历史运行会先读取完整 run detail，再把该次审计记录、原始周期、研究笔记快照、结构化策略配置和审计 K 线快照回放到当前终端；点击历史运行的导出动作会下载包含数据快照、研究笔记、策略、AI 报告、指标、交易流水和执行闸门的 JSON 复现包；点击导入动作可选择 `.json` 复现包写回本地核心，并立即把导入的审计运行回放到当前终端，随后读取已恢复到本地库的研究笔记刷新 Research 工作区的可编辑草稿，并读取同上下文策略库把 restored audited strategy 合并进 Strategy Lab 最近策略列表；核心也会把包内策略配置恢复为 audited 策略版本供 Strategy Lab 最近策略列表复用。研究流水线返回的 workspace 若只包含 run summary 且缺少 `researchRun.dataSnapshot`，前端会立刻按 `runId` 调用 `/api/research/runs/{runId}` 补全完整审计详情，再进入 Backtest、AI Review 和 Paper Trading 状态；若 summary 已携带 `dataQuality` 和 `strategyConfig`，流水线成功日志会立即展示数据源、完整性、warning 数、策略 revision 和执行模式。Backtest 工作区通过 `BacktestReport` 前端模型把已审计 run、费用假设、指标、交易流水、权益曲线、诊断、同数据快照买入持有基准、alpha、参数敏感性、证据包、AI 评审准备状态和执行交接状态合并成一个可复现报告；没有 run id 或数据快照时报告保持对应阻断/待复核状态，不允许伪造 AI/执行准备；当前报告可直接导出为 Markdown，用于人工复核、归档和跨工具阅读，完整复现仍使用 JSON 导出包。参数敏感性扫描由 `researchRun.dataSnapshot.bars` 本地计算，仅比较当前 SMA 窗口附近的候选组合，输出收益、最大回撤、交易数和相对当前审计收益的差异，不作为优化器或交易建议；非当前候选可暂存为 Strategy Lab 草稿，系统会清除旧 run、交易流水和指标，要求重新运行流水线形成新的审计证据。AI 证据卡、评审 dossier 和 AI Review Markdown 报告只引用已锁定到 run 的研究笔记、回测指标、数据质量、委员会轮次、决策日志和同数据快照基准 Alpha，不读取可变的当前编辑草稿；前端风控审批优先读取审计 run 内的 `strategyConfig.risk`，只有旧 run 缺少结构化策略时才回退到当前草稿；执行中心的未提交 paper 预览用审计仓位上限和回测初始资金计算名义金额，保持与后端 paper execution 的数量规则一致；“解释回测”动作日志也会同时记录策略收益、买入持有收益和 Alpha。审计运行回放或导入完成后，前端会继续读取 `/api/research/runs/{runId}/paper-executions`；若该 run 存在持久化模拟执行记录，执行中心恢复最新订单、账户和闸门结果，否则继续显示当前审计 run 派生的本地预测 paper rows。模拟执行提交遇到核心风控拒绝时，前端保留 `source=core` 和拒绝原因，不把它降级成离线 fallback。前端 i18n 语言包位于 `apps/web/src/lib/i18n.ts`，默认 `zh-CN`，并提供 `en-US` 切换。

参数敏感性扫描已扩展为条件组合扫描：SMA-only 策略保持 3x3 窗口对比；当入场规则包含 `Close > SMAx AND RSIy > z` 时，扫描会同时展开 RSI 阈值候选；当入场规则包含 `Volume > VOLy` 时，扫描会同时展开 VOL 窗口候选，并在本地模拟中复用 RSI 确认、成交量确认、费用、滑点、仓位、止盈和止损假设。`BacktestParameterScanSummary` 会从同一组扫描行派生当前参数排名、候选数量、风险行数和“复审候选”，并同步进入 UI 和 Markdown 报告；候选暂存仍只生成新的 Strategy Lab 草稿，不直接给交易建议。

AI Review 现在复用同一个 `BacktestParameterScanSummary` 生成 `parameter-scan` citation，并在独立 Markdown AI 评审报告中输出参数扫描摘要表。该证据只说明当前审计快照上的候选复审上下文，不会绕过重新审计、风控闸门或人工确认。

`buildAiReviewRunRecord` 会把已审计 run 的 AI 评审状态打包为 `aiqt.aiReviewRun` JSON：包含 run id、策略 revision、市场/标的/周期、dossier、citations、committee rounds、decision log、摘要计数和“仅解释证据”的安全边界。前端 AI Review 面板可导出该结构化记录，也可通过 `/api/research/runs/{runId}/ai-reviews` 保存到本地核心；保存后面板会显示最近的运行记录摘要，审计 run 回放或导入完成后也会读取同一接口恢复该 run 的 AI 评审记录。研究运行 JSON 导出包会把这些已保存记录放入 `aiReviewRuns`，导入时校验 run id、record type、schema、manifest count 和安全边界后写回 `AiReviewRunStore`。

本地核心已经提供 `AiReviewRunStore`，并通过 `/api/research/runs/{runId}/ai-reviews` 保存和读取绑定到同一审计 run 的 AI 评审记录。POST 会先确认 research run 存在，再校验 `recordType=aiqt.aiReviewRun`、`schemaVersion=1`、`runId` 与路径一致和安全边界存在；GET 支持 `limit`、`offset`、`query`，并返回 `pagination` 元信息。Audit 工作区会用同一个后端查询结果驱动漂移摘要、保存记录历史和上一页/下一页控件，避免前端二次过滤和后端搜索语义不一致；前端 `buildAiReviewAuditTimelineItems` 还会把当前审计证据、当前页保存的 AI 评审记录和风控审批状态合并成紧凑时间线引用，并为每个引用附带 `targetWorkspaceId`、`targetRecordId` 和 `actionLabel`，让 Audit 时间线可以跳转回测证据、切换保存评审对照或进入执行审批。

前端风险审批现在还会把 `researchRun.dataQuality` 渲染为独立 gate：来源必须不是 `demo-fallback/unknown`，完整性必须为 true，且 rows 必须为正数；模拟委托预览、风险检查行和晋级队列都复用该 gate，保证用户提交前就能看到与后端 paper handoff 一致的数据质量阻断原因。

## Live Quote Flow

实盘数据首版复用 QuantDinger 的同步查询思路，而不是先引入长连接行情流：A 股通过腾讯 quote endpoint 获取快照，美股优先 Finnhub quote 并在无 Key 或失败时降级 yfinance，加密货币通过 ccxt 的 `fetch_ticker` 读取交易所 ticker。内部统一为 `MarketQuote`，由 `QuantDingerLiveQuoteAdapter` 管理 source、时间戳、涨跌幅、不可用原因和 watchlist TTL 缓存。前端展示使用 `/api/workspace` 的 enriched watchlist；调试或单标的刷新可直接调用 `/api/market/quotes?market=ashare&symbol=600000`。

## Live Chart Flow

图表数据与报价快照分开：报价用 ticker/quote，图表用 OHLCV K 线。前端切换标的或周期时调用 `/api/market/klines`，把 `timestampMs/open/high/low/close/volume` 映射为 `klinecharts` 的 `KLineData[]`，并通过 `applyNewData` 刷新蜡烛图和 VOL 副图。A 股 `1d` 使用腾讯 `fqkline`；分钟线优先尝试 Eastmoney/AKShare 近期窗口；若外部源不可用但 SQLite 中已有当前上下文缓存，接口返回 `local-cache` 并保留 upstream warning；只有完整真实数据会写入 SQLite，demo fallback 不再污染本地缓存。

## Local API Surface

- `GET /health`：本地核心健康检查。
- `GET /api/workspace`：返回前端终端工作区契约，字段使用 camelCase，当前 `schemaVersion` 为 `1`，并尽力附加实盘 watchlist 报价。
- `GET /api/market/quotes?market=ashare&symbol=600000`：返回单标的实盘报价；不传参数时返回默认 watchlist 报价。
- `GET /api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=160`：返回图表用 OHLCV bars、数据质量、source 和 warning。
- `GET /api/settings/status`：返回 Settings 工作区只读状态，包括 A 股/美股/加密数据源、可选 API Key 是否本地配置、SQLite 行情缓存路径、缓存行数、市场/标的/周期上下文数量、最新 K 线时间、最近缓存上下文清单、每个上下文的 `fresh/stale/empty` freshness、顶层 `freshnessSummary` 和执行适配器闸门；响应只暴露布尔配置状态，不包含 secret。
- `POST /api/cache/refresh`：按 `market/symbol/timeframe/limit` 主动刷新单个缓存上下文，复用现有 K 线适配器写入 SQLite，并返回刷新摘要、数据质量和最新 Settings 状态；该接口只影响行情缓存，不触发研究 run、AI 评审或交易执行。
- `POST /api/strategies/validate`：校验 Strategy Lab 草稿，返回策略结构、风控参数、执行模式和审计证据四个 readiness gates、整体状态、稳定 revision 和标准化 `strategyConfig`；前端优先使用该核心校验结果，核心不可用时回退到本地 gate。
- `POST /api/strategies`：保存当前 Strategy Lab 草稿为本地策略版本；保存前复用 `validate_strategy_snapshot`，schema 或风控 gate 阻断时返回 `strategy_not_ready` 和完整 validation gates，不写入策略库。预检通过后返回稳定 revision、strategy config、可回放 snapshot 和 `draft/audited` 状态。
- `GET /api/strategies?market=ashare&symbol=600000&limit=8`：按标的读取最近策略版本，用于 Strategy Lab 快速复用。
- `GET /api/strategies/{revision}`：按 revision 读取单个策略版本详情；缺失返回 `strategy_not_found`。
- `GET /api/research/notes?market=ashare&symbol=600000&timeframe=1d`：读取当前研究上下文的本地笔记；未保存时返回空 body 和 `updatedAt=null`。
- `POST /api/research/notes`：保存当前研究上下文笔记，按 `market/symbol/timeframe` 覆盖同一上下文的最新版本。
- `GET /api/research/run?market=ashare&symbol=600000&timeframe=1d`：运行终端研究流水线；若请求携带 Strategy Lab 草稿，会先复用 `validate_strategy_snapshot` 做策略预检，schema 或风控 gate 阻断时返回 `strategy_not_ready` 和完整 validation gates，不创建审计 run。预检通过后复用行情适配器、缓存、回测引擎和本地 AI 助手，读取当前上下文研究笔记并锁定为 `researchRun.researchNote`，写入研究运行审计，把本次通过审计的策略 revision 绑定到 `StrategyLibraryStore` 并标记为 `audited`，然后返回可直接渲染的 workspace；返回契约包含 `selectedTimeframe`、`researchRun.dataQuality`、`researchRun.dataSnapshot` 和 `researchRun.strategyConfig`，用于前端立即计算回测基准对比，并用同一份审计证据驱动 AI/风控/执行闸门。
- `GET /api/research/runs?limit=5`：返回最近研究运行审计记录，用于终端 Run History 面板；每条记录包含 `strategyConfig`、`dataQuality`、`researchNote` 和 `aiReport`，分别记录结构化策略规则、数据源质量、研究上下文与 AI 研究摘要；列表不返回完整 K 线快照，避免历史面板 payload 过重。
- `GET /api/research/runs/{runId}`：返回单次研究运行的完整审计详情，用于按 id 回放、导出、AI 报告和后续执行绑定；详情同样携带 `strategyConfig`、`dataQuality`、`dataSnapshot`、`researchNote` 和 `aiReport`，回放时优先用结构化策略生成策略快照、用 `dataSnapshot.bars` 刷新图表，并在缺少原始决策日志时从 `aiReport` 恢复 AI Summary、Risk Manager、Portfolio Manager 和 AI Boundary 记录。
- `GET /api/research/runs/{runId}/export`：返回 `aiqt.researchRun.export` JSON 包，用于离线复现和后续执行交接；包内包含 manifest、完整 `researchRun` 详情、数据快照、研究笔记快照、artifact counts、paper execution history、AI review run records、paper-only execution handoff 和 top-level `integrity`，实盘闸门默认保持关闭。导出时间 `exportedAt` 属于包元数据，不参与内容完整性哈希。
- `POST /api/research/runs/import`：导入 `aiqt.researchRun.export` JSON 包，将其中的 `researchRun` 写入本地审计库，将非空 `researchRun.researchNote` 写回本地 `ResearchNoteStore`，将 `researchRun.strategyConfig` 以原始 revision 还原为本地 audited 策略版本，将 `paperExecutions` 还原到本地 `PaperExecutionStore`，将 `aiReviewRuns[].record` 还原到本地 `AiReviewRunStore`，并返回完整 run detail；若导入包声称允许实盘交易、integrity hash 校验失败、manifest 与数据快照/交易流水/研究笔记/模拟执行/晋级候选/AI 评审记录数量不一致，则返回 `invalid_research_run_export`，导入不能绕过本地风控闸门。
- `POST /api/research/runs/{runId}/paper-executions`：先校验审计运行的 `dataQuality` 是否完整，再校验结构化 `strategyConfig.risk` 是否包含正数 `positionPct`、`stopLossPct`、`takeProfitPct` 和 `maxDrawdownPct`；数据质量不完整、`demo-fallback`、`unknown` 或风控字段缺失时返回 `invalid_paper_execution` 且不写入执行记录。通过后再从数据快照、回测假设和仓位上限派生一笔本地模拟委托，经过 `PaperExecutionAdapter` 风控后写入 `PaperExecutionStore`；返回订单、账户快照和 `audit-run-bound`、`paper-risk-check`、`live-route-blocked` 闸门。
- `GET /api/research/runs/{runId}/paper-executions`：返回该审计运行的近期模拟执行记录，用于后续回放和执行中心展示；前端 replay/import 会读取最新一条记录恢复执行中心；缺失 run id 返回 `research_run_not_found`。
- `POST /api/research/runs/{runId}/ai-reviews`：保存一条结构化 `aiqt.aiReviewRun` 记录；run 不存在返回 `research_run_not_found`，schema、record type、run id 或安全边界不合法返回 `invalid_ai_review_record`。
- `GET /api/research/runs/{runId}/ai-reviews?limit=20&offset=0&query=`：返回该审计运行的 AI 评审记录分页和 `pagination` 元信息，用于 AI 委员会历史、审计回放和风控审批引用。
- `GET /api/demo?market=ashare&symbol=600000&timeframe=1d`：拉取演示行情、运行策略回测并生成本地 AI 研究报告。

## Next Integration Points

1. 将 `/api/workspace` 和 `/api/research/run` 的结果持久化为 workspace layout、数据快照、backtest run 和 agent run 记录。
2. 将 optional data adapters 从占位实现扩展为实际 AKShare/yfinance/ccxt normalization，并复用 `MarketQuote` 的源状态和缓存约定。
3. 增加策略 DSL 校验和更多可视化条件。
4. 将 AI provider 抽象接到 OpenAI-compatible 和 Ollama-compatible 后端。
5. 在 Paper Trading 稳定后增加 A 股券商适配器接口实现。
