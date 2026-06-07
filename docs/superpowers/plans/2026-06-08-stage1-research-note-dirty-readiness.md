# Stage 1 Research Note Dirty Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Research workspace readiness checklist distinguish saved notes from unsaved note drafts.

**Architecture:** Keep the behavior in the Stage 1 workbench model by extending `ResearchContextReadinessNoteInput` with the saved note snapshot. The React layer passes both the current draft and saved body, then renders existing readiness actions without adding a new workflow.

**Tech Stack:** React, TypeScript, Vitest, existing local-core note API contract.

---

## Scope

- Detect when the current research note draft has never been saved.
- Detect when the current research note draft differs from the saved note body.
- Keep saved, unchanged notes as ready.
- Keep the existing save-note action for draft and dirty states.
- Update docs and verification notes.

## Non-Goals

- No new note API endpoint.
- No autosave.
- No AI note summarization.
- No strategy or execution behavior.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: this plan document

## Implementation Steps

- [x] RED: Add a model test for a new unsaved draft.
- [x] RED: Add a model test for edited saved note body.
- [x] GREEN: Add saved note snapshot fields to `ResearchContextReadinessNoteInput`.
- [x] GREEN: Compute `draft not saved` and `unsaved changes` note states.
- [x] GREEN: Pass saved note body from `App.tsx`.
- [x] GREEN: Localize readiness values for the new note states.
- [x] DOCS: Update product plan and this plan.
- [x] VERIFY: Run targeted tests, full tests, build, Docker smoke, browser check, and diff checks.
- [x] SHIP: Commit and push through proxy.

## Progress Notes

- Targeted RED checks failed as expected because note rows treated any non-empty draft as `saved`.
- Targeted GREEN check now passes for `terminal-workbench.test.ts`.
- Full verification passed: `npm test`, `npm run build`, `docker compose config`, `docker compose build`, `python tools\docker_smoke.py --no-build --down`, and `git diff --check`.
- Browser verification confirmed editing the note box changes the readiness row to `草稿未保存`, keeps the `保存笔记` action visible, and logs no warning/error messages.
- Pushed through `127.0.0.1:7890`; GitHub Actions CI for commit `322b151` completed successfully.

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
