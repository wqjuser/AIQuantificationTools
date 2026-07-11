# Stage 5 Shadow Execution 运维手册

## 运行

先启动或复用 Docker 服务，再执行：

```bash
npm run docker:smoke:stage5 -- --no-build
npm run docker:smoke:stage5:validate
```

第一条命令会先生成 5 个独立 Stage 4 权威 workflow，执行五类确定性 Shadow 演练，重启 API 容器，导出研究包、原子导入、再次导出并通过 GET 回读，输出 `data/stage5-shadow-execution.json`。第二条命令只离线复核 manifest，不访问网络。

## 预期结果

- `none`：attempt 1 为 `reconciled`，重复调用回读同一 session。
- `timeout_once`：attempt 1 为 `recoverable_failure`，attempt 2 为 `reconciled`，第三次调用回读 attempt 2；两次 attempt 的 `clientOrderId` 完全相同。
- `adapter_rejected`、`reconciliation_mismatch`、`kill_switch`：attempt 1 均为 `blocked`，重复调用回读同一 session；kill switch 演练必须为 `triggered=true`。
- 共 5 个独立 workflow、6 个唯一 session；blocked/completed 重复调用不增加审计事件。
- `restartReadback` 在 API 容器重启后精确回读 6 个 session 和同一 hash 集合。
- `exportReadback` 的首次导出、导入后再导出和 GET 回读数量均为 6，session hash 集合完全一致。
- manifest 保持六项安全边界，其中 `shadowOnly=true`，其余 live/order route 字段保持阻断。

## 页面操作与恢复

Execution 工作区只提供一个 Stage 5 主动作：首次启动 Shadow 验证，或对已持久化的可恢复超时进行一次重试。正常页面不提供故障模式选择；完成或阻断后只展示 failure mode、限额、kill switch、对账原因、委托迁移和 session hash。刷新页面会按当前 research run 调用 `GET /api/execution/shadow-sessions`，从审计账本恢复最新 attempt。Audit 专属行汇总 modes、blocked/recovered 数量和 hash 前缀。

导出包的 `manifest.artifactCounts.stage5ShadowSessions` 必须与合法的 `stage5_shadow_execution_session` 事件数量一致。导入时包内必须同时包含对应的 Stage 4 权威 workflow；核心会重建 Stage 5 session，任何数量、身份、时间、hash、自洽字段或安全边界篡改都会在写库前阻断。

## 故障处理

- `stage5_shadow_workflow_not_found`：先完成 Stage 4 workflow 归档。
- `invalid_stage5_shadow_session`：检查 workflow hash、failure mode 和请求字段。
- attempt 1 超时：使用完全相同的请求重试一次；不要更换 workflow hash 或订单身份。
- attempt 2 仍失败、对账错配或 kill switch 触发：停止；保留审计事件，禁止补造成功。
- 容器重启后 session 数量或 hash 不一致：停止导入与发布，保留命名卷，检查 `stage4_portfolio_workflow` 与 `stage5_shadow_execution_session` 事件；不要跳过坏记录。

## 安全边界

当前 adapter 是 `local-fake-shadow`，不会访问 broker、testnet 或资金账户。任何真实连接、账户同步、委托或撤单都需要后续独立设计、人工授权和验收，不能通过本阶段 manifest 解锁。
