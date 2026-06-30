# Stage 1 Daily Use Stale Source Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make stale Stage 1 daily-use source manifests visible in the frontend summary and homepage closure model.

**Architecture:** Keep the backend report schema and API contract unchanged. Promote optional `staleSourcePaths` from `Stage1DailyUseSummarySource` into `Stage1DailyUseSummary` and `Stage1P0DailyUseClosure`, derive a concise stale source summary, and append it to report/closure detail so the existing refresh button has clear context.

**Tech Stack:** TypeScript workbench model helpers, Vitest model tests, README/product-plan documentation.

---

### Task 1: Model Stale Sources In Daily-Use Summary

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Add a failing summary/closure test**

Add a test near `uses all valid Stage 1 daily-use report rows before live UI fallback rows` that builds a review daily-use report with `staleSourcePaths: ["data/p1-acceptance.json"]`. Assert:

```ts
expect(dailyUseReport.staleSourcePaths).toEqual(["data/p1-acceptance.json"]);
expect(dailyUseReport.staleSourceSummary).toBe(
  "Stale source manifests: data/p1-acceptance.json. Run npm run stage1:daily to refresh."
);
expect(dailyUseReport.headline).toBe("Stage 1 daily report needs refresh (1/5)");
expect(dailyUseReport.detail).toContain("Stale source manifests: data/p1-acceptance.json.");
expect(closure.staleSourcePaths).toEqual(["data/p1-acceptance.json"]);
expect(closure.detail).toContain("Run npm run stage1:daily to refresh.");
```

- [x] **Step 2: Run RED test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "stale source manifests"
```

Expected: fail because `Stage1DailyUseSummary` and `Stage1P0DailyUseClosure` do not expose stale source fields yet.

- [x] **Step 3: Implement stale source summary fields**

Add optional `staleSourcePaths?: string[]` to `Stage1DailyUseSummarySource`, and add required `staleSourcePaths: string[]` plus `staleSourceSummary: string | null` to `Stage1DailyUseSummary` and `Stage1P0DailyUseClosure`.

Add helpers in `terminal-workbench.ts`:

```ts
function normalizeStage1DailyUseStaleSourcePaths(report: Stage1DailyUseSummarySource): string[] {
  return Array.isArray(report.staleSourcePaths)
    ? report.staleSourcePaths.map((sourcePath) => sourcePath.trim()).filter(Boolean)
    : [];
}

function buildStage1DailyUseStaleSourceSummary(staleSourcePaths: string[]): string | null {
  if (staleSourcePaths.length === 0) {
    return null;
  }
  return `Stale source manifests: ${staleSourcePaths.join(", ")}. Run npm run stage1:daily to refresh.`;
}
```

Use the helpers in `buildStage1DailyUseSummary`; when stale paths exist, make the headline `Stage 1 daily report needs refresh (ready/total)` and append the stale summary to `detail`.

- [x] **Step 4: Propagate stale summary into closure**

In `buildStage1P0DailyUseClosure`, copy stale fields from `dailyUseReport` into the returned closure and append `dailyUseReport.staleSourceSummary` to the closure `detail` before row details.

### Task 2: App Detail And Documentation

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Keep localized homepage detail explicit**

Update `stage1P0DailyUseClosureDetail` so zh-CN also shows stale source paths when `closure.staleSourceSummary` is present:

```ts
if (closure.staleSourceSummary) {
  return i18n.locale === "zh-CN"
    ? `日报源已更新 · ${closure.staleSourcePaths.join(", ")} · 请刷新自检`
    : closure.detail;
}
```

Add a layout/source test assertion that the helper references `closure.staleSourceSummary`.

- [x] **Step 2: Document stale visibility**

Update README and product plan to say the homepage closure now shows stale source manifest paths, not only row-level review state.

### Task 3: Verification And Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-07-01-stage1-daily-use-stale-source-visibility.md`

- [x] **Step 1: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "stale source manifests|Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use closure"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 2: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-01-stage1-daily-use-stale-source-visibility.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: surface stale daily use sources"
```
