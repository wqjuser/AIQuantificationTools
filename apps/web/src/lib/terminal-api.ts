import {
  buildTerminalWorkspace,
  buildAuditEvidenceReportMarkdown,
  buildBacktestReportMarkdown,
  buildBacktestRunComparisonMatrixRows,
  buildStrategyExperimentEvidenceSummary,
  buildPortfolioBacktestDiagnosticRows,
  buildP0CurrentGapActionUrlSearch,
  isExecutableP0CurrentGapActionId,
  normalizeP0CurrentGapActionId,
  resolveBacktestAssumptions,
  workspaceFromResearchRunAudit,
  workspaceWithPrimaryWorkflows,
  Market,
  type MarketDataRefreshGuard,
  type OperatorRunbookSummary,
  ResearchRunAudit,
  TerminalWorkspace,
  type AiReviewEvidenceAnchor,
  type AiReviewRunRecord,
  type AuditEvidenceSummary,
  type BacktestAssumptions,
  type ExecutionAdapterPreLiveRunbookSummary,
  type P0AcceptanceSummary,
  type P0AcceptanceSummarySource,
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
  type StrategyExperimentDetail,
  type StrategySnapshot
} from "./terminal-workbench";
import {
  isAiReviewDecision,
  isAiReviewDecisionChain,
  isAiReviewRunArchiveRecord,
  type AiReviewDecision,
  type AiReviewRunArchiveRecord,
  type AuthoritativeAiReviewRun,
  type LegacyAiReviewHistoryRecord
} from "./ai-review-stage3";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  resolveRequestOptions,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isAuditEventRecord,
  hasExactObjectKeys,
  isCoreErrorPayload,
  isMarket,
  isPlainRecord,
  isSecretFreeRecord,
  isTimeframe,
  type MarketAiSelectionResearchOrigin,
  type MarketKlineBar,
  type AuditEventRecord,
  type TerminalResearchParams
} from "./terminal-api-contract";

import {
  type ResearchTimeframe,
  type WorkspaceLoadResult,
  type WorkspaceSource
} from "./workspace-transport";

import {
  isResearchRunAudit,
  loadResearchRunDetail
} from "./research-run-transport";

import {
  isPaperExecutionRecord,
  isPromotionCandidateRecord,
  type PaperExecutionRecord,
  type PromotionCandidateRecord
} from "./paper-execution-transport";

import {
  isAiReviewDecisionArchiveEnvelope,
  isAiReviewRunRecordEnvelope,
  isAiReviewRunV2ArchiveEnvelope,
  type AiReviewDecisionArchiveEnvelope,
  type AiReviewRunRecordEnvelope,
  type AiReviewRunV2ArchiveEnvelope
} from "./ai-review-run-transport";

import { isHandoffNote, type HandoffNote } from "./handoff-note-transport";

export {
  buildApiUrl,
  coreErrorDetail,
  type WorkspaceFetcher,
  type WorkspaceResponse
} from "./terminal-api-http";

export type {
  AuditEventRecord,
  MarketAiSelectionResearchOrigin,
  MarketKlineBar,
  PaperExecutionAccount,
  TerminalResearchParams
} from "./terminal-api-contract";

export {
  buildResearchWorkspaceStateUrl,
  buildWatchlistUrl,
  buildWorkspaceUrl,
  defaultQuantCoreBaseUrl,
  loadTerminalWorkspace,
  resolveQuantCoreBaseUrl,
  saveResearchWorkspaceState,
  saveWatchlist
} from "./workspace-transport";

export {
  buildResearchRunDetailUrl,
  buildResearchRunProductionStrategyHandoffUrl,
  buildResearchRunsUrl,
  buildResearchRunUrl,
  loadResearchRunDetail,
  loadResearchRunHistory,
  loadResearchRunProductionStrategyHandoff,
  runTerminalResearch
} from "./research-run-transport";

export type {
  ResearchRunDetailResult,
  ResearchRunHistoryResult
} from "./research-run-transport";

export {
  buildResearchRunPaperExecutionsUrl,
  buildResearchRunPromotionUrl,
  loadLatestResearchRunPaperExecution,
  loadResearchRunPaperExecutions,
  loadResearchRunPromotion,
  submitResearchRunPaperExecution
} from "./paper-execution-transport";

