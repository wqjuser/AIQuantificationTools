# Stage 1 Actionable Research Readiness Plan

## Goal

Turn the Research workspace readiness checklist from a passive status panel into a compact Stage 1 action surface.

The first usable product loop is still:

```text
select symbol -> load data/cache -> inspect chart -> save research note -> build strategy context
```

This change keeps the scope inside Stage 1. It does not add AI, portfolio, or live execution features.

## Product Rationale

The checklist already tells the user whether symbol, K-line data, cache, and notes are ready. The missing product behavior is the next action. A blocked cache row should let the user refresh the current cache. A missing research note should let the user save the current note draft without hunting for another panel.

## Scope

- Add explicit action metadata to `ResearchContextReadinessRow`.
- Surface cache refresh actions for blocked/review data and cache rows.
- Surface a save-note action for unsaved/review note rows.
- Wire the actions to existing Stage 1 callbacks in `App.tsx`.
- Keep the panel compact and avoid new layout churn.
- Update tests and product documentation.

## Non-Goals

- No new data provider.
- No strategy generation.
- No AI review.
- No simulated/live order flow.
- No redesign of the full workspace layout.

## Implementation Steps

- [x] RED: Extend model tests to require readiness actions.
- [x] RED: Extend layout/source tests to require action wiring and CSS.
- [x] GREEN: Add `ResearchContextReadinessAction` and action assignment in the workbench model.
- [x] GREEN: Render action buttons in the Research readiness panel and wire existing callbacks.
- [x] GREEN: Add compact action CSS.
- [x] DOCS: Update this plan and the product plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker config/build/smoke, and git diff checks.
- [ ] SHIP: Commit and push through proxy.

## Progress Notes

- Targeted RED checks failed as expected because readiness rows had no `action` metadata and the panel did not wire `onSaveNote`.
- Targeted GREEN checks now pass for `terminal-workbench.test.ts` and `layout-css.test.js`.
- Full verification passed: targeted tests, `npm test`, production build, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification at `2048x1200` confirmed the Research workspace renders the readiness panel, exposes the note action, has no horizontal overflow, and logs no warning/error messages.

## Verification Checklist

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm --prefix apps/web test -- --run src/lib/layout-css.test.js
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```
