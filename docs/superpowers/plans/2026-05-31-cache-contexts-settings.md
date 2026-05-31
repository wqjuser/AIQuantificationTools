# Cache Contexts In Settings

## Goal

让 Settings 工作区不只显示 SQLite 缓存总行数，还能看到最近缓存的市场、标的、周期、行数和时间范围。这个能力是后续行情中心“缓存检查、刷新、修复工具”的只读前置版本。

## Scope

- `MarketDataCache` 增加按 `market/symbol/timeframe` 聚合的上下文清单。
- `/api/settings/status` 在 `cache.contexts` 中返回最多 8 个最近更新的缓存上下文。
- 前端 Settings 契约校验 `cache.contexts`，缺失时降级。
- Settings UI 紧凑展示缓存上下文，不新增任何有副作用按钮。
- 更新产品规划和架构文档。

## Out Of Scope

- 缓存删除、重建、修复。
- 后台数据刷新队列。
- API Key 编辑或保存。

## TDD Checklist

- [x] RED: 后端缓存上下文聚合测试先失败。
- [x] RED: 前端 Settings 契约缺少 `cache.contexts` 时先失败。
- [x] GREEN: 实现缓存上下文聚合和设置接口输出。
- [x] GREEN: 实现前端契约与 UI 展示。
- [x] VERIFY: targeted tests, full tests, build, diff check, Browser smoke.
