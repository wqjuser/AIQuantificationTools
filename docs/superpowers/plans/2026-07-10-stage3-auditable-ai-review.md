# 第 3 阶段可审计 AI 评审实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付以已持久化 Strategy Experiment 为唯一输入、以后端确定性评审为基线、支持单次显式外部 Provider 增强，并以不可变 Review Run 与追加式人工 Decision 形成完整审计闭环的第 3 阶段能力。

**Architecture:** 在 quant core 内增加证据组装、确定性引擎、三个小型 Provider adapter、不可变 v2 Review 存储与 Decision 账本；API 只接受实验 ID 和 Provider 选择，不接受客户端结论。前端在现有 AI Review 工作区内展示证据选择、双轨评审和 Decision 链。研究包导出/导入、Docker smoke、桌面产物与阶段门禁共同验证闭环。

**Tech Stack:** Python 3.12 标准库、SQLite、`unittest`、React 19、TypeScript 5.9、Vitest 4、Vite 8、Docker Compose、Tauri 2。

**Design:** `docs/superpowers/specs/2026-07-10-stage3-ai-review-decision-design.md`

## 全局约束

- 不新增第三方 Python/TypeScript 依赖、任务队列、Provider SDK、状态库、数据库迁移框架或模型注册表。
- 本地 `DeterministicAiReviewEngine` 每次都运行；外部 Provider 失败不能取消本地评审。
- 一份 Review 最多包含 1 个主实验和 4 个对比实验，总数最多 5。
- 只有 `completed` 实验可以参与；对比实验必须满足相同 market/symbol/timeframe 和 `strategyLineageKey`。
- Provider 必须由用户精确选择；每次最多一次 HTTP 请求，不重试、不跨 Provider 回退、不并行请求多个模型。
- 外部请求连接超时 5 秒、总超时 30 秒、响应体上限 65,536 bytes、结构化输出上限 1,200 tokens、rendered prompt 上限 24,000 个 Unicode 字符。
- Provider 错误说明最多 500 字符；`operator` 去空白后为 1–80 字符；`rationale` 去空白后为 1–2,000 字符。
- rendered prompt 可以入账，但只允许包含批准后的 canonical evidence summary；禁止 bars、研究笔记正文、账户、持仓、订单、执行 payload、secret、签名材料和隐藏推理。
- `aiqt.aiReviewRun` v2 由后端生成且不可变；相同 ID 只允许相同 `recordHash` 的幂等读取。
- 新增的 lineage、evidence、record、prompt、request、response 和 endpoint hashes 全部复用 `canonical_sha256` 风格，保存为 64 位小写十六进制字符串，不增加 `sha256:` 前缀。
- `aiqt.aiReviewDecision` v1 只追加不更新；新 Decision 必须引用当前最新 Decision，否则返回 `decision_conflict`。
- 任意 Review 或 Decision 都保持 `paperOnly=true`、`liveTradingAllowed=false`、`orderSubmissionAllowed=false`。
- v1 AI Review 继续可读、可导入、可导出，但明确标记 `legacy/non-authoritative`；旧的客户端全量 v1 POST 退役。
- CI 只运行本地 fake HTTP Provider 合约；真实 OpenAI-compatible 冒烟必须显式授权，且只执行一次。
- 阶段状态只能在全部非可选门禁通过后切换：Stage 2 `current -> maintenance`，Stage 3 `planned -> current`。
- 每个行为任务遵循 RED/GREEN；每个独立可评审交付都提交一次；完成声明前执行 `superpowers:verification-before-completion`。

## 文件结构

### 新建

- `services/quant_core/quant_core/ai_review_stage3.py` — evidence assembler、lineage、确定性引擎、Review orchestration 与 canonical hashes。
- `services/quant_core/quant_core/ai_review_providers.py` — Provider 配置、脱敏、HTTP transport 与三个 adapter。
- `services/quant_core/quant_core/ai_review_decisions.py` — 追加式 Decision SQLite store。
- `services/quant_core/tests/test_ai_review_stage3.py` — Stage 3 后端、Provider、store 与 HTTP 契约测试。
- `apps/web/src/lib/ai-review-stage3.ts` — v2 类型、运行时校验、选择资格和展示模型。
- `apps/web/src/lib/ai-review-stage3.test.ts` — Stage 3 前端领域测试。
- `apps/web/src/components/AiReviewStage3Section.tsx` — 权威 Stage 3 面板。

### 修改

- `services/quant_core/quant_core/ai_review_runs.py` — v2 查询列、不可变写入和 v1/v2 兼容读取。
- `services/quant_core/quant_core/api.py` — Provider、Review、Decision API 和研究包导入导出。
- `services/quant_core/tests/test_quant_core.py` — Compose、Stage 脚本与部署契约测试。
- `apps/web/src/lib/terminal-api.ts` 与 `terminal-api.test.ts` — Stage 3 HTTP client。
- `apps/web/src/lib/terminal-workbench.ts` 与 `terminal-workbench.test.ts` — v2 归档索引、diff 和阶段投影。
- `apps/web/src/App.tsx` — 选择、运行、历史、Decision 和 stale-response 状态。
- `apps/web/src/lib/i18n.ts` 与 `i18n.test.ts` — 中英文 UI 文案。
- `apps/web/src/styles.css` 与 `layout-css.test.js` — 双轨结果、Decision 链和窄屏布局。
- `tools/docker_smoke.py` — Stage 3 deterministic/live acceptance 和 manifest validator。
- `package.json` — Stage 3 smoke 命令。
- `compose.yaml` 与 `.env.example` — 显式 Provider 环境变量透传。
- `apps/web/src/lib/deployment.test.js` — Compose 与命令契约。
- `docs/product-plan.md` 与 `docs/architecture.md` — Stage 3 当前边界、API 与验收说明。

---

### 任务 1：建立 canonical evidence 与策略 lineage

**文件：**

- 新建：`services/quant_core/quant_core/ai_review_stage3.py`
- 新建：`services/quant_core/tests/test_ai_review_stage3.py`
- 读取复用：`services/quant_core/quant_core/canonical.py`
- 读取复用：`services/quant_core/quant_core/strategy_experiment_store.py`
- 读取复用：`services/quant_core/quant_core/runs.py`

**接口：**

`AiReviewEvidenceAssembler.assemble(primary_experiment_id, comparison_experiment_ids) -> dict[str, Any]` 返回：

