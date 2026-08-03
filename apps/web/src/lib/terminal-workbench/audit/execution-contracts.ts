import type { P0CurrentGapActionReadiness } from "./deep-link-queries";
import { LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID, localReviewCoverageNextActionMatchesMissingReviewKind, resolveLocalReviewCoverageMissingReviewKind, resolveLocalReviewCoverageNextActionId } from "./deep-link-queries";
import { auditReportLedgerProductWorkAreaId } from "../research-package/import-audit";
import type { ResearchRunDataPreparationEvidence } from "../research/workspace-contracts";
import type { ResearchContextReadinessStatus } from "../stage1/archive-contracts";
import type { Market, ProductWorkAreaId, Timeframe } from "../stage1/foundation-contracts";
import type { Instrument } from "../stage1/review-contracts";

export function localReviewCoverageNextActionQueryHasSingleStructure(auditReportQuery: string): boolean {
  return (
    localReviewCoverageQueryTokenCount(auditReportQuery, "local-review-bundle-next-action") === 1 &&
    localReviewCoverageQueryTokenCount(auditReportQuery, "record-daily-ops-review") +
      localReviewCoverageQueryTokenCount(auditReportQuery, "record-daily-start-review") +
      localReviewCoverageQueryTokenCount(auditReportQuery, "record-stage1-archive-review") +
      localReviewCoverageQueryTokenCount(auditReportQuery, "record-personal-team-review") ===
      1
  );
}

export function localReviewCoverageQueryIncludesToken(auditReportQuery: string, token: string): boolean {
  return localReviewCoverageQueryTokenCount(auditReportQuery, token) > 0;
}

export function localReviewCoverageQueryTokenCount(auditReportQuery: string, token: string): number {
  return auditReportQuery.split(/\s+/u).filter((part) => part === token).length;
}

export function buildLocalReviewCoverageNextActionUrlSearch(input: {
  auditReportQuery: string | null | undefined;
  targetWorkspaceId: ProductWorkAreaId | string | null | undefined;
}): string | null {
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(input.targetWorkspaceId?.trim() ?? "");
  const auditReportQuery = input.auditReportQuery?.trim() ?? "";
  if (!targetWorkspaceId || !localReviewCoverageNextActionQueryHasSingleStructure(auditReportQuery)) {
    return null;
  }
  if (targetWorkspaceId !== LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID) {
    return null;
  }
  const actionId = resolveLocalReviewCoverageNextActionId(auditReportQuery);
  const missingReviewKind = resolveLocalReviewCoverageMissingReviewKind(auditReportQuery);
  if (
    actionId === "unknown" ||
    missingReviewKind === "unknown" ||
    !localReviewCoverageNextActionMatchesMissingReviewKind(actionId, missingReviewKind, auditReportQuery)
  ) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("workspace", targetWorkspaceId);
  params.set("auditReportQuery", auditReportQuery);
  return params.toString();
}

export function normalizeP0CurrentGapActionId(actionId: string | null | undefined): string {
  const normalized = (actionId ?? "").trim();
  if (normalized === "run-ai-committee") {
    return "run-ai-review";
  }
  return normalized;
}

export function isExecutableP0CurrentGapActionId(actionId: string | null | undefined): boolean {
  switch (normalizeP0CurrentGapActionId(actionId)) {
    case "certify-live-adapter":
    case "fix-paper-handoff":
    case "refresh-data":
    case "refresh-watchlist-cache":
    case "run-ai-review":
    case "run-pipeline":
    case "submit-paper-order":
      return true;
    default:
      return false;
  }
}

