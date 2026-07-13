# Stage 7 生产只读准入运维

## 目的与边界

本流程只验证 Binance Spot 生产环境的市场元数据、API Key 权限和脱敏账户摘要。它不会创建、查询或撤销生产订单，不读取成交历史，不执行转账或提现，也不开放 live route。Stage 7 通过不等于实盘授权。

## 凭据准备

在 Binance 创建一对专用于本项目的 API Key，并满足以下全部条件：

- 启用读取权限；
- 关闭 Spot、Margin、Futures 和 Options 交易权限；
- 关闭提现、内部划转和通用划转权限；
- 配置仅允许 API 服务出口地址的 IP 白名单；
- 不复用 Stage 6 Sandbox Key、通用 CCXT Key 或未来可能用于生产委托的 Key。

只在 API 服务环境或本机 `.env` 中配置：

```dotenv
CCXT_PRODUCTION_READONLY_API_KEY=...
CCXT_PRODUCTION_READONLY_SECRET=...
```

不要把值写进 Web 环境、Dockerfile、请求 JSON、Git、日志、截图或验收清单。Compose 只把这两个变量传给 `api` 服务。

## 前置证据

运行真实准入前必须同时满足：

1. API 数据卷中的 `data/stage6-exit-acceptance.json` 状态有效；
2. Settings 已在最近 24 小时内为 `ccxt-live + crypto + live` 记录绑定 maintenance window 的 `route_review_recorded` 生产路由复核；
3. 操作者确认账户和访问位置符合交易所服务资格；
4. 上述专用只读凭据已配置。

把权威 route review id 写入本地且不提交 Git 的 `data/stage7-production-readonly-acceptance-request.json`：

```json
{
  "productionRouteReviewId": "替换为权威复核 ID",
  "operator": "local-operator",
  "eligibilityConfirmed": true
}
```

## 验收命令

默认无凭据门禁不会访问生产网络，可在本地和 CI 运行：

```powershell
npm run docker:smoke:stage7 -- --no-build
npm run docker:smoke:stage7:validate
```

人工真实只读验收会访问 Binance 生产环境，但仍不会触发委托或资金变更：

```powershell
npm run docker:smoke:stage7:real -- --no-build
npm run docker:smoke:stage7:real:validate
```

真实命令会运行一次权威 POST，重启 API，再通过 GET 回读同一 evidence hash，输出 `data/stage7-production-readonly.json`。文件只包含权限布尔值、市场数、账户类型、非零资产数和 hash，不包含资产名称或余额。真实清单完成前 Stage 7 保持 current。

## 失败分类

| 阻断原因 | 处理 |
| --- | --- |
| `production_readonly_credentials_missing` | 只检查 API 服务中的两项专用变量；不要配置通用变量作为回退。 |
| `production_readonly_permission_check_unavailable` | 确认 CCXT/Binance Spot 版本支持 API restrictions；不允许跳过权限检查。 |
| `production_readonly_permissions_unsafe` | 在 Binance 关闭全部交易、提现和划转权限，等待权限生效后重新运行。 |
| `production_readonly_load_markets_failed` | 检查生产域名直连、DNS、代理和地域服务资格；网络失败时按 `AGENTS.md` 使用代理重试。 |
| `production_readonly_permission_check_failed` | 检查 Key、secret、IP 白名单、时间同步和地域限制；不要记录原始响应中的敏感信息。 |
| `production_readonly_account_sync_failed` | 权限已安全但账户读取失败，检查读取权限、IP 和时间同步；保持 blocked。 |
| Stage 6 exit / route review 无效 | 先恢复权威前置证据，不得绕过或手工伪造 ID。 |

## 轮换与撤销

轮换时先创建新的只读 Key，逐项复核权限和 IP 白名单，替换 API 服务环境后重启服务并重新运行真实验收；确认新 evidence hash 后立即撤销旧 Key。发现泄露、权限被扩大、IP 白名单变化或异常账户访问时，应立即在 Binance 撤销 Key、清空 API 环境变量并重启服务。历史审计只保留“曾配置”的布尔值和脱敏证据，不保存可恢复的密钥。

任何需要开启交易、提现、转账、生产订单或 live route 的请求都超出 Stage 7，必须进入未来独立设计、人工授权与真实资金验收流程。
