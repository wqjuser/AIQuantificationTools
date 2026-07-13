# Stage 6 Binance Spot Testnet 执行设计

## 状态

已实施并于 2026-07-13 通过退出验收转入 maintenance；本文保留为历史设计依据。

## 目标

一次性完成 Stage 6：在继续禁止真实资金与实盘路由的前提下，把 Stage 5 已验证的组合、风险、Shadow、准入、探针和人工复核证据接到 Binance Spot Testnet，交付可提交、查询、撤销、对账、恢复和审计的单一 Sandbox 执行黄金路径。

Stage 6 是真实测试网协议验证，不是 Paper Trading，也不是实盘授权。它只使用无真实价值测试资产，始终保持 `liveTradingAllowed=false`、`liveOrderSubmissionAllowed=false`、`liveOrderSubmitted=false`、`liveRouteExecuted=false` 与 `liveBlockedBoundary=true`。

## 当前事实与缺口

现有实现已经提供：

- Stage 4 canonical portfolio workflow、批次顺序、确定性风险、人工审批和 `maxBatchNotional`。
- Stage 5 稳定 `clientOrderId`、Shadow 状态与故障演练、一次重试、kill switch、对账、重启恢复和便携审计。
- Sandbox readiness、CCXT 只读探针、authorization preflight 与不可变 approved/rejected review。
- `AuditEventStore`、canonical JSON/SHA-256、研究包原子导入导出、Execution/Audit 回读和 Docker acceptance 模式。
- Docker 镜像已经安装 CCXT，现有探针计划已经声明 `CCXT_SANDBOX_API_KEY` 与 `CCXT_SANDBOX_SECRET`。

缺口只有测试网写副作用：当前没有可提交订单的 CCXT 路由、提交前精确授权、真实订单状态恢复、撤单补偿、活动批次互斥或真实 Testnet 退出证据。

## 产品边界

### 唯一交易场所

Stage 6 只允许通过 CCXT 接入 Binance Spot Testnet。创建 exchange 后的第一个调用必须是 `set_sandbox_mode(True)`；只允许 Spot，不支持 Futures、杠杆、保证金、第二交易所或生产 endpoint。

### 唯一订单类型

首版只允许买卖双向的 GTC 限价单。订单必须包含交易对、方向、数量和价格；市价单、IOC、FOK、止损、条件单、拆单和自动改价均阻断。

### 权威输入链

Sandbox 委托候选必须来自同一条：

`Stage 4 canonical workflow → Stage 5 reconciled shadow session → readiness → preflight → approved authorization review`

服务端每次授权、提交和回读都重新验证身份、hash、时间、市场、adapter 与安全边界。UI/API 不提供任意手填订单入口。

## 提交前规范化与授权

### 规范化

复用 Stage 4 `maxBatchNotional`，再使用 CCXT markets、余额与精度工具校验：

- 交易所固定为 Binance sandbox，市场固定为 Spot。
- 交易对存在且 active。
- 数量、价格、最小数量、最小金额、精度与可用余额有效。
- 订单仍满足原 Stage 4 批次限额。

先生成规范化后的精确订单，再计算订单内容 hash。任何失败都阻断整个批次，不自动缩量、改价、拆单或静默修正已授权内容。

### 一次性批次授权

人工授权精确绑定 `workflowHash + batchId + 全部规范化订单内容 hash`，首次提交必须在授权后 10 分钟内开始。订单内容或批次变化必须重新授权；首次提交已开始后，使用原 `clientOrderId` 的查询、撤单、对账和幂等恢复不受授权过期影响。

同一 Sandbox 账户同时只允许一个活动批次。存在 `submission_pending`、`open`、`partially_filled` 或 `reconciliation_required` 订单时，新批次必须阻断。

## 最小执行模型

### CCXT 调用边界

不新增通用 broker framework。新增一个 Binance Spot Testnet 执行模块，直接复用 CCXT 已安装依赖和 Stage 5 订单身份，暴露本阶段实际需要的少量操作：加载市场/余额、规范化、创建 GTC 限价单、按 `clientOrderId` 查询、撤单和列出本系统未终态订单。

测试通过注入 CCXT module/exchange 替身完成，不把 fake 注册成产品 adapter。

### 订单状态

本地最小状态机为：

`authorized → submission_pending → open / partially_filled → filled / canceled / expired`

异常只进入 `rejected` 或 `reconciliation_required`。每次外部写调用前先把意图落入本地权威账本；交易所响应后追加结果。保留交易所 order id、原始状态摘要、累计成交数量、均价、费用摘要和时间，但不复制 CCXT 原始 payload 或状态机。

### 幂等与未知结果

继续使用 Stage 5 的 `workflowHash + orderId` 稳定 `clientOrderId`。提交超时或断线时：

1. 先按原 `clientOrderId` 查询。
2. 已存在则接管，不重复提交。
3. 明确不存在时最多以同一 ID 重试一次。
4. 仍无法确认则标记 `reconciliation_required` 并停止批次。

禁止新 ID 补单、无限重试或把未知状态解释成失败。

### 批次失败补偿

按 canonical 顺序逐单提交。任一订单被拒绝、状态未知或对账失败时立即停止后续订单，对已提交但尚未成交的订单执行尽力撤单，然后统一对账。已成交部分按交易所事实记录，不伪造事务回滚。

## 持久化、恢复与对账

继续使用 `AuditEventStore` 保存授权、订单转换、对账和 kill switch 事件，通过同一个 canonical aggregate builder 重建批次，不增加第二个订单数据库或可变状态缓存。

对账只在以下时点运行：

- API 启动恢复。
- 提交或撤单后。
- 操作者显式刷新/对账。
- kill switch 触发。

