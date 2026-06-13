# Stage 0 Audit Ledger Focus Latest Report

## Goal

Turn the Audit report ledger summary's latest report hash into an actionable locator. Operators should be able to click one summary action and filter the current ledger view to the latest ready report row without scanning the list manually.

## Guardrails

- Do not change backend query semantics, pagination, row ordering, signing, verification, revocation, or report storage.
- Do not make P0 readiness reports signing-eligible.
- Do not create orders, change execution state, or alter live-trading boundaries.

## TDD Plan

- [x] RED: extend the latest-ready-report summary model test to require `latestReportQuery`.
- [x] RED: require the Audit report ledger source to consume `summary.latestReportQuery` and render localized focus copy.
- [x] GREEN: derive `latestReportQuery` from latest ready row report kind, run id, short hash, and filename.
- [x] GREEN: add a summary button that passes `summary.latestReportQuery` to the existing ledger search handler.
- [x] Update product plan with the focus-latest behavior.
- [x] Run related frontend verification.
- [x] Run broader verification.
- [x] Browser smoke the Audit workspace.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model verification failed because `buildAuditEvidenceReportLedgerSummary` did not expose `latestReportQuery`.
- Initial RED source verification failed because `AuditEvidenceReportLedgerPanel` had no `summary.latestReportQuery` usage or `Focus latest` action.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "newest ready report hash"` and `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "audit evidence report history"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 319 tests.
- Production build passed: `npm --prefix apps/web run build`, with no large-chunk warning in the output.
- Root verification passed: `npm test` covered 166 Python core tests and 481 frontend tests.
- Docker smoke passed: `npm run docker:smoke` reported core health `ok` and web `ok` at `http://127.0.0.1:5173`.
- Browser smoke passed against `http://127.0.0.1:5173/?workspace=audit`: Audit workspace, P0 readiness, report ledger summary, latest report-kind text, and `定位最新` were visible; captured page error count was 0.
- Commit and proxy push completed on `codex/p0-product-workspaces` as `5161623`.
