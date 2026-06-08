# Stage 2 Strategy Audit Context Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Strategy Lab refuse stale audited run evidence when the saved run does not match the selected market, symbol, or timeframe.

**Architecture:** Reuse the existing `buildResearchRunContextBinding` helper so Research, Strategy, Backtest, AI, and execution gates converge on the same audit evidence boundary. Keep Strategy Lab's schema, risk, and execution gates unchanged; only tighten the audit evidence gate.

**Tech Stack:** React, TypeScript, Vitest, existing `TerminalWorkspace` and strategy readiness model.

---

## Scope

- Add a Strategy Lab model test for mismatched audited run context.
- Update `buildStrategyReadinessGates` audit gate to consume `buildResearchRunContextBinding`.
- Keep missing run behavior as review, not blocked, so users can still run the pipeline.
- Update product docs and this plan.

## Non-Goals

- No backend API change.
- No strategy editor UI redesign.
- No new strategy DSL.
- No changes to Backtest or Execution gates.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Add failing Strategy Lab readiness test for mismatched audit context.
- [x] GREEN: Wire Strategy Lab audit gate to `buildResearchRunContextBinding`.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [ ] SHIP: Commit and push through proxy.

## Verification Checklist

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "blocks Strategy Lab audit evidence"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```

## Progress Notes

- Started on 2026-06-08 after Stage 1 current run evidence shipped.
- RED failed as expected: Strategy Lab treated a mismatched run id as passed audit evidence.
- GREEN targeted test passed after wiring the audit gate to the shared run context binding.
- Verification passed on 2026-06-08: targeted Strategy Lab audit evidence test, full `terminal-workbench.test.ts` (163 tests), `npm test` (128 Python tests and 341 web tests), `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification passed on `http://127.0.0.1:5173/?workspace=strategy`: Strategy Lab rendered, `600000` rendered, four readiness gates were visible, audit evidence label was present, and console error count was 0.
