# Stage 1 Market Calendar Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the read-only market session calendar from a Market workspace card into Stage 1 research readiness and audited research-run evidence.

**Architecture:** The Python research pipeline will snapshot the selected market calendar into `researchRun.dataSnapshot.marketCalendar` when a run is created. The frontend workbench will treat this snapshot and the live calendar loader as review-only research context evidence, so users can see whether they are researching during open, closed, lunch-break, or static-template calendar conditions without unlocking any execution path.

**Tech Stack:** Python `unittest`, existing `quant_core.market_calendar`, React/TypeScript workbench helpers, Vitest, product plan documentation.

---

### Task 1: Backend Research Run Calendar Snapshot

**Files:**
- Modify: `services/quant_core/quant_core/research.py`
- Modify: `services/quant_core/quant_core/runs.py`
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing backend tests**

Add a focused test that creates a research run for `ashare/600000/1d` and asserts:
- the immediate `researchRun.dataSnapshot.marketCalendar.market` is `ashare`;
- `marketCalendar.source` is `static-session-template`;
- the persisted run detail still includes `dataSnapshot.marketCalendar`;
- export/import normalization keeps the `marketCalendar` object in `dataSnapshot`.

- [x] **Step 2: Run focused backend test**

Run:
```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k market_calendar_snapshot
```

Expected: fail because research runs do not yet attach or preserve `dataSnapshot.marketCalendar`.

- [x] **Step 3: Implement backend snapshot support**

Call `build_market_calendar_status(market, at=created_at)` inside `run_terminal_research` and pass the resulting dictionary into `_data_snapshot_payload`. Extend `_normalize_data_snapshot` to preserve valid `marketCalendar` dictionaries with string `market`, `timezone`, `status`, `session`, `asOf`, `tradingDay`, `detail`, `source`, boolean `isOpen`, nullable `nextOpen`/`nextClose`, and string-list `warnings`.

- [x] **Step 4: Verify backend**

Run:
```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k market_calendar_snapshot
```

Expected: pass.

### Task 2: Frontend Research Readiness Calendar Row

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Write failing frontend tests**

Add tests that assert:
- `buildResearchContextReadinessRows` accepts a `marketCalendar` input and inserts a `calendar` row after the instrument row.
- An `open` calendar with no warnings is `ready`.
- A static-template warning or closed/break status is `review`, not `blocked`.
- `App.tsx` passes `marketCalendarState.calendar` into `buildResearchContextReadinessRows`.

- [x] **Step 2: Run focused frontend tests**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "calendar readiness"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "calendar readiness"
```

Expected: fail because the readiness builder does not accept or render calendar evidence yet.

- [x] **Step 3: Implement readiness row**

Extend `ResearchContextReadinessInput` with an optional `marketCalendar` shape compatible with `MarketCalendarStatus`. Add `calendar` to `ResearchContextReadinessRow["id"]`. Insert a calendar row after `instrument`:
- `ready` when status is `open` or `always_open` and there are no warnings;
- `review` when status is `closed`, `break`, `unknown`, or warnings exist;
- never `blocked`.

- [x] **Step 4: Wire App state into readiness**

Pass `marketCalendarState.calendar` to `buildResearchContextReadinessRows`. Keep the Market workspace card unchanged.

- [x] **Step 5: Verify frontend**

Run:
```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "calendar readiness"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "calendar readiness"
```

Expected: pass.

### Task 3: Product Plan And Full Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-11-stage1-market-calendar-evidence.md`

- [x] **Step 1: Update product plan**

Record that Stage 1 research readiness and research-run data snapshots now include read-only market calendar evidence, with static-template warnings and no trading unlock.

- [x] **Step 2: Run full verification**

Run:
```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k market_calendar_snapshot
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "calendar readiness"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "calendar readiness"
npm --prefix apps/web run build
npm test
npm run docker:smoke
git diff --check
```

Expected: all pass.

**Progress:**
- 2026-06-11: Planned a Stage 1 follow-up to make market calendar status usable as research readiness and audited run evidence, without changing execution or live-routing gates.
- 2026-06-11: Added backend RED/GREEN coverage for `researchRun.dataSnapshot.marketCalendar`, then wired `run_terminal_research` and run import/export normalization to preserve a static-session calendar snapshot.
- 2026-06-11: Added frontend RED/GREEN coverage for a non-blocking `calendar` readiness row and wired `marketCalendarState.calendar` into the Research readiness checklist.
- 2026-06-11: Updated the product plan to record market-calendar evidence as Stage 1 research review context only, with no simulated or live execution unlock.
- 2026-06-11: Verified the slice with focused backend/frontend tests, production web build, full repository tests, and Docker smoke on port 5173.
