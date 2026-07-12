# Stage 5 Shadow Operations 第二阶段实施计划

## 目标

交付 Stage 5 shadow execution 的可操作与便携审计闭环：Execution 主入口、刷新恢复、专用 artifact accounting、原子导入、Audit 回读和 Docker 端到端验收。

## 实施任务

- [x] 阅读当前 Stage 5 代码、核心文档、近期提交和 Stage 4 复用入口。
- [x] 固定第二阶段范围与安全边界。
- [x] 扩展 research export/import：增加 `stage5ShadowSessions`，并要求包内 Stage 4 workflow 可权威重建每个 session。
- [x] 升级 Stage 5 acceptance manifest：加入 export/import/re-export/readback 数量与 hash。
- [x] 新增 Web exact typed client 与纯状态模型。
- [x] 在 Execution 工作区接入唯一 Stage 5 主动作、证据明细和刷新恢复。
- [x] 在 Audit 包浏览器与 import diff 中回读 Stage 5 session。
- [x] 补齐 focused tests、全量 Python/Web、生产构建和 375px 布局检查。
- [x] 重建 Docker，运行 Stage 3 维护门禁和 Stage 5 smoke/validate。
- [x] 同步 README、产品计划、架构与运维文档并提交。

## 完成标准

- Stage 5 session 不依赖 React 临时状态。
- 相同 workflow 的 `clientOrderId`、attempt 和 session hash 在导出导入后保持一致。
- malformed、重算 hash 的篡改和 artifact count 不一致全部在原子写入前失败。
- 全链固定 `paperOnly=true`、`shadowOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。
