# Keycloak 提供自助注册与 Google 身份代理

## 状态

Accepted

## 背景

公网认证已经收敛到本站自托管 Keycloak，但管理员逐个创建业务账号无法支撑公开使用，用户也缺少邮箱验证和忘记密码流程。部分用户希望使用 Google 登录，同时中国大陆不能把 Google 作为登录或 MCP 授权的可用性前置。

## 决策

`aiqt` realm 开启邮箱即用户名的自助注册、强制邮箱验证和密码重置。验证与重置邮件只由 Keycloak 通过部署方 SMTP 发送；Quant API 不新增密码、验证码或邮件状态机。SMTP 未配置并通过真实发信验收时，不得开放公网注册。

本站邮箱注册/登录是主入口。Google 是用户可选的 Keycloak identity broker；public 部署必须配置一对 Google client 凭据并完成验收后才能上线。Google Console 只能登记精确 callback `${AIQT_AUTH_ORIGIN}/realms/aiqt/broker/google/endpoint`。broker 使用 `storeToken=false`，Google access/refresh token 不进入 Quant API、MCP、应用数据库、日志或研究上下文。

无论使用本站密码还是 Google，浏览器和 MCP 的规范身份始终是 `${AIQT_AUTH_ORIGIN}/realms/aiqt` 签发的稳定 Keycloak `sub`。Quant API 继续只用 `(issuer, subject)` 创建或回查租户，不按 email 自动链接、合并或重绑身份。broker 可以用 `trustEmail=true` 信任 Google 返回的 `email_verified`，但这不构成既有本站账号的所有权证明。Google 邮箱与已有本站账号相同时，默认 First Broker Login 必须要求用户证明既有账号控制权并显式确认关联；不得加入 auto-link authenticator，也不能在应用层按邮箱匹配。

Google 凭据是 public 部署上线必需配置，但 Google 运行时不可达不能阻断本站注册、登录、验证、重置和 MCP 签发。

现有 realm 不会被 bootstrap import 更新。管理员必须先备份 Keycloak 数据库，再用版本库迁移工具幂等应用并只读检查 registration、SMTP 与 broker 配置；不得重建 realm，因为这会改变用户 `sub`。Claude/Codex 客户端、PKCE、MCP scope/audience 和受限 CIMD 继续沿用既有配置。匿名 Dynamic Client Registration 仍由 Caddy 阻断，Google broker 不构成开放 OAuth client 注册。

## 结果

- 用户可自行注册、验证邮箱和重置密码；管理员仍可禁用账号。
- 国内使用不依赖 Google；Google 只增加一条用户可选登录方式，不增加第二个 issuer、租户模型或 token 存储。
- SMTP 和 Google secret 只进入 Keycloak，必须由密钥管理注入且不得出现在 Git、命令参数、日志或文档示例值中。
- 新部署与已有 realm 都必须完成真实邮件、身份链接、issuer/sub、MCP audience 和 DCR 负向验收后才可开放。
