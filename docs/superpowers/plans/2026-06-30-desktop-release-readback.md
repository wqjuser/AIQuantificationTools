# Desktop Release Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Stage 1/P0 daily-use desktop release row reflect a real local desktop release manifest instead of a static hard-coded review state.

**Architecture:** Follow the existing P0/P1 acceptance readback pattern. Add a backend desktop-release manifest validator and `GET /api/desktop/release/latest`, add a typed frontend loader and summary model, then feed that summary into `buildStage1P0DailyUseClosure`.

**Tech Stack:** Python stdlib HTTP API, TypeScript, React, Vitest, unittest.

---

### Task 1: Backend Desktop Release Readback

**Files:**
- Create: `services/quant_core/quant_core/desktop_release.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing backend tests**

Add tests for `load_desktop_release_status`, missing file handling, unsafe live-enabled manifest rejection, and `GET /api/desktop/release/latest`.

- [x] **Step 2: Verify RED**

Run: `node tools/run_python.mjs -m unittest services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_status_reads_latest_report services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_status_reports_missing_file services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_status_rejects_live_enabled_report services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_latest_api_returns_validated_status`
Expected: FAIL because `quant_core.desktop_release` and the API route do not exist.

- [x] **Step 3: Implement backend readback**

Create `desktop_release.py` with a required manifest kind `aiqt.desktopReleaseManifest`, schema version `1`, status `passed`, checks `web-build`, `cargo-check`, `tauri-icon`, `desktop-bundle`, and `live-blocked-boundary`. Return `passed`, `missing`, or `invalid` status without ever treating live trading as enabled.

- [x] **Step 4: Verify GREEN**

Run the same focused unittest command.
Expected: PASS.

### Task 2: Frontend API And Workbench Model

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write failing frontend tests**

Add terminal API coverage for `buildDesktopReleaseLatestUrl` and `loadDesktopReleaseLatest`. Add workbench coverage for `buildDesktopReleaseSummary` and `buildStage1P0DailyUseClosure` marking desktop release ready when the manifest passes.

- [x] **Step 2: Verify RED**

Run: `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts`
Expected: FAIL because desktop release loader and summary helpers are missing.

- [x] **Step 3: Implement frontend contracts**

Add typed manifest/status interfaces, runtime guards, fallback missing status, `buildDesktopReleaseSummary`, and update daily-use closure input to consume the summary while keeping backward compatibility for `desktopBuildReady`.

- [x] **Step 4: Verify GREEN**

Run the same focused Vitest command.
Expected: PASS.

### Task 3: App Wiring, Docs, And Final Verification

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/desktop-build-notes.md`

- [x] **Step 1: Write failing layout guard**

Assert App loads desktop release status, derives `desktopReleaseSummary`, passes it to `buildStage1P0DailyUseClosure`, and exposes refresh state.

- [x] **Step 2: Verify RED**

Run: `npm run test --workspace @aiqt/web -- src/lib/layout-css.test.js`
Expected: FAIL because App still passes `desktopBuildReady: false`.

- [x] **Step 3: Implement App wiring and docs**

Add state, refresh callback, initial load, summary derivation, and documentation for `data/desktop-release.json`.

- [x] **Step 4: Verify and commit**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js
node tools/run_python.mjs -m unittest services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_status_reads_latest_report services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_status_reports_missing_file services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_status_rejects_live_enabled_report services.quant_core.tests.test_quant_core.TestQuantCore.test_desktop_release_latest_api_returns_validated_status
npm run build
cargo check
```

Expected: all commands exit 0, allowing the existing Vite chunk-size warning.
