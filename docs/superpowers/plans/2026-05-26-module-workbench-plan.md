# Module Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the A+C direction concrete by turning terminal modules into functional center workspaces and expanding Node Workflow into the orchestration entry.

**Architecture:** Add derived module view models in `terminal-workbench.ts`, localize their labels in `i18n.ts`, and render module-specific center panels from `App.tsx`. Keep the existing watchlist chart layout as the default module.

**Tech Stack:** React, TypeScript, Vitest, existing Python core.

---

### Task 1: Derived Module Data

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [ ] Write tests for scanner candidates, portfolio exposure rows, news/event rows, and workflow node view data.
- [ ] Run `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts` and verify the new tests fail.
- [ ] Add focused helper functions that derive rows from `TerminalWorkspace`.
- [ ] Re-run the same test and verify it passes.

### Task 2: UI Copy

**Files:**
- Modify: `apps/web/src/lib/i18n.ts`
- Test: `apps/web/src/lib/i18n.test.ts`

- [ ] Add translation tests for the new module panel labels.
- [ ] Run `npm run test --workspace @aiqt/web -- src/lib/i18n.test.ts` and verify they fail.
- [ ] Add Chinese and English labels.
- [ ] Re-run the same test and verify it passes.

### Task 3: Center Workspace Rendering

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] Replace the single static center grid with a module-aware renderer.
- [ ] Keep Watchlist rendering the existing chart, strategy, workflow summary, and execution panels.
- [ ] Add Scanner, Portfolio, News, and Workflow views with real buttons, rows, and state derived from the workspace.
- [ ] Add restrained terminal-style CSS for tables, node canvas, event cards, and risk rows.

### Task 4: Verification

**Files:**
- No source file changes expected.

- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Verify in the browser that each left module switches the center workspace and Workflow shows a larger node surface.
