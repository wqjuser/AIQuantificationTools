# AIQuant Terminal 产品规划

## 1. 产品定位

AIQuant Terminal 的目标不是商业化 SaaS 平台，也不是把行情、AI、回测按钮随手堆在一起的工具箱，而是一个面向个人和小团队的本地优先全功能量化交易工具。

这里的“全功能”不是指一开始覆盖所有市场、所有券商和所有机构流程，而是指个人或小团队可以在自己机器上完成一条真实可用的闭环：

```text
选标的 -> 拉真实数据 -> 图表研究 -> 配策略 -> 审计回测 -> AI 复盘 -> 模拟交易 -> 导出可复现包
```

长期目标是覆盖完整交易生命周期：

1. 接入并校验市场数据。
2. 研究标的、因子和市场环境。
3. 创建、验证、版本化策略。
4. 运行可复现回测和模拟。
5. 让 AI 智能体只基于审计证据进行解释、辩论和风险提示。
6. 将通过审计的策略推进到模拟交易。
7. 在组合和风控层进行资金、仓位、敞口、止损、回撤控制。
8. 在合法、可认证、可审计的前提下接入真实交易适配器。
9. 记录每一次研究、策略变更、回测、AI 判断、风控审批、委托和成交。

短期实现必须先聚焦 6 周 P0：A 股单标的研究、回测、AI 复盘和模拟交易闭环。多市场、组合和实盘准备都可以保留接口和证据边界，但不能抢走 P0 闭环的实现优先级。实盘不是简单加一个下单按钮，而是审计链路、风控链路和人工确认成熟后的结果。

后续开发必须按“大批次垂直闭环”推进，而不是继续堆零散字段、局部闸门或孤立面板。当前执行主计划是 [AIQuant P0 Big Batch Delivery Implementation Plan](superpowers/plans/2026-06-23-aiquant-p0-big-batch-delivery.md)：先完成 P0 Golden Path Workbench，再依次推进 A 股数据就绪、策略到回测流水线、AI 评审、纸面交易、复现包和产品化收口。除非某个小修复直接阻断这些批次，否则不再单独推进零散改动。

最新进展：Batch 1 已完成 P0 黄金路径主线，前端新增 `buildP0GoldenPathJourney` 模型和首页 P0 黄金路径面板，把数据、策略、回测、AI 评审、模拟执行、回放、导出压成一条可点击的主线，并继续保持 P0 纸面盘边界。Batch 2 已启动数据就绪合同，后端新增 `/api/market/data-readiness`，前端新增 `loadMarketDataReadiness` 和 Market/Research 的数据就绪条，用同一份 contract 展示缓存新鲜度、来源、provider 健康、阻断原因和修复动作。Batch 3 已开始收口策略到审计回测入口：后端新增 `/api/p0/pipeline`，把结构化策略、回测假设和行情上下文编排成一个审计 run，并返回 `audited_run_created`、run id、策略 revision、数据 snapshot 和 paper-only/live-blocked 边界；前端新增 `runP0Pipeline`，主“运行流水线”按钮会调用该入口并回拉 run detail 恢复图表、回测和 AI 证据。Batch 4 已启动 AI 评审 gate：后端新增 `/api/p0/ai-reviews`，对缺失 run 和上下文不匹配给出阻断响应，成功时生成 `mode=local_evidence_review` 的结构化证据评审，入账 citations、风险未知项、agent rounds、decision log 和 AI boundary，并显式禁止直接交易指令；前端新增 `runP0AiReview`，AI Review 工作区的保存动作会调用后端评审 runner 并写入历史记录。Batch 5 已启动 P0 模拟委托命令：后端新增 `/api/p0/paper-simulations`，必须绑定已审计 run 和已保存 AI 评审证据，复用现有 `PaperExecutionStore` 记录 paper-only 成交、账户回放和 `p0_paper_simulation` 审计事件，并强制 `liveTradingAllowed=false`、`orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false`；前端新增 `runP0PaperSimulation`，主“提交模拟委托”会显示 order id、成交价量、现金/持仓回放、审计 event id 和导出就绪状态。Batch 6 已启动 P0 复现包收口：研究运行导出包会携带 run-bound `auditEvents` 和 `p0PackageCompleteness`，其中完整性判定覆盖市场上下文、数据快照、策略版本、审计回测、AI 评审、paper simulation、回放摘要、审计报告引用和 live-blocked 边界；导入时会校验 `auditEvents` artifact count、恢复审计事件并纳入失败回滚和 undo 快照；前端 API、包浏览器、近期索引、导入 diff 和 P0 completion gate 已能展示/搜索这些证据，只有当前 run 的完整复现包通过且仍保持实盘阻断时，才把导出导入视为 P0 闭环就绪。

Batch 7 已启动产品化收口：布局守卫测试现在要求桌面左侧产品导航保持 232px 可读宽度、描述文字常显，并把图标折叠断点延后到 960px；首页只保留一个主 P0 Golden Path 面板，把已入账报告回显、深链恢复、paper preflight gate 明细和 backlog 队列移入二级 `P0 evidence drawer`。这样首页优先显示当前任务、当前阻断和主行动作，历史证据仍可展开复核，但不再把所有内部审计碎片直接摊在第一屏。

Batch 8 已启动部署验收收口：`tools/docker_smoke.py` 现在除了基础健康检查外，还可以通过 `--p0-acceptance` 在 Docker 或本地部署中依次验证 `/api/p0/pipeline`、`/api/p0/ai-reviews`、`/api/p0/paper-simulations` 和研究包导出。该 smoke 会检查 paper-only/live-blocked 边界、`p0_paper_simulation` 审计事件和完整 `p0PackageCompleteness`，把“容器能启动”提升为“P0 API 闭环能跑通”。

Batch 9 已启动复现包导入验收：`tools/docker_smoke.py` 新增 `--p0-import-check` 和可选 `--p0-import-base-url`。在 P0 acceptance 导出完整包后，smoke 可以把包 POST 到 `/api/research/runs/import`，校验导入响应、undo token、导入后重导出的 `p0PackageCompleteness` 和 live-blocked 边界。默认导回同一服务用于验证合同；如果指向第二个干净实例，则可模拟另一台机器或干净数据库恢复。

Batch 10 已启动验收证据产物：`tools/docker_smoke.py` 新增 `--p0-acceptance-report`，可以把 P0 acceptance 的 run id、标的、周期、导入目标、检查步骤、`paperOnly=true` 和 `liveTradingAllowed=false` 边界写成 `aiqt.p0AcceptanceManifest` JSON。这样本地发布或 CI 不只看终端日志，还能归档一份可复核的 P0 闭环验收记录。

Batch 11 已启动验收产物离线校验：`tools/docker_smoke.py` 新增 `--validate-p0-acceptance-report`，可以在不启动 Docker 的情况下读取归档的 `aiqt.p0AcceptanceManifest`，校验 schema、核心 P0 检查、检查数量、`paperOnly=true`、`liveTradingAllowed=false` 和 live-blocked 边界。这样 CI 可以把“生成验收报告”和“复核验收报告”拆成两个明确步骤。

Batch 12 已启动 P0 验收入口产品化：根 `package.json` 新增 `docker:smoke:p0` 和 `docker:smoke:p0:validate`，把 P0 acceptance、导入复核、manifest 输出和离线校验固定成可复用脚本；GitHub Actions 不再手写长参数链，而是依次运行基础 Docker smoke、P0 acceptance smoke、manifest validator，并把 `data/p0-acceptance.json` 上传为 `p0-acceptance-manifest` artifact。这样 P0 不是“开发者记得跑的一串命令”，而是每次 push/PR 都能复核的产品验收门禁。

Batch 13 已启动验收证据回读：后端新增 `quant_core.p0_acceptance` 和 `GET /api/p0/acceptance/latest`，默认读取 `data/p0-acceptance.json` 并投影成 `aiqt.p0AcceptanceStatus`，区分 `passed / missing / invalid`；前端新增 `buildP0AcceptanceLatestUrl`、`loadP0AcceptanceLatest` 和 `buildP0AcceptanceSummary`，可以把本地验收产物变成产品状态，但缺失、校验失败或任何 `liveTradingAllowed=true` 都只会进入风险/缺失状态，不会放开实盘路由。

Batch 14 已启动工作台验收回显：主 P0 readiness 卡片现在会在页面加载时调用 `/api/p0/acceptance/latest`，把最新本地 `data/p0-acceptance.json` 显示为“通过 / 缺失 / 无效”三态，并提供刷新验收与跳转 Audit 复核动作。这个回显复用 `buildP0AcceptanceSummary` 的 live-blocked 判定，缺失或无效 manifest 会作为正常风险状态展示，验收通过也只证明 P0 本地闭环已跑通过，不会解锁真实下单或改变 `liveTradingAllowed=false`。

Batch 15 已启动 Audit 验收复核：Audit 工作区新增 `P0AcceptanceReviewPanel`，复用同一份 `/api/p0/acceptance/latest` 回读证据，展示 manifest 来源、run id、市场/标的/周期、检查项列表和 paper-only/live-blocked 边界。该面板位于 Audit 报告账本前的独立 `acceptance` 区域，缺失或无效 manifest 会作为可复核风险状态显示，验收通过也只代表本地 P0 闭环通过，不授权实盘交易。

Batch 16 已启动便携验收复核材料：`terminal-workbench` 新增 `buildP0AcceptanceReviewMarkdown`，Audit 的 P0 验收复核面板现在可以复制或下载 Markdown 证据说明，内容包含状态、来源、生成时间、run id、市场上下文、检查项、`paperOnly`、manifest 声称的 `liveTradingAllowed`、`liveBlockedBoundary` 和“不授权实盘交易”的明确边界。这样个人或小团队可以把本地 P0 验收结果留档或异步复核，而不需要只依赖浏览器页面。

Batch 17 已启动验收复核审计入账：`terminal-api` 新增 `buildP0AcceptanceReviewAuditEvent`，Audit 的 P0 验收复核面板新增“入账/Record”动作，可把当前验收复核保存为 `p0_acceptance_review` 审计事件。该事件保存 Markdown sha256、文件名、manifest 状态、来源、run id、市场上下文、检查项、`paperOnly`、manifest 报告的实盘字段和平台强制的 `liveTradingAllowed=false` 边界，但不把完整 Markdown 正文塞进账本。Audit 报告历史现在也会拉取这一类事件，方便后续搜索本地 P0 验收证据。

P1 已启动个人/小团队研究运营阶段：新的执行主计划是 [AIQuant P1 Personal Research Ops Implementation Plan](superpowers/plans/2026-06-23-aiquant-p1-personal-research-ops.md)。P1 不解锁实盘，而是把 P0 单标的闭环扩展成日常可用的多标的研究运营工具。Batch 1 已新增 Research Ops Queue：`terminal-workbench` 会从自选列表、watchlist 缓存刷新证据和研究运行历史生成下一步队列，区分需修数据、可跑审计流水线、需 AI 评审和 paper-only 模拟候选；Market 工作区新增紧凑队列面板，点击动作会先切换到对应标的，再复用既有 Golden Path action runner 执行刷新、流水线、AI 评审或模拟准备。Batch 2 已新增 Strategy Governance Queue：`terminal-workbench` 会把当前草稿、策略库版本、diff 行、schema/risk 校验、上下文不匹配和最新审计 run 聚合成策略治理队列，区分当前草稿、已审计、跨上下文导入、上下文过期、需重审和 schema 阻断；Strategy Lab 新增紧凑队列，支持保存当前版本、加载版本，以及“加载并审计”动作，后者会等策略快照真正成为当前工作区后再复用既有流水线。Batch 3 已新增 Portfolio Paper Ops Queue：`terminal-workbench` 会把组合纸面委托批次、审批行、模拟路由检查、状态时间线和 adapter paper execution 证据聚合成一个运营队列，区分证据过期、待风控、待人工、可模拟、已拒绝和已模拟；Portfolio/Execution 共享同一个紧凑队列，可模拟行复用既有 paper-only simulator，其余行只定位审计/委托证据，不自动批准、不重复模拟、不连接真实券商。Batch 4 已新增 Evidence Package Control Room：Audit 工作区会把近期导出包索引、审计报告签名账本、导入审计流水、P0 验收复核事件和最新验收摘要聚合成每个 run 的证据状态，区分导入阻断、复现包阻断、验收缺失、签名过期/无效、未签名、可归档和完整证据包；点击动作只定位既有包、导入、签名或验收证据，不修改账本、不自动归档、不解锁实盘。Batch 5 已新增 Local Team Handoff Notes：后端新增本地 SQLite 交接备注库和 `/api/handoff-notes` 创建/查询契约，保存时同步写入通用审计事件；研究运行导出包会携带 run-bound `handoffNotes[]` 与 `manifest.artifactCounts.handoffNotes`，导入会校验数量一致性，并把交接备注纳入失败回滚和 undo 恢复；Research 工作区新增当前审计 run 的交接备注面板，导出浏览、近期索引和导入 diff 也能显示交接备注 artifact 状态。Batch 6 已新增 P1 Acceptance Gate：`tools/docker_smoke.py --p1-acceptance` 会读取自选列表、要求至少 3 个标的、运行 watchlist cache refresh、选择刷新成功的 queue-ready 标的运行审计流水线、AI 评审、paper-only 模拟、研究包导出、复现包导入和导入后重导出，并生成 `aiqt.p1AcceptanceManifest`；P0 pipeline 也支持 `watchlistRefreshRunId`，因此 P1 验收 run 会把自选刷新证据锁进数据快照和导出包；根脚本新增 `docker:smoke:p1` / `docker:smoke:p1:validate`，CI 会上传 `data/p1-acceptance.json`。上述队列、备注和验收门禁只编排现有 P0/P1 证据，不创建实盘委托、不连接券商、不改变 `liveTradingAllowed=false`。

Batch 6 的 P1 验收现在也具备产品回读：后端新增 `quant_core.p1_acceptance` 和 `GET /api/p1/acceptance/latest`，前端新增 P1 acceptance typed loader、summary model 和工作台 P1 研究运营验收卡。该卡会读取 `data/p1-acceptance.json`，显示自选数量、队列标的、检查覆盖、来源路径和 `liveTradingAllowed=false` 边界；缺失或非法 manifest 会显示为待处理/风险状态，仍不授权实盘。

P2 已启动实盘前准入阶段：新的执行主计划是 [AIQuant P2 Pre-live Readiness Implementation Plan](superpowers/plans/2026-06-24-aiquant-p2-prelive-readiness.md)。P2 不直接接真实券商和不开放实盘下单，而是把 P1 之后已经积累的晋级队列、适配器认证、密钥清单、环境绑定、运行时重载、受控编排、人工确认、sandbox 探针、paper route runbook、ops state 和 adapter paper execution 证据收束成可读的实盘前准入控制面。Batch 1 已新增 `buildPreLiveReadinessChecklist`：Execution 的晋级队列现在会显示一个紧凑“实盘前清单”，列出通过闸门数、当前阻断闸门、下一步和每项证据状态；即使审计运行、风控审批、模拟执行、适配器认证和人工确认全部通过，该清单也只会标记为人工路由复核候选，继续固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`，不会提交真实订单或解锁实盘路由。

Batch 2 已启动 P2 实盘前验收回读：后端新增 `quant_core.p2_acceptance` 和 `GET /api/p2/pre-live/acceptance/latest`，默认读取 `data/p2-pre-live-acceptance.json` 并投影为 `aiqt.p2PreLiveAcceptanceStatus`。该校验会拒绝任何开启 `orderSubmissionEnabled`、`liveTradingAllowed`、`liveOrderSubmitted`、`routeExecuted` 或缺失 `liveBlockedBoundary` 的 manifest；前端新增 `loadP2PreLiveAcceptanceLatest` 和 `buildP2PreLiveAcceptanceSummary`，Execution 与 Audit 都会显示来源、上下文、适配器、清单状态、闸门、阻断项和审计 id。该回读只证明实盘前材料可复核，仍不提交真实订单、不连接真实券商、不改变 `liveTradingAllowed=false`。

Batch 3 已新增 Adapter Chain Health Rollup：`terminal-workbench` 会把实盘适配器从密钥引用、密钥物化、清单校验、环境绑定、运行时重载、受控编排、人工确认、sandbox 探针、生产路由复核、订单 schema dry-run、paper lifecycle、paper route runbook、ops state 到 adapter paper execution 的 19 段证据链聚合成每个 live adapter 的健康总览。Execution 新增紧凑“适配器链路健康”面板，Settings 在真实适配器健康检查下方展示同一份链路状态，显示完成进度、当前阻塞点、最近证据和 live-blocked 边界；完整链路也只标记为 paper-only/manual-review candidate，继续固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`，不连接真实券商、不提交任何订单。

Batch 4 已启动 Paper Execution Replay Gate：`terminal-workbench` 新增 `buildPaperExecutionReplayGate`，把当前审计 run 的单标的 paper execution、组合委托账本、组合审批、组合模拟成交、状态历史、组合 replay、adapter paper execution 和 live-blocked 边界聚合成一个回放完整性闸门。Execution 工作区会在晋级队列前显示“纸面执行回放闸门”，明确缺证据、证据绑定旧 run、回放警告或适配器模拟执行缺失时不能进入实盘前复核；即使所有回放证据齐全，也只显示为人工复核材料，继续固定 `preLiveReviewAllowed=false`、`orderSubmissionEnabled=false`、`liveTradingAllowed=false`。

Batch 4 的回放闸门已经接入晋级链路：`buildPreLiveReadinessChecklist` 现在会把 `paper-execution-replay` 作为第 6 个 gate，只有 replay gate 达到 `replay_ready` 才能继续成为 manual-route candidate；P2 pre-live acceptance manifest 也把 `paper-execution-replay` 设为 required check，缺少该检查的 manifest 会被标记为 invalid。Batch 4 剩余的便携证据也已完成：后端新增 `quant_core.p2_paper_replay` 和 `GET /api/p2/paper-replay/latest`，默认回读 `data/p2-paper-replay.json` 并校验 `aiqt.p2PaperReplayManifest`；前端新增 `loadP2PaperReplayLatest` 和 `buildP2PaperReplaySummary`，Execution 会在回放闸门旁显示本地 replay manifest 的通过/缺失/无效状态、8 项回放检查、最新证据、警告数和 live-blocked 边界。任何声称开启下单、允许实盘、提交实盘订单、执行真实路由、缺少 `liveBlockedBoundary` 或缺少必要 replay 检查的 manifest 都会被标记为 invalid。

Batch 5 已完成 Operator Runbook 闭环：前端模型新增 `buildOperatorRunbookSummary`、`buildOperatorRunbookMarkdown`、`buildOperatorRunbookAuditCoverage` 和 `buildOperatorRunbookAuditEvent`，把 pre-live checklist、paper execution replay、adapter chain health、P2 acceptance 和 safety boundary 聚合成一页操作员运行手册，并能复制、下载、审计入账为 `operator_runbook_report`。Execution 工作区新增“操作员运行手册”面板，集中显示急停、回滚负责人、仓位限制、数据新鲜度、环境状态、审计包路径和审计覆盖状态；Audit ledger 已能识别 `aiqt.operatorRunbookReport`，并判断当前手册是未入账、已匹配还是控制项/section 状态过期。该手册仍固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`、`liveOrderSubmitted=false`、`routeExecuted=false`，只作为未来 sandbox/live connector 前的人工复核材料。

Batch 6 已补齐 P2 证据覆盖矩阵：前端模型新增 `buildP2ReadinessEvidenceCoverage`，把 P2 paper replay manifest、P2 pre-live acceptance manifest、operator runbook audit coverage、pre-live checklist、adapter chain health 和 safety boundary 汇总成 6 条 readiness claim，并标记 covered、missing、stale 或 blocked。Execution 工作区新增“P2 证据覆盖矩阵”，可以直接看到每条 readiness 声明追溯到哪个本地 manifest、审计事件或本地状态；如果 replay manifest 缺失、P2 acceptance 不安全、operator runbook 审计过期或 adapter chain 阻断，矩阵会显示阻断。该矩阵同样只提供预实盘信心，不会改变 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`。

