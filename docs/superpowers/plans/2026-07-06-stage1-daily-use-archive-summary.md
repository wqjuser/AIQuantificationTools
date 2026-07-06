# Stage 1/P0 Daily Use Archive Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make copied/downloaded Stage 1/P0 daily-use archives easier to triage by adding a deterministic summary and contents block before the detailed sections.

**Architecture:** Extend `buildStage1P0DailyUseArchiveCopyText` in the model layer only. The existing homepage copy/download actions already consume this helper, so both channels receive the summary without new React state, buttons, or navigation behavior.

**Tech Stack:** TypeScript model helper, Vitest model tests, existing React archive actions.

---

### Task 1: Archive Summary Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [ ] **Step 1: Write the failing test**

Extend `builds a Stage 1/P0 daily-use archive copy text` to assert:
- `Archive summary:`
- `- Daily state: blocked (1/2 ready)`
- `- Primary action: Fix clean open -> audit`
- `- Refresh receipt: ready`
- `- Invalid share diagnostics: included`
- `Archive contents:`
- `- Daily Handoff`
- `- Share Link Bundle`
- `- Refresh Receipt`
- `- Invalid Share Diagnostics`

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
```

Expected: FAIL because the archive helper does not emit a top summary or contents block yet.

- [ ] **Step 3: Implement the helper change**

Update `buildStage1P0DailyUseArchiveCopyText` to compute deterministic summary lines from `closure`, `refreshOutcome`, and `invalidShareDiagnosticsCopyText`. Place the summary and contents block after the H1 and before `## Daily Handoff`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use archive"
```

Expected: PASS.

### Task 2: Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [ ] **Step 1: Update docs**

Document that copied/downloaded archives now start with a summary and contents block for quick review, while still only exposing local/front-end state.

- [ ] **Step 2: Full verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I --max-time 5 "http://127.0.0.1:5174/?workspace=research&stage1RefreshReceiptFocus=next"
```

If no dev server is listening on 5174, start `npm run dev --workspace @aiqt/web -- --host 127.0.0.1 --port 5174`, rerun curl, then stop the temporary server.

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/terminal-workbench.ts docs/product-plan.md docs/superpowers/plans/2026-07-06-stage1-daily-use-archive-summary.md
git commit -m "feat: summarize stage1 daily archive"
```
