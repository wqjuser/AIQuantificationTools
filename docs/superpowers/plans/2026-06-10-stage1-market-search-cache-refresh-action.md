# Stage 1 Market Search Cache Refresh Action

## Goal

Let users refresh missing or stale local K-line cache directly from a market search suggestion, then continue in the selected research context without leaving the Stage 1 market/research flow.

## Scope

- Add a compact refresh action for search suggestions whose current-timeframe cache is `empty` or `stale`.
- Keep the primary suggestion click as the select-instrument action.
- Avoid nested buttons by rendering a suggestion row with a select button and a separate refresh button.
- Reuse the existing single-symbol cache refresh API path through the current frontend refresh helper.
- After refresh, keep the selected market/symbol/timeframe as the research context and reload the chart data.
- Keep this inside Stage 1 market/research usability; do not create strategy versions, AI reviews, portfolio events, paper orders, or live trading behavior.

## Tasks

- [x] RED: Add UI contract coverage for search suggestion cache refresh actions.
- [x] GREEN: Split search suggestion rendering into select and refresh actions.
- [x] GREEN: Wire refresh action to the existing current-timeframe cache refresh helper.
- [x] GREEN: Reload selected symbol K-lines after refreshing suggestion cache.
- [x] DOCS: Update product planning docs.
- [x] VERIFY: Run targeted tests, relevant suites, build, Docker/browser smoke.
- [ ] SHIP: Commit and push through proxy.

## Verification

```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "market search suggestions refresh cache"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js src/lib/terminal-api.test.ts
npm --prefix apps/web run build
npm test
docker compose up --build -d
npm run docker:smoke
```

## Progress

- 2026-06-10: Added failing UI contract coverage, then implemented separate suggestion select/refresh actions and compact styling.
- 2026-06-10: Verified frontend layout/API tests, production build, full repository tests, Docker rebuild, Docker smoke, and browser smoke that clicked a search suggestion refresh action and landed in the selected research context.
