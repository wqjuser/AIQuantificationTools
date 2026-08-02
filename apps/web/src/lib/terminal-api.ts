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
  isBacktestAssumptions,
  isCoreErrorPayload,
  isMarket,
  isMarketKlineBar,
  isNumberRecord,
  isOptionalDataQualityContract,
  isPaperExecutionAccount,
  isPlainRecord,
  isSecretFreeRecord,
  isResearchRunStrategyConfig,
  isTimeframe,
  type MarketAiSelectionResearchOrigin,
  type MarketKlineBar,
  type AuditEventRecord,
  type PaperExecutionAccount,
  type TerminalResearchParams
} from "./terminal-api-contract";

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
  buildDesktopReleaseLatestUrl,
  buildP0AcceptanceLatestUrl,
  buildP1AcceptanceLatestUrl,
  buildP2ManifestChainPreflightLatestUrl,
  buildP2ManifestChainPreflightUrl,
  buildP2PaperReplayLatestUrl,
  buildP2PreLiveAcceptanceLatestUrl,
  buildP2ReadinessAcceptanceLatestUrl,
  buildP2ReadinessAcceptanceUrl,
  buildStage1BootstrapPreflightLatestUrl,
  buildStage1BootstrapPreflightUrl,
  buildStage1DailyUseLatestUrl,
  buildStage1DailyUseUrl,
  generateP2ManifestChainPreflight,
  generateP2ReadinessAcceptance,
  generateStage1BootstrapPreflight,
  generateStage1DailyUse,
  loadDesktopReleaseLatest,
  loadP0AcceptanceLatest,
  loadP1AcceptanceLatest,
  loadP2ManifestChainPreflightLatest,
  loadP2PaperReplayLatest,
  loadP2PreLiveAcceptanceLatest,
  loadP2ReadinessAcceptanceLatest,
  loadStage1BootstrapPreflightLatest,
  loadStage1DailyUseLatest
} from "./release-acceptance-transport";

export type {
  DesktopReleaseLatestResult,
  DesktopReleaseManifest,
  DesktopReleaseManifestCheck,
  DesktopReleaseStatus,
  P0AcceptanceLatestResult,
  P0AcceptanceManifest,
  P0AcceptanceManifestCheck,
  P0AcceptanceStatus,
  P1AcceptanceLatestResult,
  P1AcceptanceManifest,
  P1AcceptanceManifestCheck,
  P1AcceptanceManifestWatchlistItem,
  P1AcceptanceStatus,
  P2ManifestChainPreflightGenerateResult,
  P2ManifestChainPreflightLatestResult,
  P2ManifestChainPreflightManifest,
  P2ManifestChainPreflightStatus,
  P2PaperReplayLatestResult,
  P2PaperReplayManifest,
  P2PaperReplayManifestCheck,
  P2PaperReplayMetrics,
  P2PaperReplayStatus,
  P2PreLiveAcceptanceLatestResult,
  P2PreLiveAcceptanceManifest,
  P2PreLiveAcceptanceManifestCheck,
  P2PreLiveAcceptanceStatus,
  P2ReadinessAcceptanceGenerateResult,
  P2ReadinessAcceptanceLatestResult,
  P2ReadinessAcceptanceManifest,
  P2ReadinessAcceptanceManifestCheck,
  P2ReadinessAcceptanceManifestPaths,
  P2ReadinessAcceptanceReadbackStatus,
  Stage1BootstrapPreflight,
  Stage1BootstrapPreflightCheck,
  Stage1BootstrapPreflightCheckStatus,
  Stage1BootstrapPreflightGenerateResult,
  Stage1BootstrapPreflightLatestResult,
  Stage1BootstrapPreflightSourcePaths,
  Stage1BootstrapPreflightStatus,
  Stage1DailyUseGenerateResult,
  Stage1DailyUseLatestResult,
  Stage1DailyUseReport,
  Stage1DailyUseReportRow,
  Stage1DailyUseReportRowStatus,
  Stage1DailyUseReportSourcePaths,
  Stage1DailyUseReportStatus
} from "./release-acceptance-transport";

export {
  buildExecutionAdapterCertificationAppliesUrl,
  buildExecutionAdapterCertificationApplyUrl,
  buildExecutionAdapterCertificationsUrl,
  buildExecutionAdapterControlledRestartEvidenceHistoryUrl,
  buildExecutionAdapterControlledRestartEvidenceUrl,
  buildExecutionAdapterRestartAcceptanceHistoryUrl,
  buildExecutionAdapterRestartAcceptanceUrl,
  loadExecutionAdapterCertificationApplies,
  loadExecutionAdapterCertifications,
  loadExecutionAdapterControlledRestartEvidence,
  loadExecutionAdapterRestartAcceptances,
  recordExecutionAdapterCertification,
  recordExecutionAdapterCertificationApply,
  recordExecutionAdapterControlledRestartEvidence,
  recordExecutionAdapterRestartAcceptance
} from "./execution-adapter-certification-transport";

