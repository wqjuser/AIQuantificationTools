# Stage 5 权威只读 Sandbox 探针实施计划

## 状态

已完成；实现、全量测试、生产构建、Stage 3/5 Docker 门禁、文档同步、独立复审和提交收口均已完成。

设计依据：[Stage 5 权威只读 Sandbox 探针设计](../specs/2026-07-12-stage5-authoritative-sandbox-probe-design.md)。

## 任务

### 1. 固定脱敏权威证据

- [x] 在现有 `execution_adapter_health.py` 增加最小 evidence 投影、canonical hash、复用审计 key registry 的 authority HMAC 和 validator。
- [x] 只保存检查结果、配置布尔值和安全边界，不保存 secret、余额或账户标识。
- [x] 覆盖合法、安全字段篡改、hash 篡改和 acceptance 非法字段注入。

### 2. 绑定现有 probe execution

- [x] 让 `build_execution_adapter_sandbox_probe_execution` 接收并校验权威 health evidence。
- [x] 服务端派生只读握手与账户脱敏两项确认，忽略调用方同名布尔值。
- [x] API 只为 `ccxt-live + crypto` 执行现有 CCXT sandbox 探针；其它 adapter fail closed。
- [x] audit event 保存脱敏 evidence；成功事件回读时重新验证 evidence/hash。
- [x] 后续 probe review 拒绝缺失或无效的权威探针证据。

### 3. 收口 Settings 交互

- [x] 复用现有健康探针和 probe execution 卡片。
- [x] 两项服务端派生确认改为不可手工勾选。
- [x] 成功/阻断结果显示权威 probe 摘要，刷新后从账本恢复。

### 4. 验证与故障演练

- [x] Python focused tests：ready、缺凭据、adapter 错配、hash/HMAC/边界篡改、无订单调用和 acceptance 非法字段注入。
- [x] Web focused tests：typed response、服务端派生 UI、账本摘要。
- [x] 增加独立 Docker 只读探针 acceptance/validate；无凭据环境必须 fail closed 且 secret-free。
- [x] 运行完整发布门禁：Python 595/595、Web 930/930、`npm run build`、Stage 3 smoke/validate、Stage 5 smoke/validate 均通过；新增无凭据只读探针在 Docker 中按预期 blocked/fail-closed。

### 5. 文档与收口

- [x] 同步 README、产品规划、架构和 Stage 5 运维手册。
- [x] 独立 Standards/Spec 双轴复审：首轮 3 个 Important 已修复，复审 Critical 0、Important 0。
- [x] 提交一个 Stage 5 第五阶段 commit。

## 完成定义

- 人工请求不能再伪造只读握手或账户脱敏成功。
- 只有服务端实际执行且状态 ready 的 CCXT sandbox 健康证据能生成成功 probe execution。
- 探针失败仍有脱敏 blocked 证据，但不能进入后续 review。
- 浏览器、Audit 回读和 Docker 都保持 paper-only、sandbox order disabled、live blocked。
- 不新增 adapter/interface/store，不提交任何订单。
