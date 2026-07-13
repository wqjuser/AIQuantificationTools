# Stage 0 CI Artifact Node 24 收口实施计划

## 状态

审查中。设计依据：[Stage 0 CI Artifact Node 24 收口设计](../specs/2026-07-13-stage0-node24-artifact-gate-design.md)。

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
- [ ] 完成 Standards/Spec 独立审查、提交、推送、PR 和远端门禁。

## 明确不做

- 不增加 action wrapper、额外 job 或 artifact 配置层。
- 不处理 Vite chunk、Stage 9 或任何 live/order 能力。
