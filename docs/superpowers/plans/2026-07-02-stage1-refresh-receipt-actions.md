# Stage 1 Refresh Receipt Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Stage 1/P0 refresh receipt copyable and actionable so personal users and small teams can share the exact self-check outcome and jump to the next affected workspace.

**Architecture:** Extend the existing pure `buildStage1P0DailyUseRefreshOutcome` model with a deterministic `copyText` receipt. The homepage keeps using the local-only refresh outcome state, adds a clipboard action, and exposes the model's `targetWorkspaceId` as an "open next step" button. No backend, audit ledger, broker, Docker, or desktop build behavior changes.

**Tech Stack:** React/TypeScript model helpers, Vitest model tests, Vitest source-contract layout tests, CSS, README and product-plan docs.

---

### Task 1: Copyable Receipt Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing model tests**

Update the existing Stage 1 daily-use refresh outcome tests to assert:
- `outcome.copyText` starts with `# Stage 1 Daily Self-Check Receipt`;
- it includes `State: ready` or `State: blocked`;
- it includes all three entries with status and source;
- it includes `Next action: <actionLabel> -> <targetWorkspaceId>`;
- it includes `Live trading remains blocked.`

- [x] **Step 2: Run RED model tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1 daily-use refresh outcome"
```

Expected: fail because `copyText` is not yet produced.

- [x] **Step 3: Implement copy text**

Add `copyText: string` to `Stage1P0DailyUseRefreshOutcome`.

Create a helper that formats:

```markdown
# Stage 1 Daily Self-Check Receipt
State: <state>
Ready: <readyCount>/<totalCount>
Next action: <actionLabel> -> <targetWorkspaceId>

- Daily report [<status>/<source>]: <detail>
- Bootstrap preflight [<status>/<source>]: <detail>
- Desktop release [<status>/<source>]: <detail>

Live trading remains blocked.
```

- [x] **Step 4: Run GREEN model tests**

Run the same targeted model test.

### Task 2: Homepage Receipt Actions

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write the failing App source-contract test**

Extend the Stage 1/P0 daily-use layout test to assert:
- `const [copiedStage1P0DailyUseRefreshOutcome, setCopiedStage1P0DailyUseRefreshOutcome]`;
- `const copyStage1P0DailyUseRefreshOutcome = useCallback`;
- `navigator.clipboard.writeText(stage1P0DailyUseRefreshOutcome.copyText)`;
- `onCopyRefreshOutcome={() => void copyStage1P0DailyUseRefreshOutcome()}`;
- `isRefreshOutcomeCopied={copiedStage1P0DailyUseRefreshOutcome}`;
- `onSelectWorkspace(refreshOutcome.targetWorkspaceId)`;
- visible labels `复制回执` and `打开下一步`;
- CSS class `.stage1-p0-daily-use-refresh-outcome-actions`.

- [x] **Step 2: Run RED App contract test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: fail because the homepage has no receipt copy/next actions.

- [x] **Step 3: Implement homepage actions**

Add `copiedStage1P0DailyUseRefreshOutcome` state and `copyStage1P0DailyUseRefreshOutcome`. The copy handler should:
- no-op if no outcome exists;
- report a workspace error if clipboard is unavailable;
- copy `stage1P0DailyUseRefreshOutcome.copyText`;
- mark copied state true;
- update the workspace status label.

Pass `isRefreshOutcomeCopied` and `onCopyRefreshOutcome` into `Stage1P0DailyUseClosurePanel`.

Inside the receipt, render:
- `复制回执 / Copy receipt`;
- `打开下一步 / Open next step`, routed to `refreshOutcome.targetWorkspaceId`.

Add CSS for `.stage1-p0-daily-use-refresh-outcome-actions`.

- [x] **Step 4: Run GREEN App contract test**

Run the same targeted layout test.

### Task 3: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: this plan

- [x] **Step 1: Update docs**

Mention that refresh receipts can be copied for small-team handoff and include a next-step workspace action, without creating audit events or running extra commands.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1 daily-use refresh outcome"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-refresh-receipt-actions.md apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: add stage1 refresh receipt actions"
```