Batch 7 已新增 P2 顶层验收门禁：前端模型新增 `buildP2ReadinessAcceptanceSummary`，把 P1 acceptance、paper execution replay、pre-live checklist、P2 pre-live manifest、readiness evidence coverage 和 live-blocked boundary 映射成 6 项 P2 验收定义。Execution 工作区新增“P2 顶层验收门禁”，先给出 accepted、incomplete 或 blocked 的整体判断，再向下展示证据覆盖矩阵与操作员手册；即使 6 项全部通过，该门禁也只表示预实盘材料可复核，仍固定 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`、`liveOrderSubmitted=false`、`routeExecuted=false`。

Batch 8 已新增 P2 顶层验收 manifest 回读：后端新增 `quant_core.p2_readiness_acceptance` 和 `GET /api/p2/readiness/acceptance/latest`，默认读取 `data/p2-readiness-acceptance.json` 并投影为 `aiqt.p2ReadinessAcceptanceStatus`。该校验会要求 P1 acceptance、paper replay、P2 pre-live manifest、operator runbook、证据覆盖矩阵和 live-blocked boundary 都具备可追溯证据，并拒绝任何开启 `orderSubmissionEnabled`、`liveTradingAllowed`、`liveOrderSubmitted` 或 `routeExecuted` 的 artifact；Execution 的 P2 顶层门禁现在会显示 manifest 来源、run id、验收项数量、coverage 状态和安全边界，仍只作为预实盘复核材料，不授权真实下单。

Batch 9 已新增 P2 Audit 复核与便携备注：`terminal-workbench` 新增 `buildP2ReadinessAcceptanceReviewMarkdown`，Audit 工作区新增“P2 顶层验收复核”面板，复用 `/api/p2/readiness/acceptance/latest` 的同一份回读证据，展示 manifest 来源、run id、市场上下文、适配器、上游 manifest 路径、验收 criteria、审计事件、coverage 状态和实盘阻断边界。该面板支持复制、下载和刷新复核 Markdown，方便个人或小团队留档，仍不授权真实下单。

Batch 10 已新增 P2 顶层验收复核审计入账：`terminal-api` 新增 `buildP2ReadinessAcceptanceReviewAuditEvent`，Audit 的 P2 顶层验收复核面板新增“入账/Record”动作，可把当前复核保存为 `p2_readiness_acceptance_review` 审计事件。该事件保存 Markdown sha256、文件名、manifest 状态、来源、run id、市场上下文、适配器、criteria、上游 manifest、审计事件、manifest 报告的实盘字段和平台强制的 `orderSubmissionEnabled=false / liveTradingAllowed=false / liveOrderSubmitted=false / routeExecuted=false` 边界，但不把完整 Markdown 正文塞进账本。Audit 报告历史现在会拉取这一类事件，`buildAuditEvidenceReportLedgerRows` 也会把它识别为 `aiqt.p2ReadinessAcceptanceReview`，支持按 `p2_readiness_acceptance_review`、标的、状态和短 hash 搜索，用于个人或小团队复核 P2 预实盘证据链。

Batch 11 已新增 P2 顶层验收 Docker smoke 聚合：`tools/docker_smoke.py` 新增 `--p2-readiness-acceptance`、`--p2-readiness-acceptance-report` 和 `--validate-p2-readiness-acceptance-report`，可以读取已归档的 `aiqt.p1AcceptanceManifest`、`aiqt.p2PreLiveAcceptanceManifest` 和 `aiqt.p2PaperReplayManifest`，校验三份证据都保持 paper-only/live-blocked 后生成 `aiqt.p2ReadinessAcceptanceManifest`。根脚本新增 `docker:smoke:p2` / `docker:smoke:p2:validate`；该命令不会自动伪造 P2 paper replay 或 pre-live 证据，缺文件或任一 manifest 声称开启下单、实盘、实盘订单或真实路由都会失败，仍不授权真实交易。

Batch 12 已新增 P2 paper replay manifest 生成器：`quant_core.p2_paper_replay.build_p2_paper_replay_manifest_from_export_package` 可以从研究运行导出包生成 `aiqt.p2PaperReplayManifest`，并要求导出包已经包含单标的 paper execution、组合 paper order、审批、模拟成交、状态回放、adapter paper execution 和 live-blocked 边界。`tools/docker_smoke.py --p2-paper-replay` 会从 `data/p1-acceptance.json` 推导 run id，拉取 `/api/research/runs/{runId}/export`，通过严格校验后写入 `data/p2-paper-replay.json`；根脚本新增 `docker:smoke:p2:paper-replay`。该命令不会替用户创建组合委托、审批或适配器执行证据，缺证据或任何实盘字段不安全都会失败，仍不授权真实交易。

Batch 13 已新增 P2 pre-live acceptance manifest 生成器：`quant_core.p2_acceptance.build_p2_pre_live_acceptance_manifest` 可以读取 `aiqt.p1AcceptanceManifest` 和 `aiqt.p2PaperReplayManifest`，生成带有 `adapter-certification` 与 `human-confirmation` 阻断项的 `aiqt.p2PreLiveAcceptanceManifest`。`tools/docker_smoke.py --p2-pre-live-acceptance` 会把这一步写成 `data/p2-pre-live-acceptance.json`，根脚本新增 `docker:smoke:p2:pre-live`；该 manifest 只证明预实盘清单材料可复核，明确保持 `manualRouteCandidate=false`、`orderSubmissionEnabled=false`、`liveTradingAllowed=false`、`liveOrderSubmitted=false` 和 `routeExecuted=false`，不会把纸面回放直接升级成实盘可执行。

Batch 14 已新增 P2 manifest 链式验收入口：`tools/docker_smoke.py` 新增 `--validate-p2-paper-replay-report` 和 `--validate-p2-pre-live-acceptance-report`，根脚本新增 `docker:smoke:p2:paper-replay:validate`、`docker:smoke:p2:pre-live:validate` 和 `docker:smoke:p2:chain`。`docker:smoke:p2:chain` 会在同一次容器 smoke 中按顺序生成 paper replay、pre-live acceptance 和顶层 readiness acceptance 三份 manifest；三个 validate 命令可以离线复核归档文件，不会启动 Docker，也不会合成缺失证据。该链式入口只把 P2 证据生成和校验产品化，仍不授权实盘交易。

Batch 15 已新增 P2 manifest 链 preflight：`tools/docker_smoke.py --p2-chain-preflight-report` 会离线检查 `data/p1-acceptance.json`、`data/p2-paper-replay.json`、`data/p2-pre-live-acceptance.json` 和 `data/p2-readiness-acceptance.json`，复用各层严格 validator 后写出 `aiqt.p2ManifestChainPreflight` 到 `data/p2-chain-preflight.json`。根脚本新增 `docker:smoke:p2:preflight`；报告会标记每一层为 `valid / missing / invalid`，给出第一个阻断项、下一步动作和推荐命令。该能力只帮助操作者知道 P2 链卡在哪里，不启动 Docker、不写假证据、不改变任何交易权限。

Batch 16 已新增 P2 manifest 链 preflight 产品回读：后端新增 `quant_core.p2_manifest_chain_preflight` 和 `GET /api/p2/manifest-chain/preflight/latest`，会把 `data/p2-chain-preflight.json` 投影为 `aiqt.p2ManifestChainPreflightStatus`，严格校验 stage 顺序、valid 数、blockerIds、下一步命令和 live-blocked 边界。前端新增 typed loader、`buildP2ManifestChainPreflightSummary` 和 Execution 工作区的“P2 manifest 链路预检”面板，直接展示四段证据链、当前阻断点和推荐命令；缺失或无效状态仍只引导操作者补证据，不启动 Docker、不连接券商、不改变 `orderSubmissionEnabled=false / liveTradingAllowed=false`。

Batch 17 已新增 P2 manifest 链 preflight 产品内生成入口：后端把链路预检生成器下沉到 `quant_core.p2_manifest_chain_preflight`，新增 `POST /api/p2/manifest-chain/preflight`，可以读取当前数据目录里的 P1 acceptance、P2 paper replay、P2 pre-live acceptance 和 P2 readiness acceptance 报告，写出 `data/p2-chain-preflight.json` 并返回严格校验后的 `aiqt.p2ManifestChainPreflightStatus`。前端新增 `generateP2ManifestChainPreflight` 和 Execution 面板的“生成预检”动作，让 Docker/本地部署不必手动进容器运行预检命令即可更新页面状态；该动作只校验已有 manifest 并写 preflight，不生成缺失上游证据、不运行 Docker、不连接券商、不提交订单，仍固定 `orderSubmissionEnabled=false / liveTradingAllowed=false / liveOrderSubmitted=false / routeExecuted=false`。

Batch 18 已新增 P2 manifest 链 preflight 审计入账：`POST /api/p2/manifest-chain/preflight` 现在会把生成后的 `aiqt.p2ManifestChainPreflight` 转成 `p2_manifest_chain_preflight` 审计事件，metadata 保存状态、stage 覆盖、阻断项、下一步动作、manifest sha256 和所有安全字段；前端 typed client 会保留返回的 `auditEvent`，Execution 面板生成预检后会显示对应审计事件 id。Audit 报告台账也会拉取并识别这类事件，支持按状态、阻断项和下一步动作搜索，但签名、验签和撤销控件保持禁用。该事件只用于证明“这次预检报告由产品服务生成并入账”，不会伪造上游 P1/P2 manifest、不运行 Docker、不进入签名研究包、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 19 已新增 P2 manifest 链 preflight 审计定位闭环：前端新增 `buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery`，把 event id、短 hash、文件路径、状态、stage 覆盖、下一步动作和阻断项组合成稳定查询；Execution 面板的“审计”动作现在不再只是切换到 Audit，而是写入同一条查询并同步 URL，让操作者能直接定位刚生成的 `p2_manifest_chain_preflight` 事件。若账本分页尚未回读到该事件，前端会用生成响应中的 event id 和当前 preflight 摘要构造 fallback 查询。该能力只增强证据可追踪性，不重新生成 preflight、不签名辅助事件、不提交模拟或实盘委托，也不放宽 live-blocked 边界。

Batch 20 已新增 P2 readiness acceptance 产品内生成入口：后端把顶层 readiness acceptance 聚合器下沉到 `quant_core.p2_readiness_acceptance`，新增 `POST /api/p2/readiness/acceptance`，读取并严格校验本地 `data/p1-acceptance.json`、`data/p2-paper-replay.json` 和 `data/p2-pre-live-acceptance.json` 后写出 `data/p2-readiness-acceptance.json`，再返回 validated `aiqt.p2ReadinessAcceptanceStatus`。前端新增 `generateP2ReadinessAcceptance` 和 Execution 顶层 P2 验收卡的“生成验收”动作，让本地/Docker 部署可以在产品内完成 P2 readiness manifest 聚合，而不必手动运行 smoke 命令。该动作不会创建缺失上游证据、不运行 Docker、不连接券商、不提交订单，仍固定 `orderSubmissionEnabled=false / liveTradingAllowed=false / liveOrderSubmitted=false / routeExecuted=false`。

Batch 21 已新增 P2 readiness acceptance 生成审计事件：`POST /api/p2/readiness/acceptance` 现在会把生成后的 `aiqt.p2ReadinessAcceptanceManifest` 转成 `p2_readiness_acceptance_generated` 审计事件，metadata 保存 manifest 状态、run id、上游 manifest 路径、criteria 覆盖、manifest sha256 和所有安全字段；前端 typed client 会保留返回的 `auditEvent`，Execution 的 P2 顶层验收卡生成后会显示对应审计事件 id。该事件只证明“这次顶层验收 manifest 由产品服务生成并入账”，不会伪造上游证据、不运行 Docker、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 22 已新增 P2 readiness acceptance 生成事件的 Audit 定位闭环：Audit 报告台账现在会拉取并识别 `p2_readiness_acceptance_generated`，按 manifest hash、source path、验收状态、criteria 覆盖、run id 和标的上下文建立稳定搜索；前端新增 `buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery`，Execution 顶层 P2 验收卡的“审计”动作会切到 Audit 并写入确定性查询，分页尚未回读时也能用当前 readback 构造 fallback 查询。该事件在 Audit 行内显示为只读审计辅助证据，签名、验签、撤销控件保持禁用，不进入签名链、不提交订单，也不放宽 live-blocked 边界。

Batch 23 已新增 P2 readiness acceptance 复核事件的 Audit 定位闭环：前端新增 `buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery`，把 review event id、短 hash、Markdown 文件名、标的上下文、验收状态和 criteria 覆盖组合成稳定查询；Audit 工作区的 P2 顶层验收复核面板在入账成功后会保留并显示返回的 `p2_readiness_acceptance_review` 事件 id，点击“审计”会写入该查询并定位台账行，分页尚未回读时也会用保存响应 metadata 和当前 readback 构造 fallback 查询。该能力只增强人工复核备注的追踪性，不重新生成 manifest、不进入实盘授权、不提交订单，也不放宽 live-blocked 边界。

Batch 24 已新增 P2 readiness acceptance 审计事件 id 回填：前端新增 `findLatestP2ReadinessAcceptanceAuditLedgerRow`，从已加载 Audit 台账行中按 `reportKind`、run id、market、symbol 和 timeframe 查找当前 readiness 上下文最近的 generated/review 事件。Execution 顶层验收卡和 Audit 复核面板现在会优先显示本次操作返回的事件 id，若页面刷新后 transient state 丢失，则回退到 ledger 中最近匹配的事件 id，并让“审计”按钮继续使用对应稳定 query。该回填只读取前端已加载的台账，不自动生成或写入事件，不跨标的/旧上下文误匹配，也不改变 live-blocked 边界。

Batch 25 已新增 P2 readiness acceptance 事件来源标记和 review 搜索语义收口：前端新增 `resolveP2ReadinessAcceptanceAuditEventReference`，把 generated/review 事件 id 的来源明确区分为本次响应、Audit 台账回填或未定位；Execution 顶层验收卡与 Audit 复核面板会在事件 id 旁显示对应来源，避免把刷新后回填的既有证据误解为新授权。`p2_readiness_acceptance_review` 台账行的 `searchText` 也补齐 review 类型、run id、上下文、criteria、上游 audit ids 和 live-blocked 边界，Audit 搜索与回填语义保持同源。该能力只增强证据解释和检索，不写新账本、不进入签名链、不提交订单，也不放宽 live-blocked 边界。

Batch 26 已收紧 P2 readiness acceptance review 的签名边界：前端抽出统一的 `auditReportLedgerRowIsSigningEligible` 规则，`buildAuditEvidenceReportLedgerSummary`、证据包控制室的 signature state 和 Audit 报告行级签名/验签/撤销按钮现在都会把 `p2_readiness_acceptance_review` 排除出签名资格。即使旧 review 事件 metadata 携带 signature 字段，也不会让 signing eligible 计数、签名链状态或证据包归档状态被误提升。该修正只修复审计辅助材料的签名边界，不修改事件内容、不撤销历史事件、不触发订单或实盘授权。

Batch 27 已把 Audit 报告行级签名控件彻底收口到同一条 `auditReportLedgerRowIsSigningEligible` 规则：页面上的签名、验签和撤销按钮不再维护独立的 report kind 排除列表，因此 `operator_runbook_report`、P2 generated/review、pre-live runbook、research context readiness 和 P0 readiness 这类审计辅助行会和模型层、证据包控制室保持一致地不可签名。该修正只减少前端签名边界漂移，不改变任何审计事件 metadata、不撤销历史签名、不提交订单，也不放宽 live-blocked 边界。

Batch 28 已收紧 P2 readiness acceptance 审计事件回填的上下文匹配：`findLatestP2ReadinessAcceptanceAuditLedgerRow` 现在把 row id、run id、文件名、focus query 和 search text 规范化为 token 后做精确匹配，避免 `600000` 被较新的 `6000001` 事件用子串方式误命中。该修正只影响 Execution 顶层验收卡和 Audit 复核面板刷新后的既有事件 id 定位，不生成 manifest、不写新账本、不修改签名链、不提交订单，也不放宽 live-blocked 边界。

Batch 29 已把 P2 readiness acceptance 的“本次响应”事件 id 也纳入同一套上下文校验：`resolveP2ReadinessAcceptanceAuditEventReference` 接收当前 readback 的 run、market、symbol 和 timeframe，只有 response event 的 metadata/run/detail/search token 与当前上下文匹配时才显示为 `response` 来源。这样用户生成或入账一个标的后切到另一组 readiness readback 时，旧 response id 不会继续压过当前 ledger 回填或未定位状态。该修正只防止前端 stale event id 误展示，不修改审计事件、不生成新证据、不触发签名或订单，也不放宽 live-blocked 边界。

Batch 30 已统一 P2 readiness acceptance 事件回填和 response 校验的 token 化规则：row id、run id、文件名、focus query、search text、response summary/detail 和 metadata 现在会按逗号、斜杠、分号等常见分隔符拆成精确 token，保留 `run-p2-readiness` 这类带连字符的 id。这样旧事件把上下文写成 `ashare,600000,1d` 仍可被回填，同时继续避免 `600000` 子串误匹配 `6000001`。该修正只提升旧审计文本兼容性，不修改账本、不生成新证据、不触发签名或订单，也不放宽 live-blocked 边界。

Batch 31 已把 P2 readiness acceptance ledger row 的 `detail` 文本纳入同一套回填 token：`findLatestP2ReadinessAcceptanceAuditLedgerRow` 现在会从 row id、run id、文件名、focus query、search text 和 detail 中提取精确 token。这样早期或手工恢复的 generated/review 行即使只在 detail 中保留 `run-p2-readiness,ashare,600000,1d`，也能被当前上下文回填；缺字段的 legacy row 会被安全忽略空值。该修正只提升旧审计行可定位性，不修改账本、不生成新证据、不触发签名或订单，也不放宽 live-blocked 边界。

Batch 32 已让 P2 readiness acceptance generated/review 的 ledger query builder 与回填 token 保持一致：`buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery` 和 `buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery` 会在稳定前缀后追加 row detail 与 search text。这样顶层验收卡和 Audit 复核面板生成的台账查询可以携带 live-blocked、criterion、旧上下文等可搜索 token，减少跳转后漏定位；该修正只影响前端查询字符串，不修改审计事件、不生成证据、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 33 已把 P2 readiness acceptance generated/review 的 ledger query builder 输出做成按 token 去重：稳定前缀仍先写入 report kind、事件 id、hash、文件名和 focus query，后续 detail/search text 只补充尚未出现过的 token。这样 Audit 按钮查询不会重复写入 `ashare`、`run-p2-readiness` 等上下文词，查询更短、更易读，同时仍能定位包含 live-blocked 和 criterion 证据的同一行；该修正只影响前端查询字符串，不修改账本、不生成证据、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 34 已把 P2 readiness acceptance generated/review 的 ledger 回填函数补成缺 `runId` 容错：`findLatestP2ReadinessAcceptanceAuditLedgerRow` 现在会安全读取 row 顶层 `runId`，如果旧行没有该字段，则继续依赖 row id、文件名、focus query、search text 和 detail 的精确 token 来匹配当前 run。这样手工恢复或早期生成的旧 ledger row 不会因为缺字段导致界面崩溃，也不会放宽 `600000` 等上下文 token 的精确匹配；该修正只影响前端既有审计行定位，不修改账本、不生成证据、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 35 已把 P2 readiness acceptance generated/review 的 ledger 回填状态判断改为大小写无关的 `ready` 规范化：`findLatestP2ReadinessAcceptanceAuditLedgerRow` 会安全读取 row status 并 trim/lowercase 后比较，所以手工恢复的 `READY` 行仍可回填；其它状态仍被排除。该修正只提升 legacy ready 行兼容性，不修改账本、不生成证据、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 36 已把 P2 readiness acceptance generated/review 的 ledger token 化改为 legacy 字段类型安全：`auditReportSearchTokenSet` 现在只跳过 null/undefined，其它 token 来源会先 `String(value)` 再按同一套分隔符拆分。这样旧账本行如果把 detail/searchText 等字段保存成数字或布尔，不会让 Execution/Audit 回填崩溃；匹配仍要求 run、market、symbol 和 timeframe 的精确 token。该修正只影响前端既有审计行定位，不修改账本、不生成证据、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 37 已把同一套 primitive-safe token 转换推广到 P2 readiness acceptance 的 response event 来源解析：`resolveP2ReadinessAcceptanceAuditEventReference` 现在会安全读取 response event id、run id、summary/detail 和 metadata，即使旧响应把 event id 写成数字、run id 写成布尔或 symbol 写成数字，也会先文本化再用精确 token 校验当前上下文。这样 malformed response 不会让 Execution/Audit 事件 id 来源显示崩溃，也不会绕过 run、market、symbol、timeframe 匹配；该修正只影响前端 transient response/ledger 定位，不修改账本、不生成证据、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 38 已把同样的来源解析能力补到 P2 manifest 链路预检面板：`findLatestP2ManifestChainPreflightAuditLedgerRow` 会按 source path、preflight 状态、stage 计数、下一步动作和 blocker ids 从 Audit 报告台账回填当前上下文的 `p2_manifest_chain_preflight` 事件，`resolveP2ManifestChainPreflightAuditEventReference` 会优先使用匹配的本次响应，否则回落到 ledger row，并把来源标成“本次响应”或“台账回填”。preflight 查询串也会追加 detail/searchText 并去重，便于旧台账行携带 blocker 和 live-blocked 证据词；该修正只影响前端审计定位和可解释性，不修改账本、不生成 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 39 已新增 P2 manifest 链路预检复核入账：Audit 工作区新增独立复核面板，可把当前 preflight readback 生成 Markdown 并复制、下载或保存为 `p2_manifest_chain_preflight_review` 事件。事件 metadata 只记录 artifact kind、文件名、内容 hash、source path、stage id/status、valid/total、blockers、下一步动作和强制 live-blocked 边界，不保存 Markdown 正文；Audit 报告台账会识别该 review 行，提供稳定查询和来源回填，但继续排除签名资格。该能力只服务人工复核和证据追踪，不重新生成 preflight、不修改 manifest、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 40 已把 P2 manifest 链路预检复核纳入 P2 evidence coverage：`buildP2ReadinessEvidenceCoverage` 现在可接收当前 `P2ManifestChainPreflightSummary` 和匹配的 `p2_manifest_chain_preflight_review` 台账行，并在证据矩阵中新增 `p2-manifest-chain-preflight-review` 覆盖项。匹配 review 行存在且 hash ready 时显示 `Review audited · <short hash>` 并计入 covered；当前预检已有 readback 但 review 未入账时显示 `Review not recorded`，让 coverage 从 7/7 降为 6/7；无效或 unsafe preflight 仍会阻断该覆盖项。该能力只让 Execution 直接暴露人工复核是否可追踪，不自动写 review、不重新生成 preflight、不修改签名链、不提交订单，也不放宽 live-blocked 边界。

Batch 41 已把 P2 evidence coverage 的 audit-backed 行接入行级审计定位：Execution 证据矩阵会在 `operator-runbook-audit` 和 `p2-manifest-chain-preflight-review` 两类审计来源行显示“审计 / Audit”动作，分别复用 Operator runbook audit 查询和 P2 manifest preflight review 查询，点击即可进入 Audit 工作区定位对应台账行。该能力只让操作者从 readiness claim 直接跳到只读审计证据，不创建新 review、不修改 manifest、不改变签名资格、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 42 已把 P2 evidence coverage 从 audit-backed 行扩展为全行证据导航：`paper-replay-manifest`、`p2-acceptance-manifest`、`pre-live-checklist`、`adapter-chain-health` 和 `safety-boundary` 也会显示行级动作，分别以“清单 / Manifest”“工作区 / Workspace”或“边界 / Boundary”进入 Execution 或 Settings 的对应证据上下文；两类 audit 行仍进入 Audit 工作区并写入稳定查询。该能力只恢复只读工作区上下文和状态提示，不补造 manifest、不写审计事件、不签名、不提交订单，也不改变 live-blocked 边界。

Batch 43 已新增 P2 evidence coverage 复核入账闭环：Audit 工作区新增“P2 证据覆盖复核”面板，可把当前 coverage matrix 生成 Markdown、复制、下载或保存为 `p2_readiness_evidence_coverage_review` 审计事件；事件 metadata 只保存内容 hash、覆盖状态、covered/total/blocking 计数、row ids/statuses、source types/source ids 和 live-blocked 边界，不保存 Markdown 正文。Audit 报告台账现在识别该 report kind，提供稳定查询、搜索文本和不可签名边界。该能力只让 P2 readiness coverage 成为便携复核证据，不创建缺失证据、不进入签名链、不提交订单，也不放宽 live-blocked 边界。

Batch 44 已把 P2 evidence coverage 复核事件接入上下文回填：`findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow` 会用当前 coverage 的状态、covered/total、row ids/statuses、source types/source ids 精确匹配 `p2_readiness_evidence_coverage_review` 台账行，`resolveP2ReadinessEvidenceCoverageReviewAuditEventReference` 会优先接受匹配的本次响应，否则回落到匹配 ledger row。Audit 面板现在能标出“本次响应 / 台账回填 / 未定位”，避免刷新或旧响应把不同 coverage 阶段的 review id 显示到当前复核卡上。该能力只提升已有审计事件定位，不创建 review、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 45 已把 P2 evidence coverage review 串进顶层 readiness acceptance 复核：`buildP2ReadinessAcceptanceSummary` 现在可接收当前匹配的 coverage review event id，并把 `readiness-evidence-coverage` criterion 的 source 指向该 `p2_readiness_evidence_coverage_review` 行；P2 readiness acceptance Markdown 会在 Summary 和 Audit Evidence 中列出该 id，`buildP2ReadinessAcceptanceReviewAuditEvent` 也会把它写入 `currentEvidenceCoverageReviewAuditEventId` metadata。Audit 面板同步显示“Coverage review / 覆盖复核”来源。该能力只增强已有审计事件的追溯链，不自动记录 review、不修改后端 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 46 已把 P2 顶层 acceptance review 的台账回填升级为 coverage-review-aware：`p2_readiness_acceptance_review` 行的 search/query token 会包含 `currentEvidenceCoverageReviewAuditEventId`，`findLatestP2ReadinessAcceptanceAuditLedgerRow` 和 `resolveP2ReadinessAcceptanceAuditEventReference` 在 review 场景会同时校验 run 上下文和当前 coverage review id。这样相同 run/market/symbol/timeframe 但引用旧 coverage review 的 review 行或 stale response 不会误占当前复核。该能力只增强 Audit 定位和刷新回填，不生成新 review、不修改后端 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 47 已把顶层 acceptance review 到 evidence coverage review 的链路做成可操作审计定位：`AuditEvidenceReportLedgerRow` 会回读 `p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId`，新增 `buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery` 生成 `p2_readiness_evidence_coverage_review <event id>` 查询；Audit 的 P2 顶层验收复核面板新增“覆盖复核 / Coverage review”按钮，可直接跳回被引用的 coverage review 台账证据。该入口只恢复只读查询上下文，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 48 已补齐 evidence coverage review 到顶层 acceptance review 的反向审计定位：新增 `buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery`，Audit 的 P2 证据覆盖复核面板新增“顶层复核 / Acceptance review”按钮，会筛选引用当前 `p2_readiness_evidence_coverage_review` 的 `p2_readiness_acceptance_review` 台账行，找不到完整行时降级为 event id 查询。该入口只让双向审计追踪闭环更完整，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 49 已把这条 linked coverage review 链路直接暴露到 Audit 报告台账行：`p2_readiness_acceptance_review` row 现在带有 `p2ReadinessAcceptanceCoverageReviewLinkLabel` 和 `p2ReadinessAcceptanceCoverageReviewLinkQuery`，可按 “linked coverage review” 搜索，并在台账行内显示“覆盖复核 / Coverage review”标签及 focus/copy 动作。该能力只提升既有审计关系的可见性和可复制性，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 50 已补齐 Audit 报告台账里的反向可见性：`buildAuditEvidenceReportLedgerRows` 会在生成全部 row 后，用 `p2_readiness_acceptance_review` 行引用的 `currentEvidenceCoverageReviewAuditEventId` 回填对应 `p2_readiness_evidence_coverage_review` row 的 `p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel` 和 `p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery`。Coverage review 行现在会显示“顶层复核 / Acceptance review”标签，并提供 focus/copy 动作。该能力只把已存在的跨 row 审计关系变成可见、可搜索、可复制的只读链路，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 51 已把最新 P2 复核链提升到 Audit 报告台账 summary：`buildAuditEvidenceReportLedgerSummary` 会选择最新已链接 coverage review 的 `p2_readiness_acceptance_review`，输出 `latestP2ReadinessLinkedAcceptanceReviewEventId/Query` 和 `latestP2ReadinessLinkedCoverageReviewEventId/Label/Query`。Audit toolbar 显示“P2 复核链 / P2 review chain”，可直接 focus/copy 顶层复核和 coverage review 查询。该能力只聚合已存在的审计关系，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 52 已给最新 P2 复核链补上组合查询：新增 `buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery`，用 acceptance review event id 与 linked coverage review event id 生成能同时命中两条 row 的短查询；summary 新增 `latestP2ReadinessReviewChainLabel/Query`，Audit toolbar 提供“定位复核链 / Focus review chain”和“复制复核链链接 / Copy review chain link”。该能力只把已存在的双向审计关系一次性筛出，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 53 已把 P2 复核链从“最新一条”扩展到“当前页全部链路”：`buildAuditEvidenceReportLedgerSummary` 新增 `p2ReadinessReviewChainCount` 和 `p2ReadinessReviewChainsQuery`，统计 ready acceptance review 中已链接 coverage review 的行数；linked acceptance/coverage review 行都会带上 `linked review chain` token。Audit toolbar 现在显示“全部复核链 / All review chains”数量，并可 focus/copy 全部链路查询。该能力只筛选已有审计行，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 54 已把整条 P2 复核链入口下沉到 Audit row：`AuditEvidenceReportLedgerRow` 新增 `p2ReadinessReviewChainLabel/Query`，acceptance review 行在构造时生成整链 label/query，coverage review 行在反向回填时复用同一查询。行内显示“整条复核链 / Review chain”，并提供 focus/copy 动作。该能力只让任意 linked row 都能直接筛出对应 acceptance+coverage review 两行，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 55 已给 P2 复核链增加当前页缺口诊断：linked acceptance review 行现在会标记 `p2ReadinessReviewChainCoverageLoaded` 与 `p2ReadinessReviewChainStatusLabel/Query`；如果被引用的 coverage review row 不在当前台账 rows 中，行内显示“复核链缺 coverage / Review chain missing coverage”，summary 统计 `p2ReadinessReviewChainMissingCoverageCount` 并提供 `review-chain-coverage-missing` 查询。该能力只帮助操作者发现当前页未完整加载的既有审计链，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 56 已把 P2 复核链缺口诊断补成双向闭环：coverage review 行如果没有当前页顶层 acceptance review 引用，会标记 `p2ReadinessReviewChainAcceptanceLoaded=false`、显示“复核链缺顶层复核 / Review chain missing acceptance”，summary 新增 `p2ReadinessReviewChainMissingAcceptanceCount/Query`，Toolbar 可用 `review-chain-acceptance-missing` 定位 orphan coverage review。全部已链接复核链的 query 也收紧为 `linked-review-chain`，降低空格分词和 run id 子串误命中。该能力仍只做只读诊断和过滤，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 57 已给 P2 复核链缺口增加总览入口：所有缺 coverage 或缺顶层 acceptance 的 row 都会带 `review-chain-gap` token，summary 新增 `p2ReadinessReviewChainGapCount` 与 `p2ReadinessReviewChainGapsQuery`。Audit toolbar 现在显示“全部复核链缺口 / All chain gaps”，可一次 focus/copy 当前页全部不闭环复核链，同时保留 coverage-missing 与 acceptance-missing 细分入口。该能力只聚合既有只读诊断，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 58 已把 P2 复核链状态查询下沉到 Audit row 操作区：任何带 `p2ReadinessReviewChainStatusQuery` 的行现在都有“定位复核链状态 / Focus chain status”和“复制复核链状态链接 / Copy chain status link”按钮，可直接按 loaded、coverage-missing、acceptance-missing 或 all-gap 状态筛选当前台账。该能力只复用既有只读状态 query，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 59 已把 P2 复核链缺口总览补成“最新缺口”入口：`buildAuditEvidenceReportLedgerSummary` 会从缺 coverage 与缺顶层 acceptance 的 row 中按 `createdAt` 选出最新缺口，并暴露 `latestP2ReadinessReviewChainGapEventId/Label/Query`。Audit toolbar 显示“最新缺口 / Latest gap”，可直接 focus/copy 对应缺口 query。该能力只复用既有只读诊断，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 60 已给 P2 复核链增加自适应健康摘要：summary 新增 `p2ReadinessReviewChainHealthState/Label/Query`，有缺口时显示 `gaps` 并指向 `review-chain-gap`，没有缺口但有完整链时显示 `loaded` 并指向 `review-chain-loaded`，没有链路时保持 `empty`。Audit toolbar 的“复核链健康 / Chain health”可 focus/copy 当前页最需要复核的健康查询。该能力只复用既有 status token，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 61 已补上 P2 复核链健康上下文入口：`filterAuditEvidenceReportLedgerRows` 会为任何带 `p2ReadinessReviewChainStatusQuery` 的 row 派生 `review-chain-health` 搜索 token，summary 新增 `p2ReadinessReviewChainHealthContextCount/Query`。Audit toolbar 的“健康上下文 / Health context”可一次 focus/copy 当前页所有 loaded 与 gap 状态行，同时不把 token 写回 row searchText、不改变 row-level status query。该能力仍只读，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 62 已把 P2 复核链健康上下文下沉到 Audit row 操作区：`AuditEvidenceReportLedgerRow` 新增 `p2ReadinessReviewChainHealthContextQuery`，loaded、缺 coverage、缺顶层 acceptance 等状态行都会暴露 `review-chain-health`，并提供“定位行复核链健康上下文 / Focus row chain health context”和“复制行复核链健康上下文链接 / Copy row chain health context link”。该能力只让任意状态行跳回当前页全部健康上下文，不改变原始 row-level status query，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 63 已给 P2 复核链健康上下文补上说明 title 与分解：row 新增 `p2ReadinessReviewChainHealthContextTitle`，会标明 `health-context-loaded`、`health-context-missing-coverage` 或 `health-context-missing-acceptance` 以及对应 event id；summary 新增 `p2ReadinessReviewChainHealthContextTitle`，展示 context rows、loaded chains、gaps、missing coverage、missing acceptance 和最新缺口 event id。Audit toolbar 与 row 操作按钮会优先用该 title 做 tooltip，title 也参与只读搜索过滤。该能力仅解释和筛选既有审计行，不记录新事件、不修改 manifest、不签名、不提交订单，也不放宽 live-blocked 边界。

Batch 64 已新增个人/小团队可用性首屏摘要：`terminal-workbench` 新增 `buildPersonalTeamUsabilityReadinessSummary`，把 P0 本地纸面闭环、P1 研究运营、P2 预实盘证据链和 Audit 可追溯性聚合成个人本地 paper-only readiness 与小团队 internal-beta readiness。首页 P0 readiness 卡会在 P1 acceptance 后显示个人/团队百分比、强制 live-blocked 边界，以及最多 3 个当前缺口按钮；当前团队化缺口明确落在交接 runbook 与备份/恢复演练。该能力只解释和导航已有 P0/P1/P2/Audit 证据，不生成新 manifest、不运行 Docker、不记录审计事件、不连接券商、不提交订单，也不放宽 `orderSubmissionEnabled=false`、`liveTradingAllowed=false`。

Batch 65 已把小团队 readiness 的两个团队化缺口接入真实本地证据：`P0AcceptanceSummary` 与 `P1AcceptanceSummary` 新增 `importExportRoundTripReady`，只有 acceptance manifest 同时包含 `export`、`import`、`imported-export` 且保持 live-blocked 时才关闭备份/恢复缺口；`buildPersonalTeamUsabilityReadinessSummary` 新增 `handoffNoteCount` 输入，当前审计 run 已有本地 handoff notes 时关闭团队交接缺口。首页继续复用同一张个人/小团队可用性卡，但缺口状态会随着验收 round-trip 和交接备注实时变化。该能力只解释既有 acceptance/handoff 证据，不创建备注、不运行导入、不写新账本、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 66 已把个人/小团队 readiness 摘要推进为可留档复核材料：`terminal-workbench` 新增 `buildPersonalTeamUsabilityReadinessReviewMarkdown`，把首页同源 summary 输出为 Markdown；`terminal-api` 新增 `buildPersonalTeamUsabilityReadinessReviewAuditEvent`，以 `personal_team_readiness_review` 入账 SHA-256、ready/open gate、个人/团队百分比、next action 和强制 live-blocked metadata；首页个人/小团队卡新增复制、下载和入账复核动作，Audit history 查询也会回读这类事件。该能力只记录本地复核证据，不改变 readiness 判定、不生成缺失 handoff/restore 证据、不签名、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 67 已把个人/小团队 readiness 推进成首页 Daily Ops 控制台：`terminal-workbench` 新增 `buildDailyOpsControlRoomSummary`，把 P0 completion 当前缺口、个人/团队 readiness、最新 Audit 查询、团队交接和备份恢复状态派生为 4 条每日操作队列。首页新增“每日操作台”，提供当前主动作、打开 Audit 查询、复制 Audit 查询链接和行级跳转；Audit 定位复用既有 `workspace=audit&auditReportQuery=...` 深链。该能力只组织本地纸面操作和只读审计复核，不自动生成新事件、不运行 Docker、不运行流水线、不提交模拟或真实订单，也不放宽 paper-only/live-blocked 边界。

Batch 68 已把 Daily Ops 控制台推进为可交接、可留档的每日复核材料：`terminal-workbench` 新增 `buildDailyOpsControlRoomReviewMarkdown`，把 4 条队列、当前主动作、Audit 查询和 live-blocked 安全边界导出为 Markdown；`terminal-api` 新增 `buildDailyOpsControlRoomReviewAuditEvent`，以 `daily_ops_control_room_review` 入账 Markdown SHA-256、队列状态、打开项、主动作、Audit 查询和安全旗标 metadata；首页 Daily Ops 卡新增复制复核、下载复核和入账复核动作，Audit history 与报告台账也会回读这类事件。该能力只记录用户显式确认的本地复核证据，不改变队列判定、不运行流水线、不签名、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 69 已给 Daily Ops 复核补上首页回填和新鲜度判断：`AuditEvidenceReportLedgerRow` 新增 Daily Ops 复核的 state、ready/review/blocking/total、queue item、open item、主动作和 Audit 查询字段；`buildDailyOpsControlRoomReviewReference` 会从台账中取最新 `daily_ops_control_room_review`，并与当前 Daily Ops summary 比较为 `current`、`stale` 或 `missing`。首页 Daily Ops 卡现在显示最新复核状态、event id 和时间，并可直接定位或复制该复核的 Audit 查询链接。该能力只解释既有复核事件是否仍匹配当前队列，不自动入账、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 70 已给个人/小团队 readiness 复核补上首页回填和新鲜度判断：`AuditEvidenceReportLedgerRow` 新增 `personal_team_readiness_review` 的 state、个人/团队百分比、ready/total、item ids/statuses、open items、下一动作和目标工作区字段；`buildPersonalTeamUsabilityReadinessReviewReference` 会从台账中取最新复核，并与当前 personal/team summary 比较为 `current`、`stale` 或 `missing`。首页个人/小团队可用性卡现在显示最新复核状态、event id 和时间，并可直接定位或复制该复核的 Audit 查询链接。该能力只解释既有复核事件是否仍匹配当前 readiness，不自动生成 handoff/restore 证据、不自动入账、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 71 已把个人/小团队复核和 Daily Ops 复核的结构化摘要下沉到 Audit 台账行：`terminal-workbench` 新增 `buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel/Title/Query` 与 `buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel/Title/Query`，让 `personal_team_readiness_review` 和 `daily_ops_control_room_review` 行能直接显示 state、ready/total、个人/团队百分比、review/blocking 数、open items 和下一动作。Audit 行 UI 现在显示两类复核 chip，并提供定位/复制该行复核查询的动作。该能力只增强既有复核事件的可读性和只读过滤，不自动入账、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 72 已把最新个人/小团队复核和最新 Daily Ops 复核上浮到 Audit 台账顶部摘要：`AuditEvidenceReportLedgerSummary` 新增 `latestPersonalTeamReadinessReview*` 与 `latestDailyOpsControlRoomReview*` 字段，分别暴露最新 ready 复核的 event id、短 hash、label、title 和 query；Audit toolbar 会显示“最新可用性复核”和“最新每日复核”，并提供定位/复制该复核查询的动作。该能力只复用既有 `personal_team_readiness_review` 与 `daily_ops_control_room_review` 行的只读搜索语义，不自动生成复核、不修改账本、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 73 已把个人/小团队复核与 Daily Ops 复核聚合为 Audit 台账顶部的“本地复核集”：两类复核行的前端 `searchText` 会派生共享 `local-review-bundle` token；`AuditEvidenceReportLedgerSummary` 新增 `localReviewBundleCount`、个人/小团队计数、Daily Ops 计数、最新复核 event id、总查询和 title；Audit toolbar 新增“定位本地复核集 / 复制本地复核集链接”。该入口只对当前页既有 `personal_team_readiness_review` 与 `daily_ops_control_room_review` 行做只读过滤和统计，不自动记录复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 74 已把本地复核集入口下沉到每条本地复核 row：`AuditEvidenceReportLedgerRow` 新增 `localReviewBundleContextQuery` 和 `localReviewBundleContextTitle`，个人/小团队复核与 Daily Ops 复核行都会暴露同一条 `local-review-bundle` 上下文查询，并把 title 纳入只读搜索。Audit 行操作区新增“定位行本地复核集 / 复制行本地复核集链接”，让操作者从任意复核证据返回整页本地复核集；该能力不写新复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 75 已给本地复核集补上“最新本地复核”入口：构造 Audit 台账行后会按 `createdAt` 标记当前页最新 ready 的 `personal_team_readiness_review` 或 `daily_ops_control_room_review`，在该 row 上回填 `localReviewBundleLatestLabel/Query/Title`，并把 `local-review-bundle-latest` 加入只读搜索；summary 同步暴露最新本地复核 label/query/title，Audit toolbar 和最新 row 都提供定位/复制最新本地复核链接。该能力只筛选现有本地复核行，不自动记录复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 76 已给本地复核集补上覆盖健康度：`AuditEvidenceReportLedgerSummary` 新增 `localReviewBundleCoverageLabel/Query/State/Title`，按当前页 ready 的 `personal_team_readiness_review` 与 `daily_ops_control_room_review` 判断 `complete`、`partial` 或 `empty`；构造台账行后也会把同一套 coverage query/title 回填到本地复核 row，并把 `local-review-bundle-complete`、`local-review-bundle-gap`、`local-review-bundle-daily-ops-missing` 或 `local-review-bundle-personal-missing` 纳入只读搜索。Audit toolbar 和本地复核 row 现在都提供定位/复制本地复核覆盖入口，帮助个人和小团队确认 readiness 复核与每日操作复核是否成对留档。该能力只筛选既有复核行，不自动记录复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 77 已把本地复核覆盖缺口转成显式下一步动作：`AuditEvidenceReportLedgerSummary` 新增 `localReviewBundleCoverageNextActionLabel/Query/Title`，partial 状态会按缺失类型生成 `record-daily-ops-review` 或 `record-personal-team-review`，并组合成 `local-review-bundle-next-action` 稳定查询；本地复核 row 也会回填同一条 next-action query/title，并把 query token 纳入只读搜索。Audit toolbar 与 row 操作区新增“定位覆盖下一步 / Focus coverage next”和复制入口，使个人或小团队能直接把覆盖缺口交给下一轮人工复核。该能力只解释现有台账覆盖缺口，不自动记录复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

Batch 78 已让本地复核覆盖下一步可以打开目标工作区：`AuditEvidenceReportLedgerSummary` 和本地复核 row 新增 `localReviewBundleCoverageNextActionTargetWorkspaceId`，当覆盖为 partial 时指向承载个人/小团队复核与 Daily Ops 复核按钮的 `research` 工作区；Audit toolbar 与 row 操作区新增“打开覆盖下一步 / Open coverage next”，点击会先保留对应 next-action Audit 查询，再切回人工复核上下文。该能力只缩短从 Audit 缺口到手动复核入口的导航，不自动记录复核、不修改 Markdown、不签名、不运行流水线、不连接券商、不提交订单，也不放宽 paper-only/live-blocked 边界。

## 2. 产品原则

- 证据优先：AI 解读、策略晋级、模拟委托和未来实盘委托都必须能追溯到数据快照、策略版本、回测参数、风控审批和 run id。
- 本地优先：默认使用本地数据库、本地缓存、本地审计日志和用户自管 API Key。
- 个人/小团队优先：默认服务单人本地研究和小团队共享复现包，不做 SaaS 账号、计费、多租户和托管资金。
- 全平台目标，P0 闭环先行：路线面向完整交易工具，但先交付 A 股单标的研究、回测、AI 复盘、模拟交易和可复现导出。
- 多市场统一：A 股、美股、加密货币使用统一内部 schema，同时保留交易日历、时区、涨跌停、最小交易单位等市场差异。
- 不制造虚假信心：demo 数据、降级数据、过期数据、缓存数据、模拟账户都必须明确标识。
- 工作流优先：每个页面服务一个明确任务，而不是展示一堆孤立组件。
- 可复现：研究运行、策略版本、回测假设、AI 报告和执行记录都能回放、导出、导入和校验。
- 安全闸门：实盘执行必须显式开启、可审计、可回滚，不能被误触发。

## 3. 目标用户

### 主要用户

具备一定技术能力的个人量化交易者或技术型投资者，希望在本地完成 A 股优先的行情研究、策略构建、回测、AI 辅助评审、模拟交易和未来受控实盘执行。

### 次要用户

小型研究团队，需要共享可复现策略包、回测报告、模拟盘记录和可审计的 AI 辅助分析。

### 早期不服务的用户

- 高频交易团队。
- 多租户 SaaS 客户。
- 需要应用直接托管资金或账户的用户。
- 期待应用直接给出保证收益或买卖建议的用户。

## 4. 核心产品闭环

平台必须围绕一条稳定的黄金路径建设：

```text
市场数据 -> 研究工作台 -> 策略工坊 -> 回测实验室 -> AI 评审 -> 风控审批 -> 模拟交易 -> 导出复现包 -> 实盘准备
```

每个环节都要有输入、输出和闸门。

| 环节 | 输入 | 输出 | 闸门 |
| --- | --- | --- | --- |
| 市场数据 | 市场、标的、周期、数据源配置 | 标准化 OHLCV、报价、数据质量 | 数据新鲜度、完整性、来源状态 |
| 研究工作台 | 已校验市场数据 | 图表、因子、笔记、标的上下文 | 绑定数据快照 |
| 策略工坊 | 研究上下文 | 结构化策略配置和版本 | 策略 schema 校验 |
| 回测实验室 | 策略、数据快照、费用和滑点假设 | 指标、交易流水、权益曲线、诊断 | 可复现 run id |
| AI 评审 | 已审计回测 run | 智能体辩论、风险提示、报告 | 只能引用已传入证据 |
| 风控审批 | 回测、AI 报告、组合状态 | 通过、拒绝、仓位限制 | 风控规则全部通过 |
| 模拟交易 | 审批通过的 run | 模拟委托、成交、账户状态 | 绑定审计 run |
| 晋级队列 | 模拟表现、适配器状态 | 实盘候选 | 人工确认 |
| 实盘执行 | 已认证适配器、已审批策略 | 委托、撤单、成交、对账 | 所有实盘闸门通过 |

## 5. 信息架构

平台应按稳定工作区组织，而不是按临时卡片堆叠。

### 5.1 行情中心

目的：管理数据可用性、标的搜索、自选列表、报价、K 线、交易日历和数据源健康。

需要具备：

- A 股、美股、加密货币标的搜索。
- 实时报价快照，显示来源和时间戳。
- 历史 K 线拉取和缓存状态。
- 数据质量告警。
- API Key 和数据源配置。
- 本地缓存检查、刷新和修复工具。

### 5.2 研究工作台

目的：围绕一个标的建立研究上下文。

需要具备：

- K 线图、成交量和因子叠加。
- 周期切换。
- 数据源、缓存、过期和降级标识。
- 因子读数。
- 自选和市场上下文。
- 绑定标的和周期的研究笔记。

### 5.3 策略工坊

目的：创建、编辑、校验、版本化和对比策略。

需要具备：

- 可视化策略构建器。
- 指标、入场、出场、仓位、止损、止盈、回撤保护。
- 策略版本历史。
- 参数模板。
- 策略 schema 校验。
- 后续再接入代码策略适配器，不能早于结构化策略稳定。

### 5.4 回测实验室

目的：产出可复现的策略证据。

需要具备：

- 单标的回测。
- 后续支持多标的和组合回测。
- 初始资金、费用、滑点、仓位、再平衡假设。
- 交易流水、权益曲线、回撤曲线、诊断信息。
- 基准对比。
- run id、数据 hash、策略版本、假设快照。

### 5.5 AI 评审委员会

目的：TradingAgents 风格的结构化评审，不做自由聊天式买卖建议。

需要具备：

- 技术分析师、基本面分析师、新闻分析师、情绪分析师。
- 多头和空头研究员辩论。
- 风险经理评审。
- 组合经理裁决。
- 没有审计证据时不能运行 AI 评审。
- 报告必须引用 run id、指标、数据质量和策略版本。

### 5.6 组合与风控中心

目的：管理资金、仓位、敞口和交易前风控。

需要具备：

- 模拟账户状态。
- 持仓和敞口。
- 回撤和风险限制。
- 单标的、行业、市场仓位上限。
- 黑名单、白名单和紧急停止。
- 风控审批日志。

### 5.7 执行中心

目的：将通过审批的策略路由到模拟或真实执行。

需要具备：

- Paper Trading 适配器。
- 券商和交易所适配器接口。
- 下单、撤单、状态、成交、拒单、对账。
- 执行日志和回放。
- 适配器认证状态。
- 实盘闸门：适配器已认证、风控已审批、人工已确认。

### 5.8 审计与运维

目的：让每一次研究和执行决策可追踪。

需要具备：

- 研究运行历史。
- 可复现导出和导入包。
- 策略发布历史。
- 模拟执行历史。
- 未来实盘审计轨迹。
- 后台任务队列和运行状态。
- 错误和事故记录。

## 6. 当前状态评估

### 已经有价值的部分

- React/Vite 前端和 Python 本地核心已经存在。
- 工作区契约已经存在。
- 行情报价和 K 线 API 已经存在。
- A 股行情的正式 `AkShareMarketDataAdapter` 已经落地：腾讯/东方财富公共源不可用时，K 线服务会复用 AKShare 日线或分钟线接口归一化到内部 `OHLCVBar` schema，支持无网络 fake module 测试、A 股代码标准化、周期映射和 `DataQuality(source="akshare")`。该能力只读取公开行情，不连接券商账户，不生成交易建议，不改变模拟或实盘执行闸门。
- 美股行情的正式 `YFinanceMarketDataAdapter` 已经落地：Yahoo chart 不可用时，K 线服务会复用 yfinance history 归一化到内部 `OHLCVBar` schema，支持无网络 fake module 测试、周期映射、stderr 抑制和 `DataQuality(source="yfinance")`。该能力只读取公开行情，不输出交易建议，不改变风控和执行闸门。
- 加密货币行情的正式 `CcxtMarketDataAdapter` 已经落地：公开 OHLCV 会按内部 `OHLCVBar` schema 归一化，支持交易所、timeout、rate limit 和测试注入，非 crypto 请求会被拒绝；K 线服务在 Binance/Coinbase REST 都不可用时会复用该 adapter，并继续保留 demo fallback 与 `isComplete=false` 数据质量边界。该能力只读取公开行情，不下单、不撤单、不读取或写入交易密钥。
- Settings 平台状态已经把三类正式行情 adapter 收敛成 `marketDataAdapters` 只读契约：AKShare、yfinance 和 ccxt 会暴露 adapter 名称、provider、公开 OHLCV route、能力、周期覆盖、是否需要 API/交易密钥、cache scope、安全说明、按 adapter market 聚合的缓存诊断和 `externalTelemetry` 依赖状态；前端 API client 会把这些字段作为必需契约校验，并在 Settings 页面展示 fresh/stale/empty、缓存上下文数、缓存行数、依赖可用/缺失、retry state 和 Docker/local 安装建议。缺少可选行情依赖时，用户可以看到 `INSTALL_DATA_DEPS=true` 的 Docker 构建开关和对应 `pip install` 命令，避免真实行情接入状态只停留在后端实现细节里。行情 K 线和缓存刷新路径现在还会把外部源异常、warning 或 incomplete fallback 记录到脱敏的 adapter 错误台账，Settings 会把最近一条 provider error 作为 `lastProviderError` 展示，并用 `category=rate_limit/dependency/network/upstream/incomplete_data/unknown` 标注错误类型；`providerHealth` 的当前状态使用 24 小时窗口派生近期错误数、受影响标的、受影响上下文、六类错误 `categorySummary`、主要错误 `dominantCategory` 和建议退避时间，同时保留 `oneHour/twentyFourHours/sevenDays` 错误窗口 `windowSummary` 作为历史趋势。依赖可用但 24 小时内 provider 失败时，对应 adapter 会标记为 `degraded`，连续错误达到阈值时 health 会进入 `cooldown`；只有 24 小时之前的历史错误仍会出现在趋势和最近错误证据里，但不会继续降级 adapter 或阻断刷新。Market/Research 工作区会把当前市场的 `cooldown` 转成手动刷新 guard，禁用单标的刷新、自选批量刷新和研究就绪中的刷新动作，并显示建议等待时间；该 guard 只保护前端手动入口，后端刷新 API 仍可用于测试和人工恢复。该能力仍不读取密钥值、不连接券商、不自动重试、不解锁实盘执行。
- 最新更新：Market/Research 的 provider cooldown guard 已支持同市场一次性人工覆盖。操作员必须填写非空覆盖原因，才能在冷却期内让当前市场的单标的或自选缓存刷新执行一次；刷新尝试结束或切换市场后覆盖状态会自动清除。该能力只放宽前端手动入口，不改变后端刷新 API、数据质量标记、券商连接、自动重试或实盘执行闸门。
- 最新更新：冷却期人工覆盖现在必须先写入通用审计账本，事件类型为 `market_data_refresh_override`，记录 market、symbol、timeframe、覆盖原因、provider health 状态、retry-after、受影响标的/上下文和非实盘边界；只有 `/api/audit/events` 返回已保存 event id 后，前端才会放开一次刷新，写入失败会继续保持冷却阻断。
- 最新更新：Audit 工作区已经能回读 `market_data_refresh_override` 覆盖审计流水，使用后端 `/api/audit/events` 分页和全文查询，展示覆盖总数、已记录数、实盘阻断数、最新覆盖标的、操作员、原因、provider health、retry-after、受影响范围和非实盘边界；该面板是只读运维审计，不进入报告签名链，也不触发缓存刷新、自动重试或任何交易路由。
- 最新更新：Settings 行情 adapter 卡片已经把 `providerHealth.windowSummary` 投影成 1h/24h/7d 可视趋势条，显示总错误数、最新错误时间、趋势动量、峰值窗口和主导错误类型；该能力只消费现有 Settings 响应，不新增后端 endpoint、不触发刷新、不自动重试，也不改变冷却期覆盖或实盘交易闸门。
- Settings 的行情 adapter 卡片现在可以直接打开对应 market 的缓存工作流：前端会从自选列表中解析同市场标的，切到 Market 工作区继续查看缓存健康、单标的刷新和自选批量刷新证据；该动作只改变研究上下文和工作区，不创建研究 run、不触发 AI、不下单。
- 研究工作台已经支持按市场、标的和周期保存本地研究笔记，并把运行时笔记快照纳入审计 run、导出包和 AI 证据边界；导入研究运行包时，包内非空研究笔记会恢复到本地笔记库，前端也会读回并刷新可编辑草稿，跨机器回放后可以继续编辑同一研究上下文。
- 研究运行审计库已经存在。
- 策略配置和回测合同已经存在。
- 策略库已经不再只是当前标的的小列表；最近策略版本可在 Strategy Lab 全局查看，并显示与当前草稿的上下文、名称、入场、出场、仓位和风控差异；载入时会切换到该版本绑定的市场、标的和周期，并清空旧审计证据，要求重新运行流水线。研究运行导入会把包内 `researchRun.strategyConfig` 按原始 revision 还原为 audited 策略版本，前端导入完成后也会刷新同上下文策略库并合并到 Strategy Lab 最近策略列表，避免跨机器导入后策略工坊和审计 run 断链。
- 策略工坊已经加入草稿就绪闸门，保存或审计前会显示策略结构、风控参数、执行模式和审计证据是否通过；这些 gate 已经有本地核心 `/api/strategies/validate` 契约，前端优先使用核心校验、核心不可用时本地兜底。默认草稿的风控文本已经与结构化编辑器保持一致，策略版本保存和研究流水线启动前都会复用核心校验，阻断未结构化或风控不完整的草稿进入策略库、回测、AI 评审或模拟执行。入场策略中的成交量确认已经进入结构化条件和回测引擎，`volume_above_sma` 会和 SMA/RSI 入场一起参与审计回测，并在 Strategy Lab 构建器中提供成交量确认开关和 VOL 窗口控件；RSI 阈值条件也已经进入结构化解析、策略预检、回测引擎和前端审计回放，支持 `rsi_below` / `rsi_above`，并在 Strategy Lab 结构化构建器中提供入场/出场条件类型、RSI 窗口和阈值控件；入场侧已经支持 SMA 主条件叠加 RSI 动量确认和成交量确认，能生成 `Close > SMA5 AND RSI14 > 55 AND Volume > VOL10` 这类多条件草稿并恢复为可编辑字段；内置策略模板已经覆盖 SMA 趋势、RSI 反转和放量突破三类基础草稿，套用模板会清空旧审计证据并要求重新运行流水线。
- 回测实验室已经把审计 run 提升为 Backtest Report，集中展示指标、交易流水、权益曲线、诊断、同数据快照基准对比、参数敏感性摘要与扫描表、证据包、AI 评审准备状态和执行交接状态。
- Backtest Report 已经支持导出 Markdown 审计报告，面向人工复核和留档；报告内包含同一审计快照上的参数扫描摘要、SMA 参数敏感性表、同上下文运行对比矩阵和同市场同周期的 Cross-Symbol Comparison 横向证据，且当入场规则叠加 RSI 动量确认或成交量确认时会同步扫描 RSI 阈值与 VOL 窗口候选，非当前参数候选可以暂存回策略工坊并强制重新审计；跨标的比较只引用各标的最新审计 run 的收益、回撤、胜率、交易数和数据质量，不构造组合仓位，也不输出买卖建议。同一份报告也会作为 `aiqt.backtestReport` 顶层 artifact 附加到研究运行 JSON 复现包，跨机器导入时保留 Markdown 内容、内容 SHA-256、运行上下文和非投资建议边界。
- Backtest Report 已经新增同上下文运行对比矩阵：只比较同市场、同标的、同周期的已审计运行，标记当前运行、上一轮可比运行、最佳收益和最低回撤，支持按 run、策略 revision、标签和数据质量搜索；该矩阵只用于历史证据复盘，不作为优化器或买卖建议。
- 组合级回测已经从后端能力进入 Portfolio 工作区：`PortfolioBacktestEngine` 可以把多个已审计单标的 `BacktestRun` 按目标权重聚合为组合权益曲线、现金缓冲、组合收益/回撤/交易数、数据质量和标的贡献；本地核心新增 `POST /api/portfolio/backtest`，输入已存在的审计 run id 与权重，输出组合级证据。前端 Portfolio 工作区会从同市场、同周期、带权益曲线的审计运行历史生成静态权重组合草稿，并可直接调用核心接口展示组合指标、现金权重、权益点数量和各标的贡献；当同市场 peer 不足时，Portfolio 工作区会基于当前自选列表生成对照审计计划，并可一键补跑最少需要的 peer 审计 run，让组合回测从 blocked 进入 ready。组合回测结果现在还会生成集中度、现金缓冲、总目标敞口、期末权重再平衡漂移、风险预算贡献、协方差风险贡献、成对相关性风险、负贡献标的和聚合数据质量诊断，作为组合风控复核证据；风险预算贡献以各腿 `目标权重 * 最大回撤` 作为审计证据代理，用于发现单一腿承担过多组合回撤风险；协方差风险摘要基于各腿已对齐权益曲线的逐期收益计算 population covariance、组合波动率、单腿年化波动率、边际风险贡献和贡献占比，用于发现单一腿承担过多组合波动风险；成对相关性风险基于各腿已对齐权益曲线的逐期收益 Pearson correlation，用于发现组合腿过度同向聚集。后端和 Portfolio 页面也会展示静态目标分配流水 `allocationEvents`，记录每条组合腿的来源 run id、目标权重、名义金额和现金缓冲；同时输出 `rebalanceEvents`，基于期末权重与目标权重的偏离生成 `within_band/review/blocked` 复核行，展示当前值、目标值、偏离金额和原因；`tradeReviewEvents` 会把非现金再平衡偏离转换为 `buy/sell/hold` 的纸面交易复核意图，记录来源 run id、目标/期末权重、名义金额、`paper_review/blocked/no_action` 状态和不路由订单原因；`preTradeRiskChecks` 会对组合数据质量、交易复核状态和交易名义金额阈值生成 `passed/review/blocked` 检查账本；新增 `paperOrderEvents` 会把通过检查的 hold 意图标记为 `skipped`，把需复核的买卖意图标记为 `pending_review`，把被风控阻断的意图标记为 `rejected`，从而形成后续模拟委托的确定性审计输入。五类流水都只是后续组合执行中心的审计输入，不代表真实委托、真实成交或自动再平衡。同一组组合指标、诊断、标的贡献、协方差风险摘要、分配流水、再平衡复核流水、交易复核流水、交易前风控检查、组合纸面订单事件和证据边界也可以导出为 Portfolio Markdown 报告，并以 `eventType=portfolio_report` 写入通用审计账本，metadata 保留文件名、内容 SHA-256、市场/周期、组合名称、腿数量、权益点数量、分配事件数量、再平衡复核事件数量、交易复核事件数量、交易前风控检查数量、组合纸面订单事件数量、协方差风险贡献数量、诊断数量和数据质量边界。Audit 报告历史会同页回读 `portfolio_report`，展示组合上下文、腿数量、权益点数量和签名状态，并允许复用本地 HMAC 签名 API 对 Portfolio 报告签名、验签和撤销；外部 `aiqt.portfolioReport` 报告包现在也能走 `/api/audit/reports/verify-package` 只读验签，返回 `portfolio_report` 证据而不写入本地账本。当前版本只做时间戳对齐的静态权重组合聚合、组合级复核诊断、协方差风险摘要、静态分配流水、再平衡复核流水、纸面交易复核流水、交易前风控检查账本、组合纸面订单事件账本、离线报告、报告入账、报告签名链和外部组合报告包验签，不执行真实再平衡，不做真实组合交易成交、完整协方差风险模型、研究运行 JSON 包内 Portfolio artifact 或自动调仓。
- 组合纸面委托已经从单次回测 payload 进入本地可审计记录：本地核心新增 `PortfolioPaperOrderStore` 和 `/api/portfolio/paper-orders` POST/GET 契约，可以把 `paperOrderEvents` 按 `baseRunId`、组合名称、来源、批次 id、订单数组和状态汇总持久化到 SQLite。Portfolio 工作区新增显式“入账委托”动作，并会按当前审计 run 回读最近入账批次，展示批次 id、订单数、名义金额和状态计数。每次组合委托批次入账现在会同步写入 `eventType=portfolio_paper_order_batch` 的通用审计事件，metadata 保留 batch id、订单数、名义金额、状态计数、状态机计数、可路由数量、paper-only 和 live blocked 边界；前端 `recordPortfolioPaperOrderBatch` 会回传该 audit event 和 `portfolioPaperOrderLifecycle`，执行中心和 Portfolio 内嵌执行区会把最近批次压缩成组合订单生命周期行，显示待复核/拒绝/跳过数量、状态机摘要、审计事件 id 和名义金额。当前状态机已经能把 `pending_review/rejected/skipped` 与 `riskStatus`、人工审批输入合成为 `awaiting_operator_review`、`ready_for_simulation`、`risk_rejected`、`operator_rejected`、`risk_review`、`invalid_order` 和 `skipped`，只有风险通过且人工批准的正数量买卖委托才会标记为可进入模拟路由。人工审批账本已经落地：`PortfolioPaperOrderApprovalStore` 和 `/api/portfolio/paper-order-approvals` POST/GET 会按 `baseRunId + batchId + orderId` 记录审批人、审批时间、通过/拒绝和原因，并同步写入 `eventType=portfolio_paper_order_approval` 审计事件；前端 `recordPortfolioPaperOrderApproval` / `loadPortfolioPaperOrderApprovals` 已接入执行中心和 Portfolio 内嵌执行区，页面会按单笔委托展示待人工复核、风险复核、已拒绝和可模拟路由状态，并可把通过/拒绝操作写回审批账本后刷新生命周期摘要。首个 paper-only 模拟成交账本也已落地：`PortfolioPaperOrderSimulationStore` 和 `/api/portfolio/paper-order-simulations` POST/GET 只接受 `ready_for_simulation` 的委托，按名义金额/数量派生模拟成交价，写入 `eventType=portfolio_paper_order_simulation` 审计事件；模拟成交前现在会运行 `portfolio_paper_simulation_route_guard`，按已有 base run 回放后的现金、持仓、请求中的 `initialCash/minCashAfter/maxSymbolNotional/maxBatchNotional` 检查现金余量、卖出持仓覆盖、单标的名义金额和批次名义金额，超限或卖出超过本地回放持仓时返回 `portfolio_paper_order_simulation_route_risk_blocked` 且不会写入成交账本；前端模拟按钮会携带可编辑组合风险模板（默认 2% 现金缓冲、20% 单标的上限和 60% 批次上限），并把模板换算出的 `initialCash/minCashAfter/maxSymbolNotional/maxBatchNotional` 传入 route guard，成交回执会保存并展示 route guard 状态与 cash-after 摘要。绑定单一审计 run 的组合委托批次、人工审批和模拟成交回执已经一起进入研究运行 JSON 复现包：导出包会携带 `portfolioPaperOrderBatches`、`portfolioPaperOrderApprovals`、`portfolioPaperOrderSimulations` 及对应 `artifactCounts`，导入时校验 base run、写回目标核心的 Portfolio 批次/审批/模拟成交库，并纳入导入失败回滚和 undo 快照；Audit 包浏览器、近期复现包索引和导入预检会显示/搜索三类 artifact 的 manifest/package 数量一致性，避免跨机器迁移后只剩委托批次而丢失人工放行和模拟成交证据。组合模拟账户/持仓回放也已落地：`GET /api/portfolio/paper-order-replay` 会按 base run 重放已成交模拟回执，重建本地现金、持仓、权益、订单应用顺序、买卖净额、已实现/未实现盈亏和 warning；前端 Execution/Portfolio 会在模拟成交后刷新组合账户摘要和持仓行。组合订单状态历史也已落地：`build_portfolio_paper_order_state_history` 与 `GET /api/portfolio/paper-order-state-history` 会按 batch 派生创建、人工审批、模拟成交和实盘阻断事件序列，前端 `loadPortfolioPaperOrderStateHistory` / `buildPortfolioPaperOrderStateHistoryRows` 会把最新状态变化压缩成 Execution/Portfolio 的紧凑时间线；`buildPortfolioPaperOrderLatestSimulationSummary` 现在会把最近一笔模拟成交、回放后的现金/持仓、paper-only/live-blocked 边界和状态时间线定位 query 上浮为执行面板中的紧凑摘要，点击后只高亮已有状态流水，不新增委托或改变账本。该能力仍是 paper-only 的组合执行准备账本，不连接真实券商、不生成真实资金成交；下一步应继续推进真实适配器本地 secret-store 写入和受控重启编排。
- 组合模拟路由检查已经进入 Execution/Portfolio 内嵌执行区：`buildPortfolioPaperOrderSimulationRouteRows` 会从现有组合委托审批行、模拟成交回执和状态时间线派生紧凑路由检查，区分可进入本地模拟器、等待人工/风控复核、已模拟成交、风控阻断和跳过委托；该检查只解释和阻断本地模拟路由，不新增委托、不重复模拟、不连接真实券商，也不放宽 paper-only/live-blocked 边界。
- 最新更新：组合模拟路由检查现在会消费最近的 adapter paper execution 证据。`buildPortfolioPaperOrderSimulationRouteRows` 新增可选的 `adapterPaperExecutionRows` 输入，只接受 `paper_execution_recorded`、已记录 simulated fill、且 `orderSubmitted=false/liveOrderSubmitted=false/routeExecuted=false` 的适配器模拟执行行，并按模拟成交标的绑定到组合委托 route row。Execution/Portfolio 内嵌执行区会在可模拟或已模拟的组合委托旁显示对应 adapter paper execution id、simulated fill 摘要和 `manifestValidationId`，让组合模拟委托能看到同链路适配器证据，但仍不自动路由真实券商、不提交 sandbox/paper/live 订单、不改变组合委托状态，也不会把实盘晋级从 `certification_pending` 改成 `live_ready`。
- 最新更新：执行适配器 secret materialization 成功后会自动写入本地 `secret-store` manifest 文件。`/api/execution/adapter-secret-materializations` 会把 `local-secret-store://...` 解析到当前审计库旁的 `secret-store` 目录，写入 schema、adapter/reference/materialization id、fingerprint、required env var 名称和 secret ref 占位信息；`/api/execution/adapter-secret-manifest-validations` 会从同一个 root 读取并校验该 manifest。文件和 API payload 都不保存 raw secret 值，缺少 fingerprint 或写入失败仍不会放开后续 validation/live 路由；该能力只是把人工确认后的本地 secret-store 证据落盘，不连接券商、不自动重启、不允许实盘下单。
- 最新更新：组合纸面委托模拟成交账本、账户回放和状态时间线现在会持久化 adapter paper execution 证据。`PortfolioPaperOrderSimulationStore`、`/api/portfolio/paper-order-simulations`、审计事件 metadata、研究运行导出/导入包和前端 typed API 都会保留 `adapterPaperExecutionId`、`adapterManifestValidationId` 和脱敏后的 `adapterPaperExecutionEvidence`；`GET /api/portfolio/paper-order-replay` 的订单回放行、`GET /api/portfolio/paper-order-state-history` 的 `simulation_filled` metadata 和执行面板最近模拟成交/状态时间线摘要都会显示 adapter execution id、fill 摘要和 manifest validation id。Audit 导出包浏览器的 `portfolio-paper-orders` artifact 行也会统计组合模拟成交中携带 adapter paper execution evidence 的数量，导入 diff/预检行会显示 portfolio 批次、审批、模拟成交数量以及“simulated fill carries adapter paper execution evidence” 摘要，并支持用 adapter execution id 搜索同时定位 `adapterPaperExecutions[]` 与 `portfolioPaperOrderSimulations[]`；确认导入后的撤销确认会列出将回滚的导入 artifact rows，并保留 adapter 纸盘执行与组合模拟成交两条证据摘要，避免用户撤销前看不到会移除哪些证据。前端单笔“提交模拟委托”和批量模拟都会从对应 route row 带入 adapter 纸盘执行摘要，批量路径使用 `adapterPaperExecutionEvidenceByOrderId` 按订单绑定证据，避免把一条 adapter evidence 套到整批订单。契约守卫会拒收未脱敏的 secret/token/privateKey/password 字段；该能力只加强 paper-only 证据闭环，不提交真实订单、不连接券商、不改变 live-blocked 边界。
- 最新更新：组合纸面委托模拟成交在接收 adapter paper execution 证据时增加后端一致性和边界校验。`create_portfolio_paper_order_simulation` 会先脱敏并归一化 `adapterPaperExecutionEvidence`，当证据对象中的 `adapterPaperExecutionId` 或 `manifestValidationId`/`adapterManifestValidationId` 与请求携带的 `adapterPaperExecutionId`、`adapterManifestValidationId` 不一致时，直接拒绝写入模拟成交账本和审计事件，避免把另一条适配器模拟执行或另一份 manifest 验证证据绑定到当前组合订单；当请求或 evidence 已绑定 `adapterPaperExecutionId` 却缺少同链路 `adapterManifestValidationId`/`manifestValidationId` 时，也会拒绝并返回 `portfolio_paper_order_simulation_adapter_manifest_validation_id_required`，防止组合模拟成交只挂执行 id 而丢失 manifest validation 链路；当绑定 adapter execution id 的 evidence 显式声明 `eventType` 且不是 `execution_adapter_paper_execution` 时会返回 `portfolio_paper_order_simulation_adapter_event_type_mismatch`，防止把其它审计事件类型伪装成 adapter 纸盘执行证据；当绑定 adapter execution id 的 evidence 显式声明 `status` 不是 `paper_execution_recorded` 或 `paperFillRecorded=false` 时会返回 `portfolio_paper_order_simulation_adapter_paper_fill_not_recorded`，避免把 blocked/未成交的适配器模拟执行套到组合成交上；当绑定 adapter execution id 的 evidence 携带非空 `blockedReasons` 时会返回 `portfolio_paper_order_simulation_adapter_blocked_reasons_present`，防止带阻断原因的矛盾证据被写入 filled 模拟账本；当绑定 adapter execution id 的 evidence 显式声明 `paperExecutionMode` 且不是 `manual_adapter_paper_execution` 时会返回 `portfolio_paper_order_simulation_adapter_paper_execution_mode_invalid`，防止非纸盘执行模式伪装成组合模拟成交证据；当绑定 adapter execution id 的 evidence 内嵌 `simulatedFill.status` 且状态不是 `filled` 时会返回 `portfolio_paper_order_simulation_adapter_simulated_fill_not_filled`，防止外层状态被伪装而内层成交实际失败；当绑定 adapter execution id 的 evidence 声明的 `simulatedFill.symbol`/`simulatedSymbol`/`symbol` 与当前组合订单标的不一致时会返回 `portfolio_paper_order_simulation_adapter_symbol_mismatch`，防止跨标的错绑；当绑定 adapter execution id 的 evidence 声明的 `simulatedFill.side`/`simulatedSide`/`side` 与当前组合订单方向不一致时会返回 `portfolio_paper_order_simulation_adapter_side_mismatch`，防止跨方向错绑；当绑定 adapter execution id 的 evidence 声明的 `simulatedFill.quantity`/`simulatedQuantity`/`quantity` 与当前组合订单数量不一致时会返回 `portfolio_paper_order_simulation_adapter_quantity_mismatch`，防止跨数量错绑；当绑定 adapter execution id 的 evidence 声明的 `simulatedFill.price`/`simulatedPrice`/`price`/`fillPrice` 与当前组合订单派生成交价不一致时会返回 `portfolio_paper_order_simulation_adapter_price_mismatch`，防止跨价格错绑；当绑定 adapter execution id 的 evidence 声明的 `simulatedFill.notionalValue`/`simulatedNotional`/`notionalValue`/`notional` 与当前组合订单名义金额不一致时会返回 `portfolio_paper_order_simulation_adapter_notional_mismatch`，防止跨金额错绑；当绑定 adapter execution id 的 evidence 显式声明 `paperOnly=false` 时会返回 `portfolio_paper_order_simulation_adapter_not_paper_only`，防止组合 paper 账本绑定非 paper-only 适配器证据；当 evidence 声明 `orderSubmitted=true`、`liveOrderSubmitted=true`、`routeExecuted=true` 或 `liveTradingAllowed=true` 时也会拒收，确保组合模拟账本只能绑定已记录模拟成交、未提交订单、未触碰实盘路由且仍保持 live blocked 的本地 paper-only 证据。旧的完全无 id 证据仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在会校验 adapter paper execution evidence 的 `paperExecutionSteps[]`。当已绑定 `adapterPaperExecutionId` 且 evidence 显式包含步骤状态时，所有非空 `status` 必须为 `recorded`；如果任一步骤仍是 blocked/pending/failed，会返回 `portfolio_paper_order_simulation_adapter_steps_not_recorded`，防止步骤链尚未完成的适配器纸盘执行被写入 filled 组合模拟账本。旧的无步骤 evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交进一步要求 adapter paper execution evidence 的显式步骤链完整。当 evidence 携带非空 `paperExecutionSteps[]` 时，除了所有状态必须为 `recorded`，还必须包含 adapter paper execution 的四个核心步骤：ops state linked、paper account synced、risk budget bound、simulated fill recorded；缺少任一核心步骤会返回 `portfolio_paper_order_simulation_adapter_steps_missing`，防止只提交一两个 recorded 步骤就伪装成完整纸盘执行证据。旧的无步骤 evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在也会校验 adapter paper execution evidence 的 `requiredConfirmations[]`。当已绑定 `adapterPaperExecutionId` 且 evidence 显式包含确认项状态时，所有非空 `status` 必须为 `confirmed`；如果任一确认项仍是 missing/blocked/failed，会返回 `portfolio_paper_order_simulation_adapter_confirmations_not_confirmed`，防止外层伪装成 `paper_execution_recorded` 但关键人工/风控确认没有完成的证据进入 filled 组合模拟账本。旧的无确认项 evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交进一步要求 adapter paper execution evidence 的显式确认链完整。当 evidence 携带非空 `requiredConfirmations[]` 时，除了所有状态必须为 `confirmed`，还必须包含 adapter paper execution 的五个核心确认项：ops state accepted、paper account synced、risk budget bound、simulated fill generated、operator confirmed no live routing；缺少任一核心确认项会返回 `portfolio_paper_order_simulation_adapter_confirmations_missing`，防止只提交一两个 confirmed 项就伪装成完整纸盘执行证据。旧的无确认项 evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在会校验 adapter paper execution evidence 的原始 `orderIntent` 标的一致性。当已绑定 `adapterPaperExecutionId` 且 evidence 显式包含 `orderIntent.symbol` 时，该标的必须与当前组合订单一致；不一致会返回 `portfolio_paper_order_simulation_adapter_order_intent_symbol_mismatch`，防止只把外层 `simulatedFill` 改成当前标的、但底层订单意图仍指向另一只标的的证据进入 filled 模拟账本。旧的无 `orderIntent` evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在也会校验 adapter paper execution evidence 的原始 `orderIntent` 方向一致性。当已绑定 `adapterPaperExecutionId` 且 evidence 显式包含 `orderIntent.side` 时，该方向必须与当前组合订单一致；不一致会返回 `portfolio_paper_order_simulation_adapter_order_intent_side_mismatch`，防止只把外层 `simulatedFill.side` 改成当前方向、但底层订单意图仍是相反买卖方向的证据进入 filled 模拟账本。旧的无 `orderIntent` evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在也会校验 adapter paper execution evidence 的原始 `orderIntent` 数量一致性。当已绑定 `adapterPaperExecutionId` 且 evidence 显式包含 `orderIntent.quantity` 时，该数量必须与当前组合订单数量一致；不一致会返回 `portfolio_paper_order_simulation_adapter_order_intent_quantity_mismatch`，防止只把外层 `simulatedFill.quantity` 改成当前数量、但底层订单意图仍是另一笔数量的证据进入 filled 模拟账本。旧的无 `orderIntent` evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在也会校验 adapter paper execution evidence 的原始 `orderIntent` 价格一致性。当已绑定 `adapterPaperExecutionId` 且 evidence 显式包含 `orderIntent.price` 时，该价格必须与当前组合订单派生成交价一致；不一致会返回 `portfolio_paper_order_simulation_adapter_order_intent_price_mismatch`，防止只把外层 `simulatedFill.price` 改成当前价格、但底层订单意图仍是另一笔限价价格的证据进入 filled 模拟账本。旧的无 `orderIntent` evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在也会校验 adapter paper execution evidence 的原始 `orderIntent` 名义金额一致性。当已绑定 `adapterPaperExecutionId` 且 evidence 显式包含 `orderIntent.notionalValue` 或 `orderIntent.notional` 时，该金额必须与当前组合订单名义金额一致；不一致会返回 `portfolio_paper_order_simulation_adapter_order_intent_notional_mismatch`，防止只把外层 `simulatedFill.notionalValue` 改成当前金额、但底层订单意图仍是另一笔名义金额的证据进入 filled 模拟账本。旧的无 `orderIntent` 金额 evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：组合纸面委托模拟成交现在也会检查 adapter paper execution evidence 的原始 `orderIntent.liveTradingAllowed` 边界。当已绑定 `adapterPaperExecutionId` 且 evidence 内层 `orderIntent.liveTradingAllowed=true` 时，即使外层 evidence 仍声明 `paperOnly=true` 和 `liveTradingAllowed=false`，也会返回 `portfolio_paper_order_simulation_adapter_order_intent_live_trading_allowed` 并拒绝写入 filled 模拟账本，防止用外层 paper-only 包装一条底层已允许实盘的订单意图。旧的无该字段 evidence 仍兼容，只用于摘要展示；该能力继续保持 paper-only、live blocked，不提交真实订单、不连接券商。
- 最新更新：Audit 工作区现在会从通用审计账本回读组合纸面委托执行事件，新增“组合委托审计”只读面板，分页查询 `portfolio_paper_order_batch,portfolio_paper_order_approval,portfolio_paper_order_simulation` 三类事件，并把批次、人工审批和模拟成交整理成统一账本行。该面板展示流水总数、批次数、审批数、模拟成交数、实盘阻断数、最新事件、批次/订单/模拟 id、审批人、adapter paper execution id、数量、价格和 paper-only/live-blocked 边界；Execution/Portfolio 的状态时间线定位动作会同步过滤该账本，便于从最近模拟成交或状态事件跳到原始审计流水。该能力只增强组合 paper-order 证据可发现性，不新增委托、不重复模拟、不修改报告签名链、不连接券商，也不放开实盘边界。
- 最新更新：组合委托审计查询现在可以形成可分享上下文。Audit 面板内手动搜索批次、订单、标的、审批人或 adapter paper execution id 时，会同步写入 `workspace=audit&auditReportQuery=...` URL 参数；面板提供“复制审计链接”动作，复制后的链接可直接恢复同一组合委托审计过滤条件，便于次日继续复核或在 Execution/Portfolio 状态时间线和 Audit 原始账本之间来回定位。该能力只复制只读查询上下文，不复制委托、不生成新成交、不修改签名状态，也不改变 paper-only/live-blocked 执行边界。
- 受控批量模拟路由已经进入核心和执行面板：`POST /api/portfolio/paper-order-simulations/batch` 会按同一批次内已审批、可路由的订单顺序逐笔调用本地模拟器，每笔仍复用 route guard，并把本轮已成交订单纳入后续现金、单标的和批次上限检查；部分成交时返回 `batchSimulation.status=partial`、blocked/skipped 明细、当前批次 simulations 和逐笔成交审计事件。前端执行面板新增“批量模拟”动作，只提交未成交且 ready 的买/卖订单，并在完成后刷新状态时间线、账户回放和成交账本；该能力仍是 paper-only，不连接真实券商、不生成真实资金成交。
- 最新更新：单笔组合纸面委托模拟成交接口也补齐幂等保护。`POST /api/portfolio/paper-order-simulations` 会在写账本和审计事件前检查同一 `baseRunId + batchId + orderId` 是否已经存在 filled simulation；重复提交会返回 `portfolio_paper_order_simulation_already_recorded`，不会覆盖原成交时间、不会再次运行 route guard、不会多写 `portfolio_paper_order_simulation` 审计事件。这样单笔按钮和批量模拟路径都能防止重复成交，继续保持 paper-only、live blocked 边界。
- 最新更新：组合纸面委托人工审批在模拟成交后进入只读锁定。`POST /api/portfolio/paper-order-approvals` 会先检查同一 `baseRunId + batchId + orderId` 是否已有 filled simulation；一旦成交回执存在，后续审批改写会返回 `portfolio_paper_order_approval_locked_after_simulation`，不会覆盖原审批人/审批结论，也不会追加新的审批审计事件，避免出现“已成交但审批被事后改成拒绝”的账本矛盾。
- 最新更新：组合纸面委托批次入账补齐 API 级幂等保护。`POST /api/portfolio/paper-orders` 会用规范化后的 `portfolioName + source + orders` 在同一 `baseRunId` 下查重；重复提交返回 `portfolio_paper_order_batch_already_recorded` 和已有 batch 摘要，不再生成新的随机批次 id，也不会重复写 `portfolio_paper_order_batch` 审计事件，避免前端重复点击“入账委托”导致多个内容相同的待审批批次。
- 最新更新：前端 typed API 已消费组合纸面委托重复入账响应。`recordPortfolioPaperOrderBatch` 遇到 `portfolio_paper_order_batch_already_recorded` 时会校验 `existingBatch` 和 lifecycle 结构，并返回 `source=core`、已有 batch 和现有 lifecycle，而不是把已有 batch id 当作普通错误；这为 Execution/Portfolio 页面后续直接复用已入账批次、避免重复待审批队列打通了 API 层。
- 最新更新：单笔组合模拟成交的重复提交响应也完成可复用闭环。`POST /api/portfolio/paper-order-simulations` 在发现同一订单已有 filled simulation 时，仍返回 `portfolio_paper_order_simulation_already_recorded` 和 409，但会附带 `existingSimulation`、同批次 simulations 和 lifecycle；前端 `recordPortfolioPaperOrderSimulation` 会校验该响应并返回已有 simulation，而不是把订单 id 当作普通错误。重复点击“模拟成交”因此不会重复写账本，也能让页面复用既有成交回执。
- 最新更新：模拟成交后的审批锁定响应也补齐当前账本快照。`POST /api/portfolio/paper-order-approvals` 若发现订单已有 filled simulation，会返回 `portfolio_paper_order_approval_locked_after_simulation`、现有 approval、现有 simulation、当前 approvals 和 lifecycle；前端 `recordPortfolioPaperOrderApproval` 会保留锁定 error，同时返回 approvals/lifecycle，避免用户事后改写审批失败时页面拿不到当前真实状态。
- 最新更新：前端 typed API 现在会保留模拟成交后审批锁定响应里的 `existingApproval` 和 `existingSimulation`。这让 Execution/Portfolio 后续不只能知道“审批失败”，还能定位是哪条既有审批和哪笔 filled simulation 触发只读锁定，为页面展示、审计定位和重复操作解释保留完整证据。
- 最新更新：Execution/Portfolio 页面已经消费上述锁定账本快照。人工审批请求若因已模拟成交而被核心拒绝，页面不会把它当作普通网络失败丢弃，而会识别 `portfolio_paper_order_approval_locked_after_simulation` 并合并返回的 lifecycle，让执行状态、审批行和后续回放继续指向当前真实账本；同时仍保留错误提示，明确该订单已进入只读锁定。
- 最新更新：Execution/Portfolio 的审批锁定提示已经从原始错误码升级为可读证据摘要。页面会展示触发锁定的 filled simulation id、订单方向/数量/成交价、模拟成交时间，以及既有审批人和审批时间，让操作者能直接理解“为什么不能再改审批”，并为后续审计定位保留明确线索。
- 最新更新：组合模拟路由行的“已模拟成交”状态也补齐成交证据摘要。`buildPortfolioPaperOrderSimulationRouteRows` 现在会在行级 detail 中展示 filled simulation id、方向、数量、成交价、模拟时间、route guard 状态和重复模拟阻断原因，让 Execution/Portfolio 表格无需依赖全局错误提示也能解释为什么该订单不能再次进入本地模拟器。
- 最新更新：组合模拟路由行的审计定位 query 也会携带 filled simulation 证据。已成交路由行的 `focusQuery` 现在包含 batch、order、symbol、状态、simulation id、fill status、模拟时间和 source run id，后续表格点击、搜索框或审计定位可以直接命中具体模拟成交回执，而不是只能定位到委托订单。
- 最新更新：组合委托状态时间线也补齐行级审计定位 query。`buildPortfolioPaperOrderStateHistoryRows` 会为每条状态事件生成 `focusQuery`，包含 batch、order、symbol、状态、event id，以及 simulation id、adapter paper execution id 和 manifest validation id 等公开证据 token；Execution/Portfolio 时间线行会把该 query 暴露为 hover title，便于从 `simulation_filled` 或 `live_blocked` 行直接定位对应账本证据。
- 最新更新：组合模拟路由行现在可以直接聚焦对应状态时间线。`buildPortfolioPaperOrderSimulationRouteRows` 会携带最新状态事件 id，Execution/Portfolio 中点击路由行会高亮对应的时间线事件；路由行自身也会进入 focused 态，方便从“可模拟/已模拟/阻断”行跳到同一订单的状态流水，而不再依赖最近成交摘要按钮。
- 最新更新：组合模拟路由与状态时间线的聚焦行为已纳入布局守卫。前端布局测试现在会检查路由行 focused class、点击后设置对应状态事件 id，以及 `.portfolio-simulation-route-row.focused` 样式，防止后续 UI 调整把“路由行 -> 状态流水”的定位链路悄悄删掉。
- 最新更新：组合委托状态时间线聚焦现在会自动滚动到对应事件。点击最近模拟成交或模拟路由行设置 `portfolioOrderFocusedStateId` 后，Execution/Portfolio 会把匹配的时间线事件挂到 `focusedPortfolioOrderStateRef` 并调用 `scrollIntoView({ block: "center", behavior: "smooth" })`，让定位动作真正移动到证据行，而不只是改变高亮状态。
- 最新更新：组合委托状态时间线现在可以直接进入 Audit 检索上下文。Execution/Portfolio 的每条状态事件会在已有 `focusQuery` 上提供紧凑“审计定位”动作，点击后复用 `replaceAuditEvidenceReportQueryUrlParam` 写入 `workspace=audit&auditReportQuery=<focusQuery>`、重置 Audit 报告历史分页并切到 Audit 工作区；该动作只恢复审计搜索，不新增委托、不写账本、不重复模拟，也不改变 paper-only/live-blocked 边界。
- 最新更新：实盘适配器前的 paper execution adapter 证据链已经接在 `adapter_ops_state` 之后并收紧 manifest validation 闸门。后端 `POST/GET /api/execution/adapter-paper-executions` 必须引用已记录且携带 `manifestValidationId` 的 ops state，并要求 ops state 已采纳、paper 账户已同步、风险预算已绑定、模拟成交已生成、操作员确认未触碰实盘路由五项确认；缺项或上游 ops state 缺少 validation id 时返回 `blocked`，确认齐全返回 `paper_execution_recorded`，并写入 `eventType=execution_adapter_paper_execution` 的通用审计事件。payload 会继承 route review、schema dry-run、paper lifecycle、route runbook 和 ops state 的证据 id，生成本地 `simulatedFill`，同时固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false` 和 `liveTradingAllowed=false`。前端 typed API、脱敏 contract guard、compact row model 和 Settings 面板入口已接入：刷新设置会回读最近 paper execution，ops state 后可勾选五项确认并记录模拟执行结果。该能力只形成本地可审计的模拟成交证据，不连接券商、不提交 sandbox/paper/live 订单、不写密钥、不放开实盘交易。
- 最新更新：adapter paper execution 证据已经进入研究运行 JSON 复现包并接入导入审计定位链路。后端导出会从通用审计账本读取同市场的 `execution_adapter_paper_execution` 事件，写入 `adapterPaperExecutions` 顶层 artifact，并在 `manifest.artifactCounts.adapterPaperExecutions` 中记录数量；导入预检会校验该 artifact 的市场、状态、路由和 manifest/package 数量一致性。前端 API schema、Audit 包浏览器、近期复现包索引和导入 diff 都已显示/搜索 `adapterPaperExecutions[]`，并把适配器模拟执行与普通 `paperExecutions[]` 区分开；导入审计事件现在会把已应用的 artifact rows 持久化到通用审计 metadata，支持按 `adapterPaperExecutionId`、`adapterPaperExecutions[]`、route/status 和标点无关 token 查询定位已导入证据，撤销/撤销失败事件不再继承已导入 artifact rows，避免把回滚动作误判为仍然导入的证据。该导出和导入定位仍保持 `paperOnly=true`、`liveTradingAllowed=false`、`orderSubmitted=false`、`liveOrderSubmitted=false` 和 `routeExecuted=false` 边界；下一步应继续推进组合级风险、受控模拟路由和真实适配器 secret-store 应用链路。
- 最新更新：Execution 晋级队列现在会消费最近的 adapter paper execution 证据。`buildPromotionReadiness` 会按当前 market/adapter 选择同链路的 `paper_execution_recorded` 行，并在 adapter certification stage 显示 paper fill、确认摘要、阻断摘要、执行模式、`manifestValidationId` 和 live-blocked 边界；当存在有效 simulated fill 时，stage value 提升为 `Paper execution recorded · adapterId`、tone 显示 review/warning，但 overall readiness 仍保持 `certification_pending`，不会把策略或适配器升级为 `live_ready`。该能力只让 Settings 中记录的 adapter paper execution 在 Execution 晋级队列可见，方便从“记录模拟成交证据”走到“晋级复核”时不丢链路，不提交真实订单、不连接券商、不放开实盘路由。
- 最新更新：适配器本地 secret-store manifest 验证账本已经落地。后端新增 `POST/GET /api/execution/adapter-secret-manifest-validations`，必须引用已记录的 `execution_adapter_secret_materialization`，只读本地 manifest，校验文件存在、JSON 可解析、fingerprint 存在以及 `requiredEnvVars` 覆盖情况；验证成功返回 `validated`，缺文件、缺 fingerprint 或环境变量覆盖不全返回 `blocked`，并写入 `eventType=execution_adapter_secret_manifest_validation` 的通用审计事件。响应和审计事件只返回 fingerprint、环境变量名、覆盖计数、阻断原因和 paper-only/live-blocked 边界，即使 manifest 中存在 `secrets` 值也不会返回 raw secret。前端 typed API、脱敏 contract guard、compact row model 和 Execution 晋级队列展示已经接入，Settings 刷新会回读最近验证证据。该层仍不写环境变量、不重启服务、不连接真实券商、不提交订单，也不会把 `liveTradingAllowed` 置为 true；下一步应把环境绑定和重载链路改为引用 manifest 验证证据，而不是只依赖人工勾选。
- 最新更新：适配器环境绑定现在可以直接承接已验证的 secret-store manifest。`POST /api/execution/adapter-environment-bindings` 新增 `manifestValidationId` 输入，若只提供该 id，后端会从 `execution_adapter_secret_manifest_validation` 审计事件反查对应 `materializationId` 并校验 adapter、manifest path、required env vars 和 covered env vars 同链路；验证记录未达到 `validated` 或变量覆盖不完整时，环境绑定会返回 `blocked`，不会记录为 `binding_recorded`。返回 payload、历史查询、审计 metadata、前端 typed API、compact row 和 Execution 晋级队列展示都会携带 `manifestValidationId`，使环境绑定从“清单已记录”推进到“清单已验证后再绑定”。该层仍只记录运行时 env 映射证据，不写环境变量、不重启服务、不连接真实券商、不提交订单，也不会把 `liveTradingAllowed` 置为 true；下一步应继续把运行时重载计划和最终验收链路按同一条 validation/binding 证据链收紧。
- 最新更新：运行时重载计划现在也强制承接已验证的 secret-store manifest 证据链。`build_execution_adapter_runtime_reload_plan` 在环境绑定缺少 `manifestValidationId` 时会追加 `runtime_reload_manifest_validation_missing` 阻断原因，即使维护窗口、健康基线、配置 diff、重载 smoke 计划和回滚负责人五项人工确认齐全，也只能写入 blocked 的 `execution_adapter_runtime_reload_plan` 审计事件；只有通过 `execution_adapter_secret_manifest_validation` 生成并绑定的 environment binding 才能继续生成 `plan_recorded`。这把 secret materialization -> manifest validation -> environment binding -> runtime reload plan 串成同一条可审计链路，但仍不写环境变量、不重启服务、不连接真实券商、不提交订单，也不会把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器运行时重载计划现在继承环境绑定上的 `manifestValidationId`。`POST /api/execution/adapter-runtime-reload-plans` 在读取 `execution_adapter_environment_binding` 审计事件时，会把同链路的 `manifestValidationId` 写入 plan payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 晋级队列摘要，使 secret materialization -> manifest validation -> environment binding -> runtime reload plan 不再断链。旧的 materialization 直连 binding 历史仍可回放，缺少 validation id 时只显示空字段；该层仍只记录维护窗口、健康基线、配置 diff、smoke 计划和回滚负责人五项编排证据，不写环境变量、不执行重启、不连接真实券商、不提交订单，也不会把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器运行时重载执行证据现在继承并强制校验重载计划上的 `manifestValidationId`。`POST /api/execution/adapter-runtime-reload-executions` 在读取 `execution_adapter_runtime_reload_plan` 审计事件时，会把同链路 validation id 写入 execution payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 晋级队列摘要；若计划缺少 validation id，即使重载前健康复核、重载动作记录、重载后 smoke、回滚就绪和操作员确认 live blocked 五项确认齐全，也只能返回 `blocked` 并追加 `runtime_reload_execution_manifest_validation_missing`。旧 plan 仍可作为历史证据回放，但不能晋级到新的执行记录；该层仍不真正重启服务、不写环境变量、不连接真实券商、不提交订单，也不会把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器运行时重载最终验收现在继承并强制校验执行证据上的 `manifestValidationId`。`POST /api/execution/adapter-runtime-reload-acceptances` 在读取 `execution_adapter_runtime_reload_execution` 审计事件时，会把同链路 validation id 写入 acceptance payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 晋级队列摘要；若执行证据缺少 validation id，即使执行证据复核、重载后健康、adapter handshake、急停保持启用和操作员确认 live blocked 五项确认齐全，也只能返回 `blocked` 并追加 `runtime_reload_acceptance_manifest_validation_missing`。旧 execution 仍可作为历史证据回放，但不能晋级到新的最终验收记录；该层仍不真正连接券商、不提交订单、不写环境变量、不授权实盘路由，也不会把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器编排 dry-run 现在继承并强制校验运行时重载最终验收上的 `manifestValidationId`。`POST /api/execution/adapter-orchestration-dry-runs` 在读取 `execution_adapter_runtime_reload_acceptance` 审计事件时，会把同链路 validation id 写入 dry-run payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 最近证据展示；若 acceptance 缺少 validation id，即使验收链复核、sandbox/paper 握手 dry-run、订单 schema dry-run、账户同步 dry-run 和操作员确认无实盘订单五项确认齐全，也只能返回 `blocked` 并追加 `orchestration_dry_run_manifest_validation_missing`。旧 acceptance 仍可作为历史证据回放，但不能晋级到新的编排 dry-run 记录；该层仍不连接券商、不提交 sandbox/paper/live 订单、不写环境变量、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器受控编排执行证据现在继承并强制校验编排 dry-run 上的 `manifestValidationId`。`POST /api/execution/adapter-orchestration-executions` 在读取 `execution_adapter_orchestration_dry_run` 审计事件时，会把同链路 validation id 写入 execution payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 最近证据展示；若 dry-run 缺少 validation id，即使 dry-run 证据复核、sandbox/paper route lock、急停、幂等 key 和操作员确认无资金路由五项确认齐全，也只能返回 `blocked` 并追加 `orchestration_execution_manifest_validation_missing`。旧 dry-run 仍可作为历史证据回放，但不能晋级到新的受控编排执行记录；该层仍不连接券商、不提交订单、不触碰真实资金、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器最终人工确认现在继承并强制校验受控编排执行证据上的 `manifestValidationId`。`POST /api/execution/adapter-human-confirmations` 在读取 `execution_adapter_orchestration_execution` 审计事件时，会把同链路 validation id 写入 human confirmation payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 最近证据展示；若受控编排执行缺少 validation id，即使受控编排执行复核、风险审批仍有效、paper execution 复核、急停就绪和操作者确认最终边界五项确认齐全，也只能返回 `blocked` 并追加 `human_confirmation_manifest_validation_missing`。旧 execution 仍可作为历史证据回放，但不能晋级到新的最终人工确认记录；该层仍不连接券商、不提交订单、不授权自动实盘路由、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器 sandbox/testnet 探针计划现在继承并强制校验最终人工确认上的 `manifestValidationId`。`POST /api/execution/adapter-sandbox-probe-plans` 在读取 `execution_adapter_human_confirmation` 审计事件时，会把同链路 validation id 写入 probe plan payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 最近证据展示；若最终人工确认缺少 validation id，即使最终人工确认复核、sandbox/testnet 端点、沙盒凭据边界、订单路由禁用和探针限制五项确认齐全，也只能返回 `blocked` 并追加 `sandbox_probe_plan_manifest_validation_missing`。旧 human confirmation 仍可作为历史证据回放，但不能晋级到新的 sandbox 探针计划记录；该层仍不连接券商或交易所、不提交 sandbox/paper/live 订单、不写环境变量、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器只读 sandbox/testnet 探针执行现在继承并强制校验探针计划上的 `manifestValidationId`。`POST /api/execution/adapter-sandbox-probe-executions` 在读取 `execution_adapter_sandbox_probe_plan` 审计事件时，会把同链路 validation id 写入 probe execution payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 最近证据展示；若 probe plan 缺少 validation id，即使计划复核、只读握手、账户快照脱敏、订单 schema 验证和未提交订单确认五项确认齐全，也只能返回 `blocked` 并追加 `sandbox_probe_execution_manifest_validation_missing`。旧 probe plan 仍可作为历史证据回放，但不能晋级到新的只读探针执行记录；该层仍不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器 sandbox/testnet 探针复核现在继承并强制校验只读探针执行上的 `manifestValidationId`。`POST /api/execution/adapter-sandbox-probe-reviews` 在读取 `execution_adapter_sandbox_probe_execution` 审计事件时，会把同链路 validation id 写入 probe review payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 最近证据展示；若 probe execution 缺少 validation id，即使探针执行已复核、只读证据匹配计划、脱敏快照归档、订单 schema 风险复核和生产路由阻断确认五项确认齐全，也只能返回 `blocked` 并追加 `sandbox_probe_review_manifest_validation_missing`。旧 probe execution 仍可作为历史证据回放，但不能晋级到新的探针复核记录；该层仍不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器生产路由策略复核现在继承并强制校验 sandbox 探针复核上的 `manifestValidationId`。`POST /api/execution/adapter-production-route-reviews` 在读取 `execution_adapter_sandbox_probe_review` 审计事件时，会把同链路 validation id 写入 production route review payload、审计 metadata、历史查询、前端 typed API、compact row 和 Execution 最近证据展示；若 sandbox review 缺少 validation id，即使 sandbox 复核接受、急停策略、订单路由禁用、仓位限额和回滚负责人五项确认齐全，也只能返回 `blocked` 并追加 `production_route_review_manifest_validation_missing`。旧 sandbox review 仍可作为历史证据回放，但不能晋级到新的生产路由复核记录；该层仍不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器 sandbox 订单 schema dry-run 现在继承并强制校验生产路由策略复核上的 `manifestValidationId`。`POST /api/execution/adapter-sandbox-order-schema-dry-runs` 在读取 `execution_adapter_production_route_review` 审计事件时，会把同链路 validation id 写入 schema dry-run payload、审计 metadata、历史查询、前端 typed API、compact row 和 Settings 证据展示；若 production route review 缺少 validation id，即使生产路由复核接受、健康探针绑定、订单意图 schema 校验、sandbox 端点锁定和操作员确认未提交订单五项确认齐全，也只能返回 `blocked` 并追加 `sandbox_order_schema_dry_run_manifest_validation_missing`。旧 production route review 仍可作为历史证据回放，但不能晋级到新的 schema dry-run 记录；该层仍不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不把 `liveTradingAllowed` 置为 true。
- 最新更新：适配器 paper order lifecycle 现在继承并强制校验 sandbox 订单 schema dry-run 上的 `manifestValidationId`。`POST /api/execution/adapter-paper-order-lifecycles` 在读取 `execution_adapter_sandbox_order_schema_dry_run` 审计事件时，会把同链路 validation id 写入 lifecycle payload、审计 metadata、历史查询、前端 typed API、compact row 和 Settings 证据展示；若 schema dry-run 缺少 validation id，即使 schema dry-run 已接受、paper router 已锁定、风控限额已绑定、模拟生命周期已生成和操作员确认未提交实盘订单五项确认齐全，也只能返回 `blocked` 并追加 `paper_order_lifecycle_manifest_validation_missing`。旧 schema dry-run 仍可作为历史证据回放，但不能晋级到新的 paper order lifecycle 记录；该层仍只记录本地 paper-only 生命周期，不连接券商或交易所下单端点、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，并继续固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`liveTradingAllowed=false`。
- 最新更新：适配器 paper route runbook 现在继承并强制校验 paper order lifecycle 上的 `manifestValidationId`。`POST /api/execution/adapter-paper-route-runbooks` 在读取 `execution_adapter_paper_order_lifecycle` 审计事件时，会把同链路 validation id 写入 runbook payload、审计 metadata、历史查询、前端 typed API、compact row 和 Settings 证据展示；若 lifecycle 缺少 validation id，即使 lifecycle 已接受、paper 账户快照已捕获、风控检查已复核、回放计划已记录和操作员确认不进行实盘路由五项确认齐全，也只能返回 `blocked` 并追加 `paper_route_runbook_manifest_validation_missing`。旧 lifecycle 仍可作为历史证据回放，但不能晋级到新的 paper route runbook 记录；该层仍只记录受控 paper 路由手册，不连接券商或交易所下单端点、不提交 sandbox/paper/live 订单、不执行任何路由、不写环境变量、不重启服务、不生成真实资金成交，并继续固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false`、`liveTradingAllowed=false`。
- 最新更新：适配器 ops state 现在继承并强制校验 paper route runbook 上的 `manifestValidationId`。`POST /api/execution/adapter-ops-states` 在读取 `execution_adapter_paper_route_runbook` 审计事件时，会把同链路 validation id 写入 ops state payload、审计 metadata、历史查询、前端 typed API、compact row 和 Settings 结果行；若 runbook 缺少 validation id，即使 runbook 已接受、监控通道已就绪、急停演练已记录、paper 账户已对账和操作员确认实盘交易仍关闭五项确认齐全，也只能返回 `blocked` 并追加 `adapter_ops_state_manifest_validation_missing`。旧 runbook 仍可作为历史证据回放，但不能晋级到新的 ops state 记录，使 secret materialization -> manifest validation -> environment binding -> runtime reload plan -> runtime reload execution -> runtime reload acceptance -> adapter orchestration dry-run -> controlled orchestration execution -> final human confirmation -> sandbox probe plan -> readonly sandbox probe execution -> sandbox probe review -> production route review -> sandbox order schema dry-run -> paper order lifecycle -> paper route runbook -> adapter ops state 继续保持连续证据追踪。该层仍只记录监控、急停和 paper 对账状态，不连接券商或交易所下单端点、不提交 sandbox/paper/live 订单、不执行任何路由、不写环境变量、不重启服务、不生成真实资金成交，并继续固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false`、`liveTradingAllowed=false`、`paperOnly=true`。
- 最新更新：适配器 paper execution 现在继承并强制校验 adapter ops state 上的 `manifestValidationId`。`POST /api/execution/adapter-paper-executions` 在读取 `execution_adapter_ops_state` 审计事件时，会把同链路 validation id 写入 paper execution payload、审计 metadata、历史查询、前端 typed API、compact row、Settings 结果行和研究运行导出包中的 `adapterPaperExecutions[]`；若 ops state 缺少 validation id，即使 ops state 已采纳、paper 账户已同步、风险预算已绑定、模拟成交已生成和操作员确认未触碰实盘路由五项确认齐全，也只能返回 `blocked` 并追加 `adapter_paper_execution_manifest_validation_missing`。旧 ops state 仍可作为历史证据回放，但不能晋级到新的 adapter paper execution 记录，使 secret materialization -> manifest validation -> environment binding -> runtime reload plan -> runtime reload execution -> runtime reload acceptance -> adapter orchestration dry-run -> controlled orchestration execution -> final human confirmation -> sandbox probe plan -> readonly sandbox probe execution -> sandbox probe review -> production route review -> sandbox order schema dry-run -> paper order lifecycle -> paper route runbook -> adapter ops state -> adapter paper execution 完成连续模拟执行证据追踪。该层仍只记录本地 simulated fill，不连接券商或交易所下单端点、不提交 sandbox/paper/live 订单、不执行任何实盘路由、不写环境变量、不重启服务、不生成真实资金成交，并继续固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false`、`liveTradingAllowed=false`、`paperOnly=true`。
- 最新更新：Execution 工作区新增“实盘前运行手册”汇总层。`buildExecutionAdapterPreLiveRunbookSummary` 会按当前市场和标的把适配器状态账本、适配器认证、密钥清单验证、运行时重载验收、最终人工确认、生产路由复核 + 只读健康探针、模拟路由演练七个 gate 汇总为一个有完成数、下一步和 evidence id 的只读面板；当全部七项通过时也只进入 `paper_rehearsal_ready`，并继续显示 `Paper-only rehearsal · live routing remains blocked` 边界，不解锁真实路由、不提交订单、不改变 `liveTradingAllowed`。该面板现在还能复制、下载或审计入账 Markdown 运行手册，列出 adapter、市场、完成 gate、下一步、每项证据 id/时间戳和“不授权实盘、不提交订单、不构成投资建议”的边界；`pre_live_runbook_report` 会写入 Audit 报告流并只作为审计辅助材料展示，不进入签名链、不授权实盘，用于小团队复核或外部审计记录。Execution 面板也会读取 Audit 报告账本，显示当前手册是 `已审计 / 需重新入账 / 未入账`，并在状态块内直接显示匹配报告的 gate 进度、短 sha256 hash 和 audit event id；当报告已经 stale 时，状态块会同时显示 status、next step、gate 和 evidence id 集合的入账值与当前值差异，方便操作者在不离开 Execution 的情况下判断为什么需要重新入账。即使 status、next step 和 gate 数量都相同，只要底层 evidence ids 变化，覆盖状态也会进入 `stale` 并提示证据集合已变化，且 mismatch 会列出被移除和新增的 evidence id，避免新的模拟执行、ops state 或路由手册证据沿用旧审计报告。该状态块现在也会在未入账或需重新入账时直接提供“入账报告 / 重新入账”上下文动作，复用同一条 `pre_live_runbook_report` 写账逻辑；已匹配时只保留定位和复制审计深链，不重复鼓励写入。Audit 报告历史里的运行手册行也会显示 adapter/市场/标的/周期/gate 进度和 evidence id 数量 chip，并提供“定位运行手册 / 复制运行手册链接”的行级过滤动作；复制或定位生成的确定性查询会携带 gate 进度、evidence id 数量、具体 evidence ids 和短 hash，分享后仍能复原同一条证据链上下文。Audit 顶部摘要现在也会上浮最新 `pre_live_runbook_report` 的 adapter、上下文、状态、gate 进度、evidence id 数量、短 hash 和确定性查询。该动作只定位证据或写入运行手册审计辅助材料，不重新生成实盘权限、不改变任何执行权限。
- 真实适配器前执行状态账本已经落地为只读契约：`build_execution_adapter_state_ledger` 与 `GET /api/execution/adapter-ledger` 会从 Settings 的执行适配器状态和实盘必需闸门派生 paper/local、A 股、美股和加密路由的当前状态、状态事件、闸门计数、下一步和 live-blocked 边界；前端 `loadExecutionAdapterLedger` / `buildExecutionAdapterLedgerRows` 会把这些事件压缩到 Settings 的紧凑审计 rail。持久化适配器认证流水的后端契约也已落地：`ExecutionAdapterCertificationStore` 与 `/api/execution/adapter-certifications` POST/GET 会记录 adapter id、市场、路由、操作者、开始/完成时间、认证检查状态、摘要和脱敏 metadata，并同步写入 `eventType=execution_adapter_certification` 的通用审计事件；所有 `secret`、`token`、`apiKey`、`privateKey` 和 `password` 类字段都会以 `[redacted]` 存储和返回。Settings 工作区已经接入这条流水：前端会按实盘适配器拉取最近认证记录，提供“记录认证”动作，写入 sandbox/paper 凭证引用、订单生命周期、急停/限额和受控重启四类检查，并用 `buildExecutionAdapterCertificationRows` 展示最近记录的状态、检查摘要、审计事件 id 和 paper-only/live-blocked 边界。Execution 晋级队列已经读取最近适配器认证证据，并在适配器认证 stage 显示 latest audit event、检查摘要和 paper-only/live-blocked 边界；blocked/review 证据只能改善可观测性，仍保持实盘晋级阻断。本地核心现在还提供 `POST /api/execution/adapter-certifications/apply` 应用预检契约：按 certification id 校验 secret-store 引用、受控重启窗口和人工复核三项确认，返回 `blocked` 或 `ready_for_restart`，并写入 `eventType=execution_adapter_certification_apply` 审计事件；该预检只记录无密钥证据，不写环境变量、不重启容器、不连接券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true。Settings 工作区已经接入 `recordExecutionAdapterCertificationApply`：认证流水行可触发“应用预检”，并在按钮前显式展示 secret-store 引用已保存、受控重启窗口已批准、操作员已复核认证三项确认清单；用户勾选状态会作为布尔确认提交给核心，结果继续用 `buildExecutionAdapterCertificationApplyRows` 展示确认摘要、阻断数量、审计事件 id 和 paper-only/live-blocked 边界。应用预检历史也已变成可回读证据：`GET /api/execution/adapter-certifications/applies` 会从通用审计账本按 adapter id 投影最近 apply 结果，前端 `loadExecutionAdapterCertificationApplies` 会在 Settings 刷新时恢复这些结果，刷新浏览器后仍能看到最近的阻断/ready-for-restart 预检流水。Execution 晋级队列现在也会消费这些 apply 结果：`buildPromotionReadiness` 会把最近同适配器、同 certification id 的应用预检纳入 adapter certification stage，若状态为 `ready_for_restart` 会显示等待受控重启证据并继续阻断实盘路由，若状态为 blocked 会显示阻断摘要；`PromotionQueuePanel` 同步展示最近应用预检证据行。受控重启证据台账也已落地为 paper-only 安全前置层：`POST /api/execution/adapter-certifications/restart-evidence` 必须引用一条已写入审计账本且状态为 `ready_for_restart` 的 apply 预检，记录重启窗口执行、回滚计划、重启后验证和日志复核四项操作者确认，缺项返回 `blocked`，完整确认返回 `evidence_recorded` 并写入 `eventType=execution_adapter_controlled_restart_evidence`；`GET /api/execution/adapter-certifications/restart-evidence` 可按 adapter 回读最近证据，前端 `loadExecutionAdapterControlledRestartEvidence` / `buildExecutionAdapterControlledRestartEvidenceRows` 会在 Settings 刷新时恢复并在 Execution 晋级队列展示最近受控重启证据。重启后适配器验收台账也已落地：`POST /api/execution/adapter-certifications/restart-acceptance` 必须引用已记录的受控重启证据，记录本地核心健康、设置重载观察、sandbox/paper 路由握手、急停保持启用和账户同步 dry-run 五项确认，缺项返回 `blocked`，完整确认返回 `acceptance_recorded` 并写入 `eventType=execution_adapter_restart_acceptance`；`GET /api/execution/adapter-certifications/restart-acceptance` 可按 adapter 回读最近验收，前端 `loadExecutionAdapterRestartAcceptances` / `buildExecutionAdapterRestartAcceptanceRows` 会在 Settings 刷新时恢复并在 Execution 晋级队列展示最近验收证据。适配器密钥引用台账也已落地：`POST /api/execution/adapter-secret-references` 只记录引用名、后端、所需环境变量和三项操作者确认，不接收或返回真实密钥；缺少“UI 外创建引用、核验 fingerprint、轮换计划已记录”确认时返回 `blocked`，完整确认返回 `reference_recorded`，并写入 `eventType=execution_adapter_secret_reference` 审计事件；`GET /api/execution/adapter-secret-references` 可按 adapter 回读最近引用证据，前端 `loadExecutionAdapterSecretReferences` / `buildExecutionAdapterSecretReferenceRows` 会在刷新设置时恢复并在 Execution 晋级队列展示最近密钥引用证据，同时 `buildPromotionReadiness` 会把该证据纳入适配器认证 stage 的说明但不放行实盘。适配器密钥物化清单台账也已落地：`POST /api/execution/adapter-secret-materializations` 必须引用已记录的密钥引用，记录本地 secret-store 写入已核验、不在 payload 携带 raw secret、环境绑定计划已记录和回滚计划已记录四项确认，缺项返回 `blocked`，完整确认返回 `manifest_recorded` 并写入 `eventType=execution_adapter_secret_materialization`；`GET /api/execution/adapter-secret-materializations` 可按 adapter 回读最近物化清单，前端 `loadExecutionAdapterSecretMaterializations` / `buildExecutionAdapterSecretMaterializationRows` 会在刷新设置时恢复，并在 Execution 晋级队列展示最近物化证据。以上台账仍不传输或返回真实密钥、不自动写环境变量、不重启服务、不连接真实券商，也不会把 `liveTradingAllowed` 置为 true；下一步继续推进真正的受控环境绑定、受控重启编排、实盘适配器编排器和最终人工确认闸门。
- 适配器环境绑定证据台账已经作为实盘前置链路的下一层落地：`POST /api/execution/adapter-environment-bindings` 必须引用已记录且状态为 `manifest_recorded` 的密钥物化清单，记录运行时 env 映射已核验、配置重载计划已记录、不在 payload 携带 raw secret、回滚快照已记录四项确认，缺项返回 `blocked`，完整确认返回 `binding_recorded` 并写入 `eventType=execution_adapter_environment_binding`；`GET /api/execution/adapter-environment-bindings` 可按 adapter 回读最近环境绑定证据，前端 `recordExecutionAdapterEnvironmentBinding` / `loadExecutionAdapterEnvironmentBindings` 与 `buildExecutionAdapterEnvironmentBindingRows` 已具备 API 和紧凑行模型。该层仍不传输或返回真实密钥、不自动写环境变量、不重启服务、不连接真实券商，也不会把 `liveTradingAllowed` 置为 true；后续继续推进受控重启编排、实盘适配器编排器和最终人工确认闸门。
- 环境绑定后的受控运行时重载计划台账也已落地：`POST /api/execution/adapter-runtime-reload-plans` 必须引用已记录且状态为 `binding_recorded` 的环境绑定证据，记录维护窗口已批准、重载前健康基线已捕获、配置 diff 已复核、重载后 smoke 计划已记录和回滚负责人已指定五项确认，缺项返回 `blocked`，完整确认返回 `plan_recorded` 并写入 `eventType=execution_adapter_runtime_reload_plan`；`GET /api/execution/adapter-runtime-reload-plans` 可按 adapter 回读最近计划，前端 `recordExecutionAdapterRuntimeReloadPlan` / `loadExecutionAdapterRuntimeReloadPlans` 与 `buildExecutionAdapterRuntimeReloadPlanRows` 已具备 API 和紧凑行模型。Execution 晋级队列现在会在刷新 Settings 时回读环境绑定和运行时重载计划历史，`buildPromotionReadiness` 会把同适配器、同物化清单、同绑定链路的最近证据纳入适配器认证 stage，`PromotionQueuePanel` 也会展示最近环境绑定和重载计划证据行；这些证据只提升晋级链路可观测性，仍保持实盘路由阻断。该层只记录受控重载编排证据，不自动重启容器、不写环境变量、不连接真实券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；下一步继续推进真正的本地重载执行编排器、重载后验收合并和最终人工确认闸门。
- 运行时重载计划后的受控执行证据台账已经落地为 paper-only 审计层：`POST /api/execution/adapter-runtime-reload-executions` 必须引用已记录且状态为 `plan_recorded` 的重载计划，记录重载前健康复核、重载动作记录、重载后 smoke 通过、回滚就绪确认和操作员确认实盘仍阻断五项证据，缺项返回 `blocked`，完整确认返回 `execution_recorded` 并写入 `eventType=execution_adapter_runtime_reload_execution`；`GET /api/execution/adapter-runtime-reload-executions` 可按 adapter 回读最近执行证据，前端 `recordExecutionAdapterRuntimeReloadExecution` / `loadExecutionAdapterRuntimeReloadExecutions` 与 `buildExecutionAdapterRuntimeReloadExecutionRows` 已具备 API 和紧凑行模型。Settings 刷新现在会随其它 live adapter 证据一起回读最近执行证据，Execution 晋级队列会把同 adapter、同物化清单、同环境绑定、同重载计划链路的最近执行证据纳入 adapter certification stage，并在 Promotion Queue 中独立展示最近运行时重载执行证据行；完整记录会把 stage value 提升为 `Execution recorded · adapterId`，但仍保持实盘路由阻断。该层只证明操作者记录了受控重载执行证据，不执行 Docker 重启、不写环境变量、不连接真实券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；下一步承接最终验收闸门和晋级队列/UI 整合。
- 运行时重载执行后的最终验收闸门已经落地为后端、前端 typed API、Settings 显式记录入口和晋级队列可视化证据链：`POST /api/execution/adapter-runtime-reload-acceptances` 必须引用已记录且状态为 `execution_recorded` 的重载执行证据，记录执行证据已复核、重载后健康已验证、适配器握手已验证、急停仍启用和操作员确认实盘仍阻断五项确认；缺项返回 `blocked`，完整确认返回 `acceptance_recorded` 并写入 `eventType=execution_adapter_runtime_reload_acceptance`。`GET /api/execution/adapter-runtime-reload-acceptances` 可按 adapter 回读最近验收记录，前端 `recordExecutionAdapterRuntimeReloadAcceptance` / `loadExecutionAdapterRuntimeReloadAcceptances` 已具备 URL builder、typed client 和脱敏响应校验；`buildExecutionAdapterRuntimeReloadAcceptanceRows` 会把验收记录压缩成 compact ledger 行，Settings 刷新会回读 live adapter 最近验收历史，Settings 面板会基于最近运行时重载执行证据渲染五项最终验收确认和“记录最终验收”动作，写入后合并本地验收历史并刷新设置状态；`buildPromotionReadiness` 会把同 adapter、同执行链路的最近验收记录纳入 adapter certification stage，`PromotionQueuePanel` 也会展示最近运行时重载最终验收行。该层仍只记录最终人工验收证据，不写环境变量、不重启容器、不连接真实券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；真实本地重载编排器和实盘适配器仍保持后续阶段。
- 实盘适配器编排 dry-run 台账已经作为最终验收后的下一层安全证据落地：`POST /api/execution/adapter-orchestration-dry-runs` 必须引用已记录且状态为 `acceptance_recorded` 的运行时重载最终验收，记录验收链复核、sandbox/paper 握手 dry-run、订单 schema dry-run、账户同步 dry-run 和操作员确认未路由实盘订单五项确认；缺项返回 `blocked`，完整确认返回 `dry_run_recorded` 并写入 `eventType=execution_adapter_orchestration_dry_run`。`GET /api/execution/adapter-orchestration-dry-runs` 可按 adapter 回读最近 dry-run 记录，前端 `recordExecutionAdapterOrchestrationDryRun` / `loadExecutionAdapterOrchestrationDryRuns` 已具备 URL builder、typed client、脱敏响应校验和 `buildExecutionAdapterOrchestrationDryRunRows` compact 行模型。Settings 刷新现在会回读 live adapter 最近 dry-run 历史，Settings 面板会基于最近运行时重载最终验收渲染五项 dry-run 确认和“记录 dry-run”动作，写入后合并本地 dry-run 历史并刷新设置状态；Execution 晋级队列会展示最近适配器编排 dry-run 行，包含状态、确认摘要、阻断摘要、模式、维护窗口和审计事件。该层仍只记录编排前 dry-run 证据，不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；该层现在已由受控适配器编排执行证据台账承接，最终人工确认闸门仍保持后续。
- 受控适配器编排执行证据台账已经作为 dry-run 后的下一层 paper-only 审计层落地，并已接入 Settings/Execution 可见工作流：`POST /api/execution/adapter-orchestration-executions` 必须引用已记录的适配器编排 dry-run，记录 dry-run 证据已复核、sandbox 路由已锁定、急停已武装、幂等键已记录和操作员确认无真实资金边界五项确认；缺项或引用非完整 dry-run 时返回 `blocked`，完整确认返回 `execution_recorded` 并写入 `eventType=execution_adapter_orchestration_execution`。`GET /api/execution/adapter-orchestration-executions` 可按 adapter 回读最近执行证据，前端 `recordExecutionAdapterOrchestrationExecution` / `loadExecutionAdapterOrchestrationExecutions` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterOrchestrationExecutionRows` 会把执行证据压缩成 compact 行模型，展示 dry-run 链路、确认摘要、阻断摘要、维护窗口、模式和 paper-only/live-blocked 边界。Settings 刷新会随其它 live adapter 证据一起回读最近执行证据，Settings 面板会基于最近编排 dry-run 渲染五项受控执行确认和“记录执行证据”动作，写入后合并本地执行证据历史并刷新设置状态；Execution 晋级队列会展示最近受控编排执行证据行，包含状态、确认摘要、阻断摘要、模式、维护窗口和审计事件；当前没有执行证据时也会保留等待态，提示先在 Settings 完成适配器编排 dry-run，再记录不会连接券商或下单的受控执行证据。该层只记录受控编排交接证据，不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；该层现在已由最终人工确认闸门承接。
- 最终人工确认闸门已经作为受控适配器编排执行后的收口审计层落地：`POST /api/execution/adapter-human-confirmations` 必须引用已记录且携带 `manifestValidationId` 的 `execution_adapter_orchestration_execution`，记录编排执行证据已复核、风控审批仍有效、模拟执行已复核、急停就绪和操作员确认 paper-only 边界五项确认；缺项、引用缺失执行证据或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `confirmation_recorded` 并写入 `eventType=execution_adapter_human_confirmation`。`GET /api/execution/adapter-human-confirmations` 可按 adapter 回读最近确认，前端 `recordExecutionAdapterHumanConfirmation` / `loadExecutionAdapterHumanConfirmations` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterHumanConfirmationRows` 会把确认记录压缩成 compact 行模型。Settings 刷新会回读最近最终人工确认历史，并在“受控编排执行证据”后展示五项最终确认控制和“记录最终确认”动作；Execution 晋级队列会展示最近最终人工确认证据，`buildPromotionReadiness` 也会把同市场实盘 adapter 的 `confirmation_recorded` 纳入 human-confirmation stage，并在 stage detail 中显示同链路 `manifestValidationId`，但仍要求适配器认证链路独立通过。该层只记录最终人工确认审计证据，不连接真实券商、不提交任何订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；后续阶段应继续收敛真实适配器 sandbox 实测、组合级风控模型和部署运维可用性。
- 最终人工确认后的 sandbox/testnet 探针计划台账已经落地为下一层实测准备证据：`POST /api/execution/adapter-sandbox-probe-plans` 必须引用已记录且携带 `manifestValidationId` 的 `execution_adapter_human_confirmation`，记录最终人工确认已复核、sandbox/testnet 端点已锁定、凭据仅限沙盒、订单路由仍禁用和探针限制/回滚责任已记录五项确认；缺项、引用缺失最终确认或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `probe_plan_recorded` 并写入 `eventType=execution_adapter_sandbox_probe_plan`。`GET /api/execution/adapter-sandbox-probe-plans` 可按 adapter 回读最近计划，前端 `recordExecutionAdapterSandboxProbePlan` / `loadExecutionAdapterSandboxProbePlans` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterSandboxProbePlanRows` 会把计划压缩成 compact 行模型。Settings 刷新会回读最近 sandbox 探针计划历史，并在“最终人工确认”后展示五项探针计划确认和“记录探针计划”动作；Execution 晋级队列会展示最近 sandbox 探针计划证据，明确下一步是受控 sandbox/testnet 实测准备而不是实盘下单。该层只记录测试计划，不连接券商或交易所、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；后续阶段应继续把计划推进为可审计的只读 sandbox handshake 和订单 schema 探针执行记录。
- sandbox/testnet 探针计划后的只读探针执行证据台账已经落地：`POST /api/execution/adapter-sandbox-probe-executions` 必须引用已记录且状态为 `probe_plan_recorded`、且携带 `manifestValidationId` 的 sandbox 探针计划，记录探针计划已复核、只读握手证据已捕获、账户快照已脱敏、订单 schema 已验证和操作员确认未提交任何订单五项确认；缺项、引用缺失计划或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `probe_execution_recorded` 并写入 `eventType=execution_adapter_sandbox_probe_execution`。`GET /api/execution/adapter-sandbox-probe-executions` 可按 adapter 回读最近执行证据，前端 `recordExecutionAdapterSandboxProbeExecution` / `loadExecutionAdapterSandboxProbeExecutions` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterSandboxProbeExecutionRows` 会把执行证据压缩成 compact 行模型。Settings 会在“Sandbox 探针计划”后展示五项探针执行确认和“记录探针执行”动作；Execution 晋级队列会展示最近只读 sandbox/testnet 探针执行证据，并且 `buildPromotionReadiness` 已将最新匹配的 probe execution 纳入 adapter certification stage 的 value、detail、tone、`manifestValidationId` 和下一步说明，避免该证据只作为旁路 rail 存在。该层只记录握手、脱敏账户快照和订单 schema 验证证据，不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；后续阶段应继续推进更完整的 sandbox 只读检查器和生产路由策略复核。
- sandbox/testnet 只读探针执行后的人工复核台账已经落地并收紧：`POST /api/execution/adapter-sandbox-probe-reviews` 必须引用已记录且状态为 `probe_execution_recorded`、且携带 `manifestValidationId` 的探针执行证据，记录探针执行已复核、只读证据匹配计划、脱敏快照已归档、订单 schema 风险已复核和生产路由仍保持阻断五项确认；缺项、引用缺失执行证据或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `probe_review_recorded` 并写入 `eventType=execution_adapter_sandbox_probe_review`。`GET /api/execution/adapter-sandbox-probe-reviews` 可按 adapter 回读最近复核，前端 `recordExecutionAdapterSandboxProbeReview` / `loadExecutionAdapterSandboxProbeReviews` 已具备 URL builder、typed client、脱敏响应校验和 compact 行模型。Settings 会在“Sandbox 探针执行”后展示五项复核确认和“记录探针复核”动作；Execution 晋级队列会展示最近复核证据，`buildPromotionReadiness` 也会把同链路 `probe_review_recorded` 纳入 adapter certification stage 的 value、detail、tone 和 `manifestValidationId`，明确该层只证明只读证据已被人工检查并归档，仍不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；后续阶段应继续推进生产路由策略复核、真实适配器只读健康检查器和受控模拟路由。
- sandbox 探针人工复核后的生产路由策略复核台账已经落地并收紧：`POST /api/execution/adapter-production-route-reviews` 必须引用已记录且状态为 `probe_review_recorded`、且携带 `manifestValidationId` 的 `execution_adapter_sandbox_probe_review`，记录 sandbox 复核已接受、急停策略已复核、订单路由禁用已确认、仓位限额策略已复核和回滚负责人已记录五项确认；缺项、引用缺失复核或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `route_review_recorded` 并写入 `eventType=execution_adapter_production_route_review`。`GET /api/execution/adapter-production-route-reviews` 可按 adapter 回读最近复核，前端 `recordExecutionAdapterProductionRouteReview` / `loadExecutionAdapterProductionRouteReviews` 已具备 URL builder、typed client、脱敏响应校验和 compact 行模型。Settings 会在“Sandbox 探针复核”后展示五项生产路由复核确认和“记录生产路由复核”动作；Execution 晋级队列会展示最近生产路由策略复核证据，`buildPromotionReadiness` 也会把同链路 `route_review_recorded` 纳入 adapter certification stage 的 value、detail、tone 和 `manifestValidationId`，并保留等待态说明急停、限额、路由禁用和回滚责任仍需人工复核。该层仍只记录生产路由控制策略已被人工复核，不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；后续阶段应继续推进真实适配器只读健康检查器、受控模拟路由和更完整的实盘前运行手册。
- 真实适配器只读健康检查器已经先从 ccxt sandbox/testnet 落地：本地核心新增 `probe_ccxt_sandbox_health` 和 `GET /api/execution/adapter-health/ccxt-sandbox?adapterId=ccxt-live&exchange=binance`，可选 `ccxt` 安装后会在实例化交易所后立即调用 `set_sandbox_mode(True)`，再只读执行 markets、exchange status/time 和可选的测试网账户同步检查；未安装 ccxt 返回 `ccxt_not_installed` 的 blocked 健康结果，未配置测试网 key 时账户同步进入 review 而不是伪造通过。该健康检查现在也可绑定已记录的生产路由复核证据：传入 `productionRouteReviewId` 时，后端会校验对应 `execution_adapter_production_route_review` 存在、adapter 匹配且状态为 `route_review_recorded`，否则返回 `404`/`400`/`409` 阻断探针；通过后响应会携带 `productionRouteReviewId`、`productionRouteReviewStatus` 和脱敏的 `routeReview` 摘要，但仍固定 `paperOnly=true`、`liveTradingAllowed=false`、`orderRoutingEnabled=false`。前端 `loadExecutionAdapterHealthProbe`、`buildExecutionAdapterHealthProbeRows` 和 Settings 的“真实适配器健康检查”面板已经接入该契约，Settings 刷新会优先使用最近 `ccxt-live` 的 `route_review_recorded` 复核 id 重新拉取健康探针，手动刷新也会复用当前内存中的最近复核，并在行内显示生产路由复核、维护窗口和 required env var 数量；响应 metadata 中 secret/token/apiKey/privateKey/password 类字段必须保持脱敏。该能力仍不创建订单、不撤单、不写环境变量、不重启容器、不连接 A 股或美股券商真实账户，也不会把任何路由置为实盘可交易；下一步应在此基础上推进受控 paper-order lifecycle adapter、sandbox 订单 schema dry-run 和更完整的运维 runbook。
- sandbox 订单 schema dry-run 证据台账已经作为生产路由复核和只读健康探针后的下一层安全记录落地并收紧：`POST /api/execution/adapter-sandbox-order-schema-dry-runs` 必须引用已记录且状态为 `route_review_recorded`、且携带 `manifestValidationId` 的 `execution_adapter_production_route_review`，并验证订单意图 schema、生产路由复核已接受、健康探针已绑定、sandbox 端点仍锁定和操作员确认未提交订单五项确认；缺项、引用缺失复核或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `schema_dry_run_recorded` 并写入 `eventType=execution_adapter_sandbox_order_schema_dry_run`。`GET /api/execution/adapter-sandbox-order-schema-dry-runs` 可按 adapter 回读最近 dry-run 记录，前端 `recordExecutionAdapterSandboxOrderSchemaDryRun` / `loadExecutionAdapterSandboxOrderSchemaDryRuns` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterSandboxOrderSchemaDryRunRows` 会把记录压缩成 compact 行模型。Settings 刷新会回读 live adapter 最近订单 schema dry-run 历史，并在生产路由策略复核后展示最近证据，包含订单意图摘要、required env var 数量、确认摘要、阻断摘要和 paper-only/live-blocked 边界；`buildPromotionReadiness` 也会把同链路 `schema_dry_run_recorded` 纳入 adapter certification stage 的 value、detail、tone 和 `manifestValidationId`，让订单意图 dry-run 不再只停留在 Settings 旁路证据。该层只记录订单意图结构验证和人工确认，不连接真实券商、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；后续应继续把该证据承接到受控 paper-order lifecycle adapter 和运维 runbook。
- paper-order lifecycle 证据台账已经承接 sandbox 订单 schema dry-run 并收紧：`POST /api/execution/adapter-paper-order-lifecycles` 必须引用已记录且状态为 `schema_dry_run_recorded`、且携带 `manifestValidationId` 的 schema dry-run，并要求 schema dry-run 已接受、paper router 已锁定、风控限额已绑定、模拟生命周期已生成和操作员确认未提交实盘订单五项确认；缺项、引用缺失 dry-run 或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `lifecycle_recorded` 并写入 `eventType=execution_adapter_paper_order_lifecycle`。`GET /api/execution/adapter-paper-order-lifecycles` 可按 adapter 回读最近 lifecycle 记录，前端 `recordExecutionAdapterPaperOrderLifecycle` / `loadExecutionAdapterPaperOrderLifecycles` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterPaperOrderLifecycleRows` 会把订单意图、确认数、lifecycle step 数、阻断摘要和 no-live-order 边界压缩成 Settings 的 compact 证据行；`buildPromotionReadiness` 也会把同链路 `lifecycle_recorded` 纳入 adapter certification stage，显示订单意图、生命周期步骤、确认摘要、阻断摘要、`manifestValidationId` 和 paper-only/live-blocked 边界，但仍保持 `certification_pending`，不会放开实盘路由。该层只记录本地 paper-only 生命周期，不连接券商或交易所下单端点、不提交 sandbox/paper/live 订单、不写环境变量、不重启服务、不生成真实资金成交，并继续固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`liveTradingAllowed=false`；下一步应推进受控模拟路由 runbook、adapter ops 状态和最终可演练的 paper execution adapter。
- paper route runbook 证据台账已经承接 paper-order lifecycle 并收紧：`POST /api/execution/adapter-paper-route-runbooks` 必须引用已记录且状态为 `lifecycle_recorded`、且携带 `manifestValidationId` 的 paper lifecycle，并要求 lifecycle 已接受、paper 账户快照已捕获、风控检查已复核、回放计划已记录和操作员确认不进行实盘路由五项确认；缺项、引用缺失 lifecycle 或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `runbook_recorded` 并写入 `eventType=execution_adapter_paper_route_runbook`。`GET /api/execution/adapter-paper-route-runbooks` 可按 adapter 回读最近 runbook 记录，前端 `recordExecutionAdapterPaperRouteRunbook` / `loadExecutionAdapterPaperRouteRunbooks` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterPaperRouteRunbookRows` 会把订单意图、确认数、lifecycle/runbook step 数、阻断摘要、同链路 `manifestValidationId` 和 no-route-executed 边界压缩成 Settings 的 compact 证据行；`buildPromotionReadiness` 现在也会选择同链路 `runbook_recorded` 作为 adapter certification stage 的候选证据，显示 runbook step、确认摘要、阻断摘要、`manifestValidationId` 和 no-route/live-blocked 边界，仍保持 `certification_pending`。该层只记录受控 paper 路由手册，不连接券商或交易所下单端点、不提交 sandbox/paper/live 订单、不执行任何路由、不写环境变量、不重启服务、不生成真实资金成交，并继续固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false`、`liveTradingAllowed=false`；下一步应推进 adapter ops 状态、可演练的 paper execution adapter 和组合级风控联动。
- adapter ops state 证据台账已经承接 paper route runbook 并收紧：`POST /api/execution/adapter-ops-states` 必须引用已记录且状态为 `runbook_recorded`、且携带 `manifestValidationId` 的 paper route runbook，并要求 runbook 已接受、监控通道已就绪、急停演练已记录、paper 账户已对账和操作员确认实盘交易仍关闭五项确认；缺项、引用缺失 runbook 或上游缺少 manifest validation 时返回 `blocked`/`404`，完整确认返回 `ops_state_recorded` 并写入 `eventType=execution_adapter_ops_state`。`GET /api/execution/adapter-ops-states` 可按 adapter 回读最近 ops state，前端 `recordExecutionAdapterOpsState` / `loadExecutionAdapterOpsStates` 已具备 URL builder、typed client 和脱敏响应校验，`buildExecutionAdapterOpsStateRows` 会把订单意图、确认数、ops step 数、阻断摘要、同链路 `manifestValidationId` 和 no-route/no-live 边界压缩成 Settings 的 compact 证据行；Settings 现在也会以最近 paper route runbook 为入口展示五项 ops state 确认、提供“记录 ops state”动作，并在同一行显示最新记录结果，避免该层只停留在只读历史。`buildPromotionReadiness` 现在会在 adapter paper execution 之前优先展示同链路 `ops_state_recorded`，把 ops step、确认摘要、阻断摘要、`manifestValidationId` 和 live-blocked 边界并入晋级队列，但不会让实盘路由越过 paper execution 和认证策略。下游 adapter paper execution 已承接并强制校验该 ops state 的 `manifestValidationId` 并生成本地 simulated fill 证据；该层只记录监控、急停和 paper 对账状态，不连接券商或交易所下单端点、不提交 sandbox/paper/live 订单、不执行任何路由、不写环境变量、不重启服务、不生成真实资金成交，并继续固定 `orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false`、`liveTradingAllowed=false`、`paperOnly=true`；下一步应推进组合级风控联动、实盘前运行面板和真实适配器 secret-store 应用闭环。
- 最新更新：adapter paper execution 提交接口已经补齐幂等保护。`POST /api/execution/adapter-paper-executions` 在同一 `adapterOpsStateId` 已存在 `paper_execution_recorded` 证据时，会返回 `execution_adapter_paper_execution_already_recorded` 和 `existingAdapterPaperExecution`，不会再次生成新的 simulated fill、不会重复写 `execution_adapter_paper_execution` 审计事件；前端 `recordExecutionAdapterPaperExecution` 会识别该 409 响应并复用既有 execution，同时保留 error 供 UI 解释“该 ops state 已有执行证据”。blocked 记录仍允许后续修正为成功记录。该能力只防止本地 paper-only 证据重复入账，不提交真实订单、不连接券商、不改变 live-blocked 边界。
- 最新更新：Settings 工作区的 adapter paper execution 按钮动作已经承接上述幂等保护。当前端收到 `execution_adapter_paper_execution_already_recorded` 且带回 existing execution 时，会把既有证据合并回执行列表、显示 `Adapter paper execution reused`（中文界面为“适配器模拟执行已复用”）状态并继续刷新 Settings 历史，而不是把重复提交误标为失败或中断证据回读；真正缺少执行证据或后端错误时才进入 failed 分支。该改动只修正本地 UI 交互语义，不重新写审计事件、不重复生成 simulated fill、不提交任何真实订单，也不改变 paper-only/live-blocked 边界。
- 最新更新：状态栏 i18n 现在支持带证据后缀的 adapter paper execution 状态。`statusLabel` 会先精确匹配，再对 `Adapter paper execution recorded/blocked/reused · <adapterId>` 这类动态状态翻译前缀并保留 adapter id 后缀，因此中文界面会显示“适配器模拟执行已记录/已阻断/已复用 · ashare-live”，避免 Settings 按钮动作成功后仍冒出英文状态。该能力只修正文案与上下文保留，不新增执行、不写审计账本、不提交订单、不改变实盘阻断。
- 最新更新：Execution 晋级队列面板现在不再只依赖 adapter certification stage 的一句摘要，而是直接展示最近的 sandbox 订单 schema dry-run、paper order lifecycle、paper route runbook、adapter ops state 和 adapter paper execution 证据行。每行都会显示 adapter、状态、确认摘要、阻断摘要、关键 step/order/fill 摘要、`manifestValidationId` 和 audit event id，并沿用现有 positive/warning/risk 边界样式；这些证据只提升 paper-only 晋级链路的可见性，不新增订单、不连接券商、不改变 `certification_pending` 和 live-blocked 边界。
- 最新更新：Audit 工作区现在也能回读 adapter paper execution 审计账本。前端新增 `buildExecutionAdapterPaperExecutionAuditLedgerRows`/Summary/Filter，将 `eventType=execution_adapter_paper_execution` 的后端审计事件压缩为只读行，展示 adapter id、ops state id、manifest validation id、模拟成交摘要、确认摘要、阻断原因和 `paper only · live blocked · no route executed` 边界；Audit 页面新增“适配器模拟执行审计”面板，分页读取该类事件，支持按 execution id、adapter、manifest、标的、状态和 live-blocked 搜索，并复用 `auditReportQuery` URL 与“复制审计链接”恢复过滤上下文。该能力只增强 adapter paper execution 证据可发现性，不新增委托、不触发模拟成交、不连接券商、不提交 sandbox/paper/live 订单，也不改变实盘阻断。
- 最新更新：Settings/执行适配器工作流中的 adapter paper execution 结果行已经能直接进入对应 Audit 查询上下文。每条已生成的适配器模拟执行结果会显示“审计定位”和“复制审计链接”，查询 token 包含 `execution_adapter_paper_execution`、adapter paper execution id、audit event id、adapter id、manifest validation id、模拟标的和状态；点击定位会切换到 Audit 工作区并过滤“适配器模拟执行审计”面板，复制链接会生成 `workspace=audit&auditReportQuery=...` 的可分享深链。该能力只连接只读证据定位，不新增执行、不写账本、不提交任何订单，也不放开 live-blocked 边界。
- 最新更新：adapter paper execution 审计面板现在也能反向打开 Settings 中的执行证据。Audit 的每条适配器模拟执行审计行新增“打开执行证据”动作，点击后切换到 Settings 工作区，按该 audit event id 高亮并滚动到对应 adapter paper execution 结果行，让操作者能从审计流水回到产生证据的确认链、模拟成交摘要、manifest validation id 和 live-blocked 边界。该能力只做前端只读定位，不修改审计事件、不重新记录模拟执行、不提交 sandbox/paper/live 订单，也不改变实盘阻断。
- 最新更新：adapter paper execution 的 Settings 反向定位现在也可复制和跨会话恢复。Audit 行新增“复制执行证据链接”，生成 `workspace=settings&adapterPaperExecutionAuditEvent=<auditEventId>` 深链；页面启动时会读取 `adapterPaperExecutionAuditEvent` 参数并恢复 Settings 中对应 adapter paper execution 结果行的高亮与滚动，Audit 行“打开执行证据”也会同步写回同一个 URL 参数，方便刷新、隔天复核或发给小团队成员定位同一条执行证据。该能力只恢复前端证据焦点，不写审计账本、不重放模拟执行、不提交订单，也不改变实盘阻断。
- AI 评审已经开始绑定审计证据，并会把同数据快照基准收益、Alpha 和参数扫描摘要纳入证据卡、评审 dossier、回测解释动作和可导出的 Markdown AI 评审报告；同时可以导出和保存结构化 AI Review Run Record JSON，记录 citation、委员会轮次、决策日志、安全边界和 `evidenceAnchors` 证据锚点。AI 证据卡、评审 dossier、Markdown 报告、结构化记录和解释/辩论动作现在复用同一套审计上下文绑定检查：只有 run 的市场、标的和周期与当前研究上下文一致时才允许生成 AI 评审证据；错配 run 会被标记为 stale 并阻断导出、保存和 AI 解释动作，避免旧回测被包装成当前结论。前端 AI Review 面板已经接入 `AiReviewRunStore` 与 `/api/research/runs/{runId}/ai-reviews` 的 POST/GET 契约，可把该记录绑定到审计 run，并在 run 回放/导入后恢复最近保存的 AI 评审记录；本地核心读取接口已经支持按 run 返回 AI Review Run Record，并提供 `limit`、`offset`、`query` 和 `pagination` 元信息；Audit 工作区已经把搜索框和上一页/下一页控件接入该后端契约，按当前 run 拉取 AI Review Run Record 当前页，并使用后端 `total` 同步漂移摘要和已保存记录历史；Audit 工作区能把当前 run id、策略版本、dossier 状态、引用数量、委员会轮次、实盘边界和执行前风控审批与最近或用户选中的保存记录做轻量对照，也能汇总当前页保存记录相对当前证据的漂移项，方便在回放页确认 AI 解释是否绑定了正确数据、回测、研究笔记和风控边界；研究运行 JSON 复现包已经把已保存 AI 评审记录作为 `aiReviewRuns` artifact 导出，并保留 `run:*`、`strategy:*`、`data:*`、`citation:*`、`committee:*`、`decision-log:*`、`boundary:*` 等证据锚点，导入时会校验并写回目标核心的 `AiReviewRunStore`，让跨机器回放也能恢复 AI 委员会证据链；Audit 工作区已经把当前记录、保存记录和时间线引用合并成可搜索的导出证据索引，可按 anchor、`exportPath`、引用值或说明快速定位复现包证据；Audit 工作区也已经新增研究运行复现包预览，统一显示 `researchRun`、`dataSnapshot`、`strategyConfig`、研究笔记、回测流水、`aiReviewRuns`、模拟执行、晋级候选和执行交接的导出就绪度，方便在进入原始 JSON 前先确认缺失或阻断项；参数候选继续使用“复审候选/非投资建议”措辞，不直接给买卖建议。
- 前端研究流水线会在 run summary 缺少数据快照时自动读取完整 run detail，保证 Backtest Report 和 AI 评审能拿到同一份审计 K 线。
- 前端风险审批和本地晋级 fallback 会优先读取审计 run 内的 `strategyConfig.risk`，避免用户编辑当前草稿后污染已审计运行的仓位和回撤审批。
- 执行中心的模拟委托预览和 projected paper position 会用审计 run 的仓位上限和初始资金计算名义金额，和后端真实 paper execution 的下单数量保持一致。
- Paper Trading 已经开始绑定审计运行；提交模拟委托前会校验审计 run 内的结构化策略风控字段，缺少仓位、止损、止盈或最大回撤时不会生成默认委托。执行中心、风险审批、模拟持仓预览和晋级队列现在复用同一套审计上下文绑定检查：只有 run 的市场、标的和周期与当前研究上下文一致时才允许预览委托数量/名义金额、提交模拟委托和进入 promotion readiness；错配 run 会被标记为 stale audited run，并把委托、持仓和晋级全部保持 blocked，避免旧回测驱动当前交易上下文。晋级队列也复用同一风险交接校验，即使存在历史模拟成交，缺失风控的审计 run 仍会保持 promotion blocked。
- Paper Trading 执行交接已经把审计数据质量纳入硬闸门；`dataQuality.isComplete=false`、`demo-fallback` 或缺失数据质量的审计 run 不能提交模拟委托，也不能进入可晋级状态。
- 前端 Risk Approval 已经显示同一条数据质量 gate；模拟委托预览和晋级队列会在提交前阻断 `demo-fallback`、`unknown`、缺失或不完整的审计数据源，避免用户把后端拒单误读成可执行机会。
- Settings 工作区已经开始读取本地核心 `/api/settings/status`，展示 A 股、美股、加密货币数据源状态、可选 API Key 是否本地配置、SQLite 行情缓存路径、缓存行数、市场/标的/周期上下文数量、最新 K 线时间、最近缓存上下文清单、每个缓存上下文的 freshness、缓存 freshness 汇总和执行适配器安全闸门；缓存上下文可通过 `/api/cache/refresh` 手动刷新并回写最新状态。设置接口只返回配置状态，不返回密钥值。
- P0 黄金路径状态已经有本地核心契约 `/api/golden-path/status`：按当前市场、标的和周期汇总行情缓存、审计研究 run、回测证据、AI 评审、模拟执行和实盘闸门，返回当前卡点、下一步动作、每一步状态、紧凑进度摘要、可复用 runbook 明细和每个产品工作区的 `ready` / `needs_run` / `blocked` 状态；前端当前任务卡已接入该状态，会优先执行刷新行情、运行流水线、提交模拟委托或跳转设置闸门等下一步动作，并显示可点击的黄金路径进度和当前/后续步骤清单，可直接跳转到相关工作区；左侧工作区按钮和当前任务卡都会优先显示黄金路径返回的工作区状态、关联步骤和阻断原因，当前任务卡内的工作区动作可直接复用同一套 Golden Path 动作路由；Audit 工作区已经接入完整黄金路径审计清单，逐步展示状态、阻断说明、工作区跳转和可执行动作，且清单动作复用同一套禁用闸门，不能绕过运行中、刷新中或缺失审计 run 的限制。runbook 明细为后续任务队列、审计页和工作区内步骤清单提供统一语义，避免页面各自拼接阻断原因。
- 前端现在会从同一份 Golden Path 状态派生 P0 可用性摘要：`buildP0PlatformReadinessSummary` 会把 passed/review/blocked 步骤数、当前缺口、下一动作目标和 live boundary 收口为 `unknown/blocked/review/paper_ready/live_ready` 五种状态；顶部当前任务卡会显示 P0 完成百分比、当前缺口、对应 action label、目标 workspace 和“模拟可用但实盘仍阻断”的边界说明，中文界面也会把当前缺口翻译成“动作 -> 工作区”的直接指引，避免用户只看到很多工作区按钮却不知道整个平台距离真正可用还差哪一步。
- P0 可用性摘要现在进一步派生 `buildP0PlatformBacklogItems` 缺口队列：从 Golden Path runbook 中筛选未完成步骤，按当前卡点、阻断项和复核项排序，最多展示 3 条可操作任务；当前任务卡中的队列项会显示步骤、优先级、动作和原因，点击后跳转到目标工作区，让“距离可用还差什么”变成明确的下一步入口。
- P0 缺口队列现在不再只是跳转入口：每一行都有独立“工作区”和“动作”控件，动作复用 `runGoldenPathActionById`、`isGoldenPathActionDisabledById` 和既有预检闸门，可以触发刷新行情、运行流水线、AI 评审、提交模拟委托或查看实盘闸门；禁用状态仍由同一套 Golden Path/Research preflight 判断控制，不绕过审计、风控或实盘阻断。
- P0 缺口队列的动作现在会在行内显示紧凑 gate hint：`run-pipeline` 复用 Research 上下文预检摘要，模拟委托、缓存刷新和无直接动作的缺口会显示本地禁用原因，让用户知道按钮灰掉是因为缺少审计/AI/模拟执行闸门、刷新占用，还是只能先进入工作区复核。
- Golden Path 的 `run-pipeline` 动作现在会同时显示 Research 上下文预检摘要：如果只剩 review gate，当前任务按钮和工作区动作会提示运行前需要确认并列出前几个复核项；如果存在 blocked gate，则同一位置提示先修复阻断项。该提示复用 `ResearchPipelinePreflight`，不改变审计流水线的实际运行、确认或阻断规则。
- Audit 工作区的完整 Golden Path runbook 也复用同一套预检提示：当某一行的动作是 `run-pipeline` 且 Research 上下文仍有 review/blocked gate 时，行内会展示同样的复核或阻断摘要，让审计清单、当前任务卡和工作区动作保持同一判断口径。
- Audit 工作区的 Golden Path runbook 现在进一步复用 P0 缺口队列的禁用动作说明：`submit-paper-order`、缓存刷新和等待中动作会在行内显示紧凑 gate hint，说明是缺少审计/AI/模拟执行闸门、刷新通道占用还是当前任务未完成；该提示只解释现有禁用状态，不放宽任何审计、风控或实盘阻断。
- Golden Path 的 `submit-paper-order` 动作现在可以先绑定本地核心返回的 `latestRunId`：当后端已经判定当前上下文有可用审计 run、但前端当前 workspace 还没有回放该 run 时，动作不再永久灰掉，而是先从运行历史或 detail API 回放最新审计 run 并切到 Execution / paper 工作流；只有 run 在点击前已经绑定且风控审批未阻断时才会立即提交模拟委托。该恢复动作不绕过 AI 证据、风控审批、paper-only 或实盘阻断。
- P0 可用性报告入账后，Audit 报告历史行现在会直接暴露纸面盘预检摘要：`p0_readiness_report` 会从 metadata 投影 preflight state、primary action、通过/复核/阻断 gate 计数和 paper-only/live-boundary，并以紧凑徽标展示；报告历史搜索也能命中 preflight 状态、动作 id/名称和边界。最新 P0 audit aid 的主定位查询现在也会携带 P0 状态/进度、完成步数、preflight 状态、主动作、`review + blocked` attention 数、gate 分布和 paper-only/live-boundary；Audit 摘要区也会直接显示最新 P0 进度徽标，例如 `P0 progress 4/7 · blocked 57% · AI review`，让用户不点链接也能判断闭环卡在哪一步；旧报告缺少 preflight metadata 时不会伪造空 gate。该报告仍只是 audit aid，不进入签名链，不触发委托，不放宽实盘阻断。
- Audit 报告历史里的单条 P0 可用性报告现在也有独立的“定位 P0 报告 / 复制 P0 报告链接”动作，复用同一条带 P0 状态、完成度和 preflight 证据的主定位查询；每条 P0 报告行也会显示自己的 `P0 progress` 徽标，并新增“定位进度 / 复制进度链接”行级动作，直接使用 `p0-progress-focus` 查询过滤该报告当时的完成度证据。操作者查看旧报告、搜索结果或非最新报告时，也能先看到并复制该报告当时的 P0 闭环上下文，而不必依赖顶部“最新辅助”摘要。该动作只过滤 Audit 历史，不运行当前缺口 action、不提交模拟委托、不写新账本、不改变签名链或实盘边界。
- Audit 报告历史顶部的“最新辅助”汇总现在也会上浮最新 P0 报告的纸面盘预检徽标，显示 preflight 状态、primary action 和 gate 计数，方便先判断最新 audit aid 是否仍需复核；该汇总只读，不新增下单、签名或实盘授权入口。
- 最新 P0 audit aid 的纸面盘预检汇总还会把 `review + blocked` gate 汇总成“预检关注 / Preflight attention”计数，让 Audit 页顶部先暴露最新可用性报告仍需人工处理的数量；该计数只读，不并入签名链 attention，也不改变实盘阻断。
- 最新 P0 audit aid 的纸面盘预检汇总还会上浮 primary action label，Audit 报告历史摘要会显示“下一步 / Next action”（例如加载最新审计运行、提交模拟委托或复核风控闸门），让操作者不打开报告正文也能看到 P0 收敛动作；该动作标签仍只读，不触发委托、签名或实盘授权。
- Audit 报告历史摘要选择最新 P0 audit aid 时不再依赖后端返回顺序，而是按 `createdAt` 选择时间最新的 `p0_readiness_report`，避免分页、导入或不同存储排序导致“最新辅助”“下一步”和“预检关注”指向旧报告；该选择规则仍只影响只读摘要。
- Audit 报告历史摘要里的“最新” hash 也改为从所有 ready 报告中按 `createdAt` 选择时间最新的一条，而不是取当前数组里的第一条 ready 报告；分页、导入或后端排序变化不会再让顶部 hash 指向旧报告。
- Audit 报告历史摘要的“最新” hash 现在同时显示来源报告类型（审计证据报告、回测报告、组合报告或 P0 可用性报告），避免操作者只看到短 hash 却不知道它指向哪类证据；该字段仍由只读 ledger row 派生，不改变签名、验签、撤销或 P0 审计辅助边界。
- Audit 报告历史摘要现在还会为最新 ready 报告生成确定性定位查询（报告类型、run id、短 hash、文件名），用户可从摘要点击“定位最新 / Focus latest”直接把现有搜索框切到该报告行；该动作只过滤当前账本视图，不写后端、不改变分页数据、不触发签名或执行。
- 行情中心的数据源健康面板已经接入当前标的/周期的缓存上下文，可直接刷新当前 K 线缓存，并在刷新后回写 Settings 状态和重新加载图表。
- 行情中心标的搜索现在会按当前选择周期返回本地 K 线缓存覆盖状态：`GET /api/market/search` 可接收 `timeframe`，每条 suggestion 会带 `cache.freshness`、行数、ageHours 和起止时间；前端搜索下拉同步展示 fresh/stale/empty 摘要，用户在切换标的前就能判断是直接进入研究还是先刷新行情缓存。该能力只增强 Stage 1 行情/研究可用性，不创建策略、AI 评审、组合、模拟委托或实盘行为。
- 行情中心新增只读市场交易时段状态：本地核心 `GET /api/market/calendar` 会按 A 股、美股和加密货币返回统一的市场、时区、开闭市状态、当前 session、下一次开/收盘、静态模板 warning 和来源；Market 工作区会随当前市场展示该状态卡。当前实现是本地 session template，不包含完整节假日表，只用于 Stage 1 行情/研究复核，不解锁模拟委托、真实委托或任何交易路由。
- 行情中心搜索建议现在可以直接补齐缺失或过期的当前周期缓存：`empty` / `stale` suggestion 会显示独立“刷新缓存”动作，点击后切到该标的研究上下文，复用单标的缓存刷新 API，并在刷新后重新加载该标的 K 线。主建议点击仍只负责选择标的，刷新按钮不嵌套在主按钮内，避免误触；该动作仍然只处理 Stage 1 行情缓存和研究入口，不创建后续交易证据。
- 研究上下文就绪清单的本地缓存行已经和搜索刷新入口形成闭环：fresh 缓存会明确提示可支撑审计研究；stale、empty 或缺失缓存会提示从搜索建议刷新或当前缓存刷新后再运行审计研究，同时保留既有 ready/review/blocked 闸门和刷新动作。
- 黄金路径的行情数据步骤现在也沿用同一套缓存和刷新证据语义：fresh 缓存会显示“可支撑审计研究”，并在 API 路径读取最近自选缓存刷新运行；若没有匹配、完整、无 warning、非 demo/unknown 的刷新证据，则把 market-data 保持为 review，并把当前任务、工作区状态和审计清单动作指向 Market 工作区的 `refresh-watchlist-cache`，直接生成可锁定的数据准备证据；stale、empty 或缺失缓存会把下一步原因写成“刷新行情后再运行审计研究”，并继续指向单标的 `refresh-data` 动作。
- 行情中心已经开始承担 watchlist 数据准备职责：当前周期下会显示自选缓存 fresh/stale/empty 摘要；一键刷新自选列表缓存现在会调用核心 `POST /api/cache/watchlist-refreshes`，生成本地 SQLite 持久化的 watchlist cache refresh run，记录 run id、可选人工覆盖审计事件 id、每个标的的数据质量、入库行数、跳过/失败原因和最新 Settings 状态；前端刷新设置时会通过 `GET /api/cache/watchlist-refreshes?limit=4` 回读最近运行，数据源健康面板会同时显示最近一次摘要、最近多次刷新历史和选中运行的逐标的状态明细，点击历史 run 可切换明细，点击明细行可切换到对应研究上下文，页面刷新或 Docker 重启后仍能看到自选数据准备证据链。
- 图表 K 线接口已经接入本地 SQLite 缓存兜底；外部 K 线源离线或只返回 incomplete fallback 时，会优先返回 `local-cache`，并避免把 demo fallback 写入本地缓存。
- 研究流水线也已经接入同一套本地行情缓存兜底；外部 K 线适配器离线或只返回 incomplete fallback 时，回测、AI 解读和审计 run 会使用 `local-cache` 数据质量继续完成，并避免把 demo fallback 污染到 SQLite 缓存。
- 研究流水线即时返回的 `researchRun` 已经携带 `dataQuality` 和 `strategyConfig`，与持久化审计 run 保持一致；前端刚跑完流水线时即可用已审计数据质量和结构化策略风控驱动 Backtest、AI Review、Paper Trading 和风险闸门。
- 前端研究流水线成功日志已经展示本次审计运行的数据源、完整性、warning 数、策略 revision 和执行模式，便于用户区分真实上游、local-cache 和降级数据。
- RSI 策略条件已经进入 P0 基础规则能力：`RSI14 < 30` / `RSI14 > 55` 这类草稿会生成结构化 `rsi_below` / `rsi_above` 条件，策略预检显示 RSI gate，回测按 RSI 阈值触发交易，审计回放会恢复可读规则和参数标签；前端构建器现在可以直接在 SMA 与 RSI 条件间切换，并把阈值保存为可复现草稿字段，也可以把 RSI 作为入场确认条件叠加在 SMA 主条件上。
- 导出、导入和完整性校验已经存在；manifest artifact counts 已覆盖数据快照、交易流水、研究笔记、模拟执行、组合纸面委托批次、晋级候选和 AI 评审记录，防止复现包宣称的证据数量和实际内容不一致。Audit 工作区现在有导出复现包预览、AI 证据索引、复现包浏览器、近期复现包索引和导入影响预检；用户可从运行历史加载指定 run 的 JSON 包，检查 manifest、SHA-256 integrity、数据/回测/研究笔记/模拟执行/组合委托/AI 评审/执行交接数量是否与包内 artifact 一致，也可一键索引近期运行包并按 run、标的、hash、阻断原因、artifact、`auditReport`、`backtestReport`、报告短 hash 和执行交接跨包搜索；若索引包内报告 run/上下文/hash/Markdown 或执行类 artifact 数量与 manifest 不一致，索引行会直接标记为 blocked。外部 JSON 文件导入已经改为先进入同一套预检面板，显示复现包 SHA-256 integrity、manifest artifact 数量、run id、上下文、周期、数据 hash、策略 revision、研究笔记、模拟执行、组合纸面委托批次、AI 评审、可选 Audit Markdown 报告、可选 Backtest Markdown 报告和实盘边界会新增、变更、替换或阻断；若 integrity 无效、artifact 数量与包内载荷不一致，或 `auditReport` / `backtestReport` 的 run/上下文/hash 与 manifest 不一致，确认导入会在前端预检阶段禁用，用户确认后才会调用本地核心写入。导入预检、阻断、取消、失败、确认写入、主动撤销和撤销完成状态现在会进入后端 `AuditEventStore` 与 `/api/audit/events`，Audit 工作区进入时会按后端 query、limit/offset 分页回读导入事件，并继续显示 run、文件、阻断/变更数量、exportPath、失败分类、恢复提示、确认导入前绑定的旧 run 和后端返回的 undo token；确认导入事件可先在行内打开二次确认，再携带 undo token 和该事件 run id 调用 `/api/research/runs/import/undo` 撤销本次写入，撤销成功后同一审计事件会刷新为 `undone`，隐藏重复撤销入口并显示 token 已消费，也保留旧 run 回放作为上下文恢复兜底；撤销失败会新增 `undo-failed` 审计事件，保留失败原因、undo token、旧 run 回放入口和恢复提示，同时保留原 confirmed 事件用于匹配 run 后重试。Audit 导入审计面板已经补上 all/待复核/可撤销/可恢复/已撤销筛选、撤销失败计数和 blocked/schema/integrity/artifact/core/unknown 失败聚合卡；文本搜索由后端跨完整账本查询，阶段筛选作用于当前页，上一页/下一页由后端 pagination 控制，避免事件超过 12 条后只能看最近窗口；confirmed、undone 和 undo-failed 事件现在可以一键打开该 run 的复现包证据，复用复现包浏览器和导入影响预检上下文，让历史流水从“记录”变成恢复/复盘入口；打开证据时会把 `manifest:<runId>` 等审计锚点规范化为可命中的查询，并同步聚焦复现包浏览器和导入 diff 搜索框；每条导入审计事件也能复制当前应用 URL 形式的证据锚点，包含 `auditEvent`、`runId` 和 `exportPath`，便于外部审计报告回指同一复现证据。后端导入写入阶段已经加入补偿式事务回滚：若研究 run、研究笔记、策略版本、模拟执行、组合纸面委托批次或 AI 评审任一 store 在写入中途失败，API 会返回 `research_run_import_write_failed`，并全量恢复导入前记录或删除本次半写入记录；成功导入则写入 `ResearchRunImportUndoStore`，撤销前会校验 `expectedRunId` 与 undo token 绑定 run 一致，错配返回 `research_run_import_undo_run_mismatch` 且不会消费 token，撤销后会把 undo token 标记为 consumed，避免重复撤销。打开带 `auditEvent` 参数的链接时会把导入审计查询初始化为该事件 id，并在事件出现时滚动/高亮对应流水行；若 URL 同时包含 `runId` 和 `exportPath`，前端会复用打开证据入口自动拉取该 run 的复现包，并把包浏览器和导入 diff 查询初始化到对应 artifact，形成从外部审计报告回到复现证据的完整深链体验；复现包浏览器会显示深链加载状态和重试入口，下载的 JSON 复现包也会附带可选 `auditEvidenceSummary`、`auditReport` 和 `backtestReport`，用于跨机器保留当时的包焦点、导入 diff 摘要、Audit 报告和 Backtest 报告证据。
- 复现包内的 `auditReport` 与 `backtestReport` 现在可以携带无 secret 的签名元数据，包括 `signed`、`verified`、`revoked` 或 `invalid` 状态、原始签名报告事件 eventId、signer、key id、algorithm、chain id、签名值和签名/验签/撤销时间。包浏览器、近期复现包索引和导入影响预检都会显示并支持搜索这些签名状态和 key id；导入归一化会拒绝把 `secret`、`privateKey`、API token 或密码类字段塞进报告签名 metadata 的外部包，并会清除外部文件伪造的本机导入验签 marker。导入影响预检现在还会把 `revoked` / `invalid` 报告签名、以及 `signed` / `verified` 但缺少 event id、algorithm、chain id、key id、signer、签名值或时间戳的签名元数据标记为 blocked；`unsigned` 报告仍可作为无签章的离线证据导入，但不会被当成已签名材料。外部 JSON 文件进入导入预检前，前端会先把带 eventId 的报告 artifact 送到本地核心 `/api/audit/reports/verify-package` 做只读验签；验签结果会以 `local-core` provenance 写回导入 diff，验签失败会把签名状态刷新为 `invalid` 并在 diff 中阻断，不会把外部报告事件写入本地审计账本。若旧包或外部包里的 `auditReport` 虽然签名仍为 `signed/verified`，但内嵌 `auditEvidenceSummary.importVerification.invalid > 0`，导入影响预检也会把该报告标记为 blocked，提示其携带无效导入证据，避免旧签名绕过新的报告签名策略。导入审计事件会把每个 blocked diff 行的 id、标签、incoming 摘要、detail 和 exportPath 写入 `metadata.blockedRows`；成功确认导入时，还会从 `audit-report` / `backtest-report` diff detail 中提炼本地核心验签 provenance 写入 `metadata.verifiedReportSignatures`，Audit 历史行会直接展示这些证据，并支持后端回读后继续按 `Revoked signature`、`Signature chain blocked`、`Local core import verification`、`local-core`、验签状态或报告 exportPath 搜索；Audit 聚合卡还会把这些 blocked rows 汇总成导入验签、报告签名、复现包完整性、证据数量、实盘边界、数据快照和其他阻断证据桶，也会把 confirmed 导入里的 `verifiedReportSignatures` 汇总成本地核心验签通过/失败卡，显示最新文件、run、exportPath 和 reason，帮助用户先判断是导入证据策略问题、签名链问题、包损坏、执行边界问题，还是本地核心已经完成验签。
- 下载研究运行 JSON 复现包时，前端会额外读取同一 run 的 `audit_evidence_report,backtest_report` 账本事件，并只在 event type、run id、artifact kind、文件名、内容 SHA-256 和算法全部匹配时，把该事件的签名 metadata 连同原始报告事件 id 合并进对应 `auditReport` 或 `backtestReport` artifact；匹配失败或账本离线时仍导出未签名报告包，不阻断离线复现。
- Docker Compose 部署入口、Nginx API 反向代理和 Docker smoke helper 已经存在；GitHub Actions CI 会把测试、构建、Compose 校验、镜像构建和容器 smoke test 串成持续质量门禁。CI 和 web Docker build 现在统一使用 Node 24（`actions/setup-node@v6` + `node:24-alpine`），避免 Node 20/22 运行时与 GitHub Actions 默认 Node 24 迁移脱节；Compose 默认仍暴露 `${AIQT_WEB_PORT:-5173}:80`，但 Windows 本机如果把 5173 纳入 TCP excluded port range，需要用 `AIQT_WEB_PORT=8080` 等可用端口启动并运行 smoke。前端生产构建现在继续使用显式 `manualChunks` 控制体积，除 React、图表、图标、terminal API/workbench 和 Audit 面板外，也把 `src/lib/i18n` 独立成 `app-i18n` chunk；由于主入口已经是完整终端壳，Vite 构建预算显式设为 `chunkSizeWarningLimit: 550`，布局测试同时守卫分包策略和预算值，避免后续功能把未解释的大 chunk warning 带回 CI 或 Docker build。
- 中英文 i18n 基础已经存在。

