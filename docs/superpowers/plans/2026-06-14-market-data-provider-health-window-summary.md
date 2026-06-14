# Market Data Provider Health Window Summary

## Goal

Make Settings provider health show whether market data provider failures are concentrated in the last hour, spread across the last day, or only visible in the seven-day trail.

## Scope

- Add `windowSummary` to `marketDataAdapters[].externalTelemetry.providerHealth`.
- Include fixed windows: `oneHour`, `twentyFourHours`, and `sevenDays`.
- For each window, report `errorCount`, `latestErrorAt`, six-category `categorySummary`, and `dominantCategory`.
- Derive the window summary only from already-sanitized adapter error payloads.
- Ignore provider error events with invalid timestamps or timestamps after the Settings `generatedAt` reference.
- Keep existing provider health status thresholds unchanged.
- Require the new field in the frontend runtime contract.
- Render a compact bilingual `1h/24h/7d` trend in Settings provider health text.
- Update product and architecture docs.

## Non-Goals

- No backend retry executor.
- No provider circuit breaker execution.
- No retention migration or adapter error ledger schema change.
- No chart visualization yet.
- No raw provider payload exposure, secret reads, broker connection, paper order, or live-trading side effect.

## Checklist

- [x] RED backend: Settings provider health did not include time-window summaries.
- [x] GREEN backend: provider health derives `oneHour`, `twentyFourHours`, and `sevenDays` summaries.
- [x] RED frontend contract: missing provider health window summary was accepted.
- [x] GREEN frontend contract: typed API requires `windowSummary`.
- [x] RED UI source test: Settings provider health text did not render the compact trend.
- [x] GREEN UI: Settings renders bilingual `1h/24h/7d` provider health trends.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k provider_health_window_summary`
- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k market_data_adapter_external_telemetry`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "provider health window|provider health|loads settings status"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "external source telemetry"`

## Follow-Ups

- Build a visual Settings trend strip after the operator flow decides where provider health history belongs.
- Keep frontend refresh guards status-driven until backend retry and manual override semantics are explicit.
