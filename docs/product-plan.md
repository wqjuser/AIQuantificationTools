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
- 组合级回测已经从后端能力进入 Portfolio 工作区：`PortfolioBacktestEngine` 可以把多个已审计单标的 `BacktestRun` 按目标权重聚合为组合权益曲线、现金缓冲、组合收益/回撤/交易数、数据质量和标的贡献；本地核心新增 `POST /api/portfolio/backtest`，输入已存在的审计 run id 与权重，输出组合级证据。前端 Portfolio 工作区会从同市场、同周期、带权益曲线的审计运行历史生成静态权重组合草稿，并可直接调用核心接口展示组合指标、现金权重、权益点数量和各标的贡献；当同市场 peer 不足时，Portfolio 工作区会基于当前自选列表生成对照审计计划，并可一键补跑最少需要的 peer 审计 run，让组合回测从 blocked 进入 ready。组合回测结果现在还会生成集中度、现金缓冲、总目标敞口、期末权重再平衡漂移、风险预算贡献、协方差风险贡献、成对相关性风险、负贡献标的和聚合数据质量诊断，作为组合风控复核证据；风险预算贡献以各腿 `目标权重 * 最大回撤` 作为审计证据代理，用于发现单一腿承担过多组合回撤风险；协方差风险摘要基于各腿已对齐权益曲线的逐期收益计算 population covariance、组合波动率、单腿年化波动率、边际风险贡献和贡献占比，用于发现单一腿承担过多组合波动风险；成对相关性风险基于各腿已对齐权益曲线的逐期收益 Pearson correlation，用于发现组合腿过度同向聚集。后端和 Portfolio 页面也会展示静态目标分配流水 `allocationEvents`，记录每条组合腿的来源 run id、目标权重、名义金额和现金缓冲；同时输出 `rebalanceEvents`，基于期末权重与目标权重的偏离生成 `within_band/review/blocked` 复核行，展示当前值、目标值、偏离金额和原因；`tradeReviewEvents` 会把非现金再平衡偏离转换为 `buy/sell/hold` 的纸面交易复核意图，记录来源 run id、目标/期末权重、名义金额、`paper_review/blocked/no_action` 状态和不路由订单原因；`preTradeRiskChecks` 会对组合数据质量、交易复核状态和交易名义金额阈值生成 `passed/review/blocked` 检查账本；新增 `paperOrderEvents` 会把通过检查的 hold 意图标记为 `skipped`，把需复核的买卖意图标记为 `pending_review`，把被风控阻断的意图标记为 `rejected`，从而形成后续模拟委托的确定性审计输入。五类流水都只是后续组合执行中心的审计输入，不代表真实委托、真实成交或自动再平衡。同一组组合指标、诊断、标的贡献、协方差风险摘要、分配流水、再平衡复核流水、交易复核流水、交易前风控检查、组合纸面订单事件和证据边界也可以导出为 Portfolio Markdown 报告，并以 `eventType=portfolio_report` 写入通用审计账本，metadata 保留文件名、内容 SHA-256、市场/周期、组合名称、腿数量、权益点数量、分配事件数量、再平衡复核事件数量、交易复核事件数量、交易前风控检查数量、组合纸面订单事件数量、协方差风险贡献数量、诊断数量和数据质量边界。Audit 报告历史会同页回读 `portfolio_report`，展示组合上下文、腿数量、权益点数量和签名状态，并允许复用本地 HMAC 签名 API 对 Portfolio 报告签名、验签和撤销。当前版本只做时间戳对齐的静态权重组合聚合、组合级复核诊断、协方差风险摘要、静态分配流水、再平衡复核流水、纸面交易复核流水、交易前风控检查账本、组合纸面订单事件账本、离线报告、报告入账和报告签名链，不执行真实再平衡，不做真实组合交易成交、完整协方差风险模型、研究运行 JSON 包内 Portfolio artifact 或自动调仓。
- 组合纸面委托已经从单次回测 payload 进入本地可审计记录：本地核心新增 `PortfolioPaperOrderStore` 和 `/api/portfolio/paper-orders` POST/GET 契约，可以把 `paperOrderEvents` 按 `baseRunId`、组合名称、来源、批次 id、订单数组和状态汇总持久化到 SQLite。Portfolio 工作区新增显式“入账委托”动作，并会按当前审计 run 回读最近入账批次，展示批次 id、订单数、名义金额和状态计数。每次组合委托批次入账现在会同步写入 `eventType=portfolio_paper_order_batch` 的通用审计事件，metadata 保留 batch id、订单数、名义金额、状态计数、状态机计数、可路由数量、paper-only 和 live blocked 边界；前端 `recordPortfolioPaperOrderBatch` 会回传该 audit event 和 `portfolioPaperOrderLifecycle`，执行中心和 Portfolio 内嵌执行区会把最近批次压缩成组合订单生命周期行，显示待复核/拒绝/跳过数量、状态机摘要、审计事件 id 和名义金额。当前状态机已经能把 `pending_review/rejected/skipped` 与 `riskStatus`、人工审批输入合成为 `awaiting_operator_review`、`ready_for_simulation`、`risk_rejected`、`operator_rejected`、`risk_review`、`invalid_order` 和 `skipped`，只有风险通过且人工批准的正数量买卖委托才会标记为可进入模拟路由。人工审批账本已经落地：`PortfolioPaperOrderApprovalStore` 和 `/api/portfolio/paper-order-approvals` POST/GET 会按 `baseRunId + batchId + orderId` 记录审批人、审批时间、通过/拒绝和原因，并同步写入 `eventType=portfolio_paper_order_approval` 审计事件；前端 `recordPortfolioPaperOrderApproval` / `loadPortfolioPaperOrderApprovals` 已接入执行中心和 Portfolio 内嵌执行区，页面会按单笔委托展示待人工复核、风险复核、已拒绝和可模拟路由状态，并可把通过/拒绝操作写回审批账本后刷新生命周期摘要。首个 paper-only 模拟成交账本也已落地：`PortfolioPaperOrderSimulationStore` 和 `/api/portfolio/paper-order-simulations` POST/GET 只接受 `ready_for_simulation` 的委托，按名义金额/数量派生模拟成交价，写入 `eventType=portfolio_paper_order_simulation` 审计事件；前端会回读同批次模拟成交并在 Execution/Portfolio 审批队列中提供“模拟成交”动作和成交回执。绑定单一审计 run 的组合委托批次、人工审批和模拟成交回执已经一起进入研究运行 JSON 复现包：导出包会携带 `portfolioPaperOrderBatches`、`portfolioPaperOrderApprovals`、`portfolioPaperOrderSimulations` 及对应 `artifactCounts`，导入时校验 base run、写回目标核心的 Portfolio 批次/审批/模拟成交库，并纳入导入失败回滚和 undo 快照；Audit 包浏览器、近期复现包索引和导入预检会显示/搜索三类 artifact 的 manifest/package 数量一致性，避免跨机器迁移后只剩委托批次而丢失人工放行和模拟成交证据。组合模拟账户/持仓回放也已落地：`GET /api/portfolio/paper-order-replay` 会按 base run 重放已成交模拟回执，重建本地现金、持仓、权益、订单应用顺序、买卖净额、已实现/未实现盈亏和 warning；前端 Execution/Portfolio 会在模拟成交后刷新组合账户摘要和持仓行。组合订单状态历史也已落地：`build_portfolio_paper_order_state_history` 与 `GET /api/portfolio/paper-order-state-history` 会按 batch 派生创建、人工审批、模拟成交和实盘阻断事件序列，前端 `loadPortfolioPaperOrderStateHistory` / `buildPortfolioPaperOrderStateHistoryRows` 会把最新状态变化压缩成 Execution/Portfolio 的紧凑时间线。该能力仍是 paper-only 的组合执行准备账本，不连接真实券商、不生成真实资金成交；下一步应继续推进持久化适配器认证流水和更完整的组合风险模型。
- 真实适配器前执行状态账本已经落地为只读契约：`build_execution_adapter_state_ledger` 与 `GET /api/execution/adapter-ledger` 会从 Settings 的执行适配器状态和实盘必需闸门派生 paper/local、A 股、美股和加密路由的当前状态、状态事件、闸门计数、下一步和 live-blocked 边界；前端 `loadExecutionAdapterLedger` / `buildExecutionAdapterLedgerRows` 会把这些事件压缩到 Settings 的紧凑审计 rail。该能力不连接真实券商、不读取交易密钥、不生成真实资金成交；下一步再考虑把认证测试、secret-store 应用和受控重启结果写成持久化适配器认证流水。
- AI 评审已经开始绑定审计证据，并会把同数据快照基准收益、Alpha 和参数扫描摘要纳入证据卡、评审 dossier、回测解释动作和可导出的 Markdown AI 评审报告；同时可以导出和保存结构化 AI Review Run Record JSON，记录 citation、委员会轮次、决策日志、安全边界和 `evidenceAnchors` 证据锚点。前端 AI Review 面板已经接入 `AiReviewRunStore` 与 `/api/research/runs/{runId}/ai-reviews` 的 POST/GET 契约，可把该记录绑定到审计 run，并在 run 回放/导入后恢复最近保存的 AI 评审记录；本地核心读取接口已经支持按 run 返回 AI Review Run Record，并提供 `limit`、`offset`、`query` 和 `pagination` 元信息；Audit 工作区已经把搜索框和上一页/下一页控件接入该后端契约，按当前 run 拉取 AI Review Run Record 当前页，并使用后端 `total` 同步漂移摘要和已保存记录历史；Audit 工作区能把当前 run id、策略版本、dossier 状态、引用数量、委员会轮次、实盘边界和执行前风控审批与最近或用户选中的保存记录做轻量对照，也能汇总当前页保存记录相对当前证据的漂移项，方便在回放页确认 AI 解释是否绑定了正确数据、回测、研究笔记和风控边界；研究运行 JSON 复现包已经把已保存 AI 评审记录作为 `aiReviewRuns` artifact 导出，并保留 `run:*`、`strategy:*`、`data:*`、`citation:*`、`committee:*`、`decision-log:*`、`boundary:*` 等证据锚点，导入时会校验并写回目标核心的 `AiReviewRunStore`，让跨机器回放也能恢复 AI 委员会证据链；Audit 工作区已经把当前记录、保存记录和时间线引用合并成可搜索的导出证据索引，可按 anchor、`exportPath`、引用值或说明快速定位复现包证据；Audit 工作区也已经新增研究运行复现包预览，统一显示 `researchRun`、`dataSnapshot`、`strategyConfig`、研究笔记、回测流水、`aiReviewRuns`、模拟执行、晋级候选和执行交接的导出就绪度，方便在进入原始 JSON 前先确认缺失或阻断项；参数候选继续使用“复审候选/非投资建议”措辞，不直接给买卖建议。
- 前端研究流水线会在 run summary 缺少数据快照时自动读取完整 run detail，保证 Backtest Report 和 AI 评审能拿到同一份审计 K 线。
- 前端风险审批和本地晋级 fallback 会优先读取审计 run 内的 `strategyConfig.risk`，避免用户编辑当前草稿后污染已审计运行的仓位和回撤审批。
- 执行中心的模拟委托预览和 projected paper position 会用审计 run 的仓位上限和初始资金计算名义金额，和后端真实 paper execution 的下单数量保持一致。
- Paper Trading 已经开始绑定审计运行；提交模拟委托前会校验审计 run 内的结构化策略风控字段，缺少仓位、止损、止盈或最大回撤时不会生成默认委托。晋级队列也复用同一风险交接校验，即使存在历史模拟成交，缺失风控的审计 run 仍会保持 promotion blocked。
- Paper Trading 执行交接已经把审计数据质量纳入硬闸门；`dataQuality.isComplete=false`、`demo-fallback` 或缺失数据质量的审计 run 不能提交模拟委托，也不能进入可晋级状态。
- 前端 Risk Approval 已经显示同一条数据质量 gate；模拟委托预览和晋级队列会在提交前阻断 `demo-fallback`、`unknown`、缺失或不完整的审计数据源，避免用户把后端拒单误读成可执行机会。
- Settings 工作区已经开始读取本地核心 `/api/settings/status`，展示 A 股、美股、加密货币数据源状态、可选 API Key 是否本地配置、SQLite 行情缓存路径、缓存行数、市场/标的/周期上下文数量、最新 K 线时间、最近缓存上下文清单、每个缓存上下文的 freshness、缓存 freshness 汇总和执行适配器安全闸门；缓存上下文可通过 `/api/cache/refresh` 手动刷新并回写最新状态。设置接口只返回配置状态，不返回密钥值。
- P0 黄金路径状态已经有本地核心契约 `/api/golden-path/status`：按当前市场、标的和周期汇总行情缓存、审计研究 run、回测证据、AI 评审、模拟执行和实盘闸门，返回当前卡点、下一步动作、每一步状态、紧凑进度摘要、可复用 runbook 明细和每个产品工作区的 `ready` / `needs_run` / `blocked` 状态；前端当前任务卡已接入该状态，会优先执行刷新行情、运行流水线、提交模拟委托或跳转设置闸门等下一步动作，并显示可点击的黄金路径进度和当前/后续步骤清单，可直接跳转到相关工作区；左侧工作区按钮和当前任务卡都会优先显示黄金路径返回的工作区状态、关联步骤和阻断原因，当前任务卡内的工作区动作可直接复用同一套 Golden Path 动作路由；Audit 工作区已经接入完整黄金路径审计清单，逐步展示状态、阻断说明、工作区跳转和可执行动作，且清单动作复用同一套禁用闸门，不能绕过运行中、刷新中或缺失审计 run 的限制。runbook 明细为后续任务队列、审计页和工作区内步骤清单提供统一语义，避免页面各自拼接阻断原因。
- 行情中心的数据源健康面板已经接入当前标的/周期的缓存上下文，可直接刷新当前 K 线缓存，并在刷新后回写 Settings 状态和重新加载图表。
- 行情中心已经开始承担 watchlist 数据准备职责：当前周期下会显示自选缓存 fresh/stale/empty 摘要，并可一键按顺序刷新自选列表缓存。
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
- 保存自选列表和研究工作区。

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
- 组合回测；已完成从已审计 run 生成静态权重组合草稿、缺 peer 时一键补跑对照审计、调用组合回测 API、展示组合结果、协方差风险摘要、静态目标分配流水、期末再平衡复核流水、纸面交易复核流水、交易前风控检查账本、组合纸面订单事件账本、组合纸面委托批次入账/查询、组合委托批次通用审计事件、组合委托人工审批 API/账本、组合委托模拟成交 API/账本、组合模拟账户/持仓回放、组合订单状态历史、真实适配器前执行状态账本、执行中心组合订单生命周期行、单笔审批 UI、模拟成交按钮和成交回执、导出报告、入账签名，以及组合集中度/现金/总敞口/再平衡漂移/风险贡献/协方差风险/相关性/负贡献/数据质量复核，下一步推进真实组合成交、持久化适配器认证流水和更完整的组合风险模型。
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

