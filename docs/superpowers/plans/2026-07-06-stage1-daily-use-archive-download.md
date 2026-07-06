# Stage 1/P0 Daily Use Archive Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single downloadable Stage 1/P0 daily-use archive Markdown file that bundles the daily handoff, share links, refresh receipt, invalid-share diagnostics status, and live-blocked boundary.

**Architecture:** Keep archive composition in `apps/web/src/lib/terminal-workbench.ts` so copy/download content remains model-tested and independent of React. The homepage will pass existing closure, refresh outcome, resolved full share URLs, and optional invalid diagnostics text into the helper, then download `stage1-p0-daily-use-archive.md` through the same Blob/anchor pattern as the existing handoff, link bundle, and receipt downloads.

**Tech Stack:** TypeScript, React hooks, Vitest source/model tests, existing Markdown download helpers, local Vite dev server smoke.

---

### Task 1: Model Helper

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [ ] **Step 1: Write the failing model test**

Add a Vitest case near the existing share-link bundle test that imports and calls `buildStage1P0DailyUseArchiveCopyText`. Assert that the archive includes the daily handoff section, share-link bundle with full URLs, refresh receipt content, invalid-share diagnostics content, and `Live trading remains blocked.`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"`

Expected: FAIL because `buildStage1P0DailyUseArchiveCopyText` is not exported yet.

- [ ] **Step 3: Implement the helper**

Export `buildStage1P0DailyUseArchiveCopyText` from `terminal-workbench.ts`. It should call `buildStage1P0ShareLinkBundleCopyText`, include `closure.copyText`, include `refreshOutcome.copyText` when present, include a deterministic “not generated” line when absent, include invalid diagnostics text when present, include a deterministic “No invalid share link is active.” line when absent, and finish with `Live trading remains blocked.`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"`

Expected: PASS.

### Task 2: Homepage Download Action

**Files:**
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/layout-css.test.js`

- [ ] **Step 1: Write the failing source-contract test**

Extend the Stage 1/P0 daily-use layout test to require import/usage of `buildStage1P0DailyUseArchiveCopyText`, a `buildStage1P0DailyUseArchiveText` callback, a `downloadStage1P0DailyUseArchive` callback, the filename `stage1-p0-daily-use-archive.md`, status labels for ready/failed, prop wiring, and the bilingual labels `下载归档包` / `Download archive`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: FAIL because archive download wiring does not exist.

- [ ] **Step 3: Implement homepage wiring**

Import the helper, add `buildStage1P0InvalidShareDiagnosticsText` to share invalid diagnostics text between copy and archive, add `buildStage1P0DailyUseArchiveText`, add `downloadStage1P0DailyUseArchive`, pass it into `Stage1P0DailyUseClosurePanel`, extend the panel props, and add the footer button.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: PASS.

### Task 3: Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [ ] **Step 1: Update docs**

Document that the Stage 1/P0 daily-use archive can be downloaded locally and that it does not run Docker, smoke tests, desktop builds, audit writes, broker connections, or orders.

- [ ] **Step 2: Run full verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I --max-time 5 "http://127.0.0.1:5174/?workspace=research&stage1RefreshReceiptFocus=next"
```

Expected: diff check exits 0, all web tests pass, build exits 0, and the smoke URL returns HTTP 200.

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/terminal-workbench.ts docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-daily-use-archive-download.md
git commit -m "feat: download stage1 daily archive"
```
