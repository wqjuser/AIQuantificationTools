# Stage 9 生产委托准入准备设计

## 目标

Stage 9 只回答“这一批已在 Sandbox 完成终态对账的订单，当前是否具备进入后续生产试单授权讨论的证据”，不回答“是否允许下单”。阶段产物是一次性候选和一次不可改写的具名人工复核；两者均固定 `authorizationEffective=false`，不创建生产订单能力。

## 权威输入

- 同一 `baseRunId` 的 Stage 4 canonical workflow；
- 已批准且在 Binance Spot Testnet 完成终态对账的 Stage 6 批次授权；
- 当前为 `current` 的 Stage 8 生产只读连续性；
- Stage 7 已配置的专用生产只读凭据，仅用于市场规则、价格和候选资金充分性检查。

候选绑定 workflow hash、Stage 6 authorization hash、Stage 8 continuity hash 和精确订单 hash。任何来源缺失、导入为 detached、时间过期或内容漂移都直接阻断，不允许手填订单补链。

## 首版包络

- 仅 Binance Spot 单一专用现货账户；
- 仅 `BTC/USDT`、`ETH/USDT`；
- 仅 GTC limit；
- 每批 1–2 笔；
- 单笔名义金额不超过 10 USDT，批次不超过 20 USDT；
- 不支持 Futures、Margin、多账户、多交易所、自动改价、自动缩量或拆单。

## 只读检查

候选生成和人工复核各执行一次当前生产只读观察：

1. 重新加载公开市场规则，检查精度、最小数量、最小价格和最小金额；
2. 买单参考 ask、卖单参考 bid；报价不超过 30 秒，逆向偏离不超过 1%；
3. 使用专用只读凭据检查按订单顺序累计的可用资金；
4. 审计只保留逐单布尔结论、参考价格和时间，不保留资产余额、资产列表或交易所原始响应。

生产规则漂移只会阻断，不会改写已审计订单。

## 候选与复核

候选有效期固定 10 分钟。同一 Stage 6 授权、连续性和候选观察在有效期内幂等回读；过期后必须生成新候选。复核要求实名复核人、批准或拒绝结论、非空理由和五项固定确认，并重新检查 Stage 8 连续性、市场、价格和资金。一个候选只有一个由 candidate hash 派生的 review id，已有复核不可覆盖。

Stage 8 `revoke / restore` 是唯一准入急停。revoke 后复核在生产网络访问前失败；Stage 9 不创建第二套 kill switch。

## 审计、恢复与退出

候选和复核写入现有 `AuditEventStore`，进入研究运行导出包，并由 manifest 分别计数。导入时重验 exact schema、SHA-256、事件绑定和候选来源链，然后标记 detached；导入副本只供 Audit 回放，Execution 不把它恢复为权威。

退出验收覆盖确定性成功、无凭据 fail closed、连续性漂移、候选过期、detached 阻断、API 重启精确回读和固定 live-blocked 边界。退出不要求生产账户入金，也不使用生产交易凭据。

## 不在范围

- 生产订单创建、查询、撤销、同步或成交读取；
- 交易、转账、提现权限或生产交易凭据；
- 真实资金委托和 live route；
- 后台轮询、自动再定价、自动恢复或账户级全局许可。
