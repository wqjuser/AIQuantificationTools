# Stage 0 CI Artifact Node 24 收口实施计划

## 状态

已完成。设计依据：[Stage 0 CI Artifact Node 24 收口设计](../specs/2026-07-13-stage0-node24-artifact-gate-design.md)。

## 工作项

### 1. 发布契约

- [x] deployment contract 要求 `actions/upload-artifact@v7`。
- [x] deployment contract 拒绝 `actions/upload-artifact@v5` 和 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`。
- [x] 保留六个 artifact 名称、路径与 `if: always()`。

### 2. Workflow 收口

- [x] 六个上传步骤统一升级到 v7。
- [x] 删除 Node 24 强制运行兜底。
- [x] 不改变现有质量门禁命令、顺序或权限。

### 3. 验证与交付

- [x] 运行聚焦 deployment contract、全量 Python/Web 和生产构建。
- [x] 运行 Docker 基础 smoke 与 Stage 8 smoke/validate。
- [x] 同步 README、产品规划、架构和 CONTEXT。
- [x] 完成 Standards/Spec 独立审查，两个维度均为 PASS。
- [x] 完成提交、推送、PR 和远端门禁。

## 本地验收结果

- deployment contract：12 tests passed。
- Python：638 tests passed。
- Web：944 tests passed。
- `npm run build`：通过。
- Docker 基础 smoke：通过。
- Stage 8 Docker smoke/validate：通过，`restartExact=true`、`liveBlocked=true`。
- 独立审查：Standards PASS、Spec PASS；初审发现的两项问题均已修复并复审通过。
- PR #12 quality-gate、CodeRabbit、GitGuardian：通过；CodeRabbit 的一项契约补强建议已修复并复审通过。
- GitHub Actions 六个 v7 artifact 上传步骤：全部通过；check run annotations 为空，Node 20 弃用告警已消失。

## 明确不做

- 不增加 action wrapper、额外 job 或 artifact 配置层。
- 不处理 Vite chunk、Stage 9 或任何 live/order 能力。
