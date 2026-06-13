# Stage 0 Execution Adapter Orchestration Dry Run

## Goal

Add the next paper-only ledger step after execution adapter runtime reload final acceptance: record an adapter orchestration dry-run evidence event. The dry run must prove an operator reviewed the accepted adapter chain and simulated the orchestration checks without writing secrets, restarting services, connecting broker APIs, routing real orders, or enabling live trading.

## Scope

- Add a backend/API contract for `execution_adapter_orchestration_dry_run`.
- Require an existing `execution_adapter_runtime_reload_acceptance` event with `status=acceptance_recorded`.
- Require explicit confirmations for accepted-chain review, sandbox handshake dry-run, order schema dry-run, account sync dry-run, and live-order boundary confirmation.
- Return `blocked` with reasons when confirmations or accepted evidence are missing; return `dry_run_recorded` only when every gate passes.
- Keep all metadata redacted, `paperOnly=true`, and `liveTradingAllowed=false`.
- Add frontend typed API and compact row model so the evidence can be surfaced in the promotion chain.

## Non-Goals

- Do not connect to real broker APIs.
- Do not restart Docker, write environment variables, or materialize secrets.
- Do not submit live, sandbox, or paper broker orders from this endpoint.
- Do not set `liveTradingAllowed=true`.

## TDD Plan

- [x] RED: backend HTTP test for blocked and recorded orchestration dry-run evidence after runtime reload final acceptance.
- [x] GREEN: backend domain, payload projection, audit event conversion, POST/GET routes.
- [x] RED/GREEN: frontend typed API test for URL builders, POST parsing, GET history, redaction guard, and paper-only boundary.
- [x] RED/GREEN: workbench row model test for compact orchestration dry-run rows.
- [x] Update product plan.
- [x] Run focused tests.
- [x] Run broader verification, build, Docker smoke, and browser smoke.
- [ ] Commit and push with proxy.

## Validation Notes

- 2026-06-13: Selected this as the next Stage 0 execution readiness slice because final runtime reload acceptance is already recorded but the real adapter orchestration phase still needs a safe dry-run evidence layer.
- RED backend verification failed as expected: `python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_execution_adapter_orchestration_dry_run_records_preflight_without_enabling_live` with `PYTHONPATH=services/quant_core` returned generic `not_found` because `/api/execution/adapter-orchestration-dry-runs` was not implemented.
- GREEN backend verification passed for the same focused test after adding domain conversion, audit event projection, and POST/GET routes.
- RED frontend API verification failed as expected because `buildExecutionAdapterOrchestrationDryRunUrl` and `loadExecutionAdapterOrchestrationDryRuns` were not implemented.
- GREEN frontend API verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "adapter orchestration dry run"`.
- RED workbench row verification failed as expected because `buildExecutionAdapterOrchestrationDryRunRows` was not implemented.
- GREEN workbench row verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "adapter orchestration dry run rows"`.
- Focused verification passed for backend dry-run contract, frontend typed API, and frontend workbench row model.
- Broad verification passed: `git diff --check`, `npm test`, `npm --prefix apps/web run build`, and `npm run docker:smoke`.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=execution`: title `AI Quantification Tools`, execution/paper-boundary text present, and no console errors.
