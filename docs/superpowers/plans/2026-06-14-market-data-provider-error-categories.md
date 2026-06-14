# Market Data Provider Error Categories

## Goal

Classify sanitized market data provider errors so Settings can show whether the latest adapter failure looks like rate limiting, dependency failure, network trouble, upstream trouble, incomplete data, or an unknown issue.

## Scope

- Add `category` to `marketDataAdapters[].externalTelemetry.lastProviderError`.
- Derive categories only from already-sanitized `message/source/context` fields.
- Keep the category enum small and stable: `rate_limit`, `dependency`, `network`, `upstream`, `incomplete_data`, `unknown`.
- Require the category in the frontend runtime contract.
- Render the category in Settings latest-error text.
- Update product and architecture docs.

## Non-Goals

- No backend circuit breaker or automatic retry executor.
- No raw provider payload exposure.
- No secret reads, broker connection, paper order, or live-trading side effect.
- No migration of stored adapter error rows; Settings derives category at projection time.

## Checklist

- [x] RED backend: Settings `lastProviderError` did not include `category`.
- [x] GREEN backend: Settings derives stable categories from sanitized provider error evidence.
- [x] RED frontend contract: missing provider error category was accepted.
- [x] GREEN frontend contract: typed API requires provider error category.
- [x] RED UI source test: Settings latest-error text did not render category labels.
- [x] GREEN UI: Settings renders bilingual category labels.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k provider_errors`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "provider error"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "external source telemetry"`

## Follow-Ups

- Feed `rate_limit` into an optional backend refresh preflight/circuit-breaker once operator override semantics are defined.
- Add health trend aggregation after adapter error retention windows are documented.
