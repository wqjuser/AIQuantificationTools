# Market Watchlist Cache Refresh

## Goal

把行情中心从“刷新当前标的”继续推进到“准备整个自选列表的数据上下文”，让用户在进入研究和策略前可以一次性刷新当前周期下的自选 K 线缓存。

## Scope

- API 客户端提供批量刷新 helper，按给定顺序复用 `POST /api/cache/refresh`。
- Market 工作区数据源健康面板显示自选缓存摘要。
- Market 工作区提供“刷新自选缓存”按钮，刷新当前 watchlist 的所选周期。
- 批量刷新完成后回写 Settings 状态，并重新加载当前图表。

## Out Of Scope

- 后端新增批量接口。
- 后台任务队列、并发限流和定时刷新。
- 自选列表增删改持久化。
- 缓存删除、修复和重建。

## TDD Checklist

- [x] RED: API 客户端批量刷新测试先失败。
- [x] RED: Market 布局契约先要求自选缓存刷新入口。
- [x] GREEN: 实现批量 helper、面板摘要和刷新按钮。
- [x] VERIFY: targeted tests, full tests, build, diff check.
- [x] VERIFY: 浏览器烟测 Market 工作区自选缓存刷新入口。
