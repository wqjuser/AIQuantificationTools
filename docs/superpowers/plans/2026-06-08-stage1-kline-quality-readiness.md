# Stage 1 K-Line Quality Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Research context readiness checklist from treating risky K-line data as fully ready.

**Architecture:** Update the Stage 1 workbench model so K-line readiness derives from row count, completeness, warning presence, and source risk. The React layer only localizes any new detail phrases; it does not infer data quality itself.

**Tech Stack:** React, TypeScript, Vitest, existing data-quality metadata.

---

## Scope

- Mark K-line data with warnings as `review`, even when rows exist and `isComplete` is true.
- Mark `demo-fallback` and `unknown` K-line sources as `review`, even when rows exist.
- Keep zero-row K-line data as `blocked`.
- Keep the existing refresh-cache action for blocked/review K-line rows.
- Update product and plan docs.

## Non-Goals

- No new data provider.
- No changes to chart loading.
- No changes to strategy, backtest, AI, portfolio, or execution stages.
- No hard block for complete local-cache data; local-cache remains usable when complete and warning-free.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Add a model test for complete K-line data with warnings.
- [x] RED: Add a model test for demo fallback K-line data with rows.
- [x] GREEN: Add K-line source risk detection in `buildResearchContextReadinessRows`.
- [x] GREEN: Keep review rows actionable via `refresh-cache`.
- [x] GREEN: Localize the source-risk detail phrase.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [x] SHIP: Commit and push through proxy.

## Progress Notes

- Targeted RED checks failed as expected because warning and `demo-fallback` K-line rows were still marked `ready`.
- Targeted GREEN check now passes for `terminal-workbench.test.ts`.
- Verification passed on 2026-06-08: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts` (157 tests), `npm test` (128 Python tests and 335 web tests), `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification passed on `http://127.0.0.1:5173/?workspace=research`: research page rendered selected symbol `600000`, key research/chart sections were present, and browser console error count was 0.
- Shipped in commit `1a918a0` and pushed through proxy to `origin/codex/p0-product-workspaces`; GitHub Actions CI run `27119110644` completed with `success`.

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
