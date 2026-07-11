# Stage 5 Shadow 退出与 Sandbox 准入第四阶段实施计划

## 状态

已确认并完成实施；最终门禁见本文完成定义与仓库验收命令。

## 目标

复用现有 Stage 4 workflow、Stage 5 shadow session、执行适配器 terminal paper evidence、`AuditEventStore`、研究包和 Docker runner，交付一个服务端权威、幂等、可恢复、可便携审计的 Sandbox 准入决策。

设计依据：[Stage 5 Shadow 退出与 Sandbox 准入第四阶段设计](../specs/2026-07-11-stage5-sandbox-readiness-gate-design.md)。

## 范围边界

- 当前运行 adapter 仍只有 `local-fake-shadow`。
- 准入只表示可以进入后续、单独人工授权的 sandbox adapter 阶段。
- 不连接 broker/testnet，不读取 secret，不同步账户，不提交或撤销订单。
- 不新增 adapter chain、订单 store、worker、队列或多实现 interface。
- 固定 `paperOnly=true`、`shadowOnly=true`、`sandboxOrderSubmissionAllowed=false`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。
- 测试采用风险驱动方式；不要求为形式而运行 RED，但每个新信任边界必须留下可执行 focused test，并完成全量门禁。

## 实施任务

### 1. 固定 readiness decision 合同

- [x] 在现有 Stage 5 模块增加最小 builder、validator、SHA-256 hash 和 audit-event 投影。
- [x] 复用 Stage 4、Stage 5 和 adapter paper execution 的现有 validator，不复制其业务规则。
- [x] 固定 decision identity、时间顺序、adapter/market 绑定和不可变安全字段。
- [x] 覆盖正常完成、超时第二次恢复、blocked session、缺失 adapter event、adapter/market 错配和安全字段篡改。

优先涉及文件：

- `services/quant_core/quant_core/stage5_shadow.py`
- `services/quant_core/tests/test_stage5_shadow.py`

### 2. 增加服务端权威 POST/GET

- [x] 新增 `POST /api/execution/sandbox-readiness-decisions`。
- [x] POST 只接受 workflow/session 身份字段和操作员确认，服务端从 simulations 派生并重验全部 terminal adapter events。
- [x] 缺失或错配返回结构化 blocker，不记录成功 decision。
- [x] 相同 `sessionHash + 有序 adapterPaperExecutionIds` 重复 POST 回读同一 decision。
- [x] 新增 GET 列表并在回读时重新验证全部依赖、时间和 hash。

优先涉及文件：

- `services/quant_core/quant_core/api.py`
- `services/quant_core/tests/test_stage5_shadow.py`

### 3. 接入研究包与 Audit readback

- [x] manifest 增加 `artifactCounts.stage5SandboxReadinessDecisions`。
- [x] 导入预检按 Stage 4 workflow、Stage 5 session、adapter evidence、readiness decision 的顺序重建。
- [x] 缺失依赖、identity/hash 不一致或安全边界篡改时原子拒绝。
- [x] Audit 包浏览器增加 exact guard、数量核对和 decision SHA-256 摘要。
- [x] 保持 adapter evidence 脱敏，不把 secret 带入导出包或浏览器。

优先涉及文件：

- `services/quant_core/quant_core/runs.py`
- `services/quant_core/tests/test_stage5_shadow.py`
- `apps/web/src/lib/terminal-workbench.ts`
- `apps/web/src/lib/terminal-workbench.test.ts`

### 4. 接入 Execution 唯一主动作

- [x] 复用 `stage5-shadow.ts` 增加 decision 类型、exact guard、POST/GET client 和刷新恢复状态。
- [x] 在 `ExecutionStage5ShadowSection` 增加唯一“生成 Sandbox 准入决策”动作。
- [x] reconciled session 才允许审查；blocked/recoverable session 不提供绕过入口。
- [x] 显示 adapter、terminal evidence id、decision hash 和“仍禁止下单”边界。
- [x] 显示服务端 blocker，中英文文案和 375px 布局同步。

