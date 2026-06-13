# Stage 0 Audit Ledger Latest Report Kind

## Goal

Make the Audit report ledger summary explain what the latest ready hash points to. The previous slice made the latest hash deterministic by `createdAt`; this slice adds a compact report-kind label so operators can distinguish audit evidence, backtest, portfolio, and P0 readiness report hashes without opening individual rows.

## Guardrails

- Do not change report row ordering, signing, verification, revocation, pagination, or search behavior.
- Do not make P0 readiness reports signing-eligible.
- Do not create orders, change execution state, or alter live-trading boundaries.

## TDD Plan

- [x] RED: extend the latest-ready-hash model test to require `latestReportKind` and `latestReportLabel`.
- [x] RED: extend the Audit report ledger source test to require the summary UI to consume the latest report kind fields.
- [x] GREEN: derive the label from the latest ready row's `reportKind`.
- [x] GREEN: render the latest report kind beside the short hash in the Audit summary.
- [x] Update product plan with the latest-report-kind behavior.
- [x] Run related frontend verification.
- [x] Run broader verification.
- [x] Browser smoke the Audit workspace.
- [ ] Commit and push with proxy.

## Validation Notes

- Initial RED model verification failed because `buildAuditEvidenceReportLedgerSummary` returned the new latest hash but did not expose `latestReportKind` or `latestReportLabel`.
- Initial RED source verification failed because `AuditEvidenceReportLedgerPanel` rendered only the short hash and did not consume the latest report kind fields.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "newest ready report hash"` and `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "audit evidence report history"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 319 tests.
- Production build passed: `npm --prefix apps/web run build`, with no large-chunk warning in the output.
- Root verification passed: `npm test` covered 166 Python core tests and 481 frontend tests.
- Docker smoke passed: `npm run docker:smoke` reported core health `ok` and web `ok` at `http://127.0.0.1:5173`.
- Browser smoke passed against `http://127.0.0.1:5173/?workspace=audit`: Audit workspace, P0 readiness, report ledger summary, and latest report-kind text were visible; captured page error count was 0.
