# Workspace Gate Summary

## P0 Mapping

Golden Path navigation now jumps between product work areas. The next usability gap is that a selected work area must explain its own gate state, not only the global current blocker.

## Goal

Show a compact gate summary for the active product work area in the current task card. The summary is derived from `/api/golden-path/status` workspaces and runbook data, so users can see why the selected page is ready, needs a run, or blocked.

## Scope

- Add a model helper that derives selected work-area context from Golden Path workspaces and runbook items.
- Render the active work-area context in the existing module focus card.
- Keep the summary compact and non-intrusive.
- Update the product plan.

## Out Of Scope

- No new backend Golden Path semantics.
- No full task queue page.
- No workflow layout redesign.

## Test Plan

- RED/GREEN model tests for selected work-area Golden Path context.
- RED/GREEN layout contract test for rendering the active work-area summary.
- Full `npm test`.
- `npm run build`.
- Docker rebuild, smoke check, and browser verification on port 5173.

## Implementation Log

- RED: `terminal-workbench.test.ts -t "work-area context"` failed because `buildGoldenPathWorkspaceContext` did not exist.
- GREEN: added `buildGoldenPathWorkspaceContext` to derive status, step progress, blocker detail, and action label from Golden Path workspaces and runbook items.
- RED: `layout-css.test.js -t "active work-area"` failed because the current task card did not render active work-area context.
- GREEN: the module focus card now renders a compact `workspace-gate-summary` for the selected work area.