```python
{
    "schemaVersion": 1,
    "mode": "single" | "comparison",
    "primaryExperiment": {...},
    "comparisonExperiments": [{...}],
    "strategyLineageKey": "<64-lowercase-hex>",
    "evidenceItems": [{"id": "experiment:<id>:...", "kind": "...", "value": ...}],
    "safetyBoundary": {
        "paperOnly": True,
        "liveTradingAllowed": False,
        "orderSubmissionAllowed": False,
    },
    "evidenceHash": "<64-lowercase-hex>",
}
```

`build_strategy_lineage_key(experiment: Mapping[str, Any]) -> str` 只编码 market、symbol、timeframe、规范化策略名、有序 condition kinds 和各 condition 排序后的 parameter keys。

- [ ] **步骤 1：写证据组装失败测试**

在 `test_ai_review_stage3.py` 添加自包含的临时 SQLite fixtures，覆盖：

- 主实验不存在、状态非 `completed`；
- source run、strategy revision、snapshot ID、definition hash、result hash 或 selected candidate 绑定不一致；
- selected candidate 缺少 test metrics；
- 未选中 candidate 泄露 test metrics；
- 对比 ID 重复、包含主 ID、超过 4 个；
- market/symbol/timeframe 不同；
- strategy name、condition 顺序、condition kind 或 parameter-key 结构不同。

运行：

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewEvidenceAssemblerTests -v
```

预期：因模块或接口尚不存在而失败。

- [ ] **步骤 2：实现 lineage canonicalization**

实现：

```python
def build_strategy_lineage_key(experiment: Mapping[str, Any]) -> str:
    body = {
        "market": normalize_token(experiment["market"]),
        "symbol": normalize_token(experiment["symbol"]),
        "timeframe": normalize_token(experiment["timeframe"]),
        "strategyName": normalize_strategy_name(experiment["strategy"]["name"]),
        "entryConditions": condition_shapes(experiment["strategy"]["entryConditions"]),
        "exitConditions": condition_shapes(experiment["strategy"]["exitConditions"]),
    }
    return canonical_sha256(body)
```

规范化策略名只做 `strip`、连续空白压缩和 `casefold`；不得删除标点或重排 condition。

- [ ] **步骤 3：实现 assembler 与精确错误**

新增 `AiReviewStage3Error(code, status, detail)`。证据错误映射为：

- `ai_review_experiment_not_found` / 404；
- `ai_review_experiment_not_completed` / 409；
- `ai_review_evidence_conflict` / 409；
- `ai_review_comparison_ineligible` / 409；
- `invalid_ai_review_request` / 400。

Assembler 从 store 读取，不接受客户端 metrics/hash。对 bundle 移除 `evidenceHash` 后使用现有 canonical JSON helper 计算 SHA-256，再写回 `evidenceHash`。

- [ ] **步骤 4：补 happy-path 与 hash 稳定性测试**

验证 single、1+4 comparison、不同参数值/strategy revision/run/snapshot 仍可共 lineage、输入字典 key 顺序不影响 hash、对比顺序保持用户选择顺序但 hash 可复现。

运行：

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewEvidenceAssemblerTests -v
```

预期：全部通过。

- [ ] **步骤 5：提交**

```bash
git add services/quant_core/quant_core/ai_review_stage3.py services/quant_core/tests/test_ai_review_stage3.py
git commit -m "feat: assemble canonical ai review evidence"
```

---

### 任务 2：实现本地确定性评审引擎

**文件：**

- 修改：`services/quant_core/quant_core/ai_review_stage3.py`
- 修改：`services/quant_core/tests/test_ai_review_stage3.py`

**接口：**

`DeterministicAiReviewEngine.evaluate(evidence_bundle) -> dict[str, Any]` 输出：

```python
{
    "stance": "supported" | "caution" | "blocked" | "insufficient_evidence",
    "summary": "...",
    "risks": [{
        "severity": "low" | "medium" | "high" | "critical",
        "message": "...",
        "evidenceReferences": ["experiment:..."],
    }],
    "invalidationConditions": ["..."],
    "watchItems": ["..."],
    "evidenceGaps": ["..."],
    "consistency": "consistent" | "mixed" | "divergent" | "insufficient",
}
```

- [ ] **步骤 1：写规则表测试**

固定 evidence fixtures，覆盖：

- 缺少 validation/test/walk-forward 证据 -> `insufficient_evidence`；
- 数据质量 blocked 或 hash/边界异常 -> `blocked`；
- validation/test 方向翻转、回撤越界、交易次数过少、walk-forward 多数窗口失败 -> 至少 `caution`；
- 多实验指标方向和风险一致 -> `consistent`；
- 部分冲突 -> `mixed`；
- 多数冲突 -> `divergent`；
- 单实验或有效对比不足 -> `insufficient`；
- 所有 risk evidence reference 必须存在于 `evidenceItems[].id`；
- 文本不包含下单、目标价、仓位指令、收益保证。

运行：

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.DeterministicAiReviewEngineTests -v
```

预期：失败。

- [ ] **步骤 2：实现确定性规则**

按严重级别聚合规则，stance 优先级固定为：

```text
blocked > insufficient_evidence > caution > supported
```

所有阈值定义为模块常量并在输出 `watchItems` 或 `invalidationConditions` 中解释；禁止依赖当前时间、随机数、网络或全局状态。

- [ ] **步骤 3：实现统一 assessment validator**

新增 `validate_assessment(payload, known_evidence_ids)`，供本地引擎与外部 Provider 共同使用。拒绝未知字段、空字符串、未知 enum、超过 50 项的数组、超过 2,000 字符的单条文本和未知 evidence reference。

- [ ] **步骤 4：验证确定性与 canonical 输出**

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.DeterministicAiReviewEngineTests -v
```

预期：全部通过，同一 evidence bundle 重复评审结果完全相同。

- [ ] **步骤 5：提交**

```bash
git add services/quant_core/quant_core/ai_review_stage3.py services/quant_core/tests/test_ai_review_stage3.py
git commit -m "feat: add deterministic ai review baseline"
```

---

### 任务 3：实现 Provider 配置、脱敏与三个 adapter

**文件：**

- 新建：`services/quant_core/quant_core/ai_review_providers.py`
- 修改：`services/quant_core/tests/test_ai_review_stage3.py`

