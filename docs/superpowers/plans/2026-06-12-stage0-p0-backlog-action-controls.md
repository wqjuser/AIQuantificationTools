# Stage 0 P0 Backlog Action Controls Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the P0 readiness backlog operational, not only navigational, by giving each open Golden Path gap a compact workspace shortcut and a gated action control.

**Architecture:** Keep `/api/golden-path/status` and the existing `runGoldenPathActionById` router as the only behavior sources. Change the current-task backlog rows from whole-row buttons into compact articles with separate workspace/action buttons so actions can reuse the same disabled checks and preflight hints as the primary Golden Path button and Audit runbook.

**Non-Goals:** Do not add a new backend queue, do not change Golden Path semantics, do not bypass preflight checks, and do not execute real trading.

---

### Task 1: Layout Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add RED coverage proving P0 backlog rows render separate workspace and action controls.
- [x] Assert the action control uses `runGoldenPathActionById`, `item.actionId`, `item.targetWorkspaceId`, and `isGoldenPathActionDisabledById`.
- [x] Assert compact CSS exists for the new action/open controls.

### Task 2: UI Wiring

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Replace the whole-row backlog button with an article row.
- [x] Add a workspace shortcut button and a gated action button.
- [x] Keep labels compact and localized through the existing Golden Path label helpers.
- [x] Preserve keyboard focus states and no nested-button markup.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the operational P0 backlog behavior.
- [x] Run focused layout test, focused P0 tests, full tests/build as appropriate, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-12: Planned a Stage 0 slice to turn P0 backlog rows into gated action controls without changing backend Golden Path semantics.
- 2026-06-12: Verified RED layout failure for missing separated backlog controls, then replaced whole-row buttons with workspace/action controls and passed the focused P0 backlog layout tests.
- 2026-06-12: Verified focused P0 tests, production web build, Docker smoke on port 5173, in-app browser smoke for row/open/action controls with no console errors, full `npm test`, and `git diff --check`.
