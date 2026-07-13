# Stage 0 P1 验收工作量收口实施计划

## 状态

审查中。设计依据：[Stage 0 P1 验收工作量收口设计](../specs/2026-07-14-stage0-p1-acceptance-budget-design.md)。

## 工作项

### 1. 验收合同

- [x] 用四标的工作区锁定原始数量与三标的验收样本。
- [x] 锁定 refresh payload 和 P1 manifest 使用同一份样本。
- [x] 保留 queue-ready、导出、导入和 paper-only 证据链。

### 2. 实现与文档

- [x] 在既有 `run_p1_acceptance` 中收口验收样本，不新增抽象。
- [x] 不修改产品 watchlist refresh API 和行情适配器。
- [x] 同步 README、产品规划、架构和 CONTEXT。

### 3. 验证与交付

- [x] 运行聚焦测试、全量 Python/Web 和生产构建。
- [x] 运行 Docker P1 与 Stage 8 smoke/validate。
- [ ] 完成独立审查、提交、推送、PR 和远端门禁。

## 本地验收结果

- 聚焦合同：1 test passed；四标的工作区按原顺序提交前三个标的。
- Python：638 tests passed。
- Web：944 tests passed。
- `npm run build` 与 `docker compose config`：通过。
- P1 Docker：23 秒完成，`watchlist=3`、9 checks、`liveBlocked=true`。
- Stage 8 Docker：`restartExact=true`、`liveBlocked=true`。

## 明确不做

- 不增加重试器、并发器、队列或新依赖。
- 不延长全局超时。
- 不启动 Stage 9，不改变 live/order 安全边界。
