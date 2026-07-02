# Stage 1 Daily Handoff Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let personal users and small teams download the current Stage 1/P0 daily-use handoff Markdown from the homepage.

**Architecture:** Reuse the existing `stage1P0DailyUseClosure.copyText` model output and add a browser-only download action beside the existing copy/refresh/open actions. The action creates a temporary Markdown `Blob`, clicks an anchor with a stable filename, cleans up the object URL, and only updates local UI status. No backend, audit ledger, Docker, desktop build, broker, or order behavior changes.

**Tech Stack:** React, TypeScript, Vitest source-contract test, existing CSS button styling.

---

### Task 1: Homepage Download Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write the failing App contract test**

Extend the Stage 1/P0 daily-use layout test with these assertions:

```js
expect(appSource).toContain("const downloadStage1P0DailyUseHandoff = useCallback");
expect(appSource).toContain('new Blob([stage1P0DailyUseClosure.copyText], { type: "text/markdown;charset=utf-8" })');
expect(appSource).toContain('anchor.download = "stage1-p0-daily-use-handoff.md";');
expect(appSource).toContain("Stage 1 daily handoff download failed");
expect(appSource).toContain("onDownloadHandoff={downloadStage1P0DailyUseHandoff}");
expect(appSource).toContain("下载日常手册");
expect(appSource).toContain("Download handoff");
expect(cssBlock(".stage1-p0-daily-use-download")).toContain("border: 1px solid rgba(148, 163, 184, 0.28);");
```

- [x] **Step 2: Run RED App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: FAIL because the download callback, props, labels, filename, and CSS are missing.

- [x] **Step 3: Implement homepage download action**

Add this callback near the Stage 1/P0 handoff copy callback:

```ts
const downloadStage1P0DailyUseHandoff = useCallback(() => {
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(
      new Blob([stage1P0DailyUseClosure.copyText], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "stage1-p0-daily-use-handoff.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Stage 1 daily handoff download ready",
      error: undefined
    }));
  } catch (downloadError) {
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Stage 1 daily handoff download failed",
      error: downloadError instanceof Error ? downloadError.message : "Handoff download failed"
    }));
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}, [stage1P0DailyUseClosure.copyText]);
```

Pass `onDownloadHandoff={downloadStage1P0DailyUseHandoff}` into `Stage1P0DailyUseClosurePanel`.

Extend panel props with:

```ts
onDownloadHandoff?: () => void;
```

Add a footer button:

```tsx
<button
  className="stage1-p0-daily-use-download"
  disabled={!onDownloadHandoff}
  onClick={onDownloadHandoff}
  type="button"
>
  <Download size={12} />
  {i18n.locale === "zh-CN" ? "下载日常手册" : "Download handoff"}
</button>
```

Add CSS:

```css
.stage1-p0-daily-use-download {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: #172437;
  color: #dce6ee;
}
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
- Modify: `docs/superpowers/plans/2026-07-02-stage1-daily-handoff-download.md`

- [x] **Step 1: Update docs**

Mention that Stage 1/P0 daily-use handoff can be copied or downloaded as Markdown, and downloading is a browser-only local file action that does not run checks or write audit events.

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
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-daily-handoff-download.md apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js
git commit -m "feat: download stage1 daily handoff"
```
