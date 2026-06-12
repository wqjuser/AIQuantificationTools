# Stage 0 P0 Readiness Ledger Visible Evidence

## Goal

Make P0 readiness report evidence links visible and portable inside Audit report history. The previous slice made the link actionable; this slice makes the target and decoded evidence anchor readable in the ledger row and copyable as a full app URL.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not enable signing for P0 readiness rows.
- Do not create orders, write execution state, or unlock live trading.
- Reuse existing evidence-link metadata from `p0_readiness_report`.

## TDD Plan

- [x] RED: extend the P0 ledger-row model test to require `evidenceLinkLabel` and `evidenceLinkDecodedSearch`.
- [x] RED: extend the Audit report history source test to require a copy evidence link action.
- [x] GREEN: derive a compact readable evidence label from target workspace and evidence status.
- [x] GREEN: store decoded evidence search text on the row for display and search clarity.
- [x] GREEN: render the evidence label in the ledger row and add a copy evidence link action.
- [x] Update product plan with visible/copyable ledger evidence behavior.
- [x] Run focused tests.
- [x] Run broader verification.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model test failed because `AuditEvidenceReportLedgerRow` did not expose `evidenceLinkLabel` or `evidenceLinkDecodedSearch`.
- Initial RED UI source test failed because `App.tsx` did not define `copyAuditReportLedgerEvidenceLink` or pass `onCopyEvidenceLink` into `AuditEvidenceReportLedgerPanel`.
- Focused verification passed: `terminal-workbench.test.ts -t "P0 readiness report events"` and `layout-css.test.js -t "audit evidence report history"`.
- Broader verification passed: focused workbench/layout files, production web build, full `npm test`, `npm run docker:smoke`, browser smoke on `http://127.0.0.1:5173/?workspace=audit`, and `git diff --check`.
- Browser smoke loaded Audit report history without console errors; the current Docker data set did not contain a saved P0 readiness report row, so visible chip/button behavior remains covered by source and model tests.
- Git publication uses the configured local proxy for push: `127.0.0.1:7890`.
