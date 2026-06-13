# Stage 0 Production Route Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a post-sandbox-review production route policy review ledger that records operator review of live-route controls while keeping live trading blocked.

**Architecture:** Reuse the execution adapter audit ledger pattern. A new `execution_adapter_production_route_review` audit event references a recorded sandbox probe review, records five production-route confirmations, redacts metadata, exposes POST/GET APIs, and projects compact frontend rows in Settings and Execution. This is still an attestation layer only; it does not connect to brokers, submit orders, write secrets, restart services, or enable live trading.

**Tech Stack:** Python local core HTTP API and audit ledger, React/TypeScript typed client and workbench rows, Vitest/Node tests, Python unittest.

---

## Scope

- Backend builder/payload/audit helpers for `execution_adapter_production_route_review`.
- `POST /api/execution/adapter-production-route-reviews` requiring an existing `probe_review_recorded` sandbox probe review.
- `GET /api/execution/adapter-production-route-reviews?adapterId=...&limit=...`.
- Typed frontend API, validators, compact workbench rows, Settings controls, and Execution evidence visibility.
- Product plan update documenting the new policy review layer.

## Non-Goals

- No real broker/exchange connection.
- No sandbox, paper, or live order submission.
- No raw secret payloads, env writes, service restart, or runtime config mutation.
- No change to `liveTradingAllowed`; the layer remains paper-only and production-route blocked.

## Tasks

- [x] Backend: write failing test for missing/blocked/recorded production route review history.
- [x] Backend: implement result dataclass, builder, payload rehydration, audit payload, POST, GET.
- [x] Frontend API: write failing typed client tests for record/history and redaction guard.
- [x] Frontend API: implement URL builders, types, validators, record/load clients.
- [x] Workbench/UI: write failing row/layout tests, then add compact rows and Settings/Promotion Queue visibility.
- [x] Docs: update product plan and this plan with shipped details.
- [x] Verification: run focused tests, full tests/build, Docker/browser smoke, diff check, commit, proxy push.

## Acceptance Criteria

- Missing sandbox probe review id returns `execution_adapter_sandbox_probe_review_not_found` with 404.
- Missing confirmations return `blocked` with explicit blocked reasons.
- Complete confirmations return `route_review_recorded`.
- Payload and audit metadata always include `paperOnly: true` and `liveTradingAllowed: false`.
- Raw secret-like metadata is redacted and rejected by frontend history validators if it leaks.
- UI shows a waiting state before route review evidence and the latest compact review row after recording.

## Verification Log

- [x] RED backend focused test: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k production_route_review` failed before implementation with missing endpoint/result.
- [x] GREEN backend focused test: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k production_route_review`.
- [x] RED frontend API tests: `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "production route review"` failed before typed client implementation.
- [x] GREEN frontend API tests: `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "production route review"`.
- [x] GREEN workbench row test: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "production route review rows"`.
- [x] GREEN layout contract test: `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "production route review"`.
- [x] Full Python suite: `python -m unittest discover -s services/quant_core/tests -t services/quant_core`.
- [x] Full monorepo suite: `npm test`.
- [x] Production frontend build: `npm --prefix apps/web run build`.
- [x] Docker smoke: `npm run docker:smoke`.
- [x] Browser smoke for Settings and Execution workspaces: verified `.adapter-production-route-review-list` and `.promotion-production-route-review-evidence` on `http://127.0.0.1:5173`.
- [x] `git diff --check`.
