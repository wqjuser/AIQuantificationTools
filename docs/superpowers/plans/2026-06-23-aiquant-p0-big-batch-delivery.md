# AIQuant P0 Big Batch Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current broad prototype into a usable local-first P0 quant workflow where a personal user can select an A-share symbol, prepare real/cached data, configure a structured strategy, run an audited backtest, get evidence-bound AI review, submit a paper-only simulation, replay the result, and export/import the complete evidence package.

**Architecture:** Development must move in large vertical batches instead of isolated micro-fixes. Each batch must connect backend contract, frontend workflow, audit evidence, i18n, documentation, and automated tests for one user-visible slice. Live trading remains blocked throughout P0; execution work is paper-only unless a later P2 plan explicitly unlocks a certified live adapter.

**Tech Stack:** Python local core under `services/quant_core/quant_core`, React/TypeScript/Vite frontend under `apps/web/src`, SQLite-backed local stores, Vitest frontend tests, Python unittest backend tests, Docker Compose deployment, Markdown product documentation.

---

## Operating Rules For The Next Phase

1. No more single-field safety-gate-only work unless it is needed to complete one of the batches below.
2. A batch is not complete until it has a user-visible workflow, backend contract, tests, and documentation.
3. Every batch updates `docs/product-plan.md` with a short status note and links back to this plan.
4. Every batch must keep `paperOnly=true`, `liveTradingAllowed=false`, `orderSubmitted=false`, `liveOrderSubmitted=false`, and `routeExecuted=false` for P0 execution paths.
5. Every batch ends with:
   - `python -m unittest discover -s services/quant_core/tests -t services/quant_core`
   - `npm test`
   - `npm run build`
   - `git diff --check`
6. Batch commits should be large enough to deliver a vertical slice, but small enough to review. Prefer one commit per task group below.

---

## Current Product Diagnosis

The project has many strong primitives: market adapters, cache diagnostics, structured strategy validation, audited backtests, AI review records, paper order ledgers, audit reports, export/import, Docker, and a heavy execution safety chain. The weakness is product shape: too many panels expose internal evidence fragments, while the P0 user path is not obvious enough.

The next phase should therefore prioritize the P0 golden path over adding more side panels:

```text
A-share symbol -> data readiness -> strategy draft -> audited backtest -> AI review -> paper simulation -> replay -> export package
```

---

## Batch 1: P0 Golden Path Workbench

**Outcome:** One clear guided workbench that tells the user where they are, what is missing, and the next executable action.

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/i18n.ts`
- Modify: `apps/web/src/lib/i18n.test.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `docs/product-plan.md`

### Task 1.1: Replace fragmented P0 cards with a single journey model

- [x] **Step 1: Write failing model tests**

Add tests in `apps/web/src/lib/terminal-workbench.test.ts` for a new `buildP0GoldenPathJourney` helper.

Expected behavior:
- returns ordered steps `data`, `strategy`, `backtest`, `ai-review`, `paper-simulation`, `replay`, `export`
- marks exactly one `current` step
- provides `nextActionId` only when the next action can run
- never marks live trading as available

Run:

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts
```

Expected before implementation:

```text
FAIL buildP0GoldenPathJourney is not defined
```

- [x] **Step 2: Implement the model**

Add `buildP0GoldenPathJourney` in `apps/web/src/lib/terminal-workbench.ts`. It should consume existing golden path, P0 completion, paper preflight, AI review, and export evidence models instead of adding a second readiness system.

Required output shape:

```ts
export interface P0GoldenPathJourneyStep {
  id: "data" | "strategy" | "backtest" | "ai-review" | "paper-simulation" | "replay" | "export";
  label: string;
  state: "done" | "current" | "blocked" | "ready";
  workspaceId: ProductWorkAreaId;
  evidenceId: string;
  nextActionId: string;
  detail: string;
}
```

- [x] **Step 3: Replace duplicated overview cards**

In `apps/web/src/App.tsx`, render one `P0GoldenPathJourneyPanel` near the top of the main workspace shell. Existing detailed audit panels can remain, but the homepage should lead with the journey, not a wall of unrelated cards.

- [x] **Step 4: Add Chinese/English labels**

Add stable labels and details in `apps/web/src/lib/i18n.ts`. Cover both `zh-CN` and `en-US` tests in `apps/web/src/lib/i18n.test.ts`.

- [x] **Step 5: Verify**

Run:

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts i18n.test.ts layout-css.test.js
npm run build
```