**接口：**

```python
ProviderId = Literal["local", "openai", "openai-compatible", "ollama"]

@dataclass(frozen=True)
class ProviderStatus:
    provider_id: ProviderId
    configured: bool
    model: str | None
    sanitized_base_url: str | None

class AiReviewProvider(Protocol):
    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
    ) -> ProviderAttempt: ...
```

具体实现类固定为 `OpenAiResponsesProvider`、`OpenAiCompatibleProvider` 和 `OllamaChatProvider`；registry 只按四个固定 `ProviderId` 返回 local 状态或其中一个 adapter，不支持动态注册。

- [ ] **步骤 1：建立本地 fake HTTP server 合约测试**

使用 `http.server.ThreadingHTTPServer` 和测试线程，不访问公网。记录 method、path、headers、JSON body 和请求次数，覆盖：

- OpenAI 固定 `/v1/responses`，使用 Responses structured output；
- compatible 精确拼接 `base_url.rstrip("/") + "/chat/completions"`；
- Ollama 精确拼接 `base_url.rstrip("/") + "/api/chat"` 并发送 JSON Schema `format`；
- 三者各自映射模型、结构化内容、usage 和 latency；
- 每次调用只产生一次请求。

运行：

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewProviderContractTests -v
```

预期：失败。

- [ ] **步骤 2：实现配置读取与状态**

只读取：

- OpenAI：`OPENAI_API_KEY`、`OPENAI_MODEL`；
- compatible：`OPENAI_COMPATIBLE_BASE_URL`、`OPENAI_COMPATIBLE_API_KEY`、`OPENAI_COMPATIBLE_MODEL`；
- Ollama：`OLLAMA_BASE_URL`（默认 `http://127.0.0.1:11434`）、`OLLAMA_MODEL`。

`sanitize_base_url` 保留 scheme、hostname、port、path；移除 userinfo、query、fragment。任何状态和异常对象不得保存 key。

- [ ] **步骤 3：用标准库实现受限 HTTP transport**

使用 `urllib.request`，强制：

- connect/overall timeout 常量；
- `Content-Type: application/json`；
- 流式读取至 65,537 bytes，超限立即失败；
- 只解析 UTF-8 JSON；
- 不记录原始响应；
- 错误递归替换名称包含 `secret`、`token`、`api_key`、`apikey`、`private_key`、`password`、`authorization` 的字段；
- 受限错误 code 为 `timeout`、`http_error`、`response_too_large`、`invalid_json`、`invalid_schema` 或 `unknown_evidence_reference`。

- [ ] **步骤 4：实现三个 adapter**

OpenAI Responses 请求使用固定 URL 与 JSON Schema structured output；compatible 使用 `response_format.type=json_schema`；Ollama 使用 native `format=<schema>`、`stream=false`。从各自响应形状中只提取结构化 assessment 与 usage。

- [ ] **步骤 5：补失败与零回退测试**

覆盖未配置、timeout、401/500、响应过大、invalid UTF-8/JSON/schema、未知 evidence reference、错误体含 secret，以及指定 adapter 失败后其他 fake server 请求计数仍为 0。

运行：

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewProviderContractTests -v
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add services/quant_core/quant_core/ai_review_providers.py services/quant_core/tests/test_ai_review_stage3.py
git commit -m "feat: add bounded ai review providers"
```

---

### 任务 4：把 AI Review Store 扩展为不可变 v2

**文件：**

- 修改：`services/quant_core/quant_core/ai_review_runs.py`
- 修改：`services/quant_core/tests/test_ai_review_stage3.py`

**数据库迁移：**

保留现有表名和 `record_json`，通过幂等 `ALTER TABLE` 增加：

```sql
schema_version INTEGER,
primary_experiment_id TEXT,
evidence_hash TEXT,
record_hash TEXT,
authority TEXT
```

新增索引：`created_at`、`run_id`、`primary_experiment_id`、`record_hash`。旧行在读取时按 JSON 推导 v1/legacy，不回写重算。

- [ ] **步骤 1：写迁移与不可变性测试**

覆盖：

- 从旧 schema 打开后自动补列且旧 v1 仍可读；
- `record_v2` 插入完整 v2；
- 相同 `aiReviewId + recordHash` 返回原记录；
- 相同 ID 不同 hash 返回 `ai_review_record_conflict`；
- v2 缺 hash、边界不安全或 schema 错误被拒绝；
- 按 run、experiment、query、limit/offset 读取 v1/v2；
- v1 返回 `authority=legacy`，v2 返回 `authority=authoritative`。

- [ ] **步骤 2：实现 v2 dataclass 和 codec**

保留 `AiReviewRunRecord` v1，新增 `AuthoritativeAiReviewRunRecord` 或明确的 discriminated union。数据库中存储完整 canonical record；查询列只用于筛选，不是 hash 的替代来源。

- [ ] **步骤 3：实现 immutable insert**

v2 使用 `BEGIN IMMEDIATE`。冲突检查与 insert 位于同一事务。不得使用现有 v1 `INSERT ... ON CONFLICT DO UPDATE` 路径。

- [ ] **步骤 4：验证 store**

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewRunStoreV2Tests -v
```

预期：全部通过。

- [ ] **步骤 5：提交**

```bash
git add services/quant_core/quant_core/ai_review_runs.py services/quant_core/tests/test_ai_review_stage3.py
git commit -m "feat: persist immutable ai review v2 records"
```

---

### 任务 5：建立追加式人工 Decision 账本

**文件：**

- 新建：`services/quant_core/quant_core/ai_review_decisions.py`
- 修改：`services/quant_core/tests/test_ai_review_stage3.py`

**数据库：**

```sql
CREATE TABLE IF NOT EXISTS ai_review_decisions (
  decision_id TEXT PRIMARY KEY,
  ai_review_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  supersedes_decision_id TEXT,
  review_record_hash TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  record_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_review_decisions_review_created
ON ai_review_decisions(ai_review_id, created_at, decision_id);
```

- [ ] **步骤 1：写 Decision 账本测试**

覆盖：

