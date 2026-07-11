# Stage 4 Portfolio Paper Golden Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有组合回测、风险检查、纸面委托、审批、批量模拟、状态历史、账户回放和归档能力收口为正式 Stage 4 黄金路径，并生成可离线验证的验收证据。

**Architecture:** 不新增订单模型或数据库。后端使用现有 research runs、组合引擎和订单 stores 重构权威 workflow snapshot，并把 snapshot 作为 `stage4_portfolio_workflow` 写入现有 AuditEventStore；前端只编排现有 API 并从持久化 workflow/账本恢复页面；Docker smoke 走相同 HTTP 合同生成 acceptance manifest。

**Tech Stack:** Python 3.12+ stdlib、SQLite、现有 quant_core HTTP server、React 19、TypeScript、Vitest、Docker Compose、Tauri。

## Global Constraints

- Stage 4 全程固定 `paperOnly=true`、`liveTradingAllowed=false`、`orderSubmissionEnabled=false`、`routeExecuted=false`、`liveBlockedBoundary=true`。
- 不连接真实券商，不读取或返回 broker/provider secret，不增加依赖。
- 至少两个 portfolio legs；所有 source runs 必须已审计且 market/timeframe 一致；权重为正且总和不超过 1。
- 复用 `PortfolioBacktestEngine`、Portfolio paper order/approval/simulation stores、AuditEventStore 和 research export/import。
- 每个任务严格 RED → GREEN → focused tests → full relevant tests → commit → independent review。
- Stage 3 只有在 Task 10 全链门禁通过后才能转为 maintenance；Stage 4 在此之前保持 planned。

---

### Task 1: Canonical Stage 4 Workflow Snapshot

**Files:**
- Create: `services/quant_core/quant_core/stage4_portfolio.py`
- Create: `services/quant_core/tests/test_stage4_portfolio.py`

**Interfaces:**
- Consumes: `PortfolioBacktestRun`, paper batch/approval/simulation payloads, state history and replay payloads.
- Produces: `build_stage4_portfolio_workflow_snapshot(...) -> dict[str, Any]`, `validate_stage4_portfolio_workflow_snapshot(value) -> dict[str, Any]`, `stage4_portfolio_workflow_hash(value) -> str`.

- [ ] **Step 1: Write failing canonical snapshot tests**

Cover exact top-level keys, two-leg requirement, sorted canonical JSON SHA-256, same-market/timeframe binding, positive weights, total weight, batch/base-run binding, approval/simulation order binding, replay totals and five immutable safety fields. Include mutations for each live/order field and an extra-key rejection.

```python
snapshot = build_stage4_portfolio_workflow_snapshot(
    workflow_id="stage4-workflow-1",
    base_run_id="run-a",
    portfolio_request={"name": "Stage 4", "initialCash": 100000, "legs": [...]},
    portfolio=portfolio_payload,
    risk_template={"minCashAfter": 10000, "maxSymbolNotional": 50000, "maxBatchNotional": 90000},
    batch=batch_payload,
    approvals=approval_payloads,
    simulations=simulation_payloads,
    state_history=state_history_payload,
    replay=replay_payload,
)
assert snapshot["paperOnly"] is True
assert snapshot["liveTradingAllowed"] is False
assert snapshot["workflowHash"] == stage4_portfolio_workflow_hash(snapshot)
```

- [ ] **Step 2: Run RED**

Run: `node tools/run_python.mjs -m unittest services.quant_core.tests.test_stage4_portfolio -v`

Expected: FAIL because `quant_core.stage4_portfolio` does not exist.

- [ ] **Step 3: Implement the minimal pure builder and validator**

Use only `dataclasses`, `datetime`, `hashlib`, `json` and existing payload conversion functions. Compute `workflowHash` over the exact snapshot without `workflowHash`; never accept caller-supplied safety values.

- [ ] **Step 4: Run GREEN and Python regression**

Run:

```bash
node tools/run_python.mjs -m unittest services.quant_core.tests.test_stage4_portfolio -v
npm run test:python
```

Expected: focused tests and full Python suite pass.

- [ ] **Step 5: Commit**

```bash
git add services/quant_core/quant_core/stage4_portfolio.py services/quant_core/tests/test_stage4_portfolio.py
git commit -m "feat: define stage4 portfolio workflow evidence"
```

---

### Task 2: Persist and Read Authoritative Workflow via Existing Audit Store

