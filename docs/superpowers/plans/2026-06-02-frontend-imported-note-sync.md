# Frontend Imported Research Note Sync Plan

## Objective

After importing an `aiqt.researchRun.export` package, the web client should read back the restored local research note and refresh the Research workspace note draft.

## Product Rationale

The backend now restores non-empty `researchRun.researchNote` into `ResearchNoteStore` during import. If the frontend only replays the audit run, the user can see the locked note in evidence cards but may still edit an old or empty note draft. Import should feel like continuing the same research context, not just replaying a historical chart.

## Implementation Steps

1. Extend the frontend import API client test so successful import is followed by `GET /api/research/notes`.
2. Return the restored note from `importResearchRunExport` when it can be read from the core.
3. Update the App import flow to set `researchNoteState` and `researchNoteDraft` from the restored note, falling back to the audit note snapshot if readback is unavailable.
4. Update product and architecture docs.

## Acceptance Criteria

- Successful import sends the original package to `/api/research/runs/import`.
- The client then reads `/api/research/notes?market=...&symbol=...&timeframe=...`.
- The import result carries the restored note when the core returns one.
- App import flow refreshes the editable note draft for the imported context.
- If note readback fails, the run import still succeeds and can fall back to the audit note snapshot.

## Verification Log

- Passed red: frontend API test failed because import did not call `/api/research/notes`.
- Passed green: targeted `terminal-api.test.ts` passed after import readback returned the restored note.
- Passed: full `npm test` with Python 78 tests and frontend 211 tests.
- Passed: `npm run build`; Vite reported the existing large chunk warning.
- Passed: `git diff --check`; only CRLF normalization warnings were reported.
- Pending: commit and push.
