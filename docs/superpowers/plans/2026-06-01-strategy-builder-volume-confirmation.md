# Strategy Lab 成交量确认控件计划

## 背景

后端和审计回放已经支持 `volume_above_sma`，也能把审计策略格式化为 `Close > SMA5 AND Volume > VOL10`。但 Strategy Lab 的结构化构建器目前只能编辑 SMA/RSI 条件，成交量确认仍然只能通过文本或审计回放间接出现。

## 用户任务

用户在 Strategy Lab 中可以直接打开入场成交量确认，并配置成交量窗口。保存版本、运行流水线、规则矩阵、就绪闸门和审计回放都应使用同一份结构化策略文本。

## 范围

- 扩展 `StrategyRuleDraft`，增加入场成交量确认开关和 VOL 窗口。
- `strategySnapshotFromRuleDraft` 在开关打开时生成 `... AND Volume > VOL10`。
- `buildStrategyRuleDraft` 能从已有策略快照恢复成交量开关和窗口。
- Strategy Lab UI 增加成交量确认 checkbox 和窗口输入。
- 更新 i18n、CSS、布局源测试和产品/架构文档。

## 非目标

- 不做出场成交量条件。
- 不做多条件 OR/AND 条件树。
- 不改后端回测逻辑；后端已经支持 `volume_above_sma`。

## 测试计划

- 前端模型测试：开启成交量确认后生成 canonical 快照和规则参数。
- 前端模型测试：已有 `Volume > VOL10` 快照能恢复到结构化草稿。
- 布局源测试：Strategy Lab 源码和 CSS 包含成交量确认控件。
- 全量验证：`npm test`、`npm run build`、`git diff --check`、浏览器烟测。

## 状态

- [x] 计划写入
- [x] 红灯测试补齐
- [x] 草稿模型实现
- [x] UI 控件和 i18n/CSS 实现
- [x] 文档更新
- [x] 自动化验证