export type {
  ExecutionAdapterCertificationApplyConfirmation,
  ExecutionAdapterCertificationApplyConfirmationStatus,
  ExecutionAdapterCertificationApplyHistoryResult,
  ExecutionAdapterCertificationApplyRecordResult,
  ExecutionAdapterCertificationApplyRequest,
  ExecutionAdapterCertificationApplyResult,
  ExecutionAdapterCertificationApplyStatus,
  ExecutionAdapterCertificationCheck,
  ExecutionAdapterCertificationHistoryResult,
  ExecutionAdapterCertificationRecordResult,
  ExecutionAdapterCertificationRequest,
  ExecutionAdapterCertificationRun,
  ExecutionAdapterCertificationStatus,
  ExecutionAdapterCertificationSummary,
  ExecutionAdapterControlledRestartEvidenceConfirmation,
  ExecutionAdapterControlledRestartEvidenceConfirmationStatus,
  ExecutionAdapterControlledRestartEvidenceHistoryResult,
  ExecutionAdapterControlledRestartEvidenceRecordResult,
  ExecutionAdapterControlledRestartEvidenceRequest,
  ExecutionAdapterControlledRestartEvidenceResult,
  ExecutionAdapterControlledRestartEvidenceStatus,
  ExecutionAdapterRestartAcceptanceConfirmation,
  ExecutionAdapterRestartAcceptanceConfirmationStatus,
  ExecutionAdapterRestartAcceptanceHistoryResult,
  ExecutionAdapterRestartAcceptanceRecordResult,
  ExecutionAdapterRestartAcceptanceRequest,
  ExecutionAdapterRestartAcceptanceResult,
  ExecutionAdapterRestartAcceptanceStatus
} from "./execution-adapter-certification-transport";

export {
  buildExecutionAdapterSecretReferenceUrl,
  buildExecutionAdapterSecretMaterializationUrl,
  buildExecutionAdapterSecretManifestValidationUrl,
  buildExecutionAdapterEnvironmentBindingUrl,
  buildExecutionAdapterRuntimeReloadPlanUrl,
  buildExecutionAdapterRuntimeReloadExecutionUrl,
  buildExecutionAdapterRuntimeReloadAcceptanceUrl,
  buildExecutionAdapterSecretReferenceHistoryUrl,
  buildExecutionAdapterSecretMaterializationHistoryUrl,
  buildExecutionAdapterSecretManifestValidationHistoryUrl,
  buildExecutionAdapterEnvironmentBindingHistoryUrl,
  buildExecutionAdapterRuntimeReloadPlanHistoryUrl,
  buildExecutionAdapterRuntimeReloadExecutionHistoryUrl,
  buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl,
  recordExecutionAdapterSecretReference,
  recordExecutionAdapterSecretMaterialization,
  recordExecutionAdapterSecretManifestValidation,
  recordExecutionAdapterEnvironmentBinding,
  recordExecutionAdapterRuntimeReloadPlan,
  recordExecutionAdapterRuntimeReloadExecution,
  recordExecutionAdapterRuntimeReloadAcceptance,
  loadExecutionAdapterSecretReferences,
  loadExecutionAdapterSecretMaterializations,
  loadExecutionAdapterSecretManifestValidations,
  loadExecutionAdapterEnvironmentBindings,
  loadExecutionAdapterRuntimeReloadPlans,
  loadExecutionAdapterRuntimeReloadExecutions,
  loadExecutionAdapterRuntimeReloadAcceptances
} from "./execution-adapter-secret-runtime-transport";

