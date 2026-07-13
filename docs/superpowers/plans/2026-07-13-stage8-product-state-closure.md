# Stage 8 产品阶段状态收口实施计划

## 状态

已完成。设计依据：[Stage 8 产品阶段状态收口设计](../specs/2026-07-13-stage8-product-state-closure-design.md)。

## 工作项

### 1. 阶段事实

- [x] 扩展现有产品阶段 id 与定义，补齐 Stage 7/8。
- [x] 将 Stage 6/7/8 统一为 maintenance，并保持 current 集合为空。
- [x] 把 Execution 工作区的交付阶段切换到 Stage 8。

### 2. 双语与测试

- [x] 补齐 Stage 7/8 中英文标签。
- [x] 更新阶段顺序、状态、工作区映射与 i18n 回归测试。
- [x] 保留全部 live/order 安全边界，不修改执行 API。

### 3. 验证与交付

- [x] 运行聚焦 Web 测试、全量 Python/Web、生产构建和 Stage 8 Docker smoke/validate。
- [x] 同步 README、产品规划、架构与阶段状态。
- [x] 完成独立规格与代码审查、提交、推送并创建 PR。

## 明确不做

- 不启动 Stage 9，不增加生产订单、成交、转账、提现或 live route。
- 不增加新 store、API、页面、组件、依赖或阶段配置框架。
