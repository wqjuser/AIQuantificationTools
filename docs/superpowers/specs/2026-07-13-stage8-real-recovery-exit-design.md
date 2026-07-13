# Stage 8 生产只读真实恢复退出设计

## 状态

已完成并通过真实退出验收。该退出验收补全 Stage 8 的真实恢复证据，不新增 Stage 9，不开放生产订单能力。

## 问题

Stage 8 的无凭据 Docker 门禁已经证明 revoke 可在生产网络前阻断、无效 restore 会被拒绝并可跨重启回读；但退出证据尚未证明在已有真实 Stage 7 只读探针和当前 route review 时，平台能完成一次完整的 revoke、restore、新探针和重启恢复。

## 目标

扩展现有 `tools/stage8_production_readonly_continuity_acceptance.py`，在人工真实环境中复用现有 API 完成：

1. 起始 continuity 必须为 `current`；
2. revoke 入账后 Stage 7 必须在网络前返回 409；
3. restore 必须绑定起始探针使用的当前 production route review；
4. restore 后重新运行 Stage 7 生产只读探针；
5. 新 continuity 必须恢复为 `current`，并引用新 probe 和 active control；
6. API 重启后 probe、control 与 continuity 来源 hash 精确回读；
7. 输出可离线验证且完全脱敏的真实恢复 manifest。

## 固定边界

- 只使用现有 Stage 7/8 API、模型、`AuditEventStore` 和 Compose 数据卷。
- 请求文件只包含 `productionRouteReviewId`、`operator`、`eligibilityConfirmed`，不包含密钥。
- manifest 只保存 probe/control/continuity 身份与 hash、权限布尔值、市场数量和脱敏账户摘要。
- 不修改、轮换或撤销 Binance API Key，不访问生产订单、成交、转账或提现接口。
- 始终固定 `productionReadOnly=true`、`liveTradingAllowed=false`、`orderRoutingEnabled=false`、`liveOrderSubmitted=false`、`liveRouteExecuted=false`、`liveBlockedBoundary=true`。
- 真实模式不进入默认 CI；CI 继续运行无凭据 Stage 8 门禁，并对真实 manifest validator 与命令合同做测试。

## 失败语义

- 起始 continuity 非 current、route review 漂移、revoke 未阻断、restore 失败、新 probe 非 ready、权限出现 mutation、重启 hash 漂移或边界异常时，验收失败。
- revoke 后任一步失败时，本地状态保持 fail closed；脚本不伪造 restore 或成功 manifest。
- 等价重复请求继续服从现有 Stage 8 幂等规则。

## 明确不做

- 新业务模型、store、API、页面或后台任务。
- 自动 route review、Key 轮换、IP 白名单修改或告警。
- 生产订单状态机、kill switch、成交同步、资金限额或 live route。
