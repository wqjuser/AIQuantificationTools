# Stage 1 Daily Use Report Backed Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage Stage 1/P0 daily-use closure card use all five rows from `data/stage1-daily-use.json` when a valid report is available.

**Architecture:** Keep `buildStage1P0DailyUseClosure` as the single frontend model boundary. Add a small helper that maps a `Stage1DailyUseSummaryRowSource` to a `Stage1P0DailyUseClosureRow` for the three middle rows, mirroring the existing report-backed clean-open and desktop release behavior. Missing or invalid reports keep the existing live UI fallback path.

**Tech Stack:** TypeScript model tests with Vitest, existing terminal workbench model functions, README/product-plan docs.

---

### Task 1: Homepage Model Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Add failing report-backed closure test**

Add a test near the existing Stage 1/P0 daily-use closure tests:

```ts
test("uses all valid Stage 1 daily-use report rows before live UI fallback rows", () => {
  const dailyUseReport = buildStage1DailyUseSummary({
    kind: "aiqt.stage1DailyUseReport",
    schemaVersion: 1,
    generatedAt: "2026-06-30T10:00:00+00:00",
    status: "ready",
    summary: "Stage 1 daily use is ready (5/5 checks ready).",
    readyCount: 5,
    totalCount: 5,
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true,
    sourcePath: "data/stage1-daily-use.json",
    sourcePaths: {
      p0Acceptance: "data/p0-acceptance.json",
      p1Acceptance: "data/p1-acceptance.json",
      desktopRelease: "data/desktop-release.json"
    },
    rows: [
      /* clean-open, market-refresh-recovery, research-entry, daily-start, desktop-release */
    ]
  });
  const closure = buildStage1P0DailyUseClosure({ dailyUseReport, ...conflictingLiveFallbackInputs });
  expect(closure.readyCount).toBe(5);
  expect(closure.rows[1]).toMatchObject({ id: "market-refresh-recovery", status: "ready", value: "report refresh ready" });
  expect(closure.rows[2]).toMatchObject({ id: "research-entry", status: "ready", value: "report research ready" });
  expect(closure.rows[3]).toMatchObject({ id: "daily-start", status: "ready", value: "report daily ready" });
});
```

- [x] **Step 2: Run RED model test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "valid Stage 1 daily-use report rows"
```

Expected: fail because market-refresh-recovery, research-entry, and daily-start still use live fallback inputs.

- [x] **Step 3: Implement report row mapping**

In `terminal-workbench.ts`, add:

```ts
function buildDailyUseReportBackedRow(
  dailyUseReport: Stage1DailyUseSummary | null,
  rowId: "market-refresh-recovery" | "research-entry" | "daily-start",
  fallback: () => Stage1P0DailyUseClosureRow,
  config: { label: string; readyActionId: Stage1P0DailyUseClosureActionId; reviewActionId: Stage1P0DailyUseClosureActionId; blockedActionId: Stage1P0DailyUseClosureActionId; targetWorkspaceId: ProductWorkAreaId }
): Stage1P0DailyUseClosureRow
```

Use it in `buildStage1P0DailyUseClosure` for the three middle rows. Only use the report row when `dailyUseReport.state` is not `missing` or `invalid`.

### Task 2: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-30-stage1-daily-use-report-backed-closure.md`

- [x] **Step 1: Document report-backed homepage rows**

Update docs to state that the homepage card now consumes all five report rows when present.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use|valid Stage 1 daily-use report rows"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run stage1:daily
npm run stage1:daily:validate
npm run test:python
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-06-30-stage1-daily-use-report-backed-closure.md apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: use daily report rows in stage1 closure"
```
