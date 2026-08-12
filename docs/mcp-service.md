# AIQuantificationTools MCP 服务

MCP 服务把项目的研究主线包装成标准 Model Context Protocol，供 Claude Desktop、Claude Code、Cursor、Codex 和其他兼容客户端调用。它是现有 Quant Core API 的受控研究适配层，不复制行情、回测、策略、审计或交易状态机。

## 能力范围

MCP v1 提供：

- 服务健康和 fail-closed Paper 状态；
- 标的搜索、报价、已完成 K 线、数据就绪度与市场日历；
- 服务端 `100 → 20 → 5` AI 研究选股；
- 研究运行列表与脱敏详情；
- 注册策略模板的 formal sealed P0 研究；
- AI 策略研发的 proposal、进程外授权 launch 和聚合状态；
- 证据绑定的 AI Review；
- 受限的研究审计事件查询；
- 可引用的 capabilities、safety、run、experiment、review 和 Paper Resources。

MCP v1 **没有** promotion、任意策略上传/保存/删除、策略绑定、监控启停、Paper 立即评估/对账、Testnet、Live、委托、密钥、通用审计写入或 Stage 6–10 工具。注册模板 P0 会沿用现有 pipeline 持久化服务端生成的 draft，但调用方不能提供策略正文，也不能把 draft 晋级、绑定或启动。工具输出只表示研究证据，不构成投资建议或收益保证。

## Claude：一键连接

公网终端用户不需要理解或填写 OAuth 配置：

1. 打开 `https://<domain>/connect/claude`；
2. 使用本站账号登录；
3. 点击“连接到 Claude”，在已经预填名称与 MCP 地址的 Claude 页面确认连接。

完成后 Claude 只能读取当前账号的八个研究工具。页面不会索取 Client ID、Client Secret、callback、Keycloak 地址或 CLI 命令。本机 HTTP/localhost 不会生成安装链接，因为 Claude 远程连接器只能访问公网 HTTPS 服务。

该入口使用 Claude 官方 custom connector 安装深链。Claude Hosted 使用官方 URL 型预注册 public client；Claude Code 使用受限 Client ID Metadata Document（CIMD）。两条路径都强制 Authorization Code、PKCE S256、用户同意、精确 `aiqt:research:read` scope 与 `/mcp` audience。匿名 Dynamic Client Registration（DCR）继续由 Caddy 阻断。已有 `(issuer, subject)` 身份仍是硬门槛；连接页先经过现有 AuthGate，确保本站登录完成后才展示安装动作。

公网部署还必须显式设置 `AIQT_CLAUDE_CONNECT_ENABLED=true`。该开关默认关闭，只能在管理员执行版本库内的 Keycloak CIMD 幂等迁移与只读检查后，于受控维护窗口开启真实协议验收；验收失败必须立即关闭，验收通过后才可向普通用户发布。否则侧栏入口和安装动作保持隐藏。它不是 OAuth 授权替代品，只是防止已有 realm 在尚未迁移时向用户暴露一条必然失败的安装链。

Claude Code 可复用同一 Claude.ai 连接，也可独立执行：

```shell
claude mcp add --transport http --scope user aiqt https://myqt.zxai.fun/mcp
claude mcp login aiqt
```

Codex CLI 使用预注册的固定 loopback 回调：

```shell
codex mcp add aiqt --url https://myqt.zxai.fun/mcp --oauth-client-id aiqt-codex-cli --oauth-resource https://myqt.zxai.fun/mcp
codex mcp login aiqt --scopes aiqt:research:read,offline_access -c mcp_oauth_callback_port=5555
```

两种 CLI 都会打开本站登录和授权页，不需要用户复制 token 或 Client Secret。Codex 的端口必须保持 `5555`；更换公网 MCP URL 时，管理员迁移会同步该 URL 对应的精确回调路径。

## 安装

```shell
python3.12 -m venv .venv
.venv/bin/python -m pip install -e services/quant_core
```

官方 Python SDK 固定为 `mcp==2.0.0`。本项目使用 v2 的 `MCPServer`，不依赖第三方 FastMCP 包。

## stdio：本机 AI Host

先启动 Quant Core API：

```shell
npm run api
```

MCP Host 配置示例：

