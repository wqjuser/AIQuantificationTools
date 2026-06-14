# Market Data Adapter Cache Workflow Handoff

## Goal

Turn Settings market data adapter diagnostics into an actionable path by letting users open the matching Market cache workflow from each adapter card.

## Scope

- Add a frontend model helper that resolves an adapter market to a watchlist instrument.
- Wire Settings adapter cards to select that instrument and open the Market work area.
- Keep the existing Market cache refresh controls as the execution point for single-context and watchlist cache refresh.
- Update product and architecture docs.

## Non-Goals

- No automatic cache refresh from Settings.
- No research run creation.
- No AI review, portfolio, paper order, broker, or live-trading side effects.
- No backend contract changes.

## Checklist

- [x] RED model test: missing adapter handoff resolver failed with `resolveAdapterWorkflowInstrument is not a function`.
- [x] RED layout/source test: Settings had no market adapter workflow action.
- [x] GREEN model: adapter market resolves to the first matching watchlist instrument, with current selection fallback.
- [x] GREEN UI: Settings adapter cards expose “打开缓存工作流 / Open cache workflow”.
- [x] Docs updated.

## Verification

- `npm --workspace @aiqt/web test -- --run src/lib/terminal-workbench.test.ts -t "market data adapter handoff"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "settings market data adapters"`

## Follow-Ups

- Add adapter-level external source error telemetry.
- Track rate-limit retry and backoff state per provider.
- Consider passing a preselected cache context query param into Market when users jump from Settings.
