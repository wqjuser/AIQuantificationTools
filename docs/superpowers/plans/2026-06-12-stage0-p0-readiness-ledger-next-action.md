# Stage 0 P0 Readiness Ledger Next Action

## Goal

Make the latest P0 audit aid summary more operational without adding execution behavior. When a saved `p0_readiness_report` includes paper-execution preflight metadata, the Audit report ledger summary should surface the latest primary action label as a read-only next-action hint.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not invoke the action from the summary label.
- Do not add signing, order routing, live trading, or state-changing behavior.
- Derive the label only from the latest P0 report row's existing `paperPreflightActionLabel`.

## TDD Plan

- [x] RED: extend the P0 audit-aid summary model test to require `latestAuditAidPreflightActionLabel`.
- [x] RED: extend the Audit report ledger layout test to require localized `Next action` / `下一步` text.
- [x] GREEN: expose the latest P0 preflight action label from `buildAuditEvidenceReportLedgerSummary`.
- [x] GREEN: render a read-only next-action hint in `AuditEvidenceReportLedgerPanel`.
- [x] Update product plan with the latest-aid next-action behavior.
- [x] Run related frontend verification.
- [x] Run broader verification.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model test failed because `AuditEvidenceReportLedgerSummary` did not expose `latestAuditAidPreflightActionLabel`.
- Initial RED UI source test failed because `AuditEvidenceReportLedgerPanel` did not render `summary.latestAuditAidPreflightActionLabel` or localized next-action text.
- Focused GREEN verification passed: `terminal-workbench.test.ts -t "P0 readiness report audit aids"` and `layout-css.test.js -t "audit evidence report history"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 317 tests.
- Production build passed: `npm --prefix apps/web run build`, with no large chunk warning.
- Full root verification passed: `npm test` covered 166 Python core tests and 479 frontend tests.
- Docker smoke passed on port 5173: core health OK, web OK, workspace schema OK.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=audit`: Audit workspace, report area, and P0 readiness were visible, and console error count was zero.
- The current Docker data set did not contain a saved P0 audit aid row, so the positive latest-aid next-action summary branch is covered by model and source-level UI tests rather than the live smoke page.
