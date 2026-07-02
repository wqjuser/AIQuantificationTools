# Stage 1 Invalid Share Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators copy a compact diagnosis for invalid Stage 1/P0 share links, including the reason, safe replacement entry, next manual action, and live-blocked boundary.

**Architecture:** Add a pure `buildStage1P0InvalidShareDiagnosticsCopyText` helper to the workbench model so the diagnostic Markdown is testable outside the React component. The App computes the current incoming search and fresh replacement URL, then exposes a third invalid-banner action that only writes the diagnostic text to the clipboard and status bar.

**Tech Stack:** React, TypeScript model helpers, Clipboard API, Vitest model tests, source-contract layout tests.

---

### Task 1: Lock the diagnostic copy contract

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] **Step 1: Add a model red test**

Add a test near the Stage 1 share-link status tests that imports and calls `buildStage1P0InvalidShareDiagnosticsCopyText` with an invalid `duplicate-workspace` status, incoming search, replacement URL, primary action label, and target workspace.

Require the Markdown to contain:
- `# Stage 1/P0 Invalid Share Link Diagnostics`
- `Status: invalid`
- `Reason: duplicate-workspace`
- `Incoming search: ?workspace=research&workspace=audit&stage1DailyUseFocus=primary`
- `Replacement link: http://127.0.0.1:5174/?workspace=audit&stage1DailyUseFocus=primary`
- `Safe action: Refresh P0 acceptance -> audit`
- `No workspace was restored from the invalid link.`
- `Live trading remains blocked.`

- [x] **Step 2: Add a UI source-contract red test**

Extend the existing Stage 1/P0 daily-use layout test to require:
- `const [copiedStage1P0InvalidShareDiagnostics, setCopiedStage1P0InvalidShareDiagnostics]`
- `buildStage1P0InvalidShareDiagnosticsCopyText({`
- `navigator.clipboard.writeText(diagnosticsCopyText)`
- `Stage 1 invalid share diagnostics copied`
- `Stage 1 invalid share diagnostics copy failed`
- `onClick={() => void copyStage1P0InvalidShareDiagnostics()}`
- `copiedStage1P0InvalidShareDiagnostics`
- `复制诊断`
- `Copy diagnostics`

- [x] **Step 3: Run the focused tests red**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "builds Stage 1 invalid share diagnostics copy text"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both fail because the helper and UI action do not exist yet.

### Task 2: Implement the diagnostic helper and invalid-banner action

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] **Step 1: Implement `buildStage1P0InvalidShareDiagnosticsCopyText`**

Export a helper that accepts the invalid status, incoming search, replacement link, primary action label, and target workspace. It must normalize empty incoming search and empty replacement link to `none`, include the reason when invalid, and preserve the live-blocked boundary line.

- [x] **Step 2: Wire the App clipboard action**

Import the helper, add `copiedStage1P0InvalidShareDiagnostics` state with the existing copy-reset effect, and add `copyStage1P0InvalidShareDiagnostics`. The callback should build `replacementLink` with `buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink)` and `incomingSearch` from `window.location.search` when available.

- [x] **Step 3: Add the invalid-banner button**

Render a third invalid-banner action. The button should call `copyStage1P0InvalidShareDiagnostics()`, display `复制诊断 / Copy diagnostics`, switch to `诊断已复制 / Diagnostics copied` after copy, and avoid navigation, refresh, audit writes, broker connections, or order submission.

- [x] **Step 4: Run the focused tests green**

Run:

```bash
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "builds Stage 1 invalid share diagnostics copy text"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
```

Expected: both pass.

### Task 3: Document, verify, and commit

**Files:**
- Modify: `README.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-07-02-stage1-invalid-share-diagnostics.md`

- [x] **Step 1: Update docs**

Document that invalid Stage 1 share banners can now copy a diagnostic Markdown summary as a manual handoff aid, while still avoiding auto-navigation, refresh, command execution, audit writes, broker connections, or orders.

- [x] **Step 2: Run verification**

Run:

```bash
git diff --check
npm run test --workspace @aiqt/web -- --run src/lib/terminal-workbench.test.ts -t "builds Stage 1 invalid share diagnostics copy text"
npm run test --workspace @aiqt/web -- --run src/lib/layout-css.test.js -t "Stage 1/P0 daily-use"
npm run test --workspace @aiqt/web -- --run
npm run build
curl -I "http://127.0.0.1:5174/?workspace=audit&stage1DailyUseFocus=primary"
```

Expected: all commands exit 0 except `curl` may fail only if the local dev server is not running. Existing Vite chunk-size warning may remain.

- [x] **Step 3: Commit**

Commit message: `feat: copy invalid stage1 share diagnostics`
