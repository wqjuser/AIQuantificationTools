# Paper Execution Data Quality Gate

## Goal

把已审计数据质量纳入 Paper Trading 交接闸门：只有数据质量完整的审计 run 才能提交模拟委托或进入晋级队列。`local-cache` 可以作为完整缓存证据使用，但 `demo-fallback`、`unknown` 或 `isComplete=false` 的审计 run 必须保持阻断。

## Scope

- `validate_paper_execution_handoff` 增加 `data_quality` 校验。
- `POST /api/research/runs/{runId}/paper-executions` 对 incomplete/missing data quality 返回 `invalid_paper_execution`。
- `build_promotion_candidate` 继续复用同一 handoff 校验。
- 更新产品规划和架构文档，记录数据质量已成为执行交接闸门。

## Out Of Scope

- 前端布局和文案重排。
- 数据源自动修复。
- 实盘交易适配器解锁。
- 改变研究 run schema。

## TDD Checklist

- [x] RED: incomplete data quality 的审计 run 提交 paper execution 应被拒绝且不写入记录。
- [x] GREEN: handoff 校验加入 data quality 完整性检查。
- [x] VERIFY: targeted backend tests, full tests, build, diff check.
- [x] VERIFY: 浏览器烟测 Market 工作区仍可加载图表和缓存状态。
