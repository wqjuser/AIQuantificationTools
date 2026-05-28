# Paper Execution Portable Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make audited research export/import packages portable for execution review by carrying run-scoped paper execution history across machines.

**Architecture:** The API export endpoint reads recent `PaperExecutionStore` records for the audited run, serializes them as `paperExecutions`, and records their count in the manifest. Import validates the export package, restores the `ResearchRunAudit`, converts imported paper execution payloads back into `PaperExecutionRecord` values, and writes them into the target `PaperExecutionStore`.

**Tech Stack:** Python standard-library API, SQLite stores, React/TypeScript frontend contract types, Vitest, unittest.

---

### Task 1: Backend Portable Paper History

**Files:**
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/execution.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add a failing end-to-end API test proving export/import preserves paper execution history.
- [x] Include normalized `paperExecutions` in research run export packages.
- [x] Include `paperExecutions` in manifest artifact counts while keeping older packages without the count importable.
- [x] Convert imported paper execution payloads back into `PaperExecutionRecord` values and persist them.
- [x] Reject non-paper or malformed imported execution payloads before writing imported state.

### Task 2: Frontend Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add frontend API coverage for export packages with paper execution payloads.
- [x] Type optional `manifest.artifactCounts.paperExecutions`.
- [x] Type and validate optional `paperExecutions` payloads.

### Task 3: Documentation And Verification

**Files:**
- Modify: `docs/architecture.md`

- [x] Document that export/import carries paper execution history.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Verify local API export/import restores paper execution history.
- [x] Verify the in-app browser loads without console errors.
- [x] Commit and push the completed slice.
