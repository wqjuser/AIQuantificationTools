# Stage 1 Research Entry Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the saved Stage 1 work area (`market` or `research`) when the terminal loads without an explicit `workspace` URL parameter.

**Architecture:** Keep the persisted state in the existing `ResearchWorkspaceStateStore`. The Python core embeds the saved research workspace state in `/api/workspace`, and the React app uses that optional field only for initial work-area selection; URL parameters continue to override saved state.

**Tech Stack:** Python standard library HTTP API and SQLite; React/TypeScript/Vitest frontend model and app bootstrap.

---

### Task 1: Backend Workspace Payload

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/api.py`

- [ ] **Step 1: Write the failing API contract assertion**

Add this assertion to `test_research_workspace_state_api_restores_workspace_context` after `workspace_payload` is loaded:

```python
self.assertEqual(workspace_payload["researchWorkspaceState"]["workspaceId"], "research")
self.assertEqual(workspace_payload["researchWorkspaceState"]["symbol"], "MSFT")
```

- [ ] **Step 2: Run the targeted backend test and verify it fails**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_research_workspace_state_api_restores_workspace_context
```

Expected: fail with a missing `researchWorkspaceState` key.

- [ ] **Step 3: Add the embedded payload**

In `QuantApiHandler.do_GET`, replace the `/api/workspace` branch with:

```python
workspace = self._workspace_with_saved_watchlist()
saved_state = self.workspace_state_store.get()
workspace, _quotes = workspace_with_live_quotes(workspace, self.quote_adapter)
payload = terminal_workspace_to_payload(workspace)
if saved_state:
    payload["researchWorkspaceState"] = research_workspace_state_to_payload(saved_state)
self._send_json(payload)
return
```

- [ ] **Step 4: Run the targeted backend test and verify it passes**

Run the same command from Step 2.

Expected: one test passes.

### Task 2: Frontend Initial Selection

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write the failing model test**

Add a test near the research workspace state draft test:

```ts
test("resolves the saved Stage 1 work area from workspace state", () => {
  const workspace: TerminalWorkspace = {
    ...buildTerminalWorkspace(),
    researchWorkspaceState: {
      market: "ashare",
      symbol: "600000",
      name: "浦发银行",
      timeframe: "1d",
      workspaceId: "market",
      updatedAt: "2026-06-09T00:00:00+00:00"
    }
  };

  expect(resolveSavedResearchWorkspaceId(workspace, "research")).toBe("market");
  expect(resolveSavedResearchWorkspaceId(buildTerminalWorkspace(), "research")).toBe("research");
});
```

- [ ] **Step 2: Run the targeted frontend test and verify it fails**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "resolves the saved Stage 1 work area"
```

Expected: fail because `resolveSavedResearchWorkspaceId` is not exported.

- [ ] **Step 3: Add the frontend model type and resolver**

In `terminal-workbench.ts`, add `ResearchWorkspaceStateSnapshot`, add optional `researchWorkspaceState` to `TerminalWorkspace`, and export:

```ts
export interface ResearchWorkspaceStateSnapshot extends ResearchWorkspaceStateDraft {
  updatedAt?: string;
}

export function resolveSavedResearchWorkspaceId(
  workspace: TerminalWorkspace,
  fallback: Stage1ResearchWorkspaceId
): Stage1ResearchWorkspaceId {
  const workspaceId = workspace.researchWorkspaceState?.workspaceId;
  return workspaceId === "market" || workspaceId === "research" ? workspaceId : fallback;
}
```

- [ ] **Step 4: Wire app bootstrap**

In `App.tsx`, import `resolveSavedResearchWorkspaceId` and make `resolveInitialWorkAreaSelection` use:

```ts
return resolveProductWorkAreaSelection(
  workspace,
  resolveInitialWorkAreaId(resolveSavedResearchWorkspaceId(workspace, "research"))
);
```

Do not change URL override behavior.

Also mark left-rail work-area clicks as manual selections and consume the saved-entry restore attempt after the first core workspace load, so a user click during refresh is not overwritten by saved state.

- [ ] **Step 5: Run the targeted frontend test and verify it passes**

Run the same command from Step 2.

Expected: one test passes.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Update docs**

Add that `/api/workspace` embeds `researchWorkspaceState` and that URL parameters still override the saved Stage 1 entry.

- [ ] **Step 2: Run verification**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
docker compose up --build -d
```

Expected: all tests and build pass, Docker services are healthy on port `5173`.

- [ ] **Step 3: Docker smoke**

Use `PUT /api/research/workspace-state` with `workspaceId=market`, then `GET /api/workspace` and confirm:

```json
{
  "researchWorkspaceState": {
    "workspaceId": "market"
  }
}
```

Reset the saved state to `600000 · 1d · research` after smoke so the local workspace opens in the familiar research view.