export type {
  PaperExecutionGate,
  PaperExecutionHistoryResult,
  PaperExecutionOrder,
  PaperExecutionRecord,
  PaperExecutionResult,
  PromotionCandidateEvidence,
  PromotionCandidateRecord,
  PromotionCandidateResult
} from "./paper-execution-transport";

export {
  buildHandoffNotesUrl,
  loadHandoffNotes,
  saveHandoffNote
} from "./handoff-note-transport";

export type {
  HandoffNote,
  HandoffNoteSaveParams,
  HandoffNoteSubjectType,
  HandoffNotesResult
} from "./handoff-note-transport";

export {
  buildResearchRunAiReviewsUrl,
  loadResearchRunAiReviews,
  saveAiReviewRunRecord
} from "./ai-review-run-transport";

export type {
  AiReviewDecisionArchiveEnvelope,
  AiReviewRunHistoryPagination,
  AiReviewRunHistoryParams,
  AiReviewRunHistoryResult,
  AiReviewRunRecordEnvelope,
  AiReviewRunRecordResult,
  AiReviewRunV2ArchiveEnvelope
} from "./ai-review-run-transport";

export * from "./p0-research-transport";

export type {
  ResearchTimeframe,
  ResearchWorkspaceState,
  ResearchWorkspaceStateSaveResult,
  WatchlistSaveResult,
  WorkspaceLoadResult,
  WorkspaceSource
} from "./workspace-transport";

export * from "./release-acceptance-transport";

export * from "./execution-adapter-ledger-transport";

export * from "./golden-path-transport";

export * from "./execution-adapter-certification-transport";

export * from "./execution-adapter-secret-runtime-transport";

export * from "./execution-adapter-orchestration-transport";

export * from "./execution-adapter-probe-transport";

export * from "./execution-adapter-paper-validation-transport";

import {
  isExecutionAdapterPaperExecutionResult,
  type ExecutionAdapterPaperExecutionResult
} from "./execution-adapter-paper-validation-transport";

import {
  loadAiReviewDecisions,
  loadAuthoritativeAiReview,
  loadAuthoritativeAiReviews
} from "./ai-review-transport";

export * from "./ai-review-transport";

import { loadResearchNote, type ResearchNote } from "./research-ai-transport";

export * from "./research-ai-transport";

export {
  buildMarketAiSelectionReviewsUrl,
  buildMarketAiSelectionStatisticsUrl,
  buildMarketAiSelectionsUrl,
  createMarketAiSelection,
  createMarketAiSelectionReview,
  loadMarketAiSelectionQualityStatistics
} from "./market-ai-selection";

export type {
  MarketAiSelectionCandidate,
  MarketAiSelectionDiscovery,
  MarketAiSelectionHorizon,
  MarketAiSelectionLoadResult,
  MarketAiSelectionProfile,
  MarketAiSelectionQualityStatistics,
  MarketAiSelectionQualityStatisticsLoadResult,
  MarketAiSelectionRecommendation,
  MarketAiSelectionRequest,
  MarketAiSelectionResult,
  MarketAiSelectionReview,
  MarketAiSelectionReviewCompletedItem,
  MarketAiSelectionReviewInsufficientItem,
  MarketAiSelectionReviewItem,
  MarketAiSelectionReviewLoadResult,
  MarketAiSelectionReviewObservingItem,
  MarketAiSelectionReviewRequest
} from "./market-ai-selection";

export * from "./market-exploration";

export {
  buildCacheRefreshUrl,
  buildLoadingMarketKlinesResult,
  buildMarketCalendarUrl,
  buildMarketDataReadinessUrl,
  buildMarketKlinesUrl,
  buildWatchlistCacheRefreshUrl,
  loadMarketCalendarStatus,
  loadMarketDataReadiness,
  loadMarketKlines,
  loadWatchlistCacheRefreshRuns,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  refreshMarketCache,
  refreshMarketCacheBatch,
  refreshWatchlistCacheRun
} from "./market-data-transport";

export type {
  CacheBatchRefreshResult,
  CacheRefreshParams,
  CacheRefreshResult,
  CacheRefreshSummary,
  CacheWatchlistRefreshHistoryResult,
  CacheWatchlistRefreshItem,
  CacheWatchlistRefreshItemStatus,
  CacheWatchlistRefreshParams,
  CacheWatchlistRefreshResult,
  CacheWatchlistRefreshRun,
  CacheWatchlistRefreshRunSummary,
  MarketCalendarResult,
  MarketCalendarStatus,
  MarketCalendarStatusValue,
  MarketDataReadiness,
  MarketDataReadinessCacheState,
  MarketDataReadinessProviderHealthState,
  MarketDataReadinessRepairAction,
  MarketDataReadinessResult,
  MarketDataReadinessState,
  MarketKlineQuality,
  MarketKlinesParams,
  MarketKlinesResult
} from "./market-data-transport";

