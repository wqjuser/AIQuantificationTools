# Market Data Refresh Override Audit Event

## Goal

Make provider-cooldown manual refresh overrides auditable before they can unlock a refresh action.

## Scope

- Add a pure `buildMarketDataRefreshOverrideAuditEvent` helper that creates `eventType=market_data_refresh_override`.
- Record market, symbol, timeframe, operator, override reason, provider health status, retry-after, affected symbols/contexts, and the paper-only/live-blocked boundary.
- Reject blank override reasons at the audit-event builder boundary.
- Wire the Market/Research override control so it calls `saveAuditEvent` first.
- Enable the one-time override only after the core returns a saved audit event id.
- Show compact UI status for saving, saved, and failed audit recording.
- Keep backend cache refresh APIs unchanged.

## Non-Goals

- No new backend table or endpoint.
- No automatic provider retry or circuit-breaker executor.
- No secret handling, broker connection, paper order, live order, or live-trading unlock.

## Checklist

- [x] RED frontend API/model test: market-data override audit event builder was missing.
- [x] GREEN builder: stable `market_data_refresh_override` event with no trading boundary.
- [x] RED UI source/CSS test: override control did not save an audit event or show audit status.
- [x] GREEN UI wiring: App saves audit event before setting override state and shows status.
- [x] Docs updated.

## Verification

- `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts -t "market data cooldown refresh override|blank market data refresh override"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "provider cooldown guard"`
- `python -m unittest discover -s services\quant_core\tests -t services\quant_core`
- `npm test`
- `git diff --check`
- `npm run build`
- `npm run docker:smoke`
- Browser smoke: `http://127.0.0.1:5173/?workspace=market&market=ashare&symbol=600000&timeframe=1d` and `?workspace=research...` loaded without console errors.

## Follow-Ups

- Consider adding an Audit workspace filter/card for `market_data_refresh_override` events after provider-health trends are visible.
- If compliance needs stronger linkage, include the override audit event id in future cache refresh run metadata.
