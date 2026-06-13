# Stage 0 Portfolio Paper Simulation Route Checks

## Goal

Show a controlled simulation-route checklist before portfolio paper orders are filled. The Execution and Portfolio execution panels should explain which portfolio orders are ready for the local simulator, which are still waiting for operator/risk review, which are already filled, and which are blocked or skipped.

## Guardrails

- Do not connect live broker routes, unlock live execution, or change `liveTradingAllowed`.
- Do not change approval, risk, simulation, replay, or state-history semantics.
- Do not create new backend state; derive route checks from existing approval rows, simulations, and state-history rows.
- Keep the UI compact so it clarifies execution readiness without becoming another large table.

## TDD Plan

- [x] RED: add a model test requiring ready, waiting, filled, and blocked simulation-route rows from existing portfolio paper order evidence.
- [x] GREEN: derive route rows from approval state, existing simulations, and latest state-history evidence.
- [x] GREEN: render the route checklist in Execution and Portfolio embedded execution panels.
- [x] Update product plan with the visible simulation-route checks.
- [x] Run focused tests.
- [x] Run broader verification, build, Docker smoke, and browser smoke.
- [ ] Commit and push with proxy.

## Validation Notes

- Initial RED model verification failed because `buildPortfolioPaperOrderSimulationRouteRows` did not exist.
- Initial RED layout verification failed because the app did not consume or render portfolio simulation route rows.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "simulation route rows"` and `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "simulation route checks"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js`.
- Broad verification passed: `git diff --check`, `npm test`, `npm --prefix apps/web run build`, and `npm run docker:smoke`.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=execution`: title `AI Quantification Tools`, execution/paper-boundary text present, and no console errors. The current runtime data had no portfolio simulation route rows, so visible route-row rendering remains covered by model and layout tests.