export type {
  ExecutionAdapterSecretReferenceStatus,
  ExecutionAdapterSecretReferenceConfirmationStatus,
  ExecutionAdapterSecretReferenceConfirmation,
  ExecutionAdapterSecretReferenceResult,
  ExecutionAdapterSecretReferenceRequest,
  ExecutionAdapterSecretReferenceRecordResult,
  ExecutionAdapterSecretReferenceHistoryResult,
  ExecutionAdapterSecretMaterializationStatus,
  ExecutionAdapterSecretMaterializationConfirmationStatus,
  ExecutionAdapterSecretMaterializationConfirmation,
  ExecutionAdapterSecretMaterializationResult,
  ExecutionAdapterSecretMaterializationRequest,
  ExecutionAdapterSecretMaterializationRecordResult,
  ExecutionAdapterSecretMaterializationHistoryResult,
  ExecutionAdapterSecretManifestValidationStatus,
  ExecutionAdapterSecretManifestValidationResult,
  ExecutionAdapterSecretManifestValidationRequest,
  ExecutionAdapterSecretManifestValidationRecordResult,
  ExecutionAdapterSecretManifestValidationHistoryResult,
  ExecutionAdapterEnvironmentBindingStatus,
  ExecutionAdapterEnvironmentBindingConfirmationStatus,
  ExecutionAdapterEnvironmentBindingConfirmation,
  ExecutionAdapterEnvironmentBindingResult,
  ExecutionAdapterEnvironmentBindingRequest,
  ExecutionAdapterEnvironmentBindingRecordResult,
  ExecutionAdapterEnvironmentBindingHistoryResult,
  ExecutionAdapterRuntimeReloadPlanStatus,
  ExecutionAdapterRuntimeReloadPlanConfirmationStatus,
  ExecutionAdapterRuntimeReloadPlanConfirmation,
  ExecutionAdapterRuntimeReloadPlanResult,
  ExecutionAdapterRuntimeReloadPlanRequest,
  ExecutionAdapterRuntimeReloadPlanRecordResult,
  ExecutionAdapterRuntimeReloadPlanHistoryResult,
  ExecutionAdapterRuntimeReloadExecutionStatus,
  ExecutionAdapterRuntimeReloadExecutionConfirmationStatus,
  ExecutionAdapterRuntimeReloadExecutionConfirmation,
  ExecutionAdapterRuntimeReloadExecutionResult,
  ExecutionAdapterRuntimeReloadExecutionRequest,
  ExecutionAdapterRuntimeReloadExecutionRecordResult,
  ExecutionAdapterRuntimeReloadExecutionHistoryResult,
  ExecutionAdapterRuntimeReloadAcceptanceStatus,
  ExecutionAdapterRuntimeReloadAcceptanceConfirmationStatus,
  ExecutionAdapterRuntimeReloadAcceptanceConfirmation,
  ExecutionAdapterRuntimeReloadAcceptanceResult,
  ExecutionAdapterRuntimeReloadAcceptanceRequest,
  ExecutionAdapterRuntimeReloadAcceptanceRecordResult,
  ExecutionAdapterRuntimeReloadAcceptanceHistoryResult
} from "./execution-adapter-secret-runtime-transport";

export {
  buildExecutionAdapterOrchestrationDryRunUrl,
  buildExecutionAdapterOrchestrationExecutionUrl,
  buildExecutionAdapterHumanConfirmationUrl,
  buildExecutionAdapterSandboxProbePlanUrl,
  buildExecutionAdapterOrchestrationDryRunHistoryUrl,
  buildExecutionAdapterOrchestrationExecutionHistoryUrl,
  buildExecutionAdapterHumanConfirmationHistoryUrl,
  buildExecutionAdapterSandboxProbePlanHistoryUrl,
  recordExecutionAdapterOrchestrationDryRun,
  recordExecutionAdapterOrchestrationExecution,
  recordExecutionAdapterHumanConfirmation,
  recordExecutionAdapterSandboxProbePlan,
  loadExecutionAdapterOrchestrationDryRuns,
  loadExecutionAdapterOrchestrationExecutions,
  loadExecutionAdapterHumanConfirmations,
  loadExecutionAdapterSandboxProbePlans
} from "./execution-adapter-orchestration-transport";

export type {
  ExecutionAdapterOrchestrationDryRunStatus,
  ExecutionAdapterOrchestrationDryRunConfirmationStatus,
  ExecutionAdapterOrchestrationDryRunConfirmation,
  ExecutionAdapterOrchestrationDryRunResult,
  ExecutionAdapterOrchestrationDryRunRequest,
  ExecutionAdapterOrchestrationDryRunRecordResult,
  ExecutionAdapterOrchestrationDryRunHistoryResult,
  ExecutionAdapterOrchestrationExecutionStatus,
  ExecutionAdapterOrchestrationExecutionConfirmationStatus,
  ExecutionAdapterOrchestrationExecutionConfirmation,
  ExecutionAdapterOrchestrationExecutionResult,
  ExecutionAdapterOrchestrationExecutionRequest,
  ExecutionAdapterOrchestrationExecutionRecordResult,
  ExecutionAdapterOrchestrationExecutionHistoryResult,
  ExecutionAdapterHumanConfirmationStatus,
  ExecutionAdapterHumanConfirmationConfirmationStatus,
  ExecutionAdapterHumanConfirmationConfirmation,
  ExecutionAdapterHumanConfirmationResult,
  ExecutionAdapterHumanConfirmationRequest,
  ExecutionAdapterHumanConfirmationRecordResult,
  ExecutionAdapterHumanConfirmationHistoryResult,
  ExecutionAdapterSandboxProbePlanStatus,
  ExecutionAdapterSandboxProbePlanConfirmationStatus,
  ExecutionAdapterSandboxProbePlanConfirmation,
  ExecutionAdapterSandboxProbePlanResult,
  ExecutionAdapterSandboxProbePlanRequest,
  ExecutionAdapterSandboxProbePlanRecordResult,
  ExecutionAdapterSandboxProbePlanHistoryResult
} from "./execution-adapter-orchestration-transport";

