# Stage 4 Portfolio Paper Golden Path Design

## 目标

把仓库已有的组合回测、风险检查、纸面委托、人工审批、批量模拟成交、状态历史、账户回放与归档能力收口为一条正式、可恢复、可验收的 Stage 4 黄金路径。Stage 4 只处理 paper-only 组合生命周期，不连接真实券商，不创建真实订单，不开放 live route。

## 当前基础

仓库已经具备可复用的核心能力：

- `PortfolioBacktestEngine` 及静态权重、现金、回撤、集中度、风险贡献、协方差和相关性诊断。
- `PortfolioPaperOrderStore`、`PortfolioPaperOrderApprovalStore`、`PortfolioPaperOrderSimulationStore`。
- 组合委托、审批、批量模拟、状态历史与账户回放 HTTP API。
- Portfolio/Execution 中的组合草稿、风险模板、审批队列、模拟 route、状态时间线、账户和持仓视图。
- research export/import 对组合订单、审批、模拟与 replay 证据的携带和回读。

Stage 4 不复制上述模型，只增加产品编排、验收 manifest、归档门禁和阶段退出证据。

## 范围

### 包含

1. 从至少两个已审计、同市场、同周期的 research run 创建组合回测。
2. 固化本次组合使用的风险模板和确定性交易前检查。
3. 从组合回测生成 paper order batch。
4. 完成人工审批或记录稳定的拒绝原因。
5. 通过现有 batch simulator 生成幂等的 paper-only 模拟成交。
6. 回读订单状态历史、模拟账户、现金、持仓和盈亏。
7. 导出并重新读取完整组合证据包。
8. 生成 `aiqt.stage4PortfolioPaperAcceptance` manifest。
9. 提供 Docker、真实浏览器、归档回读和桌面 DMG 验收。
10. 全链通过后将 Stage 3 设为 maintenance、Stage 4 设为唯一 current。

### 不包含

- 新 VaR、压力测试或行业分类模型。
- 多组合目录、组合版本管理或共享服务。
- 新订单数据库或第二套模拟器。
- 自动审批、自动解除风控或失败后的补写式伪成功。
- secret store、真实券商、真实订单、live route 或资金连接。

## 架构

Stage 4 使用一个薄的黄金路径编排层组合现有 API：

```text
audited research runs
  -> portfolio backtest
  -> deterministic risk checks
  -> portfolio paper order batch
  -> operator approvals
  -> batch paper simulation
  -> order state history
  -> account and position replay
  -> export and archive readback
  -> Stage 4 acceptance manifest
```

编排层不拥有新的业务状态。持久化事实继续由现有 stores 负责；前端和 smoke 只根据这些事实派生步骤状态与验收结果。

## 数据与身份绑定

- 每个组合腿必须引用存在的 audited research run。
- 所有腿的 `market` 与 `timeframe` 必须相同。
- 权重必须为正，总和不得超过 100%；未分配部分保留为现金。
- portfolio run、base research run、paper batch、approval、simulation 与 replay 必须保持同一身份链。
- 风险模板及其检查结果必须进入可回读证据，不能只存在于页面草稿。
- 重复模拟同一已成交订单必须保持幂等，不能产生第二笔成交。

## 产品交互

Portfolio 工作区提供唯一的 Stage 4 启动入口，并按以下顺序展示五个步骤：

1. 组合构建。
2. 风险检查。
3. 人工审批。
4. 模拟成交。
5. 账户回放。

每一步只保留一个主动作。现有诊断、订单账本、报告、状态历史和签名证据作为可展开详情复用。Execution 工作区继续承担逐单审批和成交明细，不创建第二条组合启动流程。Audit 工作区负责 manifest、导出包与完整性回读。

刷新页面后，产品必须从持久化账本恢复当前批次、审批、模拟成交、状态历史和账户回放，不能依赖 React 临时状态重建“成功”。

## 失败处理

- audited run 缺失、上下文不一致、非法权重或数据质量不满足时，在组合回测前 fail closed。
- 风险拒绝和人工拒绝保存稳定原因，不自动改为通过。
- 缺少审批、route-risk 证据过期或 batch 身份错配时阻断模拟。
- 任一步失败保留已经持久化的账本，不补造后续步骤。
- export/readback 的数量、身份、hash 或 paper-only 边界不一致时，Stage 4 acceptance 失败。
- 所有错误输出继续执行 secret-safe 投影。

## 验收 Manifest

`aiqt.stage4PortfolioPaperAcceptance` 至少记录：

- schema、生成时间、源 research run 与 portfolio 标识。
- 组合腿、权重、现金权重及组合结果 hash。
- 风险模板 hash、检查总数、通过数和稳定拒绝原因。
- paper batch、审批序列、模拟成交序列及幂等检查。
- state history、现金、持仓、权益和 replay warning 数量。
- export/readback 完整性检查。
- `paperOnly=true`。
- `liveTradingAllowed=false`。
- `orderSubmissionEnabled=false`。
- `routeExecuted=false`。
- `liveBlockedBoundary=true`。

离线 validator 必须拒绝缺字段、身份错配、检查缺失、顺序错误、重复成交或任何 live/order 字段变为 true 的 manifest。

## 测试策略

1. 纯模型和状态机测试覆盖步骤派生、身份绑定、风险拒绝和幂等。
2. HTTP/API 测试覆盖黄金路径需要的现有端点合同和失败语义。
3. Docker Stage 4 smoke 在保留数据卷的容器中跑完整组合闭环并生成 manifest。
4. 离线 validator 复核 manifest，并包含字段突变负例。
5. 真实浏览器验证主路径、刷新恢复、错误状态和窄屏布局。
6. 最终执行完整 Python/Web/build、Stage 1/2/3 回归、Stage 4 smoke 和桌面 DMG 发布。

## 阶段退出标准

- 至少两个已审计标的完成组合 paper-only 闭环。
- 风险拒绝、人工拒绝、重复模拟和上下文错配均有确定性证据。
- 页面刷新后能够从持久化账本恢复完整流程。
- 导出包能保留并回读组合回测、订单、审批、模拟、状态历史和 replay 证据。
- Docker、浏览器、归档回读和 DMG 全部通过。
- 全链仍固定 paper-only，且不存在真实券商连接、真实订单或 live route。

只有这些条件全部满足，才能把 Stage 3 从 current 切换到 maintenance，并把 Stage 4 切为唯一 current。
