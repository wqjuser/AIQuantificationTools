export type PanelId =
  | "watchlist"
  | "chart"
  | "strategy"
  | "backtest"
  | "node-workflow"
  | "execution"
  | "agent-committee";

export type Market = "ashare" | "us" | "crypto";
export type Timeframe = "1d" | "1m" | "5m" | "15m" | "30m" | "60m";

export interface QuantLoopStep {
  id: string;
  label: string;
  status: "active" | "ready" | "locked";
}

export interface TerminalModule {
  id: string;
  label: string;
  accent: "market" | "strategy" | "ai" | "execution";
}

export interface TerminalPanel {
  id: PanelId;
  title: string;
  visible: boolean;
}

export interface AgentRole {
  id: string;
  label: string;
  stance: "analysis" | "debate" | "risk" | "decision";
}

export interface ExecutionGate {
  id: string;
  label: string;
  passed: boolean;
}

export interface ExecutionState {
  mode: "paper_only" | "certified_live" | "blocked_live";
  liveEnabled: boolean;
  gates: ExecutionGate[];
}

export interface Instrument {
  symbol: string;
  name: string;
  market: Market;
  changePct: number;
}

export interface StrategySnapshot {
  name: string;
  entry: string;
  exit: string;
  position: string;
  risk: string;
}

export interface BacktestMetric {
  label: string;
  value: string;
  tone: "positive" | "warning" | "neutral";
}

export interface DecisionLogEntry {
  agent: string;
  message: string;
  tone: "positive" | "warning" | "risk" | "ai";
}

export interface WorkflowNode {
  id: string;
  label: string;
  detail: string;
}

export interface ResearchRunSummary {
  runId: string;
  createdAt: string;
  timeframe: Timeframe;
  strategyRevision: string;
  dataRows: number;
  executionMode: string;
}

export interface ResearchRunAudit {
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  strategyName: string;
  strategyRevision: string;
  dataRows: number;
  metrics: Record<string, number>;
  decisions: DecisionLogEntry[];
  executionMode: string;
}

export interface TerminalWorkspace {
  schemaVersion: number;
  selectedInstrument: Instrument;
  selectedTimeframe: Timeframe;
  watchlist: Instrument[];
  quantLoop: QuantLoopStep[];
  modules: TerminalModule[];
  panels: TerminalPanel[];
  agents: AgentRole[];
  execution: ExecutionState;
  strategy: StrategySnapshot;
  metrics: BacktestMetric[];
  decisionLog: DecisionLogEntry[];
  workflowNodes: WorkflowNode[];
  researchRun?: ResearchRunSummary | null;
}

