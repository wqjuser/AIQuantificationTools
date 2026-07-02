# Stage 1 Refresh Receipt Cold Start Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make recovered Stage 1/P0 refresh-receipt share links useful even when a new browser session has no in-memory refresh receipt yet.

**Architecture:** Keep URL parsing in the existing app entry state and keep rendering inside `Stage1P0DailyUseClosurePanel`. When `shareDeepLinkState.kind === "refresh-receipt"` and `refreshOutcome` is absent, render a compact recovery notice inside the Stage 1/P0 card and highlight the existing manual “刷新自检 / Refresh daily” button as the next step to regenerate the receipt.

**Tech Stack:** React, TypeScript, CSS, Vitest source-contract tests.

---

### Task 1: Lock the cold-start contract with a failing test

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Require a cold-start helper and recovery UI**

Add expectations for `stage1P0DailyUseRefreshReceiptIsColdStart`, `isRefreshReceiptColdStart`, `stage1-p0-daily-use-refresh-recovery`, and the bilingual recovery copy.

- [x] **Step 2: Require refresh-button focus styling**

Add expectations that the existing refresh button appends `shared-focus` during refresh-receipt cold start, plus CSS blocks for `.stage1-p0-daily-use-refresh-recovery` and `.stage1-p0-daily-use-refresh.shared-focus`.

- [x] **Step 3: Run the target test red**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: FAIL because the helper, recovery UI, and CSS do not exist yet.

### Task 2: Implement the cold-start recovery UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Add the helper**

Add a pure helper that returns true only for refresh-receipt share state with no current refresh outcome.

- [x] **Step 2: Render the recovery notice**

Render a compact notice between the daily-use rows and the optional refresh outcome, with copy that explains the link was recovered but the local receipt must be regenerated manually.

- [x] **Step 3: Highlight the manual refresh button**

Reuse the existing refresh action, append `shared-focus`, and set `aria-current` when the cold-start helper is true.

- [x] **Step 4: Run the target test green**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: PASS.

### Task 3: Document and verify the phase

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-refresh-receipt-cold-start.md`

- [x] **Step 1: Update user-facing documentation**

Document that refresh-receipt links opened in a new session now show an in-card recovery prompt and highlight manual refresh as the safe next step.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

Expected: all commands exit 0. Vite may continue to report the existing chunk-size warning.

- [x] **Step 3: Commit**

Commit message: `feat: recover cold stage1 refresh receipt links`
