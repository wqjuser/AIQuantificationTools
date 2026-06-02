# Imported Strategy Library Restore Plan

## Objective

When an `aiqt.researchRun.export` package is imported, restore the package's `researchRun.strategyConfig` into the local strategy library as an audited version bound to the imported run id.

## Product Rationale

Importing a research run should not only replay the chart and backtest. The user should be able to continue the workflow in Strategy Lab, compare the imported strategy version, and re-audit a modified draft. If the imported run appears in Audit history but its strategy is missing from the strategy library, the product feels broken and the audit chain is harder to follow.

## Implementation Steps

1. Add a backend API test proving `/api/research/runs/import` writes an audited strategy version after importing a package with `researchRun.strategyConfig`.
2. Add a store-level test proving imported strategy payloads preserve their external `revision` instead of being re-hashed.
3. Add `StrategyLibraryStore.save_payload(...)` for trusted imported/audited strategy config payloads.
4. Wire import API success to save importable `audit.strategy_config` with `audit_run_id=audit.run_id`.
5. Update product and architecture docs.

## Acceptance Criteria

- Importing a research run package creates a strategy library record for the package's strategy config.
- The restored strategy record keeps the original package revision.
- The restored strategy status is `audited` and `auditRunId` equals the imported run id.
- Import skips missing or non-importable strategy configs instead of creating noisy unknown strategy records.
- Tests and docs reflect the behavior.

## Verification Log

- Passed red: import API test failed because `/api/strategies` returned zero strategies after run import.
- Passed green: target import API test passed after saving imported strategy config to `StrategyLibraryStore`.
- Passed green: store-level imported revision preservation test passed.
- Fixed: full test run exposed import API test isolation gaps where portable import handlers lacked a temporary `StrategyLibraryStore`; all affected tests now use per-test SQLite stores.
- Passed: full `npm test` with Python 78 tests and frontend 211 tests.
- Passed: `npm run build`; Vite reported the existing large chunk warning.
- Passed: `git diff --check`; only CRLF normalization warnings were reported.
- Pending: commit and push.
