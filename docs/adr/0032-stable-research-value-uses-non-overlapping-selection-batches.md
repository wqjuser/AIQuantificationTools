# 稳定研究价值使用非重叠选股批次与严格门槛

## 状态

Accepted

## 背景

候选数量、单次收益或密集重跑形成的相关样本都不能证明 AI 选股具有稳定研究价值。不同市场、风格、权重、Provider 或基准政策的结果也不能直接混合。

## 决策

统计样本单位固定为一次受保护 AI 选股批次，而不是同批最多 5 个候选。固定基准政策 v1 为 A 股 `000300`、美股 `SPY`、加密资产 `BTC/USDT`。批次 alpha 为可用推荐相对收益等权平均，固定 5 个推荐中至少 4 个有完整同周期基准才合格。

cohort 由 `market + profile + weightsVersion + providerIdentity + benchmarkPolicyVersion` 唯一确定。按时间顺序只把持有窗口不重叠的到期批次计入稳定性；重叠结果继续展示但不增加独立样本。

2026-08-04 补充：持有周期会改变收益观察窗口，不能在同一 cohort 中比较。因此 cohort 身份增加 `horizon`，完整身份为 `market + profile + horizon + weightsVersion + providerIdentity + benchmarkPolicyVersion`；历史审计记录保持不变，统计回放按其原始请求周期重新分组。

状态固定为 `insufficient_sample / collecting / stable_positive / not_stable`。只有同一 cohort 同时满足以下条件才显示“已证明稳定研究价值”：

- 至少 30 个非重叠到期批次；
- 覆盖至少 3 个自然月；
- 基准覆盖率不少于 80%；
- 相对命中率 95% Wilson 下界高于 50%；
- 批次中位 alpha 大于 0。

后台只复盘用户已经显式创建的选股，不调用 AI、不创建选股、不运行研究、不修改自选/观察池，也不连接订单。

## 结果

- 少量、重叠或缺基准样本不能产生稳定价值声明。
- 版本变化自动开启新 cohort，旧样本保留但不污染新规则。
- 稳定价值只证明研究优先级证据，不授权自动研究、自动观察池或交易。
