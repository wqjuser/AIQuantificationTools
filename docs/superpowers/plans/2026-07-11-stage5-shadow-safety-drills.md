# Stage 5 Shadow Safety Drills 第三阶段实施计划

## 状态

已由用户确认并完成实施、验收与提交前复核。

## 目标

复用现有 Stage 5 builder、POST/GET API、AuditEventStore、研究包和 Docker runner，完成 adapter reject、reconciliation mismatch、kill switch、超时恢复、重启恢复与便携审计的完整安全演练门禁。

设计依据：[Stage 5 Shadow Safety Drills 第三阶段设计](../specs/2026-07-11-stage5-shadow-safety-drills-design.md)。

## 范围边界

- 产品仍只使用 `local-fake-shadow`。
- 产品主动作不开放故障注入。
- 每个故障场景使用独立 Stage 4 workflow，不放宽现有 failureMode 幂等约束。
- 不新增 adapter interface、订单库、后台任务或独立限额系统。
- 全链固定 `paperOnly=true`、`shadowOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。

## 实施任务

### 1. 固定故障演练合同

- [x] 在 Stage 5 focused tests 中固定五个场景的状态、委托状态、reconciliation 和 kill switch 预期。
- [x] 固定 blocked session 的重复 POST 语义：HTTP 200、同一 sessionId/hash、不增加审计事件。
- [x] 固定同一 workflow 改换 failureMode 继续返回 `invalid_stage5_shadow_session`。

涉及文件：

- `services/quant_core/tests/test_stage5_shadow.py`
- 仅在测试暴露真实缺口时最小修改 `services/quant_core/quant_core/stage5_shadow.py` 或 `services/quant_core/quant_core/api.py`。

### 2. 扩展 Stage 5 acceptance manifest

- [x] 在现有 manifest 增加 exact `failureDrills` 与 `restartReadback`。
- [x] 使用 5 个独立 Stage 4 workflow 生成 6 个 Stage 5 session。
- [x] 校验正常、超时恢复、adapter reject、reconciliation mismatch 和 kill switch 的完整预期。
- [x] 校验 blocked 重试不新增事件、超时第三次调用不新增 attempt。
- [x] 离线 validator 拒绝缺失/重复场景、错状态、错 reason、错 hash、错计数和 unsafe 字段。

涉及文件：

- `tools/docker_smoke.py`
- `services/quant_core/tests/test_stage5_shadow.py`

### 3. 加入真实容器重启恢复

- [x] Stage 5 smoke 在 session 持久化后重启 API 容器并等待 `/health`。
- [x] GET 回读 6 个 session，按 workflowHash/sessionHash 精确比对。
- [x] 重启后继续完成导出、原子导入、再导出与 GET readback。
- [x] 保持 Web 容器可用，不清理命名卷。

涉及文件：

- `tools/docker_smoke.py`
- 如命令入口需要传递 repo/compose 上下文，仅最小调整现有 runner 参数。

### 4. 补全操作员可读证据

- [x] 在现有 Execution Shadow 区块显示 failure mode、限额、kill switch 与 reconciliation reason。
- [x] blocked 状态只读，不增加绕过或继续动作。
- [x] Audit 的 Stage 5 专属行增加 blocked/recovered 数量和故障模式摘要。
- [x] 中英文文案与 375px 布局测试同步。

涉及文件：

- `apps/web/src/components/ExecutionStage5ShadowSection.tsx`
- `apps/web/src/components/ExecutionStage5ShadowSection.test.tsx`
- `apps/web/src/lib/terminal-workbench.ts`
- `apps/web/src/lib/terminal-workbench.test.ts`
- `apps/web/src/lib/i18n.ts`
- 必要时最小调整 `apps/web/src/styles.css`。

### 5. 分层验证

- [x] 运行 Stage 5 Python focused tests。
- [x] 运行 Stage 5/Web focused tests。
- [x] 运行全量 `npm test`。
- [x] 运行 `npm run build`。
- [x] 重建 Docker。
- [x] 运行 `npm run docker:smoke:stage3 -- --no-build` 与 validate。
- [x] 运行 `npm run docker:smoke:stage5 -- --no-build` 与 validate。
- [x] 浏览器验证 completed/blocked 证据、刷新恢复与 375px 无横向溢出。

### 6. 文档与提交

- [x] 同步 `README.md`、`docs/product-plan.md`、`docs/architecture.md` 和 `docs/stage5-shadow-operations.md`。
- [x] 记录最终测试数、manifest 场景数、重启 readback 数量和安全边界。
- [x] 以一个 Stage 5 第三阶段提交收口。

## 最终验收记录

- Python：589 tests passed；Web：927 tests passed；构建通过。
- Stage 5 Docker：5 个故障场景、5 个独立 workflow、6 个 session，API 重启与导出导入回读均精确。
- Stage 3 Docker 回归通过；Stage 5 最终 no-build smoke 与离线 validator 通过。
- 浏览器：`kill_switch` blocked 证据刷新前后 hash 一致；Audit 显示五种模式、3 个阻断、1 次超时恢复；375px 根布局 `scrollWidth=375`。
- 安全边界保持 `liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。

## 完成定义

- 5 个场景、5 个独立 workflow、6 个 session 全部可离线复核。
- API 重启前后以及导出/导入后的 session hash 集合一致。
- blocked 场景无法通过重复 POST 生成成功证据。
- UI 能解释 failure mode、kill switch 和 reconciliation，但不能触发故障或绕过阻断。
- 无真实 broker/testnet/账户/订单/live route 行为。

## 用户确认点

确认后才进入实现。重点确认：

1. 下一阶段是否采用“完整 Shadow 故障演练与重启恢复”，而不是开始真实 broker adapter。
2. 是否接受每个故障场景创建独立 Stage 4 workflow，以保持现有幂等合同不变。
3. 是否同意继续暂缓独立 Stage 5 动态限额，直到出现账户或 broker sandbox 的真实约束。
