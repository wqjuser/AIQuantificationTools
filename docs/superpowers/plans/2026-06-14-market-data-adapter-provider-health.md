# Market Data Adapter Provider Health

## Goal

Turn the adapter error ledger into a compact provider health summary in Settings so users can distinguish an isolated provider failure from repeated errors that should cool down.

## Scope

- Add `providerHealth` to every `marketDataAdapters[].externalTelemetry` row.
- Derive health only from already-sanitized adapter error events and dependency availability.
- Report status, recent error count, latest error time, affected symbols, affected contexts, retry-after seconds, and reason.
- Use deterministic thresholds: no errors is `ok`; one or two errors is `watch`; three or more errors is `cooldown`; missing dependency is `blocked`.
- Require the new field in the frontend runtime contract.
- Render the health summary inline on Settings adapter cards.
- Update product and architecture docs.

## Non-Goals

- No automatic retry loop or scheduler.
- No provider circuit breaker execution.
- No background alerting daemon.
- No secret reads, raw provider payload exposure, broker connection, paper order, or live-trading side effect.

## Checklist

- [x] RED backend: Settings telemetry did not include `providerHealth`.
- [x] GREEN backend: provider health is derived from adapter errors and dependency state.
- [x] RED frontend contract: missing `providerHealth` was accepted as a valid Settings payload.
- [x] GREEN frontend contract: typed API requires provider health.
- [x] RED UI source test: Settings adapter cards did not render provider health text.
- [x] GREEN UI: Settings renders compact provider health and suggested backoff.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k provider_health_summary`
- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k market_data_adapter_external_telemetry`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "provider health|loads settings status"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "external source telemetry"`

## Follow-Ups

- Add provider-level rate-limit classification when adapter errors expose structured rate-limit signals.
- Done in `2026-06-14-market-data-refresh-cooldown-guard.md`: suggested backoff now blocks frontend manual refresh actions while the selected provider is in `cooldown`.
- Add a compact health trend view after the ledger keeps time-windowed aggregates.
