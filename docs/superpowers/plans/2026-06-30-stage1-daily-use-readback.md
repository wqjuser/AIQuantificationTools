# Stage 1 Daily Use Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Expose the Stage 1 daily-use CLI report through the local core API and feed that readback into the first-screen daily-use closure.

**Architecture:** Move the report contract from the tool script into a reusable `quant_core.stage1_daily_use` module, keeping `tools/stage1_daily_use.py` as the command wrapper. Add `GET /api/stage1/daily-use/latest`, a TypeScript loader, and a small workbench summary that lets the existing five-row daily-use card show the local report state without triggering smoke tests, desktop builds, audit writes, broker connections, or order submission.

**Tech Stack:** Python 3.12 standard library, `http.server` API handler, existing unittest contract tests, TypeScript/Vitest frontend contract tests, React state wiring.

---

### Task 1: Backend Contract and API Tests

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Create later: `services/quant_core/quant_core/stage1_daily_use.py`
- Modify later: `tools/stage1_daily_use.py`
- Modify later: `services/quant_core/quant_core/api.py`

- [x] **Step 1: Add API endpoint test**

Add a test near existing P0/P1/desktop latest endpoint tests:

```python
def test_stage1_daily_use_latest_api_returns_validated_report(self):
    import json
    from http.client import HTTPConnection
    from http.server import HTTPServer
    from threading import Thread

    from quant_core.api import QuantApiHandler
    from quant_core.stage1_daily_use import write_stage1_daily_use_report

    with tempfile.TemporaryDirectory() as tmp:
        project_root = Path(tmp)
        data_dir = project_root / "data"
        data_dir.mkdir()
        (data_dir / "p0-acceptance.json").write_text(json.dumps(self._sample_p0_acceptance_manifest()), encoding="utf-8")
        (data_dir / "p1-acceptance.json").write_text(json.dumps(self._sample_p1_acceptance_manifest()), encoding="utf-8")
        (data_dir / "desktop-release.json").write_text(json.dumps(self._sample_desktop_release_manifest()), encoding="utf-8")
        report_path = data_dir / "stage1-daily-use.json"
        write_stage1_daily_use_report(project_root=project_root, output_path=report_path, generated_at="2026-06-30T10:00:00+00:00")

        class TestHandler(QuantApiHandler):
            stage1_daily_use_report_path = report_path

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
        try:
            connection.request("GET", "/api/stage1/daily-use/latest")
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

    self.assertEqual(response.status, 200)
    self.assertEqual(payload["dailyUse"]["kind"], "aiqt.stage1DailyUseReport")
    self.assertEqual(payload["dailyUse"]["status"], "ready")
    self.assertEqual(payload["dailyUse"]["readyCount"], 2)
    self.assertFalse(payload["dailyUse"]["liveTradingAllowed"])
```

- [x] **Step 2: Run RED backend test**

Run:

```bash
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use_latest_api
```

Expected: fail because `quant_core.stage1_daily_use` and the endpoint do not exist.

### Task 2: Frontend Loader and Layout Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify later: `apps/web/src/lib/terminal-api.ts`
- Modify later: `apps/web/src/App.tsx`

- [x] **Step 1: Add loader tests**

Add imports for `buildStage1DailyUseLatestUrl` and `loadStage1DailyUseLatest`, then test the happy path and malformed fallback. The successful payload must include `paperOnly=true`, `liveTradingAllowed=false`, `liveBlockedBoundary=true`, `readyCount=2`, and row ids `clean-open` and `desktop-release`.

- [x] **Step 2: Add layout wiring test**

Extend the Stage 1 daily-use layout test to assert:

```javascript
expect(appSource).toContain("loadStage1DailyUseLatest");
expect(appSource).toContain("const [stage1DailyUseLatestState, setStage1DailyUseLatestState]");
expect(appSource).toContain("setStage1DailyUseLatestState(await loadStage1DailyUseLatest(quantCoreBaseUrl));");
expect(appSource).toContain("buildStage1DailyUseSummary(stage1DailyUseLatestState.dailyUse)");
expect(appSource).toContain("dailyUseReport: stage1DailyUseSummary");
```

