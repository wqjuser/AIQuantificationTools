# Research Run Export Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export any audited research run as a reproducible JSON package containing the strategy, data snapshot, AI report, metrics, trades, and blocked execution handoff gates.

**Architecture:** Add a backend export serializer and `/api/research/runs/{runId}/export` route on top of the existing persisted research run audit. Validate the package in the frontend API client, then expose compact replay/export actions from Run History without changing the paper-only execution boundary.

**Tech Stack:** Python standard-library HTTP service, Python `unittest`, TypeScript contract validation, Vitest, React, browser Blob download.

---

### Task 1: Backend Export Contract

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add a failing API test for `GET /api/research/runs/{runId}/export` that asserts `kind`, `packageVersion`, manifest identity, data snapshot hash, artifact counts, and paper-only execution gates.
- [x] Add `research_run_export_to_payload(...)` to build a stable package from `ResearchRunAudit`.
- [x] Return `research_run_not_found` with HTTP 404 when the export run id is unknown.
- [x] Keep `liveTradingAllowed=false` and `paperOnly=true` in the manifest and execution handoff.

### Task 2: Frontend Export Client

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add `buildResearchRunExportUrl(...)` with encoded run ids.
- [x] Add `ResearchRunExportPackage`, `ResearchRunExportManifest`, and execution handoff types.
- [x] Validate that exported packages include a full `researchRun` detail payload with `dataSnapshot`.
- [x] Return a fallback result for malformed export contracts.

### Task 3: Run History Export Action

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/i18n.ts`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] Add a failing layout test requiring separate compact row actions for replay and export.
- [x] Add localized `history.export` text and translated export status labels.
- [x] Convert each history row from a single full-row button into an article with a main replay target and explicit replay/export buttons.
- [x] Download the export package as `<runId>-research-export.json` using a browser Blob.

### Task 4: Verification

**Files:**
- Check: all changed files

- [x] Run focused backend export API tests.
- [x] Run focused frontend API tests.
- [x] Run focused layout tests.
- [x] Run the full frontend/backend test suite.
- [x] Run the production build.
- [x] Verify the live local API export route.
- [x] Verify the in-app browser shows the export action without console errors.
- [ ] Commit and push the completed slice.
