# 未验证策略只能进入显式 Paper 前向试跑

## 决策

正式盈利门失败、尚未读取唯一 test 分区或样本量不足的策略，不能保存为 `audited`，不能进入正式 promotion，也不能沿用 ADR-0028 的生产策略绑定。操作者仍可在明确承认“收益未经验证”的前提下，把一个 `draft` 策略版本和与其完全一致的完整 sealed development 研究运行绑定为 `forward_trial`，用于收集新的 Paper 前向证据。

前向试跑不是正式实验的替代路径。策略库记录保持 `draft` 且 `auditRunId=null`；运行绑定单独固定策略 revision、source run、sealed development 内容哈希、规范配置哈希、操作者和证据哈希，并投影 `profitabilityStatus=unverified_forward_trial`、`paperOnly=true`。Paper 成交、收益和一周汇总不得写回正式 experiment、test claim、promotion evidence 或生产审计身份。

## 安全边界

- 绑定入口只接受 `{strategyRevision, sourceRunId, operator, confirmed}`，浏览器不能上传策略正文、收益指标或运行模式。
- 服务端只接受当前部署可执行的结构化 policy、完整且质量合格的 sealed development run；策略库正文、source run 正文、revision、市场、标的、周期和内容哈希必须完全一致。
- 服务端必须以固定 `initialCash=10`、每边 `feeBps=10`、`slippageBps=10` 用同一 BacktestEngine 精确重放 development 证据；只有收益率大于 0、最大回撤不超过 3% 且至少有 1 次非 `end_of_backtest` 的自然完整往返时才允许前向试跑。该弱门只阻止明显亏损、无成交或低估成本的草稿，不能冒充正式盈利门。
- 绑定只允许在 `paper + paused + flat + no pending` 且初始、现金、可用现金和权益均为 10 USDT、已实现盈亏与本 session 成交数均为 0 的干净账本上完成；绑定动作本身不得隐式重置账户。完成后仍保持暂停，启动监控是后续独立的 `{"enabled":true}` 操作。
- `forward_trial` 在配置、评估、撮合和路由层都只允许 Paper；Testnet、Live、Stage 10、外部委托准备和订单提交全部失败关闭。
- 每轮评估重新核验 draft 记录和 source run。证据漂移时停止新增风险；不能把旧 decision、最近成交或前端缓存冒充当前绑定。
- 试跑不会读取或 claim sealed test。正式盈利门将来仍须使用预注册、唯一 holdout、固定成本、滚动窗口和邻域稳定性独立完成。
- Paper 收益只按策略权益盯市报告，不构成未来收益保证。到期暂停不强制平仓；若仍有持仓，同时报告已实现和未实现收益。

## 本次应用

旧 `BTC Cost-Aware Range Reversion v1` 已形成 42 根锚点的持久化 draft，必须保留原 revision 和回读语义，不能原地改写。它的权威 P0 development 运行 `run-ecee9434c20f` 为 0 收益、0 成交；此前出现少量正收益的是连续递归指标的早期诊断，不能作为该 draft 的绑定证据。2026-08-10 操作者明确要求完成策略并启用，因此新建判别 kind `cost_aware_range_reversion_v1_1`、显示名 `BTC Cost-Aware Range Reversion v1.1`，只允许该版本的固定中心参数 `entryZThreshold=-2.0` 在重新通过 development 弱门后建立本地 Paper 前向试跑；不得标记为已审计或已证明盈利，也不得切换 Testnet 或 Live。

## 验收

1. canonical、P0、Backtest 和 Auto Paper 共用同一策略配置、评估器、状态转移、撮合与 sizing，不复制第二套信号算法。
   v1.1 把最近 139 根完整 4h K 线固定为 EMA6/EMA42 与 ATR14 的有限重启锚点，未满 139 根时必须保持 warmup；连续运行和任意时刻重建的 context、指标与决策身份必须相同。139 由 EMA42 初始化差异剩余权重低于 1% 的约束预先确定，不来自收益搜索。旧 v1 的 42 根 canonical profile 继续只读回放，不能下转或绑定到 v1.1 前向试跑。
2. 绑定前后均证明 Paper、暂停、空仓、无 pending、外部路由阻断；绑定完成后策略身份与 source run 证据固定。
3. 启动请求只改变 `enabled`；Paper 决策能够在重启后恢复，任何非 Paper 模式都在外部调用前阻断。
4. 一周后先保存快照再暂停，按初始 10 USDT 报告权益收益率、已实现盈亏、未实现盈亏、费用、成交和持仓。
