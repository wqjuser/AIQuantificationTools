# Stage 1 Daily Use CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a local Stage 1 daily-use report command that summarizes whether the current P0/P1 acceptance evidence and desktop release evidence are usable for personal and small-team daily startup.

**Architecture:** Create a focused `tools/stage1_daily_use.py` CLI that reads existing validated status helpers from `quant_core.p0_acceptance`, `quant_core.p1_acceptance`, and `quant_core.desktop_release`. The tool writes `data/stage1-daily-use.json`, validates the output, and never runs pipelines, writes audit events, connects brokers, or changes the live-trading boundary.

**Tech Stack:** Python 3.12 standard library, existing `quant_core` validators, npm scripts through `tools/run_python.mjs`, unittest coverage in `services/quant_core/tests/test_quant_core.py`.

---

### Task 1: Report Contract Tests

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Create later: `tools/stage1_daily_use.py`

- [x] **Step 1: Add module loader and report tests**

Add `_load_stage1_daily_use_module()` beside the existing tool loaders, then add tests near the desktop release tests:

```python
def test_stage1_daily_use_report_reads_acceptance_and_desktop_manifests(self):
    reporter = self._load_stage1_daily_use_module()
    with tempfile.TemporaryDirectory() as tmp:
        project_root = Path(tmp)
        data_dir = project_root / "data"
        data_dir.mkdir()
        (data_dir / "p0-acceptance.json").write_text(json.dumps(self._sample_p0_acceptance_manifest()), encoding="utf-8")
        (data_dir / "p1-acceptance.json").write_text(json.dumps(self._sample_p1_acceptance_manifest()), encoding="utf-8")
        (data_dir / "desktop-release.json").write_text(json.dumps(self._sample_desktop_release_manifest()), encoding="utf-8")
        output_path = data_dir / "stage1-daily-use.json"

        report = reporter.write_stage1_daily_use_report(
            project_root=project_root,
            output_path=output_path,
            generated_at="2026-06-30T10:00:00+00:00",
        )
        reloaded = reporter.load_stage1_daily_use_report(output_path)

    self.assertEqual(report["status"], "ready")
    self.assertEqual(reloaded["readyCount"], 2)
```

- [x] **Step 2: Add blocked/review validation tests**

Cover missing P0 as `blocked`, missing desktop release as `review`, and live-enabled output rejection:

```python
def test_stage1_daily_use_report_flags_missing_p0_as_blocked(self):
    reporter = self._load_stage1_daily_use_module()
    with tempfile.TemporaryDirectory() as tmp:
        project_root = Path(tmp)
        (project_root / "data").mkdir()
        report = reporter.build_stage1_daily_use_report(project_root=project_root, generated_at="2026-06-30T10:00:00+00:00")
    self.assertEqual(report["status"], "blocked")
    self.assertEqual(report["rows"][0]["status"], "blocked")

def test_stage1_daily_use_report_flags_missing_desktop_as_review(self):
    reporter = self._load_stage1_daily_use_module()
    with tempfile.TemporaryDirectory() as tmp:
        project_root = Path(tmp)
        data_dir = project_root / "data"
        data_dir.mkdir()
        (data_dir / "p0-acceptance.json").write_text(json.dumps(self._sample_p0_acceptance_manifest()), encoding="utf-8")
        (data_dir / "p1-acceptance.json").write_text(json.dumps(self._sample_p1_acceptance_manifest()), encoding="utf-8")
        report = reporter.build_stage1_daily_use_report(project_root=project_root, generated_at="2026-06-30T10:00:00+00:00")
    self.assertEqual(report["status"], "review")
    self.assertEqual(report["rows"][1]["status"], "review")

def test_stage1_daily_use_validate_rejects_live_enabled_report(self):
    reporter = self._load_stage1_daily_use_module()
    report = reporter.build_stage1_daily_use_report(project_root=Path(tempfile.mkdtemp()), generated_at="2026-06-30T10:00:00+00:00")
    report["liveTradingAllowed"] = True
    with self.assertRaisesRegex(ValueError, "live trading"):
        reporter.validate_stage1_daily_use_report(report)
```

- [x] **Step 3: Run RED tests**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
```

Expected: fail because `tools/stage1_daily_use.py` does not exist or lacks the requested functions.

### Task 2: CLI Implementation

**Files:**
- Create: `tools/stage1_daily_use.py`

- [x] **Step 1: Implement report builder**

Create the tool with these public functions:

```python
def build_stage1_daily_use_report(*, project_root: Path, p0_path: Path | None = None, p1_path: Path | None = None, desktop_path: Path | None = None, generated_at: str | None = None) -> dict:
    ...

def validate_stage1_daily_use_report(report: Any) -> str:
    ...

def write_stage1_daily_use_report(*, project_root: Path, output_path: Path, generated_at: str | None = None) -> dict:
    ...

def load_stage1_daily_use_report(path: Path) -> dict:
    ...
```

Rules:
- `clean-open` row is `blocked` unless P0 is passed and live-blocked; it is `review` if P1 is missing/invalid.
- `desktop-release` row is `ready` only when the desktop manifest is passed; missing is `review`; invalid is `blocked`.
- Overall status is `blocked` if any row is blocked, then `review` if any row is review, otherwise `ready`.
- The report must enforce `paperOnly=true`, `liveTradingAllowed=false`, and `liveBlockedBoundary=true`.

- [x] **Step 2: Implement CLI arguments**

Support:

```bash
node tools/run_python.mjs tools/stage1_daily_use.py --output data/stage1-daily-use.json
node tools/run_python.mjs tools/stage1_daily_use.py --validate data/stage1-daily-use.json
```

Also support `--project-root`, `--p0-acceptance`, `--p1-acceptance`, `--desktop-release`, and `--print-json`.

- [x] **Step 3: Run GREEN tests**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
```

Expected: all Stage 1 daily-use tests pass.

### Task 3: Scripts and Docs

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Add package scripts**

Add:

```json
"stage1:daily": "node tools/run_python.mjs tools/stage1_daily_use.py --output data/stage1-daily-use.json",
"stage1:daily:validate": "node tools/run_python.mjs tools/stage1_daily_use.py --validate data/stage1-daily-use.json"
```

Update package script assertions to check these exact values.

- [x] **Step 2: Document daily startup**

README should show:

```powershell
npm run stage1:daily
npm run stage1:daily:validate
```

`docs/product-plan.md` should record that the daily-use report is a local aggregation/readback only and does not run smoke tests, build desktop packages, submit orders, or change live-trading state.

### Task 4: Verification and Commit

**Files:**
- All changed files

- [x] **Step 1: Run focused verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k package_exposes
npm run stage1:daily
npm run stage1:daily:validate
```

- [x] **Step 2: Run regression verification**

Run:

```bash
npm run test:python
```

- [x] **Step 3: Commit**

Run:

```bash
git add package.json README.md docs/product-plan.md docs/superpowers/plans/2026-06-30-stage1-daily-use-cli.md services/quant_core/tests/test_quant_core.py tools/stage1_daily_use.py
git commit -m "feat: add stage1 daily use cli"
```
