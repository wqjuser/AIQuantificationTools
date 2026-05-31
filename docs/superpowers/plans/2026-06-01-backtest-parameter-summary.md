# Backtest Parameter Scan Summary Plan

Goal: make Backtest Lab parameter sensitivity easier to read by adding a compact, non-advisory summary above the raw candidate table.

Product mapping:
- Work area: Backtest Lab.
- User value: see current-parameter rank, candidate count, risk count, and a top candidate for re-audit without manually scanning every row.
- Guardrail: the summary must say "candidate for re-audit" or equivalent language, not "best trade", "buy", or "recommended".

Scope:
- Add a reusable `BacktestParameterScanSummary` model derived from the existing scan rows.
- Compute total rows, candidate count, current condition, current rank, positive/risk counts, and the highest-return non-current non-risk candidate.
- Include the summary in the Backtest Markdown report.
- Render a compact summary strip above the Backtest Lab parameter scan table.

Out of scope:
- AI-generated parameter recommendations.
- Optimizer endpoints.
- Automatic strategy promotion.
- Multi-symbol scan ranking.

Progress:
- [x] Existing parameter scan UI and model entry points identified.
- [x] Red tests planned for summary builder and Markdown inclusion.
- [x] Summary model implementation.
- [x] UI/Markdown integration.
- [x] Product plan and architecture documentation update.
- [x] Verification completed.
- [ ] Commit and push.

Implementation notes:
- `BacktestParameterScanSummary` is derived from existing scan rows, so UI and Markdown share one source of truth.
- The summary exposes total rows, candidate count, current rank, positive/risk counts, and the top non-current non-risk candidate.
- Wording uses "candidate for re-audit" and repeats the no-investment-advice boundary.
- The Backtest UI renders a compact three-card strip above the raw parameter table.

Verification target:
- Targeted `terminal-workbench` tests fail before implementation and pass after.
- Full `npm test`.
- Production `npm run build`.
- `git diff --check`.
- Local HTTP smoke check against the running Vite app.
- Browser automation smoke is currently blocked by local `node_repl` sandbox startup failure (`windows sandbox failed: spawn setup refresh`), so use HTTP smoke until that environment issue is resolved.

Verification result:
- Red phase: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts` failed because `buildBacktestParameterScanSummary` did not exist and Markdown lacked the summary section.
- Green phase: targeted `terminal-workbench` tests passed with 110 tests.
- `npm test`: Python 73 passed, frontend 205 passed.
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed with CRLF normalization warnings only.
- `Invoke-RestMethod http://127.0.0.1:5173/?workspace=strategy`: returned the Vite root page.
