# Stage 0 Audit Signing Rotation Chain Summary Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Audit signing key rotation evidence chain readable as a single closure summary instead of forcing users to infer completion from individual ledger rows.

**Architecture:** Derive a pure `AuditSigningKeyRotationChainSummary` from existing rotation ledger rows. The summary groups the latest proposed key across six paper-only stages: rotation plan, secret materialization, environment binding, runtime reload plan, runtime reload execution, and final rotation acceptance. The UI renders that summary above the compact ledger history and keeps the live-trading boundary explicit.

**Non-Goals:** Do not add a new backend endpoint, do not activate a signing key, do not write secrets or environment variables, and do not change the ledger event contract.

---

### Task 1: Workbench Summary Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Add RED coverage proving a completed acceptance chain reports `complete`, `6/6`, no missing stages, and live remains blocked.
- [x] Add coverage proving a chain without final acceptance reports `in_progress` with next stage `rotation_acceptance`.
- [x] Add `AuditSigningKeyRotationChainSummary` and stage types.
- [x] Implement `buildAuditSigningKeyRotationChainSummary` from existing ledger rows.

### Task 2: Audit UI Integration

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/styles.css`

- [x] Add RED layout contract coverage for the chain summary import, computation, panel prop, rendering hooks, and CSS blocks.
- [x] Compute the summary from full ledger rows while keeping the visible history list compact.
- [x] Render a compact chain summary above rotation history with stage status, event id/date, and localized headline/detail.
- [x] Add compact CSS for summary state, stage grid, complete and blocked styling.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the evidence-chain summary behavior.
- [x] Run focused workbench/layout tests, full tests, build, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-12: Verified RED workbench failure for missing `buildAuditSigningKeyRotationChainSummary`, implemented the pure summary model, then verified the focused workbench test passed.
- 2026-06-12: Verified RED layout failure for missing App/UI wiring, then added the Audit panel chain summary and focused layout test passed.
- 2026-06-12: Verified focused workbench/layout tests, full `npm test`, production web build, Docker smoke, browser smoke on `/?workspace=audit`, and whitespace diff check.
