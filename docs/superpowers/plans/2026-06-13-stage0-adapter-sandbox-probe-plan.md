# Stage 0 Adapter Sandbox Probe Plan

## Goal

Add the next execution-readiness ledger layer after final human confirmation: a sandbox/testnet probe plan that is auditable, redacted, paper-only, and explicitly blocked from live routing.

## Scope

- Backend API to record and list adapter sandbox probe plans.
- Typed frontend API and compact workbench rows.
- Settings UI controls that continue from the latest final human confirmation.
- Promotion queue evidence so the next execution gap is visible.
- Product plan update to keep the roadmap current.

## Non-Goals

- No broker or exchange connection.
- No testnet order submission.
- No env writes, service restarts, or secret values in payloads.
- No change to `liveTradingAllowed`; this layer remains paper-only.

## Tasks

- [x] Backend: add `execution_adapter_sandbox_probe_plan` audit payload, builder, rehydration, POST, GET, and tests.
- [x] Frontend API: add URL builders, request/response types, redaction guards, record/load clients, and tests.
- [x] Workbench/UI: add row model, Settings recording controls, and Promotion Queue evidence.
- [x] Docs: update product plan and this plan with shipped details.
- [x] Verification: run backend tests, frontend tests/build, Docker smoke, browser smoke, diff check, commit, push.

## Shipped

- Added `POST /api/execution/adapter-sandbox-probe-plans`, requiring a recorded final human confirmation and five operator confirmations before returning `probe_plan_recorded`.
- Added `GET /api/execution/adapter-sandbox-probe-plans`, projecting recent redacted audit events by adapter.
- Added typed frontend API, compact workbench rows, Settings controls, and Promotion Queue evidence for sandbox probe plans.
- Updated the product plan to make sandbox/testnet probe planning the next layer after final human confirmation.

## Verification Log

- [x] RED: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k sandbox_probe_plan` failed with generic `not_found` before implementation.
- [x] GREEN: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k sandbox_probe_plan`.
- [x] `npm --workspace @aiqt/web test -- terminal-api.test.ts -t "sandbox probe plan"`.
- [x] `npm --workspace @aiqt/web test -- terminal-workbench.test.ts -t "sandbox probe plan rows"`.
- [x] `npm --workspace @aiqt/web test -- layout-css.test.js -t "sandbox probe plan"`.
- [x] `npm --prefix apps/web run build`.
- [x] Full backend suite: `python -m unittest discover -s services/quant_core/tests -t services/quant_core` (`Ran 170 tests`).
- [x] Full project suite: `npm test` (backend 170 tests, frontend 505 tests).
- [x] Production build: `npm --prefix apps/web run build`.
- [x] Docker smoke: `npm run docker:smoke` (`health status=ok`, `web status=ok url=http://127.0.0.1:5173`).
- [x] Browser smoke: Settings shows the Sandbox probe plan waiting state; Execution shows the promotion sandbox/testnet evidence waiting state; browser console errors: `[]`.
