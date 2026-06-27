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
- [x] Added backend `quant_core.p2_paper_replay` validation and `GET /api/p2/paper-replay/latest` readback for portable `aiqt.p2PaperReplayManifest` evidence.
- [x] Added typed frontend loading through `loadP2PaperReplayLatest` and `buildP2PaperReplaySummary`, plus an Execution replay manifest card next to the live replay gate.
- [x] Rejected unsafe replay manifests that enable order submission, allow live trading, submit live orders, execute routes, omit `liveBlockedBoundary`, or lack required replay checks.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p2_paper_replay
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts layout-css.test.js -t "P2 paper replay"
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

### Progress

- [x] Added `OperatorRunbookSummary` and `buildOperatorRunbookSummary` to combine pre-live checklist, paper execution replay, adapter chain health, P2 acceptance, and the safety boundary into one operator-facing runbook.
- [x] Added `buildOperatorRunbookMarkdown` so the same summary can become an audit/download artifact later.
- [x] Rendered a compact Execution workspace `OperatorRunbookPanel` between P2 acceptance and the lower-level adapter pre-live runbook.
- [x] Included kill switch, rollback owner, position limit, data freshness, environment state, and audit package in the runbook controls.
- [x] Kept `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false` in the operator runbook.
- [x] Added `buildOperatorRunbookAuditEvent` so the operator runbook can be copied, downloaded, and recorded as an `operator_runbook_report` audit artifact without storing raw markdown in the event.
- [x] Added ledger support for `aiqt.operatorRunbookReport`, including structured metadata for controls, section state, section evidence, safety flags, and query/search fields.
- [x] Added `buildOperatorRunbookAuditCoverage` plus Execution UI coverage actions to show missing, matched, and stale audit states and to focus/copy the matching audit query.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts layout-css.test.js -t "operator runbook"
```

---

## Batch 6: Readiness Evidence Coverage Matrix

**Outcome:** Execution users can see whether every P2 readiness claim is backed by an audit event or local manifest before trusting the operator runbook.

Scope:
- Combine P2 paper replay manifest, P2 pre-live acceptance manifest, operator runbook audit coverage, pre-live checklist state, adapter chain health, and the safety boundary into one coverage matrix.
- Classify each readiness claim as covered, missing, stale, or blocked.
- Keep live/order flags locked even when coverage is complete.

### Progress

- [x] Added `P2ReadinessEvidenceCoverage` and `buildP2ReadinessEvidenceCoverage`.
- [x] Added model tests for fully covered evidence and mixed missing/stale/unsafe evidence.
- [x] Rendered an Execution workspace `P2ReadinessEvidenceCoveragePanel` between P2 acceptance and the operator runbook.
- [x] Added layout contract coverage for `.workflow-p2-evidence-coverage-panel`, `.p2-evidence-coverage`, grid rows, and the `p2-coverage` grid area.
- [x] Kept `orderSubmissionEnabled=false` and `liveTradingAllowed=false` in the coverage summary.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts layout-css.test.js -t "P2 readiness evidence coverage"
```

---

## Batch 7: P2 Acceptance Gate

**Outcome:** The P2 acceptance definition is visible as one top-level product gate, so a local operator can tell whether the whole pre-live readiness phase is accepted, incomplete, or blocked.

Scope:
- Combine P1 acceptance, paper execution replay, pre-live checklist, P2 pre-live manifest, readiness evidence coverage, and the live-blocked boundary into one six-criterion summary.
- Show the gate in Execution before the evidence coverage matrix.
- Keep the gate read-only and fixed to paper-only/live-blocked behavior.

### Progress

- [x] Added `P2ReadinessAcceptanceSummary` and `buildP2ReadinessAcceptanceSummary`.
- [x] Added model tests for accepted and blocked P2 acceptance states.
- [x] Rendered a compact Execution workspace `P2ReadinessAcceptancePanel` before the evidence coverage matrix.
- [x] Added layout contract coverage for `.workflow-p2-readiness-acceptance-panel`, `.p2-readiness-acceptance`, row grid, and the `p2-readiness` grid area.
- [x] Kept `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false` in the top-level gate.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts layout-css.test.js -t "P2 readiness acceptance|P2 top-level readiness acceptance"
```

---

## Batch 8: P2 Readiness Acceptance Manifest Readback

**Outcome:** The top-level P2 gate is now backed by a portable local manifest, so the product can distinguish an in-memory gate summary from a persisted acceptance artifact.

Scope:
- Add a strict backend validator for `aiqt.p2ReadinessAcceptanceManifest`.
- Add `GET /api/p2/readiness/acceptance/latest`, projecting `data/p2-readiness-acceptance.json` into an accepted, missing, or invalid status.
- Add typed frontend readback and show manifest source, run id, criterion counts, coverage state, and live-blocked safety fields in the Execution P2 acceptance gate.
- Keep the manifest read-only and reject any artifact that opens order submission, live trading, live order submission, or route execution.

### Progress

- [x] Added `quant_core.p2_readiness_acceptance` with strict top-level readiness manifest validation.
- [x] Added `/api/p2/readiness/acceptance/latest` and backend tests for accepted, missing, invalid, and API readback states.
- [x] Added `buildP2ReadinessAcceptanceLatestUrl`, `loadP2ReadinessAcceptanceLatest`, fallback status projection, and frontend contract guards.
- [x] Updated `P2ReadinessAcceptancePanel` to read the latest local manifest, expose refresh, and show source path, run id, criterion counts, coverage state, and the forced live-blocked boundary.
- [x] Added layout/API client contract coverage for the readback strip and refresh wiring.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p2_readiness_acceptance
npm run test --workspace @aiqt/web -- terminal-api.test.ts layout-css.test.js -t "P2 readiness acceptance|P2 top-level readiness acceptance"
```

---

## Batch 9: P2 Audit Review And Portable Note

**Outcome:** Audit users can review the same top-level P2 readiness manifest outside the Execution page and export a Markdown note for local or small-team review.

Scope:
- Add a portable `buildP2ReadinessAcceptanceReviewMarkdown` function.
- Render a P2 readiness acceptance review panel inside the Audit workspace after the P2 pre-live manifest readback.
- Include manifest source, run id, market context, adapter id, linked manifest paths, criterion ids, audit event ids, readiness coverage status, and forced live-blocked execution boundary.
- Keep this batch copy/download/refresh only; audit-ledger recording can be added as a later explicit batch.

### Progress

- [x] Added a P2 readiness acceptance review source contract and Markdown builder.
- [x] Added model coverage proving the exported review states `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, `routeExecuted=false`, and `liveBlockedBoundary=true`.
- [x] Added `P2ReadinessAcceptanceReviewPanel` in Audit with copy, download, and refresh actions.
- [x] Added layout contract coverage for `.workflow-p2-readiness-acceptance-audit-panel`, `.p2-readiness-acceptance-review`, criterion rows, and the `p2-readiness-review` audit grid area.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts layout-css.test.js -t "P2 readiness acceptance review|P2 readiness acceptance manifest review"
```

---

## Batch 10: P2 Readiness Acceptance Review Audit Ledger

**Outcome:** Audit users can record the P2 top-level readiness review as a searchable ledger event instead of leaving it as an ephemeral browser note.

Scope:
- Build a `p2_readiness_acceptance_review` audit event from the current readback manifest, review Markdown, and P2 acceptance summary.
- Store only the Markdown sha256, filename, manifest metadata, upstream manifest paths, criterion ids, audit event ids, and forced paper-only/live-blocked boundary.
- Add a Record action to the Audit P2 review panel.
- Include the new event type in the Audit report ledger query and ledger row builder.
- Keep the event as evidence only; it never authorizes order submission or live routing.

### Progress

- [x] Added `buildP2ReadinessAcceptanceReviewAuditEvent` with sha256 metadata, criterion/audit ids, manifest paths, and forced live-blocked safety flags.
- [x] Added a P2 review Record action and saving state to the Audit workspace panel.
- [x] Added `p2_readiness_acceptance_review` to the Audit report event query.
- [x] Added `p2_readiness_acceptance_review` ledger support with `aiqt.p2ReadinessAcceptanceReview`, focus query, criterion counts, status label, and search coverage.
- [x] Added focused API, layout wiring, and ledger model tests.

### Verification

```powershell
npm run test --workspace @aiqt/web -- terminal-api.test.ts -t "P2 readiness acceptance review audit event"
npm run test --workspace @aiqt/web -- layout-css.test.js -t "P2 readiness acceptance manifest review"
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts -t "P2 readiness acceptance review events"
```

