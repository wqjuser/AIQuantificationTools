# Stage 8 生产只读访问必须可本地撤销

Stage 8 在 Stage 7 生产只读探针前增加持久化的本地 `revoke / restore` 控制。revoke 不依赖外部证据并在构造生产 CCXT 连接前生效；restore 必须绑定最近 24 小时内有效的 `ccxt-live + crypto + live` production route review。控制事件只存在于当前 API 数据卷，不通过研究包恢复，也不自动修改 Binance API Key。选择这一边界是为了在泄露或权限异常时立即停止平台访问，同时继续禁止生产订单、成交、转账和提现。
