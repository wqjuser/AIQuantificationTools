# Structured Strategy Audit Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the structured strategy config used by each research run so history replay, AI review, and future visual strategy editing do not depend on free-text snapshots alone.

**Architecture:** Add `strategy_config_json` to `ResearchRunStore`, normalize it to a camelCase `strategyConfig` payload, write the actual backend `StrategyConfig` from `run_terminal_research`, validate it in the frontend API client, and replay it into the visible strategy snapshot.

**Tech Stack:** Python SQLite persistence, Python `unittest`, TypeScript contract validation, Vitest.

---

### Task 1: Backend Strategy Config Persistence

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/research.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add failing tests for recorded, fetched, serialized, API-returned, and pipeline-generated `strategyConfig`.
- [x] Add `strategy_config` to `ResearchRunAudit`.
- [x] Add `strategy_config_json` schema creation and migration.
- [x] Normalize old rows into a minimal strategy config.
- [x] Persist the actual `StrategyConfig` produced by the research pipeline.

### Task 2: Frontend Strategy Config Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add frontend types for structured strategy config, conditions, and risk.
- [x] Validate `strategyConfig` in run list/detail payloads.
- [x] Reject malformed strategy condition params.
- [x] Replay structured conditions and risk into the visible strategy snapshot.

### Task 3: Verification

**Files:**
- Check: all changed files

- [x] Run focused backend tests.
- [x] Run focused frontend API tests.
- [x] Run focused frontend workbench tests.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Verify the live local API returns `strategyConfig` in run detail.
- [ ] Commit and push the completed slice.
