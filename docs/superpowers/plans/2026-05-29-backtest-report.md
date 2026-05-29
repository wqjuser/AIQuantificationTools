# Backtest Report Implementation Plan

Goal: promote the Backtest Lab from a replay table into an auditable report that can be handed to AI review and paper execution without losing evidence boundaries.

P0 mapping:
- Product work area: Backtest Lab.
- Golden path step: strategy + data snapshot -> reproducible backtest -> AI review -> paper execution.
- User task: inspect whether a run has enough audited evidence before asking AI to explain it or staging simulated execution.

Scope:
- Add a `BacktestReport` frontend model that joins run id, assumptions, metrics, trades, equity curve, diagnostics, evidence cards, benchmark comparison, and readiness gates.
- Block the report when no reproducible run exists.
- Mark AI review readiness separately from execution handoff readiness.
- Replace the Backtest Lab replay-only panel with a report surface while keeping editable assumptions and trade replay.
- Carry the audited data snapshot in `researchRun` workspace summaries so the report can compute a same-symbol buy-and-hold baseline without a second data source.
- Keep the report tied to existing audited run and fallback workspace contracts; no new backend endpoint in this slice.

Out of scope:
- Multi-symbol portfolio backtesting.
- Parameter scans and optimizer output.
- Benchmark comparison charts beyond the current buy-and-hold strip.
- PDF/HTML report export.
- Backend persistence schema changes.

Progress:
- [x] Contract tests for ready and blocked `BacktestReport` states.
- [x] Layout contract for the Backtest Lab report structure.
- [x] `buildBacktestReport` model in the terminal workbench library.
- [x] Same-snapshot buy-and-hold benchmark return and alpha are included in the report.
- [x] Backtest Lab panel now renders an auditable report, evidence package, readiness gates, equity/diagnostic summary, assumptions, and trade replay.
- [x] `/api/research/run` workspace summaries now carry the audited data snapshot for immediate benchmark calculation.
- [x] Product plan and architecture documentation updated.

Verification:
- Targeted frontend tests for `terminal-workbench` and layout contracts.
- Full Python + frontend test suite.
- Production build.
- Browser smoke check on the Backtest workspace.
