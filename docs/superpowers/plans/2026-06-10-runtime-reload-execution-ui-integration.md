# Runtime reload execution UI integration

## Goal

Connect the paper-only runtime reload execution evidence ledger to the live promotion workflow. The execution evidence should be loaded with other live adapter evidence, summarized in promotion readiness, and rendered in the Promotion Queue without enabling real reloads or live trading.

## Scope

- Load `adapter-runtime-reload-executions` history during settings refresh.
- Build runtime reload execution rows in the app state.
- Pass execution rows into `buildPromotionReadiness`.
- Show recent runtime reload execution evidence in the Promotion Queue.
- Update the product plan.

## Non-goals

- No new backend endpoint.
- No actual Docker/container reload command.
- No environment variable writes.
- No broker connection or live order route enablement.
- No final human confirmation gate changes.

## Progress

- [x] Add failing promotion readiness and UI static tests.
- [x] Implement runtime reload execution row wiring in App.
- [x] Implement promotion readiness consumption of runtime reload execution evidence.
- [x] Render recent execution evidence in the Promotion Queue.
- [x] Update product plan.
- [x] Run tests/build/Docker smoke.
- [ ] Commit and push with the configured proxy.
