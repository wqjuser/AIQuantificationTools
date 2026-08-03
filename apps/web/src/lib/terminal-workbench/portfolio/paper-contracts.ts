import type { PaperExecutionSnapshot } from "../audit/execution-contracts";
import type { ExecutionAdapterPaperExecutionRow, PromotionReadiness } from "../execution/ops-contracts";
import type { Market, ProductWorkAreaId, Timeframe } from "../stage1/foundation-contracts";
import type { BacktestAssumptionRow, BacktestAssumptions, BacktestBenchmark, BacktestDiagnostic, BacktestEquityPoint, BacktestEvidenceCard, BacktestMetric, BacktestReadinessGate, BacktestTradeRow } from "../stage1/review-contracts";

export interface BacktestReport {
  status: "ready" | "blocked";
  headline: string;
  summary: string;
  runId: string | null;
  aiReviewReady: boolean;
  researchEvidenceReady: boolean;
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
  | "market-calendar"
  | "data-preparation"
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

export type AiReviewAuditTimelineItemKind =
  | "current-evidence"
  | "citation-bundle-evidence"
  | "strategy-revision-evidence"
  | "committee-rounds-evidence"
  | "decision-log-evidence"
  | "ai-boundary-evidence"
  | "data-snapshot-evidence"
  | "data-preparation-evidence"
  | "paper-execution-preparation-evidence"
  | "market-calendar-evidence"
  | "saved-review"
  | "risk-approval";

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

export type AiReviewExportEvidenceIndexGroup =
  | "current-record"
  | "saved-record"
  | "timeline"
  | "package-authoritative-review"
  | "package-decision";

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
    | "market-calendar"
    | "preparation-evidence"
    | "strategy-config"
    | "research-note"
    | "handoff-notes"
    | "backtest-trades"
    | "paper-executions"
    | "promotion-candidate"
    | "ai-review-runs"
    | "ai-review-runs-v2"
    | "ai-review-decisions"
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
    adapterPaperExecutions?: number;
    portfolioPaperOrderBatches?: number;
    portfolioPaperOrderApprovals?: number;
    portfolioPaperOrderSimulations?: number;
    promotionCandidates?: number;
    researchNotes?: number;
    aiReviewRuns?: number;
    aiReviewRunsV2?: number;
    aiReviewDecisions?: number;
    auditEvents?: number;
    stage4PortfolioWorkflows?: number;
    stage5ShadowSessions?: number;
    stage5SandboxReadinessDecisions?: number;
    stage5SandboxAuthorizationPreflights?: number;
    stage5SandboxAuthorizationReviews?: number;
    handoffNotes?: number;
  };
}

