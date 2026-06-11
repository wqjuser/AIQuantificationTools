# Stage 1 Portfolio Report Package Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed Portfolio Markdown report artifacts complete the same external package verification loop as Audit Evidence and Backtest reports.

**Architecture:** The audit signing service already treats `portfolio_report` as a signable report event. This slice extends package-report artifact-kind parsing so an external `aiqt.portfolioReport` package can be verified through `/api/audit/reports/verify-package` without recording a local audit event.

**Non-Goals:** Do not add Portfolio reports to research-run JSON export packages, change signing secrets, change HMAC payload fields, alter UI layout, route real trades, or create new investment advice behavior.

---

### Task 1: RED Test

**Files:**
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] Add a regression test that posts a signed `aiqt.portfolioReport` artifact to `/api/audit/reports/verify-package`.
- [x] Assert the API returns `portfolio_report`, verified signature metadata, and does not persist the external package event.
- [x] Run the focused test and verify it fails before implementation with `400 != 200`.

### Task 2: Verification Mapping

**Files:**
- Modify: `services/quant_core/quant_core/audit_signing.py`

- [x] Map `aiqt.portfolioReport` to `portfolio_report` in package-report parsing.
- [x] Run the focused test again and verify it passes.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/product-plan.md`
- Modify: this plan document

- [x] Update the product plan with Portfolio report package verification.
- [x] Run focused Python unittest, quant core unittest discovery, web build, full tests, Docker smoke, and `git diff --check`.

**Progress:**
- 2026-06-11: Identified that report event signing already covered Portfolio reports, but package verification could not parse `aiqt.portfolioReport`.
- 2026-06-11: Added a focused API regression test and confirmed RED on the missing artifact-kind mapping.
- 2026-06-11: Added the Portfolio report artifact-kind mapping, confirmed the focused API regression test passes, and updated the product plan with the package verification boundary.
- 2026-06-11: Verified with focused Python unittest, quant core unittest discovery, production web build, full tests, Docker smoke on `http://127.0.0.1:5173`, and `git diff --check`.
