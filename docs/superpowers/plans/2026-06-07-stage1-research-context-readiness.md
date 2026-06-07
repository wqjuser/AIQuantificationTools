# Stage 1 Research Context Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Stage 1 research workspace show whether the selected symbol, K-line data, cache, and research note are ready for a reliable research run.

**Architecture:** Add a small frontend model helper that derives a checklist from the selected workspace, current chart data quality, active cache context, and research note state. Render the checklist in the Research workspace as a compact panel near the chart and notes, leaving later-stage strategy/execution surfaces untouched.

**Tech Stack:** React, TypeScript, Vitest, CSS, Markdown planning docs.

---

### Task 1: Checklist Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write the failing test**

Add tests for `buildResearchContextReadinessRows()`:

```ts
const rows = buildResearchContextReadinessRows({
  workspace: buildTerminalWorkspace(),
  barCount: 240,
  dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
  cacheContext: { rowCount: 240, freshness: "fresh", ageHours: 1, latestTimestamp: "2026-05-26T08:00:00+08:00" },
  note: { source: "core", body: "观察假设", updatedAt: "2026-05-26T08:30:00+08:00" }
});
expect(rows.map((row) => row.status)).toEqual(["ready", "ready", "ready", "ready"]);
```

Also add a blocked/review case with no bars, incomplete data, missing cache, and empty note.

- [x] **Step 2: Run model test to verify it fails**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
```

Expected: FAIL because the helper and row type do not exist.

- [x] **Step 3: Implement the minimal helper**

Add `ResearchContextReadinessRow`, `ResearchContextReadinessInput`, and `buildResearchContextReadinessRows()` with four rows: selected symbol, K-line data, local cache, and research note.

- [x] **Step 4: Run model test to verify it passes**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
```

Expected: PASS.

### Task 2: Research Workspace UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write the failing UI test**

Require `App.tsx` to render `ResearchContextReadinessPanel` in the Research workspace and require `.research-context-checklist` CSS.

- [x] **Step 2: Run UI test to verify it fails**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js
```

Expected: FAIL because the panel and CSS do not exist.

- [x] **Step 3: Implement the panel**

Render the checklist rows between the chart and research note panel. Use compact cards with status/tone classes and localized labels.

- [x] **Step 4: Run UI test to verify it passes**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js
```

Expected: PASS.

### Task 3: Planning and Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-07-stage1-research-context-readiness.md`

- [x] **Step 1: Update the product plan**

Add the Stage 1 checklist as a completed/current capability under the current stage discipline section.

- [x] **Step 2: Run quality gates**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web test -- --run
npm --prefix apps/web run build
git diff --check
docker compose up -d --build
python tools\docker_smoke.py --no-build --base-url http://127.0.0.1:5173
```

Expected: all commands pass.

- [x] **Step 3: Browser verify**

Open `http://127.0.0.1:5173/?workspace=research` at a large desktop viewport and verify the research context checklist is visible, has four rows, no horizontal overflow, and no console warnings/errors.

- [x] **Step 4: Commit and push with proxy**

Run:

```powershell
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js docs/product-plan.md docs/superpowers/plans/2026-06-07-stage1-research-context-readiness.md
git commit -m "feat: add research context readiness checklist"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```
