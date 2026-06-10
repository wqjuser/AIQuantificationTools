# Stage 1 Refresh Item Timeframe Selection

## Goal

When users open a selected watchlist refresh run item, the research context should switch to both the item's instrument and the item's timeframe, so the selected refresh evidence remains aligned with Research readiness.

## Scope

- Add the refresh item's timeframe to Market refresh detail rows.
- Clicking a refresh item should switch the selected instrument and then switch to the row timeframe.
- Preserve existing behavior that keeps existing watchlist quote fields when the symbol is already watched.
- Keep this inside Stage 1 market/research usability; do not create research runs, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add model coverage that refresh item rows carry timeframe.
- [x] GREEN: Attach timeframe to refresh item rows.
- [x] GREEN: Wire refresh item selection to switch instrument and timeframe.
- [x] DOCS: Update product planning docs with exact context switching behavior.
- [x] VERIFY: Run targeted tests, build, Docker/browser smoke.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "watchlist cache refresh item"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts
npm --prefix apps/web run build
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
docker compose up --build -d
```

## Progress

- 2026-06-10: Added RED coverage that watchlist refresh item rows expose the item's timeframe.
- 2026-06-10: Refresh item rows now carry timeframe, display it in Market details, and selecting a detail row switches both instrument and timeframe in one Stage 1 context update.
- 2026-06-10: Verified targeted frontend coverage, full terminal API/workbench tests, backend unittest suite, production build, Docker rebuild, and browser smoke from a 5m URL to a 1d refresh item selection.
- 2026-06-10: Shipped in `60f2128` and pushed to `origin/codex/p0-product-workspaces` through the configured proxy.
