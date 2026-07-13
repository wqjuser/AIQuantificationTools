# Stage 8 生产只读连续性与撤销运维

## 目的与边界

Stage 8 把 Stage 7 的一次性生产只读证据变成可持续复核的本地运维状态，并增加跨 API 重启保持的人工撤销控制。它不运行后台轮询，不自动操作 Binance API Key，不创建、查询、撤销或同步生产订单，不读取成交，不执行转账或提现。

## 连续性状态

Execution 的 Stage 7 卡片会同时显示 Stage 8 状态：

| 状态 | 含义 | 处理 |
| --- | --- | --- |
| `current` | 最新 probe、Stage 6 exit、route review 和 24 小时新鲜度均有效 | 继续人工复核即可。 |
| `stale` | probe 存在，但 authority 或时间窗口已漂移 | 先在 Settings 重新记录 route review，再人工运行 Stage 7 probe。 |
| `blocked` | 最新 probe 被交易所、权限或安全校验阻断 | 按 Stage 7 失败分类修复，不能绕过。 |
| `revoked` | 本地访问控制已撤销 | 同时检查并撤销交易所 Key；恢复前必须有当前 route review。 |
| `missing` | 当前数据卷没有 Stage 7 probe | 按 Stage 7 运维流程首次运行。 |

`GET /api/execution/stage8/production-readonly-continuity` 每次都从 `AuditEventStore`、Stage 6 exit 和 route review 重新派生，不依赖浏览器状态。历史 Stage 7 probe 保留为审计事实；过期只改变当前连续性状态，不改写历史证据。

## 人工撤销

发现凭据泄露、IP 白名单变化、权限异常或未知访问时：

1. 在 Execution 输入非空原因，点击“立即撤销生产只读访问”；
2. 确认状态为 `revoked` 并保存 control hash；
3. 立即在 Binance 撤销对应 Key，清空 API 服务中的两项专用变量并重启；
4. 调查结束前不要执行 restore。

revoke 不需要 route review。Stage 7 POST 会在读取 Stage 6 清单、构造 CCXT exchange 或访问生产网络前检查该状态，revoked 时返回 `stage8_production_readonly_access_revoked`。

## 人工恢复

恢复只允许在以下条件全部满足后执行：

1. 已创建或轮换为专用只读 Key，全部交易、提现和划转权限关闭；
2. IP 白名单和访问资格已复核；
3. Settings 中存在最近 24 小时内的 `ccxt-live + crypto + live` route review；
4. Execution 输入非空恢复原因并点击“恢复生产只读访问”；
5. 恢复后再次人工运行 Stage 7 probe，直到 continuity 为 `current`。

缺少或过期 route review 的 restore 返回 409，原 revoked 控制保持不变。重复 revoke/restore 只回读当前等价控制，不生成重复事件。

## API

只读状态：

```text
GET /api/execution/stage8/production-readonly-continuity
```

控制请求 exact schema：

```json
{
  "action": "revoke",
  "operator": "local-operator",
  "reason": "incident response",
  "productionRouteReviewId": null
}
```

restore 把 `action` 改为 `restore`，并填写当前 route review id。密钥不得进入请求、响应、审计或 manifest。

## Docker 验收

```powershell
npm run docker:smoke:stage8
npm run docker:smoke:stage8:validate
```

验收使用独立 Compose 项目和临时数据卷，验证 revoke、Stage 7 网络前阻断、无效 restore、API 重启回读和 live-blocked 边界，结束后删除临时卷。2026-07-13 本地 accepted manifest SHA-256 为 `7d0effee4503722f1df991bba72ef7430fe3a909a3cb9ea53b1b7ea16b399467`。
