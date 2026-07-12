# Stage 5 Sandbox 授权预检设计

## 状态

已确认，进入实施。

## 目标

把现有 Stage 5 Sandbox 准入决策与服务端权威只读探针收口为同一份可恢复、可审计、可离线复核的授权预检证据。预检只说明材料可以提交给后续独立人工授权阶段，不授予 Sandbox 或实盘下单权限。

## 当前事实与缺口

当前代码已经分别具备：

- `aiqt.stage5SandboxReadinessDecision`：绑定 Stage 4 workflow、已对账 Shadow session 和 terminal adapter paper evidence。
- `execution_adapter_sandbox_probe_execution`：绑定服务端实际执行的 CCXT Sandbox 只读健康证据、canonical SHA-256 和 authority HMAC。
- `execution_adapter_sandbox_probe_review`：记录操作者对只读探针结果的人工复核。
- `AuditEventStore`、研究包导出导入、Audit artifact readback 和 Docker acceptance。

缺口是三类证据目前彼此独立：准入决策不能证明引用了哪次权威探针，探针复核也不能证明对应哪个 Stage 5 workflow/session。刷新、导出或人工交接后，操作者仍需手工拼接身份、市场、adapter、时间和安全边界。

## 核心决策

### 1. 新增最小预检 artifact，不新增执行系统

新增 `aiqt.stage5SandboxAuthorizationPreflight`，只保存必要引用和最终结论：

```text
preflightId / preflightHash / generatedAt
baseRunId
readinessDecisionId / readinessDecisionHash
adapterId / market
sandboxProbeExecutionId / authoritativeHealthEvidenceHash
sandboxProbeReviewId
operator
status = ready_for_separate_sandbox_authorization
humanAuthorizationRequired = true
sandboxOrderSubmissionAllowed = false
liveTradingAllowed = false
orderSubmissionEnabled = false
routeExecuted = false
liveBlockedBoundary = true
```

不复制 workflow、session、订单、账户或完整探针 payload；validator 必须从现有审计事件重新读取并重建结论。

### 2. 服务端权威绑定

POST 请求只接受 `baseRunId`、`readinessDecisionHash`、`sandboxProbeExecutionId`、`sandboxProbeReviewId`、`operator` 和一次明确范围确认。服务端重新验证：

- readiness decision 的 hash、身份、时间和全部安全字段。
- probe execution 状态为 `probe_execution_recorded`，且包含通过 HMAC 验证的 ready 权威 health evidence。
- probe review 状态为 `probe_review_recorded`，精确引用同一 execution，且全部人工确认已完成。
- 三者 `adapterId`、`market` 一致；当前阶段只接受 `ccxt-live + crypto`。
- probe execution、review 和预检时间顺序正确，权威 health evidence 不超过 24 小时。
- 所有下单、route 和 live 边界继续为 false/blocked。

缺失、blocked、stale、错配或篡改时返回结构化 blocker，不写成功 artifact。

### 3. 幂等、恢复和便携审计

`preflightId` 由 readiness decision hash、probe execution id 和 probe review id 确定性生成。相同证据重复 POST 必须回读同一 artifact。

GET 按 `baseRunId` 回读并重新查找、验证全部上游事件；不能跳过坏事件后继续报告 ready。研究包沿用 `auditEvents[]`，只新增 `artifactCounts.stage5SandboxAuthorizationPreflights`，导入预检按 readiness decision、probe execution/review、authorization preflight 的依赖顺序原子校验。

### 4. 产品交互保持一个动作

Execution 的 Stage 5 卡片在 readiness decision 已存在时显示授权预检状态：

- 缺少 ready probe execution/review：提示到 Settings 完成只读探针与人工复核。
- 证据齐全：显示一个“生成 Sandbox 授权预检”动作。
- 成功：显示 preflight hash、adapter、market 和“仍需独立人工授权；禁止下单”。
- blocked：显示服务端 blocker，不提供绕过动作。

刷新后只通过 GET 恢复，不依赖 React 临时成功状态。

### 5. Docker 验收保持无凭据 fail closed

默认 Docker 不注入 CCXT 凭据，因此独立 acceptance 必须证明：readiness decision 可以存在，但只读探针 blocked 时授权预检 POST 被拒绝，且账本中没有成功 preflight。成功路径由注入 fake exchange factory 的 API/核心测试覆盖；不为 Docker 增加测试后门或伪造凭据。

## 验收标准

- 只有同 adapter、同 market、未过期且权威验证通过的 readiness、probe execution 和 probe review 能生成预检。
- 重复 POST 保持 preflight id/hash 幂等。
- 缺证据、blocked/stale、身份错配、时间倒置、hash/HMAC 或安全边界篡改全部 fail closed。
- GET、研究包导出导入和 Audit readback 可重建相同 hash。
- 默认无凭据 Docker 明确证明预检被阻断且没有下单或成功 artifact。
- Python、Web、build、Stage 3 和 Stage 5 门禁通过。

## 不做

- 不连接真实 broker 或资金账户。
- 不提交、撤销或查询 Sandbox/实盘订单。
- 不开放 Sandbox 或 live route。
- 不新增 broker interface、订单 store、worker、队列或自动重试。
- 不复制现有 readiness、probe 或 Audit 模型。
