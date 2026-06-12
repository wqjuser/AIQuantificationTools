# Stage 0 P0 Action Outcome Targeting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the P0 current-task "latest outcome" evidence button open the actual audited run or execution evidence instead of only switching workspaces.

**Architecture:** Keep `buildP0PlatformActionOutcome` as the source of the visible outcome row. Add an App-level evidence targeting handler that replays audited run evidence from in-memory history or `/api/research/runs/{runId}`, focuses audit evidence query fields, and routes paper execution evidence to the Execution workspace without relaxing any paper-only/live-blocked gates.

**Tech Stack:** React, TypeScript, Vitest source-level layout tests, existing Quant Core research run API.

---

### Task 1: Evidence Targeting Test

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add RED coverage that the P0 outcome button calls `openP0ActionOutcomeEvidence(p0PlatformActionOutcome)`.
- [x] Add RED coverage that audited run outcomes set audit evidence queries, replay a run from `runHistory`, fall back to `loadResearchRunDetail`, and route paper execution outcomes to Execution.
- [x] Verify the focused layout test fails because the handler does not exist and the button still calls `selectProductWorkArea`.

### Task 2: Evidence Targeting Handler

**Files:**
- Modify: `apps/web/src/App.tsx`

- [x] Implement `openP0ActionOutcomeEvidence`.
- [x] Preserve the no-evidence fallback to `selectProductWorkArea`.
- [x] Route `paper_execution` outcomes to `execution` and `paper`.
- [x] Route `audit_run` and `live_ready` outcomes through run replay, audit query focus, and an explicit audit fallback error state.
- [x] Wire the current-task outcome button to the new handler.
- [x] Verify the focused layout test passes.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-12-stage0-p0-action-outcome-targeting.md`

- [x] Update the product plan with evidence targeting behavior.
- [x] Run focused P0 layout tests.
- [x] Run focused P0/Golden Path tests.
- [x] Run production build and full test suite.
- [x] Run Docker smoke and browser smoke when the service is available.
- [x] Run `git diff --check`.

**Progress:**
- 2026-06-12: Verified RED layout failure for the missing evidence targeting handler.
- 2026-06-12: Implemented the App-level evidence targeting handler and wired the current-task evidence button; focused P0 action outcome layout test passed.
- 2026-06-12: Fixed TypeScript narrowing by freezing `evidenceId` before the async replay path, then verified focused P0/Golden Path tests, production build, full `npm test`, Docker smoke on port 5173, browser smoke on a clean Research workspace, and `git diff --check`.
