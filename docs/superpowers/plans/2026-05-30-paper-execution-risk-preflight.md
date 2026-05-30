# Paper Execution Risk Preflight Implementation Plan

Goal: prevent paper trading from creating simulated orders when an audited run has an incomplete structured risk configuration.

P0 mapping:
- Paper Trading is part of the evidence chain and must not silently default missing risk limits.
- Execution handoff must reference an audited run, data snapshot, strategy revision, and explicit risk fields.
- Frontend errors must distinguish core risk rejections from offline fallback.

Scope:
- Add backend coverage for rejecting audited runs whose `strategyConfig.risk` lacks positive `positionPct`, `stopLossPct`, `takeProfitPct`, or `maxDrawdownPct`.
- Gate `POST /api/research/runs/{runId}/paper-executions` before `PaperExecutionAdapter` creates an order.
- Keep direct low-level paper execution helpers usable for tests and future adapters; enforce this at the API handoff.
- Surface core 400 rejection details in the web API client as `source: "core"` with no execution record.

Out of scope:
- Live broker execution.
- Portfolio-level cross-symbol risk.
- Strategy DSL expansion.

Progress:
- [x] Add failing backend API test for incomplete strategy risk handoff.
- [x] Add failing frontend API test for core paper execution rejection handling.
- [x] Implement `validate_paper_execution_handoff` before paper order creation.
- [x] Return core rejection details without creating fallback execution state.
- [x] Run full test and build verification.

Verification:
- [x] `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k paper_execution_api_rejects_incomplete`
- [x] `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts --run -t "paper execution gate rejections"`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
