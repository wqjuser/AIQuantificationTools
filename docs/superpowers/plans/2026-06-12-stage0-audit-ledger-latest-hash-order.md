# Stage 0 Audit Ledger Latest Hash Ordering

## Goal

Make the Audit report ledger summary's `Latest` hash deterministic when multiple ready reports are present. The summary should select the newest ready report by `createdAt`, not whichever ready row appears first in the current backend or pagination order.

## Guardrails

- Do not change report row ordering, search, signing actions, or backend event storage.
- Do not alter P0 audit-aid signing boundaries.
- Only change the read-only summary hash selection rule.

## TDD Plan

- [x] RED: add a model test with an older ready report before a newer ready report and require `latestHash` to use the newer hash.
- [x] GREEN: compute `readyRows` once and reduce by `createdAt` for `latestReadyRow`.
- [x] Update product plan with the deterministic latest-hash selection rule.
- [x] Run related frontend verification.
- [x] Run broader verification.
- [x] Browser smoke the Audit workspace.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED verification failed because `buildAuditEvidenceReportLedgerSummary` selected the first ready row and returned the old `111...` hash.
- Focused GREEN verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "newest ready report hash"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 319 tests.
- Production build passed: `npm --prefix apps/web run build`, with no large-chunk warning in the output.
- Root verification passed: `npm test` covered 166 Python core tests and 481 frontend tests.
- Docker smoke passed: `npm run docker:smoke` reported core health `ok` and web `ok` at `http://127.0.0.1:5173`.
- Browser smoke passed against `http://127.0.0.1:5173/?workspace=audit`: Audit workspace, P0 readiness, report area, and ledger summary were visible; captured page error count was 0.
- The live Docker fixture did not need to contain multiple ready reports for this ordering branch; the new regression test covers that deterministic selection path directly.
