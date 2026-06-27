# AIQuantificationTools

本项目的长期目标是做成本地优先的全功能量化交易平台，覆盖行情、研究、策略、回测、AI 评审、组合风控、模拟交易、未来实盘执行和全链路审计。当前阶段先把研究、回测、AI 评审和模拟执行做扎实，再逐步推进到受控实盘。

完整产品路线见 [docs/product-plan.md](docs/product-plan.md)。后续开发应先映射到该规划中的产品工作区和路线阶段，再进入实现。

## What Is Included

- Web/Desktop 共用前端：`apps/web` 使用 React、TypeScript、Vite，并包含 Tauri v2 桌面壳配置。
- Python 量化核心：`services/quant_core` 提供 OHLCV schema、SQLite 本地缓存、可视化策略配置、回测、AI 研究报告和 Paper Trading 执行器。
- 本地 API：`npm run api` 启动 `http://127.0.0.1:8765`，前端通过 `/api/workspace` 读取终端工作区契约，通过 `/api/research/run` 触发终端研究流水线，也可调用 `/api/demo` 跑通演示研究闭环。
- 免费数据源：A 股 `AkShareMarketDataAdapter`、美股 `YFinanceMarketDataAdapter` 和加密货币 `CcxtMarketDataAdapter` 已支持公开 OHLCV 归一化，默认仍用 demo fallback 保证开箱可跑。
- 运行审计：每次终端研究流水线会写入 `data/research_runs.sqlite`，用于追踪 run id、策略 revision、数据行数、指标和 AI 决策。
- 运行历史：前端通过 `/api/research/runs` 读取最近审计记录，并在终端右侧展示最近运行摘要。
- 审计回放：点击 Run History 中的记录可把该次运行的指标、AI 决策和审计摘要回放到当前终端。
- 研究上下文切换：点击 Watchlist 标的会切换当前研究对象，并清除旧审计结果，避免跨标的复用过期回测指标。
- 周期粒度切换：顶部 `1d / 1m / 5m / 15m / 30m / 60m` 控件会改变研究周期，Pipeline 按当前标的和周期运行。
- 多语言：`apps/web/src/lib/i18n.ts` 提供 `zh-CN / en-US` 语言包，默认中文，顶部语言控件可切换。
- 实时报价：参考 QuantDinger 的 REST quote + watchlist cache 方法，A 股走腾讯 quote，美股优先 Finnhub 并降级 yfinance，加密货币走 ccxt ticker，API 暴露 `/api/market/quotes`。
- 实盘图表：参考 QuantDinger 的 `/api/kline` + `klinecharts` 方法，前端图表从 `/api/market/klines` 拉取 OHLCV；A 股优先腾讯/东方财富并降级到正式 AKShare adapter，美股优先 Yahoo chart 并降级到正式 yfinance adapter，加密货币优先 Binance/Coinbase REST 并降级到正式 ccxt adapter。
- 行情适配器状态：`GET /api/settings/status` 会把 AKShare、yfinance 和 ccxt 的公开 OHLCV adapter、能力、周期覆盖、Key 需求、缓存 scope 和按市场聚合的缓存诊断暴露给 Settings 页面；该状态只读且不返回任何密钥值。
- ccxt sandbox 健康检查：`GET /api/execution/adapter-health/ccxt-sandbox` 会在只读模式下检查 ccxt sandbox/testnet 的 `set_sandbox_mode(true)`、markets、status/time 和可选账户同步；Settings 页面会显示检查结果。该能力不下单、不撤单、不写密钥、不启用实盘。

## Commands

```powershell
npm install
npm run test
npm run build
npm run api
npm run dev
```

前端默认使用同源 `/api`，Docker 通过 Nginx 反向代理到核心服务，本地 `npm run dev` 通过 Vite 代理到 `http://127.0.0.1:8765`。如需更换核心地址，可在 `.env` 中设置：

```powershell
VITE_QUANT_API_BASE=http://127.0.0.1:8765
```

## Docker Deployment

项目现在提供 Docker Compose 部署入口，默认启动两个容器：

- `api`：Python quant-core，本地核心监听容器内 `0.0.0.0:8765`，SQLite 数据写入命名卷 `quant-data`。
- `web`：Nginx 托管 Vite 构建产物，并把 `/api/*` 和 `/health` 反向代理到 `api` 服务。

启动：

```powershell
docker compose up --build
```

部署自检：

```powershell
npm run docker:smoke
```

如果镜像已经构建好，只想复用当前 Compose 服务：

```powershell
npm run docker:smoke -- --no-build
```

如果要验证 P0 产品闭环，而不只是验证容器和首页可访问：

```powershell
npm run docker:smoke:p0 -- --no-build --down
```

