# Stage 1 Market Calendar Export Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the audited `marketCalendar` snapshot across export preview, package browser, recent package index, and import diff so Stage 1 research runs can be reproduced with their market-session context.

**Architecture:** The backend already stores `researchRun.dataSnapshot.marketCalendar`; this slice keeps the data model unchanged and extends the frontend evidence builders that already render data snapshot and preparation evidence. The calendar row is review-only audit evidence: it can be ready, missing, add, same, or change, but it must never unlock simulated or live execution.

**Tech Stack:** React/TypeScript workbench helpers, Vitest, existing `ResearchContextMarketCalendar` shape, product plan documentation.

---

### Task 1: Frontend Calendar Export Evidence Rows

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write failing frontend coverage**

Add a focused test that builds an audited research run with:

```ts
const marketCalendar = {
  market: "ashare",
  timezone: "Asia/Shanghai",
  status: "open",
  isOpen: true,
  session: "morning",
  asOf: "2026-06-11T10:15:00+08:00",
  tradingDay: "2026-06-11",
  nextOpen: null,
  nextClose: "2026-06-11T11:30:00+08:00",
  detail: "A-share morning session is open.",
  warnings: [],
  source: "static-session-template"
} satisfies ResearchContextMarketCalendar;
```

Assert:
- `buildResearchRunExportPreviewRows` includes `id: "market-calendar"`, `exportPath: "researchRun.dataSnapshot.marketCalendar"`, and can be filtered by `static-session-template`.
- `buildResearchRunExportBrowserRows` includes the same row for a loaded package and can be filtered by `marketCalendar`.
- `buildResearchRunExportIndexRows` includes a compact `calendar open/morning` artifact and can be filtered by `morning`.
- `buildResearchRunImportDiffRows` compares the incoming calendar against the current workspace and returns `add` when current evidence is missing.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "market calendar export evidence"
```

Expected: fail because the export preview, browser, index, and import diff do not yet expose `marketCalendar` rows.

- [x] **Step 3: Implement export evidence support**

In `apps/web/src/lib/terminal-workbench.ts`:
- add `"market-calendar"` to `ResearchRunExportPreviewRow["id"]`, `ResearchRunExportBrowserRow["id"]`, and `ResearchRunImportDiffRow["id"]`;
- add `formatMarketCalendarEvidenceDetail(calendar)` that returns a stable searchable string with market, timezone, status/session, next event, source, and warning count;
- insert the preview row after `data-snapshot`;
- insert the package browser row after `data`;
- add a compact `calendar ${status}/${session}` artifact to `buildResearchRunExportIndexRows`;
- insert the import diff row after `data-snapshot`, comparing formatted current and incoming calendar evidence.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "market calendar export evidence"
```

Expected: pass.

### Task 2: Product Plan And Full Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-11-stage1-market-calendar-export-evidence.md`

- [x] **Step 1: Update product plan**

Record that Stage 1 `marketCalendar` evidence is now visible in export preview, package browser, recent package index, and import diff. Explicitly state this remains research/audit evidence only and does not affect execution routing.

- [x] **Step 2: Run full verification**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "market calendar export evidence"
npm --prefix apps/web run build
npm test
npm run docker:smoke
git diff --check
```

Expected: all pass.

**Progress:**
- 2026-06-11: Planned the next Stage 1 evidence slice to expose stored market-calendar snapshots in export preview, package browser, recent package index, and import diff without changing execution gates.
- 2026-06-11: Added RED/GREEN frontend coverage for `market-calendar` rows across export preview, package browser, recent package index, and import diff.
- 2026-06-11: Implemented a shared market-calendar evidence formatter and wired the row/search behavior through the existing frontend evidence builders.
- 2026-06-11: Updated the product plan to record the new reproducibility surfaces and preserve the research-only, no-execution-unlock boundary.
- 2026-06-11: Verified with focused Vitest coverage, production web build, full repository tests, Docker smoke on port 5173, git whitespace checks, and a read-only browser smoke of the Audit workspace.
