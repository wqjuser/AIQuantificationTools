# Stage 6 每个账户只允许一个活动批次

Stage 6 唯一 Sandbox 账户同时只允许一个非终态批次。只要批次仍有 `submission_pending`、`open`、`partially_filled` 或 `reconciliation_required` 订单，新批次就必须阻断；完成撤单或成交并对账后才释放账户。单账户测试网阶段不引入并发调度和余额预留系统。
