# AIQuant Terminal

本上下文描述本地优先量化研究、模拟执行与受控交易路由中的核心产品概念。

## Language

**Stage 8 产品阶段状态收口**：
前端唯一产品阶段模型对 Stage 0 至 Stage 8 已退出事实的同步：全部阶段为 maintenance、Execution 归属 Stage 8、当前阶段集合为空。它只影响导航中的交付状态说明，不改变 Stage 6/7/8 执行能力或审计证据。
_Avoid_: Stage 9、动态阶段配置、生产订单授权

**生产只读连续性**：
Stage 8 从最新 Stage 7 probe、Stage 6 exit、production route review 和本地访问控制派生的当前运维状态，区分 `current`、`stale`、`blocked`、`revoked` 与 `missing`。它只引用脱敏证据，不重新访问交易所。
_Avoid_: 后台账户同步、生产订单监控、自动探针

**生产只读访问控制**：
Stage 8 保存在当前 API 数据卷中的人工 `revoke / restore` 事件。revoke 在生产网络访问前阻断 Stage 7；restore 必须绑定当前 production route review。它不自动撤销交易所 Key，也不赋予生产委托权。
_Avoid_: 生产 kill switch、交易所 Key 管理、实盘授权

**Stage 8 真实恢复退出验收**：
在已有 current Stage 7 生产只读证据、当前 route review 和专用只读凭据的数据卷中，复用 Stage 8 revoke/restore 与 Stage 7 probe 完成一次真实恢复演练。验收必须证明 revoke 在网络前阻断、restore 链接本次 revoke、新 probe 权限安全、continuity 恢复 current 且 API 重启后 probe/control hash 一致；它仍不授权生产订单或资金操作。
_Avoid_: Key 自动轮换、生产订单恢复、live route 验收

**生产只读准入**：
Stage 7 对 Binance Spot 生产环境执行的只读连接验收，只允许检查市场元数据、API Key 权限和脱敏账户摘要。它不创建、查询或撤销生产委托，也不构成实盘授权。
_Avoid_: 实盘接入、生产委托路由、生产交易

**生产只读凭据**：
API 服务中仅用于 Stage 7 的独立 Binance Spot 生产环境凭据，其交易、提现和内部转账权限必须关闭。它不能复用 Sandbox 或通用 CCXT 凭据。
_Avoid_: 实盘交易凭据、Sandbox 凭据、通用 CCXT Key

**脱敏生产账户摘要**：
Stage 7 从生产账户读取后形成的最小审计投影，只包含账户类型、权限布尔值、非零资产数量和时间信息，不包含资产名称、余额、订单、成交或原始交易所响应。
_Avoid_: 账户持仓、资产明细、余额快照

**Stage 7 退出验收**：
由默认无凭据 fail-closed 清单和一次真实 Binance Spot 生产只读清单共同组成。真实清单必须证明全部 mutation 权限关闭、账户摘要脱敏、API 重启回读 hash 一致，并继续固定所有 live/order 边界为关闭。2026-07-13 已完成该验收并转入 maintenance；该结论不授权生产订单或真实资金路由。
_Avoid_: 实盘授权、生产下单验收、账户资产快照

**Sandbox 委托路由**：
只连接交易所测试网、只使用无真实价值测试资产的委托通道。它可以提交、查询、撤销和对账测试网委托，但不构成实盘授权。
_Avoid_: 实盘路由、模拟成交、Paper Trading

**Sandbox 交易场所**：
Stage 6 唯一允许连接的交易场所，固定为通过 CCXT 接入的 Binance Spot Testnet。它不包含 Futures、杠杆、保证金或其它交易所。
_Avoid_: Binance Futures Testnet、生产环境、通用多交易所路由

**Sandbox GTC 限价委托**：
Stage 6 首版唯一允许提交的测试网委托类型，必须同时包含买卖方向、交易对、数量和限价，并固定使用 GTC。市价单、IOC、FOK 和其它订单类型不在首版范围内。
_Avoid_: 市价委托、实盘委托、模拟成交

**Sandbox 委托候选**：
从同一条 Stage 4 canonical workflow、Stage 5 reconciled shadow session、readiness、preflight 和 approved authorization review 权威证据链派生的测试网委托意图。只有候选可以进入 Stage 6 提交流程，不能通过 UI 或 API 任意手填委托绕过证据链。
_Avoid_: 手工委托、临时订单、独立 Sandbox 订单入口

**Sandbox 批次授权**：
操作者对一个 Sandbox 委托候选批次作出的一次性提交授权，精确绑定 `workflowHash`、`batchId` 和全部订单内容 hash。首次提交必须在授权后 10 分钟内开始；同一内容的幂等恢复不受过期影响，批次或订单内容变化后必须重新授权。
_Avoid_: 长期授权、全局授权、逐单授权

