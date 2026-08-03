import type { WorkflowNode } from "../audit/execution-contracts";
import type { DecisionLogEntry } from "../portfolio/paper-contracts";
import type { ResearchRunDataSnapshot, ResearchRunStrategyConfig, StrategyExperimentDimension, StrategyExperimentGuardrails, StrategyExperimentHoldoutStatus, StrategyExperimentMetricSet, StrategyExperimentParameterPatch, StrategyExperimentWalkForward } from "../research/workspace-contracts";
import type { ResearchRunDataQuality, ResearchRunNote, ResearchRunSummary } from "../stage1/archive-contracts";
import type { GoldenPathRunbookPreviewItem, GoldenPathRunbookSource, GoldenPathWorkspaceContext, GoldenPathWorkspaceContextSource, Market, ProductDevelopmentStage, ProductWorkArea, QuantLoopStep, ResearchWorkspaceStateSnapshot, TerminalModule, Timeframe } from "../stage1/foundation-contracts";
import { productWorkAreaStatus } from "../stage1/platform-readiness";
import type { AgentRole, BacktestAssumptionField, BacktestAssumptions, BacktestDiagnostic, BacktestEquityPoint, BacktestMetric, BacktestTradeRow, ExecutionState, Instrument, QuantLoopNavigationTarget, StrategyRuleDraft, StrategySnapshot, StrategyTemplateOption, TerminalPanel } from "../stage1/review-contracts";

export type StrategyExperimentCreateRequest =
  | {
      strategyRevision: string;
      sourceRunId: string;
      assumptions: BacktestAssumptions;
      dimensions: StrategyExperimentDimension[];
      guardrails: StrategyExperimentGuardrails;
      walkForward: StrategyExperimentWalkForward | null;
    }
  | { replayOfExperimentId: string };

