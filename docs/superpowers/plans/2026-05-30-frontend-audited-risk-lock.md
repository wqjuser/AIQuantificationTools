# Frontend Audited Risk Lock Implementation Plan

Goal: make frontend risk approval and promotion fallback use the audited run's structured risk configuration before reading the editable strategy draft.

P0 mapping:
- Risk approval must be evidence-locked to the same run that produced the backtest and AI review.
- Editing the visible Strategy Lab draft after an audit must not silently change execution approval for that historical run.
- Frontend fallback behavior must match the backend promotion and paper-execution safety gates.

Scope:
- Keep `ResearchRunSummary.strategyConfig` when replaying a full `ResearchRunAudit`.
- Use audited `strategyConfig.risk` for risk approval position and drawdown checks when available.
- Fall back to the current draft only for legacy or incomplete run summaries that do not include structured strategy config.
- Add regression coverage proving edited visible drafts cannot contaminate an audited run's risk approval.

Out of scope:
- New strategy editor UI controls.
- Portfolio-level risk aggregation.
- Backend API changes.

Progress:
- [x] Add failing frontend model test for edited draft versus audited risk.
- [x] Preserve strategy config in `ResearchRunSummary`.
- [x] Use audited risk in `buildRiskApprovalSummary`.
- [x] Keep legacy fallback behavior when no audited strategy config is present.
- [x] Run full verification.

Verification:
- [x] `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts --run -t "uses audited strategy risk"`
- [x] `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts --run`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
