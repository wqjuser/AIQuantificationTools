# Stage 8 生产只读连续性与撤销设计

## 状态

已完成并转入维护。Stage 8 只让 Stage 7 的生产只读能力可持续运维，不增加生产委托或资金操作能力。

## 问题

Stage 7 已能生成一次性的 Binance Spot 生产只读证据，但当前仍有两个运维缺口：

- route review 或探针超过 24 小时后，操作者缺少 `current / stale / blocked` 的权威解释；
- 发现凭据泄露、IP 白名单变化或权限异常时，平台没有一个跨重启保持、且在生产网络访问前生效的本地撤销开关。

## 目标

复用 Stage 7 探针、`execution_adapter_production_route_review` 和 `AuditEventStore`，提供：

1. 从最新 Stage 7 证据派生的生产只读连续性状态；
2. 持久化的人工 `revoke / restore` 控制；
3. revoke 后在构造 CCXT 生产连接前阻断 Stage 7 探针；
4. API 重启后的控制状态与 hash 精确回读；
5. 无生产网络、无真实凭据的 Docker 故障与恢复门禁。

## 固定边界

- 只覆盖 `ccxt-live + binance + spot + production-readonly`。
- 不创建第二套生产探针；权限与账户检查继续只调用 Stage 7 的 `probe_ccxt_production_readonly`。
- 连续性状态只引用 Stage 7 probe id/hash、route review、新鲜度和安全布尔值，不复制资产名称、余额或原始交易所响应。
- revoke 不依赖外部证据，必须随时可执行；restore 必须绑定最近 24 小时内有效的同一路由复核。
- 没有 Stage 8 控制事件时保持 Stage 7 既有行为；一旦 revoke，后续生产只读访问必须 fail closed，直到权威 restore。
- Stage 8 控制是当前 API 数据卷中的本地执行权，不通过研究包导入恢复。
- 始终固定 `liveTradingAllowed=false`、`orderRoutingEnabled=false`、`liveOrderSubmitted=false`、`liveRouteExecuted=false`、`liveBlockedBoundary=true`。

## 数据契约

### 生产只读访问控制

`aiqt.stage8ProductionReadonlyAccessControl` 保存：

- `controlId`、`action`、`status`、`operator`、`reason`、`recordedAt`；
- restore 使用的 `productionRouteReviewId`；
- 前一控制事件 id；
- canonical SHA-256 与全部 live-blocked 边界。

重复 revoke 或重复 restore 只回读当前控制，不产生第二条等价事件。

### 生产只读连续性

`aiqt.stage8ProductionReadonlyContinuity` 是服务端即时派生的只读摘要，状态为：

- `current`：最新 Stage 7 probe 为 ready，Stage 6 hash、route review 和 24 小时新鲜度均有效；
- `stale`：存在结构有效的历史 probe，但 Stage 6 authority、route review 或探针新鲜度已漂移；
- `blocked`：最新 probe 本身 blocked、读取权限关闭或 mutation 权限开启；
- `revoked`：本地访问控制已撤销；
- `missing`：尚无 Stage 7 probe。

摘要保存最新 probe 的 id/hash/status/time、控制事件、到期时间、阻断原因与自身 hash，不保存生产账户明细。

## API 与界面

- `GET /api/execution/stage8/production-readonly-continuity`：从审计账本和当前 authority 派生连续性状态。
- `POST /api/execution/stage8/production-readonly-access-controls`：只接受 `revoke` 或 `restore`；restore 绑定当前 production route review。
- Stage 7 POST 在任何生产探针调用前读取最新 Stage 8 控制；revoked 或控制证据无效时直接返回 409。
- Execution 复用现有 Stage 7 卡片展示连续性、到期时间、控制 hash 和单一 revoke/restore 动作。

## 验收

Docker acceptance 使用独立 Compose 项目和数据卷，完成：

1. 初始状态为 missing 且无生产网络访问；
2. 人工 revoke 入账；
3. Stage 7 POST 在生产探针前被 revoke 阻断；
4. API 重启后 control hash 一致；
5. 缺少当前 route review 的 restore 被拒绝，状态继续 revoked；
6. manifest 离线重验 hash 和全部 live-blocked 边界。

## 明确不做

- 后台轮询器、定时任务、告警平台或自动重试。
- 自动修改、轮换或撤销 Binance API Key。
- 生产订单、成交、撤单、转账、提现、kill switch 或真实资金限额。
- 第二交易所、多账户、Futures、Margin 或通用 broker/control framework。
