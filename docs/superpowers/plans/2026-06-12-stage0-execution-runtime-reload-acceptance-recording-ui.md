# Stage 0 Execution Runtime Reload Acceptance Recording UI Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Settings record execution adapter runtime reload final acceptance from the existing `recordExecutionAdapterRuntimeReloadAcceptance` API so the final acceptance gate is not only readable in Promotion Queue but also operable from the product shell.

**Architecture:** Reuse existing runtime reload execution rows as the source candidates. Add per-execution confirmation state in `App.tsx`, render a compact acceptance recording section in `PlatformSettingsPanel`, call the existing typed API client, merge the returned acceptance into local evidence state, and keep Promotion Queue readiness unchanged except for consuming the newly recorded history.

**Non-Goals:** Do not add a backend endpoint, do not write raw secrets, do not restart containers, do not connect broker APIs, do not route real orders, and do not set `liveTradingAllowed=true`.

---

### Task 1: RED App Wiring Test

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`

- [x] Add failing source/layout coverage for importing and calling `recordExecutionAdapterRuntimeReloadAcceptance`.
- [x] Add failing source/layout coverage for per-execution confirmation state and recording handler.
- [x] Add failing source/layout coverage for Settings rendering a compact runtime reload acceptance recorder.

### Task 2: Implementation

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Add acceptance confirmation state, default factory, recording id state, and update handler.
- [x] Add `recordAdapterRuntimeReloadAcceptance` handler using the existing typed API client.
- [x] Pass runtime reload execution/acceptance rows and handlers into `PlatformSettingsPanel`.
- [x] Render confirmation checkboxes, a record button, latest acceptance status, and paper-only/live-blocked boundary.
- [x] Add compact CSS selectors matching existing adapter evidence lists.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with Settings-side acceptance recording status.
- [x] Run focused layout/source test.
- [x] Run production build.
- [x] Run full root tests.
- [x] Run Docker smoke and browser smoke.
- [x] Run `git diff --check`.

**Progress:**
- 2026-06-12: Planned the Settings-side recording UI to close the runtime reload final acceptance loop without changing backend safety boundaries.
- 2026-06-12: Verified RED source/layout failure for missing Settings acceptance recording controls, then implemented per-execution confirmation state, the existing typed API call, Settings rendering, compact CSS, and product-plan status.
- 2026-06-12: Focused layout/source test, production web build, full root tests, Docker smoke on port 5173, browser smoke on Settings, and `git diff --check` passed.
