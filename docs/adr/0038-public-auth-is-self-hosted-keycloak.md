# 公网认证采用自托管 Keycloak

## 状态

Accepted

2026-08-13 补充：本 ADR 关于“账号默认由管理员创建、关闭自助注册”和旧外部 Google 身份迁移的结论记录当时上线边界；自助注册、邮件流程与 Google broker 的当前决定由 [ADR-0040](0040-keycloak-self-registration-and-google-broker.md) 取代。自托管 Keycloak 作为唯一规范 issuer 的架构不变。

## 背景

公网早期配置使用外部 Google OIDC。该入口在中国大陆不可稳定访问，也不能为本站 `/mcp` resource 签发所需的 audience-bound access token。把邮箱密码、重置流程和完整 OAuth Authorization Server 直接实现进 Quant API，会让量化领域服务承担密码哈希、暴力破解防护、PKCE、授权码、JWKS、密钥轮换和客户端注册等高风险协议责任。

## 决策

public Compose 部署固定版本的自托管 Keycloak 与独立 PostgreSQL。Keycloak 在 `AIQT_AUTH_ORIGIN` 提供 `aiqt` realm，负责后台创建的本地账号、密码、登录、重新认证、授权码和 JWKS；Quant API 继续作为 confidential OIDC Client，只保存现有 HttpOnly 应用会话与 `(issuer, subject) → owner_id` 映射，不接收或保存密码。

账号默认由管理员创建并标记邮箱已验证；关闭自助注册、Direct Access Grant、Implicit Flow 和匿名动态客户端注册，显式禁用 realm 自动创建的 `admin-cli`。临时 super-admin 只通过一次性 `compose.keycloak-bootstrap.yaml` 初始化，稳态 Compose 不携带 bootstrap 凭据。公网 Caddy 只代理 `aiqt` realm 与认证静态资源，不代理 `/admin`、master realm 或 Keycloak 管理端口。浏览器 Web client 固定使用 Authorization Code + PKCE S256；所有网页登录均携带 `prompt=login + max_age=0` 并验证新 ID token 的 `auth_time`，因此已有 SSO Cookie 不能被记为新近复核。应用退出先不可逆撤销本地会话，再继续到 Keycloak RP-Initiated Logout；认证服务临时不可用时只允许回到本站，不能让 IdP 可用性阻断本地退出。

公网 MCP 继续是独立只读 Resource Server。Keycloak 的 `aiqt:research:read` optional client scope 通过 Audience mapper 把 `aud` 精确设为 `${AIQT_PUBLIC_ORIGIN}/mcp`；MCP verifier 仍验证签名、精确 issuer/audience、scope、时间和已存在 active identity。Keycloak 当前没有完整消费 RFC 8707 `resource` 参数，因此这是单 resource 的固定 audience 兼容方案，不能宣称 Authorization Server 已完整实现 RFC 8707，也不能放宽 MCP audience 校验。

Claude 的终端用户接入由 [ADR-0039](0039-claude-connectors-use-restricted-cimd.md) 收口：匿名动态客户端注册仍关闭，只为受信任的 Claude HTTPS Client ID Metadata 启用受限 CIMD，并由站内一键安装页隐藏客户端注册细节。

Google 与 Keycloak 的 `issuer + subject` 不同。已有租户必须在维护窗口先创建 Keycloak 用户，再以当前 `owner_id` 原子重绑新身份并撤销旧应用会话；不得按邮箱静默合并，也不得先让新账号登录后再搬数据。

## 结果

- 登录、密码和 MCP token 签发均由自己的服务器与域名承载，不依赖 Google 或海外前端资源。
- Quant Core 不新增密码表、OAuth 状态机或第二套租户模型；既有领域 Store 与 `owner_id` 外键不变。
- 运维必须备份 Keycloak 数据库、首次启动后立即用临时 bootstrap 管理员创建永久管理身份并删除临时账号、固定镜像版本并在升级前导出 realm。
- 接入需要原生 RFC 8707 的多个 MCP resource 时，必须升级到经验证支持该协议的 Authorization Server 或授权层，而不是扩展当前 mapper 约定。
