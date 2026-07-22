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
- AI 研究笔记草稿：研究工作台可选择本地基线或已配置的外部 Provider 生成中文结构化草稿；外部模式每次都要明确授权，且只发送市场、标的、周期和行情派生摘要，不发送原始 K 线或已有笔记。外部模型采用真实上游流，原始 JSON token 只在核心服务内解析；通过协议、上下文、长度和禁止交易语义检查的累计 Markdown 草稿直接写入同一个研究笔记编辑框，不再显示第二份预览。生成期间禁止保存；完成后仍会执行完整 schema、中文、证据引用和 Provider 身份校验，失败、断流或上下文变化时恢复生成前内容。OpenAI-compatible 的流式请求使用携带完整 schema 的 `json_object`，避免部分兼容网关在严格 `json_schema` 模式下缓冲完整答案；一次性 AI 评审继续使用严格 `json_schema`。
- AI 策略帮写：策略工坊复用同一组 `local/openai/openai-compatible/ollama` Provider，按当前市场、标的、周期、目标和结构化草稿生成可编辑候选，并同时给出 3 至 6 条中文“为什么这样编写”。外部模式每次都要明确授权；服务端严格校验字段、范围、中文原因、Provider 身份和禁止交易语义。候选会逐项展示“当前草稿 → AI 候选”的完整参数差异，必须人工点击应用，且不会自动保存、回测、绑定审计或提交委托；标的、周期或草稿变化会使旧候选失效，关闭弹窗会取消请求，45 秒未完成会自动超时。外部失败时不会应用或覆盖当前草稿。
- 周期粒度切换：顶部 `1d / 1m / 5m / 15m / 30m / 60m` 控件会改变研究周期，Pipeline 按当前标的和周期运行。
- 多语言：`apps/web/src/lib/i18n.ts` 提供 `zh-CN / en-US` 语言包，默认中文，顶部语言控件可切换。
- 实时报价：参考 QuantDinger 的 REST quote + watchlist cache 方法，A 股走腾讯 quote，美股优先 Finnhub 并降级 yfinance，加密货币走 ccxt ticker，API 暴露 `/api/market/quotes`。
- 实盘图表：参考 QuantDinger 的 `/api/kline` + `klinecharts` 方法，前端图表从 `/api/market/klines` 拉取 OHLCV；A 股优先腾讯/东方财富并降级到正式 AKShare adapter，美股优先 Yahoo chart 并降级到正式 yfinance adapter，加密货币优先 Binance/Coinbase REST 并降级到正式 ccxt adapter。
- 行情适配器状态：`GET /api/settings/status` 会把 AKShare、yfinance 和 ccxt 的公开 OHLCV adapter、能力、周期覆盖、Key 需求、缓存 scope 和按市场聚合的缓存诊断暴露给 Settings 页面；该状态只读且不返回任何密钥值。
- ccxt sandbox 健康检查：`GET /api/execution/adapter-health/ccxt-sandbox` 会在只读模式下检查 ccxt sandbox/testnet 的 `set_sandbox_mode(true)`、markets、status/time 和可选账户同步；Settings 页面会显示检查结果。该能力不下单、不撤单、不写密钥、不启用实盘。

## 统一终端 UI

Web 与 Tauri 桌面端共用同一套量化终端外壳，默认使用深色模式。当前已完成 UI 验收的行情中心可以从左侧身份区切换浅色模式，选择会在本地持久化，K 线图也会同步切换主题；其余工作区在逐页重构确认前继续保持深色，避免出现未经验收的明暗混搭。左侧导航按“市场与研究、决策与验证、组合与执行、治理与系统”组织九个既有工作区；每个工作区都有与 Figma 对应的独立主任务布局，不再只是把同一组通用卡片换标题。顶部保留标的、周期、语言和流水线操作；底部状态条持续显示数据、模型、Paper Broker、审计与“实盘已阻断”。顶栏不展示没有真实数据源的通知角标或重复账户头像；通知和告警仍属于 P4 运维阶段。

品牌图使用 `apps/web/public/aiqt-logo.png`，桌面应用图标同步为 `apps/web/src-tauri/icons/icon.png`。行情和研究图表继续读取现有行情与运行数据，行情图复用当前 klinecharts 实例增加 MACD 副图；页面没有伪造设计图中的示例行数。375px 宽度下内容改为单列并保持底部导航可用。UI 重构没有复制业务模型或 API，仍复用现有工作区、store、构建器和安全边界。设计验收见 [design-qa.md](design-qa.md)。

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

`docker:smoke:p1` 会读取 `/api/workspace` 的自选列表，要求至少 3 个标的，并按工作区顺序固定取前三个作为验收样本运行 watchlist cache refresh；这避免产品自选增长无界增加 CI 外部请求量，不限制用户保存或手动刷新的完整自选列表。验收随后选择一只刷新成功的 queue-ready 标的运行审计流水线、AI 评审、paper-only 模拟、P2 replay seed 组合证据、研究包导出、复现包导入和导入后重导出，并把结果写入 `data/p1-acceptance.json`。该 manifest 会记录 `watchlistRefreshRunId`、queued symbol、`p2-replay-seed` 检查步骤和 `paperOnly=true / liveTradingAllowed=false` 边界，用于证明 P1 研究运营链路可复现，并为后续 P2 paper replay 准备组合委托、审批、模拟成交和 adapter paper execution 证据；它同样不会触发真实下单。工作台会通过 `GET /api/p1/acceptance/latest` 读取这份报告，并在 P1 研究运营验收卡显示 watchlist 数量、队列标的、检查覆盖和来源路径。

```powershell
npm run docker:smoke:p1:validate
```

## Stage 9 已完成并进入维护

Stage 9 交付生产委托准入准备，不交付生产执行。它从同一条 Stage 4 workflow、已完成终态对账的 Stage 6 批次和当前 Stage 8 continuity 生成 10 分钟一次性候选，固定只覆盖 Binance Spot 的 `BTC/USDT`、`ETH/USDT`、1–2 笔 GTC 限价单、单笔不超过 10 USDT、批次不超过 20 USDT。候选生成和一次不可改写的具名人工复核都会重新检查生产市场精度/最小值、30 秒报价新鲜度、1% 逆向价格偏离和候选资金充分性；不会自动改价、缩量或拆单。

候选与复核写入现有 `AuditEventStore` 并随研究包导出；候选携带经既有 validator 校验且必须等于 canonical 重建结果的 Stage 8 continuity 来源快照与 hash，导入时重验完整来源链和 SHA-256 后标记 detached。Audit 工作区提供候选/复核专属只读行并明确标识 detached，Execution 不会把导入副本恢复为权威；页面静置超过 10 分钟也会自动移除过期候选的复核入口。Stage 9 急停直接复用 Stage 8 revoke；批准复核仍固定 `authorizationEffective=false`。

```powershell
npm run docker:smoke:stage9
npm run docker:smoke:stage9:validate
```

默认 Docker 门禁不读取生产凭据、不访问真实生产网络，验证无凭据 API 失败前后零制品、两笔 deterministic-ready 候选、非生效复核、规则漂移、陈旧报价、不利价格、资金不足、连续性漂移、候选过期、Stage 8 revoke 网络前阻断、候选/复核重复请求幂等、detached 阻断和 API 重启精确回读；线程化回归测试另行覆盖并发幂等。Stage 4→9 准入权威链只能由专用 API 写入，通用审计入口不能创建、预占或覆盖权威事件，研究包也不能恢复 Stage 7 probe 或 Stage 8 control；回读会重验事件绑定。可选 real-readonly 门禁只接受 ready 或纯资金不足安全阻断，并用实际 CCXT 调用守卫及重启回读证明只读边界。2026-07-14 最新 accepted manifest hash 为 `d3c53eccd6e3689ddfde808dca1b1d68f90abda4af62268b7fd60347248605c3`，报告文件 SHA-256 为 `ac01b186bac1cc0223cca17494f854ef683011e80170582bf9b2f862356a94f5`。完整操作见 [docs/stage9-production-order-admission-operations.md](docs/stage9-production-order-admission-operations.md)。本阶段没有生产订单创建、查询、撤销、同步、成交、转账或提现 API，也不使用生产交易 Key 或要求生产账户入金。

