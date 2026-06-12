# Stage 0 P0 Readiness Summary Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Golden Path status into a compact P0 product-readiness summary so users can see whether the platform is blocked, under review, paper-ready, or live-ready without reading every workspace panel.

**Architecture:** Reuse `/api/golden-path/status` as the only source of truth. Add a pure frontend `buildP0PlatformReadinessSummary` model that derives progress, current gap, next action target, and live boundary from Golden Path runbook evidence. Render the result inside the existing current-task card as a small product gap summary, not a new page.

**Non-Goals:** Do not add backend state, do not change Golden Path semantics, do not unlock live trading, and do not add another large dashboard.

---

### Task 1: Readiness Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Add RED coverage for a blocked/review Golden Path that reports progress, current gap, next action, and paper-only boundary.
- [x] Add coverage for all P0 steps passed while live trading remains blocked, reporting `paper_ready`.
- [x] Add coverage for missing Golden Path evidence, reporting `unknown`.
- [x] Implement `P0PlatformReadinessSummary` and `buildP0PlatformReadinessSummary`.

### Task 2: Current Task UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/styles.css`

- [x] Add RED layout coverage for App wiring, localized display helpers, and compact CSS.
- [x] Compute P0 readiness from the existing `goldenPath` state.
- [x] Render the P0 readiness strip in the current task card.
- [x] Add compact CSS for progress meter and live boundary copy.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with P0 readiness summary behavior.
- [x] Run focused tests, full tests, build, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-12: Verified RED model failure for missing `buildP0PlatformReadinessSummary`, implemented the pure summary model, and verified focused P0 tests passed.
- 2026-06-12: Verified RED layout failure for missing App/UI wiring, then added the current-task P0 readiness strip and focused layout test passed.
- 2026-06-12: Verified focused workbench/layout suites, full `npm test`, production build, Docker smoke, browser smoke on `/?workspace=research`, and whitespace diff check.
