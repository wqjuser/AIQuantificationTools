# Stage 1 Daily Use Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the web UI refresh `data/stage1-daily-use.json` through the local core, without requiring a terminal command.

**Architecture:** Add a narrow `POST /api/stage1/daily-use` endpoint that calls the existing `quant_core.stage1_daily_use.write_stage1_daily_use_report` contract. Add `generateStage1DailyUse` to the frontend API client and wire the Stage 1/P0 daily-use card refresh button to generate the report, then re-read both Stage 1 daily-use and desktop release state.

**Tech Stack:** Python 3.12 `http.server`, existing `quant_core.stage1_daily_use` module, TypeScript API client, React state wiring, Vitest and unittest.

---

### Task 1: Backend Generate Endpoint

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] **Step 1: Add failing POST test**

Add a test near `test_stage1_daily_use_latest_api_returns_validated_report` that writes P0/P1/desktop manifests to a temp `data` directory, calls `POST /api/stage1/daily-use`, asserts HTTP 201, asserts `data/stage1-daily-use.json` exists, and checks response safety flags:

```python
self.assertEqual(response.status, 201)
self.assertTrue(file_written)
self.assertEqual(payload["status"], "daily_use_generated")
self.assertEqual(payload["dailyUse"]["status"], "ready")
self.assertFalse(payload["liveTradingAllowed"])
self.assertFalse(payload["orderSubmissionEnabled"])
self.assertFalse(payload["liveOrderSubmitted"])
self.assertFalse(payload["routeExecuted"])
```

- [x] **Step 2: Run RED backend test**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use_generate
```

Expected: fail with HTTP 404 or missing endpoint.

- [x] **Step 3: Implement endpoint**

In `QuantApiHandler.do_POST`, handle `/api/stage1/daily-use` by calling:

```python
write_stage1_daily_use_report(
    project_root=_stage1_daily_use_project_root(Path(self.stage1_daily_use_report_path)),
    output_path=Path(self.stage1_daily_use_report_path),
    p0_path=Path(self.p0_acceptance_report_path),
    p1_path=Path(self.p1_acceptance_report_path),
    desktop_path=Path(self.desktop_release_report_path),
)
```

Return `{"status":"daily_use_generated","dailyUse": ..., "paperOnly": true, "orderSubmissionEnabled": false, "liveTradingAllowed": false, "liveOrderSubmitted": false, "routeExecuted": false}` with status 201.

### Task 2: Frontend Generate API

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`

- [x] **Step 1: Add failing frontend API test**

Add imports for `buildStage1DailyUseUrl` and `generateStage1DailyUse`. Test that the function sends `POST /api/stage1/daily-use`, returns `dailyUse.status === "ready"`, and keeps order/live flags disabled.

- [x] **Step 2: Run RED frontend test**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "generates the Stage 1 daily-use"
```

Expected: fail because helper functions do not exist.

- [x] **Step 3: Implement helper**

Add URL builder, generate result interface, generate payload guard, and `generateStage1DailyUse` with fallback missing report.

### Task 3: Homepage Refresh Wiring

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Add failing layout wiring test**

Extend the Stage 1/P0 daily-use layout test to assert the app imports/calls `generateStage1DailyUse`, defines `refreshStage1DailyUseReport`, and passes it to `Stage1P0DailyUseClosurePanel`.

- [x] **Step 2: Implement refresh wiring**

Replace the panel refresh callback so clicking the existing button calls `generateStage1DailyUse(quantCoreBaseUrl)`, updates `stage1DailyUseLatestState`, then refreshes desktop release readback. Keep the button disabled while either report generation or desktop release readback is loading.

### Task 4: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Document manual UI refresh**

Mention `POST /api/stage1/daily-use` and state that it only aggregates existing manifests into `data/stage1-daily-use.json`.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "Stage 1 daily-use|generates the Stage 1 daily-use"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run stage1:daily
npm run stage1:daily:validate
npm run test:python
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-06-30-stage1-daily-use-refresh.md services/quant_core/quant_core/api.py services/quant_core/tests/test_quant_core.py apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts
git commit -m "feat: add stage1 daily use refresh"
```