- Stage 1 研究上下文就绪清单已从静态状态升级为可操作清单：K 线或本地缓存未就绪时可以直接刷新当前标的/周期缓存，研究笔记未保存时可以直接保存当前草稿，减少用户在研究工作台内来回寻找入口。
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
- Audit 签名 Key 注册表面板现在会回读最近 5 条 `audit_signing_key_rotation_plan` 和最近 5 条 `audit_signing_key_rotation_apply` 账本事件，把轮换计划 prepared/blocked、应用预检 blocked/ready_for_restart、拟启用 key、legacy 模板短 hash 或 apply 模式、阻断原因、环境变量数量、人工步骤数量和确认项数量显示为同一个紧凑历史视图；生成计划或提交应用预检入账成功后会立即合并到历史列表，形成“生成计划 -> 应用预检 -> 写入账本 -> 可追溯查看”的闭环。
- Audit 签名 Key 注册表面板继续补了“应用预检”阶段：用户必须显式确认新 secret 已在本地安全保存、当前 secret 已写入 legacy 注册表、操作员已复核 key/指纹/重启影响，前端才会调用 `/api/audit/signing-keys/rotation-apply`。后端只做只读安全预检，缺确认时返回 blocked，确认齐全时返回 ready_for_restart；结果会被压缩成 `audit_signing_key_rotation_apply` 事件写入审计账本，历史视图可按阻断原因、确认项 id、apply mode 和拟启用 key 搜索，仍不在 UI 或 API 中传输 raw secret，也不自动写环境变量或重启容器。下一步是把这个 preflight 接到真正的本地 secret-store 写入和受控重启编排。

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
