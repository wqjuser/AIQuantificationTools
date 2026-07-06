# Stage 1/P0 Archive Suggested Filename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Include the deterministic Stage 1/P0 daily-use archive filename inside the archive Markdown and download status feedback.

**Architecture:** Reuse `buildStage1P0DailyUseArchiveFileName` inside `buildStage1P0DailyUseArchiveCopyText`. App passes the current share status into the archive builder so valid, invalid, and no-share contexts produce the same suggested filename in copied Markdown as the browser download filename.

**Tech Stack:** TypeScript model helper, React App callback wiring, Vitest model/source-contract tests, Markdown docs.

---

### Task 1: Lock the suggested filename contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Extend archive Markdown model expectations**

In `builds a Stage 1/P0 daily-use archive copy text`, pass:

```ts
      invalidShareStatus: {
        reason: null,
        state: null,
        status: "none"
      },
```

Assert:

```ts
    expect(copyText).toContain(
      "- Suggested file name: stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md"
    );
```

- [x] **Step 2: Extend App source-contract expectations**

In the Stage 1/P0 daily-use layout test, require:

```js
    expect(appSource).toContain("invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus");
    expect(appSource).toContain("statusLabel: `Stage 1 daily-use archive download ready · ${archiveFileName}`");
```

- [x] **Step 3: Run focused tests and verify failure**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both fail until the archive builder and App status are updated.

### Task 2: Implement suggested filename in archive copy text and App status

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Extend archive copy text inputs**

Add `invalidShareStatus = null` to `buildStage1P0DailyUseArchiveCopyText`, type it as `Stage1P0DailyUseShareDeepLinkStatus | null`, and compute:

```ts
  const suggestedFileName = buildStage1P0DailyUseArchiveFileName({
    closure,
    invalidShareStatus,
    shareDeepLinkState
  });
```

Add this line to the archive summary:

```ts
    `- Suggested file name: ${suggestedFileName}`,
```

- [x] **Step 2: Pass share status from App**

In `buildStage1P0DailyUseArchiveText`, pass:

```ts
        invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
```

- [x] **Step 3: Include filename in download status label**

In `downloadStage1P0DailyUseArchive`, change the success status to:

```ts
        statusLabel: `Stage 1 daily-use archive download ready · ${archiveFileName}`,
```

- [x] **Step 4: Run focused tests and verify pass**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both pass.

### Task 3: Document the copied Markdown filename behavior

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Update README**

Clarify that the archive Markdown itself includes the suggested deterministic filename, so copied archives retain the same naming hint as downloads.

- [x] **Step 2: Update product plan**

Append a latest update explaining that the archive summary now includes the suggested filename and download status echoes it, with no runtime side effects.

### Task 4: Verify and commit

**Files:**
- Modify: all files above

- [x] **Step 1: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I --max-time 5 "http://127.0.0.1:5174/?workspace=research&stage1DailyUseFocus=research-entry"
```

If port 5174 is not already serving the app, temporarily start:

```bash
npm run dev --workspace @aiqt/web -- --host 127.0.0.1 --port 5174
```

- [x] **Step 2: Commit**

Run:

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-archive-suggested-filename.md
git commit -m "feat: suggest stage1 archive filenames"
```