### 需要产品级重构的部分

- 应用仍然像终端 demo，而不是完整交易平台。
- 左侧导航和页面任务关系不够清晰。
- 策略编辑已经开始结构化，但还不是生产级策略工坊；后续还需要更通用的条件树/OR 逻辑、用户自定义模板、参数对比和更清晰的版本治理。
- 数据源配置不是一等页面。
- 回测证据已经开始成为核心资产，参数扫描已从单纯 SMA 窗口推进到 SMA+RSI 确认阈值和 SMA+VOL 窗口组合，并有当前排名、复审候选、风险行数摘要、同上下文运行对比矩阵、导出报告里的同市场同周期跨标的横向比较，以及 Portfolio 工作区可运行的静态权重组合回测、协方差风险摘要、静态分配流水、再平衡复核流水、纸面交易复核流水、交易前风控检查账本和组合纸面订单事件账本 MVP；后续还需要补更正式的多参数扫描、真实组合成交/订单生命周期、完整协方差风险模型和报告模板。
- AI 评审已有 run id、数据质量、研究笔记、回测报告、基准 Alpha、参数扫描摘要证据引用、结构化 AI Review Run Record JSON、独立 Markdown 报告导出、本地核心持久化 API、前端保存/回放读取动作、后端分页检索契约、Audit 页证据轨迹、当前/最近或选中保存记录对照、当前页漂移摘要、执行前风控审批引用、接入后端 `query/limit/offset` 的审计页搜索和分页控件，以及把当前证据、保存评审和风控审批串成紧凑引用行的 AI 评审审计时间线；时间线引用已支持跳转回测证据、切换保存评审对照和进入执行审批，并显示导出包证据定位锚点；Audit 页已经提供导出证据索引、复现包浏览器、近期复现包索引、导入影响预检、外部文件导入确认、integrity 阻断、artifact 数量阻断、持久化导入审计流水、失败分类/恢复提示、旧 run 回放入口、主动撤销导入按钮、行内二次确认、撤销失败 `undo-failed` 复盘行、撤销后 `undone` 状态刷新、阶段筛选和失败聚合视图；后端导入写入失败会自动全量恢复导入前的 run/note/strategy/paper/AI review 状态，成功导入后也能通过 undo token 与 `expectedRunId` 双校验主动恢复。后续需要把 AI 评审、导入审计和 `auditEvidenceSummary` 进一步合并成可渲染、可签名的审计报告 artifact。
- 组合、风控、执行还不够像交易平台。
- UI 组件密度、比例和层级需要按工作区重排。

