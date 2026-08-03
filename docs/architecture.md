# Architecture

## 目标与边界

AIQuantificationTools 只有一套领域实现、API 路径和前端工作区，同时支持本机单用户与公网个人多租户。部署模式改变身份、存储和网络边界，不复制研究、审计、授权、风控或交易逻辑。

研究主线固定为：

```text
行情与选股 → 研究 → 策略 → 回测 → AI 评审
```

组合风控、执行中心和动态交易是高级执行；审计回放和设置是系统能力。市场资讯保留原 URL，但从行情页次级进入。

## 双部署模式

### local

- `AIQT_DEPLOYMENT_MODE=local`，也是默认值。
- 使用既有 SQLite/JSON 文件和合成租户 `local`。
- 无登录，保留现有接口兼容。
- Compose Web 只绑定宿主 `127.0.0.1`；API 只暴露在容器网络。

### public

- `AIQT_DEPLOYMENT_MODE=public`。
- PostgreSQL 保存用户、会话、私有领域记录、设置、审计、授权和后台协调。
- Starlette/Uvicorn 提供应用内 OIDC 与租户入口；`quant_core.api.run` 仍是兼容启动 seam。
- Caddy 是唯一公网入口，提供 TLS 和静态页面/API 反向代理；API 没有宿主端口。
- PostgreSQL、OIDC Issuer/Client、HTTPS Origin 或主密钥缺失时启动失败。

## 公网请求链

```text
Browser
  → Caddy HTTPS / Host / security headers
  → Starlette trusted-host + Origin + Content-Type + session + CSRF + rate limit
  → TenantContext(owner_id, issuer, subject, email)
  → PublicTenantApi compatibility bridge
  → existing HTTP handlers and domain services
  → tenant store adapters
  → PostgreSQL
```

认证使用固定单一 OIDC Issuer 的 Authorization Code + PKCE S256。服务端校验 state、nonce、issuer、audience、expiry 和 JWKS 签名；首次成功登录且邮箱已验证时自动创建个人用户。用户只有 `active/disabled` 两种状态。

会话令牌与 CSRF 令牌在数据库中只保存不可逆哈希。Cookie 使用 `Secure`、`HttpOnly`（会话）、`SameSite=Lax`；会话绝对有效期 12 小时、空闲有效期 30 分钟。修改请求必须满足同源 Origin、JSON Content-Type、会话绑定 CSRF 和限流。登录/回调按 IP 限制，普通修改、AI/选股和研究包导入按租户分别限制。

操作者由 OIDC 会话邮箱派生。浏览器顶层 `operator/reviewer/author/approvedBy/liveOperator` 必须与认证身份一致；导入制品内部的历史作者属于已签名业务内容，不会被改写。

## 租户与存储

`TenantContext` 是所有公网私有访问的入口。`TenantStoreBundle` 将原有 Store API 映射到 PostgreSQL；私有记录使用 `(owner_id, 原业务 ID)` 复合身份。因此两个用户可拥有相同 run/event ID，但不能互相读取、修改、导出、授权或执行。

`owner_id` 不进入已有规范制品和 canonical hash：相同研究包在不同租户导入后仍可验证，但导入记录归当前租户。研究包不能恢复平台设置、密钥、生产控制、授权、订单或成交。

公共行情缓存可以跨租户复用，但不得保存用户密钥、研究上下文或私有标识。设置与交易密钥按租户保存；服务端主密钥经 HKDF 派生租户密钥，AES-GCM 的 AAD 绑定 `owner_id + setting + keyVersion`。

public 模式禁止回退到进程环境中的用户 OpenAI、OpenAI-compatible、Sandbox 或生产交易凭据。用户可配置的 HTTPS 出站 Origin 还要通过管理员 allowlist、DNS/IP 检查和每次重定向复核；loopback、私网、链路本地和云元数据地址被阻断。代理、free-stockdb 和 Ollama 只允许平台管理员配置。

## 前端

React/Vite Web 与 Tauri 桌面端复用同一应用。`App.tsx` 是兼容入口，应用外壳、页面视图和页面控制器按目录隔离；`TerminalWorkspaceSurface` 继续装配现有工作区 props。

public 页面由 `AuthGate` 在渲染应用前读取 `/api/auth/session`。local API 明确返回 `deploymentMode=local` 并直接进入本机模式；任意 404 不会被误判为 local。统一 fetch 边界只对同源 `/api` 修改请求附加 CSRF 和认证操作者，绝不向外部 Provider Origin 泄露租户凭据。401 回到登录门，428 进入 OIDC 重新认证并保留当前 URL。

URL 中的 `workspace` ID 保持兼容。侧栏只展示名称与选中状态；研究主线常显，高级执行与系统使用原生折叠。每页保留一个主动作和一个下一步，详细 manifest、hash 与验收证据默认折叠但仍可审计。

## AI 选股与到期复盘

AI 选股遵守 ADR 0029：服务端从真实候选与已完成日 K 固定执行 `100 → 20 → 5`，结果只用于研究排序。用户点击“开始研究”只绑定 `selectionId + candidateEvidenceId`；真正研究仍需显式运行。

每 6 小时的后台任务只扫描当前租户已经显式创建的选股记录：不调用 AI、不创建新选股、不运行研究、不修改自选/观察池，也不连接订单。复盘使用受保护选股事件、已绑定研究证据、已完成 K 线和固定版本基准：A 股 `000300`、美股 `SPY`、加密资产 `BTC/USDT`。

质量统计 schema v2 在旧字段后追加 research value cohort。cohort 由 `market + profile + weightsVersion + providerIdentity + benchmarkPolicyVersion` 隔离；样本单位是一批选股，要求至少 4/5 推荐拥有完整同周期基准。持有窗口重叠批次仍展示，但不进入稳定性判定。

## 后台协调

public API 进程启动一个租户后台 runner：

- 到期复盘默认每 6 小时扫描一次。
- 自动交易按现有配置周期运行，但只处理已显式启用的租户状态，并先对账未决订单。
- PostgreSQL lease 以 `(owner_id, task_key)` 唯一标识；多实例中同一租户同一任务只有一个 holder。
- 浏览器退出或会话过期不会中断已有订单的只读对账，但会阻断新的人工授权。

Stage 10 的生产账户控制另使用 PostgreSQL lease，并对服务端只读获取的 Binance 账户 UID 脱敏指纹做跨租户唯一声明；轮换 API Key 不会改变账户身份。修改生产密钥、开启/续期生产会话和恢复控制均要求最近 5 分钟 OIDC 重认证，然后继续执行既有权限、急停、账户覆盖、风险与授权校验。

## 数据迁移

本机数据迁移分三段：只读 `inventory`、不写入的 `dry-run`、单事务 `apply`。迁移前备份整个 `data/`；apply 精确校验记录数、canonical hash 和导入后回读，重复同一源幂等。存在未决订单、活动实盘会话或未完成对账时阻断。

旧生产授权只作为历史审计导入。public 首次运行保持生产暂停，并要求重新配置租户密钥、完成近期 OIDC 重认证和重新授权。

## 兼容性与安全不变量

- 现有 HTTP 路径、工作区 ID、研究/审计制品和 canonical hash 保持兼容。
- local 继续读写现有 SQLite 数据；public 私有 Store 只走 PostgreSQL。
- 外部 AI 失败不能覆盖本地确定性评审。
- AI 选股、研究接受、策略保存和回测完成都不等于生产授权。
- 未完成 K 线、未来数据、缺失基准、跨租户记录或 detached 导入都不能制造权威事实。
- 自动化验收不得提交真实生产订单；真实 Binance 验收只能在独立环境由用户显式授权。
