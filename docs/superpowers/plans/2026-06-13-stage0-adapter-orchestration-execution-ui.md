# Stage 0 - Adapter Orchestration Execution UI Integration

## Goal

Connect the controlled adapter orchestration execution evidence contract to the visible product workflow. The previous slice added backend and typed API support; this slice makes the evidence recordable from Settings and visible in the Execution promotion queue.

## Scope

- Load recent adapter orchestration execution history during Settings refresh.
- Add Settings confirmation controls and a record action for completed orchestration dry-runs.
- Show the latest orchestration execution evidence in Promotion Queue.
- Keep the capability paper-only and live-blocked.
- Update product plan after implementation.

## Guardrails

- No broker connection.
- No sandbox, paper, or live order submission.
- No environment variable writes.
- No service restart.
- Never set `liveTradingAllowed` to `true`.
- UI copy must not imply real capital or real order routing.

## TDD Checklist

- [x] RED: App integration test fails because orchestration execution history and controls are not wired.
- [x] GREEN: Settings can record orchestration execution evidence and Promotion Queue can display it.
- [x] DOCS: update product plan and close this plan.
- [x] VERIFY: focused orchestration UI test, production build, full Python/Web test suite, Docker smoke, browser checks, and `git diff --check` passed.
- [x] SHIP: committed as `0bba316` and pushed through the configured proxy.
