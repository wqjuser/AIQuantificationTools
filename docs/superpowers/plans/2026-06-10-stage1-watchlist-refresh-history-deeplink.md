# Stage 1 Watchlist Refresh History Deep Link

## Goal

Make a selected Market watchlist cache refresh run restorable from the URL so recent refresh evidence can be shared, bookmarked, or reopened after a page reload.

## Scope

- Parse a `watchlistRefreshRun` query parameter into a safe refresh run id.
- Update the URL when the user selects a recent watchlist refresh history row or creates a new refresh run.
- Restore the selected refresh run after reload while keeping the existing latest-run fallback.
- Keep this inside Stage 1 market data preparation. It must not create research runs, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add model tests for refresh run URL parsing and unsafe-value rejection.
- [x] GREEN: Implement the pure URL parsing helper.
- [x] GREEN: Wire Market history selection and new refresh runs to URL state.
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
