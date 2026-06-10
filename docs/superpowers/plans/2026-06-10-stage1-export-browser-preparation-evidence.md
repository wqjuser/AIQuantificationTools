# Stage 1 Export Browser Preparation Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show locked data preparation evidence inside the export package browser.

**Architecture:** Reuse `researchRun.dataSnapshot.preparationEvidence` and the existing preparation evidence formatter. Insert a `preparation-evidence` row after the export browser `data` row, keep search support through the existing row filter, and localize the browser label in `App.tsx`.

**Tech Stack:** TypeScript model helpers in `apps/web/src/lib/terminal-workbench.ts`, React label map in `apps/web/src/App.tsx`, Vitest coverage in `apps/web/src/lib/terminal-workbench.test.ts`, product tracking in `docs/product-plan.md`.

---

### Task 1: Export Package Browser Row

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Write the failing test**

Extend the export browser fixture with `researchRun.dataSnapshot.preparationEvidence`, then assert the browser rows include `preparation-evidence` with `exportPath: "researchRun.dataSnapshot.preparationEvidence"` and searchable refresh run id.

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research run export package browser"`

Expected: FAIL because export browser rows do not include preparation evidence yet.

- [x] **Step 3: Implement model/UI changes**

Add the row id, insert the row after `data`, use `formatPreparationEvidenceDetail`, and add the Chinese label.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research run export package browser"`

Expected: PASS.

### Task 2: Verification and Documentation

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-10-stage1-export-browser-preparation-evidence.md`

- [x] **Step 1: Update product plan**

Record that the export package browser now exposes locked preparation evidence.

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
