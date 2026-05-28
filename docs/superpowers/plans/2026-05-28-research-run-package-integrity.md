# Research Run Package Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect tampered or internally inconsistent research run export packages before they are imported into the local audit store.

**Architecture:** Current exports now include a top-level SHA-256 integrity record computed from canonical JSON without the `integrity` and `exportedAt` fields. Imports validate that hash when present, normalize integer-valued floats and timezone-equivalent ISO datetimes for JSON tool round-trips, and always validate manifest fields, data hash, row counts, and artifact counts against the contained `researchRun`.

**Tech Stack:** Python package serialization, Python `unittest`, TypeScript contract validation, Vitest.

---

### Task 1: Backend Integrity Contract

**Files:**
- Modify: `services/quant_core/quant_core/runs.py`
- Test: `services/quant_core/tests/test_quant_core.py`

- [x] Add a failing export test requiring `integrity.algorithm=sha256` and a 64-character hash.
- [x] Add a failing import test that mutates an exported package and expects `integrity_hash_mismatch`.
- [x] Add a failing import test that changes manifest artifact counts and expects an artifact count mismatch.
- [x] Add a failing import test for browser JSON number round-trips where `9.0` may become `9`.
- [x] Add a failing import test for timezone-equivalent JSON round-trips where UTC timestamps may become local offset timestamps.
- [x] Compute the package integrity hash from canonical JSON excluding the `integrity` and `exportedAt` fields.
- [x] Canonicalize integer-valued floats and timezone-equivalent ISO datetimes before hashing so browser/tool-downloaded packages can be imported.
- [x] Validate optional integrity on import while allowing older packages that do not contain it.
- [x] Validate manifest identity fields, data hash, data rows, and artifact counts on every import.

### Task 2: Frontend Export Contract

**Files:**
- Modify: `apps/web/src/lib/terminal-api.ts`
- Test: `apps/web/src/lib/terminal-api.test.ts`

- [x] Add an optional `ResearchRunExportIntegrity` type.
- [x] Validate integrity as `sha256` with a 64-character hex hash when present.
- [x] Add a failing malformed-integrity test and make it pass.

### Task 3: Verification

**Files:**
- Check: all changed files

- [x] Run focused backend integrity tests.
- [x] Run focused frontend API tests.
- [x] Run the full frontend/backend test suite.
- [x] Run the production build.
- [x] Verify the live local API exports integrity, imports valid packages, and rejects tampered packages.
- [x] Verify the in-app browser still loads without console errors.
- [x] Commit and push the completed slice.
