# Stage 0 Audit Signing Runtime Reload Execution UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the Audit signing key runtime reload execution ledger contract in the Audit workspace so operators can record and review the paper-only execution evidence step after a runtime reload plan.

**Architecture:** Reuse the existing Audit signing key rotation history model and registry panel. The UI records five explicit confirmations through `recordAuditSigningKeyRuntimeReloadExecution`, reloads recent typed execution history through `loadAuditSigningKeyRuntimeReloadExecutions`, and merges `audit_signing_key_runtime_reload_execution` events into the same ledger list as plan/apply/restart/materialization/binding/reload-plan evidence.

**Non-Goals:** Do not restart containers, do not write env vars, do not accept raw signing secrets, do not activate a new signing key, do not connect live brokers, and do not change live-routing gates.

---

### Task 1: RED Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add an `audit_signing_key_runtime_reload_execution` event to the signing key rotation history fixture.
- [x] Assert row status `execution_recorded`, event kind `runtime_reload_execution`, confirmation count, reload/execution modes, proposed key, operator, and paper-only boundary.
- [x] Assert the Audit workspace passes runtime reload execution state/actions into `AuditSigningKeyRegistryPanel`.
- [x] Run focused tests and verify they fail before implementation.

### Task 2: Workbench Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Extend signing key rotation ledger event kind and status unions.
- [x] Include runtime reload execution events in history rows.
- [x] Map execution mode, reload mode, plan id, confirmation ids, status label, tag, and positive tone.
- [x] Tighten confirmation-id search so generic terms like `blocked` do not accidentally match exact confirmation ids.

### Task 3: Audit Workspace UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Load runtime reload execution audit events and typed history during Audit refresh.
- [x] Add runtime reload execution state, confirmations, recording state, and reset behavior when earlier evidence changes.
- [x] Add the panel action for recording runtime reload execution evidence after a reload plan.
- [x] Add compact UI copy, status labels, blocker reason labels, and success styling.

### Task 4: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the UI/history integration.
- [x] Run focused model/layout tests.
- [x] Run frontend API tests, full web tests, production build, Docker smoke, browser verification, and `git diff --check`.

**Progress:**
- 2026-06-12: Verified the focused history-row and layout RED failures, implemented model/UI integration, and passed the focused history-row test after tightening confirmation-id search.
- 2026-06-12: Passed the related model/layout files, audit signing runtime reload execution API client test, full root test suite, production build, Docker smoke on `http://127.0.0.1:5173`, and in-app browser Audit page verification for the new execution evidence section.
