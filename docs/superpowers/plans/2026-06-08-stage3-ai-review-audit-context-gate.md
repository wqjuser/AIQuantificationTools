# Stage 3 AI Review Audit Context Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent AI review evidence, exports, saved records, and explain/debate actions from using an audited run that belongs to a different market, symbol, or timeframe.

**Architecture:** Reuse `buildResearchRunContextBinding` as the single frontend evidence boundary for AI review surfaces. The model layer blocks stale AI artifacts before React export/save/actions can package or persist them.

**Tech Stack:** React, TypeScript, Vitest, existing `TerminalWorkspace`, AI review dossier, and research run audit context model.

---

### Task 1: AI Review Evidence Boundary

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `docs/product-plan.md`
- Create: `docs/superpowers/plans/2026-06-08-stage3-ai-review-audit-context-gate.md`

- [x] **Step 1: Write failing model tests**

Add tests requiring mismatched audited runs to block `buildAiReviewDossier`, `buildAiReviewReportMarkdown`, `buildAiReviewRunRecord`, and `workspaceWithAiAction(..., "explain")`.

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "AI review"
```

Expected: FAIL because AI review currently treats any `researchRun` as current evidence.

- [x] **Step 2: Wire AI review to shared audit context binding**

Update AI evidence cards, dossier, action state, and explain/debate workflow state to call `buildResearchRunContextBinding`. Continue allowing `strategy-draft` because it intentionally clears audited results and stages a fresh draft.

- [x] **Step 3: Verify targeted behavior**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "AI review"
```

Expected: PASS with all AI review tests green.

- [x] **Step 4: Run full verification and browser check**

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

Then open `http://127.0.0.1:5173/?workspace=ai-review` and verify the AI review workspace renders without console errors.

- [ ] **Step 5: Commit and push**

```powershell
git add apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/superpowers/plans/2026-06-08-stage3-ai-review-audit-context-gate.md
git commit -m "feat: gate ai review by audit context"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

### Notes

- Started on 2026-06-08 after Strategy Lab audit context merge shipped.
- RED failed as expected: a mismatched AAPL workspace still produced a ready AI dossier from `run-ai-stale`.
- GREEN targeted test passed after AI review surfaces reused `buildResearchRunContextBinding`.
- Full verification passed on 2026-06-08: `terminal-workbench.test.ts` (166 tests), `npm test` (128 Python tests and 344 web tests), `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification passed on `http://127.0.0.1:5173/?workspace=ai-review`: the AI Review workspace rendered `600000`, showed the audited-evidence-required dossier state, and browser console warning/error count was 0.
