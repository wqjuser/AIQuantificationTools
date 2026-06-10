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

export type Stage1ResearchWorkspaceId = Extract<ProductWorkAreaId, "market" | "research">;

export type ProductWorkAreaStatus = "ready" | "needs_run" | "blocked";
export type ProductDevelopmentStageId =
  | "foundation"
  | "market-research"
  | "strategy-backtest"
  | "ai-review"
  | "portfolio-paper"
  | "live-readiness";
export type ProductDevelopmentStageStatus = "maintenance" | "current" | "planned";

export interface ProductDevelopmentStage {
  id: ProductDevelopmentStageId;
  label: string;
  status: ProductDevelopmentStageStatus;
  workAreaIds: readonly ProductWorkAreaId[];
  focus: string;
  exitCriteria: readonly string[];
}

export interface ProductWorkArea {
  id: ProductWorkAreaId;
  label: string;
  description: string;
  accent: TerminalModule["accent"];
  quantLoopStepId: string;
  workflowStageId: string;
  deliveryStageId: ProductDevelopmentStageId;
  deliveryStageLabel: string;
  deliveryStageStatus: ProductDevelopmentStageStatus;
  deliveryStageFocus: string;
  status: ProductWorkAreaStatus;
}

export interface ProductWorkAreaSelection {
  areaId: ProductWorkAreaId;
  quantLoopStepId: string;
  workflowStageId: string;
}

export interface ResearchWorkspaceStateDraft {
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  workspaceId: Stage1ResearchWorkspaceId;
}

export interface ResearchWorkspaceStateSnapshot extends ResearchWorkspaceStateDraft {
  updatedAt?: string;
}

export interface ResearchContextUrlState {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
}

export type GoldenPathRunbookStatus = "passed" | "review" | "blocked";

export interface GoldenPathRunbookSourceItem {
  stepId: string;
  label: string;
  workspaceId: string;
  status: GoldenPathRunbookStatus;
  current: boolean;
  passed: boolean;
  detail: string;
  blocker: string | null;
  actionId: string | null;
  actionLabel: string | null;
}

export interface GoldenPathRunbookSource {
  runbook: GoldenPathRunbookSourceItem[];
}

export interface GoldenPathWorkspaceContextSourceItem {
  id: string;
  label: string;
  status: ProductWorkAreaStatus;
  current: boolean;
  stepIds: string[];
  reason: string;
  actionId: string | null;
}

export interface GoldenPathWorkspaceContextSource extends GoldenPathRunbookSource {
  workspaces: GoldenPathWorkspaceContextSourceItem[];
}

export interface GoldenPathRunbookPreviewItem {
  stepId: string;
  label: string;
  workspaceId: string;
  status: GoldenPathRunbookStatus;
  current: boolean;
  detail: string;
  actionLabel: string | null;
}

export interface GoldenPathWorkspaceContext {
  workspaceId: string;
  status: ProductWorkAreaStatus;
  current: boolean;
  reason: string;
  stepIds: string[];
  totalStepCount: number;
  passedStepCount: number;
  primaryStepId: string | null;
  primaryStepLabel: string | null;
  detail: string;
  actionId: string | null;
  actionLabel: string | null;
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
  | "entryRsiConfirm"
  | "entryRsiWindow"
  | "entryRsiThreshold"
  | "entryVolumeConfirm"
  | "entryVolumeWindow"
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
  entryRsiConfirm: boolean;
  entryRsiWindow: number;
  entryRsiThreshold: number;
  entryVolumeConfirm: boolean;
  entryVolumeWindow: number;
  exitKind: StrategyConditionKind;
  exitWindow: number;
  exitThreshold: number;
  positionPct: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxDrawdownPct: number;
  paperOnly: boolean;
}

export type StrategyTemplateId = "sma_trend" | "rsi_reversal" | "volume_breakout";

export interface StrategyTemplateOption {
  id: StrategyTemplateId;
  name: string;
  description: string;
  draft: StrategyRuleDraft;
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
  entryRsiThreshold: number | null;
  entryVolumeWindow: number | null;
  returnPct: string;
  maxDrawdownPct: string;
  tradeCount: number;
  alphaVsCurrent: string;
  status: "current" | "candidate";
  tone: "positive" | "warning" | "neutral" | "risk";
  dataRows: number;
}

