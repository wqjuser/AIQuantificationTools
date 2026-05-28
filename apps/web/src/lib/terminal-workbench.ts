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

export interface QuantLoopNavigationTarget {
  moduleId: string;
  workflowStageId: string;
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
  price?: number | null;
  quoteSource?: string | null;
  quoteAsOf?: string | null;
}

export interface StrategySnapshot {
  name: string;
  entry: string;
  exit: string;
  position: string;
  risk: string;
}

export type StrategyField = keyof StrategySnapshot;

export interface StrategyRuleRow {
  id: string;
  group: "entry" | "exit" | "position" | "risk";
  label: string;
  condition: string;
  parameter: string;
  status: "active" | "pending" | "guardrail";
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestMetric {
  label: string;
  value: string;
  tone: "positive" | "warning" | "neutral";
}

export interface BacktestTradeRow {
  id: string;
  timestamp: string;
  symbol: string;
  side: "BUY" | "SELL" | "RISK" | "HOLD";
  status: "filled" | "open" | "review" | "blocked";
  price: string;
  quantity: string;
  exposure: string;
  pnl: string;
  reason: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestEquityPoint {
  timestamp: string;
  equity: number;
}

export interface BacktestDiagnostic {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestAssumptions {
  initialCash: number;
  feeBps: number;
  slippageBps: number;
}

export type BacktestAssumptionField = keyof BacktestAssumptions;

export interface BacktestAssumptionRow {
  field: BacktestAssumptionField;
  label: string;
  value: number;
  suffix: string;
  min: number;
  step: number;
}

export interface DecisionLogEntry {
  agent: string;
  message: string;
  tone: "positive" | "warning" | "risk" | "ai";
}

export interface AgentCommitteeRound {
  id: string;
  phase: "analysis" | "debate" | "risk" | "decision";
  agent: string;
  thesis: string;
  evidence: string;
  verdict: "support" | "challenge" | "risk" | "watch";
  confidence: number;
  tone: DecisionLogEntry["tone"];
}

export interface AiEvidenceCard {
  id: "context" | "backtest" | "risk" | "safety";
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export interface WorkflowNode {
  id: string;
  label: string;
  detail: string;
}

export type WorkflowStageStatus = "active" | "ready" | "blocked" | "running" | "completed" | "failed";
export type WorkflowRunLogLevel = "info" | "success" | "warning" | "error";

export interface WorkflowRunLogEntry {
  id: string;
  stageId: string;
  level: WorkflowRunLogLevel;
  message: string;
}

export interface WorkflowRunState {
  activeStageId: string;
  completedStageIds: string[];
  failedStageId?: string | null;
  log: WorkflowRunLogEntry[];
}

export interface WorkflowStageArtifact {
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export interface ScannerCandidate {
  instrument: Instrument;
  signal: "Momentum watch" | "Baseline watch" | "Risk review";
  risk: "low" | "medium" | "high";
  score: number;
  note: string;
}

export interface PortfolioRiskRow {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PaperPositionRow {
  id: string;
  symbol: string;
  quantity: string;
  avgCost: string;
  markPrice: string;
  marketValue: string;
  unrealizedPnl: string;
  returnPct: string;
  status: "paper" | "flat" | "blocked";
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PaperTradingRow {
  id: string;
  symbol: string;
  side: "BUY" | "SELL" | "RISK" | "SYNC";
  quantity: string;
  price: string;
  notional: string;
  status: "queued" | "filled" | "blocked" | "paper";
  reason: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BrokerAdapterRow {
  id: string;
  market: Market;
  adapter: string;
  route: "paper" | "live";
  status: "paper_ready" | "interface_only" | "config_required" | "blocked";
  certification: string;
  nextStep: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface ModuleNewsEvent {
  id: string;
  source: string;
  title: string;
  impact: "positive" | "warning" | "risk" | "ai";
  detail: string;
}

export interface WorkflowStageView {
  id: string;
  label: string;
  detail: string;
  status: WorkflowStageStatus;
  output: string;
  artifacts: WorkflowStageArtifact[];
}

export type AiWorkbenchAction = "debate" | "explain" | "strategy-draft";

export interface ResearchRunSummary {
  runId: string;
  createdAt: string;
  timeframe: Timeframe;
  strategyRevision: string;
  dataRows: number;
  executionMode: string;
}

export interface ResearchRunDataQuality {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
}

export interface ResearchRunStrategyCondition {
  kind: string;
  params: Record<string, string | number | boolean | null>;
}

export interface ResearchRunStrategyRisk {
  positionPct: number | null;
  stopLossPct: number | null;
  takeProfitPct: number | null;
  maxDrawdownPct: number | null;
}

export interface ResearchRunStrategyConfig {
  name: string;
  revision: string;
  market: Market;
  symbols: string[];
  timeframe: Timeframe;
  version: number;
  entryConditions: ResearchRunStrategyCondition[];
  exitConditions: ResearchRunStrategyCondition[];
  risk: ResearchRunStrategyRisk;
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
  dataQuality?: ResearchRunDataQuality;
  strategyConfig?: ResearchRunStrategyConfig;
  backtestAssumptions?: BacktestAssumptions;
  backtestTrades?: BacktestTradeRow[];
  backtestEquityCurve?: BacktestEquityPoint[];
  backtestDiagnostics?: BacktestDiagnostic[];
}

export interface ResearchRunComparisonRow {
  id: "return" | "drawdown" | "trades" | "assumptions";
  label: string;
  current: string;
  previous: string;
  delta: string;
  tone: "positive" | "warning" | "neutral";
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
  backtestAssumptions?: BacktestAssumptions;
  metrics: BacktestMetric[];
  decisionLog: DecisionLogEntry[];
  workflowNodes: WorkflowNode[];
  backtestTrades?: BacktestTradeRow[];
  backtestEquityCurve?: BacktestEquityPoint[];
  backtestDiagnostics?: BacktestDiagnostic[];
  researchRun?: ResearchRunSummary | null;
}

export const defaultBacktestAssumptions: BacktestAssumptions = {
  initialCash: 100_000,
  feeBps: 3,
  slippageBps: 2
};

const backtestAssumptionSpecs: Record<
  BacktestAssumptionField,
  { label: string; suffix: string; min: number; step: number }
> = {
  initialCash: { label: "Initial cash", suffix: "CNY", min: 1_000, step: 1_000 },
  feeBps: { label: "Fee", suffix: "bps", min: 0, step: 1 },
  slippageBps: { label: "Slippage", suffix: "bps", min: 0, step: 1 }
};

export function buildTerminalWorkspace(): TerminalWorkspace {
  return {
    schemaVersion: 1,
    selectedInstrument: {
      symbol: "600000",
      name: "浦发银行",
      market: "ashare",
      changePct: 1.24,
      price: 8.66
    },
    selectedTimeframe: "1d",
    watchlist: [
      { symbol: "600000", name: "浦发银行", market: "ashare", changePct: 1.24, price: 8.66 },
      { symbol: "000300", name: "沪深300", market: "ashare", changePct: 0.41, price: 3898.22 },
      { symbol: "AAPL", name: "Apple", market: "us", changePct: -0.36, price: 191.2 },
      { symbol: "BTC/USDT", name: "Bitcoin", market: "crypto", changePct: 2.81, price: 68200 }
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
      { id: "broker", label: "Broker Center", accent: "execution" },
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
    backtestAssumptions: defaultBacktestAssumptions,
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

export function buildQuantLoopNavigationTarget(stepId: string): QuantLoopNavigationTarget {
  const targets: Record<string, QuantLoopNavigationTarget> = {
    idea: { moduleId: "watchlist", workflowStageId: "data" },
    data: { moduleId: "workflow", workflowStageId: "data" },
    strategy: { moduleId: "watchlist", workflowStageId: "factor" },
    backtest: { moduleId: "workflow", workflowStageId: "backtest" },
    "agent-review": { moduleId: "workflow", workflowStageId: "agent" },
    paper: { moduleId: "portfolio", workflowStageId: "execution" },
    broker: { moduleId: "broker", workflowStageId: "execution" }
  };
  return targets[stepId] ?? targets.idea;
}

export function visiblePanels(workspace: TerminalWorkspace): PanelId[] {
  return workspace.panels.filter((panel) => panel.visible).map((panel) => panel.id);
}

export function agentRoleLabels(workspace: TerminalWorkspace): string[] {
  return workspace.agents.map((agent) => agent.label);
}

export function buildAgentCommitteeRounds(workspace: TerminalWorkspace): AgentCommitteeRound[] {
  const returnMetric = workspace.metrics.find((metric) => metric.label === "Return")?.value ?? "N/A";
  const drawdownMetric = workspace.metrics.find((metric) => metric.label === "Max DD")?.value ?? "N/A";
  const technicalNote = findDecisionMessage(workspace, "Technical");
  const riskNote = findDecisionMessage(workspace, "Risk");
  const portfolioNote = findDecisionMessage(workspace, "Portfolio Manager");

  return [
    {
      id: "technical-analysis",
      phase: "analysis",
      agent: "Technical Analyst",
      thesis: technicalNote,
      evidence: `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe} · Return ${returnMetric} · Max DD ${drawdownMetric}`,
      verdict: returnMetric.startsWith("+") ? "support" : "challenge",
      confidence: returnMetric.startsWith("+") ? 64 : 52,
      tone: returnMetric.startsWith("+") ? "positive" : "warning"
    },
    {
      id: "bull-research",
      phase: "debate",
      agent: "Bull Researcher",
      thesis: `Bull case requires ${workspace.strategy.entry}.`,
      evidence: `Position rule: ${workspace.strategy.position}.`,
      verdict: "support",
      confidence: 58,
      tone: "positive"
    },
    {
      id: "bear-research",
      phase: "debate",
      agent: "Bear Researcher",
      thesis: `Bear case challenges the setup if ${workspace.strategy.exit}.`,
      evidence: `Risk rule: ${workspace.strategy.risk}.`,
      verdict: "challenge",
      confidence: 55,
      tone: "warning"
    },
    {
      id: "risk-manager",
      phase: "risk",
      agent: "Risk Manager",
      thesis: riskNote,
      evidence: workspace.execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · "),
      verdict: "risk",
      confidence: workspace.execution.liveEnabled ? 48 : 82,
      tone: "risk"
    },
    {
      id: "portfolio-decision",
      phase: "decision",
      agent: "Portfolio Manager",
      thesis: portfolioNote,
      evidence: workspace.researchRun
        ? `Audited run ${workspace.researchRun.runId} · ${workspace.researchRun.dataRows} bars`
        : "No audited run is bound to this research context yet.",
      verdict: "watch",
      confidence: workspace.researchRun ? 66 : 60,
      tone: "ai"
    }
  ];
}

export function buildAiEvidenceCards(workspace: TerminalWorkspace): AiEvidenceCard[] {
  const selected = workspace.selectedInstrument;
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const gateDetail = workspace.execution.gates
    .map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`)
    .join(" · ");

  return [
    {
      id: "context",
      label: "Research context",
      value: `${selected.symbol} · ${workspace.selectedTimeframe}`,
      detail: `${selected.market} · price ${formatInstrumentPrice(selected.price)}`,
      tone: "neutral"
    },
    workspace.researchRun
      ? {
          id: "backtest",
          label: "Backtest evidence",
          value: `${workspace.researchRun.dataRows} ${workspace.researchRun.timeframe} bars`,
          detail: `Audited run ${workspace.researchRun.runId} · revision ${workspace.researchRun.strategyRevision}`,
          tone: "positive"
        }
      : {
          id: "backtest",
          label: "Backtest evidence",
          value: "Pending audited run",
          detail: "Run Pipeline before trusting AI review.",
          tone: "warning"
        },
    {
      id: "risk",
      label: "Risk gates",
      value: workspace.execution.liveEnabled ? "Live gates open" : `${blockedGateCount} blocked gates`,
      detail: gateDetail,
      tone: workspace.execution.liveEnabled ? "positive" : "risk"
    },
    {
      id: "safety",
      label: "AI boundary",
      value: "No buy/sell advice",
      detail: "AI can explain supplied evidence only; no guaranteed outcome.",
      tone: "ai"
    }
  ];
}

export function buildScannerCandidates(workspace: TerminalWorkspace): ScannerCandidate[] {
  return [...workspace.watchlist]
    .map((instrument) => {
      const changePct = Number.isFinite(instrument.changePct) ? instrument.changePct : 0;
      const score = Math.max(0, Math.min(100, Math.round(50 + changePct * 8)));
      const signal: ScannerCandidate["signal"] =
        changePct >= 1 ? "Momentum watch" : changePct < 0 ? "Risk review" : "Baseline watch";
      const risk: ScannerCandidate["risk"] = instrument.market === "crypto" || changePct < 0 ? "medium" : "low";
      return {
        instrument,
        signal,
        risk,
        score,
        note:
          signal === "Momentum watch"
            ? "Price momentum is stronger than the local watchlist baseline."
            : signal === "Risk review"
              ? "Negative change needs risk review before promotion."
              : "Stable candidate ready for factor checks."
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function buildPortfolioRiskRows(workspace: TerminalWorkspace): PortfolioRiskRow[] {
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  return [
    {
      id: "paper-exposure",
      label: "Paper exposure",
      value: `${workspace.watchlist.length} watched`,
      detail: "No certified live positions are connected in this workspace.",
      tone: "neutral"
    },
    {
      id: "selected-risk",
      label: "Selected instrument",
      value: workspace.selectedInstrument.symbol,
      detail: `${workspace.selectedInstrument.symbol} remains paper-only until a fresh audited run passes gates.`,
      tone: workspace.selectedInstrument.changePct < 0 ? "warning" : "positive"
    },
    {
      id: "live-gates",
      label: "Live gates",
      value: workspace.execution.liveEnabled ? "open" : `${blockedGateCount} blocked`,
      detail: workspace.execution.liveEnabled
        ? "Execution adapter reports live trading enabled."
        : "Adapter certification, risk approval, and human confirmation are required.",
      tone: workspace.execution.liveEnabled ? "positive" : "warning"
    }
  ];
}

export function buildPaperTradingRows(workspace: TerminalWorkspace): PaperTradingRow[] {
  const price = resolvePaperOrderPrice(workspace);
  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price);
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const notional = quantity * price;

  return [
    {
      id: "paper-order",
      symbol: workspace.selectedInstrument.symbol,
      side: "BUY",
      quantity: String(quantity),
      price: price.toFixed(2),
      notional: notional.toFixed(2),
      status: "queued",
      reason: `Paper order staged from ${workspace.strategy.name}; no live route is used.`,
      tone: "positive"
    },
    {
      id: "risk-check",
      symbol: workspace.selectedInstrument.symbol,
      side: "RISK",
      quantity: "-",
      price: "-",
      notional: "-",
      status: workspace.execution.liveEnabled ? "paper" : "blocked",
      reason: workspace.execution.liveEnabled
        ? "Certified live route is available but this run stays paper-first."
        : `${blockedGateCount} live gates blocked; paper route remains available.`,
      tone: workspace.execution.liveEnabled ? "neutral" : "warning"
    },
    {
      id: "account-sync",
      symbol: "PAPER",
      side: "SYNC",
      quantity: "-",
      price: "-",
      notional: "0.00",
      status: "paper",
      reason: "Local paper account only; broker account synchronization is not connected.",
      tone: "neutral"
    }
  ];
}

export function buildPaperPositionRows(workspace: TerminalWorkspace): PaperPositionRow[] {
  const price = resolvePaperOrderPrice(workspace);
  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price);
  const marketValue = quantity * price;
  const returnMetric = metricValue(workspace, "Return", "N/A");
  const returnPct = parsePercentMetric(returnMetric);
  const costBasis = returnPct === null ? marketValue : marketValue / (1 + returnPct / 100);
  const avgCost = quantity > 0 ? costBasis / quantity : 0;
  const unrealizedPnl = marketValue - costBasis;
  const tone: PaperPositionRow["tone"] = returnPct === null ? "neutral" : returnPct < 0 ? "warning" : "positive";

  return [
    {
      id: "selected-paper-position",
      symbol: workspace.selectedInstrument.symbol,
      quantity: String(quantity),
      avgCost: avgCost.toFixed(2),
      markPrice: price.toFixed(2),
      marketValue: marketValue.toFixed(2),
      unrealizedPnl: formatSignedCurrency(unrealizedPnl),
      returnPct: returnMetric,
      status: "paper",
      tone
    }
  ];
}

export function buildBrokerAdapterRows(workspace: TerminalWorkspace): BrokerAdapterRow[] {
  const liveBlocked = !workspace.execution.liveEnabled;
  return [
    {
      id: "paper-local",
      market: "ashare",
      adapter: "Local Paper Trading",
      route: "paper",
      status: "paper_ready",
      certification: "Simulated fills, order log, and risk checks are available locally.",
      nextStep: "Use paper execution for research runs before certifying live adapters.",
      tone: "positive"
    },
    {
      id: "ashare-live",
      market: "ashare",
      adapter: "A-share broker interface",
      route: "live",
      status: "interface_only",
      certification: "No certified A-share broker API is connected.",
      nextStep: "Keep live trading blocked until a legal broker adapter passes certification.",
      tone: liveBlocked ? "risk" : "warning"
    },
    {
      id: "us-live",
      market: "us",
      adapter: "IBKR / Alpaca adapter shape",
      route: "live",
      status: "config_required",
      certification: "Adapter shape is reserved; paper credentials are not configured.",
      nextStep: "Configure a paper account and certify submit, cancel, fill, reject, and reconnect paths.",
      tone: "warning"
    },
    {
      id: "crypto-live",
      market: "crypto",
      adapter: "ccxt exchange adapter shape",
      route: "live",
      status: "config_required",
      certification: "Exchange adapter shape is reserved; API keys are not configured.",
      nextStep: "Start with sandbox or testnet routes plus max order and emergency-stop limits.",
      tone: "warning"
    }
  ];
}

export function buildStrategyRuleRows(workspace: TerminalWorkspace): StrategyRuleRow[] {
  return [
    {
      id: "entry-rule",
      group: "entry",
      label: "Entry signal",
      condition: workspace.strategy.entry,
      parameter: inferStrategyParameter(workspace.strategy.entry, "SMA20 / relative strength"),
      status: isPendingStrategyText(workspace.strategy.entry) ? "pending" : "active",
      tone: isPendingStrategyText(workspace.strategy.entry) ? "warning" : "positive"
    },
    {
      id: "exit-rule",
      group: "exit",
      label: "Exit signal",
      condition: workspace.strategy.exit,
      parameter: inferStrategyParameter(workspace.strategy.exit, "Trend support / risk downgrade"),
      status: isPendingStrategyText(workspace.strategy.exit) ? "pending" : "active",
      tone: "warning"
    },
    {
      id: "position-rule",
      group: "position",
      label: "Position sizing",
      condition: workspace.strategy.position,
      parameter: inferStrategyParameter(workspace.strategy.position, "Exposure cap / paper sizing"),
      status: isPendingStrategyText(workspace.strategy.position) ? "pending" : "active",
      tone: isPendingStrategyText(workspace.strategy.position) ? "warning" : "neutral"
    },
    {
      id: "risk-rule",
      group: "risk",
      label: "Risk guardrail",
      condition: workspace.strategy.risk,
      parameter: "Stop / drawdown / execution mode",
      status: "guardrail",
      tone: "risk"
    }
  ];
}

export function buildBacktestTradeRows(workspace: TerminalWorkspace): BacktestTradeRow[] {
  if (workspace.backtestTrades?.length) {
    return workspace.backtestTrades;
  }

  const price = resolvePaperOrderPrice(workspace);
  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price);
  const returnMetric = metricValue(workspace, "Return", "N/A");
  const drawdownMetric = metricValue(workspace, "Max DD", "N/A");
  const exposure = inferExposureFromPosition(workspace.strategy.position);
  const entryTone: BacktestTradeRow["tone"] = returnMetric.startsWith("-") ? "warning" : "positive";

  return [
    {
      id: "entry-fill",
      timestamp: "T+0",
      symbol: workspace.selectedInstrument.symbol,
      side: "BUY",
      status: isPendingStrategyText(workspace.strategy.entry) ? "blocked" : "filled",
      price: price.toFixed(2),
      quantity: String(quantity),
      exposure,
      pnl: returnMetric,
      reason: workspace.strategy.entry,
      tone: isPendingStrategyText(workspace.strategy.entry) ? "warning" : entryTone
    },
    {
      id: "risk-review",
      timestamp: "T+1",
      symbol: workspace.selectedInstrument.symbol,
      side: "RISK",
      status: "review",
      price: "-",
      quantity: "-",
      exposure: "drawdown",
      pnl: normalizeDrawdownLoss(drawdownMetric),
      reason: workspace.strategy.risk,
      tone: "warning"
    },
    {
      id: "exit-review",
      timestamp: "T+2",
      symbol: workspace.selectedInstrument.symbol,
      side: "SELL",
      status: isPendingStrategyText(workspace.strategy.exit) ? "blocked" : "open",
      price: price.toFixed(2),
      quantity: String(quantity),
      exposure,
      pnl: returnMetric,
      reason: workspace.strategy.exit,
      tone: "neutral"
    }
  ];
}

export function resolveBacktestAssumptions(workspace: TerminalWorkspace): BacktestAssumptions {
  return normalizeBacktestAssumptions(workspace.backtestAssumptions);
}

function normalizeBacktestAssumptions(current?: Partial<BacktestAssumptions>): BacktestAssumptions {
  const assumptions = current ?? defaultBacktestAssumptions;
  return {
    initialCash: normalizeBacktestAssumptionValue(
      "initialCash",
      assumptions.initialCash,
      defaultBacktestAssumptions.initialCash
    ),
    feeBps: normalizeBacktestAssumptionValue("feeBps", assumptions.feeBps, defaultBacktestAssumptions.feeBps),
    slippageBps: normalizeBacktestAssumptionValue(
      "slippageBps",
      assumptions.slippageBps,
      defaultBacktestAssumptions.slippageBps
    )
  };
}

export function buildBacktestAssumptionRows(workspace: TerminalWorkspace): BacktestAssumptionRow[] {
  const assumptions = resolveBacktestAssumptions(workspace);
  return (Object.keys(backtestAssumptionSpecs) as BacktestAssumptionField[]).map((field) => ({
    field,
    ...backtestAssumptionSpecs[field],
    value: assumptions[field]
  }));
}

export function buildModuleNewsEvents(workspace: TerminalWorkspace): ModuleNewsEvent[] {
  const selectedInstrument = workspace.selectedInstrument;
  const selectedSymbol = selectedInstrument.symbol;
  const price = selectedInstrument.price;
  const quoteSource = selectedInstrument.quoteSource ?? "workspace";
  const hasQuote = price !== undefined && price !== null && Number.isFinite(price);
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const localEvents: ModuleNewsEvent[] = [
    hasQuote
      ? {
          id: "quote-update",
          source: "Market data",
          title: `${selectedSymbol} quote ${formatInstrumentPrice(price)} from ${quoteSource}`,
          impact: selectedInstrument.changePct < 0 ? "warning" : "positive",
          detail: `As of ${selectedInstrument.quoteAsOf ?? "latest workspace refresh"} · change ${formatSignedPct(
            selectedInstrument.changePct
          )}`
        }
      : {
          id: "quote-missing",
          source: "Market data",
          title: `${selectedSymbol} quote unavailable`,
          impact: "warning",
          detail: "Refresh workspace or configure a market data adapter."
        },
    workspace.researchRun
      ? {
          id: "audit-run",
          source: "Audit log",
          title: `Run ${workspace.researchRun.runId} bound to ${selectedSymbol}`,
          impact: "ai",
          detail: `${workspace.researchRun.dataRows} ${workspace.researchRun.timeframe} bars · revision ${workspace.researchRun.strategyRevision} · ${workspace.researchRun.executionMode}`
        }
      : {
          id: "audit-needed",
          source: "Audit log",
          title: `${selectedSymbol} needs a fresh audited run`,
          impact: "warning",
          detail: "Run Pipeline to bind data, backtest, agent review, and execution gates."
        },
    {
      id: "execution-gates",
      source: "Risk engine",
      title: workspace.execution.liveEnabled ? "Live execution gates open" : `${blockedGateCount} execution gates blocked`,
      impact: workspace.execution.liveEnabled ? "positive" : "risk",
      detail: workspace.execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · ")
    }
  ];
  const committeeEvents = workspace.decisionLog.slice(0, 3).map((entry, index) => ({
    id: `committee-${index}`,
    source: "AI committee",
    title: `${entry.agent}: ${entry.message}`,
    impact: entry.tone,
    detail: `Linked to ${selectedSymbol} research context.`
  }));
  return [...localEvents, ...committeeEvents];
}

function inferStrategyParameter(condition: string, fallback: string): string {
  if (condition.includes("support") || condition.includes("downgrade")) {
    return "Trend support / risk downgrade";
  }
  if (condition.includes("SMA20") || condition.includes("relative strength")) {
    return "SMA20 / relative strength";
  }
  if (condition.includes("20%") || condition.includes("paper sizing") || condition.includes("cap exposure")) {
    return "Exposure cap / paper sizing";
  }
  return fallback;
}

function isPendingStrategyText(text: string): boolean {
  return text.startsWith("Pending") || text.startsWith("Run Pipeline");
}

function metricValue(workspace: TerminalWorkspace, label: string, fallback: string): string {
  return workspace.metrics.find((metric) => metric.label === label)?.value ?? fallback;
}

function normalizeDrawdownLoss(value: string): string {
  if (value === "N/A" || value.startsWith("-")) {
    return value;
  }
  return `-${value}`;
}

function parsePercentMetric(value: string): number | null {
  const normalized = value.trim().replace("%", "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatAssumptionCurrency(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function normalizeBacktestAssumptionValue(
  field: BacktestAssumptionField,
  value: number | undefined,
  fallback: number
): number {
  const spec = backtestAssumptionSpecs[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(spec.min, Math.round(value));
}

function inferExposureFromPosition(position: string): string {
  const cap = position.match(/(\d+(?:\.\d+)?)%\s*cap/i);
  return cap ? `${cap[1]}%` : "paper";
}

function resolvePaperOrderPrice(workspace: TerminalWorkspace): number {
  const selectedPrice = workspace.selectedInstrument.price;
  if (selectedPrice !== undefined && selectedPrice !== null && Number.isFinite(selectedPrice) && selectedPrice > 0) {
    return selectedPrice;
  }
  return 1;
}

function calculatePaperQuantity(market: Market, price: number): number {
  const targetNotional = 20_000;
  const rawQuantity = Math.max(1, Math.floor(targetNotional / price));
  if (market === "ashare") {
    return Math.max(100, Math.floor(rawQuantity / 100) * 100);
  }
  if (market === "crypto") {
    return Math.max(1, Math.floor(rawQuantity));
  }
  return rawQuantity;
}

function findDecisionMessage(workspace: TerminalWorkspace, agent: string): string {
  return workspace.decisionLog.find((entry) => entry.agent === agent)?.message ?? "No committee note recorded yet.";
}

export function buildWorkflowStages(workspace: TerminalWorkspace, runState?: WorkflowRunState): WorkflowStageView[] {
  const completedStageIds = new Set(runState?.completedStageIds ?? []);
  const latestOutputByStage = new Map<string, string>();
  for (const logEntry of runState?.log ?? []) {
    latestOutputByStage.set(logEntry.stageId, logEntry.message);
  }

  return workspace.workflowNodes.map((node, index) => {
    const isExecution = node.id === "execution";
    const defaultStatus: WorkflowStageStatus =
      isExecution && !workspace.execution.liveEnabled ? "blocked" : index === 0 ? "active" : "ready";
    const status: WorkflowStageStatus =
      isExecution && !workspace.execution.liveEnabled
        ? "blocked"
        : runState?.failedStageId === node.id
          ? "failed"
          : completedStageIds.has(node.id)
            ? "completed"
            : runState?.activeStageId === node.id
              ? "running"
              : defaultStatus;
    return {
      id: node.id,
      label: node.label,
      detail: node.detail,
      status,
      output:
        latestOutputByStage.get(node.id) ??
        (node.id === "data"
          ? `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`
          : isExecution && !workspace.execution.liveEnabled
            ? "Paper execution only"
            : "Ready for pipeline run"),
      artifacts: buildWorkflowStageArtifacts(workspace, node.id)
    };
  });
}

function buildWorkflowStageArtifacts(workspace: TerminalWorkspace, stageId: string): WorkflowStageArtifact[] {
  if (stageId === "data") {
    return [
      {
        label: "Instrument",
        value: workspace.selectedInstrument.symbol,
        detail: `${workspace.selectedInstrument.name} · ${workspace.selectedInstrument.market}`,
        tone: "neutral"
      },
      {
        label: "Timeframe",
        value: workspace.selectedTimeframe,
        detail: "Selected research interval",
        tone: "neutral"
      },
      {
        label: "Rows",
        value: workspace.researchRun ? `${workspace.researchRun.dataRows} bars` : "Pending run",
        detail: workspace.researchRun
          ? `Bound to audited run ${workspace.researchRun.runId}.`
          : "Run Pipeline to bind an audited data snapshot.",
        tone: workspace.researchRun ? "positive" : "warning"
      }
    ];
  }

  if (stageId === "factor") {
    return [
      { label: "Entry", value: workspace.strategy.entry, detail: "Signal gate", tone: "positive" },
      { label: "Exit", value: workspace.strategy.exit, detail: "Invalidation rule", tone: "warning" },
      { label: "Risk", value: workspace.strategy.risk, detail: "Sizing and guardrail", tone: "risk" }
    ];
  }

  if (stageId === "backtest") {
    const assumptions = resolveBacktestAssumptions(workspace);
    return [
      ...workspace.metrics.map((metric) => ({
        label: metric.label,
        value: metric.value,
        detail: "Latest audited metric for the selected context.",
        tone: metric.tone
      })),
      {
        label: "Initial cash",
        value: formatAssumptionCurrency(assumptions.initialCash),
        detail: "Backtest capital assumption.",
        tone: "neutral" as const
      },
      {
        label: "Fee",
        value: `${assumptions.feeBps} bps`,
        detail: "Round-trip fee assumption in basis points.",
        tone: "neutral" as const
      },
      {
        label: "Slippage",
        value: `${assumptions.slippageBps} bps`,
        detail: "Execution slippage assumption in basis points.",
        tone: "warning" as const
      }
    ];
  }

  if (stageId === "agent") {
    return workspace.decisionLog.slice(0, 4).map((entry) => ({
      label: entry.agent,
      value: entry.message,
      detail: "AI research note from supplied workspace context.",
      tone: entry.tone
    }));
  }

  if (stageId === "execution") {
    const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
    return [
      {
        label: "Mode",
        value: workspace.execution.mode,
        detail: workspace.execution.liveEnabled ? "Certified live route is available." : "Paper route only.",
        tone: workspace.execution.liveEnabled ? "positive" : "warning"
      },
      {
        label: "Live gates",
        value: workspace.execution.liveEnabled ? "open" : `${blockedGateCount} blocked`,
        detail: workspace.execution.gates.map((gate) => gate.label).join(", "),
        tone: workspace.execution.liveEnabled ? "positive" : "warning"
      }
    ];
  }

  return [];
}

export function workspaceWithAiAction(workspace: TerminalWorkspace, action: AiWorkbenchAction): TerminalWorkspace {
  if (action === "strategy-draft") {
    return {
      ...workspace,
      strategy: {
        name: `${workspace.selectedInstrument.symbol} ${workspace.selectedTimeframe} AI draft`,
        entry: "Momentum confirmation plus AI committee agreement",
        exit: "Close below trend support or risk manager downgrade",
        position: "Start with paper sizing and cap exposure before audited replay",
        risk: "Paper only; require adapter certification, risk approval, and human confirmation"
      },
      decisionLog: [
        {
          agent: "Strategy Drafter",
          message: `Strategy draft generated for ${workspace.selectedInstrument.symbol}: keep paper-only execution until data, risk, and human gates pass.`,
          tone: "warning"
        },
        ...workspace.decisionLog
      ]
    };
  }

  if (action === "explain") {
    const returnMetric = workspace.metrics.find((metric) => metric.label === "Return")?.value ?? "N/A";
    const drawdownMetric = workspace.metrics.find((metric) => metric.label === "Max DD")?.value ?? "N/A";
    const tradeMetric = workspace.metrics.find((metric) => metric.label === "Trades")?.value ?? "0";
    return {
      ...workspace,
      decisionLog: [
        {
          agent: "AI Summary",
          message: `Backtest explanation for ${workspace.selectedInstrument.symbol}: return ${returnMetric}, max drawdown ${drawdownMetric}, trades ${tradeMetric}; no guaranteed outcome.`,
          tone: "ai"
        },
        ...workspace.decisionLog
      ]
    };
  }

  return {
    ...workspace,
    decisionLog: [
      {
        agent: "AI Debate",
        message: `Debate generated for ${workspace.selectedInstrument.symbol}: bull case requires momentum confirmation; bear case flags drawdown and data quality.`,
        tone: "ai"
      },
      ...workspace.decisionLog
    ]
  };
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

export function buildResearchRunComparisonRows(runs: ResearchRunAudit[]): ResearchRunComparisonRow[] {
  if (runs.length < 2) {
    return [];
  }
  const [current, previous] = runs;
  const returnDelta = metricNumber(current, "total_return_pct") - metricNumber(previous, "total_return_pct");
  const drawdownDelta = metricNumber(current, "max_drawdown_pct") - metricNumber(previous, "max_drawdown_pct");
  const tradeDelta = metricNumber(current, "trade_count") - metricNumber(previous, "trade_count");
  const currentAssumptions = normalizeBacktestAssumptions(current.backtestAssumptions);
  const previousAssumptions = normalizeBacktestAssumptions(previous.backtestAssumptions);
  const assumptionsChanged =
    currentAssumptions.initialCash !== previousAssumptions.initialCash ||
    currentAssumptions.feeBps !== previousAssumptions.feeBps ||
    currentAssumptions.slippageBps !== previousAssumptions.slippageBps;

  return [
    {
      id: "return",
      label: "Return",
      current: formatSignedPct(metricNumber(current, "total_return_pct")),
      previous: formatSignedPct(metricNumber(previous, "total_return_pct")),
      delta: formatSignedPointDelta(returnDelta),
      tone: returnDelta > 0 ? "positive" : returnDelta < 0 ? "warning" : "neutral"
    },
    {
      id: "drawdown",
      label: "Max DD",
      current: formatPct(metricNumber(current, "max_drawdown_pct")),
      previous: formatPct(metricNumber(previous, "max_drawdown_pct")),
      delta: formatSignedPointDelta(drawdownDelta),
      tone: drawdownDelta < 0 ? "positive" : drawdownDelta > 0 ? "warning" : "neutral"
    },
    {
      id: "trades",
      label: "Trades",
      current: String(metricNumber(current, "trade_count")),
      previous: String(metricNumber(previous, "trade_count")),
      delta: formatSignedIntegerDelta(tradeDelta),
      tone: "neutral"
    },
    {
      id: "assumptions",
      label: "Assumptions",
      current: formatAssumptionsForAudit(currentAssumptions),
      previous: formatAssumptionsForAudit(previousAssumptions),
      delta: assumptionsChanged ? "changed" : "same",
      tone: assumptionsChanged ? "warning" : "neutral"
    }
  ];
}

export function formatInstrumentPrice(value: number | null | undefined): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  return value.toFixed(2);
}

export function buildInstrumentFromSymbol(market: Market, rawSymbol: string): Instrument | null {
  const symbol = normalizeInstrumentSymbol(market, rawSymbol);
  if (!symbol) {
    return null;
  }
  return {
    symbol,
    name: symbol,
    market,
    changePct: 0
  };
}

export function normalizeInstrumentSymbol(market: Market, rawSymbol: string): string {
  const compact = rawSymbol.trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) {
    return "";
  }
  if (market === "ashare") {
    return compact
      .replace(/^(SH|SZ|SSE|SZSE|CN:)/, "")
      .replace(/\.(SH|SZ|SS|SSE|SZSE)$/u, "");
  }
  if (market === "crypto") {
    const withSlash = compact.replace("-", "/");
    if (withSlash.includes("/")) {
      return withSlash;
    }
    if (withSlash.endsWith("USDT") && withSlash.length > 4) {
      return `${withSlash.slice(0, -4)}/USDT`;
    }
  }
  return compact;
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
    backtestAssumptions: normalizeBacktestAssumptions(run.backtestAssumptions),
    strategy: strategySnapshotFromAudit(run),
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
    backtestTrades: run.backtestTrades ?? [],
    backtestEquityCurve: run.backtestEquityCurve ?? [],
    backtestDiagnostics: run.backtestDiagnostics ?? [],
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

function strategySnapshotFromAudit(run: ResearchRunAudit): StrategySnapshot {
  if (!run.strategyConfig) {
    return {
      name: run.strategyName,
      entry: "Replay from audited research run",
      exit: `Original timeframe ${run.timeframe}`,
      position: `${run.dataRows} bars replayed`,
      risk: `Strategy revision ${run.strategyRevision}; execution ${run.executionMode}`
    };
  }
  return {
    name: run.strategyConfig.name,
    entry: formatStrategyConditions(run.strategyConfig.entryConditions),
    exit: formatStrategyConditions(run.strategyConfig.exitConditions),
    position:
      run.strategyConfig.risk.positionPct === null
        ? "Position cap unavailable"
        : `${formatFractionPct(run.strategyConfig.risk.positionPct)} position cap`,
    risk: formatStrategyRisk(run.strategyConfig.risk)
  };
}

function formatStrategyConditions(conditions: ResearchRunStrategyCondition[]): string {
  if (!conditions.length) {
    return "No structured condition";
  }
  return conditions.map((condition) => formatStrategyCondition(condition)).join(" AND ");
}

function formatStrategyCondition(condition: ResearchRunStrategyCondition): string {
  const params = Object.entries(condition.params)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(", ");
  return params ? `${condition.kind}(${params})` : condition.kind;
}

function formatStrategyRisk(risk: ResearchRunStrategyRisk): string {
  const parts = [
    risk.stopLossPct === null ? null : `Stop ${formatFractionPct(risk.stopLossPct)}`,
    risk.takeProfitPct === null ? null : `take profit ${formatFractionPct(risk.takeProfitPct)}`,
    risk.maxDrawdownPct === null ? null : `max drawdown ${formatFractionPct(risk.maxDrawdownPct)}`
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" / ") : "No structured risk guardrail";
}

function formatFractionPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function buildAuditReplayWorkflowState(run: ResearchRunAudit): WorkflowRunState {
  return {
    activeStageId: "execution",
    completedStageIds: ["data", "factor", "backtest", "agent"],
    log: [
      {
        id: `replay-${run.runId}-data`,
        stageId: "data",
        level: run.dataQuality && !run.dataQuality.isComplete ? "warning" : "success",
        message: auditDataSnapshotMessage(run)
      },
      {
        id: `replay-${run.runId}-factor`,
        stageId: "factor",
        level: "success",
        message: `Strategy revision restored: ${run.strategyRevision}`
      },
      {
        id: `replay-${run.runId}-backtest`,
        stageId: "backtest",
        level: "success",
        message: `Audit replay loaded: ${run.dataRows} bars · ${run.executionMode}`
      },
      {
        id: `replay-${run.runId}-agent`,
        stageId: "agent",
        level: "success",
        message: `Decision notes restored: ${run.decisions.length}`
      },
      {
        id: `replay-${run.runId}-execution`,
        stageId: "execution",
        level: "warning",
        message: `Execution mode restored: ${run.executionMode}; live gates remain controlled locally`
      }
    ]
  };
}

function auditDataSnapshotMessage(run: ResearchRunAudit): string {
  const base = `Audit data snapshot restored: ${run.symbol} · ${run.timeframe} · ${run.dataRows} bars`;
  if (!run.dataQuality) {
    return base;
  }
  const warningCount = run.dataQuality.warnings.length;
  const warningLabel = warningCount === 1 ? "1 warning" : `${warningCount} warnings`;
  return warningCount > 0
    ? `${base} · source ${run.dataQuality.source} · ${warningLabel}`
    : `${base} · source ${run.dataQuality.source}`;
}

export function workspaceWithSelectedInstrument(
  currentWorkspace: TerminalWorkspace,
  instrument: Instrument
): TerminalWorkspace {
  const watchlist = currentWorkspace.watchlist.some(
    (candidate) => candidate.symbol === instrument.symbol && candidate.market === instrument.market
  )
    ? currentWorkspace.watchlist
    : [instrument, ...currentWorkspace.watchlist].slice(0, 8);

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

export function workspaceWithStrategyField(
  currentWorkspace: TerminalWorkspace,
  field: StrategyField,
  value: string
): TerminalWorkspace {
  const note: DecisionLogEntry = {
    agent: "Strategy Editor",
    message: `Strategy field ${field} updated locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Editor"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;
  return {
    ...currentWorkspace,
    strategy: {
      ...currentWorkspace.strategy,
      [field]: value
    },
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    decisionLog: [note, ...existingLog],
    researchRun: null
  };
}

export function workspaceWithBacktestAssumption(
  currentWorkspace: TerminalWorkspace,
  field: BacktestAssumptionField,
  value: number
): TerminalWorkspace {
  const currentAssumptions = resolveBacktestAssumptions(currentWorkspace);
  const nextAssumptions = {
    ...currentAssumptions,
    [field]: normalizeBacktestAssumptionValue(field, value, currentAssumptions[field])
  };
  const note: DecisionLogEntry = {
    agent: "Backtest Lab",
    message: `Backtest assumption ${field} updated locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Backtest Lab"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;
  return {
    ...currentWorkspace,
    backtestAssumptions: nextAssumptions,
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    decisionLog: [note, ...existingLog],
    researchRun: null
  };
}

export function workspaceWithPreservedSelection(
  refreshedWorkspace: TerminalWorkspace,
  currentWorkspace: TerminalWorkspace
): TerminalWorkspace {
  const sameInstrument =
    refreshedWorkspace.selectedInstrument.symbol === currentWorkspace.selectedInstrument.symbol &&
    refreshedWorkspace.selectedInstrument.market === currentWorkspace.selectedInstrument.market;
  const sameTimeframe = refreshedWorkspace.selectedTimeframe === currentWorkspace.selectedTimeframe;

  let workspace = refreshedWorkspace;
  if (!sameInstrument) {
    workspace = workspaceWithSelectedInstrument(workspace, currentWorkspace.selectedInstrument);
  }
  if (!sameTimeframe) {
    workspace = workspaceWithSelectedTimeframe(workspace, currentWorkspace.selectedTimeframe);
  }
  return workspace;
}

export function workspaceWithPreservedInteractiveState(
  refreshedWorkspace: TerminalWorkspace,
  currentWorkspace: TerminalWorkspace
): TerminalWorkspace {
  const workspace = workspaceWithPreservedSelection(refreshedWorkspace, currentWorkspace);
  return {
    ...workspace,
    strategy: currentWorkspace.strategy,
    backtestAssumptions: resolveBacktestAssumptions(currentWorkspace),
    metrics: currentWorkspace.metrics,
    decisionLog: currentWorkspace.decisionLog,
    researchRun: currentWorkspace.researchRun
  };
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

function formatSignedPointDelta(value: number): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}pp`;
}

function formatSignedIntegerDelta(value: number): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
}

function metricNumber(run: ResearchRunAudit, key: string): number {
  const value = run.metrics[key];
  return Number.isFinite(value) ? value : 0;
}

function formatAssumptionsForAudit(assumptions: BacktestAssumptions): string {
  return `Cash ${formatAssumptionCurrency(assumptions.initialCash)} · Fee ${assumptions.feeBps}bps · Slippage ${assumptions.slippageBps}bps`;
}
