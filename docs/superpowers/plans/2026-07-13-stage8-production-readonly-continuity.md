# Stage 8 生产只读连续性与撤销实施计划

## 状态

已完成。Docker acceptance、全量 Python/Web、生产构建和 Stage 7 回归均通过；Stage 8 转入 maintenance。

设计依据：[Stage 8 生产只读连续性与撤销设计](../specs/2026-07-13-stage8-production-readonly-continuity-design.md)。

## 工作项

### 1. 契约与安全边界

- [x] 定义 access control 与 continuity 的 exact schema、canonical SHA-256 和 fail-closed 校验。
- [x] 明确 revoke 随时可执行、restore 必须绑定当前 route review。
- [x] 记录 Stage 8 不引入生产订单能力的 ADR 与领域术语。

### 2. 服务端与持久化

- [x] 复用 `AuditEventStore` 保存 revoke/restore 控制事件并支持幂等回读。
- [x] 从 Stage 7 probe、Stage 6 exit 和 route review 派生 current/stale/blocked/revoked/missing。
- [x] 在 Stage 7 生产探针前执行本地 revoke 门禁。
- [x] 增加 GET continuity 与 POST access control API。

### 3. Web 与运维

- [x] 复用 Stage 7 Execution 卡片展示连续性状态、到期时间、原因与控制 hash。
- [x] 提供带非空原因的人工 revoke/restore 动作，restore 缺 route review 时保持阻断。
- [x] 编写中文运维文档，覆盖过期、权限漂移、撤销、恢复和故障处理。

### 4. 验收与发布

- [x] 覆盖 schema/hash 篡改、权限漂移、过期、重复控制、无效 restore、重启恢复和生产网络前阻断测试。
- [x] 增加独立 Stage 8 Docker smoke/validate、CI artifact 与部署契约测试。
- [x] 运行全量 Python/Web、构建、Stage 7 回归和 Stage 8 Docker 验收。
- [x] 同步 README、产品规划、架构与阶段状态，完成独立审查、提交和 PR。

## 明确不做

- 不增加后台服务或调度器。
- 不自动操作交易所 Key 或 IP 白名单。
- 不创建、查询、撤销或同步生产订单，不读取成交，不执行转账或提现。
