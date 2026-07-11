# Stage 5 Shadow Execution 运维手册

## 运行

先启动或复用 Docker 服务，再执行：

```bash
npm run docker:smoke:stage5 -- --no-build
npm run docker:smoke:stage5:validate
# 只执行第四阶段准入链路
npm run docker:smoke:stage5:readiness -- --no-build
npm run docker:smoke:stage5:readiness:validate
```

完整 smoke 会先生成 5 个独立 Stage 4 权威 workflow，执行五类确定性 Shadow 演练，再为已对账的 workflow 绑定真实持久化 terminal adapter paper evidence，生成 Sandbox 准入决策。链路会重启 API 容器，导出研究包、原子导入、再次导出并通过 GET 回读，输出 `data/stage5-shadow-execution.json` 与 `data/stage5-sandbox-readiness.json`。两条 validate 命令都只离线复核 manifest，不访问网络。

## 预期结果

- `none`：attempt 1 为 `reconciled`，重复调用回读同一 session。
- `timeout_once`：attempt 1 为 `recoverable_failure`，attempt 2 为 `reconciled`，第三次调用回读 attempt 2；两次 attempt 的 `clientOrderId` 完全相同。
- `adapter_rejected`、`reconciliation_mismatch`、`kill_switch`：attempt 1 均为 `blocked`，重复调用回读同一 session；kill switch 演练必须为 `triggered=true`。
- 共 5 个独立 workflow、6 个唯一 session；blocked/completed 重复调用不增加审计事件。
- `restartReadback` 在 API 容器重启后精确回读 6 个 session 和同一 hash 集合。
- `exportReadback` 的首次导出、导入后再导出和 GET 回读数量均为 6，session hash 集合完全一致。
- manifest 保持六项安全边界，其中 `shadowOnly=true`，其余 live/order route 字段保持阻断。

Sandbox 准入 manifest 还必须满足：

- decision 状态固定为 `ready_for_manually_authorized_sandbox_phase`，重复 POST 回读同一 decision id/hash。
- decision 精确绑定同一 Stage 4 workflow、已对账 Stage 5 session、同市场 terminal adapter paper executions、有序证据 id，以及每笔 simulation 的 `symbol/side/quantity` 订单意图。
- API 重启后 decision hash 精确一致；导出、原子导入、再导出和 GET 回读均可重建同一证据。
- 缺 adapter event、adapter/market 错配、blocked session、不安全 adapter evidence 和 decision hash 篡改五类演练全部被阻断。
- `sandboxOrderSubmissionAllowed=false`；准入结论不能解锁 sandbox/testnet 下单。

## 页面操作与恢复

Execution 工作区始终只提供一个 Stage 5 主动作：先启动/重试 Shadow 验证；最新 session 已对账后，主动作切换为“生成 Sandbox 准入决策”。正常页面不提供故障模式或 adapter 选择，也没有下单动作。刷新页面会按当前 research run 调用 Shadow session 与 readiness decision 两个 GET，从审计账本恢复最新状态。成功决策只读展示 adapter、terminal evidence id、decision hash 和“仍禁止 Sandbox 下单”的边界。

导出包的 `manifest.artifactCounts.stage5ShadowSessions` 与 `stage5SandboxReadinessDecisions` 必须分别匹配合法审计事件数量。导入时包内必须同时包含对应的 Stage 4 workflow、Stage 5 session 和 decision 引用的顶层脱敏 adapter paper executions；核心按依赖顺序重建，任何数量、身份、时间、hash、自洽字段或安全边界篡改都会在写库前阻断。Audit 专属行会先按与 Python 相同的 canonical JSON 规则验证完整 SHA-256，再显示 decision 数量、adapter、hash 摘要和 blocked 安全边界。

## 故障处理

- `stage5_shadow_workflow_not_found`：先完成 Stage 4 workflow 归档。
- `invalid_stage5_shadow_session`：检查 workflow hash、failure mode 和请求字段。
- `stage5_sandbox_readiness_blocked`：读取响应中的 `blockers`；补齐或修复权威 source evidence，禁止绕过后补造 decision。
- `stage5_sandbox_readiness_adapter_evidence_missing`：组合模拟引用的 terminal adapter audit event 不存在或未进入导出包；停止准入和导入，检查原始 AuditEventStore。
- adapter/market 错配或不安全字段：拒绝准入，保留原事件用于审计，不允许通过修改内联 snapshot 伪造通过。
- source evidence 距 decision 超过 24 小时：按 stale 阻断；重新执行权威 Shadow/terminal paper evidence 链，不修改旧时间戳续期。
- attempt 1 超时：使用完全相同的请求重试一次；不要更换 workflow hash 或订单身份。
- attempt 2 仍失败、对账错配或 kill switch 触发：停止；保留审计事件，禁止补造成功。
- 容器重启后 session 数量或 hash 不一致：停止导入与发布，保留命名卷，检查 `stage4_portfolio_workflow` 与 `stage5_shadow_execution_session` 事件；不要跳过坏记录。

## 安全边界

当前运行 adapter 仍是 `local-fake-shadow`，不会访问 broker、testnet 或资金账户。Docker 只通过现有 adapter ops builder 与 `POST /api/execution/adapter-paper-executions` 生成 terminal paper evidence，不直接伪造 terminal event。准入 decision 和 acceptance manifest 均固定 `paperOnly=true`、`shadowOnly=true`、`sandboxOrderSubmissionAllowed=false`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。任何真实连接、账户同步、委托或撤单都需要后续独立设计、人工授权和验收，不能通过本阶段 decision 或 manifest 解锁。
