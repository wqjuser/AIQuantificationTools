# AIQuant P1 Personal Research Ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the P0 single-symbol proof loop into a daily-use personal and small-team quant research operations platform.

**Architecture:** P1 builds on the existing P0 contracts instead of adding a parallel product. The first wave aggregates existing watchlist cache refresh evidence, audited research runs, AI review evidence, paper simulation records, portfolio paper order ledgers, and audit reports into task-oriented queues. Live trading remains blocked; P1 improves research throughput, reproducibility, and collaboration before any real broker route is considered.

**Tech Stack:** Python local core under `services/quant_core/quant_core`, React/TypeScript/Vite frontend under `apps/web/src`, SQLite-backed local stores, Vitest frontend tests, Python unittest backend tests, Docker Compose deployment, Markdown product documentation.

---

## P1 Product Diagnosis

P0 now proves that one user can run the local closed loop:

```text
symbol -> data readiness -> structured strategy -> audited backtest -> evidence AI review -> paper simulation -> export/import -> acceptance manifest
```

That is necessary, but not enough for daily use. A personal or small-team quant workflow needs to answer these questions quickly:

1. Which watched symbols need data repair?
2. Which watched symbols are ready for an audited research run?
3. Which audited runs still need AI review?
4. Which AI-reviewed runs are paper-only simulation candidates?
5. Which portfolio paper orders are waiting for risk or human action?
6. Which evidence packages are signed, stale, importable, or blocked?

P1 should therefore organize the product around operational queues, not more isolated evidence panels.

---

## P1 Operating Rules

