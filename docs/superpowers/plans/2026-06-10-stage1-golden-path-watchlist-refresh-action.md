# Stage 1 Golden Path Watchlist Refresh Action

**Goal:** When Golden Path sees fresh cached K-line rows but missing or untrusted watchlist refresh evidence, its next action should refresh the watchlist cache run that can create that evidence.

**Scope:**
- Keep missing, empty, and stale K-line cache states on the existing single-symbol `refresh-data` action.
- Route only the fresh-cache refresh-evidence review state to `refresh-watchlist-cache`.
- Reuse the existing Market workspace watchlist refresh workflow; do not add strategy, AI, portfolio, paper, or live trading behavior.

**Plan:**
- [x] RED: Update backend Golden Path coverage so missing refresh evidence expects `refresh-watchlist-cache`.
- [x] GREEN: Add the backend action mapping and market-data step action selection.
- [x] RED: Add frontend source coverage that Golden Path can run and disable the watchlist refresh action.
- [x] GREEN: Wire the Golden Path action to the existing `refreshWatchlistMarketCache` handler and Chinese labels.
- [x] DOCS: Update the product plan to distinguish single-symbol refresh from watchlist-evidence refresh.
- [x] VERIFY: Run focused backend/frontend tests, build, full tests, Docker smoke, browser smoke, commit, and proxy push.

**Verification Commands:**
```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_marks_fresh_cache_review_without_matching_refresh_evidence tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_points_stale_cache_to_market_refresh_before_research
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "golden path"
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

**Progress:**
- 2026-06-10: Planned the Stage 1 Golden Path action correction after refresh evidence started using watchlist cache runs.
- 2026-06-10: Confirmed backend and frontend RED failures, then routed Golden Path refresh-evidence review to the existing watchlist cache refresh workflow.
- 2026-06-10: Verified focused Golden Path tests, watchlist refresh model tests, production build, full repo tests, Docker rebuild/smoke, Audit browser smoke, and container Golden Path API status.
