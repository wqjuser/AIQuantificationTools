# Execution Promotion Apply Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind recent execution adapter certification apply preflight history into the Execution workspace promotion queue.

**Architecture:** Reuse the frontend apply history that Settings already loads from the local core. Extend `buildPromotionReadiness(...)` so the adapter-certification stage can explain whether the latest certification has a recent apply preflight result and why live promotion remains blocked. Render the same evidence in `PromotionQueuePanel` with compact rows; no backend changes or live trading enablement are included.

**Tech Stack:** React/TypeScript, Vitest, existing terminal workbench helpers, existing Docker deployment.

---

### Task 1: Workbench Promotion Evidence Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Write a failing test proving `buildPromotionReadiness(...)` accepts `ExecutionAdapterCertificationApplyRow[]` and shows `ready_for_restart` as controlled-restart evidence while keeping the adapter stage blocked.
- [x] Run the targeted test and confirm it fails because the apply rows are not accepted or ignored.
- [x] Add latest-apply selection by market/live adapter/certification id and append apply detail to the adapter stage.
- [x] Re-run the targeted test and confirm it passes.

### Task 2: Execution Panel Rendering

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Write a failing layout/source contract proving `PromotionQueuePanel` receives `adapterCertificationApplyRows`, renders compact apply evidence rows, and uses the existing apply label helpers.
- [x] Run the targeted layout test and confirm it fails.
- [x] Pass `executionAdapterCertificationApplyRows` into `buildPromotionReadiness(...)` and `PromotionQueuePanel`.
- [x] Render up to three recent apply rows in the promotion queue with existing tone colors.
- [x] Re-run the targeted layout test and confirm it passes.

### Task 3: Verification And Documentation

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-08-execution-promotion-apply-evidence.md`

- [x] Update product plan to mark Execution workspace apply evidence binding complete.
- [x] Run targeted tests, full test suite, build, Docker smoke, and browser verification on `?workspace=execution`.
- [x] Commit and push through proxy `127.0.0.1:7890`.

**Progress**

- RED: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "binds certification apply preflight"` failed because the adapter stage ignored apply evidence and still showed only the certification row.
- RED: `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "promotion certification evidence"` failed because `PromotionQueuePanel` did not receive or render apply rows.
- GREEN: `buildPromotionReadiness(...)` now accepts apply rows, selects the latest matching live adapter apply by market/adapter/certification id, and explains `ready_for_restart` as controlled-restart evidence while keeping live routing blocked.
- GREEN: Execution promotion queue now receives `executionAdapterCertificationApplyRows` and renders recent apply preflight evidence rows with compact reused tone styling.
- VERIFY: targeted workbench and layout tests passed after implementation.
- VERIFY: Python unit discovery passed with 132 tests; root `npm test` passed with 360 web tests plus Python tests; `npm run build` completed without chunk warnings.
- VERIFY: `docker compose config`, `git diff --check`, `docker compose build`, and `python tools\docker_smoke.py --no-build --down` passed; compose was restarted afterward on port 5173.
- VERIFY: browser check on `http://127.0.0.1:5173/?workspace=execution` showed 5 promotion stages, 3 apply evidence rows, and the latest `待受控重启` apply row from the seeded local audit record.
