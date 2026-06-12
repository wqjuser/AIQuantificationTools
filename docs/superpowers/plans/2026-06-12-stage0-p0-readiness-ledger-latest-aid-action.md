# Stage 0 P0 Readiness Ledger Latest Aid Action

## Goal

Make the latest P0 audit aid in the Audit report ledger summary actionable. After a P0 readiness report is saved, the operator should be able to open its latest evidence target directly from the summary instead of scanning individual report rows.

## Guardrails

- Reuse the existing report-ledger evidence opener.
- Keep P0 readiness reports as audit aids only.
- Do not enable signing, verification or revocation for P0 readiness rows.
- Do not write backend state, create orders, change Golden Path semantics or alter live-trading gates.

## TDD Plan

- [x] RED: extend Audit report ledger layout coverage to require `Open latest aid` / `打开最新辅助`.
- [x] RED: require the summary action to call `onOpenEvidenceLink(summary.latestAuditAidEvidenceLink)`.
- [x] GREEN: render the summary action only when a latest P0 audit-aid evidence link exists.
- [x] Update product plan with the summary-level latest aid action.
- [x] Run focused tests.
- [x] Run related web tests and production build.
- [x] Run root verification, Docker smoke, browser smoke and `git diff --check`.
- [ ] Commit and push with proxy.

## Validation Notes

- Initial RED `layout-css.test.js -t "audit evidence report history"` failed because the Audit report ledger summary did not render `打开最新辅助`.
- Focused test passed after adding the summary-level button that calls the existing evidence opener.
- Related web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` reported 314 tests passed.
- Production build passed: `npm --prefix apps/web run build`.
- Root verification passed: Python core 166 tests OK and frontend 476 tests passed via `npm test`.
- Docker smoke passed with `quant-core` health OK and web status OK at `http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, found Audit/report ledger/audit-aid copy and reported zero console errors. The current Docker data set did not contain a saved P0 report row, so the conditional latest-aid action remains covered by source tests.
