# Stage 1 Handoff Workspace Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic workspace deep links to Stage 1/P0 daily-use handoff and refresh receipt Markdown so personal and small-team handoffs can reopen the right frontend workspace directly.

**Architecture:** Keep this as a model-layer text enhancement in `apps/web/src/lib/terminal-workbench.ts`. Generate relative query links with the existing `workspace` URL parameter, append them to the existing `copyText`, and leave runtime button behavior unchanged. This remains frontend navigation only: no backend writes, no audit events, no Stage 1 command execution, no desktop build, no broker connection, no order submission.

**Tech Stack:** TypeScript model helpers, Vitest model tests, existing Stage 1/P0 daily-use copy/download flows.

---

### Task 1: Stage 1 Handoff Link Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Write the failing handoff/receipt copyText test**

Add assertions to the existing Stage 1/P0 daily-use closure and refresh receipt tests:

```ts
expect(closure.copyText).toContain("Primary link: ?workspace=audit");
expect(closure.copyText).toContain(
  "- Clean environment open [blocked]: Run npm run docker:smoke:p0 -- --no-build --down (link: ?workspace=audit)"
);
expect(closure.copyText).toContain(
  "- Desktop release [review]: Run npm run desktop:build (link: ?workspace=settings)"
);
expect(outcome.copyText).toContain("Next link: ?workspace=research");
expect(outcome.copyText).toContain(
  "- Daily report [ready/core]: Stage 1 daily report ready (5/5) (link: ?workspace=settings)"
);
expect(outcome.copyText).toContain(
  "- Desktop release [ready/core]: Desktop release passed (link: ?workspace=settings)"
);
expect(outcome.copyText).toContain("Next link: ?workspace=settings");
expect(outcome.copyText).toContain("- Daily report [blocked/fallback]: HTTP 500 (link: ?workspace=settings)");
```

- [x] **Step 2: Run RED model test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1"
```

Expected: FAIL because Stage 1 copyText does not yet include workspace links.

- [x] **Step 3: Implement deterministic workspace links**

Add a small helper:

```ts
function stage1P0DailyUseWorkspaceLink(workspaceId: ProductWorkAreaId): string {
  const params = new URLSearchParams({ workspace: workspaceId });
  return `?${params.toString()}`;
}
```

Update handoff copy text:

```ts
`Primary link: ${stage1P0DailyUseWorkspaceLink(primaryTargetWorkspaceId)}`,
...rows.map(
  (row) =>
    `- ${row.label} [${row.status}]: ${row.detail} (link: ${stage1P0DailyUseWorkspaceLink(row.targetWorkspaceId)})`
),
```

Update refresh receipt copy text:

```ts
`Next link: ${stage1P0DailyUseWorkspaceLink(targetWorkspaceId)}`,
...entries.map(
  (entry) =>
    `- ${entry.label} [${entry.status}/${entry.source}]: ${entry.detail} (link: ${stage1P0DailyUseWorkspaceLink(entry.targetWorkspaceId)})`
),
```

- [x] **Step 4: Run GREEN model test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1"
```

Expected: PASS.

### Task 2: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-handoff-workspace-links.md`

- [x] **Step 1: Update docs**

Mention that Stage 1/P0 daily handoff and refresh receipt Markdown now include relative `?workspace=...` links for frontend workspace recovery.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-handoff-workspace-links.md apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: add stage1 handoff workspace links"
```
