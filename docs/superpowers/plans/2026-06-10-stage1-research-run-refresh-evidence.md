# Stage 1 Research Run Refresh Evidence

## Goal

When an audited research run is created from a context that has matching watchlist cache refresh evidence, the run should lock that refresh evidence into `researchRun.dataSnapshot.preparationEvidence` so later Backtest, AI Review, Audit export, and Paper-only handoff can trace which data-preparation run covered the selected market/symbol/timeframe.

## Scope

- Accept an optional `watchlistRefreshRunId` on `/api/research/run`.
- Resolve it only when the stored watchlist refresh item matches the selected market, symbol, and timeframe.
- Attach a compact preparation evidence object to the research run data snapshot.
- Send the selected matching refresh run id from the React pipeline request.
- Preserve existing behavior when no matching refresh evidence exists.
- Keep this inside Stage 1 market/research audit evidence; do not create AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add backend/API and frontend parsing coverage for research run preparation evidence.
- [x] GREEN: Attach matching refresh evidence to research run snapshots.
- [x] GREEN: Pass selected refresh run id from the web research pipeline.
- [x] DOCS: Update product planning and architecture docs.
- [x] VERIFY: Run targeted tests, full relevant suites, build, Docker/browser smoke.
- [ ] SHIP: Commit and push through proxy.

## Verification

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
docker compose up --build -d
```

## Progress

- 2026-06-10: Planned the Stage 1 audit-evidence lock-in for watchlist refresh runs.
- 2026-06-10: Added failing backend/API coverage, then locked matching watchlist refresh evidence into `researchRun.dataSnapshot.preparationEvidence` and passed the selected coverage run id from the web pipeline.
- 2026-06-10: Updated product planning and architecture notes to describe the new Stage 1 preparation-evidence boundary.
- 2026-06-10: Verified backend and frontend targeted tests, full API/workbench suites, quant-core unittest suite, production build, Docker rebuild, browser page smoke, and a container API run whose detail locked `cache-refresh-f10efd7401b7` as `watchlist_cache_refresh` evidence.
