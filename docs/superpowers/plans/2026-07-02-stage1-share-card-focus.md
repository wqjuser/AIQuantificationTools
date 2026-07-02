# Stage 1 Share Card Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the recovered Stage 1/P0 share banner's “View daily card” action move focus to the actual Stage 1/P0 daily-use card.

**Architecture:** Keep the share-link parser and banner behavior in `App.tsx`, add a stable DOM id for `Stage1P0DailyUseClosurePanel`, and use a small DOM helper to scroll and focus the card. The action remains frontend-only and does not run refresh, audit, broker, or order flows.

**Tech Stack:** React, TypeScript, DOM focus APIs, CSS, Vitest source-contract tests.

---

### Task 1: Lock the banner-to-card focus contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add source-contract expectations**

Require:
- `const stage1P0DailyUseClosureElementId = "stage1-p0-daily-use-closure";`
- `function focusStage1P0DailyUseShareCardElement`
- `document.getElementById(stage1P0DailyUseClosureElementId)`
- `element.scrollIntoView({ block: "center", behavior: "smooth" });`
- `element.focus({ preventScroll: true });`
- `focusStage1P0DailyUseShareCardElement();` in the share banner action.
- `id={stage1P0DailyUseClosureElementId}` and `tabIndex={-1}` on the Stage 1/P0 card section.

- [x] **Step 2: Run the target test red**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: FAIL because the focus helper and stable card focus target do not exist yet.

### Task 2: Implement focused navigation

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Add stable card id and DOM focus helper**

Add a constant and helper near the existing Stage 1/P0 share helpers. The helper must no-op outside the browser and must only scroll/focus the existing card element.

- [x] **Step 2: Wire the banner action**

Update “查看日常卡片 / View daily card” to call the helper before updating the status label. Leave “打开分享工作区 / Open shared workspace” as explicit workspace navigation.

- [x] **Step 3: Make the card focusable and visually stable**

Add `id` and `tabIndex={-1}` to the card section. Add a focused CSS rule for `.stage1-p0-daily-use-closure:focus-visible`.

- [x] **Step 4: Run the target test green**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: PASS.

### Task 3: Document, verify, and commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-share-card-focus.md`

- [x] **Step 1: Update docs**

Document that recovered share banners can now focus the Stage 1/P0 card directly, while keeping all operations manual and frontend-only.

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

Commit message: `feat: focus recovered stage1 share card`
