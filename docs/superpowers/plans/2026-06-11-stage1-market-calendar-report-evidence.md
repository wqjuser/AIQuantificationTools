# Stage 1 Market Calendar Report Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry audited market-calendar evidence into AI review records and Backtest Markdown reports so Stage 1 reports remain understandable without opening raw JSON.

**Architecture:** The `marketCalendar` snapshot already lives in `researchRun.dataSnapshot.marketCalendar`. This slice extends the existing AI evidence anchor builder and Backtest report Data Snapshot table to reference that snapshot, using the same formatter as export preview/import diff and keeping it as research-only audit context.

**Tech Stack:** TypeScript workbench helpers, Vitest, Markdown report builder, product plan documentation.

---

### Task 1: AI Review And Backtest Report Calendar Evidence

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write failing tests**

Add focused tests that create an audited `ashare/600000/1d` run with:

```ts
marketCalendar: {
  market: "ashare",
  timezone: "Asia/Shanghai",
  status: "break",
  isOpen: false,
  session: "lunch_break",
  asOf: "2026-06-11T12:00:00+08:00",
  tradingDay: "2026-06-11",
  nextOpen: "2026-06-11T13:00:00+08:00",
  nextClose: "2026-06-11T15:00:00+08:00",
  detail: "A-share lunch break.",
  warnings: ["Static session template only; exchange holiday calendar is not configured."],
  source: "static-session-template"
}
```

Assert:
- `buildAiReviewRunRecord(workspace)?.evidenceAnchors` contains `{ type: "market-calendar", exportPath: "researchRun.dataSnapshot.marketCalendar", reference: "ashare 2026-06-11 break/lunch_break" }`.
- `buildBacktestReportMarkdown(workspace)` includes a Data Snapshot row `| Market calendar | ashare · Asia/Shanghai · break/lunch_break · next open 2026-06-11T13:00:00+08:00 · Static session template only; exchange holiday calendar is not configured. · 1 warning |`.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "market calendar report evidence"
```

Expected: fail because AI review anchors and Backtest Markdown do not yet include market-calendar evidence.

- [x] **Step 3: Implement minimal support**

In `apps/web/src/lib/terminal-workbench.ts`:
- extend `AiReviewEvidenceAnchorType` with `"market-calendar"`;
- in `buildAiReviewEvidenceAnchors`, push the market-calendar anchor after the data snapshot anchor when `run.dataSnapshot.marketCalendar` exists;
- in `buildBacktestReportMarkdown`, read `const marketCalendar = snapshot?.marketCalendar ?? null`;
- add a `["Market calendar", marketCalendar ? formatMarketCalendarEvidenceDetail(marketCalendar) : "not locked"]` row to the Data Snapshot table.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "market calendar report evidence"
```

Expected: pass.

### Task 2: Product Plan And Full Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-11-stage1-market-calendar-report-evidence.md`

- [x] **Step 1: Update product plan**

Record that Stage 1 market-calendar evidence is now present in AI Review Run Record evidence anchors and Backtest Markdown Data Snapshot reports.

- [x] **Step 2: Run full verification**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "market calendar report evidence"
npm --prefix apps/web run build
npm test
npm run docker:smoke
git diff --check
```

Expected: all pass.

**Progress:**
- 2026-06-11: Planned the next Stage 1 evidence slice to surface stored market-calendar snapshots in AI review anchors and Backtest Markdown reports, without changing trading gates or execution routing.
- 2026-06-11: Added focused RED coverage for `marketCalendar` report evidence in AI review anchors and Backtest Markdown Data Snapshot output.
- 2026-06-11: Implemented the `market-calendar` AI evidence anchor and Backtest Markdown row, reusing the shared calendar detail formatter.
- 2026-06-11: Adjusted the calendar event detail so break/closed sessions prefer the next open timestamp when both next open and next close are available.
- 2026-06-11: Updated the product plan to record that Stage 1 trading-calendar evidence now reaches AI Review Run Records and Markdown reports without changing execution gates.
- 2026-06-11: Verified with focused Vitest, production web build, full Python + web test suite, Docker smoke on `http://127.0.0.1:5173`, browser runtime check with no console errors, and `git diff --check`.