`docker:smoke:p0` 会在 Compose 服务中依次调用 P0 策略流水线、证据型 AI 评审、纸面模拟委托、研究包导出、复现包导入和导入后重导出，并把验收结果写入 `data/p0-acceptance.json`。它会校验导出包包含 `p0_paper_simulation` 审计事件、完整 `p0PackageCompleteness`，且全程保持 `paperOnly=true`、`liveTradingAllowed=false`、`liveOrderSubmitted=false`、`routeExecuted=false`。该命令会写入容器数据卷中的本地 SQLite 审计记录，不会触发真实下单。

已经归档的验收报告可以离线复核，不需要重新启动 Docker：

```powershell
npm run docker:smoke:p0:validate
```

如果要验证 P1 个人/小团队研究运营路径，而不只是验证 P0 单标的闭环：

```powershell
npm run docker:smoke:p1 -- --no-build --down
```

`docker:smoke:p1` 会读取 `/api/workspace` 的自选列表，要求至少 3 个标的，运行 watchlist cache refresh，选择一只刷新成功的 queue-ready 标的运行审计流水线、AI 评审、paper-only 模拟、研究包导出、复现包导入和导入后重导出，并把验收结果写入 `data/p1-acceptance.json`。该 manifest 会记录 `watchlistRefreshRunId`、queued symbol、检查步骤和 `paperOnly=true / liveTradingAllowed=false` 边界，用于证明 P1 研究运营链路可复现；它同样不会触发真实下单。工作台会通过 `GET /api/p1/acceptance/latest` 读取这份报告，并在 P1 研究运营验收卡显示 watchlist 数量、队列标的、检查覆盖和来源路径。

```powershell
npm run docker:smoke:p1:validate
```

P2 阶段已经开始推进实盘前准入控制面，计划见 `docs/superpowers/plans/2026-06-24-aiquant-p2-prelive-readiness.md`。Execution 的晋级队列会显示“实盘前清单”，把审计运行、风控审批、模拟执行、适配器认证和人工确认压成一个可读的准入摘要；它只用于人工复核准备，仍固定 `orderSubmissionEnabled=false` 和 `liveTradingAllowed=false`，不会连接券商或提交真实订单。

运行中的核心服务也会通过 `GET /api/p2/pre-live/acceptance/latest` 回读本地 `data/p2-pre-live-acceptance.json`。Execution 与 Audit 会把这份 P2 manifest 显示为通过、缺失或无效三态；如果 manifest 声称允许下单、允许实盘、提交过实盘订单、执行过真实路由或缺少 live-blocked 边界，平台会标记为无效并继续保持 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`。

Execution 和 Settings 还会共享同一份 Adapter Chain Health Rollup，把 live adapter 从密钥引用到 adapter paper execution 的 19 段实盘前证据链压缩成完成进度、当前阻塞点和最近证据。完整链路只代表可以进入人工复核，不代表实盘授权；界面和模型仍固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`，不会连接真实券商或提交订单。

