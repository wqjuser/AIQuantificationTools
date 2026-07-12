# Stage 6 写路由只读取专用 Sandbox 凭据

Stage 6 写路由只读取现有探针计划已声明的 `CCXT_SANDBOX_API_KEY` 和 `CCXT_SANDBOX_SECRET`，缺少任一变量即 fail closed，并禁止回退到 `CCXT_API_KEY`、`CCXT_BINANCE_API_KEY` 等通用变量。密钥只存在于 API 服务环境，不进入 Web、日志、审计事件、导出包、Dockerfile、镜像或验收 manifest。复用的 Stage 5 Sandbox 只读探针优先读取这组专用变量，并保留旧变量兼容；兼容变量仍不能激活 Stage 6 写路由。
