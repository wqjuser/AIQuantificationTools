# Strategy Library Versioning Implementation Plan

Goal: turn the Strategy Lab draft into a reusable platform asset that can be saved, listed, reloaded, and later bound to audited backtests.

P0/P1 mapping:
- P0: strategy configuration is structured, versioned, and reproducible before backtest, AI review, and paper execution.
- P1 entry: strategy library and version management.

Scope:
- Add a local SQLite `StrategyLibraryStore`.
- Store one immutable record per stable strategy revision.
- Expose `POST /api/strategies`, `GET /api/strategies`, and `GET /api/strategies/{revision}`.
- Add frontend API contracts for save/list/detail.
- Add a minimal Strategy Lab save/list UI using the existing structured builder.
- Bind successful audited `/api/research/run` outputs back into the strategy library with the run id, so research pipelines promote the exact tested strategy revision to `audited`.
- Refresh the Strategy Lab version list after a successful frontend pipeline run.
- Keep the Strategy Lab library as a recent global strategy list, not only the current symbol, and let a saved version switch the workspace back to its bound market/symbol/timeframe as a fresh draft.

Out of scope:
- Parameter scans.
- Strategy comparison dashboards.
- Deleting or renaming saved versions.
- Live execution from saved strategies.

Progress:
- [x] Local SQLite `StrategyLibraryStore` with immutable revisions and draft/audited status.
- [x] Strategy save/list/detail API endpoints.
- [x] Strategy Lab save/list/reload controls.
- [x] Audited research runs automatically update the matching strategy revision with `auditRunId`.
- [x] Frontend pipeline refreshes the strategy library after a successful audited run.
- [x] Loading a saved strategy version switches the research context to its saved market/symbol/timeframe, clears stale run evidence, and requires a new pipeline run before AI review or execution.

Verification:
- Backend unit and API tests for save/list/detail.
- Backend API test that `/api/research/run` writes the audited strategy revision to the library.
- Frontend API tests for URL builders, validation, save, and list.
- Frontend workspace test that a saved strategy version restores the saved context and clears stale audited evidence.
- Layout tests for Strategy Lab save/list affordances.
- Layout test that the pipeline refreshes the strategy library after a successful run.
- Full `npm test`, `npm run build`, and browser smoke check.
