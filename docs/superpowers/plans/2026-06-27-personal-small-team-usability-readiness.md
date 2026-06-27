# Personal Small-Team Usability Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface a product-facing answer for "how close is this to personal use and small-team use?" from the existing P0/P1/P2/audit readiness evidence.

**Architecture:** Add a read-only summary builder in `apps/web/src/lib/terminal-workbench.ts` that composes existing P0/P1/P2/audit summaries into personal/local paper-only and small-team/internal-beta readiness percentages. Render the summary inside the existing first-screen readiness card in `apps/web/src/App.tsx`, using existing compact card patterns and styles from `apps/web/src/styles.css`.

**Tech Stack:** React 19, TypeScript, Vitest, Vite, existing local-first AIQuant terminal model helpers.

---

### Task 1: Readiness Summary Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [ ] **Step 1: Write the failing test**

Add a test near the existing P2 readiness tests:

```ts
test("summarizes personal and small-team usability readiness from accepted evidence", () => {
  const summary = buildPersonalTeamUsabilityReadinessSummary({
    auditEvidenceReportLedgerSummary: auditEvidenceReportLedgerSummaryFixture({
      latestAuditAidEventId: "audit-aid-ready"
    }),
    p0AcceptanceSummary: p0AcceptanceSummaryFixture(),
    p0PlatformReadinessSummary: p0PlatformReadinessSummaryFixture(),
    p1AcceptanceSummary: p1AcceptanceSummaryFixture(),
    p2ManifestChainPreflightSummary: p2ManifestChainPreflightSummaryFixture(),
    p2ReadinessAcceptanceSummary: p2ReadinessAcceptanceSummaryFixture(),
    p2ReadinessEvidenceCoverage: p2ReadinessEvidenceCoverageFixture()
  });

  expect(summary).toMatchObject({
    state: "attention",
    tone: "warning",
    personalPercent: 100,
    teamPercent: 67,
    readyCount: 4,
    totalCount: 6,
    nextActionWorkspaceId: "audit",
    liveBoundaryLabel: "Paper-only · live blocked · no order submission"
  });
  expect(summary.openItems.map((item) => item.id)).toEqual(["team-handoff-runbook", "backup-restore-drill"]);
});
```

- [ ] **Step 2: Verify the test fails**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "summarizes personal and small-team usability readiness"
```

Expected: FAIL because `buildPersonalTeamUsabilityReadinessSummary` is not exported yet.

- [ ] **Step 3: Add the minimal model implementation**

Add exported types for:

```ts
export type PersonalTeamUsabilityReadinessState = "ready" | "attention" | "blocked";
export type PersonalTeamUsabilityReadinessTone = "positive" | "warning" | "risk";
export type PersonalTeamUsabilityReadinessItemStatus = "ready" | "review" | "blocked";
```

Implement `buildPersonalTeamUsabilityReadinessSummary(input)` with six rows:

```ts
[
  "p0-local-loop",
  "p1-research-ops",
  "p2-prelive-chain",
  "audit-traceability",
  "team-handoff-runbook",
  "backup-restore-drill"
]
```

Use existing statuses as inputs: P0 platform/acceptance, P1 acceptance, P2 manifest-chain plus readiness acceptance plus evidence coverage, and latest audit-aid event. Keep the last two rows in `review` until an explicit handoff runbook and backup/restore drill exists.

- [ ] **Step 4: Verify model test passes**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "summarizes personal and small-team usability readiness"
```

Expected: PASS.

### Task 2: First-Screen Readiness Panel

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write the failing layout test**

Add a layout-source test that checks:

```js
expect(appSource).toContain("buildPersonalTeamUsabilityReadinessSummary({");
expect(overviewSource).toContain("personalTeamUsabilityReadiness.personalPercent");
expect(overviewSource).toContain("personalTeamUsabilityReadiness.teamPercent");
expect(overviewSource).toContain("personalTeamUsabilityReadiness.openItems.slice(0, 3).map");
expect(overviewSource).toContain("selectProductWorkArea(item.targetWorkspaceId)");
expect(cssBlock(".personal-team-readiness")).toContain("display: grid;");
expect(cssBlock(".personal-team-readiness-open")).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
```

- [ ] **Step 2: Verify the layout test fails**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "personal and small-team usability readiness"
```

Expected: FAIL because the panel and CSS do not exist yet.

- [ ] **Step 3: Wire the summary into the overview**

Import `buildPersonalTeamUsabilityReadinessSummary`, compute `personalTeamUsabilityReadiness` after the P2 readiness summaries, and render a compact panel after the P1 acceptance card:

```tsx
<div className={`personal-team-readiness ${personalTeamUsabilityReadiness.state}`}>
  ...
</div>
```

Use existing `selectProductWorkArea(item.targetWorkspaceId)` behavior for gap buttons.

- [ ] **Step 4: Add compact CSS**

Add `.personal-team-readiness`, `.personal-team-readiness-score`, `.personal-team-readiness-open`, and `.personal-team-readiness-item` styles next to the existing P0/P1 summary CSS. Reuse the same border radius, dark surfaces, compact font sizes, and status colors.

- [ ] **Step 5: Verify layout test passes**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "personal and small-team usability readiness"
```

Expected: PASS.

### Task 3: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [ ] **Step 1: Update current-progress docs**

Document that the app now exposes a personal/small-team usability summary:

```md
- The first screen now aggregates P0/P1/P2/audit evidence into personal/local paper-only readiness and small-team/internal-beta gaps.
```

- [ ] **Step 2: Run focused and broad checks**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "personal and small-team usability readiness"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "personal and small-team usability readiness"
npm run build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit**

Run:

```bash
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/layout-css.test.js apps/web/src/App.tsx apps/web/src/styles.css README.md docs/product-plan.md docs/superpowers/plans/2026-06-27-personal-small-team-usability-readiness.md
git commit -m "feat: add personal team usability readiness"
```
