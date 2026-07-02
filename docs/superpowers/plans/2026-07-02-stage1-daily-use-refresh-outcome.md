# Stage 1 Daily Use Refresh Outcome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a clear homepage receipt after the Stage 1/P0 "Refresh daily" action, covering daily-use report generation, bootstrap preflight generation, and desktop release readback.

**Architecture:** Keep the existing three local operations unchanged: `POST /api/stage1/daily-use`, `POST /api/stage1/bootstrap-preflight`, and `GET /api/desktop/release/latest`. Add a small frontend model `buildStage1P0DailyUseRefreshOutcome` that converts the three post-refresh summaries plus their `core/fallback` sources into a reader-facing receipt. Store the receipt only after the user runs the refresh button and render it inside the Stage 1/P0 daily-use closure card footer.

**Tech Stack:** React/TypeScript model helpers, Vitest model tests, Vitest source-contract layout test, README and product-plan docs.

---

### Task 1: Refresh Outcome Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing model tests**

Add tests for:
- a ready receipt where daily-use, bootstrap preflight, and desktop release all came from `core`, expecting `state="ready"`, `readyCount=3`, `totalCount=3`, and entries for `daily-use`, `bootstrap-preflight`, `desktop-release`;
- a partial failure receipt where daily-use returns `fallback` with an error, expecting `state="blocked"`, the daily-use entry to be blocked, and the detail to include the error.

- [x] **Step 2: Run RED model tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1 daily-use refresh outcome"
```

Expected: fail because no refresh outcome model exists.

- [x] **Step 3: Implement model**

Add:
- `Stage1P0DailyUseRefreshOutcomeState = "ready" | "review" | "blocked"`;
- `Stage1P0DailyUseRefreshOutcomeEntry`;
- `Stage1P0DailyUseRefreshOutcome`;
- `Stage1P0DailyUseRefreshOutcomeInput`;
- `buildStage1P0DailyUseRefreshOutcome`.

Rules:
- source `fallback` or missing summary maps that entry to `blocked`;
- daily-use or bootstrap `ready` maps to `ready`, `review/missing` maps to `review`, and `blocked/invalid` maps to `blocked`;
- desktop `passed` maps to `ready`, `missing` maps to `review`, and `invalid` maps to `blocked`;
- overall state is the worst entry state;
- `actionLabel` and `targetWorkspaceId` come from the first blocked/review entry, otherwise "Open daily workbench" and `research`;
- do not change live trading flags or trigger any side effects.

- [x] **Step 4: Run GREEN model tests**

Run the same targeted model test.

### Task 2: Homepage Receipt Rendering

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write the failing App source-contract test**

Extend the Stage 1/P0 daily-use layout test to assert:
- `buildStage1P0DailyUseRefreshOutcome`;
- `const [stage1P0DailyUseRefreshOutcome, setStage1P0DailyUseRefreshOutcome]`;
- `refreshOutcome={stage1P0DailyUseRefreshOutcome}`;
- `stage1-p0-daily-use-refresh-outcome`;
- Chinese text `刷新回执` and `本地核心`.

- [x] **Step 2: Run RED App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: fail because the homepage does not yet store or render a refresh receipt.

- [x] **Step 3: Wire App state and rendering**

Add a `stage1P0DailyUseRefreshOutcome` state. In `refreshStage1DailyUseReport`, build summaries from each generated/readback result, set the latest states as before, then call `setStage1P0DailyUseRefreshOutcome(buildStage1P0DailyUseRefreshOutcome(...))`.

Update `Stage1P0DailyUseClosurePanel` to accept `refreshOutcome` and render a compact receipt with:
- receipt headline/detail;
- three entry chips;
- `core/fallback` source labels.

Add CSS for `.stage1-p0-daily-use-refresh-outcome` and its entry grid.

- [x] **Step 4: Run GREEN App contract test**

Run the same targeted layout test.

### Task 3: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: this plan

- [x] **Step 1: Update docs**

Mention that the homepage refresh button now leaves a local-only receipt explaining daily-use, preflight, and desktop readback results.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1 daily-use refresh outcome"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-daily-use-refresh-outcome.md apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: show stage1 refresh outcome receipt"
```
