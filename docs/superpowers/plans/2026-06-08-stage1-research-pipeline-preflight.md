# Stage 1 Research Pipeline Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Research pipeline action respect the Stage 1 readiness checklist before creating an audited run.

**Architecture:** Keep the decision in the frontend workbench model. `buildResearchContextReadinessRows` remains the source checklist; a new pure preflight helper compresses those rows into blocked/review/ready pipeline state. React consumes the preflight to disable hard-blocked run actions and ask for user confirmation when only review items remain.

**Tech Stack:** React, TypeScript, Vitest, existing readiness rows and workflow actions.

---

## Scope

- Add a model helper that derives Research pipeline preflight status from readiness rows.
- Hard block the pipeline when any readiness row is `blocked`.
- Allow `review` rows to run only after explicit user confirmation.
- Surface localized button/title messaging for blocked/review/ready states.
- Update product and plan docs.

## Non-Goals

- No backend API change.
- No new data provider.
- No strategy, backtest, AI, portfolio, or execution-stage expansion.
- No modal redesign; confirmation can use the existing browser confirm contract.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Add a model test that blocked readiness rows block pipeline execution and point to the first repair action.
- [x] RED: Add a model test that review readiness rows require confirmation but remain runnable.
- [x] GREEN: Implement the preflight helper and exported types.
- [x] GREEN: Wire the top run button and golden-path `run-pipeline` action to the preflight.
- [x] GREEN: Add localized labels and confirmation text.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [x] SHIP: Commit and push through proxy.

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

- Targeted RED checks failed as expected because `buildResearchPipelinePreflight` did not exist.
- Targeted GREEN check passed for the new research pipeline preflight tests.
- Initial TypeScript build caught a status narrowing issue in the helper; the implementation now uses `flatMap` to narrow non-ready rows without weakening exported types.
- Verification passed on 2026-06-08: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts` (159 tests), `npm test` (128 Python tests and 337 web tests), `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification passed on `http://127.0.0.1:5173/?workspace=research`: the Research page rendered `600000`, the readiness panel was present, the stabilized run action exposed the preflight title, and browser console error count was 0.
- Shipped in commit `aef4271` and pushed through proxy to `origin/codex/p0-product-workspaces`; GitHub Actions CI run `27120322472` completed with `success`.
