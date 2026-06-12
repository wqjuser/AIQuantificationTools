# AIQuantificationTools 产品规划

## 1. 产品定位

AIQuantificationTools 的目标不是一个图表演示页，也不是把行情、AI、回测按钮随手堆在一起的工具箱，而是一个面向个人和小团队的全功能量化交易平台。

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

短期实现必须分阶段推进：研究、回测、AI 评审、模拟执行先稳定，再进入实盘执行准备。实盘不是简单加一个下单按钮，而是整个平台审计链路和风控链路成熟后的结果。

## 2. 产品原则

- 证据优先：AI 解读、策略晋级、模拟委托和未来实盘委托都必须能追溯到数据快照、策略版本、回测参数、风控审批和 run id。
- 本地优先：默认使用本地数据库、本地缓存、本地审计日志和用户自管 API Key。
- 全平台目标，分阶段交付：路线面向真实交易平台，但真实资金执行必须由适配器认证、风控审批和人工确认共同解锁。
- 多市场统一：A 股、美股、加密货币使用统一内部 schema，同时保留交易日历、时区、涨跌停、最小交易单位等市场差异。
- 不制造虚假信心：demo 数据、降级数据、过期数据、缓存数据、模拟账户都必须明确标识。
- 工作流优先：每个页面服务一个明确任务，而不是展示一堆孤立组件。
- 可复现：研究运行、策略版本、回测假设、AI 报告和执行记录都能回放、导出、导入和校验。
- 安全闸门：实盘执行必须显式开启、可审计、可回滚，不能被误触发。

## 3. 目标用户

### 主要用户

具备一定技术能力的个人量化交易者或技术型投资者，希望在本地完成 A 股、美股、加密货币的行情研究、策略构建、回测、AI 辅助评审、模拟交易和未来实盘执行。

### 次要用户

小型研究团队，需要可复现的策略研究流程、模拟盘记录和可审计的 AI 辅助分析。

### 早期不服务的用户

- 高频交易团队。
- 多租户 SaaS 客户。
- 需要应用直接托管资金或账户的用户。
- 期待应用直接给出保证收益或买卖建议的用户。

## 4. 核心产品闭环

平台必须围绕一条稳定的黄金路径建设：

