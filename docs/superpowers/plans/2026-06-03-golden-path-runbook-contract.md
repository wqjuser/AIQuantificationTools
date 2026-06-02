# Golden Path Runbook Contract

## P0 Mapping

P0 requires the platform to expose a reliable end-to-end golden path instead of scattered demo panels. The existing status and summary identify the current blocker, but workspaces and future audit views also need a reusable step-level runbook that explains where each step belongs and what action unblocks it.

## Goal

Extend `/api/golden-path/status` with a stable `runbook` array derived from the same golden path steps. Each item should carry the step id, workspace id, status, current flag, blocker text, action id, and action label.

## Scope

- Add backend contract tests for no-audit and paper-pending states.
- Add API route coverage for the new `runbook` payload.
- Add frontend API types and runtime guard validation.
- Reject stale core payloads that omit `runbook`.
- Update product planning notes.

## Out Of Scope

- No new page layout work.
- No new trading or AI behavior.
- No live trading enablement.

## Test Plan

- `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k golden_path`
- `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts`
- Full `npm test`
- `npm run build`
- Docker rebuild, smoke check, and HTTP contract check on port 5173.

## Implementation Log

- RED: backend golden path tests failed with missing `runbook`.
- RED: frontend API client accepted a stale golden path contract without `runbook`.
- GREEN: backend now derives `runbook` from existing golden path steps and next-action metadata.
- GREEN: frontend now requires and validates `runbook` in the golden path status contract.
