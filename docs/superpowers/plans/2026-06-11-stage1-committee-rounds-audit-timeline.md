# Stage 1 Committee Rounds Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current AI committee rounds discoverable in the Audit / AI evidence timeline and evidence index, matching the existing AI Review Record `committee:<roundCount>-rounds` evidence anchor.

**Architecture:** AI Review Run Record already stores TradingAgents-style committee rounds and exports them through `aiReviewRuns[].record.rounds`. This slice adds one derived timeline item for the current audited run when committee rounds are available. The item points to the AI Review workspace, shares the existing committee anchor, and becomes searchable through the existing export evidence index.

**Non-Goals:** Do not regenerate AI output, change committee scoring, create new recommendations, alter risk gates, run a backtest, or change any execution behavior.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a current audited run with committee rounds produces a `committee-rounds-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=committee:<roundCount>-rounds`, `exportPath=aiReviewRuns[].record.rounds`, targets the AI Review workspace, and is searchable in the evidence index by the committee anchor.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] Extend `AiReviewAuditTimelineItemKind` with `committee-rounds-evidence`.
- [x] Insert one compact committee-rounds item after the current strategy evidence when `currentRunId` exists and `roundCount > 0`.
- [x] Route its export path to `aiReviewRuns[].record.rounds`.
- [x] Pass the current AI review `roundCount` from the Audit panel and add localized timeline kind labels.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so current AI committee rounds appear in the AI/Audit timeline and evidence index without changing AI generation or execution gates.
- 2026-06-11: Verified RED Vitest coverage for the missing committee timeline item, then added `committee-rounds-evidence` items targeting AI Review and mapped them to `aiReviewRuns[].record.rounds`.
- 2026-06-11: Verified with focused RED/GREEN Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no console errors, and `git diff --check`.
