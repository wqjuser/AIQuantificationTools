# Stage 0 P0 Backlog Action Hints Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make disabled P0 backlog actions understandable by showing the same preflight or gate reason beside each compact action row.

**Architecture:** Keep the existing Golden Path runbook and `isGoldenPathActionDisabledById` callback as the control source. Add a small UI helper that turns the current runtime state and action id into compact row copy. `run-pipeline` continues to reuse `goldenPathActionPreflightHint`; paper-order and cache actions show local gate reasons when disabled.

**Non-Goals:** Do not change backend Golden Path status, do not create a persistent task queue, do not relax any action gate, and do not unlock real trading.

---

### Task 1: Layout Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add RED coverage proving P0 backlog rows render a compact action hint.
- [x] Assert hints are derived through `p0PlatformBacklogActionHint`.
- [x] Assert compact hint CSS exists and spans the row content.

### Task 2: UI Helper And Rendering

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Add `p0PlatformBacklogActionHint`.
- [x] Render the hint only when there is actionable context.
- [x] Reuse Research preflight text for `run-pipeline` and local disabled reasons for cache/paper actions.
- [x] Keep the hint compact and visually secondary.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with P0 backlog action hint behavior.
- [x] Run focused layout tests, focused P0 tests, build, Docker/browser smoke, full tests when practical, and `git diff --check`.

**Progress:**
- 2026-06-12: Planned a Stage 0 usability slice so P0 backlog action controls explain why they are disabled or require review.
- 2026-06-12: Verified RED layout failure for missing row hints, then added compact P0 backlog action hints and passed the focused layout test.
- 2026-06-12: Verified focused P0 tests, production build, Docker smoke on port 5173, browser smoke on fixed `ashare/600000/1d` context with no console errors, full `npm test`, and `git diff --check`.
