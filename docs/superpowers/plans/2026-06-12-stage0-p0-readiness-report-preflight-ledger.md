# Stage 0 P0 Readiness Report Preflight Ledger

## Goal

Make saved P0 readiness report rows explain their paper-execution preflight state inside Audit report history. Operators should be able to search a saved `p0_readiness_report` by preflight state, primary action, gate counts, or paper-only boundary, then read the compact preflight badge without reopening the current-task card.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not enable signing, verification, revocation, order routing, or live trading from P0 report rows.
- Reuse metadata already written by `buildP0PlatformReadinessReportAuditEvent`.
- Keep the UI passive and compact so report rows remain a ledger, not a second execution panel.

## TDD Plan

- [x] RED: extend the P0 report ledger-row model test to require preflight state, primary action, gate counts, live boundary, and searchable label text.
- [x] GREEN: project paper preflight metadata into `AuditEvidenceReportLedgerRow` only for `p0_readiness_report`.
- [x] RED: extend the Audit report history source/CSS test to require a preflight badge in report rows.
- [x] GREEN: render a compact read-only preflight badge in `AuditEvidenceReportLedgerPanel`.
- [x] Update product plan with the new Audit report-history preflight behavior.
- [x] Run focused tests.
- [x] Run broader verification.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model test failed because `AuditEvidenceReportLedgerRow` did not expose any `paperPreflight*` fields and search text ignored the preflight metadata.
- Initial RED UI source test failed because the Audit report ledger row did not render `row.paperPreflightLabel`.
- Focused GREEN verification passed: `terminal-workbench.test.ts -t "P0 readiness report events"` and `layout-css.test.js -t "audit evidence report history"`.
- Related web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 317 tests.
- Production build passed with no large chunk warning: `npm --prefix apps/web run build`.
- Root verification passed: `npm test` covered Python core 166 tests and frontend 479 tests.
- Docker smoke passed with `health status=ok service=quant-core` and `web status=ok url=http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, found Audit report history and signing registry content, counted 4 report rows, and reported 0 console errors. The current Docker data set did not contain a saved P0 readiness report row, so the conditional preflight badge remains covered by model and source tests.
