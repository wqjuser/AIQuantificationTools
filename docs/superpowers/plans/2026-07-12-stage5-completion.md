# Stage 5 整体完成实施计划

## 状态

已完成并通过整体门禁。

设计依据：[Stage 5 整体完成设计](../specs/2026-07-12-stage5-completion-design.md)。

## 工作项

### 1. 顶层退出契约

- [x] 新增最小化的 Stage 5 exit manifest 构建、hash、精确验证和源文件回读模块。
- [x] 复用七份现有 validator，在全部通过后聚合退出结论。
- [x] 覆盖缺失、源文件漂移、字段/顺序/hash/安全边界篡改。

### 2. Docker 与 CI 发布门禁

- [x] 完整 Stage 5 smoke 生成 `data/stage5-exit-acceptance.json`。
- [x] 完整 Stage 5 validate 复核顶层退出清单。
- [x] CI artifact 上传第八份发布证据并由契约测试锁定。

### 3. API 与 Web 回读

- [x] 新增只读 latest API，返回 accepted/missing/invalid。
- [x] 扩展现有 Stage 5 typed client 和 Execution 区块，显示退出证据与阻断边界。
- [x] 将 Stage 5 产品状态切换为 maintenance，不创建虚构后续阶段。

### 4. 文档同步

- [x] 更新 README、产品规划、架构与 Stage 5 运维手册。
- [x] 统一说明默认无凭据 fail-closed 是有效安全证据，不代表连接或授权成功。
- [x] 明确真实券商、订单提交和 live route 仍需独立人工授权与验收。

### 5. 完整验证与交付

- [x] 运行聚焦 Python/Web/部署契约测试。
- [x] 运行 Python/Web 全量测试和生产构建。
- [x] 运行自包含 Stage 5 Docker smoke 与完整 Stage 3/4/5 validate。
- [x] 执行 Standards/Spec 双轴独立审查并修复问题。
- [x] 更新本计划验证结果并提交完整变更。

## 验收结果

- 聚焦契约：Web 455 tests passed；Python Stage 5 exit 4 tests passed。
- 全量测试：Python 606 tests passed；Web 933 tests passed。
- `npm run build`：通过，仅保留既有 chunk size 提示。
- Docker 镜像重建：通过。
- 完整 Stage 5 smoke：5 类故障演练、6 个 session、重启/便携回读一致；`preflightCount=0`、`reviewCount=0`、`authorizationEffective=false`。
- 完整离线 validate：Stage 3、Stage 4、五份 Stage 5 链路证据和顶层退出证据全部通过。
- 顶层运行时回读：`artifacts=7`、`status=maintenance`、`liveBlocked=true`，API hash 与本地清单一致。
- 双轴独立复审：先修复 invalid 状态字段规范化和源路径重复，再复核为 Standards 0、Spec 0。
