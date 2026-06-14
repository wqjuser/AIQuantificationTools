# Stage 1 Refresh Override Evidence Link

## Goal

Link a provider-cooldown manual refresh override audit event to the immediately authorized cache refresh evidence, without changing trading permissions or bypassing downstream research/audit gates.

## Scope

- Single-symbol cache refresh can echo an optional `overrideAuditEventId`.
- Watchlist cache refresh runs can persist and replay an optional `overrideAuditEventId`.
- Market health history rows expose the override reference when present.
- App refresh calls pass the override id only when the refresh guard has applied an audited override.

## Non-Goals

- No automatic retries.
- No signed audit report chain changes.
- No research run creation, paper order submission, broker connection, or live trading unlock.

## Implementation Checklist

- [x] RED: backend contract tests require single refresh echo and watchlist refresh persistence/history replay.
- [x] RED: frontend API client tests require both refresh request bodies to include `overrideAuditEventId`.
- [x] RED: terminal workbench history row test requires visible override evidence in run detail.
- [x] GREEN: `watchlist_cache_refresh_runs` adds a nullable `override_audit_event_id` column with additive migration.
- [x] GREEN: `POST /api/cache/refresh` and `POST /api/cache/watchlist-refreshes` parse optional override ids.
- [x] GREEN: frontend API types, validators, request bodies, and App refresh calls carry the optional id.
- [x] GREEN: docs updated in product plan and architecture.

## Verification

- `npm run test:python`
- `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "refreshes a market cache context|records a watchlist cache refresh run|loads recent watchlist cache refresh runs"`
- `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "summarizes recent watchlist cache refresh runs"`

## Follow-Ups

- Consider surfacing `overrideAuditEventId` in the selected watchlist refresh detail header, not only the history row detail.
- Consider locking the override event id into `researchRun.dataSnapshot.preparationEvidence` when a matching watchlist refresh run is consumed.
