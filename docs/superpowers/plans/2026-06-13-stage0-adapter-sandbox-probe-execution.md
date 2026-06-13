# Stage 0 Adapter Sandbox Probe Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an auditable sandbox/testnet probe execution ledger after the sandbox probe plan, without enabling live routing or submitting real orders.

**Architecture:** Reuse the existing execution-adapter ledger pattern: each layer references the previous audit event, records five operator confirmations, redacts metadata, stores a generic audit event, and exposes POST/GET API contracts plus compact frontend rows. This slice records only read-only handshake and order-schema probe evidence; it does not connect to a real broker, write secrets, restart services, or enable live trading.

**Tech Stack:** Python local core HTTP API and audit ledger, React/TypeScript typed client and workbench row model, Vitest/Node tests, Python unittest.

---

## Scope

- Backend builder/payload/audit helpers for `execution_adapter_sandbox_probe_execution`.
- `POST /api/execution/adapter-sandbox-probe-executions` requiring an existing `probe_plan_recorded` plan.
- `GET /api/execution/adapter-sandbox-probe-executions?adapterId=...&limit=...`.
- Typed frontend API and compact row model.
- Settings and Execution promotion evidence that show the new probe execution layer after a recorded plan.
- Product plan update documenting the new paper-only/read-only boundary.

## Non-Goals

- No real broker/exchange connection.
- No sandbox, paper, or live order submission.
- No raw secret payloads or env writes.
- No Docker/service restart.
- No change to `liveTradingAllowed`; the layer remains `paperOnly`.

## Tasks

- [x] Backend: write failing test for missing/blocked/recorded sandbox probe execution history.
- [x] Backend: implement result dataclass, builder, payload rehydration, audit payload, POST, GET.
- [x] Frontend API: write failing typed client tests for record/history and redaction guard.
- [x] Frontend API: implement URL builders, types, validators, record/load clients.
- [x] Workbench/UI: write failing row/layout tests, then add compact rows and Settings/Promotion Queue visibility.
- [x] Docs: update product plan and this plan with shipped details.
- [x] Verification: run focused tests, full tests/build, Docker/browser smoke, diff check, commit, proxy push.

## Acceptance Criteria

- Missing plan id returns `execution_adapter_sandbox_probe_plan_not_found` with 404.
- Missing confirmations return `blocked` with explicit blocked reasons.
- Complete confirmations return `probe_execution_recorded`.
- Payload and audit metadata always include `paperOnly: true` and `liveTradingAllowed: false`.
- Raw secret-like metadata is redacted and rejected by frontend history validators if it leaks.
- UI shows the waiting state before execution evidence and the latest compact evidence row after recording.

## Shipped

- Added `execution_adapter_sandbox_probe_execution` audit payloads, redacted rehydration, and strict previous-plan chaining.
- Added `POST /api/execution/adapter-sandbox-probe-executions`, requiring a recorded sandbox probe plan and five operator confirmations before returning `probe_execution_recorded`.
- Added `GET /api/execution/adapter-sandbox-probe-executions`, projecting recent redacted audit events by adapter.
- Added typed frontend API clients, validators, workbench rows, Settings recording controls, and Promotion Queue evidence.
- Updated the product plan so Stage 0 now distinguishes probe planning from read-only probe execution evidence.

## Verification Log

- [x] RED backend focused test: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k sandbox_probe_execution` failed with `not_found` before implementation.
- [x] GREEN backend focused test: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k sandbox_probe_execution`.
- [x] RED frontend API tests: `npm --workspace @aiqt/web test -- terminal-api.test.ts -t "sandbox probe execution"` failed on missing functions.
- [x] GREEN frontend API tests: `npm --workspace @aiqt/web test -- terminal-api.test.ts -t "sandbox probe execution"`.
- [x] GREEN workbench row test: `npm --workspace @aiqt/web test -- terminal-workbench.test.ts -t "sandbox probe execution rows"`.
- [x] GREEN layout contract test: `npm --workspace @aiqt/web test -- layout-css.test.js -t "sandbox probe execution"`.
- [x] Frontend build: `npm --prefix apps/web run build`.
- [x] Full Python suite: `python -m unittest discover -s services/quant_core/tests -t services/quant_core` passed 171 tests.
- [x] Full monorepo suite: `npm test` passed 171 backend tests and 509 frontend tests.
- [x] Production frontend build: `npm --prefix apps/web run build`.
- [x] Docker smoke: `npm run docker:smoke` rebuilt and served the stack on `http://127.0.0.1:5173`.
- [x] Browser smoke: Settings shows the sandbox probe execution controls, Execution shows recent probe execution evidence, and both pages had no console errors.
- [x] Diff whitespace check: `git diff --check`.