### 必须保留的能力

- 本地优先架构。
- 研究运行审计模型。
- 数据质量标签。
- Paper Trading 闸门模型。
- AI 证据边界。
- 多市场统一 schema。

### 必须重做的方向

- 导航和页面结构。
- 策略工坊。
- 回测报告。
- AI 评审委员会页面。
- 执行中心工作流。
- 设置和数据源配置。

## 7. 产品路线图

### 阶段闸门规则

从 2026-06-07 起，产品路线采用阶段通过制，避免继续把行情、策略、AI、组合、执行和实盘准备混在同一个开发流里。

当前允许新增功能的主线只有：

- 阶段 1：行情与研究。范围包括标的搜索、报价、K 线、缓存刷新、数据质量、图表行为、研究笔记、自选列表和研究上下文。

只允许维护和缺陷修复的基础能力：

- 阶段 0：平台基础。范围包括 Docker 部署、设置、审计导入导出、签名、安全边界、测试和 CI；这类改动不能引入新的交易功能。

暂缓新增功能、只允许修复阻断性 bug 的后续阶段：

- 阶段 2：策略与回测。
- 阶段 3：AI 评审。
- 阶段 4：组合与模拟交易。
- 阶段 5：实盘准备。

进入下一阶段必须满足本阶段退出标准，并在计划文档里显式记录。前端工作区现在也会显示所属阶段和阶段状态：`当前阶段`、`基础维护` 或 `后续规划`。这不是隐藏长期目标，而是让全功能平台按正确顺序长出来。

