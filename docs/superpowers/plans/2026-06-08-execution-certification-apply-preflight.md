# Execution Certification Apply Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secret-free execution adapter certification apply preflight so certification evidence can be checked for manual secret-store and controlled-restart readiness without enabling live trading.

**Architecture:** Keep this as a backend/API contract slice. The Python core loads an existing certification record, evaluates required confirmations, returns blocked or `ready_for_restart`, and writes an audit event without storing raw secrets. The web layer only gains typed API helpers and contract tests in this slice; Settings/Execution UI wiring can consume it in the next slice.

**Tech Stack:** Python unittest, SQLite-backed execution certification store, local audit event store, TypeScript `terminal-api`, Vitest.

---

### Task 1: Python Core Apply Preflight

**Files:**
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing backend tests**

Add tests proving:
- `POST /api/execution/adapter-certifications/apply` returns `409` when required confirmations are missing.
- the blocked response includes `secret_reference_not_confirmed`, `controlled_restart_not_confirmed`, and `operator_review_not_confirmed`.
- a passed live certification plus all confirmations returns `200` and `ready_for_restart`.
- both responses and audit events do not leak secret-like metadata.

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_certification_apply_preflight_requires_confirmations_without_leaking_secret
```

Expected: FAIL because the endpoint and helper types do not exist yet.

Result: FAIL on 2026-06-08 with `409 != 404`, confirming `/api/execution/adapter-certifications/apply` did not exist yet.

- [x] **Step 2: Implement core model and endpoint**

Add:
- `ExecutionAdapterCertificationApplyResult`
- `ExecutionAdapterCertificationStore.get(certification_id)`
- `build_execution_adapter_certification_apply(...)`
- `execution_adapter_certification_apply_to_payload(...)`
- `execution_adapter_certification_apply_to_audit_event_payload(...)`
- `POST /api/execution/adapter-certifications/apply`

Safety constraints:
- never include raw `secret`, `token`, `apiKey`, `privateKey`, or `password` values in payloads or audit metadata.
- never mutate certification records to `liveTradingAllowed=true`.
- never restart services or write environment variables.

- [x] **Step 3: Verify targeted backend tests**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_certification_apply_preflight_requires_confirmations_without_leaking_secret
```

Expected: PASS.

Result: PASS on 2026-06-08 with `$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_certification_apply_preflight_requires_confirmations_without_leaking_secret`.

### Task 2: Web API Client Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] **Step 4: Write failing frontend API tests**

Add tests proving:
- the apply URL is `/api/execution/adapter-certifications/apply`.
- `recordExecutionAdapterCertificationApply(...)` posts the expected request body.
- blocked `409` responses still parse into a usable `certificationApply` result with `source="local-core"`.
- secret-like request metadata is not required by the helper contract.

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "adapter certification apply"
```

Expected: FAIL because the URL builder and API helper do not exist yet.

Result: FAIL on 2026-06-08 with `TypeError: buildExecutionAdapterCertificationApplyUrl is not a function`.

- [x] **Step 5: Implement frontend API helper**

Add TypeScript request/result interfaces, URL builder, response validators, and `recordExecutionAdapterCertificationApply`.

- [x] **Step 6: Verify targeted frontend API tests**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "adapter certification apply"
```

Expected: PASS.

Result: PASS on 2026-06-08 with `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "adapter certification apply"`.

### Task 3: Product Plan And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-08-execution-certification-apply-preflight.md`

- [x] **Step 7: Update product plan**

Update current-state bullets so the next-step language says certification apply preflight exists, while UI wiring and controlled restart orchestration remain future work.

Result: PASS on 2026-06-08. `docs/product-plan.md` now records the apply preflight API and frontend helper, while keeping UI wiring, local secret-store writes, and controlled restart orchestration as future work.

- [x] **Step 8: Full verification and Docker check**

Run:

```powershell
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
docker compose up -d
```

Then verify `http://127.0.0.1:5173/?workspace=execution` still loads from Docker.

Result: PASS on 2026-06-08.
- `npm test`: Python 131 tests and Web 354 tests passed.
- `npm run build`: passed with split chunks and no Vite large chunk warning.
- `docker compose config`: passed and web still publishes `5173`.
- `docker compose build`: passed for API and Web images.
- `python tools\docker_smoke.py --no-build --down`: passed health, web, and workspace schema checks.
- Docker was restarted with `docker compose up -d`.
- Docker API smoke: `POST /api/execution/adapter-certifications/apply` returned `409` blocked with three missing confirmation reasons and `liveTradingAllowed=false`.
- Browser verification on `http://127.0.0.1:5173/?workspace=execution`: PASS. Execution workspace and promotion queue rendered without runtime error text.

- [x] **Step 9: Commit and push**

```powershell
git add services/quant_core/quant_core/execution.py services/quant_core/quant_core/api.py services/quant_core/tests/test_quant_core.py apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts docs/product-plan.md docs/superpowers/plans/2026-06-08-execution-certification-apply-preflight.md
git commit -m "feat: add certification apply preflight"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

Result: PASS on 2026-06-08. Feature commit `3707770` was pushed to `origin/codex/p0-product-workspaces` through proxy `127.0.0.1:7890`.

### Notes

- This slice is a P0/P3 bridge: it improves the platform safety contract but does not enable real live trading.
- No raw secret values should appear in request examples, responses, audit metadata, tests, or docs.
