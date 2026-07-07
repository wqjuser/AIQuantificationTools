# Stage 1 Startup Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic Stage 1/P0 daily startup snapshot that combines the current daily-use closure, latest archive review reference, and refresh receipt into a compact copy/download handoff.

**Architecture:** Keep the feature in the existing web model and card. `terminal-workbench.ts` owns the pure snapshot builder and Markdown/file-name contract; `App.tsx` wires the memoized snapshot into the Stage 1/P0 daily-use card; existing layout source tests guard the UI wiring.

**Tech Stack:** TypeScript, React, Vitest, existing browser Clipboard/Blob download helpers.

## Global Constraints

- The snapshot is local/browser-only and must not record a new audit event.
- The snapshot must not refresh evidence, run Docker, build the desktop app, connect brokers, enable live trading, or submit orders.
- Follow existing Stage 1/P0 daily-use copy/download status patterns.
- Use TDD: add failing model and source-contract tests before implementation.

---

### Task 1: Model Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

**Interfaces:**
- Consumes: `Stage1P0DailyUseClosure`, `Stage1P0DailyUseArchiveReviewReference`, `Stage1P0DailyUseRefreshOutcome`
- Produces: `buildStage1P0DailyUseStartupSnapshot({ closure, archiveReference, refreshOutcome })`

- [x] **Step 1: Write the failing test**

Add assertions near the Stage 1 archive review reference test:

```ts
const snapshot = buildStage1P0DailyUseStartupSnapshot({
  archiveReference: reference,
  closure,
  refreshOutcome
});

expect(snapshot).toEqual(
  expect.objectContaining({
    archiveReferenceStatus: "current",
    fileName: "stage1-p0-daily-startup-snapshot-blocked-current-review.md",
    refreshOutcomeState: "review",
    state: "blocked"
  })
);
expect(snapshot.copyText).toContain("# Stage 1/P0 Daily Startup Snapshot");
expect(snapshot.copyText).toContain("- Archive reference: current");
expect(snapshot.copyText).toContain("- Archive reference event id: stage1-daily-archive-review-9999999999999999");
expect(snapshot.copyText).toContain("- Refresh receipt: review");
expect(snapshot.copyText).toContain("- research-entry: blocked -> research");
expect(snapshot.copyText).toContain("Live trading remains blocked.");
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js`

Expected: FAIL because `buildStage1P0DailyUseStartupSnapshot` is not exported.

- [x] **Step 3: Write minimal implementation**

Add:

```ts
export interface Stage1P0DailyUseStartupSnapshot {
  archiveReferenceStatus: Stage1P0DailyUseArchiveReviewReference["status"];
  copyText: string;
  fileName: string;
  refreshOutcomeState: Stage1P0DailyUseRefreshOutcome["state"] | "not-generated";
  readyCount: number;
  state: Stage1P0DailyUseClosure["state"];
  totalCount: number;
}
```

and implement `buildStage1P0DailyUseStartupSnapshot` so it returns deterministic Markdown with summary, row, archive-reference, refresh-receipt, and boundary sections.

- [x] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js`

Expected: PASS.

### Task 2: Home Card Wiring

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`

**Interfaces:**
- Consumes: `Stage1P0DailyUseStartupSnapshot`
- Produces: `copyStage1P0DailyUseStartupSnapshot`, `downloadStage1P0DailyUseStartupSnapshot`, card props and buttons

- [x] **Step 1: Write the failing source-contract test**

Add `layout-css.test.js` expectations for:

```js
expect(appSource).toContain("buildStage1P0DailyUseStartupSnapshot({");
expect(appSource).toContain("const stage1P0DailyUseStartupSnapshot = useMemo(");
expect(appSource).toContain("const copyStage1P0DailyUseStartupSnapshot = useCallback");
expect(appSource).toContain("const downloadStage1P0DailyUseStartupSnapshot = useCallback");
expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseStartupSnapshot.copyText)");
expect(appSource).toContain("anchor.download = stage1P0DailyUseStartupSnapshot.fileName");
expect(appSource).toContain("startupSnapshot?: Stage1P0DailyUseStartupSnapshot | null;");
expect(appSource).toContain("onCopyStartupSnapshot={copyStage1P0DailyUseStartupSnapshot}");
expect(appSource).toContain("onDownloadStartupSnapshot={downloadStage1P0DailyUseStartupSnapshot}");
expect(appSource).toContain("复制启动快照");
expect(appSource).toContain("Download startup snapshot");
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js`

Expected: FAIL on missing UI wiring.

- [x] **Step 3: Wire App.tsx**

Import the builder and type, memoize `stage1P0DailyUseStartupSnapshot`, add copy/download callbacks, pass them to `Stage1P0DailyUseClosurePanel`, and render footer buttons:

```tsx
<button disabled={!onCopyStartupSnapshot} onClick={onCopyStartupSnapshot} type="button">
  <Copy size={12} />
  {i18n.locale === "zh-CN" ? "复制启动快照" : "Copy startup snapshot"}
</button>
<button disabled={!onDownloadStartupSnapshot} onClick={onDownloadStartupSnapshot} type="button">
  <Download size={12} />
  {i18n.locale === "zh-CN" ? "下载启动快照" : "Download startup snapshot"}
</button>
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js`

Expected: PASS.

### Task 3: Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-07-stage1-startup-snapshot.md`

- [x] **Step 1: Document the user-facing change**

Add one short note explaining that the homepage can copy/download a daily startup snapshot and that it remains local-only.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
npm run build
npm test
```

Expected: all commands PASS.

- [x] **Step 3: Commit**

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js README.md docs/product-plan.md docs/superpowers/plans/2026-07-07-stage1-startup-snapshot.md
git commit -m "feat: export stage1 startup snapshot"
```