export interface BacktestParameterScanSummary {
  totalRows: number;
  candidateCount: number;
  positiveCount: number;
  riskCount: number;
  currentCondition: string | null;
  currentRank: number | null;
  bestCandidateId: string | null;
  bestCandidateCondition: string | null;
  bestCandidateReturnPct: string;
  bestCandidateMaxDrawdownPct: string;
  bestCandidateDelta: string;
  headline: string;
  detail: string;
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

export interface AiEvidenceCard {
  id: "context" | "backtest" | "benchmark" | "research-note" | "risk" | "safety";
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export interface AiReviewCitation {
  id:
    | "run"
    | "metrics"
    | "benchmark"
    | "parameter-scan"
    | "strategy"
    | "data-quality"
    | "research-note"
    | "risk-gates";
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

export type AiReviewEvidenceAnchorType =
  | "research-run"
  | "strategy-revision"
  | "data-snapshot"
  | "citation"
  | "committee-rounds"
  | "decision-log"
  | "risk-boundary";

export interface AiReviewEvidenceAnchor {
  id: string;
  type: AiReviewEvidenceAnchorType;
  label: string;
  reference: string;
  exportPath: string;
}

export interface AiReviewRunRecord {
  schemaVersion: 1;
  recordType: "aiqt.aiReviewRun";
  aiReviewId: string;
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  strategyRevision: string;
  executionMode: string;
  status: AiReviewDossier["status"];
  summary: {
    citationCount: number;
    roundCount: number;
    decisionCount: number;
    parameterScanBound: boolean;
    liveExecutionBlocked: boolean;
  };
  dossier: AiReviewDossier;
  citations: AiReviewCitation[];
  rounds: AgentCommitteeRound[];
  decisionLog: DecisionLogEntry[];
  evidenceAnchors?: AiReviewEvidenceAnchor[];
  boundary: string;
}

export type AiReviewRecordDriftReason = "run" | "strategy" | "status" | "citations" | "rounds" | "boundary";

export interface AiReviewRecordDriftRow {
  aiReviewId: string;
  createdAt: string;
  strategyRevision: string;
  citationCount: number;
  roundCount: number;
  liveExecutionBlocked: boolean;
  status: "matched" | "drift";
  driftCount: number;
  driftReasons: AiReviewRecordDriftReason[];
}

export type AiReviewAuditTimelineItemKind = "current-evidence" | "saved-review" | "risk-approval";

export interface AiReviewAuditTimelineItem {
  id: string;
  kind: AiReviewAuditTimelineItemKind;
  label: string;
  value: string;
  detail: string;
  reference: string;
  exportAnchor: string;
  createdAt: string | null;
  targetWorkspaceId: ProductWorkAreaId | null;
  targetRecordId: string | null;
  actionLabel: string;
  status: "passed" | "review" | "blocked";
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type AiReviewExportEvidenceIndexGroup = "current-record" | "saved-record" | "timeline";

export interface AiReviewExportEvidenceIndexRow {
  id: string;
  group: AiReviewExportEvidenceIndexGroup;
  label: string;
  anchor: string;
  reference: string;
  exportPath: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type ResearchRunExportPreviewStatus = "ready" | "missing" | "blocked";

export interface ResearchRunExportPreviewRow {
  id:
    | "research-run"
    | "data-snapshot"
    | "strategy-config"
    | "research-note"
    | "backtest-trades"
    | "paper-executions"
    | "promotion-candidate"
    | "ai-review-runs"
    | "execution-handoff";
  label: string;
  status: ResearchRunExportPreviewStatus;
  count: string;
  anchor: string;
  exportPath: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export interface ResearchRunExportPreviewAiReviewEnvelope {
  aiReviewId: string;
  runId: string;
  createdAt: string;
  record: AiReviewRunRecord;
}

export interface ResearchRunExportPreviewPromotionCandidate extends Partial<PromotionReadiness> {
  candidateId?: string | null;
  runId?: string | null;
  createdAt?: string | null;
  liveTradingAllowed?: boolean;
  evidence?: {
    paperExecutions: number;
    filledOrders: number;
    passedPaperRiskChecks: number;
  };
}

export type ResearchRunExportBrowserStatus = "ready" | "missing" | "blocked";

export interface ResearchRunExportBrowserManifest {
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  strategyRevision: string;
  dataHash: string;
  dataRows: number;
  executionMode: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  artifactCounts: {
    bars: number;
    trades: number;
    equityPoints: number;
    decisions: number;
    aiRisks: number;
    paperExecutions?: number;
    portfolioPaperOrderBatches?: number;
    portfolioPaperOrderApprovals?: number;
    portfolioPaperOrderSimulations?: number;
    promotionCandidates?: number;
    researchNotes?: number;
    aiReviewRuns?: number;
  };
}

export interface PortfolioPaperOrderBatchSnapshot {
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  createdAt: string;
  mode: "portfolio_paper_order_review";
  source: string;
  summary: {
    totalOrders: number;
    totalNotionalValue: number;
    statusCounts: Record<string, number>;
    riskStatusCounts: Record<string, number>;
    lifecycleStateCounts?: Record<string, number>;
    routableOrders?: number;
  };
  orders: Array<{
    timestamp: string;
    eventType: "portfolio_paper_order";
    orderId: string;
    symbol: string;
    sourceRunId: string | null;
    side: "buy" | "sell" | "hold";
    notionalValue: number;
    quantity: number;
    status: "pending_review" | "rejected" | "skipped";
    riskStatus: "passed" | "review" | "blocked";
    reason: string;
  }>;
}

export interface PortfolioPaperOrderApprovalSnapshot {
  approvalId: string;
  baseRunId: string;
  batchId: string;
  orderId: string;
  reviewedAt: string;
  approved: boolean;
  reviewer: string;
  reason: string;
}

export interface PortfolioPaperOrderSimulationSnapshot {
  simulationId: string;
  baseRunId: string;
  batchId: string;
  orderId: string;
  simulatedAt: string;
  mode: "portfolio_paper_order_simulation";
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell";
  quantity: number;
  fillPrice: number;
  notionalValue: number;
  orderState: "filled";
  fillStatus: "filled";
  reason: string;
  approvedBy: string | null;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderReplayPositionSnapshot {
  symbol: string;
  quantity: number;
  avgCost: number;
  lastPrice: number;
  marketValue: number;
  unrealizedPnl: number;
}

export interface PortfolioPaperOrderReplayOrderSnapshot {
  simulationId: string;
  batchId: string;
  orderId: string;
  simulatedAt: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  fillPrice: number;
  notionalValue: number;
  cashAfter: number;
  positionAfter: number;
  replayState: "applied" | "ignored";
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderReplaySnapshot {
  schemaVersion: 1;
  baseRunId: string;
  generatedAt: string;
  mode: "portfolio_paper_order_replay";
  initialCash: number;
  account: {
    cash: number;
    equity: number;
    positions: Record<string, number>;
  };
  positions: PortfolioPaperOrderReplayPositionSnapshot[];
  orders: PortfolioPaperOrderReplayOrderSnapshot[];
  summary: {
    filledOrders: number;
    buyNotional: number;
    sellNotional: number;
    netNotional: number;
    realizedPnl: number;
    unrealizedPnl: number;
    positionCount: number;
    warnings: string[];
  };
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderReplaySummaryTile {
  id: "portfolio-account" | "portfolio-positions" | "portfolio-replay-boundary";
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PortfolioPaperOrderReplayPositionRow {
  id: string;
  symbol: string;
  quantity: string;
  avgCost: string;
  lastPrice: string;
  marketValue: string;
  unrealizedPnl: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PortfolioPaperOrderStateHistoryEventSnapshot {
  eventId: string;
  batchId: string;
  baseRunId: string;
  orderId: string;
  timestamp: string;
  state: string;
  label: string;
  actor: string;
  source: string;
  reason: string;
  metadata?: Record<string, unknown>;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistoryOrderSnapshot {
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  orderId: string;
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell" | "hold";
  quantity: number;
  notionalValue: number;
  originalStatus: "pending_review" | "rejected" | "skipped";
  riskStatus: "passed" | "review" | "blocked";
  currentState: string;
  currentStateLabel: string;
  events: PortfolioPaperOrderStateHistoryEventSnapshot[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistorySnapshot {
  schemaVersion: 1;
  baseRunId: string;
  batchId: string;
  portfolioName: string;
  generatedAt: string;
  mode: "portfolio_paper_order_state_history";
  summary: {
    orderCount: number;
    eventCount: number;
    approvedOrders: number;
    rejectedOrders: number;
    filledOrders: number;
    liveBlockedEvents: number;
    stateCounts: Record<string, number>;
  };
  orders: PortfolioPaperOrderStateHistoryOrderSnapshot[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistoryRow {
  id: string;
  batchId: string;
  baseRunId: string;
  orderId: string;
  symbol: string;
  timestamp: string;
  state: string;
  label: string;
  actor: string;
  source: string;
  reason: string;
  quantity: string;
  notionalValue: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PortfolioPaperOrderLifecycleRow {
  id: string;
  portfolioName: string;
  batchId: string;
  baseRunId: string;
  createdAt: string;
  orderCount: number;
  notionalValue: number;
  status: "ready" | "review" | "blocked";
  statusLabel: string;
  executionStateLabel: string;
  routableOrders: number;
  auditEventId: string;
  detail: string;
  tone: "positive" | "warning" | "risk" | "neutral";
}

export interface PortfolioPaperOrderLifecycleSnapshot {
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  orderId: string;
  symbol: string;
  sourceRunId: string | null;
  side: "buy" | "sell" | "hold";
  quantity: number;
  notionalValue: number;
  originalStatus: "pending_review" | "rejected" | "skipped";
  riskStatus: "passed" | "review" | "blocked";
  state:
    | "awaiting_operator_review"
    | "ready_for_simulation"
    | "risk_rejected"
    | "operator_rejected"
    | "risk_review"
    | "invalid_order"
    | "skipped";
  routable: boolean;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
  approvedBy: string | null;
  reviewedAt: string | null;
  reason: string;
}

export interface PortfolioPaperOrderApprovalRow {
  id: string;
  portfolioName: string;
  batchId: string;
  baseRunId: string;
  orderId: string;
  symbol: string;
  side: "buy" | "sell" | "hold";
  quantity: number;
  notionalValue: number;
  riskStatus: "passed" | "review" | "blocked";
  state: PortfolioPaperOrderLifecycleSnapshot["state"];
  canApprove: boolean;
  canReject: boolean;
  approvedBy: string | null;
  reviewedAt: string | null;
  actionHint: string;
  tone: "positive" | "warning" | "risk" | "neutral";
}

export interface ResearchRunExportBrowserPackage {
  kind: "aiqt.researchRun.export";
  packageVersion: number;
  exportedAt: string;
  integrity?: {
    algorithm: "sha256";
    hash: string;
  };
  manifest: ResearchRunExportBrowserManifest;
  executionHandoff: {
    mode: string;
    paperOnly: boolean;
    liveTradingAllowed: boolean;
    requiredGates: Array<{
      id: string;
      label: string;
      passed: boolean;
      reason: string;
    }>;
  };
  researchRun?: ResearchRunAudit;
  paperExecutions?: PaperExecutionSnapshot[];
  portfolioPaperOrderBatches?: PortfolioPaperOrderBatchSnapshot[];
  portfolioPaperOrderApprovals?: PortfolioPaperOrderApprovalSnapshot[];
  portfolioPaperOrderSimulations?: PortfolioPaperOrderSimulationSnapshot[];
  promotionCandidate?: ResearchRunExportPreviewPromotionCandidate | null;
  aiReviewRuns?: ResearchRunExportPreviewAiReviewEnvelope[];
  auditEvidenceSummary?: {
    kind: "aiqt.auditEvidenceSummary";
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    auditQuery: string;
    packageQuery: string;
    importDiffQuery: string;
    focusQuery: string;
    deepLinkStatus: AuditEvidenceDeepLinkStatus;
    deepLinkError: string | null;
    package: {
      ready: number;
      missing: number;
      blocked: number;
      matched: number;
      total: number;
    };
    importDiff: {
      changes: number;
      adds: number;
      blocked: number;
      matched: number;
      total: number;
    };
    importVerification?: {
      verified: number;
      invalid: number;
      buckets: AuditEvidenceImportVerificationBucket[];
    };
    copyText: string;
  };
  auditReport?: {
    kind: "aiqt.auditReport";
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    format: "text/markdown";
    fileName: string;
    contentSha256: {
      algorithm: "sha256";
      hash: string;
    };
    contentMarkdown: string;
    signature?: Record<string, unknown>;
    evidenceSummary: ResearchRunExportBrowserPackage["auditEvidenceSummary"];
  };
  backtestReport?: {
    kind: "aiqt.backtestReport";
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    format: "text/markdown";
    fileName: string;
    contentSha256: {
      algorithm: "sha256";
      hash: string;
    };
    contentMarkdown: string;
    market: Market;
    symbol: string;
    timeframe: Timeframe;
    strategyRevision: string;
    executionMode: string;
    dataRows: number;
    runComparisonRows: number;
    signature?: Record<string, unknown>;
    boundary: "historical audited evidence only; no investment advice";
  };
}

export interface ResearchRunExportBrowserRow {
  id:
    | "package"
    | "integrity"
    | "data"
    | "backtest"
    | "backtest-report"
    | "research-note"
    | "paper-executions"
    | "portfolio-paper-orders"
    | "promotion-candidate"
    | "ai-reviews"
    | "audit-summary"
    | "audit-report"
    | "execution-handoff";
  label: string;
  status: ResearchRunExportBrowserStatus;
  value: string;
  detail: string;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type ResearchRunExportIndexStatus = "ready" | "review" | "blocked";

export interface ResearchRunExportIndexRow {
  id: string;
  runId: string;
  context: string;
  strategyRevision: string;
  exportedAt: string;
  status: ResearchRunExportIndexStatus;
  integrity: string;
  dataHash: string;
  artifacts: string;
  execution: string;
  detail: string;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type ResearchRunImportDiffStatus = "same" | "add" | "change" | "replace" | "blocked";

export interface ResearchRunImportDiffRow {
  id:
    | "package-integrity"
    | "artifact-counts"
    | "run-id"
    | "context"
    | "timeframe"
    | "data-snapshot"
    | "strategy-revision"
    | "research-note"
    | "paper-executions"
    | "portfolio-paper-orders"
    | "ai-review-runs"
    | "audit-summary"
    | "audit-report"
    | "backtest-report"
    | "live-boundary";
  label: string;
  status: ResearchRunImportDiffStatus;
  current: string;
  incoming: string;
  detail: string;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type AuditEvidenceDeepLinkStatus = "none" | "idle" | "loading" | "loaded" | "failed";

export interface AuditEvidenceImportVerificationBucket {
  count: number;
  latestExportPath: string;
  latestReason: string;
  source: "local-core";
  status: "verified" | "invalid";
}

export interface AuditEvidenceImportPolicyBlockerBucket {
  category: ResearchRunImportBlockedEvidenceBucketCategory;
  count: number;
  label: string;
  latestDetail: string;
  latestExportPath: string;
  latestFileName: string;
  latestRunId: string;
  tone: "risk" | "warning";
}

export interface AuditEvidenceSummary {
  auditQuery: string;
  copyText: string;
  deepLinkError: string | null;
  deepLinkStatus: AuditEvidenceDeepLinkStatus;
  focusQuery: string;
  importDiffAddCount: number;
  importDiffBlockedCount: number;
  importDiffChangeCount: number;
  importDiffMatchedCount: number;
  importDiffQuery: string;
  importDiffTotalCount: number;
  importPolicyBlockedCount: number;
  importPolicyBlockerBuckets: AuditEvidenceImportPolicyBlockerBucket[];
  importVerificationBuckets: AuditEvidenceImportVerificationBucket[];
  importVerificationInvalidCount: number;
  importVerificationVerifiedCount: number;
  packageBlockedCount: number;
  packageMatchedCount: number;
  packageMissingCount: number;
  packageQuery: string;
  packageReadyCount: number;
  packageTotalCount: number;
  runId: string;
}

export type ResearchRunImportAuditEventStage =
  | "preview"
  | "blocked"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "undone"
  | "undo-failed";
export type ResearchRunImportFailureCategory = "schema" | "integrity" | "artifact-counts" | "core" | "unknown";

export interface ResearchRunImportAuditBlockedRow {
  id: ResearchRunImportDiffRow["id"];
  label: string;
  detail: string;
  exportPath: string;
  incoming: string;
}

export interface ResearchRunImportVerifiedReportSignature {
  id: Extract<ResearchRunImportDiffRow["id"], "audit-report" | "backtest-report">;
  label: string;
  detail: string;
  exportPath: string;
  incoming: string;
  reason: string;
  source: "local-core";
  status: "verified" | "invalid";
}

export interface ResearchRunImportAuditEvent {
  id: string;
  stage: ResearchRunImportAuditEventStage;
  runId: string;
  previousRunId: string | null;
  rollbackTargetRunId: string | null;
  undoToken: string | null;
  fileName: string;
  createdAt: string;
  summary: string;
  detail: string;
  failureCategory: ResearchRunImportFailureCategory | null;
  recoveryHint: string;
  blockedCount: number;
  blockedRows: ResearchRunImportAuditBlockedRow[];
  changeCount: number;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
  verifiedReportSignatures: ResearchRunImportVerifiedReportSignature[];
}

export interface ResearchRunImportUndoConfirmation {
  undoToken: string;
  runId: string;
  fileName: string;
  message: string;
  detail: string;
}

export type ResearchRunImportAuditFilter =
  | "all"
  | "needs-review"
  | "undoable"
  | "recoverable"
  | ResearchRunImportAuditEventStage;

export type ResearchRunImportAuditFailureBucketCategory = ResearchRunImportFailureCategory | "blocked";

export interface ResearchRunImportAuditFailureBucket {
  category: ResearchRunImportAuditFailureBucketCategory;
  label: string;
  count: number;
  latestRunId: string;
  latestFileName: string;
  latestCreatedAt: string;
  recoveryHint: string;
  stageCounts: Partial<Record<ResearchRunImportAuditEventStage, number>>;
  tone: "risk" | "warning";
}

export type ResearchRunImportBlockedEvidenceBucketCategory =
  | "import-verification"
  | "report-signature"
  | "package-integrity"
  | "artifact-counts"
  | "live-boundary"
  | "data-snapshot"
  | "unknown";

export interface ResearchRunImportBlockedEvidenceBucket {
  category: ResearchRunImportBlockedEvidenceBucketCategory;
  label: string;
  count: number;
  latestRunId: string;
  latestFileName: string;
  latestCreatedAt: string;
  latestDetail: string;
  latestExportPath: string;
  rowIds: ResearchRunImportDiffRow["id"][];
  tone: "risk" | "warning";
}

export interface ResearchRunImportVerifiedReportSignatureBucket {
  status: ResearchRunImportVerifiedReportSignature["status"];
  label: string;
  count: number;
  latestRunId: string;
  latestFileName: string;
  latestCreatedAt: string;
  latestDetail: string;
  latestExportPath: string;
  latestReason: string;
  rowIds: ResearchRunImportVerifiedReportSignature["id"][];
  source: "local-core";
  tone: "positive" | "risk";
}

export interface ResearchRunImportAuditAggregation {
  total: number;
  preview: number;
  blocked: number;
  confirmed: number;
  failed: number;
  cancelled: number;
  undone: number;
  undoFailed: number;
  needsReview: number;
  undoable: number;
  recoverable: number;
  failureBuckets: ResearchRunImportAuditFailureBucket[];
  blockedEvidenceBuckets: ResearchRunImportBlockedEvidenceBucket[];
  verifiedReportSignatureBuckets: ResearchRunImportVerifiedReportSignatureBucket[];
}

export interface AuditEvidenceReportLedgerEventRecord {
  schemaVersion: number;
  eventId: string;
  eventType: string;
  runId: string | null;
  createdAt: string;
  stage: string;
  source: string;
  summary: string;
  detail: string;
  metadata: Record<string, unknown>;
}

export type AuditEvidenceReportLedgerStatus = "ready" | "invalid";
export type AuditEvidenceReportSignatureStatus =
  | "unsigned"
  | "signed"
  | "verified"
  | "revoked"
  | "invalid";

export interface AuditEvidenceReportLedgerRow {
  id: string;
  artifactKind: string;
  runId: string;
  createdAt: string;
  fileName: string;
  contentSha256: string;
  shortHash: string;
  focusQuery: string;
  packageMatched: number;
  packageTotal: number;
  importDiffBlocked: number;
  importDiffTotal: number;
  importVerificationDetail: string;
  importVerificationInvalid: number;
  importVerificationVerified: number;
  deepLinkStatus: string;
  status: AuditEvidenceReportLedgerStatus;
  statusLabel: string;
  chainId: string;
  signer: string;
  signatureAlgorithm: string;
  signatureDetail: string;
  signatureKeyId: string;
  signatureRevokedReason: string;
  signatureSignedAt: string;
  signatureStatus: AuditEvidenceReportSignatureStatus;
  signatureLabel: string;
  signatureVerifiedAt: string;
  detail: string;
  reportKind: "audit_evidence_report" | "backtest_report" | "portfolio_report";
  tone: "ai" | "positive" | "risk";
}

export interface AuditEvidenceReportLedgerSummary {
  attention: number;
  chainStatus: "empty" | "unsigned" | "verified" | "attention";
  importVerificationInvalid: number;
  importVerificationVerified: number;
  invalid: number;
  latestHash: string;
  ready: number;
  revoked: number;
  signed: number;
  total: number;
  unsigned: number;
  verified: number;
}

export type AuditSigningKeyRotationLedgerEventKind = "plan" | "apply";
export type AuditSigningKeyRotationLedgerStatus = "prepared" | "blocked" | "ready_for_restart";

export interface AuditSigningKeyRotationLedgerRow {
  id: string;
  applyMode: string;
  createdAt: string;
  confirmedConfirmationCount: number;
  confirmedConfirmationIds: string[];
  currentKeyFingerprint: string;
  currentKeyId: string;
  detail: string;
  environmentUpdateCount: number;
  eventKind: AuditSigningKeyRotationLedgerEventKind;
  missingConfirmationCount: number;
  missingConfirmationIds: string[];
  proposedChainId: string;
  proposedKeyId: string;
  proposedSigner: string;
  requiresRestart: boolean;
  rotationRequired: boolean;
  secretPlaceholderCount: number;
  stepCount: number;
  status: AuditSigningKeyRotationLedgerStatus;
  statusLabel: string;
  templateSha256: string;
  templateShortHash: string;
  blockedReasons: string[];
  blockedReasonLabel: string;
  tone: "warning" | "risk" | "positive";
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

export interface PortfolioBacktestDraftLeg {
  runId: string;
  symbol: string;
  targetWeight: number;
  weightLabel: string;
  strategyRevision: string;
  totalReturnPct: string;
  maxDrawdownPct: string;
  current: boolean;
}

export interface PortfolioBacktestDraft {
  status: "ready" | "blocked";
  headline: string;
  summary: string;
  cashWeight: number;
  request: {
    name: string;
    initialCash: number;
    legs: { runId: string; targetWeight: number }[];
  } | null;
  rows: PortfolioBacktestDraftLeg[];
}

export type PortfolioPeerAuditCandidateStatus = "audited" | "missing";

export interface PortfolioPeerAuditCandidate {
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  status: PortfolioPeerAuditCandidateStatus;
  runId: string | null;
}

export interface PortfolioPeerAuditPlan {
  status: "ready" | "complete" | "blocked";
  headline: string;
  summary: string;
  auditedCount: number;
  missingCount: number;
  candidates: PortfolioPeerAuditCandidate[];
}

export type PortfolioBacktestDiagnosticStatus = "passed" | "review" | "blocked";

export interface PortfolioBacktestDiagnosticRow {
  id:
    | "concentration"
    | "cash-buffer"
    | "exposure-utilization"
    | "rebalance-drift"
    | "risk-contribution"
    | "covariance-risk"
    | "correlation-risk"
    | "negative-contribution"
    | "data-quality";
  label: string;
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
  tone: "positive" | "warning" | "risk" | "neutral";
}

interface PortfolioBacktestDiagnosticQuality {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
}

interface PortfolioBacktestDiagnosticLeg {
  symbol: string;
  targetWeight: number;
  startingValue?: number;
  endingValue?: number;
  contributionValue: number;
  contributionReturnPct: number;
  maxDrawdownPct: number;
  tradeCount: number;
  dataQuality: PortfolioBacktestDiagnosticQuality;
}

interface PortfolioBacktestDiagnosticInput {
  initialCash?: number;
  cashWeight: number;
  legs: PortfolioBacktestDiagnosticLeg[];
  allocationEvents?: Array<{
    timestamp: string;
    eventType: "allocate" | "cash_buffer";
    symbol: string;
    sourceRunId: string | null;
    targetWeight: number;
    notionalValue: number;
    reason: string;
  }>;
  rebalanceEvents?: Array<{
    timestamp: string;
    eventType: "rebalance_review";
    symbol: string;
    sourceRunId: string | null;
    targetWeight: number;
    endingWeight: number;
    currentValue: number;
    targetValue: number;
    deltaValue: number;
    driftPct: number;
    status: "within_band" | "review" | "blocked";
    reason: string;
  }>;
  tradeReviewEvents?: Array<{
    timestamp: string;
    eventType: "trade_review";
    symbol: string;
    sourceRunId: string | null;
    side: "buy" | "sell" | "hold";
    notionalValue: number;
    targetWeight: number;
    endingWeight: number;
    status: "paper_review" | "blocked" | "no_action";
    reason: string;
  }>;
  preTradeRiskChecks?: Array<{
    timestamp: string;
    eventType: "pre_trade_risk_check";
    scope: "portfolio" | "trade";
    symbol: string | null;
    sourceRunId: string | null;
    checkId: "portfolio_data_quality" | "trade_review_status" | "trade_notional_limit";
    status: "passed" | "review" | "blocked";
    value: number;
    limit: number;
    reason: string;
  }>;
  paperOrderEvents?: Array<{
    timestamp: string;
    eventType: "portfolio_paper_order";
    orderId: string;
    symbol: string;
    sourceRunId: string | null;
    side: "buy" | "sell" | "hold";
    notionalValue: number;
    quantity: number;
    status: "pending_review" | "rejected" | "skipped";
    riskStatus: "passed" | "review" | "blocked";
    reason: string;
  }>;
  covarianceRisk?: {
    method: "population_covariance";
    observations: number;
    periodVolatilityPct: number;
    annualizedVolatilityPct: number;
    contributions: Array<{
      symbol: string;
      sourceRunId: string | null;
      targetWeight: number;
      annualizedVolatilityPct: number;
      marginalContributionPct: number;
      contributionPct: number;
    }>;
  };
  correlationPairs?: Array<{ leftSymbol: string; rightSymbol: string; correlation: number }>;
  dataQuality: PortfolioBacktestDiagnosticQuality;
  equityCurve?: Array<{ timestamp: string; equity: number }>;
}

interface PortfolioBacktestReportInput extends PortfolioBacktestDiagnosticInput {
  name: string;
  market: Market;
  timeframe: Timeframe;
  initialCash: number;
  metrics: {
    totalReturnPct: number;
    annualReturnPct: number;
    maxDrawdownPct: number;
    winRatePct: number;
    profitFactor: number;
    tradeCount: number;
  };
  equityCurve: Array<{ timestamp: string; equity: number }>;
}

export interface PortfolioBacktestReportOptions {
  generatedAt?: string;
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

export interface ExecutionAdapterLedgerGateSnapshot {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface ExecutionAdapterLedgerEventSnapshot {
  eventId: string;
  adapterId: string;
  timestamp: string;
  state: string;
  label: string;
  actor: string;
  source: string;
  reason: string;
  liveTradingAllowed: boolean;
}

export interface ExecutionAdapterLedgerAdapterSnapshot {
  id: string;
  market: Market | "multi";
  adapter: string;
  route: "paper" | "live";
  status: "paper_ready" | "interface_only" | "config_required" | "blocked" | string;
  certification: string;
  currentState: string;
  liveTradingAllowed: boolean;
  note: string;
  nextStep: string;
  gates: ExecutionAdapterLedgerGateSnapshot[];
  events: ExecutionAdapterLedgerEventSnapshot[];
}

export interface ExecutionAdapterLedgerSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  mode: "execution_adapter_state_ledger";
  liveTradingAllowed: boolean;
  requiredGates: string[];
  summary: {
    adapterCount: number;
    liveAdapterCount: number;
    certifiedLiveAdapters: number;
    paperReadyAdapters: number;
    blockedLiveAdapters: number;
    configRequiredAdapters: number;
    requiredGateCount: number;
    stateCounts?: Record<string, number>;
  };
  adapters: ExecutionAdapterLedgerAdapterSnapshot[];
}

export interface ExecutionAdapterLedgerRow {
  id: string;
  adapterId: string;
  adapter: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  state: string;
  label: string;
  actor: string;
  source: string;
  reason: string;
  nextStep: string;
  gateSummary: string;
  liveTradingAllowed: boolean;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterCertificationStatus = "passed" | "blocked" | "failed" | "review";

export interface ExecutionAdapterCertificationSnapshot {
  schemaVersion: 1;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterCertificationStatus;
  operator: string;
  startedAt: string;
  completedAt: string | null;
  checks: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterCertificationStatus;
    detail: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata: Record<string, unknown>;
  summary: {
    checkCount: number;
    checkStatusCounts: Record<string, number>;
    passedChecks: number;
    blockedChecks: number;
    failedChecks: number;
    reviewChecks: number;
  };
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationRow {
  id: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterCertificationStatus;
  statusLabel: string;
  checkSummary: string;
  auditEventId: string;
  boundary: string;
  liveTradingAllowed: boolean;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterCertificationApplyStatus = "blocked" | "ready_for_restart";
export type ExecutionAdapterCertificationApplyConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterCertificationApplySnapshot {
  schemaVersion: 1;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterCertificationApplyStatus;
  operator: string;
  generatedAt: string;
  applyMode: string;
  restartRequired: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterCertificationApplyConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationApplyRow {
  id: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterCertificationApplyStatus;
  statusLabel: string;
  applyMode: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  restartRequired: boolean;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterControlledRestartEvidenceStatus = "blocked" | "evidence_recorded";
export type ExecutionAdapterControlledRestartEvidenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterControlledRestartEvidenceSnapshot {
  schemaVersion: 1;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterControlledRestartEvidenceStatus;
  operator: string;
  recordedAt: string;
  evidenceMode: string;
  restartRequired: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterControlledRestartEvidenceConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterControlledRestartEvidenceRow {
  id: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterControlledRestartEvidenceStatus;
  statusLabel: string;
  evidenceMode: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  restartRequired: boolean;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterRestartAcceptanceStatus = "blocked" | "acceptance_recorded";
export type ExecutionAdapterRestartAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRestartAcceptanceSnapshot {
  schemaVersion: 1;
  acceptanceId: string;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRestartAcceptanceStatus;
  operator: string;
  recordedAt: string;
  acceptanceMode: string;
  restartRequired: boolean;
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterRestartAcceptanceConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRestartAcceptanceRow {
  id: string;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterRestartAcceptanceStatus;
  statusLabel: string;
  acceptanceMode: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  restartRequired: boolean;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSecretReferenceStatus = "blocked" | "reference_recorded";
export type ExecutionAdapterSecretReferenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretReferenceSnapshot {
  schemaVersion: 1;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSecretReferenceStatus;
  operator: string;
  recordedAt: string;
  referenceName: string;
  backend: string;
  requiredEnvVars: string[];
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSecretReferenceConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretReferenceRow {
  id: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterSecretReferenceStatus;
  statusLabel: string;
  referenceName: string;
  backend: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterSecretMaterializationStatus = "blocked" | "manifest_recorded";
export type ExecutionAdapterSecretMaterializationConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretMaterializationSnapshot {
  schemaVersion: 1;
  materializationId: string;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSecretMaterializationStatus;
  operator: string;
  recordedAt: string;
  materializationMode: string;
  referenceName: string;
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: Array<{
    id: string;
    label: string;
    status: ExecutionAdapterSecretMaterializationConfirmationStatus;
  }>;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretMaterializationRow {
  id: string;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  timestamp: string;
  status: ExecutionAdapterSecretMaterializationStatus;
  statusLabel: string;
  referenceName: string;
  backend: string;
  manifestPath: string;
  materializationMode: string;
  envVarSummary: string;
  confirmationSummary: string;
  blockerSummary: string;
  boundary: string;
  auditEventId: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type ExecutionAdapterCertificationApplyConfirmationKey =
  | "secretReferenceStored"
  | "controlledRestartWindowApproved"
  | "operatorReviewedCertification";

export type ExecutionAdapterCertificationApplyConfirmations = Record<
  ExecutionAdapterCertificationApplyConfirmationKey,
  boolean
>;

export interface ExecutionAdapterCertificationApplyConfirmationRow {
  id: string;
  key: ExecutionAdapterCertificationApplyConfirmationKey;
  label: string;
  detail: string;
  checked: boolean;
  tone: "positive" | "neutral";
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
  market?: Market;
  symbol?: string;
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

export type ResearchContextReadinessStatus = "ready" | "review" | "blocked";

export interface ResearchContextReadinessCacheContext {
  rowCount: number;
  freshness: string;
  ageHours?: number | null;
  latestTimestamp?: string | null;
}

export interface ResearchContextReadinessNoteInput {
  source: string;
  body: string;
  savedBody?: string | null;
  updatedAt: string | null;
  error?: string | null;
}

export interface ResearchContextReadinessInput {
  workspace: TerminalWorkspace;
  barCount: number;
  dataQuality: ResearchRunDataQuality;
  activeWorkAreaId?: ProductWorkAreaId;
  watchlist?: {
    hasUnsavedChanges: boolean;
  } | null;
  cacheContext?: ResearchContextReadinessCacheContext | null;
  watchlistRefreshRuns?: WatchlistCacheRefreshRunSnapshot[] | null;
  note?: ResearchContextReadinessNoteInput | null;
}

export type ResearchContextReadinessAction =
  | "refresh-cache"
  | "refresh-watchlist-cache"
  | "save-note"
  | "save-watchlist"
  | "save-workspace";

export interface ResearchContextReadinessRow {
  id: "instrument" | "watchlist" | "klines" | "cache" | "refresh" | "note" | "workspace";
  label: string;
  value: string;
  detail: string;
  status: ResearchContextReadinessStatus;
  tone: "positive" | "warning" | "risk" | "neutral";
  action?: ResearchContextReadinessAction;
  evidenceRunId?: string;
}

export interface ResearchContextEvidenceRow {
  id: "audit-run";
  label: string;
  value: string;
  detail: string;
  status: ResearchContextReadinessStatus;
  tone: "positive" | "warning" | "risk";
}

export interface WatchlistCacheRefreshRunSnapshot {
  runId: string;
  createdAt: string;
  timeframe: Timeframe;
  requestedLimit: number;
  summary: {
    totalSymbols: number;
    refreshed: number;
    skipped: number;
    failed: number;
    upsertedRows: number;
  };
  items: WatchlistCacheRefreshItemSnapshot[];
}

export interface WatchlistCacheRefreshItemSnapshot {
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  requestedLimit: number;
  upsertedRows: number;
  status: "refreshed" | "skipped" | "failed";
  quality: {
    source: string;
    isComplete: boolean;
    warnings: string[];
    rows: number;
  };
  error: string | null;
}

export interface WatchlistCacheRefreshHistoryRow {
  id: string;
  runId: string;
  createdAt: string;
  timeframe: Timeframe;
  label: string;
  total: number;
  refreshed: number;
  skipped: number;
  failed: number;
  upsertedRows: number;
  value: string;
  detail: string;
  selected: boolean;
  tone: "positive" | "warning" | "risk" | "neutral";
}

export interface WatchlistCacheRefreshItemRow {
  id: string;
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  instrument: Instrument;
  status: WatchlistCacheRefreshItemSnapshot["status"];
  statusLabel: string;
  source: string;
  rows: number;
  upsertedRows: number;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "risk";
}

export interface WatchlistCacheRefreshCoverageRow {
  id: string;
  runId: string;
  label: string;
  value: string;
  detail: string;
  status: ResearchContextReadinessStatus;
  tone: "positive" | "warning" | "risk";
  canOpenResearch: boolean;
}

export interface ResearchPipelinePreflightIssue {
  id: ResearchContextReadinessRow["id"];
  label: string;
  value: string;
  detail: string;
  status: Exclude<ResearchContextReadinessStatus, "ready">;
  action?: ResearchContextReadinessAction;
}

export interface ResearchPipelinePreflight {
  status: ResearchContextReadinessStatus;
  canRun: boolean;
  requiresConfirmation: boolean;
  summary: string;
  primaryAction?: ResearchContextReadinessAction;
  issues: ResearchPipelinePreflightIssue[];
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

const defaultStrategyRuleDraft: StrategyRuleDraft = {
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

const strategyTemplateOptions: StrategyTemplateOption[] = [
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

const primaryQuantLoopStepDefinitions = [
  { id: "research", label: "Market Research" },
  { id: "strategy", label: "Strategy Lab" },
  { id: "backtest", label: "Backtest Review" },
  { id: "agent-review", label: "Agent Review" },
  { id: "paper", label: "Paper Trading" }
] as const;

const productDevelopmentStageDefinitions = [
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
    label: "Stage 1 · Market and Research",
    status: "current",
    workAreaIds: ["market", "research"],
    focus: "Finish the reliable search, quote, K-line, cache, data-quality, and notes loop before expanding later work.",
    exitCriteria: [
      "A-share, US, and crypto symbols can be searched and selected from the UI.",
      "The selected symbol and timeframe drive quotes, K-lines, cache status, chart, and research notes.",
      "Every fallback, stale cache, incomplete source, and refresh failure is visible to the user."
    ]
  },
  {
    id: "strategy-backtest",
    label: "Stage 2 · Strategy and Backtest",
    status: "planned",
    workAreaIds: ["strategy", "backtest"],
    focus: "Resume only after Stage 1 exits; build a maintainable strategy lab and reproducible backtest evidence loop.",
    exitCriteria: [
      "Strategy drafts are fully structured and versioned.",
      "Backtests are reproducible from strategy, data snapshot, and assumptions.",
      "Reports compare runs without creating optimization or trading advice."
    ]
  },
  {
    id: "ai-review",
    label: "Stage 3 · AI Review",
    status: "planned",
    workAreaIds: ["ai-review"],
    focus: "Run TradingAgents-style review only from audited evidence after strategy and backtest contracts are stable.",
    exitCriteria: [
      "AI records cite run id, strategy revision, metrics, data quality, and report artifacts.",
      "No AI action can bypass evidence or output direct buy or sell advice.",
      "Saved AI reviews replay correctly from the audit record."
    ]
  },
  {
    id: "portfolio-paper",
    label: "Stage 4 · Portfolio and Paper Trading",
    status: "planned",
    workAreaIds: ["portfolio", "execution"],
    focus: "Move into portfolio risk, paper orders, and lifecycle replay after single-strategy evidence is dependable.",
    exitCriteria: [
      "Portfolio backtest, risk checks, paper orders, approvals, and simulations share one auditable lifecycle.",
      "Paper accounts and positions replay deterministically.",
      "Live routes remain blocked by adapter, risk, and human gates."
    ]
  },
  {
    id: "live-readiness",
    label: "Stage 5 · Live Readiness",
    status: "planned",
    workAreaIds: [],
    focus: "Prepare certified broker and exchange adapters only after paper trading and audit gates are mature.",
    exitCriteria: [
      "Adapter authentication, account sync, order lifecycle, and reconciliation are testable without real funds.",
      "Every live candidate cites strategy, backtest, AI review, risk approval, adapter state, and human confirmation.",
      "No live route is enabled by default."
    ]
  }
] as const satisfies readonly ProductDevelopmentStage[];

const productWorkAreaDefinitions = [
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
    deliveryStageId: "portfolio-paper"
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
    actionId: primaryItem?.actionId ?? workspaceContext.actionId,
    actionLabel: primaryItem?.actionLabel ?? null
  };
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
  const auditBinding = buildResearchRunContextBinding(workspace);
  const usableRun = auditBinding.canUseRun ? workspace.researchRun : null;

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
      evidence: usableRun
        ? `Audited run ${usableRun.runId} · ${usableRun.dataRows} bars`
        : auditBinding.status === "mismatched"
          ? auditBinding.detail
          : "No audited run is bound to this research context yet.",
      verdict: "watch",
      confidence: usableRun ? 66 : 60,
      tone: "ai"
    }
  ];
}

export function buildAiEvidenceCards(workspace: TerminalWorkspace): AiEvidenceCard[] {
  const selected = workspace.selectedInstrument;
  const auditBinding = buildResearchRunContextBinding(workspace);
  const usableRun = auditBinding.canUseRun ? workspace.researchRun : null;
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const gateDetail = workspace.execution.gates
    .map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`)
    .join(" · ");
  const researchNote = normalizedResearchNote(usableRun?.researchNote);
  const cards: AiEvidenceCard[] = [
    {
      id: "context",
      label: "Research context",
      value: `${selected.symbol} · ${workspace.selectedTimeframe}`,
      detail: `${selected.market} · price ${formatInstrumentPrice(selected.price)}`,
      tone: "neutral"
    },
    usableRun
      ? {
          id: "backtest",
          label: "Backtest evidence",
          value: `${usableRun.dataRows} ${usableRun.timeframe} bars`,
          detail: `Audited run ${usableRun.runId} · revision ${usableRun.strategyRevision}`,
          tone: "positive"
        }
      : auditBinding.status === "mismatched"
        ? {
            id: "backtest",
            label: "Backtest evidence",
            value: "Stale audited run",
            detail: auditBinding.detail,
            tone: "risk"
          }
      : {
          id: "backtest",
          label: "Backtest evidence",
          value: "Pending audited run",
          detail: "Run Pipeline before trusting AI review.",
          tone: "warning"
        },
  ];

  if (usableRun) {
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
  const auditBinding = buildResearchRunContextBinding(workspace);
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

  if (!auditBinding.canUseRun) {
    return {
      status: "blocked",
      headline: "Current audit context required",
      summary: "Run Pipeline to bind AI review to the selected research context before exporting or saving records.",
      citations: [
        {
          id: "run",
          label: "Run id",
          value: auditBinding.runId ?? "Stale audited run",
          detail: auditBinding.detail,
          tone: "risk"
        },
        {
          id: "data-quality",
          label: "Data quality",
          value: "Stale context",
          detail: "Data quality cannot be trusted until the run matches the selected market, symbol, and timeframe.",
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
  const parameterScanSummary = buildBacktestParameterScanSummary(workspace);
  const benchmarkCitation: AiReviewCitation = {
    id: "benchmark",
    label: "Benchmark alpha",
    value: benchmark.alpha,
    detail: aiBenchmarkDetail(benchmark),
    tone: benchmark.tone
  };
  const parameterScanCitation: AiReviewCitation | null = parameterScanSummary
    ? {
        id: "parameter-scan",
        label: "Parameter scan",
        value: parameterScanSummary.headline,
        detail: parameterScanSummary.detail,
        tone: parameterScanSummary.tone
      }
    : null;
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
      ...(parameterScanCitation ? [parameterScanCitation] : []),
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
  const parameterScanSummary = buildBacktestParameterScanSummary(workspace);
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
    "## Parameter Scan Summary",
    "",
    parameterScanSummary
      ? markdownTable(
          ["Field", "Value"],
          [
            ["Rows", parameterScanSummary.totalRows],
            [
              "Current rank",
              parameterScanSummary.currentRank
                ? `${parameterScanSummary.currentRank}/${parameterScanSummary.totalRows}`
                : "N/A"
            ],
            ["Candidate for re-audit", parameterScanSummary.bestCandidateCondition ?? "N/A"],
            ["Candidate return", parameterScanSummary.bestCandidateReturnPct],
            ["Candidate max drawdown", parameterScanSummary.bestCandidateMaxDrawdownPct],
            ["Candidate delta", parameterScanSummary.bestCandidateDelta],
            ["Risk rows", parameterScanSummary.riskCount],
            ["Boundary", "Candidate must be re-audited; no investment advice."]
          ]
        )
      : "Parameter scan summary requires an audited data snapshot.",
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
    "This report can explain only the audited run, locked strategy revision, data snapshot, benchmark comparison, parameter scan summary, and risk gates above."
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trimEnd()
    .concat("\n");
}

export function buildAiReviewRunRecord(workspace: TerminalWorkspace): AiReviewRunRecord | null {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const dossier = buildAiReviewDossier(workspace);
  if (dossier.status !== "ready") {
    return null;
  }

  const rounds = buildAgentCommitteeRounds(workspace);
  const decisionLog = workspace.decisionLog.slice();
  const citations = dossier.citations.slice();
  const evidenceAnchors = buildAiReviewEvidenceAnchors(run, citations, rounds, decisionLog);

  return {
    schemaVersion: 1,
    recordType: "aiqt.aiReviewRun",
    aiReviewId: `ai-review:${run.runId}:${run.strategyRevision}`,
    runId: run.runId,
    createdAt: run.createdAt,
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    timeframe: run.timeframe,
    strategyRevision: run.strategyRevision,
    executionMode: run.executionMode,
    status: dossier.status,
    summary: {
      citationCount: citations.length,
      roundCount: rounds.length,
      decisionCount: decisionLog.length,
      parameterScanBound: citations.some((citation) => citation.id === "parameter-scan"),
      liveExecutionBlocked: !workspace.execution.liveEnabled
    },
    dossier,
    citations,
    rounds,
    decisionLog,
    evidenceAnchors,
    boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
  };
}

function buildAiReviewEvidenceAnchors(
  run: ResearchRunSummary | ResearchRunAudit,
  citations: AiReviewCitation[],
  rounds: AgentCommitteeRound[],
  decisionLog: DecisionLogEntry[]
): AiReviewEvidenceAnchor[] {
  const anchors: AiReviewEvidenceAnchor[] = [
    {
      id: `run:${run.runId}`,
      type: "research-run",
      label: "Research run",
      reference: run.runId,
      exportPath: "researchRun.runId"
    },
    {
      id: `strategy:${run.strategyRevision}`,
      type: "strategy-revision",
      label: "Strategy revision",
      reference: run.strategyRevision,
      exportPath: "researchRun.strategyConfig.revision"
    }
  ];

  if (run.dataSnapshot?.hash) {
    anchors.push({
      id: `data:${run.dataSnapshot.hash}`,
      type: "data-snapshot",
      label: "Data snapshot",
      reference: run.dataSnapshot.hash,
      exportPath: "researchRun.dataSnapshot.hash"
    });
  }

  citations.forEach((citation) => {
    anchors.push({
      id: `citation:${citation.id}`,
      type: "citation",
      label: citation.label,
      reference: citation.id,
      exportPath: `aiReviewRuns[].record.citations[${citation.id}]`
    });
  });

  anchors.push(
    {
      id: `committee:${rounds.length}-rounds`,
      type: "committee-rounds",
      label: "Committee rounds",
      reference: String(rounds.length),
      exportPath: "aiReviewRuns[].record.rounds"
    },
    {
      id: `decision-log:${decisionLog.length}`,
      type: "decision-log",
      label: "Decision log",
      reference: String(decisionLog.length),
      exportPath: "aiReviewRuns[].record.decisionLog"
    },
    {
      id: "boundary:evidence-explanation-only",
      type: "risk-boundary",
      label: "AI boundary",
      reference: "Evidence explanation only",
      exportPath: "aiReviewRuns[].record.boundary"
    }
  );

  return anchors;
}

export function buildAiReviewRecordDriftRows({
  currentCitationCount,
  currentRunId,
  currentStatus,
  currentStrategyRevision,
  liveExecutionBlocked,
  records,
  roundCount
}: {
  currentCitationCount: number;
  currentRunId: string | null;
  currentStatus: AiReviewDossier["status"];
  currentStrategyRevision: string;
  liveExecutionBlocked: boolean;
  records: AiReviewRunRecord[];
  roundCount: number;
}): AiReviewRecordDriftRow[] {
  return records.map((record) => {
    const driftReasons: AiReviewRecordDriftReason[] = [];
    if (!currentRunId || record.runId !== currentRunId) {
      driftReasons.push("run");
    }
    if (record.strategyRevision !== currentStrategyRevision) {
      driftReasons.push("strategy");
    }
    if (record.status !== currentStatus) {
      driftReasons.push("status");
    }
    if (record.summary.citationCount !== currentCitationCount) {
      driftReasons.push("citations");
    }
    if (record.summary.roundCount !== roundCount) {
      driftReasons.push("rounds");
    }
    if (record.summary.liveExecutionBlocked !== liveExecutionBlocked) {
      driftReasons.push("boundary");
    }

    return {
      aiReviewId: record.aiReviewId,
      createdAt: record.createdAt,
      strategyRevision: record.strategyRevision,
      citationCount: record.summary.citationCount,
      roundCount: record.summary.roundCount,
      liveExecutionBlocked: record.summary.liveExecutionBlocked,
      status: driftReasons.length ? "drift" : "matched",
      driftCount: driftReasons.length,
      driftReasons
    };
  });
}

export function filterAiReviewRecordDriftRows(
  rows: AiReviewRecordDriftRow[],
  query: string
): AiReviewRecordDriftRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) =>
    [
      row.aiReviewId,
      row.createdAt,
      row.strategyRevision,
      row.status,
      row.driftCount.toString(),
      row.citationCount.toString(),
      row.roundCount.toString(),
      row.liveExecutionBlocked ? "paper only blocked" : "live open",
      ...row.driftReasons
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function buildAiReviewAuditTimelineItems({
  currentRunId,
  currentStrategyRevision,
  dossier,
  records,
  riskApproval
}: {
  currentRunId: string | null;
  currentStrategyRevision: string;
  dossier: AiReviewDossier;
  records: AiReviewRunRecord[];
  riskApproval: RiskApprovalSummary;
}): AiReviewAuditTimelineItem[] {
  const currentEvidenceReady = Boolean(currentRunId) && dossier.status === "ready";
  const currentRunReference = currentRunId ?? "pending-audit-run";
  const savedRecordItems = [...records]
    .sort((left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt))
    .map((record) => ({
      id: `saved:${record.aiReviewId}`,
      kind: "saved-review" as const,
      label: "Saved AI review",
      value: `${record.strategyRevision} · ${record.summary.citationCount} citations · ${record.summary.roundCount} rounds`,
      detail: record.dossier.headline,
      reference: record.aiReviewId,
      exportAnchor: `aiReviewRun:${record.aiReviewId}`,
      createdAt: record.createdAt,
      targetWorkspaceId: null,
      targetRecordId: record.aiReviewId,
      actionLabel: "Compare saved review",
      status: record.status === "ready" ? ("passed" as const) : ("blocked" as const),
      tone: record.status === "ready" ? ("ai" as const) : ("risk" as const)
    }));

  return [
    {
      id: `current:${currentRunReference}`,
      kind: "current-evidence",
      label: "Current audit evidence",
      value: currentRunId
        ? `${currentStrategyRevision} · ${dossier.citations.length} citations`
        : `${currentStrategyRevision} · no audited run`,
      detail: dossier.headline,
      reference: currentRunReference,
      exportAnchor: `run:${currentRunReference}`,
      createdAt: null,
      targetWorkspaceId: "backtest",
      targetRecordId: null,
      actionLabel: "Open backtest evidence",
      status: currentEvidenceReady ? "passed" : "blocked",
      tone: currentEvidenceReady ? "ai" : "risk"
    },
    ...savedRecordItems,
    {
      id: `risk:${riskApproval.status}`,
      kind: "risk-approval",
      label: "Risk approval",
      value: riskApproval.headline,
      detail: riskApproval.summary,
      reference: `risk:${riskApproval.status}`,
      exportAnchor: `riskApproval:${riskApproval.status}`,
      createdAt: null,
      targetWorkspaceId: "execution",
      targetRecordId: null,
      actionLabel: "Open execution approval",
      status:
        riskApproval.status === "live_ready" ? "passed" : riskApproval.status === "paper_ready" ? "review" : "blocked",
      tone:
        riskApproval.status === "live_ready" ? "positive" : riskApproval.status === "paper_ready" ? "warning" : "risk"
    }
  ];
}

export function buildAiReviewExportEvidenceIndexRows({
  currentRecord,
  records,
  timelineItems
}: {
  currentRecord: AiReviewRunRecord | null;
  records: AiReviewRunRecord[];
  timelineItems: AiReviewAuditTimelineItem[];
}): AiReviewExportEvidenceIndexRow[] {
  const rows: AiReviewExportEvidenceIndexRow[] = [];

  currentRecord?.evidenceAnchors?.forEach((anchor) => {
    rows.push({
      id: `current:${anchor.id}`,
      group: "current-record",
      label: anchor.label,
      anchor: anchor.id,
      reference: anchor.reference,
      exportPath: anchor.exportPath,
      detail: `Current AI review record · ${currentRecord.aiReviewId}`,
      tone: anchor.type === "risk-boundary" ? "risk" : "ai"
    });
  });

  records.forEach((record) => {
    record.evidenceAnchors?.forEach((anchor) => {
      rows.push({
        id: `saved:${record.aiReviewId}:${anchor.id}`,
        group: "saved-record",
        label: `${record.strategyRevision} · ${anchor.label}`,
        anchor: anchor.id,
        reference: anchor.reference,
        exportPath: anchor.exportPath,
        detail: `Saved AI review record · ${record.aiReviewId}`,
        tone: anchor.type === "risk-boundary" ? "risk" : "neutral"
      });
    });
  });

  timelineItems.forEach((item) => {
    rows.push({
      id: `timeline:${item.reference}`,
      group: "timeline",
      label: item.label,
      anchor: item.exportAnchor,
      reference: item.reference,
      exportPath: auditTimelineExportPath(item),
      detail: item.detail,
      tone: item.tone
    });
  });

  return rows;
}

export function filterAiReviewExportEvidenceIndexRows(
  rows: AiReviewExportEvidenceIndexRow[],
  query: string
): AiReviewExportEvidenceIndexRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) =>
    [row.group, row.label, row.anchor, row.reference, row.exportPath, row.detail, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function buildResearchRunExportPreviewRows({
  aiReviewRecords = [],
  currentAiReviewRecord = null,
  paperExecution = null,
  promotionCandidate = null,
  riskApproval = null,
  workspace
}: {
  workspace: TerminalWorkspace;
  currentAiReviewRecord?: AiReviewRunRecord | null;
  aiReviewRecords?: ResearchRunExportPreviewAiReviewEnvelope[];
  paperExecution?: PaperExecutionSnapshot | null;
  promotionCandidate?: ResearchRunExportPreviewPromotionCandidate | null;
  riskApproval?: RiskApprovalSummary | null;
}): ResearchRunExportPreviewRow[] {
  const run = workspace.researchRun ?? null;
  const runId = run?.runId ?? "pending-run";
  const dataSnapshot = run?.dataSnapshot ?? null;
  const researchNote = normalizedResearchNote(run?.researchNote);
  const activePaperExecution = run && paperExecution?.runId === run.runId ? paperExecution : null;
  const activePromotionCandidate =
    run && promotionCandidate?.runId && promotionCandidate.runId === run.runId ? promotionCandidate : null;
  const activeAiReviewRecords = run
    ? aiReviewRecords.filter((record) => record.runId === run.runId)
    : [];
  const latestAiReviewRecord = activeAiReviewRecords[0] ?? null;
  const currentRecordReady = Boolean(currentAiReviewRecord && run && currentAiReviewRecord.runId === run.runId);
  const backtestTradeCount = workspace.backtestTrades?.length ?? 0;
  const equityPointCount = workspace.backtestEquityCurve?.length ?? 0;

  return [
    {
      id: "research-run",
      label: "Research run",
      status: run ? "ready" : "blocked",
      count: run ? "1" : "0",
      anchor: `run:${runId}`,
      exportPath: "researchRun",
      detail: run
        ? `${workspace.selectedInstrument.symbol} · ${run.timeframe} · ${run.strategyRevision} · ${run.dataRows} bars`
        : "Run Pipeline before an export package can be reproduced.",
      tone: run ? "positive" : "risk"
    },
    {
      id: "data-snapshot",
      label: "Data snapshot",
      status:
        run && dataSnapshot?.hash && Number.isFinite(dataSnapshot.rows) && dataSnapshot.rows > 0
          ? "ready"
          : run
            ? "missing"
            : "blocked",
      count: dataSnapshot ? String(dataSnapshot.rows) : "0",
      anchor: dataSnapshot?.hash ? `dataSnapshot:${dataSnapshot.hash}` : `dataSnapshot:${runId}:missing`,
      exportPath: "researchRun.dataSnapshot",
      detail: dataSnapshot
        ? `${dataSnapshot.source} · ${dataSnapshot.hash} · ${formatWarningCount(dataSnapshot.warnings.length)}`
        : run
          ? "The audited run did not include a local data snapshot hash."
          : "A research run is required before data can be exported.",
      tone:
        run && dataSnapshot?.hash && Number.isFinite(dataSnapshot.rows) && dataSnapshot.rows > 0
          ? dataSnapshot.warnings.length
            ? "warning"
            : "positive"
          : run
            ? "warning"
            : "risk"
    },
    {
      id: "strategy-config",
      label: "Strategy config",
      status: run?.strategyConfig ? "ready" : run ? "missing" : "blocked",
      count: run?.strategyConfig ? `${run.strategyConfig.entryConditions.length}/${run.strategyConfig.exitConditions.length}` : "0/0",
      anchor: run?.strategyConfig ? `strategy:${run.strategyConfig.revision}` : `strategy:${runId}:missing`,
      exportPath: "researchRun.strategyConfig",
      detail: run?.strategyConfig
        ? `${run.strategyConfig.name} · v${run.strategyConfig.version} · ${run.strategyConfig.symbols.join(", ")}`
        : run
          ? "The export can replay the run, but structured strategy rules are missing."
          : "Run Pipeline after saving a strategy to bind structured rules.",
      tone: run?.strategyConfig ? "positive" : run ? "warning" : "risk"
    },
    {
      id: "research-note",
      label: "Research note",
      status: researchNote ? "ready" : run ? "missing" : "blocked",
      count: researchNote ? "1" : "0",
      anchor: researchNote ? `researchNote:${researchNote.symbol}:${researchNote.timeframe}` : `researchNote:${runId}:missing`,
      exportPath: "researchRun.researchNote",
      detail: researchNote
        ? compactResearchNoteDetail(researchNote.body)
        : run
          ? "No research note is attached to this run; add one for stronger replay context."
          : "Research notes are bound after a run is created.",
      tone: researchNote ? "ai" : run ? "neutral" : "risk"
    },
    {
      id: "backtest-trades",
      label: "Backtest trades",
      status: backtestTradeCount > 0 || equityPointCount > 0 ? "ready" : run ? "missing" : "blocked",
      count:
        backtestTradeCount > 0 || equityPointCount > 0
          ? `${backtestTradeCount} trades / ${equityPointCount} equity`
          : "0 trades / 0 equity",
      anchor: `backtest:${runId}`,
      exportPath: "researchRun.backtestTrades",
      detail:
        backtestTradeCount > 0 || equityPointCount > 0
          ? "Trade blotter and equity curve are available for replay."
          : run
            ? "The run summary is bound, but the trade blotter or equity curve is missing."
            : "Run Pipeline before backtest replay artifacts are exported.",
      tone: backtestTradeCount > 0 || equityPointCount > 0 ? "positive" : run ? "warning" : "risk"
    },
    {
      id: "ai-review-runs",
      label: "AI review runs",
      status: activeAiReviewRecords.length > 0 ? "ready" : currentRecordReady ? "missing" : run ? "missing" : "blocked",
      count: `${activeAiReviewRecords.length} saved / ${currentRecordReady ? "current ready" : "current missing"}`,
      anchor: latestAiReviewRecord
        ? `aiReviewRun:${latestAiReviewRecord.aiReviewId}`
        : currentRecordReady
          ? `aiReviewRun:${currentAiReviewRecord?.aiReviewId}`
          : `aiReviewRun:${runId}:missing`,
      exportPath: "aiReviewRuns[]",
      detail:
        activeAiReviewRecords.length > 0
          ? "Saved AI review records are attached to this export package."
          : currentRecordReady
            ? "Current AI evidence is ready, but it has not been saved into the export package yet."
            : run
              ? "Run and save an AI review record before relying on exported AI evidence."
              : "A research run is required before AI review records can be exported.",
      tone: activeAiReviewRecords.length > 0 ? "ai" : currentRecordReady || run ? "warning" : "risk"
    },
    {
      id: "paper-executions",
      label: "Paper executions",
      status: activePaperExecution ? "ready" : run ? "missing" : "blocked",
      count: activePaperExecution ? `${activePaperExecution.orders.length} order${activePaperExecution.orders.length === 1 ? "" : "s"}` : "0 orders",
      anchor: activePaperExecution ? `paperExecution:${activePaperExecution.executionId}` : `paperExecution:${runId}:missing`,
      exportPath: "paperExecutions[]",
      detail: activePaperExecution
        ? `${activePaperExecution.mode} · ${activePaperExecution.gates.filter((gate) => gate.passed).length}/${activePaperExecution.gates.length} gates passed`
        : run
          ? "Submit a paper order to attach execution evidence to the run package."
          : "Paper execution waits for an audited run.",
      tone: activePaperExecution ? "positive" : run ? "warning" : "risk"
    },
    {
      id: "promotion-candidate",
      label: "Promotion candidate",
      status: activePromotionCandidate
        ? activePromotionCandidate.status === "live_ready" || activePromotionCandidate.liveTradingAllowed
          ? "ready"
          : "blocked"
        : run
          ? "missing"
          : "blocked",
      count: activePromotionCandidate?.evidence
        ? `${activePromotionCandidate.evidence.filledOrders} fills / ${activePromotionCandidate.evidence.passedPaperRiskChecks} risk`
        : "0 fills / 0 risk",
      anchor: activePromotionCandidate?.candidateId
        ? `promotion:${activePromotionCandidate.candidateId}`
        : `promotion:${runId}:missing`,
      exportPath: "promotionCandidate",
      detail: activePromotionCandidate
        ? activePromotionCandidate.summary ?? "Promotion evidence is attached, but live execution remains blocked."
        : run
          ? "Create a paper execution before promotion evidence can be attached."
          : "Promotion evidence waits for a research run.",
      tone:
        activePromotionCandidate?.status === "live_ready" || activePromotionCandidate?.liveTradingAllowed
          ? "positive"
          : activePromotionCandidate
            ? "warning"
            : run
              ? "neutral"
              : "risk"
    },
    {
      id: "execution-handoff",
      label: "Execution handoff",
      status: run && riskApproval && riskApproval.status !== "blocked" ? "ready" : run ? "blocked" : "blocked",
      count: riskApproval ? `${riskApproval.gates.filter((gate) => gate.status === "passed").length}/${riskApproval.gates.length}` : "0/0",
      anchor: riskApproval ? `riskApproval:${riskApproval.status}` : `riskApproval:${runId}:missing`,
      exportPath: "executionHandoff.requiredGates",
      detail: riskApproval
        ? riskApproval.summary
        : "Execution handoff gates are created after an audited run is available.",
      tone: riskApproval?.status === "live_ready" ? "positive" : riskApproval?.status === "paper_ready" ? "warning" : "risk"
    }
  ];
}

export function filterResearchRunExportPreviewRows(
  rows: ResearchRunExportPreviewRow[],
  query: string
): ResearchRunExportPreviewRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [row.id, row.label, row.status, row.count, row.anchor, row.exportPath, row.detail, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function buildResearchRunExportBrowserRows(
  exportPackage: ResearchRunExportBrowserPackage | null | undefined
): ResearchRunExportBrowserRow[] {
  if (!exportPackage) {
    return [
      {
        id: "package",
        label: "Export package",
        status: "blocked",
        value: "No package selected",
        detail: "Inspect a run from history to load its manifest and artifact counts.",
        exportPath: "manifest.runId",
        tone: "risk"
      }
    ];
  }

  const { artifactCounts } = exportPackage.manifest;
  const paperPackageCount = exportPackage.paperExecutions?.length ?? 0;
  const portfolioPaperOrderPackageCount = exportPackage.portfolioPaperOrderBatches?.length ?? 0;
  const portfolioPaperOrderApprovalPackageCount = exportPackage.portfolioPaperOrderApprovals?.length ?? 0;
  const portfolioPaperOrderSimulationPackageCount = exportPackage.portfolioPaperOrderSimulations?.length ?? 0;
  const aiReviewPackageCount = exportPackage.aiReviewRuns?.length ?? 0;
  const promotionPackageCount = exportPackage.promotionCandidate ? 1 : 0;
  const passedGateCount = exportPackage.executionHandoff.requiredGates.filter((gate) => gate.passed).length;
  const totalGateCount = exportPackage.executionHandoff.requiredGates.length;
  const integrityHash = exportPackage.integrity?.hash ?? "";
  const auditSummary = exportPackage.auditEvidenceSummary;
  const auditReport = exportPackage.auditReport;
  const backtestReport = exportPackage.backtestReport;
  const auditSummaryIsReady =
    auditSummary?.kind === "aiqt.auditEvidenceSummary" &&
    auditSummary.schemaVersion === 1 &&
    auditSummary.runId === exportPackage.manifest.runId &&
    auditSummary.copyText.trim() !== "";
  const auditReportHash = auditReport?.contentSha256.hash ?? "";
  const auditReportIsReady =
    auditReport?.kind === "aiqt.auditReport" &&
    auditReport.schemaVersion === 1 &&
    auditReport.runId === exportPackage.manifest.runId &&
    auditReport.format === "text/markdown" &&
    auditReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(auditReportHash) &&
    auditReport.contentMarkdown.trim() !== "";
  const backtestReportHash = backtestReport?.contentSha256.hash ?? "";
  const backtestReportIsReady =
    backtestReport?.kind === "aiqt.backtestReport" &&
    backtestReport.schemaVersion === 1 &&
    backtestReport.runId === exportPackage.manifest.runId &&
    backtestReport.format === "text/markdown" &&
    backtestReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(backtestReportHash) &&
    backtestReport.contentMarkdown.trim() !== "";
  const auditReportSignatureDetail = researchRunExportReportSignatureDetail(auditReport?.signature);
  const backtestReportSignatureDetail = researchRunExportReportSignatureDetail(backtestReport?.signature);
  const integrityIsReady = exportPackage.integrity?.algorithm === "sha256" && /^[a-f0-9]{64}$/iu.test(integrityHash);
  const dataIsReady =
    artifactCounts.bars === exportPackage.manifest.dataRows &&
    artifactCounts.bars > 0 &&
    exportPackage.manifest.dataHash.trim() !== "";
  const backtestIsReady = artifactCounts.trades > 0 && artifactCounts.equityPoints > 0;
  const paperCountMatches = (artifactCounts.paperExecutions ?? 0) === paperPackageCount;
  const portfolioPaperOrderCountMatches =
    (artifactCounts.portfolioPaperOrderBatches ?? 0) === portfolioPaperOrderPackageCount &&
    (artifactCounts.portfolioPaperOrderApprovals ?? 0) === portfolioPaperOrderApprovalPackageCount &&
    (artifactCounts.portfolioPaperOrderSimulations ?? 0) === portfolioPaperOrderSimulationPackageCount;
  const portfolioPaperOrderPackageHasLedger =
    portfolioPaperOrderPackageCount + portfolioPaperOrderApprovalPackageCount + portfolioPaperOrderSimulationPackageCount >
    0;
  const portfolioPaperOrderMismatchDetail = [
    (artifactCounts.portfolioPaperOrderBatches ?? 0) === portfolioPaperOrderPackageCount
      ? ""
      : `portfolioPaperOrderBatches ${artifactCounts.portfolioPaperOrderBatches ?? 0}/${portfolioPaperOrderPackageCount}`,
    (artifactCounts.portfolioPaperOrderApprovals ?? 0) === portfolioPaperOrderApprovalPackageCount
      ? ""
      : `portfolioPaperOrderApprovals ${artifactCounts.portfolioPaperOrderApprovals ?? 0}/${portfolioPaperOrderApprovalPackageCount}`,
    (artifactCounts.portfolioPaperOrderSimulations ?? 0) === portfolioPaperOrderSimulationPackageCount
      ? ""
      : `portfolioPaperOrderSimulations ${artifactCounts.portfolioPaperOrderSimulations ?? 0}/${portfolioPaperOrderSimulationPackageCount}`
  ].filter(Boolean);
  const promotionCountMatches = (artifactCounts.promotionCandidates ?? 0) === promotionPackageCount;
  const aiReviewCountMatches = (artifactCounts.aiReviewRuns ?? 0) === aiReviewPackageCount;

  return [
    {
      id: "package",
      label: "Export package",
      status: "ready",
      value: `${exportPackage.manifest.runId} · ${exportPackage.manifest.strategyRevision}`,
      detail: `${exportPackage.manifest.symbol} · ${exportPackage.manifest.timeframe} · exported ${exportPackage.exportedAt}`,
      exportPath: "manifest.runId",
      tone: "positive"
    },
    {
      id: "integrity",
      label: "Integrity",
      status: integrityIsReady ? "ready" : "missing",
      value: exportPackage.integrity ? `${exportPackage.integrity.algorithm} · ${integrityHash.slice(0, 8)}` : "No hash",
      detail: integrityIsReady
        ? "Canonical SHA-256 integrity metadata is present."
        : "Integrity metadata is missing or malformed.",
      exportPath: "integrity.hash",
      tone: integrityIsReady ? "positive" : "warning"
    },
    {
      id: "data",
      label: "Data snapshot",
      status: dataIsReady ? "ready" : "blocked",
      value: `${artifactCounts.bars}/${exportPackage.manifest.dataRows} bars`,
      detail: `${exportPackage.manifest.dataHash || "missing hash"} · ${exportPackage.manifest.market}`,
      exportPath: "manifest.artifactCounts.bars",
      tone: dataIsReady ? "positive" : "risk"
    },
    {
      id: "backtest",
      label: "Backtest replay",
      status: backtestIsReady ? "ready" : "missing",
      value: `${artifactCounts.trades} trades / ${artifactCounts.equityPoints} equity`,
      detail: `${artifactCounts.decisions} decisions · ${artifactCounts.aiRisks} AI risks`,
      exportPath: "researchRun.backtestTrades",
      tone: backtestIsReady ? "positive" : "warning"
    },
    ...(backtestReport
      ? ([
          {
            id: "backtest-report",
            label: "Backtest report",
            status: backtestReportIsReady ? "ready" : "blocked",
            value: backtestReport.contentSha256
              ? `${backtestReport.contentSha256.algorithm} · ${backtestReportHash.slice(0, 8)}`
              : "No content hash",
            detail: backtestReportIsReady
              ? [
                  `${backtestReport.fileName} · ${backtestReport.runComparisonRows} comparable runs`,
                  backtestReportSignatureDetail
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Backtest report artifact is missing valid Markdown content or SHA-256 metadata.",
            exportPath: "backtestReport.contentSha256.hash",
            tone: backtestReportIsReady ? "ai" : "risk"
          }
        ] satisfies ResearchRunExportBrowserRow[])
      : []),
    {
      id: "research-note",
      label: "Research note",
      status: (artifactCounts.researchNotes ?? 0) > 0 ? "ready" : "missing",
      value: `${artifactCounts.researchNotes ?? 0} note`,
      detail:
        (artifactCounts.researchNotes ?? 0) > 0
          ? "Locked research context is declared in the manifest."
          : "No locked research note is declared in this package.",
      exportPath: "researchRun.researchNote",
      tone: (artifactCounts.researchNotes ?? 0) > 0 ? "ai" : "neutral"
    },
    {
      id: "paper-executions",
      label: "Paper executions",
      status: paperCountMatches && paperPackageCount > 0 ? "ready" : paperCountMatches ? "missing" : "blocked",
      value: `${artifactCounts.paperExecutions ?? 0} manifest / ${paperPackageCount} package`,
      detail: paperCountMatches
        ? "Manifest and package paper execution counts match."
        : "Manifest paper execution count does not match the package payload.",
      exportPath: "paperExecutions[]",
      tone: paperCountMatches && paperPackageCount > 0 ? "positive" : paperCountMatches ? "neutral" : "risk"
    },
    {
      id: "portfolio-paper-orders",
      label: "Portfolio paper orders",
      status:
        portfolioPaperOrderCountMatches && portfolioPaperOrderPackageHasLedger
          ? "ready"
          : portfolioPaperOrderCountMatches
            ? "missing"
            : "blocked",
      value: `${artifactCounts.portfolioPaperOrderBatches ?? 0} batches / ${artifactCounts.portfolioPaperOrderApprovals ?? 0} approvals / ${artifactCounts.portfolioPaperOrderSimulations ?? 0} fills`,
      detail: portfolioPaperOrderCountMatches
        ? "Portfolio paper order batch, approval, and simulated-fill counts match the package payload. portfolioPaperOrderBatches / portfolioPaperOrderApprovals / portfolioPaperOrderSimulations"
        : `Portfolio paper order manifest count does not match the package payload: ${portfolioPaperOrderMismatchDetail.join(", ")}.`,
      exportPath: "portfolioPaperOrderBatches[] portfolioPaperOrderApprovals[] portfolioPaperOrderSimulations[]",
      tone:
        portfolioPaperOrderCountMatches && portfolioPaperOrderPackageHasLedger
          ? "warning"
          : portfolioPaperOrderCountMatches
            ? "neutral"
            : "risk"
    },
    {
      id: "promotion-candidate",
      label: "Promotion candidate",
      status: promotionCountMatches && promotionPackageCount > 0 ? "ready" : promotionCountMatches ? "missing" : "blocked",
      value: `${artifactCounts.promotionCandidates ?? 0} manifest / ${promotionPackageCount} package`,
      detail: exportPackage.promotionCandidate?.summary ?? "No promotion candidate payload is attached.",
      exportPath: "promotionCandidate",
      tone: promotionCountMatches && promotionPackageCount > 0 ? "warning" : promotionCountMatches ? "neutral" : "risk"
    },
    {
      id: "ai-reviews",
      label: "AI review records",
      status: aiReviewCountMatches && aiReviewPackageCount > 0 ? "ready" : aiReviewCountMatches ? "missing" : "blocked",
      value: `${artifactCounts.aiReviewRuns ?? 0} manifest / ${aiReviewPackageCount} package`,
      detail: aiReviewCountMatches
        ? "AI review record count matches the export package payload."
        : "AI review manifest count does not match the package payload.",
      exportPath: "aiReviewRuns[]",
      tone: aiReviewCountMatches && aiReviewPackageCount > 0 ? "ai" : aiReviewCountMatches ? "neutral" : "risk"
    },
    ...(auditSummary
      ? ([
          {
            id: "audit-summary",
            label: "Audit evidence summary",
            status: auditSummaryIsReady ? "ready" : "blocked",
            value: `${auditSummary.package.matched}/${auditSummary.package.total} package · ${auditSummary.importDiff.blocked} diff blocked`,
            detail: auditSummaryIsReady
              ? `Copyable audit focus embedded at ${auditSummary.generatedAt}.`
              : "Audit evidence summary metadata does not match this export package.",
            exportPath: "auditEvidenceSummary",
            tone: auditSummaryIsReady ? "ai" : "risk"
          }
        ] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...(auditReport
      ? ([
          {
            id: "audit-report",
            label: "Audit report",
            status: auditReportIsReady ? "ready" : "blocked",
            value: auditReport.contentSha256
              ? `${auditReport.contentSha256.algorithm} · ${auditReportHash.slice(0, 8)}`
              : "No content hash",
            detail: auditReportIsReady
              ? [`${auditReport.fileName} · generated ${auditReport.generatedAt}`, auditReportSignatureDetail]
                  .filter(Boolean)
                  .join(" · ")
              : "Audit report artifact is missing valid Markdown content or SHA-256 metadata.",
            exportPath: "auditReport.contentSha256.hash",
            tone: auditReportIsReady ? "ai" : "risk"
          }
        ] satisfies ResearchRunExportBrowserRow[])
      : []),
    {
      id: "execution-handoff",
      label: "Execution handoff",
      status: exportPackage.executionHandoff.liveTradingAllowed ? "ready" : "blocked",
      value: `${passedGateCount}/${totalGateCount} gates`,
      detail: exportPackage.executionHandoff.liveTradingAllowed
        ? "Live execution handoff is allowed by the package gates."
        : "Package remains paper-only; live execution is blocked.",
      exportPath: "executionHandoff.requiredGates",
      tone: exportPackage.executionHandoff.liveTradingAllowed ? "positive" : "risk"
    }
  ];
}

export function filterResearchRunExportBrowserRows(
  rows: ResearchRunExportBrowserRow[],
  query: string
): ResearchRunExportBrowserRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [row.id, row.label, row.status, row.value, row.detail, row.exportPath, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function researchRunExportReportSignatureMetadata(signature: Record<string, unknown> | undefined): Record<string, unknown> {
  return signature && typeof signature === "object" && !Array.isArray(signature) ? signature : {};
}

function researchRunExportReportSignatureStatus(signature: Record<string, unknown> | undefined): AuditEvidenceReportSignatureStatus {
  return auditReportLedgerSignatureStatus(researchRunExportReportSignatureMetadata(signature));
}

function researchRunExportReportSignatureImportBlockReason(
  signature: Record<string, unknown> | undefined,
  reportLabel: string
): string {
  const status = researchRunExportReportSignatureStatus(signature);
  if (status === "invalid" || status === "revoked") {
    return `${reportLabel} signature is revoked or invalid and cannot be trusted for import.`;
  }
  if (
    (status === "signed" || status === "verified") &&
    !researchRunExportReportSignatureHasRequiredFields(signature, status)
  ) {
    return `${reportLabel} signature metadata is incomplete and cannot be trusted for import.`;
  }
  return "";
}

function researchRunExportAuditReportImportPolicyBlockReason(
  auditReport: ResearchRunExportBrowserPackage["auditReport"] | undefined
): string {
  const invalidImportVerificationCount = auditReport?.evidenceSummary?.importVerification?.invalid ?? 0;
  if (Number.isFinite(invalidImportVerificationCount) && invalidImportVerificationCount > 0) {
    return "Audit report carries invalid imported evidence and cannot be trusted for import.";
  }
  return "";
}

function researchRunExportReportSignatureHasRequiredFields(
  signature: Record<string, unknown> | undefined,
  status: "signed" | "verified"
): boolean {
  const metadata = researchRunExportReportSignatureMetadata(signature);
  const requiredFields = ["algorithm", "chainId", "eventId", "keyId", "signedAt", "signer", "value"];
  if (status === "verified") {
    requiredFields.push("verifiedAt");
  }
  return requiredFields.every((field) => auditReportLedgerMetadataText(metadata, field).trim() !== "");
}

function researchRunExportReportSignatureDetail(signature: Record<string, unknown> | undefined): string {
  const metadata = researchRunExportReportSignatureMetadata(signature);
  const status = auditReportLedgerSignatureStatus(metadata);
  if (status === "unsigned") {
    return "";
  }
  const detail = auditReportLedgerSignatureDetail(metadata);
  return [auditReportLedgerSignatureLabel(status), detail].filter(Boolean).join(" · ");
}

function researchRunExportReportSignatureImportVerificationDetail(signature: Record<string, unknown> | undefined): string {
  const metadata = researchRunExportReportSignatureMetadata(signature);
  const source = auditReportLedgerMetadataText(metadata, "importVerificationSource");
  const status = auditReportLedgerMetadataText(metadata, "importVerificationStatus");
  if (source !== "local-core" || (status !== "verified" && status !== "invalid")) {
    return "";
  }
  return [`Local core import verification: ${status}`, auditReportLedgerMetadataText(metadata, "importVerificationReason")]
    .filter(Boolean)
    .join(" · ");
}

function researchRunExportReportSignatureArtifactSuffix(signature: Record<string, unknown> | undefined): string {
  const status = researchRunExportReportSignatureStatus(signature);
  return status === "unsigned" ? "" : status;
}

export function buildResearchRunExportIndexRows(
  exportPackages: ResearchRunExportBrowserPackage[]
): ResearchRunExportIndexRow[] {
  return [...exportPackages]
    .sort((left, right) => timestampSortValue(right.exportedAt) - timestampSortValue(left.exportedAt))
    .map((exportPackage) => {
      const { artifactCounts } = exportPackage.manifest;
      const paperPackageCount = exportPackage.paperExecutions?.length ?? 0;
      const portfolioPaperOrderPackageCount = exportPackage.portfolioPaperOrderBatches?.length ?? 0;
      const portfolioPaperOrderApprovalPackageCount = exportPackage.portfolioPaperOrderApprovals?.length ?? 0;
      const portfolioPaperOrderSimulationPackageCount = exportPackage.portfolioPaperOrderSimulations?.length ?? 0;
      const aiReviewPackageCount = exportPackage.aiReviewRuns?.length ?? 0;
      const promotionPackageCount = exportPackage.promotionCandidate ? 1 : 0;
      const passedGateCount = exportPackage.executionHandoff.requiredGates.filter((gate) => gate.passed).length;
      const totalGateCount = exportPackage.executionHandoff.requiredGates.length;
      const integrityHash = exportPackage.integrity?.hash ?? "";
      const auditReport = exportPackage.auditReport;
      const auditReportHash = auditReport?.contentSha256.hash ?? "";
      const auditReportIsReady =
        auditReport?.kind === "aiqt.auditReport" &&
        auditReport.schemaVersion === 1 &&
        auditReport.runId === exportPackage.manifest.runId &&
        auditReport.evidenceSummary?.runId === exportPackage.manifest.runId &&
        auditReport.format === "text/markdown" &&
        auditReport.contentSha256.algorithm === "sha256" &&
        /^[a-f0-9]{64}$/iu.test(auditReportHash) &&
        auditReport.contentMarkdown.trim() !== "";
      const backtestReport = exportPackage.backtestReport;
      const backtestReportHash = backtestReport?.contentSha256.hash ?? "";
      const backtestReportIsReady =
        backtestReport?.kind === "aiqt.backtestReport" &&
        backtestReport.schemaVersion === 1 &&
        backtestReport.runId === exportPackage.manifest.runId &&
        backtestReport.market === exportPackage.manifest.market &&
        backtestReport.symbol === exportPackage.manifest.symbol &&
        backtestReport.timeframe === exportPackage.manifest.timeframe &&
        backtestReport.strategyRevision === exportPackage.manifest.strategyRevision &&
        backtestReport.format === "text/markdown" &&
        backtestReport.contentSha256.algorithm === "sha256" &&
        /^[a-f0-9]{64}$/iu.test(backtestReportHash) &&
        backtestReport.contentMarkdown.trim() !== "";
      const reportArtifactLabels = [
        auditReport
          ? `auditReport ${
              auditReportIsReady
                ? [auditReportHash.slice(0, 8), researchRunExportReportSignatureArtifactSuffix(auditReport.signature)]
                    .filter(Boolean)
                    .join(" ")
                : "blocked"
            }`
          : null,
        backtestReport
          ? `backtestReport ${
              backtestReportIsReady
                ? [
                    backtestReportHash.slice(0, 8),
                    researchRunExportReportSignatureArtifactSuffix(backtestReport.signature)
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "blocked"
            }`
          : null
      ].filter((label): label is string => Boolean(label));
      const reportSignatureDetails = [
        auditReportIsReady ? researchRunExportReportSignatureDetail(auditReport?.signature) : "",
        backtestReportIsReady ? researchRunExportReportSignatureDetail(backtestReport?.signature) : ""
      ].filter(Boolean);
      const integrityIsReady =
        exportPackage.integrity?.algorithm === "sha256" && /^[a-f0-9]{64}$/iu.test(integrityHash);
      const dataIsReady =
        artifactCounts.bars === exportPackage.manifest.dataRows &&
        artifactCounts.bars > 0 &&
        exportPackage.manifest.dataHash.trim() !== "";
      const paperCountMatches = (artifactCounts.paperExecutions ?? 0) === paperPackageCount;
      const portfolioPaperOrderCountMatches =
        (artifactCounts.portfolioPaperOrderBatches ?? 0) === portfolioPaperOrderPackageCount &&
        (artifactCounts.portfolioPaperOrderApprovals ?? 0) === portfolioPaperOrderApprovalPackageCount &&
        (artifactCounts.portfolioPaperOrderSimulations ?? 0) === portfolioPaperOrderSimulationPackageCount;
      const promotionCountMatches = (artifactCounts.promotionCandidates ?? 0) === promotionPackageCount;
      const aiReviewCountMatches = (artifactCounts.aiReviewRuns ?? 0) === aiReviewPackageCount;
      const mismatchReasons = [
        integrityIsReady ? null : "Integrity missing",
        dataIsReady ? null : "Data snapshot mismatch",
        paperCountMatches ? null : "Paper execution count mismatch",
        portfolioPaperOrderCountMatches ? null : "Portfolio paper order count mismatch",
        promotionCountMatches ? null : "Promotion candidate count mismatch",
        aiReviewCountMatches ? null : "AI review count mismatch",
        auditReport && !auditReportIsReady ? "Audit report mismatch" : null,
        backtestReport && !backtestReportIsReady ? "Backtest report mismatch" : null
      ].filter((reason): reason is string => Boolean(reason));
      const status: ResearchRunExportIndexStatus = mismatchReasons.length
        ? "blocked"
        : exportPackage.executionHandoff.liveTradingAllowed
          ? "ready"
          : "review";

      return {
        id: exportPackage.manifest.runId,
        runId: exportPackage.manifest.runId,
        context: `${exportPackage.manifest.symbol} · ${exportPackage.manifest.timeframe}`,
        strategyRevision: exportPackage.manifest.strategyRevision,
        exportedAt: exportPackage.exportedAt,
        status,
        integrity: exportPackage.integrity
          ? `${exportPackage.integrity.algorithm} · ${integrityHash.slice(0, 8)}`
          : "No hash",
        dataHash: exportPackage.manifest.dataHash || "missing hash",
        artifacts: [
          `${artifactCounts.bars} bars`,
          `${artifactCounts.trades} trades`,
          `${artifactCounts.portfolioPaperOrderBatches ?? 0} portfolio batches`,
          `${artifactCounts.portfolioPaperOrderApprovals ?? 0} approvals`,
          `${artifactCounts.portfolioPaperOrderSimulations ?? 0} fills`,
          `${artifactCounts.aiReviewRuns ?? 0} AI`,
          reportArtifactLabels.length ? `${reportArtifactLabels.length} reports` : null,
          ...reportArtifactLabels
        ]
          .filter((artifact): artifact is string => Boolean(artifact))
          .join(" / "),
        execution: `${passedGateCount}/${totalGateCount} gates · ${exportPackage.executionHandoff.mode}`,
        detail: mismatchReasons.length
          ? mismatchReasons.join("; ")
          : exportPackage.executionHandoff.liveTradingAllowed
            ? ["Package is consistent and live handoff is open.", ...reportSignatureDetails].join(" · ")
            : ["Package is consistent; paper-only handoff requires review.", ...reportSignatureDetails].join(" · "),
        exportPath: `manifest:${exportPackage.manifest.runId}`,
        tone: status === "ready" ? "positive" : status === "review" ? "warning" : "risk"
      };
    });
}

export function filterResearchRunExportIndexRows(
  rows: ResearchRunExportIndexRow[],
  query: string
): ResearchRunExportIndexRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [
      row.id,
      row.runId,
      row.context,
      row.strategyRevision,
      row.exportedAt,
      row.status,
      row.integrity,
      row.dataHash,
      row.artifacts,
      row.execution,
      row.detail,
      row.exportPath,
      row.tone
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function researchRunImportArtifactCountMismatches(
  exportPackage: ResearchRunExportBrowserPackage,
  actualCounts: {
    aiReviewRuns: number;
    paperExecutions: number;
    portfolioPaperOrderApprovals: number;
    portfolioPaperOrderBatches: number;
    portfolioPaperOrderSimulations: number;
    promotionCandidates: number;
    researchNotes: number;
  }
): string[] {
  const { artifactCounts } = exportPackage.manifest;
  const pairs: Array<[string, number, number]> = [
    ["bars", artifactCounts.bars, exportPackage.manifest.dataRows],
    ["researchNotes", artifactCounts.researchNotes ?? 0, actualCounts.researchNotes],
    ["paperExecutions", artifactCounts.paperExecutions ?? 0, actualCounts.paperExecutions],
    [
      "portfolioPaperOrderBatches",
      artifactCounts.portfolioPaperOrderBatches ?? 0,
      actualCounts.portfolioPaperOrderBatches
    ],
    [
      "portfolioPaperOrderApprovals",
      artifactCounts.portfolioPaperOrderApprovals ?? 0,
      actualCounts.portfolioPaperOrderApprovals
    ],
    [
      "portfolioPaperOrderSimulations",
      artifactCounts.portfolioPaperOrderSimulations ?? 0,
      actualCounts.portfolioPaperOrderSimulations
    ],
    ["promotionCandidates", artifactCounts.promotionCandidates ?? 0, actualCounts.promotionCandidates],
    ["aiReviewRuns", artifactCounts.aiReviewRuns ?? 0, actualCounts.aiReviewRuns]
  ];

  return pairs
    .filter(([, manifestCount, packageCount]) => manifestCount !== packageCount)
    .map(([label, manifestCount, packageCount]) => `${label} ${manifestCount}/${packageCount}`);
}

export function buildResearchRunImportDiffRows({
  aiReviewRecords = [],
  exportPackage,
  paperExecution = null,
  workspace
}: {
  workspace: TerminalWorkspace;
  exportPackage: ResearchRunExportBrowserPackage | null | undefined;
  aiReviewRecords?: ResearchRunExportPreviewAiReviewEnvelope[];
  paperExecution?: PaperExecutionSnapshot | null;
}): ResearchRunImportDiffRow[] {
  if (!exportPackage) {
    return [
      {
        id: "run-id",
        label: "Research run",
        status: "blocked",
        current: workspace.researchRun?.runId ?? "No audited run",
        incoming: "No package selected",
        detail: "Inspect or choose a research run export package before importing.",
        exportPath: "researchRun",
        tone: "risk"
      }
    ];
  }

  const currentRun = workspace.researchRun ?? null;
  const incomingRun = exportPackage.researchRun ?? null;
  const currentNote = normalizedResearchNote(currentRun?.researchNote);
  const incomingNote = normalizedResearchNote(incomingRun?.researchNote);
  const integrityHash = exportPackage.integrity?.hash ?? "";
  const integrityIsReady =
    exportPackage.integrity?.algorithm === "sha256" && /^[a-f0-9]{64}$/iu.test(integrityHash);
  const packageAiReviewCount = exportPackage.aiReviewRuns?.length ?? 0;
  const manifestAiReviewCount = exportPackage.manifest.artifactCounts.aiReviewRuns ?? 0;
  const currentAiReviewCount = currentRun
    ? aiReviewRecords.filter((record) => record.runId === currentRun.runId).length
    : 0;
  const packagePaperCount = exportPackage.paperExecutions?.length ?? 0;
  const packagePortfolioPaperOrderCount = exportPackage.portfolioPaperOrderBatches?.length ?? 0;
  const packagePortfolioPaperOrderApprovalCount = exportPackage.portfolioPaperOrderApprovals?.length ?? 0;
  const packagePortfolioPaperOrderSimulationCount = exportPackage.portfolioPaperOrderSimulations?.length ?? 0;
  const currentPaperCount = currentRun && paperExecution?.runId === currentRun.runId ? 1 : 0;
  const auditSummary = exportPackage.auditEvidenceSummary;
  const auditSummaryMatchesPackage = auditSummary?.runId === exportPackage.manifest.runId;
  const auditReport = exportPackage.auditReport;
  const auditReportHash = auditReport?.contentSha256.hash ?? "";
  const auditReportMatchesPackage =
    auditReport?.runId === exportPackage.manifest.runId &&
    auditReport.evidenceSummary?.runId === exportPackage.manifest.runId &&
    auditReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(auditReportHash) &&
    auditReport.contentMarkdown.trim() !== "";
  const auditReportSignatureDetail = researchRunExportReportSignatureDetail(auditReport?.signature);
  const auditReportSignatureImportVerificationDetail = researchRunExportReportSignatureImportVerificationDetail(
    auditReport?.signature
  );
  const auditReportSignatureStatus = researchRunExportReportSignatureStatus(auditReport?.signature);
  const auditReportSignatureImportBlockReason = researchRunExportReportSignatureImportBlockReason(
    auditReport?.signature,
    "Audit report"
  );
  const auditReportImportPolicyBlockReason = researchRunExportAuditReportImportPolicyBlockReason(auditReport);
  const auditReportImportBlockReason = auditReportSignatureImportBlockReason || auditReportImportPolicyBlockReason;
  const auditReportSignatureIsImportable = auditReportImportBlockReason === "";
  const auditReportSignatureLabel = auditReportSignatureDetail
    ? auditReportLedgerSignatureLabel(auditReportSignatureStatus)
    : "";
  const backtestReport = exportPackage.backtestReport;
  const backtestReportHash = backtestReport?.contentSha256.hash ?? "";
  const backtestReportMatchesPackage =
    backtestReport?.runId === exportPackage.manifest.runId &&
    backtestReport.market === exportPackage.manifest.market &&
    backtestReport.symbol === exportPackage.manifest.symbol &&
    backtestReport.timeframe === exportPackage.manifest.timeframe &&
    backtestReport.strategyRevision === exportPackage.manifest.strategyRevision &&
    backtestReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(backtestReportHash) &&
    backtestReport.contentMarkdown.trim() !== "";
  const backtestReportSignatureDetail = researchRunExportReportSignatureDetail(backtestReport?.signature);
  const backtestReportSignatureImportVerificationDetail = researchRunExportReportSignatureImportVerificationDetail(
    backtestReport?.signature
  );
  const backtestReportSignatureStatus = researchRunExportReportSignatureStatus(backtestReport?.signature);
  const backtestReportSignatureImportBlockReason = researchRunExportReportSignatureImportBlockReason(
    backtestReport?.signature,
    "Backtest report"
  );
  const backtestReportSignatureIsImportable = backtestReportSignatureImportBlockReason === "";
  const backtestReportSignatureLabel = backtestReportSignatureDetail
    ? auditReportLedgerSignatureLabel(backtestReportSignatureStatus)
    : "";
  const artifactCountMismatches = researchRunImportArtifactCountMismatches(exportPackage, {
    aiReviewRuns: packageAiReviewCount,
    paperExecutions: packagePaperCount,
    portfolioPaperOrderApprovals: packagePortfolioPaperOrderApprovalCount,
    portfolioPaperOrderBatches: packagePortfolioPaperOrderCount,
    portfolioPaperOrderSimulations: packagePortfolioPaperOrderSimulationCount,
    promotionCandidates: exportPackage.promotionCandidate ? 1 : 0,
    researchNotes: incomingNote ? 1 : 0
  });

  return [
    {
      id: "package-integrity",
      label: "Package integrity",
      status: integrityIsReady ? "same" : "blocked",
      current: "Local verification required",
      incoming: exportPackage.integrity
        ? `${exportPackage.integrity.algorithm} · ${integrityIsReady ? integrityHash.slice(0, 8) : "invalid"}`
        : "No integrity hash",
      detail: integrityIsReady
        ? "Canonical SHA-256 metadata is present before import."
        : "Import must stop until the package has valid canonical SHA-256 metadata.",
      exportPath: "integrity.hash",
      tone: integrityIsReady ? "positive" : "risk"
    },
    {
      id: "artifact-counts",
      label: "Artifact counts",
      status: artifactCountMismatches.length ? "blocked" : "same",
      current: "Manifest versus package payload",
      incoming: artifactCountMismatches.length ? `${artifactCountMismatches.length} mismatch` : "Counts match",
      detail: artifactCountMismatches.length
        ? artifactCountMismatches.join(" · ")
        : "Manifest artifact counts match the package payloads that will be restored.",
      exportPath: "manifest.artifactCounts",
      tone: artifactCountMismatches.length ? "risk" : "positive"
    },
    {
      id: "run-id",
      label: "Research run",
      status: currentRun ? (currentRun.runId === exportPackage.manifest.runId ? "same" : "replace") : "add",
      current: currentRun?.runId ?? "No audited run",
      incoming: exportPackage.manifest.runId,
      detail: currentRun
        ? currentRun.runId === exportPackage.manifest.runId
          ? "Import will refresh the existing audited run payload."
          : "Import will replace the current replay context with the package run."
        : "Import will add an audited run to the local workspace.",
      exportPath: "researchRun.runId",
      tone: currentRun?.runId === exportPackage.manifest.runId ? "positive" : "warning"
    },
    {
      id: "context",
      label: "Market / symbol",
      status:
        workspace.selectedInstrument.market === exportPackage.manifest.market &&
        workspace.selectedInstrument.symbol === exportPackage.manifest.symbol
          ? "same"
          : "change",
      current: `${workspace.selectedInstrument.market} · ${workspace.selectedInstrument.symbol}`,
      incoming: `${exportPackage.manifest.market} · ${exportPackage.manifest.symbol}`,
      detail: "Import will bind the terminal to the package market and symbol.",
      exportPath: "manifest.market",
      tone:
        workspace.selectedInstrument.market === exportPackage.manifest.market &&
        workspace.selectedInstrument.symbol === exportPackage.manifest.symbol
          ? "positive"
          : "warning"
    },
    {
      id: "timeframe",
      label: "Timeframe",
      status: workspace.selectedTimeframe === exportPackage.manifest.timeframe ? "same" : "change",
      current: workspace.selectedTimeframe,
      incoming: exportPackage.manifest.timeframe,
      detail:
        workspace.selectedTimeframe === exportPackage.manifest.timeframe
          ? "Current research context already matches the package timeframe."
          : "Current research context will switch to the package timeframe.",
      exportPath: "manifest.timeframe",
      tone: workspace.selectedTimeframe === exportPackage.manifest.timeframe ? "positive" : "warning"
    },
    {
      id: "data-snapshot",
      label: "Data snapshot",
      status:
        currentRun?.dataSnapshot?.hash && currentRun.dataSnapshot.hash === exportPackage.manifest.dataHash
          ? "same"
          : currentRun?.dataSnapshot
            ? "change"
            : "add",
      current: currentRun?.dataSnapshot
        ? `${currentRun.dataSnapshot.rows} rows · ${currentRun.dataSnapshot.hash || "missing hash"}`
        : "No data snapshot",
      incoming: `${exportPackage.manifest.dataRows} rows · ${exportPackage.manifest.dataHash || "missing hash"}`,
      detail: "Import will replay the package data hash and row count as the audited snapshot.",
      exportPath: "researchRun.dataSnapshot",
      tone:
        currentRun?.dataSnapshot?.hash && currentRun.dataSnapshot.hash === exportPackage.manifest.dataHash
          ? "positive"
          : "warning"
    },
    {
      id: "strategy-revision",
      label: "Strategy revision",
      status:
        currentRun?.strategyRevision && currentRun.strategyRevision === exportPackage.manifest.strategyRevision
          ? "same"
          : currentRun?.strategyRevision
            ? "change"
            : "add",
      current: currentRun?.strategyRevision ?? "No audited strategy",
      incoming: exportPackage.manifest.strategyRevision,
      detail: "Import will restore the package strategy revision as an audited Strategy Lab version.",
      exportPath: "researchRun.strategyConfig.revision",
      tone:
        currentRun?.strategyRevision && currentRun.strategyRevision === exportPackage.manifest.strategyRevision
          ? "positive"
          : "warning"
    },
    {
      id: "research-note",
      label: "Research note",
      status: incomingNote
        ? currentNote?.body === incomingNote.body
          ? "same"
          : currentNote
            ? "change"
            : "add"
        : "same",
      current: currentNote ? compactResearchNoteDetail(currentNote.body) : "No local note",
      incoming: incomingNote ? compactResearchNoteDetail(incomingNote.body) : "No package note",
      detail: incomingNote
        ? "Import will write the package research note back to the local note store."
        : "Package does not include a locked research note.",
      exportPath: "researchRun.researchNote",
      tone: incomingNote && currentNote?.body !== incomingNote.body ? "warning" : "neutral"
    },
    {
      id: "paper-executions",
      label: "Paper executions",
      status: packagePaperCount > currentPaperCount ? "add" : packagePaperCount === currentPaperCount ? "same" : "change",
      current: `${currentPaperCount} saved`,
      incoming: `${packagePaperCount} saved / ${exportPackage.manifest.artifactCounts.paperExecutions ?? 0} manifest`,
      detail: "Import will restore paper execution records attached to the package run.",
      exportPath: "paperExecutions[]",
      tone: packagePaperCount > 0 ? "warning" : "neutral"
    },
    {
      id: "portfolio-paper-orders",
      label: "Portfolio paper orders",
      status: packagePortfolioPaperOrderCount > 0 ? "add" : "same",
      current: "Not loaded in current preview",
      incoming: `${packagePortfolioPaperOrderCount} batches / ${
        exportPackage.manifest.artifactCounts.portfolioPaperOrderBatches ?? 0
      } manifest`,
      detail: "Import will restore Portfolio paper order batches bound to the package run.",
      exportPath: "portfolioPaperOrderBatches[]",
      tone: packagePortfolioPaperOrderCount > 0 ? "warning" : "neutral"
    },
    {
      id: "ai-review-runs",
      label: "AI review runs",
      status: packageAiReviewCount > currentAiReviewCount ? "add" : packageAiReviewCount === currentAiReviewCount ? "same" : "change",
      current: `${currentAiReviewCount} saved`,
      incoming: `${packageAiReviewCount} saved / ${manifestAiReviewCount} manifest`,
      detail: "Import will restore saved AI review records and their evidence anchors.",
      exportPath: "aiReviewRuns[]",
      tone: packageAiReviewCount > 0 ? "ai" : "neutral"
    },
    ...(auditSummary
      ? ([
          {
            id: "audit-summary",
            label: "Audit evidence summary",
            status: auditSummaryMatchesPackage ? "add" : "blocked",
            current: "No local package summary",
            incoming: `${auditSummary.runId} · ${auditSummary.focusQuery || auditSummary.packageQuery || "no focus"}`,
            detail: auditSummaryMatchesPackage
              ? `Audit focus carries ${auditSummary.package.matched}/${auditSummary.package.total} package matches and ${auditSummary.importDiff.blocked} import diff blockers.`
              : "Audit evidence summary run id does not match the import package manifest.",
            exportPath: "auditEvidenceSummary",
            tone: auditSummaryMatchesPackage ? "ai" : "risk"
          }
        ] satisfies ResearchRunImportDiffRow[])
      : []),
    ...(auditReport
      ? ([
          {
            id: "audit-report",
            label: "Audit report",
            status: auditReportMatchesPackage && auditReportSignatureIsImportable ? "add" : "blocked",
            current: "No local audit report",
            incoming: [
              `${auditReport.runId} · ${auditReport.contentSha256.algorithm} ${auditReportHash.slice(0, 8)} · ${
                auditReport.fileName
              }`,
              auditReportSignatureLabel
            ]
              .filter(Boolean)
              .join(" · "),
            detail: auditReportMatchesPackage
              ? [
                   auditReportSignatureIsImportable
                     ? "Package includes a portable Audit Markdown report bound to this manifest."
                     : auditReportImportBlockReason,
                   auditReportSignatureDetail,
                   auditReportSignatureImportVerificationDetail
                 ]
                  .filter(Boolean)
                  .join(" · ")
              : "Audit report artifact does not match the import package manifest or content hash.",
            exportPath: "auditReport.contentSha256.hash",
            tone: auditReportMatchesPackage && auditReportSignatureIsImportable ? "ai" : "risk"
          }
        ] satisfies ResearchRunImportDiffRow[])
      : []),
    ...(backtestReport
      ? ([
          {
            id: "backtest-report",
            label: "Backtest report",
            status: backtestReportMatchesPackage && backtestReportSignatureIsImportable ? "add" : "blocked",
            current: "No local backtest report",
            incoming: [
              `${backtestReport.runId} · ${backtestReport.contentSha256.algorithm} ${backtestReportHash.slice(
                0,
                8
              )} · ${backtestReport.runComparisonRows} comparisons`,
              backtestReportSignatureLabel
            ]
              .filter(Boolean)
              .join(" · "),
            detail: backtestReportMatchesPackage
              ? [
                   backtestReportSignatureIsImportable
                     ? "Package includes a portable Backtest Markdown report bound to this manifest."
                     : backtestReportSignatureImportBlockReason,
                   backtestReportSignatureDetail,
                   backtestReportSignatureImportVerificationDetail
                 ]
                  .filter(Boolean)
                  .join(" · ")
              : "Backtest report artifact does not match the import package manifest or content hash.",
            exportPath: "backtestReport.contentSha256.hash",
            tone: backtestReportMatchesPackage && backtestReportSignatureIsImportable ? "ai" : "risk"
          }
        ] satisfies ResearchRunImportDiffRow[])
      : []),
    {
      id: "live-boundary",
      label: "Live boundary",
      status: exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed ? "blocked" : "same",
      current: workspace.execution.liveEnabled ? "Local live enabled" : "Local paper boundary",
      incoming:
        exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed
          ? "Package claims live handoff"
          : "Package remains paper-only",
      detail:
        exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed
          ? "Local import must reject packages that claim live trading permission."
          : "Import keeps the package inside the paper-only execution boundary.",
      exportPath: "executionHandoff.liveTradingAllowed",
      tone: exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed ? "risk" : "positive"
    }
  ];
}

export function filterResearchRunImportDiffRows(
  rows: ResearchRunImportDiffRow[],
  query: string
): ResearchRunImportDiffRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [row.id, row.label, row.status, row.current, row.incoming, row.detail, row.exportPath, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function buildAuditEvidenceSummary({
  auditQuery,
  deepLinkError,
  deepLinkRunId,
  deepLinkStatus = "none",
  importDiffQuery,
  importDiffRows,
  importAuditEvents = [],
  packageQuery,
  packageRows
}: {
  auditQuery: string;
  deepLinkError?: string | null;
  deepLinkRunId?: string | null;
  deepLinkStatus?: AuditEvidenceDeepLinkStatus;
  importDiffQuery: string;
  importDiffRows: ResearchRunImportDiffRow[];
  importAuditEvents?: ResearchRunImportAuditEvent[];
  packageQuery: string;
  packageRows: ResearchRunExportBrowserRow[];
}): AuditEvidenceSummary {
  const normalizedAuditQuery = auditQuery.trim();
  const normalizedPackageQuery = packageQuery.trim();
  const normalizedImportDiffQuery = importDiffQuery.trim();
  const packageMatchedCount = filterResearchRunExportBrowserRows(packageRows, normalizedPackageQuery).length;
  const importDiffMatchedCount = filterResearchRunImportDiffRows(importDiffRows, normalizedImportDiffQuery).length;
  const packageReadyCount = packageRows.filter((row) => row.status === "ready").length;
  const packageMissingCount = packageRows.filter((row) => row.status === "missing").length;
  const packageBlockedCount = packageRows.filter((row) => row.status === "blocked").length;
  const importDiffAddCount = importDiffRows.filter((row) => row.status === "add").length;
  const importDiffChangeCount = importDiffRows.filter((row) => row.status === "change" || row.status === "replace").length;
  const importDiffBlockedCount = importDiffRows.filter((row) => row.status === "blocked").length;
  const importAuditAggregation = buildResearchRunImportAuditAggregation(importAuditEvents);
  const importPolicyBlockerBuckets = importAuditAggregation.blockedEvidenceBuckets.map((bucket) => ({
    category: bucket.category,
    count: bucket.count,
    label: bucket.label,
    latestDetail: bucket.latestDetail,
    latestExportPath: bucket.latestExportPath,
    latestFileName: bucket.latestFileName,
    latestRunId: bucket.latestRunId,
    tone: bucket.tone
  }));
  const importPolicyBlockedCount = importPolicyBlockerBuckets.reduce((total, bucket) => total + bucket.count, 0);
  const importVerificationBuckets = importAuditAggregation.verifiedReportSignatureBuckets.map((bucket) => ({
    count: bucket.count,
    latestExportPath: bucket.latestExportPath,
    latestReason: bucket.latestReason,
    source: bucket.source,
    status: bucket.status
  }));
  const importVerificationVerifiedCount =
    importVerificationBuckets.find((bucket) => bucket.status === "verified")?.count ?? 0;
  const importVerificationInvalidCount =
    importVerificationBuckets.find((bucket) => bucket.status === "invalid")?.count ?? 0;
  const latestImportVerification = importVerificationBuckets[0]
    ? `latest ${importVerificationBuckets[0].status} ${importVerificationBuckets[0].latestExportPath} · ${importVerificationBuckets[0].latestReason}`
    : "none";
  const latestImportPolicyBlocker = importPolicyBlockerBuckets[0]
    ? `latest ${importPolicyBlockerBuckets[0].label} ${importPolicyBlockerBuckets[0].latestExportPath} · ${importPolicyBlockerBuckets[0].latestDetail}`
    : "none";
  const runId =
    deepLinkRunId?.trim() ||
    packageRows.find((row) => row.exportPath.startsWith("manifest:"))?.value ||
    normalizedPackageQuery ||
    "unknown";
  const focusQuery = normalizedPackageQuery || normalizedImportDiffQuery || normalizedAuditQuery || runId;
  const copyLines = [
    "AIQT Audit Evidence Summary",
    `Run: ${runId}`,
    `Audit query: ${normalizedAuditQuery || "none"}`,
    `Package focus: ${normalizedPackageQuery || "none"}`,
    `Import diff focus: ${normalizedImportDiffQuery || "none"}`,
    `Deep link: ${deepLinkStatus}${deepLinkError ? ` (${deepLinkError})` : ""}`,
    `Package checks: ${packageReadyCount} ready / ${packageMissingCount} missing / ${packageBlockedCount} blocked / ${packageMatchedCount} of ${packageRows.length} matched`,
    `Import diff: ${importDiffChangeCount} changes / ${importDiffAddCount} adds / ${importDiffBlockedCount} blocked / ${importDiffMatchedCount} of ${importDiffRows.length} matched`,
    `Import policy blockers: ${importPolicyBlockedCount} blocked / ${latestImportPolicyBlocker}`,
    `Import report verification: ${importVerificationVerifiedCount} verified / ${importVerificationInvalidCount} invalid / ${latestImportVerification}`
  ];
  return {
    auditQuery: normalizedAuditQuery,
    copyText: copyLines.join("\n"),
    deepLinkError: deepLinkError ?? null,
    deepLinkStatus,
    focusQuery,
    importDiffAddCount,
    importDiffBlockedCount,
    importDiffChangeCount,
    importDiffMatchedCount,
    importDiffQuery: normalizedImportDiffQuery,
    importDiffTotalCount: importDiffRows.length,
    importPolicyBlockedCount,
    importPolicyBlockerBuckets,
    importVerificationBuckets,
    importVerificationInvalidCount,
    importVerificationVerifiedCount,
    packageBlockedCount,
    packageMatchedCount,
    packageMissingCount,
    packageQuery: normalizedPackageQuery,
    packageReadyCount,
    packageTotalCount: packageRows.length,
    runId
  };
}

export function buildAuditEvidenceReportMarkdown(
  summary: AuditEvidenceSummary,
  { generatedAt = new Date().toISOString() }: { generatedAt?: string } = {}
): string {
  const importVerificationBuckets = summary.importVerificationBuckets ?? [];
  const importPolicyBlockerBuckets = summary.importPolicyBlockerBuckets ?? [];
  const deepLinkDetail = summary.deepLinkError
    ? `${summary.deepLinkStatus} (${summary.deepLinkError})`
    : summary.deepLinkStatus;
  const evidenceRows = [
    [
      "Package checks",
      `${summary.packageReadyCount} ready`,
      `${summary.packageMissingCount} missing`,
      `${summary.packageBlockedCount} blocked`,
      `${summary.packageMatchedCount} / ${summary.packageTotalCount}`
    ],
    [
      "Import diff",
      `${summary.importDiffChangeCount} changes`,
      `${summary.importDiffAddCount} adds`,
      `${summary.importDiffBlockedCount} blocked`,
      `${summary.importDiffMatchedCount} / ${summary.importDiffTotalCount}`
    ]
  ];
  const importVerificationSection = importVerificationBuckets.length
    ? [
        "",
        "## Import Report Verification",
        "",
        markdownTable(
          ["Status", "Count", "Source", "Latest exportPath", "Latest reason"],
          importVerificationBuckets.map((bucket) => [
            bucket.status,
            String(bucket.count),
            bucket.source,
            bucket.latestExportPath,
            bucket.latestReason
          ])
        )
      ]
    : [];
  const importPolicyBlockerSection = importPolicyBlockerBuckets.length
    ? [
        "",
        "## Import Policy Blockers",
        "",
        markdownTable(
          ["Category", "Count", "Latest run", "Latest exportPath", "Latest detail"],
          importPolicyBlockerBuckets.map((bucket) => [
            bucket.label,
            String(bucket.count),
            bucket.latestRunId,
            bucket.latestExportPath,
            bucket.latestDetail
          ])
        )
      ]
    : [];

  return [
    "# AIQuant Audit Evidence Report",
    "",
    `Generated at: \`${generatedAt}\``,
    `Run ID: \`${summary.runId}\``,
    `Deep link status: \`${deepLinkDetail}\``,
    "",
    "## Evidence Focus",
    "",
    markdownTable(
      ["Area", "Query"],
      [
        ["Audit ledger", summary.auditQuery || "none"],
        ["Export package", summary.packageQuery || "none"],
        ["Import diff", summary.importDiffQuery || "none"],
        ["Current focus", summary.focusQuery || "none"]
      ]
    ),
    "",
    "## Evidence Counts",
    "",
    markdownTable(["Area", "Ready / changes", "Missing / adds", "Blocked", "Matched"], evidenceRows),
    ...importPolicyBlockerSection,
    ...importVerificationSection,
    "",
    "## Portable Summary",
    "",
    "```text",
    summary.copyText,
    "```",
    "",
    "## Boundary",
    "",
    "This audit report fragment records reproducibility evidence and import impact context only. It does not provide buy/sell instructions, guaranteed returns, or live execution approval."
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trimEnd()
    .concat("\n");
}

export function buildResearchRunImportAuditEvent({
  createdAt = new Date().toISOString(),
  error,
  exportPackage,
  fileName,
  previousRunId = null,
  rows,
  stage,
  undoToken = null
}: {
  exportPackage: Pick<ResearchRunExportBrowserPackage, "manifest"> | null | undefined;
  fileName: string;
  previousRunId?: string | null;
  rows: ResearchRunImportDiffRow[];
  stage: "preview" | "confirmed" | "failed" | "cancelled";
  createdAt?: string;
  error?: string | null;
  undoToken?: string | null;
}): ResearchRunImportAuditEvent {
  const runId = exportPackage?.manifest.runId ?? "unknown";
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const blockedRows = researchRunImportAuditBlockedRows(rows);
  const verifiedReportSignatures = researchRunImportVerifiedReportSignatures(rows);
  const changeCount = rows.filter(
    (row) => row.status === "add" || row.status === "change" || row.status === "replace"
  ).length;
  const resolvedStage: ResearchRunImportAuditEventStage =
    stage === "preview" && blockedCount > 0 ? "blocked" : stage;
  const summary = researchRunImportAuditSummary(resolvedStage);
  const failure = researchRunImportFailure(error);
  const detail = researchRunImportAuditDetail({
    blockedCount,
    changeCount,
    error: failure.detail ?? error,
    fileName,
    stage: resolvedStage
  });
  const normalizedPreviousRunId = previousRunId?.trim() || null;
  const rollbackTargetRunId = resolvedStage === "confirmed" ? normalizedPreviousRunId : null;
  const normalizedUndoToken = resolvedStage === "confirmed" ? undoToken?.trim() || null : null;

  return {
    id: `import:${runId}:${resolvedStage}:${createdAt}:${fileName || "unknown"}`,
    stage: resolvedStage,
    runId,
    previousRunId: normalizedPreviousRunId,
    rollbackTargetRunId,
    undoToken: normalizedUndoToken,
    fileName: fileName || "unknown",
    createdAt,
    summary,
    detail,
    failureCategory: resolvedStage === "failed" ? failure.category : null,
    recoveryHint: researchRunImportRecoveryHint(resolvedStage, rollbackTargetRunId, failure, normalizedUndoToken),
    blockedCount,
    blockedRows,
    changeCount,
    exportPath: exportPackage ? `manifest:${runId}` : `import:file:${fileName || "unknown"}`,
    tone: researchRunImportAuditTone(resolvedStage),
    verifiedReportSignatures
  };
}

function researchRunImportAuditBlockedRows(rows: ResearchRunImportDiffRow[]): ResearchRunImportAuditBlockedRow[] {
  return rows
    .filter((row) => row.status === "blocked")
    .map((row) => ({
      id: row.id,
      label: row.label,
      detail: row.detail,
      exportPath: row.exportPath,
      incoming: row.incoming
    }));
}

function researchRunImportVerifiedReportSignatures(
  rows: ResearchRunImportDiffRow[]
): ResearchRunImportVerifiedReportSignature[] {
  return rows
    .map((row) => {
      if (row.id !== "audit-report" && row.id !== "backtest-report") {
        return null;
      }
      const match = row.detail.match(/Local core import verification: (verified|invalid)(?: · ([^·]+))?/u);
      if (!match) {
        return null;
      }
      const status = match[1] as ResearchRunImportVerifiedReportSignature["status"];
      const reason = match[2]?.trim() || status;
      return {
        id: row.id,
        label: row.label,
        detail: `Local core import verification: ${status} · ${reason}`,
        exportPath: row.exportPath,
        incoming: row.incoming,
        reason,
        source: "local-core" as const,
        status
      };
    })
    .filter((row): row is ResearchRunImportVerifiedReportSignature => Boolean(row));
}

export function buildResearchRunImportUndoAuditEvent({
  createdAt = new Date().toISOString(),
  event
}: {
  createdAt?: string;
  event: ResearchRunImportAuditEvent;
}): ResearchRunImportAuditEvent {
  const consumedUndoToken = event.undoToken?.trim() || "unknown";
  return {
    ...event,
    createdAt,
    stage: "undone",
    summary: researchRunImportAuditSummary("undone"),
    detail: researchRunImportAuditDetail({
      blockedCount: event.blockedCount,
      changeCount: event.changeCount,
      fileName: event.fileName,
      stage: "undone"
    }),
    undoToken: null,
    recoveryHint: researchRunImportRecoveryHint("undone", event.rollbackTargetRunId, {
      category: "unknown",
      detail: null
    }, consumedUndoToken),
    tone: researchRunImportAuditTone("undone"),
    verifiedReportSignatures: []
  };
}

export function buildResearchRunImportUndoFailureAuditEvent({
  createdAt = new Date().toISOString(),
  error,
  event
}: {
  createdAt?: string;
  error?: string | null;
  event: ResearchRunImportAuditEvent;
}): ResearchRunImportAuditEvent {
  const failure = researchRunImportFailure(error);
  return {
    ...event,
    id: `${event.id}:undo-failed:${createdAt}`,
    createdAt,
    stage: "undo-failed",
    summary: researchRunImportAuditSummary("undo-failed"),
    detail: researchRunImportAuditDetail({
      blockedCount: event.blockedCount,
      changeCount: event.changeCount,
      error: failure.detail ?? error,
      fileName: event.fileName,
      stage: "undo-failed"
    }),
    failureCategory: failure.category,
    recoveryHint: researchRunImportRecoveryHint("undo-failed", event.rollbackTargetRunId, failure, event.undoToken),
    tone: researchRunImportAuditTone("undo-failed"),
    verifiedReportSignatures: []
  };
}

export function buildResearchRunImportUndoConfirmation(
  event: ResearchRunImportAuditEvent
): ResearchRunImportUndoConfirmation | null {
  const undoToken = event.undoToken?.trim();
  if (event.stage !== "confirmed" || !undoToken) {
    return null;
  }
  return {
    undoToken,
    runId: event.runId,
    fileName: event.fileName,
    message: "Confirm import undo",
    detail: `Undo import ${undoToken} will restore previous audited stores and cannot be repeated.`
  };
}

export function mergeResearchRunImportAuditEvents(
  events: ResearchRunImportAuditEvent[],
  event: ResearchRunImportAuditEvent,
  limit = 12
): ResearchRunImportAuditEvent[] {
  return [event, ...events.filter((item) => item.id !== event.id)].slice(0, limit);
}

export function buildResearchRunImportAuditAggregation(
  events: ResearchRunImportAuditEvent[]
): ResearchRunImportAuditAggregation {
  const stageCounts: Record<ResearchRunImportAuditEventStage, number> = {
    blocked: 0,
    cancelled: 0,
    confirmed: 0,
    failed: 0,
    preview: 0,
    undone: 0,
    "undo-failed": 0
  };
  const failureBuckets = new Map<ResearchRunImportAuditFailureBucketCategory, ResearchRunImportAuditFailureBucket>();
  const blockedEvidenceBuckets = new Map<
    ResearchRunImportBlockedEvidenceBucketCategory,
    ResearchRunImportBlockedEvidenceBucket
  >();
  const verifiedReportSignatureBuckets = new Map<
    ResearchRunImportVerifiedReportSignatureBucket["status"],
    ResearchRunImportVerifiedReportSignatureBucket
  >();
  let needsReview = 0;
  let recoverable = 0;
  let undoable = 0;

  events.forEach((event) => {
    stageCounts[event.stage] += 1;
    if (isResearchRunImportAuditEventUndoable(event)) {
      undoable += 1;
    }
    if (isResearchRunImportAuditEventRecoverable(event)) {
      recoverable += 1;
    }
    event.verifiedReportSignatures.forEach((row) => {
      const existingSignatureBucket = verifiedReportSignatureBuckets.get(row.status);
      if (existingSignatureBucket) {
        existingSignatureBucket.count += 1;
        if (!existingSignatureBucket.rowIds.includes(row.id)) {
          existingSignatureBucket.rowIds.push(row.id);
        }
        if (event.createdAt >= existingSignatureBucket.latestCreatedAt) {
          existingSignatureBucket.latestCreatedAt = event.createdAt;
          existingSignatureBucket.latestDetail = row.detail;
          existingSignatureBucket.latestExportPath = row.exportPath;
          existingSignatureBucket.latestFileName = event.fileName;
          existingSignatureBucket.latestReason = row.reason;
          existingSignatureBucket.latestRunId = event.runId;
        }
        return;
      }
      verifiedReportSignatureBuckets.set(row.status, {
        status: row.status,
        count: 1,
        label: researchRunImportVerifiedReportSignatureBucketLabel(row.status),
        latestCreatedAt: event.createdAt,
        latestDetail: row.detail,
        latestExportPath: row.exportPath,
        latestFileName: event.fileName,
        latestReason: row.reason,
        latestRunId: event.runId,
        rowIds: [row.id],
        source: row.source,
        tone: researchRunImportVerifiedReportSignatureBucketTone(row.status)
      });
    });
    if (!isResearchRunImportAuditEventNeedsReview(event)) {
      return;
    }
    needsReview += 1;
    const category: ResearchRunImportAuditFailureBucketCategory =
      event.stage === "blocked" ? "blocked" : event.failureCategory ?? "unknown";
    const existing = failureBuckets.get(category);
    if (existing) {
      existing.count += 1;
      existing.stageCounts[event.stage] = (existing.stageCounts[event.stage] ?? 0) + 1;
      if (event.createdAt > existing.latestCreatedAt) {
        existing.latestCreatedAt = event.createdAt;
        existing.latestFileName = event.fileName;
        existing.latestRunId = event.runId;
        existing.recoveryHint = event.recoveryHint;
      }
      return;
    }
    failureBuckets.set(category, {
      category,
      count: 1,
      label: researchRunImportFailureBucketLabel(category),
      latestCreatedAt: event.createdAt,
      latestFileName: event.fileName,
      latestRunId: event.runId,
      recoveryHint: event.recoveryHint,
      stageCounts: {
        [event.stage]: 1
      },
      tone: "risk"
    });
    event.blockedRows.forEach((row) => {
      const blockedCategory = researchRunImportBlockedEvidenceBucketCategory(row);
      const existingBlockedBucket = blockedEvidenceBuckets.get(blockedCategory);
      if (existingBlockedBucket) {
        existingBlockedBucket.count += 1;
        if (!existingBlockedBucket.rowIds.includes(row.id)) {
          existingBlockedBucket.rowIds.push(row.id);
        }
        if (event.createdAt >= existingBlockedBucket.latestCreatedAt) {
          existingBlockedBucket.latestCreatedAt = event.createdAt;
          existingBlockedBucket.latestDetail = row.detail;
          existingBlockedBucket.latestExportPath = row.exportPath;
          existingBlockedBucket.latestFileName = event.fileName;
          existingBlockedBucket.latestRunId = event.runId;
        }
        return;
      }
      blockedEvidenceBuckets.set(blockedCategory, {
        category: blockedCategory,
        count: 1,
        label: researchRunImportBlockedEvidenceBucketLabel(blockedCategory),
        latestCreatedAt: event.createdAt,
        latestDetail: row.detail,
        latestExportPath: row.exportPath,
        latestFileName: event.fileName,
        latestRunId: event.runId,
        rowIds: [row.id],
        tone: researchRunImportBlockedEvidenceBucketTone(blockedCategory)
      });
    });
  });

  return {
    total: events.length,
    preview: stageCounts.preview,
    blocked: stageCounts.blocked,
    confirmed: stageCounts.confirmed,
    failed: stageCounts.failed,
    cancelled: stageCounts.cancelled,
    undone: stageCounts.undone,
    undoFailed: stageCounts["undo-failed"],
    needsReview,
    undoable,
    recoverable,
    failureBuckets: researchRunImportFailureBucketOrder
      .map((category) => failureBuckets.get(category))
      .filter((bucket): bucket is ResearchRunImportAuditFailureBucket => Boolean(bucket)),
    blockedEvidenceBuckets: researchRunImportBlockedEvidenceBucketOrder
      .map((category) => blockedEvidenceBuckets.get(category))
      .filter((bucket): bucket is ResearchRunImportBlockedEvidenceBucket => Boolean(bucket)),
    verifiedReportSignatureBuckets: researchRunImportVerifiedReportSignatureBucketOrder
      .map((status) => verifiedReportSignatureBuckets.get(status))
      .filter((bucket): bucket is ResearchRunImportVerifiedReportSignatureBucket => Boolean(bucket))
  };
}

export function filterResearchRunImportAuditEvents(
  events: ResearchRunImportAuditEvent[],
  query: string,
  filter: ResearchRunImportAuditFilter = "all"
): ResearchRunImportAuditEvent[] {
  const normalizedQuery = query.trim().toLowerCase();
  return events.filter((event) => {
    if (!researchRunImportAuditEventMatchesFilter(event, filter)) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return [
      event.id,
      event.stage,
      event.runId,
      event.fileName,
      event.createdAt,
      event.summary,
      event.detail,
      event.previousRunId ?? "",
      event.rollbackTargetRunId ?? "",
      event.rollbackTargetRunId && event.stage !== "undone" ? "rollback" : "",
      event.undoToken ?? "",
      event.undoToken ? "undo" : "",
      isResearchRunImportAuditEventUndoable(event) ? "undoable" : "",
      isResearchRunImportAuditEventNeedsReview(event) ? "needs review" : "",
      isResearchRunImportAuditEventRecoverable(event) ? "recoverable recovery" : "",
      event.stage === "undone" ? "undo consumed" : "",
      event.stage === "undo-failed" ? "undo failed retry recovery" : "",
      event.failureCategory ?? "",
      event.recoveryHint,
      String(event.blockedCount),
      event.blockedRows
        .map((row) => [row.id, row.label, row.incoming, row.detail, row.exportPath].join(" "))
        .join(" "),
      event.verifiedReportSignatures
        .map((row) => [row.id, row.label, row.incoming, row.detail, row.exportPath, row.source, row.status, row.reason].join(" "))
        .join(" "),
      String(event.changeCount),
      event.exportPath,
      event.tone
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

export function buildAuditEvidenceReportLedgerRows(
  events: AuditEvidenceReportLedgerEventRecord[]
): AuditEvidenceReportLedgerRow[] {
  return events
    .filter(
      (event) =>
        event.eventType === "audit_evidence_report" ||
        event.eventType === "backtest_report" ||
        event.eventType === "portfolio_report"
    )
    .map((event) => {
      const reportKind: AuditEvidenceReportLedgerRow["reportKind"] =
        event.eventType === "portfolio_report"
          ? "portfolio_report"
          : event.eventType === "backtest_report"
            ? "backtest_report"
            : "audit_evidence_report";
      const contentSha256 = auditReportLedgerMetadataText(event.metadata, "contentSha256");
      const artifactKind =
        auditReportLedgerMetadataText(event.metadata, "artifactKind") ||
        (reportKind === "portfolio_report"
          ? "aiqt.portfolioReport"
          : reportKind === "backtest_report"
            ? "aiqt.backtestReport"
            : "aiqt.auditReport");
      const fileName =
        auditReportLedgerMetadataText(event.metadata, "fileName") ||
        (reportKind === "portfolio_report"
          ? "portfolio-report.md"
          : reportKind === "backtest_report"
            ? "backtest-report.md"
            : "audit-evidence-report.md");
      const focusQuery =
        reportKind === "portfolio_report"
          ? [
              auditReportLedgerMetadataText(event.metadata, "market"),
              auditReportLedgerMetadataText(event.metadata, "timeframe"),
              auditReportLedgerMetadataText(event.metadata, "portfolioName")
            ]
              .filter(Boolean)
              .join(" ")
          : reportKind === "backtest_report"
          ? [
              auditReportLedgerMetadataText(event.metadata, "market"),
              auditReportLedgerMetadataText(event.metadata, "symbol"),
              auditReportLedgerMetadataText(event.metadata, "timeframe"),
              auditReportLedgerMetadataText(event.metadata, "strategyRevision")
            ]
              .filter(Boolean)
              .join(" ")
          : auditReportLedgerMetadataText(event.metadata, "evidenceFocus");
      const isHashReady = /^[a-f0-9]{64}$/iu.test(contentSha256);
      const status: AuditEvidenceReportLedgerStatus = isHashReady ? "ready" : "invalid";
      const signature = auditReportLedgerSignatureMetadata(event.metadata);
      const signatureStatus = status === "ready" ? auditReportLedgerSignatureStatus(signature) : "invalid";
      const signatureLabel = auditReportLedgerSignatureLabel(signatureStatus);
      const importVerificationVerified =
        reportKind === "backtest_report" ? 0 : auditReportLedgerMetadataNumber(event.metadata, "importVerificationVerified");
      const importVerificationInvalid =
        reportKind === "backtest_report" ? 0 : auditReportLedgerMetadataNumber(event.metadata, "importVerificationInvalid");
      const importVerificationDetail =
        reportKind === "backtest_report"
          ? ""
          : auditReportLedgerImportVerificationDetail(event.metadata, importVerificationVerified, importVerificationInvalid);
      return {
        id: event.eventId,
        artifactKind,
        runId: event.runId ?? "unknown",
        createdAt: event.createdAt,
        fileName,
        contentSha256,
        shortHash: contentSha256 ? contentSha256.slice(0, 12) : "missing",
        focusQuery,
        packageMatched:
          reportKind === "portfolio_report"
            ? auditReportLedgerMetadataNumber(event.metadata, "legCount")
            : reportKind === "backtest_report"
            ? auditReportLedgerMetadataNumber(event.metadata, "runComparisonRows")
            : auditReportLedgerMetadataNumber(event.metadata, "packageMatched"),
        packageTotal:
          reportKind === "portfolio_report"
            ? auditReportLedgerMetadataNumber(event.metadata, "equityRows")
            : reportKind === "backtest_report"
            ? auditReportLedgerMetadataNumber(event.metadata, "dataRows")
            : auditReportLedgerMetadataNumber(event.metadata, "packageTotal"),
        importDiffBlocked:
          reportKind === "backtest_report" || reportKind === "portfolio_report"
            ? 0
            : auditReportLedgerMetadataNumber(event.metadata, "importDiffBlocked"),
        importDiffTotal:
          reportKind === "backtest_report" || reportKind === "portfolio_report"
            ? 0
            : auditReportLedgerMetadataNumber(event.metadata, "importDiffTotal"),
        importVerificationDetail,
        importVerificationInvalid,
        importVerificationVerified,
        deepLinkStatus:
          reportKind === "portfolio_report"
            ? "portfolio-report"
            : reportKind === "backtest_report"
            ? "backtest-report"
            : auditReportLedgerMetadataText(event.metadata, "deepLinkStatus") || "unknown",
        status,
        statusLabel:
          status === "ready"
            ? reportKind === "portfolio_report"
              ? "Portfolio report hash recorded"
              : reportKind === "backtest_report"
              ? "Backtest report hash recorded"
              : "Report hash recorded"
            : "Report hash invalid",
        chainId: auditReportLedgerMetadataText(signature, "chainId"),
        signer: auditReportLedgerMetadataText(signature, "signer"),
        signatureAlgorithm: auditReportLedgerMetadataText(signature, "algorithm"),
        signatureDetail: auditReportLedgerSignatureDetail(signature),
        signatureKeyId: auditReportLedgerMetadataText(signature, "keyId"),
        signatureRevokedReason: auditReportLedgerMetadataText(signature, "revokedReason"),
        signatureSignedAt: auditReportLedgerMetadataText(signature, "signedAt"),
        signatureStatus,
        signatureLabel,
        signatureVerifiedAt: auditReportLedgerMetadataText(signature, "verifiedAt"),
        detail: event.detail,
        reportKind,
        tone: auditReportLedgerSignatureTone(signatureStatus)
      };
    });
}

export function buildAuditEvidenceReportLedgerSummary(
  rows: AuditEvidenceReportLedgerRow[]
): AuditEvidenceReportLedgerSummary {
  const ready = rows.filter((row) => row.status === "ready").length;
  const invalid = rows.filter((row) => row.status === "invalid").length;
  const unsigned = rows.filter((row) => row.signatureStatus === "unsigned").length;
  const signed = rows.filter((row) => row.signatureStatus === "signed").length;
  const verified = rows.filter((row) => row.signatureStatus === "verified").length;
  const revoked = rows.filter((row) => row.signatureStatus === "revoked").length;
  const importVerificationVerified = rows.reduce((total, row) => total + row.importVerificationVerified, 0);
  const importVerificationInvalid = rows.reduce((total, row) => total + row.importVerificationInvalid, 0);
  const attention = invalid + revoked;
  return {
    attention,
    chainStatus: rows.length === 0 ? "empty" : attention > 0 ? "attention" : unsigned > 0 ? "unsigned" : "verified",
    importVerificationInvalid,
    importVerificationVerified,
    invalid,
    latestHash: rows.find((row) => row.status === "ready")?.contentSha256 ?? "",
    ready,
    revoked,
    signed,
    total: rows.length,
    unsigned,
    verified
  };
}

export function filterAuditEvidenceReportLedgerRows(
  rows: AuditEvidenceReportLedgerRow[],
  query: string
): AuditEvidenceReportLedgerRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  const queryTokens = normalizedQuery.split(/\s+/u).filter(Boolean);
  return rows.filter((row) => {
    const searchableText = [
      row.id,
      row.artifactKind,
      row.runId,
      row.fileName,
      row.contentSha256,
      row.shortHash,
      row.focusQuery,
      row.deepLinkStatus,
      row.status,
      row.statusLabel,
      row.chainId,
      row.signer,
      row.signatureAlgorithm,
      row.signatureDetail,
      row.signatureKeyId,
      row.signatureRevokedReason,
      row.signatureSignedAt,
      row.signatureStatus,
      row.signatureLabel,
      row.signatureVerifiedAt,
      row.importVerificationDetail,
      String(row.importVerificationVerified),
      String(row.importVerificationInvalid),
      row.detail,
      row.reportKind,
      String(row.packageMatched),
      String(row.packageTotal),
      String(row.importDiffBlocked),
      String(row.importDiffTotal)
    ]
      .join(" ")
      .toLowerCase();
    return queryTokens.every((token) => searchableText.includes(token));
  });
}

export function buildAuditSigningKeyRotationLedgerRows(
  events: AuditEvidenceReportLedgerEventRecord[]
): AuditSigningKeyRotationLedgerRow[] {
  return events
    .filter(
      (event) =>
        event.eventType === "audit_signing_key_rotation_plan" ||
        event.eventType === "audit_signing_key_rotation_apply"
    )
    .map((event) => {
      const blockedReasons = auditReportLedgerMetadataStringList(event.metadata, "blockedReasons");
      const isApplyEvent = event.eventType === "audit_signing_key_rotation_apply";
      const statusMetadata = auditReportLedgerMetadataText(event.metadata, "status");
      const status: AuditSigningKeyRotationLedgerStatus =
        event.stage === "blocked" || statusMetadata === "blocked" || blockedReasons.length > 0
          ? "blocked"
          : isApplyEvent
            ? "ready_for_restart"
            : "prepared";
      const templateSha256 = auditReportLedgerMetadataText(event.metadata, "legacyRegistryTemplateSha256");
      const isTemplateHashReady = /^[a-f0-9]{64}$/iu.test(templateSha256);
      const environmentUpdateNames = auditReportLedgerMetadataStringList(event.metadata, "environmentUpdateNames");
      const secretPlaceholderNames = auditReportLedgerMetadataStringList(event.metadata, "secretPlaceholderNames");
      const stepIds = auditReportLedgerMetadataStringList(event.metadata, "stepIds");
      const confirmedConfirmationIds = auditReportLedgerMetadataStringList(event.metadata, "confirmedConfirmationIds");
      const missingConfirmationIds = auditReportLedgerMetadataStringList(event.metadata, "missingConfirmationIds");
      return {
        id: event.eventId,
        applyMode: auditReportLedgerMetadataText(event.metadata, "applyMode"),
        createdAt: event.createdAt,
        confirmedConfirmationCount: confirmedConfirmationIds.length,
        confirmedConfirmationIds,
        currentKeyFingerprint: isApplyEvent
          ? auditReportLedgerMetadataText(event.metadata, "currentActiveKeyFingerprint")
          : auditReportLedgerMetadataText(event.metadata, "currentKeyFingerprint"),
        currentKeyId: isApplyEvent
          ? auditReportLedgerMetadataText(event.metadata, "currentActiveKeyId")
          : auditReportLedgerMetadataText(event.metadata, "currentKeyId"),
        detail: event.detail,
        environmentUpdateCount: environmentUpdateNames.length,
        eventKind: isApplyEvent ? "apply" : "plan",
        missingConfirmationCount: missingConfirmationIds.length,
        missingConfirmationIds,
        proposedChainId: auditReportLedgerMetadataText(event.metadata, "proposedChainId"),
        proposedKeyId: isApplyEvent
          ? auditReportLedgerMetadataText(event.metadata, "proposedActiveKeyId")
          : auditReportLedgerMetadataText(event.metadata, "proposedKeyId"),
        proposedSigner: auditReportLedgerMetadataText(event.metadata, "proposedSigner"),
        requiresRestart: isApplyEvent
          ? auditReportLedgerMetadataBoolean(event.metadata, "restartRequired")
          : auditReportLedgerMetadataBoolean(event.metadata, "requiresRestart"),
        rotationRequired: auditReportLedgerMetadataBoolean(event.metadata, "rotationRequired"),
        secretPlaceholderCount: secretPlaceholderNames.length,
        stepCount: isApplyEvent ? confirmedConfirmationIds.length + missingConfirmationIds.length : stepIds.length,
        status,
        statusLabel: isApplyEvent
          ? status === "blocked"
            ? "Rotation apply blocked"
            : "Rotation apply ready"
          : status === "blocked"
            ? "Rotation plan blocked"
            : "Rotation plan prepared",
        templateSha256,
        templateShortHash: isApplyEvent ? "apply" : isTemplateHashReady ? templateSha256.slice(0, 12) : "invalid",
        blockedReasons,
        blockedReasonLabel: blockedReasons.length ? blockedReasons.join(" / ") : "none",
        tone: status === "blocked" || (!isApplyEvent && !isTemplateHashReady)
          ? "risk"
          : status === "ready_for_restart"
            ? "positive"
            : "warning"
      };
    });
}

export function filterAuditSigningKeyRotationLedgerRows(
  rows: AuditSigningKeyRotationLedgerRow[],
  query: string
): AuditSigningKeyRotationLedgerRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [
      row.id,
      row.createdAt,
      row.currentKeyFingerprint,
      row.currentKeyId,
      row.detail,
      row.proposedChainId,
      row.proposedKeyId,
      row.proposedSigner,
      row.status,
      row.statusLabel,
      row.eventKind,
      row.applyMode,
      row.templateSha256,
      row.templateShortHash,
      row.blockedReasonLabel,
      row.confirmedConfirmationIds.join(" "),
      row.missingConfirmationIds.join(" "),
      String(row.environmentUpdateCount),
      String(row.confirmedConfirmationCount),
      String(row.missingConfirmationCount),
      String(row.secretPlaceholderCount),
      String(row.stepCount)
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function auditReportLedgerMetadataText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function auditReportLedgerMetadataBoolean(metadata: Record<string, unknown>, key: string): boolean {
  return metadata[key] === true;
}

function auditReportLedgerMetadataStringList(metadata: Record<string, unknown>, key: string): string[] {
  const value = metadata[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function auditReportLedgerSignatureMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const value = metadata.signature;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function auditReportLedgerSignatureStatus(
  signature: Record<string, unknown>
): AuditEvidenceReportSignatureStatus {
  const value = auditReportLedgerMetadataText(signature, "status").toLowerCase();
  return value === "signed" || value === "verified" || value === "revoked" || value === "invalid"
    ? value
    : "unsigned";
}

function auditReportLedgerSignatureLabel(status: AuditEvidenceReportSignatureStatus): string {
  if (status === "verified") {
    return "Verified signature";
  }
  if (status === "signed") {
    return "Signed report hash";
  }
  if (status === "revoked") {
    return "Revoked signature";
  }
  if (status === "invalid") {
    return "Signature chain blocked";
  }
  return "Unsigned report hash";
}

function auditReportLedgerSignatureTone(
  status: AuditEvidenceReportSignatureStatus
): AuditEvidenceReportLedgerRow["tone"] {
  return status === "signed" || status === "verified" ? "positive" : status === "revoked" || status === "invalid" ? "risk" : "ai";
}

function auditReportLedgerSignatureDetail(signature: Record<string, unknown>): string {
  return [
    auditReportLedgerMetadataText(signature, "signer"),
    auditReportLedgerMetadataText(signature, "keyId"),
    auditReportLedgerMetadataText(signature, "algorithm")
  ]
    .filter(Boolean)
    .join(" · ");
}

function auditReportLedgerImportVerificationDetail(
  metadata: Record<string, unknown>,
  verified: number,
  invalid: number
): string {
  const latestStatus = auditReportLedgerMetadataText(metadata, "importVerificationLatestStatus");
  const latestExportPath = auditReportLedgerMetadataText(metadata, "importVerificationLatestExportPath");
  const latestReason = auditReportLedgerMetadataText(metadata, "importVerificationLatestReason");
  const latestSource = auditReportLedgerMetadataText(metadata, "importVerificationLatestSource");
  const latestDetail =
    latestStatus && latestExportPath
      ? ` · latest ${latestStatus} ${latestExportPath}${latestReason ? ` · ${latestReason}` : ""}${
          latestSource ? ` · ${latestSource}` : ""
        }`
      : "";
  return `Import report verification: ${verified} verified / ${invalid} invalid${latestDetail}`;
}

function auditReportLedgerMetadataNumber(metadata: Record<string, unknown>, key: string): number {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

const researchRunImportFailureBucketOrder: ResearchRunImportAuditFailureBucketCategory[] = [
  "blocked",
  "schema",
  "integrity",
  "artifact-counts",
  "core",
  "unknown"
];

function researchRunImportFailureBucketLabel(category: ResearchRunImportAuditFailureBucketCategory): string {
  return (
    {
      blocked: "Preflight blocked",
      schema: "Schema contract",
      integrity: "Integrity check",
      "artifact-counts": "Artifact counts",
      core: "Core rejection",
      unknown: "Unknown failure"
    } satisfies Record<ResearchRunImportAuditFailureBucketCategory, string>
  )[category];
}

const researchRunImportBlockedEvidenceBucketOrder: ResearchRunImportBlockedEvidenceBucketCategory[] = [
  "import-verification",
  "report-signature",
  "package-integrity",
  "artifact-counts",
  "live-boundary",
  "data-snapshot",
  "unknown"
];

function researchRunImportBlockedEvidenceBucketCategory(
  row: ResearchRunImportAuditBlockedRow
): ResearchRunImportBlockedEvidenceBucketCategory {
  const searchableText = [row.id, row.label, row.incoming, row.detail, row.exportPath].join(" ").toLowerCase();
  if (
    searchableText.includes("invalid imported evidence") ||
    searchableText.includes("import verification") ||
    searchableText.includes("local core import verification")
  ) {
    return "import-verification";
  }
  if (row.id === "audit-report" || row.id === "backtest-report" || searchableText.includes("signature")) {
    return "report-signature";
  }
  if (row.id === "package-integrity" || searchableText.includes("integrity")) {
    return "package-integrity";
  }
  if (row.id === "artifact-counts" || searchableText.includes("artifact")) {
    return "artifact-counts";
  }
  if (row.id === "live-boundary" || searchableText.includes("live boundary")) {
    return "live-boundary";
  }
  if (row.id === "data-snapshot" || searchableText.includes("data snapshot")) {
    return "data-snapshot";
  }
  return "unknown";
}

function researchRunImportBlockedEvidenceBucketLabel(
  category: ResearchRunImportBlockedEvidenceBucketCategory
): string {
  return (
    {
      "import-verification": "Import verification",
      "report-signature": "Report signature",
      "package-integrity": "Package integrity",
      "artifact-counts": "Artifact counts",
      "live-boundary": "Live boundary",
      "data-snapshot": "Data snapshot",
      unknown: "Other blocked evidence"
    } satisfies Record<ResearchRunImportBlockedEvidenceBucketCategory, string>
  )[category];
}

function researchRunImportBlockedEvidenceBucketTone(
  category: ResearchRunImportBlockedEvidenceBucketCategory
): ResearchRunImportBlockedEvidenceBucket["tone"] {
  return category === "data-snapshot" || category === "unknown" ? "warning" : "risk";
}

const researchRunImportVerifiedReportSignatureBucketOrder: ResearchRunImportVerifiedReportSignatureBucket["status"][] = [
  "verified",
  "invalid"
];

function researchRunImportVerifiedReportSignatureBucketLabel(
  status: ResearchRunImportVerifiedReportSignatureBucket["status"]
): string {
  return (
    {
      verified: "Local core verified",
      invalid: "Local core invalid"
    } satisfies Record<ResearchRunImportVerifiedReportSignatureBucket["status"], string>
  )[status];
}

function researchRunImportVerifiedReportSignatureBucketTone(
  status: ResearchRunImportVerifiedReportSignatureBucket["status"]
): ResearchRunImportVerifiedReportSignatureBucket["tone"] {
  return status === "verified" ? "positive" : "risk";
}

function isResearchRunImportAuditEventNeedsReview(event: ResearchRunImportAuditEvent): boolean {
  return event.stage === "blocked" || event.stage === "failed" || event.stage === "undo-failed";
}

function isResearchRunImportAuditEventUndoable(event: ResearchRunImportAuditEvent): boolean {
  return event.stage === "confirmed" && Boolean(event.undoToken?.trim());
}

function isResearchRunImportAuditEventRecoverable(event: ResearchRunImportAuditEvent): boolean {
  return isResearchRunImportAuditEventNeedsReview(event) || isResearchRunImportAuditEventUndoable(event);
}

function researchRunImportAuditEventMatchesFilter(
  event: ResearchRunImportAuditEvent,
  filter: ResearchRunImportAuditFilter
): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "needs-review") {
    return isResearchRunImportAuditEventNeedsReview(event);
  }
  if (filter === "undoable") {
    return isResearchRunImportAuditEventUndoable(event);
  }
  if (filter === "recoverable") {
    return isResearchRunImportAuditEventRecoverable(event);
  }
  return event.stage === filter;
}

function researchRunImportAuditSummary(stage: ResearchRunImportAuditEventStage): string {
  if (stage === "blocked") {
    return "Import preview blocked";
  }
  if (stage === "confirmed") {
    return "Import applied";
  }
  if (stage === "failed") {
    return "Import failed";
  }
  if (stage === "cancelled") {
    return "Import cancelled";
  }
  if (stage === "undone") {
    return "Import undone";
  }
  if (stage === "undo-failed") {
    return "Import undo failed";
  }
  return "Import preview ready";
}

function researchRunImportAuditDetail({
  blockedCount,
  changeCount,
  error,
  stage
}: {
  blockedCount: number;
  changeCount: number;
  error?: string | null;
  fileName: string;
  stage: ResearchRunImportAuditEventStage;
}): string {
  const counts = `${blockedCount} blocked · ${changeCount} change${changeCount === 1 ? "" : "s"}`;
  if (stage === "failed") {
    return error || "Import failed before the package could be applied.";
  }
  if (stage === "cancelled") {
    return `Import preview was discarded before writing to the local audit store. ${counts}.`;
  }
  if (stage === "undone") {
    return "Research run import undo restored the previous audited stores.";
  }
  if (stage === "undo-failed") {
    return error || "Research run import undo failed before the previous audited stores could be restored.";
  }
  if (stage === "confirmed") {
    return `Research run import wrote to the local audit store. ${counts}.`;
  }
  if (stage === "blocked") {
    return `Import preview found blocked preflight gates. ${counts}.`;
  }
  return `Import preview passed preflight. ${counts}.`;
}

function researchRunImportAuditTone(stage: ResearchRunImportAuditEventStage): ResearchRunImportAuditEvent["tone"] {
  if (stage === "confirmed") {
    return "positive";
  }
  if (stage === "failed" || stage === "blocked" || stage === "undo-failed") {
    return "risk";
  }
  if (stage === "cancelled" || stage === "undone") {
    return "warning";
  }
  return "ai";
}

function researchRunImportFailure(error?: string | null): {
  category: ResearchRunImportFailureCategory;
  detail: string | null;
} {
  const message = error?.trim() || "";
  const normalized = message.toLowerCase();
  if (!message) {
    return {
      category: "unknown",
      detail: null
    };
  }
  if (normalized.includes("invalid research run export contract")) {
    return {
      category: "schema",
      detail: `Schema contract invalid: ${message}`
    };
  }
  if (normalized.includes("integrity") || normalized.includes("hash")) {
    return {
      category: "integrity",
      detail: `Integrity check failed: ${message}`
    };
  }
  if (normalized.includes("artifact") || normalized.includes("count") || normalized.includes("manifest")) {
    return {
      category: "artifact-counts",
      detail: `Artifact manifest mismatch: ${message}`
    };
  }
  if (
    normalized.includes("http") ||
    normalized.includes("invalid_research_run_export") ||
    normalized.includes("research_run_import_undo") ||
    normalized.includes("run_mismatch") ||
    normalized.includes("expected_run")
  ) {
    return {
      category: "core",
      detail: `Core import rejected the package: ${message}`
    };
  }
  return {
    category: "unknown",
    detail: message
  };
}

function researchRunImportRecoveryHint(
  stage: ResearchRunImportAuditEventStage,
  rollbackTargetRunId: string | null,
  failure: { category: ResearchRunImportFailureCategory; detail: string | null },
  undoToken: string | null = null
): string {
  if (stage === "undone") {
    return `Import undo has already consumed ${undoToken || "the undo token"}.`;
  }
  if (stage === "confirmed") {
    if (undoToken) {
      return `Undo import ${undoToken} to restore the audited stores.`;
    }
    return rollbackTargetRunId
      ? `Replay previous audited run ${rollbackTargetRunId} to roll back the workspace context.`
      : "No previous audited run was bound before import; replay a run from history to change context.";
  }
  if (stage === "undo-failed") {
    return "Review the undo rejection detail, replay the previous audited run if needed, then retry with the matching import event.";
  }
  if (stage === "failed") {
    if (failure.category === "schema") {
      return "Choose a valid aiqt.researchRun.export package or a wrapped { export } payload.";
    }
    if (failure.category === "integrity") {
      return "Re-export the run or choose a package whose canonical SHA-256 integrity matches its payload.";
    }
    if (failure.category === "artifact-counts") {
      return "Re-export the run and ensure manifest artifact counts match the included payload arrays.";
    }
    if (failure.category === "core") {
      return "Review the Python core rejection detail, fix the package, and run import preflight again.";
    }
    return "Inspect the import error, then retry with a verified research run export package.";
  }
  if (stage === "blocked") {
    return "Import not applied; fix blocked preflight rows before confirming.";
  }
  if (stage === "cancelled") {
    return "Import not applied; no rollback is required.";
  }
  return "Import not applied yet; confirm only after reviewing diff rows.";
}

function auditTimelineExportPath(item: AiReviewAuditTimelineItem): string {
  if (item.kind === "current-evidence") {
    return "researchRun.runId";
  }
  if (item.kind === "saved-review") {
    return "aiReviewRuns[].record";
  }
  return "executionHandoff.requiredGates";
}

function timestampSortValue(timestamp: string): number {
  const value = Date.parse(timestamp);
  return Number.isFinite(value) ? value : 0;
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

function researchNoteReadinessDetail(
  noteValue: "draft not saved" | "not saved" | "saved" | "unsaved changes",
  noteBody: string,
  updatedAt: string | null | undefined,
  error?: string | null
): string {
  if (!noteBody) {
    return error?.trim() || "Save a note to bind the research hypothesis to this symbol and timeframe.";
  }
  const compactBody = compactResearchNoteDetail(noteBody);
  if (noteValue === "saved" && updatedAt) {
    return `Saved ${updatedAt} · ${compactBody}`;
  }
  if (noteValue === "unsaved changes" && updatedAt) {
    return `Unsaved changes since ${updatedAt} · ${compactBody}`;
  }
  if (noteValue === "draft not saved") {
    return `Draft not saved · ${compactBody}`;
  }
  return compactBody;
}

export function buildResearchContextReadinessRows(
  input: ResearchContextReadinessInput
): ResearchContextReadinessRow[] {
  const instrument = input.workspace.selectedInstrument;
  const timeframe = input.workspace.selectedTimeframe;
  const symbolReady = Boolean(instrument.symbol.trim());
  const warnings = input.dataQuality.warnings.filter((warning) => warning.trim());
  const barCount = Math.max(0, Math.floor(input.barCount || input.dataQuality.rows || 0));
  const klineSource = input.dataQuality.source || "unknown";
  const klineSourceNeedsReview = isReviewRequiredKlineSource(klineSource);
  const klineStatus: ResearchContextReadinessStatus =
    barCount <= 0 ? "blocked" : input.dataQuality.isComplete && warnings.length === 0 && !klineSourceNeedsReview ? "ready" : "review";
  const klineDetail = `${klineSource} ${input.dataQuality.isComplete ? "complete" : "review"} · ${
    warnings[0] ?? (klineSourceNeedsReview ? "source requires review" : formatWarningCount(0))
  }`;
  const cache = input.cacheContext ?? null;
  const cacheRows = cache ? Math.max(0, Math.floor(cache.rowCount || 0)) : 0;
  const cacheStatus: ResearchContextReadinessStatus =
    !cache || cacheRows <= 0 || cache.freshness === "empty"
      ? "blocked"
      : cache.freshness === "fresh"
        ? "ready"
        : "review";
  const noteBody = input.note?.body.trim() ?? "";
  const noteHasExplicitSavedBody = input.note ? Object.prototype.hasOwnProperty.call(input.note, "savedBody") : false;
  const savedNoteBody = noteHasExplicitSavedBody
    ? input.note?.savedBody?.trim() ?? ""
    : input.note?.updatedAt
      ? noteBody
      : "";
  const hasSavedNote = Boolean(savedNoteBody);
  const noteValue = noteBody
    ? hasSavedNote
      ? noteBody === savedNoteBody
        ? "saved"
        : "unsaved changes"
      : "draft not saved"
    : "not saved";
  const noteStatus: ResearchContextReadinessStatus = noteValue === "saved" ? "ready" : "review";

  const rows: ResearchContextReadinessRow[] = [
    {
      id: "instrument",
      label: "Selected symbol",
      value: `${instrument.symbol || "N/A"} · ${timeframe}`,
      detail: `${instrument.name || instrument.symbol || "Unknown"} · ${instrument.market} · ${input.workspace.watchlist.length} watched`,
      status: symbolReady ? "ready" : "blocked",
      tone: symbolReady ? "positive" : "risk"
    }
  ];

  if (input.watchlist) {
    rows.push(buildWatchlistReadinessRow(input.workspace, input.watchlist.hasUnsavedChanges));
  }

  rows.push(
    {
      id: "klines",
      label: "K-line data",
      value: `${barCount} bars`,
      detail: klineDetail,
      status: klineStatus,
      tone: readinessTone(klineStatus),
      action: klineStatus === "ready" ? undefined : "refresh-cache"
    },
    {
      id: "cache",
      label: "Local cache",
      value: cache ? `${cache.freshness} · ${cacheRows} rows` : "missing",
      detail: cacheReadinessDetail(cache, cacheRows),
      status: cacheStatus,
      tone: readinessTone(cacheStatus),
      action: cacheStatus === "ready" ? undefined : "refresh-cache"
    }
  );

  if (input.watchlistRefreshRuns) {
    rows.push(buildRefreshEvidenceReadinessRow(input.workspace, input.watchlistRefreshRuns));
  }

  rows.push(
    {
      id: "note",
      label: "Research note",
      value: noteValue,
      detail: researchNoteReadinessDetail(noteValue, noteBody, input.note?.updatedAt, input.note?.error),
      status: noteStatus,
      tone: readinessTone(noteStatus),
      action: noteStatus === "ready" ? undefined : "save-note"
    },
    buildResearchWorkspaceReadinessRow(input.workspace, input.activeWorkAreaId ?? "research")
  );

  return rows;
}

function buildRefreshEvidenceReadinessRow(
  workspace: TerminalWorkspace,
  runs: WatchlistCacheRefreshRunSnapshot[]
): ResearchContextReadinessRow {
  const instrument = workspace.selectedInstrument;
  const timeframe = workspace.selectedTimeframe;
  const context = strategyContextLabel(instrument.market, instrument.symbol, timeframe);
  const matching = runs
    .flatMap((run) =>
      run.items.map((item) => ({
        run,
        item
      }))
    )
    .find(
      ({ item }) =>
        item.market === instrument.market &&
        item.symbol === instrument.symbol &&
        item.timeframe === timeframe
    );

  if (!matching) {
    return {
      id: "refresh",
      label: "Refresh evidence",
      value: "no matching refresh",
      detail: `Run watchlist cache refresh for ${context} before relying on this context.`,
      status: "review",
      tone: "warning",
      action: "refresh-watchlist-cache",
      evidenceRunId: undefined
    };
  }

  const warnings = matching.item.quality.warnings.filter((warning) => warning.trim());
  const source = matching.item.quality.source || "unknown";
  const sourceNeedsReview = isReviewRequiredKlineSource(source);
  const isReady =
    matching.item.status === "refreshed" &&
    matching.item.quality.isComplete &&
    warnings.length === 0 &&
    !sourceNeedsReview;
  const rowsCached = Math.max(0, Math.floor(matching.item.upsertedRows || 0));

  return {
    id: "refresh",
    label: "Refresh evidence",
    value: `${matching.item.status} · ${matching.run.runId}`,
    detail: isReady
      ? `${matching.run.createdAt} · ${source} · ${rowsCached} rows cached`
      : `${matching.run.createdAt} · ${source} · ${rowsCached} rows cached · ${refreshEvidenceReviewReason(
          matching.item,
          sourceNeedsReview,
          warnings
        )}`,
    status: isReady ? "ready" : "review",
    tone: isReady ? "positive" : "warning",
    action: isReady ? undefined : "refresh-watchlist-cache",
    evidenceRunId: matching.run.runId
  };
}

function refreshEvidenceReviewReason(
  item: WatchlistCacheRefreshItemSnapshot,
  sourceNeedsReview: boolean,
  warnings: string[]
): string {
  if (item.error) {
    return item.error;
  }
  if (item.status !== "refreshed") {
    return `refresh ${item.status}`;
  }
  if (!item.quality.isComplete) {
    return "refresh quality incomplete";
  }
  if (warnings[0]) {
    return warnings[0];
  }
  if (sourceNeedsReview) {
    return "source requires review";
  }
  return "refresh requires review";
}

function buildWatchlistReadinessRow(
  workspace: TerminalWorkspace,
  hasUnsavedChanges: boolean
): ResearchContextReadinessRow {
  const watchedCount = workspace.watchlist.length;
  return {
    id: "watchlist",
    label: "Watchlist state",
    value: hasUnsavedChanges ? "unsaved changes" : "saved",
    detail: hasUnsavedChanges
      ? `Save ${watchedCount} watched symbols before relying on this research context.`
      : `${watchedCount} watched symbols are persisted for local research.`,
    status: hasUnsavedChanges ? "review" : "ready",
    tone: hasUnsavedChanges ? "warning" : "positive",
    action: hasUnsavedChanges ? "save-watchlist" : undefined
  };
}

function buildResearchWorkspaceReadinessRow(
  workspace: TerminalWorkspace,
  activeWorkAreaId: ProductWorkAreaId
): ResearchContextReadinessRow {
  const draft = buildResearchWorkspaceStateDraft(workspace, activeWorkAreaId);
  const savedState = workspace.researchWorkspaceState ?? null;
  const isSaved = researchWorkspaceStateMatchesDraft(savedState, draft);
  const context = `${strategyContextLabel(draft.market, draft.symbol, draft.timeframe)} · ${draft.workspaceId}`;
  const value = isSaved ? "saved" : savedState ? "unsaved changes" : "not saved";
  const detail = isSaved
    ? `Saved ${savedState?.updatedAt ?? "time unknown"} · ${draft.workspaceId} entry`
    : `Save ${context} before relying on this workspace context.`;

  return {
    id: "workspace",
    label: "Workspace state",
    value,
    detail,
    status: isSaved ? "ready" : "review",
    tone: isSaved ? "positive" : "warning",
    action: isSaved ? undefined : "save-workspace"
  };
}

export function buildResearchContextEvidenceRows(workspace: TerminalWorkspace): ResearchContextEvidenceRow[] {
  const binding = buildResearchRunContextBinding(workspace);
  const status: ResearchContextReadinessStatus =
    binding.status === "matched" ? "ready" : binding.status === "mismatched" ? "blocked" : "review";
  const tone: ResearchContextEvidenceRow["tone"] =
    status === "ready" ? "positive" : status === "blocked" ? "risk" : "warning";

  return [
    {
      id: "audit-run",
      label: "Audited run",
      value: binding.runId ?? "no audited run",
      detail: binding.detail,
      status,
      tone
    }
  ];
}

export function buildWatchlistCacheRefreshHistoryRows(
  runs: WatchlistCacheRefreshRunSnapshot[],
  limit = 4,
  selectedRunId: string | null = null
): WatchlistCacheRefreshHistoryRow[] {
  const boundedLimit = Math.max(1, Math.min(limit, 8));
  return runs.slice(0, boundedLimit).map((run) => {
    const total = Math.max(0, run.summary.totalSymbols);
    const refreshed = Math.max(0, run.summary.refreshed);
    const skipped = Math.max(0, run.summary.skipped);
    const failed = Math.max(0, run.summary.failed);
    const tone: WatchlistCacheRefreshHistoryRow["tone"] = failed > 0 ? "risk" : skipped > 0 ? "warning" : "positive";
    return {
      id: run.runId,
      runId: run.runId,
      createdAt: run.createdAt,
      timeframe: run.timeframe,
      label: `${run.runId} · ${run.timeframe}`,
      total,
      refreshed,
      skipped,
      failed,
      upsertedRows: Math.max(0, run.summary.upsertedRows),
      value: `${refreshed}/${total} refreshed`,
      detail: `${Math.max(0, run.summary.upsertedRows)} rows cached · ${skipped} skipped · ${failed} failed`,
      selected: selectedRunId === run.runId,
      tone
    };
  });
}

export function resolveWatchlistCacheRefreshRunSelection(
  runs: WatchlistCacheRefreshRunSnapshot[],
  selectedRunId: string | null | undefined
): WatchlistCacheRefreshRunSnapshot | null {
  if (!runs.length) {
    return null;
  }
  return runs.find((run) => run.runId === selectedRunId) ?? runs[0] ?? null;
}

export function resolveWatchlistCacheRefreshRunIdFromUrl(search: string | URLSearchParams | null | undefined): string | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const runId = params.get("watchlistRefreshRun")?.trim() ?? "";
  return /^[A-Za-z0-9._:-]{1,120}$/.test(runId) ? runId : null;
}

export function buildWatchlistCacheRefreshItemRows(
  run: WatchlistCacheRefreshRunSnapshot | null | undefined
): WatchlistCacheRefreshItemRow[] {
  if (!run) {
    return [];
  }

  return run.items.map((item) => {
    const upsertedRows = Math.max(0, item.upsertedRows);
    const rows = Math.max(0, item.quality.rows);
    const source = item.quality.source || "unknown";
    const firstWarning = item.quality.warnings.find((warning) => warning.trim().length > 0);
    const detail =
      item.error ??
      (firstWarning ? `${source} · ${firstWarning}` : `${source} · ${item.quality.isComplete ? "complete" : "incomplete"}`);
    const tone: WatchlistCacheRefreshItemRow["tone"] =
      item.status === "failed" ? "risk" : item.status === "skipped" ? "warning" : "positive";

    return {
      id: `${run.runId}:${item.market}:${item.symbol}`,
      market: item.market,
      symbol: item.symbol,
      name: item.name || item.symbol,
      timeframe: item.timeframe,
      instrument: {
        symbol: item.symbol,
        name: item.name || item.symbol,
        market: item.market,
        changePct: 0
      },
      status: item.status,
      statusLabel: item.status,
      source,
      rows,
      upsertedRows,
      value: `${upsertedRows} rows cached`,
      detail,
      tone
    };
  });
}

export function buildWatchlistCacheRefreshCoverageRow(
  run: WatchlistCacheRefreshRunSnapshot | null | undefined,
  workspace: TerminalWorkspace
): WatchlistCacheRefreshCoverageRow | null {
  if (!run) {
    return null;
  }

  const instrument = workspace.selectedInstrument;
  const timeframe = workspace.selectedTimeframe;
  const context = strategyContextLabel(instrument.market, instrument.symbol, timeframe);
  const matching = run.items.find(
    (item) => item.market === instrument.market && item.symbol === instrument.symbol && item.timeframe === timeframe
  );

  if (!matching) {
    return {
      id: `${run.runId}:coverage`,
      runId: run.runId,
      label: "Selected refresh coverage",
      value: "not current context",
      detail: `Selected run does not include ${context}; choose a matching run or refresh the watchlist cache.`,
      status: "review",
      tone: "warning",
      canOpenResearch: false
    };
  }

  const warnings = matching.quality.warnings.filter((warning) => warning.trim());
  const source = matching.quality.source || "unknown";
  const sourceNeedsReview = isReviewRequiredKlineSource(source);
  const isReady =
    matching.status === "refreshed" &&
    matching.quality.isComplete &&
    warnings.length === 0 &&
    !sourceNeedsReview;
  const rowsCached = Math.max(0, Math.floor(matching.upsertedRows || 0));
  const baseDetail = `${matching.symbol} · ${matching.timeframe} covered by ${source} · ${rowsCached} rows cached`;

  return {
    id: `${run.runId}:coverage`,
    runId: run.runId,
    label: "Selected refresh coverage",
    value: `${isReady ? "covered" : "review"} · ${matching.status}`,
    detail: isReady ? baseDetail : `${baseDetail} · ${refreshEvidenceReviewReason(matching, sourceNeedsReview, warnings)}`,
    status: isReady ? "ready" : "review",
    tone: isReady ? "positive" : "warning",
    canOpenResearch: true
  };
}

export function buildResearchPipelinePreflight(rows: ResearchContextReadinessRow[]): ResearchPipelinePreflight {
  const issues = rows
    .flatMap<ResearchPipelinePreflightIssue>((row) =>
      row.status === "ready"
        ? []
        : [
            {
              id: row.id,
              label: row.label,
              value: row.value,
              detail: row.detail,
              status: row.status,
              action: row.action
            }
          ]
    );
  const blockedIssues = issues.filter((issue) => issue.status === "blocked");
  const primaryAction = issues.find((issue) => issue.action)?.action;

  if (blockedIssues.length) {
    return {
      status: "blocked",
      canRun: false,
      requiresConfirmation: false,
      summary: `Fix ${blockedIssues.length} blocked research context ${blockedIssues.length === 1 ? "gate" : "gates"} before running the pipeline.`,
      primaryAction,
      issues
    };
  }

  if (issues.length) {
    return {
      status: "review",
      canRun: true,
      requiresConfirmation: true,
      summary: `Review ${issues.length} research context ${issues.length === 1 ? "gate" : "gates"} before running the pipeline.`,
      primaryAction,
      issues
    };
  }

  return {
    status: "ready",
    canRun: true,
    requiresConfirmation: false,
    summary: "Research context is ready for pipeline run.",
    issues: []
  };
}

function readinessTone(status: ResearchContextReadinessStatus): "positive" | "warning" | "risk" {
  if (status === "ready") {
    return "positive";
  }
  return status === "review" ? "warning" : "risk";
}

function isReviewRequiredKlineSource(source: string): boolean {
  const normalized = source.trim().toLowerCase();
  return normalized === "demo-fallback" || normalized === "unknown";
}

function cacheReadinessDetail(cache: ResearchContextReadinessCacheContext | null, rowCount: number): string {
  if (!cache || rowCount <= 0 || cache.freshness === "empty") {
    return "Refresh the current cache before trusting this research context.";
  }
  const age = typeof cache.ageHours === "number" && Number.isFinite(cache.ageHours) ? Math.max(0, cache.ageHours) : null;
  const ageLabel = age === null ? "age unknown" : `${Number.isInteger(age) ? age : age.toFixed(1)}h old`;
  const latest = cache.latestTimestamp || "latest timestamp unknown";
  if (cache.freshness === "fresh") {
    return `Latest cache ${latest} · ${ageLabel}`;
  }
  return `Cache is ${cache.freshness}; latest ${latest} · ${ageLabel}`;
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

export function buildPortfolioBacktestDraft(
  runs: ResearchRunAudit[],
  currentRunId: string | null | undefined
): PortfolioBacktestDraft {
  const current = currentRunId ? runs.find((run) => run.runId === currentRunId) : runs[0];
  if (!current) {
    return blockedPortfolioBacktestDraft("Portfolio backtest blocked", "Run at least one audited research pipeline first.");
  }

  const candidates = runs
    .filter(
      (run) =>
        run.market === current.market &&
        run.timeframe === current.timeframe &&
        Array.isArray(run.backtestEquityCurve) &&
        run.backtestEquityCurve.length > 0
    )
    .sort((left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt));

  const selected = [
    current,
    ...candidates.filter((run) => run.runId !== current.runId && run.symbol !== current.symbol)
  ].slice(0, 3);

  if (selected.length < 2) {
    return blockedPortfolioBacktestDraft(
      "Portfolio backtest needs peers",
      "Need at least two audited runs from the same market and timeframe with equity curves."
    );
  }

  const peerWeight = selected.length > 1 ? roundWeight(0.4 / (selected.length - 1)) : 0;
  const weights = selected.map((run, index) => (index === 0 ? 0.5 : peerWeight));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const cashWeight = roundWeight(Math.max(0, 1 - totalWeight));
  const rows = selected.map((run, index) => ({
    runId: run.runId,
    symbol: run.symbol,
    targetWeight: weights[index],
    weightLabel: formatWeightLabel(weights[index]),
    strategyRevision: run.strategyRevision,
    totalReturnPct: formatMetricPercent(run.metrics, "total_return_pct", "totalReturnPct"),
    maxDrawdownPct: formatMetricPercent(run.metrics, "max_drawdown_pct", "maxDrawdownPct"),
    current: run.runId === current.runId
  }));

  return {
    status: "ready",
    headline: "Portfolio backtest ready",
    summary: `${selected.length} audited runs from ${current.market} ${current.timeframe}; cash buffer ${formatWeightLabel(cashWeight)}.`,
    cashWeight,
    request: {
      name: `${current.market} ${current.timeframe} audited basket`,
      initialCash: current.backtestAssumptions?.initialCash ?? 100000,
      legs: selected.map((run, index) => ({ runId: run.runId, targetWeight: weights[index] }))
    },
    rows
  };
}

export function buildPortfolioPeerAuditPlan(
  workspace: TerminalWorkspace,
  runs: ResearchRunAudit[]
): PortfolioPeerAuditPlan {
  const market = workspace.selectedInstrument.market;
  const timeframe = workspace.selectedTimeframe;
  const sameMarketWatchlist = workspace.watchlist
    .filter((instrument) => instrument.market === market)
    .filter(
      (instrument, index, instruments) =>
        instruments.findIndex((candidate) => candidate.symbol === instrument.symbol && candidate.market === instrument.market) === index
    )
    .slice(0, 4);

  if (!workspace.researchRun?.runId) {
    return {
      status: "blocked",
      headline: "Peer audit blocked",
      summary: "Run the selected instrument pipeline before preparing portfolio peers.",
      auditedCount: 0,
      missingCount: sameMarketWatchlist.length,
      candidates: sameMarketWatchlist.map((instrument) => ({
        market: instrument.market,
        symbol: instrument.symbol,
        name: instrument.name,
        timeframe,
        status: "missing",
        runId: null
      }))
    };
  }

  const auditedBySymbol = new Map<string, ResearchRunAudit>();
  for (const run of runs) {
    if (
      run.market === market &&
      run.timeframe === timeframe &&
      Array.isArray(run.backtestEquityCurve) &&
      run.backtestEquityCurve.length > 0 &&
      !auditedBySymbol.has(run.symbol)
    ) {
      auditedBySymbol.set(run.symbol, run);
    }
  }

  const candidates: PortfolioPeerAuditCandidate[] = sameMarketWatchlist.map((instrument) => {
    const auditedRun = auditedBySymbol.get(instrument.symbol);
    return {
      market: instrument.market,
      symbol: instrument.symbol,
      name: instrument.name,
      timeframe,
      status: auditedRun ? "audited" : "missing",
      runId: auditedRun?.runId ?? null
    };
  });
  const auditedCount = candidates.filter((candidate) => candidate.status === "audited").length;
  const missingCount = candidates.filter((candidate) => candidate.status === "missing").length;

  if (auditedCount >= 2) {
    return {
      status: "complete",
      headline: "Peer audits complete",
      summary: `${auditedCount} audited portfolio legs are ready for a static-weight portfolio backtest.`,
      auditedCount,
      missingCount,
      candidates
    };
  }

  return {
    status: missingCount > 0 ? "ready" : "blocked",
    headline: missingCount > 0 ? "Peer audits available" : "Peer audit blocked",
    summary:
      missingCount > 0
        ? `${missingCount} peer audit${missingCount === 1 ? "" : "s"} can be generated from the current watchlist.`
        : "Add another same-market watchlist instrument before preparing a portfolio backtest.",
    auditedCount,
    missingCount,
    candidates
  };
}

export function buildPortfolioBacktestDiagnosticRows<T extends PortfolioBacktestDiagnosticInput>(
  portfolio: T | null | undefined
): PortfolioBacktestDiagnosticRow[] {
  if (!portfolio || !portfolio.legs.length) {
    return [];
  }

  const largestLeg = [...portfolio.legs].sort((left, right) => right.targetWeight - left.targetWeight)[0];
  const concentrationStatus =
    largestLeg.targetWeight >= 0.75 ? "blocked" : largestLeg.targetWeight > 0.5 ? "review" : "passed";
  const concentrationDetail =
    concentrationStatus === "passed"
      ? "Largest leg remains under the 50% concentration review threshold."
      : concentrationStatus === "blocked"
        ? "Largest leg exceeds the 75% hard concentration threshold."
        : "Largest leg exceeds the 50% concentration review threshold.";

  const cashStatus = portfolio.cashWeight > 0.3 || portfolio.cashWeight < 0.02 ? "review" : "passed";
  const cashDetail =
    portfolio.cashWeight > 0.3
      ? "Cash buffer is high, so the basket may be under-invested."
      : portfolio.cashWeight < 0.02
        ? "Cash buffer is thin; execution slippage or round lots may need review."
        : "Cash buffer is inside the static-weight review band.";

  const grossExposure = portfolio.legs.reduce((sum, leg) => sum + leg.targetWeight, 0);
  const exposureStatus: PortfolioBacktestDiagnosticStatus =
    grossExposure > 1.0001 ? "blocked" : grossExposure >= 0.98 || grossExposure < 0.65 ? "review" : "passed";
  const exposureDetail =
    exposureStatus === "blocked"
      ? "Gross target exposure exceeds 100%; the basket cannot be promoted without resizing."
      : grossExposure >= 0.98
        ? "Gross target exposure is near fully invested; cash/slippage buffer needs review."
        : grossExposure < 0.65
          ? "Gross target exposure is low, so the basket may be under-invested."
          : "Gross target exposure leaves a cash/slippage buffer.";

  const driftReview = buildPortfolioRebalanceDriftReview(portfolio);
  const riskContributionReview = buildPortfolioRiskContributionReview(portfolio);
  const covarianceRiskReview = buildPortfolioCovarianceRiskReview(portfolio);
  const correlationReview = buildPortfolioCorrelationReview(portfolio);

  const negativeLegs = portfolio.legs.filter((leg) => leg.contributionValue < 0);
  const worstLeg = negativeLegs.sort((left, right) => left.contributionReturnPct - right.contributionReturnPct)[0];
  const negativeStatus = worstLeg ? "review" : "passed";
  const negativeValue = worstLeg
    ? `${worstLeg.symbol} ${formatDiagnosticPercent(worstLeg.contributionReturnPct)}`
    : "none";

  const warnings = [
    ...portfolio.dataQuality.warnings,
    ...portfolio.legs.flatMap((leg) => leg.dataQuality.warnings.map((warning) => `${leg.symbol}: ${warning}`))
  ].filter((warning, index, items) => items.indexOf(warning) === index);
  const incompleteLegs = portfolio.legs.filter((leg) => !leg.dataQuality.isComplete).map((leg) => leg.symbol);
  const dataQualityStatus: PortfolioBacktestDiagnosticStatus = !portfolio.dataQuality.isComplete
    ? "blocked"
    : warnings.length
      ? "review"
      : "passed";
  const dataQualityValue =
    dataQualityStatus === "blocked" ? "incomplete" : warnings.length ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : "complete";
  const dataQualityDetail =
    dataQualityStatus === "blocked"
      ? `Portfolio data quality is incomplete${incompleteLegs.length ? ` for ${incompleteLegs.join(", ")}` : ""}: ${
          warnings.slice(0, 3).join("; ") || "review source completeness before promotion"
        }.`
      : warnings.length
        ? `Portfolio data quality has warnings: ${warnings.slice(0, 3).join("; ")}.`
        : "Portfolio composite data quality is complete.";

  return [
    {
      id: "concentration",
      label: "Concentration",
      value: `${largestLeg.symbol} ${formatDiagnosticWeight(largestLeg.targetWeight)}`,
      detail: concentrationDetail,
      status: concentrationStatus,
      tone: diagnosticTone(concentrationStatus)
    },
    {
      id: "cash-buffer",
      label: "Cash buffer",
      value: formatDiagnosticWeight(portfolio.cashWeight),
      detail: cashDetail,
      status: cashStatus,
      tone: diagnosticTone(cashStatus)
    },
    {
      id: "exposure-utilization",
      label: "Gross exposure",
      value: formatDiagnosticWeight(grossExposure),
      detail: exposureDetail,
      status: exposureStatus,
      tone: diagnosticTone(exposureStatus)
    },
    {
      id: "rebalance-drift",
      label: "Rebalance drift",
      value: driftReview.value,
      detail: driftReview.detail,
      status: driftReview.status,
      tone: diagnosticTone(driftReview.status)
    },
    {
      id: "risk-contribution",
      label: "Risk contribution",
      value: riskContributionReview.value,
      detail: riskContributionReview.detail,
      status: riskContributionReview.status,
      tone: diagnosticTone(riskContributionReview.status)
    },
    ...(covarianceRiskReview
      ? [
          {
            id: "covariance-risk" as const,
            label: "Covariance risk",
            value: covarianceRiskReview.value,
            detail: covarianceRiskReview.detail,
            status: covarianceRiskReview.status,
            tone: diagnosticTone(covarianceRiskReview.status)
          }
        ]
      : []),
    {
      id: "correlation-risk",
      label: "Correlation risk",
      value: correlationReview.value,
      detail: correlationReview.detail,
      status: correlationReview.status,
      tone: diagnosticTone(correlationReview.status)
    },
    {
      id: "negative-contribution",
      label: "Negative contribution",
      value: negativeValue,
      detail: worstLeg
        ? `${worstLeg.symbol} has negative contribution in the audited portfolio backtest.`
        : "No negative contribution leg in the audited portfolio backtest.",
      status: negativeStatus,
      tone: diagnosticTone(negativeStatus)
    },
    {
      id: "data-quality",
      label: "Data quality",
      value: dataQualityValue,
      detail: dataQualityDetail,
      status: dataQualityStatus,
      tone: diagnosticTone(dataQualityStatus)
    }
  ];
}

export function buildPortfolioPaperOrderLifecycleRows(
  batches: PortfolioPaperOrderBatchSnapshot[] | null | undefined,
  lifecycleRows: PortfolioPaperOrderLifecycleSnapshot[] = []
): PortfolioPaperOrderLifecycleRow[] {
  const lifecycleByBatch = portfolioPaperOrderLifecycleRowsByBatch(lifecycleRows);
  return [...(batches ?? [])]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((batch) => {
      const pending = batch.summary.statusCounts.pending_review ?? 0;
      const rejected = batch.summary.statusCounts.rejected ?? 0;
      const skipped = batch.summary.statusCounts.skipped ?? 0;
      const blockedRisk = batch.summary.riskStatusCounts.blocked ?? 0;
      const reviewRisk = batch.summary.riskStatusCounts.review ?? 0;
      const lifecycleStateCounts =
        portfolioPaperOrderLifecycleStateCountsFromRows(lifecycleByBatch.get(batch.batchId)) ??
        batch.summary.lifecycleStateCounts ??
        portfolioPaperOrderLifecycleStateCounts(batch);
      const routableOrders = batch.summary.routableOrders ?? lifecycleStateCounts.ready_for_simulation ?? 0;
      const status: PortfolioPaperOrderLifecycleRow["status"] =
        (lifecycleStateCounts.awaiting_operator_review ?? 0) > 0 || (lifecycleStateCounts.risk_review ?? 0) > 0 || reviewRisk > 0
          ? "review"
          : rejected > 0 || blockedRisk > 0 || (lifecycleStateCounts.risk_rejected ?? 0) > 0 || (lifecycleStateCounts.operator_rejected ?? 0) > 0
            ? "blocked"
            : "ready";

      return {
        id: batch.batchId,
        portfolioName: batch.portfolioName,
        batchId: batch.batchId,
        baseRunId: batch.baseRunId,
        createdAt: batch.createdAt,
        orderCount: batch.summary.totalOrders,
        notionalValue: batch.summary.totalNotionalValue,
        status,
        statusLabel: [
          pending > 0 ? `${pending} review` : null,
          rejected > 0 ? `${rejected} rejected` : null,
          skipped > 0 ? `${skipped} skipped` : null
        ]
          .filter((item): item is string => Boolean(item))
          .join(" / "),
        executionStateLabel: portfolioPaperOrderExecutionStateLabel(lifecycleStateCounts),
        routableOrders,
        auditEventId: `portfolio-paper-order-batch-${batch.batchId}`,
        detail: `${batch.summary.totalOrders} paper-only candidates · ${batch.summary.totalNotionalValue} notional · source ${batch.source}`,
        tone: status === "ready" ? "positive" : status === "blocked" ? "risk" : "warning"
      };
    });
}

export function buildPortfolioPaperOrderApprovalRows(
  batches: PortfolioPaperOrderBatchSnapshot[] | null | undefined,
  lifecycleRows: PortfolioPaperOrderLifecycleSnapshot[] = []
): PortfolioPaperOrderApprovalRow[] {
  const lifecycleByOrder = portfolioPaperOrderLifecycleRowsByOrder(lifecycleRows);
  return [...(batches ?? [])]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .flatMap((batch) =>
      batch.orders.map((order) => {
        const lifecycle = lifecycleByOrder.get(`${batch.batchId}:${order.orderId}`) ?? inferPortfolioPaperOrderLifecycle(batch, order);
        return {
          id: `${batch.batchId}:${order.orderId}`,
          portfolioName: batch.portfolioName,
          batchId: batch.batchId,
          baseRunId: batch.baseRunId,
          orderId: order.orderId,
          symbol: order.symbol,
          side: order.side,
          quantity: lifecycle.quantity,
          notionalValue: lifecycle.notionalValue,
          riskStatus: lifecycle.riskStatus,
          state: lifecycle.state,
          canApprove: lifecycle.state === "awaiting_operator_review",
          canReject: lifecycle.state === "awaiting_operator_review" || lifecycle.state === "risk_review",
          approvedBy: lifecycle.approvedBy,
          reviewedAt: lifecycle.reviewedAt,
          actionHint: portfolioPaperOrderApprovalActionHint(lifecycle),
          tone: portfolioPaperOrderApprovalTone(lifecycle.state)
        };
      })
    );
}

function portfolioPaperOrderLifecycleStateCounts(batch: PortfolioPaperOrderBatchSnapshot): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const order of batch.orders) {
    const state =
      order.status === "skipped" || order.side === "hold"
        ? "skipped"
        : order.status === "rejected" || order.riskStatus === "blocked"
          ? "risk_rejected"
          : "awaiting_operator_review";
    counts[state] = (counts[state] ?? 0) + 1;
  }
  return counts;
}

function portfolioPaperOrderLifecycleRowsByBatch(
  rows: PortfolioPaperOrderLifecycleSnapshot[]
): Map<string, PortfolioPaperOrderLifecycleSnapshot[]> {
  const byBatch = new Map<string, PortfolioPaperOrderLifecycleSnapshot[]>();
  for (const row of rows) {
    byBatch.set(row.batchId, [...(byBatch.get(row.batchId) ?? []), row]);
  }
  return byBatch;
}

function portfolioPaperOrderLifecycleRowsByOrder(
  rows: PortfolioPaperOrderLifecycleSnapshot[]
): Map<string, PortfolioPaperOrderLifecycleSnapshot> {
  return new Map(rows.map((row) => [`${row.batchId}:${row.orderId}`, row]));
}

function portfolioPaperOrderLifecycleStateCountsFromRows(
  rows: PortfolioPaperOrderLifecycleSnapshot[] | undefined
): Record<string, number> | null {
  if (!rows?.length) {
    return null;
  }
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.state] = (counts[row.state] ?? 0) + 1;
  }
  return counts;
}

function inferPortfolioPaperOrderLifecycle(
  batch: PortfolioPaperOrderBatchSnapshot,
  order: PortfolioPaperOrderBatchSnapshot["orders"][number]
): PortfolioPaperOrderLifecycleSnapshot {
  const state =
    order.status === "skipped" || order.side === "hold"
      ? "skipped"
      : order.status === "rejected" || order.riskStatus === "blocked"
        ? "risk_rejected"
        : "awaiting_operator_review";
  return {
    batchId: batch.batchId,
    baseRunId: batch.baseRunId,
    portfolioName: batch.portfolioName,
    orderId: order.orderId,
    symbol: order.symbol,
    sourceRunId: order.sourceRunId,
    side: order.side,
    quantity: order.quantity,
    notionalValue: order.notionalValue,
    originalStatus: order.status,
    riskStatus: order.riskStatus,
    state,
    routable: false,
    paperOnly: true,
    liveExecutionBlocked: true,
    approvedBy: null,
    reviewedAt: null,
    reason: order.reason
  };
}

function portfolioPaperOrderApprovalActionHint(row: PortfolioPaperOrderLifecycleSnapshot): string {
  if (row.state === "ready_for_simulation") {
    return `Approved by ${row.approvedBy ?? "operator"}; ready for paper simulation.`;
  }
  if (row.state === "operator_rejected") {
    return `Operator rejected this paper-only order: ${row.reason}`;
  }
  if (row.state === "risk_rejected") {
    return `Risk rejected this paper-only order: ${row.reason}`;
  }
  if (row.state === "skipped") {
    return "No paper order action is required for this row.";
  }
  if (row.state === "invalid_order") {
    return `Invalid paper order: ${row.reason}`;
  }
  if (row.state === "risk_review") {
    return "Risk review is still required before this approved order can be simulated.";
  }
  return "Operator approval or rejection is required before this paper-only order can move on.";
}

function portfolioPaperOrderApprovalTone(state: PortfolioPaperOrderLifecycleSnapshot["state"]): PortfolioPaperOrderApprovalRow["tone"] {
  if (state === "ready_for_simulation") {
    return "positive";
  }
  if (state === "risk_rejected" || state === "operator_rejected" || state === "invalid_order") {
    return "risk";
  }
  if (state === "awaiting_operator_review" || state === "risk_review") {
    return "warning";
  }
  return "neutral";
}

function portfolioPaperOrderExecutionStateLabel(counts: Record<string, number>): string {
  return [
    ["ready_for_simulation", "ready for simulation"],
    ["awaiting_operator_review", "awaiting review"],
    ["risk_review", "risk review"],
    ["risk_rejected", "risk rejected"],
    ["operator_rejected", "operator rejected"],
    ["invalid_order", "invalid"],
    ["skipped", "skipped"]
  ]
    .map(([state, label]) => {
      const count = counts[state] ?? 0;
      return count > 0 ? `${count} ${label}` : null;
    })
    .filter((item): item is string => Boolean(item))
    .join(" / ");
}

export function buildPortfolioBacktestReportMarkdown<T extends PortfolioBacktestReportInput>(
  portfolio: T | null | undefined,
  draft?: PortfolioBacktestDraft | null,
  options: PortfolioBacktestReportOptions = {}
): string | null {
  if (!portfolio) {
    return null;
  }

  const runIdBySymbol = new Map((draft?.rows ?? []).map((row) => [row.symbol, row.runId]));
  const diagnostics = buildPortfolioBacktestDiagnosticRows(portfolio);
  const metricRows = [
    ["Total return", formatReportPercent(portfolio.metrics.totalReturnPct)],
    ["Annual return", formatReportPercent(portfolio.metrics.annualReturnPct)],
    ["Max drawdown", formatReportPercent(portfolio.metrics.maxDrawdownPct)],
    ["Win rate", formatReportPercent(portfolio.metrics.winRatePct)],
    ["Profit factor", formatReportNumber(portfolio.metrics.profitFactor)],
    ["Trade count", portfolio.metrics.tradeCount],
    ["Cash weight", formatReportPercent(portfolio.cashWeight * 100)],
    ["Equity points", portfolio.equityCurve.length]
  ];
  const diagnosticRows = diagnostics.map((row) => [row.label, row.value, row.status, row.detail]);
  const legRows = portfolio.legs.map((leg) => [
    leg.symbol,
    runIdBySymbol.get(leg.symbol) ?? "unknown",
    formatDiagnosticWeight(leg.targetWeight),
    formatReportNumber(leg.contributionValue),
    formatReportPercent(leg.contributionReturnPct),
    formatReportPercent(leg.maxDrawdownPct),
    leg.tradeCount,
    leg.dataQuality.isComplete ? "complete" : "incomplete",
    leg.dataQuality.warnings.join("; ")
  ]);
  const allocationRows = (portfolio.allocationEvents ?? []).map((event) => [
    event.timestamp,
    event.eventType,
    event.symbol,
    event.sourceRunId ?? "-",
    formatDiagnosticWeight(event.targetWeight),
    formatReportNumber(event.notionalValue),
    event.reason
  ]);
  const rebalanceRows = (portfolio.rebalanceEvents ?? []).map((event) => [
    event.timestamp,
    event.symbol,
    event.sourceRunId ?? "-",
    formatDiagnosticWeight(event.targetWeight),
    formatDiagnosticWeight(event.endingWeight),
    formatReportNumber(event.deltaValue),
    event.status,
    event.reason
  ]);
  const tradeReviewRows = (portfolio.tradeReviewEvents ?? []).map((event) => [
    event.timestamp,
    event.symbol,
    event.sourceRunId ?? "-",
    event.side,
    formatReportNumber(event.notionalValue),
    formatDiagnosticWeight(event.targetWeight),
    formatDiagnosticWeight(event.endingWeight),
    event.status,
    event.reason
  ]);
  const preTradeRiskRows = (portfolio.preTradeRiskChecks ?? []).map((check) => [
    check.timestamp,
    check.scope,
    check.symbol ?? "-",
    check.sourceRunId ?? "-",
    check.checkId,
    check.status,
    formatReportNumber(check.value),
    formatReportNumber(check.limit),
    check.reason
  ]);
  const paperOrderRows = (portfolio.paperOrderEvents ?? []).map((event) => [
    event.timestamp,
    event.orderId,
    event.symbol,
    event.sourceRunId ?? "-",
    event.side,
    formatReportNumber(event.notionalValue),
    formatReportNumber(event.quantity),
    event.status,
    event.riskStatus,
    event.reason
  ]);
  const covarianceSummaryRows = portfolio.covarianceRisk
    ? [
        ["Method", portfolio.covarianceRisk.method],
        ["Observations", portfolio.covarianceRisk.observations],
        ["Portfolio period volatility", formatReportPercent(portfolio.covarianceRisk.periodVolatilityPct)],
        ["Portfolio annualized volatility", formatReportPercent(portfolio.covarianceRisk.annualizedVolatilityPct)]
      ]
    : [];
  const covarianceContributionRows = (portfolio.covarianceRisk?.contributions ?? []).map((contribution) => [
    contribution.symbol,
    contribution.sourceRunId ?? "-",
    formatDiagnosticWeight(contribution.targetWeight),
    formatReportPercent(contribution.annualizedVolatilityPct),
    formatReportPercent(contribution.marginalContributionPct),
    formatReportPercent(contribution.contributionPct)
  ]);

  return [
    "# AIQuant Portfolio Backtest Report",
    "",
    `Portfolio: \`${portfolio.name}\``,
    `Market: \`${portfolio.market}\``,
    `Timeframe: \`${portfolio.timeframe}\``,
    `Initial cash: \`${formatReportNumber(portfolio.initialCash)}\``,
    `Generated at: \`${options.generatedAt ?? new Date().toISOString()}\``,
    "",
    "## Summary",
    "",
    "Static-weight portfolio report built from already audited single-symbol backtest evidence.",
    "",
    "## Metrics",
    "",
    markdownTable(["Metric", "Value"], metricRows),
    "",
    "## Diagnostics",
    "",
    markdownTable(["Diagnostic", "Value", "Status", "Detail"], diagnosticRows),
    "",
    "## Legs",
    "",
    markdownTable(
      ["Symbol", "Run ID", "Weight", "Contribution value", "Contribution return", "Max drawdown", "Trades", "Data quality", "Warnings"],
      legRows
    ),
    "",
    "## Covariance Risk",
    "",
    covarianceSummaryRows.length
      ? [
          markdownTable(["Field", "Value"], covarianceSummaryRows),
          "",
          markdownTable(
            ["Symbol", "Run ID", "Target weight", "Annualized volatility", "Marginal contribution", "Contribution share"],
            covarianceContributionRows
          )
        ].join("\n")
      : "No covariance risk summary is attached to this portfolio run.",
    "",
    "## Allocation Ledger",
    "",
    allocationRows.length
      ? markdownTable(["Timestamp", "Event", "Symbol", "Run ID", "Weight", "Notional", "Reason"], allocationRows)
      : "No static allocation ledger is attached to this portfolio run.",
    "",
    "## Rebalance Review Ledger",
    "",
    rebalanceRows.length
      ? markdownTable(["Timestamp", "Symbol", "Run ID", "Target weight", "Ending weight", "Delta value", "Status", "Reason"], rebalanceRows)
      : "No rebalance review ledger is attached to this portfolio run.",
    "",
    "## Trade Review Ledger",
    "",
    tradeReviewRows.length
      ? markdownTable(
          ["Timestamp", "Symbol", "Run ID", "Side", "Notional", "Target weight", "Ending weight", "Status", "Reason"],
          tradeReviewRows
        )
      : "No trade review ledger is attached to this portfolio run.",
    "",
    "## Pre-Trade Risk Checks",
    "",
    preTradeRiskRows.length
      ? markdownTable(
          ["Timestamp", "Scope", "Symbol", "Run ID", "Check", "Status", "Value", "Limit", "Reason"],
          preTradeRiskRows
        )
      : "No pre-trade risk checks are attached to this portfolio run.",
    "",
    "## Portfolio Paper Orders",
    "",
    paperOrderRows.length
      ? markdownTable(
          ["Timestamp", "Order ID", "Symbol", "Run ID", "Side", "Notional", "Quantity", "Status", "Risk", "Reason"],
          paperOrderRows
        )
      : "No portfolio paper order events are attached to this portfolio run.",
    "",
    "## Composite Data Quality",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Source", portfolio.dataQuality.source],
        ["Complete", portfolio.dataQuality.isComplete],
        ["Rows", portfolio.dataQuality.rows],
        ["Warnings", portfolio.dataQuality.warnings.join("; ")]
      ]
    ),
    "",
    "## Evidence Boundary",
    "",
    "This report uses historical audited portfolio evidence only. It does not rebalance, optimize allocations, route orders, or certify live trading readiness.",
    "",
    "No investment advice. No guaranteed outcome."
  ].join("\n");
}

function blockedPortfolioBacktestDraft(headline: string, summary: string): PortfolioBacktestDraft {
  return {
    status: "blocked",
    headline,
    summary,
    cashWeight: 1,
    request: null,
    rows: []
  };
}

function roundWeight(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function formatWeightLabel(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDiagnosticWeight(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDiagnosticPointDrift(value: number): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}pp`;
}

function formatDiagnosticPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatReportPercent(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "N/A";
}

function formatReportNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

function diagnosticTone(status: PortfolioBacktestDiagnosticStatus): PortfolioBacktestDiagnosticRow["tone"] {
  if (status === "passed") {
    return "positive";
  }
  return status === "blocked" ? "risk" : "warning";
}

function buildPortfolioRebalanceDriftReview<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} {
  const endingPortfolioValue = portfolioEndingValue(portfolio);
  if (!endingPortfolioValue) {
    return {
      value: "n/a",
      detail: "Ending weights are unavailable; run a portfolio backtest before rebalance drift review.",
      status: "review"
    };
  }

  const drifts = portfolio.legs
    .filter((leg) => Number.isFinite(leg.endingValue) && (leg.endingValue ?? 0) > 0)
    .map((leg) => ({
      symbol: leg.symbol,
      drift: (leg.endingValue ?? 0) / endingPortfolioValue - leg.targetWeight
    }));

  if (!drifts.length) {
    return {
      value: "n/a",
      detail: "Ending leg values are unavailable; run a portfolio backtest before rebalance drift review.",
      status: "review"
    };
  }

  const rankedDrifts = drifts.sort((left, right) => Math.abs(right.drift) - Math.abs(left.drift));
  const largestDrift = rankedDrifts[0];
  const absoluteDrift = Math.abs(largestDrift.drift);
  const status: PortfolioBacktestDiagnosticStatus = absoluteDrift >= 0.1 ? "blocked" : absoluteDrift > 0.02 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Largest end-weight drift exceeds the 10pp hard rebalance threshold."
      : status === "review"
        ? "Largest end-weight drift exceeds the 2pp rebalance review threshold."
        : "Largest end-weight drift remains inside the 2pp rebalance review threshold.";

  return {
    value: `${largestDrift.symbol} ${formatDiagnosticPointDrift(largestDrift.drift)}`,
    detail,
    status
  };
}

function portfolioEndingValue<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): number | null {
  const lastEquity = portfolio.equityCurve?.at(-1)?.equity;
  if (Number.isFinite(lastEquity) && (lastEquity ?? 0) > 0) {
    return lastEquity ?? null;
  }

  const legEndingValue = portfolio.legs.reduce((sum, leg) => sum + (Number.isFinite(leg.endingValue) ? (leg.endingValue ?? 0) : 0), 0);
  if (legEndingValue <= 0) {
    return null;
  }

  const cashValue = Number.isFinite(portfolio.initialCash) ? (portfolio.initialCash ?? 0) * portfolio.cashWeight : 0;
  return legEndingValue + Math.max(0, cashValue);
}

function buildPortfolioRiskContributionReview<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} {
  const riskBudgets = portfolio.legs
    .map((leg) => ({
      symbol: leg.symbol,
      riskBudget: Math.abs(leg.maxDrawdownPct) * leg.targetWeight
    }))
    .filter((row) => Number.isFinite(row.riskBudget) && row.riskBudget > 0);

  const totalRiskBudget = riskBudgets.reduce((sum, row) => sum + row.riskBudget, 0);
  if (!riskBudgets.length || totalRiskBudget <= 0) {
    return {
      value: "n/a",
      detail: "Leg drawdown evidence is unavailable; risk-budget contribution needs review.",
      status: "review"
    };
  }

  const largest = riskBudgets.sort((left, right) => right.riskBudget - left.riskBudget)[0];
  const contributionShare = largest.riskBudget / totalRiskBudget;
  const status: PortfolioBacktestDiagnosticStatus =
    contributionShare >= 0.75 ? "blocked" : contributionShare > 0.6 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Largest risk-budget contribution exceeds the 75% hard concentration threshold."
      : status === "review"
        ? "Largest risk-budget contribution exceeds the 60% review threshold."
        : "Largest risk-budget contribution remains inside the 60% review threshold.";

  return {
    value: `${largest.symbol} ${formatDiagnosticWeight(contributionShare)}`,
    detail,
    status
  };
}

function buildPortfolioCovarianceRiskReview<T extends PortfolioBacktestDiagnosticInput>(
  portfolio: T
): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} | null {
  const contributions = portfolio.covarianceRisk?.contributions.filter((contribution) =>
    Number.isFinite(contribution.contributionPct)
  );
  if (!portfolio.covarianceRisk || !contributions?.length) {
    return null;
  }

  const largest = [...contributions].sort((left, right) => right.contributionPct - left.contributionPct)[0];
  const status: PortfolioBacktestDiagnosticStatus =
    largest.contributionPct >= 75 ? "blocked" : largest.contributionPct > 60 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Largest covariance risk contribution exceeds the 75% hard concentration threshold."
      : status === "review"
        ? "Largest covariance risk contribution exceeds the 60% review threshold."
        : "Largest covariance risk contribution remains inside the 60% review threshold.";

  return {
    value: `${largest.symbol} ${formatDiagnosticPercent(largest.contributionPct)}`,
    detail: `${detail} Portfolio annualized volatility ${formatReportPercent(
      portfolio.covarianceRisk.annualizedVolatilityPct
    )}; observations ${portfolio.covarianceRisk.observations}.`,
    status
  };
}

function buildPortfolioCorrelationReview<T extends PortfolioBacktestDiagnosticInput>(portfolio: T): {
  value: string;
  detail: string;
  status: PortfolioBacktestDiagnosticStatus;
} {
  const pairs = (portfolio.correlationPairs ?? []).filter(
    (pair) => typeof pair.leftSymbol === "string" && typeof pair.rightSymbol === "string" && Number.isFinite(pair.correlation)
  );
  if (!pairs.length) {
    return {
      value: "n/a",
      detail: "Pairwise correlation evidence is unavailable; rerun the portfolio backtest to refresh correlation risk.",
      status: "review"
    };
  }

  const largest = [...pairs].sort((left, right) => Math.abs(right.correlation) - Math.abs(left.correlation))[0];
  const absoluteCorrelation = Math.abs(largest.correlation);
  const status: PortfolioBacktestDiagnosticStatus =
    absoluteCorrelation >= 0.95 ? "blocked" : absoluteCorrelation > 0.85 ? "review" : "passed";
  const detail =
    status === "blocked"
      ? "Highest pairwise correlation exceeds the 0.95 hard clustering threshold."
      : status === "review"
        ? "Highest pairwise correlation exceeds the 0.85 review threshold."
        : "Highest pairwise correlation remains inside the 0.85 review threshold.";

  return {
    value: `${largest.leftSymbol}/${largest.rightSymbol} ${largest.correlation.toFixed(2)}`,
    detail,
    status
  };
}

function formatMetricPercent(metrics: Record<string, number>, snakeKey: string, camelKey: string): string {
  const value = metrics[snakeKey] ?? metrics[camelKey];
  return Number.isFinite(value) ? `${formatPercentValue(value)}%` : "N/A";
}

export function buildRiskApprovalSummary(workspace: TerminalWorkspace): RiskApprovalSummary {
  const aiDossier = buildAiReviewDossier(workspace);
  const auditBinding = buildResearchRunContextBinding(workspace);
  const strategyDraft = buildStrategyRuleDraft(workspace);
  const approvalRisk = buildRiskApprovalRisk(workspace, strategyDraft);
  const researchRun = auditBinding.canUseRun ? workspace.researchRun : null;
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
    const auditedRunValue = auditBinding.status === "mismatched" ? (auditBinding.runId ?? "Stale audited run") : "No audited run";
    const auditedRunDetail =
      auditBinding.status === "mismatched"
        ? auditBinding.detail
        : "Run Pipeline must produce a reproducible research run before execution.";
    return {
      status: "blocked",
      headline: "Risk approval blocked",
      summary: "Bind an audited run before paper or live execution.",
      gates: [
        {
          id: "audited-run",
          label: "Audited run",
          value: auditedRunValue,
          detail: auditedRunDetail,
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
  const auditBinding = buildResearchRunContextBinding(workspace);
  if (!auditBinding.canUseRun || !workspace.researchRun) {
    const orderReason =
      auditBinding.status === "mismatched" ? auditBinding.detail : "Run Pipeline before staging a paper order.";
    const riskReason =
      auditBinding.status === "mismatched"
        ? "Current research context is not bound to a matching audited run; paper route remains blocked."
        : "No audited research run is bound; paper route remains blocked.";
    return [
      {
        id: "paper-order",
        symbol: workspace.selectedInstrument.symbol,
        side: "BUY",
        quantity: "-",
        price: "-",
        notional: "-",
        status: "blocked",
        reason: orderReason,
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
        reason: riskReason,
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

export function buildPortfolioPaperOrderReplaySummaryTiles(
  replay: PortfolioPaperOrderReplaySnapshot | null | undefined
): PortfolioPaperOrderReplaySummaryTile[] {
  if (!replay) {
    return [
      {
        id: "portfolio-account",
        label: "Portfolio account",
        value: "No portfolio replay",
        detail: "Simulate approved portfolio orders to rebuild paper cash and positions.",
        tone: "warning"
      },
      {
        id: "portfolio-positions",
        label: "Replay positions",
        value: "0 position / 0 fills",
        detail: "No applied paper fills are linked to this portfolio run yet.",
        tone: "neutral"
      },
      {
        id: "portfolio-replay-boundary",
        label: "Execution boundary",
        value: "Paper only",
        detail: "Live execution remains blocked until adapter certification and human confirmation pass.",
        tone: "warning"
      }
    ];
  }

  const warningCount = replay.summary.warnings.length;
  return [
    {
      id: "portfolio-account",
      label: "Portfolio account",
      value: `Cash ${formatAssumptionCurrency(replay.account.cash)} / Equity ${formatAssumptionCurrency(replay.account.equity)}`,
      detail: `Replay ${replay.baseRunId} · ${replay.mode}`,
      tone: warningCount ? "warning" : "positive"
    },
    {
      id: "portfolio-positions",
      label: "Replay positions",
      value: `${replay.summary.positionCount} position${replay.summary.positionCount === 1 ? "" : "s"} / ${
        replay.summary.filledOrders
      } fill${replay.summary.filledOrders === 1 ? "" : "s"}`,
      detail: `Buy ${formatAssumptionCurrency(replay.summary.buyNotional)} / Sell ${formatAssumptionCurrency(
        replay.summary.sellNotional
      )} / Net ${formatAssumptionCurrency(replay.summary.netNotional)}`,
      tone: replay.summary.positionCount ? "positive" : "neutral"
    },
    {
      id: "portfolio-replay-boundary",
      label: "Execution boundary",
      value: replay.liveExecutionBlocked ? "Paper only" : "Live route open",
      detail: warningCount
        ? `${warningCount} replay warning${warningCount === 1 ? "" : "s"}: ${replay.summary.warnings.slice(0, 2).join(" · ")}`
        : "Replay is derived from approved local paper fills; no broker route is used.",
      tone: replay.liveExecutionBlocked ? (warningCount ? "warning" : "neutral") : "risk"
    }
  ];
}

export function buildPortfolioPaperOrderReplayPositionRows(
  replay: PortfolioPaperOrderReplaySnapshot | null | undefined
): PortfolioPaperOrderReplayPositionRow[] {
  return [...(replay?.positions ?? [])]
    .sort((left, right) => right.marketValue - left.marketValue)
    .map((position) => ({
      id: `portfolio-replay-position-${position.symbol}`,
      symbol: position.symbol,
      quantity: formatQuantity(position.quantity),
      avgCost: position.avgCost.toFixed(2),
      lastPrice: position.lastPrice.toFixed(2),
      marketValue: position.marketValue.toFixed(2),
      unrealizedPnl: formatSignedCurrency(position.unrealizedPnl),
      tone: position.unrealizedPnl > 0 ? "positive" : position.unrealizedPnl < 0 ? "warning" : "neutral"
    }));
}

export function buildPortfolioPaperOrderStateHistoryRows(
  histories: PortfolioPaperOrderStateHistorySnapshot[] | null | undefined,
  limit = 12
): PortfolioPaperOrderStateHistoryRow[] {
  return (histories ?? [])
    .flatMap((history) =>
      history.orders.flatMap((order) =>
        order.events.map((event) => ({
          id: event.eventId,
          batchId: order.batchId,
          baseRunId: order.baseRunId,
          orderId: order.orderId,
          symbol: order.symbol,
          timestamp: event.timestamp,
          state: event.state,
          label: event.label,
          actor: event.actor,
          source: event.source,
          reason: event.reason,
          quantity: formatQuantity(order.quantity),
          notionalValue: order.notionalValue.toFixed(2),
          tone: portfolioPaperOrderStateTone(event.state)
        }))
      )
    )
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
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
  if (!buildResearchRunContextBinding(workspace).canUseRun) {
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

export function buildExecutionAdapterLedgerRows(
  ledger: ExecutionAdapterLedgerSnapshot | null | undefined,
  limit = 8
): ExecutionAdapterLedgerRow[] {
  return (ledger?.adapters ?? [])
    .flatMap((adapter) => {
      const passedGates = adapter.gates.filter((gate) => gate.passed).length;
      const gateSummary = `${passedGates}/${adapter.gates.length} gates`;
      return adapter.events.map((event) => ({
        id: event.eventId,
        adapterId: adapter.id,
        adapter: adapter.adapter,
        market: adapter.market,
        route: adapter.route,
        timestamp: event.timestamp,
        state: event.state,
        label: event.label,
        actor: event.actor,
        source: event.source,
        reason: event.reason,
        nextStep: adapter.nextStep,
        gateSummary,
        liveTradingAllowed: event.liveTradingAllowed,
        tone: executionAdapterLedgerTone(event.state)
      }));
    })
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterCertificationRows(
  certifications: ExecutionAdapterCertificationSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterCertificationRow[] {
  return (certifications ?? [])
    .map((certification) => ({
      id: certification.certificationId,
      adapterId: certification.adapterId,
      market: certification.market,
      route: certification.route,
      timestamp: certification.completedAt ?? certification.startedAt,
      status: certification.status,
      statusLabel: executionAdapterCertificationStatusLabel(certification.status),
      checkSummary: executionAdapterCertificationCheckSummary(certification.summary),
      auditEventId: certification.certificationId,
      boundary: certification.liveTradingAllowed
        ? "Live trading allowed"
        : certification.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      liveTradingAllowed: certification.liveTradingAllowed,
      tone: executionAdapterCertificationTone(certification.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterCertificationApplyRows(
  applies: ExecutionAdapterCertificationApplySnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterCertificationApplyRow[] {
  return (applies ?? [])
    .map((apply) => ({
      id: apply.applyId,
      certificationId: apply.certificationId,
      adapterId: apply.adapterId,
      market: apply.market,
      route: apply.route,
      timestamp: apply.generatedAt,
      status: apply.status,
      statusLabel: executionAdapterCertificationApplyStatusLabel(apply.status),
      applyMode: apply.applyMode,
      confirmationSummary: executionAdapterCertificationApplyConfirmationSummary(apply.requiredConfirmations),
      blockerSummary: executionAdapterCertificationApplyBlockerSummary(apply.blockedReasons),
      boundary: apply.liveTradingAllowed
        ? "Live trading allowed"
        : apply.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      restartRequired: apply.restartRequired,
      auditEventId: apply.applyId,
      tone: executionAdapterCertificationApplyTone(apply.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterControlledRestartEvidenceRows(
  evidence: ExecutionAdapterControlledRestartEvidenceSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterControlledRestartEvidenceRow[] {
  return (evidence ?? [])
    .map((row) => ({
      id: row.evidenceId,
      applyId: row.applyId,
      certificationId: row.certificationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterControlledRestartEvidenceStatusLabel(row.status),
      evidenceMode: row.evidenceMode,
      confirmationSummary: executionAdapterControlledRestartEvidenceConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterControlledRestartEvidenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      restartRequired: row.restartRequired,
      auditEventId: row.evidenceId,
      tone: executionAdapterControlledRestartEvidenceTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterRestartAcceptanceRows(
  acceptances: ExecutionAdapterRestartAcceptanceSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterRestartAcceptanceRow[] {
  return (acceptances ?? [])
    .map((row) => ({
      id: row.acceptanceId,
      evidenceId: row.evidenceId,
      applyId: row.applyId,
      certificationId: row.certificationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterRestartAcceptanceStatusLabel(row.status),
      acceptanceMode: row.acceptanceMode,
      confirmationSummary: executionAdapterRestartAcceptanceConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterRestartAcceptanceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      restartRequired: row.restartRequired,
      auditEventId: row.acceptanceId,
      tone: executionAdapterRestartAcceptanceTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSecretReferenceRows(
  references: ExecutionAdapterSecretReferenceSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSecretReferenceRow[] {
  return (references ?? [])
    .map((row) => ({
      id: row.referenceId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSecretReferenceStatusLabel(row.status),
      referenceName: row.referenceName,
      backend: row.backend,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterSecretReferenceConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.referenceId,
      tone: executionAdapterSecretReferenceTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterSecretMaterializationRows(
  materializations: ExecutionAdapterSecretMaterializationSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterSecretMaterializationRow[] {
  return (materializations ?? [])
    .map((row) => ({
      id: row.materializationId,
      referenceId: row.referenceId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterSecretMaterializationStatusLabel(row.status),
      referenceName: row.referenceName,
      backend: row.backend,
      manifestPath: row.manifestPath,
      materializationMode: row.materializationMode,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      confirmationSummary: executionAdapterSecretMaterializationConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveTradingAllowed
        ? "Live trading allowed"
        : row.paperOnly
          ? "Paper only · live trading blocked"
          : "Live trading blocked",
      auditEventId: row.materializationId,
      tone: executionAdapterSecretMaterializationTone(row.status)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function createDefaultExecutionAdapterCertificationApplyConfirmations(): ExecutionAdapterCertificationApplyConfirmations {
  return {
    secretReferenceStored: false,
    controlledRestartWindowApproved: false,
    operatorReviewedCertification: false
  };
}

export function buildExecutionAdapterCertificationApplyConfirmationRows(
  confirmations: Partial<ExecutionAdapterCertificationApplyConfirmations> | null | undefined = {}
): ExecutionAdapterCertificationApplyConfirmationRow[] {
  const values = {
    ...createDefaultExecutionAdapterCertificationApplyConfirmations(),
    ...(confirmations ?? {})
  };
  return [
    {
      id: "secret-reference-stored",
      key: "secretReferenceStored",
      label: "Secret-store reference saved",
      detail: "Confirm the real credential reference is stored outside this UI.",
      checked: values.secretReferenceStored,
      tone: values.secretReferenceStored ? "positive" : "neutral"
    },
    {
      id: "controlled-restart-window-approved",
      key: "controlledRestartWindowApproved",
      label: "Controlled restart window approved",
      detail: "Confirm an operator-approved restart window exists before applying.",
      checked: values.controlledRestartWindowApproved,
      tone: values.controlledRestartWindowApproved ? "positive" : "neutral"
    },
    {
      id: "operator-reviewed-certification",
      key: "operatorReviewedCertification",
      label: "Operator reviewed certification",
      detail: "Confirm the certification evidence and restart impact were reviewed.",
      checked: values.operatorReviewedCertification,
      tone: values.operatorReviewedCertification ? "positive" : "neutral"
    }
  ];
}

function latestPromotionCertificationRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterCertificationRow[]
): ExecutionAdapterCertificationRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local"
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

function latestPromotionCertificationApplyRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterCertificationApplyRow[],
  latestCertification: ExecutionAdapterCertificationRow | null
): ExecutionAdapterCertificationApplyRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestCertification ||
            (row.adapterId === latestCertification.adapterId && row.certificationId === latestCertification.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

function latestPromotionControlledRestartEvidenceRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterControlledRestartEvidenceRow[],
  latestCertification: ExecutionAdapterCertificationRow | null,
  latestApply: ExecutionAdapterCertificationApplyRow | null
): ExecutionAdapterControlledRestartEvidenceRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestCertification ||
            (row.adapterId === latestCertification.adapterId && row.certificationId === latestCertification.id)) &&
          (!latestApply || row.applyId === latestApply.id)
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

function latestPromotionRestartAcceptanceRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterRestartAcceptanceRow[],
  latestCertification: ExecutionAdapterCertificationRow | null,
  latestApply: ExecutionAdapterCertificationApplyRow | null,
  latestRestartEvidence: ExecutionAdapterControlledRestartEvidenceRow | null
): ExecutionAdapterRestartAcceptanceRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestCertification ||
            (row.adapterId === latestCertification.adapterId && row.certificationId === latestCertification.id)) &&
          (!latestApply || row.applyId === latestApply.id) &&
          (!latestRestartEvidence || row.evidenceId === latestRestartEvidence.id)
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

function latestPromotionSecretReferenceRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterSecretReferenceRow[]
): ExecutionAdapterSecretReferenceRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local"
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

function latestPromotionSecretMaterializationRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterSecretMaterializationRow[],
  latestSecretReference: ExecutionAdapterSecretReferenceRow | null
): ExecutionAdapterSecretMaterializationRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSecretReference ||
            (row.adapterId === latestSecretReference.adapterId && row.referenceId === latestSecretReference.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

function buildPromotionAdapterCertificationStage(
  certifiedLiveAdapters: number,
  latestCertification: ExecutionAdapterCertificationRow | null,
  latestApply: ExecutionAdapterCertificationApplyRow | null,
  latestRestartEvidence: ExecutionAdapterControlledRestartEvidenceRow | null,
  latestRestartAcceptance: ExecutionAdapterRestartAcceptanceRow | null,
  latestSecretReference: ExecutionAdapterSecretReferenceRow | null,
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null,
  liveAdapterCertified: boolean,
  adapterGatePassed: boolean
): PromotionQueueStage {
  const secretReferenceDetail = latestSecretReference
    ? `Latest secret reference ${latestSecretReference.auditEventId}: ${latestSecretReference.statusLabel} · ${latestSecretReference.confirmationSummary} · ${latestSecretReference.blockerSummary} · ${latestSecretReference.backend} · ${latestSecretReference.envVarSummary} · ${latestSecretReference.boundary}.`
    : "";
  const secretMaterializationDetail = latestSecretMaterialization
    ? `Latest secret materialization ${latestSecretMaterialization.auditEventId}: ${latestSecretMaterialization.statusLabel} · ${latestSecretMaterialization.confirmationSummary} · ${latestSecretMaterialization.blockerSummary} · ${latestSecretMaterialization.backend} · ${latestSecretMaterialization.envVarSummary} · ${latestSecretMaterialization.boundary}. ${promotionSecretMaterializationNextStep(latestSecretMaterialization)}`
    : "";
  if (!latestCertification) {
    const liveAdapterDetail = liveAdapterCertified
      ? "A certified live adapter is available for the selected market."
      : "Live adapters remain interface-only or configuration-required until certification passes.";
    return {
      id: "adapter-certification",
      label: "Adapter certification",
      value:
        certifiedLiveAdapters === 1 ? "1 certified live adapter" : `${certifiedLiveAdapters} certified live adapters`,
      detail: [liveAdapterDetail, secretReferenceDetail, secretMaterializationDetail].filter(Boolean).join(" "),
      status: liveAdapterCertified ? "passed" : "blocked",
      tone: liveAdapterCertified
        ? "positive"
        : latestSecretMaterialization?.status === "manifest_recorded" ||
            latestSecretReference?.status === "reference_recorded"
          ? "warning"
          : "risk"
    };
  }

  const certificationDetail = `Latest certification ${latestCertification.auditEventId}: ${latestCertification.checkSummary} · ${latestCertification.boundary}.`;
  const restartEvidenceDetail = latestRestartEvidence
    ? `Latest restart evidence ${latestRestartEvidence.auditEventId}: ${latestRestartEvidence.statusLabel} · ${latestRestartEvidence.confirmationSummary} · ${latestRestartEvidence.blockerSummary} · ${latestRestartEvidence.boundary}.${latestRestartAcceptance ? "" : ` ${promotionControlledRestartEvidenceNextStep(latestRestartEvidence)}`}`
    : "";
  const restartAcceptanceDetail = latestRestartAcceptance
    ? `Latest restart acceptance ${latestRestartAcceptance.auditEventId}: ${latestRestartAcceptance.statusLabel} · ${latestRestartAcceptance.confirmationSummary} · ${latestRestartAcceptance.blockerSummary} · ${latestRestartAcceptance.boundary}. ${promotionRestartAcceptanceNextStep(latestRestartAcceptance)}`
    : "";
  const applyDetail = latestApply
    ? `Latest apply ${latestApply.auditEventId}: ${latestApply.statusLabel} · ${latestApply.confirmationSummary} · ${latestApply.blockerSummary} · ${latestApply.boundary}.${latestRestartEvidence ? "" : ` ${promotionCertificationApplyNextStep(latestApply)}`}`
    : "";
  const gateDetail =
    !latestApply && !latestRestartEvidence && latestCertification.status === "passed" && latestCertification.liveTradingAllowed && !adapterGatePassed
      ? "Workspace adapter gate is still blocked."
      : "";
  return {
    id: "adapter-certification",
    label: "Adapter certification",
    value: `${latestRestartAcceptance?.statusLabel ?? latestRestartEvidence?.statusLabel ?? latestApply?.statusLabel ?? latestCertification.statusLabel} · ${latestCertification.adapterId}`,
    detail: [
      secretReferenceDetail,
      secretMaterializationDetail,
      certificationDetail,
      applyDetail,
      restartEvidenceDetail,
      restartAcceptanceDetail,
      gateDetail
    ]
      .filter(Boolean)
      .join(" "),
    status: liveAdapterCertified ? "passed" : "blocked",
    tone: liveAdapterCertified
      ? "positive"
      : latestSecretMaterialization?.status === "manifest_recorded" ||
          latestRestartAcceptance?.status === "acceptance_recorded" ||
          latestRestartEvidence?.status === "evidence_recorded" ||
          latestApply?.status === "ready_for_restart"
        ? "warning"
      : latestCertification.status === "passed" && latestCertification.liveTradingAllowed
        ? "warning"
        : latestCertification.tone
  };
}

function promotionCertificationApplyNextStep(apply: ExecutionAdapterCertificationApplyRow): string {
  if (apply.status === "ready_for_restart") {
    return "Controlled restart evidence is still required before live routing.";
  }
  return "Resolve apply preflight blockers before live routing.";
}

function promotionControlledRestartEvidenceNextStep(evidence: ExecutionAdapterControlledRestartEvidenceRow): string {
  if (evidence.status === "evidence_recorded") {
    return "Controlled restart evidence is recorded; live routing remains blocked until controlled orchestration and human confirmation pass.";
  }
  return "Resolve controlled restart evidence blockers before live routing.";
}

function promotionRestartAcceptanceNextStep(acceptance: ExecutionAdapterRestartAcceptanceRow): string {
  if (acceptance.status === "acceptance_recorded") {
    return "Post-restart acceptance is recorded; live routing remains blocked until real adapter orchestration and human confirmation pass.";
  }
  return "Resolve post-restart acceptance blockers before live routing.";
}

function promotionSecretMaterializationNextStep(materialization: ExecutionAdapterSecretMaterializationRow): string {
  if (materialization.status === "manifest_recorded") {
    return "Secret materialization manifest is recorded; live routing remains blocked until env writes, restart orchestration, and human confirmation pass.";
  }
  return "Resolve secret materialization blockers before restart orchestration.";
}

export function buildPromotionReadiness(
  workspace: TerminalWorkspace,
  execution: PaperExecutionSnapshot | null | undefined,
  brokerRows: BrokerAdapterRow[],
  certificationRows: ExecutionAdapterCertificationRow[] = [],
  certificationApplyRows: ExecutionAdapterCertificationApplyRow[] = [],
  controlledRestartEvidenceRows: ExecutionAdapterControlledRestartEvidenceRow[] = [],
  restartAcceptanceRows: ExecutionAdapterRestartAcceptanceRow[] = [],
  secretReferenceRows: ExecutionAdapterSecretReferenceRow[] = [],
  secretMaterializationRows: ExecutionAdapterSecretMaterializationRow[] = []
): PromotionReadiness {
  const approval = buildRiskApprovalSummary(workspace);
  const auditBinding = buildResearchRunContextBinding(workspace);
  const run = auditBinding.canUseRun ? workspace.researchRun : null;
  const activeExecution = run && execution?.runId === run.runId ? execution : null;
  const filledOrders = activeExecution?.orders.filter((order) => order.status === "filled") ?? [];
  const paperRiskGate = activeExecution?.gates.find((gate) => gate.id === "paper-risk-check");
  const paperExecutionPassed = filledOrders.length > 0 && paperRiskGate?.passed === true;
  const adapterGatePassed = workspace.execution.gates.find((gate) => gate.id === "adapter-certified")?.passed === true;
  const humanGatePassed = workspace.execution.gates.find((gate) => gate.id === "human-confirmed")?.passed === true;
  const latestCertification = latestPromotionCertificationRow(workspace, certificationRows);
  const latestCertificationApply = latestPromotionCertificationApplyRow(workspace, certificationApplyRows, latestCertification);
  const latestRestartEvidence = latestPromotionControlledRestartEvidenceRow(
    workspace,
    controlledRestartEvidenceRows,
    latestCertification,
    latestCertificationApply
  );
  const latestRestartAcceptance = latestPromotionRestartAcceptanceRow(
    workspace,
    restartAcceptanceRows,
    latestCertification,
    latestCertificationApply,
    latestRestartEvidence
  );
  const latestSecretReference = latestPromotionSecretReferenceRow(workspace, secretReferenceRows);
  const latestSecretMaterialization = latestPromotionSecretMaterializationRow(
    workspace,
    secretMaterializationRows,
    latestSecretReference
  );
  const evidenceCertified =
    latestCertification?.status === "passed" && latestCertification.liveTradingAllowed && latestCertification.route === "live";
  const certifiedLiveAdapters = brokerRows.filter(
    (row) =>
      row.route === "live" &&
      row.status === "paper_ready" &&
      (!latestCertification || (row.id === latestCertification.adapterId && evidenceCertified))
  ).length;
  const liveAdapterCertified = adapterGatePassed && evidenceCertified && certifiedLiveAdapters > 0;

  const auditedStage: PromotionQueueStage = run
    ? {
        id: "audited-run",
        label: "Audited run",
        value: run.runId,
        detail: `${run.dataRows} ${run.timeframe} bars are bound to the promotion queue.`,
        status: "passed",
        tone: "positive"
      }
    : {
        id: "audited-run",
        label: "Audited run",
        value: auditBinding.status === "mismatched" ? (auditBinding.runId ?? "Stale audited run") : "No audited run",
        detail:
          auditBinding.status === "mismatched"
            ? auditBinding.detail
            : "Run Pipeline before a strategy can enter the promotion queue.",
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

  const adapterStage = buildPromotionAdapterCertificationStage(
    certifiedLiveAdapters,
    latestCertification,
    latestCertificationApply,
    latestRestartEvidence,
    latestRestartAcceptance,
    latestSecretReference,
    latestSecretMaterialization,
    liveAdapterCertified,
    adapterGatePassed
  );

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
  if (!run || approval.status === "blocked") {
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
  const auditBinding = buildResearchRunContextBinding(workspace);
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
    auditBinding.status === "matched"
      ? {
          id: "audit",
          label: "Audit evidence",
          value: auditBinding.runId ?? "bound",
          detail: auditBinding.detail,
          status: "passed",
          tone: "positive"
        }
      : auditBinding.status === "mismatched"
        ? {
            id: "audit",
            label: "Audit evidence",
            value: auditBinding.runId ?? "stale run",
            detail: auditBinding.detail,
            status: "blocked",
            tone: "risk"
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

export function mergeStrategyReadinessGatesWithLocalAudit(
  coreGates: StrategyReadinessGate[] | null | undefined,
  localGates: StrategyReadinessGate[]
): StrategyReadinessGate[] {
  if (!coreGates) {
    return localGates;
  }
  const localAuditGate = localGates.find((gate) => gate.id === "audit");
  if (!localAuditGate) {
    return coreGates;
  }
  const merged = coreGates.map((gate) => (gate.id === "audit" ? localAuditGate : gate));
  if (!merged.some((gate) => gate.id === "audit")) {
    merged.push(localAuditGate);
  }
  return merged;
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
  const entryVolumeWindow = inferVolumeWindow(strategy.entry);
  const hasEntrySmaCondition = hasSmaConditionText(strategy.entry);
  const isPrimaryEntryRsi = Boolean(entryRsiCondition && !hasEntrySmaCondition);
  const entryWindow = isPrimaryEntryRsi
    ? entryRsiCondition?.window ?? defaultStrategyRuleDraft.entryWindow
    : inferSmaWindow(strategy.entry, defaultStrategyRuleDraft.entryWindow);
  const exitWindow = exitRsiCondition?.window ?? inferSmaWindow(strategy.exit, defaultStrategyRuleDraft.exitWindow);

  return {
    name: strategy.name.trim() || defaultStrategyRuleDraft.name,
    entryKind: isPrimaryEntryRsi && entryRsiCondition
      ? rsiOperatorToConditionKind(entryRsiCondition.operator)
      : inferSmaConditionKind(strategy.entry, "close_above_sma"),
    entryWindow,
    entryThreshold: isPrimaryEntryRsi
      ? entryRsiCondition?.threshold ?? defaultStrategyRuleDraft.entryThreshold
      : defaultStrategyRuleDraft.entryThreshold,
    entryRsiConfirm: Boolean(entryRsiCondition && !isPrimaryEntryRsi),
    entryRsiWindow: entryRsiCondition?.window ?? defaultStrategyRuleDraft.entryRsiWindow,
    entryRsiThreshold: entryRsiCondition?.threshold ?? defaultStrategyRuleDraft.entryRsiThreshold,
    entryVolumeConfirm: entryVolumeWindow !== null,
    entryVolumeWindow: entryVolumeWindow ?? defaultStrategyRuleDraft.entryVolumeWindow,
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

export function buildStrategyTemplateOptions(): StrategyTemplateOption[] {
  return strategyTemplateOptions.map((template) => ({
    ...template,
    draft: { ...template.draft }
  }));
}

function strategyContextLabel(market: Market, symbol: string, timeframe: Timeframe): string {
  return `${market.toUpperCase()} · ${symbol} · ${timeframe}`;
}

export function buildResearchRunContextBinding(workspace: TerminalWorkspace): ResearchRunContextBinding {
  const selectedContext = strategyContextLabel(
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  );
  const run = workspace.researchRun;

  if (!run) {
    return {
      status: "missing",
      canUseRun: false,
      runId: null,
      selectedContext,
      runContext: null,
      detail: "Run Pipeline to bind a matching audited research run."
    };
  }

  const runMarket = run.market ?? workspace.selectedInstrument.market;
  const runSymbol = run.symbol ?? workspace.selectedInstrument.symbol;
  const runContext = strategyContextLabel(runMarket, runSymbol, run.timeframe);
  const matches =
    runMarket === workspace.selectedInstrument.market &&
    runSymbol === workspace.selectedInstrument.symbol &&
    run.timeframe === workspace.selectedTimeframe;

  if (matches) {
    return {
      status: "matched",
      canUseRun: true,
      runId: run.runId,
      selectedContext,
      runContext,
      detail: `Audited run ${run.runId} matches the selected research context.`
    };
  }

  return {
    status: "mismatched",
    canUseRun: false,
    runId: run.runId,
    selectedContext,
    runContext,
    detail: `Audited run ${run.runId} belongs to ${runContext}, not ${selectedContext}.`
  };
}

function normalizeDiffValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function strategySnapshotFromRuleDraft(draft: StrategyRuleDraft): StrategySnapshot {
  const normalizedDraft = normalizeStrategyRuleDraft(draft);
  const entrySignal = strategyConditionSnapshotText(
    normalizedDraft.entryKind,
    normalizedDraft.entryWindow,
    normalizedDraft.entryThreshold
  );
  const entrySignals = [entrySignal];
  if (normalizedDraft.entryRsiConfirm && !isRsiConditionKind(normalizedDraft.entryKind)) {
    entrySignals.push(`RSI${normalizedDraft.entryRsiWindow} > ${formatConditionNumber(normalizedDraft.entryRsiThreshold)}`);
  }
  if (normalizedDraft.entryVolumeConfirm) {
    entrySignals.push(`Volume > VOL${normalizedDraft.entryVolumeWindow}`);
  }
  return {
    name: normalizedDraft.name,
    entry: entrySignals.join(" AND "),
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
  const contextBinding = buildResearchRunContextBinding(workspace);

  return [
    run && contextBinding.canUseRun
      ? {
          id: "run",
          label: "Run package",
          value: run.runId,
          detail: `${run.dataRows} ${run.timeframe} bars · ${run.executionMode}`,
          tone: "positive"
        }
      : run
        ? {
            id: "run",
            label: "Run package",
            value: run.runId,
            detail: contextBinding.detail,
            tone: "risk"
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
      tone: run ? (contextBinding.canUseRun ? "positive" : "risk") : "warning"
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
  const contextBinding = buildResearchRunContextBinding(workspace);
  const run = workspace.researchRun;
  const hasAuditedRun = contextBinding.canUseRun;
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
          detail: `Audited ${run?.dataRows ?? 0} ${run?.timeframe ?? workspace.selectedTimeframe} bars are bound.`,
          tone: "positive"
        }
      : run
        ? {
            id: "data",
            label: "Data snapshot",
            status: "blocked",
            detail: contextBinding.detail,
            tone: "risk"
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
  const contextBinding = buildResearchRunContextBinding(workspace);
  const benchmark = buildBacktestBenchmark(workspace);
  const blockedGates = readinessGates.filter((gate) => gate.status === "blocked");
  const aiReviewReady =
    contextBinding.canUseRun && !blockedGates.some((gate) => gate.id === "data" || gate.id === "strategy");
  const executionReady = contextBinding.canUseRun && !blockedGates.length;
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

  if (!contextBinding.canUseRun) {
    return {
      status: "blocked",
      headline: "Backtest report needs a matching audited run",
      summary: "Run Pipeline to create a fresh audited run for the selected market, symbol, and timeframe.",
      runId: run.runId,
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
  if (!buildResearchRunContextBinding(workspace).canUseRun) {
    return [];
  }

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
  const entryRsiThresholds: Array<number | null> =
    draft.entryRsiConfirm && !isRsiConditionKind(draft.entryKind)
      ? parameterScanThresholds(draft.entryRsiThreshold)
      : [null];
  const entryVolumeWindows: Array<number | null> = draft.entryVolumeConfirm
    ? parameterScanWindows(draft.entryVolumeWindow)
    : [null];
  const currentMetricReturn = parsePercentMetric(metricValue(workspace, "Return", "N/A"));
  const currentScan = simulateSmaParameterScan(
    workspace,
    bars,
    draft.entryWindow,
    draft.exitWindow,
    draft.entryRsiThreshold,
    draft.entryVolumeWindow
  );
  const currentReturn = currentMetricReturn ?? currentScan.totalReturnPct;

  return entryWindows.flatMap((entryWindow) =>
    exitWindows.flatMap((exitWindow) =>
      entryRsiThresholds.flatMap((entryRsiThreshold) =>
        entryVolumeWindows.map((entryVolumeWindow) => {
          const result = simulateSmaParameterScan(
            workspace,
            bars,
            entryWindow,
            exitWindow,
            entryRsiThreshold,
            entryVolumeWindow
          );
          const delta = result.totalReturnPct - currentReturn;
          const isCurrent =
            entryWindow === draft.entryWindow &&
            exitWindow === draft.exitWindow &&
            (!draft.entryRsiConfirm || entryRsiThreshold === draft.entryRsiThreshold) &&
            (!draft.entryVolumeConfirm || entryVolumeWindow === draft.entryVolumeWindow);
          const breachesDrawdown = result.maxDrawdownPct > draft.maxDrawdownPct;
          const rsiCondition = entryRsiThreshold === null ? "" : ` / RSI>${formatConditionNumber(entryRsiThreshold)}`;
          const rsiId = entryRsiThreshold === null ? "" : `-rsi-${formatConditionNumber(entryRsiThreshold)}`;
          const volumeCondition = entryVolumeWindow === null ? "" : ` / VOL${entryVolumeWindow}`;
          const volumeId = entryVolumeWindow === null ? "" : `-vol-${entryVolumeWindow}`;
          return {
            id: `scan-entry-${entryWindow}-exit-${exitWindow}${rsiId}${volumeId}`,
            runId: run.runId,
            source: run.dataSnapshot?.hash ?? run.dataSnapshot?.source ?? "audited snapshot",
            condition: `SMA${entryWindow} / SMA${exitWindow}${rsiCondition}${volumeCondition}`,
            entryWindow,
            exitWindow,
            entryRsiThreshold,
            entryVolumeWindow,
            returnPct: formatSignedPct(result.totalReturnPct),
            maxDrawdownPct: formatPct(result.maxDrawdownPct),
            tradeCount: result.tradeCount,
            alphaVsCurrent: formatSignedPointDelta(delta),
            status: isCurrent ? "current" : "candidate",
            tone: isCurrent ? "neutral" : breachesDrawdown ? "risk" : delta >= 0 ? "positive" : "warning",
            dataRows: bars.length
          };
        })
      )
    )
  );
}

export function buildBacktestParameterScanSummary(workspace: TerminalWorkspace): BacktestParameterScanSummary | null {
  const rows = buildBacktestParameterScanRows(workspace);
  if (!rows.length) {
    return null;
  }

  const rankedRows = rows
    .map((row, index) => ({
      row,
      index,
      returnPct: parsePercentMetric(row.returnPct) ?? Number.NEGATIVE_INFINITY,
      maxDrawdownPct: parsePercentMetric(row.maxDrawdownPct) ?? Number.POSITIVE_INFINITY
    }))
    .sort(
      (left, right) =>
        right.returnPct - left.returnPct ||
        left.maxDrawdownPct - right.maxDrawdownPct ||
        left.index - right.index
    );
  const currentRankIndex = rankedRows.findIndex((entry) => entry.row.status === "current");
  const currentRow = rows.find((row) => row.status === "current") ?? null;
  const candidateRows = rows.filter((row) => row.status === "candidate");
  const positiveCount = rows.filter((row) => row.tone === "positive").length;
  const riskCount = rows.filter((row) => row.tone === "risk").length;
  const bestCandidate =
    rankedRows.find((entry) => entry.row.status === "candidate" && entry.row.tone !== "risk") ??
    rankedRows.find((entry) => entry.row.status === "candidate") ??
    null;
  const currentRank = currentRankIndex >= 0 ? currentRankIndex + 1 : null;
  const bestRow = bestCandidate?.row ?? null;
  const tone: BacktestParameterScanSummary["tone"] =
    bestRow?.tone === "positive"
      ? "positive"
      : riskCount === candidateRows.length && candidateRows.length > 0
        ? "risk"
        : currentRank === 1
          ? "neutral"
          : "warning";

  return {
    totalRows: rows.length,
    candidateCount: candidateRows.length,
    positiveCount,
    riskCount,
    currentCondition: currentRow?.condition ?? null,
    currentRank,
    bestCandidateId: bestRow?.id ?? null,
    bestCandidateCondition: bestRow?.condition ?? null,
    bestCandidateReturnPct: bestRow?.returnPct ?? "N/A",
    bestCandidateMaxDrawdownPct: bestRow?.maxDrawdownPct ?? "N/A",
    bestCandidateDelta: bestRow?.alphaVsCurrent ?? "N/A",
    headline: bestRow ? `${bestRow.condition} candidate for re-audit` : "No candidate cleared for re-audit",
    detail: [
      currentRank === null
        ? "Current parameter row is missing from the locked scan."
        : `Current ${currentRow?.condition ?? "parameter"} ranks ${currentRank}/${rows.length} on the locked snapshot.`,
      `${candidateRows.length} candidates, ${positiveCount} positive rows, ${riskCount} drawdown-risk rows.`,
      bestRow
        ? `${bestRow.condition} is the top non-current candidate for re-audit; this is not investment advice.`
        : "No non-current candidate is available for re-audit; this is not investment advice."
    ].join(" "),
    tone
  };
}

export function buildBacktestReportMarkdown(
  workspace: TerminalWorkspace,
  runHistory: ResearchRunAudit[] = []
): string | null {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const report = buildBacktestReport(workspace);
  const aiDossier = buildAiReviewDossier(workspace);
  const snapshot = run.dataSnapshot;
  const researchNote = normalizedResearchNote(run.researchNote);
  const metricRows = report.metrics.map((metric) => [metric.label, metric.value, metric.tone]);
  const parameterScanSummary = buildBacktestParameterScanSummary(workspace);
  const benchmarkRows = [
    ["Strategy", report.benchmark.strategyReturn],
    ["Benchmark buy and hold", report.benchmark.benchmarkReturn],
    ["Alpha", report.benchmark.alpha]
  ];
  const assumptionRows = report.assumptionRows.map((row) => [row.label, `${row.value} ${row.suffix}`]);
  const parameterScanRows = buildBacktestParameterScanRows(workspace).map((row) => [
    row.condition,
    row.returnPct,
    row.maxDrawdownPct,
    row.tradeCount,
    row.alphaVsCurrent,
    row.status
  ]);
  const runComparisonRows = buildBacktestRunComparisonMatrixRows(runHistory, run.runId);
  const runComparisonSummary = buildBacktestRunComparisonMatrixSummary(runComparisonRows);
  const runComparisonMarkdownRows = runComparisonRows.map((row) => [
    row.runId,
    row.badges.join(", "),
    row.returnPct,
    row.maxDrawdownPct,
    row.winRatePct,
    row.tradeCount,
    row.dataQualityLabel,
    row.assumptions
  ]);
  const crossSymbolComparisonRows = buildBacktestCrossSymbolComparisonRows(runHistory, run.runId);
  const crossSymbolComparisonSummary = buildBacktestCrossSymbolComparisonSummary(crossSymbolComparisonRows);
  const crossSymbolComparisonMarkdownRows = crossSymbolComparisonRows.map((row) => [
    row.symbol,
    row.runId,
    row.badges.join(", "),
    row.returnPct,
    row.maxDrawdownPct,
    row.winRatePct,
    row.tradeCount,
    row.dataQualityLabel
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
    "## Parameter Scan Summary",
    "",
    parameterScanSummary
      ? markdownTable(
          ["Field", "Value"],
          [
            ["Rows", parameterScanSummary.totalRows],
            ["Current rank", parameterScanSummary.currentRank ? `${parameterScanSummary.currentRank}/${parameterScanSummary.totalRows}` : "N/A"],
            ["Candidate for re-audit", parameterScanSummary.bestCandidateCondition ?? "N/A"],
            ["Candidate return", parameterScanSummary.bestCandidateReturnPct],
            ["Candidate max drawdown", parameterScanSummary.bestCandidateMaxDrawdownPct],
            ["Candidate delta", parameterScanSummary.bestCandidateDelta],
            ["Risk rows", parameterScanSummary.riskCount],
            ["Boundary", "Candidate must be re-audited; no investment advice."]
          ]
        )
      : "Parameter scan summary requires an audited data snapshot.",
    "",
    "## Parameter Sensitivity",
    "",
    parameterScanRows.length
      ? markdownTable(["Condition", "Return", "Max drawdown", "Trades", "Delta", "Status"], parameterScanRows)
      : "Parameter sensitivity requires an audited data snapshot.",
    "",
    "## Run Comparison Matrix",
    "",
    runComparisonSummary
      ? [
          runComparisonSummary.headline,
          "",
          runComparisonSummary.detail,
          "",
          markdownTable(
            ["Run", "Badges", "Return", "Max drawdown", "Win rate", "Trades", "Data quality", "Assumptions"],
            runComparisonMarkdownRows
          )
        ].join("\n")
      : "Run comparison matrix requires at least one audited run in history for the same market, symbol, and timeframe.",
    "",
    "## Cross-Symbol Comparison",
    "",
    crossSymbolComparisonSummary
      ? [
          crossSymbolComparisonSummary.headline,
          "",
          crossSymbolComparisonSummary.detail,
          "",
          markdownTable(
            ["Symbol", "Run", "Badges", "Return", "Max drawdown", "Win rate", "Trades", "Data quality"],
            crossSymbolComparisonMarkdownRows
          )
        ].join("\n")
      : "Cross-symbol comparison requires audited runs in history for the same market and timeframe.",
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
  const contextBinding = buildResearchRunContextBinding(workspace);
  const run = workspace.researchRun;
  const snapshot = run?.dataSnapshot;
  const bars = snapshot?.bars.filter((bar) => Number.isFinite(bar.close) && bar.close > 0) ?? [];
  const strategyReturn = parsePercentMetric(metricValue(workspace, "Return", "N/A"));
  const formattedStrategyReturn = strategyReturn === null ? "N/A" : formatSignedPct(strategyReturn);

  if (!run || !contextBinding.canUseRun || bars.length < 2) {
    return {
      label: "Buy and hold",
      symbol: workspace.selectedInstrument.symbol,
      strategyReturn: formattedStrategyReturn,
      benchmarkReturn: "Pending snapshot",
      alpha: "N/A",
      detail:
        run && !contextBinding.canUseRun
          ? contextBinding.detail
          : "Run Pipeline must include a data snapshot before benchmark comparison.",
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

function parameterScanThresholds(currentThreshold: number): number[] {
  return Array.from(
    new Set(
      [currentThreshold - 5, currentThreshold, currentThreshold + 5].map((threshold) =>
        normalizeStrategyThreshold(threshold, defaultStrategyRuleDraft.entryRsiThreshold)
      )
    )
  ).sort((left, right) => left - right);
}

function simulateSmaParameterScan(
  workspace: TerminalWorkspace,
  bars: ResearchRunDataSnapshotBar[],
  entryWindow: number,
  exitWindow: number,
  entryRsiThreshold: number | null = null,
  entryVolumeWindow: number | null = null
): { totalReturnPct: number; maxDrawdownPct: number; tradeCount: number } {
  const assumptions = resolveBacktestAssumptions(workspace);
  const draft = buildStrategyRuleDraft(workspace);
  const feeRate = assumptions.feeBps / 10_000;
  const slippageRate = assumptions.slippageBps / 10_000;
  const positionPct = Math.max(0, Math.min(draft.positionPct / 100, 1));
  const stopLossPct = draft.stopLossPct / 100;
  const takeProfitPct = draft.takeProfitPct / 100;
  const closes = bars.map((bar) => bar.close);
  const volumes = bars.map((bar) => bar.volume);
  let cash = assumptions.initialCash;
  let quantity = 0;
  let entryPrice = 0;
  let tradeCount = 0;
  const equityValues: number[] = [];

  bars.forEach((bar, index) => {
    const passesRsi =
      !draft.entryRsiConfirm ||
      rsiAbove(closes, index, draft.entryRsiWindow, entryRsiThreshold ?? draft.entryRsiThreshold);
    const passesVolume =
      !draft.entryVolumeConfirm || volumeAboveSma(volumes, index, entryVolumeWindow ?? draft.entryVolumeWindow);
    if (quantity <= 0 && closeAboveSma(closes, index, entryWindow) && passesRsi && passesVolume) {
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

function volumeAboveSma(volumes: number[], index: number, window: number): boolean {
  const average = smaAt(volumes, index, window);
  return average !== null && volumes[index] > average;
}

function rsiAbove(closes: number[], index: number, window: number, threshold: number): boolean {
  const value = rsiAt(closes, index, window);
  return value !== null && value > threshold;
}

function rsiAt(closes: number[], index: number, window: number): number | null {
  if (window <= 0 || index < window) {
    return null;
  }
  let gains = 0;
  let losses = 0;
  for (let cursor = index - window + 1; cursor <= index; cursor += 1) {
    const delta = closes[cursor] - closes[cursor - 1];
    if (delta >= 0) {
      gains += delta;
    } else {
      losses += Math.abs(delta);
    }
  }
  const averageGain = gains / window;
  const averageLoss = losses / window;
  if (averageLoss === 0) {
    return 100;
  }
  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
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
    entryRsiConfirm: Boolean(draft.entryRsiConfirm),
    entryRsiWindow: normalizeStrategyWindow(draft.entryRsiWindow),
    entryRsiThreshold: normalizeStrategyThreshold(draft.entryRsiThreshold, defaultStrategyRuleDraft.entryRsiThreshold),
    entryVolumeConfirm: Boolean(draft.entryVolumeConfirm),
    entryVolumeWindow: normalizeStrategyWindow(draft.entryVolumeWindow),
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

function isRsiConditionKind(kind: StrategyConditionKind): boolean {
  return kind === "rsi_below" || kind === "rsi_above";
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

function portfolioPaperOrderStateTone(state: string): "positive" | "warning" | "neutral" | "risk" {
  if (state === "operator_approved" || state === "ready_for_simulation" || state === "simulation_filled") {
    return "positive";
  }
  if (state === "awaiting_operator_review" || state === "risk_review" || state === "simulation_recorded") {
    return "warning";
  }
  if (state === "operator_rejected" || state === "risk_rejected" || state === "invalid_order" || state === "live_blocked") {
    return "risk";
  }
  return "neutral";
}

function executionAdapterLedgerTone(state: string): "positive" | "warning" | "neutral" | "risk" {
  if (state === "paper_ready" || state === "live_ready") {
    return "positive";
  }
  if (state === "config_required") {
    return "warning";
  }
  if (state === "live_blocked" || state === "blocked") {
    return "risk";
  }
  return "neutral";
}

function executionAdapterCertificationTone(
  status: ExecutionAdapterCertificationStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "passed") {
    return "positive";
  }
  if (status === "review") {
    return "warning";
  }
  if (status === "blocked" || status === "failed") {
    return "risk";
  }
  return "neutral";
}

function executionAdapterCertificationStatusLabel(status: ExecutionAdapterCertificationStatus): string {
  return (
    {
      blocked: "Blocked",
      failed: "Failed",
      passed: "Passed",
      review: "Review"
    } satisfies Record<ExecutionAdapterCertificationStatus, string>
  )[status];
}

function executionAdapterCertificationCheckSummary(
  summary: ExecutionAdapterCertificationSnapshot["summary"]
): string {
  const parts = [
    [summary.passedChecks, "passed"],
    [summary.blockedChecks, "blocked"],
    [summary.failedChecks, "failed"],
    [summary.reviewChecks, "review"]
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, label]) => `${count} ${label}`);
  return [...(parts.length ? parts : ["0 passed"]), `${summary.checkCount} checks`].join(" / ");
}

function executionAdapterCertificationApplyTone(
  status: ExecutionAdapterCertificationApplyStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "ready_for_restart") {
    return "warning";
  }
  return "risk";
}

function executionAdapterCertificationApplyStatusLabel(status: ExecutionAdapterCertificationApplyStatus): string {
  return (
    {
      blocked: "Blocked",
      ready_for_restart: "Ready for restart"
    } satisfies Record<ExecutionAdapterCertificationApplyStatus, string>
  )[status];
}

function executionAdapterCertificationApplyConfirmationSummary(
  confirmations: ExecutionAdapterCertificationApplySnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

function executionAdapterCertificationApplyBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

function executionAdapterControlledRestartEvidenceTone(
  status: ExecutionAdapterControlledRestartEvidenceStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "evidence_recorded") {
    return "positive";
  }
  return "risk";
}

function executionAdapterControlledRestartEvidenceStatusLabel(
  status: ExecutionAdapterControlledRestartEvidenceStatus
): string {
  return (
    {
      blocked: "Blocked",
      evidence_recorded: "Evidence recorded"
    } satisfies Record<ExecutionAdapterControlledRestartEvidenceStatus, string>
  )[status];
}

function executionAdapterControlledRestartEvidenceConfirmationSummary(
  confirmations: ExecutionAdapterControlledRestartEvidenceSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

function executionAdapterControlledRestartEvidenceBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

function executionAdapterRestartAcceptanceTone(
  status: ExecutionAdapterRestartAcceptanceStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "acceptance_recorded") {
    return "positive";
  }
  return "risk";
}

function executionAdapterRestartAcceptanceStatusLabel(status: ExecutionAdapterRestartAcceptanceStatus): string {
  return (
    {
      blocked: "Blocked",
      acceptance_recorded: "Acceptance recorded"
    } satisfies Record<ExecutionAdapterRestartAcceptanceStatus, string>
  )[status];
}

function executionAdapterRestartAcceptanceConfirmationSummary(
  confirmations: ExecutionAdapterRestartAcceptanceSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

function executionAdapterRestartAcceptanceBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

function executionAdapterSecretReferenceTone(
  status: ExecutionAdapterSecretReferenceStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "reference_recorded") {
    return "positive";
  }
  return "risk";
}

function executionAdapterSecretReferenceStatusLabel(status: ExecutionAdapterSecretReferenceStatus): string {
  return (
    {
      blocked: "Blocked",
      reference_recorded: "Reference recorded"
    } satisfies Record<ExecutionAdapterSecretReferenceStatus, string>
  )[status];
}

function executionAdapterSecretReferenceEnvVarSummary(requiredEnvVars: string[]): string {
  if (!requiredEnvVars.length) {
    return "No env vars";
  }
  return requiredEnvVars.length === 1 ? "1 env var" : `${requiredEnvVars.length} env vars`;
}

function executionAdapterSecretReferenceConfirmationSummary(
  confirmations: ExecutionAdapterSecretReferenceSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
}

function executionAdapterSecretReferenceBlockerSummary(blockedReasons: string[]): string {
  if (!blockedReasons.length) {
    return "No blockers";
  }
  return blockedReasons.length === 1 ? "1 blocker" : `${blockedReasons.length} blockers`;
}

function executionAdapterSecretMaterializationTone(
  status: ExecutionAdapterSecretMaterializationStatus
): "positive" | "warning" | "neutral" | "risk" {
  if (status === "manifest_recorded") {
    return "positive";
  }
  return "risk";
}

function executionAdapterSecretMaterializationStatusLabel(
  status: ExecutionAdapterSecretMaterializationStatus
): string {
  return (
    {
      blocked: "Blocked",
      manifest_recorded: "Manifest recorded"
    } satisfies Record<ExecutionAdapterSecretMaterializationStatus, string>
  )[status];
}

function executionAdapterSecretMaterializationConfirmationSummary(
  confirmations: ExecutionAdapterSecretMaterializationSnapshot["requiredConfirmations"]
): string {
  const confirmed = confirmations.filter((confirmation) => confirmation.status === "confirmed").length;
  const missing = confirmations.filter((confirmation) => confirmation.status === "missing").length;
  return `${confirmed} confirmed / ${missing} missing`;
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

  const auditBinding = buildResearchRunContextBinding(workspace);
  const run = workspace.researchRun;
  if (!auditBinding.canUseRun || !run) {
    const actionLabel = action === "explain" ? "explanation" : "debate";
    return {
      ...workspace,
      decisionLog: [
        {
          agent: "AI Review Gate",
          message: aiReviewActionBlockedMessage(workspace, actionLabel, auditBinding),
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
          message: `Backtest explanation for ${workspace.selectedInstrument.symbol} using audited run ${run.runId}: return ${returnMetric}${benchmarkClause}, max drawdown ${drawdownMetric}, trades ${tradeMetric}; no guaranteed outcome.`,
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
        message: `Debate generated for ${workspace.selectedInstrument.symbol} using audited run ${run.runId}: bull case requires momentum confirmation; bear case flags drawdown and data quality.`,
        tone: "ai"
      },
      ...workspace.decisionLog
    ]
  };
}

function aiReviewActionBlockedMessage(
  workspace: TerminalWorkspace,
  actionLabel: "explanation" | "debate",
  auditBinding: ResearchRunContextBinding
): string {
  const reason =
    auditBinding.status === "mismatched" ? auditBinding.detail : "run Pipeline to create an audited backtest first.";
  return `AI ${actionLabel} blocked for ${workspace.selectedInstrument.symbol}: ${reason}`;
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
  const auditBinding = buildResearchRunContextBinding(workspace);
  const run = auditBinding.canUseRun ? workspace.researchRun : null;
  if (!run) {
    const actionLabel = action === "explain" ? "explanation" : "debate";
    const blockedMessage = aiReviewActionBlockedMessage(workspace, actionLabel, auditBinding);
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
          message:
            auditBinding.status === "mismatched"
              ? "Audited backtest does not match the current context; run Pipeline before AI review."
              : "Audited backtest is missing; run Pipeline before AI review."
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
          run.runId
        }: return ${returnMetric}${
          benchmark.sampleBars > 0 && benchmark.benchmarkReturn !== "Pending snapshot"
            ? `, benchmark ${benchmark.benchmarkReturn}, alpha ${benchmark.alpha}`
            : ""
        }, max drawdown ${drawdownMetric}; no guaranteed outcome.`
      : `AI debate generated for ${workspace.selectedInstrument.symbol} using audited run ${run.runId}; bull, bear, and risk notes updated.`;

  return {
    activeStageId: "agent",
    completedStageIds: ["data", "factor", "backtest"],
    log: [
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-data`,
        stageId: "data",
        level: run ? "success" : "warning",
        message: run
          ? `Research context bound to ${run.runId}: ${context}`
          : `Research context selected without an audited run: ${context}`
      },
      {
        id: `ai-action-${workspace.selectedInstrument.symbol}-backtest`,
        stageId: "backtest",
        level: run ? "success" : "warning",
        message: run
          ? `Backtest evidence available: ${run.dataRows} bars`
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

export function buildBacktestRunComparisonMatrixRows(
  runs: ResearchRunAudit[],
  currentRunId?: string | null
): BacktestRunComparisonMatrixRow[] {
  const selectedRun = runs.find((run) => run.runId === currentRunId) ?? runs[0] ?? null;
  if (!selectedRun) {
    return [];
  }

  const comparableRuns = runs
    .filter(
      (run) =>
        run.market === selectedRun.market &&
        run.symbol === selectedRun.symbol &&
        run.timeframe === selectedRun.timeframe
    )
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  if (!comparableRuns.length) {
    return [];
  }

  const bestReturnRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "total_return_pct") > metricNumber(best, "total_return_pct") ? run : best
  );
  const lowestDrawdownRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "max_drawdown_pct") < metricNumber(best, "max_drawdown_pct") ? run : best
  );
  const selectedTimestamp = Date.parse(selectedRun.createdAt);
  const previousRun =
    comparableRuns.find((run) => run.runId !== selectedRun.runId && Date.parse(run.createdAt) < selectedTimestamp) ??
    comparableRuns.find((run) => run.runId !== selectedRun.runId) ??
    null;

  return comparableRuns.map((run) => {
    const badges = buildBacktestRunComparisonMatrixBadges(run, {
      bestReturnRun,
      currentRunId: selectedRun.runId,
      lowestDrawdownRun,
      previousRun
    });
    return {
      id: `backtest-run-compare-${run.runId}`,
      assumptions: formatAssumptionsForAudit(normalizeBacktestAssumptions(run.backtestAssumptions)),
      badges,
      context: `${run.market} ${run.symbol} ${run.timeframe}`,
      createdAt: run.createdAt,
      dataQualityLabel: backtestRunComparisonDataQualityLabel(run),
      dataRows: run.dataRows,
      maxDrawdownPct: formatPct(metricNumber(run, "max_drawdown_pct")),
      returnPct: formatSignedPct(metricNumber(run, "total_return_pct")),
      runId: run.runId,
      strategyName: run.strategyName,
      strategyRevision: run.strategyRevision,
      symbol: run.symbol,
      timeframe: run.timeframe,
      tone: backtestRunComparisonTone(run, badges),
      tradeCount: String(metricNumber(run, "trade_count")),
      winRatePct: formatPct(metricNumber(run, "win_rate_pct"))
    };
  });
}

export function buildBacktestCrossSymbolComparisonRows(
  runs: ResearchRunAudit[],
  currentRunId?: string | null
): BacktestRunComparisonMatrixRow[] {
  const selectedRun = runs.find((run) => run.runId === currentRunId) ?? runs[0] ?? null;
  if (!selectedRun) {
    return [];
  }

  const latestRunBySymbol = new Map<string, ResearchRunAudit>();
  runs
    .filter((run) => run.market === selectedRun.market && run.timeframe === selectedRun.timeframe)
    .forEach((run) => {
      const existing = latestRunBySymbol.get(run.symbol);
      if (
        run.runId === selectedRun.runId ||
        !existing ||
        (existing.runId !== selectedRun.runId && Date.parse(run.createdAt) > Date.parse(existing.createdAt))
      ) {
        latestRunBySymbol.set(run.symbol, run);
      }
    });

  const comparableRuns = Array.from(latestRunBySymbol.values()).sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );

  if (!comparableRuns.length) {
    return [];
  }

  const bestReturnRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "total_return_pct") > metricNumber(best, "total_return_pct") ? run : best
  );
  const lowestDrawdownRun = comparableRuns.reduce((best, run) =>
    metricNumber(run, "max_drawdown_pct") < metricNumber(best, "max_drawdown_pct") ? run : best
  );

  return comparableRuns.map((run) => {
    const badges = buildBacktestCrossSymbolComparisonBadges(run, {
      bestReturnRun,
      currentRunId: selectedRun.runId,
      lowestDrawdownRun
    });
    return {
      id: `backtest-cross-symbol-${run.runId}`,
      assumptions: formatAssumptionsForAudit(normalizeBacktestAssumptions(run.backtestAssumptions)),
      badges,
      context: `${run.market} ${run.timeframe} cross-symbol`,
      createdAt: run.createdAt,
      dataQualityLabel: backtestRunComparisonDataQualityLabel(run),
      dataRows: run.dataRows,
      maxDrawdownPct: formatPct(metricNumber(run, "max_drawdown_pct")),
      returnPct: formatSignedPct(metricNumber(run, "total_return_pct")),
      runId: run.runId,
      strategyName: run.strategyName,
      strategyRevision: run.strategyRevision,
      symbol: run.symbol,
      timeframe: run.timeframe,
      tone: backtestRunComparisonTone(run, badges),
      tradeCount: String(metricNumber(run, "trade_count")),
      winRatePct: formatPct(metricNumber(run, "win_rate_pct"))
    };
  });
}

export function buildBacktestRunComparisonMatrixSummary(
  rows: BacktestRunComparisonMatrixRow[]
): BacktestRunComparisonMatrixSummary | null {
  if (!rows.length) {
    return null;
  }
  const currentRow = rows.find((row) => row.badges.includes("current")) ?? null;
  const bestReturnRow = rows.find((row) => row.badges.includes("best_return")) ?? null;
  const lowestDrawdownRow = rows.find((row) => row.badges.includes("lowest_drawdown")) ?? null;
  const previousRow = rows.find((row) => row.badges.includes("previous_run")) ?? null;
  const hasRisk = rows.some((row) => row.tone === "risk");
  const hasWarning = rows.some((row) => row.tone === "warning");
  const tone: BacktestRunComparisonMatrixSummary["tone"] = hasRisk ? "risk" : hasWarning ? "warning" : "positive";

  return {
    bestReturnRunId: bestReturnRow?.runId ?? null,
    context: rows[0].context,
    currentRunId: currentRow?.runId ?? null,
    detail: [
      bestReturnRow ? `Best return ${bestReturnRow.runId} ${bestReturnRow.returnPct}.` : "Best return unavailable.",
      lowestDrawdownRow
        ? `Lowest drawdown ${lowestDrawdownRow.runId} ${lowestDrawdownRow.maxDrawdownPct}.`
        : "Lowest drawdown unavailable.",
      previousRow ? `Previous comparable run ${previousRow.runId}.` : "No previous comparable run.",
      "This is historical audited evidence only, not investment advice."
    ].join(" "),
    headline: `${rows.length} comparable audited runs`,
    lowestDrawdownRunId: lowestDrawdownRow?.runId ?? null,
    previousRunId: previousRow?.runId ?? null,
    tone,
    totalRows: rows.length
  };
}

export function buildBacktestCrossSymbolComparisonSummary(
  rows: BacktestRunComparisonMatrixRow[]
): BacktestRunComparisonMatrixSummary | null {
  if (!rows.length) {
    return null;
  }
  const currentRow = rows.find((row) => row.badges.includes("current")) ?? null;
  const bestReturnRow = rows.find((row) => row.badges.includes("best_return")) ?? null;
  const lowestDrawdownRow = rows.find((row) => row.badges.includes("lowest_drawdown")) ?? null;
  const hasRisk = rows.some((row) => row.tone === "risk");
  const hasWarning = rows.some((row) => row.tone === "warning");
  const tone: BacktestRunComparisonMatrixSummary["tone"] = hasRisk ? "risk" : hasWarning ? "warning" : "positive";

  return {
    bestReturnRunId: bestReturnRow?.runId ?? null,
    context: rows[0].context,
    currentRunId: currentRow?.runId ?? null,
    detail: [
      bestReturnRow
        ? `Best return ${bestReturnRow.symbol} ${bestReturnRow.runId} ${bestReturnRow.returnPct}.`
        : "Best return unavailable.",
      lowestDrawdownRow
        ? `Lowest drawdown ${lowestDrawdownRow.symbol} ${lowestDrawdownRow.runId} ${lowestDrawdownRow.maxDrawdownPct}.`
        : "Lowest drawdown unavailable.",
      "This is historical audited evidence only, not investment advice."
    ].join(" "),
    headline: `${rows.length} audited symbols compared`,
    lowestDrawdownRunId: lowestDrawdownRow?.runId ?? null,
    previousRunId: null,
    tone,
    totalRows: rows.length
  };
}

export function filterBacktestRunComparisonMatrixRows(
  rows: BacktestRunComparisonMatrixRow[],
  query: string
): BacktestRunComparisonMatrixRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [
      row.assumptions,
      row.badges.join(" "),
      row.context,
      row.createdAt,
      row.dataQualityLabel,
      row.maxDrawdownPct,
      row.returnPct,
      row.runId,
      row.strategyName,
      row.strategyRevision,
      row.tradeCount,
      row.winRatePct
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export const filterBacktestCrossSymbolComparisonRows = filterBacktestRunComparisonMatrixRows;

function buildBacktestCrossSymbolComparisonBadges(
  run: ResearchRunAudit,
  context: {
    bestReturnRun: ResearchRunAudit;
    currentRunId: string;
    lowestDrawdownRun: ResearchRunAudit;
  }
): BacktestRunComparisonMatrixBadge[] {
  const badges: BacktestRunComparisonMatrixBadge[] = [];
  if (run.runId === context.currentRunId) {
    badges.push("current");
  }
  if (run.runId === context.bestReturnRun.runId) {
    badges.push("best_return");
  }
  if (run.runId === context.lowestDrawdownRun.runId) {
    badges.push("lowest_drawdown");
  }
  return badges.length ? badges : ["history"];
}

function buildBacktestRunComparisonMatrixBadges(
  run: ResearchRunAudit,
  context: {
    bestReturnRun: ResearchRunAudit;
    currentRunId: string;
    lowestDrawdownRun: ResearchRunAudit;
    previousRun: ResearchRunAudit | null;
  }
): BacktestRunComparisonMatrixBadge[] {
  const badges: BacktestRunComparisonMatrixBadge[] = [];
  if (run.runId === context.currentRunId) {
    badges.push("current");
  }
  if (run.runId === context.previousRun?.runId) {
    badges.push("previous_run");
  }
  if (run.runId === context.bestReturnRun.runId) {
    badges.push("best_return");
  }
  if (run.runId === context.lowestDrawdownRun.runId) {
    badges.push("lowest_drawdown");
  }
  return badges.length ? badges : ["history"];
}

function backtestRunComparisonDataQualityLabel(run: ResearchRunAudit): string {
  const dataQuality = run.dataQuality;
  if (!dataQuality) {
    return "data quality not attached";
  }
  return `${dataQuality.source} ${dataQuality.isComplete ? "complete" : "review"} · ${formatWarningCount(
    dataQuality.warnings.length
  )}`;
}

function backtestRunComparisonTone(
  run: ResearchRunAudit,
  badges: BacktestRunComparisonMatrixBadge[]
): BacktestRunComparisonMatrixRow["tone"] {
  const dataQuality = run.dataQuality;
  if (
    !dataQuality ||
    !dataQuality.isComplete ||
    dataQuality.source === "demo-fallback" ||
    dataQuality.source === "unknown"
  ) {
    return "risk";
  }
  if (dataQuality.warnings.length > 0) {
    return "warning";
  }
  if (badges.includes("best_return") || badges.includes("lowest_drawdown") || badges.includes("current")) {
    return "positive";
  }
  return "neutral";
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

export function watchlistIncludesInstrument(watchlist: Instrument[], instrument: Pick<Instrument, "market" | "symbol">): boolean {
  return watchlist.some((item) => item.market === instrument.market && item.symbol === instrument.symbol);
}

function parseMarket(value: string | null | undefined): Market | null {
  const normalized = value?.trim().toLowerCase();
  return normalized === "ashare" || normalized === "us" || normalized === "crypto" ? normalized : null;
}

function parseTimeframe(value: string | null | undefined): Timeframe | null {
  const normalized = value?.trim();
  return normalized === "1d" ||
    normalized === "1m" ||
    normalized === "5m" ||
    normalized === "15m" ||
    normalized === "30m" ||
    normalized === "60m"
    ? normalized
    : null;
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
    market: run.market,
    symbol: run.symbol,
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

export function workspaceWithSavedWatchlist(
  currentWorkspace: TerminalWorkspace,
  savedWatchlist: Instrument[]
): TerminalWorkspace {
  if (!savedWatchlist.length) {
    return currentWorkspace;
  }
  const selectedInstrument =
    savedWatchlist.find(
      (instrument) =>
        instrument.market === currentWorkspace.selectedInstrument.market &&
        instrument.symbol === currentWorkspace.selectedInstrument.symbol
    ) ?? currentWorkspace.selectedInstrument;
  return {
    ...currentWorkspace,
    selectedInstrument,
    watchlist: savedWatchlist
  };
}

export function workspaceWithSavedResearchWorkspaceState(
  currentWorkspace: TerminalWorkspace,
  savedState: ResearchWorkspaceStateSnapshot
): TerminalWorkspace {
  return {
    ...currentWorkspace,
    researchWorkspaceState: savedState
  };
}

export function resolveResearchContextUrlState(
  search: string | URLSearchParams | null | undefined
): ResearchContextUrlState | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const market = parseMarket(params.get("market"));
  const timeframe = parseTimeframe(params.get("timeframe"));
  if (!market || !timeframe) {
    return null;
  }
  const symbol = normalizeInstrumentSymbol(market, params.get("symbol") ?? "");
  if (!symbol) {
    return null;
  }
  return {
    market,
    symbol,
    timeframe
  };
}

export function workspaceWithResearchContextUrlState(
  currentWorkspace: TerminalWorkspace,
  urlState: ResearchContextUrlState | null | undefined
): TerminalWorkspace {
  if (!urlState) {
    return currentWorkspace;
  }
  const instrument =
    currentWorkspace.watchlist.find(
      (candidate) => candidate.market === urlState.market && candidate.symbol === urlState.symbol
    ) ?? buildInstrumentFromSymbol(urlState.market, urlState.symbol);
  if (!instrument) {
    return currentWorkspace;
  }
  const instrumentWorkspace =
    currentWorkspace.selectedInstrument.market === instrument.market &&
    currentWorkspace.selectedInstrument.symbol === instrument.symbol
      ? currentWorkspace
      : workspaceWithSelectedInstrument(currentWorkspace, instrument);
  return instrumentWorkspace.selectedTimeframe === urlState.timeframe
    ? instrumentWorkspace
    : workspaceWithSelectedTimeframe(instrumentWorkspace, urlState.timeframe);
}

export function workspaceWithSelectedTimeframe(
  currentWorkspace: TerminalWorkspace,
  timeframe: Timeframe
): TerminalWorkspace {
  return freshResearchContext(currentWorkspace, currentWorkspace.selectedInstrument, timeframe);
}

export function workspaceWithAppliedResearchWorkspaceState(currentWorkspace: TerminalWorkspace): TerminalWorkspace {
  const savedState = currentWorkspace.researchWorkspaceState;
  if (!savedState) {
    return currentWorkspace;
  }
  const savedInstrument =
    currentWorkspace.watchlist.find(
      (instrument) => instrument.market === savedState.market && instrument.symbol === savedState.symbol
    ) ?? {
      market: savedState.market,
      symbol: savedState.symbol,
      name: savedState.name || savedState.symbol,
      changePct: 0
    };
  const sameInstrument =
    currentWorkspace.selectedInstrument.market === savedInstrument.market &&
    currentWorkspace.selectedInstrument.symbol === savedInstrument.symbol;
  const instrumentWorkspace = sameInstrument
    ? currentWorkspace
    : workspaceWithSelectedInstrument(currentWorkspace, savedInstrument);
  const timeframeWorkspace =
    instrumentWorkspace.selectedTimeframe === savedState.timeframe
      ? instrumentWorkspace
      : workspaceWithSelectedTimeframe(instrumentWorkspace, savedState.timeframe);
  return {
    ...timeframeWorkspace,
    researchWorkspaceState: savedState
  };
}

export function buildResearchWorkspaceStateDraft(
  workspace: TerminalWorkspace,
  activeWorkAreaId: ProductWorkAreaId
): ResearchWorkspaceStateDraft {
  const workspaceId: Stage1ResearchWorkspaceId =
    activeWorkAreaId === "market" || activeWorkAreaId === "research" ? activeWorkAreaId : "research";
  return {
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    name: workspace.selectedInstrument.name,
    timeframe: workspace.selectedTimeframe,
    workspaceId
  };
}

export function researchWorkspaceStateMatchesDraft(
  savedState: ResearchWorkspaceStateSnapshot | null | undefined,
  draft: ResearchWorkspaceStateDraft
): boolean {
  return Boolean(
    savedState &&
      savedState.market === draft.market &&
      savedState.symbol === draft.symbol &&
      savedState.timeframe === draft.timeframe &&
      savedState.workspaceId === draft.workspaceId
  );
}

export function resolveSavedResearchWorkspaceId(
  workspace: TerminalWorkspace,
  fallback: Stage1ResearchWorkspaceId
): Stage1ResearchWorkspaceId {
  const workspaceId = workspace.researchWorkspaceState?.workspaceId;
  return workspaceId === "market" || workspaceId === "research" ? workspaceId : fallback;
}

export function resolveSavedResearchWorkspaceSelection(
  workspace: TerminalWorkspace,
  fallback: Stage1ResearchWorkspaceId
): ProductWorkAreaSelection {
  return resolveProductWorkAreaSelection(workspace, resolveSavedResearchWorkspaceId(workspace, fallback));
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
  value: number | string | boolean
): TerminalWorkspace {
  const currentDraft = buildStrategyRuleDraft(currentWorkspace);
  const nextDraft = normalizeStrategyRuleDraft({
    ...currentDraft,
    [field]:
      field === "name" || field === "entryKind" || field === "exitKind"
        ? String(value)
        : field === "entryVolumeConfirm" || field === "entryRsiConfirm"
          ? Boolean(value)
          : Number(value)
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

export function workspaceWithStrategyTemplate(
  currentWorkspace: TerminalWorkspace,
  templateId: StrategyTemplateId
): TerminalWorkspace {
  const template = strategyTemplateOptions.find((candidate) => candidate.id === templateId);
  if (!template) {
    return currentWorkspace;
  }

  const nextStrategy = strategySnapshotFromRuleDraft(template.draft);
  const note: DecisionLogEntry = {
    agent: "Strategy Template",
    message: `Strategy template ${template.name} applied locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Template"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;

  return clearAuditedResearchResults(
    {
      ...currentWorkspace,
      strategy: nextStrategy,
      decisionLog: [note, ...existingLog]
    },
    "strategy"
  );
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
    exitWindow: candidate.exitWindow,
    entryRsiThreshold: candidate.entryRsiThreshold ?? currentDraft.entryRsiThreshold,
    entryVolumeWindow: candidate.entryVolumeWindow ?? currentDraft.entryVolumeWindow
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
