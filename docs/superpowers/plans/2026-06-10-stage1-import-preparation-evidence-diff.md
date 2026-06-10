# Stage 1 Import Preparation Evidence Diff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make imported research packages compare locked data preparation evidence during import/replay preflight.

**Architecture:** Keep `researchRun.dataSnapshot.preparationEvidence` as the source of truth. Add one import diff row immediately after `data-snapshot`, compare current and incoming preparation evidence by run id, source, completeness, and cached row count, and expose the row through the existing import diff search and localized UI label path.

**Tech Stack:** TypeScript model helpers in `apps/web/src/lib/terminal-workbench.ts`, React UI label map in `apps/web/src/App.tsx`, Vitest coverage in `apps/web/src/lib/terminal-workbench.test.ts`, product tracking in `docs/product-plan.md`.

---

### Task 1: Import Diff Row

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Write the failing test**

Extend the existing import diff fixture with current and incoming `dataSnapshot.preparationEvidence`, then assert a `preparation-evidence` diff row with `exportPath: "researchRun.dataSnapshot.preparationEvidence"` and a searchable incoming refresh run id.

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research run import diff"`

Expected: FAIL because import diff rows do not include preparation evidence yet.

- [x] **Step 3: Implement minimal model/UI changes**

Add `preparation-evidence` to `ResearchRunImportDiffRow["id"]`, insert a row after `data-snapshot`, reuse `formatPreparationEvidenceDetail`, and add the Chinese UI label.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research run import diff"`

Expected: PASS.

### Task 2: Verification and Documentation

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-10-stage1-import-preparation-evidence-diff.md`

- [x] **Step 1: Update product plan**

Record that import preflight now compares locked preparation evidence rather than only data snapshot hash/rows.

- [x] **Step 2: Run verification**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
```

Expected: PASS.

- [x] **Step 3: Docker/browser smoke**

Rebuild/restart Docker services and load `http://127.0.0.1:5173/?workspace=audit` without console errors.

- [ ] **Step 4: Commit and push**

Commit implementation and docs, then push `codex/p0-product-workspaces` through `127.0.0.1:7890`.
