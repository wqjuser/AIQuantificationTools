# Market Klines Cache First

## Goal

让行情中心的缓存刷新不只是状态展示，而是进入图表数据读取链路：当外部 K 线源不可用或只能返回 demo fallback 时，`/api/market/klines` 优先用本地 SQLite 缓存返回真实历史 K 线。

## Scope

- `/api/market/klines` 调用外部适配器失败时读取 `MarketDataCache`。
- 外部适配器返回 incomplete fallback 时，若本地缓存存在，也改用 `local-cache` 数据质量。
- 只有完整真实数据会写入 SQLite 缓存，避免 demo fallback 污染本地缓存。
- 返回 payload 仍保持现有 OHLCV schema 和 `quality.isComplete` 契约。

## Out Of Scope

- 后端新增批量 K 线接口。
- 自动修复过期缓存。
- 研究流水线 cache-first 改造。
- 前端布局变更。

## TDD Checklist

- [x] RED: `/api/market/klines` 在适配器不可用时应从 SQLite 缓存返回 K 线。
- [x] GREEN: 实现 cache-first/fallback 读取并避免写入 incomplete fallback。
- [x] VERIFY: targeted backend tests, full tests, build, diff check.
- [x] VERIFY: 浏览器烟测 Market 工作区仍能刷新并显示缓存来源。
