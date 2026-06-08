# Execution Certification Apply Confirmations UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. This slice is UI confirmation state only; it must not store secrets, restart services, or enable live trading.

**Goal:** Add an explicit three-item operator confirmation checklist to the Settings adapter certification apply preflight flow.

**Architecture:** Keep the confirmation model in the web workbench layer so the Settings UI can render stable checkbox rows and submit the selected booleans to the existing `recordExecutionAdapterCertificationApply` helper. The backend remains the source of truth for blocked vs `ready_for_restart`; the UI only captures operator-confirmed booleans and displays returned audit results.

**Tech Stack:** React/TypeScript, Vitest, source/CSS contract tests, Docker Compose smoke.

---

### Task 1: RED Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/lib/layout-css.test.js`

- [x] Add a workbench test for `buildExecutionAdapterCertificationApplyConfirmationRows(...)` proving the three confirmation payload keys, labels, checked state, and neutral/positive tones.
- [x] Add a layout/source contract test proving App stores confirmation state, passes it into Settings, renders checkbox controls, and submits those values to `recordExecutionAdapterCertificationApply`.

Expected RED commands:

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "certification apply confirmation"
npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "apply confirmation"
```

Result: RED on 2026-06-08. Workbench failed with `buildExecutionAdapterCertificationApplyConfirmationRows is not a function`; layout contract failed because Settings had no confirmation checklist wiring.

### Task 2: Workbench Model And Settings UI

**Files:**
- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] Add the confirmation types, default factory, and row builder.
- [x] Store confirmation booleans per certification id in `App`.
- [x] Add a checkbox change handler that merges defaults with changed values.
- [x] Submit the selected confirmation values in `applyAdapterCertificationPreflight(...)`.
- [x] Render a compact confirmation checklist under each certification evidence row.

Result: GREEN on 2026-06-08. Targeted workbench and layout tests pass for the confirmation checklist and request binding.

### Task 3: Product Plan And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: `docs/superpowers/plans/2026-06-08-execution-certification-apply-confirmations-ui.md`

- [x] Update the product plan so the apply UI is no longer described as always submitting missing confirmations.
- [x] Run targeted tests, full tests, build, Docker smoke, browser verification, and `git diff --check`.
- [ ] Commit and push through proxy `127.0.0.1:7890`.

Result: PASS on 2026-06-08.
- Targeted Web tests passed:
  - `npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts -t "certification apply confirmation"`
  - `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "apply confirmation"`
- `npm test`: Python 131 tests and Web 358 tests passed.
- `npm run build`: passed with split chunks and no large chunk warning.
- `docker compose config`: passed and web still publishes `5173`.
- `docker compose build`: passed for API and Web images.
- `python tools\docker_smoke.py --no-build --down`: passed.
- `git diff --check`: passed.
- Docker restarted with `docker compose up -d`.
- Browser verification on `http://127.0.0.1:5173/?workspace=settings`: PASS. A certification evidence row rendered three confirmation checkboxes; after checking all three and applying, the result showed `3 已确认 / 0 缺失`, one remaining blocker from the non-passed certification evidence, and the live trading blocked boundary.

### Safety Notes

- Confirmation checkboxes are boolean acknowledgements only.
- Do not ask for, read, display, or store raw API keys or passwords.
- Do not write environment variables.
- Do not restart containers from the UI.
- Do not set `liveTradingAllowed=true`.
