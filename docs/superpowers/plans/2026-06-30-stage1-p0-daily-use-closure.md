# Stage 1 P0 Daily Use Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first screen explain whether a personal or small-team user can start the day from a clean environment, recover market data refresh failures, open the research path, record the daily start review, and package the desktop build.

**Architecture:** Add one frontend-derived daily-use closure model in `terminal-workbench.ts` that consumes existing P0/P1 acceptance, Stage 1 research readiness rows, market-data refresh guard, Daily Start, and a static desktop release checklist. Render it as a compact work-focused card in the existing overview, with row-level workspace shortcuts only; do not add backend writes or trading behavior.

**Tech Stack:** React, TypeScript, Vitest, existing AIQuant frontend model helpers.

---

### Task 1: Daily Use Closure Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing test**

Add a model test that calls `buildStage1P0DailyUseClosure` with missing P0/P1 acceptance, a blocked refresh guard, a research readiness row requiring cache refresh, an attention Daily Start brief, and `desktopBuildReady: false`. Assert five rows: `clean-open`, `market-refresh-recovery`, `research-entry`, `daily-start`, `desktop-release`, with the first row blocked and the summary headline pointing at clean environment acceptance.

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts`
Expected: FAIL because `buildStage1P0DailyUseClosure` is not exported.

- [x] **Step 3: Implement the minimal model**

Add exported row/summary types and `buildStage1P0DailyUseClosure`. Keep all outputs derived from existing state. Target workspaces should be `audit`, `market`, `research`, `research`, and `settings`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts`
Expected: PASS.

### Task 2: Overview Card Wiring

**Files:**
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write the failing source/UI guard**

Assert `App.tsx` imports `buildStage1P0DailyUseClosure`, derives `stage1P0DailyUseClosure`, renders `Stage1P0DailyUseClosurePanel`, and includes visible copy for clean environment, refresh recovery, research entry, daily start, and desktop release.

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js`
Expected: FAIL because the card is absent.

- [x] **Step 3: Implement the card**

Add `Stage1P0DailyUseClosurePanel` near the existing P0 readiness summary. Use existing buttons and icons. Row clicks only call `selectProductWorkArea(row.targetWorkspaceId)`. No new backend calls.

- [x] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js`
Expected: PASS.

### Task 3: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/desktop-build-notes.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Document the daily-use closure**

Record that the overview now has a Stage 1/P0 daily-use closure card and that desktop packaging remains a local release checklist, not a trading unlock.

- [x] **Step 2: Verify**

Run:

```bash
git diff --check
npm run build
npm test
```

Expected: all commands exit 0, allowing the existing Vite chunk-size warning.