Expected:

```text
Tests pass, build exits 0, no large chunk warning
```

---

## Batch 2: A-Share Data Readiness And Cache Repair

**Outcome:** The user can trust whether `600000` or another A-share symbol is ready for research, and can repair stale/missing cache from the UI.

**Files:**
- Modify: `services/quant_core/quant_core/market_klines.py`
- Modify: `services/quant_core/quant_core/cache_refresh_runs.py`
- Modify: `services/quant_core/quant_core/adapter_error_ledger.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`

### Task 2.1: Add a single data readiness contract

- [x] **Step 1: Write failing backend tests**

Add tests for `GET /api/market/data-readiness?market=ashare&symbol=600000&timeframe=1d`.

Required response fields:

```json
{
  "market": "ashare",
  "symbol": "600000",
  "timeframe": "1d",
  "state": "ready",
  "source": "akshare",
  "cacheState": "fresh",
  "barCount": 500,
  "latestBarAt": "2026-05-26T00:00:00+08:00",
  "providerHealthState": "healthy",
  "blockingReasons": [],
  "repairActions": []
}
```

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k market_data_readiness
```

Expected before implementation:

```text
FAIL endpoint not found
```

- [x] **Step 2: Implement backend projection**

Create a projection function inside `market_klines.py` or a focused helper module if existing file size becomes hard to reason about. It must combine cache rows, provider health, and data quality into one response.

- [x] **Step 3: Add frontend API parser**

Add `loadMarketDataReadiness` in `apps/web/src/lib/terminal-api.ts` with strict validation in `terminal-api.test.ts`.

- [x] **Step 4: Show readiness in Market and Research**

In `App.tsx`, show one compact readiness strip with:
- ready/stale/blocked state
- source
- latest bar time
- repair action
- audit evidence link when available

- [x] **Step 5: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k market_data_readiness
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts
npm test
```

---

## Batch 3: Strategy-To-Backtest Pipeline

**Outcome:** The user can go from structured strategy draft to audited backtest without understanding internal stores or panels.

**Files:**
- Modify: `services/quant_core/quant_core/strategy_validation.py`
- Modify: `services/quant_core/quant_core/backtest.py`
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`

### Task 3.1: Create one audited pipeline endpoint

- [x] **Step 1: Write failing backend test**

Add `test_p0_pipeline_creates_strategy_backtest_and_run_evidence` in `services/quant_core/tests/test_quant_core.py`.

The endpoint should accept:

```json
{
  "market": "ashare",
  "symbol": "600000",
  "timeframe": "1d",
  "strategyConfig": {
    "name": "SMA trend",
    "entry": {"type": "sma_cross", "window": 20},
    "exit": {"type": "sma_break", "window": 20},
    "position": {"maxPositionPct": 20},
    "risk": {"stopLossPct": 8, "maxDrawdownPct": 12}
  },
  "assumptions": {"initialCash": 100000, "feeBps": 3, "slippageBps": 2}
}
```

Required response:

```json
{
  "status": "audited_run_created",
  "runId": "run-...",
  "strategyRevisionId": "strategy-...",
  "dataSnapshotId": "data-...",
  "metrics": {"totalReturnPct": 0.0, "maxDrawdownPct": 0.0, "tradeCount": 0},
  "paperOnly": true,
  "liveTradingAllowed": false
}
```

- [x] **Step 2: Implement minimal orchestration**

Use existing strategy validation, backtest, and run storage instead of creating a parallel pipeline. If a piece is missing, add a small adapter function close to the existing module.

- [x] **Step 3: Wire the Run Pipeline button**

`App.tsx` should call the new endpoint from Strategy and Research contexts. On success, it should update current run, backtest panel, AI readiness, and P0 journey.

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p0_pipeline
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts
npm test
```

---

