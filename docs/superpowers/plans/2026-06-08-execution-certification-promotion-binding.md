# Execution Certification Promotion Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind recent execution adapter certification evidence into the Execution workspace promotion queue.

**Architecture:** Keep the durable certification store in the existing Python core and consume it from the web app. Extend the frontend workbench model so `buildPromotionReadiness` can consider recent certification rows while preserving the hard live-trading boundary: blocked/review evidence can improve observability but must not pass the live adapter gate. Surface the same compact evidence in `PromotionQueuePanel` so Execution shows why certification is still blocked.

**Tech Stack:** React, TypeScript, Vitest, existing `terminal-api`, `terminal-workbench`, `App.tsx`, Docker deployment.

---

### Task 1: Promotion Readiness Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Test: `apps/web/src/lib/terminal-workbench.test.ts`

- [x] **Step 1: Write failing model tests**

Add tests proving:
- `buildPromotionReadiness(workspace, execution, brokerRows, certificationRows)` includes the latest certification evidence in the adapter stage detail.
- blocked/review certification evidence keeps `status=certification_pending` and does not mark the adapter stage passed.
- a passed, `liveTradingAllowed=true` certification row still requires the existing workspace adapter gate and human confirmation before `live_ready`.

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "promotion certification evidence"
```

Expected: FAIL because `buildPromotionReadiness` does not accept certification rows yet.

Result: FAIL on 2026-06-08 with `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "adapter certification evidence"` because the adapter stage still returned `0 certified live adapters` and ignored the latest certification row.

- [x] **Step 2: Implement promotion evidence binding**

Update `buildPromotionReadiness` to accept an optional `ExecutionAdapterCertificationRow[]`. Derive the newest live certification row, include its status/check summary/audit event in the adapter stage detail, and keep live readiness gated by both existing workspace gates and a positive live certification row.

- [x] **Step 3: Verify targeted model tests**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "promotion certification evidence"
```

Expected: PASS.

Result: PASS on 2026-06-08 with `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "adapter certification"`.

### Task 2: Execution UI Wiring

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-08-execution-certification-promotion-binding.md`

- [x] **Step 4: Write failing source contract test**

Add a source contract test proving:
- `buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows)` is called.
- `PromotionQueuePanel` receives `adapterCertificationRows={executionAdapterCertificationRows}`.
- `PromotionQueuePanel` renders a compact `promotion-certification-evidence` strip.

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "promotion certification evidence"
```

Expected: FAIL because App does not pass certification rows into the promotion queue yet.

Result: FAIL on 2026-06-08 with `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "promotion certification evidence"` because App still called `buildPromotionReadiness` without certification rows.

- [x] **Step 5: Implement UI wiring**

Pass certification rows into `buildPromotionReadiness` and `PromotionQueuePanel`. Render a compact latest-evidence strip in the promotion queue showing adapter id, status label, check summary, audit event id, and live-blocked boundary.

Result: PASS on 2026-06-08 with `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "promotion certification evidence"`.

- [x] **Step 6: Run full verification and browser check**

Run:

```powershell
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```

Then start Docker and open `http://127.0.0.1:5173/?workspace=execution` to verify the Execution workspace renders without console errors and the promotion queue shows adapter certification evidence after a certification record exists.

Result: PASS on 2026-06-08.
- `npm test`: Python 130 tests and Web 353 tests passed.
- `npm run build`: passed with split chunks and no Vite large chunk warning.
- `docker compose config`: passed and still exposes web on `5173`.
- `docker compose build`: passed for API and Web images.
- `python tools\docker_smoke.py --no-build --down`: passed health, web, and workspace schema checks.
- `git diff --check`: passed.
- Docker was restarted with `docker compose up -d`.
- Browser verification on `http://127.0.0.1:5173/?workspace=execution`: PASS. A local blocked `ashare-live` certification record showed in the promotion queue as recent adapter certification evidence, while live promotion remained blocked.

- [x] **Step 7: Commit and push**

```powershell
git add apps/web/src/App.tsx apps/web/src/styles.css apps/web/src/lib/layout-css.test.js apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts docs/product-plan.md docs/superpowers/plans/2026-06-08-execution-certification-promotion-binding.md
git commit -m "feat: bind certification evidence to promotion"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

Result: PASS on 2026-06-08. Feature commit `d8ecd1e` was pushed to `origin/codex/p0-product-workspaces` through proxy `127.0.0.1:7890`.

### Notes

- Started on 2026-06-08 after Settings gained adapter certification evidence recording.
- This slice does not enable live trading, connect broker APIs, read credentials, or change the Python certification store.
