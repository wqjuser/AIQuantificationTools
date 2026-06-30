# Stage 1 Daily Use Stale Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect when `data/stage1-daily-use.json` is older than its source manifests and surface that as review state in API/CLI readback.

**Architecture:** Keep the stored `aiqt.stage1DailyUseReport` schema unchanged. Add a readback projection in `quant_core.stage1_daily_use.load_stage1_daily_use_status` that compares the report file mtime with the source manifest mtimes from `sourcePaths`. If any source is newer or missing, return a copy of the report marked `review` with stale source metadata and row-level review downgrades for affected daily-use rows.

**Tech Stack:** Python report builder/readback, unittest HTTP API contract tests, CLI validate path, TypeScript API/workbench contract compatibility.

---

### Task 1: Backend Stale Readback

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/stage1_daily_use.py`
- Modify: `tools/stage1_daily_use.py`

- [x] **Step 1: Add failing stale API test**

Add a test near `test_stage1_daily_use_latest_api_returns_validated_report`:

```python
def test_stage1_daily_use_latest_marks_report_review_when_source_manifest_is_newer(self):
    import json
    import os
    from http.client import HTTPConnection
    from http.server import HTTPServer
    from threading import Thread

    from quant_core.api import QuantApiHandler
    from quant_core.stage1_daily_use import write_stage1_daily_use_report

    with tempfile.TemporaryDirectory() as tmp:
        project_root = Path(tmp)
        data_dir = project_root / "data"
        data_dir.mkdir()
        p0_path = data_dir / "p0-acceptance.json"
        p1_path = data_dir / "p1-acceptance.json"
        desktop_path = data_dir / "desktop-release.json"
        report_path = data_dir / "stage1-daily-use.json"
        p0_path.write_text(json.dumps(self._sample_p0_acceptance_manifest()), encoding="utf-8")
        p1_path.write_text(json.dumps(self._sample_p1_acceptance_manifest()), encoding="utf-8")
        desktop_path.write_text(json.dumps(self._sample_desktop_release_manifest()), encoding="utf-8")
        write_stage1_daily_use_report(project_root=project_root, output_path=report_path)
        report_time = report_path.stat().st_mtime + 120
        os.utime(p1_path, (report_time, report_time))

        class TestHandler(QuantApiHandler):
            stage1_daily_use_report_path = report_path

        # GET /api/stage1/daily-use/latest ...

    self.assertEqual(payload["dailyUse"]["status"], "review")
    self.assertIn("data/p1-acceptance.json", payload["dailyUse"]["staleSourcePaths"])
    self.assertEqual(payload["dailyUse"]["rows"][1]["status"], "review")
    self.assertEqual(payload["dailyUse"]["rows"][2]["status"], "review")
    self.assertEqual(payload["dailyUse"]["rows"][3]["status"], "review")
    self.assertFalse(payload["dailyUse"]["liveTradingAllowed"])
```

- [x] **Step 2: Run RED backend test**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use_latest_marks_report_review
```

Expected: fail because readback still returns `ready`.

- [x] **Step 3: Implement stale projection**

Add helpers in `stage1_daily_use.py`:

```python
def _project_stale_source_review(report: dict[str, Any], report_path: Path) -> dict[str, Any]:
    stale_sources = _stage1_daily_use_stale_source_paths(report, report_path)
    if not stale_sources:
        return report
    projected = copy.deepcopy(report)
    projected["status"] = "review"
    projected["summary"] = f"Stage 1 daily-use report needs refresh because source manifests changed: {', '.join(stale_sources)}."
    projected["reason"] = projected["summary"]
    projected["staleSourcePaths"] = stale_sources
    # downgrade affected rows from ready to review
```

Map stale sources to rows:
- `p0Acceptance` -> `clean-open`, `daily-start`
- `p1Acceptance` -> `clean-open`, `market-refresh-recovery`, `research-entry`, `daily-start`
- `desktopRelease` -> `desktop-release`

- [x] **Step 4: Route CLI validate through status readback**

Change `tools/stage1_daily_use.py --validate` to call `load_stage1_daily_use_status` and print the summary from `validate_stage1_daily_use_report(report)`.

### Task 2: Frontend Compatibility And Docs

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Add stale readback frontend fixture**

Add a `loadStage1DailyUseLatest` test fixture with `status: "review"`, `staleSourcePaths: ["data/p1-acceptance.json"]`, affected rows in review, and assert it is accepted without falling back.

- [x] **Step 2: Document stale behavior**

Update docs to state that readback/validate will mark the daily-use report `review` when source manifests are newer than the report.

### Task 3: Verification And Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-06-30-stage1-daily-use-stale-readback.md`

- [x] **Step 1: Run verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
npm run test --workspace @aiqt/web -- --run src/lib/terminal-api.test.ts -t "Stage 1 daily-use|stale"
npm run stage1:daily
npm run stage1:daily:validate
npm run test:python
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 2: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-06-30-stage1-daily-use-stale-readback.md services/quant_core/quant_core/stage1_daily_use.py services/quant_core/tests/test_quant_core.py tools/stage1_daily_use.py apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts
git commit -m "feat: flag stale stage1 daily use reports"
```
