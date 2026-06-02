# Docker Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AIQuantificationTools deployable with Docker Compose as a Web container plus Python core container.

**Architecture:** The Python quant core runs as an internal `api` service bound to `0.0.0.0:8765` with a persistent `/app/data` volume. The React/Vite app is built into static assets served by Nginx, and Nginx proxies `/api/*` and `/health` to the `api` service so browser clients can use same-origin API calls.

**Tech Stack:** Docker Compose v2 `compose.yaml`, Python 3.12 slim, Node 22 Alpine build stage, Nginx Alpine runtime, Vite build-time `VITE_QUANT_API_BASE=/`.

---

## Scope

- Add first-class Docker deployment files without changing the existing local `npm run api` and `npm run dev` workflow.
- Keep API keys optional and injected by environment variables.
- Persist SQLite audit/cache data in a named Docker volume.
- Keep production frontend API calls same-origin through Nginx instead of browser-to-container `127.0.0.1:8765`.

## Tasks

### Task 1: Deployment Contract Tests

**Files:**
- Modify: `apps/web/src/lib/terminal-api.test.ts`
- Create: `apps/web/src/lib/deployment.test.js`
- Modify: `services/quant_core/tests/test_quant_core.py`

- [x] **Step 1: Write failing tests**

Add tests for:
- `resolveQuantCoreBaseUrl({ VITE_QUANT_API_BASE: "/" })` returning `/`.
- URL builders producing `/api/...` relative URLs.
- `compose.yaml`, `Dockerfile.api`, `apps/web/Dockerfile`, and `apps/web/nginx.conf` containing the deployment contract.
- API bind resolution supporting `QUANT_CORE_HOST=0.0.0.0` and `QUANT_CORE_PORT=8765`.

- [ ] **Step 2: Run tests and confirm they fail before implementation**

Run:

```powershell
npm run test --workspace @aiqt/web -- terminal-api.test.ts deployment.test.js
python -m unittest -v tests.test_quant_core.QuantCoreContractTest.test_quant_api_bind_uses_container_environment
```

Expected: tests fail because Docker files and env bind helper do not exist yet.

### Task 2: Container Runtime Implementation

**Files:**
- Modify: `services/quant_core/quant_core/api.py`
- Create: `Dockerfile.api`
- Create: `apps/web/Dockerfile`
- Create: `apps/web/nginx.conf`
- Create: `compose.yaml`
- Create: `.dockerignore`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Implement API bind helper**

Add `resolve_api_bind` and make `run()` read `QUANT_CORE_HOST` / `QUANT_CORE_PORT` while preserving local defaults.

- [ ] **Step 2: Implement same-origin frontend API support**

Add a URL helper in `apps/web/src/lib/terminal-api.ts` so `/` builds `/api/...` URLs.

- [ ] **Step 3: Add Docker files**

Add:
- API Dockerfile using `python:3.12-slim`.
- Web Dockerfile using Node 22 build stage and Nginx runtime.
- Nginx SPA + API reverse proxy config.
- Compose file with `api`, `web`, health checks, named data volume, and `${AIQT_WEB_PORT:-8080}:80`.
- `.dockerignore` to keep images small.

- [ ] **Step 4: Document deployment**

Update README and architecture docs with build, run, health check, data volume and optional API key notes.

### Task 3: Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-06-02-docker-deployment.md`

- [ ] **Step 1: Run targeted tests**

```powershell
npm run test --workspace @aiqt/web -- terminal-api.test.ts deployment.test.js
python -m unittest -v tests.test_quant_core.QuantCoreContractTest.test_quant_api_bind_uses_container_environment
```

- [ ] **Step 2: Run full test suite**

```powershell
npm test
npm run build
git diff --check
```

- [ ] **Step 3: Validate Docker config**

If Docker is available:

```powershell
docker compose config
docker compose build
docker compose up -d
```

Then verify:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/health
Invoke-WebRequest http://127.0.0.1:8080/
```

If Docker is unavailable, record that automated config/file tests passed and Docker runtime verification was skipped.

## Verification Log

- Passed: targeted tests failed before implementation for missing Docker files, same-origin URL support and API bind helper.
- Passed: targeted tests after implementation:
  - `npm run test --workspace @aiqt/web -- terminal-api.test.ts deployment.test.js`
  - `python -m unittest -v tests.test_quant_core.QuantCoreContractTest.test_quant_api_bind_uses_container_environment`
- Passed: `npm test`; Python backend now has 81 tests, frontend has 216 tests.
- Passed: `npm run build`; production chunks remain below the Vite large chunk warning threshold.
- Passed: `git diff --check`.
- Passed: `docker compose config`.
- Passed: `docker compose build`; Web Dockerfile suppresses npm update/funding noise with `NPM_CONFIG_UPDATE_NOTIFIER=false` and `npm ci --no-audit --fund=false`.
- Passed: `docker compose up -d`; `api` and `web` services reached healthy state.
- Passed: `Invoke-RestMethod http://127.0.0.1:8080/health`.
- Passed: `Invoke-WebRequest http://127.0.0.1:8080/`.
- Passed: `Invoke-RestMethod http://127.0.0.1:8080/api/workspace`.
- Passed: in-app browser opened `http://127.0.0.1:8080/` and showed `AI Quantification Tools` / `浦发银行 · 600000`.