import {
  isAuditReportSignaturePayload,
  type AuditReportSignatureResult
} from "./audit-event-transport";

export {
  buildAuditEventsUrl,
  buildAuditReportRevokeUrl,
  buildAuditReportSignUrl,
  buildAuditReportVerifyUrl,
  loadAuditEvents,
  revokeAuditReportEvent,
  saveAuditEvent,
  signAuditReportEvent,
  verifyAuditReportEvent
} from "./audit-event-transport";

export type {
  AuditEventHistoryPagination,
  AuditEventHistoryParams,
  AuditEventHistoryResult,
  AuditEventResult,
  AuditReportSignatureResult,
  AuditReportSignatureVerification
} from "./audit-event-transport";

import type {
  AuditSigningKeyRotationApply,
  AuditSigningKeyRotationPlan
} from "./audit-signing-key-transport";

export * from "./audit-signing-key-transport";

import {
  isPortfolioPaperOrderApproval,
  isPortfolioPaperOrderBatch,
  isPortfolioPaperOrderSimulation,
  type PortfolioBacktestRun,
  type PortfolioPaperOrderApproval,
  type PortfolioPaperOrderBatch,
  type PortfolioPaperOrderSimulation
} from "./portfolio-transport";

export * from "./portfolio-transport";

export {
  buildMonitoringTestNotificationsUrl,
  buildOpenAiCompatibleModelsUrl,
  buildSettingsConfigurationUrl,
  buildSettingsDependencyInstallUrl,
  buildSettingsStatusUrl,
  installPlatformDataDependency,
  loadOpenAiCompatibleModels,
  loadPlatformSettings,
  savePlatformSettings,
  testMonitoringWebhook
} from "./platform-settings";

export type {
  InstallablePlatformDataDependency,
  MonitoringTestNotification,
  MonitoringTestNotificationResult,
  OpenAiCompatibleModelsResult,
  PlatformSettingsCacheContext,
  PlatformSettingsCacheFreshnessSummary,
  PlatformSettingsCacheStatus,
  PlatformSettingsConfiguration,
  PlatformSettingsConfigurationValues,
  PlatformSettingsDataSource,
  PlatformSettingsExecutionAdapter,
  PlatformSettingsFundamentalDataSource,
  PlatformSettingsMarketDataAdapter,
  PlatformSettingsMarketDataAdapterCacheDiagnostics,
  PlatformSettingsMarketDataAdapterExternalTelemetry,
  PlatformSettingsMarketDataAdapterInstallGuidance,
  PlatformSettingsMarketDataAdapterProviderError,
  PlatformSettingsMarketDataAdapterProviderErrorCategory,
  PlatformSettingsMarketDataAdapterProviderErrorCategorySummary,
  PlatformSettingsMarketDataAdapterProviderHealth,
  PlatformSettingsMarketDataAdapterProviderHealthWindow,
  PlatformSettingsMarketDataAdapterProviderHealthWindowSummary,
  PlatformSettingsResult,
  PlatformSettingsSecretName,
  PlatformSettingsStatus,
  PlatformSettingsStatusTone,
  PlatformSettingsUpdateRequest
} from "./platform-settings";

import {
  loadStrategyLibrary,
  type StrategyLibraryItem
} from "./strategy-transport";

export {
  buildStrategiesUrl,
  buildStrategyDetailUrl,
  buildStrategyExperimentDetailUrl,
  buildStrategyExperimentsUrl,
  buildStrategyValidationUrl,
  createStrategyExperiment,
  deleteStrategyVersion,
  isStrategyProductionBindingPayload,
  loadStrategyDetail,
  loadStrategyExperimentDetail,
  loadStrategyExperiments,
  loadStrategyLibrary,
  loadStrategyProductionBinding,
  saveStrategySnapshot,
  updateStrategyProductionBinding,
  validateStrategySnapshot
} from "./strategy-transport";

