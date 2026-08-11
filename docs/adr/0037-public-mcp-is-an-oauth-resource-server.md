# 公网 MCP 是租户隔离的 OAuth Resource Server

## 状态

Accepted

## 背景

loopback MCP 使用固定本机 API 适配器，不具备远程身份与租户语义。把该端口直接交给 Caddy 会让匿名客户端访问研究数据，或让多个客户端共享同一 Cookie/操作者。浏览器 OIDC Cookie/CSRF 也不是 MCP 客户端可使用的 OAuth Bearer 协议。

## 决策

公网 MCP 作为独立 OAuth 2.1 Resource Server 运行。canonical resource 固定为 `${AIQT_PUBLIC_ORIGIN}/mcp`，发布 RFC 9728 Protected Resource Metadata，并要求每个 Streamable HTTP 请求携带 Bearer token。Token verifier 只从固定 HTTPS issuer discovery/JWKS 取密钥，限制签名算法，验证签名、精确 issuer、resource audience、时间和 read scope；入站 token 不转发给 Quant API。

公网身份只用已验证的 `(issuer, subject)` 查询现有 active `public_users`。`owner_id`、邮箱和操作者语义全部从服务端数据库得到；token 或工具参数中的同名 claim 无效。未知、禁用或来自其它 issuer 的身份失败关闭，不按 email 静默创建或合并租户。网页登录与 MCP Authorization Server 必须使用能稳定产生同一规范身份的 issuer；如果当前身份提供方不能为自定义 MCP resource 签发 audience-bound access token，必须迁移/更换 Authorization Server，而不是放宽 audience 校验。自托管 Keycloak 的单 resource scope/Audience mapper 兼容约束由 ADR-0038 补充。

通过验证后，MCP 在同一请求上下文内构造 `TenantContext`，经拒绝优先、仅允许预注册研究 GET 路径的进程内 gateway 调用 research-only `PublicTenantApi`，最终复用 `PublicTenantStores(owner_id)`。gateway 不是通用 HTTP proxy，不接受任意 URL，也不把 Bearer、Cookie 或 CSRF 传给内部 API。公网 MCP 不接收设置主密钥，不解密租户 secret settings；Paper 状态固定为不可用投影。

公网首版只注册八个只读研究工具；五个研究写工具不出现在发现结果中。`AIQT_MCP_ENABLE_RESEARCH_WRITES` 和进程级 operator 不能扩大公网能力。公网 Streamable HTTP 固定为无状态模式；每个租户的 initialize/tool/resource 请求有独立分钟限额。promotion、策略绑定、Paper 控制、Testnet、Live、委托、密钥和 Stage 6–10 始终不存在。

Caddy 是唯一公网入口，只代理 `/mcp` 与 `/.well-known/oauth-protected-resource/mcp`。MCP 容器不发布宿主端口，TLS 由 Caddy 终止；应用仍精确校验公网 Host/Origin，不能用通配符或关闭 DNS-rebinding 防护。

## 结果

- 远程 AI 只能读取其 OIDC 身份对应租户的研究制品，且公网边缘进程不持有解密交易凭据所需的设置主密钥。
- 本机 MCP 的受监督研究写能力保持不变；公网不会因环境漂移获得写入或执行能力。
- 项目不新增租户表、研究状态机或交易路径，Quant Core 与现有租户 Store 仍是唯一事实源。
- 实际上线依赖自托管 Authorization Server 为 canonical resource 签出精确 audience，并与网页登录身份保持同一 `(issuer, subject)`；当前 Keycloak 兼容模式不等于完整 RFC 8707，缺少 audience/scope 配置时服务会拒绝 token，不能宣称已上线。
