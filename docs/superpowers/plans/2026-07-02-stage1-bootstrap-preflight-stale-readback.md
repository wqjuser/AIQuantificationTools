# Stage 1 Bootstrap Preflight Stale Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mark Stage 1 bootstrap preflight reports as review when their source package/manifests changed after the preflight was generated.

**Architecture:** Mirror the existing Stage 1 daily-use stale-source projection. The persisted preflight manifest stays schema-compatible, while `load_stage1_bootstrap_preflight_status` returns a projected readback with `status=review`, updated counts, `staleSourcePaths`, and affected checks changed from ready to review. The web API/client/model accepts and surfaces the stale source list without running any upstream smoke, desktop build, audit write, broker connection, or order path.

**Tech Stack:** Python stdlib file mtimes and manifest validators, React/TypeScript model helpers, Vitest, unittest.

---

### Task 1: Core Stale Readback Projection

**Files:**
- Modify: `services/quant_core/quant_core/stage1_bootstrap_preflight.py`
- Modify: `tools/stage1_bootstrap_preflight.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing backend stale tests**

Add tests that:
- create ready package/P0/P1/desktop/daily-use/preflight artifacts;
- update `data/stage1-daily-use.json` mtime after preflight;
- call `load_stage1_bootstrap_preflight_status`;
- assert `status == "review"`, `readyCount == 5`, `reviewIds == ["stage1-daily-use"]`, `staleSourcePaths == ["data/stage1-daily-use.json"]`, and the `stage1-daily-use` check action recommends `npm run stage1:preflight`.

Add a second test for `package.json` becoming newer, expecting the `package-scripts` check to move to review.

- [x] **Step 2: Run RED backend tests**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight_marks_report_review_when_source_is_newer
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight_marks_package_scripts_review_when_package_is_newer
```

Expected: fail because preflight status currently returns the stored ready report unchanged.

- [x] **Step 3: Implement stale projection**

Implement helpers:
- `_project_stale_source_review(report, report_path)`
- `_stage1_bootstrap_preflight_stale_source_paths(report, report_path)`
- `_stage1_bootstrap_preflight_stale_check_ids(report, stale_sources)`
- `_stage1_bootstrap_preflight_project_root_for_report(report_path)`

Rules:
- compare `package.json`, P0/P1/desktop/daily-use sources against the preflight report mtime;
- missing source paths also count as stale;
- only ready checks are downgraded to review;
- update `readyCount`, `reviewCount`, `blockedCount`, `status`, `ready`, `reviewIds`, `nextAction`, `recommendedCommand`, `summary`, `reason`, and `staleSourcePaths`;
- keep `paperOnly=true`, `liveTradingAllowed=false`, `liveBlockedBoundary=true`.

- [x] **Step 4: Run backend tests GREEN**

Run the two targeted backend tests, then:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight
```

### Task 2: Web Client And Summary Stale Surface

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write failing frontend stale tests**

Add tests that:
- `loadStage1BootstrapPreflightLatest` accepts `staleSourcePaths`;
- fallback remains safe when malformed;
- `buildStage1BootstrapPreflightSummary` exposes `staleSourcePaths`, `staleSourceSummary`, headline `needs refresh`, and detail telling the operator to run `npm run stage1:preflight`.

- [x] **Step 2: Run RED frontend tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "stale Stage 1 bootstrap preflight"
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "stale Stage 1 bootstrap preflight"
```

Expected: fail because stale fields are not accepted/surfaced.

- [x] **Step 3: Implement frontend stale fields**

Add optional `staleSourcePaths` to:
- `Stage1BootstrapPreflight`;
- `Stage1BootstrapPreflightSummarySource`;
- `Stage1BootstrapPreflightSummary`.

Add helpers mirroring daily-use:
- `normalizeStage1BootstrapPreflightStaleSourcePaths`
- `buildStage1BootstrapPreflightStaleSourceSummary`

When stale exists, summary headline becomes `Stage 1 bootstrap preflight needs refresh (x/y)` and detail includes the stale source list.

- [x] **Step 4: Run frontend tests GREEN**

Run the two targeted frontend tests.

### Task 3: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: this plan

- [x] **Step 1: Update docs**

Mention that preflight readback now detects stale source manifests and prompts `npm run stage1:preflight`, without running upstream evidence.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "Stage 1 bootstrap preflight"
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "bootstrap preflight"
npm run stage1:preflight && npm run stage1:preflight:validate
npm run test --workspace @aiqt/web -- --run
npm run test:python
npm run build
```

- [x] **Step 3: Commit**

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-bootstrap-preflight-stale-readback.md services/quant_core/quant_core/stage1_bootstrap_preflight.py tools/stage1_bootstrap_preflight.py services/quant_core/tests/test_quant_core.py apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts
git commit -m "feat: flag stale stage1 bootstrap preflight"
```
