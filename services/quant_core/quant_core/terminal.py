from __future__ import annotations

from dataclasses import asdict, dataclass, field, is_dataclass, replace
from datetime import datetime
from typing import Any, Literal

from quant_core.domain import Market, MarketQuote, Timeframe


PanelId = Literal[
    "watchlist",
    "chart",
    "strategy",
    "backtest",
    "node-workflow",
    "execution",
    "agent-committee",
]


@dataclass(frozen=True)
class QuantLoopStep:
    id: str
    label: str
    status: Literal["active", "ready", "locked"]


@dataclass(frozen=True)
class TerminalModule:
    id: str
    label: str
    accent: Literal["market", "strategy", "ai", "execution"]


@dataclass(frozen=True)
class TerminalPanel:
    id: PanelId
    title: str
    visible: bool


@dataclass(frozen=True)
class AgentRole:
    id: str
    label: str
    stance: Literal["analysis", "debate", "risk", "decision"]


@dataclass(frozen=True)
class ExecutionGate:
    id: str
    label: str
    passed: bool


@dataclass(frozen=True)
class ExecutionState:
    mode: Literal["paper_only", "certified_live", "blocked_live"]
    live_enabled: bool
    gates: list[ExecutionGate]


@dataclass(frozen=True)
class Instrument:
    symbol: str
    name: str
    market: Market
    change_pct: float
    price: float | None = None
    quote_source: str | None = None
    quote_as_of: datetime | None = None


@dataclass(frozen=True)
class StrategySnapshot:
    name: str
    entry: str
    exit: str
    position: str
    risk: str


@dataclass(frozen=True)
class BacktestMetric:
    label: str
    value: str
    tone: Literal["positive", "warning", "neutral"]


@dataclass(frozen=True)
class BacktestAssumptions:
    initial_cash: float
    fee_bps: float
    slippage_bps: float


@dataclass(frozen=True)
class BacktestTradeReplay:
    id: str
    timestamp: str
    symbol: str
    side: Literal["BUY", "SELL", "RISK", "HOLD"]
    status: Literal["filled", "open", "review", "blocked"]
    price: str
    quantity: str
    exposure: str
    pnl: str
    reason: str
    tone: Literal["positive", "warning", "neutral", "risk"]


@dataclass(frozen=True)
class BacktestEquityPointReplay:
    timestamp: str
    equity: float


@dataclass(frozen=True)
class DecisionLogEntry:
    agent: str
    message: str
    tone: Literal["positive", "warning", "risk", "ai"]


@dataclass(frozen=True)
class WorkflowNode:
    id: str
    label: str
    detail: str


@dataclass(frozen=True)
class ResearchRunSummary:
    run_id: str
    created_at: datetime
    timeframe: Timeframe
    strategy_revision: str
    data_rows: int
    execution_mode: str


@dataclass(frozen=True)
class TerminalWorkspace:
    schema_version: int
    selected_instrument: Instrument
    selected_timeframe: Timeframe
    watchlist: list[Instrument]
    quant_loop: list[QuantLoopStep]
    modules: list[TerminalModule]
    panels: list[TerminalPanel]
    agents: list[AgentRole]
    execution: ExecutionState
    strategy: StrategySnapshot
    backtest_assumptions: BacktestAssumptions
    metrics: list[BacktestMetric]
    decision_log: list[DecisionLogEntry]
    workflow_nodes: list[WorkflowNode]
    backtest_trades: list[BacktestTradeReplay] = field(default_factory=list)
    backtest_equity_curve: list[BacktestEquityPointReplay] = field(default_factory=list)
    research_run: ResearchRunSummary | None = None