---

## Batch 11: P2 Readiness Acceptance Docker Smoke

**Outcome:** P2 readiness acceptance is no longer only a UI/backend readback artifact. A local deployment can aggregate already archived P1/P2 evidence into a top-level P2 readiness manifest and validate it offline.

Scope:
- Add Docker smoke helpers that read `data/p1-acceptance.json`, `data/p2-pre-live-acceptance.json`, and `data/p2-paper-replay.json`.
- Validate all three upstream manifests before building `aiqt.p2ReadinessAcceptanceManifest`.
- Add CLI/package commands for generation and offline validation.
- Keep the command honest: missing upstream evidence fails instead of being synthesized.

### Progress

- [x] Added `build_p2_readiness_acceptance_manifest`, `run_p2_readiness_acceptance`, writer, loader, and validator wrappers to `tools/docker_smoke.py`.
- [x] Reused strict backend validators for P2 pre-live, P2 paper replay, and P2 readiness acceptance.
- [x] Added CLI flags `--p2-readiness-acceptance`, `--p2-readiness-acceptance-report`, `--validate-p2-readiness-acceptance-report`, and upstream evidence path overrides.
- [x] Added root scripts `docker:smoke:p2` and `docker:smoke:p2:validate`.
- [x] Added Python contract tests for manifest build/validation, report aggregation, and validate-only CLI mode.
- [x] Kept `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false`; any unsafe upstream or output manifest fails validation.

### Verification

```powershell
python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_docker_smoke_builds_and_validates_p2_readiness_acceptance_manifest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_docker_smoke_p2_readiness_acceptance_aggregates_existing_reports services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_docker_smoke_cli_validates_p2_readiness_report_without_compose
npm run docker:smoke:p2:validate
```

---

## Batch 12: P2 Paper Replay Manifest Generator

**Outcome:** A local deployment can generate the portable `aiqt.p2PaperReplayManifest` from an existing research run export package instead of hand-writing `data/p2-paper-replay.json`.

Scope:
- Add a backend builder that reads a run export package and extracts paper execution, portfolio paper order, approval, simulation, state replay, adapter paper execution, and live-blocked evidence.
- Add a Docker smoke command that derives the run id from `data/p1-acceptance.json`, downloads `/api/research/runs/{runId}/export`, and writes `data/p2-paper-replay.json`.
- Validate the generated manifest with the same strict P2 paper replay validator used by product readback.
- Keep the command honest: missing upstream evidence fails instead of being created by the smoke command.

### Progress

- [x] Added `build_p2_paper_replay_manifest_from_export_package` to `quant_core.p2_paper_replay`.
- [x] Required the source export package to remain `paperOnly=true`, `liveTradingAllowed=false`, and `liveBlockedBoundary=true`.
- [x] Required paper execution, portfolio order, approval, filled simulation, state replay, adapter paper execution, and audit evidence before emitting a manifest.
- [x] Added `run_p2_paper_replay`, writer, validator wrapper, and CLI flags to `tools/docker_smoke.py`.
- [x] Added root script `docker:smoke:p2:paper-replay`.
- [x] Added contract tests for backend generation, unsafe source rejection, and Docker smoke report generation.
- [x] Kept `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false`; any unsafe source export or output manifest fails validation.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_paper_replay_manifest_can_be_built_from_research_export_package" -k "docker_smoke_p2_paper_replay_generates_manifest"
```

Full deployment use:

```powershell
npm run docker:smoke:p2:paper-replay -- --no-build
```

This deployment command intentionally fails when the selected run export package has not yet recorded the required paper replay evidence.

---

## Batch 13: P2 Pre-live Acceptance Manifest Generator

**Outcome:** A local deployment can generate `data/p2-pre-live-acceptance.json` from already archived P1 acceptance and P2 paper replay evidence instead of requiring a hand-written P2 pre-live manifest.

Scope:
- Add a backend builder that validates `aiqt.p1AcceptanceManifest` and `aiqt.p2PaperReplayManifest` before producing `aiqt.p2PreLiveAcceptanceManifest`.
- Keep the generated checklist honest by recording `adapter-certification` and `human-confirmation` as blockers.
- Add a Docker smoke command that reads `data/p1-acceptance.json` and `data/p2-paper-replay.json`, then writes `data/p2-pre-live-acceptance.json`.
- Keep all live/order fields disabled even when the manifest validates.

### Progress

- [x] Added `build_p2_pre_live_acceptance_manifest` to `quant_core.p2_acceptance`.
- [x] Validated P1 acceptance and P2 paper replay inputs before emitting a P2 pre-live manifest.
- [x] Rejected input context mismatches across market, symbol, and timeframe.
- [x] Generated a fixed six-gate pre-live checklist with four evidence gates passed and two blockers: `adapter-certification` and `human-confirmation`.
- [x] Added `run_p2_pre_live_acceptance`, writer, validator wrapper, and CLI flags to `tools/docker_smoke.py`.
- [x] Added root script `docker:smoke:p2:pre-live`.
- [x] Added contract tests for backend generation, mismatch rejection, and Docker smoke report generation.
- [x] Kept `manualRouteCandidate=false`, `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false`.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_pre_live_acceptance_manifest_can_be_built_from_p1_and_paper_replay" -k "docker_smoke_p2_pre_live_acceptance_generates_manifest"
```

Full deployment use:

```powershell
npm run docker:smoke:p2:pre-live -- --no-build
```

This deployment command intentionally preserves adapter certification and human confirmation blockers; it does not promote a paper replay into live trading.

---

## Batch 14: P2 Manifest Chain Smoke And Offline Validators

**Outcome:** A local operator can run the P2 manifest chain as one command and validate every archived P2 manifest layer offline.

Scope:
- Add offline validators for `aiqt.p2PaperReplayManifest` and `aiqt.p2PreLiveAcceptanceManifest`.
- Add package scripts for upstream P2 validation.
- Add a chain smoke script that runs paper replay generation, pre-live acceptance generation, and top-level readiness aggregation in one Docker smoke session.
- Keep missing upstream evidence as a hard failure; the chain must not synthesize unavailable paper execution, approval, or adapter evidence.

### Progress

- [x] Added `--validate-p2-paper-replay-report` and `--validate-p2-pre-live-acceptance-report` to `tools/docker_smoke.py`.
- [x] Added root scripts `docker:smoke:p2:paper-replay:validate` and `docker:smoke:p2:pre-live:validate`.
- [x] Added root script `docker:smoke:p2:chain` to run paper replay, pre-live acceptance, and readiness acceptance in order.
- [x] Added contract tests proving upstream validators do not call `run_smoke`.
- [x] Added package script tests proving the chain script includes all three P2 phases and expected manifest paths.
- [x] Kept the chain evidence-only: validation and aggregation still reject unsafe live/order fields.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "docker_smoke_cli_validates_p2_upstream_reports_without_compose" -k "package_exposes_p2_chain"
```

Full deployment use:

```powershell
npm run docker:smoke:p2:chain -- --no-build
npm run docker:smoke:p2:paper-replay:validate
npm run docker:smoke:p2:pre-live:validate
npm run docker:smoke:p2:validate
```

The chain command still fails honestly when `data/p1-acceptance.json` is missing or the selected export package lacks complete paper replay evidence.

---

## Batch 15: P2 Manifest Chain Preflight

**Outcome:** A local operator can inspect why the P2 manifest chain is blocked before running Docker smoke commands.

Scope:
- Add an offline preflight report that checks P1 acceptance, P2 paper replay, P2 pre-live acceptance, and P2 readiness acceptance manifests.
- Reuse each layer's strict validator instead of adding looser status checks.
- Classify every stage as `valid`, `missing`, or `invalid`.
- Emit the first blocker, next action, and recommended command.
- Keep this command read-only; it must not generate missing evidence or start Docker.

### Progress

- [x] Added `build_p2_manifest_chain_preflight` to `tools/docker_smoke.py`.
- [x] Added `validate_p2_manifest_chain_preflight` and a report writer for `aiqt.p2ManifestChainPreflight`.
- [x] Added CLI flag `--p2-chain-preflight-report`.
- [x] Added root script `docker:smoke:p2:preflight`.
- [x] Added tests for all-missing, readiness-missing, CLI report writing, and package script coverage.
- [x] Kept preflight read-only: it reports blockers and commands, but never creates missing upstream manifests.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_chain_preflight" -k "package_exposes_p2_chain"
```

