# Frontend Paper Data Quality Gate

## Goal

把后端 Paper Trading 数据质量硬闸门同步到前端工作台：用户在提交模拟委托前，就能在 Risk Approval、Paper Trading 和 Promotion 队列中看到数据质量是否允许执行交接。

## Scope

- `buildRiskApprovalSummary` 增加 `data-quality` gate。
- `paperCanStage` 必须要求审计 run 的 `dataQuality` 完整、来源可信且 rows 为正数。
- `buildPaperTradingRows` 通过已有 approval blocked 分支展示数据质量阻断原因。
- `buildPromotionReadiness` 继续复用风险审批摘要，保持与后端 handoff 校验一致。
- `local-cache + isComplete=true` 允许进入 paper staging；`demo-fallback`、`unknown`、缺失或 `isComplete=false` 保持 blocked。

## Out Of Scope

- 修改后端 API。
- 页面布局调整。
- 新增真实交易适配器。
- 数据源自动修复。

## TDD Checklist

- [x] RED: incomplete data quality 的 audited run 前端风险审批和 paper rows 应保持 blocked。
- [x] GREEN: 前端风险审批加入 data quality gate。
- [x] VERIFY: targeted frontend tests, full tests, build, diff check。
- [x] VERIFY: 浏览器烟测 Market 工作区仍可加载真实 K 线和缓存状态。
