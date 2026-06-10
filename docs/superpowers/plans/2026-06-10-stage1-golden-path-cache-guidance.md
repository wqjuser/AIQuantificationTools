# Stage 1 Golden Path Cache Guidance

## Goal

Align the Golden Path market-data step with the Stage 1 research cache readiness checklist, so the current task card and audit runbook explain whether cached K-line data can support audited research.

## Scope

- Keep this inside Stage 1 market/research usability.
- Update backend Golden Path market-data details for fresh and stale cache contexts.
- Preserve the existing state machine: fresh cache passes, stale cache remains review with `refresh-data`, missing or empty cache remains blocked.
- Translate the new Golden Path cache details in the Chinese UI.
- Do not create strategy versions, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add backend Golden Path contract coverage for fresh and stale cache guidance.
- [x] GREEN: Update the backend market-data step details without changing status or action semantics.
- [x] RED: Add frontend UI contract coverage for Golden Path cache guidance translation.
- [x] GREEN: Reuse a Golden Path detail translator in task cards and audit runbook rows.
- [x] DOCS: Update product planning docs.
- [x] VERIFY: Run targeted tests, relevant suites, build, Docker/browser smoke.
- [x] SHIP: Commit and push through proxy.

## Verification

```powershell
$env:PYTHONPATH='services/quant_core'; python -m unittest tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_blocks_at_research_when_cache_exists_without_audit_run tests.test_quant_core.QuantCoreContractTest.test_golden_path_status_points_stale_cache_to_market_refresh_before_research
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "golden path cache readiness"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

## Progress

- 2026-06-10: Added failing backend Golden Path tests for fresh/stale cache guidance and implemented the backend detail copy.
- 2026-06-10: Added failing frontend UI contract coverage and implemented shared Golden Path detail translation for cache readiness guidance.
- 2026-06-10: Verified targeted backend/frontend tests, related frontend suites, production build, full repository tests, Docker rebuild, Docker smoke, and browser smoke on `http://127.0.0.1:5173/?workspace=audit&market=ashare&symbol=600000&timeframe=1d`.
- 2026-06-10: Marked this Stage 1 slice shipped after commit and proxy push preparation.
