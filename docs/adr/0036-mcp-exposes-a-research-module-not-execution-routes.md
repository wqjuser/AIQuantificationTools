# MCP 只暴露研究模块，不镜像执行路由

## 状态

Accepted

## 背景

项目已经有行情、研究、策略、回测、AI 评审、审计和执行 API。把全部 HTTP 路由逐个改名为 MCP 工具会形成一层浅代理，使模型能够发现密钥、授权、Testnet、Live、委托和 Stage 6–10 路由，也会把浏览器 HTTP 的偶然结构变成外部 AI 契约。

## 决策

新增 `quant_core.mcp_service` 深模块。外部 Interface 只有固定研究工具和只读制品 Resources；实现通过固定 Quant Core 路径复用现有服务端事实、租户/CSRF 边界、注册模板、sealed 数据、正式实验、AI Review 和审计，不提供任意 URL 或通用 HTTP proxy。

MCP v1 可以读取市场上下文、研究运行、策略研发聚合、AI Review、研究审计和 fail-closed Paper 状态；研究写入只包括 AI 选股、注册模板 P0、proposal、formal launch 和 AI Review。研究写入默认关闭；操作者在 MCP Host 启动时通过进程外配置授权该受监督会话，调用方不能上传 `confirmed`、`operator`、`ownerId` 或外发批准。MCP v1 固定使用本地 Provider；需要逐次允许外发证据时仍使用现有网页授权流程。formal launch 会消费唯一 holdout，在 MCP 元数据中声明为不可逆副作用。

MCP v1 不包含 promotion、任意策略上传/保存/删除、策略绑定、自动交易控制、Paper 立即评估/对账、Testnet、Live、委托、密钥、通用审计写入或 Stage 6–10。注册模板 P0 复用既有 pipeline，可能持久化服务端生成的 draft；调用方不能提供策略正文，也不能晋级、绑定或启动该 draft。结果统一携带 `researchOnly` 边界，不能解释为收益保证或交易授权。

本机使用 stdio；可选 Streamable HTTP 只发布到宿主 loopback，并显式校验允许的 loopback `Host`/`Origin` 以阻断 DNS rebinding。容器内可以监听受控 Compose 网络，但不能因此关闭传输安全。现有 public OIDC Cookie/CSRF 不能代替远程 MCP OAuth。公网只读 MCP 的 OAuth Resource Server、`TenantContext` 映射和 Caddy 边界由 ADR-0037 补充；local MCP 仍不得直接发布到公网。

## 结果

- 外部 AI 学习的是稳定研究动作，而不是内部 HTTP 路由全集。
- 删除 MCP 层后，客户端将重新承担窗口推导、策略正文隔离、脱敏、错误模型和执行禁区，因此该模块具有实际深度。
- Quant Core 继续是唯一 source of truth；MCP 不新增数据库表、行情算法、回测引擎或交易状态机。
- 公网 MCP 只能沿 ADR-0037 的标准 OAuth/bearer、租户上下文、限流和只读工具面发布。
