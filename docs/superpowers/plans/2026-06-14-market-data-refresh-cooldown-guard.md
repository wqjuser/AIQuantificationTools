# Market Data Refresh Cooldown Guard

## Goal

Turn the provider health retry-after signal into an explicit frontend guard so users do not repeatedly trigger manual cache refreshes while the selected market data provider is cooling down.

## Scope

- Add a pure `buildMarketDataRefreshGuard` model helper driven by `marketDataAdapters[].externalTelemetry.providerHealth`.
- Block only `providerHealth.status === "cooldown"` for the selected market.
- Disable Market and Research manual refresh actions while blocked.
- Show a compact bilingual guard message with affected symbols and retry-after timing.
- Preserve backend refresh APIs for tests and intentional manual recovery.
- Update product and architecture docs.

## Non-Goals

- No backend circuit breaker.
- No automatic retry scheduler.
- No provider-specific rate-limit classifier.
- No broker, paper order, or live-trading side effect.

## Checklist

- [x] RED frontend model test: cooldown health did not produce a refresh guard.
- [x] GREEN model helper: cooldown returns a blocked guard; watch/missing health allows refresh.
- [x] UI wiring: Market data health buttons, Research readiness actions, and golden-path refresh actions respect the guard.
- [x] UI source/CSS test: guard message and disabled state are present.
- [x] Docs updated.

## Verification

- `npm --workspace @aiqt/web test -- --run src/lib/terminal-workbench.test.ts -t "market data refresh"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "market data refresh|provider cooldown"`

## Follow-Ups

- Add backend optional circuit-breaker metadata once provider errors include structured rate-limit classifications.
- Add a guarded manual override flow for operators who explicitly want to refresh during cooldown.
- Add health trend visualization after adapter ledger keeps time-windowed aggregates.
