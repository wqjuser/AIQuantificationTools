**Goal:** Persistently reload recent execution adapter certification apply preflight results from the local core audit ledger.

**Architecture:** Add a read-only API endpoint backed by `AuditEventStore` for `execution_adapter_certification_apply` events, expose a typed frontend loader, and hydrate the Settings execution certification apply ledger during status refresh. This keeps apply preflight evidence visible after reload without storing secrets, writing environment variables, restarting containers, or enabling live trading.

**Scope**

- Backend: `GET /api/execution/adapter-certifications/applies?adapterId=...&limit=...`.
- Frontend API: `loadExecutionAdapterCertificationApplies(...)` returning normalized apply rows.
- App wiring: Settings refresh loads recent apply preflight rows for live adapters.
- Docs: product plan current-state note updated after implementation.

**Safety Boundaries**

- `liveTradingAllowed` remains `false`.
- `paperOnly` remains `true`.
- No raw secret, token, API key, private key, or password values are accepted or returned.
- No local secret-store write, env write, container restart, broker connection, or real order path is added in this slice.

**TDD Plan**

- [x] RED: backend contract test proves recent apply history is returned newest-first and redacted.
- [x] RED: frontend API test proves URL construction and response normalization.
- [x] RED: source-layout contract proves Settings refresh loads apply history from the core.
- [x] GREEN: implement backend endpoint, frontend loader, and App refresh wiring.
- [x] VERIFY: run targeted tests, full tests, build, Docker smoke, and browser reload check.

**Progress**

- RED: `python -m unittest ...test_execution_adapter_certification_apply_history_lists_recent_preflights_without_leaking_secret` failed with `404 != 200`, proving the GET history endpoint was missing.
- RED: `npm --prefix apps/web test -- --run src/lib/terminal-api.test.ts -t "loads execution adapter certification apply history"` failed because `loadExecutionAdapterCertificationApplies` did not exist.
- RED: `npm --prefix apps/web test -- --run src/lib/layout-css.test.js -t "certification apply preflight"` failed because Settings did not load apply history.
- GREEN: added `execution_adapter_certification_apply_payload_from_audit_event`, `GET /api/execution/adapter-certifications/applies`, `buildExecutionAdapterCertificationAppliesUrl`, `loadExecutionAdapterCertificationApplies`, response validation, and Settings refresh hydration.
- GREEN: targeted backend/API/layout tests now pass.
- VERIFY: Python unit discovery passed with 132 tests, root `npm test` passed with 359 web tests plus Python tests, and `npm run build` completed without chunk warnings.
- VERIFY: `docker compose config`, `git diff --check`, `docker compose build`, and `python tools\docker_smoke.py --no-build --down` passed; compose was restarted afterward and API/Web containers are healthy on port 5173.
- VERIFY: browser reload check on `http://127.0.0.1:5173/?workspace=settings` showed 5 apply preflight rows after refresh, including the seeded `待受控重启` result loaded from history.