## Batch 4: Evidence-Bound AI Review Flow

**Outcome:** AI review becomes a structured review action on an audited run, not a decorative panel.

**Files:**
- Modify: `services/quant_core/quant_core/ai.py`
- Modify: `services/quant_core/quant_core/ai_review_runs.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/i18n.ts`
- Modify: `docs/product-plan.md`

### Task 4.1: Promote AI review to a P0 gate

- [x] **Step 1: Write failing backend tests**

Tests must prove:
- no audited run means AI review is blocked
- mismatched symbol/timeframe is blocked
- saved review stores citations, risk warnings, agent rounds, and boundary text
- output never contains direct buy/sell instruction language

- [x] **Step 2: Implement structured review runner**

Use a deterministic local fallback first. If external AI configuration is absent, return a structured evidence review with clear `mode="local_evidence_review"`. External provider integration can be P1.

- [x] **Step 3: Update UI**

The AI Review workspace should show:
- current audited run
- evidence citations
- agent debate summary
- risks and unknowns
- button to save review evidence
- next action into paper simulation when all gates are ready

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k ai_review
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts i18n.test.ts
npm test
```

---

## Batch 5: P0 Paper Trading As One User Flow

**Outcome:** A user can submit a paper-only simulation from an audited run and then immediately see order, fill, account replay, and audit evidence.

**Files:**
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`

### Task 5.1: Build a P0 paper simulation command

- [x] **Step 1: Write failing backend test**

Add a test for `POST /api/p0/paper-simulations`.

Required behavior:
- accepts audited `runId`
- checks data quality, AI review evidence, strategy risk, and paper preflight
- records a paper-only order and simulated fill
- replays account state
- writes audit events
- rejects all live routing flags

- [x] **Step 2: Implement by composing existing stores**

Do not create a second paper trading model. Compose the existing paper order, approval, simulation, replay, and state history functions.

- [x] **Step 3: Update UI**

Expose one primary button: `提交模拟委托`. After success, the page should show:
- order id
- fill price and quantity
- cash after
- position after
- audit event id
- export readiness

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p0_paper
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts
npm test
```

---

## Batch 6: Export, Import, And Replay As The P0 Finish Line

**Outcome:** The P0 loop ends with a portable package that can be imported and replayed on another machine.

**Files:**
- Modify: `services/quant_core/quant_core/research.py`
- Modify: `services/quant_core/quant_core/research_import_undo.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`

### Task 6.1: Define P0 package completeness

- [x] **Step 1: Write failing tests**

A P0 package is complete only if it contains:
- market context
- data snapshot summary
- strategy revision
- audited backtest run
- AI review record
- paper simulation record
- replay summary
- audit report references
- live-blocked boundary

- [x] **Step 2: Implement package completeness checker**

Add `build_p0_package_completeness` in the backend and matching frontend projection in `terminal-workbench.ts`.

- [x] **Step 3: UI finish state**

The P0 journey should show `P0 closed loop complete` only when completeness passes and import verification succeeds.

Implementation note: Batch 6 now exports run-bound `auditEvents`, including `p0_paper_simulation`, adds `p0PackageCompleteness` with the required P0 evidence criteria, validates `auditEvents` artifact counts, persists imported audit events with rollback/undo support, and projects package completeness plus audit-event rows into the web export browser/import diff. The P0 completion gate now only treats export/import as ready when the current run has a complete portable package and still carries the live-blocked boundary.

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p0_package
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts
npm test
```

---

## Batch 7: Product Polish And Release Hardening

**Outcome:** The platform feels like a coherent local product instead of a development dashboard.

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/lib/i18n.ts`
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docker-compose.yml`
- Modify: `Dockerfile`
- Modify: `.github/workflows/*`

### Task 7.1: Reduce panel noise

- [x] **Step 1: Create layout guard tests**

Assert:
- homepage has one primary P0 journey
- detailed audit panels are collapsed or secondary
- no workspace has nested independent scroll regions unless intentionally bounded
- left navigation has readable width at desktop sizes

- [x] **Step 2: Refactor presentation**

Keep backend contracts intact. Move duplicate evidence details behind expandable sections. Put the next action and current blocker above historical evidence.