Full deployment use:

```powershell
npm run docker:smoke:p2:preflight
npm run docker:smoke:p2:chain -- --no-build
```

The preflight report is an operator aid only. It does not authorize live trading and does not bypass missing paper execution evidence.

---

## Batch 16: P2 Manifest Chain Preflight Readback

**Outcome:** A local operator can see the archived P2 manifest-chain preflight result inside the workbench, not only in the terminal.

Scope:
- Add a product-layer reader for `data/p2-chain-preflight.json`.
- Validate the preflight report shape, stage order, valid-stage count, blocker ids, next command, and live-blocked boundary.
- Expose `GET /api/p2/manifest-chain/preflight/latest`.
- Add a typed frontend loader and summary model.
- Show the preflight in Execution as a compact read-only panel with stage statuses and the recommended next command.
- Keep the panel read-only: it does not start Docker, generate missing evidence, connect to brokers, or enable live execution.

### Progress

- [x] Added `quant_core.p2_manifest_chain_preflight`.
- [x] Added `aiqt.p2ManifestChainPreflightStatus` projection.
- [x] Added `/api/p2/manifest-chain/preflight/latest`.
- [x] Added frontend URL builder, loader, fallback status, and runtime contract guard.
- [x] Added `buildP2ManifestChainPreflightSummary`.
- [x] Added Execution workbench panel for the current preflight blocker and recommended command.
- [x] Added focused backend and frontend tests for blocked, missing, invalid, and API readback states.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_manifest_chain_preflight_status" -k "p2_manifest_chain_preflight_latest_api"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts -t "P2 manifest chain preflight"
```

The readback is an operator surface only. It must not auto-run missing phases or translate a ready preflight into live-trading permission.

---

## Batch 17: P2 Manifest Chain Preflight Generation Endpoint

**Outcome:** A local operator can generate the current P2 manifest-chain preflight report from the product service, not only from a terminal command.

Scope:
- Add a core-service builder for `aiqt.p2ManifestChainPreflight` that checks P1 acceptance, P2 paper replay, P2 pre-live acceptance, and P2 readiness acceptance reports.
- Add `POST /api/p2/manifest-chain/preflight` to write `data/p2-chain-preflight.json` and return the validated status.
- Add a typed frontend client and an Execution panel action to generate the preflight report.
- Keep this action narrow: it only validates existing manifests and writes the preflight report. It does not run Docker, generate missing upstream evidence, connect to brokers, submit orders, or enable live trading.

### Progress

- [x] Added `build_p2_manifest_chain_preflight` and `write_p2_manifest_chain_preflight_report` to `quant_core.p2_manifest_chain_preflight`.
- [x] Added `POST /api/p2/manifest-chain/preflight`.
- [x] Added `buildP2ManifestChainPreflightUrl` and `generateP2ManifestChainPreflight`.
- [x] Added a "Generate" action to the Execution P2 manifest-chain preflight panel.
- [x] Added focused backend, frontend API, and layout contract tests.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_manifest_chain_preflight_can_be_generated" -k "p2_manifest_chain_preflight_generate_api"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "generates the P2 manifest chain preflight"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 manifest chain preflight from the execution panel"
```

This generation endpoint is still a preflight-only operator aid. It must not synthesize missing P1/P2 artifacts or relax the forced live-blocked boundary.

---

## Batch 18: P2 Manifest Chain Preflight Audit Event

**Outcome:** A local operator can generate the P2 manifest-chain preflight from the product, then see the generated audit event id immediately in Execution.

Scope:
- Convert the generated `aiqt.p2ManifestChainPreflight` report into a compact `p2_manifest_chain_preflight` audit event.
- Store the preflight status, stage counts, blocker ids, next action, safety flags, and manifest SHA-256 in audit metadata.
- Return the audit event from `POST /api/p2/manifest-chain/preflight` and display its id in the Execution preflight panel.
- Make the event visible in the Audit report ledger as a read-only operator aid, searchable by status, blocker, and next action.
- Keep the event evidence-only: it must not create missing upstream manifests, trigger Docker, connect brokers, submit orders, or authorize live trading.

### Progress

- [x] Added `p2_manifest_chain_preflight_to_audit_event_payload` with deterministic event id and manifest SHA-256 metadata.
- [x] Updated `POST /api/p2/manifest-chain/preflight` to record the preflight event in the audit store and return `auditEvent`.
- [x] Updated the typed frontend client to preserve `auditEvent`.
- [x] Added Execution panel state and a compact audit event id line after generation.
- [x] Added Audit ledger recognition for `p2_manifest_chain_preflight` and kept signing controls disabled for this event type.
- [x] Added focused backend/API and frontend layout coverage.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_manifest_chain_preflight_generate_api"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "generates the P2 manifest chain preflight"
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 manifest chain preflight events"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 manifest chain preflight from the execution panel"
```

This audit event is a traceability marker for the operator preflight. It does not enter the signed research package by itself and does not relax the paper-only/live-blocked boundary.

---

## Batch 19: P2 Manifest Chain Preflight Audit Focus

**Outcome:** A local operator can generate a P2 manifest-chain preflight, click Audit from the Execution panel, and land on a deterministic Audit ledger query for that exact preflight evidence.

Scope:
- Add a stable Audit ledger query helper for `p2_manifest_chain_preflight` events.
- Include event id, short hash, source path, preflight status, stage coverage, next action, and blocker ids in the query.
- Wire the Execution preflight panel's Audit action to update the Audit query and URL instead of only switching workspaces.
- Fall back to the returned audit event id and current preflight summary when the ledger page has not yet refreshed.
- Keep the action read-only: it must not regenerate manifests, sign auxiliary evidence, submit paper orders, connect brokers, or relax live trading guards.

### Progress

- [x] Added `buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery`.
- [x] Added ledger filtering coverage for the new query helper.
- [x] Added `openP2ManifestChainPreflightAudit` in Execution and wired the panel Audit action to it.
- [x] Added layout/source coverage to prevent the Audit button from regressing into a plain workspace switch.
- [x] Updated README and product plan notes.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 manifest chain preflight events"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 manifest chain preflight from the execution panel"
```

This focus link is a navigation and traceability aid only. It does not enter the signed research package by itself and does not relax the paper-only/live-blocked boundary.

---

## Batch 20: P2 Readiness Acceptance Product Generation

**Outcome:** A local operator can generate the top-level P2 readiness acceptance manifest from the product instead of dropping into the Docker smoke script.

Scope:
- Move the top-level P2 readiness acceptance aggregation logic into `quant_core.p2_readiness_acceptance`.
- Add `POST /api/p2/readiness/acceptance` to read the archived P1 acceptance, P2 paper replay, and P2 pre-live acceptance manifests.
- Write `data/p2-readiness-acceptance.json`, then return the validated `aiqt.p2ReadinessAcceptanceStatus`.
- Add a typed frontend client and an Execution P2 acceptance card action for "Generate acceptance".
- Keep the action evidence-only: it must not create missing upstream manifests, run Docker, connect brokers, submit orders, or authorize live trading.

### Progress

- [x] Added core `build_p2_readiness_acceptance_manifest` and report writer.
- [x] Added `POST /api/p2/readiness/acceptance`.
- [x] Added backend contract coverage for writing and reading the generated manifest.
- [x] Added typed frontend generation client and contract coverage.
- [x] Added Execution panel state and a "Generate acceptance" action.
- [x] Updated README and product plan notes.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_readiness_acceptance_generate_api"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "generates the P2 readiness acceptance"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 top-level readiness acceptance"
```

This generation endpoint only aggregates already archived manifest evidence and preserves the live-blocked boundary.

---

## Batch 21: P2 Readiness Acceptance Generation Audit Event

**Outcome:** A local operator can generate the top-level P2 readiness acceptance manifest from the product and immediately see the audit event id for that generation action.

Scope:
- Convert the generated `aiqt.p2ReadinessAcceptanceManifest` into a compact `p2_readiness_acceptance_generated` audit event.
- Store the generated manifest status, run ids, criterion counts, manifest paths, manifest SHA-256, and forced live-blocked safety fields in audit metadata.
- Return the audit event from `POST /api/p2/readiness/acceptance` and display its id in the Execution P2 acceptance card.
- Keep the event evidence-only: it must not create missing upstream manifests, run Docker, connect brokers, submit orders, or authorize live trading.

### Progress

- [x] Added `p2_readiness_acceptance_to_audit_event_payload` with deterministic manifest hash metadata.
- [x] Updated `POST /api/p2/readiness/acceptance` to record and return `auditEvent`.
- [x] Updated the typed frontend generation client to preserve the returned audit event.
- [x] Added Execution panel state and a compact audit event id line after generation.
- [x] Added focused backend/API and frontend layout coverage.

### Verification

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k "p2_readiness_acceptance_generate_api"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "generates the P2 readiness acceptance"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 top-level readiness acceptance"
```

