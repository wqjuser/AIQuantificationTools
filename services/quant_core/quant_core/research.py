from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, replace
from datetime import datetime, timezone
from inspect import Parameter, signature
from pathlib import Path
import re
from typing import Any
from uuid import uuid4

from quant_core.adapters import DemoMarketDataAdapter, MarketDataAdapter
from quant_core.ai import LocalResearchAssistant
from quant_core.backtest import BacktestEngine
from quant_core.cache import MarketDataCache
from quant_core.domain import (
    AiResearchRequest,
    BacktestRun,
    Condition,
    DataQuality,
    Market,
    MarketDataRequest,
    OHLCVBar,
    RiskRules,
    StrategyConfig,
    Timeframe,
)
from quant_core.market_klines import bar_to_payload
from quant_core.runs import ResearchRunAudit, ResearchRunStore
from quant_core.terminal import (
    BacktestAssumptions,
    BacktestDiagnostic,
    BacktestEquityPointReplay,
    BacktestMetric,
    BacktestTradeReplay,
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
    data_limit: int = 500,
    strategy_snapshot: StrategySnapshot | None = None,
    research_note: dict[str, Any] | None = None,
) -> TerminalWorkspace:
    data_adapter = adapter or DemoMarketDataAdapter()
    research_assistant = assistant or LocalResearchAssistant()
    backtest_engine = engine or BacktestEngine()
    market_cache = cache or MarketDataCache(Path("data/market.sqlite"))
    audit_store = run_store or ResearchRunStore(Path("data/research_runs.sqlite"))
    created_at = datetime.now(timezone.utc)

    request = MarketDataRequest(market=market, symbol=symbol, timeframe=timeframe, end=created_at)
    bars, quality = _fetch_research_bars(data_adapter, request, data_limit=data_limit)
    market_cache.upsert_bars(bars)

    snapshot = strategy_snapshot or _default_strategy_snapshot()
    strategy = strategy_config_from_snapshot(snapshot, market=market, symbol=symbol, timeframe=timeframe)
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
    backtest_trade_rows = _backtest_trade_replay_rows(backtest, initial_cash=backtest_engine.initial_cash)
    backtest_equity_curve = _backtest_equity_curve_rows(backtest)
    backtest_diagnostics = _backtest_diagnostics(backtest, data_rows=quality.rows)
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
        ai_report=asdict(report),
        data_quality=_data_quality_payload(quality),
        data_snapshot=_data_snapshot_payload(bars, quality),
        strategy_config=strategy_config_to_payload(strategy),
        backtest_assumptions={
            "initialCash": backtest_engine.initial_cash,
            "feeBps": round(backtest_engine.fee_rate * 10_000, 4),
            "slippageBps": round(backtest_engine.slippage_rate * 10_000, 4),
        },
        backtest_trades=[asdict(row) for row in backtest_trade_rows],
        backtest_equity_curve=[asdict(row) for row in backtest_equity_curve],
        backtest_diagnostics=[asdict(row) for row in backtest_diagnostics],
        research_note=research_note or {},
    )
    audit_store.record(audit)

    return replace(
        workspace,
        selected_instrument=selected,
        selected_timeframe=timeframe,
        watchlist=watchlist,
        strategy=StrategySnapshot(
            name=snapshot.name,
            entry=snapshot.entry,
            exit=snapshot.exit,
            position=snapshot.position,
            risk=snapshot.risk,
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
        backtest_trades=backtest_trade_rows,
        backtest_equity_curve=backtest_equity_curve,
        backtest_diagnostics=backtest_diagnostics,
        research_run=ResearchRunSummary(
            run_id=run_id,
            created_at=created_at,
            timeframe=timeframe,
            strategy_revision=strategy.revision,
            data_rows=quality.rows,
            execution_mode="paper_only",
            research_note=research_note or None,
        ),
    )


def _backtest_trade_replay_rows(backtest: BacktestRun, *, initial_cash: float) -> list[BacktestTradeReplay]:
    rows: list[BacktestTradeReplay] = []
    entry_trade = None
    capital_base = max(initial_cash, 1)
    for index, trade in enumerate(backtest.trades, start=1):
        notional = trade.price * trade.quantity
        pnl = "-"
        tone = "neutral"
        if trade.side == "buy":
            entry_trade = trade
        elif trade.side == "sell" and entry_trade is not None:
            pnl_value = (trade.price - entry_trade.price) * min(trade.quantity, entry_trade.quantity) - entry_trade.fee - trade.fee
            pnl = _format_signed_amount(pnl_value)
            tone = "positive" if pnl_value >= 0 else "warning"
            entry_trade = None

        rows.append(
            BacktestTradeReplay(
                id=f"trade-{index}",
                timestamp=trade.timestamp.isoformat(),
                symbol=trade.symbol,
                side=trade.side.upper(),
                status="filled",
                price=_format_amount(trade.price),
                quantity=_format_quantity(trade.quantity),
                exposure=_format_pct((notional / capital_base) * 100),
                pnl=pnl,
                reason=trade.reason,
                tone=tone,
            )
        )
    return rows


def _data_quality_payload(quality: DataQuality) -> dict[str, object]:
    return {
        "source": quality.source,
        "isComplete": quality.is_complete,
        "warnings": list(quality.warnings),
        "rows": quality.rows,
    }


def _data_snapshot_payload(bars: list[OHLCVBar], quality: DataQuality) -> dict[str, object]:
    payload_bars = [bar_to_payload(bar) for bar in bars]
    return {
        "source": quality.source,
        "isComplete": quality.is_complete,
        "warnings": list(quality.warnings),
        "rows": len(payload_bars),
        "start": payload_bars[0]["timestamp"] if payload_bars else None,
        "end": payload_bars[-1]["timestamp"] if payload_bars else None,
        "hash": _bars_hash(payload_bars),
        "bars": payload_bars,
    }


def _bars_hash(bars: list[dict[str, object]]) -> str:
    if not bars:
        return ""
    raw = json.dumps(bars, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def strategy_config_to_payload(strategy: StrategyConfig) -> dict[str, object]:
    return {
        "name": strategy.name,
        "revision": strategy.revision,
        "market": strategy.market,
        "symbols": list(strategy.symbols),
        "timeframe": strategy.timeframe,
        "version": strategy.version,
        "entryConditions": [_condition_payload(condition) for condition in strategy.entry_conditions],
        "exitConditions": [_condition_payload(condition) for condition in strategy.exit_conditions],
        "risk": {
            "positionPct": strategy.risk.position_pct,
            "stopLossPct": strategy.risk.stop_loss_pct,
            "takeProfitPct": strategy.risk.take_profit_pct,
            "maxDrawdownPct": strategy.risk.max_drawdown_pct,
        },
    }


def _condition_payload(condition: Condition) -> dict[str, object]:
    return {"kind": condition.kind, "params": dict(condition.params)}


def _backtest_equity_curve_rows(backtest: BacktestRun) -> list[BacktestEquityPointReplay]:
    return [
        BacktestEquityPointReplay(timestamp=point.timestamp.isoformat(), equity=round(point.equity, 4))
        for point in backtest.equity_curve
    ]


def _backtest_diagnostics(backtest: BacktestRun, *, data_rows: int) -> list[BacktestDiagnostic]:
    metrics = backtest.metrics
    return [
        BacktestDiagnostic(
            id="return-profile",
            label="Return profile",
            value=_format_signed_pct(metrics.total_return_pct),
            detail=f"Total return over {data_rows} bars",
            tone="positive" if metrics.total_return_pct >= 0 else "warning",
        ),
        BacktestDiagnostic(
            id="drawdown-profile",
            label="Drawdown profile",
            value=_format_pct(metrics.max_drawdown_pct),
            detail="Maximum peak-to-trough equity decline",
            tone="risk" if metrics.max_drawdown_pct >= 15 else "warning",
        ),
        BacktestDiagnostic(
            id="trade-quality",
            label="Trade quality",
            value=f"{metrics.win_rate_pct:.2f}% win rate",
            detail=f"{metrics.trade_count} orders, profit factor {metrics.profit_factor:.2f}",
            tone="positive" if metrics.profit_factor >= 1 else "neutral",
        ),
        BacktestDiagnostic(
            id="data-coverage",
            label="Data coverage",
            value=f"{data_rows} bars",
            detail=f"{backtest.market} {backtest.symbol} {backtest.timeframe} replay window",
            tone="neutral",
        ),
    ]


def _default_strategy_snapshot() -> StrategySnapshot:
    return StrategySnapshot(
        name="SMA trend demo",
        entry="Close > SMA20",
        exit="Close < SMA20, stop loss, take profit, or end of backtest",
        position="80% max capital allocation",
        risk="Stop -8%, take profit +18%, drawdown guard 20%, paper only",
    )


def strategy_config_from_snapshot(
    snapshot: StrategySnapshot,
    *,
    market: Market,
    symbol: str,
    timeframe: Timeframe,
) -> StrategyConfig:
    return StrategyConfig(
        name=snapshot.name.strip() or "SMA trend demo",
        market=market,
        symbols=[symbol],
        timeframe=timeframe,
        entry_conditions=[_condition_from_text(snapshot.entry, default_kind="close_above_sma")],
        exit_conditions=[_condition_from_text(snapshot.exit, default_kind="close_below_sma")],
        risk=RiskRules(
            position_pct=_position_pct_from_text(snapshot.position),
            stop_loss_pct=_percent_near_keywords(snapshot.risk, ["stop", "止损"], default=0.08),
            take_profit_pct=_percent_near_keywords(snapshot.risk, ["take profit", "take-profit", "止盈"], default=0.18),
            max_drawdown_pct=_percent_near_keywords(snapshot.risk, ["drawdown", "回撤"], default=0.2),
        ),
    )


def _condition_from_text(text: str, *, default_kind: str) -> Condition:
    normalized = text.lower()
    if "sma" in normalized:
        if "<" in text or "below" in normalized:
            kind = "close_below_sma"
        elif ">" in text or "above" in normalized:
            kind = "close_above_sma"
        else:
            kind = default_kind
    else:
        kind = default_kind
    window_match = re.search(r"sma\s*(\d+)", normalized)
    window = int(window_match.group(1)) if window_match else 20
    return Condition(kind=kind, params={"window": max(1, min(window, 250))})


def _position_pct_from_text(text: str) -> float:
    percent = _first_percent(text)
    if percent is None:
        return 0.8
    return max(0.01, min(percent / 100, 1.0))


def _percent_near_keywords(text: str, keywords: list[str], *, default: float) -> float:
    normalized = text.lower()
    for match in re.finditer(r"([+-]?\d+(?:\.\d+)?)\s*%", normalized):
        prefix = normalized[max(0, match.start() - 36) : match.start()]
        if any(keyword in prefix for keyword in keywords):
            return max(0.0, min(abs(float(match.group(1))) / 100, 1.0))
    return default


def _first_percent(text: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*%", text)
    return float(match.group(1)) if match else None


def _fetch_research_bars(
    adapter: MarketDataAdapter,
    request: MarketDataRequest,
    *,
    data_limit: int,
) -> tuple[list[OHLCVBar], DataQuality]:
    try:
        requested_limit = int(data_limit)
    except (TypeError, ValueError):
        requested_limit = 500
    bounded_limit = max(1, min(requested_limit, 500))
    try:
        parameters = signature(adapter.fetch_ohlcv).parameters.values()
    except (TypeError, ValueError):
        return adapter.fetch_ohlcv(request)
    if any(parameter.name == "limit" or parameter.kind == Parameter.VAR_KEYWORD for parameter in parameters):
        return adapter.fetch_ohlcv(request, limit=bounded_limit)
    return adapter.fetch_ohlcv(request)


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


def _format_amount(value: float) -> str:
    return f"{value:.2f}"


def _format_signed_amount(value: float) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{value:.2f}"


def _format_quantity(value: float) -> str:
    if value.is_integer():
        return str(int(value))
    return f"{value:.6f}".rstrip("0").rstrip(".")
