# Stage 0 Audit Signing Environment Binding UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Audit signing key environment binding contract into the Signing Key Registry panel so operators can record and inspect redacted runtime binding evidence after a secret-store materialization manifest.

**Architecture:** Reuse `recordAuditSigningKeyEnvironmentBinding` and `loadAuditSigningKeyEnvironmentBindings`. The Audit workspace refresh reads both generic `audit_signing_key_environment_binding` events and typed binding history. The Signing Key Registry panel gets a compact environment binding section after Secret-store materialization and before rotation apply preflight. `buildAuditSigningKeyRotationLedgerRows` treats binding as a confirmation event with `binding_recorded`, `environment_binding`, `binding` short hash, required env var count, confirmation search, and paper-only/live-blocked state.

**Non-Goals:** Do not write environment variables, do not restart containers, do not activate the proposed signing key, do not accept raw signing secrets, and do not enable live trading.

---

### Task 1: RED Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add a model test requiring `audit_signing_key_environment_binding` events in the signing key rotation ledger.
- [x] Assert binding rows show `binding_recorded`, `container_env_reference`, env var count, confirmation counts, paper-only boundary, and are searchable by confirmation id/operator.
- [x] Add a source-level UI wiring test requiring the Audit panel import, state, callbacks, props, confirmation fields, action button, and CSS block.
- [x] Run focused tests and verify they fail before implementation.

### Task 2: Workbench Model And UI Wiring

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Extend signing key rotation ledger rows with `environment_binding` event kind and `binding_recorded` status.
- [x] Include environment binding events in Audit signing key history refresh.
- [x] Restore latest environment binding payload through `loadAuditSigningKeyEnvironmentBindings`.
- [x] Add environment binding confirmations and `recordAuditSigningKeyEnvironmentBindingForAudit`.
- [x] Render a compact environment binding evidence section in the Signing Key Registry panel.
- [x] Style the new section and successful `binding_recorded` result state.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the completed Audit UI environment binding action/history.
- [x] Run focused Vitest, terminal API/workbench/layout Vitest, production web build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Added RED tests for environment binding ledger model support and Audit panel wiring; model failed on missing binding row and UI failed on missing API/action wiring.
- 2026-06-11: Implemented binding ledger row support, Audit state/callbacks, panel controls, result rendering, history merge, and styling.
- 2026-06-11: Verified focused Vitest, API/workbench/layout Vitest, production build, full `npm test`, Docker smoke on port 5173, browser smoke for generate plan -> record materialization -> record environment binding -> history row, console error check, and `git diff --check`.
