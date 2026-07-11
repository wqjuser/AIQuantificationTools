# Stage 5 Shadow 退出与 Sandbox 准入第四阶段设计

## 状态

已确认并完成实施。

## 目标

在不连接 broker/testnet、不读取交易 secret、不同步账户、不提交或撤销订单的前提下，把已经完成的 Stage 5 shadow execution 与仓库现有执行适配器证据链绑定，形成一个服务端权威、可恢复、可导出导入、可离线复核的 Sandbox 准入决策。

本阶段的“准入”只表示 shadow 阶段具备进入后续、单独人工授权的 sandbox adapter 阶段的证据条件，不表示已经允许 sandbox 下单，更不表示允许真实交易。

## 当前事实与缺口

当前代码已经具备：

- 权威 Stage 4 portfolio workflow，以及服务端重建和 hash 校验。
- `local-fake-shadow` 的稳定 `clientOrderId`、状态机、限额、kill switch、一次超时重试和 reconciliation。
- 五种 shadow mode 的 HTTP、持久化、API 重启、导出导入和离线故障演练。
- 现有执行适配器认证、sandbox probe、sandbox order schema dry-run、paper lifecycle、runbook、ops state 和 `execution_adapter_paper_execution` 审计证据链。
- 研究包已经能够携带被组合模拟成交引用的脱敏 adapter paper execution 证据。

当前缺口是两条证据仍然各自成立：Stage 5 session 只绑定 Stage 4 workflow，现有 adapter chain 只证明 paper-only 的适配器准备过程。系统尚未形成一个权威结论，证明某个已完成的 shadow session 与同市场、同执行意图的 terminal adapter paper evidence 同时有效且安全边界一致。

## 核心决策

### 1. 只新增准入决策，不新增第二条 adapter 链

准入决策复用以下权威输入：

1. `validate_stage4_portfolio_workflow_snapshot` 重验后的 Stage 4 workflow。
2. `validate_stage5_shadow_session` 重验后的最新 Stage 5 session。
3. Stage 4 simulations 已引用的 `adapterPaperExecutionId`、`adapterManifestValidationId` 和脱敏 terminal evidence。
4. 现有 `execution_adapter_paper_execution` 审计事件及其 rehydration/validator。
5. 现有 `AuditEventStore`、研究包导出导入和 Audit artifact readback。

不复制 certification、secret、probe、runbook 或 paper lifecycle 的完整模型。准入决策只保存必要身份引用和最终安全结论；上游细节继续由现有 adapter chain 负责。

### 2. 服务端只记录通过的决策

新增同一路径的 POST/GET API。POST 必须从服务端 stores 重新读取并重验所有输入；调用方只提交 `baseRunId`、`workflowHash`、`sessionHash`、`operator` 和一次明确确认，不允许提交 adapter evidence 或自定义检查结果。服务端从 workflow simulations 派生有序 terminal evidence id 集合。

如果任一输入缺失、blocked、过期、身份不匹配或安全字段不一致，POST 返回结构化 blocker，且不写审计事件。只有全部条件满足时，才记录状态为 `ready_for_manually_authorized_sandbox_phase` 的不可变决策。

相同 `sessionHash + 有序 adapterPaperExecutionIds` 的重复 POST 必须回读同一 decision，不新增事件。GET 回读时重新验证身份、时间、hash 和安全边界，不能信任历史 payload。

### 3. 准入条件必须同时成立

通过条件固定为：

- Stage 4 workflow 仍可由现有 validator 权威重建。
- Stage 5 session 精确绑定该 workflow，状态为 `reconciled`，且只能是正常完成或 `timeout_once` 的第二次恢复结果。
- Stage 5 session 的全部 `clientOrderId` 仍能从 `workflowHash + orderId` 重建。
- Stage 4 每个 simulation 都具有 terminal adapter paper evidence，且所有订单使用同一 `adapterId`、同一 market。
- adapter market 与 Stage 4 portfolio market 一致。
- 对应 `execution_adapter_paper_execution` 审计事件存在，rehydration 后状态为 `paper_execution_recorded`，其 id、manifest validation id、adapter、market 与 simulation 引用一致，`orderIntent.symbol/side/quantity` 与 simulation 完全相同。
- adapter evidence 固定 `route=paper`、`paperOnly=true`、`paperFillRecorded=true`、`orderSubmitted=false`、`liveOrderSubmitted=false`、`routeExecuted=false`、`liveTradingAllowed=false`。
- 操作员明确确认本决策只允许进入后续 sandbox 人工授权阶段，不允许当前提交订单。

任一订单引用不同 adapter、找不到 terminal event、只存在内联伪造 evidence、session 为 blocked/recoverable failure，或者重新计算 hash 后仍出现自洽篡改，均 fail closed。

### 4. 决策合同保持最小

权威 artifact 固定包含：

