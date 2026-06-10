# Stage 1 Refresh Evidence Drilldown

## Goal

Let the Research readiness `Refresh evidence` row jump to the matching Market watchlist refresh run details, so users can inspect the exact refresh evidence behind the current market/symbol/timeframe without manually hunting through recent runs.

## Scope

- Add the matching watchlist refresh run id to the refresh-evidence readiness row.
- Render a compact details action for refresh evidence rows with a matched run.
- Selecting details should choose that refresh run, preserve the URL `watchlistRefreshRun` parameter, and switch to the Market workspace where the run details already exist.
- Keep the refresh/fix action unchanged: missing or review evidence still uses watchlist cache refresh.
- Keep this inside Stage 1 market/research usability; do not add strategy, AI, portfolio, paper trading, or live trading behavior.

## Tasks

- [x] RED: Add model coverage for refresh evidence run ids.
- [x] GREEN: Attach refresh evidence run ids in the workbench model.
- [x] GREEN: Wire the Research panel details action to Market refresh run selection.
- [x] DOCS: Update product planning docs with drilldown behavior.
- [x] VERIFY: Run targeted tests, build, Docker/browser smoke.
- [ ] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "refresh evidence"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
docker compose up --build -d
```

## Progress

- 2026-06-10: Targeted refresh evidence model coverage passes and readiness rows now carry the matched watchlist refresh run id.
- 2026-06-10: Research readiness renders a compact details action for matched refresh evidence and routes it to the Market workspace selected refresh run.
- 2026-06-10: Verified frontend model/API tests, quant core unittest, production build, Docker rebuild, and browser smoke. Browser smoke opened `workspace=research&market=ashare&symbol=600000&timeframe=1d`, found one `查看明细` action, clicked it, and landed on `workspace=market&watchlistRefreshRun=cache-refresh-f10efd7401b7` with selected run details and no console errors.