export function buildP0CurrentGapActionReadiness({
  actionId,
  targetWorkspaceId,
  workspaceId
}: {
  actionId: string | null | undefined;
  targetWorkspaceId: ProductWorkAreaId | null;
  workspaceId: ProductWorkAreaId | null;
}): P0CurrentGapActionReadiness {
  const normalizedActionId = (actionId ?? "").trim();
  const executableActionId = normalizeP0CurrentGapActionId(normalizedActionId);
  const base = {
    actionId: normalizedActionId,
    executableActionId,
    targetWorkspaceId,
    workspaceId
  };
  if (!normalizedActionId) {
    return {
      ...base,
      canExecute: false,
      reason: "missing-action"
    };
  }
  if (!isExecutableP0CurrentGapActionId(normalizedActionId)) {
    return {
      ...base,
      canExecute: false,
      reason: "unknown-action"
    };
  }
  if (!targetWorkspaceId && !workspaceId) {
    return {
      ...base,
      canExecute: false,
      reason: "missing-workspace"
    };
  }
  return {
    ...base,
    canExecute: true,
    reason: "ready"
  };
}

export function resolveP0CurrentGapActionLinkWorkspace(search: string | URLSearchParams | null | undefined): ProductWorkAreaId | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return auditReportLedgerProductWorkAreaId(params.get("workspace")?.trim() ?? "");
}

export interface MarketDataRefreshOverrideAuditLedgerRow {
  id: string;
  actionScope: string;
  affectedContexts: string[];
  affectedContextsLabel: string;
  affectedSymbols: string[];
  affectedSymbolsLabel: string;
  boundary: string;
  createdAt: string;
  detail: string;
  liveTradingAllowed: boolean;
  market: Market;
  name: string;
  operator: string;
  overrideApplied: boolean;
  overrideReason: string;
  providerHealthReason: string;
  providerHealthStatus: string;
  recentErrorCount: number;
  retryAfterSeconds: number;
  searchText: string;
  source: string;
  stage: string;
  statusLabel: string;
  summary: string;
  symbol: string;
  timeframe: Timeframe;
  tone: "ai" | "positive" | "risk" | "warning";
}

export interface MarketDataRefreshOverrideAuditLedgerSummary {
  blocked: number;
  latestEventId: string;
  latestMarket: Market | "";
  latestReason: string;
  latestRetryAfterSeconds: number;
  latestSymbol: string;
  latestTimeframe: Timeframe | "";
  liveBlocked: number;
  recorded: number;
  total: number;
}

export type PortfolioPaperOrderAuditEventKind = "batch" | "approval" | "simulation";

export interface PortfolioPaperOrderAuditLedgerRow {
  id: string;
  actor: string;
  adapterEvidenceId: string;
  batchId: string;
  boundaryLabel: string;
  createdAt: string;
  detail: string;
  eventKind: PortfolioPaperOrderAuditEventKind;
  eventType: string;
  orderId: string;
  portfolioName: string;
  quantityLabel: string;
  runId: string;
  searchText: string;
  simulationId: string;
  source: string;
  stage: string;
  statusLabel: string;
  summary: string;
  symbol: string;
  tone: "positive" | "risk" | "warning" | "neutral";
  valueLabel: string;
}

export interface PortfolioPaperOrderAuditLedgerSummary {
  approvals: number;
  batches: number;
  latestEventId: string;
  liveBlocked: number;
  simulations: number;
  total: number;
}

export interface ExecutionAdapterPaperExecutionAuditLedgerRow {
  id: string;
  adapterId: string;
  adapterOpsStateId: string;
  blockedReasonsLabel: string;
  boundaryLabel: string;
  confirmationLabel: string;
  createdAt: string;
  detail: string;
  eventType: string;
  fillLabel: string;
  manifestValidationId: string;
  market: string;
  paperFillRecorded: boolean;
  route: string;
  runId: string;
  searchText: string;
  source: string;
  stage: string;
  statusLabel: string;
  summary: string;
  symbol: string;
  tone: "positive" | "risk" | "warning" | "neutral";
}

export interface ExecutionAdapterPaperExecutionAuditLedgerSummary {
  blocked: number;
  filled: number;
  latestEventId: string;
  liveBlocked: number;
  total: number;
}

export type AuditSigningKeyRotationLedgerEventKind =
  | "plan"
  | "apply"
  | "restart"
  | "materialization"
  | "environment_binding"
  | "runtime_reload_plan"
  | "runtime_reload_execution"
  | "rotation_acceptance";

