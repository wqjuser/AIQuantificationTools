# Stage 0 Audit Signing Secret Materialization UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Audit operators record and inspect signing key secret-store materialization manifests from the Signing Key Registry panel.

**Architecture:** The backend/client contract for `POST/GET /api/audit/signing-keys/secret-materializations` already exists. This slice wires it into the Audit workspace: save the rotation plan audit event id, expose four explicit confirmations, call `recordAuditSigningKeySecretMaterialization`, merge the returned audit event into the rotation history, and teach `buildAuditSigningKeyRotationLedgerRows` to show materialization events.

**Non-Goals:** Do not accept raw signing secrets, do not write environment variables, do not restart containers, do not activate a proposed key, and do not loosen paper-only/live-blocked boundaries.

---

### Task 1: RED Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add a model test requiring `audit_signing_key_secret_materialization` events in the signing key rotation ledger.
- [x] Assert materialization rows show `manifest_recorded`, `local_secret_store_manifest`, confirmation counts, paper-only boundary, and are searchable by confirmation id/operator.
- [x] Add a source-level UI wiring test requiring the Audit panel import, state, callbacks, props, confirmation fields, action button, and CSS block.
- [x] Run focused tests and verify they fail before implementation.

### Task 2: Workbench Model And UI Wiring

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Extend signing key rotation ledger rows with `materialization` event kind and `manifest_recorded` status.
- [x] Include materialization events in Audit signing key history refresh.
- [x] Restore latest materialization payload through `loadAuditSigningKeySecretMaterializations`.
- [x] Store the rotation plan audit event id after plan ledger save.
- [x] Add secret materialization confirmations and `recordAuditSigningKeySecretMaterializationForAudit`.
- [x] Render a compact Secret-store materialization section in the Signing Key Registry panel.
- [x] Style the new section and successful `manifest_recorded` result state.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the completed Audit UI materialization action/history.
- [x] Run focused Vitest, terminal API/workbench/layout Vitest, production web build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned the UI follow-up after backend/client materialization contract landed.
- 2026-06-11: Added RED tests for ledger model support and Audit panel wiring; model failed on missing event kind and UI failed on missing API/action wiring.
- 2026-06-11: Implemented materialization ledger row support, Audit state/callbacks, panel controls, result rendering, history merge, and styling.
- 2026-06-11: Verified focused Vitest, API/workbench/layout Vitest, production build, full `npm test`, Docker smoke on port 5173, browser smoke for generate plan -> record materialization -> history row, and `git diff --check`.
