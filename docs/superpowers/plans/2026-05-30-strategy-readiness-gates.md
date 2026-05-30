# Strategy Readiness Gates Implementation Plan

Goal: make Strategy Lab behave like a product workflow instead of a free-form editor by showing explicit readiness gates before a draft is saved, audited, reviewed by AI, or routed to paper execution.

P0 mapping:
- Strategy configuration must be structured and reproducible before backtest, AI review, and paper execution.
- Users need a visible gate summary when a selected context has pending rules or when a loaded strategy version requires a fresh audit.

Scope:
- Add a frontend `StrategyReadinessGate` model for schema, risk, execution mode, and audit evidence.
- Derive gate status from the active `TerminalWorkspace` and structured strategy draft.
- Render compact gates inside Strategy Lab near the generated strategy snapshot.
- Localize gate labels and details for the default Chinese UI.
- Keep audit gates as review/blocked until a reproducible `researchRun.runId` is bound.

Out of scope:
- Blocking the save button at the component level.
- Backend strategy schema validation endpoint.
- Strategy DSL or code-strategy adapters.
- Live trading enablement.

Progress:
- [x] Added red-green model tests for passing and pending Strategy Lab gate states.
- [x] Added `buildStrategyReadinessGates` to the frontend workbench model.
- [x] Rendered readiness gates in Strategy Lab with compact positive/warning/risk states.
- [x] Added i18n coverage for gate copy and layout guard assertions.

Verification:
- Targeted frontend model and layout tests.
- Full web/Python test suite.
- Production build.
- Browser smoke check on `/?workspace=strategy`.
