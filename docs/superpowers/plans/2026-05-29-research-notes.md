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
- Lock the current note snapshot into audited research runs.
- Carry the locked note through run detail, export packages, imports, and AI evidence cards.

Out of scope:
- Full rich-text editing.
- Note history and diffing.
- AI prompt enrichment beyond displaying the locked note as evidence.

Progress:
- [x] Backend note store and API contract.
- [x] Frontend API client load/save helpers.
- [x] Research workspace note editor with local-core persistence.
- [x] `ResearchRunAudit` stores a normalized `researchNote` snapshot.
- [x] Research run export/import preserves the locked note and validates `artifactCounts.researchNotes`.
- [x] AI evidence cards and review dossier display the locked note snapshot when present.
- [x] Plan, architecture, and product documentation updated.

Verification:
- Backend API test for empty, saved, and reloaded context notes.
- Backend API test that `/api/research/run` locks the current note into the audit record.
- Backend export/import test for research note evidence.
- Frontend API tests for URL, load, and save contracts.
- Frontend API export package test for `researchNotes` count and `researchNote` payload.
- Frontend workbench test for AI evidence/dossier note citations.
- Layout test for the persistent Research Notes panel.
- Full `npm test`, `npm run build`, and browser smoke check.
