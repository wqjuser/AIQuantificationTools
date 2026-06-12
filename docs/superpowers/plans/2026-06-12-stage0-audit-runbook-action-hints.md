# Stage 0 Audit Runbook Action Hints Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the same disabled-action explanation used by the P0 backlog into the Audit Golden Path runbook so operators see why an action is blocked from either entry point.

**Architecture:** Keep Golden Path status and existing action routing unchanged. Add a compact `goldenPathRunbookActionHint` helper in `App.tsx` that reuses `goldenPathActionPreflightHint` for `run-pipeline` and returns local disabled reasons for paper/cache actions. Render the hint inside each Audit runbook row only when the row action exists and needs context.

**Non-Goals:** Do not change `/api/golden-path/status`, do not add a backend queue, do not loosen any disabled state, and do not unlock real trading.

---

### Task 1: Layout Contract

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add RED coverage proving Audit runbook rows derive action hints through `goldenPathRunbookActionHint`.
- [x] Assert the row hint uses the existing disabled state and Research preflight.
- [x] Assert compact Audit runbook hint CSS exists.

### Task 2: UI Helper And Rendering

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Add `goldenPathRunbookActionHint`.
- [x] Render action hints inside `GoldenPathRunbookPanel` only for actionable rows.
- [x] Keep run-pipeline preflight copy consistent with the current task card.
- [x] Add compact, non-disruptive Audit runbook hint styling.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with Audit runbook action hint behavior.
- [x] Run focused layout/P0 tests, build, Docker/browser smoke, full tests when practical, and `git diff --check`.

**Progress:**
- 2026-06-12: Planned a Stage 0 consistency slice so Audit Golden Path rows explain disabled actions with the same semantics as the P0 backlog.
- 2026-06-12: Added the RED layout contract and implemented `goldenPathRunbookActionHint` plus compact `.audit-runbook-action-hint` styling; focused runbook contract passes.
- 2026-06-12: Verified with focused P0/Golden Path tests, web build, Docker smoke, browser smoke on Audit runbook hints, full `npm test`, and `git diff --check`.
