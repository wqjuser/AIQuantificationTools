# Stage 0 P0 Readiness Ledger Latest Aid Summary

## Goal

Make saved P0 readiness reports easier to trace from the Audit report ledger summary. When P0 audit aids exist, the summary should show which run the latest aid points to and keep the decoded evidence anchor available as hover context.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not enable signing, verification or revocation for P0 readiness rows.
- Do not write new backend state or mutate existing audit events.
- Do not change Golden Path semantics, execution state, orders or live-trading gates.

## TDD Plan

- [x] RED: extend the P0 audit-aid summary test to require latest audit-aid run id, evidence label and decoded evidence link.
- [x] RED: extend the Audit report ledger layout test to require `Latest aid` / `最新辅助` summary rendering.
- [x] GREEN: derive latest audit-aid fields from existing `p0_readiness_report` ledger rows.
- [x] GREEN: render latest audit-aid run id in the report ledger summary with the decoded evidence anchor as title text.
- [x] Update product plan with the latest audit-aid summary behavior.
- [x] Run focused tests.
- [x] Run broader web tests and production build.
- [x] Run root verification, Docker smoke, browser smoke and `git diff --check`.
- [ ] Commit and push with proxy.

## Validation Notes

- Initial RED `terminal-workbench.test.ts -t "P0 readiness report audit aids"` failed because `buildAuditEvidenceReportLedgerSummary` did not expose latest audit-aid fields.
- Initial RED `layout-css.test.js -t "audit evidence report history"` failed because the Audit report ledger summary did not render `summary.latestAuditAidRunId`.
- Related web verification passed after implementation: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` reported 314 tests passed.
- Production build passed: `npm --prefix apps/web run build`.
- Root verification passed: Python core 166 tests OK and frontend 476 tests passed via `npm test`.
- Docker smoke passed with `quant-core` health OK and web status OK at `http://127.0.0.1:5173`.
- Browser smoke opened `http://127.0.0.1:5173/?workspace=audit`, found Audit/report ledger/audit-aid copy and reported zero console errors. The current Docker data set did not contain a saved P0 report row, so the conditional `Latest aid` branch remains covered by model and source tests.
