# Stage 1 Golden Path Refresh Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Golden Path market-data status account for recent watchlist cache refresh evidence, matching the Stage 1 research readiness checklist.

**Architecture:** Keep Golden Path as the backend source of task/runbook truth. Pass recent watchlist cache refresh runs from the local API into `build_golden_path_status`, derive a review state only when fresh cache lacks matching trusted refresh evidence, and translate the resulting copy in the React UI. Preserve existing direct-call behavior when refresh runs are not supplied.

**Tech Stack:** Python local core (`services/quant_core`), React/TypeScript frontend, Vitest, Python unittest, Docker Compose.

---

### Task 1: Backend Golden Path Refresh Evidence

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `services/quant_core/quant_core/golden_path.py`
- Modify: `services/quant_core/quant_core/api.py`

- [x] **Step 1: Write failing backend tests**

Add coverage near the existing Golden Path tests:

```python
def test_golden_path_status_marks_fresh_cache_review_without_matching_refresh_evidence(self):
    from quant_core.golden_path import build_golden_path_status

    status = build_golden_path_status(
        market="ashare",
        symbol="600000",
        timeframe="1d",
        settings={
            "cache": {
                "contexts": [
                    {"market": "ashare", "symbol": "600000", "timeframe": "1d", "rowCount": 500, "freshness": "fresh"}
                ]
            },
            "safety": {"liveTradingAllowed": False},
        },
        runs=[],
        paper_executions=[],
        watchlist_refreshes=[],
    )

    expected = (
        "500 fresh cached K-line rows are available, but no matching watchlist cache refresh evidence covers "
        "ASHARE · 600000 · 1d. Refresh watchlist cache before audited research."
    )
    self.assertEqual(status["status"], "review")
    self.assertEqual(status["currentStepId"], "market-data")
    self.assertEqual(status["nextAction"]["id"], "refresh-data")
    self.assertEqual(status["steps"][0]["detail"], expected)
```

- [x] **Step 2: Run backend tests to verify red**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_marks_fresh_cache_review_without_matching_refresh_evidence
```

Expected: fail because `build_golden_path_status` does not accept `watchlist_refreshes`.

- [x] **Step 3: Implement minimal backend derivation**

Update `build_golden_path_status` to accept `watchlist_refreshes: list[Any] | None = None`, match refresh items by market/symbol/timeframe, and return a market-data review step when fresh cache lacks trusted refresh evidence. A trusted item must have status `refreshed`, complete quality, no warnings, and source not equal to `unknown` or `demo-fallback`.

- [x] **Step 4: Pass recent refresh runs in the API**

In `/api/golden-path/status`, call `self.watchlist_cache_refresh_store.list_recent(limit=10)` and pass that list to `build_golden_path_status`.

### Task 2: Frontend Translation Guard

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add frontend guard expectations**

Extend the existing Golden Path cache guidance test to require the new English fragments and Chinese translations:

```js
expect(appSource).toContain("no matching watchlist cache refresh evidence covers");
expect(appSource).toContain("matching watchlist cache refresh evidence");
expect(appSource).toContain("还没有匹配的自选刷新证据");
expect(appSource).toContain("自选刷新证据");
```

- [x] **Step 2: Add translation patterns**

In `translateGoldenPathDetail`, translate:

- `(\d+) fresh cached K-line rows are available, but no matching watchlist cache refresh evidence covers (.+). Refresh watchlist cache before audited research.`
- `(\d+) fresh cached K-line rows are available. Matching watchlist cache refresh evidence (.+) confirms (\d+) rows from (.+).`

### Task 3: Documentation, Verification, Ship

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-10-stage1-golden-path-refresh-evidence.md`

- [x] **Step 1: Update product plan**

Add a Stage 1 note that Golden Path now uses recent watchlist refresh evidence to decide whether fresh cache is fully ready or still requires review.

- [x] **Step 2: Verify**

Run:

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_marks_fresh_cache_review_without_matching_refresh_evidence tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_passes_with_matching_refresh_evidence
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "golden path cache readiness"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

- [x] **Step 3: Commit and push**

Use:

```powershell
git commit -m "feat: surface golden path refresh evidence"
$env:HTTP_PROXY='http://127.0.0.1:7890'; $env:HTTPS_PROXY='http://127.0.0.1:7890'; git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

## Progress

- 2026-06-10: Added backend RED coverage for missing and matching watchlist refresh evidence in Golden Path market-data status.
- 2026-06-10: Confirmed RED failure on the new `watchlist_refreshes` argument before implementation.
- 2026-06-10: Implemented refresh evidence matching for fresh cache, with review when evidence is missing or untrusted and passed status when evidence is complete.
- 2026-06-10: Wired `/api/golden-path/status` to pass the latest watchlist cache refresh runs into Golden Path and added API coverage.
- 2026-06-10: Added frontend translation guard coverage and Chinese translations for missing, ready, and review refresh-evidence details.
- 2026-06-10: Updated the product plan to describe Golden Path refresh-evidence semantics.
- 2026-06-10: Verified Golden Path tests, related frontend suites, production build, full repository tests, Docker rebuild, Docker smoke, browser smoke, and container Golden Path API detail for `cache-refresh-f10efd7401b7`.
- 2026-06-10: Marked this Stage 1 slice shipped after commit and proxy push preparation.