- [x] **Step 3: Docker and CI smoke**

Run:

```powershell
docker compose config
npm test
npm run build
```

Expected:

```text
All commands exit 0. GitHub Actions quality gate uses current Node-compatible action versions or a documented opt-in.
```

Implementation note: Batch 7 now guards the product shell with layout tests for a readable desktop left navigation, a later icon-only collapse breakpoint, exactly one primary P0 journey panel, and a secondary P0 evidence drawer. The homepage keeps the current P0 action and blocker visible while moving saved-report echo, deep-link recovery, paper preflight gate details, and backlog rows behind the drawer. Desktop navigation is widened to 232px and keeps work-area descriptions visible until the 960px collapse breakpoint.

---

## Batch 8: P0 Acceptance Smoke

**Outcome:** Docker and local deployment smoke tests verify the product's P0 API loop, not just that the web shell and health endpoints are reachable.

**Files:**
- Modify: `tools/docker_smoke.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 8.1: Add an optional P0 acceptance smoke path

- [x] **Step 1: Write failing tests**

Add tests for Docker smoke helpers that build the P0 pipeline, AI review, paper simulation, and export validation payloads. Tests must prove the sequence never opts into live routing.

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
```

Expected before implementation:

```text
FAIL helper functions are not defined
```

- [x] **Step 2: Implement smoke runner**

Add `--p0-acceptance` to `tools/docker_smoke.py`. When enabled it should:
- POST `/api/p0/pipeline`
- POST `/api/p0/ai-reviews`
- POST `/api/p0/paper-simulations`
- GET `/api/research/runs/{runId}/export`
- validate `paperOnly=true`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, `routeExecuted=false`, a `p0_paper_simulation` audit event, and complete `p0PackageCompleteness`.

- [x] **Step 3: Document deployment acceptance**

Update `README.md` and `docs/product-plan.md` so the deployment smoke instructions distinguish basic health smoke from P0 acceptance smoke.

Implementation note: Batch 8 now adds an optional `--p0-acceptance` smoke path that posts the P0 pipeline, AI review, and paper simulation endpoints before exporting the run package. The runner validates the paper-only/live-blocked boundary, the `p0_paper_simulation` audit event, complete `p0PackageCompleteness`, and documents the difference between basic deployment smoke and P0 product acceptance smoke.

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p0_package
npm test
npm run build --workspace @aiqt/web
docker compose config
git diff --check
```

---

## Batch 9: P0 Portable Import Acceptance Smoke

**Outcome:** Deployment smoke can verify that a P0 package exported from the acceptance run can be imported and re-exported with the same paper-only evidence boundary.

**Files:**
- Modify: `tools/docker_smoke.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 9.1: Add optional import verification to P0 acceptance

- [x] **Step 1: Write failing tests**

Add tests proving that Docker smoke can:
- validate `/api/research/runs/import` responses
- POST the exported P0 package to an import target
- re-fetch `/api/research/runs/{runId}/export` from the import target
- validate the imported package still has paper simulation, AI review, replay evidence, audit events, and live-blocked boundary

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
```

- [x] **Step 2: Implement import smoke runner**

Add `--p0-import-check` and optional `--p0-import-base-url` to `tools/docker_smoke.py`. When no import base URL is supplied, use the same service to exercise the import contract. For a true clean-database acceptance, the caller can point `--p0-import-base-url` at a second fresh deployment.

- [x] **Step 3: Document portable import acceptance**

Update deployment docs to show:

```powershell
npm run docker:smoke -- --no-build --p0-acceptance --p0-import-check
```

Implementation note: Batch 9 now adds `--p0-import-check` and optional `--p0-import-base-url` to the Docker smoke runner. The acceptance path can import the exported P0 package, validate undo evidence, re-export the imported run, and confirm the imported package still carries paper simulation, AI review, replay evidence, audit events, complete `p0PackageCompleteness`, and a live-blocked boundary.

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p0_package
npm test
npm run build
docker compose config
git diff --check
```

---

## Batch 10: P0 Acceptance Manifest

