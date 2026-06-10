# Execution Adapter Environment Binding Evidence

## Goal

Add the next paper-only live-readiness ledger step after secret materialization: record that an operator reviewed how a live adapter runtime will bind to already materialized secret-store references.

## Scope

- Add a backend audit-event-only contract at `/api/execution/adapter-environment-bindings`.
- Require a previously recorded `adapterSecretMaterialization` with `status=manifest_recorded`.
- Record required confirmations for runtime env mapping, config reload plan, no raw secret payload, and rollback snapshot.
- Return and persist only redacted metadata. Do not write environment variables, restart containers, connect brokers, or enable live trading.
- Add frontend API helpers and compact workbench row model for later Settings/Execution UI wiring.
- Update the product plan after verification.

## Test Plan

- Backend unit/API test: blocked request returns missing confirmation reasons; recorded request writes audit event, can be listed by adapter, and leaks no secret/private key text.
- Frontend API test: POST/GET URL, payload parsing, and unredacted metadata rejection.
- Workbench model test: compact rows sort and display status, confirmations, env vars, binding mode, and paper-only boundary.
- Run frontend targeted tests, web build, Python tests, Docker compose, and browser smoke.

## Progress

- [x] Plan recorded.
- [x] Failing backend test added.
- [x] Backend contract implemented.
- [x] Frontend API/model tests added.
- [x] Frontend API/model implementation added.
- [x] Product plan updated.
- [x] Verification completed.
- [x] Changes committed and pushed.
