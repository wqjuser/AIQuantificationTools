# Stage 0 P0 Paper Execution Preflight

## Goal

Make the current P0 paper-execution blocker explainable from the current-task card. When Golden Path is waiting on `paper-execution`, the operator should see whether the next action is to bind the latest audited run, review risk gates, submit a paper order, or review an already-recorded paper execution.

## Guardrails

- Reuse the existing Golden Path, research-run binding, risk approval and paper execution state.
- Keep this as a derived frontend preflight first; do not add backend state.
- Do not submit orders automatically, bypass risk approval, alter Golden Path semantics, or unlock live trading.
- Keep the panel compact so it does not reintroduce the layout problems from earlier UI work.

## TDD Plan

- [x] RED: add model coverage for rebinding the latest audited run before paper submission.
- [x] RED: add model coverage for ready and already-recorded paper execution states.
- [x] GREEN: implement `buildP0PaperExecutionPreflight` as a pure model.
- [x] RED: add layout coverage requiring the current-task card to render the preflight and gate grid.
- [x] GREEN: wire the preflight into the current-task card with compact CSS and i18n helpers.
- [x] RED: require the preflight to expose a primary action id and target workspace.
- [x] GREEN: wire the compact preflight action button to existing Golden Path action handling.
- [x] Run focused tests.
- [x] Run related web tests and production build.
- [x] Run root verification, Docker smoke, browser smoke and `git diff --check`.

## Validation Notes

- Initial RED model test failed because `buildP0PaperExecutionPreflight` did not exist.
- Focused model test passed after adding the preflight model and paper execution gates.
- Initial RED layout test failed because the current-task card did not compute or render the preflight.
- Focused layout test passed after wiring the preflight panel and CSS.
- Follow-up RED model/layout tests failed because the preflight only displayed a primary action label; it did not expose or trigger the action. The model now returns `primaryActionId` and `primaryActionTargetWorkspaceId`, and the current-task card button reuses `runGoldenPathActionById` or opens the target workspace for review-only states.
- Focused combined verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js -t "P0 paper execution preflight"`.
- Related web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 317 tests.
- Production build passed with no large chunk warning: `npm --prefix apps/web run build`.
- Root verification passed: `npm test` covered Python core 166 tests and frontend 479 tests.
- Docker smoke passed with `health status=ok service=quant-core` and `web status=ok url=http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, confirmed the Docker-backed page renders `模拟执行预检`, shows one enabled `.p0-paper-preflight-action` button (`运行审计流水线` in the current BTC/USDT Docker context), reports Golden Path content, and logs 0 console errors.
