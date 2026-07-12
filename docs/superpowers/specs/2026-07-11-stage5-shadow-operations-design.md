# Stage 5 Shadow Operations 第二阶段设计

## 目标

把第一阶段已经可运行的 shadow execution 后端能力变成可操作、可刷新恢复、可导出导入和可在 Audit 中复核的产品闭环。权威事实继续来自 Stage 4 workflow 与 `stage5_shadow_execution_session` 审计事件，不创建新的订单 store 或前端影子状态机。

## 用户闭环

```text
Stage 4 authoritative workflow
  -> Execution 启动 shadow session
  -> 超时 attempt 可重试一次
  -> 刷新后从 AuditEventStore 恢复
  -> 显示 clientOrderId、状态迁移、限额、kill switch 与对账
  -> 研究包导出
  -> 原子导入与再导出
  -> Audit 包浏览器回读同一 session hash
```

Execution 工作区只保留一个 Stage 5 主动作：没有 session 时启动；存在 `recoverable_failure` 时重试；已完成或阻断时只读复核。故障注入继续由测试和 Docker smoke 使用，产品主动作固定 `failureMode=none`，不把调试选项变成普通交易控制。

## 后端与归档

- 研究包仍通过 `auditEvents[]` 携带 Stage 5 session，不新增第二份 payload。
- `manifest.artifactCounts.stage5ShadowSessions` 必须等于合法 session 事件数量。
- 导入预检要求每个 session 能由包内匹配的 Stage 4 workflow 完整重建；数量、workflow/session hash、身份、attempt 或安全边界不一致时在写入前失败。
- Stage 5 Docker acceptance 增加 export/import/re-export/readback 计数与 hash，证明恢复链路可移植。

## Web 边界

- 新增一个小型 `stage5-shadow.ts`，包含 exact runtime guard、URL、POST/GET client 和纯状态模型。
- 新增 `ExecutionStage5ShadowSection`，复用 App 已加载的 Stage 4 workflow 与当前 base run。
- 页面刷新只调用 GET 恢复 session；不根据按钮点击伪造成功。
- UI 显示 `shadowOnly=true` 和五项 live-blocked 字段，不出现 broker 连接、账户授权或订单提交动作。

## 验收

- typed client 拒绝 malformed、unsafe 和身份不匹配响应。
- Execution 操作台覆盖启动、重试、完成、阻断、空状态和刷新恢复。
- export/import 对 Stage 5 session 进行专用计数和权威重建。
- Audit 包浏览器与 import diff 显示 session 数量、hash、attempt 和对账状态。
- Docker Stage 5 smoke 完成运行、恢复、导出、导入、再导出与离线复核。
- 375px 布局无横向溢出；真实 broker、secret、资金账户和 live route 仍不存在。

## 不做

- 不接真实 broker 或 testnet 网络。
- 不新增 adapter interface；第二个真实实现出现前保持单一 builder。
- 不做自动重试循环、后台 worker、消息队列或订单数据库。
- 不让浏览器选择 `adapter_rejected`、`kill_switch` 等故障注入模式。