**Files:**
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_stage4_portfolio.py`
- Modify: `services/quant_core/tests/test_quant_core.py`

**Interfaces:**
- Consumes: Task 1 builder, ResearchRunStore, portfolio paper stores and AuditEventStore.
- Produces: `POST /api/portfolio/workflows`, `GET /api/portfolio/workflows?baseRunId=...&limit=...`.

- [ ] **Step 1: Write failing HTTP tests**

POST request shape:

```json
{
  "baseRunId": "run-a",
  "name": "Stage 4 Golden Path",
  "initialCash": 100000,
  "legs": [{"runId": "run-a", "targetWeight": 0.5}, {"runId": "run-b", "targetWeight": 0.4}],
  "riskTemplate": {"minCashAfter": 10000, "maxSymbolNotional": 50000, "maxBatchNotional": 90000},
  "batchId": "portfolio-paper-batch-1",
  "operator": "local-operator"
}
```

Require the server to rerun the portfolio from stored runs, read batch/approvals/simulations/state history/replay from stores, reject incomplete or mismatched evidence, build the Task 1 snapshot, and record one `stage4_portfolio_workflow` audit event whose metadata contains the snapshot. GET returns newest-first validated snapshots and pagination.

Add negative tests for one leg, cross-market/timeframe, missing batch, incomplete approvals, missing fills, replay mismatch, caller live fields and malformed query parameters.

- [ ] **Step 2: Run RED**

Run: `node tools/run_python.mjs -m unittest services.quant_core.tests.test_stage4_portfolio services.quant_core.tests.test_quant_core -k stage4_portfolio_workflow -v`

Expected: 404 or missing handler failures.

- [ ] **Step 3: Add the two handlers with no new store**

POST records through `self.audit_event_store.record(...)`. GET queries `eventType=stage4_portfolio_workflow`, filters exact `runId`, validates every returned metadata snapshot, and fail-closes malformed persisted rows.

- [ ] **Step 4: Verify**

Run focused tests, then `npm run test:python`.

- [ ] **Step 5: Commit**

```bash
git add services/quant_core/quant_core/api.py services/quant_core/tests/test_stage4_portfolio.py services/quant_core/tests/test_quant_core.py
git commit -m "feat: persist stage4 portfolio workflows"
```

---

### Task 3: Typed Web Client Contract

**Files:**
- Create: `apps/web/src/lib/portfolio-stage4.ts`
- Create: `apps/web/src/lib/portfolio-stage4.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`

**Interfaces:**
- Produces: `Stage4PortfolioWorkflow`, exact runtime guard, `recordStage4PortfolioWorkflow(...)`, `loadStage4PortfolioWorkflows(...)`.

- [ ] **Step 1: Write RED tests**

Require exact snapshot validation including nested legs, risk checks, approvals, simulations, state history summary, replay summary, 64-character hashes and immutable safety fields. Test URL encoding, POST request body, pagination, HTTP errors and malformed payload fail-closed behavior.

- [ ] **Step 2: Run RED**

Run: `npm run test --workspace @aiqt/web -- src/lib/portfolio-stage4.test.ts src/lib/terminal-api.test.ts -t "Stage 4 portfolio workflow"`

- [ ] **Step 3: Implement the smallest typed client**

Reuse `buildApiUrl`, `WorkspaceFetcher`, safe error extraction and existing nested Portfolio types. Do not duplicate paper-order types.

- [ ] **Step 4: Verify focused and Web tests**

Run focused tests, then `npm run test --workspace @aiqt/web`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/portfolio-stage4.ts apps/web/src/lib/portfolio-stage4.test.ts apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts
git commit -m "feat: add stage4 portfolio workflow client"
```

---

### Task 4: Stage 4 Golden Path View Model

**Files:**
- Modify: `apps/web/src/lib/portfolio-stage4.ts`
- Modify: `apps/web/src/lib/portfolio-stage4.test.ts`

**Interfaces:**
- Produces: `buildStage4PortfolioGoldenPath(...) -> { status, currentStepId, steps, primaryActionId, blockers }`.

- [ ] **Step 1: Write state-table RED tests**

Cover exactly five ordered steps: `portfolio-build`, `risk-review`, `operator-approval`, `paper-simulation`, `account-replay`. For each transition, require one primary action and stable blockers. Add stale base-run, mixed batch, rejected approval, blocked route-risk, duplicate fill and complete restored workflow cases.

- [ ] **Step 2: Run RED**

Run: `npm run test --workspace @aiqt/web -- src/lib/portfolio-stage4.test.ts -t "golden path"`

- [ ] **Step 3: Implement a pure derived-state function**

Use existing batches, lifecycle, approval rows, route rows, state history, replay and authoritative workflow. Do not add React state or another lifecycle enum.

- [ ] **Step 4: Verify and commit**

