# Stage 1 Watchlist Readiness

## Goal

Make watchlist persistence visible inside the Stage 1 research context checklist so users can see whether the selected symbol set has been saved before they run an audited research pipeline.

## Scope

- Add an optional Stage 1 readiness row for watchlist persistence.
- Treat unsaved watchlist changes as `review`, not `blocked`, so first-time research remains possible after explicit confirmation.
- Reuse the existing `PUT /api/watchlist` save action from the readiness row.
- Keep the change inside Stage 1 market/research usability; do not add strategy, AI, portfolio, paper trading, or live trading behavior.
- Update product docs after implementation.

## Tasks

- [x] RED: Add frontend model coverage for saved and unsaved watchlist readiness.
- [x] GREEN: Extend the readiness model with the watchlist persistence row.
- [x] GREEN: Wire the readiness action to the existing Save Watchlist API path.
- [x] DOCS: Update product planning docs with the new Stage 1 capability.
- [x] VERIFY: Run targeted tests, build, Docker/browser smoke.
- [ ] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "watchlist readiness"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
docker compose up --build -d
```

## Verification Notes

- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "watchlist persistence"` failed before implementation because the watchlist readiness row was missing, then passed after the model change.
- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts` passed with 196 model tests.
- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts` passed with 318 frontend tests.
- `npm --prefix apps/web run build` passed without large chunk warnings.
- `$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core` passed with 141 backend tests.
- `docker compose up --build -d` rebuilt the web/API images and left the stack healthy on `http://127.0.0.1:5173/`.
- Browser smoke on `/?workspace=research` verified the checklist row shows `自选状态`, starts as `已保存`, switching to `MSFT` changes it to `未保存更改` with a row-level `保存自选` action, saving from that row returns it to `已保存`, and console error count is 0.
- Core watchlist after browser save includes `MSFT` in the saved local watchlist.
