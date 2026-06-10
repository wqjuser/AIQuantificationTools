# Stage 1 Refresh Evidence Action

## Goal

Make the Research readiness `Refresh evidence` row run the same watchlist cache refresh workflow that creates refresh evidence, instead of using the single-symbol cache refresh path that cannot satisfy the row's own evidence contract.

## Scope

- Add a distinct readiness action for watchlist refresh evidence.
- Keep K-line/cache rows on the current single-symbol cache refresh action.
- Wire the Research readiness panel to the existing watchlist cache refresh handler.
- Localize the new action label and disabled state.
- Keep this inside Stage 1 market/research usability; do not add strategy, AI, portfolio, paper trading, or live trading behavior.

## Tasks

- [x] RED: Update model coverage so refresh evidence rows request the watchlist refresh action.
- [x] GREEN: Add the new readiness action and App wiring.
- [x] DOCS: Update product planning docs with the action semantics.
- [x] VERIFY: Run targeted tests, build, Docker/browser smoke.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "refresh evidence"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
docker compose up --build -d
```

Results:

- Targeted refresh evidence tests passed: `2` tests.
- Full workbench/API frontend model tests passed: `322` tests.
- Frontend production build passed without chunk-size warnings.
- Python core unittest suite passed: `141` tests.
- Docker rebuild/restart completed for the web and API services.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=research&market=us&symbol=NVDA&timeframe=15m`: the missing `刷新证据` row displayed the `刷新自选缓存` action, did not show the single-symbol `刷新缓存` action for that row, and reported no console errors.
- Shipped through proxy to `origin/codex/p0-product-workspaces` as `a1e4fc2`.
