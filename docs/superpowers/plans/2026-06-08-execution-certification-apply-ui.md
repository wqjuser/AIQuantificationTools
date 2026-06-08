# Execution Certification Apply UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Keep this slice secret-free and paper-first.

**Goal:** Wire the execution adapter certification apply preflight into the web Settings surface so a recorded certification can be checked for manual secret-store, controlled-restart, and operator-review readiness without enabling live trading.

**Architecture:** Reuse the existing `POST /api/execution/adapter-certifications/apply` helper. The frontend keeps a local list of apply preflight results, renders compact blocked/ready rows, and submits missing confirmations by default. This proves the safety contract and audit event path while leaving real secret storage, environment writes, controlled restart orchestration, and live trading disabled.

---

### Task 1: RED Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add a workbench row-model test for blocked apply preflight results.
- [x] Add a source/CSS contract test proving the Settings panel imports the API helper, passes apply rows, exposes an apply button, and renders apply result rows.

Expected RED commands:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "adapter certification apply"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "certification apply"
```

Result: RED on 2026-06-08. Workbench failed with `buildExecutionAdapterCertificationApplyRows is not a function`; layout contract failed because `recordExecutionAdapterCertificationApply` was not wired into `App.tsx`.

### Task 2: UI And Row Model

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Add `buildExecutionAdapterCertificationApplyRows(...)`.
- [x] Store apply preflight results in `App`.
- [x] Add `applyAdapterCertificationPreflight(...)` using false confirmations by default so live trading remains blocked.
- [x] Render a compact "apply preflight" action beside certification evidence rows.
- [x] Render recent apply preflight outcomes with blocked reasons and paper-only boundary.

Result: GREEN on 2026-06-08. Targeted workbench and layout tests pass for adapter certification apply UI.

### Task 3: Product Plan And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-08-execution-certification-apply-ui.md`

- [x] Update the product plan so execution adapter certification apply UI is marked complete and controlled restart remains future work.
- [x] Run targeted tests, full tests, build, Docker smoke, browser verification, and `git diff --check`.
- [ ] Commit and push through proxy `127.0.0.1:7890`.

Result: PASS on 2026-06-08.
- Targeted Web tests passed:
  - `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "adapter certification apply"`
  - `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "certification apply"`
- `npm test`: Python 131 tests and Web 356 tests passed.
- `npm run build`: passed with split chunks and no large chunk warning.
- `docker compose config`: passed and web still publishes `5173`.
- `docker compose build`: passed for API and Web images.
- `python tools\docker_smoke.py --no-build --down`: passed.
- `git diff --check`: passed.
- Docker restarted with `docker compose up -d`.
- Browser verification on `http://127.0.0.1:5173/?workspace=settings`: PASS. Recording adapter evidence exposed "应用预检"; applying it rendered a blocked result with "密钥存储预检", confirmation summary, blocker count, and live trading blocked boundary.

### Safety Notes

- This UI does not collect or store API keys.
- This UI does not write environment variables.
- This UI does not restart services.
- This UI does not enable live trading.