前端产品阶段模型现已同步到 Stage 9：Stage 0 至 Stage 9 全部显示为 maintenance，Execution 归属最新已交付的 Stage 9，当前不显示任何 `current` 阶段。后续受限生产试单必须重新完成独立设计、人工授权和真实资金安全验收。

## Stage 8 已完成并进入维护

Stage 8 复用 Stage 7 probe、production route review 与 `AuditEventStore`，提供 `current / stale / blocked / revoked / missing` 生产只读连续性状态和持久化人工 `revoke / restore`。revoke 不依赖外部证据，并在 Stage 7 构造 CCXT 生产连接前阻断；restore 必须绑定最近 24 小时内有效的 `ccxt-live + crypto + live` route review。没有后台轮询器，也不会自动修改 Binance Key。

Execution 复用 Stage 7 卡片显示 probe 新鲜度、route review、权限漂移、到期时间和 access-control hash。Stage 8 控制只属于当前 API 数据卷，不通过研究包导入恢复；历史 Stage 7 probe 保留为审计事实，过期只改变当前连续性状态。

```powershell
npm run docker:smoke:stage8
npm run docker:smoke:stage8:validate
```

2026-07-13 Docker acceptance 已验证人工 revoke、Stage 7 生产网络前阻断、缺 route review 的 restore 拒绝、API 重启 hash 精确回读和全部 live-blocked 边界，manifest SHA-256 为 `65702de501a8cddfb5a02ca698e77323eeef9b0ddfa3c9fc33dc32f96ddaf60e`。完整操作见 [docs/stage8-production-readonly-continuity-operations.md](docs/stage8-production-readonly-continuity-operations.md)。Stage 8 不创建、查询、撤销或同步生产订单，不读取成交，不执行转账或提现。

人工真实恢复验收复用已配置的专用只读凭据、Stage 7 请求和对应数据卷：

```shell
COMPOSE_PROJECT_NAME=stage6-real-exit npm run docker:smoke:stage8:real -- --no-build
npm run docker:smoke:stage8:real:validate
```

2026-07-13 真实恢复验收已完成一次 `current → revoke → 网络前阻断 → restore → 新 probe → current → API 重启回读`：加载 4497 个 Binance Spot 市场，读取权限开启，全部 mutation 权限关闭，脱敏账户类型为 `SPOT`、非零资产数量为 0；恢复 probe 与 control 在重启后 hash 精确一致。真实恢复 manifest SHA-256 为 `8742af66d2dd6659e3114f82f1aec5a88c6df29e99d49ffa2cc1f229c6a04893`。

Stage 8 继续作为 Stage 9 的连续性与撤销权威；Stage 9 没有创建第二套访问控制或 kill switch。

## Stage 7 已完成并进入维护

Stage 7 只连接 Binance Spot 生产环境的市场元数据、API Key 权限接口和脱敏账户摘要，不创建、查询或撤销生产订单。服务端只读取独立的 `CCXT_PRODUCTION_READONLY_API_KEY` 与 `CCXT_PRODUCTION_READONLY_SECRET`，不会回退到 Sandbox 或通用 CCXT 变量；读取账户前必须确认读取权限开启，Spot/Margin/Futures/Options 交易、提现和内部/通用划转权限全部明确为关闭。

Execution 工作区提供唯一“运行生产只读准入”动作。POST 会绑定已接受的 Stage 6 退出清单、既有 `ccxt-live` production route review 和操作者资格确认；GET 从 `AuditEventStore` 回读并重验 canonical SHA-256。页面、响应、审计和验收清单只显示权限布尔值、市场数量、账户类型和非零资产数量，不显示资产名称、余额或交易所原始响应。

```powershell
# 默认 CI：无生产凭据，必须在网络连接前确定性 fail closed
npm run docker:smoke:stage7 -- --no-build
npm run docker:smoke:stage7:validate

# 人工环境：配置专用只读 Key，并准备权威 route review 请求后执行
npm run docker:smoke:stage7:real -- --no-build
npm run docker:smoke:stage7:real:validate
```

Stage 7 已于 2026-07-13 完成真实生产只读退出验收：加载 4497 个 Binance Spot 生产市场，确认读取权限开启且 Spot/Margin/Futures/Options 交易、提现、内部/通用划转权限全部关闭，仅回读 `SPOT` 账户类型和非零资产数量 0；API 重启后的 evidence hash 与首次探针一致。真实 manifest SHA-256 为 `5eba10c5549e64a4fa12b727c648a96bb66416b25672d32a17042b482895bd6c`。Stage 7 现转入 maintenance；完整配置、失败处理、轮换与撤销步骤见 [docs/stage7-production-readonly-operations.md](docs/stage7-production-readonly-operations.md)。所有生产委托字段继续固定为 false，`liveBlockedBoundary=true`；生产订单、成交、转账、提现和 live route 不在 Stage 7 范围内。

## Stage 6 已完成并进入维护

Stage 6 在 Execution 提供唯一 Sandbox 黄金路径：从同一条 Stage 4 workflow 与 Stage 5 已批准证据链生成规范化 GTC 限价单，进行 10 分钟批次授权，再提交、查询、撤单和事件驱动对账。实现只复用现有 `AuditEventStore`、Stage 4 风险限额和稳定 `clientOrderId`，固定 Binance Spot Testnet；不支持生产 endpoint、真实资金、Futures、杠杆、多交易所或手填委托。

API 服务的写路由只读取 `CCXT_SANDBOX_API_KEY` 与 `CCXT_SANDBOX_SECRET`，不回退到通用 CCXT 变量。无密钥 Docker 门禁必须 fail closed；真实 Testnet 验收只接收权威证据 ID，由运行中的 API 重建 10 分钟授权，并输出完全脱敏的终态清单：

```powershell
npm run docker:smoke:stage6
npm run docker:smoke:stage6:validate
# 人工发布环境：先按运维文档填写 data/stage6-sandbox-acceptance-request.json
npm run docker:smoke:stage6:real
npm run docker:smoke:stage6:real:validate
npm run docker:smoke:stage6:exit:validate
```

Stage 6 已于 2026-07-13 通过真实 Binance Spot Testnet 退出验收：BTC/USDT 与 ETH/USDT 两笔 GTC 限价委托均完成创建、查询、撤销、终态对账、API 重启回读和 detached 导入回读，真实 manifest SHA-256 为 `096e5df28a48c7f7a6e99632622daacfd06da480c50b1f7daa83331492db884d`。Stage 6 现作为 Stage 9 候选的终态 Sandbox 权威来源；真实资金委托和 live route 继续不在范围内。完整操作见 [docs/stage6-sandbox-operations.md](docs/stage6-sandbox-operations.md)。所有实盘字段继续固定为 false，`liveBlockedBoundary=true`。

Stage 6 acceptance 的初次 Compose 启动和 API 重启现在复用同一份 30 秒健康等待，连接在 Web 容器启动期间被重置时会继续等待，而不是让单次 `/health` 探测误判发布失败；该等待不重试任何交易所或委托请求。

## Stage 5 已完成并进入维护

Stage 5 已完成 Shadow 故障演练、刷新/重启恢复、便携审计、Sandbox 准入决策、服务端权威只读探针、授权预检、不可变授权复核和 CI 发布门禁。顶层 `aiqt.stage5ExitAcceptance` 会把 Stage 3 deterministic baseline、Stage 4 权威组合输入与五份 Stage 5 安全证据收束为一个退出结论；API 和 Execution 从同一份清单回读 accepted/missing/invalid。Stage 5 现作为 Stage 6 Sandbox 执行的维护门禁。

```powershell
npm run docker:smoke:stage5 -- --no-build
npm run docker:smoke:stage5:validate
# 只运行/复核第四阶段准入门禁
npm run docker:smoke:stage5:readiness -- --no-build
npm run docker:smoke:stage5:readiness:validate
# 只运行/复核第五阶段无凭据 fail-closed 探针
npm run docker:smoke:stage5:readonly -- --no-build
npm run docker:smoke:stage5:readonly:validate
# 只运行/复核第六阶段无凭据授权预检阻断
npm run docker:smoke:stage5:authorization-preflight -- --no-build
npm run docker:smoke:stage5:authorization-preflight:validate
# 只运行/复核第七阶段无凭据授权复核阻断
npm run docker:smoke:stage5:authorization-review -- --no-build
npm run docker:smoke:stage5:authorization-review:validate
```

