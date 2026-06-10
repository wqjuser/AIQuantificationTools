# Stage 1 Market Search Cache Coverage

## Goal

Show whether each market search suggestion already has local K-line cache coverage for the currently selected timeframe, so users can decide whether to open the research context directly or refresh market data first.

## Scope

- Add optional timeframe-aware cache coverage to `/api/market/search`.
- Keep existing search behavior unchanged when no timeframe is supplied.
- Preserve fresh/stale/empty semantics aligned with Settings cache freshness.
- Carry the cache coverage through the web API client.
- Render compact cache coverage in the symbol search dropdown.
- Keep the change inside Stage 1 market/research usability; do not add strategy, AI, portfolio, paper trading, or live trading behavior.

## Tasks

- [x] RED: Add backend payload/API tests for search suggestion cache coverage.
- [x] RED: Add frontend API and UI contract tests for timeframe-aware search.
- [x] GREEN: Add exact cache context lookup and search payload enrichment.
- [x] GREEN: Pass selected timeframe from the web search request.
- [x] GREEN: Render cache coverage in the symbol dropdown.
- [x] DOCS: Update product planning docs.
- [x] VERIFY: Run targeted tests, relevant suites, build, Docker/browser smoke.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_market_symbol_search_payload_marks_current_timeframe_cache_coverage services.quant_core.tests.test_quant_core.QuantCoreContractTest.test_market_search_api_includes_current_timeframe_cache_coverage
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "market search"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "market search suggestions"
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/layout-css.test.js
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

## Progress

- 2026-06-10: Added failing backend, frontend API, and UI contract tests.
- 2026-06-10: Implemented cache coverage enrichment for market search suggestions and rendered compact coverage in the dropdown.
- 2026-06-10: Verified backend suite, frontend API/layout suite, production build, full repository test, Docker rebuild, Docker smoke, direct container API response, and browser dropdown smoke on `/?workspace=market`.
- 2026-06-10: Shipped to `origin/codex/p0-product-workspaces` through the configured proxy.
