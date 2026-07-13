# Stage 0 SQLite 测试资源生命周期收口实施计划

## 状态

审查中。设计依据：[Stage 0 SQLite 测试资源生命周期收口设计](../specs/2026-07-13-stage0-sqlite-test-lifecycle-design.md)。

## 工作项

### 1. 泄漏证据与契约

- [x] 保留 tracemalloc 定位结论，确认泄漏仅来自测试裸 SQLite context manager。
- [x] 在现有 Python 契约测试中拒绝新的裸 `with sqlite3.connect(...)`。
- [x] 不改变生产 store 的连接管理。

### 2. 生命周期修复

- [x] 复用已有 `contextlib.closing` 修复策略实验测试的 10 处连接。
- [x] 复用已有 `contextlib.closing` 修复 Stage 3 AI 评审测试的 13 处连接。
- [x] 保持原有事务、查询和断言不变。

### 3. 验证与交付

- [x] 运行聚焦 warning 验收、全量 Python/Web 和生产构建。
- [x] 运行 Docker 基础 smoke 与 Stage 8 smoke/validate。
- [x] 同步 README、产品规划、架构和 CONTEXT。
- [ ] 完成独立规格/标准审查、提交、推送、PR 和远端门禁。

## 明确不做

- 不新增数据库抽象、依赖或全局 warning 策略。
- 不启动 Stage 9，不改变任何 live/order 安全边界。
