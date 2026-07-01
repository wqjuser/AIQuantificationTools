# Stage 1 Bootstrap Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an offline Stage 1 bootstrap preflight that tells a personal or small-team operator whether the local environment has the required scripts and manifest evidence for daily paper-only use.

**Architecture:** Build a new `quant_core.stage1_bootstrap_preflight` module that composes existing status loaders for P0 acceptance, P1 acceptance, desktop release, and Stage 1 daily-use. Add a thin CLI wrapper that writes or validates `data/stage1-bootstrap-preflight.json`, plus root npm scripts for local operators. The preflight never runs Docker, builds desktop artifacts, writes audit events, connects brokers, or changes live-trading flags.

**Tech Stack:** Python stdlib, existing `quant_core` manifest validators/status loaders, unittest contract tests, npm package scripts.

---

### Task 1: Backend Preflight Builder And Validator

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Create: `services/quant_core/quant_core/stage1_bootstrap_preflight.py`

- [x] **Step 1: Add failing preflight tests**

Add tests to `QuantCoreContractTest`:

```python
def test_stage1_bootstrap_preflight_marks_ready_when_scripts_and_manifests_are_ready(self):
    import json

    from quant_core.stage1_bootstrap_preflight import (
        build_stage1_bootstrap_preflight,
        validate_stage1_bootstrap_preflight,
    )

    with tempfile.TemporaryDirectory() as tmp:
        project_root = Path(tmp)
        data_dir = project_root / "data"
        data_dir.mkdir()
        (data_dir / "p0-acceptance.json").write_text(json.dumps(self._sample_p0_acceptance_manifest()), encoding="utf-8")
        (data_dir / "p1-acceptance.json").write_text(json.dumps(self._sample_p1_acceptance_manifest()), encoding="utf-8")
        (data_dir / "desktop-release.json").write_text(json.dumps(self._sample_desktop_release_manifest()), encoding="utf-8")
        package_json = {
            "scripts": {
                "stage1:daily": "node tools/run_python.mjs tools/stage1_daily_use.py --output data/stage1-daily-use.json",
                "stage1:daily:validate": "node tools/run_python.mjs tools/stage1_daily_use.py --validate data/stage1-daily-use.json",
                "desktop:release": "node tools/run_python.mjs tools/record_desktop_release.py",
                "desktop:release:record": "node tools/run_python.mjs tools/record_desktop_release.py --record-only",
                "docker:smoke:p0:validate": "node tools/run_python.mjs tools/docker_smoke.py --validate-p0-acceptance-report data/p0-acceptance.json",
                "docker:smoke:p1:validate": "node tools/run_python.mjs tools/docker_smoke.py --validate-p1-acceptance-report data/p1-acceptance.json",
            }
        }
        (project_root / "package.json").write_text(json.dumps(package_json), encoding="utf-8")
        from quant_core.stage1_daily_use import write_stage1_daily_use_report
        write_stage1_daily_use_report(project_root=project_root, output_path=data_dir / "stage1-daily-use.json")

        preflight = build_stage1_bootstrap_preflight(project_root=project_root, generated_at="2026-07-02T10:00:00+00:00")

    self.assertEqual(preflight["status"], "ready")
    self.assertEqual(preflight["nextAction"], "open-daily-workbench")
    self.assertEqual(preflight["recommendedCommand"], "npm run dev")
    self.assertEqual(preflight["readyCount"], preflight["totalCount"])
    self.assertEqual([check["id"] for check in preflight["checks"]], [
        "package-scripts",
        "p0-acceptance",
        "p1-acceptance",
        "desktop-release",
        "stage1-daily-use",
        "live-blocked-boundary",
    ])
    self.assertFalse(preflight["liveTradingAllowed"])
    self.assertTrue(preflight["liveBlockedBoundary"])
    self.assertIn("stage1 bootstrap preflight status=ready", validate_stage1_bootstrap_preflight(preflight))
```

Add a second test with only `package.json` present and no manifests. Assert status is `blocked`, first blocker is `p0-acceptance`, `nextAction` is `run-p0-acceptance`, `recommendedCommand` is `npm run docker:smoke:p0 -- --no-build --down`, and live trading remains false.