优先涉及文件：

- `apps/web/src/lib/stage5-shadow.ts`
- `apps/web/src/lib/stage5-shadow.test.ts`
- `apps/web/src/components/ExecutionStage5ShadowSection.tsx`
- `apps/web/src/components/ExecutionStage5ShadowSection.test.tsx`
- `apps/web/src/lib/i18n.ts`
- 必要时最小调整 `apps/web/src/styles.css`。

### 5. 建立独立 acceptance manifest 与故障演练

- [x] 新增 `aiqt.stage5SandboxReadinessAcceptance` schemaVersion 1 validator。
- [x] 通过真实 HTTP 创建 Stage 4 workflow、reconciled Stage 5 session、现有 adapter terminal evidence 和 readiness decision。
- [x] 演练缺 adapter event、adapter/market 错配、blocked session、安全字段篡改和 decision hash 篡改。
- [x] 重启 API 容器，GET 精确回读 decision hash 集合。
- [x] 完成导出、原子导入、再导出和 API readback 对比。
- [x] 输出 `data/stage5-sandbox-readiness.json`，保留命名卷便于复核。

优先涉及文件：

- `tools/docker_smoke.py`
- `services/quant_core/tests/test_stage5_shadow.py`
- `package.json`
- `docker-compose.yml` 仅在现有命令无法复用时最小调整。

### 6. 分层验证

- [x] 运行 Stage 5 Python focused tests。
- [x] 运行 Stage 5/Web focused tests。
- [x] 运行全量 `npm test`：Python 593 项、Web 930 项通过。
- [x] 运行 `npm run build`。
- [x] 重建并运行 Stage 3 Docker smoke/validate 回归门禁。
- [x] 运行 Stage 5 第四阶段 Docker smoke/validate。
- [x] 浏览器验证阻断、刷新恢复、Audit 历史回读和 375px 布局；成功决策由组件测试与真实 Docker/API/readback 覆盖，浏览器控制台错误为 0。

### 7. 文档与提交

- [x] 同步 `README.md`、`docs/product-plan.md`、`docs/architecture.md` 和 Stage 5 中文运维文档。
- [x] 记录测试数量、Docker blocker drills、重启/readback/hash 和安全边界。
- [x] 检查不相关工作树改动并保持不动。
- [x] 以一个 Stage 5 第四阶段提交收口。

## 最终验收记录

- `npm test`：Python 593 项、Web 930 项通过。
- `npm run build`：通过；仅保留既有的大 chunk 提示。
- Stage 3 Docker smoke/validate：通过，外部 provider 失败仍不覆盖 deterministic local baseline。
- Stage 5 Docker smoke/validate：run `run-f17717f8dc30`，5 类 Shadow drills、6 个 session、1 个 readiness decision、5 类 blocker；`restartExact=true`、`portable=true`。
- 安全边界：`sandboxOrderSubmissionAllowed=false`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。

## 完成定义

- 一个通过的 decision 能从 Stage 4 workflow、Stage 5 session 和真实 terminal adapter event 完整重建。
- 缺证据、错配、blocked、stale 和自洽篡改不能生成成功 decision。
- 重复请求、API 重启、导出导入和浏览器刷新后 decision identity/hash 不变。
- Execution 与 Audit 能解释准入证据，但没有 sandbox 下单、真实交易或绕过动作。
- Stage 3 维护门禁、Stage 5 第四阶段 acceptance、全量测试和构建全部通过。
- 文档明确下一阶段才选择第二个 sandbox adapter，并单独进行人工授权。

## 用户确认点

确认后才进入实现。重点确认：

1. 是否接受第四阶段只生成 `ready_for_manually_authorized_sandbox_phase` 决策，不连接任何 sandbox/testnet。
2. 是否接受只有真实存在于 `AuditEventStore` 的 `execution_adapter_paper_execution` terminal event 才能通过，单纯内联 evidence 不足以晋级。
3. 是否同意暂不抽象 broker adapter interface，等下一阶段确定第二个 sandbox adapter 后再提取。
