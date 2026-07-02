# Stage 1 Navigation Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show clear local status feedback when operators click Stage 1/P0 daily-use rows, the primary action, refresh receipt entries, or the refresh receipt next step.

**Architecture:** Keep `Stage1P0DailyUseClosurePanel` purely frontend and add typed callback props for opening a closure row, the primary row, refresh outcome entries, and refresh outcome next step. The parent callbacks call the existing `selectProductWorkArea` and then update `workspaceState.statusLabel` with deterministic labels. This is a local UI feedback layer only: no backend calls, no audit writes, no Stage 1 reruns, no desktop build, no broker, no orders.

**Tech Stack:** React, TypeScript, Vitest source-contract test, existing Stage 1/P0 card model types.

---

### Task 1: Homepage Navigation Feedback Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Write the failing App contract test**

Extend the Stage 1/P0 daily-use layout test with these assertions:

```js
expect(appSource).toContain("const openStage1P0DailyUseRow = useCallback");
expect(appSource).toContain("statusLabel: `Stage 1 daily row opened · ${row.id} -> ${row.targetWorkspaceId}`");
expect(appSource).toContain("const openStage1P0DailyUsePrimaryAction = useCallback");
expect(appSource).toContain("statusLabel: `Stage 1 daily primary action opened · ${stage1P0DailyUseClosure.primaryActionId} -> ${stage1P0DailyUseClosure.primaryTargetWorkspaceId}`");
expect(appSource).toContain("const openStage1P0DailyUseRefreshOutcomeEntry = useCallback");
expect(appSource).toContain("statusLabel: `Stage 1 refresh receipt entry opened · ${entry.id} -> ${entry.targetWorkspaceId}`");
expect(appSource).toContain("const openStage1P0DailyUseRefreshOutcomeNextStep = useCallback");
expect(appSource).toContain("statusLabel: `Stage 1 refresh receipt next step opened · ${stage1P0DailyUseRefreshOutcome.actionLabel} -> ${stage1P0DailyUseRefreshOutcome.targetWorkspaceId}`");
expect(appSource).toContain("onOpenRow={openStage1P0DailyUseRow}");
expect(appSource).toContain("onOpenPrimaryAction={openStage1P0DailyUsePrimaryAction}");
expect(appSource).toContain("onOpenRefreshOutcomeEntry={openStage1P0DailyUseRefreshOutcomeEntry}");
expect(appSource).toContain("onOpenRefreshOutcomeNextStep={openStage1P0DailyUseRefreshOutcomeNextStep}");
expect(appSource).toContain("onOpenRow(row)");
expect(appSource).toContain("onOpenRefreshOutcomeEntry(entry)");
expect(appSource).toContain("onOpenRefreshOutcomeNextStep()");
```

- [x] **Step 2: Run RED App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because these callbacks and prop usages do not exist yet.

- [x] **Step 3: Implement navigation feedback callbacks**

Add parent callbacks:

```ts
const openStage1P0DailyUseRow = useCallback(
  (row: Stage1P0DailyUseClosure["rows"][number]) => {
    selectProductWorkArea(row.targetWorkspaceId);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: `Stage 1 daily row opened · ${row.id} -> ${row.targetWorkspaceId}`,
      error: undefined
    }));
  },
  [selectProductWorkArea]
);

const openStage1P0DailyUsePrimaryAction = useCallback(() => {
  selectProductWorkArea(stage1P0DailyUseClosure.primaryTargetWorkspaceId);
  setWorkspaceState((current) => ({
    ...current,
    statusLabel: `Stage 1 daily primary action opened · ${stage1P0DailyUseClosure.primaryActionId} -> ${stage1P0DailyUseClosure.primaryTargetWorkspaceId}`,
    error: undefined
  }));
}, [
  selectProductWorkArea,
  stage1P0DailyUseClosure.primaryActionId,
  stage1P0DailyUseClosure.primaryTargetWorkspaceId
]);

const openStage1P0DailyUseRefreshOutcomeEntry = useCallback(
  (entry: Stage1P0DailyUseRefreshOutcome["entries"][number]) => {
    selectProductWorkArea(entry.targetWorkspaceId);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: `Stage 1 refresh receipt entry opened · ${entry.id} -> ${entry.targetWorkspaceId}`,
      error: undefined
    }));
  },
  [selectProductWorkArea]
);

const openStage1P0DailyUseRefreshOutcomeNextStep = useCallback(() => {
  if (!stage1P0DailyUseRefreshOutcome) {
    return;
  }

  selectProductWorkArea(stage1P0DailyUseRefreshOutcome.targetWorkspaceId);
  setWorkspaceState((current) => ({
    ...current,
    statusLabel: `Stage 1 refresh receipt next step opened · ${stage1P0DailyUseRefreshOutcome.actionLabel} -> ${stage1P0DailyUseRefreshOutcome.targetWorkspaceId}`,
    error: undefined
  }));
}, [selectProductWorkArea, stage1P0DailyUseRefreshOutcome]);
```

Pass these callbacks into `Stage1P0DailyUseClosurePanel`.

Extend panel props:

```ts
onOpenPrimaryAction: () => void;
onOpenRefreshOutcomeEntry: (entry: Stage1P0DailyUseRefreshOutcome["entries"][number]) => void;
onOpenRefreshOutcomeNextStep: () => void;
onOpenRow: (row: Stage1P0DailyUseClosure["rows"][number]) => void;
```

Replace the existing direct `onSelectWorkspace(...)` calls for Stage 1/P0 rows, refresh receipt entries, refresh receipt next step, and the primary footer action with the new callbacks.

- [x] **Step 4: Run GREEN App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: PASS.

### Task 2: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-navigation-feedback.md`

- [x] **Step 1: Update docs**

Mention that Stage 1/P0 row and receipt navigation now writes explicit local status feedback while still only routing frontend workspaces.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-navigation-feedback.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js
git commit -m "feat: add stage1 navigation feedback"
```
