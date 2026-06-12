# Stage 0 P0 Readiness Ledger Signing Summary

## Goal

Keep P0 readiness reports visible in Audit report history without making them look like pending signing-chain work. A `p0_readiness_report` row should still show its own unsigned hash evidence, but report-history summary counts should separate signing-eligible reports from audit aids.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not enable sign, verify or revoke actions for P0 readiness rows.
- Do not hide row-level unsigned status, hash evidence or evidence links.
- Do not change backend audit events, Golden Path semantics, orders, execution state or live-trading gates.

## TDD Plan

- [x] RED: add `terminal-workbench.test.ts` coverage proving a P0 readiness report row remains `unsigned` but does not count as signing-chain `unsigned`.
- [x] RED: extend `layout-css.test.js` coverage so the Audit report ledger panel exposes signing-eligible and audit-aid summary fields.
- [x] GREEN: add `signingEligible` and `auditAid` to `AuditEvidenceReportLedgerSummary`.
- [x] GREEN: compute `unsigned`, `signed`, `verified`, `revoked` and signing-chain status from signing-eligible reports only.
- [x] GREEN: render compact `Signing chain` / `Audit aids` summary counters in the Audit report ledger panel.
- [x] Update product plan with the P0 audit-aid summary separation.
- [x] Run focused tests.
- [x] Run broader web tests and production build.
- [x] Run root verification, Docker smoke, browser smoke and `git diff --check`.
- [ ] Commit and push with proxy.

## Validation Notes

- Initial RED `terminal-workbench.test.ts -t "P0 readiness report audit aids"` failed because P0 readiness rows were counted as `unsigned` and made the signing-chain status `unsigned`.
- Initial RED `layout-css.test.js -t "audit evidence report history"` failed because the report ledger panel did not expose `summary.signingEligible`.
- Focused tests passed after separating signing-eligible report counts from P0 audit aids.
- Related web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` reported 314 tests passed.
- Production build passed: `npm --prefix apps/web run build`.
- Root verification passed: Python core 166 tests OK and frontend 476 tests passed via `npm test`.
- Docker smoke passed with `quant-core` health OK and web status OK at `http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, found Audit/report ledger/signing summary text and reported zero console errors.