export function buildTerminalWorkspace(): TerminalWorkspace {
  return {
    schemaVersion: 1,
    selectedInstrument: {
      symbol: "600000",
      name: "浦发银行",
      market: "ashare",
      changePct: 1.24
    },
    selectedTimeframe: "1d",
    watchlist: [
      { symbol: "600000", name: "浦发银行", market: "ashare", changePct: 1.24 },
      { symbol: "000300", name: "沪深300", market: "ashare", changePct: 0.41 },
      { symbol: "AAPL", name: "Apple", market: "us", changePct: -0.36 },
      { symbol: "BTC/USDT", name: "Bitcoin", market: "crypto", changePct: 2.81 }
    ],
    quantLoop: [
      { id: "idea", label: "Idea Lab", status: "active" },
      { id: "data", label: "Data & Factor", status: "ready" },
      { id: "strategy", label: "Strategy Builder", status: "ready" },
      { id: "backtest", label: "Backtest Lab", status: "ready" },
      { id: "agent-review", label: "Agent Review", status: "ready" },
      { id: "paper", label: "Paper Trading", status: "ready" },
      { id: "broker", label: "Broker Center", status: "locked" }
    ],
    modules: [
      { id: "watchlist", label: "Watchlist", accent: "market" },
      { id: "scanner", label: "Market Scanner", accent: "market" },
      { id: "portfolio", label: "Portfolio Risk", accent: "execution" },
      { id: "news", label: "News & Events", accent: "ai" },
      { id: "workflow", label: "Node Workflow", accent: "strategy" }
    ],
    panels: [
      { id: "watchlist", title: "Watchlist", visible: true },
      { id: "chart", title: "Chart & Factor Overlays", visible: true },
      { id: "strategy", title: "Strategy Snapshot", visible: true },
      { id: "backtest", title: "Backtest Metrics", visible: true },
      { id: "node-workflow", title: "Node Workflow", visible: true },
      { id: "execution", title: "Execution Center", visible: true },
      { id: "agent-committee", title: "Agent Committee", visible: true }
    ],
    agents: [
      { id: "technical", label: "Technical Analyst", stance: "analysis" },
      { id: "fundamental", label: "Fundamental Analyst", stance: "analysis" },
      { id: "news", label: "News Analyst", stance: "analysis" },
      { id: "sentiment", label: "Sentiment Analyst", stance: "analysis" },
      { id: "bull", label: "Bull Researcher", stance: "debate" },
      { id: "bear", label: "Bear Researcher", stance: "debate" },
      { id: "risk", label: "Risk Manager", stance: "risk" },
      { id: "portfolio", label: "Portfolio Manager", stance: "decision" }
    ],
    execution: {
      mode: "paper_only",
      liveEnabled: false,
      gates: [
        { id: "adapter-certified", label: "Adapter certified", passed: false },
        { id: "risk-approved", label: "Risk approved", passed: false },
        { id: "human-confirmed", label: "Human confirmed", passed: false }
      ]
    },
    strategy: {
      name: "SMA Trend / Bank Sector",
      entry: "Close > SMA20 and relative strength improving",
      exit: "Close < SMA20 or risk manager downgrade",
      position: "20% cap per instrument",
      risk: "Stop -8%, drawdown guard 12%, paper only"
    },
    metrics: [
      { label: "Return", value: "+12.4%", tone: "positive" },
      { label: "Max DD", value: "5.8%", tone: "warning" },
      { label: "Win Rate", value: "51%", tone: "neutral" },
      { label: "Trades", value: "42", tone: "neutral" }
    ],
    decisionLog: [
      {
        agent: "Technical",
        message: "Trend is recovering, but volume confirmation is still weak.",
        tone: "positive"
      },
      {
        agent: "Fundamental",
        message: "Valuation is neutral; compare against sector bank index before promotion.",
        tone: "warning"
      },
      {
        agent: "Risk",
        message: "Live order is blocked until adapter certification and user confirmation pass.",
        tone: "risk"
      },
      {
        agent: "Portfolio Manager",
        message: "Keep on watchlist and rerun after data and event refresh.",
        tone: "ai"
      }
    ],
    workflowNodes: [
      { id: "data", label: "Data", detail: "AKShare / yfinance / ccxt" },
      { id: "factor", label: "Factor", detail: "SMA / RSI / custom" },
      { id: "backtest", label: "Backtest", detail: "fees / slippage / replay" },
      { id: "agent", label: "Agent", detail: "debate / risk / report" },
      { id: "execution", label: "Execution", detail: "paper / certified live" }
    ]
  };
}

export function quantLoopLabels(workspace: TerminalWorkspace): string[] {
  return workspace.quantLoop.map((step) => step.label);
}

export function visiblePanels(workspace: TerminalWorkspace): PanelId[] {
  return workspace.panels.filter((panel) => panel.visible).map((panel) => panel.id);
}

export function agentRoleLabels(workspace: TerminalWorkspace): string[] {
  return workspace.agents.map((agent) => agent.label);
}

export function executionModeLabel(execution: ExecutionState): string {
  if (execution.mode === "paper_only") {
    return "Paper only";
  }
  if (execution.mode === "certified_live") {
    return "Certified live";
  }
  return "Blocked live";
}

export function researchRunLabel(summary: ResearchRunSummary | null | undefined): string {
  if (!summary) {
    return "No audited run yet";
  }
  return `${summary.runId} · ${summary.dataRows} ${summary.timeframe} bars · ${summary.executionMode}`;
}