完整 Stage 5 命令会自行生成并验证 Stage 3、Stage 4、五份 Stage 5 链路 manifest 和 `data/stage5-exit-acceptance.json`，CI 统一上传八份 `stage5-release-manifests`。默认无凭据环境必须让只读探针、授权预检和授权复核 fail closed，成功 preflight 与 review 数量均为 0。配置明确的测试网凭据时，应用可以只读加载 markets/status/time 和脱敏账户同步，但仍不提交、撤销或查询订单，不开放 sandbox order route，更不开放真实资金路由。完整运维说明见 [docs/stage5-shadow-operations.md](docs/stage5-shadow-operations.md)。

## Stage 4 维护门禁：组合模拟黄金路径

Portfolio 工作区已经提供唯一的 Stage 4 组合模拟黄金路径：从至少两个同市场、同周期的已审计 research run 完成组合构建、确定性风控复核、人工审批、批量模拟成交和账户回放。页面每一步只保留一个主动作，刷新后从持久化批次、审批、模拟成交、状态历史、账户回放和权威工作流恢复，不依赖临时前端成功状态；Execution 继续展示逐单明细，Audit 负责归档与 hash 回读。2026-07-11 Stage 4 完成退出并转入 maintenance；2026-07-12 Stage 5 也已通过顶层退出验收并转入 maintenance。

权威工作流通过 `POST /api/portfolio/workflows` 入账。请求只包含 `baseRunId`、`name`、`initialCash`、`legs`、`riskTemplate`、`batchId` 和 `operator`；核心会从既有 stores 重新运行组合并读取批次、审批、模拟成交、状态历史与 replay，通过后写入一条 `stage4_portfolio_workflow` 审计事件。`GET /api/portfolio/workflows?baseRunId=...&limit=20` 按最新优先回读，并重新校验 workflow hash、审计事件身份、时间和完整 paper-only 证据。研究运行导出 manifest 用 `artifactCounts.stage4PortfolioWorkflows` 记录数量，导入预检会拒绝数量、身份、hash 或安全边界不一致；通过原子导入后再导出，可从 Audit 包浏览器回读同一 workflow hash。

Docker 完整链路会写出 `data/stage4-portfolio-paper.json`，其 kind 为 `aiqt.stage4PortfolioPaperAcceptance`；离线校验不启动容器：

```powershell
npm run docker:smoke:stage4 -- --no-build
npm run docker:smoke:stage4:validate
```

smoke 要求正好两个不同的 run/标的、完整风险检查、按批次顺序审批与成交、精确状态历史和账户回放，并重复提交同一批次证明不会产生第二笔成交；manifest 同时绑定 portfolio/workflow hash 和导出、导入、再回读的数量及 hash。缺少已审计 run、市场或周期不一致、非法权重、批次身份错配、审批/route-risk 不完整、重复或错绑成交、replay 不精确、归档数量或 hash 不一致都会确定性失败，已持久化的前序账本仍保留且不会补造后续成功。

真实浏览器验收已覆盖双标的 Portfolio 主路径、明确拒绝证据、审批/模拟/replay、刷新恢复、Audit 18/18 artifact 与 SHA-256 回读，以及 Portfolio/Audit 在 375px 下无横向溢出。全链始终固定五项安全边界：`paperOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`；没有真实券商连接、真实订单、订单提交或 live route 动作。

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

`docker:smoke:p2:paper-replay` 会先要求 `data/p1-acceptance.json` 包含 `p2-replay-seed` 检查，再从该 manifest 推导审计 run id，拉取 `/api/research/runs/{runId}/export`，并只在导出包已经包含 paper execution、组合 paper order、审批、模拟成交、状态回放和 adapter paper execution 证据时生成 `data/p2-paper-replay.json`。如果 P1 manifest 仍是旧的 8-check 报告，P2 chain preflight 会提前提示重跑 `npm run docker:smoke:p1 -- --no-build`；paper replay 本身不会补造缺失证据或触发真实下单。

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

Audit 报告台账中的 `p2_readiness_acceptance_review` 行现在也会直接显示 linked coverage review：台账模型新增 `p2ReadinessAcceptanceCoverageReviewLinkLabel` 和 `p2ReadinessAcceptanceCoverageReviewLinkQuery`，行内会显示“覆盖复核 / Coverage review”标签，并提供“定位覆盖复核 / Focus coverage review”和“复制覆盖复核链接 / Copy coverage link”动作。该查询会带上 `linked-coverage-review`、coverage review event id、来源 acceptance review event id 和 acceptance createdAt，让复制链接能说明这条 coverage 定位来自哪次顶层复核。这个台账级入口只是把已存在的 `currentEvidenceCoverageReviewAuditEventId` 变成可见、可复制、可搜索的只读链接，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 报告台账中的 `p2_readiness_evidence_coverage_review` 行现在也会反向显示引用它的顶层验收复核：台账模型会在构造完成后用 acceptance review 行的 `currentEvidenceCoverageReviewAuditEventId` 回填 `p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel` 和 `p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery`，行内显示“顶层复核 / Acceptance review”标签，并提供“定位顶层复核 / Focus acceptance review”和“复制顶层复核链接 / Copy acceptance link”动作。该查询会带上 `linked-acceptance-review`、顶层 acceptance review event id、coverage review event id 和 acceptance createdAt，让反向复制链接也保留来源链路语义。这个反向入口只提升既有审计链路可见性，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 报告台账顶部现在也会显示最新 P2 复核链：`buildAuditEvidenceReportLedgerSummary` 会选取最新带 `currentEvidenceCoverageReviewAuditEventId` 的 `p2_readiness_acceptance_review` 行，暴露 `latestP2ReadinessLinkedAcceptanceReview*` 和 `latestP2ReadinessLinkedCoverageReview*` summary 字段。Toolbar 的“P2 复核链 / P2 review chain”入口可一键定位或复制顶层复核与 coverage review 查询。这个 summary 入口只聚合既有只读审计链路，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

