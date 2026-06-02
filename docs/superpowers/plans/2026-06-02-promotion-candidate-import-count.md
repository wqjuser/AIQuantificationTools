# Promotion Candidate Import Count Plan

## Objective

Reject imported `aiqt.researchRun.export` packages when `manifest.artifactCounts.promotionCandidates` does not match the package's `promotionCandidate` artifact.

## Product Rationale

Promotion candidates are derived from audited evidence and paper execution history, but they are still part of the exported evidence package. The import validator already checks data, trades, research notes, paper executions, and AI review records. Leaving `promotionCandidates` unchecked lets a tampered package claim live-promotion evidence that is missing, or hide a candidate that is present.

## Implementation Steps

1. Add a failing backend import test that tampers `artifactCounts.promotionCandidates`.
2. Normalize the package `promotionCandidate` during import using the existing run-bound candidate rules.
3. Include `promotionCandidates` in manifest consistency checks.
4. Update product and architecture docs.

## Acceptance Criteria

- Import rejects packages where `promotionCandidates` count is 1 but no valid run-bound candidate exists.
- Import rejects packages where `promotionCandidates` count is 0 but a valid candidate artifact is present.
- Existing packages without the optional count remain importable unless they carry a candidate.
- The check does not persist promotion candidates because the runtime derives them from audit and paper execution records.

## Verification Log

- Passed red: target backend test failed because a tampered `promotionCandidates` count imported without error.
- Passed green: target backend test passed after adding promotion candidate count validation.
- Passed: full `npm test` with Python 79 tests and frontend 211 tests.
- Passed: `npm run build`; Vite reported the existing large chunk warning.
- Passed: `git diff --check`; only CRLF normalization warnings were reported.
- Pending: commit and push.
