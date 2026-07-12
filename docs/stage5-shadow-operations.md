# Stage 5 Shadow Execution 运维手册

## 运行

先启动或复用 Docker 服务，再执行：

```bash
npm run docker:smoke:stage5 -- --no-build
npm run docker:smoke:stage5:validate
# 只执行第四阶段准入链路
npm run docker:smoke:stage5:readiness -- --no-build
npm run docker:smoke:stage5:readiness:validate
# 只执行第五阶段无凭据只读探针
npm run docker:smoke:stage5:readonly -- --no-build
npm run docker:smoke:stage5:readonly:validate
# 只执行第六阶段授权预检 fail-closed 门禁
npm run docker:smoke:stage5:authorization-preflight -- --no-build
npm run docker:smoke:stage5:authorization-preflight:validate
# 只执行第七阶段授权复核 fail-closed 门禁
npm run docker:smoke:stage5:authorization-review -- --no-build
npm run docker:smoke:stage5:authorization-review:validate
```

完整 smoke 会先生成 5 个独立 Stage 4 权威 workflow，执行五类确定性 Shadow 演练，再为已对账的 workflow 绑定真实持久化 terminal adapter paper evidence，生成 Sandbox 准入决策；随后调用服务端 CCXT 只读健康端点，并通过既有 execution/review API 持久化默认无凭据的 blocked probe 链，验证这些真实源事件既不能生成 Sandbox 授权预检，也不能补造授权复核。链路输出 `data/stage5-shadow-execution.json`、`data/stage5-sandbox-readiness.json`、`data/stage5-sandbox-readonly-probe.json`、`data/stage5-sandbox-authorization-preflight.json` 与 `data/stage5-sandbox-authorization-review.json`。所有 validate 命令都只离线复核 manifest，不访问网络。

## CI 发布门禁

GitHub Actions 在已有 Docker 镜像上依次运行 Stage 3 smoke/validate、完整 Stage 5 smoke、Stage 4 validate 和 Stage 5 validate。Stage 5 smoke 已内含 Stage 4 portfolio acceptance，并在结束时关闭容器；随后两个 validator 只读取 JSON。CI 不注入交易所密钥。每次运行都会上传 `stage5-release-manifests`，其中包含：

- `data/stage3-ai-review.json`
- `data/stage4-portfolio-paper.json`
- `data/stage5-shadow-execution.json`
- `data/stage5-sandbox-readiness.json`
- `data/stage5-sandbox-readonly-probe.json`
- `data/stage5-sandbox-authorization-preflight.json`
- `data/stage5-sandbox-authorization-review.json`

CI 失败时 artifact 仍会尽可能保留已生成的 manifest；缺失文件本身不会覆盖原始 smoke/validate 失败。下载后使用本页对应 validate 命令离线复核，不需要恢复数据卷或配置密钥。

## 预期结果

- `none`：attempt 1 为 `reconciled`，重复调用回读同一 session。
- `timeout_once`：attempt 1 为 `recoverable_failure`，attempt 2 为 `reconciled`，第三次调用回读 attempt 2；两次 attempt 的 `clientOrderId` 完全相同。
- `adapter_rejected`、`reconciliation_mismatch`、`kill_switch`：attempt 1 均为 `blocked`，重复调用回读同一 session；kill switch 演练必须为 `triggered=true`。
- 共 5 个独立 workflow、6 个唯一 session；blocked/completed 重复调用不增加审计事件。
- `restartReadback` 在 API 容器重启后精确回读 6 个 session 和同一 hash 集合。
- `exportReadback` 的首次导出、导入后再导出和 GET 回读数量均为 6，session hash 集合完全一致。
- manifest 保持六项安全边界，其中 `shadowOnly=true`，其余 live/order route 字段保持阻断。

Sandbox 准入 manifest 还必须满足：

- decision 状态固定为 `ready_for_manually_authorized_sandbox_phase`，重复 POST 回读同一 decision id/hash。
- decision 精确绑定同一 Stage 4 workflow、已对账 Stage 5 session、同市场 terminal adapter paper executions、有序证据 id，以及每笔 simulation 的 `symbol/side/quantity` 订单意图。
- API 重启后 decision hash 精确一致；导出、原子导入、再导出和 GET 回读均可重建同一证据。
- 缺 adapter event、adapter/market 错配、blocked session、不安全 adapter evidence 和 decision hash 篡改五类演练全部被阻断。
- `sandboxOrderSubmissionAllowed=false`；准入结论不能解锁 sandbox/testnet 下单。

只读 Sandbox 探针 manifest 还必须满足：

- `adapterId=ccxt-live`、`provider=ccxt`、`mode=sandbox`，默认无凭据状态只能是 review/blocked，不能伪造成 ready。
- key/secret/password 三项配置布尔值均为 false，报告内不包含任何密钥值、余额、持仓或账户标识。
- `metadata.readOnly=true`、`paperOnly=true`、`liveTradingAllowed=false`、`orderRoutingEnabled=false`。
- probe canonical digest 离线复核一致；任一边界、状态或 digest 篡改必须失败。

Sandbox 授权预检 manifest 还必须满足：

- readiness decision 存在，但默认只读 probe 为 blocked，预检 POST 必须返回 409。
- acceptance 引用真实持久化且状态为 `blocked` 的 probe execution/review id，并命中“必须为 recorded probe review”服务端 blocker。
- `preflightCount=0`，不能因人工确认、blocked 源或跨市场证据补造成功 artifact。
- `humanAuthorizationRequired=true`、`sandboxOrderSubmissionAllowed=false`，全部 live/order route 字段保持阻断。

