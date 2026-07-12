# Stage 5 CI 发布门禁设计

## 状态

已确认，进入实施。

## 目标

把已经通过本地验收的 Stage 3 deterministic AI baseline、Stage 4 权威组合输入和 Stage 5 五段安全链正式纳入 GitHub CI。每次 push/PR 都必须执行真实 Docker smoke、离线 validate，并保留可下载 manifest；任何回归继续 fail closed。

## 当前缺口

根脚本已经提供 Stage 3/4/5 smoke 与离线 validator，本地最终验收也已通过；但 `.github/workflows/ci.yml` 目前只运行基础部署、P0 和 P1。Stage 5 代码可以在 CI 全绿时绕过自身的恢复、导出导入、只读探针、授权预检和授权复核门禁。

## 核心决策

### 1. 直接复用现有命令

CI 在已有 `docker compose build` 后运行：

```text
npm run docker:smoke:stage3 -- --no-build
npm run docker:smoke:stage3:validate
npm run docker:smoke:stage5 -- --no-build --down
npm run docker:smoke:stage4:validate
npm run docker:smoke:stage5:validate
```

Stage 5 smoke 已包含 Stage 4 portfolio acceptance，因此不再重复运行 Stage 4 smoke；生成后仍调用现有 Stage 4 离线 validator。Stage 3 仍单独执行，证明外部 Provider 未配置时 deterministic local baseline 可用。

### 2. 保留完整发布证据

CI 无论成功或失败都上传一个 `stage5-release-manifests` artifact，包含：

- `data/stage3-ai-review.json`
- `data/stage4-portfolio-paper.json`
- `data/stage5-shadow-execution.json`
- `data/stage5-sandbox-readiness.json`
- `data/stage5-sandbox-readonly-probe.json`
- `data/stage5-sandbox-authorization-preflight.json`
- `data/stage5-sandbox-authorization-review.json`

不创建新的聚合 manifest；五段 Stage 5 validator 与 Stage 3/4 validator 已是权威复核入口。

### 3. 发布边界不变

默认 CI 不注入交易所密钥。只读探针、授权预检和授权复核必须按设计阻断，成功 preflight/review 数量为 0。门禁通过不代表 Sandbox 或实盘授权，继续固定 `authorizationEffective=false`、`sandboxOrderSubmissionAllowed=false`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false` 和 `liveBlockedBoundary=true`。

## 不做

- 不新增 CI 专用业务模型或 acceptance schema。
- 不接真实测试网、券商或资金账户。
- 不上传密钥、SQLite 数据卷或账户数据。
- 不开启 Sandbox/实盘订单能力。
