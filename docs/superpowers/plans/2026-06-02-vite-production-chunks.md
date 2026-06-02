# Vite Production Chunk Optimization Plan

## Summary

The production web build was emitting a single `index` JavaScript asset above Vite's 500 kB warning threshold. This is a P0 platform reliability task: the app should remain easy to build, inspect and package for Web/Tauri without warning noise hiding real problems.

## User Task

Start the local service and remove the large chunk warning and related production build warnings.

## Product Area

- P0 platform skeleton
- Frontend build and desktop/Web packaging

## Plan

1. Reproduce the production warning with `npm run build`.
2. Add a regression test that requires explicit production vendor chunking and forbids hiding the warning by raising `chunkSizeWarningLimit`.
3. Configure Vite/Rollup `manualChunks` for heavy stable dependencies:
   - `vendor-charts` for `klinecharts`
   - `vendor-icons` for `lucide-react`
   - `vendor-react` for React runtime packages
   - `vendor-tauri` for desktop bridge packages
   - `vendor` for remaining third-party dependencies
4. Add repository line-ending attributes so Git does not keep warning that LF files will be rewritten as CRLF on Windows.
5. Suppress third-party yfinance stderr noise inside the quote and K-line fallback paths while preserving unavailable/data-quality warnings in structured responses.
6. Rebuild and confirm no chunk exceeds the warning threshold.
7. Start the Python core and Vite web service, then verify health endpoints.

## Acceptance Criteria

- `npm run build` completes without the Vite large chunk warning.
- The main app chunk is below the default 500 kB warning threshold.
- Automated tests lock the chunking policy.
- Local API and Web service are reachable after the change.

## Verification

- Passed: `npm run test --workspace @aiqt/web -- layout-css.test.js`.
- Passed: `npm run build`; output split the largest JavaScript assets into `index` 245.66 kB, `vendor-charts` 201.86 kB and `vendor-react` 192.49 kB with no large chunk warning.
- Passed: `git diff --check` after line-ending policy.
- Passed: `python -m unittest -v tests.test_quant_core.QuantCoreContractTest.test_yfinance_quote_fallback_suppresses_vendor_stderr`.
- Passed: `npm test`; Python backend now has 80 tests, frontend has 212 tests.
- Passed: local API health check returned `ok quant-core`.
- Passed: Web service returned HTTP 200 at `http://127.0.0.1:5173/`; in-app browser opened the app and showed `AI Quantification Tools` / `浦发银行 · 600000`.
- Passed: after restarting services and requesting `/api/workspace`, the new API stderr log stayed empty.