export {
  buildExecutionAdapterSandboxProbeExecutionUrl,
  buildExecutionAdapterSandboxProbeReviewUrl,
  buildExecutionAdapterProductionRouteReviewUrl,
  buildExecutionAdapterHealthProbeUrl,
  buildExecutionAdapterSandboxProbeExecutionHistoryUrl,
  buildExecutionAdapterSandboxProbeReviewHistoryUrl,
  buildExecutionAdapterProductionRouteReviewHistoryUrl,
  recordExecutionAdapterSandboxProbeExecution,
  recordExecutionAdapterSandboxProbeReview,
  recordExecutionAdapterProductionRouteReview,
  loadExecutionAdapterHealthProbe,
  loadExecutionAdapterSandboxProbeExecutions,
  loadExecutionAdapterSandboxProbeReviews,
  loadExecutionAdapterProductionRouteReviews
} from "./execution-adapter-probe-transport";

export type {
  ExecutionAdapterSandboxProbeExecutionStatus,
  ExecutionAdapterSandboxProbeExecutionConfirmationStatus,
  ExecutionAdapterSandboxProbeExecutionConfirmation,
  ExecutionAdapterSandboxProbeExecutionResult,
  ExecutionAdapterSandboxProbeExecutionRequest,
  ExecutionAdapterSandboxProbeExecutionRecordResult,
  ExecutionAdapterSandboxProbeExecutionHistoryResult,
  ExecutionAdapterSandboxProbeReviewStatus,
  ExecutionAdapterSandboxProbeReviewConfirmationStatus,
  ExecutionAdapterSandboxProbeReviewConfirmation,
  ExecutionAdapterSandboxProbeReviewResult,
  ExecutionAdapterSandboxProbeReviewRequest,
  ExecutionAdapterSandboxProbeReviewRecordResult,
  ExecutionAdapterSandboxProbeReviewHistoryResult,
  ExecutionAdapterProductionRouteReviewStatus,
  ExecutionAdapterProductionRouteReviewConfirmationStatus,
  ExecutionAdapterProductionRouteReviewConfirmation,
  ExecutionAdapterProductionRouteReviewResult,
  ExecutionAdapterProductionRouteReviewRequest,
  ExecutionAdapterProductionRouteReviewRecordResult,
  ExecutionAdapterProductionRouteReviewHistoryResult,
  ExecutionAdapterHealthProbeStatus,
  ExecutionAdapterHealthProbeCheckStatus,
  ExecutionAdapterHealthProbeCheck,
  ExecutionAdapterHealthProbeCredentials,
  ExecutionAdapterHealthProbeRouteReview,
  ExecutionAdapterHealthProbeResult,
  ExecutionAdapterHealthProbeLoadResult
} from "./execution-adapter-probe-transport";

import {
  loadAiReviewDecisions,
  loadAuthoritativeAiReview,
  loadAuthoritativeAiReviews
} from "./ai-review-transport";

export {
  appendAiReviewDecision,
  buildAiResearchEvidenceUrl,
  buildAiResearchOutcomesUrl,
  buildAiReviewDecisionsUrl,
  buildAiReviewProvidersUrl,
  buildAuthoritativeAiReviewUrl,
  buildAuthoritativeAiReviewsUrl,
  createAiResearchEvidence,
  createAuthoritativeAiReview,
  evaluateAiResearchOutcome,
  loadAiResearchEvidence,
  loadAiReviewDecisions,
  loadAiReviewProviders,
  loadAuthoritativeAiReview,
  loadAuthoritativeAiReviews
} from "./ai-review-transport";

export type {
  AiResearchEvidenceResult,
  AiResearchOutcomeResult,
  AiReviewDecisionHistoryResult,
  AiReviewDecisionMutationResult,
  AiReviewProviderStatusResult,
  AppendAiReviewDecisionRequest,
  AuthoritativeAiReviewFilters,
  AuthoritativeAiReviewHistoryResult,
  AuthoritativeAiReviewResult,
  CreateAiResearchEvidenceRequest,
  CreateAuthoritativeAiReviewRequest,
  EvaluateAiResearchOutcomeRequest,
  MixedAiReviewHistoryPagination
} from "./ai-review-transport";

