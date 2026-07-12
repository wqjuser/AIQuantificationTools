# Stage 5 CI 发布门禁实施计划

## 状态

已完成并通过完整门禁。

设计依据：[Stage 5 CI 发布门禁设计](../specs/2026-07-12-stage5-ci-release-gate-design.md)。

## 任务

### 1. CI 运行门禁

- [x] 在现有镜像构建后运行 Stage 3 smoke/validate。
- [x] 运行完整 Stage 5 smoke、Stage 4/5 离线 validate，并在 smoke 结束后关闭容器。
- [x] 保持 P0/P1 和基础部署验收不变。

### 2. 发布证据

- [x] 用一个 CI artifact 上传 Stage 3、Stage 4 与五份 Stage 5 manifest。
- [x] 使用 `if: always()` 保留失败现场，缺失文件只警告而不掩盖原门禁结果。

### 3. 契约测试与文档

- [x] 扩展现有 deployment contract，锁定命令、顺序、artifact 名称和七个路径。
- [x] 同步 README、产品规划、架构和 Stage 5 运维手册。

### 4. 完整门禁

- [x] 运行 Python/Web 全量测试与生产构建。
- [x] 本地重新执行 Stage 3/5 Docker smoke 与离线 validate。
- [x] 完成 Standards/Spec 双轴复审并提交。

## 验证结果

- CI YAML 语法与 deployment contract：通过。
- Python：601 tests passed。
- Web：932 tests passed。
- `npm run build`：通过，仅保留既有 chunk size 提示。
- Stage 3 Docker smoke/validate：通过。
- Stage 5 Docker smoke、Stage 4/5 validate：通过并关闭容器；`reviewCount=0`、`authorizationEffective=false`、`liveBlocked=true`。
- 双轴复审修复：补入 Stage 4 独立 validator，并锁定五条命令顺序与 Stage 5 artifact 的 `if: always()`。
- 修复共享 Stage 5 测试夹具的固定日期过期问题，生产 24 小时 freshness 规则保持不变。

## 完成定义

- push/PR 不能在跳过 Stage 5 安全链时显示 quality gate 通过。
- 七份 manifest 可从 CI 单一 artifact 下载复核。
- CI 默认无凭据且全部 Sandbox/live/order 边界保持阻断。
