# Stage 6 使用账户级持久化 Kill Switch

Stage 6 只设置一个 Sandbox 账户级 kill switch，正常状态为 `enabled=true, triggered=false`。触发后立即阻止新批次、停止当前批次后续提交，并尽力撤销本系统创建的全部未成交委托。触发状态跨重启保持，完成对账后只能人工重置；单一交易场所阶段不增加策略级或订单级急停层次。