“P2 复核链 / P2 review chain”入口现在还提供组合查询：`buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery` 会用 `linked-review-chain`、顶层复核事件 id、被引用的 coverage review 事件 id 和顶层复核 createdAt 生成可解释查询，Audit 台账可一次筛出同一条链路中的两行。Toolbar 的“定位复核链 / Focus review chain”和“复制复核链链接 / Copy review chain link”只复用已回填到两行中的审计上下文，不创建新审计事件、不改变 signing eligible 规则、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 还会统计当前分页内的全部 P2 复核链：`buildAuditEvidenceReportLedgerSummary` 会计算已链接 coverage review 的 ready `p2_readiness_acceptance_review` 行数，并暴露 `p2ReadinessReviewChainCount` 与 `p2ReadinessReviewChainsQuery`。Acceptance review 行和被反向回填的 coverage review 行都会带上 `linked review chain` 搜索 token，因此 Toolbar 的“定位全部复核链 / Focus all chains”和“复制全部复核链链接 / Copy all chains link”可以一次筛出当前页所有链路行。这个入口仍只读，不记录新 review、不改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账行现在也会显示整条 P2 复核链：linked acceptance review 行与反向回填的 coverage review 行都会暴露 `p2ReadinessReviewChainLabel` 和 `p2ReadinessReviewChainQuery`，行内显示“整条复核链 / Review chain”，并提供“定位整条复核链 / Focus row chain”和“复制整条复核链链接 / Copy row chain link”。这个行级入口只复用已存在的两个 event id 做只读筛选，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账现在还会诊断 P2 复核链是否在当前页完整加载：linked acceptance review 行会标记 `p2ReadinessReviewChainCoverageLoaded`，并暴露 `p2ReadinessReviewChainStatusLabel/Query`。如果它引用的 `p2_readiness_evidence_coverage_review` 行不在当前 ledger rows 中，行内会显示“复核链缺 coverage / Review chain missing coverage”，Toolbar 会统计“复核链缺口 / Chain gaps”并提供 `review-chain-coverage-missing` 的 focus/copy 入口。状态查询现在还带 `review-chain-status`、相关 event id 和 createdAt，复制 loaded、缺 coverage 或缺顶层复核链接时能保留状态来源上下文。这个诊断只说明当前页缺少已引用的 coverage row，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账的 P2 复核链诊断现在也会反向发现 orphan coverage review：`p2_readiness_evidence_coverage_review` 行如果没有任何当前页 `p2_readiness_acceptance_review` 引用，会标记 `p2ReadinessReviewChainAcceptanceLoaded=false`，行内显示“复核链缺顶层复核 / Review chain missing acceptance”，Toolbar 会统计“缺顶层复核 / Missing acceptance”并提供 `review-chain-acceptance-missing` 的 focus/copy 入口。全部已链接复核链 summary 查询也收紧为单 token `linked-review-chain`，避免缺口状态和 run id 子串误命中。该能力仍只诊断既有审计行，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账还提供一个 P2 复核链缺口总入口：任意缺 coverage 或缺顶层复核的 row 都会在 `p2ReadinessReviewChainStatusQuery` 中带上 `review-chain-gap`，summary 新增 `p2ReadinessReviewChainGapCount` 和 `p2ReadinessReviewChainGapsQuery`。Toolbar 的“全部复核链缺口 / All chain gaps”可以一次筛出当前页全部不闭环行，同时保留 `review-chain-coverage-missing` 和 `review-chain-acceptance-missing` 两个细分查询。该入口只聚合只读诊断，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账行级操作现在也支持 P2 复核链状态查询：任何带 `p2ReadinessReviewChainStatusQuery` 的 row 都会显示“定位复核链状态 / Focus chain status”和“复制复核链状态链接 / Copy chain status link”。这让 loaded、缺 coverage、缺顶层复核、全部缺口等状态可以从单行直接筛选或复制，不必回到 toolbar。该入口仍只复用已计算的只读状态 query，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 现在还会突出最新一个 P2 复核链缺口：`buildAuditEvidenceReportLedgerSummary` 会在缺 coverage 与缺顶层复核的 row 中按 `createdAt` 选出最新缺口，暴露 `latestP2ReadinessReviewChainGapEventId/Label/Query`。Toolbar 的“最新缺口 / Latest gap”会显示对应 event id，并提供“定位最新复核链缺口 / Focus latest chain gap”和“复制最新复核链缺口链接 / Copy latest chain gap link”。该入口仍只复用既有只读诊断 query，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 现在还会给 P2 复核链一个自适应健康入口：`buildAuditEvidenceReportLedgerSummary` 新增 `p2ReadinessReviewChainHealthState/Label/Query/Title`。如果当前页存在缺 coverage 或缺顶层复核，健康状态为 `gaps` 并指向 `review-chain-health review-chain-gap`；如果没有缺口但有完整链路，健康状态为 `loaded` 并指向 `review-chain-health review-chain-loaded`；没有链路时保持 `empty`。Toolbar 的“复核链健康 / Chain health”可一键定位或复制当前页最需要查看的健康查询，同时 tooltip 会解释 state、query、context rows、loaded chains、gaps、missing coverage、missing acceptance 与最新缺口。该入口只复用既有 status/context token，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账 summary 还新增了 P2 复核链健康上下文查询：`filterAuditEvidenceReportLedgerRows` 会为任何带 `p2ReadinessReviewChainStatusQuery` 的 row 派生 `review-chain-health` 搜索 token，summary 暴露 `p2ReadinessReviewChainHealthContextCount/Query`。Toolbar 的“健康上下文 / Health context”可一次筛出当前页所有 loaded 与 gap 状态行，包括 orphan coverage review。该入口不把 token 写回账本 row，也不改变 row-level status query，只提供只读过滤，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账行级操作现在也支持 P2 复核链健康上下文：`AuditEvidenceReportLedgerRow` 新增 `p2ReadinessReviewChainHealthContextQuery`，任何 loaded 或 gap 状态行都会带 `review-chain-health`，行内提供“定位行复核链健康上下文 / Focus row chain health context”和“复制行复核链健康上下文链接 / Copy row chain health context link”。这个入口让操作者从任一状态行回到整页健康上下文，同时保留原始 row-level status query 的精确筛选语义；它仍只读，不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Audit 台账现在还会解释 P2 复核链健康上下文：`AuditEvidenceReportLedgerRow` 新增 `p2ReadinessReviewChainHealthContextTitle`，loaded、缺 coverage、缺顶层 acceptance 等状态行会带上对应的 `health-context-*` 说明；summary 新增 `p2ReadinessReviewChainHealthContextTitle`，在“健康上下文 / Health context” tooltip 中展示 context rows、loaded chains、gaps、missing coverage、missing acceptance 与最新缺口 event id 分解。该 title 也参与只读过滤，便于直接定位 `health-context-missing-acceptance` 等上下文行；它不记录新 review、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

首页现在也会把 P0/P1/P2/Audit 证据聚合成“个人/小团队可用性”摘要：`buildPersonalTeamUsabilityReadinessSummary` 会把 P0 本地纸面闭环、P1 研究运营、P2 预实盘证据链和 Audit 可追溯性折算为个人本地 paper-only readiness 与小团队 internal-beta readiness。团队交接 readiness 由当前审计 run 的本地 handoff notes 数量驱动；备份/恢复 readiness 由 P0/P1 acceptance 中的 `export`、`import`、`imported-export` round-trip 检查驱动。该摘要还可以复制、下载或入账为 `personal_team_readiness_review` 本地复核材料；`buildPersonalTeamUsabilityReadinessReviewReference` 会回读最新复核并标记为 current、stale 或 missing，首页可直接定位或复制对应 Audit 查询链接。复核事件只保存 Markdown SHA-256 和结构化 metadata，不存正文、不运行 Docker、不连接券商、不提交订单，仍固定 `Paper-only · live blocked · no order submission` 边界。

首页现在还新增了 Daily Ops 控制台：`buildDailyOpsControlRoomSummary` 会把 P0 completion 当前缺口、个人/小团队 readiness、最新 Audit 查询和备份/交接状态压成 4 条每日操作队列。主动作会把操作者带到当前最需要处理的工作区，审计动作会写入 `auditReportQuery` 并切到 Audit 只读定位；复制链接复用既有 Audit 查询深链。Daily Ops 还会携带 `auditQueryTitle`，因此 P2 复核链健康查询的 state、query、缺口和最新 gap 解释会进入队列 detail、Markdown、复核 metadata 与 Audit 搜索。这个控制台还可以复制、下载或入账为 `daily_ops_control_room_review` 本地复核材料；复核事件只保存 Markdown SHA-256、队列状态、打开项、主动作、审计查询说明和强制 live-blocked metadata，不存正文。首页会用 `buildDailyOpsControlRoomReviewReference` 回读最新 Daily Ops 复核，标记为 current、stale 或 missing，并提供定位/复制对应 Audit 查询链接；整个链路不运行流水线、不提交订单，也不放宽 live-blocked 边界。

首页现在还会在个人/小团队 readiness 与 Daily Ops 控制台前显示“今日启动摘要 / Daily Start”：`buildDailyStartBrief` 会把 Daily Ops 队列、个人/小团队可用性、个人/团队复核引用和 Daily Ops 复核引用压成一个主动作、一个审计入口和一个本地复核入口，并把两类本地复核标成 current、stale 或 missing。Daily Start 还会继承 Daily Ops 的 `auditQueryTitle`，因此 P2 复核链健康解释会继续进入启动摘要、checkpoint tooltip/Markdown、daily_start_brief_review metadata、Audit ledger row/search/query 与 current/stale 判断。这样操作者打开首页就能先看到今天该继续 AI 评审、补交接/备份，还是先入账本地复核；该摘要只复用现有导航和只读 Audit 查询，不自动运行 P0 action、不新建复核、不修改账本、不签名、不连接券商、不提交订单。

首页现在还新增了 Stage 1/P0 日常使用收口卡：`buildStage1P0DailyUseClosure` 会把干净环境 P0/P1 验收、行情刷新失败恢复、研究上下文入口、Daily Start 本地复核和桌面发布状态压成 5 个可点击入口。桌面发布不再是写死的 checklist，核心会通过 `GET /api/desktop/release/latest` 回读 `data/desktop-release.json`，前端用 `buildDesktopReleaseSummary` 显示 passed/missing/invalid。首页刷新动作会调用 `POST /api/stage1/daily-use` 聚合已有 P0/P1/desktop manifest 并写回 `data/stage1-daily-use.json`，随后重新读取日常报告和桌面发布状态；如果 P0/P1/desktop 源 manifest 比日报更新或缺失，readback 会把受影响行降为 review 并提示重新生成日报，首页摘要也会直接显示 `staleSourcePaths` 指向的源文件。首页还可复制/下载 `buildStage1P0DailyUseStartupSnapshot` 生成的启动快照，把当前收口状态、最新归档复核引用和刷新回执压成一份短 Markdown，方便个人或小团队每天开工先确认下一步。该卡位于 P0 Golden Path 之后、详细 readiness 证据之前，主动作只导航到对应工作区；行情刷新、复核入账和桌面构建仍需要用户在对应工作区或本地命令中显式执行，不自动运行流水线、不写新账本、不连接券商、不提交订单，也不放宽 live-blocked 边界。

