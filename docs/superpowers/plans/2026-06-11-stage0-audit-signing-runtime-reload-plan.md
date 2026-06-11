# Stage 0 Audit Signing Runtime Reload Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the next Audit signing key rotation ledger step after environment binding: record a paper-only controlled runtime reload plan for a proposed signing key.

**Architecture:** Reuse the generic audit event store and mirror the execution adapter runtime reload plan safety pattern. The new contract is audit-event-only: `POST /api/audit/signing-keys/runtime-reload-plans` loads a previously recorded `audit_signing_key_environment_binding`, requires five operator confirmations, records `eventType=audit_signing_key_runtime_reload_plan`, and returns a typed payload. `GET /api/audit/signing-keys/runtime-reload-plans` reloads recent plan records by proposed key id. The web client exposes typed URL, record, load, and response guards.

**Non-Goals:** Do not write environment variables, do not restart containers, do not activate the proposed signing key, do not accept raw signing secrets, and do not enable live trading.

---

### Task 1: RED Tests

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add backend HTTP test for blocked and recorded Audit signing key runtime reload plan.
- [x] Assert the plan must reference a recorded environment binding.
- [x] Assert five confirmations, `plan_recorded`, redacted metadata, paper-only boundary, audit event type, and history reload.
- [x] Add web client tests for URL helper, record helper, load helper, contract guards, and raw secret exclusion.
- [x] Run focused tests and verify they fail before implementation.

### Task 2: Contract Implementation

**Files:**
- Modify: `services/quant_core/quant_core/audit_signing.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] Add `AuditSigningKeyRuntimeReloadPlan` domain payload and confirmation specs.
- [x] Convert runtime reload plan payloads to and from audit events.
- [x] Add POST and GET API routes for Audit signing key runtime reload plans.
- [x] Add typed web API client helpers and response guards.
- [x] Keep metadata redacted and preserve `liveTradingAllowed=false` / `paperOnly=true`.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the new runtime reload plan contract.
- [x] Run focused backend/frontend tests, broader API tests, production web build, full tests, Docker smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned the Audit signing key runtime reload plan slice after environment binding UI/history landed.
- 2026-06-11: Verified RED for backend HTTP and frontend typed client tests, then implemented domain/API/client contract for paper-only runtime reload plan records.
- 2026-06-11: Verified focused backend/frontend tests, full Python/web test suites, production web build, Docker smoke, and diff whitespace check.
