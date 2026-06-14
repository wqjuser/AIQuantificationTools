# Market Data Adapter External Telemetry

## Goal

Make Settings show whether each public OHLCV adapter has the optional runtime dependency it needs before users rely on charts, cache refreshes, or research runs.

## Scope

- Add `externalTelemetry` to every `marketDataAdapters` row in `/api/settings/status`.
- Report dependency name, dependency availability, safe last-error text, retry state, and checked timestamp.
- Mark an adapter `blocked` when its optional dependency is missing.
- Require the field in the frontend runtime contract.
- Render compact dependency/retry telemetry in Settings adapter cards.
- Update product and architecture docs.

## Non-Goals

- No external network probe.
- No persistent provider error ledger.
- No automatic retry or backoff scheduler.
- No broker/exchange trading connection.
- No secret-store reads or writes.

## Checklist

- [x] RED backend: injected dependency status failed because Settings did not accept `adapter_dependency_statuses`.
- [x] RED frontend contract: missing `externalTelemetry` was incorrectly accepted.
- [x] RED UI source test: Settings adapter cards did not render telemetry text.
- [x] GREEN backend: Settings emits dependency availability and retry state per adapter without secrets.
- [x] GREEN frontend: typed API validator requires telemetry and Settings renders it.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k market_data_adapter_external_telemetry`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "external telemetry is missing|loads settings status"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "external source telemetry"`

## Follow-Ups

- Persist real provider request failures from `/api/market/klines` and cache refresh runs into an adapter error ledger.
- Track rate-limit retry and backoff state per provider.
- Add an install guidance action for missing optional data dependencies in Docker/local setups.
