# Research Run Import Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a previously exported research run JSON package into the local audit store and replay it in the terminal workbench.

**Architecture:** Add a paper-only import path beside the export endpoint. The Python core validates `aiqt.researchRun.export` packages, rejects any package that claims live trading is allowed, stores the contained `researchRun`, and returns a full detail payload; the React UI lets users import a `.json` package from Run History and immediately replays its chart snapshot and audit context.

**Tech Stack:** Python standard-library HTTP service, SQLite audit store, Python `unittest`, TypeScript API client, Vitest, React file input.

---

### Task 1: Backend Import API

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add a failing POST test for `/api/research/runs/import` using an exported JSON package.
- [x] Convert imported camelCase `researchRun` payloads back into `ResearchRunAudit`.
- [x] Persist imported runs in `ResearchRunStore`.
- [x] Return a full run detail payload with `dataSnapshot`.
- [x] Reject packages that set `liveTradingAllowed=true`.

### Task 2: Frontend Import Client

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add `buildResearchRunImportUrl(...)`.
- [x] Add `importResearchRunExport(...)` with POST JSON body.
- [x] Validate that the import response includes a full `ResearchRunAudit` with `dataSnapshot`.
- [x] Return fallback results for invalid import contracts or HTTP failures.

### Task 3: Run History Import UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/i18n.ts`
- Test: `apps/web/src/lib/layout-css.test.js`

- [x] Add a hidden JSON file input and compact import button to Run History.
- [x] Parse selected export JSON files and support both direct package files and `{ export: ... }` API response files.
- [x] Replay imported runs into the current workspace, chart data, workflow state, and run history.
- [x] Add localized import labels and status text.

### Task 4: Verification

**Files:**
- Check: all changed files

- [x] Run focused backend import API tests.
- [x] Run focused frontend API tests.
- [x] Run focused layout tests.
- [x] Run the full frontend/backend test suite.
- [x] Run the production build.
- [x] Verify the live local API can export and re-import a package.
- [x] Verify the in-app browser shows the import action without console errors.
- [ ] Commit and push the completed slice.
