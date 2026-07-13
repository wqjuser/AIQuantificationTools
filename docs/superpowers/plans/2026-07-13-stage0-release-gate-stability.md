# Stage 0 发布门禁稳定性收口实施计划

## 状态

已完成。设计依据：[Stage 0 发布门禁稳定性收口设计](../specs/2026-07-13-stage0-release-gate-stability-design.md)。

## 工作项

### 1. CI 触发收口

- [x] 将 feature branch 完整门禁收敛为单一 `pull_request` 触发。
- [x] 保留 `main` push 的合并后完整门禁。
- [x] 保留现有 concurrency 和 P0 至 Stage 8 检查内容。

### 2. 代理超时收口

- [x] 将 Nginx `/api/` upstream read timeout 对齐现有 90 秒 smoke 请求预算。
- [x] 复用部署契约测试锁定 CI trigger 和 Nginx timeout。
- [x] 不修改 P1 业务逻辑、manifest 或行情适配器。

### 3. 验证与交付

- [x] 运行聚焦部署测试、全量 Python/Web 和生产构建。
- [x] 运行 Docker 基础、P1、Stage 8 smoke/validate。
- [x] 同步 README、产品规划、架构和 CONTEXT。
- [x] 完成独立规格/标准审查、提交、推送、PR 和远端门禁。

## 明确不做

- 不新增通用重试框架或 CI 编排层。
- 不启动 Stage 9，不改变任何 live/order 安全边界。
