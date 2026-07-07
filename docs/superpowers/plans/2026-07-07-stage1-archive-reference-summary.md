# Stage 1 Archive Reference Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Stage 1/P0 homepage export a concise Markdown summary of the latest archive review reference, including missing, stale, and current states.

**Architecture:** Reuse `Stage1P0DailyUseArchiveReviewReference` as the single source of truth and add deterministic `copyText` plus `fileName` fields for every status. Wire those fields into the existing Stage 1 daily-use panel as local clipboard/download actions beside the current Audit focus/link actions. Keep existing audit-event schema and local-review coverage semantics unchanged.

**Tech Stack:** React/TypeScript, Vitest source-contract tests, existing browser Blob download and clipboard helpers.

## Global Constraints

- Do not add a new backend endpoint or audit event type.
- Do not change `stage1_daily_archive_review` metadata or local-review bundle coverage rules.
- The summary export is a browser-local handoff action only.
- Do not run Docker, build desktop artifacts, connect brokers, sign reports, enable live trading, or submit orders.

---

### Task 1: Lock Archive Reference Summary Contracts

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

**Interfaces:**
- Consumes: `buildStage1P0DailyUseArchiveReviewReference(...)`
- Produces: tests requiring `Stage1P0DailyUseArchiveReviewReference.copyText`, `.fileName`, and UI copy/download buttons.

- [x] **Step 1: Add failing workbench assertions**

Extend the existing Stage 1 archive review reference test to require deterministic summary export fields:

```ts
expect(reference.fileName).toBe("stage1-p0-daily-use-archive-review-current.md");
expect(reference.copyText).toContain("# Stage 1 Daily-Use Archive Review Reference");
expect(reference.copyText).toContain("- Status: current");
expect(reference.copyText).toContain("- Event id: stage1-daily-archive-review-9999999999999999");
expect(reference.copyText).toContain("- Archive body SHA-256: aaaaaaaaaaaa");
expect(staleReference.fileName).toBe("stage1-p0-daily-use-archive-review-stale.md");
expect(staleReference.copyText).toContain("- Status: stale");
```

Also add a missing-reference assertion:

```ts
const missingReference = buildStage1P0DailyUseArchiveReviewReference({
  closure,
  invalidShareStatus,
  ledgerRows: [],
  refreshOutcome,
  shareDeepLinkState
});
expect(missingReference.fileName).toBe("stage1-p0-daily-use-archive-review-missing.md");
expect(missingReference.copyText).toContain("- Status: missing");
expect(missingReference.copyText).toContain("- Query: none");
```

- [x] **Step 2: Add failing UI source-contract assertions**

Require the Stage 1 panel to expose the summary actions and App callbacks:

```js
expect(appSource).toContain("onCopyArchiveReviewSummary");
expect(appSource).toContain("onDownloadArchiveReviewSummary");
expect(appSource).toContain("copyStage1P0DailyUseArchiveReviewSummary");
expect(appSource).toContain("downloadStage1P0DailyUseArchiveReviewSummary");
expect(appSource).toContain("navigator.clipboard.writeText(stage1P0DailyUseArchiveReviewReference.copyText)");
expect(appSource).toContain("anchor.download = stage1P0DailyUseArchiveReviewReference.fileName");
expect(appSource).toContain("复制归档摘要");
expect(appSource).toContain("Download archive summary");
```

### Task 2: Implement Reference Summary Model and UI Actions

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Produces: `buildStage1P0DailyUseArchiveReviewReferenceCopyText(reference)`
- Produces: `copyText` and `fileName` on `Stage1P0DailyUseArchiveReviewReference`
- Produces: `copyStage1P0DailyUseArchiveReviewSummary()` and `downloadStage1P0DailyUseArchiveReviewSummary()`

- [x] **Step 1: Extend the reference interface**

Add `copyText: string` and `fileName: string` to `Stage1P0DailyUseArchiveReviewReference`.

- [x] **Step 2: Build deterministic Markdown**

Create a helper that includes:
- title
- status, label, detail
- event id or `none`
- created at or `none`
- query or `none`
- archive body SHA-256 short prefix or `none`
- primary action and row statuses when a row exists
- live-blocked boundary sentence

- [x] **Step 3: Wire App copy/download actions**

Add callbacks that copy or download `stage1P0DailyUseArchiveReviewReference.copyText`, write clear success/failure status labels, and never create audit events.

- [x] **Step 4: Add Stage 1 panel buttons**

In the latest archive record block, add:
- `复制归档摘要 / Copy archive summary`
- `下载归档摘要 / Download archive summary`

### Task 3: Document, Verify, and Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-07-stage1-archive-reference-summary.md`

- [x] **Step 1: Update docs**

Document that latest archive reference summaries are local copy/download handoff actions and do not record a new audit event.

- [x] **Step 2: Run verification**

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
npm run build
npm test
```

Verification results:

- RED verification: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` failed before implementation because `fileName/copyText` and UI callbacks were absent.
- `git diff --check` passed.
- `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` passed: 2 files, 554 tests.
- `npm run build` passed.
- `npm test` passed: Python 352 tests and web 810 tests.

- [x] **Step 3: Commit**

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/terminal-workbench.ts docs/product-plan.md docs/superpowers/plans/2026-07-07-stage1-archive-reference-summary.md
git commit -m "feat: export stage1 archive reference summary"
```
