# AIQuant P2 Pre-live Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Keep this plan and `docs/product-plan.md` updated after each meaningful batch.

**Goal:** Turn the P1 research-ops platform into a safe pre-live execution readiness platform for a personal or small-team user.

**Positioning:** P2 does not make real orders available. It builds the control plane that must exist before any broker route can be considered: auditable evidence chains, operator confirmations, adapter readiness, paper execution replay, runbooks, manifest validation, and clear live-blocked boundaries.

**Non-negotiable boundary:** Until a future P3 live adapter plan explicitly changes it, every P2 surface must keep `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false`.

---

## P2 Product Diagnosis

P1 made the platform usable for daily research operations: watchlist queues, strategy governance, portfolio paper ops, evidence packages, handoff notes, and P1 acceptance readback.

The next blocker is execution readiness. The current repo already has many low-level adapter evidence ledgers, but a user still needs one clear answer:

```text
Can this audited strategy and adapter path move from paper evidence to a controlled pre-live review?
```

P2 should therefore convert the existing evidence ledgers into a small number of product-level readiness surfaces.

---

## Batch 1: Pre-live Promotion Checklist

**Outcome:** Execution users see a compact checklist derived from the Promotion Queue that explains which gates passed, which gate blocks next, and whether the path is only a manual-route candidate.

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `docs/product-plan.md`
- Modify: `README.md`

### Progress

- [x] Added `PreLiveReadinessChecklist` and `buildPreLiveReadinessChecklist`.
- [x] Added model tests for blocked, evidence-pending, and full manual-route-candidate states.
- [x] Wired the checklist into `PromotionQueuePanel` with compact row rendering.
- [x] Added layout contract coverage for `.pre-live-checklist`, row list, and row styles.
- [x] Kept direct order submission and live trading disabled even when all promotion gates pass.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "pre-live readiness|manual route"
npm run test --workspace @aiqt/web -- layout-css.test.js -t "promotion readiness"
```

Full regression verification still belongs at the end of the implementation turn:

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts layout-css.test.js
npm test
npm run build
git diff --check
```

---

## Batch 2: Pre-live Acceptance Manifest

**Outcome:** The pre-live checklist can be exported as a local manifest and read back by the product, similar to P0/P1 acceptance.

Planned scope:
- Add a backend manifest model for pre-live readiness.
- Record checklist status, passed gates, blockers, adapter ids, audit event ids, and live-blocked boundary.
- Add `/api/p2/pre-live/acceptance/latest`.
- Add a compact readback card in Execution and Audit.
- Reject any manifest that claims live trading is allowed.

### Progress

- [x] Added `quant_core.p2_acceptance` with strict `aiqt.p2PreLiveAcceptanceManifest` validation.
- [x] Added `GET /api/p2/pre-live/acceptance/latest` and a missing/invalid/passed status projection.
- [x] Rejected unsafe manifests that enable order submission, allow live trading, submit live orders, execute routes, or omit the live-blocked boundary.
- [x] Added typed frontend loading through `loadP2PreLiveAcceptanceLatest`.
- [x] Added `buildP2PreLiveAcceptanceSummary` so UI state always forces `orderSubmissionEnabled=false` and `liveTradingAllowed=false`.
- [x] Added Execution and Audit readback cards for source path, context, adapter, checklist state, gate counts, blockers, audit ids, and live-blocked boundary.
- [x] Added focused backend, frontend model/API, and layout contract tests.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p2_pre_live_acceptance
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts -t "P2 pre-live acceptance"
npm run test --workspace @aiqt/web -- layout-css.test.js -t "P2 pre-live acceptance|promotion readiness|pre-live runbook"
```

---

## Batch 3: Adapter Chain Health Rollup

**Outcome:** Settings and Execution stop showing adapter evidence as a long raw list. The product shows one chain health rollup per adapter route.

Planned scope:
- Collapse secret reference, materialization, manifest validation, environment binding, reload plan, reload execution, reload acceptance, orchestration dry-run, orchestration execution, human confirmation, sandbox probe, paper route runbook, ops state, and adapter paper execution into a chain summary.
- Keep raw ledgers available for audit drilldown.
- Show the current blocker and latest valid evidence id.

### Progress

- [x] Added `ExecutionAdapterChainHealthRollup` and `buildExecutionAdapterChainHealthRollups`.
- [x] Collapsed the live adapter path into a fixed 19-stage evidence chain from secret reference through adapter paper execution.
- [x] Added model tests for empty, partially recorded, blocked, and complete paper-only chain states.
- [x] Wired the rollup into Execution as a compact Adapter Chain Health panel.
- [x] Added the same rollup into Settings below real adapter health so configuration and execution read the same blocker state.
- [x] Added layout contract coverage for `.workflow-adapter-chain-health-panel`, `.settings-adapter-chain-health`, and compact chain row styles.
- [x] Kept `orderSubmissionEnabled=false` and `liveTradingAllowed=false` even when the full paper-only chain is recorded.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "adapter chain health rollups|complete adapter chain"
npm run test --workspace @aiqt/web -- layout-css.test.js -t "adapter chain health|P2 pre-live acceptance|promotion readiness|pre-live runbook"
```

