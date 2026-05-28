# Paper Execution Audit Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind paper execution attempts to audited research run ids so simulated orders, risk checks, and account snapshots become replayable evidence instead of transient UI projections.

**Architecture:** The Python core owns paper execution persistence. A paper execution record references one `ResearchRunAudit`, derives a paper BUY order from the audited data snapshot and assumptions, runs the existing `PaperExecutionAdapter`, stores the order result plus gate decisions in SQLite, and exposes run-scoped POST/GET endpoints. The web client adds typed helpers and a small execution-panel action that submits the currently loaded audited run.

**Tech Stack:** Python standard library HTTP server, SQLite, Python `unittest`, React/TypeScript, Vitest.

---

### Task 1: Backend Paper Execution Contract

**Files:**
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add a failing store test proving paper execution records persist with `runId`, orders, gates, and account snapshot.
- [x] Add a failing API test for `POST /api/research/runs/{runId}/paper-executions`.
- [x] Add a failing API test for missing run ids returning `404`.
- [x] Implement `PaperExecutionStore`, payload serialization, and run-derived paper order sizing.
- [x] Expose run-scoped POST and GET endpoints.

### Task 2: Frontend Paper Execution Client

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/i18n.ts`

- [x] Add typed paper execution result contracts and API helpers.
- [x] Add tests for URL encoding, successful submit, and invalid payload fallback.
- [x] Add a paper execution action to the execution panel when the workspace has an audited run id.
- [x] Render the persisted paper order rows after submit while keeping fallback projected rows before submit.

### Task 3: Verification

**Files:**
- Check: all changed files

- [x] Run focused backend paper execution tests.
- [x] Run focused frontend API tests.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Verify the local API can submit a paper execution for a generated run.
- [x] Verify the in-app browser still loads without console errors.
- [x] Commit and push the completed slice.
