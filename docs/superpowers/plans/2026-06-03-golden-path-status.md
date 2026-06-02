# Golden Path Status

## Goal

Build a first-class P0 progress contract that tells the product where the current selected context is blocked across market data, audited research, backtest evidence, AI review, paper execution, and live-trading gates.

## Scope

- Add a backend `golden_path` service that derives status from cache settings, research runs, AI report evidence, and paper execution records.
- Add `GET /api/golden-path/status?market=...&symbol=...&timeframe=...`.
- Add a frontend API client contract and runtime guard for the status payload.
- Update the product plan so the next iteration can wire this status into workspaces as the navigation driver.

## Out Of Scope

- No large layout rewrite in this slice.
- No live trading enablement; live routing remains blocked until adapter certification, risk approval, and human confirmation can be proven.
- No new investment advice outputs.

## Test Plan

- Backend unit tests for blocked and progressed P0 states.
- Backend HTTP route smoke test for the selected context.
- Frontend API client URL and payload validation tests.
- Existing Python and frontend test suites.
- Docker smoke verification after rebuild.

## Implementation Log

- Added backend `quant_core.golden_path.build_golden_path_status` with market data, research run, backtest report, AI review, paper execution, and live-gate steps.
- Added `GET /api/golden-path/status` for selected market/symbol/timeframe context.
- Added frontend `buildGoldenPathStatusUrl` and `loadGoldenPathStatus` with runtime payload guards.
- Wired the main Current Task card to show the current golden-path blocker and execute the next action.
- Verification so far:
  - `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k golden_path`
  - `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts src/lib/layout-css.test.js`
  - `npm run build`