export interface ResearchRunExportAuditEventSnapshot {
  schemaVersion: 1;
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

export interface ResearchRunExportHandoffNoteSnapshot {
  schemaVersion: 1;
  noteId: string;
  subjectType: "research_run" | "strategy_version" | "portfolio_order_batch" | "p0_acceptance";
  subjectId: string;
  body: string;
  author: string;
  sourceWorkspace: string;
  updatedAt: string;
  auditEventId: string | null;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
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
  routeRisk?: {
    status?: string;
    cashAfter?: number;
    blockedReasons?: string[];
  };
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
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
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
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

export interface PortfolioPaperOrderRouteRiskTemplate {
  minCashBufferPct: number;
  maxSymbolNotionalPct: number;
  maxBatchNotionalPct: number;
}

export interface PortfolioPaperOrderSimulationRouteRiskRequest {
  initialCash: number;
  minCashAfter: number;
  maxSymbolNotional: number;
  maxBatchNotional: number;
}

export const defaultPortfolioPaperOrderRouteRiskTemplate: PortfolioPaperOrderRouteRiskTemplate = {
  minCashBufferPct: 2,
  maxSymbolNotionalPct: 20,
  maxBatchNotionalPct: 60
};

export interface PortfolioPaperOrderLatestSimulationSummary {
  id: string;
  simulationId: string;
  batchId: string;
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  simulatedAt: string;
  fillLabel: string;
  orderLabel: string;
  accountLabel: string;
  timelineLabel: string;
  adapterEvidenceLabel: string;
  boundaryLabel: string;
  focusQuery: string;
  stateEventId: string | null;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type PortfolioPaperOrderSimulationRouteState =
  | "ready"
  | "waiting_review"
  | "filled"
  | "blocked"
  | "skipped";

export interface PortfolioPaperOrderSimulationRouteRow {
  id: string;
  batchId: string;
  orderId: string;
  symbol: string;
  side: "buy" | "sell" | "hold";
  routeState: PortfolioPaperOrderSimulationRouteState;
  statusLabel: string;
  detail: string;
  latestStateLabel: string;
  focusQuery: string;
  stateEventId: string | null;
  canSimulate: boolean;
  simulationId: string | null;
  adapterPaperExecutionId: string | null;
  adapterPaperExecutionEvidenceLabel: string;
  adapterManifestValidationId: string | null;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export type PortfolioPaperOpsQueueStage =
  | "waiting_risk"
  | "waiting_human"
  | "ready_for_simulation"
  | "simulated"
  | "rejected"
  | "stale";

export type PortfolioPaperOpsQueueAction =
  | "open-portfolio"
  | "review-order"
  | "open-approval"
  | "simulate-order"
  | "replay-simulation";

export interface PortfolioPaperOpsQueueRow {
  id: string;
  stage: PortfolioPaperOpsQueueStage;
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  orderId: string | null;
  symbol: string;
  side: "buy" | "sell" | "hold" | "batch";
  quantity: number | null;
  notionalValue: number | null;
  statusLabel: string;
  detail: string;
  latestStateLabel: string;
  adapterEvidenceLabel: string;
  simulationId: string | null;
  stateEventId: string | null;
  focusQuery: string;
  nextActionId: PortfolioPaperOpsQueueAction;
  canRunAction: boolean;
  updatedAt: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface PortfolioPaperOpsQueueSummary {
  totalRows: number;
  waitingRiskCount: number;
  waitingHumanCount: number;
  readyForSimulationCount: number;
  simulatedCount: number;
  rejectedCount: number;
  staleCount: number;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
}

export interface PortfolioPaperOpsQueue {
  rows: PortfolioPaperOpsQueueRow[];
  summary: PortfolioPaperOpsQueueSummary;
}

export type PaperExecutionReplayGateStatus = "blocked" | "stale" | "partial" | "replay_ready";

export type PaperExecutionReplayGateTone = "positive" | "warning" | "risk";

export type PaperExecutionReplayGateItemStatus = "passed" | "blocked" | "stale" | "review";

export type PaperExecutionReplayGateItemId =
  | "single-paper-execution"
  | "portfolio-order-ledger"
  | "portfolio-approval-ledger"
  | "portfolio-simulation-ledger"
  | "portfolio-state-history"
  | "portfolio-replay"
  | "adapter-paper-execution"
  | "live-boundary";

export interface PaperExecutionReplayGateItem {
  id: PaperExecutionReplayGateItemId;
  label: string;
  status: PaperExecutionReplayGateItemStatus;
  evidence: string;
  detail: string;
  tone: PaperExecutionReplayGateTone;
}

export interface PaperExecutionReplayGateMetrics {
  filledPaperOrders: number;
  portfolioOrders: number;
  approvedPortfolioOrders: number;
  portfolioFilledOrders: number;
  stateHistoryFilledEvents: number;
  adapterPaperExecutions: number;
  replayWarnings: number;
}

export interface PaperExecutionReplayGate {
  status: PaperExecutionReplayGateStatus;
  tone: PaperExecutionReplayGateTone;
  headline: string;
  detail: string;
  passedCount: number;
  totalCount: number;
  currentBlockerId: PaperExecutionReplayGateItemId | null;
  currentBlockerLabel: string | null;
  latestEvidenceId: string | null;
  replayReady: boolean;
  preLiveReviewAllowed: false;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  metrics: PaperExecutionReplayGateMetrics;
  items: PaperExecutionReplayGateItem[];
}

export interface PaperExecutionReplayGateInput {
  adapterPaperExecutionRows?: ExecutionAdapterPaperExecutionRow[] | null;
  currentRunId?: string | null;
  paperExecution?: PaperExecutionSnapshot | null;
  portfolioApprovalRows?: PortfolioPaperOrderApprovalRow[] | null;
  portfolioOrderLifecycleRows?: PortfolioPaperOrderLifecycleRow[] | null;
  portfolioOrderReplay?: PortfolioPaperOrderReplaySnapshot | null;
  portfolioOrderSimulations?: PortfolioPaperOrderSimulationSnapshot[] | null;
  portfolioStateHistoryRows?: PortfolioPaperOrderStateHistoryRow[] | null;
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
  focusQuery: string;
  adapterEvidenceLabel: string;
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