Execution 还会显示 Paper Execution Replay Gate，把当前审计 run 的单标的纸面执行、组合委托/审批/模拟、状态历史、组合 replay 和 adapter paper execution 聚合为一个回放闸门。缺证据或证据绑定旧 run 会阻断实盘前复核；完整回放也只是人工复核材料，仍保持 `preLiveReviewAllowed=false`、`orderSubmissionEnabled=false`、`liveTradingAllowed=false`。
核心服务也会通过 `GET /api/p2/paper-replay/latest` 回读本地 `data/p2-paper-replay.json`，把便携 `aiqt.p2PaperReplayManifest` 投影成通过、缺失或无效三态。Execution 会把这份 manifest 显示在回放闸门旁边；如果 manifest 声称开启下单、允许实盘、提交实盘订单、执行真实路由、缺少 live-blocked 边界或缺少必要 replay 检查，平台会标记为无效并继续阻断实盘。
Pre-live checklist 会把 `paper-execution-replay` 作为第 6 个 gate；P2 acceptance manifest 也要求 `paper-execution-replay` 检查存在，缺失时 `/api/p2/pre-live/acceptance/latest` 会返回 invalid 状态。
Execution 还会生成 Operator Runbook，把 checklist、replay gate、adapter chain、P2 acceptance 和 safety boundary 合成操作员复核清单，并显示急停、回滚负责人、仓位限制、数据新鲜度、环境状态、审计包路径和审计覆盖状态；该清单可复制、下载并入账为 `operator_runbook_report`，但不授权真实下单。
Execution 同时显示 P2 证据覆盖矩阵，把 replay manifest、P2 acceptance manifest、manifest-chain preflight review、operator runbook audit、pre-live checklist、adapter chain 和 safety boundary 汇总为 7 条 readiness 声明，标记 covered、missing、stale 或 blocked。它只证明证据是否可追溯，仍固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`。
Execution 还会在证据矩阵上方显示 P2 顶层验收门禁，把 P1 acceptance、纸面回放、预实盘清单、P2 manifest、证据覆盖和 live-blocked 边界映射为 6 项验收定义。全部通过也只代表预实盘材料可复核，不代表真实下单或券商路由已开启。
核心服务还会通过 `GET /api/p2/readiness/acceptance/latest` 回读本地 `data/p2-readiness-acceptance.json`，把顶层验收 artifact 投影为 `accepted / missing / invalid` 三态。Execution 的 P2 顶层门禁会显示该 manifest 的来源、run id、验收项数量、coverage 状态和 live-blocked 边界；任何 artifact 试图开启下单、实盘交易、实盘订单提交或真实路由执行都会被标记为无效，平台仍保持 paper-only。
Audit 工作区也会显示同一份 P2 顶层验收复核面板，并可复制、下载或入账 Markdown 复核备注。入账会写入 `p2_readiness_acceptance_review` 审计事件，只保存 Markdown sha256、文件名、manifest 状态、来源、run id、criteria、上游 manifest、审计事件和强制 live-blocked 边界，不把完整正文塞进账本；Audit 报告台账也能搜索这类事件。保存成功后，复核面板会显示返回的审计事件 id，并提供“审计”按钮写入稳定查询来定位该 review 行；如果台账分页尚未回读到新行，前端会用保存响应和当前 readback 构造 fallback 查询。它是审计复核材料，不是实盘授权。

当 Audit 报告台账已经加载过当前 readiness 上下文的 `p2_readiness_acceptance_generated` 或 `p2_readiness_acceptance_review` 行时，Execution 顶层验收卡和 Audit 复核面板会从 ledger 回填最近匹配的事件 id。匹配会同时检查 run id、market、symbol 和 timeframe，避免刷新页面后只能看到空事件 id，也避免把其它标的或旧上下文的事件误定位到当前验收。

P2 readiness acceptance 的 ledger 回填匹配使用规范化 token 精确匹配上下文，而不是对子串做模糊包含判断。因此 `600000` 不会误匹配到更新的 `6000001` 事件；旧事件仍可通过 row id、run id、文件名、focus query 和 search text 中的明确 token 回填。该逻辑只影响既有审计事件定位，不创建新事件、不签名、不授权实盘。

同一套上下文校验也会用于“本次响应”事件 id：如果页面状态里还保留着旧标的或旧周期的 P2 readiness generated/review 响应事件，而当前 readback 已切换到另一组 run、market、symbol 或 timeframe，界面不会继续把旧 id 标成“本次响应”。它会等待当前上下文的 ledger 回填或显示未定位，避免 stale response id 被误解成当前验收证据。

上下文 token 化也兼容逗号、斜杠、分号等常见分隔符；旧事件或旧查询文本把上下文写成 `ashare,600000,1d` 时仍可被识别为明确 token，同时 `600000` 仍不会命中 `6000001` 这种更长代码。

旧账本行如果只在 `detail` 文本里保留 P2 readiness acceptance 的 run、market、symbol 和 timeframe，上下文回填也会读取这段 detail 参与 token 匹配。这样更早期的 generated/review 事件即使缺少完整 `focusQuery`、`searchText` 或顶层 `runId`，仍可在不做子串匹配的前提下定位；`READY` 这类 legacy 大小写状态会被规范化为 ready，但 invalid/blocked 仍不会参与回填。旧字段如果把 detail/searchText 写成数字或布尔，也会先转成文本再走同一套精确 token 规则；本次响应事件的 event id、run id、metadata 也复用这条 primitive-safe token 路径，避免 stale 或 malformed response 抢占当前上下文。

P2 readiness acceptance generated/review 行的“审计”查询串也会带上 row detail 和 search text。这样从 Execution 顶层验收卡或 Audit 复核面板跳回台账时，查询不仅包含 report kind、事件 id、hash、文件名和 focus query，也能携带旧文本中的 live-blocked、criterion 或上下文 token；这只提升定位体验，不改变台账内容。

这些 generated/review 查询串会按空白 token 去重并保留首次出现顺序。稳定前缀里的 report kind、事件 id、hash、文件名和 focus query 不会被后续 detail/search text 重复项淹没，Audit 搜索仍使用同一组可定位 token，但按钮写入的查询更短、更稳定。

这两个面板也会标出事件 id 来源：本次生成/入账响应优先显示为“本次响应”，页面刷新或跨工作区导航后由 Audit 台账回填的 id 会显示为“台账回填”。`p2_readiness_acceptance_review` 台账行现在也把 review 类型、run id、上下文、criteria、上游 audit ids 和 live-blocked 边界写入搜索文本，便于用同一条 Audit 查询解释“这条复核证据从哪里来”。该来源标记只解释既有审计证据，不创建新事件、不签名、不授权实盘。

`p2_readiness_acceptance_review` 仍被视为审计辅助证据，而不是可签名研究报告。Audit 报告历史、证据包控制室和行级签名/验签/撤销动作都会复用同一条签名资格规则，把 P2 review、operator runbook、pre-live runbook 和其它辅助审计行排除在签名资格之外；即使旧事件 metadata 里带有 signature 字段，也不会把这些辅助证据计入签名链或让证据包进入可归档状态。

P2 顶层验收也有 Docker smoke 聚合入口。该命令会先做容器健康检查，然后读取已经归档的 `data/p1-acceptance.json`、`data/p2-pre-live-acceptance.json` 和 `data/p2-paper-replay.json`，聚合生成 `data/p2-readiness-acceptance.json`；任一上游证据缺失、无效或声称开启实盘/下单都会失败，不会伪造通过状态：

```powershell
npm run docker:smoke:p2:preflight
npm run docker:smoke:p2:chain -- --no-build
npm run docker:smoke:p2:paper-replay:validate
npm run docker:smoke:p2:pre-live:validate
npm run docker:smoke:p2:validate
```

如果需要逐步排查，也可以分段运行：

```powershell
npm run docker:smoke:p2:paper-replay -- --no-build
npm run docker:smoke:p2:pre-live -- --no-build
npm run docker:smoke:p2 -- --no-build --down
```

`docker:smoke:p2:paper-replay` 会从 `data/p1-acceptance.json` 推导审计 run id，拉取 `/api/research/runs/{runId}/export`，并只在导出包已经包含 paper execution、组合 paper order、审批、模拟成交、状态回放和 adapter paper execution 证据时生成 `data/p2-paper-replay.json`。它不会替用户创建组合委托或适配器执行证据。

`docker:smoke:p2:pre-live` 会读取 `data/p1-acceptance.json` 和 `data/p2-paper-replay.json`，生成 `data/p2-pre-live-acceptance.json`。这份 manifest 会明确记录 `adapter-certification` 与 `human-confirmation` 仍是阻断项，只证明预实盘清单证据可复核，不会开启下单、实盘交易、实盘订单或真实路由。

`docker:smoke:p2:chain` 会在同一次 Docker smoke 中按顺序运行 paper replay、pre-live acceptance 和 top-level readiness acceptance，三个 validate 命令则可以在不启动容器的情况下复核已经归档的 `data/p2-paper-replay.json`、`data/p2-pre-live-acceptance.json` 和 `data/p2-readiness-acceptance.json`。

核心服务也可以通过 `POST /api/p2/readiness/acceptance` 在产品内生成 `data/p2-readiness-acceptance.json`。这个接口只读取已经归档并通过严格校验的 `data/p1-acceptance.json`、`data/p2-paper-replay.json` 和 `data/p2-pre-live-acceptance.json`，聚合成顶层 `aiqt.p2ReadinessAcceptanceManifest` 后立即用同一 validator 回读状态；Execution 的 P2 顶层验收卡提供“生成验收”按钮，不必手动进入容器跑 readiness 聚合命令。生成动作仍只写本地 manifest，不生成缺失上游证据、不运行 Docker、不连接券商、不提交订单，并固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`、`liveOrderSubmitted=false` 和 `routeExecuted=false`。

