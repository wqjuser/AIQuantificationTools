# Research Run Evidence Summary

## Goal

让 `/api/research/run` 即时返回的 `workspace.researchRun` 不再只是 run id、行数和数据快照，而是携带前端工作流需要的一等审计证据：`dataQuality` 和 `strategyConfig`。这样刚跑完流水线时，Backtest、AI Review、Paper Trading 和风控闸门可以直接读取已审计的数据质量和结构化策略，而不必依赖可变草稿或二次详情请求。

## Scope

- 在后端 `ResearchRunSummary` 契约中加入 `data_quality` 和 `strategy_config`。
- `run_terminal_research` 创建 workspace summary 时填入 `_data_quality_payload(quality)` 和 `strategy_config_to_payload(strategy)`。
- 保持历史 run detail、导出包和现有前端字段命名不变。
- 新增/更新契约测试，确认即时 research run payload 与持久化 audit record 的数据质量和策略配置一致。

## Out Of Scope

- 前端布局调整。
- 新增 AI provider 或真实交易接口。
- 改变研究运行持久化 schema。
- 多标的组合策略配置。

## TDD Checklist

- [x] RED: 即时 `researchRun` payload 应包含 `dataQuality` 和 `strategyConfig`，并与审计记录一致。
- [x] GREEN: 扩展 `ResearchRunSummary` 和 `run_terminal_research` 填充逻辑。
- [x] VERIFY: targeted backend tests, full tests, build, diff check.
- [x] VERIFY: 浏览器烟测当前 Market 工作区仍可加载图表和运行上下文。
