# Personal Team Readiness Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Turn the homepage personal/small-team readiness summary into a portable, auditable review artifact.

**Architecture:** Reuse the existing report pattern: `terminal-workbench` owns the summary and Markdown text, `terminal-api` owns the hash-only audit event, and `App.tsx` wires copy/download/record actions into the existing readiness card. The review remains local evidence only and never changes paper-only/live-blocked execution flags.

**Tech Stack:** React, TypeScript, Vitest, existing `saveAuditEvent` API contract, local audit ledger metadata.

---

### Task 1: Model And Markdown

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Write failing tests**

Add tests near the personal/small-team readiness summary tests:

```ts
test("builds a portable personal and team readiness review markdown", () => {
  const summary = buildPersonalTeamUsabilityReadinessSummary({
    auditEvidenceReportLedgerSummary: auditEvidenceReportLedgerSummaryFixture({
      latestAuditAidEventId: "audit-aid-ready"
    }),
    handoffNoteCount: 2,
    p0AcceptanceSummary: p0AcceptanceSummaryFixture(),
    p0PlatformReadinessSummary: p0PlatformReadinessSummaryFixture(),
    p1AcceptanceSummary: p1AcceptanceSummaryFixture(),
    p2ManifestChainPreflightSummary: p2ManifestChainPreflightSummaryFixture(),
    p2ReadinessAcceptanceSummary: p2ReadinessAcceptanceSummaryFixture(),
    p2ReadinessEvidenceCoverage: p2ReadinessEvidenceCoverageFixture()
  });

  const markdown = buildPersonalTeamUsabilityReadinessReviewMarkdown({ summary });

  expect(markdown).toContain("# Personal And Small-Team Readiness Review");
  expect(markdown).toContain("- State: ready");
  expect(markdown).toContain("- Personal readiness: 100%");
  expect(markdown).toContain("- Team readiness: 100%");
  expect(markdown).toContain("- p0-local-loop: ready");
  expect(markdown).toContain("- team-handoff-runbook: ready");
  expect(markdown).toContain("- Platform decision: live trading and real order routing remain blocked.");
});
```

- [x] **Step 2: Verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "personal and team readiness review markdown"
```

Expected: FAIL because `buildPersonalTeamUsabilityReadinessReviewMarkdown` is not exported.

- [x] **Step 3: Implement Markdown builder**

Add `buildPersonalTeamUsabilityReadinessReviewMarkdown({ summary })` to `terminal-workbench.ts`. It should include summary state, headline, detail, personal/team percentages, ready/total counts, open item ids, all readiness rows, next action, and explicit live-blocked boundary.

- [x] **Step 4: Verify GREEN**

Run the same focused test. Expected: PASS.

### Task 2: Audit Event

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] **Step 1: Write failing audit-event test**

Add a test near other report audit-event tests:

```ts
test("builds a personal and team readiness review audit event without storing markdown", async () => {
  const summary = buildPersonalTeamUsabilityReadinessSummary({
    auditEvidenceReportLedgerSummary: auditEvidenceReportLedgerSummaryFixture({
      latestAuditAidEventId: "audit-aid-ready"
    }),
    handoffNoteCount: 2,
    p0AcceptanceSummary: p0AcceptanceSummaryFixture(),
    p0PlatformReadinessSummary: p0PlatformReadinessSummaryFixture(),
    p1AcceptanceSummary: p1AcceptanceSummaryFixture(),
    p2ManifestChainPreflightSummary: p2ManifestChainPreflightSummaryFixture(),
    p2ReadinessAcceptanceSummary: p2ReadinessAcceptanceSummaryFixture(),
    p2ReadinessEvidenceCoverage: p2ReadinessEvidenceCoverageFixture()
  });
  const markdown = buildPersonalTeamUsabilityReadinessReviewMarkdown({ summary });

  const event = await buildPersonalTeamUsabilityReadinessReviewAuditEvent({
    generatedAt: "2026-06-28T09:00:00.000Z",
    markdown,
    summary
  });

  expect(event).toMatchObject({
    schemaVersion: 1,
    eventType: "personal_team_readiness_review",
    runId: "personal-team-readiness",
    createdAt: "2026-06-28T09:00:00.000Z",
    stage: "ready",
    source: "web",
    summary: "Personal and small-team readiness review recorded",
    metadata: {
      artifactKind: "aiqt.personalTeamReadinessReview",
      fileName: "personal-team-readiness-review.md",
      format: "text/markdown",
      contentSha256Algorithm: "sha256",
      state: "ready",
      personalPercent: 100,
      teamPercent: 100,
      readyCount: 6,
      totalCount: 6,
      openItemIds: [],
      itemIds: [
        "p0-local-loop",
        "p1-research-ops",
        "p2-prelive-chain",
        "audit-traceability",
        "team-handoff-runbook",
        "backup-restore-drill"
      ],
      itemStatuses: ["ready", "ready", "ready", "ready", "ready", "ready"],
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true
    }
  });
  expect(String(event.metadata.contentSha256)).toHaveLength(64);
  expect(event.detail).toContain("personal-team-readiness-review.md");
  expect(event.detail).toContain("ready 6/6 gates");
  expect(event.detail).toContain("live blocked true");
  expect(event.detail).not.toContain(markdown);
});
```

- [x] **Step 2: Verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "personal and team readiness review audit event"
```

Expected: FAIL because the audit-event builder is missing.

- [x] **Step 3: Implement audit-event builder**

Add `buildPersonalTeamUsabilityReadinessReviewAuditEvent` to `terminal-api.ts`, mirroring P2 evidence coverage review. Store only hash and structured metadata, not Markdown body.

- [x] **Step 4: Verify GREEN**

Run the same focused test. Expected: PASS.

### Task 3: Homepage Actions

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add UI expectation**

Extend the existing layout smoke around the homepage readiness card or add a targeted assertion that the card exposes Copy, Download, and Record review actions.

- [x] **Step 2: Verify RED**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "personal"
```

Expected: FAIL until the actions are rendered.

- [x] **Step 3: Wire App actions**

Import both new builders, create memoized Markdown, add copy/download/record callbacks, and render three compact buttons inside the existing readiness card. Recording should call `saveAuditEvent`, merge the returned event into `auditEvidenceReportEvents`, and leave all live-routing flags unchanged.

- [x] **Step 4: Verify GREEN**

Run the same focused layout test. Expected: PASS.

### Task 4: Documentation And Full Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Document the new review artifact**

Update README and product plan with Batch 66, noting that the readiness review is local audit evidence only.

- [x] **Step 2: Run focused tests**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "personal"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "personal and team readiness review audit event"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "personal"
```

- [x] **Step 3: Run full verification**

Run:

```bash
npm run test --workspace @aiqt/web
npm run build
npm test
git diff --check
```

- [x] **Step 4: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-06-28-personal-team-readiness-review.md apps/web/src/App.tsx apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/layout-css.test.js
git commit -m "feat: record personal team readiness reviews"
```
