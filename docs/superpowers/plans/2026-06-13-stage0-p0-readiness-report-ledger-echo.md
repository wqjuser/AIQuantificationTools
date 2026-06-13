# Stage 0 P0 Readiness Report Ledger Echo

## Goal

Show the latest saved P0 readiness report back on the P0 current-task card. After the user saves a P0 readiness report to the audit ledger, the card should display the latest ledger event, short hash, run id, paper preflight status, and a direct Audit focus action.

## Guardrails

- Do not add backend state or new audit event types.
- Do not change Golden Path semantics, paper execution submission, signing eligibility, or live-trading boundaries.
- Keep P0 readiness reports as audit aids only; they must remain outside the signing chain.

## TDD Plan

- [x] RED: extend the audit report ledger summary test to require latest P0 audit-aid event id, short hash, and focus query.
- [x] RED: require the P0 current-task card to consume the ledger summary and render a compact latest-report echo with an Audit focus action.
- [x] GREEN: derive the latest P0 audit-aid ledger fields from existing `p0_readiness_report` rows.
- [x] GREEN: render the latest-report echo in the P0 card and reuse the existing Audit query/open behavior.
- [x] Update product plan with the ledger echo behavior.
- [x] Run focused tests.
- [x] Run broader verification, build, Docker smoke, and browser smoke.
- [ ] Commit and push with proxy.

## Validation Notes

- Initial RED model verification failed because `AuditEvidenceReportLedgerSummary` did not expose latest P0 audit-aid event id, short hash, or report query.
- Initial RED layout verification failed because the P0 current-task card did not consume `auditEvidenceReportLedgerSummary` or render a ledger echo.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "newest P0 readiness audit aid"` and `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "latest saved P0 readiness report"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 320 tests.
- Root verification passed: `npm test` covered 166 Python core tests and 482 frontend tests.
- Production build passed: `npm --prefix apps/web run build`, with no large-chunk warning in the output.
- Docker smoke passed: `npm run docker:smoke` reported core health `ok` and web `ok` at `http://127.0.0.1:5173`.
- Browser smoke passed against `http://127.0.0.1:5173/?workspace=research`: P0 readiness and save-report action rendered with zero page errors; after saving one local P0 readiness report, the new latest-report echo and `在审计中查看` action were visible with zero page errors.
