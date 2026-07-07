# Stage 1 Archive Coverage Entry Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `record-stage1-archive-review` local-review coverage links land on the exact Stage 1 archive recording control instead of only switching to the broad research workspace.

**Architecture:** Keep the existing local-review coverage next-action URL contract unchanged. Add a stable DOM id for the Stage 1 “Record archive” action, a small focus helper, and call that helper from both recovered deep-link open actions and Audit toolbar/row open actions when the resolved next action is `record-stage1-archive-review`.

**Tech Stack:** React/TypeScript source wiring, Vitest source-contract tests, existing Stage 1 daily-use focus helpers.

## Global Constraints

- Do not change the `buildLocalReviewCoverageNextActionUrlSearch` query schema.
- Do not automatically record a Stage 1 archive audit event.
- Do not refresh Stage 1 evidence, run Docker, build desktop assets, connect brokers, sign reports, or submit orders.
- Focus and scroll are UI-only recovery aids; Audit query context must remain intact.

---

### Task 1: Lock Stage 1 Archive Entry Focus Contracts

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

**Interfaces:**
- Consumes: existing App source strings for Stage 1 daily-use focus helpers and local review coverage next-action handlers.
- Produces: failing source-contract tests requiring a stable record-archive action id and focus calls from both deep-link and Audit-source open paths.

- [x] **Step 1: Add failing source-contract assertions**

Extend the Stage 1/P0 daily-use source-contract test to require:

```js
expect(appSource).toContain('const stage1P0DailyUseArchiveRecordActionElementId = "stage1-p0-daily-use-archive-record-action";');
expect(appSource).toContain("function focusStage1P0DailyUseArchiveRecordActionElement()");
expect(appSource).toContain("id={stage1P0DailyUseArchiveRecordActionElementId}");
expect(appSource).toContain("focusStage1P0DailyUseArchiveRecordActionElement();");
```

Extend the Audit ledger source-contract test to require:

```js
expect(appSource).toContain('state?.actionId === "record-stage1-archive-review"');
expect(appSource).toContain("localReviewCoverageNextActionShouldFocusStage1ArchiveEntry(");
expect(appSource).toContain("queueStage1P0DailyUseArchiveRecordActionFocus();");
```

- [x] **Step 2: Run focused tests and verify failure**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js
```

Expected before implementation: fail because the Stage 1 archive record button has no stable focus id and open paths do not queue the exact archive-entry focus.

Result: focused source-contract verification was exercised before implementation, then rerun after implementation. The first post-implementation run caught an over-narrow Audit panel source assertion; after correcting the contract to assert the App-level predicate, `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js` passed with 137 tests.

### Task 2: Implement Stage 1 Archive Entry Focus

**Files:**
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Produces:
  - `stage1P0DailyUseArchiveRecordActionElementId`
  - `focusStage1P0DailyUseArchiveRecordActionElement()`
  - `queueStage1P0DailyUseArchiveRecordActionFocus()`
  - `localReviewCoverageNextActionShouldFocusStage1ArchiveEntry(state)`

- [x] **Step 1: Add stable id and focus helpers**

Add a constant beside the existing Stage 1 element ids:

```ts
const stage1P0DailyUseArchiveRecordActionElementId = "stage1-p0-daily-use-archive-record-action";
```

Add helper functions beside existing Stage 1 focus helpers:

```ts
function focusStage1P0DailyUseArchiveRecordActionElement(): void {
  focusStage1P0DailyUseElementById(stage1P0DailyUseArchiveRecordActionElementId);
}

function queueStage1P0DailyUseArchiveRecordActionFocus(): void {
  if (typeof window === "undefined") {
    focusStage1P0DailyUseArchiveRecordActionElement();
    return;
  }
  window.requestAnimationFrame(() => focusStage1P0DailyUseArchiveRecordActionElement());
}
```

- [x] **Step 2: Attach id to Record archive button**

Set `id={stage1P0DailyUseArchiveRecordActionElementId}` on the Stage 1 footer button that calls `onRecordArchive`.

- [x] **Step 3: Focus exact archive action from coverage next open paths**

Add:

```ts
function localReviewCoverageNextActionShouldFocusStage1ArchiveEntry(
  state: LocalReviewCoverageNextActionDeepLinkState | null
): boolean {
  return state?.actionId === "record-stage1-archive-review";
}
```

Use it after selecting the next-action workspace in both:

- the recovered local-review coverage next-action banner open handler
- the Audit ledger `onOpenLocalReviewCoverageNextAction` handler

### Task 3: Document, Verify, and Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-07-stage1-archive-coverage-entry-focus.md`

- [x] **Step 1: Update docs**

Add a short note that Stage 1 archive coverage next-action links now land on the Record archive control.

- [x] **Step 2: Run verification**

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
npm run build
npm test
```

Verification results:

- `git diff --check` passed.
- `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` passed: 2 files, 554 tests.
- `npm run build` passed.
- `npm test` passed: Python 352 tests and web 810 tests.

- [x] **Step 3: Commit**

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js docs/product-plan.md docs/superpowers/plans/2026-07-07-stage1-archive-coverage-entry-focus.md
git commit -m "feat: focus stage1 archive coverage entry"
```
