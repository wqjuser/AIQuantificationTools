import type { OperatorRunbookAuditCoverage } from "../audit/deep-link-queries";
import type { AuditEvidenceReportLedgerRow } from "../audit/report-contracts";
import type { ExecutionAdapterChainHealthRollup, PreLiveReadinessChecklist } from "../execution/ops-contracts";

export type PanelId =
  | "watchlist"
  | "chart"
  | "strategy"
  | "backtest"
  | "node-workflow"
  | "execution"
  | "agent-committee";

export type Market = "ashare" | "us" | "crypto";

export type Timeframe = "1d" | "1w" | "1m" | "5m" | "15m" | "30m" | "60m";

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
  | "market-information"
  | "research"
  | "strategy"
  | "backtest"
  | "ai-review"
  | "portfolio"
  | "execution"
  | "dynamic-trading"
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
  | "live-readiness"
  | "sandbox-execution"
  | "production-readonly-admission"
  | "production-readonly-continuity"
  | "production-order-admission";

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

export interface MarketAiSelectionResearchOriginUrlState
  extends Omit<ResearchContextUrlState, "timeframe"> {
  timeframe: "1d";
  selectionId: string;
  candidateEvidenceId: string;
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
  targetWorkspace?: string | null;
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
  actionTargetWorkspaceId: string | null;
}

export type P0PlatformReadinessState = "unknown" | "blocked" | "review" | "paper_ready" | "live_ready";

export interface P0PlatformReadinessSource extends GoldenPathRunbookSource {
  latestRunId?: string | null;
  status?: "ready" | "review" | "blocked";
  nextAction?: {
    id: string;
    label: string;
    targetWorkspace: string;
    reason: string;
  } | null;
  summary?: {
    totalSteps: number;
    passedSteps: number;
    reviewSteps: number;
    blockedSteps: number;
    currentStepLabel: string | null;
    nextActionId: string | null;
    liveTradingAllowed: boolean;
  };
}

export interface P0PlatformReadinessGap {
  stepId: string;
  label: string;
  workspaceId: string;
  status: GoldenPathRunbookStatus;
  detail: string;
  actionId: string | null;
  actionLabel: string | null;
  targetWorkspaceId: string | null;
}

export type P0PlatformBacklogPriority = "current" | "blocked" | "review";

export interface P0PlatformBacklogItem extends P0PlatformReadinessGap {
  priority: P0PlatformBacklogPriority;
  rank: number;
}

export interface P0PlatformReadinessSummary {
  state: P0PlatformReadinessState;
  headline: string;
  detail: string;
  progressPct: number;
  passedSteps: number;
  totalSteps: number;
  reviewSteps: number;
  blockedSteps: number;
  openStepCount: number;
  currentGap: P0PlatformReadinessGap | null;
  liveBoundary: {
    liveTradingAllowed: boolean;
    label: string;
    detail: string;
  };
}

export type P0AcceptanceSummaryState = "passed" | "missing" | "invalid";

export type P0AcceptanceSummaryTone = "positive" | "warning" | "risk";

export interface P0AcceptanceSummarySource {
  kind: string;
  schemaVersion: number;
  status: P0AcceptanceSummaryState;
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: Timeframe | null;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  manifest: unknown;
}

