# Stage 0 CI Artifact Node 24 收口设计

## 状态

已完成。本阶段只清理 GitHub Actions artifact 上传的 Node 20 兼容告警，不创建 Stage 9，不改变任何产品或交易能力。

## 问题

当前 CI 已使用 Node 24、`actions/checkout@v6`、`actions/setup-node@v6` 和 `actions/setup-python@v6`，但六个验收清单上传步骤仍使用 `actions/upload-artifact@v5`。该版本默认运行时仍是 Node 20，因此每次质量门禁都会产生弃用 annotation，并依赖 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` 强制迁移。

GitHub 官方 `actions/upload-artifact@v7` 已原生使用 Node 24；现有上传步骤只使用 `name`、`path` 和 `if-no-files-found`，不依赖 v7 新增的直接上传模式，因此无需改变 artifact 合同。

## 目标

1. 六个上传步骤统一使用 `actions/upload-artifact@v7`；
2. 删除不再需要的 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`；
3. 复用现有 deployment contract，锁定 v7、拒绝 v5 和临时强制运行变量；
4. 保持 artifact 名称、路径、`if: always()`、检查顺序和上传时机不变；
5. 通过 PR 远端门禁证明六类 artifact 仍全部上传成功且不再出现 Node 20 action annotation。

## 固定边界

- 不新增 workflow、job、脚本、依赖或 action wrapper。
- 不改 Docker、P0/P1、Stage 5/6/7/8 smoke 与 validate 命令。
- 不改 manifest 内容、hash、路径或保留策略。
- 不处理 Vite 大 chunk；它属于前端模块边界问题，不能靠本阶段抬高 warning 阈值掩盖。
- 不新增 Stage 9、生产订单、资金操作或 live route。

## 验收

- deployment contract 聚焦测试通过；
- 全量 Python/Web、生产构建通过；
- Docker 基础 smoke 与 Stage 8 smoke/validate 通过；
- PR quality-gate、CodeRabbit 与 GitGuardian 通过；
- 远端 quality-gate 六个 artifact 上传步骤成功，且 annotations 中不再出现 `actions/upload-artifact@v5` 的 Node 20 弃用提示。

## 明确不做

- 不引入可配置 action 版本。
- 不迁移到自托管 runner 或 GHES。
- 不拆分前端巨型模块或调整 bundle 预算。
