# Market Data Provider Health Current Window

## Goal

Keep historical provider failures visible without letting stale market data errors permanently degrade adapters or block manual refresh.

## Scope

- Use the `twentyFourHours` provider error window as the source for current `providerHealth` status.
- Derive `recentErrorCount`, `lastErrorAt`, `affectedSymbols`, `affectedContexts`, `categorySummary`, and `dominantCategory` from that 24h window.
- Keep `windowSummary.oneHour/twentyFourHours/sevenDays` as historical context.
- Preserve `lastProviderError` as the latest sanitized evidence even when it is older than the current health window.
- Mark an available adapter as `degraded` only when current health is `watch` or `cooldown`.
- Leave dependency-missing behavior unchanged.
- Update product and architecture docs.

## Non-Goals

- No backend retry executor.
- No provider circuit breaker.
- No manual override UI.
- No adapter error ledger schema or retention migration.
- No broker, paper order, live order, secret read, or live-trading side effect.

## Checklist

- [x] RED backend: stale provider errors still triggered current cooldown and degraded adapter status.
- [x] GREEN backend: current health uses the 24h window while seven-day history remains visible.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k provider_health`

## Follow-Ups

- Done in `2026-06-14-market-data-refresh-cooldown-manual-override.md`: cooldown remains the default guard, but a same-market override reason can unlock one manual refresh attempt.
- Add a visual Settings trend strip after the operator flow decides where provider history belongs.
