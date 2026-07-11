# Stage 5 Shadow Safety Drills 第三阶段设计

## 状态

已确认，实施与验收完成。

## 目标

把现有 Stage 5 shadow execution 从“正常投影与一次超时恢复可用”推进到“所有既有故障分支均经过真实 HTTP、持久化、重启、导出导入和离线复核”的安全演练闭环。

本阶段仍只使用 `local-fake-shadow`。不连接 broker/testnet，不读取交易 secret，不同步资金账户，不提交或撤销订单，不开放 live route。

## 当前事实与缺口

当前代码已经具备：

- `none`、`timeout_once`、`adapter_rejected`、`reconciliation_mismatch`、`kill_switch` 五种确定性模式。
- 稳定 `clientOrderId`、两次 attempt 上限、Stage 4 名义金额限制、kill switch 字段和 reconciliation。
- `POST/GET /api/execution/shadow-sessions`、`AuditEventStore` 恢复、研究包导出导入、Audit 回读。
- Docker acceptance 对正常 session、超时恢复、幂等回读和便携 hash 完成验收。

剩余缺口：

- Docker 尚未经过 `adapter_rejected`、`reconciliation_mismatch` 和 `kill_switch` 三条阻断路径。
- 阻断 session 尚未在容器重启后进行完整 GET 重建与 hash 对比。
- 当前 acceptance manifest 不能证明每条 fail-closed 分支都拒绝重试补造成功。
- Execution 只展示 session 状态和委托迁移，操作员不能直接看到 failure mode、限额、kill switch 和 reconciliation 原因。

## 核心决策

### 1. 复用现有 builder、API 和账本

不新增 safety-drill API、订单 store、adapter interface、后台 worker或消息队列。演练由现有 Stage 5 Docker smoke 编排，权威证据仍是 `stage4_portfolio_workflow` 与 `stage5_shadow_execution_session`。

### 2. 每种故障使用独立 workflow

当前 `sessionKey` 绑定 workflow hash，API 会拒绝同一 workflow 改换 `failureMode`。这是正确的不可变执行意图边界，不应为了测试而放宽。

Docker 为以下场景分别创建独立 Stage 4 workflow：

1. `none`：一次完成并幂等回读。
2. `timeout_once`：attempt 1 可恢复失败，attempt 2 完成，第三次回读 attempt 2。
3. `adapter_rejected`：一次阻断，再次请求必须回读同一 blocked session。
4. `reconciliation_mismatch`：一次阻断，再次请求必须回读同一 blocked session。
5. `kill_switch`：一次阻断，`triggered=true`，全部委托为 blocked；再次请求必须回读同一 session。

这样既覆盖故障，也不改变产品幂等合同。

### 3. 不新增独立 Stage 5 限额策略

Stage 4 已在权威 workflow 中校验批次和单标的名义金额，Stage 5 当前只继承 `maxBatchNotional`；`maxOrders` 等于权威委托数量。没有账户或 broker sandbox 需求前，不再造一套动态限额配置。

本阶段验证限额继承和不可篡改，不伪造一个产品中不可到达的 limit breach。等出现独立账户日限额、频率限制或 broker sandbox 约束时，再单独设计 Stage 5 policy。

### 4. 故障注入仍不进入产品主动作

Execution 页面继续只发送 `failureMode=none`，或对已经持久化的 `timeout_once` attempt 使用原 mode 重试。`adapter_rejected`、`reconciliation_mismatch`、`kill_switch` 仅由测试和 Docker 使用，不增加调试下拉框或普通用户按钮。

## Acceptance manifest

沿用 `aiqt.stage5ShadowExecutionAcceptance`，在现有字段上增加两个严格区块。每条演练保留完整 workflow/session 快照，避免只记录摘要后无法由离线 validator 权威重建：

```text
failureDrills[]
  failureMode
  workflow
  firstSession
  retrySession
  retryCreated

restartReadback
  expectedSessionCount
  actualSessionCount
  expectedSessionHashes[]
  actualSessionHashes[]
```

Validator 必须按固定场景集合精确校验，不接受额外 mode、缺失场景、重复 workflow、重复 session 或任意 live/order 安全字段变化。

`status`、委托状态、reconciliation 原因、kill switch、session hash 和 clientOrderId 均从完整 session 快照重建并派生校验，不另存一份可能漂移的摘要合同。

预期总证据：5 个独立 workflow，6 个 session（正常 1、超时 2、三个 blocked 各 1）。

## 重启与便携恢复

Docker 演练顺序：

```text
创建 5 个 Stage 4 workflows
  -> 运行 5 组 Stage 5 场景
  -> 对 completed/blocked session 重复 POST，证明不新增事件
  -> 重启 API 容器并等待健康
  -> GET 回读 6 个 session，逐一重建并比对 hash
  -> 导出研究包
  -> 原子导入
  -> 再导出与 GET 回读
  -> 写入 acceptance manifest
  -> 离线 validator 复核
```

重启后任何 malformed event、缺失 Stage 4 workflow、身份/时间/hash 不匹配都必须使回读失败，不能跳过坏记录后继续报告通过。

## Web 与 Audit

只扩展现有 `ExecutionStage5ShadowSection`：

- 显示 `failureMode`、`maxOrders`、`maxGrossNotional`、timeout/maxAttempts。
- 显示 kill switch enabled/triggered。
- 显示 reconciliation 状态和原因。
- blocked session 保持只读，不提供“继续”“忽略”或“补造成功”动作。

Audit 继续复用 `stage5ShadowSessions` 专属行，只补充 failure mode、blocked/recovered 数量和 session hash 摘要；不新增第二份 drill payload。

## 验收标准

- 三种阻断模式经真实 POST 写入 AuditEventStore，并在重复 POST 时回读同一 hash。
- 超时仍只有一次重试，clientOrderId 在两次 attempt 间完全一致。
- API 容器重启后精确恢复 6 个 session。
- 导出、导入、再导出和 GET 的 session hash 集合完全一致。
- acceptance validator 对缺场景、重复 workflow、错误状态、错误 reconciliation、错误 kill switch、错误计数和任意安全边界篡改 fail closed。
- Execution 和 Audit 能解释阻断原因，375px 无横向溢出。
- Stage 3 维护门禁与 Stage 5 smoke/validate 通过。

## 不做

- 不定义多 broker adapter interface。
- 不连接 ccxt sandbox/testnet；既有只读健康检查保持维护状态。
- 不增加真实账户、余额、持仓或订单同步。
- 不增加自动重试循环、定时任务、队列或并发执行。
- 不实现独立动态限额、频率限制或跨账户风控。
- 不改变六项不可变安全边界。
