# Stage 1 Audit Context Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent audited runs from being treated as current evidence when their market, symbol, or timeframe does not match the selected research context.

**Architecture:** Add a pure workbench model helper that compares the selected research context with the bound `ResearchRunAudit`. Backtest evidence cards, readiness gates, and report status consume that helper instead of checking only for `workspace.researchRun`.

**Tech Stack:** React, TypeScript, Vitest, existing `TerminalWorkspace` and `ResearchRunAudit` model.

---

## Scope

- Add `buildResearchRunContextBinding` for missing, matched, and mismatched audited run contexts.
- Mark Backtest data evidence as blocked when a run is mismatched.
- Keep matched runs unchanged.
- Update product and plan docs.

## Non-Goals

- No backend API change.
- No import/export contract change.
- No strategy, AI, portfolio, or execution feature expansion.
- No changes to selection helpers that already clear stale runs.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Add a model test for matched and mismatched audit context binding.
- [x] RED: Add a Backtest report test proving mismatched runs are blocked.
- [x] GREEN: Implement context binding helper and exported type.
- [x] GREEN: Wire Backtest evidence, readiness gates, and report status to the helper.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [ ] SHIP: Commit and push through proxy.

## Verification Checklist

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```

## Progress Notes

- Targeted RED checks failed as expected because `buildResearchRunContextBinding` did not exist and Backtest evidence treated mismatched runs as positive.
- Implementation also exposed that `ResearchRunSummary` omitted `market` and `symbol`; the backend dataclass, research pipeline summary, frontend type, and replay construction now carry those fields, while the helper remains compatible with old summaries.
- Targeted GREEN checks now pass for context binding and mismatched Backtest report behavior.
- Verification passed on 2026-06-08: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts` (161 tests), `npm test` (128 Python tests and 339 web tests), `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification passed on `http://127.0.0.1:5173/?workspace=research`: the Research page rendered `600000`, the readiness panel and run action were present, and browser console error count was 0.
