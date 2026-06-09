# Stage 1 Watchlist Cache Refresh Runs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal

Turn the Market workspace watchlist cache refresh from a transient frontend loop into a local-first, traceable data-preparation run.

## Scope

- Add a Python core contract that refreshes all submitted watchlist instruments for one timeframe.
- Persist each watchlist refresh run in SQLite with run id, per-symbol status, data quality, upserted rows, and summary counts.
- Return latest settings after the refresh so the UI can update cache freshness immediately.
- Make the Market data health panel show the latest watchlist refresh run summary.

## Out Of Scope

- Research run creation.
- AI review, strategy, portfolio, execution, or live trading changes.
- Background scheduler or automatic polling.
- Full audit report export for cache refresh runs.

## Tasks

- [x] Write failing backend API contract coverage for `POST /api/cache/watchlist-refreshes` and `GET /api/cache/watchlist-refreshes`.
- [x] Write failing frontend API client coverage for `refreshWatchlistCacheRun`.
- [x] Add `WatchlistCacheRefreshRunStore`, run/item payloads, and summary generation.
- [x] Wire the backend POST route to fetch K-lines, upsert complete data, record skipped/failed rows, and return settings.
- [x] Wire the backend GET route to list recent watchlist refresh runs.
- [x] Add frontend API types, URL builder, runtime contract validation, and client function.
- [x] Replace the Market workspace watchlist batch refresh loop with the new backend run contract.
- [x] Show the latest watchlist cache refresh summary in the data source health panel.
- [x] Add a frontend history loader for `GET /api/cache/watchlist-refreshes?limit=...`.
- [x] Hydrate the data source health panel from the latest persisted watchlist refresh run during settings refresh.
- [x] Add a compact frontend history row builder for recent watchlist cache refresh runs.
- [x] Show the recent watchlist cache refresh history inside the Market data source health panel.
- [x] Update `docs/product-plan.md` and `docs/architecture.md`.
- [x] Run focused tests, broader tests/build, Docker smoke, then commit and push through proxy.

## Verification

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_watchlist_cache_refresh_api_records_refresh_run
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "records a watchlist cache refresh run"
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "loads recent watchlist cache refresh runs"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "summarizes recent watchlist cache refresh runs"
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
docker compose up --build -d
```
