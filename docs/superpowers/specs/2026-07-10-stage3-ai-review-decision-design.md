# 第 3 阶段可审计 AI 评审设计

## 目标

在最终主分支验收通过后正式关闭第 2 阶段，将第 3 阶段设为唯一当前产品阶段，并围绕已持久化的策略实验（Strategy Experiment）证据交付一套可审计的 AI 评审决策闭环。

每次评审都必须包含本地确定性基线。用户可以显式选择已配置的 OpenAI、OpenAI-compatible 或 Ollama provider，增加一次外部模型增强。外部 provider 是否可用不影响本地评审完成；AI 输出和人工研究决策都不能授权模拟或实盘执行。

## 已确认的产品决策

- AI 评审采用审计优先原则，并始终保留本地确定性基线。
- 人工决策是独立的追加式记录，不是 AI Review Run 上的可变字段。
- 一份评审支持一个主实验和可选的多个对比实验。
- 对比实验必须具有相同的市场、标的、周期和派生策略 lineage，但允许来自不同审计 run 和 canonical snapshot。
- 对比只评价一致性、稳健性和证据质量，不按原始收益率选出“全局最佳”。
- 人工决策状态为 `accepted_for_research`、`revision_requested`、`rejected` 和 `insufficient_evidence`。
- 外部模型只是可选增强。
- 第一批 provider adapter 为官方 OpenAI、通用 OpenAI-compatible 和原生 Ollama。
- 用户必须显式选择一个 provider；禁止静默跨 provider 切换，也不同时请求多个模型。

## 阶段边界

只有实施分支上的完整验收链全部通过后，才执行阶段切换：

- 第 0 阶段保持 `maintenance`。
- 第 1 阶段保持 `maintenance`，其完整验收链继续作为回归门禁。
- 第 2 阶段从 `current` 切换为 `maintenance`。
- 第 3 阶段从 `planned` 切换为 `current`。
- 第 4、5 阶段保持 `planned`。

本设计范围之外的既有 AI、组合、模拟交易、adapter 和审计能力继续作为基础设施使用。本设计不扩展第 4 或第 5 阶段。

## 非目标

- 不自动创建订单、批准模拟执行、修改组合或授权实盘。
- 不向外部模型发送原始 OHLCV、研究笔记正文、账户、持仓、订单或执行 payload。
- 不建设 provider 注册表 UI、动态模型发现、自动 provider 回退、重试队列、流式 UI、工具调用、联网搜索、RAG 或后台任务系统。
- 第一版不实现 Anthropic、Gemini 或其他 provider adapter。
- 不允许修改既有 AI Review Run 或人工 Decision。

## 架构

### 证据组装器

`AiReviewEvidenceAssembler` 接收一个主实验 ID 和最多四个对比实验 ID。它从 `ResearchRunStore` 与 `StrategyExperimentStore` 读取证据；客户端不能提交 metrics、hash、候选结果或评审结论。

组装器必须校验：

- 每个实验均存在且状态为 `completed`；
- experiment、definition、snapshot、source run、strategy revision、selected candidate、definition hash 和 result hash 相互一致；
- 选中候选具有 test metrics，未选中候选不具有 test metrics；
- 对比 ID 唯一，且不能与主实验 ID 重复；
- 全部对比实验满足上下文和策略 lineage 限制；
- 一份评审最多包含五个实验。

组装器输出 canonical evidence bundle 和 `evidenceHash`。

### 策略 Lineage

不新增策略族数据表。`strategyLineageKey` 是以下内容的 canonical hash：

- market、symbol 和 timeframe；
- 规范化后的策略名称；
- 有序的 entry/exit condition kinds；
- 每个 condition 排序后的参数键集合。

参数值、strategy revision、审计 run 和 snapshot 可以不同。策略名称、condition 顺序、condition kind 或参数结构变化时，必须生成不同 lineage。

### 确定性评审引擎

`DeterministicAiReviewEngine` 每次都必须运行。它评价证据完整性、数据质量、validation/test 一致性、回撤、交易次数、walk-forward 稳定性、跨实验一致性和实盘安全边界。

确定性引擎与外部 provider 使用相同的结构化 assessment schema：

