# Stage 1: Export Index Preparation Evidence

## Goal

Expose the locked data preparation evidence in the recent research export package index, so an operator can find the source cache refresh from the package list before opening a specific export package.

## Scope

- Add a compact preparation evidence artifact label to `buildResearchRunExportIndexRows`.
- Make the existing export index search match that label through the current `artifacts` field.
- Keep the export package schema unchanged; reuse `researchRun.dataSnapshot.preparationEvidence`.
- Update the Stage 1 product plan after verification.

## Test Plan

- Add a failing unit test that expects the recent export package index to show `prep <runId>`.
- Verify the same row can be found by searching the preparation evidence run id.
- Run the terminal workbench/API test suite, web build, quant core Python tests, Docker compose, and browser smoke.

## Progress

- [x] Plan recorded.
- [x] Failing test added.
- [x] Export index implementation added.
- [x] Product plan updated.
- [x] Verification completed.
- [x] Changes committed and pushed.