export function researchRunHistoryLabel(run: ResearchRunAudit): string {
  const totalReturn = run.metrics.total_return_pct;
  const tradeCount = run.metrics.trade_count ?? 0;
  const returnLabel = Number.isFinite(totalReturn)
    ? `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`
    : "N/A";
  return `${run.symbol} · ${run.timeframe} · ${returnLabel} · ${tradeCount} trades`;
}

export function workspaceFromResearchRunAudit(
  currentWorkspace: TerminalWorkspace,
  run: ResearchRunAudit
): TerminalWorkspace {
  const instrument = currentWorkspace.watchlist.find(
    (candidate) => candidate.symbol === run.symbol && candidate.market === run.market
  ) ?? {
    symbol: run.symbol,
    name: run.symbol,
    market: run.market,
    changePct: 0
  };
  return {
    ...currentWorkspace,
    selectedInstrument: instrument,
    selectedTimeframe: run.timeframe,
    strategy: {
      name: run.strategyName,
      entry: "Replay from audited research run",
      exit: `Original timeframe ${run.timeframe}`,
      position: `${run.dataRows} bars replayed`,
      risk: `Strategy revision ${run.strategyRevision}; execution ${run.executionMode}`
    },
    metrics: [
      {
        label: "Return",
        value: formatSignedPct(run.metrics.total_return_pct),
        tone: run.metrics.total_return_pct >= 0 ? "positive" : "warning"
      },
      { label: "Max DD", value: formatPct(run.metrics.max_drawdown_pct), tone: "warning" },
      { label: "Win Rate", value: formatPct(run.metrics.win_rate_pct), tone: "neutral" },
      { label: "Trades", value: String(run.metrics.trade_count ?? 0), tone: "neutral" }
    ],
    decisionLog: run.decisions.length
      ? run.decisions
      : [{ agent: "Audit", message: "No decision entries recorded for this run.", tone: "warning" }],
    researchRun: {
      runId: run.runId,
      createdAt: run.createdAt,
      timeframe: run.timeframe,
      strategyRevision: run.strategyRevision,
      dataRows: run.dataRows,
      executionMode: run.executionMode
    }
  };
}

export function workspaceWithSelectedInstrument(
  currentWorkspace: TerminalWorkspace,
  instrument: Instrument
): TerminalWorkspace {
  const watchlist = currentWorkspace.watchlist.some(
    (candidate) => candidate.symbol === instrument.symbol && candidate.market === instrument.market
  )
    ? currentWorkspace.watchlist
    : [instrument, ...currentWorkspace.watchlist.slice(0, 3)];

  return {
    ...freshResearchContext(currentWorkspace, instrument, currentWorkspace.selectedTimeframe),
    watchlist
  };
}

export function workspaceWithSelectedTimeframe(
  currentWorkspace: TerminalWorkspace,
  timeframe: Timeframe
): TerminalWorkspace {
  return freshResearchContext(currentWorkspace, currentWorkspace.selectedInstrument, timeframe);
}

function freshResearchContext(
  currentWorkspace: TerminalWorkspace,
  instrument: Instrument,
  timeframe: Timeframe
): TerminalWorkspace {
  return {
    ...currentWorkspace,
    selectedInstrument: instrument,
    selectedTimeframe: timeframe,
    strategy: {
      name: `${instrument.symbol} ${timeframe} research context`,
      entry: "Run Pipeline to generate entry rules from the selected context",
      exit: "Pending audited backtest",
      position: "Pending risk sizing",
      risk: "Paper only until a new audited run is available"
    },
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    decisionLog: [
      {
        agent: "Research Context",
        message: `${instrument.symbol} ${timeframe} selected. Run Pipeline to generate an audited backtest and agent review.`,
        tone: "ai"
      },
      {
        agent: "Risk Manager",
        message: "Previous audit results are cleared for this research context; live execution remains blocked.",
        tone: "risk"
      }
    ],
    researchRun: null
  };
}

function formatSignedPct(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatPct(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${value.toFixed(2)}%`;
}
