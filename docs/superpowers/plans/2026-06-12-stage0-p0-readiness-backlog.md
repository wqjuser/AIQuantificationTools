# Stage 0 P0 Readiness Backlog Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the P0 readiness summary into a short, actionable backlog so the user can see the next few platform gaps and jump to the right workspace.

**Architecture:** Keep `/api/golden-path/status` as the only source of truth. Add a pure `buildP0PlatformBacklogItems` model that filters incomplete runbook rows, ranks current gaps before blocked/review items, and preserves action/workspace targets. Render the items inside the current task card below the P0 readiness meter.

**Non-Goals:** Do not create a new backend task queue, do not persist backlog rows, do not change Golden Path runbook semantics, and do not add another large dashboard.

---

### Task 1: Backlog Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Add RED coverage for prioritized current, blocked, and review runbook gaps.
- [x] Add coverage proving a completed Golden Path returns no backlog rows.
- [x] Implement `P0PlatformBacklogItem` and `buildP0PlatformBacklogItems`.

### Task 2: Current Task UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/styles.css`

- [x] Add RED layout coverage for backlog computation, rendering hooks, workspace shortcut behavior, and CSS.
- [x] Render up to three backlog items inside the P0 readiness card.
- [x] Make each item a compact workspace shortcut.
- [x] Add compact CSS for item rank, priority, action detail, hover, and focus states.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with P0 readiness backlog behavior.
- [x] Run focused tests, full tests, build, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-12: Verified RED model failure for missing `buildP0PlatformBacklogItems`, implemented the pure backlog model, and verified focused backlog tests passed.
- 2026-06-12: Verified RED layout failure for missing App/UI wiring, then added compact current-task backlog shortcuts and focused layout test passed.
- 2026-06-12: Verified focused P0 tests, full `npm test`, production build, Docker smoke on port 5173, browser smoke for the backlog card, and `git diff --check`.
