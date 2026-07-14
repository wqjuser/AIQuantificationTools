# Stage 0 P1 验收工作量收口设计

## 状态

已完成。追踪问题：[GitHub Issue #13](https://github.com/wqjuser/AIQuantificationTools/issues/13)。

## 问题

P1 Docker 验收从 `/api/workspace` 读取自选列表，再同步调用 `/api/cache/watchlist-refreshes`。P1 合同只要求至少 3 个标的，但当前实现会刷新工作区中的全部标的，因此默认自选从 3 个增长到 4 个后，验收的外部行情请求量也随产品数据增长。

PR #12 的同一提交在一次完整门禁中于 P1 刷新返回 Nginx `504 Gateway Time-out`，重跑后通过。现有 90 秒代理预算已经覆盖原始三标的验收；继续延长超时或增加宽泛重试只会掩盖验收样本失控。

## 方案

复用现有工作区顺序和 P1 最小数量合同：

1. `p1_watchlist_from_workspace_payload` 继续完整校验工作区并如实报告原始自选数量；
2. `run_p1_acceptance` 只取校验后列表的前三个标的作为固定验收样本；
3. refresh、manifest 和后续 queue-ready 选择都复用同一份三标的样本；
4. 产品 API、用户触发的完整自选刷新和行情适配器保持不变。

## 验收

- 四标的工作区仍报告 `watchlist=4`，但只向刷新 API 提交前三个标的；
- P1 manifest 的 `watchlistCount` 固定为 3，并继续要求至少一个完整刷新标的；
- 全量 Python/Web、生产构建、Docker P1 与 Stage 8 验收通过；
- CI 和 artifact 上传门禁通过；
- `paperOnly`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false` 与 `liveBlockedBoundary=true` 不变。

## 明确不做

- 不增加 HTTP 重试框架、并发刷新器或后台队列。
- 不修改行情 Provider 顺序、单 Provider 超时或 Nginx 超时。
- 不限制产品工作区可保存的自选数量。
- 不创建 Stage 9，不开放生产订单或真实资金路由。