```json
{
  "mcpServers": {
    "aiqt": {
      "command": "/absolute/path/to/AIQuantificationTools/.venv/bin/aiqt-mcp",
      "env": {
        "AIQT_MCP_API_BASE_URL": "http://127.0.0.1:8765"
      }
    }
  }
}
```

也可以把 `command` 设为仓库的 Python，并把 `args` 设为绝对路径的 `tools/run_quant_mcp.py`。stdio 的 stdout 属于 MCP 协议通道，业务日志不得写入 stdout。

研究写入默认关闭。要允许 AI 选股、formal P0、proposal、launch 或 AI Review，必须由操作者在启动 MCP Host 时显式设置：

```json
{
  "AIQT_MCP_ENABLE_RESEARCH_WRITES": "true",
  "AIQT_MCP_OPERATOR": "Research Operator"
}
```

这个进程外开关是对该 MCP 进程生命周期内研究写入的授权；工具 schema 不接受模型上传的 `confirmed`、`operator`、`ownerId` 或外发批准。只有在受监督的研究会话中才应打开。MCP v1 固定使用服务端本地 Provider，不允许模型自行批准把证据发送给 OpenAI、Ollama 或其他外部 Provider；需要逐次外发授权时继续使用现有网页流程。该开关不会增加 promotion、执行或下单工具。formal launch 会永久消费唯一 holdout，因此 MCP 将它标记为有不可逆副作用。

## Streamable HTTP：本机 Docker

```shell
docker compose --profile mcp up -d --build mcp
```

端点为：

```text
http://127.0.0.1:8766/mcp
```

可用官方 Inspector 验证：

```shell
npx -y @modelcontextprotocol/inspector
```

然后连接上面的 URL。默认 Compose 只把端口发布到宿主 loopback，并显式校验 loopback `Host`/`Origin`；这个入口没有公网 OAuth，禁止直接转发。

## Streamable HTTP：公网 OAuth

public Compose 会启动独立的只读 MCP Resource Server：

```text
https://<domain>/mcp
https://<domain>/.well-known/oauth-protected-resource/mcp
```

Caddy 是唯一公网入口；MCP 容器没有宿主端口。公网 Streamable HTTP 使用无状态模式，不保留可无限增长的客户端 session。未携带 Bearer 的 `/mcp` 请求返回 401 和 `resource_metadata` challenge；metadata 声明 canonical resource、Authorization Server 和 `aiqt:research:read` scope。

公网 token 必须由与网页登录相同规范身份的 Authorization Server 签发，并满足：

- 支持 OAuth 2.1 Authorization Code + PKCE，并能为本站固定 MCP resource 签出专用 audience；
- access token 的 audience 精确包含 `https://<domain>/mcp`；
- JWT 由固定 issuer discovery/JWKS 验签，包含稳定 `sub`、`client_id` 或 `azp`、`iat`、`exp` 和 `aiqt:research:read`；
- `(issuer, subject)` 已通过网页登录或管理员迁移存在于 `public_users` 且状态为 active。

服务端忽略 token 中的 `ownerId`、email 和 operator；不会按 email 自动创建或合并租户。Bearer 也不会被转发到 Quant API。验证后的身份只在当前请求内映射为 `TenantContext`，A/B 两个用户即使使用相同 run ID，也只读取各自 PostgreSQL 记录。进程内 gateway 只允许预注册的研究 GET 路径；公网 MCP 不接收 `AIQT_SETTINGS_MASTER_KEY`，Paper 状态固定投影为不可用，因此普通读取不会解密租户交易凭据。

公网首版只发现八个只读工具：系统/Paper 状态、标的搜索、市场上下文、研究运行列表/详情、策略研发详情和研究审计查询。AI 选股、P0、proposal、formal launch 与 AI Review 创建工具不会注册；环境中即使误设研究写开关也不能扩大能力。

public Compose 使用本站自托管 Keycloak 同时承载网页登录与 MCP token 签发，不依赖 Google。Claude Hosted 预注册 Client ID 为 `https://claude.ai/oauth/mcp-oauth-client-metadata`，只保留精确 hosted callback；Claude Code 继续通过只信任 `https://claude.ai/...` 的受限 CIMD Client Policy；Codex CLI 使用预注册 `aiqt-codex-cli` 与固定端口的精确 loopback callback。三者都是 public client，必须使用 Authorization Code + PKCE S256 并请求 `aiqt:research:read`。该 optional client scope 的 Audience mapper 固定加入 `aud=https://<domain>/mcp`。不得使用通配 redirect、用户名密码授权、匿名 DCR、把 ID token 当 access token，或把 audience 放宽为 Web client ID。

