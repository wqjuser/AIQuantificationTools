# Market Data Adapter Install Guidance

## Goal

Make missing optional market-data dependencies actionable from Settings by returning Docker and local install guidance with each adapter telemetry payload.

## Scope

- Add `installGuidance` to every `marketDataAdapters[].externalTelemetry` row in `/api/settings/status`.
- Include dependency package name, Docker build arg, direct package install command, project extras install command, and a safety note.
- Require `installGuidance` in the frontend runtime contract.
- Render compact install guidance in Settings adapter cards.
- Update product and architecture docs.

## Non-Goals

- No automatic dependency installation.
- No package manager shell execution from the browser.
- No secret reads or API key configuration.
- No live trading enablement.

## Checklist

- [x] RED backend: Settings external telemetry failed when install guidance was expected.
- [x] RED frontend contract: missing `installGuidance` was incorrectly accepted.
- [x] RED UI source test: Settings adapter cards did not render install guidance.
- [x] GREEN backend: Settings emits secret-free Docker/local guidance per dependency.
- [x] GREEN frontend: typed API validator requires guidance and Settings renders it.
- [x] Docs updated.

## Verification

- `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k test_settings_status_reports_market_data_adapter_external_telemetry`
- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "market data adapter install guidance"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "external source telemetry"`

## Follow-Ups

- Add copy buttons for Docker/local commands in Settings.
- Done in `2026-06-14-market-data-adapter-error-ledger.md`: provider request failures are persisted into an adapter error ledger and surfaced in Settings.
- Track provider retry/backoff state after real request failures, not just missing dependency checks.
