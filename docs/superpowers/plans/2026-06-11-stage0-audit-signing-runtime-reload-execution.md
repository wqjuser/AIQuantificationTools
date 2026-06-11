# Stage 0 Audit Signing Runtime Reload Execution Evidence

## Goal

Record a paper-only, secret-safe execution evidence event after an Audit signing key runtime reload plan is recorded. The API must prove operator evidence was captured without restarting containers, writing environment variables, activating a new signing key, or enabling live trading.

## Scope

- Add an Audit signing key runtime reload execution domain payload.
- Add POST/GET API endpoints under `/api/audit/signing-keys/runtime-reload-executions`.
- Add typed frontend URL/client/parser helpers.
- Keep the event ledger secret-safe and `liveTradingAllowed=false`.
- Update the product plan after verification.

## Tasks

- [x] Inspect existing Execution adapter runtime reload execution and Audit signing runtime reload plan patterns.
- [x] Write RED backend test for missing plan, blocked confirmations, recorded evidence, history, and redaction.
- [x] Write RED frontend client tests for POST contract, history contract, and unredacted metadata rejection.
- [x] Implement backend domain serialization and audit-event payloads.
- [x] Implement API POST/GET routes.
- [x] Implement frontend typed client, URL builders, and validators.
- [x] Update product plan with the completed evidence layer and next gate.
- [x] Run focused and broad verification.
- [ ] Commit and push with proxy.

## Safety Contract

- This is evidence capture only.
- It must not restart Docker or local processes.
- It must not write `.env`, OS environment variables, or secret files.
- It must not activate the proposed signing key.
- It must not mark live trading as allowed.
