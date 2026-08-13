# AIQuantificationTools Context

本文件定义仓库当前权威术语。历史阶段说明以 ADR、Git 和 `design-qa.md` 为准；实现、测试和当前数据库事实优先于路线文档。

## 产品与部署

**研究主线**
`行情与选股 → 研究 → 策略 → 回测 → AI 评审`。这是默认用户路径。组合风控、执行中心和动态交易是高级执行；审计回放与设置是系统能力。

**local 模式**
默认部署模式。使用现有 SQLite/JSON、合成租户 `local`、无需登录，只监听本机。它不是可直接暴露到公网的单用户服务器。

**public 模式**
使用 PostgreSQL、本站自托管 Keycloak、OIDC、HTTPS 和严格租户隔离的个人多租户模式。Keycloak 负责本地账号、密码、登录与 OAuth/JWKS；Quant API 只负责应用会话和租户映射，不保存密码。缺少数据库、Issuer/Client、公开 HTTPS Origin 或主密钥时必须拒绝启动。全部迁移和安全验收完成前不得开放公网入口。

**公开部署 Origin**
`AIQT_PUBLIC_ORIGIN` 指向 Caddy 对外提供的唯一 HTTPS Origin。浏览器、Cookie、CORS、Origin/Host 校验和 OIDC callback 都以它为准；API 不独立暴露宿主端口。

**自托管认证 Origin**
`AIQT_AUTH_ORIGIN` 指向同一服务器上由 Caddy 暴露的 Keycloak HTTPS Origin。公网只代理 `aiqt` realm 与静态资源，不代理管理 API、master realm 或管理端口。Keycloak 提供本站邮箱注册、邮箱验证、密码重置和登录；SMTP 是开放这些流程的上线前置。公网同时启用 Google Keycloak identity broker，作为用户可选登录方式；国内用户始终可以只使用本站账号。普通登录与重新认证要求 `prompt=login + max_age=0` 并验证新鲜 `auth_time`；注册使用标准 `prompt=create`。退出必须先撤销应用会话，再在 Keycloak 可用时进入 RP-Initiated Logout。认证服务临时不可用只能降级回本站，不能阻止本地撤销，之后也不能靠旧 SSO Cookie 静默恢复账号。

**研究型 MCP 服务**
把既有 Quant Core 研究主线投影给兼容 AI Host 的受控协议层。它只拥有固定研究 tools/resources，不是通用 HTTP proxy，也不新增行情、回测或交易状态机。本机 stdio/loopback 研究写入默认关闭，进程外开关只授权受监督 MCP 会话的研究副作用；模型不能上传确认、操作者、租户或外发批准。公网 Streamable HTTP 是独立 OAuth Resource Server：Bearer 必须精确绑定 canonical `/mcp` resource，服务端用已验证且已存在的 `(issuer, subject)` 映射 `TenantContext`，再进入当前租户 Store；公网使用无状态 HTTP，只注册只读研究工具，按租户限流，不接收设置主密钥，并在进程内网关拒绝非研究 GET 路径。Claude 用户通过 AuthGate 保护的 `/connect/claude` 安装页进入官方预填连接流程；Keycloak 只接受受信任 Claude HTTPS Client ID Metadata，匿名 Dynamic Client Registration 继续关闭。该入口的服务端 readiness 默认关闭；版本化 realm 迁移与只读检查通过后只能在受控窗口开启协议验收，验收失败立即关闭，通过后才向普通用户发布。两种入口都不提供 promotion、绑定、监控控制、Testnet、Live、下单、密钥或 Stage 6–10 能力。

**租户上下文（TenantContext）**
由服务端认证会话创建，至少包含 `owner_id + issuer + subject + verified email`。public 私有 Store、密钥、授权、任务和订单只能通过该上下文访问，浏览器不能提供或覆盖 `owner_id`。

**认证操作者**
当前 OIDC 会话中的已验证邮箱。public 模式下浏览器顶层操作者字段必须等于该身份；它证明 OIDC 账户身份，不宣称法律实名、KYC 或金融合规身份。

**本站账号**
用户在自托管 Keycloak 自助注册，以邮件完成邮箱验证，并可通过邮件重置密码；管理员仍可创建或禁用账号。用户也可选择 Google 登录，但必须先进入 Keycloak broker，Quant API、MCP 和租户 Store 只看到固定 Keycloak `issuer + subject`，不接收 Google token。相同邮箱不得自动创建链接或合并租户；关联既有本站账号必须由用户先证明该账号控制权并显式确认。匿名动态客户端注册、团队、角色、邀请、计费和产品内账号管理仍不开放；应用用户状态只有 `active/disabled`。

