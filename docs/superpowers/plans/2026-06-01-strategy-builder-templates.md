# Strategy Lab 策略模板计划

## 背景

Strategy Lab 已经支持 SMA、RSI 和成交量确认的结构化编辑，但用户仍需要逐项调参才能得到一个可运行草稿。产品规划里 P0/P1 都提到策略工坊需要参数模板，当前缺少这个入口。

## 用户任务

用户可以在 Strategy Lab 里一键套用常见策略模板，例如 SMA 趋势、RSI 反转、放量突破。套用后生成结构化草稿、规则矩阵、就绪闸门和审计快照，并清空旧审计证据，要求重新运行流水线。

## 范围

- 增加模型层策略模板列表和套用函数。
- 模板覆盖 SMA 趋势、RSI 反转、放量突破三类基础策略。
- Strategy Lab UI 增加模板选择区。
- 更新 i18n、CSS、布局源测试。
- 更新产品规划和架构文档。

## 非目标

- 不做用户自定义模板持久化。
- 不做模板市场或复杂参数搜索。
- 不自动运行回测；套用模板后仍需用户运行流水线形成审计证据。

## 测试计划

- 前端模型测试：列出三类策略模板。
- 前端模型测试：套用 RSI 模板会生成 RSI 入场/出场、仓位和风控草稿，并清空旧审计证据。
- 前端模型测试：套用放量突破模板会生成成交量确认入场。
- 布局源测试：Strategy Lab 源码和 CSS 包含模板选择入口。
- 全量验证：`npm test`、`npm run build`、`git diff --check`、5173 页面响应检查；浏览器连接被本地沙箱阻断时记录为验证限制。

## 状态

- [x] 计划写入
- [x] 红灯测试补齐
- [x] 模板模型实现
- [x] UI 控件和 i18n/CSS 实现
- [x] 文档更新
- [x] 自动化验证

## 验证记录

- `npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "template"`：通过，3 个模板测试通过。
- `npm run test --workspace @aiqt/web -- layout-css.test.js -t "strategy lab"`：通过。
- `npm test`：通过，Python 72 个测试和 Web 197 个测试通过。
- `npm run build`：通过，Vite 仅提示 chunk size warning。
- `git diff --check`：通过，仅 Windows 换行提示。
- `Invoke-RestMethod http://127.0.0.1:5173/?workspace=strategy`：开发服务返回 Vite HTML；浏览器自动化连接被本地沙箱阻断，未完成点击式烟测。
