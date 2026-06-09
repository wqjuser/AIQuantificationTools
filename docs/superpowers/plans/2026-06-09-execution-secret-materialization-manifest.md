# Execution Secret Materialization Manifest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paper-only local secret materialization manifest ledger after adapter secret references are recorded.

**Architecture:** Reuse the audit-event projection pattern already used by execution adapter certifications, apply preflights, controlled restart evidence, restart acceptance, and secret references. The backend accepts a recorded secret reference id plus operator confirmations, writes a redacted `execution_adapter_secret_materialization` event, and returns history without raw secrets or live-trading enablement. The frontend adds typed API helpers, compact rows, and promotion queue evidence so the Execution workspace can see this step in the adapter readiness chain.

**Tech Stack:** Python local core HTTP API, SQLite audit-event store, React/TypeScript frontend, Vitest, unittest, Docker Compose.

---

### Task 1: Backend Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] **Step 1: Write the failing backend API test**

Add `test_execution_adapter_secret_materialization_records_manifest_without_leaking_secret`. It should:
- POST a valid `/api/execution/adapter-secret-references` record for `ashare-live`.
- POST `/api/execution/adapter-secret-materializations` once with missing confirmations and expect `409 blocked`.
- POST the same endpoint with all confirmations and expect `201 manifest_recorded`.
- GET `/api/execution/adapter-secret-materializations?adapterId=ashare-live&limit=5`.
- Assert newest-first history, reference linkage, `paperOnly=true`, `liveTradingAllowed=false`, `eventType=execution_adapter_secret_materialization`, and no fake `secret` or `privateKey` values in serialized output.

- [x] **Step 2: Run backend RED**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_secret_materialization_records_manifest_without_leaking_secret
```

Expected: fail because the endpoint and result type do not exist.

Result: RED on 2026-06-09. Targeted unittest failed with `404 != 409`, confirming `/api/execution/adapter-secret-materializations` is missing.

- [x] **Step 3: Implement backend result, serializers, and routes**

Add `ExecutionAdapterSecretMaterializationResult`, `build_execution_adapter_secret_materialization`, payload/audit-event projectors, confirmation specs, `POST /api/execution/adapter-secret-materializations`, and `GET /api/execution/adapter-secret-materializations`. Complete confirmations are:
- `localSecretStoreWriteVerified`
- `noRawSecretInPayload`
- `envBindingPlanDocumented`
- `rollbackPlanDocumented`

The builder must require an existing `execution_adapter_secret_reference` event with `status=reference_recorded`, copy the reference name/backend/env vars from that event, redact secret-like metadata, and keep live trading blocked.

- [x] **Step 4: Run backend GREEN**

Run the same backend unittest command. Expected: pass.

Result: GREEN on 2026-06-09. Targeted unittest passed; backend records blocked and `manifest_recorded` entries, projects newest-first history, redacts secret-like metadata, and keeps `liveTradingAllowed=false`.

### Task 2: Frontend API Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] **Step 1: Write failing API helper tests**

Add tests for:
- `buildExecutionAdapterSecretMaterializationUrl`
- `buildExecutionAdapterSecretMaterializationHistoryUrl`
- `recordExecutionAdapterSecretMaterialization`
- `loadExecutionAdapterSecretMaterializations`
- rejection of unredacted secret-like metadata.

- [x] **Step 2: Run frontend API RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "secret materialization"
```

Expected: fail because the helpers are not implemented.

Result: RED on 2026-06-09. Targeted Vitest failed with `buildExecutionAdapterSecretMaterializationUrl is not a function` and `loadExecutionAdapterSecretMaterializations is not a function`.

- [x] **Step 3: Implement API types and helpers**

Add strict request/result/history interfaces, URL builders, POST/GET helpers, and payload guards for `ExecutionAdapterSecretMaterializationResult`.

- [x] **Step 4: Run frontend API GREEN**

Run the same targeted Vitest command. Expected: pass.

Result: GREEN on 2026-06-09. Targeted API tests passed for URL builders, POST/GET helpers, strict payload parsing, and unredacted metadata rejection.

### Task 3: Workbench Rows and Promotion Evidence

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write failing workbench and layout tests**

Add tests that `buildExecutionAdapterSecretMaterializationRows` summarizes manifest status, confirmations, backend, env vars, and boundary; and that `buildPromotionReadiness` includes the latest materialization evidence in the adapter certification stage without allowing live trading. Add a layout/source test proving Settings refresh loads materialization history and `PromotionQueuePanel` renders `.promotion-secret-materialization-evidence`.

- [x] **Step 2: Run frontend RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "secret materialization"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "secret materialization"
```

Expected: fail because the row builder, wiring, and evidence panel do not exist.

Result: RED on 2026-06-09. Targeted workbench Vitest failed with `buildExecutionAdapterSecretMaterializationRows is not a function`, and the layout/source test failed because `loadExecutionAdapterSecretMaterializations` was not wired in `App.tsx`.

- [x] **Step 3: Implement rows, wiring, and evidence panel**

Add materialization rows to workbench state, load them during Settings refresh for live adapters, pass them into `buildPromotionReadiness` and `PromotionQueuePanel`, and render compact evidence rows with existing promotion evidence styling.

- [x] **Step 4: Run frontend GREEN**

Run the same targeted workbench and layout tests. Expected: pass.

Result: GREEN on 2026-06-09. Targeted workbench Vitest passed `2 passed | 178 skipped`; targeted layout/source Vitest passed `1 passed | 63 skipped`.

### Task 4: Product Docs and Full Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-09-execution-secret-materialization-manifest.md`

- [x] **Step 1: Update docs**

Update `docs/product-plan.md` to mark the local secret materialization manifest ledger complete while keeping real secret values, env writes, restarts, broker connectivity, and live routing blocked.

Result: Updated `docs/product-plan.md` on 2026-06-09 to record `execution_adapter_secret_materialization` POST/GET, frontend history recovery, Promotion Queue evidence, and the continuing no-raw-secret/no-auto-env/no-restart/no-live-routing boundary.

- [x] **Step 2: Run verification**

Run targeted tests, broad backend/frontend tests, build, Docker smoke, and browser smoke on `http://127.0.0.1:5173/?workspace=execution`.

Result: Verification passed on 2026-06-09:
- Targeted backend unittest: `Ran 1 test ... OK`.
- Targeted API Vitest: `2 passed | 116 skipped`.
- Targeted workbench Vitest: `2 passed | 178 skipped`.
- Targeted layout/source Vitest: `1 passed | 63 skipped`.
- Backend unittest discovery: `Ran 136 tests ... OK`.
- Frontend Vitest: `379 passed`.
- Root `npm test`: Python and web suites passed.
- `npm --prefix apps/web run build`: Vite production build passed without chunk warnings.
- `docker compose config`: valid, web publishes port `5173`.
- `docker compose build`: API and web images built.
- `python tools\docker_smoke.py --no-build --down`: health, web, and workspace smoke passed.
- Docker service restarted with `docker compose up -d`.
- Browser smoke on `http://127.0.0.1:5173/?workspace=execution`: materialization evidence panel visible, `manifest_recorded` visible, live-blocked boundary visible, console error count `0`.
- `git diff --check`: clean.

- [ ] **Step 3: Commit and push**

Commit using a Conventional Commit message and push `codex/p0-product-workspaces` through proxy `127.0.0.1:7890`.
