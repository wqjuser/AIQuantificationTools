# Stage 1 Watchlist Unsaved State

## Goal

Make Stage 1 symbol search and watchlist persistence less ambiguous by showing when selecting a new instrument has changed the local watchlist but has not yet been saved to the local core.

## Scope

- Detect whether a selected instrument already exists in the active watchlist.
- Mark the watchlist as having unsaved changes only when a new instrument is introduced.
- Clear the unsaved marker after `PUT /api/watchlist` succeeds.
- Show a compact status beside the existing Save Watchlist action.
- Keep this inside Stage 1 market/research usability. It must not create research runs, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add model coverage for existing vs new watchlist instruments.
- [x] GREEN: Implement the watchlist membership helper.
- [x] GREEN: Wire unsaved state into symbol selection and watchlist save success.
- [x] DOCS: Update product and architecture docs.
- [x] VERIFY: Run targeted tests, broader frontend/backend tests, production build, Docker deploy, browser smoke, and diff checks.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "watchlist"
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web run build
docker compose up --build -d
```

## Verification Notes

- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "watchlist"` passed with 12 matching tests.
- `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts` passed with 313 frontend tests.
- `$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core` passed with 141 backend tests.
- `npm --prefix apps/web run build` passed without large chunk warnings.
- `docker compose up --build -d` rebuilt and left `api` and `web` healthy on `http://127.0.0.1:5173/`.
- Browser smoke on `/?workspace=market` verified: initial `保存自选/已保存`, selecting `600519` changed the action to `保存自选变更/未保存`, saving moved `600519` to the first watchlist row and restored `保存自选/已保存`; console error count was 0.
- `git diff --check` passed.
- Shipped to `origin/codex/p0-product-workspaces` with `HTTP_PROXY` and `HTTPS_PROXY` set to `http://127.0.0.1:7890`.
