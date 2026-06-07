# Stage 1 Research Note Readiness Timestamps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show saved-note freshness directly in the Research context readiness checklist.

**Architecture:** Keep readiness evidence formatting in `terminal-workbench.ts` so the React panel consumes a single, stable detail string. The UI only localizes the new note evidence phrases and keeps the same compact row layout.

**Tech Stack:** React, TypeScript, Vitest, existing local-core research note contract.

---

## Scope

- Saved, unchanged notes show the saved timestamp in the readiness detail.
- Edited saved notes show that the draft has unsaved changes since the saved timestamp.
- New unsaved drafts clearly say that the draft is not saved.
- Keep existing save-note action behavior.
- Update product and plan docs.

## Non-Goals

- No autosave.
- No timestamp formatting library.
- No note version history.
- No strategy, AI, portfolio, or execution changes.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Update the saved-note readiness test to require a saved timestamp detail.
- [x] RED: Update the dirty-note readiness test to require an unsaved-changes timestamp detail.
- [x] RED: Update the draft-note readiness test to require an explicit draft-not-saved detail.
- [x] GREEN: Add compact note readiness detail formatting in the workbench model.
- [x] GREEN: Add Chinese detail translations for the new note evidence phrases.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [ ] SHIP: Commit and push through proxy.

## Progress Notes

- Targeted RED checks failed as expected because readiness note details only showed the note body.
- Targeted GREEN check now passes for `terminal-workbench.test.ts`.
- Full verification passed: `npm test`, `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification confirmed saved-note readiness details render an `已保存 <timestamp>` evidence prefix without horizontal overflow or app console warnings/errors.
- The temporary browser-verification note written to Docker local storage was deleted after verification.

## Verification Checklist

```powershell
npm --prefix apps/web test -- --run src/lib/terminal-workbench.test.ts
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```