- [x] **Step 2: Run RED tests**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight
```

Expected: fail because `quant_core.stage1_bootstrap_preflight` does not exist.

- [x] **Step 3: Implement builder and validator**

Create `stage1_bootstrap_preflight.py` with:

```python
DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH = Path("data") / "stage1-bootstrap-preflight.json"
STAGE1_BOOTSTRAP_PREFLIGHT_CHECK_IDS = [
    "package-scripts",
    "p0-acceptance",
    "p1-acceptance",
    "desktop-release",
    "stage1-daily-use",
    "live-blocked-boundary",
]
```

Implement:
- `build_stage1_bootstrap_preflight(project_root: Path, generated_at: str | None = None) -> dict[str, Any]`
- `write_stage1_bootstrap_preflight(...)`
- `load_stage1_bootstrap_preflight_report(path: Path)`
- `validate_stage1_bootstrap_preflight(preflight: Any) -> str`

Status rules:
- `package-scripts` is `ready` only when required scripts exist.
- P0/P1/desktop checks are `ready` when their existing status loaders return `passed`; missing is `blocked`; invalid is `blocked`.
- `stage1-daily-use` is `ready` when report status is `ready`; `review` when report status is `review` or `missing`; `blocked` when invalid/blocked.
- `live-blocked-boundary` is `ready` only when every source status/report keeps `liveTradingAllowed=False` and `liveBlockedBoundary=True`.
- Overall is `blocked` if any check is blocked, else `review` if any check is review, else `ready`.
- First non-ready check determines `nextAction` and `recommendedCommand`.

### Task 2: CLI, Package Scripts, And Docs

**Files:**
- Create: `tools/stage1_bootstrap_preflight.py`
- Modify: `package.json`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Add package script failing assertion**

Extend `test_package_exposes_p2_chain_and_upstream_validators`:

```python
self.assertEqual(
    scripts["stage1:preflight"],
    f"{python_launcher} tools/stage1_bootstrap_preflight.py --output data/stage1-bootstrap-preflight.json",
)
self.assertEqual(
    scripts["stage1:preflight:validate"],
    f"{python_launcher} tools/stage1_bootstrap_preflight.py --validate data/stage1-bootstrap-preflight.json",
)
```

- [x] **Step 2: Create CLI wrapper**

Add `tools/stage1_bootstrap_preflight.py` with the same import-path pattern as `tools/stage1_daily_use.py`. It supports:
- `--project-root`
- `--output`
- `--validate`
- `--print-json`

Write mode prints:

```text
stage1 bootstrap preflight status=<status> ready=<ready>/<total> next=<nextAction> output=<path>
```

Validate mode prints:

```text
stage1 bootstrap preflight status=<status> ready=<ready>/<total> next=<nextAction> input=<path>
```

- [x] **Step 3: Add root scripts**

Add to `package.json`:

```json
"stage1:preflight": "node tools/run_python.mjs tools/stage1_bootstrap_preflight.py --output data/stage1-bootstrap-preflight.json",
"stage1:preflight:validate": "node tools/run_python.mjs tools/stage1_bootstrap_preflight.py --validate data/stage1-bootstrap-preflight.json"
```

- [x] **Step 4: Document operator workflow**

Update README and product plan to describe the new offline preflight. Make clear it checks scripts and existing manifests only; it does not run Docker, build desktop, write audit events, connect brokers, or submit orders.

### Task 3: Verification And Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-07-02-stage1-bootstrap-preflight.md`

- [x] **Step 1: Run verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_bootstrap_preflight
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k package_exposes_p2_chain_and_upstream_validators
npm run stage1:preflight
npm run stage1:preflight:validate
npm run test:python
npm run test --workspace @aiqt/web -- --run
npm run build
```

- [x] **Step 2: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-07-02-stage1-bootstrap-preflight.md package.json services/quant_core/quant_core/stage1_bootstrap_preflight.py services/quant_core/tests/test_quant_core.py tools/stage1_bootstrap_preflight.py
git commit -m "feat: add stage1 bootstrap preflight"
```
