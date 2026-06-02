# Golden Path Runbook Summary

## Goal

Make the golden path status easier to use as a product runbook by adding a compact progress summary that can be shown in the main task area and reused by workspaces.

## Scope

- Extend `/api/golden-path/status` with `summary`.
- Include total, passed, review, blocked, current step label, next action id, and live-trading allowance.
- Add frontend API types and runtime guard coverage.
- Show compact progress text in the current task card without changing the page layout.
- Update product planning notes after implementation.

## Out Of Scope

- No new page or layout redesign.
- No live trading enablement.
- No new AI or strategy logic.

## Test Plan

- Backend golden path unit tests for summary counts.
- Frontend API contract tests for summary parsing.
- Web build and full test suite.
- Docker smoke check and browser DOM verification.

## Implementation Log

- Added backend `summary` to `/api/golden-path/status`, including step counts, current step label, next action id, and live-trading allowance.
- Added backend contract coverage for no-audit and audited-paper-pending states.
- Added frontend API types, runtime guard validation, and API client fixture coverage.
- Updated the current task card to show compact golden path progress, for example `阻断 · 1/6步`.
- Verification:
  - `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k golden_path`
  - `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts`
  - `npm run build`
