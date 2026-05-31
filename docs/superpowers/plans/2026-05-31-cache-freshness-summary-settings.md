# Cache Freshness Summary In Settings

## Goal

把 Settings 的缓存 freshness 从逐条上下文提升为顶层健康汇总，让用户不用逐条查看也能知道本地行情缓存是否存在过期或空数据。

## Scope

- `/api/settings/status` 在 `cache.freshnessSummary` 返回 `fresh/stale/empty` 三类计数。
- 前端 Settings 契约要求 freshness summary 存在，缺失时降级。
- Settings UI 在本地缓存行里显示新鲜、过期、空缓存数量。
- 继续保持只读，不新增刷新、删除、重建等动作。

## Out Of Scope

- 自动刷新缓存。
- 交易日历感知 freshness。
- 缓存修复和删除。

## TDD Checklist

- [x] RED: 后端 Settings freshness summary 测试先失败。
- [x] RED: 前端 Settings 契约缺 summary 时先失败。
- [x] GREEN: 实现后端 summary。
- [x] GREEN: 实现前端契约和 UI 展示。
- [x] VERIFY: targeted tests, full tests, build, diff check.
- [x] VERIFY: Settings status endpoint returns `cache.freshnessSummary` against a restarted local core service.
- [ ] VERIFY: Browser smoke is blocked by the local in-app browser bridge failing with a sandbox startup error; retry before the next UI-heavy slice.
