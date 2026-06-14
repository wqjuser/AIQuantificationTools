# Market Data Refresh Override Audit Ledger

## Goal

Make `market_data_refresh_override` events visible and searchable in the Audit workspace after a manual provider-cooldown override is recorded.

## Scope

- Add a frontend projection for persisted `market_data_refresh_override` events.
- Summarize total overrides, recorded overrides, live-blocked boundaries, blocked overrides, and the latest override context.
- Show market, symbol, timeframe, operator, reason, provider health status, retry-after, affected symbols/contexts, and non-live boundary in Audit.
- Use existing `/api/audit/events` backend pagination and query instead of a new endpoint.
- Keep these rows out of report signing and Markdown report ledgers.

## Non-Goals

- No new backend table or audit endpoint.
- No report signing for refresh override rows.
- No automatic provider retry or scheduler.
- No cache refresh replay, broker route, paper order, live order, secret read, or live-trading unlock.

## Checklist

- [x] RED model test: refresh override events had no Audit ledger projection.
- [x] GREEN model projection: rows, summary, and search support override metadata and live-blocked boundary.
- [x] RED layout test: Audit workspace did not load or render refresh override events.
- [x] GREEN UI wiring: Audit workspace loads `market_data_refresh_override` with backend pagination and renders a read-only panel.
- [x] Docs updated.

## Verification

- `npm --workspace @aiqt/web test -- --run src/lib/terminal-workbench.test.ts -t "market data refresh override audit ledger"`
- `npm --workspace @aiqt/web test -- --run src/lib/layout-css.test.js -t "market data refresh override audit events"`

## Follow-Ups

- Consider linking each override event to the next cache refresh run if future refresh metadata records the audit event id.
- Add provider-health trend cards once enough adapter error/override history exists to justify a separate operations view.