- `stance`：`supported`、`caution`、`blocked` 或 `insufficient_evidence`；
- `summary`；
- `risks[]`：包含严重级别、说明和 evidence references；
- `invalidationConditions[]`；
- `watchItems[]`；
- `evidenceGaps[]`；
- 对比模式额外包含 `consistency`：`consistent`、`mixed`、`divergent` 或 `insufficient`。

引擎禁止输出订单、目标价格、仓位指令、收益保证或执行授权。

### 外部 Provider 层

由于范围内确实存在三个 provider，实现一个小型 `AiReviewProvider` protocol 和三个真实 adapter：

- `OpenAiResponsesProvider`：调用官方 OpenAI Responses API，并要求结构化输出。
- `OpenAiCompatibleProvider`：调用已配置的 Chat Completions-compatible endpoint。
- `OllamaChatProvider`：调用 Ollama 原生 chat endpoint，并通过 JSON Schema 指定输出格式。

选中的 provider 只能接收同一份受限 canonical evidence summary。Prompt 必须把全部证据字符串视为数据而不是指令。只有通过严格 JSON Schema 校验和 evidence-reference 校验的输出才能被接受。

确定性 assessment 与外部 assessment 在记录中保持独立。外部输出不能覆盖确定性 stance 或任何安全边界。

## Provider 配置

### 官方 OpenAI

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- 固定请求地址：`https://api.openai.com/v1/responses`

### 通用 OpenAI-Compatible

- `OPENAI_COMPATIBLE_BASE_URL`
- `OPENAI_COMPATIBLE_API_KEY`
- `OPENAI_COMPATIBLE_MODEL`
- 请求地址：`OPENAI_COMPATIBLE_BASE_URL.rstrip("/") + "/chat/completions"`

配置的 Base URL 必须包含 provider 自己的 API 前缀，例如 `https://example.com/v1`，但不能包含最终 `/chat/completions` endpoint。

### 原生 Ollama

- `OLLAMA_BASE_URL`，默认值为 `http://127.0.0.1:11434`
- `OLLAMA_MODEL`
- 请求地址：`OLLAMA_BASE_URL.rstrip("/") + "/api/chat"`

Compose 必须显式把这些变量传入 API 容器。Provider 状态只返回已配置/未配置状态、model 和脱敏 Base URL；脱敏结果保留 scheme、host、port 和 path，但移除 user info、query 和 fragment。Key 不能被返回或写入日志。

第一版每个 provider 只配置一个 model。UI 不发现远端模型，也不接受任意 endpoint。

## 外部数据边界

外部请求可以包含：

- experiment ID、evidence ID 和对应 hash；
- market、symbol、timeframe 与 snapshot 日期区间；
- 策略 condition 结构和风险参数；
- train、validation、selected-test 与 walk-forward 指标摘要；
- 数据质量状态和 warnings；
- 确定性 evidence references。

外部请求不能包含：

- 原始 bars；
- 自由文本研究笔记；
- API Key 或 secret-like metadata；
- 账户、持仓、组合、订单、paper execution 和 live adapter payload；
- 审计签名材料；
- 模型隐藏推理。

前端只有在展示 provider、model、脱敏 Base URL 和外发字段组后，才能启用外发确认框。

## Review Run Schema

`aiqt.aiReviewRun` schema v2 只能由后端生成，并且不可变。

必需的顶层字段：

- `schemaVersion`、`recordType`、`aiReviewId`、`createdAt`；
- `mode`：`single` 或 `comparison`；
- `primaryExperiment` 和 `comparisonExperiments`；
- `strategyLineageKey`、`evidenceHash`；
- `deterministicAssessment`；
- `externalAssessment`；
- `recordHash`；
- 固定的 evidence-only 和 paper/live-blocked 边界。

每个实验引用包含 experiment ID、source run ID、strategy revision、snapshot ID、definition hash、result hash、selected candidate ID、candidate revision、canonical data hash 和数据区间。

`externalAssessment` 包含：

- `status`：`completed`、`failed` 或 `skipped`；
- provider、model、脱敏 Base URL 和 endpoint hash；
- prompt-template version、output-schema version、受限的完整 rendered prompt、rendered-prompt hash 以及 evidence/request/response hashes；
- 成功时保存已校验的结构化输出；
- provider 返回的 token usage、latency 和受限错误分类/说明；
- 不包含 API Key 或隐藏推理字段。

