# Stage 0 Audit Signing Secret Materialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record an Audit signing key rotation plan's local secret-store materialization manifest without accepting or returning raw signing secrets.

**Architecture:** This slice adds a backend ledger contract plus typed frontend API client for `POST/GET /api/audit/signing-keys/secret-materializations`. Records are derived from an existing `audit_signing_key_rotation_plan` event, require four operator confirmations, write `audit_signing_key_secret_materialization` events, and keep `liveTradingAllowed=false` / `paperOnly=true`.

**Non-Goals:** Do not write raw signing secrets, do not mutate environment variables, do not restart containers, do not activate the proposed signing key, do not connect a real broker, and do not add UI controls in this slice.

---

### Task 1: RED Tests

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add a backend contract test that posts a blocked and confirmed Audit signing key secret materialization request.
- [x] Assert missing confirmations return `blocked` with deterministic blocker codes.
- [x] Assert confirmed requests return `manifest_recorded`, write an audit event, and are readable through history.
- [x] Assert active secrets and raw secret-like metadata never appear in serialized responses.
- [x] Add frontend API client tests for URL builders, POST body, response parsing, history loading, and paper-only boundary.
- [x] Run focused tests and verify they fail before implementation.

### Task 2: Backend And API Client

**Files:**
- Modify: `services/quant_core/quant_core/audit_signing.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] Add an Audit signing key secret materialization payload derived from a rotation plan audit event.
- [x] Require local secret-store write, raw-secret boundary, environment binding plan, and rollback plan confirmations.
- [x] Add audit event conversion plus history projection helpers with recursive secret-like metadata redaction.
- [x] Expose POST/GET routes for recording and loading materialization manifest evidence.
- [x] Add typed frontend request/result contracts, URL builders, record/load functions, and strict validators.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the completed backend/client materialization ledger.
- [x] Run focused Python and Vitest tests, terminal API/workbench Vitest, production web build, full tests, Docker smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned the Audit signing key secret materialization ledger after rotation apply and controlled restart evidence landed.
- 2026-06-11: Added RED backend and frontend API tests; backend failed on the missing route and frontend failed on missing client exports.
- 2026-06-11: Implemented backend payload/event projection, POST/GET routes, typed frontend client, and validators while preserving the no-raw-secret and paper-only boundary.
- 2026-06-11: Verified focused backend/frontend tests, full `terminal-api` and `terminal-workbench` Vitest, production web build, full root tests, Docker smoke on `http://127.0.0.1:5173`, and `git diff --check`.
