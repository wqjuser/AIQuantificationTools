# Stage 6 Binance Spot Testnet 运维手册

## 安全范围

Stage 6 只允许 Binance Spot Testnet 的 GTC 限价委托。生产 endpoint、真实资金、Futures、杠杆、多交易所和 live route 始终禁用。浏览器、Web 构建、Dockerfile、日志、审计事件、导出包和验收 manifest 都不得包含密钥。

## 凭据与启动

只在 API 服务环境设置：

```powershell
CCXT_SANDBOX_API_KEY=...
CCXT_SANDBOX_SECRET=...
INSTALL_DATA_DEPS=true
```

禁止使用 `CCXT_API_KEY`、`CCXT_SECRET` 等通用变量替代。Compose 只把两项专用变量传给 `api`，不传给 `web`。密钥轮换后重建或重启 API，并先运行 Stage 5 只读探针重新生成权威准入证据。

## 黄金路径

1. 在 Portfolio 完成 Stage 4 workflow，在 Execution 确认 Stage 5 shadow 已对账、readiness/preflight 有效且 review 为 approved。
2. Execution 调用服务端规范化；检查交易对、数量、价格、最小金额、余额和批次限额后，人工记录一次性授权。
3. 在授权后 10 分钟内开始提交。首次外部调用前必须已看到 `submission_pending` 审计状态。
4. 提交后人工刷新对账；未成交订单可撤单。页面刷新或 API/容器重启后从同一数据卷回读原批次，不重新生成订单 id。

## 未知状态与恢复

出现超时、断线或 `reconciliation_required` 时不要创建新订单或新 `clientOrderId`。使用“对账”让服务端按原 ID 查询；只有明确不存在时系统才允许同 ID 最多重试一次。仍未知时保持批次阻断，检查 Testnet 状态和网络后再次人工对账。

批次中任一订单被拒绝或未知时，系统停止后续提交并尽力撤销已开订单。已成交或部分成交只能按交易所事实记录，不能手工改成已撤销。

## Kill Switch

触发账户级 kill switch 后，状态先写入审计账本，再阻断新提交并尽力撤销本系统未成交订单。逐笔确认全部活动订单已进入终态并完成对账后，使用非空 operator 人工重置。不能通过重启容器绕过触发状态。

## 验收

无密钥门禁可在任何开发/CI 环境运行：

```powershell
npm run docker:smoke:stage6
npm run docker:smoke:stage6:validate
```

真实 Testnet 验收只能在受保护人工环境运行。先把已持久化的 Stage 4/5 权威证据 ID 写入 `data/stage6-sandbox-acceptance-request.json`；文件只能包含 `workflowId`、`shadowSessionId`、`readinessDecisionId`、`preflightId`、`reviewId` 与 `operator`。验收程序必须通过运行中的 API 重建授权，不能接受外部拼装的订单或 authorization，再执行：

```json
{
  "workflowId": "stage4-workflow-...",
  "shadowSessionId": "stage5-shadow-...",
  "readinessDecisionId": "stage5-readiness-...",
  "preflightId": "stage5-preflight-...",
  "reviewId": "stage5-review-...",
  "operator": "release-operator"
}
```

```powershell
npm run docker:smoke:stage6:real
npm run docker:smoke:stage6:real:validate
npm run docker:smoke:stage6:exit:validate
```

验收会提交、查询、对仍未终态的每单发起撤单尝试并最终对账，随后真实重启 API、从同一数据卷回读，导出研究包并验证 Stage 6 导入事件固定为 `detached`。清单检查项由持久化 transition 的 `create/query/cancel` 证据生成，不能硬编码通过。网络偶发成交会如实记录为 `filled`；若全部委托在撤单前成交，门禁不会伪造撤单动作，必须使用新的小额批次重新完成撤单验收。验收输出 `data/stage6-binance-spot-testnet.json`，并在 Stage 5 exit、无密钥门禁和真实清单全部有效时生成 `data/stage6-exit-acceptance.json`。缺少该真实清单时 Stage 6 不能退出。
