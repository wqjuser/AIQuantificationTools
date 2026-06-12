# Stage 0 P0 Action Outcome Summary Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make P0 Golden Path actions feel traceable by showing the latest actionable evidence directly in the current-task card after an audited run or paper execution is available.

**Architecture:** Keep `/api/golden-path/status`, local workspace status, and paper execution state as the only sources. Add a pure frontend `buildP0PlatformActionOutcome` model that prefers the latest paper execution evidence, falls back to the latest audited run id, and otherwise reports a waiting state. Render the result as a compact row inside the existing P0 readiness card with a workspace jump button.

**Non-Goals:** Do not add backend state, do not change Golden Path runbook semantics, do not create a task queue, do not submit orders automatically, and do not unlock live trading.

---

### Task 1: Outcome Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Add RED coverage for latest paper execution evidence.
- [x] Add RED coverage for latest audited run evidence and waiting state.
- [x] Implement `P0PlatformActionOutcome` and `buildP0PlatformActionOutcome`.
- [x] Verify the focused model tests pass.

### Task 2: Current Task UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/styles.css`

- [x] Add RED layout coverage for App wiring, compact outcome rendering, and CSS.
- [x] Compute the outcome from `goldenPath`, `paperExecutionRecord`, and `statusLabel`.
- [x] Render a compact latest-evidence row in the P0 readiness card.
- [x] Add compact CSS and a workspace jump button.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the P0 action outcome summary behavior.
- [x] Run focused P0 tests, production build, Docker/browser smoke, full tests when practical, and `git diff --check`.

**Progress:**
- 2026-06-12: Verified RED model failure for missing `buildP0PlatformActionOutcome`, implemented the pure model, and passed focused model tests.
- 2026-06-12: Verified RED layout failure for missing current-task outcome wiring, then added the compact P0 latest-evidence row and passed the focused layout test.
- 2026-06-12: Verified focused P0/Golden Path tests, full `npm test`, production build, Docker smoke, browser smoke on the Research workspace, and `git diff --check`.
