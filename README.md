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
Execution 同时显示 P2 证据覆盖矩阵，把 replay manifest、P2 acceptance manifest、operator runbook audit、pre-live checklist、adapter chain 和 safety boundary 汇总为 6 条 readiness 声明，标记 covered、missing、stale 或 blocked。它只证明证据是否可追溯，仍固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`。
Execution 还会在证据矩阵上方显示 P2 顶层验收门禁，把 P1 acceptance、纸面回放、预实盘清单、P2 manifest、证据覆盖和 live-blocked 边界映射为 6 项验收定义。全部通过也只代表预实盘材料可复核，不代表真实下单或券商路由已开启。
核心服务还会通过 `GET /api/p2/readiness/acceptance/latest` 回读本地 `data/p2-readiness-acceptance.json`，把顶层验收 artifact 投影为 `accepted / missing / invalid` 三态。Execution 的 P2 顶层门禁会显示该 manifest 的来源、run id、验收项数量、coverage 状态和 live-blocked 边界；任何 artifact 试图开启下单、实盘交易、实盘订单提交或真实路由执行都会被标记为无效，平台仍保持 paper-only。
Audit 工作区也会显示同一份 P2 顶层验收复核面板，并可复制、下载或入账 Markdown 复核备注。入账会写入 `p2_readiness_acceptance_review` 审计事件，只保存 Markdown sha256、文件名、manifest 状态、来源、run id、criteria、上游 manifest、审计事件和强制 live-blocked 边界，不把完整正文塞进账本；Audit 报告台账也能搜索这类事件。它是审计复核材料，不是实盘授权。

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

`docker:smoke:p2:preflight` 不启动容器，只检查 `data/p1-acceptance.json`、`data/p2-paper-replay.json`、`data/p2-pre-live-acceptance.json` 和 `data/p2-readiness-acceptance.json` 是否存在且通过各自严格校验，并写出 `data/p2-chain-preflight.json`。当链路被阻断时，它会给出下一步动作和推荐命令，例如先跑 P1 acceptance、paper replay、pre-live 或 readiness 聚合。

核心服务也会通过 `GET /api/p2/manifest-chain/preflight/latest` 回读这份 `data/p2-chain-preflight.json`，并把它投影为 `aiqt.p2ManifestChainPreflightStatus`。Execution 工作区会显示四段 manifest 链路、当前第一个阻断点和推荐命令；缺失或无效的 preflight 只会作为操作员待处理状态展示，不会启动 Docker、不创建证据、不开启下单或实盘交易。

Execution 工作区的“生成预检”按钮会调用 `POST /api/p2/manifest-chain/preflight`，让核心服务在当前数据目录内重新写出 `data/p2-chain-preflight.json` 并立即返回校验后的状态，同时记录一条 `p2_manifest_chain_preflight` 审计事件。事件 metadata 会保存 stage 覆盖、阻断项、下一步动作、manifest sha256 和安全字段，页面会显示返回的审计事件 id；点击面板里的“审计”会切到 Audit 工作区并写入确定性查询，直接定位这条 preflight 事件。Audit 报告台账也能搜索这类事件，但它是只读操作员辅助证据，不进入签名链。这个接口只读取和校验已经存在的 P1/P2 manifest，不运行 Docker、不补造缺失证据、不连接券商、不提交订单，仍强制 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`、`liveOrderSubmitted=false` 和 `routeExecuted=false`。

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