Keycloak 当前不能完整处理 RFC 8707 `resource` 参数，所以上述配置是单一 MCP resource 的固定 audience 兼容模式：它能产生本站 verifier 要求的精确 `aud`，但不能宣称支持任意多个 resource。CIMD 在当前固定 Keycloak 版本中仍标记为 experimental，升级 Keycloak 前必须重新执行真实 Claude metadata、loopback callback、hosted callback、PKCE、scope 与 audience 验收。不能使用通配 HTTPS redirect，也不能开启无约束匿名 DCR。

## 关键环境变量

| 变量 | 默认值 | 含义 |
| --- | --- | --- |
| `AIQT_MCP_TRANSPORT` | `stdio` | `stdio` 或 `streamable-http` |
| `AIQT_MCP_API_BASE_URL` | `http://127.0.0.1:8765` | 权威 Quant Core API；不接受带用户信息的 URL |
| `AIQT_MCP_HOST` | `127.0.0.1` | HTTP 监听地址 |
| `AIQT_MCP_ALLOW_NON_LOOPBACK_HTTP` | `false` | 仅受控容器网络可显式设为 `true`；非 loopback 否则拒绝启动 |
| `AIQT_MCP_PORT` | `8766` | HTTP 监听端口 |
| `AIQT_MCP_REQUEST_TIMEOUT_SECONDS` | `600` | API 超时，范围 1–3600 秒；覆盖较重的密封 P0 物化 |
| `AIQT_MCP_PUBLIC_RESOURCE_URL` | `${AIQT_PUBLIC_ORIGIN}/mcp` | 公网 canonical OAuth resource；必须与 public Origin 同源且路径精确为 `/mcp` |
| `AIQT_MCP_RATE_LIMIT_REQUESTS_1M` | `120` | 公网每租户每分钟 initialize/tool/resource 请求上限；只能收紧 |
| `AIQT_CLAUDE_CONNECT_ENABLED` | `false` | 公网 Claude 入口 readiness；仅在 Keycloak 迁移与真实协议验收后开启 |
| `AIQT_MCP_ENABLE_RESEARCH_WRITES` | `false` | 进程外授权该 MCP 会话执行研究型副作用；不要在无人监督或公网进程开启 |
| `AIQT_MCP_OPERATOR` | 空 | formal launch 的服务端操作者；不允许模型上传 |
| `AIQT_MCP_API_COOKIE` | 空 | 已认证 API Cookie；只适用于受控进程配置 |
| `AIQT_MCP_API_CSRF_TOKEN` | 空 | public mutation 的 CSRF token |
| `AIQT_MCP_API_ORIGIN` | 空 | public mutation 的 HTTPS Origin |

Cookie、CSRF、API 密钥和任何交易凭据都不得写进 AI prompt、MCP 参数、Git、日志或工具返回值。

`AIQT_MCP_OPERATOR`、API Cookie/CSRF、研究写开关和 `AIQT_SETTINGS_MASTER_KEY` 只属于本机或完整 Public API；public MCP 进程不接收浏览器 OIDC client secret、设置主密钥，也不使用这些字段。

## 推荐调用顺序

1. 读取 `aiqt://capabilities`、`aiqt://safety` 和 `aiqt://strategy-research/capabilities`。
2. 用 `aiqt_search_instruments` / `aiqt_read_market_context` 建立研究上下文。
3. 可选调用 `aiqt_select_research_candidates`，它只产生研究排序。
4. 操作者在进程外开启研究写授权后，调用 `aiqt_create_registered_research` 生成 formal sealed 源运行。
5. 调用 `aiqt_propose_strategy_research`；proposal 不启动实验。
6. 在受监督且已由进程外授权的会话中调用 `aiqt_launch_strategy_research`；它只排队正式实验，但会永久消费唯一 holdout。
7. 轮询 `aiqt_get_strategy_research` 或读取对应 Resource。
8. 完成后可调用 `aiqt_create_ai_review`；promotion、绑定和启动仍必须留在项目原有人工作流。
