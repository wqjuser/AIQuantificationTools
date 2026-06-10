# Stage 1 Audit Runbook Preflight Hints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Research preflight review/blocker hints inside the Audit workspace Golden Path runbook when a row action is `run-pipeline`.

**Architecture:** Keep `ResearchPipelinePreflight` as the single source for run-pipeline readiness. Pass the existing preflight model into `GoldenPathRunbookPanel`, derive a row-level hint with `goldenPathActionPreflightHint`, and render it only when the row action is `run-pipeline` and the preflight is not ready.

**Tech Stack:** React/TypeScript, Vitest source-contract tests, CSS.

---

### Task 1: Lock The Audit Runbook UI Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write the failing test**

Assert that the Audit workspace passes `researchPipelinePreflight` into `GoldenPathRunbookPanel`, and that the panel renders `.audit-runbook-preflight-hint`.

- [x] **Step 2: Run the focused test**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "full golden path runbook board"
```

Expected: fail because the panel has no `preflight` prop or hint row yet.

### Task 2: Render The Hint

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Wire props**

Pass `researchPipelinePreflight` to `GoldenPathRunbookPanel`, add a `preflight` prop, and derive `const actionHint = goldenPathActionPreflightHint(i18n, item.actionId, preflight)` per row.

- [x] **Step 2: Render compact text**

Render `<small className={\`audit-runbook-preflight-hint ${preflight.status}\`}>{actionHint}</small>` after the existing row detail when `actionHint` is non-null.

- [x] **Step 3: Style without large layout shifts**

Give `.audit-runbook-preflight-hint` the same grid span as row detail, muted warning/risk colors, and overflow handling.

### Task 3: Document And Verify

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-10-stage1-audit-runbook-preflight-hints.md`

- [x] **Step 1: Update product plan**

Record that Audit runbook `run-pipeline` rows now surface the same Research preflight hints as the current task card.

- [x] **Step 2: Verify**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "golden path"
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

Expected: all pass.

**Progress:**
- 2026-06-10: Planned the Audit runbook preflight hint extension after current task/workspace Golden Path hints shipped.
- 2026-06-10: Confirmed RED failure on missing `preflight` prop, then wired Audit runbook rows to render compact run-pipeline preflight hints.
- 2026-06-10: Verified focused Golden Path UI contracts, research pipeline contracts, web build, full test suite, Docker rebuild, Docker smoke, and Audit browser smoke on `http://127.0.0.1:5173`.