export interface P0AcceptanceSummary {
  state: P0AcceptanceSummaryState;
  tone: P0AcceptanceSummaryTone;
  headline: string;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  sourcePath: string;
  runId: string | null;
  checkCount: number;
  requiredCheckCount: number;
  importExportRoundTripReady: boolean;
  liveTradingAllowed: false;
  reportedLiveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export type P1AcceptanceSummaryState = P0AcceptanceSummaryState;

export type P1AcceptanceSummaryTone = P0AcceptanceSummaryTone;

export interface P1AcceptanceSummarySource {
  kind: string;
  schemaVersion: number;
  status: P1AcceptanceSummaryState;
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  timeframe: Timeframe | null;
  watchlistRefreshRunId: string | null;
  queuedMarket: Market | null;
  queuedSymbol: string | null;
  watchlistCount: number;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  manifest: unknown;
}

export interface P1AcceptanceSummary {
  state: P1AcceptanceSummaryState;
  tone: P1AcceptanceSummaryTone;
  headline: string;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  sourcePath: string;
  runId: string | null;
  timeframe: Timeframe | null;
  watchlistRefreshRunId: string | null;
  queuedMarket: Market | null;
  queuedSymbol: string | null;
  watchlistCount: number;
  checkCount: number;
  requiredCheckCount: number;
  importExportRoundTripReady: boolean;
  liveTradingAllowed: false;
  reportedLiveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export type DesktopReleaseSummaryState = P0AcceptanceSummaryState;

export type DesktopReleaseSummaryTone = P0AcceptanceSummaryTone;

export interface DesktopReleaseSummarySource {
  kind: string;
  schemaVersion: number;
  status: DesktopReleaseSummaryState;
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  platform: string | null;
  version: string | null;
  tauriConfigPath: string | null;
  desktopArtifactPath: string | null;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  manifest: unknown;
}

export interface DesktopReleaseSummary {
  state: DesktopReleaseSummaryState;
  tone: DesktopReleaseSummaryTone;
  headline: string;
  detail: string;
  sourceSummary: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  sourcePath: string;
  generatedAt: string | null;
  platform: string | null;
  version: string | null;
  tauriConfigPath: string | null;
  artifactPath: string | null;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  liveTradingAllowed: false;
  reportedLiveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export type Stage1DailyUseSummaryState = "ready" | "review" | "blocked" | "missing" | "invalid";

export type Stage1DailyUseSummaryTone = P0AcceptanceSummaryTone;

export interface Stage1DailyUseSummaryRowSource {
  id: string;
  label: string;
  status: "ready" | "review" | "blocked";
  value: string;
  summary: string;
  action: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export interface Stage1DailyUseSummarySource {
  kind: string;
  schemaVersion: number;
  generatedAt: string | null;
  status: Stage1DailyUseSummaryState;
  summary: string;
  reason?: string;
  readyCount: number;
  totalCount: number;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  sourcePath?: string;
  staleSourcePaths?: string[];
  sourcePaths: {
    p0Acceptance: string;
    p1Acceptance: string;
    desktopRelease: string;
  };
  rows: Stage1DailyUseSummaryRowSource[];
}

export interface Stage1DailyUseSummary {
  state: Stage1DailyUseSummaryState;
  tone: Stage1DailyUseSummaryTone;
  headline: string;
  detail: string;
  sourceSummary: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  generatedAt: string | null;
  readyCount: number;
  totalCount: number;
  sourcePath: string;
  staleSourcePaths: string[];
  staleSourceSummary: string | null;
  rows: Stage1DailyUseSummaryRowSource[];
  liveTradingAllowed: boolean;
  reportedLiveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export type Stage1BootstrapPreflightSummaryState = "ready" | "review" | "blocked" | "missing" | "invalid";

export type Stage1BootstrapPreflightSummaryTone = P0AcceptanceSummaryTone;

export interface Stage1BootstrapPreflightSummaryCheckSource {
  id: string;
  label: string;
  status: "ready" | "review" | "blocked";
  summary: string;
  recommendedCommand: string;
  sourcePath: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export interface Stage1BootstrapPreflightSummarySource {
  kind: string;
  schemaVersion: number;
  generatedAt: string | null;
  status: Stage1BootstrapPreflightSummaryState;
  summary: string;
  reason?: string;
  ready: boolean;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  totalCount: number;
  nextAction: string;
  recommendedCommand: string;
  blockerIds: string[];
  reviewIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  sourcePath?: string;
  staleSourcePaths?: string[];
  sourcePaths: {
    p0Acceptance: string;
    p1Acceptance: string;
    p2ManifestChainPreflight: string;
    desktopRelease: string;
    stage1DailyUse: string;
  };
  checks: Stage1BootstrapPreflightSummaryCheckSource[];
}

export interface Stage1BootstrapPreflightSummary {
  state: Stage1BootstrapPreflightSummaryState;
  tone: Stage1BootstrapPreflightSummaryTone;
  headline: string;
  detail: string;
  sourceSummary: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  generatedAt: string | null;
  readyCount: number;
  totalCount: number;
  sourcePath: string;
  sourcePaths: Stage1BootstrapPreflightSummarySource["sourcePaths"];
  staleSourcePaths: string[];
  staleSourceSummary: string | null;
  currentCheckId: string | null;
  nextAction: string;
  recommendedCommand: string;
  checks: Stage1BootstrapPreflightSummaryCheckSource[];
  liveTradingAllowed: boolean;
  reportedLiveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export type P2PreLiveAcceptanceSummaryState = P0AcceptanceSummaryState;

export type P2PreLiveAcceptanceSummaryTone = P0AcceptanceSummaryTone;

export interface P2PreLiveAcceptanceSummarySource {
  kind: string;
  schemaVersion: number;
  status: P2PreLiveAcceptanceSummaryState;
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: Timeframe | null;
  adapterId: string | null;
  promotionStatus: string | null;
  checklistStatus: string | null;
  passedGateCount: number;
  totalGateCount: number;
  blockingGateCount: number;
  gateIds: string[];
  blockerIds: string[];
  auditEventIds: string[];
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  manualRouteCandidate: boolean;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  manifest: unknown;
}

export interface P2PreLiveAcceptanceSummary {
  state: P2PreLiveAcceptanceSummaryState;
  tone: P2PreLiveAcceptanceSummaryTone;
  headline: string;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  sourcePath: string;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: Timeframe | null;
  adapterId: string | null;
  promotionStatus: string | null;
  checklistStatus: string | null;
  passedGateCount: number;
  totalGateCount: number;
  blockingGateCount: number;
  blockerIds: string[];
  auditEventIds: string[];
  checkCount: number;
  requiredCheckCount: number;
  manualRouteCandidate: boolean;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  reportedOrderSubmissionEnabled: boolean;
  reportedLiveTradingAllowed: boolean;
  reportedLiveOrderSubmitted: boolean;
  reportedRouteExecuted: boolean;
  liveBlockedBoundary: boolean;
}

export type P2PaperReplaySummaryState = P0AcceptanceSummaryState;

export type P2PaperReplaySummaryTone = P0AcceptanceSummaryTone;

export interface P2PaperReplayMetrics {
  filledPaperOrders: number;
  portfolioOrders: number;
  approvedPortfolioOrders: number;
  portfolioFilledOrders: number;
  stateHistoryFilledEvents: number;
  adapterPaperExecutions: number;
  replayWarnings: number;
}

export interface P2PaperReplaySummarySource {
  kind: string;
  schemaVersion: number;
  status: P2PaperReplaySummaryState;
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: Timeframe | null;
  adapterId: string | null;
  replayStatus: string | null;
  passedCheckCount: number;
  totalCheckCount: number;
  warningCount: number;
  requiredCheckCount: number;
  checkCount: number;
  checkIds: string[];
  auditEventIds: string[];
  latestEvidenceId: string | null;
  metrics: P2PaperReplayMetrics;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  manifest: unknown;
}

export interface P2PaperReplaySummary {
  state: P2PaperReplaySummaryState;
  tone: P2PaperReplaySummaryTone;
  headline: string;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  sourcePath: string;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: Timeframe | null;
  adapterId: string | null;
  replayStatus: string | null;
  passedCheckCount: number;
  totalCheckCount: number;
  warningCount: number;
  requiredCheckCount: number;
  checkCount: number;
  checkIds: string[];
  auditEventIds: string[];
  latestEvidenceId: string | null;
  metrics: P2PaperReplayMetrics;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  reportedOrderSubmissionEnabled: boolean;
  reportedLiveTradingAllowed: boolean;
  reportedLiveOrderSubmitted: boolean;
  reportedRouteExecuted: boolean;
  liveBlockedBoundary: boolean;
}

export type P2ManifestChainPreflightStatus = "ready" | "blocked" | "missing" | "invalid";

export type P2ManifestChainPreflightTone = "positive" | "warning" | "risk";

export type P2ManifestChainPreflightStageStatus = "valid" | "missing" | "invalid";

export interface P2ManifestChainPreflightStageSource {
  id: string;
  label: string;
  status: P2ManifestChainPreflightStageStatus;
  path: string;
  summary: string;
  reason: string;
  nextAction: string;
  nextCommand: string;
}

export interface P2ManifestChainPreflightSummarySource {
  kind: string;
  schemaVersion: number;
  status: P2ManifestChainPreflightStatus;
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  ready: boolean;
  validStageCount: number;
  totalStageCount: number;
  blockerIds: string[];
  nextAction: string;
  nextCommand: string;
  stages: P2ManifestChainPreflightStageSource[];
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  manifest: unknown;
}

export interface P2ManifestChainPreflightSummary {
  state: P2ManifestChainPreflightStatus;
  tone: P2ManifestChainPreflightTone;
  headline: string;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  sourcePath: string;
  ready: boolean;
  validStageCount: number;
  totalStageCount: number;
  blockerIds: string[];
  nextAction: string;
  nextCommand: string;
  stages: P2ManifestChainPreflightStageSource[];
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  liveOrderSubmitted: false;
  routeExecuted: false;
  reportedOrderSubmissionEnabled: boolean;
  reportedLiveTradingAllowed: boolean;
  reportedLiveOrderSubmitted: boolean;
  reportedRouteExecuted: boolean;
  liveBlockedBoundary: boolean;
}

export type P2ReadinessEvidenceCoverageStatus = "covered" | "missing" | "stale" | "blocked";

export type P2ReadinessEvidenceCoverageTone = "positive" | "warning" | "risk";

export type P2ReadinessEvidenceCoverageRowId =
  | "paper-replay-manifest"
  | "p2-acceptance-manifest"
  | "p2-manifest-chain-preflight-review"
  | "operator-runbook-audit"
  | "pre-live-checklist"
  | "adapter-chain-health"
  | "safety-boundary";

export type P2ReadinessEvidenceCoverageSourceType = "manifest" | "audit" | "local-state" | "safety-boundary";

export interface P2ReadinessEvidenceCoverageRow {
  id: P2ReadinessEvidenceCoverageRowId;
  label: string;
  status: P2ReadinessEvidenceCoverageStatus;
  tone: P2ReadinessEvidenceCoverageTone;
  evidence: string;
  detail: string;
  sourceType: P2ReadinessEvidenceCoverageSourceType;
  sourceId: string | null;
}

export interface P2ReadinessEvidenceCoverage {
  status: P2ReadinessEvidenceCoverageStatus;
  tone: P2ReadinessEvidenceCoverageTone;
  headline: string;
  detail: string;
  coveredCount: number;
  totalCount: number;
  blockingCount: number;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  rows: P2ReadinessEvidenceCoverageRow[];
}

export interface P2ReadinessEvidenceCoverageInput {
  adapterChainHealthRollups?: ReadonlyArray<ExecutionAdapterChainHealthRollup>;
  operatorRunbookAuditCoverage: OperatorRunbookAuditCoverage;
  p2ManifestChainPreflight?: P2ManifestChainPreflightSummary | null;
  p2ManifestChainPreflightReviewAuditRow?: AuditEvidenceReportLedgerRow | null;
  p2PaperReplay: P2PaperReplaySummary;
  p2PreLiveAcceptance: P2PreLiveAcceptanceSummary;
  preLiveChecklist: PreLiveReadinessChecklist;
}

export type P2ReadinessAcceptanceStatus = "accepted" | "incomplete" | "blocked";

export type P2ReadinessAcceptanceTone = "positive" | "warning" | "risk";

export type P2ReadinessAcceptanceRowStatus = "passed" | "missing" | "blocked";
