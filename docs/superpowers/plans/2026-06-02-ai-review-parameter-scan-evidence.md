# AI Review Parameter Scan Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AI Review consume the same audited parameter scan summary that Backtest Report already shows.

**Architecture:** Reuse `buildBacktestParameterScanSummary` as the single frontend model for parameter-scan evidence. AI Review adds a `parameter-scan` citation to the dossier and exports the same non-advisory summary table in Markdown.

**Tech Stack:** React, TypeScript, Vitest, Vite, local frontend model functions.

---

## Product Mapping

- Work area: AI Review / Strategy Lab handoff.
- User value: AI committee reports can see parameter-scan context instead of only aggregate return and benchmark Alpha.
- Guardrail: candidate wording remains "candidate for re-audit" and "no investment advice"; no direct buy/sell recommendation is generated.

## Files

- Modify: `apps/web/src/lib/terminal-workbench.ts`
- Modify: `apps/web/src/lib/terminal-workbench.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`
- Modify: `docs/superpowers/plans/2026-06-01-backtest-parameter-summary.md`

## Tasks

- [x] **Step 1: Write the failing AI Review dossier test**

Add an expectation that an audited run with a data snapshot emits a `parameter-scan` citation after benchmark evidence.

- [x] **Step 2: Verify the red phase**

Run: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts`

Expected: fail because AI Review does not yet include `parameter-scan`.

- [x] **Step 3: Write the failing AI Review Markdown test**

Add expectations for a `## Parameter Scan Summary` section, `Candidate for re-audit`, and `Candidate must be re-audited; no investment advice.`

- [x] **Step 4: Implement minimal model integration**

Extend `AiReviewCitation.id`, call `buildBacktestParameterScanSummary(workspace)` in `buildAiReviewDossier`, and insert a `parameter-scan` citation only when a summary is available.

- [x] **Step 5: Export the AI Markdown summary**

Add a `Parameter Scan Summary` table to `buildAiReviewReportMarkdown`, using the same fields as Backtest Report.

- [x] **Step 6: Localize the new citation**

Add the Chinese label and simple detail/value replacements for the new parameter-scan citation in `App.tsx`.

- [x] **Step 7: Update product and architecture docs**

Record that AI Review now references benchmark Alpha plus parameter scan summary evidence, while preserving re-audit boundaries.

- [x] **Step 8: Run full verification**

Run targeted frontend test, full test suite, build, diff check, and local HTTP smoke before commit.

- [x] **Step 9: Commit**

Commit with `feat: cite parameter scans in ai review` and push `codex/p0-product-workspaces`.

- [x] **Step 10: Push**

Retry `git push origin codex/p0-product-workspaces` when GitHub 443 connectivity is available.

## Verification Notes

- Red phase: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts` failed with two expected failures: missing `parameter-scan` citation and missing `## Parameter Scan Summary`.
- Green phase: targeted `terminal-workbench` tests passed with 110 tests after implementation.
- Full `npm test` passed: Python 73 tests and frontend 205 tests.
- `npm run build` passed; Vite kept the existing large chunk warning.
- `git diff --check` passed with CRLF normalization warnings only.
- `Invoke-RestMethod http://127.0.0.1:5173/?workspace=strategy` returned `vite-page-ok`.
- In-app browser automation reloaded `http://127.0.0.1:5173/?workspace=strategy` and confirmed the rendered page contains Strategy/AI workspace text.

Delivery:
- Committed as `feat: cite parameter scans in ai review`.
- Initial push was delayed because `git push origin codex/p0-product-workspaces` failed twice with GitHub 443 connection timeouts, and `Test-NetConnection github.com -Port 443` returned `TcpTestSucceeded: False`.
- Pushed after GitHub 443 connectivity recovered: `0a62abe..a1e7056  codex/p0-product-workspaces -> codex/p0-product-workspaces`.
