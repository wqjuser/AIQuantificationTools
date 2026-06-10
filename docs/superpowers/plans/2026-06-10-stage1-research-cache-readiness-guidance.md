# Stage 1 Research Cache Readiness Guidance

## Goal

Make the research context readiness checklist explain whether the selected symbol/timeframe cache is ready for audited research, and point stale or missing cache back to the search-suggestion/current-cache refresh path.

## Scope

- Keep this inside Stage 1 market/research usability.
- Improve the local cache readiness row copy for `fresh`, `stale`, `empty`, and missing cache contexts.
- Preserve existing readiness statuses and actions: fresh cache is ready, stale cache is review with refresh action, empty/missing cache is blocked with refresh action.
- Translate the new cache readiness guidance in the Chinese UI.
- Do not create strategy versions, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add readiness model coverage for fresh, stale, and missing cache guidance.
- [x] GREEN: Update cache readiness detail generation.
- [x] GREEN: Add Chinese UI translation for the new cache guidance.
- [x] DOCS: Update product planning docs.
- [x] VERIFY: Run targeted tests, relevant suites, build, Docker/browser smoke.
- [ ] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "Stage 1"
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

## Progress

- 2026-06-10: Added failing Stage 1 readiness tests for fresh, stale, and missing cache guidance.
- 2026-06-10: Updated the cache readiness row so fresh cache explicitly says it can support audited research, while stale or missing cache points users back to search suggestion/current cache refresh before running audited research.
- 2026-06-10: Verified focused Stage 1 readiness tests, the full terminal workbench model test, production build, full repository tests, Docker rebuild, Docker smoke, and browser smoke on `http://127.0.0.1:5173/?workspace=research&market=ashare&symbol=600000&timeframe=1d`.
