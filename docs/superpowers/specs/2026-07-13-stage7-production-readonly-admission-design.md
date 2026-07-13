# Stage 7 生产只读准入设计

## 状态

已确认并进入实施。Stage 7 是生产环境只读准入，不是实盘授权。

## 目标

在 Stage 6 Binance Spot Testnet 已退出的基础上，用同一套 CCXT、审计账本和安全门禁验证 Binance Spot 生产环境的只读认证、市场元数据、API Key 权限与脱敏账户摘要。全程保持 `liveTradingAllowed=false`、`orderRoutingEnabled=false`、`liveOrderSubmitted=false`、`liveRouteExecuted=false` 与 `liveBlockedBoundary=true`。

## 固定边界

- 交易场所固定为 Binance Spot 生产环境；不支持 Futures、杠杆、保证金、第二交易所或多账户。
- 只读取 `CCXT_PRODUCTION_READONLY_API_KEY` 与 `CCXT_PRODUCTION_READONLY_SECRET`，不回退到 Sandbox、exchange-specific 或通用 CCXT 变量。
- 生产连接不得调用 `set_sandbox_mode`，且必须固定 `defaultType=spot`。
- 私有调用顺序固定为 API Key 权限检查在前、账户余额读取在后。
- 权限检查必须确认 Spot/Margin/Futures/Options 交易、提现和内部/通用转账能力均关闭；任一权限字段无法权威确认时 fail closed，不读取账户摘要。
- 只允许 `load_markets`、可选 `fetch_time`、Binance API restrictions 和 `fetch_balance`。订单、成交、账本、充值地址、转账、提现及任何 mutation API 均禁止。
- 对外响应、审计事件和 manifest 只保存权限布尔值、账户类型、非零资产数量、市场数量、时间和错误类别；不保存资产名称、余额、订单、成交、原始响应或密钥。
- 操作者必须确认其账户与访问位置符合服务资格；平台只记录确认事实，不代替法律或交易所资格判断。

## 权威输入

生产只读探针必须绑定：

1. 已通过校验的 `aiqt.stage6ExitAcceptance`；
2. 同一 `ccxt-live` adapter 的 `route_review_recorded` 生产路由复核；
3. 本次操作者资格确认；
4. API 服务中的完整专用只读凭据对。

任一输入缺失、过期、错绑或无效时不得访问生产私有 API。production route review 只在其 `recordedAt` 后 24 小时内有效，并且必须继续绑定非空 maintenance window、`crypto` 市场和 `live` route。

## 复用设计

- 复用 `execution_adapter_health.py` 的 CCXT 加载、能力检查、计时、脱敏错误与状态汇总，不创建第二套探针算法。
- 复用 `AuditEventStore` 记录 `stage7_production_readonly_probe`，保存 canonical payload 与 SHA-256。
- 复用现有 `execution_adapter_production_route_review`，不增加同义审批模型。
- API 沿用标准库 handler；Web 只展示状态和人工触发动作，不接收或显示密钥。
- Docker 无密钥门禁确定性证明 fail closed；真实生产只读验收只在人工环境运行，不进入默认 CI。

## API 与状态

- `POST /api/execution/stage7/production-readonly-probes`：输入 `productionRouteReviewId`、`operator`、`eligibilityConfirmed`，服务端校验 Stage 6 exit 和复核证据后执行探针并入账。
- `GET /api/execution/stage7/production-readonly-probes?limit=20`：回读并重新校验最近证据。
- 状态为 `ready`、`review` 或 `blocked`。缺密钥、权限可交易/提现/转账、错误环境或权威输入无效必须为 `blocked`。

探针证据固定包含：生产环境、只读、权限已验证、是否读取账户摘要、市场数量、非零资产数量、检查项、阻断原因、hash 和全部 live-blocked 字段。

## Docker 与退出标准

默认 CI 只运行无生产凭据门禁，证明没有生产私有网络调用、没有通用凭据回退、没有订单能力。Stage 7 退出还需要一次人工真实生产只读验收，证明专用 Key 的交易/提现/转账权限关闭、账户摘要脱敏、API 重启与审计回读一致；缺少真实 manifest 时 Stage 7 保持 current。

## 明确不做

- 不创建、查询、撤销或同步生产订单与成交。
- 不实现生产委托授权、生产 kill switch 或真实资金限额。
- 不显示资产名称、余额或账户历史。
- 不自动修改 API Key 权限、IP 白名单或交易所账户设置。
- 不引入通用 broker interface、消息队列、后台轮询器或 secret store。
