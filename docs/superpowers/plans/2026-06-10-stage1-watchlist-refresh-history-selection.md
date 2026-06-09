# Stage 1 Watchlist Refresh History Selection

## Goal

Let Market workspace users inspect any recent watchlist cache refresh run, not only the latest run, before opening a refreshed/skipped/failed symbol in the Research workspace.

## Scope

- Add a frontend workbench helper that resolves the selected watchlist refresh run from persisted history.
- Mark the selected history row in the compact Market data health panel.
- Let history rows switch the item detail list to that run.
- Keep the feature inside Stage 1 data preparation. It must not create research runs, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add model tests for selected history rows and run selection fallback.
- [x] GREEN: Implement the selection helper and selected history row state.
- [x] GREEN: Wire Market history rows to switch the displayed run details.
- [x] DOCS: Update product and architecture docs.
- [x] VERIFY: Run targeted tests, broader frontend/backend tests, production build, Docker deploy, browser smoke, and diff checks.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "watchlist cache refresh"
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web run build
docker compose up --build -d
```
