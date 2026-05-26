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

export function buildModuleNewsEvents(workspace: TerminalWorkspace): ModuleNewsEvent[] {
  const selectedSymbol = workspace.selectedInstrument.symbol;
  const committeeEvents = workspace.decisionLog.slice(0, 3).map((entry, index) => ({
    id: `committee-${index}`,
    source: "AI committee",
    title: `${entry.agent}: ${entry.message}`,
    impact: entry.tone,
    detail: `Linked to ${selectedSymbol} research context.`
  }));
  return [
    ...committeeEvents,
    {
      id: "live-feed-pending",
      source: "Local event watch",
      title: `${selectedSymbol} live event feed is not connected yet`,
      impact: "warning",
      detail: "This panel currently surfaces local agent context and will accept a news provider adapter later."
    }
  ];
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
    return workspace.metrics.map((metric) => ({
      label: metric.label,
      value: metric.value,
      detail: "Latest audited metric for the selected context.",
      tone: metric.tone
    }));
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

export function buildAuditReplayWorkflowState(run: ResearchRunAudit): WorkflowRunState {
  return {
    activeStageId: "execution",
    completedStageIds: ["data", "factor", "backtest", "agent"],
    log: [
      {
        id: `replay-${run.runId}-data`,
        stageId: "data",
        level: "success",
        message: `Audit data snapshot restored: ${run.symbol} · ${run.timeframe} · ${run.dataRows} bars`
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
