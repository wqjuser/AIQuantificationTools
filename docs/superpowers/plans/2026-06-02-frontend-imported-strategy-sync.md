# Frontend Imported Strategy Library Sync Plan

## Objective

After importing an `aiqt.researchRun.export` package, the web client should refresh the same-context strategy library and show the restored audited strategy version in Strategy Lab without requiring a page reload.

## Product Rationale

The backend restores `researchRun.strategyConfig` into `StrategyLibraryStore` during import. If the frontend only replays the audit run, Strategy Lab can still look stale even though the audited strategy version exists locally. Import should restore the whole research workflow: audit run, chart snapshot, research note, AI review history, paper execution history, and the strategy version that users can continue from.

## Implementation Steps

1. Extend the frontend import API client test so successful import is followed by `GET /api/strategies?market=...&symbol=...&limit=12`.
2. Return restored same-context strategies from `importResearchRunExport`.
3. Update the App import flow to merge restored strategies into the existing Strategy Lab list by revision.
4. Update product and architecture docs.

## Acceptance Criteria

- Successful import still posts the package to `/api/research/runs/import`.
- The client then reads the restored research note and same-context strategy library.
- The import result includes restored audited strategy versions when the core returns them.
- The App merges restored strategies into Strategy Lab without duplicating revisions.
- Strategy library readback failure does not turn an otherwise successful import into a failed import.

## Verification Log

- Passed red: frontend API test failed because import did not call `/api/strategies`.
- Passed green: targeted `terminal-api.test.ts` passed after import readback returned restored strategies.
- Passed: full `npm test` with Python 78 tests and frontend 211 tests.
- Passed: `npm run build`; Vite reported the existing large chunk warning.
- Passed: `git diff --check`; only CRLF normalization warnings were reported.
- Pending: commit and push.
