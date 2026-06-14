# Market Data Adapter Error Ledger

## Goal

Persist recent public OHLCV provider failures so Settings can explain why an adapter is degraded even when its optional dependency is installed.

## Scope

- Add a local SQLite adapter error ledger for public market data adapters.
- Record provider failures from `/api/market/klines`, single-context cache refreshes, and watchlist cache refreshes.
- Sanitize and truncate provider error text before persisting or returning it.
- Add `lastProviderError` to every `marketDataAdapters[].externalTelemetry` row in `/api/settings/status`.
- Mark an adapter `degraded` when its dependency is available but a recent provider error exists.
- Require the new provider error field in the frontend runtime contract.
- Render compact latest provider error evidence in Settings adapter cards.
- Update product and architecture docs.

## Non-Goals

- No automatic provider retry, backoff scheduler, or alerting daemon.
- No secret reads, secret writes, or raw error payload exposure.
- No broker or exchange trading connection.
- No research run, AI review, portfolio event, paper order, or live-trading side effect.

## Checklist

- [x] RED backend: importing the new adapter error ledger failed before implementation.
- [x] RED backend: Settings did not expose recent provider error state.
- [x] RED backend: `/api/market/klines` did not record provider failures.
- [x] RED frontend contract: missing `lastProviderError` was incorrectly accepted.
- [x] RED UI source test: Settings adapter cards did not render provider error evidence.
- [x] GREEN backend: provider failures are stored and projected into Settings.
- [x] GREEN frontend: typed API validator requires provider error state and Settings renders it.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k adapter_error`
- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k provider_error_ledger`
- `python -m unittest discover -s services\quant_core\tests -t services\quant_core -k market_data_adapter_external_telemetry`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "loads settings status|provider error state"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "external source telemetry"`

## Follow-Ups

- Add provider-level retry/backoff state once the ledger has enough observed failures.
- Add a compact Settings filter for degraded adapters when the adapter list grows.
- Consider a maintenance task that prunes old adapter error rows after retention policy is defined.
