# Stage 1 Research Context Deep Link

## Goal

Let Stage 1 market/research URLs carry the selected market, symbol, and timeframe so a copied link can restore the same research context without relying only on local saved workspace state.

## Scope

- Parse `market`, `symbol`, and `timeframe` URL parameters into a bounded research context draft.
- Treat explicit URL context as higher priority than saved local research workspace state.
- Keep URL context synchronized when users switch symbol or timeframe.
- Preserve existing `workspace`, audit, and watchlist refresh URL parameters.
- Keep the change inside Stage 1 market/research usability; do not add strategy, AI, portfolio, paper trading, or live trading behavior.

## Tasks

- [x] RED: Add frontend model coverage for parsing and applying research context URL parameters.
- [x] GREEN: Implement URL context helpers in the workbench model.
- [x] GREEN: Wire App bootstrap and URL synchronization.
- [x] DOCS: Update product planning docs with the new Stage 1 capability.
- [x] VERIFY: Run targeted tests, build, Docker/browser smoke.
- [ ] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research context URL"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
docker compose up --build -d
```

Results:

- Targeted workbench test passed after adding the URL parsing/application helpers.
- Full workbench/API frontend model tests passed: `320` tests.
- Frontend production build passed without chunk-size warnings.
- Python core unittest suite passed: `141` tests.
- Docker rebuild/restart completed for the web and API services.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=research&market=us&symbol=NVDA&timeframe=15m`: page restored `NVDA`, preserved `workspace=research`, marked the session watchlist as unsaved for the deep-linked symbol, switching to `60m` updated the URL to `timeframe=60m`, and no console errors were reported.
