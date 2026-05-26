export type PanelId =
  | "watchlist"
  | "chart"
  | "strategy"
  | "backtest"
  | "node-workflow"
  | "execution"
  | "agent-committee";

export type Market = "ashare" | "us" | "crypto";

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

export interface TerminalWorkspace {
  selectedInstrument: Instrument;
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
}

export function buildTerminalWorkspace(): TerminalWorkspace {
  return {
    selectedInstrument: {
      symbol: "600000",
      name: "浦发银行",
      market: "ashare",
      changePct: 1.24
    },
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
