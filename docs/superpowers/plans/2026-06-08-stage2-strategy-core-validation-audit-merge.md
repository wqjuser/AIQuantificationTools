# Stage 2 Strategy Core Validation Audit Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent core strategy validation results from overriding the frontend's audit-run context gate in Strategy Lab.

**Architecture:** Keep `/api/strategies/validate` as the source for schema, risk, and execution validation. Add a frontend model helper that merges core validation gates with the local `buildStrategyReadinessGates` audit gate, so market/symbol/timeframe binding remains enforced even when the core only receives an `auditRunId`.

**Tech Stack:** React, TypeScript, Vitest, existing Strategy Lab readiness model.

---

## Scope

- Add a model test proving a core `audit` gate marked passed is replaced by a local blocked audit context gate.
- Add a small merge helper for Strategy Lab readiness gates.
- Wire App rendering to the helper.
- Keep backend API and Python validation unchanged.
- Update product docs and this plan.

## Non-Goals

- No backend audit run lookup in `/api/strategies/validate`.
- No strategy editor UI redesign.
- No changes to schema, risk, or execution gate semantics.
- No changes to run pipeline API.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Add failing test for merging core validation gates with local audit context.
- [x] GREEN: Implement `mergeStrategyReadinessGatesWithLocalAudit`.
- [x] GREEN: Use the helper in `App.tsx` when choosing Strategy Lab readiness gates.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [x] SHIP: Commit and push through proxy.

## Verification Checklist

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "keeps local audit context gate"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```

## Progress Notes

- Started on 2026-06-08 after Strategy Lab audit context gate shipped.
- RED failed as expected with `mergeStrategyReadinessGatesWithLocalAudit is not a function`.
- GREEN targeted test passed after App readiness selection merged core gates with the local audit context gate.
- Verification passed on 2026-06-08: targeted merge test, full `terminal-workbench.test.ts` (164 tests), `npm test` (128 Python tests and 342 web tests), `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification passed on `http://127.0.0.1:5173/?workspace=strategy`: Strategy Lab rendered, validation source label was visible, audit evidence label was present, four readiness gates were visible, and console error count was 0.
- Shipped in commit `005aa60` and pushed through proxy to `origin/codex/p0-product-workspaces`; GitHub Actions CI run `27125592399` completed with `success`.