This audit event is a traceability marker for the product-side readiness acceptance generation. It does not enter the signed research package by itself and does not relax the paper-only/live-blocked boundary.

---

## Batch 22: P2 Readiness Acceptance Generation Audit Focus

**Outcome:** A local operator can jump from the Execution P2 top-level acceptance card directly to the Audit ledger row for the product-generated readiness acceptance manifest.

Scope:
- Include `p2_readiness_acceptance_generated` in the Audit report event fetch and ledger row builder.
- Build a stable Audit query from the generated event id, short manifest hash, source path, acceptance status, criterion coverage, run id, and market/symbol/timeframe context.
- Add an Audit action to the P2 readiness acceptance card with a fallback query when pagination has not yet loaded the generated row.
- Keep the generated event report-only: no signing-chain entry, no broker connection, no order submission, and no live boundary relaxation.

### Progress

- [x] Added `p2_readiness_acceptance_generated` to Audit ledger recognition, search text, package counts, policy detail, and report-only signing exclusions.
- [x] Added `buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery`.
- [x] Updated the Audit fetch event list and the Execution P2 top-level acceptance card Audit action.
- [x] Added focused ledger and layout coverage for generated-event search and UI focus wiring.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance generated events"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 top-level readiness acceptance|research context readiness reports"
```

This Audit focus action only improves traceability for the product-side readiness acceptance generation. It does not make readiness acceptance a signed research package artifact and does not relax the paper-only/live-blocked boundary.

---

## Batch 23: P2 Readiness Acceptance Review Audit Focus

**Outcome:** A local operator can record the P2 readiness acceptance review Markdown and immediately jump to the matching Audit ledger row.

Scope:
- Add a stable ledger query helper for `p2_readiness_acceptance_review` events.
- Preserve the `saveAuditEvent` response for the review panel so the saved event id remains visible after recording.
- Add an Audit action to the P2 readiness acceptance review panel with a fallback query when pagination has not yet loaded the saved review row.
- Keep the review event audit-only: no manifest regeneration, no signing-chain entry, no broker connection, no order submission, and no live boundary relaxation.

### Progress

- [x] Added `buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery`.
- [x] Stored the saved `p2_readiness_acceptance_review` event after successful review ledger recording.
- [x] Added a P2 review panel Audit action and compact audit event id display.
- [x] Added focused ledger and layout coverage for review-event query and UI focus wiring.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance review events"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness acceptance manifest review"
```

This Audit focus action only improves traceability for the manual readiness acceptance review. It does not make the review a live authorization artifact and does not relax the paper-only/live-blocked boundary.

---

## Batch 24: P2 Readiness Acceptance Audit Event Rehydration

**Outcome:** A local operator can reload the app after generating or recording P2 readiness acceptance audit evidence and still see the latest matching event id once the Audit ledger rows are loaded.

Scope:
- Resolve the latest matching `p2_readiness_acceptance_generated` or `p2_readiness_acceptance_review` ledger row by report kind plus run id, market, symbol, and timeframe.
- Use the resolved ledger row as a fallback event id for the Execution P2 readiness acceptance card and the Audit P2 readiness acceptance review panel.
- Keep the existing transient event response as the highest-priority source immediately after generation or review recording.
- Keep the resolver read-only: no event creation, no manifest generation, no cross-context matching, and no live boundary relaxation.

### Progress

- [x] Added `findLatestP2ReadinessAcceptanceAuditLedgerRow`.
- [x] Added focused coverage that ignores newer rows from other symbols while selecting the current generated/review rows.
- [x] Rehydrated generated/review event ids from the loaded Audit ledger when transient state is empty.
- [x] Updated layout coverage for the generated and review panels to use the rehydrated event ids.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "latest P2 readiness acceptance audit ledger row"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness acceptance manifest review|P2 top-level readiness acceptance"
```

This rehydration only improves continuity after reloads or workspace navigation. It reads the current Audit ledger and does not create evidence, submit orders, or relax the paper-only/live-blocked boundary.

---

## Batch 25: P2 Readiness Acceptance Audit Event Source Labels

**Outcome:** A local operator can tell whether a displayed P2 readiness acceptance audit event id came from the latest product response or from a rehydrated Audit ledger row.

Scope:
- Resolve generated/review audit event references as `response`, `ledger`, or `none`, preserving the product response as the highest-priority source.
- Show the event id source beside the Execution top-level acceptance card and Audit review panel event id.
- Add review-specific Audit ledger search text for `p2_readiness_acceptance_review` rows, including run id, context, criteria, upstream audit ids, and live-blocked boundary terms.
- Keep this read-only: no event creation, no signature status changes, no order submission, and no live boundary relaxation.

### Progress

- [x] Added `resolveP2ReadinessAcceptanceAuditEventReference`.
- [x] Added model coverage for response-first source resolution, ledger fallback, and missing event state.
- [x] Added review-specific search text for `p2_readiness_acceptance_review` rows.
- [x] Added generated/review panel source labels for response and ledger-rehydrated event ids.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance review rows|P2 readiness acceptance audit event id source"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness acceptance manifest review|P2 top-level readiness acceptance"
```

This source label only explains where existing audit evidence was found. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 26: P2 Readiness Acceptance Review Signature Boundary

**Outcome:** P2 readiness acceptance review events remain audit-aid evidence and cannot satisfy report signing readiness, even if legacy metadata includes a signature object.

Scope:
- Exclude `p2_readiness_acceptance_review` from Audit report ledger signing-eligible counts.
- Reuse the same signable-row rule for Evidence Package Control Room signature state.
- Disable Audit report row sign, verify, and revoke actions for P2 readiness acceptance review rows.
- Keep historical review events readable and searchable without changing their metadata, revoking anything, or altering live/order boundaries.

### Progress

- [x] Added regression coverage for review rows not affecting signing eligible counts or chain status.
- [x] Added regression coverage for P2 review-only evidence packages staying unsigned/missing-signature instead of ready for archive.
- [x] Extracted shared signing eligibility logic for ledger summary and evidence package signature state.
- [x] Disabled row-level sign, verify, and revoke actions for P2 readiness acceptance review rows.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "includes P2 readiness acceptance review events"
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance review rows out of evidence package signature readiness"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history from the backend ledger"
```

This boundary only keeps P2 readiness review evidence out of report signing and archive readiness. It does not delete evidence, mutate old events, submit orders, or relax the paper-only/live-blocked boundary.

---

## Batch 27: Audit Report Row Signing Eligibility Reuse

**Outcome:** Audit report row actions now use the same signing eligibility rule as the ledger summary and evidence package control room.

Scope:
- Export the shared `auditReportLedgerRowIsSigningEligible` helper for UI use.
- Replace the Audit report row sign, verify, and revoke report-kind exclusion lists with the shared helper.
- Keep audit-aid rows such as `operator_runbook_report`, P2 generated/review, pre-live runbook, research context readiness, and P0 readiness out of row-level signing actions.
- Keep historical rows readable and searchable without mutating event metadata, revoking old signatures, or altering live/order boundaries.

### Progress

- [x] Added focused model coverage for the exact report kinds that remain signing eligible.
- [x] Added layout coverage that the Audit report row action buttons call the shared eligibility helper.
- [x] Reused the shared helper in the row-level sign, verify, and revoke disabled states.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "marks only primary report ledger rows as signing eligible|P2 readiness acceptance review|evidence package signature readiness"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history from the backend ledger"
```

This reuse only prevents signing-boundary drift between the UI and model. It does not delete evidence, mutate old events, submit orders, or relax the paper-only/live-blocked boundary.

---

## Batch 28: P2 Readiness Acceptance Ledger Rehydration Exact Context Match

**Outcome:** P2 readiness acceptance generated/review event rehydration does not choose a newer row whose context only contains the requested symbol as a substring.

