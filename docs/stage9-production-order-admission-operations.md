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

候选与复核随研究运行包导出，manifest 使用 `stage9ProductionAdmissionCandidates` 和 `stage9ProductionAdmissionReviews` 计数。导入会重验 schema、hash、事件绑定和来源链，然后加上 `metadata.detached=true`。detached 事件可在 Audit 查看，但候选/复核 GET 不把它恢复到 Execution，POST 也不能引用它。

## Docker 验收

```powershell
npm run docker:smoke:stage9
npm run docker:smoke:stage9:validate
```

默认门禁使用独立 Compose 项目和临时数据卷，不读取宿主生产凭据、不访问生产网络。它验证两笔订单候选、不可改写非生效复核、无凭据 fail closed、连续性漂移、候选过期、detached 阻断、API 重启精确回读和全部 live-blocked 字段，结束后删除临时卷。2026-07-14 accepted manifest hash 为 `d3cf7d74677e02347fbc6d5c1d4e2e1c8c22370b84f862f99f8c8c45f2bf5d84`，报告文件 SHA-256 为 `47fa95a82ccb3355c2dc4b9121f3baeb491773d4b11985559784ca0251746aa2`。

## 明确禁止

- 不要把 review `approved` 解释为生产下单许可；
- 不要配置或探测已开启交易权限的 Key；
- 不要在日志或工单中粘贴密钥、资产列表、余额或原始交易所响应；
- 不要自动缩量、改价、拆单或绕过市场规则；
- 不要为 Stage 9 验收充值、转账或执行真实委托。
