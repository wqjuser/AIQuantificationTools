# AI Review Run Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current AI Review committee state into a structured, exportable run record that can later be persisted by the local core.

**Architecture:** Add a frontend `AiReviewRunRecord` model derived only from audited run evidence. The record reuses the existing AI dossier, citations, committee rounds, and decision log, then exposes a JSON export from the AI Review panel.

**Tech Stack:** React, TypeScript, Vitest, Vite, local frontend model functions.

---

## Product Mapping

- Work area: AI Review Board.
- User value: AI committee output becomes a reproducible artifact, not just transient UI cards.
- Guardrail: the record is generated only after an audited run exists and repeats the evidence-only/no-guaranteed-return boundary.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/i18n.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`

## Tasks

- [x] **Step 1: Write the failing model tests**

Add tests proving `buildAiReviewRunRecord` returns `null` without an audited run, and returns a structured `aiqt.aiReviewRun` record with run id, strategy revision, citations, committee rounds, decision log counts, parameter scan binding, live gate state, and safety boundary after audit evidence exists.

- [x] **Step 2: Verify red phase**

Run: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts`

Expected: fail because `buildAiReviewRunRecord` does not exist.

- [x] **Step 3: Implement the run record model**

Add `AiReviewRunRecord` and `buildAiReviewRunRecord(workspace)`, deriving all evidence from `buildAiReviewDossier`, `buildAgentCommitteeRounds`, `workspace.decisionLog`, and the locked research run context.

- [x] **Step 4: Add JSON export action**

Add an AI Review panel action that exports `<runId>-ai-review-record.json` using the new model, while keeping the existing Markdown report export.

- [x] **Step 5: Add i18n and compact action layout**

Add `aiReview.exportRecord` in English and Chinese, and reuse the existing report button style with a small wrapping action group.

- [x] **Step 6: Update product and architecture docs**

Record that AI Review now has a structure suitable for later persistence in the local core.

- [x] **Step 7: Run full verification**

Run targeted model tests, full test suite, production build, diff check, HTTP smoke, and browser reload smoke.

- [x] **Step 8: Commit**

Commit with `feat: export ai review run records` and push `codex/p0-product-workspaces`.

- [ ] **Step 9: Push**

Retry `git push origin codex/p0-product-workspaces` when GitHub 443 connectivity is available.

## Verification Notes

- Red phase: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts` failed because `buildAiReviewRunRecord` was not a function.
- Green phase: targeted `terminal-workbench` tests passed with 112 tests after implementation.
- Full `npm test` passed: Python 73 tests and frontend 207 tests.
- `npm run build` passed; Vite kept the existing large chunk warning.
- `git diff --check` passed with CRLF normalization warnings only.
- `Invoke-RestMethod http://127.0.0.1:5173/?workspace=ai-review` returned `vite-page-ok`.
- In-app browser automation reloaded `http://127.0.0.1:5173/?workspace=ai-review` and confirmed the page rendered with the AI Review text and export run record entry.

Delivery:
- Committed as `feat: export ai review run records`.
- Push is pending because `git push origin codex/p0-product-workspaces` failed with a reset connection, and `Test-NetConnection github.com -Port 443` returned `TcpTestSucceeded: False`.