Scope:
- Keep `findLatestP2ReadinessAcceptanceAuditLedgerRow` read-only and limited to generated/review P2 readiness acceptance rows.
- Normalize row id, run id, file name, focus query, and search text into exact tokens before matching run id, market, symbol, and timeframe.
- Preserve current fallback behavior for legacy rows whose context appears in focus/search tokens.
- Keep this as an event-id rehydration fix only: no manifest generation, no new audit event, no signing change, and no live/order boundary relaxation.

### Progress

- [x] Added regression coverage where `600000` must not match a newer `6000001` P2 readiness acceptance generated event.
- [x] Replaced substring haystack matching with normalized token matching in the P2 readiness acceptance ledger resolver.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "finds the latest P2 readiness acceptance audit ledger row"
```

This exact matching only improves existing audit event lookup after reloads or workspace navigation. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 29: P2 Readiness Acceptance Response Event Context Guard

**Outcome:** A stale generated/review response event id no longer overrides the current P2 readiness acceptance readback context.

Scope:
- Pass the current P2 readiness acceptance run id, market, symbol, and timeframe into `resolveP2ReadinessAcceptanceAuditEventReference`.
- Keep response events highest priority only when their event/run/metadata tokens match the current readback context.
- Fall back to the matching ledger row or `none` when the response event belongs to another context.
- Keep this as a front-end event-id source fix only: no manifest generation, no audit mutation, no signing change, and no live/order boundary relaxation.

### Progress

- [x] Added model coverage where a stale response event for another symbol resolves to `none` instead of `response`.
- [x] Added layout coverage that generated and review reference resolution passes `p2ReadinessAcceptanceAuditContext`.
- [x] Added response-event token matching over event id, run id, summary, detail, and metadata values.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "resolves P2 readiness acceptance audit event id source|finds the latest P2 readiness acceptance audit ledger row"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness acceptance manifest review|P2 top-level readiness acceptance"
```

This guard only prevents stale response ids from being shown as current-context evidence. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 30: P2 Readiness Acceptance Token Delimiter Compatibility

**Outcome:** Legacy generated/review evidence whose context was written with comma or similar separators can still be matched without falling back to unsafe substring matching.

Scope:
- Reuse one tokenization path for P2 readiness acceptance ledger row rehydration and response-event context checks.
- Split tokens on common separators such as commas, slashes, semicolons, and whitespace while preserving hyphenated ids such as `run-p2-readiness`.
- Keep exact token matching so `600000` still does not match `6000001`.
- Keep this as lookup compatibility only: no manifest generation, no audit mutation, no signing change, and no live/order boundary relaxation.

### Progress

- [x] Added regression coverage where a legacy ledger row with `accepted,6/6,run-p2-readiness,ashare,600000,1d` wins as the latest matching row.
- [x] Added response-event coverage where metadata `context: "ashare,600000,1d"` still matches the current readback context.
- [x] Centralized token creation for row and response-event matching.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "finds the latest P2 readiness acceptance audit ledger row|resolves P2 readiness acceptance audit event id source"
```

This compatibility only helps locate existing audit evidence across older text formats. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 31: P2 Readiness Acceptance Ledger Detail Token Fallback

**Outcome:** Legacy P2 readiness acceptance ledger rows can be rehydrated when their context only appears in the row detail text.

Scope:
- Include `AuditEvidenceReportLedgerRow.detail` in the token set used by `findLatestP2ReadinessAcceptanceAuditLedgerRow`.
- Keep exact token matching and common delimiter compatibility from Batch 30.
- Tolerate legacy/manual rows with missing optional text fields by filtering empty token sources.
- Keep this as lookup compatibility only: no manifest generation, no audit mutation, no signing change, and no live/order boundary relaxation.

### Progress

- [x] Added regression coverage where a newer detail-only legacy generated row with `run-p2-readiness,ashare,600000,1d` is selected.
- [x] Added `detail` to the ledger row token set.
- [x] Hardened token creation against missing legacy row text fields.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "finds the latest P2 readiness acceptance audit ledger row|resolves P2 readiness acceptance audit event id source"
```

This fallback only helps locate existing audit evidence across older ledger row shapes. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 32: P2 Readiness Acceptance Ledger Query Text Parity

**Outcome:** P2 readiness acceptance generated/review ledger buttons carry the same searchable detail text that row filtering and rehydration already understand.

Scope:
- Append `AuditEvidenceReportLedgerRow.detail` and `searchText` to generated/review query builders after the stable kind/id/hash/file/focus prefix.
- Preserve the existing query prefix so current deep-link and filter behavior remains familiar.
- Keep the change frontend-only: no ledger mutation, manifest generation, signing eligibility change, or live/order boundary relaxation.

### Progress

- [x] Added regression coverage that review queries include detail-only `live blocked true` text.
- [x] Added regression coverage that generated queries include search-indexed `live-blocked-boundary` evidence text.
- [x] Updated generated/review query builders to append detail and search text.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "includes P2 readiness acceptance (review|generated) events in the audit report ledger"
```

This parity only improves Audit ledger navigation from existing UI buttons. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 33: P2 Readiness Acceptance Ledger Query Token Dedupe

**Outcome:** P2 readiness acceptance generated/review ledger button queries stay compact while retaining the extra detail/search evidence terms added in Batch 32.

Scope:
- Deduplicate generated/review query tokens by first occurrence after splitting on whitespace.
- Preserve the stable prefix order: report kind, event id, short hash, file name, and focus query appear before supplemental detail/search text.
- Keep the change frontend-only: no ledger mutation, manifest generation, signing eligibility change, or live/order boundary relaxation.

### Progress

- [x] Added regression coverage that review queries include `ashare` only once after adding detail/search text.
- [x] Added regression coverage that generated queries include `run-p2-readiness` only once after adding detail/search text.
- [x] Added a small deduplicated query text helper for P2 readiness acceptance generated/review query builders.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "includes P2 readiness acceptance (review|generated) events in the audit report ledger"
```

This dedupe only shortens Audit ledger navigation queries. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 34: P2 Readiness Acceptance Missing RunId Ledger Fallback

**Outcome:** Legacy P2 readiness acceptance generated/review ledger rows can still be rehydrated when their top-level `runId` field is missing but the current run context appears in detail/search tokens.

Scope:
- Treat missing row `runId` as an empty token source rather than throwing during current-context matching.
- Continue to require exact token matches for the requested run, market, symbol, and timeframe.
- Keep the change frontend-only: no ledger mutation, manifest generation, signing eligibility change, or live/order boundary relaxation.

### Progress

- [x] Added regression coverage where a newer generated ledger row lacks top-level `runId` but includes `run-p2-readiness,ashare,600000,1d` in detail.
- [x] Updated `findLatestP2ReadinessAcceptanceAuditLedgerRow` to normalize row `runId` safely before comparing.
- [x] Preserved exact token matching for all context fields.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "finds the latest P2 readiness acceptance audit ledger row for the current context"
```

This fallback only prevents legacy ledger rows from crashing Audit/Execution rehydration. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 35: P2 Readiness Acceptance Ledger Ready Status Normalization

**Outcome:** Legacy P2 readiness acceptance generated/review ledger rows with uppercase or padded ready status can still be rehydrated when their context matches exactly.

Scope:
- Normalize row status with trim/lowercase before checking for `ready`.
- Keep non-ready states excluded from current-context rehydration.
- Keep the change frontend-only: no ledger mutation, manifest generation, signing eligibility change, or live/order boundary relaxation.

### Progress

- [x] Added regression coverage where a newer review ledger row has `status: "READY"`, lacks top-level `runId`, and still matches via detail tokens.
- [x] Updated `findLatestP2ReadinessAcceptanceAuditLedgerRow` to normalize row status safely.
- [x] Preserved exact token matching for run, market, symbol, and timeframe.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "finds the latest P2 readiness acceptance audit ledger row for the current context"
```

This normalization only helps legacy ready rows rehydrate correctly. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 36: P2 Readiness Acceptance Legacy Token Source Coercion

**Outcome:** Legacy P2 readiness acceptance ledger rows no longer crash rehydration when a searchable text field is stored as a non-string primitive.

Scope:
- Coerce non-null token sources with `String(value)` before applying the existing token splitter.
- Continue skipping only null/undefined token sources.
- Keep exact token matching for run, market, symbol, and timeframe.
- Keep the change frontend-only: no ledger mutation, manifest generation, signing eligibility change, or live/order boundary relaxation.

### Progress