import { loadResearchNote, type ResearchNote } from "./research-ai-transport";

export {
  buildResearchNoteUrl,
  buildStrategyAiDraftUrl,
  generateResearchNoteDraft,
  generateStrategyAiDraft,
  isResearchNoteDraftStreamCurrent,
  loadResearchNote,
  saveResearchNote
} from "./research-ai-transport";

export type {
  ResearchNote,
  ResearchNoteDraft,
  ResearchNoteDraftGeneration,
  ResearchNoteDraftParams,
  ResearchNoteDraftResult,
  ResearchNoteDraftStreamIdentity,
  ResearchNoteDraftStreamOptions,
  ResearchNoteResult,
  ResearchNoteSaveParams,
  StrategyAiDraftBoundary,
  StrategyAiDraftCandidate,
  StrategyAiDraftGeneration,
  StrategyAiDraftParams,
  StrategyAiDraftResult
} from "./research-ai-transport";

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

export {
  buildMarketDiscoveryUrl,
  buildMarketInformationUrl,
  buildMarketSearchUrl,
  loadMarketDiscovery,
  loadMarketInformation,
  loadMarketSearch
} from "./market-exploration";

export type {
  MarketDiscoveryItem,
  MarketDiscoveryOverview,
  MarketDiscoveryParams,
  MarketDiscoveryResult,
  MarketDiscoverySort,
  MarketInformationNewsItem,
  MarketInformationParams,
  MarketInformationResult,
  MarketSearchCacheCoverage,
  MarketSearchResult,
  MarketSearchSuggestion
} from "./market-exploration";

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

export {
  applyAuditSigningKeyRotationPlan,
  buildAuditSigningKeyEnvironmentBindingHistoryUrl,
  buildAuditSigningKeyEnvironmentBindingUrl,
  buildAuditSigningKeyRotationAcceptanceHistoryUrl,
  buildAuditSigningKeyRotationAcceptanceUrl,
  buildAuditSigningKeyRotationApplyUrl,
  buildAuditSigningKeyRotationPlanUrl,
  buildAuditSigningKeyRotationRestartEvidenceUrl,
  buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl,
  buildAuditSigningKeyRuntimeReloadExecutionUrl,
  buildAuditSigningKeyRuntimeReloadPlanHistoryUrl,
  buildAuditSigningKeyRuntimeReloadPlanUrl,
  buildAuditSigningKeysUrl,
  buildAuditSigningKeySecretMaterializationHistoryUrl,
  buildAuditSigningKeySecretMaterializationUrl,
  loadAuditSigningKeyEnvironmentBindings,
  loadAuditSigningKeyRotationAcceptances,
  loadAuditSigningKeyRuntimeReloadExecutions,
  loadAuditSigningKeyRuntimeReloadPlans,
  loadAuditSigningKeys,
  loadAuditSigningKeySecretMaterializations,
  prepareAuditSigningKeyRotationPlan,
  recordAuditSigningKeyControlledRestartEvidence,
  recordAuditSigningKeyEnvironmentBinding,
  recordAuditSigningKeyRotationAcceptance,
  recordAuditSigningKeyRuntimeReloadExecution,
  recordAuditSigningKeyRuntimeReloadPlan,
  recordAuditSigningKeySecretMaterialization
} from "./audit-signing-key-transport";

