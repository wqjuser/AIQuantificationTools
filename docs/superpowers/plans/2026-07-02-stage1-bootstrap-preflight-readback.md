# Stage 1 Bootstrap Preflight Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Stage 1 bootstrap preflight from CLI-only evidence into the local core API and homepage daily-use closure.

**Architecture:** Reuse the existing Stage 1 daily-use pattern: a strict Python manifest/status module remains the source of truth, the API exposes `GET latest` and `POST generate`, the web client validates the payload, and the homepage consumes a compact summary. The new UI is evidence-only and keeps Docker, desktop build, audit writes, broker connections, and orders explicit operator actions.

**Tech Stack:** Python stdlib HTTP server, `quant_core` manifest validators, Vitest, React/TypeScript, existing App state and CSS.

---

### Task 1: Backend API Readback And Generate

**Files:**
- Modify: `services/quant_core/quant_core/stage1_bootstrap_preflight.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing API tests**

Add tests beside the Stage 1 daily-use API tests:

```python
def test_stage1_bootstrap_preflight_latest_api_returns_validated_preflight(self):
    # Arrange temp package.json + ready P0/P1/desktop/daily-use manifests.
    # Write data/stage1-bootstrap-preflight.json.
    # GET /api/stage1/bootstrap-preflight/latest.
    # Assert kind, status ready, readyCount 6, check ids, and liveTradingAllowed false.
```

```python
def test_stage1_bootstrap_preflight_generate_api_writes_preflight_without_live_trading(self):
    # Arrange temp project with required package scripts and upstream manifests.
    # POST /api/stage1/bootstrap-preflight.
    # Assert 201, status preflight_generated, file written, ready 6/6, and all execution flags false.
```

- [x] **Step 2: Run RED backend tests**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight_latest_api
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight_generate_api
```

Expected: fail because API routes and status readback are not wired.

- [x] **Step 3: Implement backend status and routes**

Add `load_stage1_bootstrap_preflight_status(path)` that returns the valid manifest or a safe missing/invalid status with `sourcePath`, counts, six check rows, and `liveTradingAllowed=false`.

In `QuantApiHandler`:

```python
stage1_bootstrap_preflight_report_path = DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH
```

Implement:

```python
GET /api/stage1/bootstrap-preflight/latest
POST /api/stage1/bootstrap-preflight
```

`POST` must call `write_stage1_bootstrap_preflight(project_root=..., output_path=...)`, then return the readback status plus `paperOnly=true`, `orderSubmissionEnabled=false`, `liveTradingAllowed=false`, `liveOrderSubmitted=false`, and `routeExecuted=false`.

- [x] **Step 4: Run backend tests GREEN**

Run the two targeted backend commands again. Expected: both pass.

### Task 2: Web Client Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] **Step 1: Write failing client tests**

Add tests for:

```ts
loadStage1BootstrapPreflightLatest(...)
generateStage1BootstrapPreflight(...)
buildStage1BootstrapPreflightLatestUrl(...)
buildStage1BootstrapPreflightUrl(...)
```

Assertions: strict `aiqt.stage1BootstrapPreflight` payload, six check ids, `readyCount`, source paths, fallback missing object on malformed payload, and all live/order flags false.

- [x] **Step 2: Run RED client tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "Stage 1 bootstrap preflight"
```

Expected: fail because client types/helpers do not exist.

- [x] **Step 3: Implement client types and guards**

Add:

```ts
Stage1BootstrapPreflight
Stage1BootstrapPreflightCheck
Stage1BootstrapPreflightLatestResult
Stage1BootstrapPreflightGenerateResult
buildMissingStage1BootstrapPreflight(...)
isStage1BootstrapPreflightPayload(...)
```

Add fetchers mirroring `loadStage1DailyUseLatest` and `generateStage1DailyUse`.

- [x] **Step 4: Run client tests GREEN**

Run the same targeted Vitest command. Expected: pass.

### Task 3: Homepage Model And Wiring

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write failing model/UI wiring tests**

Add `buildStage1BootstrapPreflightSummary(...)` tests that convert ready/missing/invalid/blocked preflight manifests into homepage-ready state, headline, detail, action label, source path, counts, and live-blocked flags.

Update layout test to assert App imports/uses `loadStage1BootstrapPreflightLatest`, `generateStage1BootstrapPreflight`, stores `stage1BootstrapPreflightLatestState`, passes `bootstrapPreflight` into `buildStage1P0DailyUseClosure`, and refreshes preflight when daily self-check runs.

- [x] **Step 2: Run RED UI/model tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1 bootstrap preflight"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: fail because model and App wiring do not exist.

- [x] **Step 3: Implement summary and closure integration**

Add `Stage1BootstrapPreflightSummary` and pass it into `buildStage1P0DailyUseClosure`.

Closure behavior:
- If preflight is ready, keep the five daily-use rows but mention preflight readiness in detail.
- If preflight is review/blocked/missing/invalid, make the primary state reflect the preflight status and route the main action to Settings.
- Keep total row count at five so the Stage 1 daily-use card remains compact.

- [x] **Step 4: Wire App state and refresh**

Add initial state, state hook, load callback, generate callback, mount effect, summary memo, and pass:

```tsx
bootstrapPreflight: stage1BootstrapPreflightSummary
isRefreshingDailyUse={isGeneratingStage1DailyUse || isGeneratingStage1BootstrapPreflight || isLoadingDesktopRelease}
```

Use a separate `onRefreshBootstrapPreflight` only if needed; otherwise piggyback the existing “刷新自检” action so one manual click regenerates daily-use and preflight reports in order.

- [x] **Step 5: Run UI/model tests GREEN**

Run the same targeted web tests. Expected: pass.

### Task 4: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: this plan

- [x] **Step 1: Update docs**

Document:
- `GET /api/stage1/bootstrap-preflight/latest`
- `POST /api/stage1/bootstrap-preflight`
- homepage daily-use card now consumes the preflight readback.
- Boundary: no Docker, no desktop build, no audit writes, no broker connections, no orders.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "Stage 1 bootstrap preflight"
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "Stage 1 bootstrap preflight"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight
npm run test --workspace @aiqt/web -- --run
npm run test:python
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-bootstrap-preflight-readback.md services/quant_core/quant_core/stage1_bootstrap_preflight.py services/quant_core/quant_core/api.py services/quant_core/tests/test_quant_core.py apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js
git commit -m "feat: surface stage1 bootstrap preflight"
```
