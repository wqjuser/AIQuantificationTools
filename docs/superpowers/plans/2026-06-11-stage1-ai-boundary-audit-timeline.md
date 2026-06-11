# Stage 1 AI Boundary Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current AI safety boundary discoverable in the Audit / AI evidence timeline and evidence index, matching the existing AI Review Record `boundary:evidence-explanation-only` evidence anchor.

**Architecture:** AI Review Run Record already stores the explanation-only boundary and exports it through `aiReviewRuns[].record.boundary`. This slice adds one derived timeline item for the current audited run when an AI boundary is available. The item points to the AI Review workspace, shares the existing boundary anchor, and becomes searchable through the existing export evidence index.

**Non-Goals:** Do not change AI prompts, regenerate AI output, loosen the explanation-only policy, create new recommendations, alter risk gates, run a backtest, or change any execution behavior.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a current audited run with an AI boundary produces an `ai-boundary-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=boundary:evidence-explanation-only`, `exportPath=aiReviewRuns[].record.boundary`, targets the AI Review workspace, and is searchable in the evidence index by the boundary anchor.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`

- [x] Extend `AiReviewAuditTimelineItemKind` with `ai-boundary-evidence`.
- [x] Insert one compact AI boundary item after decision-log evidence when `currentRunId` exists and a boundary string is available.
- [x] Route its export path to `aiReviewRuns[].record.boundary`.
- [x] Pass the current AI review boundary from the Audit panel and add localized timeline kind labels.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so the AI explanation-only boundary appears in the AI/Audit timeline and evidence index without loosening AI or execution gates.
- 2026-06-11: Verified RED Vitest coverage for the missing AI boundary timeline item, then added `ai-boundary-evidence` items targeting AI Review and mapped them to `aiReviewRuns[].record.boundary`.
- 2026-06-11: Verified with focused RED/GREEN Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no app console errors, and `git diff --check`.
