# Market Data Adapter Settings Status

## Goal

Expose the three formal no-key market data adapters in the platform Settings contract so users can see which public OHLCV route backs A-share, US equity, and crypto research before relying on charts, cache refreshes, or research runs.

## Scope

- Backend Settings payload gains `marketDataAdapters`.
- Frontend API client treats `marketDataAdapters` as a required runtime contract field.
- Settings UI shows adapter/provider/route/cache scope, key requirements, capabilities, and timeframe coverage.
- Product and architecture docs record the adapter status slice.

## Non-Goals

- No broker connection.
- No live order routing.
- No secret-store writes.
- No change to the OHLCV fetch fallback order.

## Checklist

- [x] RED backend contract test: Settings must include AKShare, yfinance, and ccxt adapter status without secrets.
- [x] RED frontend API contract test: Settings payload missing `marketDataAdapters` must be rejected.
- [x] GREEN backend: `build_settings_status` now emits three public OHLCV adapter records.
- [x] GREEN frontend: typed API, validator, and Settings UI consume adapter status.
- [x] Docs: README, product plan, architecture, and this plan updated.

## Verification

- `python -m unittest tests.test_quant_core.QuantCoreContractTest.test_settings_status_api_reports_sources_without_secret_values -v`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts`

## Follow-Ups

- Add runtime freshness/source telemetry per adapter, not only static readiness.
- Add rate-limit/backoff diagnostics to Settings cache health.
- Add shared no-network conformance tests for AKShare, yfinance, and ccxt adapter payload consistency.