现有 `ai_review_runs` 表增加可空的 v2 查询列。V2 采用不可变 insert：只有 `recordHash` 完全一致时，ID 冲突才可返回原记录；否则返回 conflict。Schema v1 记录继续支持读取、导入和导出，并在 UI 中明确标记为 legacy/non-authoritative。

旧的 run-scoped HTTP POST 会接收完整客户端 v1 record，因此必须退役。内部复现包导入流程仍可恢复合法 v1 记录。

## 人工 Decision Schema

`aiqt.aiReviewDecision` schema v1 保存到新的 `ai_review_decisions` 表。

必需字段：

- `decisionId`、`aiReviewId`、`createdAt` 和 `operator`；
- `status`：`accepted_for_research`、`revision_requested`、`rejected` 或 `insufficient_evidence`；
- 有长度限制的 `rationale`；
- `supersedesDecisionId`；
- `reviewRecordHash` 和 `evidenceHash`；
- paper-only/live-blocked 边界字段。

第一条 Decision 没有前置记录。后续 Decision 必须引用当前最新 Decision；引用过期记录时返回 `decision_conflict`。旧记录永远不能被更新或删除。

任何 Decision 状态都不能授权模拟或实盘执行。`accepted_for_research` 只表示该证据可以继续进入研究迭代。

## API

### Provider 状态

`GET /api/ai-review/providers`

返回 local、OpenAI、OpenAI-compatible 和 Ollama 的配置状态，不发起网络请求。

### 生成评审

`POST /api/ai-reviews`

请求只能包含：

- `primaryExperimentId`；
- `comparisonExperimentIds`；
- `providerId`；
- `externalDataApproved`。

Provider 为 `local` 时，`externalDataApproved` 必须是 `false`。使用外部 provider 时必须显式确认外发。

### 读取评审

- `GET /api/ai-reviews/{aiReviewId}`
- `GET /api/ai-reviews?runId=&experimentId=&limit=&offset=&query=`

现有 run-scoped GET 继续作为 v1/v2 历史的兼容投影。

### 人工决策

- `GET /api/ai-reviews/{aiReviewId}/decisions`
- `POST /api/ai-reviews/{aiReviewId}/decisions`

Decision 请求只能包含 operator、status、rationale 和 `supersedesDecisionId`。

## 处理流程

1. 校验精确请求结构。
2. 在调用任何 provider 前加载并校验主实验与对比实验。
3. 组装 canonical evidence bundle 并计算 hash。
4. 生成确定性 assessment。
5. 如果选择外部 provider，校验外发确认和 provider 配置。
6. 如果配置不完整，不发起外网请求，并记录失败的 external assessment。
7. 配置完整时，只调用一次指定 provider，并设置严格的连接、总耗时、响应大小和输出 token 上限。
8. 校验结构化响应和每一条 evidence reference。
9. 构造并插入不可变 v2 record。
10. 返回已保存 record 和最新人工 Decision 投影。

外部配置或运行失败不能导致本地评审失败。系统必须保存 `externalAssessment.status=failed` 的 Review Run；只有证据和请求结构错误才能阻止创建记录。

## 前端

在现有 AI Review 工作区增加一个权威 Stage 3 面板，不新增工作区。

- 当前 completed Strategy Experiment 自动成为主实验。
- 最多可以选择四个符合条件的对比实验。
- 不符合条件的实验显示简洁的上下文或 lineage 原因，并禁止选择。
- Provider 控件显示配置状态、model 和脱敏 Base URL。
- 外部 provider 必须显示外发数据确认。
- 结果区并排展示确定性和外部 assessment，不合并二者 stance。
- 历史区显示 evidence hash、实验集合、provider attempt、record hash 和 legacy/authoritative 状态。
- Decision 表单要求 operator、已批准状态、rationale 和最新 Decision 前置 ID。
- Decision 历史显示完整追加链。

加载策略候选、切换研究上下文或失去精确 experiment binding 时，必须清除当前 Review 选择并保持执行阻断。过期的异步 review/history/provider 响应不能写入新的工作区上下文。

## 错误处理

证据错误必须发生在任何外部请求之前：

