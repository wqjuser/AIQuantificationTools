# Strategy Save Preflight Implementation Plan

Goal: prevent blocked Strategy Lab drafts from entering the strategy library before they can become auditable versions.

P0 mapping:
- Strategy versions are part of the evidence chain and must not accept drafts that fail core schema or risk gates.
- Frontend and backend must use the same validation contract for save, pipeline, AI review, and future execution.

Scope:
- Reuse `validate_strategy_snapshot` inside `POST /api/strategies`.
- Return `strategy_not_ready` with validation gates when a blocked draft attempts to save.
- Make the frontend save action run core preflight before calling the save endpoint.
- Preserve fallback handling while surfacing core validation gates from a 400 save response.

Out of scope:
- Changing the strategy library schema.
- Adding validation status columns to existing records.
- Blocking review-status drafts that only need an audit run.

Progress:
- [x] Backend save endpoint rejects blocked drafts before writing to the library.
- [x] API client surfaces validation gates from blocked save responses.
- [x] Frontend save action runs Strategy Lab preflight and stays in the strategy workspace when blocked.
- [x] Product and architecture docs updated.

Verification:
- Backend API test for blocked save rejection and no library write.
- Frontend API/layout tests for blocked save validation and save preflight.
- Full Python and web test suite.
- Production build.
- Browser smoke check on Strategy Lab readiness after service restart.