```text
kind = aiqt.stage5SandboxReadinessDecision
schemaVersion = 1
decisionId / decisionHash / generatedAt
baseRunId / workflowId / workflowHash
shadowSessionId / shadowSessionHash
adapterId / market
adapterPaperExecutionIds[] / adapterManifestValidationIds[] / adapterAuditEventIds[]
operator
status = ready_for_manually_authorized_sandbox_phase
paperOnly = true
shadowOnly = true
sandboxOrderSubmissionAllowed = false
liveTradingAllowed = false
orderSubmissionEnabled = false
routeExecuted = false
liveBlockedBoundary = true
```

不保存另一份 checks 列表、订单副本、适配器链副本或 workflow/session 副本。validator 通过引用的权威 artifact 重建结论，避免同一事实出现两份可漂移数据。

### 5. 不提前提取 broker adapter interface

本阶段仍只有 `local-fake-shadow` 一个运行实现。正式 adapter interface 只有在下一阶段确定第二个 sandbox adapter 及其真实约束后再提取；本阶段不创建 interface、factory、registry 或配置层。

现有 ccxt sandbox 健康检查继续作为只读维护能力，不由本决策自动调用，也不作为订单通道。

## API 与恢复

建议沿用 Stage 5 路径：

```text
POST /api/execution/sandbox-readiness-decisions
GET  /api/execution/sandbox-readiness-decisions?baseRunId=...&limit=...
```

POST 成功后将 `stage5_sandbox_readiness_decision` 写入 `AuditEventStore`，`runId` 使用 `baseRunId`。GET 按 base run 回读并逐条重建；malformed event、缺失 source workflow/session/adapter event、时间倒置、hash 不一致或安全边界变化都必须使请求失败，不能跳过坏记录后继续报告 ready。

实现优先放入现有 `stage5_shadow.py`、`api.py`、`runs.py` 和对应 tests；只有现有模块出现清晰职责冲突时才拆新模块。

## 导出、导入与 Audit

研究包继续复用现有 `auditEvents[]`，manifest 只增加 `artifactCounts.stage5SandboxReadinessDecisions`，不复制 decision payload。

导出必须同时保留决策引用的 Stage 4 workflow、Stage 5 session 和 adapter paper execution evidence。导入预检按依赖顺序验证：

```text
Stage 4 workflow
  -> Stage 5 shadow session
  -> adapter paper execution evidence
  -> Stage 5 sandbox readiness decision
```

任一依赖缺失或不一致时整包原子拒绝。Audit 只增加一种专属只读行，显示 base run、shadow session hash、adapter、terminal evidence id、decision hash 和固定 live-blocked 边界；不增加第二个工作流页面。

## Web 交互

复用现有 `ExecutionStage5ShadowSection`：

- session 为 reconciled 且尚无 decision 时，显示一个“生成 Sandbox 准入决策”主动作。
- 动作只提交服务端可验证的身份字段和一次范围确认。
- 成功后显示 adapter、terminal evidence、decision hash 和“仍禁止下单”。
- blocker 使用服务端返回的结构化原因解释缺失或错配证据。
- blocked/recoverable session 不显示可绕过动作。
- 刷新后从持久化 decision 恢复，不依赖前端临时成功状态。

375px 布局继续使用现有 Stage 5 卡片和 Audit 行样式，不新增横向表格。

## Acceptance manifest 与 Docker

新增独立 `data/stage5-sandbox-readiness.json`：

- `kind=aiqt.stage5SandboxReadinessAcceptance`
- `schemaVersion=1`
- 保存通过路径所需的完整 Stage 4 workflow、Stage 5 session、脱敏 adapter terminal evidence 和 readiness decision，供离线 validator 重建。
- 保存 blocker drills：缺 adapter event、adapter/market 错配、blocked session、安全字段篡改和 decision hash 篡改。
- 保存 API 容器重启前后的 decision hash 精确集合。
- 保存导出、原子导入、再导出与 GET readback 的 decision hash 对比。

Docker runner 复用现有 Stage 4 workflow、Stage 5 session 和 adapter paper evidence API，不另建 fake readiness store 或测试专用后门。

## 验收标准

- 只有 reconciled Stage 5 session 与真实存在、同市场、paper-only 的 terminal adapter event 能生成 decision。
- 缺失、stale、错配、blocked 和安全字段篡改全部 fail closed，且不会写成功 artifact。
- 重复 POST 保持 decisionId/hash 幂等。
- API 重启、浏览器刷新、研究包导出导入后仍能权威重建相同 decision hash。
- Audit 包能专项核对 decision 数量和 SHA-256 回读。
- Web 在成功和阻断场景均能解释结论，375px 无横向溢出。
- Python、Web、build、Stage 3 维护门禁和 Stage 5 Docker smoke/validate 通过。
- 六项既有安全边界不变，并新增 `sandboxOrderSubmissionAllowed=false`。

## 不做

- 不连接真实 broker、ccxt sandbox/testnet 或资金账户。
- 不读取、写入或导出 broker secret。
- 不同步余额、持仓、成交或订单状态。
- 不提交或撤销 sandbox、paper 或 live 订单。
- 不开放 live route，不增加自动授权或自动晋级。
- 不创建第二套 adapter chain、订单 store、队列、worker 或动态限额系统。
- 不创建只有一个实现的 broker adapter interface。
