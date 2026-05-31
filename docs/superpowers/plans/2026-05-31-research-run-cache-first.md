# Research Run Cache First

## Goal

把行情缓存从“图表兜底”推进到“研究流水线兜底”：当外部 K 线源离线或只返回 incomplete fallback 时，`/api/research/run` 也能优先使用本地 SQLite `MarketDataCache` 中的同一上下文 K 线继续完成回测、AI 解释和审计记录。

## Scope

- `run_terminal_research` 读取行情时接入 `MarketDataCache` fallback。
- 适配器异常时，如果本地缓存存在，审计 run 的 `dataQuality.source` 和 `dataSnapshot.source` 标记为 `local-cache`。
- 适配器返回 incomplete fallback 时，如果本地缓存存在，研究流水线改用本地缓存。
- 只有完整真实上游数据会写入缓存；`local-cache` 和 incomplete fallback 不再重复写入或污染缓存。
- 保持现有 `ResearchRunAudit`、`researchRun.dataSnapshot` 和前端契约不变。

## Out Of Scope

- 新增批量研究任务队列。
- 自动刷新过期缓存。
- 多标的组合回测。
- 前端布局或交互调整。

## TDD Checklist

- [x] RED: 适配器离线但 SQLite 缓存有数据时，研究流水线应完成并记录 `local-cache` 数据质量。
- [x] GREEN: 实现 cache-first/fallback 读取并避免 incomplete fallback 入库。
- [x] VERIFY: targeted backend tests, full tests, build, diff check.
- [x] VERIFY: 本地服务健康，浏览器烟测 Market 工作区可加载真实 K 线、缓存状态和无控制台错误。
