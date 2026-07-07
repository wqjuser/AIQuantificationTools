# Stage 1 Archive Toolbar Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the latest `stage1_daily_archive_review` evidence in the Audit toolbar and local review bundle summary so personal/small-team operators can see archive coverage without opening individual rows.

**Architecture:** Reuse the Stage 1 archive ledger fields and query helpers added in the previous phase. Extend the Audit summary UI to show Stage 1 archive counts and latest archive focus/copy actions, and add model/source-contract tests that lock both the latest-local-review semantics and toolbar wiring.

**Tech Stack:** React/TypeScript, Vitest source-contract tests, existing Audit ledger summary helpers and local review bundle UI.

## Global Constraints

- `stage1_daily_archive_review` remains audit evidence only and must not become signing-eligible.
- Do not store or render Stage 1 archive Markdown body content in the ledger or toolbar.
- Toolbar actions only focus or copy existing Audit queries; they must not refresh Stage 1 evidence, generate archives, write audit events, run Docker, build desktop assets, connect brokers, or submit orders.
- Follow existing latest personal/team, Daily Ops, and Daily Start toolbar patterns.

---

### Task 1: Lock Toolbar and Latest-Bundle Contracts

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

**Interfaces:**
- Consumes: `buildAuditEvidenceReportLedgerRows`, `buildAuditEvidenceReportLedgerSummary`, `filterAuditEvidenceReportLedgerRows`
- Produces: failing tests for Stage 1 archive as latest local review and Audit toolbar Stage 1 archive controls.

- [x] **Step 1: Add failing model test for Stage 1 archive as latest local review**

Add a test where personal/team, Daily Ops, Daily Start, and Stage 1 archive rows are all ready, with the Stage 1 archive row having the newest `createdAt`.

Expected assertions:

```ts
expect(summary).toEqual(
  expect.objectContaining({
    localReviewBundleLatestEventId: "stage1-daily-archive-review-latest-9999999999999999",
    localReviewBundleLatestLabel: "latest local review · stage1 archive review",
    localReviewBundleLatestQuery: expect.stringContaining("stage1_daily_archive_review"),
    localReviewBundleLatestTitle: expect.stringContaining("Stage 1 archive review: ready 5/5"),
    latestStage1DailyArchiveReviewEventId: "stage1-daily-archive-review-latest-9999999999999999",
    latestStage1DailyArchiveReviewQuery: expect.stringContaining("stage1_daily_archive_review"),
    latestStage1DailyArchiveReviewTitle: expect.stringContaining("Archive body SHA-256")
  })
);
expect(filterAuditEvidenceReportLedgerRows(rows, summary.localReviewBundleLatestQuery).map((row) => row.id)).toEqual([
  "stage1-daily-archive-review-latest-9999999999999999"
]);
```

- [x] **Step 2: Add failing source-contract test for Audit toolbar Stage 1 archive block**

Extend the Audit ledger layout/source test to require:

```js
expect(reportLedgerPanelSource).toContain("summary.localReviewBundleStage1ArchiveCount");
expect(reportLedgerPanelSource).toContain("summary.latestStage1DailyArchiveReviewEventId");
expect(reportLedgerPanelSource).toContain("latestStage1DailyArchiveReviewShortHash");
expect(reportLedgerPanelSource).toContain("latestStage1DailyArchiveReviewLabel");
expect(reportLedgerPanelSource).toContain("latestStage1DailyArchiveReviewQuery");
expect(reportLedgerPanelSource).toContain("定位最新归档复核");
expect(reportLedgerPanelSource).toContain("Focus latest archive review");
expect(reportLedgerPanelSource).toContain("复制最新归档复核链接");
expect(reportLedgerPanelSource).toContain("Copy latest archive review link");
```

- [x] **Step 3: Run focused tests and verify failure**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
```

Observed before implementation: failed because the toolbar did not render latest Stage 1 archive controls and the Stage 1 archive title did not include the archive body hash.

### Task 2: Implement Audit Toolbar Readback

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Consumes: `AuditEvidenceReportLedgerSummary.latestStage1DailyArchiveReview*`
- Produces: toolbar latest archive readback block and local review bundle Stage 1 count display.

- [x] **Step 1: Include Stage 1 archive count in local review bundle toolbar summary**

Update the local review bundle summary small text to show `Stage 1 archive <count>` alongside personal/team, Daily Ops, and Daily Start counts.

- [x] **Step 2: Add latest Stage 1 archive toolbar block**

Render a sibling block after latest Daily Start review:

```tsx
{summary.latestStage1DailyArchiveReviewEventId ? (
  <span title={summary.latestStage1DailyArchiveReviewTitle || summary.latestStage1DailyArchiveReviewEventId}>
    {i18n.locale === "zh-CN" ? "最新归档复核" : "Latest archive review"}{" "}
    <strong>{summary.latestStage1DailyArchiveReviewShortHash || summary.latestStage1DailyArchiveReviewEventId}</strong>
    {summary.latestStage1DailyArchiveReviewLabel ? (
      <span className="audit-report-ledger-stage1-archive-review" title={summary.latestStage1DailyArchiveReviewTitle || summary.latestStage1DailyArchiveReviewQuery}>
        {summary.latestStage1DailyArchiveReviewLabel}
      </span>
    ) : null}
    {summary.latestStage1DailyArchiveReviewQuery ? (
      <button onClick={() => focusAuditReportQuery(summary.latestStage1DailyArchiveReviewQuery)} type="button">
        {i18n.locale === "zh-CN" ? "定位最新归档复核" : "Focus latest archive review"}
      </button>
    ) : null}
    {summary.latestStage1DailyArchiveReviewQuery ? (
      <button onClick={() => onCopyQueryLink(summary.latestStage1DailyArchiveReviewQuery)} type="button">
        {i18n.locale === "zh-CN" ? "复制最新归档复核链接" : "Copy latest archive review link"}
      </button>
    ) : null}
  </span>
) : null}
```

- [x] **Step 3: Keep styles on existing chip class**

Reuse `.audit-report-ledger-stage1-archive-review` instead of adding a new visual language unless the existing class is missing from grouped chip styles.

### Task 3: Document, Verify, and Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-07-stage1-archive-toolbar-readback.md`

- [x] **Step 1: Update docs**

Add a short note that Audit toolbar now exposes latest Stage 1 archive review and Stage 1 archive count in local review bundle coverage.

- [x] **Step 2: Run verification**

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
npm run build
npm test
```

- [ ] **Step 3: Commit**

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/terminal-workbench.ts docs/product-plan.md docs/superpowers/plans/2026-07-07-stage1-archive-toolbar-readback.md
git commit -m "feat: surface stage1 archive audit summary"
```

## Completion Notes

- Added a model test for Stage 1 archive rows becoming the latest local review and preserving archive body hash context in titles.
- Added Audit toolbar source-contract coverage for Stage 1 archive count, latest archive review summary, focus, and copy controls.
- Reused the existing Stage 1 archive chip styling; no new CSS was required.
- Verification so far:
  - `git diff --check` passed.
  - `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` passed after implementation.
  - `npm run build` passed with the existing Vite chunk-size warning.
  - `npm test` passed: Python 352 tests and web 810 tests.
