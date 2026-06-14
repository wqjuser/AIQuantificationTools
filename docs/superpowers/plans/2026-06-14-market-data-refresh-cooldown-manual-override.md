# Market Data Refresh Cooldown Manual Override

## Goal

Let an operator intentionally run one manual market data refresh during a provider cooldown, while keeping cooldown as the default guard and leaving a visible reason in the UI state.

## Scope

- Extend `buildMarketDataRefreshGuard` with an optional `MarketDataRefreshOverride`.
- Require the override to be enabled, scoped to the selected market, and backed by a non-empty reason.
- Keep blank reasons or another market blocked.
- Show a compact Market/Research override control when the selected provider is cooling down.
- Allow the current-cache and watchlist-cache refresh buttons to run when the override applies.
- Clear the override after the refresh attempt or when the selected market changes.
- Update product and architecture docs.

## Non-Goals

- No backend circuit breaker bypass.
- No persistent operator approval ledger yet.
- No automatic retry scheduler.
- No broker, paper order, live order, secret read, or live-trading side effect.

## Checklist

- [x] RED frontend model test: cooldown override reason was ignored.
- [x] GREEN model helper: valid same-market override allows one manual refresh.
- [x] RED UI source/CSS test: Market/Research override control was missing.
- [x] GREEN UI wiring: Market and Research refresh actions pass active override state.
- [x] Docs updated.

## Verification

- `npm --workspace @aiqt/web test -- --run src/lib/terminal-workbench.test.ts -t "market data refresh"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "provider cooldown guard"`

## Follow-Ups

- Persist manual override evidence in the audit/event ledger if operator overrides need formal compliance review.
- Add a Settings provider-health trend strip after the operator flow decides how much historical provider detail belongs in the main workflow.