**近期重新认证**
最近 5 分钟内完成 OIDC 重新认证。重新认证必须向自托管认证服务发送 `prompt=login + max_age=0`，并验证 ID token 的新鲜 `auth_time`；已有 SSO Cookie 不能静默替代。修改生产密钥、开启/续期实盘和恢复 Stage 10 控制必须同时具备该证据；普通登录会话不足以替代。

## 存储、安全与可移植性

**租户复合身份**
public 私有记录以 `(owner_id, 原业务 ID)` 唯一。相同 run/event ID 可在不同租户共存，但任何查询、更新、导出、授权或后台任务都不能跨租户。

**规范制品身份**
既有研究、策略、评审、审计和研究包继续使用原 canonical hash；`owner_id` 不进入制品 hash。制品因此可跨租户验证，但导入记录永远归当前租户。

**TenantStoreBundle**
把现有 Store API 映射到当前租户 PostgreSQL 记录的兼容 seam。领域服务不复制，public 不能回退到共享 SQLite 私有 Store。

**租户密钥**
平台主密钥经 HKDF 派生租户密钥，AES-GCM AAD 绑定 `owner_id + setting + keyVersion`。主密钥和明文用户密钥不得进入浏览器、日志、审计、研究包或数据库明文字段。

**公共行情缓存**
可跨租户共享的公开 OHLCV/报价缓存。它不能包含用户密钥、选股上下文、研究笔记、审计制品或私有标识。

**安全出站 URL**
public 用户可配置的 OpenAI-compatible、Webhook 等 URL 必须为 HTTPS，并同时通过管理员 Origin allowlist、DNS/IP 检查和重定向复核。loopback、私网、链路本地和云元数据地址一律阻断。

**受保护审计事件**
只能由专用领域入口创建、按规范 hash 校验并幂等回读的权威事件。通用审计写入口和研究包导入不能创建、预占或覆盖其命名空间。

**detached 导入**
从研究包导入的执行、授权或准入证据只能校验和回放，不能恢复生产控制、密钥、委托、成交、急停或执行权限。

## 行情、选股与研究

**已完成 K 线**
在参考时间已经闭合的 OHLCV。未来 K 线、当前形成中 K 线和超出证据时点的数据不能进入研究、到期收益、回测或基准事实。

**AI 选股**
服务端从权威候选固定执行 `100 → 20 → 5` 的研究排序。覆盖 A 股全市场、Binance USDT 现货和美股当前自选池。AI 只能重排合格候选并解释，不能补造数值事实或输出交易指令。

**研究专用边界**
AI 选股只输出“优先研究、观察、证据不足”。它不自动加入自选/观察池、不运行研究、不创建策略/仓位、不授权实盘，也不连接订单。

**选股来源绑定**
“开始研究”只携带 `selectionId + candidateEvidenceId` 切换到日 K 研究上下文。用户显式运行研究时，服务端从受保护审计重验并写入 `marketAiSelectionEvidence`；手动切换标的或周期会清除未运行绑定。

**固定到期复盘**
每 6 小时扫描当前租户已经显式创建、达到持有周期的选股记录。任务不调用 AI、不创建选股、不运行研究、不修改自选/观察池，也不连接交易。

**固定基准政策 v1**
A 股使用 `000300`，美股使用 `SPY`，加密资产使用 `BTC/USDT`。基准快照由服务端生成并审计；用户自选基准只用于探索。推荐本身等于基准时仍计算绝对收益，但不计相对样本。

**选股批次样本**
一次受保护 AI 选股记录是一个统计样本。同批最多 5 个推荐不能伪装成 5 个独立样本；批次 alpha 是可用推荐相对收益的等权平均，至少 4/5 推荐有完整同周期基准才合格。

**稳定研究价值 cohort**
由 `market + profile + horizon + weightsVersion + providerIdentity + benchmarkPolicyVersion` 唯一确定。持有周期、权重、Provider 身份或基准政策变化必须开启新 cohort，旧样本不能混入。

**非重叠到期批次**
按参考时间排序后，持有窗口不与上一个已纳入批次重叠的样本。重叠批次仍展示结果，但不进入稳定性判定。

**稳定价值状态**
固定为 `insufficient_sample / collecting / stable_positive / not_stable`。只有同一 cohort 至少 30 个非重叠到期批次、覆盖 3 个自然月、基准覆盖率至少 80%、相对命中率 95% Wilson 下界高于 50%，且批次中位 alpha 大于 0，才是 `stable_positive`。

## 策略、回测与 AI 评审

**注册策略模板（Registered Strategy Template）**
由服务端登记、已经实现并测试、具有版本化策略类型、canonical base StrategyConfig、冻结参数网格和可启动 sealed 数据要求的可执行策略能力。浏览器通过 capability read 获取服务端投影，但不能上传模板集合、policy 或 risk；服务端按源研究运行语义以注册顺序导出完整兼容集合，AI 只能在该集合内选择并解释，不能改写参数网格、生成任意代码或创造未注册交易语义。

