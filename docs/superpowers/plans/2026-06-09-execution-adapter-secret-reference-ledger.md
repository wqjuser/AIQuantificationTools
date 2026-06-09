# Execution Adapter Secret Reference Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record execution-adapter secret references as auditable, redacted, paper-only evidence before any future live adapter orchestration.

**Architecture:** Reuse the existing quant-core audit-event ledger pattern used by certification, apply preflight, controlled restart evidence, and restart acceptance. The backend records `execution_adapter_secret_reference` events; the frontend loads recent references and surfaces them as compact execution evidence without collecting raw secrets or enabling live trading.

**Tech Stack:** Python `http.server` local API, SQLite-backed audit event store, React/TypeScript frontend, Vitest/unit tests, Docker Compose.

---

### Task 1: Backend Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] **Step 1: Write the failing API test**

Add `test_execution_adapter_secret_reference_records_history_without_leaking_secret` to `QuantCoreContractTest`. It posts `/api/execution/adapter-secret-references` with required secret-reference confirmations, then reads `/api/execution/adapter-secret-references?adapterId=ashare-live&limit=5`. The test asserts `status=reference_recorded`, `paperOnly=true`, `liveTradingAllowed=false`, newest-first history, `eventType=execution_adapter_secret_reference`, and that fake `secret` / `privateKey` values are absent from serialized responses.

- [x] **Step 2: Run the backend test to verify RED**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_secret_reference_records_history_without_leaking_secret
```

Expected: FAIL because `/api/execution/adapter-secret-references` is not implemented.

Result: FAIL on 2026-06-09 with `404 != 409`, confirming the endpoint was absent.

- [x] **Step 3: Add the backend implementation**

Add an `ExecutionAdapterSecretReferenceResult` dataclass, `build_execution_adapter_secret_reference`, payload projection, audit-event projection, audit-event history projection, and confirmation specs for:

```text
reference-created-outside-ui
operator-verified-fingerprint
rotation-plan-documented
```

Add POST and GET handlers under `/api/execution/adapter-secret-references`. Missing confirmations return `409 blocked`; complete confirmations return `201 reference_recorded`. All payloads redact secret-like metadata and always set `liveTradingAllowed=false`, `paperOnly=true`.

- [x] **Step 4: Run the backend test to verify GREEN**

Run the same unittest command. Expected: PASS.

Result: PASS on 2026-06-09. POST records blocked/reference_recorded entries, GET returns newest-first history, fake secret/privateKey values are redacted, and `liveTradingAllowed=false`.

### Task 2: Frontend API Helpers

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] **Step 1: Write the failing frontend API test**

Add tests for:

```text
buildExecutionAdapterSecretReferenceUrl
buildExecutionAdapterSecretReferenceHistoryUrl
recordExecutionAdapterSecretReference
loadExecutionAdapterSecretReferences
```

The tests must assert strict URL construction, POST/GET fetch calls, event type parsing, and rejection of secret-like metadata through the existing secret-free guard.

- [x] **Step 2: Run the API test to verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts
```

Expected: FAIL because the new helpers and types do not exist.

Result: FAIL on 2026-06-09 with `buildExecutionAdapterSecretReferenceUrl is not a function` and `loadExecutionAdapterSecretReferences is not a function`.

- [x] **Step 3: Add the frontend API implementation**

Add typed request/result/history interfaces, URL builders, record/load functions, and payload guards for `ExecutionAdapterSecretReferenceResult`.

- [x] **Step 4: Run the API test to verify GREEN**

Run the same Vitest command. Expected: PASS.

Result: PASS on 2026-06-09 with `116 passed`; API guards reject unredacted secret-like metadata.

### Task 3: Workbench Evidence Rows

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Write the failing workbench test**

Add `buildExecutionAdapterSecretReferenceRows` coverage. The row should summarize reference status, confirmations, backend, required environment variables, and show `Paper only · live trading blocked`.

- [x] **Step 2: Run the workbench test to verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
```

Expected: FAIL because the row builder does not exist.

Result: FAIL on 2026-06-09 with `buildExecutionAdapterSecretReferenceRows is not a function`.

- [x] **Step 3: Add the workbench implementation**

Add `ExecutionAdapterSecretReferenceSnapshot`, `ExecutionAdapterSecretReferenceRow`, and `buildExecutionAdapterSecretReferenceRows`.

- [x] **Step 4: Run the workbench test to verify GREEN**

Run the same Vitest command. Expected: PASS.

Result: PASS on 2026-06-09 with `178 passed`; row output omits metadata and summarizes backend, env vars, confirmations, blockers, and paper-only boundary.

### Task 4: UI Wiring And Documentation

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-09-execution-adapter-secret-reference-ledger.md`

- [x] **Step 1: Write the failing source/layout test**

Assert `App.tsx` loads secret references during Settings refresh, converts them to rows, passes them into the execution evidence surface, and renders `.promotion-secret-reference-evidence`.

- [x] **Step 2: Run the source/layout test to verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js
```

Expected: FAIL because UI wiring is absent.

Result: FAIL on 2026-06-09 because `loadExecutionAdapterSecretReferences(quantCoreBaseUrl` was absent from `App.tsx`.

- [x] **Step 3: Add UI wiring and CSS**

Load recent secret-reference records for live adapters, render compact evidence rows in the Execution promotion queue, and add CSS matching the existing promotion evidence pattern.

- [x] **Step 4: Update product docs and this plan**

Update `docs/product-plan.md` to describe the completed secret-reference ledger and the remaining next step: real local secret-store write, restart orchestration, adapter orchestrator, and final manual gate.

Result: PASS on 2026-06-09 with `63 passed`; Settings refresh loads secret-reference history, rows render in the promotion queue, and `docs/product-plan.md` now reflects the completed ledger plus remaining secret-store/orchestration work.

### Task 5: Verification And Delivery

**Files:**
- All modified files

- [x] **Step 1: Run targeted backend and frontend tests**

Run the targeted commands from Tasks 1-4 and confirm each exits 0.

Result: PASS on 2026-06-09:
- backend secret-reference API unittest passed
- `terminal-api.test.ts` passed with 116 tests
- `terminal-workbench.test.ts` passed with 178 tests
- `layout-css.test.js` passed with 63 tests

- [x] **Step 2: Run broader quality checks**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest discover -s services/quant_core/tests
npm --prefix apps/web test -- --run
npm test
npm --prefix apps/web run build
docker compose config
git diff --check
docker compose build
python tools\docker_smoke.py --no-build --down
docker compose up -d
```

Result: PASS on 2026-06-09:
- Python discover passed with 135 tests
- app Vitest passed with 374 tests
- root `npm test` passed
- Vite production build passed without large chunk warnings
- `docker compose config`, `git diff --check`, `docker compose build`, and `tools/docker_smoke.py --no-build --down` passed
- Browser smoke confirmed the Execution page renders recent secret-reference evidence with no console errors

- [x] **Step 3: Commit and push**

Commit with:

```powershell
git add .
git commit -m "feat: record adapter secret references"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

Result: PASS on 2026-06-09. Committed `feat: record adapter secret references` and pushed branch `codex/p0-product-workspaces` to `origin` through proxy `127.0.0.1:7890`.
