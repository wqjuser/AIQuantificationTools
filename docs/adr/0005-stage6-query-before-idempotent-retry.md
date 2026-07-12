# Stage 6 未知提交状态先查询再重试

Stage 6 遇到提交超时或断线时，先使用 Stage 5 已有稳定 `clientOrderId` 查询交易所。已存在则接管该订单；确认不存在时最多用同一 ID 重试一次；仍无法确定则进入 `reconciliation_required` 并停止批次。禁止生成新 ID 盲目补单，从而避免重复委托且不引入新的幂等编号体系。
