# Stage 0 P0 Readiness Ledger Latest Preflight Summary

## Goal

Make the latest P0 audit aid easier to judge from the Audit report ledger summary. When a saved `p0_readiness_report` carries paper-execution preflight metadata, the summary row should expose the latest preflight state, primary action, and gate counts without requiring the operator to scan individual report rows.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not enable signing, verification, revocation, order routing, or live trading from this summary.
- Reuse the latest `p0_readiness_report` ledger row already selected by `buildAuditEvidenceReportLedgerSummary`.
- Render a compact read-only badge only when preflight metadata exists.

## TDD Plan

- [x] RED: extend the P0 audit-aid summary test to require latest preflight action id, state, and label.
- [x] RED: extend the Audit report ledger layout test to require `summary.latestAuditAidPreflightLabel` and localized summary text.
- [x] GREEN: expose latest P0 paper preflight fields from `buildAuditEvidenceReportLedgerSummary`.
- [x] GREEN: render a read-only latest preflight badge in `AuditEvidenceReportLedgerPanel`.
- [x] Update product plan with the latest-preflight summary behavior.
- [x] Run focused tests.
- [x] Run broader verification.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model test failed because `AuditEvidenceReportLedgerSummary` did not expose `latestAuditAidPreflight*` fields.
- Initial RED UI source test failed because the Audit report ledger summary did not render `summary.latestAuditAidPreflightLabel`.
- Focused GREEN verification passed: `terminal-workbench.test.ts -t "P0 readiness report audit aids"` and `layout-css.test.js -t "audit evidence report history"`.
- Related web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 317 tests.
- Production build passed with no large chunk warning: `npm --prefix apps/web run build`.
- Root verification passed: `npm test` covered Python core 166 tests and frontend 479 tests.
- Docker smoke passed with `health status=ok service=quant-core` and `web status=ok url=http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, found Audit report history, counted 4 report rows, and reported 0 console errors. The current Docker data set did not contain a saved P0 audit aid, so the conditional latest-preflight badge remains covered by model and source tests.
