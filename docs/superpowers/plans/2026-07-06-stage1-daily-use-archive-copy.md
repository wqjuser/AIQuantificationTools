# Stage 1/P0 Daily Use Archive Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a clipboard copy action for the existing Stage 1/P0 daily-use archive so operators can either download a Markdown file or paste the full archive into chat/docs.

**Architecture:** Reuse the existing `buildStage1P0DailyUseArchiveText` React callback and `buildStage1P0DailyUseArchiveCopyText` model helper. The homepage will add copied-state tracking, a clipboard callback, prop wiring into `Stage1P0DailyUseClosurePanel`, and a footer button that mirrors the existing copy/download status patterns.

**Tech Stack:** React hooks, TypeScript, Vitest source-contract tests, existing workspace status feedback.

---

### Task 1: Homepage Copy Wiring

**Files:**
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/layout-css.test.js`

- [ ] **Step 1: Write the failing source-contract test**

Extend the Stage 1/P0 daily-use layout test to require:
- `const [copiedStage1P0DailyUseArchive, setCopiedStage1P0DailyUseArchive]`
- reset effect `setCopiedStage1P0DailyUseArchive(false);`
- `const copyStage1P0DailyUseArchive = useCallback`
- `const archiveCopyText = buildStage1P0DailyUseArchiveText();`
- `navigator.clipboard.writeText(archiveCopyText)`
- `Stage 1 daily-use archive copied`
- `Stage 1 daily-use archive copy failed`
- `isArchiveCopied={copiedStage1P0DailyUseArchive}`
- `onCopyArchive={() => void copyStage1P0DailyUseArchive()}`
- `isArchiveCopied?: boolean;`
- `onCopyArchive?: () => void;`
- `复制归档包`
- `Copy archive`

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because archive copy state and wiring do not exist.

- [ ] **Step 3: Implement the copy action**

Add the copied-state hook, reset effect keyed to `buildStage1P0DailyUseArchiveText`, clipboard callback, panel prop wiring, typed props, and footer button. The callback must reuse `buildStage1P0DailyUseArchiveText()` and set workspace status labels for success/failure without triggering navigation, refresh, audit writes, or downloads.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: PASS.

### Task 2: Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [ ] **Step 1: Update docs**

Document that the Stage 1/P0 daily-use archive can now be copied or downloaded and that both actions only expose current local/front-end state.

- [ ] **Step 2: Full verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I --max-time 5 "http://127.0.0.1:5174/?workspace=research&stage1RefreshReceiptFocus=next"
```

If the curl smoke fails because no dev server is listening on 5174, start `npm run dev --workspace @aiqt/web -- --host 127.0.0.1 --port 5174`, rerun curl, then stop the temporary server.

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-daily-use-archive-copy.md
git commit -m "feat: copy stage1 daily archive"
```
