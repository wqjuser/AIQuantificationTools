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

## Streamable HTTP：Docker 或本机远程进程

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

然后连接上面的 URL。Compose 只把端口发布到宿主 loopback；服务还显式校验 loopback `Host`/`Origin`，拒绝 DNS-rebinding 请求，并且 `deploy/Caddyfile` 不转发 `/mcp`。当前 public 认证是浏览器 OIDC Cookie/CSRF，不是远程 MCP OAuth；在专用 MCP OAuth 与 TenantContext 绑定完成前，禁止把这个 HTTP 端点直接暴露到公网。

## 关键环境变量

| 变量 | 默认值 | 含义 |
| --- | --- | --- |
| `AIQT_MCP_TRANSPORT` | `stdio` | `stdio` 或 `streamable-http` |
| `AIQT_MCP_API_BASE_URL` | `http://127.0.0.1:8765` | 权威 Quant Core API；不接受带用户信息的 URL |
| `AIQT_MCP_HOST` | `127.0.0.1` | HTTP 监听地址 |
| `AIQT_MCP_ALLOW_NON_LOOPBACK_HTTP` | `false` | 仅受控容器网络可显式设为 `true`；非 loopback 否则拒绝启动 |
| `AIQT_MCP_PORT` | `8766` | HTTP 监听端口 |
| `AIQT_MCP_REQUEST_TIMEOUT_SECONDS` | `600` | API 超时，范围 1–3600 秒；覆盖较重的密封 P0 物化 |
| `AIQT_MCP_ENABLE_RESEARCH_WRITES` | `false` | 进程外授权该 MCP 会话执行研究型副作用；不要在无人监督或公网进程开启 |
| `AIQT_MCP_OPERATOR` | 空 | formal launch 的服务端操作者；不允许模型上传 |
| `AIQT_MCP_API_COOKIE` | 空 | 已认证 API Cookie；只适用于受控进程配置 |
| `AIQT_MCP_API_CSRF_TOKEN` | 空 | public mutation 的 CSRF token |
| `AIQT_MCP_API_ORIGIN` | 空 | public mutation 的 HTTPS Origin |

Cookie、CSRF、API 密钥和任何交易凭据都不得写进 AI prompt、MCP 参数、Git、日志或工具返回值。

## 推荐调用顺序

1. 读取 `aiqt://capabilities`、`aiqt://safety` 和 `aiqt://strategy-research/capabilities`。
2. 用 `aiqt_search_instruments` / `aiqt_read_market_context` 建立研究上下文。
3. 可选调用 `aiqt_select_research_candidates`，它只产生研究排序。
4. 操作者在进程外开启研究写授权后，调用 `aiqt_create_registered_research` 生成 formal sealed 源运行。
5. 调用 `aiqt_propose_strategy_research`；proposal 不启动实验。
6. 在受监督且已由进程外授权的会话中调用 `aiqt_launch_strategy_research`；它只排队正式实验，但会永久消费唯一 holdout。
7. 轮询 `aiqt_get_strategy_research` 或读取对应 Resource。
8. 完成后可调用 `aiqt_create_ai_review`；promotion、绑定和启动仍必须留在项目原有人工作流。
