# Strategy Pipeline Preflight Implementation Plan

Goal: make Strategy Lab readiness operational by preventing blocked drafts from entering the research/backtest pipeline.

P0 mapping:
- Strategy Lab must produce auditable, structured strategy input.
- Research runs must not be created from drafts that fail core schema or risk gates.
- UI defaults must match the canonical strategy text sent to the Python core.

Scope:
- Normalize the default Strategy Lab risk text so the visible structured editor and backend validation agree.
- Reuse `validate_strategy_snapshot` inside `/api/research/run` before fetching data or recording an audit run.
- Return a clear `strategy_not_ready` response with validation gates when a blocked draft attempts to run.
- Add a frontend preflight step before the research pipeline starts and keep blocked users in Strategy Lab.

Out of scope:
- Blocking strategy library draft saves.
- Adding non-SMA strategy DSL.
- Replacing the existing text snapshot with a persisted structured JSON draft.

Progress:
- [x] Backend default strategy risk text includes explicit take profit.
- [x] Frontend default strategy risk text matches the structured editor defaults.
- [x] `/api/research/run` rejects blocked strategy drafts before creating audit evidence.
- [x] Frontend pipeline action performs strategy preflight and stops on blocked gates.

Verification:
- Backend tests for default preflight readiness and blocked pipeline rejection.
- Frontend model/layout tests for canonical defaults and preflight gating.
- Full Python and web test suite.
- Production build.
- Browser smoke check on Strategy Lab pipeline preflight.