```bash
npm run test --workspace @aiqt/web -- src/lib/portfolio-stage4.test.ts
git add apps/web/src/lib/portfolio-stage4.ts apps/web/src/lib/portfolio-stage4.test.ts
git commit -m "feat: model stage4 portfolio golden path"
```

---

### Task 5: Portfolio Golden Path UI and Restore

**Files:**
- Create: `apps/web/src/components/PortfolioStage4Section.tsx`
- Create: `apps/web/src/components/PortfolioStage4Section.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/lib/i18n.ts`
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Consumes: Task 3 client and Task 4 model; existing portfolio action callbacks.
- Produces: one Portfolio-only Stage 4 entry panel and refresh restoration.

- [ ] **Step 1: Write RED component and source-contract tests**

Require the five steps, one enabled primary action, blocker text, current workflow ID/hash, paper-only boundary, expandable evidence, and no broker/live action. Require Portfolio to render the section before detailed portfolio panels; Execution must not render a second copy.

- [ ] **Step 2: Run RED**

Run: `npm run test --workspace @aiqt/web -- src/components/PortfolioStage4Section.test.tsx src/lib/layout-css.test.js`

- [ ] **Step 3: Implement and wire existing actions**

Map actions to existing callbacks: run portfolio backtest, record batch, approval navigation, batch simulation and record workflow. On base run change or refresh, load batches, approvals, simulations, histories, replay and authoritative workflows with the existing request-staleness pattern.

- [ ] **Step 4: Add minimal responsive CSS and Chinese-first copy**

At 375px the five steps stack; no horizontal overflow; buttons retain accessible names and disabled reasons.

- [ ] **Step 5: Verify and commit**

Run focused tests, full Web suite and `npm run build`, then commit:

```bash
git add apps/web/src/components/PortfolioStage4Section.tsx apps/web/src/components/PortfolioStage4Section.test.tsx apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/i18n.ts apps/web/src/styles.css
git commit -m "feat: add stage4 portfolio golden path"
```

---

### Task 6: Archive and Audit Readback

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

**Interfaces:**
- Consumes: `stage4_portfolio_workflow` audit events already exported through the run-bound audit ledger.
- Produces: strict export manifest count/readback, package browser row and import diff for Stage 4 workflow evidence.

- [ ] **Step 1: Write RED export/import tests**

Require a run export to preserve the authoritative workflow event, exact workflow hash, batch/approval/simulation/replay bindings and safety fields. Import must restore it through the existing audit-event path and re-export the same hash. Malformed workflow metadata or count/hash mismatch must reject the package atomically.

- [ ] **Step 2: Run RED**

Run focused Python export/import and Web package tests.

- [ ] **Step 3: Extend existing audit-event artifact accounting only**

Add a dedicated manifest count and browser/diff row derived from `auditEvents[]`; do not add a second workflow payload or a new import store.

- [ ] **Step 4: Verify and commit**

Run focused suites, full Python/Web and build, then commit:

```bash
git add services/quant_core/quant_core/runs.py services/quant_core/tests/test_quant_core.py apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: archive stage4 portfolio workflows"
```

---

### Task 7: Stage 4 Acceptance Manifest and Offline Validator

