# AI Review Export Import Artifact Plan

## Objective

Make saved `aiqt.aiReviewRun` records part of the portable research run export package so audit replay on another local core can restore the AI committee evidence trail, not only the raw research run and paper execution history.

## Product Rationale

The platform is moving toward a full quant workflow where every downstream decision is traceable. AI review records already bind citations, committee rounds, decision logs, and the "evidence explanation only" boundary to a research run. If export/import drops those records, replayed runs lose the AI evidence needed for later risk approval, comparison, and audit review.

## Implementation Steps

1. Add a backend portable export/import test proving AI review records are exported with a research run and restored into the target `AiReviewRunStore`.
2. Add frontend API contract coverage so `ResearchRunExportPackage` accepts valid `aiReviewRuns` and rejects malformed AI review envelopes.
3. Extend `research_run_export_to_payload` with an `ai_review_runs` artifact list and `artifactCounts.aiReviewRuns`.
4. Add `research_run_import_ai_review_runs` and include AI review count validation in manifest consistency checks.
5. Wire `/api/research/runs/{runId}/export` to read `AiReviewRunStore`, and `/api/research/runs/import` to write imported records back to the target store.
6. Update product, architecture, and implementation plan docs.

## Acceptance Criteria

- Export packages include `aiReviewRuns` and `manifest.artifactCounts.aiReviewRuns`.
- Import rejects malformed AI review artifacts or mismatched run ids.
- Import restores valid `aiReviewRuns[].record` into `AiReviewRunStore`.
- Frontend export package guards reject malformed AI review record envelopes.
- Product and architecture docs describe AI review records as portable audit artifacts.

## Verification Log

- Passed red: backend target test failed with missing `artifactCounts.aiReviewRuns`.
- Passed red: frontend target test failed because malformed `aiReviewRuns` were accepted.
- Passed green: backend target test passed after adding AI review export/import support.
- Passed green: frontend `terminal-api` contract test passed after adding `aiReviewRuns` types and guards.
- Passed: backend target test `python -m unittest tests.test_quant_core.QuantCoreContractTest.test_research_run_export_import_preserves_ai_review_records`.
- Passed: backend mismatch test `python -m unittest tests.test_quant_core.QuantCoreContractTest.test_research_run_import_rejects_ai_review_run_id_mismatch`.
- Passed: frontend target test `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts`.
- Passed: full `npm test` with Python 77 tests and frontend 211 tests.
- Passed: `npm run build`; Vite reported the existing large chunk warning.
- Passed: `git diff --check`; only CRLF normalization warnings were reported.
- Pending: commit and push.
