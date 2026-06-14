# Market Data Provider Health Trend Strip

## Goal

Make Settings market-data adapter cards show a compact visual trend strip for provider errors across `1h / 24h / 7d`, so Stage 1 data operations can distinguish quiet providers, recent spikes, easing failures, historical-only failures, and cooldown pressure without opening raw logs.

## Scope

- Add a pure frontend model that converts existing `providerHealth.windowSummary` into three fixed trend rows.
- Derive a summary with total errors, peak window, latest error timestamp, dominant category, momentum, tone, and search text.
- Render the summary and three window bars inside each Settings market-data adapter card.
- Keep the existing provider health text for dense audit context.
- Update product and architecture docs.

## Non-Goals

- No backend schema change or new endpoint.
- No adapter error ledger migration.
- No retry scheduler, circuit breaker executor, automatic recovery, cache refresh trigger, broker connection, paper order, or live-trading unlock.
- No full provider operations dashboard yet.

## Checklist

- [x] RED model test: provider health window summary had no visual trend projection.
- [x] GREEN model: trend rows and summary derive from `oneHour`, `twentyFourHours`, and `sevenDays`.
- [x] RED UI source test: Settings adapter cards did not render trend strips.
- [x] GREEN UI: Settings renders compact provider health trend strips.
- [x] Docs updated.

## Verification

- `npm --workspace @aiqt/web test -- --run src/lib/terminal-workbench.test.ts -t "provider health trend"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "provider health trend strips"`

## Follow-Ups

- Consider a dedicated provider operations view only after retry executor, override-to-refresh linkage, and enough historical provider events exist.
- Keep manual refresh guard status-driven until backend retry semantics are explicit.