- [x] Added regression coverage where a generated legacy row has numeric `detail` and still matches via focus-query context tokens.
- [x] Updated `auditReportSearchTokenSet` to accept unknown token sources safely.
- [x] Preserved the existing delimiter-based exact tokenization.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "finds the latest P2 readiness acceptance audit ledger row for the current context"
```

This coercion only prevents malformed legacy search fields from crashing Audit/Execution rehydration. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 37: P2 Readiness Acceptance Response And Ledger Primitive-Safe Context Matching

**Outcome:** P2 readiness acceptance response-event and ledger-row context matching now share the same primitive-safe text coercion path before exact token checks.

Scope:
- Add response-event regression coverage for numeric `eventId`, boolean `runId`, numeric metadata `symbol`, and detail-only current-context tokens.
- Use the shared token source coercion helper for response event id/runId and event token extraction.
- Preserve exact context matching for run, market, symbol, and timeframe, so malformed or stale response events cannot override the current ledger fallback.
- Keep the change frontend-only: no ledger mutation, manifest generation, signing eligibility change, or live/order boundary relaxation.

### Progress

- [x] Added RED coverage where a malformed legacy response event previously crashed on `eventId.trim`.
- [x] Added primitive-safe response event id/run id normalization.
- [x] Reused the same token source coercion path for response metadata/detail/search values and ledger row token values.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "resolves P2 readiness acceptance audit event id source from response before ledger fallback"
```

This phase only hardens frontend evidence id resolution across malformed legacy response and ledger shapes. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 38: P2 Manifest Chain Preflight Audit Source Rehydration

**Outcome:** The P2 manifest chain preflight panel can explain whether its audit event id came from the latest generation response or from a matching Audit ledger row after refresh/navigation.

Scope:
- Add current-context ledger matching for `p2_manifest_chain_preflight` rows using source path, preflight status, valid/total stage count, next action, and blocker ids.
- Add response-event source resolution with primitive-safe event id/detail/summary/metadata tokenization, so malformed legacy responses do not crash or override the current preflight readback.
- Append row detail/search text to the preflight Audit query builder with token dedupe, giving blocker/live-blocked evidence terms the same navigation parity as readiness acceptance rows.
- Keep this as frontend audit source rehydration only: no manifest generation changes, no audit mutation, no signing change, and no live/order boundary relaxation.

### Progress

- [x] Added model coverage for current preflight response-vs-ledger source resolution, stale response fallback, primitive-safe response fields, and detail/search query terms.
- [x] Added App/static coverage that the Execution preflight panel wires the resolver and displays the audit id source label.
- [x] Added `findLatestP2ManifestChainPreflightAuditLedgerRow` and `resolveP2ManifestChainPreflightAuditEventReference`, then connected the Execution panel and Audit button to the resolved reference.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 manifest chain preflight"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "lets operators generate the P2 manifest chain preflight"
```

This source rehydration only helps locate and explain existing preflight audit evidence. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 39: P2 Manifest Chain Preflight Review Evidence

**Outcome:** Audit workspace operators can create a portable review artifact for the current P2 manifest-chain preflight readback and record its hash as searchable audit evidence.

Scope:
- Add a Markdown builder for `P2 Manifest Chain Preflight Review` that summarizes status, source path, stage coverage, blockers, next action/command, and the live-blocked execution boundary.
- Add a frontend audit-event builder for `p2_manifest_chain_preflight_review` that records only metadata and SHA-256, not the Markdown body.
- Add Audit ledger recognition, query construction, latest-row rehydration, and signing exclusion for the review event type.
- Add an Audit workspace review panel with copy, download, record, refresh, and Audit query actions.
- Keep the change frontend-only: no manifest generation changes, no backend preflight mutation, no signing eligibility, no order submission, and no live-trading relaxation.

### Progress

- [x] Added review Markdown and audit-event builders with hash-only metadata.
- [x] Added ledger row recognition for `p2_manifest_chain_preflight_review`, including blocker/stage search text and a stable query helper.
- [x] Extended P2 manifest-chain preflight ledger rehydration to support generated and review report kinds.
- [x] Added the Audit workspace review panel and responsive grid/CSS coverage.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 manifest chain preflight review|P2 manifest chain preflight events"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "P2 manifest chain preflight review audit event"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 manifest chain preflight review"
npm run build
```

This review evidence only helps humans archive and locate the current P2 preflight readback. It does not create missing manifests, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 40: P2 Preflight Review Evidence Coverage

**Outcome:** The Execution P2 evidence coverage matrix now shows whether the current manifest-chain preflight readback has been manually reviewed and recorded in the Audit ledger.

Scope:
- Add `p2-manifest-chain-preflight-review` as an optional P2 readiness evidence coverage row.
- Feed the current `P2ManifestChainPreflightSummary` and matching `p2_manifest_chain_preflight_review` ledger row into `buildP2ReadinessEvidenceCoverage`.
- Mark the row covered when the matching review hash is ready, missing when the current preflight has not been reviewed, and blocked when the preflight boundary is invalid or unsafe.
- Add UI labels for the new evidence row in English and Chinese.
- Keep the change read-only: no automatic review recording, no manifest mutation, no signing eligibility change, no order submission, and no live-trading relaxation.

### Progress

- [x] Added RED coverage for covered and missing P2 preflight review evidence states.
- [x] Added the `p2-manifest-chain-preflight-review` coverage row builder and optional coverage input fields.
- [x] Wired App state so the P2 evidence coverage matrix receives the current preflight summary and latest matching review ledger row.
- [x] Added static UI coverage for the new input wiring and labels.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 manifest chain preflight review coverage|P2 readiness evidence coverage"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness evidence coverage"
npm run build
```

This coverage row only makes review traceability visible in Execution. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 41: P2 Evidence Coverage Audit Focus Actions

**Outcome:** Audit-backed rows in the Execution P2 evidence coverage matrix now open the exact Audit workspace evidence query for that readiness claim.

Scope:
- Add a shared `openP2ReadinessEvidenceCoverage` row action dispatcher in `App.tsx`.
- Route `operator-runbook-audit` rows to the existing Operator runbook audit focus action.
- Route `p2-manifest-chain-preflight-review` rows to the existing P2 preflight review audit focus action.
- Render a compact row-level `Audit` action only for audit-sourced evidence rows.
- Keep the change frontend-only and read-only: no review recording, no manifest mutation, no signing eligibility change, no order submission, and no live-trading relaxation.

### Progress

- [x] Added RED static coverage for the row action dispatcher, audit row condition, button labels, and CSS class.
- [x] Wired the P2 evidence coverage panel to receive and call the row-level audit focus action.
- [x] Added responsive styling for the audit action column without changing the coverage model.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness evidence coverage"
```

These actions only restore read-only Audit context for existing evidence. They do not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 42: P2 Evidence Coverage Row Navigation

**Outcome:** Every row in the Execution P2 evidence coverage matrix now has an explicit evidence-navigation action, not only audit-backed rows.

Scope:
- Extend `openP2ReadinessEvidenceCoverage` to handle all seven P2 evidence coverage row ids.
- Route manifest, checklist, and safety-boundary rows back to Execution with a clear status message.
- Route adapter-chain rows to Settings, where the detailed adapter evidence ledgers live.
- Keep audit-backed rows on their stable Audit queries from Batch 41.
- Render one compact row action for every coverage row, using source-specific labels: Audit, Manifest, Workspace, and Boundary.
- Keep the change frontend-only and read-only: no manifest generation, no audit mutation, no signing eligibility change, no order submission, and no live-trading relaxation.

### Progress