- 四个允许状态；
- operator/rationale 边界；
- 第一条必须 `supersedesDecisionId=null`；
- 后续必须引用最新 Decision；
- 过期或错误 predecessor -> `decision_conflict`；
- review 不存在或 v1 legacy review -> 拒绝；
- review/evidence hashes 自动从已保存 v2 review 绑定，客户端不能覆盖；
- 同 ID 同 record hash 幂等，不同内容冲突；
- 两个连接并发追加只有一个成功；
- list 返回完整线性链且从不更新/删除旧记录。

- [ ] **步骤 2：实现 Decision record 和 store**

由后端生成 `decisionId`、`createdAt`、hash 与固定边界。`append` 使用 `BEGIN IMMEDIATE` 读取最新记录并写入，避免 read-then-write 竞态。

- [ ] **步骤 3：实现导入专用校验入口**

`restore_validated(record)` 只供研究包导入调用：验证 schema、record hash、review hash、evidence hash、边界和 predecessor 顺序，不允许跳过链校验。

- [ ] **步骤 4：验证**

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewDecisionStoreTests -v
```

预期：全部通过。

- [ ] **步骤 5：提交**

```bash
git add services/quant_core/quant_core/ai_review_decisions.py services/quant_core/tests/test_ai_review_stage3.py
git commit -m "feat: add append-only ai review decisions"
```

---

### 任务 6：实现 Review orchestration 与审计 record

**文件：**

- 修改：`services/quant_core/quant_core/ai_review_stage3.py`
- 修改：`services/quant_core/quant_core/ai_review_providers.py`
- 修改：`services/quant_core/tests/test_ai_review_stage3.py`

**接口：**

```python
AiReviewStage3Service.create_review(
    *,
    primary_experiment_id: str,
    comparison_experiment_ids: Sequence[str],
    provider_id: ProviderId,
    external_data_approved: bool,
) -> dict[str, Any]
```

- [ ] **步骤 1：写 orchestration 测试**

覆盖：

- `local + approved=false` 成功，`externalAssessment.status=skipped`；
- `local + approved=true` 请求非法；
- 外部 Provider 未确认时在网络调用前失败；
- 外部 Provider 未配置时保存本地 Review，external 为 `failed/ai_review_provider_not_configured`，请求数 0；
- Provider 成功时保存 baseline 与 external 两份独立 assessment；
- Provider 运行失败时仍保存本地 Review；
- evidence 错误时不保存 Review 且请求数 0；
- rendered prompt 不包含 bars、notes、account/order/secret fixtures；
- prompt 超 24,000 字符时按确定性结构化压缩或拒绝，不做隐式截断破坏 JSON；
- record/evidence/request/response/prompt/endpoint hashes 可重算；
- `recordHash` 排除自身字段后计算；
- 同请求重复执行生成不同 Review ID，不把评审当缓存。

- [ ] **步骤 2：实现 evidence-only prompt renderer**

定义版本常量：

```python
PROMPT_TEMPLATE_VERSION = "aiqt-ai-review-v1"
OUTPUT_SCHEMA_VERSION = "aiqt-ai-review-assessment-v1"
```

Prompt 明确说明所有 evidence strings 都是数据而非指令，只输出 schema，不输出下单建议或隐藏推理。完整 rendered prompt 入账前再次运行 forbidden-field scanner。

- [ ] **步骤 3：实现 external attempt**

构造并保存：

- provider/model/sanitized base URL；
- endpoint hash，不保存包含 userinfo/query 的原 endpoint；
- template/schema versions；
- rendered prompt 与 hash；
- evidence/request/response hashes；
- status、validated assessment、usage、latency；
- 失败时受限 error code/message。

- [ ] **步骤 4：构造并持久化 v2 record**

record 顶层固定：

```python
{
    "schemaVersion": 2,
    "recordType": "aiqt.aiReviewRun",
    "aiReviewId": "...",
    "createdAt": "...",
    "mode": "single" | "comparison",
    "primaryExperiment": {...},
    "comparisonExperiments": [...],
    "strategyLineageKey": "...",
    "evidenceBundle": {...},
    "evidenceHash": "...",
    "deterministicAssessment": {...},
    "externalAssessment": {...},
    "boundary": {
        "purpose": "research_evidence_review_only",
        "paperOnly": True,
        "liveTradingAllowed": False,
        "orderSubmissionAllowed": False,
    },
    "recordHash": "<64-lowercase-hex>",
}
```

- [ ] **步骤 5：运行聚焦测试**

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewStage3ServiceTests -v
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add services/quant_core/quant_core/ai_review_stage3.py services/quant_core/quant_core/ai_review_providers.py services/quant_core/tests/test_ai_review_stage3.py
git commit -m "feat: orchestrate auditable ai review runs"
```

---

### 任务 7：发布 Provider、Review 与 Decision API

**文件：**

- 修改：`services/quant_core/quant_core/api.py`
- 修改：`services/quant_core/tests/test_ai_review_stage3.py`
- 修改：`services/quant_core/tests/test_quant_core.py`

**路由：**

- `GET /api/ai-review/providers`
- `POST /api/ai-reviews`
- `GET /api/ai-reviews/{aiReviewId}`
- `GET /api/ai-reviews?runId=&experimentId=&limit=&offset=&query=`
- `GET /api/ai-reviews/{aiReviewId}/decisions`
- `POST /api/ai-reviews/{aiReviewId}/decisions`

- [ ] **步骤 1：写 HTTP 契约失败测试**

启动临时 API server，验证请求只接受精确字段：

```json
{
  "primaryExperimentId": "experiment-1",
  "comparisonExperimentIds": [],
  "providerId": "local",
  "externalDataApproved": false
}
```

Decision 只接受：

```json
{
  "operator": "researcher",
  "status": "accepted_for_research",
  "rationale": "证据足以进入下一轮研究，但不授权模拟或实盘。",
  "supersedesDecisionId": null
}
```

覆盖未知字段、错误类型、数组上限、错误 enum、分页边界、404/409/400 映射和安全字段。

- [ ] **步骤 2：装配 stores/services**

在 API handler 初始化阶段复用当前数据库路径，注入 experiment/run/review/decision stores 与 provider registry。Provider 状态 GET 只读环境变量，不触网。

- [ ] **步骤 3：实现路由与响应**

POST Review 返回 `201` 与：

```json
{"review": {}, "latestDecision": null}
```

幂等 store 命中可返回 `200`；外部 Provider 失败仍返回已保存 Review 的成功响应。Decision conflict 返回 `409 {"error":"decision_conflict",...}`。

