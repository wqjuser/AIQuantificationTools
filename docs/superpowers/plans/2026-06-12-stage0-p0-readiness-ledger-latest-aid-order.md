# Stage 0 P0 Readiness Ledger Latest Aid Ordering

## Goal

Make the Audit report ledger summary deterministic when multiple `p0_readiness_report` audit aids are present. The latest P0 audit aid summary must select the newest row by `createdAt`, not whichever row appears first in the current backend or pagination order.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not change signing-chain counts, report actions, order routing, live trading, or backend event storage.
- Only change the read-only summary selection rule for the latest P0 audit aid.
- Preserve existing row order and search behavior.

## TDD Plan

- [x] RED: add a model test with an older P0 report before a newer P0 report and require the summary to select the newer run.
- [x] GREEN: compute `auditAidRows` once and reduce by `createdAt` for `latestAuditAidRow`.
- [x] Update product plan with the deterministic latest-aid selection rule.
- [x] Run related frontend verification.
- [x] Run broader verification.
- [x] Browser smoke the Audit workspace.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED verification failed because `buildAuditEvidenceReportLedgerSummary` used the first P0 report row and selected `run-old`.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "newest P0 readiness audit aid"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 318 tests.
- Production build passed: `npm --prefix apps/web run build`, with no large chunk warning.
- Full root verification passed: `npm test` covered 166 Python core tests and 480 frontend tests.
- Docker smoke passed on port 5173: core health OK, web OK, workspace schema OK.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=audit`: Audit workspace, report area, and P0 readiness were visible, and console error count was zero.
- The current Docker data set did not contain saved P0 audit aid rows, so multi-aid ordering remains covered by the model regression test rather than the live smoke page.
