# AIQuant Terminal Design

## Summary

AIQuant Terminal is a local-first professional quant terminal. The product direction combines:

- QuantDinger-style closed-loop quant workflow: idea, data, strategy, backtest, optimize, execute, monitor.
- FinceptTerminal-style dense terminal workspace: watchlists, charts, research modules, portfolio risk, news, node workflow, execution panels.
- TradingAgents-style AI research committee: specialized agents analyze, debate, score risk, and write a traceable decision log.

The first production-shaped version must not be a toy dashboard. It should establish the complete terminal architecture, including live-trading interfaces, broker/exchange adapters, risk controls, permissions, and audit logs. Real-money execution is still guarded by safety gates: default `paper_only`, adapter certification, risk approval, and explicit user confirmation.

## Product Shape

The first screen is a terminal workbench with three persistent regions:

- Left navigation: quant loop and terminal modules.
- Center workspace: market chart, factor overlays, strategy snapshot, backtest metrics, node workflow, paper/live execution monitor.
- Right AI panel: multi-agent committee, decision log, evidence summary, and AI actions.

Primary workflow:

1. Select market, symbol, universe, and data range.
2. Inspect chart, watchlist, events, and market scanner output.
3. Build a strategy through visual rules, node workflow, or Python strategy mode.
4. Run backtest and optimization with reproducible data snapshots.
5. Run multi-agent AI review across technical, fundamental, news, sentiment, bull, bear, risk, and portfolio manager roles.
6. Promote to paper trading or live execution only after risk checks and adapter certification.
7. Monitor orders, positions, PnL, drawdown, decisions, and audit history.

## Core Modules

### Terminal Shell

- Multi-panel desktop/web workspace using the existing React/Tauri direction.
- Terminal-like density, not a landing page or decorative dashboard.
- Tabs or docked panels for Watchlist, Chart, Strategy, Backtest, Agent Review, Portfolio, News, Execution, Broker Center, and Settings.
- Preset workspace layouts for Research, Backtest, Agent Review, and Execution.

### Market Data

- Unified OHLCV schema across A-shares, US equities, and crypto.
- Free-source-first adapters, with optional API keys.
- Daily data and recent-minute data with local cache accumulation.
- Data quality metadata: source, coverage, gaps, adjustment mode, time zone, and warnings.
- Adapter expansion must not change the internal strategy/backtest interfaces.

### Strategy Lab

- Visual strategy builder for product-safe rules: indicators, entry/exit, position sizing, stop loss, take profit, max drawdown.
- Node workflow for data, factors, backtest, agent review, and execution routing.
- Python strategy mode for advanced users, with sandboxing and reproducibility requirements before real execution.
- Strategy snapshots must include source rules/code, parameters, data snapshot id, fee model, and execution assumptions.

### Backtest And Optimization

- Backtest runs produce metrics, equity curve, trade list, position history, benchmark comparison, and data quality notes.
- Optimization supports parameter sweeps and walk-forward style validation.
- Backtests are not allowed to silently reuse changed data; each run records the exact data snapshot.

### AI Agent Committee

- AI is not a generic chat panel. It is a structured review system.
- Required agent roles: Technical Analyst, Fundamental Analyst, News Analyst, Sentiment Analyst, Bull Researcher, Bear Researcher, Risk Manager, Portfolio Manager.
- Every agent output must be tied to provided context and recorded in a decision log.
- Final output includes thesis, counter-thesis, key evidence, risks, confidence, suggested next action, and disclaimer.
- AI must not guarantee returns, invent unseen data, or bypass execution risk controls.

### Execution Center

- Unified execution interface for paper trading and future live trading.
- Required surfaces: accounts, broker connections, positions, open orders, order history, rejected orders, risk state, and audit log.
- Live adapters are first-class architecture pieces from the start, not afterthoughts.
- Initial live adapter candidates:
  - A-shares: adapter interface only until a legal broker API is available.
  - US equities: IBKR/Alpaca-style adapter shape.
  - Crypto: ccxt-style exchange adapter shape.

## Safety Gates

Default execution mode is `paper_only`.

Live trading requires all of the following:

- A configured broker/exchange adapter.
- Adapter certification checks for connection, account sync, market data, order submit, cancel, fills, rejects, and reconnect behavior.
- Risk rules for max order value, max position, max daily loss, max drawdown, symbol allowlist, trading session, and emergency stop.
- Explicit user confirmation before first live order for each adapter/account/strategy combination.
- Full audit records for agent decision, strategy snapshot, risk check, order request, broker response, and final state.

Full automation remains disabled until paper trading proves the full execution path.

## Architecture

Frontend:

- React/TypeScript terminal workspace.
- Shared Web and Tauri desktop frontend.
- Dense, dockable panels with typed local state.
- API client generated or typed against backend contracts.

Backend:

- Python local service for market data, cache, strategy parsing, backtest, AI orchestration, and execution adapters.
- SQLite or DuckDB/Parquet local persistence for research data, runs, decisions, and audit records.
- Adapter interfaces for data providers, AI providers, and broker/exchange execution.

Data flow:

1. Market data adapter fetches and normalizes data.
2. Cache records data and quality metadata.
3. Strategy Lab creates a versioned strategy snapshot.
4. Backtest service runs against a specific data snapshot.
5. Agent committee reviews the run and writes a decision log.
6. Execution center receives an approved paper/live order request.
7. Risk engine accepts, rejects, or requires confirmation.
8. Execution adapter submits to paper broker or certified live broker.
9. Audit log records every state transition.

## Implementation Priorities

Phase 1: Replace the current demo dashboard with the terminal workbench shell.

- Build the persistent left quant-loop navigation.
- Build center panels for chart, strategy snapshot, backtest metrics, node workflow, and execution monitor.
- Build right AI committee panel and decision log.
- Use mocked but realistic data contracts where backend capability is not ready.

Phase 2: Expand backend contracts to match the terminal.

- Add typed models for workspace layout, instruments, data snapshots, strategy snapshots, agent runs, risk checks, and execution audit records.
- Add deterministic test fixtures for multi-market data, backtests, agent logs, and paper execution.

Phase 3: Implement real local workflows.

- Wire data sync to cache.
- Run strategy/backtest from the terminal UI.
- Persist backtest and decision logs.
- Route approved orders to paper execution.

Phase 4: Add adapter certification surfaces.

- Add broker adapter registry and certification status.
- Add live adapter interfaces and disabled-by-default configuration.
- Add user confirmation flow for live order capability.

## Acceptance Criteria

- The first screen looks and behaves like a professional quant terminal, not a demo dashboard.
- The UI makes the quant loop obvious without hiding terminal modules.
- AI appears as a multi-agent committee with traceable decision logs, not a generic chat widget.
- Execution Center exists from the first version and clearly separates paper, certified live, and blocked live states.
- No path can place a live order unless adapter certification, risk checks, and user confirmation pass.
- Backtests, agent decisions, and execution attempts are reproducible and auditable.

## Reference Projects

- QuantDinger: https://github.com/brokermr810/QuantDinger
- TradingAgents: https://github.com/TauricResearch/TradingAgents
- FinceptTerminal: https://github.com/Fincept-Corporation/FinceptTerminal