- [x] **Step 3: Run RED frontend tests**

Run:

```bash
npm run test --workspace @aiqt/web -- --run apps/web/src/lib/terminal-api.test.ts -t "Stage 1 daily-use"
npm run test --workspace @aiqt/web -- --run apps/web/src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: fail because frontend loader and wiring do not exist.

### Task 3: Implementation

**Files:**
- Create: `services/quant_core/quant_core/stage1_daily_use.py`
- Modify: `tools/stage1_daily_use.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `apps/web/src/lib/terminal-api.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Create reusable Python contract module**

Move the report functions and constants from `tools/stage1_daily_use.py` into `quant_core.stage1_daily_use`, and add:

```python
def load_stage1_daily_use_status(path: Path = DEFAULT_STAGE1_DAILY_USE_REPORT_PATH) -> dict[str, Any]:
    try:
        return load_stage1_daily_use_report(path)
    except FileNotFoundError as error:
        return _missing_report_status(path, str(error))
    except ValueError as error:
        return _invalid_report_status(path, str(error))
```

Missing/invalid status still uses `kind="aiqt.stage1DailyUseReport"`, `status="missing"` or `status="invalid"`, `readyCount=0`, `totalCount=2`, and keeps live trading disabled.

- [x] **Step 2: Keep CLI as wrapper**

Update `tools/stage1_daily_use.py` to import the public functions and constants from `quant_core.stage1_daily_use`. Keep CLI arguments and output text unchanged.

- [x] **Step 3: Add API endpoint**

Import `DEFAULT_STAGE1_DAILY_USE_REPORT_PATH` and `load_stage1_daily_use_status`, add `stage1_daily_use_report_path` to `QuantApiHandler`, and return:

```python
{"dailyUse": load_stage1_daily_use_status(Path(self.stage1_daily_use_report_path))}
```

for `/api/stage1/daily-use/latest`.

- [x] **Step 4: Add frontend loader and workbench summary**

Add TypeScript interfaces for the daily-use report, `buildStage1DailyUseLatestUrl`, `loadStage1DailyUseLatest`, payload guards, and fallback missing report. Add `buildStage1DailyUseSummary` plus optional `dailyUseReport` input to `buildStage1P0DailyUseClosure`; use the report status/generatedAt in closure detail while preserving the existing five-row card.

- [x] **Step 5: Wire React state**

Add `stage1DailyUseLatestState`, `refreshStage1DailyUseLatest`, `stage1DailyUseSummary`, and pass `dailyUseReport: stage1DailyUseSummary` into `buildStage1P0DailyUseClosure`. Call the refresh in the same startup refresh path as P0/P1/desktop readbacks.

### Task 4: Docs, Verification, Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`

- [x] **Step 1: Document readback**

README and product plan should mention `/api/stage1/daily-use/latest`, and state that it reads `data/stage1-daily-use.json` only.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
node tools/run_python.mjs -m unittest discover -s services/quant_core/tests -t services/quant_core -k stage1_daily_use
npm run test --workspace @aiqt/web -- --run apps/web/src/lib/terminal-api.test.ts -t "Stage 1 daily-use"
npm run test --workspace @aiqt/web -- --run apps/web/src/lib/terminal-workbench.test.ts -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run apps/web/src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run stage1:daily
npm run stage1:daily:validate
npm run test:python
npm run build
```

- [x] **Step 3: Commit**

Run:

```bash
git add README.md docs/product-plan.md docs/superpowers/plans/2026-06-30-stage1-daily-use-readback.md services/quant_core/quant_core/stage1_daily_use.py tools/stage1_daily_use.py services/quant_core/quant_core/api.py services/quant_core/tests/test_quant_core.py apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/lib/layout-css.test.js apps/web/src/App.tsx
git commit -m "feat: add stage1 daily use readback"
```
