# Stage 8 产品阶段状态收口设计

## 状态

实施中。本阶段只修复产品阶段模型与已交付事实不一致的问题，不启动 Stage 9。

## 问题

README、产品规划、Stage 7/8 代码与真实验收都已经确认 Stage 0 至 Stage 8 全部进入 maintenance，当前没有自动激活的新阶段；但前端 `terminal-workbench.ts` 的唯一产品阶段模型仍停在 Stage 6，并把 Execution 工作区显示为 `Stage 6 current`。这会让运行中的产品状态与权威发布事实相矛盾。

## 目标

复用现有 `ProductDevelopmentStage`、`buildProductDevelopmentStages`、`buildProductWorkAreas` 和 i18n 映射完成最小收口：

1. 在既有阶段模型中补齐 Stage 7 生产只读准入与 Stage 8 生产只读连续性；
2. 将 Stage 6、Stage 7、Stage 8 全部标记为 maintenance；
3. 让 Execution 工作区引用最新已交付的 Stage 8，而不是已退出的 Stage 6；
4. 保证当前阶段集合为空，等待后续单独路线设计；
5. 用现有前端测试、生产构建和 Stage 8 Docker 回归证明运行时与发布事实一致。

## 固定边界

- 不新增阶段状态 store、API、页面、组件或依赖。
- 不改变 Stage 6/7/8 业务模型、审计证据、真实验收 manifest 或运维动作。
- 不连接交易所，不访问生产账户，不创建、查询、撤销或同步生产订单。
- 不读取成交，不执行转账或提现，不开放 `liveTradingAllowed`、`orderSubmissionEnabled` 或 live route。
- Stage 9 的名称、目标和授权边界继续待单独设计。

## 验收

- 阶段顺序精确为 Stage 0 至 Stage 8；
- `current` 阶段数量为 0；
- Execution 工作区显示 Stage 8 maintenance；
- 中英文 Stage 7/8 标签均由现有 i18n helper 返回；
- 全量 Python/Web、生产构建和 Stage 8 Docker smoke/validate 通过。

## 明确不做

- 不用 planned 占位阶段伪造 Stage 9。
- 不增加通用阶段注册表或动态配置系统。
- 不修改生产只读凭据、route review、revoke/restore 或探针行为。