export type {
  ProductionStrategyHandoff,
  ProductionStrategyHandoffResult,
  StrategyDeleteResult,
  StrategyExperimentCreateRequest,
  StrategyExperimentDetailResult,
  StrategyExperimentHistoryParams,
  StrategyExperimentHistoryResult,
  StrategyExperimentMutationResult,
  StrategyLibraryConfig,
  StrategyLibraryItem,
  StrategyLibraryResult,
  StrategyLibraryStatus,
  StrategyProductionBinding,
  StrategyProductionBindingResult,
  StrategySaveParams,
  StrategySaveResult,
  StrategyValidation,
  StrategyValidationResult
} from "./strategy-transport";

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
  liveBlockedBoundary?: boolean;
  liveOrderSubmitted?: boolean;
  orderSubmissionAllowed?: boolean;
  orderSubmissionEnabled?: boolean;
  orderSubmitted?: boolean;
  route?: string;
  routeExecuted?: boolean;
  routeMode?: string;
  executionRoute?: string;
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
  aiReviewRunsV2?: AiReviewRunV2ArchiveEnvelope[];
  aiReviewDecisions?: AiReviewDecisionArchiveEnvelope[];
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

export interface AiReviewArchiveImportSnapshot {
  authoritativeAiReviewRecords: AuthoritativeAiReviewRun[];
  aiReviewDecisions: AiReviewDecision[];
  legacyAiReviewIds: string[];
  readbackErrors: Record<string, string>;
}