export type {
  AuditSigningKeyControlledRestartEvidence,
  AuditSigningKeyControlledRestartEvidenceConfirmation,
  AuditSigningKeyControlledRestartEvidenceConfirmationStatus,
  AuditSigningKeyControlledRestartEvidenceRequest,
  AuditSigningKeyControlledRestartEvidenceResult,
  AuditSigningKeyControlledRestartEvidenceStatus,
  AuditSigningKeyEnvironmentBinding,
  AuditSigningKeyEnvironmentBindingConfirmation,
  AuditSigningKeyEnvironmentBindingConfirmationStatus,
  AuditSigningKeyEnvironmentBindingHistoryResult,
  AuditSigningKeyEnvironmentBindingRequest,
  AuditSigningKeyEnvironmentBindingResult,
  AuditSigningKeyEnvironmentBindingStatus,
  AuditSigningKeyRecord,
  AuditSigningKeyRegistry,
  AuditSigningKeyRegistryResult,
  AuditSigningKeyRotationAcceptance,
  AuditSigningKeyRotationAcceptanceConfirmation,
  AuditSigningKeyRotationAcceptanceConfirmationStatus,
  AuditSigningKeyRotationAcceptanceHistoryResult,
  AuditSigningKeyRotationAcceptanceRequest,
  AuditSigningKeyRotationAcceptanceResult,
  AuditSigningKeyRotationAcceptanceStatus,
  AuditSigningKeyRotationApply,
  AuditSigningKeyRotationApplyConfirmation,
  AuditSigningKeyRotationApplyParams,
  AuditSigningKeyRotationApplyResult,
  AuditSigningKeyRotationPlan,
  AuditSigningKeyRotationPlanEnvUpdate,
  AuditSigningKeyRotationPlanParams,
  AuditSigningKeyRotationPlanResult,
  AuditSigningKeyRotationPlanStep,
  AuditSigningKeyRuntimeReloadExecution,
  AuditSigningKeyRuntimeReloadExecutionConfirmation,
  AuditSigningKeyRuntimeReloadExecutionConfirmationStatus,
  AuditSigningKeyRuntimeReloadExecutionHistoryResult,
  AuditSigningKeyRuntimeReloadExecutionRequest,
  AuditSigningKeyRuntimeReloadExecutionResult,
  AuditSigningKeyRuntimeReloadExecutionStatus,
  AuditSigningKeyRuntimeReloadPlan,
  AuditSigningKeyRuntimeReloadPlanConfirmation,
  AuditSigningKeyRuntimeReloadPlanConfirmationStatus,
  AuditSigningKeyRuntimeReloadPlanHistoryResult,
  AuditSigningKeyRuntimeReloadPlanRequest,
  AuditSigningKeyRuntimeReloadPlanResult,
  AuditSigningKeyRuntimeReloadPlanStatus,
  AuditSigningKeySecretMaterialization,
  AuditSigningKeySecretMaterializationConfirmation,
  AuditSigningKeySecretMaterializationConfirmationStatus,
  AuditSigningKeySecretMaterializationHistoryResult,
  AuditSigningKeySecretMaterializationRequest,
  AuditSigningKeySecretMaterializationResult,
  AuditSigningKeySecretMaterializationStatus,
  AuditSigningKeyStatus
} from "./audit-signing-key-transport";

import {
  isPortfolioPaperOrderApproval,
  isPortfolioPaperOrderBatch,
  isPortfolioPaperOrderSimulation,
  type PortfolioBacktestRun,
  type PortfolioPaperOrderApproval,
  type PortfolioPaperOrderBatch,
  type PortfolioPaperOrderSimulation
} from "./portfolio-transport";

export {
  buildPortfolioBacktestUrl,
  buildPortfolioPaperOrderApprovalsUrl,
  buildPortfolioPaperOrderBatchSimulationsUrl,
  buildPortfolioPaperOrderReplayUrl,
  buildPortfolioPaperOrdersUrl,
  buildPortfolioPaperOrderSimulationsUrl,
  buildPortfolioPaperOrderStateHistoryUrl,
  isPortfolioBacktestRun,
  isPortfolioPaperOrderApproval,
  isPortfolioPaperOrderBatch,
  isPortfolioPaperOrderReplay,
  isPortfolioPaperOrderSimulation,
  isPortfolioPaperOrderStateHistory,
  loadPortfolioPaperOrderApprovals,
  loadPortfolioPaperOrderBatches,
  loadPortfolioPaperOrderReplay,
  loadPortfolioPaperOrderSimulations,
  loadPortfolioPaperOrderStateHistory,
  recordPortfolioPaperOrderApproval,
  recordPortfolioPaperOrderBatch,
  recordPortfolioPaperOrderBatchSimulation,
  recordPortfolioPaperOrderSimulation,
  runPortfolioBacktest
} from "./portfolio-transport";

