# 正式策略实验密封唯一测试分区

## 决策

正式的长周期策略实验继续复用既有行情适配器、`OHLCVBar`、质量检查、规范化与内容哈希，不新增行情融合算法或执行状态机。它额外保存一个本地、不可变的 sealed dataset artifact：同一份连续 K 线在写入时一次性固定开发分区与测试分区，研究运行和候选排序只能读取开发分区；只有服务端选出的唯一 rank-1 候选可以通过一次性 CAS claim 读取测试分区。

这个决定只适用于需要未见 holdout 的正式实验，有限的普通研究运行仍遵循 ADR-0024，把完整规范 K 线嵌入研究快照。它有意扩展 ADR-0024 的“不开新行情仓库”边界，因为现有 `MarketDataCache` 会按时间戳覆盖记录，不能充当不可变证据；把完整 90 天数据嵌入源研究运行又会在候选冻结前暴露测试分区。sealed store 不是新的行情 source of truth：它不能刷新、合并或选择行情，只能从一次明确的适配器半开区间读取中物化、重验和回放。

研究快照继续区分两种哈希：`hash` 是实际可见开发 K 线的规范内容哈希，`snapshotHash` 由市场、标的、周期与该内容哈希派生；sealed dataset 的 manifest hash 单独位于 `sealedDataset.datasetHash`，承诺来源、区间、分区行数以及开发/测试/全量内容哈希，不能冒充 K 线内容哈希。

## 安全边界

- 首版只在本地部署启用；公网 tenant 没有隔离 store 时失败关闭。
- API 的 safe summary 不返回测试 K 线或测试内容哈希，研究详情也不嵌入测试分区。
- test claim 是按 dataset 唯一的原子写；读取 token 只能消费一次。失败的 winner 不再测试第二名，同定义 replay 只回读已持久化结果。
- P0、Experiment、Promotion、策略绑定、监控启动、立即评估与订单提交仍是独立操作。物化或读取数据不会绑定、启用、授权或下单。
- 自动交易若复核 sealed audit，只能从同一个 manifest 指向的开发分区重放；缺 store、身份漂移、内容哈希不一致或上下文不一致都失败关闭。

## 验收

1. 90 天 BTC/USDT 1m 数据按不超过 500 根分页物化，连续性、来源、半开边界、行数及三类内容哈希可在重启后重验。
2. 源研究和候选阶段只读取开发分区；唯一 winner 仅一次读取测试分区，replay 的测试读取次数为零。
3. 正式盈利门失败时不保存为 audited 或 bindable；通过后仍需新的完整 P0 run、显式 promotion、显式 Paper 绑定和显式启动。
4. sealed audit 的绑定保守重放与研究使用同一 `BacktestEngine` 和策略评估器；普通 v1 inline snapshot 的 revision、哈希与绑定语义保持不变。
5. 全量后端测试、Web 测试与构建、Docker 回读和 Paper-only 运行边界通过后才发布。
