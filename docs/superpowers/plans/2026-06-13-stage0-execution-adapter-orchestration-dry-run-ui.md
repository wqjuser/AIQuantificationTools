# Stage 0 - Execution Adapter Orchestration Dry Run UI

## Goal

Connect the already implemented execution adapter orchestration dry-run ledger to the product UI so Settings and Execution users can see, record, and review the evidence chain after runtime reload final acceptance.

## Guardrails

- Keep the slice paper-only and live-blocked: no broker connection, no real order, no env-var writes, no service restart.
- Reuse the existing runtime reload acceptance interaction pattern instead of adding a new workflow shape.
- Update `docs/product-plan.md` after the implementation lands.
- Verify with focused tests, full web tests/build, docker smoke, and browser smoke before committing.

## TDD Checklist

- [x] RED: layout contract requires dry-run history loading, row building, Settings controls, Promotion Queue evidence, and CSS hooks.
- [x] GREEN: wire API imports, state, refresh, row derivation, Settings recording controls, and Promotion Queue evidence.
- [x] REFACTOR: keep labels and helpers compact and consistent with existing adapter certification/reload evidence UI.
- [x] DOCS: close the product-plan dry-run UI gap.
- [x] VERIFY: run focused tests, full tests/build, docker smoke, browser smoke.
- [ ] SHIP: commit and push through the configured proxy.

## Acceptance Notes

- Settings should show a dry-run panel derived from recent runtime reload final acceptance rows.
- The dry-run action should submit five explicit confirmations and then refresh settings history.
- Execution Promotion Queue should show recent orchestration dry-run evidence rows.
- Recording a dry-run must not change `liveTradingAllowed` or imply live trading readiness.
