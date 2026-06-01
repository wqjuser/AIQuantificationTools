# AI Review Run Record Core Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist AI Review Run Record JSON in the local Python core so AI committee output becomes an auditable platform artifact.

**Architecture:** Add a dedicated SQLite `AiReviewRunStore` instead of expanding the research run table. Expose the records through `/api/research/runs/{runId}/ai-reviews`, with POST validating the parent research run and record envelope before saving, and GET returning recent records for replay/history surfaces.

**Tech Stack:** Python standard library HTTP server, SQLite, unittest, existing quant core store/API patterns.

---

## Product Mapping

- Work area: AI Review Board / Audit & Replay.
- User value: AI committee output can be saved and later queried by run id, not only downloaded manually.
- Guardrail: records must be bound to an existing audited run and retain the evidence-only safety boundary.

## Files

- Create: `services/quant_core/quant_core/ai_review_runs.py`
- Modify: `services/quant_core/quant_core/api.py`
- Modify: `services/quant_core/tests/test_quant_core.py`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`

## Tasks

- [x] **Step 1: Write store red test**

Add a test proving `AiReviewRunStore` can persist an `aiqt.aiReviewRun` JSON record and list it by `runId`.

- [x] **Step 2: Write API red test**

Add a test proving `POST /api/research/runs/{runId}/ai-reviews` persists the record only after the research run exists, and `GET /api/research/runs/{runId}/ai-reviews` returns it.

- [x] **Step 3: Verify red phase**

Run: `python -m unittest ...test_ai_review_run_store... ...test_research_run_ai_review_api...`

Expected: fail because `quant_core.ai_review_runs` does not exist.

- [x] **Step 4: Implement core store**

Add `AiReviewRunRecord`, `AiReviewRunStore`, record normalization, SQLite schema, `record`, `list_by_run`, and `ai_review_run_record_to_payload`.

- [x] **Step 5: Implement API endpoints**

Add `ai_review_store` to `QuantApiHandler`, then implement POST/GET `/api/research/runs/{runId}/ai-reviews`.

- [x] **Step 6: Update docs**

Record the new store/API in product and architecture docs.

- [x] **Step 7: Run full verification**

Run target tests, full test suite, production build, diff check, local HTTP smoke, and browser smoke if frontend assets are touched.

- [x] **Step 8: Commit**

Commit with `feat: persist ai review run records` and push `codex/p0-product-workspaces`.

- [ ] **Step 9: Push**

Retry `git push origin codex/p0-product-workspaces` when GitHub 443 connectivity is available.

## Verification Notes

- Red phase: target tests failed with `ModuleNotFoundError: No module named 'quant_core.ai_review_runs'`.
- Green phase: target store/API tests passed after adding `ai_review_runs.py` and API routes.
- Full `npm test` passed: Python 75 tests and frontend 207 tests.
- `npm run build` passed; Vite kept the existing large chunk warning.
- `git diff --check` passed with CRLF normalization warnings only.

Delivery:
- Committed as `feat: persist ai review run records`.
- Push is pending because `git push origin codex/p0-product-workspaces` failed with a reset connection, and `Test-NetConnection github.com -Port 443` returned `TcpTestSucceeded: False`.
