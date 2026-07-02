# Stage 1 Share Invalid Link Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make malformed or ambiguous Stage 1/P0 daily-use share links visible to operators instead of silently ignoring them.

**Architecture:** Keep the existing `resolveStage1P0DailyUseShareDeepLinkState` API as a valid-state convenience wrapper. Add a richer status resolver that returns `none`, `ready`, or `invalid` with a stable reason, then let the homepage show an invalid share banner and status label when Stage 1 share parameters are present but not usable.

**Tech Stack:** TypeScript URLSearchParams parsing, React, CSS, Vitest source-contract and model tests.

---

### Task 1: Lock the invalid share-link model contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] **Step 1: Add failing model tests**

Require `resolveStage1P0DailyUseShareDeepLinkStatus` to return:
- `{ status: "none", state: null }` when there are no Stage 1 share params.
- `{ status: "ready", reason: null, state: ... }` for valid daily-use and refresh receipt links.
- `{ status: "invalid", reason: "missing-workspace", state: null }` when a Stage 1 focus exists without `workspace`.
- `{ status: "invalid", reason: "duplicate-workspace", state: null }` when `workspace` appears more than once.
- `{ status: "invalid", reason: "ambiguous-focus", state: null }` when both daily-use and refresh focus params appear or one appears more than once.
- `{ status: "invalid", reason: "invalid-workspace", state: null }` for unknown workspace.
- `{ status: "invalid", reason: "invalid-daily-focus", state: null }` for unknown daily focus.
- `{ status: "invalid", reason: "invalid-refresh-focus", state: null }` for unknown refresh receipt focus.

- [x] **Step 2: Run the model test red**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "resolves Stage 1 daily-use share link status"`

Expected: FAIL because the status resolver is not implemented.

- [x] **Step 3: Implement the status resolver**

Add exported status/reason types and implement the resolver while keeping `resolveStage1P0DailyUseShareDeepLinkState` as a wrapper returning only `ready.state`.

- [x] **Step 4: Run the model test green**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "resolves Stage 1 daily-use share link status"`

Expected: PASS.

### Task 2: Show invalid share links in the homepage

**Files:**
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Add failing source-contract expectations**

Require:
- `resolveStage1P0DailyUseShareDeepLinkStatus(window.location.search)`
- `initialStage1P0DailyUseShareDeepLinkStatus`
- `stage1P0DailyUseShareLinkInvalidStatusLabel(initialStage1P0DailyUseShareDeepLinkStatus)`
- `stage1P0DailyUseShareLinkInvalidReasonLabel(i18n, initialStage1P0DailyUseShareDeepLinkStatus)`
- `className="stage1-p0-share-deep-link invalid"`
- invalid banner copy for both locales.
- invalid banner action that focuses `stage1-p0-daily-use-closure`.

- [x] **Step 2: Run the layout source test red**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: FAIL because the invalid banner and labels do not exist.

- [x] **Step 3: Implement invalid banner wiring**

Import and use the new status resolver, initialize the status bar with invalid share-link reasons, render an invalid banner below the P0 journey when no valid state exists, and add an invalid visual treatment using the existing banner layout.

- [x] **Step 4: Run the layout source test green**

Run: `npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"`

Expected: PASS.

### Task 3: Document, verify, and commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-share-invalid-link-feedback.md`

- [x] **Step 1: Update docs**

Document that invalid or ambiguous Stage 1 share links now produce a visible invalid banner and safe card-focus action, while still refusing to run commands or switch workspaces automatically.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "resolves Stage 1 daily-use share link status"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
```

Expected: all commands exit 0. Existing Vite chunk-size warning may remain.

- [x] **Step 3: Commit**

Commit message: `feat: flag invalid stage1 share links`