“今日启动摘要 / Daily Start” 现在也可以作为 `daily_start_brief_review` 入账：首页可复制、下载或记录 `daily-start-brief-review.md`，事件 metadata 只保存 Markdown SHA-256、当前摘要状态、本地复核计数、open ops 数、主动作、审计查询、审计查询说明、本地复核入口、checkpoint id/status 和强制 live-blocked 边界，不保存完整正文。首页会用 `buildDailyStartBriefReviewReference` 回读最新 Daily Start 复核并标成 current、stale 或 missing；Audit 台账行也会显示“每日启动复核 / Daily start review” chip，并提供定位/复制查询动作。该复核只是每日人工启动留痕，不自动运行 P0 action、不补写其它复核、不修改账本以外状态、不签名、不连接券商、不提交订单。

Daily Start 复核的定位查询现在也会带上完整复核状态：`buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery` 会包含 current/stale/missing 本地复核计数、open ops、主动作、本地复核入口、checkpoint id 和 checkpoint status；首页最新启动复核引用复用同一条行级查询。这样复制“定位启动复核”链接时能同时解释为什么该复核当前、过期或缺失，Audit 搜索也会索引 `checkpoint-statuses` 语义；它仍只过滤既有台账行，不重新生成复核、不修改 manifest、不签名、不连接券商、不提交订单。

Audit 报告台账行现在也能直接解释 `personal_team_readiness_review`、`daily_ops_control_room_review` 和 `daily_start_brief_review`：模型层新增行级 label/title/query helper，页面会显示个人/小团队复核、每日操作复核和每日启动复核 chip，并提供“定位复核 / 复制复核链接”动作。这样从首页跳转到 Audit 后，不需要打开 Markdown 或手工拼搜索词，也能看见复核状态、ready/total、open items、启动摘要和下一动作；这些动作只过滤既有台账行，不新建复核、不签名、不运行流水线、不连接券商、不提交订单。

Audit 报告台账顶部摘要现在也会上浮最新 `personal_team_readiness_review`、`daily_ops_control_room_review` 和 `daily_start_brief_review`：`buildAuditEvidenceReportLedgerSummary` 会选出三类最新 ready 复核行，暴露 event id、短 hash、label、title 和稳定查询；Toolbar 会显示“最新可用性复核 / Latest readiness review”、“最新每日复核 / Latest daily review”和“最新启动复核 / Latest start review”，并提供定位/复制链接。这个入口只复用既有复核行和只读 Audit 查询，不新建复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 live-blocked 边界。

同一个 Audit 顶部摘要还会把三类本地复核聚合为“本地复核集 / Local review bundle”：`personal_team_readiness_review`、`daily_ops_control_room_review` 与 `daily_start_brief_review` 行都会带上共享的 `local-review-bundle` 搜索 token，summary 会统计个人/小团队复核数、Daily Ops 复核数、Daily Start 复核数、最新复核 event id 和一条总查询。总 tooltip 会继续带上 latest 行级 query/title，因此最新复核是 Daily Ops 或 Daily Start 时，操作者不用点进单条 row 也能看到审计 query、审计说明和 P2 复核链健康解释；但 `local-review-bundle` 本身仍保持宽筛整组复核。Toolbar 的“定位本地复核集 / Focus local reviews”可以一次筛出本页全部本地操作复核上下文，方便小团队复盘一段时间内的 readiness、每日操作和每日启动留档；它仍只过滤既有台账行，不写新事件、不签名、不运行流水线、不连接券商、不提交订单。

本地复核行现在也有自己的本地复核集上下文入口：`AuditEvidenceReportLedgerRow` 会为 `personal_team_readiness_review`、`daily_ops_control_room_review` 和 `daily_start_brief_review` 暴露 `localReviewBundleContextQuery/Title`，行内提供“定位行本地复核集 / Focus row local reviews”和“复制行本地复核集链接 / Copy row local reviews link”。行级 title 会继续带上该复核自己的状态、open items、下一步、审计 query 说明或 Daily Start 本地复核入口，因此从任意一条复核证据都能解释它在整页 `local-review-bundle` 里的角色；它仍只做只读过滤，不记录新复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单。

本地复核集还会标记当前页最新 ready 复核：`AuditEvidenceReportLedgerRow` 会在最新 `personal_team_readiness_review`、`daily_ops_control_room_review` 或 `daily_start_brief_review` 行上回填 `localReviewBundleLatestLabel/Query/Title`，summary 也暴露同一条 `local-review-bundle-latest` 查询。该查询现在会携带复核类型、event id、createdAt 和对应行级复核 query/title；如果最新复核是 Daily Ops 或 Daily Start，P2/Daily Ops 审计 query 与 `auditQueryTitle` 也会进入 latest bundle 链接和 tooltip。Toolbar 与最新行都提供“定位最新本地复核 / Focus latest local review”和“复制最新本地复核链接 / Copy latest local review link”，方便从复核集合中直接跳到最新留档；该入口仍只筛选既有台账行，不写事件、不签名、不运行流水线、不连接券商、不提交订单。

本地复核集现在还会显示覆盖健康度：`AuditEvidenceReportLedgerSummary` 会检查当前页是否同时存在 ready 的 `personal_team_readiness_review`、`daily_ops_control_room_review` 与 `daily_start_brief_review`，输出 `complete`、`partial` 或 `empty`，并生成 `local-review-bundle-complete` 或 `local-review-bundle-gap` 查询；缺少 Daily Ops、Daily Start 或个人/小团队复核时会额外带上 `local-review-bundle-daily-ops-missing`、`local-review-bundle-daily-start-missing` 或 `local-review-bundle-personal-missing`。Toolbar 与每条本地复核行都提供“定位本地复核覆盖 / Focus local coverage”和复制入口，帮助小团队确认复核留档是否成组覆盖；该能力只筛选既有台账行，不写事件、不签名、不运行流水线、不连接券商、不提交订单。

覆盖健康度出现 `partial` 时，Audit 顶部摘要和本地复核行现在还会给出明确的覆盖下一步：缺少 Daily Ops 时生成 `local-review-bundle-next-action record-daily-ops-review local-review-bundle-daily-ops-missing`，缺少 Daily Start 时生成 `local-review-bundle-next-action record-daily-start-review local-review-bundle-daily-start-missing`，缺少个人/小团队复核时生成 `local-review-bundle-next-action record-personal-team-review local-review-bundle-personal-missing`。Toolbar 与 row 操作区提供“定位覆盖下一步 / Focus coverage next”和复制入口，让操作者把缺口动作作为稳定 Audit 查询交给下一轮复核；它仍只解释并过滤现有台账行，不自动记录缺失复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单。

覆盖下一步现在也能从 Audit 直接打开承载复核按钮的工作区：`localReviewBundleCoverageNextActionTargetWorkspaceId` 会在覆盖 `partial` 时指向 `research`，Toolbar 与 row 操作区提供“打开覆盖下一步 / Open coverage next”。点击时只会保留当前 next-action Audit 查询并切回首页复核上下文，方便手动执行“入账复核”；它不会自动点击记录按钮、不写新事件、不签名、不运行流水线、不连接券商、不提交订单。

“复制覆盖下一步链接 / Copy coverage next link”现在会复制同一条可恢复深链：`workspace=research&auditReportQuery=local-review-bundle-next-action...`。打开链接后会直接落到手动复核入口所在工作区，并保留 Audit 查询参数，方便小团队把覆盖缺口派给下一位操作者；链接本身仍只是导航和查询上下文，不自动记录复核、不修改账本、不签名、不触发任何交易路径。

