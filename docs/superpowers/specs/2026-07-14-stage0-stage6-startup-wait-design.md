# Stage 0 Stage 6 启动等待收口设计

## 状态

已完成。追踪问题：[GitHub Issue #14](https://github.com/wqjuser/AIQuantificationTools/issues/14)。

## 问题

`main` push CI run `29279109218` 在 Stage 6 no-credential safety smoke 失败：`docker compose up -d` 返回后，脚本立即单次访问 `5173/health`，Web 容器启动期间连接被重置。脚本已有 `_wait_for_api`，并在 API 重启后使用，但初次启动绕过了它。

## 方案

初次 Compose 启动后直接复用 `_wait_for_api`。该函数在现有 30 秒预算内轮询本地健康端点，并已把 `ConnectionResetError` 作为 `OSError` 处理。除此之外不改变 Compose、manifest、无凭据验证或清理流程。

## 验收

- 初次启动与重启恢复共用 `_wait_for_api`；
- Stage 6、Stage 8 Docker smoke/validate 和完整 CI 通过；
- 无凭据环境继续 fail closed，全部 live/order 边界不变。

## 明确不做

- 不新增固定 sleep、通用重试器或依赖。
- 不重试交易所、订单提交、查询或撤单。
- 不创建 Stage 9 或生产订单能力。