这个生成动作也会记录一条 `p2_readiness_acceptance_generated` 审计事件。事件 metadata 保存 manifest 状态、run id、上游 manifest 路径、criteria 覆盖、manifest sha256 和所有安全字段；Execution 的 P2 顶层验收卡会显示返回的审计事件 id，方便操作者知道这次 `data/p2-readiness-acceptance.json` 是由产品服务生成并入账的。该事件仍只是证据追踪标记，不进入签名研究包、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Audit 报告台账也会拉取并识别 `p2_readiness_acceptance_generated` 事件，支持按事件类型、短 hash、文件路径、验收状态、criteria 覆盖、run id 和标的上下文搜索。Execution 顶层验收卡里的“审计”按钮会切到 Audit 工作区并写入稳定查询；如果台账分页还没回读到刚生成的事件，前端会用生成响应和当前 readback 状态构造 fallback 查询。该 Audit 定位闭环只增强可追踪性，签名、验签和撤销控件仍保持禁用，不进入签名链或实盘授权。

`docker:smoke:p2:preflight` 不启动容器，只检查 `data/p1-acceptance.json`、`data/p2-paper-replay.json`、`data/p2-pre-live-acceptance.json` 和 `data/p2-readiness-acceptance.json` 是否存在且通过各自严格校验，并写出 `data/p2-chain-preflight.json`。当链路被阻断时，它会给出下一步动作和推荐命令，例如先跑 P1 acceptance、paper replay、pre-live 或 readiness 聚合。

核心服务也会通过 `GET /api/p2/manifest-chain/preflight/latest` 回读这份 `data/p2-chain-preflight.json`，并把它投影为 `aiqt.p2ManifestChainPreflightStatus`。Execution 工作区会显示四段 manifest 链路、当前第一个阻断点和推荐命令；缺失或无效的 preflight 只会作为操作员待处理状态展示，不会启动 Docker、不创建证据、不开启下单或实盘交易。

