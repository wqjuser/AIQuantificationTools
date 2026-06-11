# Stage 1 Strategy Revision Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the audited strategy revision discoverable in the Audit / AI evidence timeline and evidence index, matching the existing AI Review Record `strategy:<revision>` evidence anchor.

**Architecture:** `researchRun.strategyRevision` is already part of audited runs, AI Review Run Record evidence anchors, export preview, import diff, and Markdown reports. This slice adds one derived timeline item for the current audited run when a non-draft revision exists. The item points to `researchRun.strategyConfig.revision`, links to the Strategy workspace, and becomes searchable through the existing `buildAiReviewExportEvidenceIndexRows` path.

**Non-Goals:** Do not change strategy validation, strategy library persistence, strategy loading, research pipeline gates, backtest output, import validation, or execution gates.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a current audited run produces a `strategy-revision-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=strategy:<revision>`, `exportPath=researchRun.strategyConfig.revision`, targets the Strategy workspace, and is searchable in the evidence index by the revision.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Extend `AiReviewAuditTimelineItemKind` with `strategy-revision-evidence`.
- [x] Insert one compact strategy-revision item after current audit evidence when `currentRunId` exists and the revision is not `draft`.
- [x] Route its export path to `researchRun.strategyConfig.revision`.
- [x] Adjust existing timeline order expectations to account for the new direct strategy evidence row.

### Task 3: UI Wiring And Docs

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Add localized timeline kind labels for the new strategy-revision item.
- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so audited strategy revisions appear in the AI/Audit timeline and evidence index.
- 2026-06-11: Verified RED Vitest coverage for the missing strategy-revision timeline item, then added `strategy-revision-evidence` items targeting Strategy and mapped them to `researchRun.strategyConfig.revision`.
- 2026-06-11: Updated existing timeline order expectations to account for the new direct strategy evidence row after current audit evidence.
- 2026-06-11: Updated the product plan to record that audited strategy revisions are now searchable from the AI/Audit timeline without loading, saving, rerunning, or changing execution gates.
- 2026-06-11: Verified with focused RED/GREEN Vitest, existing timeline-order Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no console errors, and `git diff --check`.
