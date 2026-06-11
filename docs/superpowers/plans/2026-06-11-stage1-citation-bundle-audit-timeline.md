# Stage 1 Citation Bundle Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current AI citation bundle discoverable in the Audit / AI evidence timeline and evidence index, complementing the existing per-citation `citation:<id>` evidence anchors.

**Architecture:** AI Review Run Record already stores individual citations and exports them through `aiReviewRuns[].record.citations`. This slice adds one compact timeline item for the current audited run when citations are available. The item points to the AI Review workspace, targets the citations array, and keeps the timeline readable while the evidence index continues to expose individual citation anchors.

**Non-Goals:** Do not regenerate AI output, change citation contents, add investment recommendations, alter risk gates, run a backtest, or change any execution behavior.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a current audited run with citations produces a `citation-bundle-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=citations:<citationCount>`, `exportPath=aiReviewRuns[].record.citations`, targets the AI Review workspace, and is searchable in the evidence index by the citation anchor.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] Extend `AiReviewAuditTimelineItemKind` with `citation-bundle-evidence`.
- [x] Insert one compact citation-bundle item after the current audit evidence when `currentRunId` exists and `citationCount > 0`.
- [x] Route its export path to `aiReviewRuns[].record.citations`.
- [x] Pass the current AI citation count from the Audit panel and add localized timeline kind labels.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so the AI citation bundle appears in the AI/Audit timeline without duplicating every per-citation row.
- 2026-06-11: Verified RED Vitest coverage for the missing citation-bundle timeline item, then added `citation-bundle-evidence` items targeting AI Review and mapped them to `aiReviewRuns[].record.citations`.
- 2026-06-11: Verified with focused RED/GREEN Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no app console errors, and `git diff --check`.
