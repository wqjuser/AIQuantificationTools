# Stage 0 Stage 6 启动等待收口实施计划

## 状态

远端验收中。设计依据：[Stage 0 Stage 6 启动等待收口设计](../specs/2026-07-14-stage0-stage6-startup-wait-design.md)。

## 工作项

- [x] 复现并定位初次 Compose 启动后的单次健康探测竞态。
- [x] 初次启动复用现有 `_wait_for_api`，不新增重试实现。
- [x] 同步 README、产品规划、架构和 CONTEXT。
- [x] 运行 Stage 6、Stage 8 和全量测试门禁。
- [x] 完成独立 Standards/Spec 审查，两个维度均为 PASS。
- [ ] 提交、推送、PR 和远端门禁。

## 本地验收结果

- 冷启动 Stage 6 no-credential smoke/validate：通过，`liveBlockedBoundary=true`。
- Stage 8 smoke/validate：通过，`restartExact=true`、`liveBlocked=true`。
- 最终 `npm test`：Python 638、Web 944 tests passed。
- 主环境 `5173/health` 与 `/api/workspace`：健康。
- 独立审查：Standards PASS、Spec PASS；初审健康错误信息问题已修复。

## 明确不做

- 不增加 sleep、交易所重试或新依赖。
- 不改变 Sandbox/生产凭据、订单状态机或 live-blocked 边界。