### P0：6 周 A 股单标的黄金路径

目标：做出个人或小团队每天能真实使用的一条端到端产品流程。第一版先选 A 股单标的，不追求多市场同时成熟，也不追求实盘交易。

范围：

- A 股标的搜索、行情刷新、K 线加载、本地缓存和数据质量检查。
- 研究工作台图表、因子上下文、研究笔记和数据准备证据。
- 策略工坊支持 SMA、RSI、成交量等基础可视化规则，支持 SMA + RSI + 成交量的基础 AND 组合，并提供 SMA 趋势、RSI 反转和放量突破内置模板。
- 策略工坊支持保存、查看、差异识别和跨上下文载入策略版本，载入后必须重新审计。
- 导入研究运行包后，包内策略配置必须以原始 revision 恢复到策略版本库，绑定导入的 audit run id，并在前端 Strategy Lab 最近策略列表中立即可见。
- 导入研究运行包后，包内研究笔记必须恢复到本地笔记库，保证研究上下文、策略版本、AI 评审和执行记录都能跨机器继续使用。
- Docker Compose 部署和 CI 质量门禁必须保持可用，避免平台黄金路径只能在开发机上运行。
- 策略工坊必须显示草稿就绪闸门：策略 schema、风控参数、执行模式和审计 run 绑定状态。
- 策略校验必须成为后端 API 契约，供前端、保存、回测、AI 评审和后续执行复用。
- 策略版本保存前必须先通过策略预检；schema 或风控阻断时不能写入策略库。
- 运行研究流水线前必须先通过策略预检；schema 或风控阻断时不能创建新的审计 run。
- 前端风控审批必须优先引用审计 run 的结构化策略风控，当前草稿变更不能改变历史 run 的执行审批。
- 前端模拟委托预览必须使用审计 run 的仓位上限和回测资金假设，不能固定 20,000 名义金额。
- 模拟交易提交前必须复核审计 run 的结构化风控字段，不能用默认仓位替代缺失风险参数。
- 实盘晋级候选必须复核审计 run 的结构化风控字段，不能因为历史 paper fill 存在就跳过 risk approval。
- Settings 必须通过本地核心状态契约显示数据源、缓存和适配器安全状态，且不能把 API Key 明文返回前端。
- 回测实验室支持单标的审计回测、费用、滑点、止盈止损和交易明细。
- AI 评审委员会锁定审计 run id，只解释数据、策略、指标和风险，不输出直接买卖建议。
- AI 评审运行记录必须能保存到本地核心，并在审计 run 回放、导出和导入后恢复。
- 模拟交易绑定审计 run id，提供委托、拒单、成交回执、账户/持仓回放和 paper-only 边界。
- 审计历史、回放、导出、导入。
- 清晰工作区导航。

