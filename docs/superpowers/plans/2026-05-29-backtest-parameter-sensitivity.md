# Backtest Parameter Sensitivity Implementation Plan

Goal: help the Backtest Lab show whether an audited SMA strategy is robust across nearby parameters instead of treating one run as enough evidence.

P0 mapping:
- Product work area: Backtest Lab.
- Golden path step: strategy + audited data snapshot -> parameter sensitivity -> AI review -> risk approval.
- User task: compare nearby entry/exit SMA combinations on the same locked K-line snapshot before promoting a strategy.

Scope:
- Add a frontend `BacktestParameterScanRow` model.
- Build nearby SMA combinations from the active strategy draft: current window, minus five, plus five, normalized into valid windows.
- Re-run a deterministic long-only SMA scan against `researchRun.dataSnapshot.bars`.
- Include return, max drawdown, trade count, delta vs current audited return, current/candidate status, run id, data hash, and row tone.
- Render the scan inside Backtest Lab and include it in the Backtest Markdown report.
- Allow a non-current candidate row to be staged as a Strategy Lab draft, clearing the old audited run and requiring a new pipeline run.
- Keep the wording as sensitivity analysis, not optimizer or recommendation.

Out of scope:
- Backend optimizer endpoint.
- Multi-symbol parameter scans.
- Walk-forward validation.
- Genetic/grid optimizer UX.
- AI-generated parameter recommendations.

Progress:
- [x] Contract tests for scan rows from an audited data snapshot.
- [x] Blocked state returns no rows when no audited snapshot exists.
- [x] Backtest Markdown report includes a Parameter Sensitivity section.
- [x] Backtest Lab renders the parameter scan table.
- [x] Parameter candidates can be staged back into Strategy Lab as fresh unaudited drafts.
- [x] i18n labels and layout contracts updated.
- [x] Product plan and architecture documentation updated.

Verification:
- Targeted frontend tests for `terminal-workbench`, layout contracts, and i18n.
- Full Python + frontend test suite.
- Production build.
- Browser smoke check on the Backtest workspace.
