# Stage 1/P0 Archive Audit Ledger Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote `stage1_daily_archive_review` from a saved generic audit event into a first-class Audit ledger row and homepage reference that personal/small-team daily workflows can locate and verify.

**Architecture:** Extend `terminal-workbench` ledger parsing so Stage 1 archive audit events expose structured row fields, label/query/title helpers, search tokens, latest summary fields, and local review bundle coverage membership. Add a Stage 1 archive review reference builder that compares the latest ledger row with the current daily-use closure/share/refresh context, then render that reference below the Stage 1/P0 daily-use card with focus/copy actions.

**Tech Stack:** TypeScript model helpers, React hooks, Vitest model/source-contract tests, existing Audit ledger search and local review bundle mechanics.

## Global Constraints

- Stage 1 archive audit rows must remain audit evidence only and must not become signing-eligible.
- Stage 1 archive ledger parsing must not store or reconstruct archive Markdown body content.
- Homepage actions must only navigate/copy/focus existing Audit queries; they must not refresh Stage 1 evidence, run Docker, build desktop assets, connect brokers, or submit orders.
- Follow existing `personal_team_readiness_review`, `daily_ops_control_room_review`, and `daily_start_brief_review` ledger patterns.

---

### Task 1: Lock Stage 1 Archive Ledger Contracts

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

**Interfaces:**
- Consumes: `stage1_daily_archive_review` metadata from `buildStage1P0DailyUseArchiveReviewAuditEvent`.
- Produces: failing tests for `buildAuditEvidenceReportLedgerRows`, `buildAuditEvidenceReportLedgerSummary`, `filterAuditEvidenceReportLedgerRows`, and `Stage1P0DailyUseClosurePanel` reference wiring.

- [x] **Step 1: Add failing ledger row test**

Add a model test that builds one `stage1_daily_archive_review` event and asserts:

```ts
const rows = buildAuditEvidenceReportLedgerRows([event]);
expect(rows[0]).toMatchObject({
  artifactKind: "aiqt.stage1P0DailyUseArchiveReview",
  reportKind: "stage1_daily_archive_review",
  stage1DailyArchiveReviewArchiveBodySha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  stage1DailyArchiveReviewState: "blocked",
  stage1DailyArchiveReviewReadyCount: 1,
  stage1DailyArchiveReviewTotalCount: 2,
  stage1DailyArchiveReviewPrimaryActionLabel: "Open research entry",
  statusLabel: "Stage 1 daily-use archive review hash recorded",
  localReviewBundleContextLabel: "local review bundle · stage1 archive review"
});
expect(buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery(rows[0])).toContain("stage1_daily_archive_review");
expect(filterAuditEvidenceReportLedgerRows(rows, "stage1_daily_archive_review research-entry invalid-workspace").map((row) => row.id)).toEqual([event.eventId]);
```

- [x] **Step 2: Add failing local review bundle coverage test**

Add a model test with personal/team, Daily Ops, Daily Start, and Stage 1 archive review rows. Assert the summary includes:

```ts
localReviewBundleCoverageLabel: "local review bundle complete · personal/team 1 · daily ops 1 · daily start 1 · stage1 archive 1",
localReviewBundleStage1ArchiveCount: 1,
latestStage1DailyArchiveReviewEventId: "stage1-daily-archive-review-aaaaaaaaaaaaaaaa",
latestStage1DailyArchiveReviewQuery: expect.stringContaining("stage1_daily_archive_review")
```

Also add a gap test where Stage 1 archive is missing and the next action query contains `record-stage1-archive-review` and `local-review-bundle-stage1-archive-missing`.

- [x] **Step 3: Add failing homepage source-contract test**

Extend the Stage 1/P0 layout test to require:

```js
expect(appSource).toContain("buildStage1P0DailyUseArchiveReviewReference({");
expect(appSource).toContain("stage1P0DailyUseArchiveReviewReference");
expect(appSource).toContain("openStage1P0DailyUseArchiveReviewInAudit");
expect(appSource).toContain("copyStage1P0DailyUseArchiveReviewAuditLink");
expect(appSource).toContain("stage1P0DailyUseArchiveReviewReferenceLabel");
expect(appSource).toContain("stage1P0DailyUseArchiveReviewReferenceDetail");
expect(appSource).toContain("最新归档入账");
expect(appSource).toContain("Latest archive record");
```

- [x] **Step 4: Run focused tests and verify failure**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1 daily archive review ledger"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected before implementation: fail because Stage 1 archive ledger parsing/reference rendering was not implemented. Final verification uses the full focused files below.

### Task 2: Implement Ledger Row Parsing and Summary Readback

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Produces:
  - `buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel(row)`
  - `buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle(row)`
  - `buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery(row)`
  - `buildStage1P0DailyUseArchiveReviewReference({ closure, invalidShareStatus, ledgerRows, refreshOutcome, shareDeepLinkState })`

- [x] **Step 1: Add ledger fields and row parsing**

Add Stage 1 archive fields to `AuditEvidenceReportLedgerRow`, include `stage1_daily_archive_review` in report-kind unions, filter clauses, fallback artifact kind, fallback status label, package counts, non-signing exclusions, search text, and local review bundle context.

- [x] **Step 2: Add label/query/title helpers**

Implement the three Stage 1 helper functions with query tokens for event id, short hash, state, ready/total, primary action, row ids/statuses, share context, invalid share status, refresh outcome state, and body hash prefix.

- [x] **Step 3: Extend local review bundle coverage**

Add `stage1ArchiveCount` to local review bundle coverage labels, titles, complete criteria, gap tokens, latest row selection, summary fields, and row context marking.

- [x] **Step 4: Add Stage 1 archive reference builder**

Implement a reference builder that returns `current`, `stale`, or `missing` by comparing the latest ready Stage 1 archive ledger row with the current closure row ids/statuses, ready/total, primary action, refresh outcome state, share context, and invalid share status.

- [x] **Step 5: Render homepage reference**

Compute `stage1P0DailyUseArchiveReviewReference` in `App`, add open/copy callbacks, pass it into `Stage1P0DailyUseClosurePanel`, and render a compact reference block under the footer actions.

### Task 3: Verify, Document, and Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-07-stage1-archive-audit-ledger-readback.md`

- [x] **Step 1: Run focused verification**

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
```

- [x] **Step 2: Run full verification**

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
npm run build
npm test
```

- [x] **Step 3: Update docs**

Add a short README/product-plan note explaining that Stage 1 archive audit rows are searchable in Audit, included in local review bundle coverage, and visible as the latest archive record on the daily-use card.

- [ ] **Step 4: Commit**

```bash
git add README.md apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/terminal-workbench.ts docs/product-plan.md docs/superpowers/plans/2026-07-07-stage1-archive-audit-ledger-readback.md
git commit -m "feat: read back stage1 archive audit"
```

## Completion Notes

- Implemented first-class `stage1_daily_archive_review` ledger row parsing, search, labels, titles, local review bundle coverage, non-signing treatment, latest summary fields, and Stage 1 homepage readback reference.
- Added homepage “最新归档入账 / Latest archive record” reference with focus/copy actions and compact current/stale/missing states.
- Updated README and product plan with the Stage 1 archive Audit readback behavior and safety boundary.
- Verification:
  - `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` passed.
  - `npm run build` passed with the existing Vite chunk-size warning.
  - `npm test` passed.