验收标准：

- 用户可以从一个 A 股标的开始，完成搜索、加载真实/缓存数据、配置策略、运行回测、查看 AI 评审、创建模拟委托、回放运行并导出完整包。
- 没有审计证据不能运行 AI 评审。
- 没有审计运行不能提交模拟委托。
- 每个依赖行情的页面都能显示真实数据、fallback 数据、缓存数据和过期数据。
- 该闭环可通过 Docker 本地部署复现，并有自动化测试覆盖核心契约。

### P1：策略生产平台

目标：让策略工作可长期维护和比较。

范围：

- 策略库。
- 策略版本管理。
- 参数模板。
- 参数扫描。
- 回测对比面板。
- 基准对比。
- 报告生成。
- 保存策略生产平台布局、筛选器和策略草稿状态。

验收标准：

- 用户可以维护多个策略并比较版本。
- 回测结果可以跨标的、周期和参数集对比。
- AI 报告引用正确的策略版本和回测 run。

### P2：组合模拟与风控

目标：从单策略研究进入组合级模拟。

范围：

- 模拟账户管理。
- 多持仓组合视图。
- 组合敞口和回撤。
- 跨策略资金分配。
- 组合回测；已完成从已审计 run 生成静态权重组合草稿、缺 peer 时一键补跑对照审计、调用组合回测 API、展示组合结果、协方差风险摘要、静态目标分配流水、期末再平衡复核流水、纸面交易复核流水、交易前风控检查账本、组合纸面订单事件账本、组合纸面委托批次入账/查询、组合委托批次通用审计事件、组合委托人工审批 API/账本、组合委托模拟成交 API/账本、组合模拟账户/持仓回放、组合订单状态历史、模拟成交 route guard、可编辑组合风险模板、受控批量模拟路由、真实适配器前执行状态账本、适配器认证证据绑定晋级队列、适配器认证应用预检 API/UI、执行中心组合订单生命周期行、单笔审批 UI、批量/单笔模拟成交按钮和成交回执、导出报告、入账签名，以及组合集中度/现金/总敞口/再平衡漂移/风险贡献/协方差风险/相关性/负贡献/数据质量复核，下一步推进真实适配器 secret-store/受控重启准备。
- 交易前风控引擎。
- 风控规则编辑器。
- 紧急停止和人工覆盖。

验收标准：

- 用户可以跨多个标的模拟策略执行。
- 委托可以给出确定性的拒单原因。
- 模拟执行前后都能看到风险状态变化。

### P3：实盘执行准备

目标：在不削弱安全性的前提下准备受控实盘。

范围：

- 券商和交易所适配器认证框架。
- A 股券商适配器接口；只有在合法且技术文档明确的路径存在时再实现。
- 美股 IBKR 或 Alpaca 适配器形态。
- 加密货币 ccxt 交易所适配器；行情 OHLCV adapter 已落地，交易执行 adapter 仍必须走 sandbox、风控、人工确认和审计闸门。
- 账户同步。
- 委托对账。
- 实盘就绪清单。
- 人工确认和审计日志。

验收标准：

- 实盘执行不能在适配器认证、风控审批、人工确认任一缺失时开启。
- 所有实盘委托都能追溯到策略版本、回测 run、AI 评审、风控审批和账户状态。

### P4：运维与自动化

目标：支持长期运行。

范围：

- 定时数据同步。
- 定时策略扫描。
- 后台任务队列。
- 通知和告警。
- 运行监控。
- 失败恢复。
- 本地备份和恢复。

验收标准：

- 用户可以设置可重复的研究和模拟交易任务。
- 失败可见、可恢复、可审计。

## 8. 技术架构方向

### 后端模块边界

- `market_data`：适配器、缓存、数据源健康、交易日历。
- `strategy`：策略 schema、校验、版本、参数集。
- `backtest`：引擎、指标、交易流水、诊断、基准对比。
- `portfolio_backtest`：从已审计单标的回测 run 生成组合级权益曲线、现金缓冲、贡献和数据质量证据。
- `ai_review`：AI provider 抽象、智能体角色、报告生成、证据闸门。
- `portfolio`：账户、持仓、敞口、风险状态。
- `execution`：模拟适配器、实盘适配器接口、委托生命周期。
- `audit`：运行记录、事件记录、导出导入、完整性校验。
- `api`：HTTP 边界和未来桌面集成边界。

### 前端模块边界

- `MarketCenter`
- `ResearchTerminal`
- `StrategyLab`
- `BacktestLab`
- `AiReviewBoard`
- `PortfolioRisk`
- `ExecutionCenter`
- `AuditLog`
- `Settings`

当前大型 `App.tsx` 后续要按产品工作区拆分，而不是为了拆而拆。

### 核心数据合同

- `MarketDataAdapter`
- `MarketQuote`
- `OHLCVBar`
- `StrategyConfig`
- `BacktestRun`
- `ResearchRunAudit`
- `AiResearchRequest`
- `AiReviewReport`
- `RiskDecision`
- `ExecutionAdapter`
- `Order`
- `Fill`
- `AccountSnapshot`
- `AuditEvent`

## 9. 后续开发纪律

从这份规划开始，任何新增功能都必须映射到一个路线阶段和一个产品工作区。若该路线阶段不是当前阶段，则只能做阻断性 bug 修复、测试补强、文档校准或基础维护，不能继续扩展功能面。

每个功能必须先说清楚：

- 所属阶段，以及是否属于当前阶段。
- 用户任务。
- 输入。
- 输出。
- 闸门条件。
- 空状态。
- 错误状态。
- 审计要求。
- 测试要求。

实现顺序：

1. 更新或创建产品规格。
2. 写实现计划。
3. 写失败测试。
4. 实现功能。
5. 跑自动化测试。
6. UI 改动必须浏览器验收。
7. 提交并推送。

## 10. 下一步开发计划

规划文档落地后，下一步先做 P0 平台骨架，而不是继续零散补功能。

推荐顺序：

1. 把当前终端式导航替换为产品工作区：行情、研究、策略、回测、AI 评审、组合、执行、审计、设置。
2. 按工作区拆分 `App.tsx`，保持现有行为不丢。
3. 把审计回测 run 提升为 Backtest、AI Review、Paper Trading、Audit 之间共享的核心资产。
4. 将 Strategy Snapshot 改成真正的 Strategy Lab，支持结构化条件编辑。
5. 扩展 Backtest Report，继续把参数扫描从 SMA+RSI/VOL 推进到通用条件树、多标的回测、基准图表和报告导出。
6. 将模拟交易移动到 Execution Center，以委托生命周期和账户状态为主。
7. 增加 Settings，用于数据源、API Key、缓存、执行适配器认证。

近期已完成：