```text
市场数据 -> 研究工作台 -> 策略工坊 -> 回测实验室 -> AI 评审 -> 风控审批 -> 模拟交易 -> 晋级队列 -> 实盘执行
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
- 研究工作台已经支持按市场、标的和周期保存本地研究笔记，并把运行时笔记快照纳入审计 run、导出包和 AI 证据边界；导入研究运行包时，包内非空研究笔记会恢复到本地笔记库，前端也会读回并刷新可编辑草稿，跨机器回放后可以继续编辑同一研究上下文。
- 研究运行审计库已经存在。
- 策略配置和回测合同已经存在。
- 策略库已经不再只是当前标的的小列表；最近策略版本可在 Strategy Lab 全局查看，并显示与当前草稿的上下文、名称、入场、出场、仓位和风控差异；载入时会切换到该版本绑定的市场、标的和周期，并清空旧审计证据，要求重新运行流水线。研究运行导入会把包内 `researchRun.strategyConfig` 按原始 revision 还原为 audited 策略版本，前端导入完成后也会刷新同上下文策略库并合并到 Strategy Lab 最近策略列表，避免跨机器导入后策略工坊和审计 run 断链。
- 策略工坊已经加入草稿就绪闸门，保存或审计前会显示策略结构、风控参数、执行模式和审计证据是否通过；这些 gate 已经有本地核心 `/api/strategies/validate` 契约，前端优先使用核心校验、核心不可用时本地兜底。默认草稿的风控文本已经与结构化编辑器保持一致，策略版本保存和研究流水线启动前都会复用核心校验，阻断未结构化或风控不完整的草稿进入策略库、回测、AI 评审或模拟执行。入场策略中的成交量确认已经进入结构化条件和回测引擎，`volume_above_sma` 会和 SMA/RSI 入场一起参与审计回测，并在 Strategy Lab 构建器中提供成交量确认开关和 VOL 窗口控件；RSI 阈值条件也已经进入结构化解析、策略预检、回测引擎和前端审计回放，支持 `rsi_below` / `rsi_above`，并在 Strategy Lab 结构化构建器中提供入场/出场条件类型、RSI 窗口和阈值控件；入场侧已经支持 SMA 主条件叠加 RSI 动量确认和成交量确认，能生成 `Close > SMA5 AND RSI14 > 55 AND Volume > VOL10` 这类多条件草稿并恢复为可编辑字段；内置策略模板已经覆盖 SMA 趋势、RSI 反转和放量突破三类基础草稿，套用模板会清空旧审计证据并要求重新运行流水线。
- 回测实验室已经把审计 run 提升为 Backtest Report，集中展示指标、交易流水、权益曲线、诊断、同数据快照基准对比、参数敏感性摘要与扫描表、证据包、AI 评审准备状态和执行交接状态。
- Backtest Report 已经支持导出 Markdown 审计报告，面向人工复核和留档；报告内包含同一审计快照上的参数扫描摘要、SMA 参数敏感性表、同上下文运行对比矩阵和同市场同周期的 Cross-Symbol Comparison 横向证据，且当入场规则叠加 RSI 动量确认或成交量确认时会同步扫描 RSI 阈值与 VOL 窗口候选，非当前参数候选可以暂存回策略工坊并强制重新审计；跨标的比较只引用各标的最新审计 run 的收益、回撤、胜率、交易数和数据质量，不构造组合仓位，也不输出买卖建议。同一份报告也会作为 `aiqt.backtestReport` 顶层 artifact 附加到研究运行 JSON 复现包，跨机器导入时保留 Markdown 内容、内容 SHA-256、运行上下文和非投资建议边界。
- Backtest Report 已经新增同上下文运行对比矩阵：只比较同市场、同标的、同周期的已审计运行，标记当前运行、上一轮可比运行、最佳收益和最低回撤，支持按 run、策略 revision、标签和数据质量搜索；该矩阵只用于历史证据复盘，不作为优化器或买卖建议。
- 组合级回测已经从后端能力进入 Portfolio 工作区：`PortfolioBacktestEngine` 可以把多个已审计单标的 `BacktestRun` 按目标权重聚合为组合权益曲线、现金缓冲、组合收益/回撤/交易数、数据质量和标的贡献；本地核心新增 `POST /api/portfolio/backtest`，输入已存在的审计 run id 与权重，输出组合级证据。前端 Portfolio 工作区会从同市场、同周期、带权益曲线的审计运行历史生成静态权重组合草稿，并可直接调用核心接口展示组合指标、现金权重、权益点数量和各标的贡献；当同市场 peer 不足时，Portfolio 工作区会基于当前自选列表生成对照审计计划，并可一键补跑最少需要的 peer 审计 run，让组合回测从 blocked 进入 ready。组合回测结果现在还会生成集中度、现金缓冲、总目标敞口、期末权重再平衡漂移、风险预算贡献、协方差风险贡献、成对相关性风险、负贡献标的和聚合数据质量诊断，作为组合风控复核证据；风险预算贡献以各腿 `目标权重 * 最大回撤` 作为审计证据代理，用于发现单一腿承担过多组合回撤风险；协方差风险摘要基于各腿已对齐权益曲线的逐期收益计算 population covariance、组合波动率、单腿年化波动率、边际风险贡献和贡献占比，用于发现单一腿承担过多组合波动风险；成对相关性风险基于各腿已对齐权益曲线的逐期收益 Pearson correlation，用于发现组合腿过度同向聚集。后端和 Portfolio 页面也会展示静态目标分配流水 `allocationEvents`，记录每条组合腿的来源 run id、目标权重、名义金额和现金缓冲；同时输出 `rebalanceEvents`，基于期末权重与目标权重的偏离生成 `within_band/review/blocked` 复核行，展示当前值、目标值、偏离金额和原因；`tradeReviewEvents` 会把非现金再平衡偏离转换为 `buy/sell/hold` 的纸面交易复核意图，记录来源 run id、目标/期末权重、名义金额、`paper_review/blocked/no_action` 状态和不路由订单原因；`preTradeRiskChecks` 会对组合数据质量、交易复核状态和交易名义金额阈值生成 `passed/review/blocked` 检查账本；新增 `paperOrderEvents` 会把通过检查的 hold 意图标记为 `skipped`，把需复核的买卖意图标记为 `pending_review`，把被风控阻断的意图标记为 `rejected`，从而形成后续模拟委托的确定性审计输入。五类流水都只是后续组合执行中心的审计输入，不代表真实委托、真实成交或自动再平衡。同一组组合指标、诊断、标的贡献、协方差风险摘要、分配流水、再平衡复核流水、交易复核流水、交易前风控检查、组合纸面订单事件和证据边界也可以导出为 Portfolio Markdown 报告，并以 `eventType=portfolio_report` 写入通用审计账本，metadata 保留文件名、内容 SHA-256、市场/周期、组合名称、腿数量、权益点数量、分配事件数量、再平衡复核事件数量、交易复核事件数量、交易前风控检查数量、组合纸面订单事件数量、协方差风险贡献数量、诊断数量和数据质量边界。Audit 报告历史会同页回读 `portfolio_report`，展示组合上下文、腿数量、权益点数量和签名状态，并允许复用本地 HMAC 签名 API 对 Portfolio 报告签名、验签和撤销；外部 `aiqt.portfolioReport` 报告包现在也能走 `/api/audit/reports/verify-package` 只读验签，返回 `portfolio_report` 证据而不写入本地账本。当前版本只做时间戳对齐的静态权重组合聚合、组合级复核诊断、协方差风险摘要、静态分配流水、再平衡复核流水、纸面交易复核流水、交易前风控检查账本、组合纸面订单事件账本、离线报告、报告入账、报告签名链和外部组合报告包验签，不执行真实再平衡，不做真实组合交易成交、完整协方差风险模型、研究运行 JSON 包内 Portfolio artifact 或自动调仓。
- 组合纸面委托已经从单次回测 payload 进入本地可审计记录：本地核心新增 `PortfolioPaperOrderStore` 和 `/api/portfolio/paper-orders` POST/GET 契约，可以把 `paperOrderEvents` 按 `baseRunId`、组合名称、来源、批次 id、订单数组和状态汇总持久化到 SQLite。Portfolio 工作区新增显式“入账委托”动作，并会按当前审计 run 回读最近入账批次，展示批次 id、订单数、名义金额和状态计数。每次组合委托批次入账现在会同步写入 `eventType=portfolio_paper_order_batch` 的通用审计事件，metadata 保留 batch id、订单数、名义金额、状态计数、状态机计数、可路由数量、paper-only 和 live blocked 边界；前端 `recordPortfolioPaperOrderBatch` 会回传该 audit event 和 `portfolioPaperOrderLifecycle`，执行中心和 Portfolio 内嵌执行区会把最近批次压缩成组合订单生命周期行，显示待复核/拒绝/跳过数量、状态机摘要、审计事件 id 和名义金额。当前状态机已经能把 `pending_review/rejected/skipped` 与 `riskStatus`、人工审批输入合成为 `awaiting_operator_review`、`ready_for_simulation`、`risk_rejected`、`operator_rejected`、`risk_review`、`invalid_order` 和 `skipped`，只有风险通过且人工批准的正数量买卖委托才会标记为可进入模拟路由。人工审批账本已经落地：`PortfolioPaperOrderApprovalStore` 和 `/api/portfolio/paper-order-approvals` POST/GET 会按 `baseRunId + batchId + orderId` 记录审批人、审批时间、通过/拒绝和原因，并同步写入 `eventType=portfolio_paper_order_approval` 审计事件；前端 `recordPortfolioPaperOrderApproval` / `loadPortfolioPaperOrderApprovals` 已接入执行中心和 Portfolio 内嵌执行区，页面会按单笔委托展示待人工复核、风险复核、已拒绝和可模拟路由状态，并可把通过/拒绝操作写回审批账本后刷新生命周期摘要。首个 paper-only 模拟成交账本也已落地：`PortfolioPaperOrderSimulationStore` 和 `/api/portfolio/paper-order-simulations` POST/GET 只接受 `ready_for_simulation` 的委托，按名义金额/数量派生模拟成交价，写入 `eventType=portfolio_paper_order_simulation` 审计事件；前端会回读同批次模拟成交并在 Execution/Portfolio 审批队列中提供“模拟成交”动作和成交回执。绑定单一审计 run 的组合委托批次、人工审批和模拟成交回执已经一起进入研究运行 JSON 复现包：导出包会携带 `portfolioPaperOrderBatches`、`portfolioPaperOrderApprovals`、`portfolioPaperOrderSimulations` 及对应 `artifactCounts`，导入时校验 base run、写回目标核心的 Portfolio 批次/审批/模拟成交库，并纳入导入失败回滚和 undo 快照；Audit 包浏览器、近期复现包索引和导入预检会显示/搜索三类 artifact 的 manifest/package 数量一致性，避免跨机器迁移后只剩委托批次而丢失人工放行和模拟成交证据。组合模拟账户/持仓回放也已落地：`GET /api/portfolio/paper-order-replay` 会按 base run 重放已成交模拟回执，重建本地现金、持仓、权益、订单应用顺序、买卖净额、已实现/未实现盈亏和 warning；前端 Execution/Portfolio 会在模拟成交后刷新组合账户摘要和持仓行。组合订单状态历史也已落地：`build_portfolio_paper_order_state_history` 与 `GET /api/portfolio/paper-order-state-history` 会按 batch 派生创建、人工审批、模拟成交和实盘阻断事件序列，前端 `loadPortfolioPaperOrderStateHistory` / `buildPortfolioPaperOrderStateHistoryRows` 会把最新状态变化压缩成 Execution/Portfolio 的紧凑时间线。该能力仍是 paper-only 的组合执行准备账本，不连接真实券商、不生成真实资金成交；下一步应继续推进更完整的组合风险模型、受控模拟路由、真实适配器本地 secret-store 写入和受控重启编排。
- 真实适配器前执行状态账本已经落地为只读契约：`build_execution_adapter_state_ledger` 与 `GET /api/execution/adapter-ledger` 会从 Settings 的执行适配器状态和实盘必需闸门派生 paper/local、A 股、美股和加密路由的当前状态、状态事件、闸门计数、下一步和 live-blocked 边界；前端 `loadExecutionAdapterLedger` / `buildExecutionAdapterLedgerRows` 会把这些事件压缩到 Settings 的紧凑审计 rail。持久化适配器认证流水的后端契约也已落地：`ExecutionAdapterCertificationStore` 与 `/api/execution/adapter-certifications` POST/GET 会记录 adapter id、市场、路由、操作者、开始/完成时间、认证检查状态、摘要和脱敏 metadata，并同步写入 `eventType=execution_adapter_certification` 的通用审计事件；所有 `secret`、`token`、`apiKey`、`privateKey` 和 `password` 类字段都会以 `[redacted]` 存储和返回。Settings 工作区已经接入这条流水：前端会按实盘适配器拉取最近认证记录，提供“记录认证”动作，写入 sandbox/paper 凭证引用、订单生命周期、急停/限额和受控重启四类检查，并用 `buildExecutionAdapterCertificationRows` 展示最近记录的状态、检查摘要、审计事件 id 和 paper-only/live-blocked 边界。Execution 晋级队列已经读取最近适配器认证证据，并在适配器认证 stage 显示 latest audit event、检查摘要和 paper-only/live-blocked 边界；blocked/review 证据只能改善可观测性，仍保持实盘晋级阻断。本地核心现在还提供 `POST /api/execution/adapter-certifications/apply` 应用预检契约：按 certification id 校验 secret-store 引用、受控重启窗口和人工复核三项确认，返回 `blocked` 或 `ready_for_restart`，并写入 `eventType=execution_adapter_certification_apply` 审计事件；该预检只记录无密钥证据，不写环境变量、不重启容器、不连接券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true。Settings 工作区已经接入 `recordExecutionAdapterCertificationApply`：认证流水行可触发“应用预检”，并在按钮前显式展示 secret-store 引用已保存、受控重启窗口已批准、操作员已复核认证三项确认清单；用户勾选状态会作为布尔确认提交给核心，结果继续用 `buildExecutionAdapterCertificationApplyRows` 展示确认摘要、阻断数量、审计事件 id 和 paper-only/live-blocked 边界。应用预检历史也已变成可回读证据：`GET /api/execution/adapter-certifications/applies` 会从通用审计账本按 adapter id 投影最近 apply 结果，前端 `loadExecutionAdapterCertificationApplies` 会在 Settings 刷新时恢复这些结果，刷新浏览器后仍能看到最近的阻断/ready-for-restart 预检流水。Execution 晋级队列现在也会消费这些 apply 结果：`buildPromotionReadiness` 会把最近同适配器、同 certification id 的应用预检纳入 adapter certification stage，若状态为 `ready_for_restart` 会显示等待受控重启证据并继续阻断实盘路由，若状态为 blocked 会显示阻断摘要；`PromotionQueuePanel` 同步展示最近应用预检证据行。受控重启证据台账也已落地为 paper-only 安全前置层：`POST /api/execution/adapter-certifications/restart-evidence` 必须引用一条已写入审计账本且状态为 `ready_for_restart` 的 apply 预检，记录重启窗口执行、回滚计划、重启后验证和日志复核四项操作者确认，缺项返回 `blocked`，完整确认返回 `evidence_recorded` 并写入 `eventType=execution_adapter_controlled_restart_evidence`；`GET /api/execution/adapter-certifications/restart-evidence` 可按 adapter 回读最近证据，前端 `loadExecutionAdapterControlledRestartEvidence` / `buildExecutionAdapterControlledRestartEvidenceRows` 会在 Settings 刷新时恢复并在 Execution 晋级队列展示最近受控重启证据。重启后适配器验收台账也已落地：`POST /api/execution/adapter-certifications/restart-acceptance` 必须引用已记录的受控重启证据，记录本地核心健康、设置重载观察、sandbox/paper 路由握手、急停保持启用和账户同步 dry-run 五项确认，缺项返回 `blocked`，完整确认返回 `acceptance_recorded` 并写入 `eventType=execution_adapter_restart_acceptance`；`GET /api/execution/adapter-certifications/restart-acceptance` 可按 adapter 回读最近验收，前端 `loadExecutionAdapterRestartAcceptances` / `buildExecutionAdapterRestartAcceptanceRows` 会在 Settings 刷新时恢复并在 Execution 晋级队列展示最近验收证据。适配器密钥引用台账也已落地：`POST /api/execution/adapter-secret-references` 只记录引用名、后端、所需环境变量和三项操作者确认，不接收或返回真实密钥；缺少“UI 外创建引用、核验 fingerprint、轮换计划已记录”确认时返回 `blocked`，完整确认返回 `reference_recorded`，并写入 `eventType=execution_adapter_secret_reference` 审计事件；`GET /api/execution/adapter-secret-references` 可按 adapter 回读最近引用证据，前端 `loadExecutionAdapterSecretReferences` / `buildExecutionAdapterSecretReferenceRows` 会在刷新设置时恢复并在 Execution 晋级队列展示最近密钥引用证据，同时 `buildPromotionReadiness` 会把该证据纳入适配器认证 stage 的说明但不放行实盘。适配器密钥物化清单台账也已落地：`POST /api/execution/adapter-secret-materializations` 必须引用已记录的密钥引用，记录本地 secret-store 写入已核验、不在 payload 携带 raw secret、环境绑定计划已记录和回滚计划已记录四项确认，缺项返回 `blocked`，完整确认返回 `manifest_recorded` 并写入 `eventType=execution_adapter_secret_materialization`；`GET /api/execution/adapter-secret-materializations` 可按 adapter 回读最近物化清单，前端 `loadExecutionAdapterSecretMaterializations` / `buildExecutionAdapterSecretMaterializationRows` 会在刷新设置时恢复，并在 Execution 晋级队列展示最近物化证据。以上台账仍不传输或返回真实密钥、不自动写环境变量、不重启服务、不连接真实券商，也不会把 `liveTradingAllowed` 置为 true；下一步继续推进真正的受控环境绑定、受控重启编排、实盘适配器编排器和最终人工确认闸门。
- 适配器环境绑定证据台账已经作为实盘前置链路的下一层落地：`POST /api/execution/adapter-environment-bindings` 必须引用已记录且状态为 `manifest_recorded` 的密钥物化清单，记录运行时 env 映射已核验、配置重载计划已记录、不在 payload 携带 raw secret、回滚快照已记录四项确认，缺项返回 `blocked`，完整确认返回 `binding_recorded` 并写入 `eventType=execution_adapter_environment_binding`；`GET /api/execution/adapter-environment-bindings` 可按 adapter 回读最近环境绑定证据，前端 `recordExecutionAdapterEnvironmentBinding` / `loadExecutionAdapterEnvironmentBindings` 与 `buildExecutionAdapterEnvironmentBindingRows` 已具备 API 和紧凑行模型。该层仍不传输或返回真实密钥、不自动写环境变量、不重启服务、不连接真实券商，也不会把 `liveTradingAllowed` 置为 true；后续继续推进受控重启编排、实盘适配器编排器和最终人工确认闸门。
- 环境绑定后的受控运行时重载计划台账也已落地：`POST /api/execution/adapter-runtime-reload-plans` 必须引用已记录且状态为 `binding_recorded` 的环境绑定证据，记录维护窗口已批准、重载前健康基线已捕获、配置 diff 已复核、重载后 smoke 计划已记录和回滚负责人已指定五项确认，缺项返回 `blocked`，完整确认返回 `plan_recorded` 并写入 `eventType=execution_adapter_runtime_reload_plan`；`GET /api/execution/adapter-runtime-reload-plans` 可按 adapter 回读最近计划，前端 `recordExecutionAdapterRuntimeReloadPlan` / `loadExecutionAdapterRuntimeReloadPlans` 与 `buildExecutionAdapterRuntimeReloadPlanRows` 已具备 API 和紧凑行模型。Execution 晋级队列现在会在刷新 Settings 时回读环境绑定和运行时重载计划历史，`buildPromotionReadiness` 会把同适配器、同物化清单、同绑定链路的最近证据纳入适配器认证 stage，`PromotionQueuePanel` 也会展示最近环境绑定和重载计划证据行；这些证据只提升晋级链路可观测性，仍保持实盘路由阻断。该层只记录受控重载编排证据，不自动重启容器、不写环境变量、不连接真实券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；下一步继续推进真正的本地重载执行编排器、重载后验收合并和最终人工确认闸门。
- 运行时重载计划后的受控执行证据台账已经落地为 paper-only 审计层：`POST /api/execution/adapter-runtime-reload-executions` 必须引用已记录且状态为 `plan_recorded` 的重载计划，记录重载前健康复核、重载动作记录、重载后 smoke 通过、回滚就绪确认和操作员确认实盘仍阻断五项证据，缺项返回 `blocked`，完整确认返回 `execution_recorded` 并写入 `eventType=execution_adapter_runtime_reload_execution`；`GET /api/execution/adapter-runtime-reload-executions` 可按 adapter 回读最近执行证据，前端 `recordExecutionAdapterRuntimeReloadExecution` / `loadExecutionAdapterRuntimeReloadExecutions` 与 `buildExecutionAdapterRuntimeReloadExecutionRows` 已具备 API 和紧凑行模型。Settings 刷新现在会随其它 live adapter 证据一起回读最近执行证据，Execution 晋级队列会把同 adapter、同物化清单、同环境绑定、同重载计划链路的最近执行证据纳入 adapter certification stage，并在 Promotion Queue 中独立展示最近运行时重载执行证据行；完整记录会把 stage value 提升为 `Execution recorded · adapterId`，但仍保持实盘路由阻断。该层只证明操作者记录了受控重载执行证据，不执行 Docker 重启、不写环境变量、不连接真实券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；下一步承接最终验收闸门和晋级队列/UI 整合。
- 运行时重载执行后的最终验收闸门已经落地为后端、前端 typed API、Settings 显式记录入口和晋级队列可视化证据链：`POST /api/execution/adapter-runtime-reload-acceptances` 必须引用已记录且状态为 `execution_recorded` 的重载执行证据，记录执行证据已复核、重载后健康已验证、适配器握手已验证、急停仍启用和操作员确认实盘仍阻断五项确认；缺项返回 `blocked`，完整确认返回 `acceptance_recorded` 并写入 `eventType=execution_adapter_runtime_reload_acceptance`。`GET /api/execution/adapter-runtime-reload-acceptances` 可按 adapter 回读最近验收记录，前端 `recordExecutionAdapterRuntimeReloadAcceptance` / `loadExecutionAdapterRuntimeReloadAcceptances` 已具备 URL builder、typed client 和脱敏响应校验；`buildExecutionAdapterRuntimeReloadAcceptanceRows` 会把验收记录压缩成 compact ledger 行，Settings 刷新会回读 live adapter 最近验收历史，Settings 面板会基于最近运行时重载执行证据渲染五项最终验收确认和“记录最终验收”动作，写入后合并本地验收历史并刷新设置状态；`buildPromotionReadiness` 会把同 adapter、同执行链路的最近验收记录纳入 adapter certification stage，`PromotionQueuePanel` 也会展示最近运行时重载最终验收行。该层仍只记录最终人工验收证据，不写环境变量、不重启容器、不连接真实券商、不生成真实资金成交，也不会把 `liveTradingAllowed` 置为 true；真实本地重载编排器和实盘适配器仍保持后续阶段。
- AI 评审已经开始绑定审计证据，并会把同数据快照基准收益、Alpha 和参数扫描摘要纳入证据卡、评审 dossier、回测解释动作和可导出的 Markdown AI 评审报告；同时可以导出和保存结构化 AI Review Run Record JSON，记录 citation、委员会轮次、决策日志、安全边界和 `evidenceAnchors` 证据锚点。AI 证据卡、评审 dossier、Markdown 报告、结构化记录和解释/辩论动作现在复用同一套审计上下文绑定检查：只有 run 的市场、标的和周期与当前研究上下文一致时才允许生成 AI 评审证据；错配 run 会被标记为 stale 并阻断导出、保存和 AI 解释动作，避免旧回测被包装成当前结论。前端 AI Review 面板已经接入 `AiReviewRunStore` 与 `/api/research/runs/{runId}/ai-reviews` 的 POST/GET 契约，可把该记录绑定到审计 run，并在 run 回放/导入后恢复最近保存的 AI 评审记录；本地核心读取接口已经支持按 run 返回 AI Review Run Record，并提供 `limit`、`offset`、`query` 和 `pagination` 元信息；Audit 工作区已经把搜索框和上一页/下一页控件接入该后端契约，按当前 run 拉取 AI Review Run Record 当前页，并使用后端 `total` 同步漂移摘要和已保存记录历史；Audit 工作区能把当前 run id、策略版本、dossier 状态、引用数量、委员会轮次、实盘边界和执行前风控审批与最近或用户选中的保存记录做轻量对照，也能汇总当前页保存记录相对当前证据的漂移项，方便在回放页确认 AI 解释是否绑定了正确数据、回测、研究笔记和风控边界；研究运行 JSON 复现包已经把已保存 AI 评审记录作为 `aiReviewRuns` artifact 导出，并保留 `run:*`、`strategy:*`、`data:*`、`citation:*`、`committee:*`、`decision-log:*`、`boundary:*` 等证据锚点，导入时会校验并写回目标核心的 `AiReviewRunStore`，让跨机器回放也能恢复 AI 委员会证据链；Audit 工作区已经把当前记录、保存记录和时间线引用合并成可搜索的导出证据索引，可按 anchor、`exportPath`、引用值或说明快速定位复现包证据；Audit 工作区也已经新增研究运行复现包预览，统一显示 `researchRun`、`dataSnapshot`、`strategyConfig`、研究笔记、回测流水、`aiReviewRuns`、模拟执行、晋级候选和执行交接的导出就绪度，方便在进入原始 JSON 前先确认缺失或阻断项；参数候选继续使用“复审候选/非投资建议”措辞，不直接给买卖建议。
- 前端研究流水线会在 run summary 缺少数据快照时自动读取完整 run detail，保证 Backtest Report 和 AI 评审能拿到同一份审计 K 线。
- 前端风险审批和本地晋级 fallback 会优先读取审计 run 内的 `strategyConfig.risk`，避免用户编辑当前草稿后污染已审计运行的仓位和回撤审批。
- 执行中心的模拟委托预览和 projected paper position 会用审计 run 的仓位上限和初始资金计算名义金额，和后端真实 paper execution 的下单数量保持一致。
- Paper Trading 已经开始绑定审计运行；提交模拟委托前会校验审计 run 内的结构化策略风控字段，缺少仓位、止损、止盈或最大回撤时不会生成默认委托。执行中心、风险审批、模拟持仓预览和晋级队列现在复用同一套审计上下文绑定检查：只有 run 的市场、标的和周期与当前研究上下文一致时才允许预览委托数量/名义金额、提交模拟委托和进入 promotion readiness；错配 run 会被标记为 stale audited run，并把委托、持仓和晋级全部保持 blocked，避免旧回测驱动当前交易上下文。晋级队列也复用同一风险交接校验，即使存在历史模拟成交，缺失风控的审计 run 仍会保持 promotion blocked。
- Paper Trading 执行交接已经把审计数据质量纳入硬闸门；`dataQuality.isComplete=false`、`demo-fallback` 或缺失数据质量的审计 run 不能提交模拟委托，也不能进入可晋级状态。
- 前端 Risk Approval 已经显示同一条数据质量 gate；模拟委托预览和晋级队列会在提交前阻断 `demo-fallback`、`unknown`、缺失或不完整的审计数据源，避免用户把后端拒单误读成可执行机会。
- Settings 工作区已经开始读取本地核心 `/api/settings/status`，展示 A 股、美股、加密货币数据源状态、可选 API Key 是否本地配置、SQLite 行情缓存路径、缓存行数、市场/标的/周期上下文数量、最新 K 线时间、最近缓存上下文清单、每个缓存上下文的 freshness、缓存 freshness 汇总和执行适配器安全闸门；缓存上下文可通过 `/api/cache/refresh` 手动刷新并回写最新状态。设置接口只返回配置状态，不返回密钥值。
- P0 黄金路径状态已经有本地核心契约 `/api/golden-path/status`：按当前市场、标的和周期汇总行情缓存、审计研究 run、回测证据、AI 评审、模拟执行和实盘闸门，返回当前卡点、下一步动作、每一步状态、紧凑进度摘要、可复用 runbook 明细和每个产品工作区的 `ready` / `needs_run` / `blocked` 状态；前端当前任务卡已接入该状态，会优先执行刷新行情、运行流水线、提交模拟委托或跳转设置闸门等下一步动作，并显示可点击的黄金路径进度和当前/后续步骤清单，可直接跳转到相关工作区；左侧工作区按钮和当前任务卡都会优先显示黄金路径返回的工作区状态、关联步骤和阻断原因，当前任务卡内的工作区动作可直接复用同一套 Golden Path 动作路由；Audit 工作区已经接入完整黄金路径审计清单，逐步展示状态、阻断说明、工作区跳转和可执行动作，且清单动作复用同一套禁用闸门，不能绕过运行中、刷新中或缺失审计 run 的限制。runbook 明细为后续任务队列、审计页和工作区内步骤清单提供统一语义，避免页面各自拼接阻断原因。
- 前端现在会从同一份 Golden Path 状态派生 P0 可用性摘要：`buildP0PlatformReadinessSummary` 会把 passed/review/blocked 步骤数、当前缺口、下一动作目标和 live boundary 收口为 `unknown/blocked/review/paper_ready/live_ready` 五种状态；顶部当前任务卡会显示 P0 完成百分比、当前缺口和“模拟可用但实盘仍阻断”的边界说明，避免用户只看到很多工作区按钮却不知道整个平台距离真正可用还差哪一步。
- P0 可用性摘要现在进一步派生 `buildP0PlatformBacklogItems` 缺口队列：从 Golden Path runbook 中筛选未完成步骤，按当前卡点、阻断项和复核项排序，最多展示 3 条可操作任务；当前任务卡中的队列项会显示步骤、优先级、动作和原因，点击后跳转到目标工作区，让“距离可用还差什么”变成明确的下一步入口。
- P0 缺口队列现在不再只是跳转入口：每一行都有独立“工作区”和“动作”控件，动作复用 `runGoldenPathActionById`、`isGoldenPathActionDisabledById` 和既有预检闸门，可以触发刷新行情、运行流水线、AI 评审、提交模拟委托或查看实盘闸门；禁用状态仍由同一套 Golden Path/Research preflight 判断控制，不绕过审计、风控或实盘阻断。
- P0 缺口队列的动作现在会在行内显示紧凑 gate hint：`run-pipeline` 复用 Research 上下文预检摘要，模拟委托、缓存刷新和无直接动作的缺口会显示本地禁用原因，让用户知道按钮灰掉是因为缺少审计/AI/模拟执行闸门、刷新占用，还是只能先进入工作区复核。
- Golden Path 的 `run-pipeline` 动作现在会同时显示 Research 上下文预检摘要：如果只剩 review gate，当前任务按钮和工作区动作会提示运行前需要确认并列出前几个复核项；如果存在 blocked gate，则同一位置提示先修复阻断项。该提示复用 `ResearchPipelinePreflight`，不改变审计流水线的实际运行、确认或阻断规则。
- Audit 工作区的完整 Golden Path runbook 也复用同一套预检提示：当某一行的动作是 `run-pipeline` 且 Research 上下文仍有 review/blocked gate 时，行内会展示同样的复核或阻断摘要，让审计清单、当前任务卡和工作区动作保持同一判断口径。
- Audit 工作区的 Golden Path runbook 现在进一步复用 P0 缺口队列的禁用动作说明：`submit-paper-order`、缓存刷新和等待中动作会在行内显示紧凑 gate hint，说明是缺少审计/AI/模拟执行闸门、刷新通道占用还是当前任务未完成；该提示只解释现有禁用状态，不放宽任何审计、风控或实盘阻断。
- Golden Path 的 `submit-paper-order` 动作现在可以先绑定本地核心返回的 `latestRunId`：当后端已经判定当前上下文有可用审计 run、但前端当前 workspace 还没有回放该 run 时，动作不再永久灰掉，而是先从运行历史或 detail API 回放最新审计 run 并切到 Execution / paper 工作流；只有 run 在点击前已经绑定且风控审批未阻断时才会立即提交模拟委托。该恢复动作不绕过 AI 证据、风控审批、paper-only 或实盘阻断。
- P0 可用性报告入账后，Audit 报告历史行现在会直接暴露纸面盘预检摘要：`p0_readiness_report` 会从 metadata 投影 preflight state、primary action、通过/复核/阻断 gate 计数和 paper-only/live-boundary，并以紧凑徽标展示；报告历史搜索也能命中 preflight 状态、动作 id/名称和边界。该报告仍只是 audit aid，不进入签名链，不触发委托，不放宽实盘阻断。
- Audit 报告历史顶部的“最新辅助”汇总现在也会上浮最新 P0 报告的纸面盘预检徽标，显示 preflight 状态、primary action 和 gate 计数，方便先判断最新 audit aid 是否仍需复核；该汇总只读，不新增下单、签名或实盘授权入口。
- 最新 P0 audit aid 的纸面盘预检汇总还会把 `review + blocked` gate 汇总成“预检关注 / Preflight attention”计数，让 Audit 页顶部先暴露最新可用性报告仍需人工处理的数量；该计数只读，不并入签名链 attention，也不改变实盘阻断。
- 最新 P0 audit aid 的纸面盘预检汇总还会上浮 primary action label，Audit 报告历史摘要会显示“下一步 / Next action”（例如加载最新审计运行、提交模拟委托或复核风控闸门），让操作者不打开报告正文也能看到 P0 收敛动作；该动作标签仍只读，不触发委托、签名或实盘授权。
- 行情中心的数据源健康面板已经接入当前标的/周期的缓存上下文，可直接刷新当前 K 线缓存，并在刷新后回写 Settings 状态和重新加载图表。
- 行情中心标的搜索现在会按当前选择周期返回本地 K 线缓存覆盖状态：`GET /api/market/search` 可接收 `timeframe`，每条 suggestion 会带 `cache.freshness`、行数、ageHours 和起止时间；前端搜索下拉同步展示 fresh/stale/empty 摘要，用户在切换标的前就能判断是直接进入研究还是先刷新行情缓存。该能力只增强 Stage 1 行情/研究可用性，不创建策略、AI 评审、组合、模拟委托或实盘行为。
- 行情中心新增只读市场交易时段状态：本地核心 `GET /api/market/calendar` 会按 A 股、美股和加密货币返回统一的市场、时区、开闭市状态、当前 session、下一次开/收盘、静态模板 warning 和来源；Market 工作区会随当前市场展示该状态卡。当前实现是本地 session template，不包含完整节假日表，只用于 Stage 1 行情/研究复核，不解锁模拟委托、真实委托或任何交易路由。
- 行情中心搜索建议现在可以直接补齐缺失或过期的当前周期缓存：`empty` / `stale` suggestion 会显示独立“刷新缓存”动作，点击后切到该标的研究上下文，复用单标的缓存刷新 API，并在刷新后重新加载该标的 K 线。主建议点击仍只负责选择标的，刷新按钮不嵌套在主按钮内，避免误触；该动作仍然只处理 Stage 1 行情缓存和研究入口，不创建后续交易证据。
- 研究上下文就绪清单的本地缓存行已经和搜索刷新入口形成闭环：fresh 缓存会明确提示可支撑审计研究；stale、empty 或缺失缓存会提示从搜索建议刷新或当前缓存刷新后再运行审计研究，同时保留既有 ready/review/blocked 闸门和刷新动作。
- 黄金路径的行情数据步骤现在也沿用同一套缓存和刷新证据语义：fresh 缓存会显示“可支撑审计研究”，并在 API 路径读取最近自选缓存刷新运行；若没有匹配、完整、无 warning、非 demo/unknown 的刷新证据，则把 market-data 保持为 review，并把当前任务、工作区状态和审计清单动作指向 Market 工作区的 `refresh-watchlist-cache`，直接生成可锁定的数据准备证据；stale、empty 或缺失缓存会把下一步原因写成“刷新行情后再运行审计研究”，并继续指向单标的 `refresh-data` 动作。
- 行情中心已经开始承担 watchlist 数据准备职责：当前周期下会显示自选缓存 fresh/stale/empty 摘要；一键刷新自选列表缓存现在会调用核心 `POST /api/cache/watchlist-refreshes`，生成本地 SQLite 持久化的 watchlist cache refresh run，记录 run id、每个标的的数据质量、入库行数、跳过/失败原因和最新 Settings 状态；前端刷新设置时会通过 `GET /api/cache/watchlist-refreshes?limit=4` 回读最近运行，数据源健康面板会同时显示最近一次摘要、最近多次刷新历史和选中运行的逐标的状态明细，点击历史 run 可切换明细，点击明细行可切换到对应研究上下文，页面刷新或 Docker 重启后仍能看到自选数据准备证据链。
- 图表 K 线接口已经接入本地 SQLite 缓存兜底；外部 K 线源离线或只返回 incomplete fallback 时，会优先返回 `local-cache`，并避免把 demo fallback 写入本地缓存。
- 研究流水线也已经接入同一套本地行情缓存兜底；外部 K 线适配器离线或只返回 incomplete fallback 时，回测、AI 解读和审计 run 会使用 `local-cache` 数据质量继续完成，并避免把 demo fallback 污染到 SQLite 缓存。
- 研究流水线即时返回的 `researchRun` 已经携带 `dataQuality` 和 `strategyConfig`，与持久化审计 run 保持一致；前端刚跑完流水线时即可用已审计数据质量和结构化策略风控驱动 Backtest、AI Review、Paper Trading 和风险闸门。
- 前端研究流水线成功日志已经展示本次审计运行的数据源、完整性、warning 数、策略 revision 和执行模式，便于用户区分真实上游、local-cache 和降级数据。
- RSI 策略条件已经进入 P0 基础规则能力：`RSI14 < 30` / `RSI14 > 55` 这类草稿会生成结构化 `rsi_below` / `rsi_above` 条件，策略预检显示 RSI gate，回测按 RSI 阈值触发交易，审计回放会恢复可读规则和参数标签；前端构建器现在可以直接在 SMA 与 RSI 条件间切换，并把阈值保存为可复现草稿字段，也可以把 RSI 作为入场确认条件叠加在 SMA 主条件上。
- 导出、导入和完整性校验已经存在；manifest artifact counts 已覆盖数据快照、交易流水、研究笔记、模拟执行、组合纸面委托批次、晋级候选和 AI 评审记录，防止复现包宣称的证据数量和实际内容不一致。Audit 工作区现在有导出复现包预览、AI 证据索引、复现包浏览器、近期复现包索引和导入影响预检；用户可从运行历史加载指定 run 的 JSON 包，检查 manifest、SHA-256 integrity、数据/回测/研究笔记/模拟执行/组合委托/AI 评审/执行交接数量是否与包内 artifact 一致，也可一键索引近期运行包并按 run、标的、hash、阻断原因、artifact、`auditReport`、`backtestReport`、报告短 hash 和执行交接跨包搜索；若索引包内报告 run/上下文/hash/Markdown 或执行类 artifact 数量与 manifest 不一致，索引行会直接标记为 blocked。外部 JSON 文件导入已经改为先进入同一套预检面板，显示复现包 SHA-256 integrity、manifest artifact 数量、run id、上下文、周期、数据 hash、策略 revision、研究笔记、模拟执行、组合纸面委托批次、AI 评审、可选 Audit Markdown 报告、可选 Backtest Markdown 报告和实盘边界会新增、变更、替换或阻断；若 integrity 无效、artifact 数量与包内载荷不一致，或 `auditReport` / `backtestReport` 的 run/上下文/hash 与 manifest 不一致，确认导入会在前端预检阶段禁用，用户确认后才会调用本地核心写入。导入预检、阻断、取消、失败、确认写入、主动撤销和撤销完成状态现在会进入后端 `AuditEventStore` 与 `/api/audit/events`，Audit 工作区进入时会按后端 query、limit/offset 分页回读导入事件，并继续显示 run、文件、阻断/变更数量、exportPath、失败分类、恢复提示、确认导入前绑定的旧 run 和后端返回的 undo token；确认导入事件可先在行内打开二次确认，再携带 undo token 和该事件 run id 调用 `/api/research/runs/import/undo` 撤销本次写入，撤销成功后同一审计事件会刷新为 `undone`，隐藏重复撤销入口并显示 token 已消费，也保留旧 run 回放作为上下文恢复兜底；撤销失败会新增 `undo-failed` 审计事件，保留失败原因、undo token、旧 run 回放入口和恢复提示，同时保留原 confirmed 事件用于匹配 run 后重试。Audit 导入审计面板已经补上 all/待复核/可撤销/可恢复/已撤销筛选、撤销失败计数和 blocked/schema/integrity/artifact/core/unknown 失败聚合卡；文本搜索由后端跨完整账本查询，阶段筛选作用于当前页，上一页/下一页由后端 pagination 控制，避免事件超过 12 条后只能看最近窗口；confirmed、undone 和 undo-failed 事件现在可以一键打开该 run 的复现包证据，复用复现包浏览器和导入影响预检上下文，让历史流水从“记录”变成恢复/复盘入口；打开证据时会把 `manifest:<runId>` 等审计锚点规范化为可命中的查询，并同步聚焦复现包浏览器和导入 diff 搜索框；每条导入审计事件也能复制当前应用 URL 形式的证据锚点，包含 `auditEvent`、`runId` 和 `exportPath`，便于外部审计报告回指同一复现证据。后端导入写入阶段已经加入补偿式事务回滚：若研究 run、研究笔记、策略版本、模拟执行、组合纸面委托批次或 AI 评审任一 store 在写入中途失败，API 会返回 `research_run_import_write_failed`，并全量恢复导入前记录或删除本次半写入记录；成功导入则写入 `ResearchRunImportUndoStore`，撤销前会校验 `expectedRunId` 与 undo token 绑定 run 一致，错配返回 `research_run_import_undo_run_mismatch` 且不会消费 token，撤销后会把 undo token 标记为 consumed，避免重复撤销。打开带 `auditEvent` 参数的链接时会把导入审计查询初始化为该事件 id，并在事件出现时滚动/高亮对应流水行；若 URL 同时包含 `runId` 和 `exportPath`，前端会复用打开证据入口自动拉取该 run 的复现包，并把包浏览器和导入 diff 查询初始化到对应 artifact，形成从外部审计报告回到复现证据的完整深链体验；复现包浏览器会显示深链加载状态和重试入口，下载的 JSON 复现包也会附带可选 `auditEvidenceSummary`、`auditReport` 和 `backtestReport`，用于跨机器保留当时的包焦点、导入 diff 摘要、Audit 报告和 Backtest 报告证据。
- 复现包内的 `auditReport` 与 `backtestReport` 现在可以携带无 secret 的签名元数据，包括 `signed`、`verified`、`revoked` 或 `invalid` 状态、原始签名报告事件 eventId、signer、key id、algorithm、chain id、签名值和签名/验签/撤销时间。包浏览器、近期复现包索引和导入影响预检都会显示并支持搜索这些签名状态和 key id；导入归一化会拒绝把 `secret`、`privateKey`、API token 或密码类字段塞进报告签名 metadata 的外部包，并会清除外部文件伪造的本机导入验签 marker。导入影响预检现在还会把 `revoked` / `invalid` 报告签名、以及 `signed` / `verified` 但缺少 event id、algorithm、chain id、key id、signer、签名值或时间戳的签名元数据标记为 blocked；`unsigned` 报告仍可作为无签章的离线证据导入，但不会被当成已签名材料。外部 JSON 文件进入导入预检前，前端会先把带 eventId 的报告 artifact 送到本地核心 `/api/audit/reports/verify-package` 做只读验签；验签结果会以 `local-core` provenance 写回导入 diff，验签失败会把签名状态刷新为 `invalid` 并在 diff 中阻断，不会把外部报告事件写入本地审计账本。若旧包或外部包里的 `auditReport` 虽然签名仍为 `signed/verified`，但内嵌 `auditEvidenceSummary.importVerification.invalid > 0`，导入影响预检也会把该报告标记为 blocked，提示其携带无效导入证据，避免旧签名绕过新的报告签名策略。导入审计事件会把每个 blocked diff 行的 id、标签、incoming 摘要、detail 和 exportPath 写入 `metadata.blockedRows`；成功确认导入时，还会从 `audit-report` / `backtest-report` diff detail 中提炼本地核心验签 provenance 写入 `metadata.verifiedReportSignatures`，Audit 历史行会直接展示这些证据，并支持后端回读后继续按 `Revoked signature`、`Signature chain blocked`、`Local core import verification`、`local-core`、验签状态或报告 exportPath 搜索；Audit 聚合卡还会把这些 blocked rows 汇总成导入验签、报告签名、复现包完整性、证据数量、实盘边界、数据快照和其他阻断证据桶，也会把 confirmed 导入里的 `verifiedReportSignatures` 汇总成本地核心验签通过/失败卡，显示最新文件、run、exportPath 和 reason，帮助用户先判断是导入证据策略问题、签名链问题、包损坏、执行边界问题，还是本地核心已经完成验签。
- 下载研究运行 JSON 复现包时，前端会额外读取同一 run 的 `audit_evidence_report,backtest_report` 账本事件，并只在 event type、run id、artifact kind、文件名、内容 SHA-256 和算法全部匹配时，把该事件的签名 metadata 连同原始报告事件 id 合并进对应 `auditReport` 或 `backtestReport` artifact；匹配失败或账本离线时仍导出未签名报告包，不阻断离线复现。
- Docker Compose 部署入口、Nginx API 反向代理和 Docker smoke helper 已经存在；GitHub Actions CI 会把测试、构建、Compose 校验、镜像构建和容器 smoke test 串成持续质量门禁。
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

### P0：平台骨架与黄金路径

目标：做出一条可靠的端到端产品流程。

范围：

- 行情中心基础标的搜索和 K 线加载。
- 研究工作台图表和因子上下文。
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
- 回测实验室支持单标的审计回测。
- AI 评审委员会锁定审计 run id。
- AI 评审运行记录必须能保存到本地核心，并在审计 run 回放、导出和导入后恢复。
- 模拟交易绑定审计 run id。
- 审计历史、回放、导出、导入。
- 清晰工作区导航。

验收标准：

- 用户可以搜索标的、加载数据、配置策略、运行回测、查看 AI 评审、创建模拟委托、回放运行并导出完整包。
- 没有审计证据不能运行 AI 评审。
- 没有审计运行不能提交模拟委托。
- 每个依赖行情的页面都能显示真实数据、fallback 数据、缓存数据和过期数据。

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
- 组合回测；已完成从已审计 run 生成静态权重组合草稿、缺 peer 时一键补跑对照审计、调用组合回测 API、展示组合结果、协方差风险摘要、静态目标分配流水、期末再平衡复核流水、纸面交易复核流水、交易前风控检查账本、组合纸面订单事件账本、组合纸面委托批次入账/查询、组合委托批次通用审计事件、组合委托人工审批 API/账本、组合委托模拟成交 API/账本、组合模拟账户/持仓回放、组合订单状态历史、真实适配器前执行状态账本、适配器认证证据绑定晋级队列、适配器认证应用预检 API/UI、执行中心组合订单生命周期行、单笔审批 UI、模拟成交按钮和成交回执、导出报告、入账签名，以及组合集中度/现金/总敞口/再平衡漂移/风险贡献/协方差风险/相关性/负贡献/数据质量复核，下一步推进更完整的组合风险模型、受控模拟路由和真实适配器 secret-store/受控重启准备。
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
- 加密货币 ccxt 交易所适配器。
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
- Stage 1 自选缓存刷新现在有可追踪运行记录：Market 工作区“刷新自选缓存”不再只是前端逐条调用单标的刷新，而是通过 `POST /api/cache/watchlist-refreshes` 让核心按自选顺序刷新、写入完整 K 线、记录 skipped/failed 行，并在数据源健康面板显示最近 run id、已刷新/失败数量、入库行数、最近多次刷新历史和选中运行的逐标的状态明细；选中的刷新 run 会额外显示是否覆盖当前 market/symbol/timeframe，覆盖且质量完整时可直接“回到研究”，未覆盖时提示选择匹配 run 或重新刷新自选缓存；历史 run 可点击切换明细并写入 `watchlistRefreshRun` URL 参数，打开 `workspace=market&watchlistRefreshRun=...` 或刷新页面会恢复同一次运行明细，非法 run id 会回落到最近运行；明细行可直接切换到对应标的和该条刷新证据自身的 timeframe，并优先保留自选列表中的行情字段，避免从 1d 刷新证据点入后仍停留在旧周期；`GET /api/cache/watchlist-refreshes` 可回读最近批量刷新运行，前端启动和刷新设置时会恢复最近 4 条作为数据准备证据。
- Stage 1 研究 run 现在会锁定匹配的自选缓存刷新证据：当 Research 流水线从一个覆盖当前 market/symbol/timeframe 且质量就绪的 watchlist refresh run 启动时，前端会把该 run id 传给本地核心；`/api/research/run` 只在本地刷新记录中找到匹配 item 时，才把 `kind=watchlist_cache_refresh`、run id、刷新时间、状态、入库行数和数据质量写入 `researchRun.dataSnapshot.preparationEvidence`。该证据随 run detail、JSON 导出包、导入回放、Backtest、AI Review 和后续 paper-only handoff 一起流转，不创建交易委托，也不会把不匹配的刷新 run 写入审计快照。
- Stage 1 锁定的数据准备证据现在会在用户可审计表面显式展示：研究运行导出预览新增 `preparation-evidence` 检查行，AI Review 运行记录新增 `data-preparation` evidence anchor，Backtest Markdown 报告的 Data Snapshot 表会列出同一个 watchlist refresh run id、数据源完整性和入库行数，让导出报告不必打开原始 JSON 也能追溯数据准备来源。
- Stage 1 锁定的数据准备证据现在也进入 Audit / AI 证据时间线：当前审计 run 携带 `researchRun.dataSnapshot.preparationEvidence` 时，AI 评审审计面板会生成 `data-preparation-evidence` 时间线项，锚定 `preparationEvidence:<refreshRunId>`，并让证据索引可按刷新 run id 定位该证据。该项只提升审计发现性，不重新刷新数据、不创建研究 run、不触发模拟或真实交易。
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
- P0 当前任务卡现在还会显示“模拟执行预检”：`buildP0PaperExecutionPreflight` 会从 Golden Path 最新 run、当前研究 run 绑定、风控审批摘要和已入账 paper execution 派生四段 gate：审计运行、风控审批、模拟执行和实盘边界。当 Golden Path 已有 latestRunId 但当前工作区尚未绑定 run 时，预检显示“加载最新审计运行”；当风险已通过但尚无 paper execution 时，显示“提交模拟委托”；当 paper execution 已入账时，显示执行 id、委托数量和执行闸门通过数。预检主动作按钮现在会复用现有 Golden Path action：可重新绑定最新审计 run 或提交模拟委托的状态走 `submit-paper-order`，仅需复核的状态则打开 Execution 工作区。该能力只解释和触发当前 P0 paper-execution 阻断的既有动作，不新增后端状态、不自动绕过风险审批，也不改变 live-blocked 边界。
- P0 当前任务卡现在还能生成可移植的 P0 可用性 Markdown 报告：`buildP0PlatformReadinessReportMarkdown` 会把 Golden Path 完成度、当前缺口、开放 P0 缺口队列、最近审计或 paper-only 执行证据、证据深链、模拟执行预检四段 gate 和 paper-only/live-blocked 边界整理为一份可复制、下载或入账的文本报告。首页提供“复制报告”“下载报告”和“入账报告”动作；入账时前端会用同一份 Markdown 计算 SHA-256，生成 `eventType=p0_readiness_report` 审计事件，metadata 只保留 artifact kind、文件名、内容 hash、P0 完成度、当前缺口、最近证据、backlog 数量、模拟执行预检状态、主动作、gate 计数和 live-boundary 值，不保存报告全文。Audit 报告历史现在会同页回读 `audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report`，P0 报告行支持按状态、缺口 step、最近 evidence id、原始/解码 evidence link 和 hash 搜索；带有最近证据深链的 P0 报告行会显示可读证据目标、解码后的锚点 tooltip、“打开证据”和“复制证据链接”，审计 run 链接复用 Audit 包证据加载器，paper execution 链接复用模拟执行深链加载器。报告历史摘要会单独显示需签名报告数量、P0 审计辅助材料数量和最新辅助材料指向的 run，并把解码后的证据锚点作为摘要 hover 上下文；当最新辅助材料带证据链接时，摘要层也可直接打开或复制该证据目标。P0 报告行仍保留自身 unsigned/hash 证据，但不会增加待签名或签名链状态计数。P0 报告仍显示为“审计辅助材料”：不进入签名链、不允许签名/验签/撤销、不创建委托、不改变执行状态，也不授权实盘交易。

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