打开覆盖下一步深链时，首页会在 P0 readiness 区域显示“本地复核覆盖下一步 / Local review coverage next”落地提示，列出目标复核工作区和原始 coverage query，并提供“查看覆盖查询 / View coverage query”和“打开复核入口 / Open review entry”两个显式动作。前者切到 Audit 只读定位，后者回到承载手动复核按钮的工作区；两者都只保留查询上下文，不自动点击“入账复核”、不写新事件、不签名、不运行流水线、不连接券商、不提交订单。

覆盖下一步深链现在还会解析具体缺口类型：`resolveLocalReviewCoverageNextActionDeepLinkState` 会从查询中派生 `record-daily-ops-review`、`record-daily-start-review` 或 `record-personal-team-review`，并标记缺少 Daily Ops、Daily Start 还是个人/小团队复核。首页落地提示会显示“Daily Ops 复核缺失”、“每日启动复核缺失”或“个人/小团队复核缺失”，状态栏也会显示已载入的 next-action id；这仍只是解释和导航，不自动入账复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

覆盖下一步落地提示的两个动作也会跟随缺口类型变化：查询按钮会显示“查看 Daily Ops 覆盖查询”、“查看每日启动覆盖查询”或“查看个人/小团队覆盖查询”，入口按钮会显示“打开 Daily Ops 复核入口”、“打开每日启动复核入口”或“打开个人/小团队复核入口”。点击任一按钮后，状态栏会写入对应的 coverage query selected 或 review entry opened 反馈，方便操作者确认自己已经进入正确上下文；这些反馈仍只来自本地 UI 状态，不写账本、不自动记录复核、不触发交易路径。

Audit 来源侧的覆盖下一步按钮现在也会跟随缺口类型变化：顶部摘要和本地复核 row 的复制按钮会显示“复制 Daily Ops 覆盖下一步链接”、“复制每日启动覆盖下一步链接”或“复制个人/小团队覆盖下一步链接”，打开按钮会显示“打开 Daily Ops 复核入口”、“打开每日启动复核入口”或“打开个人/小团队复核入口”；行级按钮也会带上“行”前缀，方便从具体证据行交接。复制或打开后状态栏会写入对应的 `Daily Ops coverage next link copied`、`Daily start coverage next link copied`、`Personal/team coverage next link copied`、`Daily Ops review entry opened`、`Daily start review entry opened` 或 `Personal/team review entry opened`，仍只做导航和查询上下文确认，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

Audit 来源侧的“定位覆盖下一步 / Focus coverage next”也已补齐为 action-specific：顶部摘要会显示“定位 Daily Ops 覆盖下一步”、“定位每日启动覆盖下一步”或“定位个人/小团队覆盖下一步”，本地复核 row 会显示对应的“定位行 ...”文案。点击后会保留原来的只读 Audit 查询定位，并写入 `Daily Ops coverage query selected`、`Daily start coverage query selected` 或 `Personal/team coverage query selected` 状态栏反馈；它仍只是筛选台账行和确认上下文，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

Audit 来源侧的“覆盖下一步 / Coverage next”可见标签本体现在也会解释缺口类型：顶部摘要和本地复核 row 会把原始 `record-daily-ops-review` / `record-daily-start-review` / `record-personal-team-review` 展示为“Daily Ops 复核缺失”、“每日启动复核缺失”或“个人/小团队复核缺失”。原始 next-action query 和 title 仍保留在 tooltip、搜索和深链里，UI 只是把同一条既有上下文翻译成更易读的人工复核提示，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

Audit 来源侧的覆盖下一步 tooltip/title 现在也会以可读缺口类型开头：悬停顶部摘要、本地复核 row 标签或对应的 focus/copy/open 按钮时，会先看到 Daily Ops、Daily Start 或个人/小团队复核缺失，再保留原始 next-action title/query/label 作为审计上下文。该能力只改进 UI 解释，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

Audit 只读搜索现在也会索引覆盖下一步的 title 语义：把完整的 `local-review-bundle-next-action · record ... · missing ...` tooltip/title 粘到 Audit 查询框时，可以筛回对应的本地复核缺口行。这样小团队交接时既能用稳定 token，也能用人类可读的缺口描述查证来源；它仍只过滤既有台账行，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

Audit 没有任何本地复核行时也会给出启动动作：本地复核覆盖会显示 `empty`，并生成 `local-review-bundle-next-action record-personal-team-review local-review-bundle-empty local-review-bundle-personal-missing`，目标工作区仍是 `research`。这样新环境或刚导入的账本可以先从个人/小团队复核入口开始补齐人工留档，后续再由既有 partial 逻辑提示 Daily Ops 缺口；它仍只提供导航和查询上下文，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

空本地复核覆盖的 Audit 查询现在也有只读锚点：当没有任何本地复核行时，`local-review-bundle-empty` 和对应 next-action 查询会命中最新 ready 的普通 `audit_evidence_report` 行，方便操作者先看到当前账本上下文再打开复核入口。该锚点只写入搜索文本，不把普通报告 row 标记成本地复核 row，也不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

空本地复核覆盖深链现在也会被识别成独立启动状态：`local-review-bundle-empty` 会在首页落地提示和 Audit 来源侧按钮中显示“本地复核未开始 / Local reviews not started”以及“开始个人/小团队复核 / Start personal/team review”。它仍只解释并导航到 research 手动入口，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

Audit 顶部摘要现在会在本地复核数为 0 时仍显示本地复核集覆盖入口：只要 summary 已生成 `localReviewBundleCoverageQuery` 或 `localReviewBundleCoverageNextActionQuery`，Toolbar 就会显示 `0` 计数、覆盖状态和“开始个人/小团队复核 / Start personal/team review”动作。这样新账本无需先有任何本地复核行，也能从 Audit 直接复制或打开空覆盖启动链接；它仍只暴露只读查询和手动入口，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

空本地复核覆盖深链的首次载入状态栏也会跟随缺口类型变化：`localReviewCoverageNextActionLoadedStatusLabel` 会把 empty 显示为 `Local review start link loaded`，Daily Ops、Daily Start 与个人/小团队缺口则分别显示对应的 coverage next loaded 文案。这样操作者打开交接链接后，顶部状态、落地提示和按钮动作都使用同一套人工复核语义；它仍只解释 URL 上下文，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

本地复核覆盖 next-action 深链现在也会拒绝未知动作或缺失缺口类型：`buildLocalReviewCoverageNextActionUrlSearch` 与 `resolveLocalReviewCoverageNextActionDeepLinkState` 只有在查询同时包含已知的 `record-daily-ops-review` / `record-daily-start-review` / `record-personal-team-review` 和对应缺口 token 时才会返回有效状态。坏链接不会进入首页落地提示，也不会生成可复制的标准化 URL；该收紧只保护人工交接上下文，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

本地复核覆盖 next-action 深链还会校验 action 与缺口 token 是否一致：Daily Ops 复核入口必须搭配 `local-review-bundle-daily-ops-missing`，Daily Start 复核入口必须搭配 `local-review-bundle-daily-start-missing`，个人/小团队入口必须搭配 `local-review-bundle-personal-missing`，空本地复核启动则必须同时带 `local-review-bundle-empty` 与个人/小团队缺口 token。错配链接会被拒绝为无效状态，避免把操作者带到错误复核入口；该能力仍只保护 URL 解释，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

本地复核覆盖 next-action 深链现在还会固定目标工作区：即使 `workspace=audit` 这类值本身是合法产品区，只要不是承载复核入口的 `workspace=research`，`buildLocalReviewCoverageNextActionUrlSearch` 和 `resolveLocalReviewCoverageNextActionDeepLinkState` 都会拒绝它。这样 Daily Ops、Daily Start、个人/小团队和 empty 启动链接都不会把操作者带回错误页面；该能力仍只保护导航上下文，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

本地复核覆盖 next-action 主 token 也改为精确匹配：`local-review-bundle-next-action` 必须作为独立查询 token 出现，`not-local-review-bundle-next-action` 这类包含合法字符串的伪 token 不会被标准化或解析为落地状态。这样分享链接的入口、动作、缺口三类 token 都使用一致的精确匹配；该能力仍只保护 URL 解释，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

本地复核覆盖 next-action 链接现在还要求单一结构：查询里必须恰好有一个 `local-review-bundle-next-action` 主 token，并且只能出现一个已知复核 action token。重复主 token、同时带 Daily Ops、Daily Start 与个人/小团队 action，或重复同一个 action 的链接都会被拒绝，避免歧义交接链接被标准化；该能力仍只保护 URL 解释，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

