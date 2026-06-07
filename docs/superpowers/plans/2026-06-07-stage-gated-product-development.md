# Stage-Gated Product Development Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop mixed-stage development by making the current delivery stage explicit in product docs, model code, tests, and visible workspace navigation.

**Architecture:** Add a small stage roadmap model in the frontend workbench layer, enrich each product workspace with delivery-stage metadata, and keep business readiness separate from delivery-stage status. The UI reads this model and displays compact stage metadata without changing workspace routing.

**Tech Stack:** React, TypeScript, Vitest, CSS, Markdown planning docs.

---

### Task 1: Stage Roadmap Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing test**

Add a test that expects `buildProductDevelopmentStages()` to return Foundation, Market/Research, Strategy/Backtest, AI Review, Portfolio/Paper, and Live Readiness in order, with only Market/Research marked `current`.

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts`

Expected: FAIL because `buildProductDevelopmentStages` does not exist and work areas do not carry delivery-stage metadata.

- [x] **Step 3: Implement the minimal model**

Add `ProductDevelopmentStage`, `ProductDevelopmentStageId`, `ProductDevelopmentStageStatus`, `buildProductDevelopmentStages()`, and `deliveryStage*` fields on `ProductWorkArea`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts`

Expected: PASS.

### Task 2: Stage Labels in UI

**Files:**
- Modify: `apps/web/src/lib/i18n.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/i18n.test.ts`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write failing UI/i18n tests**

Add tests that require localized delivery-stage labels/statuses and require the left rail to render `.work-area-stage`.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix apps/web test -- --run src/lib/i18n.test.ts src/lib/layout-css.test.js`

Expected: FAIL because i18n methods and DOM/CSS are not implemented.

- [x] **Step 3: Implement the UI surface**

Add localized stage maps and compact left-rail stage metadata.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix apps/web test -- --run src/lib/i18n.test.ts src/lib/layout-css.test.js`

Expected: PASS.

### Task 3: Planning Discipline Docs

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`
- Create: `docs/superpowers/specs/2026-06-07-stage-gated-product-development-design.md`
- Create: `docs/superpowers/plans/2026-06-07-stage-gated-product-development.md`

- [x] **Step 1: Document the stage gate**

Add current-stage rules and freeze policy to the product plan.

- [x] **Step 2: Verify docs and full quality gate**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web test -- --run
npm --prefix apps/web run build
git diff --check
```

Expected: all commands pass.

- [ ] **Step 3: Commit and push with proxy**

Run:

```powershell
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/i18n.ts apps/web/src/lib/i18n.test.ts apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js docs/product-plan.md docs/architecture.md docs/superpowers/specs/2026-06-07-stage-gated-product-development-design.md docs/superpowers/plans/2026-06-07-stage-gated-product-development.md
git commit -m "chore: add stage-gated product roadmap"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```
