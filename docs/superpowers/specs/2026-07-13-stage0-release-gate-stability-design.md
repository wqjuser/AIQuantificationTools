# Stage 0 发布门禁稳定性收口设计

## 状态

实施中。本阶段只修复已观测到的 Docker/CI 发布门禁不稳定，不启动 Stage 9。

## 问题

PR #9 的同一提交同时触发了 feature branch `push` 和 `pull_request` 两套完整 quality gate。两套任务使用不同的 `github.ref`，现有 concurrency 无法互相取消，因此重复构建镜像并运行 P0 至 Stage 8 全链。

其中一套任务的 P1 自选行情刷新连续两次在约 60 秒时收到 Nginx `504 Gateway Time-out`，另一套相同任务完整通过。Docker smoke 客户端允许 90 秒，但 Nginx `/api/` 仍使用默认 60 秒 upstream read timeout，长刷新请求会先被代理切断。

## 目标

复用现有 `.github/workflows/ci.yml`、Nginx 配置和部署契约测试完成最小收口：

1. feature branch 只通过 `pull_request` 运行完整门禁，`push` 门禁只保留给 `main`；
2. Nginx `/api/` upstream read timeout 与 Docker smoke 的 90 秒请求预算一致；
3. 既有部署契约测试锁定两项配置，防止重复门禁和 60 秒超时回归；
4. 用完整 P1 与 Stage 8 Docker 验收证明发布链和安全边界不变。

## 固定边界

- 不增加自定义重试器、后台任务、异步队列或新依赖。
- 不改变行情适配器、P1 manifest、API 数据模型或 watchlist refresh 业务语义。
- 不减少 PR 和 `main` 的发布门禁覆盖，只消除同一 feature branch 的重复执行。
- 不新增 Stage 9、生产订单、成交、转账、提现或 live route。

## 验收

- workflow 明确限制 `push.branches` 为 `main`，并保留 `pull_request`；
- Nginx `/api/` 包含 `proxy_read_timeout 90s`；
- 部署契约测试、全量 Python/Web、生产构建通过；
- Docker 基础 smoke、P1 smoke/validate 与 Stage 8 smoke/validate 通过；
- PR 只产生一条 feature branch quality gate，合并后的 `main` 再运行一条 push gate。

## 明确不做

- 不以宽泛重试掩盖所有 HTTP 错误。
- 不延长交易所、AI Provider 或浏览器请求的业务超时。
- 不拆分或并行化现有 P0 至 Stage 8 CI 步骤。
