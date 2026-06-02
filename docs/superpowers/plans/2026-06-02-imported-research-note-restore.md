# Imported Research Note Restore Plan

## Objective

When an `aiqt.researchRun.export` package is imported, restore the package's non-empty `researchRun.researchNote` into the local `ResearchNoteStore` for the original market, symbol, and timeframe.

## Product Rationale

Importing a research run should restore more than the chart, backtest, strategy version, simulated execution, and AI review records. The locked research note is the user's editable context for why a symbol was studied. If that note remains trapped inside the imported audit record, the user can replay history but cannot continue the research workflow naturally.

## Implementation Steps

1. Add a failing API contract test proving `/api/research/runs/import` writes the imported research note into `/api/research/notes`.
2. Wire import success to save a non-empty `audit.research_note` into `ResearchNoteStore`.
3. Preserve the imported note timestamp when it is parseable.
4. Update product and architecture docs.

## Acceptance Criteria

- Importing a research run package with a non-empty `researchRun.researchNote.body` writes the note to the local note store.
- The restored note is readable via `GET /api/research/notes?market=...&symbol=...&timeframe=...`.
- Empty or missing research notes do not create noisy local note records.
- Manifest count validation for `researchNotes` remains enforced by the export/import package parser.
- Tests and docs reflect the behavior.

## Verification Log

- Passed red: target import API test failed because imported note body was not restored to `/api/research/notes`.
- Passed green: target import API test passed after saving non-empty imported research notes to `ResearchNoteStore`.
- Passed: full `npm test` with Python 78 tests and frontend 211 tests.
- Passed: `npm run build`; Vite reported the existing large chunk warning.
- Passed: `git diff --check`; only CRLF normalization warnings were reported.
- Pending: commit and push.
