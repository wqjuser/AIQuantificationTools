# BTC/USDT Cost-Aware Range Reversion v1.1 本地 Paper 前向试跑

## 启动身份

- 目标：本地 `http://127.0.0.1:5173`
- 运行模式：Paper-only `unverified_forward_trial`
- 策略：`BTC Cost-Aware Range Reversion v1.1`
- revision：`d24a37e2e199`
- source run：`run-3b5ccef0dd25`
- sealed dataset：`sealed-0e2c733a4984999b7122e8dc`
- binding：`strategy-binding-da331de55170`
- paper session：`paper-session-ba62f49206f844bda0c73fd265104010`
- 启动：2026-08-10 17:29:01 Asia/Shanghai（09:29:01 UTC）
- 计划收官：2026-08-17 17:29:01 Asia/Shanghai（09:29:01 UTC）

本试跑只收集新鲜 Paper 行情驱动证据，不是正式盈利认证。策略库状态保持 `draft`、`auditRunId=null`，`formalGatePassed=false`；sealed withheld 未申领、未读取。

当前 Codex 任务已经挂载 2026-08-16 的公网 RSI 周测单次 heartbeat；产品只允许同一任务存在一个活动 heartbeat，因此本地收官任务没有覆盖既有任务，也没有以 standalone cron 绕过限制。后端运行不依赖 Codex 窗口，会持续监控；若届时没有另建 heartbeat，需要在上述计划收官时间人工执行本文件的收官流程。

## Development 弱门证据

- 数据：Binance `BTC/USDT · 1m`，108,540 根 development K 线，0 缺口
- 初始资金：10 USDT
- 单边手续费：10 bps
- 单边滑点：10 bps
- 收益：`+1.5332%`
- 最大回撤：`0.4018%`
- 完整往返：1
- 自然往返：1
- 自然退出：`z_score_mean_reached`

样本只有一次往返，远低于正式 development 至少 30 次的门槛。该结果只能证明冻结实现能产生一次正收益自然往返，不能证明未来有正期望。

## 运行规则与额度

- 原始数据为连续已完成 1m K 线，按 UTC 聚合完整 4h 决策 K 线。
- 最近 139 根完整 4h K 线重建 EMA6/EMA42、ATR14 与 Z-score；未满 139 根保持 warmup。
- 中心入场阈值固定为 `Z <= -2.0`，恢复确认窗口 3 根 4h；退出包括 Z 回到 0、区间关闭、2.5×ATR 固定止损或最长持有 18 根 4h。
- 仓位上限为权益 60%，单次风险预算为权益 1.5%，每日亏损上限 2%，策略最大回撤 3%，每小时最多一个交易组。
- `maxEntryNotionalQuote=null`、`exitNotionalCapQuote=null`：盈利后不会继续固定在 10 USDT 名义额，但买入仍受可用现金、60% 仓位、1.5% 风险和 Binance 最小数量/名义额约束；退出卖出完整管理仓位。

## 启动后证据

启动响应与首次两个后台周期均满足：

- `executionMode=paper`
- `enabled=true`
- `paperOnly=true`
- `liveTradingAllowed=false`
- `orderSubmissionEnabled=false`
- `routeExecuted=false`
- `liveBlockedBoundary=true`
- Testnet、Sandbox 下单与路由均未启用
- Stage 10 生产证据过期，生产控制未激活
- 初始现金、可用现金与权益均为 10 USDT，空仓、0 成交、无 pending

首次冷缓存周期于 2026-08-10 17:29:54 Asia/Shanghai 完成，评估到 17:28 的完整 1m K 线，规则结果为 `HOLD / conditions_not_met`。下一周期正常前进到 17:29 K 线并返回 `HOLD / no_new_complete_decision_bar`；runner 无错误，未产生订单。

## 收官口径

计划收官时先读取并保存暂停前快照，再只发送 `{"enabled":false}` 暂停监控。不得强制平仓，不得触碰 Testnet、Live、Stage 10 或外部订单路由。

最终报告同时列出：

- `收益额 = 最终权益 - 10`
- `收益率 = (最终权益 - 10) / 10 × 100%`
- 现金、权益、持仓、已实现与未实现盈亏
- 手续费、成交数、最大买入和最大卖出名义金额
- pending、runner 与全部 Paper-only 安全边界

若收官时仍有持仓，收益按暂停前权益盯市，不冒充已实现清算收益。
