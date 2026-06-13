# Stage 0 Sandbox Probe Readiness Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Execution promotion readiness model consume recorded sandbox/testnet probe execution evidence instead of showing it only as a side rail.

**Architecture:** Reuse the existing frontend-only `buildPromotionReadiness` chain. Add the latest matching `ExecutionAdapterSandboxProbeExecutionRow` to the adapter certification stage detail, next-step guidance, and app wiring while keeping `liveTradingAllowed=false` and the live promotion gate blocked.

**Tech Stack:** React/TypeScript frontend model and Vitest/Node layout contract tests.

---

## Scope

- Add sandbox probe execution rows as an input to `buildPromotionReadiness`.
- Match rows by selected market, live route, adapter id, human confirmation id, orchestration execution id, and previous runtime/restart evidence ids where available.
- Include latest sandbox probe execution status in the adapter certification stage detail and value.
- Update the App call site and layout contract tests so the UI wiring cannot drift again.
- Update the product plan with this readiness integration.

## Non-Goals

- No backend API changes.
- No new audit event type.
- No broker, exchange, sandbox, paper, or live order submission.
- No change to `liveTradingAllowed`; sandbox probe evidence remains paper-only and live-blocked.

## Tasks

- [x] Add a failing `terminal-workbench.test.ts` case proving recorded sandbox probe execution appears inside promotion readiness and keeps status `certification_pending`.
- [x] Implement `latestPromotionSandboxProbeExecutionRow`, `promotionSandboxProbeExecutionNextStep`, and the `buildPromotionReadiness` parameter wiring.
- [x] Update `App.tsx` and `layout-css.test.js` so the app passes `executionAdapterSandboxProbeExecutionRows` into promotion readiness.
- [x] Update `docs/product-plan.md` with the readiness integration note.
- [x] Run focused tests, build, browser smoke, diff check, commit, and proxy push.

## Acceptance Criteria

- A matching `probe_execution_recorded` row is summarized in the adapter certification stage.
- A blocked probe execution row is summarized as a blocker with warning/risk tone.
- Promotion readiness still returns `certification_pending`; sandbox probe execution does not unlock live routing.
- Existing human confirmation and adapter certification behavior remains compatible with older call sites.

## Verification Log

- [x] RED focused readiness test: `npm --workspace @aiqt/web test -- terminal-workbench.test.ts -t "sandbox probe execution evidence into promotion readiness"` failed with value still at `0 certified live adapters`.
- [x] GREEN focused readiness test: `npm --workspace @aiqt/web test -- terminal-workbench.test.ts -t "sandbox probe execution evidence into promotion readiness"`.
- [x] GREEN layout contract test: `npm --workspace @aiqt/web test -- layout-css.test.js -t "sandbox probe execution"`.
- [x] Full workbench model suite: `npm --workspace @aiqt/web test -- terminal-workbench.test.ts` passed 247 tests.
- [x] Full layout contract suite: `npm --workspace @aiqt/web test -- layout-css.test.js` passed 91 tests.
- [x] Production frontend build: `npm --prefix apps/web run build`.
- [x] Docker smoke: `npm run docker:smoke`.
- [x] Browser smoke for Execution workspace: promotion queue and recent sandbox probe execution evidence rendered with no console errors.
- [x] Full monorepo suite: `npm test` passed 171 Python tests and 510 frontend tests.
- [x] Diff whitespace check: `git diff --check`.