**注册模板 P0 启动（Registered Template P0 Bootstrap）**
复用既有 P0 pipeline 创建首个 formal sealed 源运行的服务端入口，不是新的研究状态机。请求中 `registeredTemplateId` 与旧 `strategyConfig` 严格二选一；注册路径由服务端展开 canonical v2 策略、推导 warmup/72 天开发评分/18 天留出窗口并固定 10/10/10 成本，浏览器不能重传 policy、position、risk 或漂移 assumptions。

**策略研发提案（Strategy Research Proposal）**
AI 基于服务端权威 formal sealed P0 证据形成的“兼容注册策略模板 + 服务端冻结参数网格”候选。它只是待人工确认的研究草稿，不启动正式策略实验，也不构成 promotion、策略绑定或交易启动。

**密封策略数据集（Sealed Strategy Dataset）**
一次性固定来源、区间、开发/测试分区和内容承诺的不可变研究制品。候选只能使用开发分区，唯一 rank-1 仅能一次性读取测试分区；public 中该制品及 claim 必须归属当前租户。

**正式策略实验（Formal Strategy Experiment）**
人工确认后，使用密封策略数据集完成开发候选比较和唯一 holdout 验证的持久化研究运行。新 policy experiment 的 definition 与 result hash 必须共同承诺 `formal-pre-roll-v2`，使 warmup 和 5m/60m/4h 已完成 K 线对齐语义可审计。实验结果是研究证据，不是收益保证、promotion、策略绑定、运行启动或生产授权。

**策略版本**
绑定市场、标的、周期、规则和 canonical hash 的人工可追溯修订。AI 只生成候选；必须人工采用并重新保存/审计，不能自动覆盖当前策略。

**回测事实**
只由当时可见的已完成 K 线、固定策略版本、费用与滑点模型产生。回测结果不是收益保证，也不构成生产授权。

**本地确定性评审**
AI 评审的权威基线。外部 Provider 仅提供补充意见；超时、失败、非法结构或交易语义拒绝都不能覆盖本地结论。

**外发授权**
用户对当前评审或研究显式允许发送证据。授权不允许发送密钥、已有私有笔记或无关上下文，也不等于授权任何交易动作。

## 执行与真实资金

**Paper/Shadow/Testnet**
模拟、本地影子和 Binance Spot Testnet 执行域。它们可验证订单规范、授权、幂等和对账，但都不代表真实资金生产授权。

**模拟账户会话**
用户显式设置初始 USDT 本金的纸面自动交易账本。会话运行后本金锁定；暂停并二次确认后才能新建会话，当前持仓和当期账本清零，但旧成交与重置审计永久保留。纸面信号只在下一根已完成 K 线的开盘价结算，不向测试网或生产路由提交订单；结果是基于真实市场数据、固定手续费假设的模拟收益，不等同于真实成交或收益保证。

**Stage 10 生产控制**
受控 Binance Spot 生产现货路径。开启前必须同时满足租户专用凭据、近期重新认证、权限复核、急停恢复、账户覆盖、风险限额、策略证据和生产 lease。

**活动生产账户指纹**
由服务端通过生产凭据只读获取 Binance 账户 UID 后派生并跨租户唯一声明的脱敏身份；不能用 API Key 本身代替账户身份。同一账户轮换 Key 后仍得到同一指纹，一个活动指纹只能由一个租户控制；它不进入浏览器或研究包。

**生产 lease**
PostgreSQL 中按租户/任务或账户唯一持有的短期租约。多 API 实例不能同时执行同一租户后台任务或同一生产控制路径。

**未决订单只读对账**
对已提交但未终态委托继续用原 `clientOrderId` 查询。退出登录、会话过期、暂停或急停只阻断新授权和新委托，不能丢弃已有成交事实，也不能用新 ID 补单。

**真实资金验收**
只能在独立环境由用户显式授权。默认 CI、文档验收和自动化测试必须在外部下单调用前阻断，不能提交真实生产订单。

## 自动化边界

当前允许的后台自动化只有：已启用自动交易状态的既有对账/评估、用户显式选股的到期复盘，以及用户显式确认并 launch 后的正式策略实验恢复执行。三者都使用 PostgreSQL lease；正式策略实验 worker 只能推进已持久化的 pending experiment，不能自动 propose、promotion、绑定或启动。

在稳定价值 cohort 达到严格门槛前，不考虑批量研究或自动观察池。即使达到门槛，AI 选股仍不得直接连接订单或生产交易。
