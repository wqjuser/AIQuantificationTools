# Stage 5 Shadow Execution 第一阶段设计

## 目标

Stage 5 第一阶段只验证实盘前执行控制面，不连接真实券商、不读取资金账户、不提交订单。权威输入是已经通过校验的 Stage 4 portfolio workflow；输出是可持久化、可恢复、可故障注入和可离线复核的 shadow execution session。

## 复用边界

- 复用 `stage4_portfolio_workflow` 的组合、风控、审批、模拟成交和 replay，不创建第二套订单算法。
- 复用 `AuditEventStore` 保存 shadow attempt，不增加订单数据库。
- 复用 Stage 4 `riskTemplate.maxBatchNotional` 作为 shadow 总名义限额。
- 使用 Python 标准库 SHA-256 生成稳定 `clientOrderId` 和 session hash，不增加依赖。

## Shadow adapter contract

第一阶段只有 `local-fake-shadow`，代码不提前抽象多实现接口。合同固定为：

1. 输入：已验证 Stage 4 workflow、failure mode、attempt。
2. 输出：每笔订单的稳定 `clientOrderId`、状态迁移、限额、kill switch、对账结果和不可变安全字段。
3. 环境：`isolated-local`；模式：`shadow`。
4. 禁止：网络、broker secret、账户同步、订单提交、撤单和 live route。

未来只有在接入第二个 sandbox adapter 时才提取正式 adapter interface。

## 状态机与幂等

正常路径：`projected -> shadow_acknowledged -> reconciled`。超时路径在 attempt 1 进入 `timeout/not_attempted` 和 `recoverable_failure`，attempt 2 使用同一组 `clientOrderId` 恢复为 `reconciled`。第三次相同请求回读 attempt 2，不新增事件。

`clientOrderId` 由 `workflowHash + orderId` 确定性生成；session key 由 workflow hash 生成。每个 attempt 单独写入审计事件，因此服务重启后仍可恢复。

## 安全与故障

- `killSwitch.enabled=true` 始终存在；故障注入可将 `triggered=true` 并阻断全部订单。
- 支持 `timeout_once`、`adapter_rejected`、`reconciliation_mismatch`、`kill_switch`。
- 超时最多重试一次；限额沿用 Stage 4 风险模板。
- 全链固定 `paperOnly=true`、`shadowOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。

## 阶段验收

- Stage 4 workflow 可派生两笔稳定 shadow order。
- 超时 attempt 可在审计账本基础上恢复，重复调用保持幂等。
- 拒绝、对账错配、kill switch 和安全字段篡改全部 fail closed。
- Docker 生成 `aiqt.stage5ShadowExecutionAcceptance`，离线 validator 可复核。
- Stage 4 转 maintenance，Stage 5 转 current；真实 broker 仍不在范围内。
