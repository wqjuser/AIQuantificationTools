# Stage 0 Audit Signing Rotation Acceptance Contract Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final paper-only acceptance gate after Audit signing key runtime reload execution evidence so the signing key rotation chain has an explicit auditable terminal state.

**Architecture:** Add `audit_signing_key_rotation_acceptance` as a typed backend/API/client/ledger event. The acceptance must reference an existing `audit_signing_key_runtime_reload_execution` event, inherit the same proposed key and evidence chain identifiers, require five explicit confirmations, redact sensitive metadata, and keep `liveTradingAllowed=false` and `paperOnly=true`.

**Non-Goals:** Do not activate the proposed signing key, do not write env vars, do not restart containers, do not connect live execution, and do not change report signing behavior.

---

### Task 1: Backend RED And Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/audit_signing.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] Add a failing API contract test for `/api/audit/signing-keys/rotation-acceptances`.
- [x] Require an existing runtime reload execution event and return a specific 404 when it is missing.
- [x] Record blocked acceptance when confirmations are absent.
- [x] Record `acceptance_recorded` when all confirmations pass.
- [x] Ensure raw secrets, tokens, API keys, and private keys do not leak.

### Task 2: Frontend Typed API

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] Add RED tests for URL builders, POST record, GET history, and secret-free payload validation.
- [x] Add `AuditSigningKeyRotationAcceptance` types.
- [x] Add `recordAuditSigningKeyRotationAcceptance` and `loadAuditSigningKeyRotationAcceptances`.
- [x] Add runtime payload guards.

### Task 3: Workbench Ledger

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Add RED coverage for `audit_signing_key_rotation_acceptance` rows.
- [x] Add `rotation_acceptance` event kind and `acceptance_recorded` status.
- [x] Preserve acceptance mode, execution mode, reload mode, confirmation search, and paper-only boundary.

### Task 4: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the acceptance contract and ledger support.
- [x] Run backend focused test, frontend API focused test, workbench focused test, full tests, build, Docker smoke, and `git diff --check`.

**Progress:**
- 2026-06-12: Implemented backend/API acceptance contract, frontend typed client, and workbench history-row support through RED/GREEN focused tests. Audit panel action/UI is intentionally left as the next slice.
- 2026-06-12: Passed focused backend/API/workbench tests, root `npm test`, production build, Docker smoke on `http://127.0.0.1:5173`, and `git diff --check`.
