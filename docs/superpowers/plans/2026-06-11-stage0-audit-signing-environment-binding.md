# Stage 0 Audit Signing Environment Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the next Audit signing key rotation ledger step after Secret-store materialization: record redacted runtime environment binding evidence for a proposed signing key.

**Architecture:** Reuse the existing Audit event store and the safety pattern from execution adapter environment binding. The new contract is audit-event-only: `POST /api/audit/signing-keys/environment-bindings` loads a previously recorded `audit_signing_key_secret_materialization`, requires four confirmations, records `eventType=audit_signing_key_environment_binding`, and returns a typed payload. `GET /api/audit/signing-keys/environment-bindings` reloads recent binding records by proposed key id. The web client exposes typed URL, record, load, and response guards.

**Non-Goals:** Do not write environment variables, do not restart containers, do not activate the proposed signing key, do not accept raw signing secrets, and do not enable live trading.

---

### Task 1: RED Tests

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add backend HTTP test for blocked and recorded Audit signing key environment binding.
- [x] Assert the binding must reference a recorded secret materialization.
- [x] Assert four confirmations, `binding_recorded`, redacted metadata, paper-only boundary, audit event type, and history reload.
- [x] Add web client tests for URL helper, record helper, load helper, contract guards, and raw secret exclusion.
- [x] Run focused tests and verify they fail before implementation.

### Task 2: Contract Implementation

**Files:**
- Modify: `services/quant_core/quant_core/audit_signing.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] Add `AuditSigningKeyEnvironmentBinding` domain payload and confirmation specs.
- [x] Convert environment binding payloads to and from audit events.
- [x] Add POST and GET API routes for Audit signing key environment binding.
- [x] Add typed web API client helpers and response guards.
- [x] Keep metadata redacted and preserve `liveTradingAllowed=false` / `paperOnly=true`.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the new environment binding contract.
- [x] Run focused backend/frontend tests, broader API tests, production web build, full tests, Docker smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned the Audit signing key environment binding slice after Secret-store materialization UI landed.
- 2026-06-11: Added RED backend and frontend client tests; backend failed with 404 and frontend failed on missing helpers.
- 2026-06-11: Implemented domain payload conversion, POST/GET API routes, web client helpers, and response guards.
- 2026-06-11: Verified focused backend/client tests, full terminal API Vitest, full `npm test`, production web build, Docker smoke on port 5173, and `git diff --check`.
