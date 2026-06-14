# Market Data Adapter Cache Diagnostics

## Goal

Make Settings show runtime cache diagnostics per public OHLCV adapter instead of only static adapter readiness.

## Scope

- Add `cacheDiagnostics` to each `marketDataAdapters` row in `/api/settings/status`.
- Aggregate diagnostics by adapter market: freshness, context count, row count, latest timestamp, and fresh/stale/empty summary.
- Require the field in the frontend runtime contract.
- Render compact diagnostics in the Settings adapter cards.
- Update product and architecture docs.

## Non-Goals

- No external network probe.
- No broker or exchange trading connection.
- No secret-store writes.
- No change to cache refresh execution or adapter fallback order.

## Checklist

- [x] RED backend: adapter rows without cache diagnostics raised `KeyError` in Settings contract tests.
- [x] RED frontend: missing `cacheDiagnostics` was incorrectly accepted by the runtime validator.
- [x] GREEN backend: adapter cache diagnostics are derived from existing cache contexts.
- [x] GREEN frontend: typed validator and Settings UI consume diagnostics.
- [x] Docs updated.

## Verification

- `python -m unittest tests.test_quant_core.QuantCoreContractTest.test_settings_status_marks_cache_context_freshness tests.test_quant_core.QuantCoreContractTest.test_settings_status_api_reports_sources_without_secret_values -v`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "settings status"`

## Follow-Ups

- Add adapter-level external source error telemetry.
- Track rate-limit retry and backoff state per provider.
- Add a Settings action that jumps from an adapter card to the matching cache refresh workflow.
