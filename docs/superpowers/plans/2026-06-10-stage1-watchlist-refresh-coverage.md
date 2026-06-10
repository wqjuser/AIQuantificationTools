# Stage 1 Watchlist Refresh Coverage

## Goal

Make the Market workspace explain whether the selected watchlist refresh run actually covers the current research context, then provide a direct path back to Research when it does.

## Scope

- Add a compact coverage summary derived from the selected watchlist refresh run and current market/symbol/timeframe.
- Mark matching, complete, warning-free refreshed evidence as ready.
- Mark matching but skipped/failed/incomplete/warning/demo evidence as review.
- Mark selected runs that do not include the current context as review with a clear mismatch detail.
- Add a Market panel action that returns to the Research workspace only when the selected run covers the current context.
- Keep this inside Stage 1 market/research usability; do not create research runs, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add model coverage for selected refresh run context coverage.
- [x] GREEN: Implement coverage derivation in the workbench model.
- [x] GREEN: Render the Market coverage card and return-to-Research action.
- [x] DOCS: Update product planning docs with coverage behavior.
- [x] VERIFY: Run targeted tests, build, Docker/browser smoke.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "watchlist refresh"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
docker compose up --build -d
```

## Progress

- 2026-06-10: Added RED model tests for selected watchlist refresh coverage ready/mismatch states.
- 2026-06-10: Implemented `buildWatchlistCacheRefreshCoverageRow` and rendered a compact Market coverage card with a return-to-Research action for matching context evidence.
- 2026-06-10: Verified frontend model/API tests, quant core unittest, production build, Docker rebuild, and browser smoke. Browser smoke opened `workspace=market&market=ashare&symbol=600000&timeframe=1d&watchlistRefreshRun=cache-refresh-f10efd7401b7`, confirmed the coverage card and `回到研究` action, clicked it, and landed on `workspace=research` with the same context and no console errors.
- 2026-06-10: Shipped through proxy `127.0.0.1:7890` as commit `f42de9d`.
