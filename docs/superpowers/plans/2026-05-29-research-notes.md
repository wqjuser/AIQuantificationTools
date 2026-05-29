# Research Notes Implementation Plan

Goal: make the Research Terminal store real context notes by market, symbol, and timeframe instead of leaving research commentary as transient UI text.

P0 mapping:
- Product work area: Research Terminal.
- Golden path step: market data -> research context -> strategy/backtest evidence.
- User task: record observations, data quality concerns, and next checks for the active instrument/timeframe.

Scope:
- Add a local SQLite `ResearchNoteStore`.
- Expose `GET /api/research/notes?market=...&symbol=...&timeframe=...`.
- Expose `POST /api/research/notes` for saving the selected context note.
- Add frontend API contracts for loading and saving notes.
- Add a Research Notes panel to the Research Terminal workspace.
- Auto-load notes when the selected market, symbol, or timeframe changes.

Out of scope:
- Full rich-text editing.
- Note history and diffing.
- Attaching notes into exported research packages.
- Feeding notes into AI review prompts.

Progress:
- [x] Backend note store and API contract.
- [x] Frontend API client load/save helpers.
- [x] Research workspace note editor with local-core persistence.
- [x] Plan, architecture, and product documentation updated.

Verification:
- Backend API test for empty, saved, and reloaded context notes.
- Frontend API tests for URL, load, and save contracts.
- Layout test for the persistent Research Notes panel.
- Full `npm test`, `npm run build`, and browser smoke check.
