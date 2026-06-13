# Stage 0 Portfolio Paper Latest Simulation

## Goal

Make the portfolio paper execution loop visibly traceable after a simulated fill. When an approved portfolio paper order is simulated, the Execution and Portfolio panels should show the latest fill as a compact summary, preserve the paper-only/live-blocked boundary, and provide a deterministic query that focuses the matching order state timeline.

## Guardrails

- Do not connect a live broker, unlock live execution, or change `liveTradingAllowed`.
- Do not change order approval, risk gate, replay, or state-history semantics.
- Keep the feature read-only after simulation: it summarizes existing simulation and replay evidence, and only helps locate the timeline.

## TDD Plan

- [x] RED: add a model test requiring latest simulated fill summary fields and deterministic state-history focus query.
- [x] GREEN: derive the summary from existing simulation, replay, and state-history snapshots.
- [x] GREEN: render the latest-fill summary in Execution and Portfolio execution panels with a timeline focus action.
- [x] Update product plan with the new visible execution trace.
- [x] Run focused tests.
- [x] Run broader verification, build, Docker smoke, and browser smoke.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model verification failed because `buildPortfolioPaperOrderLatestSimulationSummary` did not exist.
- Initial RED layout verification failed because the app did not consume the latest simulation summary or render a timeline focus cue.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "latest portfolio paper simulation summary"` and `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "latest portfolio paper fill"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 322 tests.
- Whitespace verification passed: `git diff --check`.
- Root verification passed: `npm test` covered 166 Python core tests and 484 frontend tests.
- Production build passed: `npm --prefix apps/web run build`; no large-chunk warning appeared.
- Docker smoke passed: `npm run docker:smoke` rebuilt the stack, reported core health `ok`, and served web at `http://127.0.0.1:5173`.
- Browser smoke passed against `http://127.0.0.1:5173/?workspace=execution`: execution panel and paper boundary rendered with zero console errors. The local container data had no simulated portfolio fills, so the latest-fill card correctly had zero instances in this smoke.
- Commit and proxy push completed on `codex/p0-product-workspaces` as `4e5adc5`.
