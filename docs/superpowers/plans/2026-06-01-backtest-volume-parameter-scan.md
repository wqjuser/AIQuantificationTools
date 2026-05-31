# Backtest Volume Parameter Scan Plan

Goal: make Backtest Lab parameter sensitivity cover volume-confirmed strategies, not only price and RSI gates.

Product mapping:
- Work area: Backtest Lab and Strategy Lab.
- User value: when a strategy uses `Close > SMAx AND Volume > VOLy`, compare nearby VOL confirmation windows on the same audited K-line snapshot before staging a candidate.
- Guardrail: this remains sensitivity analysis and never becomes an optimizer or buy/sell recommendation.

Scope:
- Keep existing SMA-only and SMA+RSI scan behavior unchanged.
- When the active entry rule includes volume confirmation, scan nearby VOL windows alongside entry SMA and exit SMA windows.
- Simulate candidates against `researchRun.dataSnapshot.bars` using the selected candidate VOL window, plus the same fee, slippage, position, stop loss, and take profit assumptions.
- Stage a selected VOL-window candidate back into Strategy Lab as a fresh unaudited draft.
- Reuse the combined condition label already introduced for RSI parameter scans.

Out of scope:
- Volume threshold multipliers.
- Multi-symbol or portfolio parameter scans.
- Backend optimizer endpoints.
- AI-generated parameter recommendations.

Progress:
- [x] Existing parameter scan code path identified.
- [x] Red tests planned for VOL window rows and candidate staging.
- [x] VOL window scan implementation.
- [x] Product plan and architecture documentation update.
- [x] Verification completed.
- [ ] Commit and push.

Implementation notes:
- `BacktestParameterScanRow` now carries an optional `entryVolumeWindow`.
- SMA-only strategies still produce the existing nine combinations.
- Volume-confirmed strategies produce 27 combinations from entry SMA, exit SMA, and VOL window variants.
- Strategies that combine RSI and volume confirmations use the same nested candidate expansion, so the scan can represent all enabled confirmation dimensions.
- Candidate staging writes the selected VOL window back into the Strategy Lab draft and clears old audited evidence.

Verification target:
- Targeted `terminal-workbench` tests fail before implementation and pass after.
- Full `npm test`.
- Production `npm run build`.
- `git diff --check`.
- Local HTTP smoke check against the running Vite app.
- Browser automation smoke is currently blocked by local `node_repl` sandbox startup failure (`windows sandbox failed: spawn setup refresh`), so use HTTP smoke until that environment issue is resolved.

Verification result:
- Red phase: `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts` failed because VOL scan still returned 9 rows and the VOL candidate id could not be staged.
- Green phase: targeted `terminal-workbench` tests passed with 108 tests.
- `npm test`: Python 73 passed, frontend 203 passed.
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed with CRLF normalization warnings only.
- `Invoke-RestMethod http://127.0.0.1:5173/?workspace=strategy`: returned the Vite root page.