本地复核覆盖 next-action 的缺口 token 也会做数量校验：Daily Ops 缺口、Daily Start 缺口、个人/小团队缺口和 empty 启动 token 都必须按对应动作恰好出现一次；重复 `local-review-bundle-daily-ops-missing`、`local-review-bundle-daily-start-missing`、`local-review-bundle-personal-missing` 或 `local-review-bundle-empty` 的链接会被拒绝，避免重复 token 伪造成有效交接上下文。该能力仍只保护 URL 解释，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

本地复核覆盖 next-action 深链的 URL 参数外壳也会保持单一：resolver 要求 `workspace` 和 `auditReportQuery` 各恰好出现一次；重复 `workspace` 或重复 `auditReportQuery` 的链接会被拒绝，避免浏览器只读取第一项参数时把歧义链接解释成有效交接上下文。该能力仍只保护 URL 解释，不自动记录复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单。

Audit/P0 相关深链现在复用同一套必需参数唯一性校验：P0 current-gap action 要求 `workspace`、`auditReportQuery` 和 `p0Action` 各出现一次，P0 completion gap 与本地复核覆盖 next-action 要求 `workspace` 和 `auditReportQuery` 各出现一次。重复必需参数的链接不会被标准化为可恢复状态，避免歧义 URL 在小团队交接中被误解成唯一下一步；该能力只保护 URL 解释，不自动运行 P0 action、不记录复核、不修改账本、不签名、不连接券商、不提交订单。

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

`.github/workflows/ci.yml` 会在 pull request 和 `main` push 时运行同一套质量门禁：`npm ci`、`npm test`、`npm run build`、`docker compose config`、`docker compose build`，然后通过 `npm run docker:smoke -- --no-build --down` 验证容器化部署可以启动并通过 `/health`、`/`、`/api/workspace` 自检。feature branch push 不再与 pull request 重复运行完整链路；Nginx `/api/` 的 upstream read timeout 与 smoke helper 的 90 秒请求预算一致，避免 P1 自选行情长刷新先被代理以 504 切断。

