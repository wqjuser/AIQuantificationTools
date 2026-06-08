# Stage 4 Execution Audit Context Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Paper Trading, risk approval, and promotion readiness from using an audited run that does not match the selected market, symbol, or timeframe.

**Architecture:** Reuse `buildResearchRunContextBinding` as the execution evidence boundary after Research, Strategy, and AI Review have adopted it. Model helpers block stale execution evidence first, then React action wiring uses the same binding to disable paper submission.

**Tech Stack:** React, TypeScript, Vitest, existing `TerminalWorkspace`, risk approval, paper trading rows, paper positions, and promotion readiness models.

---

### Task 1: Execution Evidence Boundary

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`
- Test: `apps/web/src/lib/layout-css.test.js`
- Modify: `docs/product-plan.md`
- Create: `docs/superpowers/plans/2026-06-08-stage4-execution-audit-context-gate.md`

- [x] **Step 1: Write failing model test**

Add a test requiring mismatched audited runs to block `buildRiskApprovalSummary`, `buildPaperTradingRows`, `buildPaperPositionRows`, and `buildPromotionReadiness`.

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "audited evidence belongs to another context"
```

Expected: FAIL because the audited-run gate still displays stale runs as passed.

- [x] **Step 2: Wire execution models to the shared audit context binding**

Use `buildResearchRunContextBinding` in risk approval, paper trading rows, paper position rows, and promotion readiness. Treat mismatched runs as blocked evidence and avoid rendering paper order quantity or notional previews.

- [x] **Step 3: Add App action contract test and wire submit gating**

Add a source contract test requiring `App.tsx` to compute `researchRunContextBinding` and disable paper submission when `canUseRun` is false. Use `currentResearchRunId` for active paper execution, promotion candidate, AI review records, and comparison rows.

- [x] **Step 4: Verify targeted behavior**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "audited evidence belongs to another context"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "current audit context binding"
```

Expected: PASS.

- [x] **Step 5: Run full verification and browser check**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```

Then open `http://127.0.0.1:5173/?workspace=execution` and verify the execution workspace renders without console errors.

- [ ] **Step 6: Commit and push**

```powershell
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js docs/product-plan.md docs/superpowers/plans/2026-06-08-stage4-execution-audit-context-gate.md
git commit -m "feat: gate execution by audit context"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

### Notes

- Started on 2026-06-08 after Stage 3 AI Review audit context gate shipped.
- RED failed as expected: the risk approval audited-run gate treated `run-execution-stale` as passed despite the selected timeframe being `5m`.
- GREEN targeted tests passed after Paper Trading, position, promotion, and App action gating reused `buildResearchRunContextBinding`.
- Full verification passed: `terminal-workbench` 167 tests, root `npm test` with web 346 tests and Python 128 tests, production build without large chunk warnings, Docker compose config/build, Docker smoke on `127.0.0.1:5173`, and `git diff --check`.
- Browser check passed on `http://127.0.0.1:5173/?workspace=execution`: Execution workspace loaded from Docker, paper execution controls were visible, and console error/warn logs were empty.
