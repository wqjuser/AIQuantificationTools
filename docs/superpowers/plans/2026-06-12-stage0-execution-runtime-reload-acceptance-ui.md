# Stage 0 Execution Runtime Reload Acceptance UI Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface execution adapter runtime reload acceptance records in the workbench promotion path so the final paper-only acceptance gate is visible and contributes to adapter readiness evidence.

**Architecture:** Reuse the existing execution adapter evidence chain in `terminal-workbench.ts` and `App.tsx`. Add compact acceptance rows, load acceptance history during Settings refresh, pass the rows into `buildPromotionReadiness`, and render recent acceptance rows in `PromotionQueuePanel`. Acceptance remains evidence-only and cannot enable live trading.

**Non-Goals:** Do not add real environment writes, do not restart containers, do not connect broker APIs, do not route real orders, and do not add a recording form in this slice.

---

### Task 1: RED Model And Promotion Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Add failing coverage for `buildExecutionAdapterRuntimeReloadAcceptanceRows`.
- [x] Add failing coverage showing `buildPromotionReadiness` consumes the latest matching acceptance record.
- [x] Keep row output secret-free and paper-only/live-blocked.

### Task 2: RED App Wiring Test

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`

- [x] Add failing source/layout coverage for loading acceptance history during Settings refresh.
- [x] Add failing source/layout coverage for passing acceptance rows into `PromotionQueuePanel`.
- [x] Add failing source/layout coverage for rendering recent acceptance evidence.

### Task 3: Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Add acceptance snapshot/row types and row builder.
- [x] Add latest matching acceptance selection and promotion detail copy.
- [x] Add App state, refresh call, row builder, readiness argument, panel props, and compact evidence rendering.
- [x] Add status/summary label helpers and CSS selectors matching existing evidence panels.

### Task 4: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with UI and promotion-queue integration status.
- [x] Run focused workbench tests.
- [x] Run focused layout/source tests.
- [x] Run frontend tests.
- [x] Run production build.
- [x] Run full root tests.
- [x] Run Docker smoke and browser smoke.
- [x] Run `git diff --check`.

**Progress:**
- 2026-06-12: Planned acceptance UI integration as a small evidence surfacing slice after the backend/API contract landed.
- 2026-06-12: Added RED coverage for compact acceptance rows, promotion readiness consumption, and App/Promotion Queue source wiring; then implemented the row model, latest-evidence selection, Settings refresh history loading, panel rendering, labels, and CSS.
- 2026-06-12: Verified focused workbench tests, focused layout/source tests, all frontend tests, production build, full root tests, Docker smoke on port 5173, and browser smoke on the execution workspace with no console errors.
- 2026-06-12: Confirmed `git diff --check` is clean before committing the slice.
