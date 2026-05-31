# Backtest RSI Parameter Scan Plan

Goal: make Backtest Lab parameter sensitivity handle the first real multi-condition case: SMA entry/exit plus RSI confirmation threshold.

Product mapping:
- Work area: Backtest Lab and Strategy Lab.
- User value: compare nearby SMA windows and RSI confirmation thresholds on the same audited K-line snapshot before staging a new candidate.
- Product guardrail: this remains sensitivity analysis, not an optimizer or buy/sell recommendation.

Scope:
- Keep existing SMA-only scan behavior unchanged for simple strategies.
- When the active entry rule includes `Close > SMAx AND RSIy > z`, scan SMA entry windows, SMA exit windows, and RSI threshold variants around the current threshold.
- Simulate candidates against `researchRun.dataSnapshot.bars` using the same fee, slippage, position, stop loss, and take profit assumptions already used by the scan.
- Stage a selected RSI-threshold candidate back into the Strategy Lab draft, clear audited evidence, and require a fresh pipeline run.
- Show the combined condition as a compact label in the UI and markdown report.

Out of scope:
- Optimizer endpoints.
- Walk-forward validation.
- AI-generated parameter recommendations.
- Multi-symbol parameter scans.

Progress:
- [x] Existing SMA scan behavior identified.
- [x] Red tests planned for RSI threshold scan rows and candidate staging.
- [x] RSI threshold scan implementation.
- [x] UI/markdown condition label update.
- [x] Product plan and architecture documentation update.
- [x] Verification completed.
- [ ] Commit and push.

Implementation notes:
- `BacktestParameterScanRow` now carries the optional staged RSI threshold.
- SMA-only strategies still produce the original nine nearby window combinations.
- SMA + RSI confirmation strategies produce 27 combinations from entry window, exit window, and RSI threshold variants.
- Local scan simulation now honors RSI confirmation and volume confirmation gates before opening a position.
- Markdown and UI scan tables now use a single combined condition label so additional conditions do not fragment the layout.

Verification target:
- Targeted `terminal-workbench` tests should fail before implementation and pass after.
- Full `npm test`.
- Production `npm run build`.
- `git diff --check`.
- Local HTTP smoke check against the running Vite app.
- Browser automation smoke is currently blocked by local `node_repl` sandbox startup failure (`windows sandbox failed: spawn setup refresh`), so use HTTP smoke until that environment issue is resolved.

Verification result:
- `npm run test --workspace @aiqt/web -- src/lib/terminal-workbench.test.ts`: 106 passed after the initial red failure.
- `npm test`: Python 73 passed, frontend 201 passed.
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed with CRLF normalization warnings only.
- `Invoke-RestMethod http://127.0.0.1:5173/?workspace=strategy`: returned the Vite root page.