**Sandbox 未知提交状态**：
委托请求超时或断线后，系统无法确认交易所是否已接收委托的状态。系统必须先使用原 `clientOrderId` 查询；确认不存在时最多以同一 ID 重试一次，仍无法确认则进入 `reconciliation_required` 并停止批次。
_Avoid_: 提交失败、新 ID 补单、无限重试

**Sandbox 批次补偿**：
批次按 canonical 顺序逐单提交，任一委托被拒绝、状态未知或对账失败时立即停止后续提交，并尽力撤销已经提交但尚未成交的委托。已成交事实只能通过对账记录，不能伪造事务回滚。
_Avoid_: 原子批次、成交回滚、失败后继续提交

**Sandbox Kill Switch**：
Stage 6 唯一 Sandbox 账户的持久化急停开关。触发后阻止新批次、停止当前批次后续提交，并尽力撤销本系统创建的全部未成交委托；状态跨重启保持，完成对账后只能由人工重置。
_Avoid_: 页面临时状态、自动重置、多级急停系统

**Sandbox 规范化委托**：
使用 CCXT 市场元数据规范化数量和价格，并通过交易对、精度、最小数量/金额、Sandbox 可用余额及 Stage 4 `maxBatchNotional` 校验后的精确委托内容。批次授权绑定该内容；校验失败时不得自动缩量、改价或拆单。
_Avoid_: 原始未校验委托、提交时隐式改价、自动缩量

**Sandbox 订单状态**：
本地持久化的最小测试网订单生命周期：`authorized`、`submission_pending`、`open`、`partially_filled`、`filled`、`canceled`、`expired`、`rejected` 或 `reconciliation_required`。外部调用前必须先记录 pending 状态，交易所原始状态与成交数量作为证据保留。
_Avoid_: Shadow 状态、CCXT 原始状态副本、仅存在于页面的状态

**Sandbox 对账**：
使用同一权威函数在 API 启动恢复、提交或撤单完成、人工刷新以及 kill switch 触发时查询交易所并更新非终态订单。Stage 6 不运行常驻轮询器，所有对账结果写入审计账本。
_Avoid_: 浏览器临时刷新、后台轮询服务、另一套恢复任务

**Stage 6 退出验收**：
由无密钥确定性 CI 证据和一次真实 Binance Spot Testnet 提交、查询、撤单、对账的脱敏 manifest 共同组成。测试替身只验证故障与恢复逻辑，不是产品适配器；缺少真实 Testnet manifest 时 Stage 6 不能退出。
2026-07-13 已以 BTC/USDT、ETH/USDT 两笔终态 `canceled` 委托完成该验收，Stage 6 转入 maintenance；该结论不授权生产或真实资金路由。
_Avoid_: 仅单元测试通过、伪造交易所成功、含密钥的验收包

**Sandbox 写路由凭据**：
Stage 6 API 服务唯一允许用于测试网写操作的 `CCXT_SANDBOX_API_KEY` 与 `CCXT_SANDBOX_SECRET`。不得回退到通用或生产风格的 CCXT 变量，密钥不得进入 Web、日志、审计、导出包、镜像或 manifest。
_Avoid_: CCXT_API_KEY、CCXT_BINANCE_API_KEY、浏览器密钥配置

**Detached Sandbox 审计副本**：
从研究包导入的 Stage 6 订单与批次证据，只能用于校验和回读，不能提交、撤单、重试、对账或连接交易所。执行恢复权只来自同一 API 数据卷中的本地权威账本。
_Avoid_: 可执行导入、跨环境恢复、导入后继续路由

**Stage 6 执行黄金路径**：
Execution 工作区中的唯一测试网执行流程：检查规范化批次、一次性人工授权、提交、对账或撤单。Portfolio 只生成候选并跳转，Settings 只显示配置状态，Audit 只读回放证据。
_Avoid_: 多工作区提交入口、Settings 下单、Audit 重试

**活动 Sandbox 批次**：
唯一 Sandbox 账户中尚有 `submission_pending`、`open`、`partially_filled` 或 `reconciliation_required` 订单的批次。任一活动批次存在时不得启动新批次，完成终态对账后才释放账户。
_Avoid_: 并发批次、余额预留池、多账户调度

**实盘委托路由**：
连接真实资金账户并可能产生真实成交的委托通道。它不属于 Stage 6。
_Avoid_: Sandbox 委托路由、Shadow Execution

**Shadow Execution**：
把权威组合意图投影到隔离的本地适配器，不连接交易所也不提交委托。
_Avoid_: Sandbox 委托路由、Paper Trading