export interface StrategyExperimentEvidenceSummary {
  experimentId: string;
  definitionHash: string;
  resultHash: string;
  selectedCandidateId: string;
  candidateRevision: string;
  parameters: StrategyExperimentParameterPatch[];
  trainMetrics: StrategyExperimentMetricSet;
  validationMetrics: StrategyExperimentMetricSet;
  testMetrics: StrategyExperimentMetricSet;
  holdoutStatus: StrategyExperimentHoldoutStatus;
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

export interface ResearchRunContextBinding {
  status: "missing" | "matched" | "mismatched";
  canUseRun: boolean;
  runId: string | null;
  selectedContext: string;
  runContext: string | null;
  detail: string;
}

export interface ResearchRunComparisonRow {
  id: "return" | "drawdown" | "trades" | "assumptions";
  label: string;
  current: string;
  previous: string;
  delta: string;
  tone: "positive" | "warning" | "neutral";
}

export type BacktestRunComparisonMatrixBadge =
  | "best_return"
  | "current"
  | "history"
  | "lowest_drawdown"
  | "previous_run";

export interface BacktestRunComparisonMatrixRow {
  id: string;
  assumptions: string;
  badges: BacktestRunComparisonMatrixBadge[];
  context: string;
  createdAt: string;
  dataQualityLabel: string;
  dataRows: number;
  maxDrawdownPct: string;
  returnPct: string;
  runId: string;
  strategyName: string;
  strategyRevision: string;
  symbol: string;
  timeframe: Timeframe;
  tone: "neutral" | "positive" | "risk" | "warning";
  tradeCount: string;
  winRatePct: string;
}

export interface BacktestRunComparisonMatrixSummary {
  bestReturnRunId: string | null;
  context: string;
  currentRunId: string | null;
  detail: string;
  headline: string;
  lowestDrawdownRunId: string | null;
  previousRunId: string | null;
  tone: "neutral" | "positive" | "risk" | "warning";
  totalRows: number;
}

export interface TerminalWorkspace {
  schemaVersion: number;
  selectedInstrument: Instrument;
  selectedTimeframe: Timeframe;
  researchWorkspaceState?: ResearchWorkspaceStateSnapshot | null;
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

export const defaultStrategyRuleDraft: StrategyRuleDraft = {
  name: "SMA trend demo",
  entryKind: "close_above_sma",
  entryWindow: 20,
  entryThreshold: 30,
  entryRsiConfirm: false,
  entryRsiWindow: 14,
  entryRsiThreshold: 55,
  entryVolumeConfirm: false,
  entryVolumeWindow: 20,
  exitKind: "close_below_sma",
  exitWindow: 20,
  exitThreshold: 55,
  positionPct: 20,
  stopLossPct: 8,
  takeProfitPct: 18,
  maxDrawdownPct: 12,
  paperOnly: true
};

export const strategyTemplateOptions: StrategyTemplateOption[] = [
  {
    id: "sma_trend",
    name: "SMA Trend / Bank Sector",
    description: "Trend-following baseline with SMA20 entry and exit.",
    draft: {
      ...defaultStrategyRuleDraft,
      name: "SMA Trend / Bank Sector",
      entryKind: "close_above_sma",
      entryWindow: 20,
      entryThreshold: 30,
      entryRsiConfirm: false,
      entryRsiWindow: 14,
      entryRsiThreshold: 55,
      entryVolumeConfirm: false,
      entryVolumeWindow: 20,
      exitKind: "close_below_sma",
      exitWindow: 20,
      exitThreshold: 55,
      positionPct: 20,
      stopLossPct: 8,
      takeProfitPct: 18,
      maxDrawdownPct: 12,
      paperOnly: true
    }
  },
  {
    id: "rsi_reversal",
    name: "RSI Reversal / Mean Reversion",
    description: "Mean-reversion template using RSI14 oversold and RSI14 recovery exits.",
    draft: {
      ...defaultStrategyRuleDraft,
      name: "RSI Reversal / Mean Reversion",
      entryKind: "rsi_below",
      entryWindow: 14,
      entryThreshold: 30,
      entryRsiConfirm: false,
      entryRsiWindow: 14,
      entryRsiThreshold: 55,
      entryVolumeConfirm: false,
      entryVolumeWindow: 20,
      exitKind: "rsi_above",
      exitWindow: 14,
      exitThreshold: 55,
      positionPct: 18,
      stopLossPct: 7,
      takeProfitPct: 14,
      maxDrawdownPct: 10,
      paperOnly: true
    }
  },
  {
    id: "volume_breakout",
    name: "Volume Breakout / Trend Follow",
    description: "Breakout template requiring price strength and volume confirmation.",
    draft: {
      ...defaultStrategyRuleDraft,
      name: "Volume Breakout / Trend Follow",
      entryKind: "close_above_sma",
      entryWindow: 5,
      entryThreshold: 30,
      entryRsiConfirm: false,
      entryRsiWindow: 14,
      entryRsiThreshold: 55,
      entryVolumeConfirm: true,
      entryVolumeWindow: 10,
      exitKind: "close_below_sma",
      exitWindow: 13,
      exitThreshold: 55,
      positionPct: 15,
      stopLossPct: 6,
      takeProfitPct: 16,
      maxDrawdownPct: 9,
      paperOnly: true
    }
  }
];

export const primaryQuantLoopStepDefinitions = [
  { id: "research", label: "Market Research" },
  { id: "strategy", label: "Strategy Lab" },
  { id: "backtest", label: "Backtest Review" },
  { id: "agent-review", label: "Agent Review" },
  { id: "paper", label: "Paper Trading" }
] as const;

export const productDevelopmentStageDefinitions = [
  {
    id: "foundation",
    label: "Stage 0 · Platform Foundation",
    status: "maintenance",
    workAreaIds: ["settings", "audit"],
    focus: "Keep deployment, settings, audit import/export, signing, and safety boundaries stable while feature work happens in gated stages.",
    exitCriteria: [
      "Docker deployment and smoke checks stay green.",
      "Audit export, import, replay, and settings status stay usable.",
      "No secret or live-trading path leaks into the frontend."
    ]
  },
  {
    id: "market-research",
    label: "Stage 1 · A-share P0 Golden Path",
    status: "maintenance",
    workAreaIds: ["market", "research"],
    focus: "Preserve the accepted market and research golden path as a regression gate for later maintenance stages.",
    exitCriteria: [
      "A-share symbols can be searched, selected, refreshed, charted, and cached with visible data-quality evidence.",
      "One selected symbol can move through strategy configuration, audited backtest, AI review, and paper execution without manual state repair.",
      "The run can be replayed and exported with data snapshot, preparation evidence, strategy revision, assumptions, AI review, and paper-only execution evidence."
    ]
  },
  {
    id: "strategy-backtest",
    label: "Stage 2 · Strategy and Backtest",
    status: "maintenance",
    workAreaIds: ["strategy", "backtest"],
    focus: "Ship canonical, persisted, holdout-safe strategy experiments from audited single-symbol evidence.",
    exitCriteria: [
      "Experiments bind to verified aiqt-data-v2 snapshots and canonical strategy revisions.",
      "Exact replay preserves deterministic definition and result hashes.",
      "Only the selected candidate receives test evidence after validation-only selection.",
      "Loading a candidate creates a new unaudited strategy draft without inherited execution approval."
    ]
  },
  {
    id: "ai-review",
    label: "Stage 3 · AI Review",
    status: "maintenance",
    workAreaIds: ["ai-review"],
    focus: "Ship deterministic, provider-optional AI review from selected audited experiments with authoritative replayable decisions.",
    exitCriteria: [
      "Reviews bind to one selected experiment candidate and reconstruct canonical audited evidence.",
      "Local deterministic assessment remains authoritative when an external Provider is absent or fails.",
      "Authoritative v2 Reviews and append-only Decisions replay from archive evidence without enabling live routes."
    ]
  },
  {
    id: "portfolio-paper",
    label: "Stage 4 · Portfolio and Paper Trading",
    status: "maintenance",
    workAreaIds: ["portfolio"],
    focus: "Preserve the accepted portfolio paper workflow as the authoritative source for Stage 5 shadow execution.",
    exitCriteria: [
      "Portfolio backtest, risk checks, paper orders, approvals, and simulations share one auditable lifecycle.",
      "Paper accounts and positions replay deterministically.",
      "Live routes remain blocked by adapter, risk, and human gates."
    ]
  },
  {
    id: "live-readiness",
    label: "Stage 5 · Live Readiness",
    status: "maintenance",
    workAreaIds: ["execution"],
    focus: "Preserve the accepted pre-live safety foundation and its eight release artifacts while all Sandbox and live order routes remain blocked.",
    exitCriteria: [
      "Shadow execution, idempotency, recovery, limits, kill switch, and reconciliation remain deterministic and replayable.",
      "Sandbox readiness, authoritative read-only probe, authorization preflight, and immutable review remain fail closed.",
      "The top-level exit acceptance binds all release evidence while no Sandbox or live route is enabled."
    ]
  },
  {
    id: "sandbox-execution",
    label: "Stage 6 · Sandbox Execution",
    status: "maintenance",
    workAreaIds: ["execution"],
    focus: "Preserve accepted Binance Spot Testnet execution and recovery as Stage 7/8 authority while every live route remains blocked.",
    exitCriteria: [
      "Only approved Stage 4/5 authority chains can create a ten-minute batch authorization.",
      "GTC limit orders submit, query, cancel, reconcile, and recover from restart by stable clientOrderId.",
      "The account kill switch, detached imports, Docker gates, and real Testnet manifest remain auditable without exposing credentials."
    ]
  },
  {
    id: "production-readonly-admission",
    label: "Stage 7 · Production Read-only Admission",
    status: "maintenance",
    workAreaIds: ["execution"],
    focus: "Preserve production authentication, permission checks, and redacted account evidence without exposing an order route.",
    exitCriteria: [
      "Only dedicated production read-only credentials can reach Binance Spot production metadata and private permission checks.",
      "Trading, withdrawal, and transfer permissions remain disabled before the redacted account summary is read.",
      "No production order, trade, transfer, withdrawal, or live route capability is created."
    ]
  },
  {
    id: "production-readonly-continuity",
    label: "Stage 8 · Production Read-only Continuity",
    status: "maintenance",
    workAreaIds: ["execution"],
    focus: "Preserve revocable production read-only continuity and recovery evidence while the next stage remains unplanned.",
    exitCriteria: [
      "Continuity derives current, stale, blocked, revoked, or missing from existing Stage 6/7 authority.",
      "Local revoke blocks production access before network use and restore requires a current route review.",
      "Docker and real recovery manifests remain exact across API restart with all live and order routes blocked."
    ]
  },
  {
    id: "production-order-admission",
    label: "Stage 9 · Production Order Admission",
    status: "maintenance",
    workAreaIds: ["execution", "audit"],
    focus: "Preserve the accepted production order admission evidence chain without introducing production execution authority.",
    exitCriteria: [
      "Only terminal Stage 6 authority and current Stage 8 continuity can create a ten-minute Binance Spot admission candidate.",
      "Current market rules, price deviation, and redacted funding sufficiency are rechecked before one immutable human review.",
      "Research packages, detached replay, Docker gates, and recovery remain auditable while production order APIs do not exist."
    ]
  }
] as const satisfies readonly ProductDevelopmentStage[];

export const productWorkAreaDefinitions = [
  {
    id: "market",
    label: "Market Center",
    description: "Search, quotes, K-lines, source health",
    accent: "market",
    quantLoopStepId: "research",
    workflowStageId: "data",
    deliveryStageId: "market-research"
  },
  {
    id: "market-information",
    label: "Market Information",
    description: "Market breadth, leaders, activity, and linked news",
    accent: "market",
    quantLoopStepId: "research",
    workflowStageId: "data",
    deliveryStageId: "market-research"
  },
  {
    id: "research",
    label: "Research Terminal",
    description: "Chart, factors, notes, context",
    accent: "market",
    quantLoopStepId: "research",
    workflowStageId: "data",
    deliveryStageId: "market-research"
  },
  {
    id: "strategy",
    label: "Strategy Lab",
    description: "Rules, versions, risk configuration",
    accent: "strategy",
    quantLoopStepId: "strategy",
    workflowStageId: "factor",
    deliveryStageId: "strategy-backtest"
  },
  {
    id: "backtest",
    label: "Backtest Lab",
    description: "Assumptions, trades, reproducible run",
    accent: "ai",
    quantLoopStepId: "backtest",
    workflowStageId: "backtest",
    deliveryStageId: "strategy-backtest"
  },
  {
    id: "ai-review",
    label: "AI Review Board",
    description: "Evidence-locked agent committee",
    accent: "ai",
    quantLoopStepId: "agent-review",
    workflowStageId: "agent",
    deliveryStageId: "ai-review"
  },
  {
    id: "portfolio",
    label: "Portfolio & Risk",
    description: "Exposure, positions, live gates",
    accent: "execution",
    quantLoopStepId: "paper",
    workflowStageId: "execution",
    deliveryStageId: "portfolio-paper"
  },
  {
    id: "execution",
    label: "Execution Center",
    description: "Paper orders and adapter readiness",
    accent: "execution",
    quantLoopStepId: "paper",
    workflowStageId: "execution",
    deliveryStageId: "production-order-admission"
  },
  {
    id: "dynamic-trading",
    label: "Dynamic Trading",
    description: "Live strategy status, decisions, orders, and risk",
    accent: "execution",
    quantLoopStepId: "paper",
    workflowStageId: "execution",
    deliveryStageId: "production-order-admission"
  },
  {
    id: "audit",
    label: "Audit & Replay",
    description: "Run history, import, export, replay",
    accent: "ai",
    quantLoopStepId: "backtest",
    workflowStageId: "backtest",
    deliveryStageId: "foundation"
  },
  {
    id: "settings",
    label: "Settings",
    description: "Data sources, API keys, safety gates",
    accent: "execution",
    quantLoopStepId: "research",
    workflowStageId: "data",
    deliveryStageId: "foundation"
  }
] as const satisfies readonly Omit<
  ProductWorkArea,
  "status" | "deliveryStageLabel" | "deliveryStageStatus" | "deliveryStageFocus"
>[];

export function buildPrimaryQuantLoopSteps(activeStepId = "research", hasAuditedRun = false): QuantLoopStep[] {
  return primaryQuantLoopStepDefinitions.map((step) => ({
    ...step,
    status: step.id === "paper" && !hasAuditedRun ? "locked" : step.id === activeStepId ? "active" : "ready"
  }));
}

export function activeQuantLoopStepId(workspace: TerminalWorkspace): string {
  const supportedStepIds = new Set<string>(primaryQuantLoopStepDefinitions.map((step) => step.id));
  return (
    workspace.quantLoop.find((step) => supportedStepIds.has(step.id) && step.status === "active")?.id ?? "research"
  );
}

export function workspaceNeedsStrategyReaudit(workspace: TerminalWorkspace): boolean {
  return !workspace.researchRun && activeQuantLoopStepId(workspace) === "strategy";
}

export function replayRunRequestIsCurrent(
  capturedSelectionVersion: number,
  currentSelectionVersion: number,
  capturedWorkflowRunId: number,
  currentWorkflowRunId: number
): boolean {
  return capturedSelectionVersion === currentSelectionVersion && capturedWorkflowRunId === currentWorkflowRunId;
}

export function nextAiReviewHistoryRequestId(currentRequestId: number): number {
  return currentRequestId + 1;
}

export function goldenPathRunRebindIsCurrent(
  capturedWorkspace: TerminalWorkspace,
  currentWorkspace: TerminalWorkspace,
  capturedSelectionVersion: number,
  currentSelectionVersion: number,
  capturedWorkflowRunId: number,
  currentWorkflowRunId: number
): boolean {
  return capturedWorkspace === currentWorkspace &&
    replayRunRequestIsCurrent(
      capturedSelectionVersion,
      currentSelectionVersion,
      capturedWorkflowRunId,
      currentWorkflowRunId
    ) &&
    !workspaceNeedsStrategyReaudit(currentWorkspace);
}

export const backtestAssumptionSpecs: Record<
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

export function buildProductDevelopmentStages(): ProductDevelopmentStage[] {
  return productDevelopmentStageDefinitions.map((stage) => ({
    ...stage,
    workAreaIds: [...stage.workAreaIds],
    exitCriteria: [...stage.exitCriteria]
  }));
}

export function buildProductWorkAreas(workspace: TerminalWorkspace): ProductWorkArea[] {
  const hasAuditedRun = Boolean(workspace.researchRun?.runId);
  const deliveryStages = buildProductDevelopmentStages();

  return productWorkAreaDefinitions.map((area) => {
    const stage =
      deliveryStages.find((candidate) => candidate.id === area.deliveryStageId) ?? deliveryStages[0];
    return {
      ...area,
      deliveryStageLabel: stage.label,
      deliveryStageStatus: stage.status,
      deliveryStageFocus: stage.focus,
      status: productWorkAreaStatus(area.id, hasAuditedRun, workspace)
    };
  });
}

export function buildGoldenPathRunbookPreview(
  goldenPath: GoldenPathRunbookSource | null | undefined,
  limit = 3
): GoldenPathRunbookPreviewItem[] {
  if (!goldenPath || !Array.isArray(goldenPath.runbook) || limit <= 0) {
    return [];
  }
  const firstOpenIndex = goldenPath.runbook.findIndex((item) => !item.passed);
  if (firstOpenIndex < 0) {
    return [];
  }
  return goldenPath.runbook
    .slice(firstOpenIndex)
    .filter((item) => !item.passed)
    .slice(0, limit)
    .map((item) => ({
      stepId: item.stepId,
      label: item.label,
      workspaceId: item.workspaceId,
      status: item.status,
      current: item.current,
      detail: item.blocker ?? item.detail,
      actionLabel: item.actionLabel
    }));
}

export function buildGoldenPathWorkspaceContext(
  goldenPath: GoldenPathWorkspaceContextSource | null | undefined,
  workspaceId: string
): GoldenPathWorkspaceContext | null {
  if (!goldenPath || !Array.isArray(goldenPath.workspaces) || !Array.isArray(goldenPath.runbook)) {
    return null;
  }
  const workspaceContext = goldenPath.workspaces.find((workspace) => workspace.id === workspaceId);
  if (!workspaceContext) {
    return null;
  }
  const stepIds = workspaceContext.stepIds;
  const runbookItems = goldenPath.runbook.filter(
    (item) => item.workspaceId === workspaceId || stepIds.includes(item.stepId)
  );
  const primaryItem =
    runbookItems.find((item) => item.current && !item.passed) ??
    runbookItems.find((item) => !item.passed) ??
    runbookItems[0] ??
    null;
  const actionId = primaryItem?.actionId ?? workspaceContext.actionId;
  const actionTargetWorkspaceId = primaryItem?.targetWorkspace ?? (actionId ? workspaceContext.id : null);

  return {
    workspaceId: workspaceContext.id,
    status: workspaceContext.status,
    current: workspaceContext.current,
    reason: workspaceContext.reason,
    stepIds,
    totalStepCount: runbookItems.length || stepIds.length,
    passedStepCount: runbookItems.filter((item) => item.passed).length,
    primaryStepId: primaryItem?.stepId ?? null,
    primaryStepLabel: primaryItem?.label ?? null,
    detail: primaryItem?.blocker ?? primaryItem?.detail ?? workspaceContext.reason,
    actionId,
    actionLabel: primaryItem?.actionLabel ?? null,
    actionTargetWorkspaceId
  };
}