export type {
  PortfolioAllocationEvent,
  PortfolioBacktestEquityPoint,
  PortfolioBacktestLeg,
  PortfolioBacktestLegRequest,
  PortfolioBacktestMetrics,
  PortfolioBacktestRequest,
  PortfolioBacktestResult,
  PortfolioBacktestRun,
  PortfolioCorrelationPair,
  PortfolioCovarianceRisk,
  PortfolioCovarianceRiskContribution,
  PortfolioPaperOrderAdapterEvidenceRequest,
  PortfolioPaperOrderApproval,
  PortfolioPaperOrderApprovalHistoryResult,
  PortfolioPaperOrderApprovalRecordResult,
  PortfolioPaperOrderApprovalRequest,
  PortfolioPaperOrderBatch,
  PortfolioPaperOrderBatchRequest,
  PortfolioPaperOrderBatchSimulation,
  PortfolioPaperOrderBatchSimulationIssue,
  PortfolioPaperOrderBatchSimulationRecordResult,
  PortfolioPaperOrderBatchSimulationRequest,
  PortfolioPaperOrderEvent,
  PortfolioPaperOrderHistoryResult,
  PortfolioPaperOrderLifecycleEvent,
  PortfolioPaperOrderRecordResult,
  PortfolioPaperOrderReplay,
  PortfolioPaperOrderReplayOrder,
  PortfolioPaperOrderReplayPosition,
  PortfolioPaperOrderReplayResult,
  PortfolioPaperOrderReplaySummary,
  PortfolioPaperOrderSimulation,
  PortfolioPaperOrderSimulationHistoryResult,
  PortfolioPaperOrderSimulationRecordResult,
  PortfolioPaperOrderSimulationRequest,
  PortfolioPaperOrderSimulationRouteRisk,
  PortfolioPaperOrderStateHistory,
  PortfolioPaperOrderStateHistoryEvent,
  PortfolioPaperOrderStateHistoryOrder,
  PortfolioPaperOrderStateHistoryResult,
  PortfolioPaperOrderStateHistoryState,
  PortfolioPaperOrderStateHistorySummary,
  PortfolioPaperOrderSummary,
  PortfolioPreTradeRiskCheck,
  PortfolioRebalanceEvent,
  PortfolioTradeReviewEvent
} from "./portfolio-transport";

import {
  isPlatformSettingsTone,
  type PlatformSettingsStatus,
  type PlatformSettingsStatusTone
} from "./platform-settings";

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
  isProductionStrategyHandoffPayload,
  loadStrategyLibrary,
  type ProductionStrategyHandoffResult,
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

export interface AiReviewRunV2ArchiveEnvelope {
  aiReviewId: string;
  runId: string;
  createdAt: string;
  record: AiReviewRunArchiveRecord;
}

export interface AiReviewDecisionArchiveEnvelope {
  decisionId: string;
  aiReviewId: string;
  createdAt: string;
  record: AiReviewDecision;
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

export interface P0PipelineRequest {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  limit: number;
  watchlistRefreshRunId?: string;
  selectionOrigin?: MarketAiSelectionResearchOrigin;
  strategyConfig: StrategySnapshot;
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

export interface HandoffNoteSaveParams {
  subjectType: HandoffNoteSubjectType;
  subjectId: string;
  body: string;
  author?: string;
  sourceWorkspace?: string;
}

export function resolveQuantCoreBaseUrl(env: { VITE_QUANT_API_BASE?: string }): string {
  const configured = env.VITE_QUANT_API_BASE?.trim();
  return configured ? configured : defaultQuantCoreBaseUrl;
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
  watchlistRefreshRunId?: string | null,
  end?: string | null
): string {
  return buildApiUrl(baseUrl, "api/research/run", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
    if (end?.trim()) {
      url.searchParams.set("end", end.trim());
    }
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

export function buildResearchRunsUrl(baseUrl: string, limit: number): string {
  return buildApiUrl(baseUrl, "api/research/runs", (url) => {
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  });
}

export function buildResearchRunDetailUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}`);
}

export function buildResearchRunProductionStrategyHandoffUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/production-strategy-handoff`);
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

export function buildAuditReportVerifyPackageUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/verify-package");
}

export function buildExecutionAdapterLedgerUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-ledger");
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
          changePct: instrument.changePct,
          quoteSource: instrument.quoteSource,
          quoteAsOf: instrument.quoteAsOf
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
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunDetailResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId), signal ? { signal } : undefined);
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