- [ ] **步骤 4：退役旧客户端 v1 POST**

`POST /api/research/runs/{runId}/ai-reviews` 返回 `410` 和 `legacy_ai_review_write_retired`，说明必须使用 experiment-backed `POST /api/ai-reviews`。保留旧 run-scoped GET，并让其返回：

```json
{
  "aiReviews": [],
  "authoritativeAiReviews": [],
  "pagination": {}
}
```

旧字段 `aiReviews` 语义不变，避免既有前端立即崩溃。

- [ ] **步骤 5：运行后端 HTTP 契约**

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewStage3HttpTests -v
npm run test:python
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add services/quant_core/quant_core/api.py services/quant_core/tests/test_ai_review_stage3.py services/quant_core/tests/test_quant_core.py
git commit -m "feat: expose stage3 ai review api"
```

---

### 任务 8：建立 Web v2 类型、client 与选择模型

**文件：**

- 新建：`apps/web/src/lib/ai-review-stage3.ts`
- 新建：`apps/web/src/lib/ai-review-stage3.test.ts`
- 修改：`apps/web/src/lib/terminal-api.ts`
- 修改：`apps/web/src/lib/terminal-api.test.ts`

**接口：**

- `AiReviewProviderStatus`
- `AuthoritativeAiReviewRun`
- `AiReviewDecision`
- `loadAiReviewProviders()`
- `createAuthoritativeAiReview(request)`
- `loadAuthoritativeAiReview(id)`
- `loadAuthoritativeAiReviews(filters)`
- `loadAiReviewDecisions(id)`
- `appendAiReviewDecision(id, request)`
- `buildComparisonEligibility(primary, candidate)`

- [ ] **步骤 1：写 runtime validator 与 eligibility 测试**

覆盖：

- v2 record、assessment、external failed/skipped/completed、Decision 链；
- 未知 enum、hash、boundary、数组或字段类型被拒绝；
- provider status 不含 key；
- 相同 context/lineage 可选；
- 主实验、未完成、context/lineage 不符、已选和超过 4 个给出稳定 reason code；
- v1 record 不被误判为 authoritative。

- [ ] **步骤 2：实现独立 v2 domain module**

不要扩张既有 v1 `AiReviewRunRecord`。用 discriminated schema 明确 `schemaVersion: 2` 与 `authority: "authoritative"`。所有网络 payload 先运行 validator 再进入 App 状态。

- [ ] **步骤 3：实现 HTTP client**

复用现有 `requestJson`、base URL 与 AbortSignal 模式。POST JSON 必须精确，不透传 UI-only 字段。查询参数用 `URLSearchParams`。

- [ ] **步骤 4：运行前端聚焦测试**

```bash
npm run test --workspace @aiqt/web -- src/lib/ai-review-stage3.test.ts src/lib/terminal-api.test.ts
```

预期：全部通过。

- [ ] **步骤 5：提交**

```bash
git add apps/web/src/lib/ai-review-stage3.ts apps/web/src/lib/ai-review-stage3.test.ts apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts
git commit -m "feat: add stage3 ai review web contracts"
```

---

### 任务 9：在现有 AI Review 工作区交付权威面板

**文件：**

- 新建：`apps/web/src/components/AiReviewStage3Section.tsx`
- 修改：`apps/web/src/App.tsx`
- 修改：`apps/web/src/lib/terminal-workbench.ts`
- 修改：`apps/web/src/lib/terminal-workbench.test.ts`
- 修改：`apps/web/src/lib/i18n.ts`
- 修改：`apps/web/src/lib/i18n.test.ts`
- 修改：`apps/web/src/styles.css`
- 修改：`apps/web/src/lib/layout-css.test.js`
- 修改：`apps/web/src/lib/ai-review-stage3.test.ts`

**状态边界：**

App 持有 selected primary/comparisons、provider、approval、current Review、history、Decision form 与 AbortController/request token；`AiReviewStage3Section` 只接收 props/callbacks。

- [ ] **步骤 1：写 view-model、stale guard 与文案测试**

验证：

- 当前 completed experiment 自动成为 primary；
- 最多 4 个合法 comparison；
- 不合法候选展示 context/lineage reason；
- 选 external provider 前展示 model、脱敏 URL 和外发字段清单；
- 未确认时按钮 disabled；
- deterministic/external 两列不合并 stance；
- external failed 仍展示本地结果；
- v1 显示 legacy/non-authoritative；
- Decision 表单引用最新 predecessor；
- 切换 context、primary、workspace 或加载新候选时清除 review selection/result；
- 旧 provider/history/review/decision 异步响应不能覆盖新 context。

- [ ] **步骤 2：实现 presentational component**

组件分为：

1. primary 与 comparison 证据选择；
2. Provider 状态与外发确认；
3. 运行状态和双轨 assessment；
4. evidence/record hashes 与安全边界；
5. Decision 表单与追加链；
6. authoritative/legacy 历史。

按钮和状态使用既有 design tokens；禁止增加独立路由或工作区。

- [ ] **步骤 3：接入 App 状态和 API**

使用 request generation token 加 AbortController 双重抑制 stale response。创建 Decision 后必须重新读取 Review 的 Decision 链，不能在客户端假设 append 成功。

- [ ] **步骤 4：补中英文与响应式样式**

新增中文、英文 key；`i18n.test.ts` 要求两种语言 key 集相同。桌面 assessment 双列；宽度小于既有移动断点时变单列，hash 和长 evidence ID 必须可换行，按钮保持可触达。

- [ ] **步骤 5：运行聚焦 Web 测试与 build**

```bash
npm run test --workspace @aiqt/web -- src/lib/ai-review-stage3.test.ts src/lib/terminal-workbench.test.ts src/lib/i18n.test.ts src/lib/layout-css.test.js
npm run build
```

预期：测试通过，TypeScript 与 Vite build 成功。

- [ ] **步骤 6：提交**

```bash
git add apps/web/src/components/AiReviewStage3Section.tsx apps/web/src/App.tsx apps/web/src/lib/ai-review-stage3.ts apps/web/src/lib/ai-review-stage3.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/i18n.ts apps/web/src/lib/i18n.test.ts apps/web/src/styles.css apps/web/src/lib/layout-css.test.js
git commit -m "feat: add authoritative ai review workspace"
```

---

### 任务 10：把 v2 Review 与 Decision 纳入研究包导出、导入和回滚

**文件：**

- 修改：`services/quant_core/quant_core/api.py`
- 修改：`services/quant_core/tests/test_ai_review_stage3.py`
- 修改：`services/quant_core/tests/test_quant_core.py`

**包字段：**

```json
{
  "aiReviewRuns": [],
  "aiReviewRunsV2": [],
  "aiReviewDecisions": [],
  "artifactCounts": {
    "aiReviewRuns": 0,
    "aiReviewRunsV2": 0,
    "aiReviewDecisions": 0
  }
}
```

- [ ] **步骤 1：写 round-trip 与失败回滚测试**

覆盖：

- v1、v2 Review 与 Decisions 同包导出；
- v2 record/evidence hash、Decision hash/前置链、artifact counts 可验证；
- Review 自带 evidence bundle，因此导入可读回放不要求额外恢复 experiment store；
- 缺失 Review、篡改 hash、断裂/分叉 Decision 链、安全边界放宽、count 不符均拒绝；
- Review 或 Decision store 写入中途失败时恢复导入前所有 v1/v2/Decision 状态；
- undo 恢复导入前状态；
- legacy-only 旧包仍可导入。

- [ ] **步骤 2：扩展 export manifest**

按 source run 收集 v2 Reviews；收集其全部 Decisions。canonical integrity 继续覆盖新增数组和 counts。不要把 Provider secret 或原始响应加入包。

- [ ] **步骤 3：扩展 import preflight**

写入前完成全部 validation，顺序固定：

1. package integrity/counts；
2. v1 records；
3. v2 record/evidence hashes 与 run binding；
4. Decisions 的 review binding 和线性 predecessor 链；
5. paper/live boundary。

- [ ] **步骤 4：扩展事务补偿与 undo snapshot**

在任何 store mutation 前保存 v2 Reviews 和 Decisions 的旧快照；失败或 undo 时按 Review 后 Decision 的依赖关系恢复，不删除用户原有记录。

- [ ] **步骤 5：运行聚焦与全量 Python 测试**

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_ai_review_stage3.AiReviewArchiveTests -v
npm run test:python
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add services/quant_core/quant_core/api.py services/quant_core/tests/test_ai_review_stage3.py services/quant_core/tests/test_quant_core.py
git commit -m "feat: archive stage3 ai review evidence"
```

