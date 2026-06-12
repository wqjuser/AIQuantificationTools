# Stage 0 P0 Outcome Evidence Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the P0 current-task latest evidence row copy a portable evidence link so audited runs and paper execution evidence can be reopened from the product shell.

**Architecture:** Add a pure `buildP0PlatformActionOutcomeEvidenceLink` helper next to the P0 outcome model. The helper returns URL path/query fragments only: audit outcomes point to `workspace=audit&runId=...&exportPath=manifest:...`, paper execution outcomes point to `workspace=execution&paperExecution=...&runId=...`, and waiting outcomes return `null`. App-level code converts the fragment into the current origin URL and writes it to the clipboard while preserving existing "open evidence" behavior.

**Tech Stack:** React, TypeScript, Vitest, existing P0 outcome model and browser clipboard APIs.

---

### Task 1: Pure Evidence Link Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Add RED coverage for audit run link fragments.
- [x] Add RED coverage for paper execution link fragments.
- [x] Add RED coverage that waiting outcomes return `null`.
- [x] Implement `P0PlatformActionOutcomeEvidenceLink` and `buildP0PlatformActionOutcomeEvidenceLink`.
- [x] Verify the focused model tests pass.

### Task 2: Current Task Clipboard Action

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `apps/web/src/styles.css`

- [x] Add RED layout coverage for a second P0 outcome action button that calls `copyP0ActionOutcomeEvidenceLink`.
- [x] Add App state for copied P0 outcome evidence id.
- [x] Implement `copyP0ActionOutcomeEvidenceLink` using the pure helper and `navigator.clipboard.writeText`.
- [x] Render the copy link button only when an evidence link exists.
- [x] Add compact button styling without changing the current card layout.
- [x] Verify the focused layout test passes.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with portable P0 evidence link behavior.
- [x] Run focused P0 model/layout tests.
- [x] Run production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-12: Planned a Stage 0 slice to make P0 latest outcome evidence portable through copyable Audit/Execution links.
- 2026-06-12: Verified RED model failures for missing run id/link helper, implemented `buildP0PlatformActionOutcomeEvidenceLink`, and passed focused P0 outcome model tests.
- 2026-06-12: Verified RED layout failures for missing copy action wiring, then added the current-task copy link button, clipboard handler, and compact button-group CSS; focused P0 outcome layout tests passed.
- 2026-06-12: Verified focused P0 outcome model/layout tests, production build, full `npm test`, Docker smoke on port 5173, browser smoke on a clean Research workspace with no console errors, and `git diff --check`.
