# Adapter Human Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final human confirmation audit gate after controlled adapter orchestration execution, without enabling broker connections or live trading.

**Architecture:** Reuse the existing execution adapter evidence-ledger pattern: a POST endpoint records a typed, redacted audit event from an upstream evidence id, a GET endpoint rehydrates recent records, the web typed client validates payloads, and the workbench compresses records into promotion/settings rows. Promotion readiness can consume this evidence as the human-confirmation stage signal while keeping `liveTradingAllowed=false`.

**Tech Stack:** Python stdlib HTTP API and audit event store, React/TypeScript frontend, Vitest source-contract tests, Python unittest integration tests.

---

### Task 1: Backend Contract

**Files:**
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing Python API test**

Add a test that builds the existing secret reference -> materialization -> environment binding -> reload plan -> reload execution -> reload acceptance -> orchestration dry-run -> orchestration execution chain, then posts to `/api/execution/adapter-human-confirmations`.

Expected assertions:
- Missing orchestration execution id returns `404` with `execution_adapter_orchestration_execution_not_found`.
- Missing confirmations returns `409` with blocked reasons for review, risk, paper, kill switch, and operator boundary.
- Full confirmations returns `201`, status `confirmation_recorded`, event type `execution_adapter_human_confirmation`, `paperOnly=true`, `liveTradingAllowed=false`, and no secret-like metadata leaks.
- `GET /api/execution/adapter-human-confirmations?adapterId=ccxt-live&limit=5` returns recent blocked and recorded confirmations.

- [x] **Step 2: Implement execution model**

Add `ExecutionAdapterHumanConfirmationResult`, builder, payload serializer, audit-event rehydrator, audit-event serializer, and confirmation specs.

Required confirmation payload keys:
- `orchestrationExecutionReviewed`
- `riskApprovalStillValid`
- `paperExecutionReviewed`
- `killSwitchReady`
- `operatorConfirmedFinalBoundary`

Status values:
- `blocked`
- `confirmation_recorded`

- [x] **Step 3: Implement API routes**

Add POST/GET routes at `/api/execution/adapter-human-confirmations`, importing the new builder and serializers.

### Task 2: Frontend Typed API And Row Model

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write failing API tests**

Assert URL builders, POST payload shape, response validation, history loading, invalid payload fallback, and `eventType=execution_adapter_human_confirmation`.

- [x] **Step 2: Write failing workbench tests**

Assert `buildExecutionAdapterHumanConfirmationRows` returns compact rows with status labels, confirmation summary, blocker summary, boundary, audit id, and tone.

- [x] **Step 3: Implement typed client and row builder**

Follow the existing orchestration execution naming and guard helpers.

### Task 3: Product UI Integration

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write failing layout source tests**

Assert Settings loads recent human confirmations, records from orchestration execution rows, renders five confirmation controls, and Promotion Queue displays recent human confirmation evidence with an empty state.

- [x] **Step 2: Implement Settings and Promotion Queue UI**

Add state, refresh wiring, record callback, Settings panel section, Promotion Queue evidence rows, and concise CSS.

### Task 4: Docs, Verification, And Shipping

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-13-stage0-adapter-human-confirmation.md`

- [x] **Step 1: Update product plan**

Document the final human confirmation ledger, endpoints, UI integration, and safety boundary.

- [x] **Step 2: Verify**

Verification completed:
- `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k test_execution_adapter_human_confirmation_records_final_gate_without_enabling_live`
- `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "human confirmation"`
- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "human confirmation"`
- `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "human confirmation"`
- `npm --prefix apps/web test -- --run src/lib/layout-css.test.js`
- `npm --prefix apps/web run build`
- `npm test`
- `npm run docker:smoke`
- `git diff --check`
- Browser smoke on `http://127.0.0.1:5173/?workspace=execution` and `?workspace=settings`: final human confirmation evidence/control sections render, no `NaN`/`undefined`, and no console errors.

Run focused Python/Web tests, `npm --prefix apps/web run build`, `npm test`, `npm run docker:smoke`, browser checks, and `git diff --check`.

- [x] **Step 3: Ship**

Commit implementation, push through `http://127.0.0.1:7890`, mark this plan shipped, commit the plan closure, and push again.

Implementation shipped:
- Commit `4c1d112` (`feat: add adapter human confirmation gate`)
- Pushed `codex/p0-product-workspaces` to `origin` through `http://127.0.0.1:7890`
