from __future__ import annotations

from dataclasses import asdict, replace
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from quant_core.adapters import DemoMarketDataAdapter, MarketDataAdapter
from quant_core.ai import LocalResearchAssistant
from quant_core.backtest import BacktestEngine
from quant_core.cache import MarketDataCache
from quant_core.domain import AiResearchRequest, Condition, Market, MarketDataRequest, RiskRules, StrategyConfig, Timeframe
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.terminal import (
    BacktestAssumptions,
    BacktestMetric,
    DecisionLogEntry,
    Instrument,
    ResearchRunSummary,
    StrategySnapshot,
    TerminalWorkspace,
    build_terminal_workspace,
)


def run_terminal_research(
    market: Market = "ashare",
    symbol: str = "600000",
    timeframe: Timeframe = "1d",
    *,
    adapter: MarketDataAdapter | None = None,
    assistant: LocalResearchAssistant | None = None,
    engine: BacktestEngine | None = None,
    cache: MarketDataCache | None = None,
    run_store: ResearchRunStore | None = None,
) -> TerminalWorkspace:
    data_adapter = adapter or DemoMarketDataAdapter()
    research_assistant = assistant or LocalResearchAssistant()
    backtest_engine = engine or BacktestEngine()
    market_cache = cache or MarketDataCache(Path("data/market.sqlite"))
    audit_store = run_store or ResearchRunStore(Path("data/research_runs.sqlite"))
    created_at = datetime.now(timezone.utc)

    request = MarketDataRequest(market=market, symbol=symbol, timeframe=timeframe, end=created_at)
    bars, quality = data_adapter.fetch_ohlcv(request)
    market_cache.upsert_bars(bars)

    strategy = StrategyConfig(
        name="SMA trend demo",
        market=market,
        symbols=[symbol],
        timeframe=timeframe,
        entry_conditions=[Condition(kind="close_above_sma", params={"window": 20})],
        exit_conditions=[Condition(kind="close_below_sma", params={"window": 20})],
        risk=RiskRules(position_pct=0.8, stop_loss_pct=0.08, take_profit_pct=0.18, max_drawdown_pct=0.2),
    )
    backtest = backtest_engine.run(strategy, bars)
    report = research_assistant.analyze(
        AiResearchRequest(
            strategy_name=backtest.strategy_name,
            market=backtest.market,
            risk_preference="balanced",
            metrics=backtest.metrics,
            notes=quality.warnings,
        )
    )

    workspace = build_terminal_workspace()
    selected = _instrument_for_symbol(workspace, market, symbol)
    watchlist = _watchlist_with_selected(workspace.watchlist, selected)
    decision_log = [
        DecisionLogEntry(agent="AI Summary", message=report.summary, tone="ai"),
        DecisionLogEntry(agent="Risk Manager", message=report.risks[0], tone="risk"),
        DecisionLogEntry(agent="Technical Analyst", message=f"Backtest replay completed on {quality.rows} bars.", tone="positive"),
        DecisionLogEntry(agent="Portfolio Manager", message=report.improvements[0], tone="warning"),
    ]
    run_id = f"run-{uuid4().hex[:12]}"
    audit = ResearchRunAudit(
        run_id=run_id,
        created_at=created_at,
        market=market,
        symbol=symbol,
        timeframe=timeframe,
        strategy_name=strategy.name,
        strategy_revision=strategy.revision,
        data_rows=quality.rows,
        metrics=asdict(backtest.metrics),
        decisions=[asdict(entry) for entry in decision_log],
        execution_mode="paper_only",
    )
    audit_store.record(audit)

    return replace(
        workspace,
        selected_instrument=selected,
        selected_timeframe=timeframe,
        watchlist=watchlist,
        strategy=StrategySnapshot(
            name=strategy.name,
            entry="Close > SMA20",
            exit="Close < SMA20, stop loss, take profit, or end of backtest",
            position=f"{strategy.risk.position_pct:.0%} max capital allocation",
            risk="Stop -8%, take profit +18%, drawdown guard 20%, paper only",
        ),
        backtest_assumptions=BacktestAssumptions(
            initial_cash=backtest_engine.initial_cash,
            fee_bps=round(backtest_engine.fee_rate * 10_000, 4),
            slippage_bps=round(backtest_engine.slippage_rate * 10_000, 4),
        ),
        metrics=[
            BacktestMetric(label="Return", value=_format_signed_pct(backtest.metrics.total_return_pct), tone="positive"),
            BacktestMetric(label="Max DD", value=_format_pct(backtest.metrics.max_drawdown_pct), tone="warning"),
            BacktestMetric(label="Win Rate", value=_format_pct(backtest.metrics.win_rate_pct), tone="neutral"),
            BacktestMetric(label="Trades", value=str(backtest.metrics.trade_count), tone="neutral"),
        ],
        decision_log=decision_log,
        research_run=ResearchRunSummary(
            run_id=run_id,
            created_at=created_at,
            timeframe=timeframe,
            strategy_revision=strategy.revision,
            data_rows=quality.rows,
            execution_mode="paper_only",
        ),
    )


def _instrument_for_symbol(workspace: TerminalWorkspace, market: Market, symbol: str) -> Instrument:
    for instrument in workspace.watchlist:
        if instrument.symbol == symbol and instrument.market == market:
            return instrument
    return Instrument(symbol=symbol, name=symbol, market=market, change_pct=0.0)


def _watchlist_with_selected(watchlist: list[Instrument], selected: Instrument) -> list[Instrument]:
    if any(instrument.symbol == selected.symbol and instrument.market == selected.market for instrument in watchlist):
        return watchlist
    return [selected, *watchlist[:3]]


def _format_signed_pct(value: float) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.2f}%"


def _format_pct(value: float) -> str:
    return f"{value:.2f}%"