**Outcome:** P0 smoke runs can emit a durable JSON manifest that records the exact acceptance checks, run id, import target, paper-only boundary, and live-blocked boundary for review or CI artifacts.

**Files:**
- Modify: `tools/docker_smoke.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 10.1: Add an optional acceptance report artifact

- [x] **Step 1: Write failing tests**

Add tests proving that Docker smoke can:
- build a schema-versioned P0 acceptance manifest
- mark every smoke step as passed
- record `paperOnly=true` and `liveTradingAllowed=false`
- write the manifest to a user-supplied JSON path
- include import checks when `--p0-import-check` is enabled

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
```

- [x] **Step 2: Implement report writer**

Add `--p0-acceptance-report <path>` to `tools/docker_smoke.py`. When supplied, write a JSON document with kind `aiqt.p0AcceptanceManifest`, run context, check summaries, import target, and live-blocked boundary.

- [x] **Step 3: Document report artifact**

Update deployment docs to show:

```powershell
npm run docker:smoke -- --no-build --p0-acceptance --p0-import-check --p0-acceptance-report data/p0-acceptance.json
```

Implementation note: Batch 10 now adds `--p0-acceptance-report` to emit an `aiqt.p0AcceptanceManifest` JSON artifact with run context, import target, ordered check summaries, and explicit `paperOnly=true` / `liveTradingAllowed=false` / `liveBlockedBoundary=true` evidence. The report can be archived by CI or local release runs as proof that the P0 acceptance path completed.

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
npm test
npm run build
docker compose config
git diff --check
```

---

## Batch 11: P0 Acceptance Manifest Validation

**Outcome:** A saved P0 acceptance manifest can be validated offline without starting Docker services again.

**Files:**
- Modify: `tools/docker_smoke.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 11.1: Add offline manifest validation

- [x] **Step 1: Write failing tests**

Add tests proving that Docker smoke can:
- validate an `aiqt.p0AcceptanceManifest` JSON contract
- reject manifests that enable live trading or omit required P0 checks
- load a manifest from disk
- validate a report through a CLI mode without starting Compose

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
```

- [x] **Step 2: Implement validator**

Add `validate_p0_acceptance_manifest`, `load_p0_acceptance_report`, and `--validate-p0-acceptance-report <path>` to `tools/docker_smoke.py`. The CLI validation mode should print a concise summary and exit before calling Compose.

- [x] **Step 3: Document validator**

Update deployment docs to show:

```powershell
python tools/docker_smoke.py --validate-p0-acceptance-report data/p0-acceptance.json
```

Implementation note: Batch 11 now adds offline validation for `aiqt.p0AcceptanceManifest`. The validator rejects missing core P0 checks, unsafe live-trading boundaries, mismatched check counts, malformed JSON, and can be run through `--validate-p0-acceptance-report` without calling Docker Compose.

- [x] **Step 4: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k docker_smoke
npm test
npm run build
docker compose config
git diff --check
```

---

## Batch 12: P0 Acceptance Script And CI Entry

**Outcome:** P0 acceptance becomes a named product gate that local users and GitHub Actions can run without memorizing long `tools/docker_smoke.py` argument chains.

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `apps/web/src/lib/deployment.test.js`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 12.1: Promote P0 acceptance to first-class scripts

- [x] **Step 1: Write failing deployment contract tests**

Add tests proving the root package exposes:
- `docker:smoke:p0`
- `docker:smoke:p0:validate`

Add tests proving GitHub Actions runs:
- the basic Docker smoke through the package script
- the P0 acceptance smoke with import check and manifest output
- offline manifest validation
- artifact upload for `data/p0-acceptance.json`

Run:

```powershell
npm run test --workspace @aiqt/web -- deployment.test.js
```

- [x] **Step 2: Implement scripts and workflow**

Add root package scripts for P0 acceptance and manifest validation. Update `.github/workflows/ci.yml` to use those scripts and archive the P0 acceptance manifest.

- [x] **Step 3: Document product gate**

Update deployment docs so users can run:

```powershell
npm run docker:smoke:p0 -- --no-build --down
npm run docker:smoke:p0:validate
```

