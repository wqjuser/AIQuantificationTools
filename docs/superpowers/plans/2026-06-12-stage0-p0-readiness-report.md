# Stage 0 P0 Readiness Report

## Goal

Give the P0 task card a portable readiness report so the user can see and share where the platform stands: Golden Path progress, current blocker, open gaps, latest evidence, evidence link and live-blocked boundary.

This is a P0 usability slice. It must not write backend state, create orders, change Golden Path semantics or unlock live trading.

## Design

- Add a pure frontend model function `buildP0PlatformReadinessReportMarkdown`.
- Feed it the existing P0 readiness summary, backlog rows, latest evidence outcome and evidence link.
- Render compact copy/download controls inside the current P0 evidence card.
- Keep the report as an audit aid only; no investment advice and no live-trading authorization.
- Update `docs/product-plan.md` after the implementation.

## TDD Plan

- [x] RED: add a focused `terminal-workbench.test.ts` case requiring the Markdown report function.
- [x] GREEN: implement the pure report builder.
- [x] RED: add a focused `layout-css.test.js` case requiring copy/download UI, handlers and CSS.
- [x] GREEN: wire the report into the P0 task card with copy/download actions.
- [x] Update product plan with the new P0 report behavior.
- [x] Run focused tests.
- [x] Run full frontend/unit verification.
- [x] Run production build.
- [x] Run Docker smoke and browser smoke on `http://127.0.0.1:5173`.
- [ ] Commit and push with proxy.

## Validation Notes

- Initial RED for the model test failed with `TypeError: buildP0PlatformReadinessReportMarkdown is not a function`.
- Initial RED for the UI/source test failed because `App.tsx` did not contain `buildP0PlatformReadinessReportMarkdown`.
- Focused frontend tests passed: `terminal-workbench.test.ts` and `layout-css.test.js`.
- Production build passed with no large chunk warning.
- Root verification passed: Python core `166` tests OK and frontend `473` tests passed.
- Docker smoke passed with `quant-core` health OK and web status OK at `http://127.0.0.1:5173`.
- Browser smoke confirmed the homepage renders P0 readiness, latest evidence, copy report and download report with no console errors.
