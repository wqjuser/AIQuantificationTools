# Settings Status Contract Implementation Plan

Goal: make the Settings workspace a real product surface by reading data-source, API-key, cache, and adapter readiness from the local core instead of only rendering static explanatory cards.

P0 mapping:
- Settings is the control plane for market data sources, local-only API key visibility, cache status, and live-trading safety gates.
- No secret values are returned to the browser; the endpoint only reports whether optional local configuration exists.
- Live execution remains blocked unless adapter certification, risk approval, and human confirmation are explicitly true.

Scope:
- Add a read-only `/api/settings/status` local-core endpoint.
- Report data-source rows for A shares, US equities, and crypto with quote source, kline source, key requirement, key configured flag, and notes.
- Report local cache database path and whether the file currently exists.
- Report execution adapter readiness rows for paper, A-share live, US live, and crypto live routes.
- Add frontend API client coverage and render Settings from the status payload when available, falling back to the existing local model when the core is unavailable.

Out of scope:
- Persisting API keys from the UI.
- Editing data-source priority.
- Certifying live adapters.
- Enabling real-money execution.

Progress:
- [x] Add failing backend API test for settings status.
- [x] Add failing frontend API client test.
- [x] Implement local-core status builder and endpoint.
- [x] Implement frontend loader and Settings panel model.
- [x] Update product and architecture docs.
- [x] Run full verification.

Verification:
- [x] `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k settings_status`
- [x] `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts --run -t "settings status"`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