七类验收清单使用原生 Node 24 的 `actions/upload-artifact@v7` 上传，CI 不再设置 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`。P0、P1、Stage 5、Stage 6、Stage 7、Stage 8 和 Stage 9 artifact 都使用稳定名称、路径与 `if: always()` 语义。

Python 测试中直接创建的 SQLite 连接会复用连接自身的事务上下文，并在事务退出后由 `contextlib.closing` 显式关闭；契约测试拒绝新的裸 `with sqlite3.connect(...)`。该约束消除 Python 3.14 全量测试中的未关闭数据库 `ResourceWarning`，不改变生产 store、schema 或事务行为。

CI 还会运行 `npm run docker:smoke:p0 -- --no-build --down`，把 P0 策略流水线、AI 评审、纸面模拟、导出、导入和重导出作为产品验收门禁，并上传 `data/p0-acceptance.json` 为 `p0-acceptance-manifest` artifact。

CI 同时运行 `npm run docker:smoke:p1 -- --no-build --down`，把自选列表刷新、queue-ready 审计 run、AI 评审、paper-only 模拟、P2 replay seed、导出/导入和 watchlist refresh provenance 作为 P1 研究运营验收门禁，并上传 `data/p1-acceptance.json`。本地服务会通过 `/api/p1/acceptance/latest` 将同一份 artifact 投影成产品状态，便于工作台直接显示 P1 验收是否可复核。

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

桌面端发布验证并记录首页 readback：

```powershell
npm run desktop:release
```

如果已经手动完成打包，可只记录当前最新包：

```powershell
npm run desktop:release:record
```

这两条命令会写入 `data/desktop-release.json`。该 manifest 仅用于首页 Stage 1/P0 日常收口和 `/api/desktop/release/latest` 回读，必须保持 `paperOnly=true`、`liveTradingAllowed=false`、`liveBlockedBoundary=true`，并覆盖 `web-build`、`cargo-check`、`tauri-icon`、`desktop-bundle`、`live-blocked-boundary` 五项检查。

Stage 1/P0 日常使用一键准备：

```powershell
npm run stage1:prepare:plan
npm run stage1:prepare:quick:plan
npm run stage1:prepare
npm run stage1:prepare:quick
```

`stage1:prepare:plan` 和 `stage1:prepare:quick:plan` 只打印将要执行的完整或快速链路，不运行 Docker 或桌面打包；`stage1:prepare` 会依次跑 P0/P1 acceptance、P2 readiness chain、P2 chain preflight、桌面发布和 Stage 1 daily/preflight 报告；`stage1:prepare:quick` 会复核已经存在的 P0/P1/P2 manifest、刷新 P2 chain preflight 和桌面 release manifest，再生成并验证 Stage 1 daily/preflight 报告。这四个入口都复用下面的单项命令，不连接券商、不提交订单，也不会放宽 `liveTradingAllowed=false`。

Stage 1 日常启动自检：

```powershell
npm run stage1:daily
```

离线复核自检报告：

```powershell
npm run stage1:daily:validate
```

这两条命令会读入 `data/p0-acceptance.json`、`data/p1-acceptance.json` 和 `data/desktop-release.json`，生成或验证 `data/stage1-daily-use.json`。报告聚合“干净环境开箱”“行情刷新恢复”“研究入口”“每日启动”和“桌面发布”五个日常入口的 ready/review/blocked 状态；`stage1:daily:validate` 会通过同一套 readback 检查源 manifest mtime，如果 P0/P1/desktop 源文件比日报更新或已经缺失，会把对应日报行投影为 review 并要求重新运行 `npm run stage1:daily`。这些命令不自动运行 smoke、打包桌面端、写审计事件、连接券商或改变 `liveTradingAllowed=false`。

Stage 1 开箱预检：

```powershell
npm run stage1:preflight
```

离线复核开箱预检：

```powershell
npm run stage1:preflight:validate
```

这两条命令会检查 `package.json` 中的 Stage 1 一键准备、日常入口和 P2 chain 预检入口、`data/p0-acceptance.json`、`data/p1-acceptance.json`、`data/p2-chain-preflight.json`、`data/desktop-release.json` 和 `data/stage1-daily-use.json`，并写入或验证 `data/stage1-bootstrap-preflight.json`。预检只读取现有脚本和 manifest，给出第一个阻断项、下一步动作和推荐命令；P2 chain preflight 缺失时会提示先运行 `npm run docker:smoke:p2:preflight`，链路已生成但仍被上游 manifest 阻断时会透传对应的 P2 下一步命令。Stage 1 preflight 不会运行 Docker、不会生成缺失 P0/P1/P2 证据、不会打包桌面端、不会写审计事件、不会连接券商或提交订单。

本地核心还提供 `GET /api/stage1/bootstrap-preflight/latest` 和 `POST /api/stage1/bootstrap-preflight`。前者只回读 `data/stage1-bootstrap-preflight.json` 并在缺失/无效时返回安全 fallback；如果 `package.json`、P0/P1/P2 chain/desktop manifest 或 `data/stage1-daily-use.json` 比 preflight 更新，readback 会把受影响检查投影为 review，附带 `staleSourcePaths` 并提示重新运行 `npm run stage1:prepare:quick`。后者在产品内生成同一份 preflight manifest，然后立即用同一套 status readback 复核。首页 Stage 1/P0 日常收口卡会读取该 preflight：ready 时把开箱预检摘要合并进卡片详情；blocked/review/missing/invalid 时把“干净环境开箱”行作为总闸门，指向 Settings 复核推荐命令；当 preflight 自身因为上游源更新而 stale 时，首页中文 detail 会显示“开箱预检源已更新 · <path> · 请刷新自检”，行级状态显示“开箱预检待刷新”，区别于真正 blocked 的开箱失败。这个入口仍只读/写 preflight 文件，不运行 Docker、不补造 P0/P1/P2/desktop/daily-use 上游证据、不打包桌面端、不写审计事件、不连接券商或提交订单。

本地核心还提供接口 `GET /api/stage1/daily-use/latest` 和 `POST /api/stage1/daily-use`。前者用于前端首页读取 `data/stage1-daily-use.json` 的状态，只返回 passed/missing/invalid/readback 结构，并会在源 manifest 新于日报或缺失时返回 `status=review` 与 `staleSourcePaths`；后者用于在产品内手动生成同一份报告，只聚合已存在的 P0/P1 验收和桌面发布 manifest，并从 P1 watchlist refresh / queue pipeline 检查推导行情恢复和研究入口状态。两个接口都不运行 P0/P1/P2 smoke、不构建桌面包、不写审计事件、不连接券商、不提交订单，也不改变实盘边界。

首页 Stage 1/P0 日常收口卡会优先使用有效报告里的五行状态；只有报告缺失或无效时，才回退到页面当前的行情、研究、每日启动和桌面发布即时状态。这样刷新自检后，CLI、API 和首页第一屏看到的是同一份日常入口语义；当 daily-use readback 返回 `staleSourcePaths` 时，首页 detail 会显示过期源 manifest 路径并引导点击“刷新自检”重新生成日报；当 bootstrap preflight readback 返回 `staleSourcePaths` 时，同一卡片会优先显示 preflight 源路径并引导重新生成 preflight。首页卡片还可复制或下载当前五行状态、主动作、过期源提示和 live-blocked 边界组成的 Markdown 日常手册，便于个人或小团队启动/交接；手册里的主动作和五行入口都会附带相对 `?workspace=...&stage1DailyUseFocus=...` 链接，且 Bootstrap Preflight Evidence 段会列出 `p2-manifest-chain` 和 `data/p2-chain-preflight.json`，让 P2 manifest 链路状态随每日交接一起流转；启动快照也会输出同一段 P2 chain evidence。也可以在首页直接复制主入口完整 URL，或一次复制/下载包含主入口、五行入口和当前刷新回执入口的完整 URL 链接包；需要整包转贴或离线留档时，还可以复制或下载一份带顶部摘要和目录的归档包，把日常手册、完整链接包、当前有效分享来源、当前刷新回执和无效分享链接诊断状态放进同一个 Markdown 文件，下载文件名会带 daily 状态、ready 计数和有效/无效/无分享上下文，归档 Markdown 顶部也会写出同一个建议文件名和 `Archive body SHA-256`，复制/下载状态栏会显示短 hash；用户显式点击“入账归档 / Record archive”时，前端会把同一份归档保存成 `stage1_daily_archive_review` 审计事件，只记录文件名、内容 SHA-256、正文 SHA-256、五行状态、分享/刷新上下文和 live-blocked 边界，不保存 Markdown 正文。点击“刷新自检”后，首页还会留下本地刷新回执，把 daily-use report、bootstrap preflight 和 desktop release readback 三段分别标为本地核心或安全 fallback，并显示哪一段 ready/review/blocked；回执可复制或下载为 Markdown 文本，也可点击“打开下一步”跳到当前最需要处理的工作区，回执里的下一步和三段 entry 也会附带相对 `?workspace=...&stage1RefreshReceiptFocus=...` 链接，首页可直接复制下一步完整 URL。打开这类 Stage 1 分享链接时，首页会显示 recovered share banner，说明链接来自日常手册还是刷新回执，并提供“查看日常卡片 / 打开分享工作区 / 复制、下载或入账归档包”等手动动作；“查看日常卡片”会优先滚动并聚焦分享指向的五行入口、主动作、回执 entry、下一步按钮或冷启动“刷新自检”按钮，目标暂未渲染时再回退到 Stage 1/P0 日常收口卡，日常收口卡内也会高亮对应目标，复制、下载或入账归档包会记录当前 recovered share 的类型、目标和完整链接。如果 Stage 1 分享链接缺少 workspace、workspace 重复、目标重复/混用或目标值无效，首页会显示 invalid share banner 和具体原因，并提供“查看日常卡片”“复制诊断”“复制/下载/入账归档包”和“复制新入口链接”等安全动作；复制诊断会生成包含失败原因、原始 query、新入口、当前主动作和 live-blocked 边界的 Markdown 交接说明，复制、下载或入账归档包会输出包含日常手册、完整链接包、当前有效分享来源、当前刷新回执和无效分享链接诊断状态的 Markdown 整包，复制新入口链接只复制当前日常主入口完整 URL，不恢复错误工作区；如果在新会话打开刷新回执链接但本地还没有本次回执，卡片会显示恢复提示并高亮“刷新自检”作为手动重建回执的下一步。点击五行入口、主动作、回执 entry 或回执下一步时，页面只切换前端工作区并写入明确的本地状态栏反馈，方便确认打开的是哪段日常上下文。日常手册、链接包、归档包和刷新回执都只解释当前本地状态并提供前端导航；复制或下载日常手册、链接包、归档包或回执只是浏览器本地交接动作，不自动运行 Docker、P0/P1/P2 smoke、桌面构建、审计入账、券商连接或订单提交；入账归档只在用户点击时写入一条本地审计事件，不自动运行刷新、构建、券商连接或订单提交。

Stage 1/P0 日常归档入账现在也能被 Audit 台账一等回读。`stage1_daily_archive_review` 行会显示为 “Stage 1 daily-use archive review”，支持按归档状态、五行 ready/total、主动作、分享/刷新上下文、无效分享原因、`Archive body SHA-256`、bootstrap preflight check 和 `data/p2-chain-preflight.json` 搜索，并纳入本地复核集覆盖：本地复核集完整条件现在同时要求个人/小团队、Daily Ops、Daily Start 和 Stage 1 归档四类 ready 证据。首页日常收口卡会显示“最新归档入账 / Latest archive record”，并提供定位或复制 Audit 查询入口；同一区块还能复制或下载一份归档复核引用摘要，说明当前 latest archive record 是 current、stale 还是 missing，并列出 event id、查询、正文 hash、主动作、行状态和 Bootstrap P2 chain source，方便小团队交接时解释是否需要重新入账归档；卡片本身和 Daily Startup Snapshot 的 Archive Reference 段也会直接显示已入账归档绑定的 P2 chain source，便于和当前 Bootstrap Preflight Evidence 对比。当前 closure 的 P2 source path 或 bootstrap check id/status/source path 与归档事件不一致时，latest archive record 会标为 stale。该 readback 和摘要导出只定位或描述既有本地审计证据，不保存归档正文、不新建审计事件、不签名、不刷新自检、不运行 Docker、不连接券商、不提交订单。

Audit 顶部摘要也会显示 Stage 1 归档覆盖：本地复核集计数会列出 Stage 1 archive 数量，最新 `stage1_daily_archive_review` 会作为“最新归档复核 / Latest archive review”单独显示，并提供“定位最新归档复核 / 复制最新归档复核链接”。这些按钮只复用现有 Audit 查询，不重新生成归档、不写新审计事件、不签名、不刷新自检、不运行 Docker、不连接券商、不提交订单。

当本地复核覆盖缺口指向 `record-stage1-archive-review` 时，覆盖 next-action 的“打开入口”会在切换到目标工作区后直接滚动并聚焦首页日常收口卡里的“入账归档 / Record archive”按钮。这样从 Audit 工具栏、Audit 行级入口或恢复后的 coverage next 链接进入时，操作者会落到需要手动点击的归档入账控件；该焦点动作仍只做前端导航，不自动保存归档、不重新生成日报、不运行 Docker、不构建桌面端、不连接券商、不提交订单。

## Product Boundary

产品目标是全功能量化交易平台，但实盘执行必须分阶段解锁。当前版本聚焦行情、研究、回测、AI 评审、组合风控雏形和模拟交易，不连接真实 A 股券商账户。交易工作区默认 `paper_only`，自动化交易能力通过 `ExecutionAdapter` 风格的接口预留；只有在合法券商接口明确、适配器认证通过、风控审批通过、用户人工确认后，才允许接入实盘适配器。

## Data Policy

- 日线：作为跨 A 股、美股、加密货币的默认研究粒度。
- 分钟线：采用“免费源近期窗口 + 本地缓存持续沉淀”的策略。
- API Key：无 Key 数据源用于快速体验，有 Key 数据源通过 `.env` 或本地配置增强稳定性和覆盖范围。

## Safety

AI 研究助手只解释已传入的策略和回测结果，不承诺收益，不直接替用户做投资决策。模拟执行会保留拒单原因、订单状态和账户快照，后续实盘接入必须经过风控检查。
