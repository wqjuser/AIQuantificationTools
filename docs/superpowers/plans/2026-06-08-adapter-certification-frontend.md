# Adapter Certification Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the new execution adapter certification ledger into the web app so Settings can record and display secret-free certification evidence.

**Architecture:** Add typed API helpers for `/api/execution/adapter-certifications`, a small workbench row model for recent certification runs, and a Settings panel action that records a blocked/sandbox-only certification evidence run for a selected live adapter. The UI must never ask for or transmit actual secrets, and `liveTradingAllowed` remains false.

**Tech Stack:** React, TypeScript, Vitest, existing `terminal-api`, `terminal-workbench`, `App.tsx`, and Docker deployment.

---

### Task 1: API Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] **Step 1: Write failing API tests**

Add tests for:
- `buildExecutionAdapterCertificationsUrl(baseUrl, { adapterId, limit })`
- `recordExecutionAdapterCertification(...)`
- `loadExecutionAdapterCertifications(...)`
- type guards rejecting payloads that contain serialized secret values

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "execution adapter certification"
```

Expected: FAIL because the API helper functions and types do not exist.

- [x] **Step 2: Implement the API helpers**

Add `ExecutionAdapterCertificationRun`, request/result interfaces, URL builder, POST/GET helpers, and payload guards. POST sends check metadata placeholders only and parses the returned audit event.

- [x] **Step 3: Verify targeted API tests**

Run:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "execution adapter certification"
```

Expected: PASS.

Result: PASS on 2026-06-08 with `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "execution adapter certification"`.

### Task 2: Settings UI Wiring

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/layout-css.test.js`
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-08-adapter-certification-frontend.md`

- [x] **Step 4: Write failing model and source contract tests**

Add tests proving recent certification runs produce compact rows with status, check counts, audit event id, and live-blocked boundary. Add a source contract test proving `App.tsx` calls `recordExecutionAdapterCertification`, loads recent certification rows, and renders a certification action/list in `PlatformSettingsPanel`.

- [x] **Step 5: Implement UI state and rendering**

Load recent certification rows for live adapters when Settings refreshes. Add a per-live-adapter action that records a blocked certification evidence run with checks for sandbox credentials, order lifecycle, emergency stop, and controlled restart. Render the latest rows in Settings below the adapter ledger.

Result: PASS on 2026-06-08 with `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js -t "execution adapter certification"`.

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

Then start Docker and open `http://127.0.0.1:5173/?workspace=settings` to verify the Settings workspace renders without console errors and shows the adapter certification controls.

Result: PASS on 2026-06-08.
- `npm test`: Python 130 tests and web 350 tests passed.
- `npm run build`: passed with split chunks and no large chunk warning.
- `docker compose config`: passed.
- `docker compose build`: passed.
- `python tools\docker_smoke.py --no-build --down`: passed; web exposed on `http://127.0.0.1:5173`.
- `git diff --check`: passed.
- Browser check: Settings workspace showed 4 adapter rows and 3 live adapter certification buttons; after recording one paper-only certification evidence run it showed the adapter certification list, live-blocked boundary, no console errors, and no `secret-key` text.

- [x] **Step 7: Commit and push**

```powershell
git add apps/web/src/lib/terminal-api.ts apps/web/src/lib/terminal-api.test.ts apps/web/src/lib/terminal-workbench.ts apps/web/src/lib/terminal-workbench.test.ts apps/web/src/App.tsx apps/web/src/lib/layout-css.test.js docs/product-plan.md docs/superpowers/plans/2026-06-08-adapter-certification-frontend.md
git commit -m "feat: surface adapter certification evidence"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

Result: PASS on 2026-06-08. Feature commit `8ff10d2` pushed to `origin/codex/p0-product-workspaces` with the configured proxy; this plan status was followed up in a docs-only push.

### Notes

- Started on 2026-06-08 after the backend adapter certification ledger shipped.
- This slice only records paper/sandbox-only certification evidence; it does not request credentials, connect brokers, or enable live trading.
