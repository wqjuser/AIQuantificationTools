# Golden Path Runbook Preview

## P0 Mapping

P0 requires the golden path to feel like an actionable workflow, not a hidden API payload. The core now returns `runbook`, so the web app should surface the current blocker and near-future steps in the current task area without redesigning the whole page.

## Goal

Show a compact Golden Path runbook preview in the current task card. It should display the current unpassed step plus the next unpassed steps, using the backend runbook as the source of truth.

## Scope

- Add a workbench model helper to derive a small preview from `goldenPath.runbook`.
- Render the preview in the existing current task card.
- Keep the layout compact and horizontal on desktop.
- Update product planning notes.

## Out Of Scope

- No new full-page task queue.
- No change to Golden Path backend semantics.
- No new trading, AI, or execution behavior.

## Test Plan

- RED/GREEN model test for `buildGoldenPathRunbookPreview`.
- RED/GREEN layout contract test for the visible runbook preview.
- Full `npm test`.
- `npm run build`.
- Docker rebuild, smoke check, and browser verification on port 5173.

## Implementation Log

- RED: `terminal-workbench.test.ts` failed because `buildGoldenPathRunbookPreview` did not exist.
- GREEN: added a model helper that returns the first unpassed runbook item and the next two unpassed items.
- RED: `layout-css.test.js` failed because the current task card did not render the runbook preview.
- GREEN: current task card now renders a compact `golden-path-runbook` checklist from `goldenPath.runbook`.
