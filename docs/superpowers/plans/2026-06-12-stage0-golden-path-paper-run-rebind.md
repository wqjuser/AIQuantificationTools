# Stage 0 Golden Path Paper Run Rebind Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Golden Path says the next action is paper execution but the frontend has not replayed the latest audited run, let the paper action first bind that `latestRunId` instead of staying permanently disabled.

**Architecture:** Keep the core Golden Path API unchanged because it already returns `latestRunId`. Add a frontend helper that resolves that run from history or detail API, replays it, moves the operator into Execution, and only submits a paper order immediately when the current run was already bound before the click. Keep risk approval and paper-only gates intact.

**Non-Goals:** Do not create real orders, do not bypass risk approval, do not change backend Golden Path semantics, and do not auto-submit immediately after a replayed run changes React state.

---

### Task 1: RED Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add coverage requiring a Golden Path paper action rebinding helper.
- [x] Assert the helper uses `goldenPath.latestRunId`, run history/detail loading, and `replayRun`.
- [x] Assert `submit-paper-order` disabled state allows a rebind when a latest run id exists, while still honoring risk approval after a run is bound.

### Task 2: Frontend Rebind Flow

**Files:**
- Modify: `apps/web/src/App.tsx`

- [x] Add `ensureGoldenPathLatestRunBound`.
- [x] Resolve the latest run from `runHistory` before falling back to `loadResearchRunDetail`.
- [x] Move to Execution/paper workflow after replay.
- [x] Submit only when the run was already bound before the click.
- [x] Keep risk approval blocked state disabling direct paper submission.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the Golden Path paper rebind behavior.
- [x] Run focused layout/P0 tests, build, Docker/browser smoke, full tests when practical, and `git diff --check`.

**Progress:**
- 2026-06-12: Added a RED contract for `submit-paper-order` latest-run rebinding and implemented the minimum frontend flow; focused rebind contract passes.
- 2026-06-12: Verified with focused P0/Golden Path layout tests, web build, Docker smoke, browser smoke without creating orders, full `npm test`, and `git diff --check`.
