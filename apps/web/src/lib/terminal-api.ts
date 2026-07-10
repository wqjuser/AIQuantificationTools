import {
  buildTerminalWorkspace,
  buildAuditEvidenceReportMarkdown,
  buildBacktestReportMarkdown,
  buildBacktestRunComparisonMatrixRows,
  buildStrategyExperimentEvidenceSummary,
  buildPortfolioBacktestDiagnosticRows,
  buildP0CurrentGapActionUrlSearch,
  buildStrategyRuleDraft,
  isExecutableP0CurrentGapActionId,
  normalizeP0CurrentGapActionId,
  resolveBacktestAssumptions,
  workspaceFromResearchRunAudit,
  workspaceWithPrimaryWorkflows,
  Market,
  type MarketDataRefreshGuard,
  type OperatorRunbookSummary,
  PromotionReadiness,
  ResearchRunAudit,
  TerminalWorkspace,
  Timeframe,
  type AiReviewEvidenceAnchor,
  type AiReviewRunRecord,
  type AuditEvidenceSummary,
  type BacktestAssumptions,
  type ExecutionAdapterPreLiveRunbookSummary,
  type P0AcceptanceSummary,
  type P0AcceptanceSummarySource,
  type P2PaperReplaySummarySource,
  type P2PreLiveAcceptanceSummarySource,
  type P2ManifestChainPreflightStageSource,
  type P2ManifestChainPreflightSummary,
  type P2ManifestChainPreflightSummarySource,
  type P0PlatformActionOutcome,
  type P0PlatformActionOutcomeEvidenceLink,
  type P0PlatformBacklogItem,
  type P0CompletionChecklist,
  type P0PaperExecutionPreflight,
  type P0PlatformReadinessSummary,
  type DailyOpsControlRoomSummary,
  type DailyStartBrief,
  type Stage1BootstrapPreflightSummaryCheckSource,
  type Stage1BootstrapPreflightSummarySource,
  type Stage1P0DailyUseArchiveBundle,
  type PersonalTeamUsabilityReadinessSummary,
  type P2ReadinessEvidenceCoverage,
  type P2ReadinessAcceptanceReviewSource,
  type P2ReadinessAcceptanceSummary,
  type ResearchContextReadinessReportArchive,
  type ResearchRunDataPreparationEvidence,
  type StrategyExperimentCandidate,
  type StrategyExperimentDetail,
  type StrategyExperimentErrorCode,
  type StrategyExperimentListItem,
  type StrategyExperimentMetricSet,
  type StrategyRuleDraft,
  type StrategyReadinessGate,
  type StrategySnapshot
} from "./terminal-workbench";
import {
  isAiReviewDecision,
  isAiReviewDecisionChain,
  isAiReviewProviderStatus,
  isAuthoritativeAiReviewRun,
  parseAiReviewHistoryRecord,
  type AiReviewDecision,
  type AiReviewHistoryRecord,
  type AiReviewProviderStatus,
  type AppendAiReviewDecisionRequest,
  type AuthoritativeAiReviewRun,
  type CreateAuthoritativeAiReviewRequest,
  type LegacyAiReviewHistoryRecord
} from "./ai-review-stage3";

export const defaultQuantCoreBaseUrl = "/";
export type ResearchTimeframe = Timeframe;

export type WorkspaceSource = "core" | "fallback";

export interface WorkspaceLoadResult {
  workspace: TerminalWorkspace;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
}

export interface WatchlistSaveResult {
  watchlist: TerminalWorkspace["watchlist"];
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchWorkspaceState {
  market: Market;
  symbol: string;
  name: string;
  timeframe: ResearchTimeframe;
  workspaceId: "market" | "research";
  updatedAt?: string;
}

export interface ResearchWorkspaceStateSaveResult {
  state?: ResearchWorkspaceState;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunHistoryResult {
  runs: ResearchRunAudit[];
  source: WorkspaceSource;
  error?: string;
}

export type StrategyExperimentCreateRequest = import("./terminal-workbench").StrategyExperimentCreateRequest;

export interface StrategyExperimentHistoryParams {
  strategyRevision?: string;
  sourceRunId?: string;
  limit?: number;
}

export interface StrategyExperimentHistoryResult {
  experiments: StrategyExperimentListItem[];
  source: WorkspaceSource;
  errorCode?: StrategyExperimentErrorCode;
  error?: string;
}

export interface StrategyExperimentDetailResult {
  experiment?: StrategyExperimentDetail;
  source: WorkspaceSource;
  errorCode?: StrategyExperimentErrorCode;
  error?: string;
}

export type StrategyExperimentMutationResult = StrategyExperimentDetailResult;

export interface AiReviewProviderStatusResult {
  providers: AiReviewProviderStatus[];
  source: WorkspaceSource;
  error?: string;
}

export interface AuthoritativeAiReviewResult {
  review?: AuthoritativeAiReviewRun;
  latestDecision?: AiReviewDecision | null;
  source: WorkspaceSource;
  error?: string;
}

export interface AuthoritativeAiReviewFilters {
  runId?: string;
  experimentId?: string;
  limit?: number;
  offset?: number;
  query?: string;
}

export interface MixedAiReviewHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  query: string;
}

export interface AuthoritativeAiReviewHistoryResult {
  reviews: AuthoritativeAiReviewRun[];
  legacyReviews: LegacyAiReviewHistoryRecord[];
  pagination?: MixedAiReviewHistoryPagination;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewDecisionHistoryResult {
  decisions: AiReviewDecision[];
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewDecisionMutationResult {
  decision?: AiReviewDecision;
  source: WorkspaceSource;
  error?: string;
}

export type { AppendAiReviewDecisionRequest, CreateAuthoritativeAiReviewRequest };

export interface ResearchNote {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  body: string;
  updatedAt: string | null;
}

export interface ResearchNoteResult {
  note?: ResearchNote;
  source: WorkspaceSource;
  error?: string;
}

export type HandoffNoteSubjectType = "research_run" | "strategy_version" | "portfolio_order_batch" | "p0_acceptance";

export interface HandoffNote {
  schemaVersion: 1;
  noteId: string;
  subjectType: HandoffNoteSubjectType;
  subjectId: string;
  body: string;
  author: string;
  sourceWorkspace: string;
  updatedAt: string;
  auditEventId: string | null;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
}

export interface HandoffNotesResult {
  handoffNotes: HandoffNote[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunDetailResult {
  run?: ResearchRunAudit;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunExportManifest {
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
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
    auditEvents?: number;
    handoffNotes?: number;
  };
}

export interface ResearchRunExecutionGateExport {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface ResearchRunExecutionHandoff {
  mode: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  requiredGates: ResearchRunExecutionGateExport[];
}

export interface ResearchRunExportIntegrity {
  algorithm: "sha256";
  hash: string;
}

export interface ResearchRunExportAuditEvidenceSummary {
  kind: "aiqt.auditEvidenceSummary";
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  auditQuery: string;
  packageQuery: string;
  importDiffQuery: string;
  focusQuery: string;
  deepLinkStatus: AuditEvidenceSummary["deepLinkStatus"];
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
    buckets: AuditEvidenceSummary["importVerificationBuckets"];
  };
  importPolicyBlockers?: {
    blocked: number;
    buckets: AuditEvidenceSummary["importPolicyBlockerBuckets"];
  };
  copyText: string;
}

export interface ResearchRunExportReportSignature {
  [key: string]: string | undefined;
  status: "unsigned" | "signed" | "verified" | "revoked" | "invalid";
  algorithm?: string;
  chainId?: string;
  eventId?: string;
  importVerificationReason?: string;
  importVerificationSource?: "local-core";
  importVerificationStatus?: "verified" | "invalid";
  importVerifiedAt?: string;
  invalidReason?: string;
  keyFingerprint?: string;
  keyId?: string;
  revokedAt?: string;
  revokedReason?: string;
  signedAt?: string;
  signer?: string;
  value?: string;
  verifiedAt?: string;
}

export interface ResearchRunExportAuditReport {
  kind: "aiqt.auditReport";
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  format: "text/markdown";
  fileName: string;
  contentSha256: ResearchRunExportIntegrity;
  contentMarkdown: string;
  signature?: ResearchRunExportReportSignature;
  evidenceSummary: ResearchRunExportAuditEvidenceSummary;
}

export interface ResearchRunExportBacktestReport {
  kind: "aiqt.backtestReport";
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  format: "text/markdown";
  fileName: string;
  contentSha256: ResearchRunExportIntegrity;
  contentMarkdown: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  strategyRevision: string;
  executionMode: string;
  dataRows: number;
  runComparisonRows: number;
  signature?: ResearchRunExportReportSignature;
  boundary: "historical audited evidence only; no investment advice";
}

export interface ResearchRunExportP0PackageCriterion {
  id: string;
  label: string;
  status: "passed" | "review" | "blocked";
  detail: string;
  evidence: string;
  evidencePath: string;
}

export interface ResearchRunExportP0PackageCompleteness {
  kind: "aiqt.p0PackageCompleteness";
  schemaVersion: 1;
  runId: string;
  ready: boolean;
  status: "complete" | "review" | "blocked";
  passed: number;
  review: number;
  blocked: number;
  total: number;
  progressPct: number;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  summary: string;
  criteria: ResearchRunExportP0PackageCriterion[];
}

export interface ResearchRunExportPackage {
  kind: "aiqt.researchRun.export";
  packageVersion: number;
  exportedAt: string;
  integrity?: ResearchRunExportIntegrity;
  manifest: ResearchRunExportManifest;
  researchRun: ResearchRunAudit;
  executionHandoff: ResearchRunExecutionHandoff;
  paperExecutions?: PaperExecutionRecord[];
  adapterPaperExecutions?: ExecutionAdapterPaperExecutionResult[];
  portfolioPaperOrderBatches?: PortfolioPaperOrderBatch[];
  portfolioPaperOrderApprovals?: PortfolioPaperOrderApproval[];
  portfolioPaperOrderSimulations?: PortfolioPaperOrderSimulation[];
  promotionCandidate?: PromotionCandidateRecord | null;
  aiReviewRuns?: AiReviewRunRecordEnvelope[];
  auditEvents?: AuditEventRecord[];
  handoffNotes?: HandoffNote[];
  p0PackageCompleteness?: ResearchRunExportP0PackageCompleteness;
  auditEvidenceSummary?: ResearchRunExportAuditEvidenceSummary;
  auditReport?: ResearchRunExportAuditReport;
  backtestReport?: ResearchRunExportBacktestReport;
}

export interface ResearchRunExportResult {
  exportPackage?: ResearchRunExportPackage;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunImportResult {
  run?: ResearchRunAudit;
  note?: ResearchNote;
  strategies?: StrategyLibraryItem[];
  undoToken?: string;
  undo?: ResearchRunImportUndoRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunImportUndoRecord {
  undoToken: string;
  runId: string;
  createdAt: string;
  consumedAt: string | null;
  status: string;
}

export interface ResearchRunImportUndoResult {
  undo?: ResearchRunImportUndoRecord;
  run?: ResearchRunAudit | null;
  source: WorkspaceSource;
  error?: string;
}

export interface PaperExecutionAccount {
  cash: number;
  positions: Record<string, number>;
  equity: number;
}

export interface PaperExecutionOrder {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  status: "filled" | "rejected";
  reason: string;
  timestamp: string;
}

export interface PaperExecutionGate {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface PaperExecutionRecord {
  executionId: string;
  runId: string;
  createdAt: string;
  mode: string;
  account: PaperExecutionAccount;
  orders: PaperExecutionOrder[];
  gates: PaperExecutionGate[];
  preparationEvidence?: ResearchRunDataPreparationEvidence;
}

export interface PromotionCandidateEvidence {
  paperExecutions: number;
  filledOrders: number;
  passedPaperRiskChecks: number;
}

export interface PromotionCandidateRecord extends PromotionReadiness {
  candidateId: string;
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  strategyRevision: string;
  latestPaperExecutionId?: string | null;
  liveTradingAllowed: boolean;
  evidence: PromotionCandidateEvidence;
}

export interface PaperExecutionResult {
  execution?: PaperExecutionRecord;
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PaperExecutionHistoryResult {
  executions: PaperExecutionRecord[];
  source: WorkspaceSource;
  error?: string;
}

export interface PromotionCandidateResult {
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewRunRecordEnvelope {
  aiReviewId: string;
  runId: string;
  createdAt: string;
  record: AiReviewRunRecord;
}

export interface AiReviewRunRecordResult {
  aiReview?: AiReviewRunRecordEnvelope;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewRunHistoryResult {
  aiReviews: AiReviewRunRecordEnvelope[];
  pagination?: AiReviewRunHistoryPagination;
  source: WorkspaceSource;
  error?: string;
}

export interface P0AiReviewRunParams {
  runId: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
}

export interface P0AiReviewRunResult {
  aiReview?: AiReviewRunRecordEnvelope;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
  mode?: "local_evidence_review";
  paperOnly?: boolean;
  liveTradingAllowed?: boolean;
  directTradingInstructionBlocked?: boolean;
}

export interface P0PaperSimulationParams {
  runId: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
}

export interface P0PaperSimulationFill {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  fillPrice: number;
  status: "filled" | "rejected";
  filledAt: string;
  reason: string;
}

export interface P0PaperSimulationAccountReplay {
  mode: "single_run_paper_replay";
  runId: string;
  symbol: string;
  initialCash: number;
  cashAfter: number;
  positionAfter: number;
  equityAfter: number;
  ordersApplied: number;
  paperOnly: true;
  liveTradingAllowed: false;
}

export interface P0PaperSimulationGate {
  id: string;
  label: string;
  status: "passed" | "blocked" | "review";
  detail: string;
}

export interface P0PaperSimulationExportReadiness {
  ready: boolean;
  requiredArtifacts: string[];
  paperExecutionId: string;
  auditEventId: string;
  detail: string;
}

export interface P0PaperSimulationResponse {
  status: "paper_simulation_created";
  runId: string;
  paperOnly: true;
  liveTradingAllowed: false;
  orderSubmitted?: false;
  liveOrderSubmitted?: false;
  routeExecuted?: false;
  paperOrderRecorded?: true;
  simulatedFillRecorded?: true;
  liveRouteBlockedReason: string;
  execution: PaperExecutionRecord;
  simulatedFill: P0PaperSimulationFill;
  accountReplay: P0PaperSimulationAccountReplay;
  gates?: P0PaperSimulationGate[];
  aiReview?: AiReviewRunRecordEnvelope;
  promotion?: PromotionCandidateRecord;
  auditEvent: AuditEventRecord;
  exportReadiness: P0PaperSimulationExportReadiness;
}

export interface P0PaperSimulationRunResult {
  simulation?: P0PaperSimulationResponse;
  execution?: PaperExecutionRecord;
  simulatedFill?: P0PaperSimulationFill;
  accountReplay?: P0PaperSimulationAccountReplay;
  auditEvent?: AuditEventRecord;
  exportReadiness?: P0PaperSimulationExportReadiness;
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
  paperOnly?: boolean;
  liveTradingAllowed?: boolean;
  orderSubmitted?: boolean;
  liveOrderSubmitted?: boolean;
  routeExecuted?: boolean;
  liveRouteBlockedReason?: string;
}

export interface P0AcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface P0AcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  importBaseUrl?: string | null;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P0AcceptanceManifestCheck[];
}

export interface P0AcceptanceStatus {
  kind: "aiqt.p0AcceptanceStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: ResearchTimeframe | null;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  manifest: P0AcceptanceManifest | null;
}

export interface P0AcceptanceLatestResult {
  acceptance?: P0AcceptanceStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P1AcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface P1AcceptanceManifestWatchlistItem {
  market: string;
  symbol: string;
  name: string;
}

export interface P1AcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  importBaseUrl?: string | null;
  timeframe: ResearchTimeframe;
  runId: string;
  watchlistRefreshRunId: string;
  queuedMarket: Market;
  queuedSymbol: string;
  watchlistCount: number;
  watchlist: P1AcceptanceManifestWatchlistItem[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P1AcceptanceManifestCheck[];
}

export interface P1AcceptanceStatus {
  kind: "aiqt.p1AcceptanceStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  timeframe: ResearchTimeframe | null;
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
  manifest: P1AcceptanceManifest | null;
}

export interface P1AcceptanceLatestResult {
  acceptance?: P1AcceptanceStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface DesktopReleaseManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface DesktopReleaseManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  platform: string;
  version: string;
  tauriConfigPath: string;
  desktopArtifactPath: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: DesktopReleaseManifestCheck[];
}

export interface DesktopReleaseStatus {
  kind: "aiqt.desktopReleaseStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
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
  manifest: DesktopReleaseManifest | null;
}

export interface DesktopReleaseLatestResult {
  release?: DesktopReleaseStatus;
  source: WorkspaceSource;
  error?: string;
}

export type Stage1DailyUseReportStatus = "ready" | "review" | "blocked" | "missing" | "invalid";
export type Stage1DailyUseReportRowStatus = "ready" | "review" | "blocked";

export interface Stage1DailyUseReportSourcePaths {
  p0Acceptance: string;
  p1Acceptance: string;
  desktopRelease: string;
}

export interface Stage1DailyUseReportRow {
  id: string;
  label: string;
  status: Stage1DailyUseReportRowStatus;
  value: string;
  summary: string;
  action: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export interface Stage1DailyUseReport {
  kind: "aiqt.stage1DailyUseReport";
  schemaVersion: 1;
  generatedAt: string | null;
  status: Stage1DailyUseReportStatus;
  summary: string;
  reason?: string;
  readyCount: number;
  totalCount: number;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  sourcePath?: string;
  staleSourcePaths?: string[];
  sourcePaths: Stage1DailyUseReportSourcePaths;
  rows: Stage1DailyUseReportRow[];
}

export interface Stage1DailyUseLatestResult {
  dailyUse?: Stage1DailyUseReport;
  source: WorkspaceSource;
  error?: string;
}

export interface Stage1DailyUseGenerateResult {
  dailyUse?: Stage1DailyUseReport;
  status: "daily_use_generated" | "daily_use_failed";
  source: WorkspaceSource;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  error?: string;
}

export type Stage1BootstrapPreflightStatus = "ready" | "review" | "blocked" | "missing" | "invalid";
export type Stage1BootstrapPreflightCheckStatus = "ready" | "review" | "blocked";

export interface Stage1BootstrapPreflightSourcePaths {
  p0Acceptance: string;
  p1Acceptance: string;
  p2ManifestChainPreflight: string;
  desktopRelease: string;
  stage1DailyUse: string;
}

export interface Stage1BootstrapPreflightCheck {
  id: string;
  label: string;
  status: Stage1BootstrapPreflightCheckStatus;
  summary: string;
  recommendedCommand: string;
  sourcePath: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export interface Stage1BootstrapPreflight {
  kind: "aiqt.stage1BootstrapPreflight";
  schemaVersion: 1;
  generatedAt: string | null;
  status: Stage1BootstrapPreflightStatus;
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
  sourcePaths: Stage1BootstrapPreflightSourcePaths;
  checks: Stage1BootstrapPreflightCheck[];
}

export interface Stage1BootstrapPreflightLatestResult {
  preflight?: Stage1BootstrapPreflight;
  source: WorkspaceSource;
  error?: string;
}

export interface Stage1BootstrapPreflightGenerateResult {
  preflight?: Stage1BootstrapPreflight;
  status: "preflight_generated" | "preflight_failed";
  source: WorkspaceSource;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  error?: string;
}

export interface P2PreLiveAcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface P2PreLiveAcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  adapterId: string;
  promotionStatus: string;
  checklistStatus: string;
  passedGateCount: number;
  totalGateCount: number;
  blockingGateCount: number;
  gateIds: string[];
  blockerIds: string[];
  auditEventIds: string[];
  manualRouteCandidate: boolean;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P2PreLiveAcceptanceManifestCheck[];
}

export interface P2PreLiveAcceptanceStatus extends P2PreLiveAcceptanceSummarySource {
  kind: "aiqt.p2PreLiveAcceptanceStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  manifest: P2PreLiveAcceptanceManifest | null;
}

export interface P2PreLiveAcceptanceLatestResult {
  acceptance?: P2PreLiveAcceptanceStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2PaperReplayManifestCheck {
  id: string;
  status: string;
  summary: string;
  evidenceId: string;
}

export interface P2PaperReplayMetrics {
  filledPaperOrders: number;
  portfolioOrders: number;
  approvedPortfolioOrders: number;
  portfolioFilledOrders: number;
  stateHistoryFilledEvents: number;
  adapterPaperExecutions: number;
  replayWarnings: number;
}

export interface P2PaperReplayManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  adapterId: string;
  replayStatus: string;
  passedCheckCount: number;
  totalCheckCount: number;
  warningCount: number;
  checkIds: string[];
  auditEventIds: string[];
  latestEvidenceId: string;
  metrics: P2PaperReplayMetrics;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P2PaperReplayManifestCheck[];
}

export interface P2PaperReplayStatus extends P2PaperReplaySummarySource {
  kind: "aiqt.p2PaperReplayStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  manifest: P2PaperReplayManifest | null;
}

export interface P2PaperReplayLatestResult {
  replay?: P2PaperReplayStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2ReadinessAcceptanceManifestPaths {
  p1Acceptance: string | null;
  p2PreLiveAcceptance: string | null;
  p2PaperReplay: string | null;
}

export interface P2ReadinessAcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
  evidenceId: string;
}

export interface P2ReadinessAcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  adapterId: string;
  p1AcceptanceRunId: string;
  p2PreLiveAcceptanceRunId: string;
  p2PaperReplayRunId: string;
  operatorRunbookAuditEventId: string;
  readinessCoverageStatus: string;
  acceptedCriterionCount: number;
  totalCriterionCount: number;
  blockingCriterionCount: number;
  criterionIds: string[];
  auditEventIds: string[];
  manifestPaths: P2ReadinessAcceptanceManifestPaths;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P2ReadinessAcceptanceManifestCheck[];
}

export interface P2ReadinessAcceptanceReadbackStatus {
  kind: "aiqt.p2ReadinessAcceptanceStatus";
  schemaVersion: 1;
  status: "accepted" | "missing" | "invalid";
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: ResearchTimeframe | null;
  adapterId: string | null;
  p1AcceptanceRunId: string | null;
  p2PreLiveAcceptanceRunId: string | null;
  p2PaperReplayRunId: string | null;
  operatorRunbookAuditEventId: string | null;
  readinessCoverageStatus: string | null;
  acceptedCriterionCount: number;
  totalCriterionCount: number;
  blockingCriterionCount: number;
  criterionIds: string[];
  auditEventIds: string[];
  manifestPaths: P2ReadinessAcceptanceManifestPaths;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  manifest: P2ReadinessAcceptanceManifest | null;
}

export interface P2ReadinessAcceptanceLatestResult {
  acceptance?: P2ReadinessAcceptanceReadbackStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2ReadinessAcceptanceGenerateResult {
  acceptance?: P2ReadinessAcceptanceReadbackStatus;
  auditEvent?: AuditEventRecord;
  status: "acceptance_generated" | "acceptance_failed";
  source: WorkspaceSource;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  error?: string;
}

export interface P2ManifestChainPreflightManifest {
  kind: string;
  schemaVersion: number;
  status: "ready" | "blocked";
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
}

export interface P2ManifestChainPreflightStatus extends P2ManifestChainPreflightSummarySource {
  kind: "aiqt.p2ManifestChainPreflightStatus";
  schemaVersion: 1;
  status: "ready" | "blocked" | "missing" | "invalid";
  manifest: P2ManifestChainPreflightManifest | null;
}

export interface P2ManifestChainPreflightLatestResult {
  preflight?: P2ManifestChainPreflightStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2ManifestChainPreflightGenerateResult {
  preflight?: P2ManifestChainPreflightStatus;
  auditEvent?: AuditEventRecord;
  status: "preflight_generated" | "preflight_failed";
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewRunHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  query: string;
}

export interface AiReviewRunHistoryParams {
  query?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEventRecord {
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

export interface AuditEventResult {
  event?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditReportSignatureVerification {
  status: "verified" | "invalid";
  reason: string;
}

export interface AuditReportSignatureResult {
  event?: AuditEventRecord;
  signature?: Record<string, unknown>;
  verification?: AuditReportSignatureVerification;
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyStatus = "active" | "retired" | "revoked";

export interface AuditSigningKeyRecord {
  keyId: string;
  signer: string;
  algorithm: "hmac-sha256";
  chainId: string;
  status: AuditSigningKeyStatus;
  source: string;
  fingerprint: string;
  canSign: boolean;
  canVerify: boolean;
  createdAt: string | null;
  activatedAt: string | null;
  retiredAt: string | null;
}

export interface AuditSigningKeyRegistry {
  schemaVersion: 1;
  generatedAt: string;
  activeKeyId: string;
  rotationRequired: boolean;
  keys: AuditSigningKeyRecord[];
}

export interface AuditSigningKeyRegistryResult {
  registry?: AuditSigningKeyRegistry;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationPlanEnvUpdate {
  name: string;
  value: string;
  sensitivity: "public" | "secret";
}

export interface AuditSigningKeyRotationPlanStep {
  id: string;
  title: string;
  detail: string;
  status: "manual" | "required" | "blocked";
}

export interface AuditSigningKeyRotationPlan {
  schemaVersion: 1;
  generatedAt: string;
  currentActiveKey: Pick<AuditSigningKeyRecord, "chainId" | "fingerprint" | "keyId" | "signer">;
  proposedActiveKey: Pick<AuditSigningKeyRecord, "chainId" | "keyId" | "signer">;
  rotationRequired: boolean;
  requiresRestart: boolean;
  environmentUpdates: AuditSigningKeyRotationPlanEnvUpdate[];
  legacyRegistryTemplate: string;
  steps: AuditSigningKeyRotationPlanStep[];
  blockedReasons: string[];
}

export interface AuditSigningKeyRotationPlanParams {
  proposedChainId?: string;
  proposedKeyId?: string;
  proposedSigner?: string;
}

export interface AuditSigningKeyRotationPlanResult {
  rotationPlan?: AuditSigningKeyRotationPlan;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationApplyConfirmation {
  id: string;
  label: string;
  status: "confirmed" | "missing";
}

export interface AuditSigningKeyRotationApply {
  schemaVersion: 1;
  generatedAt: string;
  status: "blocked" | "ready_for_restart";
  applyMode: "manual_secret_store";
  auditEventType: "audit_signing_key_rotation_apply";
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  restartRequired: boolean;
  requiredConfirmations: AuditSigningKeyRotationApplyConfirmation[];
  blockedReasons: string[];
  environmentUpdateNames: string[];
  secretPlaceholderNames: string[];
}

export interface AuditSigningKeyRotationApplyParams {
  rotationPlan: AuditSigningKeyRotationPlan;
  confirmations: {
    legacySecretStored?: boolean;
    newSecretMaterialStored?: boolean;
    operatorReviewedPlan?: boolean;
  };
}

export interface AuditSigningKeyRotationApplyResult {
  rotationApply?: AuditSigningKeyRotationApply;
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyControlledRestartEvidenceStatus = "blocked" | "evidence_recorded";
export type AuditSigningKeyControlledRestartEvidenceConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyControlledRestartEvidenceConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyControlledRestartEvidenceConfirmationStatus;
}

export interface AuditSigningKeyControlledRestartEvidence {
  schemaVersion: 1;
  evidenceId: string;
  applyEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyControlledRestartEvidenceStatus;
  operator: string;
  recordedAt: string;
  evidenceMode: "manual_controlled_restart";
  restartRequired: boolean;
  requiredConfirmations: AuditSigningKeyControlledRestartEvidenceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyControlledRestartEvidenceRequest {
  applyEventId: string;
  operator?: string;
  confirmations?: {
    restartWindowExecuted?: boolean;
    rollbackPlanConfirmed?: boolean;
    postRestartValidationPassed?: boolean;
    operatorReviewedRestartLogs?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyControlledRestartEvidenceResult {
  restartEvidence?: AuditSigningKeyControlledRestartEvidence;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeySecretMaterializationStatus = "blocked" | "manifest_recorded";
export type AuditSigningKeySecretMaterializationConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeySecretMaterializationConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeySecretMaterializationConfirmationStatus;
}

export interface AuditSigningKeySecretMaterialization {
  schemaVersion: 1;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeySecretMaterializationStatus;
  operator: string;
  recordedAt: string;
  materializationMode: "local_secret_store_manifest";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  secretPlaceholderNames: string[];
  requiredConfirmations: AuditSigningKeySecretMaterializationConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeySecretMaterializationRequest {
  planEventId: string;
  operator?: string;
  backend: string;
  manifestPath: string;
  confirmations?: {
    localSecretStoreWriteVerified?: boolean;
    noRawSecretInPayload?: boolean;
    envBindingPlanDocumented?: boolean;
    rollbackPlanDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeySecretMaterializationResult {
  secretMaterialization?: AuditSigningKeySecretMaterialization;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeySecretMaterializationHistoryResult {
  secretMaterializations: AuditSigningKeySecretMaterialization[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyEnvironmentBindingStatus = "blocked" | "binding_recorded";
export type AuditSigningKeyEnvironmentBindingConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyEnvironmentBindingConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyEnvironmentBindingConfirmationStatus;
}

export interface AuditSigningKeyEnvironmentBinding {
  schemaVersion: 1;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyEnvironmentBindingStatus;
  operator: string;
  recordedAt: string;
  bindingMode: "container_env_reference";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyEnvironmentBindingConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyEnvironmentBindingRequest {
  materializationId: string;
  operator?: string;
  bindingMode?: "container_env_reference";
  confirmations?: {
    runtimeEnvMappingVerified?: boolean;
    configReloadPlanDocumented?: boolean;
    noRawSecretInPayload?: boolean;
    rollbackSnapshotRecorded?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyEnvironmentBindingResult {
  environmentBinding?: AuditSigningKeyEnvironmentBinding;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyEnvironmentBindingHistoryResult {
  environmentBindings: AuditSigningKeyEnvironmentBinding[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyRuntimeReloadPlanStatus = "blocked" | "plan_recorded";
export type AuditSigningKeyRuntimeReloadPlanConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyRuntimeReloadPlanConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyRuntimeReloadPlanConfirmationStatus;
}

export interface AuditSigningKeyRuntimeReloadPlan {
  schemaVersion: 1;
  planId: string;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyRuntimeReloadPlanStatus;
  operator: string;
  recordedAt: string;
  reloadMode: "manual_container_reload_plan";
  maintenanceWindowId: string;
  bindingMode: "container_env_reference";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyRuntimeReloadPlanConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyRuntimeReloadPlanRequest {
  bindingId: string;
  operator?: string;
  reloadMode?: "manual_container_reload_plan";
  maintenanceWindowId: string;
  confirmations?: {
    maintenanceWindowApproved?: boolean;
    healthBaselineCaptured?: boolean;
    configDiffReviewed?: boolean;
    postReloadSmokePlanDocumented?: boolean;
    rollbackOwnerAssigned?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyRuntimeReloadPlanResult {
  runtimeReloadPlan?: AuditSigningKeyRuntimeReloadPlan;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRuntimeReloadPlanHistoryResult {
  runtimeReloadPlans: AuditSigningKeyRuntimeReloadPlan[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyRuntimeReloadExecutionStatus = "blocked" | "execution_recorded";
export type AuditSigningKeyRuntimeReloadExecutionConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyRuntimeReloadExecutionConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyRuntimeReloadExecutionConfirmationStatus;
}

export interface AuditSigningKeyRuntimeReloadExecution {
  schemaVersion: 1;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyRuntimeReloadExecutionStatus;
  operator: string;
  recordedAt: string;
  executionMode: "manual_controlled_reload_evidence";
  reloadMode: "manual_container_reload_plan";
  maintenanceWindowId: string;
  bindingMode: "container_env_reference";
  backend: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyRuntimeReloadExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyRuntimeReloadExecutionRequest {
  planId: string;
  operator?: string;
  executionMode?: "manual_controlled_reload_evidence";
  confirmations?: {
    preReloadHealthVerified?: boolean;
    reloadActionRecorded?: boolean;
    postReloadSmokePassed?: boolean;
    rollbackReadinessConfirmed?: boolean;
    operatorConfirmedLiveBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyRuntimeReloadExecutionResult {
  runtimeReloadExecution?: AuditSigningKeyRuntimeReloadExecution;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRuntimeReloadExecutionHistoryResult {
  runtimeReloadExecutions: AuditSigningKeyRuntimeReloadExecution[];
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyRotationAcceptanceStatus = "blocked" | "acceptance_recorded";
export type AuditSigningKeyRotationAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface AuditSigningKeyRotationAcceptanceConfirmation {
  id: string;
  label: string;
  status: AuditSigningKeyRotationAcceptanceConfirmationStatus;
}

export interface AuditSigningKeyRotationAcceptance {
  schemaVersion: 1;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  planEventId: string;
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  status: AuditSigningKeyRotationAcceptanceStatus;
  operator: string;
  recordedAt: string;
  acceptanceMode: "manual_rotation_acceptance";
  executionMode: "manual_controlled_reload_evidence";
  reloadMode: "manual_container_reload_plan";
  maintenanceWindowId: string;
  requiredEnvVars: string[];
  requiredConfirmations: AuditSigningKeyRotationAcceptanceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface AuditSigningKeyRotationAcceptanceRequest {
  executionId: string;
  operator?: string;
  acceptanceMode?: "manual_rotation_acceptance";
  confirmations?: {
    executionEvidenceReviewed?: boolean;
    signatureProbeVerified?: boolean;
    legacyVerificationConfirmed?: boolean;
    rollbackWindowStillOpen?: boolean;
    operatorConfirmedActivationBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditSigningKeyRotationAcceptanceResult {
  rotationAcceptance?: AuditSigningKeyRotationAcceptance;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationAcceptanceHistoryResult {
  rotationAcceptances: AuditSigningKeyRotationAcceptance[];
  source: WorkspaceSource;
  error?: string;
}

export interface AuditEventHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  query: string;
}

export interface AuditEventHistoryResult {
  events: AuditEventRecord[];
  pagination?: AuditEventHistoryPagination;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditEventHistoryParams {
  runId?: string | null;
  eventType?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export type StrategyLibraryStatus = "draft" | "audited";

export interface StrategyLibraryConfig {
  name: string;
  revision: string;
  market: Market;
  symbols: string[];
  timeframe: ResearchTimeframe;
  version: number;
  entryConditions: Array<{ kind: string; params: Record<string, unknown> }>;
  exitConditions: Array<{ kind: string; params: Record<string, unknown> }>;
  risk: {
    positionPct: number | null;
    stopLossPct: number | null;
    takeProfitPct: number | null;
    maxDrawdownPct: number | null;
  };
}

export interface StrategyLibraryItem {
  strategyId: string;
  createdAt: string;
  name: string;
  revision: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  version: number;
  status: StrategyLibraryStatus;
  auditRunId?: string | null;
  strategySnapshot: StrategySnapshot;
  strategyConfig: StrategyLibraryConfig;
}

export interface StrategyLibraryResult {
  strategies: StrategyLibraryItem[];
  source: WorkspaceSource;
  error?: string;
}

export interface StrategySaveParams extends TerminalResearchParams {
  strategy: StrategySnapshot;
  auditRunId?: string | null;
}

export interface StrategySaveResult {
  strategy?: StrategyLibraryItem;
  validation?: StrategyValidation;
  source: WorkspaceSource;
  error?: string;
}

export interface StrategyValidation {
  status: "ready" | "review" | "blocked";
  revision: string;
  gates: StrategyReadinessGate[];
  strategyConfig: StrategyLibraryConfig;
}

export interface StrategyValidationResult {
  validation?: StrategyValidation;
  source: WorkspaceSource;
  error?: string;
}

export interface MarketKlineBar {
  timestamp: string;
  timestampMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketKlineQuality {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
}

export interface MarketKlinesResult {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  bars: MarketKlineBar[];
  quality: MarketKlineQuality;
  source: WorkspaceSource;
  error?: string;
}

export type MarketDataReadinessState = "ready" | "stale" | "blocked";
export type MarketDataReadinessCacheState = "fresh" | "stale" | "empty";
export type MarketDataReadinessProviderHealthState = "healthy" | "degraded";

export interface MarketDataReadinessRepairAction {
  id: string;
  label: string;
  target: string;
  method: "GET" | "POST";
}

export interface MarketDataReadiness {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  state: MarketDataReadinessState;
  source: string;
  cacheState: MarketDataReadinessCacheState;
  barCount: number;
  latestBarAt: string | null;
  startBarAt: string | null;
  ageHours: number | null;
  providerHealthState: MarketDataReadinessProviderHealthState;
  blockingReasons: string[];
  repairActions: MarketDataReadinessRepairAction[];
  latestRefreshRunId: string | null;
  latestProviderErrorId: string | null;
  dataQualityWarnings: string[];
}

export interface MarketDataReadinessResult {
  readiness?: MarketDataReadiness;
  source: WorkspaceSource;
  error?: string;
}

export type MarketCalendarStatusValue = "open" | "closed" | "break" | "always_open" | "unknown";

export interface MarketCalendarStatus {
  market: Market;
  timezone: string;
  status: MarketCalendarStatusValue;
  isOpen: boolean;
  session: string;
  asOf: string;
  tradingDay: string;
  nextOpen: string | null;
  nextClose: string | null;
  detail: string;
  warnings: string[];
  source: string;
}

export interface MarketCalendarResult {
  calendar?: MarketCalendarStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface MarketSearchSuggestion {
  market: Market;
  symbol: string;
  name: string;
  source: string;
  exchange?: string | null;
  pinyin?: string | null;
  cache?: MarketSearchCacheCoverage;
}

export interface MarketSearchCacheCoverage {
  freshness: "fresh" | "stale" | "empty";
  rowCount: number;
  ageHours: number | null;
  startTimestamp: string | null;
  endTimestamp: string | null;
}

export interface MarketSearchResult {
  market: Market;
  query: string;
  timeframe?: ResearchTimeframe;
  results: MarketSearchSuggestion[];
  source: WorkspaceSource;
  error?: string;
}

export type PlatformSettingsStatusTone =
  | "ready"
  | "degraded"
  | "blocked"
  | "config_required"
  | "interface_only"
  | "paper_ready";

export interface PlatformSettingsDataSource {
  market: Market;
  label: string;
  quoteSource: string;
  klineSource: string;
  status: PlatformSettingsStatusTone;
  optionalKeyName: string | null;
  optionalKeyConfigured: boolean;
  note: string;
}

export interface PlatformSettingsCacheStatus {
  engine: "sqlite";
  path: string;
  exists: boolean;
  scope: string;
  rowCount: number;
  contextCount: number;
  latestTimestamp: string | null;
  freshnessSummary: PlatformSettingsCacheFreshnessSummary;
  contexts: PlatformSettingsCacheContext[];
}

export interface PlatformSettingsCacheFreshnessSummary {
  fresh: number;
  stale: number;
  empty: number;
}

export interface PlatformSettingsCacheContext {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  rowCount: number;
  startTimestamp: string | null;
  endTimestamp: string | null;
  freshness: "fresh" | "stale" | "empty";
  ageHours: number | null;
}

export interface PlatformSettingsMarketDataAdapter {
  id: string;
  market: Market;
  adapter: string;
  provider: string;
  status: PlatformSettingsStatusTone;
  route: "public_ohlcv" | string;
  capabilities: string[];
  timeframes: ResearchTimeframe[];
  requiresApiKey: boolean;
  requiresTradingKey: boolean;
  cacheScope: string;
  cacheDiagnostics: PlatformSettingsMarketDataAdapterCacheDiagnostics;
  externalTelemetry: PlatformSettingsMarketDataAdapterExternalTelemetry;
  note: string;
}

export interface PlatformSettingsMarketDataAdapterCacheDiagnostics {
  freshness: "fresh" | "stale" | "empty";
  contextCount: number;
  rowCount: number;
  latestTimestamp: string | null;
  freshnessSummary: PlatformSettingsCacheFreshnessSummary;
}

export interface PlatformSettingsMarketDataAdapterExternalTelemetry {
  status: "ok" | "degraded" | "blocked" | "unknown";
  dependency: string;
  dependencyAvailable: boolean;
  lastError: string | null;
  retryState: "idle" | "dependency_missing" | "provider_error" | "not_observed";
  checkedAt: string;
  installGuidance: PlatformSettingsMarketDataAdapterInstallGuidance;
  lastProviderError: PlatformSettingsMarketDataAdapterProviderError | null;
  providerHealth: PlatformSettingsMarketDataAdapterProviderHealth;
}

export interface PlatformSettingsMarketDataAdapterInstallGuidance {
  packageName: string;
  dockerBuildArg: string;
  packageInstallCommand: string;
  projectExtraInstallCommand: string;
  note: string;
}

export interface PlatformSettingsMarketDataAdapterProviderError {
  eventId: string;
  createdAt: string;
  adapterId: string;
  provider: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  source: string;
  context: string;
  category: PlatformSettingsMarketDataAdapterProviderErrorCategory;
  message: string;
}

export type PlatformSettingsMarketDataAdapterProviderErrorCategory =
  | "rate_limit"
  | "dependency"
  | "network"
  | "upstream"
  | "incomplete_data"
  | "unknown";

const platformSettingsMarketDataAdapterProviderErrorCategories = [
  "rate_limit",
  "dependency",
  "network",
  "upstream",
  "incomplete_data",
  "unknown"
] as const satisfies readonly PlatformSettingsMarketDataAdapterProviderErrorCategory[];

export type PlatformSettingsMarketDataAdapterProviderErrorCategorySummary = Record<
  PlatformSettingsMarketDataAdapterProviderErrorCategory,
  number
>;

export interface PlatformSettingsMarketDataAdapterProviderHealthWindow {
  errorCount: number;
  latestErrorAt: string | null;
  categorySummary: PlatformSettingsMarketDataAdapterProviderErrorCategorySummary;
  dominantCategory: PlatformSettingsMarketDataAdapterProviderErrorCategory | null;
}

export interface PlatformSettingsMarketDataAdapterProviderHealthWindowSummary {
  oneHour: PlatformSettingsMarketDataAdapterProviderHealthWindow;
  twentyFourHours: PlatformSettingsMarketDataAdapterProviderHealthWindow;
  sevenDays: PlatformSettingsMarketDataAdapterProviderHealthWindow;
}

export interface PlatformSettingsMarketDataAdapterProviderHealth {
  status: "ok" | "watch" | "cooldown" | "blocked";
  recentErrorCount: number;
  lastErrorAt: string | null;
  affectedSymbols: string[];
  affectedContexts: string[];
  categorySummary: PlatformSettingsMarketDataAdapterProviderErrorCategorySummary;
  dominantCategory: PlatformSettingsMarketDataAdapterProviderErrorCategory | null;
  windowSummary: PlatformSettingsMarketDataAdapterProviderHealthWindowSummary;
  retryAfterSeconds: number;
  reason: string;
}

export interface PlatformSettingsExecutionAdapter {
  id: string;
  market: Market | "multi";
  adapter: string;
  route: "paper" | "live";
  status: PlatformSettingsStatusTone;
  certification: string;
  liveTradingAllowed: boolean;
  note: string;
}

export interface PlatformSettingsStatus {
  schemaVersion: 1;
  generatedAt: string;
  dataSources: PlatformSettingsDataSource[];
  marketDataAdapters: PlatformSettingsMarketDataAdapter[];
  cache: PlatformSettingsCacheStatus;
  executionAdapters: PlatformSettingsExecutionAdapter[];
  safety: {
    liveTradingAllowed: boolean;
    requiredGates: string[];
  };
}

export interface PlatformSettingsResult {
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterLedgerState =
  | "paper_ready"
  | "live_ready"
  | "live_blocked"
  | "config_required"
  | "blocked"
  | string;

export interface ExecutionAdapterLedgerGate {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface ExecutionAdapterLedgerEvent {
  eventId: string;
  adapterId: string;
  timestamp: string;
  state: ExecutionAdapterLedgerState;
  label: string;
  actor: string;
  source: string;
  reason: string;
  liveTradingAllowed: boolean;
}

export interface ExecutionAdapterLedgerAdapter {
  id: string;
  market: Market | "multi";
  adapter: string;
  route: "paper" | "live";
  status: PlatformSettingsStatusTone;
  certification: string;
  currentState: ExecutionAdapterLedgerState;
  liveTradingAllowed: boolean;
  note: string;
  nextStep: string;
  gates: ExecutionAdapterLedgerGate[];
  events: ExecutionAdapterLedgerEvent[];
}

export interface ExecutionAdapterLedgerSummary {
  adapterCount: number;
  liveAdapterCount: number;
  certifiedLiveAdapters: number;
  paperReadyAdapters: number;
  blockedLiveAdapters: number;
  configRequiredAdapters: number;
  requiredGateCount: number;
  stateCounts?: Record<string, number>;
}

export interface ExecutionAdapterLedger {
  schemaVersion: 1;
  generatedAt: string;
  mode: "execution_adapter_state_ledger";
  liveTradingAllowed: boolean;
  requiredGates: string[];
  summary: ExecutionAdapterLedgerSummary;
  adapters: ExecutionAdapterLedgerAdapter[];
}

export interface ExecutionAdapterLedgerResult {
  adapterLedger?: ExecutionAdapterLedger;
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterCertificationStatus = "passed" | "blocked" | "failed" | "review";

export interface ExecutionAdapterCertificationCheck {
  id: string;
  label: string;
  status: ExecutionAdapterCertificationStatus;
  detail: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterCertificationSummary {
  checkCount: number;
  checkStatusCounts: Record<string, number>;
  passedChecks: number;
  blockedChecks: number;
  failedChecks: number;
  reviewChecks: number;
}

export interface ExecutionAdapterCertificationRun {
  schemaVersion: 1;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterCertificationStatus;
  operator: string;
  startedAt: string;
  completedAt: string | null;
  checks: ExecutionAdapterCertificationCheck[];
  metadata: Record<string, unknown>;
  summary: ExecutionAdapterCertificationSummary;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationRequest {
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  operator?: string;
  startedAt?: string;
  completedAt?: string;
  checks: ExecutionAdapterCertificationCheck[];
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterCertificationRecordResult {
  adapterCertification?: ExecutionAdapterCertificationRun;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterCertificationHistoryResult {
  adapterCertifications: ExecutionAdapterCertificationRun[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterCertificationApplyStatus = "blocked" | "ready_for_restart";
export type ExecutionAdapterCertificationApplyConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterCertificationApplyConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterCertificationApplyConfirmationStatus;
}

export interface ExecutionAdapterCertificationApplyResult {
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
  requiredConfirmations: ExecutionAdapterCertificationApplyConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationApplyRequest {
  certificationId: string;
  operator?: string;
  confirmations?: {
    secretReferenceStored?: boolean;
    controlledRestartWindowApproved?: boolean;
    operatorReviewedCertification?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterCertificationApplyRecordResult {
  certificationApply?: ExecutionAdapterCertificationApplyResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterCertificationApplyHistoryResult {
  certificationApplies: ExecutionAdapterCertificationApplyResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterControlledRestartEvidenceStatus = "blocked" | "evidence_recorded";
export type ExecutionAdapterControlledRestartEvidenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterControlledRestartEvidenceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterControlledRestartEvidenceConfirmationStatus;
}

export interface ExecutionAdapterControlledRestartEvidenceResult {
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
  requiredConfirmations: ExecutionAdapterControlledRestartEvidenceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterControlledRestartEvidenceRequest {
  applyId: string;
  operator?: string;
  confirmations?: {
    restartWindowExecuted?: boolean;
    rollbackPlanConfirmed?: boolean;
    postRestartValidationPassed?: boolean;
    operatorReviewedRestartLogs?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterControlledRestartEvidenceRecordResult {
  controlledRestartEvidence?: ExecutionAdapterControlledRestartEvidenceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterControlledRestartEvidenceHistoryResult {
  controlledRestartEvidence: ExecutionAdapterControlledRestartEvidenceResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRestartAcceptanceStatus = "blocked" | "acceptance_recorded";
export type ExecutionAdapterRestartAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRestartAcceptanceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRestartAcceptanceConfirmationStatus;
}

export interface ExecutionAdapterRestartAcceptanceResult {
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
  requiredConfirmations: ExecutionAdapterRestartAcceptanceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRestartAcceptanceRequest {
  evidenceId: string;
  operator?: string;
  confirmations?: {
    coreHealthChecked?: boolean;
    settingsReloadObserved?: boolean;
    paperRouteHandshakePassed?: boolean;
    emergencyStopArmed?: boolean;
    accountSyncDryRunPassed?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRestartAcceptanceRecordResult {
  restartAcceptance?: ExecutionAdapterRestartAcceptanceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRestartAcceptanceHistoryResult {
  restartAcceptances: ExecutionAdapterRestartAcceptanceResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSecretReferenceStatus = "blocked" | "reference_recorded";
export type ExecutionAdapterSecretReferenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretReferenceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSecretReferenceConfirmationStatus;
}

export interface ExecutionAdapterSecretReferenceResult {
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
  requiredConfirmations: ExecutionAdapterSecretReferenceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretReferenceRequest {
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  operator?: string;
  referenceName: string;
  backend: string;
  requiredEnvVars: string[];
  confirmations?: {
    referenceCreatedOutsideUi?: boolean;
    operatorVerifiedFingerprint?: boolean;
    rotationPlanDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSecretReferenceRecordResult {
  adapterSecretReference?: ExecutionAdapterSecretReferenceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSecretReferenceHistoryResult {
  adapterSecretReferences: ExecutionAdapterSecretReferenceResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSecretMaterializationStatus = "blocked" | "manifest_recorded";
export type ExecutionAdapterSecretMaterializationConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSecretMaterializationConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSecretMaterializationConfirmationStatus;
}

export interface ExecutionAdapterSecretMaterializationResult {
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
  requiredConfirmations: ExecutionAdapterSecretMaterializationConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretMaterializationRequest {
  adapterId: string;
  referenceId: string;
  operator?: string;
  manifestPath: string;
  confirmations?: {
    localSecretStoreWriteVerified?: boolean;
    noRawSecretInPayload?: boolean;
    envBindingPlanDocumented?: boolean;
    rollbackPlanDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSecretMaterializationRecordResult {
  adapterSecretMaterialization?: ExecutionAdapterSecretMaterializationResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSecretMaterializationHistoryResult {
  adapterSecretMaterializations: ExecutionAdapterSecretMaterializationResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSecretManifestValidationStatus = "blocked" | "validated";

export interface ExecutionAdapterSecretManifestValidationResult {
  schemaVersion: 1;
  validationId: string;
  materializationId: string;
  referenceId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSecretManifestValidationStatus;
  operator: string;
  recordedAt: string;
  validationMode: string;
  referenceName: string;
  backend: string;
  manifestPath: string;
  fingerprint: string;
  requiredEnvVars: string[];
  coveredEnvVars: string[];
  blockedReasons: string[];
  manifestSummary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSecretManifestValidationRequest {
  adapterId: string;
  materializationId: string;
  operator?: string;
  manifestPath?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSecretManifestValidationRecordResult {
  adapterSecretManifestValidation?: ExecutionAdapterSecretManifestValidationResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSecretManifestValidationHistoryResult {
  adapterSecretManifestValidations: ExecutionAdapterSecretManifestValidationResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterEnvironmentBindingStatus = "blocked" | "binding_recorded";
export type ExecutionAdapterEnvironmentBindingConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterEnvironmentBindingConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterEnvironmentBindingConfirmationStatus;
}

export interface ExecutionAdapterEnvironmentBindingResult {
  schemaVersion: 1;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterEnvironmentBindingStatus;
  operator: string;
  recordedAt: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterEnvironmentBindingConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterEnvironmentBindingRequest {
  adapterId: string;
  materializationId?: string;
  manifestValidationId?: string;
  operator?: string;
  bindingMode?: string;
  confirmations?: {
    runtimeEnvMappingVerified?: boolean;
    configReloadPlanDocumented?: boolean;
    noRawSecretInPayload?: boolean;
    rollbackSnapshotRecorded?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterEnvironmentBindingRecordResult {
  adapterEnvironmentBinding?: ExecutionAdapterEnvironmentBindingResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterEnvironmentBindingHistoryResult {
  adapterEnvironmentBindings: ExecutionAdapterEnvironmentBindingResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRuntimeReloadPlanStatus = "blocked" | "plan_recorded";
export type ExecutionAdapterRuntimeReloadPlanConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadPlanConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRuntimeReloadPlanConfirmationStatus;
}

export interface ExecutionAdapterRuntimeReloadPlanResult {
  schemaVersion: 1;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRuntimeReloadPlanStatus;
  operator: string;
  recordedAt: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterRuntimeReloadPlanConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadPlanRequest {
  adapterId: string;
  bindingId: string;
  operator?: string;
  reloadMode?: string;
  maintenanceWindowId: string;
  confirmations?: {
    maintenanceWindowApproved?: boolean;
    healthBaselineCaptured?: boolean;
    configDiffReviewed?: boolean;
    postReloadSmokePlanDocumented?: boolean;
    rollbackOwnerAssigned?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRuntimeReloadPlanRecordResult {
  adapterRuntimeReloadPlan?: ExecutionAdapterRuntimeReloadPlanResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRuntimeReloadPlanHistoryResult {
  adapterRuntimeReloadPlans: ExecutionAdapterRuntimeReloadPlanResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRuntimeReloadExecutionStatus = "blocked" | "execution_recorded";
export type ExecutionAdapterRuntimeReloadExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRuntimeReloadExecutionConfirmationStatus;
}

export interface ExecutionAdapterRuntimeReloadExecutionResult {
  schemaVersion: 1;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRuntimeReloadExecutionStatus;
  operator: string;
  recordedAt: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterRuntimeReloadExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadExecutionRequest {
  adapterId: string;
  planId: string;
  operator?: string;
  executionMode?: string;
  confirmations?: {
    preReloadHealthVerified?: boolean;
    reloadActionRecorded?: boolean;
    postReloadSmokePassed?: boolean;
    rollbackReadinessConfirmed?: boolean;
    operatorConfirmedLiveBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRuntimeReloadExecutionRecordResult {
  adapterRuntimeReloadExecution?: ExecutionAdapterRuntimeReloadExecutionResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRuntimeReloadExecutionHistoryResult {
  adapterRuntimeReloadExecutions: ExecutionAdapterRuntimeReloadExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRuntimeReloadAcceptanceStatus = "blocked" | "acceptance_recorded";
export type ExecutionAdapterRuntimeReloadAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRuntimeReloadAcceptanceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRuntimeReloadAcceptanceConfirmationStatus;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceResult {
  schemaVersion: 1;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRuntimeReloadAcceptanceStatus;
  operator: string;
  recordedAt: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterRuntimeReloadAcceptanceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceRequest {
  adapterId: string;
  executionId: string;
  operator?: string;
  acceptanceMode?: string;
  confirmations?: {
    executionEvidenceReviewed?: boolean;
    postReloadHealthVerified?: boolean;
    adapterHandshakeVerified?: boolean;
    killSwitchStillEnabled?: boolean;
    operatorConfirmedLiveBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceRecordResult {
  adapterRuntimeReloadAcceptance?: ExecutionAdapterRuntimeReloadAcceptanceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRuntimeReloadAcceptanceHistoryResult {
  adapterRuntimeReloadAcceptances: ExecutionAdapterRuntimeReloadAcceptanceResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterOrchestrationDryRunStatus = "blocked" | "dry_run_recorded";
export type ExecutionAdapterOrchestrationDryRunConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterOrchestrationDryRunConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterOrchestrationDryRunConfirmationStatus;
}

export interface ExecutionAdapterOrchestrationDryRunResult {
  schemaVersion: 1;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterOrchestrationDryRunStatus;
  operator: string;
  recordedAt: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterOrchestrationDryRunConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOrchestrationDryRunRequest {
  adapterId: string;
  acceptanceId: string;
  operator?: string;
  orchestrationMode?: string;
  confirmations?: {
    acceptedChainReviewed?: boolean;
    sandboxHandshakeDryRunPassed?: boolean;
    orderSchemaDryRunPassed?: boolean;
    accountSyncDryRunPassed?: boolean;
    operatorConfirmedNoLiveOrders?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterOrchestrationDryRunRecordResult {
  adapterOrchestrationDryRun?: ExecutionAdapterOrchestrationDryRunResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterOrchestrationDryRunHistoryResult {
  adapterOrchestrationDryRuns: ExecutionAdapterOrchestrationDryRunResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterOrchestrationExecutionStatus = "blocked" | "execution_recorded";
export type ExecutionAdapterOrchestrationExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterOrchestrationExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterOrchestrationExecutionConfirmationStatus;
}

export interface ExecutionAdapterOrchestrationExecutionResult {
  schemaVersion: 1;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterOrchestrationExecutionStatus;
  operator: string;
  recordedAt: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterOrchestrationExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOrchestrationExecutionRequest {
  adapterId: string;
  dryRunId: string;
  operator?: string;
  orchestrationExecutionMode?: string;
  confirmations?: {
    dryRunEvidenceReviewed?: boolean;
    sandboxRouteLocked?: boolean;
    killSwitchArmed?: boolean;
    idempotencyKeyRecorded?: boolean;
    operatorConfirmedNoCapital?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterOrchestrationExecutionRecordResult {
  adapterOrchestrationExecution?: ExecutionAdapterOrchestrationExecutionResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterOrchestrationExecutionHistoryResult {
  adapterOrchestrationExecutions: ExecutionAdapterOrchestrationExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterHumanConfirmationStatus = "blocked" | "confirmation_recorded";
export type ExecutionAdapterHumanConfirmationConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterHumanConfirmationConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterHumanConfirmationConfirmationStatus;
}

export interface ExecutionAdapterHumanConfirmationResult {
  schemaVersion: 1;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterHumanConfirmationStatus;
  operator: string;
  recordedAt: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterHumanConfirmationConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterHumanConfirmationRequest {
  adapterId: string;
  orchestrationExecutionId: string;
  operator?: string;
  confirmationMode?: string;
  confirmations?: {
    orchestrationExecutionReviewed?: boolean;
    riskApprovalStillValid?: boolean;
    paperExecutionReviewed?: boolean;
    killSwitchReady?: boolean;
    operatorConfirmedFinalBoundary?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterHumanConfirmationRecordResult {
  adapterHumanConfirmation?: ExecutionAdapterHumanConfirmationResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterHumanConfirmationHistoryResult {
  adapterHumanConfirmations: ExecutionAdapterHumanConfirmationResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSandboxProbePlanStatus = "blocked" | "probe_plan_recorded";
export type ExecutionAdapterSandboxProbePlanConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbePlanConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxProbePlanConfirmationStatus;
}

export interface ExecutionAdapterSandboxProbePlanResult {
  schemaVersion: 1;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSandboxProbePlanStatus;
  operator: string;
  recordedAt: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterSandboxProbePlanConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbePlanRequest {
  adapterId: string;
  humanConfirmationId: string;
  operator?: string;
  probeMode?: string;
  confirmations?: {
    humanConfirmationReviewed?: boolean;
    testnetEndpointLocked?: boolean;
    credentialsAreSandboxOnly?: boolean;
    orderRoutingDisabled?: boolean;
    probeLimitsDocumented?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxProbePlanRecordResult {
  adapterSandboxProbePlan?: ExecutionAdapterSandboxProbePlanResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxProbePlanHistoryResult {
  adapterSandboxProbePlans: ExecutionAdapterSandboxProbePlanResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSandboxProbeExecutionStatus = "blocked" | "probe_execution_recorded";
export type ExecutionAdapterSandboxProbeExecutionConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbeExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxProbeExecutionConfirmationStatus;
}

export interface ExecutionAdapterSandboxProbeExecutionResult {
  schemaVersion: 1;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSandboxProbeExecutionStatus;
  operator: string;
  recordedAt: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterSandboxProbeExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbeExecutionRequest {
  adapterId: string;
  sandboxProbePlanId: string;
  operator?: string;
  probeExecutionMode?: string;
  confirmations?: {
    probePlanReviewed?: boolean;
    readonlyHandshakeCaptured?: boolean;
    accountSnapshotRedacted?: boolean;
    orderSchemaValidated?: boolean;
    operatorConfirmedNoOrdersSubmitted?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxProbeExecutionRecordResult {
  adapterSandboxProbeExecution?: ExecutionAdapterSandboxProbeExecutionResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxProbeExecutionHistoryResult {
  adapterSandboxProbeExecutions: ExecutionAdapterSandboxProbeExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSandboxProbeReviewStatus = "blocked" | "probe_review_recorded";
export type ExecutionAdapterSandboxProbeReviewConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxProbeReviewConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxProbeReviewConfirmationStatus;
}

export interface ExecutionAdapterSandboxProbeReviewResult {
  schemaVersion: 1;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSandboxProbeReviewStatus;
  operator: string;
  recordedAt: string;
  reviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterSandboxProbeReviewConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxProbeReviewRequest {
  adapterId: string;
  sandboxProbeExecutionId: string;
  operator?: string;
  reviewMode?: string;
  confirmations?: {
    probeExecutionReviewed?: boolean;
    readonlyEvidenceMatchesPlan?: boolean;
    redactedSnapshotArchived?: boolean;
    orderSchemaRiskReviewed?: boolean;
    productionRouteStillBlocked?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxProbeReviewRecordResult {
  adapterSandboxProbeReview?: ExecutionAdapterSandboxProbeReviewResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxProbeReviewHistoryResult {
  adapterSandboxProbeReviews: ExecutionAdapterSandboxProbeReviewResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterProductionRouteReviewStatus = "blocked" | "route_review_recorded";
export type ExecutionAdapterProductionRouteReviewConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterProductionRouteReviewConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterProductionRouteReviewConfirmationStatus;
}

export interface ExecutionAdapterProductionRouteReviewResult {
  schemaVersion: 1;
  productionRouteReviewId: string;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterProductionRouteReviewStatus;
  operator: string;
  recordedAt: string;
  reviewMode: string;
  sandboxReviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  requiredConfirmations: ExecutionAdapterProductionRouteReviewConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterProductionRouteReviewRequest {
  adapterId: string;
  sandboxProbeReviewId: string;
  operator?: string;
  reviewMode?: string;
  confirmations?: {
    sandboxProbeReviewAccepted?: boolean;
    killSwitchPolicyReviewed?: boolean;
    orderRoutingDisabledVerified?: boolean;
    positionLimitPolicyReviewed?: boolean;
    rollbackOwnerRecorded?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterProductionRouteReviewRecordResult {
  adapterProductionRouteReview?: ExecutionAdapterProductionRouteReviewResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterProductionRouteReviewHistoryResult {
  adapterProductionRouteReviews: ExecutionAdapterProductionRouteReviewResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterSandboxOrderSchemaDryRunStatus = "blocked" | "schema_dry_run_recorded";
export type ExecutionAdapterSandboxOrderSchemaDryRunConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterSandboxOrderSchemaDryRunConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterSandboxOrderSchemaDryRunConfirmationStatus;
}

export interface ExecutionAdapterSandboxOrderIntent {
  symbol: string;
  side: "buy" | "sell";
  type: string;
  quantity: number;
  price?: number;
  timeInForce?: string;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunResult {
  schemaVersion: 1;
  sandboxOrderSchemaDryRunId: string;
  productionRouteReviewId: string;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterSandboxOrderSchemaDryRunStatus;
  operator: string;
  recordedAt: string;
  dryRunMode: string;
  reviewMode: string;
  sandboxReviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  orderSubmitted: boolean;
  requiredConfirmations: ExecutionAdapterSandboxOrderSchemaDryRunConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunRequest {
  adapterId: string;
  productionRouteReviewId: string;
  operator?: string;
  dryRunMode?: string;
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  confirmations?: {
    productionRouteReviewAccepted?: boolean;
    healthProbeBound?: boolean;
    orderIntentSchemaValidated?: boolean;
    sandboxEndpointStillLocked?: boolean;
    operatorConfirmedNoOrderSubmitted?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunRecordResult {
  adapterSandboxOrderSchemaDryRun?: ExecutionAdapterSandboxOrderSchemaDryRunResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterSandboxOrderSchemaDryRunHistoryResult {
  adapterSandboxOrderSchemaDryRuns: ExecutionAdapterSandboxOrderSchemaDryRunResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterPaperOrderLifecycleStatus = "blocked" | "lifecycle_recorded";
export type ExecutionAdapterPaperOrderLifecycleConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterPaperOrderLifecycleStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterPaperOrderLifecycleConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterPaperOrderLifecycleConfirmationStatus;
}

export interface ExecutionAdapterPaperOrderLifecycleStep {
  id: string;
  label: string;
  status: ExecutionAdapterPaperOrderLifecycleStepStatus;
}

export interface ExecutionAdapterPaperOrderLifecycleResult {
  schemaVersion: 1;
  paperOrderLifecycleId: string;
  sandboxOrderSchemaDryRunId: string;
  productionRouteReviewId: string;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterPaperOrderLifecycleStatus;
  operator: string;
  recordedAt: string;
  lifecycleMode: string;
  dryRunMode: string;
  reviewMode: string;
  sandboxReviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  requiredConfirmations: ExecutionAdapterPaperOrderLifecycleConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperOrderLifecycleRequest {
  adapterId: string;
  sandboxOrderSchemaDryRunId: string;
  operator?: string;
  lifecycleMode?: string;
  confirmations?: {
    schemaDryRunAccepted?: boolean;
    paperRouterLocked?: boolean;
    riskLimitsBound?: boolean;
    simulatedLifecycleGenerated?: boolean;
    operatorConfirmedNoLiveOrderSubmitted?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterPaperOrderLifecycleRecordResult {
  adapterPaperOrderLifecycle?: ExecutionAdapterPaperOrderLifecycleResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterPaperOrderLifecycleHistoryResult {
  adapterPaperOrderLifecycles: ExecutionAdapterPaperOrderLifecycleResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterPaperRouteRunbookStatus = "blocked" | "runbook_recorded";
export type ExecutionAdapterPaperRouteRunbookConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterPaperRouteRunbookStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterPaperRouteRunbookConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterPaperRouteRunbookConfirmationStatus;
}

export interface ExecutionAdapterPaperRouteRunbookStep {
  id: string;
  label: string;
  status: ExecutionAdapterPaperRouteRunbookStepStatus;
}

export interface ExecutionAdapterPaperRouteRunbookResult {
  schemaVersion: 1;
  paperRouteRunbookId: string;
  paperOrderLifecycleId: string;
  sandboxOrderSchemaDryRunId: string;
  productionRouteReviewId: string;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterPaperRouteRunbookStatus;
  operator: string;
  recordedAt: string;
  runbookMode: string;
  lifecycleMode: string;
  dryRunMode: string;
  reviewMode: string;
  sandboxReviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  runbookSteps: ExecutionAdapterPaperRouteRunbookStep[];
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: ExecutionAdapterPaperRouteRunbookConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperRouteRunbookRequest {
  adapterId: string;
  paperOrderLifecycleId: string;
  operator?: string;
  runbookMode?: string;
  confirmations?: {
    paperLifecycleAccepted?: boolean;
    paperAccountSnapshotCaptured?: boolean;
    riskControlsVerified?: boolean;
    replayPlanRecorded?: boolean;
    operatorConfirmedNoLiveRouting?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterPaperRouteRunbookRecordResult {
  adapterPaperRouteRunbook?: ExecutionAdapterPaperRouteRunbookResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterPaperRouteRunbookHistoryResult {
  adapterPaperRouteRunbooks: ExecutionAdapterPaperRouteRunbookResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterOpsStateStatus = "blocked" | "ops_state_recorded";
export type ExecutionAdapterOpsStateConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterOpsStateStepStatus = "blocked" | "recorded";

export interface ExecutionAdapterOpsStateConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterOpsStateConfirmationStatus;
}

export interface ExecutionAdapterOpsStateStep {
  id: string;
  label: string;
  status: ExecutionAdapterOpsStateStepStatus;
}

export interface ExecutionAdapterOpsStateResult {
  schemaVersion: 1;
  adapterOpsStateId: string;
  paperRouteRunbookId: string;
  paperOrderLifecycleId: string;
  sandboxOrderSchemaDryRunId: string;
  productionRouteReviewId: string;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterOpsStateStatus;
  operator: string;
  recordedAt: string;
  opsMode: string;
  runbookMode: string;
  lifecycleMode: string;
  dryRunMode: string;
  reviewMode: string;
  sandboxReviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  runbookSteps: ExecutionAdapterPaperRouteRunbookStep[];
  opsSteps: ExecutionAdapterOpsStateStep[];
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: ExecutionAdapterOpsStateConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterOpsStateRequest {
  adapterId: string;
  paperRouteRunbookId: string;
  operator?: string;
  opsMode?: string;
  confirmations?: {
    paperRouteRunbookAccepted?: boolean;
    monitoringChannelReady?: boolean;
    killSwitchDrillRecorded?: boolean;
    paperAccountReconciled?: boolean;
    operatorConfirmedLiveTradingDisabled?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterOpsStateRecordResult {
  adapterOpsState?: ExecutionAdapterOpsStateResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterOpsStateHistoryResult {
  adapterOpsStates: ExecutionAdapterOpsStateResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterPaperExecutionStatus = "blocked" | "paper_execution_recorded";
export type ExecutionAdapterPaperExecutionConfirmationStatus = "confirmed" | "missing";
export type ExecutionAdapterPaperExecutionStepStatus = "blocked" | "recorded";
export type ExecutionAdapterPaperExecutionFillStatus = "blocked" | "filled";

export interface ExecutionAdapterPaperExecutionConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterPaperExecutionConfirmationStatus;
}

export interface ExecutionAdapterPaperExecutionStep {
  id: string;
  label: string;
  status: ExecutionAdapterPaperExecutionStepStatus;
}

export interface ExecutionAdapterPaperExecutionFill {
  fillId: string;
  status: ExecutionAdapterPaperExecutionFillStatus;
  symbol: string;
  side: "buy" | "sell";
  type: string;
  quantity: number;
  price?: number;
  timeInForce?: string;
  source: string;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
}

export interface ExecutionAdapterPaperExecutionResult {
  schemaVersion: 1;
  adapterPaperExecutionId: string;
  adapterOpsStateId: string;
  paperRouteRunbookId: string;
  paperOrderLifecycleId: string;
  sandboxOrderSchemaDryRunId: string;
  productionRouteReviewId: string;
  sandboxProbeReviewId: string;
  sandboxProbeExecutionId: string;
  sandboxProbePlanId: string;
  humanConfirmationId: string;
  orchestrationExecutionId: string;
  dryRunId: string;
  acceptanceId: string;
  executionId: string;
  planId: string;
  bindingId: string;
  materializationId: string;
  manifestValidationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterPaperExecutionStatus;
  operator: string;
  recordedAt: string;
  paperExecutionMode: string;
  opsMode: string;
  runbookMode: string;
  lifecycleMode: string;
  dryRunMode: string;
  reviewMode: string;
  sandboxReviewMode: string;
  probeExecutionMode: string;
  probeMode: string;
  confirmationMode: string;
  orchestrationExecutionMode: string;
  orchestrationMode: string;
  acceptanceMode: string;
  executionMode: string;
  reloadMode: string;
  maintenanceWindowId: string;
  bindingMode: string;
  manifestPath: string;
  requiredEnvVars: string[];
  orderIntent: ExecutionAdapterSandboxOrderIntent;
  lifecycleSteps: ExecutionAdapterPaperOrderLifecycleStep[];
  runbookSteps: ExecutionAdapterPaperRouteRunbookStep[];
  opsSteps: ExecutionAdapterOpsStateStep[];
  paperExecutionSteps: ExecutionAdapterPaperExecutionStep[];
  simulatedFill: ExecutionAdapterPaperExecutionFill;
  paperFillRecorded: boolean;
  orderSubmitted: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  requiredConfirmations: ExecutionAdapterPaperExecutionConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterPaperExecutionRequest {
  adapterId: string;
  adapterOpsStateId: string;
  operator?: string;
  paperExecutionMode?: string;
  confirmations?: {
    opsStateAccepted?: boolean;
    paperAccountSynced?: boolean;
    riskBudgetBound?: boolean;
    simulatedFillGenerated?: boolean;
    operatorConfirmedNoLiveRouting?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterPaperExecutionRecordResult {
  adapterPaperExecution?: ExecutionAdapterPaperExecutionResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterPaperExecutionHistoryResult {
  adapterPaperExecutions: ExecutionAdapterPaperExecutionResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterHealthProbeStatus = "ready" | "review" | "blocked";
export type ExecutionAdapterHealthProbeCheckStatus = "passed" | "review" | "blocked" | "skipped";

export interface ExecutionAdapterHealthProbeCheck {
  id: string;
  label: string;
  status: ExecutionAdapterHealthProbeCheckStatus;
  detail: string;
  latencyMs: number | null;
}

export interface ExecutionAdapterHealthProbeCredentials {
  apiKeyConfigured: boolean;
  apiKeySource: string | null;
  secretConfigured: boolean;
  secretSource: string | null;
  passwordConfigured: boolean;
  passwordSource: string | null;
}

export interface ExecutionAdapterHealthProbeRouteReview {
  productionRouteReviewId: string;
  status: "route_review_recorded";
  adapterId: string;
  market: string;
  route: "live";
  maintenanceWindowId: string;
  requiredEnvVars: string[];
  liveTradingAllowed: false;
  paperOnly: true;
}

export interface ExecutionAdapterHealthProbeResult {
  schemaVersion: 1;
  probeId: string;
  adapterId: string;
  provider: "ccxt";
  exchangeId: string;
  mode: "sandbox";
  status: ExecutionAdapterHealthProbeStatus;
  generatedAt: string;
  checks: ExecutionAdapterHealthProbeCheck[];
  capabilities: Record<string, boolean>;
  credentials: ExecutionAdapterHealthProbeCredentials;
  marketCount: number;
  exchangeStatus: string | null;
  serverTimeMs: number | null;
  accountSyncState: string;
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  productionRouteReviewId?: string;
  productionRouteReviewStatus?: "route_review_recorded";
  routeReview?: ExecutionAdapterHealthProbeRouteReview;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  orderRoutingEnabled: boolean;
}

export interface ExecutionAdapterHealthProbeLoadResult {
  adapterHealthProbe?: ExecutionAdapterHealthProbeResult;
  source: WorkspaceSource;
  error?: string;
}

export type GoldenPathOverallStatus = "ready" | "review" | "blocked";
export type GoldenPathStepStatus = "passed" | "review" | "blocked";
export type GoldenPathWorkspaceStatus = "ready" | "needs_run" | "blocked";

export interface GoldenPathNextAction {
  id: string;
  label: string;
  targetWorkspace: string;
  reason: string;
}

export interface GoldenPathStep {
  id: string;
  label: string;
  status: GoldenPathStepStatus;
  passed: boolean;
  detail: string;
  actionId: string | null;
}

export interface GoldenPathWorkspace {
  id: string;
  label: string;
  status: GoldenPathWorkspaceStatus;
  current: boolean;
  stepIds: string[];
  reason: string;
  actionId: string | null;
}

export interface GoldenPathSummary {
  totalSteps: number;
  passedSteps: number;
  reviewSteps: number;
  blockedSteps: number;
  currentStepLabel: string | null;
  nextActionId: string | null;
  liveTradingAllowed: boolean;
}

export interface GoldenPathRunbookItem {
  stepId: string;
  label: string;
  workspaceId: string;
  status: GoldenPathStepStatus;
  current: boolean;
  passed: boolean;
  detail: string;
  blocker: string | null;
  actionId: string | null;
  actionLabel: string | null;
  targetWorkspace: string | null;
}

export interface GoldenPathStatus {
  schemaVersion: 1;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  status: GoldenPathOverallStatus;
  currentStepId: string | null;
  latestRunId: string | null;
  nextAction: GoldenPathNextAction | null;
  summary: GoldenPathSummary;
  runbook: GoldenPathRunbookItem[];
  workspaces: GoldenPathWorkspace[];
  steps: GoldenPathStep[];
}

export interface GoldenPathStatusResult {
  goldenPath?: GoldenPathStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface CacheRefreshSummary {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  requestedLimit: number;
  upsertedRows: number;
  overrideAuditEventId?: string | null;
  quality: MarketKlineQuality;
}

export interface CacheRefreshResult {
  refresh?: CacheRefreshSummary;
  watchlistRefresh?: CacheWatchlistRefreshRun;
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export type CacheWatchlistRefreshItemStatus = "refreshed" | "skipped" | "failed";

export interface CacheWatchlistRefreshItem extends CacheRefreshSummary {
  name: string;
  status: CacheWatchlistRefreshItemStatus;
  error: string | null;
}

export interface CacheWatchlistRefreshRunSummary {
  totalSymbols: number;
  refreshed: number;
  skipped: number;
  failed: number;
  upsertedRows: number;
}

export interface CacheWatchlistRefreshRun {
  runId: string;
  createdAt: string;
  timeframe: ResearchTimeframe;
  requestedLimit: number;
  overrideAuditEventId?: string | null;
  summary: CacheWatchlistRefreshRunSummary;
  items: CacheWatchlistRefreshItem[];
}

export interface CacheWatchlistRefreshParams {
  timeframe: ResearchTimeframe;
  limit?: number;
  overrideAuditEventId?: string | null;
  watchlist: TerminalWorkspace["watchlist"];
}

export interface CacheWatchlistRefreshResult {
  watchlistRefresh?: CacheWatchlistRefreshRun;
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface CacheWatchlistRefreshHistoryResult {
  watchlistRefreshes: CacheWatchlistRefreshRun[];
  source: WorkspaceSource;
  error?: string;
}

export interface CacheBatchRefreshResult {
  refreshes: CacheRefreshSummary[];
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  failedCount: number;
  error?: string;
}

export interface PortfolioBacktestLegRequest {
  runId: string;
  targetWeight: number;
}

export interface PortfolioBacktestRequest {
  name: string;
  initialCash: number;
  legs: PortfolioBacktestLegRequest[];
}

export interface PortfolioBacktestMetrics {
  totalReturnPct: number;
  annualReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  tradeCount: number;
}

export interface PortfolioBacktestEquityPoint {
  timestamp: string;
  equity: number;
}

export interface PortfolioAllocationEvent {
  timestamp: string;
  eventType: "allocate" | "cash_buffer";
  symbol: string;
  sourceRunId: string | null;
  targetWeight: number;
  notionalValue: number;
  reason: string;
}

export interface PortfolioRebalanceEvent {
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
}

export interface PortfolioTradeReviewEvent {
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
}

export interface PortfolioPreTradeRiskCheck {
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
}

export interface PortfolioPaperOrderEvent {
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
}

export interface PortfolioPaperOrderSummary {
  totalOrders: number;
  totalNotionalValue: number;
  statusCounts: Record<string, number>;
  riskStatusCounts: Record<string, number>;
}

export interface PortfolioPaperOrderBatch {
  batchId: string;
  baseRunId: string;
  portfolioName: string;
  createdAt: string;
  mode: "portfolio_paper_order_review";
  source: string;
  summary: PortfolioPaperOrderSummary;
  orders: PortfolioPaperOrderEvent[];
}

export interface PortfolioPaperOrderLifecycleEvent {
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

export interface PortfolioPaperOrderBatchRequest {
  baseRunId: string;
  portfolioName: string;
  orders: PortfolioPaperOrderEvent[];
  source?: string;
}

export interface PortfolioPaperOrderRecordResult {
  batch?: PortfolioPaperOrderBatch;
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderHistoryResult {
  batches: PortfolioPaperOrderBatch[];
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderApproval {
  approvalId: string;
  baseRunId: string;
  batchId: string;
  orderId: string;
  reviewedAt: string;
  approved: boolean;
  reviewer: string;
  reason: string;
}

export interface PortfolioPaperOrderApprovalRequest {
  baseRunId: string;
  batchId: string;
  orderId: string;
  approved: boolean;
  reviewer: string;
  reason: string;
  reviewedAt?: string;
}

export interface PortfolioPaperOrderApprovalRecordResult {
  approval?: PortfolioPaperOrderApproval;
  existingApproval?: PortfolioPaperOrderApproval;
  existingSimulation?: PortfolioPaperOrderSimulation;
  approvals: PortfolioPaperOrderApproval[];
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderApprovalHistoryResult {
  approvals: PortfolioPaperOrderApproval[];
  lifecycle: PortfolioPaperOrderLifecycleEvent[];
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderSimulation {
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
  routeRisk?: PortfolioPaperOrderSimulationRouteRisk;
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderSimulationRouteRisk {
  status?: "passed" | "blocked" | string;
  cashAfter?: number;
  blockedReasons?: string[];
  [key: string]: unknown;
}

export interface PortfolioPaperOrderAdapterEvidenceRequest {
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
}

export interface PortfolioPaperOrderSimulationRequest {
  baseRunId: string;
  batchId: string;
  orderId: string;
  simulatedAt?: string;
  routeRisk?: {
    initialCash?: number;
    minCashAfter?: number;
    maxSymbolNotional?: number;
    maxBatchNotional?: number;
  };
  adapterPaperExecutionId?: string;
  adapterManifestValidationId?: string;
  adapterPaperExecutionEvidence?: Record<string, unknown>;
}

export interface PortfolioPaperOrderBatchSimulationRequest {
  baseRunId: string;
  batchId: string;
  orderIds?: string[];
  simulatedAt?: string;
  routeRisk?: {
    initialCash?: number;
    minCashAfter?: number;
    maxSymbolNotional?: number;
    maxBatchNotional?: number;
  };
  adapterPaperExecutionEvidenceByOrderId?: Record<string, PortfolioPaperOrderAdapterEvidenceRequest>;
}

export interface PortfolioPaperOrderBatchSimulationIssue {
  orderId: string;
  symbol?: string;
  side?: string;
  reason?: string;
  detail?: string;
}

export interface PortfolioPaperOrderBatchSimulation {
  schemaVersion: 1;
  mode: "portfolio_paper_order_batch_simulation";
  status: "filled" | "partial" | "blocked" | "skipped" | string;
  baseRunId: string;
  batchId: string;
  requestedCount: number;
  filledCount: number;
  blockedCount: number;
  skippedCount: number;
  filledOrderIds: string[];
  blockedOrders: PortfolioPaperOrderBatchSimulationIssue[];
  skippedOrders: PortfolioPaperOrderBatchSimulationIssue[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderSimulationRecordResult {
  simulation?: PortfolioPaperOrderSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderBatchSimulationRecordResult {
  batchSimulation?: PortfolioPaperOrderBatchSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  createdSimulations: PortfolioPaperOrderSimulation[];
  lifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvents: AuditEventRecord[];
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderSimulationHistoryResult {
  simulations: PortfolioPaperOrderSimulation[];
  lifecycle: PortfolioPaperOrderLifecycleEvent[];
  source: WorkspaceSource;
  error?: string;
}

export type PortfolioPaperOrderStateHistoryState =
  | "created"
  | "awaiting_operator_review"
  | "operator_approved"
  | "operator_rejected"
  | "ready_for_simulation"
  | "simulation_filled"
  | "simulation_recorded"
  | "live_blocked"
  | "risk_rejected"
  | "risk_review"
  | "invalid_order"
  | "skipped"
  | string;

export interface PortfolioPaperOrderStateHistoryEvent {
  eventId: string;
  batchId: string;
  baseRunId: string;
  orderId: string;
  timestamp: string;
  state: PortfolioPaperOrderStateHistoryState;
  label: string;
  actor: string;
  source: string;
  reason: string;
  metadata?: Record<string, unknown>;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistoryOrder {
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
  currentState: PortfolioPaperOrderStateHistoryState;
  currentStateLabel: string;
  events: PortfolioPaperOrderStateHistoryEvent[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistorySummary {
  orderCount: number;
  eventCount: number;
  approvedOrders: number;
  rejectedOrders: number;
  filledOrders: number;
  liveBlockedEvents: number;
  stateCounts: Record<string, number>;
}

export interface PortfolioPaperOrderStateHistory {
  schemaVersion: 1;
  baseRunId: string;
  batchId: string;
  portfolioName: string;
  generatedAt: string;
  mode: "portfolio_paper_order_state_history";
  summary: PortfolioPaperOrderStateHistorySummary;
  orders: PortfolioPaperOrderStateHistoryOrder[];
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderStateHistoryResult {
  stateHistory?: PortfolioPaperOrderStateHistory;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioPaperOrderReplayPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  lastPrice: number;
  marketValue: number;
  unrealizedPnl: number;
}

export interface PortfolioPaperOrderReplayOrder {
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

export interface PortfolioPaperOrderReplaySummary {
  filledOrders: number;
  buyNotional: number;
  sellNotional: number;
  netNotional: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positionCount: number;
  warnings: string[];
}

export interface PortfolioPaperOrderReplay {
  schemaVersion: 1;
  baseRunId: string;
  generatedAt: string;
  mode: "portfolio_paper_order_replay";
  initialCash: number;
  account: PaperExecutionAccount;
  positions: PortfolioPaperOrderReplayPosition[];
  orders: PortfolioPaperOrderReplayOrder[];
  summary: PortfolioPaperOrderReplaySummary;
  paperOnly: boolean;
  liveExecutionBlocked: boolean;
}

export interface PortfolioPaperOrderReplayResult {
  replay?: PortfolioPaperOrderReplay;
  source: WorkspaceSource;
  error?: string;
}

export interface PortfolioBacktestLeg {
  symbol: string;
  targetWeight: number;
  startingValue: number;
  endingValue: number;
  contributionValue: number;
  contributionReturnPct: number;
  maxDrawdownPct: number;
  tradeCount: number;
  dataQuality: MarketKlineQuality;
}

export interface PortfolioCorrelationPair {
  leftSymbol: string;
  rightSymbol: string;
  correlation: number;
}

export interface PortfolioCovarianceRiskContribution {
  symbol: string;
  sourceRunId: string | null;
  targetWeight: number;
  annualizedVolatilityPct: number;
  marginalContributionPct: number;
  contributionPct: number;
}

export interface PortfolioCovarianceRisk {
  method: "population_covariance";
  observations: number;
  periodVolatilityPct: number;
  annualizedVolatilityPct: number;
  contributions: PortfolioCovarianceRiskContribution[];
}

export interface PortfolioBacktestRun {
  name: string;
  market: Market;
  timeframe: ResearchTimeframe;
  initialCash: number;
  cashWeight: number;
  metrics: PortfolioBacktestMetrics;
  equityCurve: PortfolioBacktestEquityPoint[];
  legs: PortfolioBacktestLeg[];
  allocationEvents?: PortfolioAllocationEvent[];
  rebalanceEvents?: PortfolioRebalanceEvent[];
  tradeReviewEvents?: PortfolioTradeReviewEvent[];
  preTradeRiskChecks?: PortfolioPreTradeRiskCheck[];
  paperOrderEvents?: PortfolioPaperOrderEvent[];
  correlationPairs?: PortfolioCorrelationPair[];
  covarianceRisk?: PortfolioCovarianceRisk;
  dataQuality: MarketKlineQuality;
}

export interface PortfolioBacktestResult {
  portfolio?: PortfolioBacktestRun;
  source: WorkspaceSource;
  error?: string;
}

export interface WorkspaceResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}

export type WorkspaceFetcher = (url: string, init?: RequestInit) => Promise<WorkspaceResponse>;

export interface TerminalResearchParams {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  limit?: number;
  watchlistRefreshRunId?: string | null;
}

export type P0PipelineConditionConfig =
  | { type: "sma_cross" | "sma_break" | "sma_above" | "sma_below"; window: number }
  | { type: "rsi_below" | "rsi_above"; window: number; threshold: number };

export interface P0PipelineStrategyConfig {
  name: string;
  entry: P0PipelineConditionConfig;
  exit: P0PipelineConditionConfig;
  position: {
    maxPositionPct: number;
  };
  risk: {
    stopLossPct: number;
    takeProfitPct: number;
    maxDrawdownPct: number;
  };
}

export interface P0PipelineRequest {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  limit: number;
  strategyConfig: P0PipelineStrategyConfig;
  assumptions: BacktestAssumptions;
}

export interface P0PipelineResponse {
  status: "audited_run_created";
  runId: string;
  strategyRevisionId: string;
  dataSnapshotId: string;
  metrics: {
    totalReturnPct: number;
    maxDrawdownPct: number;
    tradeCount: number;
  };
  paperOnly: true;
  liveTradingAllowed: false;
  orderSubmitted?: false;
  liveOrderSubmitted?: false;
  routeExecuted?: false;
}

export interface P0PipelineRunResult extends WorkspaceLoadResult {
  pipeline?: P0PipelineResponse;
}

export interface MarketKlinesParams extends TerminalResearchParams {
  end?: string;
}

export interface CacheRefreshParams extends TerminalResearchParams {
  limit?: number;
  overrideAuditEventId?: string | null;
}

export interface ResearchNoteSaveParams extends TerminalResearchParams {
  body: string;
}

export interface HandoffNoteSaveParams {
  subjectType: HandoffNoteSubjectType;
  subjectId: string;
  body: string;
  author?: string;
  sourceWorkspace?: string;
}

const defaultFetcher: WorkspaceFetcher = async (url, init) => fetch(url, init);

async function requestJson(
  url: string,
  init: RequestInit | undefined,
  fetcher: WorkspaceFetcher
): Promise<unknown> {
  const response = await fetcher(url, init);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
  }
  return payload;
}

function resolveAiReviewRequestOptions(
  signalOrFetcher: AbortSignal | WorkspaceFetcher | undefined,
  maybeFetcher: WorkspaceFetcher
): { signal?: AbortSignal; fetcher: WorkspaceFetcher } {
  return typeof signalOrFetcher === "function"
    ? { fetcher: signalOrFetcher }
    : { signal: signalOrFetcher, fetcher: maybeFetcher };
}

export function resolveQuantCoreBaseUrl(env: { VITE_QUANT_API_BASE?: string }): string {
  const configured = env.VITE_QUANT_API_BASE?.trim();
  return configured ? configured : defaultQuantCoreBaseUrl;
}

function buildApiUrl(baseUrl: string, path: string, configure?: (url: URL) => void): string {
  const trimmedBase = baseUrl.trim();
  const normalizedBase = trimmedBase && trimmedBase !== "/" ? (trimmedBase.endsWith("/") ? trimmedBase : `${trimmedBase}/`) : "/";
  const url = new URL(path.replace(/^\/+/, ""), normalizedBase === "/" ? "http://aiqt.local/" : normalizedBase);
  configure?.(url);
  return normalizedBase === "/" ? `${url.pathname}${url.search}` : url.toString();
}

export function buildWorkspaceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/workspace");
}

export function buildWatchlistUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/watchlist");
}

export function buildResearchWorkspaceStateUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/workspace-state");
}

export function buildResearchRunUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe,
  assumptions?: BacktestAssumptions,
  limit = 500,
  strategy?: StrategySnapshot,
  watchlistRefreshRunId?: string | null
): string {
  return buildApiUrl(baseUrl, "api/research/run", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
    if (watchlistRefreshRunId?.trim()) {
      url.searchParams.set("watchlistRefreshRunId", watchlistRefreshRunId.trim());
    }
    if (strategy) {
      url.searchParams.set("strategyName", strategy.name);
      url.searchParams.set("strategyEntry", strategy.entry);
      url.searchParams.set("strategyExit", strategy.exit);
      url.searchParams.set("strategyPosition", strategy.position);
      url.searchParams.set("strategyRisk", strategy.risk);
    }
    if (assumptions) {
      url.searchParams.set("initialCash", String(assumptions.initialCash));
      url.searchParams.set("feeBps", String(assumptions.feeBps));
      url.searchParams.set("slippageBps", String(assumptions.slippageBps));
    }
  });
}

export function buildP0PipelineUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/pipeline");
}

export function buildP0AiReviewUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/ai-reviews");
}

export function buildP0PaperSimulationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/paper-simulations");
}

export function buildP0AcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/acceptance/latest");
}

export function buildP1AcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p1/acceptance/latest");
}

export function buildDesktopReleaseLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/desktop/release/latest");
}

export function buildStage1DailyUseUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/daily-use");
}

export function buildStage1DailyUseLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/daily-use/latest");
}

export function buildStage1BootstrapPreflightUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/bootstrap-preflight");
}

export function buildStage1BootstrapPreflightLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/bootstrap-preflight/latest");
}

export function buildP2PreLiveAcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/pre-live/acceptance/latest");
}

export function buildP2PaperReplayLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/paper-replay/latest");
}

export function buildP2ReadinessAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/readiness/acceptance");
}

export function buildP2ReadinessAcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/readiness/acceptance/latest");
}

export function buildP2ManifestChainPreflightUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/manifest-chain/preflight");
}

export function buildP2ManifestChainPreflightLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/manifest-chain/preflight/latest");
}

export function buildResearchRunsUrl(baseUrl: string, limit: number): string {
  return buildApiUrl(baseUrl, "api/research/runs", (url) => {
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  });
}

export function buildResearchRunDetailUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}`);
}

export function buildResearchRunExportUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/export`);
}

export function buildResearchRunImportUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import");
}

export function buildResearchRunImportUndoUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import/undo");
}

export function buildResearchNoteUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe
): string {
  return buildApiUrl(baseUrl, "api/research/notes", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
  });
}

export function buildHandoffNotesUrl(baseUrl: string, subjectType: HandoffNoteSubjectType, subjectId: string, limit = 20): string {
  return buildApiUrl(baseUrl, "api/handoff-notes", (url) => {
    url.searchParams.set("subjectType", subjectType);
    url.searchParams.set("subjectId", subjectId);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  });
}

export function buildResearchRunPaperExecutionsUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/paper-executions`);
}

export function buildResearchRunPromotionUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/promotion`);
}

export function buildResearchRunAiReviewsUrl(
  baseUrl: string,
  runId: string,
  params: AiReviewRunHistoryParams = {}
): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/ai-reviews`, (url) => {
    if (params.query?.trim()) {
      url.searchParams.set("query", params.query.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
    if (params.offset !== undefined) {
      url.searchParams.set("offset", String(Math.max(0, params.offset)));
    }
  });
}

export function buildAuditEventsUrl(baseUrl: string, params: AuditEventHistoryParams = {}): string {
  return buildApiUrl(baseUrl, "api/audit/events", (url) => {
    if (params.eventType?.trim()) {
      url.searchParams.set("eventType", params.eventType.trim());
    }
    if (params.runId?.trim()) {
      url.searchParams.set("runId", params.runId.trim());
    }
    if (params.query?.trim()) {
      url.searchParams.set("query", params.query.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
    if (params.offset !== undefined) {
      url.searchParams.set("offset", String(Math.max(0, params.offset)));
    }
  });
}

export function buildAuditReportSignUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/sign");
}

export function buildAuditReportVerifyUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/verify");
}

export function buildAuditReportVerifyPackageUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/verify-package");
}

export function buildAuditReportRevokeUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/revoke");
}

export function buildAuditSigningKeysUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys");
}

export function buildAuditSigningKeyRotationPlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-plan");
}

export function buildAuditSigningKeyRotationApplyUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-apply");
}

export function buildAuditSigningKeyRotationRestartEvidenceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-restart-evidence");
}

export function buildAuditSigningKeySecretMaterializationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/secret-materializations");
}

export function buildAuditSigningKeySecretMaterializationHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/secret-materializations", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyEnvironmentBindingUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/environment-bindings");
}

export function buildAuditSigningKeyEnvironmentBindingHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/environment-bindings", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyRuntimeReloadPlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-plans");
}

export function buildAuditSigningKeyRuntimeReloadPlanHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-plans", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyRuntimeReloadExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-executions");
}

export function buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/runtime-reload-executions", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildAuditSigningKeyRotationAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-acceptances");
}

export function buildAuditSigningKeyRotationAcceptanceHistoryUrl(
  baseUrl: string,
  params: { proposedKeyId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-acceptances", (url) => {
    if (params.proposedKeyId?.trim()) {
      url.searchParams.set("proposedKeyId", params.proposedKeyId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildStrategiesUrl(
  baseUrl: string,
  params: { market?: Market; symbol?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/strategies", (url) => {
    if (params.market) {
      url.searchParams.set("market", params.market);
    }
    if (params.symbol?.trim()) {
      url.searchParams.set("symbol", params.symbol.trim());
    }
    url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit ?? 20, 50))));
  });
}

export function buildStrategyDetailUrl(baseUrl: string, revision: string): string {
  return buildApiUrl(baseUrl, `api/strategies/${encodeURIComponent(revision)}`);
}

export function buildStrategyValidationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/strategies/validate");
}

export function buildStrategyExperimentsUrl(
  baseUrl: string,
  params: StrategyExperimentHistoryParams = {}
): string {
  return buildApiUrl(baseUrl, "api/strategy-experiments", (url) => {
    if (params.strategyRevision?.trim()) {
      url.searchParams.set("strategyRevision", params.strategyRevision.trim());
    }
    if (params.sourceRunId?.trim()) {
      url.searchParams.set("sourceRunId", params.sourceRunId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildStrategyExperimentDetailUrl(baseUrl: string, experimentId: string): string {
  return buildApiUrl(baseUrl, `api/strategy-experiments/${encodeURIComponent(experimentId)}`);
}

export function buildAiReviewProvidersUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/ai-review/providers");
}

function requireTrimmedAiReviewId(value: unknown): string {
  if (typeof value !== "string" || !value || value !== value.trim()) {
    throw new TypeError("Invalid AI review ID");
  }
  return value;
}

function normalizeCreateAuthoritativeAiReviewRequest(
  request: CreateAuthoritativeAiReviewRequest
): CreateAuthoritativeAiReviewRequest {
  if (!Array.isArray(request.comparisonExperimentIds)) {
    throw new TypeError("Invalid AI review ID");
  }
  return {
    primaryExperimentId: requireTrimmedAiReviewId(request.primaryExperimentId),
    comparisonExperimentIds: request.comparisonExperimentIds.map(requireTrimmedAiReviewId),
    providerId: request.providerId,
    externalDataApproved: request.externalDataApproved
  };
}

export function buildAuthoritativeAiReviewsUrl(
  baseUrl: string,
  filters: AuthoritativeAiReviewFilters = {}
): string {
  if ((filters.limit !== undefined
    && (!Number.isFinite(filters.limit) || !Number.isInteger(filters.limit) || filters.limit < 1 || filters.limit > 50))
    || (filters.offset !== undefined
      && (!Number.isFinite(filters.offset) || !Number.isInteger(filters.offset) || filters.offset < 0))) {
    throw new RangeError("Invalid AI review filters");
  }
  return buildApiUrl(baseUrl, "api/ai-reviews", (url) => {
    if (filters.runId?.trim()) {
      url.searchParams.set("runId", filters.runId.trim());
    }
    if (filters.experimentId?.trim()) {
      url.searchParams.set("experimentId", filters.experimentId.trim());
    }
    if (filters.limit !== undefined) {
      url.searchParams.set("limit", String(filters.limit));
    }
    if (filters.offset !== undefined) {
      url.searchParams.set("offset", String(filters.offset));
    }
    if (filters.query?.trim()) {
      url.searchParams.set("query", filters.query.trim());
    }
  });
}

export function buildAuthoritativeAiReviewUrl(baseUrl: string, aiReviewId: string): string {
  return buildApiUrl(baseUrl, `api/ai-reviews/${encodeURIComponent(requireTrimmedAiReviewId(aiReviewId))}`);
}

export function buildAiReviewDecisionsUrl(baseUrl: string, aiReviewId: string): string {
  return buildApiUrl(baseUrl, `api/ai-reviews/${encodeURIComponent(requireTrimmedAiReviewId(aiReviewId))}/decisions`);
}

export function buildMarketKlinesUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe,
  limit = 160,
  end?: string
): string {
  return buildApiUrl(baseUrl, "api/market/klines", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
    if (end?.trim()) {
      url.searchParams.set("end", end.trim());
    }
  });
}

export function buildMarketDataReadinessUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe
): string {
  return buildApiUrl(baseUrl, "api/market/data-readiness", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
  });
}

export function buildMarketCalendarUrl(baseUrl: string, market: Market, at?: string): string {
  return buildApiUrl(baseUrl, "api/market/calendar", (url) => {
    url.searchParams.set("market", market);
    if (at?.trim()) {
      url.searchParams.set("at", at.trim());
    }
  });
}

export function buildMarketSearchUrl(
  baseUrl: string,
  market: Market,
  query: string,
  limit = 8,
  timeframe?: ResearchTimeframe
): string {
  return buildApiUrl(baseUrl, "api/market/search", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 20))));
    if (timeframe) {
      url.searchParams.set("timeframe", timeframe);
    }
  });
}

export function buildSettingsStatusUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/settings/status");
}

export function buildExecutionAdapterLedgerUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-ledger");
}

export function buildExecutionAdapterCertificationsUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterCertificationApplyUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/apply");
}

export function buildExecutionAdapterControlledRestartEvidenceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-evidence");
}

export function buildExecutionAdapterRestartAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-acceptance");
}

export function buildExecutionAdapterSecretReferenceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-references");
}

export function buildExecutionAdapterSecretMaterializationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-materializations");
}

export function buildExecutionAdapterSecretManifestValidationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-manifest-validations");
}

export function buildExecutionAdapterEnvironmentBindingUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-environment-bindings");
}

export function buildExecutionAdapterRuntimeReloadPlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-plans");
}

export function buildExecutionAdapterRuntimeReloadExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-executions");
}

export function buildExecutionAdapterRuntimeReloadAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-acceptances");
}

export function buildExecutionAdapterOrchestrationDryRunUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-dry-runs");
}

export function buildExecutionAdapterOrchestrationExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-executions");
}

export function buildExecutionAdapterHumanConfirmationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-human-confirmations");
}

export function buildExecutionAdapterSandboxProbePlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-plans");
}

export function buildExecutionAdapterSandboxProbeExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-executions");
}

export function buildExecutionAdapterSandboxProbeReviewUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-reviews");
}

export function buildExecutionAdapterProductionRouteReviewUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-production-route-reviews");
}

export function buildExecutionAdapterSandboxOrderSchemaDryRunUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-order-schema-dry-runs");
}

export function buildExecutionAdapterPaperOrderLifecycleUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-order-lifecycles");
}

export function buildExecutionAdapterPaperRouteRunbookUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-route-runbooks");
}

export function buildExecutionAdapterOpsStateUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-ops-states");
}

export function buildExecutionAdapterPaperExecutionUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-executions");
}

export function buildExecutionAdapterHealthProbeUrl(
  baseUrl: string,
  params: { adapterId?: string; exchange?: string; productionRouteReviewId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-health/ccxt-sandbox", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.exchange?.trim()) {
      url.searchParams.set("exchange", params.exchange.trim());
    }
    if (params.productionRouteReviewId?.trim()) {
      url.searchParams.set("productionRouteReviewId", params.productionRouteReviewId.trim());
    }
  });
}

export function buildExecutionAdapterCertificationAppliesUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/applies", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterControlledRestartEvidenceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-evidence", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRestartAcceptanceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-acceptance", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSecretReferenceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-references", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSecretMaterializationHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-materializations", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSecretManifestValidationHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-secret-manifest-validations", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterEnvironmentBindingHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-environment-bindings", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRuntimeReloadPlanHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-plans", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRuntimeReloadExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-runtime-reload-acceptances", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterOrchestrationDryRunHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-dry-runs", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterOrchestrationExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-orchestration-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterHumanConfirmationHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-human-confirmations", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSandboxProbePlanHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-plans", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSandboxProbeExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSandboxProbeReviewHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-probe-reviews", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterProductionRouteReviewHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-production-route-reviews", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterSandboxOrderSchemaDryRunHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-sandbox-order-schema-dry-runs", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterPaperOrderLifecycleHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-order-lifecycles", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterPaperRouteRunbookHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-route-runbooks", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterOpsStateHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-ops-states", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterPaperExecutionHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-paper-executions", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildGoldenPathStatusUrl(baseUrl: string, params: TerminalResearchParams): string {
  return buildApiUrl(baseUrl, "api/golden-path/status", (url) => {
    url.searchParams.set("market", params.market);
    url.searchParams.set("symbol", params.symbol);
    url.searchParams.set("timeframe", params.timeframe);
  });
}

export function buildCacheRefreshUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/cache/refresh");
}

export function buildWatchlistCacheRefreshUrl(baseUrl: string, params: { limit?: number } = {}): string {
  return buildApiUrl(baseUrl, "api/cache/watchlist-refreshes", (url) => {
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildPortfolioBacktestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/portfolio/backtest");
}

export function buildPortfolioPaperOrdersUrl(
  baseUrl: string,
  params: { baseRunId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-orders", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildPortfolioPaperOrderApprovalsUrl(
  baseUrl: string,
  params: { baseRunId?: string; batchId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-approvals", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.batchId?.trim()) {
      url.searchParams.set("batchId", params.batchId.trim());
    }
  });
}

export function buildPortfolioPaperOrderSimulationsUrl(
  baseUrl: string,
  params: { baseRunId?: string; batchId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-simulations", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.batchId?.trim()) {
      url.searchParams.set("batchId", params.batchId.trim());
    }
  });
}

export function buildPortfolioPaperOrderBatchSimulationsUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-simulations/batch");
}

export function buildPortfolioPaperOrderStateHistoryUrl(
  baseUrl: string,
  params: { baseRunId?: string; batchId?: string } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-state-history", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.batchId?.trim()) {
      url.searchParams.set("batchId", params.batchId.trim());
    }
  });
}

export function buildPortfolioPaperOrderReplayUrl(
  baseUrl: string,
  params: { baseRunId?: string; initialCash?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/portfolio/paper-order-replay", (url) => {
    if (params.baseRunId?.trim()) {
      url.searchParams.set("baseRunId", params.baseRunId.trim());
    }
    if (params.initialCash !== undefined) {
      url.searchParams.set("initialCash", String(params.initialCash));
    }
  });
}

export function buildLoadingMarketKlinesResult(params: TerminalResearchParams): MarketKlinesResult {
  return {
    market: params.market,
    symbol: params.symbol,
    timeframe: params.timeframe,
    bars: [],
    quality: {
      source: "loading",
      isComplete: false,
      warnings: [],
      rows: 0
    },
    source: "fallback"
  };
}

export async function loadTerminalWorkspace(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(buildWorkspaceUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal workspace contract");
    }
    return {
      workspace: workspaceWithPrimaryWorkflows(payload),
      source: "core",
      statusLabel: "Core connected"
    };
  } catch (error) {
    return {
      workspace: buildTerminalWorkspace(),
      source: "fallback",
      statusLabel: "Offline snapshot",
      error: error instanceof Error ? error.message : "Unknown workspace load error"
    };
  }
}

export async function saveWatchlist(
  baseUrl: string,
  watchlist: TerminalWorkspace["watchlist"],
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WatchlistSaveResult> {
  try {
    const response = await fetcher(buildWatchlistUrl(baseUrl), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchlist: watchlist.map((instrument) => ({
          market: instrument.market,
          symbol: instrument.symbol,
          name: instrument.name,
          price: instrument.price,
          changePct: instrument.changePct
        }))
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isWatchlistPayload(payload)) {
      throw new Error("Invalid watchlist contract");
    }
    return {
      watchlist: payload.watchlist,
      source: "core"
    };
  } catch (error) {
    return {
      watchlist,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown watchlist save error"
    };
  }
}

export async function saveResearchWorkspaceState(
  baseUrl: string,
  state: Omit<ResearchWorkspaceState, "updatedAt">,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchWorkspaceStateSaveResult> {
  try {
    const response = await fetcher(buildResearchWorkspaceStateUrl(baseUrl), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchWorkspaceStatePayload(payload)) {
      throw new Error("Invalid research workspace state contract");
    }
    return {
      state: payload.state,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research workspace state save error"
    };
  }
}

export async function loadResearchRunHistory(
  baseUrl: string,
  limit = 5,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunHistoryResult> {
  try {
    const response = await fetcher(buildResearchRunsUrl(baseUrl, limit));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunHistoryPayload(payload)) {
      throw new Error("Invalid research run history contract");
    }
    return {
      runs: payload.runs,
      source: "core"
    };
  } catch (error) {
    return {
      runs: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run history error"
    };
  }
}

export async function loadResearchRunDetail(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunDetailResult> {
  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunDetailPayload(payload)) {
      throw new Error("Invalid research run detail contract");
    }
    return {
      run: payload.run,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run detail error"
    };
  }
}

export async function runPortfolioBacktest(
  baseUrl: string,
  request: PortfolioBacktestRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioBacktestResult> {
  try {
    const response = await fetcher(buildPortfolioBacktestUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioBacktestPayload(payload)) {
      throw new Error("Invalid portfolio backtest contract");
    }
    return {
      portfolio: payload.portfolio,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio backtest error"
    };
  }
}

export async function recordPortfolioPaperOrderBatch(
  baseUrl: string,
  request: PortfolioPaperOrderBatchRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrdersUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseRunId: request.baseRunId,
        portfolioName: request.portfolioName,
        orders: request.orders,
        source: request.source ?? "portfolio_backtest"
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isPortfolioPaperOrderDuplicateBatchPayload(payload)) {
        return {
          batch: payload.existingBatch,
          lifecycle: payload.portfolioPaperOrderLifecycle,
          source: "core"
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderBatchPayload(payload)) {
      throw new Error("Invalid portfolio paper order batch contract");
    }
    return {
      batch: payload.portfolioPaperOrderBatch,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order record error"
    };
  }
}

export async function loadPortfolioPaperOrderBatches(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<PortfolioPaperOrderHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrdersUrl(baseUrl, { baseRunId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderBatchesPayload(payload)) {
      throw new Error("Invalid portfolio paper order history contract");
    }
    return {
      batches: payload.portfolioPaperOrderBatches,
      source: "core"
    };
  } catch (error) {
    return {
      batches: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order history error"
    };
  }
}

export async function recordPortfolioPaperOrderApproval(
  baseUrl: string,
  request: PortfolioPaperOrderApprovalRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderApprovalRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderApprovalsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isPortfolioPaperOrderApprovalLockedPayload(payload)) {
        return {
          existingApproval: payload.existingApproval,
          existingSimulation: payload.existingSimulation,
          approvals: payload.approvals,
          lifecycle: payload.portfolioPaperOrderLifecycle,
          source: "core",
          error: payload.error
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          approvals: [],
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderApprovalRecordPayload(payload)) {
      throw new Error("Invalid portfolio paper order approval contract");
    }
    return {
      approval: payload.approval,
      approvals: payload.approvals,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      approvals: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order approval record error"
    };
  }
}

export async function loadPortfolioPaperOrderApprovals(
  baseUrl: string,
  baseRunId: string,
  batchId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderApprovalHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderApprovalsUrl(baseUrl, { baseRunId, batchId }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderApprovalHistoryPayload(payload)) {
      throw new Error("Invalid portfolio paper order approval history contract");
    }
    return {
      approvals: payload.approvals,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      source: "core"
    };
  } catch (error) {
    return {
      approvals: [],
      lifecycle: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order approval history error"
    };
  }
}

export function normalizeResearchRunExportPackagePayload(value: unknown): ResearchRunExportPackage | null {
  if (isResearchRunExportPackage(value)) {
    return stripUntrustedPackageReportVerification(value);
  }
  if (isResearchRunExportPayload(value)) {
    return stripUntrustedPackageReportVerification(value.export);
  }
  return null;
}

function stripUntrustedPackageReportVerification(exportPackage: ResearchRunExportPackage): ResearchRunExportPackage {
  return {
    ...exportPackage,
    ...(exportPackage.auditReport
      ? { auditReport: stripUntrustedPackageReportSignatureVerification(exportPackage.auditReport) }
      : {}),
    ...(exportPackage.backtestReport
      ? { backtestReport: stripUntrustedPackageReportSignatureVerification(exportPackage.backtestReport) }
      : {})
  };
}

function stripUntrustedPackageReportSignatureVerification<
  TReport extends ResearchRunExportAuditReport | ResearchRunExportBacktestReport
>(report: TReport): TReport {
  if (!report.signature) {
    return report;
  }
  const signature = { ...report.signature };
  delete signature.importVerificationReason;
  delete signature.importVerificationSource;
  delete signature.importVerificationStatus;
  delete signature.importVerifiedAt;
  return { ...report, signature } as TReport;
}

export function buildResearchRunExportAuditEvidenceSummary(
  summary: AuditEvidenceSummary,
  generatedAt = new Date().toISOString()
): ResearchRunExportAuditEvidenceSummary {
  const importVerificationBuckets = summary.importVerificationBuckets ?? [];
  const importVerificationVerifiedCount = summary.importVerificationVerifiedCount ?? 0;
  const importVerificationInvalidCount = summary.importVerificationInvalidCount ?? 0;
  const importPolicyBlockerBuckets = summary.importPolicyBlockerBuckets ?? [];
  const importPolicyBlockedCount = summary.importPolicyBlockedCount ?? 0;
  return {
    kind: "aiqt.auditEvidenceSummary",
    schemaVersion: 1,
    runId: summary.runId,
    generatedAt,
    auditQuery: summary.auditQuery,
    packageQuery: summary.packageQuery,
    importDiffQuery: summary.importDiffQuery,
    focusQuery: summary.focusQuery,
    deepLinkStatus: summary.deepLinkStatus,
    deepLinkError: summary.deepLinkError,
    package: {
      ready: summary.packageReadyCount,
      missing: summary.packageMissingCount,
      blocked: summary.packageBlockedCount,
      matched: summary.packageMatchedCount,
      total: summary.packageTotalCount
    },
    importDiff: {
      changes: summary.importDiffChangeCount,
      adds: summary.importDiffAddCount,
      blocked: summary.importDiffBlockedCount,
      matched: summary.importDiffMatchedCount,
      total: summary.importDiffTotalCount
    },
    importVerification: {
      verified: importVerificationVerifiedCount,
      invalid: importVerificationInvalidCount,
      buckets: importVerificationBuckets
    },
    importPolicyBlockers: {
      blocked: importPolicyBlockedCount,
      buckets: importPolicyBlockerBuckets
    },
    copyText: summary.copyText
  };
}

export function withResearchRunExportAuditEvidenceSummary(
  exportPackage: ResearchRunExportPackage,
  summary: AuditEvidenceSummary,
  generatedAt?: string
): ResearchRunExportPackage {
  return {
    ...exportPackage,
    auditEvidenceSummary: buildResearchRunExportAuditEvidenceSummary(summary, generatedAt)
  };
}

export async function buildResearchRunExportAuditReport(
  summary: AuditEvidenceSummary,
  generatedAt = new Date().toISOString()
): Promise<ResearchRunExportAuditReport> {
  const contentMarkdown = buildAuditEvidenceReportMarkdown(summary, { generatedAt });
  return {
    kind: "aiqt.auditReport",
    schemaVersion: 1,
    runId: summary.runId,
    generatedAt,
    format: "text/markdown",
    fileName: `${sanitizeDownloadFileName(summary.runId)}-audit-evidence-report.md`,
    contentSha256: {
      algorithm: "sha256",
      hash: await sha256TextHex(contentMarkdown)
    },
    contentMarkdown,
    evidenceSummary: buildResearchRunExportAuditEvidenceSummary(summary, generatedAt)
  };
}

export async function buildResearchRunExportBacktestReport(
  exportPackage: ResearchRunExportPackage,
  runHistory: ResearchRunAudit[] = [],
  generatedAt = new Date().toISOString(),
  experiment: StrategyExperimentDetail | null = null
): Promise<ResearchRunExportBacktestReport | null> {
  const run = exportPackage.researchRun;
  if (!run.dataSnapshot) {
    return null;
  }

  const comparisonHistory = [run, ...runHistory.filter((candidate) => candidate.runId !== run.runId)];
  const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), run);
  const contentMarkdown = buildBacktestReportMarkdown(workspace, comparisonHistory, experiment);
  if (!contentMarkdown) {
    return null;
  }

  return {
    kind: "aiqt.backtestReport",
    schemaVersion: 1,
    runId: run.runId,
    generatedAt,
    format: "text/markdown",
    fileName: `${sanitizeDownloadFileName(run.runId)}-backtest-report.md`,
    contentSha256: {
      algorithm: "sha256",
      hash: await sha256TextHex(contentMarkdown)
    },
    contentMarkdown,
    market: run.market,
    symbol: run.symbol,
    timeframe: run.timeframe,
    strategyRevision: run.strategyRevision,
    executionMode: run.executionMode,
    dataRows: run.dataRows,
    runComparisonRows: buildBacktestRunComparisonMatrixRows(comparisonHistory, run.runId).length,
    boundary: "historical audited evidence only; no investment advice"
  };
}

export function buildAuditEvidenceReportAuditEvent(
  auditReport: ResearchRunExportAuditReport,
  summary: AuditEvidenceSummary
): AuditEventRecord {
  const shortHash = auditReport.contentSha256.hash.slice(0, 16);
  const importVerificationBuckets = summary.importVerificationBuckets ?? [];
  const latestImportVerification = importVerificationBuckets[0] ?? null;
  return {
    schemaVersion: 1,
    eventId: `audit-report-${sanitizeDownloadFileName(auditReport.runId)}-${shortHash}`,
    eventType: "audit_evidence_report",
    runId: auditReport.runId,
    createdAt: auditReport.generatedAt,
    stage: "generated",
    source: "web",
    summary: `Audit evidence report generated for ${auditReport.runId}`,
    detail: `${auditReport.fileName} · sha256 ${auditReport.contentSha256.hash.slice(0, 12)} · focus ${
      summary.focusQuery || "none"
    }`,
    metadata: {
      artifactKind: auditReport.kind,
      fileName: auditReport.fileName,
      format: auditReport.format,
      contentSha256: auditReport.contentSha256.hash,
      contentSha256Algorithm: auditReport.contentSha256.algorithm,
      evidenceFocus: summary.focusQuery,
      auditQuery: summary.auditQuery,
      packageQuery: summary.packageQuery,
      importDiffQuery: summary.importDiffQuery,
      packageMatched: summary.packageMatchedCount,
      packageTotal: summary.packageTotalCount,
      importDiffBlocked: summary.importDiffBlockedCount,
      importDiffTotal: summary.importDiffTotalCount,
      importVerificationVerified: summary.importVerificationVerifiedCount ?? 0,
      importVerificationInvalid: summary.importVerificationInvalidCount ?? 0,
      importVerificationLatestStatus: latestImportVerification?.status ?? "",
      importVerificationLatestSource: latestImportVerification?.source ?? "",
      importVerificationLatestExportPath: latestImportVerification?.latestExportPath ?? "",
      importVerificationLatestReason: latestImportVerification?.latestReason ?? "",
      deepLinkStatus: summary.deepLinkStatus,
      deepLinkError: summary.deepLinkError
    }
  };
}

export async function buildP0AcceptanceReviewAuditEvent({
  acceptance,
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  acceptance: P0AcceptanceSummarySource | null | undefined;
  generatedAt?: string;
  markdown: string;
  summary: P0AcceptanceSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const runId = summary.runId?.trim() || acceptance?.runId?.trim() || "p0-acceptance";
  const safeRunId = sanitizeDownloadFileName(runId);
  const fileName = `${safeRunId}-p0-acceptance-review.md`;
  const checkIds =
    acceptance?.checkIds.length
      ? acceptance.checkIds
      : summary.state === "missing"
        ? ["p0_acceptance_manifest_missing"]
        : ["p0_acceptance_manifest_invalid"];

  return {
    schemaVersion: 1,
    eventId: `p0-acceptance-review-${safeRunId}-${shortHash}`,
    eventType: "p0_acceptance_review",
    runId,
    createdAt: generatedAt,
    stage: summary.state,
    source: "web",
    summary: "P0 acceptance review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.checkCount}/${
      summary.requiredCheckCount
    } checks · live blocked ${summary.liveBlockedBoundary}`,
    metadata: {
      artifactKind: "aiqt.p0AcceptanceReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      sourcePath: summary.sourcePath,
      manifestGeneratedAt: acceptance?.generatedAt ?? "",
      manifestAvailable: Boolean(acceptance?.available),
      market: acceptance?.market ?? "",
      symbol: acceptance?.symbol ?? "",
      timeframe: acceptance?.timeframe ?? "",
      checkCount: summary.checkCount,
      requiredCheckCount: summary.requiredCheckCount,
      checkIds,
      paperOnly: Boolean(acceptance?.paperOnly),
      reportedLiveTradingAllowed: summary.reportedLiveTradingAllowed,
      liveTradingAllowed: false,
      liveBlockedBoundary: summary.liveBlockedBoundary,
      boundary: "P0 acceptance audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildP2ReadinessAcceptanceReviewAuditEvent({
  acceptance,
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  acceptance: P2ReadinessAcceptanceReviewSource | null | undefined;
  generatedAt?: string;
  markdown: string;
  summary: P2ReadinessAcceptanceSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const runId = acceptance?.runId?.trim() || "p2-readiness-acceptance";
  const safeRunId = sanitizeDownloadFileName(runId);
  const fileName = `${safeRunId}-p2-readiness-acceptance-review.md`;
  const criterionIds =
    acceptance?.criterionIds.length
      ? acceptance.criterionIds
      : summary.status === "incomplete"
        ? ["p2_readiness_acceptance_manifest_missing"]
        : ["p2_readiness_acceptance_manifest_invalid"];
  const auditEventIds = acceptance?.auditEventIds.length ? acceptance.auditEventIds : ["audit_event_missing"];
  const state = acceptance?.status ?? (summary.status === "accepted" ? "accepted" : summary.status === "blocked" ? "invalid" : "missing");

  return {
    schemaVersion: 1,
    eventId: `p2-readiness-acceptance-review-${safeRunId}-${shortHash}`,
    eventType: "p2_readiness_acceptance_review",
    runId,
    createdAt: generatedAt,
    stage: state,
    source: "web",
    summary: "P2 readiness acceptance review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${
      acceptance?.acceptedCriterionCount ?? summary.acceptedCount
    }/${acceptance?.totalCriterionCount ?? summary.totalCount} criteria · live blocked ${Boolean(
      acceptance?.liveBlockedBoundary
    )}`,
    metadata: {
      artifactKind: "aiqt.p2ReadinessAcceptanceReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state,
      sourcePath: acceptance?.sourcePath ?? "data/p2-readiness-acceptance.json",
      manifestGeneratedAt: acceptance?.generatedAt ?? "",
      manifestAvailable: Boolean(acceptance?.available),
      market: acceptance?.market ?? "",
      symbol: acceptance?.symbol ?? "",
      timeframe: acceptance?.timeframe ?? "",
      adapterId: acceptance?.adapterId ?? "",
      p1AcceptanceRunId: acceptance?.p1AcceptanceRunId ?? "",
      p2PreLiveAcceptanceRunId: acceptance?.p2PreLiveAcceptanceRunId ?? "",
      p2PaperReplayRunId: acceptance?.p2PaperReplayRunId ?? "",
      operatorRunbookAuditEventId: acceptance?.operatorRunbookAuditEventId ?? "",
      currentEvidenceCoverageReviewAuditEventId: summary.evidenceCoverageReviewAuditEventId ?? "",
      readinessCoverageStatus: acceptance?.readinessCoverageStatus ?? "",
      acceptedCriterionCount: acceptance?.acceptedCriterionCount ?? summary.acceptedCount,
      totalCriterionCount: acceptance?.totalCriterionCount ?? summary.totalCount,
      blockingCriterionCount: acceptance?.blockingCriterionCount ?? summary.blockingCount,
      criterionIds,
      auditEventIds,
      manifestPaths: acceptance?.manifestPaths ?? {
        p1Acceptance: null,
        p2PreLiveAcceptance: null,
        p2PaperReplay: null
      },
      paperOnly: Boolean(acceptance?.paperOnly),
      reportedOrderSubmissionEnabled: Boolean(acceptance?.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(acceptance?.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(acceptance?.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(acceptance?.routeExecuted),
      reportedLiveBlockedBoundary: Boolean(acceptance?.liveBlockedBoundary),
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "P2 readiness acceptance review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildP2ReadinessEvidenceCoverageReviewAuditEvent({
  coverage,
  generatedAt = new Date().toISOString(),
  markdown
}: {
  coverage: P2ReadinessEvidenceCoverage;
  generatedAt?: string;
  markdown: string;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "p2-readiness-evidence-coverage-review.md";

  return {
    schemaVersion: 1,
    eventId: `p2-readiness-evidence-coverage-review-${shortHash}`,
    eventType: "p2_readiness_evidence_coverage_review",
    runId: "p2-readiness-evidence-coverage",
    createdAt: generatedAt,
    stage: coverage.status,
    source: "web",
    summary: "P2 readiness evidence coverage review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${coverage.status} ${coverage.coveredCount}/${
      coverage.totalCount
    } claims · live blocked true`,
    metadata: {
      artifactKind: "aiqt.p2ReadinessEvidenceCoverageReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: coverage.status,
      coverageStatus: coverage.status,
      coveredCount: coverage.coveredCount,
      totalCount: coverage.totalCount,
      blockingCount: coverage.blockingCount,
      rowIds: coverage.rows.map((row) => row.id),
      rowStatuses: coverage.rows.map((row) => row.status),
      sourceTypes: coverage.rows.map((row) => row.sourceType),
      sourceIds: coverage.rows.map((row) => row.sourceId ?? "n/a"),
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "P2 readiness evidence coverage review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildPersonalTeamUsabilityReadinessReviewAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  generatedAt?: string;
  markdown: string;
  summary: PersonalTeamUsabilityReadinessSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "personal-team-readiness-review.md";

  return {
    schemaVersion: 1,
    eventId: `personal-team-readiness-review-${shortHash}`,
    eventType: "personal_team_readiness_review",
    runId: "personal-team-readiness",
    createdAt: generatedAt,
    stage: summary.state,
    source: "web",
    summary: "Personal and small-team readiness review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.state} ${summary.readyCount}/${
      summary.totalCount
    } gates · personal ${summary.personalPercent}% · team ${summary.teamPercent}% · live blocked true`,
    metadata: {
      artifactKind: "aiqt.personalTeamReadinessReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      tone: summary.tone,
      headline: summary.headline,
      personalPercent: summary.personalPercent,
      teamPercent: summary.teamPercent,
      readyCount: summary.readyCount,
      totalCount: summary.totalCount,
      openItemIds: summary.openItems.map((item) => item.id),
      itemIds: summary.items.map((item) => item.id),
      itemStatuses: summary.items.map((item) => item.status),
      nextActionLabel: summary.nextActionLabel,
      nextActionWorkspaceId: summary.nextActionWorkspaceId,
      liveBoundaryLabel: summary.liveBoundaryLabel,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "Personal and small-team readiness review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildDailyOpsControlRoomReviewAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  generatedAt?: string;
  markdown: string;
  summary: DailyOpsControlRoomSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "daily-ops-control-room-review.md";

  return {
    schemaVersion: 1,
    eventId: `daily-ops-control-room-review-${shortHash}`,
    eventType: "daily_ops_control_room_review",
    runId: "daily-ops-control-room",
    createdAt: generatedAt,
    stage: summary.state,
    source: "web",
    summary: "Daily ops control room review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.state} ${summary.readyCount}/${
      summary.totalCount
    } gates · review ${summary.reviewCount} · blocked ${summary.blockingCount} · live blocked true`,
    metadata: {
      artifactKind: "aiqt.dailyOpsControlRoomReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      tone: summary.tone,
      headline: summary.headline,
      readyCount: summary.readyCount,
      reviewCount: summary.reviewCount,
      blockingCount: summary.blockingCount,
      totalCount: summary.totalCount,
      queueItemIds: summary.queueItems.map((item) => item.id),
      queueItemStatuses: summary.queueItems.map((item) => item.status),
      openItemIds: summary.openItems.map((item) => item.id),
      primaryActionLabel: summary.primaryActionLabel,
      primaryActionWorkspaceId: summary.primaryActionWorkspaceId,
      auditQueryLabel: summary.auditQueryLabel,
      auditQuery: summary.auditQuery,
      auditQueryTitle: summary.auditQueryTitle || "",
      liveBoundaryLabel: summary.liveBoundaryLabel,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "Daily ops control room review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildDailyStartBriefReviewAuditEvent({
  brief,
  generatedAt = new Date().toISOString(),
  markdown
}: {
  brief: DailyStartBrief;
  generatedAt?: string;
  markdown: string;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "daily-start-brief-review.md";

  return {
    schemaVersion: 1,
    eventId: `daily-start-brief-review-${shortHash}`,
    eventType: "daily_start_brief_review",
    runId: "daily-start-brief",
    createdAt: generatedAt,
    stage: brief.state,
    source: "web",
    summary: "Daily start brief review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${brief.state} · local reviews ${brief.currentReviewCount}/2 · open ops ${brief.openOpsItemCount} · live blocked true`,
    metadata: {
      artifactKind: "aiqt.dailyStartBriefReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: brief.state,
      tone: brief.tone,
      headline: brief.headline,
      currentReviewCount: brief.currentReviewCount,
      staleReviewCount: brief.staleReviewCount,
      missingReviewCount: brief.missingReviewCount,
      openOpsItemCount: brief.openOpsItemCount,
      primaryActionLabel: brief.primaryActionLabel,
      primaryActionWorkspaceId: brief.primaryActionWorkspaceId,
      auditActionLabel: brief.auditActionLabel,
      auditQuery: brief.auditQuery,
      auditQueryTitle: brief.auditQueryTitle || "",
      localReviewStatus: brief.localReviewStatus,
      localReviewActionLabel: brief.localReviewActionLabel,
      localReviewQuery: brief.localReviewQuery,
      checkpointIds: brief.checkpoints.map((checkpoint) => checkpoint.id),
      checkpointStatuses: brief.checkpoints.map((checkpoint) => checkpoint.status),
      liveBoundaryLabel: brief.liveBoundaryLabel,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "Daily start brief review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

interface Stage1P0DailyUseArchiveReviewClosure {
  bootstrapPreflightChecks?: readonly Stage1BootstrapPreflightSummaryCheckSource[];
  bootstrapPreflightSourcePaths?: Stage1BootstrapPreflightSummarySource["sourcePaths"] | null;
  primaryActionId?: string | null;
  primaryActionLabel: string;
  primaryTargetWorkspaceId: string;
  readyCount: number;
  rows: readonly {
    id?: string | null;
    label: string;
    status: string;
    targetWorkspaceId: string;
  }[];
  state: string;
  totalCount: number;
}

interface Stage1P0DailyUseArchiveReviewShareState {
  focus: string;
  kind: string;
  targetWorkspaceId: string;
}

interface Stage1P0DailyUseArchiveReviewInvalidShareStatus {
  reason: string | null;
  state?: unknown;
  status: string;
}

interface Stage1P0DailyUseArchiveReviewRefreshOutcome {
  state: string;
}

export async function buildStage1P0DailyUseArchiveReviewAuditEvent({
  archive,
  closure,
  generatedAt = new Date().toISOString(),
  invalidShareStatus = null,
  refreshOutcome = null,
  shareDeepLinkState = null
}: {
  archive: Stage1P0DailyUseArchiveBundle;
  closure: Stage1P0DailyUseArchiveReviewClosure;
  generatedAt?: string;
  invalidShareStatus?: Stage1P0DailyUseArchiveReviewInvalidShareStatus | null;
  refreshOutcome?: Stage1P0DailyUseArchiveReviewRefreshOutcome | null;
  shareDeepLinkState?: Stage1P0DailyUseArchiveReviewShareState | null;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(archive.contentMarkdown);
  const shortHash = contentSha256.slice(0, 16);
  const invalidShareReason = invalidShareStatus?.status === "invalid" ? invalidShareStatus.reason : null;
  const bootstrapPreflightChecks = closure.bootstrapPreflightChecks ?? [];
  const bootstrapPreflightCheckIds = bootstrapPreflightChecks.map((check) => check.id ?? "");
  const bootstrapPreflightCheckStatuses = bootstrapPreflightChecks.map((check) => check.status ?? "");
  const bootstrapPreflightCheckSourcePaths = bootstrapPreflightChecks.map((check) => check.sourcePath ?? "");
  const p2ManifestChainCheckSourcePath =
    bootstrapPreflightChecks.find((check) => check.id === "p2-manifest-chain")?.sourcePath ?? "";
  const bootstrapPreflightP2ManifestChainPreflightSourcePath =
    closure.bootstrapPreflightSourcePaths?.p2ManifestChainPreflight ?? p2ManifestChainCheckSourcePath;

  return {
    schemaVersion: 1,
    eventId: `stage1-daily-archive-review-${shortHash}`,
    eventType: "stage1_daily_archive_review",
    runId: "stage1-p0-daily-use",
    createdAt: generatedAt,
    stage: closure.state,
    source: "web",
    summary: "Stage 1/P0 daily-use archive recorded",
    detail: `${archive.fileName} · sha256 ${contentSha256.slice(0, 12)} · body ${archive.bodySha256.hash.slice(
      0,
      12
    )} · ${closure.state} ${closure.readyCount}/${closure.totalCount} ready · live blocked true`,
    metadata: {
      archiveBodySha256: archive.bodySha256.hash,
      archiveBodySha256Algorithm: archive.bodySha256.algorithm,
      artifactKind: "aiqt.stage1P0DailyUseArchiveReview",
      bootstrapPreflightCheckIds,
      bootstrapPreflightCheckSourcePaths,
      bootstrapPreflightCheckStatuses,
      bootstrapPreflightP2ManifestChainPreflightSourcePath,
      boundary:
        "Stage 1/P0 daily-use archive is local review evidence only; live trading remains blocked and no investment advice",
      contentSha256,
      contentSha256Algorithm: "sha256",
      fileName: archive.fileName,
      format: "text/markdown",
      invalidShareReason: invalidShareReason ?? "none",
      invalidShareStatus: invalidShareStatus?.status ?? "none",
      liveBlockedBoundary: true,
      liveOrderSubmitted: false,
      liveTradingAllowed: false,
      orderSubmissionEnabled: false,
      primaryActionId: closure.primaryActionId ?? "",
      primaryActionLabel: closure.primaryActionLabel,
      primaryTargetWorkspaceId: closure.primaryTargetWorkspaceId,
      readyCount: closure.readyCount,
      refreshOutcomeState: refreshOutcome?.state ?? "not-generated",
      routeExecuted: false,
      rowIds: closure.rows.map((row) => row.id ?? ""),
      rowLabels: closure.rows.map((row) => row.label),
      rowStatuses: closure.rows.map((row) => row.status),
      rowTargetWorkspaceIds: closure.rows.map((row) => row.targetWorkspaceId),
      shareFocus: shareDeepLinkState?.focus ?? "none",
      shareKind: shareDeepLinkState?.kind ?? "none",
      shareTargetWorkspaceId: shareDeepLinkState?.targetWorkspaceId ?? "none",
      state: closure.state,
      totalCount: closure.totalCount
    }
  };
}

export async function buildP2ManifestChainPreflightReviewAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  preflight,
  summary
}: {
  generatedAt?: string;
  markdown: string;
  preflight: P2ManifestChainPreflightSummarySource | null | undefined;
  summary: P2ManifestChainPreflightSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "p2-manifest-chain-preflight-review.md";
  const stages = preflight?.stages.length ? preflight.stages : summary.stages;
  const state = preflight?.status ?? summary.state;
  const validStageCount = preflight?.validStageCount ?? summary.validStageCount;
  const totalStageCount = preflight?.totalStageCount ?? summary.totalStageCount;
  const blockerIds = preflight?.blockerIds.length ? preflight.blockerIds : summary.blockerIds;
  const nextAction = preflight?.nextAction ?? summary.nextAction;
  const nextCommand = preflight?.nextCommand ?? summary.nextCommand;
  const liveBlockedBoundary = Boolean(preflight?.liveBlockedBoundary ?? summary.liveBlockedBoundary);

  return {
    schemaVersion: 1,
    eventId: `p2-manifest-chain-preflight-review-${shortHash}`,
    eventType: "p2_manifest_chain_preflight_review",
    runId: "p2-manifest-chain-preflight",
    createdAt: generatedAt,
    stage: state,
    source: "web",
    summary: "P2 manifest chain preflight review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${state} ${validStageCount}/${totalStageCount} · next=${
      nextAction || "none"
    } · live blocked ${liveBlockedBoundary}`,
    metadata: {
      artifactKind: "aiqt.p2ManifestChainPreflightReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state,
      preflightStatus: state,
      sourcePath: preflight?.sourcePath ?? summary.sourcePath,
      manifestAvailable: Boolean(preflight?.available),
      ready: Boolean(preflight?.ready ?? summary.ready),
      validStageCount,
      totalStageCount,
      blockerIds,
      nextAction,
      nextCommand,
      stageIds: stages.map((stage) => stage.id),
      stageStatuses: stages.map((stage) => stage.status),
      paperOnly: Boolean(preflight?.paperOnly),
      reportedOrderSubmissionEnabled: Boolean(preflight?.orderSubmissionEnabled ?? summary.reportedOrderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(preflight?.liveTradingAllowed ?? summary.reportedLiveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(preflight?.liveOrderSubmitted ?? summary.reportedLiveOrderSubmitted),
      reportedRouteExecuted: Boolean(preflight?.routeExecuted ?? summary.reportedRouteExecuted),
      reportedLiveBlockedBoundary: liveBlockedBoundary,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary,
      boundary:
        "P2 manifest chain preflight review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export function buildMarketDataRefreshOverrideAuditEvent({
  actionScope = "manual_cache_refresh",
  createdAt = new Date().toISOString(),
  guard,
  market,
  name = "",
  operator = "local-operator",
  reason,
  symbol,
  timeframe
}: {
  actionScope?: "current_cache_refresh" | "watchlist_cache_refresh" | "manual_cache_refresh";
  createdAt?: string;
  guard: MarketDataRefreshGuard;
  market: Market;
  name?: string;
  operator?: string;
  reason: string;
  symbol: string;
  timeframe: ResearchTimeframe;
}): AuditEventRecord {
  const overrideReason = reason.trim();
  if (!overrideReason) {
    throw new Error("market_data_refresh_override_reason_required");
  }
  const normalizedOperator = operator.trim() || "local-operator";
  const affectedSymbols = guard.affectedSymbols.slice(0, 8);
  const affectedContexts = guard.affectedContexts.slice(0, 8);
  const affectedLabel = affectedSymbols.length ? affectedSymbols.slice(0, 3).join("/") : "current market";
  const safeCreatedAt = sanitizeDownloadFileName(createdAt);
  const safeReason = sanitizeDownloadFileName(overrideReason).slice(0, 32);

  return {
    schemaVersion: 1,
    eventId: `market-data-refresh-override-${sanitizeDownloadFileName(market)}-${sanitizeDownloadFileName(
      symbol
    )}-${sanitizeDownloadFileName(timeframe)}-${safeCreatedAt}-${safeReason}`,
    eventType: "market_data_refresh_override",
    runId: null,
    createdAt,
    stage: "override_recorded",
    source: "web",
    summary: `Market data refresh override recorded for ${market.toUpperCase()} ${symbol} ${timeframe}`,
    detail: `${actionScope} override by ${normalizedOperator}: ${overrideReason}; original retry after ${
      guard.retryAfterSeconds
    }s; affected ${affectedLabel}.`,
    metadata: {
      actionScope,
      affectedContexts,
      affectedSymbols,
      artifactKind: "aiqt.marketDataRefreshOverride",
      boundary: "manual market-data refresh override only; no trading authorization or investment advice",
      liveTradingAllowed: false,
      market,
      name,
      operator: normalizedOperator,
      overrideApplied: guard.overrideApplied,
      overrideReason,
      providerHealthReason: guard.reason,
      providerHealthStatus: guard.status,
      recentErrorCount: guard.recentErrorCount,
      retryAfterSeconds: guard.retryAfterSeconds,
      symbol,
      timeframe
    }
  };
}

export async function buildP0PlatformReadinessReportAuditEvent({
  backlogItems,
  evidenceLink = null,
  generatedAt = new Date().toISOString(),
  markdown,
  outcome,
  paperPreflight = null,
  summary,
  completionChecklist = null
}: {
  backlogItems: readonly P0PlatformBacklogItem[];
  completionChecklist?: P0CompletionChecklist | null;
  evidenceLink?: P0PlatformActionOutcomeEvidenceLink | null;
  generatedAt?: string;
  markdown: string;
  outcome: P0PlatformActionOutcome;
  paperPreflight?: P0PaperExecutionPreflight | null;
  summary: P0PlatformReadinessSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const runId = outcome.runId?.trim() || outcome.evidenceId?.trim() || "p0-readiness";
  const safeRunId = sanitizeDownloadFileName(runId);
  const fileName = `${safeRunId}-p0-readiness-report.md`;
  const currentGap = summary.currentGap;
  const firstBacklogItem = backlogItems[0] ?? null;
  const backlogReadiness = backlogItems.map((item) =>
    buildP0ReportActionReadiness(item.actionId, item.targetWorkspaceId || item.workspaceId || "")
  );
  const firstBacklogReadiness = firstBacklogItem ? backlogReadiness[0] : null;
  const backlogExecutableCount = backlogReadiness.filter((item) => item.canExecute).length;
  const backlogNotExecutableCount = backlogReadiness.filter((item) => !item.canExecute).length;
  const backlogReadinessSummary = buildP0ReportBacklogReadinessSummary(
    backlogItems.length,
    backlogExecutableCount,
    backlogNotExecutableCount,
    firstBacklogItem,
    firstBacklogReadiness
  );
  const completionSummary = buildP0ReportCompletionSummary(completionChecklist);
  const paperPreflightGates = paperPreflight?.gates ?? [];
  const paperPreflightLiveBoundary = paperPreflightGates.find((gate) => gate.id === "live-boundary");
  const currentGapTargetWorkspaceId = currentGap?.targetWorkspaceId || currentGap?.workspaceId || "";
  const currentGapActionId = currentGap?.actionId?.trim() ?? "";
  const currentGapReadiness = buildP0ReportActionReadiness(currentGapActionId, currentGapTargetWorkspaceId);
  const currentGapDeepLinkParams = new URLSearchParams();
  currentGapDeepLinkParams.set("workspace", currentGapTargetWorkspaceId);
  currentGapDeepLinkParams.set(
    "auditReportQuery",
    ["p0_readiness_report", runId, currentGap?.actionId ?? "", currentGapTargetWorkspaceId].filter(Boolean).join(" ")
  );
  currentGapDeepLinkParams.set("p0Action", currentGap?.actionId ?? "");
  const currentGapDeepLinkSearch = buildP0CurrentGapActionUrlSearch(currentGapDeepLinkParams) ?? "";

  return {
    schemaVersion: 1,
    eventId: `p0-readiness-report-${safeRunId}-${shortHash}`,
    eventType: "p0_readiness_report",
    runId,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: "P0 readiness report generated",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.passedSteps}/${
      summary.totalSteps
    } steps · current gap ${currentGap?.label ?? "none"} · backlog ${backlogReadinessSummary} · completion ${completionSummary}`,
    metadata: {
      artifactKind: "aiqt.p0ReadinessReport",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      progressPct: summary.progressPct,
      passedSteps: summary.passedSteps,
      totalSteps: summary.totalSteps,
      reviewSteps: summary.reviewSteps,
      blockedSteps: summary.blockedSteps,
      openStepCount: summary.openStepCount,
      currentGapStepId: currentGap?.stepId ?? "",
      currentGapLabel: currentGap?.label ?? "",
      currentGapStatus: currentGap?.status ?? "",
      currentGapWorkspaceId: currentGap?.workspaceId ?? "",
      currentGapActionId: currentGap?.actionId ?? "",
      currentGapActionLabel: currentGap?.actionLabel ?? "",
      currentGapTargetWorkspaceId: currentGap?.targetWorkspaceId ?? "",
      currentGapCanExecute: currentGapReadiness.canExecute,
      currentGapDeepLinkSearch,
      currentGapExecutableActionId: currentGapReadiness.executableActionId,
      currentGapReadinessReason: currentGapReadiness.reason,
      completionBlockedCount: completionChecklist?.blocked ?? 0,
      completionCurrentCriterionActionLabel: completionChecklist?.currentGap?.actionLabel ?? "",
      completionCurrentCriterionId: completionChecklist?.currentGap?.id ?? "",
      completionCurrentCriterionLabel: completionChecklist?.currentGap?.label ?? "",
      completionCurrentCriterionStatus: completionChecklist?.currentGap?.status ?? "",
      completionCurrentCriterionTargetWorkspaceId: completionChecklist?.currentGap?.targetWorkspaceId ?? "",
      completionOpenCriterionIds: completionChecklist?.openCriteria.map((criterion) => criterion.id).join(",") ?? "",
      completionPassedCount: completionChecklist?.passed ?? 0,
      completionProgressPct: completionChecklist?.progressPct ?? 0,
      completionReviewCount: completionChecklist?.review ?? 0,
      completionSummary,
      completionTotalCount: completionChecklist?.total ?? 0,
      latestEvidenceState: outcome.state,
      latestEvidenceId: outcome.evidenceId ?? outcome.runId ?? "",
      latestEvidenceLink: evidenceLink?.search ?? "",
      latestEvidencePreparationRunId: outcome.preparationEvidenceRunId ?? "",
      backlogCount: backlogItems.length,
      backlogExecutableCount,
      backlogNotExecutableCount,
      backlogReadinessSummary,
      firstBacklogCanExecute: firstBacklogReadiness?.canExecute ?? false,
      firstBacklogExecutableActionId: firstBacklogReadiness?.executableActionId ?? "",
      firstBacklogReadinessReason: firstBacklogReadiness?.reason ?? "missing-action",
      firstBacklogStepId: firstBacklogItem?.stepId ?? "",
      paperPreflightState: paperPreflight?.state ?? "",
      paperPreflightActionId: paperPreflight?.primaryActionId ?? "",
      paperPreflightActionLabel: paperPreflight?.primaryActionLabel ?? "",
      paperPreflightGateTotal: paperPreflightGates.length,
      paperPreflightGatePassedCount: paperPreflightGates.filter((gate) => gate.status === "passed").length,
      paperPreflightGateReviewCount: paperPreflightGates.filter((gate) => gate.status === "review").length,
      paperPreflightGateBlockedCount: paperPreflightGates.filter((gate) => gate.status === "blocked").length,
      paperPreflightLiveBoundary: paperPreflightLiveBoundary?.value ?? "",
      liveTradingAllowed: summary.liveBoundary.liveTradingAllowed,
      liveBoundary: summary.liveBoundary.label,
      boundary: "P0 readiness audit aid only; no live trading authorization or investment advice"
    }
  };
}

function buildP0ReportBacklogReadinessSummary(
  backlogCount: number,
  executableCount: number,
  notExecutableCount: number,
  firstBacklogItem: P0PlatformBacklogItem | null,
  firstBacklogReadiness: ReturnType<typeof buildP0ReportActionReadiness> | null
): string {
  const firstAction =
    firstBacklogReadiness?.executableActionId ||
    firstBacklogItem?.actionId?.trim() ||
    firstBacklogReadiness?.reason ||
    "none";
  const firstReason = firstBacklogReadiness?.reason ?? "none";
  return `${executableCount}/${backlogCount} executable, ${notExecutableCount} not executable · first ${firstAction} ${firstReason}`;
}

function buildP0ReportCompletionSummary(checklist: P0CompletionChecklist | null | undefined): string {
  if (!checklist) {
    return "not recorded";
  }
  const current = checklist.currentGap
    ? `current ${checklist.currentGap.id} ${checklist.currentGap.status}`
    : "current none";
  return `${checklist.passed}/${checklist.total} passed, ${checklist.review} review, ${checklist.blocked} blocked · ${current}`;
}

function buildP0ReportActionReadiness(actionId: string | null | undefined, workspaceId: string | null | undefined): {
  canExecute: boolean;
  executableActionId: string;
  reason: "missing-action" | "missing-workspace" | "ready" | "unknown-action";
} {
  const normalizedActionId = actionId?.trim() ?? "";
  const executableActionId = normalizeP0CurrentGapActionId(normalizedActionId);
  if (!normalizedActionId) {
    return { canExecute: false, executableActionId, reason: "missing-action" };
  }
  if (!isExecutableP0CurrentGapActionId(normalizedActionId)) {
    return { canExecute: false, executableActionId, reason: "unknown-action" };
  }
  if (!workspaceId?.trim()) {
    return { canExecute: false, executableActionId, reason: "missing-workspace" };
  }
  return { canExecute: true, executableActionId, reason: "ready" };
}

export function buildResearchContextReadinessReportAuditEvent(
  archive: ResearchContextReadinessReportArchive
): AuditEventRecord {
  const shortHash = archive.contentSha256.hash.slice(0, 16);
  const contextTokens = [
    sanitizeDownloadFileName(archive.context.market),
    sanitizeDownloadFileName(archive.context.symbol),
    sanitizeDownloadFileName(archive.context.timeframe)
  ];
  const runId = archive.lockedPreparationEvidenceRunId?.trim() || null;

  return {
    schemaVersion: 1,
    eventId: `research-context-readiness-report-${contextTokens.join("-")}-${shortHash}`,
    eventType: "research_context_readiness_report",
    runId,
    createdAt: archive.generatedAt,
    stage: "generated",
    source: "web",
    summary: "Research context readiness report generated",
    detail: `${archive.fileName} · sha256 ${archive.contentSha256.hash.slice(0, 12)} · ${archive.context.market.toUpperCase()} ${
      archive.context.symbol
    } ${archive.context.timeframe} · preflight ${archive.preflightStatus} · ready ${archive.readinessCounts.ready}/${
      archive.readinessCounts.review
    }/${archive.readinessCounts.blocked} · prep ${runId ?? "none"}`,
    metadata: {
      artifactKind: "aiqt.researchContextReadinessReport",
      fileName: archive.fileName,
      format: "text/markdown",
      contentSha256: archive.contentSha256.hash,
      contentSha256Algorithm: archive.contentSha256.algorithm,
      market: archive.context.market,
      symbol: archive.context.symbol,
      timeframe: archive.context.timeframe,
      preflightStatus: archive.preflightStatus,
      nextAction: archive.nextAction,
      lockedPreparationEvidenceRunId: archive.lockedPreparationEvidenceRunId ?? "",
      readinessReadyCount: archive.readinessCounts.ready,
      readinessReviewCount: archive.readinessCounts.review,
      readinessBlockedCount: archive.readinessCounts.blocked,
      contextLink: archive.contextLink ?? "",
      liveTradingAllowed: false,
      boundary: "research context readiness evidence only; no order routing, investment advice, or live trading authorization"
    }
  };
}

export async function buildExecutionAdapterPreLiveRunbookAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  runbook,
  workspace
}: {
  generatedAt?: string;
  markdown: string;
  runbook: ExecutionAdapterPreLiveRunbookSummary;
  workspace: TerminalWorkspace;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const symbol = workspace.selectedInstrument.symbol;
  const timeframe = workspace.selectedTimeframe;
  const safeAdapterId = sanitizeDownloadFileName(runbook.adapterId);
  const safeSymbol = sanitizeDownloadFileName(symbol);
  const safeTimeframe = sanitizeDownloadFileName(timeframe);
  const fileName = `${safeAdapterId}-${safeSymbol}-${safeTimeframe}-pre-live-runbook.md`;
  const evidenceIds = runbook.rows.map((row) => row.evidenceId).filter((id): id is string => Boolean(id));
  const reviewSteps = runbook.rows.filter((row) => row.status === "review").length;
  const blockedSteps = runbook.rows.filter((row) => row.status === "blocked").length;

  return {
    schemaVersion: 1,
    eventId: `pre-live-runbook-report-${safeAdapterId}-${safeSymbol}-${safeTimeframe}-${shortHash}`,
    eventType: "pre_live_runbook_report",
    runId: null,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Pre-live runbook report generated for ${runbook.adapterId}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${runbook.completedSteps}/${
      runbook.totalSteps
    } gates · ${runbook.status} · next ${runbook.nextStepId ?? "review"}`,
    metadata: {
      adapterId: runbook.adapterId,
      artifactKind: "aiqt.preLiveRunbookReport",
      boundary: "Pre-live runbook audit evidence only; no live trading authorization, order submission, or investment advice",
      completedSteps: runbook.completedSteps,
      contentSha256,
      contentSha256Algorithm: "sha256",
      evidenceIds,
      fileName,
      format: "text/markdown",
      gateRows: runbook.rows.map((row) => ({
        detail: row.detail,
        evidenceId: row.evidenceId ?? "",
        evidenceTimestamp: row.evidenceTimestamp ?? "",
        id: row.id,
        label: row.label,
        nextStep: row.nextStep,
        status: row.status,
        value: row.value
      })),
      liveTradingAllowed: false,
      market: runbook.market,
      nextStep: runbook.nextStep,
      nextStepId: runbook.nextStepId ?? "",
      reviewSteps,
      blockedSteps,
      status: runbook.status,
      symbol,
      timeframe,
      totalSteps: runbook.totalSteps
    }
  };
}

export async function buildOperatorRunbookAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  runbook,
  workspace
}: {
  generatedAt?: string;
  markdown: string;
  runbook: OperatorRunbookSummary;
  workspace: TerminalWorkspace;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const market = workspace.selectedInstrument.market;
  const symbol = workspace.selectedInstrument.symbol;
  const timeframe = workspace.selectedTimeframe;
  const safeAdapterId = sanitizeDownloadFileName(runbook.adapterId);
  const safeSymbol = sanitizeDownloadFileName(symbol);
  const safeTimeframe = sanitizeDownloadFileName(timeframe);
  const fileName = `${safeAdapterId}-${safeSymbol}-${safeTimeframe}-operator-runbook.md`;
  const sectionIds = runbook.sections.map((section) => section.id);
  const sectionStatuses = runbook.sections.map((section) => `${section.id}:${section.status}`);
  const sectionEvidence = runbook.sections.map((section) => `${section.id}:${section.evidence}`);
  const controlSnapshot = buildOperatorRunbookControlSnapshot(runbook);

  return {
    schemaVersion: 1,
    eventId: `operator-runbook-report-${safeAdapterId}-${safeSymbol}-${safeTimeframe}-${shortHash}`,
    eventType: "operator_runbook_report",
    runId: null,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Operator runbook report generated for ${runbook.adapterId}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${runbook.completedSections}/${
      runbook.totalSections
    } sections · ${runbook.status} · next ${runbook.nextActionId ?? "review"}`,
    metadata: {
      adapterId: runbook.adapterId,
      artifactKind: "aiqt.operatorRunbookReport",
      auditPackage: runbook.controls.auditPackage,
      boundary:
        "Operator runbook audit evidence only; no live trading authorization, order submission, route execution, or investment advice",
      completedSections: runbook.completedSections,
      contentSha256,
      contentSha256Algorithm: "sha256",
      controlSnapshot,
      dataFreshness: runbook.controls.dataFreshness,
      environmentState: runbook.controls.environmentState,
      fileName,
      format: "text/markdown",
      killSwitch: runbook.controls.killSwitch,
      liveOrderSubmitted: false,
      liveTradingAllowed: false,
      market,
      nextAction: runbook.nextAction,
      nextActionId: runbook.nextActionId ?? "",
      orderSubmissionEnabled: false,
      positionLimit: runbook.controls.positionLimit,
      rollbackOwner: runbook.controls.rollbackOwner,
      routeExecuted: false,
      sectionEvidence,
      sectionIds,
      sectionStatuses,
      status: runbook.status,
      symbol,
      timeframe,
      totalSections: runbook.totalSections
    }
  };
}

function buildOperatorRunbookControlSnapshot(runbook: OperatorRunbookSummary): string[] {
  return [
    `killSwitch=${runbook.controls.killSwitch}`,
    `rollbackOwner=${runbook.controls.rollbackOwner}`,
    `positionLimit=${runbook.controls.positionLimit}`,
    `dataFreshness=${runbook.controls.dataFreshness}`,
    `environmentState=${runbook.controls.environmentState}`,
    `auditPackage=${runbook.controls.auditPackage}`
  ];
}

export async function buildBacktestReportAuditEvent({
  experiment = null,
  generatedAt = new Date().toISOString(),
  markdown,
  runHistory = [],
  workspace
}: {
  experiment?: StrategyExperimentDetail | null;
  generatedAt?: string;
  markdown: string;
  runHistory?: ResearchRunAudit[];
  workspace: TerminalWorkspace;
}): Promise<AuditEventRecord | null> {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = `${sanitizeDownloadFileName(run.runId)}-backtest-report.md`;
  const auditedRun = runHistory.find((candidate) => candidate.runId === run.runId);
  const runComparisonRows = buildBacktestRunComparisonMatrixRows(runHistory, run.runId);
  const experimentEvidence = buildStrategyExperimentEvidenceSummary(workspace, experiment);

  return {
    schemaVersion: 1,
    eventId: `backtest-report-${sanitizeDownloadFileName(run.runId)}-${shortHash}`,
    eventType: "backtest_report",
    runId: run.runId,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Backtest Markdown report generated for ${run.runId}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${runComparisonRows.length} comparable runs`,
    metadata: {
      artifactKind: "aiqt.backtestReport",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      market: auditedRun?.market ?? workspace.selectedInstrument.market,
      symbol: auditedRun?.symbol ?? workspace.selectedInstrument.symbol,
      timeframe: run.timeframe,
      strategyRevision: run.strategyRevision,
      executionMode: auditedRun?.executionMode ?? run.executionMode,
      dataRows: auditedRun?.dataRows ?? run.dataRows,
      runComparisonRows: runComparisonRows.length,
      hasRunComparisonMatrix: markdown.includes("## Run Comparison Matrix"),
      ...(experimentEvidence
        ? {
            strategyExperimentId: experimentEvidence.experimentId,
            strategyExperimentDefinitionHash: experimentEvidence.definitionHash,
            strategyExperimentResultHash: experimentEvidence.resultHash,
            strategyExperimentSelectedCandidateId: experimentEvidence.selectedCandidateId,
            strategyExperimentHoldoutStatus: experimentEvidence.holdoutStatus
          }
        : {}),
      boundary: "historical audited evidence only; no investment advice"
    }
  };
}

export async function buildPortfolioBacktestReportAuditEvent({
  baseRunId,
  generatedAt = new Date().toISOString(),
  markdown,
  portfolio
}: {
  baseRunId?: string | null;
  generatedAt?: string;
  markdown: string;
  portfolio?: PortfolioBacktestRun | null;
}): Promise<AuditEventRecord | null> {
  const anchoredRunId = baseRunId?.trim();
  if (!anchoredRunId || !portfolio || !markdown.trim()) {
    return null;
  }

  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = `${sanitizeDownloadFileName(anchoredRunId)}-${sanitizeDownloadFileName(
    portfolio.market
  )}-${sanitizeDownloadFileName(portfolio.timeframe)}-portfolio-report.md`;
  const diagnostics = buildPortfolioBacktestDiagnosticRows(portfolio);
  const negativeContributionLegs = portfolio.legs.filter((leg) => leg.contributionValue < 0).length;
  const incompleteDataQuality =
    !portfolio.dataQuality.isComplete || portfolio.legs.some((leg) => !leg.dataQuality.isComplete);

  return {
    schemaVersion: 1,
    eventId: `portfolio-report-${sanitizeDownloadFileName(anchoredRunId)}-${shortHash}`,
    eventType: "portfolio_report",
    runId: anchoredRunId,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Portfolio Markdown report generated for ${portfolio.name}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${portfolio.legs.length} legs · ${
      diagnostics.length
    } diagnostics`,
    metadata: {
      artifactKind: "aiqt.portfolioReport",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      portfolioName: portfolio.name,
      market: portfolio.market,
      timeframe: portfolio.timeframe,
      initialCash: portfolio.initialCash,
      cashWeight: portfolio.cashWeight,
      legCount: portfolio.legs.length,
      equityRows: portfolio.equityCurve.length,
      allocationEventCount: portfolio.allocationEvents?.length ?? 0,
      rebalanceEventCount: portfolio.rebalanceEvents?.length ?? 0,
      tradeReviewEventCount: portfolio.tradeReviewEvents?.length ?? 0,
      preTradeRiskCheckCount: portfolio.preTradeRiskChecks?.length ?? 0,
      paperOrderEventCount: portfolio.paperOrderEvents?.length ?? 0,
      covarianceRiskContributionCount: portfolio.covarianceRisk?.contributions.length ?? 0,
      covarianceRiskAnnualizedVolatilityPct: portfolio.covarianceRisk?.annualizedVolatilityPct ?? null,
      diagnosticsCount: diagnostics.length,
      incompleteDataQuality,
      negativeContributionLegs,
      boundary: "historical audited portfolio evidence only; no investment advice"
    }
  };
}

export async function buildAuditSigningKeyRotationPlanAuditEvent(
  rotationPlan: AuditSigningKeyRotationPlan
): Promise<AuditEventRecord> {
  const legacyRegistryTemplateSha256 = await sha256TextHex(rotationPlan.legacyRegistryTemplate);
  const proposedKeyId = rotationPlan.proposedActiveKey.keyId;
  const shortTemplateHash = legacyRegistryTemplateSha256.slice(0, 12);
  const secretPlaceholderNames = rotationPlan.environmentUpdates
    .filter((update) => update.sensitivity === "secret")
    .map((update) => update.name);
  const blocked = rotationPlan.blockedReasons.length > 0;
  return {
    schemaVersion: 1,
    eventId: `audit-signing-key-rotation-${sanitizeDownloadFileName(proposedKeyId)}-${shortTemplateHash}`,
    eventType: "audit_signing_key_rotation_plan",
    runId: "audit-signing-key-rotation",
    createdAt: rotationPlan.generatedAt,
    stage: blocked ? "blocked" : "prepared",
    source: "web",
    summary: `Audit signing key rotation plan prepared for ${proposedKeyId}`,
    detail: `${rotationPlan.currentActiveKey.keyId} -> ${proposedKeyId} · legacy template sha256 ${shortTemplateHash} · ${
      rotationPlan.requiresRestart ? "restart required" : "no restart"
    }`,
    metadata: {
      currentKeyId: rotationPlan.currentActiveKey.keyId,
      currentKeyFingerprint: rotationPlan.currentActiveKey.fingerprint,
      proposedKeyId,
      proposedSigner: rotationPlan.proposedActiveKey.signer,
      proposedChainId: rotationPlan.proposedActiveKey.chainId,
      rotationRequired: rotationPlan.rotationRequired,
      requiresRestart: rotationPlan.requiresRestart,
      environmentUpdateNames: rotationPlan.environmentUpdates.map((update) => update.name),
      secretPlaceholderNames,
      legacyRegistryTemplateSha256,
      stepIds: rotationPlan.steps.map((step) => step.id),
      blockedReasons: rotationPlan.blockedReasons.slice()
    }
  };
}

export async function buildAuditSigningKeyRotationApplyAuditEvent(
  rotationApply: AuditSigningKeyRotationApply
): Promise<AuditEventRecord> {
  const digest = await sha256TextHex(
    JSON.stringify({
      blockedReasons: rotationApply.blockedReasons,
      generatedAt: rotationApply.generatedAt,
      proposedActiveKeyId: rotationApply.proposedActiveKeyId,
      requiredConfirmations: rotationApply.requiredConfirmations.map((confirmation) => [
        confirmation.id,
        confirmation.status
      ]),
      status: rotationApply.status
    })
  );
  const shortHash = digest.slice(0, 12);
  const missingConfirmationIds = rotationApply.requiredConfirmations
    .filter((confirmation) => confirmation.status === "missing")
    .map((confirmation) => confirmation.id);
  const confirmedConfirmationIds = rotationApply.requiredConfirmations
    .filter((confirmation) => confirmation.status === "confirmed")
    .map((confirmation) => confirmation.id);
  const blocked = rotationApply.status === "blocked";
  return {
    schemaVersion: 1,
    eventId: `audit-signing-key-rotation-apply-${sanitizeDownloadFileName(
      rotationApply.proposedActiveKeyId || "unknown"
    )}-${shortHash}`,
    eventType: "audit_signing_key_rotation_apply",
    runId: "audit-signing-key-rotation",
    createdAt: rotationApply.generatedAt,
    stage: rotationApply.status,
    source: "web",
    summary: `Audit signing key rotation apply ${blocked ? "blocked" : "ready"} for ${
      rotationApply.proposedActiveKeyId || "unknown"
    }`,
    detail: `${rotationApply.currentActiveKeyId} -> ${
      rotationApply.proposedActiveKeyId || "unknown"
    } · ${rotationApply.applyMode} · ${blocked ? rotationApply.blockedReasons.join(" / ") : "ready for restart"}`,
    metadata: {
      applyMode: rotationApply.applyMode,
      auditEventType: rotationApply.auditEventType,
      blockedReasons: rotationApply.blockedReasons.slice(),
      confirmedConfirmationIds,
      currentActiveKeyFingerprint: rotationApply.currentActiveKeyFingerprint,
      currentActiveKeyId: rotationApply.currentActiveKeyId,
      environmentUpdateNames: rotationApply.environmentUpdateNames.slice(),
      missingConfirmationIds,
      proposedActiveKeyId: rotationApply.proposedActiveKeyId,
      proposedChainId: rotationApply.proposedChainId,
      proposedSigner: rotationApply.proposedSigner,
      restartRequired: rotationApply.restartRequired,
      secretPlaceholderNames: rotationApply.secretPlaceholderNames.slice(),
      status: rotationApply.status
    }
  };
}

export async function withResearchRunExportAuditEvidenceArtifacts(
  exportPackage: ResearchRunExportPackage,
  summary: AuditEvidenceSummary,
  generatedAt?: string,
  runHistory: ResearchRunAudit[] = [],
  experiment: StrategyExperimentDetail | null = null
): Promise<ResearchRunExportPackage> {
  const resolvedGeneratedAt = generatedAt ?? new Date().toISOString();
  const backtestReport = await buildResearchRunExportBacktestReport(
    exportPackage,
    runHistory,
    resolvedGeneratedAt,
    experiment
  );
  return {
    ...exportPackage,
    auditEvidenceSummary: buildResearchRunExportAuditEvidenceSummary(summary, resolvedGeneratedAt),
    auditReport: await buildResearchRunExportAuditReport(summary, resolvedGeneratedAt),
    ...(backtestReport ? { backtestReport } : {})
  };
}

export function withResearchRunExportReportSignatures(
  exportPackage: ResearchRunExportPackage,
  auditEvents: AuditEventRecord[]
): ResearchRunExportPackage {
  const auditReportSignature = researchRunExportReportSignatureFromEvents({
    artifactKind: "aiqt.auditReport",
    eventType: "audit_evidence_report",
    events: auditEvents,
    report: exportPackage.auditReport
  });
  const backtestReportSignature = researchRunExportReportSignatureFromEvents({
    artifactKind: "aiqt.backtestReport",
    eventType: "backtest_report",
    events: auditEvents,
    report: exportPackage.backtestReport
  });

  return {
    ...exportPackage,
    ...(exportPackage.auditReport && auditReportSignature
      ? { auditReport: { ...exportPackage.auditReport, signature: auditReportSignature } }
      : {}),
    ...(exportPackage.backtestReport && backtestReportSignature
      ? { backtestReport: { ...exportPackage.backtestReport, signature: backtestReportSignature } }
      : {})
  };
}

function researchRunExportReportSignatureFromEvents({
  artifactKind,
  eventType,
  events,
  report
}: {
  artifactKind: ResearchRunExportAuditReport["kind"] | ResearchRunExportBacktestReport["kind"];
  eventType: "audit_evidence_report" | "backtest_report";
  events: AuditEventRecord[];
  report: ResearchRunExportAuditReport | ResearchRunExportBacktestReport | undefined;
}): ResearchRunExportReportSignature | undefined {
  if (!report) {
    return undefined;
  }

  for (const event of events) {
    const signature = event.metadata.signature;
    if (
      event.eventType === eventType &&
      event.runId === report.runId &&
      auditEventMetadataText(event.metadata, "artifactKind") === artifactKind &&
      auditEventMetadataText(event.metadata, "fileName") === report.fileName &&
      auditEventMetadataText(event.metadata, "contentSha256") === report.contentSha256.hash &&
      auditEventMetadataText(event.metadata, "contentSha256Algorithm") === report.contentSha256.algorithm &&
      isResearchRunExportReportSignature(signature)
    ) {
      return { ...signature, eventId: event.eventId };
    }
  }

  return undefined;
}

function auditEventMetadataText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

export async function loadResearchRunExport(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunExportResult> {
  try {
    const response = await fetcher(buildResearchRunExportUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunExportPayload(payload)) {
      throw new Error("Invalid research run export contract");
    }
    return {
      exportPackage: payload.export,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run export error"
    };
  }
}

export async function importResearchRunExport(
  baseUrl: string,
  exportPackage: ResearchRunExportPackage,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunImportResult> {
  try {
    const response = await fetcher(buildResearchRunImportUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exportPackage)
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isResearchRunImportPayload(payload)) {
      throw new Error("Invalid research run import contract");
    }
    const noteResult = await loadResearchNote(
      baseUrl,
      {
        market: payload.run.market,
        symbol: payload.run.symbol,
        timeframe: payload.run.timeframe
      },
      fetcher
    );
    const strategyLibraryResult = await loadStrategyLibrary(
      baseUrl,
      {
        market: payload.run.market,
        symbol: payload.run.symbol,
        limit: 12
      },
      fetcher
    );
    return {
      run: payload.run,
      note: noteResult.note,
      strategies: strategyLibraryResult.source === "core" ? strategyLibraryResult.strategies : undefined,
      undoToken: payload.undoToken,
      undo: payload.undo,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run import error"
    };
  }
}

export async function undoResearchRunImport(
  baseUrl: string,
  undoToken: string,
  expectedRunId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunImportUndoResult> {
  try {
    const response = await fetcher(buildResearchRunImportUndoUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ undoToken, expectedRunId })
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isResearchRunImportUndoPayload(payload)) {
      throw new Error("Invalid research run import undo contract");
    }
    return {
      undo: payload.undo,
      run: payload.run,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run import undo error"
    };
  }
}

function coreErrorDetail(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  return null;
}

export async function loadResearchNote(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const response = await fetcher(buildResearchNoteUrl(baseUrl, params.market, params.symbol, params.timeframe));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note load error"
    };
  }
}

export async function saveResearchNote(
  baseUrl: string,
  params: ResearchNoteSaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/research/notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        body: params.body
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note save error"
    };
  }
}

export async function loadHandoffNotes(
  baseUrl: string,
  subjectType: HandoffNoteSubjectType,
  subjectId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<HandoffNotesResult> {
  try {
    const response = await fetcher(buildHandoffNotesUrl(baseUrl, subjectType, subjectId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isHandoffNotesPayload(payload)) {
      throw new Error("Invalid handoff notes contract");
    }
    return {
      handoffNotes: payload.handoffNotes,
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      handoffNotes: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown handoff notes load error"
    };
  }
}

export async function saveHandoffNote(
  baseUrl: string,
  params: HandoffNoteSaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<HandoffNotesResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/handoff-notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        body: params.body,
        author: params.author ?? "local-operator",
        sourceWorkspace: params.sourceWorkspace ?? "research"
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isHandoffNoteSavePayload(payload)) {
      throw new Error("Invalid handoff note save contract");
    }
    return {
      handoffNotes: [payload.handoffNote],
      pagination: { limit: 1, offset: 0, total: 1 },
      source: "core"
    };
  } catch (error) {
    return {
      handoffNotes: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown handoff note save error"
    };
  }
}

export async function submitResearchRunPaperExecution(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionResult> {
  try {
    const response = await fetcher(buildResearchRunPaperExecutionsUrl(baseUrl, runId), {
      method: "POST"
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPaperExecutionPayload(payload)) {
      throw new Error("Invalid paper execution contract");
    }
    return {
      execution: payload.execution,
      promotion: payload.promotion,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown paper execution error"
    };
  }
}

export async function loadResearchRunPromotion(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PromotionCandidateResult> {
  try {
    const response = await fetcher(buildResearchRunPromotionUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPromotionCandidatePayload(payload)) {
      throw new Error("Invalid promotion candidate contract");
    }
    return {
      promotion: payload.promotion,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown promotion candidate error"
    };
  }
}

export async function saveAiReviewRunRecord(
  baseUrl: string,
  record: AiReviewRunRecord,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewRunRecordResult> {
  try {
    const response = await fetcher(buildResearchRunAiReviewsUrl(baseUrl, record.runId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isAiReviewRunRecordPayload(payload)) {
      throw new Error("Invalid AI review run record contract");
    }
    return {
      aiReview: payload.aiReview,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown AI review run record save error"
    };
  }
}

export async function runP0AiReview(
  baseUrl: string,
  params: P0AiReviewRunParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0AiReviewRunResult> {
  try {
    const response = await fetcher(buildP0AiReviewUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const payload = await response.json();
    if (!response.ok) {
      return {
        source: isCoreErrorPayload(payload) ? "core" : "fallback",
        statusLabel: "P0 AI review failed",
        error: coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`
      };
    }
    if (!isP0AiReviewRunPayload(payload)) {
      throw new Error("Invalid P0 AI review contract");
    }
    return {
      aiReview: payload.aiReview,
      source: "core",
      statusLabel: "P0 AI review saved",
      mode: payload.mode,
      paperOnly: payload.paperOnly,
      liveTradingAllowed: payload.liveTradingAllowed,
      directTradingInstructionBlocked: payload.directTradingInstructionBlocked
    };
  } catch (error) {
    return {
      source: "fallback",
      statusLabel: "P0 AI review failed",
      error: error instanceof Error ? error.message : "Unknown P0 AI review error"
    };
  }
}

export async function runP0PaperSimulation(
  baseUrl: string,
  params: P0PaperSimulationParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0PaperSimulationRunResult> {
  try {
    const response = await fetcher(buildP0PaperSimulationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const payload = await response.json();
    if (!response.ok) {
      return {
        source: isCoreErrorPayload(payload) ? "core" : "fallback",
        statusLabel: "P0 paper simulation failed",
        error: coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`
      };
    }
    if (!isP0PaperSimulationPayload(payload)) {
      throw new Error("Invalid P0 paper simulation contract");
    }
    return {
      simulation: payload,
      execution: payload.execution,
      simulatedFill: payload.simulatedFill,
      accountReplay: payload.accountReplay,
      auditEvent: payload.auditEvent,
      exportReadiness: payload.exportReadiness,
      promotion: payload.promotion,
      source: "core",
      statusLabel: "P0 paper simulation created",
      paperOnly: payload.paperOnly,
      liveTradingAllowed: payload.liveTradingAllowed,
      orderSubmitted: payload.orderSubmitted ?? false,
      liveOrderSubmitted: payload.liveOrderSubmitted ?? false,
      routeExecuted: payload.routeExecuted ?? false,
      liveRouteBlockedReason: payload.liveRouteBlockedReason
    };
  } catch (error) {
    return {
      source: "fallback",
      statusLabel: "P0 paper simulation failed",
      error: error instanceof Error ? error.message : "Unknown P0 paper simulation error"
    };
  }
}

export async function loadP0AcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0AcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP0AcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP0AcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P0 acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P0 acceptance readback error";
    return {
      acceptance: buildMissingP0AcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP0AcceptanceStatus(reason: string): P0AcceptanceStatus {
  return {
    kind: "aiqt.p0AcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p0-acceptance.json",
    summary: "P0 acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    checkCount: 0,
    requiredCheckCount: 4,
    checkIds: [],
    paperOnly: false,
    liveTradingAllowed: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP1AcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P1AcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP1AcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP1AcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P1 acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P1 acceptance readback error";
    return {
      acceptance: buildMissingP1AcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP1AcceptanceStatus(reason: string): P1AcceptanceStatus {
  return {
    kind: "aiqt.p1AcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p1-acceptance.json",
    summary: "P1 acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    timeframe: null,
    watchlistRefreshRunId: null,
    queuedMarket: null,
    queuedSymbol: null,
    watchlistCount: 0,
    checkCount: 0,
    requiredCheckCount: 8,
    checkIds: [],
    paperOnly: false,
    liveTradingAllowed: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadDesktopReleaseLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<DesktopReleaseLatestResult> {
  try {
    const response = await fetcher(buildDesktopReleaseLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isDesktopReleaseLatestPayload(payload)) {
      throw new Error("Invalid desktop release status contract");
    }
    return {
      release: payload.release,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown desktop release readback error";
    return {
      release: buildMissingDesktopReleaseStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingDesktopReleaseStatus(reason: string): DesktopReleaseStatus {
  return {
    kind: "aiqt.desktopReleaseStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/desktop-release.json",
    summary: "Desktop release manifest is missing.",
    reason,
    generatedAt: null,
    platform: null,
    version: null,
    tauriConfigPath: null,
    desktopArtifactPath: null,
    checkCount: 0,
    requiredCheckCount: 5,
    checkIds: [],
    paperOnly: false,
    liveTradingAllowed: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadStage1DailyUseLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1DailyUseLatestResult> {
  try {
    const response = await fetcher(buildStage1DailyUseLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1DailyUseLatestPayload(payload)) {
      throw new Error("Invalid Stage 1 daily-use report contract");
    }
    return {
      dailyUse: payload.dailyUse,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 daily-use readback error";
    return {
      dailyUse: buildMissingStage1DailyUseReport(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateStage1DailyUse(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1DailyUseGenerateResult> {
  try {
    const response = await fetcher(buildStage1DailyUseUrl(baseUrl), {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1DailyUseGeneratePayload(payload)) {
      throw new Error("Invalid Stage 1 daily-use generation contract");
    }
    return {
      dailyUse: payload.dailyUse,
      status: payload.status,
      source: "core",
      paperOnly: payload.paperOnly,
      orderSubmissionEnabled: payload.orderSubmissionEnabled,
      liveTradingAllowed: payload.liveTradingAllowed,
      liveOrderSubmitted: payload.liveOrderSubmitted,
      routeExecuted: payload.routeExecuted
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 daily-use generation error";
    return {
      dailyUse: buildMissingStage1DailyUseReport(message),
      status: "daily_use_failed",
      source: "fallback",
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      error: message
    };
  }
}

function buildMissingStage1DailyUseReport(reason: string): Stage1DailyUseReport {
  const row = (id: string, label: string): Stage1DailyUseReportRow => ({
    id,
    label,
    status: "blocked",
    value: "Stage 1 report unavailable",
    summary: "Stage 1 daily-use report is missing.",
    action: "npm run stage1:daily",
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true
  });
  return {
    kind: "aiqt.stage1DailyUseReport",
    schemaVersion: 1,
    generatedAt: null,
    status: "missing",
    summary: "Stage 1 daily-use report is missing.",
    reason,
    readyCount: 0,
    totalCount: 5,
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true,
    sourcePath: "data/stage1-daily-use.json",
    sourcePaths: {
      p0Acceptance: "data/p0-acceptance.json",
      p1Acceptance: "data/p1-acceptance.json",
      desktopRelease: "data/desktop-release.json"
    },
    rows: [
      row("clean-open", "Clean environment startup"),
      row("market-refresh-recovery", "Market refresh recovery"),
      row("research-entry", "Research entry"),
      row("daily-start", "Daily start path"),
      row("desktop-release", "Desktop release")
    ]
  };
}

export async function loadStage1BootstrapPreflightLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1BootstrapPreflightLatestResult> {
  try {
    const response = await fetcher(buildStage1BootstrapPreflightLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1BootstrapPreflightLatestPayload(payload)) {
      throw new Error("Invalid Stage 1 bootstrap preflight contract");
    }
    return {
      preflight: payload.preflight,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 bootstrap preflight readback error";
    return {
      preflight: buildMissingStage1BootstrapPreflight(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateStage1BootstrapPreflight(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1BootstrapPreflightGenerateResult> {
  try {
    const response = await fetcher(buildStage1BootstrapPreflightUrl(baseUrl), {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1BootstrapPreflightGeneratePayload(payload)) {
      throw new Error("Invalid Stage 1 bootstrap preflight generation contract");
    }
    return {
      preflight: payload.preflight,
      status: payload.status,
      source: "core",
      paperOnly: payload.paperOnly,
      orderSubmissionEnabled: payload.orderSubmissionEnabled,
      liveTradingAllowed: payload.liveTradingAllowed,
      liveOrderSubmitted: payload.liveOrderSubmitted,
      routeExecuted: payload.routeExecuted
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 bootstrap preflight generation error";
    return {
      preflight: buildMissingStage1BootstrapPreflight(message),
      status: "preflight_failed",
      source: "fallback",
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      error: message
    };
  }
}

function buildMissingStage1BootstrapPreflight(reason: string): Stage1BootstrapPreflight {
  const check = (id: string, label: string, sourcePath: string, recommendedCommand: string): Stage1BootstrapPreflightCheck => ({
    id,
    label,
    status: "blocked",
    summary: "Stage 1 bootstrap preflight report is missing.",
    recommendedCommand,
    sourcePath,
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true
  });
  return {
    kind: "aiqt.stage1BootstrapPreflight",
    schemaVersion: 1,
    generatedAt: null,
    status: "missing",
    summary: "Stage 1 bootstrap preflight report is missing.",
    reason,
    ready: false,
    readyCount: 0,
    reviewCount: 0,
    blockedCount: 7,
    totalCount: 7,
    nextAction: "run-stage1-bootstrap-preflight",
    recommendedCommand: "npm run stage1:preflight",
    blockerIds: [
      "package-scripts",
      "p0-acceptance",
      "p1-acceptance",
      "p2-manifest-chain",
      "desktop-release",
      "stage1-daily-use",
      "live-blocked-boundary"
    ],
    reviewIds: [],
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true,
    sourcePath: "data/stage1-bootstrap-preflight.json",
    sourcePaths: {
      p0Acceptance: "data/p0-acceptance.json",
      p1Acceptance: "data/p1-acceptance.json",
      p2ManifestChainPreflight: "data/p2-chain-preflight.json",
      desktopRelease: "data/desktop-release.json",
      stage1DailyUse: "data/stage1-daily-use.json"
    },
    checks: [
      check(
        "package-scripts",
        "Package scripts",
        "package.json",
        "node tools/run_python.mjs tools/stage1_prepare.py --mode full --dry-run"
      ),
      check("p0-acceptance", "P0 acceptance", "data/p0-acceptance.json", "npm run docker:smoke:p0 -- --no-build --down"),
      check("p1-acceptance", "P1 acceptance", "data/p1-acceptance.json", "npm run docker:smoke:p1 -- --no-build --down"),
      check("p2-manifest-chain", "P2 manifest chain", "data/p2-chain-preflight.json", "npm run docker:smoke:p2:preflight"),
      check("desktop-release", "Desktop release", "data/desktop-release.json", "npm run desktop:release"),
      check("stage1-daily-use", "Stage 1 daily use", "data/stage1-daily-use.json", "npm run stage1:daily"),
      check("live-blocked-boundary", "Live-blocked boundary", "data", "npm run stage1:preflight:validate")
    ]
  };
}

export async function loadP2PreLiveAcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2PreLiveAcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP2PreLiveAcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2PreLiveAcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P2 pre-live acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 pre-live acceptance readback error";
    return {
      acceptance: buildMissingP2PreLiveAcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP2PreLiveAcceptanceStatus(reason: string): P2PreLiveAcceptanceStatus {
  return {
    kind: "aiqt.p2PreLiveAcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-pre-live-acceptance.json",
    summary: "P2 pre-live acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    adapterId: null,
    promotionStatus: null,
    checklistStatus: null,
    passedGateCount: 0,
    totalGateCount: 0,
    blockingGateCount: 0,
    gateIds: [],
    blockerIds: [],
    auditEventIds: [],
    checkCount: 0,
    requiredCheckCount: 6,
    checkIds: [],
    manualRouteCandidate: false,
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP2PaperReplayLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2PaperReplayLatestResult> {
  try {
    const response = await fetcher(buildP2PaperReplayLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2PaperReplayLatestPayload(payload)) {
      throw new Error("Invalid P2 paper replay status contract");
    }
    return {
      replay: payload.replay,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 paper replay readback error";
    return {
      replay: buildMissingP2PaperReplayStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP2PaperReplayStatus(reason: string): P2PaperReplayStatus {
  return {
    kind: "aiqt.p2PaperReplayStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-paper-replay.json",
    summary: "P2 paper replay manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    adapterId: null,
    replayStatus: null,
    passedCheckCount: 0,
    totalCheckCount: 0,
    warningCount: 0,
    requiredCheckCount: 8,
    checkCount: 0,
    checkIds: [],
    auditEventIds: [],
    latestEvidenceId: null,
    metrics: {
      filledPaperOrders: 0,
      portfolioOrders: 0,
      approvedPortfolioOrders: 0,
      portfolioFilledOrders: 0,
      stateHistoryFilledEvents: 0,
      adapterPaperExecutions: 0,
      replayWarnings: 0
    },
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP2ReadinessAcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ReadinessAcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP2ReadinessAcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2ReadinessAcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P2 readiness acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 readiness acceptance readback error";
    return {
      acceptance: buildMissingP2ReadinessAcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateP2ReadinessAcceptance(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ReadinessAcceptanceGenerateResult> {
  try {
    const response = await fetcher(buildP2ReadinessAcceptanceUrl(baseUrl), {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2ReadinessAcceptanceGeneratePayload(payload)) {
      throw new Error("Invalid P2 readiness acceptance generation contract");
    }
    return {
      acceptance: payload.acceptance,
      auditEvent: payload.auditEvent,
      status: payload.status,
      source: "core",
      paperOnly: payload.paperOnly,
      orderSubmissionEnabled: payload.orderSubmissionEnabled,
      liveTradingAllowed: payload.liveTradingAllowed,
      liveOrderSubmitted: payload.liveOrderSubmitted,
      routeExecuted: payload.routeExecuted
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 readiness acceptance generation error";
    return {
      acceptance: buildMissingP2ReadinessAcceptanceStatus(message),
      status: "acceptance_failed",
      source: "fallback",
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      error: message
    };
  }
}

function buildMissingP2ReadinessAcceptanceStatus(reason: string): P2ReadinessAcceptanceReadbackStatus {
  return {
    kind: "aiqt.p2ReadinessAcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-readiness-acceptance.json",
    summary: "P2 readiness acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    adapterId: null,
    p1AcceptanceRunId: null,
    p2PreLiveAcceptanceRunId: null,
    p2PaperReplayRunId: null,
    operatorRunbookAuditEventId: null,
    readinessCoverageStatus: null,
    acceptedCriterionCount: 0,
    totalCriterionCount: 0,
    blockingCriterionCount: 0,
    criterionIds: [],
    auditEventIds: [],
    manifestPaths: {
      p1Acceptance: null,
      p2PreLiveAcceptance: null,
      p2PaperReplay: null
    },
    checkCount: 0,
    requiredCheckCount: 6,
    checkIds: [],
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP2ManifestChainPreflightLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ManifestChainPreflightLatestResult> {
  try {
    const response = await fetcher(buildP2ManifestChainPreflightLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2ManifestChainPreflightLatestPayload(payload)) {
      throw new Error("Invalid P2 manifest chain preflight status contract");
    }
    return {
      preflight: payload.preflight,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 manifest chain preflight readback error";
    return {
      preflight: buildMissingP2ManifestChainPreflightStatus(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateP2ManifestChainPreflight(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ManifestChainPreflightGenerateResult> {
  try {
    const response = await fetcher(buildP2ManifestChainPreflightUrl(baseUrl), {
      method: "POST"
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isP2ManifestChainPreflightGeneratePayload(payload)) {
      throw new Error("Invalid P2 manifest chain preflight generation contract");
    }
    return {
      preflight: payload.preflight,
      auditEvent: payload.auditEvent,
      status: "preflight_generated",
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 manifest chain preflight generation error";
    return {
      preflight: buildMissingP2ManifestChainPreflightStatus(message),
      status: "preflight_failed",
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP2ManifestChainPreflightStatus(reason: string): P2ManifestChainPreflightStatus {
  return {
    kind: "aiqt.p2ManifestChainPreflightStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-chain-preflight.json",
    summary: "P2 manifest chain preflight is missing.",
    reason,
    ready: false,
    validStageCount: 0,
    totalStageCount: 4,
    blockerIds: [],
    nextAction: "run-p1-acceptance",
    nextCommand: "npm run docker:smoke:p1 -- --no-build",
    stages: [],
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadResearchRunAiReviews(
  baseUrl: string,
  runId: string,
  paramsOrFetcher: AiReviewRunHistoryParams | WorkspaceFetcher = {},
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewRunHistoryResult> {
  const params = typeof paramsOrFetcher === "function" ? {} : paramsOrFetcher;
  const fetcher = typeof paramsOrFetcher === "function" ? paramsOrFetcher : maybeFetcher;
  try {
    const response = await fetcher(buildResearchRunAiReviewsUrl(baseUrl, runId, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAiReviewRunHistoryPayload(payload)) {
      throw new Error("Invalid AI review run history contract");
    }
    return {
      aiReviews: payload.aiReviews,
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      aiReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown AI review run history error"
    };
  }
}

export async function saveAuditEvent(
  baseUrl: string,
  event: AuditEventRecord,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditEventResult> {
  try {
    const response = await fetcher(buildAuditEventsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isAuditEventPayload(payload)) {
      throw new Error("Invalid audit event contract");
    }
    return {
      event: payload.event,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit event save error"
    };
  }
}

export async function loadAuditEvents(
  baseUrl: string,
  paramsOrFetcher: AuditEventHistoryParams | WorkspaceFetcher = {},
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditEventHistoryResult> {
  const params = typeof paramsOrFetcher === "function" ? {} : paramsOrFetcher;
  const fetcher = typeof paramsOrFetcher === "function" ? paramsOrFetcher : maybeFetcher;
  try {
    const response = await fetcher(buildAuditEventsUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditEventHistoryPayload(payload)) {
      throw new Error("Invalid audit event history contract");
    }
    return {
      events: payload.events,
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      events: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit event history error"
    };
  }
}

export async function signAuditReportEvent(
  baseUrl: string,
  eventId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportSignature(buildAuditReportSignUrl(baseUrl), eventId, undefined, fetcher, "sign");
}

export async function verifyAuditReportEvent(
  baseUrl: string,
  eventId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportSignature(buildAuditReportVerifyUrl(baseUrl), eventId, undefined, fetcher, "verify");
}

export async function verifyResearchRunExportReportSignature(
  baseUrl: string,
  report: ResearchRunExportAuditReport | ResearchRunExportBacktestReport,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportPackageSignature(buildAuditReportVerifyPackageUrl(baseUrl), report, fetcher);
}

export async function withVerifiedResearchRunExportPackageReportSignatures(
  baseUrl: string,
  exportPackage: ResearchRunExportPackage,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunExportPackage> {
  const [auditReport, backtestReport] = await Promise.all([
    verifyResearchRunExportPackageReportIfNeeded(baseUrl, exportPackage.auditReport, fetcher),
    verifyResearchRunExportPackageReportIfNeeded(baseUrl, exportPackage.backtestReport, fetcher)
  ]);
  return {
    ...exportPackage,
    ...(auditReport ? { auditReport } : {}),
    ...(backtestReport ? { backtestReport } : {})
  };
}

export async function revokeAuditReportEvent(
  baseUrl: string,
  eventId: string,
  reason = "manual audit revocation",
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportSignature(buildAuditReportRevokeUrl(baseUrl), eventId, reason, fetcher, "revoke");
}

async function mutateAuditReportSignature(
  url: string,
  eventId: string,
  reason: string | undefined,
  fetcher: WorkspaceFetcher,
  action: "sign" | "verify" | "revoke"
): Promise<AuditReportSignatureResult> {
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reason === undefined ? { eventId } : { eventId, reason })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isAuditReportSignaturePayload(payload)) {
        return {
          event: payload.event,
          signature: payload.signature,
          verification: payload.verification,
          source: "core",
          error: payload.verification.reason
        };
      }
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isAuditReportSignaturePayload(payload)) {
      throw new Error("Invalid audit report signature contract");
    }
    return {
      event: payload.event,
      signature: payload.signature,
      verification: payload.verification,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : `Unknown audit report ${action} error`
    };
  }
}

async function verifyResearchRunExportPackageReportIfNeeded<
  TReport extends ResearchRunExportAuditReport | ResearchRunExportBacktestReport
>(
  baseUrl: string,
  report: TReport | undefined,
  fetcher: WorkspaceFetcher
): Promise<TReport | undefined> {
  if (!report || !researchRunExportReportSignatureNeedsVerification(report.signature)) {
    return report;
  }
  const result = await verifyResearchRunExportReportSignature(baseUrl, report, fetcher);
  if (result.source !== "core" || !isResearchRunExportReportSignature(result.signature) || !result.verification) {
    return report;
  }
  return {
    ...report,
    signature: {
      ...result.signature,
      importVerificationReason: result.verification.reason,
      importVerificationSource: "local-core",
      importVerificationStatus: result.verification.status,
      ...(result.signature.verifiedAt ? { importVerifiedAt: result.signature.verifiedAt } : {})
    }
  };
}

function researchRunExportReportSignatureNeedsVerification(
  signature: ResearchRunExportReportSignature | undefined
): boolean {
  return (
    Boolean(signature?.eventId?.trim()) &&
    (signature?.status === "signed" || signature?.status === "verified")
  );
}

async function mutateAuditReportPackageSignature(
  url: string,
  report: ResearchRunExportAuditReport | ResearchRunExportBacktestReport,
  fetcher: WorkspaceFetcher
): Promise<AuditReportSignatureResult> {
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isAuditReportSignaturePayload(payload)) {
        return {
          event: payload.event,
          signature: payload.signature,
          verification: payload.verification,
          source: "core",
          error: payload.verification.reason
        };
      }
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isAuditReportSignaturePayload(payload)) {
      throw new Error("Invalid package report signature contract");
    }
    return {
      event: payload.event,
      signature: payload.signature,
      verification: payload.verification,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown package report signature verification error"
    };
  }
}

export async function loadAuditSigningKeys(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRegistryResult> {
  try {
    const response = await fetcher(buildAuditSigningKeysUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRegistryPayload(payload)) {
      throw new Error("Invalid audit signing key registry contract");
    }
    return {
      registry: payload.registry,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key registry error"
    };
  }
}

export async function prepareAuditSigningKeyRotationPlan(
  baseUrl: string,
  params: AuditSigningKeyRotationPlanParams = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationPlanResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationPlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedChainId: params.proposedChainId ?? "",
        proposedKeyId: params.proposedKeyId ?? "",
        proposedSigner: params.proposedSigner ?? ""
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationPlanPayload(payload)) {
      throw new Error("Invalid audit signing key rotation plan contract");
    }
    return {
      rotationPlan: payload.rotationPlan,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation plan error"
    };
  }
}

export async function applyAuditSigningKeyRotationPlan(
  baseUrl: string,
  params: AuditSigningKeyRotationApplyParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationApplyResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationApplyUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmations: {
          legacySecretStored: params.confirmations.legacySecretStored === true,
          newSecretMaterialStored: params.confirmations.newSecretMaterialStored === true,
          operatorReviewedPlan: params.confirmations.operatorReviewedPlan === true
        },
        rotationPlan: params.rotationPlan
      })
    });
    if (!response.ok && response.status !== 409) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationApplyPayload(payload)) {
      throw new Error("Invalid audit signing key rotation apply contract");
    }
    return {
      rotationApply: payload.rotationApply,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation apply error"
    };
  }
}

export async function recordAuditSigningKeyControlledRestartEvidence(
  baseUrl: string,
  request: AuditSigningKeyControlledRestartEvidenceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyControlledRestartEvidenceResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationRestartEvidenceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applyEventId: request.applyEventId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyControlledRestartEvidencePayload(payload)) {
      return {
        restartEvidence: payload.restartEvidence,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid audit signing key controlled restart evidence contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key controlled restart evidence error"
    };
  }
}

export async function recordAuditSigningKeySecretMaterialization(
  baseUrl: string,
  request: AuditSigningKeySecretMaterializationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeySecretMaterializationResult> {
  try {
    const response = await fetcher(buildAuditSigningKeySecretMaterializationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planEventId: request.planEventId,
        operator: request.operator ?? "local-operator",
        backend: request.backend,
        manifestPath: request.manifestPath,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeySecretMaterializationPayload(payload)) {
      return {
        secretMaterialization: payload.secretMaterialization,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid audit signing key secret materialization contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key secret materialization error"
    };
  }
}

export async function loadAuditSigningKeySecretMaterializations(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeySecretMaterializationHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeySecretMaterializationHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeySecretMaterializationHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key secret materialization history contract");
    }
    return {
      secretMaterializations: payload.secretMaterializations,
      source: "core"
    };
  } catch (error) {
    return {
      secretMaterializations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key secret materialization history error"
    };
  }
}

export async function recordAuditSigningKeyEnvironmentBinding(
  baseUrl: string,
  request: AuditSigningKeyEnvironmentBindingRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyEnvironmentBindingResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyEnvironmentBindingUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materializationId: request.materializationId,
        operator: request.operator ?? "local-operator",
        bindingMode: request.bindingMode ?? "container_env_reference",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyEnvironmentBindingPayload(payload)) {
      return {
        environmentBinding: payload.environmentBinding,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid audit signing key environment binding contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key environment binding error"
    };
  }
}

export async function loadAuditSigningKeyEnvironmentBindings(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyEnvironmentBindingHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyEnvironmentBindingHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyEnvironmentBindingHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key environment binding history contract");
    }
    return {
      environmentBindings: payload.environmentBindings,
      source: "core"
    };
  } catch (error) {
    return {
      environmentBindings: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key environment binding history error"
    };
  }
}

export async function recordAuditSigningKeyRuntimeReloadPlan(
  baseUrl: string,
  request: AuditSigningKeyRuntimeReloadPlanRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRuntimeReloadPlanResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRuntimeReloadPlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bindingId: request.bindingId,
        operator: request.operator ?? "local-operator",
        reloadMode: request.reloadMode ?? "manual_container_reload_plan",
        maintenanceWindowId: request.maintenanceWindowId,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyRuntimeReloadPlanPayload(payload)) {
      return {
        runtimeReloadPlan: payload.runtimeReloadPlan,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid audit signing key runtime reload plan contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload plan error"
    };
  }
}

export async function loadAuditSigningKeyRuntimeReloadPlans(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyRuntimeReloadPlanHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyRuntimeReloadPlanHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRuntimeReloadPlanHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key runtime reload plan history contract");
    }
    return {
      runtimeReloadPlans: payload.runtimeReloadPlans,
      source: "core"
    };
  } catch (error) {
    return {
      runtimeReloadPlans: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload plan history error"
    };
  }
}

export async function recordAuditSigningKeyRuntimeReloadExecution(
  baseUrl: string,
  request: AuditSigningKeyRuntimeReloadExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRuntimeReloadExecutionResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRuntimeReloadExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: request.planId,
        operator: request.operator ?? "local-operator",
        executionMode: request.executionMode ?? "manual_controlled_reload_evidence",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyRuntimeReloadExecutionPayload(payload)) {
      return {
        runtimeReloadExecution: payload.runtimeReloadExecution,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid audit signing key runtime reload execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload execution error"
    };
  }
}

export async function loadAuditSigningKeyRuntimeReloadExecutions(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyRuntimeReloadExecutionHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRuntimeReloadExecutionHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key runtime reload execution history contract");
    }
    return {
      runtimeReloadExecutions: payload.runtimeReloadExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      runtimeReloadExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key runtime reload execution history error"
    };
  }
}

export async function recordAuditSigningKeyRotationAcceptance(
  baseUrl: string,
  request: AuditSigningKeyRotationAcceptanceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationAcceptanceResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationAcceptanceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionId: request.executionId,
        operator: request.operator ?? "local-operator",
        acceptanceMode: request.acceptanceMode ?? "manual_rotation_acceptance",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isAuditSigningKeyRotationAcceptancePayload(payload)) {
      return {
        rotationAcceptance: payload.rotationAcceptance,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid audit signing key rotation acceptance contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation acceptance error"
    };
  }
}

export async function loadAuditSigningKeyRotationAcceptances(
  baseUrl: string,
  proposedKeyId = "",
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<AuditSigningKeyRotationAcceptanceHistoryResult> {
  try {
    const response = await fetcher(
      buildAuditSigningKeyRotationAcceptanceHistoryUrl(baseUrl, { proposedKeyId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationAcceptanceHistoryPayload(payload)) {
      throw new Error("Invalid audit signing key rotation acceptance history contract");
    }
    return {
      rotationAcceptances: payload.rotationAcceptances,
      source: "core"
    };
  } catch (error) {
    return {
      rotationAcceptances: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation acceptance history error"
    };
  }
}

export async function loadPlatformSettings(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PlatformSettingsResult> {
  try {
    const response = await fetcher(buildSettingsStatusUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPlatformSettingsPayload(payload)) {
      throw new Error("Invalid settings status contract");
    }
    return {
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown settings status error"
    };
  }
}

export async function loadExecutionAdapterLedger(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterLedgerResult> {
  try {
    const response = await fetcher(buildExecutionAdapterLedgerUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterLedgerPayload(payload)) {
      throw new Error("Invalid execution adapter ledger contract");
    }
    return {
      adapterLedger: payload.adapterLedger,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter ledger error"
    };
  }
}

export async function recordExecutionAdapterCertification(
  baseUrl: string,
  request: ExecutionAdapterCertificationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterCertificationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        market: request.market,
        route: request.route,
        operator: request.operator ?? "local-operator",
        startedAt: request.startedAt,
        completedAt: request.completedAt,
        checks: request.checks,
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isExecutionAdapterCertificationRecordPayload(payload)) {
      throw new Error("Invalid execution adapter certification record contract");
    }
    return {
      adapterCertification: payload.adapterCertification,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification record error"
    };
  }
}

export async function recordExecutionAdapterCertificationApply(
  baseUrl: string,
  request: ExecutionAdapterCertificationApplyRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterCertificationApplyRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationApplyUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certificationId: request.certificationId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterCertificationApplyRecordPayload(payload)) {
      return {
        certificationApply: payload.certificationApply,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter certification apply contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification apply error"
    };
  }
}

export async function recordExecutionAdapterControlledRestartEvidence(
  baseUrl: string,
  request: ExecutionAdapterControlledRestartEvidenceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterControlledRestartEvidenceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterControlledRestartEvidenceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applyId: request.applyId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterControlledRestartEvidenceRecordPayload(payload)) {
      return {
        controlledRestartEvidence: payload.controlledRestartEvidence,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter controlled restart evidence contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter controlled restart evidence error"
    };
  }
}

export async function recordExecutionAdapterRestartAcceptance(
  baseUrl: string,
  request: ExecutionAdapterRestartAcceptanceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRestartAcceptanceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRestartAcceptanceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evidenceId: request.evidenceId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRestartAcceptanceRecordPayload(payload)) {
      return {
        restartAcceptance: payload.restartAcceptance,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter restart acceptance contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter restart acceptance error"
    };
  }
}

export async function recordExecutionAdapterSecretReference(
  baseUrl: string,
  request: ExecutionAdapterSecretReferenceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSecretReferenceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretReferenceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        market: request.market,
        route: request.route,
        operator: request.operator ?? "local-operator",
        referenceName: request.referenceName,
        backend: request.backend,
        requiredEnvVars: request.requiredEnvVars,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSecretReferenceRecordPayload(payload)) {
      return {
        adapterSecretReference: payload.adapterSecretReference,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter secret reference contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret reference error"
    };
  }
}

export async function recordExecutionAdapterSecretMaterialization(
  baseUrl: string,
  request: ExecutionAdapterSecretMaterializationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSecretMaterializationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretMaterializationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        referenceId: request.referenceId,
        operator: request.operator ?? "local-operator",
        manifestPath: request.manifestPath,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSecretMaterializationRecordPayload(payload)) {
      return {
        adapterSecretMaterialization: payload.adapterSecretMaterialization,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter secret materialization contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret materialization error"
    };
  }
}

export async function recordExecutionAdapterSecretManifestValidation(
  baseUrl: string,
  request: ExecutionAdapterSecretManifestValidationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSecretManifestValidationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretManifestValidationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        materializationId: request.materializationId ?? "",
        operator: request.operator ?? "local-operator",
        manifestPath: request.manifestPath ?? "",
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSecretManifestValidationRecordPayload(payload)) {
      return {
        adapterSecretManifestValidation: payload.adapterSecretManifestValidation,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter secret manifest validation contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret manifest validation error"
    };
  }
}

export async function recordExecutionAdapterEnvironmentBinding(
  baseUrl: string,
  request: ExecutionAdapterEnvironmentBindingRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterEnvironmentBindingRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterEnvironmentBindingUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        materializationId: request.materializationId,
        manifestValidationId: request.manifestValidationId ?? "",
        operator: request.operator ?? "local-operator",
        bindingMode: request.bindingMode ?? "container_env_reference",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterEnvironmentBindingRecordPayload(payload)) {
      return {
        adapterEnvironmentBinding: payload.adapterEnvironmentBinding,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter environment binding contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter environment binding error"
    };
  }
}

export async function recordExecutionAdapterRuntimeReloadPlan(
  baseUrl: string,
  request: ExecutionAdapterRuntimeReloadPlanRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRuntimeReloadPlanRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadPlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        bindingId: request.bindingId,
        operator: request.operator ?? "local-operator",
        reloadMode: request.reloadMode ?? "manual_container_reload_plan",
        maintenanceWindowId: request.maintenanceWindowId,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRuntimeReloadPlanRecordPayload(payload)) {
      return {
        adapterRuntimeReloadPlan: payload.adapterRuntimeReloadPlan,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter runtime reload plan contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload plan error"
    };
  }
}

export async function recordExecutionAdapterRuntimeReloadExecution(
  baseUrl: string,
  request: ExecutionAdapterRuntimeReloadExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRuntimeReloadExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        planId: request.planId,
        operator: request.operator ?? "local-operator",
        executionMode: request.executionMode ?? "manual_controlled_reload",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRuntimeReloadExecutionRecordPayload(payload)) {
      return {
        adapterRuntimeReloadExecution: payload.adapterRuntimeReloadExecution,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter runtime reload execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload execution error"
    };
  }
}

export async function recordExecutionAdapterRuntimeReloadAcceptance(
  baseUrl: string,
  request: ExecutionAdapterRuntimeReloadAcceptanceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRuntimeReloadAcceptanceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadAcceptanceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        executionId: request.executionId,
        operator: request.operator ?? "local-operator",
        acceptanceMode: request.acceptanceMode ?? "manual_runtime_reload_acceptance",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRuntimeReloadAcceptanceRecordPayload(payload)) {
      return {
        adapterRuntimeReloadAcceptance: payload.adapterRuntimeReloadAcceptance,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter runtime reload acceptance contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload acceptance error"
    };
  }
}

export async function recordExecutionAdapterOrchestrationDryRun(
  baseUrl: string,
  request: ExecutionAdapterOrchestrationDryRunRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterOrchestrationDryRunRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOrchestrationDryRunUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        acceptanceId: request.acceptanceId,
        operator: request.operator ?? "local-operator",
        orchestrationMode: request.orchestrationMode ?? "manual_adapter_orchestration_dry_run",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterOrchestrationDryRunRecordPayload(payload)) {
      return {
        adapterOrchestrationDryRun: payload.adapterOrchestrationDryRun,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter orchestration dry run contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration dry run error"
    };
  }
}

export async function recordExecutionAdapterOrchestrationExecution(
  baseUrl: string,
  request: ExecutionAdapterOrchestrationExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterOrchestrationExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOrchestrationExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        dryRunId: request.dryRunId,
        operator: request.operator ?? "local-operator",
        orchestrationExecutionMode:
          request.orchestrationExecutionMode ?? "manual_adapter_orchestration_execution",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterOrchestrationExecutionRecordPayload(payload)) {
      return {
        adapterOrchestrationExecution: payload.adapterOrchestrationExecution,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter orchestration execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration execution error"
    };
  }
}

export async function recordExecutionAdapterHumanConfirmation(
  baseUrl: string,
  request: ExecutionAdapterHumanConfirmationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterHumanConfirmationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterHumanConfirmationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        orchestrationExecutionId: request.orchestrationExecutionId,
        operator: request.operator ?? "local-operator",
        confirmationMode: request.confirmationMode ?? "manual_final_human_confirmation",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterHumanConfirmationRecordPayload(payload)) {
      return {
        adapterHumanConfirmation: payload.adapterHumanConfirmation,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter human confirmation contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter human confirmation error"
    };
  }
}

export async function recordExecutionAdapterSandboxProbePlan(
  baseUrl: string,
  request: ExecutionAdapterSandboxProbePlanRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxProbePlanRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbePlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        humanConfirmationId: request.humanConfirmationId,
        operator: request.operator ?? "local-operator",
        probeMode: request.probeMode ?? "manual_sandbox_probe_plan",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxProbePlanRecordPayload(payload)) {
      return {
        adapterSandboxProbePlan: payload.adapterSandboxProbePlan,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter sandbox probe plan contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe plan error"
    };
  }
}

export async function recordExecutionAdapterSandboxProbeExecution(
  baseUrl: string,
  request: ExecutionAdapterSandboxProbeExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxProbeExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxProbePlanId: request.sandboxProbePlanId,
        operator: request.operator ?? "local-operator",
        probeExecutionMode: request.probeExecutionMode ?? "manual_readonly_sandbox_probe",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxProbeExecutionRecordPayload(payload)) {
      return {
        adapterSandboxProbeExecution: payload.adapterSandboxProbeExecution,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter sandbox probe execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe execution error"
    };
  }
}

export async function recordExecutionAdapterSandboxProbeReview(
  baseUrl: string,
  request: ExecutionAdapterSandboxProbeReviewRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxProbeReviewRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeReviewUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxProbeExecutionId: request.sandboxProbeExecutionId,
        operator: request.operator ?? "local-operator",
        reviewMode: request.reviewMode ?? "manual_sandbox_probe_review",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxProbeReviewRecordPayload(payload)) {
      return {
        adapterSandboxProbeReview: payload.adapterSandboxProbeReview,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter sandbox probe review contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe review error"
    };
  }
}

export async function recordExecutionAdapterProductionRouteReview(
  baseUrl: string,
  request: ExecutionAdapterProductionRouteReviewRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterProductionRouteReviewRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterProductionRouteReviewUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxProbeReviewId: request.sandboxProbeReviewId,
        operator: request.operator ?? "local-operator",
        reviewMode: request.reviewMode ?? "manual_production_route_review",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterProductionRouteReviewRecordPayload(payload)) {
      return {
        adapterProductionRouteReview: payload.adapterProductionRouteReview,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter production route review contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter production route review error"
    };
  }
}

export async function recordExecutionAdapterSandboxOrderSchemaDryRun(
  baseUrl: string,
  request: ExecutionAdapterSandboxOrderSchemaDryRunRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterSandboxOrderSchemaDryRunRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxOrderSchemaDryRunUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        productionRouteReviewId: request.productionRouteReviewId,
        operator: request.operator ?? "local-operator",
        dryRunMode: request.dryRunMode ?? "manual_sandbox_order_schema_dry_run",
        orderIntent: request.orderIntent,
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterSandboxOrderSchemaDryRunRecordPayload(payload)) {
      return {
        adapterSandboxOrderSchemaDryRun: payload.adapterSandboxOrderSchemaDryRun,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter sandbox order schema dry-run contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox order schema dry-run error"
    };
  }
}

export async function recordExecutionAdapterPaperOrderLifecycle(
  baseUrl: string,
  request: ExecutionAdapterPaperOrderLifecycleRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterPaperOrderLifecycleRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperOrderLifecycleUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        sandboxOrderSchemaDryRunId: request.sandboxOrderSchemaDryRunId,
        operator: request.operator ?? "local-operator",
        lifecycleMode: request.lifecycleMode ?? "manual_paper_order_lifecycle_adapter",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterPaperOrderLifecycleRecordPayload(payload)) {
      return {
        adapterPaperOrderLifecycle: payload.adapterPaperOrderLifecycle,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter paper order lifecycle contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper order lifecycle error"
    };
  }
}

export async function recordExecutionAdapterPaperRouteRunbook(
  baseUrl: string,
  request: ExecutionAdapterPaperRouteRunbookRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterPaperRouteRunbookRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperRouteRunbookUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        paperOrderLifecycleId: request.paperOrderLifecycleId,
        operator: request.operator ?? "local-operator",
        runbookMode: request.runbookMode ?? "manual_paper_route_runbook",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterPaperRouteRunbookRecordPayload(payload)) {
      return {
        adapterPaperRouteRunbook: payload.adapterPaperRouteRunbook,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter paper route runbook contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper route runbook error"
    };
  }
}

export async function recordExecutionAdapterOpsState(
  baseUrl: string,
  request: ExecutionAdapterOpsStateRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterOpsStateRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOpsStateUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        paperRouteRunbookId: request.paperRouteRunbookId,
        operator: request.operator ?? "local-operator",
        opsMode: request.opsMode ?? "manual_adapter_ops_state",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterOpsStateRecordPayload(payload)) {
      return {
        adapterOpsState: payload.adapterOpsState,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter ops state contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter ops state error"
    };
  }
}

export async function recordExecutionAdapterPaperExecution(
  baseUrl: string,
  request: ExecutionAdapterPaperExecutionRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterPaperExecutionRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperExecutionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        adapterOpsStateId: request.adapterOpsStateId,
        operator: request.operator ?? "local-operator",
        paperExecutionMode: request.paperExecutionMode ?? "manual_adapter_paper_execution",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterPaperExecutionRecordPayload(payload)) {
      return {
        adapterPaperExecution: payload.adapterPaperExecution,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
    if (!response.ok) {
      if (isExecutionAdapterPaperExecutionDuplicatePayload(payload)) {
        return {
          adapterPaperExecution: payload.existingAdapterPaperExecution,
          source: "core",
          error: payload.error
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    throw new Error("Invalid execution adapter paper execution contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper execution error"
    };
  }
}

export async function loadExecutionAdapterHealthProbe(
  baseUrl: string,
  params: { adapterId?: string; exchange?: string; productionRouteReviewId?: string } = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterHealthProbeLoadResult> {
  try {
    const response = await fetcher(buildExecutionAdapterHealthProbeUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterHealthProbePayload(payload)) {
      throw new Error("Invalid execution adapter health probe contract");
    }
    return {
      adapterHealthProbe: payload.adapterHealthProbe,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter health probe error"
    };
  }
}

export async function loadExecutionAdapterCertifications(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterCertificationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationsUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterCertificationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter certification history contract");
    }
    return {
      adapterCertifications: payload.adapterCertifications,
      source: "core"
    };
  } catch (error) {
    return {
      adapterCertifications: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification history error"
    };
  }
}

export async function loadExecutionAdapterCertificationApplies(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterCertificationApplyHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationAppliesUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterCertificationApplyHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter certification apply history contract");
    }
    return {
      certificationApplies: payload.certificationApplies,
      source: "core"
    };
  } catch (error) {
    return {
      certificationApplies: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification apply history error"
    };
  }
}

export async function loadExecutionAdapterControlledRestartEvidence(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterControlledRestartEvidenceHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterControlledRestartEvidenceHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterControlledRestartEvidenceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter controlled restart evidence history contract");
    }
    return {
      controlledRestartEvidence: payload.controlledRestartEvidence,
      source: "core"
    };
  } catch (error) {
    return {
      controlledRestartEvidence: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter controlled restart evidence history error"
    };
  }
}

export async function loadExecutionAdapterRestartAcceptances(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRestartAcceptanceHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRestartAcceptanceHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRestartAcceptanceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter restart acceptance history contract");
    }
    return {
      restartAcceptances: payload.restartAcceptances,
      source: "core"
    };
  } catch (error) {
    return {
      restartAcceptances: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter restart acceptance history error"
    };
  }
}

export async function loadExecutionAdapterSecretReferences(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSecretReferenceHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretReferenceHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSecretReferenceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter secret reference history contract");
    }
    return {
      adapterSecretReferences: payload.adapterSecretReferences,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSecretReferences: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret reference history error"
    };
  }
}

export async function loadExecutionAdapterSecretMaterializations(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSecretMaterializationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretMaterializationHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSecretMaterializationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter secret materialization history contract");
    }
    return {
      adapterSecretMaterializations: payload.adapterSecretMaterializations,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSecretMaterializations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret materialization history error"
    };
  }
}

export async function loadExecutionAdapterSecretManifestValidations(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSecretManifestValidationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSecretManifestValidationHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSecretManifestValidationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter secret manifest validation history contract");
    }
    return {
      adapterSecretManifestValidations: payload.adapterSecretManifestValidations,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSecretManifestValidations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter secret manifest validation history error"
    };
  }
}

export async function loadExecutionAdapterEnvironmentBindings(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterEnvironmentBindingHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterEnvironmentBindingHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterEnvironmentBindingHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter environment binding history contract");
    }
    return {
      adapterEnvironmentBindings: payload.adapterEnvironmentBindings,
      source: "core"
    };
  } catch (error) {
    return {
      adapterEnvironmentBindings: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter environment binding history error"
    };
  }
}

export async function loadExecutionAdapterRuntimeReloadPlans(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRuntimeReloadPlanHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadPlanHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRuntimeReloadPlanHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter runtime reload plan history contract");
    }
    return {
      adapterRuntimeReloadPlans: payload.adapterRuntimeReloadPlans,
      source: "core"
    };
  } catch (error) {
    return {
      adapterRuntimeReloadPlans: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload plan history error"
    };
  }
}

export async function loadExecutionAdapterRuntimeReloadExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRuntimeReloadExecutionHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadExecutionHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRuntimeReloadExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter runtime reload execution history contract");
    }
    return {
      adapterRuntimeReloadExecutions: payload.adapterRuntimeReloadExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterRuntimeReloadExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload execution history error"
    };
  }
}

export async function loadExecutionAdapterRuntimeReloadAcceptances(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRuntimeReloadAcceptanceHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRuntimeReloadAcceptanceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter runtime reload acceptance history contract");
    }
    return {
      adapterRuntimeReloadAcceptances: payload.adapterRuntimeReloadAcceptances,
      source: "core"
    };
  } catch (error) {
    return {
      adapterRuntimeReloadAcceptances: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter runtime reload acceptance history error"
    };
  }
}

export async function loadExecutionAdapterOrchestrationDryRuns(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterOrchestrationDryRunHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOrchestrationDryRunHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterOrchestrationDryRunHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter orchestration dry run history contract");
    }
    return {
      adapterOrchestrationDryRuns: payload.adapterOrchestrationDryRuns,
      source: "core"
    };
  } catch (error) {
    return {
      adapterOrchestrationDryRuns: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration dry run history error"
    };
  }
}

export async function loadExecutionAdapterOrchestrationExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterOrchestrationExecutionHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterOrchestrationExecutionHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterOrchestrationExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter orchestration execution history contract");
    }
    return {
      adapterOrchestrationExecutions: payload.adapterOrchestrationExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterOrchestrationExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter orchestration execution history error"
    };
  }
}

export async function loadExecutionAdapterHumanConfirmations(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterHumanConfirmationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterHumanConfirmationHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterHumanConfirmationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter human confirmation history contract");
    }
    return {
      adapterHumanConfirmations: payload.adapterHumanConfirmations,
      source: "core"
    };
  } catch (error) {
    return {
      adapterHumanConfirmations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter human confirmation history error"
    };
  }
}

export async function loadExecutionAdapterSandboxProbePlans(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxProbePlanHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbePlanHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxProbePlanHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox probe plan history contract");
    }
    return {
      adapterSandboxProbePlans: payload.adapterSandboxProbePlans,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxProbePlans: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe plan history error"
    };
  }
}

export async function loadExecutionAdapterSandboxProbeExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxProbeExecutionHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeExecutionHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxProbeExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox probe execution history contract");
    }
    return {
      adapterSandboxProbeExecutions: payload.adapterSandboxProbeExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxProbeExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe execution history error"
    };
  }
}

export async function loadExecutionAdapterSandboxProbeReviews(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxProbeReviewHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterSandboxProbeReviewHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxProbeReviewHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox probe review history contract");
    }
    return {
      adapterSandboxProbeReviews: payload.adapterSandboxProbeReviews,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxProbeReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox probe review history error"
    };
  }
}

export async function loadExecutionAdapterProductionRouteReviews(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterProductionRouteReviewHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterProductionRouteReviewHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterProductionRouteReviewHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter production route review history contract");
    }
    return {
      adapterProductionRouteReviews: payload.adapterProductionRouteReviews,
      source: "core"
    };
  } catch (error) {
    return {
      adapterProductionRouteReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter production route review history error"
    };
  }
}

export async function loadExecutionAdapterSandboxOrderSchemaDryRuns(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterSandboxOrderSchemaDryRunHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterSandboxOrderSchemaDryRunHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterSandboxOrderSchemaDryRunHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter sandbox order schema dry-run history contract");
    }
    return {
      adapterSandboxOrderSchemaDryRuns: payload.adapterSandboxOrderSchemaDryRuns,
      source: "core"
    };
  } catch (error) {
    return {
      adapterSandboxOrderSchemaDryRuns: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter sandbox order schema dry-run history error"
    };
  }
}

export async function loadExecutionAdapterPaperOrderLifecycles(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterPaperOrderLifecycleHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterPaperOrderLifecycleHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterPaperOrderLifecycleHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter paper order lifecycle history contract");
    }
    return {
      adapterPaperOrderLifecycles: payload.adapterPaperOrderLifecycles,
      source: "core"
    };
  } catch (error) {
    return {
      adapterPaperOrderLifecycles: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper order lifecycle history error"
    };
  }
}

export async function loadExecutionAdapterPaperRouteRunbooks(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterPaperRouteRunbookHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterPaperRouteRunbookHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterPaperRouteRunbookHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter paper route runbook history contract");
    }
    return {
      adapterPaperRouteRunbooks: payload.adapterPaperRouteRunbooks,
      source: "core"
    };
  } catch (error) {
    return {
      adapterPaperRouteRunbooks: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper route runbook history error"
    };
  }
}

export async function loadExecutionAdapterOpsStates(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterOpsStateHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterOpsStateHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterOpsStateHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter ops state history contract");
    }
    return {
      adapterOpsStates: payload.adapterOpsStates,
      source: "core"
    };
  } catch (error) {
    return {
      adapterOpsStates: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter ops state history error"
    };
  }
}

export async function loadExecutionAdapterPaperExecutions(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterPaperExecutionHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterPaperExecutionHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterPaperExecutionHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter paper execution history contract");
    }
    return {
      adapterPaperExecutions: payload.adapterPaperExecutions,
      source: "core"
    };
  } catch (error) {
    return {
      adapterPaperExecutions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter paper execution history error"
    };
  }
}

export async function recordPortfolioPaperOrderSimulation(
  baseUrl: string,
  request: PortfolioPaperOrderSimulationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderSimulationRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderSimulationsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isPortfolioPaperOrderDuplicateSimulationPayload(payload)) {
        return {
          simulation: payload.existingSimulation,
          simulations: payload.simulations,
          lifecycle: payload.portfolioPaperOrderLifecycle,
          source: "core"
        };
      }
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          simulations: [],
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderSimulationRecordPayload(payload)) {
      throw new Error("Invalid portfolio paper order simulation contract");
    }
    return {
      simulation: payload.simulation,
      simulations: payload.simulations,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      simulations: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order simulation record error"
    };
  }
}

export async function recordPortfolioPaperOrderBatchSimulation(
  baseUrl: string,
  request: PortfolioPaperOrderBatchSimulationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderBatchSimulationRecordResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderBatchSimulationsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          simulations: [],
          createdSimulations: [],
          auditEvents: [],
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPortfolioPaperOrderBatchSimulationRecordPayload(payload)) {
      throw new Error("Invalid portfolio paper order batch simulation contract");
    }
    return {
      batchSimulation: payload.batchSimulation,
      simulations: payload.simulations,
      createdSimulations: payload.createdSimulations,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      auditEvents: payload.auditEvents,
      source: "core"
    };
  } catch (error) {
    return {
      simulations: [],
      createdSimulations: [],
      auditEvents: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order batch simulation record error"
    };
  }
}

export async function loadPortfolioPaperOrderSimulations(
  baseUrl: string,
  baseRunId: string,
  batchId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderSimulationHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderSimulationsUrl(baseUrl, { baseRunId, batchId }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderSimulationHistoryPayload(payload)) {
      throw new Error("Invalid portfolio paper order simulation history contract");
    }
    return {
      simulations: payload.simulations,
      lifecycle: payload.portfolioPaperOrderLifecycle,
      source: "core"
    };
  } catch (error) {
    return {
      simulations: [],
      lifecycle: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order simulation history error"
    };
  }
}

export async function loadPortfolioPaperOrderStateHistory(
  baseUrl: string,
  baseRunId: string,
  batchId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PortfolioPaperOrderStateHistoryResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderStateHistoryUrl(baseUrl, { baseRunId, batchId }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderStateHistoryPayload(payload)) {
      throw new Error("Invalid portfolio paper order state history contract");
    }
    return {
      stateHistory: payload.stateHistory,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order state history error"
    };
  }
}

export async function loadPortfolioPaperOrderReplay(
  baseUrl: string,
  baseRunId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  initialCash = 100_000
): Promise<PortfolioPaperOrderReplayResult> {
  try {
    const response = await fetcher(buildPortfolioPaperOrderReplayUrl(baseUrl, { baseRunId, initialCash }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPortfolioPaperOrderReplayPayload(payload)) {
      throw new Error("Invalid portfolio paper order replay contract");
    }
    return {
      replay: payload.replay,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown portfolio paper order replay error"
    };
  }
}

export async function loadGoldenPathStatus(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<GoldenPathStatusResult> {
  try {
    const response = await fetcher(buildGoldenPathStatusUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isGoldenPathStatusPayload(payload)) {
      throw new Error("Invalid golden path status contract");
    }
    return {
      goldenPath: payload.goldenPath,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown golden path status error"
    };
  }
}

export async function refreshMarketCache(
  baseUrl: string,
  params: CacheRefreshParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheRefreshResult> {
  try {
    const overrideAuditEventId = params.overrideAuditEventId?.trim();
    const body: Record<string, unknown> = {
      market: params.market,
      symbol: params.symbol,
      timeframe: params.timeframe,
      limit: Math.max(1, Math.min(params.limit ?? 160, 500))
    };
    if (overrideAuditEventId) {
      body.overrideAuditEventId = overrideAuditEventId;
    }
    const response = await fetcher(buildCacheRefreshUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isCacheRefreshPayload(payload)) {
      throw new Error("Invalid cache refresh contract");
    }
    return {
      refresh: payload.refresh,
      watchlistRefresh: payload.watchlistRefresh,
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown cache refresh error"
    };
  }
}

export async function refreshWatchlistCacheRun(
  baseUrl: string,
  params: CacheWatchlistRefreshParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheWatchlistRefreshResult> {
  try {
    const overrideAuditEventId = params.overrideAuditEventId?.trim();
    const body: Record<string, unknown> = {
      timeframe: params.timeframe,
      limit: Math.max(1, Math.min(params.limit ?? 160, 500)),
      watchlist: params.watchlist.map((instrument) => ({
        market: instrument.market,
        symbol: instrument.symbol,
        name: instrument.name
      }))
    };
    if (overrideAuditEventId) {
      body.overrideAuditEventId = overrideAuditEventId;
    }
    const response = await fetcher(buildWatchlistCacheRefreshUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isCacheWatchlistRefreshPayload(payload)) {
      throw new Error("Invalid watchlist cache refresh contract");
    }
    return {
      watchlistRefresh: payload.watchlistRefresh,
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown watchlist cache refresh error"
    };
  }
}

export async function loadWatchlistCacheRefreshRuns(
  baseUrl: string,
  params: { limit?: number } = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheWatchlistRefreshHistoryResult> {
  try {
    const response = await fetcher(buildWatchlistCacheRefreshUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isCacheWatchlistRefreshHistoryPayload(payload)) {
      throw new Error("Invalid watchlist cache refresh history contract");
    }
    return {
      watchlistRefreshes: payload.watchlistRefreshes,
      source: "core"
    };
  } catch (error) {
    return {
      watchlistRefreshes: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown watchlist cache refresh history error"
    };
  }
}

export async function refreshMarketCacheBatch(
  baseUrl: string,
  paramsList: CacheRefreshParams[],
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheBatchRefreshResult> {
  const refreshes: CacheRefreshSummary[] = [];
  const errors: string[] = [];
  let settings: PlatformSettingsStatus | undefined;
  let failedCount = 0;

  for (const params of paramsList) {
    const result = await refreshMarketCache(baseUrl, params, fetcher);
    if (result.source === "core" && result.refresh && result.settings) {
      refreshes.push(result.refresh);
      settings = result.settings;
      continue;
    }
    failedCount += 1;
    if (result.error) {
      errors.push(`${params.symbol}: ${result.error}`);
    }
  }

  return {
    refreshes,
    settings,
    source: refreshes.length || paramsList.length === 0 ? "core" : "fallback",
    failedCount,
    error: failedCount ? errors.join("; ") || `${failedCount} cache refresh failed` : undefined
  };
}

export async function saveStrategySnapshot(
  baseUrl: string,
  params: StrategySaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategySaveResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/strategies"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        auditRunId: params.auditRunId ?? null,
        strategy: params.strategy
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyValidationErrorPayload(payload)) {
        return {
          validation: payload.validation,
          source: "core",
          error: payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isStrategyLibraryItemPayload(payload)) {
      throw new Error("Invalid strategy library save contract");
    }
    return {
      strategy: payload.strategy,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy save error"
    };
  }
}

export async function validateStrategySnapshot(
  baseUrl: string,
  params: StrategySaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyValidationResult> {
  try {
    const response = await fetcher(buildStrategyValidationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        auditRunId: params.auditRunId ?? null,
        strategy: params.strategy
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyValidationPayload(payload)) {
      throw new Error("Invalid strategy validation contract");
    }
    return {
      validation: payload.validation,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy validation error"
    };
  }
}

export async function loadStrategyLibrary(
  baseUrl: string,
  params: { market?: Market; symbol?: string; limit?: number } = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyLibraryResult> {
  try {
    const response = await fetcher(buildStrategiesUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyLibraryPayload(payload)) {
      throw new Error("Invalid strategy library contract");
    }
    return {
      strategies: payload.strategies,
      source: "core"
    };
  } catch (error) {
    return {
      strategies: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy library error"
    };
  }
}

export async function loadStrategyDetail(
  baseUrl: string,
  revision: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategySaveResult> {
  try {
    const response = await fetcher(buildStrategyDetailUrl(baseUrl, revision));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyLibraryItemPayload(payload)) {
      throw new Error("Invalid strategy detail contract");
    }
    return {
      strategy: payload.strategy,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy detail error"
    };
  }
}

export async function createStrategyExperiment(
  baseUrl: string,
  request: StrategyExperimentCreateRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyExperimentMutationResult> {
  try {
    const response = await fetcher(buildStrategyExperimentsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyExperimentErrorPayload(payload)) {
        return {
          source: "core",
          errorCode: payload.error,
          error: payload.detail ?? payload.error
        };
      }
      throw new Error("Invalid strategy experiment error contract");
    }
    if (!isStrategyExperimentDetailPayload(payload)) {
      throw new Error("Invalid strategy experiment mutation contract");
    }
    return { experiment: payload.experiment, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy experiment mutation error"
    };
  }
}

export async function loadStrategyExperiments(
  baseUrl: string,
  params: StrategyExperimentHistoryParams = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyExperimentHistoryResult> {
  try {
    const response = await fetcher(buildStrategyExperimentsUrl(baseUrl, params));
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyExperimentErrorPayload(payload)) {
        return {
          experiments: [],
          source: "core",
          errorCode: payload.error,
          error: payload.detail ?? payload.error
        };
      }
      throw new Error("Invalid strategy experiment error contract");
    }
    if (!isStrategyExperimentHistoryPayload(payload)) {
      throw new Error("Invalid strategy experiment history contract");
    }
    return { experiments: payload.experiments, source: "core" };
  } catch (error) {
    return {
      experiments: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy experiment history error"
    };
  }
}

export async function loadStrategyExperimentDetail(
  baseUrl: string,
  experimentId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyExperimentDetailResult> {
  try {
    const response = await fetcher(buildStrategyExperimentDetailUrl(baseUrl, experimentId));
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyExperimentErrorPayload(payload)) {
        return {
          source: "core",
          errorCode: payload.error,
          error: payload.detail ?? payload.error
        };
      }
      throw new Error("Invalid strategy experiment error contract");
    }
    if (!isStrategyExperimentDetailPayload(payload)) {
      throw new Error("Invalid strategy experiment detail contract");
    }
    return { experiment: payload.experiment, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy experiment detail error"
    };
  }
}

function hasExactAiReviewEnvelopeKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => key in value);
}

function isAiReviewProvidersPayload(value: unknown): value is { providers: AiReviewProviderStatus[] } {
  return hasExactAiReviewEnvelopeKeys(value, ["providers"])
    && Array.isArray(value.providers)
    && value.providers.every(isAiReviewProviderStatus);
}

function isAuthoritativeAiReviewPayload(
  value: unknown
): value is { review: AuthoritativeAiReviewRun; latestDecision: AiReviewDecision | null } {
  if (!hasExactAiReviewEnvelopeKeys(value, ["review", "latestDecision"])
    || !isAuthoritativeAiReviewRun(value.review)
    || (value.latestDecision !== null && !isAiReviewDecision(value.latestDecision))) {
    return false;
  }
  return value.latestDecision === null || (
    value.latestDecision.aiReviewId === value.review.aiReviewId
    && value.latestDecision.reviewRecordHash === value.review.recordHash
    && value.latestDecision.evidenceHash === value.review.evidenceHash
  );
}

function isAuthoritativeAiReviewCreatePayload(
  value: unknown,
  request: CreateAuthoritativeAiReviewRequest
): value is { review: AuthoritativeAiReviewRun; latestDecision: null } {
  if (!isAuthoritativeAiReviewPayload(value) || value.latestDecision !== null) {
    return false;
  }
  const comparisonIds = value.review.comparisonExperiments.map((item) => item.experimentId);
  return value.review.primaryExperiment.experimentId === request.primaryExperimentId
    && comparisonIds.length === request.comparisonExperimentIds.length
    && comparisonIds.every((id, index) => id === request.comparisonExperimentIds[index])
    && value.review.externalAssessment.provider === request.providerId;
}

function parseAuthoritativeAiReviewHistoryPayload(
  value: unknown
): { reviews: AiReviewHistoryRecord[]; pagination: MixedAiReviewHistoryPagination } | null {
  if (!hasExactAiReviewEnvelopeKeys(value, ["reviews", "pagination"])
    || !Array.isArray(value.reviews)
    || !hasExactAiReviewEnvelopeKeys(value.pagination, ["limit", "offset", "total", "query"])) {
    return null;
  }
  if (!(Number.isInteger(value.pagination.limit) && (value.pagination.limit as number) >= 1
    && (value.pagination.limit as number) <= 50
    && Number.isInteger(value.pagination.offset) && (value.pagination.offset as number) >= 0
    && Number.isInteger(value.pagination.total) && (value.pagination.total as number) >= 0
    && typeof value.pagination.query === "string")) {
    return null;
  }
  const reviews = value.reviews.map(parseAiReviewHistoryRecord);
  if (reviews.some((review) => review === null)) {
    return null;
  }
  return {
    reviews: reviews as AiReviewHistoryRecord[],
    pagination: {
      limit: value.pagination.limit as number,
      offset: value.pagination.offset as number,
      total: value.pagination.total as number,
      query: value.pagination.query
    }
  };
}

function isAiReviewDecisionsPayload(
  value: unknown,
  aiReviewId: string
): value is { decisions: AiReviewDecision[] } {
  return hasExactAiReviewEnvelopeKeys(value, ["decisions"])
    && isAiReviewDecisionChain(value.decisions)
    && value.decisions.every((decision) => decision.aiReviewId === aiReviewId);
}

function isAiReviewDecisionPayload(
  value: unknown,
  aiReviewId: string,
  request: AppendAiReviewDecisionRequest
): value is { decision: AiReviewDecision } {
  return hasExactAiReviewEnvelopeKeys(value, ["decision"])
    && isAiReviewDecision(value.decision)
    && value.decision.aiReviewId === aiReviewId
    && value.decision.operator === request.operator
    && value.decision.status === request.status
    && value.decision.rationale === request.rationale
    && value.decision.supersedesDecisionId === request.supersedesDecisionId;
}

export async function loadAiReviewProviders(
  baseUrl: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewProviderStatusResult> {
  const { signal, fetcher } = resolveAiReviewRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const payload = await requestJson(
      buildAiReviewProvidersUrl(baseUrl),
      signal ? { signal } : undefined,
      fetcher
    );
    if (!isAiReviewProvidersPayload(payload)) {
      throw new Error("Invalid AI review providers contract");
    }
    return { providers: payload.providers, source: "core" };
  } catch (error) {
    return {
      providers: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown AI review providers error"
    };
  }
}

export function createAuthoritativeAiReview(
  baseUrl: string,
  request: CreateAuthoritativeAiReviewRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuthoritativeAiReviewResult> {
  const { signal, fetcher } = resolveAiReviewRequestOptions(signalOrFetcher, maybeFetcher);
  const comparisonExperimentIds = request.comparisonExperimentIds;
  const requestSnapshot: CreateAuthoritativeAiReviewRequest = {
    primaryExperimentId: request.primaryExperimentId,
    comparisonExperimentIds: Array.isArray(comparisonExperimentIds)
      ? [...comparisonExperimentIds]
      : comparisonExperimentIds,
    providerId: request.providerId,
    externalDataApproved: request.externalDataApproved
  };
  return Promise.resolve().then(() => {
    const normalizedRequest = normalizeCreateAuthoritativeAiReviewRequest(requestSnapshot);
    return requestJson(
      buildAuthoritativeAiReviewsUrl(baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedRequest),
        ...(signal ? { signal } : {})
      },
      fetcher
    ).then((payload) => ({ normalizedRequest, payload }));
  }).then(({ normalizedRequest, payload }) => {
    if (!isAuthoritativeAiReviewCreatePayload(payload, normalizedRequest)) {
      throw new Error("Invalid authoritative AI review create contract");
    }
    return { review: payload.review, latestDecision: payload.latestDecision, source: "core" as const };
  }).catch((error: unknown) => ({
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown authoritative AI review create error"
  }));
}

export function loadAuthoritativeAiReview(
  baseUrl: string,
  aiReviewId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuthoritativeAiReviewResult> {
  const { signal, fetcher } = resolveAiReviewRequestOptions(signalOrFetcher, maybeFetcher);
  return Promise.resolve().then(() => {
    const normalizedAiReviewId = requireTrimmedAiReviewId(aiReviewId);
    return requestJson(
      buildAuthoritativeAiReviewUrl(baseUrl, normalizedAiReviewId),
      signal ? { signal } : undefined,
      fetcher
    ).then((payload) => ({ normalizedAiReviewId, payload }));
  }).then(({ normalizedAiReviewId, payload }) => {
    if (!isAuthoritativeAiReviewPayload(payload) || payload.review.aiReviewId !== normalizedAiReviewId) {
      throw new Error("Invalid authoritative AI review detail contract");
    }
    return { review: payload.review, latestDecision: payload.latestDecision, source: "core" as const };
  }).catch((error: unknown) => ({
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown authoritative AI review detail error"
  }));
}

export async function loadAuthoritativeAiReviews(
  baseUrl: string,
  filters: AuthoritativeAiReviewFilters = {},
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuthoritativeAiReviewHistoryResult> {
  const { signal, fetcher } = resolveAiReviewRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const responsePayload = await requestJson(
      buildAuthoritativeAiReviewsUrl(baseUrl, filters),
      signal ? { signal } : undefined,
      fetcher
    );
    const payload = parseAuthoritativeAiReviewHistoryPayload(responsePayload);
    if (payload === null) {
      throw new Error("Invalid authoritative AI review history contract");
    }
    return {
      reviews: payload.reviews.filter(isAuthoritativeAiReviewRun),
      legacyReviews: payload.reviews.filter(
        (review): review is LegacyAiReviewHistoryRecord => review.authority === "legacy"
      ),
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      reviews: [],
      legacyReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown authoritative AI review history error"
    };
  }
}

export function loadAiReviewDecisions(
  baseUrl: string,
  aiReviewId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewDecisionHistoryResult> {
  const { signal, fetcher } = resolveAiReviewRequestOptions(signalOrFetcher, maybeFetcher);
  return Promise.resolve().then(() => {
    const normalizedAiReviewId = requireTrimmedAiReviewId(aiReviewId);
    return requestJson(
      buildAiReviewDecisionsUrl(baseUrl, normalizedAiReviewId),
      signal ? { signal } : undefined,
      fetcher
    ).then((payload) => ({ normalizedAiReviewId, payload }));
  }).then(({ normalizedAiReviewId, payload }) => {
    if (!isAiReviewDecisionsPayload(payload, normalizedAiReviewId)) {
      throw new Error("Invalid AI review decisions contract");
    }
    return { decisions: payload.decisions, source: "core" as const };
  }).catch((error: unknown) => ({
    decisions: [],
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown AI review decisions error"
  }));
}

export function appendAiReviewDecision(
  baseUrl: string,
  aiReviewId: string,
  request: AppendAiReviewDecisionRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewDecisionMutationResult> {
  const { signal, fetcher } = resolveAiReviewRequestOptions(signalOrFetcher, maybeFetcher);
  const requestSnapshot: AppendAiReviewDecisionRequest = {
    operator: request.operator,
    status: request.status,
    rationale: request.rationale,
    supersedesDecisionId: request.supersedesDecisionId
  };
  return Promise.resolve().then(() => {
    const normalizedAiReviewId = requireTrimmedAiReviewId(aiReviewId);
    const normalizedRequest = requestSnapshot;
    return requestJson(
      buildAiReviewDecisionsUrl(baseUrl, normalizedAiReviewId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedRequest),
        ...(signal ? { signal } : {})
      },
      fetcher
    ).then((payload) => ({ normalizedAiReviewId, normalizedRequest, payload }));
  }).then(({ normalizedAiReviewId, normalizedRequest, payload }) => {
    if (!isAiReviewDecisionPayload(payload, normalizedAiReviewId, normalizedRequest)) {
      throw new Error("Invalid AI review decision append contract");
    }
    return { decision: payload.decision, source: "core" as const };
  }).catch((error: unknown) => ({
    source: "fallback",
    error: error instanceof Error ? error.message : "Unknown AI review decision append error"
  }));
}

export async function loadResearchRunPaperExecutions(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionHistoryResult> {
  try {
    const response = await fetcher(buildResearchRunPaperExecutionsUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPaperExecutionHistoryPayload(payload)) {
      throw new Error("Invalid paper execution history contract");
    }
    return {
      executions: payload.executions,
      source: "core"
    };
  } catch (error) {
    return {
      executions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown paper execution history error"
    };
  }
}

export async function loadLatestResearchRunPaperExecution(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionResult> {
  const result = await loadResearchRunPaperExecutions(baseUrl, runId, fetcher);
  if (result.source === "fallback") {
    return {
      source: "fallback",
      error: result.error
    };
  }
  return {
    execution: result.executions[0],
    source: "core"
  };
}

export async function loadMarketKlines(
  baseUrl: string,
  params: MarketKlinesParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketKlinesResult> {
  try {
    const response = await fetcher(
      buildMarketKlinesUrl(baseUrl, params.market, params.symbol, params.timeframe, params.limit ?? 160, params.end)
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketKlinesPayload(payload)) {
      throw new Error("Invalid market klines contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      market: params.market,
      symbol: params.symbol,
      timeframe: params.timeframe,
      bars: [],
      quality: {
        source: "unavailable",
        isComplete: false,
        warnings: [],
        rows: 0
      },
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market kline load error"
    };
  }
}

export async function loadMarketDataReadiness(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketDataReadinessResult> {
  try {
    const response = await fetcher(
      buildMarketDataReadinessUrl(baseUrl, params.market, params.symbol, params.timeframe)
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketDataReadinessPayload(payload)) {
      throw new Error("Invalid market data readiness contract");
    }
    return {
      readiness: payload,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market data readiness load error"
    };
  }
}

export async function loadMarketCalendarStatus(
  baseUrl: string,
  market: Market,
  fetcher: WorkspaceFetcher = defaultFetcher,
  at?: string
): Promise<MarketCalendarResult> {
  try {
    const response = await fetcher(buildMarketCalendarUrl(baseUrl, market, at));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketCalendarPayload(payload)) {
      throw new Error("Invalid market calendar contract");
    }
    return {
      calendar: payload.calendar,
      source: "core"
    };
  } catch (error) {
    return {
      calendar: {
        market,
        timezone: "unknown",
        status: "unknown",
        isOpen: false,
        session: "unknown",
        asOf: "",
        tradingDay: "",
        nextOpen: null,
        nextClose: null,
        detail: "Market calendar unavailable.",
        warnings: [],
        source: "fallback"
      },
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market calendar error"
    };
  }
}

export function marketKlinesFromResearchRunAudit(run: ResearchRunAudit): MarketKlinesResult | null {
  const snapshot = run.dataSnapshot;
  if (!snapshot || !snapshot.bars.length) {
    return null;
  }
  return {
    market: run.market,
    symbol: run.symbol,
    timeframe: run.timeframe,
    bars: snapshot.bars.map((bar) => ({ ...bar })),
    quality: {
      source: snapshot.source,
      isComplete: snapshot.isComplete,
      warnings: [...snapshot.warnings],
      rows: snapshot.rows
    },
    source: "core"
  };
}

export function mergeMarketKlines(current: MarketKlinesResult, incoming: MarketKlinesResult): MarketKlinesResult {
  if (
    current.market !== incoming.market ||
    current.symbol !== incoming.symbol ||
    current.timeframe !== incoming.timeframe
  ) {
    return current;
  }

  const barsByTimestamp = new Map<number, MarketKlineBar>();
  [...incoming.bars, ...current.bars].forEach((bar) => {
    barsByTimestamp.set(bar.timestampMs, bar);
  });
  const bars = [...barsByTimestamp.values()].sort((left, right) => left.timestampMs - right.timestampMs);
  const warnings = [...new Set([...current.quality.warnings, ...incoming.quality.warnings])];

  return {
    ...current,
    source: current.source === "core" || incoming.source === "core" ? "core" : current.source,
    error: current.error ?? incoming.error,
    quality: {
      source: incoming.quality.source || current.quality.source,
      isComplete: current.quality.isComplete && incoming.quality.isComplete,
      warnings,
      rows: bars.length
    },
    bars
  };
}

export async function loadMarketSearch(
  baseUrl: string,
  params: { market: Market; query: string; limit?: number; timeframe?: ResearchTimeframe },
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketSearchResult> {
  try {
    const response = await fetcher(
      buildMarketSearchUrl(baseUrl, params.market, params.query, params.limit ?? 8, params.timeframe)
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketSearchPayload(payload)) {
      throw new Error("Invalid market search contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      market: params.market,
      query: params.query,
      results: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market search error"
    };
  }
}

export function buildP0PipelineRequest(
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace
): P0PipelineRequest {
  const draft = buildStrategyRuleDraft(currentWorkspace);
  return {
    market: params.market,
    symbol: params.symbol,
    timeframe: params.timeframe,
    limit: Math.max(1, Math.min(params.limit ?? 500, 500)),
    strategyConfig: p0PipelineStrategyConfigFromDraft(draft),
    assumptions: resolveBacktestAssumptions(currentWorkspace)
  };
}

export async function runP0Pipeline(
  baseUrl: string,
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0PipelineRunResult> {
  try {
    const response = await fetcher(buildP0PipelineUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildP0PipelineRequest(params, currentWorkspace))
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isP0PipelineResponsePayload(payload)) {
      throw new Error("Invalid P0 pipeline contract");
    }
    const detail = await loadResearchRunDetail(baseUrl, payload.runId, fetcher);
    if (detail.source !== "core" || !detail.run) {
      throw new Error(detail.error ?? "P0 pipeline audit run detail unavailable");
    }
    return {
      workspace: workspaceWithPrimaryWorkflows(workspaceFromResearchRunAudit(currentWorkspace, detail.run)),
      source: "core",
      statusLabel: "P0 pipeline run complete",
      pipeline: payload
    };
  } catch (error) {
    return {
      workspace: currentWorkspace,
      source: "fallback",
      statusLabel: "P0 pipeline run failed",
      error: error instanceof Error ? error.message : "Unknown P0 pipeline error"
    };
  }
}

function p0PipelineStrategyConfigFromDraft(draft: StrategyRuleDraft): P0PipelineStrategyConfig {
  return {
    name: draft.name.trim() || "SMA trend",
    entry: p0PipelineConditionFromDraft(draft.entryKind, draft.entryWindow, draft.entryThreshold, "entry"),
    exit: p0PipelineConditionFromDraft(draft.exitKind, draft.exitWindow, draft.exitThreshold, "exit"),
    position: {
      maxPositionPct: normalizeP0PipelinePercent(draft.positionPct)
    },
    risk: {
      stopLossPct: normalizeP0PipelinePercent(draft.stopLossPct),
      takeProfitPct: normalizeP0PipelinePercent(draft.takeProfitPct),
      maxDrawdownPct: normalizeP0PipelinePercent(draft.maxDrawdownPct)
    }
  };
}

function p0PipelineConditionFromDraft(
  kind: StrategyRuleDraft["entryKind"],
  window: number,
  threshold: number,
  role: "entry" | "exit"
): P0PipelineConditionConfig {
  const normalizedWindow = Math.max(1, Math.min(Math.round(window), 250));
  if (kind === "rsi_below") {
    return {
      type: "rsi_below",
      window: normalizedWindow,
      threshold: normalizeP0PipelinePercent(threshold, 0, 100)
    };
  }
  if (kind === "rsi_above") {
    return {
      type: "rsi_above",
      window: normalizedWindow,
      threshold: normalizeP0PipelinePercent(threshold, 0, 100)
    };
  }
  if (kind === "close_below_sma") {
    return {
      type: role === "entry" ? "sma_below" : "sma_break",
      window: normalizedWindow
    };
  }
  return {
    type: role === "entry" ? "sma_cross" : "sma_above",
    window: normalizedWindow
  };
}

function normalizeP0PipelinePercent(value: number, minimum = 0, maximum = 500): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.max(minimum, Math.min(Number(value.toFixed(4)), maximum));
}

export async function runTerminalResearch(
  baseUrl: string,
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(
      buildResearchRunUrl(
        baseUrl,
        params.market,
        params.symbol,
        params.timeframe,
        resolveBacktestAssumptions(currentWorkspace),
        params.limit ?? 500,
        currentWorkspace.strategy,
        params.watchlistRefreshRunId
      )
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal research contract");
    }
    const workspace = await hydrateResearchRunSnapshotIfNeeded(
      baseUrl,
      workspaceWithPrimaryWorkflows(payload),
      fetcher
    );
    return {
      workspace,
      source: "core",
      statusLabel: "Research run complete"
    };
  } catch (error) {
    return {
      workspace: currentWorkspace,
      source: "fallback",
      statusLabel: "Research run failed",
      error: error instanceof Error ? error.message : "Unknown research run error"
    };
  }
}

async function hydrateResearchRunSnapshotIfNeeded(
  baseUrl: string,
  workspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher
): Promise<TerminalWorkspace> {
  const runId = workspace.researchRun?.runId;
  const snapshot = workspace.researchRun?.dataSnapshot;
  if (!runId || (snapshot && snapshot.bars.length > 0)) {
    return workspace;
  }

  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId));
    if (!response.ok) {
      return workspace;
    }
    const payload = await response.json();
    if (!isResearchRunDetailPayload(payload) || !payload.run.dataSnapshot?.bars.length) {
      return workspace;
    }
    return workspaceWithPrimaryWorkflows(workspaceFromResearchRunAudit(workspace, payload.run));
  } catch {
    return workspace;
  }
}

function isResearchRunHistoryPayload(value: unknown): value is { runs: ResearchRunAudit[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runs?: unknown };
  return Array.isArray(payload.runs) && payload.runs.every(isResearchRunAudit);
}

function isResearchRunDetailPayload(value: unknown): value is { run: ResearchRunAudit } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { run?: unknown };
  return isResearchRunAudit(payload.run);
}

function isP0PipelineResponsePayload(value: unknown): value is P0PipelineResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0PipelineResponse>;
  const metrics = payload.metrics as Partial<P0PipelineResponse["metrics"]> | undefined;
  return (
    payload.status === "audited_run_created" &&
    typeof payload.runId === "string" &&
    payload.runId.length > 0 &&
    typeof payload.strategyRevisionId === "string" &&
    payload.strategyRevisionId.length > 0 &&
    typeof payload.dataSnapshotId === "string" &&
    payload.dataSnapshotId.length > 0 &&
    Boolean(metrics) &&
    typeof metrics?.totalReturnPct === "number" &&
    typeof metrics?.maxDrawdownPct === "number" &&
    typeof metrics?.tradeCount === "number" &&
    payload.paperOnly === true &&
    payload.liveTradingAllowed === false &&
    (payload.orderSubmitted === undefined || payload.orderSubmitted === false) &&
    (payload.liveOrderSubmitted === undefined || payload.liveOrderSubmitted === false) &&
    (payload.routeExecuted === undefined || payload.routeExecuted === false)
  );
}

function isP0AcceptanceLatestPayload(value: unknown): value is { acceptance: P0AcceptanceStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP0AcceptanceStatusPayload(payload.acceptance);
}

function isP0AcceptanceStatusPayload(value: unknown): value is P0AcceptanceStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0AcceptanceStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p0AcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP0AcceptanceManifestPayload(payload.manifest))
  );
}

function isP0AcceptanceManifestPayload(value: unknown): value is P0AcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0AcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    (payload.importBaseUrl === undefined || payload.importBaseUrl === null || typeof payload.importBaseUrl === "string") &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP0AcceptanceManifestCheckPayload)
  );
}

function isP0AcceptanceManifestCheckPayload(value: unknown): value is P0AcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P0AcceptanceManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isP1AcceptanceLatestPayload(value: unknown): value is { acceptance: P1AcceptanceStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP1AcceptanceStatusPayload(payload.acceptance);
}

function isP1AcceptanceStatusPayload(value: unknown): value is P1AcceptanceStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P1AcceptanceStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validQueuedMarket = payload.queuedMarket === null || isMarket(payload.queuedMarket);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p1AcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validTimeframe &&
    (payload.watchlistRefreshRunId === null || typeof payload.watchlistRefreshRunId === "string") &&
    validQueuedMarket &&
    (payload.queuedSymbol === null || typeof payload.queuedSymbol === "string") &&
    typeof payload.watchlistCount === "number" &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP1AcceptanceManifestPayload(payload.manifest))
  );
}

function isP1AcceptanceManifestPayload(value: unknown): value is P1AcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P1AcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    (payload.importBaseUrl === undefined || payload.importBaseUrl === null || typeof payload.importBaseUrl === "string") &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.watchlistRefreshRunId === "string" &&
    isMarket(payload.queuedMarket) &&
    typeof payload.queuedSymbol === "string" &&
    typeof payload.watchlistCount === "number" &&
    Array.isArray(payload.watchlist) &&
    payload.watchlist.every(isP1AcceptanceManifestWatchlistItemPayload) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP1AcceptanceManifestCheckPayload)
  );
}

function isP1AcceptanceManifestWatchlistItemPayload(value: unknown): value is P1AcceptanceManifestWatchlistItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<P1AcceptanceManifestWatchlistItem>;
  return typeof item.market === "string" && typeof item.symbol === "string" && typeof item.name === "string";
}

function isP1AcceptanceManifestCheckPayload(value: unknown): value is P1AcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P1AcceptanceManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isDesktopReleaseLatestPayload(value: unknown): value is { release: DesktopReleaseStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { release?: unknown };
  return isDesktopReleaseStatusPayload(payload.release);
}

function isDesktopReleaseStatusPayload(value: unknown): value is DesktopReleaseStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<DesktopReleaseStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  return (
    payload.kind === "aiqt.desktopReleaseStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.platform === null || typeof payload.platform === "string") &&
    (payload.version === null || typeof payload.version === "string") &&
    (payload.tauriConfigPath === null || typeof payload.tauriConfigPath === "string") &&
    (payload.desktopArtifactPath === null || typeof payload.desktopArtifactPath === "string") &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isDesktopReleaseManifestPayload(payload.manifest))
  );
}

function isDesktopReleaseManifestPayload(value: unknown): value is DesktopReleaseManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<DesktopReleaseManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.platform === "string" &&
    typeof payload.version === "string" &&
    typeof payload.tauriConfigPath === "string" &&
    typeof payload.desktopArtifactPath === "string" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isDesktopReleaseManifestCheckPayload)
  );
}

function isStage1DailyUseLatestPayload(value: unknown): value is { dailyUse: Stage1DailyUseReport } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { dailyUse?: unknown };
  return isStage1DailyUseReportPayload(payload.dailyUse);
}

function isStage1DailyUseGeneratePayload(value: unknown): value is {
  dailyUse: Stage1DailyUseReport;
  status: "daily_use_generated";
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    dailyUse?: unknown;
    status?: unknown;
    paperOnly?: unknown;
    orderSubmissionEnabled?: unknown;
    liveTradingAllowed?: unknown;
    liveOrderSubmitted?: unknown;
    routeExecuted?: unknown;
  };
  return (
    payload.status === "daily_use_generated" &&
    isStage1DailyUseReportPayload(payload.dailyUse) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean"
  );
}

function isStage1DailyUseReportPayload(value: unknown): value is Stage1DailyUseReport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1DailyUseReport>;
  const validStatus =
    payload.status === "ready" ||
    payload.status === "review" ||
    payload.status === "blocked" ||
    payload.status === "missing" ||
    payload.status === "invalid";
  return (
    payload.kind === "aiqt.stage1DailyUseReport" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    typeof payload.summary === "string" &&
    (payload.reason === undefined || typeof payload.reason === "string") &&
    typeof payload.readyCount === "number" &&
    typeof payload.totalCount === "number" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.sourcePath === undefined || typeof payload.sourcePath === "string") &&
    (payload.staleSourcePaths === undefined ||
      (Array.isArray(payload.staleSourcePaths) && payload.staleSourcePaths.every((sourcePath) => typeof sourcePath === "string"))) &&
    isStage1DailyUseSourcePathsPayload(payload.sourcePaths) &&
    Array.isArray(payload.rows) &&
    payload.rows.every(isStage1DailyUseReportRowPayload)
  );
}

function isStage1DailyUseSourcePathsPayload(value: unknown): value is Stage1DailyUseReportSourcePaths {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1DailyUseReportSourcePaths>;
  return (
    typeof payload.p0Acceptance === "string" &&
    typeof payload.p1Acceptance === "string" &&
    typeof payload.desktopRelease === "string"
  );
}

function isStage1DailyUseReportRowPayload(value: unknown): value is Stage1DailyUseReportRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<Stage1DailyUseReportRow>;
  const validStatus = row.status === "ready" || row.status === "review" || row.status === "blocked";
  return (
    typeof row.id === "string" &&
    typeof row.label === "string" &&
    validStatus &&
    typeof row.value === "string" &&
    typeof row.summary === "string" &&
    typeof row.action === "string" &&
    typeof row.paperOnly === "boolean" &&
    typeof row.liveTradingAllowed === "boolean" &&
    typeof row.liveBlockedBoundary === "boolean"
  );
}

function isStage1BootstrapPreflightLatestPayload(value: unknown): value is { preflight: Stage1BootstrapPreflight } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { preflight?: unknown };
  return isStage1BootstrapPreflightPayload(payload.preflight);
}

function isStage1BootstrapPreflightGeneratePayload(value: unknown): value is {
  preflight: Stage1BootstrapPreflight;
  status: "preflight_generated";
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    preflight?: unknown;
    status?: unknown;
    paperOnly?: unknown;
    orderSubmissionEnabled?: unknown;
    liveTradingAllowed?: unknown;
    liveOrderSubmitted?: unknown;
    routeExecuted?: unknown;
  };
  return (
    payload.status === "preflight_generated" &&
    isStage1BootstrapPreflightPayload(payload.preflight) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean"
  );
}

function isStage1BootstrapPreflightPayload(value: unknown): value is Stage1BootstrapPreflight {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1BootstrapPreflight>;
  const validStatus =
    payload.status === "ready" ||
    payload.status === "review" ||
    payload.status === "blocked" ||
    payload.status === "missing" ||
    payload.status === "invalid";
  return (
    payload.kind === "aiqt.stage1BootstrapPreflight" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    typeof payload.summary === "string" &&
    (payload.reason === undefined || typeof payload.reason === "string") &&
    typeof payload.ready === "boolean" &&
    typeof payload.readyCount === "number" &&
    typeof payload.reviewCount === "number" &&
    typeof payload.blockedCount === "number" &&
    typeof payload.totalCount === "number" &&
    typeof payload.nextAction === "string" &&
    typeof payload.recommendedCommand === "string" &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.reviewIds) &&
    payload.reviewIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.sourcePath === undefined || typeof payload.sourcePath === "string") &&
    (payload.staleSourcePaths === undefined ||
      (Array.isArray(payload.staleSourcePaths) && payload.staleSourcePaths.every((sourcePath) => typeof sourcePath === "string"))) &&
    isStage1BootstrapPreflightSourcePathsPayload(payload.sourcePaths) &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isStage1BootstrapPreflightCheckPayload)
  );
}

function isStage1BootstrapPreflightSourcePathsPayload(value: unknown): value is Stage1BootstrapPreflightSourcePaths {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1BootstrapPreflightSourcePaths>;
  return (
    typeof payload.p0Acceptance === "string" &&
    typeof payload.p1Acceptance === "string" &&
    typeof payload.p2ManifestChainPreflight === "string" &&
    typeof payload.desktopRelease === "string" &&
    typeof payload.stage1DailyUse === "string"
  );
}

function isStage1BootstrapPreflightCheckPayload(value: unknown): value is Stage1BootstrapPreflightCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<Stage1BootstrapPreflightCheck>;
  const validStatus = check.status === "ready" || check.status === "review" || check.status === "blocked";
  return (
    typeof check.id === "string" &&
    typeof check.label === "string" &&
    validStatus &&
    typeof check.summary === "string" &&
    typeof check.recommendedCommand === "string" &&
    typeof check.sourcePath === "string" &&
    typeof check.paperOnly === "boolean" &&
    typeof check.liveTradingAllowed === "boolean" &&
    typeof check.liveBlockedBoundary === "boolean"
  );
}

function isDesktopReleaseManifestCheckPayload(value: unknown): value is DesktopReleaseManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<DesktopReleaseManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isP2PreLiveAcceptanceLatestPayload(value: unknown): value is { acceptance: P2PreLiveAcceptanceStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP2PreLiveAcceptanceStatusPayload(payload.acceptance);
}

function isP2PreLiveAcceptanceStatusPayload(value: unknown): value is P2PreLiveAcceptanceStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PreLiveAcceptanceStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p2PreLiveAcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    (payload.adapterId === null || typeof payload.adapterId === "string") &&
    (payload.promotionStatus === null || typeof payload.promotionStatus === "string") &&
    (payload.checklistStatus === null || typeof payload.checklistStatus === "string") &&
    typeof payload.passedGateCount === "number" &&
    typeof payload.totalGateCount === "number" &&
    typeof payload.blockingGateCount === "number" &&
    Array.isArray(payload.gateIds) &&
    payload.gateIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.manualRouteCandidate === "boolean" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2PreLiveAcceptanceManifestPayload(payload.manifest))
  );
}

function isP2PreLiveAcceptanceManifestPayload(value: unknown): value is P2PreLiveAcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PreLiveAcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.adapterId === "string" &&
    typeof payload.promotionStatus === "string" &&
    typeof payload.checklistStatus === "string" &&
    typeof payload.passedGateCount === "number" &&
    typeof payload.totalGateCount === "number" &&
    typeof payload.blockingGateCount === "number" &&
    Array.isArray(payload.gateIds) &&
    payload.gateIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    typeof payload.manualRouteCandidate === "boolean" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP2PreLiveAcceptanceManifestCheckPayload)
  );
}

function isP2PreLiveAcceptanceManifestCheckPayload(
  value: unknown
): value is P2PreLiveAcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P2PreLiveAcceptanceManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isP2PaperReplayLatestPayload(value: unknown): value is { replay: P2PaperReplayStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { replay?: unknown };
  return isP2PaperReplayStatusPayload(payload.replay);
}

function isP2PaperReplayStatusPayload(value: unknown): value is P2PaperReplayStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PaperReplayStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p2PaperReplayStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    (payload.adapterId === null || typeof payload.adapterId === "string") &&
    (payload.replayStatus === null || typeof payload.replayStatus === "string") &&
    typeof payload.passedCheckCount === "number" &&
    typeof payload.totalCheckCount === "number" &&
    typeof payload.warningCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    (payload.latestEvidenceId === null || typeof payload.latestEvidenceId === "string") &&
    isP2PaperReplayMetricsPayload(payload.metrics) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2PaperReplayManifestPayload(payload.manifest))
  );
}

function isP2PaperReplayManifestPayload(value: unknown): value is P2PaperReplayManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PaperReplayManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.adapterId === "string" &&
    typeof payload.replayStatus === "string" &&
    typeof payload.passedCheckCount === "number" &&
    typeof payload.totalCheckCount === "number" &&
    typeof payload.warningCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    typeof payload.latestEvidenceId === "string" &&
    isP2PaperReplayMetricsPayload(payload.metrics) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP2PaperReplayManifestCheckPayload)
  );
}

function isP2PaperReplayManifestCheckPayload(value: unknown): value is P2PaperReplayManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P2PaperReplayManifestCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.status === "string" &&
    typeof check.summary === "string" &&
    typeof check.evidenceId === "string"
  );
}

function isP2PaperReplayMetricsPayload(value: unknown): value is P2PaperReplayMetrics {
  if (!value || typeof value !== "object") {
    return false;
  }
  const metrics = value as Partial<P2PaperReplayMetrics>;
  return (
    typeof metrics.filledPaperOrders === "number" &&
    typeof metrics.portfolioOrders === "number" &&
    typeof metrics.approvedPortfolioOrders === "number" &&
    typeof metrics.portfolioFilledOrders === "number" &&
    typeof metrics.stateHistoryFilledEvents === "number" &&
    typeof metrics.adapterPaperExecutions === "number" &&
    typeof metrics.replayWarnings === "number"
  );
}

function isP2ReadinessAcceptanceLatestPayload(
  value: unknown
): value is { acceptance: P2ReadinessAcceptanceReadbackStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP2ReadinessAcceptanceStatusPayload(payload.acceptance);
}

function isP2ReadinessAcceptanceGeneratePayload(value: unknown): value is {
  status: "acceptance_generated";
  acceptance: P2ReadinessAcceptanceReadbackStatus;
  auditEvent: AuditEventRecord;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ReadinessAcceptanceGenerateResult>;
  return (
    payload.status === "acceptance_generated" &&
    isP2ReadinessAcceptanceStatusPayload(payload.acceptance) &&
    isAuditEventRecord(payload.auditEvent) &&
    payload.paperOnly === true &&
    payload.orderSubmissionEnabled === false &&
    payload.liveTradingAllowed === false &&
    payload.liveOrderSubmitted === false &&
    payload.routeExecuted === false
  );
}

function isP2ReadinessAcceptanceStatusPayload(value: unknown): value is P2ReadinessAcceptanceReadbackStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ReadinessAcceptanceReadbackStatus>;
  const validStatus = payload.status === "accepted" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p2ReadinessAcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    (payload.adapterId === null || typeof payload.adapterId === "string") &&
    (payload.p1AcceptanceRunId === null || typeof payload.p1AcceptanceRunId === "string") &&
    (payload.p2PreLiveAcceptanceRunId === null || typeof payload.p2PreLiveAcceptanceRunId === "string") &&
    (payload.p2PaperReplayRunId === null || typeof payload.p2PaperReplayRunId === "string") &&
    (payload.operatorRunbookAuditEventId === null ||
      typeof payload.operatorRunbookAuditEventId === "string") &&
    (payload.readinessCoverageStatus === null || typeof payload.readinessCoverageStatus === "string") &&
    typeof payload.acceptedCriterionCount === "number" &&
    typeof payload.totalCriterionCount === "number" &&
    typeof payload.blockingCriterionCount === "number" &&
    Array.isArray(payload.criterionIds) &&
    payload.criterionIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    isP2ReadinessAcceptanceManifestPathsPayload(payload.manifestPaths) &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2ReadinessAcceptanceManifestPayload(payload.manifest))
  );
}

function isP2ReadinessAcceptanceManifestPayload(value: unknown): value is P2ReadinessAcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ReadinessAcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.adapterId === "string" &&
    typeof payload.p1AcceptanceRunId === "string" &&
    typeof payload.p2PreLiveAcceptanceRunId === "string" &&
    typeof payload.p2PaperReplayRunId === "string" &&
    typeof payload.operatorRunbookAuditEventId === "string" &&
    typeof payload.readinessCoverageStatus === "string" &&
    typeof payload.acceptedCriterionCount === "number" &&
    typeof payload.totalCriterionCount === "number" &&
    typeof payload.blockingCriterionCount === "number" &&
    Array.isArray(payload.criterionIds) &&
    payload.criterionIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    isP2ReadinessAcceptanceManifestPathsPayload(payload.manifestPaths) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP2ReadinessAcceptanceManifestCheckPayload)
  );
}

function isP2ReadinessAcceptanceManifestPathsPayload(
  value: unknown
): value is P2ReadinessAcceptanceManifestPaths {
  if (!value || typeof value !== "object") {
    return false;
  }
  const paths = value as Partial<P2ReadinessAcceptanceManifestPaths>;
  return (
    (paths.p1Acceptance === null || typeof paths.p1Acceptance === "string") &&
    (paths.p2PreLiveAcceptance === null || typeof paths.p2PreLiveAcceptance === "string") &&
    (paths.p2PaperReplay === null || typeof paths.p2PaperReplay === "string")
  );
}

function isP2ReadinessAcceptanceManifestCheckPayload(
  value: unknown
): value is P2ReadinessAcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P2ReadinessAcceptanceManifestCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.status === "string" &&
    typeof check.summary === "string" &&
    typeof check.evidenceId === "string"
  );
}

function isP2ManifestChainPreflightLatestPayload(
  value: unknown
): value is { preflight: P2ManifestChainPreflightStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { preflight?: unknown };
  return isP2ManifestChainPreflightStatusPayload(payload.preflight);
}

function isP2ManifestChainPreflightGeneratePayload(
  value: unknown
): value is {
  status: "preflight_generated";
  preflight: P2ManifestChainPreflightStatus;
  auditEvent: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { status?: unknown; preflight?: unknown; auditEvent?: unknown };
  return (
    payload.status === "preflight_generated" &&
    isP2ManifestChainPreflightStatusPayload(payload.preflight) &&
    isAuditEventRecord(payload.auditEvent)
  );
}

function isP2ManifestChainPreflightStatusPayload(value: unknown): value is P2ManifestChainPreflightStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ManifestChainPreflightStatus>;
  const validStatus =
    payload.status === "ready" ||
    payload.status === "blocked" ||
    payload.status === "missing" ||
    payload.status === "invalid";
  return (
    payload.kind === "aiqt.p2ManifestChainPreflightStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    typeof payload.ready === "boolean" &&
    typeof payload.validStageCount === "number" &&
    typeof payload.totalStageCount === "number" &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    typeof payload.nextAction === "string" &&
    typeof payload.nextCommand === "string" &&
    Array.isArray(payload.stages) &&
    payload.stages.every(isP2ManifestChainPreflightStagePayload) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2ManifestChainPreflightManifestPayload(payload.manifest))
  );
}

function isP2ManifestChainPreflightManifestPayload(
  value: unknown
): value is P2ManifestChainPreflightManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ManifestChainPreflightManifest>;
  const validStatus = payload.status === "ready" || payload.status === "blocked";
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    validStatus &&
    typeof payload.ready === "boolean" &&
    typeof payload.validStageCount === "number" &&
    typeof payload.totalStageCount === "number" &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    typeof payload.nextAction === "string" &&
    typeof payload.nextCommand === "string" &&
    Array.isArray(payload.stages) &&
    payload.stages.every(isP2ManifestChainPreflightStagePayload) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean"
  );
}

function isP2ManifestChainPreflightStagePayload(value: unknown): value is P2ManifestChainPreflightStageSource {
  if (!value || typeof value !== "object") {
    return false;
  }
  const stage = value as Partial<P2ManifestChainPreflightStageSource>;
  const validStatus = stage.status === "valid" || stage.status === "missing" || stage.status === "invalid";
  return (
    typeof stage.id === "string" &&
    typeof stage.label === "string" &&
    validStatus &&
    typeof stage.path === "string" &&
    typeof stage.summary === "string" &&
    typeof stage.reason === "string" &&
    typeof stage.nextAction === "string" &&
    typeof stage.nextCommand === "string"
  );
}

function isResearchRunExportPayload(value: unknown): value is { export: ResearchRunExportPackage } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { export?: unknown };
  return isResearchRunExportPackage(payload.export);
}

function isResearchRunImportPayload(value: unknown): value is {
  run: ResearchRunAudit;
  undoToken?: string;
  undo?: ResearchRunImportUndoRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { run?: unknown; undoToken?: unknown; undo?: unknown };
  return (
    isResearchRunAudit(payload.run) &&
    Boolean(payload.run.dataSnapshot) &&
    (payload.undoToken === undefined || typeof payload.undoToken === "string") &&
    (payload.undo === undefined || isResearchRunImportUndoRecord(payload.undo))
  );
}

function isResearchRunImportUndoPayload(value: unknown): value is {
  undo: ResearchRunImportUndoRecord;
  run: ResearchRunAudit | null;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { undo?: unknown; run?: unknown };
  return isResearchRunImportUndoRecord(payload.undo) && (payload.run === null || isResearchRunAudit(payload.run));
}

function isResearchRunImportUndoRecord(value: unknown): value is ResearchRunImportUndoRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const undo = value as Partial<ResearchRunImportUndoRecord>;
  return (
    typeof undo.undoToken === "string" &&
    typeof undo.runId === "string" &&
    typeof undo.createdAt === "string" &&
    (undo.consumedAt === null || typeof undo.consumedAt === "string") &&
    typeof undo.status === "string"
  );
}

function isResearchNotePayload(value: unknown): value is { note: ResearchNote } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { note?: unknown };
  return isResearchNote(payload.note);
}

function isResearchNote(value: unknown): value is ResearchNote {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Partial<ResearchNote>;
  return (
    isMarket(note.market) &&
    typeof note.symbol === "string" &&
    isTimeframe(note.timeframe) &&
    typeof note.body === "string" &&
    (note.updatedAt === null || typeof note.updatedAt === "string")
  );
}

function isHandoffNotesPayload(value: unknown): value is {
  handoffNotes: HandoffNote[];
  pagination?: HandoffNotesResult["pagination"];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { handoffNotes?: unknown; pagination?: unknown };
  return (
    Array.isArray(payload.handoffNotes) &&
    payload.handoffNotes.every(isHandoffNote) &&
    (payload.pagination === undefined || isHandoffNotesPagination(payload.pagination))
  );
}

function isHandoffNoteSavePayload(value: unknown): value is { handoffNote: HandoffNote; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { handoffNote?: unknown; auditEvent?: unknown };
  return isHandoffNote(payload.handoffNote) && (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent));
}

function isHandoffNotesPagination(value: unknown): value is NonNullable<HandoffNotesResult["pagination"]> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pagination = value as NonNullable<HandoffNotesResult["pagination"]>;
  return (
    typeof pagination.limit === "number" &&
    typeof pagination.offset === "number" &&
    typeof pagination.total === "number"
  );
}

function isHandoffNote(value: unknown): value is HandoffNote {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Partial<HandoffNote>;
  return (
    note.schemaVersion === 1 &&
    typeof note.noteId === "string" &&
    isHandoffNoteSubjectType(note.subjectType) &&
    typeof note.subjectId === "string" &&
    typeof note.body === "string" &&
    typeof note.author === "string" &&
    typeof note.sourceWorkspace === "string" &&
    typeof note.updatedAt === "string" &&
    (note.auditEventId === null || typeof note.auditEventId === "string") &&
    typeof note.paperOnly === "boolean" &&
    typeof note.liveTradingAllowed === "boolean"
  );
}

function isHandoffNoteSubjectType(value: unknown): value is HandoffNoteSubjectType {
  return (
    value === "research_run" ||
    value === "strategy_version" ||
    value === "portfolio_order_batch" ||
    value === "p0_acceptance"
  );
}

function isPaperExecutionPayload(value: unknown): value is { execution: PaperExecutionRecord; promotion?: PromotionCandidateRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { execution?: unknown; promotion?: unknown };
  return isPaperExecutionRecord(payload.execution) && (payload.promotion === undefined || isPromotionCandidateRecord(payload.promotion));
}

function isPaperExecutionHistoryPayload(value: unknown): value is { executions: PaperExecutionRecord[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { executions?: unknown };
  return Array.isArray(payload.executions) && payload.executions.every(isPaperExecutionRecord);
}

function isPromotionCandidatePayload(value: unknown): value is { promotion: PromotionCandidateRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { promotion?: unknown };
  return isPromotionCandidateRecord(payload.promotion);
}

function isAiReviewRunRecordPayload(value: unknown): value is { aiReview: AiReviewRunRecordEnvelope } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { aiReview?: unknown };
  return isAiReviewRunRecordEnvelope(payload.aiReview);
}

function isP0AiReviewRunPayload(value: unknown): value is {
  status: "ai_review_saved";
  mode: "local_evidence_review";
  aiReview: AiReviewRunRecordEnvelope;
  paperOnly: true;
  liveTradingAllowed: false;
  directTradingInstructionBlocked: true;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    status?: unknown;
    mode?: unknown;
    aiReview?: unknown;
    paperOnly?: unknown;
    liveTradingAllowed?: unknown;
    directTradingInstructionBlocked?: unknown;
  };
  return (
    payload.status === "ai_review_saved" &&
    payload.mode === "local_evidence_review" &&
    isAiReviewRunRecordEnvelope(payload.aiReview) &&
    payload.paperOnly === true &&
    payload.liveTradingAllowed === false &&
    payload.directTradingInstructionBlocked === true
  );
}

function isP0PaperSimulationPayload(value: unknown): value is P0PaperSimulationResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0PaperSimulationResponse>;
  return (
    payload.status === "paper_simulation_created" &&
    typeof payload.runId === "string" &&
    payload.runId.length > 0 &&
    payload.paperOnly === true &&
    payload.liveTradingAllowed === false &&
    (payload.orderSubmitted === undefined || payload.orderSubmitted === false) &&
    (payload.liveOrderSubmitted === undefined || payload.liveOrderSubmitted === false) &&
    (payload.routeExecuted === undefined || payload.routeExecuted === false) &&
    typeof payload.liveRouteBlockedReason === "string" &&
    payload.liveRouteBlockedReason.length > 0 &&
    isPaperExecutionRecord(payload.execution) &&
    isP0PaperSimulationFill(payload.simulatedFill) &&
    isP0PaperSimulationAccountReplay(payload.accountReplay) &&
    (payload.gates === undefined || (Array.isArray(payload.gates) && payload.gates.every(isP0PaperSimulationGate))) &&
    (payload.aiReview === undefined || isAiReviewRunRecordEnvelope(payload.aiReview)) &&
    (payload.promotion === undefined || isPromotionCandidateRecord(payload.promotion)) &&
    isAuditEventRecord(payload.auditEvent) &&
    isP0PaperSimulationExportReadiness(payload.exportReadiness)
  );
}

function isP0PaperSimulationFill(value: unknown): value is P0PaperSimulationFill {
  if (!value || typeof value !== "object") {
    return false;
  }
  const fill = value as Partial<P0PaperSimulationFill>;
  return (
    typeof fill.orderId === "string" &&
    typeof fill.symbol === "string" &&
    (fill.side === "buy" || fill.side === "sell") &&
    typeof fill.quantity === "number" &&
    typeof fill.fillPrice === "number" &&
    (fill.status === "filled" || fill.status === "rejected") &&
    typeof fill.filledAt === "string" &&
    typeof fill.reason === "string"
  );
}

function isP0PaperSimulationAccountReplay(value: unknown): value is P0PaperSimulationAccountReplay {
  if (!value || typeof value !== "object") {
    return false;
  }
  const replay = value as Partial<P0PaperSimulationAccountReplay>;
  return (
    replay.mode === "single_run_paper_replay" &&
    typeof replay.runId === "string" &&
    typeof replay.symbol === "string" &&
    typeof replay.initialCash === "number" &&
    typeof replay.cashAfter === "number" &&
    typeof replay.positionAfter === "number" &&
    typeof replay.equityAfter === "number" &&
    typeof replay.ordersApplied === "number" &&
    replay.paperOnly === true &&
    replay.liveTradingAllowed === false
  );
}

function isP0PaperSimulationGate(value: unknown): value is P0PaperSimulationGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<P0PaperSimulationGate>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    (gate.status === "passed" || gate.status === "blocked" || gate.status === "review") &&
    typeof gate.detail === "string"
  );
}

function isP0PaperSimulationExportReadiness(value: unknown): value is P0PaperSimulationExportReadiness {
  if (!value || typeof value !== "object") {
    return false;
  }
  const readiness = value as Partial<P0PaperSimulationExportReadiness>;
  return (
    typeof readiness.ready === "boolean" &&
    Array.isArray(readiness.requiredArtifacts) &&
    readiness.requiredArtifacts.every((item) => typeof item === "string") &&
    typeof readiness.paperExecutionId === "string" &&
    typeof readiness.auditEventId === "string" &&
    typeof readiness.detail === "string"
  );
}

function isAiReviewRunHistoryPayload(value: unknown): value is {
  aiReviews: AiReviewRunRecordEnvelope[];
  pagination?: AiReviewRunHistoryPagination;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { aiReviews?: unknown; pagination?: unknown };
  return (
    Array.isArray(payload.aiReviews) &&
    payload.aiReviews.every(isAiReviewRunRecordEnvelope) &&
    (payload.pagination === undefined || isAiReviewRunHistoryPagination(payload.pagination))
  );
}

function isAiReviewRunHistoryPagination(value: unknown): value is AiReviewRunHistoryPagination {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pagination = value as Partial<AiReviewRunHistoryPagination>;
  return (
    typeof pagination.limit === "number" &&
    typeof pagination.offset === "number" &&
    typeof pagination.total === "number" &&
    typeof pagination.query === "string"
  );
}

function isAuditEventPayload(value: unknown): value is { event: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { event?: unknown };
  return isAuditEventRecord(payload.event);
}

function isAuditReportSignaturePayload(value: unknown): value is {
  event: AuditEventRecord;
  signature: Record<string, unknown>;
  verification: AuditReportSignatureVerification;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { event?: unknown; signature?: unknown; verification?: unknown };
  return (
    isAuditEventRecord(payload.event) &&
    isPlainRecord(payload.signature) &&
    isAuditReportSignatureVerification(payload.verification)
  );
}

function isAuditReportSignatureVerification(value: unknown): value is AuditReportSignatureVerification {
  if (!value || typeof value !== "object") {
    return false;
  }
  const verification = value as Partial<AuditReportSignatureVerification>;
  return (
    (verification.status === "verified" || verification.status === "invalid") &&
    typeof verification.reason === "string"
  );
}

function isAuditSigningKeyRegistryPayload(value: unknown): value is { registry: AuditSigningKeyRegistry } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { registry?: unknown };
  return isAuditSigningKeyRegistry(payload.registry);
}

function isAuditSigningKeyRegistry(value: unknown): value is AuditSigningKeyRegistry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const registry = value as Partial<AuditSigningKeyRegistry>;
  return (
    registry.schemaVersion === 1 &&
    typeof registry.generatedAt === "string" &&
    typeof registry.activeKeyId === "string" &&
    typeof registry.rotationRequired === "boolean" &&
    Array.isArray(registry.keys) &&
    registry.keys.every(isAuditSigningKeyRecord)
  );
}

function isAuditSigningKeyRecord(value: unknown): value is AuditSigningKeyRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, "secret")) {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRecord>;
  return (
    typeof key.keyId === "string" &&
    typeof key.signer === "string" &&
    key.algorithm === "hmac-sha256" &&
    typeof key.chainId === "string" &&
    (key.status === "active" || key.status === "retired" || key.status === "revoked") &&
    typeof key.source === "string" &&
    typeof key.fingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(key.fingerprint) &&
    typeof key.canSign === "boolean" &&
    typeof key.canVerify === "boolean" &&
    (key.createdAt === null || typeof key.createdAt === "string") &&
    (key.activatedAt === null || typeof key.activatedAt === "string") &&
    (key.retiredAt === null || typeof key.retiredAt === "string")
  );
}

function isAuditSigningKeyRotationPlanPayload(value: unknown): value is { rotationPlan: AuditSigningKeyRotationPlan } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationPlan?: unknown };
  return isAuditSigningKeyRotationPlan(payload.rotationPlan);
}

function isAuditSigningKeyRotationPlan(value: unknown): value is AuditSigningKeyRotationPlan {
  if (!value || typeof value !== "object" || containsDisallowedSecretField(value)) {
    return false;
  }
  const plan = value as Partial<AuditSigningKeyRotationPlan>;
  return (
    plan.schemaVersion === 1 &&
    typeof plan.generatedAt === "string" &&
    isAuditSigningKeyRotationCurrentKey(plan.currentActiveKey) &&
    isAuditSigningKeyRotationProposedKey(plan.proposedActiveKey) &&
    typeof plan.rotationRequired === "boolean" &&
    typeof plan.requiresRestart === "boolean" &&
    Array.isArray(plan.environmentUpdates) &&
    plan.environmentUpdates.every(isAuditSigningKeyRotationEnvUpdate) &&
    typeof plan.legacyRegistryTemplate === "string" &&
    Array.isArray(plan.steps) &&
    plan.steps.every(isAuditSigningKeyRotationStep) &&
    Array.isArray(plan.blockedReasons) &&
    plan.blockedReasons.every((reason) => typeof reason === "string")
  );
}

function isAuditSigningKeyRotationCurrentKey(
  value: unknown
): value is AuditSigningKeyRotationPlan["currentActiveKey"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRotationPlan["currentActiveKey"]>;
  return (
    typeof key.keyId === "string" &&
    typeof key.signer === "string" &&
    typeof key.chainId === "string" &&
    typeof key.fingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(key.fingerprint)
  );
}

function isAuditSigningKeyRotationProposedKey(
  value: unknown
): value is AuditSigningKeyRotationPlan["proposedActiveKey"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRotationPlan["proposedActiveKey"]>;
  return typeof key.keyId === "string" && typeof key.signer === "string" && typeof key.chainId === "string";
}

function isAuditSigningKeyRotationEnvUpdate(value: unknown): value is AuditSigningKeyRotationPlanEnvUpdate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const update = value as Partial<AuditSigningKeyRotationPlanEnvUpdate>;
  return (
    typeof update.name === "string" &&
    typeof update.value === "string" &&
    (update.sensitivity === "public" || update.sensitivity === "secret")
  );
}

function isAuditSigningKeyRotationStep(value: unknown): value is AuditSigningKeyRotationPlanStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<AuditSigningKeyRotationPlanStep>;
  return (
    typeof step.id === "string" &&
    typeof step.title === "string" &&
    typeof step.detail === "string" &&
    (step.status === "manual" || step.status === "required" || step.status === "blocked")
  );
}

function isAuditSigningKeyRotationApplyPayload(value: unknown): value is { rotationApply: AuditSigningKeyRotationApply } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationApply?: unknown };
  return isAuditSigningKeyRotationApply(payload.rotationApply);
}

function isAuditSigningKeyRotationApply(value: unknown): value is AuditSigningKeyRotationApply {
  if (!value || typeof value !== "object" || containsDisallowedSecretField(value)) {
    return false;
  }
  const rotationApply = value as Partial<AuditSigningKeyRotationApply>;
  return (
    rotationApply.schemaVersion === 1 &&
    typeof rotationApply.generatedAt === "string" &&
    (rotationApply.status === "blocked" || rotationApply.status === "ready_for_restart") &&
    rotationApply.applyMode === "manual_secret_store" &&
    rotationApply.auditEventType === "audit_signing_key_rotation_apply" &&
    typeof rotationApply.currentActiveKeyId === "string" &&
    typeof rotationApply.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(rotationApply.currentActiveKeyFingerprint) &&
    typeof rotationApply.proposedActiveKeyId === "string" &&
    typeof rotationApply.proposedSigner === "string" &&
    typeof rotationApply.proposedChainId === "string" &&
    typeof rotationApply.restartRequired === "boolean" &&
    Array.isArray(rotationApply.requiredConfirmations) &&
    rotationApply.requiredConfirmations.every(isAuditSigningKeyRotationApplyConfirmation) &&
    Array.isArray(rotationApply.blockedReasons) &&
    rotationApply.blockedReasons.every((reason) => typeof reason === "string") &&
    Array.isArray(rotationApply.environmentUpdateNames) &&
    rotationApply.environmentUpdateNames.every((name) => typeof name === "string") &&
    Array.isArray(rotationApply.secretPlaceholderNames) &&
    rotationApply.secretPlaceholderNames.every((name) => typeof name === "string")
  );
}

function isAuditSigningKeyRotationApplyConfirmation(
  value: unknown
): value is AuditSigningKeyRotationApplyConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRotationApplyConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyControlledRestartEvidencePayload(
  value: unknown
): value is { restartEvidence: AuditSigningKeyControlledRestartEvidence; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { restartEvidence?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyControlledRestartEvidence(payload.restartEvidence) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyControlledRestartEvidence(
  value: unknown
): value is AuditSigningKeyControlledRestartEvidence {
  if (!value || typeof value !== "object") {
    return false;
  }
  const evidence = value as Partial<AuditSigningKeyControlledRestartEvidence>;
  return (
    evidence.schemaVersion === 1 &&
    typeof evidence.evidenceId === "string" &&
    typeof evidence.applyEventId === "string" &&
    typeof evidence.currentActiveKeyId === "string" &&
    typeof evidence.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(evidence.currentActiveKeyFingerprint) &&
    typeof evidence.proposedActiveKeyId === "string" &&
    typeof evidence.proposedSigner === "string" &&
    typeof evidence.proposedChainId === "string" &&
    isAuditSigningKeyControlledRestartEvidenceStatus(evidence.status) &&
    typeof evidence.operator === "string" &&
    typeof evidence.recordedAt === "string" &&
    evidence.evidenceMode === "manual_controlled_restart" &&
    typeof evidence.restartRequired === "boolean" &&
    Array.isArray(evidence.requiredConfirmations) &&
    evidence.requiredConfirmations.every(isAuditSigningKeyControlledRestartEvidenceConfirmation) &&
    Array.isArray(evidence.blockedReasons) &&
    evidence.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(evidence.metadata) &&
    evidence.liveTradingAllowed === false &&
    evidence.paperOnly === true
  );
}

function isAuditSigningKeyControlledRestartEvidenceConfirmation(
  value: unknown
): value is AuditSigningKeyControlledRestartEvidenceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyControlledRestartEvidenceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyControlledRestartEvidenceStatus(
  value: unknown
): value is AuditSigningKeyControlledRestartEvidenceStatus {
  return value === "blocked" || value === "evidence_recorded";
}

function isAuditSigningKeySecretMaterializationPayload(
  value: unknown
): value is { secretMaterialization: AuditSigningKeySecretMaterialization; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { secretMaterialization?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeySecretMaterialization(payload.secretMaterialization) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeySecretMaterializationHistoryPayload(
  value: unknown
): value is { secretMaterializations: AuditSigningKeySecretMaterialization[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { secretMaterializations?: unknown };
  return (
    Array.isArray(payload.secretMaterializations) &&
    payload.secretMaterializations.every(isAuditSigningKeySecretMaterialization)
  );
}

function isAuditSigningKeySecretMaterialization(
  value: unknown
): value is AuditSigningKeySecretMaterialization {
  if (!value || typeof value !== "object") {
    return false;
  }
  const materialization = value as Partial<AuditSigningKeySecretMaterialization>;
  return (
    materialization.schemaVersion === 1 &&
    typeof materialization.materializationId === "string" &&
    typeof materialization.planEventId === "string" &&
    typeof materialization.currentActiveKeyId === "string" &&
    typeof materialization.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(materialization.currentActiveKeyFingerprint) &&
    typeof materialization.proposedActiveKeyId === "string" &&
    typeof materialization.proposedSigner === "string" &&
    typeof materialization.proposedChainId === "string" &&
    isAuditSigningKeySecretMaterializationStatus(materialization.status) &&
    typeof materialization.operator === "string" &&
    typeof materialization.recordedAt === "string" &&
    materialization.materializationMode === "local_secret_store_manifest" &&
    typeof materialization.backend === "string" &&
    typeof materialization.manifestPath === "string" &&
    Array.isArray(materialization.requiredEnvVars) &&
    materialization.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(materialization.secretPlaceholderNames) &&
    materialization.secretPlaceholderNames.every((name) => typeof name === "string") &&
    Array.isArray(materialization.requiredConfirmations) &&
    materialization.requiredConfirmations.every(isAuditSigningKeySecretMaterializationConfirmation) &&
    Array.isArray(materialization.blockedReasons) &&
    materialization.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(materialization.metadata) &&
    materialization.liveTradingAllowed === false &&
    materialization.paperOnly === true
  );
}

function isAuditSigningKeySecretMaterializationConfirmation(
  value: unknown
): value is AuditSigningKeySecretMaterializationConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeySecretMaterializationConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeySecretMaterializationStatus(
  value: unknown
): value is AuditSigningKeySecretMaterializationStatus {
  return value === "blocked" || value === "manifest_recorded";
}

function isAuditSigningKeyEnvironmentBindingPayload(
  value: unknown
): value is { environmentBinding: AuditSigningKeyEnvironmentBinding; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { environmentBinding?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyEnvironmentBinding(payload.environmentBinding) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyEnvironmentBindingHistoryPayload(
  value: unknown
): value is { environmentBindings: AuditSigningKeyEnvironmentBinding[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { environmentBindings?: unknown };
  return Array.isArray(payload.environmentBindings) && payload.environmentBindings.every(isAuditSigningKeyEnvironmentBinding);
}

function isAuditSigningKeyEnvironmentBinding(
  value: unknown
): value is AuditSigningKeyEnvironmentBinding {
  if (!value || typeof value !== "object") {
    return false;
  }
  const binding = value as Partial<AuditSigningKeyEnvironmentBinding>;
  return (
    binding.schemaVersion === 1 &&
    typeof binding.bindingId === "string" &&
    typeof binding.materializationId === "string" &&
    typeof binding.planEventId === "string" &&
    typeof binding.currentActiveKeyId === "string" &&
    typeof binding.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(binding.currentActiveKeyFingerprint) &&
    typeof binding.proposedActiveKeyId === "string" &&
    typeof binding.proposedSigner === "string" &&
    typeof binding.proposedChainId === "string" &&
    isAuditSigningKeyEnvironmentBindingStatus(binding.status) &&
    typeof binding.operator === "string" &&
    typeof binding.recordedAt === "string" &&
    binding.bindingMode === "container_env_reference" &&
    typeof binding.backend === "string" &&
    typeof binding.manifestPath === "string" &&
    Array.isArray(binding.requiredEnvVars) &&
    binding.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(binding.requiredConfirmations) &&
    binding.requiredConfirmations.every(isAuditSigningKeyEnvironmentBindingConfirmation) &&
    Array.isArray(binding.blockedReasons) &&
    binding.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(binding.metadata) &&
    binding.liveTradingAllowed === false &&
    binding.paperOnly === true
  );
}

function isAuditSigningKeyEnvironmentBindingConfirmation(
  value: unknown
): value is AuditSigningKeyEnvironmentBindingConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyEnvironmentBindingConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyEnvironmentBindingStatus(
  value: unknown
): value is AuditSigningKeyEnvironmentBindingStatus {
  return value === "blocked" || value === "binding_recorded";
}

function isAuditSigningKeyRuntimeReloadPlanPayload(
  value: unknown
): value is { runtimeReloadPlan: AuditSigningKeyRuntimeReloadPlan; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadPlan?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyRuntimeReloadPlan(payload.runtimeReloadPlan) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyRuntimeReloadPlanHistoryPayload(
  value: unknown
): value is { runtimeReloadPlans: AuditSigningKeyRuntimeReloadPlan[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadPlans?: unknown };
  return Array.isArray(payload.runtimeReloadPlans) && payload.runtimeReloadPlans.every(isAuditSigningKeyRuntimeReloadPlan);
}

function isAuditSigningKeyRuntimeReloadPlan(
  value: unknown
): value is AuditSigningKeyRuntimeReloadPlan {
  if (!value || typeof value !== "object") {
    return false;
  }
  const plan = value as Partial<AuditSigningKeyRuntimeReloadPlan>;
  return (
    plan.schemaVersion === 1 &&
    typeof plan.planId === "string" &&
    typeof plan.bindingId === "string" &&
    typeof plan.materializationId === "string" &&
    typeof plan.planEventId === "string" &&
    typeof plan.currentActiveKeyId === "string" &&
    typeof plan.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(plan.currentActiveKeyFingerprint) &&
    typeof plan.proposedActiveKeyId === "string" &&
    typeof plan.proposedSigner === "string" &&
    typeof plan.proposedChainId === "string" &&
    isAuditSigningKeyRuntimeReloadPlanStatus(plan.status) &&
    typeof plan.operator === "string" &&
    typeof plan.recordedAt === "string" &&
    plan.reloadMode === "manual_container_reload_plan" &&
    typeof plan.maintenanceWindowId === "string" &&
    plan.bindingMode === "container_env_reference" &&
    typeof plan.backend === "string" &&
    typeof plan.manifestPath === "string" &&
    Array.isArray(plan.requiredEnvVars) &&
    plan.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(plan.requiredConfirmations) &&
    plan.requiredConfirmations.every(isAuditSigningKeyRuntimeReloadPlanConfirmation) &&
    Array.isArray(plan.blockedReasons) &&
    plan.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(plan.metadata) &&
    plan.liveTradingAllowed === false &&
    plan.paperOnly === true
  );
}

function isAuditSigningKeyRuntimeReloadPlanConfirmation(
  value: unknown
): value is AuditSigningKeyRuntimeReloadPlanConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRuntimeReloadPlanConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyRuntimeReloadPlanStatus(
  value: unknown
): value is AuditSigningKeyRuntimeReloadPlanStatus {
  return value === "blocked" || value === "plan_recorded";
}

function isAuditSigningKeyRuntimeReloadExecutionPayload(
  value: unknown
): value is { runtimeReloadExecution: AuditSigningKeyRuntimeReloadExecution; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadExecution?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyRuntimeReloadExecution(payload.runtimeReloadExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyRuntimeReloadExecutionHistoryPayload(
  value: unknown
): value is { runtimeReloadExecutions: AuditSigningKeyRuntimeReloadExecution[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runtimeReloadExecutions?: unknown };
  return (
    Array.isArray(payload.runtimeReloadExecutions) &&
    payload.runtimeReloadExecutions.every(isAuditSigningKeyRuntimeReloadExecution)
  );
}

function isAuditSigningKeyRuntimeReloadExecution(
  value: unknown
): value is AuditSigningKeyRuntimeReloadExecution {
  if (!value || typeof value !== "object") {
    return false;
  }
  const execution = value as Partial<AuditSigningKeyRuntimeReloadExecution>;
  return (
    execution.schemaVersion === 1 &&
    typeof execution.executionId === "string" &&
    typeof execution.planId === "string" &&
    typeof execution.bindingId === "string" &&
    typeof execution.materializationId === "string" &&
    typeof execution.planEventId === "string" &&
    typeof execution.currentActiveKeyId === "string" &&
    typeof execution.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(execution.currentActiveKeyFingerprint) &&
    typeof execution.proposedActiveKeyId === "string" &&
    typeof execution.proposedSigner === "string" &&
    typeof execution.proposedChainId === "string" &&
    isAuditSigningKeyRuntimeReloadExecutionStatus(execution.status) &&
    typeof execution.operator === "string" &&
    typeof execution.recordedAt === "string" &&
    execution.executionMode === "manual_controlled_reload_evidence" &&
    execution.reloadMode === "manual_container_reload_plan" &&
    typeof execution.maintenanceWindowId === "string" &&
    execution.bindingMode === "container_env_reference" &&
    typeof execution.backend === "string" &&
    typeof execution.manifestPath === "string" &&
    Array.isArray(execution.requiredEnvVars) &&
    execution.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(execution.requiredConfirmations) &&
    execution.requiredConfirmations.every(isAuditSigningKeyRuntimeReloadExecutionConfirmation) &&
    Array.isArray(execution.blockedReasons) &&
    execution.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(execution.metadata) &&
    execution.liveTradingAllowed === false &&
    execution.paperOnly === true
  );
}

function isAuditSigningKeyRuntimeReloadExecutionConfirmation(
  value: unknown
): value is AuditSigningKeyRuntimeReloadExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRuntimeReloadExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyRuntimeReloadExecutionStatus(
  value: unknown
): value is AuditSigningKeyRuntimeReloadExecutionStatus {
  return value === "blocked" || value === "execution_recorded";
}

function isAuditSigningKeyRotationAcceptancePayload(
  value: unknown
): value is { rotationAcceptance: AuditSigningKeyRotationAcceptance; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationAcceptance?: unknown; auditEvent?: unknown };
  return (
    isAuditSigningKeyRotationAcceptance(payload.rotationAcceptance) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isAuditSigningKeyRotationAcceptanceHistoryPayload(
  value: unknown
): value is { rotationAcceptances: AuditSigningKeyRotationAcceptance[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationAcceptances?: unknown };
  return (
    Array.isArray(payload.rotationAcceptances) &&
    payload.rotationAcceptances.every(isAuditSigningKeyRotationAcceptance)
  );
}

function isAuditSigningKeyRotationAcceptance(value: unknown): value is AuditSigningKeyRotationAcceptance {
  if (!value || typeof value !== "object") {
    return false;
  }
  const acceptance = value as Partial<AuditSigningKeyRotationAcceptance>;
  return (
    acceptance.schemaVersion === 1 &&
    typeof acceptance.acceptanceId === "string" &&
    typeof acceptance.executionId === "string" &&
    typeof acceptance.planId === "string" &&
    typeof acceptance.bindingId === "string" &&
    typeof acceptance.materializationId === "string" &&
    typeof acceptance.planEventId === "string" &&
    typeof acceptance.currentActiveKeyId === "string" &&
    typeof acceptance.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(acceptance.currentActiveKeyFingerprint) &&
    typeof acceptance.proposedActiveKeyId === "string" &&
    typeof acceptance.proposedSigner === "string" &&
    typeof acceptance.proposedChainId === "string" &&
    isAuditSigningKeyRotationAcceptanceStatus(acceptance.status) &&
    typeof acceptance.operator === "string" &&
    typeof acceptance.recordedAt === "string" &&
    acceptance.acceptanceMode === "manual_rotation_acceptance" &&
    acceptance.executionMode === "manual_controlled_reload_evidence" &&
    acceptance.reloadMode === "manual_container_reload_plan" &&
    typeof acceptance.maintenanceWindowId === "string" &&
    Array.isArray(acceptance.requiredEnvVars) &&
    acceptance.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(acceptance.requiredConfirmations) &&
    acceptance.requiredConfirmations.every(isAuditSigningKeyRotationAcceptanceConfirmation) &&
    Array.isArray(acceptance.blockedReasons) &&
    acceptance.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(acceptance.metadata) &&
    acceptance.liveTradingAllowed === false &&
    acceptance.paperOnly === true
  );
}

function isAuditSigningKeyRotationAcceptanceConfirmation(
  value: unknown
): value is AuditSigningKeyRotationAcceptanceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRotationAcceptanceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isAuditSigningKeyRotationAcceptanceStatus(
  value: unknown
): value is AuditSigningKeyRotationAcceptanceStatus {
  return value === "blocked" || value === "acceptance_recorded";
}

function containsDisallowedSecretField(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const disallowedSecretFields = new Set(["secret", "secretMaterial", "secretValue", "rawSecret", "privateKey", "keyMaterial"]);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    if (disallowedSecretFields.has(key)) {
      return true;
    }
    return typeof child === "object" && containsDisallowedSecretField(child);
  });
}

function isAuditEventHistoryPayload(value: unknown): value is {
  events: AuditEventRecord[];
  pagination?: AuditEventHistoryPagination;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { events?: unknown; pagination?: unknown };
  return (
    Array.isArray(payload.events) &&
    payload.events.every(isAuditEventRecord) &&
    (payload.pagination === undefined || isAuditEventHistoryPagination(payload.pagination))
  );
}

function isAuditEventHistoryPagination(value: unknown): value is AuditEventHistoryPagination {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pagination = value as Partial<AuditEventHistoryPagination>;
  return (
    typeof pagination.limit === "number" &&
    typeof pagination.offset === "number" &&
    typeof pagination.total === "number" &&
    typeof pagination.query === "string"
  );
}

function isAuditEventRecord(value: unknown): value is AuditEventRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<AuditEventRecord>;
  return (
    event.schemaVersion === 1 &&
    typeof event.eventId === "string" &&
    typeof event.eventType === "string" &&
    (event.runId === null || typeof event.runId === "string") &&
    typeof event.createdAt === "string" &&
    typeof event.stage === "string" &&
    typeof event.source === "string" &&
    typeof event.summary === "string" &&
    typeof event.detail === "string" &&
    isPlainRecord(event.metadata)
  );
}

function isPlatformSettingsPayload(value: unknown): value is { settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { settings?: unknown };
  return isPlatformSettingsStatus(payload.settings);
}

function isGoldenPathStatusPayload(value: unknown): value is { goldenPath: GoldenPathStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { goldenPath?: unknown };
  return isGoldenPathStatus(payload.goldenPath);
}

function isCacheRefreshPayload(
  value: unknown
): value is { refresh: CacheRefreshSummary; watchlistRefresh?: CacheWatchlistRefreshRun; settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { refresh?: unknown; watchlistRefresh?: unknown; settings?: unknown };
  return (
    isCacheRefreshSummary(payload.refresh) &&
    (payload.watchlistRefresh === undefined || isCacheWatchlistRefreshRun(payload.watchlistRefresh)) &&
    isPlatformSettingsStatus(payload.settings)
  );
}

function isCacheRefreshSummary(value: unknown): value is CacheRefreshSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const refresh = value as Partial<CacheRefreshSummary>;
  return (
    isMarket(refresh.market) &&
    typeof refresh.symbol === "string" &&
    isTimeframe(refresh.timeframe) &&
    typeof refresh.requestedLimit === "number" &&
    typeof refresh.upsertedRows === "number" &&
    isOptionalStringOrNull(refresh.overrideAuditEventId) &&
    isMarketKlineQuality(refresh.quality)
  );
}

function isCacheWatchlistRefreshPayload(
  value: unknown
): value is { watchlistRefresh: CacheWatchlistRefreshRun; settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { watchlistRefresh?: unknown; settings?: unknown };
  return isCacheWatchlistRefreshRun(payload.watchlistRefresh) && isPlatformSettingsStatus(payload.settings);
}

function isCacheWatchlistRefreshHistoryPayload(value: unknown): value is { watchlistRefreshes: CacheWatchlistRefreshRun[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { watchlistRefreshes?: unknown };
  return Array.isArray(payload.watchlistRefreshes) && payload.watchlistRefreshes.every(isCacheWatchlistRefreshRun);
}

function isCacheWatchlistRefreshRun(value: unknown): value is CacheWatchlistRefreshRun {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<CacheWatchlistRefreshRun>;
  return (
    typeof run.runId === "string" &&
    typeof run.createdAt === "string" &&
    isTimeframe(run.timeframe) &&
    typeof run.requestedLimit === "number" &&
    isOptionalStringOrNull(run.overrideAuditEventId) &&
    isCacheWatchlistRefreshRunSummary(run.summary) &&
    Array.isArray(run.items) &&
    run.items.every(isCacheWatchlistRefreshItem)
  );
}

function isCacheWatchlistRefreshRunSummary(value: unknown): value is CacheWatchlistRefreshRunSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<CacheWatchlistRefreshRunSummary>;
  return (
    typeof summary.totalSymbols === "number" &&
    typeof summary.refreshed === "number" &&
    typeof summary.skipped === "number" &&
    typeof summary.failed === "number" &&
    typeof summary.upsertedRows === "number"
  );
}

function isCacheWatchlistRefreshItem(value: unknown): value is CacheWatchlistRefreshItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<CacheWatchlistRefreshItem>;
  return (
    isCacheRefreshSummary(value) &&
    typeof item.name === "string" &&
    (item.status === "refreshed" || item.status === "skipped" || item.status === "failed") &&
    (item.error === null || typeof item.error === "string")
  );
}

function isOptionalStringOrNull(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function isStrategyLibraryPayload(value: unknown): value is { strategies: StrategyLibraryItem[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { strategies?: unknown };
  return Array.isArray(payload.strategies) && payload.strategies.every(isStrategyLibraryItem);
}

function isStrategyLibraryItemPayload(value: unknown): value is { strategy: StrategyLibraryItem } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { strategy?: unknown };
  return isStrategyLibraryItem(payload.strategy);
}

function isStrategyValidationPayload(value: unknown): value is { validation: StrategyValidation } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { validation?: unknown };
  return isStrategyValidation(payload.validation);
}

function isStrategyValidationErrorPayload(value: unknown): value is { error: string; validation: StrategyValidation } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { error?: unknown; validation?: unknown };
  return typeof payload.error === "string" && isStrategyValidation(payload.validation);
}

function isCoreErrorPayload(value: unknown): value is { error: string; detail?: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { error?: unknown; detail?: unknown };
  return typeof payload.error === "string" && (payload.detail === undefined || typeof payload.detail === "string");
}

function isStrategyExperimentErrorPayload(
  value: unknown
): value is { error: StrategyExperimentErrorCode; detail?: string } {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    isStrategyExperimentErrorCode(value.error) &&
    (value.detail === undefined || typeof value.detail === "string")
  );
}

function isStrategyExperimentErrorCode(value: unknown): value is StrategyExperimentErrorCode {
  return (
    value === "invalid_strategy_experiment" ||
    value === "strategy_not_found" ||
    value === "research_run_not_found" ||
    value === "strategy_experiment_not_found" ||
    value === "source_snapshot_reaudit_required" ||
    value === "strategy_experiment_conflict" ||
    value === "test_holdout_consumed" ||
    value === "strategy_experiment_failed"
  );
}

function isStrategyExperimentHistoryPayload(value: unknown): value is { experiments: StrategyExperimentListItem[] } {
  return (
    isPlainRecord(value) &&
    Array.isArray(value.experiments) &&
    value.experiments.every(isStrategyExperimentListItem)
  );
}

function isStrategyExperimentDetailPayload(value: unknown): value is { experiment: StrategyExperimentDetail } {
  return isPlainRecord(value) && isStrategyExperimentDetail(value.experiment);
}

function isStrategyExperimentListItem(value: unknown): value is StrategyExperimentListItem {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.experimentId === "string" &&
    typeof value.createdAt === "string" &&
    (value.status === "completed" || value.status === "failed") &&
    typeof value.definitionHash === "string" &&
    typeof value.holdoutKey === "string" &&
    typeof value.strategyLineageKey === "string" &&
    /^[0-9a-f]{64}$/.test(value.strategyLineageKey) &&
    typeof value.strategyRevision === "string" &&
    typeof value.sourceRunId === "string" &&
    typeof value.snapshotId === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    isTimeframe(value.timeframe) &&
    isStrategyExperimentDefinition(value.definition) &&
    typeof value.evaluationCount === "number" &&
    (value.selectedCandidateId === null || typeof value.selectedCandidateId === "string") &&
    (value.completionReason === null ||
      value.completionReason === "selected" ||
      value.completionReason === "no_eligible_candidate") &&
    (value.resultHash === null || typeof value.resultHash === "string") &&
    (value.errorCode === null || typeof value.errorCode === "string") &&
    (value.errorDetail === null || typeof value.errorDetail === "string")
  );
}

function isStrategyExperimentDefinition(value: unknown): value is StrategyExperimentListItem["definition"] {
  if (!isPlainRecord(value) || !isPlainRecord(value.split)) {
    return false;
  }
  return (
    isResearchRunStrategyConfig(value.baseStrategy) &&
    typeof value.strategyRevision === "string" &&
    typeof value.sourceRunId === "string" &&
    typeof value.snapshotId === "string" &&
    typeof value.canonicalDataHash === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    isTimeframe(value.timeframe) &&
    isBacktestAssumptions(value.assumptions) &&
    value.split.trainPct === 60 &&
    value.split.validationPct === 20 &&
    value.split.testPct === 20 &&
    Array.isArray(value.dimensions) &&
    value.dimensions.every(isStrategyExperimentDimension) &&
    isStrategyExperimentGuardrails(value.guardrails) &&
    (value.walkForward === null || isStrategyExperimentWalkForward(value.walkForward)) &&
    typeof value.evaluationBudget === "number" &&
    value.engineVersion === "backtest-v1" &&
    value.resultSchemaVersion === 1
  );
}

function isStrategyExperimentDimension(value: unknown): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    (value.conditionSide === "entry" || value.conditionSide === "exit") &&
    typeof value.conditionIndex === "number" &&
    (value.parameter === "window" || value.parameter === "threshold") &&
    Array.isArray(value.values) &&
    value.values.every((item) => typeof item === "number")
  );
}

function isStrategyExperimentGuardrails(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    typeof value.minimumTradeCount === "number" &&
    (value.maximumDrawdownPct === null || typeof value.maximumDrawdownPct === "number")
  );
}

function isStrategyExperimentWalkForward(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    typeof value.trainBars === "number" &&
    typeof value.validationBars === "number" &&
    typeof value.stepBars === "number"
  );
}

function isStrategyExperimentDetail(value: unknown): value is StrategyExperimentDetail {
  return (
    isStrategyExperimentListItem(value) &&
    isPlainRecord(value) &&
    (value.holdoutStatus === "unconsumed" ||
      value.holdoutStatus === "consumed" ||
      value.holdoutStatus === "consumed_by_other_definition") &&
    isStrategyExperimentSnapshot(value.snapshot) &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isStrategyExperimentCandidate)
  );
}

function isStrategyExperimentSnapshot(value: unknown): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.snapshotId === "string" &&
    typeof value.createdAt === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    isTimeframe(value.timeframe) &&
    typeof value.canonicalDataHash === "string" &&
    typeof value.rows === "number" &&
    typeof value.startAt === "string" &&
    typeof value.endAt === "string" &&
    Array.isArray(value.bars) &&
    value.bars.every(isMarketKlineBar) &&
    (value.testDefinitionHash === null || typeof value.testDefinitionHash === "string") &&
    (value.testOwnerExperimentId === null || typeof value.testOwnerExperimentId === "string") &&
    (value.testConsumedAt === null || typeof value.testConsumedAt === "string")
  );
}

function isStrategyExperimentCandidate(value: unknown): value is StrategyExperimentCandidate {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.candidateId === "string" &&
    typeof value.candidateRevision === "string" &&
    Array.isArray(value.parameters) &&
    value.parameters.every(isStrategyExperimentParameterPatch) &&
    isStrategyExperimentMetricSet(value.trainMetrics) &&
    isStrategyExperimentMetricSet(value.validationMetrics) &&
    (value.testMetrics === null || isStrategyExperimentMetricSet(value.testMetrics)) &&
    isStrategyExperimentWalkForwardEvidence(value.walkForward) &&
    typeof value.eligible === "boolean" &&
    (value.rank === null || typeof value.rank === "number")
  );
}

function isStrategyExperimentParameterPatch(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    (value.conditionSide === "entry" || value.conditionSide === "exit") &&
    typeof value.conditionIndex === "number" &&
    (value.parameter === "window" || value.parameter === "threshold") &&
    typeof value.value === "number"
  );
}

function isStrategyExperimentMetricSet(value: unknown): value is StrategyExperimentMetricSet {
  return (
    isPlainRecord(value) &&
    typeof value.totalReturnPct === "number" &&
    typeof value.annualReturnPct === "number" &&
    typeof value.maxDrawdownPct === "number" &&
    typeof value.winRatePct === "number" &&
    typeof value.profitFactor === "number" &&
    typeof value.tradeCount === "number"
  );
}

function isStrategyExperimentWalkForwardEvidence(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    Array.isArray(value.windows) &&
    value.windows.every(isStrategyExperimentWalkForwardWindow) &&
    typeof value.validationWindowCount === "number" &&
    typeof value.positiveReturnCount === "number" &&
    (value.medianReturnPct === null || typeof value.medianReturnPct === "number") &&
    (value.worstDrawdownPct === null || typeof value.worstDrawdownPct === "number")
  );
}

function isStrategyExperimentWalkForwardWindow(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    typeof value.index === "number" &&
    typeof value.trainStartIndex === "number" &&
    typeof value.trainEndIndex === "number" &&
    typeof value.validationStartIndex === "number" &&
    typeof value.validationEndIndex === "number" &&
    isStrategyExperimentMetricSet(value.trainMetrics) &&
    isStrategyExperimentMetricSet(value.validationMetrics)
  );
}

function isStrategyValidation(value: unknown): value is StrategyValidation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const validation = value as Partial<StrategyValidation>;
  return (
    (validation.status === "ready" || validation.status === "review" || validation.status === "blocked") &&
    typeof validation.revision === "string" &&
    Array.isArray(validation.gates) &&
    validation.gates.every(isStrategyReadinessGate) &&
    isResearchRunStrategyConfig(validation.strategyConfig)
  );
}

function isStrategyReadinessGate(value: unknown): value is StrategyReadinessGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<StrategyReadinessGate>;
  return (
    (gate.id === "schema" || gate.id === "risk" || gate.id === "execution" || gate.id === "audit") &&
    (gate.label === "Strategy schema" ||
      gate.label === "Risk controls" ||
      gate.label === "Execution mode" ||
      gate.label === "Audit evidence") &&
    typeof gate.value === "string" &&
    typeof gate.detail === "string" &&
    (gate.status === "passed" || gate.status === "review" || gate.status === "blocked") &&
    (gate.tone === "positive" || gate.tone === "warning" || gate.tone === "risk")
  );
}

function isStrategyLibraryItem(value: unknown): value is StrategyLibraryItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const strategy = value as Partial<StrategyLibraryItem>;
  return (
    typeof strategy.strategyId === "string" &&
    typeof strategy.createdAt === "string" &&
    typeof strategy.name === "string" &&
    typeof strategy.revision === "string" &&
    isMarket(strategy.market) &&
    typeof strategy.symbol === "string" &&
    isTimeframe(strategy.timeframe) &&
    typeof strategy.version === "number" &&
    (strategy.status === "draft" || strategy.status === "audited") &&
    (strategy.auditRunId === undefined || strategy.auditRunId === null || typeof strategy.auditRunId === "string") &&
    isStrategySnapshot(strategy.strategySnapshot) &&
    isResearchRunStrategyConfig(strategy.strategyConfig)
  );
}

function isStrategySnapshot(value: unknown): value is StrategySnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }
  const snapshot = value as Partial<StrategySnapshot>;
  return (
    typeof snapshot.name === "string" &&
    typeof snapshot.entry === "string" &&
    typeof snapshot.exit === "string" &&
    typeof snapshot.position === "string" &&
    typeof snapshot.risk === "string"
  );
}

function isPromotionCandidateRecord(value: unknown): value is PromotionCandidateRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<PromotionCandidateRecord>;
  return (
    typeof candidate.candidateId === "string" &&
    typeof candidate.runId === "string" &&
    typeof candidate.createdAt === "string" &&
    isMarket(candidate.market) &&
    typeof candidate.symbol === "string" &&
    isTimeframe(candidate.timeframe) &&
    typeof candidate.strategyRevision === "string" &&
    (candidate.latestPaperExecutionId === undefined ||
      candidate.latestPaperExecutionId === null ||
      typeof candidate.latestPaperExecutionId === "string") &&
    isPromotionReadinessStatus(candidate.status) &&
    typeof candidate.headline === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.liveTradingAllowed === "boolean" &&
    isPromotionCandidateEvidence(candidate.evidence) &&
    Array.isArray(candidate.stages) &&
    candidate.stages.every(isPromotionCandidateStage)
  );
}

function isPromotionReadinessStatus(value: unknown): value is PromotionCandidateRecord["status"] {
  return value === "blocked" || value === "paper_pending" || value === "certification_pending" || value === "live_ready";
}

function isPromotionCandidateEvidence(value: unknown): value is PromotionCandidateEvidence {
  if (!value || typeof value !== "object") {
    return false;
  }
  const evidence = value as Partial<PromotionCandidateEvidence>;
  return (
    typeof evidence.paperExecutions === "number" &&
    typeof evidence.filledOrders === "number" &&
    typeof evidence.passedPaperRiskChecks === "number"
  );
}

function isPromotionCandidateStage(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const stage = value as Record<string, unknown>;
  return (
    typeof stage.id === "string" &&
    typeof stage.label === "string" &&
    typeof stage.value === "string" &&
    typeof stage.detail === "string" &&
    (stage.status === "passed" || stage.status === "blocked" || stage.status === "review") &&
    (stage.tone === "positive" || stage.tone === "warning" || stage.tone === "neutral" || stage.tone === "risk") &&
    (stage.passed === undefined || typeof stage.passed === "boolean") &&
    (stage.reason === undefined || typeof stage.reason === "string")
  );
}

function isAiReviewRunRecordEnvelope(value: unknown): value is AiReviewRunRecordEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }
  const envelope = value as Partial<AiReviewRunRecordEnvelope>;
  return (
    typeof envelope.aiReviewId === "string" &&
    typeof envelope.runId === "string" &&
    typeof envelope.createdAt === "string" &&
    isAiReviewRunRecord(envelope.record) &&
    envelope.aiReviewId === envelope.record.aiReviewId &&
    envelope.runId === envelope.record.runId
  );
}

function isAiReviewRunRecord(value: unknown): value is AiReviewRunRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<AiReviewRunRecord>;
  return (
    record.schemaVersion === 1 &&
    record.recordType === "aiqt.aiReviewRun" &&
    typeof record.aiReviewId === "string" &&
    typeof record.runId === "string" &&
    typeof record.createdAt === "string" &&
    isMarket(record.market) &&
    typeof record.symbol === "string" &&
    isTimeframe(record.timeframe) &&
    typeof record.strategyRevision === "string" &&
    typeof record.executionMode === "string" &&
    isAiReviewStatus(record.status) &&
    isAiReviewRecordSummary(record.summary) &&
    isAiReviewDossier(record.dossier) &&
    Array.isArray(record.citations) &&
    record.citations.every(isAiReviewCitation) &&
    Array.isArray(record.rounds) &&
    record.rounds.every(isAgentCommitteeRound) &&
    Array.isArray(record.decisionLog) &&
    record.decisionLog.every(isDecisionLogEntry) &&
    (record.evidenceAnchors === undefined ||
      (Array.isArray(record.evidenceAnchors) && record.evidenceAnchors.every(isAiReviewEvidenceAnchor))) &&
    typeof record.boundary === "string" &&
    record.boundary.includes("Evidence explanation only")
  );
}

function isAiReviewEvidenceAnchor(value: unknown): value is AiReviewEvidenceAnchor {
  if (!value || typeof value !== "object") {
    return false;
  }
  const anchor = value as Partial<AiReviewEvidenceAnchor>;
  return (
    typeof anchor.id === "string" &&
    anchor.id.trim().length > 0 &&
    isAiReviewEvidenceAnchorType(anchor.type) &&
    typeof anchor.label === "string" &&
    anchor.label.trim().length > 0 &&
    typeof anchor.reference === "string" &&
    anchor.reference.trim().length > 0 &&
    typeof anchor.exportPath === "string" &&
    anchor.exportPath.trim().length > 0
  );
}

function isAiReviewEvidenceAnchorType(value: unknown): value is AiReviewEvidenceAnchor["type"] {
  return (
    value === "research-run" ||
    value === "strategy-revision" ||
    value === "data-snapshot" ||
    value === "citation" ||
    value === "committee-rounds" ||
    value === "decision-log" ||
    value === "risk-boundary"
  );
}

function isAiReviewRecordSummary(value: unknown): value is AiReviewRunRecord["summary"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<AiReviewRunRecord["summary"]>;
  return (
    typeof summary.citationCount === "number" &&
    typeof summary.roundCount === "number" &&
    typeof summary.decisionCount === "number" &&
    typeof summary.parameterScanBound === "boolean" &&
    typeof summary.liveExecutionBlocked === "boolean"
  );
}

function isAiReviewDossier(value: unknown): value is AiReviewRunRecord["dossier"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const dossier = value as Partial<AiReviewRunRecord["dossier"]>;
  return (
    isAiReviewStatus(dossier.status) &&
    typeof dossier.headline === "string" &&
    typeof dossier.summary === "string" &&
    Array.isArray(dossier.citations) &&
    dossier.citations.every(isAiReviewCitation)
  );
}

function isAiReviewStatus(value: unknown): value is AiReviewRunRecord["status"] {
  return value === "ready" || value === "blocked";
}

function isAiReviewCitation(value: unknown): value is AiReviewRunRecord["citations"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const citation = value as Partial<AiReviewRunRecord["citations"][number]>;
  return (
    isAiReviewCitationId(citation.id) &&
    typeof citation.label === "string" &&
    typeof citation.value === "string" &&
    typeof citation.detail === "string" &&
    isAiReviewTone(citation.tone)
  );
}

function isAiReviewCitationId(value: unknown): value is AiReviewRunRecord["citations"][number]["id"] {
  return (
    value === "run" ||
    value === "metrics" ||
    value === "benchmark" ||
    value === "parameter-scan" ||
    value === "strategy" ||
    value === "data-quality" ||
    value === "research-note" ||
    value === "risk-gates"
  );
}

function isAgentCommitteeRound(value: unknown): value is AiReviewRunRecord["rounds"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const round = value as Partial<AiReviewRunRecord["rounds"][number]>;
  return (
    typeof round.id === "string" &&
    (round.phase === "analysis" || round.phase === "debate" || round.phase === "risk" || round.phase === "decision") &&
    typeof round.agent === "string" &&
    typeof round.thesis === "string" &&
    typeof round.evidence === "string" &&
    (round.verdict === "support" || round.verdict === "challenge" || round.verdict === "risk" || round.verdict === "watch") &&
    typeof round.confidence === "number" &&
    isAiReviewTone(round.tone)
  );
}

function isDecisionLogEntry(value: unknown): value is AiReviewRunRecord["decisionLog"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Partial<AiReviewRunRecord["decisionLog"][number]>;
  return typeof entry.agent === "string" && typeof entry.message === "string" && isAiReviewTone(entry.tone);
}

function isAiReviewTone(value: unknown): value is AiReviewRunRecord["citations"][number]["tone"] {
  return value === "positive" || value === "warning" || value === "neutral" || value === "risk" || value === "ai";
}

function isPlatformSettingsStatus(value: unknown): value is PlatformSettingsStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const settings = value as Partial<PlatformSettingsStatus>;
  return (
    settings.schemaVersion === 1 &&
    typeof settings.generatedAt === "string" &&
    Array.isArray(settings.dataSources) &&
    settings.dataSources.every(isPlatformSettingsDataSource) &&
    Array.isArray(settings.marketDataAdapters) &&
    settings.marketDataAdapters.every(isPlatformSettingsMarketDataAdapter) &&
    isPlatformSettingsCacheStatus(settings.cache) &&
    Array.isArray(settings.executionAdapters) &&
    settings.executionAdapters.every(isPlatformSettingsExecutionAdapter) &&
    Boolean(settings.safety) &&
    typeof settings.safety?.liveTradingAllowed === "boolean" &&
    Array.isArray(settings.safety?.requiredGates) &&
    settings.safety.requiredGates.every((gate) => typeof gate === "string")
  );
}

function isPlatformSettingsMarketDataAdapter(value: unknown): value is PlatformSettingsMarketDataAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const adapter = value as Partial<PlatformSettingsMarketDataAdapter>;
  return (
    typeof adapter.id === "string" &&
    isMarket(adapter.market) &&
    typeof adapter.adapter === "string" &&
    typeof adapter.provider === "string" &&
    isPlatformSettingsTone(adapter.status) &&
    typeof adapter.route === "string" &&
    Array.isArray(adapter.capabilities) &&
    adapter.capabilities.every((capability) => typeof capability === "string") &&
    Array.isArray(adapter.timeframes) &&
    adapter.timeframes.every(isTimeframe) &&
    typeof adapter.requiresApiKey === "boolean" &&
    typeof adapter.requiresTradingKey === "boolean" &&
    typeof adapter.cacheScope === "string" &&
    isPlatformSettingsMarketDataAdapterCacheDiagnostics(adapter.cacheDiagnostics) &&
    isPlatformSettingsMarketDataAdapterExternalTelemetry(adapter.externalTelemetry) &&
    typeof adapter.note === "string"
  );
}

function isPlatformSettingsMarketDataAdapterCacheDiagnostics(
  value: unknown
): value is PlatformSettingsMarketDataAdapterCacheDiagnostics {
  if (!value || typeof value !== "object") {
    return false;
  }
  const diagnostics = value as Partial<PlatformSettingsMarketDataAdapterCacheDiagnostics>;
  return (
    (diagnostics.freshness === "fresh" || diagnostics.freshness === "stale" || diagnostics.freshness === "empty") &&
    typeof diagnostics.contextCount === "number" &&
    typeof diagnostics.rowCount === "number" &&
    (diagnostics.latestTimestamp === null || typeof diagnostics.latestTimestamp === "string") &&
    isPlatformSettingsCacheFreshnessSummary(diagnostics.freshnessSummary)
  );
}

function isPlatformSettingsMarketDataAdapterExternalTelemetry(
  value: unknown
): value is PlatformSettingsMarketDataAdapterExternalTelemetry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const telemetry = value as Partial<PlatformSettingsMarketDataAdapterExternalTelemetry>;
  return (
    (telemetry.status === "ok" ||
      telemetry.status === "degraded" ||
      telemetry.status === "blocked" ||
      telemetry.status === "unknown") &&
    typeof telemetry.dependency === "string" &&
    typeof telemetry.dependencyAvailable === "boolean" &&
    (telemetry.lastError === null || typeof telemetry.lastError === "string") &&
    (telemetry.retryState === "idle" ||
      telemetry.retryState === "dependency_missing" ||
      telemetry.retryState === "provider_error" ||
      telemetry.retryState === "not_observed") &&
    typeof telemetry.checkedAt === "string" &&
    isPlatformSettingsMarketDataAdapterInstallGuidance(telemetry.installGuidance) &&
    (telemetry.lastProviderError === null ||
      isPlatformSettingsMarketDataAdapterProviderError(telemetry.lastProviderError)) &&
    isPlatformSettingsMarketDataAdapterProviderHealth(telemetry.providerHealth)
  );
}

function isPlatformSettingsMarketDataAdapterInstallGuidance(
  value: unknown
): value is PlatformSettingsMarketDataAdapterInstallGuidance {
  if (!value || typeof value !== "object") {
    return false;
  }
  const guidance = value as Partial<PlatformSettingsMarketDataAdapterInstallGuidance>;
  return (
    typeof guidance.packageName === "string" &&
    typeof guidance.dockerBuildArg === "string" &&
    typeof guidance.packageInstallCommand === "string" &&
    typeof guidance.projectExtraInstallCommand === "string" &&
    typeof guidance.note === "string"
  );
}

function isPlatformSettingsMarketDataAdapterProviderError(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderError {
  if (!value || typeof value !== "object") {
    return false;
  }
  const error = value as Partial<PlatformSettingsMarketDataAdapterProviderError>;
  return (
    typeof error.eventId === "string" &&
    typeof error.createdAt === "string" &&
    typeof error.adapterId === "string" &&
    typeof error.provider === "string" &&
    isMarket(error.market) &&
    typeof error.symbol === "string" &&
    isTimeframe(error.timeframe) &&
    typeof error.source === "string" &&
    typeof error.context === "string" &&
    isPlatformSettingsMarketDataAdapterProviderErrorCategory(error.category) &&
    typeof error.message === "string"
  );
}

function isPlatformSettingsMarketDataAdapterProviderErrorCategory(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderErrorCategory {
  return platformSettingsMarketDataAdapterProviderErrorCategories.includes(
    value as PlatformSettingsMarketDataAdapterProviderErrorCategory
  );
}

function isPlatformSettingsMarketDataAdapterProviderErrorCategorySummary(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderErrorCategorySummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PlatformSettingsMarketDataAdapterProviderErrorCategorySummary>;
  return platformSettingsMarketDataAdapterProviderErrorCategories.every((category) => {
    const count = summary[category];
    return typeof count === "number" && Number.isFinite(count) && count >= 0;
  });
}

function isPlatformSettingsMarketDataAdapterProviderHealth(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderHealth {
  if (!value || typeof value !== "object") {
    return false;
  }
  const health = value as Partial<PlatformSettingsMarketDataAdapterProviderHealth>;
  return (
    (health.status === "ok" ||
      health.status === "watch" ||
      health.status === "cooldown" ||
      health.status === "blocked") &&
    typeof health.recentErrorCount === "number" &&
    Number.isFinite(health.recentErrorCount) &&
    health.recentErrorCount >= 0 &&
    (health.lastErrorAt === null || typeof health.lastErrorAt === "string") &&
    Array.isArray(health.affectedSymbols) &&
    health.affectedSymbols.every((symbol) => typeof symbol === "string") &&
    Array.isArray(health.affectedContexts) &&
    health.affectedContexts.every((context) => typeof context === "string") &&
    isPlatformSettingsMarketDataAdapterProviderErrorCategorySummary(health.categorySummary) &&
    (health.dominantCategory === null || isPlatformSettingsMarketDataAdapterProviderErrorCategory(health.dominantCategory)) &&
    isPlatformSettingsMarketDataAdapterProviderHealthWindowSummary(health.windowSummary) &&
    typeof health.retryAfterSeconds === "number" &&
    Number.isFinite(health.retryAfterSeconds) &&
    health.retryAfterSeconds >= 0 &&
    typeof health.reason === "string"
  );
}

function isPlatformSettingsMarketDataAdapterProviderHealthWindowSummary(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderHealthWindowSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PlatformSettingsMarketDataAdapterProviderHealthWindowSummary>;
  return (
    isPlatformSettingsMarketDataAdapterProviderHealthWindow(summary.oneHour) &&
    isPlatformSettingsMarketDataAdapterProviderHealthWindow(summary.twentyFourHours) &&
    isPlatformSettingsMarketDataAdapterProviderHealthWindow(summary.sevenDays)
  );
}

function isPlatformSettingsMarketDataAdapterProviderHealthWindow(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderHealthWindow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const window = value as Partial<PlatformSettingsMarketDataAdapterProviderHealthWindow>;
  return (
    typeof window.errorCount === "number" &&
    Number.isFinite(window.errorCount) &&
    window.errorCount >= 0 &&
    (window.latestErrorAt === null || typeof window.latestErrorAt === "string") &&
    isPlatformSettingsMarketDataAdapterProviderErrorCategorySummary(window.categorySummary) &&
    (window.dominantCategory === null ||
      isPlatformSettingsMarketDataAdapterProviderErrorCategory(window.dominantCategory))
  );
}

function isPlatformSettingsDataSource(value: unknown): value is PlatformSettingsDataSource {
  if (!value || typeof value !== "object") {
    return false;
  }
  const source = value as Partial<PlatformSettingsDataSource>;
  return (
    isMarket(source.market) &&
    typeof source.label === "string" &&
    typeof source.quoteSource === "string" &&
    typeof source.klineSource === "string" &&
    isPlatformSettingsTone(source.status) &&
    (source.optionalKeyName === null || typeof source.optionalKeyName === "string") &&
    typeof source.optionalKeyConfigured === "boolean" &&
    typeof source.note === "string"
  );
}

function isPlatformSettingsCacheStatus(value: unknown): value is PlatformSettingsCacheStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const cache = value as Partial<PlatformSettingsCacheStatus>;
  return (
    cache.engine === "sqlite" &&
    typeof cache.path === "string" &&
    typeof cache.exists === "boolean" &&
    typeof cache.scope === "string" &&
    typeof cache.rowCount === "number" &&
    typeof cache.contextCount === "number" &&
    (cache.latestTimestamp === null || typeof cache.latestTimestamp === "string") &&
    isPlatformSettingsCacheFreshnessSummary(cache.freshnessSummary) &&
    Array.isArray(cache.contexts) &&
    cache.contexts.every(isPlatformSettingsCacheContext)
  );
}

function isPlatformSettingsCacheFreshnessSummary(value: unknown): value is PlatformSettingsCacheFreshnessSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PlatformSettingsCacheFreshnessSummary>;
  return typeof summary.fresh === "number" && typeof summary.stale === "number" && typeof summary.empty === "number";
}

function isPlatformSettingsCacheContext(value: unknown): value is PlatformSettingsCacheContext {
  if (!value || typeof value !== "object") {
    return false;
  }
  const context = value as Partial<PlatformSettingsCacheContext>;
  return (
    isMarket(context.market) &&
    typeof context.symbol === "string" &&
    isTimeframe(context.timeframe) &&
    typeof context.rowCount === "number" &&
    (context.startTimestamp === null || typeof context.startTimestamp === "string") &&
    (context.endTimestamp === null || typeof context.endTimestamp === "string") &&
    (context.freshness === "fresh" || context.freshness === "stale" || context.freshness === "empty") &&
    (context.ageHours === null || typeof context.ageHours === "number")
  );
}

function isPlatformSettingsExecutionAdapter(value: unknown): value is PlatformSettingsExecutionAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const adapter = value as Partial<PlatformSettingsExecutionAdapter>;
  return (
    typeof adapter.id === "string" &&
    (isMarket(adapter.market) || adapter.market === "multi") &&
    typeof adapter.adapter === "string" &&
    (adapter.route === "paper" || adapter.route === "live") &&
    isPlatformSettingsTone(adapter.status) &&
    typeof adapter.certification === "string" &&
    typeof adapter.liveTradingAllowed === "boolean" &&
    typeof adapter.note === "string"
  );
}

function isPlatformSettingsTone(value: unknown): value is PlatformSettingsStatusTone {
  return (
    value === "ready" ||
    value === "degraded" ||
    value === "blocked" ||
    value === "config_required" ||
    value === "interface_only" ||
    value === "paper_ready"
  );
}

function isExecutionAdapterLedgerPayload(value: unknown): value is { adapterLedger: ExecutionAdapterLedger } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterLedger?: unknown };
  return isExecutionAdapterLedger(payload.adapterLedger);
}

function isExecutionAdapterLedger(value: unknown): value is ExecutionAdapterLedger {
  if (!value || typeof value !== "object") {
    return false;
  }
  const ledger = value as Partial<ExecutionAdapterLedger>;
  return (
    ledger.schemaVersion === 1 &&
    typeof ledger.generatedAt === "string" &&
    ledger.mode === "execution_adapter_state_ledger" &&
    typeof ledger.liveTradingAllowed === "boolean" &&
    Array.isArray(ledger.requiredGates) &&
    ledger.requiredGates.every((gate) => typeof gate === "string") &&
    isExecutionAdapterLedgerSummary(ledger.summary) &&
    Array.isArray(ledger.adapters) &&
    ledger.adapters.every(isExecutionAdapterLedgerAdapter)
  );
}

function isExecutionAdapterLedgerSummary(value: unknown): value is ExecutionAdapterLedgerSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<ExecutionAdapterLedgerSummary>;
  return (
    typeof summary.adapterCount === "number" &&
    typeof summary.liveAdapterCount === "number" &&
    typeof summary.certifiedLiveAdapters === "number" &&
    typeof summary.paperReadyAdapters === "number" &&
    typeof summary.blockedLiveAdapters === "number" &&
    typeof summary.configRequiredAdapters === "number" &&
    typeof summary.requiredGateCount === "number" &&
    (summary.stateCounts === undefined || isNumberRecord(summary.stateCounts))
  );
}

function isExecutionAdapterLedgerAdapter(value: unknown): value is ExecutionAdapterLedgerAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const adapter = value as Partial<ExecutionAdapterLedgerAdapter>;
  return (
    typeof adapter.id === "string" &&
    (isMarket(adapter.market) || adapter.market === "multi") &&
    typeof adapter.adapter === "string" &&
    (adapter.route === "paper" || adapter.route === "live") &&
    isPlatformSettingsTone(adapter.status) &&
    typeof adapter.certification === "string" &&
    typeof adapter.currentState === "string" &&
    typeof adapter.liveTradingAllowed === "boolean" &&
    typeof adapter.note === "string" &&
    typeof adapter.nextStep === "string" &&
    Array.isArray(adapter.gates) &&
    adapter.gates.every(isExecutionAdapterLedgerGate) &&
    Array.isArray(adapter.events) &&
    adapter.events.every(isExecutionAdapterLedgerEvent)
  );
}

function isExecutionAdapterLedgerGate(value: unknown): value is ExecutionAdapterLedgerGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<ExecutionAdapterLedgerGate>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
  );
}

function isExecutionAdapterLedgerEvent(value: unknown): value is ExecutionAdapterLedgerEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<ExecutionAdapterLedgerEvent>;
  return (
    typeof event.eventId === "string" &&
    typeof event.adapterId === "string" &&
    typeof event.timestamp === "string" &&
    typeof event.state === "string" &&
    typeof event.label === "string" &&
    typeof event.actor === "string" &&
    typeof event.source === "string" &&
    typeof event.reason === "string" &&
    typeof event.liveTradingAllowed === "boolean"
  );
}

function isExecutionAdapterHealthProbePayload(
  value: unknown
): value is { adapterHealthProbe: ExecutionAdapterHealthProbeResult } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterHealthProbe?: unknown };
  return isExecutionAdapterHealthProbeResult(payload.adapterHealthProbe);
}

function isExecutionAdapterHealthProbeResult(value: unknown): value is ExecutionAdapterHealthProbeResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const probe = value as Partial<ExecutionAdapterHealthProbeResult>;
  return (
    probe.schemaVersion === 1 &&
    typeof probe.probeId === "string" &&
    typeof probe.adapterId === "string" &&
    probe.provider === "ccxt" &&
    typeof probe.exchangeId === "string" &&
    probe.mode === "sandbox" &&
    isExecutionAdapterHealthProbeStatus(probe.status) &&
    typeof probe.generatedAt === "string" &&
    Array.isArray(probe.checks) &&
    probe.checks.every(isExecutionAdapterHealthProbeCheck) &&
    isBooleanRecord(probe.capabilities) &&
    isExecutionAdapterHealthProbeCredentials(probe.credentials) &&
    typeof probe.marketCount === "number" &&
    (probe.exchangeStatus === null || typeof probe.exchangeStatus === "string") &&
    (probe.serverTimeMs === null || typeof probe.serverTimeMs === "number") &&
    typeof probe.accountSyncState === "string" &&
    Array.isArray(probe.blockedReasons) &&
    probe.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(probe.metadata) &&
    (probe.productionRouteReviewId === undefined || typeof probe.productionRouteReviewId === "string") &&
    (probe.productionRouteReviewStatus === undefined || probe.productionRouteReviewStatus === "route_review_recorded") &&
    (probe.routeReview === undefined || isExecutionAdapterHealthProbeRouteReview(probe.routeReview)) &&
    probe.paperOnly === true &&
    probe.liveTradingAllowed === false &&
    probe.orderRoutingEnabled === false
  );
}

function isExecutionAdapterHealthProbeRouteReview(value: unknown): value is ExecutionAdapterHealthProbeRouteReview {
  if (!value || typeof value !== "object") {
    return false;
  }
  const routeReview = value as Partial<ExecutionAdapterHealthProbeRouteReview>;
  return (
    typeof routeReview.productionRouteReviewId === "string" &&
    routeReview.status === "route_review_recorded" &&
    typeof routeReview.adapterId === "string" &&
    typeof routeReview.market === "string" &&
    routeReview.route === "live" &&
    typeof routeReview.maintenanceWindowId === "string" &&
    Array.isArray(routeReview.requiredEnvVars) &&
    routeReview.requiredEnvVars.every((name) => typeof name === "string") &&
    routeReview.liveTradingAllowed === false &&
    routeReview.paperOnly === true
  );
}

function isExecutionAdapterHealthProbeCheck(value: unknown): value is ExecutionAdapterHealthProbeCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<ExecutionAdapterHealthProbeCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.label === "string" &&
    isExecutionAdapterHealthProbeCheckStatus(check.status) &&
    typeof check.detail === "string" &&
    (check.latencyMs === null || typeof check.latencyMs === "number")
  );
}

function isExecutionAdapterHealthProbeCredentials(
  value: unknown
): value is ExecutionAdapterHealthProbeCredentials {
  if (!value || typeof value !== "object") {
    return false;
  }
  const credentials = value as Partial<ExecutionAdapterHealthProbeCredentials>;
  return (
    typeof credentials.apiKeyConfigured === "boolean" &&
    (credentials.apiKeySource === null || typeof credentials.apiKeySource === "string") &&
    typeof credentials.secretConfigured === "boolean" &&
    (credentials.secretSource === null || typeof credentials.secretSource === "string") &&
    typeof credentials.passwordConfigured === "boolean" &&
    (credentials.passwordSource === null || typeof credentials.passwordSource === "string")
  );
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return isPlainRecord(value) && Object.values(value).every((item) => typeof item === "boolean");
}

function isExecutionAdapterCertificationRecordPayload(
  value: unknown
): value is { adapterCertification: ExecutionAdapterCertificationRun; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterCertification?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterCertificationRun(payload.adapterCertification) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterCertificationApplyRecordPayload(
  value: unknown
): value is { certificationApply: ExecutionAdapterCertificationApplyResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { certificationApply?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterCertificationApplyResult(payload.certificationApply) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterControlledRestartEvidenceRecordPayload(
  value: unknown
): value is { controlledRestartEvidence: ExecutionAdapterControlledRestartEvidenceResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { controlledRestartEvidence?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterControlledRestartEvidenceResult(payload.controlledRestartEvidence) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRestartAcceptanceRecordPayload(
  value: unknown
): value is { restartAcceptance: ExecutionAdapterRestartAcceptanceResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { restartAcceptance?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRestartAcceptanceResult(payload.restartAcceptance) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSecretReferenceRecordPayload(
  value: unknown
): value is { adapterSecretReference: ExecutionAdapterSecretReferenceResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretReference?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSecretReferenceResult(payload.adapterSecretReference) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSecretMaterializationRecordPayload(
  value: unknown
): value is { adapterSecretMaterialization: ExecutionAdapterSecretMaterializationResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretMaterialization?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSecretMaterializationResult(payload.adapterSecretMaterialization) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSecretManifestValidationRecordPayload(
  value: unknown
): value is { adapterSecretManifestValidation: ExecutionAdapterSecretManifestValidationResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretManifestValidation?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSecretManifestValidationResult(payload.adapterSecretManifestValidation) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterEnvironmentBindingRecordPayload(
  value: unknown
): value is { adapterEnvironmentBinding: ExecutionAdapterEnvironmentBindingResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterEnvironmentBinding?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterEnvironmentBindingResult(payload.adapterEnvironmentBinding) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRuntimeReloadPlanRecordPayload(
  value: unknown
): value is { adapterRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadPlan?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRuntimeReloadPlanResult(payload.adapterRuntimeReloadPlan) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRuntimeReloadExecutionRecordPayload(
  value: unknown
): value is { adapterRuntimeReloadExecution: ExecutionAdapterRuntimeReloadExecutionResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadExecution?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRuntimeReloadExecutionResult(payload.adapterRuntimeReloadExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceRecordPayload(
  value: unknown
): value is {
  adapterRuntimeReloadAcceptance: ExecutionAdapterRuntimeReloadAcceptanceResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadAcceptance?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRuntimeReloadAcceptanceResult(payload.adapterRuntimeReloadAcceptance) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterOrchestrationDryRunRecordPayload(
  value: unknown
): value is {
  adapterOrchestrationDryRun: ExecutionAdapterOrchestrationDryRunResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationDryRun?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterOrchestrationDryRunResult(payload.adapterOrchestrationDryRun) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterOrchestrationExecutionRecordPayload(
  value: unknown
): value is {
  adapterOrchestrationExecution: ExecutionAdapterOrchestrationExecutionResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationExecution?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterOrchestrationExecutionResult(payload.adapterOrchestrationExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterHumanConfirmationRecordPayload(
  value: unknown
): value is {
  adapterHumanConfirmation: ExecutionAdapterHumanConfirmationResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterHumanConfirmation?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterHumanConfirmationResult(payload.adapterHumanConfirmation) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSandboxProbePlanRecordPayload(
  value: unknown
): value is {
  adapterSandboxProbePlan: ExecutionAdapterSandboxProbePlanResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbePlan?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSandboxProbePlanResult(payload.adapterSandboxProbePlan) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSandboxProbeExecutionRecordPayload(
  value: unknown
): value is {
  adapterSandboxProbeExecution: ExecutionAdapterSandboxProbeExecutionResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbeExecution?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSandboxProbeExecutionResult(payload.adapterSandboxProbeExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSandboxProbeReviewRecordPayload(
  value: unknown
): value is {
  adapterSandboxProbeReview: ExecutionAdapterSandboxProbeReviewResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbeReview?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSandboxProbeReviewResult(payload.adapterSandboxProbeReview) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterProductionRouteReviewRecordPayload(
  value: unknown
): value is {
  adapterProductionRouteReview: ExecutionAdapterProductionRouteReviewResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterProductionRouteReview?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterProductionRouteReviewResult(payload.adapterProductionRouteReview) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunRecordPayload(
  value: unknown
): value is {
  adapterSandboxOrderSchemaDryRun: ExecutionAdapterSandboxOrderSchemaDryRunResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxOrderSchemaDryRun?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterSandboxOrderSchemaDryRunResult(payload.adapterSandboxOrderSchemaDryRun) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperOrderLifecycleRecordPayload(
  value: unknown
): value is {
  adapterPaperOrderLifecycle: ExecutionAdapterPaperOrderLifecycleResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperOrderLifecycle?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterPaperOrderLifecycleResult(payload.adapterPaperOrderLifecycle) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperRouteRunbookRecordPayload(
  value: unknown
): value is {
  adapterPaperRouteRunbook: ExecutionAdapterPaperRouteRunbookResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperRouteRunbook?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterPaperRouteRunbookResult(payload.adapterPaperRouteRunbook) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterOpsStateRecordPayload(
  value: unknown
): value is {
  adapterOpsState: ExecutionAdapterOpsStateResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOpsState?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterOpsStateResult(payload.adapterOpsState) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperExecutionRecordPayload(
  value: unknown
): value is {
  adapterPaperExecution: ExecutionAdapterPaperExecutionResult;
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperExecution?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterPaperExecutionResult(payload.adapterPaperExecution) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterPaperExecutionDuplicatePayload(
  value: unknown
): value is {
  error: "execution_adapter_paper_execution_already_recorded";
  existingAdapterPaperExecution: ExecutionAdapterPaperExecutionResult;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingAdapterPaperExecution?: unknown;
  };
  return (
    payload.error === "execution_adapter_paper_execution_already_recorded" &&
    isExecutionAdapterPaperExecutionResult(payload.existingAdapterPaperExecution)
  );
}

function isExecutionAdapterCertificationHistoryPayload(
  value: unknown
): value is { adapterCertifications: ExecutionAdapterCertificationRun[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterCertifications?: unknown };
  return (
    Array.isArray(payload.adapterCertifications) &&
    payload.adapterCertifications.every(isExecutionAdapterCertificationRun)
  );
}

function isExecutionAdapterCertificationApplyHistoryPayload(
  value: unknown
): value is { certificationApplies: ExecutionAdapterCertificationApplyResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { certificationApplies?: unknown };
  return (
    Array.isArray(payload.certificationApplies) &&
    payload.certificationApplies.every(isExecutionAdapterCertificationApplyResult)
  );
}

function isExecutionAdapterControlledRestartEvidenceHistoryPayload(
  value: unknown
): value is { controlledRestartEvidence: ExecutionAdapterControlledRestartEvidenceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { controlledRestartEvidence?: unknown };
  return (
    Array.isArray(payload.controlledRestartEvidence) &&
    payload.controlledRestartEvidence.every(isExecutionAdapterControlledRestartEvidenceResult)
  );
}

function isExecutionAdapterRestartAcceptanceHistoryPayload(
  value: unknown
): value is { restartAcceptances: ExecutionAdapterRestartAcceptanceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { restartAcceptances?: unknown };
  return (
    Array.isArray(payload.restartAcceptances) &&
    payload.restartAcceptances.every(isExecutionAdapterRestartAcceptanceResult)
  );
}

function isExecutionAdapterSecretReferenceHistoryPayload(
  value: unknown
): value is { adapterSecretReferences: ExecutionAdapterSecretReferenceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretReferences?: unknown };
  return (
    Array.isArray(payload.adapterSecretReferences) &&
    payload.adapterSecretReferences.every(isExecutionAdapterSecretReferenceResult)
  );
}

function isExecutionAdapterSecretMaterializationHistoryPayload(
  value: unknown
): value is { adapterSecretMaterializations: ExecutionAdapterSecretMaterializationResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretMaterializations?: unknown };
  return (
    Array.isArray(payload.adapterSecretMaterializations) &&
    payload.adapterSecretMaterializations.every(isExecutionAdapterSecretMaterializationResult)
  );
}

function isExecutionAdapterSecretManifestValidationHistoryPayload(
  value: unknown
): value is { adapterSecretManifestValidations: ExecutionAdapterSecretManifestValidationResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSecretManifestValidations?: unknown };
  return (
    Array.isArray(payload.adapterSecretManifestValidations) &&
    payload.adapterSecretManifestValidations.every(isExecutionAdapterSecretManifestValidationResult)
  );
}

function isExecutionAdapterEnvironmentBindingHistoryPayload(
  value: unknown
): value is { adapterEnvironmentBindings: ExecutionAdapterEnvironmentBindingResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterEnvironmentBindings?: unknown };
  return (
    Array.isArray(payload.adapterEnvironmentBindings) &&
    payload.adapterEnvironmentBindings.every(isExecutionAdapterEnvironmentBindingResult)
  );
}

function isExecutionAdapterRuntimeReloadPlanHistoryPayload(
  value: unknown
): value is { adapterRuntimeReloadPlans: ExecutionAdapterRuntimeReloadPlanResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadPlans?: unknown };
  return (
    Array.isArray(payload.adapterRuntimeReloadPlans) &&
    payload.adapterRuntimeReloadPlans.every(isExecutionAdapterRuntimeReloadPlanResult)
  );
}

function isExecutionAdapterRuntimeReloadExecutionHistoryPayload(
  value: unknown
): value is { adapterRuntimeReloadExecutions: ExecutionAdapterRuntimeReloadExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadExecutions?: unknown };
  return (
    Array.isArray(payload.adapterRuntimeReloadExecutions) &&
    payload.adapterRuntimeReloadExecutions.every(isExecutionAdapterRuntimeReloadExecutionResult)
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceHistoryPayload(
  value: unknown
): value is { adapterRuntimeReloadAcceptances: ExecutionAdapterRuntimeReloadAcceptanceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterRuntimeReloadAcceptances?: unknown };
  return (
    Array.isArray(payload.adapterRuntimeReloadAcceptances) &&
    payload.adapterRuntimeReloadAcceptances.every(isExecutionAdapterRuntimeReloadAcceptanceResult)
  );
}

function isExecutionAdapterOrchestrationDryRunHistoryPayload(
  value: unknown
): value is { adapterOrchestrationDryRuns: ExecutionAdapterOrchestrationDryRunResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationDryRuns?: unknown };
  return (
    Array.isArray(payload.adapterOrchestrationDryRuns) &&
    payload.adapterOrchestrationDryRuns.every(isExecutionAdapterOrchestrationDryRunResult)
  );
}

function isExecutionAdapterOrchestrationExecutionHistoryPayload(
  value: unknown
): value is { adapterOrchestrationExecutions: ExecutionAdapterOrchestrationExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOrchestrationExecutions?: unknown };
  return (
    Array.isArray(payload.adapterOrchestrationExecutions) &&
    payload.adapterOrchestrationExecutions.every(isExecutionAdapterOrchestrationExecutionResult)
  );
}

function isExecutionAdapterHumanConfirmationHistoryPayload(
  value: unknown
): value is { adapterHumanConfirmations: ExecutionAdapterHumanConfirmationResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterHumanConfirmations?: unknown };
  return (
    Array.isArray(payload.adapterHumanConfirmations) &&
    payload.adapterHumanConfirmations.every(isExecutionAdapterHumanConfirmationResult)
  );
}

function isExecutionAdapterSandboxProbePlanHistoryPayload(
  value: unknown
): value is { adapterSandboxProbePlans: ExecutionAdapterSandboxProbePlanResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbePlans?: unknown };
  return (
    Array.isArray(payload.adapterSandboxProbePlans) &&
    payload.adapterSandboxProbePlans.every(isExecutionAdapterSandboxProbePlanResult)
  );
}

function isExecutionAdapterSandboxProbeExecutionHistoryPayload(
  value: unknown
): value is { adapterSandboxProbeExecutions: ExecutionAdapterSandboxProbeExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbeExecutions?: unknown };
  return (
    Array.isArray(payload.adapterSandboxProbeExecutions) &&
    payload.adapterSandboxProbeExecutions.every(isExecutionAdapterSandboxProbeExecutionResult)
  );
}

function isExecutionAdapterSandboxProbeReviewHistoryPayload(
  value: unknown
): value is { adapterSandboxProbeReviews: ExecutionAdapterSandboxProbeReviewResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxProbeReviews?: unknown };
  return (
    Array.isArray(payload.adapterSandboxProbeReviews) &&
    payload.adapterSandboxProbeReviews.every(isExecutionAdapterSandboxProbeReviewResult)
  );
}

function isExecutionAdapterProductionRouteReviewHistoryPayload(
  value: unknown
): value is { adapterProductionRouteReviews: ExecutionAdapterProductionRouteReviewResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterProductionRouteReviews?: unknown };
  return (
    Array.isArray(payload.adapterProductionRouteReviews) &&
    payload.adapterProductionRouteReviews.every(isExecutionAdapterProductionRouteReviewResult)
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunHistoryPayload(
  value: unknown
): value is { adapterSandboxOrderSchemaDryRuns: ExecutionAdapterSandboxOrderSchemaDryRunResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterSandboxOrderSchemaDryRuns?: unknown };
  return (
    Array.isArray(payload.adapterSandboxOrderSchemaDryRuns) &&
    payload.adapterSandboxOrderSchemaDryRuns.every(isExecutionAdapterSandboxOrderSchemaDryRunResult)
  );
}

function isExecutionAdapterPaperOrderLifecycleHistoryPayload(
  value: unknown
): value is { adapterPaperOrderLifecycles: ExecutionAdapterPaperOrderLifecycleResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperOrderLifecycles?: unknown };
  return (
    Array.isArray(payload.adapterPaperOrderLifecycles) &&
    payload.adapterPaperOrderLifecycles.every(isExecutionAdapterPaperOrderLifecycleResult)
  );
}

function isExecutionAdapterPaperRouteRunbookHistoryPayload(
  value: unknown
): value is { adapterPaperRouteRunbooks: ExecutionAdapterPaperRouteRunbookResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperRouteRunbooks?: unknown };
  return (
    Array.isArray(payload.adapterPaperRouteRunbooks) &&
    payload.adapterPaperRouteRunbooks.every(isExecutionAdapterPaperRouteRunbookResult)
  );
}

function isExecutionAdapterOpsStateHistoryPayload(
  value: unknown
): value is { adapterOpsStates: ExecutionAdapterOpsStateResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterOpsStates?: unknown };
  return Array.isArray(payload.adapterOpsStates) && payload.adapterOpsStates.every(isExecutionAdapterOpsStateResult);
}

function isExecutionAdapterPaperExecutionHistoryPayload(
  value: unknown
): value is { adapterPaperExecutions: ExecutionAdapterPaperExecutionResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterPaperExecutions?: unknown };
  return (
    Array.isArray(payload.adapterPaperExecutions) &&
    payload.adapterPaperExecutions.every(isExecutionAdapterPaperExecutionResult)
  );
}

function isExecutionAdapterCertificationApplyResult(value: unknown): value is ExecutionAdapterCertificationApplyResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterCertificationApplyResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.applyId === "string" &&
    typeof result.certificationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterCertificationApplyStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.generatedAt === "string" &&
    typeof result.applyMode === "string" &&
    typeof result.restartRequired === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterCertificationApplyConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterControlledRestartEvidenceResult(
  value: unknown
): value is ExecutionAdapterControlledRestartEvidenceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterControlledRestartEvidenceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.evidenceId === "string" &&
    typeof result.applyId === "string" &&
    typeof result.certificationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterControlledRestartEvidenceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.evidenceMode === "string" &&
    typeof result.restartRequired === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterControlledRestartEvidenceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRestartAcceptanceResult(
  value: unknown
): value is ExecutionAdapterRestartAcceptanceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRestartAcceptanceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.acceptanceId === "string" &&
    typeof result.evidenceId === "string" &&
    typeof result.applyId === "string" &&
    typeof result.certificationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRestartAcceptanceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.restartRequired === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRestartAcceptanceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSecretReferenceResult(
  value: unknown
): value is ExecutionAdapterSecretReferenceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSecretReferenceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.referenceId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSecretReferenceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.referenceName === "string" &&
    typeof result.backend === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSecretReferenceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSecretMaterializationResult(
  value: unknown
): value is ExecutionAdapterSecretMaterializationResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSecretMaterializationResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.materializationId === "string" &&
    typeof result.referenceId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSecretMaterializationStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.materializationMode === "string" &&
    typeof result.referenceName === "string" &&
    typeof result.backend === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSecretMaterializationConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSecretManifestValidationResult(
  value: unknown
): value is ExecutionAdapterSecretManifestValidationResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSecretManifestValidationResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.validationId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.referenceId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSecretManifestValidationStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.validationMode === "string" &&
    typeof result.referenceName === "string" &&
    typeof result.backend === "string" &&
    typeof result.manifestPath === "string" &&
    typeof result.fingerprint === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.coveredEnvVars) &&
    result.coveredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.manifestSummary) &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterEnvironmentBindingResult(
  value: unknown
): value is ExecutionAdapterEnvironmentBindingResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterEnvironmentBindingResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterEnvironmentBindingStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterEnvironmentBindingConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRuntimeReloadPlanResult(
  value: unknown
): value is ExecutionAdapterRuntimeReloadPlanResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRuntimeReloadPlanResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRuntimeReloadPlanStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRuntimeReloadPlanConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRuntimeReloadExecutionResult(
  value: unknown
): value is ExecutionAdapterRuntimeReloadExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRuntimeReloadExecutionResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRuntimeReloadExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRuntimeReloadExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceResult(
  value: unknown
): value is ExecutionAdapterRuntimeReloadAcceptanceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRuntimeReloadAcceptanceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRuntimeReloadAcceptanceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRuntimeReloadAcceptanceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterOrchestrationDryRunResult(
  value: unknown
): value is ExecutionAdapterOrchestrationDryRunResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterOrchestrationDryRunResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterOrchestrationDryRunStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterOrchestrationDryRunConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterOrchestrationExecutionResult(
  value: unknown
): value is ExecutionAdapterOrchestrationExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterOrchestrationExecutionResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterOrchestrationExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterOrchestrationExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterHumanConfirmationResult(
  value: unknown
): value is ExecutionAdapterHumanConfirmationResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterHumanConfirmationResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterHumanConfirmationStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterHumanConfirmationConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxProbePlanResult(
  value: unknown
): value is ExecutionAdapterSandboxProbePlanResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxProbePlanResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSandboxProbePlanStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSandboxProbePlanConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxProbeExecutionResult(
  value: unknown
): value is ExecutionAdapterSandboxProbeExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxProbeExecutionResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSandboxProbeExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSandboxProbeExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxProbeReviewResult(
  value: unknown
): value is ExecutionAdapterSandboxProbeReviewResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxProbeReviewResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSandboxProbeReviewStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSandboxProbeReviewConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterProductionRouteReviewResult(
  value: unknown
): value is ExecutionAdapterProductionRouteReviewResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterProductionRouteReviewResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.productionRouteReviewId === "string" &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterProductionRouteReviewStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.sandboxReviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterProductionRouteReviewConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunResult(
  value: unknown
): value is ExecutionAdapterSandboxOrderSchemaDryRunResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterSandboxOrderSchemaDryRunResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
    typeof result.productionRouteReviewId === "string" &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterSandboxOrderSchemaDryRunStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.dryRunMode === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.sandboxReviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    typeof result.orderSubmitted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterSandboxOrderSchemaDryRunConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterPaperOrderLifecycleResult(value: unknown): value is ExecutionAdapterPaperOrderLifecycleResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterPaperOrderLifecycleResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
    typeof result.productionRouteReviewId === "string" &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterPaperOrderLifecycleStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.sandboxReviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterPaperOrderLifecycleConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterPaperRouteRunbookResult(value: unknown): value is ExecutionAdapterPaperRouteRunbookResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterPaperRouteRunbookResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.paperRouteRunbookId === "string" &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
    typeof result.productionRouteReviewId === "string" &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterPaperRouteRunbookStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.runbookMode === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.sandboxReviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    Array.isArray(result.runbookSteps) &&
    result.runbookSteps.every(isExecutionAdapterPaperRouteRunbookStep) &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    typeof result.routeExecuted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterPaperRouteRunbookConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterOpsStateResult(value: unknown): value is ExecutionAdapterOpsStateResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterOpsStateResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.adapterOpsStateId === "string" &&
    typeof result.paperRouteRunbookId === "string" &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
    typeof result.productionRouteReviewId === "string" &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterOpsStateStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.opsMode === "string" &&
    typeof result.runbookMode === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.sandboxReviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    Array.isArray(result.runbookSteps) &&
    result.runbookSteps.every(isExecutionAdapterPaperRouteRunbookStep) &&
    Array.isArray(result.opsSteps) &&
    result.opsSteps.every(isExecutionAdapterOpsStateStep) &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    typeof result.routeExecuted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterOpsStateConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterPaperExecutionResult(value: unknown): value is ExecutionAdapterPaperExecutionResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterPaperExecutionResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.adapterPaperExecutionId === "string" &&
    typeof result.adapterOpsStateId === "string" &&
    typeof result.paperRouteRunbookId === "string" &&
    typeof result.paperOrderLifecycleId === "string" &&
    typeof result.sandboxOrderSchemaDryRunId === "string" &&
    typeof result.productionRouteReviewId === "string" &&
    typeof result.sandboxProbeReviewId === "string" &&
    typeof result.sandboxProbeExecutionId === "string" &&
    typeof result.sandboxProbePlanId === "string" &&
    typeof result.humanConfirmationId === "string" &&
    typeof result.orchestrationExecutionId === "string" &&
    typeof result.dryRunId === "string" &&
    typeof result.acceptanceId === "string" &&
    typeof result.executionId === "string" &&
    typeof result.planId === "string" &&
    typeof result.bindingId === "string" &&
    typeof result.materializationId === "string" &&
    typeof result.manifestValidationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterPaperExecutionStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.paperExecutionMode === "string" &&
    typeof result.opsMode === "string" &&
    typeof result.runbookMode === "string" &&
    typeof result.lifecycleMode === "string" &&
    typeof result.dryRunMode === "string" &&
    typeof result.reviewMode === "string" &&
    typeof result.sandboxReviewMode === "string" &&
    typeof result.probeExecutionMode === "string" &&
    typeof result.probeMode === "string" &&
    typeof result.confirmationMode === "string" &&
    typeof result.orchestrationExecutionMode === "string" &&
    typeof result.orchestrationMode === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.executionMode === "string" &&
    typeof result.reloadMode === "string" &&
    typeof result.maintenanceWindowId === "string" &&
    typeof result.bindingMode === "string" &&
    typeof result.manifestPath === "string" &&
    Array.isArray(result.requiredEnvVars) &&
    result.requiredEnvVars.every((name) => typeof name === "string") &&
    isExecutionAdapterSandboxOrderIntent(result.orderIntent) &&
    Array.isArray(result.lifecycleSteps) &&
    result.lifecycleSteps.every(isExecutionAdapterPaperOrderLifecycleStep) &&
    Array.isArray(result.runbookSteps) &&
    result.runbookSteps.every(isExecutionAdapterPaperRouteRunbookStep) &&
    Array.isArray(result.opsSteps) &&
    result.opsSteps.every(isExecutionAdapterOpsStateStep) &&
    Array.isArray(result.paperExecutionSteps) &&
    result.paperExecutionSteps.every(isExecutionAdapterPaperExecutionStep) &&
    isExecutionAdapterPaperExecutionFill(result.simulatedFill) &&
    typeof result.paperFillRecorded === "boolean" &&
    typeof result.orderSubmitted === "boolean" &&
    typeof result.liveOrderSubmitted === "boolean" &&
    typeof result.routeExecuted === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterPaperExecutionConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterSandboxOrderIntent(value: unknown): value is ExecutionAdapterSandboxOrderIntent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const orderIntent = value as Partial<ExecutionAdapterSandboxOrderIntent>;
  return (
    typeof orderIntent.symbol === "string" &&
    (orderIntent.side === "buy" || orderIntent.side === "sell") &&
    typeof orderIntent.type === "string" &&
    typeof orderIntent.quantity === "number" &&
    Number.isFinite(orderIntent.quantity) &&
    orderIntent.quantity > 0 &&
    (orderIntent.price === undefined ||
      (typeof orderIntent.price === "number" && Number.isFinite(orderIntent.price) && orderIntent.price > 0)) &&
    (orderIntent.timeInForce === undefined || typeof orderIntent.timeInForce === "string")
  );
}

function isExecutionAdapterCertificationApplyConfirmation(
  value: unknown
): value is ExecutionAdapterCertificationApplyConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterCertificationApplyConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterControlledRestartEvidenceConfirmation(
  value: unknown
): value is ExecutionAdapterControlledRestartEvidenceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterControlledRestartEvidenceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterCertificationRun(value: unknown): value is ExecutionAdapterCertificationRun {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<ExecutionAdapterCertificationRun>;
  return (
    run.schemaVersion === 1 &&
    typeof run.certificationId === "string" &&
    typeof run.adapterId === "string" &&
    (isMarket(run.market) || run.market === "multi") &&
    (run.route === "paper" || run.route === "live") &&
    isExecutionAdapterCertificationStatus(run.status) &&
    typeof run.operator === "string" &&
    typeof run.startedAt === "string" &&
    (run.completedAt === null || typeof run.completedAt === "string") &&
    Array.isArray(run.checks) &&
    run.checks.every(isExecutionAdapterCertificationCheck) &&
    isSecretFreeRecord(run.metadata) &&
    isExecutionAdapterCertificationSummary(run.summary) &&
    typeof run.liveTradingAllowed === "boolean" &&
    typeof run.paperOnly === "boolean"
  );
}

function isExecutionAdapterCertificationCheck(value: unknown): value is ExecutionAdapterCertificationCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<ExecutionAdapterCertificationCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.label === "string" &&
    isExecutionAdapterCertificationStatus(check.status) &&
    typeof check.detail === "string" &&
    (check.metadata === undefined || isSecretFreeRecord(check.metadata))
  );
}

function isExecutionAdapterCertificationSummary(value: unknown): value is ExecutionAdapterCertificationSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<ExecutionAdapterCertificationSummary>;
  return (
    typeof summary.checkCount === "number" &&
    isNumberRecord(summary.checkStatusCounts) &&
    typeof summary.passedChecks === "number" &&
    typeof summary.blockedChecks === "number" &&
    typeof summary.failedChecks === "number" &&
    typeof summary.reviewChecks === "number"
  );
}

function isExecutionAdapterRestartAcceptanceConfirmation(
  value: unknown
): value is ExecutionAdapterRestartAcceptanceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRestartAcceptanceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSecretReferenceConfirmation(
  value: unknown
): value is ExecutionAdapterSecretReferenceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSecretReferenceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSecretMaterializationConfirmation(
  value: unknown
): value is ExecutionAdapterSecretMaterializationConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSecretMaterializationConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterEnvironmentBindingConfirmation(
  value: unknown
): value is ExecutionAdapterEnvironmentBindingConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterEnvironmentBindingConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterRuntimeReloadPlanConfirmation(
  value: unknown
): value is ExecutionAdapterRuntimeReloadPlanConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRuntimeReloadPlanConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterRuntimeReloadExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterRuntimeReloadExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRuntimeReloadExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterRuntimeReloadAcceptanceConfirmation(
  value: unknown
): value is ExecutionAdapterRuntimeReloadAcceptanceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRuntimeReloadAcceptanceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterOrchestrationDryRunConfirmation(
  value: unknown
): value is ExecutionAdapterOrchestrationDryRunConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterOrchestrationDryRunConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterOrchestrationExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterOrchestrationExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterOrchestrationExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterHumanConfirmationConfirmation(
  value: unknown
): value is ExecutionAdapterHumanConfirmationConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterHumanConfirmationConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSandboxProbePlanConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxProbePlanConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxProbePlanConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSandboxProbeExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxProbeExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxProbeExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSandboxProbeReviewConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxProbeReviewConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxProbeReviewConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterProductionRouteReviewConfirmation(
  value: unknown
): value is ExecutionAdapterProductionRouteReviewConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterProductionRouteReviewConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterSandboxOrderSchemaDryRunConfirmation(
  value: unknown
): value is ExecutionAdapterSandboxOrderSchemaDryRunConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterSandboxOrderSchemaDryRunConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterPaperOrderLifecycleConfirmation(
  value: unknown
): value is ExecutionAdapterPaperOrderLifecycleConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterPaperOrderLifecycleConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterPaperOrderLifecycleConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterPaperOrderLifecycleStep(value: unknown): value is ExecutionAdapterPaperOrderLifecycleStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterPaperOrderLifecycleStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterPaperOrderLifecycleStepStatus(step.status)
  );
}

function isExecutionAdapterPaperRouteRunbookConfirmation(
  value: unknown
): value is ExecutionAdapterPaperRouteRunbookConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterPaperRouteRunbookConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterPaperRouteRunbookConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterPaperRouteRunbookStep(value: unknown): value is ExecutionAdapterPaperRouteRunbookStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterPaperRouteRunbookStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterPaperRouteRunbookStepStatus(step.status)
  );
}

function isExecutionAdapterOpsStateConfirmation(value: unknown): value is ExecutionAdapterOpsStateConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterOpsStateConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterOpsStateConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterOpsStateStep(value: unknown): value is ExecutionAdapterOpsStateStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterOpsStateStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterOpsStateStepStatus(step.status)
  );
}

function isExecutionAdapterPaperExecutionConfirmation(
  value: unknown
): value is ExecutionAdapterPaperExecutionConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterPaperExecutionConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    isExecutionAdapterPaperExecutionConfirmationStatus(confirmation.status)
  );
}

function isExecutionAdapterPaperExecutionStep(value: unknown): value is ExecutionAdapterPaperExecutionStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<ExecutionAdapterPaperExecutionStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isExecutionAdapterPaperExecutionStepStatus(step.status)
  );
}

function isExecutionAdapterPaperExecutionFill(value: unknown): value is ExecutionAdapterPaperExecutionFill {
  if (!value || typeof value !== "object") {
    return false;
  }
  const fill = value as Partial<ExecutionAdapterPaperExecutionFill>;
  return (
    typeof fill.fillId === "string" &&
    isExecutionAdapterPaperExecutionFillStatus(fill.status) &&
    typeof fill.symbol === "string" &&
    (fill.side === "buy" || fill.side === "sell") &&
    typeof fill.type === "string" &&
    typeof fill.quantity === "number" &&
    (fill.price === undefined || typeof fill.price === "number") &&
    (fill.timeInForce === undefined || typeof fill.timeInForce === "string") &&
    typeof fill.source === "string" &&
    typeof fill.orderSubmitted === "boolean" &&
    typeof fill.liveOrderSubmitted === "boolean" &&
    typeof fill.routeExecuted === "boolean"
  );
}

function isExecutionAdapterCertificationStatus(value: unknown): value is ExecutionAdapterCertificationStatus {
  return value === "passed" || value === "blocked" || value === "failed" || value === "review";
}

function isExecutionAdapterCertificationApplyStatus(
  value: unknown
): value is ExecutionAdapterCertificationApplyStatus {
  return value === "blocked" || value === "ready_for_restart";
}

function isExecutionAdapterControlledRestartEvidenceStatus(
  value: unknown
): value is ExecutionAdapterControlledRestartEvidenceStatus {
  return value === "blocked" || value === "evidence_recorded";
}

function isExecutionAdapterRestartAcceptanceStatus(
  value: unknown
): value is ExecutionAdapterRestartAcceptanceStatus {
  return value === "blocked" || value === "acceptance_recorded";
}

function isExecutionAdapterSecretReferenceStatus(
  value: unknown
): value is ExecutionAdapterSecretReferenceStatus {
  return value === "blocked" || value === "reference_recorded";
}

function isExecutionAdapterSecretMaterializationStatus(
  value: unknown
): value is ExecutionAdapterSecretMaterializationStatus {
  return value === "blocked" || value === "manifest_recorded";
}

function isExecutionAdapterSecretManifestValidationStatus(
  value: unknown
): value is ExecutionAdapterSecretManifestValidationStatus {
  return value === "blocked" || value === "validated";
}

function isExecutionAdapterEnvironmentBindingStatus(value: unknown): value is ExecutionAdapterEnvironmentBindingStatus {
  return value === "blocked" || value === "binding_recorded";
}

function isExecutionAdapterRuntimeReloadPlanStatus(
  value: unknown
): value is ExecutionAdapterRuntimeReloadPlanStatus {
  return value === "blocked" || value === "plan_recorded";
}

function isExecutionAdapterRuntimeReloadExecutionStatus(
  value: unknown
): value is ExecutionAdapterRuntimeReloadExecutionStatus {
  return value === "blocked" || value === "execution_recorded";
}

function isExecutionAdapterRuntimeReloadAcceptanceStatus(
  value: unknown
): value is ExecutionAdapterRuntimeReloadAcceptanceStatus {
  return value === "blocked" || value === "acceptance_recorded";
}

function isExecutionAdapterOrchestrationDryRunStatus(
  value: unknown
): value is ExecutionAdapterOrchestrationDryRunStatus {
  return value === "blocked" || value === "dry_run_recorded";
}

function isExecutionAdapterOrchestrationExecutionStatus(
  value: unknown
): value is ExecutionAdapterOrchestrationExecutionStatus {
  return value === "blocked" || value === "execution_recorded";
}

function isExecutionAdapterHumanConfirmationStatus(
  value: unknown
): value is ExecutionAdapterHumanConfirmationStatus {
  return value === "blocked" || value === "confirmation_recorded";
}

function isExecutionAdapterSandboxProbePlanStatus(
  value: unknown
): value is ExecutionAdapterSandboxProbePlanStatus {
  return value === "blocked" || value === "probe_plan_recorded";
}

function isExecutionAdapterSandboxProbeExecutionStatus(
  value: unknown
): value is ExecutionAdapterSandboxProbeExecutionStatus {
  return value === "blocked" || value === "probe_execution_recorded";
}

function isExecutionAdapterSandboxProbeReviewStatus(
  value: unknown
): value is ExecutionAdapterSandboxProbeReviewStatus {
  return value === "blocked" || value === "probe_review_recorded";
}

function isExecutionAdapterProductionRouteReviewStatus(
  value: unknown
): value is ExecutionAdapterProductionRouteReviewStatus {
  return value === "blocked" || value === "route_review_recorded";
}

function isExecutionAdapterSandboxOrderSchemaDryRunStatus(
  value: unknown
): value is ExecutionAdapterSandboxOrderSchemaDryRunStatus {
  return value === "blocked" || value === "schema_dry_run_recorded";
}

function isExecutionAdapterPaperOrderLifecycleStatus(value: unknown): value is ExecutionAdapterPaperOrderLifecycleStatus {
  return value === "blocked" || value === "lifecycle_recorded";
}

function isExecutionAdapterPaperOrderLifecycleConfirmationStatus(
  value: unknown
): value is ExecutionAdapterPaperOrderLifecycleConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterPaperOrderLifecycleStepStatus(
  value: unknown
): value is ExecutionAdapterPaperOrderLifecycleStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterPaperRouteRunbookStatus(value: unknown): value is ExecutionAdapterPaperRouteRunbookStatus {
  return value === "blocked" || value === "runbook_recorded";
}

function isExecutionAdapterPaperRouteRunbookConfirmationStatus(
  value: unknown
): value is ExecutionAdapterPaperRouteRunbookConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterPaperRouteRunbookStepStatus(
  value: unknown
): value is ExecutionAdapterPaperRouteRunbookStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterOpsStateStatus(value: unknown): value is ExecutionAdapterOpsStateStatus {
  return value === "blocked" || value === "ops_state_recorded";
}

function isExecutionAdapterOpsStateConfirmationStatus(
  value: unknown
): value is ExecutionAdapterOpsStateConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterOpsStateStepStatus(value: unknown): value is ExecutionAdapterOpsStateStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterPaperExecutionStatus(value: unknown): value is ExecutionAdapterPaperExecutionStatus {
  return value === "blocked" || value === "paper_execution_recorded";
}

function isExecutionAdapterPaperExecutionConfirmationStatus(
  value: unknown
): value is ExecutionAdapterPaperExecutionConfirmationStatus {
  return value === "confirmed" || value === "missing";
}

function isExecutionAdapterPaperExecutionStepStatus(
  value: unknown
): value is ExecutionAdapterPaperExecutionStepStatus {
  return value === "blocked" || value === "recorded";
}

function isExecutionAdapterPaperExecutionFillStatus(
  value: unknown
): value is ExecutionAdapterPaperExecutionFillStatus {
  return value === "blocked" || value === "filled";
}

function isExecutionAdapterHealthProbeStatus(value: unknown): value is ExecutionAdapterHealthProbeStatus {
  return value === "ready" || value === "review" || value === "blocked";
}

function isExecutionAdapterHealthProbeCheckStatus(
  value: unknown
): value is ExecutionAdapterHealthProbeCheckStatus {
  return value === "passed" || value === "review" || value === "blocked" || value === "skipped";
}

function isSecretFreeRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.entries(value as Record<string, unknown>).every(([key, item]) => {
    if (isSecretLikeKey(key)) {
      return item === "[redacted]";
    }
    if (item && typeof item === "object") {
      return Array.isArray(item)
        ? item.every((entry) => !entry || typeof entry !== "object" || isSecretFreeRecord(entry))
        : isSecretFreeRecord(item);
    }
    return true;
  });
}

function isSecretLikeKey(key: string): boolean {
  const normalized = key.replace(/[_-]/g, "").toLowerCase();
  return ["secret", "token", "apikey", "privatekey", "password"].some((marker) => normalized.includes(marker));
}

function isGoldenPathStatus(value: unknown): value is GoldenPathStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const status = value as Partial<GoldenPathStatus>;
  return (
    status.schemaVersion === 1 &&
    isMarket(status.market) &&
    typeof status.symbol === "string" &&
    isTimeframe(status.timeframe) &&
    isGoldenPathOverallStatus(status.status) &&
    (status.currentStepId === null || typeof status.currentStepId === "string") &&
    (status.latestRunId === null || typeof status.latestRunId === "string") &&
    (status.nextAction === null || isGoldenPathNextAction(status.nextAction)) &&
    isGoldenPathSummary(status.summary) &&
    Array.isArray(status.runbook) &&
    status.runbook.every(isGoldenPathRunbookItem) &&
    Array.isArray(status.workspaces) &&
    status.workspaces.every(isGoldenPathWorkspace) &&
    Array.isArray(status.steps) &&
    status.steps.every(isGoldenPathStep)
  );
}

function isGoldenPathOverallStatus(value: unknown): value is GoldenPathOverallStatus {
  return value === "ready" || value === "review" || value === "blocked";
}

function isGoldenPathStep(value: unknown): value is GoldenPathStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<GoldenPathStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isGoldenPathStepStatus(step.status) &&
    typeof step.passed === "boolean" &&
    typeof step.detail === "string" &&
    (step.actionId === null || typeof step.actionId === "string")
  );
}

function isGoldenPathStepStatus(value: unknown): value is GoldenPathStepStatus {
  return value === "passed" || value === "review" || value === "blocked";
}

function isGoldenPathWorkspace(value: unknown): value is GoldenPathWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<GoldenPathWorkspace>;
  return (
    typeof workspace.id === "string" &&
    typeof workspace.label === "string" &&
    isGoldenPathWorkspaceStatus(workspace.status) &&
    typeof workspace.current === "boolean" &&
    Array.isArray(workspace.stepIds) &&
    workspace.stepIds.every((stepId) => typeof stepId === "string") &&
    typeof workspace.reason === "string" &&
    (workspace.actionId === null || typeof workspace.actionId === "string")
  );
}

function isGoldenPathWorkspaceStatus(value: unknown): value is GoldenPathWorkspaceStatus {
  return value === "ready" || value === "needs_run" || value === "blocked";
}

function isGoldenPathSummary(value: unknown): value is GoldenPathSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<GoldenPathSummary>;
  return (
    typeof summary.totalSteps === "number" &&
    typeof summary.passedSteps === "number" &&
    typeof summary.reviewSteps === "number" &&
    typeof summary.blockedSteps === "number" &&
    (summary.currentStepLabel === null || typeof summary.currentStepLabel === "string") &&
    (summary.nextActionId === null || typeof summary.nextActionId === "string") &&
    typeof summary.liveTradingAllowed === "boolean"
  );
}

function isGoldenPathRunbookItem(value: unknown): value is GoldenPathRunbookItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<GoldenPathRunbookItem>;
  return (
    typeof item.stepId === "string" &&
    typeof item.label === "string" &&
    typeof item.workspaceId === "string" &&
    isGoldenPathStepStatus(item.status) &&
    typeof item.current === "boolean" &&
    typeof item.passed === "boolean" &&
    typeof item.detail === "string" &&
    (item.blocker === null || typeof item.blocker === "string") &&
    (item.actionId === null || typeof item.actionId === "string") &&
    (item.actionLabel === null || typeof item.actionLabel === "string") &&
    (item.targetWorkspace === undefined || item.targetWorkspace === null || typeof item.targetWorkspace === "string")
  );
}

function isGoldenPathNextAction(value: unknown): value is GoldenPathNextAction {
  if (!value || typeof value !== "object") {
    return false;
  }
  const action = value as Partial<GoldenPathNextAction>;
  return (
    typeof action.id === "string" &&
    typeof action.label === "string" &&
    typeof action.targetWorkspace === "string" &&
    typeof action.reason === "string"
  );
}

function isPaperExecutionRecord(value: unknown): value is PaperExecutionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const execution = value as Partial<PaperExecutionRecord>;
  return (
    typeof execution.executionId === "string" &&
    typeof execution.runId === "string" &&
    typeof execution.createdAt === "string" &&
    typeof execution.mode === "string" &&
    isPaperExecutionAccount(execution.account) &&
    Array.isArray(execution.orders) &&
    execution.orders.every(isPaperExecutionOrder) &&
    Array.isArray(execution.gates) &&
    execution.gates.every(isPaperExecutionGate) &&
    (execution.preparationEvidence === undefined ||
      isResearchRunDataPreparationEvidence(execution.preparationEvidence))
  );
}

function isPaperExecutionAccount(value: unknown): value is PaperExecutionAccount {
  if (!value || typeof value !== "object") {
    return false;
  }
  const account = value as Partial<PaperExecutionAccount>;
  return (
    typeof account.cash === "number" &&
    typeof account.equity === "number" &&
    Boolean(account.positions) &&
    typeof account.positions === "object" &&
    Object.values(account.positions).every((quantity) => typeof quantity === "number")
  );
}

function isPaperExecutionOrder(value: unknown): value is PaperExecutionOrder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const order = value as Partial<PaperExecutionOrder>;
  return (
    typeof order.orderId === "string" &&
    typeof order.symbol === "string" &&
    (order.side === "buy" || order.side === "sell") &&
    typeof order.quantity === "number" &&
    typeof order.price === "number" &&
    (order.status === "filled" || order.status === "rejected") &&
    typeof order.reason === "string" &&
    typeof order.timestamp === "string"
  );
}

function isPaperExecutionGate(value: unknown): value is PaperExecutionGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<PaperExecutionGate>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
  );
}

function isResearchRunExportPackage(value: unknown): value is ResearchRunExportPackage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const exportPackage = value as Partial<ResearchRunExportPackage>;
  return (
    exportPackage.kind === "aiqt.researchRun.export" &&
    typeof exportPackage.packageVersion === "number" &&
    typeof exportPackage.exportedAt === "string" &&
    (exportPackage.integrity === undefined || isResearchRunExportIntegrity(exportPackage.integrity)) &&
    isResearchRunExportManifest(exportPackage.manifest) &&
    isResearchRunAudit(exportPackage.researchRun) &&
    Boolean(exportPackage.researchRun.dataSnapshot) &&
    isResearchRunExecutionHandoff(exportPackage.executionHandoff) &&
    (exportPackage.paperExecutions === undefined ||
      (Array.isArray(exportPackage.paperExecutions) && exportPackage.paperExecutions.every(isPaperExecutionRecord))) &&
    (exportPackage.adapterPaperExecutions === undefined ||
      (Array.isArray(exportPackage.adapterPaperExecutions) &&
        exportPackage.adapterPaperExecutions.every(isExecutionAdapterPaperExecutionResult))) &&
    (exportPackage.portfolioPaperOrderBatches === undefined ||
      (Array.isArray(exportPackage.portfolioPaperOrderBatches) &&
        exportPackage.portfolioPaperOrderBatches.every(isPortfolioPaperOrderBatch))) &&
    (exportPackage.portfolioPaperOrderApprovals === undefined ||
      (Array.isArray(exportPackage.portfolioPaperOrderApprovals) &&
        exportPackage.portfolioPaperOrderApprovals.every(isPortfolioPaperOrderApproval))) &&
    (exportPackage.portfolioPaperOrderSimulations === undefined ||
      (Array.isArray(exportPackage.portfolioPaperOrderSimulations) &&
        exportPackage.portfolioPaperOrderSimulations.every(isPortfolioPaperOrderSimulation))) &&
    (exportPackage.promotionCandidate === undefined ||
      exportPackage.promotionCandidate === null ||
      isPromotionCandidateRecord(exportPackage.promotionCandidate)) &&
    (exportPackage.aiReviewRuns === undefined ||
      (Array.isArray(exportPackage.aiReviewRuns) && exportPackage.aiReviewRuns.every(isAiReviewRunRecordEnvelope))) &&
    (exportPackage.auditEvents === undefined ||
      (Array.isArray(exportPackage.auditEvents) && exportPackage.auditEvents.every(isAuditEventRecord))) &&
    (exportPackage.handoffNotes === undefined ||
      (Array.isArray(exportPackage.handoffNotes) && exportPackage.handoffNotes.every(isHandoffNote))) &&
    (exportPackage.p0PackageCompleteness === undefined ||
      isResearchRunExportP0PackageCompleteness(exportPackage.p0PackageCompleteness)) &&
    (exportPackage.auditEvidenceSummary === undefined ||
      isResearchRunExportAuditEvidenceSummary(exportPackage.auditEvidenceSummary)) &&
    (exportPackage.auditReport === undefined || isResearchRunExportAuditReport(exportPackage.auditReport)) &&
    (exportPackage.backtestReport === undefined || isResearchRunExportBacktestReport(exportPackage.backtestReport))
  );
}

function isResearchRunExportIntegrity(value: unknown): value is ResearchRunExportIntegrity {
  if (!value || typeof value !== "object") {
    return false;
  }
  const integrity = value as Partial<ResearchRunExportIntegrity>;
  return integrity.algorithm === "sha256" && typeof integrity.hash === "string" && /^[a-f0-9]{64}$/i.test(integrity.hash);
}

function isResearchRunExportAuditEvidenceSummary(value: unknown): value is ResearchRunExportAuditEvidenceSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<ResearchRunExportAuditEvidenceSummary>;
  return (
    summary.kind === "aiqt.auditEvidenceSummary" &&
    summary.schemaVersion === 1 &&
    typeof summary.runId === "string" &&
    typeof summary.generatedAt === "string" &&
    typeof summary.auditQuery === "string" &&
    typeof summary.packageQuery === "string" &&
    typeof summary.importDiffQuery === "string" &&
    typeof summary.focusQuery === "string" &&
    isAuditEvidenceDeepLinkStatus(summary.deepLinkStatus) &&
    (summary.deepLinkError === null || typeof summary.deepLinkError === "string") &&
    isAuditEvidenceCountGroup(summary.package) &&
    isAuditEvidenceImportDiffCountGroup(summary.importDiff) &&
    (summary.importVerification === undefined ||
      isAuditEvidenceImportVerificationGroup(summary.importVerification)) &&
    (summary.importPolicyBlockers === undefined ||
      isAuditEvidenceImportPolicyBlockerGroup(summary.importPolicyBlockers)) &&
    typeof summary.copyText === "string"
  );
}

function isResearchRunExportAuditReport(value: unknown): value is ResearchRunExportAuditReport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const report = value as Partial<ResearchRunExportAuditReport>;
  return (
    report.kind === "aiqt.auditReport" &&
    report.schemaVersion === 1 &&
    typeof report.runId === "string" &&
    typeof report.generatedAt === "string" &&
    report.format === "text/markdown" &&
    typeof report.fileName === "string" &&
    isResearchRunExportIntegrity(report.contentSha256) &&
    typeof report.contentMarkdown === "string" &&
    (report.signature === undefined || isResearchRunExportReportSignature(report.signature)) &&
    isResearchRunExportAuditEvidenceSummary(report.evidenceSummary)
  );
}

function isResearchRunExportBacktestReport(value: unknown): value is ResearchRunExportBacktestReport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const report = value as Partial<ResearchRunExportBacktestReport>;
  return (
    report.kind === "aiqt.backtestReport" &&
    report.schemaVersion === 1 &&
    typeof report.runId === "string" &&
    typeof report.generatedAt === "string" &&
    report.format === "text/markdown" &&
    typeof report.fileName === "string" &&
    isResearchRunExportIntegrity(report.contentSha256) &&
    typeof report.contentMarkdown === "string" &&
    isMarket(report.market) &&
    typeof report.symbol === "string" &&
    isTimeframe(report.timeframe) &&
    typeof report.strategyRevision === "string" &&
    typeof report.executionMode === "string" &&
    typeof report.dataRows === "number" &&
    typeof report.runComparisonRows === "number" &&
    (report.signature === undefined || isResearchRunExportReportSignature(report.signature)) &&
    report.boundary === "historical audited evidence only; no investment advice"
  );
}

function isResearchRunExportReportSignature(value: unknown): value is ResearchRunExportReportSignature {
  if (!isPlainRecord(value) || hasForbiddenSignatureMaterial(value)) {
    return false;
  }
  const signature = value as Partial<ResearchRunExportReportSignature>;
  const status = signature.status;
  const stringFields = [
    "algorithm",
    "chainId",
    "eventId",
    "importVerificationReason",
    "importVerificationSource",
    "importVerificationStatus",
    "importVerifiedAt",
    "invalidReason",
    "keyFingerprint",
    "keyId",
    "revokedAt",
    "revokedReason",
    "signedAt",
    "signer",
    "value",
    "verifiedAt"
  ] as const;
  return (
    (status === "unsigned" ||
      status === "signed" ||
      status === "verified" ||
      status === "revoked" ||
      status === "invalid") &&
    stringFields.every((field) => signature[field] === undefined || typeof signature[field] === "string")
  );
}

function hasForbiddenSignatureMaterial(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasForbiddenSignatureMaterial);
  }
  if (!isPlainRecord(value)) {
    return false;
  }
  const forbiddenKeys = new Set([
    "accesstoken",
    "apikey",
    "passphrase",
    "password",
    "privatekey",
    "rawprivatekey",
    "rawsecret",
    "refreshtoken",
    "secret"
  ]);
  return Object.entries(value).some(([key, nested]) => {
    const normalizedKey = key.toLowerCase().replace(/[-_\s]/gu, "");
    return forbiddenKeys.has(normalizedKey) || hasForbiddenSignatureMaterial(nested);
  });
}

function isAuditEvidenceDeepLinkStatus(value: unknown): value is ResearchRunExportAuditEvidenceSummary["deepLinkStatus"] {
  return value === "none" || value === "idle" || value === "loading" || value === "loaded" || value === "failed";
}

function isAuditEvidenceCountGroup(
  value: unknown
): value is ResearchRunExportAuditEvidenceSummary["package"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const counts = value as Partial<ResearchRunExportAuditEvidenceSummary["package"]>;
  return (
    typeof counts.ready === "number" &&
    typeof counts.missing === "number" &&
    typeof counts.blocked === "number" &&
    typeof counts.matched === "number" &&
    typeof counts.total === "number"
  );
}

function isAuditEvidenceImportDiffCountGroup(
  value: unknown
): value is ResearchRunExportAuditEvidenceSummary["importDiff"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const counts = value as Partial<ResearchRunExportAuditEvidenceSummary["importDiff"]>;
  return (
    typeof counts.changes === "number" &&
    typeof counts.adds === "number" &&
    typeof counts.blocked === "number" &&
    typeof counts.matched === "number" &&
    typeof counts.total === "number"
  );
}

function isAuditEvidenceImportVerificationGroup(
  value: unknown
): value is NonNullable<ResearchRunExportAuditEvidenceSummary["importVerification"]> {
  if (!value || typeof value !== "object") {
    return false;
  }
  type ImportVerificationGroup = NonNullable<ResearchRunExportAuditEvidenceSummary["importVerification"]>;
  const group = value as Partial<ImportVerificationGroup>;
  return (
    typeof group.verified === "number" &&
    typeof group.invalid === "number" &&
    Array.isArray(group.buckets) &&
    group.buckets.every((bucket) => {
      if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
        return false;
      }
      const item = bucket as Partial<ImportVerificationGroup["buckets"][number]>;
      return (
        typeof item.count === "number" &&
        typeof item.latestExportPath === "string" &&
        typeof item.latestReason === "string" &&
        item.source === "local-core" &&
        (item.status === "verified" || item.status === "invalid")
      );
    })
  );
}

function isAuditEvidenceImportPolicyBlockerGroup(
  value: unknown
): value is NonNullable<ResearchRunExportAuditEvidenceSummary["importPolicyBlockers"]> {
  if (!value || typeof value !== "object") {
    return false;
  }
  type ImportPolicyBlockerGroup = NonNullable<ResearchRunExportAuditEvidenceSummary["importPolicyBlockers"]>;
  const group = value as Partial<ImportPolicyBlockerGroup>;
  const categories = new Set([
    "import-verification",
    "report-signature",
    "package-integrity",
    "artifact-counts",
    "live-boundary",
    "data-snapshot",
    "unknown"
  ]);
  return (
    typeof group.blocked === "number" &&
    Array.isArray(group.buckets) &&
    group.buckets.every((bucket) => {
      if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
        return false;
      }
      const item = bucket as Partial<ImportPolicyBlockerGroup["buckets"][number]>;
      return (
        typeof item.category === "string" &&
        categories.has(item.category) &&
        typeof item.count === "number" &&
        typeof item.label === "string" &&
        typeof item.latestDetail === "string" &&
        typeof item.latestExportPath === "string" &&
        typeof item.latestFileName === "string" &&
        typeof item.latestRunId === "string" &&
        (item.tone === "risk" || item.tone === "warning")
      );
    })
  );
}

async function sha256TextHex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sanitizeDownloadFileName(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "");
  return normalized || "audit-run";
}

function isResearchRunExportManifest(value: unknown): value is ResearchRunExportManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const manifest = value as Partial<ResearchRunExportManifest>;
  const counts = manifest.artifactCounts as Partial<ResearchRunExportManifest["artifactCounts"]> | undefined;
  return (
    typeof manifest.runId === "string" &&
    typeof manifest.createdAt === "string" &&
    isMarket(manifest.market) &&
    typeof manifest.symbol === "string" &&
    isTimeframe(manifest.timeframe) &&
    typeof manifest.strategyRevision === "string" &&
    typeof manifest.dataHash === "string" &&
    typeof manifest.dataRows === "number" &&
    typeof manifest.executionMode === "string" &&
    typeof manifest.paperOnly === "boolean" &&
    typeof manifest.liveTradingAllowed === "boolean" &&
    Boolean(counts) &&
    typeof counts?.bars === "number" &&
    typeof counts?.trades === "number" &&
    typeof counts?.equityPoints === "number" &&
    typeof counts?.decisions === "number" &&
    typeof counts?.aiRisks === "number" &&
    (counts?.paperExecutions === undefined || typeof counts.paperExecutions === "number") &&
    (counts?.adapterPaperExecutions === undefined || typeof counts.adapterPaperExecutions === "number") &&
    (counts?.portfolioPaperOrderBatches === undefined ||
      typeof counts.portfolioPaperOrderBatches === "number") &&
    (counts?.portfolioPaperOrderApprovals === undefined ||
      typeof counts.portfolioPaperOrderApprovals === "number") &&
    (counts?.portfolioPaperOrderSimulations === undefined ||
      typeof counts.portfolioPaperOrderSimulations === "number") &&
    (counts?.promotionCandidates === undefined || typeof counts.promotionCandidates === "number") &&
    (counts?.researchNotes === undefined || typeof counts.researchNotes === "number") &&
    (counts?.aiReviewRuns === undefined || typeof counts.aiReviewRuns === "number") &&
    (counts?.auditEvents === undefined || typeof counts.auditEvents === "number") &&
    (counts?.handoffNotes === undefined || typeof counts.handoffNotes === "number")
  );
}

function isResearchRunExportP0PackageCompleteness(
  value: unknown
): value is ResearchRunExportP0PackageCompleteness {
  if (!value || typeof value !== "object") {
    return false;
  }
  const completeness = value as Partial<ResearchRunExportP0PackageCompleteness>;
  return (
    completeness.kind === "aiqt.p0PackageCompleteness" &&
    completeness.schemaVersion === 1 &&
    typeof completeness.runId === "string" &&
    typeof completeness.ready === "boolean" &&
    (completeness.status === "complete" ||
      completeness.status === "review" ||
      completeness.status === "blocked") &&
    typeof completeness.passed === "number" &&
    typeof completeness.review === "number" &&
    typeof completeness.blocked === "number" &&
    typeof completeness.total === "number" &&
    typeof completeness.progressPct === "number" &&
    typeof completeness.paperOnly === "boolean" &&
    typeof completeness.liveTradingAllowed === "boolean" &&
    typeof completeness.liveBlockedBoundary === "boolean" &&
    typeof completeness.summary === "string" &&
    Array.isArray(completeness.criteria) &&
    completeness.criteria.every(isResearchRunExportP0PackageCriterion)
  );
}

function isResearchRunExportP0PackageCriterion(
  value: unknown
): value is ResearchRunExportP0PackageCriterion {
  if (!value || typeof value !== "object") {
    return false;
  }
  const criterion = value as Partial<ResearchRunExportP0PackageCriterion>;
  return (
    typeof criterion.id === "string" &&
    typeof criterion.label === "string" &&
    (criterion.status === "passed" || criterion.status === "review" || criterion.status === "blocked") &&
    typeof criterion.detail === "string" &&
    typeof criterion.evidence === "string" &&
    typeof criterion.evidencePath === "string"
  );
}

function isResearchRunExecutionHandoff(value: unknown): value is ResearchRunExecutionHandoff {
  if (!value || typeof value !== "object") {
    return false;
  }
  const handoff = value as Partial<ResearchRunExecutionHandoff>;
  return (
    typeof handoff.mode === "string" &&
    typeof handoff.paperOnly === "boolean" &&
    typeof handoff.liveTradingAllowed === "boolean" &&
    Array.isArray(handoff.requiredGates) &&
    handoff.requiredGates.every(isResearchRunExecutionGateExport)
  );
}

function isResearchRunExecutionGateExport(value: unknown): value is ResearchRunExecutionGateExport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<ResearchRunExecutionGateExport>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
  );
}

function isMarketKlinesPayload(value: unknown): value is Omit<MarketKlinesResult, "source" | "error"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketKlinesResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    isMarketKlineQuality(payload.quality) &&
    Array.isArray(payload.bars) &&
    payload.bars.every(isMarketKlineBar)
  );
}

function isMarketKlineQuality(value: unknown): value is MarketKlineQuality {
  if (!value || typeof value !== "object") {
    return false;
  }
  const quality = value as Partial<MarketKlineQuality>;
  return (
    typeof quality.source === "string" &&
    typeof quality.isComplete === "boolean" &&
    Array.isArray(quality.warnings) &&
    quality.warnings.every((warning) => typeof warning === "string") &&
    typeof quality.rows === "number"
  );
}

function isMarketKlineBar(value: unknown): value is MarketKlineBar {
  if (!value || typeof value !== "object") {
    return false;
  }
  const bar = value as Partial<MarketKlineBar>;
  return (
    typeof bar.timestamp === "string" &&
    typeof bar.timestampMs === "number" &&
    typeof bar.open === "number" &&
    typeof bar.high === "number" &&
    typeof bar.low === "number" &&
    typeof bar.close === "number" &&
    typeof bar.volume === "number"
  );
}

function isMarketDataReadinessPayload(value: unknown): value is MarketDataReadiness {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketDataReadiness>;
  return (
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    (payload.state === "ready" || payload.state === "stale" || payload.state === "blocked") &&
    typeof payload.source === "string" &&
    (payload.cacheState === "fresh" || payload.cacheState === "stale" || payload.cacheState === "empty") &&
    typeof payload.barCount === "number" &&
    Number.isFinite(payload.barCount) &&
    payload.barCount >= 0 &&
    (payload.latestBarAt === null || typeof payload.latestBarAt === "string") &&
    (payload.startBarAt === null || typeof payload.startBarAt === "string") &&
    (payload.ageHours === null ||
      (typeof payload.ageHours === "number" && Number.isFinite(payload.ageHours) && payload.ageHours >= 0)) &&
    (payload.providerHealthState === "healthy" || payload.providerHealthState === "degraded") &&
    Array.isArray(payload.blockingReasons) &&
    payload.blockingReasons.every((reason) => typeof reason === "string") &&
    Array.isArray(payload.repairActions) &&
    payload.repairActions.every(isMarketDataReadinessRepairAction) &&
    (payload.latestRefreshRunId === null || typeof payload.latestRefreshRunId === "string") &&
    (payload.latestProviderErrorId === null || typeof payload.latestProviderErrorId === "string") &&
    Array.isArray(payload.dataQualityWarnings) &&
    payload.dataQualityWarnings.every((warning) => typeof warning === "string")
  );
}

function isMarketDataReadinessRepairAction(value: unknown): value is MarketDataReadinessRepairAction {
  if (!value || typeof value !== "object") {
    return false;
  }
  const action = value as Partial<MarketDataReadinessRepairAction>;
  return (
    typeof action.id === "string" &&
    typeof action.label === "string" &&
    typeof action.target === "string" &&
    (action.method === "GET" || action.method === "POST")
  );
}

function isMarketCalendarPayload(value: unknown): value is { calendar: MarketCalendarStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { calendar?: unknown };
  return isMarketCalendarStatus(payload.calendar);
}

function isMarketCalendarStatus(value: unknown): value is MarketCalendarStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const calendar = value as Partial<MarketCalendarStatus>;
  return (
    isMarket(calendar.market) &&
    typeof calendar.timezone === "string" &&
    isMarketCalendarStatusValue(calendar.status) &&
    typeof calendar.isOpen === "boolean" &&
    typeof calendar.session === "string" &&
    typeof calendar.asOf === "string" &&
    typeof calendar.tradingDay === "string" &&
    (calendar.nextOpen === null || typeof calendar.nextOpen === "string") &&
    (calendar.nextClose === null || typeof calendar.nextClose === "string") &&
    typeof calendar.detail === "string" &&
    Array.isArray(calendar.warnings) &&
    calendar.warnings.every((warning) => typeof warning === "string") &&
    typeof calendar.source === "string"
  );
}

function isMarketCalendarStatusValue(value: unknown): value is MarketCalendarStatusValue {
  return value === "open" || value === "closed" || value === "break" || value === "always_open" || value === "unknown";
}

function isPortfolioBacktestPayload(value: unknown): value is { portfolio: PortfolioBacktestRun } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { portfolio?: unknown };
  return isPortfolioBacktestRun(payload.portfolio);
}

function isPortfolioPaperOrderBatchPayload(
  value: unknown
): value is {
  portfolioPaperOrderBatch: PortfolioPaperOrderBatch;
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    portfolioPaperOrderBatch?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvent?: unknown;
  };
  return (
    isPortfolioPaperOrderBatch(payload.portfolioPaperOrderBatch) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isPortfolioPaperOrderDuplicateBatchPayload(
  value: unknown
): value is {
  error: "portfolio_paper_order_batch_already_recorded";
  existingBatch: PortfolioPaperOrderBatch;
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingBatch?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
  };
  return (
    payload.error === "portfolio_paper_order_batch_already_recorded" &&
    isPortfolioPaperOrderBatch(payload.existingBatch) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)))
  );
}

function isPortfolioPaperOrderBatchesPayload(value: unknown): value is { portfolioPaperOrderBatches: PortfolioPaperOrderBatch[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { portfolioPaperOrderBatches?: unknown };
  return Array.isArray(payload.portfolioPaperOrderBatches) && payload.portfolioPaperOrderBatches.every(isPortfolioPaperOrderBatch);
}

function isPortfolioPaperOrderApprovalRecordPayload(
  value: unknown
): value is {
  approval: PortfolioPaperOrderApproval;
  approvals: PortfolioPaperOrderApproval[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    approval?: unknown;
    approvals?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvent?: unknown;
  };
  return (
    isPortfolioPaperOrderApproval(payload.approval) &&
    Array.isArray(payload.approvals) &&
    payload.approvals.every(isPortfolioPaperOrderApproval) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isPortfolioPaperOrderApprovalLockedPayload(
  value: unknown
): value is {
  error: "portfolio_paper_order_approval_locked_after_simulation";
  existingApproval: PortfolioPaperOrderApproval;
  existingSimulation: PortfolioPaperOrderSimulation;
  approvals: PortfolioPaperOrderApproval[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingApproval?: unknown;
    existingSimulation?: unknown;
    approvals?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
  };
  return (
    payload.error === "portfolio_paper_order_approval_locked_after_simulation" &&
    isPortfolioPaperOrderApproval(payload.existingApproval) &&
    isPortfolioPaperOrderSimulation(payload.existingSimulation) &&
    Array.isArray(payload.approvals) &&
    payload.approvals.every(isPortfolioPaperOrderApproval) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)))
  );
}

function isPortfolioPaperOrderApprovalHistoryPayload(
  value: unknown
): value is { approvals: PortfolioPaperOrderApproval[]; portfolioPaperOrderLifecycle: PortfolioPaperOrderLifecycleEvent[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { approvals?: unknown; portfolioPaperOrderLifecycle?: unknown };
  return (
    Array.isArray(payload.approvals) &&
    payload.approvals.every(isPortfolioPaperOrderApproval) &&
    Array.isArray(payload.portfolioPaperOrderLifecycle) &&
    payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)
  );
}

function isPortfolioPaperOrderSimulationRecordPayload(
  value: unknown
): value is {
  simulation: PortfolioPaperOrderSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvent?: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    simulation?: unknown;
    simulations?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvent?: unknown;
  };
  return (
    isPortfolioPaperOrderSimulation(payload.simulation) &&
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isPortfolioPaperOrderDuplicateSimulationPayload(
  value: unknown
): value is {
  error: "portfolio_paper_order_simulation_already_recorded";
  existingSimulation: PortfolioPaperOrderSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    error?: unknown;
    existingSimulation?: unknown;
    simulations?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
  };
  return (
    payload.error === "portfolio_paper_order_simulation_already_recorded" &&
    isPortfolioPaperOrderSimulation(payload.existingSimulation) &&
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)))
  );
}

function isPortfolioPaperOrderBatchSimulationRecordPayload(
  value: unknown
): value is {
  batchSimulation: PortfolioPaperOrderBatchSimulation;
  simulations: PortfolioPaperOrderSimulation[];
  createdSimulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderLifecycle?: PortfolioPaperOrderLifecycleEvent[];
  auditEvents: AuditEventRecord[];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    batchSimulation?: unknown;
    simulations?: unknown;
    createdSimulations?: unknown;
    portfolioPaperOrderLifecycle?: unknown;
    auditEvents?: unknown;
  };
  return (
    isPortfolioPaperOrderBatchSimulation(payload.batchSimulation) &&
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    Array.isArray(payload.createdSimulations) &&
    payload.createdSimulations.every(isPortfolioPaperOrderSimulation) &&
    (payload.portfolioPaperOrderLifecycle === undefined ||
      (Array.isArray(payload.portfolioPaperOrderLifecycle) &&
        payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent))) &&
    Array.isArray(payload.auditEvents) &&
    payload.auditEvents.every(isAuditEventRecord)
  );
}

function isPortfolioPaperOrderBatchSimulation(value: unknown): value is PortfolioPaperOrderBatchSimulation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const simulation = value as Partial<PortfolioPaperOrderBatchSimulation>;
  return (
    simulation.schemaVersion === 1 &&
    simulation.mode === "portfolio_paper_order_batch_simulation" &&
    typeof simulation.status === "string" &&
    typeof simulation.baseRunId === "string" &&
    typeof simulation.batchId === "string" &&
    typeof simulation.requestedCount === "number" &&
    typeof simulation.filledCount === "number" &&
    typeof simulation.blockedCount === "number" &&
    typeof simulation.skippedCount === "number" &&
    Array.isArray(simulation.filledOrderIds) &&
    simulation.filledOrderIds.every((orderId) => typeof orderId === "string") &&
    Array.isArray(simulation.blockedOrders) &&
    simulation.blockedOrders.every(isPortfolioPaperOrderBatchSimulationIssue) &&
    Array.isArray(simulation.skippedOrders) &&
    simulation.skippedOrders.every(isPortfolioPaperOrderBatchSimulationIssue) &&
    typeof simulation.paperOnly === "boolean" &&
    typeof simulation.liveExecutionBlocked === "boolean"
  );
}

function isPortfolioPaperOrderBatchSimulationIssue(value: unknown): value is PortfolioPaperOrderBatchSimulationIssue {
  if (!value || typeof value !== "object") {
    return false;
  }
  const issue = value as Partial<PortfolioPaperOrderBatchSimulationIssue>;
  return (
    typeof issue.orderId === "string" &&
    (issue.symbol === undefined || typeof issue.symbol === "string") &&
    (issue.side === undefined || typeof issue.side === "string") &&
    (issue.reason === undefined || typeof issue.reason === "string") &&
    (issue.detail === undefined || typeof issue.detail === "string")
  );
}

function isPortfolioPaperOrderSimulationHistoryPayload(
  value: unknown
): value is { simulations: PortfolioPaperOrderSimulation[]; portfolioPaperOrderLifecycle: PortfolioPaperOrderLifecycleEvent[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { simulations?: unknown; portfolioPaperOrderLifecycle?: unknown };
  return (
    Array.isArray(payload.simulations) &&
    payload.simulations.every(isPortfolioPaperOrderSimulation) &&
    Array.isArray(payload.portfolioPaperOrderLifecycle) &&
    payload.portfolioPaperOrderLifecycle.every(isPortfolioPaperOrderLifecycleEvent)
  );
}

function isPortfolioPaperOrderStateHistoryPayload(
  value: unknown
): value is { stateHistory: PortfolioPaperOrderStateHistory } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { stateHistory?: unknown };
  return isPortfolioPaperOrderStateHistory(payload.stateHistory);
}

function isPortfolioPaperOrderStateHistory(value: unknown): value is PortfolioPaperOrderStateHistory {
  if (!value || typeof value !== "object") {
    return false;
  }
  const history = value as Partial<PortfolioPaperOrderStateHistory>;
  return (
    history.schemaVersion === 1 &&
    typeof history.baseRunId === "string" &&
    typeof history.batchId === "string" &&
    typeof history.portfolioName === "string" &&
    typeof history.generatedAt === "string" &&
    history.mode === "portfolio_paper_order_state_history" &&
    isPortfolioPaperOrderStateHistorySummary(history.summary) &&
    Array.isArray(history.orders) &&
    history.orders.every(isPortfolioPaperOrderStateHistoryOrder) &&
    history.paperOnly === true &&
    history.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderStateHistorySummary(value: unknown): value is PortfolioPaperOrderStateHistorySummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PortfolioPaperOrderStateHistorySummary>;
  return (
    typeof summary.orderCount === "number" &&
    typeof summary.eventCount === "number" &&
    typeof summary.approvedOrders === "number" &&
    typeof summary.rejectedOrders === "number" &&
    typeof summary.filledOrders === "number" &&
    typeof summary.liveBlockedEvents === "number" &&
    isNumberRecord(summary.stateCounts)
  );
}

function isPortfolioPaperOrderStateHistoryOrder(value: unknown): value is PortfolioPaperOrderStateHistoryOrder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const order = value as Partial<PortfolioPaperOrderStateHistoryOrder>;
  return (
    typeof order.batchId === "string" &&
    typeof order.baseRunId === "string" &&
    typeof order.portfolioName === "string" &&
    typeof order.orderId === "string" &&
    typeof order.symbol === "string" &&
    (typeof order.sourceRunId === "string" || order.sourceRunId === null) &&
    (order.side === "buy" || order.side === "sell" || order.side === "hold") &&
    typeof order.quantity === "number" &&
    typeof order.notionalValue === "number" &&
    (order.originalStatus === "pending_review" || order.originalStatus === "rejected" || order.originalStatus === "skipped") &&
    (order.riskStatus === "passed" || order.riskStatus === "review" || order.riskStatus === "blocked") &&
    typeof order.currentState === "string" &&
    typeof order.currentStateLabel === "string" &&
    Array.isArray(order.events) &&
    order.events.every(isPortfolioPaperOrderStateHistoryEvent) &&
    order.paperOnly === true &&
    order.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderStateHistoryEvent(value: unknown): value is PortfolioPaperOrderStateHistoryEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioPaperOrderStateHistoryEvent>;
  return (
    typeof event.eventId === "string" &&
    typeof event.batchId === "string" &&
    typeof event.baseRunId === "string" &&
    typeof event.orderId === "string" &&
    typeof event.timestamp === "string" &&
    typeof event.state === "string" &&
    typeof event.label === "string" &&
    typeof event.actor === "string" &&
    typeof event.source === "string" &&
    typeof event.reason === "string" &&
    (event.metadata === undefined || isSecretFreeRecord(event.metadata)) &&
    event.paperOnly === true &&
    event.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderReplayPayload(value: unknown): value is { replay: PortfolioPaperOrderReplay } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { replay?: unknown };
  return isPortfolioPaperOrderReplay(payload.replay);
}

function isPortfolioPaperOrderReplay(value: unknown): value is PortfolioPaperOrderReplay {
  if (!value || typeof value !== "object") {
    return false;
  }
  const replay = value as Partial<PortfolioPaperOrderReplay>;
  return (
    replay.schemaVersion === 1 &&
    typeof replay.baseRunId === "string" &&
    typeof replay.generatedAt === "string" &&
    replay.mode === "portfolio_paper_order_replay" &&
    typeof replay.initialCash === "number" &&
    isPaperExecutionAccount(replay.account) &&
    Array.isArray(replay.positions) &&
    replay.positions.every(isPortfolioPaperOrderReplayPosition) &&
    Array.isArray(replay.orders) &&
    replay.orders.every(isPortfolioPaperOrderReplayOrder) &&
    isPortfolioPaperOrderReplaySummary(replay.summary) &&
    replay.paperOnly === true &&
    replay.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderReplayPosition(value: unknown): value is PortfolioPaperOrderReplayPosition {
  if (!value || typeof value !== "object") {
    return false;
  }
  const position = value as Partial<PortfolioPaperOrderReplayPosition>;
  return (
    typeof position.symbol === "string" &&
    typeof position.quantity === "number" &&
    typeof position.avgCost === "number" &&
    typeof position.lastPrice === "number" &&
    typeof position.marketValue === "number" &&
    typeof position.unrealizedPnl === "number"
  );
}

function isPortfolioPaperOrderReplayOrder(value: unknown): value is PortfolioPaperOrderReplayOrder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const order = value as Partial<PortfolioPaperOrderReplayOrder>;
  return (
    typeof order.simulationId === "string" &&
    typeof order.batchId === "string" &&
    typeof order.orderId === "string" &&
    typeof order.simulatedAt === "string" &&
    typeof order.symbol === "string" &&
    (order.side === "buy" || order.side === "sell") &&
    typeof order.quantity === "number" &&
    typeof order.fillPrice === "number" &&
    typeof order.notionalValue === "number" &&
    typeof order.cashAfter === "number" &&
    typeof order.positionAfter === "number" &&
    (order.replayState === "applied" || order.replayState === "ignored") &&
    (order.adapterPaperExecutionId === undefined || typeof order.adapterPaperExecutionId === "string") &&
    (order.adapterManifestValidationId === undefined || typeof order.adapterManifestValidationId === "string") &&
    (order.adapterPaperExecutionEvidence === undefined ||
      isSecretFreeRecord(order.adapterPaperExecutionEvidence)) &&
    order.paperOnly === true &&
    order.liveExecutionBlocked === true
  );
}

function isPortfolioPaperOrderReplaySummary(value: unknown): value is PortfolioPaperOrderReplaySummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PortfolioPaperOrderReplaySummary>;
  return (
    typeof summary.filledOrders === "number" &&
    typeof summary.buyNotional === "number" &&
    typeof summary.sellNotional === "number" &&
    typeof summary.netNotional === "number" &&
    typeof summary.realizedPnl === "number" &&
    typeof summary.unrealizedPnl === "number" &&
    typeof summary.positionCount === "number" &&
    Array.isArray(summary.warnings) &&
    summary.warnings.every((warning) => typeof warning === "string")
  );
}

function isPortfolioPaperOrderApproval(value: unknown): value is PortfolioPaperOrderApproval {
  if (!value || typeof value !== "object") {
    return false;
  }
  const approval = value as Partial<PortfolioPaperOrderApproval>;
  return (
    typeof approval.approvalId === "string" &&
    typeof approval.baseRunId === "string" &&
    typeof approval.batchId === "string" &&
    typeof approval.orderId === "string" &&
    typeof approval.reviewedAt === "string" &&
    typeof approval.approved === "boolean" &&
    typeof approval.reviewer === "string" &&
    typeof approval.reason === "string"
  );
}

function isPortfolioPaperOrderSimulation(value: unknown): value is PortfolioPaperOrderSimulation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const simulation = value as Partial<PortfolioPaperOrderSimulation>;
  return (
    typeof simulation.simulationId === "string" &&
    typeof simulation.baseRunId === "string" &&
    typeof simulation.batchId === "string" &&
    typeof simulation.orderId === "string" &&
    typeof simulation.simulatedAt === "string" &&
    simulation.mode === "portfolio_paper_order_simulation" &&
    typeof simulation.symbol === "string" &&
    (typeof simulation.sourceRunId === "string" || simulation.sourceRunId === null) &&
    (simulation.side === "buy" || simulation.side === "sell") &&
    typeof simulation.quantity === "number" &&
    typeof simulation.fillPrice === "number" &&
    typeof simulation.notionalValue === "number" &&
    simulation.orderState === "filled" &&
    simulation.fillStatus === "filled" &&
    typeof simulation.reason === "string" &&
    (typeof simulation.approvedBy === "string" || simulation.approvedBy === null) &&
    (simulation.routeRisk === undefined || isPortfolioPaperOrderSimulationRouteRisk(simulation.routeRisk)) &&
    (simulation.adapterPaperExecutionId === undefined || typeof simulation.adapterPaperExecutionId === "string") &&
    (simulation.adapterManifestValidationId === undefined ||
      typeof simulation.adapterManifestValidationId === "string") &&
    (simulation.adapterPaperExecutionEvidence === undefined ||
      isSecretFreeRecord(simulation.adapterPaperExecutionEvidence)) &&
    typeof simulation.paperOnly === "boolean" &&
    typeof simulation.liveExecutionBlocked === "boolean"
  );
}

function isPortfolioPaperOrderSimulationRouteRisk(value: unknown): value is PortfolioPaperOrderSimulationRouteRisk {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const routeRisk = value as Partial<PortfolioPaperOrderSimulationRouteRisk>;
  return (
    (routeRisk.status === undefined || typeof routeRisk.status === "string") &&
    (routeRisk.cashAfter === undefined || typeof routeRisk.cashAfter === "number") &&
    (routeRisk.blockedReasons === undefined ||
      (Array.isArray(routeRisk.blockedReasons) &&
        routeRisk.blockedReasons.every((reason) => typeof reason === "string")))
  );
}

function isPortfolioPaperOrderBatch(value: unknown): value is PortfolioPaperOrderBatch {
  if (!value || typeof value !== "object") {
    return false;
  }
  const batch = value as Partial<PortfolioPaperOrderBatch>;
  return (
    typeof batch.batchId === "string" &&
    typeof batch.baseRunId === "string" &&
    typeof batch.portfolioName === "string" &&
    typeof batch.createdAt === "string" &&
    batch.mode === "portfolio_paper_order_review" &&
    typeof batch.source === "string" &&
    isPortfolioPaperOrderSummary(batch.summary) &&
    Array.isArray(batch.orders) &&
    batch.orders.every(isPortfolioPaperOrderEvent)
  );
}

function isPortfolioPaperOrderSummary(value: unknown): value is PortfolioPaperOrderSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PortfolioPaperOrderSummary>;
  return (
    typeof summary.totalOrders === "number" &&
    typeof summary.totalNotionalValue === "number" &&
    isNumberRecord(summary.statusCounts) &&
    isNumberRecord(summary.riskStatusCounts)
  );
}

function isPortfolioPaperOrderLifecycleEvent(value: unknown): value is PortfolioPaperOrderLifecycleEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<PortfolioPaperOrderLifecycleEvent>;
  return (
    typeof row.batchId === "string" &&
    typeof row.baseRunId === "string" &&
    typeof row.portfolioName === "string" &&
    typeof row.orderId === "string" &&
    typeof row.symbol === "string" &&
    (typeof row.sourceRunId === "string" || row.sourceRunId === null) &&
    (row.side === "buy" || row.side === "sell" || row.side === "hold") &&
    typeof row.quantity === "number" &&
    typeof row.notionalValue === "number" &&
    (row.originalStatus === "pending_review" || row.originalStatus === "rejected" || row.originalStatus === "skipped") &&
    (row.riskStatus === "passed" || row.riskStatus === "review" || row.riskStatus === "blocked") &&
    isPortfolioPaperOrderLifecycleState(row.state) &&
    typeof row.routable === "boolean" &&
    typeof row.paperOnly === "boolean" &&
    typeof row.liveExecutionBlocked === "boolean" &&
    (typeof row.approvedBy === "string" || row.approvedBy === null) &&
    (typeof row.reviewedAt === "string" || row.reviewedAt === null) &&
    typeof row.reason === "string"
  );
}

function isPortfolioPaperOrderLifecycleState(value: unknown): value is PortfolioPaperOrderLifecycleEvent["state"] {
  return (
    value === "awaiting_operator_review" ||
    value === "ready_for_simulation" ||
    value === "risk_rejected" ||
    value === "operator_rejected" ||
    value === "risk_review" ||
    value === "invalid_order" ||
    value === "skipped"
  );
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((item) => typeof item === "number");
}

function isPortfolioBacktestRun(value: unknown): value is PortfolioBacktestRun {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<PortfolioBacktestRun>;
  return (
    typeof run.name === "string" &&
    isMarket(run.market) &&
    isTimeframe(run.timeframe) &&
    typeof run.initialCash === "number" &&
    typeof run.cashWeight === "number" &&
    isPortfolioBacktestMetrics(run.metrics) &&
    Array.isArray(run.equityCurve) &&
    run.equityCurve.every(isPortfolioBacktestEquityPoint) &&
    Array.isArray(run.legs) &&
    run.legs.every(isPortfolioBacktestLeg) &&
    (run.allocationEvents === undefined ||
      (Array.isArray(run.allocationEvents) && run.allocationEvents.every(isPortfolioAllocationEvent))) &&
    (run.rebalanceEvents === undefined ||
      (Array.isArray(run.rebalanceEvents) && run.rebalanceEvents.every(isPortfolioRebalanceEvent))) &&
    (run.tradeReviewEvents === undefined ||
      (Array.isArray(run.tradeReviewEvents) && run.tradeReviewEvents.every(isPortfolioTradeReviewEvent))) &&
    (run.preTradeRiskChecks === undefined ||
      (Array.isArray(run.preTradeRiskChecks) && run.preTradeRiskChecks.every(isPortfolioPreTradeRiskCheck))) &&
    (run.paperOrderEvents === undefined ||
      (Array.isArray(run.paperOrderEvents) && run.paperOrderEvents.every(isPortfolioPaperOrderEvent))) &&
    (run.correlationPairs === undefined ||
      (Array.isArray(run.correlationPairs) && run.correlationPairs.every(isPortfolioCorrelationPair))) &&
    (run.covarianceRisk === undefined || isPortfolioCovarianceRisk(run.covarianceRisk)) &&
    isMarketKlineQuality(run.dataQuality)
  );
}

function isPortfolioBacktestMetrics(value: unknown): value is PortfolioBacktestMetrics {
  if (!value || typeof value !== "object") {
    return false;
  }
  const metrics = value as Partial<PortfolioBacktestMetrics>;
  return (
    typeof metrics.totalReturnPct === "number" &&
    typeof metrics.annualReturnPct === "number" &&
    typeof metrics.maxDrawdownPct === "number" &&
    typeof metrics.winRatePct === "number" &&
    typeof metrics.profitFactor === "number" &&
    typeof metrics.tradeCount === "number"
  );
}

function isPortfolioBacktestEquityPoint(value: unknown): value is PortfolioBacktestEquityPoint {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Partial<PortfolioBacktestEquityPoint>;
  return typeof point.timestamp === "string" && typeof point.equity === "number";
}

function isPortfolioAllocationEvent(value: unknown): value is PortfolioAllocationEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioAllocationEvent>;
  return (
    typeof event.timestamp === "string" &&
    (event.eventType === "allocate" || event.eventType === "cash_buffer") &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    typeof event.targetWeight === "number" &&
    typeof event.notionalValue === "number" &&
    typeof event.reason === "string"
  );
}

function isPortfolioRebalanceEvent(value: unknown): value is PortfolioRebalanceEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioRebalanceEvent>;
  return (
    typeof event.timestamp === "string" &&
    event.eventType === "rebalance_review" &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    typeof event.targetWeight === "number" &&
    typeof event.endingWeight === "number" &&
    typeof event.currentValue === "number" &&
    typeof event.targetValue === "number" &&
    typeof event.deltaValue === "number" &&
    typeof event.driftPct === "number" &&
    (event.status === "within_band" || event.status === "review" || event.status === "blocked") &&
    typeof event.reason === "string"
  );
}

function isPortfolioTradeReviewEvent(value: unknown): value is PortfolioTradeReviewEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioTradeReviewEvent>;
  return (
    typeof event.timestamp === "string" &&
    event.eventType === "trade_review" &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    (event.side === "buy" || event.side === "sell" || event.side === "hold") &&
    typeof event.notionalValue === "number" &&
    typeof event.targetWeight === "number" &&
    typeof event.endingWeight === "number" &&
    (event.status === "paper_review" || event.status === "blocked" || event.status === "no_action") &&
    typeof event.reason === "string"
  );
}

function isPortfolioPreTradeRiskCheck(value: unknown): value is PortfolioPreTradeRiskCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<PortfolioPreTradeRiskCheck>;
  return (
    typeof check.timestamp === "string" &&
    check.eventType === "pre_trade_risk_check" &&
    (check.scope === "portfolio" || check.scope === "trade") &&
    (check.symbol === null || typeof check.symbol === "string") &&
    (check.sourceRunId === null || typeof check.sourceRunId === "string") &&
    (check.checkId === "portfolio_data_quality" ||
      check.checkId === "trade_review_status" ||
      check.checkId === "trade_notional_limit") &&
    (check.status === "passed" || check.status === "review" || check.status === "blocked") &&
    typeof check.value === "number" &&
    typeof check.limit === "number" &&
    typeof check.reason === "string"
  );
}

function isPortfolioPaperOrderEvent(value: unknown): value is PortfolioPaperOrderEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<PortfolioPaperOrderEvent>;
  return (
    typeof event.timestamp === "string" &&
    event.eventType === "portfolio_paper_order" &&
    typeof event.orderId === "string" &&
    typeof event.symbol === "string" &&
    (event.sourceRunId === null || typeof event.sourceRunId === "string") &&
    (event.side === "buy" || event.side === "sell" || event.side === "hold") &&
    typeof event.notionalValue === "number" &&
    typeof event.quantity === "number" &&
    (event.status === "pending_review" || event.status === "rejected" || event.status === "skipped") &&
    (event.riskStatus === "passed" || event.riskStatus === "review" || event.riskStatus === "blocked") &&
    typeof event.reason === "string"
  );
}

function isPortfolioBacktestLeg(value: unknown): value is PortfolioBacktestLeg {
  if (!value || typeof value !== "object") {
    return false;
  }
  const leg = value as Partial<PortfolioBacktestLeg>;
  return (
    typeof leg.symbol === "string" &&
    typeof leg.targetWeight === "number" &&
    typeof leg.startingValue === "number" &&
    typeof leg.endingValue === "number" &&
    typeof leg.contributionValue === "number" &&
    typeof leg.contributionReturnPct === "number" &&
    typeof leg.maxDrawdownPct === "number" &&
    typeof leg.tradeCount === "number" &&
    isMarketKlineQuality(leg.dataQuality)
  );
}

function isPortfolioCorrelationPair(value: unknown): value is PortfolioCorrelationPair {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pair = value as Partial<PortfolioCorrelationPair>;
  return typeof pair.leftSymbol === "string" && typeof pair.rightSymbol === "string" && typeof pair.correlation === "number";
}

function isPortfolioCovarianceRisk(value: unknown): value is PortfolioCovarianceRisk {
  if (!value || typeof value !== "object") {
    return false;
  }
  const risk = value as Partial<PortfolioCovarianceRisk>;
  return (
    risk.method === "population_covariance" &&
    typeof risk.observations === "number" &&
    typeof risk.periodVolatilityPct === "number" &&
    typeof risk.annualizedVolatilityPct === "number" &&
    Array.isArray(risk.contributions) &&
    risk.contributions.every(isPortfolioCovarianceRiskContribution)
  );
}

function isPortfolioCovarianceRiskContribution(value: unknown): value is PortfolioCovarianceRiskContribution {
  if (!value || typeof value !== "object") {
    return false;
  }
  const contribution = value as Partial<PortfolioCovarianceRiskContribution>;
  return (
    typeof contribution.symbol === "string" &&
    (contribution.sourceRunId === null || typeof contribution.sourceRunId === "string") &&
    typeof contribution.targetWeight === "number" &&
    typeof contribution.annualizedVolatilityPct === "number" &&
    typeof contribution.marginalContributionPct === "number" &&
    typeof contribution.contributionPct === "number"
  );
}

function isMarketSearchPayload(value: unknown): value is Omit<MarketSearchResult, "source" | "error"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketSearchResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.query === "string" &&
    (payload.timeframe === undefined || isTimeframe(payload.timeframe)) &&
    Array.isArray(payload.results) &&
    payload.results.every(isMarketSearchSuggestion)
  );
}

function isMarketSearchSuggestion(value: unknown): value is MarketSearchSuggestion {
  if (!value || typeof value !== "object") {
    return false;
  }
  const suggestion = value as Partial<MarketSearchSuggestion>;
  return (
    isMarket(suggestion.market) &&
    typeof suggestion.symbol === "string" &&
    typeof suggestion.name === "string" &&
    typeof suggestion.source === "string" &&
    (suggestion.cache === undefined || isMarketSearchCacheCoverage(suggestion.cache))
  );
}

function isMarketSearchCacheCoverage(value: unknown): value is MarketSearchCacheCoverage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const cache = value as Partial<MarketSearchCacheCoverage>;
  return (
    (cache.freshness === "fresh" || cache.freshness === "stale" || cache.freshness === "empty") &&
    typeof cache.rowCount === "number" &&
    (cache.ageHours === null || typeof cache.ageHours === "number") &&
    (cache.startTimestamp === null || typeof cache.startTimestamp === "string") &&
    (cache.endTimestamp === null || typeof cache.endTimestamp === "string")
  );
}

function isResearchRunAudit(value: unknown): value is ResearchRunAudit {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<ResearchRunAudit>;
  return (
    Boolean(run.runId) &&
    Boolean(run.createdAt) &&
    Boolean(run.market) &&
    Boolean(run.symbol) &&
    isTimeframe(run.timeframe) &&
    Boolean(run.strategyName) &&
    Boolean(run.strategyRevision) &&
    typeof run.dataRows === "number" &&
    Boolean(run.metrics) &&
    Array.isArray(run.decisions) &&
    Boolean(run.executionMode) &&
    (run.aiReport === undefined || isResearchRunAiReport(run.aiReport)) &&
    (run.dataQuality === undefined || isResearchRunDataQuality(run.dataQuality)) &&
    (run.dataSnapshot === undefined || isResearchRunDataSnapshot(run.dataSnapshot)) &&
    (run.researchNote === undefined || isResearchRunNote(run.researchNote)) &&
    (run.strategyConfig === undefined || isResearchRunStrategyConfig(run.strategyConfig)) &&
    (run.backtestAssumptions === undefined || isBacktestAssumptions(run.backtestAssumptions)) &&
    (run.backtestTrades === undefined ||
      (Array.isArray(run.backtestTrades) && run.backtestTrades.every(isBacktestTradeRow))) &&
    (run.backtestEquityCurve === undefined ||
      (Array.isArray(run.backtestEquityCurve) && run.backtestEquityCurve.every(isBacktestEquityPoint))) &&
    (run.backtestDiagnostics === undefined ||
      (Array.isArray(run.backtestDiagnostics) && run.backtestDiagnostics.every(isBacktestDiagnostic)))
  );
}

function isResearchRunNote(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Record<string, unknown>;
  return (
    isMarket(note.market) &&
    typeof note.symbol === "string" &&
    isTimeframe(note.timeframe) &&
    typeof note.body === "string" &&
    (note.updatedAt === null || typeof note.updatedAt === "string")
  );
}

function isResearchRunDataSnapshot(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const snapshot = value as Record<string, unknown>;
  return (
    (snapshot.hashVersion === undefined || snapshot.hashVersion === "aiqt-data-v2") &&
    typeof snapshot.source === "string" &&
    typeof snapshot.isComplete === "boolean" &&
    Array.isArray(snapshot.warnings) &&
    snapshot.warnings.every((warning) => typeof warning === "string") &&
    typeof snapshot.rows === "number" &&
    (snapshot.start === null || typeof snapshot.start === "string") &&
    (snapshot.end === null || typeof snapshot.end === "string") &&
    typeof snapshot.hash === "string" &&
    Array.isArray(snapshot.bars) &&
    snapshot.bars.every(isMarketKlineBar) &&
    (snapshot.preparationEvidence === undefined ||
      isResearchRunDataPreparationEvidence(snapshot.preparationEvidence))
  );
}

function isResearchRunDataPreparationEvidence(value: unknown): value is ResearchRunDataPreparationEvidence {
  if (!value || typeof value !== "object") {
    return false;
  }
  const evidence = value as Partial<ResearchRunDataPreparationEvidence>;
  return (
    evidence.kind === "watchlist_cache_refresh" &&
    typeof evidence.runId === "string" &&
    (evidence.createdAt === null || typeof evidence.createdAt === "string") &&
    isOptionalStringOrNull(evidence.overrideAuditEventId) &&
    isMarket(evidence.market) &&
    typeof evidence.symbol === "string" &&
    typeof evidence.name === "string" &&
    isTimeframe(evidence.timeframe) &&
    typeof evidence.status === "string" &&
    typeof evidence.requestedLimit === "number" &&
    typeof evidence.upsertedRows === "number" &&
    isResearchRunDataQuality(evidence.quality) &&
    (evidence.error === null || typeof evidence.error === "string")
  );
}

function isResearchRunAiReport(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const report = value as Record<string, unknown>;
  return (
    typeof report.summary === "string" &&
    Array.isArray(report.risks) &&
    report.risks.every((risk) => typeof risk === "string") &&
    Array.isArray(report.improvements) &&
    report.improvements.every((improvement) => typeof improvement === "string") &&
    typeof report.disclaimer === "string"
  );
}

function isResearchRunStrategyConfig(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const config = value as Record<string, unknown>;
  return (
    typeof config.name === "string" &&
    typeof config.revision === "string" &&
    isMarket(config.market) &&
    Array.isArray(config.symbols) &&
    config.symbols.every((symbol) => typeof symbol === "string") &&
    isTimeframe(config.timeframe) &&
    typeof config.version === "number" &&
    Array.isArray(config.entryConditions) &&
    config.entryConditions.every(isResearchRunStrategyCondition) &&
    Array.isArray(config.exitConditions) &&
    config.exitConditions.every(isResearchRunStrategyCondition) &&
    isResearchRunStrategyRisk(config.risk)
  );
}

function isResearchRunStrategyCondition(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const condition = value as Record<string, unknown>;
  return typeof condition.kind === "string" && isPlainRecord(condition.params);
}

function isResearchRunStrategyRisk(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const risk = value as Record<string, unknown>;
  return (
    isNullableNumber(risk.positionPct) &&
    isNullableNumber(risk.stopLossPct) &&
    isNullableNumber(risk.takeProfitPct) &&
    isNullableNumber(risk.maxDrawdownPct)
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNullableNumber(value: unknown): boolean {
  return value === null || typeof value === "number";
}

function isResearchRunDataQuality(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const quality = value as Record<string, unknown>;
  return (
    typeof quality.source === "string" &&
    typeof quality.isComplete === "boolean" &&
    Array.isArray(quality.warnings) &&
    quality.warnings.every((warning) => typeof warning === "string") &&
    typeof quality.rows === "number"
  );
}

function isBacktestDiagnostic(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const diagnostic = value as Record<string, unknown>;
  return (
    typeof diagnostic.id === "string" &&
    typeof diagnostic.label === "string" &&
    typeof diagnostic.value === "string" &&
    typeof diagnostic.detail === "string" &&
    (diagnostic.tone === "positive" ||
      diagnostic.tone === "warning" ||
      diagnostic.tone === "neutral" ||
      diagnostic.tone === "risk")
  );
}

function isBacktestEquityPoint(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Record<string, unknown>;
  return typeof point.timestamp === "string" && typeof point.equity === "number";
}

function isBacktestTradeRow(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.timestamp === "string" &&
    typeof row.symbol === "string" &&
    (row.side === "BUY" || row.side === "SELL" || row.side === "RISK" || row.side === "HOLD") &&
    (row.status === "filled" || row.status === "open" || row.status === "review" || row.status === "blocked") &&
    typeof row.price === "string" &&
    typeof row.quantity === "string" &&
    typeof row.exposure === "string" &&
    typeof row.pnl === "string" &&
    typeof row.reason === "string" &&
    (row.tone === "positive" || row.tone === "warning" || row.tone === "neutral" || row.tone === "risk")
  );
}

function isBacktestAssumptions(value: unknown): value is BacktestAssumptions {
  if (!value || typeof value !== "object") {
    return false;
  }
  const assumptions = value as Partial<BacktestAssumptions>;
  return (
    typeof assumptions.initialCash === "number" &&
    typeof assumptions.feeBps === "number" &&
    typeof assumptions.slippageBps === "number"
  );
}

function isMarket(value: unknown): value is Market {
  return value === "ashare" || value === "us" || value === "crypto";
}

function isTerminalWorkspace(value: unknown): value is TerminalWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<TerminalWorkspace>;
  return (
    workspace.schemaVersion === 1 &&
    Boolean(workspace.selectedInstrument?.symbol) &&
    isTimeframe(workspace.selectedTimeframe) &&
    Array.isArray(workspace.watchlist) &&
    Array.isArray(workspace.quantLoop) &&
    Array.isArray(workspace.modules) &&
    Array.isArray(workspace.panels) &&
    Array.isArray(workspace.agents) &&
    Boolean(workspace.execution) &&
    Array.isArray(workspace.execution?.gates) &&
    Boolean(workspace.strategy) &&
    Array.isArray(workspace.metrics) &&
    Array.isArray(workspace.decisionLog) &&
    Array.isArray(workspace.workflowNodes)
  );
}

function isWatchlistPayload(value: unknown): value is Pick<WatchlistSaveResult, "watchlist"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<WatchlistSaveResult>;
  return Array.isArray(payload.watchlist) && payload.watchlist.every(isWatchlistInstrument);
}

function isWatchlistInstrument(value: unknown): value is TerminalWorkspace["watchlist"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const instrument = value as Partial<TerminalWorkspace["watchlist"][number]>;
  return (
    (instrument.market === "ashare" || instrument.market === "us" || instrument.market === "crypto") &&
    typeof instrument.symbol === "string" &&
    instrument.symbol.length > 0 &&
    typeof instrument.name === "string" &&
    typeof instrument.changePct === "number"
  );
}

function isResearchWorkspaceStatePayload(value: unknown): value is Pick<ResearchWorkspaceStateSaveResult, "state"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<ResearchWorkspaceStateSaveResult>;
  return payload.state === undefined || isResearchWorkspaceState(payload.state);
}

function isResearchWorkspaceState(value: unknown): value is ResearchWorkspaceState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const state = value as Partial<ResearchWorkspaceState>;
  return (
    isMarket(state.market) &&
    typeof state.symbol === "string" &&
    state.symbol.length > 0 &&
    typeof state.name === "string" &&
    isTimeframe(state.timeframe) &&
    (state.workspaceId === "market" || state.workspaceId === "research") &&
    (state.updatedAt === undefined || typeof state.updatedAt === "string")
  );
}

function isTimeframe(value: unknown): value is Timeframe {
  return (
    value === "1d" ||
    value === "1m" ||
    value === "5m" ||
    value === "15m" ||
    value === "30m" ||
    value === "60m"
  );
}