export interface AiReviewRunArchiveSnapshotResult {
  runId: string;
  authoritativeAiReviewRecords: AuthoritativeAiReviewRun[];
  aiReviewDecisions: AiReviewDecision[];
  legacyAiReviewRecords: LegacyAiReviewHistoryRecord[];
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

export function buildResearchRunExportUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/export`);
}

export function buildResearchRunImportUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import");
}

export function buildResearchRunImportUndoUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import/undo");
}

export function buildAuditReportVerifyPackageUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/verify-package");
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

export async function loadAiReviewArchiveImportSnapshot(
  baseUrl: string,
  exportPackage: ResearchRunExportPackage,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewArchiveImportSnapshot> {
  const reviewIds = Array.from(new Set((exportPackage.aiReviewRunsV2 ?? []).map((item) => item.aiReviewId)));
  const entries = await Promise.all(reviewIds.map(async (aiReviewId) => {
    const [detail, history] = await Promise.all([
      loadAuthoritativeAiReview(baseUrl, aiReviewId, fetcher),
      loadAuthoritativeAiReviews(baseUrl, { query: aiReviewId, limit: 50, offset: 0 }, fetcher)
    ]);
    const exactLegacyIds = history.legacyReviews
      .filter((review) => review.aiReviewId === aiReviewId)
      .map((review) => review.aiReviewId);
    const exactHistoryReview = history.reviews.find((review) => review.aiReviewId === aiReviewId);
    const errors: Record<string, string> = {};
    if (history.source !== "core") {
      errors["review:" + aiReviewId] = history.error ?? "AI Review authority readback failed";
    } else if (detail.source !== "core" && detail.httpStatus !== 404) {
      errors["review:" + aiReviewId] = detail.error ?? "Authoritative Review readback failed";
    } else if (detail.source !== "core" && exactHistoryReview) {
      errors["review:" + aiReviewId] = "Authoritative Review detail/history readback mismatch";
    }
    const review = detail.review ?? exactHistoryReview;
    let decisions: AiReviewDecision[] = [];
    if (review && !errors["review:" + aiReviewId]) {
      const decisionHistory = await loadAiReviewDecisions(baseUrl, aiReviewId, fetcher);
      if (decisionHistory.source === "core") {
        decisions = decisionHistory.decisions;
      } else {
        errors["decisions:" + aiReviewId] =
          decisionHistory.error ?? "AI Review Decision readback failed";
      }
    } else if (errors["review:" + aiReviewId]) {
      errors["decisions:" + aiReviewId] = errors["review:" + aiReviewId];
    }
    return {
      decisions,
      errors,
      legacyAiReviewIds: exactLegacyIds,
      review
    };
  }));
  return {
    authoritativeAiReviewRecords: entries
      .map((entry) => entry.review)
      .filter((review): review is AuthoritativeAiReviewRun => Boolean(review)),
    aiReviewDecisions: entries.flatMap((entry) => entry.decisions),
    legacyAiReviewIds: Array.from(new Set(entries.flatMap((entry) => entry.legacyAiReviewIds))),
    readbackErrors: Object.assign({}, ...entries.map((entry) => entry.errors))
  };
}

export async function loadAiReviewRunArchiveSnapshot(
  baseUrl: string,
  runId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewRunArchiveSnapshotResult> {
  const normalizedRunId = runId.trim();
  if (!normalizedRunId) {
    return {
      runId: normalizedRunId,
      authoritativeAiReviewRecords: [],
      aiReviewDecisions: [],
      legacyAiReviewRecords: [],
      source: "fallback",
      error: "Invalid AI Review archive run ID"
    };
  }
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  const fallback = (error: string): AiReviewRunArchiveSnapshotResult => ({
    runId: normalizedRunId,
    authoritativeAiReviewRecords: [],
    aiReviewDecisions: [],
    legacyAiReviewRecords: [],
    source: "fallback",
    error
  });
  const authoritativeAiReviewRecords: AuthoritativeAiReviewRun[] = [];
  const legacyAiReviewRecords: LegacyAiReviewHistoryRecord[] = [];
  const seenAiReviewIds = new Set<string>();
  let offset = 0;
  let expectedTotal: number | null = null;
  while (expectedTotal === null || offset < expectedTotal) {
    const page = await loadAuthoritativeAiReviews(
      baseUrl,
      { runId: normalizedRunId, limit: 50, offset },
      signal,
      fetcher
    );
    if (page.source !== "core" || !page.pagination) {
      return fallback(page.error ?? "AI Review archive history readback failed");
    }
    if (page.pagination.limit !== 50
      || page.pagination.offset !== offset
      || page.pagination.query !== ""
      || (expectedTotal !== null && page.pagination.total !== expectedTotal)) {
      return fallback("Inconsistent AI Review archive pagination");
    }
    expectedTotal ??= page.pagination.total;
    const pageRecords = [...page.reviews, ...page.legacyReviews];
    if (pageRecords.length > page.pagination.limit
      || offset + pageRecords.length > expectedTotal
      || (offset + pageRecords.length < expectedTotal && pageRecords.length !== page.pagination.limit)) {
      return fallback("Incomplete AI Review archive pagination");
    }
    for (const review of page.reviews) {
      if (review.primaryExperiment.sourceRunId !== normalizedRunId || seenAiReviewIds.has(review.aiReviewId)) {
        return fallback("Invalid AI Review archive run binding or duplicate Review ID");
      }
      seenAiReviewIds.add(review.aiReviewId);
    }
    for (const review of page.legacyReviews) {
      if (review.runId !== normalizedRunId || seenAiReviewIds.has(review.aiReviewId)) {
        return fallback("Invalid AI Review archive run binding or duplicate Review ID");
      }
      seenAiReviewIds.add(review.aiReviewId);
    }
    authoritativeAiReviewRecords.push(...page.reviews);
    legacyAiReviewRecords.push(...page.legacyReviews);
    if (offset + pageRecords.length === expectedTotal) {
      break;
    }
    offset += page.pagination.limit;
  }
  const decisionResults = await Promise.all(
    authoritativeAiReviewRecords.map((review) =>
      loadAiReviewDecisions(baseUrl, review.aiReviewId, signal, fetcher)
    )
  );
  const failedDecisionReadback = decisionResults.find((result) => result.source !== "core");
  if (failedDecisionReadback) {
    return fallback(failedDecisionReadback.error ?? "AI Review Decision archive readback failed");
  }
  return {
    runId: normalizedRunId,
    authoritativeAiReviewRecords,
    aiReviewDecisions: decisionResults.flatMap((result) => result.decisions),
    legacyAiReviewRecords,
    source: "core"
  };
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
    (exportPackage.aiReviewRunsV2 === undefined ||
      (Array.isArray(exportPackage.aiReviewRunsV2) &&
        exportPackage.aiReviewRunsV2.every((item) =>
          isAiReviewRunV2ArchiveEnvelope(item, exportPackage.manifest?.runId)
        ))) &&
    (exportPackage.aiReviewDecisions === undefined ||
      (Array.isArray(exportPackage.aiReviewDecisions) &&
        exportPackage.aiReviewDecisions.every(isAiReviewDecisionArchiveEnvelope))) &&
    isAiReviewStage3ArchiveBindingValid(exportPackage) &&
    isResearchRunExportPaperBoundary(exportPackage) &&
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
    (counts?.aiReviewRunsV2 === undefined || typeof counts.aiReviewRunsV2 === "number") &&
    (counts?.aiReviewDecisions === undefined || typeof counts.aiReviewDecisions === "number") &&
    (counts?.auditEvents === undefined || typeof counts.auditEvents === "number") &&
    (counts?.stage4PortfolioWorkflows === undefined ||
      (Number.isInteger(counts.stage4PortfolioWorkflows) && counts.stage4PortfolioWorkflows >= 0)) &&
    (counts?.stage5ShadowSessions === undefined ||
      (Number.isInteger(counts.stage5ShadowSessions) && counts.stage5ShadowSessions >= 0)) &&
    (counts?.handoffNotes === undefined || typeof counts.handoffNotes === "number")
  );
}

function isAiReviewStage3ArchiveBindingValid(
  exportPackage: Partial<ResearchRunExportPackage>
): boolean {
  const reviews = exportPackage.aiReviewRunsV2;
  const decisions = exportPackage.aiReviewDecisions;
  const counts = exportPackage.manifest?.artifactCounts;
  const hasReviews = reviews !== undefined || counts?.aiReviewRunsV2 !== undefined;
  const hasDecisions = decisions !== undefined || counts?.aiReviewDecisions !== undefined;
  if ((hasReviews && (!Array.isArray(reviews) || counts?.aiReviewRunsV2 !== reviews.length))
    || (hasDecisions && (!Array.isArray(decisions) || counts?.aiReviewDecisions !== decisions.length))) {
    return false;
  }
  if (!reviews && !decisions) {
    return true;
  }
  const reviewRecords = reviews?.map((item) => item.record) ?? [];
  const legacyReviewIds = exportPackage.aiReviewRuns?.map((item) => item.aiReviewId) ?? [];
  if (new Set(legacyReviewIds).size !== legacyReviewIds.length
    || reviewRecords.some((review) => legacyReviewIds.includes(review.aiReviewId))) {
    return false;
  }
  if (new Set(reviewRecords.map((review) => review.aiReviewId)).size !== reviewRecords.length) {
    return false;
  }
  const reviewById = new Map(reviewRecords.map((review) => [review.aiReviewId, review]));
  const decisionRecords = decisions?.map((item) => item.record) ?? [];
  if (new Set(decisionRecords.map((decision) => decision.decisionId)).size !== decisionRecords.length) {
    return false;
  }
  const groupedDecisions = new Map<string, AiReviewDecision[]>();
  for (const decision of decisionRecords) {
    const review = reviewById.get(decision.aiReviewId);
    if (!review
      || decision.reviewRecordHash !== review.recordHash
      || decision.evidenceHash !== review.evidenceHash) {
      return false;
    }
    groupedDecisions.set(decision.aiReviewId, [...(groupedDecisions.get(decision.aiReviewId) ?? []), decision]);
  }
  return [...groupedDecisions.values()].every(isAiReviewDecisionChain);
}

function isResearchRunExportPaperBoundary(
  exportPackage: Partial<ResearchRunExportPackage>
): boolean {
  const manifest = exportPackage.manifest;
  const researchRun = exportPackage.researchRun;
  const handoff = exportPackage.executionHandoff;
  if (!manifest || !researchRun || !handoff
    || manifest.executionMode !== "paper_only"
    || researchRun.executionMode !== "paper_only"
    || handoff.mode !== "paper_only"
    || manifest.paperOnly !== true
    || manifest.liveBlockedBoundary !== true
    || manifest.orderSubmissionEnabled !== false
    || manifest.liveOrderSubmitted !== false
    || manifest.routeExecuted !== false
    || manifest.liveTradingAllowed !== false
    || handoff.paperOnly !== true
    || handoff.liveTradingAllowed !== false) {
    return false;
  }
  const records = [
    manifest as unknown as Record<string, unknown>,
    researchRun as unknown as Record<string, unknown>,
    handoff as unknown as Record<string, unknown>
  ];
  const falseOnlyFields = [
    "orderSubmissionEnabled",
    "orderSubmissionAllowed",
    "orderSubmitted",
    "liveTradingAllowed",
    "liveOrderSubmitted",
    "routeExecuted"
  ];
  const allowedRoutes = new Set(["paper", "paper_only", "blocked"]);
  return records.every((record) =>
      falseOnlyFields.every((field) => !(field in record) || record[field] === false)
      && ["route", "routeMode", "executionRoute"].every((field) =>
        !(field in record)
        || (typeof record[field] === "string" && allowedRoutes.has((record[field] as string).trim()))
      )
      && (!("paperOnly" in record) || record.paperOnly === true)
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
