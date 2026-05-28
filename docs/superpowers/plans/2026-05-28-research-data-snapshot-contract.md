# Research Data Snapshot Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind each audited research run to the exact OHLCV bars used for its backtest so history replay can restore the chart data, not just metrics, strategy text, and AI notes.

**Architecture:** Add `data_snapshot_json` to `ResearchRunStore`, store a normalized bar payload plus source, completeness, warning, range, row count, and hash metadata, expose the full `dataSnapshot` only on run detail, and let the web client convert it into `MarketKlinesResult` during history replay.

**Tech Stack:** Python SQLite persistence, Python `unittest`, TypeScript contract validation, Vitest, React state integration.

---

### Task 1: Backend Snapshot Persistence

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/research.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add failing tests for recorded, fetched, pipeline-generated, history-serialized, and detail-returned `dataSnapshot`.
- [x] Add `data_snapshot` to `ResearchRunAudit`.
- [x] Add `data_snapshot_json` schema creation and migration.
- [x] Store normalized OHLCV bars, source, quality flags, range, row count, and snapshot hash.
- [x] Keep heavy snapshot bars out of history list payloads and include them in run detail payloads.

### Task 2: Frontend Snapshot Replay

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add frontend types for `dataSnapshot` and audited bars.
- [x] Validate snapshot metadata and bars in run detail payloads.
- [x] Reject malformed snapshot bars.
- [x] Convert audited snapshots to `MarketKlinesResult`.
- [x] Refresh the chart state from audited bars when replaying a historical run.

### Task 3: Verification

**Files:**
- Check: all changed files

- [x] Run focused backend tests.
- [x] Run focused frontend API tests.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Verify the live local API returns `dataSnapshot` on run detail and omits it from history list.
- [ ] Commit and push the completed slice.
