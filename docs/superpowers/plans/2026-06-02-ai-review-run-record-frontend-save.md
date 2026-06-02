# AI Review Run Record Frontend Save Plan

## Objective

Connect the AI Review panel to the local core `ai-reviews` API so a structured `aiqt.aiReviewRun` record can be saved, reloaded during audit replay/import, and shown as part of the evidence trail instead of only being downloaded as a local JSON file.

## Product Rationale

The platform goal is a full quant workflow, not isolated cards. AI review output should become an auditable artifact bound to a research run, the same way paper executions and promotion candidates are bound to a run. This lets later risk approval, replay, export/import, and live promotion refer to the exact AI evidence package that was reviewed.

## Implementation Steps

1. Add frontend API tests for building, posting, and loading `/api/research/runs/{runId}/ai-reviews`.
2. Add typed API client functions and contract guards for AI review record save/history.
3. Add AI Review panel controls to save the current review record to core and show recent saved records for the active run.
4. Load AI review records when a research run is replayed or imported.
5. Update product and architecture docs to mark the frontend integration complete.
6. Run frontend/backend test suite, production build, diff check, and browser smoke verification.

## Acceptance Criteria

- The save API posts the full AI review run record with `Content-Type: application/json`.
- The load API returns recent records for a run and rejects invalid payloads into fallback state.
- The AI Review panel can save a record after an audited run exists and reflects the saved record in the UI.
- Replay/import of an audited run restores saved AI review records when the core has them.
- Planning documentation reflects the current state after implementation.

## Verification Log

- Passed: API client red test failed because `saveAiReviewRunRecord` and `loadResearchRunAiReviews` were missing.
- Passed: `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts` after adding the API client.
- Fixed: browser smoke exposed a contract mismatch where the frontend posted `{ record }` but the core API expects the raw `aiqt.aiReviewRun` record body. Updated the API client test to fail on the wrapper body, then changed the client to post the raw record.
- Passed: browser smoke after restarting the stale local core API process; running the pipeline enabled Save Record and persisted one visible AI review record in the panel.
- Passed: `npm test` with Python 75 tests and frontend 210 tests.
- Passed: `npm run build`; Vite reported the existing large chunk warning.
- Passed: `git diff --check`; only CRLF normalization warnings were reported.
- Passed: browser smoke at `http://127.0.0.1:5173/?workspace=ai-review`.
- Passed: pushed `f0396b7 feat: save ai review run records` to `origin/codex/p0-product-workspaces`.
