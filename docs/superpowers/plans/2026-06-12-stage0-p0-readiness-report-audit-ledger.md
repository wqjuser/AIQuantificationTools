# Stage 0 P0 Readiness Report Audit Ledger

## Goal

Make the P0 readiness report auditable without turning it into a live-trading approval artifact. The homepage should be able to save the generated Markdown report into the backend audit event ledger, and Audit report history should read it back as a searchable `p0_readiness_report` row.

## Guardrails

- Keep the report as an audit aid only.
- Store the report hash and structured summary metadata, not the full Markdown body.
- Do not create orders, change execution state, unlock live trading or mutate Golden Path semantics.
- Do not put P0 readiness reports into the signing chain.

## TDD Plan

- [x] RED: add `terminal-api.test.ts` coverage for `buildP0PlatformReadinessReportAuditEvent`.
- [x] RED: add `terminal-workbench.test.ts` coverage that `p0_readiness_report` events appear in Audit report ledger rows and search.
- [x] RED: extend `layout-css.test.js` so the homepage exposes a save-to-ledger action.
- [x] GREEN: build stable `p0_readiness_report` events from Markdown SHA-256 and P0 summary metadata.
- [x] GREEN: map P0 report events to ledger rows, focus text and hidden search text.
- [x] GREEN: wire homepage `saveP0ReadinessReport` through `saveAuditEvent` and merge the saved event into local report history.
- [x] GREEN: query Audit report history with `audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report`.
- [x] GREEN: disable signing actions for P0 readiness rows because they are audit aids only.
- [x] Update product plan with the new P0 report ledger behavior.
- [x] Run focused tests.
- [x] Run broader web tests.
- [x] Run production build.
- [x] Run root verification and Docker smoke.
- [x] Browser smoke on `http://127.0.0.1:5173`.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED `terminal-api.test.ts -t "P0 readiness report"` failed because `buildP0PlatformReadinessReportAuditEvent` did not exist.
- Initial RED `terminal-workbench.test.ts -t "P0 readiness report events"` failed because report ledger rows ignored `p0_readiness_report`.
- Initial RED `layout-css.test.js -t "P0 readiness report"` failed because the homepage had copy/download only and no audit ledger save action.
- Focused tests passed after adding the event builder, ledger mapping and homepage action.
- Broader web verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` reported 458 tests passed.
- Production build passed with no large chunk warning: `npm --prefix apps/web run build`.
- Root verification passed: Python core 166 tests OK and frontend 475 tests passed via `npm test`.
- Docker smoke passed: `quant-core` health OK and web status OK at `http://127.0.0.1:5173`.
- Browser smoke confirmed P0 readiness plus copy, download and save report actions are visible, with no console errors.
