# Stage 1 Share Target Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the recovered Stage 1/P0 share banner focus the exact shared card target instead of stopping at the parent daily-use card.

**Architecture:** Keep the card-level focus helper as a fallback, add stable element ids for daily rows, the primary action, refresh receipt entries, the refresh next-step action, and the cold-start refresh action. A new target resolver maps the existing share deep-link state to an element id and focuses that element, falling back to the Stage 1/P0 card if the target is not currently rendered.

**Tech Stack:** React, TypeScript, DOM focus APIs, CSS, Vitest source-contract tests.

---

### Task 1: Lock the exact target focus contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add source-contract expectations**

Require:
- `function stage1P0DailyUseShareTargetElementId`
- `function focusStage1P0DailyUseShareTargetElement`
- `stage1P0DailyUseShareTargetElementId(initialStage1P0DailyUseShareDeepLinkState, stage1P0DailyUseRefreshOutcome)`
- `document.getElementById(targetElementId) ?? document.getElementById(stage1P0DailyUseClosureElementId)`
- `focusStage1P0DailyUseShareTargetElement(initialStage1P0DailyUseShareDeepLinkState, stage1P0DailyUseRefreshOutcome);`

- [x] **Step 2: Require stable ids on focusable targets**

Require:
- `id={stage1P0DailyUseRowElementId(row.id)}`
- `id={stage1P0DailyUsePrimaryActionElementId}`
- `id={stage1P0DailyUseRefreshEntryElementId(entry.id)}`
- `id={stage1P0DailyUseRefreshNextActionElementId}`
- `id={stage1P0DailyUseRefreshActionElementId}`

- [x] **Step 3: Run the target test red**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: FAIL because the exact target helper and stable target ids do not exist yet.

### Task 2: Implement exact target focus

**Files:**
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Add target id helpers**

Add constants and id builders near the existing Stage 1/P0 share helper functions.

- [x] **Step 2: Add target resolver and focus helper**

Map daily-use row focus to row ids, daily-use `primary` to the primary action id, refresh receipt entries to entry ids, refresh receipt `next` to the next-step action id, and refresh-receipt cold start to the manual refresh button id.

- [x] **Step 3: Wire target ids into JSX**

Apply ids to the existing button elements without changing labels, actions, or status behavior.

- [x] **Step 4: Run the target test green**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: PASS.

### Task 3: Document, verify, and commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-share-target-focus.md`

- [x] **Step 1: Update docs**

Document that “View daily card” now focuses the exact shared row/action when available, with card fallback.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

Expected: all commands exit 0. Existing Vite chunk-size warning may remain.

- [x] **Step 3: Commit**

Commit message: `feat: focus recovered stage1 share target`