---

## Batch 4: Paper Execution Replay Gate

**Outcome:** A strategy cannot enter pre-live review unless its paper execution can be replayed from stored evidence.

Planned scope:
- Add replay integrity checks for paper orders, approvals, simulations, state history, and adapter paper execution.
- Summarize slippage, fees, position deltas, and route guards.
- Block pre-live readiness if replay evidence is missing or stale.

### Progress

- [x] Added `PaperExecutionReplayGate` and `buildPaperExecutionReplayGate`.
- [x] Added model tests for missing replay evidence, stale run-bound evidence, and complete aligned replay evidence.
- [x] Aggregated single-run paper execution, portfolio order ledger, portfolio approvals, portfolio simulations, state history, portfolio replay, adapter paper execution, and live boundary into one gate.
- [x] Added an Execution workspace `PaperExecutionReplayGatePanel` before promotion so operators see replay blockers before pre-live advancement.
- [x] Added layout contract coverage for `.workflow-paper-replay-gate-panel`, `.paper-replay-gate`, metrics, and item rows.
- [x] Fed replay readiness into `buildPreLiveReadinessChecklist` as the sixth `paper-execution-replay` gate, so pre-live review cannot become a manual-route candidate when replay evidence is missing, stale, or partial.
- [x] Added `paper-execution-replay` to the P2 acceptance manifest required checks, and updated readback fixtures to show replay evidence as part of the acceptance contract.
- [x] Kept `preLiveReviewAllowed=false`, `orderSubmissionEnabled=false`, and `liveTradingAllowed=false` even when replay evidence is complete.

Remaining scope:
- [ ] Add backend replay manifest/readback if the frontend gate needs portable acceptance evidence.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "replay gate|pre-live replay"
npm run test --workspace @aiqt/web -- layout-css.test.js -t "paper execution replay gate|adapter chain health"
```

---

## Batch 5: Operator Runbook

**Outcome:** A small team has a readable runbook for what to check before any future sandbox or live connector work.

Planned scope:
- Generate a runbook from current adapter chain health and pre-live checklist.
- Include kill switch, limits, rollback owner, environment state, data freshness, and audit package links.
- Allow recording the runbook into Audit.

---

## P2 Acceptance Definition

P2 is accepted only when a local user can:

1. Run a P1-accepted research workflow.
2. Produce a paper-only execution and replay it.
3. See one clear pre-live checklist with passed gates, blockers, next action, and audit evidence.
4. Export or read back a P2 pre-live acceptance manifest.
5. Trace every readiness claim back to an audit event or local manifest.
6. Confirm the platform still does not submit real orders, connect to a live broker route, or set `liveTradingAllowed=true`.
