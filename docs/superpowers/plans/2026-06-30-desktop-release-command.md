# Desktop Release Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn desktop release readback into a repeatable command that verifies the local package path and writes `data/desktop-release.json`.

**Architecture:** Add a small Python CLI in `tools/record_desktop_release.py` that can either orchestrate build/check/package commands or record an already-built artifact. Reuse `quant_core.desktop_release.validate_desktop_release_manifest` so generated manifests are validated by the same backend contract that powers `/api/desktop/release/latest`.

**Tech Stack:** Python stdlib, npm scripts, unittest, existing Tauri/npm build commands.

---

### Task 1: Release Recorder Tests

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Create: `tools/record_desktop_release.py`

- [x] **Step 1: Write failing recorder tests**

Add coverage for building a valid manifest from a known artifact, rejecting a missing artifact, selecting the newest auto-discovered artifact, and package scripts exposing `desktop:release` / `desktop:release:record`.

- [x] **Step 2: Verify RED**

Run: `node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k desktop_release`

Expected: FAIL because `tools.record_desktop_release` and package scripts do not exist.

### Task 2: Recorder CLI And Scripts

**Files:**
- Create: `tools/record_desktop_release.py`
- Modify: `package.json`

- [x] **Step 1: Implement manifest generation helpers**

Add platform detection, artifact discovery, manifest construction, validation, and JSON writing. Keep `paperOnly=true`, `liveTradingAllowed=false`, and `liveBlockedBoundary=true`.

- [x] **Step 2: Implement CLI modes**

Default mode runs `npm run build`, `cargo check` in `apps/web/src-tauri`, then `npm run desktop:build` before recording. `--record-only` skips command execution and records the current artifact.

- [x] **Step 3: Add npm scripts**

Add:

```json
"desktop:release": "node tools/run_python.mjs tools/record_desktop_release.py",
"desktop:release:record": "node tools/run_python.mjs tools/record_desktop_release.py --record-only"
```

- [x] **Step 4: Verify GREEN**

Run the focused unittest command again.

Expected: PASS.

### Task 3: Docs And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/desktop-build-notes.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-30-desktop-release-command.md`

- [x] **Step 1: Document daily release commands**

Update docs so operators use `npm run desktop:release` for the full path or `npm run desktop:release:record` after a manually completed package build.

- [x] **Step 2: Verify command in record-only mode**

Run: `npm run desktop:release:record`

Expected: PASS on this host because the previous desktop build produced a local `.dmg`, and `data/desktop-release.json` validates as `passed`.

- [x] **Step 3: Final verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k desktop_release
npm run test --workspace @aiqt/web -- layout-css.test.js
npm run build
```

Expected: all commands exit 0, allowing the existing Vite chunk-size warning.
