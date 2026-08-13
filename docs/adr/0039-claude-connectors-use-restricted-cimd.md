# Claude 公网连接器使用受限 CIMD 与一键安装入口

## 状态

Accepted

## 背景

公网 MCP 已具备 OAuth Resource Server、租户隔离与八个只读工具，但早期接入说明要求管理员为每个 AI Host 查找 callback、更新 Keycloak client，并让用户理解 Client ID。协议安全已经完成，安装复杂度却泄漏成了终端用户接口。开放匿名 Dynamic Client Registration 可以减少手工配置，但会引入公开写端点、无限 client 生命周期、数据库增长和拒绝服务风险。

## 决策

用户统一从工作台侧栏的“连接第三方 AI”弹窗接入；旧 `/connect/claude` 页面仅作兼容。弹窗只从当前可信 HTTPS Origin 构造 canonical `/mcp` 地址，提供 Claude 官方预填 custom connector 安装页以及 Claude Code、Codex CLI 命令；本机、HTTP 与 loopback Origin 不生成安装链接或命令。用户接口不出现 Secret、callback 或 Keycloak；Codex 命令中的固定 public client ID 不属于凭据。

连接能力默认关闭。只有管理员用版本库内的确定性迁移工具把现有 `aiqt` realm 收敛到同一 Client Profile、Client Policy、scope 与 Claude Hosted 预注册客户端配置，并通过只读检查，才可在受控维护窗口设置 `AIQT_CLAUDE_CONNECT_ENABLED=true` 进行真实协议验收；验收失败必须立即关闭，验收通过后才可对普通用户发布。未设置、迁移漂移或验收失败时，认证会话投影必须让侧栏入口和安装动作保持不可用；不能只凭 HTTPS Origin 推断授权服务已经就绪。

Claude Hosted 固定预注册官方 URL 型 Client ID `https://claude.ai/oauth/mcp-oauth-client-metadata`，只允许官方 HTTPS callback、Authorization Code、PKCE S256、用户同意、研究 scope 与 `offline_access`；Keycloak 26.7 专属的 CIMD 缓存属性固定为其最大整数秒，防止运行时重新映射 Claude metadata 中与 public client 不兼容的 JWT Bearer grant。自托管 Keycloak 继续启用 CIMD feature，受限 Client Policy 只服务 Claude Code 的官方 metadata 与 loopback callback，并继续强制 public client、PKCE、禁用 Implicit/ROPC、关闭 full scope。`aiqt:research:read` 仍只产生 canonical `/mcp` audience；Caddy 继续拒绝整个 anonymous client-registration 路径。

Codex CLI 不依赖匿名 DCR。realm 预注册 `aiqt-codex-cli` public client，只允许当前 canonical MCP URL 与固定本地端口派生出的精确 loopback callback，并同样强制 Authorization Code、PKCE S256、用户同意、研究 scope 与 `offline_access`；迁移工具负责在公网 URL 变化时原位收敛 callback，不使用通配 URI。

现有身份与能力边界不变：连接页先完成网页登录并持久化同一 `(issuer, subject)`，MCP verifier 只回查已有 active identity；不按 email 创建或合并租户。公网仍只注册八个只读研究工具，不增加 promotion、策略绑定、监控控制、Testnet、Live、下单或 Stage 6–10 能力。

## 结果

- 普通用户的完整接口缩小为“打开连接页、登录、确认连接”。
- Claude Connectors Directory 上架是后续分发渠道，不再是实现一键安装的前置条件。
- 匿名 DCR 保持关闭，不新增 client 清理、注册限流或第二套 OAuth 状态机。
- CIMD 在固定 Keycloak 26.7 中仍是 experimental；版本升级和现有 realm 迁移必须失败关闭，并以真实协议验收为准，不能只检查 JSON。
- realm import 只初始化新数据库。已有 public 部署必须在维护窗口以受控 Keycloak Admin 操作应用同一 Client Policy，备份后再开放连接入口。
- 迁移工具只把版本库冻结的 CIMD、Claude Hosted 与 Codex CLI 预注册客户端、realm default scopes，以及 `basic`/`aiqt:research:read` scope 与 mapper 字段写入内网 Keycloak Admin API；旧 `aiqt-mcp` 只允许原地改名，不能与新 Client ID 并存。Audience mapper 必须精确指向 canonical `/mcp` resource，缺失、额外或漂移均失败关闭。重复执行幂等；管理员密码只通过交互提示进入进程，不写入参数、环境、日志或 Git。
