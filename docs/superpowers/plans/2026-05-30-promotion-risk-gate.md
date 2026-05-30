# Promotion Risk Gate Implementation Plan

Goal: keep the paper-to-live promotion queue aligned with the same explicit risk handoff used by paper execution.

P0/P3 mapping:
- P0 requires simulated execution and replay to stay bound to audited strategy evidence.
- P3 requires live promotion to stay blocked until risk, adapter, and human gates are all explicit.
- A historical paper fill must not make an incomplete strategy look eligible for promotion.

Scope:
- Add backend coverage for an audited run with a filled paper execution but incomplete `strategyConfig.risk`.
- Make `build_promotion_candidate` set the `risk-approval` stage to blocked when the audited strategy risk is incomplete.
- Keep paper execution evidence visible in the candidate while preventing promotion status from advancing.
- Add Chinese UI copy for the new risk-blocked detail.

Out of scope:
- Live broker certification.
- Human approval persistence.
- Portfolio-level risk aggregation.

Progress:
- [x] Add failing promotion candidate test for incomplete strategy risk.
- [x] Require explicit strategy risk before promotion can move past `blocked`.
- [x] Keep normal promotion API/export fixtures on explicit audited risk.
- [x] Add localized detail for the new blocked reason.
- [x] Run full test and build verification.

Verification:
- [x] `python -m unittest discover -s services/quant_core/tests -t services/quant_core -k promotion_candidate`
- [x] `python -m unittest discover -s services/quant_core/tests -t services/quant_core`
- [x] `npm run test --workspace @aiqt/web -- src/lib/terminal-api.test.ts --run -t "promotion candidate"`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
