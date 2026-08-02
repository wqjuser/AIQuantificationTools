import {
  Activity,
  BarChart3,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Cog,
  Copy,
  Database,
  Download,
  GitBranch,
  Languages,
  Maximize2,
  Moon,
  Newspaper,
  Play,
  Radar,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sun,
  Timer,
  Type,
  Upload,
  WalletCards,
  X
} from "lucide-react";
import { ActionType, dispose, init, LoadDataType, type Chart, type KLineData } from "klinecharts";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import {
  buildLoadingMarketKlinesResult,
  loadGoldenPathStatus,
  importResearchRunExport,
  undoResearchRunImport,
  loadAuditEvents,
  loadAuditSigningKeys,
  applyAuditSigningKeyRotationPlan,
  prepareAuditSigningKeyRotationPlan,
  recordAuditSigningKeyControlledRestartEvidence,
  loadAuditSigningKeySecretMaterializations,
  recordAuditSigningKeySecretMaterialization,
  loadAuditSigningKeyEnvironmentBindings,
  recordAuditSigningKeyEnvironmentBinding,
  loadAuditSigningKeyRuntimeReloadPlans,
  recordAuditSigningKeyRuntimeReloadPlan,
  loadAuditSigningKeyRuntimeReloadExecutions,
  recordAuditSigningKeyRuntimeReloadExecution,
  loadAuditSigningKeyRotationAcceptances,
  recordAuditSigningKeyRotationAcceptance,
  loadResearchRunAiReviews,
  loadMarketDataReadiness,
  loadMarketDiscovery,
  createMarketAiSelection,
  createMarketAiSelectionReview,
  loadMarketAiSelectionQualityStatistics,
  loadMarketInformation,
  loadMarketKlines,
  loadMarketCalendarStatus,
  loadMarketSearch,
  loadLatestResearchRunPaperExecution,
  loadPortfolioPaperOrderBatches,
  loadPortfolioPaperOrderApprovals,
  loadPortfolioPaperOrderReplay,
  loadPortfolioPaperOrderStateHistory,
  loadPortfolioPaperOrderSimulations,
  loadResearchRunDetail,
  loadResearchRunProductionStrategyHandoff,
  loadResearchRunExport,
  loadResearchRunHistory,
  loadResearchRunPromotion,
  loadResearchNote,
  generateResearchNoteDraft,
  generateStrategyAiDraft,
  isResearchNoteDraftStreamCurrent,
  loadHandoffNotes,
  loadDesktopReleaseLatest,
  generateStage1BootstrapPreflight,
  loadStage1BootstrapPreflightLatest,
  generateStage1DailyUse,
  loadStage1DailyUseLatest,
  loadP0AcceptanceLatest,
  loadP1AcceptanceLatest,
  loadP2PaperReplayLatest,
  loadP2PreLiveAcceptanceLatest,
  loadP2ReadinessAcceptanceLatest,
  generateP2ReadinessAcceptance,
  loadP2ManifestChainPreflightLatest,
  generateP2ManifestChainPreflight,
  loadOpenAiCompatibleModels,
  loadPlatformSettings,
  installPlatformDataDependency,
  savePlatformSettings,
  testMonitoringWebhook,
  loadWatchlistCacheRefreshRuns,
  loadExecutionAdapterLedger,
  loadExecutionAdapterCertificationApplies,
  loadExecutionAdapterControlledRestartEvidence,
  loadExecutionAdapterRestartAcceptances,
  loadExecutionAdapterEnvironmentBindings,
  loadExecutionAdapterSecretManifestValidations,
  loadExecutionAdapterSecretMaterializations,
  loadExecutionAdapterSecretReferences,
  loadExecutionAdapterOrchestrationDryRuns,
  loadExecutionAdapterOrchestrationExecutions,
  loadExecutionAdapterHumanConfirmations,
  loadExecutionAdapterSandboxProbeExecutions,
  loadExecutionAdapterSandboxProbePlans,
  loadExecutionAdapterSandboxProbeReviews,
  loadExecutionAdapterSandboxOrderSchemaDryRuns,
  loadExecutionAdapterPaperOrderLifecycles,
  loadExecutionAdapterPaperExecutions,
  loadExecutionAdapterOpsStates,
  loadExecutionAdapterPaperRouteRunbooks,
  loadExecutionAdapterProductionRouteReviews,
  loadExecutionAdapterHealthProbe,
  loadExecutionAdapterRuntimeReloadAcceptances,
  loadExecutionAdapterRuntimeReloadExecutions,
  loadExecutionAdapterRuntimeReloadPlans,
  loadExecutionAdapterCertifications,
  recordExecutionAdapterOrchestrationDryRun,
  recordExecutionAdapterOrchestrationExecution,
  recordExecutionAdapterHumanConfirmation,
  recordExecutionAdapterSandboxProbeExecution,
  recordExecutionAdapterSandboxProbePlan,
  recordExecutionAdapterSandboxProbeReview,
  recordExecutionAdapterProductionRouteReview,
  recordExecutionAdapterPaperExecution,
  recordExecutionAdapterOpsState,
  recordExecutionAdapterRuntimeReloadAcceptance,
  recordExecutionAdapterCertification,
  recordExecutionAdapterCertificationApply,
  createStrategyExperiment,
  appendAiReviewDecision,
  createAuthoritativeAiReview,
  loadAiReviewDecisions,
  loadAiReviewArchiveImportSnapshot,
  loadAiReviewRunArchiveSnapshot,
  loadAiReviewProviders,
  loadAuthoritativeAiReview,
  loadStrategyExperimentDetail,
  loadStrategyExperiments,
  runPortfolioBacktest,
  recordPortfolioPaperOrderBatch,
  refreshMarketCache,
  refreshWatchlistCacheRun,
  loadStrategyLibrary,
  loadStrategyProductionBinding,
  updateStrategyProductionBinding,
  loadTerminalWorkspace,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  normalizeResearchRunExportPackagePayload,
  buildAuditEvidenceReportAuditEvent,
  buildBacktestReportAuditEvent,
  buildExecutionAdapterPreLiveRunbookAuditEvent,
  buildOperatorRunbookAuditEvent,
  buildP0PlatformReadinessReportAuditEvent,
  buildPortfolioBacktestReportAuditEvent,
  buildResearchContextReadinessReportAuditEvent,
  buildMarketDataRefreshOverrideAuditEvent,
  buildAuditSigningKeyRotationApplyAuditEvent,
  buildAuditSigningKeyRotationPlanAuditEvent,
  buildResearchRunExportAuditReport,
  withResearchRunExportAuditEvidenceArtifacts,
  withVerifiedResearchRunExportPackageReportSignatures,
  withResearchRunExportReportSignatures,
  buildP0AcceptanceReviewAuditEvent,
  buildP2ManifestChainPreflightReviewAuditEvent,
  buildP2ReadinessEvidenceCoverageReviewAuditEvent,
  buildP2ReadinessAcceptanceReviewAuditEvent,
  buildDailyStartBriefReviewAuditEvent,
  buildDailyOpsControlRoomReviewAuditEvent,
  buildPersonalTeamUsabilityReadinessReviewAuditEvent,
  buildStage1P0DailyUseArchiveReviewAuditEvent,
  MarketCalendarResult,
  MarketDataReadinessResult,
  MarketDiscoveryParams,
  MarketDiscoveryResult,
  MarketAiSelectionLoadResult,
  MarketAiSelectionQualityStatisticsLoadResult,
  MarketAiSelectionReviewLoadResult,
  MarketAiSelectionReviewRequest,
  MarketAiSelectionRequest,
  MarketAiSelectionResearchOrigin,
  MarketInformationResult,
  MarketKlinesResult,
  MarketSearchSuggestion,
  PaperExecutionRecord,
  P0PaperSimulationResponse,
  DesktopReleaseLatestResult,
  Stage1BootstrapPreflightLatestResult,
  Stage1DailyUseLatestResult,
  P0AcceptanceLatestResult,
  P1AcceptanceLatestResult,
  P2PaperReplayLatestResult,
  P2PreLiveAcceptanceLatestResult,
  P2ReadinessAcceptanceLatestResult,
  P2ManifestChainPreflightLatestResult,
  PromotionCandidateRecord,
  AiReviewRunRecordEnvelope,
  AiReviewArchiveImportSnapshot,
  AiReviewRunHistoryPagination,
  AuditEventRecord,
  AuditEventHistoryPagination,
  AuditSigningKeyRegistry,
  AuditSigningKeyRegistryResult,
  AuditSigningKeyControlledRestartEvidence,
  AuditSigningKeyControlledRestartEvidenceResult,
  AuditSigningKeySecretMaterialization,
  AuditSigningKeySecretMaterializationResult,
  AuditSigningKeyEnvironmentBinding,
  AuditSigningKeyEnvironmentBindingResult,
  AuditSigningKeyRuntimeReloadPlan,
  AuditSigningKeyRuntimeReloadPlanResult,
  AuditSigningKeyRuntimeReloadExecution,
  AuditSigningKeyRuntimeReloadExecutionResult,
  AuditSigningKeyRotationAcceptance,
  AuditSigningKeyRotationAcceptanceResult,
  AuditSigningKeyRotationApply,
  AuditSigningKeyRotationApplyResult,
  AuditSigningKeyRotationPlan,
  AuditSigningKeyRotationPlanResult,
  CacheWatchlistRefreshRun,
  GoldenPathStatus,
  GoldenPathStatusResult,
  ExecutionAdapterCertificationCheck,
  ExecutionAdapterCertificationApplyResult,
  ExecutionAdapterControlledRestartEvidenceResult,
  ExecutionAdapterRestartAcceptanceResult,
  ExecutionAdapterEnvironmentBindingResult,
  ExecutionAdapterSecretManifestValidationResult,
  ExecutionAdapterSecretMaterializationResult,
  ExecutionAdapterSecretReferenceResult,
  ExecutionAdapterOrchestrationDryRunResult,
  ExecutionAdapterOrchestrationExecutionResult,
  ExecutionAdapterHumanConfirmationResult,
  ExecutionAdapterSandboxProbeExecutionResult,
  ExecutionAdapterSandboxProbePlanResult,
  ExecutionAdapterSandboxProbeReviewResult,
  ExecutionAdapterSandboxOrderSchemaDryRunResult,
  ExecutionAdapterPaperOrderLifecycleResult,
  ExecutionAdapterPaperExecutionResult,
  ExecutionAdapterOpsStateResult,
  ExecutionAdapterPaperRouteRunbookResult,
  ExecutionAdapterProductionRouteReviewResult,
  ExecutionAdapterHealthProbeLoadResult,
  ExecutionAdapterRuntimeReloadAcceptanceResult,
  ExecutionAdapterRuntimeReloadExecutionResult,
  ExecutionAdapterRuntimeReloadPlanResult,
  ExecutionAdapterLedgerResult,
  ExecutionAdapterCertificationRun,
  InstallablePlatformDataDependency,
  PlatformSettingsResult,
  PlatformSettingsStatus,
  PlatformSettingsUpdateRequest,
  PortfolioBacktestResult,
  PortfolioPaperOrderBatch,
  PortfolioPaperOrderLifecycleEvent,
  PortfolioPaperOrderReplay,
  PortfolioPaperOrderStateHistory,
  PortfolioPaperOrderSimulation,
  ProductionStrategyHandoffResult,
  resolveQuantCoreBaseUrl,
  saveAiReviewRunRecord,
  runP0AiReview,
  runP0PaperSimulation,
  runP0Pipeline,
  runTerminalResearch,
  ResearchRunExportAuditReport,
  ResearchRunExportPackage,
  ResearchRunHistoryResult,
  HandoffNotesResult,
  ResearchNoteResult,
  saveResearchWorkspaceState,
  saveWatchlist,
  saveResearchNote,
  saveHandoffNote,
  saveAuditEvent,
  signAuditReportEvent,
  revokeAuditReportEvent,
  recordPortfolioPaperOrderApproval,
  recordPortfolioPaperOrderBatchSimulation,
  recordPortfolioPaperOrderSimulation,
  deleteStrategyVersion,
  saveStrategySnapshot,
  StrategyAiDraftResult,
  StrategyLibraryItem,
  StrategyLibraryResult,
  StrategyProductionBindingResult,
  StrategyValidationResult,
  validateStrategySnapshot,
  verifyAuditReportEvent,
  WorkspaceLoadResult
} from "../../lib/terminal-api";
import { ExecutionAdapterPaperExecutionAuditLedgerPanel } from "../../components/ExecutionAdapterPaperExecutionAuditLedgerPanel";
import { isStrategyExperimentDraftValid } from "../../components/StrategyExperimentSection";
import { AiResearchM4Section } from "../../components/AiResearchM4Section";
import {
  createPortfolioStage4RequestCoordinator,
  selectCurrentStage4PortfolioWorkflow
} from "../../components/PortfolioStage4Section";
import {
  TerminalWorkspaceSurface,
  type TerminalWorkspaceSurfaceAction
} from "../../components/TerminalWorkspaceSurface";
import {
  ExecutionAcceptanceAuditLedgerPanel,
  executionAcceptanceAuditEventTypes
} from "../../components/ExecutionStage9ProductionAdmissionSection";
import { ExecutionStage10ProductionExecutionSection } from "../../components/ExecutionStage10ProductionExecutionSection";
import {
  AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS,
  ExecutionAutoPaperTradingSection,
  autoTradingErrorMessage,
  loadAutoTradingSnapshot,
  type AutoTradingSnapshot
} from "../dynamic-trading/ExecutionAutoPaperTradingSection";
import { Panel } from "../../components/AppPanel";
import {
  isResearchContextActionDisabled,
  marketDataRefreshGuardLabel,
  researchContextReadinessActionLabel,
  researchContextReadinessDetail,
  researchContextReadinessValue,
  runResearchContextReadinessAction,
  type MarketDataRefreshOverrideAuditStatus
} from "../../components/ResearchContextReadinessPanel";
import {
  AutomatedTradingWorkflowGuide,
  productWorkAreaIdLabelText,
  stage1P0DailyUseArchiveRecordActionElementId,
  stage1P0DailyUseClosureElementId,
  stage1P0DailyUsePrimaryActionElementId,
  stage1P0DailyUseRefreshActionElementId,
  stage1P0DailyUseRefreshEntryElementId,
  stage1P0DailyUseRefreshNextActionElementId,
  stage1P0DailyUseRowElementId
} from "../../components/AppWorkflowPanels";
import {
  AiReviewDossierBoard,
  AiReviewRunRecordHistory,
  formatChartDate
} from "../../components/AiReviewAuditBoards";
import { AiReviewAuditTrailPanel } from "../../components/AiReviewAuditTrailPanel";
import { createI18n, type AppI18n, Locale, resolveInitialLocale, supportedLocales } from "../../lib/i18n";
import {
  paperPositionStatusLabel,
  paperTradingRowsFromExecutionRecord,
} from "../execution/ExecutionFormatters";
import { portfolioTradeReviewSideLabel } from "../execution/PortfolioOrderFormatters";
import { ExecutionPanel } from "../execution/ExecutionPanel";
import { PromotionQueuePanel } from "../execution/PromotionQueuePanel";
import { PreLiveRunbookPanel } from "../execution/PreLiveRunbookPanel";
import { OperatorRunbookPanel } from "../execution/OperatorRunbookPanel";
import { BrokerWorkspace } from "../execution/BrokerWorkspace";
import {
  automatedTradingWorkAreaIds,
  productWorkAreaGroups,
  productWorkAreaIds,
  researchPipelinePreflightIssueTargets,
  workAreaIcons,
  workflowAccentByStep,
  workflowIcons,
  workflowStepIds
} from "./navigation";
import {
  buildExecutionAdapterPaperExecutionEvidenceUrl,
  buildInitialTerminalWorkspace,
  buildStage1P0WorkspaceShareUrl,
  hasExplicitResearchContextUrl,
  hasExplicitWorkAreaUrl,
  replaceAdapterPaperExecutionEvidenceUrlParam,
  replaceAuditEvidenceReportQueryUrlParam,
  replaceP0CurrentGapActionUrlSearch,
  replaceStrategyExperimentUrlParam,
  replaceWatchlistCacheRefreshRunUrlParam,
  researchRunImportAuditEvidenceAnchorQuery,
  resolveInitialAdapterPaperExecutionAuditEventId,
  resolveInitialAuditEvidenceReportQuery,
  resolveInitialImportAuditEventId,
  resolveInitialImportAuditEvidenceDeepLink,
  resolveInitialImportAuditEvidenceQuery,
  resolveInitialMarketAiSelectionResearchOrigin,
  resolveInitialPaperExecutionDeepLink,
  resolveInitialResearchContextUrlState,
  resolveInitialWatchlistCacheRefreshRunId,
  resolveInitialWorkAreaSelection,
  type ImportAuditEvidenceDeepLinkStatus,
  type InitialImportAuditEvidenceDeepLink,
  type InitialPaperExecutionDeepLink,
  type PaperExecutionDeepLinkStatus
} from "./url-state";
import {
  createWorkflowLogEntry,
  createWorkflowRunState,
  waitForNextPaint,
  waitForWorkflowStep
} from "./workflow-runtime";
import {
  mergeAuditEvidenceReportEvent,
  mergePortfolioPaperOrderLifecycleEvents,
  mergePortfolioPaperOrderSimulations,
  mergePortfolioPaperOrderStateHistories
} from "../audit/event-merges";
import { strategyLibraryItemMatchesWorkspace } from "../strategy/strategy-workspace";
import {
  goldenPathActionPreflightHint,
  researchPipelineLockedEvidenceLabel,
  researchPipelineLockedEvidenceTitle,
  researchPipelinePreflightIssueDetail,
  researchPipelinePreflightIssueLabel,
  researchPipelinePreflightStatusLabel,
  strategyDraftReauditHint
} from "../research/ResearchPipelineFormatters";
import {
  buildAdapterCertificationEvidenceChecks,
  latestRecordedProductionRouteReviewIdForAdapter
} from "../execution/certification-evidence";
import {
  createDefaultExecutionAdapterHumanConfirmationConfirmations,
  createDefaultExecutionAdapterOpsStateConfirmations,
  createDefaultExecutionAdapterOrchestrationDryRunConfirmations,
  createDefaultExecutionAdapterOrchestrationExecutionConfirmations,
  createDefaultExecutionAdapterPaperExecutionConfirmations,
  createDefaultExecutionAdapterProductionRouteReviewConfirmations,
  createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations,
  createDefaultExecutionAdapterSandboxProbeExecutionConfirmations,
  createDefaultExecutionAdapterSandboxProbePlanConfirmations,
  createDefaultExecutionAdapterSandboxProbeReviewConfirmations,
  executionAdapterHumanConfirmationConfirmationRows,
  executionAdapterOpsStateConfirmationRows,
  executionAdapterOrchestrationDryRunConfirmationRows,
  executionAdapterOrchestrationExecutionConfirmationRows,
  executionAdapterPaperExecutionConfirmationRows,
  executionAdapterProductionRouteReviewConfirmationRows,
  executionAdapterRuntimeReloadAcceptanceConfirmationRows,
  executionAdapterSandboxProbeExecutionConfirmationRows,
  executionAdapterSandboxProbePlanConfirmationRows,
  executionAdapterSandboxProbeReviewConfirmationRows,
  initialAuditSigningKeyEnvironmentBindingConfirmations,
  initialAuditSigningKeyRestartEvidenceConfirmations,
  initialAuditSigningKeyRotationAcceptanceConfirmations,
  initialAuditSigningKeyRotationApplyConfirmations,
  initialAuditSigningKeyRuntimeReloadExecutionConfirmations,
  initialAuditSigningKeyRuntimeReloadPlanConfirmations,
  initialAuditSigningKeySecretMaterializationConfirmations,
  type AuditSigningKeyEnvironmentBindingConfirmations,
  type AuditSigningKeyRestartEvidenceConfirmations,
  type AuditSigningKeyRotationAcceptanceConfirmations,
  type AuditSigningKeyRotationApplyConfirmations,
  type AuditSigningKeyRuntimeReloadExecutionConfirmations,
  type AuditSigningKeyRuntimeReloadPlanConfirmations,
  type AuditSigningKeySecretMaterializationConfirmations,
  type ExecutionAdapterHumanConfirmationConfirmations,
  type ExecutionAdapterOpsStateConfirmations,
  type ExecutionAdapterOrchestrationDryRunConfirmations,
  type ExecutionAdapterOrchestrationExecutionConfirmations,
  type ExecutionAdapterPaperExecutionConfirmations,
  type ExecutionAdapterProductionRouteReviewConfirmations,
  type ExecutionAdapterRuntimeReloadAcceptanceConfirmations,
  type ExecutionAdapterSandboxProbeExecutionConfirmations,
  type ExecutionAdapterSandboxProbePlanConfirmations,
  type ExecutionAdapterSandboxProbeReviewConfirmations
} from "../execution/ExecutionConfirmations";
import {
  brokerAdapterName,
  brokerCertificationLabel,
  brokerNextStepLabel,
  adapterLedgerLabel,
  adapterLedgerAdapterName,
  adapterLedgerGateSummary,
  adapterLedgerReason,
  adapterLedgerNextStep,
  adapterCertificationAdapterName,
  adapterCertificationStatusLabel,
  adapterCertificationApplyStatusLabel,
  adapterRuntimeReloadExecutionStatusLabel,
  adapterRuntimeReloadAcceptanceStatusLabel,
  adapterOrchestrationDryRunStatusLabel,
  adapterOrchestrationExecutionStatusLabel,
  adapterHumanConfirmationStatusLabel,
  adapterCertificationBoundaryLabel,
  adapterCertificationCheckSummary,
  adapterCertificationApplyConfirmationSummary,
  adapterRuntimeReloadExecutionConfirmationSummary,
  adapterRuntimeReloadAcceptanceConfirmationSummary,
  adapterOrchestrationDryRunConfirmationSummary,
  adapterOrchestrationExecutionConfirmationSummary,
  adapterHumanConfirmationConfirmationSummary,
  adapterSandboxProbePlanConfirmationSummary,
  adapterSandboxProbeExecutionConfirmationSummary,
  adapterSandboxProbeReviewConfirmationSummary,
  adapterProductionRouteReviewConfirmationSummary,
  adapterSandboxOrderSchemaDryRunConfirmationSummary,
  adapterPaperOrderLifecycleConfirmationSummary,
  adapterPaperRouteRunbookConfirmationSummary,
  adapterOpsStateConfirmationSummary,
  adapterPaperExecutionConfirmationSummary,
  adapterSandboxProbePlanStatusLabel,
  adapterSandboxProbeExecutionStatusLabel,
  adapterSandboxProbeReviewStatusLabel,
  adapterProductionRouteReviewStatusLabel,
  adapterSandboxOrderSchemaDryRunStatusLabel,
  adapterPaperOrderLifecycleStatusLabel,
  adapterPaperRouteRunbookStatusLabel,
  adapterOpsStateStatusLabel,
  adapterPaperExecutionStatusLabel,
  adapterHealthProbeStatusLabel,
  adapterHealthProbeCredentialSummaryLabel,
  adapterHealthProbeRouteReviewSummaryLabel,
  adapterHealthProbeCheckSummaryLabel,
  adapterHealthProbeBoundaryLabel,
  adapterSandboxOrderSchemaDryRunBoundaryLabel,
  adapterPaperOrderLifecycleBoundaryLabel,
  adapterPaperRouteRunbookBoundaryLabel,
  adapterOpsStateBoundaryLabel,
  adapterPaperExecutionBoundaryLabel,
  adapterHealthProbeBlockerLabel,
  adapterHealthProbeCheckStatusLabel,
  adapterCertificationApplyBlockerSummary,
  adapterCertificationApplyModeLabel,
  adapterCertificationApplyConfirmationLabel,
  adapterCertificationApplyConfirmationDetail,
} from "../execution/AdapterFormatters";
import {
  formatPlainNumber,
  formatPlainPercent,
  formatSignedNumber,
  formatSignedPercent,
} from "../shared/number-formatters";
import {
  DEFAULT_TEXT_SCALE,
  MAX_TEXT_SCALE,
  MIN_TEXT_SCALE,
  resolveStoredTextScale,
  resolveSystemColorScheme,
  type ColorScheme,
} from "../../lib/theme";
import { createLatestRequestCoordinator } from "../../lib/latest-request";
import {
  buildStage4PortfolioGoldenPath,
  loadStage4PortfolioWorkflows,
  recordStage4PortfolioWorkflow,
  type Stage4PortfolioWorkflow
} from "../../lib/portfolio-stage4";
import {
  createPortfolioRiskAssessment,
  loadPortfolioRiskAssessments,
  type PortfolioRiskAssessment,
  type PortfolioRiskAssessmentRequest
} from "../../lib/portfolio-m5";
import {
  buildStage5ShadowState,
  loadStage5SandboxAuthorizationPreflights,
  loadStage5SandboxAuthorizationReviews,
  loadStage5SandboxReadinessDecisions,
  loadStage5ExitAcceptance,
  loadStage5ShadowSessions,
  runStage5SandboxAuthorizationPreflight,
  runStage5SandboxAuthorizationReview,
  runStage5SandboxReadinessDecision,
  runStage5ShadowSession,
  type Stage5SandboxAuthorizationPreflight,
  type Stage5SandboxAuthorizationReview,
  type Stage5SandboxReadinessDecision,
  type Stage5ExitAcceptanceStatus,
  type Stage5ShadowSession
} from "../../lib/stage5-shadow";
import {
  authorizeStage6SandboxBatch,
  buildStage6GoldenPath,
  cancelStage6SandboxOrder,
  loadStage6SandboxAuthorizations,
  loadStage6SandboxBatch,
  loadStage6ExitAcceptance,
  loadStage6KillSwitch,
  reconcileStage6SandboxBatch,
  setStage6KillSwitch,
  submitStage6SandboxBatch,
  type Stage6SandboxBatch,
  type Stage6SandboxBatchAuthorization,
  type Stage6ExitAcceptanceStatus,
  type Stage6KillSwitch
} from "../../lib/stage6-sandbox";
import {
  loadStage7ProductionReadonlyProbes,
  runStage7ProductionReadonlyProbe,
  type Stage7ProductionReadonlyProbe
} from "../../lib/stage7-production-readonly";
import {
  loadStage8ProductionReadonlyContinuity,
  setStage8ProductionReadonlyAccess,
  type Stage8ProductionReadonlyContinuity
} from "../../lib/stage8-readonly-continuity";
import {
  createStage9ProductionAdmissionCandidate,
  createStage9ProductionAdmissionReview,
  loadStage9ProductionAdmissionCandidates,
  loadStage9ProductionAdmissionReviews,
  selectCurrentStage9ProductionAdmissionCandidate,
  type Stage9ProductionAdmissionCandidate,
  type Stage9ProductionAdmissionReview
} from "../../lib/stage9-production-admission";
import {
  appendAiReviewDecisionAndReadback,
  buildAiReviewDecisionDraft,
  aiReviewRequiresExternalApproval,
  canRunAiReviewStage3,
  createAiReviewRequestCoordinator,
  resolveAiReviewPrimaryExperiment,
  resolveAiReviewRestoredSelection,
  toggleAiReviewComparisonSelection,
  type AiReviewDecision,
  type AiReviewProviderId,
  type AiReviewProviderStatus,
  type AppendAiReviewDecisionRequest,
  type AuthoritativeAiReviewRun,
  type AiReviewRequestCoordinator,
  type LegacyAiReviewHistoryRecord
} from "../../lib/ai-review-stage3";
import {
  buildTerminalWorkspace,
  buildAgentCommitteeRounds,
  buildAiActionWorkflowState,
  buildAiEvidenceCards,
  buildAiReviewDossier,
  buildAiReviewStage3CandidateKey,
  buildAiReviewStage3ContextKey,
  resolveAiReviewDraftExperiment,
  buildAiReviewReportMarkdown,
  buildAiReviewRunRecord,
  buildAuditEvidenceReportMarkdown,
  buildAuditEvidenceSummary,
  buildEvidencePackageControlRoomRows,
  auditReportLedgerRowIsSigningEligible,
  buildAuditEvidenceReportLedgerRows,
  buildAuditEvidenceReportLedgerSummary,
  buildAuditEvidenceReportLedgerRowResearchContextReportQuery,
  buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery,
  buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery,
  buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightReviewQuery,
  buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery,
  buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery,
  buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery,
  buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery,
  buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery,
  buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel,
  buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery,
  buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle,
  buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel,
  buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery,
  buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle,
  buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel,
  buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery,
  buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle,
  buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel,
  buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery,
  buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle,
  findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow,
  findLatestP2ManifestChainPreflightAuditLedgerRow,
  findLatestP2ReadinessAcceptanceAuditLedgerRow,
  resolveP2ReadinessEvidenceCoverageReviewAuditEventReference,
  resolveP2ManifestChainPreflightAuditEventReference,
  resolveP2ReadinessAcceptanceAuditEventReference,
  buildAuditEvidenceReportLedgerRowCurrentGapActionDescriptor,
  buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness,
  buildAuditEvidenceReportLedgerRowCurrentGapReadinessQuery,
  buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle,
  buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel,
  buildAuditEvidenceReportLedgerRowP0BacklogReadinessQuery,
  buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle,
  buildAuditEvidenceReportLedgerRowP0CompletionLabel,
  buildAuditEvidenceReportLedgerRowP0CompletionQuery,
  buildAuditEvidenceReportLedgerRowP0CompletionTitle,
  buildAuditEvidenceReportLedgerRowP0ProgressLabel,
  buildAuditEvidenceReportLedgerRowP0ProgressQuery,
  buildAuditEvidenceReportLedgerRowP0PreflightQuery,
  buildAuditEvidenceReportLedgerRowP0ReadinessReportQuery,
  buildLatestAuditAidCurrentGapActionDescriptor,
  buildLatestAuditAidCurrentGapActionReadiness,
  buildResearchContextReportCoverageForContext,
  buildMarketDataRefreshOverrideAuditLedgerRows,
  buildMarketDataRefreshOverrideAuditLedgerSummary,
  buildExecutionAdapterPaperExecutionAuditLedgerRows,
  buildPortfolioPaperOrderAuditLedgerRows,
  buildAuditSigningKeyRotationChainSummary,
  buildAuditSigningKeyRotationLedgerRows,
  buildAuditReplayWorkflowState,
  buildBacktestAssumptionRows,
  buildDefaultStrategyExperimentDimensions,
  DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD,
  buildStrategyExperimentEvidenceSummary,
  buildBacktestEvidenceCards,
  buildBacktestReport,
  buildBacktestReportMarkdown,
  buildBacktestReadinessGates,
  buildBacktestRunComparisonMatrixRows,
  buildBacktestRunComparisonMatrixSummary,
  buildBacktestTradeRows,
  buildBrokerAdapterRows,
  buildExecutionAdapterCertificationApplyConfirmationRows,
  buildExecutionAdapterCertificationApplyRows,
  buildExecutionAdapterControlledRestartEvidenceRows,
  buildExecutionAdapterRestartAcceptanceRows,
  buildExecutionAdapterEnvironmentBindingRows,
  buildExecutionAdapterOrchestrationDryRunRows,
  buildExecutionAdapterOrchestrationExecutionRows,
  buildExecutionAdapterHumanConfirmationRows,
  buildExecutionAdapterSandboxProbeExecutionRows,
  buildExecutionAdapterSandboxProbePlanRows,
  buildExecutionAdapterSandboxProbeReviewRows,
  buildExecutionAdapterSandboxOrderSchemaDryRunRows,
  buildExecutionAdapterPaperOrderLifecycleRows,
  buildExecutionAdapterPaperExecutionRows,
  buildExecutionAdapterOpsStateRows,
  buildExecutionAdapterPaperRouteRunbookRows,
  buildExecutionAdapterProductionRouteReviewRows,
  buildExecutionAdapterHealthProbeRows,
  buildExecutionAdapterChainHealthRollups,
  buildExecutionAdapterSecretManifestValidationRows,
  buildExecutionAdapterSecretMaterializationRows,
  buildExecutionAdapterSecretReferenceRows,
  buildExecutionAdapterRuntimeReloadAcceptanceRows,
  buildExecutionAdapterRuntimeReloadExecutionRows,
  buildExecutionAdapterRuntimeReloadPlanRows,
  buildExecutionAdapterCertificationRows,
  buildExecutionAdapterLedgerRows,
  buildExecutionAdapterPreLiveRunbookMarkdown,
  buildExecutionAdapterPreLiveRunbookSummary,
  buildOperatorRunbookAuditCoverage,
  buildOperatorRunbookMarkdown,
  buildPreLiveRunbookAuditCoverage,
  createDefaultExecutionAdapterCertificationApplyConfirmations,
  buildGoldenPathRunbookPreview,
  buildGoldenPathWorkspaceContext,
  buildLocalReviewCoverageNextActionUrlSearch,
  buildP0AcceptanceReviewMarkdown,
  buildDesktopReleaseSummary,
  buildStage1BootstrapPreflightSummary,
  buildStage1DailyUseSummary,
  buildStage1P0DailyUseRefreshOutcome,
  buildStage1P0DailyUseArchiveBundle as buildStage1P0DailyUseArchiveBundleModel,
  buildStage1P0InvalidShareDiagnosticsCopyText,
  buildStage1P0ShareLinkBundleCopyText,
  buildP0AcceptanceSummary,
  buildP1AcceptanceSummary,
  buildP2PaperReplaySummary,
  buildP2PreLiveAcceptanceSummary,
  buildP2ManifestChainPreflightSummary,
  buildP2ManifestChainPreflightReviewMarkdown,
  buildP2ReadinessAcceptanceReviewMarkdown,
  buildP2ReadinessEvidenceCoverageReviewMarkdown,
  buildP2ReadinessAcceptanceSummary,
  buildP2ReadinessEvidenceCoverage,
  buildDailyOpsControlRoomSummary,
  buildDailyOpsControlRoomReviewMarkdown,
  buildDailyOpsControlRoomReviewReference,
  buildDailyStartBrief,
  buildDailyStartBriefMarkdown,
  buildDailyStartBriefReviewReference,
  buildStage1P0DailyUseClosure,
  buildStage1P0DailyUseArchiveReviewReference,
  buildStage1P0DailyUseStartupSnapshot,
  buildPersonalTeamUsabilityReadinessReviewMarkdown,
  buildPersonalTeamUsabilityReadinessReviewReference,
  buildPersonalTeamUsabilityReadinessSummary,
  buildOperatorRunbookSummary,
  buildP0CompletionChecklist,
  buildP0CompletionGapUrlSearch,
  buildP0GoldenPathJourney,
  buildP0PaperExecutionPreflight,
  buildP0CurrentGapActionUrlSearch,
  buildP0PlatformActionOutcome,
  buildP0PlatformActionOutcomeEvidenceLink,
  buildP0PlatformBacklogItems,
  buildP0PlatformReadinessReportMarkdown,
  buildP0PlatformReadinessSummary,
  normalizeP0CurrentGapActionId,
  buildMarketDataRefreshGuard,
  buildMarketDataProviderHealthTrendRows,
  buildMarketDataProviderHealthTrendSummary,
  buildPaperExecutionReplayGate,
  buildPaperExecutionSummaryTiles,
  buildPaperPositionRows,
  buildPaperTradingRows,
  buildPortfolioBacktestDraft,
  buildPortfolioBacktestDiagnosticRows,
  buildPortfolioBacktestReportMarkdown,
  buildPortfolioPaperOrderApprovalRows,
  buildPortfolioPaperOrderApprovalLockedLedgerMessage,
  portfolioPaperOrderApprovalResultCarriesLockedLedgerState,
  buildPortfolioPaperOrderLatestSimulationSummary,
  buildPortfolioPaperOrderLifecycleRows,
  buildPortfolioPaperOpsQueueRows,
  buildPortfolioPaperOrderSimulationRouteRiskRequest,
  buildPortfolioPaperOrderSimulationRouteRows,
  buildPortfolioPaperOrderReplayPositionRows,
  buildPortfolioPaperOrderReplaySummaryTiles,
  buildPortfolioPaperOrderStateHistoryRows,
  buildPortfolioPeerAuditPlan,
  buildPortfolioRiskRows,
  buildProductWorkAreas,
  defaultBacktestAssumptions,
  defaultPortfolioPaperOrderRouteRiskTemplate,
  buildPreLiveReadinessChecklist,
  buildPromotionReadiness,
  buildResearchContextEvidenceRows,
  buildResearchContextReadinessReportArchive,
  buildResearchContextReadinessRows,
  buildResearchPipelinePreflight,
  buildResearchRunContextBinding,
  buildResearchRunComparisonRows,
  buildResearchWorkspaceStateDraft,
  researchWorkspaceStateMatchesDraft,
  buildResearchRunExportBrowserRows,
  verifyStage5SandboxReadinessDecisionHashes,
  buildResearchRunExportIndexRows,
  buildResearchRunExportPreviewRows,
  buildResearchRunImportAuditEvent,
  buildResearchRunImportAuditAggregation,
  buildResearchRunImportDiffRows,
  buildResearchRunImportUndoAuditEvent,
  buildResearchRunImportUndoConfirmation,
  buildResearchRunImportUndoFailureAuditEvent,
  buildRiskApprovalSummary,
  buildScannerCandidates,
  buildStrategyGovernanceQueueRows,
  buildStrategyReadinessGates,
  buildStrategyRuleDraft,
  buildStrategyRuleRows,
  buildStrategyTemplateOptions,
  buildStrategyVersionDiffRows,
  buildWatchlistCacheRefreshCoverageRow,
  buildWatchlistCacheRefreshItemRows,
  buildWatchlistCacheRefreshHistoryRows,
  buildWorkflowStages,
  buildInstrumentFromSymbol,
  filterBacktestRunComparisonMatrixRows,
  filterResearchRunExportPreviewRows,
  filterResearchRunExportBrowserRows,
  filterResearchRunExportIndexRows,
  filterAuditEvidenceReportLedgerRows,
  filterMarketDataRefreshOverrideAuditLedgerRows,
  filterAuditSigningKeyRotationLedgerRows,
  filterResearchRunImportAuditEvents,
  filterResearchRunImportDiffRows,
  formatInstrumentPrice,
  mergeResearchRunImportAuditEvents,
  mergeStrategyReadinessGatesWithLocalAudit,
  researchPipelineDataSnapshotLogLabel,
  resolveLocalReviewCoverageNextActionDeepLinkState,
  resolveP0CompletionGapDeepLinkState,
  resolveP0CurrentGapActionDeepLinkState,
  resolveMarketSearchMarket,
  resolveStage1P0DailyUseShareDeepLinkStatus,
  resolveStage1P0DailyUseShareDeepLinkState,
  researchRunEvidenceLogLabel,
  resolveProductWorkAreaSelection,
  resolveResearchPipelinePreparationEvidenceRunId,
  resolveSavedResearchWorkspaceSelection,
  resolveSavedResearchWorkspaceId,
  replaceStrategyExperimentIdInUrl,
  resolveStrategyExperimentIdForCurrentSource,
  resolveStrategyExperimentIdFromUrl,
  resolveWatchlistCacheRefreshRunIdFromUrl,
  watchlistIncludesInstrument,
  AiWorkbenchAction,
  AiEvidenceCard,
  AiReviewDossier,
  AiReviewRunRecord,
  AuditEvidenceSummary,
  AuditEvidenceReportLedgerRow,
  EvidencePackageControlRoom,
  EvidencePackageControlRoomRow,
  DailyOpsControlRoomQueueItem,
  DailyOpsControlRoomReviewReference,
  DailyOpsControlRoomSummary,
  DailyStartBrief,
  DailyStartBriefReviewReference,
  Stage1P0DailyUseClosure,
  Stage1P0DailyUseArchiveReviewReference,
  Stage1P0DailyUseStartupSnapshot,
  Stage1P0DailyUseRefreshOutcome,
  Stage1P0DailyUseShareDeepLinkState,
  Stage1P0DailyUseShareDeepLinkStatus,
  PersonalTeamUsabilityReadinessReviewReference,
  P0CurrentGapActionReadiness,
  P2ManifestChainPreflightAuditEventReferenceSource,
  P2ReadinessEvidenceCoverageReviewAuditEventReferenceSource,
  P2ReadinessAcceptanceAuditEventReferenceSource,
  MarketDataRefreshOverrideAuditLedgerRow,
  ExecutionAdapterPaperExecutionAuditLedgerRow,
  AuditSigningKeyRotationChainSummary,
  AuditSigningKeyRotationLedgerRow,
  Market,
  MarketDataRefreshGuard,
  MarketDataRefreshOverride,
  AgentCommitteeRound,
  BacktestAssumptionField,
  BacktestAssumptionRow,
  BacktestEvidenceCard,
  BacktestReport,
  BacktestReadinessGate,
  BacktestRunComparisonMatrixBadge,
  BacktestRunComparisonMatrixRow,
  BacktestRunComparisonMatrixSummary,
  BacktestTradeRow,
  BrokerAdapterRow,
  ExecutionAdapterCertificationApplyConfirmationKey,
  ExecutionAdapterCertificationApplyConfirmations,
  ExecutionAdapterCertificationApplyRow,
  ExecutionAdapterOrchestrationDryRunRow,
  ExecutionAdapterOrchestrationExecutionRow,
  ExecutionAdapterHumanConfirmationRow,
  ExecutionAdapterSandboxProbeExecutionRow,
  ExecutionAdapterSandboxProbePlanRow,
  ExecutionAdapterSandboxProbeReviewRow,
  ExecutionAdapterSandboxOrderSchemaDryRunRow,
  ExecutionAdapterPaperOrderLifecycleRow,
  ExecutionAdapterPaperExecutionRow,
  ExecutionAdapterOpsStateRow,
  ExecutionAdapterPaperRouteRunbookRow,
  ExecutionAdapterProductionRouteReviewRow,
  ExecutionAdapterHealthProbeRow,
  ExecutionAdapterChainHealthRollup,
  ExecutionAdapterRuntimeReloadAcceptanceRow,
  ExecutionAdapterRuntimeReloadExecutionRow,
  ExecutionAdapterCertificationRow,
  ExecutionAdapterLedgerRow,
  GoldenPathWorkspaceContext,
  GoldenPathRunbookPreviewItem,
  LocalReviewCoverageNextActionDeepLinkState,
  P0CompletionChecklist,
  P0CompletionCriterion,
  P0AcceptanceSummary,
  P1AcceptanceSummary,
  Stage1BootstrapPreflightSummary,
  Stage1DailyUseSummary,
  P2PaperReplaySummary,
  P2PreLiveAcceptanceSummary,
  P2ManifestChainPreflightSummary,
  P2ReadinessAcceptanceSummary,
  P2ReadinessEvidenceCoverage,
  P2ReadinessEvidenceCoverageRow,
  PersonalTeamUsabilityReadinessItem,
  PersonalTeamUsabilityReadinessSummary,
  P0GoldenPathJourney,
  P0PlatformActionOutcome,
  P0PlatformBacklogItem,
  P0PaperExecutionPreflightGate,
  P0PlatformReadinessSummary,
  PaperPositionRow,
  PaperExecutionReplayGate,
  PaperExecutionSummaryTile,
  PaperTradingRow,
  PortfolioBacktestDraft,
  PortfolioBacktestDiagnosticRow,
  PortfolioPaperOrderApprovalRow,
  PortfolioPaperOrderLatestSimulationSummary,
  PortfolioPaperOrderLifecycleRow,
  PortfolioPaperOpsQueue,
  PortfolioPaperOpsQueueRow,
  PortfolioPaperOrderRouteRiskTemplate,
  PortfolioPaperOrderSimulationRouteRiskRequest,
  PortfolioPaperOrderSimulationRouteRow,
  PortfolioPaperOrderReplayPositionRow,
  PortfolioPaperOrderReplaySummaryTile,
  PortfolioPaperOrderStateHistoryRow,
  PortfolioPeerAuditPlan,
  PortfolioRiskRow,
  ProductWorkArea,
  ProductWorkAreaId,
  ResearchContextUrlState,
  ResearchPipelinePreflight,
  ResearchContextEvidenceRow,
  ResearchContextMarketCalendar,
  ResearchContextReadinessRow,
  ResearchRunDataPreparationEvidence,
  ResearchRunDataSnapshot,
  ResearchRunAudit,
  ResearchRunExportBrowserRow,
  ResearchRunExportIndexRow,
  ResearchRunImportAuditEvent,
  ResearchRunImportBlockedEvidenceBucket,
  ResearchRunImportVerifiedReportSignatureBucket,
  ResearchRunImportAuditFailureBucket,
  ResearchRunImportAuditFilter,
  ResearchRunImportFailureCategory,
  ResearchRunImportDiffRow,
  ResearchRunComparisonRow,
  ResearchRunExportPreviewRow,
  RiskApprovalSummary,
  ScannerCandidate,
  StrategyConditionKind,
  StrategyGovernanceQueue,
  StrategyGovernanceQueueRow,
  StrategyExperimentDetail,
  StrategyExperimentDimension,
  StrategyExperimentErrorCode,
  StrategyExperimentGuardrails,
  StrategyExperimentListItem,
  StrategyExperimentWalkForward,
  StrategyRuleDraft,
  StrategyRuleDraftField,
  StrategyReadinessGate,
  StrategyRuleRow,
  StrategyTemplateId,
  StrategyTemplateOption,
  StrategyVersionDiffRow,
  Timeframe,
  TerminalModule,
  TerminalWorkspace,
  WatchlistCacheRefreshCoverageRow,
  WatchlistCacheRefreshItemRow,
  WatchlistCacheRefreshHistoryRow,
  WorkflowRunLogEntry,
  WorkflowRunState,
  WorkflowStageView,
  buildResearchContextDeepLink,
  findLatestResearchRunForContext,
  replaceAiReviewRunIdInUrl,
  resolveAiReviewRunIdFromUrl,
  resolveMarketAiSelectionResearchOriginUrlState,
  resolveResearchContextUrlState,
  resolveAdapterWorkflowInstrument,
  resolveWatchlistCacheRefreshRunSelection,
  workspaceFromResearchRunAudit,
  workspaceWithAiAction,
  workspaceWithBacktestAssumption,
  workspaceWithAppliedResearchWorkspaceState,
  workspaceWithPreservedInteractiveState,
  workspaceWithResearchContextUrlState,
  workspaceWithSavedResearchWorkspaceState,
  workspaceWithSavedWatchlist,
  workspaceWithStrategyExperimentCandidate,
  workspaceWithAiStrategyDraft,
  goldenPathRunRebindIsCurrent,
  nextAiReviewHistoryRequestId,
  replayRunRequestIsCurrent,
  workspaceNeedsStrategyReaudit,
  workspaceWithStrategyLibraryItem,
  workspaceWithStrategyRuleDraftField,
  workspaceWithStrategyTemplate,
  workspaceWithSelectedTimeframe,
  workspaceWithPortfolioPeerAuditInstrument,
  workspaceWithSelectedInstrument
} from "../../lib/terminal-workbench";
import { automatedTradingWorkflowActionKey, automatedTradingWorkflowRequiresManualAction, goldenPathStatusLabel, p0AcceptanceSummaryDetail, p0AcceptanceSummaryHeadline, productWorkAreasWithGoldenPath } from "../stage1/platform-overview-formatters";
import { localReviewCoverageNextActionCopyLabel, localReviewCoverageNextActionCopyStatusLabel, localReviewCoverageNextActionFocusLabel, localReviewCoverageNextActionLabel, localReviewCoverageNextActionLoadedStatusLabel, localReviewCoverageNextActionOpenSourceLabel, localReviewCoverageNextActionStateFromParts, localReviewCoverageNextActionTitle, stage1P0DailyUseShareLinkInvalidStatusLabel, stage1P0DailyUseShareLinkLoadedStatusLabel } from "../stage1/local-review-formatters";
import { p0AcceptanceReviewBoundaryLabel, p0AcceptanceReviewCheckLabel, p0AcceptanceReviewStatusLabel, p2EvidenceCoverageDetail, p2EvidenceCoverageHeadline, p2EvidenceCoverageRowActionIcon, p2EvidenceCoverageRowActionLabel, p2EvidenceCoverageRowLabel, p2EvidenceCoverageSourceLabel, p2EvidenceCoverageStatusLabel, p2ManifestChainPreflightDetail, p2ManifestChainPreflightHeadline, p2ManifestChainPreflightStageStatusLabel, p2ManifestChainPreflightStatusLabel, p2PaperReplayBoundaryLabel, p2PaperReplaySummaryDetail, p2PaperReplaySummaryStatusLabel, p2PreLiveAcceptanceBoundaryLabel, p2PreLiveAcceptanceSummaryDetail, p2PreLiveAcceptanceSummaryHeadline, p2PreLiveAcceptanceSummaryStatusLabel, p2ReadinessAcceptanceAuditEventSourceLabel, p2ReadinessAcceptanceDetail, p2ReadinessAcceptanceHeadline, p2ReadinessAcceptanceRowLabel, p2ReadinessAcceptanceRowStatusLabel, p2ReadinessAcceptanceStatusLabel } from "../backtest/p2-readiness-formatters";
import { goldenPathActionIdLabel, goldenPathActionLabelText, p0BacklogReadinessLabelText, p0CompletionLedgerLabelText, p0CurrentGapActionReadinessLabel, p0PaperExecutionPreflightActionLabel } from "../stage1/p0-platform-formatters";
import { auditRunbookActionLabel, auditRunbookDetail, auditRunbookStatusLabel, goldenPathActionLabel, goldenPathDetail, goldenPathRunbookActionHint, goldenPathStepLabel, translateGoldenPathDetail } from "../stage1/golden-path-formatters";
import { riskLabel, strategyAiDraftContextIdentity, strategyAiDraftDiffRows, strategyAiProviderLabel, strategyConditionOptionLabel, strategyDiffRowLabel, strategyDraftHint, strategyExperimentActionErrorMessage, strategyExperimentErrorMessage, strategyExperimentMatchesSourceKey, strategyGovernanceActionLabel, strategyGovernanceChangedFieldLabel, strategyGovernanceContextLabel, strategyGovernanceDetailLabel, strategyGovernanceStageLabel, strategyGovernanceValidationLabel, strategyLibraryStatusLabel, strategyProductionBindingErrorLabel, strategyProductionSwitchReasonLabel, strategyReadinessGateLabel, strategyReadinessGateStatusLabel, strategyRuleGroupLabel, strategyRuleLabel, strategyRuleParameterLabel, strategyRuleStatusLabel, strategyTemplateDescription, strategyTemplateName, strategyValidationSourceLabel } from "../strategy/StrategyFormatters";
import { portfolioAllocationEventTypeLabel, portfolioBacktestHeadline, portfolioBacktestSummary, portfolioDiagnosticDetail, portfolioDiagnosticLabel, portfolioPaperOrderBatchStatusLabel, portfolioPaperOrderStatusLabel, portfolioPeerAuditStatusLabel, portfolioPeerAuditSummary, portfolioPreTradeRiskCheckLabel, portfolioPreTradeRiskStatusLabel, portfolioRebalanceStatusLabel, portfolioRiskDetail, portfolioRiskLabel, portfolioRiskValue, portfolioTradeReviewStatusLabel } from "../portfolio/PortfolioFormatters";
import { agentEvidenceDetail, agentEvidenceLabel, agentEvidenceValue, agentPhaseLabel, agentRoundEvidence, agentRoundThesis, agentVerdictLabel } from "../ai-review/AgentFormatters";
import { buildWatchlistCacheSummary, cacheContextKey, cacheFreshnessLabel, canRefreshSearchSuggestionCache, marketDataAdapterCacheDiagnosticsLabel, marketDataAdapterExternalTelemetryLabel, marketDataAdapterInstallGuidanceLabel, marketDataAdapterProviderErrorLabel, marketDataAdapterProviderHealthLabel, marketSearchCacheSummary, marketSearchRefreshLabel, providerHealthTrendCategoryLabel, providerHealthTrendLatestLabel, providerHealthTrendMomentumLabel, providerHealthTrendWindowLabel, settingsKeyStatusLabel, settingsStatusLabel } from "../settings/SettingsFormatters";
import { historyComparisonDeltaLabel, historyComparisonLabel, historyComparisonValue, historyRunDetailLabel } from "../research/RunHistoryFormatters";
import { scannerSignalLabel } from "../market/ScannerFormatters";
import { auditEventRecordToResearchRunImportEvent, buildResearchRunImportAuditEvidenceUrl, researchExportBrowserDetail, researchExportBrowserLabel, researchExportBrowserStatusLabel, researchExportDeepLinkStatusLabel, researchExportPreviewCount, researchExportPreviewDetail, researchExportPreviewLabel, researchExportPreviewStatusLabel, researchImportDiffDetail, researchImportDiffLabel, researchImportDiffStatusLabel, researchImportDiffValue, researchImportVerifiedReportSignatureLabel, researchRunImportAuditEventToAuditEventRecord, researchRunImportAuditEvidenceQuery } from "../audit/ResearchPackageFormatters";
import { auditReportLedgerPreLiveRunbookEvidenceLabel, auditReportLedgerReportKindLabel, auditReportLedgerSignatureLabel, auditReportLedgerStatusLabel, auditSigningKeyCapabilityLabel, auditSigningKeyEnvironmentBindingReasonLabel, auditSigningKeyEnvironmentBindingStatusLabel, auditSigningKeyRestartEvidenceReasonLabel, auditSigningKeyRestartEvidenceStatusLabel, auditSigningKeyRotationAcceptanceReasonLabel, auditSigningKeyRotationAcceptanceStatusLabel, auditSigningKeyRotationApplyReasonLabel, auditSigningKeyRotationApplyStatusLabel, auditSigningKeyRotationChainDetail, auditSigningKeyRotationChainHeadline, auditSigningKeyRotationChainStageLabel, auditSigningKeyRotationChainStageStatusLabel, auditSigningKeyRotationLedgerRowStatusLabel, auditSigningKeyRotationStepDetail, auditSigningKeyRotationStepTitle, auditSigningKeyRuntimeReloadExecutionReasonLabel, auditSigningKeyRuntimeReloadExecutionStatusLabel, auditSigningKeyRuntimeReloadPlanReasonLabel, auditSigningKeyRuntimeReloadPlanStatusLabel, auditSigningKeySecretMaterializationReasonLabel, auditSigningKeySecretMaterializationStatusLabel, auditSigningKeyStatusLabel, researchExportIndexDate, researchExportIndexDetail, researchExportIndexStatusLabel, researchImportAuditDetailLabel, researchImportAuditFailureBucketLabel, researchImportAuditRecoveryLabel, researchImportAuditStageLabel, researchImportAuditSummaryLabel, researchImportAuditTimeLabel, researchImportBlockedEvidenceBucketLabel, researchImportUndoConfirmationDetail, researchImportUndoConfirmationMessage, researchImportVerifiedReportSignatureBucketLabel, rotationLedgerStatusLabel, type AuditSigningKeyRotationLedgerStatus } from "../audit/AuditLedgerFormatters";
import { adapterChainHealthDetailLabel, adapterChainHealthStageLabel, adapterChainHealthStageStatusLabel, adapterChainHealthStatusLabel, evidencePackageControlActionLabel, evidencePackageControlImportStatusLabel, evidencePackageControlPackageStatusLabel, evidencePackageControlSignatureStatusLabel, evidencePackageControlStatusLabel, marketRefreshOverrideAuditLiveBoundaryLabel, marketRefreshOverrideAuditStatusLabel, paperReplayGateBoundaryLabel, paperReplayGateDetail, paperReplayGateHeadline, paperReplayGateItemDetail, paperReplayGateItemLabel, paperReplayGateItemStatusLabel, paperReplayGateStatusLabel } from "../audit/AuditControlFormatters";
import { StrategyConditionField, StrategyNumberField, StrategyRsiConfirmField, StrategyTemplatePicker, StrategyVolumeConfirmField } from "../strategy/StrategyFields";
import { AgentCommitteeBoard, AgentEvidenceBoard } from "../ai-review/AgentBoards";
import { MarketDataProviderHealthTrendStrip } from "../market/MarketWorkspaceComponents";
import { ChartDataStrip, KlineChartCanvas, chartKlineLimit } from "../research/ChartComponents";
import { CompactWorkflowNodes } from "../shared/WorkflowArtifactPanels";
import { AdapterChainHealthList } from "../backtest/P2ReviewPanels";
import { buildExecutionAdapterPaperExecutionAuditQuery } from "../execution/audit-query";
import { formatCacheContextRange } from "../settings/cache-range";
import { AI_REVIEW_HISTORY_PAGE_SIZE, AUDIT_REPORT_EVENTS_PAGE_SIZE, AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE, EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENTS_PAGE_SIZE, EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENT_TYPES, IMPORT_AUDIT_EVENTS_PAGE_SIZE, MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE, PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE, PORTFOLIO_PAPER_ORDER_AUDIT_EVENT_TYPES, VISIBLE_PAGE_REFRESH_INTERVAL_MS, buildFallbackMarketCalendarState, initialAiReviewRunId, initialAuditSigningKeyEnvironmentBindingState, initialAuditSigningKeyRegistryState, initialAuditSigningKeyRestartEvidenceState, initialAuditSigningKeyRotationAcceptanceState, initialAuditSigningKeyRotationApplyState, initialAuditSigningKeyRotationLedgerStatus, initialAuditSigningKeyRotationPlanState, initialAuditSigningKeyRuntimeReloadExecutionState, initialAuditSigningKeyRuntimeReloadPlanState, initialAuditSigningKeySecretMaterializationState, initialDesktopReleaseLatestState, initialExecutionAdapterHealthProbeState, initialExecutionAdapterLedgerState, initialGoldenPathStatusState, initialHandoffNotesState, initialKlinesState, initialMarketDataReadinessState, initialP0AcceptanceLatestState, initialP1AcceptanceLatestState, initialP2ManifestChainPreflightLatestState, initialP2PaperReplayLatestState, initialP2PreLiveAcceptanceLatestState, initialP2ReadinessAcceptanceLatestState, initialPortfolioBacktestState, initialProductionStrategyHandoffState, initialResearchNoteState, initialRunHistoryState, initialSettingsStatusState, initialStage1BootstrapPreflightLatestState, initialStage1DailyUseLatestState, initialStage1P0DailyUseShareDeepLinkState, initialStage1P0DailyUseShareDeepLinkStatus, initialStrategyExperimentId, initialStrategyLibraryState, initialStrategyProductionBindingState, initialStrategyValidationState, initialWorkspaceState, quantCoreBaseUrl, timeframeOptions, type AiReviewArchivePreviewState, type ProductionStrategyBindingTarget, type ResearchRunExportPackageInspectionResult } from "./initial-state";
import { StrategySummary } from "../strategy/StrategySummary";

export function App() {
  const [{ workspace, source, statusLabel, error }, setWorkspaceState] = useState(initialWorkspaceState);
  const [{ runs: runHistory }, setRunHistoryState] = useState(initialRunHistoryState);
  const [strategyExperimentHistory, setStrategyExperimentHistory] = useState<StrategyExperimentListItem[]>([]);
  const [strategyExperimentHistorySourceKey, setStrategyExperimentHistorySourceKey] = useState<string | null>(null);
  const [strategyExperimentActive, setStrategyExperimentActive] = useState<StrategyExperimentDetail | null>(null);
  const [strategyExperimentDimensions, setStrategyExperimentDimensions] = useState<StrategyExperimentDimension[]>([]);
  const [strategyExperimentDraftSourceKey, setStrategyExperimentDraftSourceKey] = useState<string | null>(null);
  const [strategyExperimentGuardrails, setStrategyExperimentGuardrails] = useState<StrategyExperimentGuardrails>({
    minimumTradeCount: 2,
    maximumDrawdownPct: 20
  });
  const [strategyExperimentWalkForward, setStrategyExperimentWalkForward] =
    useState<StrategyExperimentWalkForward | null>(DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD);
  const [isStrategyExperimentRunning, setIsStrategyExperimentRunning] = useState(false);
  const [strategyExperimentError, setStrategyExperimentError] = useState<string | null>(null);
  const [aiReviewStage3Providers, setAiReviewStage3Providers] = useState<AiReviewProviderStatus[]>([]);
  const [aiReviewStage3ProviderId, setAiReviewStage3ProviderId] = useState<AiReviewProviderId>("local");
  const [aiReviewStage3ExternalDataApproved, setAiReviewStage3ExternalDataApproved] = useState(false);
  const [aiReviewStage3PrimaryExperimentId, setAiReviewStage3PrimaryExperimentId] = useState<string | null>(null);
  const [aiReviewStage3ComparisonExperimentIds, setAiReviewStage3ComparisonExperimentIds] = useState<string[]>([]);
  const [aiReviewStage3CurrentReview, setAiReviewStage3CurrentReview] = useState<AuthoritativeAiReviewRun | null>(null);
  const [aiReviewStage3Decisions, setAiReviewStage3Decisions] = useState<AiReviewDecision[]>([]);
  const [aiReviewStage3History, setAiReviewStage3History] = useState<AuthoritativeAiReviewRun[]>([]);
  const [aiReviewStage3LegacyHistory, setAiReviewStage3LegacyHistory] = useState<LegacyAiReviewHistoryRecord[]>([]);
  const [aiReviewStage3DecisionDraft, setAiReviewStage3DecisionDraft] =
    useState<AppendAiReviewDecisionRequest>(() => buildAiReviewDecisionDraft([]));
  const [isLoadingAiReviewStage3, setIsLoadingAiReviewStage3] = useState(false);
  const [isRunningAiReviewStage3, setIsRunningAiReviewStage3] = useState(false);
  const [isAppendingAiReviewStage3Decision, setIsAppendingAiReviewStage3Decision] = useState(false);
  const [aiReviewStage3Error, setAiReviewStage3Error] = useState<string | null>(null);
  const [strategyLibraryState, setStrategyLibraryState] = useState<StrategyLibraryResult>(initialStrategyLibraryState);
  const [strategyProductionBindingState, setStrategyProductionBindingState] =
    useState<StrategyProductionBindingResult>(initialStrategyProductionBindingState);
  const [productionStrategyHandoffState, setProductionStrategyHandoffState] =
    useState<ProductionStrategyHandoffResult>(initialProductionStrategyHandoffState);
  const [bindingStrategyRevision, setBindingStrategyRevision] = useState<string | null>(null);
  const [strategyValidationState, setStrategyValidationState] =
    useState<StrategyValidationResult>(initialStrategyValidationState);
  const [researchNoteState, setResearchNoteState] = useState<ResearchNoteResult>(initialResearchNoteState);
  const [handoffNotesState, setHandoffNotesState] = useState<HandoffNotesResult>(initialHandoffNotesState);
  const [settingsStatus, setSettingsStatus] = useState<PlatformSettingsResult>(initialSettingsStatusState);
  const [hasLoadedSettingsStatus, setHasLoadedSettingsStatus] = useState(false);
  const [isSavingSettingsConfiguration, setIsSavingSettingsConfiguration] = useState(false);
  const [isTestingMonitoringWebhook, setIsTestingMonitoringWebhook] = useState(false);
  const [installingDataDependency, setInstallingDataDependency] =
    useState<InstallablePlatformDataDependency | null>(null);
  const [settingsConfigurationMessage, setSettingsConfigurationMessage] = useState<string | null>(null);
  const [executionAdapterLedger, setExecutionAdapterLedger] = useState<ExecutionAdapterLedgerResult>(
    initialExecutionAdapterLedgerState
  );
  const [executionAdapterHealthProbe, setExecutionAdapterHealthProbe] =
    useState<ExecutionAdapterHealthProbeLoadResult>(initialExecutionAdapterHealthProbeState);
  const [isRefreshingAdapterHealthProbe, setIsRefreshingAdapterHealthProbe] = useState(false);
  const [executionAdapterCertifications, setExecutionAdapterCertifications] = useState<
    ExecutionAdapterCertificationRun[]
  >([]);
  const [executionAdapterCertificationApplies, setExecutionAdapterCertificationApplies] = useState<
    ExecutionAdapterCertificationApplyResult[]
  >([]);
  const [executionAdapterControlledRestartEvidence, setExecutionAdapterControlledRestartEvidence] = useState<
    ExecutionAdapterControlledRestartEvidenceResult[]
  >([]);
  const [executionAdapterRestartAcceptances, setExecutionAdapterRestartAcceptances] = useState<
    ExecutionAdapterRestartAcceptanceResult[]
  >([]);
  const [executionAdapterEnvironmentBindings, setExecutionAdapterEnvironmentBindings] = useState<
    ExecutionAdapterEnvironmentBindingResult[]
  >([]);
  const [executionAdapterSecretMaterializations, setExecutionAdapterSecretMaterializations] = useState<
    ExecutionAdapterSecretMaterializationResult[]
  >([]);
  const [executionAdapterSecretManifestValidations, setExecutionAdapterSecretManifestValidations] = useState<
    ExecutionAdapterSecretManifestValidationResult[]
  >([]);
  const [executionAdapterSecretReferences, setExecutionAdapterSecretReferences] = useState<
    ExecutionAdapterSecretReferenceResult[]
  >([]);
  const [executionAdapterRuntimeReloadPlans, setExecutionAdapterRuntimeReloadPlans] = useState<
    ExecutionAdapterRuntimeReloadPlanResult[]
  >([]);
  const [executionAdapterRuntimeReloadExecutions, setExecutionAdapterRuntimeReloadExecutions] = useState<
    ExecutionAdapterRuntimeReloadExecutionResult[]
  >([]);
  const [executionAdapterRuntimeReloadAcceptances, setExecutionAdapterRuntimeReloadAcceptances] = useState<
    ExecutionAdapterRuntimeReloadAcceptanceResult[]
  >([]);
  const [executionAdapterOrchestrationDryRuns, setExecutionAdapterOrchestrationDryRuns] = useState<
    ExecutionAdapterOrchestrationDryRunResult[]
  >([]);
  const [executionAdapterOrchestrationExecutions, setExecutionAdapterOrchestrationExecutions] = useState<
    ExecutionAdapterOrchestrationExecutionResult[]
  >([]);
  const [executionAdapterHumanConfirmations, setExecutionAdapterHumanConfirmations] = useState<
    ExecutionAdapterHumanConfirmationResult[]
  >([]);
  const [executionAdapterSandboxProbePlans, setExecutionAdapterSandboxProbePlans] = useState<
    ExecutionAdapterSandboxProbePlanResult[]
  >([]);
  const [executionAdapterSandboxProbeExecutions, setExecutionAdapterSandboxProbeExecutions] = useState<
    ExecutionAdapterSandboxProbeExecutionResult[]
  >([]);
  const [executionAdapterSandboxProbeReviews, setExecutionAdapterSandboxProbeReviews] = useState<
    ExecutionAdapterSandboxProbeReviewResult[]
  >([]);
  const [executionAdapterSandboxOrderSchemaDryRuns, setExecutionAdapterSandboxOrderSchemaDryRuns] = useState<
    ExecutionAdapterSandboxOrderSchemaDryRunResult[]
  >([]);
  const [executionAdapterPaperOrderLifecycles, setExecutionAdapterPaperOrderLifecycles] = useState<
    ExecutionAdapterPaperOrderLifecycleResult[]
  >([]);
  const [executionAdapterPaperRouteRunbooks, setExecutionAdapterPaperRouteRunbooks] = useState<
    ExecutionAdapterPaperRouteRunbookResult[]
  >([]);
  const [executionAdapterOpsStates, setExecutionAdapterOpsStates] = useState<ExecutionAdapterOpsStateResult[]>([]);
  const [executionAdapterPaperExecutions, setExecutionAdapterPaperExecutions] = useState<
    ExecutionAdapterPaperExecutionResult[]
  >([]);
  const [executionAdapterProductionRouteReviews, setExecutionAdapterProductionRouteReviews] = useState<
    ExecutionAdapterProductionRouteReviewResult[]
  >([]);
  const [adapterCertificationApplyConfirmations, setAdapterCertificationApplyConfirmations] = useState<
    Record<string, ExecutionAdapterCertificationApplyConfirmations>
  >({});
  const [adapterRuntimeReloadAcceptanceConfirmations, setAdapterRuntimeReloadAcceptanceConfirmations] = useState<
    Record<string, ExecutionAdapterRuntimeReloadAcceptanceConfirmations>
  >({});
  const [adapterOrchestrationDryRunConfirmations, setAdapterOrchestrationDryRunConfirmations] = useState<
    Record<string, ExecutionAdapterOrchestrationDryRunConfirmations>
  >({});
  const [adapterOrchestrationExecutionConfirmations, setAdapterOrchestrationExecutionConfirmations] = useState<
    Record<string, ExecutionAdapterOrchestrationExecutionConfirmations>
  >({});
  const [adapterHumanConfirmationConfirmations, setAdapterHumanConfirmationConfirmations] = useState<
    Record<string, ExecutionAdapterHumanConfirmationConfirmations>
  >({});
  const [adapterSandboxProbePlanConfirmations, setAdapterSandboxProbePlanConfirmations] = useState<
    Record<string, ExecutionAdapterSandboxProbePlanConfirmations>
  >({});
  const [adapterSandboxProbeExecutionConfirmations, setAdapterSandboxProbeExecutionConfirmations] = useState<
    Record<string, ExecutionAdapterSandboxProbeExecutionConfirmations>
  >({});
  const [adapterSandboxProbeReviewConfirmations, setAdapterSandboxProbeReviewConfirmations] = useState<
    Record<string, ExecutionAdapterSandboxProbeReviewConfirmations>
  >({});
  const [adapterProductionRouteReviewConfirmations, setAdapterProductionRouteReviewConfirmations] = useState<
    Record<string, ExecutionAdapterProductionRouteReviewConfirmations>
  >({});
  const [adapterOpsStateConfirmations, setAdapterOpsStateConfirmations] = useState<
    Record<string, ExecutionAdapterOpsStateConfirmations>
  >({});
  const [adapterPaperExecutionConfirmations, setAdapterPaperExecutionConfirmations] = useState<
    Record<string, ExecutionAdapterPaperExecutionConfirmations>
  >({});
  const [auditSigningKeyRegistry, setAuditSigningKeyRegistry] = useState<AuditSigningKeyRegistryResult>(
    initialAuditSigningKeyRegistryState
  );
  const [auditSigningKeyRotationPlan, setAuditSigningKeyRotationPlan] = useState<AuditSigningKeyRotationPlanResult>(
    initialAuditSigningKeyRotationPlanState
  );
  const [auditSigningKeyRotationApply, setAuditSigningKeyRotationApply] =
    useState<AuditSigningKeyRotationApplyResult>(initialAuditSigningKeyRotationApplyState);
  const [auditSigningKeyRotationApplyConfirmations, setAuditSigningKeyRotationApplyConfirmations] =
    useState<AuditSigningKeyRotationApplyConfirmations>(initialAuditSigningKeyRotationApplyConfirmations);
  const [auditSigningKeyRestartEvidence, setAuditSigningKeyRestartEvidence] =
    useState<AuditSigningKeyControlledRestartEvidenceResult>(initialAuditSigningKeyRestartEvidenceState);
  const [auditSigningKeyRestartEvidenceConfirmations, setAuditSigningKeyRestartEvidenceConfirmations] =
    useState<AuditSigningKeyRestartEvidenceConfirmations>(initialAuditSigningKeyRestartEvidenceConfirmations);
  const [auditSigningKeySecretMaterialization, setAuditSigningKeySecretMaterialization] =
    useState<AuditSigningKeySecretMaterializationResult>(initialAuditSigningKeySecretMaterializationState);
  const [auditSigningKeySecretMaterializationConfirmations, setAuditSigningKeySecretMaterializationConfirmations] = useState<AuditSigningKeySecretMaterializationConfirmations>(
    initialAuditSigningKeySecretMaterializationConfirmations
  );
  const [auditSigningKeyEnvironmentBinding, setAuditSigningKeyEnvironmentBinding] =
    useState<AuditSigningKeyEnvironmentBindingResult>(initialAuditSigningKeyEnvironmentBindingState);
  const [auditSigningKeyEnvironmentBindingConfirmations, setAuditSigningKeyEnvironmentBindingConfirmations] =
    useState<AuditSigningKeyEnvironmentBindingConfirmations>(initialAuditSigningKeyEnvironmentBindingConfirmations);
  const [auditSigningKeyRuntimeReloadPlan, setAuditSigningKeyRuntimeReloadPlan] =
    useState<AuditSigningKeyRuntimeReloadPlanResult>(initialAuditSigningKeyRuntimeReloadPlanState);
  const [auditSigningKeyRuntimeReloadPlanConfirmations, setAuditSigningKeyRuntimeReloadPlanConfirmations] =
    useState<AuditSigningKeyRuntimeReloadPlanConfirmations>(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
  const [auditSigningKeyRuntimeReloadExecution, setAuditSigningKeyRuntimeReloadExecution] =
    useState<AuditSigningKeyRuntimeReloadExecutionResult>(initialAuditSigningKeyRuntimeReloadExecutionState);
  const [auditSigningKeyRuntimeReloadExecutionConfirmations, setAuditSigningKeyRuntimeReloadExecutionConfirmations] =
    useState<AuditSigningKeyRuntimeReloadExecutionConfirmations>(
      initialAuditSigningKeyRuntimeReloadExecutionConfirmations
    );
  const [auditSigningKeyRotationAcceptance, setAuditSigningKeyRotationAcceptance] =
    useState<AuditSigningKeyRotationAcceptanceResult>(initialAuditSigningKeyRotationAcceptanceState);
  const [auditSigningKeyRotationAcceptanceConfirmations, setAuditSigningKeyRotationAcceptanceConfirmations] =
    useState<AuditSigningKeyRotationAcceptanceConfirmations>(
      initialAuditSigningKeyRotationAcceptanceConfirmations
    );
  const [auditSigningKeyRotationPlanEventId, setAuditSigningKeyRotationPlanEventId] = useState<string | null>(null);
  const [auditSigningKeyRotationApplyEventId, setAuditSigningKeyRotationApplyEventId] = useState<string | null>(null);
  const [auditSigningKeyRotationLedgerStatus, setAuditSigningKeyRotationLedgerStatus] =
    useState<AuditSigningKeyRotationLedgerStatus>(initialAuditSigningKeyRotationLedgerStatus);
  const [goldenPathState, setGoldenPathState] = useState<GoldenPathStatusResult>(initialGoldenPathStatusState);
  const [isAutomatedTradingWorkflowRunning, setIsAutomatedTradingWorkflowRunning] = useState(false);
  const [automatedTradingWorkflowStatus, setAutomatedTradingWorkflowStatus] = useState<string | null>(null);
  const [desktopReleaseLatestState, setDesktopReleaseLatestState] = useState<DesktopReleaseLatestResult>(
    initialDesktopReleaseLatestState
  );
  const [stage1BootstrapPreflightLatestState, setStage1BootstrapPreflightLatestState] =
    useState<Stage1BootstrapPreflightLatestResult>(initialStage1BootstrapPreflightLatestState);
  const [stage1DailyUseLatestState, setStage1DailyUseLatestState] = useState<Stage1DailyUseLatestResult>(
    initialStage1DailyUseLatestState
  );
  const [stage1P0DailyUseRefreshOutcome, setStage1P0DailyUseRefreshOutcome] =
    useState<Stage1P0DailyUseRefreshOutcome | null>(null);
  const [p0AcceptanceLatestState, setP0AcceptanceLatestState] = useState<P0AcceptanceLatestResult>(
    initialP0AcceptanceLatestState
  );
  const [p1AcceptanceLatestState, setP1AcceptanceLatestState] = useState<P1AcceptanceLatestResult>(
    initialP1AcceptanceLatestState
  );
  const [p2PaperReplayLatestState, setP2PaperReplayLatestState] = useState<P2PaperReplayLatestResult>(
    initialP2PaperReplayLatestState
  );
  const [p2PreLiveAcceptanceLatestState, setP2PreLiveAcceptanceLatestState] =
    useState<P2PreLiveAcceptanceLatestResult>(initialP2PreLiveAcceptanceLatestState);
  const [p2ReadinessAcceptanceLatestState, setP2ReadinessAcceptanceLatestState] =
    useState<P2ReadinessAcceptanceLatestResult>(initialP2ReadinessAcceptanceLatestState);
  const [p2ReadinessAcceptanceAuditEvent, setP2ReadinessAcceptanceAuditEvent] =
    useState<AuditEventRecord | null>(null);
  const [p2ReadinessAcceptanceReviewAuditEvent, setP2ReadinessAcceptanceReviewAuditEvent] =
    useState<AuditEventRecord | null>(null);
  const [p2ReadinessEvidenceCoverageReviewAuditEvent, setP2ReadinessEvidenceCoverageReviewAuditEvent] =
    useState<AuditEventRecord | null>(null);
  const [p2ManifestChainPreflightLatestState, setP2ManifestChainPreflightLatestState] =
    useState<P2ManifestChainPreflightLatestResult>(initialP2ManifestChainPreflightLatestState);
  const [p2ManifestChainPreflightAuditEvent, setP2ManifestChainPreflightAuditEvent] =
    useState<AuditEventRecord | null>(null);
  const [p2ManifestChainPreflightReviewAuditEvent, setP2ManifestChainPreflightReviewAuditEvent] =
    useState<AuditEventRecord | null>(null);
  const [portfolioBacktestState, setPortfolioBacktestState] =
    useState<PortfolioBacktestResult>(initialPortfolioBacktestState);
  const [portfolioPaperOrderBatches, setPortfolioPaperOrderBatches] = useState<PortfolioPaperOrderBatch[]>([]);
  const [portfolioPaperOrderLifecycleEvents, setPortfolioPaperOrderLifecycleEvents] = useState<
    PortfolioPaperOrderLifecycleEvent[]
  >([]);
  const [portfolioPaperOrderSimulations, setPortfolioPaperOrderSimulations] = useState<PortfolioPaperOrderSimulation[]>([]);
  const [portfolioPaperOrderReplay, setPortfolioPaperOrderReplay] = useState<PortfolioPaperOrderReplay | null>(null);
  const [portfolioRouteRiskTemplate, setPortfolioRouteRiskTemplate] =
    useState<PortfolioPaperOrderRouteRiskTemplate>(defaultPortfolioPaperOrderRouteRiskTemplate);
  const [portfolioPaperOrderStateHistories, setPortfolioPaperOrderStateHistories] = useState<
    PortfolioPaperOrderStateHistory[]
  >([]);
  const [portfolioPaperOrderHistoryError, setPortfolioPaperOrderHistoryError] = useState<string | null>(null);
  const [portfolioStage4Workflows, setPortfolioStage4Workflows] = useState<Stage4PortfolioWorkflow[]>([]);
  const [portfolioRiskAssessments, setPortfolioRiskAssessments] = useState<PortfolioRiskAssessment[]>([]);
  const [portfolioRiskAssessmentError, setPortfolioRiskAssessmentError] = useState<string | null>(null);
  const [isRunningPortfolioRiskAssessment, setIsRunningPortfolioRiskAssessment] = useState(false);
  const [autoTradingSnapshot, setAutoTradingSnapshot] =
    useState<AutoTradingSnapshot | null>(null);
  const [portfolioProductionRiskError, setPortfolioProductionRiskError] = useState<string | null>(null);
  const [isLoadingPortfolioProductionRisk, setIsLoadingPortfolioProductionRisk] = useState(false);
  const [portfolioStage4RefreshGeneration, setPortfolioStage4RefreshGeneration] = useState(0);
  const [stage5ShadowSessions, setStage5ShadowSessions] = useState<Stage5ShadowSession[]>([]);
  const [stage5SandboxReadinessDecisions, setStage5SandboxReadinessDecisions] =
    useState<Stage5SandboxReadinessDecision[]>([]);
  const [stage5SandboxAuthorizationPreflights, setStage5SandboxAuthorizationPreflights] =
    useState<Stage5SandboxAuthorizationPreflight[]>([]);
  const [stage5SandboxAuthorizationReviews, setStage5SandboxAuthorizationReviews] =
    useState<Stage5SandboxAuthorizationReview[]>([]);
  const [stage5ExitAcceptance, setStage5ExitAcceptance] = useState<Stage5ExitAcceptanceStatus | null>(null);
  const [stage5ExitAcceptanceError, setStage5ExitAcceptanceError] = useState<string | null>(null);
  const [stage5ShadowError, setStage5ShadowError] = useState<string | null>(null);
  const [stage6SandboxAuthorizations, setStage6SandboxAuthorizations] = useState<Stage6SandboxBatchAuthorization[]>([]);
  const [stage6SandboxBatch, setStage6SandboxBatch] = useState<Stage6SandboxBatch | null>(null);
  const [stage6ExitAcceptance, setStage6ExitAcceptance] = useState<Stage6ExitAcceptanceStatus | null>(null);
  const [stage6KillSwitch, setStage6KillSwitchState] = useState<Stage6KillSwitch | null>(null);
  const [stage6SandboxError, setStage6SandboxError] = useState<string | null>(null);
  const [isRunningStage6Sandbox, setIsRunningStage6Sandbox] = useState(false);
  const [stage7ProductionReadonlyProbes, setStage7ProductionReadonlyProbes] =
    useState<Stage7ProductionReadonlyProbe[]>([]);
  const [stage7ProductionReadonlyError, setStage7ProductionReadonlyError] = useState<string | null>(null);
  const [isRunningStage7ProductionReadonly, setIsRunningStage7ProductionReadonly] = useState(false);
  const [stage8ProductionReadonlyContinuity, setStage8ProductionReadonlyContinuity] =
    useState<Stage8ProductionReadonlyContinuity | null>(null);
  const [stage8ProductionReadonlyError, setStage8ProductionReadonlyError] = useState<string | null>(null);
  const [isUpdatingStage8ProductionReadonly, setIsUpdatingStage8ProductionReadonly] = useState(false);
  const [stage9ProductionAdmissionCandidates, setStage9ProductionAdmissionCandidates] =
    useState<Stage9ProductionAdmissionCandidate[]>([]);
  const [stage9ProductionAdmissionClock, setStage9ProductionAdmissionClock] = useState(Date.now);
  const [stage9ProductionAdmissionReviews, setStage9ProductionAdmissionReviews] =
    useState<Stage9ProductionAdmissionReview[]>([]);
  const [stage9ProductionAdmissionError, setStage9ProductionAdmissionError] = useState<string | null>(null);
  const [isRunningStage9ProductionAdmission, setIsRunningStage9ProductionAdmission] = useState(false);
  const [researchNoteDraft, setResearchNoteDraft] = useState("");
  const [researchNoteProviders, setResearchNoteProviders] = useState<AiReviewProviderStatus[]>([
    {
      providerId: "local",
      configured: true,
      model: null,
      sanitizedBaseUrl: null
    }
  ]);
  const [researchNoteProviderId, setResearchNoteProviderId] = useState<AiReviewProviderId>("local");
  const [researchNoteExternalDataApproved, setResearchNoteExternalDataApproved] = useState(false);
  const [researchNoteGenerationError, setResearchNoteGenerationError] = useState<string | null>(null);
  const [researchNoteGenerationStatus, setResearchNoteGenerationStatus] = useState<string | null>(null);
  const [handoffNoteDraft, setHandoffNoteDraft] = useState("");
  const [klinesState, setKlinesState] = useState(initialKlinesState);
  const [marketDataReadinessState, setMarketDataReadinessState] = useState<MarketDataReadinessResult>(
    initialMarketDataReadinessState
  );
  const [marketCalendarState, setMarketCalendarState] = useState<MarketCalendarResult>(() =>
    buildFallbackMarketCalendarState(workspace.selectedInstrument.market)
  );
  const [marketDiscoveryResult, setMarketDiscoveryResult] = useState<MarketDiscoveryResult | null>(null);
  const [isLoadingMarketDiscovery, setIsLoadingMarketDiscovery] = useState(false);
  const marketDiscoveryRequestIdRef = useRef(0);
  const marketDiscoveryRequestMarketRef = useRef<MarketDiscoveryParams["market"] | null>(null);
  const [marketAiSelection, setMarketAiSelection] =
    useState<MarketAiSelectionLoadResult>({ source: "fallback" });
  const [marketAiSelectionRequestKey, setMarketAiSelectionRequestKey] = useState<string | null>(null);
  const [isLoadingMarketAiSelection, setIsLoadingMarketAiSelection] = useState(false);
  const marketAiSelectionRequestRef = useRef(createLatestRequestCoordinator());
  const [marketAiSelectionReview, setMarketAiSelectionReview] =
    useState<MarketAiSelectionReviewLoadResult>({ source: "fallback" });
  const [isLoadingMarketAiSelectionReview, setIsLoadingMarketAiSelectionReview] =
    useState(false);
  const marketAiSelectionReviewRequestRef = useRef(createLatestRequestCoordinator());
  const [marketAiSelectionStatistics, setMarketAiSelectionStatistics] =
    useState<MarketAiSelectionQualityStatisticsLoadResult>({ source: "fallback" });
  const [isLoadingMarketAiSelectionStatistics, setIsLoadingMarketAiSelectionStatistics] =
    useState(false);
  const marketAiSelectionStatisticsRequestRef = useRef(createLatestRequestCoordinator());
  const [pendingMarketAiSelectionResearchOrigin, setPendingMarketAiSelectionResearchOrigin] =
    useState<(MarketAiSelectionResearchOrigin & { market: Market; symbol: string }) | null>(
      resolveInitialMarketAiSelectionResearchOrigin,
    );
  const [marketInformationResult, setMarketInformationResult] =
    useState<MarketInformationResult | null>(null);
  const [marketInformationNewsResult, setMarketInformationNewsResult] =
    useState<MarketInformationResult | null>(null);
  const [marketInformationMarket, setMarketInformationMarket] =
    useState<Market>(() => workspace.selectedInstrument.market);
  const [isLoadingMarketInformation, setIsLoadingMarketInformation] = useState(false);
  const [isLoadingMarketInformationNews, setIsLoadingMarketInformationNews] = useState(false);
  const marketInformationRequestRef = useRef(createLatestRequestCoordinator());
  const marketInformationNewsRequestRef = useRef(createLatestRequestCoordinator());
  const marketInformationRequestContextRef = useRef<string | null>(null);
  const [locale, setLocale] = useState<Locale>(() =>
    resolveInitialLocale(typeof window === "undefined" ? null : window.localStorage.getItem("aiqt.locale"))
  );
  const [colorSchemePreference, setColorSchemePreference] = useState<ColorScheme | null>(null);
  const [textScale, setTextScale] = useState(() =>
    resolveStoredTextScale(
      typeof window === "undefined" ? null : window.localStorage.getItem("aiqt.text-scale"),
    )
  );
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(() =>
    resolveSystemColorScheme(
      typeof window === "undefined"
        ? true
        : window.matchMedia("(prefers-color-scheme: dark)").matches,
    )
  );
  const colorScheme = colorSchemePreference ?? systemColorScheme;
  const initialWorkAreaSelection = resolveInitialWorkAreaSelection(workspace);
  const [activeWorkAreaId, setActiveWorkAreaId] = useState<ProductWorkAreaId>(() => initialWorkAreaSelection.areaId);
  const [activeLoopStepId, setActiveLoopStepId] = useState(() => initialWorkAreaSelection.quantLoopStepId);
  const [activeWorkflowStageId, setActiveWorkflowStageId] = useState(
    () => initialWorkAreaSelection.workflowStageId
  );
  const [pendingStrategyGovernanceAction, setPendingStrategyGovernanceAction] =
    useState<StrategyGovernanceQueueRow | null>(null);
  const [workflowRunState, setWorkflowRunState] = useState<WorkflowRunState>(() => createWorkflowRunState());
  const workflowStages = buildWorkflowStages(workspace, workflowRunState);
  const [marketDraft, setMarketDraft] = useState<Market>(workspace.selectedInstrument.market);
  const [symbolDraft, setSymbolDraft] = useState(workspace.selectedInstrument.symbol);
  const [searchSuggestions, setSearchSuggestions] = useState<MarketSearchSuggestion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isSymbolSearching, setIsSymbolSearching] = useState(false);
  const [hasUnsavedWatchlistChanges, setHasUnsavedWatchlistChanges] = useState(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const [isSavingResearchNote, setIsSavingResearchNote] = useState(false);
  const [isGeneratingResearchNoteDraft, setIsGeneratingResearchNoteDraft] = useState(false);
  const [isSavingHandoffNote, setIsSavingHandoffNote] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);
  const [isSavingResearchWorkspace, setIsSavingResearchWorkspace] = useState(false);
  const [isRunningP0AiReview, setIsRunningP0AiReview] = useState(false);
  const [isSubmittingPaperExecution, setIsSubmittingPaperExecution] = useState(false);
  const [isRunningPortfolioBacktest, setIsRunningPortfolioBacktest] = useState(false);
  const [isRecordingPortfolioPaperOrders, setIsRecordingPortfolioPaperOrders] = useState(false);
  const [approvingPortfolioPaperOrderId, setApprovingPortfolioPaperOrderId] = useState<string | null>(null);
  const [simulatingPortfolioPaperOrderId, setSimulatingPortfolioPaperOrderId] = useState<string | null>(null);
  const [isSimulatingPortfolioPaperOrderBatch, setIsSimulatingPortfolioPaperOrderBatch] = useState(false);
  const [isRecordingPortfolioStage4Workflow, setIsRecordingPortfolioStage4Workflow] = useState(false);
  const [isRunningStage5Shadow, setIsRunningStage5Shadow] = useState(false);
  const [isPreparingPortfolioPeers, setIsPreparingPortfolioPeers] = useState(false);
  const [isLoadingDesktopRelease, setIsLoadingDesktopRelease] = useState(false);
  const [isGeneratingStage1BootstrapPreflight, setIsGeneratingStage1BootstrapPreflight] = useState(false);
  const [isGeneratingStage1DailyUse, setIsGeneratingStage1DailyUse] = useState(false);
  const [isLoadingP0Acceptance, setIsLoadingP0Acceptance] = useState(false);
  const [isLoadingP1Acceptance, setIsLoadingP1Acceptance] = useState(false);
  const [isLoadingP2PaperReplay, setIsLoadingP2PaperReplay] = useState(false);
  const [isLoadingP2PreLiveAcceptance, setIsLoadingP2PreLiveAcceptance] = useState(false);
  const [isLoadingP2ReadinessAcceptance, setIsLoadingP2ReadinessAcceptance] = useState(false);
  const [isGeneratingP2ReadinessAcceptance, setIsGeneratingP2ReadinessAcceptance] = useState(false);
  const [isLoadingP2ManifestChainPreflight, setIsLoadingP2ManifestChainPreflight] = useState(false);
  const [isGeneratingP2ManifestChainPreflight, setIsGeneratingP2ManifestChainPreflight] = useState(false);
  const [isSavingAiReviewRecord, setIsSavingAiReviewRecord] = useState(false);
  const [isLoadingAiReviewHistory, setIsLoadingAiReviewHistory] = useState(false);
  const [isInspectingExportPackage, setIsInspectingExportPackage] = useState(false);
  const [isIndexingExportPackages, setIsIndexingExportPackages] = useState(false);
  const [refreshingCacheKey, setRefreshingCacheKey] = useState<string | null>(null);
  const [marketDataRefreshOverride, setMarketDataRefreshOverride] = useState<MarketDataRefreshOverride | null>(null);
  const [marketDataRefreshOverrideAuditStatus, setMarketDataRefreshOverrideAuditStatus] =
    useState<MarketDataRefreshOverrideAuditStatus>({ state: "idle" });
  const [recordingAdapterCertificationId, setRecordingAdapterCertificationId] = useState<string | null>(null);
  const [applyingAdapterCertificationId, setApplyingAdapterCertificationId] = useState<string | null>(null);
  const [recordingAdapterRuntimeReloadAcceptanceId, setRecordingAdapterRuntimeReloadAcceptanceId] =
    useState<string | null>(null);
  const [recordingAdapterOrchestrationDryRunId, setRecordingAdapterOrchestrationDryRunId] =
    useState<string | null>(null);
  const [recordingAdapterOrchestrationExecutionId, setRecordingAdapterOrchestrationExecutionId] =
    useState<string | null>(null);
  const [recordingAdapterHumanConfirmationId, setRecordingAdapterHumanConfirmationId] =
    useState<string | null>(null);
  const [recordingAdapterSandboxProbePlanId, setRecordingAdapterSandboxProbePlanId] =
    useState<string | null>(null);
  const [recordingAdapterSandboxProbeExecutionId, setRecordingAdapterSandboxProbeExecutionId] =
    useState<string | null>(null);
  const [recordingAdapterSandboxProbeReviewId, setRecordingAdapterSandboxProbeReviewId] =
    useState<string | null>(null);
  const [recordingAdapterProductionRouteReviewId, setRecordingAdapterProductionRouteReviewId] =
    useState<string | null>(null);
  const [recordingAdapterOpsStateId, setRecordingAdapterOpsStateId] = useState<string | null>(null);
  const [recordingAdapterPaperExecutionId, setRecordingAdapterPaperExecutionId] = useState<string | null>(null);
  const [isRefreshingWatchlistCache, setIsRefreshingWatchlistCache] = useState(false);
  const [marketRefreshIssue, setMarketRefreshIssue] = useState<string | null>(null);
  const [watchlistCacheRefreshHistory, setWatchlistCacheRefreshHistory] = useState<CacheWatchlistRefreshRun[]>([]);
  const [selectedWatchlistCacheRefreshRunId, setSelectedWatchlistCacheRefreshRunId] = useState<string | null>(
    resolveInitialWatchlistCacheRefreshRunId
  );
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isResearchPipelineConfirmationOpen, setIsResearchPipelineConfirmationOpen] = useState(false);
  const [isLiveTradingGateDialogOpen, setIsLiveTradingGateDialogOpen] = useState(false);
  const [hasUnsavedSettingsConfiguration, setHasUnsavedSettingsConfiguration] = useState(false);
  const [pendingSettingsWorkAreaId, setPendingSettingsWorkAreaId] = useState<ProductWorkAreaId | null>(null);
  const [researchCompletionNotice, setResearchCompletionNotice] = useState<{
    dataRows: number;
    instrumentName: string;
    readbackReady: boolean;
    runId: string;
    symbol: string;
    timeframe: Timeframe;
  } | null>(null);
  const researchPipelineConfirmationDialogRef = useRef<HTMLDialogElement | null>(null);
  const researchPipelineConfirmationCancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const liveTradingGateDialogRef = useRef<HTMLDialogElement | null>(null);
  const settingsUnsavedDialogRef = useRef<HTMLDialogElement | null>(null);
  const settingsUnsavedContinueButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingSettingsNavigationActionRef = useRef<(() => void) | null>(null);
  const settingsSaveRequestIdRef = useRef(0);
  const [paperExecutionRecord, setPaperExecutionRecord] = useState<PaperExecutionRecord | null>(null);
  const [p0PaperSimulationRecord, setP0PaperSimulationRecord] = useState<P0PaperSimulationResponse | null>(null);
  const [promotionCandidateRecord, setPromotionCandidateRecord] = useState<PromotionCandidateRecord | null>(null);
  const [aiReviewRunRecords, setAiReviewRunRecords] = useState<AiReviewRunRecordEnvelope[]>([]);
  const [aiReviewArchivePreview, setAiReviewArchivePreview] = useState<AiReviewArchivePreviewState>({
    aiReviewDecisions: [],
    authoritativeAiReviewRecords: [],
    error: null,
    legacyAiReviewRecords: [],
    runId: null,
    status: "idle"
  });
  const [inspectedExportPackage, setInspectedExportPackage] = useState<ResearchRunExportPackage | null>(null);
  const [inspectedExportArchiveSnapshot, setInspectedExportArchiveSnapshot] = useState<{
    aiReviewArchiveSnapshot: AiReviewArchiveImportSnapshot;
    exportPackage: ResearchRunExportPackage;
    runId: string;
  } | null>(null);
  const [pendingImportPackage, setPendingImportPackage] = useState<{
    aiReviewArchiveSnapshot: AiReviewArchiveImportSnapshot;
    exportPackage: ResearchRunExportPackage;
    fileName: string;
  } | null>(null);
  const initialImportAuditEvidenceDeepLink = resolveInitialImportAuditEvidenceDeepLink();
  const initialPaperExecutionDeepLink = resolveInitialPaperExecutionDeepLink();
  const [auditEvidenceReportEvents, setAuditEvidenceReportEvents] = useState<AuditEventRecord[]>([]);
  const [executionAcceptanceAuditEvents, setExecutionAcceptanceAuditEvents] =
    useState<AuditEventRecord[]>([]);
  const [marketDataRefreshOverrideAuditEvents, setMarketDataRefreshOverrideAuditEvents] = useState<AuditEventRecord[]>([]);
  const [portfolioPaperOrderAuditEvents, setPortfolioPaperOrderAuditEvents] = useState<AuditEventRecord[]>([]);
  const [executionAdapterPaperExecutionAuditEvents, setExecutionAdapterPaperExecutionAuditEvents] = useState<
    AuditEventRecord[]
  >([]);
  const [auditSigningKeyRotationEvents, setAuditSigningKeyRotationEvents] = useState<AuditEventRecord[]>([]);
  const [auditEvidenceReportPagination, setAuditEvidenceReportPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [auditEvidenceReportQuery, setAuditEvidenceReportQuery] = useState(resolveInitialAuditEvidenceReportQuery);
  const [auditEvidenceReportOffset, setAuditEvidenceReportOffset] = useState(0);
  const [marketDataRefreshOverrideAuditPagination, setMarketDataRefreshOverrideAuditPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [marketDataRefreshOverrideAuditQuery, setMarketDataRefreshOverrideAuditQuery] = useState("");
  const [marketDataRefreshOverrideAuditOffset, setMarketDataRefreshOverrideAuditOffset] = useState(0);
  const [portfolioPaperOrderAuditPagination, setPortfolioPaperOrderAuditPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [portfolioPaperOrderAuditQuery, setPortfolioPaperOrderAuditQuery] =
    useState(resolveInitialAuditEvidenceReportQuery);
  const [portfolioPaperOrderAuditOffset, setPortfolioPaperOrderAuditOffset] = useState(0);
  const [executionAdapterPaperExecutionAuditPagination, setExecutionAdapterPaperExecutionAuditPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [executionAdapterPaperExecutionAuditQuery, setExecutionAdapterPaperExecutionAuditQuery] =
    useState(resolveInitialAuditEvidenceReportQuery);
  const [executionAdapterPaperExecutionAuditOffset, setExecutionAdapterPaperExecutionAuditOffset] = useState(0);
  const [researchRunImportAuditEvents, setResearchRunImportAuditEvents] = useState<ResearchRunImportAuditEvent[]>([]);
  const [researchRunImportAuditPagination, setResearchRunImportAuditPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [researchRunImportAuditQuery, setResearchRunImportAuditQuery] = useState(resolveInitialImportAuditEvidenceQuery);
  const [researchRunImportAuditOffset, setResearchRunImportAuditOffset] = useState(0);
  const [focusedAdapterPaperExecutionAuditEventId, setFocusedAdapterPaperExecutionAuditEventId] =
    useState<string | null>(() => resolveInitialAdapterPaperExecutionAuditEventId());
  const [focusedImportAuditEventId, setFocusedImportAuditEventId] = useState<string | null>(() => resolveInitialImportAuditEventId());
  const [copiedImportAuditEvidenceEventId, setCopiedImportAuditEvidenceEventId] = useState<string | null>(null);
  const [copiedP0ActionOutcomeEvidenceId, setCopiedP0ActionOutcomeEvidenceId] = useState<string | null>(null);
  const [copiedP0AcceptanceReview, setCopiedP0AcceptanceReview] = useState(false);
  const [copiedP2ReadinessAcceptanceReview, setCopiedP2ReadinessAcceptanceReview] = useState(false);
  const [copiedP2ReadinessEvidenceCoverageReview, setCopiedP2ReadinessEvidenceCoverageReview] = useState(false);
  const [copiedP2ManifestChainPreflightReview, setCopiedP2ManifestChainPreflightReview] = useState(false);
  const [copiedPersonalTeamReadinessReview, setCopiedPersonalTeamReadinessReview] = useState(false);
  const [copiedDailyOpsControlRoomReview, setCopiedDailyOpsControlRoomReview] = useState(false);
  const [copiedDailyStartBriefReview, setCopiedDailyStartBriefReview] = useState(false);
  const [copiedStage1P0DailyUseHandoff, setCopiedStage1P0DailyUseHandoff] = useState(false);
  const [copiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUsePrimaryLink] = useState(false);
  const [copiedStage1P0ShareLinkBundle, setCopiedStage1P0ShareLinkBundle] = useState(false);
  const [copiedStage1P0DailyUseArchive, setCopiedStage1P0DailyUseArchive] = useState(false);
  const [copiedStage1P0DailyUseStartupSnapshot, setCopiedStage1P0DailyUseStartupSnapshot] = useState(false);
  const [copiedStage1P0InvalidShareDiagnostics, setCopiedStage1P0InvalidShareDiagnostics] = useState(false);
  const [copiedStage1P0DailyUseRefreshOutcome, setCopiedStage1P0DailyUseRefreshOutcome] = useState(false);
  const [copiedStage1P0DailyUseRefreshOutcomeLink, setCopiedStage1P0DailyUseRefreshOutcomeLink] = useState(false);
  const [copiedP0ReadinessReport, setCopiedP0ReadinessReport] = useState(false);
  const [copiedOperatorRunbook, setCopiedOperatorRunbook] = useState(false);
  const [copiedPreLiveRunbook, setCopiedPreLiveRunbook] = useState(false);
  const [isRecordingOperatorRunbook, setIsRecordingOperatorRunbook] = useState(false);
  const [isRecordingPreLiveRunbook, setIsRecordingPreLiveRunbook] = useState(false);
  const [savingP0ReadinessReport, setSavingP0ReadinessReport] = useState(false);
  const [savingP0AcceptanceReview, setSavingP0AcceptanceReview] = useState(false);
  const [savingP2ReadinessAcceptanceReview, setSavingP2ReadinessAcceptanceReview] = useState(false);
  const [savingP2ReadinessEvidenceCoverageReview, setSavingP2ReadinessEvidenceCoverageReview] = useState(false);
  const [savingP2ManifestChainPreflightReview, setSavingP2ManifestChainPreflightReview] = useState(false);
  const [savingPersonalTeamReadinessReview, setSavingPersonalTeamReadinessReview] = useState(false);
  const [savingDailyOpsControlRoomReview, setSavingDailyOpsControlRoomReview] = useState(false);
  const [savingDailyStartBriefReview, setSavingDailyStartBriefReview] = useState(false);
  const [savingStage1P0DailyUseArchive, setSavingStage1P0DailyUseArchive] = useState(false);
  const [copiedAuditEvidenceSummary, setCopiedAuditEvidenceSummary] = useState(false);
  const [copiedAuditEvidenceReport, setCopiedAuditEvidenceReport] = useState(false);
  const [copiedResearchContextLink, setCopiedResearchContextLink] = useState(false);
  const [copiedResearchContextReadinessReport, setCopiedResearchContextReadinessReport] = useState(false);
  const [importAuditEvidenceDeepLinkStatus, setImportAuditEvidenceDeepLinkStatus] =
    useState<ImportAuditEvidenceDeepLinkStatus | null>(
      initialImportAuditEvidenceDeepLink ? { ...initialImportAuditEvidenceDeepLink, status: "idle", error: null } : null
    );
  const [paperExecutionDeepLinkStatus, setPaperExecutionDeepLinkStatus] =
    useState<PaperExecutionDeepLinkStatus | null>(
      initialPaperExecutionDeepLink ? { ...initialPaperExecutionDeepLink, status: "idle", error: null } : null
    );
  const [researchRunExportBrowserQuery, setResearchRunExportBrowserQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");
  const [researchRunImportDiffQuery, setResearchRunImportDiffQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");
  const [indexedExportPackages, setIndexedExportPackages] = useState<ResearchRunExportPackage[]>([]);
  const [aiReviewHistoryPagination, setAiReviewHistoryPagination] = useState<AiReviewRunHistoryPagination | null>(null);
  const [aiReviewHistoryQuery, setAiReviewHistoryQuery] = useState("");
  const [aiReviewHistoryOffset, setAiReviewHistoryOffset] = useState(0);
  const [isApplyingImportPackage, setIsApplyingImportPackage] = useState(false);
  const [isLoadingAuditEvidenceReportEvents, setIsLoadingAuditEvidenceReportEvents] = useState(false);
  const [isLoadingMarketDataRefreshOverrideAudit, setIsLoadingMarketDataRefreshOverrideAudit] = useState(false);
  const [isLoadingPortfolioPaperOrderAudit, setIsLoadingPortfolioPaperOrderAudit] = useState(false);
  const [isLoadingExecutionAdapterPaperExecutionAudit, setIsLoadingExecutionAdapterPaperExecutionAudit] =
    useState(false);
  const [isLoadingAuditSigningKeyRotationEvents, setIsLoadingAuditSigningKeyRotationEvents] = useState(false);
  const [isLoadingResearchRunImportAudit, setIsLoadingResearchRunImportAudit] = useState(false);
  const [isApplyingAuditSigningKeyRotationPlan, setIsApplyingAuditSigningKeyRotationPlan] = useState(false);
  const [isPreparingAuditSigningKeyRotationPlan, setIsPreparingAuditSigningKeyRotationPlan] = useState(false);
  const [isRecordingAuditSigningKeyRestartEvidence, setIsRecordingAuditSigningKeyRestartEvidence] = useState(false);
  const [isRecordingAuditSigningKeySecretMaterialization, setIsRecordingAuditSigningKeySecretMaterialization] =
    useState(false);
  const [isRecordingAuditSigningKeyEnvironmentBinding, setIsRecordingAuditSigningKeyEnvironmentBinding] =
    useState(false);
  const [isRecordingAuditSigningKeyRuntimeReloadPlan, setIsRecordingAuditSigningKeyRuntimeReloadPlan] =
    useState(false);
  const [isRecordingAuditSigningKeyRuntimeReloadExecution, setIsRecordingAuditSigningKeyRuntimeReloadExecution] =
    useState(false);
  const [isRecordingAuditSigningKeyRotationAcceptance, setIsRecordingAuditSigningKeyRotationAcceptance] =
    useState(false);
  const [signingAuditReportEventId, setSigningAuditReportEventId] = useState<string | null>(null);
  const [verifyingAuditReportEventId, setVerifyingAuditReportEventId] = useState<string | null>(null);
  const [revokingAuditReportEventId, setRevokingAuditReportEventId] = useState<string | null>(null);
  const manualSelectionVersionRef = useRef(0);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const researchNoteDraftRef = useRef(researchNoteDraft);
  researchNoteDraftRef.current = researchNoteDraft;
  const researchNoteDraftVersionRef = useRef(0);
  const researchNoteDraftGenerationRequestIdRef = useRef(0);
  const researchNoteDraftGenerationAbortControllerRef = useRef<AbortController | null>(null);
  const applyGeneratedResearchNoteDraft = useCallback((body: string) => {
    researchNoteDraftRef.current = body;
    setResearchNoteDraft(body);
  }, []);
  const updateResearchNoteDraft = useCallback((body: string) => {
    researchNoteDraftVersionRef.current += 1;
    researchNoteDraftRef.current = body;
    setResearchNoteDraft(body);
  }, []);
  const editResearchNoteDraft = useCallback((body: string) => {
    if (researchNoteDraftGenerationAbortControllerRef.current) {
      researchNoteDraftGenerationAbortControllerRef.current.abort();
      researchNoteDraftGenerationAbortControllerRef.current = null;
      researchNoteDraftGenerationRequestIdRef.current += 1;
      setIsGeneratingResearchNoteDraft(false);
      setResearchNoteGenerationError(null);
      setResearchNoteGenerationStatus("检测到手动编辑，已停止 AI 生成并保留当前内容。");
    }
    updateResearchNoteDraft(body);
  }, [updateResearchNoteDraft]);
  const savedResearchWorkspaceSelectionAppliedRef = useRef(hasExplicitWorkAreaUrl());
  const chartRequestIdRef = useRef(0);
  const marketCalendarRequestIdRef = useRef(0);
  const workspaceQuoteRequestIdRef = useRef(0);
  const workflowRunIdRef = useRef(0);
  const automatedTradingWorkflowRunIdRef = useRef(0);
  const automatedTradingWorkflowContextRef = useRef<string | null>(null);
  const automatedTradingWorkflowActionKeyRef = useRef<string | null>(null);
  const automatedTradingWorkflowActionInFlightRef = useRef(false);
  const automatedTradingWorkflowActionErrorRef = useRef<string | null>(null);
  const strategyValidationRequestIdRef = useRef(0);
  const strategyExperimentRequestGenerationRef = useRef(0);
  const initialStrategyExperimentIdRef = useRef(initialStrategyExperimentId);
  const initialAiReviewRunIdRef = useRef(initialAiReviewRunId);
  const aiReviewRunRestoreAbortControllerRef = useRef<AbortController | null>(null);
  const strategyExperimentSourceKeyRef = useRef<string | null>(null);
  const strategyExperimentWorkspaceRef = useRef(workspace);
  const strategyExperimentActiveRef = useRef(strategyExperimentActive);
  const aiReviewStage3RequestCoordinatorRef = useRef<AiReviewRequestCoordinator | null>(null);
  const aiReviewStage3ProviderInitializedRef = useRef(false);
  if (aiReviewStage3RequestCoordinatorRef.current === null) {
    aiReviewStage3RequestCoordinatorRef.current = createAiReviewRequestCoordinator();
  }
  const aiReviewHistoryRequestIdRef = useRef(0);
  const aiReviewArchivePreviewRequestIdRef = useRef(0);
  const auditEvidenceReportRequestIdRef = useRef(0);
  const executionAcceptanceAuditRequestIdRef = useRef(0);
  const marketDataRefreshOverrideAuditRequestIdRef = useRef(0);
  const portfolioProductionRiskRequestIdRef = useRef(0);
  const portfolioPaperOrderAuditRequestIdRef = useRef(0);
  const executionAdapterPaperExecutionAuditRequestIdRef = useRef(0);
  const researchRunImportAuditRequestIdRef = useRef(0);
  const exportPackageRequestCoordinatorRef = useRef(createLatestRequestCoordinator());
  const portfolioStage4RequestCoordinatorRef = useRef(createPortfolioStage4RequestCoordinator());
  const portfolioPeerAuditRequestIdRef = useRef(0);
  const portfolioPeerAuditActiveRef = useRef(false);
  const stage5ShadowRequestIdRef = useRef(0);
  const importAuditCopyResetTimerRef = useRef<number | null>(null);
  const auditEvidenceSummaryCopyResetTimerRef = useRef<number | null>(null);
  const auditEvidenceReportCopyResetTimerRef = useRef<number | null>(null);
  const researchContextLinkCopyResetTimerRef = useRef<number | null>(null);
  const researchContextReadinessReportCopyResetTimerRef = useRef<number | null>(null);
  const operatorRunbookCopyResetTimerRef = useRef<number | null>(null);
  const preLiveRunbookCopyResetTimerRef = useRef<number | null>(null);
  const initialImportAuditEvidenceDeepLinkRef = useRef(initialImportAuditEvidenceDeepLink);
  const initialPaperExecutionDeepLinkRef = useRef(initialPaperExecutionDeepLink);
  const klinesStateRef = useRef(initialKlinesState);
  const historicalKlineRequestRef = useRef<string | null>(null);
  const symbolSearchRequestIdRef = useRef(0);
  const workspaceScrollPositionsRef = useRef<
    Partial<Record<ProductWorkAreaId, { surfaceTop: number; windowTop: number }>>
  >({});
  const activeWorkAreaIdRef = useRef(activeWorkAreaId);
  const activeWorkspaceSurfaceRef = useRef<HTMLElement | null>(null);
  const rememberActiveWorkspaceScrollPosition = useCallback((surfaceTop: number) => {
    const workAreaId = activeWorkAreaIdRef.current;
    workspaceScrollPositionsRef.current[workAreaId] = {
      surfaceTop,
      windowTop:
        typeof window === "undefined"
          ? (workspaceScrollPositionsRef.current[workAreaId]?.windowTop ?? 0)
          : window.scrollY
    };
  }, []);
  useLayoutEffect(() => {
    activeWorkAreaIdRef.current = activeWorkAreaId;
    const position = workspaceScrollPositionsRef.current[activeWorkAreaId] ?? {
      surfaceTop: 0,
      windowTop: 0
    };
    if (activeWorkspaceSurfaceRef.current) {
      activeWorkspaceSurfaceRef.current.scrollTop = position.surfaceTop;
    }
    if (typeof window !== "undefined") {
      window.scrollTo(0, position.windowTop);
    }
  }, [activeWorkAreaId]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rememberWindowScroll = () => {
      const workAreaId = activeWorkAreaIdRef.current;
      workspaceScrollPositionsRef.current[workAreaId] = {
        surfaceTop:
          activeWorkspaceSurfaceRef.current?.scrollTop ??
          workspaceScrollPositionsRef.current[workAreaId]?.surfaceTop ??
          0,
        windowTop: window.scrollY
      };
    };
    window.addEventListener("scroll", rememberWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", rememberWindowScroll);
  }, []);
  const setWatchlistCacheRefreshRunSelection = useCallback((runId: string | null) => {
    setSelectedWatchlistCacheRefreshRunId(runId);
    replaceWatchlistCacheRefreshRunUrlParam(runId);
  }, []);
  const i18n = createI18n(locale);
  const strategyExperimentI18nRef = useRef(i18n);
  strategyExperimentI18nRef.current = i18n;
  const goldenPath = goldenPathState.goldenPath;
  const productWorkAreas = productWorkAreasWithGoldenPath(buildProductWorkAreas(workspace), goldenPath);
  const automatedTradingWorkAreas = automatedTradingWorkAreaIds.flatMap((workAreaId) => {
    const workArea = productWorkAreas.find((candidate) => candidate.id === workAreaId);
    return workArea ? [workArea] : [];
  });
  const activeWorkArea =
    productWorkAreas.find((area) => area.id === activeWorkAreaId) ?? productWorkAreas.find((area) => area.id === "research");
  const activeLoopStep = workspace.quantLoop.find((step) => step.id === activeLoopStepId) ?? workspace.quantLoop[0];
  const activeWorkflowAccent = activeWorkArea?.accent ?? workflowAccentByStep[activeLoopStep?.id ?? "research"] ?? "market";
  const canSaveResearchWorkspace = activeWorkAreaId === "market" || activeWorkAreaId === "research";
  const currentResearchWorkspaceStateDraft = useMemo(
    () => buildResearchWorkspaceStateDraft(workspace, activeWorkAreaId),
    [
      activeWorkAreaId,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.name,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]
  );
  const isResearchWorkspaceSaved = researchWorkspaceStateMatchesDraft(
    workspace.researchWorkspaceState,
    currentResearchWorkspaceStateDraft
  );
  const latestChartBar = klinesState.bars.at(-1);
  const agentCommitteeRounds = buildAgentCommitteeRounds(workspace);
  const aiEvidenceCards = buildAiEvidenceCards(workspace);
  const researchRunContextBinding = buildResearchRunContextBinding(workspace);
  const strategyDraftRequiresReaudit = workspaceNeedsStrategyReaudit(workspace);
  const currentResearchRunId = researchRunContextBinding.canUseRun ? workspace.researchRun?.runId : null;
  const currentResearchRunIdRef = useRef(currentResearchRunId);
  currentResearchRunIdRef.current = currentResearchRunId;
  const resetStage4PortfolioBusyState = useCallback(() => {
    setIsRunningPortfolioBacktest(false);
    setIsRecordingPortfolioPaperOrders(false);
    setApprovingPortfolioPaperOrderId(null);
    setSimulatingPortfolioPaperOrderId(null);
    setIsSimulatingPortfolioPaperOrderBatch(false);
    setIsRecordingPortfolioStage4Workflow(false);
  }, []);
  useLayoutEffect(() => {
    resetStage4PortfolioBusyState();
    portfolioPeerAuditRequestIdRef.current += 1;
    portfolioPeerAuditActiveRef.current = false;
    setIsPreparingPortfolioPeers(false);
    setIsRunningStage5Shadow(false);
    stage5ShadowRequestIdRef.current += 1;
    portfolioStage4RequestCoordinatorRef.current.invalidate(currentResearchRunIdRef.current);
  }, [currentResearchRunId, resetStage4PortfolioBusyState]);
  const strategyExperimentUsableSourceKey =
    researchRunContextBinding.canUseRun && workspace.researchRun
      ? `${workspace.researchRun.runId}:${workspace.researchRun.strategyRevision}`
      : null;
  const strategyExperimentSourceRunId = strategyExperimentUsableSourceKey ? workspace.researchRun!.runId : null;
  const strategyExperimentStrategyRevision = strategyExperimentUsableSourceKey
    ? workspace.researchRun!.strategyRevision
    : null;
  strategyExperimentSourceKeyRef.current = strategyExperimentUsableSourceKey;
  strategyExperimentWorkspaceRef.current = workspace;
  strategyExperimentActiveRef.current = strategyExperimentActive;
  const visibleStrategyExperimentDimensions =
    strategyExperimentDraftSourceKey === strategyExperimentUsableSourceKey
      ? strategyExperimentDimensions
      : [];
  const visibleStrategyExperimentHistory =
    strategyExperimentHistorySourceKey === strategyExperimentUsableSourceKey
      ? strategyExperimentHistory
      : [];
  const visibleStrategyExperimentActive =
    strategyExperimentUsableSourceKey &&
    strategyExperimentActive &&
    strategyExperimentMatchesSourceKey(strategyExperimentActive, strategyExperimentUsableSourceKey)
      ? strategyExperimentActive
      : null;
  const aiReviewStage3Experiments = visibleStrategyExperimentActive
    && !visibleStrategyExperimentHistory.some(
      (experiment) => experiment.experimentId === visibleStrategyExperimentActive.experimentId
    )
      ? [visibleStrategyExperimentActive, ...visibleStrategyExperimentHistory]
      : visibleStrategyExperimentHistory;
  const aiReviewStage3ContextKey = buildAiReviewStage3ContextKey({
    workspaceId: activeWorkAreaId,
    researchWorkspaceId: workspace.researchWorkspaceState?.workspaceId ?? null,
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    timeframe: workspace.selectedTimeframe,
    sourceRunId: strategyExperimentSourceRunId,
    strategyRevision: strategyExperimentStrategyRevision
  });
  const aiReviewStage3CandidateKey = buildAiReviewStage3CandidateKey(
    visibleStrategyExperimentActive?.experimentId ?? null,
    aiReviewStage3Experiments
  );
  const aiReviewStage3DraftExperiment = resolveAiReviewDraftExperiment(
    aiReviewStage3PrimaryExperimentId ?? visibleStrategyExperimentActive?.experimentId ?? null,
    aiReviewStage3Experiments,
    visibleStrategyExperimentDimensions,
    strategyExperimentGuardrails,
    strategyExperimentWalkForward
  );
  const aiReviewStage3SelectedExperiment = resolveAiReviewPrimaryExperiment(
    aiReviewStage3Experiments.find(
      (experiment) => experiment.experimentId === aiReviewStage3PrimaryExperimentId
    ) ?? null,
    aiReviewStage3Experiments
  );
  const aiReviewStage3PrimaryReference = aiReviewStage3CurrentReview?.primaryExperiment ?? null;
  const aiReviewStage3PrimaryCandidate = visibleStrategyExperimentActive?.candidates.find(
    (candidate) => candidate.candidateId === visibleStrategyExperimentActive.selectedCandidateId
  ) ?? null;
  const aiReviewStage3PrimaryCandidateAvailable = Boolean(
    aiReviewStage3PrimaryReference
    && visibleStrategyExperimentActive?.status === "completed"
    && visibleStrategyExperimentActive.experimentId === aiReviewStage3PrimaryReference.experimentId
    && visibleStrategyExperimentActive.sourceRunId === aiReviewStage3PrimaryReference.sourceRunId
    && visibleStrategyExperimentActive.strategyRevision === aiReviewStage3PrimaryReference.strategyRevision
    && visibleStrategyExperimentActive.snapshotId === aiReviewStage3PrimaryReference.snapshotId
    && visibleStrategyExperimentActive.definitionHash === aiReviewStage3PrimaryReference.definitionHash
    && visibleStrategyExperimentActive.resultHash === aiReviewStage3PrimaryReference.resultHash
    && visibleStrategyExperimentActive.selectedCandidateId === aiReviewStage3PrimaryReference.selectedCandidateId
    && visibleStrategyExperimentActive.strategyLineageKey === aiReviewStage3CurrentReview?.strategyLineageKey
    && visibleStrategyExperimentActive.definition.canonicalDataHash === aiReviewStage3PrimaryReference.canonicalDataHash
    && visibleStrategyExperimentActive.snapshot.startAt === aiReviewStage3PrimaryReference.dataRange.startAt
    && visibleStrategyExperimentActive.snapshot.endAt === aiReviewStage3PrimaryReference.dataRange.endAt
    && aiReviewStage3PrimaryCandidate?.candidateRevision === aiReviewStage3PrimaryReference.candidateRevision
    && aiReviewStage3PrimaryCandidate.eligible
    && aiReviewStage3PrimaryCandidate.testMetrics
  );
  const visibleStrategyExperimentUrlId = resolveStrategyExperimentIdForCurrentSource(
    visibleStrategyExperimentActive,
    strategyExperimentUsableSourceKey
  );
  const aiReviewDossier = visibleStrategyExperimentActive
    ? buildAiReviewDossier(workspace, visibleStrategyExperimentActive)
    : buildAiReviewDossier(workspace);
  const currentAiReviewRunRecord = visibleStrategyExperimentActive
    ? buildAiReviewRunRecord(workspace, visibleStrategyExperimentActive)
    : buildAiReviewRunRecord(workspace);
  const scannerCandidates = buildScannerCandidates(workspace);
  const portfolioRiskRows = buildPortfolioRiskRows(workspace);
  const portfolioBacktestDiagnosticRows = buildPortfolioBacktestDiagnosticRows(portfolioBacktestState.portfolio);
  const portfolioBacktestDraft = buildPortfolioBacktestDraft(runHistory, currentResearchRunId);
  const portfolioBacktestDraftKey =
    portfolioBacktestDraft.request?.legs.map((leg) => `${leg.runId}:${leg.targetWeight}`).join("|") ??
    portfolioBacktestDraft.status;
  const portfolioPeerAuditPlan = buildPortfolioPeerAuditPlan(workspace, runHistory);
  const riskApprovalSummary = buildRiskApprovalSummary(workspace);
  const activePaperExecutionRecord =
    paperExecutionRecord?.runId && paperExecutionRecord.runId === currentResearchRunId ? paperExecutionRecord : null;
  const activeP0PaperSimulationRecord =
    p0PaperSimulationRecord?.runId && p0PaperSimulationRecord.runId === currentResearchRunId
      ? p0PaperSimulationRecord
      : null;
  const activePromotionCandidateRecord =
    promotionCandidateRecord?.runId && promotionCandidateRecord.runId === currentResearchRunId ? promotionCandidateRecord : null;
  const activeAiReviewRunRecords = currentResearchRunId
    ? aiReviewRunRecords.filter((record) => record.runId === currentResearchRunId)
    : [];
  const paperExecutionSummaryTiles = buildPaperExecutionSummaryTiles(workspace, activePaperExecutionRecord);
  const paperPositionRows = buildPaperPositionRows(workspace, activePaperExecutionRecord);
  const paperTradingRows = buildPaperTradingRows(workspace);
  const brokerAdapterRows = buildBrokerAdapterRows(workspace);
  const executionAdapterLedgerRows = buildExecutionAdapterLedgerRows(executionAdapterLedger.adapterLedger);
  const executionAdapterHealthProbeRows = buildExecutionAdapterHealthProbeRows(executionAdapterHealthProbe.adapterHealthProbe);
  const executionAdapterCertificationRows = buildExecutionAdapterCertificationRows(executionAdapterCertifications);
  const executionAdapterCertificationApplyRows = buildExecutionAdapterCertificationApplyRows(executionAdapterCertificationApplies);
  const executionAdapterControlledRestartEvidenceRows = buildExecutionAdapterControlledRestartEvidenceRows(executionAdapterControlledRestartEvidence);
  const executionAdapterRestartAcceptanceRows = buildExecutionAdapterRestartAcceptanceRows(executionAdapterRestartAcceptances);
  const executionAdapterEnvironmentBindingRows = buildExecutionAdapterEnvironmentBindingRows(executionAdapterEnvironmentBindings);
  const executionAdapterSecretMaterializationRows = buildExecutionAdapterSecretMaterializationRows(executionAdapterSecretMaterializations);
  const executionAdapterSecretManifestValidationRows = buildExecutionAdapterSecretManifestValidationRows(
    executionAdapterSecretManifestValidations
  );
  const executionAdapterSecretReferenceRows = buildExecutionAdapterSecretReferenceRows(executionAdapterSecretReferences);
  const executionAdapterRuntimeReloadPlanRows = buildExecutionAdapterRuntimeReloadPlanRows(executionAdapterRuntimeReloadPlans);
  const executionAdapterRuntimeReloadExecutionRows = buildExecutionAdapterRuntimeReloadExecutionRows(
    executionAdapterRuntimeReloadExecutions
  );
  const executionAdapterRuntimeReloadAcceptanceRows = buildExecutionAdapterRuntimeReloadAcceptanceRows(
    executionAdapterRuntimeReloadAcceptances
  );
  const executionAdapterOrchestrationDryRunRows = buildExecutionAdapterOrchestrationDryRunRows(
    executionAdapterOrchestrationDryRuns
  );
  const executionAdapterOrchestrationExecutionRows = buildExecutionAdapterOrchestrationExecutionRows(
    executionAdapterOrchestrationExecutions
  );
  const executionAdapterHumanConfirmationRows = buildExecutionAdapterHumanConfirmationRows(
    executionAdapterHumanConfirmations
  );
  const executionAdapterSandboxProbePlanRows = buildExecutionAdapterSandboxProbePlanRows(
    executionAdapterSandboxProbePlans
  );
  const executionAdapterSandboxProbeExecutionRows = buildExecutionAdapterSandboxProbeExecutionRows(
    executionAdapterSandboxProbeExecutions
  );
  const executionAdapterSandboxProbeReviewRows = buildExecutionAdapterSandboxProbeReviewRows(
    executionAdapterSandboxProbeReviews
  );
  const executionAdapterProductionRouteReviewRows = buildExecutionAdapterProductionRouteReviewRows(
    executionAdapterProductionRouteReviews
  );
  const latestCcxtProductionRouteReviewId = latestRecordedProductionRouteReviewIdForAdapter(
    executionAdapterProductionRouteReviews,
    "ccxt-live"
  );
  const latestStage7ProductionReadonlyProbe = stage7ProductionReadonlyProbes.find(
    (probe) => probe.productionRouteReviewId === latestCcxtProductionRouteReviewId
  ) ?? null;
  const executionAdapterSandboxOrderSchemaDryRunRows = buildExecutionAdapterSandboxOrderSchemaDryRunRows(
    executionAdapterSandboxOrderSchemaDryRuns
  );
  const executionAdapterPaperOrderLifecycleRows = buildExecutionAdapterPaperOrderLifecycleRows(
    executionAdapterPaperOrderLifecycles
  );
  const executionAdapterPaperRouteRunbookRows = buildExecutionAdapterPaperRouteRunbookRows(
    executionAdapterPaperRouteRunbooks
  );
  const executionAdapterOpsStateRows = buildExecutionAdapterOpsStateRows(executionAdapterOpsStates);
  const executionAdapterPaperExecutionRows = buildExecutionAdapterPaperExecutionRows(executionAdapterPaperExecutions);
  const executionAdapterChainHealthRollups = buildExecutionAdapterChainHealthRollups({
    adapterOpsStateRows: executionAdapterOpsStateRows,
    adapterPaperExecutionRows: executionAdapterPaperExecutionRows,
    brokerRows: brokerAdapterRows,
    environmentBindingRows: executionAdapterEnvironmentBindingRows,
    humanConfirmationRows: executionAdapterHumanConfirmationRows,
    orchestrationDryRunRows: executionAdapterOrchestrationDryRunRows,
    orchestrationExecutionRows: executionAdapterOrchestrationExecutionRows,
    paperOrderLifecycleRows: executionAdapterPaperOrderLifecycleRows,
    paperRouteRunbookRows: executionAdapterPaperRouteRunbookRows,
    productionRouteReviewRows: executionAdapterProductionRouteReviewRows,
    runtimeReloadAcceptanceRows: executionAdapterRuntimeReloadAcceptanceRows,
    runtimeReloadExecutionRows: executionAdapterRuntimeReloadExecutionRows,
    runtimeReloadPlanRows: executionAdapterRuntimeReloadPlanRows,
    sandboxOrderSchemaDryRunRows: executionAdapterSandboxOrderSchemaDryRunRows,
    sandboxProbeExecutionRows: executionAdapterSandboxProbeExecutionRows,
    sandboxProbePlanRows: executionAdapterSandboxProbePlanRows,
    sandboxProbeReviewRows: executionAdapterSandboxProbeReviewRows,
    secretManifestValidationRows: executionAdapterSecretManifestValidationRows,
    secretMaterializationRows: executionAdapterSecretMaterializationRows,
    secretReferenceRows: executionAdapterSecretReferenceRows
  });
  const terminalBrokerAdapterRows = brokerAdapterRows.map((row) => ({
    ...row,
    adapter: brokerAdapterName(i18n, row),
    certification: brokerCertificationLabel(i18n, row.certification),
    nextStep: brokerNextStepLabel(i18n, row.nextStep)
  }));
  const terminalExecutionAdapterLedgerRows = executionAdapterLedgerRows.map((row) => ({
    ...row,
    adapter: adapterLedgerAdapterName(i18n, row),
    label: adapterLedgerLabel(i18n, row),
    nextStep: adapterLedgerNextStep(i18n, row),
    reason: adapterLedgerReason(i18n, row)
  }));
  const terminalExecutionAdapterHealthProbeRows = executionAdapterHealthProbeRows.map((row) => ({
    ...row,
    blockerSummary: adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary),
    boundary: adapterHealthProbeBoundaryLabel(i18n, row.boundary),
    credentialSummary: adapterHealthProbeCredentialSummaryLabel(i18n, row.credentialSummary),
    statusLabel: adapterHealthProbeStatusLabel(i18n, row.statusLabel)
  }));
  const terminalExecutionAdapterChainHealthRollups = executionAdapterChainHealthRollups.map((row) => ({
    ...row,
    adapterName: adapterCertificationAdapterName(i18n, row.adapterId),
    blockerLabel: row.blockerStageId
      ? adapterChainHealthStageLabel(i18n, row.blockerStageId, row.blockerLabel)
      : row.blockerLabel,
    detail: adapterChainHealthDetailLabel(i18n, row),
    headline: adapterChainHealthStatusLabel(i18n, row.status)
  }));
  const portfolioPaperOrderLifecycleRows = buildPortfolioPaperOrderLifecycleRows(
    portfolioPaperOrderBatches,
    portfolioPaperOrderLifecycleEvents
  );
  const portfolioPaperOrderApprovalRows = buildPortfolioPaperOrderApprovalRows(
    portfolioPaperOrderBatches,
    portfolioPaperOrderLifecycleEvents
  );
  const portfolioPaperOrderReplaySummaryTiles = buildPortfolioPaperOrderReplaySummaryTiles(portfolioPaperOrderReplay);
  const portfolioPaperOrderReplayPositionRows = buildPortfolioPaperOrderReplayPositionRows(portfolioPaperOrderReplay);
  const portfolioPaperOrderLatestSimulationSummary = buildPortfolioPaperOrderLatestSimulationSummary(
    portfolioPaperOrderSimulations,
    portfolioPaperOrderReplay,
    portfolioPaperOrderStateHistories
  );
  const portfolioPaperOrderStateHistoryRows =
    buildPortfolioPaperOrderStateHistoryRows(portfolioPaperOrderStateHistories);
  const portfolioPaperOrderSimulationRouteRows = buildPortfolioPaperOrderSimulationRouteRows(
    portfolioPaperOrderApprovalRows,
    portfolioPaperOrderSimulations,
    portfolioPaperOrderStateHistoryRows,
    executionAdapterPaperExecutionRows
  );
  const paperExecutionReplayGate = buildPaperExecutionReplayGate({
    adapterPaperExecutionRows: executionAdapterPaperExecutionRows,
    currentRunId: currentResearchRunId,
    paperExecution: activePaperExecutionRecord,
    portfolioApprovalRows: portfolioPaperOrderApprovalRows,
    portfolioOrderLifecycleRows: portfolioPaperOrderLifecycleRows,
    portfolioOrderReplay: portfolioPaperOrderReplay,
    portfolioOrderSimulations: portfolioPaperOrderSimulations,
    portfolioStateHistoryRows: portfolioPaperOrderStateHistoryRows
  });
  const portfolioPaperOpsQueue = buildPortfolioPaperOpsQueueRows({
    approvalRows: portfolioPaperOrderApprovalRows,
    lifecycleRows: portfolioPaperOrderLifecycleRows,
    routeRows: portfolioPaperOrderSimulationRouteRows,
    stateHistoryRows: portfolioPaperOrderStateHistoryRows
  });
  const portfolioPaperOrderRouteRiskRequest = useMemo(
    () => buildPortfolioPaperOrderSimulationRouteRiskRequest(portfolioRouteRiskTemplate, portfolioPaperOrderReplay),
    [portfolioPaperOrderReplay, portfolioRouteRiskTemplate]
  );
  const portfolioStage4LatestBatch = [...portfolioPaperOrderBatches]
    .filter((batch) => batch.baseRunId === currentResearchRunId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  const portfolioStage4Workflow = selectCurrentStage4PortfolioWorkflow(
    portfolioStage4Workflows,
    currentResearchRunId,
    portfolioStage4LatestBatch?.batchId
  );
  const portfolioRiskAssessment = portfolioRiskAssessments.find(
    (assessment) => assessment.workflowId === portfolioStage4Workflow?.workflowId
  ) ?? null;
  const portfolioStage4GoldenPath = buildStage4PortfolioGoldenPath({
    baseRunId: currentResearchRunId ?? "",
    portfolio: portfolioBacktestState.portfolio,
    batches: portfolioPaperOrderBatches,
    lifecycle: portfolioPaperOrderLifecycleEvents,
    approvalRows: portfolioPaperOrderApprovalRows,
    routeRows: portfolioPaperOrderSimulationRouteRows,
    stateHistory: portfolioPaperOrderStateHistories.find(
      (history) => history.batchId === portfolioStage4LatestBatch?.batchId
    ),
    replay: portfolioPaperOrderReplay,
    workflow: portfolioStage4Workflow
  });
  const stage5ShadowState = buildStage5ShadowState(
    portfolioStage4Workflow,
    stage5ShadowSessions,
    stage5SandboxReadinessDecisions,
    stage5SandboxAuthorizationPreflights,
    stage5SandboxAuthorizationReviews,
    executionAdapterSandboxProbeExecutionRows,
    executionAdapterSandboxProbeReviewRows
  );
  const stage6SandboxAuthorization = stage6SandboxAuthorizations.find((row) =>
    row.workflowHash === portfolioStage4Workflow?.workflowHash &&
    row.reviewHash === stage5ShadowState.authorizationReview?.reviewHash
  ) ?? null;
  const stage6GoldenPath = buildStage6GoldenPath(
    portfolioStage4Workflow,
    stage5ShadowState.session,
    stage5ShadowState.readinessDecision,
    stage5ShadowState.authorizationPreflight,
    stage5ShadowState.authorizationReview,
    stage6SandboxAuthorization,
    stage6SandboxBatch
  );
  const stage9ProductionAdmissionCandidate = selectCurrentStage9ProductionAdmissionCandidate(
    stage9ProductionAdmissionCandidates, stage6SandboxAuthorization?.authorizationId,
    stage9ProductionAdmissionClock
  );
  const stage9ProductionAdmissionReview = stage9ProductionAdmissionReviews.find((row) =>
    row.candidateId === stage9ProductionAdmissionCandidate?.candidateId
  ) ?? null;
  const stage9ProductionAdmissionExpiry = stage9ProductionAdmissionCandidate?.expiresAt ?? null;
  useEffect(() => {
    if (!stage9ProductionAdmissionExpiry) return;
    const delay = Math.max(0, Math.min(
      Date.parse(stage9ProductionAdmissionExpiry) - Date.now() + 1,
      2_147_483_647
    ));
    const timer = window.setTimeout(() => setStage9ProductionAdmissionClock(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [stage9ProductionAdmissionExpiry]);
  const persistedPaperTradingRows = activePaperExecutionRecord
    ? paperTradingRowsFromExecutionRecord(activePaperExecutionRecord)
    : null;
  const visiblePaperTradingRows = persistedPaperTradingRows ?? paperTradingRows;
  const currentAiReviewArchivePreview: AiReviewArchivePreviewState =
    aiReviewArchivePreview.runId === currentResearchRunId
      ? aiReviewArchivePreview
      : {
          aiReviewDecisions: [],
          authoritativeAiReviewRecords: [],
          error: null,
          legacyAiReviewRecords: [],
          runId: currentResearchRunId ?? null,
          status: currentResearchRunId ? "loading" : "idle"
        };
  const researchRunExportPreviewRows = buildResearchRunExportPreviewRows({
    aiReviewArchiveError: currentAiReviewArchivePreview.error,
    aiReviewArchiveStatus: currentAiReviewArchivePreview.status,
    aiReviewDecisions: currentAiReviewArchivePreview.aiReviewDecisions,
    aiReviewRecords: activeAiReviewRunRecords,
    authoritativeAiReviewRecords: currentAiReviewArchivePreview.authoritativeAiReviewRecords,
    currentAiReviewRecord: currentAiReviewRunRecord,
    paperExecution: activePaperExecutionRecord,
    promotionCandidate: activePromotionCandidateRecord,
    riskApproval: riskApprovalSummary,
    workspace
  });
  const researchRunExportBrowserRows = buildResearchRunExportBrowserRows(inspectedExportPackage);
  const researchRunExportIndexRows = buildResearchRunExportIndexRows(indexedExportPackages);
  const auditEvidenceReportLedgerRows = buildAuditEvidenceReportLedgerRows(auditEvidenceReportEvents);
  const auditEvidenceReportLedgerSummary = buildAuditEvidenceReportLedgerSummary(auditEvidenceReportLedgerRows);
  const researchContextReportCoverage = useMemo(
    () =>
      buildResearchContextReportCoverageForContext(auditEvidenceReportLedgerRows, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      }),
    [
      auditEvidenceReportLedgerRows,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]
  );
  const latestResearchContextReadinessReport = useMemo(() => {
    const row = researchContextReportCoverage.latestMatchingReport;
    if (!row) {
      return null;
    }
    return {
      linkSearch: row.researchContextLinkDecodedSearch || row.researchContextLinkSearch,
      preflightStatus: row.researchContextPreflightStatus,
      preparationEvidenceRunId: row.researchContextPreparationEvidenceRunId,
      query: buildAuditEvidenceReportLedgerRowResearchContextReportQuery(row),
      runId: row.runId,
      shortHash: row.shortHash
    };
  }, [
    researchContextReportCoverage.latestMatchingReport
  ]);
  const latestOtherResearchContextReadinessReport = useMemo(() => {
    const row = researchContextReportCoverage.latestOtherReport;
    if (!row) {
      return null;
    }
    return {
      contextLabel: [row.researchContextMarket, row.researchContextSymbol, row.researchContextTimeframe]
        .filter(Boolean)
        .join(" · "),
      query: buildAuditEvidenceReportLedgerRowResearchContextReportQuery(row),
      runId: row.runId,
      shortHash: row.shortHash
    };
  }, [
    researchContextReportCoverage.latestOtherReport
  ]);
  const latestAuditAidCurrentGapAction = buildLatestAuditAidCurrentGapActionDescriptor(auditEvidenceReportLedgerSummary);
  const latestAuditAidCurrentGapActionReadiness =
    buildLatestAuditAidCurrentGapActionReadiness(auditEvidenceReportLedgerSummary);
  const marketDataRefreshOverrideAuditRows = buildMarketDataRefreshOverrideAuditLedgerRows(
    marketDataRefreshOverrideAuditEvents
  );
  const portfolioPaperOrderAuditRows = buildPortfolioPaperOrderAuditLedgerRows(portfolioPaperOrderAuditEvents);
  const executionAdapterPaperExecutionAuditRows = buildExecutionAdapterPaperExecutionAuditLedgerRows(
    executionAdapterPaperExecutionAuditEvents
  );
  const auditSigningKeyRotationLedgerRows = filterAuditSigningKeyRotationLedgerRows(
    buildAuditSigningKeyRotationLedgerRows(auditSigningKeyRotationEvents),
    ""
  );
  const auditSigningKeyRotationChainSummary = buildAuditSigningKeyRotationChainSummary(
    auditSigningKeyRotationLedgerRows
  );
  const auditSigningKeyRotationHistoryRows = auditSigningKeyRotationLedgerRows.slice(
    0,
    AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
  );
  const inspectedArchiveSnapshot =
    inspectedExportArchiveSnapshot?.exportPackage === inspectedExportPackage
      && inspectedExportArchiveSnapshot.runId === inspectedExportPackage.researchRun.runId
      ? inspectedExportArchiveSnapshot.aiReviewArchiveSnapshot
      : undefined;
  const researchRunImportArchiveSnapshot =
    pendingImportPackage?.aiReviewArchiveSnapshot ?? inspectedArchiveSnapshot;
  const researchRunImportDiffRows = buildResearchRunImportDiffRows({
    aiReviewArchiveReadbackErrors: researchRunImportArchiveSnapshot?.readbackErrors,
    aiReviewDecisions:
      researchRunImportArchiveSnapshot?.aiReviewDecisions ?? aiReviewStage3Decisions,
    aiReviewRecords: activeAiReviewRunRecords,
    authoritativeAiReviewRecords:
      researchRunImportArchiveSnapshot?.authoritativeAiReviewRecords ?? aiReviewStage3History,
    exportPackage: pendingImportPackage?.exportPackage ?? inspectedExportPackage,
    legacyAiReviewIds:
      researchRunImportArchiveSnapshot?.legacyAiReviewIds
      ?? aiReviewStage3LegacyHistory.map((review) => review.aiReviewId),
    paperExecution: activePaperExecutionRecord,
    workspace
  });
  const auditEvidenceSummary = buildAuditEvidenceSummary({
    auditQuery: researchRunImportAuditQuery,
    deepLinkError: importAuditEvidenceDeepLinkStatus?.error ?? null,
    deepLinkRunId: importAuditEvidenceDeepLinkStatus?.runId ?? workspace.researchRun?.runId ?? null,
    deepLinkStatus: importAuditEvidenceDeepLinkStatus?.status ?? "none",
    importDiffQuery: researchRunImportDiffQuery,
    importDiffRows: researchRunImportDiffRows,
    importAuditEvents: researchRunImportAuditEvents,
    packageQuery: researchRunExportBrowserQuery,
    packageRows: researchRunExportBrowserRows
  });
  const strategyRuleDraft = buildStrategyRuleDraft(workspace);
  const strategyTemplateOptions = buildStrategyTemplateOptions();
  const localStrategyReadinessGates = buildStrategyReadinessGates(workspace);
  const strategyReadinessGates = mergeStrategyReadinessGatesWithLocalAudit(
    strategyValidationState.validation?.gates,
    localStrategyReadinessGates
  );
  const strategyRuleRows = buildStrategyRuleRows(workspace);
  const visibleStrategyLibrary = strategyLibraryState.strategies;
  const strategyGovernanceQueue = buildStrategyGovernanceQueueRows({
    workspace,
    library: visibleStrategyLibrary,
    runHistory
  });
  const backtestAssumptionRows = buildBacktestAssumptionRows(workspace);
  const backtestEvidenceCards = buildBacktestEvidenceCards(workspace);
  const backtestReport = buildBacktestReport(workspace);
  const backtestRunComparisonMatrixRows = buildBacktestRunComparisonMatrixRows(runHistory, currentResearchRunId);
  const backtestRunComparisonMatrixSummary = buildBacktestRunComparisonMatrixSummary(backtestRunComparisonMatrixRows);
  const backtestReadinessGates = buildBacktestReadinessGates(workspace);
  const backtestTradeRows = buildBacktestTradeRows(workspace);
  const promotionReadiness =
    activePromotionCandidateRecord ??
    buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows);
  const preLiveReadinessChecklist = buildPreLiveReadinessChecklist(promotionReadiness, {
    paperExecutionReplayGate
  });
  const executionAdapterPreLiveRunbook = buildExecutionAdapterPreLiveRunbookSummary({
    adapterLedgerRows: executionAdapterLedgerRows,
    certificationRows: executionAdapterCertificationRows,
    healthProbeRows: executionAdapterHealthProbeRows,
    humanConfirmationRows: executionAdapterHumanConfirmationRows,
    opsStateRows: executionAdapterOpsStateRows,
    paperExecutionRows: executionAdapterPaperExecutionRows,
    paperOrderLifecycleRows: executionAdapterPaperOrderLifecycleRows,
    paperRouteRunbookRows: executionAdapterPaperRouteRunbookRows,
    productionRouteReviewRows: executionAdapterProductionRouteReviewRows,
    runtimeReloadAcceptanceRows: executionAdapterRuntimeReloadAcceptanceRows,
    sandboxOrderSchemaDryRunRows: executionAdapterSandboxOrderSchemaDryRunRows,
    secretManifestValidationRows: executionAdapterSecretManifestValidationRows,
    workspace
  });
  const executionAdapterPreLiveRunbookAuditCoverage = buildPreLiveRunbookAuditCoverage(
    auditEvidenceReportLedgerRows,
    executionAdapterPreLiveRunbook,
    workspace
  );
  const runComparisonRows = buildResearchRunComparisonRows(runHistory);
  const activeCacheReadiness = marketDataReadinessState.readiness;
  const activeReadinessCacheContext =
    activeCacheReadiness?.market === workspace.selectedInstrument.market &&
      activeCacheReadiness.symbol === workspace.selectedInstrument.symbol &&
      activeCacheReadiness.timeframe === workspace.selectedTimeframe
      ? {
          market: activeCacheReadiness.market,
          symbol: activeCacheReadiness.symbol,
          timeframe: activeCacheReadiness.timeframe,
          rowCount: activeCacheReadiness.barCount,
          startTimestamp: activeCacheReadiness.startBarAt,
          endTimestamp: activeCacheReadiness.latestBarAt,
          freshness: activeCacheReadiness.cacheState,
          ageHours: activeCacheReadiness.ageHours
        }
      : undefined;
  const activeCacheContext =
    activeReadinessCacheContext ??
    settingsStatus.settings?.cache.contexts.find(
      (context) =>
        context.market === workspace.selectedInstrument.market &&
        context.symbol === workspace.selectedInstrument.symbol &&
        context.timeframe === workspace.selectedTimeframe
    );
  const activeCacheContextKey = cacheContextKey({
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    timeframe: workspace.selectedTimeframe
  });
  const activeMarketDataRefreshOverride =
    marketDataRefreshOverride?.market === workspace.selectedInstrument.market ? marketDataRefreshOverride : null;
  const marketDataRefreshGuard = buildMarketDataRefreshGuard(
    workspace.selectedInstrument.market,
    settingsStatus.settings?.marketDataAdapters,
    activeMarketDataRefreshOverride
  );
  const watchlistCacheSummary = buildWatchlistCacheSummary(settingsStatus.settings, workspace);
  const latestWatchlistCacheRefresh = watchlistCacheRefreshHistory[0] ?? null;
  const selectedWatchlistCacheRefresh = resolveWatchlistCacheRefreshRunSelection(
    watchlistCacheRefreshHistory,
    selectedWatchlistCacheRefreshRunId
  );
  const watchlistCacheRefreshHistoryRows = buildWatchlistCacheRefreshHistoryRows(
    watchlistCacheRefreshHistory,
    4,
    selectedWatchlistCacheRefresh?.runId ?? null
  );
  const watchlistCacheRefreshItemRows = buildWatchlistCacheRefreshItemRows(selectedWatchlistCacheRefresh);
  const watchlistCacheRefreshCoverageRow = buildWatchlistCacheRefreshCoverageRow(
    selectedWatchlistCacheRefresh,
    workspace
  );
  const selectedWatchlistRefreshEvidenceRunId =
    watchlistCacheRefreshCoverageRow?.status === "ready" ? watchlistCacheRefreshCoverageRow.runId : null;
  const researchContextReadinessRows = buildResearchContextReadinessRows({
    workspace,
    barCount: klinesState.bars.length,
    dataQuality: {
      source: klinesState.quality.source,
      isComplete: klinesState.quality.isComplete,
      warnings: klinesState.quality.warnings,
      rows: klinesState.quality.rows || klinesState.bars.length
    },
    activeWorkAreaId,
    watchlist: {
      hasUnsavedChanges: hasUnsavedWatchlistChanges
    },
    marketCalendar: marketCalendarState.calendar,
    cacheContext: activeCacheContext
      ? {
          rowCount: activeCacheContext.rowCount,
          freshness: activeCacheContext.freshness,
          ageHours: activeCacheContext.ageHours,
          latestTimestamp: activeCacheContext.endTimestamp
        }
      : null,
    watchlistRefreshRuns: watchlistCacheRefreshHistory,
    note: {
      source: researchNoteState.source,
      body: researchNoteDraft,
      savedBody: researchNoteState.note?.body ?? null,
      updatedAt: researchNoteState.note?.updatedAt ?? null,
      error: researchNoteState.error ?? null
    }
  });
  const researchContextEvidenceRows = buildResearchContextEvidenceRows(workspace);
  const researchPipelinePreflight = buildResearchPipelinePreflight(researchContextReadinessRows);
  const researchPipelinePreparationEvidenceRunId = resolveResearchPipelinePreparationEvidenceRunId({
    preflight: researchPipelinePreflight,
    selectedCoverageRunId: selectedWatchlistRefreshEvidenceRunId
  });
  const goldenPathCurrentStep = goldenPath?.steps.find((step) => step.id === goldenPath.currentStepId);
  const goldenPathRunbookPreview = buildGoldenPathRunbookPreview(goldenPath);
  const activeWorkspaceContext = buildGoldenPathWorkspaceContext(goldenPath, activeWorkAreaId);
  const p0PlatformReadinessSummary = buildP0PlatformReadinessSummary(goldenPath);
  const p0PlatformBacklogItems = buildP0PlatformBacklogItems(goldenPath);
  const p0PaperExecutionPreflight = buildP0PaperExecutionPreflight({
    goldenPath,
    paperExecution: activePaperExecutionRecord,
    researchBinding: researchRunContextBinding,
    riskApproval: riskApprovalSummary
  });
  const p0PlatformActionOutcome = buildP0PlatformActionOutcome({
    goldenPath,
    paperExecution: paperExecutionRecord,
    statusLabel
  });
  const p0ActionOutcomeEvidenceLink = buildP0PlatformActionOutcomeEvidenceLink(p0PlatformActionOutcome);
  const p0AcceptanceSummary = useMemo(
    () => buildP0AcceptanceSummary(p0AcceptanceLatestState.acceptance),
    [p0AcceptanceLatestState.acceptance]
  );
  const p1AcceptanceSummary = useMemo(
    () => buildP1AcceptanceSummary(p1AcceptanceLatestState.acceptance),
    [p1AcceptanceLatestState.acceptance]
  );
  const desktopReleaseSummary = useMemo(
    () => buildDesktopReleaseSummary(desktopReleaseLatestState.release),
    [desktopReleaseLatestState.release]
  );
  const stage1BootstrapPreflightSummary = useMemo<Stage1BootstrapPreflightSummary | null>(
    () => buildStage1BootstrapPreflightSummary(stage1BootstrapPreflightLatestState.preflight),
    [stage1BootstrapPreflightLatestState.preflight]
  );
  const stage1DailyUseSummary = useMemo<Stage1DailyUseSummary | null>(
    () => buildStage1DailyUseSummary(stage1DailyUseLatestState.dailyUse),
    [stage1DailyUseLatestState.dailyUse]
  );
  const p2PaperReplaySummary = useMemo(
    () => buildP2PaperReplaySummary(p2PaperReplayLatestState.replay),
    [p2PaperReplayLatestState.replay]
  );
  const p2PreLiveAcceptanceSummary = useMemo(
    () => buildP2PreLiveAcceptanceSummary(p2PreLiveAcceptanceLatestState.acceptance),
    [p2PreLiveAcceptanceLatestState.acceptance]
  );
  const operatorRunbookSummary = buildOperatorRunbookSummary({
    adapterChainHealthRollups: executionAdapterChainHealthRollups,
    p2PreLiveAcceptance: p2PreLiveAcceptanceSummary,
    paperExecutionReplayGate,
    preLiveChecklist: preLiveReadinessChecklist,
    workspace
  });
  const operatorRunbookAuditCoverage = buildOperatorRunbookAuditCoverage(
    auditEvidenceReportLedgerRows,
    operatorRunbookSummary,
    workspace
  );
  const p2ManifestChainPreflightSummary = useMemo(
    () => buildP2ManifestChainPreflightSummary(p2ManifestChainPreflightLatestState.preflight),
    [p2ManifestChainPreflightLatestState.preflight]
  );
  const p2ManifestChainPreflightAuditContext = useMemo(
    () => ({
      blockerIds: p2ManifestChainPreflightSummary.blockerIds,
      nextAction: p2ManifestChainPreflightSummary.nextAction,
      sourcePath: p2ManifestChainPreflightSummary.sourcePath,
      status: p2ManifestChainPreflightSummary.state,
      totalStageCount: p2ManifestChainPreflightSummary.totalStageCount,
      validStageCount: p2ManifestChainPreflightSummary.validStageCount
    }),
    [
      p2ManifestChainPreflightSummary.blockerIds,
      p2ManifestChainPreflightSummary.nextAction,
      p2ManifestChainPreflightSummary.sourcePath,
      p2ManifestChainPreflightSummary.state,
      p2ManifestChainPreflightSummary.totalStageCount,
      p2ManifestChainPreflightSummary.validStageCount
    ]
  );
  const latestP2ManifestChainPreflightAuditRow = useMemo(
    () =>
      findLatestP2ManifestChainPreflightAuditLedgerRow(
        auditEvidenceReportLedgerRows,
        p2ManifestChainPreflightAuditContext
      ),
    [auditEvidenceReportLedgerRows, p2ManifestChainPreflightAuditContext]
  );
  const latestP2ManifestChainPreflightReviewAuditRow = useMemo(
    () =>
      findLatestP2ManifestChainPreflightAuditLedgerRow(
        auditEvidenceReportLedgerRows,
        p2ManifestChainPreflightAuditContext,
        "p2_manifest_chain_preflight_review"
      ),
    [auditEvidenceReportLedgerRows, p2ManifestChainPreflightAuditContext]
  );
  const p2ReadinessEvidenceCoverage = buildP2ReadinessEvidenceCoverage({
    adapterChainHealthRollups: executionAdapterChainHealthRollups,
    operatorRunbookAuditCoverage,
    p2ManifestChainPreflight: p2ManifestChainPreflightSummary,
    p2ManifestChainPreflightReviewAuditRow: latestP2ManifestChainPreflightReviewAuditRow,
    p2PaperReplay: p2PaperReplaySummary,
    p2PreLiveAcceptance: p2PreLiveAcceptanceSummary,
    preLiveChecklist: preLiveReadinessChecklist
  });
  const latestP2ReadinessEvidenceCoverageReviewAuditRow = useMemo(
    () =>
      findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow(
        auditEvidenceReportLedgerRows,
        p2ReadinessEvidenceCoverage
      ),
    [auditEvidenceReportLedgerRows, p2ReadinessEvidenceCoverage]
  );
  const p2ReadinessEvidenceCoverageReviewAuditEventReference = useMemo(
    () =>
      resolveP2ReadinessEvidenceCoverageReviewAuditEventReference({
        coverage: p2ReadinessEvidenceCoverage,
        event: p2ReadinessEvidenceCoverageReviewAuditEvent,
        ledgerRow: latestP2ReadinessEvidenceCoverageReviewAuditRow
      }),
    [
      latestP2ReadinessEvidenceCoverageReviewAuditRow,
      p2ReadinessEvidenceCoverage,
      p2ReadinessEvidenceCoverageReviewAuditEvent
    ]
  );
  const p2ReadinessEvidenceCoverageReviewAuditEventId =
    p2ReadinessEvidenceCoverageReviewAuditEventReference.eventId;
  const p2ReadinessEvidenceCoverageReviewAuditEventSource =
    p2ReadinessEvidenceCoverageReviewAuditEventReference.source;
  const p2ReadinessAcceptanceSummary = buildP2ReadinessAcceptanceSummary({
    evidenceCoverage: p2ReadinessEvidenceCoverage,
    evidenceCoverageReviewAuditEventId: p2ReadinessEvidenceCoverageReviewAuditEventId,
    p1Acceptance: p1AcceptanceSummary,
    p2PaperReplay: p2PaperReplaySummary,
    p2PreLiveAcceptance: p2PreLiveAcceptanceSummary,
    preLiveChecklist: preLiveReadinessChecklist
  });
  const personalTeamUsabilityReadiness = buildPersonalTeamUsabilityReadinessSummary({
    auditEvidenceReportLedgerSummary,
    handoffNoteCount: handoffNotesState.pagination?.total ?? handoffNotesState.handoffNotes.length,
    p0AcceptanceSummary,
    p0PlatformReadinessSummary,
    p1AcceptanceSummary,
    p2ManifestChainPreflightSummary,
    p2ReadinessAcceptanceSummary,
    p2ReadinessEvidenceCoverage
  });
  const personalTeamReadinessReviewMarkdown = useMemo(
    () => buildPersonalTeamUsabilityReadinessReviewMarkdown({ summary: personalTeamUsabilityReadiness }),
    [personalTeamUsabilityReadiness]
  );
  const personalTeamReadinessReviewReference = useMemo(
    () =>
      buildPersonalTeamUsabilityReadinessReviewReference({
        ledgerRows: auditEvidenceReportLedgerRows,
        summary: personalTeamUsabilityReadiness
      }),
    [auditEvidenceReportLedgerRows, personalTeamUsabilityReadiness]
  );
  const p2ReadinessAcceptanceAuditContext = useMemo(
    () => ({
      market: p2ReadinessAcceptanceLatestState.acceptance?.market ?? null,
      runId: p2ReadinessAcceptanceLatestState.acceptance?.runId ?? null,
      symbol: p2ReadinessAcceptanceLatestState.acceptance?.symbol ?? null,
      timeframe: p2ReadinessAcceptanceLatestState.acceptance?.timeframe ?? null
    }),
    [
      p2ReadinessAcceptanceLatestState.acceptance?.market,
      p2ReadinessAcceptanceLatestState.acceptance?.runId,
      p2ReadinessAcceptanceLatestState.acceptance?.symbol,
      p2ReadinessAcceptanceLatestState.acceptance?.timeframe
    ]
  );
  const p2ReadinessAcceptanceReviewAuditContext = useMemo(
    () => ({
      ...p2ReadinessAcceptanceAuditContext,
      evidenceCoverageReviewAuditEventId: p2ReadinessEvidenceCoverageReviewAuditEventId
    }),
    [p2ReadinessAcceptanceAuditContext, p2ReadinessEvidenceCoverageReviewAuditEventId]
  );
  const latestP2ReadinessAcceptanceGeneratedAuditRow = useMemo(
    () =>
      findLatestP2ReadinessAcceptanceAuditLedgerRow(
        auditEvidenceReportLedgerRows,
        "p2_readiness_acceptance_generated",
        p2ReadinessAcceptanceAuditContext
      ),
    [auditEvidenceReportLedgerRows, p2ReadinessAcceptanceAuditContext]
  );
  const latestP2ReadinessAcceptanceReviewAuditRow = useMemo(
    () =>
      findLatestP2ReadinessAcceptanceAuditLedgerRow(
        auditEvidenceReportLedgerRows,
        "p2_readiness_acceptance_review",
        p2ReadinessAcceptanceReviewAuditContext
      ),
    [auditEvidenceReportLedgerRows, p2ReadinessAcceptanceReviewAuditContext]
  );
  const p2ReadinessAcceptanceGeneratedAuditEventReference = useMemo(
    () =>
      resolveP2ReadinessAcceptanceAuditEventReference({
        context: p2ReadinessAcceptanceAuditContext,
        event: p2ReadinessAcceptanceAuditEvent,
        ledgerRow: latestP2ReadinessAcceptanceGeneratedAuditRow
      }),
    [latestP2ReadinessAcceptanceGeneratedAuditRow, p2ReadinessAcceptanceAuditContext, p2ReadinessAcceptanceAuditEvent]
  );
  const p2ReadinessAcceptanceReviewAuditEventReference = useMemo(
    () =>
      resolveP2ReadinessAcceptanceAuditEventReference({
        context: p2ReadinessAcceptanceReviewAuditContext,
        event: p2ReadinessAcceptanceReviewAuditEvent,
        ledgerRow: latestP2ReadinessAcceptanceReviewAuditRow
      }),
    [
      latestP2ReadinessAcceptanceReviewAuditRow,
      p2ReadinessAcceptanceReviewAuditContext,
      p2ReadinessAcceptanceReviewAuditEvent
    ]
  );
  const p2ReadinessAcceptanceGeneratedAuditEventId = p2ReadinessAcceptanceGeneratedAuditEventReference.eventId;
  const p2ReadinessAcceptanceGeneratedAuditEventSource = p2ReadinessAcceptanceGeneratedAuditEventReference.source;
  const p2ReadinessAcceptanceReviewAuditEventId = p2ReadinessAcceptanceReviewAuditEventReference.eventId;
  const p2ReadinessAcceptanceReviewAuditEventSource = p2ReadinessAcceptanceReviewAuditEventReference.source;
  const p2ManifestChainPreflightAuditReference = useMemo(
    () =>
      resolveP2ManifestChainPreflightAuditEventReference({
        context: p2ManifestChainPreflightAuditContext,
        event: p2ManifestChainPreflightAuditEvent,
        ledgerRow: latestP2ManifestChainPreflightAuditRow
      }),
    [
      latestP2ManifestChainPreflightAuditRow,
      p2ManifestChainPreflightAuditContext,
      p2ManifestChainPreflightAuditEvent
    ]
  );
  const p2ManifestChainPreflightReviewAuditEventReference = useMemo(
    () =>
      resolveP2ManifestChainPreflightAuditEventReference({
        context: p2ManifestChainPreflightAuditContext,
        event: p2ManifestChainPreflightReviewAuditEvent,
        ledgerRow: latestP2ManifestChainPreflightReviewAuditRow
      }),
    [
      latestP2ManifestChainPreflightReviewAuditRow,
      p2ManifestChainPreflightAuditContext,
      p2ManifestChainPreflightReviewAuditEvent
    ]
  );
  const p2ManifestChainPreflightAuditEventId = p2ManifestChainPreflightAuditReference.eventId;
  const p2ManifestChainPreflightAuditEventSource = p2ManifestChainPreflightAuditReference.source;
  const p2ManifestChainPreflightReviewAuditEventId = p2ManifestChainPreflightReviewAuditEventReference.eventId;
  const p2ManifestChainPreflightReviewAuditEventSource = p2ManifestChainPreflightReviewAuditEventReference.source;
  const p2PreLiveAcceptanceSummaryHeadlineText = p2PreLiveAcceptanceSummaryHeadline(i18n, p2PreLiveAcceptanceSummary);
  const p2ManifestChainPreflightReviewMarkdown = useMemo(
    () =>
      buildP2ManifestChainPreflightReviewMarkdown({
        preflight: p2ManifestChainPreflightLatestState.preflight ?? null,
        summary: p2ManifestChainPreflightSummary
      }),
    [p2ManifestChainPreflightLatestState.preflight, p2ManifestChainPreflightSummary]
  );
  const p2ReadinessEvidenceCoverageReviewMarkdown = useMemo(
    () =>
      buildP2ReadinessEvidenceCoverageReviewMarkdown({
        coverage: p2ReadinessEvidenceCoverage
      }),
    [p2ReadinessEvidenceCoverage]
  );
  const p2ReadinessAcceptanceReviewMarkdown = useMemo(
    () =>
      buildP2ReadinessAcceptanceReviewMarkdown({
        acceptance: p2ReadinessAcceptanceLatestState.acceptance ?? null,
        summary: p2ReadinessAcceptanceSummary
      }),
    [p2ReadinessAcceptanceLatestState.acceptance, p2ReadinessAcceptanceSummary]
  );
  const p0AcceptanceReviewMarkdown = useMemo(
    () =>
      buildP0AcceptanceReviewMarkdown({
        acceptance: p0AcceptanceLatestState.acceptance ?? null,
        summary: p0AcceptanceSummary
      }),
    [p0AcceptanceLatestState.acceptance, p0AcceptanceSummary]
  );
  const evidencePackageControlRoom = buildEvidencePackageControlRoomRows({
    acceptanceReviewEvents: auditEvidenceReportEvents,
    auditLedgerRows: auditEvidenceReportLedgerRows,
    exportIndexRows: researchRunExportIndexRows,
    importAuditEvents: researchRunImportAuditEvents,
    p0AcceptanceSummary
  });
  const p0PortablePackageReady = useMemo(() => {
    const matchesCurrentRun = (exportPackage: ResearchRunExportPackage | null | undefined) =>
      Boolean(
        exportPackage &&
          exportPackage.manifest.runId === currentResearchRunId &&
          exportPackage.p0PackageCompleteness?.ready &&
          exportPackage.p0PackageCompleteness.liveBlockedBoundary &&
          !exportPackage.p0PackageCompleteness.liveTradingAllowed
      );
    return matchesCurrentRun(inspectedExportPackage) || indexedExportPackages.some(matchesCurrentRun);
  }, [currentResearchRunId, indexedExportPackages, inspectedExportPackage]);
  const p0CompletionChecklist = useMemo(
    () =>
      buildP0CompletionChecklist({
        automatedTestsVerified: false,
        exportImportReady: p0PortablePackageReady,
        goldenPath,
        outcome: p0PlatformActionOutcome,
        paperPreflight: p0PaperExecutionPreflight,
        productWorkAreaCount: productWorkAreas.length,
        replayReady: Boolean(
          currentResearchRunId &&
            (activeAiReviewRunRecords.length > 0 ||
              Boolean(activePaperExecutionRecord?.executionId) ||
              p0PortablePackageReady)
        ),
        strategyVersionReady:
          Boolean(workspace.researchRun?.strategyConfig) ||
          visibleStrategyLibrary.some(
            (item) => item.status === "audited" && Boolean(item.auditRunId) && item.auditRunId === workspace.researchRun?.runId
          ),
        summary: p0PlatformReadinessSummary
      }),
    [
      activeAiReviewRunRecords.length,
      activePaperExecutionRecord?.executionId,
      currentResearchRunId,
      goldenPath,
      p0PortablePackageReady,
      p0PaperExecutionPreflight,
      p0PlatformActionOutcome,
      p0PlatformReadinessSummary,
      productWorkAreas.length,
      visibleStrategyLibrary,
      workspace.researchRun?.runId,
      workspace.researchRun?.strategyConfig
    ]
  );
  const dailyOpsControlRoom = buildDailyOpsControlRoomSummary({
    auditEvidenceReportLedgerSummary,
    personalTeamUsabilityReadiness,
    p0CompletionChecklist
  });
  const dailyOpsControlRoomReviewMarkdown = useMemo(
    () => buildDailyOpsControlRoomReviewMarkdown({ summary: dailyOpsControlRoom }),
    [dailyOpsControlRoom]
  );
  const dailyOpsControlRoomReviewReference = useMemo(
    () =>
      buildDailyOpsControlRoomReviewReference({
        ledgerRows: auditEvidenceReportLedgerRows,
        summary: dailyOpsControlRoom
      }),
    [auditEvidenceReportLedgerRows, dailyOpsControlRoom]
  );
  const dailyStartBrief = useMemo(
    () =>
      buildDailyStartBrief({
        dailyOpsControlRoom,
        dailyOpsControlRoomReviewReference,
        personalTeamReadinessReviewReference,
        personalTeamUsabilityReadiness
      }),
    [
      dailyOpsControlRoom,
      dailyOpsControlRoomReviewReference,
      personalTeamReadinessReviewReference,
      personalTeamUsabilityReadiness
    ]
  );
  const stage1P0DailyUseClosure = useMemo(
    () =>
      buildStage1P0DailyUseClosure({
        bootstrapPreflight: stage1BootstrapPreflightSummary,
        dailyStartBrief,
        dailyUseReport: stage1DailyUseSummary,
        desktopRelease: desktopReleaseSummary,
        marketRefreshGuard: marketDataRefreshGuard,
        p0Acceptance: p0AcceptanceSummary,
        p1Acceptance: p1AcceptanceSummary,
        researchReadinessRows: researchContextReadinessRows
      }),
    [
      dailyStartBrief,
      stage1BootstrapPreflightSummary,
      stage1DailyUseSummary,
      desktopReleaseSummary,
      marketDataRefreshGuard,
      p0AcceptanceSummary,
      p1AcceptanceSummary,
      researchContextReadinessRows
    ]
  );
  const dailyStartBriefReviewMarkdown = useMemo(
    () => buildDailyStartBriefMarkdown({ brief: dailyStartBrief }),
    [dailyStartBrief]
  );
  const dailyStartBriefReviewReference = useMemo(
    () => buildDailyStartBriefReviewReference({ brief: dailyStartBrief, ledgerRows: auditEvidenceReportLedgerRows }),
    [auditEvidenceReportLedgerRows, dailyStartBrief]
  );
  const stage1P0DailyUseArchiveReviewReference = useMemo(
    () =>
      buildStage1P0DailyUseArchiveReviewReference({
        closure: stage1P0DailyUseClosure,
        invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
        ledgerRows: auditEvidenceReportLedgerRows,
        refreshOutcome: stage1P0DailyUseRefreshOutcome,
        shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState
      }),
    [
      auditEvidenceReportLedgerRows,
      initialStage1P0DailyUseShareDeepLinkState,
      initialStage1P0DailyUseShareDeepLinkStatus,
      stage1P0DailyUseClosure,
      stage1P0DailyUseRefreshOutcome
    ]
  );
  const stage1P0DailyUseStartupSnapshot = useMemo(
    () =>
      buildStage1P0DailyUseStartupSnapshot({
        archiveReference: stage1P0DailyUseArchiveReviewReference,
        closure: stage1P0DailyUseClosure,
        refreshOutcome: stage1P0DailyUseRefreshOutcome
      }),
    [stage1P0DailyUseArchiveReviewReference, stage1P0DailyUseClosure, stage1P0DailyUseRefreshOutcome]
  );
  const p0GoldenPathJourney = useMemo(
    () =>
      buildP0GoldenPathJourney({
        completionChecklist: p0CompletionChecklist,
        goldenPath,
        outcome: p0PlatformActionOutcome,
        paperPreflight: p0PaperExecutionPreflight,
        summary: p0PlatformReadinessSummary
      }),
    [
      goldenPath,
      p0CompletionChecklist,
      p0PaperExecutionPreflight,
      p0PlatformActionOutcome,
      p0PlatformReadinessSummary
    ]
  );
  const p0PlatformReadinessReportMarkdown = useMemo(
    () =>
      buildP0PlatformReadinessReportMarkdown({
        backlogItems: p0PlatformBacklogItems,
        completionChecklist: p0CompletionChecklist,
        evidenceLink: p0ActionOutcomeEvidenceLink,
        outcome: p0PlatformActionOutcome,
        paperPreflight: p0PaperExecutionPreflight,
        summary: p0PlatformReadinessSummary
      }),
    [
      p0ActionOutcomeEvidenceLink,
      p0CompletionChecklist,
      p0PlatformActionOutcome,
      p0PlatformBacklogItems,
      p0PaperExecutionPreflight,
      p0PlatformReadinessSummary
    ]
  );

  useEffect(() => {
    void loadStage6ExitAcceptance(quantCoreBaseUrl).then((result) => setStage6ExitAcceptance(result.acceptance ?? null));
    void loadStage6KillSwitch(quantCoreBaseUrl).then((result) => setStage6KillSwitchState(result.killSwitch ?? null));
    void loadStage7ProductionReadonlyProbes(quantCoreBaseUrl).then((result) => {
      setStage7ProductionReadonlyProbes(result.probes);
      setStage7ProductionReadonlyError(result.error ?? null);
    });
    void loadStage8ProductionReadonlyContinuity(quantCoreBaseUrl).then((result) => {
      setStage8ProductionReadonlyContinuity(result.continuity ?? null);
      setStage8ProductionReadonlyError(result.error ?? null);
    });
  }, []);

  useEffect(() => {
    klinesStateRef.current = klinesState;
  }, [klinesState]);

  useEffect(() => {
    setCopiedP0ReadinessReport(false);
  }, [p0PlatformReadinessReportMarkdown]);

  useEffect(() => {
    setCopiedP0AcceptanceReview(false);
  }, [p0AcceptanceReviewMarkdown]);

  useEffect(() => {
    setCopiedP2ReadinessAcceptanceReview(false);
  }, [p2ReadinessAcceptanceReviewMarkdown]);

  useEffect(() => {
    setCopiedP2ReadinessEvidenceCoverageReview(false);
  }, [p2ReadinessEvidenceCoverageReviewMarkdown]);

  useEffect(() => {
    setCopiedP2ManifestChainPreflightReview(false);
  }, [p2ManifestChainPreflightReviewMarkdown]);

  useEffect(() => {
    setCopiedPersonalTeamReadinessReview(false);
  }, [personalTeamReadinessReviewMarkdown]);

  useEffect(() => {
    setCopiedDailyOpsControlRoomReview(false);
  }, [dailyOpsControlRoomReviewMarkdown]);

  useEffect(() => {
    setCopiedDailyStartBriefReview(false);
  }, [dailyStartBriefReviewMarkdown]);

  useEffect(() => {
    setCopiedStage1P0DailyUseHandoff(false);
  }, [stage1P0DailyUseClosure.copyText]);

  useEffect(() => {
    setCopiedStage1P0DailyUsePrimaryLink(false);
  }, [stage1P0DailyUseClosure.primaryWorkspaceLink]);

  useEffect(() => {
    setCopiedStage1P0ShareLinkBundle(false);
  }, [stage1P0DailyUseClosure.copyText, stage1P0DailyUseRefreshOutcome?.copyText]);

  useEffect(() => {
    setCopiedStage1P0DailyUseArchive(false);
  }, [stage1P0DailyUseClosure.copyText, stage1P0DailyUseRefreshOutcome?.copyText]);

  useEffect(() => {
    setCopiedStage1P0DailyUseStartupSnapshot(false);
  }, [stage1P0DailyUseStartupSnapshot.copyText]);

  useEffect(() => {
    setCopiedStage1P0InvalidShareDiagnostics(false);
  }, [initialStage1P0DailyUseShareDeepLinkStatus, stage1P0DailyUseClosure.primaryWorkspaceLink]);

  useEffect(() => {
    setCopiedStage1P0DailyUseRefreshOutcome(false);
  }, [stage1P0DailyUseRefreshOutcome?.copyText]);

  useEffect(() => {
    setCopiedStage1P0DailyUseRefreshOutcomeLink(false);
  }, [stage1P0DailyUseRefreshOutcome?.targetWorkspaceLink]);

  useEffect(() => {
    setPortfolioBacktestState(initialPortfolioBacktestState);
  }, [portfolioBacktestDraftKey]);

  useEffect(() => {
    let cancelled = false;
    void loadStage5ExitAcceptance(quantCoreBaseUrl).then((result) => {
      if (cancelled) return;
      setStage5ExitAcceptance(result.acceptance);
      setStage5ExitAcceptanceError(result.error ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const baseRunId = currentResearchRunId;
    const request = portfolioStage4RequestCoordinatorRef.current.begin(baseRunId);
    const requestIsCurrent = () => portfolioStage4RequestCoordinatorRef.current.isCurrent(request);
    if (!baseRunId) {
      setPortfolioPaperOrderBatches([]);
      setPortfolioPaperOrderLifecycleEvents([]);
      setPortfolioPaperOrderSimulations([]);
      setPortfolioPaperOrderReplay(null);
      setPortfolioPaperOrderStateHistories([]);
      setPortfolioStage4Workflows([]);
      setPortfolioRiskAssessments([]);
      setPortfolioRiskAssessmentError(null);
      setPortfolioPaperOrderHistoryError(null);
      return;
    }
    setPortfolioPaperOrderHistoryError(null);
    void (async () => {
      const [batchResult, replayResult, workflowResult, riskAssessmentResult] = await Promise.all([
        loadPortfolioPaperOrderBatches(quantCoreBaseUrl, baseRunId),
        loadPortfolioPaperOrderReplay(quantCoreBaseUrl, baseRunId),
        loadStage4PortfolioWorkflows(quantCoreBaseUrl, baseRunId),
        loadPortfolioRiskAssessments(quantCoreBaseUrl, baseRunId)
      ]);
      if (!requestIsCurrent()) return;
      setPortfolioPaperOrderBatches(batchResult.batches);
      setPortfolioPaperOrderReplay(replayResult.replay ?? null);
      setPortfolioStage4Workflows(workflowResult.workflows);
      setPortfolioRiskAssessments(riskAssessmentResult.assessments);
      setPortfolioRiskAssessmentError(riskAssessmentResult.error ?? null);
      const latestBatch = [...batchResult.batches].sort(
        (left, right) => right.createdAt.localeCompare(left.createdAt)
      )[0];
      const restoredWorkflow = selectCurrentStage4PortfolioWorkflow(
        workflowResult.workflows,
        baseRunId,
        latestBatch?.batchId
      );
      if (restoredWorkflow) setPortfolioBacktestState({ portfolio: restoredWorkflow.portfolio, source: "core" });
      if (!batchResult.batches.length) {
        setPortfolioPaperOrderLifecycleEvents([]);
        setPortfolioPaperOrderSimulations([]);
        setPortfolioPaperOrderStateHistories([]);
        setPortfolioPaperOrderHistoryError(
          batchResult.error ?? replayResult.error ?? workflowResult.error ?? riskAssessmentResult.error ?? null
        );
        return;
      }
      const [approvalResults, simulationResults, stateHistoryResults] = await Promise.all([
        Promise.all(
          batchResult.batches.map((batch) => loadPortfolioPaperOrderApprovals(quantCoreBaseUrl, baseRunId, batch.batchId))
        ),
        Promise.all(
          batchResult.batches.map((batch) => loadPortfolioPaperOrderSimulations(quantCoreBaseUrl, baseRunId, batch.batchId))
        ),
        Promise.all(
          batchResult.batches.map((batch) => loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, baseRunId, batch.batchId))
        )
      ]);
      if (!requestIsCurrent()) return;
      setPortfolioPaperOrderLifecycleEvents(approvalResults.flatMap((result) => result.lifecycle));
      setPortfolioPaperOrderSimulations(simulationResults.flatMap((result) => result.simulations));
      setPortfolioPaperOrderStateHistories(stateHistoryResults.flatMap((result) =>
        result.stateHistory ? [result.stateHistory] : []));
      setPortfolioPaperOrderHistoryError([
        batchResult, replayResult, workflowResult, riskAssessmentResult,
        ...approvalResults, ...simulationResults, ...stateHistoryResults
      ].find((result) => result.error)?.error ?? null);
    })();
  }, [currentResearchRunId, portfolioStage4RefreshGeneration]);

  useEffect(() => {
    const baseRunId = currentResearchRunId;
    let cancelled = false;
    if (!baseRunId) {
      setStage5ShadowSessions([]);
      setStage5SandboxReadinessDecisions([]);
      setStage5SandboxAuthorizationPreflights([]);
      setStage5SandboxAuthorizationReviews([]);
      setStage5ShadowError(null);
      return;
    }
    setStage5ShadowError(null);
    void Promise.all([
      loadStage5ShadowSessions(quantCoreBaseUrl, baseRunId),
      loadStage5SandboxReadinessDecisions(quantCoreBaseUrl, baseRunId),
      loadStage5SandboxAuthorizationPreflights(quantCoreBaseUrl, baseRunId),
      loadStage5SandboxAuthorizationReviews(quantCoreBaseUrl, baseRunId)
    ]).then(([sessionResult, readinessResult, preflightResult, reviewResult]) => {
      if (cancelled) return;
      setStage5ShadowSessions(sessionResult.sessions);
      setStage5SandboxReadinessDecisions(readinessResult.decisions);
      setStage5SandboxAuthorizationPreflights(preflightResult.preflights);
      setStage5SandboxAuthorizationReviews(reviewResult.reviews);
      setStage5ShadowError(
        sessionResult.error ?? readinessResult.error ?? preflightResult.error ?? reviewResult.error ?? null
      );
    });
    return () => { cancelled = true; };
  }, [currentResearchRunId]);

  useEffect(() => {
    const baseRunId = currentResearchRunId;
    let cancelled = false;
    if (!baseRunId) {
      setStage9ProductionAdmissionCandidates([]);
      setStage9ProductionAdmissionReviews([]);
      setStage9ProductionAdmissionError(null);
      return;
    }
    void Promise.all([
      loadStage9ProductionAdmissionCandidates(quantCoreBaseUrl, baseRunId),
      loadStage9ProductionAdmissionReviews(quantCoreBaseUrl, baseRunId)
    ]).then(([candidateResult, reviewResult]) => {
      if (cancelled) return;
      setStage9ProductionAdmissionCandidates(candidateResult.candidates);
      setStage9ProductionAdmissionReviews(reviewResult.reviews);
      setStage9ProductionAdmissionError(candidateResult.error ?? reviewResult.error ?? null);
    });
    return () => { cancelled = true; };
  }, [currentResearchRunId]);

  useEffect(() => {
    const baseRunId = currentResearchRunId;
    let cancelled = false;
    if (!baseRunId) {
      setStage6SandboxAuthorizations([]);
      setStage6SandboxBatch(null);
      setStage6SandboxError(null);
      return;
    }
    void loadStage6SandboxAuthorizations(quantCoreBaseUrl, baseRunId).then(async (result) => {
      if (cancelled) return;
      setStage6SandboxAuthorizations(result.authorizations);
      setStage6SandboxError(result.error ?? null);
      const latest = result.authorizations[0];
      if (!latest) return setStage6SandboxBatch(null);
      const batchResult = await loadStage6SandboxBatch(quantCoreBaseUrl, latest.authorizationId);
      if (cancelled) return;
      setStage6SandboxBatch(batchResult.batch ?? null);
      if (batchResult.batch) setStage6KillSwitchState(batchResult.batch.killSwitch);
      setStage6SandboxError(batchResult.error ?? result.error ?? null);
    });
    return () => { cancelled = true; };
  }, [currentResearchRunId]);

  useEffect(() => {
    const requestId = strategyValidationRequestIdRef.current + 1;
    strategyValidationRequestIdRef.current = requestId;
    setStrategyValidationState(initialStrategyValidationState);
    void validateStrategySnapshot(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      auditRunId: workspace.researchRun?.runId ?? null,
      strategy: workspace.strategy
    }).then((result) => {
      if (strategyValidationRequestIdRef.current === requestId) {
        setStrategyValidationState(result);
      }
    });
  }, [
    workspace.researchRun?.runId,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe,
    workspace.strategy
  ]);

  const refreshRunHistory = useCallback(async () => {
    const result = await loadResearchRunHistory(quantCoreBaseUrl, 50);
    setRunHistoryState(result);
    return result;
  }, []);

  const refreshDesktopReleaseLatest = useCallback(async () => {
    setIsLoadingDesktopRelease(true);
    try {
      setDesktopReleaseLatestState(await loadDesktopReleaseLatest(quantCoreBaseUrl));
    } finally {
      setIsLoadingDesktopRelease(false);
    }
  }, []);

  const refreshStage1DailyUseLatest = useCallback(async () => {
    setStage1DailyUseLatestState(await loadStage1DailyUseLatest(quantCoreBaseUrl));
  }, []);

  const refreshStage1BootstrapPreflightLatest = useCallback(async () => {
    setStage1BootstrapPreflightLatestState(await loadStage1BootstrapPreflightLatest(quantCoreBaseUrl));
  }, []);

  const refreshStage1DailyUseReport = useCallback(async () => {
    setIsGeneratingStage1DailyUse(true);
    setIsGeneratingStage1BootstrapPreflight(true);
    try {
      const generated = await generateStage1DailyUse(quantCoreBaseUrl);
      setStage1DailyUseLatestState({
        dailyUse: generated.dailyUse,
        source: generated.source,
        error: generated.error
      });
      const generatedDailyUseSummary = buildStage1DailyUseSummary(generated.dailyUse);
      const generatedPreflight = await generateStage1BootstrapPreflight(quantCoreBaseUrl);
      setStage1BootstrapPreflightLatestState({
        preflight: generatedPreflight.preflight,
        source: generatedPreflight.source,
        error: generatedPreflight.error
      });
      const generatedPreflightSummary = buildStage1BootstrapPreflightSummary(generatedPreflight.preflight);
      const desktopReleaseLatest = await loadDesktopReleaseLatest(quantCoreBaseUrl);
      setDesktopReleaseLatestState(desktopReleaseLatest);
      const refreshedDesktopReleaseSummary = buildDesktopReleaseSummary(desktopReleaseLatest.release);
      setStage1P0DailyUseRefreshOutcome(
        buildStage1P0DailyUseRefreshOutcome({
          bootstrapPreflight: generatedPreflightSummary,
          bootstrapPreflightError: generatedPreflight.error,
          bootstrapPreflightSource: generatedPreflight.source,
          dailyUseError: generated.error,
          dailyUseReport: generatedDailyUseSummary,
          dailyUseSource: generated.source,
          desktopRelease: refreshedDesktopReleaseSummary,
          desktopReleaseError: desktopReleaseLatest.error,
          desktopReleaseSource: desktopReleaseLatest.source
        })
      );
    } finally {
      setIsGeneratingStage1BootstrapPreflight(false);
      setIsGeneratingStage1DailyUse(false);
    }
  }, []);

  const refreshP0AcceptanceLatest = useCallback(async () => {
    setIsLoadingP0Acceptance(true);
    try {
      setP0AcceptanceLatestState(await loadP0AcceptanceLatest(quantCoreBaseUrl));
    } finally {
      setIsLoadingP0Acceptance(false);
    }
  }, []);

  const refreshP1AcceptanceLatest = useCallback(async () => {
    setIsLoadingP1Acceptance(true);
    try {
      setP1AcceptanceLatestState(await loadP1AcceptanceLatest(quantCoreBaseUrl));
    } finally {
      setIsLoadingP1Acceptance(false);
    }
  }, []);

  const refreshP2PaperReplayLatest = useCallback(async () => {
    setIsLoadingP2PaperReplay(true);
    try {
      setP2PaperReplayLatestState(await loadP2PaperReplayLatest(quantCoreBaseUrl));
    } finally {
      setIsLoadingP2PaperReplay(false);
    }
  }, []);

  const refreshP2PreLiveAcceptanceLatest = useCallback(async () => {
    setIsLoadingP2PreLiveAcceptance(true);
    try {
      setP2PreLiveAcceptanceLatestState(await loadP2PreLiveAcceptanceLatest(quantCoreBaseUrl));
    } finally {
      setIsLoadingP2PreLiveAcceptance(false);
    }
  }, []);

  const refreshP2ReadinessAcceptanceLatest = useCallback(async () => {
    setIsLoadingP2ReadinessAcceptance(true);
    try {
      setP2ReadinessAcceptanceLatestState(await loadP2ReadinessAcceptanceLatest(quantCoreBaseUrl));
    } finally {
      setIsLoadingP2ReadinessAcceptance(false);
    }
  }, []);

  const generateP2ReadinessAcceptanceReport = useCallback(async () => {
    setIsGeneratingP2ReadinessAcceptance(true);
    try {
      const result = await generateP2ReadinessAcceptance(quantCoreBaseUrl);
      setP2ReadinessAcceptanceAuditEvent(result.auditEvent ?? null);
      setP2ReadinessAcceptanceLatestState({
        acceptance: result.acceptance,
        source: result.source,
        error: result.error
      });
      setWorkspaceState((current) => ({
        ...current,
        statusLabel:
          result.status === "acceptance_generated"
            ? "P2 readiness acceptance manifest generated"
            : "P2 readiness acceptance manifest generation failed",
        error: result.error
      }));
    } finally {
      setIsGeneratingP2ReadinessAcceptance(false);
    }
  }, []);

  const refreshP2ManifestChainPreflightLatest = useCallback(async () => {
    setIsLoadingP2ManifestChainPreflight(true);
    try {
      setP2ManifestChainPreflightLatestState(await loadP2ManifestChainPreflightLatest(quantCoreBaseUrl));
    } finally {
      setIsLoadingP2ManifestChainPreflight(false);
    }
  }, []);

  const generateP2ManifestChainPreflightReport = useCallback(async () => {
    setIsGeneratingP2ManifestChainPreflight(true);
    try {
      const result = await generateP2ManifestChainPreflight(quantCoreBaseUrl);
      setP2ManifestChainPreflightAuditEvent(result.auditEvent ?? null);
      setP2ManifestChainPreflightLatestState({
        preflight: result.preflight,
        source: result.source,
        error: result.error
      });
    } finally {
      setIsGeneratingP2ManifestChainPreflight(false);
    }
  }, []);

  const resetAiReviewHistoryState = useCallback(() => {
    aiReviewHistoryRequestIdRef.current = nextAiReviewHistoryRequestId(aiReviewHistoryRequestIdRef.current);
    setIsLoadingAiReviewHistory(false);
    setAiReviewRunRecords([]);
    setAiReviewHistoryQuery("");
    setAiReviewHistoryOffset(0);
    setAiReviewHistoryPagination(null);
  }, []);

  const syncAiReviewStage3Busy = useCallback(() => {
    const busy = aiReviewStage3RequestCoordinatorRef.current!.busy;
    setIsLoadingAiReviewStage3(busy.loading);
    setIsRunningAiReviewStage3(busy.running);
    setIsAppendingAiReviewStage3Decision(busy.appending);
  }, []);

  const invalidateAiReviewStage3Review = useCallback(() => {
    aiReviewStage3RequestCoordinatorRef.current!.invalidateReview();
    syncAiReviewStage3Busy();
    setAiReviewStage3CurrentReview(null);
    setAiReviewStage3Decisions([]);
    setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft([]));
  }, [syncAiReviewStage3Busy]);

  useLayoutEffect(() => {
    const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
    const request = coordinator.beginContext(aiReviewStage3ContextKey);
    syncAiReviewStage3Busy();
    setAiReviewStage3Providers([]);
    setAiReviewStage3ExternalDataApproved(false);
    setAiReviewStage3PrimaryExperimentId(null);
    setAiReviewStage3ComparisonExperimentIds([]);
    setAiReviewStage3History([]);
    setAiReviewStage3LegacyHistory([]);
    setAiReviewStage3CurrentReview(null);
    setAiReviewStage3Decisions([]);
    setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft([]));
    setAiReviewStage3Error(null);
    const applyProviders = (providers: AiReviewProviderStatus[]) => {
      setAiReviewStage3Providers(providers);
      setAiReviewStage3ProviderId((current) => {
        const currentConfigured = providers.some(
          (provider) => provider.providerId === current && provider.configured
        );
        const configuredExternal = providers.find(
          (provider) => provider.providerId !== "local" && provider.configured
        );
        const next = !aiReviewStage3ProviderInitializedRef.current && configuredExternal
          ? configuredExternal.providerId
          : currentConfigured ? current : "local";
        aiReviewStage3ProviderInitializedRef.current = true;
        return next;
      });
    };

    const loadsProviderRegistryOnly =
      activeWorkAreaId === "settings" || activeWorkAreaId === "market";
    if (loadsProviderRegistryOnly) {
      void loadAiReviewProviders(quantCoreBaseUrl, request.signal).then((providerResult) => {
        if (!coordinator.isCurrent(request)) {
          return;
        }
        applyProviders(providerResult.providers);
        coordinator.finish(request);
        syncAiReviewStage3Busy();
      });
      return () => coordinator.dispose();
    }

    if (activeWorkAreaId !== "ai-review") {
      coordinator.finish(request);
      syncAiReviewStage3Busy();
      return () => coordinator.dispose();
    }

    if (!strategyExperimentSourceRunId) {
      void loadAiReviewProviders(quantCoreBaseUrl, request.signal).then((providerResult) => {
        if (!coordinator.isCurrent(request)) {
          return;
        }
        applyProviders(providerResult.providers);
        setAiReviewStage3Error(providerResult.source === "core"
          ? null
          : strategyExperimentI18nRef.current.t("aiReviewStage3.error.serviceLoadFailed"));
        coordinator.finish(request);
        syncAiReviewStage3Busy();
      });
      return () => coordinator.dispose();
    }

    void Promise.all([
      loadAiReviewProviders(quantCoreBaseUrl, request.signal),
      loadAiReviewRunArchiveSnapshot(quantCoreBaseUrl, strategyExperimentSourceRunId, request.signal)
    ]).then(([providerResult, archiveResult]) => {
      if (!coordinator.isCurrent(request)) {
        return;
      }
      applyProviders(providerResult.providers);
      const restoredSelection = archiveResult.source === "core"
        ? resolveAiReviewRestoredSelection(
            archiveResult.authoritativeAiReviewRecords,
            archiveResult.aiReviewDecisions,
            strategyExperimentSourceRunId
          )
        : null;
      const restoredExperiment = restoredSelection
        ? resolveAiReviewDraftExperiment(
            restoredSelection.primaryExperimentId,
            aiReviewStage3Experiments,
            visibleStrategyExperimentDimensions,
            strategyExperimentGuardrails,
            strategyExperimentWalkForward
          )
        : null;
      if (archiveResult.source === "core" && restoredSelection) {
        setAiReviewStage3History(archiveResult.authoritativeAiReviewRecords);
        setAiReviewStage3LegacyHistory(archiveResult.legacyAiReviewRecords);
        if (restoredSelection.review) {
          setAiReviewStage3CurrentReview(restoredSelection.review);
          setAiReviewStage3Decisions(restoredSelection.decisions);
          setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(restoredSelection.decisions));
          if (restoredExperiment) {
            setAiReviewStage3PrimaryExperimentId(restoredSelection.primaryExperimentId);
            setAiReviewStage3ComparisonExperimentIds(restoredSelection.comparisonExperimentIds);
          }
        }
      }
      setAiReviewStage3Error(providerResult.source !== "core"
        ? strategyExperimentI18nRef.current.t("aiReviewStage3.error.serviceLoadFailed")
        : archiveResult.source !== "core"
          ? strategyExperimentI18nRef.current.t("aiReviewStage3.error.historyLoadFailed")
          : restoredSelection === null
            ? strategyExperimentI18nRef.current.t("aiReviewStage3.error.readbackInconsistent")
            : null);
      coordinator.finish(request);
      syncAiReviewStage3Busy();
    });

    return () => coordinator.dispose();
  }, [
    activeWorkAreaId,
    aiReviewStage3CandidateKey,
    aiReviewStage3ContextKey,
    strategyExperimentSourceRunId,
    syncAiReviewStage3Busy
  ]);

  useLayoutEffect(() => {
    const primary = resolveAiReviewPrimaryExperiment(
      visibleStrategyExperimentActive,
      aiReviewStage3Experiments
    );
    invalidateAiReviewStage3Review();
    setAiReviewStage3PrimaryExperimentId(primary?.experimentId ?? null);
    setAiReviewStage3ComparisonExperimentIds([]);
    setAiReviewStage3ExternalDataApproved(false);
    setAiReviewStage3Error(null);
  }, [aiReviewStage3CandidateKey, aiReviewStage3ContextKey, invalidateAiReviewStage3Review]);

  const selectAiReviewStage3Primary = useCallback((experimentId: string) => {
    const candidate = aiReviewStage3Experiments.find(
      (experiment) => experiment.experimentId === experimentId && experiment.status === "completed"
    );
    if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
      || !candidate || candidate.experimentId === aiReviewStage3PrimaryExperimentId) {
      return;
    }
    invalidateAiReviewStage3Review();
    setAiReviewStage3PrimaryExperimentId(candidate.experimentId);
    setAiReviewStage3ComparisonExperimentIds([]);
    setAiReviewStage3ExternalDataApproved(false);
    setAiReviewStage3Error(null);
  }, [
    aiReviewStage3Experiments,
    aiReviewStage3PrimaryExperimentId,
    invalidateAiReviewStage3Review,
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3
  ]);

  const toggleAiReviewStage3Comparison = useCallback((experimentId: string) => {
    const primary = aiReviewStage3Experiments.find(
      (experiment) => experiment.experimentId === aiReviewStage3PrimaryExperimentId
    );
    const candidate = aiReviewStage3Experiments.find((experiment) => experiment.experimentId === experimentId);
    if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
      || !primary || !candidate) {
      return;
    }
    const next = toggleAiReviewComparisonSelection(
      primary,
      candidate,
      aiReviewStage3ComparisonExperimentIds
    );
    if (next.join("|") === aiReviewStage3ComparisonExperimentIds.join("|")) {
      return;
    }
    invalidateAiReviewStage3Review();
    setAiReviewStage3ComparisonExperimentIds(next);
    setAiReviewStage3ExternalDataApproved(false);
    setAiReviewStage3Error(null);
  }, [
    aiReviewStage3ComparisonExperimentIds,
    aiReviewStage3Experiments,
    aiReviewStage3PrimaryExperimentId,
    invalidateAiReviewStage3Review,
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3
  ]);

  const selectAiReviewStage3Provider = useCallback((providerId: AiReviewProviderId) => {
    if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
      || providerId === aiReviewStage3ProviderId) {
      return;
    }
    invalidateAiReviewStage3Review();
    setAiReviewStage3ProviderId(providerId);
    setAiReviewStage3ExternalDataApproved(false);
    setAiReviewStage3Error(null);
  }, [
    aiReviewStage3ProviderId,
    invalidateAiReviewStage3Review,
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3
  ]);

  const approveAiReviewStage3ExternalData = useCallback((approved: boolean) => {
    if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
      || approved === aiReviewStage3ExternalDataApproved) {
      return;
    }
    invalidateAiReviewStage3Review();
    setAiReviewStage3ExternalDataApproved(approved);
    setAiReviewStage3Error(null);
  }, [
    aiReviewStage3ExternalDataApproved,
    invalidateAiReviewStage3Review,
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3
  ]);

  const configureStrategyExperimentWalkForward = useCallback((
    walkForward: StrategyExperimentWalkForward | null
  ) => {
    invalidateAiReviewStage3Review();
    setStrategyExperimentWalkForward(walkForward);
    setAiReviewStage3PrimaryExperimentId(null);
    setAiReviewStage3ComparisonExperimentIds([]);
    setAiReviewStage3ExternalDataApproved(false);
    setAiReviewStage3Error(null);
  }, [invalidateAiReviewStage3Review]);

  const runAiReviewStage3 = useCallback(async (primaryExperimentIdOverride?: string) => {
    const primaryExperimentId = primaryExperimentIdOverride ?? aiReviewStage3PrimaryExperimentId;
    const busy = isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision;
    if (busy) {
      return;
    }
    if (!primaryExperimentId) {
      setAiReviewStage3Error("未找到可评审的主实验，请先完成当前标的的回测实验。");
      return;
    }
    if (!aiReviewStage3Providers.some((provider) => provider.providerId === aiReviewStage3ProviderId)) {
      setAiReviewStage3Error("评审模型配置尚未加载完成，请稍后重试。");
      return;
    }
    if (aiReviewRequiresExternalApproval(aiReviewStage3ProviderId) && !aiReviewStage3ExternalDataApproved) {
      setAiReviewStage3Error("请先在评审设置中允许发送本次已完成 K 线与证据。");
      return;
    }
    if (!canRunAiReviewStage3({
      primaryExperimentId,
      providers: aiReviewStage3Providers,
      providerId: aiReviewStage3ProviderId,
      externalDataApproved: aiReviewStage3ExternalDataApproved,
      busy
    })) {
      setAiReviewStage3Error("当前评审服务不可用，请检查模型配置后重试。");
      return;
    }
    const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
    const request = coordinator.beginReview("running");
    syncAiReviewStage3Busy();
    setAiReviewStage3Error(null);
    const result = await createAuthoritativeAiReview(quantCoreBaseUrl, {
      primaryExperimentId,
      comparisonExperimentIds: aiReviewStage3ComparisonExperimentIds,
      providerId: aiReviewStage3ProviderId,
      externalDataApproved: aiReviewStage3ExternalDataApproved
    }, request.signal);
    if (!coordinator.isCurrent(request)) {
      return;
    }
    coordinator.finish(request);
    syncAiReviewStage3Busy();
    if (result.source !== "core" || !result.review) {
      setAiReviewStage3Error(strategyExperimentI18nRef.current.t("aiReviewStage3.error.reviewFailed"));
      return;
    }
    setAiReviewStage3CurrentReview(result.review);
    setAiReviewStage3Decisions(result.latestDecision ? [result.latestDecision] : []);
    setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(result.latestDecision ? [result.latestDecision] : []));
    setAiReviewStage3History((current) => [
      result.review!,
      ...current.filter((review) => review.aiReviewId !== result.review!.aiReviewId)
    ]);
  }, [
    aiReviewStage3ComparisonExperimentIds,
    aiReviewStage3ExternalDataApproved,
    aiReviewStage3PrimaryExperimentId,
    aiReviewStage3ProviderId,
    aiReviewStage3Providers,
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3,
    syncAiReviewStage3Busy
  ]);

  const inspectAiReviewStage3 = useCallback(async (aiReviewId: string) => {
    if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision) {
      return;
    }
    const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
    const request = coordinator.beginReview("running");
    syncAiReviewStage3Busy();
    setAiReviewStage3CurrentReview(null);
    setAiReviewStage3Decisions([]);
    setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft([]));
    setAiReviewStage3Error(null);
    const [reviewResult, decisionResult] = await Promise.all([
      loadAuthoritativeAiReview(quantCoreBaseUrl, aiReviewId, request.signal),
      loadAiReviewDecisions(quantCoreBaseUrl, aiReviewId, request.signal)
    ]);
    if (!coordinator.isCurrent(request)) {
      return;
    }
    coordinator.finish(request);
    syncAiReviewStage3Busy();
    const latestDecision = decisionResult.decisions.at(-1) ?? null;
    if (reviewResult.source !== "core" || !reviewResult.review || decisionResult.source !== "core"
      || (reviewResult.latestDecision?.decisionId ?? null) !== (latestDecision?.decisionId ?? null)) {
      setAiReviewStage3Error(
        strategyExperimentI18nRef.current.t("aiReviewStage3.error.readbackInconsistent")
      );
      return;
    }
    setAiReviewStage3CurrentReview(reviewResult.review);
    setAiReviewStage3Decisions(decisionResult.decisions);
    setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(decisionResult.decisions));
  }, [
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3,
    syncAiReviewStage3Busy
  ]);

  const updateAiReviewStage3DecisionDraft = useCallback((draft: AppendAiReviewDecisionRequest) => {
    if (isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision) {
      return;
    }
    setAiReviewStage3DecisionDraft({
      ...draft,
      supersedesDecisionId: aiReviewStage3Decisions.at(-1)?.decisionId ?? null
    });
  }, [
    aiReviewStage3Decisions,
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3
  ]);

  const appendAiReviewStage3Decision = useCallback(async () => {
    if (!aiReviewStage3CurrentReview
      || isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision) {
      return;
    }
    const coordinator = aiReviewStage3RequestCoordinatorRef.current!;
    const request = coordinator.beginReview("appending");
    syncAiReviewStage3Busy();
    const reviewId = aiReviewStage3CurrentReview.aiReviewId;
    const decisionRequest: AppendAiReviewDecisionRequest = {
      ...aiReviewStage3DecisionDraft,
      operator: aiReviewStage3DecisionDraft.operator.trim(),
      rationale: aiReviewStage3DecisionDraft.rationale.trim(),
      supersedesDecisionId: aiReviewStage3Decisions.at(-1)?.decisionId ?? null
    };
    setAiReviewStage3Error(null);
    const result = await appendAiReviewDecisionAndReadback({
      aiReviewId: reviewId,
      request: decisionRequest,
      signal: request.signal,
      append: async (currentReviewId, currentRequest, signal) => {
        const response = await appendAiReviewDecision(
          quantCoreBaseUrl,
          currentReviewId,
          currentRequest,
          signal
        );
        return response.source === "core" && response.decision ? { decision: response.decision } : {};
      },
      load: async (currentReviewId, signal) => {
        const response = await loadAiReviewDecisions(quantCoreBaseUrl, currentReviewId, signal);
        return response.source === "core" ? { decisions: response.decisions } : {};
      },
      isCurrent: () => coordinator.isCurrent(request)
    });
    if (result.status === "stale") {
      return;
    }
    coordinator.finish(request);
    syncAiReviewStage3Busy();
    if (result.status !== "committed" || !result.decisions) {
      setAiReviewStage3Error(
        strategyExperimentI18nRef.current.t(
          result.status === "append-failed"
            ? "aiReviewStage3.error.decisionAppendFailed"
            : "aiReviewStage3.error.decisionReadbackFailed"
        )
      );
      return;
    }
    setAiReviewStage3Decisions(result.decisions);
    setAiReviewStage3DecisionDraft(buildAiReviewDecisionDraft(
      result.decisions,
      decisionRequest.operator,
      ""
    ));
  }, [
    aiReviewStage3CurrentReview,
    aiReviewStage3DecisionDraft,
    aiReviewStage3Decisions,
    isAppendingAiReviewStage3Decision,
    isLoadingAiReviewStage3,
    isRunningAiReviewStage3,
    syncAiReviewStage3Busy
  ]);

  const strategyExperimentRequestIsCurrent = useCallback((requestGeneration: number, sourceKey: string) => (
    strategyExperimentRequestGenerationRef.current === requestGeneration &&
    strategyExperimentSourceKeyRef.current === sourceKey
  ), []);

  const beginStrategyExperimentRequest = useCallback((sourceKey: string): number | null => {
    if (strategyExperimentSourceKeyRef.current !== sourceKey) {
      return null;
    }
    const requestGeneration = strategyExperimentRequestGenerationRef.current + 1;
    strategyExperimentRequestGenerationRef.current = requestGeneration;
    setIsStrategyExperimentRunning(true);
    setStrategyExperimentError(null);
    return requestGeneration;
  }, []);

  const refreshStrategyExperiments = useCallback(async (
    requestGeneration: number,
    sourceKey: string,
    sourceRunId: string,
    strategyRevision: string
  ) => {
    try {
      const result = await loadStrategyExperiments(quantCoreBaseUrl, {
        sourceRunId,
        strategyRevision,
        limit: 20
      });
      if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        return;
      }
      if (result.error) {
        setStrategyExperimentError(
          strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
        );
        return;
      }
      setStrategyExperimentHistory(
        result.experiments.filter((experiment) => strategyExperimentMatchesSourceKey(experiment, sourceKey))
      );
      setStrategyExperimentHistorySourceKey(sourceKey);
      setStrategyExperimentError(null);
    } catch (historyError) {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setStrategyExperimentError(strategyExperimentErrorMessage(
          strategyExperimentI18nRef.current,
          undefined,
          historyError instanceof Error ? historyError.message : undefined
        ));
      }
    }
  }, [strategyExperimentRequestIsCurrent]);

  useEffect(() => {
    resetAiReviewHistoryState();
  }, [resetAiReviewHistoryState, workspace.researchRun?.runId]);

  useEffect(() => {
    const requestGeneration = strategyExperimentRequestGenerationRef.current + 1;
    strategyExperimentRequestGenerationRef.current = requestGeneration;
    setIsStrategyExperimentRunning(false);
    setStrategyExperimentError(null);
    setStrategyExperimentDraftSourceKey(strategyExperimentUsableSourceKey);
    setStrategyExperimentDimensions(
      strategyExperimentUsableSourceKey && workspace.researchRun?.strategyConfig
        ? buildDefaultStrategyExperimentDimensions(workspace.researchRun.strategyConfig)
        : []
    );
    if (
      !strategyExperimentUsableSourceKey ||
      !strategyExperimentSourceRunId ||
      !strategyExperimentStrategyRevision
    ) {
      setStrategyExperimentHistory([]);
      setStrategyExperimentHistorySourceKey(null);
      return;
    }
    void refreshStrategyExperiments(
      requestGeneration,
      strategyExperimentUsableSourceKey,
      strategyExperimentSourceRunId,
      strategyExperimentStrategyRevision
    );
  }, [refreshStrategyExperiments, strategyExperimentUsableSourceKey]);

  useEffect(() => {
    if (initialStrategyExperimentIdRef.current) {
      return;
    }
    replaceStrategyExperimentUrlParam(visibleStrategyExperimentUrlId);
  }, [visibleStrategyExperimentUrlId]);

  useEffect(() => {
    void refreshP0AcceptanceLatest();
  }, [refreshP0AcceptanceLatest]);

  useEffect(() => {
    void refreshDesktopReleaseLatest();
  }, [refreshDesktopReleaseLatest]);

  useEffect(() => {
    void refreshStage1DailyUseLatest();
  }, [refreshStage1DailyUseLatest]);

  useEffect(() => {
    void refreshStage1BootstrapPreflightLatest();
  }, [refreshStage1BootstrapPreflightLatest]);

  useEffect(() => {
    void refreshP1AcceptanceLatest();
  }, [refreshP1AcceptanceLatest]);

  useEffect(() => {
    void refreshP2PaperReplayLatest();
  }, [refreshP2PaperReplayLatest]);

  useEffect(() => {
    void refreshP2PreLiveAcceptanceLatest();
  }, [refreshP2PreLiveAcceptanceLatest]);

  useEffect(() => {
    void refreshP2ReadinessAcceptanceLatest();
  }, [refreshP2ReadinessAcceptanceLatest]);

  useEffect(() => {
    void refreshP2ManifestChainPreflightLatest();
  }, [refreshP2ManifestChainPreflightLatest]);

  const refreshAiReviewRunHistory = useCallback(
    async (runId: string, options: { commit?: boolean; offset?: number; query?: string } = {}) => {
      const offset = options.offset ?? aiReviewHistoryOffset;
      const query = options.query ?? aiReviewHistoryQuery;
      const commit = options.commit !== false;
      const requestId = commit ? nextAiReviewHistoryRequestId(aiReviewHistoryRequestIdRef.current) : null;
      if (requestId !== null) {
        aiReviewHistoryRequestIdRef.current = requestId;
        setIsLoadingAiReviewHistory(true);
      }
      const aiReviewHistory = await loadResearchRunAiReviews(quantCoreBaseUrl, runId, {
        limit: AI_REVIEW_HISTORY_PAGE_SIZE,
        offset,
        query
      });
      if (requestId !== null && aiReviewHistoryRequestIdRef.current === requestId) {
        setAiReviewRunRecords(aiReviewHistory.aiReviews);
        setAiReviewHistoryPagination(aiReviewHistory.pagination ?? null);
        setIsLoadingAiReviewHistory(false);
      }
      return aiReviewHistory;
    },
    [aiReviewHistoryOffset, aiReviewHistoryQuery]
  );

  const refreshAuditEvidenceReportEvents = useCallback(async () => {
    const requestId = auditEvidenceReportRequestIdRef.current + 1;
    auditEvidenceReportRequestIdRef.current = requestId;
    setIsLoadingAuditEvidenceReportEvents(true);
    const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
      eventType:
        "audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report,p0_acceptance_review,p2_manifest_chain_preflight,p2_manifest_chain_preflight_review,p2_readiness_evidence_coverage_review,p2_readiness_acceptance_generated,p2_readiness_acceptance_review,personal_team_readiness_review,daily_ops_control_room_review,daily_start_brief_review,stage1_daily_archive_review,operator_runbook_report,pre_live_runbook_report,research_context_readiness_report",
      limit: AUDIT_REPORT_EVENTS_PAGE_SIZE,
      offset: auditEvidenceReportOffset,
      query: auditEvidenceReportQuery.trim() || undefined
    });
    if (auditEvidenceReportRequestIdRef.current !== requestId) {
      return auditHistory;
    }
    if (auditHistory.source === "core") {
      setAuditEvidenceReportEvents(auditHistory.events);
      setAuditEvidenceReportPagination(auditHistory.pagination ?? null);
    } else {
      setAuditEvidenceReportPagination(null);
    }
    setIsLoadingAuditEvidenceReportEvents(false);
    return auditHistory;
  }, [auditEvidenceReportOffset, auditEvidenceReportQuery, quantCoreBaseUrl]);

  const refreshExecutionAcceptanceAuditEvents = useCallback(async () => {
    const requestId = executionAcceptanceAuditRequestIdRef.current + 1;
    executionAcceptanceAuditRequestIdRef.current = requestId;
    const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
      eventType: executionAcceptanceAuditEventTypes.join(","),
      limit: 100
    });
    if (executionAcceptanceAuditRequestIdRef.current !== requestId) {
      return auditHistory;
    }
    setExecutionAcceptanceAuditEvents(auditHistory.source === "core" ? auditHistory.events : []);
    return auditHistory;
  }, [quantCoreBaseUrl]);

  const refreshMarketDataRefreshOverrideAuditEvents = useCallback(async () => {
    const requestId = marketDataRefreshOverrideAuditRequestIdRef.current + 1;
    marketDataRefreshOverrideAuditRequestIdRef.current = requestId;
    setIsLoadingMarketDataRefreshOverrideAudit(true);
    const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
      eventType: "market_data_refresh_override",
      limit: MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE,
      offset: marketDataRefreshOverrideAuditOffset,
      query: marketDataRefreshOverrideAuditQuery.trim() || undefined
    });
    if (marketDataRefreshOverrideAuditRequestIdRef.current !== requestId) {
      return auditHistory;
    }
    if (auditHistory.source === "core") {
      setMarketDataRefreshOverrideAuditEvents(auditHistory.events);
      setMarketDataRefreshOverrideAuditPagination(auditHistory.pagination ?? null);
    } else {
      setMarketDataRefreshOverrideAuditPagination(null);
    }
    setIsLoadingMarketDataRefreshOverrideAudit(false);
    return auditHistory;
  }, [marketDataRefreshOverrideAuditOffset, marketDataRefreshOverrideAuditQuery, quantCoreBaseUrl]);

  const refreshPortfolioProductionRisk = useCallback(async (showLoading = false) => {
    const requestId = portfolioProductionRiskRequestIdRef.current + 1;
    portfolioProductionRiskRequestIdRef.current = requestId;
    if (showLoading) setIsLoadingPortfolioProductionRisk(true);
    try {
      const snapshot = await loadAutoTradingSnapshot(quantCoreBaseUrl);
      if (portfolioProductionRiskRequestIdRef.current !== requestId) return;
      setAutoTradingSnapshot(snapshot);
      setPortfolioProductionRiskError(null);
    } catch (error) {
      if (portfolioProductionRiskRequestIdRef.current !== requestId) return;
      setAutoTradingSnapshot(null);
      setPortfolioProductionRiskError(autoTradingErrorMessage(error));
    } finally {
      if (showLoading && portfolioProductionRiskRequestIdRef.current === requestId) {
        setIsLoadingPortfolioProductionRisk(false);
      }
    }
  }, [quantCoreBaseUrl]);

  const refreshPortfolioPaperOrderAuditEvents = useCallback(async () => {
    const requestId = portfolioPaperOrderAuditRequestIdRef.current + 1;
    portfolioPaperOrderAuditRequestIdRef.current = requestId;
    setIsLoadingPortfolioPaperOrderAudit(true);
    const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
      eventType: PORTFOLIO_PAPER_ORDER_AUDIT_EVENT_TYPES,
      limit: PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE,
      offset: portfolioPaperOrderAuditOffset,
      query: portfolioPaperOrderAuditQuery.trim() || undefined
    });
    if (portfolioPaperOrderAuditRequestIdRef.current !== requestId) {
      return auditHistory;
    }
    if (auditHistory.source === "core") {
      setPortfolioPaperOrderAuditEvents(auditHistory.events);
      setPortfolioPaperOrderAuditPagination(auditHistory.pagination ?? null);
    } else {
      setPortfolioPaperOrderAuditPagination(null);
    }
    setIsLoadingPortfolioPaperOrderAudit(false);
    return auditHistory;
  }, [portfolioPaperOrderAuditOffset, portfolioPaperOrderAuditQuery, quantCoreBaseUrl]);

  const refreshExecutionAdapterPaperExecutionAuditEvents = useCallback(async () => {
    const requestId = executionAdapterPaperExecutionAuditRequestIdRef.current + 1;
    executionAdapterPaperExecutionAuditRequestIdRef.current = requestId;
    setIsLoadingExecutionAdapterPaperExecutionAudit(true);
    const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
      eventType: EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENT_TYPES,
      limit: EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENTS_PAGE_SIZE,
      offset: executionAdapterPaperExecutionAuditOffset,
      query: executionAdapterPaperExecutionAuditQuery.trim() || undefined
    });
    if (executionAdapterPaperExecutionAuditRequestIdRef.current !== requestId) {
      return auditHistory;
    }
    if (auditHistory.source === "core") {
      setExecutionAdapterPaperExecutionAuditEvents(auditHistory.events);
      setExecutionAdapterPaperExecutionAuditPagination(auditHistory.pagination ?? null);
    } else {
      setExecutionAdapterPaperExecutionAuditPagination(null);
    }
    setIsLoadingExecutionAdapterPaperExecutionAudit(false);
    return auditHistory;
  }, [
    executionAdapterPaperExecutionAuditOffset,
    executionAdapterPaperExecutionAuditQuery,
    quantCoreBaseUrl
  ]);

  const refreshAuditSigningKeyRotationEvents = useCallback(async () => {
    setIsLoadingAuditSigningKeyRotationEvents(true);
    const [
      rotationPlanHistory,
      rotationApplyHistory,
      controlledRestartHistory,
      secretMaterializationEventHistory,
      secretMaterializationHistory,
      environmentBindingEventHistory,
      environmentBindingHistory,
      runtimeReloadPlanEventHistory,
      runtimeReloadPlanHistory,
      runtimeReloadExecutionEventHistory,
      runtimeReloadExecutionHistory,
      rotationAcceptanceEventHistory,
      rotationAcceptanceHistory
    ] = await Promise.all([
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_rotation_plan",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_rotation_apply",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_controlled_restart_evidence",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_secret_materialization",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditSigningKeySecretMaterializations(
        quantCoreBaseUrl,
        "",
        undefined,
        AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
      ),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_environment_binding",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditSigningKeyEnvironmentBindings(
        quantCoreBaseUrl,
        "",
        undefined,
        AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
      ),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_runtime_reload_plan",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditSigningKeyRuntimeReloadPlans(
        quantCoreBaseUrl,
        "",
        undefined,
        AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
      ),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_runtime_reload_execution",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditSigningKeyRuntimeReloadExecutions(
        quantCoreBaseUrl,
        "",
        undefined,
        AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
      ),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_rotation_acceptance",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditSigningKeyRotationAcceptances(
        quantCoreBaseUrl,
        "",
        undefined,
        AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE
      )
    ]);
    if (
      rotationPlanHistory.source === "core" ||
      rotationApplyHistory.source === "core" ||
      controlledRestartHistory.source === "core" ||
      secretMaterializationEventHistory.source === "core" ||
      environmentBindingEventHistory.source === "core" ||
      runtimeReloadPlanEventHistory.source === "core" ||
      runtimeReloadExecutionEventHistory.source === "core" ||
      rotationAcceptanceEventHistory.source === "core"
    ) {
      const rotationEvents = [
        ...(rotationPlanHistory.source === "core" ? rotationPlanHistory.events : []),
        ...(rotationApplyHistory.source === "core" ? rotationApplyHistory.events : []),
        ...(controlledRestartHistory.source === "core" ? controlledRestartHistory.events : []),
        ...(secretMaterializationEventHistory.source === "core" ? secretMaterializationEventHistory.events : []),
        ...(environmentBindingEventHistory.source === "core" ? environmentBindingEventHistory.events : []),
        ...(runtimeReloadPlanEventHistory.source === "core" ? runtimeReloadPlanEventHistory.events : []),
        ...(runtimeReloadExecutionEventHistory.source === "core" ? runtimeReloadExecutionEventHistory.events : []),
        ...(rotationAcceptanceEventHistory.source === "core" ? rotationAcceptanceEventHistory.events : [])
      ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
      setAuditSigningKeyRotationEvents(
        rotationEvents
      );
    }
    if (secretMaterializationHistory.source === "core") {
      setAuditSigningKeySecretMaterialization({
        secretMaterialization: secretMaterializationHistory.secretMaterializations[0],
        source: "core"
      });
    }
    if (environmentBindingHistory.source === "core") {
      setAuditSigningKeyEnvironmentBinding({
        environmentBinding: environmentBindingHistory.environmentBindings[0],
        source: "core"
      });
    }
    if (runtimeReloadPlanHistory.source === "core") {
      setAuditSigningKeyRuntimeReloadPlan({
        runtimeReloadPlan: runtimeReloadPlanHistory.runtimeReloadPlans[0],
        source: "core"
      });
    }
    if (runtimeReloadExecutionHistory.source === "core") {
      setAuditSigningKeyRuntimeReloadExecution({
        runtimeReloadExecution: runtimeReloadExecutionHistory.runtimeReloadExecutions[0],
        source: "core"
      });
    }
    if (rotationAcceptanceHistory.source === "core") {
      setAuditSigningKeyRotationAcceptance({
        rotationAcceptance: rotationAcceptanceHistory.rotationAcceptances[0],
        source: "core"
      });
    }
    setIsLoadingAuditSigningKeyRotationEvents(false);
    return rotationPlanHistory;
  }, [quantCoreBaseUrl]);

  const refreshResearchRunImportAuditEvents = useCallback(async () => {
    const requestId = researchRunImportAuditRequestIdRef.current + 1;
    researchRunImportAuditRequestIdRef.current = requestId;
    setIsLoadingResearchRunImportAudit(true);
    const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
      eventType: "research_run_import",
      limit: IMPORT_AUDIT_EVENTS_PAGE_SIZE,
      offset: researchRunImportAuditOffset,
      query: researchRunImportAuditQuery.trim() || undefined
    });
    if (researchRunImportAuditRequestIdRef.current !== requestId) {
      return auditHistory;
    }
    if (auditHistory.source === "core") {
      const importedEvents = auditHistory.events
        .map(auditEventRecordToResearchRunImportEvent)
        .filter((event): event is ResearchRunImportAuditEvent => Boolean(event));
      setResearchRunImportAuditEvents(importedEvents);
      setResearchRunImportAuditPagination(auditHistory.pagination ?? null);
    } else {
      setResearchRunImportAuditPagination(null);
    }
    setIsLoadingResearchRunImportAudit(false);
    return auditHistory;
  }, [quantCoreBaseUrl, researchRunImportAuditOffset, researchRunImportAuditQuery]);

  useEffect(() => {
    const requestId = aiReviewArchivePreviewRequestIdRef.current + 1;
    aiReviewArchivePreviewRequestIdRef.current = requestId;
    const aiReviewArchivePreviewController = new AbortController();
    const runId = currentResearchRunId ?? null;

    if (activeWorkAreaId !== "audit" || !runId) {
      setAiReviewArchivePreview({
        aiReviewDecisions: [],
        authoritativeAiReviewRecords: [],
        error: null,
        legacyAiReviewRecords: [],
        runId,
        status: "idle"
      });
      return () => aiReviewArchivePreviewController.abort();
    }

    setAiReviewArchivePreview({
      aiReviewDecisions: [],
      authoritativeAiReviewRecords: [],
      error: null,
      legacyAiReviewRecords: [],
      runId,
      status: "loading"
    });
    void loadAiReviewRunArchiveSnapshot(
      quantCoreBaseUrl,
      runId,
      aiReviewArchivePreviewController.signal
    ).then((result) => {
      if (
        aiReviewArchivePreviewController.signal.aborted
        || aiReviewArchivePreviewRequestIdRef.current !== requestId
      ) {
        return;
      }
      setAiReviewArchivePreview({
        aiReviewDecisions: result.source === "core" ? result.aiReviewDecisions : [],
        authoritativeAiReviewRecords: result.source === "core" ? result.authoritativeAiReviewRecords : [],
        error: result.source === "core" ? null : result.error ?? "AI Review archive readback failed.",
        legacyAiReviewRecords: result.source === "core" ? result.legacyAiReviewRecords : [],
        runId,
        status: result.source === "core" ? "ready" : "failed"
      });
    }).catch((archiveError: unknown) => {
      if (
        aiReviewArchivePreviewController.signal.aborted
        || aiReviewArchivePreviewRequestIdRef.current !== requestId
      ) {
        return;
      }
      setAiReviewArchivePreview({
        aiReviewDecisions: [],
        authoritativeAiReviewRecords: [],
        error: archiveError instanceof Error ? archiveError.message : "AI Review archive readback failed.",
        legacyAiReviewRecords: [],
        runId,
        status: "failed"
      });
    });

    return () => aiReviewArchivePreviewController.abort();
  }, [activeWorkAreaId, currentResearchRunId]);

  useEffect(() => {
    if (activeWorkAreaId !== "audit") {
      return;
    }
    void refreshAuditEvidenceReportEvents();
    void refreshExecutionAcceptanceAuditEvents();
    void refreshMarketDataRefreshOverrideAuditEvents();
    void refreshPortfolioPaperOrderAuditEvents();
    void refreshExecutionAdapterPaperExecutionAuditEvents();
    void refreshAuditSigningKeyRotationEvents();
    void refreshResearchRunImportAuditEvents();
  }, [
    activeWorkAreaId,
    refreshAuditEvidenceReportEvents,
    refreshExecutionAcceptanceAuditEvents,
    refreshMarketDataRefreshOverrideAuditEvents,
    refreshPortfolioPaperOrderAuditEvents,
    refreshExecutionAdapterPaperExecutionAuditEvents,
    refreshAuditSigningKeyRotationEvents,
    refreshResearchRunImportAuditEvents
  ]);

  useEffect(() => {
    return () => {
      if (importAuditCopyResetTimerRef.current !== null) {
        window.clearTimeout(importAuditCopyResetTimerRef.current);
      }
      if (auditEvidenceSummaryCopyResetTimerRef.current !== null) {
        window.clearTimeout(auditEvidenceSummaryCopyResetTimerRef.current);
      }
      if (auditEvidenceReportCopyResetTimerRef.current !== null) {
        window.clearTimeout(auditEvidenceReportCopyResetTimerRef.current);
      }
      if (researchContextLinkCopyResetTimerRef.current !== null) {
        window.clearTimeout(researchContextLinkCopyResetTimerRef.current);
      }
      if (researchContextReadinessReportCopyResetTimerRef.current !== null) {
        window.clearTimeout(researchContextReadinessReportCopyResetTimerRef.current);
      }
      if (operatorRunbookCopyResetTimerRef.current !== null) {
        window.clearTimeout(operatorRunbookCopyResetTimerRef.current);
      }
      if (preLiveRunbookCopyResetTimerRef.current !== null) {
        window.clearTimeout(preLiveRunbookCopyResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeWorkAreaId !== "audit") {
      return;
    }
    const runId = workspace.researchRun?.runId;
    if (!runId) {
      setAiReviewRunRecords([]);
      setAiReviewHistoryPagination(null);
      return;
    }
    void refreshAiReviewRunHistory(runId);
  }, [activeWorkAreaId, refreshAiReviewRunHistory, workspace.researchRun?.runId]);

  const refreshStrategyLibrary = useCallback(async () => {
    const result = await loadStrategyLibrary(quantCoreBaseUrl, {
      limit: 12
    });
    setStrategyLibraryState(result);
    return result;
  }, []);

  const refreshStrategyProductionBinding = useCallback(async () => {
    const result = await loadStrategyProductionBinding(quantCoreBaseUrl);
    setStrategyProductionBindingState(result);
    return result;
  }, []);

  const refreshResearchNote = useCallback(async () => {
    const result = await loadResearchNote(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    });
    setResearchNoteState(result);
    updateResearchNoteDraft(result.note?.body ?? "");
  }, [
    updateResearchNoteDraft,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const refreshHandoffNotes = useCallback(async () => {
    const runId = workspace.researchRun?.runId;
    if (!runId) {
      setHandoffNotesState(initialHandoffNotesState);
      setHandoffNoteDraft("");
      return;
    }
    const result = await loadHandoffNotes(quantCoreBaseUrl, "research_run", runId);
    setHandoffNotesState(result);
  }, [workspace.researchRun?.runId]);

  const refreshMarketCalendarStatus = useCallback(async (silent = false) => {
    const requestId = marketCalendarRequestIdRef.current + 1;
    marketCalendarRequestIdRef.current = requestId;
    const market = workspace.selectedInstrument.market;
    if (!silent) {
      setMarketCalendarState(buildFallbackMarketCalendarState(market));
    }
    const result = await loadMarketCalendarStatus(quantCoreBaseUrl, market);
    if (
      marketCalendarRequestIdRef.current !== requestId ||
      workspaceRef.current.selectedInstrument.market !== market
    ) {
      return;
    }
    if (silent && result.source !== "core") {
      setMarketCalendarState((current) => ({
        ...current,
        error: result.error ?? current.error
      }));
      return;
    }
    setMarketCalendarState(result);
  }, [workspace.selectedInstrument.market]);

  useEffect(() => {
    void refreshMarketCalendarStatus();
  }, [refreshMarketCalendarStatus]);

  const searchMarketDiscovery = useCallback(async (params: MarketDiscoveryParams) => {
    const requestId = marketDiscoveryRequestIdRef.current + 1;
    marketDiscoveryRequestIdRef.current = requestId;
    marketDiscoveryRequestMarketRef.current = params.market;
    setIsLoadingMarketDiscovery(true);
    setMarketDiscoveryResult((current) =>
      current?.market === params.market ? current : null
    );
    const result = await loadMarketDiscovery(quantCoreBaseUrl, params);
    if (marketDiscoveryRequestIdRef.current !== requestId) {
      return;
    }
    marketDiscoveryRequestMarketRef.current = null;
    setMarketDiscoveryResult(result);
    setIsLoadingMarketDiscovery(false);
  }, [quantCoreBaseUrl]);

  const refreshMarketAiSelectionStatistics = useCallback(async () => {
    const token = marketAiSelectionStatisticsRequestRef.current.begin();
    setIsLoadingMarketAiSelectionStatistics(true);
    setMarketAiSelectionStatistics((current) => ({ ...current, error: undefined }));
    const result = await loadMarketAiSelectionQualityStatistics(quantCoreBaseUrl);
    if (!marketAiSelectionStatisticsRequestRef.current.isCurrent(token)) {
      return;
    }
    setIsLoadingMarketAiSelectionStatistics(false);
    setMarketAiSelectionStatistics((current) => result.statistics
      ? result
      : {
          ...current,
          source: "fallback",
          error: result.error ?? "AI 选股质量统计暂时不可用",
        });
  }, [quantCoreBaseUrl]);

  useEffect(() => {
    if (activeWorkAreaId === "market") {
      void refreshMarketAiSelectionStatistics();
    }
  }, [activeWorkAreaId, refreshMarketAiSelectionStatistics]);

  const runMarketAiSelection = useCallback(async (
    request: MarketAiSelectionRequest,
    requestKey: string
  ) => {
    const token = marketAiSelectionRequestRef.current.begin();
    setIsLoadingMarketAiSelection(true);
    setMarketAiSelection((current) => ({
      ...current,
      error: undefined
    }));
    const result = await createMarketAiSelection(quantCoreBaseUrl, request);
    if (!marketAiSelectionRequestRef.current.isCurrent(token)) {
      return;
    }
    setIsLoadingMarketAiSelection(false);
    if (result.selection) {
      setMarketAiSelection(result);
      setMarketAiSelectionRequestKey(requestKey);
      marketAiSelectionReviewRequestRef.current.begin();
      setIsLoadingMarketAiSelectionReview(false);
      setMarketAiSelectionReview({ source: "fallback" });
      void refreshMarketAiSelectionStatistics();
      return;
    }
    setMarketAiSelection((current) => ({
      ...current,
      source: "fallback",
      error: result.error ?? "AI 选股服务暂时不可用"
    }));
  }, [quantCoreBaseUrl, refreshMarketAiSelectionStatistics]);

  const runMarketAiSelectionReview = useCallback(async (
    request: MarketAiSelectionReviewRequest,
  ) => {
    const token = marketAiSelectionReviewRequestRef.current.begin();
    setIsLoadingMarketAiSelectionReview(true);
    setMarketAiSelectionReview((current) => ({
      ...current,
      error: undefined,
    }));
    const result = await createMarketAiSelectionReview(quantCoreBaseUrl, request);
    if (!marketAiSelectionReviewRequestRef.current.isCurrent(token)) {
      return;
    }
    setIsLoadingMarketAiSelectionReview(false);
    if (result.review) {
      setMarketAiSelectionReview(result);
      void refreshMarketAiSelectionStatistics();
      return;
    }
    setMarketAiSelectionReview((current) => ({
      ...current,
      source: "fallback",
      error: result.error ?? "AI 选股复盘服务暂时不可用",
    }));
  }, [quantCoreBaseUrl, refreshMarketAiSelectionStatistics]);

  const marketDiscoveryMarket = workspace.selectedInstrument.market === "crypto"
    ? "crypto"
    : "ashare";
  useEffect(() => {
    if (
      activeWorkAreaId !== "market"
      || marketDiscoveryResult?.market === marketDiscoveryMarket
      || marketDiscoveryRequestMarketRef.current === marketDiscoveryMarket
    ) {
      return;
    }
    void searchMarketDiscovery({
      market: marketDiscoveryMarket,
      sort: "changePct",
      direction: "desc",
      limit: 20,
    });
  }, [
    activeWorkAreaId,
    marketDiscoveryMarket,
    marketDiscoveryResult,
    searchMarketDiscovery,
  ]);

  const marketInformationSymbol =
    workspace.selectedInstrument.market === marketInformationMarket
      ? workspace.selectedInstrument.symbol
      : "";
  const marketInformationName =
    workspace.selectedInstrument.market === marketInformationMarket
      ? workspace.selectedInstrument.name
      : "";

  const refreshMarketInformation = useCallback(async () => {
    const market = marketInformationMarket;
    const symbol = marketInformationSymbol;
    const name = marketInformationName;
    const contextKey = `${market}:${symbol}:${name}`;
    const requestToken = marketInformationRequestRef.current.begin();
    const newsRequestToken = marketInformationNewsRequestRef.current.begin();
    marketInformationRequestContextRef.current = contextKey;
    setIsLoadingMarketInformation(true);
    setIsLoadingMarketInformationNews(true);
    setMarketInformationResult((current) =>
      current?.market === market && current.symbol === symbol ? current : null
    );
    setMarketInformationNewsResult((current) =>
      current?.market === market && current.symbol === symbol ? current : null
    );
    const newsResult = await loadMarketInformation(quantCoreBaseUrl, {
      market,
      symbol,
      name,
      limit: 20,
      offset: 0,
      section: "news",
      scope: "all",
    });
    if (!marketInformationNewsRequestRef.current.isCurrent(newsRequestToken)) {
      return;
    }
    setMarketInformationNewsResult(newsResult);
    setIsLoadingMarketInformationNews(false);
    const result = await loadMarketInformation(quantCoreBaseUrl, {
      market,
      symbol,
      name,
      limit: 20,
      offset: 0,
      scope: "all",
    });
    if (!marketInformationRequestRef.current.isCurrent(requestToken)) {
      return;
    }
    marketInformationRequestContextRef.current = null;
    setMarketInformationResult((current) => result.error && current ? current : result);
    if (!result.error) {
      setMarketInformationNewsResult((current) => !current || current.error ? result : current);
    }
    setIsLoadingMarketInformation(false);
  }, [
    marketInformationMarket,
    marketInformationName,
    marketInformationSymbol,
    quantCoreBaseUrl,
  ]);

  const refreshMarketInformationNews = useCallback(async (
    offset: number,
    scope: "all" | "market" | "instrument",
  ) => {
    const requestToken = marketInformationNewsRequestRef.current.begin();
    setIsLoadingMarketInformationNews(true);
    const result = await loadMarketInformation(quantCoreBaseUrl, {
      market: marketInformationMarket,
      symbol: marketInformationSymbol,
      name: marketInformationName,
      limit: 20,
      offset,
      section: "news",
      scope,
    });
    if (!marketInformationNewsRequestRef.current.isCurrent(requestToken)) {
      return;
    }
    setMarketInformationNewsResult(result);
    setIsLoadingMarketInformationNews(false);
  }, [
    marketInformationMarket,
    marketInformationName,
    marketInformationSymbol,
    quantCoreBaseUrl,
  ]);

  useEffect(() => {
    const contextKey = `${marketInformationMarket}:${marketInformationSymbol}:${marketInformationName}`;
    if (
      activeWorkAreaId !== "market-information"
      || (
        marketInformationResult?.market === marketInformationMarket
        && marketInformationResult.symbol === marketInformationSymbol
      )
      || marketInformationRequestContextRef.current === contextKey
    ) {
      return;
    }
    void refreshMarketInformation();
  }, [
    activeWorkAreaId,
    marketInformationMarket,
    marketInformationName,
    marketInformationResult,
    marketInformationSymbol,
    refreshMarketInformation,
  ]);

  const selectMarketInformationMarket = useCallback((market: Market) => {
    if (market === marketInformationMarket) {
      return;
    }
    marketInformationRequestRef.current.begin();
    marketInformationNewsRequestRef.current.begin();
    marketInformationRequestContextRef.current = null;
    setMarketInformationResult(null);
    setMarketInformationNewsResult(null);
    setIsLoadingMarketInformation(false);
    setIsLoadingMarketInformationNews(false);
    setMarketInformationMarket(market);
  }, [marketInformationMarket]);

  const refreshExecutionAdapterHealthProbe = useCallback(async () => {
    setIsRefreshingAdapterHealthProbe(true);
    try {
      const latestCcxtProductionRouteReviewId = latestRecordedProductionRouteReviewIdForAdapter(
        executionAdapterProductionRouteReviews,
        "ccxt-live"
      );
      const result = await loadExecutionAdapterHealthProbe(quantCoreBaseUrl, {
        adapterId: "ccxt-live",
        exchange: "binance",
        productionRouteReviewId: latestCcxtProductionRouteReviewId
      });
      setExecutionAdapterHealthProbe(result);
      return result;
    } finally {
      setIsRefreshingAdapterHealthProbe(false);
    }
  }, [executionAdapterProductionRouteReviews]);

  const refreshSettingsStatus = useCallback(async () => {
    const settingsRequest = loadPlatformSettings(quantCoreBaseUrl).then((result) => {
      setSettingsStatus(result);
      setHasLoadedSettingsStatus(true);
      const freeStockdbConfigured = result.settings?.marketDataAdapters.some(
        (adapter) => adapter.id === "free-stockdb-ohlcv" && adapter.externalTelemetry.dependencyAvailable
      );
      if (freeStockdbConfigured) {
        void loadPlatformSettings(quantCoreBaseUrl, undefined, true).then((probedResult) => {
          if (probedResult.source === "core") setSettingsStatus(probedResult);
        });
      }
      return result;
    });
    const [settingsResult, adapterLedgerResult, adapterHealthProbeResult, watchlistRefreshHistory] = await Promise.all([
      settingsRequest,
      loadExecutionAdapterLedger(quantCoreBaseUrl),
      loadExecutionAdapterHealthProbe(quantCoreBaseUrl, { adapterId: "ccxt-live", exchange: "binance" }),
      loadWatchlistCacheRefreshRuns(quantCoreBaseUrl, { limit: 4 })
    ]);
    const liveAdapters = settingsResult.settings?.executionAdapters.filter((row) => row.route === "live") ?? [];
    const [
      certificationResults,
      applyResults,
      restartEvidenceResults,
      restartAcceptanceResults,
      secretReferenceResults,
      materializationResults,
      secretManifestValidationResults,
      environmentBindingResults,
      runtimeReloadPlanResults,
      runtimeReloadExecutionResults,
      runtimeReloadAcceptanceResults,
      orchestrationDryRunResults,
      orchestrationExecutionResults,
      humanConfirmationResults,
      sandboxProbePlanResults,
      sandboxProbeExecutionResults,
      sandboxProbeReviewResults,
      productionRouteReviewResults,
      sandboxOrderSchemaDryRunResults,
      paperOrderLifecycleResults,
      paperRouteRunbookResults,
      adapterOpsStateResults,
      adapterPaperExecutionResults
    ] = await Promise.all([
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterCertifications(quantCoreBaseUrl, row.id, undefined, 3))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterCertificationApplies(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterControlledRestartEvidence(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterRestartAcceptances(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretReferences(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretMaterializations(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretManifestValidations(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterEnvironmentBindings(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterRuntimeReloadPlans(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterRuntimeReloadExecutions(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterRuntimeReloadAcceptances(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterOrchestrationDryRuns(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterOrchestrationExecutions(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterHumanConfirmations(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxProbePlans(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxProbeExecutions(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxProbeReviews(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterProductionRouteReviews(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSandboxOrderSchemaDryRuns(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterPaperOrderLifecycles(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterPaperRouteRunbooks(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterOpsStates(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterPaperExecutions(quantCoreBaseUrl, row.id, undefined, 5)))
    ]);
    const productionRouteReviews = productionRouteReviewResults.flatMap((result) => result.adapterProductionRouteReviews);
    const latestCcxtProductionRouteReviewId = latestRecordedProductionRouteReviewIdForAdapter(
      productionRouteReviews,
      "ccxt-live"
    );
    const resolvedAdapterHealthProbeResult = latestCcxtProductionRouteReviewId
      ? await loadExecutionAdapterHealthProbe(quantCoreBaseUrl, {
          adapterId: "ccxt-live",
          exchange: "binance",
          productionRouteReviewId: latestCcxtProductionRouteReviewId
        })
      : adapterHealthProbeResult;
    setWatchlistCacheRefreshHistory(watchlistRefreshHistory.watchlistRefreshes);
    setExecutionAdapterLedger(adapterLedgerResult);
    setExecutionAdapterHealthProbe(resolvedAdapterHealthProbeResult);
    setExecutionAdapterCertifications(certificationResults.flatMap((result) => result.adapterCertifications));
    setExecutionAdapterCertificationApplies(applyResults.flatMap((result) => result.certificationApplies));
    setExecutionAdapterControlledRestartEvidence(restartEvidenceResults.flatMap((result) => result.controlledRestartEvidence));
    setExecutionAdapterRestartAcceptances(restartAcceptanceResults.flatMap((result) => result.restartAcceptances));
    setExecutionAdapterSecretReferences(secretReferenceResults.flatMap((result) => result.adapterSecretReferences));
    setExecutionAdapterSecretMaterializations(materializationResults.flatMap((result) => result.adapterSecretMaterializations));
    setExecutionAdapterSecretManifestValidations(
      secretManifestValidationResults.flatMap((result) => result.adapterSecretManifestValidations)
    );
    setExecutionAdapterEnvironmentBindings(environmentBindingResults.flatMap((result) => result.adapterEnvironmentBindings));
    setExecutionAdapterRuntimeReloadPlans(runtimeReloadPlanResults.flatMap((result) => result.adapterRuntimeReloadPlans));
    setExecutionAdapterRuntimeReloadExecutions(runtimeReloadExecutionResults.flatMap((result) => result.adapterRuntimeReloadExecutions));
    setExecutionAdapterRuntimeReloadAcceptances(runtimeReloadAcceptanceResults.flatMap((result) => result.adapterRuntimeReloadAcceptances));
    setExecutionAdapterOrchestrationDryRuns(orchestrationDryRunResults.flatMap((result) => result.adapterOrchestrationDryRuns));
    setExecutionAdapterOrchestrationExecutions(orchestrationExecutionResults.flatMap((result) => result.adapterOrchestrationExecutions));
    setExecutionAdapterHumanConfirmations(humanConfirmationResults.flatMap((result) => result.adapterHumanConfirmations));
    setExecutionAdapterSandboxProbePlans(sandboxProbePlanResults.flatMap((result) => result.adapterSandboxProbePlans));
    setExecutionAdapterSandboxProbeExecutions(
      sandboxProbeExecutionResults.flatMap((result) => result.adapterSandboxProbeExecutions)
    );
    setExecutionAdapterSandboxProbeReviews(
      sandboxProbeReviewResults.flatMap((result) => result.adapterSandboxProbeReviews)
    );
    setExecutionAdapterProductionRouteReviews(productionRouteReviews);
    setExecutionAdapterSandboxOrderSchemaDryRuns(sandboxOrderSchemaDryRunResults.flatMap((result) => result.adapterSandboxOrderSchemaDryRuns));
    setExecutionAdapterPaperOrderLifecycles(paperOrderLifecycleResults.flatMap((result) => result.adapterPaperOrderLifecycles));
    setExecutionAdapterPaperRouteRunbooks(paperRouteRunbookResults.flatMap((result) => result.adapterPaperRouteRunbooks));
    setExecutionAdapterOpsStates(adapterOpsStateResults.flatMap((result) => result.adapterOpsStates));
    setExecutionAdapterPaperExecutions(
      adapterPaperExecutionResults.flatMap((result) => result.adapterPaperExecutions)
    );
  }, []);

  const recordAdapterCertificationEvidence = useCallback(
    async (adapter: PlatformSettingsStatus["executionAdapters"][number]) => {
      const timestamp = new Date().toISOString();
      setRecordingAdapterCertificationId(adapter.id);
      try {
        const result = await recordExecutionAdapterCertification(quantCoreBaseUrl, {
          adapterId: adapter.id,
          market: adapter.market,
          route: adapter.route,
          operator: "settings-panel",
          startedAt: timestamp,
          completedAt: timestamp,
          checks: buildAdapterCertificationEvidenceChecks(adapter),
          metadata: {
            adapterStatus: adapter.status,
            liveTradingAllowed: adapter.liveTradingAllowed,
            source: "settings-panel"
          }
        });
        if (result.adapterCertification) {
          setExecutionAdapterCertifications((current) => [
            result.adapterCertification!,
            ...current.filter((row) => row.certificationId !== result.adapterCertification!.certificationId)
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter certification evidence failed"
          }));
        } else {
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel: `Adapter certification recorded · ${adapter.id}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterCertificationId(null);
      }
    },
    [refreshSettingsStatus]
  );

  const updateAdapterCertificationApplyConfirmation = useCallback(
    (certificationId: string, key: ExecutionAdapterCertificationApplyConfirmationKey, checked: boolean) => {
      setAdapterCertificationApplyConfirmations((current) => ({
        ...current,
        [certificationId]: {
          ...createDefaultExecutionAdapterCertificationApplyConfirmations(),
          ...(current[certificationId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const applyAdapterCertificationPreflight = useCallback(
    async (row: ExecutionAdapterCertificationRow) => {
      const confirmations = adapterCertificationApplyConfirmations[row.id] ?? createDefaultExecutionAdapterCertificationApplyConfirmations();
      setApplyingAdapterCertificationId(row.id);
      try {
        const result = await recordExecutionAdapterCertificationApply(quantCoreBaseUrl, {
          certificationId: row.id,
          operator: "settings-panel",
          confirmations: confirmations,
          metadata: {
            adapterId: row.adapterId,
            source: "settings-panel"
          }
        });
        if (result.certificationApply) {
          setExecutionAdapterCertificationApplies((current) => [
            result.certificationApply!,
            ...current.filter((currentRow) => currentRow.applyId !== result.certificationApply!.applyId)
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter apply preflight failed"
          }));
        } else {
          const status = result.certificationApply?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "ready_for_restart"
                ? `Adapter apply preflight ready · ${row.adapterId}`
                : `Adapter apply preflight blocked · ${row.adapterId}`
          }));
        }
      } finally {
        setApplyingAdapterCertificationId(null);
      }
    },
    [adapterCertificationApplyConfirmations]
  );

  const updateAdapterRuntimeReloadAcceptanceConfirmation = useCallback(
    (
      executionId: string,
      key: keyof ExecutionAdapterRuntimeReloadAcceptanceConfirmations,
      checked: boolean
    ) => {
      setAdapterRuntimeReloadAcceptanceConfirmations((current) => ({
        ...current,
        [executionId]: {
          ...createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations(),
          ...(current[executionId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterRuntimeReloadAcceptance = useCallback(
    async (row: ExecutionAdapterRuntimeReloadExecutionRow) => {
      const confirmations =
        adapterRuntimeReloadAcceptanceConfirmations[row.id] ??
        createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations();
      setRecordingAdapterRuntimeReloadAcceptanceId(row.id);
      try {
        const result = await recordExecutionAdapterRuntimeReloadAcceptance(quantCoreBaseUrl, {
          acceptanceMode: "manual_runtime_reload_acceptance",
          adapterId: row.adapterId,
          confirmations,
          executionId: row.id,
          metadata: {
            bindingId: row.bindingId,
            materializationId: row.materializationId,
            planId: row.planId,
            source: "settings-panel"
          },
          operator: "settings-panel"
        });
        if (result.adapterRuntimeReloadAcceptance) {
          setExecutionAdapterRuntimeReloadAcceptances((current) => [
            result.adapterRuntimeReloadAcceptance!,
            ...current.filter(
              (currentRow) =>
                currentRow.acceptanceId !== result.adapterRuntimeReloadAcceptance!.acceptanceId
            )
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Runtime reload acceptance recording failed"
          }));
        } else {
          const status = result.adapterRuntimeReloadAcceptance?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "acceptance_recorded"
                ? `Runtime reload acceptance recorded · ${row.adapterId}`
                : `Runtime reload acceptance blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterRuntimeReloadAcceptanceId(null);
      }
    },
    [adapterRuntimeReloadAcceptanceConfirmations, refreshSettingsStatus]
  );

  const updateAdapterOrchestrationDryRunConfirmation = useCallback(
    (
      acceptanceId: string,
      key: keyof ExecutionAdapterOrchestrationDryRunConfirmations,
      checked: boolean
    ) => {
      setAdapterOrchestrationDryRunConfirmations((current) => ({
        ...current,
        [acceptanceId]: {
          ...createDefaultExecutionAdapterOrchestrationDryRunConfirmations(),
          ...(current[acceptanceId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterOrchestrationDryRun = useCallback(
    async (row: ExecutionAdapterRuntimeReloadAcceptanceRow) => {
      const confirmations =
        adapterOrchestrationDryRunConfirmations[row.id] ??
        createDefaultExecutionAdapterOrchestrationDryRunConfirmations();
      setRecordingAdapterOrchestrationDryRunId(row.id);
      try {
        const result = await recordExecutionAdapterOrchestrationDryRun(quantCoreBaseUrl, {
          acceptanceId: row.id,
          adapterId: row.adapterId,
          confirmations,
          metadata: {
            bindingId: row.bindingId,
            executionId: row.executionId,
            materializationId: row.materializationId,
            planId: row.planId,
            source: "settings-panel"
          },
          operator: "settings-panel",
          orchestrationMode: "manual_adapter_orchestration_dry_run"
        });
        if (result.adapterOrchestrationDryRun) {
          setExecutionAdapterOrchestrationDryRuns((current) => [
            result.adapterOrchestrationDryRun!,
            ...current.filter(
              (currentRow) =>
                currentRow.dryRunId !== result.adapterOrchestrationDryRun!.dryRunId
            )
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter orchestration dry run failed"
          }));
        } else {
          const status = result.adapterOrchestrationDryRun?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "dry_run_recorded"
                ? `Adapter orchestration dry run recorded · ${row.adapterId}`
                : `Adapter orchestration dry run blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterOrchestrationDryRunId(null);
      }
    },
    [adapterOrchestrationDryRunConfirmations, refreshSettingsStatus]
  );

  const updateAdapterOrchestrationExecutionConfirmation = useCallback(
    (
      dryRunId: string,
      key: keyof ExecutionAdapterOrchestrationExecutionConfirmations,
      checked: boolean
    ) => {
      setAdapterOrchestrationExecutionConfirmations((current) => ({
        ...current,
        [dryRunId]: {
          ...createDefaultExecutionAdapterOrchestrationExecutionConfirmations(),
          ...(current[dryRunId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterOrchestrationExecution = useCallback(
    async (row: ExecutionAdapterOrchestrationDryRunRow) => {
      const confirmations =
        adapterOrchestrationExecutionConfirmations[row.id] ??
        createDefaultExecutionAdapterOrchestrationExecutionConfirmations();
      setRecordingAdapterOrchestrationExecutionId(row.id);
      try {
        const result = await recordExecutionAdapterOrchestrationExecution(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          confirmations,
          dryRunId: row.id,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            executionId: row.executionId,
            materializationId: row.materializationId,
            planId: row.planId,
            source: "settings-panel"
          },
          operator: "settings-panel",
          orchestrationExecutionMode: "manual_adapter_orchestration_execution"
        });
        if (result.adapterOrchestrationExecution) {
          setExecutionAdapterOrchestrationExecutions((current) => [
            result.adapterOrchestrationExecution!,
            ...current.filter(
              (currentRow) =>
                currentRow.orchestrationExecutionId !== result.adapterOrchestrationExecution!.orchestrationExecutionId
            )
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter orchestration execution failed"
          }));
        } else {
          const status = result.adapterOrchestrationExecution?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "execution_recorded"
                ? `Adapter orchestration execution recorded · ${row.adapterId}`
                : `Adapter orchestration execution blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterOrchestrationExecutionId(null);
      }
    },
    [adapterOrchestrationExecutionConfirmations, refreshSettingsStatus]
  );

  const updateAdapterHumanConfirmationConfirmation = useCallback(
    (
      orchestrationExecutionId: string,
      key: keyof ExecutionAdapterHumanConfirmationConfirmations,
      checked: boolean
    ) => {
      setAdapterHumanConfirmationConfirmations((current) => ({
        ...current,
        [orchestrationExecutionId]: {
          ...createDefaultExecutionAdapterHumanConfirmationConfirmations(),
          ...(current[orchestrationExecutionId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterHumanConfirmation = useCallback(
    async (row: ExecutionAdapterOrchestrationExecutionRow) => {
      const confirmations =
        adapterHumanConfirmationConfirmations[row.id] ??
        createDefaultExecutionAdapterHumanConfirmationConfirmations();
      setRecordingAdapterHumanConfirmationId(row.id);
      try {
        const result = await recordExecutionAdapterHumanConfirmation(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          confirmationMode: "manual_final_human_confirmation",
          confirmations,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            dryRunId: row.dryRunId,
            executionId: row.executionId,
            materializationId: row.materializationId,
            planId: row.planId,
            source: "settings-panel"
          },
          operator: "settings-panel",
          orchestrationExecutionId: row.id
        });
        if (result.adapterHumanConfirmation) {
          setExecutionAdapterHumanConfirmations((current) => [
            result.adapterHumanConfirmation!,
            ...current.filter(
              (currentRow) => currentRow.humanConfirmationId !== result.adapterHumanConfirmation!.humanConfirmationId
            )
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter human confirmation failed"
          }));
        } else {
          const status = result.adapterHumanConfirmation?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "confirmation_recorded"
                ? `Adapter human confirmation recorded · ${row.adapterId}`
                : `Adapter human confirmation blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterHumanConfirmationId(null);
      }
    },
    [adapterHumanConfirmationConfirmations, refreshSettingsStatus]
  );

  const updateAdapterSandboxProbePlanConfirmation = useCallback(
    (
      humanConfirmationId: string,
      key: keyof ExecutionAdapterSandboxProbePlanConfirmations,
      checked: boolean
    ) => {
      setAdapterSandboxProbePlanConfirmations((current) => ({
        ...current,
        [humanConfirmationId]: {
          ...createDefaultExecutionAdapterSandboxProbePlanConfirmations(),
          ...(current[humanConfirmationId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterSandboxProbePlan = useCallback(
    async (row: ExecutionAdapterHumanConfirmationRow) => {
      const confirmations =
        adapterSandboxProbePlanConfirmations[row.id] ??
        createDefaultExecutionAdapterSandboxProbePlanConfirmations();
      setRecordingAdapterSandboxProbePlanId(row.id);
      try {
        const result = await recordExecutionAdapterSandboxProbePlan(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          confirmations,
          humanConfirmationId: row.id,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            dryRunId: row.dryRunId,
            executionId: row.executionId,
            materializationId: row.materializationId,
            orchestrationExecutionId: row.orchestrationExecutionId,
            planId: row.planId,
            source: "settings-panel"
          },
          operator: "settings-panel",
          probeMode: "manual_sandbox_probe_plan"
        });
        if (result.adapterSandboxProbePlan) {
          setExecutionAdapterSandboxProbePlans((current) => [
            result.adapterSandboxProbePlan!,
            ...current.filter(
              (currentRow) =>
                currentRow.sandboxProbePlanId !== result.adapterSandboxProbePlan!.sandboxProbePlanId
            )
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter sandbox probe plan failed"
          }));
        } else {
          const status = result.adapterSandboxProbePlan?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "probe_plan_recorded"
                ? `Adapter sandbox probe plan recorded · ${row.adapterId}`
                : `Adapter sandbox probe plan blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterSandboxProbePlanId(null);
      }
    },
    [adapterSandboxProbePlanConfirmations, refreshSettingsStatus]
  );

  const updateAdapterSandboxProbeExecutionConfirmation = useCallback(
    (
      sandboxProbePlanId: string,
      key: keyof ExecutionAdapterSandboxProbeExecutionConfirmations,
      checked: boolean
    ) => {
      setAdapterSandboxProbeExecutionConfirmations((current) => ({
        ...current,
        [sandboxProbePlanId]: {
          ...createDefaultExecutionAdapterSandboxProbeExecutionConfirmations(),
          ...(current[sandboxProbePlanId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterSandboxProbeExecution = useCallback(
    async (row: ExecutionAdapterSandboxProbePlanRow) => {
      const confirmations =
        adapterSandboxProbeExecutionConfirmations[row.id] ??
        createDefaultExecutionAdapterSandboxProbeExecutionConfirmations();
      setRecordingAdapterSandboxProbeExecutionId(row.id);
      try {
        const result = await recordExecutionAdapterSandboxProbeExecution(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          confirmations,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            dryRunId: row.dryRunId,
            executionId: row.executionId,
            humanConfirmationId: row.humanConfirmationId,
            materializationId: row.materializationId,
            orchestrationExecutionId: row.orchestrationExecutionId,
            planId: row.planId,
            probeMode: row.probeMode,
            source: "settings-panel"
          },
          operator: "settings-panel",
          probeExecutionMode: "manual_readonly_sandbox_probe",
          sandboxProbePlanId: row.id
        });
        if (result.adapterSandboxProbeExecution) {
          setExecutionAdapterSandboxProbeExecutions((current) => [
            result.adapterSandboxProbeExecution!,
            ...current.filter(
              (currentRow) =>
                currentRow.sandboxProbeExecutionId !== result.adapterSandboxProbeExecution!.sandboxProbeExecutionId
            )
          ]);
        }
        if (result.adapterHealthProbe) {
          setExecutionAdapterHealthProbe({ adapterHealthProbe: result.adapterHealthProbe, source: "core" });
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter sandbox probe execution failed"
          }));
        } else {
          const status = result.adapterSandboxProbeExecution?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "probe_execution_recorded"
                ? `Adapter sandbox probe execution recorded · ${row.adapterId}`
                : `Adapter sandbox probe execution blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterSandboxProbeExecutionId(null);
      }
    },
    [adapterSandboxProbeExecutionConfirmations, refreshSettingsStatus]
  );

  const updateAdapterSandboxProbeReviewConfirmation = useCallback(
    (
      sandboxProbeExecutionId: string,
      key: keyof ExecutionAdapterSandboxProbeReviewConfirmations,
      checked: boolean
    ) => {
      setAdapterSandboxProbeReviewConfirmations((current) => ({
        ...current,
        [sandboxProbeExecutionId]: {
          ...createDefaultExecutionAdapterSandboxProbeReviewConfirmations(),
          ...(current[sandboxProbeExecutionId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterSandboxProbeReview = useCallback(
    async (row: ExecutionAdapterSandboxProbeExecutionRow) => {
      const confirmations =
        adapterSandboxProbeReviewConfirmations[row.id] ??
        createDefaultExecutionAdapterSandboxProbeReviewConfirmations();
      setRecordingAdapterSandboxProbeReviewId(row.id);
      try {
        const result = await recordExecutionAdapterSandboxProbeReview(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          confirmations,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            dryRunId: row.dryRunId,
            executionId: row.executionId,
            humanConfirmationId: row.humanConfirmationId,
            materializationId: row.materializationId,
            orchestrationExecutionId: row.orchestrationExecutionId,
            planId: row.planId,
            probeExecutionMode: row.probeExecutionMode,
            probeMode: row.probeMode,
            sandboxProbePlanId: row.sandboxProbePlanId,
            source: "settings-panel"
          },
          operator: "settings-panel",
          reviewMode: "manual_sandbox_probe_review",
          sandboxProbeExecutionId: row.id
        });
        if (result.adapterSandboxProbeReview) {
          setExecutionAdapterSandboxProbeReviews((current) => [
            result.adapterSandboxProbeReview!,
            ...current.filter(
              (currentRow) =>
                currentRow.sandboxProbeReviewId !== result.adapterSandboxProbeReview!.sandboxProbeReviewId
            )
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter sandbox probe review failed"
          }));
        } else {
          const status = result.adapterSandboxProbeReview?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "probe_review_recorded"
                ? `Adapter sandbox probe review recorded · ${row.adapterId}`
                : `Adapter sandbox probe review blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterSandboxProbeReviewId(null);
      }
    },
    [adapterSandboxProbeReviewConfirmations, refreshSettingsStatus]
  );

  const updateAdapterProductionRouteReviewConfirmation = useCallback(
    (
      sandboxProbeReviewId: string,
      key: keyof ExecutionAdapterProductionRouteReviewConfirmations,
      checked: boolean
    ) => {
      setAdapterProductionRouteReviewConfirmations((current) => ({
        ...current,
        [sandboxProbeReviewId]: {
          ...createDefaultExecutionAdapterProductionRouteReviewConfirmations(),
          ...(current[sandboxProbeReviewId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterProductionRouteReview = useCallback(
    async (row: ExecutionAdapterSandboxProbeReviewRow) => {
      const confirmations =
        adapterProductionRouteReviewConfirmations[row.id] ??
        createDefaultExecutionAdapterProductionRouteReviewConfirmations();
      setRecordingAdapterProductionRouteReviewId(row.id);
      try {
        const result = await recordExecutionAdapterProductionRouteReview(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          confirmations,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            dryRunId: row.dryRunId,
            executionId: row.executionId,
            humanConfirmationId: row.humanConfirmationId,
            materializationId: row.materializationId,
            orchestrationExecutionId: row.orchestrationExecutionId,
            planId: row.planId,
            probeExecutionMode: row.probeExecutionMode,
            probeMode: row.probeMode,
            sandboxProbeExecutionId: row.sandboxProbeExecutionId,
            sandboxProbePlanId: row.sandboxProbePlanId,
            sandboxReviewMode: row.reviewMode,
            source: "settings-panel"
          },
          operator: "settings-panel",
          reviewMode: "manual_production_route_review",
          sandboxProbeReviewId: row.id
        });
        if (result.adapterProductionRouteReview) {
          setExecutionAdapterProductionRouteReviews((current) => [
            result.adapterProductionRouteReview!,
            ...current.filter(
              (currentRow) =>
                currentRow.productionRouteReviewId !==
                result.adapterProductionRouteReview!.productionRouteReviewId
            )
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter production route review failed"
          }));
        } else {
          const status = result.adapterProductionRouteReview?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "route_review_recorded"
                ? `Adapter production route review recorded · ${row.adapterId}`
                : `Adapter production route review blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterProductionRouteReviewId(null);
      }
    },
    [adapterProductionRouteReviewConfirmations, refreshSettingsStatus]
  );

  const updateAdapterOpsStateConfirmation = useCallback(
    (paperRouteRunbookId: string, key: keyof ExecutionAdapterOpsStateConfirmations, checked: boolean) => {
      setAdapterOpsStateConfirmations((current) => ({
        ...current,
        [paperRouteRunbookId]: {
          ...createDefaultExecutionAdapterOpsStateConfirmations(),
          ...(current[paperRouteRunbookId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterOpsState = useCallback(
    async (row: ExecutionAdapterPaperRouteRunbookRow) => {
      const confirmations =
        adapterOpsStateConfirmations[row.id] ?? createDefaultExecutionAdapterOpsStateConfirmations();
      setRecordingAdapterOpsStateId(row.id);
      try {
        const result = await recordExecutionAdapterOpsState(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          confirmations,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            dryRunId: row.dryRunId,
            executionId: row.executionId,
            lifecycleMode: row.lifecycleMode,
            materializationId: row.materializationId,
            orchestrationExecutionId: row.orchestrationExecutionId,
            paperOrderLifecycleId: row.paperOrderLifecycleId,
            planId: row.planId,
            productionRouteReviewId: row.productionRouteReviewId,
            runbookMode: row.runbookMode,
            sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
            sandboxProbeExecutionId: row.sandboxProbeExecutionId,
            sandboxProbePlanId: row.sandboxProbePlanId,
            sandboxProbeReviewId: row.sandboxProbeReviewId,
            source: "settings-panel"
          },
          operator: "settings-panel",
          opsMode: "manual_adapter_ops_state",
          paperRouteRunbookId: row.id
        });
        if (result.adapterOpsState) {
          setExecutionAdapterOpsStates((current) => [
            result.adapterOpsState!,
            ...current.filter((currentRow) => currentRow.adapterOpsStateId !== result.adapterOpsState!.adapterOpsStateId)
          ]);
        }
        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter ops state failed"
          }));
        } else {
          const status = result.adapterOpsState?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              status === "ops_state_recorded"
                ? `Adapter ops state recorded · ${row.adapterId}`
                : `Adapter ops state blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterOpsStateId(null);
      }
    },
    [adapterOpsStateConfirmations, refreshSettingsStatus]
  );

  const updateAdapterPaperExecutionConfirmation = useCallback(
    (adapterOpsStateId: string, key: keyof ExecutionAdapterPaperExecutionConfirmations, checked: boolean) => {
      setAdapterPaperExecutionConfirmations((current) => ({
        ...current,
        [adapterOpsStateId]: {
          ...createDefaultExecutionAdapterPaperExecutionConfirmations(),
          ...(current[adapterOpsStateId] ?? {}),
          [key]: checked
        }
      }));
    },
    []
  );

  const recordAdapterPaperExecution = useCallback(
    async (row: ExecutionAdapterOpsStateRow) => {
      const confirmations =
        adapterPaperExecutionConfirmations[row.id] ?? createDefaultExecutionAdapterPaperExecutionConfirmations();
      setRecordingAdapterPaperExecutionId(row.id);
      try {
        const result = await recordExecutionAdapterPaperExecution(quantCoreBaseUrl, {
          adapterId: row.adapterId,
          adapterOpsStateId: row.id,
          confirmations,
          metadata: {
            acceptanceId: row.acceptanceId,
            bindingId: row.bindingId,
            dryRunId: row.dryRunId,
            executionId: row.executionId,
            lifecycleMode: row.lifecycleMode,
            materializationId: row.materializationId,
            orchestrationExecutionId: row.orchestrationExecutionId,
            paperOrderLifecycleId: row.paperOrderLifecycleId,
            paperRouteRunbookId: row.paperRouteRunbookId,
            planId: row.planId,
            productionRouteReviewId: row.productionRouteReviewId,
            runbookMode: row.runbookMode,
            sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
            sandboxProbeExecutionId: row.sandboxProbeExecutionId,
            sandboxProbePlanId: row.sandboxProbePlanId,
            sandboxProbeReviewId: row.sandboxProbeReviewId,
            source: "settings-panel"
          },
          operator: "settings-panel",
          paperExecutionMode: "manual_adapter_paper_execution"
        });
        const reusedAdapterPaperExecution =
          result.error === "execution_adapter_paper_execution_already_recorded" && Boolean(result.adapterPaperExecution);
        if (result.adapterPaperExecution) {
          setExecutionAdapterPaperExecutions((current) => [
            result.adapterPaperExecution!,
            ...current.filter(
              (currentRow) =>
                currentRow.adapterPaperExecutionId !== result.adapterPaperExecution!.adapterPaperExecutionId
            )
          ]);
        }
        if (result.error && !reusedAdapterPaperExecution) {
          setWorkspaceState((current) => ({
            ...current,
            error: result.error,
            statusLabel: "Adapter paper execution failed"
          }));
        } else {
          const status = result.adapterPaperExecution?.status ?? "blocked";
          setWorkspaceState((current) => ({
            ...current,
            error: undefined,
            statusLabel:
              reusedAdapterPaperExecution
                ? `Adapter paper execution reused · ${row.adapterId}`
                : status === "paper_execution_recorded"
                ? `Adapter paper execution recorded · ${row.adapterId}`
                : `Adapter paper execution blocked · ${row.adapterId}`
          }));
          await refreshSettingsStatus();
        }
      } finally {
        setRecordingAdapterPaperExecutionId(null);
      }
    },
    [adapterPaperExecutionConfirmations, refreshSettingsStatus]
  );

  const refreshAuditSigningKeys = useCallback(async () => {
    setAuditSigningKeyRegistry(await loadAuditSigningKeys(quantCoreBaseUrl));
  }, []);

  const updateAuditSigningKeyRotationApplyConfirmation = useCallback(
    (field: keyof AuditSigningKeyRotationApplyConfirmations, value: boolean) => {
      setAuditSigningKeyRotationApplyConfirmations((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateAuditSigningKeyRestartEvidenceConfirmation = useCallback(
    (field: keyof AuditSigningKeyRestartEvidenceConfirmations, value: boolean) => {
      setAuditSigningKeyRestartEvidenceConfirmations((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateAuditSigningKeySecretMaterializationConfirmation = useCallback(
    (field: keyof AuditSigningKeySecretMaterializationConfirmations, value: boolean) => {
      setAuditSigningKeySecretMaterializationConfirmations((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateAuditSigningKeyEnvironmentBindingConfirmation = useCallback(
    (field: keyof AuditSigningKeyEnvironmentBindingConfirmations, value: boolean) => {
      setAuditSigningKeyEnvironmentBindingConfirmations((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateAuditSigningKeyRuntimeReloadPlanConfirmation = useCallback(
    (field: keyof AuditSigningKeyRuntimeReloadPlanConfirmations, value: boolean) => {
      setAuditSigningKeyRuntimeReloadPlanConfirmations((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateAuditSigningKeyRuntimeReloadExecutionConfirmation = useCallback(
    (field: keyof AuditSigningKeyRuntimeReloadExecutionConfirmations, value: boolean) => {
      setAuditSigningKeyRuntimeReloadExecutionConfirmations((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const updateAuditSigningKeyRotationAcceptanceConfirmation = useCallback(
    (field: keyof AuditSigningKeyRotationAcceptanceConfirmations, value: boolean) => {
      setAuditSigningKeyRotationAcceptanceConfirmations((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const prepareAuditSigningKeyRotationPlanForAudit = useCallback(async () => {
    const activeKey = auditSigningKeyRegistry.registry?.keys.find(
      (key) => key.keyId === auditSigningKeyRegistry.registry?.activeKeyId
    );
    const suffix = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const proposedKeyId = `${activeKey?.keyId ?? "audit-key"}-${suffix}`;
    const proposedSigner = activeKey?.signer ? `${activeKey.signer} Next` : "Next Audit Key";
    const proposedChainId = `${activeKey?.chainId ?? "audit-chain"}-next`;
    setIsPreparingAuditSigningKeyRotationPlan(true);
    setAuditSigningKeyRotationApply(initialAuditSigningKeyRotationApplyState);
    setAuditSigningKeyRotationApplyConfirmations(initialAuditSigningKeyRotationApplyConfirmations);
    setAuditSigningKeyRestartEvidence(initialAuditSigningKeyRestartEvidenceState);
    setAuditSigningKeyRestartEvidenceConfirmations(initialAuditSigningKeyRestartEvidenceConfirmations);
    setAuditSigningKeySecretMaterialization(initialAuditSigningKeySecretMaterializationState);
    setAuditSigningKeySecretMaterializationConfirmations(initialAuditSigningKeySecretMaterializationConfirmations);
    setAuditSigningKeyEnvironmentBinding(initialAuditSigningKeyEnvironmentBindingState);
    setAuditSigningKeyEnvironmentBindingConfirmations(initialAuditSigningKeyEnvironmentBindingConfirmations);
    setAuditSigningKeyRuntimeReloadPlan(initialAuditSigningKeyRuntimeReloadPlanState);
    setAuditSigningKeyRuntimeReloadPlanConfirmations(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
    setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
    setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
    setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
    setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
    setAuditSigningKeyRotationPlanEventId(null);
    setAuditSigningKeyRotationApplyEventId(null);
    setAuditSigningKeyRotationLedgerStatus({ detail: "", state: "saving" });
    try {
      const result = await prepareAuditSigningKeyRotationPlan(quantCoreBaseUrl, {
        proposedChainId,
        proposedKeyId,
        proposedSigner
      });
      setAuditSigningKeyRotationPlan(result);
      if (result.rotationPlan) {
        const auditEvent = await buildAuditSigningKeyRotationPlanAuditEvent(result.rotationPlan);
        const ledgerResult = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        setAuditSigningKeyRotationLedgerStatus(
          ledgerResult.event
            ? { detail: ledgerResult.event.eventId, state: "saved" }
            : { detail: ledgerResult.error ?? "Audit event save failed", state: "failed" }
        );
        if (ledgerResult.event) {
          setAuditSigningKeyRotationPlanEventId(ledgerResult.event.eventId);
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, ledgerResult.event!));
        }
      } else {
        setAuditSigningKeyRotationLedgerStatus({
          detail: result.error ?? "Rotation plan was not generated",
          state: "failed"
        });
      }
    } finally {
      setIsPreparingAuditSigningKeyRotationPlan(false);
    }
  }, [auditSigningKeyRegistry.registry]);

  const recordAuditSigningKeySecretMaterializationForAudit = useCallback(async () => {
    if (!auditSigningKeyRotationPlan.rotationPlan || !auditSigningKeyRotationPlanEventId) {
      setAuditSigningKeySecretMaterialization({
        source: "fallback",
        error: "Audit signing key rotation plan event id is required before secret materialization can be recorded"
      });
      return;
    }
    const proposedKeyId = auditSigningKeyRotationPlan.rotationPlan.proposedActiveKey.keyId;
    setIsRecordingAuditSigningKeySecretMaterialization(true);
    setAuditSigningKeyEnvironmentBinding(initialAuditSigningKeyEnvironmentBindingState);
    setAuditSigningKeyEnvironmentBindingConfirmations(initialAuditSigningKeyEnvironmentBindingConfirmations);
    setAuditSigningKeyRuntimeReloadPlan(initialAuditSigningKeyRuntimeReloadPlanState);
    setAuditSigningKeyRuntimeReloadPlanConfirmations(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
    setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
    setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
    setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
    setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
    try {
      const result = await recordAuditSigningKeySecretMaterialization(quantCoreBaseUrl, {
        backend: "local-secret-store",
        confirmations: auditSigningKeySecretMaterializationConfirmations,
        manifestPath: `local-secret-store://audit-signing/${proposedKeyId}`,
        metadata: {
          proposedKeyId,
          source: "audit-signing-key-registry-panel"
        },
        operator: "local-operator",
        planEventId: auditSigningKeyRotationPlanEventId
      });
      setAuditSigningKeySecretMaterialization(result);
      if (result.auditEvent) {
        setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
      }
    } finally {
      setIsRecordingAuditSigningKeySecretMaterialization(false);
    }
  }, [
    auditSigningKeyRotationPlan.rotationPlan,
    auditSigningKeyRotationPlanEventId,
    auditSigningKeySecretMaterializationConfirmations,
    quantCoreBaseUrl
  ]);

  const saveSettingsConfiguration = useCallback(async (request: PlatformSettingsUpdateRequest) => {
    const requestId = ++settingsSaveRequestIdRef.current;
    setIsSavingSettingsConfiguration(true);
    setSettingsConfigurationMessage(null);
    try {
      const result = await savePlatformSettings(quantCoreBaseUrl, request);
      if (result.source !== "core" || !result.settings) {
        setSettingsConfigurationMessage(`保存失败：${result.error ?? "核心服务未返回配置"}`);
        return false;
      }
      setSettingsStatus(result);
      setHasUnsavedSettingsConfiguration(false);
      setSettingsConfigurationMessage("配置已加密保存并实时生效。");
      const navigationAction = pendingSettingsNavigationActionRef.current;
      pendingSettingsNavigationActionRef.current = null;
      setPendingSettingsWorkAreaId(null);
      navigationAction?.();
      if (result.settings.marketDataAdapters.some(
        (adapter) => adapter.id === "free-stockdb-ohlcv" && adapter.externalTelemetry.dependencyAvailable
      )) {
        void loadPlatformSettings(quantCoreBaseUrl, undefined, true).then((probedResult) => {
          if (settingsSaveRequestIdRef.current === requestId && probedResult.source === "core") {
            setSettingsStatus(probedResult);
          }
        }).catch(() => undefined);
      }
      void loadAiReviewProviders(quantCoreBaseUrl).then((providers) => {
        if (settingsSaveRequestIdRef.current === requestId && providers.source === "core") {
          setAiReviewStage3Providers(providers.providers);
        }
      }).catch(() => undefined);
      return true;
    } catch (saveError) {
      setSettingsConfigurationMessage(
        `保存失败：${saveError instanceof Error ? saveError.message : "无法保存当前配置"}`
      );
      return false;
    } finally {
      setIsSavingSettingsConfiguration(false);
    }
  }, []);

  const installSettingsDataDependency = useCallback(async (dependency: InstallablePlatformDataDependency) => {
    setInstallingDataDependency(dependency);
    setSettingsConfigurationMessage(`正在安装 ${dependency}…`);
    try {
      const result = await installPlatformDataDependency(quantCoreBaseUrl, dependency);
      if (result.source !== "core" || !result.settings) {
        setSettingsConfigurationMessage(`安装失败：${result.error ?? "核心服务未返回状态"}`);
        return;
      }
      setSettingsStatus(result);
      setSettingsConfigurationMessage(
        `${dependency} 已安装并可在当前 API 环境导入，无需重启；数据源健康仍以首次读取证据为准。`
      );
    } finally {
      setInstallingDataDependency(null);
    }
  }, [quantCoreBaseUrl]);

  const loadSettingsOpenAiCompatibleModels = useCallback(
    (baseUrl: string) => loadOpenAiCompatibleModels(quantCoreBaseUrl, baseUrl),
    [],
  );

  const testSettingsMonitoringWebhook = useCallback(async () => {
    setIsTestingMonitoringWebhook(true);
    setSettingsConfigurationMessage(null);
    try {
      const result = await testMonitoringWebhook(quantCoreBaseUrl);
      setSettingsConfigurationMessage(
        result.source === "core"
          ? "Webhook 测试投递成功；未触发任何交易动作。"
          : `Webhook 测试失败：${result.error ?? "核心服务未返回投递结果"}`
      );
    } finally {
      setIsTestingMonitoringWebhook(false);
    }
  }, [quantCoreBaseUrl]);

  const recordAuditSigningKeyEnvironmentBindingForAudit = useCallback(async () => {
    const materialization = auditSigningKeySecretMaterialization.secretMaterialization;
    if (!materialization?.materializationId) {
      setAuditSigningKeyEnvironmentBinding({
        source: "fallback",
        error: "Audit signing key secret materialization is required before environment binding can be recorded"
      });
      return;
    }
    setIsRecordingAuditSigningKeyEnvironmentBinding(true);
    setAuditSigningKeyRuntimeReloadPlan(initialAuditSigningKeyRuntimeReloadPlanState);
    setAuditSigningKeyRuntimeReloadPlanConfirmations(initialAuditSigningKeyRuntimeReloadPlanConfirmations);
    setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
    setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
    setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
    setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
    try {
      const result = await recordAuditSigningKeyEnvironmentBinding(quantCoreBaseUrl, {
        bindingMode: "container_env_reference",
        confirmations: auditSigningKeyEnvironmentBindingConfirmations,
        materializationId: materialization.materializationId,
        metadata: {
          proposedKeyId: materialization.proposedActiveKeyId,
          source: "audit-signing-key-registry-panel"
        },
        operator: "local-operator"
      });
      setAuditSigningKeyEnvironmentBinding(result);
      if (result.auditEvent) {
        setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
      }
    } finally {
      setIsRecordingAuditSigningKeyEnvironmentBinding(false);
    }
  }, [
    auditSigningKeyEnvironmentBindingConfirmations,
    auditSigningKeySecretMaterialization.secretMaterialization,
    quantCoreBaseUrl
  ]);

  const recordAuditSigningKeyRuntimeReloadPlanForAudit = useCallback(async () => {
    const binding = auditSigningKeyEnvironmentBinding.environmentBinding;
    if (!binding?.bindingId) {
      setAuditSigningKeyRuntimeReloadPlan({
        source: "fallback",
        error: "Audit signing key environment binding is required before runtime reload plan can be recorded"
      });
      return;
    }
    setIsRecordingAuditSigningKeyRuntimeReloadPlan(true);
    setAuditSigningKeyRuntimeReloadExecution(initialAuditSigningKeyRuntimeReloadExecutionState);
    setAuditSigningKeyRuntimeReloadExecutionConfirmations(initialAuditSigningKeyRuntimeReloadExecutionConfirmations);
    setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
    setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
    try {
      const result = await recordAuditSigningKeyRuntimeReloadPlan(quantCoreBaseUrl, {
        bindingId: binding.bindingId,
        confirmations: auditSigningKeyRuntimeReloadPlanConfirmations,
        maintenanceWindowId: `audit-window-${binding.proposedActiveKeyId || "next-key"}`,
        metadata: {
          proposedKeyId: binding.proposedActiveKeyId,
          source: "audit-signing-key-registry-panel"
        },
        operator: "local-operator",
        reloadMode: "manual_container_reload_plan"
      });
      setAuditSigningKeyRuntimeReloadPlan(result);
      if (result.auditEvent) {
        setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
      }
    } finally {
      setIsRecordingAuditSigningKeyRuntimeReloadPlan(false);
    }
  }, [
    auditSigningKeyEnvironmentBinding.environmentBinding,
    auditSigningKeyRuntimeReloadPlanConfirmations,
    quantCoreBaseUrl
  ]);

  const recordAuditSigningKeyRuntimeReloadExecutionForAudit = useCallback(async () => {
    const runtimeReloadPlan = auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan;
    if (!runtimeReloadPlan?.planId) {
      setAuditSigningKeyRuntimeReloadExecution({
        source: "fallback",
        error: "Audit signing key runtime reload plan is required before reload execution evidence can be recorded"
      });
      return;
    }
    setIsRecordingAuditSigningKeyRuntimeReloadExecution(true);
    setAuditSigningKeyRotationAcceptance(initialAuditSigningKeyRotationAcceptanceState);
    setAuditSigningKeyRotationAcceptanceConfirmations(initialAuditSigningKeyRotationAcceptanceConfirmations);
    try {
      const result = await recordAuditSigningKeyRuntimeReloadExecution(quantCoreBaseUrl, {
        confirmations: auditSigningKeyRuntimeReloadExecutionConfirmations,
        executionMode: "manual_controlled_reload_evidence",
        metadata: {
          proposedKeyId: runtimeReloadPlan.proposedActiveKeyId,
          source: "audit-signing-key-registry-panel"
        },
        operator: "local-operator",
        planId: runtimeReloadPlan.planId
      });
      setAuditSigningKeyRuntimeReloadExecution(result);
      if (result.auditEvent) {
        setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
      }
    } finally {
      setIsRecordingAuditSigningKeyRuntimeReloadExecution(false);
    }
  }, [
    auditSigningKeyRuntimeReloadExecutionConfirmations,
    auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan,
    quantCoreBaseUrl
  ]);

  const recordAuditSigningKeyRotationAcceptanceForAudit = useCallback(async () => {
    const runtimeReloadExecution = auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution;
    if (!runtimeReloadExecution?.executionId) {
      setAuditSigningKeyRotationAcceptance({
        source: "fallback",
        error: "Audit signing key runtime reload execution evidence is required before final acceptance can be recorded"
      });
      return;
    }
    setIsRecordingAuditSigningKeyRotationAcceptance(true);
    try {
      const result = await recordAuditSigningKeyRotationAcceptance(quantCoreBaseUrl, {
        acceptanceMode: "manual_rotation_acceptance",
        confirmations: auditSigningKeyRotationAcceptanceConfirmations,
        executionId: runtimeReloadExecution.executionId,
        metadata: {
          proposedKeyId: runtimeReloadExecution.proposedActiveKeyId,
          source: "audit-signing-key-registry-panel"
        },
        operator: "local-operator"
      });
      setAuditSigningKeyRotationAcceptance(result);
      if (result.auditEvent) {
        setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
      }
    } finally {
      setIsRecordingAuditSigningKeyRotationAcceptance(false);
    }
  }, [
    auditSigningKeyRotationAcceptanceConfirmations,
    auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution,
    quantCoreBaseUrl
  ]);

  const applyAuditSigningKeyRotationPlanForAudit = useCallback(async () => {
    if (!auditSigningKeyRotationPlan.rotationPlan) {
      return;
    }
    setIsApplyingAuditSigningKeyRotationPlan(true);
    setAuditSigningKeyRestartEvidence(initialAuditSigningKeyRestartEvidenceState);
    setAuditSigningKeyRestartEvidenceConfirmations(initialAuditSigningKeyRestartEvidenceConfirmations);
    setAuditSigningKeyRotationApplyEventId(null);
    try {
      const result = await applyAuditSigningKeyRotationPlan(quantCoreBaseUrl, {
        confirmations: auditSigningKeyRotationApplyConfirmations,
        rotationPlan: auditSigningKeyRotationPlan.rotationPlan
      });
      setAuditSigningKeyRotationApply(result);
      if (result.rotationApply) {
        const auditEvent = await buildAuditSigningKeyRotationApplyAuditEvent(result.rotationApply);
        const ledgerResult = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (ledgerResult.error) {
          setWorkspaceState((current) => ({
            ...current,
            error: ledgerResult.error,
            source: ledgerResult.source,
            statusLabel: "Audit signing key rotation apply ledger save failed"
          }));
        } else if (ledgerResult.event) {
          setAuditSigningKeyRotationApplyEventId(ledgerResult.event.eventId);
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, ledgerResult.event!));
        }
      }
    } finally {
      setIsApplyingAuditSigningKeyRotationPlan(false);
    }
  }, [auditSigningKeyRotationApplyConfirmations, auditSigningKeyRotationPlan.rotationPlan, quantCoreBaseUrl]);

  const recordAuditSigningKeyRestartEvidenceForAudit = useCallback(async () => {
    if (!auditSigningKeyRotationApplyEventId) {
      setAuditSigningKeyRestartEvidence({
        source: "fallback",
        error: "Audit signing key rotation apply event id is required before restart evidence can be recorded"
      });
      return;
    }
    setIsRecordingAuditSigningKeyRestartEvidence(true);
    try {
      const result = await recordAuditSigningKeyControlledRestartEvidence(quantCoreBaseUrl, {
        applyEventId: auditSigningKeyRotationApplyEventId,
        confirmations: auditSigningKeyRestartEvidenceConfirmations,
        metadata: { source: "audit-signing-key-registry-panel" },
        operator: "local-operator"
      });
      setAuditSigningKeyRestartEvidence(result);
      if (result.auditEvent) {
        setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, result.auditEvent!));
      }
    } finally {
      setIsRecordingAuditSigningKeyRestartEvidence(false);
    }
  }, [auditSigningKeyRestartEvidenceConfirmations, auditSigningKeyRotationApplyEventId, quantCoreBaseUrl]);

  const refreshGoldenPathStatus = useCallback(async () => {
    const result = await loadGoldenPathStatus(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    });
    setGoldenPathState(result);
    return result;
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

  const refreshWorkspace = useCallback(async () => {
    const startedSelectionVersion = manualSelectionVersionRef.current;
    const requestedStrategyExperimentId = initialStrategyExperimentIdRef.current;
    const requestedAiReviewRunId = initialAiReviewRunIdRef.current;
    aiReviewRunRestoreAbortControllerRef.current?.abort();
    const restoreController = requestedAiReviewRunId ? new AbortController() : null;
    aiReviewRunRestoreAbortControllerRef.current = restoreController;
    const aiReviewRestoreIsCurrent = () => Boolean(
      restoreController
      && !restoreController.signal.aborted
      && aiReviewRunRestoreAbortControllerRef.current === restoreController
      && manualSelectionVersionRef.current === startedSelectionVersion
    );
    setIsRefreshing(true);
    resetStage4PortfolioBusyState();
    portfolioStage4RequestCoordinatorRef.current.invalidate(currentResearchRunIdRef.current);
    setPortfolioStage4RefreshGeneration((current) => current + 1);
    const result = await loadTerminalWorkspace(quantCoreBaseUrl);
    const researchContextUrlState = resolveInitialResearchContextUrlState();
    let restoredWorkspace = workspaceWithResearchContextUrlState(
      workspaceWithAppliedResearchWorkspaceState(result.workspace),
      researchContextUrlState
    );
    let restoredAiReviewRun: ResearchRunAudit | null = null;
    let restoredAiReviewKlines: MarketKlinesResult | null = null;
    let aiReviewRunRestoreError: string | null = null;
    if (requestedAiReviewRunId && restoreController) {
      const runResult = await loadResearchRunDetail(
        quantCoreBaseUrl,
        requestedAiReviewRunId,
        restoreController.signal
      );
      if (aiReviewRestoreIsCurrent()) {
        initialAiReviewRunIdRef.current = null;
        if (runResult.source === "core" && runResult.run?.runId === requestedAiReviewRunId) {
          restoredAiReviewRun = runResult.run;
          restoredWorkspace = workspaceFromResearchRunAudit(restoredWorkspace, runResult.run);
          restoredAiReviewKlines = marketKlinesFromResearchRunAudit(runResult.run);
        } else {
          aiReviewRunRestoreError = strategyExperimentI18nRef.current.t("aiReviewStage3.error.runRestoreFailed");
          window.history.replaceState(
            {},
            "",
            replaceAiReviewRunIdInUrl(window.location.href, "ai-review", null)
          );
        }
      } else {
        initialAiReviewRunIdRef.current = null;
      }
      if (aiReviewRunRestoreAbortControllerRef.current === restoreController) {
        aiReviewRunRestoreAbortControllerRef.current = null;
      }
    }
    let restoredStrategyExperiment: StrategyExperimentDetail | null = null;
    let restoredStrategyExperimentKlines: MarketKlinesResult | null = null;
    if (requestedStrategyExperimentId && (!requestedAiReviewRunId || restoredAiReviewRun)) {
      const experimentResult = await loadStrategyExperimentDetail(quantCoreBaseUrl, requestedStrategyExperimentId);
      const experiment = experimentResult.experiment;
      if (experiment && (!requestedAiReviewRunId || experiment.sourceRunId === requestedAiReviewRunId)) {
        const runResult = restoredAiReviewRun?.runId === experiment.sourceRunId
          ? { run: restoredAiReviewRun, source: "core" as const }
          : await loadResearchRunDetail(quantCoreBaseUrl, experiment.sourceRunId);
        if (runResult.run) {
          const experimentWorkspace = workspaceFromResearchRunAudit(restoredWorkspace, runResult.run);
          if (buildStrategyExperimentEvidenceSummary(experimentWorkspace, experiment)) {
            restoredWorkspace = experimentWorkspace;
            restoredStrategyExperiment = experiment;
            restoredStrategyExperimentKlines = marketKlinesFromResearchRunAudit(runResult.run);
          }
        }
      }
      initialStrategyExperimentIdRef.current = null;
      if (!restoredStrategyExperiment) {
        replaceStrategyExperimentUrlParam(null);
      }
    } else if (requestedStrategyExperimentId) {
      initialStrategyExperimentIdRef.current = null;
      replaceStrategyExperimentUrlParam(null);
    }
    const restoredResult = {
      ...result,
      workspace: restoredWorkspace,
      ...(aiReviewRunRestoreError
        ? { statusLabel: aiReviewRunRestoreError, error: aiReviewRunRestoreError }
        : restoredAiReviewRun
          ? {
              statusLabel: strategyExperimentI18nRef.current.t("aiReviewStage3.runRestored"),
              error: undefined
            }
          : {})
    };
    const urlContextCreatesUnsavedWatchlist =
      Boolean(researchContextUrlState) && !watchlistIncludesInstrument(result.workspace.watchlist, researchContextUrlState!);
    const shouldConsiderSavedWorkArea =
      !savedResearchWorkspaceSelectionAppliedRef.current && !hasExplicitResearchContextUrl();
    const shouldApplySavedWorkArea =
      shouldConsiderSavedWorkArea && manualSelectionVersionRef.current === startedSelectionVersion;
    setWorkspaceState((current) => {
      if (manualSelectionVersionRef.current === startedSelectionVersion) {
        return restoredResult;
      }
      return {
        ...restoredResult,
        workspace: workspaceWithPreservedInteractiveState(restoredResult.workspace, current.workspace),
        statusLabel: current.statusLabel
      };
    });
    if (
      restoredStrategyExperiment &&
      manualSelectionVersionRef.current === startedSelectionVersion
    ) {
      setStrategyExperimentActive(restoredStrategyExperiment);
      if (restoredStrategyExperimentKlines) {
        setKlinesState(restoredStrategyExperimentKlines);
      }
    } else if (restoredAiReviewKlines && manualSelectionVersionRef.current === startedSelectionVersion) {
      setKlinesState(restoredAiReviewKlines);
    }
    if (shouldConsiderSavedWorkArea) {
      savedResearchWorkspaceSelectionAppliedRef.current = true;
      if (shouldApplySavedWorkArea) {
        const selection = resolveSavedResearchWorkspaceSelection(restoredResult.workspace, "research");
        setActiveWorkAreaId(selection.areaId);
        setActiveLoopStepId(selection.quantLoopStepId);
        setActiveWorkflowStageId(selection.workflowStageId);
      }
    }
    if (urlContextCreatesUnsavedWatchlist && manualSelectionVersionRef.current === startedSelectionVersion) {
      setHasUnsavedWatchlistChanges(true);
    }
    await refreshRunHistory();
    await refreshSettingsStatus();
    await refreshAuditSigningKeys();
    setIsRefreshing(false);
  }, [
    refreshAuditSigningKeys,
    refreshRunHistory,
    refreshSettingsStatus,
    resetStage4PortfolioBusyState
  ]);

  useEffect(() => {
    if (activeWorkAreaId !== "audit") {
      return;
    }
    void refreshAuditSigningKeys();
  }, [activeWorkAreaId, refreshAuditSigningKeys]);

  const refreshChart = useCallback(async (silent = false) => {
    const requestId = chartRequestIdRef.current + 1;
    chartRequestIdRef.current = requestId;
    const params = {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    };
    if (!silent) {
      setIsChartLoading(true);
      setKlinesState(buildLoadingMarketKlinesResult(params));
      setMarketDataReadinessState({ source: "fallback", error: "Market data readiness loading" });
    }
    const [result, readiness] = await Promise.all([
      loadMarketKlines(quantCoreBaseUrl, { ...params, limit: chartKlineLimit }),
      loadMarketDataReadiness(quantCoreBaseUrl, params)
    ]);
    if (chartRequestIdRef.current === requestId) {
      if (!silent || result.source === "core") {
        setKlinesState(result);
      }
      if (!silent || readiness.source === "core") {
        setMarketDataReadinessState(readiness);
      }
      setIsChartLoading(false);
    }
  }, [
    chartKlineLimit,
    quantCoreBaseUrl,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const refreshVisiblePageData = useCallback(async () => {
    const workspaceRequestId = workspaceQuoteRequestIdRef.current + 1;
    workspaceQuoteRequestIdRef.current = workspaceRequestId;
    const refreshTasks: Array<Promise<void>> = [refreshMarketCalendarStatus(true)];
    refreshTasks.push(
      loadTerminalWorkspace(quantCoreBaseUrl).then((result) => {
        if (result.source !== "core" || workspaceQuoteRequestIdRef.current !== workspaceRequestId) {
          return;
        }
        setWorkspaceState((current) => {
          const refreshedWatchlist = current.workspace.watchlist.map(
            (instrument) =>
              result.workspace.watchlist.find(
                (candidate) =>
                  candidate.market === instrument.market && candidate.symbol === instrument.symbol
              ) ?? instrument
          );
          return {
            ...current,
            workspace: workspaceWithSavedWatchlist(current.workspace, refreshedWatchlist)
          };
        });
      })
    );
    if (
      !isChartLoading &&
      (activeWorkAreaId === "market" ||
        activeWorkAreaId === "research")
    ) {
      refreshTasks.push(refreshChart(true));
    }
    await Promise.all(refreshTasks);
  }, [activeWorkAreaId, isChartLoading, refreshChart, refreshMarketCalendarStatus]);

  useEffect(() => {
    let refreshInFlight = false;
    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible" || refreshInFlight) {
        return;
      }
      refreshInFlight = true;
      void refreshVisiblePageData().finally(() => {
        refreshInFlight = false;
      });
    };
    const intervalId = window.setInterval(refreshWhenVisible, VISIBLE_PAGE_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
    };
  }, [refreshVisiblePageData]);

  const enableMarketDataRefreshOverride = useCallback(
    async (reason: string) => {
      const normalizedReason = reason.trim();
      if (!normalizedReason) {
        return;
      }
      const override = {
        enabled: true,
        market: workspace.selectedInstrument.market,
        reason: normalizedReason
      };
      const auditGuard = buildMarketDataRefreshGuard(
        workspace.selectedInstrument.market,
        settingsStatus.settings?.marketDataAdapters,
        override
      );
      const auditEvent = buildMarketDataRefreshOverrideAuditEvent({
        guard: auditGuard,
        market: workspace.selectedInstrument.market,
        name: workspace.selectedInstrument.name,
        reason: normalizedReason,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      });
      setMarketDataRefreshOverrideAuditStatus({ state: "saving" });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (!result.event) {
        setMarketDataRefreshOverrideAuditStatus({
          state: "failed",
          error: result.error ?? "market_data_refresh_override_audit_save_failed"
        });
        return;
      }
      setMarketDataRefreshOverride({
        ...override,
        auditEventId: result.event.eventId
      });
      setMarketDataRefreshOverrideAuditEvents((current) =>
        mergeAuditEvidenceReportEvent(current, result.event!).slice(0, MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE)
      );
      setMarketDataRefreshOverrideAuditStatus({ state: "saved", eventId: result.event.eventId });
    },
    [
      quantCoreBaseUrl,
      settingsStatus.settings?.marketDataAdapters,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.name,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]
  );

  const clearMarketDataRefreshOverride = useCallback(() => {
    setMarketDataRefreshOverride(null);
    setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
  }, []);

  useEffect(() => {
    setMarketDataRefreshOverride((current) =>
      current?.market === workspace.selectedInstrument.market ? current : null
    );
    setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
  }, [workspace.selectedInstrument.market]);

  const refreshCacheContext = useCallback(
    async (context: PlatformSettingsStatus["cache"]["contexts"][number]) => {
      const refreshGuard = buildMarketDataRefreshGuard(
        context.market,
        settingsStatus.settings?.marketDataAdapters,
        marketDataRefreshOverride?.market === context.market ? marketDataRefreshOverride : null
      );
      if (refreshGuard.blocked) {
        const blockedReason = marketDataRefreshGuardLabel(i18n, refreshGuard);
        automatedTradingWorkflowActionErrorRef.current = blockedReason;
        setSettingsStatus((current) => ({
          settings: current.settings,
          source: current.source,
          error: blockedReason
        }));
        return false;
      }
      const key = cacheContextKey(context);
      setRefreshingCacheKey(key);
      try {
        const overrideAuditEventId = refreshGuard.overrideApplied ? marketDataRefreshOverride?.auditEventId : null;
        const result = await refreshMarketCache(quantCoreBaseUrl, {
          market: context.market,
          symbol: context.symbol,
          timeframe: context.timeframe,
          limit: chartKlineLimit,
          overrideAuditEventId
        });
        const refreshedItem = result.watchlistRefresh?.items.find(
          (item) =>
            item.market === context.market &&
            item.symbol === context.symbol &&
            item.timeframe === context.timeframe
        );
        const contextRefreshed = refreshedItem?.status === "refreshed";
        const refreshError =
          result.error ??
          (contextRefreshed ? undefined : refreshedItem?.error ?? "选中标的行情刷新未完成，请检查数据源状态。");
        automatedTradingWorkflowActionErrorRef.current = refreshError ?? null;
        setSettingsStatus({
          settings: result.settings,
          source: result.source,
          error: refreshError
        });
        if (result.watchlistRefresh) {
          setWatchlistCacheRefreshHistory((current) =>
            [
              result.watchlistRefresh!,
              ...current.filter((run) => run.runId !== result.watchlistRefresh!.runId)
            ].slice(0, 4)
          );
          setWatchlistCacheRefreshRunSelection(result.watchlistRefresh.runId);
        }
        if (
          result.source === "core" &&
          context.market === workspace.selectedInstrument.market &&
          context.symbol === workspace.selectedInstrument.symbol &&
          context.timeframe === workspace.selectedTimeframe
        ) {
          await refreshChart();
        }
        await refreshGoldenPathStatus();
        return contextRefreshed;
      } finally {
        if (refreshGuard.overrideApplied) {
          setMarketDataRefreshOverride(null);
          setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
        }
        setRefreshingCacheKey(null);
      }
    },
    [
      i18n,
      marketDataRefreshOverride,
      refreshChart,
      refreshGoldenPathStatus,
      setWatchlistCacheRefreshRunSelection,
      settingsStatus.settings?.marketDataAdapters,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]
  );

  const refreshSelectedMarketCache = useCallback(async () => {
    return refreshCacheContext({
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      rowCount: activeCacheContext?.rowCount ?? 0,
      startTimestamp: activeCacheContext?.startTimestamp ?? null,
      endTimestamp: activeCacheContext?.endTimestamp ?? null,
      freshness: activeCacheContext?.freshness ?? "empty",
      ageHours: activeCacheContext?.ageHours ?? null
    });
  }, [
    activeCacheContext,
    refreshCacheContext,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const refreshWatchlistMarketCache = useCallback(async () => {
    if (!workspace.watchlist.length) {
      const message = "自选列表为空，无法刷新行情。";
      automatedTradingWorkflowActionErrorRef.current = message;
      setMarketRefreshIssue(message);
      return false;
    }
    const refreshGuard = buildMarketDataRefreshGuard(
      workspace.selectedInstrument.market,
      settingsStatus.settings?.marketDataAdapters,
      activeMarketDataRefreshOverride
    );
    if (refreshGuard.blocked) {
      const blockedReason = marketDataRefreshGuardLabel(i18n, refreshGuard);
      automatedTradingWorkflowActionErrorRef.current = blockedReason;
      setMarketRefreshIssue(blockedReason);
      setSettingsStatus((current) => ({
        settings: current.settings,
        source: current.source,
        error: blockedReason
      }));
      return false;
    }
    setMarketRefreshIssue(null);
    setIsRefreshingWatchlistCache(true);
    try {
      const overrideAuditEventId = refreshGuard.overrideApplied ? activeMarketDataRefreshOverride?.auditEventId : null;
      const result = await refreshWatchlistCacheRun(quantCoreBaseUrl, {
        timeframe: workspace.selectedTimeframe,
        limit: chartKlineLimit,
        overrideAuditEventId,
        watchlist: workspace.watchlist
      });
      setSettingsStatus((current) => ({
        settings: result.settings ?? current.settings,
        source: result.source,
        error: result.error
      }));
      const selectedItem = result.watchlistRefresh?.items.find(
        (item) =>
          item.market === workspace.selectedInstrument.market &&
          item.symbol === workspace.selectedInstrument.symbol &&
          item.timeframe === workspace.selectedTimeframe
      );
      const selectedContextRefreshed = selectedItem?.status === "refreshed";
      if (result.watchlistRefresh) {
        setWatchlistCacheRefreshHistory((current) => [
          result.watchlistRefresh!,
          ...current.filter((run) => run.runId !== result.watchlistRefresh!.runId)
        ].slice(0, 4));
        setWatchlistCacheRefreshRunSelection(result.watchlistRefresh.runId);
      }
      if (!selectedContextRefreshed) {
        const message = selectedItem?.error ?? result.error ?? "选中标的行情刷新未完成，请检查数据源状态。";
        automatedTradingWorkflowActionErrorRef.current = message;
        setMarketRefreshIssue(message);
      }
      if (selectedContextRefreshed) {
        await refreshChart();
      }
      await refreshGoldenPathStatus();
      return selectedContextRefreshed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "行情刷新失败。";
      automatedTradingWorkflowActionErrorRef.current = message;
      setMarketRefreshIssue(message);
      return false;
    } finally {
      if (refreshGuard.overrideApplied) {
        setMarketDataRefreshOverride(null);
        setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
      }
      setIsRefreshingWatchlistCache(false);
    }
  }, [
    activeMarketDataRefreshOverride,
    i18n,
    refreshChart,
    refreshGoldenPathStatus,
    setWatchlistCacheRefreshRunSelection,
    settingsStatus.settings?.marketDataAdapters,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe,
    workspace.watchlist
  ]);

  const loadHistoricalKlines = useCallback(async (beforeTimestampMs: number): Promise<MarketKlinesResult["bars"]> => {
    const current = klinesStateRef.current;
    const earliestTimestampMs = current.bars[0]?.timestampMs;
    if (!Number.isFinite(beforeTimestampMs) || !earliestTimestampMs) {
      return [];
    }

    const endMs = Math.min(beforeTimestampMs, earliestTimestampMs) - 1;
    const requestKey = `${current.market}:${current.symbol}:${current.timeframe}:${endMs}`;
    if (historicalKlineRequestRef.current === requestKey) {
      return [];
    }

    historicalKlineRequestRef.current = requestKey;
    try {
      const result = await loadMarketKlines(quantCoreBaseUrl, {
        market: current.market,
        symbol: current.symbol,
        timeframe: current.timeframe,
        limit: chartKlineLimit,
        end: new Date(endMs).toISOString()
      });
      const olderBars = result.bars.filter((bar) => bar.timestampMs < earliestTimestampMs);
      if (olderBars.length) {
        setKlinesState((existing) =>
          existing.market === result.market &&
          existing.symbol === result.symbol &&
          existing.timeframe === result.timeframe
            ? mergeMarketKlines(existing, result)
            : existing
        );
      }
      return olderBars;
    } finally {
      if (historicalKlineRequestRef.current === requestKey) {
        historicalKlineRequestRef.current = null;
      }
    }
  }, []);

  const runPipeline = useCallback(async (confirmation?: "accepted") => {
    if (!researchPipelinePreflight.canRun) {
      automatedTradingWorkflowActionErrorRef.current =
        researchPipelinePreflightIssueDetail(i18n, researchPipelinePreflight);
      setIsResearchPipelineConfirmationOpen(true);
      setActiveWorkAreaId("research");
      setActiveLoopStepId("research");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: researchPipelinePreflightStatusLabel(i18n, researchPipelinePreflight),
        error: researchPipelinePreflightIssueDetail(i18n, researchPipelinePreflight)
      }));
      return false;
    }
    if (researchPipelinePreflight.requiresConfirmation && confirmation !== "accepted") {
      automatedTradingWorkflowActionErrorRef.current =
        i18n.locale === "zh-CN" ? "研究上下文仍需确认。" : "The research context still requires confirmation.";
      setIsResearchPipelineConfirmationOpen(true);
      return false;
    }
    setIsResearchPipelineConfirmationOpen(false);
    setResearchCompletionNotice(null);

    const runId = workflowRunIdRef.current + 1;
    workflowRunIdRef.current = runId;
    let log: WorkflowRunLogEntry[] = [];
    const selectedContext = `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`;
    const publishStage = (
      activeStageId: string,
      completedStageIds: string[],
      failedStageId: string | null = null
    ) => {
      if (workflowRunIdRef.current !== runId) {
        return;
      }
      setActiveWorkflowStageId(activeStageId);
      setWorkflowRunState({
        activeStageId,
        completedStageIds,
        failedStageId,
        log
      });
    };
    const appendLog = (stageId: string, level: WorkflowRunLogEntry["level"], message: string) => {
      log = [...log, createWorkflowLogEntry(runId, log.length + 1, stageId, level, message)];
    };

    setIsRunning(true);
    setPaperExecutionRecord(null);
    setPromotionCandidateRecord(null);
    resetAiReviewHistoryState();
    appendLog("factor", "info", "Strategy preflight sent to local core");
    publishStage("factor", []);
    const preflight = await validateStrategySnapshot(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      auditRunId: workspace.researchRun?.runId ?? null,
      strategy: workspace.strategy
    });
    if (workflowRunIdRef.current !== runId) {
      return false;
    }
    setStrategyValidationState(preflight);
    if (preflight.validation?.status === "blocked") {
      const blockedGates = preflight.validation.gates
        .filter((gate) => gate.status === "blocked")
        .map((gate) => gate.id)
        .join(", ");
      automatedTradingWorkflowActionErrorRef.current =
        `Strategy preflight blocked: ${blockedGates || "readiness gate"}`;
      appendLog("factor", "error", `Strategy preflight blocked: ${blockedGates || "readiness gate"}`);
      publishStage("factor", [], "factor");
      setIsRunning(false);
      return false;
    }
    appendLog(
      "factor",
      preflight.source === "core" ? "success" : "warning",
      preflight.source === "core"
        ? `Strategy preflight passed: ${preflight.validation?.status ?? "review"}`
        : `Strategy preflight used local fallback: ${preflight.error ?? "core unavailable"}`
    );

    appendLog("data", "info", researchPipelineDataSnapshotLogLabel(selectedContext, researchPipelinePreflight));
    publishStage("data", []);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return false;
    }
    appendLog("factor", "success", "Factor set staged: SMA / RSI / volume");
    publishStage("factor", ["data"]);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return false;
    }
    appendLog("backtest", "info", "Backtest request sent to local core");
    publishStage("backtest", ["data", "factor"]);

    const result = await runP0Pipeline(
      quantCoreBaseUrl,
      {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        limit: chartKlineLimit,
        watchlistRefreshRunId: researchPipelinePreparationEvidenceRunId,
        selectionOrigin:
          pendingMarketAiSelectionResearchOrigin
          && pendingMarketAiSelectionResearchOrigin.market === workspace.selectedInstrument.market
          && pendingMarketAiSelectionResearchOrigin.symbol === workspace.selectedInstrument.symbol
          && workspace.selectedTimeframe === "1d"
            ? {
                selectionId: pendingMarketAiSelectionResearchOrigin.selectionId,
                candidateEvidenceId:
                  pendingMarketAiSelectionResearchOrigin.candidateEvidenceId,
              }
            : undefined,
      },
      workspace
    );
    if (workflowRunIdRef.current !== runId) {
      return false;
    }
    setWorkspaceState(result);

    if (result.source === "fallback") {
      automatedTradingWorkflowActionErrorRef.current = result.error ?? result.statusLabel;
      appendLog("backtest", "error", `Pipeline failed before audited backtest: ${result.error ?? result.statusLabel}`);
      publishStage("backtest", ["data", "factor"], "backtest");
      await refreshRunHistory();
      setIsRunning(false);
      return false;
    }

    const researchSummary = result.workspace.researchRun;
    appendLog(
      "backtest",
      "success",
      result.pipeline
        ? `P0 audited run ${result.pipeline.runId} ready · ${result.pipeline.dataSnapshotId} · paper-only`
        : researchRunEvidenceLogLabel(researchSummary)
    );
    publishStage("agent", ["data", "factor", "backtest"]);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return false;
    }
    appendLog("agent", "success", "Agent committee report received");
    appendLog("execution", "warning", "Live execution remains blocked; paper review is ready");
    publishStage("execution", ["data", "factor", "backtest", "agent"]);
    const runHistoryReadback = await refreshRunHistory();
    const strategyLibraryReadback = await refreshStrategyLibrary();
    if (workflowRunIdRef.current !== runId) {
      return false;
    }
    setIsRunning(false);
    if (researchSummary) {
      setResearchCompletionNotice({
        dataRows: researchSummary.dataRows,
        instrumentName: result.workspace.selectedInstrument.name,
        readbackReady:
          runHistoryReadback.source === "core" && strategyLibraryReadback.source === "core",
        runId: researchSummary.runId,
        symbol: result.workspace.selectedInstrument.symbol,
        timeframe: result.workspace.selectedTimeframe
      });
    }
    return true;
  }, [
    chartKlineLimit,
    i18n,
    pendingMarketAiSelectionResearchOrigin,
    quantCoreBaseUrl,
    refreshRunHistory,
    refreshStrategyLibrary,
    researchPipelinePreparationEvidenceRunId,
    researchPipelinePreflight,
    resetAiReviewHistoryState,
    workspace
  ]);

  const preparePortfolioPeerAudits = useCallback(async () => {
    const sourceRunId = currentResearchRunIdRef.current;
    if (!sourceRunId || portfolioPeerAuditActiveRef.current) {
      return null;
    }
    const missingCandidates = portfolioPeerAuditPlan.candidates
      .filter((candidate) => candidate.status === "missing")
      .slice(0, 1);
    if (!missingCandidates.length) {
      return null;
    }

    portfolioPeerAuditActiveRef.current = true;
    const requestId = ++portfolioPeerAuditRequestIdRef.current;
    const peerKlineLimit = Math.max(
      1,
      Math.min(
        chartKlineLimit,
        workspace.backtestEquityCurve?.length ?? workspace.researchRun?.dataRows ?? chartKlineLimit
      )
    );
    setIsPreparingPortfolioPeers(true);
    const failures: string[] = [];
    let refreshedRuns: Awaited<ReturnType<typeof refreshRunHistory>> | null = null;
    try {
      for (const candidate of missingCandidates) {
        const instrument =
          workspace.watchlist.find(
            (item) => item.market === candidate.market && item.symbol === candidate.symbol
          ) ??
          buildInstrumentFromSymbol(candidate.market, candidate.symbol) ?? {
            market: candidate.market,
            symbol: candidate.symbol,
            name: candidate.name,
            changePct: 0,
            price: null
          };
        const peerWorkspace = workspaceWithPortfolioPeerAuditInstrument(workspace, instrument);
        const result = await runTerminalResearch(
          quantCoreBaseUrl,
          {
            market: candidate.market,
            symbol: candidate.symbol,
            timeframe: candidate.timeframe,
            limit: peerKlineLimit,
            end: workspace.backtestEquityCurve?.at(-1)?.timestamp
          },
          peerWorkspace
        );
        if (result.source === "fallback") {
          failures.push(`${candidate.symbol}: ${result.error ?? result.statusLabel}`);
        }
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "Portfolio peer audit failed");
    } finally {
      const requestIsCurrent = () =>
        portfolioPeerAuditRequestIdRef.current === requestId &&
        currentResearchRunIdRef.current === sourceRunId;
      if (requestIsCurrent()) {
        refreshedRuns = await refreshRunHistory();
        if (refreshedRuns.source === "fallback") {
          failures.push(refreshedRuns.error ?? "Portfolio run history readback failed");
        }
        await refreshStrategyLibrary();
      }
      if (requestIsCurrent()) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: failures.length ? "Portfolio peer audit failed" : "Portfolio peer audits prepared",
          error: failures[0]
        }));
        portfolioPeerAuditActiveRef.current = false;
        setIsPreparingPortfolioPeers(false);
      }
    }
    return {
      history: refreshedRuns,
      error: failures[0]
    };
  }, [
    chartKlineLimit,
    portfolioPeerAuditPlan.candidates,
    quantCoreBaseUrl,
    refreshRunHistory,
    refreshStrategyLibrary,
    workspace
  ]);

  const runPortfolioBacktestDraft = useCallback(async () => {
    resetStage4PortfolioBusyState();
    setPortfolioBacktestState(initialPortfolioBacktestState);
    const request = portfolioStage4RequestCoordinatorRef.current.begin(currentResearchRunId);
    let draft = portfolioBacktestDraft;
    let peerAuditError: string | undefined;
    if (
      !draft.request &&
      draft.headline === "Portfolio backtest needs peers" &&
      portfolioPeerAuditPlan.status === "ready"
    ) {
      const peerAuditResult = await preparePortfolioPeerAudits();
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      peerAuditError = peerAuditResult?.error;
      if (peerAuditResult?.history?.source === "core") {
        draft = buildPortfolioBacktestDraft(peerAuditResult.history.runs, currentResearchRunId);
      }
    }
    if (!draft.request) {
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setPortfolioBacktestState({
        source: "fallback",
        error: peerAuditError ?? draft.summary
      });
      return;
    }

    setIsRunningPortfolioBacktest(true);
    const result = await runPortfolioBacktest(quantCoreBaseUrl, draft.request);
    if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
    setPortfolioBacktestState(result);
    setIsRunningPortfolioBacktest(false);
  }, [
    currentResearchRunId,
    portfolioBacktestDraft,
    portfolioPeerAuditPlan.status,
    preparePortfolioPeerAudits,
    quantCoreBaseUrl,
    resetStage4PortfolioBusyState
  ]);

  const recordPortfolioPaperOrders = useCallback(async () => {
    const portfolio = portfolioBacktestState.portfolio;
    const baseRunId = currentResearchRunId;
    resetStage4PortfolioBusyState();
    const request = portfolioStage4RequestCoordinatorRef.current.begin(baseRunId);
    const orders = portfolio?.paperOrderEvents ?? [];
    if (!portfolio || !baseRunId || !orders.length) {
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio paper order record failed",
        error: "Run a portfolio backtest with paper order events before recording orders"
      }));
      return;
    }

    setIsRecordingPortfolioPaperOrders(true);
    const result = await recordPortfolioPaperOrderBatch(quantCoreBaseUrl, {
      baseRunId,
      portfolioName: portfolio.name,
      orders
    });
    if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
    setIsRecordingPortfolioPaperOrders(false);

    const recordedBatch = result.batch;
    if (recordedBatch) {
      setPortfolioPaperOrderBatches((current) => [
        recordedBatch,
        ...current.filter((batch) => batch.batchId !== recordedBatch.batchId)
      ]);
      if (result.lifecycle?.length) {
        setPortfolioPaperOrderLifecycleEvents((current) =>
          mergePortfolioPaperOrderLifecycleEvents(current, recordedBatch.batchId, result.lifecycle ?? [])
        );
      }
      const stateHistoryResult = await loadPortfolioPaperOrderStateHistory(
        quantCoreBaseUrl,
        recordedBatch.baseRunId,
        recordedBatch.batchId
      );
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      const history = stateHistoryResult.stateHistory;
      if (history) {
        setPortfolioPaperOrderStateHistories((current) =>
          mergePortfolioPaperOrderStateHistories(current, history)
        );
      }
      setPortfolioPaperOrderHistoryError(stateHistoryResult.error ?? null);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: result.auditEvent
          ? `Portfolio paper orders recorded · ${result.auditEvent.eventId}`
          : "Portfolio paper orders recorded",
        error: undefined
      }));
      return;
    }

    setPortfolioPaperOrderHistoryError(result.error ?? "Portfolio paper order record failed");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Portfolio paper order record failed",
      error: result.error ?? "Portfolio paper order record failed"
    }));
  }, [currentResearchRunId, portfolioBacktestState.portfolio, resetStage4PortfolioBusyState]);

  const reviewPortfolioPaperOrder = useCallback(async (row: PortfolioPaperOrderApprovalRow, approved: boolean) => {
    if (row.baseRunId !== currentResearchRunId) return;
    resetStage4PortfolioBusyState();
    const request = portfolioStage4RequestCoordinatorRef.current.begin(row.baseRunId);
    setApprovingPortfolioPaperOrderId(row.id);
    const result = await recordPortfolioPaperOrderApproval(quantCoreBaseUrl, {
      baseRunId: row.baseRunId,
      batchId: row.batchId,
      orderId: row.orderId,
      approved,
      reviewer: "local-operator",
      reviewedAt: new Date().toISOString(),
      reason: approved
        ? "Operator approved this paper-only portfolio order for simulation."
        : "Operator rejected this paper-only portfolio order before simulation."
    });
    if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
    setApprovingPortfolioPaperOrderId(null);

    if (result.approval) {
      if (result.lifecycle?.length) {
        setPortfolioPaperOrderLifecycleEvents((current) =>
          mergePortfolioPaperOrderLifecycleEvents(current, row.batchId, result.lifecycle ?? [])
        );
      }
      const [stateHistoryResult, replayResult] = await Promise.all([
        loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, row.baseRunId, row.batchId),
        loadPortfolioPaperOrderReplay(quantCoreBaseUrl, row.baseRunId)
      ]);
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      const history = stateHistoryResult.stateHistory;
      if (history) {
        setPortfolioPaperOrderStateHistories((current) =>
          mergePortfolioPaperOrderStateHistories(current, history)
        );
      }
      setPortfolioPaperOrderReplay(replayResult.replay ?? null);
      setPortfolioPaperOrderHistoryError(stateHistoryResult.error ?? replayResult.error ?? null);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: approved
          ? `Portfolio paper order approved · ${row.orderId}`
          : `Portfolio paper order rejected · ${row.orderId}`,
        error: undefined
      }));
      return;
    }

    const approvalError = buildPortfolioPaperOrderApprovalLockedLedgerMessage(result);
    setPortfolioPaperOrderHistoryError(approvalError);
    if (portfolioPaperOrderApprovalResultCarriesLockedLedgerState(result)) {
      setPortfolioPaperOrderLifecycleEvents((current) =>
        mergePortfolioPaperOrderLifecycleEvents(current, row.batchId, result.lifecycle ?? [])
      );
    }
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Portfolio paper order approval failed",
      error: approvalError
    }));
  }, [currentResearchRunId, quantCoreBaseUrl, resetStage4PortfolioBusyState]);

  const approvePortfolioPaperOrder = useCallback(
    (row: PortfolioPaperOrderApprovalRow) => reviewPortfolioPaperOrder(row, true),
    [reviewPortfolioPaperOrder]
  );

  const rejectPortfolioPaperOrder = useCallback(
    (row: PortfolioPaperOrderApprovalRow) => reviewPortfolioPaperOrder(row, false),
    [reviewPortfolioPaperOrder]
  );

  const updatePortfolioRouteRiskTemplate = useCallback(
    (field: keyof PortfolioPaperOrderRouteRiskTemplate, value: number) => {
      setPortfolioRouteRiskTemplate((current) => ({
        ...current,
        [field]: value
      }));
    },
    []
  );

  const simulatePortfolioPaperOrder = useCallback(async (row: PortfolioPaperOrderApprovalRow) => {
    if (row.baseRunId !== currentResearchRunId) return;
    resetStage4PortfolioBusyState();
    const request = portfolioStage4RequestCoordinatorRef.current.begin(row.baseRunId);
    setSimulatingPortfolioPaperOrderId(row.id);
    const routeRow = portfolioPaperOrderSimulationRouteRows.find(
      (candidate) => candidate.batchId === row.batchId && candidate.orderId === row.orderId
    );
    const result = await recordPortfolioPaperOrderSimulation(quantCoreBaseUrl, {
      baseRunId: row.baseRunId,
      batchId: row.batchId,
      orderId: row.orderId,
      simulatedAt: new Date().toISOString(),
      routeRisk: portfolioPaperOrderRouteRiskRequest,
      adapterPaperExecutionId: routeRow?.adapterPaperExecutionId ?? undefined,
      adapterManifestValidationId: routeRow?.adapterManifestValidationId ?? undefined,
      adapterPaperExecutionEvidence: routeRow?.adapterPaperExecutionId
        ? {
            adapterPaperExecutionId: routeRow.adapterPaperExecutionId,
            adapterManifestValidationId: routeRow.adapterManifestValidationId,
            evidenceLabel: routeRow.adapterPaperExecutionEvidenceLabel,
            paperFillRecorded: true,
            liveOrderSubmitted: false,
            routeExecuted: false
          }
        : undefined
    });
    if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
    setSimulatingPortfolioPaperOrderId(null);

    if (result.simulation) {
      if (result.simulations?.length) {
        setPortfolioPaperOrderSimulations((current) =>
          mergePortfolioPaperOrderSimulations(current, row.batchId, result.simulations)
        );
      }
      if (result.lifecycle?.length) {
        setPortfolioPaperOrderLifecycleEvents((current) =>
          mergePortfolioPaperOrderLifecycleEvents(current, row.batchId, result.lifecycle ?? [])
        );
      }
      const [stateHistoryResult, replayResult] = await Promise.all([
        loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, row.baseRunId, row.batchId),
        loadPortfolioPaperOrderReplay(quantCoreBaseUrl, row.baseRunId)
      ]);
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      const history = stateHistoryResult.stateHistory;
      if (history) {
        setPortfolioPaperOrderStateHistories((current) =>
          mergePortfolioPaperOrderStateHistories(current, history)
        );
      }
      setPortfolioPaperOrderReplay(replayResult.replay ?? null);
      setPortfolioPaperOrderHistoryError(stateHistoryResult.error ?? replayResult.error ?? null);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Portfolio paper order simulated · ${row.orderId}`,
        error: undefined
      }));
      return;
    }

    setPortfolioPaperOrderHistoryError(result.error ?? "Portfolio paper order simulation failed");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Portfolio paper order simulation failed",
      error: result.error ?? "Portfolio paper order simulation failed"
    }));
  }, [
    currentResearchRunId,
    portfolioPaperOrderRouteRiskRequest,
    portfolioPaperOrderSimulationRouteRows,
    quantCoreBaseUrl,
    resetStage4PortfolioBusyState
  ]);

  const simulatePortfolioPaperOrderBatch = useCallback(async () => {
    resetStage4PortfolioBusyState();
    const request = portfolioStage4RequestCoordinatorRef.current.begin(currentResearchRunId);
    const simulatedOrderKeys = new Set(
      portfolioPaperOrderSimulations.map((simulation) => `${simulation.batchId}:${simulation.orderId}`)
    );
    const eligibleRows = portfolioPaperOrderApprovalRows.filter(
      (row) =>
        row.baseRunId === currentResearchRunId &&
        row.state === "ready_for_simulation" &&
        (row.side === "buy" || row.side === "sell") &&
        !simulatedOrderKeys.has(`${row.batchId}:${row.orderId}`)
    );
    if (!eligibleRows.length) {
      if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio batch simulation skipped",
        error: "No ready portfolio paper orders are available for batch simulation"
      }));
      return;
    }

    const rowsByBatch = new Map<string, PortfolioPaperOrderApprovalRow[]>();
    for (const row of eligibleRows) {
      const key = `${row.baseRunId}:${row.batchId}`;
      rowsByBatch.set(key, [...(rowsByBatch.get(key) ?? []), row]);
    }

    setIsSimulatingPortfolioPaperOrderBatch(true);
    const simulatedAt = new Date().toISOString();
    let filledCount = 0;
    let blockedCount = 0;
    const errors: string[] = [];
    try {
      for (const rowsForBatch of rowsByBatch.values()) {
        const firstRow = rowsForBatch[0];
        if (!firstRow) {
          continue;
        }
        const adapterPaperExecutionEvidenceByOrderId: Record<
          string,
          {
            adapterPaperExecutionId: string;
            adapterManifestValidationId?: string;
            adapterPaperExecutionEvidence: Record<string, unknown>;
          }
        > = {};
        for (const row of rowsForBatch) {
          const routeRow = portfolioPaperOrderSimulationRouteRows.find(
            (candidate) => candidate.batchId === row.batchId && candidate.orderId === row.orderId
          );
          if (!routeRow?.adapterPaperExecutionId) {
            continue;
          }
          adapterPaperExecutionEvidenceByOrderId[row.orderId] = {
            adapterPaperExecutionId: routeRow.adapterPaperExecutionId,
            adapterManifestValidationId: routeRow.adapterManifestValidationId ?? undefined,
            adapterPaperExecutionEvidence: {
              adapterPaperExecutionId: routeRow.adapterPaperExecutionId,
              adapterManifestValidationId: routeRow.adapterManifestValidationId,
              evidenceLabel: routeRow.adapterPaperExecutionEvidenceLabel,
              paperFillRecorded: true,
              liveOrderSubmitted: false,
              routeExecuted: false
            }
          };
        }
        const result = await recordPortfolioPaperOrderBatchSimulation(quantCoreBaseUrl, {
          baseRunId: firstRow.baseRunId,
          batchId: firstRow.batchId,
          orderIds: rowsForBatch.map((row) => row.orderId),
          simulatedAt,
          routeRisk: portfolioPaperOrderRouteRiskRequest,
          adapterPaperExecutionEvidenceByOrderId:
            Object.keys(adapterPaperExecutionEvidenceByOrderId).length > 0
              ? adapterPaperExecutionEvidenceByOrderId
              : undefined
        });
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;

        filledCount += result.batchSimulation?.filledCount ?? result.createdSimulations.length;
        blockedCount += result.batchSimulation?.blockedCount ?? 0;
        if (result.error) {
          errors.push(result.error);
        }
        if (result.simulations.length) {
          setPortfolioPaperOrderSimulations((current) =>
            mergePortfolioPaperOrderSimulations(current, firstRow.batchId, result.simulations)
          );
        }
        if (result.lifecycle?.length) {
          setPortfolioPaperOrderLifecycleEvents((current) =>
            mergePortfolioPaperOrderLifecycleEvents(current, firstRow.batchId, result.lifecycle ?? [])
          );
        }
        const stateHistoryResult = await loadPortfolioPaperOrderStateHistory(
          quantCoreBaseUrl,
          firstRow.baseRunId,
          firstRow.batchId
        );
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        const stateHistory = stateHistoryResult.stateHistory;
        if (stateHistory) {
          setPortfolioPaperOrderStateHistories((current) =>
            mergePortfolioPaperOrderStateHistories(current, stateHistory)
          );
        }
        if (stateHistoryResult.error) {
          errors.push(stateHistoryResult.error);
        }
        const replayResult = await loadPortfolioPaperOrderReplay(quantCoreBaseUrl, firstRow.baseRunId);
        if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
        setPortfolioPaperOrderReplay(replayResult.replay ?? null);
        if (replayResult.error) {
          errors.push(replayResult.error);
        }
      }
    } finally {
      if (portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) {
        setIsSimulatingPortfolioPaperOrderBatch(false);
      }
    }

    if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
    const statusLabel = `Portfolio batch simulation routed · ${filledCount} filled / ${blockedCount} blocked`;
    const error = errors.length ? errors.join("; ") : undefined;
    setPortfolioPaperOrderHistoryError(error ?? null);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel,
      error
    }));
  }, [
    currentResearchRunId,
    portfolioPaperOrderApprovalRows,
    portfolioPaperOrderRouteRiskRequest,
    portfolioPaperOrderSimulationRouteRows,
    portfolioPaperOrderSimulations,
    quantCoreBaseUrl,
    resetStage4PortfolioBusyState
  ]);

  const recordPortfolioStage4Workflow = useCallback(async () => {
    const workflowDraft = portfolioBacktestDraft.request;
    const batch = portfolioStage4LatestBatch;
    if (!workflowDraft || !currentResearchRunId || !batch) return;
    resetStage4PortfolioBusyState();
    const request = portfolioStage4RequestCoordinatorRef.current.begin(currentResearchRunId);
    setIsRecordingPortfolioStage4Workflow(true);
    const result = await recordStage4PortfolioWorkflow(quantCoreBaseUrl, {
      baseRunId: currentResearchRunId,
      name: workflowDraft.name,
      initialCash: workflowDraft.initialCash,
      legs: workflowDraft.legs,
      riskTemplate: {
        minCashAfter: portfolioPaperOrderRouteRiskRequest.minCashAfter,
        maxSymbolNotional: portfolioPaperOrderRouteRiskRequest.maxSymbolNotional,
        maxBatchNotional: portfolioPaperOrderRouteRiskRequest.maxBatchNotional
      },
      batchId: batch.batchId,
      operator: "local-operator"
    });
    if (!portfolioStage4RequestCoordinatorRef.current.isCurrent(request)) return;
    setIsRecordingPortfolioStage4Workflow(false);
    const workflow = result.workflow;
    if (workflow) {
      setPortfolioStage4Workflows((current) => [
        workflow,
        ...current.filter((currentWorkflow) => currentWorkflow.workflowId !== workflow.workflowId)
      ]);
      setPortfolioPaperOrderHistoryError(null);
      return;
    }
    setPortfolioPaperOrderHistoryError(result.error ?? "Stage 4 portfolio workflow record failed");
  }, [
    currentResearchRunId,
    portfolioBacktestDraft.request,
    portfolioPaperOrderRouteRiskRequest,
    portfolioStage4LatestBatch,
    quantCoreBaseUrl,
    resetStage4PortfolioBusyState
  ]);

  const runPortfolioRiskAssessment = useCallback(async (
    assessmentRequest: PortfolioRiskAssessmentRequest
  ) => {
    if (isRunningPortfolioRiskAssessment) return;
    setIsRunningPortfolioRiskAssessment(true);
    setPortfolioRiskAssessmentError(null);
    const result = await createPortfolioRiskAssessment(quantCoreBaseUrl, assessmentRequest);
    setIsRunningPortfolioRiskAssessment(false);
    if (result.assessment) {
      setPortfolioRiskAssessments((current) => [
        result.assessment!,
        ...current.filter((assessment) => assessment.assessmentId !== result.assessment!.assessmentId)
      ]);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `M5 组合风险评估已记录 · ${result.assessment!.assessmentId}`,
        error: undefined
      }));
      return;
    }
    const message = result.error ?? "M5 组合风险评估失败";
    setPortfolioRiskAssessmentError(message);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "M5 组合风险评估失败",
      error: message
    }));
  }, [isRunningPortfolioRiskAssessment, quantCoreBaseUrl]);

  const runPortfolioStage4PrimaryAction = useCallback((actionId: string) => {
    if (actionId === "run-portfolio-backtest") return void runPortfolioBacktestDraft();
    if (actionId === "record-paper-order-batch") return void recordPortfolioPaperOrders();
    if (actionId === "simulate-portfolio-batch") return void simulatePortfolioPaperOrderBatch();
    if (actionId === "refresh-account-replay") {
      resetStage4PortfolioBusyState();
      portfolioStage4RequestCoordinatorRef.current.invalidate(currentResearchRunId);
      setPortfolioStage4RefreshGeneration((current) => current + 1);
      return;
    }
    if (actionId === "record-stage4-workflow") return void recordPortfolioStage4Workflow();
    const selector = {
      "review-portfolio-risk": ".surface-portfolio .design-risk-ledger",
      "review-portfolio-orders": ".surface-portfolio .portfolio-order-approval",
      "review-route-risk": ".surface-portfolio .design-risk-ledger"
    }[actionId];
    if (!selector) return;
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) {
      setPortfolioPaperOrderHistoryError("当前步骤的操作区域尚未加载，请刷新页面后重试。");
      return;
    }
    setPortfolioPaperOrderHistoryError(null);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
  }, [
    recordPortfolioPaperOrders,
    recordPortfolioStage4Workflow,
    runPortfolioBacktestDraft,
    simulatePortfolioPaperOrderBatch,
    currentResearchRunId,
    resetStage4PortfolioBusyState
  ]);

  const runStage5ShadowPrimaryAction = useCallback(async (
    reviewInput?: { outcome: "approved" | "rejected"; reason: string }
  ) => {
    if (!portfolioStage4Workflow || isRunningStage5Shadow) return;
    const requestId = stage5ShadowRequestIdRef.current + 1;
    stage5ShadowRequestIdRef.current = requestId;
    setIsRunningStage5Shadow(true);
    setStage5ShadowError(null);
    if (stage5ShadowState.actionId === "record-stage5-sandbox-authorization-review") {
      const preflight = stage5ShadowState.authorizationPreflight;
      if (!preflight || !reviewInput?.reason.trim()) {
        setIsRunningStage5Shadow(false);
        setStage5ShadowError("Stage 5 sandbox authorization review reason is required");
        return;
      }
      const result = await runStage5SandboxAuthorizationReview(
        quantCoreBaseUrl, preflight, reviewInput.outcome, reviewInput.reason.trim()
      );
      if (stage5ShadowRequestIdRef.current !== requestId) return;
      setIsRunningStage5Shadow(false);
      if (!result.review) {
        setStage5ShadowError(result.error ?? "Stage 5 sandbox authorization review failed");
        return;
      }
      const review = result.review;
      setStage5SandboxAuthorizationReviews((current) => [
        review,
        ...current.filter((row) => row.reviewId !== review.reviewId)
      ]);
      return;
    }
    if (stage5ShadowState.actionId === "run-stage5-sandbox-authorization-preflight") {
      const decision = stage5ShadowState.readinessDecision;
      const executionId = stage5ShadowState.sandboxProbeExecutionId;
      const reviewId = stage5ShadowState.sandboxProbeReviewId;
      if (!decision || !executionId || !reviewId) {
        setIsRunningStage5Shadow(false);
        setStage5ShadowError("Stage 5 authoritative sandbox probe evidence is required");
        return;
      }
      const result = await runStage5SandboxAuthorizationPreflight(
        quantCoreBaseUrl, decision, executionId, reviewId
      );
      if (stage5ShadowRequestIdRef.current !== requestId) return;
      setIsRunningStage5Shadow(false);
      if (!result.preflight) {
        setStage5ShadowError(result.error ?? "Stage 5 sandbox authorization preflight failed");
        return;
      }
      const preflight = result.preflight;
      setStage5SandboxAuthorizationPreflights((current) => [
        preflight,
        ...current.filter((row) => row.preflightId !== preflight.preflightId)
      ]);
      return;
    }
    if (stage5ShadowState.actionId === "review-stage5-sandbox-readiness") {
      if (!stage5ShadowState.session) {
        setIsRunningStage5Shadow(false);
        setStage5ShadowError("Stage 5 reconciled shadow session is required");
        return;
      }
      const result = await runStage5SandboxReadinessDecision(
        quantCoreBaseUrl,
        portfolioStage4Workflow,
        stage5ShadowState.session
      );
      if (stage5ShadowRequestIdRef.current !== requestId) return;
      setIsRunningStage5Shadow(false);
      if (!result.decision) {
        setStage5ShadowError(result.error ?? "Stage 5 sandbox readiness review failed");
        return;
      }
      const decision = result.decision;
      setStage5SandboxReadinessDecisions((current) => [
        decision,
        ...current.filter((row) => row.decisionId !== decision.decisionId)
      ]);
      return;
    }
    const result = await runStage5ShadowSession(
      quantCoreBaseUrl,
      portfolioStage4Workflow,
      stage5ShadowState.session?.failureMode ?? "none"
    );
    if (stage5ShadowRequestIdRef.current !== requestId) return;
    setIsRunningStage5Shadow(false);
    if (!result.session) {
      setStage5ShadowError(result.error ?? "Stage 5 shadow validation failed");
      return;
    }
    const session = result.session;
    setStage5ShadowSessions((current) => [
      session,
      ...current.filter((row) => row.sessionId !== session.sessionId)
    ]);
  }, [isRunningStage5Shadow, portfolioStage4Workflow, stage5ShadowState]);

  const runStage6SandboxAction = useCallback(async () => {
    if (isRunningStage6Sandbox || !stage6GoldenPath.action) return;
    setIsRunningStage6Sandbox(true);
    setStage6SandboxError(null);
    try {
      if (stage6GoldenPath.action === "authorize") {
        const { session, readinessDecision, authorizationPreflight, authorizationReview } = stage5ShadowState;
        if (!portfolioStage4Workflow || !session || !readinessDecision || !authorizationPreflight || !authorizationReview) {
          throw new Error("Stage 4/5 权威证据链不完整");
        }
        const result = await authorizeStage6SandboxBatch(
          quantCoreBaseUrl, portfolioStage4Workflow, session, readinessDecision, authorizationPreflight, authorizationReview
        );
        if (!result.authorization) throw new Error(result.error ?? "Stage 6 批次授权失败");
        setStage6SandboxAuthorizations((current) => [
          result.authorization!, ...current.filter((row) => row.authorizationId !== result.authorization!.authorizationId)
        ]);
        setStage6SandboxBatch(null);
        return;
      }
      if (!stage6SandboxAuthorization) throw new Error("Stage 6 批次授权不存在");
      const result = stage6GoldenPath.action === "submit"
        ? await submitStage6SandboxBatch(quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId)
        : stage6GoldenPath.action === "reconcile"
          ? await reconcileStage6SandboxBatch(quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId)
          : await cancelStage6SandboxOrder(
              quantCoreBaseUrl,
              stage6SandboxAuthorization.authorizationId,
              stage6SandboxBatch?.orders.find((order) =>
                ["submission_pending", "open", "partially_filled", "reconciliation_required"].includes(order.state)
              )?.orderId ?? ""
            );
      if (!result.batch) throw new Error(result.error ?? "Stage 6 Sandbox 操作失败");
      setStage6SandboxBatch(result.batch);
      setStage6KillSwitchState(result.batch.killSwitch);
    } catch (error) {
      setStage6SandboxError(error instanceof Error ? error.message : "Stage 6 Sandbox 操作失败");
    } finally {
      setIsRunningStage6Sandbox(false);
    }
  }, [
    isRunningStage6Sandbox,
    portfolioStage4Workflow,
    stage5ShadowState,
    stage6GoldenPath.action,
    stage6SandboxAuthorization,
    stage6SandboxBatch
  ]);

  const runStage7ProductionReadonlyAction = useCallback(async (eligibilityConfirmed: boolean) => {
    if (isRunningStage7ProductionReadonly || !latestCcxtProductionRouteReviewId) return;
    setIsRunningStage7ProductionReadonly(true);
    setStage7ProductionReadonlyError(null);
    try {
      const result = await runStage7ProductionReadonlyProbe(
        quantCoreBaseUrl,
        latestCcxtProductionRouteReviewId,
        eligibilityConfirmed
      );
      if (!result.probe) throw new Error(result.error ?? "Stage 7 生产只读准入失败");
      setStage7ProductionReadonlyProbes((current) => [
        result.probe!, ...current.filter((row) => row.probeId !== result.probe!.probeId)
      ]);
      setStage7ProductionReadonlyError(result.error ?? null);
      const continuity = await loadStage8ProductionReadonlyContinuity(quantCoreBaseUrl);
      setStage8ProductionReadonlyContinuity(continuity.continuity ?? null);
      setStage8ProductionReadonlyError(continuity.error ?? null);
    } catch (error) {
      setStage7ProductionReadonlyError(error instanceof Error ? error.message : "Stage 7 生产只读准入失败");
    } finally {
      setIsRunningStage7ProductionReadonly(false);
    }
  }, [isRunningStage7ProductionReadonly, latestCcxtProductionRouteReviewId]);

  const runStage8ProductionReadonlyAccessAction = useCallback(async (
    action: "revoke" | "restore",
    reason: string
  ) => {
    if (isUpdatingStage8ProductionReadonly) return;
    setIsUpdatingStage8ProductionReadonly(true);
    setStage8ProductionReadonlyError(null);
    try {
      const result = await setStage8ProductionReadonlyAccess(
        quantCoreBaseUrl,
        action,
        reason,
        action === "restore" ? latestCcxtProductionRouteReviewId || null : null
      );
      if (!result.continuity) throw new Error(result.error ?? "Stage 8 生产只读控制失败");
      setStage8ProductionReadonlyContinuity(result.continuity);
    } catch (error) {
      setStage8ProductionReadonlyError(error instanceof Error ? error.message : "Stage 8 生产只读控制失败");
    } finally {
      setIsUpdatingStage8ProductionReadonly(false);
    }
  }, [isUpdatingStage8ProductionReadonly, latestCcxtProductionRouteReviewId]);

  const runStage9ProductionAdmissionCandidateAction = useCallback(async () => {
    if (isRunningStage9ProductionAdmission || !stage6SandboxAuthorization) return;
    setIsRunningStage9ProductionAdmission(true);
    setStage9ProductionAdmissionError(null);
    try {
      const result = await createStage9ProductionAdmissionCandidate(
        quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId
      );
      if (!result.candidate) throw new Error(result.error ?? "Stage 9 准入候选生成失败");
      setStage9ProductionAdmissionCandidates((current) => [
        result.candidate!, ...current.filter((row) => row.candidateId !== result.candidate!.candidateId)
      ]);
    } catch (error) {
      setStage9ProductionAdmissionError(error instanceof Error ? error.message : "Stage 9 准入候选生成失败");
    } finally {
      setIsRunningStage9ProductionAdmission(false);
    }
  }, [isRunningStage9ProductionAdmission, stage6SandboxAuthorization]);

  const runStage9ProductionAdmissionReviewAction = useCallback(async (
    reviewer: string,
    outcome: "approved" | "rejected",
    reason: string
  ) => {
    if (isRunningStage9ProductionAdmission || !stage9ProductionAdmissionCandidate) return;
    setIsRunningStage9ProductionAdmission(true);
    setStage9ProductionAdmissionError(null);
    try {
      const result = await createStage9ProductionAdmissionReview(
        quantCoreBaseUrl, stage9ProductionAdmissionCandidate.candidateId, reviewer, outcome, reason
      );
      if (!result.review) throw new Error(result.error ?? "Stage 9 准入复核失败");
      setStage9ProductionAdmissionReviews((current) => [
        result.review!, ...current.filter((row) => row.reviewId !== result.review!.reviewId)
      ]);
    } catch (error) {
      setStage9ProductionAdmissionError(error instanceof Error ? error.message : "Stage 9 准入复核失败");
    } finally {
      setIsRunningStage9ProductionAdmission(false);
    }
  }, [isRunningStage9ProductionAdmission, stage9ProductionAdmissionCandidate]);

  const runStage6KillSwitchAction = useCallback(async (triggered: boolean) => {
    if (isRunningStage6Sandbox) return;
    setIsRunningStage6Sandbox(true);
    setStage6SandboxError(null);
    try {
      const result = await setStage6KillSwitch(quantCoreBaseUrl, triggered);
      if (!result.killSwitch) throw new Error(result.error ?? "Stage 6 Kill Switch 操作失败");
      setStage6KillSwitchState(result.killSwitch);
      if (stage6SandboxAuthorization) {
        const batchResult = await loadStage6SandboxBatch(quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId);
        if (batchResult.batch) setStage6SandboxBatch(batchResult.batch);
      }
    } catch (error) {
      setStage6SandboxError(error instanceof Error ? error.message : "Stage 6 Kill Switch 操作失败");
    } finally {
      setIsRunningStage6Sandbox(false);
    }
  }, [isRunningStage6Sandbox, stage6SandboxAuthorization]);

  const exportPortfolioBacktestMarkdown = useCallback(() => {
    const portfolio = portfolioBacktestState.portfolio;
    const markdown = buildPortfolioBacktestReportMarkdown(portfolio, portfolioBacktestDraft);
    if (!markdown || !portfolio) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio report export failed",
        error: "Run a portfolio backtest before exporting the portfolio report"
      }));
      return;
    }

    const context = `${workspace.researchRun?.runId ?? "portfolio"}-${portfolio.market}-${portfolio.timeframe}`;
    const objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${context}-portfolio-report.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Portfolio report export ready",
      error: undefined
    }));
    void buildPortfolioBacktestReportAuditEvent({
      baseRunId: workspace.researchRun?.runId ?? null,
      markdown,
      portfolio
    }).then((portfolioReportAuditEvent) => {
      if (!portfolioReportAuditEvent) {
        return;
      }

      return saveAuditEvent(quantCoreBaseUrl, portfolioReportAuditEvent).then((result) => {
        if (result.event) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Portfolio report exported and audited",
            error: undefined
          }));
          return;
        }

        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Portfolio report export ready",
            error: `Audit ledger save failed: ${result.error}`
          }));
        }
      });
    });
  }, [portfolioBacktestDraft, portfolioBacktestState.portfolio, workspace.researchRun?.runId]);

  const loadPaperExecutionDeepLink = useCallback(
    async (deepLink: InitialPaperExecutionDeepLink) => {
      const replayVersion = manualSelectionVersionRef.current + 1;
      manualSelectionVersionRef.current = replayVersion;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      setPendingMarketAiSelectionResearchOrigin(null);
      resetAiReviewHistoryState();
      setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loading", error: null });
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution deep link loading",
        error: undefined
      }));

      const detail = await loadResearchRunDetail(quantCoreBaseUrl, deepLink.runId);
      if (manualSelectionVersionRef.current !== replayVersion) {
        return;
      }
      if (!detail.run) {
        const message = detail.error ?? `Paper execution run ${deepLink.runId} was not found`;
        setPaperExecutionDeepLinkStatus({ ...deepLink, status: "failed", error: message });
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution deep link failed",
          error: message
        }));
        setActiveWorkAreaId("execution");
        setActiveLoopStepId("paper");
        setActiveWorkflowStageId("execution");
        return;
      }

      const auditedRun = detail.run;
      const auditedKlines = marketKlinesFromResearchRunAudit(auditedRun);
      setWorkspaceState((current) => ({
        workspace: workspaceFromResearchRunAudit(current.workspace, auditedRun),
        source: "core",
        statusLabel: "Paper execution deep link run loaded",
        error: undefined
      }));
      if (auditedKlines) {
        setKlinesState(auditedKlines);
      }

      const [paperHistory, promotionHistory, aiReviewHistory] = await Promise.all([
        loadLatestResearchRunPaperExecution(quantCoreBaseUrl, auditedRun.runId),
        loadResearchRunPromotion(quantCoreBaseUrl, auditedRun.runId),
        refreshAiReviewRunHistory(auditedRun.runId, { offset: 0, query: "" })
      ]);
      if (manualSelectionVersionRef.current !== replayVersion) {
        return;
      }

      if (paperHistory.execution?.executionId !== deepLink.executionId) {
        const message =
          paperHistory.error ?? `Paper execution ${deepLink.executionId} was not found for ${auditedRun.runId}`;
        setPaperExecutionDeepLinkStatus({ ...deepLink, status: "failed", error: message });
        setPromotionCandidateRecord(promotionHistory.promotion ?? null);
        setAiReviewRunRecords(aiReviewHistory.aiReviews);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution deep link failed",
          error: message
        }));
        setActiveWorkAreaId("execution");
        setActiveLoopStepId("paper");
        setActiveWorkflowStageId("execution");
        setWorkflowRunState(buildAuditReplayWorkflowState(auditedRun));
        return;
      }

      setPaperExecutionRecord(paperHistory.execution);
      setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loaded", error: null });
      setPromotionCandidateRecord(promotionHistory.promotion ?? null);
      setAiReviewRunRecords(aiReviewHistory.aiReviews);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution deep link loaded",
        error: undefined
      }));
      setActiveWorkAreaId("execution");
      setActiveLoopStepId("paper");
      setActiveWorkflowStageId("execution");
      setWorkflowRunState(buildAuditReplayWorkflowState(auditedRun));
    },
    [refreshAiReviewRunHistory, resetAiReviewHistoryState]
  );

  useEffect(() => {
    const deepLink = initialPaperExecutionDeepLinkRef.current;
    if (!deepLink) {
      return;
    }
    initialPaperExecutionDeepLinkRef.current = null;
    void loadPaperExecutionDeepLink(deepLink);
  }, [loadPaperExecutionDeepLink]);

  const replayRun = useCallback(
    async (run: ResearchRunAudit): Promise<boolean> => {
      const replayVersion = manualSelectionVersionRef.current + 1;
      manualSelectionVersionRef.current = replayVersion;
      const replayWorkflowRunId = workflowRunIdRef.current + 1;
      workflowRunIdRef.current = replayWorkflowRunId;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      const detail = await loadResearchRunDetail(quantCoreBaseUrl, run.runId);
      if (!replayRunRequestIsCurrent(
        replayVersion,
        manualSelectionVersionRef.current,
        replayWorkflowRunId,
        workflowRunIdRef.current
      )) {
        return false;
      }
      const auditedRun = detail.run ?? run;
      const auditedKlines = marketKlinesFromResearchRunAudit(auditedRun);
      setWorkspaceState((current) => ({
        workspace: workspaceFromResearchRunAudit(current.workspace, auditedRun),
        source: "core",
        statusLabel: detail.source === "core" ? "Audit detail loaded" : "Audit replay loaded"
      }));
      if (auditedKlines) {
        setKlinesState(auditedKlines);
      }
      setIsLoadingAiReviewHistory(true);
      const [paperHistory, promotionHistory, aiReviewHistory] = await Promise.all([
        loadLatestResearchRunPaperExecution(quantCoreBaseUrl, auditedRun.runId),
        loadResearchRunPromotion(quantCoreBaseUrl, auditedRun.runId),
        refreshAiReviewRunHistory(auditedRun.runId, { commit: false, offset: 0, query: "" })
      ]);
      if (!replayRunRequestIsCurrent(
        replayVersion,
        manualSelectionVersionRef.current,
        replayWorkflowRunId,
        workflowRunIdRef.current
      )) {
        setIsLoadingAiReviewHistory(false);
        return false;
      }
      setPaperExecutionRecord(paperHistory.execution ?? null);
      setPromotionCandidateRecord(promotionHistory.promotion ?? null);
      setAiReviewRunRecords(aiReviewHistory.aiReviews);
      setAiReviewHistoryPagination(aiReviewHistory.pagination ?? null);
      setIsLoadingAiReviewHistory(false);
      if (paperHistory.execution) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution history loaded",
          error: undefined
        }));
      } else if (aiReviewHistory.aiReviews.length) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "AI review records loaded",
          error: undefined
        }));
      }
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkflowRunState(buildAuditReplayWorkflowState(auditedRun));
      return true;
    },
    [refreshAiReviewRunHistory, resetAiReviewHistoryState]
  );

  const replayImportRollbackRun = useCallback(
    async (runId: string) => {
      const historyRun = runHistory.find((run) => run.runId === runId);
      if (historyRun) {
        await replayRun(historyRun);
        return;
      }
      const detail = await loadResearchRunDetail(quantCoreBaseUrl, runId);
      if (detail.run) {
        await replayRun(detail.run);
        return;
      }
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Import rollback replay failed",
        error: detail.error ?? `Rollback target ${runId} was not found`
      }));
    },
    [replayRun, runHistory]
  );

  const ensureGoldenPathLatestRunBound = useCallback(async (latestRunIdOverride?: string | null): Promise<boolean> => {
    if (strategyDraftRequiresReaudit) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Strategy draft requires audit",
        error: "Run Pipeline to audit the current strategy draft before paper execution."
      }));
      return false;
    }
    if (researchRunContextBinding.canUseRun) {
      return true;
    }
    const latestRunId = latestRunIdOverride ?? goldenPath?.latestRunId;
    if (!latestRunId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Golden Path audit run not loaded",
        error: "Golden Path did not return a latest audited run id for paper execution."
      }));
      return false;
    }

    const capturedWorkspace = strategyExperimentWorkspaceRef.current;
    const capturedSelectionVersion = manualSelectionVersionRef.current;
    const capturedWorkflowRunId = workflowRunIdRef.current;
    const rebindIsCurrent = () => goldenPathRunRebindIsCurrent(
      capturedWorkspace,
      strategyExperimentWorkspaceRef.current,
      capturedSelectionVersion,
      manualSelectionVersionRef.current,
      capturedWorkflowRunId,
      workflowRunIdRef.current
    );

    const historyRun = runHistory.find((run) => run.runId === latestRunId);
    if (historyRun) {
      if (!rebindIsCurrent()) {
        return false;
      }
      const rebound = await replayRun(historyRun);
      if (!rebound) {
        return false;
      }
      setActiveWorkAreaId("execution");
      setActiveLoopStepId("paper");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Golden Path audit run loaded for paper execution",
        error: undefined
      }));
      return true;
    }

    const detail = await loadResearchRunDetail(quantCoreBaseUrl, latestRunId);
    if (!rebindIsCurrent()) {
      return false;
    }
    if (detail.run) {
      const rebound = await replayRun(detail.run);
      if (!rebound) {
        return false;
      }
      setActiveWorkAreaId("execution");
      setActiveLoopStepId("paper");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Golden Path audit run loaded for paper execution",
        error: undefined
      }));
      return true;
    }

    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Golden Path audit run replay failed",
      error: detail.error ?? `Golden Path latest run ${latestRunId} was not found`
    }));
    return false;
  }, [
    goldenPath?.latestRunId,
    quantCoreBaseUrl,
    replayRun,
    researchRunContextBinding.canUseRun,
    runHistory,
    strategyDraftRequiresReaudit
  ]);

  const undoResearchRunImportEvent = useCallback(
    async (undoToken: string, expectedRunId: string) => {
      const eventToUndo = researchRunImportAuditEvents.find(
        (event) => event.stage === "confirmed" && event.undoToken === undoToken
      );
      const persistUndoAuditEvent = (event: ResearchRunImportAuditEvent) => {
        setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, event));
        void saveAuditEvent(quantCoreBaseUrl, researchRunImportAuditEventToAuditEventRecord(event)).then((saved) => {
          if (saved.source !== "core" || !saved.event) {
            return;
          }
          const savedEvent = auditEventRecordToResearchRunImportEvent(saved.event);
          if (savedEvent) {
            setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, savedEvent));
          }
        });
      };
      const result = await undoResearchRunImport(quantCoreBaseUrl, undoToken, expectedRunId);
      if (result.source === "fallback" || !result.undo) {
        if (eventToUndo) {
          persistUndoAuditEvent(
            buildResearchRunImportUndoFailureAuditEvent({
              error: result.error ?? "Research run import undo failed",
              event: eventToUndo
            })
          );
        }
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run import undo failed",
          error: result.error ?? "Research run import undo failed"
        }));
        return;
      }
      if (eventToUndo) {
        const undoneEvent = buildResearchRunImportUndoAuditEvent({ event: eventToUndo });
        persistUndoAuditEvent(undoneEvent);
      }
      if (result.run) {
        await replayRun(result.run);
      } else {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run import undone",
          error: undefined
        }));
        setActiveWorkAreaId("audit");
      }
      await refreshRunHistory();
    },
    [quantCoreBaseUrl, refreshRunHistory, replayRun, researchRunImportAuditEvents]
  );

  const persistAuditEvidenceReportEvent = useCallback(
    (auditReport: ResearchRunExportAuditReport | undefined) => {
      if (!auditReport) {
        return;
      }
      void saveAuditEvent(quantCoreBaseUrl, buildAuditEvidenceReportAuditEvent(auditReport, auditEvidenceSummary)).then((result) => {
        if (result.source === "core" && result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          return;
        }
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit evidence report ledger save failed",
          error: result.error ?? "Audit evidence report ledger save failed"
        }));
      });
    },
    [auditEvidenceSummary, quantCoreBaseUrl]
  );

  const exportRun = useCallback(async (run: ResearchRunAudit) => {
    const result = await loadResearchRunExport(quantCoreBaseUrl, run.runId);
    if (result.source === "fallback" || !result.exportPackage) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run export failed",
        error: result.error ?? "Research run export failed"
      }));
      return;
    }

    const fileName = `${run.runId}-research-export.json`;
    const exportPackage = await withResearchRunExportAuditEvidenceArtifacts(
      result.exportPackage,
      auditEvidenceSummary,
      undefined,
      runHistory,
      visibleStrategyExperimentActive
    );
    const reportHistory = await loadAuditEvents(quantCoreBaseUrl, {
      eventType: "audit_evidence_report,backtest_report",
      runId: run.runId,
      limit: 50
    });
    const signedExportPackage =
      reportHistory.source === "core"
        ? withResearchRunExportReportSignatures(exportPackage, reportHistory.events)
        : exportPackage;
    persistAuditEvidenceReportEvent(exportPackage.auditReport);
    const objectUrl = URL.createObjectURL(
      new Blob([JSON.stringify(signedExportPackage, null, 2)], { type: "application/json;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Research run export ready",
      error: undefined
    }));
  }, [...[auditEvidenceSummary, persistAuditEvidenceReportEvent, quantCoreBaseUrl, runHistory], visibleStrategyExperimentActive]);

  const inspectRunExportPackageByRunId = useCallback(async (runId: string): Promise<ResearchRunExportPackageInspectionResult> => {
    const requestCoordinator = exportPackageRequestCoordinatorRef.current;
    const inspectionRequestId = requestCoordinator.begin();
    setIsInspectingExportPackage(true);
    setPendingImportPackage(null);
    setInspectedExportPackage(null);
    setInspectedExportArchiveSnapshot(null);
    try {
      const result = await loadResearchRunExport(quantCoreBaseUrl, runId);
      if (!requestCoordinator.isCurrent(inspectionRequestId)) {
        return { ok: false, error: "Research run export inspect superseded" };
      }
      if (result.source === "fallback" || !result.exportPackage) {
        const errorMessage = result.error ?? `Research run export inspect failed for ${runId}`;
        setInspectedExportPackage(null);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run export inspect failed",
          error: errorMessage
        }));
        return { ok: false, error: errorMessage };
      }

      const aiReviewArchiveSnapshot = await loadAiReviewArchiveImportSnapshot(
        quantCoreBaseUrl,
        result.exportPackage
      );
      await verifyStage5SandboxReadinessDecisionHashes(result.exportPackage);
      if (!requestCoordinator.isCurrent(inspectionRequestId)) {
        return { ok: false, error: "Research run export inspect superseded" };
      }

      setPendingImportPackage(null);
      setInspectedExportPackage(result.exportPackage);
      setInspectedExportArchiveSnapshot({
        aiReviewArchiveSnapshot,
        exportPackage: result.exportPackage,
        runId
      });
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run export package loaded",
        error: undefined
      }));
      setActiveWorkAreaId("audit");
      return { ok: true };
    } finally {
      if (requestCoordinator.isCurrent(inspectionRequestId)) {
        setIsInspectingExportPackage(false);
      }
    }
  }, [quantCoreBaseUrl]);

  const copyResearchRunImportAuditEvidenceAnchor = useCallback(async (event: ResearchRunImportAuditEvent) => {
    const anchor = buildResearchRunImportAuditEvidenceUrl(event);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(anchor);
      setCopiedImportAuditEvidenceEventId(event.id);
      if (importAuditCopyResetTimerRef.current !== null) {
        window.clearTimeout(importAuditCopyResetTimerRef.current);
      }
      importAuditCopyResetTimerRef.current = window.setTimeout(() => {
        setCopiedImportAuditEvidenceEventId(null);
        importAuditCopyResetTimerRef.current = null;
      }, 1800);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence anchor copied",
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence anchor copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, []);

  const copyAuditEvidenceSummary = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(auditEvidenceSummary.copyText);
      setCopiedAuditEvidenceSummary(true);
      if (auditEvidenceSummaryCopyResetTimerRef.current !== null) {
        window.clearTimeout(auditEvidenceSummaryCopyResetTimerRef.current);
      }
      auditEvidenceSummaryCopyResetTimerRef.current = window.setTimeout(() => {
        setCopiedAuditEvidenceSummary(false);
        auditEvidenceSummaryCopyResetTimerRef.current = null;
      }, 1800);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence summary copied",
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence summary copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [auditEvidenceSummary.copyText]);

  const copyAuditEvidenceReport = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(buildAuditEvidenceReportMarkdown(auditEvidenceSummary));
      setCopiedAuditEvidenceReport(true);
      if (auditEvidenceReportCopyResetTimerRef.current !== null) {
        window.clearTimeout(auditEvidenceReportCopyResetTimerRef.current);
      }
      auditEvidenceReportCopyResetTimerRef.current = window.setTimeout(() => {
        setCopiedAuditEvidenceReport(false);
        auditEvidenceReportCopyResetTimerRef.current = null;
      }, 1800);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence report copied",
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence report copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [auditEvidenceSummary]);

  const copyOperatorRunbook = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(buildOperatorRunbookMarkdown(operatorRunbookSummary));
      setCopiedOperatorRunbook(true);
      if (operatorRunbookCopyResetTimerRef.current !== null) {
        window.clearTimeout(operatorRunbookCopyResetTimerRef.current);
      }
      operatorRunbookCopyResetTimerRef.current = window.setTimeout(() => {
        setCopiedOperatorRunbook(false);
        operatorRunbookCopyResetTimerRef.current = null;
      }, 1800);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook copied",
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [operatorRunbookSummary]);

  const downloadOperatorRunbook = useCallback(() => {
    let objectUrl: string | null = null;
    try {
      const markdown = buildOperatorRunbookMarkdown(operatorRunbookSummary);
      objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      const safeAdapterId = operatorRunbookSummary.adapterId.replace(/[^a-z0-9._-]+/giu, "-");
      const safeContext = operatorRunbookSummary.contextLabel.replace(/[^a-z0-9._-]+/giu, "-");
      anchor.href = objectUrl;
      anchor.download = `${safeAdapterId}-${safeContext}-operator-runbook.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook download ready",
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook download failed",
        error: downloadError instanceof Error ? downloadError.message : "Runbook download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [operatorRunbookSummary]);

  const recordOperatorRunbook = useCallback(async () => {
    setIsRecordingOperatorRunbook(true);
    try {
      const markdown = buildOperatorRunbookMarkdown(operatorRunbookSummary);
      const auditEvent = await buildOperatorRunbookAuditEvent({
        markdown,
        runbook: operatorRunbookSummary,
        workspace
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source !== "core" || !result.event) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Operator runbook audit failed",
          error: result.error ?? "Audit ledger unavailable"
        }));
        return;
      }
      setAuditEvidenceReportEvents((current) =>
        mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
      );
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Operator runbook audited · ${result.event!.eventId}`,
        error: undefined
      }));
    } catch (recordError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook audit failed",
        error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
      }));
    } finally {
      setIsRecordingOperatorRunbook(false);
    }
  }, [operatorRunbookSummary, quantCoreBaseUrl, workspace]);

  const copyExecutionAdapterPreLiveRunbook = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(buildExecutionAdapterPreLiveRunbookMarkdown(executionAdapterPreLiveRunbook));
      setCopiedPreLiveRunbook(true);
      if (preLiveRunbookCopyResetTimerRef.current !== null) {
        window.clearTimeout(preLiveRunbookCopyResetTimerRef.current);
      }
      preLiveRunbookCopyResetTimerRef.current = window.setTimeout(() => {
        setCopiedPreLiveRunbook(false);
        preLiveRunbookCopyResetTimerRef.current = null;
      }, 1800);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook copied",
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [executionAdapterPreLiveRunbook]);

  const downloadExecutionAdapterPreLiveRunbook = useCallback(() => {
    let objectUrl: string | null = null;
    try {
      const markdown = buildExecutionAdapterPreLiveRunbookMarkdown(executionAdapterPreLiveRunbook);
      objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      const safeAdapterId = executionAdapterPreLiveRunbook.adapterId.replace(/[^a-z0-9._-]+/giu, "-");
      anchor.href = objectUrl;
      anchor.download = `${safeAdapterId}-${executionAdapterPreLiveRunbook.market}-pre-live-runbook.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook download ready",
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook download failed",
        error: downloadError instanceof Error ? downloadError.message : "Runbook download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [executionAdapterPreLiveRunbook]);

  const recordExecutionAdapterPreLiveRunbook = useCallback(async () => {
    setIsRecordingPreLiveRunbook(true);
    try {
      const markdown = buildExecutionAdapterPreLiveRunbookMarkdown(executionAdapterPreLiveRunbook);
      const auditEvent = await buildExecutionAdapterPreLiveRunbookAuditEvent({
        markdown,
        runbook: executionAdapterPreLiveRunbook,
        workspace
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source !== "core" || !result.event) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook audit failed",
          error: result.error ?? "Audit ledger unavailable"
        }));
        return;
      }
      setAuditEvidenceReportEvents((current) =>
        mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
      );
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Pre-live runbook audited · ${result.event!.eventId}`,
        error: undefined
      }));
    } catch (recordError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook audit failed",
        error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
      }));
    } finally {
      setIsRecordingPreLiveRunbook(false);
    }
  }, [executionAdapterPreLiveRunbook, quantCoreBaseUrl, workspace]);

  const copyResearchContextLink = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(
        buildResearchContextDeepLink(window.location.href, workspace, activeWorkAreaId === "market" ? "market" : "research", {
          watchlistRefreshRunId:
            researchPipelinePreflight.lockedPreparationEvidence?.runId ?? selectedWatchlistCacheRefreshRunId
        })
      );
      setCopiedResearchContextLink(true);
      if (researchContextLinkCopyResetTimerRef.current !== null) {
        window.clearTimeout(researchContextLinkCopyResetTimerRef.current);
      }
      researchContextLinkCopyResetTimerRef.current = window.setTimeout(() => {
        setCopiedResearchContextLink(false);
        researchContextLinkCopyResetTimerRef.current = null;
      }, 1800);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research context link copied",
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research context link copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [activeWorkAreaId, researchPipelinePreflight.lockedPreparationEvidence?.runId, selectedWatchlistCacheRefreshRunId, workspace]);

  const buildCurrentResearchContextReadinessReport = useCallback(async () => {
    const generatedAt = new Date().toISOString();
    return buildResearchContextReadinessReportArchive({
      contextLink: buildResearchContextDeepLink(window.location.href, workspace, activeWorkAreaId === "market" ? "market" : "research", {
        watchlistRefreshRunId:
          researchPipelinePreflight.lockedPreparationEvidence?.runId ?? selectedWatchlistCacheRefreshRunId
      }),
      evidenceRows: researchContextEvidenceRows,
      generatedAt,
      preflight: researchPipelinePreflight,
      rows: researchContextReadinessRows,
      workspace
    });
  }, [
    activeWorkAreaId,
    researchContextEvidenceRows,
    researchContextReadinessRows,
    researchPipelinePreflight,
    selectedWatchlistCacheRefreshRunId,
    workspace
  ]);

  const copyResearchContextReadinessReport = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      const report = await buildCurrentResearchContextReadinessReport();
      await navigator.clipboard.writeText(report.contentMarkdown);
      setCopiedResearchContextReadinessReport(true);
      if (researchContextReadinessReportCopyResetTimerRef.current !== null) {
        window.clearTimeout(researchContextReadinessReportCopyResetTimerRef.current);
      }
      researchContextReadinessReportCopyResetTimerRef.current = window.setTimeout(() => {
        setCopiedResearchContextReadinessReport(false);
        researchContextReadinessReportCopyResetTimerRef.current = null;
      }, 1800);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Research context readiness report copied · sha256 ${report.contentSha256.hash.slice(0, 12)}`,
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research context readiness report copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [buildCurrentResearchContextReadinessReport]);

  const downloadResearchContextReadinessReport = useCallback(async () => {
    let objectUrl: string | null = null;
    try {
      const report = await buildCurrentResearchContextReadinessReport();
      objectUrl = URL.createObjectURL(new Blob([report.contentMarkdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = report.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Research context readiness report download ready · sha256 ${report.contentSha256.hash.slice(0, 12)}`,
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research context readiness report download failed",
        error: downloadError instanceof Error ? downloadError.message : "Report download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [buildCurrentResearchContextReadinessReport, quantCoreBaseUrl]);

  const recordResearchContextReadinessReport = useCallback(async () => {
    try {
      const report = await buildCurrentResearchContextReadinessReport();
      const result = await saveAuditEvent(quantCoreBaseUrl, buildResearchContextReadinessReportAuditEvent(report));
      if (result.source !== "core" || !result.event) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context readiness report audit failed",
          error: result.error ?? "Audit ledger unavailable"
        }));
        return;
      }
      setAuditEvidenceReportEvents((current) =>
        mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
      );
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Research context readiness report audited · sha256 ${report.contentSha256.hash.slice(0, 12)}`,
        error: undefined
      }));
    } catch (recordError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research context readiness report audit failed",
        error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
      }));
    }
  }, [buildCurrentResearchContextReadinessReport]);

  const downloadAuditEvidenceReport = useCallback(async () => {
    try {
      const auditReport = await buildResearchRunExportAuditReport(auditEvidenceSummary);
      persistAuditEvidenceReportEvent(auditReport);
      const objectUrl = URL.createObjectURL(
        new Blob([auditReport.contentMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = auditReport.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence report download ready",
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit evidence report download failed",
        error: downloadError instanceof Error ? downloadError.message : "Audit evidence report download failed"
      }));
    }
  }, [auditEvidenceSummary, persistAuditEvidenceReportEvent]);

  const inspectRunExportPackage = useCallback(
    async (run: ResearchRunAudit) => {
      setResearchRunExportBrowserQuery("");
      setResearchRunImportDiffQuery("");
      await inspectRunExportPackageByRunId(run.runId);
    },
    [inspectRunExportPackageByRunId]
  );

  const inspectResearchRunImportAuditEvent = useCallback(
    async (event: ResearchRunImportAuditEvent) => {
      const focusQuery = researchRunImportAuditEvidenceQuery(event);
      setResearchRunExportBrowserQuery(focusQuery);
      setResearchRunImportDiffQuery(focusQuery);
      await inspectRunExportPackageByRunId(event.runId);
    },
    [inspectRunExportPackageByRunId]
  );

  const loadImportAuditEvidenceDeepLink = useCallback(
    async (deepLink: InitialImportAuditEvidenceDeepLink) => {
      setImportAuditEvidenceDeepLinkStatus({ ...deepLink, status: "loading", error: null });
      setResearchRunExportBrowserQuery(deepLink.focusQuery);
      setResearchRunImportDiffQuery(deepLink.focusQuery);
      const inspection = await inspectRunExportPackageByRunId(deepLink.runId);
      setImportAuditEvidenceDeepLinkStatus({
        ...deepLink,
        status: inspection.ok ? "loaded" : "failed",
        error: inspection.error ?? null
      });
    },
    [inspectRunExportPackageByRunId]
  );

  useEffect(() => {
    const deepLink = initialImportAuditEvidenceDeepLinkRef.current;
    if (!deepLink || activeWorkAreaId !== "audit") {
      return;
    }
    initialImportAuditEvidenceDeepLinkRef.current = null;
    void loadImportAuditEvidenceDeepLink(deepLink);
  }, [activeWorkAreaId, loadImportAuditEvidenceDeepLink]);

  const retryImportAuditEvidenceDeepLink = useCallback(() => {
    if (!importAuditEvidenceDeepLinkStatus) {
      return;
    }
    void loadImportAuditEvidenceDeepLink({
      auditEventId: importAuditEvidenceDeepLinkStatus.auditEventId,
      exportPath: importAuditEvidenceDeepLinkStatus.exportPath,
      focusQuery: importAuditEvidenceDeepLinkStatus.focusQuery,
      runId: importAuditEvidenceDeepLinkStatus.runId
    });
  }, [importAuditEvidenceDeepLinkStatus, loadImportAuditEvidenceDeepLink]);

  const indexRecentRunExportPackages = useCallback(async () => {
    if (!runHistory.length) {
      setIndexedExportPackages([]);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run export index empty",
        error: undefined
      }));
      return;
    }

    setIsIndexingExportPackages(true);
    try {
      const results = await Promise.all(runHistory.map((run) => loadResearchRunExport(quantCoreBaseUrl, run.runId)));
      const exportPackages = results
        .map((result) => (result.source === "core" ? result.exportPackage : null))
        .filter((exportPackage): exportPackage is ResearchRunExportPackage => Boolean(exportPackage));
      const failedCount = results.length - exportPackages.length;
      setIndexedExportPackages(exportPackages);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: failedCount ? "Research run export index partial" : "Research run export index loaded",
        error: failedCount ? `${failedCount} recent export package(s) failed to load.` : undefined
      }));
    } finally {
      setIsIndexingExportPackages(false);
    }
  }, [runHistory]);

  const exportBacktestReportMarkdown = useCallback(() => {
    const markdown = visibleStrategyExperimentActive
      ? buildBacktestReportMarkdown(workspace, runHistory, visibleStrategyExperimentActive)
      : buildBacktestReportMarkdown(workspace, runHistory);
    const runId = workspace.researchRun?.runId;
    if (!markdown || !runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Backtest report export failed",
        error: "Run Pipeline before exporting an audited backtest report"
      }));
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${runId}-backtest-report.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Backtest report export ready",
      error: undefined
    }));
    void buildBacktestReportAuditEvent({
      experiment: visibleStrategyExperimentActive,
      markdown,
      runHistory,
      workspace
    }).then((backtestReportAuditEvent) => {
      if (!backtestReportAuditEvent) {
        return;
      }

      return saveAuditEvent(quantCoreBaseUrl, backtestReportAuditEvent).then((result) => {
        if (result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Backtest report exported and audited",
            error: undefined
          }));
          return;
        }

        if (result.error) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Backtest report export ready",
            error: `Audit ledger save failed: ${result.error}`
          }));
        }
      });
    });
  }, [runHistory, visibleStrategyExperimentActive, workspace]);

  const exportAiReviewMarkdown = useCallback(() => {
    const markdown = visibleStrategyExperimentActive
      ? buildAiReviewReportMarkdown(workspace, visibleStrategyExperimentActive)
      : buildAiReviewReportMarkdown(workspace);
    const runId = workspace.researchRun?.runId;
    if (!markdown || !runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "AI review export failed",
        error: "Run Pipeline before exporting an AI review report"
      }));
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${runId}-ai-review.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "AI review export ready",
      error: undefined
    }));
  }, [visibleStrategyExperimentActive, workspace]);

  const exportAiReviewRunRecord = useCallback(() => {
    const record = buildAiReviewRunRecord(workspace, visibleStrategyExperimentActive);
    const runId = workspace.researchRun?.runId;
    if (!record || !runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "AI review record export failed",
        error: "Run Pipeline before exporting an AI review run record"
      }));
      return;
    }

    const objectUrl = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], { type: "application/json;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${runId}-ai-review-record.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "AI review record export ready",
      error: undefined
    }));
  }, [visibleStrategyExperimentActive, workspace]);

  const saveCurrentAiReviewRunRecord = useCallback(async () => {
    const runId = workspace.researchRun?.runId;
    const record = buildAiReviewRunRecord(workspace, visibleStrategyExperimentActive);
    if (!runId || !record) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "AI review record save failed",
        error: "Run Pipeline before saving an AI review run record"
      }));
      return;
    }

    setIsSavingAiReviewRecord(true);
    const result = await saveAiReviewRunRecord(quantCoreBaseUrl, record);
    if (result.source === "fallback" || !result.aiReview) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "AI review record save failed",
        error: result.error ?? "AI review record save failed"
      }));
      setIsSavingAiReviewRecord(false);
      return;
    }

    setAiReviewRunRecords((current) => [
      result.aiReview!,
      ...current.filter((item) => item.aiReviewId !== result.aiReview!.aiReviewId)
    ]);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "AI review record saved",
      error: undefined
    }));
    setActiveWorkAreaId("ai-review");
    setActiveLoopStepId("agent-review");
    setActiveWorkflowStageId("agent");
    setIsSavingAiReviewRecord(false);
  }, [quantCoreBaseUrl, visibleStrategyExperimentActive, workspace]);

  const appendResearchRunImportAuditEvent = useCallback(
    (event: ResearchRunImportAuditEvent) => {
      setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, event));
      void saveAuditEvent(quantCoreBaseUrl, researchRunImportAuditEventToAuditEventRecord(event)).then((result) => {
        if (result.source !== "core" || !result.event) {
          return;
        }
        const savedEvent = auditEventRecordToResearchRunImportEvent(result.event);
        if (savedEvent) {
          setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, savedEvent));
        }
      });
    },
    [quantCoreBaseUrl]
  );

  const importRunExportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const requestCoordinator = exportPackageRequestCoordinatorRef.current;
      const requestId = requestCoordinator.begin();
      setIsInspectingExportPackage(false);
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = "";
      if (!file) {
        return;
      }
      const previousRunId = workspace.researchRun?.runId ?? null;

      try {
        const fileText = await file.text();
        if (!requestCoordinator.isCurrent(requestId)) {
          return;
        }
        const parsed = JSON.parse(fileText) as unknown;
        let exportPackage = normalizeResearchRunExportPackagePayload(parsed);
        if (!exportPackage) {
          if (!requestCoordinator.isCurrent(requestId)) {
            return;
          }
          appendResearchRunImportAuditEvent(
            buildResearchRunImportAuditEvent({
              error: "Invalid research run export contract",
              exportPackage: null,
              fileName: file.name,
              previousRunId,
              rows: [],
              stage: "failed"
            })
          );
          setPendingImportPackage(null);
          setInspectedExportPackage(null);
          setInspectedExportArchiveSnapshot(null);
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run import failed",
            error: "Invalid research run export contract"
          }));
          return;
        }
        exportPackage = await withVerifiedResearchRunExportPackageReportSignatures(quantCoreBaseUrl, exportPackage);
        await verifyStage5SandboxReadinessDecisionHashes(exportPackage);
        if (!requestCoordinator.isCurrent(requestId)) {
          return;
        }
        const aiReviewArchiveSnapshot = await loadAiReviewArchiveImportSnapshot(
          quantCoreBaseUrl,
          exportPackage
        );
        if (!requestCoordinator.isCurrent(requestId)) {
          return;
        }

        const previewRows = buildResearchRunImportDiffRows({
          aiReviewArchiveReadbackErrors: aiReviewArchiveSnapshot.readbackErrors,
          aiReviewDecisions: aiReviewArchiveSnapshot.aiReviewDecisions,
          aiReviewRecords: activeAiReviewRunRecords,
          authoritativeAiReviewRecords: aiReviewArchiveSnapshot.authoritativeAiReviewRecords,
          exportPackage,
          legacyAiReviewIds: aiReviewArchiveSnapshot.legacyAiReviewIds,
          paperExecution: activePaperExecutionRecord,
          workspace
        });
        const previewBlocked = previewRows.some((row) => row.status === "blocked");
        if (!requestCoordinator.isCurrent(requestId)) {
          return;
        }
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            exportPackage,
            fileName: file.name,
            previousRunId,
            rows: previewRows,
            stage: "preview"
          })
        );
        setPendingImportPackage({ aiReviewArchiveSnapshot, exportPackage, fileName: file.name });
        setInspectedExportPackage(exportPackage);
        setInspectedExportArchiveSnapshot(null);
        setActiveWorkAreaId("audit");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: previewBlocked ? "Research run import preview blocked" : "Research run import preview ready",
          error: undefined
        }));
      } catch (importError) {
        if (!requestCoordinator.isCurrent(requestId)) {
          return;
        }
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            error: importError instanceof Error ? importError.message : "Research run import failed",
            exportPackage: null,
            fileName: file.name,
            previousRunId,
            rows: [],
            stage: "failed"
          })
        );
        setPendingImportPackage(null);
        setInspectedExportPackage(null);
        setInspectedExportArchiveSnapshot(null);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run import failed",
          error: importError instanceof Error ? importError.message : "Research run import failed"
        }));
      }
    },
    [activeAiReviewRunRecords, activePaperExecutionRecord, appendResearchRunImportAuditEvent, workspace]
  );

  const confirmPendingImportPackage = useCallback(async () => {
    if (!pendingImportPackage) {
      return;
    }

    const importRows = buildResearchRunImportDiffRows({
      aiReviewArchiveReadbackErrors: pendingImportPackage.aiReviewArchiveSnapshot.readbackErrors,
      aiReviewDecisions: pendingImportPackage.aiReviewArchiveSnapshot.aiReviewDecisions,
      aiReviewRecords: activeAiReviewRunRecords,
      authoritativeAiReviewRecords: pendingImportPackage.aiReviewArchiveSnapshot.authoritativeAiReviewRecords,
      exportPackage: pendingImportPackage.exportPackage,
      legacyAiReviewIds: pendingImportPackage.aiReviewArchiveSnapshot.legacyAiReviewIds,
      paperExecution: activePaperExecutionRecord,
      workspace
    });
    const previousRunId = workspace.researchRun?.runId ?? null;
    if (importRows.some((row) => row.status === "blocked")) {
      appendResearchRunImportAuditEvent(
        buildResearchRunImportAuditEvent({
          exportPackage: pendingImportPackage.exportPackage,
          fileName: pendingImportPackage.fileName,
          previousRunId,
          rows: importRows,
          stage: "preview"
        })
      );
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run import preview blocked",
        error: "Research run import is blocked by unresolved package conflicts"
      }));
      return;
    }
    const importVersion = manualSelectionVersionRef.current + 1;
    manualSelectionVersionRef.current = importVersion;
    workflowRunIdRef.current += 1;
    setIsApplyingImportPackage(true);
    setIsRunning(false);
    setPaperExecutionRecord(null);
    setPromotionCandidateRecord(null);
    resetAiReviewHistoryState();

    try {
      const result = await importResearchRunExport(quantCoreBaseUrl, pendingImportPackage.exportPackage);
      if (manualSelectionVersionRef.current !== importVersion) {
        return;
      }
      if (result.source === "fallback" || !result.run) {
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            error: result.error ?? "Research run import failed",
            exportPackage: pendingImportPackage.exportPackage,
            fileName: pendingImportPackage.fileName,
            previousRunId,
            rows: importRows,
            stage: "failed"
          })
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run import failed",
          error: result.error ?? "Research run import failed"
        }));
        return;
      }
      const importedKlines = marketKlinesFromResearchRunAudit(result.run);
      appendResearchRunImportAuditEvent(
        buildResearchRunImportAuditEvent({
          exportPackage: pendingImportPackage.exportPackage,
          fileName: pendingImportPackage.fileName,
          previousRunId,
          rows: importRows,
          stage: "confirmed",
          undoToken: result.undoToken ?? result.undo?.undoToken ?? null
        })
      );
      setWorkspaceState((current) => ({
        workspace: workspaceFromResearchRunAudit(current.workspace, result.run as ResearchRunAudit),
        source: "core",
        statusLabel: "Research run import ready",
        error: undefined
      }));
      if (importedKlines) {
        setKlinesState(importedKlines);
      }
      if (result.note) {
        setResearchNoteState({
          note: result.note,
          source: "core"
        });
        updateResearchNoteDraft(result.note.body);
      } else if (result.run.researchNote?.body) {
        setResearchNoteState({
          note: result.run.researchNote,
          source: "core"
        });
        updateResearchNoteDraft(result.run.researchNote.body);
      }
      if (result.strategies?.length) {
        setStrategyLibraryState((current) => ({
          strategies: [
            ...result.strategies!,
            ...current.strategies.filter(
              (existing) => !result.strategies!.some((restored) => restored.revision === existing.revision)
            )
          ],
          source: "core",
          error: undefined
        }));
      }
      const [paperHistory, promotionHistory, aiReviewHistory, handoffHistory] = await Promise.all([
        loadLatestResearchRunPaperExecution(quantCoreBaseUrl, result.run.runId),
        loadResearchRunPromotion(quantCoreBaseUrl, result.run.runId),
        refreshAiReviewRunHistory(result.run.runId, { offset: 0, query: "" }),
        loadHandoffNotes(quantCoreBaseUrl, "research_run", result.run.runId)
      ]);
      if (manualSelectionVersionRef.current !== importVersion) {
        return;
      }
      setPendingImportPackage(null);
      setPaperExecutionRecord(paperHistory.execution ?? null);
      setPromotionCandidateRecord(promotionHistory.promotion ?? null);
      setAiReviewRunRecords(aiReviewHistory.aiReviews);
      setHandoffNotesState(handoffHistory);
      if (paperHistory.execution) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution history loaded",
          error: undefined
        }));
      } else if (aiReviewHistory.aiReviews.length) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "AI review records loaded",
          error: undefined
        }));
      }
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkflowRunState(buildAuditReplayWorkflowState(result.run));
      await refreshRunHistory();
    } catch (importError) {
      if (manualSelectionVersionRef.current !== importVersion) {
        return;
      }
      appendResearchRunImportAuditEvent(
        buildResearchRunImportAuditEvent({
          error: importError instanceof Error ? importError.message : "Research run import failed",
          exportPackage: pendingImportPackage.exportPackage,
          fileName: pendingImportPackage.fileName,
          previousRunId,
          rows: importRows,
          stage: "failed"
        })
      );
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run import failed",
        error: importError instanceof Error ? importError.message : "Research run import failed"
      }));
    } finally {
      if (manualSelectionVersionRef.current === importVersion) {
        setIsApplyingImportPackage(false);
      }
    }
  }, [
    activeAiReviewRunRecords,
    activePaperExecutionRecord,
    appendResearchRunImportAuditEvent,
    pendingImportPackage,
    refreshAiReviewRunHistory,
    refreshRunHistory,
    resetAiReviewHistoryState,
    updateResearchNoteDraft,
    workspace
  ]);

  const cancelPendingImportPackage = useCallback(() => {
    if (pendingImportPackage) {
      appendResearchRunImportAuditEvent(
        buildResearchRunImportAuditEvent({
          exportPackage: pendingImportPackage.exportPackage,
          fileName: pendingImportPackage.fileName,
          previousRunId: workspace.researchRun?.runId ?? null,
          rows: buildResearchRunImportDiffRows({
            aiReviewArchiveReadbackErrors: pendingImportPackage.aiReviewArchiveSnapshot.readbackErrors,
            aiReviewDecisions: pendingImportPackage.aiReviewArchiveSnapshot.aiReviewDecisions,
            aiReviewRecords: activeAiReviewRunRecords,
            authoritativeAiReviewRecords: pendingImportPackage.aiReviewArchiveSnapshot.authoritativeAiReviewRecords,
            exportPackage: pendingImportPackage.exportPackage,
            legacyAiReviewIds: pendingImportPackage.aiReviewArchiveSnapshot.legacyAiReviewIds,
            paperExecution: activePaperExecutionRecord,
            workspace
          }),
          stage: "cancelled"
        })
      );
    }
    setPendingImportPackage(null);
    setInspectedExportPackage(null);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Research run import preview cancelled",
      error: undefined
    }));
  }, [
    activeAiReviewRunRecords,
    activePaperExecutionRecord,
    appendResearchRunImportAuditEvent,
    pendingImportPackage,
    workspace
  ]);

  const updateAuditEvidenceReportQuery = useCallback((query: string) => {
    setAuditEvidenceReportQuery(query);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(query);
  }, []);

  const previousAuditEvidenceReportPage = useCallback(() => {
    setAuditEvidenceReportOffset((current) => Math.max(0, current - AUDIT_REPORT_EVENTS_PAGE_SIZE));
  }, []);

  const nextAuditEvidenceReportPage = useCallback(() => {
    setAuditEvidenceReportOffset((current) => {
      const total = auditEvidenceReportPagination?.total ?? 0;
      if (!total) {
        return current;
      }
      const next = current + AUDIT_REPORT_EVENTS_PAGE_SIZE;
      return next >= total ? current : next;
    });
  }, [auditEvidenceReportPagination?.total]);

  const updateMarketDataRefreshOverrideAuditQuery = useCallback((query: string) => {
    setMarketDataRefreshOverrideAuditQuery(query);
    setMarketDataRefreshOverrideAuditOffset(0);
  }, []);

  const previousMarketDataRefreshOverrideAuditPage = useCallback(() => {
    setMarketDataRefreshOverrideAuditOffset((current) =>
      Math.max(0, current - MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE)
    );
  }, []);

  const nextMarketDataRefreshOverrideAuditPage = useCallback(() => {
    setMarketDataRefreshOverrideAuditOffset((current) => {
      const total = marketDataRefreshOverrideAuditPagination?.total ?? 0;
      if (!total) {
        return current;
      }
      const next = current + MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE;
      return next >= total ? current : next;
    });
  }, [marketDataRefreshOverrideAuditPagination?.total]);

  const updatePortfolioPaperOrderAuditQuery = useCallback((query: string) => {
    setPortfolioPaperOrderAuditQuery(query);
    setPortfolioPaperOrderAuditOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(query);
  }, []);

  const previousPortfolioPaperOrderAuditPage = useCallback(() => {
    setPortfolioPaperOrderAuditOffset((current) =>
      Math.max(0, current - PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE)
    );
  }, []);

  const nextPortfolioPaperOrderAuditPage = useCallback(() => {
    setPortfolioPaperOrderAuditOffset((current) => {
      const total = portfolioPaperOrderAuditPagination?.total ?? 0;
      if (!total) {
        return current;
      }
      const next = current + PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE;
      return next >= total ? current : next;
    });
  }, [portfolioPaperOrderAuditPagination?.total]);

  const updateExecutionAdapterPaperExecutionAuditQuery = useCallback((query: string) => {
    setExecutionAdapterPaperExecutionAuditQuery(query);
    setExecutionAdapterPaperExecutionAuditOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(query);
  }, []);

  const previousExecutionAdapterPaperExecutionAuditPage = useCallback(() => {
    setExecutionAdapterPaperExecutionAuditOffset((current) =>
      Math.max(0, current - EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENTS_PAGE_SIZE)
    );
  }, []);

  const nextExecutionAdapterPaperExecutionAuditPage = useCallback(() => {
    setExecutionAdapterPaperExecutionAuditOffset((current) => {
      const total = executionAdapterPaperExecutionAuditPagination?.total ?? 0;
      if (!total) {
        return current;
      }
      const next = current + EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENTS_PAGE_SIZE;
      return next >= total ? current : next;
    });
  }, [executionAdapterPaperExecutionAuditPagination?.total]);

  const signAuditEvidenceReportEvent = useCallback(
    async (eventId: string) => {
      setSigningAuditReportEventId(eventId);
      const result = await signAuditReportEvent(quantCoreBaseUrl, eventId);
      if (result.event) {
        setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!));
      }
      if (result.error) {
        setWorkspaceState((current) => ({
          ...current,
          error: result.error,
          source: result.source,
          statusLabel: result.source === "core" ? "Audit report signature failed" : "Offline signature fallback"
        }));
      }
      setSigningAuditReportEventId(null);
    },
    []
  );

  const verifyAuditEvidenceReportEvent = useCallback(
    async (eventId: string) => {
      setVerifyingAuditReportEventId(eventId);
      const result = await verifyAuditReportEvent(quantCoreBaseUrl, eventId);
      if (result.event) {
        setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!));
      }
      if (result.error) {
        setWorkspaceState((current) => ({
          ...current,
          error: result.error,
          source: result.source,
          statusLabel: result.source === "core" ? "Audit report verification failed" : "Offline verification fallback"
        }));
      }
      setVerifyingAuditReportEventId(null);
    },
    []
  );

  const revokeAuditEvidenceReportEvent = useCallback(
    async (eventId: string) => {
      setRevokingAuditReportEventId(eventId);
      const result = await revokeAuditReportEvent(quantCoreBaseUrl, eventId, "manual audit revocation from Audit workspace");
      if (result.event) {
        setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!));
      }
      if (result.error) {
        setWorkspaceState((current) => ({
          ...current,
          error: result.error,
          source: result.source,
          statusLabel: result.source === "core" ? "Audit report revocation failed" : "Offline revocation fallback"
        }));
      }
      setRevokingAuditReportEventId(null);
    },
    []
  );

  const updateResearchRunImportAuditQuery = useCallback((query: string) => {
    setResearchRunImportAuditQuery(query);
    setResearchRunImportAuditOffset(0);
    setFocusedImportAuditEventId(null);
  }, []);

  const runEvidencePackageControlAction = useCallback(
    (row: EvidencePackageControlRoomRow) => {
      const focusQuery = row.focusQuery || row.exportPath || row.runId;
      setActiveWorkAreaId("audit");
      if (row.nextActionId === "open-import-audit") {
        updateResearchRunImportAuditQuery(focusQuery);
        setResearchRunExportBrowserQuery(row.exportPath || row.runId);
        setResearchRunImportDiffQuery(row.exportPath || row.runId);
      } else if (row.nextActionId === "inspect-package") {
        setResearchRunExportBrowserQuery(row.exportPath || row.runId);
        setResearchRunImportDiffQuery(row.exportPath || row.runId);
        updateAuditEvidenceReportQuery(row.runId);
      } else if (row.nextActionId === "open-acceptance") {
        updateAuditEvidenceReportQuery(`p0_acceptance_review ${row.runId}`);
      } else if (row.nextActionId === "open-signature-ledger") {
        updateAuditEvidenceReportQuery(focusQuery);
      } else {
        setResearchRunExportBrowserQuery(row.exportPath || row.runId);
        updateAuditEvidenceReportQuery(focusQuery);
      }
      setWorkspaceState((current) => ({
        ...current,
        error: undefined,
        statusLabel: `Evidence package focus · ${row.runId} · ${row.statusLabel}`
      }));
    },
    [updateAuditEvidenceReportQuery, updateResearchRunImportAuditQuery]
  );

  const previousResearchRunImportAuditPage = useCallback(() => {
    setResearchRunImportAuditOffset((current) => Math.max(0, current - IMPORT_AUDIT_EVENTS_PAGE_SIZE));
  }, []);

  const nextResearchRunImportAuditPage = useCallback(() => {
    setResearchRunImportAuditOffset((current) => {
      const total = researchRunImportAuditPagination?.total ?? 0;
      if (!total) {
        return current;
      }
      const next = current + IMPORT_AUDIT_EVENTS_PAGE_SIZE;
      return next >= total ? current : next;
    });
  }, [researchRunImportAuditPagination?.total]);

  const updateAiReviewHistoryQuery = useCallback((query: string) => {
    setAiReviewHistoryQuery(query);
    setAiReviewHistoryOffset(0);
  }, []);

  const previousAiReviewHistoryPage = useCallback(() => {
    setAiReviewHistoryOffset((current) => Math.max(0, current - AI_REVIEW_HISTORY_PAGE_SIZE));
  }, []);

  const nextAiReviewHistoryPage = useCallback(() => {
    setAiReviewHistoryOffset((current) => {
      const total = aiReviewHistoryPagination?.total ?? 0;
      if (!total) {
        return current;
      }
      const next = current + AI_REVIEW_HISTORY_PAGE_SIZE;
      return next >= total ? current : next;
    });
  }, [aiReviewHistoryPagination?.total]);

  const deferSettingsNavigation = useCallback((
    targetWorkAreaId: ProductWorkAreaId,
    navigationAction: () => void,
  ) => {
    if (
      activeWorkAreaId === "settings"
      && targetWorkAreaId !== activeWorkAreaId
      && hasUnsavedSettingsConfiguration
    ) {
      pendingSettingsNavigationActionRef.current = navigationAction;
      setPendingSettingsWorkAreaId(targetWorkAreaId);
      return true;
    }
    return false;
  }, [activeWorkAreaId, hasUnsavedSettingsConfiguration]);

  const selectInstrument = useCallback(
    (
      instrument: TerminalWorkspace["selectedInstrument"],
      targetWorkAreaId: ProductWorkAreaId = "research",
      addToWatchlist = true
    ) => {
      const applySelection = () => {
        const isExistingWatchlistInstrument = watchlistIncludesInstrument(workspace.watchlist, instrument);
        manualSelectionVersionRef.current += 1;
        workflowRunIdRef.current += 1;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        setPendingMarketAiSelectionResearchOrigin(null);
        resetAiReviewHistoryState();
        if (addToWatchlist) {
          setHasUnsavedWatchlistChanges((current) => current || !isExistingWatchlistInstrument);
        }
        setWorkspaceState((current) => {
          const selectedWorkspace = workspaceWithSelectedInstrument(current.workspace, instrument);
          return {
            workspace: addToWatchlist
              ? selectedWorkspace
              : {
                  ...selectedWorkspace,
                  watchlist: current.workspace.watchlist
                },
            source: "core",
            statusLabel: "Instrument selected"
          };
        });
        setActiveWorkAreaId(targetWorkAreaId);
        setActiveLoopStepId("research");
        setActiveWorkflowStageId("data");
        setWorkflowRunState(createWorkflowRunState());
      };
      if (deferSettingsNavigation(targetWorkAreaId, applySelection)) return;
      applySelection();
    },
    [deferSettingsNavigation, resetAiReviewHistoryState, workspace.watchlist]
  );

  const researchMarketAiSelectionCandidate = useCallback(
    (
      instrument: TerminalWorkspace["selectedInstrument"],
      origin: MarketAiSelectionResearchOrigin,
    ) => {
      selectInstrument(instrument, "research", false);
      setWorkspaceState((current) => ({
        workspace: workspaceWithSelectedTimeframe(current.workspace, "1d"),
        source: "core",
        statusLabel: "AI 选股候选已选择，等待运行研究并核验证据",
      }));
      setPendingMarketAiSelectionResearchOrigin({
        ...origin,
        market: instrument.market,
        symbol: instrument.symbol,
      });
    },
    [selectInstrument],
  );

  const selectWatchlistCacheRefreshItem = useCallback(
    (row: WatchlistCacheRefreshItemRow) => {
      const existingInstrument =
        workspace.watchlist.find((instrument) => instrument.market === row.market && instrument.symbol === row.symbol) ??
        row.instrument;
      const isExistingWatchlistInstrument = watchlistIncludesInstrument(workspace.watchlist, existingInstrument);
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      setPendingMarketAiSelectionResearchOrigin(null);
      resetAiReviewHistoryState();
      setHasUnsavedWatchlistChanges((current) => current || !isExistingWatchlistInstrument);
      setWorkspaceState((current) => {
        const instrumentWorkspace = workspaceWithSelectedInstrument(current.workspace, existingInstrument);
        const timeframeWorkspace =
          instrumentWorkspace.selectedTimeframe === row.timeframe
            ? instrumentWorkspace
            : workspaceWithSelectedTimeframe(instrumentWorkspace, row.timeframe);
        return {
          workspace: timeframeWorkspace,
          source: "core",
          statusLabel: "Refresh item selected"
        };
      });
      setActiveWorkAreaId("research");
      setActiveLoopStepId("research");
      setActiveWorkflowStageId("data");
      setWorkflowRunState(createWorkflowRunState());
    },
    [resetAiReviewHistoryState, workspace.watchlist]
  );

  const selectWatchlistCacheRefreshRun = useCallback((row: WatchlistCacheRefreshHistoryRow) => {
    setWatchlistCacheRefreshRunSelection(row.runId);
  }, [setWatchlistCacheRefreshRunSelection]);

  const selectTimeframe = useCallback(
    (timeframe: Timeframe, targetWorkAreaId: "market" | "research" = "research") => {
      const applySelection = () => {
        setSearchSuggestions([]);
        setIsSearchOpen(false);
        manualSelectionVersionRef.current += 1;
        workflowRunIdRef.current += 1;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        setPendingMarketAiSelectionResearchOrigin(null);
        resetAiReviewHistoryState();
        setWorkspaceState((current) => ({
          workspace: workspaceWithSelectedTimeframe(current.workspace, timeframe),
          source: "core",
          statusLabel: "Timeframe selected"
        }));
        setActiveWorkAreaId(targetWorkAreaId);
        setActiveLoopStepId("research");
        setActiveWorkflowStageId("data");
        setWorkflowRunState(createWorkflowRunState());
      };
      if (deferSettingsNavigation(targetWorkAreaId, applySelection)) return;
      applySelection();
    },
    [deferSettingsNavigation, resetAiReviewHistoryState]
  );

  const runAiWorkbenchAction = useCallback((action: AiWorkbenchAction) => {
    manualSelectionVersionRef.current += 1;
    const nextWorkspace = workspaceWithAiAction(workspace, action);
    const nextWorkflowState = buildAiActionWorkflowState(nextWorkspace, action);
    setWorkspaceState({
      workspace: nextWorkspace,
      source: "core",
      statusLabel: "AI action generated"
    });
    setActiveWorkAreaId("ai-review");
    setActiveLoopStepId("agent-review");
    setActiveWorkflowStageId(nextWorkflowState.activeStageId);
    setWorkflowRunState(nextWorkflowState);
  }, [workspace]);

  const updateStrategyRuleDraftField = useCallback((field: StrategyRuleDraftField, value: number | string | boolean) => {
    manualSelectionVersionRef.current += 1;
    setWorkspaceState((current) => ({
      workspace: workspaceWithStrategyRuleDraftField(current.workspace, field, value),
      source: "core",
      statusLabel: "Strategy rules edited"
    }));
    setActiveWorkAreaId("strategy");
    setActiveLoopStepId("strategy");
    setActiveWorkflowStageId("factor");
  }, []);

  const applyStrategyTemplate = useCallback((templateId: StrategyTemplateId) => {
    manualSelectionVersionRef.current += 1;
    setWorkspaceState((current) => ({
      workspace: workspaceWithStrategyTemplate(current.workspace, templateId),
      source: "core",
      statusLabel: "Strategy template applied"
    }));
    setActiveWorkAreaId("strategy");
    setActiveLoopStepId("strategy");
    setActiveWorkflowStageId("factor");
  }, []);

  const applyGeneratedStrategyDraft = useCallback((draft: StrategyRuleDraft, reasons: string[]) => {
    manualSelectionVersionRef.current += 1;
    setWorkspaceState((current) => ({
      workspace: workspaceWithAiStrategyDraft(current.workspace, draft, reasons),
      source: "core",
      statusLabel: "AI strategy draft applied"
    }));
    setStrategyValidationState(initialStrategyValidationState);
    setActiveWorkAreaId("strategy");
    setActiveLoopStepId("strategy");
    setActiveWorkflowStageId("factor");
  }, []);

  const saveCurrentStrategyVersion = useCallback(async () => {
    setIsSavingStrategy(true);
    const preflight = await validateStrategySnapshot(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      auditRunId: workspace.researchRun?.runId ?? null,
      strategy: workspace.strategy
    });
    setStrategyValidationState(preflight);
    if (preflight.validation?.status === "blocked") {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Strategy version blocked by readiness gates",
        error: "Strategy version blocked by readiness gates"
      }));
      setActiveWorkAreaId("strategy");
      setActiveLoopStepId("strategy");
      setActiveWorkflowStageId("factor");
      setIsSavingStrategy(false);
      return;
    }
    const result = await saveStrategySnapshot(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      auditRunId: workspace.researchRun?.runId ?? null,
      strategy: workspace.strategy
    });
    if (result.validation) {
      setStrategyValidationState({
        validation: result.validation,
        source: result.source,
        error: result.error
      });
    }
    if (result.strategy) {
      setStrategyLibraryState((current) => ({
        strategies: [result.strategy!, ...current.strategies.filter((item) => item.revision !== result.strategy!.revision)],
        source: "core",
        error: undefined
      }));
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Strategy version saved",
        error: undefined
      }));
    } else {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Strategy version save failed",
        error: result.error ?? "Strategy version save failed"
      }));
    }
    setIsSavingStrategy(false);
  }, [workspace.researchRun?.runId, workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe, workspace.strategy]);

  const bindStrategyToProduction = useCallback(async (
    strategy: ProductionStrategyBindingTarget | null,
    operator: string
  ) => {
    if (
      bindingStrategyRevision
      || (strategy && (strategy.status !== "audited" || !strategy.auditRunId))
    ) {
      return false;
    }
    if (!operator.trim()) {
      return false;
    }

    const targetRevision = strategy?.revision ?? "builtin";
    setBindingStrategyRevision(targetRevision);
    const result = await updateStrategyProductionBinding(quantCoreBaseUrl, {
      strategyRevision: strategy?.revision ?? null,
      auditRunId: strategy?.auditRunId ?? null,
      operator: operator.trim()
    });
    setBindingStrategyRevision(null);
    setStrategyProductionBindingState((current) =>
      result.binding ? result : { ...result, binding: current.binding }
    );
    if (!result.binding) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: locale === "zh-CN" ? "生产策略交接失败" : "Production strategy handoff failed",
        error: strategyProductionBindingErrorLabel(i18n, result.error)
      }));
      return false;
    }
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: locale === "zh-CN" ? "生产策略已交接，自动交易保持暂停" : "Production strategy bound; automated trading remains paused",
      error: undefined
    }));
    return true;
  }, [
    bindingStrategyRevision,
    i18n,
    locale
  ]);

  const deleteSavedStrategyVersion = useCallback(async (strategy: StrategyLibraryItem) => {
    const result = await deleteStrategyVersion(quantCoreBaseUrl, strategy.revision);
    if (!result.deleted) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Strategy version delete failed",
        error: result.error ?? "Strategy version delete failed"
      }));
      return false;
    }
    await refreshStrategyLibrary();
    setPendingStrategyGovernanceAction((current) => current?.revision === strategy.revision ? null : current);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Strategy version deleted",
      error: undefined
    }));
    return true;
  }, [refreshStrategyLibrary]);

  const saveCurrentResearchNote = useCallback(async () => {
    setIsSavingResearchNote(true);
    const result = await saveResearchNote(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe,
      body: researchNoteDraft
    });
    setResearchNoteState(result);
    if (result.note) {
      updateResearchNoteDraft(result.note.body);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research note saved",
        error: undefined
      }));
    } else {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research note save failed",
        error: result.error ?? "Research note save failed"
      }));
    }
    setIsSavingResearchNote(false);
  }, [
    researchNoteDraft,
    updateResearchNoteDraft,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const generateCurrentResearchNoteDraft = useCallback(async () => {
    const selectedProvider = researchNoteProviders.find(
      (provider) => provider.providerId === researchNoteProviderId
    );
    if (
      isGeneratingResearchNoteDraft
      || !selectedProvider?.configured
      || (researchNoteProviderId !== "local" && !researchNoteExternalDataApproved)
    ) {
      return;
    }
    const requestId = researchNoteDraftGenerationRequestIdRef.current + 1;
    researchNoteDraftGenerationRequestIdRef.current = requestId;
    researchNoteDraftGenerationAbortControllerRef.current?.abort();
    const controller = new AbortController();
    researchNoteDraftGenerationAbortControllerRef.current = controller;
    const context = {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    };
    const draftVersionBeforeRequest = researchNoteDraftVersionRef.current;
    const streamIdentity = {
      requestId,
      draftVersion: draftVersionBeforeRequest,
      ...context
    };
    const draftBeforeRequest = researchNoteDraftRef.current;
    const draftWasEmptyBeforeRequest = draftBeforeRequest.trim().length === 0;
    const externalDataApprovedForRequest = researchNoteExternalDataApproved;
    if (researchNoteProviderId !== "local") {
      setResearchNoteExternalDataApproved(false);
    }
    setIsGeneratingResearchNoteDraft(true);
    setResearchNoteGenerationError(null);
    setResearchNoteGenerationStatus("正在连接 AI，内容将直接写入编辑框，完成前不可保存。");
    const result = await generateResearchNoteDraft(
      quantCoreBaseUrl,
      {
        ...context,
        providerId: researchNoteProviderId,
        externalDataApproved: externalDataApprovedForRequest
      },
      undefined,
      {
        signal: controller.signal,
        onDraft: async (body, streamedResult) => {
          const latestWorkspace = workspaceRef.current;
          if (
            !isResearchNoteDraftStreamCurrent(
              streamIdentity,
              {
                requestId: researchNoteDraftGenerationRequestIdRef.current,
                draftVersion: researchNoteDraftVersionRef.current,
                market: latestWorkspace.selectedInstrument.market,
                symbol: latestWorkspace.selectedInstrument.symbol,
                timeframe: latestWorkspace.selectedTimeframe
              },
              controller.signal.aborted
            )
          ) {
            controller.abort();
            return;
          }
          if (
            streamedResult
            && (
              streamedResult.generation?.status === "failed"
              || streamedResult.generation?.fallbackUsed
            )
          ) {
            if (!draftWasEmptyBeforeRequest) {
              return;
            }
          }
          applyGeneratedResearchNoteDraft(body);
          setResearchNoteGenerationStatus(
            streamedResult
              ? "正在写入本地安全草稿，完成前不可保存。"
              : "AI 正在写入研究笔记，完成前不可保存。"
          );
          await waitForNextPaint();
        },
        onReset: async () => {
          const latestWorkspace = workspaceRef.current;
          if (
            !isResearchNoteDraftStreamCurrent(
              streamIdentity,
              {
                requestId: researchNoteDraftGenerationRequestIdRef.current,
                draftVersion: researchNoteDraftVersionRef.current,
                market: latestWorkspace.selectedInstrument.market,
                symbol: latestWorkspace.selectedInstrument.symbol,
                timeframe: latestWorkspace.selectedTimeframe
              },
              controller.signal.aborted
            )
          ) {
            controller.abort();
            return;
          }
          applyGeneratedResearchNoteDraft(draftBeforeRequest);
          setResearchNoteGenerationStatus("外部草稿未通过完整校验，正在切换安全本地草稿。");
          await waitForNextPaint();
        }
      }
    );
    if (researchNoteDraftGenerationRequestIdRef.current !== requestId) {
      return;
    }
    if (researchNoteDraftGenerationAbortControllerRef.current === controller) {
      researchNoteDraftGenerationAbortControllerRef.current = null;
    }
    setIsGeneratingResearchNoteDraft(false);
    const latestWorkspace = workspaceRef.current;
    if (
      !isResearchNoteDraftStreamCurrent(
        streamIdentity,
        {
          requestId: researchNoteDraftGenerationRequestIdRef.current,
          draftVersion: researchNoteDraftVersionRef.current,
          market: latestWorkspace.selectedInstrument.market,
          symbol: latestWorkspace.selectedInstrument.symbol,
          timeframe: latestWorkspace.selectedTimeframe
        },
        controller.signal.aborted
      )
    ) {
      setResearchNoteGenerationStatus("研究上下文或草稿已变化，本次生成结果未覆盖当前内容。");
      return;
    }
    if (result.source !== "core" || !result.draft || !result.generation) {
      applyGeneratedResearchNoteDraft(draftBeforeRequest);
      setResearchNoteGenerationError(
        result.error
          ? `草稿生成失败：${result.error}。原内容已保留。`
          : "草稿生成失败，原内容已保留。"
      );
      return;
    }
    if (result.generation.status === "failed" || result.generation.fallbackUsed) {
      if (draftWasEmptyBeforeRequest) {
        applyGeneratedResearchNoteDraft(result.draft.body);
        setResearchNoteGenerationStatus(
          result.generation.warning
            ?? "外部模型生成失败，已使用本地结构化草稿，尚未保存。"
        );
        return;
      }
      applyGeneratedResearchNoteDraft(draftBeforeRequest);
      setResearchNoteGenerationError(
        "外部模型生成失败，本次未替换当前草稿。请重新授权后重试，或切换到本地基线生成。"
      );
      return;
    }
    applyGeneratedResearchNoteDraft(result.draft.body);
    setResearchNoteGenerationStatus(
      result.generation.warning
        ?? (result.generation.status === "completed"
          ? "AI 草稿已生成，尚未保存。"
          : "本地结构化草稿已生成，尚未保存。")
    );
  }, [
    applyGeneratedResearchNoteDraft,
    isGeneratingResearchNoteDraft,
    researchNoteExternalDataApproved,
    researchNoteProviderId,
    researchNoteProviders,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const selectResearchNoteProvider = useCallback((providerId: AiReviewProviderId) => {
    const provider = researchNoteProviders.find((item) => item.providerId === providerId);
    if (!provider?.configured || isGeneratingResearchNoteDraft) {
      return;
    }
    researchNoteDraftGenerationRequestIdRef.current += 1;
    setResearchNoteProviderId(providerId);
    setResearchNoteExternalDataApproved(false);
    setResearchNoteGenerationError(null);
    setResearchNoteGenerationStatus(null);
  }, [isGeneratingResearchNoteDraft, researchNoteProviders]);

  const saveCurrentHandoffNote = useCallback(async () => {
    const runId = workspace.researchRun?.runId;
    if (!runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Handoff note needs a research run",
        error: "Run Pipeline before saving handoff notes."
      }));
      return;
    }
    setIsSavingHandoffNote(true);
    const result = await saveHandoffNote(quantCoreBaseUrl, {
      subjectType: "research_run",
      subjectId: runId,
      body: handoffNoteDraft,
      author: "local-operator",
      sourceWorkspace: activeWorkAreaId
    });
    if (result.source === "core") {
      const refreshed = await loadHandoffNotes(quantCoreBaseUrl, "research_run", runId);
      setHandoffNotesState(refreshed);
      setHandoffNoteDraft("");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Handoff note saved",
        error: undefined
      }));
    } else {
      setHandoffNotesState(result);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Handoff note save failed",
        error: result.error ?? "Handoff note save failed"
      }));
    }
    setIsSavingHandoffNote(false);
  }, [activeWorkAreaId, handoffNoteDraft, workspace.researchRun?.runId]);

  const saveCurrentWatchlist = useCallback(async () => {
    setIsSavingWatchlist(true);
    const result = await saveWatchlist(quantCoreBaseUrl, workspace.watchlist);
    setWorkspaceState((current) => ({
      workspace:
        result.source === "core"
          ? workspaceWithSavedWatchlist(current.workspace, result.watchlist)
          : current.workspace,
      source: result.source,
      statusLabel: result.source === "core" ? "Watchlist saved" : "Watchlist save failed",
      error: result.error
    }));
    if (result.source === "core") {
      setHasUnsavedWatchlistChanges(false);
    }
    setIsSavingWatchlist(false);
  }, [workspace.watchlist]);

  const removeWatchlistInstrument = useCallback(async (instrument: TerminalWorkspace["selectedInstrument"]) => {
    const nextWatchlist = workspace.watchlist.filter(
      (candidate) => candidate.market !== instrument.market || candidate.symbol !== instrument.symbol
    );
    if (!nextWatchlist.length || nextWatchlist.length === workspace.watchlist.length) {
      return;
    }
    const selectionVersionAtRequest = manualSelectionVersionRef.current;
    const selectedWasRemoved =
      workspace.selectedInstrument.market === instrument.market &&
      workspace.selectedInstrument.symbol === instrument.symbol;
    setIsSavingWatchlist(true);
    try {
      const result = await saveWatchlist(quantCoreBaseUrl, nextWatchlist);
      if (result.source !== "core" || !result.watchlist.length) {
        setWorkspaceState((current) => ({
          ...current,
          source: result.source,
          statusLabel: "Watchlist save failed",
          error: result.error ?? "Watchlist save failed"
        }));
        return;
      }
      const shouldSelectFallback =
        selectedWasRemoved && manualSelectionVersionRef.current === selectionVersionAtRequest;
      const selectionChangedDuringSave = manualSelectionVersionRef.current !== selectionVersionAtRequest;
      const latestWorkspace = workspaceRef.current;
      const concurrentAdditions = selectionChangedDuringSave
        ? latestWorkspace.watchlist.filter(
            (candidate) =>
              !watchlistIncludesInstrument(workspace.watchlist, candidate) ||
              (
                candidate.market === instrument.market &&
                candidate.symbol === instrument.symbol &&
                latestWorkspace.selectedInstrument.market === instrument.market &&
                latestWorkspace.selectedInstrument.symbol === instrument.symbol
              )
          )
        : [];
      if (shouldSelectFallback) {
        manualSelectionVersionRef.current += 1;
        workflowRunIdRef.current += 1;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        resetAiReviewHistoryState();
        setWorkflowRunState(createWorkflowRunState());
      }
      setWorkspaceState((current) => {
        const savedWatchlist = [
          ...concurrentAdditions,
          ...result.watchlist.filter((candidate) => !watchlistIncludesInstrument(concurrentAdditions, candidate))
        ].slice(0, 8);
        const savedWorkspace = { ...current.workspace, watchlist: savedWatchlist };
        return {
          workspace: shouldSelectFallback
            ? workspaceWithSelectedInstrument(savedWorkspace, savedWatchlist[0])
            : savedWorkspace,
          source: "core",
          statusLabel: "Watchlist saved",
          error: undefined
        };
      });
      setHasUnsavedWatchlistChanges(concurrentAdditions.length > 0);
    } finally {
      setIsSavingWatchlist(false);
    }
  }, [resetAiReviewHistoryState, workspace.selectedInstrument, workspace.watchlist]);

  const saveCurrentResearchWorkspace = useCallback(async () => {
    setIsSavingResearchWorkspace(true);
    const result = await saveResearchWorkspaceState(
      quantCoreBaseUrl,
      currentResearchWorkspaceStateDraft
    );
    setWorkspaceState((current) => ({
      workspace:
        result.source === "core" && result.state
          ? workspaceWithSavedResearchWorkspaceState(current.workspace, result.state)
          : current.workspace,
      source: result.source,
      statusLabel: result.source === "core" ? "Research workspace saved" : "Research workspace save failed",
      error: result.error
    }));
    setIsSavingResearchWorkspace(false);
  }, [currentResearchWorkspaceStateDraft]);

  const loadSavedStrategyVersion = useCallback((strategy: StrategyLibraryItem) => {
    manualSelectionVersionRef.current += 1;
    workflowRunIdRef.current += 1;
    setIsRunning(false);
    setPaperExecutionRecord(null);
    setPromotionCandidateRecord(null);
    resetAiReviewHistoryState();
    setWorkspaceState((current) => ({
      workspace: workspaceWithStrategyLibraryItem(current.workspace, strategy),
      source: "core",
      statusLabel: "Strategy version loaded"
    }));
    setActiveWorkAreaId("strategy");
    setActiveLoopStepId("strategy");
    setActiveWorkflowStageId("factor");
    setWorkflowRunState(createWorkflowRunState());
  }, [resetAiReviewHistoryState]);

  const runStrategyGovernanceAction = useCallback(
    (row: StrategyGovernanceQueueRow) => {
      if (row.nextActionId === "save-current-version") {
        void saveCurrentStrategyVersion();
        return;
      }
      const strategy = visibleStrategyLibrary.find((item) => item.revision === row.revision);
      if (!strategy) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Strategy governance action failed",
          error: i18n.locale === "zh-CN"
            ? `本地策略库中找不到修订版 ${row.revision}`
            : `Strategy revision ${row.revision} is not available in the local library`
        }));
        return;
      }
      setPendingStrategyGovernanceAction(row.nextActionId === "load-and-rerun" ? row : null);
      loadSavedStrategyVersion(strategy);
    },
    [i18n.locale, loadSavedStrategyVersion, saveCurrentStrategyVersion, visibleStrategyLibrary]
  );

  const updateBacktestAssumption = useCallback((field: BacktestAssumptionField, value: number) => {
    manualSelectionVersionRef.current += 1;
    setPaperExecutionRecord(null);
    setPromotionCandidateRecord(null);
    resetAiReviewHistoryState();
    setWorkspaceState((current) => ({
      workspace: workspaceWithBacktestAssumption(current.workspace, field, value),
      source: "core",
      statusLabel: "Backtest assumptions edited"
    }));
    setActiveWorkAreaId("backtest");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("backtest");
  }, []);

  const runStrategyExperiment = useCallback(async () => {
    const sourceRun = workspace.researchRun;
    const sourceKey = strategyExperimentUsableSourceKey;
    if (!sourceKey || !strategyExperimentSourceRunId || !strategyExperimentStrategyRevision || !sourceRun) {
      setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
      return null;
    }
    if (!isStrategyExperimentDraftValid(
      visibleStrategyExperimentDimensions,
      strategyExperimentGuardrails,
      strategyExperimentWalkForward
    )) {
      setStrategyExperimentError(i18n.t("strategyExperiment.invalidDraft"));
      return null;
    }
    const requestGeneration = beginStrategyExperimentRequest(sourceKey);
    if (requestGeneration === null) {
      return null;
    }
    try {
      const result = await createStrategyExperiment(quantCoreBaseUrl, {
        strategyRevision: strategyExperimentStrategyRevision,
        sourceRunId: strategyExperimentSourceRunId,
        assumptions: workspace.backtestAssumptions ?? defaultBacktestAssumptions,
        dimensions: visibleStrategyExperimentDimensions,
        guardrails: strategyExperimentGuardrails,
        walkForward: strategyExperimentWalkForward
      });
      if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        return null;
      }
      if (!result.experiment) {
        setStrategyExperimentError(
          strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
        );
        return null;
      }
      if (!strategyExperimentMatchesSourceKey(result.experiment, sourceKey)) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return null;
      }
      setStrategyExperimentActive(result.experiment);
      setStrategyExperimentError(null);
      await refreshStrategyExperiments(
        requestGeneration,
        sourceKey,
        strategyExperimentSourceRunId,
        strategyExperimentStrategyRevision
      );
      return result.experiment;
    } catch (runError) {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setStrategyExperimentError(strategyExperimentErrorMessage(
          strategyExperimentI18nRef.current,
          undefined,
          runError instanceof Error ? runError.message : undefined
        ));
      }
      return null;
    } finally {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setIsStrategyExperimentRunning(false);
      }
    }
  }, [
    beginStrategyExperimentRequest,
    i18n,
    refreshStrategyExperiments,
    strategyExperimentGuardrails,
    strategyExperimentRequestIsCurrent,
    strategyExperimentSourceRunId,
    strategyExperimentStrategyRevision,
    strategyExperimentUsableSourceKey,
    strategyExperimentWalkForward,
    visibleStrategyExperimentDimensions,
    workspace
  ]);

  const inspectStrategyExperiment = useCallback(async (experimentId: string) => {
    const sourceKey = strategyExperimentUsableSourceKey;
    if (!sourceKey) {
      setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
      return;
    }
    const requestGeneration = beginStrategyExperimentRequest(sourceKey);
    if (requestGeneration === null) {
      return;
    }
    try {
      const result = await loadStrategyExperimentDetail(quantCoreBaseUrl, experimentId);
      if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        return;
      }
      if (!result.experiment) {
        setStrategyExperimentError(
          strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
        );
        return;
      }
      if (!strategyExperimentMatchesSourceKey(result.experiment, sourceKey)) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return;
      }
      setStrategyExperimentActive(result.experiment);
      setStrategyExperimentError(null);
    } catch (inspectError) {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setStrategyExperimentError(strategyExperimentErrorMessage(
          strategyExperimentI18nRef.current,
          undefined,
          inspectError instanceof Error ? inspectError.message : undefined
        ));
      }
    } finally {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setIsStrategyExperimentRunning(false);
      }
    }
  }, [beginStrategyExperimentRequest, i18n, strategyExperimentRequestIsCurrent, strategyExperimentUsableSourceKey]);

  const replayStrategyExperiment = useCallback(async (experimentId: string) => {
    const sourceKey = strategyExperimentUsableSourceKey;
    if (!sourceKey || !strategyExperimentSourceRunId || !strategyExperimentStrategyRevision) {
      setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
      return;
    }
    const requestGeneration = beginStrategyExperimentRequest(sourceKey);
    if (requestGeneration === null) {
      return;
    }
    try {
      const result = await createStrategyExperiment(quantCoreBaseUrl, { replayOfExperimentId: experimentId });
      if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        return;
      }
      if (!result.experiment) {
        setStrategyExperimentError(
          strategyExperimentErrorMessage(strategyExperimentI18nRef.current, result.errorCode, result.error)
        );
        return;
      }
      if (!strategyExperimentMatchesSourceKey(result.experiment, sourceKey)) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return;
      }
      setStrategyExperimentActive(result.experiment);
      setStrategyExperimentError(null);
      await refreshStrategyExperiments(
        requestGeneration,
        sourceKey,
        strategyExperimentSourceRunId,
        strategyExperimentStrategyRevision
      );
    } catch (replayError) {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setStrategyExperimentError(strategyExperimentErrorMessage(
          strategyExperimentI18nRef.current,
          undefined,
          replayError instanceof Error ? replayError.message : undefined
        ));
      }
    } finally {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setIsStrategyExperimentRunning(false);
      }
    }
  }, [
    beginStrategyExperimentRequest,
    i18n,
    refreshStrategyExperiments,
    strategyExperimentRequestIsCurrent,
    strategyExperimentSourceRunId,
    strategyExperimentStrategyRevision,
    strategyExperimentUsableSourceKey
  ]);

  const exportStrategyExperimentJson = useCallback((experiment: StrategyExperimentDetail) => {
    const sourceKey = strategyExperimentSourceKeyRef.current;
    if (!sourceKey || !strategyExperimentMatchesSourceKey(experiment, sourceKey)) {
      setStrategyExperimentError(
        strategyExperimentI18nRef.current.t("strategyExperiment.persistedEvidenceRequired")
      );
      return;
    }
    let objectUrl: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    try {
      objectUrl = URL.createObjectURL(
        new Blob([JSON.stringify(experiment, null, 2)], { type: "application/json;charset=utf-8" })
      );
      anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${experiment.experimentId}-strategy-experiment.json`;
      document.body.appendChild(anchor);
      anchor.click();
      setStrategyExperimentError(null);
    } catch (exportError) {
      setStrategyExperimentError(strategyExperimentActionErrorMessage(
        strategyExperimentI18nRef.current,
        "strategyExperiment.exportFailed",
        exportError
      ));
    } finally {
      anchor?.remove();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, []);

  const loadStrategyExperimentCandidate = useCallback(async (candidateId: string) => {
    const sourceKey = strategyExperimentUsableSourceKey;
    const capturedActive = visibleStrategyExperimentActive;
    const capturedWorkspace = workspace;
    if (!sourceKey || !capturedActive || !strategyExperimentMatchesSourceKey(capturedActive, sourceKey)) {
      setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
      return;
    }
    const requestGeneration = beginStrategyExperimentRequest(sourceKey);
    if (requestGeneration === null) {
      return;
    }
    try {
      const nextWorkspace = await workspaceWithStrategyExperimentCandidate(
        capturedWorkspace,
        capturedActive,
        candidateId
      );
      if (!strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        return;
      }
      if (
        strategyExperimentWorkspaceRef.current !== capturedWorkspace ||
        strategyExperimentActiveRef.current !== capturedActive
      ) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return;
      }
      if (nextWorkspace === capturedWorkspace) {
        setStrategyExperimentError(i18n.t("strategyExperiment.persistedEvidenceRequired"));
        return;
      }
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      setWorkspaceState({
        workspace: nextWorkspace,
        source: "core",
        statusLabel: "Strategy experiment candidate loaded"
      });
      setActiveWorkAreaId("strategy");
      setActiveLoopStepId("strategy");
      setActiveWorkflowStageId("factor");
      setWorkflowRunState(createWorkflowRunState());
    } catch (candidateError) {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setStrategyExperimentError(strategyExperimentActionErrorMessage(
          strategyExperimentI18nRef.current,
          "strategyExperiment.candidateLoadFailed",
          candidateError
        ));
      }
    } finally {
      if (strategyExperimentRequestIsCurrent(requestGeneration, sourceKey)) {
        setIsStrategyExperimentRunning(false);
      }
    }
  }, [
    beginStrategyExperimentRequest,
    i18n,
    resetAiReviewHistoryState,
    strategyExperimentRequestIsCurrent,
    strategyExperimentUsableSourceKey,
    visibleStrategyExperimentActive,
    workspace
  ]);

  const submitPaperExecution = useCallback(async (runIdOverride?: string) => {
    const runId = runIdOverride ?? currentResearchRunId;
    if (!runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution failed",
        error: researchRunContextBinding.status === "mismatched" ? researchRunContextBinding.detail : "Run the pipeline before submitting a paper execution."
      }));
      return;
    }

    setIsSubmittingPaperExecution(true);
    try {
      const result = await runP0PaperSimulation(quantCoreBaseUrl, {
        runId,
        market: workspace.researchRun?.market ?? workspace.selectedInstrument.market,
        symbol: workspace.researchRun?.symbol ?? workspace.selectedInstrument.symbol,
        timeframe: workspace.researchRun?.timeframe ?? workspace.selectedTimeframe
      });
      if (result.source === "fallback" || !result.execution || !result.simulation) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution failed",
          error: result.error ?? "Paper execution failed"
        }));
        return;
      }

      setPaperExecutionRecord(result.execution);
      setP0PaperSimulationRecord(result.simulation);
      setPromotionCandidateRecord(result.promotion ?? null);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `P0 paper simulation recorded · ${result.simulatedFill?.orderId ?? result.execution?.executionId} · ${formatPlainNumber(result.simulatedFill?.quantity ?? 0)} @ ${formatPlainNumber(result.simulatedFill?.fillPrice ?? 0)}`,
        error: undefined
      }));
      setActiveWorkAreaId("execution");
      setActiveLoopStepId("paper");
      setActiveWorkflowStageId("execution");
    } finally {
      setIsSubmittingPaperExecution(false);
    }
  }, [
    currentResearchRunId,
    researchRunContextBinding.detail,
    researchRunContextBinding.status,
    workspace.researchRun?.market,
    workspace.researchRun?.symbol,
    workspace.researchRun?.timeframe,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const commitProductWorkAreaSelection = useCallback(
    (areaId: ProductWorkAreaId) => {
      manualSelectionVersionRef.current += 1;
      const selection = resolveProductWorkAreaSelection(workspace, areaId, activeWorkAreaId);
      setActiveWorkAreaId(selection.areaId);
      setActiveLoopStepId(selection.quantLoopStepId);
      setActiveWorkflowStageId(selection.workflowStageId);
    },
    [activeWorkAreaId, workspace]
  );

  const selectProductWorkArea = useCallback(
    (areaId: ProductWorkAreaId) => {
      const commitSelection = () => commitProductWorkAreaSelection(areaId);
      if (deferSettingsNavigation(areaId, commitSelection)) return;
      commitSelection();
    },
    [commitProductWorkAreaSelection, deferSettingsNavigation]
  );

  const continueEditingSettings = useCallback(() => {
    pendingSettingsNavigationActionRef.current = null;
    setPendingSettingsWorkAreaId(null);
  }, []);

  const saveSettingsAndLeave = useCallback(() => {
    const form = document.querySelector<HTMLFormElement>("#settings-configuration");
    if (!form) return;
    if (!form.checkValidity()) {
      continueEditingSettings();
      window.requestAnimationFrame(() => form.reportValidity());
      return;
    }
    form.requestSubmit();
  }, [continueEditingSettings]);

  const discardSettingsAndLeave = useCallback(() => {
    const navigationAction = pendingSettingsNavigationActionRef.current;
    if (!pendingSettingsWorkAreaId || !navigationAction) return;
    pendingSettingsNavigationActionRef.current = null;
    setHasUnsavedSettingsConfiguration(false);
    setPendingSettingsWorkAreaId(null);
    navigationAction();
  }, [pendingSettingsWorkAreaId]);

  const openResearchPipelinePreflightIssue = useCallback(
    (issue: ResearchPipelinePreflight["issues"][number]) => {
      if (
        !marketDataRefreshGuard.blocked &&
        (issue.action === "refresh-cache" || issue.action === "refresh-watchlist-cache")
      ) {
        runResearchContextReadinessAction(
          issue.action,
          () => void refreshSelectedMarketCache(),
          () => void refreshWatchlistMarketCache()
        );
        return;
      }
      const target = researchPipelinePreflightIssueTargets[issue.id];
      setIsResearchPipelineConfirmationOpen(false);
      selectProductWorkArea(target.workspaceId);
      window.setTimeout(() => {
        const element = document.querySelector<HTMLElement>(target.selector);
        if (!element) {
          return;
        }
        element.scrollIntoView({ block: "center" });
        element.focus({ preventScroll: true });
      }, 0);
    },
    [
      marketDataRefreshGuard.blocked,
      refreshSelectedMarketCache,
      refreshWatchlistMarketCache,
      selectProductWorkArea
    ]
  );

  const focusExecutionAdapterPaperExecutionAudit = useCallback(
    (row: ExecutionAdapterPaperExecutionRow) => {
      updateExecutionAdapterPaperExecutionAuditQuery(buildExecutionAdapterPaperExecutionAuditQuery(row));
      selectProductWorkArea("audit");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Adapter paper execution audit opened",
        error: undefined
      }));
    },
    [selectProductWorkArea, updateExecutionAdapterPaperExecutionAuditQuery]
  );

  const runPortfolioPaperOpsQueueAction = useCallback(
    (row: PortfolioPaperOpsQueueRow) => {
      if (!row.canRunAction) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Portfolio paper ops action blocked",
          error: row.detail
        }));
        return;
      }

      if (row.nextActionId === "simulate-order" && row.orderId) {
        const approval = portfolioPaperOrderApprovalRows.find(
          (candidate) => candidate.batchId === row.batchId && candidate.orderId === row.orderId
        );
        if (!approval) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Portfolio paper simulation unavailable",
            error: "Approval evidence is missing for this paper order."
          }));
          return;
        }
        void simulatePortfolioPaperOrder(approval);
        selectProductWorkArea("execution");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Portfolio paper simulation queued · ${row.orderId}`,
          error: undefined
        }));
        return;
      }

      if (row.focusQuery) {
        updatePortfolioPaperOrderAuditQuery(row.focusQuery);
      }
      selectProductWorkArea(row.nextActionId === "open-portfolio" ? "portfolio" : "audit");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Portfolio paper ops opened · ${row.statusLabel}`,
        error: undefined
      }));
    },
    [portfolioPaperOrderApprovalRows, selectProductWorkArea, simulatePortfolioPaperOrder, updatePortfolioPaperOrderAuditQuery]
  );

  const focusExecutionAdapterPreLiveRunbookAudit = useCallback(() => {
    const query = executionAdapterPreLiveRunbookAuditCoverage.query;
    selectProductWorkArea("audit");
    if (!query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook audit coverage unavailable",
        error: "No matching pre-live runbook report has been recorded yet."
      }));
      return;
    }
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Pre-live runbook audit coverage selected",
      error: undefined
    }));
  }, [executionAdapterPreLiveRunbookAuditCoverage.query, selectProductWorkArea, updateAuditEvidenceReportQuery]);

  const focusOperatorRunbookAudit = useCallback(() => {
    const query = operatorRunbookAuditCoverage.query;
    selectProductWorkArea("audit");
    if (!query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook audit coverage unavailable",
        error: "No matching operator runbook report has been recorded yet."
      }));
      return;
    }
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Operator runbook audit coverage selected",
      error: undefined
    }));
  }, [operatorRunbookAuditCoverage.query, selectProductWorkArea, updateAuditEvidenceReportQuery]);

  const openP2ReadinessAcceptanceGeneratedAudit = useCallback(() => {
    const auditEventId = p2ReadinessAcceptanceGeneratedAuditEventId;
    const matchingRow =
      p2ReadinessAcceptanceGeneratedAuditEventReference.ledgerRow ??
      (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
      latestP2ReadinessAcceptanceGeneratedAuditRow ??
      undefined;
    const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery(matchingRow);
    const readback = p2ReadinessAcceptanceLatestState.acceptance ?? null;
    const fallbackQuery = [
      "p2_readiness_acceptance_generated",
      auditEventId,
      readback?.sourcePath ?? "data/p2-readiness-acceptance.json",
      readback?.status ?? p2ReadinessAcceptanceSummary.status,
      `${readback?.acceptedCriterionCount ?? p2ReadinessAcceptanceSummary.acceptedCount}/${
        readback?.totalCriterionCount ?? p2ReadinessAcceptanceSummary.totalCount
      }`,
      readback?.runId ?? "",
      readback?.market ?? "",
      readback?.symbol ?? "",
      readback?.timeframe ?? ""
    ]
      .filter(Boolean)
      .join(" ");
    const query = ledgerQuery || fallbackQuery;

    selectProductWorkArea("audit");
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: auditEventId
        ? "P2 readiness acceptance generation audit event selected"
        : "P2 readiness acceptance generation audit query prepared",
      error: query ? undefined : "Generate the P2 readiness acceptance before opening its audit event."
    }));
  }, [
    auditEvidenceReportLedgerRows,
    latestP2ReadinessAcceptanceGeneratedAuditRow,
    p2ReadinessAcceptanceGeneratedAuditEventReference,
    p2ReadinessAcceptanceGeneratedAuditEventId,
    p2ReadinessAcceptanceLatestState.acceptance,
    p2ReadinessAcceptanceSummary.acceptedCount,
    p2ReadinessAcceptanceSummary.status,
    p2ReadinessAcceptanceSummary.totalCount,
    selectProductWorkArea,
    updateAuditEvidenceReportQuery
  ]);

  const openP2ReadinessAcceptanceReviewAudit = useCallback(() => {
    const auditEventId = p2ReadinessAcceptanceReviewAuditEventId;
    const matchingRow =
      p2ReadinessAcceptanceReviewAuditEventReference.ledgerRow ??
      (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
      latestP2ReadinessAcceptanceReviewAuditRow ??
      undefined;
    const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery(matchingRow);
    const readback = p2ReadinessAcceptanceLatestState.acceptance ?? null;
    const savedFileName =
      typeof p2ReadinessAcceptanceReviewAuditEvent?.metadata?.fileName === "string"
        ? p2ReadinessAcceptanceReviewAuditEvent.metadata.fileName
        : "";
    const savedHash =
      typeof p2ReadinessAcceptanceReviewAuditEvent?.metadata?.contentSha256 === "string"
        ? p2ReadinessAcceptanceReviewAuditEvent.metadata.contentSha256.slice(0, 12)
        : "";
    const fallbackQuery = [
      "p2_readiness_acceptance_review",
      auditEventId,
      savedHash,
      savedFileName,
      readback?.market ?? "",
      readback?.symbol ?? "",
      readback?.timeframe ?? "",
      readback?.status ?? p2ReadinessAcceptanceSummary.status,
      `${readback?.acceptedCriterionCount ?? p2ReadinessAcceptanceSummary.acceptedCount}/${
        readback?.totalCriterionCount ?? p2ReadinessAcceptanceSummary.totalCount
      }`
    ]
      .filter(Boolean)
      .join(" ");
    const query = ledgerQuery || fallbackQuery;

    selectProductWorkArea("audit");
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: auditEventId
        ? "P2 readiness acceptance review audit event selected"
        : "P2 readiness acceptance review audit query prepared",
      error: query ? undefined : "Record the P2 readiness acceptance review before opening its audit event."
    }));
  }, [
    auditEvidenceReportLedgerRows,
    latestP2ReadinessAcceptanceReviewAuditRow,
    p2ReadinessAcceptanceReviewAuditEventReference,
    p2ReadinessAcceptanceLatestState.acceptance,
    p2ReadinessAcceptanceReviewAuditEventId,
    p2ReadinessAcceptanceReviewAuditEvent,
    p2ReadinessAcceptanceSummary.acceptedCount,
    p2ReadinessAcceptanceSummary.status,
    p2ReadinessAcceptanceSummary.totalCount,
    selectProductWorkArea,
    updateAuditEvidenceReportQuery
  ]);

  const openP2ReadinessAcceptanceCoverageReviewAudit = useCallback(() => {
    const linkedCoverageReviewAuditEventId = p2ReadinessAcceptanceSummary.evidenceCoverageReviewAuditEventId ?? "";
    const matchingAcceptanceReviewRow =
      p2ReadinessAcceptanceReviewAuditEventReference.ledgerRow ??
      (p2ReadinessAcceptanceReviewAuditEventId
        ? auditEvidenceReportLedgerRows.find((row) => row.id === p2ReadinessAcceptanceReviewAuditEventId)
        : undefined) ??
      latestP2ReadinessAcceptanceReviewAuditRow ??
      undefined;
    const linkedCoverageReviewRow = linkedCoverageReviewAuditEventId
      ? auditEvidenceReportLedgerRows.find(
          (row) => row.reportKind === "p2_readiness_evidence_coverage_review" && row.id === linkedCoverageReviewAuditEventId
        )
      : undefined;
    const coverageLedgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery(linkedCoverageReviewRow);
    const acceptanceLinkedQuery =
      buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery(matchingAcceptanceReviewRow);
    const fallbackQuery = linkedCoverageReviewAuditEventId
      ? ["p2_readiness_evidence_coverage_review", linkedCoverageReviewAuditEventId].join(" ")
      : "";
    const query = coverageLedgerQuery || acceptanceLinkedQuery || fallbackQuery;

    selectProductWorkArea("audit");
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: query
        ? "P2 readiness linked coverage review audit selected"
        : "P2 readiness linked coverage review unavailable",
      error: query
        ? undefined
        : "Record the P2 evidence coverage review before opening the linked coverage review."
    }));
  }, [
    auditEvidenceReportLedgerRows,
    latestP2ReadinessAcceptanceReviewAuditRow,
    p2ReadinessAcceptanceReviewAuditEventId,
    p2ReadinessAcceptanceReviewAuditEventReference.ledgerRow,
    p2ReadinessAcceptanceSummary.evidenceCoverageReviewAuditEventId,
    selectProductWorkArea,
    updateAuditEvidenceReportQuery
  ]);

  const openP2ReadinessEvidenceCoverageReviewAudit = useCallback(() => {
    const auditEventId = p2ReadinessEvidenceCoverageReviewAuditEventId;
    const matchingRow =
      p2ReadinessEvidenceCoverageReviewAuditEventReference.ledgerRow ??
      (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
      latestP2ReadinessEvidenceCoverageReviewAuditRow ??
      undefined;
    const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery(matchingRow);
    const savedFileName =
      typeof p2ReadinessEvidenceCoverageReviewAuditEvent?.metadata?.fileName === "string"
        ? p2ReadinessEvidenceCoverageReviewAuditEvent.metadata.fileName
        : "";
    const savedHash =
      typeof p2ReadinessEvidenceCoverageReviewAuditEvent?.metadata?.contentSha256 === "string"
        ? p2ReadinessEvidenceCoverageReviewAuditEvent.metadata.contentSha256.slice(0, 12)
        : "";
    const fallbackQuery = [
      "p2_readiness_evidence_coverage_review",
      auditEventId,
      savedHash,
      savedFileName,
      p2ReadinessEvidenceCoverage.status,
      `${p2ReadinessEvidenceCoverage.coveredCount}/${p2ReadinessEvidenceCoverage.totalCount}`,
      p2ReadinessEvidenceCoverage.rows.map((row) => row.id).join(" "),
      p2ReadinessEvidenceCoverage.rows.map((row) => row.sourceType).join(" ")
    ]
      .filter(Boolean)
      .join(" ");
    const query = ledgerQuery || fallbackQuery;

    selectProductWorkArea("audit");
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: auditEventId
        ? "P2 readiness evidence coverage review audit event selected"
        : "P2 readiness evidence coverage review audit query prepared",
      error: query ? undefined : "Record the P2 readiness evidence coverage review before opening its audit event."
    }));
  }, [
    auditEvidenceReportLedgerRows,
    latestP2ReadinessEvidenceCoverageReviewAuditRow,
    p2ReadinessEvidenceCoverage,
    p2ReadinessEvidenceCoverageReviewAuditEventReference,
    p2ReadinessEvidenceCoverageReviewAuditEvent,
    p2ReadinessEvidenceCoverageReviewAuditEventId,
    selectProductWorkArea,
    updateAuditEvidenceReportQuery
  ]);

  const openP2ReadinessEvidenceCoverageLinkedAcceptanceReviewAudit = useCallback(() => {
    const linkedCoverageReviewAuditEventId = p2ReadinessEvidenceCoverageReviewAuditEventId;
    const latestMatchingAcceptanceReviewRow =
      linkedCoverageReviewAuditEventId &&
      latestP2ReadinessAcceptanceReviewAuditRow?.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId ===
        linkedCoverageReviewAuditEventId
        ? latestP2ReadinessAcceptanceReviewAuditRow
        : undefined;
    const matchingAcceptanceReviewRow =
      latestMatchingAcceptanceReviewRow ??
      (linkedCoverageReviewAuditEventId
        ? auditEvidenceReportLedgerRows.find(
            (row) =>
              row.reportKind === "p2_readiness_acceptance_review" &&
              row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId === linkedCoverageReviewAuditEventId
          )
        : undefined);
    const acceptanceReviewQuery =
      buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery(matchingAcceptanceReviewRow);
    const fallbackQuery = linkedCoverageReviewAuditEventId
      ? ["p2_readiness_acceptance_review", linkedCoverageReviewAuditEventId].join(" ")
      : "";
    const query = acceptanceReviewQuery || fallbackQuery;

    selectProductWorkArea("audit");
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: query
        ? "P2 readiness linked acceptance review audit selected"
        : "P2 readiness linked acceptance review unavailable",
      error: query
        ? undefined
        : "Record the P2 readiness acceptance review before opening the linked acceptance review."
    }));
  }, [
    auditEvidenceReportLedgerRows,
    latestP2ReadinessAcceptanceReviewAuditRow,
    p2ReadinessEvidenceCoverageReviewAuditEventId,
    selectProductWorkArea,
    updateAuditEvidenceReportQuery
  ]);

  const openP2ManifestChainPreflightAudit = useCallback(() => {
    const auditEventId = p2ManifestChainPreflightAuditReference.eventId;
    const matchingRow =
      p2ManifestChainPreflightAuditReference.ledgerRow ??
      (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined);
    const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery(matchingRow);
    const fallbackQuery = [
      "p2_manifest_chain_preflight",
      auditEventId,
      p2ManifestChainPreflightSummary.sourcePath,
      p2ManifestChainPreflightSummary.state,
      `${p2ManifestChainPreflightSummary.validStageCount}/${p2ManifestChainPreflightSummary.totalStageCount}`,
      p2ManifestChainPreflightSummary.nextAction,
      p2ManifestChainPreflightSummary.blockerIds.join(" ")
    ]
      .filter(Boolean)
      .join(" ");
    const query = ledgerQuery || fallbackQuery;

    selectProductWorkArea("audit");
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: auditEventId
        ? "P2 manifest chain preflight audit event selected"
        : "P2 manifest chain preflight audit query prepared",
      error: query ? undefined : "Generate the P2 manifest chain preflight before opening its audit event."
    }));
  }, [
    auditEvidenceReportLedgerRows,
    p2ManifestChainPreflightAuditReference.eventId,
    p2ManifestChainPreflightAuditReference.ledgerRow,
    p2ManifestChainPreflightSummary.blockerIds,
    p2ManifestChainPreflightSummary.nextAction,
    p2ManifestChainPreflightSummary.sourcePath,
    p2ManifestChainPreflightSummary.state,
    p2ManifestChainPreflightSummary.totalStageCount,
    p2ManifestChainPreflightSummary.validStageCount,
    selectProductWorkArea,
    updateAuditEvidenceReportQuery
  ]);

  const openP2ManifestChainPreflightReviewAudit = useCallback(() => {
    const auditEventId = p2ManifestChainPreflightReviewAuditEventId;
    const matchingRow =
      p2ManifestChainPreflightReviewAuditEventReference.ledgerRow ??
      (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
      latestP2ManifestChainPreflightReviewAuditRow ??
      undefined;
    const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightReviewQuery(matchingRow);
    const savedFileName =
      typeof p2ManifestChainPreflightReviewAuditEvent?.metadata?.fileName === "string"
        ? p2ManifestChainPreflightReviewAuditEvent.metadata.fileName
        : "";
    const savedHash =
      typeof p2ManifestChainPreflightReviewAuditEvent?.metadata?.contentSha256 === "string"
        ? p2ManifestChainPreflightReviewAuditEvent.metadata.contentSha256.slice(0, 12)
        : "";
    const fallbackQuery = [
      "p2_manifest_chain_preflight_review",
      auditEventId,
      savedHash,
      savedFileName,
      p2ManifestChainPreflightSummary.sourcePath,
      p2ManifestChainPreflightSummary.state,
      `${p2ManifestChainPreflightSummary.validStageCount}/${p2ManifestChainPreflightSummary.totalStageCount}`,
      p2ManifestChainPreflightSummary.nextAction,
      p2ManifestChainPreflightSummary.blockerIds.join(" ")
    ]
      .filter(Boolean)
      .join(" ");
    const query = ledgerQuery || fallbackQuery;

    selectProductWorkArea("audit");
    updateAuditEvidenceReportQuery(query);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: auditEventId
        ? "P2 manifest chain preflight review audit event selected"
        : "P2 manifest chain preflight review audit query prepared",
      error: query ? undefined : "Record the P2 manifest chain preflight review before opening its audit event."
    }));
  }, [
    auditEvidenceReportLedgerRows,
    latestP2ManifestChainPreflightReviewAuditRow,
    p2ManifestChainPreflightReviewAuditEvent,
    p2ManifestChainPreflightReviewAuditEventId,
    p2ManifestChainPreflightReviewAuditEventReference,
    p2ManifestChainPreflightSummary.blockerIds,
    p2ManifestChainPreflightSummary.nextAction,
    p2ManifestChainPreflightSummary.sourcePath,
    p2ManifestChainPreflightSummary.state,
    p2ManifestChainPreflightSummary.totalStageCount,
    p2ManifestChainPreflightSummary.validStageCount,
    selectProductWorkArea,
    updateAuditEvidenceReportQuery
  ]);

  const openP2ReadinessEvidenceCoverage = useCallback(
    (row: P2ReadinessEvidenceCoverageRow) => {
      switch (row.id) {
        case "paper-replay-manifest":
          selectProductWorkArea("execution");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 paper replay evidence selected",
            error: undefined
          }));
          return;
        case "p2-acceptance-manifest":
          selectProductWorkArea("execution");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 pre-live acceptance evidence selected",
            error: undefined
          }));
          return;
        case "operator-runbook-audit":
          focusOperatorRunbookAudit();
          return;
        case "p2-manifest-chain-preflight-review":
          openP2ManifestChainPreflightReviewAudit();
          return;
        case "pre-live-checklist":
          selectProductWorkArea("execution");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 pre-live checklist evidence selected",
            error: undefined
          }));
          return;
        case "adapter-chain-health":
          selectProductWorkArea("settings");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 adapter chain evidence selected",
            error: undefined
          }));
          return;
        case "safety-boundary":
          selectProductWorkArea("execution");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P2 safety boundary evidence selected",
            error: undefined
          }));
          return;
      }
    },
    [focusOperatorRunbookAudit, openP2ManifestChainPreflightReviewAudit, selectProductWorkArea]
  );

  const openExecutionAdapterPaperExecutionEvidence = useCallback(
    (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => {
      setFocusedAdapterPaperExecutionAuditEventId(row.id);
      replaceAdapterPaperExecutionEvidenceUrlParam(row.id);
      selectProductWorkArea("settings");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Adapter paper execution evidence selected",
        error: undefined
      }));
    },
    [selectProductWorkArea]
  );

  const copyExecutionAdapterPaperExecutionEvidenceLink = useCallback(
    async (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Adapter paper execution evidence link copy failed",
          error: "Clipboard is unavailable."
        }));
        return;
      }
      await navigator.clipboard.writeText(buildExecutionAdapterPaperExecutionEvidenceUrl(row.id));
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Adapter paper execution evidence link copied",
        error: undefined
      }));
    },
    []
  );

  const openMarketDataAdapterWorkflow = useCallback(
    (adapter: PlatformSettingsStatus["marketDataAdapters"][number]) => {
      const instrument = resolveAdapterWorkflowInstrument(workspace, adapter.market);
      selectInstrument(instrument, "market");
    },
    [selectInstrument, workspace]
  );

  const openAuditReportLedgerEvidenceLink = useCallback(
    (search: string) => {
      const params = new URLSearchParams(search);
      const targetWorkspace = params.get("workspace");
      const targetWorkspaceId =
        targetWorkspace && productWorkAreaIds.includes(targetWorkspace as ProductWorkAreaId)
          ? (targetWorkspace as ProductWorkAreaId)
          : null;
      const runId = params.get("runId");
      const exportPath = params.get("exportPath") ?? (runId ? `manifest:${runId}` : "");
      const paperExecutionId = params.get("paperExecution");

      if (!targetWorkspaceId) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Audit report evidence link failed",
          error: "The report evidence link does not target a known workspace."
        }));
        return;
      }

      selectProductWorkArea(targetWorkspaceId);
      if (targetWorkspaceId === "audit" && runId) {
        void loadImportAuditEvidenceDeepLink({
          auditEventId: null,
          exportPath,
          focusQuery: runId,
          runId
        });
        return;
      }

      if (targetWorkspaceId === "execution" && runId && paperExecutionId) {
        void loadPaperExecutionDeepLink({ executionId: paperExecutionId, runId });
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit report evidence workspace opened",
        error: undefined
      }));
    },
    [loadImportAuditEvidenceDeepLink, loadPaperExecutionDeepLink, selectProductWorkArea]
  );

  const openAuditReportLedgerResearchContextLink = useCallback(
    (search: string) => {
      const urlState = resolveResearchContextUrlState(search);
      if (!urlState) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context report link failed",
          error: "The report does not contain a valid research context link."
        }));
        return;
      }
      const instrument =
        workspace.watchlist.find(
          (candidate) => candidate.market === urlState.market && candidate.symbol === urlState.symbol
        ) ?? buildInstrumentFromSymbol(urlState.market, urlState.symbol);
      if (!instrument) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context report link failed",
          error: "The report research context symbol is invalid."
        }));
        return;
      }

      const watchlistRefreshRunId = resolveWatchlistCacheRefreshRunIdFromUrl(search);
      const isExistingWatchlistInstrument = watchlistIncludesInstrument(workspace.watchlist, instrument);
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      setHasUnsavedWatchlistChanges((current) => current || !isExistingWatchlistInstrument);
      setWatchlistCacheRefreshRunSelection(watchlistRefreshRunId);
      setWorkspaceState((current) => {
        const instrumentWorkspace = workspaceWithSelectedInstrument(current.workspace, instrument);
        const timeframeWorkspace =
          instrumentWorkspace.selectedTimeframe === urlState.timeframe
            ? instrumentWorkspace
            : workspaceWithSelectedTimeframe(instrumentWorkspace, urlState.timeframe);
        return {
          workspace: timeframeWorkspace,
          source: "core",
          statusLabel: "Research context report link opened"
        };
      });
      setActiveWorkAreaId("research");
      setActiveLoopStepId("research");
      setActiveWorkflowStageId("data");
      setWorkflowRunState(createWorkflowRunState());
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.search = search.startsWith("?") ? search : `?${search}`;
        url.hash = "";
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
    },
    [resetAiReviewHistoryState, setWatchlistCacheRefreshRunSelection, workspace.watchlist]
  );

  const copyAuditReportLedgerEvidenceLink = useCallback(async (search: string) => {
    if (!search || !navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit report evidence link copy failed",
        error: "Clipboard is unavailable or the report does not have an evidence link."
      }));
      return;
    }

    const url = new URL(window.location.href);
    url.search = `?${search}`;
    url.hash = "";
    await navigator.clipboard.writeText(url.toString());
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Audit report evidence link copied",
      error: undefined
    }));
  }, []);

  const openLatestResearchContextReportInAudit = useCallback(() => {
    const query = latestResearchContextReadinessReport?.query ?? "";
    if (!query) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(query);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(query);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest research context readiness report selected",
      error: undefined
    }));
  }, [latestResearchContextReadinessReport?.query, selectProductWorkArea]);

  const openLatestOtherResearchContextReportInAudit = useCallback(() => {
    const query = latestOtherResearchContextReadinessReport?.query ?? "";
    if (!query) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(query);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(query);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Other research context readiness report selected",
      error: undefined
    }));
  }, [latestOtherResearchContextReadinessReport?.query, selectProductWorkArea]);

  const openLatestResearchContextReportContext = useCallback(() => {
    const search = latestResearchContextReadinessReport?.linkSearch ?? "";
    if (!search) {
      selectProductWorkArea("audit");
      return;
    }
    openAuditReportLedgerResearchContextLink(search);
  }, [
    latestResearchContextReadinessReport?.linkSearch,
    openAuditReportLedgerResearchContextLink,
    selectProductWorkArea
  ]);

  const copyLatestResearchContextReportLink = useCallback(() => {
    const search = latestResearchContextReadinessReport?.linkSearch ?? "";
    if (!search) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research context report link copy failed",
        error: "No recorded research context report link is available."
      }));
      return;
    }
    void copyAuditReportLedgerEvidenceLink(search);
  }, [latestResearchContextReadinessReport?.linkSearch, copyAuditReportLedgerEvidenceLink]);

  const copyAuditReportLedgerQueryLink = useCallback(async (query: string) => {
    if (!query.trim() || !navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Audit report query link copy failed",
        error: "Clipboard is unavailable or the report query is empty."
      }));
      return;
    }

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("workspace", "audit");
    url.searchParams.set("auditReportQuery", query);
    url.hash = "";
    await navigator.clipboard.writeText(url.toString());
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Audit report query link copied",
      error: undefined
    }));
  }, []);

  const openAuditReportLedgerQuery = useCallback(
    (query: string, statusLabel = "Audit report query selected") => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(normalizedQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(normalizedQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel,
        error: undefined
      }));
    },
    [selectProductWorkArea]
  );

  const copyExecutionAdapterPreLiveRunbookAuditLink = useCallback(async () => {
    const query = executionAdapterPreLiveRunbookAuditCoverage.query;
    if (!query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook audit link copy failed",
        error: "No matching pre-live runbook report has been recorded yet."
      }));
      return;
    }
    await copyAuditReportLedgerQueryLink(query);
  }, [copyAuditReportLedgerQueryLink, executionAdapterPreLiveRunbookAuditCoverage.query]);

  const copyOperatorRunbookAuditLink = useCallback(async () => {
    const query = operatorRunbookAuditCoverage.query;
    if (!query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Operator runbook audit link copy failed",
        error: "No matching operator runbook report has been recorded yet."
      }));
      return;
    }
    await copyAuditReportLedgerQueryLink(query);
  }, [copyAuditReportLedgerQueryLink, operatorRunbookAuditCoverage.query]);

  const copyLatestOtherResearchContextReportAuditLink = useCallback(async () => {
    const query = latestOtherResearchContextReadinessReport?.query ?? "";
    if (!query.trim() || !navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Other research context report link copy failed",
        error: "Clipboard is unavailable or no other research context report query is available."
      }));
      return;
    }
    await copyAuditReportLedgerQueryLink(query);
  }, [latestOtherResearchContextReadinessReport?.query, copyAuditReportLedgerQueryLink]);

  const copyExecutionAdapterPaperExecutionAuditLink = useCallback(
    async (row: ExecutionAdapterPaperExecutionRow) => {
      await copyAuditReportLedgerQueryLink(buildExecutionAdapterPaperExecutionAuditQuery(row));
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Adapter paper execution audit link copy requested",
        error: undefined
      }));
    },
    [copyAuditReportLedgerQueryLink]
  );

  const copyP0CurrentGapActionLink = useCallback(async (search: string) => {
    const normalizedSearch = buildP0CurrentGapActionUrlSearch(search);
    if (!normalizedSearch || !navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 next-step link copy failed",
        error: "Clipboard is unavailable or the P0 next-step link is empty."
      }));
      return;
    }

    const url = new URL(window.location.href);
    url.search = `?${normalizedSearch}`;
    url.hash = "";
    await navigator.clipboard.writeText(url.toString());
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P0 next-step link copied",
      error: undefined
    }));
  }, []);

  const copyP0CompletionGapLink = useCallback(
    async (targetWorkspaceId: ProductWorkAreaId | null | undefined, auditReportQuery: string) => {
      const normalizedSearch = buildP0CompletionGapUrlSearch({
        auditReportQuery,
        targetWorkspaceId
      });
      if (!normalizedSearch || !navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 completion gap link copy failed",
          error: "Clipboard is unavailable or the P0 completion gap link is incomplete."
        }));
        return;
      }

      const url = new URL(window.location.href);
      url.search = `?${normalizedSearch}`;
      url.hash = "";
      await navigator.clipboard.writeText(url.toString());
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 completion gap link copied",
        error: undefined
      }));
    },
    []
  );

  const copyLocalReviewCoverageNextActionLink = useCallback(
    async (targetWorkspaceId: ProductWorkAreaId | null | undefined, auditReportQuery: string) => {
      const normalizedSearch = buildLocalReviewCoverageNextActionUrlSearch({
        auditReportQuery,
        targetWorkspaceId
      });
      if (!normalizedSearch || !navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Local review coverage next-step link copy failed",
          error: "Clipboard is unavailable or the local review coverage next-step link is incomplete."
        }));
        return;
      }

      const url = new URL(window.location.href);
      url.search = `?${normalizedSearch}`;
      url.hash = "";
      await navigator.clipboard.writeText(url.toString());
      const state = resolveLocalReviewCoverageNextActionDeepLinkState(normalizedSearch);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: state
          ? localReviewCoverageNextActionCopyStatusLabel(state)
          : "Local review coverage next-step link copied",
        error: undefined
      }));
    },
    []
  );

  const openP0CurrentGapActionLink = useCallback(
    (search: string) => {
      const state = resolveP0CurrentGapActionDeepLinkState(search);
      if (!state) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 next-step link open failed",
          error: "The P0 next-step link is missing a valid workspace, audit query, or action id."
        }));
        return;
      }

      replaceP0CurrentGapActionUrlSearch(search);
      selectProductWorkArea(state.targetWorkspaceId);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 next-step workspace opened",
        error: undefined
      }));
    },
    [selectProductWorkArea]
  );

  const copyP0ActionOutcomeEvidenceLink = useCallback(async (outcome: P0PlatformActionOutcome) => {
    const link = buildP0PlatformActionOutcomeEvidenceLink(outcome);
    if (!link || !navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 evidence link copy failed",
        error: "Clipboard is unavailable or no P0 evidence link exists"
      }));
      return;
    }

    const url = new URL(window.location.href);
    url.search = `?${link.search}`;
    url.hash = "";
    await navigator.clipboard.writeText(url.toString());
    setCopiedP0ActionOutcomeEvidenceId(link.evidenceId);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: `${link.label} copied`,
      error: undefined
    }));
  }, []);

  const copyP0ReadinessReport = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 readiness report copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(p0PlatformReadinessReportMarkdown);
    setCopiedP0ReadinessReport(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P0 readiness report copied",
      error: undefined
    }));
  }, [p0PlatformReadinessReportMarkdown]);

  const copyP0AcceptanceReview = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 acceptance review copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(p0AcceptanceReviewMarkdown);
    setCopiedP0AcceptanceReview(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P0 acceptance review copied",
      error: undefined
    }));
  }, [p0AcceptanceReviewMarkdown]);

  const downloadP0AcceptanceReview = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([p0AcceptanceReviewMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    const safeRunId = (p0AcceptanceSummary.runId || "latest").replace(/[^a-z0-9._-]+/giu, "-");
    anchor.href = objectUrl;
    anchor.download = `${safeRunId}-p0-acceptance-review.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P0 acceptance review download ready",
      error: undefined
    }));
  }, [p0AcceptanceReviewMarkdown, p0AcceptanceSummary.runId]);

  const copyPersonalTeamReadinessReview = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Personal/team readiness review copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(personalTeamReadinessReviewMarkdown);
    setCopiedPersonalTeamReadinessReview(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Personal/team readiness review copied",
      error: undefined
    }));
  }, [personalTeamReadinessReviewMarkdown]);

  const downloadPersonalTeamReadinessReview = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([personalTeamReadinessReviewMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "personal-team-readiness-review.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Personal/team readiness review download ready",
      error: undefined
    }));
  }, [personalTeamReadinessReviewMarkdown]);

  const recordPersonalTeamReadinessReview = useCallback(async () => {
    setSavingPersonalTeamReadinessReview(true);
    try {
      const auditEvent = await buildPersonalTeamUsabilityReadinessReviewAuditEvent({
        markdown: personalTeamReadinessReviewMarkdown,
        summary: personalTeamUsabilityReadiness
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Personal/team readiness review audited · ${result.event!.eventId}`,
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Personal/team readiness review ledger save failed",
        error: result.error ?? "Personal/team readiness review ledger save failed"
      }));
    } catch (recordError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Personal/team readiness review ledger save failed",
        error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
      }));
    } finally {
      setSavingPersonalTeamReadinessReview(false);
    }
  }, [personalTeamReadinessReviewMarkdown, personalTeamUsabilityReadiness, quantCoreBaseUrl]);

  const openPersonalTeamReadinessReviewInAudit = useCallback(() => {
    if (!personalTeamReadinessReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Personal/team readiness review audit reference missing",
        error: "No personal/team readiness review has been recorded yet."
      }));
      return;
    }

    openAuditReportLedgerQuery(personalTeamReadinessReviewReference.query, "Personal/team readiness review audit query selected");
  }, [openAuditReportLedgerQuery, personalTeamReadinessReviewReference.query]);

  const copyPersonalTeamReadinessReviewAuditLink = useCallback(() => {
    if (!personalTeamReadinessReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Personal/team readiness review link copy failed",
        error: "No personal/team readiness review has been recorded yet."
      }));
      return;
    }

    void copyAuditReportLedgerQueryLink(personalTeamReadinessReviewReference.query);
  }, [copyAuditReportLedgerQueryLink, personalTeamReadinessReviewReference.query]);

  const openDailyOpsControlRoomReviewInAudit = useCallback(() => {
    if (!dailyOpsControlRoomReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily ops review audit reference missing",
        error: "No daily ops review has been recorded yet."
      }));
      return;
    }

    openAuditReportLedgerQuery(dailyOpsControlRoomReviewReference.query, "Daily ops review audit query selected");
  }, [dailyOpsControlRoomReviewReference.query, openAuditReportLedgerQuery]);

  const copyDailyOpsControlRoomReviewAuditLink = useCallback(() => {
    if (!dailyOpsControlRoomReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily ops review link copy failed",
        error: "No daily ops review has been recorded yet."
      }));
      return;
    }

    void copyAuditReportLedgerQueryLink(dailyOpsControlRoomReviewReference.query);
  }, [copyAuditReportLedgerQueryLink, dailyOpsControlRoomReviewReference.query]);

  const copyDailyOpsControlRoomReview = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily ops review copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(dailyOpsControlRoomReviewMarkdown);
    setCopiedDailyOpsControlRoomReview(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Daily ops review copied",
      error: undefined
    }));
  }, [dailyOpsControlRoomReviewMarkdown]);

  const copyStage1P0DailyUseHandoff = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(stage1P0DailyUseClosure.copyText);
      setCopiedStage1P0DailyUseHandoff(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily handoff copied",
        error: undefined
      }));
    } catch (copyError) {
      setCopiedStage1P0DailyUseHandoff(false);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily handoff copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [stage1P0DailyUseClosure.copyText]);

  const copyStage1P0DailyUsePrimaryLink = useCallback(
    async (copiedStatusLabel = "Stage 1 daily primary link copied") => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }

        const primaryShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink);
        await navigator.clipboard.writeText(primaryShareUrl);
        setCopiedStage1P0DailyUsePrimaryLink(true);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: copiedStatusLabel,
          error: undefined
        }));
      } catch (copyError) {
        setCopiedStage1P0DailyUsePrimaryLink(false);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Stage 1 daily primary link copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    },
    [stage1P0DailyUseClosure.primaryWorkspaceLink]
  );

  const buildStage1P0ShareLinkBundleText = useCallback(
    () =>
      buildStage1P0ShareLinkBundleCopyText({
        closure: stage1P0DailyUseClosure,
        refreshOutcome: stage1P0DailyUseRefreshOutcome,
        resolveShareUrl: buildStage1P0WorkspaceShareUrl
      }),
    [stage1P0DailyUseClosure, stage1P0DailyUseRefreshOutcome]
  );

  const copyStage1P0ShareLinkBundle = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      const shareLinkBundleCopyText = buildStage1P0ShareLinkBundleText();
      await navigator.clipboard.writeText(shareLinkBundleCopyText);
      setCopiedStage1P0ShareLinkBundle(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 share link bundle copied",
        error: undefined
      }));
    } catch (copyError) {
      setCopiedStage1P0ShareLinkBundle(false);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 share link bundle copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [buildStage1P0ShareLinkBundleText]);

  const buildStage1P0InvalidShareDiagnosticsText = useCallback(() => {
    const replacementLink = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseClosure.primaryWorkspaceLink);
    const incomingSearch = typeof window === "undefined" ? "" : window.location.search;
    return buildStage1P0InvalidShareDiagnosticsCopyText({
      incomingSearch,
      primaryActionLabel: stage1P0DailyUseClosure.primaryActionLabel,
      primaryTargetWorkspaceId: stage1P0DailyUseClosure.primaryTargetWorkspaceId,
      replacementLink,
      status: initialStage1P0DailyUseShareDeepLinkStatus
    });
  }, [
    stage1P0DailyUseClosure.primaryActionLabel,
    stage1P0DailyUseClosure.primaryTargetWorkspaceId,
    stage1P0DailyUseClosure.primaryWorkspaceLink
  ]);

  const copyStage1P0InvalidShareDiagnostics = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      const diagnosticsCopyText = buildStage1P0InvalidShareDiagnosticsText();
      await navigator.clipboard.writeText(diagnosticsCopyText);
      setCopiedStage1P0InvalidShareDiagnostics(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 invalid share diagnostics copied",
        error: undefined
      }));
    } catch (copyError) {
      setCopiedStage1P0InvalidShareDiagnostics(false);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 invalid share diagnostics copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [buildStage1P0InvalidShareDiagnosticsText]);

  const buildStage1P0DailyUseArchiveBundle = useCallback(
    async () =>
      buildStage1P0DailyUseArchiveBundleModel({
        closure: stage1P0DailyUseClosure,
        invalidShareDiagnosticsCopyText:
          initialStage1P0DailyUseShareDeepLinkStatus.status === "invalid"
            ? buildStage1P0InvalidShareDiagnosticsText()
            : null,
        invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
        refreshOutcome: stage1P0DailyUseRefreshOutcome,
        resolveShareUrl: buildStage1P0WorkspaceShareUrl,
        shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState
      }),
    [
      buildStage1P0DailyUseArchiveBundleModel,
      buildStage1P0InvalidShareDiagnosticsText,
      buildStage1P0WorkspaceShareUrl,
      initialStage1P0DailyUseShareDeepLinkState,
      initialStage1P0DailyUseShareDeepLinkStatus,
      stage1P0DailyUseClosure,
      stage1P0DailyUseRefreshOutcome
    ]
  );

  const copyStage1P0DailyUseArchive = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      const archive = await buildStage1P0DailyUseArchiveBundle();
      await navigator.clipboard.writeText(archive.contentMarkdown);
      setCopiedStage1P0DailyUseArchive(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 daily-use archive copied · sha256 ${archive.bodySha256.hash.slice(0, 12)}`,
        error: undefined
      }));
    } catch (copyError) {
      setCopiedStage1P0DailyUseArchive(false);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily-use archive copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [buildStage1P0DailyUseArchiveBundle]);

  const openStage1P0DailyUseRow = useCallback(
    (row: Stage1P0DailyUseClosure["rows"][number]) => {
      selectProductWorkArea(row.targetWorkspaceId);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 daily row opened · ${row.id} -> ${row.targetWorkspaceId}`,
        error: undefined
      }));
    },
    [selectProductWorkArea]
  );

  const openStage1P0DailyUsePrimaryAction = useCallback(() => {
    selectProductWorkArea(stage1P0DailyUseClosure.primaryTargetWorkspaceId);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: `Stage 1 daily primary action opened · ${stage1P0DailyUseClosure.primaryActionId} -> ${stage1P0DailyUseClosure.primaryTargetWorkspaceId}`,
      error: undefined
    }));
  }, [
    selectProductWorkArea,
    stage1P0DailyUseClosure.primaryActionId,
    stage1P0DailyUseClosure.primaryTargetWorkspaceId
  ]);

  const openStage1P0DailyUseRefreshOutcomeEntry = useCallback(
    (entry: Stage1P0DailyUseRefreshOutcome["entries"][number]) => {
      selectProductWorkArea(entry.targetWorkspaceId);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 refresh receipt entry opened · ${entry.id} -> ${entry.targetWorkspaceId}`,
        error: undefined
      }));
    },
    [selectProductWorkArea]
  );

  const openStage1P0DailyUseRefreshOutcomeNextStep = useCallback(() => {
    if (!stage1P0DailyUseRefreshOutcome) {
      return;
    }

    selectProductWorkArea(stage1P0DailyUseRefreshOutcome.targetWorkspaceId);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: `Stage 1 refresh receipt next step opened · ${stage1P0DailyUseRefreshOutcome.actionLabel} -> ${stage1P0DailyUseRefreshOutcome.targetWorkspaceId}`,
      error: undefined
    }));
  }, [selectProductWorkArea, stage1P0DailyUseRefreshOutcome]);

  const downloadStage1P0DailyUseHandoff = useCallback(() => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(
        new Blob([stage1P0DailyUseClosure.copyText], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "stage1-p0-daily-use-handoff.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily handoff download ready",
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily handoff download failed",
        error: downloadError instanceof Error ? downloadError.message : "Handoff download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [stage1P0DailyUseClosure.copyText]);

  const downloadStage1P0ShareLinkBundle = useCallback(() => {
    let objectUrl: string | null = null;
    try {
      const shareLinkBundleCopyText = buildStage1P0ShareLinkBundleText();
      objectUrl = URL.createObjectURL(
        new Blob([shareLinkBundleCopyText], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "stage1-p0-share-link-bundle.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 share link bundle download ready",
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 share link bundle download failed",
        error: downloadError instanceof Error ? downloadError.message : "Share link bundle download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [buildStage1P0ShareLinkBundleText]);

  const downloadStage1P0DailyUseArchive = useCallback(async () => {
    let objectUrl: string | null = null;
    try {
      const archive = await buildStage1P0DailyUseArchiveBundle();
      objectUrl = URL.createObjectURL(
        new Blob([archive.contentMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = archive.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 daily-use archive download ready · ${archive.fileName} · sha256 ${archive.bodySha256.hash.slice(0, 12)}`,
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily-use archive download failed",
        error: downloadError instanceof Error ? downloadError.message : "Daily-use archive download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [
    buildStage1P0DailyUseArchiveBundle,
    initialStage1P0DailyUseShareDeepLinkState,
    initialStage1P0DailyUseShareDeepLinkStatus,
    stage1P0DailyUseClosure
  ]);

  const recordStage1P0DailyUseArchive = useCallback(async () => {
    setSavingStage1P0DailyUseArchive(true);
    try {
      const archive = await buildStage1P0DailyUseArchiveBundle();
      const auditEvent = await buildStage1P0DailyUseArchiveReviewAuditEvent({
        archive,
        closure: stage1P0DailyUseClosure,
        generatedAt: new Date().toISOString(),
        invalidShareStatus: initialStage1P0DailyUseShareDeepLinkStatus,
        refreshOutcome: stage1P0DailyUseRefreshOutcome,
        shareDeepLinkState: initialStage1P0DailyUseShareDeepLinkState
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Stage 1 daily-use archive audited · ${result.event!.eventId}`,
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily-use archive ledger save failed",
        error: result.error ?? "Stage 1 daily-use archive ledger save failed"
      }));
    } catch (recordError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 daily-use archive ledger save failed",
        error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
      }));
    } finally {
      setSavingStage1P0DailyUseArchive(false);
    }
  }, [
    buildStage1P0DailyUseArchiveBundle,
    initialStage1P0DailyUseShareDeepLinkState,
    initialStage1P0DailyUseShareDeepLinkStatus,
    quantCoreBaseUrl,
    stage1P0DailyUseClosure,
    stage1P0DailyUseRefreshOutcome
  ]);

  const openStage1P0DailyUseArchiveReviewInAudit = useCallback(() => {
    if (!stage1P0DailyUseArchiveReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 archive review audit reference missing",
        error: "No Stage 1 daily-use archive review has been recorded yet."
      }));
      return;
    }

    openAuditReportLedgerQuery(
      stage1P0DailyUseArchiveReviewReference.query,
      "Stage 1 archive review audit query selected"
    );
  }, [openAuditReportLedgerQuery, stage1P0DailyUseArchiveReviewReference.query]);

  const copyStage1P0DailyUseArchiveReviewAuditLink = useCallback(() => {
    if (!stage1P0DailyUseArchiveReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 archive review link copy failed",
        error: "No Stage 1 daily-use archive review has been recorded yet."
      }));
      return;
    }

    void copyAuditReportLedgerQueryLink(stage1P0DailyUseArchiveReviewReference.query);
  }, [copyAuditReportLedgerQueryLink, stage1P0DailyUseArchiveReviewReference.query]);

  const copyStage1P0DailyUseArchiveReviewSummary = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(stage1P0DailyUseArchiveReviewReference.copyText);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 archive review summary copied",
        error: undefined
      }));
    } catch (copyError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 archive review summary copy failed",
        error: copyError instanceof Error ? copyError.message : "Archive review summary copy failed"
      }));
    }
  }, [stage1P0DailyUseArchiveReviewReference.copyText]);

  const downloadStage1P0DailyUseArchiveReviewSummary = useCallback(() => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(
        new Blob([stage1P0DailyUseArchiveReviewReference.copyText], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = stage1P0DailyUseArchiveReviewReference.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 archive review summary download ready · ${stage1P0DailyUseArchiveReviewReference.fileName}`,
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 archive review summary download failed",
        error: downloadError instanceof Error ? downloadError.message : "Archive review summary download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [stage1P0DailyUseArchiveReviewReference.copyText, stage1P0DailyUseArchiveReviewReference.fileName]);

  const copyStage1P0DailyUseStartupSnapshot = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(stage1P0DailyUseStartupSnapshot.copyText);
      setCopiedStage1P0DailyUseStartupSnapshot(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 startup snapshot copied",
        error: undefined
      }));
    } catch (copyError) {
      setCopiedStage1P0DailyUseStartupSnapshot(false);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 startup snapshot copy failed",
        error: copyError instanceof Error ? copyError.message : "Startup snapshot copy failed"
      }));
    }
  }, [stage1P0DailyUseStartupSnapshot.copyText]);

  const downloadStage1P0DailyUseStartupSnapshot = useCallback(() => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(
        new Blob([stage1P0DailyUseStartupSnapshot.copyText], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = stage1P0DailyUseStartupSnapshot.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 startup snapshot download ready · ${stage1P0DailyUseStartupSnapshot.fileName}`,
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 startup snapshot download failed",
        error: downloadError instanceof Error ? downloadError.message : "Startup snapshot download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [stage1P0DailyUseStartupSnapshot.copyText, stage1P0DailyUseStartupSnapshot.fileName]);

  const copyStage1P0DailyUseRefreshOutcome = useCallback(async () => {
    if (!stage1P0DailyUseRefreshOutcome) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(stage1P0DailyUseRefreshOutcome.copyText);
      setCopiedStage1P0DailyUseRefreshOutcome(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 refresh receipt copied",
        error: undefined
      }));
    } catch (copyError) {
      setCopiedStage1P0DailyUseRefreshOutcome(false);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 refresh receipt copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [stage1P0DailyUseRefreshOutcome]);

  const copyStage1P0DailyUseRefreshOutcomeLink = useCallback(async () => {
    if (!stage1P0DailyUseRefreshOutcome) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      const nextShareUrl = buildStage1P0WorkspaceShareUrl(stage1P0DailyUseRefreshOutcome.targetWorkspaceLink);
      await navigator.clipboard.writeText(nextShareUrl);
      setCopiedStage1P0DailyUseRefreshOutcomeLink(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 refresh receipt next link copied",
        error: undefined
      }));
    } catch (copyError) {
      setCopiedStage1P0DailyUseRefreshOutcomeLink(false);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 refresh receipt next link copy failed",
        error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
      }));
    }
  }, [stage1P0DailyUseRefreshOutcome]);

  const downloadStage1P0DailyUseRefreshOutcome = useCallback(() => {
    if (!stage1P0DailyUseRefreshOutcome) {
      return;
    }

    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(
        new Blob([stage1P0DailyUseRefreshOutcome.copyText], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "stage1-p0-daily-refresh-receipt.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 refresh receipt download ready",
        error: undefined
      }));
    } catch (downloadError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Stage 1 refresh receipt download failed",
        error: downloadError instanceof Error ? downloadError.message : "Refresh receipt download failed"
      }));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [stage1P0DailyUseRefreshOutcome]);

  const downloadDailyOpsControlRoomReview = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([dailyOpsControlRoomReviewMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "daily-ops-control-room-review.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Daily ops review download ready",
      error: undefined
    }));
  }, [dailyOpsControlRoomReviewMarkdown]);

  const recordDailyOpsControlRoomReview = useCallback(async () => {
    setSavingDailyOpsControlRoomReview(true);
    try {
      const auditEvent = await buildDailyOpsControlRoomReviewAuditEvent({
        markdown: dailyOpsControlRoomReviewMarkdown,
        summary: dailyOpsControlRoom
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Daily ops review audited · ${result.event!.eventId}`,
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily ops review ledger save failed",
        error: result.error ?? "Daily ops review ledger save failed"
      }));
    } catch (recordError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily ops review ledger save failed",
        error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
      }));
    } finally {
      setSavingDailyOpsControlRoomReview(false);
    }
  }, [dailyOpsControlRoom, dailyOpsControlRoomReviewMarkdown, quantCoreBaseUrl]);

  const openDailyStartBriefReviewInAudit = useCallback(() => {
    if (!dailyStartBriefReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily start review audit reference missing",
        error: "No daily start review has been recorded yet."
      }));
      return;
    }

    openAuditReportLedgerQuery(dailyStartBriefReviewReference.query, "Daily start review audit query selected");
  }, [dailyStartBriefReviewReference.query, openAuditReportLedgerQuery]);

  const copyDailyStartBriefReviewAuditLink = useCallback(() => {
    if (!dailyStartBriefReviewReference.query) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily start review link copy failed",
        error: "No daily start review has been recorded yet."
      }));
      return;
    }

    void copyAuditReportLedgerQueryLink(dailyStartBriefReviewReference.query);
  }, [copyAuditReportLedgerQueryLink, dailyStartBriefReviewReference.query]);

  const copyDailyStartBriefReview = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily start review copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(dailyStartBriefReviewMarkdown);
    setCopiedDailyStartBriefReview(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Daily start review copied",
      error: undefined
    }));
  }, [dailyStartBriefReviewMarkdown]);

  const downloadDailyStartBriefReview = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([dailyStartBriefReviewMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "daily-start-brief-review.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Daily start review download ready",
      error: undefined
    }));
  }, [dailyStartBriefReviewMarkdown]);

  const recordDailyStartBriefReview = useCallback(async () => {
    setSavingDailyStartBriefReview(true);
    try {
      const auditEvent = await buildDailyStartBriefReviewAuditEvent({
        brief: dailyStartBrief,
        markdown: dailyStartBriefReviewMarkdown
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Daily start review audited · ${result.event!.eventId}`,
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily start review ledger save failed",
        error: result.error ?? "Daily start review ledger save failed"
      }));
    } catch (recordError) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Daily start review ledger save failed",
        error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
      }));
    } finally {
      setSavingDailyStartBriefReview(false);
    }
  }, [dailyStartBrief, dailyStartBriefReviewMarkdown, quantCoreBaseUrl]);

  const copyP2ReadinessAcceptanceReview = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness acceptance review copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(p2ReadinessAcceptanceReviewMarkdown);
    setCopiedP2ReadinessAcceptanceReview(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P2 readiness acceptance review copied",
      error: undefined
    }));
  }, [p2ReadinessAcceptanceReviewMarkdown]);

  const downloadP2ReadinessAcceptanceReview = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([p2ReadinessAcceptanceReviewMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    const safeRunId = (p2ReadinessAcceptanceLatestState.acceptance?.runId || "latest").replace(/[^a-z0-9._-]+/giu, "-");
    anchor.href = objectUrl;
    anchor.download = `${safeRunId}-p2-readiness-acceptance-review.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P2 readiness acceptance review download ready",
      error: undefined
    }));
  }, [p2ReadinessAcceptanceLatestState.acceptance?.runId, p2ReadinessAcceptanceReviewMarkdown]);

  const saveP2ReadinessAcceptanceReview = useCallback(async () => {
    setSavingP2ReadinessAcceptanceReview(true);
    try {
      const auditEvent = await buildP2ReadinessAcceptanceReviewAuditEvent({
        acceptance: p2ReadinessAcceptanceLatestState.acceptance ?? null,
        markdown: p2ReadinessAcceptanceReviewMarkdown,
        summary: p2ReadinessAcceptanceSummary
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setP2ReadinessAcceptanceReviewAuditEvent(result.event);
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 readiness acceptance review saved to audit ledger",
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness acceptance review ledger save failed",
        error: result.error ?? "P2 readiness acceptance review ledger save failed"
      }));
    } finally {
      setSavingP2ReadinessAcceptanceReview(false);
    }
  }, [
    p2ReadinessAcceptanceLatestState.acceptance,
    p2ReadinessAcceptanceReviewMarkdown,
    p2ReadinessAcceptanceSummary,
    quantCoreBaseUrl
  ]);

  const copyP2ReadinessEvidenceCoverageReview = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness evidence coverage review copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(p2ReadinessEvidenceCoverageReviewMarkdown);
    setCopiedP2ReadinessEvidenceCoverageReview(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P2 readiness evidence coverage review copied",
      error: undefined
    }));
  }, [p2ReadinessEvidenceCoverageReviewMarkdown]);

  const downloadP2ReadinessEvidenceCoverageReview = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([p2ReadinessEvidenceCoverageReviewMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "p2-readiness-evidence-coverage-review.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P2 readiness evidence coverage review download ready",
      error: undefined
    }));
  }, [p2ReadinessEvidenceCoverageReviewMarkdown]);

  const saveP2ReadinessEvidenceCoverageReview = useCallback(async () => {
    setSavingP2ReadinessEvidenceCoverageReview(true);
    try {
      const auditEvent = await buildP2ReadinessEvidenceCoverageReviewAuditEvent({
        coverage: p2ReadinessEvidenceCoverage,
        markdown: p2ReadinessEvidenceCoverageReviewMarkdown
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setP2ReadinessEvidenceCoverageReviewAuditEvent(result.event);
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 readiness evidence coverage review saved to audit ledger",
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 readiness evidence coverage review ledger save failed",
        error: result.error ?? "P2 readiness evidence coverage review ledger save failed"
      }));
    } finally {
      setSavingP2ReadinessEvidenceCoverageReview(false);
    }
  }, [
    p2ReadinessEvidenceCoverage,
    p2ReadinessEvidenceCoverageReviewMarkdown,
    quantCoreBaseUrl
  ]);

  const copyP2ManifestChainPreflightReview = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 manifest chain preflight review copy failed",
        error: "Clipboard is unavailable"
      }));
      return;
    }

    await navigator.clipboard.writeText(p2ManifestChainPreflightReviewMarkdown);
    setCopiedP2ManifestChainPreflightReview(true);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P2 manifest chain preflight review copied",
      error: undefined
    }));
  }, [p2ManifestChainPreflightReviewMarkdown]);

  const downloadP2ManifestChainPreflightReview = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([p2ManifestChainPreflightReviewMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "p2-manifest-chain-preflight-review.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P2 manifest chain preflight review download ready",
      error: undefined
    }));
  }, [p2ManifestChainPreflightReviewMarkdown]);

  const saveP2ManifestChainPreflightReview = useCallback(async () => {
    setSavingP2ManifestChainPreflightReview(true);
    try {
      const auditEvent = await buildP2ManifestChainPreflightReviewAuditEvent({
        markdown: p2ManifestChainPreflightReviewMarkdown,
        preflight: p2ManifestChainPreflightLatestState.preflight ?? null,
        summary: p2ManifestChainPreflightSummary
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setP2ManifestChainPreflightReviewAuditEvent(result.event);
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P2 manifest chain preflight review saved to audit ledger",
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P2 manifest chain preflight review ledger save failed",
        error: result.error ?? "P2 manifest chain preflight review ledger save failed"
      }));
    } finally {
      setSavingP2ManifestChainPreflightReview(false);
    }
  }, [
    p2ManifestChainPreflightLatestState.preflight,
    p2ManifestChainPreflightReviewMarkdown,
    p2ManifestChainPreflightSummary,
    quantCoreBaseUrl
  ]);

  const saveP0AcceptanceReview = useCallback(async () => {
    setSavingP0AcceptanceReview(true);
    try {
      const auditEvent = await buildP0AcceptanceReviewAuditEvent({
        acceptance: p0AcceptanceLatestState.acceptance ?? null,
        markdown: p0AcceptanceReviewMarkdown,
        summary: p0AcceptanceSummary
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 acceptance review saved to audit ledger",
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 acceptance review ledger save failed",
        error: result.error ?? "P0 acceptance review ledger save failed"
      }));
    } finally {
      setSavingP0AcceptanceReview(false);
    }
  }, [
    p0AcceptanceLatestState.acceptance,
    p0AcceptanceReviewMarkdown,
    p0AcceptanceSummary,
    quantCoreBaseUrl
  ]);

  const downloadP0ReadinessReport = useCallback(() => {
    const objectUrl = URL.createObjectURL(
      new Blob([p0PlatformReadinessReportMarkdown], { type: "text/markdown;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "p0-readiness-report.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "P0 readiness report download ready",
      error: undefined
    }));
  }, [p0PlatformReadinessReportMarkdown]);

  const saveP0ReadinessReport = useCallback(async () => {
    setSavingP0ReadinessReport(true);
    try {
      const auditEvent = await buildP0PlatformReadinessReportAuditEvent({
        backlogItems: p0PlatformBacklogItems,
        completionChecklist: p0CompletionChecklist,
        evidenceLink: p0ActionOutcomeEvidenceLink,
        markdown: p0PlatformReadinessReportMarkdown,
        outcome: p0PlatformActionOutcome,
        paperPreflight: p0PaperExecutionPreflight,
        summary: p0PlatformReadinessSummary
      });
      const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
      if (result.source === "core" && result.event) {
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 readiness report saved to audit ledger",
          error: undefined
        }));
        return;
      }

      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 readiness report ledger save failed",
        error: result.error ?? "P0 readiness report ledger save failed"
      }));
    } finally {
      setSavingP0ReadinessReport(false);
    }
  }, [
    p0ActionOutcomeEvidenceLink,
    p0CompletionChecklist,
    p0PlatformActionOutcome,
    p0PlatformBacklogItems,
    p0PaperExecutionPreflight,
    p0PlatformReadinessReportMarkdown,
    p0PlatformReadinessSummary,
    quantCoreBaseUrl
  ]);

  const focusLatestP0ReadinessReport = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidReportQuery) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidReportQuery);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidReportQuery);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 readiness report selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidReportQuery, selectProductWorkArea]);

  const focusLatestP0PreparationEvidence = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 data preparation evidence selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId, selectProductWorkArea]);

  const focusLatestP0Progress = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 progress selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery, selectProductWorkArea]);

  const focusLatestP0Preflight = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 preflight selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery, selectProductWorkArea]);

  const focusLatestP0Completion = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 completion selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery, selectProductWorkArea]);

  const openLatestP0CompletionGap = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId) {
      focusLatestP0Completion();
      return;
    }
    if (auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery) {
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
    }
    selectProductWorkArea(auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 completion gap selected",
      error: undefined
    }));
  }, [
    auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId,
    auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery,
    focusLatestP0Completion,
    selectProductWorkArea
  ]);

  const focusLatestP0BacklogReadiness = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 backlog readiness selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery, selectProductWorkArea]);

  const focusLatestP0CurrentGapReadiness = useCallback(() => {
    if (!auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery) {
      selectProductWorkArea("audit");
      return;
    }
    setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery);
    setAuditEvidenceReportOffset(0);
    replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery);
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 current gap readiness selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery, selectProductWorkArea]);

  const focusPortfolioOrderStateAuditQuery = useCallback(
    (query: string) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(normalizedQuery);
      setAuditEvidenceReportOffset(0);
      setPortfolioPaperOrderAuditQuery(normalizedQuery);
      setPortfolioPaperOrderAuditOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(normalizedQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Portfolio order state evidence selected",
        error: undefined
      }));
    },
    [selectProductWorkArea]
  );

  const openP0ActionOutcomeEvidence = useCallback(
    (outcome: P0PlatformActionOutcome) => {
      if (!outcome.evidenceId) {
        selectProductWorkArea(outcome.targetWorkspaceId);
        return;
      }

      const evidenceId = outcome.evidenceId;

      if (outcome.state === "paper_execution") {
        setActiveWorkAreaId("execution");
        setActiveLoopStepId("paper");
        setActiveWorkflowStageId("execution");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution evidence selected",
          error: undefined
        }));
        return;
      }

      if (outcome.state === "audit_run" || outcome.state === "live_ready") {
        setResearchRunExportBrowserQuery(evidenceId);
        setResearchRunImportDiffQuery(evidenceId);
        setResearchRunImportAuditQuery(evidenceId);
        void (async () => {
          const historyRun = runHistory.find((run) => run.runId === evidenceId);
          if (historyRun) {
            await replayRun(historyRun);
            return;
          }

          const detail = await loadResearchRunDetail(quantCoreBaseUrl, evidenceId);
          if (detail.run) {
            await replayRun(detail.run);
            return;
          }

          setActiveWorkAreaId("audit");
          setActiveLoopStepId("backtest");
          setActiveWorkflowStageId("execution");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P0 evidence replay failed",
            error: detail.error ?? `P0 evidence run ${evidenceId} was not found`
          }));
        })();
        return;
      }

      selectProductWorkArea(outcome.targetWorkspaceId);
    },
    [quantCoreBaseUrl, replayRun, runHistory, selectProductWorkArea]
  );

  const inspectRefreshEvidenceRun = useCallback(
    (runId: string) => {
      setWatchlistCacheRefreshRunSelection(runId);
      selectProductWorkArea("market");
    },
    [selectProductWorkArea, setWatchlistCacheRefreshRunSelection]
  );

  const openSelectedRefreshCoverageInResearch = useCallback(() => {
    selectProductWorkArea("research");
  }, [selectProductWorkArea]);

  const submitSymbol = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const searchMarket = resolveMarketSearchMarket(marketDraft, symbolDraft);
      const normalizedSymbol = buildInstrumentFromSymbol(searchMarket, symbolDraft)?.symbol;
      const matchedSuggestion = searchSuggestions.find(
        (suggestion) => suggestion.market === searchMarket && suggestion.symbol === normalizedSymbol
      );
      const instrument = matchedSuggestion
        ? {
            symbol: matchedSuggestion.symbol,
            name: matchedSuggestion.name,
            market: matchedSuggestion.market,
            changePct: 0
          }
        : buildInstrumentFromSymbol(searchMarket, symbolDraft);
      if (!instrument) {
        return;
      }
      selectInstrument(instrument, activeWorkAreaId);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
    },
    [activeWorkAreaId, marketDraft, searchSuggestions, selectInstrument, symbolDraft]
  );

  const selectSearchSuggestion = useCallback(
    (suggestion: MarketSearchSuggestion) => {
      setMarketDraft(suggestion.market);
      setSymbolDraft(suggestion.symbol);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      selectInstrument(
        {
          symbol: suggestion.symbol,
          name: suggestion.name,
          market: suggestion.market,
          changePct: 0
        },
        activeWorkAreaId
      );
    },
    [activeWorkAreaId, selectInstrument]
  );

  const refreshSearchSuggestionCache = useCallback(
    async (suggestion: MarketSearchSuggestion) => {
      const timeframe = workspace.selectedTimeframe;
      setMarketDraft(suggestion.market);
      setSymbolDraft(suggestion.symbol);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      selectInstrument(
        {
          symbol: suggestion.symbol,
          name: suggestion.name,
          market: suggestion.market,
          changePct: 0
        },
        activeWorkAreaId
      );
      await refreshCacheContext({
        market: suggestion.market,
        symbol: suggestion.symbol,
        timeframe,
        rowCount: suggestion.cache?.rowCount ?? 0,
        startTimestamp: suggestion.cache?.startTimestamp ?? null,
        endTimestamp: suggestion.cache?.endTimestamp ?? null,
        freshness: suggestion.cache?.freshness ?? "empty",
        ageHours: suggestion.cache?.ageHours ?? null
      });
      setKlinesState(
        await loadMarketKlines(quantCoreBaseUrl, {
          market: suggestion.market,
          symbol: suggestion.symbol,
          timeframe,
          limit: chartKlineLimit
        })
      );
    },
    [activeWorkAreaId, refreshCacheContext, selectInstrument, workspace.selectedTimeframe]
  );

  useEffect(() => {
    void refreshWorkspace();
    return () => aiReviewRunRestoreAbortControllerRef.current?.abort();
  }, [refreshWorkspace]);

  useEffect(() => {
    if (activeWorkAreaId !== "research" && activeWorkAreaId !== "backtest" && activeWorkAreaId !== "ai-review") {
      return;
    }
    const latestRun = findLatestResearchRunForContext(runHistory, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    });
    if (!latestRun) {
      return;
    }
    const workspaceNeedsDetailBinding =
      activeWorkAreaId !== "research"
      && (
        workspace.researchRun?.runId !== latestRun.runId
        || !workspace.researchRun.dataSnapshot?.snapshotHash
      );
    if (latestRun.dataSnapshot?.snapshotHash) {
      if (workspaceNeedsDetailBinding) {
        setWorkspaceState((current) => ({
          ...current,
          workspace: workspaceFromResearchRunAudit(current.workspace, latestRun),
          statusLabel: activeWorkAreaId === "backtest"
            ? "已载入当前标的最近的已审计回测运行"
            : "已载入当前标的最近的已审计研究运行",
          error: undefined
        }));
      }
      return;
    }
    let cancelled = false;
    void loadResearchRunDetail(quantCoreBaseUrl, latestRun.runId).then((detail) => {
      if (cancelled || detail.source !== "core" || detail.run?.runId !== latestRun.runId) {
        return;
      }
      setRunHistoryState((current) => ({
        ...current,
        runs: current.runs.map((run) => run.runId === detail.run!.runId ? detail.run! : run)
      }));
      if (activeWorkAreaId !== "research") {
        setWorkspaceState((current) => ({
          ...current,
          workspace: workspaceFromResearchRunAudit(current.workspace, detail.run!),
          statusLabel: activeWorkAreaId === "backtest"
            ? "已载入当前标的最近的已审计回测运行"
            : "已载入当前标的最近的已审计研究运行",
          error: undefined
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeWorkAreaId,
    runHistory,
    workspace.researchRun?.dataSnapshot?.snapshotHash,
    workspace.researchRun?.runId,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  useEffect(() => {
    if (
      (activeWorkAreaId !== "ai-review" && activeWorkAreaId !== "portfolio")
      || researchRunContextBinding.canUseRun
    ) {
      return;
    }
    const latestRun = findLatestResearchRunForContext(runHistory, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    });
    if (!latestRun) {
      return;
    }
    setWorkspaceState((current) => ({
      ...current,
      workspace: workspaceFromResearchRunAudit(current.workspace, latestRun),
      statusLabel: "已载入当前标的最近的已审计研究运行",
      error: undefined
    }));
  }, [
    activeWorkAreaId,
    researchRunContextBinding.canUseRun,
    runHistory,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  useEffect(() => {
    if (activeWorkAreaId !== "ai-review" && activeWorkAreaId !== "execution") {
      initialAiReviewRunIdRef.current = null;
      aiReviewRunRestoreAbortControllerRef.current?.abort();
    }
  }, [activeWorkAreaId]);

  useEffect(() => {
    void refreshChart();
  }, [refreshChart]);

  useEffect(() => {
    void refreshStrategyLibrary();
  }, [refreshStrategyLibrary]);

  useEffect(() => {
    void refreshStrategyProductionBinding();
  }, [refreshStrategyProductionBinding]);

  useEffect(() => {
    if (activeWorkAreaId !== "portfolio") return;
    void refreshPortfolioProductionRisk(true);
    const intervalId = window.setInterval(
      () => void refreshPortfolioProductionRisk(),
      AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS
    );
    return () => {
      portfolioProductionRiskRequestIdRef.current += 1;
      window.clearInterval(intervalId);
    };
  }, [activeWorkAreaId, refreshPortfolioProductionRisk]);

  useEffect(() => {
    const handoffRunId = activeWorkAreaId === "backtest"
      ? currentResearchRunId
      : activeWorkAreaId === "ai-review"
        && aiReviewStage3PrimaryCandidateAvailable
        && aiReviewStage3PrimaryReference
        && aiReviewStage3PrimaryReference.candidateRevision === aiReviewStage3PrimaryReference.strategyRevision
        ? aiReviewStage3PrimaryReference.sourceRunId
        : null;
    if (!handoffRunId) {
      setProductionStrategyHandoffState(initialProductionStrategyHandoffState);
      return;
    }
    let cancelled = false;
    setProductionStrategyHandoffState((current) =>
      current.handoff?.runId === handoffRunId
        ? current
        : initialProductionStrategyHandoffState
    );
    void loadResearchRunProductionStrategyHandoff(
      quantCoreBaseUrl,
      handoffRunId
    ).then((result) => {
      if (!cancelled) {
        setProductionStrategyHandoffState(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeWorkAreaId,
    aiReviewStage3PrimaryCandidateAvailable,
    aiReviewStage3PrimaryReference?.candidateRevision,
    aiReviewStage3PrimaryReference?.sourceRunId,
    aiReviewStage3PrimaryReference?.strategyRevision,
    currentResearchRunId,
    strategyProductionBindingState.binding?.auditRunId,
    strategyProductionBindingState.binding?.bindingId
  ]);

  useEffect(() => {
    void refreshResearchNote();
  }, [refreshResearchNote]);

  useEffect(() => {
    researchNoteDraftGenerationAbortControllerRef.current?.abort();
    researchNoteDraftGenerationAbortControllerRef.current = null;
    researchNoteDraftGenerationRequestIdRef.current += 1;
    setIsGeneratingResearchNoteDraft(false);
    setResearchNoteExternalDataApproved(false);
    setResearchNoteGenerationError(null);
    setResearchNoteGenerationStatus(null);
    if (activeWorkAreaId !== "research" && activeWorkAreaId !== "strategy") {
      return;
    }
    const controller = new AbortController();
    void loadAiReviewProviders(quantCoreBaseUrl, controller.signal).then((result) => {
      if (controller.signal.aborted) {
        return;
      }
      const localProvider: AiReviewProviderStatus = {
        providerId: "local",
        configured: true,
        model: null,
        sanitizedBaseUrl: null
      };
      const providers = result.source === "core" && result.providers.length
        ? result.providers
        : [localProvider];
      setResearchNoteProviders(providers);
      setResearchNoteProviderId(
        providers.find((provider) => provider.providerId !== "local" && provider.configured)?.providerId
          ?? "local"
      );
      if (result.source !== "core") {
        setResearchNoteGenerationStatus("AI Provider 状态暂不可用，可继续生成本地草稿。");
      }
    });
    return () => {
      controller.abort();
      researchNoteDraftGenerationAbortControllerRef.current?.abort();
    };
  }, [
    activeWorkAreaId,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  useEffect(() => {
    void refreshHandoffNotes();
  }, [refreshHandoffNotes]);

  useEffect(() => {
    void refreshSettingsStatus();
  }, [refreshSettingsStatus]);

  useEffect(() => {
    void refreshGoldenPathStatus();
  }, [paperExecutionRecord?.executionId, refreshGoldenPathStatus, workspace.researchRun?.runId]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("aiqt.locale", locale);
  }, [locale]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemColorScheme = () => {
      setSystemColorScheme(resolveSystemColorScheme(media.matches));
      setColorSchemePreference(null);
    };
    syncSystemColorScheme();
    media.addEventListener("change", syncSystemColorScheme);
    return () => media.removeEventListener("change", syncSystemColorScheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = colorScheme;
    document.documentElement.style.colorScheme = colorScheme;
  }, [colorScheme]);

  useEffect(() => {
    if (
      pendingMarketAiSelectionResearchOrigin
      && (
        pendingMarketAiSelectionResearchOrigin.market !== workspace.selectedInstrument.market
        || pendingMarketAiSelectionResearchOrigin.symbol !== workspace.selectedInstrument.symbol
        || workspace.selectedTimeframe !== "1d"
      )
    ) {
      setPendingMarketAiSelectionResearchOrigin(null);
    }
  }, [
    pendingMarketAiSelectionResearchOrigin,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe,
  ]);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--aiqt-text-scale", String(textScale));
    window.localStorage.setItem("aiqt.text-scale", String(textScale));
  }, [textScale]);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const url = new URL(replaceAiReviewRunIdInUrl(
      currentUrl.toString(),
      activeWorkAreaId,
      activeWorkAreaId === "ai-review"
        ? currentResearchRunId ?? initialAiReviewRunIdRef.current
        : currentResearchRunId
    ));
    const shouldSyncResearchContext = activeWorkAreaId === "market"
      || activeWorkAreaId === "market-information"
      || activeWorkAreaId === "research";
    const selectionOrigin =
      activeWorkAreaId === "research"
      && workspace.selectedTimeframe === "1d"
      && pendingMarketAiSelectionResearchOrigin?.market === workspace.selectedInstrument.market
      && pendingMarketAiSelectionResearchOrigin.symbol === workspace.selectedInstrument.symbol
        ? pendingMarketAiSelectionResearchOrigin
        : null;
    const runIdChanged = url.searchParams.toString() !== currentUrl.searchParams.toString();
    const contextChanged =
      shouldSyncResearchContext &&
      (url.searchParams.get("market") !== workspace.selectedInstrument.market ||
        url.searchParams.get("symbol") !== workspace.selectedInstrument.symbol ||
        url.searchParams.get("timeframe") !== workspace.selectedTimeframe);
    const selectionOriginChanged =
      url.searchParams.get("selectionId") !== (selectionOrigin?.selectionId ?? null)
      || url.searchParams.get("candidateEvidenceId") !== (
        selectionOrigin?.candidateEvidenceId ?? null
      );
    if (url.searchParams.get("workspace") === activeWorkAreaId
      && !url.searchParams.has("workflow")
      && !contextChanged
      && !runIdChanged
      && !selectionOriginChanged) {
      return;
    }
    url.searchParams.set("workspace", activeWorkAreaId);
    url.searchParams.delete("workflow");
    if (shouldSyncResearchContext) {
      url.searchParams.set("market", workspace.selectedInstrument.market);
      url.searchParams.set("symbol", workspace.selectedInstrument.symbol);
      url.searchParams.set("timeframe", workspace.selectedTimeframe);
    }
    if (selectionOrigin) {
      url.searchParams.set("selectionId", selectionOrigin.selectionId);
      url.searchParams.set("candidateEvidenceId", selectionOrigin.candidateEvidenceId);
    } else {
      url.searchParams.delete("selectionId");
      url.searchParams.delete("candidateEvidenceId");
    }
    window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }, [
    activeWorkAreaId,
    currentResearchRunId,
    pendingMarketAiSelectionResearchOrigin,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  useEffect(() => {
    setMarketDraft(workspace.selectedInstrument.market);
    setSymbolDraft(workspace.selectedInstrument.symbol);
    setSearchSuggestions([]);
    setIsSearchOpen(false);
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol]);

  useEffect(() => {
    const query = symbolDraft.trim();
    const requestId = symbolSearchRequestIdRef.current + 1;
    symbolSearchRequestIdRef.current = requestId;

    if (!isSearchOpen) {
      setIsSymbolSearching(false);
      return;
    }

    if (!query) {
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      setIsSymbolSearching(false);
      return;
    }

    setIsSymbolSearching(true);
    setIsSearchOpen(true);
    const timeoutId = window.setTimeout(async () => {
      const searchMarket = resolveMarketSearchMarket(marketDraft, query);
      const result = await loadMarketSearch(quantCoreBaseUrl, { market: searchMarket, query, limit: 8, timeframe: workspace.selectedTimeframe });
      if (symbolSearchRequestIdRef.current === requestId) {
        setSearchSuggestions(result.results);
        setIsSearchOpen(true);
        setIsSymbolSearching(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [isSearchOpen, marketDraft, symbolDraft, workspace.selectedTimeframe]);

  useEffect(() => {
    if (!isChartExpanded) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsChartExpanded(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isChartExpanded]);

  useEffect(() => {
    if (isResearchPipelineConfirmationOpen && !researchPipelineConfirmationDialogRef.current?.open) {
      researchPipelineConfirmationDialogRef.current?.showModal();
      researchPipelineConfirmationCancelButtonRef.current?.focus();
    }
  }, [isResearchPipelineConfirmationOpen]);

  useEffect(() => {
    if (isLiveTradingGateDialogOpen && !liveTradingGateDialogRef.current?.open) {
      liveTradingGateDialogRef.current?.showModal();
      liveTradingGateDialogRef.current
        ?.querySelector<HTMLInputElement>('input[placeholder="实名操作人"]')
        ?.focus();
    }
  }, [isLiveTradingGateDialogOpen]);

  useEffect(() => {
    if (pendingSettingsWorkAreaId && !settingsUnsavedDialogRef.current?.open) {
      settingsUnsavedDialogRef.current?.showModal();
      settingsUnsavedContinueButtonRef.current?.focus();
    }
  }, [pendingSettingsWorkAreaId]);

  useEffect(() => {
    if (!hasUnsavedSettingsConfiguration) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedSettingsConfiguration]);

  useEffect(() => {
    if (!researchCompletionNotice) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setResearchCompletionNotice((current) =>
        current?.runId === researchCompletionNotice.runId ? null : current
      );
    }, 6000);
    return () => window.clearTimeout(timeoutId);
  }, [researchCompletionNotice]);

  const runActiveWorkflowAction = useCallback(() => {
    if (activeLoopStepId === "strategy") {
      selectProductWorkArea("strategy");
      return;
    }
    if (activeLoopStepId === "agent-review") {
      runAiWorkbenchAction("debate");
      return;
    }
    if (activeLoopStepId === "paper") {
      void submitPaperExecution();
      return;
    }
    void runPipeline();
  }, [activeLoopStepId, runAiWorkbenchAction, runPipeline, selectProductWorkArea, submitPaperExecution]);

  const openLiveTradingGate = useCallback(async () => {
    setAutoTradingSnapshot(null);
    try {
      setAutoTradingSnapshot(await loadAutoTradingSnapshot(quantCoreBaseUrl));
    } catch {
      setAutoTradingSnapshot(null);
    }
    setIsLiveTradingGateDialogOpen(true);
  }, [quantCoreBaseUrl]);

  const completeLiveTradingGate = useCallback(async () => {
    setAutoTradingSnapshot(null);
    const snapshot = await loadAutoTradingSnapshot(quantCoreBaseUrl);
    setAutoTradingSnapshot(snapshot);
    await Promise.all([
      refreshGoldenPathStatus(),
      refreshSettingsStatus()
    ]);
    setIsLiveTradingGateDialogOpen(false);
  }, [quantCoreBaseUrl, refreshGoldenPathStatus, refreshSettingsStatus]);

  const runGoldenPathActionById = useCallback(
    async (
      actionId: string | null | undefined,
      targetWorkspace?: string | null,
      latestRunIdOverride?: string | null,
      automated = false
    ): Promise<boolean> => {
      automatedTradingWorkflowActionErrorRef.current = null;
      if (actionId === "review-production-handoff") {
        selectProductWorkArea("execution");
        return false;
      }
      const executableActionId = normalizeP0CurrentGapActionId(actionId);
      if (!executableActionId) {
        runActiveWorkflowAction();
        return false;
      }
      if (executableActionId === "refresh-data") {
        return refreshSelectedMarketCache();
      }
      if (executableActionId === "refresh-watchlist-cache") {
        return refreshWatchlistMarketCache();
      }
      if (executableActionId === "run-pipeline") {
        return runPipeline(automated ? "accepted" : undefined);
      }
      if (executableActionId === "run-ai-review") {
        const runId = latestRunIdOverride ?? goldenPath?.latestRunId;
        selectProductWorkArea("ai-review");
        if (!runId) {
          if (!automated) {
            await runPipeline();
          }
          return false;
        }
        setIsRunningP0AiReview(true);
        try {
          const result = await runP0AiReview(quantCoreBaseUrl, {
            runId,
            market: workspace.selectedInstrument.market,
            symbol: workspace.selectedInstrument.symbol,
            timeframe: workspace.selectedTimeframe
          });
          setWorkspaceState((current) => ({
            ...current,
            source: result.source,
            statusLabel: result.statusLabel,
            error: result.error
          }));
          if (result.aiReview) {
            await refreshGoldenPathStatus();
          }
          return Boolean(result.aiReview);
        } finally {
          setIsRunningP0AiReview(false);
        }
      }
      if (executableActionId === "submit-paper-order") {
        const goldenPathRunId = latestRunIdOverride ?? goldenPath?.latestRunId;
        const runIsBound = await ensureGoldenPathLatestRunBound(goldenPathRunId);
        if (goldenPathRunId && runIsBound) {
          await submitPaperExecution(goldenPathRunId);
          return true;
        }
        return false;
      }
      if (executableActionId === "fix-paper-handoff") {
        selectProductWorkArea("execution");
        return false;
      }
      if (executableActionId === "certify-live-adapter") {
        openLiveTradingGate();
        return false;
      }
      if (targetWorkspace && productWorkAreaIds.includes(targetWorkspace as ProductWorkAreaId)) {
        selectProductWorkArea(targetWorkspace as ProductWorkAreaId);
        return true;
      }
      return false;
    },
    [
      refreshSelectedMarketCache,
      refreshWatchlistMarketCache,
      ensureGoldenPathLatestRunBound,
      goldenPath?.latestRunId,
      openLiveTradingGate,
      quantCoreBaseUrl,
      refreshGoldenPathStatus,
      runActiveWorkflowAction,
      runPipeline,
      selectProductWorkArea,
      submitPaperExecution,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]
  );

  useEffect(() => {
    if (!pendingStrategyGovernanceAction) {
      return;
    }
    if (isRunning || isSavingStrategy) {
      return;
    }
    const strategy = visibleStrategyLibrary.find((item) => item.revision === pendingStrategyGovernanceAction.revision);
    if (!strategy || !strategyLibraryItemMatchesWorkspace(workspace, strategy)) {
      return;
    }
    setPendingStrategyGovernanceAction(null);
    runGoldenPathActionById("run-pipeline", "strategy");
  }, [
    isRunning,
    isSavingStrategy,
    pendingStrategyGovernanceAction,
    runGoldenPathActionById,
    visibleStrategyLibrary,
    workspace
  ]);

  const runGoldenPathAction = useCallback(() => {
    const action = goldenPath?.nextAction;
    if (!action) {
      runActiveWorkflowAction();
      return;
    }
    runGoldenPathActionById(action.id, action.targetWorkspace);
  }, [goldenPath?.nextAction, runActiveWorkflowAction, runGoldenPathActionById]);

  const runWorkspaceContextAction = useCallback(() => {
    if (!activeWorkspaceContext?.actionId) {
      return;
    }
    runGoldenPathActionById(
      activeWorkspaceContext.actionId,
      activeWorkspaceContext.actionTargetWorkspaceId ?? activeWorkspaceContext.workspaceId
    );
  }, [activeWorkspaceContext, runGoldenPathActionById]);

  const isGoldenPathActionDisabledById = useCallback(
    (actionId: string | null | undefined) => {
      const executableActionId = normalizeP0CurrentGapActionId(actionId);
      if (isRefreshing || isRunning) {
        return true;
      }
      if (executableActionId === "refresh-data") {
        return Boolean(refreshingCacheKey) || marketDataRefreshGuard.blocked;
      }
      if (executableActionId === "refresh-watchlist-cache") {
        return isRefreshingWatchlistCache || Boolean(refreshingCacheKey) || marketDataRefreshGuard.blocked;
      }
      if (executableActionId === "run-pipeline") {
        return !researchPipelinePreflight.canRun;
      }
      if (executableActionId === "run-ai-review") {
        return isRunningP0AiReview;
      }
      if (executableActionId === "submit-paper-order") {
        const canRebindGoldenPathRun =
          !strategyDraftRequiresReaudit &&
          Boolean(goldenPath?.latestRunId) &&
          !researchRunContextBinding.canUseRun;
        return (
          isSubmittingPaperExecution ||
          strategyDraftRequiresReaudit ||
          (!canRebindGoldenPathRun &&
            (!researchRunContextBinding.canUseRun || riskApprovalSummary.status === "blocked"))
        );
      }
      return false;
    },
    [
      goldenPath?.latestRunId,
      isRefreshing,
      isRefreshingWatchlistCache,
      isRunning,
      isRunningP0AiReview,
      isSubmittingPaperExecution,
      marketDataRefreshGuard.blocked,
      refreshingCacheKey,
      researchPipelinePreflight.canRun,
      researchRunContextBinding.canUseRun,
      riskApprovalSummary.status,
      strategyDraftRequiresReaudit
    ]
  );

  const goldenPathActionId = goldenPath?.nextAction?.id;
  const isGoldenPathActionDisabled = isGoldenPathActionDisabledById(goldenPathActionId);
  const workspaceContextActionId = activeWorkspaceContext?.actionId;
  const isWorkspaceContextActionDisabled =
    !workspaceContextActionId || isGoldenPathActionDisabledById(workspaceContextActionId);
  const goldenPathActionHint =
    strategyDraftReauditHint(i18n, goldenPathActionId, strategyDraftRequiresReaudit) ??
    goldenPathActionPreflightHint(i18n, goldenPathActionId, researchPipelinePreflight);
  const workspaceContextActionHint =
    strategyDraftReauditHint(i18n, workspaceContextActionId, strategyDraftRequiresReaudit) ??
    goldenPathActionPreflightHint(i18n, workspaceContextActionId, researchPipelinePreflight);

  const stopAutomatedTradingWorkflow = useCallback((message: string) => {
    automatedTradingWorkflowRunIdRef.current += 1;
    automatedTradingWorkflowContextRef.current = null;
    automatedTradingWorkflowActionKeyRef.current = null;
    automatedTradingWorkflowActionInFlightRef.current = false;
    setAutomatedTradingWorkflowStatus(message);
    setIsAutomatedTradingWorkflowRunning(false);
  }, []);

  const runAutomatedTradingWorkflow = useCallback(() => {
    if (isAutomatedTradingWorkflowRunning) {
      return;
    }
    const runId = automatedTradingWorkflowRunIdRef.current + 1;
    automatedTradingWorkflowRunIdRef.current = runId;
    automatedTradingWorkflowContextRef.current = [
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ].join(":");
    automatedTradingWorkflowActionKeyRef.current = null;
    automatedTradingWorkflowActionInFlightRef.current = true;
    setAutomatedTradingWorkflowStatus(
      i18n.locale === "zh-CN" ? "正在读取最新流程状态…" : "Loading the latest workflow status…"
    );
    setIsAutomatedTradingWorkflowRunning(true);
    void refreshGoldenPathStatus().then((result) => {
      if (automatedTradingWorkflowRunIdRef.current !== runId) {
        return;
      }
      automatedTradingWorkflowActionInFlightRef.current = false;
      if (!result.goldenPath) {
        stopAutomatedTradingWorkflow(
          i18n.locale === "zh-CN"
            ? `自动流程无法启动：${result.error ?? "未读取到流程状态。"}`
            : `The automated workflow could not start: ${result.error ?? "No workflow status was returned."}`
        );
        return;
      }
      setAutomatedTradingWorkflowStatus(
        i18n.locale === "zh-CN" ? "流程已就绪，正在切换到下一步…" : "Workflow ready. Opening the next step…"
      );
    });
  }, [
    i18n.locale,
    isAutomatedTradingWorkflowRunning,
    refreshGoldenPathStatus,
    stopAutomatedTradingWorkflow,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const runAutomatedTradingWorkflowFromCurrentWorkspace = useCallback(() => {
    const targetWorkspace = goldenPath?.nextAction?.targetWorkspace;
    const targetWorkAreaId = targetWorkspace && productWorkAreaIds.includes(targetWorkspace as ProductWorkAreaId)
      ? targetWorkspace as ProductWorkAreaId
      : null;
    const leaveSettingsAndRun = targetWorkAreaId
      ? () => {
          commitProductWorkAreaSelection(targetWorkAreaId);
          runAutomatedTradingWorkflow();
        }
      : runAutomatedTradingWorkflow;
    if (targetWorkAreaId && deferSettingsNavigation(targetWorkAreaId, leaveSettingsAndRun)) return;
    runAutomatedTradingWorkflow();
  }, [
    commitProductWorkAreaSelection,
    deferSettingsNavigation,
    goldenPath?.nextAction?.targetWorkspace,
    runAutomatedTradingWorkflow,
  ]);

  useEffect(() => {
    if (
      !isAutomatedTradingWorkflowRunning ||
      !goldenPath ||
      automatedTradingWorkflowActionInFlightRef.current
    ) {
      return;
    }
    const currentContextKey = [
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ].join(":");
    if (automatedTradingWorkflowContextRef.current !== currentContextKey) {
      stopAutomatedTradingWorkflow(
        i18n.locale === "zh-CN"
          ? "自动流程已暂停：标的或周期已改变。"
          : "The automated workflow paused because the instrument or timeframe changed."
      );
      return;
    }
    const action = goldenPath.nextAction;
    if (!action) {
      selectProductWorkArea("audit");
      stopAutomatedTradingWorkflow(
        i18n.locale === "zh-CN"
          ? "自动流程已完成，审计证据已就绪。"
          : "The automated workflow is complete and audit evidence is ready."
      );
      return;
    }
    if (action.id === "certify-live-adapter") {
      openLiveTradingGate();
      stopAutomatedTradingWorkflow(
        i18n.locale === "zh-CN"
          ? "可自动执行的模拟交易流程已完成；实盘操作需要人工确认。"
          : "The automated paper-trading flow is complete; live trading requires manual confirmation."
      );
      return;
    }
    const targetWorkspace = productWorkAreaIds.includes(action.targetWorkspace as ProductWorkAreaId)
      ? (action.targetWorkspace as ProductWorkAreaId)
      : null;
    if (targetWorkspace && activeWorkAreaId !== targetWorkspace) {
      const targetWorkArea = productWorkAreas.find((area) => area.id === targetWorkspace);
      const targetLabel = targetWorkArea ? i18n.productWorkAreaLabel(targetWorkArea) : targetWorkspace;
      setAutomatedTradingWorkflowStatus(
        i18n.locale === "zh-CN" ? `正在前往：${targetLabel}` : `Opening: ${targetLabel}`
      );
      selectProductWorkArea(targetWorkspace);
      return;
    }
    if (automatedTradingWorkflowRequiresManualAction(action.id)) {
      stopAutomatedTradingWorkflow(
        i18n.locale === "zh-CN"
          ? "自动流程已暂停：执行交接需要人工复核。"
          : "The automated workflow paused because the execution handoff requires manual review."
      );
      return;
    }
    if (action.id === "run-pipeline" && isChartLoading) {
      return;
    }
    if (isGoldenPathActionDisabledById(action.id)) {
      stopAutomatedTradingWorkflow(
        goldenPathActionHint ??
          goldenPathDetail(
            i18n,
            goldenPath.steps.find((step) => step.id === goldenPath.currentStepId),
            action.reason,
            goldenPath
          )
      );
      return;
    }

    const actionKey = automatedTradingWorkflowActionKey(goldenPath);
    if (!actionKey || automatedTradingWorkflowActionKeyRef.current === actionKey) {
      stopAutomatedTradingWorkflow(
        i18n.locale === "zh-CN"
          ? "自动流程已暂停：当前步骤执行后未推进，请检查页面中的阻断原因。"
          : "The automated workflow paused because the current step did not advance."
      );
      return;
    }

    const runId = automatedTradingWorkflowRunIdRef.current;
    const actionLabel = goldenPathActionLabel(i18n, action);
    automatedTradingWorkflowActionKeyRef.current = actionKey;
    automatedTradingWorkflowActionInFlightRef.current = true;
    setAutomatedTradingWorkflowStatus(
      i18n.locale === "zh-CN" ? `正在自动执行：${actionLabel}` : `Running automatically: ${actionLabel}`
    );
    void (async () => {
      try {
        const executed = await runGoldenPathActionById(
          action.id,
          action.targetWorkspace,
          goldenPath.latestRunId,
          true
        );
        if (automatedTradingWorkflowRunIdRef.current !== runId) {
          return;
        }
        const nextResult = await refreshGoldenPathStatus();
        if (automatedTradingWorkflowRunIdRef.current !== runId) {
          return;
        }
        automatedTradingWorkflowActionInFlightRef.current = false;
        const nextGoldenPath = nextResult.goldenPath;
        if (!executed || !nextGoldenPath) {
          const actionError = automatedTradingWorkflowActionErrorRef.current;
          stopAutomatedTradingWorkflow(
            i18n.locale === "zh-CN"
              ? `自动流程已暂停：${nextResult.error ?? (actionError ? `${actionLabel} 未完成：${actionError}` : `${actionLabel} 未完成。`)}`
              : `The automated workflow paused: ${nextResult.error ?? (actionError ? `${actionLabel} did not complete: ${actionError}` : `${actionLabel} did not complete.`)}`
          );
          return;
        }
        if (automatedTradingWorkflowActionKey(nextGoldenPath) === actionKey) {
          stopAutomatedTradingWorkflow(
            i18n.locale === "zh-CN"
              ? `${actionLabel} 已执行，但流程状态未推进；请检查当前页面的阻断原因。`
              : `${actionLabel} ran, but the workflow status did not advance.`
          );
          return;
        }
        setAutomatedTradingWorkflowStatus(
          i18n.locale === "zh-CN" ? `${actionLabel} 已完成，正在继续下一步…` : `${actionLabel} complete. Continuing…`
        );
      } catch (error) {
        if (automatedTradingWorkflowRunIdRef.current === runId) {
          stopAutomatedTradingWorkflow(
            i18n.locale === "zh-CN"
              ? `自动流程已暂停：${error instanceof Error ? error.message : "步骤执行失败。"}`
              : `The automated workflow paused: ${error instanceof Error ? error.message : "The step failed."}`
          );
        }
      }
    })();
  }, [
    activeWorkAreaId,
    goldenPath,
    goldenPathActionHint,
    i18n,
    isAutomatedTradingWorkflowRunning,
    isChartLoading,
    isGoldenPathActionDisabledById,
    openLiveTradingGate,
    productWorkAreas,
    refreshGoldenPathStatus,
    runGoldenPathActionById,
    selectProductWorkArea,
    stopAutomatedTradingWorkflow,
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  ]);

  const renderChartPanel = (className = "chart-panel") => (
    <Panel
      title={i18n.t("panel.chart.title")}
      subtitle={i18n.t("panel.chart.subtitle", { timeframe: workspace.selectedTimeframe })}
      className={className}
      action={
        <button
          aria-label={i18n.t("chart.expand")}
          className="panel-icon-button"
          onClick={() => setIsChartExpanded(true)}
          title={i18n.t("chart.expand")}
          type="button"
        >
          <Maximize2 size={16} />
        </button>
      }
    >
      <div className="chart-panel-body">
        <KlineChartCanvas
          key={`${workspace.selectedInstrument.market}-${workspace.selectedInstrument.symbol}-${workspace.selectedTimeframe}`}
          bars={klinesState.bars}
          colorScheme={colorScheme}
          locale={locale}
          market={klinesState.market}
          onLoadHistorical={loadHistoricalKlines}
          symbol={klinesState.symbol}
          timeframe={klinesState.timeframe}
        />
        {!klinesState.bars.length && !isChartLoading ? <div className="chart-empty">{i18n.t("chart.noData")}</div> : null}
        <ChartDataStrip i18n={i18n} latestChartBar={latestChartBar} state={klinesState} />
      </div>
    </Panel>
  );

  const renderStrategyWorkbench = (showSaveAction = true) => (
    <StrategySummary
      bindingStrategyRevision={bindingStrategyRevision}
      draft={strategyRuleDraft}
      i18n={i18n}
      isSavingStrategy={isSavingStrategy}
      library={visibleStrategyLibrary}
      onApplyAiStrategyDraft={applyGeneratedStrategyDraft}
      onApplyStrategyTemplate={applyStrategyTemplate}
      onBindStrategyToProduction={bindStrategyToProduction}
      onDeleteStrategyVersion={deleteSavedStrategyVersion}
      onLoadStrategyVersion={loadSavedStrategyVersion}
      onRunStrategyGovernanceAction={runStrategyGovernanceAction}
      onSaveStrategyVersion={saveCurrentStrategyVersion}
      onUpdateStrategyRuleDraftField={updateStrategyRuleDraftField}
      providers={researchNoteProviders}
      readinessGates={strategyReadinessGates}
      rows={strategyRuleRows}
      showSaveAction={showSaveAction}
      strategyGovernanceQueue={strategyGovernanceQueue}
      strategyProductionBinding={strategyProductionBindingState}
      templates={strategyTemplateOptions}
      validationSource={strategyValidationState.source}
      workspace={workspace}
    />
  );

  const renderStrategyPanel = (className = "strategy-panel") => (
    <Panel title={i18n.t("panel.strategy.title")} subtitle={i18n.strategyText(workspace.strategy.name)} className={className}>
      {renderStrategyWorkbench()}
    </Panel>
  );

  const renderAgentPanel = (className = "watchlist-ai-panel") => (
    <Panel
      title={i18n.t("panel.agent.title")}
      subtitle={i18n.t("panel.agent.subtitle")}
      action={
        <div className="report-export-actions">
          <button
            className="report-export-button"
            disabled={!workspace.researchRun}
            onClick={exportAiReviewMarkdown}
            title={i18n.t("aiReview.exportMarkdown")}
            type="button"
          >
            <Download size={13} />
            <span>{i18n.t("aiReview.exportMarkdown")}</span>
          </button>
          <button
            className="report-export-button"
            disabled={!workspace.researchRun}
            onClick={exportAiReviewRunRecord}
            title={i18n.t("aiReview.exportRecord")}
            type="button"
          >
            <Database size={13} />
            <span>{i18n.t("aiReview.exportRecord")}</span>
          </button>
          <button
            className="report-export-button"
            disabled={!workspace.researchRun || isSavingAiReviewRecord}
            onClick={saveCurrentAiReviewRunRecord}
            title={i18n.t("aiReview.saveRecord")}
            type="button"
          >
            <Upload size={13} />
            <span>{isSavingAiReviewRecord ? i18n.t("aiReview.savingRecord") : i18n.t("aiReview.saveRecord")}</span>
          </button>
        </div>
      }
      className={className}
    >
      <div className="agent-panel-body">
        <AiReviewDossierBoard dossier={aiReviewDossier} i18n={i18n} />
        <AiReviewRunRecordHistory
          i18n={i18n}
          query=""
          records={activeAiReviewRunRecords}
          totalRecords={activeAiReviewRunRecords.length}
        />
        <AgentEvidenceBoard cards={aiEvidenceCards} i18n={i18n} />
        <AgentCommitteeBoard i18n={i18n} rounds={agentCommitteeRounds} />
      </div>
    </Panel>
  );

  const renderWorkflowNodesPanel = (
    className = "watchlist-workflow-panel",
    title = i18n.t("panel.nodeWorkflow.title"),
    subtitle = i18n.t("panel.nodeWorkflow.subtitle")
  ) => (
    <Panel title={title} subtitle={subtitle} className={className}>
      <CompactWorkflowNodes
        activeStageId={activeWorkflowStageId}
        i18n={i18n}
        runState={workflowRunState}
        stages={workflowStages}
      />
    </Panel>
  );

  const syncExecutionSafety = useCallback((
    executionMode: "paper" | "testnet" | "live",
    liveTradingAllowed: boolean
  ) => {
    setSettingsStatus((current) => {
      const settings = current.settings;
      if (!settings || (
        settings.safety.executionMode === executionMode
        && settings.safety.liveTradingAllowed === liveTradingAllowed
      )) return current;
      return {
        ...current,
        settings: {
          ...settings,
          safety: { ...settings.safety, executionMode, liveTradingAllowed }
        }
      };
    });
  }, []);
  const executionLiveTradingAllowed = autoTradingSnapshot?.liveTradingAllowed === true;
  const executionMode =
    autoTradingSnapshot?.state.executionMode
    ?? settingsStatus.settings?.safety.executionMode
    ?? "paper";
  const executionTestnetKillSwitch = stage6SandboxBatch?.killSwitch ?? stage6KillSwitch;
  const executionReadinessStack = (
    <details
      className="execution-readiness-stack"
      data-live-authorized={executionLiveTradingAllowed}
      open
      tabIndex={-1}
    >
      <summary>
        <span>{i18n.locale === "zh-CN" ? "自动交易控制与生产授权" : "Automatic trading controls & production authorization"}</span>
        <strong>{!autoTradingSnapshot
          ? i18n.locale === "zh-CN" ? "运行状态读取中或暂不可用" : "Runtime status loading or unavailable"
          : executionLiveTradingAllowed
          ? i18n.locale === "zh-CN" ? "生产会话有效" : "Production session active"
          : executionMode === "live"
            ? i18n.locale === "zh-CN" ? "生产实盘需授权" : "Production authorization required"
            : executionMode === "testnet"
              ? i18n.locale === "zh-CN" ? "当前为测试网模式" : "Sandbox mode"
              : i18n.locale === "zh-CN" ? "当前为纸面模拟" : "Paper mode"}</strong>
      </summary>
      <div className="execution-readiness-stack-body">
        <ExecutionAutoPaperTradingSection
          baseUrl={quantCoreBaseUrl}
          onSafetyChange={syncExecutionSafety}
          onSnapshotChange={setAutoTradingSnapshot}
        />
        {executionMode === "testnet" ? (
          <section className="execution-testnet-safety" aria-labelledby="execution-testnet-safety-title">
            <div>
              <span>{i18n.locale === "zh-CN" ? "测试网安全边界" : "Sandbox safety boundary"}</span>
              <h2 id="execution-testnet-safety-title">
                {i18n.locale === "zh-CN" ? "币安现货测试网急停" : "Binance Spot sandbox kill switch"}
              </h2>
              <p>
                {i18n.locale === "zh-CN"
                  ? "只控制测试网委托；不会改变生产实盘急停或授权。"
                  : "Controls sandbox orders only; production authorization is unchanged."}
              </p>
            </div>
            <strong className={executionTestnetKillSwitch?.triggered ? "blocked" : "ready"}>
              {executionTestnetKillSwitch?.triggered
                ? i18n.locale === "zh-CN" ? "已触发" : "Triggered"
                : i18n.locale === "zh-CN" ? "未触发" : "Clear"}
            </strong>
            <button
              disabled={isRunningStage6Sandbox}
              onClick={() => void runStage6KillSwitchAction(!executionTestnetKillSwitch?.triggered)}
              type="button"
            >
              {isRunningStage6Sandbox
                ? i18n.locale === "zh-CN" ? "处理中…" : "Working…"
                : executionTestnetKillSwitch?.triggered
                  ? i18n.locale === "zh-CN" ? "完成对账后重置测试网急停" : "Reset after reconciliation"
                  : i18n.locale === "zh-CN" ? "触发测试网急停" : "Trigger sandbox kill switch"}
            </button>
            {stage6SandboxError ? <p role="status">{stage6SandboxError}</p> : null}
          </section>
        ) : null}
        <ExecutionStage10ProductionExecutionSection
          autoTradingSnapshot={autoTradingSnapshot}
          baseUrl={quantCoreBaseUrl}
          onAutoLiveAuthorized={completeLiveTradingGate}
          sectionId="execution-center-live-trading-control"
        />
      </div>
    </details>
  );
  const executionAcceptanceAuditPanel = (
    <ExecutionAcceptanceAuditLedgerPanel
      className="workflow-execution-acceptance-audit-panel"
      events={executionAcceptanceAuditEvents}
      locale={i18n.locale}
    />
  );

  const canPrepareTerminalAiReview = Boolean(
    strategyExperimentUsableSourceKey
    && strategyExperimentSourceRunId
    && strategyExperimentStrategyRevision
    && workspace.researchRun
    && isStrategyExperimentDraftValid(
      visibleStrategyExperimentDimensions,
      strategyExperimentGuardrails,
      strategyExperimentWalkForward
    )
  );
  const canRunTerminalAiReview = canRunAiReviewStage3({
    primaryExperimentId: aiReviewStage3SelectedExperiment?.experimentId
      ?? aiReviewStage3DraftExperiment?.experimentId
      ?? (canPrepareTerminalAiReview ? "pending" : null),
    providers: aiReviewStage3Providers,
    providerId: aiReviewStage3ProviderId,
    externalDataApproved: aiReviewStage3ExternalDataApproved,
    busy: isLoadingAiReviewStage3 || isRunningAiReviewStage3 || isAppendingAiReviewStage3Decision
      || isStrategyExperimentRunning
  });
  const aiReviewNeedsExternalApproval = aiReviewRequiresExternalApproval(aiReviewStage3ProviderId)
    && !aiReviewStage3ExternalDataApproved;
  const aiReviewActionLabel = isRunningAiReviewStage3 || isStrategyExperimentRunning
    ? "AI 评审运行中…"
    : isLoadingAiReviewStage3
      ? "正在加载评审…"
      : !strategyExperimentSourceRunId
        ? "请先完成研究运行"
        : !aiReviewStage3SelectedExperiment && !aiReviewStage3DraftExperiment && !canPrepareTerminalAiReview
          ? "请先完善实验参数"
          : aiReviewNeedsExternalApproval
            ? "请先授权已完成 K 线与证据"
            : canRunTerminalAiReview
              ? "运行 AI 评审"
              : "AI 评审暂不可用";
  const runTerminalAiReview = async () => {
    let primaryExperimentId = aiReviewStage3DraftExperiment?.experimentId ?? null;
    if (!primaryExperimentId) {
      const experiment = await runStrategyExperiment();
      if (!experiment) return;
      primaryExperimentId = experiment.experimentId;
      setAiReviewStage3PrimaryExperimentId(primaryExperimentId);
      setAiReviewStage3ComparisonExperimentIds([]);
    }
    await runAiReviewStage3(primaryExperimentId);
  };
  const openAutomaticTradingConsole = () => {
    selectProductWorkArea("dynamic-trading");
  };
  const terminalSurfaceAction: TerminalWorkspaceSurfaceAction | null = (() => {
    switch (activeWorkAreaId) {
      case "market":
        return {
          label: isRefreshingWatchlistCache ? "刷新中…" : "刷新行情",
          onClick: () => void refreshWatchlistMarketCache(),
          disabled: isRefreshingWatchlistCache
        };
      case "market-information":
        return {
          label: isLoadingMarketInformation ? "加载资讯中…" : "刷新资讯",
          onClick: () => void refreshMarketInformation(),
          disabled: isLoadingMarketInformation
        };
      case "research":
        return {
          label: isRunning ? "研究运行中…" : "运行研究",
          onClick: () => void runPipeline(),
          disabled: isRunning
        };
      case "strategy":
        return {
          label: isSavingStrategy ? "正在保存…" : "保存版本",
          onClick: () => void saveCurrentStrategyVersion(),
          disabled: isSavingStrategy
        };
      case "backtest":
        return {
          label: isStrategyExperimentRunning ? "回测运行中…" : "运行回测",
          onClick: () => void runStrategyExperiment(),
          disabled: isStrategyExperimentRunning
        };
      case "ai-review":
        return {
          label: aiReviewActionLabel,
          onClick: () => void runTerminalAiReview(),
          disabled: !canRunTerminalAiReview
        };
      case "portfolio":
        return {
          label:
            isPreparingPortfolioPeers ||
            isRunningPortfolioBacktest ||
            isRecordingPortfolioPaperOrders ||
            isSimulatingPortfolioPaperOrderBatch ||
            isRecordingPortfolioStage4Workflow
              ? "黄金路径处理中…"
              : portfolioStage4GoldenPath.primaryActionId
                ? portfolioStage4GoldenPath.primaryActionId === "review-portfolio-orders"
                  ? "查看人工审批"
                  : portfolioStage4GoldenPath.primaryActionId === "review-portfolio-risk" ||
                      portfolioStage4GoldenPath.primaryActionId === "review-route-risk"
                    ? "查看风控问题"
                    : "继续黄金路径"
                : "黄金路径已完成",
          onClick: () => {
            if (portfolioStage4GoldenPath.primaryActionId) {
              runPortfolioStage4PrimaryAction(portfolioStage4GoldenPath.primaryActionId);
            }
          },
          disabled:
            !portfolioStage4GoldenPath.primaryActionId ||
            portfolioStage4GoldenPath.status === "blocked" ||
            isPreparingPortfolioPeers ||
            isRunningPortfolioBacktest ||
            isRecordingPortfolioPaperOrders ||
            isSimulatingPortfolioPaperOrderBatch ||
            isRecordingPortfolioStage4Workflow
        };
      case "execution":
        return {
          label: "打开自动交易控制台",
          onClick: openAutomaticTradingConsole
        };
      case "dynamic-trading":
        return null;
      case "audit":
        return {
          label: "导出审计包",
          onClick: () => runHistory[0] && void exportRun(runHistory[0]),
          disabled: !runHistory.length
        };
      case "settings":
        return {
          label: isRefreshingAdapterHealthProbe ? "检查中…" : "检查执行适配器",
          onClick: () => void refreshExecutionAdapterHealthProbe(),
          disabled: isRefreshingAdapterHealthProbe
        };
    }
  })();
  const terminalSurfaceDisplayAction =
    terminalSurfaceAction && activeWorkspaceContext
      ? {
          ...terminalSurfaceAction,
          workflowReason: translateGoldenPathDetail(
            i18n,
            activeWorkspaceContext.detail || activeWorkspaceContext.reason
          ),
          workflowStatus: activeWorkspaceContext.status
        }
      : terminalSurfaceAction;
  const automatedTradingGuideAction =
    goldenPath?.nextAction?.id === "certify-live-adapter"
      ? openLiveTradingGate
      : goldenPath?.nextAction
        ? runAutomatedTradingWorkflowFromCurrentWorkspace
        : openAutomaticTradingConsole;
  const automatedTradingGuide = (
    <AutomatedTradingWorkflowGuide
      actionDisabled={isAutomatedTradingWorkflowRunning || !goldenPath}
      actionLabel={
        !goldenPath
          ? i18n.locale === "zh-CN"
            ? "正在读取流程…"
            : "Loading workflow…"
          : isAutomatedTradingWorkflowRunning
            ? i18n.locale === "zh-CN"
              ? "自动执行中…"
              : "Running automatically…"
            : goldenPath.nextAction
              ? automatedTradingWorkflowRequiresManualAction(goldenPath.nextAction.id)
                ? goldenPathActionLabel(i18n, goldenPath.nextAction)
                : i18n.locale === "zh-CN"
                  ? "开始自动交易流程"
                  : "Start automated trading flow"
            : i18n.locale === "zh-CN"
              ? "打开自动交易控制台"
              : "Open auto-trading console"
      }
      activeWorkAreaId={activeWorkAreaId}
      currentWorkAreaId={activeWorkAreaId}
      detail={
        automatedTradingWorkflowStatus ??
        (goldenPath
          ? goldenPathDetail(i18n, goldenPathCurrentStep, goldenPath.nextAction?.reason, goldenPath)
          : i18n.locale === "zh-CN"
            ? "正在读取黄金路径和实盘闸门。"
            : "Loading the golden path and live-trading gates.")
      }
      i18n={i18n}
      onAction={automatedTradingGuideAction}
      onSelectWorkspace={selectProductWorkArea}
      workAreas={automatedTradingWorkAreas}
    />
  );
  const colorSchemeToggleLabel = i18n.locale === "zh-CN"
    ? colorScheme === "dark" ? "切换到浅色模式" : "切换到深色模式"
    : colorScheme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const textScalePercent = Math.round(textScale * 100);
  const footerExecutionSafety = settingsStatus.settings?.safety;
  const authoritativeFooterSnapshotExpected = activeWorkAreaId === "execution"
    || activeWorkAreaId === "dynamic-trading"
    || activeWorkAreaId === "portfolio";
  const footerExecutionStateAvailable = authoritativeFooterSnapshotExpected
    ? autoTradingSnapshot !== null
    : Boolean(footerExecutionSafety);
  const currentExecutionMode = authoritativeFooterSnapshotExpected
    ? autoTradingSnapshot?.state.executionMode ?? footerExecutionSafety?.executionMode
    : footerExecutionSafety?.executionMode;
  const footerLiveTradingAllowed = authoritativeFooterSnapshotExpected
    ? autoTradingSnapshot?.liveTradingAllowed === true
    : footerExecutionSafety?.liveTradingAllowed === true;
  const currentExecutionModeLabel = !footerExecutionStateAvailable
    ? i18n.locale === "zh-CN" ? "状态读取中" : "Loading"
    : currentExecutionMode === "live"
      ? footerLiveTradingAllowed
        ? i18n.locale === "zh-CN" ? "生产实盘" : "Production live"
        : i18n.locale === "zh-CN" ? "生产实盘受保护" : "Production live protected"
      : currentExecutionMode === "testnet"
        ? i18n.locale === "zh-CN" ? "币安测试网" : "Binance Testnet"
        : i18n.locale === "zh-CN" ? "纸面模拟" : "Paper simulation";
  const currentExecutionVenueLabel = currentExecutionMode === "live"
    ? i18n.locale === "zh-CN" ? "币安现货" : "Binance Spot"
    : currentExecutionMode === "testnet"
      ? i18n.locale === "zh-CN" ? "币安测试网" : "Binance Testnet"
      : i18n.locale === "zh-CN" ? "纸面经纪" : "Paper Broker";
  const currentExecutionTone = footerLiveTradingAllowed
    ? "live"
    : currentExecutionMode === "live"
      ? "blocked"
      : "paper";
  const currentLiveBadgeLabel = !footerExecutionStateAvailable
    ? i18n.locale === "zh-CN" ? "权限读取中" : "Loading permissions"
    : footerLiveTradingAllowed
      ? i18n.locale === "zh-CN" ? "生产会话有效" : "Production session active"
      : currentExecutionMode === "live"
        ? i18n.locale === "zh-CN" ? "生产闸门保护中" : "Production gate protected"
        : i18n.locale === "zh-CN" ? "实盘需授权" : "Live authorization required";
  const footerExecutionStatus = !footerExecutionStateAvailable
    ? i18n.locale === "zh-CN" ? "未加载" : "Unavailable"
    : footerLiveTradingAllowed
      ? i18n.locale === "zh-CN" ? "已授权" : "Authorized"
      : currentExecutionMode === "testnet"
        ? "Testnet"
        : currentExecutionMode === "paper"
          ? "Paper"
          : i18n.locale === "zh-CN" ? "未授权" : "Not authorized";
  const footerExecutionDetail = !footerExecutionStateAvailable
    ? i18n.locale === "zh-CN" ? "正在读取执行状态" : "Loading execution status"
    : footerLiveTradingAllowed
      ? i18n.locale === "zh-CN" ? "生产会话有效" : "Production session active"
      : footerExecutionSafety?.productionLive?.blockingReason ===
          "stage10_production_execution_control_evidence_stale"
        ? i18n.locale === "zh-CN" ? "生产权限证据已过期" : "Production permission evidence expired"
        : footerExecutionSafety?.productionLive?.credentialsConfigured === false
          ? i18n.locale === "zh-CN" ? "生产交易凭据未配置" : "Production credentials missing"
          : i18n.locale === "zh-CN"
            ? "生产会话未开启，切换时需实名确认"
            : "Production session inactive; named confirmation required";

  return (
    <div className="terminal-shell" data-theme={colorScheme}>
      <aside className="left-rail">
        <div className="brand">
          <img className="brand-mark" src="/aiqt-logo.png" alt="AIQuantificationTools" />
          <div>
            <strong>AIQuantificationTools</strong>
            <span>{i18n.t("brand.subtitle")}</span>
          </div>
        </div>

        <section className="rail-section">
          <nav className="work-area-nav">
            {productWorkAreaGroups.map((group) => (
              <section className="work-area-group" key={group.id}>
                <p className="work-area-group-label">
                  {i18n.locale === "zh-CN" ? group.labelZh : group.labelEn}
                </p>
                <div className="work-area-group-items">
                  {group.workAreaIds.map((workAreaId) => {
                    const area = productWorkAreas.find((candidate) => candidate.id === workAreaId);
                    if (!area) {
                      return null;
                    }
                    const Icon = workAreaIcons[area.id] ?? Radar;
                    const index = productWorkAreaIds.indexOf(area.id);
                    return (
                      <button
                        aria-current={activeWorkAreaId === area.id ? "page" : undefined}
                        className={`work-area-button ${area.accent} ${area.status} ${
                          activeWorkAreaId === area.id ? "selected active" : ""
                        }`}
                        key={area.id}
                        onClick={() => selectProductWorkArea(area.id)}
                        title={`${i18n.productWorkAreaLabel(area)} · ${i18n.productWorkAreaDescription(area)} · ${i18n.productWorkAreaDeliveryStage(area)}`}
                        type="button"
                      >
                        <span className="work-area-index">{index + 1}</span>
                        <Icon size={16} />
                        <span className="work-area-copy">
                          <strong>{i18n.productWorkAreaLabel(area)}</strong>
                          <small>{i18n.productWorkAreaDescription(area)}</small>
                          <span className="work-area-stage">
                            <span>{i18n.productWorkAreaDeliveryStage(area)}</span>
                            <em>{i18n.productDevelopmentStageStatus(area.deliveryStageStatus)}</em>
                          </span>
                        </span>
                        <em className="work-area-status">{i18n.productWorkAreaStatus(area.status)}</em>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </section>

        <section className="rail-profile">
          <span className="rail-avatar">AQ</span>
          <span>
            <strong>quant.user</strong>
            <small>{i18n.locale === "zh-CN" ? "研究员 · 三级" : "Researcher · Level 3"}</small>
          </span>
          <time dateTime={workspace.researchRun?.createdAt ?? ""}>
            {workspace.researchRun
              ? new Date(workspace.researchRun.createdAt).toLocaleString("zh-CN", {
                  timeZone: "Asia/Shanghai"
                })
              : i18n.locale === "zh-CN"
                ? "等待首次运行"
                : "Waiting for first run"}
            <br />{i18n.strategyText("Asia/Shanghai")}
          </time>
        </section>
      </aside>

      <main className="terminal-main" data-workspace={activeWorkAreaId}>
        <header className="terminal-topbar">
          <div className="terminal-global-tape" aria-label="全球市场快照">
            {workspace.watchlist.slice(0, 3).map((instrument) => (
              <span key={`${instrument.market}-${instrument.symbol}`}>
                {i18n.instrumentName(instrument.name)} <em>
                  {instrument.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                  {" "}{instrument.changePct >= 0 ? "+" : ""}{instrument.changePct.toFixed(2)}%
                </em>
              </span>
            ))}
            <span
              className="terminal-data-fresh"
              title={source === "core" ? "前台页面约每 35 秒自动刷新" : "当前使用本地快照"}
            >
              <Activity size={12} />{source === "core" ? "行情自动刷新" : "本地快照"}
            </span>
          </div>
          <div className="terminal-route-heading">
            <p className="section-label">
              {workspace.selectedInstrument.symbol} · {i18n.marketLabel(workspace.selectedInstrument.market)} · {workspace.selectedTimeframe}
            </p>
            <h1>
              {activeWorkArea ? i18n.productWorkAreaLabel(activeWorkArea) : i18n.t("topbar.eyebrow")}
              <small>{i18n.instrumentName(workspace.selectedInstrument.name)}</small>
            </h1>
          </div>
          <div className="topbar-actions">
            <form className="symbol-switcher" onSubmit={submitSymbol} aria-label={i18n.t("aria.symbolSwitcher")}>
              <select
                aria-label={i18n.t("symbol.market")}
                onChange={(event) => setMarketDraft(event.currentTarget.value as Market)}
                value={marketDraft}
              >
                {(["ashare", "us", "crypto"] as Market[]).map((market) => (
                  <option key={market} value={market}>
                    {i18n.marketLabel(market)}
                  </option>
                ))}
              </select>
              <div className="symbol-field">
                <input
                  aria-label={i18n.t("symbol.placeholder")}
                  autoComplete="off"
                  id="terminal-symbol-input"
                  onChange={(event) => {
                    setSymbolDraft(event.currentTarget.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (symbolDraft.trim()) {
                      setIsSearchOpen(true);
                    }
                  }}
                  placeholder={i18n.t("symbol.placeholder")}
                  value={symbolDraft}
                />
                {isSearchOpen && symbolDraft.trim() ? (
                  <div className="symbol-suggestions">
                    {isSymbolSearching ? (
                      <span className="symbol-suggestion-state">{i18n.t("symbol.searching")}</span>
                    ) : null}
                    {!isSymbolSearching && searchSuggestions.length
                      ? searchSuggestions.map((suggestion) => (
                          <div className="symbol-suggestion-row" key={`${suggestion.market}-${suggestion.symbol}-${suggestion.source}`}>
                            <button
                              className="symbol-suggestion-select"
                              onClick={() => selectSearchSuggestion(suggestion)}
                              type="button"
                            >
                              <span>
                                <strong>{suggestion.symbol}</strong>
                                <em>{suggestion.name}</em>
                              </span>
                              <span className="symbol-suggestion-meta">
                                <small className="symbol-suggestion-venue">
                                  {suggestion.exchange ? `${suggestion.exchange} · ` : ""}
                                  {suggestion.source}
                                </small>
                                {suggestion.cache ? (
                                  <>
                                    <span aria-hidden="true" className="symbol-suggestion-divider">·</span>
                                    <small className={`symbol-suggestion-cache ${suggestion.cache.freshness}`}>
                                      {marketSearchCacheSummary(i18n, suggestion.cache)}
                                    </small>
                                  </>
                                ) : null}
                              </span>
                            </button>
                            {canRefreshSearchSuggestionCache(suggestion) ? (
                              <button
                                className="symbol-suggestion-refresh"
                                aria-label={`${marketSearchRefreshLabel(i18n, suggestion)} ${suggestion.symbol}`}
                                disabled={
                                  refreshingCacheKey ===
                                  cacheContextKey({
                                    market: suggestion.market,
                                    symbol: suggestion.symbol,
                                    timeframe: workspace.selectedTimeframe
                                  })
                                }
                                onClick={() => void refreshSearchSuggestionCache(suggestion)}
                                type="button"
                              >
                                <RefreshCw size={12} />
                                {marketSearchRefreshLabel(i18n, suggestion)}
                              </button>
                            ) : null}
                          </div>
                        ))
                      : null}
                    {!isSymbolSearching && !searchSuggestions.length ? (
                      <span className="symbol-suggestion-state">{i18n.t("symbol.noResults")}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button type="submit">
                <Search size={15} />
                {i18n.t("action.switchSymbol")}
              </button>
            </form>
            <span className={`terminal-paper-badge ${currentExecutionTone}`}>
              {currentExecutionModeLabel}
            </span>
            <span className={`terminal-live-badge ${footerLiveTradingAllowed ? "authorized" : ""}`}>
              {currentLiveBadgeLabel}
            </span>
            <button
              className="context-link-button"
              onClick={() => void copyResearchContextLink()}
              title={`${workspace.selectedInstrument.market} · ${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`}
              type="button"
            >
              <Copy size={14} />
              {copiedResearchContextLink ? i18n.t("action.researchContextLinkCopied") : i18n.t("action.copyResearchContextLink")}
            </button>
            <span className={`status-pill ${source === "core" ? "ok" : "paper"}`} title={error}>
              {i18n.statusLabel(statusLabel)}
            </span>
            <span className="status-pill paper">{i18n.executionMode(workspace.execution)}</span>
            {researchPipelinePreflight.lockedPreparationEvidence ? (
              <span
                className="status-pill evidence-lock"
                title={researchPipelineLockedEvidenceTitle(i18n, researchPipelinePreflight)}
              >
                <Database size={14} />
                {researchPipelineLockedEvidenceLabel(i18n, researchPipelinePreflight)}
              </span>
            ) : null}
            <div className="locale-control" aria-label={i18n.t("aria.language")}>
              <Languages size={15} />
              <select
                aria-label={i18n.t("aria.language")}
                className="locale-select"
                onChange={(event) => setLocale(event.currentTarget.value as Locale)}
                value={locale}
              >
                {supportedLocales.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {i18n.localeOptionLabel(candidate)}
                  </option>
                ))}
              </select>
            </div>
            <div className="timeframe-control" aria-label={i18n.t("aria.timeframe")}>
              <Timer size={15} />
              {timeframeOptions.map((timeframe) => (
                <button
                  className={workspace.selectedTimeframe === timeframe ? "active" : ""}
                  key={timeframe}
                  onClick={() => selectTimeframe(timeframe)}
                >
                  {timeframe}
                </button>
              ))}
            </div>
            <button
              className="run-button"
              disabled={isRefreshing || isRunning || !researchPipelinePreflight.canRun}
              onClick={() => void runPipeline()}
              title={researchPipelinePreflightStatusLabel(i18n, researchPipelinePreflight)}
            >
              {isRefreshing || isRunning ? <RefreshCw className="spin" size={17} /> : <Play size={17} />}
              {i18n.t("action.runPipeline")}
            </button>
            <details className="text-scale-control">
              <summary
                aria-label={i18n.locale === "zh-CN" ? "调整文字大小" : "Adjust text size"}
                className="panel-icon-button"
                title={i18n.locale === "zh-CN" ? `文字大小 ${textScalePercent}%` : `Text size ${textScalePercent}%`}
              >
                <Type size={16} />
              </summary>
              <div className="text-scale-popover">
                <label htmlFor="terminal-text-scale">
                  <span>{i18n.locale === "zh-CN" ? "文字大小" : "Text size"}</span>
                  <strong>{textScalePercent}%</strong>
                </label>
                <input
                  aria-label={i18n.locale === "zh-CN" ? "文字大小比例" : "Text size percentage"}
                  aria-valuetext={`${textScalePercent}%`}
                  id="terminal-text-scale"
                  max={MAX_TEXT_SCALE}
                  min={MIN_TEXT_SCALE}
                  onInput={(event) => setTextScale(Number(event.currentTarget.value))}
                  step={0.05}
                  type="range"
                  value={textScale}
                />
                <div aria-label={i18n.locale === "zh-CN" ? "文字大小快捷档位" : "Text size presets"} className="text-scale-presets">
                  {[MIN_TEXT_SCALE, 1.25, MAX_TEXT_SCALE].map((scale) => (
                    <button
                      aria-pressed={textScale === scale}
                      className={textScale === scale ? "active" : ""}
                      key={scale}
                      onClick={() => setTextScale(scale)}
                      type="button"
                    >
                      {Math.round(scale * 100)}%
                    </button>
                  ))}
                </div>
                <footer>
                  <small>{i18n.locale === "zh-CN" ? "仅保存在当前设备" : "Saved on this device only"}</small>
                  <button onClick={() => setTextScale(DEFAULT_TEXT_SCALE)} type="button">
                    {i18n.locale === "zh-CN" ? "恢复默认" : "Reset"}
                  </button>
                </footer>
              </div>
            </details>
            <button
              aria-label={colorSchemeToggleLabel}
              className="panel-icon-button theme-toggle-button"
              onClick={() => setColorSchemePreference(colorScheme === "dark" ? "light" : "dark")}
              title={colorSchemeToggleLabel}
              type="button"
            >
              {colorScheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {activeWorkAreaId === "dynamic-trading" || !terminalSurfaceDisplayAction ? null : (
        <TerminalWorkspaceSurface
          action={terminalSurfaceDisplayAction}
          activeWorkAreaId={activeWorkAreaId}
          adapterChainHealthRollups={terminalExecutionAdapterChainHealthRollups}
          adapterHealthProbeRows={terminalExecutionAdapterHealthProbeRows}
          adapterLedgerRows={terminalExecutionAdapterLedgerRows}
          adapterRows={terminalBrokerAdapterRows}
          isLoadingSettingsConfiguration={!hasLoadedSettingsStatus}
          isSavingSettingsConfiguration={isSavingSettingsConfiguration}
          isTestingMonitoringWebhook={isTestingMonitoringWebhook}
          installingDataDependency={installingDataDependency}
          onLoadOpenAiCompatibleModels={loadSettingsOpenAiCompatibleModels}
          onInstallDataDependency={(dependency) => void installSettingsDataDependency(dependency)}
          onSaveSettingsConfiguration={saveSettingsConfiguration}
          onSettingsConfigurationDirtyChange={setHasUnsavedSettingsConfiguration}
          onTestMonitoringWebhook={() => void testSettingsMonitoringWebhook()}
          settings={settingsStatus.settings}
          settingsConfigurationMessage={settingsConfigurationMessage}
          aiReview={{
            appendingDecision: isAppendingAiReviewStage3Decision,
            busy: isLoadingAiReviewStage3 || isRunningAiReviewStage3
              || isAppendingAiReviewStage3Decision || isStrategyExperimentRunning,
            running: isRunningAiReviewStage3 || isStrategyExperimentRunning,
            comparisonExperimentIds: aiReviewStage3ComparisonExperimentIds,
            currentReview: aiReviewStage3CurrentReview,
            decisionDraft: aiReviewStage3DecisionDraft,
            decisions: aiReviewStage3Decisions,
            error: aiReviewStage3Error ?? strategyExperimentError,
            experiments: aiReviewStage3Experiments,
            externalDataApproved: aiReviewStage3ExternalDataApproved,
            history: aiReviewStage3History,
            onAppendDecision: () => void appendAiReviewStage3Decision(),
            onComparisonToggle: toggleAiReviewStage3Comparison,
            onDecisionDraftChange: updateAiReviewStage3DecisionDraft,
            onExternalDataApprovedChange: approveAiReviewStage3ExternalData,
            onOpenProductionHandoff: () => selectProductWorkArea("backtest"),
            onProviderChange: selectAiReviewStage3Provider,
            onStagePrimaryCandidate: () => {
              if (
                !aiReviewStage3PrimaryCandidateAvailable
                || !aiReviewStage3PrimaryReference
              ) {
                setAiReviewStage3Error("当前评审候选与已载入实验不一致，请先恢复完整评审上下文。");
                return;
              }
              void loadStrategyExperimentCandidate(
                aiReviewStage3PrimaryReference.selectedCandidateId
              );
            },
            primaryExperimentId: aiReviewStage3PrimaryExperimentId,
            primaryCandidateAvailable: aiReviewStage3PrimaryCandidateAvailable,
            providerId: aiReviewStage3ProviderId,
            providers: aiReviewStage3Providers,
            researchLoop: (
              <AiResearchM4Section
                baseUrl={quantCoreBaseUrl}
                currentReview={isRunningAiReviewStage3 || isStrategyExperimentRunning
                  ? null
                  : aiReviewStage3CurrentReview}
                i18n={i18n}
                runHistory={runHistory}
              />
            )
          }}
          chart={
            <>
              <KlineChartCanvas
                key={`surface-${workspace.selectedInstrument.market}-${workspace.selectedInstrument.symbol}-${workspace.selectedTimeframe}`}
                bars={klinesState.bars}
                colorScheme={colorScheme}
                locale={locale}
                market={klinesState.market}
                onLoadHistorical={loadHistoricalKlines}
                symbol={klinesState.symbol}
                timeframe={klinesState.timeframe}
              />
              <ChartDataStrip i18n={i18n} latestChartBar={latestChartBar} state={klinesState} />
            </>
          }
          colorScheme={colorScheme}
          executionAcceptanceAudit={executionAcceptanceAuditPanel}
          executionReadiness={executionReadinessStack}
          executionSnapshot={autoTradingSnapshot}
          isSavingWatchlist={isSavingWatchlist}
          latestWatchlistCacheRefresh={latestWatchlistCacheRefresh}
          marketCalendar={marketCalendarState.calendar}
          marketDiscovery={{
            isLoading: isLoadingMarketDiscovery,
            onSearch: (params) => void searchMarketDiscovery(params),
            result: marketDiscoveryResult,
          }}
          marketAiSelection={{
            error: marketAiSelection.error,
            isLoading: isLoadingMarketAiSelection,
            onResearchInstrument: researchMarketAiSelectionCandidate,
            onRun: (request, requestKey) =>
              void runMarketAiSelection(request, requestKey),
            onViewInstrument: (instrument) =>
              selectInstrument(instrument, "market", false),
            requestKey: marketAiSelectionRequestKey,
            result: marketAiSelection.selection ?? null,
            review: {
              error: marketAiSelectionReview.error,
              isLoading: isLoadingMarketAiSelectionReview,
              onRun: (request) => void runMarketAiSelectionReview(request),
              result: marketAiSelectionReview.review ?? null,
            },
            statistics: {
              error: marketAiSelectionStatistics.error,
              isLoading: isLoadingMarketAiSelectionStatistics,
              onRefresh: () => void refreshMarketAiSelectionStatistics(),
              result: marketAiSelectionStatistics.statistics ?? null,
            },
          }}
          marketAiSelectionResearchOrigin={
            pendingMarketAiSelectionResearchOrigin
            && pendingMarketAiSelectionResearchOrigin.market === workspace.selectedInstrument.market
            && pendingMarketAiSelectionResearchOrigin.symbol === workspace.selectedInstrument.symbol
            && workspace.selectedTimeframe === "1d"
              ? pendingMarketAiSelectionResearchOrigin
              : null
          }
          marketInformation={{
            isLoading: isLoadingMarketInformation,
            isLoadingNews: isLoadingMarketInformationNews,
            market: marketInformationMarket,
            newsResult: marketInformationNewsResult,
            onMarketChange: selectMarketInformationMarket,
            onNewsPageChange: (offset, scope) =>
              void refreshMarketInformationNews(offset, scope),
            onRefresh: () => void refreshMarketInformation(),
            result: marketInformationResult,
            symbol: marketInformationSymbol,
          }}
          marketRefreshIssue={marketRefreshIssue}
          onApprovePortfolioOrder={approvePortfolioPaperOrder}
          onRemoveWatchlistInstrument={(instrument) => void removeWatchlistInstrument(instrument)}
          onRejectPortfolioOrder={rejectPortfolioPaperOrder}
          onSaveWatchlist={() => void saveCurrentWatchlist()}
          onScrollPositionChange={rememberActiveWorkspaceScrollPosition}
          onSelectInstrument={(instrument) => selectInstrument(instrument, "market")}
          onResearchInstrument={(instrument) => selectInstrument(instrument, "research")}
          onSelectTimeframe={(timeframe) => selectTimeframe(timeframe, "market")}
          approvingPortfolioOrderId={approvingPortfolioPaperOrderId}
          portfolio={portfolioBacktestState.portfolio ?? null}
          portfolioActionError={
            portfolioBacktestState.error
              ? portfolioBacktestSummary(i18n, portfolioBacktestState.error)
              : portfolioRiskAssessmentError ?? portfolioPaperOrderHistoryError
          }
          portfolioGoldenPath={portfolioStage4GoldenPath}
          portfolioPaperOrderApprovalRows={portfolioPaperOrderApprovalRows.filter(
            (row) =>
              row.baseRunId === currentResearchRunId &&
              row.batchId === portfolioStage4LatestBatch?.batchId
          )}
          portfolioRiskAssessment={portfolioRiskAssessment}
          portfolioProductionRisk={{
            error: portfolioProductionRiskError,
            loading: isLoadingPortfolioProductionRisk,
            onRefresh: () => void refreshPortfolioProductionRisk(true),
            snapshot: autoTradingSnapshot
          }}
          portfolioStage4Workflow={portfolioStage4Workflow}
          isRunningPortfolioRiskAssessment={isRunningPortfolioRiskAssessment}
          onRunPortfolioRiskAssessment={(request) => void runPortfolioRiskAssessment(request)}
          productionStrategyHandoff={{
            binding: strategyProductionBindingState.binding ?? null,
            busy: bindingStrategyRevision === productionStrategyHandoffState.handoff?.strategyRevision,
            errorLabel: strategyProductionBindingState.error
              || productionStrategyHandoffState.error
              ? strategyProductionBindingErrorLabel(
                  i18n,
                  strategyProductionBindingState.error
                    ?? productionStrategyHandoffState.error
                    ?? undefined
                )
              : null,
            switchBlockedReasonLabel: productionStrategyHandoffState.handoff?.switchBlockedReason
              ? strategyProductionBindingErrorLabel(
                  i18n,
                  productionStrategyHandoffState.handoff.switchBlockedReason
                )
              : null,
            onBind: async (operator) => {
              const handoff = productionStrategyHandoffState.handoff;
              if (activeWorkAreaId !== "backtest" || !handoff) {
                return false;
              }
              return bindStrategyToProduction(
                {
                  auditRunId: handoff.runId,
                  revision: handoff.strategyRevision,
                  status: "audited"
                },
                operator
              );
            },
            onOpenDynamicTrading: () => selectProductWorkArea("dynamic-trading"),
            result: productionStrategyHandoffState
          }}
          researchPreparation={{
            externalDataApproved: researchNoteExternalDataApproved,
            generationError: researchNoteGenerationError,
            generationStatus: researchNoteGenerationStatus,
            isGeneratingNote: isGeneratingResearchNoteDraft,
            isSavingNote: isSavingResearchNote,
            isSavingWorkspace: isSavingResearchWorkspace,
            note: researchNoteState,
            noteDraft: researchNoteDraft,
            onExternalDataApprovedChange: (approved) => {
              setResearchNoteExternalDataApproved(approved);
              setResearchNoteGenerationError(null);
              setResearchNoteGenerationStatus(null);
            },
            onGenerateNote: () => void generateCurrentResearchNoteDraft(),
            onNoteChange: editResearchNoteDraft,
            onProviderChange: selectResearchNoteProvider,
            onSaveNote: () => void saveCurrentResearchNote(),
            onSaveWorkspace: () => void saveCurrentResearchWorkspace(),
            providerId: researchNoteProviderId,
            providers: researchNoteProviders,
            workspaceSaved: isResearchWorkspaceSaved
          }}
          runs={runHistory}
          source={source}
          strategyExperiment={{
            active: visibleStrategyExperimentActive,
            busy: isStrategyExperimentRunning,
            error: strategyExperimentError,
            history: visibleStrategyExperimentHistory,
            onWalkForwardChange: configureStrategyExperimentWalkForward,
            walkForward: strategyExperimentWalkForward
          }}
          strategyWorkbench={renderStrategyWorkbench(false)}
          surfaceRef={activeWorkspaceSurfaceRef}
          workflowGuide={
            activeWorkAreaId === "market-information"
              ? undefined
              : automatedTradingGuide
          }
          workspace={workspace}
        />
        )}

        {activeWorkAreaId === "dynamic-trading" ? (
          <ExecutionAutoPaperTradingSection
            baseUrl={quantCoreBaseUrl}
            chart={
              <>
                <KlineChartCanvas
                  key={`dynamic-trading-${workspace.selectedInstrument.market}-${workspace.selectedInstrument.symbol}-${workspace.selectedTimeframe}`}
                  bars={klinesState.bars}
                  colorScheme={colorScheme}
                  locale={locale}
                  market={klinesState.market}
                  onLoadHistorical={loadHistoricalKlines}
                  symbol={klinesState.symbol}
                  timeframe={klinesState.timeframe}
                />
                <ChartDataStrip i18n={i18n} latestChartBar={latestChartBar} state={klinesState} />
              </>
            }
            instruments={workspace.watchlist}
            onOpenAudit={() => selectProductWorkArea("audit")}
            onOpenExecution={() => selectProductWorkArea("execution")}
            onSafetyChange={syncExecutionSafety}
            onSnapshotChange={setAutoTradingSnapshot}
            onSelectInstrument={(instrument) => selectInstrument(instrument, "dynamic-trading")}
            selectedSymbol={workspace.selectedInstrument.symbol}
            variant="workspace"
            workflowGuide={automatedTradingGuide}
          />
        ) : null}

      </main>

      <footer className="terminal-status-bar" aria-label={i18n.locale === "zh-CN" ? "系统状态" : "System status"}>
        <div className="terminal-status-item">
          <span>{i18n.locale === "zh-CN" ? "数据" : "Data"}</span>
          <strong><i className="status-dot" />{source === "core" ? (i18n.locale === "zh-CN" ? "正常" : "Healthy") : (i18n.locale === "zh-CN" ? "离线快照" : "Offline snapshot")}</strong>
        </div>
        <div className="terminal-status-item">
          <span>{i18n.locale === "zh-CN" ? "模型" : "Model"}</span>
          <strong><i className="status-dot" />{i18n.locale === "zh-CN" ? "本地基线有效" : "Local baseline ready"}</strong>
        </div>
        <div className={`terminal-status-item ${currentExecutionTone}`}>
          <span>{currentExecutionVenueLabel}</span>
          <strong>{currentExecutionModeLabel}</strong>
        </div>
        <div className="terminal-status-item">
          <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"}</span>
          <strong><i className="status-dot" />{workspace.researchRun?.runId ? (i18n.locale === "zh-CN" ? "证据已绑定" : "Evidence bound") : (i18n.locale === "zh-CN" ? "等待运行" : "Awaiting run")}</strong>
        </div>
        <div className="terminal-live-block">
          <span>{i18n.locale === "zh-CN" ? "实盘交易" : "Live trading"}</span>
          <strong>{footerExecutionStatus}</strong>
          <small>{footerExecutionDetail}</small>
        </div>
      </footer>

      {researchCompletionNotice ? (
        <aside aria-live="polite" className="research-completion-notice" role="status">
          <span className="research-completion-notice-icon" aria-hidden="true">
            <CheckCircle2 size={19} />
          </span>
          <span className="research-completion-notice-copy">
            <strong>{i18n.statusLabel("Research run complete")}</strong>
            <small>
              {researchCompletionNotice.instrumentName} · {researchCompletionNotice.symbol} ·{" "}
              {researchCompletionNotice.timeframe} · {researchCompletionNotice.dataRows}{" "}
              {i18n.locale === "zh-CN"
                ? researchCompletionNotice.readbackReady
                  ? "根 K 线 · 审计证据已绑定"
                  : "根 K 线 · 审计运行已创建 · 列表回读待恢复"
                : researchCompletionNotice.readbackReady
                  ? "bars · audit evidence bound"
                  : "bars · audit run created · list readback pending"}
            </small>
            <code>{researchCompletionNotice.runId}</code>
          </span>
          <button
            aria-label={i18n.locale === "zh-CN" ? "关闭研究完成提示" : "Dismiss research completion notice"}
            onClick={() => setResearchCompletionNotice(null)}
            type="button"
          >
            <X size={15} />
          </button>
        </aside>
      ) : null}

      {pendingSettingsWorkAreaId ? (
        <dialog
          aria-describedby="settings-unsaved-dialog-detail"
          aria-labelledby="settings-unsaved-dialog-title"
          aria-modal="true"
          className="research-confirmation-dialog settings-unsaved-dialog"
          onCancel={(event) => {
            if (isSavingSettingsConfiguration) {
              event.preventDefault();
              return;
            }
            continueEditingSettings();
          }}
          ref={settingsUnsavedDialogRef}
          role="alertdialog"
        >
          <section className="research-confirmation-modal">
            <header>
              <div>
                <span className="research-confirmation-kicker">
                  <Save size={15} />
                  未保存配置
                </span>
                <h2 id="settings-unsaved-dialog-title">保存设置后再离开？</h2>
              </div>
              <button
                aria-label="返回继续编辑设置"
                className="panel-icon-button"
                disabled={isSavingSettingsConfiguration}
                onClick={continueEditingSettings}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <p id="settings-unsaved-dialog-detail">
              检测到配置项尚未保存。保存并离开会应用当前表单全部配置；不保存离开将丢失这些修改。
            </p>
            {settingsConfigurationMessage?.startsWith("保存失败") ? (
              <p className="execution-stage5-shadow-error" role="alert">
                {settingsConfigurationMessage}
              </p>
            ) : null}
            <footer className="research-confirmation-actions">
              <button
                className="design-secondary-action"
                disabled={isSavingSettingsConfiguration}
                onClick={continueEditingSettings}
                ref={settingsUnsavedContinueButtonRef}
                type="button"
              >
                返回继续编辑
              </button>
              <button
                className="design-secondary-action"
                disabled={isSavingSettingsConfiguration}
                onClick={discardSettingsAndLeave}
                type="button"
              >
                不保存并离开
              </button>
              <button
                className="run-button"
                disabled={isSavingSettingsConfiguration}
                onClick={saveSettingsAndLeave}
                type="button"
              >
                <Save size={15} />
                {isSavingSettingsConfiguration ? "保存中…" : "保存并离开"}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}

      {isResearchPipelineConfirmationOpen ? (
        <dialog
          aria-describedby="research-pipeline-confirmation-detail"
          aria-labelledby="research-pipeline-confirmation-title"
          aria-modal="true"
          className="research-confirmation-dialog"
          onCancel={() => setIsResearchPipelineConfirmationOpen(false)}
          ref={researchPipelineConfirmationDialogRef}
          role="alertdialog"
        >
          <section className="research-confirmation-modal">
            <header>
              <div>
                <span className="research-confirmation-kicker">
                  <ShieldCheck size={15} />
                  {researchPipelinePreflight.status === "blocked"
                    ? i18n.locale === "zh-CN"
                      ? "研究运行预检"
                      : "Research run preflight"
                    : i18n.locale === "zh-CN"
                      ? "研究上下文复核"
                      : "Research context review"}
                </span>
                <h2 id="research-pipeline-confirmation-title">
                  {researchPipelinePreflight.status === "blocked"
                    ? i18n.locale === "zh-CN"
                      ? `有 ${
                          researchPipelinePreflight.issues.filter((issue) => issue.status === "blocked").length
                        } 项阻止运行`
                      : `${
                          researchPipelinePreflight.issues.filter((issue) => issue.status === "blocked").length
                        } items block this run`
                    : i18n.locale === "zh-CN"
                      ? `仍有 ${researchPipelinePreflight.issues.length} 项需要确认`
                      : `${researchPipelinePreflight.issues.length} items still need confirmation`}
                </h2>
              </div>
              <button
                aria-label={i18n.locale === "zh-CN" ? "关闭复核" : "Close review"}
                className="panel-icon-button"
                onClick={() => setIsResearchPipelineConfirmationOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <p id="research-pipeline-confirmation-detail">
              {researchPipelinePreflight.status === "blocked"
                ? i18n.locale === "zh-CN"
                  ? "当前研究上下文尚未达到运行条件。请先处理阻断项；休市等复核项不会阻止运行。"
                  : "The current research context is not ready. Resolve the blocked items first; review items such as a closed market do not block the run."
                : i18n.locale === "zh-CN"
                  ? "这些项目不会阻止审计运行，但可能影响研究结果的解释。请确认后继续。"
                  : "These items do not block the audited run, but they may affect how its results are interpreted."}
            </p>
            <div className="research-confirmation-issues">
              {researchPipelinePreflight.issues.map((issue) => {
                const target = researchPipelinePreflightIssueTargets[issue.id];
                const directRefreshAction =
                  !marketDataRefreshGuard.blocked &&
                  (issue.action === "refresh-cache" || issue.action === "refresh-watchlist-cache")
                    ? issue.action
                    : null;
                return (
                  <article className={issue.status} key={issue.id}>
                    <div className="research-confirmation-issue-copy">
                      <div>
                        <span>{researchPipelinePreflightIssueLabel(i18n, issue)}</span>
                        <strong>{researchContextReadinessValue(i18n, issue)}</strong>
                      </div>
                      <p>{researchContextReadinessDetail(i18n, issue)}</p>
                    </div>
                    <button
                      className="research-confirmation-issue-action"
                      disabled={
                        directRefreshAction
                          ? isResearchContextActionDisabled(
                              directRefreshAction,
                              refreshingCacheKey === activeCacheContextKey,
                              isRefreshingWatchlistCache,
                              marketDataRefreshGuard.blocked,
                              isSavingResearchNote,
                              isSavingWatchlist,
                              isSavingResearchWorkspace
                            )
                          : false
                      }
                      onClick={() => openResearchPipelinePreflightIssue(issue)}
                      type="button"
                    >
                      {directRefreshAction
                        ? researchContextReadinessActionLabel(
                            i18n,
                            directRefreshAction,
                            refreshingCacheKey === activeCacheContextKey,
                            isRefreshingWatchlistCache,
                            marketDataRefreshGuard.blocked,
                            isSavingResearchNote,
                            isSavingWatchlist,
                            isSavingResearchWorkspace
                          )
                        : i18n.locale === "zh-CN"
                          ? target.actionLabelZh
                          : target.actionLabelEn}
                    </button>
                  </article>
                );
              })}
            </div>
            <footer className="research-confirmation-actions">
              <button
                className="design-secondary-action"
                onClick={() => setIsResearchPipelineConfirmationOpen(false)}
                ref={researchPipelineConfirmationCancelButtonRef}
                type="button"
              >
                {researchPipelinePreflight.status === "blocked"
                  ? i18n.locale === "zh-CN"
                    ? "关闭"
                    : "Close"
                  : i18n.locale === "zh-CN"
                    ? "返回检查"
                    : "Review first"}
              </button>
              {researchPipelinePreflight.canRun ? (
                <button className="run-button" onClick={() => void runPipeline("accepted")} type="button">
                  <Play size={15} />
                  {i18n.locale === "zh-CN" ? "确认并运行研究" : "Confirm and run research"}
                </button>
              ) : null}
            </footer>
          </section>
        </dialog>
      ) : null}

      {isLiveTradingGateDialogOpen ? (
        <dialog
          aria-describedby="live-trading-gate-dialog-detail"
          aria-labelledby="live-trading-gate-dialog-title"
          aria-modal="true"
          className="research-confirmation-dialog live-trading-gate-dialog"
          onCancel={() => setIsLiveTradingGateDialogOpen(false)}
          ref={liveTradingGateDialogRef}
          role="alertdialog"
        >
          <section className="research-confirmation-modal live-trading-gate-modal">
            <header>
              <div>
                <span className="research-confirmation-kicker">
                  <ShieldCheck size={15} />
                  实盘人工门禁
                </span>
                <h2 id="live-trading-gate-dialog-title">实盘操作确认</h2>
              </div>
              <button
                aria-label="关闭实盘操作确认"
                className="panel-icon-button"
                onClick={() => setIsLiveTradingGateDialogOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <p id="live-trading-gate-dialog-detail">
              按当前状态完成凭据检查、权限核验、控制恢复和实名确认；打开窗口不会自动启用实盘。
            </p>
            <ExecutionStage10ProductionExecutionSection
              autoTradingSnapshot={autoTradingSnapshot}
              baseUrl={quantCoreBaseUrl}
              onAutoLiveAuthorized={completeLiveTradingGate}
              sectionId="live-trading-gate-dialog-control"
            />
          </section>
        </dialog>
      ) : null}

      {isChartExpanded ? (
        <div className="chart-modal-backdrop" role="dialog" aria-modal="true" aria-label={i18n.t("panel.chart.title")}>
          <section className="chart-modal">
            <header>
              <div>
                <h2>{workspace.selectedInstrument.name} · {klinesState.symbol}</h2>
                <span>{workspace.selectedTimeframe} · {i18n.t("panel.chart.title")}</span>
              </div>
              <button
                aria-label={i18n.t("chart.closeExpanded")}
                className="panel-icon-button"
                onClick={() => setIsChartExpanded(false)}
                title={i18n.t("chart.closeExpanded")}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <div className="chart-modal-body">
              <KlineChartCanvas
                key={`expanded-${klinesState.market}-${klinesState.symbol}-${klinesState.timeframe}`}
                bars={klinesState.bars}
                colorScheme={colorScheme}
                locale={locale}
                market={klinesState.market}
                onLoadHistorical={loadHistoricalKlines}
                symbol={klinesState.symbol}
                timeframe={klinesState.timeframe}
              />
              <div className="chart-data-strip">
                <span>{i18n.t("chart.symbol")}: {klinesState.symbol}</span>
                {latestChartBar ? <span>{i18n.t("chart.latestClose")}: {latestChartBar.close.toFixed(2)}</span> : null}
                {latestChartBar ? <span>{i18n.t("chart.asOf")}: {formatChartDate(latestChartBar.timestamp)}</span> : null}
                <span>{i18n.t("chart.source")}: {klinesState.quality.source}</span>
                <span>{i18n.t("chart.bars", { count: klinesState.bars.length })}</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}

    </div>
  );
}
