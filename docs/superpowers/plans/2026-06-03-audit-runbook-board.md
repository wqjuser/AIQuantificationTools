# Audit Golden Path Runbook Board

## P0 Mapping

The Golden Path API already returns a full runbook, and the current task card shows a short preview. The audit work area should make that runbook inspectable and actionable, so users can see the complete path instead of hunting through scattered panels.

## Goal

Render the complete Golden Path runbook in the Audit workspace. Each step should show status, blocker/detail text, a workspace jump, and an action button for unfinished actionable steps.

## Scope

- Add an Audit workspace `GoldenPathRunbookPanel`.
- Reuse `goldenPath.runbook` from `/api/golden-path/status`.
- Reuse the shared Golden Path action router for refresh, pipeline, AI review, paper execution, and live gate navigation.
- Give the panel an explicit audit grid area so it does not create another tall side rail.
- Update the product plan.

## Out Of Scope

- No backend Golden Path semantics changes.
- No new AI or execution behavior.
- No broader UI redesign.

## Test Plan

- RED/GREEN layout contract test for the Audit workspace runbook panel.
- Full `npm test`.
- `npm run build`.
- Docker rebuild and smoke check on port 5173.
- Browser verification on `?workspace=audit`.

## Implementation Log

- RED: `layout-css.test.js -t "full golden path runbook board"` failed because `GoldenPathRunbookPanel` did not exist.
- GREEN: added the full Audit runbook panel, wired workspace jumps and shared Golden Path actions, and updated the audit grid to place runbook, workflow, history, and decision panels explicitly.
