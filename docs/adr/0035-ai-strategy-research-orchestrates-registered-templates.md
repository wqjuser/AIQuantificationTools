# AI 策略研发只编排注册模板和正式实验链

## 状态

Accepted

## 背景

现有 AI 策略草稿只能在有限 SMA/RSI 结构内建议参数，正式实验、sealed holdout、AI 评审、promotion、策略库和 Paper 执行则已经各自拥有权威证据与安全边界。把这些能力复制成第二套“AI campaign”状态机，或允许模型生成任意可执行代码，都会造成回测与运行语义漂移，并让浏览器或 Provider 有机会伪造收益事实。

## 决策

新增单一深模块 `AiStrategyResearchOrchestrator`，只公开三个领域操作：

- `propose(request)` 只接受已经持久化的 formal sealed P0 源运行，从其服务端权威开发证据构造 AI 上下文。请求正文精确为 `sourceRunId + goal + providerId + externalDataApproved`；浏览器不能上传 `allowedTemplateIds` 或第二份模板注册表。`StrategyResearchCapabilityRegistry` 按源策略的 policy kind 与确定性评估器，以服务端注册顺序导出完整兼容集合；外部 AI 只能在该集合中选择并解释，本地 provider 使用确定性首选。候选参数网格完全由所选模板冻结，AI 和浏览器都不能改写。模板必须声明版本、支持的市场/周期、参数 schema 与边界、所需数据和确定性评估器；未知模板、越界参数、额外字段和任意 Python/JavaScript 一律拒绝。proposal 是持久化草稿，不保存策略、不启动实验。
- `launch(proposalId, operator, confirmed)` 只在人工确认后重新读取 proposal、模板能力和服务端数据，复用既有 P0、sealed dataset、`StrategyExperimentRunner` 和 experiment Store，先持久化 pending experiment 再返回稳定 `experimentId`。它不接受浏览器重新提交策略正文、候选排名或实验收益。
- `read(experimentId)` 只聚合既有 proposal、experiment、AI 评审、fresh P0、promotion、策略库与 Paper 状态的安全投影；这些记录仍由原领域 Store 各自拥有，read 不写状态，也不返回测试 K 线或测试内容哈希。

浏览器可以表达市场、标的、周期、研究目标、Provider 选择和外发授权，但不能上传 K 线、指标事实、收益、回撤、成交、排名、winner、gate 结果或审计哈希。所有受保护事实都由服务端读取、计算、规范化和重验；外部 Provider 每次使用仍需显式外发授权，且永远看不到 sealed test 分区。

AI 只负责在服务端筛出的兼容模板中选择和解释；参数网格、候选运行、开发集排名、唯一 rank-1 的一次性 test claim、盈利门与 fresh P0 继续由确定性正式实验链负责。没有唯一 winner 时不读取 test，winner 失败时不改测第二名。新策略族必须先通过原有 P0/策略能力入口形成具有同一 policy kind 的 formal sealed 源运行，AI 研发编排器不会从另一策略族的运行中暗自替换执行语义。

`GET /api/strategy-research/capabilities` 是浏览器唯一的注册能力读取 seam，只返回服务端注册顺序、模板版本、policy kind、市场上下文、sealed hash 版本、参数 schema、评估器版本，以及服务端推导的 `minimumRows / minimumPreRollRows / developmentScoringRows / withheldRows`；不返回测试身份或收益事实。pre-roll 同时覆盖策略 warmup 与已完成聚合 K 线的最坏 UTC 对齐：60m 最多 59 根，4h 最多 239 根。新 formal policy experiment 在 definition 中固定 `preRollVersion: formal-pre-roll-v2`，result hash 同时承诺该版本；历史缺字段记录仅按 legacy v1 语义与旧 hash 重验，未知或显式漂移版本失败关闭。

首个 formal sealed 源运行仍复用既有 `POST /api/p0/pipeline`，不是第四套运行或状态机。该入口的 `strategyConfig` 与 `registeredTemplateId` 严格二选一；注册 ID 只能由同一服务端 Registry 展开为 canonical v2 `StrategyConfig`，unknown 或市场上下文不匹配立即拒绝。注册路径必须携带符合 capability 投影的 sealed window，固定使用服务端 `10 / 10bps / 10bps` 正式成本假设；浏览器不得上传 policy、position 或 risk，若上传 assumptions 则必须精确相同。pre-roll 只用于构造完整指标上下文，收益、回撤、成交和净值评分从服务端推导的 `scoringWindow.start` 开始；源运行在 sealed snapshot 中持久化同一 `preRollVersion + scoringWindow`，proposal 重放、formal launch 和 fresh sealed P0 promotion 必须精确重验该身份与规范重放事实。缺少该身份的历史 inline/v1 记录继续沿用原校验语义。响应所指运行、运行审计和后续 proposal 重验使用同一 canonical config。

## public 与恢复边界

public 必须通过现有 `TenantContext` 和 `TenantStoreBundle` seam 承载 proposal、sealed dataset、test claim 与 experiment；它们均以 `(owner_id, 原业务 ID)` 隔离，`owner_id` 只能由服务端注入。public 不得回退到 local SQLite 或共享 sealed store。本决定据此明确修订 ADR-0033 的 local-only 部署限制，而不是绕过该限制；ADR-0033 的不可变证据、唯一 claim 和 safe-summary 约束继续有效。

异步 experiment 必须先持久化 pending 状态，worker 再以 `(owner_id, experiment task)` PostgreSQL lease 独占推进。开发候选与排名必须在 claim holdout 前作为 `development_completed` 检查点原子持久化；进程在此后重启只复用该检查点，不能重复排名。进程重启或 lease 过期后只能按已持久化阶段幂等恢复；不能重新 propose、重复读取 holdout 或生成第二个 winner。无法证明阶段身份与 claim 状态一致时失败关闭。

## 独立人工动作

`propose`、`launch` 和 `read` 都不能隐式执行 AI 接受、fresh P0、promotion、保存审计策略、Paper 绑定或监控启动。promotion、绑定和启动继续是不同的显式人工动作，并在各自入口重新校验证据；整个 AI 策略研发系统保持 Paper-only，不自动切换 Testnet/Live，不准备或提交外部订单。

## 结果

- 新策略能力必须先实现确定性评估语义、测试和注册模板，AI 不能靠提示词创造新的执行算法。
- 编排器集中保护跨阶段不变量，但不成为行情、实验、策略库、审计或交易状态的新 source of truth。
- local 与 public 复用同一领域流程；public 仅增加租户隔离持久化、lease 协调和可恢复执行。
