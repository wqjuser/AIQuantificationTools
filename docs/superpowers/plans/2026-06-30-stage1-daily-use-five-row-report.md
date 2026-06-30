# Stage 1 Daily Use Five Row Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `data/stage1-daily-use.json` carry the same five daily-use checkpoints shown by the Stage 1/P0 homepage card.

**Architecture:** Expand `quant_core.stage1_daily_use` from a two-row clean-open/desktop artifact to a five-row artifact: clean environment, market refresh recovery, research entry, daily start path, and desktop release. Keep all rows derived from existing P0/P1/desktop manifests only, so the report remains a conservative aggregation and does not create missing evidence or run workflows.

**Tech Stack:** Python 3.12 report builder and unittest, TypeScript API contract tests, existing Stage 1 homepage summary model, local CLI validation.

---

### Task 1: Backend Five-Row Contract

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/stage1_daily_use.py`

- [x] **Step 1: Add failing five-row expectations**

Update `test_stage1_daily_use_report_reads_acceptance_and_desktop_manifests` so a fully ready report expects:

```python
self.assertEqual(report["readyCount"], 5)
self.assertEqual(report["totalCount"], 5)
self.assertEqual(
    [row["id"] for row in report["rows"]],
    ["clean-open", "market-refresh-recovery", "research-entry", "daily-start", "desktop-release"],
)
self.assertTrue(all(row["status"] == "ready" for row in report["rows"]))
```

Also update the generate API test to expect `readyCount == 5` and `totalCount == 5`.

- [x] **Step 2: Add P1 degraded behavior test**

Add a test that writes only P0 and desktop manifests, then asserts:

```python
self.assertEqual(report["status"], "review")
self.assertEqual(report["rows"][1]["id"], "market-refresh-recovery")
self.assertEqual(report["rows"][1]["status"], "review")
self.assertEqual(report["rows"][2]["id"], "research-entry")
self.assertEqual(report["rows"][2]["status"], "review")
self.assertEqual(report["rows"][3]["id"], "daily-start")
self.assertEqual(report["rows"][3]["status"], "review")
self.assertFalse(report["liveTradingAllowed"])
```

- [x] **Step 3: Run RED backend test**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
```

Expected: fail because the report still has two rows.

- [x] **Step 4: Implement five-row report**

In `stage1_daily_use.py`:

```python
STAGE1_DAILY_USE_ROW_IDS = [
    "clean-open",
    "market-refresh-recovery",
    "research-entry",
    "daily-start",
    "desktop-release",
]
```

Add `_build_market_refresh_recovery_row`, `_build_research_entry_row`, and `_build_daily_start_row`. Use P1 acceptance check ids as proof for market/research readiness. If P1 is missing, mark these rows `review`; if P1 is invalid or unsafe, mark them `blocked`. The daily-start row mirrors the most severe state among clean-open, market-refresh-recovery, and research-entry.

### Task 2: Frontend Contract Samples

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`

- [x] **Step 1: Update Stage 1 daily-use fixtures**

Expand readback and generate fixtures to include the same five row ids and update assertions from `2/2` to `5/5`.

- [x] **Step 2: Run RED/GREEN frontend contract test**

Run after backend implementation:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "Stage 1 daily-use|generates the Stage 1 daily-use"
```

Expected: pass with the five-row payload.

### Task 3: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-30-stage1-daily-use-five-row-report.md`

- [x] **Step 1: Document five-row artifact**

Update README and product plan so the Stage 1 daily-use report is described as five rows, not two rows.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "Stage 1 daily-use|generates the Stage 1 daily-use"
npm run stage1:daily
npm run stage1:daily:validate
npm run test:python
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 3: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-06-30-stage1-daily-use-five-row-report.md services/quant_core/quant_core/stage1_daily_use.py services/quant_core/tests/test_quant_core.py apps/web/src/lib/terminal-api.test.ts
git commit -m "feat: expand stage1 daily use report"
```
