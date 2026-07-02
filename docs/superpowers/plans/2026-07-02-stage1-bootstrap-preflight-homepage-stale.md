# Stage 1 Bootstrap Preflight Homepage Stale Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make stale Stage 1 bootstrap preflight source evidence visible in the homepage Stage 1/P0 daily-use closure card, including Chinese detail and clean-open row copy.

**Architecture:** Keep the backend and API contract from the previous stale preflight readback work unchanged. Extend the existing `buildStage1P0DailyUseClosure` model to carry bootstrap-preflight stale source fields alongside daily-use stale source fields, then update `App.tsx` display helpers so the homepage explains when the preflight itself needs refresh instead of showing only a generic clean-open review state.

**Tech Stack:** React/TypeScript model helpers, Vitest source-contract tests, README and product-plan notes.

---

### Task 1: Closure Model Stale Propagation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing model test**

Add a test named `propagates stale bootstrap preflight sources through the Stage 1 daily-use closure`.

The test builds:
- a review `Stage1BootstrapPreflightSummary` with `nextAction="refresh-stage1-bootstrap-preflight"` and `staleSourcePaths=["data/stage1-daily-use.json"]`;
- a ready five-row daily-use report;
- a closure via `buildStage1P0DailyUseClosure`.

It must assert:
- `closure.state === "review"`;
- `closure.readyCount === 4`;
- `closure.bootstrapPreflightStaleSourcePaths` contains `data/stage1-daily-use.json`;
- `closure.bootstrapPreflightStaleSourceSummary` tells the operator to run `npm run stage1:preflight`;
- `closure.detail` includes both the preflight refresh headline and stale source summary;
- the `clean-open` row points to `review-bootstrap-preflight` with action label `Refresh bootstrap preflight`.

- [x] **Step 2: Run RED model test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "stale bootstrap preflight sources through"
```

Expected: fail because `Stage1P0DailyUseClosure` does not yet expose bootstrap-preflight stale source fields.

- [x] **Step 3: Implement closure propagation**

Add to `Stage1P0DailyUseClosure`:

```ts
bootstrapPreflightStaleSourcePaths: string[];
bootstrapPreflightStaleSourceSummary: string | null;
```

In `buildStage1P0DailyUseClosure`, derive them from `bootstrapPreflight?.staleSourcePaths` and `bootstrapPreflight?.staleSourceSummary`, include the summary in `detail`, and keep existing daily-use stale fields unchanged.

- [x] **Step 4: Run GREEN model test**

Run the same targeted Vitest command and confirm it passes.

### Task 2: Homepage Chinese Copy Contract

**Files:**
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write the failing App source-contract test**

Extend the existing `renders Stage 1/P0 daily-use closure before detailed readiness evidence` test to assert App source contains:
- `closure.bootstrapPreflightStaleSourceSummary`;
- `开箱预检源已更新`;
- `开箱预检待刷新`;
- row detail copy for stale/review bootstrap preflight.

- [x] **Step 2: Run RED App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: fail because App currently checks only `closure.staleSourceSummary` and translates any preflight row as blocked.

- [x] **Step 3: Implement homepage copy**

Update `stage1P0DailyUseClosureDetail` so Chinese locale prioritizes `closure.bootstrapPreflightStaleSourceSummary` with:

```ts
开箱预检源已更新 · <paths> · 请刷新自检
```

Update `stage1P0DailyUseClosureRowValue` so clean-open preflight review says `开箱预检待刷新` while blocked remains `开箱预检阻断`.

Update `stage1P0DailyUseClosureRowDetail` so preflight review explains that stale preflight sources changed and refreshing self-check regenerates preflight.

- [x] **Step 4: Run GREEN App contract test**

Run the same targeted Vitest command and confirm it passes.

### Task 3: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: this plan

- [x] **Step 1: Update docs**

Mention that homepage Stage 1/P0 daily-use closure now shows bootstrap-preflight stale source paths directly and distinguishes preflight refresh from hard blocked bootstrap failures.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "bootstrap preflight"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run stage1:preflight:validate
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-bootstrap-preflight-homepage-stale.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: surface stale stage1 preflight on homepage"
```
