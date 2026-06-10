# Promotion runtime readiness evidence

## Goal

Surface the adapter environment binding and runtime reload plan evidence that already exists in the API/model layer inside the execution promotion queue, without enabling live trading or changing the paper-only safety boundary.

## Scope

- Load recent environment binding and runtime reload plan rows in `App.tsx`.
- Pass those rows into `buildPromotionReadiness`.
- Include the latest matching rows in the adapter certification stage detail.
- Render recent environment binding and runtime reload plan evidence in `PromotionQueuePanel`.
- Update the product plan to mark this UI wiring as shipped.

## Non-goals

- No real environment variable writes.
- No container restart orchestration.
- No live broker connection.
- No change to `liveTradingAllowed` or final human/live gates.

## Progress

- [x] Add failing tests for readiness detail and App/panel wiring.
- [x] Implement row filtering, readiness copy, App state/loading and panel rendering.
- [x] Update product plan.
- [x] Run targeted tests, build, Docker smoke, and browser smoke.
- [x] Commit and push with the configured proxy.
