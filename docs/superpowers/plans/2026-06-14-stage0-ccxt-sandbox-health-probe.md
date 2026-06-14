# Stage 0 CCXT Sandbox Health Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real exchange-adapter health probe for ccxt sandbox/testnet without placing orders or exposing secrets.

**Architecture:** Create a focused Python health-probe module that can use a fake provider in tests and optional ccxt at runtime. The API returns a structured, secret-free `adapterHealthProbe` with read-only checks for sandbox mode, market loading, exchange status/time, and optional account sync when credentials are configured. The frontend loads this result in Settings and displays whether the adapter is ready for the next paper-order lifecycle slice.

**Tech Stack:** Python local core HTTP API, optional `ccxt`, React/TypeScript typed client and Settings UI, Python unittest, Vitest source/model tests.

---

## Scope

- Backend `ExecutionAdapterHealthProbe` model and `probe_ccxt_sandbox_health`.
- `GET /api/execution/adapter-health/ccxt-sandbox?exchange=binance&adapterId=ccxt-live`.
- Optional runtime ccxt integration that calls `set_sandbox_mode(True)` before any exchange call.
- Typed frontend loader, row model, Settings health panel, and product-plan update.

## Non-Goals

- No order creation, cancellation, or real money routing.
- No raw API key, secret, passphrase, wallet, token, password, or private key in request/response.
- No env writes, container restart, secret-store mutation, or `liveTradingAllowed=true`.
- No A-share or US broker adapter implementation in this slice.

## Tasks

- [x] Backend: write failing model/API tests for ready, credential-skipped, ccxt-missing, and secret-redaction cases.
- [x] Backend: implement `execution_adapter_health.py` with fake-provider friendly probe logic.
- [x] Backend: wire `GET /api/execution/adapter-health/ccxt-sandbox`.
- [x] Frontend API/model: write failing tests for typed loader and compact health rows.
- [x] Frontend API/model: implement URL builder, response validator, loader, and workbench row builder.
- [x] UI: write failing layout contract for Settings health panel and wire App state/actions.
- [x] UI: render a compact Settings panel with refresh action and next-step language.
- [x] Deployment: switch the frontend default API base to same-origin `/` and keep Vite `/api` proxying to local core so Docker-served Settings can load the probe through 5173.
- [x] Contract hardening: keep credential source names in the dedicated `credentials` object and remove sensitive-looking keys from `metadata` so the frontend secret-leak guard accepts the blocked/read-only probe.
- [x] Docs: update product plan and this plan with shipped details.
- [ ] Verification: run focused tests, full tests/build, Docker/browser smoke, diff check, commit, proxy push.

## Acceptance Criteria

- A fake provider can prove the probe records sandbox mode before market/status/time/balance checks.
- Missing ccxt returns a blocked health result with `ccxt_not_installed`, not a server crash.
- Missing credentials skips account sync with a review check, not a failure.
- Configured credentials allow the account-sync check to run through the provider abstraction.
- All response metadata is secret-free and includes `paperOnly: true`, `liveTradingAllowed: false`, and `orderRoutingEnabled: false`.
- Settings exposes a visible ccxt sandbox health section and a manual refresh action.

## Verification Log

- [x] RED backend focused test: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k ccxt_sandbox_health` failed before implementation with missing module and API 404.
- [x] GREEN backend focused test: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k ccxt_sandbox_health`.
- [x] RED frontend API/model tests: Vitest focused run failed before implementation with missing URL loader, row builder, and Settings source hooks.
- [x] GREEN frontend API/model tests: `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts -t "ccxt sandbox|health probe"`.
- [x] GREEN layout contract test: `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts src/lib/layout-css.test.js -t "ccxt sandbox|health probe"`.
- [x] Browser smoke initially exposed two integration gaps: Docker-served frontend still targeted `127.0.0.1:8765`, and `metadata.credentialSources` tripped the frontend secret-key guard even though values were not raw secrets.
- [x] GREEN focused deployment/health regression: `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts src/lib/deployment.test.js -t "same-origin|base URL|ccxt sandbox|Vite development|Docker"`.
- [x] GREEN focused contract regression: `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k ccxt_sandbox_health` and `npm --workspace @aiqt/web test -- --run src/lib/terminal-api.test.ts src/lib/terminal-workbench.test.ts -t "ccxt sandbox|health probe|same-origin"`.
- [x] Full Python suite: `python -m unittest discover -s services/quant_core/tests -t services/quant_core` ran 176 tests.
- [x] Full monorepo suite: `npm test` ran 176 Python tests and 523 Vitest tests.
- [x] Production frontend build: `npm run build`.
- [x] Docker smoke: `npm run docker:smoke` returned health ok and web ok on `http://127.0.0.1:5173`.
- [x] Browser smoke for Settings workspace: `http://127.0.0.1:5173/?workspace=settings` rendered one CCXT sandbox health row after Settings hydration, exposed the refresh action, and reported zero app console errors.
- [x] `git diff --check`.