---

### 任务 11：扩展 Web 复现包浏览、索引与 diff

**文件：**

- 修改：`apps/web/src/lib/terminal-api.ts`
- 修改：`apps/web/src/lib/terminal-api.test.ts`
- 修改：`apps/web/src/lib/terminal-workbench.ts`
- 修改：`apps/web/src/lib/terminal-workbench.test.ts`
- 修改：`apps/web/src/App.tsx`
- 修改：`apps/web/src/lib/i18n.ts`
- 修改：`apps/web/src/lib/i18n.test.ts`

- [ ] **步骤 1：写包 validator 和证据投影测试**

验证：

- 新旧包都能解析；
- `aiReviewRunsV2` 和 `aiReviewDecisions` count mismatch 明确阻断；
- evidence index 可按 Review ID、Decision ID、experiment ID、evidence hash、record hash、provider、status 搜索；
- package preview 显示 v2/Decision readiness；
- import diff 区分新增、覆盖相同 hash、冲突；
- legacy 与 authoritative 不混算；
- paper/live boundary 仍是硬阻断。

- [ ] **步骤 2：扩展 API types/validators**

新增字段为兼容可选，但一旦存在必须完整验证；不得把 invalid v2 降级为 legacy。

- [ ] **步骤 3：扩展 workbench projections**

为 v2 和 Decision 生成稳定 export paths：

```text
aiReviewRunsV2[<index>].record
aiReviewDecisions[<index>].record
```

建立 evidence anchors，但不改变 v1 anchor 语义。

- [ ] **步骤 4：接入 App 的预览、索引和 diff**

复用现有 Audit/包浏览器组件，不新建重复页面。所有新增文案补齐中英文。

