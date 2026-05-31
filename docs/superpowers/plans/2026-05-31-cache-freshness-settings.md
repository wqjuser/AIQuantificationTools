# Cache Freshness In Settings

## Goal

在 Settings 的本地行情缓存上下文清单里增加 freshness 判断，让用户能快速看到缓存是 `fresh`、`stale` 还是 `empty`。这一步保持只读，不引入刷新、删除或修复动作。

## Design

- `MarketDataCache` 继续只提供事实：上下文、行数、起止时间。
- `settings.py` 根据 `endTimestamp`、`timeframe` 和生成时间计算 freshness：
  - 无结束时间或无数据行：`empty`
  - 日线在 96 小时内：`fresh`
  - 分钟线在 24 小时内：`fresh`
  - 超过阈值：`stale`
- 前端契约要求每个 `cache.contexts[]` 都有 `freshness` 和 `ageHours`。
- Settings UI 在缓存上下文条目里显示 freshness，先不提供任何副作用操作。

## Out Of Scope

- 交易日历感知。
- 自动刷新队列。
- 缓存删除、修复、重建。

## TDD Checklist

- [x] RED: 后端 Settings freshness 测试先失败。
- [x] RED: 前端 Settings 契约缺 freshness 时先失败。
- [x] GREEN: 实现后端 freshness 和 ageHours。
- [x] GREEN: 实现前端契约与 UI 标识。
- [x] VERIFY: targeted tests, full tests, build, diff check, Browser smoke.