Sandbox 授权复核 manifest 还必须满足：

- 完整授权预检 acceptance 有效，但默认环境的成功 `preflightCount=0`，review POST 必须返回 409。
- `reviewCount=0`，不能从不存在、blocked、过期或错配的 preflight 补造人工批准或拒绝记录。
- `authorizationEffective=false`、`humanAuthorizationRequired=true`、`sandboxOrderSubmissionAllowed=false`，全部 live/order route 字段保持阻断。

## 页面操作与恢复

Execution 工作区始终只提供一个 Stage 5 主动作：先启动/重试 Shadow 验证；最新 session 已对账后，主动作切换为“生成 Sandbox 准入决策”。Settings 的 Sandbox 探针执行继续复用原卡片；“只读握手”和“账户快照已脱敏”是禁用的服务端派生项，不能手工勾选。记录时 API 执行探针，结果展示 probe id、exchange、status/hash 摘要；刷新后从审计账本恢复。页面不提供密钥输入、故障绕过或下单动作。

readiness decision、同 adapter/market 的 ready probe execution 和已记录 probe review 同时存在时，唯一主动作切换为“生成 Sandbox 授权预检”。成功后只显示 preflight hash 与“仍需独立人工授权”；缺少或错配证据时提示回到 Settings，不能绕过。当前 A 股 readiness 不会与 `ccxt-live + crypto` 探针拼接。

授权预检存在且尚未复核时，唯一主动作切换为“记录 Sandbox 授权复核”。操作者选择批准或拒绝并填写原因，服务端固定校验五项范围确认；成功后页面显示 outcome、reviewer、review hash 和 `authorizationEffective=false`。首次结果不可改写，刷新只从 GET 恢复；批准不会出现下单、激活或密钥动作。

导出包的 `manifest.artifactCounts.stage5ShadowSessions`、`stage5SandboxReadinessDecisions`、`stage5SandboxAuthorizationPreflights` 与 `stage5SandboxAuthorizationReviews` 必须分别匹配合法审计事件数量。预检存在时导出还必须携带其引用的脱敏 probe execution/review；核心按依赖顺序重建，任何数量、身份、时间、hash、自洽字段或安全边界篡改都会在写库前阻断。Audit 专属行会按与 Python 相同的 canonical JSON 规则验证完整 SHA-256。

## 故障处理

- `stage5_shadow_workflow_not_found`：先完成 Stage 4 workflow 归档。
- `invalid_stage5_shadow_session`：检查 workflow hash、failure mode 和请求字段。
- `stage5_sandbox_readiness_blocked`：读取响应中的 `blockers`；补齐或修复权威 source evidence，禁止绕过后补造 decision。
- `stage5_sandbox_readiness_adapter_evidence_missing`：组合模拟引用的 terminal adapter audit event 不存在或未进入导出包；停止准入和导入，检查原始 AuditEventStore。
- `sandbox_probe_execution_authoritative_health_missing/invalid/not_ready`：权威探针缺失、hash/结构无效或未达到 ready；检查 ccxt 安装、测试网环境变量、sandbox mode、网络和只读账户权限，禁止用前端勾选绕过。
- 默认 Docker 只读探针返回 blocked/review：这是预期 fail-closed 结果，不是发布故障，也不能描述为测试网已连通。
- adapter/market 错配或不安全字段：拒绝准入，保留原事件用于审计，不允许通过修改内联 snapshot 伪造通过。
- source evidence 距 decision 超过 24 小时：按 stale 阻断；重新执行权威 Shadow/terminal paper evidence 链，不修改旧时间戳续期。
- attempt 1 超时：使用完全相同的请求重试一次；不要更换 workflow hash 或订单身份。
- attempt 2 仍失败、对账错配或 kill switch 触发：停止；保留审计事件，禁止补造成功。
- 授权预检返回 409：核对 readiness 与 probe 的 adapter/market、探针状态、人工 review 和 24 小时 freshness；禁止替换 id 或跨市场拼接。
- 预检成功也不得提交订单；它只进入后续独立人工授权材料，不改变运行时 route 开关。
- 授权复核返回 409：核对精确 preflight hash、权威 health evidence 的 24 小时 freshness、复核人、原因和固定确认项；禁止改写旧 review 或用旧 preflight 续期。
- 复核 outcome 为 `approved` 也不得提交订单；`authorizationEffective=false` 是权威结果，不是等待前端打开的临时状态。
- 容器重启后 session 数量或 hash 不一致：停止导入与发布，保留命名卷，检查 `stage4_portfolio_workflow` 与 `stage5_shadow_execution_session` 事件；不要跳过坏记录。

## 安全边界

Shadow 路径的运行 adapter 仍是 `local-fake-shadow`。第五阶段额外允许 `ccxt-live` 进行明确的 sandbox/testnet 只读健康检查；第六阶段只绑定这些脱敏证据；第七阶段只记录人工复核结果。全链不保存账户数据，也不调用 create/cancel/order API。准入 decision、授权预检、授权复核和 acceptance manifest 继续固定 `sandboxOrderSubmissionAllowed=false`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`；复核额外固定 `authorizationEffective=false`。任何真实资金连接或委托都需要后续独立设计、人工授权和验收。
