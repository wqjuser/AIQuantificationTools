# Golden Path Runbook Action Targets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Golden Path runbook actions carry their real target workspace so calendar-review `market-data` rows can point users to Research for `run-pipeline`.

**Architecture:** The local core already knows each action's `targetWorkspace` in `_next_action`. This slice adds that target to each runbook item, updates the frontend contract/types to accept it, and makes workspace-context/action routing prefer the explicit target while keeping the row's owning workspace unchanged.

**Tech Stack:** Python core contract, TypeScript frontend model helpers, Vitest, unittest, product plan documentation.

---

### Task 1: Core Runbook Target Contract

**Files:**
- Modify: `services/quant_core/quant_core/golden_path.py`
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing tests**

Extend the existing Golden Path calendar-review test so the `market-data` runbook row includes:

```python
self.assertEqual(runbook_by_step["market-data"]["actionId"], "run-pipeline")
self.assertEqual(runbook_by_step["market-data"]["targetWorkspace"], "research")
```

- [x] **Step 2: Verify RED**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k test_golden_path_status_marks_market_calendar_review_after_fresh_data
```

Expected: fail because runbook rows do not yet include `targetWorkspace`.

- [x] **Step 3: Implement minimal support**

In `_runbook_item`, add:

```python
"targetWorkspace": action.get("targetWorkspace") if isinstance(action, dict) else None,
```

- [x] **Step 4: Verify GREEN**

Run the focused unittest and confirm it passes.

### Task 2: Frontend Consumption

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Write failing Vitest coverage**

Add a helper test where `buildGoldenPathWorkspaceContext` receives a `market` workspace row tied to `market-data`, while the runbook item has `actionId: "run-pipeline"` and `targetWorkspace: "research"`.

Assert:

```ts
expect(context).toMatchObject({
  workspaceId: "market",
  actionId: "run-pipeline",
  actionTargetWorkspaceId: "research"
});
```

- [x] **Step 2: Verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "builds selected product work-area context from golden path runbook action targets"
```

Expected: fail because `GoldenPathWorkspaceContext` does not yet expose `actionTargetWorkspaceId`.

- [x] **Step 3: Implement frontend support**

- Add `targetWorkspace: string | null` to `GoldenPathRunbookItem` in `terminal-api.ts` and validate it in `isGoldenPathRunbookItem`.
- Add `targetWorkspace` to `GoldenPathRunbookSourceItem`.
- Add `actionTargetWorkspaceId: string | null` to `GoldenPathWorkspaceContext`.
- In `buildGoldenPathWorkspaceContext`, set `actionTargetWorkspaceId` from `primaryItem.targetWorkspace`, falling back to `workspaceContext.actionId ? workspaceContext.id : null`.
- In `runWorkspaceContextAction`, pass `activeWorkspaceContext.actionTargetWorkspaceId`.
- In `GoldenPathRunbookPanel`, pass `item.targetWorkspace ?? item.workspaceId` to `onRunAction`.

- [x] **Step 4: Verify GREEN**

Run the focused Vitest and confirm it passes.

### Task 3: Docs And Full Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] **Step 1: Update product plan**

Record that Golden Path runbook action rows now carry explicit target workspace metadata.

- [x] **Step 2: Run full verification**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k test_golden_path_status_marks_market_calendar_review_after_fresh_data
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "builds selected product work-area context from golden path runbook action targets"
npm --prefix apps/web run build
npm test
npm run docker:smoke
git diff --check
```

Expected: all pass.

**Progress:**
- 2026-06-11: Planned the Golden Path action-target slice so runbook action buttons can distinguish the owning workspace from the workspace that should handle the action.
- 2026-06-11: Added RED unittest coverage proving `market-data` calendar-review rows need `targetWorkspace=research` when their action is `run-pipeline`.
- 2026-06-11: Added `targetWorkspace` to core Golden Path runbook items using the existing `_next_action` target metadata.
- 2026-06-11: Added RED Vitest coverage for `buildGoldenPathWorkspaceContext` exposing `actionTargetWorkspaceId` separately from the owning workspace.
- 2026-06-11: Updated frontend API validation, workbench context helpers, workspace-context routing, and Audit runbook action routing to prefer explicit action targets.
- 2026-06-11: Updated product planning docs with the new runbook action-target contract.
- 2026-06-11: Verified with focused Python unittest, focused Vitest, production web build, full Python + web test suite, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no console errors, and `git diff --check`.
