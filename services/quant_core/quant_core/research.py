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
from quant_core.market_calendar import build_market_calendar_status
from quant_core.runs import ResearchRunAudit, ResearchRunStore, build_p0_package_completeness
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
    data_preparation_evidence: dict[str, Any] | None = None,
) -> TerminalWorkspace:
    data_adapter = adapter or DemoMarketDataAdapter()
    research_assistant = assistant or LocalResearchAssistant()
    backtest_engine = engine or BacktestEngine()
    market_cache = cache or MarketDataCache(Path("data/market.sqlite"))
    audit_store = run_store or ResearchRunStore(Path("data/research_runs.sqlite"))
    created_at = datetime.now(timezone.utc)

    request = MarketDataRequest(market=market, symbol=symbol, timeframe=timeframe, end=created_at)
    bars, quality = _fetch_research_bars(data_adapter, request, data_limit=data_limit, cache=market_cache)
    if _should_cache_research_bars(quality):
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
    market_calendar = build_market_calendar_status(market, at=created_at)
    data_snapshot = _data_snapshot_payload(
        bars,
        quality,
        preparation_evidence=data_preparation_evidence,
        market_calendar=market_calendar,
    )
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
        data_snapshot=data_snapshot,
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
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            strategy_revision=strategy.revision,
            data_rows=quality.rows,
            execution_mode="paper_only",
            data_quality=_data_quality_payload(quality),
            data_snapshot=data_snapshot,
            research_note=research_note or None,
            strategy_config=strategy_config_to_payload(strategy),
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


def _data_snapshot_payload(
    bars: list[OHLCVBar],
    quality: DataQuality,
    *,
    preparation_evidence: dict[str, Any] | None = None,
    market_calendar: dict[str, Any] | None = None,
) -> dict[str, object]:
    payload_bars = [bar_to_payload(bar) for bar in bars]
    snapshot: dict[str, object] = {
        "source": quality.source,
        "isComplete": quality.is_complete,
        "warnings": list(quality.warnings),
        "rows": len(payload_bars),
        "start": payload_bars[0]["timestamp"] if payload_bars else None,
        "end": payload_bars[-1]["timestamp"] if payload_bars else None,
        "hash": _bars_hash(payload_bars),
        "bars": payload_bars,
    }
    if preparation_evidence:
        snapshot["preparationEvidence"] = dict(preparation_evidence)
    if market_calendar:
        snapshot["marketCalendar"] = dict(market_calendar)
    return snapshot


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
        entry_conditions=_entry_conditions_from_text(snapshot.entry),
        exit_conditions=[_condition_from_text(snapshot.exit, default_kind="close_below_sma")],
        risk=RiskRules(
            position_pct=_position_pct_from_text(snapshot.position),
            stop_loss_pct=_percent_near_keywords(snapshot.risk, ["stop", "止损"], default=0.08),
            take_profit_pct=_percent_near_keywords(snapshot.risk, ["take profit", "take-profit", "止盈"], default=0.18),
            max_drawdown_pct=_percent_near_keywords(snapshot.risk, ["drawdown", "回撤"], default=0.2),
        ),
    )


def _entry_conditions_from_text(text: str) -> list[Condition]:
    conditions = _directional_conditions_from_text(text, default_kind="close_above_sma")
    volume_condition = _volume_condition_from_text(text)
    if volume_condition:
        conditions.append(volume_condition)
    return conditions


def _condition_from_text(text: str, *, default_kind: str) -> Condition:
    return _directional_conditions_from_text(text, default_kind=default_kind)[0]


def _directional_conditions_from_text(text: str, *, default_kind: str) -> list[Condition]:
    conditions: list[Condition] = []
    sma_condition = _sma_condition_from_text(text, default_kind=default_kind)
    if sma_condition:
        conditions.append(sma_condition)
    rsi_condition = _rsi_condition_from_text(text)
    if rsi_condition:
        conditions.append(rsi_condition)
    if conditions:
        return conditions
    return [_default_sma_condition(default_kind)]


def _sma_condition_from_text(text: str, *, default_kind: str) -> Condition | None:
    normalized = text.lower()
    if "sma" not in normalized:
        return None
    price_match = re.search(
        r"(?:close|price|收盘价|收盘)\s*(?P<operator><=|>=|<|>|above|below|over|under|高于|大于|低于|小于)\s*sma\s*(?P<window>\d+)?",
        normalized,
    )
    if price_match:
        operator = price_match.group("operator")
        window_match = price_match.group("window")
        if operator in {"<=", "<", "below", "under", "低于", "小于"}:
            kind = "close_below_sma"
        elif operator in {">=", ">", "above", "over", "高于", "大于"}:
            kind = "close_above_sma"
        else:
            kind = default_kind
        window = int(window_match) if window_match else 20
        return Condition(kind=kind, params={"window": max(1, min(window, 250))})

    if "rsi" in normalized or "相对强弱" in normalized:
        return None
    volume_index = min(
        [index for index in [normalized.find("volume"), normalized.find("vol"), normalized.find("成交量")] if index >= 0],
        default=-1,
    )
    if volume_index >= 0 and volume_index < normalized.find("sma"):
        return None
    if "<" in text or "below" in normalized or "under" in normalized or "低于" in normalized or "小于" in normalized:
        kind = "close_below_sma"
    elif ">" in text or "above" in normalized or "over" in normalized or "高于" in normalized or "大于" in normalized:
        kind = "close_above_sma"
    else:
        kind = default_kind
    window_match = re.search(r"sma\s*(\d+)", normalized)
    window = int(window_match.group(1)) if window_match else 20
    return Condition(kind=kind, params={"window": max(1, min(window, 250))})


