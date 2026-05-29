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

Out of scope:
- Parameter scans.
- Strategy comparison dashboards.
- Deleting or renaming saved versions.
- Live execution from saved strategies.

Verification:
- Backend unit and API tests for save/list/detail.
- Frontend API tests for URL builders, validation, save, and list.
- Layout tests for Strategy Lab save/list affordances.
- Full `npm test`, `npm run build`, and browser smoke check.
