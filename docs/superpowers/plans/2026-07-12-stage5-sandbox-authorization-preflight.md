# Stage 5 Sandbox 授权预检实施计划

## 状态

已完成。

设计依据：[Stage 5 Sandbox 授权预检设计](../specs/2026-07-12-stage5-sandbox-authorization-preflight-design.md)。

## 任务

### 1. 权威预检模型

- [x] 在现有 `stage5_shadow.py` 增加最小 preflight builder、exact validator、canonical hash 和审计事件投影。
- [x] 绑定 readiness decision、probe execution/review 的身份、市场、adapter、时间和安全边界。
- [x] 覆盖幂等、缺证据、blocked/stale、错配、hash/HMAC 和自洽篡改。

### 2. API、恢复与便携审计

- [x] 增加 POST/GET `/api/execution/sandbox-authorization-preflights`，只接受最小身份与范围确认。
- [x] 回读时从 AuditEventStore 重新验证全部上游证据。
- [x] 将 preflight 纳入研究包 artifact count、原子导入、回滚和 Audit 专属 readback。

### 3. Execution 产品闭环

- [x] 复用现有 Stage 5 卡片和 Settings probe history，形成单一预检主动作。
- [x] 缺少 ready probe/review 时明确路由到 Settings；成功后显示 hash 与仍需人工授权边界。
- [x] 刷新后从服务端恢复，不增加浏览器授权状态。

### 4. Docker 与完整门禁

- [x] 增加 `aiqt.stage5SandboxAuthorizationPreflightAcceptance`，默认无凭据环境证明 fail closed 且无成功 artifact。
- [x] 增加离线 validator、独立 npm 脚本并纳入 Stage 5 总门禁。
- [x] 运行 Python/Web 全量测试、生产构建、Stage 3/5 smoke 与 validate。

### 5. 文档、复审与提交

- [x] 同步 README、产品规划、架构和 Stage 5 运维手册。
- [x] 完成 Standards/Spec 双轴复审并修复问题。
- [x] 提交一个 Stage 5 第六阶段 commit。

## 验证结果

- Python：600 tests passed。
- Web：931 tests passed。
- `npm run build`：通过，仅保留既有 chunk size warning。
- Stage 3 Docker smoke/validate：通过。
- Stage 5 Docker smoke/validate：通过；5 drills、6 sessions、readiness blockers 5、真实 blocked probe execution/review、`preflightCount=0`。
- Standards/Spec 双轴复审：Critical 0、Important 0、Minor 0。

## 完成定义

- Stage 5 readiness 与权威 probe 不再依赖人工拼接。
- 只有服务端重验通过的同一证据链能生成可恢复预检。
- 无凭据、网络失败或任意证据篡改都保持 fail closed。
- `sandboxOrderSubmissionAllowed=false`、`orderSubmissionEnabled=false`、`liveTradingAllowed=false` 不变。
