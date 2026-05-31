# Market Cache Refresh Entry

## Goal

把刚接入的缓存刷新能力从 Settings 扩展到 Market 工作区，让行情中心直接承担“查看当前行情数据质量 + 刷新当前标的缓存”的任务。

## Scope

- Market 工作区的数据源健康面板显示当前所选标的/周期的本地缓存状态。
- Market 工作区提供“刷新当前缓存”按钮，复用 `POST /api/cache/refresh`。
- 刷新成功后更新 Settings 状态，并重新加载当前图表 K 线。
- Settings 仍保留逐上下文刷新入口，Market 只刷新当前上下文。

## Out Of Scope

- 批量刷新自选列表。
- 自动刷新任务和后台队列。
- 删除、修复或重建缓存。
- 新增图表布局重构。

## TDD Checklist

- [x] RED: Market 工作区布局契约先要求数据源健康面板暴露缓存刷新入口。
- [x] GREEN: Market 工作区接入当前缓存状态和刷新按钮。
- [x] VERIFY: targeted tests, full tests, build, diff check.
- [x] VERIFY: 浏览器烟测 Market 工作区刷新入口；若本地浏览器桥接失败，记录原因。
