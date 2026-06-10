# Stage 1 Preparation Evidence Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the locked watchlist cache refresh evidence visible in the audited research surfaces that users actually inspect.

**Architecture:** The backend already stores `researchRun.dataSnapshot.preparationEvidence`; this change keeps that schema intact and adds deterministic presentation helpers in the frontend model layer. Export preview, AI review anchors, and Backtest Markdown report should all reference the same evidence path so replay packages can be audited without opening raw JSON.

**Tech Stack:** React/TypeScript frontend model helpers in `apps/web/src/lib/terminal-workbench.ts`, Vitest tests in `apps/web/src/lib/terminal-workbench.test.ts`, product tracking in `docs/product-plan.md`.

---

### Task 1: Export Preview Row

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Write the failing test**

Add `dataSnapshot.preparationEvidence` to the existing export preview fixture and assert that `buildResearchRunExportPreviewRows` contains a `preparation-evidence` row with `exportPath: "researchRun.dataSnapshot.preparationEvidence"` and a searchable watchlist refresh run id.

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "reproducible research run export preview"`

Expected: FAIL because no `preparation-evidence` row exists.

- [x] **Step 3: Write minimal implementation**

Add a compact formatter for `ResearchRunDataPreparationEvidence` and insert a `preparation-evidence` row after `data-snapshot`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "reproducible research run export preview"`

Expected: PASS.

### Task 2: AI Evidence Anchors

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Write the failing test**

Add `dataSnapshot.preparationEvidence` to the AI review run record fixture and assert that `record.evidenceAnchors` includes a `data-preparation` anchor with the watchlist refresh run id and export path.

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "structured AI review run record"`

Expected: FAIL because AI evidence anchors only include run, strategy, data hash, citations, committee, decision log, and boundary.

- [x] **Step 3: Write minimal implementation**

Extend `buildAiReviewEvidenceAnchors` to append the preparation evidence anchor when the run snapshot contains locked preparation evidence.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "structured AI review run record"`

Expected: PASS.

### Task 3: Backtest Markdown Report

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Write the failing test**

Add preparation evidence to the audited backtest markdown fixture and assert that the generated `## Data Snapshot` table includes the locked watchlist refresh run id and row count.

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "portable markdown report from audited backtest evidence"`

Expected: FAIL because the markdown only lists source, rows, hash, window, and quality.

- [x] **Step 3: Write minimal implementation**

Add a `Preparation evidence` row to the data snapshot table using the same formatter.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "portable markdown report from audited backtest evidence"`

Expected: PASS.

### Task 4: Documentation and Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-10-stage1-preparation-evidence-visibility.md`

- [x] **Step 1: Update product plan**

Record that locked preparation evidence is now surfaced in export preview, AI evidence anchors, and Backtest Markdown.

- [x] **Step 2: Run targeted and full checks**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
```

Expected: PASS.

- [x] **Step 3: Docker/browser smoke**

Rebuild/restart Docker services and open the app on `http://127.0.0.1:5173/?workspace=research` to confirm the frontend loads without console errors.

- [ ] **Step 4: Commit and push**

Commit code and docs separately if the implementation and plan-update split stays clean; push `codex/p0-product-workspaces` via `127.0.0.1:7890`.
