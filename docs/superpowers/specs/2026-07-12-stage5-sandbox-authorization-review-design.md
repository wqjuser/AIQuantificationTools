# Stage 5 Sandbox 授权复核设计

## 状态

已确认，进入实施。

## 目标

把 Stage 5 授权预检后的人工批准或拒绝记录为服务端权威、不可变、可恢复和可离线复核的审计 artifact。复核只确认材料与范围，不激活 Sandbox 或实盘订单能力。

## 当前缺口

`aiqt.stage5SandboxAuthorizationPreflight` 已经绑定 readiness decision、权威只读 probe execution/review，并能通过刷新和研究包恢复；但人工授权复核结果仍没有与 preflight 精确绑定的权威账本。仅靠页面状态或文字交接无法证明复核的是哪份 hash，也无法阻止旧预检或篡改证据被误用。

## 核心决策

### 1. 新增复核 artifact，不新增激活系统

新增 `aiqt.stage5SandboxAuthorizationReview`：

```text
reviewId / reviewHash / generatedAt
baseRunId
preflightId / preflightHash
adapterId / market
reviewer / outcome / reason
confirmedScopeIds
status = authorization_review_recorded
authorizationEffective = false
humanAuthorizationRequired = true
sandboxOrderSubmissionAllowed = false
liveTradingAllowed = false
orderSubmissionEnabled = false
routeExecuted = false
liveBlockedBoundary = true
```

`outcome` 只允许 `approved` 或 `rejected`。`approved` 表示人工材料复核通过，仍不代表技术激活或下单授权。

### 2. 固定范围确认

服务端要求五项确认全部为 true：预检 hash 已复核、范围仅限 Sandbox、没有订单提交、没有真实资金、急停与回滚负责人已确认。请求只传 preflight hash、reviewer、outcome、reason 和确认对象；服务端从 AuditEventStore 精确回读 preflight 及全部上游证据。

权威 health evidence 在复核时必须仍处于 24 小时窗口内。缺失、blocked、stale、身份/hash/HMAC 错配或安全字段篡改全部 fail closed，不写 review。

### 3. 不可变与幂等

`reviewId` 只由 `preflightHash` 确定。每份 preflight 只能产生一份不可变复核；重复提交回读原 artifact，不能用同一 preflight 把拒绝改成批准。需要重新复核时必须先以新权威探针生成新 preflight。

### 4. 产品与便携审计

Execution 在 preflight 存在且 review 缺失时提供 outcome、reason 和一个“记录授权复核”动作；成功后显示 outcome、review hash 和“复核不激活订单能力”。刷新只通过 GET 恢复。

研究包沿用 `auditEvents[]`，新增 `artifactCounts.stage5SandboxAuthorizationReviews`。导入按 preflight -> review 依赖顺序重建并保持原子回滚；Audit 包浏览器验证数量、身份、SHA-256 和全部安全边界。

### 5. Docker 继续无凭据 fail closed

默认 Docker 的只读 probe 为 blocked，因此既不能生成成功 preflight，也不能生成 review。独立 acceptance 必须使用真实 blocked probe 链，证明 review 请求被拒绝、`reviewCount=0`，且全部订单与 live route 字段保持 false。

## 不做

- 不写入密钥或连接真实资金账户。
- 不提交、撤销或查询 Sandbox/实盘订单。
- 不把批准复核解释为技术激活。
- 不新增 broker interface、订单 worker、队列、重试器或第二套审计 store。
