# Stage 0 P0 Readiness Report Paper Preflight

## Goal

Carry the current paper-execution preflight into the portable P0 readiness report and the audit-ledger metadata generated from that report. The operator should be able to save one audit aid that captures the Golden Path gap, the latest evidence link, and the four paper-execution preflight gates without opening the live UI state.

## Guardrails

- Reuse the derived `buildP0PaperExecutionPreflight` model from the current-task card.
- Keep the report as an audit aid only; do not sign it, route orders, bypass risk approval, or unlock live trading.
- Store compact metadata only: state, action id/label, gate counts, and live-boundary value.
- Keep the UI wiring passive: report copy/download/save receives the current preflight object but does not trigger the primary action.

## TDD Plan

- [x] RED: require the Markdown report to include a `Paper Execution Preflight` section.
- [x] RED: require the P0 readiness audit event metadata to include preflight state, action, gate counts, and live boundary.
- [x] RED: require App report generation and ledger save wiring to pass `p0PaperExecutionPreflight`.
- [x] GREEN: extend `P0PlatformReadinessReportInput`, Markdown generation, audit event metadata, and App wiring.
- [x] Run focused tests.
- [x] Run related web tests and production build.
- [x] Run root verification, Docker smoke, browser smoke, and `git diff --check`.

## Validation Notes

- Initial Markdown RED failed because the report stopped after `Latest Evidence` and did not include paper-execution preflight gates.
- Initial API RED failed because the `p0_readiness_report` audit event metadata did not include any preflight state or gate counts.
- Initial App wiring RED failed because `buildP0PlatformReadinessReportMarkdown` and `buildP0PlatformReadinessReportAuditEvent` were not passed `p0PaperExecutionPreflight`.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts src/lib/layout-css.test.js -t "P0 readiness report"`.
- Related web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/terminal-api.test.ts src/lib/layout-css.test.js` covered 462 tests.
- Production build passed with no large chunk warning: `npm --prefix apps/web run build`.
- Root verification passed: `npm test` covered Python core 166 tests and frontend 479 tests.
- Docker smoke passed with `health status=ok service=quant-core` and `web status=ok url=http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, confirmed P0 readiness, paper preflight, three report action buttons, and 0 console errors.
