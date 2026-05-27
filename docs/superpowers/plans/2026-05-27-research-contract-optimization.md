# Research Contract Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an addressable research run detail contract so audited runs can be fetched and replayed by id.

**Architecture:** Extend `ResearchRunStore` with a single-run lookup, expose it through `GET /api/research/runs/{runId}`, and add frontend API helpers that validate the detail payload before replaying it into the terminal workbench.

**Tech Stack:** Python standard library HTTP server, SQLite, React/TypeScript, Vitest, Python `unittest`.

---

### Task 1: Backend Run Detail Contract

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add a failing store test proving a recorded run can be fetched by `run_id`.
- [x] Implement `ResearchRunStore.get(run_id)`.
- [x] Add a failing API test for `GET /api/research/runs/{runId}` returning `{ "run": ... }`.
- [x] Add a failing API test for a missing run returning `404`.
- [x] Route the detail endpoint before the list endpoint in `QuantApiHandler.do_GET`.

### Task 2: Frontend Run Detail Client

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add a failing URL test for encoded `buildResearchRunDetailUrl`.
- [x] Add a failing client test for `loadResearchRunDetail`.
- [x] Add fallback behavior for invalid or unavailable detail payloads.

### Task 3: Replay From Detail

**Files:**
- Modify: `apps/web/src/App.tsx`

- [x] Update run replay to load the selected run detail by id.
- [x] Keep existing history-row replay behavior as fallback if the detail request fails.
- [x] Preserve the existing workflow replay state and active module behavior.

### Task 4: Verification

**Files:**
- Check: all changed files

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [ ] Commit the completed optimization slice.
