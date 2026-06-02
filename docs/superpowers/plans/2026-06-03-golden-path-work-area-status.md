# Golden Path Work-Area Status

## Goal

Use the existing golden path contract to drive product work-area readiness instead of leaving the navigation statuses as static workspace mock state.

## Scope

- Extend `/api/golden-path/status` with `workspaces`, one status row per product work area.
- Keep the status values aligned with the existing frontend work-area model: `ready`, `needs_run`, `blocked`.
- Update the frontend API contract and runtime guard.
- Let the main work-area buttons use golden-path work-area statuses while keeping the existing layout.
- Update product planning notes after implementation.

## Out Of Scope

- No layout redesign in this slice.
- No live trading enablement.
- No new strategy or AI analysis logic.

## Test Plan

- Backend unit tests for golden path workspace status mapping.
- Frontend API contract tests for the new `workspaces` payload.
- Existing Python and web test suites.
- Docker smoke check after rebuild.

## Implementation Log

- Added `goldenPath.workspaces` to the backend status payload with per-product-work-area `ready` / `needs_run` / `blocked` states.
- Added frontend API types and runtime guards for workspace readiness rows.
- Updated the main app so product work-area navigation statuses are overridden by golden-path workspace readiness when the core is available.
- Verification so far:
  - `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k golden_path`
  - `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts`
  - `npm run build`
  - `npm test`
  - `docker compose up -d --build`
  - `python tools/docker_smoke.py --no-build`
  - Browser check: work-area buttons now show golden-path `ready` / `needs_run` / `blocked` states.