1. P1 must keep `paperOnly=true`, `liveTradingAllowed=false`, `orderSubmitted=false`, `liveOrderSubmitted=false`, and `routeExecuted=false` unless a later P2 live-readiness plan explicitly unlocks a certified route.
2. Each batch must connect at least two existing evidence sources into a user-visible queue or workflow.
3. Each batch must update `docs/product-plan.md` with the user-visible value and remaining limits.
4. Each batch must include model tests and, when UI changes are involved, layout contract tests.
5. Every batch ends with:

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts layout-css.test.js
npm test
npm run build
git diff --check
```

---

## Batch 1: Watchlist Research Ops Queue

**Outcome:** Market/Research users can see a queue of watched symbols with the next useful action: refresh data, run audited pipeline, run AI review, or stage paper-only simulation.

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `docs/product-plan.md`

### Task 1.1: Build queue model from existing evidence

- [x] **Step 1: Write failing model tests**

Add tests proving `buildResearchOpsQueueRows`:
- includes the selected symbol even if it is not in the watchlist
- marks symbols with missing, failed, incomplete, demo, or warning cache evidence as `needs_data`
- marks symbols with clean cache evidence and no audited run as `ready_for_pipeline`
- marks symbols with an audited run but no AI report as `needs_ai_review`
- marks symbols with an AI-reviewed audited run as `paper_candidate`
- returns a summary with counts for data repair, pipeline-ready, AI-review, and paper-candidate buckets

- [x] **Step 2: Implement queue projection**

Add `ResearchOpsQueueRow`, `ResearchOpsQueueSummary`, and `buildResearchOpsQueueRows` in `terminal-workbench.ts`. The function should only consume existing frontend evidence: workspace, run history, and watchlist cache refresh runs.

- [x] **Step 3: Render compact queue in Market workspace**

Add `ResearchOpsQueuePanel` in `App.tsx`, placing it in the Market workspace near the scanner and data health panels. The panel should be dense, not card-heavy, and should not introduce a nested scroll area.

- [x] **Step 4: Add action wiring**

Rows should provide explicit actions:
- `refresh-watchlist-cache` calls the existing watchlist cache refresh action
- `run-pipeline` selects the symbol and runs the existing P0 pipeline
- `run-ai-review` replays/selects the run and runs the existing AI review action
- `submit-paper-order` selects the run context and routes to the existing paper simulation path

- [x] **Step 5: Verify**

Run the P1 batch verification commands above.

---

## Batch 2: Strategy Version Governance Queue

**Outcome:** Strategy users can see which saved versions are drafts, audited, imported, stale against the current context, or require re-audit.

Scope:
- Promote existing strategy library rows into a governance queue.
- Show context mismatch, schema validation, latest audit run, and import provenance.
- Add a deterministic action to load, diff, validate, and rerun a stale version.

Progress:
- [x] Added `buildStrategyGovernanceQueueRows` to project current drafts, saved versions, strategy diff rows, local schema/risk validation, context mismatch, and latest audit run evidence into a single queue.
- [x] Added model tests covering current draft, audited version, cross-context imported version, same-context stale version, draft requiring re-audit, and blocked schema cases.
- [x] Added a compact Strategy Lab governance queue with save, load, and load-plus-rerun actions.
- [x] Added guarded frontend action wiring so load-plus-rerun waits for the saved strategy snapshot to become the active workspace before calling the existing audited pipeline.
- [x] Added layout contract coverage for the governance queue.

Deferred:
- Arbitrary code strategies.
- OR-condition trees beyond the structured builder already present.

---

## Batch 3: Portfolio Paper Ops Queue

**Outcome:** Portfolio and Execution users can see one operational queue for portfolio paper orders: waiting for risk, waiting for human approval, ready for simulation, simulated, rejected, or stale.

Scope:
- Aggregate portfolio paper order batches, approvals, route rows, simulation rows, replay, and adapter paper evidence.
- Add row-level focus actions into Portfolio and Execution.
- Keep every route paper-only.

Progress:
- [x] Added `buildPortfolioPaperOpsQueueRows` to aggregate lifecycle batches, approval rows, simulation route rows, state timeline rows, adapter paper execution evidence, and stale batch evidence into one operational queue.
- [x] Added model coverage for stale batch evidence, waiting risk review, waiting human review, ready-for-simulation, rejected, and already-simulated rows.
- [x] Added a compact Portfolio Paper Ops Queue in the shared Execution panel, so both Portfolio and Execution workspaces expose the same next-action list.
- [x] Wired queue actions so ready rows reuse the existing paper-only simulator, while review/rejected/simulated/stale rows focus existing portfolio order evidence instead of approving or routing automatically.
- [x] Added layout contract coverage for the compact queue.

Deferred:
- Real broker orders.
- Automatic rebalancing.

---

## Batch 4: Evidence Package Control Room

**Outcome:** Audit users can see which runs have complete export packages, signed reports, valid import verification, and P0/P1 evidence coverage.

Scope:
- Aggregate export package index, report ledger, import audit events, signatures, and P0 acceptance reviews.
- Add a single evidence status per run: complete, unsigned, stale signature, import blocked, acceptance missing, or ready for archive.

Progress:
- [x] Added `buildEvidencePackageControlRoomRows` to aggregate export package index rows, signed/unsigned/stale report ledger rows, import audit events, P0 acceptance review events, and latest P0 acceptance summary into one per-run control room.
- [x] Added model coverage for import blocked, package blocked, acceptance missing, stale signature, unsigned, ready-for-archive, and complete evidence package rows.
- [x] Added an Audit workspace Evidence Package Control Room entry panel with compact summary counts, four gate chips per run, and action wiring into package focus, import audit, P0 acceptance, signature ledger, and archive evidence queries.
- [x] Added layout contract coverage so the control room remains the Audit workspace entry point and does not introduce nested scroll containers.

Deferred:
- Multi-user permissioning.
- SaaS sharing.

---

## Batch 5: Local Team Handoff Notes

**Outcome:** A small team can attach structured handoff notes to a run, strategy version, portfolio order batch, or acceptance manifest without using free-form chat as the source of truth.

Scope:
- Local-only notes with subject type, subject id, body, updatedAt, and audit event id.
- Export/import these notes with research packages when bound to a run.
- AI can summarize handoff notes only when they are passed as evidence.

Progress:
- [x] Added a local SQLite handoff note store and `/api/handoff-notes` create/list contract for structured run-bound notes, with each save mirrored into the generic audit event ledger.
- [x] Extended research run export/import packages with `handoffNotes[]` and `manifest.artifactCounts.handoffNotes`, including package consistency checks, import rollback, and import undo restoration.
- [x] Added typed web API support, export browser/import diff count validation, and a Research workspace handoff notes panel bound to the current audited run.
- [x] Added focused backend coverage for note persistence, audit events, export/import preservation, and API import preservation; added frontend model coverage through the export/import package rows.

Deferred:
- Real accounts, comments, identity, and permissions.

---

## Batch 6: P1 Acceptance Gate

**Outcome:** Docker/local smoke can verify the P1 daily research ops path, not only the P0 single-symbol loop.

Scope:
- Run watchlist refresh.
- Verify queue buckets.
- Run pipeline for at least one queue-ready peer.
- Run AI review for one audited queued run.
- Confirm no live route opens.
- Emit a P1 acceptance manifest.

Progress:
- [x] Added `tools/docker_smoke.py --p1-acceptance` to read the workspace watchlist, require at least three symbols, refresh watchlist cache evidence, choose a refreshed queue-ready symbol, run an audited pipeline, run AI review, run paper-only simulation, export/import the package, and revalidate the imported package.
- [x] Extended the P0 pipeline payload with `watchlistRefreshRunId`, so P1 acceptance runs lock the matching watchlist cache refresh evidence into the audited run data snapshot and exported package.
- [x] Added `aiqt.p1AcceptanceManifest`, offline validation, `npm run docker:smoke:p1`, `npm run docker:smoke:p1:validate`, and CI artifact upload for `data/p1-acceptance.json`.
- [x] Added contract tests covering P1 manifest validation, P1 smoke sequencing, and watchlist refresh provenance on the audited pipeline run.
- [x] Added product readback for the P1 acceptance gate: `quant_core.p1_acceptance`, `GET /api/p1/acceptance/latest`, typed frontend loading, P1 summary modeling, and a compact workbench card that shows watchlist count, queued symbol, check coverage, source path, and the forced live-blocked boundary.

Deferred:
- CI matrix across all optional data providers.
- Real brokerage sandbox.

---

## P1 Acceptance Definition

P1 is accepted only when a fresh local user can:

1. Open the app at `http://127.0.0.1:5173`.
2. Load a watchlist with at least three symbols.
3. Refresh watchlist cache and see per-symbol evidence.
4. Use Research Ops Queue to run one audited pipeline from a ready symbol.
5. Use the queue to run AI review for one audited run.
6. Use the queue to stage one paper-only simulation candidate.
7. See portfolio paper ops and audit package status without manually hunting through unrelated panels.
8. Export/import evidence without losing queue provenance.
9. Confirm every execution route still says live trading is blocked.

---

## Explicitly Deferred Until P2

- Real A-share broker trading.
- Real US brokerage trading.
- Crypto exchange order submission.
- Multi-user accounts and cloud collaboration.
- Automatic live promotion.
- Arbitrary user code strategy runtime.
- Full optimizer-grade portfolio construction.
