# Paper Execution History Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make persisted paper execution records visible after audited run replay or import, so the execution center reflects stored evidence instead of only the current browser session.

**Architecture:** Reuse the existing run-scoped paper execution history endpoint. The frontend API exposes a `loadLatestResearchRunPaperExecution` helper that returns the newest execution record, and `App` loads it after replay/import binds an audited `ResearchRunAudit`.

**Tech Stack:** React/TypeScript, Vitest, existing Python API.

---

### Task 1: Frontend Paper Execution History Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add a failing test for loading the latest paper execution by audited run id.
- [x] Add a test proving empty history stays a core response without an execution.
- [x] Implement `loadLatestResearchRunPaperExecution` on top of the existing history endpoint.

### Task 2: Replay/Import Integration

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/i18n.ts`

- [x] Load the latest paper execution after audited run replay.
- [x] Load the latest paper execution after imported audited run detail is persisted.
- [x] Restore persisted execution rows when history exists; otherwise keep projected paper rows.
- [x] Add localized status text for recovered paper execution history.

### Task 3: Verification

**Files:**
- Check: all changed files

- [x] Run focused frontend API tests.
- [x] Run a production web build.
- [x] Run `npm test`.
- [x] Verify local API still returns paper execution history for a generated run.
- [x] Verify the in-app browser loads without console errors.
- [x] Commit and push the completed slice.
