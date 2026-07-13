# Stage 8 生产只读真实恢复退出实施计划

## 状态

已完成。真实恢复验收、无凭据回归、全量测试、生产构建和双轴代码审查均通过。设计依据：[Stage 8 生产只读真实恢复退出设计](../specs/2026-07-13-stage8-real-recovery-exit-design.md)。

## 工作项

### 1. 验收合同

- [x] 在现有 Stage 8 acceptance 工具增加真实恢复 manifest builder 与 exact validator。
- [x] 复用 Stage 7 的请求 schema、脱敏权限和账户摘要，不保存密钥或原始响应。
- [x] 覆盖起始 current、revoke 网络前阻断、restore、新 probe、重启精确回读和全部安全边界。

### 2. 运行编排

- [x] 复用现有 Compose 项目与数据卷，增加 `--real-request` 运行模式。
- [x] 增加真实 smoke/validate npm 命令；默认 CI 不注入真实凭据。
- [x] 在保留的真实 Stage 7 数据卷执行一次完整恢复演练。

### 3. 验证与交付

- [x] 增加 validator 篡改与部署合同测试。
- [x] 运行聚焦测试、全量 Python/Web、构建、Stage 8 无凭据回归和真实恢复验收。
- [x] 同步 README、产品计划、架构、CONTEXT 和中文运维文档。
- [x] 完成代码审查、提交并创建 PR。

## 明确不做

- 不新增 Stage 9、业务 API、store、页面或依赖。
- 不自动管理交易所 Key，不开放生产委托、成交、转账、提现或 live route。
