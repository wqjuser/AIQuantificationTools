# Stage 1 Market Calendar Audit Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make audited market-calendar evidence discoverable in the Audit / AI evidence timeline and evidence index, not only in reports and export-package tables.

**Architecture:** `researchRun.dataSnapshot.marketCalendar` is already locked into audited runs and surfaced in AI anchors, Backtest Markdown, export preview, package browser, recent package index, and import diff. This slice adds one derived timeline item for the current audited run when that snapshot exists. The item points to `researchRun.dataSnapshot.marketCalendar`, links back to Backtest evidence, and becomes searchable through the existing `buildAiReviewExportEvidenceIndexRows` path.

**Non-Goals:** Do not change execution gates, live-trading readiness, market calendar generation, import validation, or report signing.

---

### Task 1: RED Test

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] Add a Vitest case proving a run with `dataSnapshot.marketCalendar` produces a `market-calendar-evidence` timeline item.
- [x] Assert the item uses `exportAnchor=marketCalendar:<market>:<tradingDay>`, `exportPath=researchRun.dataSnapshot.marketCalendar`, and is searchable in the evidence index by `marketCalendar`.
- [x] Run the focused test and verify it fails before implementation.

### Task 2: Timeline Implementation

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`

- [x] Extend `AiReviewAuditTimelineItemKind` with `market-calendar-evidence`.
- [x] Add an optional `marketCalendar` argument to `buildAiReviewAuditTimelineItems`.
- [x] Insert one compact calendar item after current audit evidence when present.
- [x] Route its export path to `researchRun.dataSnapshot.marketCalendar`.

### Task 3: UI Wiring And Docs

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Pass the current audited run's `dataSnapshot.marketCalendar` into `buildAiReviewAuditTimelineItems`.
- [x] Update the product plan with the Audit timeline discoverability improvement.
- [x] Run focused Vitest, production build, full tests, Docker smoke, browser smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Planned a Stage 1 evidence discoverability slice so locked market-calendar snapshots appear in the AI/Audit timeline and evidence index.
- 2026-06-11: Verified RED Vitest coverage for the missing market-calendar timeline item, then added `market-calendar-evidence` items and wired the Audit panel to the current audited run snapshot.
- 2026-06-11: Updated the product plan to record that market-calendar evidence is now searchable from the AI/Audit timeline without changing execution gates.
- 2026-06-11: Verified with focused Vitest, full `terminal-workbench` Vitest, production web build, full Python + web tests, Docker smoke on `http://127.0.0.1:5173`, browser smoke on `workspace=audit` with no console errors, and `git diff --check`.
