# Data Quality Audit Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and expose research-run data quality so AI review, history replay, and future exports can distinguish real, incomplete, and fallback market data.

**Architecture:** Store a normalized `data_quality_json` column in `ResearchRunStore`, include `dataQuality` in research run list/detail payloads, validate it in the frontend API client, and surface incomplete data in replay workflow logs.

**Tech Stack:** Python SQLite persistence, Python `unittest`, TypeScript contract validation, Vitest.

---

### Task 1: Backend Persistence

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/research.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add failing tests for recorded, fetched, serialized, and API-returned `dataQuality`.
- [x] Add `data_quality` to `ResearchRunAudit`.
- [x] Add `data_quality_json` schema creation and migration.
- [x] Normalize old or missing quality values to a safe default.
- [x] Persist the actual market adapter quality from `run_terminal_research`.

### Task 2: Frontend Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add `ResearchRunDataQuality` to the frontend audit type.
- [x] Validate `dataQuality` when present in list and detail payloads.
- [x] Reject malformed data-quality payloads.
- [x] Surface fallback or incomplete data as a replay workflow warning.

### Task 3: Verification

**Files:**
- Check: all changed files

- [x] Run focused backend tests.
- [x] Run focused frontend API tests.
- [x] Run focused frontend workbench tests.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [ ] Commit and push the completed slice.
