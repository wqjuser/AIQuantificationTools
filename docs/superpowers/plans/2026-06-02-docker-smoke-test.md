# Docker Smoke Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repeatable deployment smoke test command for the Docker Compose runtime.

**Architecture:** A Python script in `tools/docker_smoke.py` owns Docker Compose validation, optional build/start, HTTP polling, and response contract checks. Root npm scripts expose the workflow so users can run `npm run docker:smoke` without remembering the underlying Docker and HTTP commands.

**Tech Stack:** Python standard library, Docker Compose v2, root npm scripts, existing `compose.yaml`.

---

## Scope

- Add `npm run docker:smoke` as the main deployment self-check command.
- Add `npm run docker:up` and `npm run docker:down` convenience commands.
- Keep the smoke test script dependency-free and cross-platform.
- Validate `/health`, `/`, and `/api/workspace`.
- Support `--no-build`, `--down`, `--base-url`, and `--timeout` flags.

## Verification Log

- Passed: targeted tests failed before implementation because package Docker scripts and `tools/docker_smoke.py` were missing.
- Passed: implemented `tools/docker_smoke.py`, `docker:up`, `docker:down`, and `docker:smoke`.
- Passed: targeted tests:
  - `npm run test --workspace @aiqt/web -- deployment.test.js`
  - `python -m unittest -v tests.test_quant_core.QuantCoreContractTest.test_docker_smoke_validates_workspace_payload tests.test_quant_core.QuantCoreContractTest.test_docker_smoke_rejects_invalid_workspace_payload tests.test_quant_core.QuantCoreContractTest.test_docker_smoke_compose_up_args_support_optional_build`
- Passed: command runner regression test failed first because successful command output was not captured, then passed after `run_command` was updated to suppress success output and print details only on failure.
- Passed: `npm run docker:smoke -- --no-build`.
- Passed: `npm test`; Python backend now has 85 tests, frontend has 217 tests.
- Passed: `npm run build`.
- Passed: `git diff --check`.
- Passed: `docker compose ps`; `api` and `web` services remained healthy.
