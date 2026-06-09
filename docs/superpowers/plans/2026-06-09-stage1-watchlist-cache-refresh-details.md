# Stage 1 Watchlist Cache Refresh Details

## Goal

Make each watchlist cache refresh run explain which symbols were refreshed, skipped, or failed so Market workspace data preparation is actionable instead of only summarized.

## Scope

- Add a frontend workbench row model for per-symbol watchlist refresh items.
- Show the latest run's per-symbol details inside the Market data source health panel.
- Keep the feature inside Stage 1 market data readiness; do not create research runs, AI reviews, portfolio logic, execution, or live trading behavior.

## Tasks

- [x] Write failing frontend model coverage for per-symbol refresh item rows.
- [x] Implement the compact item row builder with status, source, rows, warning/error, and tone.
- [x] Render latest refresh item rows in the Market data health panel with Chinese/English labels.
- [x] Update product and architecture docs.
- [x] Run frontend/backend tests, build, Docker/browser smoke, commit, and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "summarizes watchlist cache refresh item details"
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web run build
docker compose up --build -d
```
