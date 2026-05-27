# Research Contract Optimization Design

## Goal

Stabilize AIQuantificationTools as a reproducible local quant research workbench. The first optimization track makes every research run addressable, replayable, and safe for later AI, comparison, export, and paper execution features.

## Recommended Direction

Use a data-and-backtest-first path, with AI evidence grounding added on top. UI refinements should support the research workflow, but the core optimization priority is contract stability: data source metadata, strategy snapshot, backtest assumptions, trades, equity curve, diagnostics, decisions, and execution mode must remain tied to a run id.

## Architecture

- Python core remains the source of truth for research runs.
- `ResearchRunStore` owns persistence and run lookup.
- HTTP API exposes list and detail endpoints:
  - `GET /api/research/runs?limit=5`
  - `GET /api/research/runs/{runId}`
- Frontend API helpers validate both list and detail payloads before applying them to the terminal workbench.
- The terminal workbench replays audited runs from the validated run detail contract, not from stale local projections.

## Data Flow

1. User runs the research pipeline from the terminal.
2. Python core fetches K lines, builds the strategy config, runs the backtest, generates local AI notes, and records an audit row.
3. Frontend refreshes recent run history.
4. When a run is replayed, the frontend can request the run by id and then restore the workspace from the audited detail payload.

## Error Handling

- Missing run ids return `404` with `research_run_not_found`.
- Invalid frontend detail payloads fall back without mutating the current workspace.
- Demo or fallback data remains visible through source and quality fields; future optimization should prevent silent fallback from being treated as certified research evidence.

## Testing

- Backend tests cover `ResearchRunStore.get`, detail payload serialization, API `200`, and API `404`.
- Frontend tests cover detail URL encoding, successful detail loading, invalid detail fallback, and replay helpers preserving audited run data.
- Existing full checks remain: `npm test` and `npm run build`.

## Next Tracks

1. Data quality expansion: source, missing bars, timezone, adjusted/unadjusted, freshness.
2. Structured strategy config: no longer parse visual rules only from free text.
3. Backtest realism: fee models, slippage, lot size, precision, benchmark comparison.
4. AI committee grounding: only summarize evidence present in the run detail contract.
5. Paper execution persistence: orders and risk gates bound to audited run ids.