- experiment 不存在：404；
- experiment 未完成、lineage/context/hash 不匹配或 consumed evidence 不一致：409；
- ID 重复、对比数量超限、未知字段或值非法：400。

选择未配置 provider 时，仍生成完整本地评审，但 `externalAssessment.status=failed`、错误为 `ai_review_provider_not_configured`，并且不发起外网请求。对于已配置 provider，timeout、HTTP 错误、响应过大、JSON 无效、schema 无效或 evidence reference 未知，同样生成本地评审并记录失败 external metadata。

Provider 错误说明必须限制长度，并递归脱敏 secret、token、API key、private key、password 和 authorization 字段。原始 provider 响应不能写入日志。

创建 Decision 时必须校验 Review record/evidence hashes 和最新前置 Decision。并发写入使用过期前置记录时返回 `decision_conflict`。

## 测试

### 后端

- canonical evidence 与 lineage hashes；
- single/comparison 证据组装；
- source run、revision、snapshot、definition、result 和 candidate 绑定；
- comparison 上下文和数量限制错误；
- selected-only test evidence；
- 确定性 assessment 输出；
- v2 record 不可变性和 v1 兼容性；
- Decision 追加顺序与并发 conflict。

### Provider 合约

测试使用本地假 HTTP server；CI 不调用真实 provider。

- 官方 OpenAI Responses 请求和结构化响应；
- 通用 Chat Completions URL 与响应映射；
- 原生 Ollama `/api/chat` schema 请求和 usage 映射；
- 缺少配置、timeout、HTTP 错误、无效 JSON/schema、响应过大和脱敏；
- 不跨 provider 回退，并且只发出一次请求。

### Web

- provider readiness 和显式外发确认；
- 主实验/对比实验选择与不合格原因；
- 确定性/外部结果展示；
- legacy 标记；
- Decision 创建和追加式历史；
- stale async 抑制、刷新恢复、翻译和窄屏布局。

## 验收

最终门禁包括：

- 聚焦后端与 Web 测试；
- 完整 `npm test`；
- Web 生产构建；
- 不删除持久卷的 Docker 重建；
- 完整第 1 阶段验收和当前 DMG；
- 第 2 阶段 smoke 和已保存 manifest 校验；
- 新增的确定性第 3 阶段 Docker smoke 和已保存 manifest 校验；
- 浏览器验收：单实验评审、多实验对比、刷新恢复、Decision 改判链、provider 未配置状态和窄屏布局；
- 使用当前 `.env` provider 进行一次显式授权的 OpenAI-compatible 外网 smoke。

外网 smoke 只发送已批准的最小 evidence summary，只发起一次请求，不回退、不重试，校验结构化结果和审计 hashes，脱敏日志，并且无论成功或失败都保持 paper/live 阻断。

只有所有非可选门禁通过后，才把第 2 阶段从 current 切换为 maintenance，并把第 3 阶段切换为 current。外部 provider 暂时不可用时必须记录失败，但不能阻止第 3 阶段通过，因为确定性 baseline 与 provider contract tests 才是权威门禁。

## 迁移与兼容

- 现有 v1 Review 记录和复现包继续支持读取与导入。
- V1 记录标记为 legacy/non-authoritative，不能满足第 3 阶段权威评审门禁。
- 现有研究 run 导出/导入继续携带 v1 records，并增加 v2 Review Run、Decision artifact 和 manifest counts。
- 导入写入前校验 record/evidence hashes、experiment references、Decision 前置链、artifact counts 和 live-blocked 边界。
- 导入回滚必须与既有 research-run artifacts 一起快照并恢复 v2 reviews 与 decisions。

## 完成标准

满足以下条件时，第 3 阶段开放完成：

- 后端生成的 v2 Review 在 single 和 comparison 模式均可用；
- 合法证据始终可以完成本地确定性评审；
- 三个外部 provider adapter 全部通过本地合约测试；
- 已配置的 OpenAI-compatible 外网 smoke 可审计且安全；
- 人工 Decisions 形成线性追加链；
- Review/export/import/replay 保留全部 hashes 和边界；
- 第 1、2、3 阶段、build、Docker、browser 和 desktop 门禁全部通过；
- 源码与文档中的第 2 阶段为 maintenance、第 3 阶段为 current。
