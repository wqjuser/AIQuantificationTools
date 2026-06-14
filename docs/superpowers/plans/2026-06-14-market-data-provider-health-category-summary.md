# Market Data Provider Health Category Summary

## Goal

Make Settings provider health explain the main type of recent market data failure, not just the number of recent failures.

## Scope

- Add `categorySummary` to `marketDataAdapters[].externalTelemetry.providerHealth`.
- Add `dominantCategory` to the same provider health payload.
- Derive both fields only from already-sanitized adapter error payloads.
- Keep the summary shape stable with all six provider error categories present: `rate_limit`, `dependency`, `network`, `upstream`, `incomplete_data`, and `unknown`.
- Use deterministic tie breaking so UI, reports, and future audit exports do not drift across runs.
- Require the new fields in the frontend runtime contract.
- Render the dominant category in Settings provider health text.
- Update product and architecture docs.

## Non-Goals

- No backend retry executor.
- No provider circuit breaker.
- No change to adapter error storage schema.
- No raw provider payload exposure, secret reads, broker connection, paper order, or live-trading side effect.

## Checklist

- [x] RED backend: Settings provider health did not include `categorySummary` and `dominantCategory`.
- [x] GREEN backend: provider health derives a stable category summary and dominant category.
- [x] RED frontend contract: missing provider health category summary was accepted.
- [x] GREEN frontend contract: typed API requires `categorySummary` and `dominantCategory`.
- [x] RED UI source test: Settings provider health text did not render the dominant category.
- [x] GREEN UI: Settings renders bilingual primary category labels.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k provider_health_summary`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "provider health"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "external source telemetry"`

## Follow-Ups

- Use `categorySummary` as the input for a future provider health trend chart once retention windows are defined.
- Keep frontend refresh guards status-driven for now; category-specific retry policy still needs explicit operator override semantics.
