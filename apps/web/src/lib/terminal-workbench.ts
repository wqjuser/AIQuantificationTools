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

export type ProductWorkAreaId =
  | "market"
  | "research"
  | "strategy"
  | "backtest"
  | "ai-review"
  | "portfolio"
  | "execution"
  | "audit"
  | "settings";

export type ProductWorkAreaStatus = "ready" | "needs_run" | "blocked";

export interface ProductWorkArea {
  id: ProductWorkAreaId;
  label: string;
  description: string;
  accent: TerminalModule["accent"];
  quantLoopStepId: string;
  workflowStageId: string;
  status: ProductWorkAreaStatus;
}

export interface ProductWorkAreaSelection {
  areaId: ProductWorkAreaId;
  quantLoopStepId: string;
  workflowStageId: string;
}

export interface QuantLoopNavigationTarget {
  moduleId: string;
  workflowStageId: string;
}

export interface QuantLoopSelection {
  stepId: string;
  target: QuantLoopNavigationTarget;
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

export interface StrategyLibraryDraftItem {
  name: string;
  revision: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  status: "draft" | "audited";
  auditRunId?: string | null;
  strategySnapshot: StrategySnapshot;
}

export interface StrategyVersionDiffRow {
  id: "context" | StrategyField;
  label: string;
  current: string;
  saved: string;
  changed: boolean;
  tone: "neutral" | "warning";
}

export interface StrategyReadinessGate {
  id: "schema" | "risk" | "execution" | "audit";
  label: "Strategy schema" | "Risk controls" | "Execution mode" | "Audit evidence";
  value: string;
  detail: string;
  status: "passed" | "review" | "blocked";
  tone: "positive" | "warning" | "risk";
}

export type StrategyConditionKind = "close_above_sma" | "close_below_sma" | "rsi_below" | "rsi_above";

export type StrategyRuleDraftField =
  | "name"
  | "entryKind"
  | "entryWindow"
  | "entryThreshold"
  | "exitKind"
  | "exitWindow"
  | "exitThreshold"
  | "positionPct"
  | "stopLossPct"
  | "takeProfitPct"
  | "maxDrawdownPct";

export interface StrategyRuleDraft {
  name: string;
  entryKind: StrategyConditionKind;
  entryWindow: number;
  entryThreshold: number;
  exitKind: StrategyConditionKind;
  exitWindow: number;
  exitThreshold: number;
  positionPct: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxDrawdownPct: number;
  paperOnly: boolean;
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

export interface BacktestEvidenceCard {
  id: "run" | "strategy" | "costs" | "diagnostics";
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestReadinessGate {
  id: "data" | "strategy" | "costs" | "execution";
  label: string;
  status: "passed" | "blocked" | "review";
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestBenchmark {
  label: string;
  symbol: string;
  strategyReturn: string;
  benchmarkReturn: string;
  alpha: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
  sampleBars: number;
  source: string;
}

export interface BacktestReport {
  status: "ready" | "blocked";
  headline: string;
  summary: string;
  runId: string | null;
  aiReviewReady: boolean;
  executionReady: boolean;
  assumptions: BacktestAssumptions;
  assumptionRows: BacktestAssumptionRow[];
  evidenceCards: BacktestEvidenceCard[];
  readinessGates: BacktestReadinessGate[];
  benchmark: BacktestBenchmark;
  metrics: BacktestMetric[];
  trades: BacktestTradeRow[];
  diagnostics: BacktestDiagnostic[];
  equityCurve: BacktestEquityPoint[];
  tradeCount: number;
  equityPointCount: number;
  diagnosticCount: number;
}

export interface BacktestParameterScanRow {
  id: string;
  runId: string;
  source: string;
  condition: string;
  entryWindow: number;
  exitWindow: number;
  returnPct: string;
  maxDrawdownPct: string;
  tradeCount: number;
  alphaVsCurrent: string;
  status: "current" | "candidate";
  tone: "positive" | "warning" | "neutral" | "risk";
  dataRows: number;
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
  id: "context" | "backtest" | "benchmark" | "research-note" | "risk" | "safety";
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export interface AiReviewCitation {
  id: "run" | "metrics" | "benchmark" | "strategy" | "data-quality" | "research-note" | "risk-gates";
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export interface AiReviewDossier {
  status: "ready" | "blocked";
  headline: string;
  summary: string;
  citations: AiReviewCitation[];
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

export type RiskApprovalStatus = "blocked" | "paper_ready" | "live_ready";

export interface RiskApprovalGate {
  id: "audited-run" | "ai-evidence" | "data-quality" | "position-limit" | "drawdown-limit" | "execution-route";
  label: string;
  value: string;
  detail: string;
  status: "passed" | "blocked" | "review";
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export interface RiskApprovalSummary {
  status: RiskApprovalStatus;
  headline: string;
  summary: string;
  gates: RiskApprovalGate[];
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

export interface PaperExecutionSnapshotOrder {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  status: "filled" | "rejected";
  reason: string;
  timestamp: string;
}

export interface PaperExecutionSnapshotGate {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface PaperExecutionSnapshot {
  executionId: string;
  runId: string;
  createdAt: string;
  mode: string;
  account: {
    cash: number;
    equity: number;
    positions: Record<string, number>;
  };
  orders: PaperExecutionSnapshotOrder[];
  gates: PaperExecutionSnapshotGate[];
}

export interface PaperExecutionSummaryTile {
  id: "account-sync" | "paper-positions" | "risk-gates";
  label: string;
  value: string;
  detail: string;
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

export type PromotionReadinessStatus = "blocked" | "paper_pending" | "certification_pending" | "live_ready";

export interface PromotionQueueStage {
  id: "audited-run" | "risk-approval" | "paper-execution" | "adapter-certification" | "human-confirmation";
  label: string;
  value: string;
  detail: string;
  status: "passed" | "blocked" | "review";
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PromotionReadiness {
  status: PromotionReadinessStatus;
  headline: string;
  summary: string;
  stages: PromotionQueueStage[];
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
  dataQuality?: ResearchRunDataQuality;
  dataSnapshot?: ResearchRunDataSnapshot;
  researchNote?: ResearchRunNote;
  strategyConfig?: ResearchRunStrategyConfig;
}

export interface ResearchRunNote {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  body: string;
  updatedAt: string | null;
}

export interface ResearchRunDataQuality {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
}

export interface ResearchRunDataSnapshotBar {
  timestamp: string;
  timestampMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ResearchRunDataSnapshot {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
  start: string | null;
  end: string | null;
  hash: string;
  bars: ResearchRunDataSnapshotBar[];
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

export interface ResearchRunAiReport {
  summary: string;
  risks: string[];
  improvements: string[];
  disclaimer: string;
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
  aiReport?: ResearchRunAiReport;
  dataQuality?: ResearchRunDataQuality;
  dataSnapshot?: ResearchRunDataSnapshot;
  researchNote?: ResearchRunNote;
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

const defaultStrategyRuleDraft: StrategyRuleDraft = {
  name: "SMA trend demo",
  entryKind: "close_above_sma",
  entryWindow: 20,
  entryThreshold: 30,
  exitKind: "close_below_sma",
  exitWindow: 20,
  exitThreshold: 55,
  positionPct: 20,
  stopLossPct: 8,
  takeProfitPct: 18,
  maxDrawdownPct: 12,
  paperOnly: true
};

const primaryQuantLoopStepDefinitions = [
  { id: "research", label: "Market Research" },
  { id: "strategy", label: "Strategy Lab" },
  { id: "backtest", label: "Backtest Review" },
  { id: "agent-review", label: "Agent Review" },
  { id: "paper", label: "Paper Trading" }
] as const;

const productWorkAreaDefinitions = [
  {
    id: "market",
    label: "Market Center",
    description: "Search, quotes, K-lines, source health",
    accent: "market",
    quantLoopStepId: "research",
    workflowStageId: "data"
  },
  {
    id: "research",
    label: "Research Terminal",
    description: "Chart, factors, notes, context",
    accent: "market",
    quantLoopStepId: "research",
    workflowStageId: "data"
  },
  {
    id: "strategy",
    label: "Strategy Lab",
    description: "Rules, versions, risk configuration",
    accent: "strategy",
    quantLoopStepId: "strategy",
    workflowStageId: "factor"
  },
  {
    id: "backtest",
    label: "Backtest Lab",
    description: "Assumptions, trades, reproducible run",
    accent: "ai",
    quantLoopStepId: "backtest",
    workflowStageId: "backtest"
  },
  {
    id: "ai-review",
    label: "AI Review Board",
    description: "Evidence-locked agent committee",
    accent: "ai",
    quantLoopStepId: "agent-review",
    workflowStageId: "agent"
  },
  {
    id: "portfolio",
    label: "Portfolio & Risk",
    description: "Exposure, positions, live gates",
    accent: "execution",
    quantLoopStepId: "paper",
    workflowStageId: "execution"
  },
  {
    id: "execution",
    label: "Execution Center",
    description: "Paper orders and adapter readiness",
    accent: "execution",
    quantLoopStepId: "paper",
    workflowStageId: "execution"
  },
  {
    id: "audit",
    label: "Audit & Replay",
    description: "Run history, import, export, replay",
    accent: "ai",
    quantLoopStepId: "backtest",
    workflowStageId: "backtest"
  },
  {
    id: "settings",
    label: "Settings",
    description: "Data sources, API keys, safety gates",
    accent: "execution",
    quantLoopStepId: "research",
    workflowStageId: "data"
  }
] as const satisfies readonly Omit<ProductWorkArea, "status">[];

function buildPrimaryQuantLoopSteps(activeStepId = "research", hasAuditedRun = false): QuantLoopStep[] {
  return primaryQuantLoopStepDefinitions.map((step) => ({
    ...step,
    status: step.id === "paper" && !hasAuditedRun ? "locked" : step.id === activeStepId ? "active" : "ready"
  }));
}

function activeQuantLoopStepId(workspace: TerminalWorkspace): string {
  const supportedStepIds = new Set<string>(primaryQuantLoopStepDefinitions.map((step) => step.id));
  return (
    workspace.quantLoop.find((step) => supportedStepIds.has(step.id) && step.status === "active")?.id ?? "research"
  );
}

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
    quantLoop: buildPrimaryQuantLoopSteps(),
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
      risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
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

export function workspaceWithPrimaryWorkflows(workspace: TerminalWorkspace): TerminalWorkspace {
  return {
    ...workspace,
    quantLoop: buildPrimaryQuantLoopSteps(activeQuantLoopStepId(workspace), Boolean(workspace.researchRun))
  };
}

export function buildQuantLoopNavigationTarget(stepId: string): QuantLoopNavigationTarget {
  const targets: Record<string, QuantLoopNavigationTarget> = {
    research: { moduleId: "watchlist", workflowStageId: "data" },
    strategy: { moduleId: "watchlist", workflowStageId: "factor" },
    backtest: { moduleId: "workflow", workflowStageId: "backtest" },
    "agent-review": { moduleId: "workflow", workflowStageId: "agent" },
    paper: { moduleId: "portfolio", workflowStageId: "execution" }
  };
  return targets[stepId] ?? targets.research;
}

export function buildProductWorkAreas(workspace: TerminalWorkspace): ProductWorkArea[] {
  const hasAuditedRun = Boolean(workspace.researchRun?.runId);

  return productWorkAreaDefinitions.map((area) => ({
    ...area,
    status: productWorkAreaStatus(area.id, hasAuditedRun, workspace)
  }));
}

export function resolveProductWorkAreaSelection(
  workspace: TerminalWorkspace,
  requestedAreaId: string,
  fallbackAreaId: ProductWorkAreaId = "research"
): ProductWorkAreaSelection {
  const areas = buildProductWorkAreas(workspace);
  const requestedArea = areas.find((area) => area.id === requestedAreaId);
  const fallbackArea = areas.find((area) => area.id === fallbackAreaId) ?? areas[0];
  const selectedArea = requestedArea ?? fallbackArea;

  return {
    areaId: selectedArea.id,
    quantLoopStepId: selectedArea.quantLoopStepId,
    workflowStageId: selectedArea.workflowStageId
  };
}

function productWorkAreaStatus(
  areaId: ProductWorkAreaId,
  hasAuditedRun: boolean,
  workspace: TerminalWorkspace
): ProductWorkAreaStatus {
  if (areaId === "execution") {
    return hasAuditedRun ? "ready" : "blocked";
  }
  if (areaId === "portfolio" || areaId === "ai-review" || areaId === "audit") {
    return hasAuditedRun ? "ready" : "needs_run";
  }
  if (areaId === "backtest") {
    return workspace.metrics.some((metric) => metric.value !== "N/A" && metric.value !== "0") ? "ready" : "needs_run";
  }
  return "ready";
}

export function resolveQuantLoopSelection(
  workspace: TerminalWorkspace,
  requestedStepId: string,
  fallbackStepId = activeQuantLoopStepId(workspace)
): QuantLoopSelection {
  const supportedStepIds = new Set<string>(primaryQuantLoopStepDefinitions.map((step) => step.id));
  const supportedSteps = workspace.quantLoop.filter((step) => supportedStepIds.has(step.id));
  const requestedStep = supportedSteps.find((step) => step.id === requestedStepId);
  const fallbackStep = supportedSteps.find((step) => step.id === fallbackStepId && step.status !== "locked");
  const selectedStep =
    requestedStep && requestedStep.status !== "locked"
      ? requestedStep
      : fallbackStep ?? supportedSteps.find((step) => step.status !== "locked");
  const stepId = selectedStep?.id ?? "research";

  return {
    stepId,
    target: buildQuantLoopNavigationTarget(stepId)
  };
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
  const researchNote = normalizedResearchNote(workspace.researchRun?.researchNote);
  const cards: AiEvidenceCard[] = [
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
  ];

  if (workspace.researchRun) {
    const benchmark = buildBacktestBenchmark(workspace);
    cards.push({
      id: "benchmark",
      label: "Benchmark alpha",
      value: benchmark.alpha,
      detail: aiBenchmarkDetail(benchmark),
      tone: benchmark.tone
    });
  }

  if (researchNote) {
    cards.push({
      id: "research-note",
      label: "Research note",
      value: "Locked note snapshot",
      detail: compactResearchNoteDetail(researchNote.body),
      tone: "ai"
    });
  }

  cards.push(
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
  );

  return cards;
}

export function buildAiReviewDossier(workspace: TerminalWorkspace): AiReviewDossier {
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const riskGateCitation: AiReviewCitation = {
    id: "risk-gates",
    label: "Risk gates",
    value: workspace.execution.liveEnabled ? "Live gates open" : `${blockedGateCount} blocked gates`,
    detail: workspace.execution.gates
      .map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`)
      .join(" · "),
    tone: workspace.execution.liveEnabled ? "positive" : "risk"
  };

  if (!workspace.researchRun) {
    return {
      status: "blocked",
      headline: "Audited evidence required",
      summary: "Run Pipeline before agent debate, explanation, or strategy promotion.",
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "Missing audited run",
          detail: "No reproducible backtest is bound to this context.",
          tone: "risk"
        },
        {
          id: "data-quality",
          label: "Data quality",
          value: "Unavailable",
          detail: "Data quality is only trusted after an audited run is loaded.",
          tone: "warning"
        },
        riskGateCitation
      ]
    };
  }

  const run = workspace.researchRun;
  const returnMetric = metricValue(workspace, "Return", "N/A");
  const drawdownMetric = metricValue(workspace, "Max DD", "N/A");
  const winRateMetric = metricValue(workspace, "Win Rate", "N/A");
  const tradeMetric = metricValue(workspace, "Trades", "0");
  const dataQuality = run.dataQuality;
  const researchNote = normalizedResearchNote(run.researchNote);
  const benchmark = buildBacktestBenchmark(workspace);
  const benchmarkCitation: AiReviewCitation = {
    id: "benchmark",
    label: "Benchmark alpha",
    value: benchmark.alpha,
    detail: aiBenchmarkDetail(benchmark),
    tone: benchmark.tone
  };
  const noteCitation: AiReviewCitation | null = researchNote
    ? {
        id: "research-note",
        label: "Research note",
        value: "Locked note snapshot",
        detail: compactResearchNoteDetail(researchNote.body),
        tone: "ai"
      }
    : null;

  return {
    status: "ready",
    headline: `AI review bound to ${run.runId}`,
    summary: `Agents may explain evidence for ${workspace.selectedInstrument.symbol}, but live execution remains gated.`,
    citations: [
      {
        id: "run",
        label: "Run id",
        value: run.runId,
        detail: `${run.dataRows} ${run.timeframe} bars · ${run.executionMode}`,
        tone: "positive"
      },
      {
        id: "metrics",
        label: "Backtest metrics",
        value: `${returnMetric} / ${drawdownMetric} / ${tradeMetric} trades`,
        detail: `Win rate ${winRateMetric}; no guaranteed outcome.`,
        tone: returnMetric.startsWith("-") ? "warning" : "positive"
      },
      benchmarkCitation,
      {
        id: "strategy",
        label: "Strategy revision",
        value: run.strategyRevision,
        detail: workspace.strategy.name,
        tone: "positive"
      },
      dataQuality
        ? {
            id: "data-quality",
            label: "Data quality",
            value: `${dataQuality.source} · ${dataQuality.isComplete ? "complete" : "review"}`,
            detail: `${dataQuality.rows} rows · ${formatWarningCount(dataQuality.warnings.length)}`,
            tone: dataQuality.isComplete && dataQuality.warnings.length === 0 ? "positive" : "warning"
          }
        : {
            id: "data-quality",
            label: "Data quality",
            value: "Not attached",
            detail: "Run metadata did not include data quality details.",
            tone: "warning"
          },
      ...(noteCitation ? [noteCitation] : []),
      riskGateCitation
    ]
  };
}

export function buildAiReviewReportMarkdown(workspace: TerminalWorkspace): string | null {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const dossier = buildAiReviewDossier(workspace);
  if (dossier.status !== "ready") {
    return null;
  }

  const rounds = buildAgentCommitteeRounds(workspace);
  const benchmark = buildBacktestBenchmark(workspace);
  const researchNote = normalizedResearchNote(run.researchNote);
  const citationRows = dossier.citations.map((citation) => [citation.label, citation.value, citation.detail]);
  const committeeRows = rounds.map((round) => [
    round.agent,
    round.verdict,
    `${round.confidence}%`,
    round.thesis,
    round.evidence
  ]);
  const decisionRows = workspace.decisionLog.map((entry) => [entry.agent, entry.tone, entry.message]);

  return [
    "# AIQuant Evidence-Locked AI Review",
    "",
    `Run ID: \`${run.runId}\``,
    `Market: \`${workspace.selectedInstrument.market}\``,
    `Symbol: \`${workspace.selectedInstrument.symbol}\``,
    `Timeframe: \`${run.timeframe}\``,
    `Strategy revision: \`${run.strategyRevision}\``,
    `Execution mode: \`${run.executionMode}\``,
    "",
    "## Review Scope",
    "",
    dossier.headline,
    "",
    dossier.summary,
    "",
    "## Evidence Citations",
    "",
    markdownTable(["Citation", "Value", "Evidence"], citationRows),
    "",
    "## Benchmark Context",
    "",
    benchmark.detail,
    "",
    markdownTable(
      ["Measure", "Value"],
      [
        ["Strategy return", benchmark.strategyReturn],
        ["Benchmark buy and hold", benchmark.benchmarkReturn],
        ["Benchmark alpha", benchmark.alpha]
      ]
    ),
    "",
    researchNote ? "## Locked Research Note" : "",
    researchNote ? "" : "",
    researchNote ? researchNote.body : "",
    researchNote ? "" : "",
    "## Committee Rounds",
    "",
    markdownTable(["Agent", "Verdict", "Confidence", "Thesis", "Evidence"], committeeRows),
    "",
    "## Decision Log",
    "",
    decisionRows.length ? markdownTable(["Agent", "Tone", "Message"], decisionRows) : "No decision log entries are attached.",
    "",
    "## AI Boundary",
    "",
    "AI must not output buy/sell instructions or guaranteed returns.",
    "",
    "This report can explain only the audited run, locked strategy revision, data snapshot, benchmark comparison, and risk gates above."
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trimEnd()
    .concat("\n");
}

function normalizedResearchNote(note: ResearchRunNote | null | undefined): ResearchRunNote | null {
  if (!note || !note.body.trim()) {
    return null;
  }
  return {
    ...note,
    body: note.body.trim()
  };
}

function compactResearchNoteDetail(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
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

export function buildRiskApprovalSummary(workspace: TerminalWorkspace): RiskApprovalSummary {
  const aiDossier = buildAiReviewDossier(workspace);
  const strategyDraft = buildStrategyRuleDraft(workspace);
  const approvalRisk = buildRiskApprovalRisk(workspace, strategyDraft);
  const researchRun = workspace.researchRun;
  const dataQualityGate = researchRun ? buildRiskApprovalDataQualityGate(researchRun) : null;
  const dataQualityIsReady = dataQualityGate?.status === "passed";
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const drawdownMetric = parsePercentMetric(metricValue(workspace, "Max DD", "N/A"));
  const drawdownValue = drawdownMetric === null ? "N/A" : `${formatPercentValue(drawdownMetric)}%`;
  const positionIsReady = approvalRisk.positionPct !== null && approvalRisk.positionPct > 0;
  const drawdownIsReady = approvalRisk.maxDrawdownPct !== null && approvalRisk.maxDrawdownPct > 0;
  const drawdownLimit = drawdownIsReady ? `${formatPercentValue(approvalRisk.maxDrawdownPct ?? 0)}%` : "N/A";
  const drawdownPassed = drawdownMetric !== null && drawdownIsReady && drawdownMetric <= (approvalRisk.maxDrawdownPct ?? 0);
  const riskIsComplete =
    positionIsReady &&
    drawdownIsReady &&
    approvalRisk.stopLossPct !== null &&
    approvalRisk.stopLossPct > 0 &&
    approvalRisk.takeProfitPct !== null &&
    approvalRisk.takeProfitPct > 0;
  const paperCanStage =
    Boolean(researchRun) && aiDossier.status === "ready" && dataQualityIsReady && riskIsComplete && drawdownPassed;
  const liveCanRoute = paperCanStage && workspace.execution.liveEnabled && blockedGateCount === 0;

  if (!researchRun) {
    return {
      status: "blocked",
      headline: "Risk approval blocked",
      summary: "Bind an audited run before paper or live execution.",
      gates: [
        {
          id: "audited-run",
          label: "Audited run",
          value: "No audited run",
          detail: "Run Pipeline must produce a reproducible research run before execution.",
          status: "blocked",
          tone: "risk"
        },
        {
          id: "ai-evidence",
          label: "AI evidence",
          value: "Evidence dossier blocked",
          detail: aiDossier.summary,
          status: "blocked",
          tone: "risk"
        },
        {
          id: "position-limit",
          label: "Position limit",
          value: `${formatPercentValue(strategyDraft.positionPct)}% cap`,
          detail: "Position cap is parsed but cannot be approved without audited evidence.",
          status: "review",
          tone: "warning"
        },
        {
          id: "drawdown-limit",
          label: "Drawdown guard",
          value: `${drawdownValue} / ${drawdownLimit} guard`,
          detail: "Drawdown is provisional until a run snapshot is bound.",
          status: "review",
          tone: "warning"
        },
        {
          id: "execution-route",
          label: "Execution route",
          value: "paper blocked",
          detail: "Paper route waits for audited evidence; live route remains gated.",
          status: "blocked",
          tone: "risk"
        }
      ]
    };
  }

  const approvedDataQualityGate = dataQualityGate ?? buildRiskApprovalDataQualityGate(researchRun);
  const executionRouteGate: RiskApprovalGate = liveCanRoute
    ? {
        id: "execution-route",
        label: "Execution route",
        value: "certified live",
        detail: "All execution gates passed; live route is available after human confirmation.",
        status: "passed",
        tone: "positive"
      }
    : !riskIsComplete
      ? {
          id: "execution-route",
          label: "Execution route",
          value: "risk blocked",
          detail: "Audited strategy risk configuration is incomplete before execution staging.",
          status: "blocked",
          tone: "risk"
        }
      : !dataQualityIsReady
        ? {
            id: "execution-route",
            label: "Execution route",
            value: "data blocked",
            detail: approvedDataQualityGate.detail,
            status: "blocked",
            tone: "risk"
          }
        : {
            id: "execution-route",
            label: "Execution route",
            value: "paper only",
            detail: `Paper route can stage; ${blockedGateCount} live gates still blocked.`,
            status: "review",
            tone: "warning"
          };

  const status: RiskApprovalStatus = liveCanRoute ? "live_ready" : paperCanStage ? "paper_ready" : "blocked";
  return {
    status,
    headline:
      status === "live_ready" ? "Certified live route ready" : status === "paper_ready" ? "Paper execution approved" : "Risk approval blocked",
    summary:
      status === "live_ready"
        ? `Audited run ${researchRun.runId} can route through certified live execution.`
        : status === "paper_ready"
          ? `Audited run ${researchRun.runId} can stage paper orders; live trading remains blocked until ${blockedGateCount} gates pass.`
          : `Audited run ${researchRun.runId} needs risk review before staging execution.`,
    gates: [
      {
        id: "audited-run",
        label: "Audited run",
        value: researchRun.runId,
        detail: `${researchRun.dataRows} ${researchRun.timeframe} bars · ${researchRun.executionMode}`,
        status: "passed",
        tone: "positive"
      },
      {
        id: "ai-evidence",
        label: "AI evidence",
        value: aiDossier.status === "ready" ? "Evidence locked" : "Evidence dossier blocked",
        detail: aiDossier.headline,
        status: aiDossier.status === "ready" ? "passed" : "blocked",
        tone: aiDossier.status === "ready" ? "ai" : "risk"
      },
      approvedDataQualityGate,
      {
        id: "position-limit",
        label: "Position limit",
        value: positionIsReady ? `${formatPercentValue(approvalRisk.positionPct ?? 0)}% cap` : "N/A cap",
        detail: positionIsReady
          ? approvalRisk.source === "audit"
            ? "Sizing uses the audited strategy position guardrail."
            : "Sizing uses the current strategy position guardrail."
          : "Audited strategy position guardrail is missing.",
        status: positionIsReady ? "passed" : "blocked",
        tone: positionIsReady ? ((approvalRisk.positionPct ?? 0) <= 30 ? "positive" : "warning") : "risk"
      },
      {
        id: "drawdown-limit",
        label: "Drawdown guard",
        value: `${drawdownValue} / ${drawdownLimit} guard`,
        detail: !drawdownIsReady
          ? "Audited strategy drawdown guardrail is missing."
          : drawdownPassed
            ? "Audited drawdown is inside the configured guardrail."
            : "Audited drawdown breaches the configured guardrail.",
        status: drawdownPassed ? "passed" : "blocked",
        tone: drawdownPassed ? "positive" : "risk"
      },
      executionRouteGate
    ]
  };
}

function buildRiskApprovalRisk(
  workspace: TerminalWorkspace,
  strategyDraft: StrategyRuleDraft
): {
  positionPct: number | null;
  stopLossPct: number | null;
  takeProfitPct: number | null;
  maxDrawdownPct: number | null;
  source: "audit" | "draft";
} {
  const auditedRisk = workspace.researchRun?.strategyConfig?.risk;
  if (auditedRisk) {
    return {
      positionPct: fractionToPercentOrNull(auditedRisk.positionPct),
      stopLossPct: fractionToPercentOrNull(auditedRisk.stopLossPct),
      takeProfitPct: fractionToPercentOrNull(auditedRisk.takeProfitPct),
      maxDrawdownPct: fractionToPercentOrNull(auditedRisk.maxDrawdownPct),
      source: "audit"
    };
  }
  return {
    positionPct: strategyDraft.positionPct,
    stopLossPct: strategyDraft.stopLossPct,
    takeProfitPct: strategyDraft.takeProfitPct,
    maxDrawdownPct: strategyDraft.maxDrawdownPct,
    source: "draft"
  };
}

function fractionToPercentOrNull(value: number | null): number | null {
  return value === null || !Number.isFinite(value) ? null : value * 100;
}

function buildRiskApprovalDataQualityGate(run: ResearchRunSummary): RiskApprovalGate {
  const dataQuality = run.dataQuality;
  if (!dataQuality) {
    return {
      id: "data-quality",
      label: "Data quality",
      value: "Not attached",
      detail: "Audited run metadata did not include data quality; rerun pipeline before paper execution.",
      status: "blocked",
      tone: "risk"
    };
  }

  const source = dataQuality.source.trim();
  const sourceIsTrusted = source !== "" && source !== "unknown" && source !== "demo-fallback";
  const rowsAreReady = Number.isFinite(dataQuality.rows) && dataQuality.rows > 0;
  const isReady = dataQuality.isComplete && sourceIsTrusted && rowsAreReady;

  return {
    id: "data-quality",
    label: "Data quality",
    value: `${source || "unknown"} · ${dataQuality.isComplete ? "complete" : "review"}`,
    detail: isReady
      ? `${dataQuality.rows} rows are approved for paper execution; ${formatWarningCount(dataQuality.warnings.length)}.`
      : `Paper execution requires complete audited market data; current source ${source || "unknown"} is review-only.`,
    status: isReady ? "passed" : "blocked",
    tone: isReady ? (dataQuality.warnings.length === 0 ? "positive" : "warning") : "risk"
  };
}

export function buildPaperTradingRows(workspace: TerminalWorkspace): PaperTradingRow[] {
  if (!workspace.researchRun) {
    return [
      {
        id: "paper-order",
        symbol: workspace.selectedInstrument.symbol,
        side: "BUY",
        quantity: "-",
        price: "-",
        notional: "-",
        status: "blocked",
        reason: "Run Pipeline before staging a paper order.",
        tone: "warning"
      },
      {
        id: "risk-check",
        symbol: workspace.selectedInstrument.symbol,
        side: "RISK",
        quantity: "-",
        price: "-",
        notional: "-",
        status: "blocked",
        reason: "No audited research run is bound; paper route remains blocked.",
        tone: "warning"
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

  const price = resolvePaperOrderPrice(workspace);
  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price, resolvePaperTargetNotional(workspace));
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const notional = quantity * price;
  const approval = buildRiskApprovalSummary(workspace);
  const blockedApprovalGate = approval.gates.find((gate) => gate.status === "blocked");

  if (approval.status === "blocked") {
    return [
      {
        id: "paper-order",
        symbol: workspace.selectedInstrument.symbol,
        side: "BUY",
        quantity: String(quantity),
        price: price.toFixed(2),
        notional: notional.toFixed(2),
        status: "blocked",
        reason: "Risk approval blocked before staging paper execution.",
        tone: "risk"
      },
      {
        id: "risk-check",
        symbol: workspace.selectedInstrument.symbol,
        side: "RISK",
        quantity: "-",
        price: "-",
        notional: "-",
        status: "blocked",
        reason: blockedApprovalGate?.detail ?? "Risk approval blocked before staging paper execution.",
        tone: "risk"
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

  return [
    {
      id: "paper-order",
      symbol: workspace.selectedInstrument.symbol,
      side: "BUY",
      quantity: String(quantity),
      price: price.toFixed(2),
      notional: notional.toFixed(2),
      status: "queued",
      reason: `Paper order staged from ${workspace.strategy.name} using audited run ${workspace.researchRun.runId}; no live route is used.`,
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

export function buildPaperExecutionSummaryTiles(
  workspace: TerminalWorkspace,
  execution: PaperExecutionSnapshot | null | undefined
): PaperExecutionSummaryTile[] {
  if (!execution) {
    const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
    return [
      {
        id: "account-sync",
        label: "Account sync",
        value: "No paper execution",
        detail: "Run Pipeline and submit a paper order to create a local account snapshot.",
        tone: "warning"
      },
      {
        id: "paper-positions",
        label: "Paper positions",
        value: "0 paper / 0 live",
        detail: "No filled paper positions are linked to the active audited run.",
        tone: "neutral"
      },
      {
        id: "risk-gates",
        label: "Risk gates",
        value: workspace.execution.liveEnabled ? "live route enabled" : `${blockedGateCount} live gates blocked`,
        detail: workspace.execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · "),
        tone: workspace.execution.liveEnabled ? "positive" : "warning"
      }
    ];
  }

  const paperPositions = Object.entries(execution.account.positions).filter(([, quantity]) => quantity > 0);
  const passedGates = execution.gates.filter((gate) => gate.passed).length;
  const blockedGates = execution.gates.length - passedGates;
  return [
    {
      id: "account-sync",
      label: "Account sync",
      value: `Cash ${formatAssumptionCurrency(execution.account.cash)} / Equity ${formatAssumptionCurrency(execution.account.equity)}`,
      detail: `Snapshot ${execution.executionId} · ${execution.mode}`,
      tone: "positive"
    },
    {
      id: "paper-positions",
      label: "Paper positions",
      value: `${paperPositions.length} paper / 0 live`,
      detail: paperPositions.length
        ? paperPositions.map(([symbol, quantity]) => `${symbol}: ${formatQuantity(quantity)}`).join(" · ")
        : "No filled paper positions are linked to the active audited run.",
      tone: paperPositions.length ? "positive" : "neutral"
    },
    {
      id: "risk-gates",
      label: "Risk gates",
      value: `${passedGates} passed / ${blockedGates} blocked`,
      detail: execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · "),
      tone: blockedGates ? "warning" : "positive"
    }
  ];
}

export function buildPaperPositionRows(
  workspace: TerminalWorkspace,
  execution?: PaperExecutionSnapshot | null
): PaperPositionRow[] {
  if (execution) {
    const positionRows = Object.entries(execution.account.positions)
      .filter(([, quantity]) => quantity > 0)
      .map(([symbol, quantity]) => {
        const avgCost = averageFilledPrice(execution.orders, symbol);
        const markPrice = resolveExecutionMarkPrice(workspace, execution, symbol, avgCost);
        const marketValue = quantity * markPrice;
        const costBasis = quantity * avgCost;
        const unrealizedPnl = marketValue - costBasis;
        const returnPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
        return {
          id: `paper-position-${symbol}`,
          symbol,
          quantity: formatQuantity(quantity),
          avgCost: avgCost.toFixed(2),
          markPrice: markPrice.toFixed(2),
          marketValue: marketValue.toFixed(2),
          unrealizedPnl: formatSignedCurrency(unrealizedPnl),
          returnPct: formatSignedPct(returnPct),
          status: "paper" as const,
          tone: returnPct > 0 ? ("positive" as const) : returnPct < 0 ? ("warning" as const) : ("neutral" as const)
        };
      });
    if (positionRows.length) {
      return positionRows;
    }
  }

  const price = resolvePaperOrderPrice(workspace);
  if (!workspace.researchRun) {
    return [
      {
        id: "selected-paper-position",
        symbol: workspace.selectedInstrument.symbol,
        quantity: "0",
        avgCost: "-",
        markPrice: price.toFixed(2),
        marketValue: "0.00",
        unrealizedPnl: "-",
        returnPct: "N/A",
        status: "blocked",
        tone: "warning"
      }
    ];
  }

  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price, resolvePaperTargetNotional(workspace));
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

export function buildPromotionReadiness(
  workspace: TerminalWorkspace,
  execution: PaperExecutionSnapshot | null | undefined,
  brokerRows: BrokerAdapterRow[]
): PromotionReadiness {
  const approval = buildRiskApprovalSummary(workspace);
  const activeExecution = workspace.researchRun && execution?.runId === workspace.researchRun.runId ? execution : null;
  const filledOrders = activeExecution?.orders.filter((order) => order.status === "filled") ?? [];
  const paperRiskGate = activeExecution?.gates.find((gate) => gate.id === "paper-risk-check");
  const paperExecutionPassed = filledOrders.length > 0 && paperRiskGate?.passed === true;
  const adapterGatePassed = workspace.execution.gates.find((gate) => gate.id === "adapter-certified")?.passed === true;
  const humanGatePassed = workspace.execution.gates.find((gate) => gate.id === "human-confirmed")?.passed === true;
  const certifiedLiveAdapters = brokerRows.filter((row) => row.route === "live" && row.status === "paper_ready").length;
  const liveAdapterCertified = adapterGatePassed && certifiedLiveAdapters > 0;

  const auditedStage: PromotionQueueStage = workspace.researchRun
    ? {
        id: "audited-run",
        label: "Audited run",
        value: workspace.researchRun.runId,
        detail: `${workspace.researchRun.dataRows} ${workspace.researchRun.timeframe} bars are bound to the promotion queue.`,
        status: "passed",
        tone: "positive"
      }
    : {
        id: "audited-run",
        label: "Audited run",
        value: "No audited run",
        detail: "Run Pipeline before a strategy can enter the promotion queue.",
        status: "blocked",
        tone: "risk"
      };

  const riskStage: PromotionQueueStage = {
    id: "risk-approval",
    label: "Risk approval",
    value:
      approval.status === "live_ready" ? "live approved" : approval.status === "paper_ready" ? "paper approved" : "risk blocked",
    detail: approval.summary,
    status: approval.status === "blocked" ? "blocked" : "passed",
    tone: approval.status === "blocked" ? "risk" : "positive"
  };

  const paperStage: PromotionQueueStage = paperExecutionPassed
    ? {
        id: "paper-execution",
        label: "Paper execution",
        value: filledOrders.length === 1 ? "1 filled order" : `${filledOrders.length} filled orders`,
        detail: `Paper snapshot ${activeExecution?.executionId} passed local risk checks before live promotion.`,
        status: "passed",
        tone: "positive"
      }
    : {
        id: "paper-execution",
        label: "Paper execution",
        value: "No paper fill",
        detail: activeExecution
          ? "Paper execution exists, but a filled order and passing risk check are both required."
          : "Submit a paper order from the active audited run before live promotion review.",
        status: "blocked",
        tone: "warning"
      };

  const adapterStage: PromotionQueueStage = {
    id: "adapter-certification",
    label: "Adapter certification",
    value:
      certifiedLiveAdapters === 1 ? "1 certified live adapter" : `${certifiedLiveAdapters} certified live adapters`,
    detail: liveAdapterCertified
      ? "A certified live adapter is available for the selected market."
      : "Live adapters remain interface-only or configuration-required until certification passes.",
    status: liveAdapterCertified ? "passed" : "blocked",
    tone: liveAdapterCertified ? "positive" : "risk"
  };

  const humanStage: PromotionQueueStage = {
    id: "human-confirmation",
    label: "Human confirmation",
    value: humanGatePassed ? "manual approval recorded" : "manual approval required",
    detail: humanGatePassed
      ? "A human operator confirmed this promotion path."
      : "Live promotion requires explicit human confirmation after adapter certification.",
    status: humanGatePassed ? "passed" : "blocked",
    tone: humanGatePassed ? "positive" : "warning"
  };

  const stages = [auditedStage, riskStage, paperStage, adapterStage, humanStage];
  if (!workspace.researchRun || approval.status === "blocked") {
    return {
      status: "blocked",
      headline: "Promotion queue blocked",
      summary: "A strategy needs audited evidence and risk approval before it can enter execution promotion.",
      stages
    };
  }
  if (!paperExecutionPassed) {
    return {
      status: "paper_pending",
      headline: "Paper execution required",
      summary: "The audited run is risk-approved for paper trading, but no filled paper execution is bound yet.",
      stages
    };
  }
  if (!liveAdapterCertified || !humanGatePassed) {
    return {
      status: "certification_pending",
      headline: "Live promotion pending certification",
      summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
      stages
    };
  }
  return {
    status: "live_ready",
    headline: "Live promotion ready",
    summary: "Audited evidence, paper execution, certified adapter, and human confirmation are all bound.",
    stages
  };
}

export function buildStrategyRuleRows(workspace: TerminalWorkspace): StrategyRuleRow[] {
  const draft = buildStrategyRuleDraft(workspace);
  return [
    {
      id: "entry-rule",
      group: "entry",
      label: "Entry signal",
      condition: workspace.strategy.entry,
      parameter: strategyEntryParameter(workspace.strategy.entry, draft.entryWindow),
      status: isPendingStrategyText(workspace.strategy.entry) ? "pending" : "active",
      tone: isPendingStrategyText(workspace.strategy.entry) ? "warning" : "positive"
    },
    {
      id: "exit-rule",
      group: "exit",
      label: "Exit signal",
      condition: workspace.strategy.exit,
      parameter: strategyExitParameter(workspace.strategy.exit, draft.exitWindow),
      status: isPendingStrategyText(workspace.strategy.exit) ? "pending" : "active",
      tone: "warning"
    },
    {
      id: "position-rule",
      group: "position",
      label: "Position sizing",
      condition: workspace.strategy.position,
      parameter: `${formatPercentValue(draft.positionPct)}% exposure cap`,
      status: isPendingStrategyText(workspace.strategy.position) ? "pending" : "active",
      tone: isPendingStrategyText(workspace.strategy.position) ? "warning" : "neutral"
    },
    {
      id: "risk-rule",
      group: "risk",
      label: "Risk guardrail",
      condition: workspace.strategy.risk,
      parameter: "Stop / take profit / drawdown / execution mode",
      status: "guardrail",
      tone: "risk"
    }
  ];
}

export function buildStrategyReadinessGates(workspace: TerminalWorkspace): StrategyReadinessGate[] {
  const draft = buildStrategyRuleDraft(workspace);
  const schemaIsReady =
    !isPendingStrategyText(workspace.strategy.entry) &&
    !isPendingStrategyText(workspace.strategy.exit) &&
    draft.entryWindow > 0 &&
    draft.exitWindow > 0;
  const riskIsReady =
    !isPendingStrategyText(workspace.strategy.position) &&
    !isPendingStrategyText(workspace.strategy.risk) &&
    draft.positionPct > 0 &&
    draft.stopLossPct > 0 &&
    draft.takeProfitPct > 0 &&
    draft.maxDrawdownPct > 0;
  const auditIsReady = Boolean(workspace.researchRun?.runId);
  const hasBlockedGate = !schemaIsReady || !riskIsReady;

  return [
    schemaIsReady
      ? {
          id: "schema",
          label: "Strategy schema",
          value: `${strategyEntryParameter(workspace.strategy.entry, draft.entryWindow)} / ${strategyExitParameter(
            workspace.strategy.exit,
            draft.exitWindow
          )}`,
          detail: "Entry and exit conditions are structured.",
          status: "passed",
          tone: "positive"
        }
      : {
          id: "schema",
          label: "Strategy schema",
          value: "pending",
          detail: "Structured entry and exit rules are required before audit.",
          status: "blocked",
          tone: "risk"
        },
    riskIsReady
      ? {
          id: "risk",
          label: "Risk controls",
          value: [
            `${formatPercentValue(draft.positionPct)}%`,
            `${formatPercentValue(draft.stopLossPct)}%`,
            `${formatPercentValue(draft.takeProfitPct)}%`,
            `${formatPercentValue(draft.maxDrawdownPct)}%`
          ].join(" / "),
          detail: "Position, stop, take profit, and drawdown guards are parseable.",
          status: "passed",
          tone: "positive"
        }
      : {
          id: "risk",
          label: "Risk controls",
          value: "pending",
          detail: "Position sizing and risk guardrails must be explicit.",
          status: "blocked",
          tone: "risk"
        },
    {
      id: "execution",
      label: "Execution mode",
      value: draft.paperOnly ? "paper only" : "live gated",
      detail: "Live routing stays blocked until adapter, risk, and human gates pass.",
      status: draft.paperOnly ? "passed" : "review",
      tone: draft.paperOnly ? "positive" : "warning"
    },
    auditIsReady
      ? {
          id: "audit",
          label: "Audit evidence",
          value: workspace.researchRun?.runId ?? "bound",
          detail: "This draft is bound to a reproducible audit run.",
          status: "passed",
          tone: "positive"
        }
      : {
          id: "audit",
          label: "Audit evidence",
          value: hasBlockedGate ? "blocked" : "needs run",
          detail: hasBlockedGate
            ? "Fix blocked gates before running an audit pipeline."
            : "Run Pipeline to bind this draft to a reproducible audit run.",
          status: hasBlockedGate ? "blocked" : "review",
          tone: hasBlockedGate ? "risk" : "warning"
        }
  ];
}

export function buildStrategyVersionDiffRows(
  workspace: TerminalWorkspace,
  item: StrategyLibraryDraftItem
): StrategyVersionDiffRow[] {
  const rows: Array<{ id: StrategyVersionDiffRow["id"]; label: string; current: string; saved: string }> = [
    {
      id: "context",
      label: "Context",
      current: strategyContextLabel(
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ),
      saved: strategyContextLabel(item.market, item.symbol, item.timeframe)
    },
    {
      id: "name",
      label: "Name",
      current: workspace.strategy.name,
      saved: item.strategySnapshot.name
    },
    {
      id: "entry",
      label: "Entry",
      current: workspace.strategy.entry,
      saved: item.strategySnapshot.entry
    },
    {
      id: "exit",
      label: "Exit",
      current: workspace.strategy.exit,
      saved: item.strategySnapshot.exit
    },
    {
      id: "position",
      label: "Position",
      current: workspace.strategy.position,
      saved: item.strategySnapshot.position
    },
    {
      id: "risk",
      label: "Risk",
      current: workspace.strategy.risk,
      saved: item.strategySnapshot.risk
    }
  ];

  return rows.map((row) => {
    const changed = normalizeDiffValue(row.current) !== normalizeDiffValue(row.saved);
    return {
      ...row,
      changed,
      tone: changed ? "warning" : "neutral"
    };
  });
}

export function buildStrategyRuleDraft(workspace: TerminalWorkspace): StrategyRuleDraft {
  const strategy = workspace.strategy;
  const entryRsiCondition = inferRsiCondition(strategy.entry);
  const exitRsiCondition = inferRsiCondition(strategy.exit);
  const entryWindow = entryRsiCondition?.window ?? inferSmaWindow(strategy.entry, defaultStrategyRuleDraft.entryWindow);
  const exitWindow = exitRsiCondition?.window ?? inferSmaWindow(strategy.exit, defaultStrategyRuleDraft.exitWindow);

  return {
    name: strategy.name.trim() || defaultStrategyRuleDraft.name,
    entryKind: entryRsiCondition
      ? rsiOperatorToConditionKind(entryRsiCondition.operator)
      : inferSmaConditionKind(strategy.entry, "close_above_sma"),
    entryWindow,
    entryThreshold: entryRsiCondition?.threshold ?? defaultStrategyRuleDraft.entryThreshold,
    exitKind: exitRsiCondition
      ? rsiOperatorToConditionKind(exitRsiCondition.operator)
      : inferSmaConditionKind(strategy.exit, "close_below_sma"),
    exitWindow,
    exitThreshold: exitRsiCondition?.threshold ?? defaultStrategyRuleDraft.exitThreshold,
    positionPct: inferPercent(strategy.position, defaultStrategyRuleDraft.positionPct),
    stopLossPct: inferPercentNearKeywords(strategy.risk, ["stop", "止损"], defaultStrategyRuleDraft.stopLossPct),
    takeProfitPct: inferPercentNearKeywords(
      strategy.risk,
      ["take profit", "take-profit", "止盈"],
      defaultStrategyRuleDraft.takeProfitPct
    ),
    maxDrawdownPct: inferPercentNearKeywords(
      strategy.risk,
      ["drawdown", "回撤"],
      defaultStrategyRuleDraft.maxDrawdownPct
    ),
    paperOnly: !/\blive\b|实盘/u.test(strategy.risk.toLowerCase()) || /paper only|模拟/u.test(strategy.risk.toLowerCase())
  };
}

function strategyContextLabel(market: Market, symbol: string, timeframe: Timeframe): string {
  return `${market.toUpperCase()} · ${symbol} · ${timeframe}`;
}

function normalizeDiffValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function strategySnapshotFromRuleDraft(draft: StrategyRuleDraft): StrategySnapshot {
  const normalizedDraft = normalizeStrategyRuleDraft(draft);
  return {
    name: normalizedDraft.name,
    entry: strategyConditionSnapshotText(
      normalizedDraft.entryKind,
      normalizedDraft.entryWindow,
      normalizedDraft.entryThreshold
    ),
    exit: strategyConditionSnapshotText(normalizedDraft.exitKind, normalizedDraft.exitWindow, normalizedDraft.exitThreshold),
    position: `${formatPercentValue(normalizedDraft.positionPct)}% max capital allocation`,
    risk: [
      `Stop -${formatPercentValue(normalizedDraft.stopLossPct)}%`,
      `take profit +${formatPercentValue(normalizedDraft.takeProfitPct)}%`,
      `drawdown guard ${formatPercentValue(normalizedDraft.maxDrawdownPct)}%`,
      normalizedDraft.paperOnly ? "paper only" : "live gated"
    ].join(", ")
  };
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

export function buildBacktestEvidenceCards(workspace: TerminalWorkspace): BacktestEvidenceCard[] {
  const assumptions = resolveBacktestAssumptions(workspace);
  const diagnostics = workspace.backtestDiagnostics ?? [];
  const firstDiagnostic = diagnostics[0];
  const run = workspace.researchRun;

  return [
    run
      ? {
          id: "run",
          label: "Run package",
          value: run.runId,
          detail: `${run.dataRows} ${run.timeframe} bars · ${run.executionMode}`,
          tone: "positive"
        }
      : {
          id: "run",
          label: "Run package",
          value: "Draft workspace",
          detail: "Run Pipeline to bind a reproducible run id.",
          tone: "warning"
        },
    {
      id: "strategy",
      label: "Strategy revision",
      value: run?.strategyRevision ?? "Local draft",
      detail: workspace.strategy.name,
      tone: run ? "positive" : "warning"
    },
    {
      id: "costs",
      label: "Cost model",
      value: `${assumptions.feeBps} bps / ${assumptions.slippageBps} bps`,
      detail: `Cash ${formatAssumptionCurrency(assumptions.initialCash)}`,
      tone: "neutral"
    },
    {
      id: "diagnostics",
      label: "Diagnostics",
      value: diagnostics.length === 1 ? "1 check" : `${diagnostics.length} checks`,
      detail: firstDiagnostic
        ? `${firstDiagnostic.label}: ${firstDiagnostic.detail}`
        : "No core diagnostics supplied yet.",
      tone: firstDiagnostic?.tone ?? "warning"
    }
  ];
}

export function buildBacktestReadinessGates(workspace: TerminalWorkspace): BacktestReadinessGate[] {
  const assumptions = resolveBacktestAssumptions(workspace);
  const hasAuditedRun = Boolean(workspace.researchRun?.runId);
  const strategyIsParseable =
    !isPendingStrategyText(workspace.strategy.entry) &&
    !isPendingStrategyText(workspace.strategy.exit) &&
    !isPendingStrategyText(workspace.strategy.position) &&
    !isPendingStrategyText(workspace.strategy.risk);

  return [
    hasAuditedRun
      ? {
          id: "data",
          label: "Data snapshot",
          status: "passed",
          detail: `Audited ${workspace.researchRun?.dataRows ?? 0} ${workspace.selectedTimeframe} bars are bound.`,
          tone: "positive"
        }
      : {
          id: "data",
          label: "Data snapshot",
          status: "blocked",
          detail: "Run Pipeline to bind a reproducible OHLCV snapshot.",
          tone: "risk"
        },
    strategyIsParseable
      ? {
          id: "strategy",
          label: "Strategy schema",
          status: "passed",
          detail: `${workspace.strategy.name} is parseable.`,
          tone: "positive"
        }
      : {
          id: "strategy",
          label: "Strategy schema",
          status: "blocked",
          detail: "Complete entry, exit, position, and risk rules before audit.",
          tone: "risk"
        },
    {
      id: "costs",
      label: "Cost model",
      status: "passed",
      detail: `Cash ${formatAssumptionCurrency(assumptions.initialCash)} · fee ${assumptions.feeBps} bps · slippage ${assumptions.slippageBps} bps.`,
      tone: "neutral"
    },
    hasAuditedRun
      ? {
          id: "execution",
          label: "Execution promotion",
          status: "review",
          detail: "Paper execution can be staged; live adapters remain gated.",
          tone: "warning"
        }
      : {
          id: "execution",
          label: "Execution promotion",
          status: "blocked",
          detail: "Paper execution waits for an audited run id.",
          tone: "risk"
        }
  ];
}

export function buildBacktestReport(workspace: TerminalWorkspace): BacktestReport {
  const assumptions = resolveBacktestAssumptions(workspace);
  const assumptionRows = buildBacktestAssumptionRows(workspace);
  const evidenceCards = buildBacktestEvidenceCards(workspace);
  const readinessGates = buildBacktestReadinessGates(workspace);
  const trades = buildBacktestTradeRows(workspace);
  const diagnostics = workspace.backtestDiagnostics ?? [];
  const equityCurve = workspace.backtestEquityCurve ?? [];
  const run = workspace.researchRun;
  const benchmark = buildBacktestBenchmark(workspace);
  const blockedGates = readinessGates.filter((gate) => gate.status === "blocked");
  const aiReviewReady = Boolean(run) && !blockedGates.some((gate) => gate.id === "data" || gate.id === "strategy");
  const executionReady = Boolean(run) && !blockedGates.length;
  const metricTradeCount = metricValue(workspace, "Trades", "0");

  if (!run) {
    return {
      status: "blocked",
      headline: "Backtest report needs an audited run",
      summary: "Run Pipeline to create a reproducible backtest before AI review or execution.",
      runId: null,
      aiReviewReady: false,
      executionReady: false,
      assumptions,
      assumptionRows,
      evidenceCards,
      readinessGates,
      benchmark,
      metrics: workspace.metrics,
      trades,
      diagnostics,
      equityCurve,
      tradeCount: trades.length,
      equityPointCount: equityCurve.length,
      diagnosticCount: diagnostics.length
    };
  }

  return {
    status: aiReviewReady ? "ready" : "blocked",
    headline: `Backtest report bound to ${run.runId}`,
    summary: `${run.dataRows} ${run.timeframe} bars · ${metricTradeCount} trades · ${
      aiReviewReady ? "AI review ready" : "AI review blocked"
    }`,
    runId: run.runId,
    aiReviewReady,
    executionReady,
    assumptions,
    assumptionRows,
    evidenceCards,
    readinessGates,
    benchmark,
    metrics: workspace.metrics,
    trades,
    diagnostics,
    equityCurve,
    tradeCount: trades.length,
    equityPointCount: equityCurve.length,
    diagnosticCount: diagnostics.length
  };
}

export function buildBacktestParameterScanRows(workspace: TerminalWorkspace): BacktestParameterScanRow[] {
  const run = workspace.researchRun;
  const bars = run?.dataSnapshot?.bars
    .filter((bar) => Number.isFinite(bar.close) && bar.close > 0)
    .slice()
    .sort((left, right) => left.timestampMs - right.timestampMs);

  if (!run || !bars || bars.length < 2) {
    return [];
  }

  const draft = buildStrategyRuleDraft(workspace);
  const entryWindows = parameterScanWindows(draft.entryWindow);
  const exitWindows = parameterScanWindows(draft.exitWindow);
  const currentMetricReturn = parsePercentMetric(metricValue(workspace, "Return", "N/A"));
  const currentScan = simulateSmaParameterScan(workspace, bars, draft.entryWindow, draft.exitWindow);
  const currentReturn = currentMetricReturn ?? currentScan.totalReturnPct;

  return entryWindows.flatMap((entryWindow) =>
    exitWindows.map((exitWindow) => {
      const result = simulateSmaParameterScan(workspace, bars, entryWindow, exitWindow);
      const delta = result.totalReturnPct - currentReturn;
      const isCurrent = entryWindow === draft.entryWindow && exitWindow === draft.exitWindow;
      const breachesDrawdown = result.maxDrawdownPct > draft.maxDrawdownPct;
      return {
        id: `scan-entry-${entryWindow}-exit-${exitWindow}`,
        runId: run.runId,
        source: run.dataSnapshot?.hash ?? run.dataSnapshot?.source ?? "audited snapshot",
        condition: `SMA${entryWindow} / SMA${exitWindow}`,
        entryWindow,
        exitWindow,
        returnPct: formatSignedPct(result.totalReturnPct),
        maxDrawdownPct: formatPct(result.maxDrawdownPct),
        tradeCount: result.tradeCount,
        alphaVsCurrent: formatSignedPointDelta(delta),
        status: isCurrent ? "current" : "candidate",
        tone: isCurrent ? "neutral" : breachesDrawdown ? "risk" : delta >= 0 ? "positive" : "warning",
        dataRows: bars.length
      };
    })
  );
}

export function buildBacktestReportMarkdown(workspace: TerminalWorkspace): string | null {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const report = buildBacktestReport(workspace);
  const aiDossier = buildAiReviewDossier(workspace);
  const snapshot = run.dataSnapshot;
  const researchNote = normalizedResearchNote(run.researchNote);
  const metricRows = report.metrics.map((metric) => [metric.label, metric.value, metric.tone]);
  const benchmarkRows = [
    ["Strategy", report.benchmark.strategyReturn],
    ["Benchmark buy and hold", report.benchmark.benchmarkReturn],
    ["Alpha", report.benchmark.alpha]
  ];
  const assumptionRows = report.assumptionRows.map((row) => [row.label, `${row.value} ${row.suffix}`]);
  const parameterScanRows = buildBacktestParameterScanRows(workspace).map((row) => [
    row.entryWindow,
    row.exitWindow,
    row.returnPct,
    row.maxDrawdownPct,
    row.tradeCount,
    row.alphaVsCurrent,
    row.status
  ]);
  const gateRows = report.readinessGates.map((gate) => [gate.label, gate.status, gate.detail]);
  const aiCitationRows = aiDossier.citations.map((citation) => [
    citation.label,
    citation.value,
    citation.detail
  ]);
  const tradeRows = report.trades.map((trade) => [
    trade.timestamp,
    trade.side,
    trade.status,
    trade.price,
    trade.quantity,
    trade.pnl,
    trade.reason
  ]);

  return [
    "# AIQuant Audited Backtest Report",
    "",
    `Run ID: \`${run.runId}\``,
    `Market: \`${workspace.selectedInstrument.market}\``,
    `Symbol: \`${workspace.selectedInstrument.symbol}\``,
    `Timeframe: \`${run.timeframe}\``,
    `Strategy revision: \`${run.strategyRevision}\``,
    `Execution mode: \`${run.executionMode}\``,
    "",
    "## Summary",
    "",
    report.summary,
    "",
    "## Metrics",
    "",
    markdownTable(["Metric", "Value", "Tone"], metricRows),
    "",
    "## Benchmark",
    "",
    report.benchmark.detail,
    "",
    markdownTable(["Item", "Value"], benchmarkRows),
    "",
    "## Data Snapshot",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Source", snapshot?.source ?? "missing"],
        ["Rows", String(snapshot?.rows ?? run.dataRows)],
        ["Hash", snapshot?.hash ?? ""],
        ["Window", `${snapshot?.start ?? "unknown"} -> ${snapshot?.end ?? "unknown"}`],
        ["Quality", run.dataQuality ? `${run.dataQuality.source} · ${run.dataQuality.isComplete ? "complete" : "incomplete"}` : "not attached"]
      ]
    ),
    "",
    "## Backtest Assumptions",
    "",
    markdownTable(["Assumption", "Value"], assumptionRows),
    "",
    "## Parameter Sensitivity",
    "",
    parameterScanRows.length
      ? markdownTable(["Entry SMA", "Exit SMA", "Return", "Max drawdown", "Trades", "Delta", "Status"], parameterScanRows)
      : "Parameter sensitivity requires an audited data snapshot.",
    "",
    "## AI Evidence Boundary",
    "",
    "No investment advice. AI can explain supplied audited evidence only and must not promise returns.",
    "",
    markdownTable(["Citation", "Value", "Evidence"], aiCitationRows),
    "",
    researchNote ? "## Locked Research Note" : "",
    researchNote ? "" : "",
    researchNote ? researchNote.body : "",
    researchNote ? "" : "",
    "## Readiness Gates",
    "",
    markdownTable(["Gate", "Status", "Detail"], gateRows),
    "",
    "## Trade Replay",
    "",
    tradeRows.length
      ? markdownTable(["Time", "Side", "Status", "Price", "Quantity", "PnL", "Reason"], tradeRows)
      : "No trade rows are attached to this audited run.",
    "",
    "## Execution Boundary",
    "",
    report.executionReady
      ? "Paper execution handoff is ready. Live execution still requires certified adapters, risk approval, and human confirmation."
      : "Execution remains blocked until all readiness gates pass."
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trimEnd()
    .concat("\n");
}

export function buildBacktestBenchmark(workspace: TerminalWorkspace): BacktestBenchmark {
  const run = workspace.researchRun;
  const snapshot = run?.dataSnapshot;
  const bars = snapshot?.bars.filter((bar) => Number.isFinite(bar.close) && bar.close > 0) ?? [];
  const strategyReturn = parsePercentMetric(metricValue(workspace, "Return", "N/A"));
  const formattedStrategyReturn = strategyReturn === null ? "N/A" : formatSignedPct(strategyReturn);

  if (!run || bars.length < 2) {
    return {
      label: "Buy and hold",
      symbol: workspace.selectedInstrument.symbol,
      strategyReturn: formattedStrategyReturn,
      benchmarkReturn: "Pending snapshot",
      alpha: "N/A",
      detail: "Run Pipeline must include a data snapshot before benchmark comparison.",
      tone: "warning",
      sampleBars: 0,
      source: snapshot?.source ?? "missing snapshot"
    };
  }

  const firstClose = bars[0].close;
  const lastClose = bars[bars.length - 1].close;
  const benchmarkReturn = ((lastClose - firstClose) / firstClose) * 100;
  const alpha = strategyReturn === null ? null : strategyReturn - benchmarkReturn;
  const tone = alpha === null ? "neutral" : alpha >= 0 ? "positive" : "warning";

  return {
    label: "Buy and hold",
    symbol: workspace.selectedInstrument.symbol,
    strategyReturn: formattedStrategyReturn,
    benchmarkReturn: formatSignedPct(benchmarkReturn),
    alpha: alpha === null ? "N/A" : formatSignedPointDelta(alpha),
    detail: `${bars.length} audited bars from ${snapshot?.source ?? "unknown"} · ${bars[0].timestamp} to ${
      bars[bars.length - 1].timestamp
    }.`,
    tone,
    sampleBars: bars.length,
    source: snapshot?.source ?? "unknown"
  };
}

function parameterScanWindows(currentWindow: number): number[] {
  return Array.from(
    new Set([currentWindow - 5, currentWindow, currentWindow + 5].map((window) => normalizeStrategyWindow(window)))
  ).sort((left, right) => left - right);
}

function simulateSmaParameterScan(
  workspace: TerminalWorkspace,
  bars: ResearchRunDataSnapshotBar[],
  entryWindow: number,
  exitWindow: number
): { totalReturnPct: number; maxDrawdownPct: number; tradeCount: number } {
  const assumptions = resolveBacktestAssumptions(workspace);
  const draft = buildStrategyRuleDraft(workspace);
  const feeRate = assumptions.feeBps / 10_000;
  const slippageRate = assumptions.slippageBps / 10_000;
  const positionPct = Math.max(0, Math.min(draft.positionPct / 100, 1));
  const stopLossPct = draft.stopLossPct / 100;
  const takeProfitPct = draft.takeProfitPct / 100;
  const closes = bars.map((bar) => bar.close);
  let cash = assumptions.initialCash;
  let quantity = 0;
  let entryPrice = 0;
  let tradeCount = 0;
  const equityValues: number[] = [];

  bars.forEach((bar, index) => {
    if (quantity <= 0 && closeAboveSma(closes, index, entryWindow)) {
      const budget = cash * positionPct;
      const executionPrice = bar.close * (1 + slippageRate);
      const nextQuantity = executionPrice > 0 ? budget / executionPrice : 0;
      const fee = budget * feeRate;
      if (nextQuantity > 0 && budget + fee <= cash) {
        cash -= budget + fee;
        quantity = nextQuantity;
        entryPrice = executionPrice;
        tradeCount += 1;
      }
    } else if (quantity > 0) {
      const shouldExit =
        bar.close <= entryPrice * (1 - stopLossPct) ||
        bar.close >= entryPrice * (1 + takeProfitPct) ||
        closeBelowSma(closes, index, exitWindow);
      if (shouldExit) {
        const executionPrice = bar.close * (1 - slippageRate);
        const gross = quantity * executionPrice;
        cash += gross - gross * feeRate;
        quantity = 0;
        entryPrice = 0;
        tradeCount += 1;
      }
    }

    equityValues.push(cash + quantity * bar.close);
  });

  if (quantity > 0) {
    const lastClose = bars[bars.length - 1].close;
    const executionPrice = lastClose * (1 - slippageRate);
    const gross = quantity * executionPrice;
    cash += gross - gross * feeRate;
    quantity = 0;
    tradeCount += 1;
    equityValues[equityValues.length - 1] = cash;
  }

  return {
    totalReturnPct: ((cash / assumptions.initialCash) - 1) * 100,
    maxDrawdownPct: maxDrawdownFromEquity(equityValues),
    tradeCount
  };
}

function closeAboveSma(closes: number[], index: number, window: number): boolean {
  const average = smaAt(closes, index, window);
  return average !== null && closes[index] > average;
}

function closeBelowSma(closes: number[], index: number, window: number): boolean {
  const average = smaAt(closes, index, window);
  return average !== null && closes[index] < average;
}

function smaAt(values: number[], index: number, window: number): number | null {
  if (window <= 0 || index + 1 < window) {
    return null;
  }
  const slice = values.slice(index + 1 - window, index + 1);
  return slice.reduce((sum, value) => sum + value, 0) / window;
}

function maxDrawdownFromEquity(equityValues: number[]): number {
  if (!equityValues.length) {
    return 0;
  }
  let peak = equityValues[0];
  let maxDrawdown = 0;
  equityValues.forEach((equity) => {
    peak = Math.max(peak, equity);
    if (peak > 0) {
      maxDrawdown = Math.max(maxDrawdown, ((peak - equity) / peak) * 100);
    }
  });
  return maxDrawdown;
}

function markdownTable(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  return [
    `| ${headers.map(markdownCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`)
  ].join("\n");
}

function markdownCell(value: string | number | boolean | null | undefined): string {
  return String(value ?? "")
    .replace(/\r?\n+/gu, " ")
    .replace(/\|/gu, "\\|")
    .trim();
}

function aiBenchmarkDetail(benchmark: BacktestBenchmark): string {
  if (benchmark.sampleBars <= 0 || benchmark.benchmarkReturn === "Pending snapshot") {
    return "Benchmark comparison waits for an audited data snapshot.";
  }
  return `Strategy ${benchmark.strategyReturn} vs buy-and-hold ${benchmark.benchmarkReturn} over ${benchmark.sampleBars} audited bars.`;
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

function inferSmaConditionKind(text: string, fallback: StrategyConditionKind): StrategyConditionKind {
  const normalized = text.toLowerCase();
  if (normalized.includes("below") || text.includes("<")) {
    return "close_below_sma";
  }
  if (normalized.includes("above") || text.includes(">")) {
    return "close_above_sma";
  }
  return fallback;
}

function inferSmaWindow(text: string, fallback: number): number {
  const match = text.match(/sma\s*(\d+)/iu) ?? text.match(/window\s*=\s*(\d+)/iu);
  return normalizeStrategyWindow(match ? Number(match[1]) : fallback);
}

function rsiOperatorToConditionKind(operator: "<" | ">"): StrategyConditionKind {
  return operator === "<" ? "rsi_below" : "rsi_above";
}

function inferPercent(text: string, fallback: number): number {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/u);
  return normalizeStrategyPercent(match ? Number(match[1]) : fallback, fallback);
}

function inferPercentNearKeywords(text: string, keywords: string[], fallback: number): number {
  const normalized = text.toLowerCase();
  for (const match of normalized.matchAll(/([+-]?\d+(?:\.\d+)?)\s*%/gu)) {
    const index = match.index ?? 0;
    const prefix = normalized.slice(Math.max(0, index - 36), index);
    if (keywords.some((keyword) => prefix.includes(keyword))) {
      return normalizeStrategyPercent(Math.abs(Number(match[1])), fallback);
    }
  }
  return normalizeStrategyPercent(fallback, fallback);
}

function normalizeStrategyRuleDraft(draft: StrategyRuleDraft): StrategyRuleDraft {
  return {
    name: draft.name.trim() || defaultStrategyRuleDraft.name,
    entryKind: normalizeStrategyConditionKind(draft.entryKind, defaultStrategyRuleDraft.entryKind),
    entryWindow: normalizeStrategyWindow(draft.entryWindow),
    entryThreshold: normalizeStrategyThreshold(draft.entryThreshold, defaultStrategyRuleDraft.entryThreshold),
    exitKind: normalizeStrategyConditionKind(draft.exitKind, defaultStrategyRuleDraft.exitKind),
    exitWindow: normalizeStrategyWindow(draft.exitWindow),
    exitThreshold: normalizeStrategyThreshold(draft.exitThreshold, defaultStrategyRuleDraft.exitThreshold),
    positionPct: normalizeStrategyPercent(draft.positionPct, defaultStrategyRuleDraft.positionPct),
    stopLossPct: normalizeStrategyPercent(draft.stopLossPct, defaultStrategyRuleDraft.stopLossPct),
    takeProfitPct: normalizeStrategyPercent(draft.takeProfitPct, defaultStrategyRuleDraft.takeProfitPct),
    maxDrawdownPct: normalizeStrategyPercent(draft.maxDrawdownPct, defaultStrategyRuleDraft.maxDrawdownPct),
    paperOnly: draft.paperOnly
  };
}

function normalizeStrategyConditionKind(kind: StrategyConditionKind, fallback: StrategyConditionKind): StrategyConditionKind {
  return ["close_above_sma", "close_below_sma", "rsi_below", "rsi_above"].includes(kind) ? kind : fallback;
}

function normalizeStrategyWindow(value: number): number {
  if (!Number.isFinite(value)) {
    return defaultStrategyRuleDraft.entryWindow;
  }
  return Math.max(1, Math.min(Math.round(value), 250));
}

function normalizeStrategyThreshold(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(Number(value.toFixed(2)), 100));
}

function normalizeStrategyPercent(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(Number(value.toFixed(2)), 100));
}

function strategyConditionSnapshotText(kind: StrategyConditionKind, window: number, threshold: number): string {
  if (kind === "close_below_sma") {
    return `Close < SMA${window}`;
  }
  if (kind === "rsi_below") {
    return `RSI${window} < ${formatConditionNumber(threshold)}`;
  }
  if (kind === "rsi_above") {
    return `RSI${window} > ${formatConditionNumber(threshold)}`;
  }
  return `Close > SMA${window}`;
}

function formatPercentValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
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

function formatWarningCount(count: number): string {
  return count === 1 ? "1 warning" : `${count} warnings`;
}

function parsePercentMetric(value: string): number | null {
  const normalized = value.trim().replace("%", "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/0+$/u, "").replace(/\.$/u, "");
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

function resolvePaperTargetNotional(workspace: TerminalWorkspace): number {
  const strategyDraft = buildStrategyRuleDraft(workspace);
  const approvalRisk = buildRiskApprovalRisk(workspace, strategyDraft);
  const assumptions = resolveBacktestAssumptions(workspace);
  const positionPct =
    approvalRisk.positionPct !== null && approvalRisk.positionPct > 0
      ? approvalRisk.positionPct / 100
      : strategyDraft.positionPct / 100;
  return Math.max(1, Math.min(assumptions.initialCash * positionPct, 20_000));
}

function calculatePaperQuantity(market: Market, price: number, targetNotional = 20_000): number {
  const rawQuantity = Math.max(1, Math.floor(targetNotional / price));
  if (market === "ashare") {
    return Math.max(100, Math.floor(rawQuantity / 100) * 100);
  }
  if (market === "crypto") {
    return Math.max(1, Math.floor(rawQuantity));
  }
  return rawQuantity;
}

function averageFilledPrice(orders: PaperExecutionSnapshotOrder[], symbol: string): number {
  const filledOrders = orders.filter((order) => order.symbol === symbol && order.status === "filled" && order.quantity > 0);
  const totalQuantity = filledOrders.reduce((sum, order) => sum + order.quantity, 0);
  if (totalQuantity <= 0) {
    return 0;
  }
  return filledOrders.reduce((sum, order) => sum + order.quantity * order.price, 0) / totalQuantity;
}

function resolveExecutionMarkPrice(
  workspace: TerminalWorkspace,
  execution: PaperExecutionSnapshot,
  symbol: string,
  fallback: number
): number {
  if (workspace.selectedInstrument.symbol === symbol) {
    const selectedPrice = workspace.selectedInstrument.price;
    if (typeof selectedPrice === "number" && Number.isFinite(selectedPrice) && selectedPrice > 0) {
      return selectedPrice;
    }
  }
  const latestOrder = [...execution.orders]
    .reverse()
    .find((order) => order.symbol === symbol && order.status === "filled" && order.price > 0);
  return latestOrder?.price ?? fallback;
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
    const previousRunId = workspace.researchRun?.runId;
    const note = previousRunId
      ? `Strategy draft generated for ${workspace.selectedInstrument.symbol} from ${previousRunId}. Run Pipeline to audit the new rules before backtest or paper execution.`
      : `Strategy draft generated for ${workspace.selectedInstrument.symbol}. Run Pipeline to audit the new rules before backtest or paper execution.`;
    return clearAuditedResearchResults(
      {
        ...workspace,
        strategy: {
          name: `${workspace.selectedInstrument.symbol} ${workspace.selectedTimeframe} AI draft`,
          entry: `Close above SMA20 with volume confirmation after ${workspace.selectedTimeframe} research context`,
          exit: "Close below trend support or risk manager downgrade",
          position: isPendingStrategyText(workspace.strategy.position)
            ? "20% cap per instrument until audited sizing is rerun"
            : workspace.strategy.position,
          risk: isPendingStrategyText(workspace.strategy.risk)
            ? "Paper only; require adapter certification, risk approval, and human confirmation"
            : workspace.strategy.risk
        },
        decisionLog: [
          {
            agent: "Strategy Drafter",
            message: note,
            tone: "warning"
          },
          ...workspace.decisionLog
        ]
      },
      "strategy"
    );
  }

  if (!workspace.researchRun) {
    const actionLabel = action === "explain" ? "explanation" : "debate";
    return {
      ...workspace,
      decisionLog: [
        {
          agent: "AI Review Gate",
          message: `AI ${actionLabel} blocked for ${workspace.selectedInstrument.symbol}: run Pipeline to create an audited backtest first.`,
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
    const benchmark = buildBacktestBenchmark(workspace);
    const benchmarkClause =
      benchmark.sampleBars > 0 && benchmark.benchmarkReturn !== "Pending snapshot"
        ? `, benchmark ${benchmark.benchmarkReturn}, alpha ${benchmark.alpha}`
        : "";
    return {
      ...workspace,
      decisionLog: [
        {
          agent: "AI Summary",
          message: `Backtest explanation for ${workspace.selectedInstrument.symbol} using audited run ${workspace.researchRun.runId}: return ${returnMetric}${benchmarkClause}, max drawdown ${drawdownMetric}, trades ${tradeMetric}; no guaranteed outcome.`,
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
        message: `Debate generated for ${workspace.selectedInstrument.symbol} using audited run ${workspace.researchRun.runId}: bull case requires momentum confirmation; bear case flags drawdown and data quality.`,
        tone: "ai"
      },
      ...workspace.decisionLog
    ]
  };
}

export function buildAiActionWorkflowState(workspace: TerminalWorkspace, action: AiWorkbenchAction): WorkflowRunState {
  const context = `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`;
  if (action === "strategy-draft") {
    return {
      activeStageId: "factor",
      completedStageIds: ["data"],
      log: [
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-data`,
          stageId: "data",
          level: "success",
          message: `Research context selected: ${context}`
        },
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-factor`,
          stageId: "factor",
          level: "warning",
          message: `Strategy draft staged: ${workspace.strategy.name}; audit required before backtest.`
        }
      ]
    };
  }

  const returnMetric = metricValue(workspace, "Return", "N/A");
  const drawdownMetric = metricValue(workspace, "Max DD", "N/A");
  const benchmark = buildBacktestBenchmark(workspace);
  if (!workspace.researchRun) {
    const actionLabel = action === "explain" ? "explanation" : "debate";
    const blockedMessage = `AI ${actionLabel} blocked for ${workspace.selectedInstrument.symbol}: run Pipeline to create an audited backtest first.`;
    return {
      activeStageId: "backtest",
      completedStageIds: ["data", "factor"],
      log: [
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-data`,
          stageId: "data",
          level: "success",
          message: `Research context selected: ${context}`
        },
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-factor`,
          stageId: "factor",
          level: "success",
          message: `Strategy context selected: ${workspace.strategy.name}`
        },
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-backtest`,
          stageId: "backtest",
          level: "warning",
          message: "Audited backtest is missing; run Pipeline before AI review."
        },
        {
          id: `ai-action-${workspace.selectedInstrument.symbol}-agent`,
          stageId: "agent",
          level: "warning",
          message: blockedMessage
        }
      ]
    };
  }

  const actionMessage =
    action === "explain"
      ? `AI explanation generated for ${workspace.selectedInstrument.symbol} using audited run ${
          workspace.researchRun.runId
        }: return ${returnMetric}${
          benchmark.sampleBars > 0 && benchmark.benchmarkReturn !== "Pending snapshot"
            ? `, benchmark ${benchmark.benchmarkReturn}, alpha ${benchmark.alpha}`
            : ""
        }, max drawdown ${drawdownMetric}; no guaranteed outcome.`
      : `AI debate generated for ${workspace.selectedInstrument.symbol} using audited run ${workspace.researchRun.runId}; bull, bear, and risk notes updated.`;

  return {
    activeStageId: "agent",
    completedStageIds: ["data", "factor", "backtest"],
    log: [
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-data`,
        stageId: "data",
        level: workspace.researchRun ? "success" : "warning",
        message: workspace.researchRun
          ? `Research context bound to ${workspace.researchRun.runId}: ${context}`
          : `Research context selected without an audited run: ${context}`
      },
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-backtest`,
        stageId: "backtest",
        level: workspace.researchRun ? "success" : "warning",
        message: workspace.researchRun
          ? `Backtest evidence available: ${workspace.researchRun.dataRows} bars`
          : "Backtest evidence is local workspace state; run Pipeline for an audited snapshot."
      },
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-agent`,
        stageId: "agent",
        level: "success",
        message: actionMessage
      }
    ]
  };
}

function clearAuditedResearchResults(
  workspace: TerminalWorkspace,
  activeStepId = activeQuantLoopStepId(workspace)
): TerminalWorkspace {
  return {
    ...workspace,
    quantLoop: buildPrimaryQuantLoopSteps(activeStepId, false),
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    backtestTrades: [],
    backtestEquityCurve: [],
    backtestDiagnostics: [],
    researchRun: null
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

export function researchRunEvidenceLogLabel(summary: ResearchRunSummary | null | undefined): string {
  if (!summary) {
    return "Audited backtest received";
  }
  const dataQuality = summary.dataQuality
    ? `${summary.dataQuality.source} ${summary.dataQuality.isComplete ? "complete" : "review"} · ${formatWarningCount(summary.dataQuality.warnings.length)}`
    : "data quality not attached";
  return `Audited backtest received: ${summary.dataRows} ${summary.timeframe} bars · ${dataQuality} · strategy ${summary.strategyRevision} · ${summary.executionMode}`;
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
  const researchRun: ResearchRunSummary = {
    runId: run.runId,
    createdAt: run.createdAt,
    timeframe: run.timeframe,
    strategyRevision: run.strategyRevision,
    dataRows: run.dataRows,
    executionMode: run.executionMode,
    dataQuality: run.dataQuality,
    dataSnapshot: run.dataSnapshot,
    researchNote: run.researchNote,
    strategyConfig: run.strategyConfig
  };
  return {
    ...currentWorkspace,
    selectedInstrument: instrument,
    selectedTimeframe: run.timeframe,
    quantLoop: buildPrimaryQuantLoopSteps(activeQuantLoopStepId(currentWorkspace), true),
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
    decisionLog: decisionLogFromAudit(run),
    backtestTrades: run.backtestTrades ?? [],
    backtestEquityCurve: run.backtestEquityCurve ?? [],
    backtestDiagnostics: run.backtestDiagnostics ?? [],
    researchRun
  };
}

function decisionLogFromAudit(run: ResearchRunAudit): DecisionLogEntry[] {
  if (run.decisions.length) {
    return run.decisions;
  }
  const report = run.aiReport;
  if (!report) {
    return [{ agent: "Audit", message: "No decision entries recorded for this run.", tone: "warning" }];
  }

  const entries: DecisionLogEntry[] = [];
  if (report.summary.trim()) {
    entries.push({ agent: "AI Summary", message: report.summary, tone: "ai" });
  }
  report.risks
    .filter((risk) => risk.trim())
    .forEach((risk) => entries.push({ agent: "Risk Manager", message: risk, tone: "risk" }));
  report.improvements
    .filter((improvement) => improvement.trim())
    .forEach((improvement) => entries.push({ agent: "Portfolio Manager", message: improvement, tone: "warning" }));
  if (report.disclaimer.trim()) {
    entries.push({ agent: "AI Boundary", message: report.disclaimer, tone: "ai" });
  }

  return entries.length ? entries : [{ agent: "Audit", message: "No decision entries recorded for this run.", tone: "warning" }];
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
  const window = Number(condition.params["window"]);
  if (condition.kind === "close_above_sma" && Number.isFinite(window)) {
    return `Close > SMA${window}`;
  }
  if (condition.kind === "close_below_sma" && Number.isFinite(window)) {
    return `Close < SMA${window}`;
  }
  if (condition.kind === "volume_above_sma" && Number.isFinite(window)) {
    return `Volume > VOL${window}`;
  }
  if ((condition.kind === "rsi_below" || condition.kind === "rsi_above") && Number.isFinite(window)) {
    const threshold = Number(condition.params["threshold"]);
    if (Number.isFinite(threshold)) {
      return `RSI${window} ${condition.kind === "rsi_below" ? "<" : ">"} ${formatConditionNumber(threshold)}`;
    }
  }
  const params = Object.entries(condition.params)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(", ");
  return params ? `${condition.kind}(${params})` : condition.kind;
}

function strategyEntryParameter(text: string, entryWindow: number): string {
  return strategyConditionParameter(text, entryWindow);
}

function strategyExitParameter(text: string, exitWindow: number): string {
  return strategyConditionParameter(text, exitWindow);
}

function strategyConditionParameter(text: string, smaWindow: number): string {
  const parts: string[] = [];
  if (hasSmaConditionText(text) || !hasKnownIndicatorText(text)) {
    parts.push(`SMA${smaWindow}`);
  }
  const rsiCondition = inferRsiCondition(text);
  if (rsiCondition) {
    parts.push(`RSI${rsiCondition.window}${rsiCondition.operator}${formatConditionNumber(rsiCondition.threshold)}`);
  }
  const volumeWindow = inferVolumeWindow(text);
  if (volumeWindow !== null) {
    parts.push(`VOL${volumeWindow}`);
  }
  return parts.join(" / ");
}

function hasKnownIndicatorText(text: string): boolean {
  return hasSmaConditionText(text) || inferRsiCondition(text) !== null || inferVolumeWindow(text) !== null;
}

function hasSmaConditionText(text: string): boolean {
  const normalized = text.toLowerCase();
  const smaIndex = normalized.search(/sma\s*\d*/u);
  if (smaIndex < 0) {
    return false;
  }
  if (/(?:close|price|收盘价|收盘)\s*(?:<=|>=|<|>|above|below|over|under|高于|大于|低于|小于)\s*sma\s*\d*/u.test(normalized)) {
    return true;
  }
  if (normalized.includes("rsi") || normalized.includes("相对强弱")) {
    return false;
  }
  const volumeIndexCandidates = [normalized.indexOf("volume"), normalized.indexOf("vol"), normalized.indexOf("成交量")].filter(
    (index) => index >= 0
  );
  const firstVolumeIndex = volumeIndexCandidates.length ? Math.min(...volumeIndexCandidates) : -1;
  return firstVolumeIndex < 0 || firstVolumeIndex > smaIndex;
}

function inferRsiCondition(text: string): { window: number; operator: "<" | ">"; threshold: number } | null {
  const normalized = text.toLowerCase();
  if (!normalized.includes("rsi") && !normalized.includes("相对强弱")) {
    return null;
  }
  const windowMatch = normalized.match(/rsi\s*(\d+)/u);
  const window = normalizeStrategyWindow(windowMatch ? Number(windowMatch[1]) : 14);
  const belowMatch = normalized.match(/rsi\s*\d*\s*(?:<=|<|below|under|低于|小于)\s*(\d+(?:\.\d+)?)/u);
  if (belowMatch) {
    return { window, operator: "<", threshold: Number(belowMatch[1]) };
  }
  const aboveMatch = normalized.match(/rsi\s*\d*\s*(?:>=|>|above|over|高于|大于)\s*(\d+(?:\.\d+)?)/u);
  if (aboveMatch) {
    return { window, operator: ">", threshold: Number(aboveMatch[1]) };
  }
  if (normalized.includes("rebound") || normalized.includes("反弹") || normalized.includes("超卖")) {
    return { window, operator: "<", threshold: 30 };
  }
  return null;
}

function inferVolumeWindow(text: string): number | null {
  const normalized = text.toLowerCase();
  if (!normalized.includes("volume") && !normalized.includes("vol") && !normalized.includes("成交量")) {
    return null;
  }
  const match = normalized.match(/(?:volume|vol|成交量).*?(?:sma|ma|均线|vol)\s*(\d+)/u);
  return match ? normalizeStrategyWindow(Number(match[1])) : 20;
}

function formatConditionNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
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

export function workspaceWithStrategyLibraryItem(
  currentWorkspace: TerminalWorkspace,
  item: StrategyLibraryDraftItem
): TerminalWorkspace {
  const existingInstrument = currentWorkspace.watchlist.find(
    (candidate) => candidate.market === item.market && candidate.symbol === item.symbol
  );
  const selectedInstrument: Instrument = existingInstrument ?? {
    market: item.market,
    symbol: item.symbol,
    name: item.name || item.symbol,
    changePct: 0
  };
  const watchlist = [
    selectedInstrument,
    ...currentWorkspace.watchlist.filter(
      (candidate) => candidate.market !== item.market || candidate.symbol !== item.symbol
    )
  ].slice(0, 8);
  const auditDetail = item.auditRunId
    ? `Archived audit run ${item.auditRunId} remains read-only; `
    : "";
  const note: DecisionLogEntry = {
    agent: "Strategy Library",
    message: `Strategy revision ${item.revision} loaded for ${item.symbol} ${item.timeframe}. ${auditDetail}Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Library"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;

  return clearAuditedResearchResults(
    {
      ...currentWorkspace,
      selectedInstrument,
      selectedTimeframe: item.timeframe,
      watchlist,
      strategy: item.strategySnapshot,
      decisionLog: [note, ...existingLog]
    },
    "strategy"
  );
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
    quantLoop: buildPrimaryQuantLoopSteps("strategy", false),
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

export function workspaceWithStrategyRuleDraftField(
  currentWorkspace: TerminalWorkspace,
  field: StrategyRuleDraftField,
  value: number | string
): TerminalWorkspace {
  const currentDraft = buildStrategyRuleDraft(currentWorkspace);
  const nextDraft = normalizeStrategyRuleDraft({
    ...currentDraft,
    [field]: field === "name" || field === "entryKind" || field === "exitKind" ? String(value) : Number(value)
  });
  const nextStrategy = strategySnapshotFromRuleDraft(nextDraft);
  const note: DecisionLogEntry = {
    agent: "Strategy Builder",
    message: `Structured strategy field ${field} updated locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Builder"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;

  return {
    ...clearAuditedResearchResults(
      {
        ...currentWorkspace,
        strategy: nextStrategy,
        decisionLog: [note, ...existingLog]
      },
      "strategy"
    )
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
    quantLoop: buildPrimaryQuantLoopSteps("backtest", false),
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

export function workspaceWithBacktestParameterCandidate(
  currentWorkspace: TerminalWorkspace,
  candidateId: string
): TerminalWorkspace {
  const candidate = buildBacktestParameterScanRows(currentWorkspace).find((row) => row.id === candidateId);
  if (!candidate || candidate.status === "current") {
    return currentWorkspace;
  }

  const currentDraft = buildStrategyRuleDraft(currentWorkspace);
  const nextStrategy = strategySnapshotFromRuleDraft({
    ...currentDraft,
    entryWindow: candidate.entryWindow,
    exitWindow: candidate.exitWindow
  });
  const note: DecisionLogEntry = {
    agent: "Backtest Lab",
    message: `Parameter candidate ${candidate.condition} staged from run ${candidate.runId}. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Backtest Lab"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;

  return {
    ...clearAuditedResearchResults(
      {
        ...currentWorkspace,
        strategy: nextStrategy,
        decisionLog: [note, ...existingLog]
      },
      "strategy"
    )
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
    quantLoop: buildPrimaryQuantLoopSteps(
      activeQuantLoopStepId(currentWorkspace),
      Boolean(currentWorkspace.researchRun)
    ),
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
    quantLoop: buildPrimaryQuantLoopSteps("research", false),
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
