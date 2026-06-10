# Stage 1 Research Workspace Unsaved State

## Goal

Make Stage 1 research context persistence visible by showing whether the current market, symbol, timeframe, and Stage 1 entry workspace have been saved to the local core.

## Scope

- Compare the current `ResearchWorkspaceStateDraft` with the persisted `researchWorkspaceState`.
- Apply the persisted `researchWorkspaceState` to the selected instrument and timeframe when `/api/workspace` loads.
- Show a compact saved/unsaved status on the existing Save Workspace action.
- Keep the state derived from the model rather than duplicating it in React state.
- Clear the unsaved status only when `PUT /api/research/workspace-state` succeeds and the core response updates the saved snapshot.
- Keep this inside Stage 1 market/research usability. It must not create research runs, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add model coverage for matching and mismatched saved research workspace state.
- [x] GREEN: Implement the saved-state helper.
- [x] GREEN: Wire the Save Workspace action to show saved/unsaved status.
- [x] DOCS: Update product and architecture docs.
- [x] VERIFY: Run targeted tests, broader frontend/backend tests, production build, Docker deploy, browser smoke, and diff checks.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research workspace"
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web run build
docker compose up --build -d
```

## Verification Notes

- `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "research workspace"` passed with 4 matching tests.
- `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts` passed with 316 frontend tests.
- `$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core` passed with 141 backend tests.
- `npm --prefix apps/web run build` passed without large chunk warnings.
- `docker compose up --build -d` rebuilt and left `api` and `web` healthy on `http://127.0.0.1:5173/`.
- Browser smoke on `/?workspace=research` verified that saved `researchWorkspaceState` restores `BTC/USDT · 5m`, the Save Workspace action starts as `保存工作区/已保存`, switching to `1d` changes it to `保存工作区变更/未保存`, saving restores `保存工作区/已保存`, and console error count was 0.
- Browser layout measurement found and fixed an overlap where the Save Workspace button sat under the watchlist ticker column; after the CSS fix, the button rect no longer overlaps ticker rects.
- Core state after browser save was `crypto BTC/USDT 1d research`.
- `git diff --check` passed.
- Shipped to `origin/codex/p0-product-workspaces` with `HTTP_PROXY` and `HTTPS_PROXY` set to `http://127.0.0.1:7890`.
