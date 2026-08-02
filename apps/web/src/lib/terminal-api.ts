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

import {
  isResearchRunExportPayload,
  isResearchRunExportPackage,
  isResearchRunExportReportSignature,
  type ResearchRunExecutionHandoff,
  type ResearchRunExportAuditEvidenceSummary,
  type ResearchRunExportAuditReport,
  type ResearchRunExportBacktestReport,
  type ResearchRunExportPackage,
  type ResearchRunExportReportSignature
} from "./research-run-export-contract";

import { sanitizeDownloadFileName, sha256TextHex } from "./research-run-report-artifacts";

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

export { normalizeResearchRunExportPackagePayload } from "./research-run-export-contract";

export type {
  ResearchRunExecutionGateExport,
  ResearchRunExecutionHandoff,
  ResearchRunExportAuditEvidenceSummary,
  ResearchRunExportAuditReport,
  ResearchRunExportBacktestReport,
  ResearchRunExportIntegrity,
  ResearchRunExportManifest,
  ResearchRunExportP0PackageCompleteness,
  ResearchRunExportP0PackageCriterion,
  ResearchRunExportPackage,
  ResearchRunExportReportSignature
} from "./research-run-export-contract";

export * from "./research-run-export-transport";

export {
  buildAuditEvidenceReportAuditEvent,
  buildAuditReportVerifyPackageUrl,
  buildBacktestReportAuditEvent,
  buildPortfolioBacktestReportAuditEvent,
  buildResearchRunExportAuditEvidenceSummary,
  buildResearchRunExportAuditReport,
  buildResearchRunExportBacktestReport,
  verifyResearchRunExportReportSignature,
  withResearchRunExportAuditEvidenceArtifacts,
  withResearchRunExportAuditEvidenceSummary,
  withResearchRunExportReportSignatures,
  withVerifiedResearchRunExportPackageReportSignatures
} from "./research-run-report-artifacts";

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
