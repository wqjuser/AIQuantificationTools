# Team Hardening Readiness Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the personal/team readiness card's two team-hardening gaps into evidence-driven states using local handoff notes and existing export/import restore checks.

**Architecture:** Extend the existing `P0AcceptanceSummary` and `P1AcceptanceSummary` models with an `importExportRoundTripReady` flag derived from archived acceptance check ids. Extend `buildPersonalTeamUsabilityReadinessSummary` with the current run's handoff note count so the team handoff row can close when a local handoff note exists, and close the backup/restore row when P0/P1 acceptance proves export, import, and imported-export checks. Keep the UI in the existing homepage readiness card and only update labels/actions to point users at Research for handoff and Audit for restore evidence.

**Tech Stack:** React 19, TypeScript, Vitest, Vite, existing AIQuant terminal model helpers.

---

### Task 1: Acceptance Round-Trip Evidence

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [ ] **Step 1: Write the failing test**

Add assertions to the existing P0/P1 acceptance summary tests:

```ts
expect(summary).toMatchObject({
  importExportRoundTripReady: true
});
```

Add invalid/missing assertions:

```ts
expect(missing.importExportRoundTripReady).toBe(false);
expect(invalid.importExportRoundTripReady).toBe(false);
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "acceptance summary"
```

Expected: FAIL because `importExportRoundTripReady` is not on the summary objects.

- [ ] **Step 3: Implement summary fields**

Add `importExportRoundTripReady: boolean` to `P0AcceptanceSummary` and `P1AcceptanceSummary`. In both builders, set it true only when:

```ts
acceptance.status === "passed" &&
acceptance.checkIds.includes("export") &&
acceptance.checkIds.includes("import") &&
acceptance.checkIds.includes("imported-export") &&
!acceptance.liveTradingAllowed &&
acceptance.liveBlockedBoundary
```

- [ ] **Step 4: Verify green**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "acceptance summary"
```

Expected: PASS.

### Task 2: Team Readiness Rows

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing readiness tests**

Add tests around `buildPersonalTeamUsabilityReadinessSummary`:

```ts
expect(
  buildPersonalTeamUsabilityReadinessSummary({
    ...acceptedInput,
    handoffNoteCount: 0
  }).openItems.map((item) => item.id)
).toEqual(["team-handoff-runbook"]);

expect(
  buildPersonalTeamUsabilityReadinessSummary({
    ...acceptedInput,
    handoffNoteCount: 2
  })
).toMatchObject({
  state: "ready",
  teamPercent: 100,
  readyCount: 6
});
```

- [ ] **Step 2: Run focused test and verify failure**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "personal and small-team usability readiness"
```

Expected: FAIL because `handoffNoteCount` is ignored and backup restore remains static review.

- [ ] **Step 3: Implement dynamic team rows**

Extend `PersonalTeamUsabilityReadinessSummaryInput`:

```ts
handoffNoteCount?: number;
```

Mark team rows:

```ts
const handoffReady = handoffNoteCount > 0;
const backupRestoreReady =
  p1AcceptanceSummary.importExportRoundTripReady || p0AcceptanceSummary.importExportRoundTripReady;
```

Use `targetWorkspaceId: "research"` for handoff, and `targetWorkspaceId: "audit"` for restore evidence.

- [ ] **Step 4: Wire App input**

Pass:

```ts
handoffNoteCount: handoffNotesState.pagination?.total ?? handoffNotesState.handoffNotes.length
```

to `buildPersonalTeamUsabilityReadinessSummary`.

- [ ] **Step 5: Verify green**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "personal and small-team usability readiness"
```

Expected: PASS.

### Task 3: Docs And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [ ] **Step 1: Update docs**

Document that the personal/team readiness summary now closes team-hardening rows from evidence:

```md
- Handoff readiness is driven by local handoff notes for the current audited run.
- Backup/restore readiness is driven by P0/P1 export-import round-trip acceptance checks.
```

- [ ] **Step 2: Run verification**

Run:

```bash
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "personal and small-team usability readiness"
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "acceptance summary"
npm run test --workspace @aiqt/web
npm run build
npm test
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-06-27-team-hardening-readiness-evidence.md apps/web/src/App.tsx apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: drive team readiness from local evidence"
```
