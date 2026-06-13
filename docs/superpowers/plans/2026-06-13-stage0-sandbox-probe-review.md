# Stage 0 Sandbox Probe Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a post-execution sandbox/testnet probe review ledger that records operator review of read-only probe evidence while keeping production routing blocked.

**Architecture:** Reuse the existing execution-adapter evidence ledger pattern. A new `execution_adapter_sandbox_probe_review` audit event references a recorded sandbox probe execution, records five review confirmations, redacts metadata, exposes POST/GET APIs, and projects compact frontend rows in Settings and Execution. This is an attestation layer only; it does not connect to brokers, submit orders, write secrets, restart services, or enable live trading.

**Tech Stack:** Python local core HTTP API and audit ledger, React/TypeScript typed client and workbench rows, Vitest/Node tests, Python unittest.

---

## Scope

- Backend builder/payload/audit helpers for `execution_adapter_sandbox_probe_review`.
- `POST /api/execution/adapter-sandbox-probe-reviews` requiring an existing `probe_execution_recorded` probe execution.
- `GET /api/execution/adapter-sandbox-probe-reviews?adapterId=...&limit=...`.
- Typed frontend API, validators, compact workbench rows, Settings controls, and Execution evidence visibility.
- Product plan update documenting the new review layer.

## Non-Goals

- No real broker/exchange connection.
- No sandbox, paper, or live order submission.
- No raw secret payloads, env writes, or service restart.
- No change to `liveTradingAllowed`; the layer remains paper-only and production-route blocked.

## Tasks

- [x] Backend: write failing test for missing/blocked/recorded sandbox probe review history.
- [x] Backend: implement result dataclass, builder, payload rehydration, audit payload, POST, GET.
- [x] Frontend API: write failing typed client tests for record/history and redaction guard.
- [x] Frontend API: implement URL builders, types, validators, record/load clients.
- [x] Workbench/UI: write failing row/layout tests, then add compact rows and Settings/Promotion Queue visibility.
- [x] Docs: update product plan and this plan with shipped details.
- [x] Verification: run focused tests, full tests/build, Docker/browser smoke, diff check, commit, proxy push.

## Acceptance Criteria

- Missing probe execution id returns `execution_adapter_sandbox_probe_execution_not_found` with 404.
- Missing confirmations return `blocked` with explicit blocked reasons.
- Complete confirmations return `probe_review_recorded`.
- Payload and audit metadata always include `paperOnly: true` and `liveTradingAllowed: false`.
- Raw secret-like metadata is redacted and rejected by frontend history validators if it leaks.
- UI shows a waiting state before review evidence and the latest compact review row after recording.

## Verification Log

- [x] RED backend focused test.
- [x] GREEN backend focused test.
- [x] RED frontend API tests.
- [x] GREEN frontend API tests.
- [x] GREEN workbench row test.
- [x] GREEN layout contract test.
- [x] Full Python suite.
- [x] Full monorepo suite.
- [x] Production frontend build.
- [x] Docker smoke.
- [x] Browser smoke for Settings and Execution workspaces.
- [x] `git diff --check`.