- [x] Added RED static coverage for all seven row ids, source-specific labels, and unified action rendering.
- [x] Added row navigation cases with explicit workspace/status outcomes.
- [x] Reworked the coverage row action rendering to use shared label and icon helpers.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness evidence coverage"
npm run build
```

These actions only restore read-only product workspace context for existing evidence. They do not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 43: P2 Evidence Coverage Review Pack

**Outcome:** Audit users can turn the current P2 evidence coverage matrix into a portable review artifact and record it in the audit ledger without changing any execution boundary.

Scope:
- Add a Markdown review builder for `P2ReadinessEvidenceCoverage`.
- Add `p2_readiness_evidence_coverage_review` audit event metadata with content hash, coverage counts, row ids/statuses, source types/source ids, and live-blocked boundary.
- Teach Audit report ledger to recognize, search, query, and exclude the review from signing.
- Add an Audit workspace panel to copy, download, record, and open the review row.
- Keep it frontend/audit only; no manifest generation, no backend route changes, no order submission, no live trading.

### Progress

- [x] Added `buildP2ReadinessEvidenceCoverageReviewMarkdown`.
- [x] Added `buildP2ReadinessEvidenceCoverageReviewAuditEvent` without storing markdown body.
- [x] Added `p2_readiness_evidence_coverage_review` ledger recognition, query builder, progress counts, search text, deep-link status, status label, and signing exclusion.
- [x] Added `P2ReadinessEvidenceCoverageReviewPanel` in Audit with copy/download/record/audit actions and row-level coverage readout.
- [x] Added focused RED/GREEN tests for markdown, audit event metadata, ledger recognition/query, and UI/CSS wiring.
- [x] Kept `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness evidence coverage review"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "P2 readiness evidence coverage review audit event"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness evidence coverage review"
```

This review pack only makes the current evidence coverage matrix portable and auditable. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 44: P2 Evidence Coverage Review Ledger Rehydration

**Outcome:** The P2 evidence coverage review panel now rehydrates the matching audit event for the current coverage matrix after refresh or cross-workspace navigation.

Scope:
- Add a current-coverage ledger matcher for `p2_readiness_evidence_coverage_review`.
- Match by coverage status, covered/total count, row ids/statuses, source types, and source ids.
- Add a response/ledger/none event-reference resolver so stale response events cannot override the current coverage context.
- Wire the Audit panel event id/source display and Audit button through the resolver.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added `findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow`.
- [x] Added `resolveP2ReadinessEvidenceCoverageReviewAuditEventReference`.
- [x] Updated the Audit workspace wiring to prefer matching response events, then matching ledger rows, then `none`.
- [x] Added RED/GREEN coverage for stale newer ledger rows and stale response events.
- [x] Added static UI coverage that requires App wiring through the new matcher/resolver.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness evidence coverage review"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness evidence coverage review"
```

This rehydration only improves event id/source accuracy for existing review evidence. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 45: P2 Acceptance Coverage Review Linkage

**Outcome:** P2 readiness acceptance review evidence now points back to the current P2 evidence coverage review audit event.

Scope:
- Allow `buildP2ReadinessAcceptanceSummary` to receive the current coverage review audit event id.
- Use that id as the `readiness-evidence-coverage` criterion source when it matches the current coverage matrix.
- Include the id in P2 readiness acceptance review Markdown and review audit event metadata.
- Show the linked coverage review id in the Audit workspace P2 readiness acceptance review panel.
- Keep the change frontend/audit only; no backend manifest mutation, no automatic review generation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN coverage for summary rows, Markdown, audit event metadata, and static UI wiring.
- [x] Added `evidenceCoverageReviewAuditEventId` to P2 readiness acceptance summaries.
- [x] Updated the readiness evidence coverage criterion to source from the current coverage review audit event when present.
- [x] Added `currentEvidenceCoverageReviewAuditEventId` to P2 readiness acceptance review audit event metadata.
- [x] Added an Audit panel meta readout for the linked coverage review event id.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance"
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts -t "P2 readiness acceptance review audit event"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness acceptance manifest review"
```

This linkage only improves traceability between existing P2 review artifacts. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 46: P2 Acceptance Review Coverage-Aware Rehydration

**Outcome:** P2 readiness acceptance review ledger rehydration now requires the linked P2 evidence coverage review id to match the current context.

Scope:
- Add `currentEvidenceCoverageReviewAuditEventId` to `p2_readiness_acceptance_review` search/query tokens.
- Extend P2 readiness acceptance review ledger matching with `evidenceCoverageReviewAuditEventId`.
- Reject stale response events when their linked coverage review id differs from the current coverage context.
- Wire the Audit workspace review matcher through a review-specific context while leaving generated manifest matching unchanged.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN coverage for acceptance review search/query tokens, latest ledger matching, stale response fallback, and static App wiring.
- [x] Updated `findLatestP2ReadinessAcceptanceAuditLedgerRow` to require matching coverage review ids for review rows when present.
- [x] Updated `resolveP2ReadinessAcceptanceAuditEventReference` to reject stale response events with mismatched coverage review ids.
- [x] Added `p2ReadinessAcceptanceReviewAuditContext` in `App.tsx` so review rehydration receives the current coverage review id without affecting generated manifest rehydration.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness acceptance manifest review"
```

This rehydration only improves event id/source accuracy for existing acceptance review evidence. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 47: P2 Acceptance Linked Coverage Review Focus

**Outcome:** The P2 readiness acceptance review panel can open the linked P2 evidence coverage review audit evidence directly.

Scope:
- Rehydrate `currentEvidenceCoverageReviewAuditEventId` as a structured `AuditEvidenceReportLedgerRow` field for `p2_readiness_acceptance_review`.
- Add a query helper that maps an acceptance review row to its linked `p2_readiness_evidence_coverage_review` query.
- Add a read-only Audit action in the P2 readiness acceptance review panel for the linked coverage review.
- Prefer the full coverage review ledger query when the linked coverage row is available, with an event-id fallback when it is not.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage for the linked coverage review id and query helper.
- [x] Added static UI coverage for the helper import, open handler, panel prop, and button labels.
- [x] Added `buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery`.
- [x] Added `openP2ReadinessAcceptanceCoverageReviewAudit` in `App.tsx` and wired it into `P2ReadinessAcceptanceReviewPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance review events"
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness acceptance manifest review"
```

This focus action only restores read-only Audit context for the linked coverage review evidence. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 48: P2 Coverage Review Linked Acceptance Review Focus

**Outcome:** The P2 evidence coverage review panel can open the top-level P2 readiness acceptance review that references the current coverage review audit evidence.

Scope:
- Add a query helper that maps a `p2_readiness_acceptance_review` row back to its linked coverage review id and searchable acceptance review context.
- Add a read-only Audit action in the P2 evidence coverage review panel for the linked top-level acceptance review.
- Match only acceptance review rows whose `currentEvidenceCoverageReviewAuditEventId` points to the current coverage review, with an event-id fallback when the full row is not loaded.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage for the reverse acceptance review query helper.
- [x] Added static UI coverage for the helper import, open handler, panel prop, and button labels.
- [x] Added `buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery`.
- [x] Added `openP2ReadinessEvidenceCoverageLinkedAcceptanceReviewAudit` in `App.tsx` and wired it into `P2ReadinessEvidenceCoverageReviewPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance review events"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "P2 readiness evidence coverage review"
```

This focus action only restores read-only Audit context for the linked top-level acceptance review evidence. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 49: P2 Acceptance Linked Coverage Review Ledger Visibility

**Outcome:** Audit report ledger rows for P2 readiness acceptance reviews expose the linked P2 evidence coverage review as a visible, searchable, copyable row-level link.

Scope:
- Add row-level label/query fields derived from `currentEvidenceCoverageReviewAuditEventId`.
- Include the linked coverage review label and query in ledger filtering.
- Render a compact coverage review tag and focus/copy actions on matching `p2_readiness_acceptance_review` rows.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage for linked coverage review label/query fields and search tokens.
- [x] Added static UI coverage for the ledger row tag and focus/copy actions.
- [x] Added `p2ReadinessAcceptanceCoverageReviewLinkLabel` and `p2ReadinessAcceptanceCoverageReviewLinkQuery` to `AuditEvidenceReportLedgerRow`.
- [x] Rendered the coverage review tag and row-level focus/copy actions in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "P2 readiness acceptance review events"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This visibility pass only exposes an existing linked coverage review id as a read-only Audit query. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 50: P2 Coverage Review Linked Acceptance Review Ledger Visibility

**Outcome:** Audit report ledger rows for P2 evidence coverage reviews expose the top-level P2 readiness acceptance review that references them.

Scope:
- Enrich coverage review rows after ledger row construction by scanning acceptance review rows that point to the coverage review id.
- Add row-level label/query fields for the linked top-level acceptance review.
- Include the reverse link label and query in ledger filtering.
- Render a compact acceptance review tag and focus/copy actions on matching `p2_readiness_evidence_coverage_review` rows.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage for coverage review rows linking back to acceptance review rows.
- [x] Added static UI coverage for the ledger row tag and focus/copy actions.
- [x] Added `p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel` and `p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery` to `AuditEvidenceReportLedgerRow`.
- [x] Added post-construction ledger row enrichment for coverage review rows.
- [x] Rendered the acceptance review tag and row-level focus/copy actions in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This visibility pass only exposes an existing linked acceptance review as a read-only Audit query. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 51: P2 Review Chain Ledger Summary Controls

