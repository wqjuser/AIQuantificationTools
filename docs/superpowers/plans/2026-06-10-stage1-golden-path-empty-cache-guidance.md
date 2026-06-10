# Stage 1 Golden Path Empty Cache Guidance

## Goal

Make Golden Path missing and empty cache blockers point to the same Stage 1 recovery path as stale cache: refresh market data before running audited research.

## Scope

- Keep the work inside Stage 1 market/research usability.
- Update backend Golden Path details for missing and empty cache contexts.
- Preserve the existing state machine: missing and empty cache remain blocked, with `refresh-data` as the next action.
- Translate the new details in the Chinese UI wherever Golden Path details render.
- Do not create strategy versions, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add backend Golden Path contract coverage for missing and empty cache recovery guidance.
- [x] RED: Add frontend UI contract coverage for missing and empty cache translations.
- [x] GREEN: Update backend Golden Path copy without changing status or action semantics.
- [x] GREEN: Extend Golden Path detail translation for missing and empty cache details.
- [x] DOCS: Update product planning docs.
- [x] VERIFY: Run targeted tests, relevant suites, build, Docker/browser smoke.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_points_missing_cache_to_market_refresh_before_research tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_points_empty_cache_to_market_refresh_before_research
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "golden path cache readiness"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

## Progress

- 2026-06-10: Added failing backend tests for missing/empty cache blockers and confirmed the old copy did not point users to market refresh.
- 2026-06-10: Added frontend UI contract coverage for Chinese missing/empty cache translations.
- 2026-06-10: Updated backend Golden Path details and shared frontend translation while preserving blocked `refresh-data` semantics.
- 2026-06-10: Verified targeted backend/frontend tests, related frontend suites, production build, full repository tests, Docker rebuild, Docker smoke, and browser smoke on `http://127.0.0.1:5173/?workspace=audit&market=ashare&symbol=600000&timeframe=1d`.
- 2026-06-10: Marked this Stage 1 slice shipped after commit and proxy push preparation.
