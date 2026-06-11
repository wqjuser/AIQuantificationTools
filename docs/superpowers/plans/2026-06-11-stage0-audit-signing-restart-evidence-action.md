# Stage 0 Audit Signing Restart Evidence Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an Audit operator record controlled restart evidence from the Signing Key Registry panel after a rotation apply preflight reaches `ready_for_restart`.

**Architecture:** The backend already exposes `POST /api/audit/signing-keys/rotation-restart-evidence` and writes `audit_signing_key_controlled_restart_evidence`. This slice adds a typed frontend API client, panel state, four explicit operator confirmations, result rendering, and immediate history merge.

**Non-Goals:** Do not write raw signing secrets, do not mutate environment variables, do not restart containers, do not activate a real signing key, and do not allow live trading or live signing routes.

---

### Task 1: RED Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add an API client contract test for recording Audit signing key controlled restart evidence.
- [x] Assert the request posts `applyEventId`, operator, four confirmations, and metadata to `/api/audit/signing-keys/rotation-restart-evidence`.
- [x] Assert the response parses `restartEvidence`, `auditEvent`, redacted secret-like metadata, and keeps `liveTradingAllowed=false`.
- [x] Add a source-level Audit panel wiring test requiring restart evidence state, props, confirmation fields, and submit handler.
- [x] Run focused tests and verify they fail before implementation.

### Task 2: Frontend API And Audit Panel

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Add typed request/result contracts and URL builder for Audit signing key restart evidence.
- [x] Add `recordAuditSigningKeyControlledRestartEvidence` with 409/blocking response support and redacted metadata validation.
- [x] Store the saved rotation apply audit event id after apply preflight ledger save.
- [x] Add four restart evidence confirmations, a submit action, result rendering, and history merge from the returned audit event.
- [x] Add compact visual styling for the restart evidence subsection and `evidence_recorded` result state.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the completed front-end restart evidence action.
- [x] Run focused Vitest, full terminal API/layout/workbench Vitest, production web build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned the action follow-up after backend restart evidence and history visibility landed.
- 2026-06-11: Added RED tests for API client and Audit panel wiring; both failed on missing exports/wiring.
- 2026-06-11: Implemented the API client, App state, confirmation UI, submit action, result rendering, and product-plan update.
- 2026-06-11: Verified focused RED/GREEN tests, full terminal API/layout/workbench Vitest, production web build, full Python and web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke through the Audit UI flow with zero app console errors, and `git diff --check`.
