# Stage 1 Refresh Evidence Readiness

## Goal

Make the Stage 1 research context checklist show whether the current market/symbol/timeframe is covered by recent watchlist cache refresh evidence, so users can tell whether the selected research context was explicitly prepared before running an audited pipeline.

## Scope

- Add an optional refresh-evidence row to the research context readiness model.
- Mark matching, complete, warning-free refresh evidence as ready.
- Mark missing, stale-by-context, failed, skipped, incomplete, warning, or demo/unknown refresh evidence as review, not a hard blocker.
- Wire the web app to pass recent watchlist refresh runs into the readiness model.
- Keep this inside Stage 1 market/research usability; do not add strategy, AI, portfolio, paper trading, or live trading behavior.

## Tasks

- [x] RED: Add frontend model coverage for refresh evidence readiness.
- [x] GREEN: Implement refresh evidence row derivation.
- [x] GREEN: Wire App readiness input to recent watchlist refresh history.
- [x] DOCS: Update product planning docs with the new Stage 1 capability.
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

Results:

- Targeted refresh evidence model tests passed: `2` tests.
- Full workbench/API frontend model tests passed: `322` tests.
- Frontend production build passed without chunk-size warnings.
- Python core unittest suite passed: `141` tests.
- Docker rebuild/restart completed for the web and API services.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=research&market=ashare&symbol=600000&timeframe=1d`: the Research readiness checklist showed `刷新证据`, matched the recent `cache-refresh-f10efd7401b7` run for `600000 · 1d`, displayed the row as ready, and reported no console errors.
