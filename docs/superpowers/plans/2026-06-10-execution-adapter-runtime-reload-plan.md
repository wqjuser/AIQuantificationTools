# Execution Adapter Runtime Reload Plan Evidence

## Goal

Add the next paper-only live-readiness ledger step after environment binding: record that an operator prepared a controlled runtime reload plan for a live adapter that already has redacted environment binding evidence.

## Scope

- Add a backend audit-event-only contract at `/api/execution/adapter-runtime-reload-plans`.
- Require a previously recorded `adapterEnvironmentBinding` with `status=binding_recorded`.
- Record required confirmations for maintenance window approval, pre-reload health baseline, config diff review, post-reload smoke plan, and rollback trigger owner.
- Return and persist only redacted metadata. Do not restart containers, write environment variables, connect brokers, or enable live trading.
- Add frontend API helpers and compact workbench row model for Settings/Execution UI wiring.
- Update the product plan after verification.

## Test Plan

- Backend unit/API test: blocked request returns missing confirmation reasons; recorded request writes audit event, can be listed by adapter, and leaks no token/secret text.
- Frontend API test: POST/GET URL, payload parsing, and secret-free metadata validation.
- Workbench model test: compact rows display status, confirmations, reload mode, window id, blocker summary, and paper-only boundary.
- Run targeted backend/frontend tests, broader frontend API/workbench tests, Python contract tests, web build, Docker compose, and browser smoke.

## Progress

- [x] Plan recorded.
- [x] Failing backend test added.
- [x] Backend contract implemented.
- [x] Frontend API/model tests added.
- [x] Frontend API/model implementation added.
- [x] Product plan updated.
- [x] Verification completed.
- [x] Changes committed and pushed.