export async function loadResearchRunProductionStrategyHandoff(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ProductionStrategyHandoffResult> {
  try {
    const response = await fetcher(buildResearchRunProductionStrategyHandoffUrl(baseUrl, runId));
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(response.ok
        ? "Invalid production strategy handoff contract"
        : `HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      return {
        source: "core",
        error: coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`
      };
    }
    if (!isProductionStrategyHandoffPayload(payload)) {
      throw new Error("Invalid production strategy handoff contract");
    }
    return {
      handoff: payload.productionStrategyHandoff,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown production strategy handoff error"
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

export function buildP0PipelineRequest(
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace
): P0PipelineRequest {
  return {
    market: params.market,
    symbol: params.symbol,
    timeframe: params.timeframe,
    limit: Math.max(1, Math.min(params.limit ?? 500, 500)),
    watchlistRefreshRunId: params.watchlistRefreshRunId?.trim() || undefined,
    selectionOrigin: params.selectionOrigin ?? undefined,
    strategyConfig: { ...currentWorkspace.strategy },
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
        params.watchlistRefreshRunId,
        params.end
      )
    );
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(response.ok
        ? "Invalid terminal research contract"
        : `HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
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

function isGoldenPathStatusPayload(value: unknown): value is { goldenPath: GoldenPathStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { goldenPath?: unknown };
  return isGoldenPathStatus(payload.goldenPath);
}

function isOptionalStringOrNull(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
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

function isAiReviewRunV2ArchiveEnvelope(value: unknown, runId: string | undefined): value is AiReviewRunV2ArchiveEnvelope {
  if (!hasExactObjectKeys(value, ["aiReviewId", "runId", "createdAt", "record"])
    || typeof value.aiReviewId !== "string"
    || typeof value.runId !== "string"
    || typeof value.createdAt !== "string"
    || !isAiReviewRunArchiveRecord(value.record)) {
    return false;
  }
  return value.aiReviewId === value.record.aiReviewId
    && value.createdAt === value.record.createdAt
    && value.runId === value.record.primaryExperiment.sourceRunId
    && (!runId || value.runId === runId);
}

function isAiReviewDecisionArchiveEnvelope(value: unknown): value is AiReviewDecisionArchiveEnvelope {
  if (!hasExactObjectKeys(value, ["decisionId", "aiReviewId", "createdAt", "record"])
    || typeof value.decisionId !== "string"
    || typeof value.aiReviewId !== "string"
    || typeof value.createdAt !== "string"
    || !isAiReviewDecision(value.record)) {
    return false;
  }
  return value.decisionId === value.record.decisionId
    && value.aiReviewId === value.record.aiReviewId
    && value.createdAt === value.record.createdAt;
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
    (snapshot.snapshotHash === undefined || typeof snapshot.snapshotHash === "string") &&
    Array.isArray(snapshot.bars) &&
    snapshot.bars.every(isMarketKlineBar) &&
    isOptionalDataQualityContract(snapshot) &&
    (snapshot.offlineReplay === undefined || isOfflineReplayEvidence(snapshot.offlineReplay)) &&
    (snapshot.sourceComparison === undefined || isSourceComparisonReport(snapshot.sourceComparison)) &&
    (snapshot.preparationEvidence === undefined ||
      isResearchRunDataPreparationEvidence(snapshot.preparationEvidence)) &&
    (snapshot.marketAiSelectionEvidence === undefined ||
      isResearchRunMarketAiSelectionEvidence(snapshot.marketAiSelectionEvidence))
  );
}

function isResearchRunMarketAiSelectionEvidence(value: unknown): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.selectionId === "string" &&
    typeof value.auditEventId === "string" &&
    typeof value.candidateEvidenceId === "string" &&
    typeof value.selectionRecordHash === "string" &&
    typeof value.candidateEvidenceHash === "string" &&
    typeof value.marketSnapshotHash === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    value.timeframe === "1d" &&
    (value.profile === "balanced" ||
      value.profile === "quality_growth" ||
      value.profile === "value" ||
      value.profile === "trend") &&
    (value.horizon === "short" || value.horizon === "medium" || value.horizon === "long") &&
    typeof value.horizonBars === "number" &&
    typeof value.rank === "number" &&
    (value.tier === "priority_research" ||
      value.tier === "watch" ||
      value.tier === "insufficient_evidence") &&
    typeof value.referenceAt === "string" &&
    typeof value.referencePrice === "number" &&
    typeof value.generatedAt === "string" &&
    value.researchOnly === true &&
    typeof value.recordHash === "string"
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
    typeof quality.rows === "number" &&
    isOptionalDataQualityContract(quality)
  );
}

function isOfflineReplayEvidence(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    value.status === "verified" &&
    value.mode === "embedded_snapshot" &&
    typeof value.rows === "number" &&
    typeof value.canonicalHash === "string" &&
    value.networkRequired === false
  );
}

function isSourceComparisonReport(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    value.schemaVersion === 1 &&
    (value.status === "agreement" ||
      value.status === "warning" ||
      value.status === "blocked" ||
      value.status === "unavailable") &&
    typeof value.primarySource === "string" &&
    typeof value.secondarySource === "string" &&
    typeof value.primaryRows === "number" &&
    typeof value.secondaryRows === "number" &&
    typeof value.overlapRows === "number" &&
    typeof value.overlapRatio === "number" &&
    isPlainRecord(value.fields) &&
    Array.isArray(value.differences) &&
    value.valuesMerged === false &&
    (value.reason === null || typeof value.reason === "string") &&
    typeof value.reportHash === "string"
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
    (row.proposalId === undefined || row.proposalId === null || typeof row.proposalId === "string") &&
    (row.signalId === undefined || row.signalId === null || typeof row.signalId === "string") &&
    (row.snapshotHash === undefined || row.snapshotHash === null || typeof row.snapshotHash === "string") &&
    (row.tone === "positive" || row.tone === "warning" || row.tone === "neutral" || row.tone === "risk")
  );
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
