# Stage 0 P0 Readiness Ledger Latest Aid Copy

## Goal

Make the latest P0 audit aid in the Audit report ledger summary portable. After a P0 readiness report is saved, the operator should be able to copy its latest evidence link directly from the summary without scanning individual report rows.

## Guardrails

- Reuse the existing report-ledger evidence-link copy handler.
- Keep P0 readiness reports as audit aids only.
- Do not enable signing, verification or revocation for P0 readiness rows.
- Do not write backend state, create orders, change Golden Path semantics or alter live-trading gates.

## TDD Plan

- [x] RED: extend Audit report ledger layout coverage to require `Copy latest aid` / `复制最新辅助`.
- [x] RED: require the summary action to call `onCopyEvidenceLink(summary.latestAuditAidEvidenceLink)`.
- [x] GREEN: render the summary copy action only when a latest P0 audit-aid evidence link exists.
- [x] Update product plan with the summary-level latest aid copy action.
- [x] Run focused tests.
- [x] Run related web tests and production build.
- [x] Run root verification, Docker smoke, browser smoke and `git diff --check`.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED `layout-css.test.js -t "audit evidence report history"` failed because the Audit report ledger summary did not render `复制最新辅助`.
- Focused test passed after adding the summary-level button that calls the existing evidence-link copy handler.
- Related web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 314 tests.
- Production build passed with no large chunk warning: `npm --prefix apps/web run build`.
- Root verification passed: `npm test` covered Python core 166 tests and frontend 476 tests.
- Docker smoke passed with `health status=ok service=quant-core` and `web status=ok url=http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, found Audit/report/audit-aid content and 0 console errors. The current Docker data set does not have a saved P0 readiness report row exposing the conditional summary copy button, so that branch is covered by source-level layout tests.
