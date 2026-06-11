# Stage 1 Decision Log Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current AI decision log discoverable in the Audit / AI evidence timeline and evidence index, matching the existing AI Review Record `decision-log:<decisionCount>` evidence anchor.

**Architecture:** AI Review Run Record already stores the decision log and exports it through `aiReviewRuns[].record.decisionLog`. This slice adds one derived timeline item for the current audited run when decision log entries are available. The item points to the AI Review workspace, shares the existing decision-log anchor, and becomes searchable through the existing export evidence index.

**Non-Goals:** Do not regenerate AI output, change decision log messages, create new recommendations, alter risk gates, run a backtest, or change any execution behavior.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a current audited run with decision log entries produces a `decision-log-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=decision-log:<decisionCount>`, `exportPath=aiReviewRuns[].record.decisionLog`, targets the AI Review workspace, and is searchable in the evidence index by the decision-log anchor.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] Extend `AiReviewAuditTimelineItemKind` with `decision-log-evidence`.
- [x] Insert one compact decision-log item after committee-rounds evidence when `currentRunId` exists and `decisionCount > 0`.
- [x] Route its export path to `aiReviewRuns[].record.decisionLog`.
- [x] Pass the current AI review `decisionCount` from the Audit panel and add localized timeline kind labels.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so current AI decision logs appear in the AI/Audit timeline and evidence index without changing AI generation, messages, or execution gates.
- 2026-06-11: Verified RED Vitest coverage for the missing decision-log timeline item, then added `decision-log-evidence` items targeting AI Review and mapped them to `aiReviewRuns[].record.decisionLog`.
- 2026-06-11: Verified with focused RED/GREEN Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no console errors, and `git diff --check`.