def _default_sma_condition(default_kind: str) -> Condition:
    return Condition(kind=default_kind, params={"window": 20})


def _rsi_condition_from_text(text: str) -> Condition | None:
    normalized = text.lower()
    if "rsi" not in normalized and "相对强弱" not in normalized:
        return None

    if _has_rsi_below_signal(text, normalized):
        kind = "rsi_below"
        default_threshold = 30.0
    elif _has_rsi_above_signal(text, normalized):
        kind = "rsi_above"
        default_threshold = 70.0
    elif "rebound" in normalized or "反弹" in normalized or "超卖" in normalized:
        kind = "rsi_below"
        default_threshold = 30.0
    else:
        return None

    window_match = re.search(r"rsi\s*(\d+)", normalized)
    window = int(window_match.group(1)) if window_match else 14
    threshold = _rsi_threshold_from_text(text, kind=kind, default=default_threshold)
    return Condition(
        kind=kind,
        params={"window": max(1, min(window, 250)), "threshold": max(0.0, min(threshold, 100.0))},
    )


def _has_rsi_below_signal(text: str, normalized: str) -> bool:
    return "<" in text or "below" in normalized or "under" in normalized or "低于" in normalized or "小于" in normalized


def _has_rsi_above_signal(text: str, normalized: str) -> bool:
    return ">" in text or "above" in normalized or "over" in normalized or "高于" in normalized or "大于" in normalized


def _rsi_threshold_from_text(text: str, *, kind: str, default: float) -> float:
    normalized = text.lower()
    if kind == "rsi_below":
        match = re.search(r"rsi\s*\d*\s*(?:<=|<|below|under|低于|小于)\s*(\d+(?:\.\d+)?)", normalized)
    else:
        match = re.search(r"rsi\s*\d*\s*(?:>=|>|above|over|高于|大于)\s*(\d+(?:\.\d+)?)", normalized)
    if match:
        return float(match.group(1))
    return default


def _volume_condition_from_text(text: str) -> Condition | None:
    normalized = text.lower()
    if "volume" not in normalized and "vol" not in normalized and "成交量" not in normalized:
        return None
    volume_segment = normalized[normalized.find("vol") :] if "vol" in normalized else normalized
    window_match = re.search(r"(?:volume|vol|成交量).*?(?:sma|ma|均线|vol)\s*(\d+)", volume_segment)
    window = int(window_match.group(1)) if window_match else 20
    return Condition(kind="volume_above_sma", params={"window": max(1, min(window, 250))})


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
    cache: MarketDataCache | None = None,
) -> tuple[list[OHLCVBar], DataQuality]:
    bounded_limit = _bounded_research_limit(data_limit)
    try:
        bars, quality = _fetch_adapter_research_bars(adapter, request, limit=bounded_limit)
    except Exception as exc:
        cached = _cached_research_bars(cache, request, limit=bounded_limit)
        if cached:
            return cached, _local_cache_research_quality(cached, warnings=[f"research upstream unavailable: {exc}"])
        raise

    if quality.is_complete:
        return bars, quality

    cached = _cached_research_bars(cache, request, limit=bounded_limit)
    if cached:
        warnings = [*quality.warnings, f"research upstream incomplete from {quality.source}; using local cache"]
        return cached, _local_cache_research_quality(cached, warnings=warnings)
    return bars, quality


def _bounded_research_limit(data_limit: int) -> int:
    try:
        requested_limit = int(data_limit)
    except (TypeError, ValueError):
        requested_limit = 500
    return max(1, min(requested_limit, 500))


def _fetch_adapter_research_bars(
    adapter: MarketDataAdapter,
    request: MarketDataRequest,
    *,
    limit: int,
) -> tuple[list[OHLCVBar], DataQuality]:
    try:
        parameters = signature(adapter.fetch_ohlcv).parameters.values()
    except (TypeError, ValueError):
        return adapter.fetch_ohlcv(request)
    if any(parameter.name == "limit" or parameter.kind == Parameter.VAR_KEYWORD for parameter in parameters):
        return adapter.fetch_ohlcv(request, limit=limit)
    return adapter.fetch_ohlcv(request)


def _cached_research_bars(
    cache: MarketDataCache | None,
    request: MarketDataRequest,
    *,
    limit: int,
) -> list[OHLCVBar]:
    if cache is None:
        return []
    return cache.read_bars(
        market=request.market,
        symbol=request.symbol,
        timeframe=request.timeframe,
        start=request.start,
        end=request.end,
    )[-limit:]


def _local_cache_research_quality(bars: list[OHLCVBar], *, warnings: list[str]) -> DataQuality:
    return DataQuality(source="local-cache", is_complete=True, warnings=warnings, rows=len(bars))


def _should_cache_research_bars(quality: DataQuality) -> bool:
    return quality.is_complete and quality.source not in {"local-cache", "demo", "demo-fallback"}


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
