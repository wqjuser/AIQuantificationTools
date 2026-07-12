# Stage 6 使用最小持久化订单状态机

Stage 6 订单状态固定为 `authorized → submission_pending → open / partially_filled → filled / canceled / expired`，异常分支仅为 `rejected` 或 `reconciliation_required`。任何外部提交前先持久化 `submission_pending`；重启发现非终态时按原 `clientOrderId` 查询恢复。交易所原始状态和成交数量保留为证据，但不复制 CCXT 状态机。
