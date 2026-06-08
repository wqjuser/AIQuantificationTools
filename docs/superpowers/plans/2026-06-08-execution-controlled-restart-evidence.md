# Execution Controlled Restart Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paper-only controlled restart evidence ledger after adapter certification apply preflight.

**Architecture:** Keep the ledger in the Python local core as an audit-event projection, not as a secret writer or service restarter. A restart evidence record must reference an existing `execution_adapter_certification_apply` event whose status is `ready_for_restart`; the record captures operator-confirmed restart window, rollback plan, post-restart validation, and log review evidence. Frontend helpers and promotion readiness consume these rows so Execution can show progress while live routing stays blocked.

**Tech Stack:** Python local core, SQLite-backed audit events, React/TypeScript API/workbench helpers, Vitest, Docker Compose.

---

### Task 1: Backend Restart Evidence Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] Write a failing backend API test for `POST /api/execution/adapter-certifications/restart-evidence`.
- [x] Verify RED: the endpoint returns 404 or missing-contract failure before implementation.
- [x] Add `ExecutionAdapterControlledRestartEvidenceResult`, builder, payload serializer, audit event payload, and audit event projector.
- [x] Implement POST so missing confirmations or non-ready apply events return `409 blocked`, complete confirmations return `200 evidence_recorded`, secrets are redacted, and `liveTradingAllowed` remains false.
- [x] Add `GET /api/execution/adapter-certifications/restart-evidence?adapterId=...&limit=...`.
- [x] Verify GREEN with the targeted backend test.

### Task 2: Frontend API And Workbench Rows

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Write failing API tests for URL builders, record helper, history helper, and response validation.
- [x] Verify RED: helpers are missing.
- [x] Add TypeScript request/result types and fetch helpers for restart evidence.
- [x] Write failing workbench tests for compact restart evidence rows and promotion stage consumption.
- [x] Add row builders, labels, tone mapping, latest matching row selection, and promotion detail text.
- [x] Verify GREEN with targeted web tests.

### Task 3: UI Wiring, Docs, And Verification

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-08-execution-controlled-restart-evidence.md`

- [x] Write a failing layout/source contract proving Settings loads restart evidence history and Execution promotion renders recent rows.
- [x] Wire Settings refresh and promotion queue to the new restart evidence rows.
- [x] Add compact UI copy that says evidence is recorded but live remains blocked pending controlled orchestration.
- [x] Update `docs/product-plan.md` with the completed slice and next-stage boundary.
- [x] Run targeted tests, full test suite, production build, Docker smoke, and browser verification on `?workspace=execution`.
- [ ] Commit and push through proxy `127.0.0.1:7890`.

**Progress**

- RED: `python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_controlled_restart_evidence_records_history_without_enabling_live` initially failed with `404 != 409`, confirming the restart evidence endpoint did not exist.
- GREEN: the same targeted backend test now passes after adding the paper-only controlled restart evidence builder, audit-event serializer/projector, POST endpoint, and GET history endpoint.
- RED: `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "controlled restart evidence"` initially failed because the TypeScript URL/record/history helpers did not exist.
- GREEN: the same targeted API tests now pass after adding restart evidence request/result types, URL builders, POST/GET helpers, and strict secret-free response validation.
- RED: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "controlled restart evidence|restart evidence"` failed because `buildExecutionAdapterControlledRestartEvidenceRows` was missing and promotion only displayed apply evidence.
- GREEN: the same targeted workbench tests now pass after adding compact restart evidence rows and binding latest matching evidence into the adapter certification stage while keeping the stage blocked.
- RED: `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "controlled restart evidence history"` failed because App did not load or render controlled restart evidence history.
- GREEN: the same layout/source contract now passes after Settings refresh loads restart evidence history and Promotion Queue renders compact recent rows.
- DOCS: `docs/product-plan.md` now records the controlled restart evidence ledger, frontend history recovery, promotion evidence display, and the remaining secret-store/restart orchestration boundary.
- VERIFY: targeted backend/API/workbench/layout tests passed; full Python discovery passed with 133 tests; full web Vitest passed with 365 tests; root `npm test` passed.
- VERIFY: `npm --prefix apps/web run build` and `docker compose build` passed without chunk warnings; `docker compose config`, `git diff --check`, and `python tools\docker_smoke.py --no-build --down` passed.
- VERIFY: Docker Compose was restarted on port 5173 and browser verification on `http://127.0.0.1:5173/?workspace=execution` showed one controlled restart evidence row, five promotion stages, and no browser console errors after seeding a paper-only smoke evidence record.
