# Stage 0 Execution Runtime Reload Acceptance Contract Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final paper-only acceptance gate after an execution adapter runtime reload execution has been recorded, so the live-adapter readiness chain has an explicit terminal human review state.

**Architecture:** Add `execution_adapter_runtime_reload_acceptance` as a typed backend/API/client event. The acceptance must reference an existing `execution_adapter_runtime_reload_execution` event, inherit the same adapter, materialization, environment binding, reload plan, execution mode, reload mode, maintenance window, manifest, and env-var evidence, require five explicit confirmations, redact sensitive metadata, and keep `liveTradingAllowed=false` and `paperOnly=true`.

**Non-Goals:** Do not write environment variables, do not restart containers, do not call broker APIs, do not execute real orders, and do not enable live trading.

---

### Task 1: Backend RED And Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] Add a failing API contract test for `/api/execution/adapter-runtime-reload-acceptances`.
- [x] Return `execution_adapter_runtime_reload_execution_not_found` when the referenced execution event is missing.
- [x] Record blocked acceptance when confirmations are absent.
- [x] Record `acceptance_recorded` when all confirmations pass.
- [x] Ensure raw secrets, tokens, API keys, private keys, and passwords do not leak.

### Task 2: Frontend Typed API

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] Add RED tests for URL builders, POST record, GET history, and secret-free payload validation.
- [x] Add `ExecutionAdapterRuntimeReloadAcceptance` types.
- [x] Add `recordExecutionAdapterRuntimeReloadAcceptance`.
- [x] Add `loadExecutionAdapterRuntimeReloadAcceptances`.
- [x] Add runtime payload guards for record, history, result, confirmations, and status.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the acceptance contract and safety boundary.
- [x] Run backend focused test.
- [x] Run frontend API focused test.
- [x] Run production build.
- [x] Run full root tests.
- [x] Run Docker smoke.
- [x] Run in-app browser smoke.
- [x] Run `git diff --check`.

**Progress:**
- 2026-06-12: Added backend RED coverage, implemented the paper-only acceptance contract, and verified the focused backend acceptance test.
- 2026-06-12: Added frontend RED coverage for URL/record/history/secret-free guards, then implemented the typed API client and payload validators.
- 2026-06-12: Passed backend focused test, frontend focused API test, production build, full root tests, Docker smoke on `http://127.0.0.1:5173`, in-app browser research-page smoke, and `git diff --check`.
