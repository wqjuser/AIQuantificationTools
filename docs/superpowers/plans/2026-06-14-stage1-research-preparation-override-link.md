# Stage 1 Research Preparation Override Link

## Goal

Carry a market-data refresh override audit event from a watchlist cache refresh run into the audited research run's locked `dataSnapshot.preparationEvidence`.

## Scope

- Preserve `overrideAuditEventId` when `/api/research/run` consumes a matching watchlist cache refresh run.
- Normalize the field when persisted research runs are written or imported.
- Let frontend preparation-evidence detail formatting show the override reference anywhere the shared formatter is used.
- Keep the field optional so older runs and non-override refreshes remain valid.

## Non-Goals

- No change to research preflight gating.
- No new audit event type.
- No automatic cache refresh, research run creation, paper order, broker connection, or live trading unlock.

## Implementation Checklist

- [x] RED: backend research API contract requires locked preparation evidence to include `overrideAuditEventId`.
- [x] RED: frontend export package browser detail requires the shared preparation evidence formatter to show the override reference.
- [x] GREEN: `_watchlist_refresh_preparation_evidence` copies the refresh run's override audit event id.
- [x] GREEN: research run snapshot normalization persists the optional field.
- [x] GREEN: frontend model type, API validator, and formatter support the optional field.
- [x] GREEN: product plan and architecture notes updated.

## Verification

- `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k test_research_api_locks_matching_watchlist_refresh_evidence_into_data_snapshot`
- `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "builds a searchable research run export package browser from manifest artifacts"`

## Follow-Ups

- Add a dedicated evidence-index row for `overrideAuditEventId` if audit users need to search override ids independently from preparation evidence details.
