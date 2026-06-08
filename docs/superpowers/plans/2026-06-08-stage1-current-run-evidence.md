# Stage 1 Current Run Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the current audited research run evidence in the Stage 1 Research workspace without blocking first-time pipeline creation.

**Architecture:** Keep the existing four-item research context readiness checklist as the pipeline preflight input. Add a separate pure evidence-row helper backed by `buildResearchRunContextBinding`, then render that evidence inside the Research readiness panel so users can see whether a run is missing, matched, or stale/mismatched.

**Tech Stack:** React, TypeScript, Vitest, existing `TerminalWorkspace` and research audit model.

---

## Scope

- Add a model helper for current audited run evidence rows.
- Cover missing, matched, and mismatched audited run contexts in tests.
- Render the evidence row in the Research workspace readiness panel.
- Keep pipeline preflight behavior unchanged for first-time run creation.
- Update product docs after implementation.

## Non-Goals

- No backend API change.
- No extra preflight blocker for missing audit runs.
- No layout redesign.
- No execution, portfolio, or broker adapter expansion.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Add a failing test for current audited run evidence rows.
- [x] GREEN: Add `buildResearchContextEvidenceRows` and exported type.
- [x] GREEN: Render the evidence row in `ResearchContextReadinessPanel` with Chinese labels.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [x] SHIP: Commit and push through proxy.

## Verification Checklist

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research context evidence"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```

## Progress Notes

- Started on 2026-06-08 after Stage 1 audit context binding shipped.
- RED failed as expected with `buildResearchContextEvidenceRows is not a function`.
- GREEN targeted test passed for missing, matched, and mismatched current audited run evidence rows.
- Verification passed on 2026-06-08: targeted research context evidence test, full `terminal-workbench.test.ts` (162 tests), `npm test` (128 Python tests and 340 web tests), `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification passed on `http://127.0.0.1:5173/?workspace=research`: Research readiness rendered, `600000` rendered, `审计运行` evidence row was present, five research context rows were visible, and console error count was 0.
- Shipped in commit `392b53f` and pushed through proxy to `origin/codex/p0-product-workspaces`; GitHub Actions CI run `27122926805` failed once on Docker Hub metadata timeouts, then rerun attempt 2 completed with `success`.