Execution 工作区的“生成预检”按钮会调用 `POST /api/p2/manifest-chain/preflight`，让核心服务在当前数据目录内重新写出 `data/p2-chain-preflight.json` 并立即返回校验后的状态，同时记录一条 `p2_manifest_chain_preflight` 审计事件。事件 metadata 会保存 stage 覆盖、阻断项、下一步动作、manifest sha256 和安全字段，页面会显示返回的审计事件 id；点击面板里的“审计”会切到 Audit 工作区并写入确定性查询，直接定位这条 preflight 事件。Audit 报告台账也能搜索这类事件，但它是只读操作员辅助证据，不进入签名链。这个接口只读取和校验已经存在的 P1/P2 manifest，不运行 Docker、不补造缺失证据、不连接券商、不提交订单，仍强制 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`、`liveOrderSubmitted=false` 和 `routeExecuted=false`。

刷新页面或跨工作区导航后，Execution 的 P2 manifest 链路预检面板也会从 Audit 报告台账回填当前 readback 上下文匹配的 `p2_manifest_chain_preflight` 事件 id，并标出来源是“本次响应”还是“台账回填”。匹配会检查 source path、状态、stage 计数、下一步动作和 blocker ids，并复用 primitive-safe token 规则；旧响应或旧台账行如果属于不同阻断阶段，不会抢占当前预检状态。该逻辑只改善已有 preflight 审计事件定位，不生成 manifest、不连接券商、不提交订单、不签名，也不放宽 live-blocked 边界。

Audit 工作区现在也有独立的 “P2 manifest 链路预检复核” 面板，可以把当前 `data/p2-chain-preflight.json` 的 readback 投影成 Markdown，复制、下载或记录为 `p2_manifest_chain_preflight_review` 审计事件。该事件只保存文件名、内容 SHA-256、stage 覆盖、blockers、下一步命令和 live-blocked 边界 metadata，不保存 Markdown 正文；Audit 台账能搜索并定位这类 review 行，但签名、验签和撤销仍保持禁用。这个复核入口只用于人工留档和异步复核，不重新生成 manifest、不运行 Docker、不连接券商、不提交订单，也不放宽 `orderSubmissionEnabled=false` / `liveTradingAllowed=false`。

Execution 的 P2 证据覆盖矩阵现在也会把当前 manifest 链路预检复核作为第 7 项 readiness claim：如果当前 `data/p2-chain-preflight.json` 已有匹配的 `p2_manifest_chain_preflight_review` 台账行，会显示 `Review audited · <short hash>`；如果还没有人工复核入账，则该行显示缺失并让 P2 coverage 从 7/7 降为 6/7。这个覆盖项只要求人工复核证据可追踪，不会自动写 review、不修改 manifest、不签名、不提交订单，也不改变 live-blocked 边界。

Execution 的 P2 证据覆盖矩阵现在还为 audit-backed 行提供行级审计入口：Operator runbook audit 和 P2 preflight review 行会显示紧凑“审计 / Audit”按钮，点击后切换到 Audit 工作区并写入对应稳定查询，直接定位当前 readiness claim 背后的台账证据。该入口只恢复只读审计上下文，不自动记录 review、不重新生成 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Execution 的 P2 证据覆盖矩阵现在进一步把每条 readiness claim 都做成可继续追踪的行级入口：manifest 行会显示“清单 / Manifest”，本地状态行显示“工作区 / Workspace”，safety boundary 行显示“边界 / Boundary”，点击后切到对应工作区并给出证据定位状态；audit 行仍复用稳定 Audit 查询。这个导航只帮助操作者从总览进入证据面板，不生成缺失证据、不改变台账、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 工作区现在也有“P2 证据覆盖复核”面板，可以把当前 7 条 readiness claim 的 coverage matrix 生成 Markdown、复制、下载或入账为 `p2_readiness_evidence_coverage_review`。该事件只保存 Markdown sha256、文件名、覆盖状态、row ids/statuses、source types/source ids 和强制 live-blocked 边界；Audit 台账可按这些 token 搜索并从面板“审计”按钮定位。它只是便携复核材料，不重新生成任何 manifest、不签名、不提交订单，也不放宽 `orderSubmissionEnabled=false` / `liveTradingAllowed=false`。

刷新页面或重新进入 Audit 工作区后，“P2 证据覆盖复核”也会按当前 coverage matrix 的状态、covered/total、row ids、row statuses、source types 和 source ids 从 Audit 报告台账回填匹配的 `p2_readiness_evidence_coverage_review` 事件 id；如果本次响应事件与当前 coverage 不一致，则会自动回落到匹配台账行或显示未定位。这个回填只避免旧复核或旧响应误占当前上下文，不生成新 review、不改写台账、不签名、不提交订单，也不改变 live-blocked 边界。

P2 顶层验收复核现在会引用当前匹配的 `p2_readiness_evidence_coverage_review` 事件 id：summary 的 `readiness-evidence-coverage` criterion 会把该 review id 当作 source，Markdown 复核包会在 Summary 和 Audit Evidence 中列出它，review audit event metadata 也会保存 `currentEvidenceCoverageReviewAuditEventId`。这个链路只让顶层验收复核能追溯到最新 coverage review，不自动生成 coverage review、不修改后端 readiness manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

刷新页面或重新进入 Audit 工作区后，P2 顶层验收复核的回填现在也会校验当前链接的 `p2_readiness_evidence_coverage_review` 事件 id。相同 run、market、symbol、timeframe 但引用旧 coverage review 的 `p2_readiness_acceptance_review` 行不会再抢占当前复核；本次响应事件如果引用的 coverage review 不一致，也会回落到匹配台账行或显示未定位。这个回填只提升既有 review 的定位准确性，不重新生成 coverage review 或 acceptance review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

P2 顶层验收复核面板现在还可以直接定位被引用的 coverage review：`p2_readiness_acceptance_review` 台账行会回读 `currentEvidenceCoverageReviewAuditEventId`，面板的“覆盖复核 / Coverage review”按钮会切到 Audit 工作区并写入 `p2_readiness_evidence_coverage_review <event id>` 查询；如果台账已回读到完整 coverage review 行，则复用更完整的 coverage review 查询。这个入口只恢复只读审计上下文，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

P2 证据覆盖复核面板现在也能反向定位引用它的顶层验收复核：面板的“顶层复核 / Acceptance review”按钮会查找 `currentEvidenceCoverageReviewAuditEventId` 指向当前 coverage review 的 `p2_readiness_acceptance_review` 台账行，并写入完整 acceptance review 查询；如果尚未回读到匹配行，则降级为 `p2_readiness_acceptance_review <coverage review id>` 查询。这个入口只恢复只读审计上下文，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 报告台账中的 `p2_readiness_acceptance_review` 行现在也会直接显示 linked coverage review：台账模型新增 `p2ReadinessAcceptanceCoverageReviewLinkLabel` 和 `p2ReadinessAcceptanceCoverageReviewLinkQuery`，行内会显示“覆盖复核 / Coverage review”标签，并提供“定位覆盖复核 / Focus coverage review”和“复制覆盖复核链接 / Copy coverage link”动作。这个台账级入口只是把已存在的 `currentEvidenceCoverageReviewAuditEventId` 变成可见、可复制、可搜索的只读链接，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 报告台账中的 `p2_readiness_evidence_coverage_review` 行现在也会反向显示引用它的顶层验收复核：台账模型会在构造完成后用 acceptance review 行的 `currentEvidenceCoverageReviewAuditEventId` 回填 `p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel` 和 `p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery`，行内显示“顶层复核 / Acceptance review”标签，并提供“定位顶层复核 / Focus acceptance review”和“复制顶层复核链接 / Copy acceptance link”动作。这个反向入口只提升既有审计链路可见性，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 报告台账顶部现在也会显示最新 P2 复核链：`buildAuditEvidenceReportLedgerSummary` 会选取最新带 `currentEvidenceCoverageReviewAuditEventId` 的 `p2_readiness_acceptance_review` 行，暴露 `latestP2ReadinessLinkedAcceptanceReview*` 和 `latestP2ReadinessLinkedCoverageReview*` summary 字段。Toolbar 的“P2 复核链 / P2 review chain”入口可一键定位或复制顶层复核与 coverage review 查询。这个 summary 入口只聚合既有只读审计链路，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

“P2 复核链 / P2 review chain”入口现在还提供组合查询：`buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery` 会用顶层复核事件 id 和被引用的 coverage review 事件 id 生成短查询，Audit 台账可一次筛出同一条链路中的两行。Toolbar 的“定位复核链 / Focus review chain”和“复制复核链链接 / Copy review chain link”只复用已回填到两行中的 event id，不创建新审计事件、不改变 signing eligible 规则、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 还会统计当前分页内的全部 P2 复核链：`buildAuditEvidenceReportLedgerSummary` 会计算已链接 coverage review 的 ready `p2_readiness_acceptance_review` 行数，并暴露 `p2ReadinessReviewChainCount` 与 `p2ReadinessReviewChainsQuery`。Acceptance review 行和被反向回填的 coverage review 行都会带上 `linked review chain` 搜索 token，因此 Toolbar 的“定位全部复核链 / Focus all chains”和“复制全部复核链链接 / Copy all chains link”可以一次筛出当前页所有链路行。这个入口仍只读，不记录新 review、不改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账行现在也会显示整条 P2 复核链：linked acceptance review 行与反向回填的 coverage review 行都会暴露 `p2ReadinessReviewChainLabel` 和 `p2ReadinessReviewChainQuery`，行内显示“整条复核链 / Review chain”，并提供“定位整条复核链 / Focus row chain”和“复制整条复核链链接 / Copy row chain link”。这个行级入口只复用已存在的两个 event id 做只读筛选，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账现在还会诊断 P2 复核链是否在当前页完整加载：linked acceptance review 行会标记 `p2ReadinessReviewChainCoverageLoaded`，并暴露 `p2ReadinessReviewChainStatusLabel/Query`。如果它引用的 `p2_readiness_evidence_coverage_review` 行不在当前 ledger rows 中，行内会显示“复核链缺 coverage / Review chain missing coverage”，Toolbar 会统计“复核链缺口 / Chain gaps”并提供 `review-chain-coverage-missing` 的 focus/copy 入口。这个诊断只说明当前页缺少已引用的 coverage row，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账的 P2 复核链诊断现在也会反向发现 orphan coverage review：`p2_readiness_evidence_coverage_review` 行如果没有任何当前页 `p2_readiness_acceptance_review` 引用，会标记 `p2ReadinessReviewChainAcceptanceLoaded=false`，行内显示“复核链缺顶层复核 / Review chain missing acceptance”，Toolbar 会统计“缺顶层复核 / Missing acceptance”并提供 `review-chain-acceptance-missing` 的 focus/copy 入口。全部已链接复核链 summary 查询也收紧为单 token `linked-review-chain`，避免缺口状态和 run id 子串误命中。该能力仍只诊断既有审计行，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账还提供一个 P2 复核链缺口总入口：任意缺 coverage 或缺顶层复核的 row 都会在 `p2ReadinessReviewChainStatusQuery` 中带上 `review-chain-gap`，summary 新增 `p2ReadinessReviewChainGapCount` 和 `p2ReadinessReviewChainGapsQuery`。Toolbar 的“全部复核链缺口 / All chain gaps”可以一次筛出当前页全部不闭环行，同时保留 `review-chain-coverage-missing` 和 `review-chain-acceptance-missing` 两个细分查询。该入口只聚合只读诊断，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账行级操作现在也支持 P2 复核链状态查询：任何带 `p2ReadinessReviewChainStatusQuery` 的 row 都会显示“定位复核链状态 / Focus chain status”和“复制复核链状态链接 / Copy chain status link”。这让 loaded、缺 coverage、缺顶层复核、全部缺口等状态可以从单行直接筛选或复制，不必回到 toolbar。该入口仍只复用已计算的只读状态 query，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 现在还会突出最新一个 P2 复核链缺口：`buildAuditEvidenceReportLedgerSummary` 会在缺 coverage 与缺顶层复核的 row 中按 `createdAt` 选出最新缺口，暴露 `latestP2ReadinessReviewChainGapEventId/Label/Query`。Toolbar 的“最新缺口 / Latest gap”会显示对应 event id，并提供“定位最新复核链缺口 / Focus latest chain gap”和“复制最新复核链缺口链接 / Copy latest chain gap link”。该入口仍只复用既有只读诊断 query，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 现在还会给 P2 复核链一个自适应健康入口：`buildAuditEvidenceReportLedgerSummary` 新增 `p2ReadinessReviewChainHealthState/Label/Query`。如果当前页存在缺 coverage 或缺顶层复核，健康状态为 `gaps` 并指向 `review-chain-gap`；如果没有缺口但有完整链路，健康状态为 `loaded` 并指向 `review-chain-loaded`；没有链路时保持 `empty`。Toolbar 的“复核链健康 / Chain health”可一键定位或复制当前页最需要查看的健康查询。该入口只复用既有 status token，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 还新增了 P2 复核链健康上下文查询：`filterAuditEvidenceReportLedgerRows` 会为任何带 `p2ReadinessReviewChainStatusQuery` 的 row 派生 `review-chain-health` 搜索 token，summary 暴露 `p2ReadinessReviewChainHealthContextCount/Query`。Toolbar 的“健康上下文 / Health context”可一次筛出当前页所有 loaded 与 gap 状态行，包括 orphan coverage review。该入口不把 token 写回账本 row，也不改变 row-level status query，只提供只读过滤，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

如需做严格的干净数据库验收，可先启动第二个全新实例，再把导入目标传给底层 smoke helper：

```powershell
npm run docker:smoke -- --no-build --p0-acceptance --p0-import-check --p0-import-base-url http://127.0.0.1:5174
```

该 JSON 文件会记录 P0 run id、标的、周期、导入目标、每个验收步骤和 `paperOnly=true / liveTradingAllowed=false` 边界，用于复核本次部署是否跑通过 P0 闭环；它不是交易建议，也不代表实盘许可。

运行中的核心服务也可以读取这份本地验收产物：

```powershell
curl http://127.0.0.1:5173/api/p0/acceptance/latest
```

该端点默认读取 `data/p0-acceptance.json`，返回 `passed / missing / invalid` 三种状态。缺失或非法 manifest 不会被当成成功；如果 manifest 试图打开 `liveTradingAllowed` 或破坏 live-blocked 边界，平台会标记为 `invalid`，但仍不会放开实盘路由。

主工作台的 P0 readiness 区域会同步读取同一份本地验收产物，显示通过、缺失或无效状态，并提供“刷新验收”和跳转 Audit 复核的动作。这个卡片只用于产品验收证据回读：缺失或无效时会提示处理，验收通过时也仍保持 `liveTradingAllowed=false` 的模拟优先边界。

Audit 工作区也会显示同一份 P0 验收复核面板，列出 manifest 来源、run id、市场上下文、检查项和 live-blocked 边界。它用于复核本地部署是否跑通过 P0 闭环，不会执行真实交易，也不会把验收通过解释为实盘授权。该面板可以复制或下载 Markdown 复核材料，也可以将复核结果写入 Audit 账本为 `p0_acceptance_review` 事件，用于个人留档、小团队异步复核和后续证据搜索。

访问：

```powershell
http://127.0.0.1:5173/
http://127.0.0.1:5173/health
```

常用配置：

```powershell
$env:AIQT_WEB_PORT="5173"
$env:FINNHUB_API_KEY="your_finnhub_key"
$env:CCXT_DEFAULT_EXCHANGE="binance"
docker compose up --build
```

如果希望镜像内安装 AKShare、yfinance、ccxt 这类可选数据源依赖：

```powershell
$env:INSTALL_DATA_DEPS="true"
docker compose build api
docker compose up
```

ccxt sandbox/testnet 健康检查只读取环境变量是否存在，不会把密钥值返回给浏览器。通用变量和交易所前缀变量都支持：

```powershell
$env:INSTALL_DATA_DEPS="true"
$env:CCXT_DEFAULT_EXCHANGE="binance"
$env:CCXT_BINANCE_API_KEY="your_testnet_key"
$env:CCXT_BINANCE_SECRET="your_testnet_secret"
$env:CCXT_TIMEOUT="10000"
docker compose up --build
```

如果未安装 `ccxt` 或未配置测试网 key，Settings 会显示 blocked/review；这属于安全状态，不代表实盘可用。

停止服务但保留 SQLite 数据卷：

```powershell
docker compose down
```

停止并删除数据卷：

```powershell
docker compose down -v
```

## Continuous Integration

`.github/workflows/ci.yml` 会在 push 和 pull request 时运行同一套质量门禁：`npm ci`、`npm test`、`npm run build`、`docker compose config`、`docker compose build`，然后通过 `npm run docker:smoke -- --no-build --down` 验证容器化部署可以启动并通过 `/health`、`/`、`/api/workspace` 自检。

CI 还会运行 `npm run docker:smoke:p0 -- --no-build --down`，把 P0 策略流水线、AI 评审、纸面模拟、导出、导入和重导出作为产品验收门禁，并上传 `data/p0-acceptance.json` 为 `p0-acceptance-manifest` artifact。

CI 同时运行 `npm run docker:smoke:p1 -- --no-build --down`，把自选列表刷新、queue-ready 审计 run、AI 评审、paper-only 模拟、导出/导入和 watchlist refresh provenance 作为 P1 研究运营验收门禁，并上传 `data/p1-acceptance.json`。本地服务会通过 `/api/p1/acceptance/latest` 将同一份 artifact 投影成产品状态，便于工作台直接显示 P1 验收是否可复核。

归档产物会再通过 `npm run docker:smoke:p0:validate` 和 `npm run docker:smoke:p1:validate` 离线复核。校验会拒绝缺少核心检查、开启实盘边界或检查数量不一致的 manifest。P2 readiness manifest 生成后也可以用 `npm run docker:smoke:p2:validate` 离线复核；它依赖已归档的 P1/P2 上游证据，目前不作为默认 CI 生成步骤。

实时报价可选配置：

```powershell
FINNHUB_API_KEY=your_finnhub_key
CCXT_DEFAULT_EXCHANGE=binance
```

桌面端开发：

```powershell
npm run desktop:dev
```

桌面端打包：

```powershell
npm run desktop:build
```

## Product Boundary

产品目标是全功能量化交易平台，但实盘执行必须分阶段解锁。当前版本聚焦行情、研究、回测、AI 评审、组合风控雏形和模拟交易，不连接真实 A 股券商账户。交易工作区默认 `paper_only`，自动化交易能力通过 `ExecutionAdapter` 风格的接口预留；只有在合法券商接口明确、适配器认证通过、风控审批通过、用户人工确认后，才允许接入实盘适配器。

## Data Policy

- 日线：作为跨 A 股、美股、加密货币的默认研究粒度。
- 分钟线：采用“免费源近期窗口 + 本地缓存持续沉淀”的策略。
- API Key：无 Key 数据源用于快速体验，有 Key 数据源通过 `.env` 或本地配置增强稳定性和覆盖范围。

## Safety

AI 研究助手只解释已传入的策略和回测结果，不承诺收益，不直接替用户做投资决策。模拟执行会保留拒单原因、订单状态和账户快照，后续实盘接入必须经过风控检查。