首版不增加常驻轮询器。非终态订单在下一次权威对账时更新；所有结果追加到审计账本。

## Kill Switch

只保留一个 Sandbox 账户级开关，正常状态为 `enabled=true, triggered=false`。触发状态必须先持久化，再阻止新批次、停止当前批次后续提交，并尽力撤销本系统创建的全部未成交 Sandbox 委托。状态跨重启保持，完成对账后只能人工重置。

## API 与界面

API 使用现有标准库 HTTP handler 与 AuditEventStore，提供最小的候选/授权、提交、查询、撤单、对账和 kill switch 动作。所有 mutation 使用服务端权威输入和幂等键；客户端不能提交完整订单 payload 绕过重建。

Execution 工作区提供唯一黄金路径：

`检查规范化批次 → 一次性人工授权 → 提交 → 对账/撤单`

Portfolio 只生成候选并跳转；Settings 只显示专用凭据是否配置、只读探针与 sandbox endpoint；Audit 只读展示转换和 hash。kill switch 是 Execution 中唯一独立的紧急动作。刷新后全部从服务端账本恢复。

## 凭据与环境隔离

写路由只读取 API 服务环境中的 `CCXT_SANDBOX_API_KEY` 和 `CCXT_SANDBOX_SECRET`，禁止回退到任何通用或生产风格变量。缺少任一变量、exchange 不是 Binance、default type 不是 Spot、sandbox mode 未先启用或探针证据不匹配时全部 fail closed。

密钥不得进入 Web bundle、请求/响应、日志、异常文本、审计事件、研究包、Dockerfile、镜像或 acceptance manifest。Stage 5 Sandbox 只读探针优先复用这组专用变量，并保留旧变量兼容；兼容变量不能激活 Stage 6 写路由。

## 审计与便携证据

研究包继续复用 `auditEvents[]` 和 `artifactCounts`，携带脱敏的 Stage 6 授权、批次、订单转换、对账与 kill switch 证据。validator 按依赖顺序重建 Stage 4/5/6 hash、身份、状态转换和安全字段，任何不一致在原子写入前阻断。

导入后的 Stage 6 证据必须标记为只读 `detached`，只能校验与展示，不能提交、撤单、重试、对账或连接交易所。实际执行恢复只来自同一 API 数据卷中的本地权威账本。

## 安全字段语义

旧 Stage 4/5 上游 artifact 继续保持原有 `paperOnly=true` 与 `orderSubmissionEnabled=false`。Stage 6 artifact 必须显式区分 sandbox 与 live：

- `sandboxOnly=true`
- `sandboxOrderSubmissionAllowed=true` 仅表示已授权 Stage 6 路径
- `sandboxOrderSubmitted` 与 `sandboxRouteExecuted` 按真实 Testnet 事实记录
- `liveTradingAllowed=false`
- `liveOrderSubmissionAllowed=false`
- `liveOrderSubmitted=false`
- `liveRouteExecuted=false`
- `liveBlockedBoundary=true`

不得用含糊的 `live` route 名称描述测试网写操作，也不得把真实 Testnet 委托标成 paper fill。

## 验收设计

### 无密钥 CI

注入 CCXT 测试替身，确定性覆盖：

- 规范化与授权 hash。
- GTC 限价约束和 Stage 4 限额。
- 正常提交、查询、撤单与精确对账。
- 超时后查询命中、同 ID 单次重试和持续未知。
- 订单拒绝、部分批次、撤单失败和对账不一致。
- 单活动批次、授权过期、kill switch、重启恢复。
- 密钥脱敏、研究包重建、detached 导入和篡改拒绝。

CI 还运行无密钥 Docker smoke，证明写路由 fail closed，不能伪造 Testnet 成功。

### 真实 Testnet 退出验收

显式注入专用 Sandbox 密钥，运行独立 Docker smoke：从完整 Stage 4/5 权威链生成小额规范化 GTC 限价批次，完成人工授权、真实提交、查询、撤单尝试、最终对账、API 重启恢复、导出/导入只读回读，并输出完全脱敏的 `data/stage6-binance-spot-testnet.json`。

真实市场可能在撤单前成交，因此验收以交易所最终事实自洽为准，但必须证明提交、查询、撤单动作和最终对账均被执行并审计。没有真实 Testnet manifest 时 Stage 6 不得退出。

顶层 `aiqt.stage6ExitAcceptance` 同时绑定无密钥安全门禁、真实 Testnet manifest、Stage 5 exit acceptance 和完整安全字段；API、Execution 和 CI 从同一清单回读。

## 完成定义

- Stage 6 设计中的提交、查询、撤单、对账、恢复、急停和审计全部实现。
- Stage 0 至 Stage 5 保持 maintenance，Stage 6 在实施开始时标为 current，通过顶层退出验收后转为 maintenance。
- Python/Web 全量测试、生产构建、Stage 3/4/5 回归门禁、Stage 6 无密钥 Docker 门禁和真实 Testnet smoke 全部通过。
- 浏览器覆盖成功、阻断、刷新恢复、kill switch、Audit hash 回读和 375px 布局。
- README、产品规划、架构和中文 Sandbox 运维手册同步。
- 独立 Standards/Spec 审查无未解决的重要问题，完整变更提交、推送并通过 CI。

## 不做

- 不连接 Binance 生产环境或任何真实资金账户。
- 不开启 live trading，不实现生产密钥、真实委托或 live route。
- 不支持 Futures、杠杆、保证金、多交易所、多账户或多活动批次。
- 不支持市价、IOC、FOK、止损、条件单、自动拆单或自动调价。
- 不增加常驻轮询器、通用 broker adapter framework、消息队列、余额预留系统或第二套风险算法。