export type AuditSigningKeyRotationLedgerStatus =
  | "prepared"
  | "blocked"
  | "ready_for_restart"
  | "evidence_recorded"
  | "manifest_recorded"
  | "binding_recorded"
  | "plan_recorded"
  | "execution_recorded"
  | "acceptance_recorded";

export interface AuditSigningKeyRotationLedgerRow {
  id: string;
  applyEventId: string;
  applyMode: string;
  createdAt: string;
  confirmedConfirmationCount: number;
  confirmedConfirmationIds: string[];
  currentKeyFingerprint: string;
  currentKeyId: string;
  detail: string;
  environmentUpdateCount: number;
  eventKind: AuditSigningKeyRotationLedgerEventKind;
  executionMode: string;
  liveTradingAllowed: boolean;
  missingConfirmationCount: number;
  missingConfirmationIds: string[];
  operator: string;
  paperOnly: boolean;
  planEventId: string;
  proposedChainId: string;
  proposedKeyId: string;
  proposedSigner: string;
  reloadMode: string;
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

export type AuditSigningKeyRotationChainStageId =
  | "rotation_plan"
  | "secret_materialization"
  | "environment_binding"
  | "runtime_reload_plan"
  | "runtime_reload_execution"
  | "rotation_acceptance";

export type AuditSigningKeyRotationChainState = "empty" | "in_progress" | "blocked" | "complete";

export type AuditSigningKeyRotationChainStageStatus = "missing" | "blocked" | "complete";

export interface AuditSigningKeyRotationChainStage {
  id: AuditSigningKeyRotationChainStageId;
  label: string;
  rowId: string;
  status: AuditSigningKeyRotationChainStageStatus;
  statusLabel: string;
  createdAt: string;
  detail: string;
}

export interface AuditSigningKeyRotationChainSummary {
  blockedCount: number;
  completedCount: number;
  detail: string;
  headline: string;
  missingCount: number;
  nextStageId: AuditSigningKeyRotationChainStageId | null;
  proposedKeyId: string;
  stages: AuditSigningKeyRotationChainStage[];
  state: AuditSigningKeyRotationChainState;
  totalCount: number;
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

export type ResearchOpsQueueStage =
  | "needs_data"
  | "ready_for_pipeline"
  | "needs_ai_review"
  | "paper_candidate";

export type ResearchOpsQueueAction =
  | "refresh-watchlist-cache"
  | "run-pipeline"
  | "run-ai-review"
  | "review-production-handoff";

export interface ResearchOpsQueueRow {
  id: string;
  instrument: Instrument;
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  stage: ResearchOpsQueueStage;
  status: ResearchContextReadinessStatus;
  tone: "positive" | "warning" | "risk";
  nextActionId: ResearchOpsQueueAction;
  nextActionLabel: string;
  latestRunId: string | null;
  latestCacheRunId: string | null;
  cacheSource: string;
  cacheRows: number;
  detail: string;
  selected: boolean;
}

export interface ResearchOpsQueueSummary {
  total: number;
  needsDataCount: number;
  readyForPipelineCount: number;
  needsAiReviewCount: number;
  paperCandidateCount: number;
  headline: string;
  detail: string;
  tone: "positive" | "warning" | "risk" | "neutral";
}

export interface ResearchOpsQueue {
  rows: ResearchOpsQueueRow[];
  summary: ResearchOpsQueueSummary;
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

export interface PortfolioBacktestDiagnosticQuality {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
}

export interface PortfolioBacktestDiagnosticLeg {
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

export interface PortfolioBacktestDiagnosticInput {
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

export interface PortfolioBacktestReportInput extends PortfolioBacktestDiagnosticInput {
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
  preparationEvidence?: ResearchRunDataPreparationEvidence;
}

export interface PaperExecutionSummaryTile {
  id: "account-sync" | "paper-positions" | "preparation-evidence" | "risk-gates";
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
