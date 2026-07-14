# Stage 9 生产委托准入准备运维

## 目的与边界

Stage 9 对已完成终态对账的 Stage 6 Binance Spot Testnet 批次执行生产只读准入检查，并记录一次不可改写的具名人工复核。它不是生产下单授权：系统没有生产订单创建、查询、撤销、成交、转账或提现 API，所有 live/order 边界始终关闭。

## 前置条件

1. Stage 4 workflow 与 Stage 6 批次属于同一 `baseRunId`；
2. Stage 6 批次状态为 `reconciled`，每笔订单为 `filled` 或 `canceled`；
3. Stage 8 continuity 为 `current`；
4. API 服务已配置专用生产只读变量：
   - `CCXT_PRODUCTION_READONLY_API_KEY`
   - `CCXT_PRODUCTION_READONLY_SECRET`
5. Key 只允许读取，交易、提现和划转权限保持关闭；变量不得进入 Web bundle、Dockerfile、请求、响应、审计或导出包。

Stage 9 不使用生产交易 Key。生产账户无余额时，资金检查可以安全阻断；不得为了通过验收充值或扩大权限。

## 操作流程

1. 在 Execution 确认 Stage 6 为 `reconciled`、Stage 8 为 `current`；
2. 点击“生成生产委托准入候选”；
3. 检查订单包络、市场规则、报价偏离、资金布尔结论和 10 分钟到期时间；
4. 输入实名复核人和非空理由，选择批准或拒绝；
5. 保存 candidate hash 与 review hash。批准结论仍显示 `authorizationEffective=false`。

复核会重新访问生产只读市场和账户。候选过期、Stage 8 continuity hash 改变、报价超过 30 秒、逆向偏离超过 1%、市场规则不匹配或资金不足时返回 409，必须排查并生成新候选，不能改写旧候选。

## 急停

Stage 9 复用 Stage 8 的“立即撤销生产只读访问”。发现凭据泄露、权限变化、IP 白名单变化或未知访问时先执行 Stage 8 revoke，再在 Binance 撤销 Key并清理 API 服务变量。revoke 后 Stage 9 复核在生产网络访问前阻断。不要寻找或创建第二套 Stage 9 kill switch。

## API

```text
POST /api/execution/stage9/production-order-admission-candidates
GET  /api/execution/stage9/production-order-admission-candidates?baseRunId=...
POST /api/execution/stage9/production-order-admission-reviews
GET  /api/execution/stage9/production-order-admission-reviews?baseRunId=...
```

候选 POST 只接收 `authorizationId` 和 `operator`。复核 POST 只接收 `candidateId`、`reviewer`、`outcome`、`reason` 与五项固定确认。密钥、余额和交易所原始响应不属于请求契约。

## 导出与恢复

候选与复核随研究运行包导出，manifest 使用 `stage9ProductionAdmissionCandidates` 和 `stage9ProductionAdmissionReviews` 计数。导入会重验 schema、hash、事件绑定、canonical Stage 8 快照和来源链，然后加上 `metadata.detached=true`。Audit 的 Stage 9 专属只读面板会在运行时验证 exact contract 与事件绑定，并区分 `local · audit-only`、`detached · audit-only` 和 `invalid · audit-only` 行；候选/复核 GET 不把 detached 副本恢复到 Execution，POST 也不能引用它。

## Docker 验收

```powershell
npm run docker:smoke:stage9
npm run docker:smoke:stage9:validate
```

默认门禁使用独立 Compose 项目和临时数据卷，不读取宿主生产凭据、不访问生产网络。它验证两笔订单候选、不可改写非生效复核、无凭据 API fail closed 前后零制品、连续性漂移、候选过期、detached 阻断、API 重启精确回读和全部 live-blocked 字段，结束后删除临时卷。candidate/review 重复请求与 Stage 8 revoke 通过本地 HTTP handler 的真实 POST 路径验证，而不是只调用 builder；线程化回归测试另行覆盖并发幂等。通用审计写入口不能创建、预占或覆盖 Stage 9 权威证据，回读会重验事件绑定。2026-07-14 最新 accepted manifest hash 为 `d3c53eccd6e3689ddfde808dca1b1d68f90abda4af62268b7fd60347248605c3`，报告文件 SHA-256 为 `ac01b186bac1cc0223cca17494f854ef683011e80170582bf9b2f862356a94f5`。

确定性替身还覆盖生产规则缺失/漂移、31 秒陈旧报价、超过 1% 的不利价格、资金不足、Stage 8 revoke 网络前阻断，以及 candidate/review 重复请求精确回读。线程化测试会分别交错 Stage 8 revoke 与 Stage 7 probe、Stage 9 observation，验证三者共用本地低频 authority 锁，control 不能在检查和网络边界之间穿越；同一测试用 51 组候选/复核证明幂等查找不受展示分页限制。Stage 4→9 准入链及 adapter route review 来源的 type 与 ID 命名空间只能由专用 API 写入，通用 audit 和 handoff 自定义 event ID 都不能绕过校验；研究包导入会拒绝 production route review、Stage 7 probe、Stage 8 control 及跨 run event ID 冲突，不能恢复或覆盖生产 authority。无专用生产只读凭据时，即使存在通用或 Sandbox 变量也不会构造生产连接，且 `AuditEventStore.count()` 在阻断请求前后精确无增量，不依赖空卷或有上限的最近列表。manifest 在离线校验前先落盘，因此门禁失败时 CI 仍会上传故障证据。

可选真实只读验收不属于发布必跑项。先在 `data/stage9-production-admission-acceptance-request.json` 写入当前权威 Stage 6 authorization：

```json
{
  "authorizationId": "stage6-sandbox-auth-...",
  "operator": "具名操作人"
}
```

然后运行：

```powershell
npm run docker:smoke:stage9:real
npm run docker:smoke:stage9:real:validate
```

真实模式复用当前 API 数据卷、Stage 8 continuity 和专用生产只读凭据，并强制使用包含 `ccxt` 的 data-deps 镜像。运行时守卫被注入同一次权威 candidate POST，只允许 `load_markets`、本地精度换算、`fetch_ticker` 和 `fetch_balance`，任何其他 CCXT 顶层方法都会立即失败；结果判定同时要求方法轨迹、逐项 observation blocker 与 API blocker 精确对应。随后重启 API 并回读同一候选或零候选阻断结果。结果允许 `ready`，也允许仅因资金不足而安全 `funding_blocked`；混合 blocker、来源链、市场或价格阻断都会使验收失败。报告只保存候选 identity/hash、只读方法名或脱敏 blocker，不保存资产名称、余额、Key 或原始交易所响应。

2026-07-14 使用既有 Sandbox 授权执行的最终可选真实只读演练在权威 POST 前置校验中被正确阻断：该批次当前为 `reconciliation_required` 而不是 `reconciled`，因此生产网络调用数为零、没有生成候选，API 重启后仍为零候选；这不属于 accepted real-readonly 证据。需要 accepted 证据时，应先按正常 Stage 4/6 流程生成并终态对账新的权威批次，不能绕过前置校验、放宽价格阈值或给生产账户充值。

## 明确禁止

- 不要把 review `approved` 解释为生产下单许可；
- 不要配置或探测已开启交易权限的 Key；
- 不要在日志或工单中粘贴密钥、资产列表、余额或原始交易所响应；
- 不要自动缩量、改价、拆单或绕过市场规则；
- 不要为 Stage 9 验收充值、转账或执行真实委托。