Implementation note: Batch 12 now promotes P0 acceptance to root package scripts. CI runs the basic Docker smoke through `npm run docker:smoke`, runs full P0 acceptance with import check and manifest output through `npm run docker:smoke:p0`, validates the saved manifest offline through `npm run docker:smoke:p0:validate`, and uploads `data/p0-acceptance.json` as the `p0-acceptance-manifest` artifact. README and the product plan now describe the named product gate instead of asking users to remember the full Python argument chain.

- [x] **Step 4: Verify**

Run:

```powershell
npm run test --workspace @aiqt/web -- deployment.test.js
npm test
npm run build
docker compose config
git diff --check
```

---

## Batch 13: P0 Acceptance Manifest Readback

**Outcome:** The platform can read the latest `data/p0-acceptance.json`, validate the manifest boundary, and project it into frontend/API models so Audit and release views can use the same acceptance evidence as CI.

**Files:**
- Add: `services/quant_core/quant_core/p0_acceptance.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 13.1: Expose latest P0 acceptance evidence to the product

- [x] **Step 1: Write failing backend tests**

Add tests for:
- validating a saved `aiqt.p0AcceptanceManifest`
- rejecting unsafe live-trading manifests
- returning a missing/report-not-found state without crashing
- `GET /api/p0/acceptance/latest` returning the validated status payload

- [x] **Step 2: Write failing frontend tests**

Add tests proving:
- `buildP0AcceptanceLatestUrl` points to `/api/p0/acceptance/latest`
- `loadP0AcceptanceLatest` strictly parses the backend payload
- `buildP0AcceptanceSummary` produces `passed`, `missing`, or `invalid` summary rows without enabling live trading

- [x] **Step 3: Implement backend readback**

Create `quant_core.p0_acceptance` with a reusable manifest validator and projection. The endpoint must read `data/p0-acceptance.json` by default and never treat missing evidence as success.

- [x] **Step 4: Implement frontend API/model projection**

Add typed interfaces, URL builder, loader, payload guard, and workbench summary helper. Keep this as a model/API slice first; UI placement can follow in the next batch.

- [x] **Step 5: Document readback contract**

Update README and product plan with the new API and explain that it reads local acceptance evidence only.

- [x] **Step 6: Verify**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k p0_acceptance
npm run test --workspace @aiqt/web -- terminal-api.test.ts terminal-workbench.test.ts
npm test
npm run build
docker compose config
git diff --check
```

Implementation note: Batch 13 now adds `quant_core.p0_acceptance` and `GET /api/p0/acceptance/latest` to read the latest local `data/p0-acceptance.json`, validate the same paper-only/live-blocked boundary expected by CI, and return `passed`, `missing`, or `invalid` without treating missing evidence as success. The frontend API now has `buildP0AcceptanceLatestUrl`, `loadP0AcceptanceLatest`, strict payload guards, and `buildP0AcceptanceSummary`, so future Audit/release UI can consume the same acceptance evidence while still keeping live trading closed when a manifest is missing, malformed, or claims `liveTradingAllowed=true`.

---

## Batch 14: P0 Acceptance Status In The Workbench

**Outcome:** The main workbench shows the latest local P0 acceptance status from `/api/p0/acceptance/latest`, lets the user refresh it, and routes them to Audit for review without creating another hidden sidebar or enabling live trading.

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 14.1: Surface readback as product evidence

- [x] **Step 1: Write failing layout/source tests**

Add tests proving:
- App imports and calls `loadP0AcceptanceLatest`
- App derives `buildP0AcceptanceSummary`
- the P0 readiness area renders a `.p0-acceptance-summary` card
- the card has refresh and Audit review actions
- CSS gives the acceptance card compact, non-scroll, tone-specific states

- [x] **Step 2: Implement App state and loading**

Add `p0AcceptanceLatestState`, `isLoadingP0Acceptance`, a `refreshP0AcceptanceLatest` callback, and a mount effect. Missing or invalid evidence must remain a normal UI state, not a runtime error.

- [x] **Step 3: Render the acceptance card**

Place a compact acceptance card inside the existing P0 readiness block near completion/readiness, not in a new right rail. Include status, run/check counts, source path, refresh button, and Audit navigation.

