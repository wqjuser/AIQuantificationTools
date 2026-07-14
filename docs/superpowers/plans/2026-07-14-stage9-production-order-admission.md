# Stage 9 生产委托准入准备实施计划

## 交付目标

在不增加任何生产写能力的前提下，交付“终态 Sandbox 批次 → 生产只读候选 → 不可改写人工复核 → 审计导出与 detached 回放 → Docker 发布门禁”的完整闭环，并在验收后把 Stage 9 转入 maintenance。

## 实施批次

1. 固化术语与决策：更新 `CONTEXT.md`，记录准入先于执行、市场漂移不改写订单、退出不要求生产入金三项 ADR。
2. 核心模型：新增候选观察、10 分钟候选、固定包络、一次性复核和 AuditEvent 转换，复用 Stage 4、Stage 6、Stage 8 validator 与 `AuditEventStore`。
3. API：提供候选和复核的 POST/GET；POST 从服务端权威来源重建，GET 拒绝 detached 权威并重验事件绑定。
4. 便携审计：把候选与复核纳入研究包计数、导入校验、来源链接和 detached 标记。
5. Execution/Audit：增加 Stage 9 卡片和候选到期刷新，复用现有 Stage 6 批次和 Stage 8 连续性；Audit 提供候选/复核专属只读行并标识 detached，不提供生产下单按钮或第二套急停。
6. 发布门禁：增加无凭据零制品、deterministic ready、规则/行情/价格/资金漂移、过期、真实 POST revoke/重复请求、detached、重启回读 Docker acceptance，以及带 CCXT 方法守卫、只允许纯资金不足安全阻断并重启回读的可选真实只读模式；接入 npm scripts、CI artifact 和中文运维文档。
7. 退出：全量 Python/Web 测试、Web build、Docker smoke/validate、独立代码审查全部通过后，同步 README、产品规划和架构，并把 Stage 9 标记 maintenance。

## 验收标准

- 候选只能由同一 Stage 4/6/8 权威链生成，订单数、市场、类型和金额符合首版包络；
- 候选和复核两次只读检查均通过，复核后 `authorizationEffective=false`；
- Stage 8 revoke、候选过期、连续性/市场/价格/资金漂移和 detached 导入均 fail closed；
- 研究包数量、事件身份、SHA-256 和来源链接可验证，导入后不能进入 Execution 权威路径；
- API 重启后 candidate/review hash 精确回读；
- `liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`orderRoutingEnabled=false`、`liveOrderSubmitted=false`、`liveRouteExecuted=false`、`liveBlockedBoundary=true`；
- 仓库中不存在生产订单创建、查询、撤销、成交、转账或提现调用。
