# Stage 1 Preparation Evidence Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make audited data-preparation evidence discoverable in the Audit / AI evidence timeline and evidence index, matching the market-calendar evidence path.

**Architecture:** `researchRun.dataSnapshot.preparationEvidence` is already locked into audited runs and surfaced in AI anchors, Backtest Markdown, export preview, package browser, recent package index, and import diff. This slice adds one derived timeline item for the current audited run when that snapshot exists. The item points to `researchRun.dataSnapshot.preparationEvidence`, links back to Backtest evidence, and becomes searchable through the existing `buildAiReviewExportEvidenceIndexRows` path.

**Non-Goals:** Do not change cache refresh behavior, research pipeline gates, execution gates, live-trading readiness, import validation, or report signing.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a run with `dataSnapshot.preparationEvidence` produces a `data-preparation-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=preparationEvidence:<runId>`, `exportPath=researchRun.dataSnapshot.preparationEvidence`, and is searchable in the evidence index by the refresh run id.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Extend `AiReviewAuditTimelineItemKind` with `data-preparation-evidence`.
- [x] Add an optional `preparationEvidence` argument to `buildAiReviewAuditTimelineItems`.
- [x] Insert one compact data-preparation item after current audit evidence when present.
- [x] Route its export path to `researchRun.dataSnapshot.preparationEvidence`.

### Task 3: UI Wiring And Docs

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Pass the current audited run's `dataSnapshot.preparationEvidence` into `buildAiReviewAuditTimelineItems`.
- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so locked data-preparation snapshots appear in the AI/Audit timeline and evidence index.
- 2026-06-11: Verified RED Vitest coverage for the missing data-preparation timeline item, then added `data-preparation-evidence` items and wired the Audit panel to the current audited run snapshot.
- 2026-06-11: Updated the product plan to record that locked data-preparation evidence is now searchable from the AI/Audit timeline without refreshing data or changing execution gates.
- 2026-06-11: Verified with focused Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no console errors, and `git diff --check`.