- [x] **Step 4: Style without adding scroll surfaces**

Reuse compact dashboard styling. The card must not introduce its own scrollbar and must keep text ellipsized in the existing product shell.

- [x] **Step 5: Document the visible workflow**

Update README and product plan to explain that the workbench now reads the local acceptance manifest and highlights missing/invalid evidence.

- [x] **Step 6: Verify**

Run:

```powershell
npm run test --workspace @aiqt/web -- layout-css.test.js
npm test
npm run build
git diff --check
```

Implementation note: Batch 14 now promotes latest P0 acceptance evidence into the main workbench. `App.tsx` loads `/api/p0/acceptance/latest` on mount, derives `buildP0AcceptanceSummary`, renders a compact `.p0-acceptance-summary` inside the existing P0 readiness block, and exposes refresh plus Audit review actions. Missing or invalid manifests remain visible risk states and do not throw runtime errors or unlock live trading. The card is styled as a non-scroll compact evidence strip with tone-specific borders, and README/product-plan now document the visible readback workflow.

---

## Batch 15: Audit P0 Acceptance Manifest Review

**Outcome:** Audit now has a first-class P0 acceptance review panel that shows the latest local manifest state, source, run context, check ids, and live-blocked boundary from the same `/api/p0/acceptance/latest` evidence used by the main workbench.

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 15.1: Make Audit review the acceptance manifest

- [x] **Step 1: Write failing layout/source tests**

Add tests proving:
- Audit renders `P0AcceptanceReviewPanel`
- the panel receives `p0AcceptanceLatestState.acceptance`, `p0AcceptanceSummary`, refresh state, and refresh action
- the panel maps manifest `checkIds`
- CSS assigns a dedicated `acceptance` audit grid area
- the review card is compact and non-scroll

- [x] **Step 2: Implement the Audit panel**

Add `P0AcceptanceReviewPanel` with status, run, context, source path, boundary, and manifest check rows. Missing or invalid evidence must render as normal review states.

- [x] **Step 3: Wire Audit layout**

Place the acceptance panel before the Audit report ledger as a full-width rectangular grid area, keeping the report ledger full width below it.

- [x] **Step 4: Document the visible workflow**

Update README and product plan to explain that Audit now reviews the local P0 acceptance manifest.

- [x] **Step 5: Verify**

Run:

```powershell
npm run test --workspace @aiqt/web -- layout-css.test.js
npm test
npm run build
git diff --check
```

Implementation note: Batch 15 now adds `P0AcceptanceReviewPanel` to the Audit workspace. It reuses `p0AcceptanceLatestState` and `buildP0AcceptanceSummary`, lists manifest `checkIds`, shows source/run/context/boundary metadata, and keeps missing or invalid manifests visible without unlocking live trading. Audit layout now has a dedicated full-width `acceptance` grid area before the report ledger so the review panel does not crowd or overlap existing audit tables.

---

## Batch 16: Portable P0 Acceptance Review

**Outcome:** The Audit P0 acceptance review can now be copied or downloaded as a Markdown evidence note, using the same acceptance summary and manifest state shown in the UI.

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 16.1: Make acceptance review portable

- [x] **Step 1: Write failing tests**

Add tests proving:
- `buildP0AcceptanceReviewMarkdown` includes status, source, run, context, check counts, manifest check ids, and live-blocked boundary
- App derives `p0AcceptanceReviewMarkdown`
- Audit passes copy/download handlers into `P0AcceptanceReviewPanel`
- the panel renders compact copy/download/refresh actions

- [x] **Step 2: Implement Markdown builder**

Add `buildP0AcceptanceReviewMarkdown` to `terminal-workbench.ts`, reusing `P0AcceptanceSummary` and the latest acceptance status. Missing and invalid manifests must still export clear audit notes without enabling live trading.

- [x] **Step 3: Wire copy and download actions**

Add App state and callbacks for copying/downloading the acceptance review Markdown. Use a safe run-id based filename and reset copied state when the underlying review changes.

- [x] **Step 4: Update Audit panel actions and styling**

Render copy/download/refresh controls in the existing `P0AcceptanceReviewPanel` header without adding a new scroll surface.

