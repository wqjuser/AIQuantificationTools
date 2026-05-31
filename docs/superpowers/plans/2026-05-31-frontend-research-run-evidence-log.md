# Frontend Research Run Evidence Log

## Goal

让用户刚运行完研究流水线时，前端日志直接说明这次审计运行绑定了什么数据证据：K 线数量、周期、数据源、完整性、warning 数、策略 revision 和执行模式。这样 Market/Research/Backtest 的闭环更像真实产品，而不是只显示 “bars + paper_only”。

## Scope

- 新增可测试的 `researchRunEvidenceLogLabel` formatter。
- `App.tsx` 的流水线成功日志改用该 formatter。
- 对缺少 `dataQuality` 的旧运行保持兼容提示。
- 更新产品规划/架构文档，记录即时审计证据已经进入前端流水线日志。

## Out Of Scope

- 页面布局调整。
- 新增日志持久化表。
- 改变后端 API schema。
- AI provider 或实盘交易适配器。

## TDD Checklist

- [x] RED: formatter 应输出数据源、完整性、warning 数、策略 revision 和执行模式。
- [x] GREEN: 实现 formatter 并接入流水线成功日志。
- [x] VERIFY: targeted frontend tests, full tests, build, diff check.
- [x] VERIFY: 浏览器烟测 Market 工作区仍可加载真实 K 线和缓存状态。