- [ ] **步骤 5：运行测试**

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts src/lib/i18n.test.ts
```

预期：全部通过。

- [ ] **步骤 6：提交**

```bash
git add apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/App.tsx apps/web/src/lib/i18n.ts apps/web/src/lib/i18n.test.ts
git commit -m "feat: surface stage3 evidence in archives"
```

---

### 任务 12：接通 Compose Provider 配置且不泄露凭据

**文件：**

- 修改：`compose.yaml`
- 修改：`.env.example`
- 修改：`apps/web/src/lib/deployment.test.js`
- 修改：`services/quant_core/tests/test_quant_core.py`

- [ ] **步骤 1：写部署契约失败测试**

新增 `test_compose_passes_stage3_provider_environment_to_api_only`，断言 API service 显式透传：

```yaml
OPENAI_API_KEY: ${OPENAI_API_KEY:-}
OPENAI_MODEL: ${OPENAI_MODEL:-}
OPENAI_COMPATIBLE_BASE_URL: ${OPENAI_COMPATIBLE_BASE_URL:-}
OPENAI_COMPATIBLE_API_KEY: ${OPENAI_COMPATIBLE_API_KEY:-}
OPENAI_COMPATIBLE_MODEL: ${OPENAI_COMPATIBLE_MODEL:-}
OLLAMA_BASE_URL: ${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
OLLAMA_MODEL: ${OLLAMA_MODEL:-}
```

并断言 web service/build args 不接收任何 API key。

- [ ] **步骤 2：修改 Compose 与 env 示例**

保留用户现有 `.env` 不读取、不打印、不提交。`.env.example` 只含空值和安全示例，说明 compatible Base URL 必须带 provider API prefix、不能带 `/chat/completions`。

- [ ] **步骤 3：验证渲染后的 Compose 不输出 secret**

测试只检查 key 名与非敏感默认值；不要运行会把当前环境值展开到终端的 `docker compose config`。使用测试内受控假环境解析 YAML 文本契约。

- [ ] **步骤 4：运行部署测试**

```bash
npm run test --workspace @aiqt/web -- src/lib/deployment.test.js
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_quant_core.QuantCoreContractTest.test_compose_passes_stage3_provider_environment_to_api_only -v
```

预期：全部通过；`git diff -- .env` 无输出。

- [ ] **步骤 5：提交**

```bash
git add compose.yaml .env.example apps/web/src/lib/deployment.test.js services/quant_core/tests/test_quant_core.py
git commit -m "chore: wire stage3 provider configuration"
```

---

### 任务 13：增加确定性 Stage 3 Docker smoke 与 manifest

**文件：**

- 修改：`tools/docker_smoke.py`
- 修改：`package.json`
- 修改：`services/quant_core/tests/test_quant_core.py`
- 修改：`apps/web/src/lib/deployment.test.js`

**命令：**

```json
{
  "docker:smoke:stage3": "node tools/run_python.mjs tools/docker_smoke.py --stage3-ai-review --stage3-ai-review-report data/stage3-ai-review.json",
  "docker:smoke:stage3:validate": "node tools/run_python.mjs tools/docker_smoke.py --validate-stage3-ai-review-report data/stage3-ai-review.json",
  "docker:smoke:stage3:live": "node tools/run_python.mjs tools/docker_smoke.py --stage3-ai-review-live-provider openai-compatible --stage3-ai-review-live-report data/stage3-ai-review-live.json"
}
```

- [ ] **步骤 1：写 manifest builder/validator 与 CLI 契约测试**

manifest `kind=aiqt.stage3AiReviewAcceptance`，至少包含：

- source run、primary/comparison experiment IDs；
- lineage/evidence/record hashes；
- deterministic stance/consistency；
- external status/provider；
- Decision ID/status/predecessor；
- export/import/readback hashes；
- `paperOnly=true`、live/order route blocked；
- request count。

Validator 拒绝缺字段、hash 格式错、Provider 请求数大于 1、live/order 放开、Decision 链错和 artifact counts 不符。

- [ ] **步骤 2：实现 deterministic smoke**

流程：

1. 复用 Stage 2 helper 创建或定位 completed experiment；
2. 创建 `providerId=local` Review；
3. 读取 Review 并重算关键 hashes；
4. 追加第一条 Decision，再追加改判 Decision；
5. 验证旧 predecessor 再写返回 conflict；
6. 导出研究包，验证 v2/Decision counts；
7. 导入隔离数据库或现有 smoke 目标并读回；
8. 生成 JSON manifest。

- [ ] **步骤 3：实现显式 live smoke 开关**

只有提供 `--stage3-ai-review-live-provider openai-compatible` 才发外网请求；运行前从 Provider status 确认 configured，并要求命令行二次显式 flag `--approve-external-evidence`。缺任一条件立即退出且请求数 0。

Live smoke 只创建一份最小 single Review、只请求一次、不重试、不回退。无论 Provider completed/failed，验证本地 baseline、hash 和 paper/live boundary，再输出脱敏 manifest；manifest 不保存 key、完整 prompt 或原始响应。

- [ ] **步骤 4：运行纯本地脚本测试**

```bash
PYTHONPATH=services/quant_core node tools/run_python.mjs -m unittest tests.test_quant_core.QuantCoreContractTest -k stage3_ai_review -v
npm run test --workspace @aiqt/web -- src/lib/deployment.test.js
```

预期：全部通过，不访问公网。

- [ ] **步骤 5：提交**

```bash
git add tools/docker_smoke.py package.json services/quant_core/tests/test_quant_core.py apps/web/src/lib/deployment.test.js
git commit -m "feat: add stage3 docker acceptance"
```

---

### 任务 14：在阶段切换前完成全链验收

**文件与产物：**

- 只读验证：任务 1–13 修改的全部源码、测试、Compose 与脚本。
- 生成但默认不提交：`data/stage3-ai-review.json`、`data/stage3-ai-review-live.json`。
- 生成预切换桌面证据：`data/desktop-release.json` 与当前 DMG。
- 若门禁失败，返回产生该行为的原任务，先增加回归测试，再修改该任务列出的文件并单独提交修复；本任务不直接扩大范围。

- [ ] **步骤 1：运行静态和全量测试门禁**

```bash
git diff --check
npm run test:python
npm run test --workspace @aiqt/web
npm run build
```

预期：全部 exit 0，无新增 warning/error。若失败，使用 `superpowers:systematic-debugging` 定位，补回归测试后单独提交修复。

- [ ] **步骤 2：保留数据卷重建 Docker**

```bash
docker compose up -d --build
docker compose ps
npm run docker:smoke -- --no-build
```

预期：不执行 `docker compose down -v`；API/Web healthy；已有 volume 数据仍可读取。

- [ ] **步骤 3：重跑 Stage 1 完整验收**

```bash
npm run stage1:prepare
npm run stage1:daily:validate
npm run stage1:preflight:validate
npm run docker:smoke:p1 -- --no-build
npm run docker:smoke:p1:validate
```

预期：Stage 1 full prepare、daily、preflight 与 P1 manifest 全部通过。

- [ ] **步骤 4：重跑 Stage 2 与 Stage 3 确定性验收**

```bash
npm run docker:smoke:stage2 -- --no-build
npm run docker:smoke:stage2:validate
npm run docker:smoke:stage3 -- --no-build
npm run docker:smoke:stage3:validate
```

预期：Stage 2 experiment replay 与 Stage 3 Review/Decision/archive readback hashes 全部有效，live/order route 均 blocked。

- [ ] **步骤 5：执行浏览器验收**

按 `browser:control-in-app-browser` 技能在实际容器 UI 验证：

1. single Review；
2. 1+N comparison 及不合法候选原因；
3. 刷新后 Review/Decision 恢复；
4. Decision 首次写入与改判链；
5. Provider 未配置状态；
6. external failed 时 baseline 仍可用；
7. 375px 窄屏无横向不可达控件；
8. v1 legacy 与 v2 authoritative 标签；
9. 包预览、证据搜索和 import diff。

每项保存截图或现有验收记录所需证据；发现缺陷先补自动化测试再修复。

- [ ] **步骤 6：执行一次显式授权的 OpenAI-compatible live smoke**

不得打印 `.env`、key 或展开后的 Compose 配置。先只调用 `GET /api/ai-review/providers`，确认 compatible 为 configured；然后执行：

```bash
node tools/run_python.mjs tools/docker_smoke.py \
  --stage3-ai-review-live-provider openai-compatible \
  --approve-external-evidence \
  --stage3-ai-review-live-report data/stage3-ai-review-live.json \
  --no-build
```

预期：

- 请求 URL 为 `OPENAI_COMPATIBLE_BASE_URL.rstrip("/") + "/chat/completions"`；
- 只发一次请求，不重试、不回退；
- completed 时结构化输出和 hashes 有效；
- failed 时错误已脱敏、本地 baseline 仍完整；
- 两种结果都保持 paper/live/order blocked。

- [ ] **步骤 7：生成预切换 DMG 与发布 manifest**

```bash
npm run desktop:release
```

预期：Web build、`cargo check`、Tauri build 成功；发现当前 `.dmg`/`.app` 并写入通过 validator 的 `data/desktop-release.json`。这份预切换构建证明 Stage 3 代码可以打包，但不作为最终 current-stage DMG。

- [ ] **步骤 8：记录阶段切换资格**

```bash
git status --short
git log --oneline --decorate -20
```

预期：任务 1–13 的提交完整，所有门禁证据已生成。此时源码中的 Stage 2 仍为 `current`、Stage 3 仍为 `planned`；只有本任务全部通过，才允许执行任务 15。

---

### 任务 15：切换 Stage 2/3、更新中文文档并重建最终 DMG

**文件：**

- 修改：`apps/web/src/lib/terminal-workbench.ts`
- 修改：`apps/web/src/lib/terminal-workbench.test.ts`
- 修改：`docs/product-plan.md`
- 修改：`docs/architecture.md`
- 重新生成：`data/desktop-release.json` 与最终 current-stage DMG。

- [ ] **步骤 1：写阶段状态失败测试**

```ts
test("opens Stage 3 only after the Stage 3 acceptance gate", () => {
  const stages = buildProductDevelopmentStages();
  expect(stages.filter((stage) => stage.status === "current").map((stage) => stage.id)).toEqual([
    "ai-review"
  ]);
  expect(stages.find((stage) => stage.id === "strategy-backtest")?.status).toBe("maintenance");
  expect(stages.find((stage) => stage.id === "ai-review")?.status).toBe("current");
});
```

运行：

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "opens Stage 3"
```

预期：任务 14 已通过，但当前阶段定义尚未切换，因此测试失败。

- [ ] **步骤 2：更新阶段定义**

Stage 0/1/2 为 `maintenance`，Stage 3 为唯一 `current`，Stage 4/5 保持 `planned`。工作区 delivery status 与阶段定义一致。

- [ ] **步骤 3：更新产品计划**

用中文记录：

- Stage 3 能力边界与非目标；
- deterministic baseline、三个 Provider 和 exact selection；
- v2 Review/Decision schemas；
- 导出/导入、Docker、browser、desktop 门禁；
- compatible Base URL 精确拼接规则；
- 真实 Provider 不可用不阻断 Stage 3，但必须留下 failed attempt；
- 任务 14 的当前验收结论和 Stage 2 进入 maintenance 的日期。

- [ ] **步骤 4：更新架构文档**

删除“AI review 仍在当前阶段范围外”的旧表述；把旧 run-scoped v1 POST 标记为退役；列出新 API、stores、外发数据边界、Compose 变量、smoke 命令和 Stage 3 current 边界。

- [ ] **步骤 5：运行阶段、文档与全量回归**

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts src/lib/deployment.test.js
npm run test:python
npm run test --workspace @aiqt/web
npm run build
rg -n "Stage 2.*current|Stage 3.*planned|POST /api/research/runs/.*/ai-reviews.*保存" docs apps/web/src/lib/terminal-workbench.ts
```

预期：测试与 build 全部通过；`rg` 只命中明确说明历史状态或退役契约的段落，不存在当前状态矛盾。

- [ ] **步骤 6：提交阶段切换和文档**

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/architecture.md
git commit -m "docs: open stage3 ai review"
```

- [ ] **步骤 7：重建容器并复核最终 current-stage 状态**

```bash
docker compose up -d --build
docker compose ps
npm run docker:smoke:stage3 -- --no-build
npm run docker:smoke:stage3:validate
```

预期：保留既有 volume，容器 healthy，UI/API 使用 Stage 3 current 源码，Stage 3 manifest 仍通过。

- [ ] **步骤 8：重新生成最终 DMG 与发布 manifest**

```bash
npm run desktop:release
```

预期：Web build、`cargo check`、Tauri build 成功；最终 DMG 包含 Stage 3 current 状态；`data/desktop-release.json` 通过既有 validator。

- [ ] **步骤 9：执行最终安全和工作树审计**

```bash
git status --short
git log --oneline --decorate -20
! git grep -n -I -E '(OPENAI_COMPATIBLE_API_KEY|OPENAI_API_KEY)=[[:alnum:]_-]{20,}|Authorization: Bearer [[:alnum:]_-]{20,}|sk-[[:alnum:]_-]{20,}' -- ':!.env'
! git ls-files --error-unmatch .env
```

预期：两条取反后的安全检查都以 0 退出，证明 secret pattern 无命中且 `.env` 未被跟踪；提交历史按任务拆分。

- [ ] **步骤 10：按仓库规则提交最终桌面发布证据**

如果 `data/desktop-release.json` 已由既有仓库规则跟踪：

```bash
git add data/desktop-release.json
git commit -m "chore: record stage3 desktop acceptance"
```

`data/stage3-ai-review*.json` 只在现有 acceptance artifact 约定要求时加入；否则保持本地生成物。最后运行 `git diff --check` 和 `git status --short`，确认没有未解释的源码变更。

## 最终完成标准

- single 与 comparison v2 Review 全部由后端从已持久化实验组装；
- 本地确定性 baseline 对所有合法证据必定完成；
- OpenAI、OpenAI-compatible、Ollama adapter 的本地合约全部通过；
- 显式选择的 Provider 最多请求一次，无重试、回退或 secret 泄露；
- v2 Review 不可变，Decision 形成可验证的线性追加链；
- v1 legacy 继续可读/导入/导出，但不能满足权威 Stage 3 门禁；
- 研究包 round-trip、回滚、undo、证据索引和 import diff 覆盖 v2/Decision；
- Python、Web、build、Docker preserved-volume、Stage 1、Stage 2、Stage 3、browser、live Provider 和 DMG 门禁有当前证据；
- Stage 2 为 maintenance，Stage 3 是唯一 current；
- 全程保持 paper-only/live-blocked/order-blocked。
