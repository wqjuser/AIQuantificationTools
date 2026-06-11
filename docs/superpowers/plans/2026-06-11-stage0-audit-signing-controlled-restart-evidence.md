# Stage 0 Audit Signing Controlled Restart Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the next safety ledger step after Audit signing key rotation apply preflight: an operator-controlled restart evidence record that can be audited without carrying raw signing secrets or triggering an automatic restart.

**Architecture:** Audit signing key rotation already has a plan payload and a ready/blocked apply preflight. This slice introduces a backend-only evidence contract that references a persisted `audit_signing_key_rotation_apply` audit event. The new evidence is written back to the same `AuditEventStore` as `audit_signing_key_controlled_restart_evidence`, preserving the chain `plan -> apply -> controlled restart evidence`.

**Non-Goals:** Do not write environment variables, store raw secrets, restart Docker services, enable live trading, change active signing keys, or add UI wiring in this slice.

---

### Task 1: RED Test

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] Add an API regression test that prepares a signing key rotation plan, runs the apply preflight, persists a ready apply audit event, and posts controlled restart evidence.
- [x] Assert missing confirmations return `409` with explicit blocked reasons.
- [x] Assert complete confirmations return `201`, write `audit_signing_key_controlled_restart_evidence`, redact sensitive metadata, and keep `liveTradingAllowed=false`.
- [x] Run the focused test and verify it fails before implementation with `404 != 409`.

### Task 2: Backend Contract

**Files:**
- Modify: `services/quant_core/quant_core/audit_signing.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] Add controlled restart evidence builders, payload conversion, audit-event conversion, confirmation specs, and recursive sensitive-field redaction.
- [x] Add `POST /api/audit/signing-keys/rotation-restart-evidence` to validate the referenced apply event, write the evidence event, and return blocked/recorded status.
- [x] Run the focused regression test and verify it passes.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the new backend ledger step and UI follow-up.
- [x] Run focused Python unittest, quant core unittest discovery, web workbench tests, production web build, full tests, Docker smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Picked the Audit signing key controlled restart evidence ledger as the next Stage 0 platform-safety slice.
- 2026-06-11: Added a focused API regression test and confirmed RED on the missing route.
- 2026-06-11: Implemented the backend evidence builder, recursive redaction, API route, and audit event persistence; focused regression test is green.
- 2026-06-11: Updated the product plan with the backend ledger step and verified focused Python unittest, quant core discovery, web workbench tests, production build, full tests, Docker smoke on `http://127.0.0.1:5173`, and `git diff --check`.
