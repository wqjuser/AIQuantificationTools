# Stage 0 Audit Signing Restart History UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Audit signing key controlled restart evidence visible in the existing Audit signing key rotation history, so the backend ledger step is not hidden from the operator.

**Architecture:** The backend now records `audit_signing_key_controlled_restart_evidence` events in `AuditEventStore`. This slice extends the frontend ledger row model and Audit panel history fetch to include that third event type alongside rotation plans and apply preflights.

**Non-Goals:** Do not add the UI action that submits restart evidence, do not write secrets, do not restart services, do not change active signing keys, and do not alter live-trading gates.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Extend the signing key rotation history test with an `audit_signing_key_controlled_restart_evidence` event.
- [x] Assert it becomes a restart row with `evidence_recorded`, operator, confirmation count, paper-only/live-blocked boundary, and searchable confirmation anchors.
- [x] Run the focused Vitest and verify it fails before implementation because the restart event is filtered out.

### Task 2: Frontend Model And Panel Wiring

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] Extend `AuditSigningKeyRotationLedgerRow` and status/kind unions for restart evidence rows.
- [x] Parse restart evidence metadata, compute missing confirmations from required vs confirmed confirmation ids, and include operator/apply event/live boundary search fields.
- [x] Fetch `audit_signing_key_controlled_restart_evidence` in the Audit signing key history refresh.
- [x] Render restart rows without treating them as plan rows and localize the new status labels.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the Audit UI history visibility improvement.
- [x] Run focused Vitest, full workbench Vitest, production web build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned the UI/history follow-up after the backend controlled restart evidence ledger landed.
- 2026-06-11: Added a focused Vitest case and confirmed RED because restart evidence events were filtered out of rotation history rows.
- 2026-06-11: Implemented the restart row model, confirmation parsing, Audit history fetch, and status labels; focused Vitest is green.
- 2026-06-11: Verified with focused/full workbench Vitest, production web build, full tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no app console errors, and `git diff --check`.
