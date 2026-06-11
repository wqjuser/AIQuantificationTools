# Stage 1 Data Snapshot Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the locked audited data snapshot hash discoverable in the Audit / AI evidence timeline and evidence index, matching the existing AI Review Record `data:<hash>` evidence anchor.

**Architecture:** `researchRun.dataSnapshot.hash` is already part of audited runs, AI Review Run Record evidence anchors, export preview, package browser, recent package index, import diff, and Markdown reports. This slice adds one derived timeline item for the current audited run when a snapshot hash exists. The item points to `researchRun.dataSnapshot.hash`, links back to Backtest evidence, and becomes searchable through the existing `buildAiReviewExportEvidenceIndexRows` path.

**Non-Goals:** Do not change data hashing, cache refresh behavior, research pipeline gates, import validation, execution gates, live-trading readiness, or report signing.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a run with `dataSnapshot.hash` produces a `data-snapshot-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=data:<hash>`, `exportPath=researchRun.dataSnapshot.hash`, and is searchable in the evidence index by the hash.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Extend `AiReviewAuditTimelineItemKind` with `data-snapshot-evidence`.
- [x] Add an optional `dataSnapshot` argument to `buildAiReviewAuditTimelineItems`.
- [x] Insert one compact data-snapshot item after current audit evidence when a hash exists.
- [x] Route its export path to `researchRun.dataSnapshot.hash`.

### Task 3: UI Wiring And Docs

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Pass the current audited run's `dataSnapshot` into `buildAiReviewAuditTimelineItems`.
- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so locked data snapshot hashes appear in the AI/Audit timeline and evidence index.
- 2026-06-11: Verified RED Vitest coverage for the missing data-snapshot timeline item, then added `data-snapshot-evidence` items and wired the Audit panel to the current audited run snapshot.
- 2026-06-11: Updated the product plan to record that locked data snapshot hashes are now searchable from the AI/Audit timeline without changing hash generation, import validation, or execution gates.
- 2026-06-11: Verified with focused Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no console errors, and `git diff --check`.