- Stage 1 研究上下文就绪清单现在可以复制、下载或入账为 Markdown 报告：Research 工作区的“研究上下文就绪”面板新增“复制报告”“下载报告”和“入账报告”动作，下载文件名会按 market/symbol/timeframe/生成时间做安全化处理，并由同一个 archive manifest 生成 Markdown、文件名、内容 SHA-256、上下文、预检状态、下一步动作、锁定数据准备证据和 ready/review/blocked 计数；复制、下载或入账成功后状态栏会显示短 hash，便于人工归档时核对。入账时前端会生成 `eventType=research_context_readiness_report` 的审计事件，metadata 只保留 artifact kind、文件名、内容 hash、market/symbol/timeframe、preflight status、next action、锁定数据准备 refresh run、ready/review/blocked 计数、研究深链和非实盘边界，不保存 Markdown 正文；Audit 报告历史会同页回读该报告，展示“Research context readiness report hash recorded”、package matched/total、unsigned hash 和研究上下文定位字段，但该报告和 P0 辅助报告一样不进入签名链、不允许签名/验签/撤销。报告输出当前 market/symbol/timeframe、可恢复研究深链、预检状态、下一步动作、ready/review/blocked 汇总、锁定的数据准备证据、所有 readiness gate、Open Issues 和审计运行证据行；报告里的深链会复用同一条 `watchlistRefreshRun` 证据选择规则，打开后可回到相同标的、周期和数据准备证据明细；报告明确标注仅作为研究上下文证据，不路由委托、不提供投资建议、不解锁实盘交易。
- Stage 1 研究上下文就绪报告的 Audit 行现在可以直接复核上下文：`research_context_readiness_report` 行会从 metadata 投影研究上下文深链、preflight status、next action 和锁定的数据准备 refresh run，并在报告历史里显示研究上下文 chip、数据准备 chip、“打开研究上下文”“复制研究链接”“定位数据准备”和“复制数据准备链接”。打开研究上下文会切回报告记录的 market/symbol/timeframe，恢复 `watchlistRefreshRun` 选择并同步 URL；该动作只恢复研究上下文，不重新生成报告、不运行流水线、不触发 AI、不提交模拟或真实委托。
- Stage 1 研究上下文就绪报告现在也进入 Audit 摘要层：报告历史顶部会把最新 ready 的 `research_context_readiness_report` 上浮为“最新研究上下文”，展示 run id、短 hash、preflight status 和锁定数据准备 run，并提供“定位研究报告”“打开研究上下文”“复制研究链接”。`auditAid` 计数现在同时统计 P0 可用性报告和研究上下文就绪报告，但 P0 专用的 current-gap/backlog 摘要仍只绑定 `p0_readiness_report`，避免把不同阶段的辅助材料混成一个下一步。
- Research 工作区现在也会回显最近一次已入账的 Stage 1 研究上下文就绪报告：复用 Audit 报告账本摘要中的最新 `research_context_readiness_report`，在“研究上下文就绪”面板显示 run id、短 hash、preflight status 和锁定数据准备 run，并提供“定位审计报告”“打开研究上下文”“复制研究链接”。这些动作只恢复已有审计查询或研究深链，不重新生成报告、不写入新账本、不运行流水线、不触发 AI、不提交模拟或真实委托。
- Research 工作区的最近入账报告回显现在按当前 `market/symbol/timeframe` 过滤：Audit 摘要仍可展示全局最新研究上下文报告，但研究页只显示与当前标的和周期匹配的最新 ready 报告，避免把 AAPL、BTC 或其他周期的报告误展示在 A 股当前研究上下文里；“定位审计报告”“打开研究上下文”“复制研究链接”也都只使用这条匹配后的报告。
- Research 工作区最近入账报告的“定位审计报告”查询现在复用账本模型层的统一 query helper，而不是在 React 里手拼字符串；这样 Audit 摘要、行级报告和 Research 回显使用同一套搜索语义，后续调整报告定位字段时不会出现页面之间漂移。
- Research 工作区最近入账报告现在有明确覆盖状态：模型层会按当前 `market/symbol/timeframe` 生成 `matched/context-mismatch/missing` 三态，匹配时显示当前上下文报告，存在其他标的或周期报告但当前未入账时显示“当前上下文未入账”，完全没有 ready 报告时显示“等待入账当前上下文”。当 `context-mismatch` 且存在其他 ready 报告时，Research 面板会显示该其他报告的 `market/symbol/timeframe` 和短 hash，并提供“定位其他报告 / Focus other report”和“复制其他报告链接 / Copy other report link”动作直接切到或分享 Audit 查询，帮助操作者确认不是当前上下文证据。该能力只解释和定位现有 Audit 账本覆盖范围，不自动生成报告、不写新事件、不运行流水线、不触发 AI 或任何交易路由。
- Stage 1 研究上下文现在有显式可分享链接：顶部工具栏提供“复制研究链接”，生成只包含 `workspace`、`market`、`symbol`、`timeframe` 和可选 `watchlistRefreshRun` 的深链；当研究预检已经锁定数据准备证据时会优先携带该刷新 run id，否则携带当前选中的刷新 run id，打开后沿用现有 URL 恢复逻辑回到对应行情/研究上下文和数据准备证据明细，不写入后端、不创建审计 run、不触发 AI、模拟委托或实盘路由。
- Stage 1 研究工作区现在可以本地持久化当前研究上下文：前端在行情研究/研究工作区提供“保存工作区”动作，调用核心 `PUT /api/research/workspace-state` 写入 SQLite；后续 `GET /api/workspace` 会在恢复自选列表后继续恢复保存的 market/symbol/timeframe，并把 `researchWorkspaceState.workspaceId` 返回给前端作为无 URL 参数时的初始 Stage 1 入口，Docker 重启或刷新后仍能回到上次研究标的、周期和入口。
- Stage 1 行情/研究 URL 现在可以携带研究上下文深链：`market`、`symbol`、`timeframe` 三个参数合法时会优先于本地保存状态恢复当前标的和周期，并在用户切换标的或周期后自动同步回 URL；如果深链标的不在已保存自选里，会进入当前会话自选并触发“自选未保存”复核，而不会静默改写本地自选。
- Stage 1 研究上下文就绪清单现在纳入“刷新证据”：页面会把最近自选缓存刷新运行与当前 market/symbol/timeframe 对齐，命中且完整、无 warning、非 demo/unknown 来源时显示就绪；命中刷新 run 时会提供“查看明细”入口，切到 Market 工作区并选中同一条 `watchlistRefreshRun` 证据明细；没有匹配刷新、刷新失败/跳过、数据不完整或来源需复核时显示为 review gate，并提供“刷新自选缓存”动作来生成同一类刷新证据，而 K 线/本地缓存行仍使用单标的缓存刷新；该复核项不会把已有可用缓存误判为硬阻断。
- Stage 1 研究上下文就绪清单和研究 run 快照现在纳入“交易日历证据”：前端会把当前市场交易日历作为 `calendar` 就绪行展示，开市且无 warning 时显示就绪，休市、盘中休市、未知或静态模板 warning 时进入 review gate；后端 `/api/research/run` 会把同一时刻的 `marketCalendar` 写入 `researchRun.dataSnapshot` 并随审计 run 持久化。该证据只用于研究复核和后续导出链路，不解锁模拟委托、真实委托或任何交易路由。
- Stage 1 黄金路径现在也会解释运行前交易日历复核：`/api/golden-path/status` 在当前上下文尚未生成审计 run 时，会把市场交易日历作为 `market-data` 步骤的附加 review 原因；缓存缺失、空缓存、过期缓存和刷新证据不完整仍优先提示刷新数据，缓存与刷新证据可用但日历处于静态模板 warning、休市或盘中休市时，下一步仍指向 Research 的运行流水线，由研究页复核确认承接。已有审计 run 后，黄金路径继续使用 run 中锁定的日历证据流转，不因当前时刻静态日历 warning 倒退主流程。
- Stage 1 黄金路径 runbook 动作现在携带显式目标工作区：后端每个 runbook action 会返回 `targetWorkspace`，前端 `GoldenPathRunbookPanel` 和工作区上下文会优先使用该目标执行动作，同时保留 runbook 行所属工作区不变。这样 `market-data` 行因为交易日历复核触发 `run-pipeline` 时，按钮会明确交给 Research 承接复核与流水线，而不是把研究动作误归到 Market。
- Stage 1 Audit 黄金路径 runbook 动作现在会显示和 P0 缺口队列一致的禁用原因：`run-pipeline` 继续复用 Research 上下文预检摘要，模拟委托、缓存刷新和等待中动作会提示缺少审计/AI/模拟执行闸门、数据通道占用或当前任务未完成。该提示只做可解释性增强，不改变任何 action 的可用条件、目标工作区或实盘阻断。
- Stage 1 Golden Path 模拟执行动作现在会用 `latestRunId` 做前端恢复：如果本地核心已经找到当前 market/symbol/timeframe 的最新审计 run，但页面尚未回放该 run，点击 `submit-paper-order` 会先加载并绑定该 run、切到 Execution 的 paper 流程，再由现有执行前审批控制后续提交。该行为只修复前端状态未绑定导致的可用性断点，不自动提交新委托、不绕过风控、不触碰实盘。
- Stage 1 审计策略版本现在进入 Audit / AI 证据时间线：当前审计 run 携带非草稿 `strategyRevision` 时，AI 评审审计面板会生成 `strategy-revision-evidence` 时间线项，锚定 AI Review Record 已使用的 `strategy:<revision>`，目标工作区指向 Strategy，并让证据索引可按 revision 定位 `researchRun.strategyConfig.revision`。该项只提升策略证据定位能力，不自动载入策略、不保存新版本、不运行回测，也不改变执行闸门。
- Stage 1 AI 引用证据集合现在进入 Audit / AI 证据时间线：当前审计 run 已生成 AI Review citations 时，AI 评审审计面板会生成单条 `citation-bundle-evidence` 时间线项，目标工作区指向 AI Review，并让证据索引可按 `citations:<citationCount>` 定位 `aiReviewRuns[].record.citations`。单条 citation 继续由现有 `citation:<id>` evidence anchor 精确索引，避免时间线被多条引用撑开；该项只提升引用集合的可发现性，不修改引用内容、不重新生成 AI、不改变风控或执行闸门。
- Stage 1 AI 委员会轮次现在进入 Audit / AI 证据时间线：当前审计 run 已生成 AI Review committee rounds 时，AI 评审审计面板会生成 `committee-rounds-evidence` 时间线项，锚定 AI Review Record 已使用的 `committee:<roundCount>-rounds`，目标工作区指向 AI Review，并让证据索引可按轮次数或 committee anchor 定位 `aiReviewRuns[].record.rounds`。该项只提升 TradingAgents 风格评审证据的发现性，不重新生成 AI、不给出买卖建议、不改变风控或执行闸门。
- Stage 1 AI 决策日志现在进入 Audit / AI 证据时间线：当前审计 run 已生成 AI Review decision log 时，AI 评审审计面板会生成 `decision-log-evidence` 时间线项，锚定 AI Review Record 已使用的 `decision-log:<decisionCount>`，目标工作区指向 AI Review，并让证据索引可按日志数量或 decision-log anchor 定位 `aiReviewRuns[].record.decisionLog`。该项只提升 AI 评审过程证据的可追溯性，不修改日志内容、不重新生成 AI、不改变风控或执行闸门。
- Stage 1 AI 安全边界现在进入 Audit / AI 证据时间线：当前审计 run 已生成 AI Review boundary 时，AI 评审审计面板会生成 `ai-boundary-evidence` 时间线项，锚定 AI Review Record 已使用的 `boundary:evidence-explanation-only`，目标工作区指向 AI Review，并让证据索引可按 boundary anchor 定位 `aiReviewRuns[].record.boundary`。该项只提升 AI 解释边界的可审计性，不放宽“只解释证据、不输出买卖建议或收益保证”的约束，也不改变风控或执行闸门。
- Stage 1 审计数据快照 hash 现在进入 Audit / AI 证据时间线：当前审计 run 携带 `researchRun.dataSnapshot.hash` 时，AI 评审审计面板会生成 `data-snapshot-evidence` 时间线项，锚定 AI Review Record 已使用的 `data:<hash>`，并让证据索引可按 snapshot hash 定位 `researchRun.dataSnapshot.hash`。该项只提升复现审计定位能力，不改变数据哈希算法、导入校验、研究流水线或执行闸门。
- Stage 1 交易日历证据现在也进入复现审计表面：研究运行导出预览新增 `market-calendar` 行，Package Browser 在数据快照后展示 `researchRun.dataSnapshot.marketCalendar`，近期复现包索引会显示 `calendar <status>/<session>` artifact，导入 diff 会比较当前和包内交易日历证据并标记 add/same/change。该能力仍只用于研究可复现性和导入复核，不影响模拟委托、真实委托或执行路由。
- Stage 1 交易日历证据现在进入报告层：AI Review Run Record 的 `evidenceAnchors` 会包含 `type=market-calendar` 的锚点，指向 `researchRun.dataSnapshot.marketCalendar`；Backtest Markdown 报告的 Data Snapshot 表会列出同一份市场、时区、开闭市状态、session、下一开/收盘、静态模板 warning 和来源信息。盘中休市或休市状态会优先展示下一次开盘，方便报告读者理解当时研究所处市场时段；该证据仍不改变任何交易执行闸门。
- Stage 1 交易日历证据现在也进入 Audit / AI 证据时间线：当前审计 run 锁定 `researchRun.dataSnapshot.marketCalendar` 时，AI 评审审计面板会生成可跳回 Backtest 证据的 `market-calendar-evidence` 时间线项，并让证据索引可按 `marketCalendar` 或交易日定位该锚点。该项只提升审计发现性，不改变模拟委托、真实委托或执行路由。
- Stage 1 研究上下文就绪清单现在纳入“工作区状态”：当前 market/symbol/timeframe/入口工作区已经持久化时显示就绪；切换标的、周期或 Stage 1 入口后显示需复核并提供保存工作区动作。研究流水线会把未保存工作区作为 review gate 要求显式确认，但不会阻断首次研究运行。
- Stage 1 研究上下文就绪清单现在纳入“自选状态”：当前自选列表已保存时显示就绪；选择新标的导致自选列表未保存时显示需复核并提供保存自选动作。研究流水线会把未保存自选作为 review gate 要求显式确认，但不会阻断首次研究运行。
- Stage 1 自选缓存刷新现在有可追踪运行记录：Market 工作区“刷新自选缓存”不再只是前端逐条调用单标的刷新，而是通过 `POST /api/cache/watchlist-refreshes` 让核心按自选顺序刷新、写入完整 K 线、记录 skipped/failed 行，并在数据源健康面板显示最近 run id、已刷新/失败数量、入库行数、最近多次刷新历史和选中运行的逐标的状态明细；如果该刷新来自 provider cooldown 人工覆盖，run 会持久化 `overrideAuditEventId`，历史摘要会显示这条覆盖引用，单标的 `POST /api/cache/refresh` 也会在 refresh 摘要中回显同一 id；选中的刷新 run 会额外显示是否覆盖当前 market/symbol/timeframe，覆盖且质量完整时可直接“回到研究”，未覆盖时提示选择匹配 run 或重新刷新自选缓存；历史 run 可点击切换明细并写入 `watchlistRefreshRun` URL 参数，打开 `workspace=market&watchlistRefreshRun=...` 或刷新页面会恢复同一次运行明细，非法 run id 会回落到最近运行；明细行可直接切换到对应标的和该条刷新证据自身的 timeframe，并优先保留自选列表中的行情字段，避免从 1d 刷新证据点入后仍停留在旧周期；`GET /api/cache/watchlist-refreshes` 可回读最近批量刷新运行，前端启动和刷新设置时会恢复最近 4 条作为数据准备证据。
- Stage 1 单标的缓存刷新现在也进入同一条数据准备证据链：`POST /api/cache/refresh` 在写入当前 market/symbol/timeframe K 线缓存后，会同步记录一个只包含当前标的的 `watchlist_cache_refresh` run，并在响应里返回 `watchlistRefresh`；前端刷新当前缓存或从搜索建议刷新后，会把这条 run 并入最近刷新历史并选中它，使后续 Research 流水线可以像自选批量刷新一样锁定 `preparationEvidence`。该能力只把单标的行情准备纳入审计证据，不创建策略、不触发 AI、不提交模拟或真实委托。
- Stage 1 研究流水线预检现在会显式展示即将锁定的数据准备证据：当研究上下文就绪清单中的刷新证据已覆盖当前 market/symbol/timeframe 且处于 ready 状态时，顶部运行区会显示该 watchlist refresh run id 的锁定提示；如果刷新证据进入复核或阻断状态，该提示消失并继续由预检 gate 要求用户先刷新或复核。该能力只提升运行前可解释性，不改变 `/api/research/run` 对匹配刷新记录的后端校验。
- Stage 1 研究流水线提交现在只使用预检锁定的数据准备证据：前端会从 `ResearchPipelinePreflight.lockedPreparationEvidence` 解析提交给 `/api/research/run` 的 `watchlistRefreshRunId`，而不是依赖 Market 明细面板当前选中的刷新 run；当预检没有 ready 刷新证据时不会把旁路选中的 run id 发送给核心，避免“界面显示锁定 A、后端实际收到 B”的审计错位。
- Stage 1 研究流水线运行日志现在也会显示锁定的数据准备证据：data 阶段日志从 `ResearchPipelinePreflight.lockedPreparationEvidence` 生成 `prep <watchlistRefreshRunId>` 标记，操作者在流水线运行中就能看到本次数据快照绑定的刷新证据；没有 ready 刷新证据时日志保持原有上下文文案，不把旁路选择误写入日志。
- Stage 1 工作流 data 阶段 artifact 现在也会展示锁定的数据准备证据：审计 run 已携带 `researchRun.dataSnapshot.preparationEvidence` 时，流水线阶段卡会在 Instrument/Timeframe/Rows 后追加 `Preparation evidence`，展示 watchlist refresh run id、入库行数和数据源完整性；未绑定审计 run 或未锁定刷新证据时保持原有三项 artifact，避免把运行前复核状态伪装成已锁定证据。
- Stage 1 研究 run 现在会锁定匹配的自选缓存刷新证据：当 Research 流水线从一个覆盖当前 market/symbol/timeframe 且质量就绪的 watchlist refresh run 启动时，前端会把该 run id 传给本地核心；`/api/research/run` 只在本地刷新记录中找到匹配 item 时，才把 `kind=watchlist_cache_refresh`、run id、刷新时间、状态、入库行数、数据质量和可选 `overrideAuditEventId` 写入 `researchRun.dataSnapshot.preparationEvidence`。该证据随 run detail、JSON 导出包、导入回放、Backtest、AI Review 和后续 paper-only handoff 一起流转，不创建交易委托，也不会把不匹配的刷新 run 写入审计快照。
- Stage 1 锁定的数据准备证据现在会在用户可审计表面显式展示：研究运行导出预览新增 `preparation-evidence` 检查行，AI Review 运行记录新增 `data-preparation` evidence anchor，Backtest Markdown 报告的 Data Snapshot 表会列出同一个 watchlist refresh run id、数据源完整性和入库行数，让导出报告不必打开原始 JSON 也能追溯数据准备来源。
- Stage 1 锁定的数据准备证据现在也进入 Audit / AI 证据时间线：当前审计 run 携带 `researchRun.dataSnapshot.preparationEvidence` 时，AI 评审审计面板会生成 `data-preparation-evidence` 时间线项，锚定 `preparationEvidence:<refreshRunId>`，并让证据索引可按刷新 run id 定位该证据。该项只提升审计发现性，不重新刷新数据、不创建研究 run、不触发模拟或真实交易。
- Stage 1 模拟执行记录现在也继承锁定的数据准备证据：从审计 run 创建 paper-only 执行时，核心会把 `researchRun.dataSnapshot.preparationEvidence` 写入 `PaperExecutionRecord.preparationEvidence`，SQLite 历史、POST 提交响应、GET 历史响应和前端 API 契约都会保留并校验该字段。该能力只让模拟委托本身携带可追溯行情准备来源，不解锁实盘路由、不绕过风控审批，也不会重新刷新行情。
- Stage 1 执行中心摘要现在会显示模拟执行继承的数据准备证据：已绑定 paper execution 时，摘要 tile 会展示 `preparationEvidence.runId`、入库行数、数据源和标的周期；尚未创建模拟执行或旧记录未携带该字段时显示未锁定状态。该展示只提升执行侧证据可见性，不改变委托生命周期、风控闸门或实盘阻断。
- Stage 1 研究运行导出预览现在也会显示模拟执行继承的数据准备证据：`paper-executions` 行会把绑定的 `PaperExecutionRecord.preparationEvidence.runId` 拼入 detail，并支持按这条 refresh run id 搜索定位，让导出复核时能确认模拟委托与行情准备证据没有断链。该能力只提升导出/回放可追踪性，不改变导出包 schema、委托生成、风控审批或实盘阻断。
- Stage 1 导出包浏览器现在也会显示模拟执行继承的数据准备证据：历史导出包的 `paper-executions` 行会汇总包内 `paperExecutions[].preparationEvidence.runId`，在数量校验之外展示 `prep <refreshRunId>`，并支持按该 refresh run id 搜索定位。该能力只提升导出包复核和回放发现性，不修改历史包内容、不重新生成委托，也不改变实盘阻断。
- Stage 1 导入/回放预检现在也会显示模拟执行继承的数据准备证据：Import Diff 的 `paper-executions` 行会汇总导入包内 `paperExecutions[].preparationEvidence.runId`，在恢复数量之外展示 `prep <refreshRunId>`，并支持按该 refresh run id 搜索定位。该能力只让导入前复核看见模拟委托与行情准备证据的绑定关系，不自动应用导入、不重新生成委托，也不改变实盘阻断。
- Stage 1 近期复现包索引现在也会显示模拟执行继承的数据准备证据：索引行 artifact 摘要会在研究数据准备 `prep <refreshRunId>` 之外追加 `paper prep <refreshRunId>`，并支持按模拟执行继承的 refresh run id 搜索定位导出包。该能力只提升历史包列表层的发现性，不修改导出包内容、不重新导出、不改变导入或执行闸门。
- Stage 1 审计摘要和 Markdown 审计报告现在会列出命中的模拟执行数据准备证据：当 Package Browser 或 Import Diff 的焦点查询命中 `paper-executions` 行时，`buildAuditEvidenceSummary` 会把匹配的 label/detail 写入 copy text 和报告的 Matched Evidence 表，包含 `prep <refreshRunId>`。该能力只提升审计报告可读性，不改变报告签名、导入应用、委托生成或实盘阻断。
- Stage 1 模拟执行继承的数据准备证据现在也进入 Audit / AI 证据时间线：当前审计 run 绑定的 paper execution 携带 `preparationEvidence` 时，AI 评审审计面板会生成 `paper-execution-preparation-evidence` 时间线项，锚定 `paperExecution:<executionId>:preparationEvidence:<refreshRunId>`，目标工作区指向 Execution，并让证据索引可按 refresh run id 定位 `paperExecutions[].preparationEvidence`。该项只提升模拟执行证据链的审计发现性，不重新生成委托、不改变风控审批、不解锁实盘路由。
- Stage 1 导入/回放预检现在会比较锁定的数据准备证据：Import Diff 在数据快照行之后新增 `preparation-evidence` 行，显示当前工作区与导入包的 watchlist refresh run id、数据源完整性和入库行数差异；搜索导入 run id 可以直接定位该行，避免导入包只校验 data hash/rows 而忽略数据准备来源。
- Stage 1 导出包浏览器现在也会展示锁定的数据准备证据：打开历史导出包时，Package Browser 在数据快照后显示 `preparation-evidence` 行，列出 watchlist refresh run id、数据源完整性和入库行数，并支持按刷新 run id 搜索定位。
- Stage 1 近期复现包索引现在也会展示锁定的数据准备证据：索引行的 artifact 摘要会包含 `prep <watchlistRefreshRunId>`，并复用现有索引搜索命中刷新 run id，让操作者在打开具体导出包前就能确认该包绑定了哪一次数据准备运行。
- Stage 2 Strategy Lab 现在会把核心策略校验 gates 与本地审计上下文 gate 合并：schema、risk、execution 继续信任 `/api/strategies/validate`，但 audit gate 始终使用前端已绑定的 run market/symbol/timeframe 判断，避免 core 只凭 `auditRunId` 把不匹配旧 run 显示为通过。
- Stage 2 Strategy Lab 的“审计证据”门槛现在复用同一套审计 run 上下文绑定：匹配当前市场/标的/周期的 run 才显示通过，不匹配的旧 run 会显示阻断和具体上下文差异；没有 run 但策略结构/风控已就绪时仍保持“待运行流水线”，避免阻断首次审计。
- Stage 1 研究工作区保存动作现在会显示当前 market/symbol/timeframe/入口工作区是否已经保存；切换标的、周期或入口后按钮显示“保存工作区变更/未保存”，`PUT /api/research/workspace-state` 成功后用核心返回的 `updatedAt` 快照恢复“保存工作区/已保存”。
- Stage 1 选择新标的时现在会把该标的加入本地自选并显示“自选未保存”状态；只有 `PUT /api/watchlist` 保存成功后才恢复“已保存”，避免用户误以为搜索切换后的自选顺序已经持久化。
- Stage 1 自选列表现在可以本地持久化：前端 watchlist 区域提供“保存自选”动作，调用核心 `PUT /api/watchlist` 写入 SQLite；`GET /api/workspace` 会优先恢复保存后的自选列表，再附加实盘报价，页面刷新或 Docker 重启后仍能保留用户研究标的顺序。
- Stage 1 审计 run 现在有显式上下文绑定判断：前端 summary 和后端 `ResearchRunSummary` 都携带 market/symbol/timeframe，Backtest Evidence、Readiness Gate、Benchmark 和参数扫描会拒绝把不匹配当前标的/周期的旧 run 当作当前证据。
- Stage 1 研究工作台现在会在“研究上下文就绪”中单独展示当前审计运行证据：缺失 run 会提示先运行流水线，匹配 run 显示为就绪，不匹配的旧 run 显示为阻断；该证据不参与首次运行流水线的前置闸门，避免把“还没有 run”误判为无法创建 run。
- Stage 1 研究流水线现在会消费“研究上下文就绪”清单作为运行前置闸门：有阻断项时不能运行并提示修复方向，仅剩需复核项时必须显式确认后才会生成审计运行，避免用户绕过数据、缓存或笔记上下文直接跑出低可信 run。
- Stage 1 研究上下文就绪清单现在会把带 warning 的 K 线、`demo-fallback` 和 `unknown` 来源标记为需复核，并保留刷新缓存动作，避免有数据但质量不可信时误显示为“就绪”。
- Stage 1 研究上下文就绪清单的研究笔记项现在会显示保存时间证据：已保存笔记显示保存时间，已编辑草稿显示“自上次保存后有未保存更改”，新草稿显示“草稿未保存”，让策略工坊前置上下文更容易被复核。
- Stage 1 研究上下文就绪清单现在能区分“已保存笔记”“新草稿未保存”和“已保存后又编辑未保存”：策略工坊前置上下文不会再把仅存在于编辑框里的草稿误判为已落库证据。
- Stage 1 研究上下文就绪清单已从静态状态升级为可操作清单：K 线或本地缓存未就绪时可以直接刷新当前标的/周期缓存，研究笔记未保存时可以直接保存当前草稿，减少用户在研究工作台内来回寻找入口。
- Stage 1 本地缓存就绪行现在会直接说明当前缓存是否足以进入审计研究：fresh 显示“可运行审计研究”和最新缓存时间；stale、empty 或缺失缓存会提示从搜索建议刷新或当前缓存刷新后再继续，保持用户从标的搜索、缓存准备到研究流水线的同一条 Stage 1 路径。
- Stage 1 黄金路径现在会把行情缓存状态和自选刷新证据翻译成同样的任务语言：fresh 行情缓存加匹配可信刷新证据会通过 market-data 步骤并说明可支撑审计研究；fresh 缓存但缺少匹配刷新证据会进入 review，提示先刷新自选缓存；stale、empty 或缺失缓存会让当前任务卡、顶部 runbook 和 Audit runbook 都提示先刷新行情数据后再运行审计研究。
- Stage 1 研究工作台新增“研究上下文就绪”清单，把当前标的/周期、K 线数据质量、本地缓存状态和研究笔记绑定成四项前置检查；策略工坊继续只能消费明确的研究上下文，而不是隐式读取页面上的零散状态。
- 将研究笔记纳入导出包和 AI 评审证据边界。
- 导入研究运行包时恢复包内研究笔记到本地笔记库，并在前端导入完成后同步刷新 Research 工作区草稿，补齐跨机器研究上下文延续能力。
- 建立审计 Backtest Report 页面，把指标、交易流水、权益曲线、诊断、证据包、AI 评审准备状态和执行交接状态绑定到同一个 run。
- Backtest Report 使用同一个审计数据快照计算买入持有基准和 alpha，避免 AI 评审只看绝对收益。
- AI 评审 dossier 和结构化动作日志已经引用该基准 Alpha，解释回测时必须同时给出策略收益、买入持有收益和 Alpha。
- 研究流水线前端客户端已经具备 run detail 补全逻辑，避免旧版或轻量 summary 响应让审计快照在页面链路中丢失。
- Backtest Report 可以生成 Markdown 审计报告，覆盖 run id、策略版本、指标、基准 Alpha、数据快照、参数扫描、同上下文运行对比、AI 证据边界、闸门和交易回放；前端导出 Markdown 时会把同一份报告以 `eventType=backtest_report` 写入后端通用审计账本，metadata 保留文件名、内容 SHA-256、市场/标的/周期、策略 revision、数据行数、执行模式和比较矩阵行数。研究运行 JSON 复现包现在也会附加同源 `aiqt.backtestReport` artifact，包浏览器显示 `backtest-report` 检查行，导入预检显示 `audit-report` 与 `backtest-report` 影响行并在报告上下文或 hash 与 manifest 不一致时阻断，本地核心导入时把它们作为 UI/审计报告元数据排除在核心 integrity hash 之外。Audit 报告历史现在会用同一条后端分页流回读 `audit_evidence_report,backtest_report,portfolio_report`，把 Backtest 和 Portfolio 报告显示为可搜索、可归档、可签名、可验签和可撤销的报告行；签名消息会包含 artifact kind，避免审计证据报告、回测报告和组合报告互相复用签名。

## 11. 下一阶段非目标

- 真实资金执行。
- 多用户账号和权限。
- 云端部署。
- SaaS 计费。
- 高频交易。
- 移动端 UI。
- 完全通用的代码策略运行环境。