**Files:**
- Modify: `tools/docker_smoke.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `package.json`
- Modify: `apps/web/src/lib/deployment.test.js`

**Interfaces:**
- Produces: `build_stage4_portfolio_acceptance_manifest`, `validate_stage4_portfolio_acceptance_manifest`, `run_stage4_portfolio_acceptance`, `data/stage4-portfolio-paper.json`.

- [ ] **Step 1: Write RED builder/validator tests**

Manifest kind is `aiqt.stage4PortfolioPaperAcceptance`, schema 1. Require two legs, portfolio/workflow hash, risk checks, batch, exact approval sequence, exact filled simulations, idempotent retry evidence, state history, replay account/positions, export/readback checks and all five safety fields. Mutate every field family and assert validator rejection.

- [ ] **Step 2: Run RED**

Run: `node tools/run_python.mjs -m unittest services.quant_core.tests.test_quant_core -k stage4_portfolio_acceptance -v`

- [ ] **Step 3: Implement the HTTP smoke using existing endpoints**

Create or reuse two compatible audited runs, POST portfolio backtest, record batch, approve routable orders, batch simulate, retry once to prove idempotency, read state/replay, record authoritative workflow, export/import/re-export, then write the manifest.

- [ ] **Step 4: Add CLI and npm scripts**

```json
"docker:smoke:stage4": "node tools/run_python.mjs tools/docker_smoke.py --stage4-portfolio-paper --stage4-portfolio-paper-report data/stage4-portfolio-paper.json",
"docker:smoke:stage4:validate": "node tools/run_python.mjs tools/docker_smoke.py --validate-stage4-portfolio-paper-report data/stage4-portfolio-paper.json"
```

- [ ] **Step 5: Verify and commit**

Run focused tests, Python suite, deployment tests and `--help`, then commit:

```bash
git add tools/docker_smoke.py services/quant_core/tests/test_quant_core.py package.json apps/web/src/lib/deployment.test.js
git commit -m "feat: add stage4 portfolio acceptance"
```

---

### Task 8: Docker, Browser and Failure Acceptance

**Files:**
- Create: `.superpowers/sdd/task-stage4-acceptance-report.md` (ignored local evidence ledger)
- Modify only if runtime acceptance exposes a real defect; every defect requires RED first.

- [ ] **Step 1: Run full pre-container gates**

```bash
npm test
npm run build
git diff --check
```

- [ ] **Step 2: Preserve volumes and rebuild**

```bash
docker compose up -d --build
docker compose ps
npm run docker:smoke -- --no-build
npm run stage1:prepare
npm run stage1:daily:validate
npm run stage1:preflight:validate
npm run docker:smoke:p1 -- --no-build
npm run docker:smoke:p1:validate
npm run docker:smoke:stage2 -- --no-build
npm run docker:smoke:stage2:validate
npm run docker:smoke:stage3 -- --no-build
npm run docker:smoke:stage3:validate
npm run docker:smoke:stage4 -- --no-build
npm run docker:smoke:stage4:validate
```

Never run `docker compose down -v`.

- [ ] **Step 3: Real browser acceptance**

Verify Portfolio golden path from two runs, one primary action per step, approval rejection evidence, successful approval/simulation/replay, refresh restore, Audit package/hash readback, 375px no-overflow and no live/broker action.

- [ ] **Step 4: Record evidence**

Record exact commands, exit codes, run/workflow/batch IDs, screenshots, blockers and fixes in the ignored report.

- [ ] **Step 5: Commit only actual defect fixes**

Use one root-cause commit per accepted fix; do not commit screenshots or local acceptance reports.

---

### Task 9: Chinese Documentation and Release Gates

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`
- Modify: `.env.example` only if a documented existing variable is missing.

- [ ] **Step 1: Document current delivered behavior in Chinese**

Record the Stage 4 golden path, workflow audit event, API, manifest, Docker commands, archive readback, deterministic failures and unchanged paper/live boundary. Do not claim Stage 4 current yet.

- [ ] **Step 2: Run documentation consistency checks**

```bash
rg -n "stage4|Stage 4|组合.*黄金路径|stage4_portfolio_workflow|docker:smoke:stage4" README.md docs package.json
rg -n "真实下单已开放|liveTradingAllowed=true|orderSubmissionEnabled=true|routeExecuted=true" README.md docs
```

The second command must return no current-state claims.

- [ ] **Step 3: Verify and commit**

```bash
npm test
npm run build
git diff --check
git add README.md docs/product-plan.md docs/architecture.md .env.example
git commit -m "docs: record stage4 portfolio acceptance"
```

---

### Task 10: Final Release and Stage Switch

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`
- Regenerate: `data/desktop-release.json` and current-version DMG according to existing tracking rules.

- [ ] **Step 1: Write stage-switch RED tests**

Require Stage 0/1/2/3 maintenance, Stage 4 unique current, Stage 5 planned; Portfolio/Execution current and AI Review maintenance.

- [ ] **Step 2: Run RED, switch definitions, run GREEN**

Run focused workbench tests before and after the minimal definition change.

- [ ] **Step 3: Re-run every release gate**

```bash
npm test
npm run build
docker compose up -d --build
npm run docker:smoke:stage3 -- --no-build
npm run docker:smoke:stage3:validate
npm run docker:smoke:stage4 -- --no-build
npm run docker:smoke:stage4:validate
npm run desktop:release
```

- [ ] **Step 4: Security and artifact audit**

Confirm the DMG exists and hash it with `shasum -a 256`. Confirm `.env` is not tracked, tracked source contains no real credentials, the manifest reports paper-only/live-blocked, and `git diff --check` passes.

- [ ] **Step 5: Update Chinese stage status and commit**

Record the Stage 4 acceptance date and evidence, then commit only tracked stage/docs/release files:

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/architecture.md
git add data/desktop-release.json 2>/dev/null || true
git commit -m "docs: open stage4 portfolio paper"
```

- [ ] **Step 6: Final independent review**

Review the full Stage 4 commit range against this plan. Fix all Critical and Important findings, rerun affected focused tests plus the full release gates, then hand off branch integration options.