- [x] **Step 5: Document the workflow**

Update README and product plan so the portable acceptance review is part of the visible P0 evidence workflow.

- [x] **Step 6: Verify**

Run:

```powershell
npm run test --workspace @aiqt/web -- terminal-workbench.test.ts layout-css.test.js
npm test
npm run build
git diff --check
```

Implementation note: Batch 16 adds `buildP0AcceptanceReviewMarkdown`, derives `p0AcceptanceReviewMarkdown` in `App.tsx`, and adds copy/download actions to the Audit P0 acceptance review panel. The exported note records status, source, generated time, run, context, check ids, `paperOnly`, reported `liveTradingAllowed`, `liveBlockedBoundary`, and an explicit statement that the review is audit evidence only and does not authorize live trading.

---

## Batch 17: Audit-Ledger P0 Acceptance Review

**Outcome:** The Audit P0 acceptance review is now recordable into the backend audit ledger as `p0_acceptance_review`, so local P0 acceptance evidence can be searched alongside generated reports and runbook records.

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

### Task 17.1: Make acceptance review first-class audit evidence

- [x] **Step 1: Write failing tests**

Add tests proving:
- `buildP0AcceptanceReviewAuditEvent` records status, source, run, context, check ids, hash, and live-blocked boundary without embedding the Markdown body
- Audit report history queries include `p0_acceptance_review`
- `P0AcceptanceReviewPanel` accepts a ledger save action and records saving state

- [x] **Step 2: Implement audit event builder**

Add `buildP0AcceptanceReviewAuditEvent` to `terminal-api.ts`. The event records a stable `eventId`, content hash, filename, manifest status, check ids, source path, manifest generated time, context, and an explicit `liveTradingAllowed: false` boundary.

- [x] **Step 3: Wire Audit panel save action**

Add App state and callback for saving the P0 acceptance review via `saveAuditEvent`, then merge successful events into the Audit report ledger list.

- [x] **Step 4: Update report ledger filters**

Include `p0_acceptance_review` in the Audit report history event-type filter so saved acceptance reviews can be searched with other report evidence.

- [x] **Step 5: Verify**

Run:

```powershell
npm run test --workspace @aiqt/web -- terminal-api.test.ts layout-css.test.js
npm test
npm run build
git diff --check
```

Implementation note: Batch 17 adds `buildP0AcceptanceReviewAuditEvent`, a new Audit panel `入账/Record` action, and a report ledger filter that includes `p0_acceptance_review`. The event stores the Markdown hash and audit metadata, but not the full Markdown body, and keeps the hard live-trading boundary as `liveTradingAllowed: false`.

---

## Explicitly Deferred Until After P0

The following are important, but should not consume the next large batch:

- Real A-share broker trading.
- Real US brokerage trading.
- Crypto exchange order submission.
- Multi-user accounts, permissions, billing, SaaS hosting.
- High-frequency execution.
- Arbitrary code strategy runtime.
- Full portfolio optimizer.
- Fully automated live promotion.

P0 must first prove the local personal workflow.

---

## P0 Acceptance Definition

P0 is accepted only when a fresh user can perform this sequence in Docker or local dev:

1. Open the app at `http://127.0.0.1:5173`.
2. Select A-share `600000`.
3. Confirm data readiness is ready or manually repair cache.
4. Select or edit a structured strategy.
5. Run the audited pipeline.
6. Read the backtest report.
7. Run evidence-bound AI review.
8. Submit one paper-only simulation.
9. See account replay and order history.
10. Export the P0 package.
11. Import the package into a clean local database.
12. Verify the imported package restores run, strategy, AI review, paper simulation, replay, and audit evidence.
13. Confirm every execution surface still says live trading is blocked.

Final acceptance commands:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core
npm test
npm run build
docker compose config
git diff --check
```

---

## Recommended Execution Mode

Use inline execution for Batch 1 because it touches the central UI and needs continuous product judgment. Use subagent-driven development for Batches 2-6 only when each batch can be assigned with the file list and tests above. Do not run unrelated UI redesign and backend execution-chain changes in the same batch.