- Audit 深链加载状态已经在复现包浏览器内可见：打开带 `runId/exportPath` 的审计 URL 时，会显示审计深链状态卡，区分等待加载、加载中、已加载和加载失败，展示 run id 与聚焦查询；失败时可在原位置重试，避免无效锚点只出现在全局状态栏。复现包浏览器还会生成可复制的审计证据摘要，把导入审计流水查询、复现包焦点、导入 diff 焦点、深链状态、包检查计数、diff 阻断/变更计数、导入策略阻断计数/证据桶和 confirmed 导入报告的 local-core 验签计数/证据桶合并成一段文本，方便外部报告截图或粘贴。用户下载研究运行 JSON 复现包时，前端会把这段摘要作为可选顶层 `auditEvidenceSummary` artifact 附加到包内，`auditEvidenceSummary.importPolicyBlockers` 会保存导入验签、报告签名、复现包完整性、实盘边界等阻断策略证据桶，`auditEvidenceSummary.importVerification` 会保存 verified/invalid 计数和最新 exportPath/reason/source/status 证据桶；旧包缺少这些字段仍可导入；本地核心导入时会忽略这类 UI 审计焦点元数据、继续校验核心研究包 integrity，让另一台机器既能看到当时的审计焦点，又不会把 UI 过滤条件混入核心数据哈希。导入预检已经把包内 `auditEvidenceSummary` 展示为 `audit-summary` 对照行，显示摘要 run id、focus query、包检查命中数和导入 diff 阻断数，若摘要 run id 与 manifest 不一致则标记为 blocked。Audit 复现包浏览器现在可以基于同一摘要复制或下载 Markdown 审计报告，并在研究运行 JSON 复现包中附加可选顶层 `auditReport` artifact；该 artifact 包含生成时间、run id、深链状态、证据焦点、包检查/import diff 计数表、Import Policy Blockers 表、Import Report Verification 表、AI 边界说明、Markdown 内容和内容 SHA-256，包浏览器会显示 `audit-report` 检查行，本地核心导入时也会把它作为 UI 审计元数据排除在核心 integrity hash 之外。前端在导出 JSON 复现包或下载 Markdown 报告时，会把同一份 `auditReport` 以 `eventType=audit_evidence_report` 写入后端通用审计事件账本，metadata 保留文件名、SHA-256、焦点查询、包检查计数、导入 diff 阻断数和深链状态。Audit 工作区现在会回读 `audit_evidence_report` 事件，展示报告 SHA-256、短 hash、证据焦点、包检查/import diff 摘要、后端分页和当前签名状态；用户可按 run、hash、文件名、焦点和签名状态检索当前页报告历史。报告历史已经能解析可选 `metadata.signature`，把 `signed`、`verified`、`revoked`、`invalid` 和 `unsigned` 映射为可读状态，并显示 signer、key id、algorithm、chain id、签名/验签时间或撤销原因。本地核心现在提供 `POST /api/audit/reports/sign`、`/api/audit/reports/verify`、`/api/audit/reports/revoke`、`GET /api/audit/signing-keys` 和 `POST /api/audit/signing-keys/rotation-plan`，用本地 `hmac-sha256` key 对报告事件和内容 hash 签名、验签或撤销，并把 verified/invalid/revoked 状态写回同一账本事件；签名 key 注册表支持 active key 与 retired/revoked legacy key，让历史报告可继续验签，API 与 UI 只展示 key id、chain id、状态、指纹和可签/可验能力，不暴露 secret；Audit 页面可在报告历史行上直接签名、验签或撤销，在签名 Key 注册表面板看到本地开发 key 是否需要轮换，并生成不含 raw secret 的轮换清单、legacy 注册表模板和历史报告验签步骤；生成计划后还会把 `audit_signing_key_rotation_plan` 摘要写入通用审计账本，metadata 只保留 key 指纹、变量名、步骤、阻断原因和 legacy 模板 SHA-256，面板显示入账状态。下一步需要补 secret store 写入/应用式轮换、外部签章/证书链和更细的签名审计策略。
- Audit 报告历史现在进一步使用后端多类型查询 `eventType=audit_evidence_report,backtest_report,portfolio_report`，同页回读审计证据报告、Backtest Markdown 报告和 Portfolio Markdown 报告；Backtest 报告行展示回测上下文、数据行数和同上下文比较矩阵数量，Portfolio 报告行展示组合上下文、腿数量和权益点数量，支持按代码、组合名、策略 revision、hash 和签名状态搜索；未签名时为 `unsigned`，签名/验签/撤销动作与 `audit_evidence_report` 共享同一套本地签名 API。下载研究运行 JSON 包时，Backtest 报告内容、SHA-256、市场/标的/周期、策略 revision、执行模式和比较矩阵行数会作为 `backtestReport` 一并进入包内，方便离线审计材料不再依赖另存的 `.md` 文件；Portfolio 报告仍留在通用审计账本和 Markdown 文件中，不进入单 run 复现包。
- Audit 证据报告入账时会把摘要里的导入报告 local-core 验签结果压缩进 `audit_evidence_report.metadata`，包含 verified/invalid 计数和最新 status/source/exportPath/reason；报告历史顶部会汇总所有报告的导入验签通过/失败计数，报告历史行也会显示紧凑的“导入验签 verified/invalid”计数，并把 `local-core`、验签 reason 和 exportPath 纳入搜索索引，让下载后的审计报告、导入确认事件和报告历史不再割裂。若 `importVerificationInvalid > 0`，后端签名 API 会用 `audit_report_import_verification_invalid` 阻断签名，前端报告历史同步禁用“签名”按钮并提示先更正证据，避免把失败导入证据盖章成可信审计报告。
- Audit 签名 Key 注册表面板现在会回读最近 5 条 `audit_signing_key_rotation_plan`、最近 5 条 `audit_signing_key_rotation_apply` 和最近 5 条 `audit_signing_key_controlled_restart_evidence` 账本事件，把轮换计划 prepared/blocked、应用预检 blocked/ready_for_restart、受控重启证据 blocked/evidence_recorded、拟启用 key、legacy 模板短 hash、apply/evidence 模式、阻断原因、环境变量数量、人工步骤数量和确认项数量显示为同一个紧凑历史视图；生成计划、提交应用预检或后端写入受控重启证据后会在历史列表回读，形成“生成计划 -> 应用预检 -> 受控重启证据 -> 可追溯查看”的闭环。
- Audit 签名 Key 注册表面板继续补了“应用预检”和“受控重启证据”阶段：用户必须显式确认新 secret 已在本地安全保存、当前 secret 已写入 legacy 注册表、操作员已复核 key/指纹/重启影响，前端才会调用 `/api/audit/signing-keys/rotation-apply`。后端只做只读安全预检，缺确认时返回 blocked，确认齐全时返回 ready_for_restart；结果会被压缩成 `audit_signing_key_rotation_apply` 事件写入审计账本。随后前端会保存 ready apply 事件 id，并在同一面板显示受控重启窗口执行、回滚计划确认、重启后验收通过和操作员复核重启日志四项确认，调用 `/api/audit/signing-keys/rotation-restart-evidence` 写入 `audit_signing_key_controlled_restart_evidence` 审计事件；缺项返回 blocked，完整确认返回 evidence_recorded。payload、UI 状态和账本 metadata 仍不传输 raw secret，会递归脱敏 secret/token/apiKey/privateKey/password 字段，并继续固定 `liveTradingAllowed=false` 与 paper-only 边界。Audit UI 历史视图可以回读这些受控重启证据行，并按 operator、confirmation id、拟启用 key、模式和阻断原因搜索。
- Audit 签名 Key 的本地 secret-store 物化清单账本已经落地为后端与前端 API 契约：`POST /api/audit/signing-keys/secret-materializations` 必须引用已写入账本的 `audit_signing_key_rotation_plan`，记录本地 secret-store 写入已核验、payload 不含 raw secret、环境绑定计划已记录和回滚计划已记录四项确认；缺项返回 blocked，完整确认返回 `manifest_recorded` 并写入 `eventType=audit_signing_key_secret_materialization` 审计事件。`GET /api/audit/signing-keys/secret-materializations` 可按拟启用 key 回读最近清单，前端 `recordAuditSigningKeySecretMaterialization` / `loadAuditSigningKeySecretMaterializations` 已具备 typed client 和脱敏响应校验。该契约仍只保存 manifest path、backend、环境变量名、secret 占位变量名、确认项和脱敏 metadata，不接收或返回真实签名密钥、不写环境变量、不重启服务，也不会把 `liveTradingAllowed` 置为 true。
- Audit 签名 Key 注册表面板已经接入本地 secret-store 物化清单动作：生成轮换计划并成功入账后，面板会保留 `audit_signing_key_rotation_plan` event id，展示“本地 secret-store 写入已核验、payload 不含 raw secret、环境绑定计划已记录、回滚计划已记录”四项确认，调用 `recordAuditSigningKeySecretMaterialization` 记录清单。返回的 `audit_signing_key_secret_materialization` 事件会立即合并进轮换历史，`buildAuditSigningKeyRotationLedgerRows` 也已支持 materialization 事件 kind、`manifest_recorded` 状态、确认数量、operator 搜索和 paper-only/live-blocked 标记；Audit 页面刷新时还会通过 `loadAuditSigningKeySecretMaterializations` 恢复最近的物化结果卡。
- Audit 签名 Key 的受控环境绑定账本已经落地为后端、前端 API 与 Audit UI 闭环：`POST /api/audit/signing-keys/environment-bindings` 必须引用已写入账本的 `audit_signing_key_secret_materialization`，记录运行环境映射已核验、配置重载计划已记录、payload 不含 raw secret、回滚快照已记录四项确认；缺项返回 blocked，完整确认返回 `binding_recorded` 并写入 `eventType=audit_signing_key_environment_binding` 审计事件。`GET /api/audit/signing-keys/environment-bindings` 可按拟启用 key 回读最近绑定证据，前端 `recordAuditSigningKeyEnvironmentBinding` / `loadAuditSigningKeyEnvironmentBindings` 已具备 typed client 和脱敏响应校验。Audit 签名 Key 注册表面板现在会在 Secret-store 物化清单后展示“环境绑定证据”区块，保留四项显式确认、记录按钮和绑定结果卡；刷新 Audit 工作区时会同时回读 `audit_signing_key_environment_binding` 审计事件与 typed history，`buildAuditSigningKeyRotationLedgerRows` 也已支持 `environment_binding` 事件 kind、`binding_recorded` 状态、env 变量数量、确认数量、operator/confirmation id 搜索和 paper-only/live-blocked 标记。该契约仍只保存 materialization id、manifest path、backend、环境变量名、确认项和脱敏 metadata，不写环境变量、不重启容器、不启用新签名 Key，也不会把 `liveTradingAllowed` 置为 true；下一步推进受控重载编排。
- Audit 签名 Key 环境绑定后的受控运行时重载计划台账已经落地为后端、前端 API 与 Audit UI 闭环：`POST /api/audit/signing-keys/runtime-reload-plans` 必须引用已写入账本且状态为 `binding_recorded` 的 `audit_signing_key_environment_binding`，记录维护窗口已批准、重载前健康基线已捕获、配置 diff 已复核、重载后 smoke 计划已记录和回滚负责人已指定五项确认；缺项返回 blocked，完整确认返回 `plan_recorded` 并写入 `eventType=audit_signing_key_runtime_reload_plan` 审计事件。`GET /api/audit/signing-keys/runtime-reload-plans` 可按拟启用 key 回读最近计划，前端 `recordAuditSigningKeyRuntimeReloadPlan` / `loadAuditSigningKeyRuntimeReloadPlans` 已具备 typed client 和脱敏响应校验。Audit 签名 Key 注册表面板现在会在环境绑定后展示“运行时重载计划”区块，保留五项显式确认、记录按钮和计划结果卡；刷新 Audit 工作区时会同时回读 `audit_signing_key_runtime_reload_plan` 审计事件与 typed history，`buildAuditSigningKeyRotationLedgerRows` 也已支持 `runtime_reload_plan` 事件 kind、`plan_recorded` 状态、reload 标签、env 变量数量、确认数量、operator/confirmation id 搜索和 paper-only/live-blocked 标记。该契约仍只记录受控重载编排证据，不接收或返回真实签名密钥、不写环境变量、不重启容器、不启用新签名 Key，也不会把 `liveTradingAllowed` 置为 true；下一步推进受控重载执行证据或签名 Key 轮换最终验收闸门。
- Audit 签名 Key 运行时重载计划后的受控执行证据台账已经落地为后端、前端 API 与 Audit UI 闭环：`POST /api/audit/signing-keys/runtime-reload-executions` 必须引用已写入账本且状态为 `plan_recorded` 的 `audit_signing_key_runtime_reload_plan`，记录重载前健康复核、重载动作记录、重载后 smoke 通过、回滚就绪确认和操作员确认实盘仍阻断五项证据；缺项返回 blocked，完整确认返回 `execution_recorded` 并写入 `eventType=audit_signing_key_runtime_reload_execution` 审计事件。`GET /api/audit/signing-keys/runtime-reload-executions` 可按拟启用 key 回读最近执行证据，前端 `recordAuditSigningKeyRuntimeReloadExecution` / `loadAuditSigningKeyRuntimeReloadExecutions` 已具备 URL builder、typed client 和脱敏响应校验。Audit 签名 Key 注册表面板现在会在“运行时重载计划”后展示“运行时重载执行证据”区块，保留五项显式确认、记录按钮和执行结果卡；刷新 Audit 工作区时会同时回读 `audit_signing_key_runtime_reload_execution` 审计事件与 typed history，`buildAuditSigningKeyRotationLedgerRows` 也已支持 `runtime_reload_execution` 事件 kind、`execution_recorded` 状态、execution/reload 模式、确认数量、operator/confirmation id 搜索和 paper-only/live-blocked 标记。该契约只证明操作者记录了受控重载执行证据，不接收或返回真实签名密钥、不写环境变量、不重启容器、不启用新签名 Key、不连接实盘执行，也不会把 `liveTradingAllowed` 置为 true；下一步推进签名 Key 轮换最终验收闸门。
- Audit 签名 Key 的最终轮换验收闸门已经落地为后端、前端 typed API、历史账本模型与 Audit UI 闭环：`POST /api/audit/signing-keys/rotation-acceptances` 必须引用已写入账本且状态为 `execution_recorded` 的 `audit_signing_key_runtime_reload_execution`，记录执行证据已复核、签名探针已验证、legacy 报告验签已确认、回滚窗口仍开放和操作员确认新 key 激活仍阻断五项确认；缺项返回 blocked，完整确认返回 `acceptance_recorded` 并写入 `eventType=audit_signing_key_rotation_acceptance` 审计事件。`GET /api/audit/signing-keys/rotation-acceptances` 可按拟启用 key 回读最近验收证据，前端 `recordAuditSigningKeyRotationAcceptance` / `loadAuditSigningKeyRotationAcceptances` 已具备 URL builder、typed client 和脱敏响应校验；`buildAuditSigningKeyRotationLedgerRows` 也已支持 `rotation_acceptance` 事件 kind、`acceptance_recorded` 状态、acceptance/execution/reload 模式、确认数量、operator/confirmation id 搜索和 paper-only/live-blocked 标记。Audit 签名 Key 注册表面板现在会在“运行时重载执行证据”后展示“最终验收闸门”，保留五项显式确认、记录按钮和验收结果卡；刷新 Audit 工作区时会同时回读 `audit_signing_key_rotation_acceptance` 审计事件与 typed history。`buildAuditSigningKeyRotationChainSummary` 还会从完整轮换账本派生“轮换计划 -> Secret 物化清单 -> 环境绑定 -> 运行时重载计划 -> 重载执行证据 -> 最终验收闸门”的收口摘要，Audit 面板在历史列表上方显示 6/6 完成度、下一缺口或阻断阶段，并继续标明 live remains blocked / paper-only。该契约仍只记录最终人工验收证据，不启用新签名 Key、不写环境变量、不重启容器、不连接实盘执行，也不会把 `liveTradingAllowed` 置为 true；下一步进入 P0 可用性缺口收敛。
- P0 当前任务卡现在会在可用性摘要下方显示“最近证据”结果条：优先展示最新 paper-only 模拟执行 id、委托数量和闸门通过数；如果尚未提交模拟委托，则展示 Golden Path 的 latestRunId 和当前状态；没有证据时提示先运行审计研究流水线。该结果条不再只是工作区跳转：点击“查看证据”会把 paper-only 模拟执行定位到 Execution 工作区，把审计 run 证据写入 Audit 的导出/导入查询并从本地历史或 `/api/research/runs/{runId}` 复盘对应 run；找不到 run 时会留在 Audit 并显示错误。P0 最近证据现在还提供“复制链接”：审计证据会生成 `workspace=audit&runId=...&exportPath=manifest:...` 深链，模拟执行证据会生成 `workspace=execution&paperExecution=...&runId=...` 深链，便于在同一部署或另一会话中重新打开证据；模拟执行深链加载时会恢复审计 run、最新 paper execution、Promotion 状态和 AI 评审历史，并切到 Execution/Paper 焦点，执行 id 不匹配或缺失时只显示可见错误。该入口只用于把用户刚完成的动作和 Audit/Execution 证据连接起来，不写后端状态、不创建订单、不改变 Golden Path 语义，也不放开实盘交易。
- P0 当前任务卡和可用性报告现在会显示模拟执行继承的数据准备证据：当最新 paper-only execution 携带 `preparationEvidence` 时，最近证据 detail 和 `buildP0PlatformReadinessReportMarkdown` 的 Latest Evidence 会追加 `prep <refreshRunId>`、入库行数和数据源，让首页/报告层也能直接判断模拟委托是否绑定了可信行情准备来源。该展示只读取已入账模拟执行字段，不重新刷新行情、不重新生成委托、不改变风控或实盘边界。
- P0 可用性报告入账和审计历史现在也保留模拟执行数据准备证据：`buildP0PlatformActionOutcome` 会把 paper execution 的 `preparationEvidence.runId` 暴露为结构化 `preparationEvidenceRunId`，`p0_readiness_report.metadata.latestEvidencePreparationRunId` 会随报告入账，Audit 报告历史行会读出 `p0PreparationEvidenceRunId` 并纳入搜索文本。这样操作者可以直接按 refresh run id 找到对应 P0 可用性报告，而不必打开 Markdown 或 JSON 包逐层追踪；该能力仍只增强审计发现性，不改变报告签名资格、模拟委托状态或实盘阻断。
- P0 最新可用性报告摘要现在也上浮模拟执行数据准备证据：`buildAuditEvidenceReportLedgerSummary` 会从最新 `p0_readiness_report` 行读取 `p0PreparationEvidenceRunId`，写入 `latestAuditAidPreparationEvidenceRunId`，并把该 refresh run id 追加进 `latestAuditAidReportQuery`。首页“最近 P0 可用性报告”跳转或 Audit 摘要定位时可以携带同一条数据准备证据，不再只靠 run id、短 hash 和文件名定位；该能力只改变摘要和查询文本，不新增报告、订单或实盘权限。
- P0 最新可用性报告的数据准备证据现在已经在页面摘要层可见且可定位：`buildAuditEvidenceReportLedgerSummary` 会额外产出 `latestAuditAidPreparationEvidenceLabel`，首页“最近入账报告”卡片和 Audit 报告历史摘要会直接显示 `prep <refreshRunId>`；首页回显卡和 Audit 摘要里的数据准备 chip 都提供“定位数据准备 / Focus prep”动作，把 Audit 报告历史查询切换到同一条 refresh run id。该展示和定位只读取已入账 P0 报告 metadata，不重新生成报告、不重新提交模拟委托、不改变签名链或实盘阻断。
- P0 可用性报告行现在也会显示并定位模拟执行数据准备证据：Audit 报告历史的每条 `p0_readiness_report` 行在读取到 `p0PreparationEvidenceRunId` 时，会在证据区追加 `数据准备 · prep <refreshRunId>` chip，并在行内动作区提供“定位数据准备 / Focus prep”，把报告历史查询切换到同一条 refresh run id；这样从搜索结果进入单条报告时，不需要再回看顶部摘要或打开 Markdown/JSON 才能确认并追踪该报告绑定的数据准备来源。该展示和定位只增强报告行复核可读性，不修改报告内容、签名资格、报告生成、委托状态或实盘阻断。
- P0 数据准备证据定位现在支持可复制、可恢复的 Audit 查询深链：Audit 报告历史支持从 `auditReportQuery` URL 参数初始化搜索框，首页“最近入账报告”、Audit 摘要层和每条 `p0_readiness_report` 行的数据准备动作区都会提供“复制数据准备链接 / Copy prep link”，生成 `workspace=audit&auditReportQuery=<refreshRunId>` 的干净链接。这样操作者可以把某次模拟执行绑定的数据准备 refresh run id 发给另一会话或稍后复查，打开后直接落在 Audit 工作区并过滤到同一条证据；该能力只恢复查询上下文，不重新拉取行情、不重新生成报告、不改变签名资格、模拟委托状态或实盘阻断。
- P0 Audit 报告历史查询现在会同步到地址栏：手动搜索、首页“在审计中查看”、首页/Audit 的“定位数据准备”和 Audit 的“定位最新”都会通过 `replaceState` 更新 `workspace=audit&auditReportQuery=<query>`，清空搜索时移除 `auditReportQuery`。这样操作者不必额外复制链接也能刷新页面或保存当前复核上下文；该能力只同步浏览器 URL，不新建审计事件、不改变分页数据、不重新生成报告、不触发模拟或真实委托。
- P0 Audit 报告历史现在也支持复制当前搜索深链：当搜索框存在非空 query 时，工具栏会启用“复制当前查询 / Copy query link”，复用同一条 `workspace=audit&auditReportQuery=<query>` 规则。这样操作者按 run id、hash、签名状态、导入验签或数据准备 id 手动过滤后，可以不依赖数据准备 chip，也能直接复制当前复核视图；该能力只复制 URL，不读取剪贴板内容、不写后端账本、不改变报告签名或执行状态。
- P0 Audit 报告历史当前搜索现在可以显式清空：当搜索框存在非空 query 时，工具栏会启用“清空查询 / Clear query”，调用同一条搜索状态更新路径并移除地址栏里的 `auditReportQuery`。这样操作者从深链或手动过滤进入复核视图后，不需要手工删除输入框内容就能回到完整报告历史；该能力只重置前端查询上下文，不重新拉取额外数据、不写后端账本、不改变签名链、模拟执行或实盘阻断。
- P0 当前任务卡现在还会显示“模拟执行预检”：`buildP0PaperExecutionPreflight` 会从 Golden Path 最新 run、当前研究 run 绑定、风控审批摘要和已入账 paper execution 派生四段 gate：审计运行、风控审批、模拟执行和实盘边界。当 Golden Path 已有 latestRunId 但当前工作区尚未绑定 run 时，预检显示“加载最新审计运行”；当风险已通过但尚无 paper execution 时，显示“提交模拟委托”；当 paper execution 已入账时，显示执行 id、委托数量和执行闸门通过数。预检主动作按钮现在会复用现有 Golden Path action：可重新绑定最新审计 run 或提交模拟委托的状态走 `submit-paper-order`，仅需复核的状态则打开 Execution 工作区。P0 可用性 Markdown 报告顶部的 `Current gap` 行也会直接带出当前缺口的 action label 和目标 workspace，让报告第一屏就能告诉操作者下一步去哪里、做什么，而不是只在 Open P0 Gaps 明细里展示。该能力只解释和触发当前 P0 paper-execution 阻断的既有动作，不新增后端状态、不自动绕过风险审批，也不改变 live-blocked 边界。
- P0 当前任务卡现在还能生成可移植的 P0 可用性 Markdown 报告：`buildP0PlatformReadinessReportMarkdown` 会把 Golden Path 完成度、当前缺口、当前缺口恢复链接、开放 P0 缺口队列、最近审计或 paper-only 执行证据、证据深链、模拟执行预检四段 gate 和 paper-only/live-blocked 边界整理为一份可复制、下载或入账的文本报告。当前缺口恢复链接使用 `workspace=<目标工作区>&auditReportQuery=p0_readiness_report <run/evidence> <actionId> <workspace>&p0Action=<actionId>`，使报告文本离开当前浏览器后仍能把操作者带回同一 P0 下一步上下文。首页提供“复制报告”“下载报告”和“入账报告”动作；入账时前端会用同一份 Markdown 计算 SHA-256，生成 `eventType=p0_readiness_report` 审计事件，metadata 只保留 artifact kind、文件名、内容 hash、P0 完成度、当前缺口、当前缺口下一步 action id/label、目标 workspace、结构化 `currentGapDeepLinkSearch`、最近证据、backlog 数量、模拟执行预检状态、主动作、gate 计数和 live-boundary 值，不保存报告全文。Audit 报告历史现在会同页回读 `audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report`，P0 报告行支持按状态、缺口 step、当前缺口 action、目标 workspace、当前缺口恢复链接、最近 evidence id、原始/解码 evidence link 和 hash 搜索；带有最近证据深链的 P0 报告行会显示可读证据目标、解码后的锚点 tooltip、“打开证据”和“复制证据链接”，审计 run 链接复用 Audit 包证据加载器，paper execution 链接复用模拟执行深链加载器。即使旧报告事件缺少结构化 `currentGapDeepLinkSearch`，P0 报告行也会从 run、hash、文件名、准备证据、action 和目标 workspace 派生同规则的 fallback 恢复链接，并支持 `p0Action=...` 搜索。报告历史摘要会单独显示需签名报告数量、P0 审计辅助材料数量和最新辅助材料指向的 run，并把解码后的证据锚点作为摘要 hover 上下文；当最新辅助材料带当前缺口恢复链接时，摘要层的下一步链接优先复用该结构化 metadata，避免复制出来的恢复链接和报告正文不一致。P0 报告行仍保留自身 unsigned/hash 证据，但不会增加待签名或签名链状态计数。P0 报告仍显示为“审计辅助材料”：不进入签名链、不允许签名/验签/撤销、不创建委托、不改变执行状态，也不授权实盘交易。
- P0 当前任务卡现在会把最近一次已入账且 hash 有效的 P0 可用性报告回显到首页：复用 Audit 报告账本摘要中的最新 ready `p0_readiness_report`，展示 run id、短 hash、模拟执行预检状态、当前缺口下一步 action 和目标 workspace，并提供“在审计中查看 / Open in Audit”“去处理下一步 / Open next step”“复制下一步链接 / Copy next link”动作；“在审计中查看”会把 Audit 报告历史查询切换到该报告的确定性定位查询，“去处理下一步”会先把地址栏同步成同一条 `workspace=<目标工作区>&auditReportQuery=<P0报告定位query>&p0Action=<actionId>` 恢复链接，再跳转到目标工作区，方便刷新后仍保留下一步处理上下文；该动作不自动运行流水线、AI 评审或模拟委托。“复制下一步链接”复用同一套规范化恢复链接。前端启动时会解析该链接中的 `p0Action`、目标 workspace 和 Audit query，恢复目标工作区/审计搜索，并在状态栏显示已加载的 P0 next-step link；首页 P0 卡片也会显示“已载入下一步链接 / Recovered next-step link”提示，提供“打开审计定位 / Open Audit query”和“执行下一步 / Run next step”两个手动动作，让跨会话打开链接后可继续处理同一缺口，但仍需要用户显式点击才会运行现有 action；深链状态和报告描述符会同时保留原始 `actionId` 与归一化后的 `executableActionId`，因此旧报告中保存的 `run-ai-committee` 仍可按原文搜索和复制，但执行时会归一到现有 `run-ai-review`，触发 TradingAgents 风格的 AI 评审，而不是只停留在 AI 工作区跳转。非法 workspace、空 query、可疑 action id 或未知 action id 会被忽略；未知动作的旧报告只保留审计定位，不生成可点击执行入口。Audit 报告历史摘要和 P0 报告行也会显示当前缺口下一步；摘要层和单条 P0 报告行现在都复用同一个 current-gap action descriptor 来“打开下一步 / Open next step”“定位下一步 / Focus next”和“复制下一步链接 / Copy next link”，优先采用报告 metadata 里记录的恢复链接，旧报告缺字段时再派生 fallback；当旧报告缺少单独的目标 workspace 字段但保留了规范化 `currentGapDeepLinkSearch` 时，描述符会从链接里的 `workspace` 恢复目标工作区，保证报告摘要和行级“打开下一步”仍能跳到正确工作区；缺少明确 action id、未知 action id 或 hash 无效的旧报告只保留审计定位，不生成可执行 next-step descriptor，避免把不可执行或无效证据链接误展示成下一步动作。行级“打开下一步”只切换目标工作区并同步恢复 URL，不自动运行现有 action。该回显只读取现有账本事件，不写新状态、不改变报告签名资格、不创建委托，也不放开实盘交易。

- P0 current-gap action 现在还会生成结构化 readiness 状态，区分 `ready`、`missing-action`、`missing-workspace`、`unknown-action` 和 `not-ready-report`，Audit 摘要与报告行会用可执行/不可执行 chip 显示原因，按钮仍只在可执行时出现。该状态只解释既有报告和深链，不自动运行下一步、不写后端账本、不改变签名链、模拟委托或实盘阻断。
- P0 可用性 Markdown 报告的 `Current gap` 行和 `Open P0 Gaps` 列表现在都会写入 current-gap action readiness：可执行动作显示 `Executable: yes (<normalized action id>)`，未知或缺失动作显示 `Executable: no (<reason>)`。这样复制、下载或入账后的报告脱离页面 chip 后，仍能逐项解释每个 P0 缺口的下一步是否可执行；该字段只增强审计复核，不生成深链、不自动执行动作、不改变模拟或实盘状态。
- P0 可用性 Markdown 报告顶部现在还会写入 `Backlog readiness` 聚合摘要：`buildP0PlatformReadinessReportMarkdown` 会从本次报告的 `backlogItems` 计算 `<可执行>/<总数> executable`、不可执行数量，以及首条 backlog 的归一化 action/reason，例如 `Backlog readiness: 2/2 executable, 0 not executable. First: run-pipeline ready.`。这样复制、下载或入账后的文本报告在不展开 `Open P0 Gaps` 明细时，也能一眼判断当前 P0 队列是否可直接推进；该摘要只解释报告内已有 backlog，不重新拉取 Golden Path、不生成查询深链、不自动执行 action、不改变模拟或实盘边界。
- P0 current-gap action readiness 现在也进入 `p0_readiness_report` 入账 metadata 和 Audit 报告账本搜索：入账事件会保存 `currentGapCanExecute`、`currentGapExecutableActionId` 和 `currentGapReadinessReason`，账本行会回读为 `p0CurrentGapCanExecute`、`p0CurrentGapExecutableActionId` 和 `p0CurrentGapReadinessReason`，旧报告缺字段时按 action/workspace 推导 fallback。Audit 搜索可以直接用 `executable`、`not-executable`、`ready`、`unknown-action` 或归一化 action id 定位报告；该能力只增强可发现性，不改变报告签名、委托或实盘边界。
- P0 current-gap action readiness 现在也进入最新 P0 审计辅助摘要：`buildAuditEvidenceReportLedgerSummary` 会暴露 `latestAuditAidCurrentGapCanExecute`、`latestAuditAidCurrentGapExecutableActionId` 和 `latestAuditAidCurrentGapReadinessReason`，`buildLatestAuditAidCurrentGapActionReadiness` 会优先使用这组入账字段，再回退到 action/workspace 推导。这样首页和 Audit 摘要不会把报告 metadata 明确标记的不可执行下一步重新推断成可执行动作；该能力只收口前端摘要模型，不自动运行下一步、不写新账本、不改变签名链、模拟委托或实盘阻断。
- P0 current-gap action readiness 的 legacy 恢复顺序已经修正：Audit 报告账本行现在会先解析或派生 `currentGapDeepLinkSearch`，再从其中的 `workspace` 恢复目标工作区并计算 `currentGapCanExecute/currentGapReadinessReason`，只有报告 metadata 显式记录了 readiness 字段时才覆盖推导值。这样旧报告缺少 `currentGapWorkspaceId/currentGapTargetWorkspaceId` 但保留恢复链接时，行级和摘要层 next-step descriptor 仍能跳回正确工作区；完全缺少 workspace 的旧报告仍按 fallback `audit` 形成可复核链接。该修复只恢复前端审计导航，不自动执行下一步、不写新账本、不改变模拟委托或实盘阻断。
- P0 current-gap action readiness 现在也能被稳定定位和复制：新增 `latestAuditAidCurrentGapReadinessQuery` 和行级 `buildAuditEvidenceReportLedgerRowCurrentGapReadinessQuery`，查询会包含最新 P0 报告定位字段、`current-gap`、`current-gap-executable/current-gap-not-executable`、归一化 action id、readiness reason 和目标 workspace。首页最近入账报告和 Audit 报告历史摘要在下一步不可执行时也会显示“定位当前缺口 / 复制当前缺口链接”，让操作者能直接过滤到“为什么不可执行”的报告证据；该能力只恢复 Audit 查询上下文，不运行下一步、不新建审计事件、不改变签名链、模拟委托或实盘阻断。
- P0 报告历史的单条报告行现在也能复核自己的 current-gap readiness：新增 `buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle`，行内 current-gap chip 的 hover 说明会展示可执行状态、归一化 action、原因和目标 workspace；当该行没有可执行 next-step descriptor 时，行级动作区会显示“定位当前缺口 / 复制当前缺口链接”，直接使用该报告自己的 current-gap readiness query。这样查看旧报告、搜索结果或非最新报告时，不必回到顶部“最新辅助”摘要才能定位不可执行原因；该能力只过滤 Audit 历史，不运行下一步、不写新账本、不改变签名链、模拟委托或实盘边界。
- P0 最新可用性报告摘要里的 current-gap readiness 说明现在也同源化：`AuditEvidenceReportLedgerSummary` 会暴露 `latestAuditAidCurrentGapReadinessTitle`，首页最近入账报告和 Audit 摘要里的 current-gap chip 会优先使用这条 title，而不是各自只显示 action id 或 reason。这样最新摘要、单条报告行和复制出来的查询都复用同一份 readiness 解释；该能力只收口前端模型和 tooltip，不新增执行入口、不写账本、不改变签名链、模拟委托或实盘边界。
- P0 `Open P0 Gaps` 队列的 readiness 汇总也进入 `p0_readiness_report` metadata、事件 detail 和 Audit 搜索：入账事件会保存 `backlogExecutableCount`、`backlogNotExecutableCount`、`backlogReadinessSummary`、`firstBacklogCanExecute`、`firstBacklogExecutableActionId` 和 `firstBacklogReadinessReason`，并在事件 `detail` 里追加 `backlog <summary>` 短摘要；账本行回读为 `p0BacklogExecutableCount`、`p0BacklogNotExecutableCount`、`p0FirstBacklogCanExecute`、`p0FirstBacklogExecutableActionId` 和 `p0FirstBacklogReadinessReason`。Audit 搜索支持 `backlog executable <count>`、`not-executable <count>` 和第一条 backlog 的归一化 action/reason，便于复核一份 P0 报告里到底有多少缺口能直接处理；该能力只增强审计发现性，不保存报告全文、不自动运行任何 P0 action。
- P0 `Open P0 Gaps` 队列 readiness 现在也在 Audit 报告行内可读：账本行会额外回读 `p0BacklogTotalCount` 和 `p0BacklogReadinessRecorded`，并通过统一 helper 生成 `P0 backlog readiness: <可执行>/<总数> executable, <不可执行> not executable · first <action> <reason>` 摘要；页面在每条 `p0_readiness_report` 证据区追加一个紧凑 chip，旧报告缺少 backlog metadata 时显示“未记录”，新报告队列为空时显示“无开放缺口”。该展示只解释已入账 P0 报告，不自动执行队列 action、不修改签名链、不提交模拟委托，也不放开实盘边界。
- P0 最新可用性报告摘要现在也上浮 `Open P0 Gaps` 队列 readiness：`buildAuditEvidenceReportLedgerSummary` 会从最新 ready `p0_readiness_report` 行回填 `latestAuditAidBacklogExecutableCount`、`latestAuditAidBacklogNotExecutableCount`、`latestAuditAidBacklogTotalCount`、`latestAuditAidBacklogReadinessRecorded` 和 `latestAuditAidBacklogReadinessLabel`。首页“最近入账报告”和 Audit 报告历史摘要都会显示同一条紧凑 chip，让操作者不用展开历史行也能知道最新 P0 报告里有多少缺口能直接处理、多少还被阻断；该能力只复用已入账 metadata，不重新排序 backlog、不自动运行下一步、不改变签名链、模拟委托或实盘边界。
- P0 最新可用性报告摘要里的 `Open P0 Gaps` 队列 readiness 现在也可定位、可复制：`buildAuditEvidenceReportLedgerSummary` 会生成 `latestAuditAidBacklogReadinessQuery`，把最新报告定位 query 与 `backlog-recorded/backlog-not-recorded`、`backlog total <n>`、`executable <n>`、`not-executable <n>`、首条 backlog action/reason 合并成同一条 Audit 搜索语句。首页“最近入账报告”和 Audit 报告历史摘要都提供“定位缺口队列 / Focus backlog”和“复制缺口队列链接 / Copy backlog link”，打开后只恢复 Audit 查询上下文，不重新生成报告、不自动执行 P0 action、不改变模拟委托或实盘边界。
- P0 可用性报告行现在也能定位、复制自己的 `Open P0 Gaps` 队列 readiness：新增 `buildAuditEvidenceReportLedgerRowP0BacklogReadinessQuery`，复用同一条 backlog 搜索语义，只有 ready 的 `p0_readiness_report` 行才生成查询。Audit 报告历史的每条 P0 报告行在显示 backlog readiness chip 时，也会在动作区提供“定位缺口队列 / Focus backlog”和“复制缺口队列链接 / Copy backlog link”；这样操作者查看旧报告或搜索结果里的单条报告时，不需要回到“最新辅助”摘要，也能复制该报告自己的队列复核上下文。该动作只过滤 Audit 历史，不运行 backlog action、不写入账本、不改变签名、模拟委托或实盘边界。
- P0 可用性报告账本现在保留并优先展示入账时的原始 `backlogReadinessSummary`：`AuditEvidenceReportLedgerRow` 会读回 `p0BacklogReadinessSummary`，最新 P0 辅助摘要会暴露 `latestAuditAidBacklogReadinessSummary`，Audit 搜索和复制出来的 backlog readiness 查询也会包含这段原始摘要；报告行 chip 在该字段存在时直接显示入账原文，旧报告或缺字段报告才回退到计数推导。这样报告行 chip、事件 detail 和 metadata 摘要之间不再只靠计数重建，可以直接复核入账时写下的队列状态；该能力只提升审计可追踪性，不重新生成报告、不运行 backlog action、不改变签名链、模拟委托或实盘边界。
- P0 backlog readiness 查询现在带有稳定的 summary 存在性标记：复制出来的 backlog readiness 查询和 Audit 搜索文本都会包含 `backlog-summary-recorded` 或 `backlog-summary-missing`，并在存在原始摘要时同时包含入账 summary 文本。这样操作者可以直接过滤“新式报告是否保留原始队列摘要”，也能继续按首条 action/reason 和计数定位；该能力只增强审计检索，不写入新事件、不重新生成报告、不运行任何 P0 action。
- P0 backlog readiness chip 的 hover 上下文现在也会说明来源：新增 `buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle`，首页最近入账报告和 Audit 报告行都复用同一条 title，明确显示该 chip 来自 `metadata backlogReadinessSummary`、旧报告还是计数 fallback。这样复核者不必猜页面展示是否为入账原文；该能力只改变前端可解释文本，不写后端账本、不影响搜索、不触发任何执行动作。
- P0 backlog readiness title 现在也进入 `AuditEvidenceReportLedgerSummary`：`latestAuditAidBacklogReadinessTitle` 会随最新 P0 辅助摘要一起生成，首页最近入账报告和 Audit 摘要不再各自按 row 反查来源说明，而是直接使用同一个 summary 字段。这样最新报告摘要、行级报告 chip 和复制查询继续保持同源；该能力只收口前端模型，不改变后端事件、报告内容、签名链或执行闸门。
- P0 可用性报告行的进度 chip 现在也有独立的稳定查询：新增 `buildAuditEvidenceReportLedgerRowP0ProgressQuery`，把报告定位字段、`p0-progress-focus`、`p0-state` 和 `p0-progress <matched>/<total>` 合并成行级 Audit 搜索语义；账本搜索文本同步包含 `p0-progress-focus`，因此从单条报告 hover 上下文复制出的进度定位语句可以精确回到同一份报告。该能力只增强 P0 进度复核和深链可解释性，不新增报告、不自动推进 P0 action、不改变签名链、模拟委托或实盘边界。
- P0 最新可用性报告摘要现在也暴露同源进度查询：`AuditEvidenceReportLedgerSummary` 新增 `latestAuditAidProgressQuery`，直接复用行级 `buildAuditEvidenceReportLedgerRowP0ProgressQuery`，Audit 报告历史顶部的“最新进度”徽标 tooltip、 “定位进度 / Focus progress” 和“复制进度链接 / Copy progress link”都会使用同一条 `p0-progress-focus` 查询。这样操作者无需展开单条报告，也能从摘要层过滤到最新 P0 完成度证据；该能力只恢复 Audit 查询上下文，不生成报告、不运行 P0 action、不写新事件、不改变签名链、模拟委托或实盘边界。
- P0 纸面盘预检摘要现在也有独立的稳定查询：新增 `buildAuditEvidenceReportLedgerRowP0PreflightQuery` 和 summary 级 `latestAuditAidPreflightQuery`，查询会包含报告定位字段、`p0-preflight-focus`、preflight state、primary action、attention 数、gate 分布和 paper-only/live-boundary；Audit 报告历史顶部和单条 P0 报告行都提供“定位预检 / Focus preflight”和“复制预检链接 / Copy preflight link”。该能力只定位已入账的 paper preflight 证据，不重新运行预检、不提交模拟委托、不写新事件、不改变签名链或实盘阻断。
- 首页“最近入账报告”回显现在也复用 P0 进度和纸面盘预检查询：新增“定位进度 / 复制进度链接”和“定位预检 / 复制预检链接”动作，分别调用 `latestAuditAidProgressQuery` 与 `latestAuditAidPreflightQuery` 并同步 `workspace=audit&auditReportQuery=...`。这样用户从首页就能跳到最新 P0 完成度或 preflight gate 证据，不必先进入 Audit 后再手动搜索；该能力只恢复只读审计查询上下文，不运行流水线、不执行下一步、不提交模拟委托、不写新事件、不改变实盘阻断。
- 首页“最近入账报告”现在也能复制整份 P0 报告的 Audit 定位链接：新增“复制报告链接 / Copy report link”，直接使用 `latestAuditAidReportQuery` 和统一的 `copyAuditReportLedgerQueryLink`，与“在审计中查看 / Open in Audit”保持同一条报告定位语义。这样分享或跨会话复核最新 P0 可用性报告时，不必先进入 Audit 再复制查询；该能力只复制只读审计链接，不重新生成报告、不运行 P0 action、不写新事件、不改变签名链、模拟委托或实盘阻断。

这些能力在 P0 和 P1 稳定后再重新评估。

## 12. P0 完成定义

P0 完成时必须满足：

- 平台有清晰产品工作区。
- 黄金路径可以跑通，且不依赖隐藏 demo 假设。
- 所有依赖行情数据的步骤都显示数据质量。
- 策略配置结构化、可版本化。
- 回测运行可复现、可审计。
- AI 评审不能绕过审计证据。
- 模拟执行不能绕过审计证据。
- 回放能恢复图表、策略、回测、AI 评审和模拟执行状态。
- 导出导入包能在另一台机器上复现关键结果。
- 自动化测试覆盖后端合同和前端状态流转。

实现更新：P0 完成定义已经从静态清单收口为前端模型 `buildP0CompletionChecklist`。该模型会把产品工作区数量、Golden Path 摘要、数据质量 runbook、策略版本、审计回测、AI 证据、模拟执行预检、回放证据、导出导入证据和自动化测试验证统一成 10 项 `passed/review/blocked` 完成标准，首页 P0 卡片会显示紧凑完成度和最多 4 个待处理标准，点击可跳转到对应工作区；`buildP0PlatformReadinessReportMarkdown` 也会输出同一张 `P0 Completion Checklist`，让复制、下载或入账的 P0 可用性报告携带完整完成定义。运行时不会伪造自动化测试通过状态，未由当前证据证明的标准会保持 `review`，继续维持 paper-only/live-blocked 边界。

最新更新：P0 可用性报告入账时已经把 `P0 Completion Checklist` 的通过数、复核数、阻塞数、完成百分比、当前 completion 缺口、目标工作区、待处理标准和 completion 摘要写入 `p0_readiness_report` metadata；Audit 报告台账会解析为 `p0Completion...` 行字段，并支持按 `completion-recorded`、`completion 6/10`、`completion-blocked 1`、当前标准 id 和 `completion-summary-recorded` 搜索旧报告。这样 P0 完成定义从首页显示、Markdown 报告延伸到可追溯审计检索，但仍只是审计辅助材料，不进入签名链、不触发模拟或实盘执行。

最新更新：P0 completion 现在也有稳定的模型层定位语义：新增 `buildAuditEvidenceReportLedgerRowP0CompletionLabel`、`buildAuditEvidenceReportLedgerRowP0CompletionTitle` 和 `buildAuditEvidenceReportLedgerRowP0CompletionQuery`，查询会携带 `p0-completion-focus`、完成比例、review/blocked 计数、当前标准、目标工作区、待处理标准和原始 completion summary；`AuditEvidenceReportLedgerSummary` 同步上浮最新 P0 audit aid 的 completion label/query/title/recorded 状态。后续首页或 Audit UI 增加“定位完成定义 / 复制完成链接”时可以复用同一条查询，不需要在组件里重新拼搜索词。

最新更新：P0 completion 定位语义已经接入界面。首页“最近入账报告”、Audit 报告历史顶部摘要和单条 P0 报告行都会显示 `P0 completion` chip，并提供“定位完成定义 / Focus completion”和“复制完成链接 / Copy completion link”动作，统一使用 `latestAuditAidCompletionQuery` 或行级 `buildAuditEvidenceReportLedgerRowP0CompletionQuery`。这些按钮只切换只读 Audit 查询上下文，不重新生成报告、不推进黄金路径、不提交模拟委托、不写新事件、不改变签名链或实盘边界。

最新更新：P0 completion 当前缺口已经从行级审计记录上浮到 `AuditEvidenceReportLedgerSummary`，包括当前标准 id、标准说明、状态、建议动作和目标工作区。首页“最近入账报告”在显示 completion chip 后会补充“完成缺口”摘要，并新增“打开完成缺口 / Open completion gap”动作：点击会保留同一条 completion 审计查询上下文，再切换到该完成标准对应的产品工作区，方便继续处理 P0 未完成项。该动作仍只是手动导航，不自动运行 AI、流水线、回测、模拟委托或任何实盘执行。

最新更新：Audit 报告历史也接入了同一条 completion 当前缺口导航。`AuditEvidenceReportLedgerPanel` 现在接收产品工作区切换回调，最新 P0 辅助摘要和单条 `p0_readiness_report` 行都会在存在 `p0CompletionCurrentCriterionTargetWorkspaceId` 时显示“打开完成缺口 / Open completion gap”；点击前会先把 Audit 查询切到该报告自己的 completion 定位语义，再切换到目标工作区。这样从首页、Audit 摘要或旧报告行进入 P0 未完成项时不会丢掉审计上下文；该动作仍不自动执行策略、AI、回测、模拟委托或实盘路由。

最新更新：P0 completion 当前缺口现在也有可复制的跨会话链接。新增 `buildP0CompletionGapUrlSearch`，只在目标工作区合法且 completion 审计查询非空时生成 `workspace=<目标>&auditReportQuery=<completion-query>`；首页“最近入账报告”、Audit 顶部摘要和单条 P0 报告行都会显示“复制完成缺口链接 / Copy completion gap link”。打开该链接会利用现有 URL 恢复逻辑进入对应工作区并保留 Audit 查询上下文，方便小团队把“哪份报告、哪个完成标准、该去哪个工作区处理”一起分享。该链接仍只恢复页面上下文，不自动运行任何 P0 action、不写入新事件、不改变签名链、模拟委托或实盘边界。

最新更新：P0 completion 当前缺口链接现在具备明确的恢复语义。新增 `resolveP0CompletionGapDeepLinkState`，只有合法工作区且 `auditReportQuery` 含 `p0-completion-focus` 的链接才会被识别为 completion gap；首页 P0 卡片会显示“已载入完成缺口链接 / Recovered completion gap link”，并提供“打开审计定位 / Open Audit query”和“继续完成缺口 / Continue completion gap”两个手动动作。生成函数也同步拒绝不含 completion 定位 token 的查询，避免复制出无法恢复的链接。该恢复入口仍只切换页面上下文和只读 Audit 查询，不自动执行流水线、AI 辩论、回测、模拟委托或实盘路由。
