# Paper Preview Audit Sizing Implementation Plan

Goal: make frontend paper trading previews use the same audited position sizing contract as backend paper execution.

P0 mapping:
- The Execution Center should not show one projected order size and then submit a different backend order.
- Paper Trading evidence must stay tied to audited strategy risk and backtest assumptions.
- Editing the visible draft after audit must not inflate projected paper order size for the locked run.

Scope:
- Add frontend model coverage for an audited run whose `strategyConfig.risk.positionPct` is lower than the visible draft.
- Compute preview target notional as `min(initialCash * audited positionPct, 20,000)` when audited risk exists.
- Reuse the same target notional for paper order preview and projected paper position preview.
- Preserve legacy fallback behavior for contexts without audited strategy config.

Out of scope:
- Backend paper execution changes.
- Multi-position or portfolio-level sizing.
- Live broker sizing.

Progress:
- [x] Add failing model test for audited paper preview sizing.
- [x] Add audited target-notional helper.
- [x] Use audited sizing in paper trading preview rows.
- [x] Use audited sizing in projected paper position rows.
- [x] Run full verification.

Verification:
- [x] `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts --run -t "sizes paper trading previews"`
- [x] `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts --run`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
