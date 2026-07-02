# Stage 1 Refresh Receipt Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let personal users and small teams download the latest Stage 1/P0 refresh receipt Markdown after running the homepage daily self-check.

**Architecture:** Reuse the existing `stage1P0DailyUseRefreshOutcome.copyText` receipt model and add a browser-only download action in the refresh receipt action row, beside copy and open-next-step. The action creates a temporary Markdown `Blob`, clicks an anchor with a stable filename, cleans up the object URL, and only updates local UI status. No backend, audit ledger, Stage 1 command, Docker, desktop build, broker, or order behavior changes.

**Tech Stack:** React, TypeScript, Vitest source-contract test, existing refresh receipt CSS action row.

---

### Task 1: Homepage Refresh Receipt Download

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Write the failing App contract test**

Extend the Stage 1/P0 daily-use layout test with these assertions:

```js
expect(appSource).toContain("const downloadStage1P0DailyUseRefreshOutcome = useCallback");
expect(appSource).toContain('new Blob([stage1P0DailyUseRefreshOutcome.copyText], { type: "text/markdown;charset=utf-8" })');
expect(appSource).toContain('anchor.download = "stage1-p0-daily-refresh-receipt.md";');
expect(appSource).toContain("Stage 1 refresh receipt download failed");
expect(appSource).toContain("onDownloadRefreshOutcome={downloadStage1P0DailyUseRefreshOutcome}");
expect(appSource).toContain("下载回执");
expect(appSource).toContain("Download receipt");
```

- [x] **Step 2: Run RED App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because the refresh receipt download callback, prop, filename, and labels are missing.

- [x] **Step 3: Implement refresh receipt download action**

Add this callback near `copyStage1P0DailyUseRefreshOutcome`:

```ts
const downloadStage1P0DailyUseRefreshOutcome = useCallback(() => {
  if (!stage1P0DailyUseRefreshOutcome) {
    return;
  }

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(
      new Blob([stage1P0DailyUseRefreshOutcome.copyText], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "stage1-p0-daily-refresh-receipt.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Stage 1 refresh receipt download ready",
      error: undefined
    }));
  } catch (downloadError) {
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Stage 1 refresh receipt download failed",
      error: downloadError instanceof Error ? downloadError.message : "Refresh receipt download failed"
    }));
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}, [stage1P0DailyUseRefreshOutcome]);
```

Pass `onDownloadRefreshOutcome={downloadStage1P0DailyUseRefreshOutcome}` into `Stage1P0DailyUseClosurePanel`.

Extend panel props with:

```ts
onDownloadRefreshOutcome?: () => void;
```

Add a button in `.stage1-p0-daily-use-refresh-outcome-actions`:

```tsx
<button disabled={!onDownloadRefreshOutcome} onClick={onDownloadRefreshOutcome} type="button">
  <Download size={12} />
  {i18n.locale === "zh-CN" ? "下载回执" : "Download receipt"}
</button>
```

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
- Modify: `docs/superpowers/plans/2026-07-02-stage1-refresh-receipt-download.md`

- [x] **Step 1: Update docs**

Mention that refresh receipts can now be copied or downloaded as Markdown, and downloading is a browser-only local file action that does not rerun checks or write audit events.

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
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-refresh-receipt-download.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js
git commit -m "feat: download stage1 refresh receipt"
```
