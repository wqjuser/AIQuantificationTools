# GitHub Actions CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repository CI gate that verifies the local-first quant platform can be tested, built, Docker-configured, Docker-built, and smoke-tested on every push or pull request.

**Architecture:** A GitHub Actions workflow in `.github/workflows/ci.yml` owns the hosted quality gate. The existing deployment contract test locks the expected workflow commands so Docker deployment checks do not drift from local scripts.

**Tech Stack:** GitHub Actions, Node.js 22, npm workspaces, Python 3.12, Docker Compose v2, existing `tools/docker_smoke.py`.

---

## Scope

- Add a `CI` GitHub Actions workflow for push and pull request events.
- Install Node dependencies with `npm ci`.
- Set up Python 3.12 for the quant-core tests and smoke helper.
- Run `npm test` and `npm run build`.
- Validate Docker Compose configuration.
- Build Docker images.
- Run the Docker smoke helper against the built images and tear down services.
- Document the CI gate in README and keep this plan updated with verification evidence.

## Verification Log

- Passed: targeted deployment contract test should fail first because `.github/workflows/ci.yml` is missing.
- Passed: targeted deployment contract test failed before implementation because `.github/workflows/ci.yml` was missing.
- Passed: implemented `.github/workflows/ci.yml`, README CI notes, and product plan CI status.
- Passed: targeted deployment contract test:
  - `npm run test --workspace @aiqt/web -- deployment.test.js`
- Passed: full tests:
  - `npm test`
  - Python backend: 85 tests.
  - Frontend: 218 tests.
- Passed: production build:
  - `npm run build`
- Passed: Docker validation:
  - `docker compose config`
  - `docker compose build`
  - `python tools/docker_smoke.py --no-build --down`
- Passed: whitespace and line-ending check:
  - `git diff --check`
