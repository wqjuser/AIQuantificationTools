# Stage 5 Sandbox 授权复核实施计划

## 状态

已完成并通过完整门禁。

设计依据：[Stage 5 Sandbox 授权复核设计](../specs/2026-07-12-stage5-sandbox-authorization-review-design.md)。

## 任务

### 1. 权威复核模型

- [x] 在 `stage5_shadow.py` 增加最小 review builder、exact validator、canonical hash、确定性 id 和审计事件投影。
- [x] 复用 preflight 与权威 probe source loader，校验 24 小时 freshness、固定确认项及不可变安全边界。
- [x] 覆盖批准、拒绝、幂等、stale、错配、篡改和不可变结果。

### 2. API、恢复与便携审计

- [x] 增加 POST/GET `/api/execution/sandbox-authorization-reviews`。
- [x] GET 与重复 POST 从精确 review id 回读并完整重建全部上游证据。
- [x] 纳入研究包 artifact count、导出导入、原子回滚和 Audit readback。

### 3. Execution 产品闭环

- [x] 在 Stage 5 单一卡片增加 outcome、reason 和一个复核提交动作。
- [x] 成功显示 review hash、outcome 和 `authorizationEffective=false` 边界。
- [x] 刷新后从服务端恢复，不在浏览器保存授权状态。

### 4. Docker 与完整门禁

- [x] 增加 `aiqt.stage5SandboxAuthorizationReviewAcceptance` 和离线 validator。
- [x] 默认无凭据容器用真实 blocked probe 链证明 review POST 被拒绝且 `reviewCount=0`。
- [x] 运行 Python/Web 全量测试、生产构建、Stage 3/5 smoke 与 validate。

### 5. 文档、复审与提交

- [x] 同步 README、产品规划、架构和 Stage 5 运维手册。
- [x] 完成 Standards/Spec 双轴复审并修复问题。
- [x] 提交一个 Stage 5 第七阶段 commit。

## 验证结果

- Python：601 tests passed。
- Web：932 tests passed。
- `npm run build`：通过，仅保留既有 chunk size 提示。
- Stage 3 Docker smoke/validate：通过。
- Stage 5 Docker smoke/validate：通过；`reviewCount=0`、`authorizationEffective=false`、`liveBlocked=true`。
- 双轴复审修复：Web exact guard 固定五项确认值与顺序；Audit store 使用原子 first-write-wins，阻断并发改写复核结果。

## 完成定义

- 人工批准或拒绝与精确 preflight hash 绑定且不可改写。
- 任意源证据缺失、过期或篡改都 fail closed。
- 批准复核仍固定 `authorizationEffective=false`、`sandboxOrderSubmissionAllowed=false`、`orderSubmissionEnabled=false` 和 `liveTradingAllowed=false`。
