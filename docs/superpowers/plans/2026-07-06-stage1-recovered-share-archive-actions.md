# Stage 1/P0 Recovered Share Archive Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators copy or download the full Stage 1/P0 daily-use archive directly from the valid recovered share-link banner.

**Architecture:** Reuse the existing App-level daily-use archive callbacks and copied state in the recovered share banner. Keep the banner as a front-end-only recovery surface: it can focus the shared target, open the target workspace, copy the current archive, or download the current archive, but it does not refresh reports, run Stage 1 commands, write audit events, connect brokers, or submit orders.

**Tech Stack:** React App source, Vitest source-contract layout test, existing Markdown archive builder and browser Blob download flow.

---

### Task 1: Lock the recovered banner export contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add a recovered-banner source slice**

Add this source slice inside the `renders Stage 1/P0 daily-use closure before detailed readiness evidence` test, near the existing `overviewGridSource` checks:

```js
    const recoveredShareBannerSource = sourceBetweenText(
      overviewGridSource,
      "{initialStage1P0DailyUseShareDeepLinkState ? (",
      ") : null}\n              {!initialStage1P0DailyUseShareDeepLinkState &&"
    );
```

- [x] **Step 2: Assert archive copy/download actions inside the recovered banner**

Add these assertions after the existing recovered share banner expectations:

```js
    expect(recoveredShareBannerSource).toContain("onClick={() => void copyStage1P0DailyUseArchive()}");
    expect(recoveredShareBannerSource).toContain("copiedStage1P0DailyUseArchive");
    expect(recoveredShareBannerSource).toContain("归档包已复制");
    expect(recoveredShareBannerSource).toContain("Archive copied");
    expect(recoveredShareBannerSource).toContain("复制归档包");
    expect(recoveredShareBannerSource).toContain("Copy archive");
    expect(recoveredShareBannerSource).toContain("onClick={downloadStage1P0DailyUseArchive}");
    expect(recoveredShareBannerSource).toContain("下载归档包");
    expect(recoveredShareBannerSource).toContain("Download archive");
```

- [x] **Step 3: Run the focused test and verify it fails**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: one failure because the recovered share banner does not yet contain the archive actions.

### Task 2: Add recovered banner archive actions

**Files:**
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Render the copy archive action**

Insert this button in the recovered share banner action group after "Open shared workspace":

```tsx
                    <button onClick={() => void copyStage1P0DailyUseArchive()} type="button">
                      <Copy size={12} />
                      {copiedStage1P0DailyUseArchive
                        ? i18n.locale === "zh-CN"
                          ? "归档包已复制"
                          : "Archive copied"
                        : i18n.locale === "zh-CN"
                          ? "复制归档包"
                          : "Copy archive"}
                    </button>
```

- [x] **Step 2: Render the download archive action**

Add this button immediately after the copy archive action:

```tsx
                    <button onClick={downloadStage1P0DailyUseArchive} type="button">
                      <Download size={12} />
                      {i18n.locale === "zh-CN" ? "下载归档包" : "Download archive"}
                    </button>
```

- [x] **Step 3: Run the focused test and verify it passes**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: `1 passed`.

### Task 3: Document the recovered share path

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Update README**

In the Stage 1/P0 daily-use paragraph, change the recovered share banner sentence so it says the banner provides "查看日常卡片 / 打开分享工作区 / 复制或下载归档包" manual actions.

- [x] **Step 2: Update product plan**

Append a latest update explaining that valid recovered share banners can now export the full daily archive directly, and that this remains a local/front-end copy/download action only.

### Task 4: Verify and commit

**Files:**
- Modify: all files above

- [x] **Step 1: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I --max-time 5 "http://127.0.0.1:5174/?workspace=research&stage1DailyUseFocus=research-entry"
```

If the dev server is not already available on port 5174, start it temporarily with:

```bash
npm run dev --workspace @aiqt/web -- --host 127.0.0.1 --port 5174
```

- [x] **Step 2: Commit**

Run:

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-recovered-share-archive-actions.md
git commit -m "feat: export archive from recovered stage1 share"
```
