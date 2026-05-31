# Volume Confirmation Strategy Condition

## Goal

把策略草稿里的 `volume confirmation` 升级为可审计、可回测的结构化条件，避免 Strategy Lab/AI draft 显示成交量确认但回测引擎只执行 SMA 条件。

## Scope

- 后端 `strategy_config_from_snapshot` 从入场文本中解析成交量确认，生成 `volume_above_sma` 条件。
- 回测引擎支持 `volume_above_sma`，用当前成交量与成交量 SMA 窗口比较。
- 前端策略规则摘要能展示 `VOL{window}`，审计策略回放时可读。
- 产品计划和架构文档记录成交量确认已经进入结构化策略条件。

## Out Of Scope

- RSI 条件。
- 多条件可视化拖拽编辑器。
- 做空、组合或多标的回测。
- 实盘交易路由。

## TDD Checklist

- [x] RED: 策略快照里的成交量确认必须生成第二个入场条件。
- [x] RED: 回测引擎必须在成交量不足时阻止 SMA 入场。
- [x] GREEN: 实现解析和回测支持。
- [x] VERIFY: Python 测试、前端模型测试、全量测试、build、diff check、浏览器烟测。
