# Stage 1 Research Workspace Readiness

## Goal

Make research workspace persistence part of the Stage 1 research context checklist so users can see whether the selected market, symbol, timeframe, and entry workspace are persisted before they run an audited research pipeline.

## Scope

- Add a Stage 1 readiness row for the saved research workspace state.
- Treat an unsaved workspace state as `review`, not `blocked`, so first-time research remains possible after explicit confirmation.
- Reuse the existing `PUT /api/research/workspace-state` save action from the readiness row.
- Keep the change inside Stage 1 market/research usability; do not add strategy, AI, portfolio, paper trading, or live trading behavior.
- Update product docs after implementation.

## Tasks

- [x] RED: Add frontend model coverage for saved and unsaved workspace readiness.
- [x] GREEN: Extend the readiness model with the workspace persistence row.
- [x] GREEN: Wire the readiness action to the existing Save Workspace API path.
- [x] DOCS: Update product planning docs with the new Stage 1 capability.
- [x] VERIFY: Run targeted tests, build, Docker/browser smoke if the frontend changes are visible.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "workspace readiness"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
docker compose up --build -d
```

## Verification Notes

- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "workspace"` failed before implementation because the workspace readiness row was missing, then passed after the model change.
- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts` passed with 195 model tests.
- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts` passed with 317 frontend tests.
- `$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core` passed with 141 backend tests.
- `npm --prefix apps/web run build` passed without large chunk warnings.
- `docker compose up --build -d` rebuilt the web/API images and left the stack healthy on `http://127.0.0.1:5173/`.
- Browser smoke on `/?workspace=research` verified the checklist row shows `工作区状态`, switches to `未保存更改` after changing the timeframe to `5m`, saves from the row-level `保存工作区` action, returns to `已保存`, and console error count is 0.
- Core state after browser save was `crypto BTC/USDT 5m research`.
- Shipped to `origin/codex/p0-product-workspaces` with `HTTP_PROXY` and `HTTPS_PROXY` set to `http://127.0.0.1:7890`.
