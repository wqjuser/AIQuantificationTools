# Strategy Validation Contract Implementation Plan

Goal: move Strategy Lab readiness from a front-end-only hint into a reusable local-core contract that can be shared by saving, audited backtests, AI review, and later execution handoff.

P0 mapping:
- Strategy configuration must be validated before evidence is trusted.
- Backend and frontend need the same readiness vocabulary: schema, risk, execution, and audit evidence.
- Offline-first UI still needs a local fallback when the Python core is unavailable.

Scope:
- Add a Python `strategy_validation` module with structured validation gates.
- Add `POST /api/strategies/validate` accepting the same context and `StrategySnapshot` used by strategy save.
- Return overall status, stable revision, normalized `strategyConfig`, and gate rows.
- Add a front-end API client for the validation endpoint.
- Make Strategy Lab prefer core validation gates and display whether the source is core validation or local fallback.

Out of scope:
- Blocking save or pipeline actions from the UI.
- Replacing the existing backtest strategy parser.
- Strategy DSL support beyond the current SMA builder.

Progress:
- [x] Backend validation model and API endpoint.
- [x] Frontend validation URL/client contract.
- [x] Strategy Lab consumes core validation with local fallback.
- [x] Product and architecture docs updated.

Verification:
- Backend unit/API tests for ready and blocked validation gates.
- Frontend API and layout tests.
- Full Python and web test suite.
- Production build.
- Browser smoke check on Strategy Lab.
