# Runtime reload execution evidence

## Goal

Add the next paper-only safety ledger after adapter runtime reload planning: a controlled runtime reload execution evidence record. This ledger proves that the operator documented the controlled reload execution and post-reload checks, but it must not restart containers, write environment variables, connect brokers, or enable live trading.

## Scope

- Add backend domain helpers for `execution_adapter_runtime_reload_execution`.
- Add `POST /api/execution/adapter-runtime-reload-executions`.
- Add `GET /api/execution/adapter-runtime-reload-executions?adapterId=...`.
- Add frontend API types, URL builders, record/load helpers, and payload guards.
- Add compact workbench rows for future UI wiring.
- Update the product plan.

## Non-goals

- No actual runtime reload command execution.
- No Docker/container restart orchestration.
- No broker connectivity check against real accounts.
- No live route enablement or final human gate change.

## Progress

- [x] Add failing backend and frontend API tests.
- [x] Implement backend domain helpers and API endpoints.
- [x] Implement frontend API helpers and workbench row model.
- [x] Update product plan.
- [x] Run tests/build/Docker smoke.
- [x] Commit and push with the configured proxy.
