# Stage-Gated Product Development Design

## Problem

AIQuantificationTools is intended to become a full-featured quant trading platform, but recent implementation drift mixed market, strategy, portfolio, execution, audit, and live-readiness work in the same development stream. That made the product feel unfocused and made the UI expose advanced areas before the earlier market and research workflow was dependable.

## Design

The product now uses explicit delivery stages:

1. Stage 0 · Platform Foundation: deployment, settings, audit, signing, import/export, and safety boundaries stay in maintenance mode.
2. Stage 1 · Market and Research: the current active stage. New feature work should focus on symbol search, quotes, K-lines, cache status, data quality, chart behavior, and research notes.
3. Stage 2 · Strategy and Backtest: planned. Resume only after Stage 1 exit criteria pass.
4. Stage 3 · AI Review: planned. AI remains evidence-bound and resumes after strategy/backtest contracts are stable.
5. Stage 4 · Portfolio and Paper: planned. Portfolio risk, paper orders, approvals, simulations, and replay resume after single-strategy evidence is dependable.
6. Stage 5 · Live Readiness: planned. Broker and exchange adapters remain locked until paper trading and audit gates are mature.

Every workspace is mapped to one delivery stage. The UI displays the stage and stage status next to each workspace, so later workspaces are visible as part of the full platform but no longer look like the current development focus.

## Current Implementation Slice

- Add a frontend model for delivery stages and workspace-to-stage mapping.
- Keep the existing workspace readiness statuses, but add separate delivery-stage metadata.
- Translate stage labels/statuses in `zh-CN` and `en-US`.
- Show compact stage metadata in the left workspace navigation.
- Update the product plan so future work must map to an active stage or be explicitly classified as foundation maintenance.

## Acceptance

- Exactly one delivery stage is marked current: Stage 1 · Market and Research.
- Market and Research workspaces show current-stage metadata.
- Audit and Settings show foundation maintenance metadata.
- Strategy, Backtest, AI Review, Portfolio, Execution, and Live Readiness are marked planned.
- The stage model has automated tests.
- Planning docs describe the stage gate and current focus.
