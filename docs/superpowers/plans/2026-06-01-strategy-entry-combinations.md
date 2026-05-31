# Strategy Lab 入场条件组合计划

## 背景

后端 `StrategyConfig.entry_conditions` 和回测引擎已经支持多个入场条件同时满足，当前前端 Strategy Lab 只暴露主条件和成交量确认。用户在策略工坊里仍无法直接配置常见的“价格趋势 + RSI 动量确认 + 成交量确认”组合。

## 用户任务

用户可以在 Strategy Lab 里把主入场条件和 RSI 确认、成交量确认组合成一个可审计草稿，例如 `Close > SMA5 AND RSI14 > 55 AND Volume > VOL10`。套用或编辑组合条件后，规则矩阵、就绪闸门、后端策略解析和回测审计都使用同一组结构化条件。

## 范围

- 扩展前端 `StrategyRuleDraft`，新增入场 RSI 确认开关、窗口和阈值。
- 组合条件输出稳定的 snapshot 文本，并能从已有审计文本恢复到可编辑草稿。
- Strategy Lab UI 增加 RSI 确认控件，和成交量确认并列作为入场过滤器。
- 后端测试覆盖 SMA + RSI + 成交量三条件解析。
- 更新 i18n、CSS、布局源测试、产品规划和架构说明。

## 非目标

- 不做任意数量条件树或 OR 逻辑。
- 不做拖拽规则编排。
- 不改变后端回测引擎的 AND 语义。

## 测试计划

- 前端模型测试：启用 RSI 确认会生成 `Close > SMA20 AND RSI14 > 55`。
- 前端模型测试：组合文本能恢复为主 SMA、RSI 确认和成交量确认字段。
- 后端契约测试：`Close > SMA5 AND RSI14 > 55 AND Volume > VOL10` 解析为三个 entry conditions。
- 布局源测试：Strategy Lab 源码和 CSS 包含 RSI 确认控件。
- 全量验证：`npm test`、`npm run build`、`git diff --check`、5173 页面响应检查。

## 状态

- [x] 计划写入
- [x] 红灯测试补齐
- [x] 模型和后端解析验证
- [x] UI 控件和 i18n/CSS 实现
- [x] 文档更新
- [x] 自动化验证

## 验证记录

- `npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "RSI confirmation|combined SMA"`：通过，2 个组合条件模型测试通过。
- `npm run test --workspace @aiqt/web -- layout-css.test.js -t "strategy lab"`：通过。
- `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k combined_sma`：通过。
- `npm test`：通过，Python 73 个测试和 Web 199 个测试通过。
- `npm run build`：通过，Vite 仅提示 chunk size warning。
- `git diff --check`：通过，仅 Windows 换行提示。
- `Invoke-RestMethod http://127.0.0.1:5173/?workspace=strategy`：开发服务返回 Vite HTML；浏览器自动化连接仍被本地沙箱阻断，未完成点击式烟测。
