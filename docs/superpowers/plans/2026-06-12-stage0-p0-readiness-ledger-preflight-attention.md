# Stage 0 P0 Readiness Ledger Preflight Attention

## Goal

Make the latest P0 audit aid summary more actionable without adding execution behavior. When the latest `p0_readiness_report` has paper-execution preflight gates in review or blocked status, the Audit report ledger summary should show a compact attention count so operators can tell whether the latest audit aid still needs manual follow-up.

## Guardrails

- Keep P0 readiness reports as audit aids only.
- Do not fold this count into signing-chain `attention`.
- Do not enable signing, order routing, live trading, or any side-effecting action from this count.
- Derive the count only from the latest P0 report row: `review + blocked`.

## TDD Plan

- [x] RED: extend the P0 audit-aid summary model test to require `latestAuditAidPreflightAttention`.
- [x] RED: extend the Audit report ledger layout test to require localized preflight attention text.
- [x] GREEN: compute latest P0 preflight attention from review and blocked gate counts.
- [x] GREEN: render a read-only `Preflight attention` / `预检关注` count in the ledger summary when the count is positive.
- [x] Update product plan with the preflight attention behavior.
- [x] Run focused tests.
- [x] Run broader verification.
- [x] Commit and push with proxy.

## Validation Notes

- Initial RED model test failed because `AuditEvidenceReportLedgerSummary` did not expose `latestAuditAidPreflightAttention`.
- Initial RED UI source test failed because `AuditEvidenceReportLedgerPanel` did not render `summary.latestAuditAidPreflightAttention`.
- Focused GREEN verification passed: `terminal-workbench.test.ts -t "P0 readiness report audit aids"` and `layout-css.test.js -t "audit evidence report history"`.
- Related frontend verification passed: `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js` covered 317 tests.
- Production build passed: `npm --prefix apps/web run build`, with no large chunk warning.
- Full root verification passed: `npm test` covered 166 Python core tests and 479 frontend tests.
- Docker smoke passed on port 5173: core health OK, web OK, workspace schema OK.
- Browser smoke passed on `http://127.0.0.1:5173/?workspace=audit`: Audit workspace and report area were visible, four audit rows were present in the current local data set, and console error count was zero.
- Post-Docker browser smoke also passed on the active Audit tab: Audit workspace, report area, and P0 readiness were visible, and console error count was zero.
- The current local Docker data set did not contain a latest P0 audit aid row, so the positive `Preflight attention` badge branch is covered by model and source-level UI tests rather than the live smoke page.
- Proxy push target: `origin/codex/p0-product-workspaces`.
