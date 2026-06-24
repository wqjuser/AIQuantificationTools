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

## P2 Acceptance Definition

P2 is accepted only when a local user can:

1. Run a P1-accepted research workflow.
2. Produce a paper-only execution and replay it.
3. See one clear pre-live checklist with passed gates, blockers, next action, and audit evidence.
4. Export or read back a P2 pre-live acceptance manifest.
5. Trace every readiness claim back to an audit event or local manifest.
6. Confirm the platform still does not submit real orders, connect to a live broker route, or set `liveTradingAllowed=true`.
