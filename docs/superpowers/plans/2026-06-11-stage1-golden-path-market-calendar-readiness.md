# Stage 1 Golden Path Market Calendar Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the P0 Golden Path market-data step explain the same market-calendar review evidence that the Stage 1 Research readiness checklist already shows.

**Architecture:** Do not add a new Golden Path step. Keep the six-step runbook stable and fold calendar review into the existing `market-data` step after cache/refresh evidence is usable. Missing, empty, or stale cache remains the primary blocker. A supplied calendar with static-template warnings, closed status, or break status makes `market-data` a review step with `run-pipeline` as the next action, so the Research workspace can handle the existing review confirmation flow.

**Tech Stack:** Python core Golden Path helper, unittest coverage, product plan documentation.

---

### Task 1: Golden Path Calendar Review Contract

**Files:**
- Modify: `services/quant_core/quant_core/golden_path.py`
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing tests**

Add focused tests for `build_golden_path_status` with fresh cache, matching ready watchlist refresh evidence, and a supplied A-share lunch-break calendar containing the static-template warning.

Assert:
- `status["status"] == "review"`
- `status["currentStepId"] == "market-data"`
- `status["nextAction"]["id"] == "run-pipeline"`
- `status["steps"][0]["status"] == "review"`
- the market-data detail includes the existing cache refresh evidence plus `Market calendar review: break/lunch_break · next open ... · Static session template...`
- the market runbook/workspace surface the same review detail without changing the six-step runbook count.

- [x] **Step 2: Verify RED**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k test_golden_path_status_marks_market_calendar_review_after_fresh_data
```

Expected: fail because `build_golden_path_status` does not accept or surface calendar evidence.

- [x] **Step 3: Implement minimal support**

In `golden_path.py`:
- add optional `market_calendar` to `build_golden_path_status` and `_market_data_step`;
- keep cache blockers and refresh-evidence review behavior unchanged;
- when cache/refresh evidence is otherwise usable, append a calendar review clause for non-open calendars or calendars with warnings;
- set market-data status to `review` and action to `run-pipeline` for calendar-only review.

- [x] **Step 4: Verify GREEN**

Run the focused unittest and confirm it passes.

### Task 2: API Binding And Product Plan

**Files:**
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] **Step 1: Bind API status to calendar**

Ensure `/api/golden-path/status` passes the current market calendar snapshot into `build_golden_path_status`, so frontend status and audit runbook use the same calendar review context as Research readiness.

- [x] **Step 2: Update product plan**

Record that Stage 1 market-calendar evidence now appears in Golden Path market-data review context without adding a new step or changing execution gates.

- [x] **Step 3: Run full verification**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k test_golden_path_status_marks_market_calendar_review_after_fresh_data
npm --prefix apps/web run build
npm test
npm run docker:smoke
git diff --check
```

Expected: all pass.

**Progress:**
- 2026-06-11: Planned a Stage 1 Golden Path consistency slice so market-calendar readiness is visible in the same P0 runbook that drives current-task navigation.
- 2026-06-11: Added RED coverage for Golden Path market-data review when fresh cache and refresh evidence are available but the supplied market calendar requires review.
- 2026-06-11: Implemented optional market-calendar review on the Golden Path market-data step, preserving cache/refresh blockers and keeping calendar-only review pointed at `run-pipeline`.
- 2026-06-11: Bound `/api/golden-path/status` to current market calendar only before a context audit run exists, so existing audited runs continue advancing through the P0 flow.
- 2026-06-11: Updated the product plan with the new Golden Path calendar review boundary and the no-execution-unlock constraint.
- 2026-06-11: Verified with focused unittest, production web build, full Python + web test suite, Docker smoke on `http://127.0.0.1:5173`, and `git diff --check`.