**Outcome:** The Audit ledger toolbar can surface the latest linked P2 readiness acceptance review and evidence coverage review pair without requiring row-level scanning.

Scope:
- Add latest linked P2 readiness acceptance/coverage review fields to `AuditEvidenceReportLedgerSummary`.
- Compute the latest ready `p2_readiness_acceptance_review` row that references a coverage review event.
- Render a compact "P2 review chain" summary item with focus/copy actions for both acceptance and coverage review queries.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage for latest linked P2 review chain summary fields.
- [x] Added static UI coverage for toolbar summary fields and focus/copy actions.
- [x] Added `latestP2ReadinessLinkedAcceptanceReview*` and `latestP2ReadinessLinkedCoverageReview*` fields to `AuditEvidenceReportLedgerSummary`.
- [x] Rendered the latest P2 review chain controls in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This summary pass only exposes an existing linked P2 review pair as read-only Audit queries. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 52: P2 Review Chain Combined Ledger Query

**Outcome:** The Audit ledger toolbar can filter the latest P2 readiness acceptance review and its linked evidence coverage review together with one short query.

Scope:
- Add `buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery` for acceptance review rows that link to a coverage review event.
- Add `latestP2ReadinessReviewChainLabel` and `latestP2ReadinessReviewChainQuery` to `AuditEvidenceReportLedgerSummary`.
- Render "Focus review chain" and "Copy review chain link" controls in the Audit ledger toolbar.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage proving the chain query filters both linked P2 review rows.
- [x] Added static UI coverage for summary chain fields and focus/copy controls.
- [x] Added the chain query helper and summary fields.
- [x] Rendered combined chain focus/copy actions in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This combined query only filters existing linked P2 review rows. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 53: P2 Review Chain All-Links Ledger Query

**Outcome:** The Audit ledger toolbar can count and filter every linked P2 readiness review chain currently loaded in the ledger page, not only the latest pair.

Scope:
- Add all-chain summary fields to `AuditEvidenceReportLedgerSummary`.
- Mark linked acceptance review rows and linked coverage review rows with a shared `linked review chain` search token.
- Render an "All review chains" count with focus/copy actions in the Audit ledger toolbar.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage for two linked P2 review chains and the all-chain query.
- [x] Added static UI coverage for all-chain count, focus action, and copy action.
- [x] Added `p2ReadinessReviewChainCount` and `p2ReadinessReviewChainsQuery` to `AuditEvidenceReportLedgerSummary`.
- [x] Rendered all-chain controls in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This all-chain query only filters existing linked P2 review rows on the loaded page. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 54: P2 Review Chain Row-Level Controls

**Outcome:** Every linked P2 readiness review row can focus or copy its own acceptance-review plus coverage-review chain without relying on the toolbar summary.

Scope:
- Add row-level `p2ReadinessReviewChainLabel` and `p2ReadinessReviewChainQuery` fields.
- Populate acceptance review rows directly from `currentEvidenceCoverageReviewAuditEventId`.
- Propagate the same chain label/query to linked coverage review rows during reverse-link enrichment.
- Render row-level "Review chain" tags with focus/copy controls.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage for row-level chain label/query fields on both acceptance and coverage review rows.
- [x] Added static UI coverage for the row-level tag and focus/copy actions.
- [x] Added `p2ReadinessReviewChainLabel` and `p2ReadinessReviewChainQuery` to `AuditEvidenceReportLedgerRow`.
- [x] Rendered row-level review-chain controls in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This row-level chain action only filters existing linked P2 review rows. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 55: P2 Review Chain Missing Coverage Diagnostics

**Outcome:** The Audit ledger can tell operators whether linked P2 readiness review chains are fully loaded in the current ledger page, and can focus/copy chains whose referenced coverage review row is missing from the loaded rows.

Scope:
- Add row-level `p2ReadinessReviewChainCoverageLoaded`, `p2ReadinessReviewChainStatusLabel`, and `p2ReadinessReviewChainStatusQuery` fields.
- Mark linked acceptance review rows as loaded when their referenced `p2_readiness_evidence_coverage_review` row is present in the current rows, or missing when it is not.
- Propagate loaded status to reverse-linked coverage review rows.
- Add summary counts for loaded chains and missing-coverage chains, plus a `review-chain-coverage-missing` query.
- Render compact toolbar and row-level diagnostics without creating reviews, mutating manifests, changing signing eligibility, submitting orders, or relaxing the live-blocked boundary.

### Progress

- [x] Added RED/GREEN model coverage for a linked acceptance review that references a missing coverage review row.
- [x] Added summary coverage for loaded chain count, missing coverage count, and the missing-coverage query.
- [x] Added static UI coverage for toolbar chain gaps and row-level loaded/missing status pills.
- [x] Rendered "Chain gaps" focus/copy controls and row-level review-chain loaded/missing status in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This diagnostic only flags whether the already-referenced coverage review row is loaded in the current Audit ledger rows. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 56: P2 Review Chain Missing Acceptance Diagnostics

**Outcome:** The Audit ledger can also identify coverage review rows that are loaded but not referenced by any top-level P2 readiness acceptance review in the current ledger page.

Scope:
- Add row-level `p2ReadinessReviewChainAcceptanceLoaded` alongside the existing coverage-loaded diagnostic.
- Mark linked acceptance rows as having the acceptance side loaded, and mark linked coverage rows as fully loaded.
- Mark orphan `p2_readiness_evidence_coverage_review` rows with `review-chain-acceptance-missing`.
- Add summary counts and focus/copy query for missing-acceptance coverage rows.
- Tighten the all-linked-chain query to the single token `linked-review-chain` so gap diagnostics and incidental run id substrings do not pollute the all-chain filter.

### Progress

- [x] Added RED/GREEN model coverage for a coverage review row with no current-page acceptance review reference.
- [x] Added `p2ReadinessReviewChainAcceptanceLoaded` to ledger rows.
- [x] Added `p2ReadinessReviewChainMissingAcceptanceCount` and `p2ReadinessReviewChainMissingAcceptanceQuery` to the ledger summary.
- [x] Added static UI coverage for missing-acceptance toolbar controls and row-level status text.
- [x] Rendered "Missing acceptance" focus/copy controls and row-level missing acceptance status in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This diagnostic only flags orphan coverage review rows already loaded in the Audit ledger. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## Batch 57: P2 Review Chain All-Gaps Query

**Outcome:** The Audit ledger can focus or copy one query that shows every currently loaded P2 review-chain gap, while preserving the more specific missing-coverage and missing-acceptance queries.

Scope:
- Add `review-chain-gap` to both missing coverage and missing acceptance row status queries.
- Add `p2ReadinessReviewChainGapCount` and `p2ReadinessReviewChainGapsQuery` to `AuditEvidenceReportLedgerSummary`.
- Render an "All chain gaps" count with focus/copy controls in the Audit ledger toolbar.
- Keep `review-chain-coverage-missing` and `review-chain-acceptance-missing` as the specific drilldown queries.
- Keep the change frontend/audit only; no review generation, no ledger mutation, no signing eligibility, no order submission, and no live trading.

### Progress

- [x] Added RED/GREEN model coverage proving `review-chain-gap` filters both missing-coverage and missing-acceptance rows.
- [x] Added summary coverage for total review-chain gap count and query.
- [x] Added static UI coverage for all-gap toolbar fields, focus action, copy action, and labels.
- [x] Rendered "All chain gaps" controls in `AuditEvidenceReportLedgerPanel`.

### Verification

```powershell
npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts -t "links P2 readiness evidence coverage review ledger rows"
npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js -t "renders audit evidence report history"
```

This all-gaps query only filters existing P2 review-chain diagnostics. It does not create evidence, submit orders, sign reports, or relax the paper-only/live-blocked boundary.

---

## P2 Acceptance Definition

P2 is accepted only when a local user can:

1. Run a P1-accepted research workflow.
2. Produce a paper-only execution and replay it.
3. See one clear pre-live checklist with passed gates, blockers, next action, and audit evidence.
4. Export or read back a P2 pre-live acceptance manifest.
5. Trace every readiness claim back to an audit event or local manifest.
6. Confirm the platform still does not submit real orders, connect to a live broker route, or set `liveTradingAllowed=true`.
