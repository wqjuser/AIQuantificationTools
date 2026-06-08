# Execution Adapter Certification Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, secret-free execution adapter certification ledger so live-adapter readiness checks become auditable evidence without enabling real trading.

**Architecture:** Keep certification evidence in the Python local core because it is the durable execution boundary. Add a SQLite-backed store, payload normalizers, an audit-event builder, and POST/GET API endpoints under `/api/execution/adapter-certifications`. The ledger records check status and redacted metadata only; `liveTradingAllowed` remains `false`.

**Tech Stack:** Python `unittest`, SQLite, existing `quant_core.execution`, `quant_core.api`, and `AuditEventStore`.

---

### Task 1: Backend Certification Ledger

**Files:**
- Modify: `services/quant_core/quant_core/execution.py`
- Modify: `services/quant_core/quant_core/api.py`
- Test: `services/quant_core/tests/test_quant_core.py`
- Modify: `docs/product-plan.md`
- Create: `docs/superpowers/plans/2026-06-08-execution-adapter-certification-ledger.md`

- [x] **Step 1: Write failing store and API tests**

Add tests proving an adapter certification run can be created, persisted, listed by adapter, exposed through POST/GET, and returned without API keys, tokens, secrets, private keys, or passwords.

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k execution_adapter_certification
```

Expected: FAIL because `ExecutionAdapterCertificationStore` and `/api/execution/adapter-certifications` do not exist yet.

- [x] **Step 2: Implement the store and payload contract**

Add `ExecutionAdapterCertificationRun`, `ExecutionAdapterCertificationStore`, `create_execution_adapter_certification_run`, `execution_adapter_certification_to_payload`, and `execution_adapter_certification_to_audit_event_payload`.

Rules:
- Store adapter id, market, route, status, operator, timestamps, checks, summary, and redacted metadata.
- Drop or replace secret-like keys (`secret`, `token`, `apiKey`, `privateKey`, `password`) with `[redacted]`.
- Keep `liveTradingAllowed` hard-coded to `false`.

- [x] **Step 3: Implement POST/GET API endpoints**

Add:

```text
POST /api/execution/adapter-certifications
GET /api/execution/adapter-certifications?adapterId=us-live&limit=20
```

POST records the certification run and an `execution_adapter_certification` audit event. GET lists recent runs for an adapter id. Missing adapter id returns HTTP 400.

- [x] **Step 4: Verify targeted tests**

Run:

```powershell
python -m unittest discover -s services/quant_core/tests -t services/quant_core -k execution_adapter_certification
```

Expected: PASS.

- [x] **Step 5: Run full verification**

Run:

```powershell
npm test
npm run build
docker compose config
docker compose build
python tools\docker_smoke.py --no-build --down
git diff --check
```

- [ ] **Step 6: Commit and push**

```powershell
git add services/quant_core/quant_core/execution.py services/quant_core/quant_core/api.py services/quant_core/tests/test_quant_core.py docs/product-plan.md docs/superpowers/plans/2026-06-08-execution-adapter-certification-ledger.md
git commit -m "feat: persist adapter certification ledger"
git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push origin codex/p0-product-workspaces
```

### Notes

- Started on 2026-06-08 after execution audit context gating shipped.
- Scope intentionally does not unlock live trading, connect broker accounts, or read trade secrets.
- RED failed as expected after using the repository test root: `ExecutionAdapterCertificationStore` could not be imported because the certification ledger did not exist.
- GREEN targeted verification passed: two adapter certification tests confirm secret-free store persistence, POST/GET API behavior, audit event creation, and `liveTradingAllowed=false`.
- Full verification passed: root `npm test` with Python 130 tests and web 346 tests, production build without large chunk warnings, Docker compose config/build, Docker smoke on `127.0.0.1:5173`, and `git diff --check`.
- Docker API smoke passed against `http://127.0.0.1:5173/api/execution/adapter-certifications`: POST recorded a blocked live adapter certification run, GET returned the latest row, `liveTradingAllowed` stayed false, and fake secret/token/password values were absent from the serialized response.
