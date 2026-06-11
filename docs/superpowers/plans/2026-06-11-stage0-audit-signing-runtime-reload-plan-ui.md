# Stage 0 Audit Signing Runtime Reload Plan UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the Audit signing key runtime reload plan ledger contract in the Audit workspace so operators can record and review the next paper-only signing key rotation evidence step after environment binding.

**Architecture:** Extend the existing Audit signing key rotation history row model to include `audit_signing_key_runtime_reload_plan` events, then connect the Audit signing key registry panel to `recordAuditSigningKeyRuntimeReloadPlan` and `loadAuditSigningKeyRuntimeReloadPlans`. The UI remains local-first and evidence-only: it records confirmations and audit events, but does not write env vars, restart containers, activate signing keys, or enable live trading.

**Non-Goals:** Do not redesign the Audit workspace layout, do not add actual container reload execution, do not accept raw signing secrets, and do not change execution adapter live-routing gates.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add an `audit_signing_key_runtime_reload_plan` event to the signing key rotation history fixture.
- [x] Assert row status `plan_recorded`, event kind `runtime_reload_plan`, `reload` tag, confirmation count, env count, paper-only boundary, and filter matches.
- [x] Run the focused test and verify it fails before implementation because the event is filtered out.

### Task 2: Workbench Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Extend signing key rotation ledger event kind and status unions.
- [x] Include runtime reload plan events in history rows.
- [x] Map reload mode, binding id, required env vars, confirmation ids, status label, tag, and positive tone.

### Task 3: Audit Workspace UI

**Files:**
- Modify: `apps/web/src/App.tsx`

- [x] Load runtime reload plan audit events and typed history during Audit refresh.
- [x] Add runtime reload plan state, confirmations, recording state, and reset behavior when earlier evidence changes.
- [x] Add the panel action for recording runtime reload plans after environment binding.
- [x] Add compact UI copy, status labels, and blocker reason labels.

### Task 4: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the UI/history integration.
- [x] Run focused model tests, production build, full tests, Docker smoke, browser verification, and `git diff --check`.

**Progress:**
- 2026-06-11: Verified the focused history-row RED failure, implemented model/UI integration, passed the focused test and production build, and confirmed the Audit panel renders the new runtime reload plan section in the in-app browser after preparing a rotation plan.