def build_terminal_workspace() -> TerminalWorkspace:
    return TerminalWorkspace(
        schema_version=1,
        selected_instrument=Instrument(symbol="600000", name="浦发银行", market="ashare", change_pct=1.24, price=8.66),
        selected_timeframe="1d",
        watchlist=[
            Instrument(symbol="600000", name="浦发银行", market="ashare", change_pct=1.24, price=8.66),
            Instrument(symbol="000300", name="沪深300", market="ashare", change_pct=0.41, price=3898.22),
            Instrument(symbol="AAPL", name="Apple", market="us", change_pct=-0.36, price=191.2),
            Instrument(symbol="BTC/USDT", name="Bitcoin", market="crypto", change_pct=2.81, price=68200.0),
        ],
        quant_loop=[
            QuantLoopStep(id="idea", label="Idea Lab", status="active"),
            QuantLoopStep(id="data", label="Data & Factor", status="ready"),
            QuantLoopStep(id="strategy", label="Strategy Builder", status="ready"),
            QuantLoopStep(id="backtest", label="Backtest Lab", status="ready"),
            QuantLoopStep(id="agent-review", label="Agent Review", status="ready"),
            QuantLoopStep(id="paper", label="Paper Trading", status="ready"),
            QuantLoopStep(id="broker", label="Broker Center", status="locked"),
        ],
        modules=[
            TerminalModule(id="watchlist", label="Watchlist", accent="market"),
            TerminalModule(id="scanner", label="Market Scanner", accent="market"),
            TerminalModule(id="portfolio", label="Portfolio Risk", accent="execution"),
            TerminalModule(id="news", label="News & Events", accent="ai"),
            TerminalModule(id="workflow", label="Node Workflow", accent="strategy"),
        ],
        panels=[
            TerminalPanel(id="watchlist", title="Watchlist", visible=True),
            TerminalPanel(id="chart", title="Chart & Factor Overlays", visible=True),
            TerminalPanel(id="strategy", title="Strategy Snapshot", visible=True),
            TerminalPanel(id="backtest", title="Backtest Metrics", visible=True),
            TerminalPanel(id="node-workflow", title="Node Workflow", visible=True),
            TerminalPanel(id="execution", title="Execution Center", visible=True),
            TerminalPanel(id="agent-committee", title="Agent Committee", visible=True),
        ],
        agents=[
            AgentRole(id="technical", label="Technical Analyst", stance="analysis"),
            AgentRole(id="fundamental", label="Fundamental Analyst", stance="analysis"),
            AgentRole(id="news", label="News Analyst", stance="analysis"),
            AgentRole(id="sentiment", label="Sentiment Analyst", stance="analysis"),
            AgentRole(id="bull", label="Bull Researcher", stance="debate"),
            AgentRole(id="bear", label="Bear Researcher", stance="debate"),
            AgentRole(id="risk", label="Risk Manager", stance="risk"),
            AgentRole(id="portfolio", label="Portfolio Manager", stance="decision"),
        ],
        execution=ExecutionState(
            mode="paper_only",
            live_enabled=False,
            gates=[
                ExecutionGate(id="adapter-certified", label="Adapter certified", passed=False),
                ExecutionGate(id="risk-approved", label="Risk approved", passed=False),
                ExecutionGate(id="human-confirmed", label="Human confirmed", passed=False),
            ],
        ),
        strategy=StrategySnapshot(
            name="SMA Trend / Bank Sector",
            entry="Close > SMA20 and relative strength improving",
            exit="Close < SMA20 or risk manager downgrade",
            position="20% cap per instrument",
            risk="Stop -8%, drawdown guard 12%, paper only",
        ),
        backtest_assumptions=BacktestAssumptions(initial_cash=100_000, fee_bps=3, slippage_bps=2),
        metrics=[
            BacktestMetric(label="Return", value="+12.4%", tone="positive"),
            BacktestMetric(label="Max DD", value="5.8%", tone="warning"),
            BacktestMetric(label="Win Rate", value="51%", tone="neutral"),
            BacktestMetric(label="Trades", value="42", tone="neutral"),
        ],
        decision_log=[
            DecisionLogEntry(
                agent="Technical",
                message="Trend is recovering, but volume confirmation is still weak.",
                tone="positive",
            ),
            DecisionLogEntry(
                agent="Fundamental",
                message="Valuation is neutral; compare against sector bank index before promotion.",
                tone="warning",
            ),
            DecisionLogEntry(
                agent="Risk",
                message="Live order is blocked until adapter certification and user confirmation pass.",
                tone="risk",
            ),
            DecisionLogEntry(
                agent="Portfolio Manager",
                message="Keep on watchlist and rerun after data and event refresh.",
                tone="ai",
            ),
        ],
        workflow_nodes=[
            WorkflowNode(id="data", label="Data", detail="AKShare / yfinance / ccxt"),
            WorkflowNode(id="factor", label="Factor", detail="SMA / RSI / custom"),
            WorkflowNode(id="backtest", label="Backtest", detail="fees / slippage / replay"),
            WorkflowNode(id="agent", label="Agent", detail="debate / risk / report"),
            WorkflowNode(id="execution", label="Execution", detail="paper / certified live"),
        ],
    )


def quant_loop_labels(workspace: TerminalWorkspace) -> list[str]:
    return [step.label for step in workspace.quant_loop]


def agent_role_labels(workspace: TerminalWorkspace) -> list[str]:
    return [agent.label for agent in workspace.agents]


def execution_gate_ids(workspace: TerminalWorkspace) -> list[str]:
    return [gate.id for gate in workspace.execution.gates]


def apply_market_quotes(workspace: TerminalWorkspace, quotes: list[MarketQuote]) -> TerminalWorkspace:
    quote_map = {(quote.market, quote.symbol.upper()): quote for quote in quotes}

    def with_quote(instrument: Instrument) -> Instrument:
        quote = quote_map.get((instrument.market, instrument.symbol.upper()))
        if not quote or not quote.is_live:
            return instrument
        return replace(
            instrument,
            change_pct=quote.change_pct,
            price=quote.price,
            quote_source=quote.source,
            quote_as_of=quote.as_of,
        )

    watchlist = [with_quote(instrument) for instrument in workspace.watchlist]
    selected = with_quote(workspace.selected_instrument)
    return replace(workspace, selected_instrument=selected, watchlist=watchlist)


def terminal_workspace_to_payload(workspace: TerminalWorkspace) -> dict[str, Any]:
    encoded = _encode(workspace)
    if not isinstance(encoded, dict):
        raise TypeError("terminal workspace payload must encode to a dictionary")
    return encoded


def _encode(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if is_dataclass(value):
        return {_snake_to_camel(key): _encode(item) for key, item in asdict(value).items()}
    if isinstance(value, list):
        return [_encode(item) for item in value]
    if isinstance(value, dict):
        return {_snake_to_camel(str(key)): _encode(item) for key, item in value.items()}
    return value


def _snake_to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)
