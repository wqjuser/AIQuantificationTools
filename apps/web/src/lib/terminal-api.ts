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

export * from "./acceptance-audit-event-builders";

export * from "./operations-audit-event-builders";

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

export {
  buildExecutionAdapterSandboxOrderSchemaDryRunUrl,
  buildExecutionAdapterSandboxOrderSchemaDryRunHistoryUrl,
  buildExecutionAdapterPaperOrderLifecycleUrl,
  buildExecutionAdapterPaperOrderLifecycleHistoryUrl,
  buildExecutionAdapterPaperRouteRunbookUrl,
  buildExecutionAdapterPaperRouteRunbookHistoryUrl,
  buildExecutionAdapterOpsStateUrl,
  buildExecutionAdapterOpsStateHistoryUrl,
  buildExecutionAdapterPaperExecutionUrl,
  buildExecutionAdapterPaperExecutionHistoryUrl,
  recordExecutionAdapterSandboxOrderSchemaDryRun,
  recordExecutionAdapterPaperOrderLifecycle,
  recordExecutionAdapterPaperRouteRunbook,
  recordExecutionAdapterOpsState,
  recordExecutionAdapterPaperExecution,
  loadExecutionAdapterSandboxOrderSchemaDryRuns,
  loadExecutionAdapterPaperOrderLifecycles,
  loadExecutionAdapterPaperRouteRunbooks,
  loadExecutionAdapterOpsStates,
  loadExecutionAdapterPaperExecutions
} from "./execution-adapter-paper-validation-transport";

export type {
  ExecutionAdapterSandboxOrderSchemaDryRunStatus,
  ExecutionAdapterSandboxOrderSchemaDryRunConfirmationStatus,
  ExecutionAdapterSandboxOrderSchemaDryRunConfirmation,
  ExecutionAdapterSandboxOrderIntent,
  ExecutionAdapterSandboxOrderSchemaDryRunResult,
  ExecutionAdapterSandboxOrderSchemaDryRunRequest,
  ExecutionAdapterSandboxOrderSchemaDryRunRecordResult,
  ExecutionAdapterSandboxOrderSchemaDryRunHistoryResult,
  ExecutionAdapterPaperOrderLifecycleStatus,
  ExecutionAdapterPaperOrderLifecycleConfirmationStatus,
  ExecutionAdapterPaperOrderLifecycleStepStatus,
  ExecutionAdapterPaperOrderLifecycleConfirmation,
  ExecutionAdapterPaperOrderLifecycleStep,
  ExecutionAdapterPaperOrderLifecycleResult,
  ExecutionAdapterPaperOrderLifecycleRequest,
  ExecutionAdapterPaperOrderLifecycleRecordResult,
  ExecutionAdapterPaperOrderLifecycleHistoryResult,
  ExecutionAdapterPaperRouteRunbookStatus,
  ExecutionAdapterPaperRouteRunbookConfirmationStatus,
  ExecutionAdapterPaperRouteRunbookStepStatus,
  ExecutionAdapterPaperRouteRunbookConfirmation,
  ExecutionAdapterPaperRouteRunbookStep,
  ExecutionAdapterPaperRouteRunbookResult,
  ExecutionAdapterPaperRouteRunbookRequest,
  ExecutionAdapterPaperRouteRunbookRecordResult,
  ExecutionAdapterPaperRouteRunbookHistoryResult,
  ExecutionAdapterOpsStateStatus,
  ExecutionAdapterOpsStateConfirmationStatus,
  ExecutionAdapterOpsStateStepStatus,
  ExecutionAdapterOpsStateConfirmation,
  ExecutionAdapterOpsStateStep,
  ExecutionAdapterOpsStateResult,
  ExecutionAdapterOpsStateRequest,
  ExecutionAdapterOpsStateRecordResult,
  ExecutionAdapterOpsStateHistoryResult,
  ExecutionAdapterPaperExecutionStatus,
  ExecutionAdapterPaperExecutionConfirmationStatus,
  ExecutionAdapterPaperExecutionStepStatus,
  ExecutionAdapterPaperExecutionFillStatus,
  ExecutionAdapterPaperExecutionConfirmation,
  ExecutionAdapterPaperExecutionStep,
  ExecutionAdapterPaperExecutionFill,
  ExecutionAdapterPaperExecutionResult,
  ExecutionAdapterPaperExecutionRequest,
  ExecutionAdapterPaperExecutionRecordResult,
  ExecutionAdapterPaperExecutionHistoryResult
} from "./execution-adapter-paper-validation-transport";

export * from "./ai-review-transport";

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

export * from "./audit-signing-key-transport";

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
