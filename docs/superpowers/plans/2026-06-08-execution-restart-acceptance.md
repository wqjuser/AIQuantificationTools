# Execution Restart Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paper-only, audit-backed post-restart acceptance ledger for execution adapters so the live-promotion queue can distinguish "restart evidence recorded" from "adapter acceptance validated".

**Architecture:** Reuse the existing audit-event ledger pattern used by adapter certification, apply preflight, and controlled restart evidence. The backend records and projects `execution_adapter_restart_acceptance` events; the frontend loads them from Settings refresh and surfaces the latest matching result in the Execution promotion queue without enabling real trading.

**Tech Stack:** Python `unittest` and local HTTP API for `quant_core`; React/TypeScript with Vitest for API and workbench contracts; existing CSS/App source checks for UI binding.

---

### Task 1: Backend Restart Acceptance Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] **Step 1: Write the failing backend API test**

Add `test_execution_adapter_restart_acceptance_records_history_without_enabling_live` beside the controlled restart evidence test. The test must create certification, apply preflight, controlled restart evidence, then POST `/api/execution/adapter-certifications/restart-acceptance` twice: first with missing confirmations expecting `409 blocked`, then with all confirmations expecting `200 acceptance_recorded`. It must GET `/api/execution/adapter-certifications/restart-acceptance?adapterId=ashare-live&limit=5`, assert newest-first history, assert `liveTradingAllowed` is `false`, `paperOnly` is `true`, and assert secret-like payload values are redacted.

- [x] **Step 2: Run the backend test and verify RED**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_restart_acceptance_records_history_without_enabling_live
```

Expected: fails because the endpoint and builder do not exist.

- [x] **Step 3: Implement the minimal backend contract**

Add `ExecutionAdapterRestartAcceptanceResult`, `build_execution_adapter_restart_acceptance`, payload projector, audit-event projector, audit-event reader, and confirmation specs for:

```text
core-health-checked -> coreHealthChecked -> local_core_health_not_confirmed
settings-reload-observed -> settingsReloadObserved -> settings_reload_not_confirmed
paper-route-handshake-passed -> paperRouteHandshakePassed -> paper_route_handshake_not_confirmed
emergency-stop-armed -> emergencyStopArmed -> emergency_stop_not_confirmed
account-sync-dry-run-passed -> accountSyncDryRunPassed -> account_sync_dry_run_not_confirmed
```

The builder must require a referenced controlled restart evidence payload with status `evidence_recorded`, route `live`, and `restartRequired=true`. It must always return `liveTradingAllowed=False`, `paperOnly=True`, redact metadata, and use status `blocked` or `acceptance_recorded`.

- [x] **Step 4: Wire POST/GET endpoints**

Add:

```text
POST /api/execution/adapter-certifications/restart-acceptance
GET  /api/execution/adapter-certifications/restart-acceptance?adapterId=...&limit=...
```

The POST must look up the referenced evidence id in the audit event store, return `404` if missing, write the audit event when present, and use `409` for blocked acceptance.

- [x] **Step 5: Run the backend test and verify GREEN**

Run the same `python -m unittest ...test_execution_adapter_restart_acceptance...` command. Expected: pass.

### Task 2: Frontend API Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] **Step 1: Write the failing API test**

Add assertions for:

```text
buildExecutionAdapterRestartAcceptanceUrl(baseUrl)
buildExecutionAdapterRestartAcceptanceHistoryUrl(baseUrl, { adapterId: "us-live", limit: 5 })
recordExecutionAdapterRestartAcceptance(...)
loadExecutionAdapterRestartAcceptances(...)
```

The test must assert strict parsing, secret-free metadata validation, `eventType=execution_adapter_restart_acceptance`, and the `/restart-acceptance` URLs.

- [x] **Step 2: Run the API test and verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts
```

Expected: fails on missing exports/functions.

- [x] **Step 3: Implement the API helpers**

Add TypeScript types, URL builders, record/load helpers, payload type guards, and status guard for `blocked | acceptance_recorded`.

- [x] **Step 4: Run the API test and verify GREEN**

Run the same Vitest file. Expected: pass.

### Task 3: Workbench Promotion Binding

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Write failing workbench tests**

Add one test for compact restart acceptance rows and one test proving `buildPromotionReadiness(...)` surfaces the latest matching acceptance as `Acceptance recorded · ashare-live`, while keeping status blocked and tone warning.

- [x] **Step 2: Run workbench tests and verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
```

Expected: fails on missing row builder/signature.

- [x] **Step 3: Implement workbench row builder and promotion binding**

Add `ExecutionAdapterRestartAcceptanceSnapshot`, `ExecutionAdapterRestartAcceptanceRow`, `buildExecutionAdapterRestartAcceptanceRows`, latest matching acceptance selector, and pass acceptance rows into `buildPromotionReadiness`.

- [x] **Step 4: Run workbench tests and verify GREEN**

Run the same Vitest file. Expected: pass.

### Task 4: App/UI Loading and Rendering

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write failing UI binding tests**

Extend layout/source tests to assert Settings refresh calls `loadExecutionAdapterRestartAcceptances`, state is converted with `buildExecutionAdapterRestartAcceptanceRows`, `buildPromotionReadiness` receives the rows, and `PromotionQueuePanel` renders `.promotion-restart-acceptance`.

- [x] **Step 2: Run layout/source test and verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js
```

Expected: fails on missing source strings/classes.

- [x] **Step 3: Implement app state and compact UI**

Load acceptance history with the other adapter evidence in `refreshSettingsStatus`, build rows, pass them into `buildPromotionReadiness` and `PromotionQueuePanel`, and render recent acceptance evidence in the same compact evidence rail as restart evidence.

- [x] **Step 4: Run layout/source test and verify GREEN**

Run the same layout/source test. Expected: pass.

### Task 5: Documentation, Verification, Commit, Push

**Files:**
- Modify: `docs/product-plan.md`

- [x] **Step 1: Update product plan**

Document that restart acceptance history exists as a paper-only post-restart evidence layer and that real live routing remains blocked until actual secret-store/restart orchestration and human confirmation exist.

- [x] **Step 2: Run targeted and full verification**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests
npm --prefix apps/web test -- --run
npm test
npm --prefix apps/web run build
docker compose config
git diff --check
docker compose build
python tools\docker_smoke.py --no-build --down
docker compose up -d
```

- [x] **Step 3: Browser smoke**

Open `http://127.0.0.1:5173/?workspace=execution`, verify no console errors, seed/read a local paper-only acceptance event if needed, and confirm the promotion queue renders the acceptance evidence without extra nested scrollbars.

- [x] **Step 4: Commit and push**

Run:

```powershell
git add services/quant_core/tests/test_quant_core.py services/quant_core/quant_core/execution.py services/quant_core/quant_core/api.py apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/layout-css.test.js apps/web/src/App.tsx apps/web/src/styles.css docs/product-plan.md docs/superpowers/plans/2026-06-08-execution-restart-acceptance.md
git commit -m "feat: record restart acceptance evidence"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```
