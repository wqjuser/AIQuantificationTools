# Stage 5 权威只读 Sandbox 探针设计

## 状态

已授权实施，2026-07-12。

## 目标

把现有 CCXT sandbox 健康检查绑定到既有 `execution_adapter_sandbox_probe_execution`，使“只读握手已捕获”和“账户快照已脱敏”不再由浏览器人工声明，而是只能由 API 服务实际执行的只读探针派生。

本阶段不创建新的 broker adapter、订单 store、队列或审计实体；继续复用 `probe_ccxt_sandbox_health`、现有 sandbox probe plan/execution、`AuditEventStore`、Settings 页面和 Docker runner。

## 当前缺口

仓库已经具备：

- CCXT sandbox 只读健康检查，会先调用 `set_sandbox_mode(true)`，再检查 markets、status/time 和可选脱敏余额读取。
- 健康检查不会调用 `create_order`、`cancel_order` 或 live route，响应不返回密钥值。
- `execution_adapter_sandbox_probe_execution` 已经记录探针计划、五项确认、上游 secret manifest validation 和 live-blocked 边界。

缺口是两者尚未绑定。当前 probe execution 的只读握手和账户脱敏仍来自请求体布尔值；调用方可以在没有服务端探针证据时把两项都声明为 true。

## 核心决策

### 1. 复用现有 probe execution

不新增 `sandbox observation`、第二个 adapter ledger 或通用 `BrokerAdapter` interface。API 在处理现有：

```text
POST /api/execution/adapter-sandbox-probe-executions
```

时执行现有 CCXT sandbox 健康探针，并把脱敏后的权威证据交给现有 probe execution builder。

### 2. 两项确认改为服务端派生

以下字段忽略调用方传值：

- `readonlyHandshakeCaptured`
- `accountSnapshotRedacted`

只有权威探针满足下列条件时才标记 confirmed：

- adapter 为本阶段选定的 `ccxt-live`，market 为 `crypto`，mode 为 `sandbox`。
- 探针状态为 `ready`，blocked reasons 为空。
- `sandbox-mode`、`markets-loaded`、`account-sync`、`order-routing-disabled` 检查均为 passed。
- `accountSyncState=ready`。
- `metadata.readOnly=true`、`paperOnly=true`、`liveTradingAllowed=false`、`orderRoutingEnabled=false`。

计划复核、订单 schema 验证和操作员确认未提交订单仍是人工确认；健康探针不会调用订单 API，因此不能替代 schema 人工复核。

### 3. 保存最小脱敏证据

probe execution 的既有 `metadata` 增加 `authoritativeHealthProbe`，只保存：

- probe id、adapter、provider、exchange、mode、status、generatedAt。
- market count、account sync state、blocked reasons。
- check id/status 和必要 capability 布尔值。
- 是否配置 key/secret/password 的布尔值，不保存值或来源路径。
- read-only、paper-only、live/order routing 阻断字段。
- canonical SHA-256，以及复用现有审计签名 key registry 生成的 HMAC-SHA256 服务端 authority；只保存 key id/fingerprint/MAC，不保存 key material。

builder 和 audit-event rehydration 都重新校验结构、hash、服务端 authority、`ccxt-live` adapter 身份及安全字段。只重算普通 hash 不能伪造服务端 ready 证据；旧的成功事件如果没有该权威证据，不得继续晋级，blocked 历史仍可只读回放。

### 4. 失败仍可审计，但不能晋级

缺 ccxt、缺 sandbox 凭据、网络/限流/超时、sandbox mode 不可用、账户只读失败、adapter 不匹配或证据 hash 篡改时，API 仍记录 blocked probe execution 和脱敏原因，但不能生成 `probe_execution_recorded`，也不能进入后续 probe review。

### 5. Web 只解释权威来源

Settings 继续使用现有卡片：

- “只读握手”和“账户快照脱敏”显示为服务端派生且不可手工勾选。
- 记录结果显示权威 probe id、exchange、status/hash 摘要。
- 不新增 adapter 选择器、凭据输入框或下单动作。

## 验收

- 注入 fake CCXT exchange 的 API 测试证明 ready 探针可生成成功 probe execution，且从未调用订单 API。
- 调用方把两个派生布尔值设为 true，但服务端探针 blocked 时，结果仍为 blocked。
- 缺权威证据、adapter 错配、安全字段或 hash 篡改不能从 AuditEventStore 回读为成功证据。
- Docker 在无 sandbox 凭据环境验证 fail-closed、secret-free 和 live/order routing 全关闭；不把该结果描述为真实 sandbox 已验收。
- Stage 3/5 维护门禁、全量测试和构建继续通过。

## 非目标

- 不连接 A 股券商 sandbox；本阶段明确选择已有只读实现的 `ccxt-live`。
- 不提交、撤销、查询 sandbox/paper/live 订单。
- 不保存余额、持仓或账户标识。
- 不新增通用 broker interface、factory、registry 或动态插件系统。
- 不把 `sandboxOrderSubmissionAllowed`、`liveTradingAllowed` 或 `orderSubmissionEnabled` 改为 true。
