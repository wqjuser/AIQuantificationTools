# Strategy Lab RSI 构建器控件计划

## 背景

上一轮已经把 RSI 条件打通到后端解析、策略预检、回测和前端审计回放，但 Strategy Lab 的结构化构建器仍然只暴露 `Entry SMA` 和 `Exit SMA` 两个窗口输入。用户仍需要手写文本才能使用 RSI，这不符合 P0 “可视化策略配置”的目标。

## 用户任务

用户在 Strategy Lab 中可以通过结构化控件选择入场/出场条件类型，并配置 RSI 窗口和阈值。切换后生成的可审计快照、规则矩阵、就绪闸门、保存版本和运行流水线都使用同一份结构化文本。

## 范围

- 扩展前端 `StrategyRuleDraft`，支持 `rsi_below` / `rsi_above` 和阈值字段。
- `strategySnapshotFromRuleDraft` 能从结构化草稿生成 `RSI14 < 30` / `RSI14 > 55`。
- `buildStrategyRuleDraft` 能从已有 RSI 文本恢复 kind、window 和 threshold。
- Strategy Lab 增加入场/出场条件类型选择控件，并在 RSI 条件下显示阈值输入。
- 更新 i18n、CSS 和布局源测试，避免构建器仍停留在 SMA-only。
- 更新产品规划和架构说明。

## 非目标

- 不做图表 RSI 副图。
- 不做复杂条件树、OR 逻辑或拖拽表达式编辑器。
- 不改后端回测逻辑；后端 RSI 已在上一轮完成。

## 测试计划

- 前端模型测试：结构化草稿切换到 RSI 后生成可审计 RSI 快照。
- 前端模型测试：已有 RSI 快照能恢复到 `StrategyRuleDraft` 的 kind/window/threshold。
- 布局源测试：Strategy Lab 源码和 CSS 包含条件选择控件，不再只有 SMA 窗口输入。
- 全量验证：`npm test`、`npm run build`、`git diff --check`、浏览器烟测。

## 状态

- [x] 计划写入
- [x] 红灯测试补齐
- [x] 草稿模型实现
- [x] UI 控件和 i18n/CSS 实现
- [x] 文档更新
- [x] 自动化验证
