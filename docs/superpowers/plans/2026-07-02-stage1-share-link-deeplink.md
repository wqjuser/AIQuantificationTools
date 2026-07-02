# Stage 1 Share Link Deep Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Stage 1/P0 shared daily-use links recover their handoff or refresh-receipt context after another user opens them.

**Architecture:** Keep the existing workspace navigation model, but add narrow Stage 1 query tokens to the relative links already emitted by the daily handoff and refresh receipt. Model helpers build and resolve those links; the homepage renders a small recovered-link banner with manual actions. The banner only explains and navigates existing frontend context.

**Tech Stack:** TypeScript model helpers, React homepage state, source-contract Vitest, existing Stage 1/P0 daily-use card styles.

---

### Task 1: Model Share-Link Context

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing model test**

Add assertions to the existing Stage 1/P0 daily-use closure and refresh outcome tests:

```ts
expect(closure.primaryWorkspaceLink).toBe("?workspace=audit&stage1DailyUseFocus=primary");
expect(closure.rows[0]?.workspaceLink).toBe("?workspace=audit&stage1DailyUseFocus=clean-open");
expect(closure.rows[4]?.workspaceLink).toBe("?workspace=settings&stage1DailyUseFocus=desktop-release");
expect(closure.copyText).toContain("Primary link: ?workspace=audit&stage1DailyUseFocus=primary");
expect(closure.copyText).toContain("(link: ?workspace=settings&stage1DailyUseFocus=desktop-release)");
```

Add refresh receipt assertions:

```ts
expect(outcome.targetWorkspaceLink).toBe("?workspace=research&stage1RefreshReceiptFocus=next");
expect(outcome.entries[0]?.workspaceLink).toBe("?workspace=settings&stage1RefreshReceiptFocus=daily-use");
expect(outcome.entries[2]?.workspaceLink).toBe("?workspace=settings&stage1RefreshReceiptFocus=desktop-release");
expect(outcome.copyText).toContain("Next link: ?workspace=research&stage1RefreshReceiptFocus=next");
```

Add a focused resolver test:

```ts
expect(
  resolveStage1P0DailyUseShareDeepLinkState("?workspace=research&stage1DailyUseFocus=daily-start")
).toEqual({
  kind: "daily-use",
  focus: "daily-start",
  targetWorkspaceId: "research"
});
expect(
  resolveStage1P0DailyUseShareDeepLinkState("?workspace=settings&stage1RefreshReceiptFocus=desktop-release")
).toEqual({
  kind: "refresh-receipt",
  focus: "desktop-release",
  targetWorkspaceId: "settings"
});
expect(
  resolveStage1P0DailyUseShareDeepLinkState(
    "?workspace=research&stage1DailyUseFocus=primary&stage1RefreshReceiptFocus=next"
  )
).toBeNull();
```

- [x] **Step 2: Run RED model test**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use|Stage 1 daily-use share"
```

Expected: FAIL because Stage 1 links only carry `workspace` and no resolver exists.

- [x] **Step 3: Implement model helpers**

Add exported focus/state types plus helpers:

```ts
export type Stage1P0DailyUseShareFocus = "primary" | Stage1P0DailyUseClosureRowId;
export type Stage1P0DailyUseRefreshReceiptFocus = "next" | Stage1P0DailyUseRefreshOutcomeEntry["id"];

export interface Stage1P0DailyUseShareDeepLinkState {
  kind: "daily-use" | "refresh-receipt";
  focus: Stage1P0DailyUseShareFocus | Stage1P0DailyUseRefreshReceiptFocus;
  targetWorkspaceId: ProductWorkAreaId;
}
```

Build links as:

```ts
?workspace=<target>&stage1DailyUseFocus=<focus>
?workspace=<target>&stage1RefreshReceiptFocus=<focus>
```

Reject malformed deep links when `workspace` is missing/invalid, both Stage 1 focus params appear, a focus value is unknown, or a focus param is repeated.

- [x] **Step 4: Run GREEN model test**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use|Stage 1 daily-use share"
```

Expected: PASS.

### Task 2: Homepage Recovered-Link Banner

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write failing UI/source contract**

Extend the Stage 1/P0 layout test to assert:

```js
expect(appSource).toContain("resolveStage1P0DailyUseShareDeepLinkState(window.location.search)");
expect(appSource).toContain("initialStage1P0DailyUseShareDeepLinkState");
expect(appSource).toContain("stage1P0DailyUseShareLinkLoadedStatusLabel(initialStage1P0DailyUseShareDeepLinkState)");
expect(overviewGridSource).toContain("initialStage1P0DailyUseShareDeepLinkState");
expect(overviewGridSource).toContain('className="stage1-p0-share-deep-link"');
expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkLabel(i18n, initialStage1P0DailyUseShareDeepLinkState)");
expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkFocusLabel(i18n, initialStage1P0DailyUseShareDeepLinkState)");
expect(overviewGridSource).toContain("stage1P0DailyUseShareLinkOpenStatusLabel(initialStage1P0DailyUseShareDeepLinkState)");
expect(overviewGridSource).toContain("selectProductWorkArea(initialStage1P0DailyUseShareDeepLinkState.targetWorkspaceId)");
expect(appSource).toContain("Stage 1 daily share link loaded");
expect(appSource).toContain("Stage 1 refresh receipt share link loaded");
expect(appSource).toContain("Stage 1 shared context opened");
expect(cssBlock(".stage1-p0-share-deep-link")).toContain("display: grid;");
```

- [x] **Step 2: Run RED UI/source test**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because no Stage 1 share deep-link banner exists.

- [x] **Step 3: Implement banner**

Import `resolveStage1P0DailyUseShareDeepLinkState`, create `initialStage1P0DailyUseShareDeepLinkState`, include it in `initialWorkspaceState.statusLabel`, and render a compact `stage1-p0-share-deep-link` banner above the Stage 1/P0 daily-use card.

Banner actions:
- `View daily card` / `查看日常卡片`: keep the user on overview and set status to `Stage 1 shared context opened: <kind>/<focus> -> <workspace>`.
- `Open shared workspace` / `打开分享工作区`: call `selectProductWorkArea(targetWorkspaceId)` and set the same status label.

- [x] **Step 4: Run GREEN UI/source test**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: PASS.

### Task 3: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-share-link-deeplink.md`

- [x] **Step 1: Update docs**

Mention that Stage 1/P0 handoff and refresh receipt links now include a narrow context token (`stage1DailyUseFocus` or `stage1RefreshReceiptFocus`) so opened links explain whether they came from the daily handoff or refresh receipt. State that links remain frontend-only navigation and do not run self-checks, write audits, build desktop, connect brokers, or submit orders.

- [x] **Step 2: Run verification**

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use|Stage 1 daily-use share"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-share-link-deeplink.md apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: recover stage1 share link context"
```
