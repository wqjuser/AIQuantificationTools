# Stage 0 P0 Readiness Ledger Evidence Link

## Goal

Make saved P0 readiness reports actionable from Audit report history. A `p0_readiness_report` row should not stop at showing a hash; it should expose the latest evidence link that was embedded in the report metadata, so an operator can reopen the audited run or paper execution context from the ledger.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not enable signing for P0 readiness rows.
- Do not create orders, change execution state or unlock live trading.
- Reuse existing Audit import-evidence and paper-execution deep-link loaders.

## TDD Plan

- [x] RED: extend the P0 ledger-row model test to require `evidenceLinkSearch`, `evidenceLinkStatus` and `evidenceTargetWorkspaceId`.
- [x] RED: extend the Audit report history source test to require an `onOpenEvidenceLink` action.
- [x] GREEN: derive evidence link fields from `p0_readiness_report.metadata.latestEvidenceLink/latestEvidenceState`.
- [x] GREEN: include decoded evidence links in report-ledger search so `manifest:run-a1` matches URL-encoded metadata.
- [x] GREEN: add an Audit report ledger "Open evidence" action that routes audit links through `loadImportAuditEvidenceDeepLink` and paper links through `loadPaperExecutionDeepLink`.
- [x] Update product plan and adjacent plan status.
- [x] Run focused tests.
- [x] Run broader verification.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model test failed because P0 ledger rows did not expose evidence-link fields.
- Initial RED UI source test failed because `App.tsx` did not define `openAuditReportLedgerEvidenceLink` or pass `onOpenEvidenceLink` into `AuditEvidenceReportLedgerPanel`.
- First GREEN pass needed a small search-index fix: stored evidence links are URL encoded, so report-ledger search now indexes a decoded version too.
- Focused verification passed: `terminal-workbench.test.ts -t "P0 readiness report events"` and `layout-css.test.js -t "audit evidence report history"`.
- Broader verification passed: focused workbench/layout files, production web build, full `npm test`, `npm run docker:smoke`, browser smoke on `http://127.0.0.1:5173/?workspace=audit`, and `git diff --check`.
- Git publication uses the configured local proxy for push: `127.0.0.1:7890`.
