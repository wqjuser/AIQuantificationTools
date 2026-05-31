# Cache Refresh In Settings

## Goal

把 Settings 的本地缓存上下文从只读状态推进为可操作工具：用户可以对某个市场、标的、周期触发行情刷新，核心服务重新拉取 K 线、写入 SQLite 缓存，并返回最新缓存健康状态。

## Scope

- 新增本地核心 `POST /api/cache/refresh`，输入 `market/symbol/timeframe/limit`。
- 刷新动作复用现有 K 线适配器和 `MarketDataCache.upsert_bars`，不绕过数据源质量标识。
- 响应返回刷新摘要、数据质量和最新 Settings 状态。
- 前端 API 客户端提供缓存刷新函数，并校验响应契约。
- Settings UI 在缓存上下文条目上提供刷新按钮，刷新后更新 Settings 状态。

## Out Of Scope

- 自动定时刷新。
- 批量刷新全部缓存。
- 删除、修复或重建 SQLite。
- 交易日历感知刷新策略。

## TDD Checklist

- [x] RED: 后端 cache refresh API 测试先失败。
- [x] RED: 前端 cache refresh 客户端契约测试先失败。
- [x] GREEN: 实现后端刷新端点。
- [x] GREEN: 实现前端客户端和 Settings UI 入口。
- [x] VERIFY: targeted tests, full tests, build, diff check.
- [x] VERIFY: 本地核心重启后，`POST /api/cache/refresh` 对 `ashare/600000/1d` 返回刷新摘要、数据质量和最新 Settings 状态。
- [ ] VERIFY: 浏览器烟测 Settings 刷新入口被本地 in-app browser 桥接的 Windows sandbox startup error 阻断，下一次 UI-heavy 切片前需要先恢复浏览器桥接。
