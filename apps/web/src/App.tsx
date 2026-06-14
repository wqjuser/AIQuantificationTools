import {
  BarChart3,
  BookmarkPlus,
  BrainCircuit,
  Check,
  Copy,
  Database,
  Download,
  GitBranch,
  Languages,
  Maximize2,
  Play,
  Radar,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Timer,
  Upload,
  WalletCards,
  X
} from "lucide-react";
import { ActionType, dispose, init, LoadDataType, type Chart, type KLineData } from "klinecharts";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
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
  loadResearchRunExport,
  loadResearchRunHistory,
  loadResearchRunPromotion,
  loadResearchNote,
  loadPlatformSettings,
  loadWatchlistCacheRefreshRuns,
  loadExecutionAdapterLedger,
  loadExecutionAdapterCertificationApplies,
  loadExecutionAdapterControlledRestartEvidence,
  loadExecutionAdapterRestartAcceptances,
  loadExecutionAdapterEnvironmentBindings,
  loadExecutionAdapterSecretMaterializations,
  loadExecutionAdapterSecretReferences,
  loadExecutionAdapterOrchestrationDryRuns,
  loadExecutionAdapterOrchestrationExecutions,
  loadExecutionAdapterHumanConfirmations,
  loadExecutionAdapterSandboxProbeExecutions,
  loadExecutionAdapterSandboxProbePlans,
  loadExecutionAdapterSandboxProbeReviews,
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
  recordExecutionAdapterRuntimeReloadAcceptance,
  recordExecutionAdapterCertification,
  recordExecutionAdapterCertificationApply,
  runPortfolioBacktest,
  recordPortfolioPaperOrderBatch,
  refreshMarketCache,
  refreshWatchlistCacheRun,
  loadStrategyLibrary,
  loadTerminalWorkspace,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  normalizeResearchRunExportPackagePayload,
  buildAuditEvidenceReportAuditEvent,
  buildBacktestReportAuditEvent,
  buildP0PlatformReadinessReportAuditEvent,
  buildPortfolioBacktestReportAuditEvent,
  buildMarketDataRefreshOverrideAuditEvent,
  buildAuditSigningKeyRotationApplyAuditEvent,
  buildAuditSigningKeyRotationPlanAuditEvent,
  buildResearchRunExportAuditReport,
  withResearchRunExportAuditEvidenceArtifacts,
  withVerifiedResearchRunExportPackageReportSignatures,
  withResearchRunExportReportSignatures,
  MarketCalendarResult,
  MarketCalendarStatus,
  MarketKlinesResult,
  MarketSearchSuggestion,
  PaperExecutionRecord,
  PromotionCandidateRecord,
  AiReviewRunRecordEnvelope,
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
  ExecutionAdapterSecretMaterializationResult,
  ExecutionAdapterSecretReferenceResult,
  ExecutionAdapterOrchestrationDryRunResult,
  ExecutionAdapterOrchestrationExecutionResult,
  ExecutionAdapterHumanConfirmationResult,
  ExecutionAdapterSandboxProbeExecutionResult,
  ExecutionAdapterSandboxProbePlanResult,
  ExecutionAdapterSandboxProbeReviewResult,
  ExecutionAdapterProductionRouteReviewResult,
  ExecutionAdapterHealthProbeLoadResult,
  ExecutionAdapterRuntimeReloadAcceptanceResult,
  ExecutionAdapterRuntimeReloadExecutionResult,
  ExecutionAdapterRuntimeReloadPlanResult,
  ExecutionAdapterLedgerResult,
  ExecutionAdapterCertificationRun,
  PlatformSettingsResult,
  PlatformSettingsStatus,
  PortfolioBacktestResult,
  PortfolioPaperOrderBatch,
  PortfolioPaperOrderLifecycleEvent,
  PortfolioPaperOrderReplay,
  PortfolioPaperOrderStateHistory,
  PortfolioPaperOrderSimulation,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  ResearchRunExportAuditReport,
  ResearchRunExportPackage,
  ResearchRunHistoryResult,
  ResearchNoteResult,
  saveResearchWorkspaceState,
  saveWatchlist,
  saveResearchNote,
  saveAuditEvent,
  signAuditReportEvent,
  revokeAuditReportEvent,
  recordPortfolioPaperOrderApproval,
  recordPortfolioPaperOrderSimulation,
  saveAiReviewRunRecord,
  saveStrategySnapshot,
  StrategyLibraryItem,
  StrategyLibraryResult,
  StrategyValidationResult,
  submitResearchRunPaperExecution,
  validateStrategySnapshot,
  verifyAuditReportEvent,
  WorkspaceLoadResult
} from "./lib/terminal-api";
import { createI18n, Locale, resolveInitialLocale, supportedLocales } from "./lib/i18n";
import {
  buildTerminalWorkspace,
  buildAgentCommitteeRounds,
  buildAiActionWorkflowState,
  buildAiEvidenceCards,
  buildAiReviewDossier,
  buildAiReviewReportMarkdown,
  buildAiReviewAuditTimelineItems,
  buildAiReviewExportEvidenceIndexRows,
  buildAiReviewRecordDriftRows,
  buildAiReviewRunRecord,
  buildAuditEvidenceReportMarkdown,
  buildAuditEvidenceSummary,
  buildAuditEvidenceReportLedgerRows,
  buildAuditEvidenceReportLedgerSummary,
  buildMarketDataRefreshOverrideAuditLedgerRows,
  buildMarketDataRefreshOverrideAuditLedgerSummary,
  buildAuditSigningKeyRotationChainSummary,
  buildAuditSigningKeyRotationLedgerRows,
  buildAuditReplayWorkflowState,
  buildBacktestAssumptionRows,
  buildBacktestEvidenceCards,
  buildBacktestParameterScanRows,
  buildBacktestParameterScanSummary,
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
  buildExecutionAdapterProductionRouteReviewRows,
  buildExecutionAdapterHealthProbeRows,
  buildExecutionAdapterSecretMaterializationRows,
  buildExecutionAdapterSecretReferenceRows,
  buildExecutionAdapterRuntimeReloadAcceptanceRows,
  buildExecutionAdapterRuntimeReloadExecutionRows,
  buildExecutionAdapterRuntimeReloadPlanRows,
  buildExecutionAdapterCertificationRows,
  buildExecutionAdapterLedgerRows,
  createDefaultExecutionAdapterCertificationApplyConfirmations,
  buildGoldenPathRunbookPreview,
  buildGoldenPathWorkspaceContext,
  buildP0PaperExecutionPreflight,
  buildP0PlatformActionOutcome,
  buildP0PlatformActionOutcomeEvidenceLink,
  buildP0PlatformBacklogItems,
  buildP0PlatformReadinessReportMarkdown,
  buildP0PlatformReadinessSummary,
  buildMarketDataRefreshGuard,
  buildMarketDataProviderHealthTrendRows,
  buildMarketDataProviderHealthTrendSummary,
  buildPaperExecutionSummaryTiles,
  buildPaperPositionRows,
  buildPaperTradingRows,
  buildPortfolioBacktestDraft,
  buildPortfolioBacktestDiagnosticRows,
  buildPortfolioBacktestReportMarkdown,
  buildPortfolioPaperOrderApprovalRows,
  buildPortfolioPaperOrderLatestSimulationSummary,
  buildPortfolioPaperOrderLifecycleRows,
  buildPortfolioPaperOrderSimulationRouteRows,
  buildPortfolioPaperOrderReplayPositionRows,
  buildPortfolioPaperOrderReplaySummaryTiles,
  buildPortfolioPaperOrderStateHistoryRows,
  buildPortfolioPeerAuditPlan,
  buildPortfolioRiskRows,
  buildProductWorkAreas,
  buildPromotionReadiness,
  buildResearchContextEvidenceRows,
  buildResearchContextReadinessRows,
  buildResearchPipelinePreflight,
  buildResearchRunContextBinding,
  buildResearchRunComparisonRows,
  buildResearchWorkspaceStateDraft,
  researchWorkspaceStateMatchesDraft,
  buildResearchRunExportBrowserRows,
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
  filterAiReviewExportEvidenceIndexRows,
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
  researchRunEvidenceLogLabel,
  resolveProductWorkAreaSelection,
  resolveSavedResearchWorkspaceSelection,
  resolveSavedResearchWorkspaceId,
  resolveWatchlistCacheRefreshRunIdFromUrl,
  watchlistIncludesInstrument,
  AiWorkbenchAction,
  AiEvidenceCard,
  AiReviewDossier,
  AiReviewCitation,
  AiReviewAuditTimelineItem,
  AiReviewExportEvidenceIndexRow,
  AiReviewRecordDriftRow,
  AiReviewRunRecord,
  AuditEvidenceSummary,
  AuditEvidenceReportLedgerRow,
  MarketDataRefreshOverrideAuditLedgerRow,
  AuditSigningKeyRotationChainSummary,
  AuditSigningKeyRotationLedgerRow,
  Market,
  MarketDataRefreshGuard,
  MarketDataRefreshOverride,
  AgentCommitteeRound,
  BacktestAssumptionField,
  BacktestAssumptionRow,
  BacktestEvidenceCard,
  BacktestParameterScanRow,
  BacktestParameterScanSummary,
  BacktestReport,
  BacktestReadinessGate,
  BacktestRunComparisonMatrixBadge,
  BacktestRunComparisonMatrixRow,
  BacktestRunComparisonMatrixSummary,
  BacktestTradeRow,
  BrokerAdapterRow,
  ExecutionAdapterCertificationApplyConfirmationKey,
  ExecutionAdapterCertificationApplyConfirmationRow,
  ExecutionAdapterCertificationApplyConfirmations,
  ExecutionAdapterCertificationApplyRow,
  ExecutionAdapterControlledRestartEvidenceRow,
  ExecutionAdapterRestartAcceptanceRow,
  ExecutionAdapterEnvironmentBindingRow,
  ExecutionAdapterOrchestrationDryRunRow,
  ExecutionAdapterOrchestrationExecutionRow,
  ExecutionAdapterHumanConfirmationRow,
  ExecutionAdapterSandboxProbeExecutionRow,
  ExecutionAdapterSandboxProbePlanRow,
  ExecutionAdapterSandboxProbeReviewRow,
  ExecutionAdapterProductionRouteReviewRow,
  ExecutionAdapterHealthProbeRow,
  ExecutionAdapterSecretMaterializationRow,
  ExecutionAdapterSecretReferenceRow,
  ExecutionAdapterRuntimeReloadAcceptanceRow,
  ExecutionAdapterRuntimeReloadExecutionRow,
  ExecutionAdapterRuntimeReloadPlanRow,
  ExecutionAdapterCertificationRow,
  ExecutionAdapterLedgerRow,
  GoldenPathWorkspaceContext,
  GoldenPathRunbookPreviewItem,
  P0PlatformActionOutcome,
  P0PlatformBacklogItem,
  P0PaperExecutionPreflightGate,
  P0PlatformReadinessSummary,
  PaperPositionRow,
  PaperExecutionSummaryTile,
  PaperTradingRow,
  PortfolioBacktestDraft,
  PortfolioBacktestDiagnosticRow,
  PortfolioPaperOrderApprovalRow,
  PortfolioPaperOrderLatestSimulationSummary,
  PortfolioPaperOrderLifecycleRow,
  PortfolioPaperOrderSimulationRouteRow,
  PortfolioPaperOrderReplayPositionRow,
  PortfolioPaperOrderReplaySummaryTile,
  PortfolioPaperOrderStateHistoryRow,
  PortfolioPeerAuditPlan,
  PortfolioRiskRow,
  PromotionQueueStage,
  PromotionReadiness,
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
  RiskApprovalGate,
  RiskApprovalSummary,
  ScannerCandidate,
  StrategyConditionKind,
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
  resolveResearchContextUrlState,
  resolveAdapterWorkflowInstrument,
  resolveWatchlistCacheRefreshRunSelection,
  workspaceFromResearchRunAudit,
  workspaceWithAiAction,
  workspaceWithBacktestAssumption,
  workspaceWithBacktestParameterCandidate,
  workspaceWithAppliedResearchWorkspaceState,
  workspaceWithPreservedInteractiveState,
  workspaceWithResearchContextUrlState,
  workspaceWithSavedResearchWorkspaceState,
  workspaceWithSavedWatchlist,
  workspaceWithStrategyLibraryItem,
  workspaceWithStrategyRuleDraftField,
  workspaceWithStrategyTemplate,
  workspaceWithSelectedTimeframe,
  workspaceWithSelectedInstrument
} from "./lib/terminal-workbench";

const quantCoreBaseUrl = resolveQuantCoreBaseUrl({
  VITE_QUANT_API_BASE: import.meta.env.VITE_QUANT_API_BASE
});
const initialWorkspaceState: WorkspaceLoadResult = {
  workspace: buildInitialTerminalWorkspace(),
  source: "fallback",
  statusLabel: "Offline snapshot"
};
const initialRunHistoryState: ResearchRunHistoryResult = {
  runs: [],
  source: "fallback"
};
const initialKlinesState: MarketKlinesResult = {
  market: "ashare",
  symbol: "600000",
  timeframe: "1d",
  bars: [],
  quality: {
    source: "loading",
    isComplete: false,
    warnings: [],
    rows: 0
  },
  source: "fallback"
};
function buildFallbackMarketCalendarState(market: Market, error?: string): MarketCalendarResult {
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
    error
  };
}
const initialStrategyLibraryState: StrategyLibraryResult = {
  strategies: [],
  source: "fallback"
};
const initialStrategyValidationState: StrategyValidationResult = {
  source: "fallback"
};
const initialResearchNoteState: ResearchNoteResult = {
  source: "fallback"
};
const initialSettingsStatusState: PlatformSettingsResult = {
  source: "fallback"
};
const initialExecutionAdapterLedgerState: ExecutionAdapterLedgerResult = {
  source: "fallback"
};
const initialExecutionAdapterHealthProbeState: ExecutionAdapterHealthProbeLoadResult = {
  source: "fallback"
};
const initialAuditSigningKeyRegistryState: AuditSigningKeyRegistryResult = {
  source: "fallback"
};
const initialAuditSigningKeyRotationPlanState: AuditSigningKeyRotationPlanResult = {
  source: "fallback"
};
const initialAuditSigningKeyRotationApplyState: AuditSigningKeyRotationApplyResult = {
  source: "fallback"
};
const initialAuditSigningKeyRestartEvidenceState: AuditSigningKeyControlledRestartEvidenceResult = {
  source: "fallback"
};
const initialAuditSigningKeySecretMaterializationState: AuditSigningKeySecretMaterializationResult = {
  source: "fallback"
};
const initialAuditSigningKeyEnvironmentBindingState: AuditSigningKeyEnvironmentBindingResult = {
  source: "fallback"
};
const initialAuditSigningKeyRuntimeReloadPlanState: AuditSigningKeyRuntimeReloadPlanResult = {
  source: "fallback"
};
const initialAuditSigningKeyRuntimeReloadExecutionState: AuditSigningKeyRuntimeReloadExecutionResult = {
  source: "fallback"
};
const initialAuditSigningKeyRotationAcceptanceState: AuditSigningKeyRotationAcceptanceResult = {
  source: "fallback"
};
const initialAuditSigningKeyRotationLedgerStatus: AuditSigningKeyRotationLedgerStatus = {
  detail: "",
  state: "idle"
};
const initialGoldenPathStatusState: GoldenPathStatusResult = {
  source: "fallback"
};
const initialPortfolioBacktestState: PortfolioBacktestResult = {
  source: "fallback"
};

const timeframeOptions: Timeframe[] = ["1d", "1m", "5m", "15m", "30m", "60m"];
const chartKlineLimit = 500;
const chartRightBoundaryDistance = 0;
const AI_REVIEW_HISTORY_PAGE_SIZE = 5;
const AUDIT_REPORT_EVENTS_PAGE_SIZE = 8;
const MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE = 8;
const AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE = 5;
const IMPORT_AUDIT_EVENTS_PAGE_SIZE = 12;
const workflowStepDelayMs = 180;

interface WatchlistCacheSummary {
  total: number;
  fresh: number;
  stale: number;
  empty: number;
  rows: number;
}

interface InitialImportAuditEvidenceDeepLink {
  auditEventId: string | null;
  exportPath: string;
  focusQuery: string;
  runId: string;
}

interface InitialPaperExecutionDeepLink {
  executionId: string;
  runId: string;
}

type ImportAuditEvidenceDeepLinkStatus = InitialImportAuditEvidenceDeepLink & {
  error: string | null;
  status: "idle" | "loading" | "loaded" | "failed";
};

type PaperExecutionDeepLinkStatus = InitialPaperExecutionDeepLink & {
  error: string | null;
  status: "idle" | "loading" | "loaded" | "failed";
};

interface ResearchRunExportPackageInspectionResult {
  error?: string;
  ok: boolean;
}

interface AuditSigningKeyRotationLedgerStatus {
  detail: string;
  state: "idle" | "saving" | "saved" | "failed";
}

type MarketDataRefreshOverrideAuditStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; eventId: string }
  | { state: "failed"; error: string };

interface AuditSigningKeyRotationApplyConfirmations {
  legacySecretStored: boolean;
  newSecretMaterialStored: boolean;
  operatorReviewedPlan: boolean;
}

const initialAuditSigningKeyRotationApplyConfirmations: AuditSigningKeyRotationApplyConfirmations = {
  legacySecretStored: false,
  newSecretMaterialStored: false,
  operatorReviewedPlan: false
};

interface AuditSigningKeyRestartEvidenceConfirmations {
  restartWindowExecuted: boolean;
  rollbackPlanConfirmed: boolean;
  postRestartValidationPassed: boolean;
  operatorReviewedRestartLogs: boolean;
}

const initialAuditSigningKeyRestartEvidenceConfirmations: AuditSigningKeyRestartEvidenceConfirmations = {
  restartWindowExecuted: false,
  rollbackPlanConfirmed: false,
  postRestartValidationPassed: false,
  operatorReviewedRestartLogs: false
};

interface AuditSigningKeySecretMaterializationConfirmations {
  localSecretStoreWriteVerified: boolean;
  noRawSecretInPayload: boolean;
  envBindingPlanDocumented: boolean;
  rollbackPlanDocumented: boolean;
}

const initialAuditSigningKeySecretMaterializationConfirmations: AuditSigningKeySecretMaterializationConfirmations = {
  localSecretStoreWriteVerified: false,
  noRawSecretInPayload: false,
  envBindingPlanDocumented: false,
  rollbackPlanDocumented: false
};

interface AuditSigningKeyEnvironmentBindingConfirmations {
  runtimeEnvMappingVerified: boolean;
  configReloadPlanDocumented: boolean;
  noRawSecretInPayload: boolean;
  rollbackSnapshotRecorded: boolean;
}

const initialAuditSigningKeyEnvironmentBindingConfirmations: AuditSigningKeyEnvironmentBindingConfirmations = {
  runtimeEnvMappingVerified: false,
  configReloadPlanDocumented: false,
  noRawSecretInPayload: false,
  rollbackSnapshotRecorded: false
};

interface AuditSigningKeyRuntimeReloadPlanConfirmations {
  maintenanceWindowApproved: boolean;
  healthBaselineCaptured: boolean;
  configDiffReviewed: boolean;
  postReloadSmokePlanDocumented: boolean;
  rollbackOwnerAssigned: boolean;
}

const initialAuditSigningKeyRuntimeReloadPlanConfirmations: AuditSigningKeyRuntimeReloadPlanConfirmations = {
  maintenanceWindowApproved: false,
  healthBaselineCaptured: false,
  configDiffReviewed: false,
  postReloadSmokePlanDocumented: false,
  rollbackOwnerAssigned: false
};

interface AuditSigningKeyRuntimeReloadExecutionConfirmations {
  preReloadHealthVerified: boolean;
  reloadActionRecorded: boolean;
  postReloadSmokePassed: boolean;
  rollbackReadinessConfirmed: boolean;
  operatorConfirmedLiveBlocked: boolean;
}

const initialAuditSigningKeyRuntimeReloadExecutionConfirmations: AuditSigningKeyRuntimeReloadExecutionConfirmations = {
  preReloadHealthVerified: false,
  reloadActionRecorded: false,
  postReloadSmokePassed: false,
  rollbackReadinessConfirmed: false,
  operatorConfirmedLiveBlocked: false
};

interface AuditSigningKeyRotationAcceptanceConfirmations {
  executionEvidenceReviewed: boolean;
  signatureProbeVerified: boolean;
  legacyVerificationConfirmed: boolean;
  rollbackWindowStillOpen: boolean;
  operatorConfirmedActivationBlocked: boolean;
}

const initialAuditSigningKeyRotationAcceptanceConfirmations: AuditSigningKeyRotationAcceptanceConfirmations = {
  executionEvidenceReviewed: false,
  signatureProbeVerified: false,
  legacyVerificationConfirmed: false,
  rollbackWindowStillOpen: false,
  operatorConfirmedActivationBlocked: false
};

interface ExecutionAdapterRuntimeReloadAcceptanceConfirmations {
  executionEvidenceReviewed: boolean;
  postReloadHealthVerified: boolean;
  adapterHandshakeVerified: boolean;
  killSwitchStillEnabled: boolean;
  operatorConfirmedLiveBlocked: boolean;
}

const createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations =
  (): ExecutionAdapterRuntimeReloadAcceptanceConfirmations => ({
    executionEvidenceReviewed: false,
    postReloadHealthVerified: false,
    adapterHandshakeVerified: false,
    killSwitchStillEnabled: false,
    operatorConfirmedLiveBlocked: false
  });

const executionAdapterRuntimeReloadAcceptanceConfirmationRows: Array<{
  key: keyof ExecutionAdapterRuntimeReloadAcceptanceConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "executionEvidenceReviewed",
    labelEn: "Execution evidence reviewed",
    labelZh: "执行证据已复核"
  },
  {
    key: "postReloadHealthVerified",
    labelEn: "Post-reload health verified",
    labelZh: "重载后健康已验证"
  },
  {
    key: "adapterHandshakeVerified",
    labelEn: "Adapter handshake verified",
    labelZh: "适配器握手已验证"
  },
  {
    key: "killSwitchStillEnabled",
    labelEn: "Kill switch still enabled",
    labelZh: "急停仍启用"
  },
  {
    key: "operatorConfirmedLiveBlocked",
    labelEn: "Operator confirmed live remains blocked",
    labelZh: "操作员确认实盘仍阻断"
  }
];

interface ExecutionAdapterOrchestrationDryRunConfirmations {
  acceptedChainReviewed: boolean;
  sandboxHandshakeDryRunPassed: boolean;
  orderSchemaDryRunPassed: boolean;
  accountSyncDryRunPassed: boolean;
  operatorConfirmedNoLiveOrders: boolean;
}

const createDefaultExecutionAdapterOrchestrationDryRunConfirmations =
  (): ExecutionAdapterOrchestrationDryRunConfirmations => ({
    acceptedChainReviewed: false,
    sandboxHandshakeDryRunPassed: false,
    orderSchemaDryRunPassed: false,
    accountSyncDryRunPassed: false,
    operatorConfirmedNoLiveOrders: false
  });

const executionAdapterOrchestrationDryRunConfirmationRows: Array<{
  key: keyof ExecutionAdapterOrchestrationDryRunConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "acceptedChainReviewed",
    labelEn: "Acceptance chain reviewed",
    labelZh: "验收链已复核"
  },
  {
    key: "sandboxHandshakeDryRunPassed",
    labelEn: "Sandbox or paper handshake dry-run passed",
    labelZh: "沙盒/模拟握手 dry-run 已通过"
  },
  {
    key: "orderSchemaDryRunPassed",
    labelEn: "Order schema dry-run passed",
    labelZh: "订单 schema dry-run 已通过"
  },
  {
    key: "accountSyncDryRunPassed",
    labelEn: "Account sync dry-run passed",
    labelZh: "账户同步 dry-run 已通过"
  },
  {
    key: "operatorConfirmedNoLiveOrders",
    labelEn: "Operator confirmed no live orders were routed",
    labelZh: "操作员确认未路由实盘订单"
  }
];

interface ExecutionAdapterOrchestrationExecutionConfirmations {
  dryRunEvidenceReviewed: boolean;
  sandboxRouteLocked: boolean;
  killSwitchArmed: boolean;
  idempotencyKeyRecorded: boolean;
  operatorConfirmedNoCapital: boolean;
}

const createDefaultExecutionAdapterOrchestrationExecutionConfirmations =
  (): ExecutionAdapterOrchestrationExecutionConfirmations => ({
    dryRunEvidenceReviewed: false,
    sandboxRouteLocked: false,
    killSwitchArmed: false,
    idempotencyKeyRecorded: false,
    operatorConfirmedNoCapital: false
  });

const executionAdapterOrchestrationExecutionConfirmationRows: Array<{
  key: keyof ExecutionAdapterOrchestrationExecutionConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "dryRunEvidenceReviewed",
    labelEn: "Dry-run evidence reviewed",
    labelZh: "Dry-run 证据已复核"
  },
  {
    key: "sandboxRouteLocked",
    labelEn: "Sandbox route locked",
    labelZh: "沙盒/模拟路由已锁定"
  },
  {
    key: "killSwitchArmed",
    labelEn: "Kill switch armed",
    labelZh: "急停已武装"
  },
  {
    key: "idempotencyKeyRecorded",
    labelEn: "Idempotency key recorded",
    labelZh: "幂等键已记录"
  },
  {
    key: "operatorConfirmedNoCapital",
    labelEn: "Operator confirmed no capital can route",
    labelZh: "操作员确认无真实资金路由"
  }
];

interface ExecutionAdapterHumanConfirmationConfirmations {
  orchestrationExecutionReviewed: boolean;
  riskApprovalStillValid: boolean;
  paperExecutionReviewed: boolean;
  killSwitchReady: boolean;
  operatorConfirmedFinalBoundary: boolean;
}

const createDefaultExecutionAdapterHumanConfirmationConfirmations =
  (): ExecutionAdapterHumanConfirmationConfirmations => ({
    orchestrationExecutionReviewed: false,
    riskApprovalStillValid: false,
    paperExecutionReviewed: false,
    killSwitchReady: false,
    operatorConfirmedFinalBoundary: false
  });

const executionAdapterHumanConfirmationConfirmationRows: Array<{
  key: keyof ExecutionAdapterHumanConfirmationConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "orchestrationExecutionReviewed",
    labelEn: "Orchestration execution reviewed",
    labelZh: "编排执行证据已复核"
  },
  {
    key: "riskApprovalStillValid",
    labelEn: "Risk approval still valid",
    labelZh: "风控审批仍有效"
  },
  {
    key: "paperExecutionReviewed",
    labelEn: "Paper execution reviewed",
    labelZh: "模拟执行已复核"
  },
  {
    key: "killSwitchReady",
    labelEn: "Kill switch ready",
    labelZh: "急停已就绪"
  },
  {
    key: "operatorConfirmedFinalBoundary",
    labelEn: "Operator confirmed paper-only boundary",
    labelZh: "操作员确认仍仅记录模拟边界"
  }
];

interface ExecutionAdapterSandboxProbePlanConfirmations {
  humanConfirmationReviewed: boolean;
  testnetEndpointLocked: boolean;
  credentialsAreSandboxOnly: boolean;
  orderRoutingDisabled: boolean;
  probeLimitsDocumented: boolean;
}

const createDefaultExecutionAdapterSandboxProbePlanConfirmations =
  (): ExecutionAdapterSandboxProbePlanConfirmations => ({
    humanConfirmationReviewed: false,
    testnetEndpointLocked: false,
    credentialsAreSandboxOnly: false,
    orderRoutingDisabled: false,
    probeLimitsDocumented: false
  });

const executionAdapterSandboxProbePlanConfirmationRows: Array<{
  key: keyof ExecutionAdapterSandboxProbePlanConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "humanConfirmationReviewed",
    labelEn: "Final human confirmation reviewed",
    labelZh: "最终人工确认已复核"
  },
  {
    key: "testnetEndpointLocked",
    labelEn: "Sandbox/testnet endpoint locked",
    labelZh: "沙盒/testnet 端点已锁定"
  },
  {
    key: "credentialsAreSandboxOnly",
    labelEn: "Credentials are sandbox-only",
    labelZh: "凭据仅限沙盒/testnet"
  },
  {
    key: "orderRoutingDisabled",
    labelEn: "Order routing disabled",
    labelZh: "订单路由仍保持禁用"
  },
  {
    key: "probeLimitsDocumented",
    labelEn: "Probe limits documented",
    labelZh: "探针限制和回滚责任已记录"
  }
];

interface ExecutionAdapterSandboxProbeExecutionConfirmations {
  probePlanReviewed: boolean;
  readonlyHandshakeCaptured: boolean;
  accountSnapshotRedacted: boolean;
  orderSchemaValidated: boolean;
  operatorConfirmedNoOrdersSubmitted: boolean;
}

const createDefaultExecutionAdapterSandboxProbeExecutionConfirmations =
  (): ExecutionAdapterSandboxProbeExecutionConfirmations => ({
    probePlanReviewed: false,
    readonlyHandshakeCaptured: false,
    accountSnapshotRedacted: false,
    orderSchemaValidated: false,
    operatorConfirmedNoOrdersSubmitted: false
  });

const executionAdapterSandboxProbeExecutionConfirmationRows: Array<{
  key: keyof ExecutionAdapterSandboxProbeExecutionConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "probePlanReviewed",
    labelEn: "Probe plan reviewed",
    labelZh: "探针计划已复核"
  },
  {
    key: "readonlyHandshakeCaptured",
    labelEn: "Read-only handshake captured",
    labelZh: "只读握手证据已记录"
  },
  {
    key: "accountSnapshotRedacted",
    labelEn: "Account snapshot redacted",
    labelZh: "账户快照已脱敏"
  },
  {
    key: "orderSchemaValidated",
    labelEn: "Order schema validated",
    labelZh: "订单 schema 已验证"
  },
  {
    key: "operatorConfirmedNoOrdersSubmitted",
    labelEn: "Operator confirmed no orders submitted",
    labelZh: "操作员确认未提交任何订单"
  }
];

interface ExecutionAdapterSandboxProbeReviewConfirmations {
  probeExecutionReviewed: boolean;
  readonlyEvidenceMatchesPlan: boolean;
  redactedSnapshotArchived: boolean;
  orderSchemaRiskReviewed: boolean;
  productionRouteStillBlocked: boolean;
}

const createDefaultExecutionAdapterSandboxProbeReviewConfirmations =
  (): ExecutionAdapterSandboxProbeReviewConfirmations => ({
    probeExecutionReviewed: false,
    readonlyEvidenceMatchesPlan: false,
    redactedSnapshotArchived: false,
    orderSchemaRiskReviewed: false,
    productionRouteStillBlocked: false
  });

const executionAdapterSandboxProbeReviewConfirmationRows: Array<{
  key: keyof ExecutionAdapterSandboxProbeReviewConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "probeExecutionReviewed",
    labelEn: "Probe execution evidence reviewed",
    labelZh: "探针执行证据已复核"
  },
  {
    key: "readonlyEvidenceMatchesPlan",
    labelEn: "Read-only evidence matches plan",
    labelZh: "只读证据与计划一致"
  },
  {
    key: "redactedSnapshotArchived",
    labelEn: "Redacted snapshots archived",
    labelZh: "脱敏快照已归档"
  },
  {
    key: "orderSchemaRiskReviewed",
    labelEn: "Order schema risk reviewed",
    labelZh: "订单 schema 风险已复核"
  },
  {
    key: "productionRouteStillBlocked",
    labelEn: "Production route still blocked",
    labelZh: "生产路由仍保持阻断"
  }
];

interface ExecutionAdapterProductionRouteReviewConfirmations {
  sandboxProbeReviewAccepted: boolean;
  killSwitchPolicyReviewed: boolean;
  orderRoutingDisabledVerified: boolean;
  positionLimitPolicyReviewed: boolean;
  rollbackOwnerRecorded: boolean;
}

const createDefaultExecutionAdapterProductionRouteReviewConfirmations =
  (): ExecutionAdapterProductionRouteReviewConfirmations => ({
    sandboxProbeReviewAccepted: false,
    killSwitchPolicyReviewed: false,
    orderRoutingDisabledVerified: false,
    positionLimitPolicyReviewed: false,
    rollbackOwnerRecorded: false
  });

const executionAdapterProductionRouteReviewConfirmationRows: Array<{
  key: keyof ExecutionAdapterProductionRouteReviewConfirmations;
  labelEn: string;
  labelZh: string;
}> = [
  {
    key: "sandboxProbeReviewAccepted",
    labelEn: "Sandbox review accepted",
    labelZh: "sandbox 复核已采纳"
  },
  {
    key: "killSwitchPolicyReviewed",
    labelEn: "Kill-switch policy reviewed",
    labelZh: "急停策略已复核"
  },
  {
    key: "orderRoutingDisabledVerified",
    labelEn: "Order routing still disabled",
    labelZh: "订单路由仍禁用"
  },
  {
    key: "positionLimitPolicyReviewed",
    labelEn: "Position limits reviewed",
    labelZh: "仓位限额已复核"
  },
  {
    key: "rollbackOwnerRecorded",
    labelEn: "Rollback owner recorded",
    labelZh: "回滚责任人已记录"
  }
];

const workflowIcons: Record<string, typeof BarChart3> = {
  research: Radar,
  strategy: GitBranch,
  backtest: BarChart3,
  "agent-review": BrainCircuit,
  paper: WalletCards
};

const workAreaIcons: Record<ProductWorkAreaId, typeof BarChart3> = {
  market: Database,
  research: Radar,
  strategy: GitBranch,
  backtest: BarChart3,
  "ai-review": BrainCircuit,
  portfolio: ShieldCheck,
  execution: WalletCards,
  audit: Download,
  settings: Languages
};

const workflowAccentByStep: Record<string, TerminalModule["accent"]> = {
  research: "market",
  strategy: "strategy",
  backtest: "ai",
  "agent-review": "ai",
  paper: "execution"
};
const workflowStepIds = ["research", "strategy", "backtest", "agent-review", "paper"] as const;
const productWorkAreaIds: ProductWorkAreaId[] = [
  "market",
  "research",
  "strategy",
  "backtest",
  "ai-review",
  "portfolio",
  "execution",
  "audit",
  "settings"
];

function resolveInitialWorkAreaId(fallback: ProductWorkAreaId): ProductWorkAreaId {
  if (typeof window === "undefined") {
    return fallback;
  }
  const workspaceParam = new URLSearchParams(window.location.search).get("workspace");
  if (workspaceParam && productWorkAreaIds.includes(workspaceParam as ProductWorkAreaId)) {
    return workspaceParam as ProductWorkAreaId;
  }
  const workflowParam = new URLSearchParams(window.location.search).get("workflow");
  const legacyWorkflowMap: Record<string, ProductWorkAreaId> = {
    research: "research",
    strategy: "strategy",
    backtest: "backtest",
    "agent-review": "ai-review",
    paper: "execution"
  };
  return workflowParam && workflowStepIds.includes(workflowParam as (typeof workflowStepIds)[number])
    ? legacyWorkflowMap[workflowParam] ?? fallback
    : fallback;
}

function resolveInitialImportAuditEventId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const auditEvent = new URLSearchParams(window.location.search).get("auditEvent");
  return auditEvent?.trim() || null;
}

function resolveInitialImportAuditEvidenceQuery(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("auditEvent")?.trim() ||
    params.get("exportPath")?.trim() ||
    params.get("runId")?.trim() ||
    ""
  );
}

function resolveInitialImportAuditEvidenceDeepLink(): InitialImportAuditEvidenceDeepLink | null {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("paperExecution")?.trim()) {
    return null;
  }
  const runId = params.get("runId")?.trim();
  if (!runId) {
    return null;
  }
  const exportPath = params.get("exportPath")?.trim() || `manifest:${runId}`;
  return {
    auditEventId: params.get("auditEvent")?.trim() || null,
    exportPath,
    focusQuery: researchRunImportAuditEvidenceAnchorQuery(runId, exportPath),
    runId
  };
}

function resolveInitialPaperExecutionDeepLink(): InitialPaperExecutionDeepLink | null {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const executionId = params.get("paperExecution")?.trim();
  const runId = params.get("runId")?.trim();
  if (!executionId || !runId) {
    return null;
  }
  return { executionId, runId };
}

function resolveInitialWatchlistCacheRefreshRunId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return resolveWatchlistCacheRefreshRunIdFromUrl(window.location.search);
}

function resolveInitialResearchContextUrlState(): ResearchContextUrlState | null {
  if (typeof window === "undefined") {
    return null;
  }
  return resolveResearchContextUrlState(window.location.search);
}

function hasExplicitResearchContextUrl(): boolean {
  return Boolean(resolveInitialResearchContextUrlState());
}

function buildInitialTerminalWorkspace(): TerminalWorkspace {
  return workspaceWithResearchContextUrlState(buildTerminalWorkspace(), resolveInitialResearchContextUrlState());
}

function replaceWatchlistCacheRefreshRunUrlParam(runId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  if (runId) {
    url.searchParams.set("watchlistRefreshRun", runId);
  } else {
    url.searchParams.delete("watchlistRefreshRun");
  }
  const search = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}

function resolveInitialWorkAreaSelection(workspace: TerminalWorkspace) {
  return resolveProductWorkAreaSelection(
    workspace,
    resolveInitialWorkAreaId(resolveSavedResearchWorkspaceId(workspace, "research"))
  );
}

function hasExplicitWorkAreaUrl(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has("workspace") || params.has("workflow");
}

function createWorkflowRunState(): WorkflowRunState {
  return {
    activeStageId: "data",
    completedStageIds: [],
    log: []
  };
}

function createWorkflowLogEntry(
  runId: number,
  index: number,
  stageId: string,
  level: WorkflowRunLogEntry["level"],
  message: string
): WorkflowRunLogEntry {
  return {
    id: `workflow-${runId}-${index}-${stageId}`,
    stageId,
    level,
    message
  };
}

function mergeAuditEvidenceReportEvent(events: AuditEventRecord[], event: AuditEventRecord): AuditEventRecord[] {
  return [event, ...events.filter((current) => current.eventId !== event.eventId)];
}

function mergePortfolioPaperOrderLifecycleEvents(
  events: PortfolioPaperOrderLifecycleEvent[],
  batchId: string,
  replacement: PortfolioPaperOrderLifecycleEvent[]
): PortfolioPaperOrderLifecycleEvent[] {
  return [...events.filter((event) => event.batchId !== batchId), ...replacement];
}

function mergePortfolioPaperOrderSimulations(
  events: PortfolioPaperOrderSimulation[],
  batchId: string,
  replacement: PortfolioPaperOrderSimulation[]
): PortfolioPaperOrderSimulation[] {
  return [...events.filter((event) => event.batchId !== batchId), ...replacement];
}

function mergePortfolioPaperOrderStateHistories(
  histories: PortfolioPaperOrderStateHistory[],
  replacement: PortfolioPaperOrderStateHistory
): PortfolioPaperOrderStateHistory[] {
  return [
    replacement,
    ...histories.filter(
      (history) => history.baseRunId !== replacement.baseRunId || history.batchId !== replacement.batchId
    )
  ];
}

function waitForWorkflowStep() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, workflowStepDelayMs));
}

function buildAdapterCertificationEvidenceChecks(
  adapter: PlatformSettingsStatus["executionAdapters"][number]
): ExecutionAdapterCertificationCheck[] {
  const hasPaperReadyContract = adapter.status === "paper_ready";
  return [
    {
      id: "sandbox-credentials",
      label: "Sandbox credential reference",
      status: hasPaperReadyContract ? "passed" : "blocked",
      detail: hasPaperReadyContract
        ? "Paper or sandbox route is present without exposing secret material."
        : "Sandbox or paper credential reference has not been certified.",
      metadata: {
        adapterStatus: adapter.status,
        credentialReference: "not-requested"
      }
    },
    {
      id: "order-lifecycle",
      label: "Order lifecycle evidence",
      status: "blocked",
      detail: "Submit, cancel, fill, reject, and reconnect evidence must be replayed before live routing."
    },
    {
      id: "emergency-stop",
      label: "Emergency stop and limits",
      status: "blocked",
      detail: "Max order, position, drawdown, and emergency-stop controls require operator evidence."
    },
    {
      id: "controlled-restart",
      label: "Controlled restart evidence",
      status: "review",
      detail: "Controlled restart and account sync evidence is not bound to this certification run."
    }
  ];
}

export function App() {
  const [{ workspace, source, statusLabel, error }, setWorkspaceState] = useState(initialWorkspaceState);
  const [{ runs: runHistory }, setRunHistoryState] = useState(initialRunHistoryState);
  const [strategyLibraryState, setStrategyLibraryState] = useState<StrategyLibraryResult>(initialStrategyLibraryState);
  const [strategyValidationState, setStrategyValidationState] =
    useState<StrategyValidationResult>(initialStrategyValidationState);
  const [researchNoteState, setResearchNoteState] = useState<ResearchNoteResult>(initialResearchNoteState);
  const [settingsStatus, setSettingsStatus] = useState<PlatformSettingsResult>(initialSettingsStatusState);
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
  const [portfolioBacktestState, setPortfolioBacktestState] =
    useState<PortfolioBacktestResult>(initialPortfolioBacktestState);
  const [portfolioPaperOrderBatches, setPortfolioPaperOrderBatches] = useState<PortfolioPaperOrderBatch[]>([]);
  const [portfolioPaperOrderLifecycleEvents, setPortfolioPaperOrderLifecycleEvents] = useState<
    PortfolioPaperOrderLifecycleEvent[]
  >([]);
  const [portfolioPaperOrderSimulations, setPortfolioPaperOrderSimulations] = useState<PortfolioPaperOrderSimulation[]>([]);
  const [portfolioPaperOrderReplay, setPortfolioPaperOrderReplay] = useState<PortfolioPaperOrderReplay | null>(null);
  const [portfolioPaperOrderStateHistories, setPortfolioPaperOrderStateHistories] = useState<
    PortfolioPaperOrderStateHistory[]
  >([]);
  const [portfolioPaperOrderHistoryError, setPortfolioPaperOrderHistoryError] = useState<string | null>(null);
  const [researchNoteDraft, setResearchNoteDraft] = useState("");
  const [klinesState, setKlinesState] = useState(initialKlinesState);
  const [marketCalendarState, setMarketCalendarState] = useState<MarketCalendarResult>(() =>
    buildFallbackMarketCalendarState(workspace.selectedInstrument.market)
  );
  const [locale, setLocale] = useState<Locale>(() =>
    resolveInitialLocale(typeof window === "undefined" ? null : window.localStorage.getItem("aiqt.locale"))
  );
  const initialWorkAreaSelection = resolveInitialWorkAreaSelection(workspace);
  const [activeWorkAreaId, setActiveWorkAreaId] = useState<ProductWorkAreaId>(() => initialWorkAreaSelection.areaId);
  const [activeLoopStepId, setActiveLoopStepId] = useState(() => initialWorkAreaSelection.quantLoopStepId);
  const [activeWorkflowStageId, setActiveWorkflowStageId] = useState(
    () => initialWorkAreaSelection.workflowStageId
  );
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
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);
  const [isSavingResearchWorkspace, setIsSavingResearchWorkspace] = useState(false);
  const [isSubmittingPaperExecution, setIsSubmittingPaperExecution] = useState(false);
  const [isRunningPortfolioBacktest, setIsRunningPortfolioBacktest] = useState(false);
  const [isRecordingPortfolioPaperOrders, setIsRecordingPortfolioPaperOrders] = useState(false);
  const [approvingPortfolioPaperOrderId, setApprovingPortfolioPaperOrderId] = useState<string | null>(null);
  const [simulatingPortfolioPaperOrderId, setSimulatingPortfolioPaperOrderId] = useState<string | null>(null);
  const [isPreparingPortfolioPeers, setIsPreparingPortfolioPeers] = useState(false);
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
  const [isRefreshingWatchlistCache, setIsRefreshingWatchlistCache] = useState(false);
  const [watchlistCacheRefreshHistory, setWatchlistCacheRefreshHistory] = useState<CacheWatchlistRefreshRun[]>([]);
  const [selectedWatchlistCacheRefreshRunId, setSelectedWatchlistCacheRefreshRunId] = useState<string | null>(
    resolveInitialWatchlistCacheRefreshRunId
  );
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [paperExecutionRecord, setPaperExecutionRecord] = useState<PaperExecutionRecord | null>(null);
  const [promotionCandidateRecord, setPromotionCandidateRecord] = useState<PromotionCandidateRecord | null>(null);
  const [aiReviewRunRecords, setAiReviewRunRecords] = useState<AiReviewRunRecordEnvelope[]>([]);
  const [inspectedExportPackage, setInspectedExportPackage] = useState<ResearchRunExportPackage | null>(null);
  const [pendingImportPackage, setPendingImportPackage] = useState<{
    exportPackage: ResearchRunExportPackage;
    fileName: string;
  } | null>(null);
  const initialImportAuditEvidenceDeepLink = resolveInitialImportAuditEvidenceDeepLink();
  const initialPaperExecutionDeepLink = resolveInitialPaperExecutionDeepLink();
  const [auditEvidenceReportEvents, setAuditEvidenceReportEvents] = useState<AuditEventRecord[]>([]);
  const [marketDataRefreshOverrideAuditEvents, setMarketDataRefreshOverrideAuditEvents] = useState<AuditEventRecord[]>([]);
  const [auditSigningKeyRotationEvents, setAuditSigningKeyRotationEvents] = useState<AuditEventRecord[]>([]);
  const [auditEvidenceReportPagination, setAuditEvidenceReportPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [auditEvidenceReportQuery, setAuditEvidenceReportQuery] = useState("");
  const [auditEvidenceReportOffset, setAuditEvidenceReportOffset] = useState(0);
  const [marketDataRefreshOverrideAuditPagination, setMarketDataRefreshOverrideAuditPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [marketDataRefreshOverrideAuditQuery, setMarketDataRefreshOverrideAuditQuery] = useState("");
  const [marketDataRefreshOverrideAuditOffset, setMarketDataRefreshOverrideAuditOffset] = useState(0);
  const [researchRunImportAuditEvents, setResearchRunImportAuditEvents] = useState<ResearchRunImportAuditEvent[]>([]);
  const [researchRunImportAuditPagination, setResearchRunImportAuditPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [researchRunImportAuditQuery, setResearchRunImportAuditQuery] = useState(resolveInitialImportAuditEvidenceQuery);
  const [researchRunImportAuditOffset, setResearchRunImportAuditOffset] = useState(0);
  const [focusedImportAuditEventId, setFocusedImportAuditEventId] = useState<string | null>(() => resolveInitialImportAuditEventId());
  const [copiedImportAuditEvidenceEventId, setCopiedImportAuditEvidenceEventId] = useState<string | null>(null);
  const [copiedP0ActionOutcomeEvidenceId, setCopiedP0ActionOutcomeEvidenceId] = useState<string | null>(null);
  const [copiedP0ReadinessReport, setCopiedP0ReadinessReport] = useState(false);
  const [savingP0ReadinessReport, setSavingP0ReadinessReport] = useState(false);
  const [copiedAuditEvidenceSummary, setCopiedAuditEvidenceSummary] = useState(false);
  const [copiedAuditEvidenceReport, setCopiedAuditEvidenceReport] = useState(false);
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
  const savedResearchWorkspaceSelectionAppliedRef = useRef(hasExplicitWorkAreaUrl());
  const chartRequestIdRef = useRef(0);
  const workflowRunIdRef = useRef(0);
  const strategyValidationRequestIdRef = useRef(0);
  const aiReviewHistoryRequestIdRef = useRef(0);
  const auditEvidenceReportRequestIdRef = useRef(0);
  const marketDataRefreshOverrideAuditRequestIdRef = useRef(0);
  const researchRunImportAuditRequestIdRef = useRef(0);
  const importAuditCopyResetTimerRef = useRef<number | null>(null);
  const auditEvidenceSummaryCopyResetTimerRef = useRef<number | null>(null);
  const auditEvidenceReportCopyResetTimerRef = useRef<number | null>(null);
  const initialImportAuditEvidenceDeepLinkRef = useRef(initialImportAuditEvidenceDeepLink);
  const initialPaperExecutionDeepLinkRef = useRef(initialPaperExecutionDeepLink);
  const klinesStateRef = useRef(initialKlinesState);
  const historicalKlineRequestRef = useRef<string | null>(null);
  const symbolSearchRequestIdRef = useRef(0);
  const skipNextSymbolSearchRef = useRef(false);
  const setWatchlistCacheRefreshRunSelection = useCallback((runId: string | null) => {
    setSelectedWatchlistCacheRefreshRunId(runId);
    replaceWatchlistCacheRefreshRunUrlParam(runId);
  }, []);
  const i18n = createI18n(locale);
  const goldenPath = goldenPathState.goldenPath;
  const productWorkAreas = productWorkAreasWithGoldenPath(buildProductWorkAreas(workspace), goldenPath);
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
  const aiReviewDossier = buildAiReviewDossier(workspace);
  const currentAiReviewRunRecord = buildAiReviewRunRecord(workspace);
  const researchRunContextBinding = buildResearchRunContextBinding(workspace);
  const currentResearchRunId = researchRunContextBinding.canUseRun ? workspace.researchRun?.runId : null;
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
  const activePromotionCandidateRecord =
    promotionCandidateRecord?.runId && promotionCandidateRecord.runId === currentResearchRunId ? promotionCandidateRecord : null;
  const activeAiReviewRunRecords = currentResearchRunId
    ? aiReviewRunRecords.filter((record) => record.runId === currentResearchRunId)
    : [];
  const paperExecutionSummaryTiles = buildPaperExecutionSummaryTiles(workspace, activePaperExecutionRecord);
  const paperPositionRows = buildPaperPositionRows(workspace, activePaperExecutionRecord);
  const paperTradingRows = buildPaperTradingRows(workspace);
  const executionAdapterLedgerRows = buildExecutionAdapterLedgerRows(executionAdapterLedger.adapterLedger);
  const executionAdapterHealthProbeRows = buildExecutionAdapterHealthProbeRows(executionAdapterHealthProbe.adapterHealthProbe);
  const executionAdapterCertificationRows = buildExecutionAdapterCertificationRows(executionAdapterCertifications);
  const executionAdapterCertificationApplyRows = buildExecutionAdapterCertificationApplyRows(executionAdapterCertificationApplies);
  const executionAdapterControlledRestartEvidenceRows = buildExecutionAdapterControlledRestartEvidenceRows(executionAdapterControlledRestartEvidence);
  const executionAdapterRestartAcceptanceRows = buildExecutionAdapterRestartAcceptanceRows(executionAdapterRestartAcceptances);
  const executionAdapterEnvironmentBindingRows = buildExecutionAdapterEnvironmentBindingRows(executionAdapterEnvironmentBindings);
  const executionAdapterSecretMaterializationRows = buildExecutionAdapterSecretMaterializationRows(executionAdapterSecretMaterializations);
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
    portfolioPaperOrderStateHistoryRows
  );
  const persistedPaperTradingRows = activePaperExecutionRecord
    ? paperTradingRowsFromExecutionRecord(activePaperExecutionRecord)
    : null;
  const visiblePaperTradingRows = persistedPaperTradingRows ?? paperTradingRows;
  const researchRunExportPreviewRows = buildResearchRunExportPreviewRows({
    aiReviewRecords: activeAiReviewRunRecords,
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
  const marketDataRefreshOverrideAuditRows = buildMarketDataRefreshOverrideAuditLedgerRows(
    marketDataRefreshOverrideAuditEvents
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
  const researchRunImportDiffRows = buildResearchRunImportDiffRows({
    aiReviewRecords: activeAiReviewRunRecords,
    exportPackage: pendingImportPackage?.exportPackage ?? inspectedExportPackage,
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
  const backtestAssumptionRows = buildBacktestAssumptionRows(workspace);
  const backtestEvidenceCards = buildBacktestEvidenceCards(workspace);
  const backtestParameterScanRows = buildBacktestParameterScanRows(workspace);
  const backtestParameterScanSummary = buildBacktestParameterScanSummary(workspace);
  const backtestReport = buildBacktestReport(workspace);
  const backtestRunComparisonMatrixRows = buildBacktestRunComparisonMatrixRows(runHistory, currentResearchRunId);
  const backtestRunComparisonMatrixSummary = buildBacktestRunComparisonMatrixSummary(backtestRunComparisonMatrixRows);
  const backtestReadinessGates = buildBacktestReadinessGates(workspace);
  const backtestTradeRows = buildBacktestTradeRows(workspace);
  const brokerAdapterRows = buildBrokerAdapterRows(workspace);
  const promotionReadiness =
    activePromotionCandidateRecord ??
    buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows);
  const runComparisonRows = buildResearchRunComparisonRows(runHistory);
  const activeCacheContext = settingsStatus.settings?.cache.contexts.find(
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
  const p0PlatformReadinessReportMarkdown = useMemo(
    () =>
      buildP0PlatformReadinessReportMarkdown({
        backlogItems: p0PlatformBacklogItems,
        evidenceLink: p0ActionOutcomeEvidenceLink,
        outcome: p0PlatformActionOutcome,
        paperPreflight: p0PaperExecutionPreflight,
        summary: p0PlatformReadinessSummary
      }),
    [
      p0ActionOutcomeEvidenceLink,
      p0PlatformActionOutcome,
      p0PlatformBacklogItems,
      p0PaperExecutionPreflight,
      p0PlatformReadinessSummary
    ]
  );

  useEffect(() => {
    klinesStateRef.current = klinesState;
  }, [klinesState]);

  useEffect(() => {
    setCopiedP0ReadinessReport(false);
  }, [p0PlatformReadinessReportMarkdown]);

  useEffect(() => {
    setPortfolioBacktestState(initialPortfolioBacktestState);
  }, [portfolioBacktestDraftKey]);

  useEffect(() => {
    const baseRunId = workspace.researchRun?.runId;
    if (!baseRunId) {
      setPortfolioPaperOrderBatches([]);
      setPortfolioPaperOrderLifecycleEvents([]);
      setPortfolioPaperOrderSimulations([]);
      setPortfolioPaperOrderReplay(null);
      setPortfolioPaperOrderStateHistories([]);
      setPortfolioPaperOrderHistoryError(null);
      return;
    }
    let cancelled = false;
    setPortfolioPaperOrderHistoryError(null);
    void loadPortfolioPaperOrderReplay(quantCoreBaseUrl, baseRunId).then((result) => {
      if (cancelled) {
        return;
      }
      setPortfolioPaperOrderReplay(result.replay ?? null);
      if (result.error) {
        setPortfolioPaperOrderHistoryError(result.error);
      }
    });
    void loadPortfolioPaperOrderBatches(quantCoreBaseUrl, baseRunId).then((result) => {
      if (cancelled) {
        return;
      }
      setPortfolioPaperOrderBatches(result.batches);
      setPortfolioPaperOrderHistoryError(result.error ?? null);
      if (!result.batches.length) {
        setPortfolioPaperOrderLifecycleEvents([]);
        setPortfolioPaperOrderSimulations([]);
        setPortfolioPaperOrderStateHistories([]);
        return;
      }
      void Promise.all([
        Promise.all(
          result.batches.map((batch) => loadPortfolioPaperOrderApprovals(quantCoreBaseUrl, baseRunId, batch.batchId))
        ),
        Promise.all(
          result.batches.map((batch) => loadPortfolioPaperOrderSimulations(quantCoreBaseUrl, baseRunId, batch.batchId))
        ),
        Promise.all(
          result.batches.map((batch) => loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, baseRunId, batch.batchId))
        )
      ]).then(([approvalResults, simulationResults, stateHistoryResults]) => {
        if (cancelled) {
          return;
        }
        setPortfolioPaperOrderLifecycleEvents(
          approvalResults.flatMap((approvalResult) => approvalResult.lifecycle)
        );
        setPortfolioPaperOrderSimulations(
          simulationResults.flatMap((simulationResult) => simulationResult.simulations)
        );
        setPortfolioPaperOrderStateHistories(
          stateHistoryResults.flatMap((stateHistoryResult) =>
            stateHistoryResult.stateHistory ? [stateHistoryResult.stateHistory] : []
          )
        );
        const approvalError = approvalResults.find((approvalResult) => approvalResult.error)?.error;
        const simulationError = simulationResults.find((simulationResult) => simulationResult.error)?.error;
        const stateHistoryError = stateHistoryResults.find((stateHistoryResult) => stateHistoryResult.error)?.error;
        if (approvalError) {
          setPortfolioPaperOrderHistoryError(approvalError);
        } else if (simulationError) {
          setPortfolioPaperOrderHistoryError(simulationError);
        } else if (stateHistoryError) {
          setPortfolioPaperOrderHistoryError(stateHistoryError);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [workspace.researchRun?.runId]);

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
    setRunHistoryState(await loadResearchRunHistory(quantCoreBaseUrl, 5));
  }, []);

  const resetAiReviewHistoryState = useCallback(() => {
    setAiReviewRunRecords([]);
    setAiReviewHistoryQuery("");
    setAiReviewHistoryOffset(0);
    setAiReviewHistoryPagination(null);
  }, []);

  useEffect(() => {
    resetAiReviewHistoryState();
  }, [resetAiReviewHistoryState, workspace.researchRun?.runId]);

  const refreshAiReviewRunHistory = useCallback(
    async (runId: string, options: { offset?: number; query?: string } = {}) => {
      const offset = options.offset ?? aiReviewHistoryOffset;
      const query = options.query ?? aiReviewHistoryQuery;
      const requestId = aiReviewHistoryRequestIdRef.current + 1;
      aiReviewHistoryRequestIdRef.current = requestId;
      setIsLoadingAiReviewHistory(true);
      const aiReviewHistory = await loadResearchRunAiReviews(quantCoreBaseUrl, runId, {
        limit: AI_REVIEW_HISTORY_PAGE_SIZE,
        offset,
        query
      });
      if (aiReviewHistoryRequestIdRef.current === requestId) {
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
      eventType: "audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report",
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
    if (activeWorkAreaId !== "audit") {
      return;
    }
    void refreshAuditEvidenceReportEvents();
    void refreshMarketDataRefreshOverrideAuditEvents();
    void refreshAuditSigningKeyRotationEvents();
    void refreshResearchRunImportAuditEvents();
  }, [
    activeWorkAreaId,
    refreshAuditEvidenceReportEvents,
    refreshMarketDataRefreshOverrideAuditEvents,
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
    setStrategyLibraryState(
      await loadStrategyLibrary(quantCoreBaseUrl, {
        limit: 12
      })
    );
  }, []);

  const refreshResearchNote = useCallback(async () => {
    const result = await loadResearchNote(quantCoreBaseUrl, {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    });
    setResearchNoteState(result);
    setResearchNoteDraft(result.note?.body ?? "");
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

  const refreshMarketCalendarStatus = useCallback(async () => {
    const market = workspace.selectedInstrument.market;
    setMarketCalendarState(buildFallbackMarketCalendarState(market));
    const result = await loadMarketCalendarStatus(quantCoreBaseUrl, market);
    setMarketCalendarState(result);
  }, [workspace.selectedInstrument.market]);

  useEffect(() => {
    void refreshMarketCalendarStatus();
  }, [refreshMarketCalendarStatus]);

  const refreshExecutionAdapterHealthProbe = useCallback(async () => {
    setIsRefreshingAdapterHealthProbe(true);
    try {
      const result = await loadExecutionAdapterHealthProbe(quantCoreBaseUrl, {
        adapterId: "ccxt-live",
        exchange: "binance"
      });
      setExecutionAdapterHealthProbe(result);
      return result;
    } finally {
      setIsRefreshingAdapterHealthProbe(false);
    }
  }, []);

  const refreshSettingsStatus = useCallback(async () => {
    const [settingsResult, adapterLedgerResult, adapterHealthProbeResult, watchlistRefreshHistory] = await Promise.all([
      loadPlatformSettings(quantCoreBaseUrl),
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
      productionRouteReviewResults
    ] = await Promise.all([
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterCertifications(quantCoreBaseUrl, row.id, undefined, 3))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterCertificationApplies(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterControlledRestartEvidence(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterRestartAcceptances(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretReferences(quantCoreBaseUrl, row.id, undefined, 5))),
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterSecretMaterializations(quantCoreBaseUrl, row.id, undefined, 5))),
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
      Promise.all(liveAdapters.map((row) => loadExecutionAdapterProductionRouteReviews(quantCoreBaseUrl, row.id, undefined, 5)))
    ]);
    setSettingsStatus(settingsResult);
    setWatchlistCacheRefreshHistory(watchlistRefreshHistory.watchlistRefreshes);
    setExecutionAdapterLedger(adapterLedgerResult);
    setExecutionAdapterHealthProbe(adapterHealthProbeResult);
    setExecutionAdapterCertifications(certificationResults.flatMap((result) => result.adapterCertifications));
    setExecutionAdapterCertificationApplies(applyResults.flatMap((result) => result.certificationApplies));
    setExecutionAdapterControlledRestartEvidence(restartEvidenceResults.flatMap((result) => result.controlledRestartEvidence));
    setExecutionAdapterRestartAcceptances(restartAcceptanceResults.flatMap((result) => result.restartAcceptances));
    setExecutionAdapterSecretReferences(secretReferenceResults.flatMap((result) => result.adapterSecretReferences));
    setExecutionAdapterSecretMaterializations(materializationResults.flatMap((result) => result.adapterSecretMaterializations));
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
    setExecutionAdapterProductionRouteReviews(
      productionRouteReviewResults.flatMap((result) => result.adapterProductionRouteReviews)
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
    setGoldenPathState(
      await loadGoldenPathStatus(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      })
    );
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

  const refreshWorkspace = useCallback(async () => {
    const startedSelectionVersion = manualSelectionVersionRef.current;
    setIsRefreshing(true);
    const result = await loadTerminalWorkspace(quantCoreBaseUrl);
    const researchContextUrlState = resolveInitialResearchContextUrlState();
    const restoredWorkspace = workspaceWithResearchContextUrlState(
      workspaceWithAppliedResearchWorkspaceState(result.workspace),
      researchContextUrlState
    );
    const restoredResult = {
      ...result,
      workspace: restoredWorkspace
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
  }, [refreshAuditSigningKeys, refreshRunHistory, refreshSettingsStatus]);

  useEffect(() => {
    if (activeWorkAreaId !== "audit") {
      return;
    }
    void refreshAuditSigningKeys();
  }, [activeWorkAreaId, refreshAuditSigningKeys]);

  const refreshChart = useCallback(async () => {
    const requestId = chartRequestIdRef.current + 1;
    chartRequestIdRef.current = requestId;
    const params = {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    };
    setIsChartLoading(true);
    setKlinesState(buildLoadingMarketKlinesResult(params));
    const result = await loadMarketKlines(quantCoreBaseUrl, { ...params, limit: chartKlineLimit });
    if (chartRequestIdRef.current === requestId) {
      setKlinesState(result);
      setIsChartLoading(false);
    }
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

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
        setSettingsStatus((current) => ({
          settings: current.settings,
          source: current.source,
          error: marketDataRefreshGuardLabel(i18n, refreshGuard)
        }));
        return;
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
        setSettingsStatus({
          settings: result.settings,
          source: result.source,
          error: result.error
        });
        if (
          result.source === "core" &&
          context.market === workspace.selectedInstrument.market &&
          context.symbol === workspace.selectedInstrument.symbol &&
          context.timeframe === workspace.selectedTimeframe
        ) {
          await refreshChart();
        }
        await refreshGoldenPathStatus();
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
      settingsStatus.settings?.marketDataAdapters,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]
  );

  const refreshSelectedMarketCache = useCallback(async () => {
    await refreshCacheContext({
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
      return;
    }
    const refreshGuard = buildMarketDataRefreshGuard(
      workspace.selectedInstrument.market,
      settingsStatus.settings?.marketDataAdapters,
      activeMarketDataRefreshOverride
    );
    if (refreshGuard.blocked) {
      setSettingsStatus((current) => ({
        settings: current.settings,
        source: current.source,
        error: marketDataRefreshGuardLabel(i18n, refreshGuard)
      }));
      return;
    }
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
      if (result.watchlistRefresh) {
        setWatchlistCacheRefreshHistory((current) => [
          result.watchlistRefresh!,
          ...current.filter((run) => run.runId !== result.watchlistRefresh!.runId)
        ].slice(0, 4));
        setWatchlistCacheRefreshRunSelection(result.watchlistRefresh.runId);
      }
      if (
        result.watchlistRefresh?.items.some(
          (item) =>
            item.market === workspace.selectedInstrument.market &&
            item.symbol === workspace.selectedInstrument.symbol &&
            item.timeframe === workspace.selectedTimeframe &&
            item.status === "refreshed"
        )
      ) {
        await refreshChart();
      }
      await refreshGoldenPathStatus();
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

  const runPipeline = useCallback(async () => {
    if (!researchPipelinePreflight.canRun) {
      setActiveWorkAreaId("research");
      setActiveLoopStepId("research");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: researchPipelinePreflightStatusLabel(i18n, researchPipelinePreflight),
        error: researchPipelinePreflightIssueDetail(i18n, researchPipelinePreflight)
      }));
      return;
    }
    if (
      researchPipelinePreflight.requiresConfirmation &&
      !window.confirm(researchPipelinePreflightConfirmMessage(i18n, researchPipelinePreflight))
    ) {
      return;
    }

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

    setActiveWorkAreaId("strategy");
    setActiveLoopStepId("strategy");
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
      return;
    }
    setStrategyValidationState(preflight);
    if (preflight.validation?.status === "blocked") {
      const blockedGates = preflight.validation.gates
        .filter((gate) => gate.status === "blocked")
        .map((gate) => gate.id)
        .join(", ");
      appendLog("factor", "error", `Strategy preflight blocked: ${blockedGates || "readiness gate"}`);
      publishStage("factor", [], "factor");
      setIsRunning(false);
      return;
    }
    appendLog(
      "factor",
      preflight.source === "core" ? "success" : "warning",
      preflight.source === "core"
        ? `Strategy preflight passed: ${preflight.validation?.status ?? "review"}`
        : `Strategy preflight used local fallback: ${preflight.error ?? "core unavailable"}`
    );

    setActiveWorkAreaId("backtest");
    setActiveLoopStepId("backtest");
    appendLog("data", "info", `Data snapshot prepared for ${selectedContext}`);
    publishStage("data", []);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    appendLog("factor", "success", "Factor set staged: SMA / RSI / volume");
    publishStage("factor", ["data"]);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    appendLog("backtest", "info", "Backtest request sent to local core");
    publishStage("backtest", ["data", "factor"]);

    const result = await runTerminalResearch(
      quantCoreBaseUrl,
      {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        limit: chartKlineLimit,
        watchlistRefreshRunId: selectedWatchlistRefreshEvidenceRunId
      },
      workspace
    );
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    setWorkspaceState(result);

    if (result.source === "fallback") {
      appendLog("backtest", "error", `Pipeline failed before audited backtest: ${result.error ?? result.statusLabel}`);
      publishStage("backtest", ["data", "factor"], "backtest");
      await refreshRunHistory();
      setIsRunning(false);
      return;
    }

    const researchSummary = result.workspace.researchRun;
    appendLog(
      "backtest",
      "success",
      researchRunEvidenceLogLabel(researchSummary)
    );
    publishStage("agent", ["data", "factor", "backtest"]);
    await waitForWorkflowStep();
    if (workflowRunIdRef.current !== runId) {
      return;
    }
    appendLog("agent", "success", "Agent committee report received");
    appendLog("execution", "warning", "Live execution remains blocked; paper review is ready");
    publishStage("execution", ["data", "factor", "backtest", "agent"]);
    await refreshRunHistory();
    await refreshStrategyLibrary();
    setIsRunning(false);
  }, [
    chartKlineLimit,
    i18n,
    quantCoreBaseUrl,
    refreshRunHistory,
    refreshStrategyLibrary,
    researchPipelinePreflight,
    resetAiReviewHistoryState,
    selectedWatchlistRefreshEvidenceRunId,
    workspace
  ]);

  const runPortfolioBacktestDraft = useCallback(async () => {
    if (!portfolioBacktestDraft.request) {
      setPortfolioBacktestState({
        source: "fallback",
        error: portfolioBacktestDraft.summary
      });
      return;
    }

    setIsRunningPortfolioBacktest(true);
    const result = await runPortfolioBacktest(quantCoreBaseUrl, portfolioBacktestDraft.request);
    setPortfolioBacktestState(result);
    setIsRunningPortfolioBacktest(false);
  }, [portfolioBacktestDraft.request, portfolioBacktestDraft.summary]);

  const recordPortfolioPaperOrders = useCallback(async () => {
    const portfolio = portfolioBacktestState.portfolio;
    const baseRunId = workspace.researchRun?.runId;
    const orders = portfolio?.paperOrderEvents ?? [];
    if (!portfolio || !baseRunId || !orders.length) {
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
      void loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, recordedBatch.baseRunId, recordedBatch.batchId).then(
        (stateHistoryResult) => {
          const history = stateHistoryResult.stateHistory;
          if (history) {
            setPortfolioPaperOrderStateHistories((current) =>
              mergePortfolioPaperOrderStateHistories(current, history)
            );
          }
          if (stateHistoryResult.error) {
            setPortfolioPaperOrderHistoryError(stateHistoryResult.error);
          }
        }
      );
      setPortfolioPaperOrderHistoryError(null);
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
  }, [portfolioBacktestState.portfolio, workspace.researchRun?.runId]);

  const reviewPortfolioPaperOrder = useCallback(async (row: PortfolioPaperOrderApprovalRow, approved: boolean) => {
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
    setApprovingPortfolioPaperOrderId(null);

    if (result.approval) {
      if (result.lifecycle?.length) {
        setPortfolioPaperOrderLifecycleEvents((current) =>
          mergePortfolioPaperOrderLifecycleEvents(current, row.batchId, result.lifecycle ?? [])
        );
      }
      void loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, row.baseRunId, row.batchId).then((stateHistoryResult) => {
        const history = stateHistoryResult.stateHistory;
        if (history) {
          setPortfolioPaperOrderStateHistories((current) =>
            mergePortfolioPaperOrderStateHistories(current, history)
          );
        }
        if (stateHistoryResult.error) {
          setPortfolioPaperOrderHistoryError(stateHistoryResult.error);
        }
      });
      void loadPortfolioPaperOrderReplay(quantCoreBaseUrl, row.baseRunId).then((replayResult) => {
        setPortfolioPaperOrderReplay(replayResult.replay ?? null);
        if (replayResult.error) {
          setPortfolioPaperOrderHistoryError(replayResult.error);
        }
      });
      setPortfolioPaperOrderHistoryError(null);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: approved
          ? `Portfolio paper order approved · ${row.orderId}`
          : `Portfolio paper order rejected · ${row.orderId}`,
        error: undefined
      }));
      return;
    }

    setPortfolioPaperOrderHistoryError(result.error ?? "Portfolio paper order approval failed");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Portfolio paper order approval failed",
      error: result.error ?? "Portfolio paper order approval failed"
    }));
  }, []);

  const approvePortfolioPaperOrder = useCallback(
    (row: PortfolioPaperOrderApprovalRow) => reviewPortfolioPaperOrder(row, true),
    [reviewPortfolioPaperOrder]
  );

  const rejectPortfolioPaperOrder = useCallback(
    (row: PortfolioPaperOrderApprovalRow) => reviewPortfolioPaperOrder(row, false),
    [reviewPortfolioPaperOrder]
  );

  const simulatePortfolioPaperOrder = useCallback(async (row: PortfolioPaperOrderApprovalRow) => {
    setSimulatingPortfolioPaperOrderId(row.id);
    const result = await recordPortfolioPaperOrderSimulation(quantCoreBaseUrl, {
      baseRunId: row.baseRunId,
      batchId: row.batchId,
      orderId: row.orderId,
      simulatedAt: new Date().toISOString()
    });
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
      void loadPortfolioPaperOrderStateHistory(quantCoreBaseUrl, row.baseRunId, row.batchId).then((stateHistoryResult) => {
        const history = stateHistoryResult.stateHistory;
        if (history) {
          setPortfolioPaperOrderStateHistories((current) =>
            mergePortfolioPaperOrderStateHistories(current, history)
          );
        }
        if (stateHistoryResult.error) {
          setPortfolioPaperOrderHistoryError(stateHistoryResult.error);
        }
      });
      void loadPortfolioPaperOrderReplay(quantCoreBaseUrl, row.baseRunId).then((replayResult) => {
        setPortfolioPaperOrderReplay(replayResult.replay ?? null);
        if (replayResult.error) {
          setPortfolioPaperOrderHistoryError(replayResult.error);
        }
      });
      setPortfolioPaperOrderHistoryError(null);
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
  }, []);

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

  const preparePortfolioPeerAudits = useCallback(async () => {
    const missingCandidates = portfolioPeerAuditPlan.candidates
      .filter((candidate) => candidate.status === "missing")
      .slice(0, Math.max(1, 2 - portfolioPeerAuditPlan.auditedCount));
    if (!missingCandidates.length) {
      return;
    }

    setIsPreparingPortfolioPeers(true);
    const failures: string[] = [];
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
        const peerWorkspace = workspaceWithSelectedInstrument(workspace, instrument);
        const result = await runTerminalResearch(
          quantCoreBaseUrl,
          {
            market: candidate.market,
            symbol: candidate.symbol,
            timeframe: candidate.timeframe,
            limit: chartKlineLimit
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
      await refreshRunHistory();
      await refreshStrategyLibrary();
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: failures.length ? "Portfolio peer audit failed" : "Portfolio peer audits prepared",
        error: failures[0]
      }));
      setIsPreparingPortfolioPeers(false);
    }
  }, [
    portfolioPeerAuditPlan.auditedCount,
    portfolioPeerAuditPlan.candidates,
    refreshRunHistory,
    refreshStrategyLibrary,
    workspace
  ]);

  const loadPaperExecutionDeepLink = useCallback(
    async (deepLink: InitialPaperExecutionDeepLink) => {
      const replayVersion = manualSelectionVersionRef.current + 1;
      manualSelectionVersionRef.current = replayVersion;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
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
    async (run: ResearchRunAudit) => {
      const replayVersion = manualSelectionVersionRef.current + 1;
      manualSelectionVersionRef.current = replayVersion;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      const detail = await loadResearchRunDetail(quantCoreBaseUrl, run.runId);
      if (manualSelectionVersionRef.current !== replayVersion) {
        return;
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
      const [paperHistory, promotionHistory, aiReviewHistory] = await Promise.all([
        loadLatestResearchRunPaperExecution(quantCoreBaseUrl, auditedRun.runId),
        loadResearchRunPromotion(quantCoreBaseUrl, auditedRun.runId),
        refreshAiReviewRunHistory(auditedRun.runId, { offset: 0, query: "" })
      ]);
      if (manualSelectionVersionRef.current !== replayVersion) {
        return;
      }
      setPaperExecutionRecord(paperHistory.execution ?? null);
      setPromotionCandidateRecord(promotionHistory.promotion ?? null);
      setAiReviewRunRecords(aiReviewHistory.aiReviews);
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

  const ensureGoldenPathLatestRunBound = useCallback(async (): Promise<boolean> => {
    if (researchRunContextBinding.canUseRun) {
      return true;
    }
    const latestRunId = goldenPath?.latestRunId;
    if (!latestRunId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Golden Path audit run not loaded",
        error: "Golden Path did not return a latest audited run id for paper execution."
      }));
      return false;
    }

    const historyRun = runHistory.find((run) => run.runId === latestRunId);
    if (historyRun) {
      await replayRun(historyRun);
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
    if (detail.run) {
      await replayRun(detail.run);
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
  }, [goldenPath?.latestRunId, quantCoreBaseUrl, replayRun, researchRunContextBinding.canUseRun, runHistory]);

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
      runHistory
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
  }, [auditEvidenceSummary, persistAuditEvidenceReportEvent, quantCoreBaseUrl, runHistory]);

  const inspectRunExportPackageByRunId = useCallback(async (runId: string): Promise<ResearchRunExportPackageInspectionResult> => {
    setIsInspectingExportPackage(true);
    try {
      const result = await loadResearchRunExport(quantCoreBaseUrl, runId);
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

      setPendingImportPackage(null);
      setInspectedExportPackage(result.exportPackage);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run export package loaded",
        error: undefined
      }));
      setActiveWorkAreaId("audit");
      return { ok: true };
    } finally {
      setIsInspectingExportPackage(false);
    }
  }, []);

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
    const markdown = buildBacktestReportMarkdown(workspace, runHistory);
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
  }, [runHistory, workspace]);

  const exportAiReviewMarkdown = useCallback(() => {
    const markdown = buildAiReviewReportMarkdown(workspace);
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
  }, [workspace]);

  const exportAiReviewRunRecord = useCallback(() => {
    const record = buildAiReviewRunRecord(workspace);
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
  }, [workspace]);

  const saveCurrentAiReviewRunRecord = useCallback(async () => {
    const record = buildAiReviewRunRecord(workspace);
    const runId = workspace.researchRun?.runId;
    if (!record || !runId) {
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
  }, [workspace]);

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
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = "";
      if (!file) {
        return;
      }
      const previousRunId = workspace.researchRun?.runId ?? null;

      try {
        const parsed = JSON.parse(await file.text()) as unknown;
        let exportPackage = normalizeResearchRunExportPackagePayload(parsed);
        if (!exportPackage) {
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
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run import failed",
            error: "Invalid research run export contract"
          }));
          return;
        }
        exportPackage = await withVerifiedResearchRunExportPackageReportSignatures(quantCoreBaseUrl, exportPackage);

        const previewRows = buildResearchRunImportDiffRows({
          aiReviewRecords: activeAiReviewRunRecords,
          exportPackage,
          paperExecution: activePaperExecutionRecord,
          workspace
        });
        const previewBlocked = previewRows.some((row) => row.status === "blocked");
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            exportPackage,
            fileName: file.name,
            previousRunId,
            rows: previewRows,
            stage: "preview"
          })
        );
        setPendingImportPackage({ exportPackage, fileName: file.name });
        setInspectedExportPackage(exportPackage);
        setActiveWorkAreaId("audit");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: previewBlocked ? "Research run import preview blocked" : "Research run import preview ready",
          error: undefined
        }));
      } catch (importError) {
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
      aiReviewRecords: activeAiReviewRunRecords,
      exportPackage: pendingImportPackage.exportPackage,
      paperExecution: activePaperExecutionRecord,
      workspace
    });
    const previousRunId = workspace.researchRun?.runId ?? null;
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
        setResearchNoteDraft(result.note.body);
      } else if (result.run.researchNote?.body) {
        setResearchNoteState({
          note: result.run.researchNote,
          source: "core"
        });
        setResearchNoteDraft(result.run.researchNote.body);
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
      const [paperHistory, promotionHistory, aiReviewHistory] = await Promise.all([
        loadLatestResearchRunPaperExecution(quantCoreBaseUrl, result.run.runId),
        loadResearchRunPromotion(quantCoreBaseUrl, result.run.runId),
        refreshAiReviewRunHistory(result.run.runId, { offset: 0, query: "" })
      ]);
      if (manualSelectionVersionRef.current !== importVersion) {
        return;
      }
      setPendingImportPackage(null);
      setPaperExecutionRecord(paperHistory.execution ?? null);
      setPromotionCandidateRecord(promotionHistory.promotion ?? null);
      setAiReviewRunRecords(aiReviewHistory.aiReviews);
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
            aiReviewRecords: activeAiReviewRunRecords,
            exportPackage: pendingImportPackage.exportPackage,
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

  const selectInstrument = useCallback(
    (instrument: TerminalWorkspace["selectedInstrument"]) => {
      const isExistingWatchlistInstrument = watchlistIncludesInstrument(workspace.watchlist, instrument);
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      setHasUnsavedWatchlistChanges((current) => current || !isExistingWatchlistInstrument);
      setWorkspaceState((current) => ({
        workspace: workspaceWithSelectedInstrument(current.workspace, instrument),
        source: "core",
        statusLabel: "Instrument selected"
      }));
      setActiveWorkAreaId("research");
      setActiveLoopStepId("research");
      setActiveWorkflowStageId("data");
      setWorkflowRunState(createWorkflowRunState());
    },
    [resetAiReviewHistoryState, workspace.watchlist]
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
    (timeframe: Timeframe) => {
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      setWorkspaceState((current) => ({
        workspace: workspaceWithSelectedTimeframe(current.workspace, timeframe),
        source: "core",
        statusLabel: "Timeframe selected"
      }));
      setActiveWorkAreaId("research");
      setActiveLoopStepId("research");
      setActiveWorkflowStageId("data");
      setWorkflowRunState(createWorkflowRunState());
    },
    [resetAiReviewHistoryState]
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
    setActiveWorkAreaId(action === "strategy-draft" ? "strategy" : "ai-review");
    setActiveLoopStepId(action === "strategy-draft" ? "strategy" : "agent-review");
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
      setResearchNoteDraft(result.note.body);
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
  }, [researchNoteDraft, workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

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

  const stageBacktestParameterCandidate = useCallback((candidateId: string) => {
    manualSelectionVersionRef.current += 1;
    workflowRunIdRef.current += 1;
    setIsRunning(false);
    setPaperExecutionRecord(null);
    setPromotionCandidateRecord(null);
    resetAiReviewHistoryState();
    setWorkspaceState((current) => ({
      workspace: workspaceWithBacktestParameterCandidate(current.workspace, candidateId),
      source: "core",
      statusLabel: "Parameter candidate staged"
    }));
    setActiveWorkAreaId("strategy");
    setActiveLoopStepId("strategy");
    setActiveWorkflowStageId("factor");
    setWorkflowRunState(createWorkflowRunState());
  }, []);

  const submitPaperExecution = useCallback(async () => {
    const runId = currentResearchRunId;
    if (!runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution failed",
        error: researchRunContextBinding.status === "mismatched" ? researchRunContextBinding.detail : "Run the pipeline before submitting a paper execution."
      }));
      return;
    }

    setIsSubmittingPaperExecution(true);
    const result = await submitResearchRunPaperExecution(quantCoreBaseUrl, runId);
    if (result.source === "fallback" || !result.execution) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution failed",
        error: result.error ?? "Paper execution failed"
      }));
      setIsSubmittingPaperExecution(false);
      return;
    }

    setPaperExecutionRecord(result.execution);
    setPromotionCandidateRecord(result.promotion ?? null);
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Paper execution recorded",
      error: undefined
    }));
    setActiveWorkAreaId("execution");
    setActiveLoopStepId("paper");
    setActiveWorkflowStageId("execution");
    setIsSubmittingPaperExecution(false);
  }, [currentResearchRunId, researchRunContextBinding.detail, researchRunContextBinding.status]);

  const selectProductWorkArea = useCallback(
    (areaId: ProductWorkAreaId) => {
      manualSelectionVersionRef.current += 1;
      const selection = resolveProductWorkAreaSelection(workspace, areaId, activeWorkAreaId);
      setActiveWorkAreaId(selection.areaId);
      setActiveLoopStepId(selection.quantLoopStepId);
      setActiveWorkflowStageId(selection.workflowStageId);
    },
    [activeWorkAreaId, workspace]
  );

  const openMarketDataAdapterWorkflow = useCallback(
    (adapter: PlatformSettingsStatus["marketDataAdapters"][number]) => {
      const instrument = resolveAdapterWorkflowInstrument(workspace, adapter.market);
      selectInstrument(instrument);
      selectProductWorkArea("market");
    },
    [selectInstrument, selectProductWorkArea, workspace]
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
    setActiveWorkAreaId("audit");
    setActiveLoopStepId("backtest");
    setActiveWorkflowStageId("execution");
    setWorkspaceState((current) => ({
      ...current,
      statusLabel: "Latest P0 readiness report selected",
      error: undefined
    }));
  }, [auditEvidenceReportLedgerSummary.latestAuditAidReportQuery, selectProductWorkArea]);

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
      const normalizedSymbol = buildInstrumentFromSymbol(marketDraft, symbolDraft)?.symbol;
      const matchedSuggestion = searchSuggestions.find(
        (suggestion) => suggestion.market === marketDraft && suggestion.symbol === normalizedSymbol
      );
      const instrument = matchedSuggestion
        ? {
            symbol: matchedSuggestion.symbol,
            name: matchedSuggestion.name,
            market: matchedSuggestion.market,
            changePct: 0
          }
        : buildInstrumentFromSymbol(marketDraft, symbolDraft);
      if (!instrument) {
        return;
      }
      selectInstrument(instrument);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
    },
    [marketDraft, searchSuggestions, selectInstrument, symbolDraft]
  );

  const selectSearchSuggestion = useCallback(
    (suggestion: MarketSearchSuggestion) => {
      skipNextSymbolSearchRef.current = true;
      setMarketDraft(suggestion.market);
      setSymbolDraft(suggestion.symbol);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      selectInstrument({
        symbol: suggestion.symbol,
        name: suggestion.name,
        market: suggestion.market,
        changePct: 0
      });
    },
    [selectInstrument]
  );

  const refreshSearchSuggestionCache = useCallback(
    async (suggestion: MarketSearchSuggestion) => {
      const timeframe = workspace.selectedTimeframe;
      skipNextSymbolSearchRef.current = true;
      setMarketDraft(suggestion.market);
      setSymbolDraft(suggestion.symbol);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      selectInstrument({
        symbol: suggestion.symbol,
        name: suggestion.name,
        market: suggestion.market,
        changePct: 0
      });
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
    [refreshCacheContext, selectInstrument, workspace.selectedTimeframe]
  );

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    void refreshChart();
  }, [refreshChart]);

  useEffect(() => {
    void refreshStrategyLibrary();
  }, [refreshStrategyLibrary]);

  useEffect(() => {
    void refreshResearchNote();
  }, [refreshResearchNote]);

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
    const url = new URL(window.location.href);
    const shouldSyncResearchContext = activeWorkAreaId === "market" || activeWorkAreaId === "research";
    const contextChanged =
      shouldSyncResearchContext &&
      (url.searchParams.get("market") !== workspace.selectedInstrument.market ||
        url.searchParams.get("symbol") !== workspace.selectedInstrument.symbol ||
        url.searchParams.get("timeframe") !== workspace.selectedTimeframe);
    if (url.searchParams.get("workspace") === activeWorkAreaId && !url.searchParams.has("workflow") && !contextChanged) {
      return;
    }
    url.searchParams.set("workspace", activeWorkAreaId);
    url.searchParams.delete("workflow");
    if (shouldSyncResearchContext) {
      url.searchParams.set("market", workspace.selectedInstrument.market);
      url.searchParams.set("symbol", workspace.selectedInstrument.symbol);
      url.searchParams.set("timeframe", workspace.selectedTimeframe);
    }
    window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }, [activeWorkAreaId, workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);

  useEffect(() => {
    skipNextSymbolSearchRef.current = true;
    setMarketDraft(workspace.selectedInstrument.market);
    setSymbolDraft(workspace.selectedInstrument.symbol);
    setSearchSuggestions([]);
    setIsSearchOpen(false);
  }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol]);

  useEffect(() => {
    const query = symbolDraft.trim();
    const requestId = symbolSearchRequestIdRef.current + 1;
    symbolSearchRequestIdRef.current = requestId;

    if (skipNextSymbolSearchRef.current) {
      skipNextSymbolSearchRef.current = false;
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
      const result = await loadMarketSearch(quantCoreBaseUrl, { market: marketDraft, query, limit: 8, timeframe: workspace.selectedTimeframe });
      if (symbolSearchRequestIdRef.current === requestId) {
        setSearchSuggestions(result.results);
        setIsSearchOpen(true);
        setIsSymbolSearching(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [marketDraft, symbolDraft, workspace.selectedTimeframe]);

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

  const runActiveWorkflowAction = useCallback(() => {
    if (activeLoopStepId === "strategy") {
      runAiWorkbenchAction("strategy-draft");
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
  }, [activeLoopStepId, runAiWorkbenchAction, runPipeline, submitPaperExecution]);

  const runGoldenPathActionById = useCallback(
    (actionId: string | null | undefined, targetWorkspace?: string | null) => {
      if (!actionId) {
        runActiveWorkflowAction();
        return;
      }
      if (actionId === "refresh-data") {
        void refreshSelectedMarketCache();
        return;
      }
      if (actionId === "refresh-watchlist-cache") {
        void refreshWatchlistMarketCache();
        return;
      }
      if (actionId === "run-pipeline") {
        void runPipeline();
        return;
      }
      if (actionId === "run-ai-review") {
        setActiveWorkAreaId("ai-review");
        setActiveLoopStepId("agent-review");
        setActiveWorkflowStageId("agent");
        runAiWorkbenchAction("debate");
        return;
      }
      if (actionId === "submit-paper-order") {
        void (async () => {
          const runWasAlreadyBound = researchRunContextBinding.canUseRun;
          const runIsBound = await ensureGoldenPathLatestRunBound();
          if (runWasAlreadyBound && runIsBound) {
            void submitPaperExecution();
          }
        })();
        return;
      }
      if (actionId === "fix-paper-handoff") {
        selectProductWorkArea("execution");
        return;
      }
      if (actionId === "certify-live-adapter") {
        selectProductWorkArea("settings");
        return;
      }
      if (targetWorkspace && productWorkAreaIds.includes(targetWorkspace as ProductWorkAreaId)) {
        selectProductWorkArea(targetWorkspace as ProductWorkAreaId);
      }
    },
    [
      refreshSelectedMarketCache,
      refreshWatchlistMarketCache,
      ensureGoldenPathLatestRunBound,
      researchRunContextBinding.canUseRun,
      runActiveWorkflowAction,
      runAiWorkbenchAction,
      runPipeline,
      selectProductWorkArea,
      submitPaperExecution
    ]
  );

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
      if (isRefreshing || isRunning) {
        return true;
      }
      if (actionId === "refresh-data") {
        return Boolean(refreshingCacheKey) || marketDataRefreshGuard.blocked;
      }
      if (actionId === "refresh-watchlist-cache") {
        return isRefreshingWatchlistCache || Boolean(refreshingCacheKey) || marketDataRefreshGuard.blocked;
      }
      if (actionId === "run-pipeline") {
        return !researchPipelinePreflight.canRun;
      }
      if (actionId === "submit-paper-order") {
        const canRebindGoldenPathRun = Boolean(goldenPath?.latestRunId) && !researchRunContextBinding.canUseRun;
        return (
          isSubmittingPaperExecution ||
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
      isSubmittingPaperExecution,
      marketDataRefreshGuard.blocked,
      refreshingCacheKey,
      researchPipelinePreflight.canRun,
      researchRunContextBinding.canUseRun,
      riskApprovalSummary.status
    ]
  );

  const goldenPathActionId = goldenPath?.nextAction?.id;
  const isGoldenPathActionDisabled = isGoldenPathActionDisabledById(goldenPathActionId);
  const workspaceContextActionId = activeWorkspaceContext?.actionId;
  const isWorkspaceContextActionDisabled =
    !workspaceContextActionId || isGoldenPathActionDisabledById(workspaceContextActionId);
  const goldenPathActionHint = goldenPathActionPreflightHint(i18n, goldenPathActionId, researchPipelinePreflight);
  const workspaceContextActionHint = goldenPathActionPreflightHint(
    i18n,
    workspaceContextActionId,
    researchPipelinePreflight
  );

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

  const renderStrategyPanel = (className = "strategy-panel") => (
    <Panel title={i18n.t("panel.strategy.title")} subtitle={i18n.strategyText(workspace.strategy.name)} className={className}>
      <StrategySummary
        draft={strategyRuleDraft}
        i18n={i18n}
        isSavingStrategy={isSavingStrategy}
        library={visibleStrategyLibrary}
        onApplyStrategyTemplate={applyStrategyTemplate}
        onLoadStrategyVersion={loadSavedStrategyVersion}
        onSaveStrategyVersion={saveCurrentStrategyVersion}
        onUpdateStrategyRuleDraftField={updateStrategyRuleDraftField}
        readinessGates={strategyReadinessGates}
        rows={strategyRuleRows}
        templates={strategyTemplateOptions}
        validationSource={strategyValidationState.source}
        workspace={workspace}
      />
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

  const renderWorkflowNodesPanel = (className = "watchlist-workflow-panel") => (
    <Panel title={i18n.t("panel.nodeWorkflow.title")} subtitle={i18n.t("panel.nodeWorkflow.subtitle")} className={className}>
      <CompactWorkflowNodes
        activeStageId={activeWorkflowStageId}
        i18n={i18n}
        runState={workflowRunState}
        stages={workflowStages}
      />
    </Panel>
  );

  const renderActiveProductWorkspace = () => {
    if (activeWorkAreaId === "market") {
      return (
        <>
          {renderChartPanel("chart-panel workflow-chart-panel")}
          <MarketDataHealthPanel
            cacheContext={activeCacheContext}
            className="workflow-data-panel"
            i18n={i18n}
            isRefreshingCache={refreshingCacheKey === activeCacheContextKey}
            isRefreshingWatchlistCache={isRefreshingWatchlistCache}
            latestWatchlistCacheRefresh={latestWatchlistCacheRefresh}
            refreshGuard={marketDataRefreshGuard}
            refreshOverrideAuditStatus={marketDataRefreshOverrideAuditStatus}
            refreshOverrideReason={activeMarketDataRefreshOverride?.reason ?? null}
            onApplyRefreshOverride={enableMarketDataRefreshOverride}
            onClearRefreshOverride={clearMarketDataRefreshOverride}
            onRefreshCache={refreshSelectedMarketCache}
            onRefreshWatchlistCache={refreshWatchlistMarketCache}
            onOpenCoverageResearch={openSelectedRefreshCoverageInResearch}
            onSelectWatchlistCacheRefreshRun={selectWatchlistCacheRefreshRun}
            onSelectWatchlistCacheRefreshItem={selectWatchlistCacheRefreshItem}
            state={klinesState}
            watchlistCacheRefreshCoverageRow={watchlistCacheRefreshCoverageRow}
            watchlistCacheRefreshItemRows={watchlistCacheRefreshItemRows}
            watchlistCacheRefreshHistoryRows={watchlistCacheRefreshHistoryRows}
            watchlistCacheSummary={watchlistCacheSummary}
            workspace={workspace}
          />
          <MarketCalendarStatusCard
            calendar={marketCalendarState.calendar}
            className="workflow-market-calendar-panel"
            error={marketCalendarState.error}
            i18n={i18n}
            source={marketCalendarState.source}
          />
          <ScannerWorkspace
            candidates={scannerCandidates}
            className="workflow-scanner-panel"
            i18n={i18n}
            onSelectInstrument={selectInstrument}
          />
          {renderWorkflowNodesPanel("workflow-nodes-panel")}
        </>
      );
    }

    if (activeWorkAreaId === "strategy") {
      return (
        <>
          {renderChartPanel("chart-panel workflow-chart-panel")}
          {renderStrategyPanel("strategy-panel workflow-strategy-panel")}
          {renderWorkflowNodesPanel("workflow-nodes-panel")}
          {renderAgentPanel("workflow-agent-panel")}
          <DecisionLogPanel className="workflow-decision-panel" entries={workspace.decisionLog} i18n={i18n} />
        </>
      );
    }

    if (activeWorkAreaId === "backtest") {
      return (
        <>
          <BacktestReportPanel
            assumptionRows={backtestAssumptionRows}
            className="workflow-backtest-panel"
            evidenceCards={backtestEvidenceCards}
            i18n={i18n}
            onExportMarkdown={exportBacktestReportMarkdown}
            onStageParameterCandidate={stageBacktestParameterCandidate}
            onUpdateAssumption={updateBacktestAssumption}
            parameterScanRows={backtestParameterScanRows}
            parameterScanSummary={backtestParameterScanSummary}
            report={backtestReport}
            readinessGates={backtestReadinessGates}
            runComparisonMatrixRows={backtestRunComparisonMatrixRows}
            runComparisonMatrixSummary={backtestRunComparisonMatrixSummary}
            rows={backtestTradeRows}
          />
          {renderWorkflowNodesPanel("workflow-nodes-panel")}
          <RunHistoryPanel
            className="workflow-history-panel"
            i18n={i18n}
            onExport={exportRun}
            onInspectExport={inspectRunExportPackage}
            onImportFile={importRunExportFile}
            onReplay={replayRun}
            runComparisonRows={runComparisonRows}
            runHistory={runHistory}
            workspace={workspace}
          />
          {renderAgentPanel("workflow-agent-panel")}
        </>
      );
    }

    if (activeWorkAreaId === "ai-review") {
      return (
        <>
          {renderAgentPanel("workflow-agent-panel")}
          {renderWorkflowNodesPanel("workflow-nodes-panel")}
          <DecisionLogPanel className="workflow-decision-panel" entries={workspace.decisionLog} i18n={i18n} />
          <RunHistoryPanel
            className="workflow-history-panel"
            i18n={i18n}
            onExport={exportRun}
            onInspectExport={inspectRunExportPackage}
            onImportFile={importRunExportFile}
            onReplay={replayRun}
            runComparisonRows={runComparisonRows}
            runHistory={runHistory}
            workspace={workspace}
          />
        </>
      );
    }

    if (activeWorkAreaId === "portfolio") {
      return (
        <>
          <PortfolioWorkspace
            className="workflow-portfolio-panel"
            executionClassName="workflow-execution-panel"
            i18n={i18n}
            isPreparingPortfolioPeers={isPreparingPortfolioPeers}
            isRecordingPortfolioPaperOrders={isRecordingPortfolioPaperOrders}
            isRunningPortfolioBacktest={isRunningPortfolioBacktest}
            isSubmittingPaperExecution={isSubmittingPaperExecution}
            approvingPortfolioOrderId={approvingPortfolioPaperOrderId}
            onApprovePortfolioOrder={approvePortfolioPaperOrder}
            onExportPortfolioMarkdown={exportPortfolioBacktestMarkdown}
            onPreparePortfolioPeers={preparePortfolioPeerAudits}
            onRecordPortfolioPaperOrders={recordPortfolioPaperOrders}
            onRejectPortfolioOrder={rejectPortfolioPaperOrder}
            onRunPortfolioBacktest={runPortfolioBacktestDraft}
            onSimulatePortfolioOrder={simulatePortfolioPaperOrder}
            onSubmitPaperExecution={submitPaperExecution}
            paperRows={visiblePaperTradingRows}
            positionRows={paperPositionRows}
            portfolioBacktestDraft={portfolioBacktestDraft}
            portfolioBacktestDiagnosticRows={portfolioBacktestDiagnosticRows}
            portfolioBacktestResult={portfolioBacktestState}
            portfolioPaperOrderBatches={portfolioPaperOrderBatches}
            portfolioPaperOrderApprovalRows={portfolioPaperOrderApprovalRows}
            portfolioPaperOrderHistoryError={portfolioPaperOrderHistoryError}
            portfolioPaperOrderLifecycleRows={portfolioPaperOrderLifecycleRows}
            portfolioPaperOrderLatestSimulationSummary={portfolioPaperOrderLatestSimulationSummary}
            portfolioPaperOrderReplayPositionRows={portfolioPaperOrderReplayPositionRows}
            portfolioPaperOrderReplaySummaryTiles={portfolioPaperOrderReplaySummaryTiles}
            portfolioPaperOrderSimulationRouteRows={portfolioPaperOrderSimulationRouteRows}
            portfolioPaperOrderSimulations={portfolioPaperOrderSimulations}
            portfolioPaperOrderStateHistoryRows={portfolioPaperOrderStateHistoryRows}
            portfolioPeerAuditPlan={portfolioPeerAuditPlan}
            riskApproval={riskApprovalSummary}
            rows={portfolioRiskRows}
            simulatingPortfolioOrderId={simulatingPortfolioPaperOrderId}
            summaryTiles={paperExecutionSummaryTiles}
            workspace={workspace}
          />
          <DecisionLogPanel className="workflow-decision-panel" entries={workspace.decisionLog} i18n={i18n} />
        </>
      );
    }

    if (activeWorkAreaId === "execution") {
      return (
        <>
          <ExecutionPanel
            className="workflow-execution-panel"
            i18n={i18n}
            isSubmitting={isSubmittingPaperExecution}
            onSubmit={submitPaperExecution}
            approval={riskApprovalSummary}
            approvingPortfolioOrderId={approvingPortfolioPaperOrderId}
            onApprovePortfolioOrder={approvePortfolioPaperOrder}
            onRejectPortfolioOrder={rejectPortfolioPaperOrder}
            onSimulatePortfolioOrder={simulatePortfolioPaperOrder}
            portfolioOrderApprovalRows={portfolioPaperOrderApprovalRows}
            portfolioOrderLatestSimulationSummary={portfolioPaperOrderLatestSimulationSummary}
            portfolioOrderRows={portfolioPaperOrderLifecycleRows}
            portfolioOrderReplayPositionRows={portfolioPaperOrderReplayPositionRows}
            portfolioOrderReplaySummaryTiles={portfolioPaperOrderReplaySummaryTiles}
            portfolioOrderSimulationRouteRows={portfolioPaperOrderSimulationRouteRows}
            portfolioOrderSimulations={portfolioPaperOrderSimulations}
            portfolioOrderStateHistoryRows={portfolioPaperOrderStateHistoryRows}
            rows={visiblePaperTradingRows}
            simulatingPortfolioOrderId={simulatingPortfolioPaperOrderId}
            summaryTiles={paperExecutionSummaryTiles}
            workspace={workspace}
          />
          <PromotionQueuePanel
            adapterCertificationApplyRows={executionAdapterCertificationApplyRows}
            adapterControlledRestartEvidenceRows={executionAdapterControlledRestartEvidenceRows}
            adapterEnvironmentBindingRows={executionAdapterEnvironmentBindingRows}
            adapterHumanConfirmationRows={executionAdapterHumanConfirmationRows}
            adapterSandboxProbeExecutionRows={executionAdapterSandboxProbeExecutionRows}
            adapterSandboxProbePlanRows={executionAdapterSandboxProbePlanRows}
            adapterSandboxProbeReviewRows={executionAdapterSandboxProbeReviewRows}
            adapterProductionRouteReviewRows={executionAdapterProductionRouteReviewRows}
            adapterOrchestrationDryRunRows={executionAdapterOrchestrationDryRunRows}
            adapterOrchestrationExecutionRows={executionAdapterOrchestrationExecutionRows}
            adapterRestartAcceptanceRows={executionAdapterRestartAcceptanceRows}
            adapterRuntimeReloadAcceptanceRows={executionAdapterRuntimeReloadAcceptanceRows}
            adapterRuntimeReloadExecutionRows={executionAdapterRuntimeReloadExecutionRows}
            adapterRuntimeReloadPlanRows={executionAdapterRuntimeReloadPlanRows}
            adapterSecretMaterializationRows={executionAdapterSecretMaterializationRows}
            adapterSecretReferenceRows={executionAdapterSecretReferenceRows}
            adapterCertificationRows={executionAdapterCertificationRows}
            className="workflow-promotion-panel"
            i18n={i18n}
            readiness={promotionReadiness}
          />
          <BrokerAdapterPanel adapterRows={brokerAdapterRows} className="workflow-broker-panel" i18n={i18n} />
        </>
      );
    }

    if (activeWorkAreaId === "audit") {
      return (
        <>
          <GoldenPathRunbookPanel
            className="workflow-runbook-panel"
            i18n={i18n}
            isActionDisabled={isGoldenPathActionDisabledById}
            onRunAction={runGoldenPathActionById}
            onSelectWorkspace={selectProductWorkArea}
            preflight={researchPipelinePreflight}
            runbook={goldenPath?.runbook ?? []}
          />
          <RunHistoryPanel
            className="workflow-history-panel"
            i18n={i18n}
            onExport={exportRun}
            onInspectExport={inspectRunExportPackage}
            onImportFile={importRunExportFile}
            onReplay={replayRun}
            runComparisonRows={runComparisonRows}
            runHistory={runHistory}
            workspace={workspace}
          />
          <ResearchRunExportPreviewPanel
            className="workflow-export-preview-panel"
            i18n={i18n}
            rows={researchRunExportPreviewRows}
          />
          <ResearchRunExportPackageBrowserPanel
            className="workflow-export-browser-panel"
            deepLinkStatus={importAuditEvidenceDeepLinkStatus}
            evidenceSummary={auditEvidenceSummary}
            i18n={i18n}
            isEvidenceReportCopied={copiedAuditEvidenceReport}
            isEvidenceSummaryCopied={copiedAuditEvidenceSummary}
            isLoading={isInspectingExportPackage}
            onCopyEvidenceReport={copyAuditEvidenceReport}
            onCopyEvidenceSummary={copyAuditEvidenceSummary}
            onDownloadEvidenceReport={downloadAuditEvidenceReport}
            onRetryDeepLink={retryImportAuditEvidenceDeepLink}
            onQueryChange={setResearchRunExportBrowserQuery}
            query={researchRunExportBrowserQuery}
            rows={researchRunExportBrowserRows}
          />
          <MarketDataRefreshOverrideAuditLedgerPanel
            className="workflow-market-refresh-overrides-panel"
            i18n={i18n}
            isLoading={isLoadingMarketDataRefreshOverrideAudit}
            onNextPage={nextMarketDataRefreshOverrideAuditPage}
            onPreviousPage={previousMarketDataRefreshOverrideAuditPage}
            onQueryChange={updateMarketDataRefreshOverrideAuditQuery}
            pagination={marketDataRefreshOverrideAuditPagination}
            query={marketDataRefreshOverrideAuditQuery}
            rows={marketDataRefreshOverrideAuditRows}
          />
          <AuditEvidenceReportLedgerPanel
            className="workflow-report-ledger-panel"
            i18n={i18n}
            isLoading={isLoadingAuditEvidenceReportEvents}
            onNextPage={nextAuditEvidenceReportPage}
            onCopyEvidenceLink={copyAuditReportLedgerEvidenceLink}
            onOpenEvidenceLink={openAuditReportLedgerEvidenceLink}
            onPreviousPage={previousAuditEvidenceReportPage}
            onQueryChange={updateAuditEvidenceReportQuery}
            onRevokeReport={revokeAuditEvidenceReportEvent}
            onSignReport={signAuditEvidenceReportEvent}
            onVerifyReport={verifyAuditEvidenceReportEvent}
            pagination={auditEvidenceReportPagination}
            query={auditEvidenceReportQuery}
            rows={auditEvidenceReportLedgerRows}
            revokingEventId={revokingAuditReportEventId}
            signingEventId={signingAuditReportEventId}
            verifyingEventId={verifyingAuditReportEventId}
          />
          <AuditSigningKeyRegistryPanel
            className="workflow-signing-keys-panel"
            error={auditSigningKeyRegistry.error}
            i18n={i18n}
            isApplyingRotation={isApplyingAuditSigningKeyRotationPlan}
            isPreparingRotation={isPreparingAuditSigningKeyRotationPlan}
            isRecordingEnvironmentBinding={isRecordingAuditSigningKeyEnvironmentBinding}
            isRecordingRuntimeReloadPlan={isRecordingAuditSigningKeyRuntimeReloadPlan}
            isRecordingRuntimeReloadExecution={isRecordingAuditSigningKeyRuntimeReloadExecution}
            isRecordingRotationAcceptance={isRecordingAuditSigningKeyRotationAcceptance}
            isRecordingRestartEvidence={isRecordingAuditSigningKeyRestartEvidence}
            isRecordingSecretMaterialization={isRecordingAuditSigningKeySecretMaterialization}
            environmentBinding={auditSigningKeyEnvironmentBinding.environmentBinding}
            environmentBindingConfirmations={auditSigningKeyEnvironmentBindingConfirmations}
            environmentBindingError={auditSigningKeyEnvironmentBinding.error}
            environmentBindingMaterializationId={auditSigningKeySecretMaterialization.secretMaterialization?.materializationId ?? null}
            onApplyConfirmationChange={updateAuditSigningKeyRotationApplyConfirmation}
            onApplyRotation={applyAuditSigningKeyRotationPlanForAudit}
            onEnvironmentBindingConfirmationChange={updateAuditSigningKeyEnvironmentBindingConfirmation}
            onPrepareRotation={prepareAuditSigningKeyRotationPlanForAudit}
            onRecordEnvironmentBinding={recordAuditSigningKeyEnvironmentBindingForAudit}
            onRecordRuntimeReloadPlan={recordAuditSigningKeyRuntimeReloadPlanForAudit}
            onRecordRuntimeReloadExecution={recordAuditSigningKeyRuntimeReloadExecutionForAudit}
            onRecordRotationAcceptance={recordAuditSigningKeyRotationAcceptanceForAudit}
            onRecordRestartEvidence={recordAuditSigningKeyRestartEvidenceForAudit}
            onRecordSecretMaterialization={recordAuditSigningKeySecretMaterializationForAudit}
            onRotationAcceptanceConfirmationChange={updateAuditSigningKeyRotationAcceptanceConfirmation}
            onRuntimeReloadExecutionConfirmationChange={updateAuditSigningKeyRuntimeReloadExecutionConfirmation}
            onRuntimeReloadPlanConfirmationChange={updateAuditSigningKeyRuntimeReloadPlanConfirmation}
            onRestartEvidenceConfirmationChange={updateAuditSigningKeyRestartEvidenceConfirmation}
            onSecretMaterializationConfirmationChange={updateAuditSigningKeySecretMaterializationConfirmation}
            registry={auditSigningKeyRegistry.registry}
            restartEvidence={auditSigningKeyRestartEvidence.restartEvidence}
            restartEvidenceApplyEventId={auditSigningKeyRotationApplyEventId}
            restartEvidenceConfirmations={auditSigningKeyRestartEvidenceConfirmations}
            restartEvidenceError={auditSigningKeyRestartEvidence.error}
            secretMaterialization={auditSigningKeySecretMaterialization.secretMaterialization}
            secretMaterializationConfirmations={auditSigningKeySecretMaterializationConfirmations}
            secretMaterializationError={auditSigningKeySecretMaterialization.error}
            secretMaterializationPlanEventId={auditSigningKeyRotationPlanEventId}
            rotationApply={auditSigningKeyRotationApply.rotationApply}
            rotationApplyConfirmations={auditSigningKeyRotationApplyConfirmations}
            rotationApplyError={auditSigningKeyRotationApply.error}
            rotationError={auditSigningKeyRotationPlan.error}
            rotationAcceptance={auditSigningKeyRotationAcceptance.rotationAcceptance}
            rotationAcceptanceConfirmations={auditSigningKeyRotationAcceptanceConfirmations}
            rotationAcceptanceError={auditSigningKeyRotationAcceptance.error}
            rotationAcceptanceExecutionId={auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution?.executionId ?? null}
            rotationChainSummary={auditSigningKeyRotationChainSummary}
            rotationHistoryRows={auditSigningKeyRotationHistoryRows}
            rotationHistoryState={isLoadingAuditSigningKeyRotationEvents ? "loading" : "ready"}
            rotationLedgerStatus={auditSigningKeyRotationLedgerStatus}
            rotationPlan={auditSigningKeyRotationPlan.rotationPlan}
            runtimeReloadPlan={auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan}
            runtimeReloadPlanBindingId={auditSigningKeyEnvironmentBinding.environmentBinding?.bindingId ?? null}
            runtimeReloadPlanConfirmations={auditSigningKeyRuntimeReloadPlanConfirmations}
            runtimeReloadPlanError={auditSigningKeyRuntimeReloadPlan.error}
            runtimeReloadExecution={auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution}
            runtimeReloadExecutionConfirmations={auditSigningKeyRuntimeReloadExecutionConfirmations}
            runtimeReloadExecutionError={auditSigningKeyRuntimeReloadExecution.error}
            runtimeReloadExecutionPlanId={auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan?.planId ?? null}
            source={auditSigningKeyRegistry.source}
          />
          <ResearchRunImportDiffPanel
            className="workflow-import-diff-panel"
            i18n={i18n}
            isImporting={isApplyingImportPackage}
            onCancelImport={cancelPendingImportPackage}
            onConfirmImport={confirmPendingImportPackage}
            onQueryChange={setResearchRunImportDiffQuery}
            pendingFileName={pendingImportPackage?.fileName ?? null}
            query={researchRunImportDiffQuery}
            rows={researchRunImportDiffRows}
          />
          <ResearchRunImportAuditEventPanel
            className="workflow-import-events-panel"
            copiedEvidenceEventId={copiedImportAuditEvidenceEventId}
            events={researchRunImportAuditEvents}
            focusedEventId={focusedImportAuditEventId}
            i18n={i18n}
            isLoading={isLoadingResearchRunImportAudit}
            onCopyEvidenceAnchor={copyResearchRunImportAuditEvidenceAnchor}
            onInspectRunPackage={inspectResearchRunImportAuditEvent}
            onNextPage={nextResearchRunImportAuditPage}
            onPreviousPage={previousResearchRunImportAuditPage}
            onQueryChange={updateResearchRunImportAuditQuery}
            onReplayRollbackRun={replayImportRollbackRun}
            onUndoImport={undoResearchRunImportEvent}
            pagination={researchRunImportAuditPagination}
            query={researchRunImportAuditQuery}
          />
          <ResearchRunExportIndexPanel
            className="workflow-export-index-panel"
            i18n={i18n}
            isLoading={isIndexingExportPackages}
            onIndexPackages={indexRecentRunExportPackages}
            rows={researchRunExportIndexRows}
          />
          {renderWorkflowNodesPanel("workflow-nodes-panel")}
          <DecisionLogPanel className="workflow-decision-panel" entries={workspace.decisionLog} i18n={i18n} />
          <AiReviewAuditTrailPanel
            className="workflow-ai-audit-panel"
            currentRecord={currentAiReviewRunRecord}
            dataSnapshot={workspace.researchRun?.dataSnapshot ?? null}
            marketCalendar={workspace.researchRun?.dataSnapshot?.marketCalendar ?? null}
            preparationEvidence={workspace.researchRun?.dataSnapshot?.preparationEvidence ?? null}
            currentRunId={workspace.researchRun?.runId ?? null}
            currentStrategyRevision={workspace.researchRun?.strategyRevision ?? "draft"}
            dossier={aiReviewDossier}
            historyPagination={aiReviewHistoryPagination}
            historyQuery={aiReviewHistoryQuery}
            i18n={i18n}
            isLoadingHistory={isLoadingAiReviewHistory}
            liveExecutionBlocked={!workspace.execution.liveEnabled}
            onHistoryQueryChange={updateAiReviewHistoryQuery}
            onNextHistoryPage={nextAiReviewHistoryPage}
            onPreviousHistoryPage={previousAiReviewHistoryPage}
            onSelectWorkspace={selectProductWorkArea}
            records={activeAiReviewRunRecords}
            riskApproval={riskApprovalSummary}
            roundCount={agentCommitteeRounds.length}
          />
        </>
      );
    }

    if (activeWorkAreaId === "settings") {
      return (
        <>
          <PlatformSettingsPanel
            adapterCertificationApplyRows={executionAdapterCertificationApplyRows}
            adapterCertificationApplyConfirmations={adapterCertificationApplyConfirmations}
            adapterCertificationRows={executionAdapterCertificationRows}
            adapterHealthProbeRows={executionAdapterHealthProbeRows}
            adapterRows={brokerAdapterRows}
            adapterLedgerRows={executionAdapterLedgerRows}
            applyingAdapterCertificationId={applyingAdapterCertificationId}
            className="workflow-settings-panel"
            i18n={i18n}
            isRefreshingAdapterHealthProbe={isRefreshingAdapterHealthProbe}
            onApplyAdapterCertification={applyAdapterCertificationPreflight}
            onApplyConfirmationChange={updateAdapterCertificationApplyConfirmation}
            onOrchestrationDryRunConfirmationChange={updateAdapterOrchestrationDryRunConfirmation}
            onOrchestrationExecutionConfirmationChange={updateAdapterOrchestrationExecutionConfirmation}
            onHumanConfirmationChange={updateAdapterHumanConfirmationConfirmation}
            onSandboxProbeExecutionConfirmationChange={updateAdapterSandboxProbeExecutionConfirmation}
            onSandboxProbePlanConfirmationChange={updateAdapterSandboxProbePlanConfirmation}
            onSandboxProbeReviewConfirmationChange={updateAdapterSandboxProbeReviewConfirmation}
            onRecordAdapterCertification={recordAdapterCertificationEvidence}
            onRecordHumanConfirmation={recordAdapterHumanConfirmation}
            onRecordSandboxProbeExecution={recordAdapterSandboxProbeExecution}
            onRecordSandboxProbePlan={recordAdapterSandboxProbePlan}
            onRecordSandboxProbeReview={recordAdapterSandboxProbeReview}
            onRecordProductionRouteReview={recordAdapterProductionRouteReview}
            onRecordOrchestrationDryRun={recordAdapterOrchestrationDryRun}
            onRecordOrchestrationExecution={recordAdapterOrchestrationExecution}
            onRecordRuntimeReloadAcceptance={recordAdapterRuntimeReloadAcceptance}
            onRefreshAdapterHealthProbe={refreshExecutionAdapterHealthProbe}
            onRefreshContext={refreshCacheContext}
            onOpenMarketDataAdapterWorkflow={openMarketDataAdapterWorkflow}
            onRuntimeReloadAcceptanceConfirmationChange={updateAdapterRuntimeReloadAcceptanceConfirmation}
            onProductionRouteReviewConfirmationChange={updateAdapterProductionRouteReviewConfirmation}
            recordingAdapterCertificationId={recordingAdapterCertificationId}
            recordingOrchestrationDryRunId={recordingAdapterOrchestrationDryRunId}
            recordingOrchestrationExecutionId={recordingAdapterOrchestrationExecutionId}
            recordingHumanConfirmationId={recordingAdapterHumanConfirmationId}
            recordingSandboxProbeExecutionId={recordingAdapterSandboxProbeExecutionId}
            recordingSandboxProbePlanId={recordingAdapterSandboxProbePlanId}
            recordingSandboxProbeReviewId={recordingAdapterSandboxProbeReviewId}
            recordingProductionRouteReviewId={recordingAdapterProductionRouteReviewId}
            recordingRuntimeReloadAcceptanceId={recordingAdapterRuntimeReloadAcceptanceId}
            humanConfirmationConfirmations={adapterHumanConfirmationConfirmations}
            humanConfirmationRows={executionAdapterHumanConfirmationRows}
            sandboxProbeExecutionConfirmations={adapterSandboxProbeExecutionConfirmations}
            sandboxProbeExecutionRows={executionAdapterSandboxProbeExecutionRows}
            sandboxProbePlanConfirmations={adapterSandboxProbePlanConfirmations}
            sandboxProbePlanRows={executionAdapterSandboxProbePlanRows}
            sandboxProbeReviewConfirmations={adapterSandboxProbeReviewConfirmations}
            sandboxProbeReviewRows={executionAdapterSandboxProbeReviewRows}
            productionRouteReviewConfirmations={adapterProductionRouteReviewConfirmations}
            productionRouteReviewRows={executionAdapterProductionRouteReviewRows}
            refreshingCacheKey={refreshingCacheKey}
            orchestrationDryRunConfirmations={adapterOrchestrationDryRunConfirmations}
            orchestrationDryRunRows={executionAdapterOrchestrationDryRunRows}
            orchestrationExecutionConfirmations={adapterOrchestrationExecutionConfirmations}
            orchestrationExecutionRows={executionAdapterOrchestrationExecutionRows}
            runtimeReloadAcceptanceConfirmations={adapterRuntimeReloadAcceptanceConfirmations}
            runtimeReloadAcceptanceRows={executionAdapterRuntimeReloadAcceptanceRows}
            runtimeReloadExecutionRows={executionAdapterRuntimeReloadExecutionRows}
            settings={settingsStatus.settings}
            state={klinesState}
            workspace={workspace}
          />
          <BrokerAdapterPanel adapterRows={brokerAdapterRows} className="workflow-broker-panel" i18n={i18n} />
        </>
      );
    }

    return (
      <>
        {renderChartPanel("chart-panel workflow-chart-panel")}
        <ScannerWorkspace
          candidates={scannerCandidates}
          className="workflow-scanner-panel"
          i18n={i18n}
          onSelectInstrument={selectInstrument}
        />
        <ResearchNotesPanel
          className="workflow-note-panel"
          draft={researchNoteDraft}
          i18n={i18n}
          isSaving={isSavingResearchNote}
          note={researchNoteState}
          onChange={setResearchNoteDraft}
          onSave={saveCurrentResearchNote}
          workspace={workspace}
        />
        <ResearchContextReadinessPanel
          className="workflow-readiness-panel"
          i18n={i18n}
          isRefreshingCache={refreshingCacheKey === activeCacheContextKey}
          isRefreshingWatchlistCache={isRefreshingWatchlistCache}
          refreshGuard={marketDataRefreshGuard}
          refreshOverrideAuditStatus={marketDataRefreshOverrideAuditStatus}
          refreshOverrideReason={activeMarketDataRefreshOverride?.reason ?? null}
          isSavingNote={isSavingResearchNote}
          isSavingWatchlist={isSavingWatchlist}
          isSavingWorkspace={isSavingResearchWorkspace}
          onApplyRefreshOverride={enableMarketDataRefreshOverride}
          onClearRefreshOverride={clearMarketDataRefreshOverride}
          onRefreshCache={refreshSelectedMarketCache}
          onRefreshWatchlistCache={refreshWatchlistMarketCache}
          onInspectRefreshEvidence={inspectRefreshEvidenceRun}
          onSaveNote={saveCurrentResearchNote}
          onSaveWatchlist={saveCurrentWatchlist}
          onSaveWorkspace={saveCurrentResearchWorkspace}
          evidenceRows={researchContextEvidenceRows}
          rows={researchContextReadinessRows}
        />
        {renderWorkflowNodesPanel("workflow-nodes-panel")}
        <DecisionLogPanel className="workflow-decision-panel" entries={workspace.decisionLog} i18n={i18n} />
      </>
    );
  };

  return (
    <div className="terminal-shell">
      <aside className="left-rail">
        <div className="brand">
          <span className="brand-mark">AQ</span>
          <div>
            <strong>AIQuant Terminal</strong>
            <span>{i18n.t("brand.subtitle")}</span>
          </div>
        </div>

        <section className="rail-section">
          <p className="section-label">{i18n.t("section.quantLoop")}</p>
          <nav className="work-area-nav">
            {productWorkAreas.map((area, index) => {
              const Icon = workAreaIcons[area.id] ?? Radar;
              return (
                <button
                  className={`work-area-button ${area.accent} ${area.status} ${
                    activeWorkAreaId === area.id ? "selected active" : ""
                  }`}
                  key={area.id}
                  onClick={() => selectProductWorkArea(area.id)}
                  title={`${i18n.productWorkAreaLabel(area)} · ${i18n.productWorkAreaDescription(area)} · ${i18n.productWorkAreaDeliveryStage(area)}`}
                  type="button"
                >
                  <span className="work-area-index">{index + 1}</span>
                  <Icon size={15} />
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
          </nav>
        </section>

        <section className="workspace-card">
          <span className="section-label">{i18n.t("section.auditTrail")}</span>
          <strong>{workspace.selectedInstrument.symbol} · {workspace.selectedTimeframe}</strong>
          <p>{i18n.researchRunLabel(workspace.researchRun)}</p>
        </section>
      </aside>

      <main className="terminal-main">
        <header className="terminal-topbar">
          <div>
            <p className="section-label">{i18n.t("topbar.eyebrow")}</p>
            <h1>{workspace.selectedInstrument.name} · {workspace.selectedInstrument.symbol}</h1>
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
                  <div className="symbol-suggestions" role="listbox">
                    {isSymbolSearching ? (
                      <span className="symbol-suggestion-state">{i18n.t("symbol.searching")}</span>
                    ) : null}
                    {!isSymbolSearching && searchSuggestions.length
                      ? searchSuggestions.map((suggestion) => (
                          <div className="symbol-suggestion-row" key={`${suggestion.market}-${suggestion.symbol}-${suggestion.source}`}>
                            <button
                              className="symbol-suggestion-select"
                              onClick={() => selectSearchSuggestion(suggestion)}
                              role="option"
                              type="button"
                            >
                              <span>
                                <strong>{suggestion.symbol}</strong>
                                <em>{suggestion.name}</em>
                              </span>
                              <small>
                                {i18n.marketLabel(suggestion.market)}
                                {suggestion.exchange ? ` · ${suggestion.exchange}` : ""}
                                {" · "}
                                {suggestion.source}
                              </small>
                              {suggestion.cache ? (
                                <small className={`symbol-suggestion-cache ${suggestion.cache.freshness}`}>
                                  {marketSearchCacheSummary(i18n, suggestion.cache)}
                                </small>
                              ) : null}
                            </button>
                            {canRefreshSearchSuggestionCache(suggestion) ? (
                              <button
                                className="symbol-suggestion-refresh"
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
                                {i18n.locale === "zh-CN" ? "刷新缓存" : "Refresh cache"}
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
            <span className={`status-pill ${source === "core" ? "ok" : "paper"}`} title={error}>
              {i18n.statusLabel(statusLabel)}
            </span>
            <span className="status-pill paper">{i18n.executionMode(workspace.execution)}</span>
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
              onClick={runPipeline}
              title={researchPipelinePreflightStatusLabel(i18n, researchPipelinePreflight)}
            >
              {isRefreshing || isRunning ? <RefreshCw className="spin" size={17} /> : <Play size={17} />}
              {i18n.t("action.runPipeline")}
            </button>
          </div>
        </header>

        <section className="terminal-overview-grid market-tape">
          <section className={`module-focus-card ${activeWorkflowAccent}`}>
            <div>
              <span className="section-label">{i18n.t("moduleFocus.label")}</span>
              <strong>
                {activeWorkArea ? i18n.productWorkAreaLabel(activeWorkArea) : i18n.quantLoopLabel(activeLoopStep?.id ?? "research", activeLoopStep?.label ?? "Market Research")}
              </strong>
              <p>
                {activeWorkArea
                  ? i18n.productWorkAreaDescription(activeWorkArea)
                  : i18n.quantLoopFocus(activeLoopStep?.id ?? "research", { symbol: workspace.selectedInstrument.symbol })}
              </p>
              {goldenPath ? (
                <div className={`golden-path-status ${goldenPath.status}`}>
                  <span>{goldenPathProgressLabel(i18n, goldenPath)}</span>
                  <strong>
                    {goldenPathCurrentStep
                      ? goldenPathStepLabel(i18n, goldenPathCurrentStep.id, goldenPathCurrentStep.label)
                      : goldenPathStatusLabel(i18n, "ready")}
                  </strong>
                  <small>{goldenPathDetail(i18n, goldenPathCurrentStep, goldenPath.nextAction?.reason)}</small>
                </div>
              ) : null}
              <div className={`p0-readiness-summary ${p0PlatformReadinessSummary.state}`}>
                <div>
                  <span>{i18n.locale === "zh-CN" ? "P0 可用性" : "P0 Readiness"}</span>
                  <strong>{p0PlatformReadinessHeadline(i18n, p0PlatformReadinessSummary)}</strong>
                  <small>{p0PlatformReadinessDetail(i18n, p0PlatformReadinessSummary)}</small>
                </div>
                <em>{p0PlatformReadinessSummary.progressPct}%</em>
                <div className="p0-readiness-meter">
                  <span style={{ width: `${p0PlatformReadinessSummary.progressPct}%` }} />
                </div>
                <small className="p0-readiness-boundary">
                  {p0PlatformReadinessLiveBoundary(i18n, p0PlatformReadinessSummary)}
                </small>
                <div className={`p0-action-outcome ${p0PlatformActionOutcome.tone}`}>
                  <div>
                    <span>{i18n.locale === "zh-CN" ? "最近证据" : "Latest outcome"}</span>
                    <strong>{p0PlatformActionOutcomeLabel(i18n, p0PlatformActionOutcome)}</strong>
                    <small>{p0PlatformActionOutcomeDetail(i18n, p0PlatformActionOutcome)}</small>
                    <small>{p0PlatformActionOutcomeNextStep(i18n, p0PlatformActionOutcome)}</small>
                  </div>
                  <div className="p0-action-outcome-actions">
                    {p0ActionOutcomeEvidenceLink ? (
                      <button onClick={() => void copyP0ActionOutcomeEvidenceLink(p0PlatformActionOutcome)} type="button">
                        {copiedP0ActionOutcomeEvidenceId === p0ActionOutcomeEvidenceLink.evidenceId
                          ? i18n.locale === "zh-CN"
                            ? "已复制"
                            : "Copied"
                          : i18n.locale === "zh-CN"
                            ? "复制链接"
                            : "Copy link"}
                      </button>
                    ) : null}
                    <button
                      disabled={!p0PlatformActionOutcome.evidenceId}
                      onClick={() => openP0ActionOutcomeEvidence(p0PlatformActionOutcome)}
                      type="button"
                    >
                      {i18n.locale === "zh-CN" ? "查看证据" : "Evidence"}
                    </button>
                    <div className="p0-readiness-report-actions">
                      <button onClick={() => void copyP0ReadinessReport()} type="button">
                        <Copy size={11} />
                        {copiedP0ReadinessReport
                          ? i18n.locale === "zh-CN"
                            ? "报告已复制"
                            : "Report copied"
                          : i18n.locale === "zh-CN"
                            ? "复制报告"
                            : "Copy report"}
                      </button>
                      <button onClick={downloadP0ReadinessReport} type="button">
                        <Download size={11} />
                        {i18n.locale === "zh-CN" ? "下载报告" : "Download report"}
                      </button>
                      <button disabled={savingP0ReadinessReport} onClick={() => void saveP0ReadinessReport()} type="button">
                        {savingP0ReadinessReport ? <RefreshCw className="spin" size={11} /> : <ShieldCheck size={11} />}
                        {i18n.locale === "zh-CN" ? "入账报告" : "Save report"}
                      </button>
                    </div>
                  </div>
                </div>
                {auditEvidenceReportLedgerSummary.latestAuditAidEventId ? (
                  <div className="p0-readiness-ledger-echo">
                    <div>
                      <span>{i18n.locale === "zh-CN" ? "最近入账报告" : "Latest saved report"}</span>
                      <strong>{auditEvidenceReportLedgerSummary.latestAuditAidRunId}</strong>
                      <small>
                        {auditEvidenceReportLedgerSummary.latestAuditAidShortHash} ·{" "}
                        {auditEvidenceReportLedgerSummary.latestAuditAidPreflightState || "n/a"}
                      </small>
                    </div>
                    <button
                      disabled={!auditEvidenceReportLedgerSummary.latestAuditAidReportQuery}
                      onClick={focusLatestP0ReadinessReport}
                      type="button"
                    >
                      {i18n.locale === "zh-CN" ? "在审计中查看" : "Open in Audit"}
                    </button>
                  </div>
                ) : null}
                <div className={`p0-paper-preflight ${p0PaperExecutionPreflight.state}`}>
                  <div className="p0-paper-preflight-head">
                    <div>
                      <span>{i18n.locale === "zh-CN" ? "模拟执行预检" : "Paper execution preflight"}</span>
                      <strong>{p0PaperExecutionPreflightHeadline(i18n, p0PaperExecutionPreflight)}</strong>
                      <small>{p0PaperExecutionPreflightDetail(i18n, p0PaperExecutionPreflight)}</small>
                    </div>
                    <button
                      className="p0-paper-preflight-action"
                      disabled={
                        Boolean(p0PaperExecutionPreflight.primaryActionId) &&
                        isGoldenPathActionDisabledById(p0PaperExecutionPreflight.primaryActionId)
                      }
                      onClick={() =>
                        p0PaperExecutionPreflight.primaryActionId
                          ? runGoldenPathActionById(
                              p0PaperExecutionPreflight.primaryActionId,
                              p0PaperExecutionPreflight.primaryActionTargetWorkspaceId
                            )
                          : selectProductWorkArea(p0PaperExecutionPreflight.primaryActionTargetWorkspaceId)
                      }
                      type="button"
                    >
                      {p0PaperExecutionPreflightActionLabel(i18n, p0PaperExecutionPreflight.primaryActionLabel)}
                    </button>
                  </div>
                  <div className="p0-paper-preflight-gates">
                    {p0PaperExecutionPreflight.gates.map((gate) => (
                      <article className={`p0-paper-preflight-gate ${gate.status}`} key={gate.id}>
                        <span>{p0PaperExecutionPreflightGateLabel(i18n, gate)}</span>
                        <strong>{p0PaperExecutionPreflightGateValue(i18n, gate)}</strong>
                        <small>{p0PaperExecutionPreflightGateDetail(i18n, gate)}</small>
                      </article>
                    ))}
                  </div>
                </div>
                {paperExecutionDeepLinkStatus ? (
                  <div className={`p0-paper-deep-link ${paperExecutionDeepLinkStatus.status}`}>
                    <div>
                      <span>{i18n.locale === "zh-CN" ? "模拟执行深链" : "Paper execution link"}</span>
                      <strong>{paperExecutionDeepLinkStatusLabel(i18n, paperExecutionDeepLinkStatus.status)}</strong>
                      <small>
                        {paperExecutionDeepLinkStatus.runId} · {paperExecutionDeepLinkStatus.executionId}
                      </small>
                      {paperExecutionDeepLinkStatus.error ? <small>{paperExecutionDeepLinkStatus.error}</small> : null}
                    </div>
                  </div>
                ) : null}
                {p0PlatformBacklogItems.length ? (
                  <div className="p0-readiness-backlog">
                    {p0PlatformBacklogItems.map((item) => {
                      const targetWorkspaceId = productWorkAreaIds.includes(
                        item.targetWorkspaceId as ProductWorkAreaId
                      )
                        ? (item.targetWorkspaceId as ProductWorkAreaId)
                        : productWorkAreaIds.includes(item.workspaceId as ProductWorkAreaId)
                          ? (item.workspaceId as ProductWorkAreaId)
                          : "research";
                      const isP0BacklogActionDisabled = !item.actionId || isGoldenPathActionDisabledById(item.actionId);
                      const p0BacklogActionHint = p0PlatformBacklogActionHint(
                        i18n,
                        item,
                        isP0BacklogActionDisabled,
                        researchPipelinePreflight
                      );
                      return (
                        <article
                          className={`p0-readiness-backlog-row ${item.priority}`}
                          key={item.stepId}
                        >
                          <span>{item.rank}</span>
                          <div>
                            <strong>{goldenPathStepLabel(i18n, item.stepId, item.label)}</strong>
                            <small>{p0PlatformBacklogDetail(i18n, item)}</small>
                          </div>
                          <em>{p0PlatformBacklogPriorityLabel(i18n, item)}</em>
                          <button
                            className="p0-readiness-backlog-open"
                            onClick={() => selectProductWorkArea(targetWorkspaceId)}
                            type="button"
                          >
                            {i18n.locale === "zh-CN" ? "工作区" : "Open"}
                          </button>
                          <button
                            className="p0-readiness-backlog-action"
                            disabled={isP0BacklogActionDisabled}
                            onClick={() => runGoldenPathActionById(item.actionId, item.targetWorkspaceId ?? item.workspaceId)}
                            type="button"
                          >
                            {p0PlatformBacklogActionButtonLabel(i18n, item)}
                          </button>
                          {p0BacklogActionHint ? (
                            <small className={`p0-readiness-backlog-hint ${researchPipelinePreflight.status}`}>
                              {p0BacklogActionHint}
                            </small>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {activeWorkspaceContext ? (
                <div className={`workspace-gate-summary ${activeWorkspaceContext.status}`}>
                  <span>{goldenPathWorkspaceContextLabel(i18n, activeWorkspaceContext)}</span>
                  <strong>
                    {activeWorkspaceContext.primaryStepId
                      ? goldenPathStepLabel(
                          i18n,
                          activeWorkspaceContext.primaryStepId,
                          activeWorkspaceContext.primaryStepLabel ?? activeWorkspaceContext.reason
                        )
                      : i18n.productWorkAreaStatus(activeWorkspaceContext.status)}
                  </strong>
                  <button
                    className="workspace-gate-action"
                    disabled={isWorkspaceContextActionDisabled}
                    onClick={runWorkspaceContextAction}
                    type="button"
                  >
                    {goldenPathWorkspaceContextActionLabel(i18n, activeWorkspaceContext)}
                  </button>
                  <small>{goldenPathWorkspaceContextDetail(i18n, activeWorkspaceContext)}</small>
                  {workspaceContextActionHint ? (
                    <small className={`workspace-gate-preflight-hint ${researchPipelinePreflight.status}`}>
                      {workspaceContextActionHint}
                    </small>
                  ) : null}
                </div>
              ) : null}
              {goldenPathRunbookPreview.length ? (
                <div className="golden-path-runbook" aria-label="Golden path runbook">
                  {goldenPathRunbookPreview.map((item, index) => (
                    <button
                      className={`golden-path-runbook-item ${item.status} ${item.current ? "current" : ""}`}
                      key={item.stepId}
                      onClick={() => selectProductWorkArea(item.workspaceId as ProductWorkAreaId)}
                      type="button"
                    >
                      <span>{index + 1}</span>
                      <strong>{goldenPathStepLabel(i18n, item.stepId, item.label)}</strong>
                      <em>{goldenPathRunbookActionLabel(i18n, item)}</em>
                      <small>{goldenPathRunbookDetail(i18n, item)}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="module-focus-actions">
              {canSaveResearchWorkspace ? (
                <button
                  className={`compact-action research-workspace-save-action ${
                    isResearchWorkspaceSaved ? "saved" : "dirty"
                  }`}
                  disabled={isSavingResearchWorkspace}
                  onClick={saveCurrentResearchWorkspace}
                  title={
                    isResearchWorkspaceSaved
                      ? i18n.t("researchWorkspace.savedDetail")
                      : i18n.t("researchWorkspace.unsavedDetail")
                  }
                  type="button"
                >
                  {isSavingResearchWorkspace ? <RefreshCw className="spin" size={15} /> : <Save size={15} />}
                  <span>
                    {isResearchWorkspaceSaved
                      ? i18n.t("action.saveResearchWorkspace")
                      : i18n.t("action.saveResearchWorkspaceChanges")}
                  </span>
                  <em>
                    {isResearchWorkspaceSaved
                      ? i18n.t("researchWorkspace.saved")
                      : i18n.t("researchWorkspace.unsaved")}
                  </em>
                </button>
              ) : null}
              <button
                className="run-button compact"
                disabled={isGoldenPathActionDisabled}
                onClick={runGoldenPathAction}
                title={goldenPathActionId === "run-pipeline" ? researchPipelinePreflightStatusLabel(i18n, researchPipelinePreflight) : undefined}
                type="button"
              >
                {isRefreshing || isRunning || isSubmittingPaperExecution ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}
                {goldenPath?.nextAction
                  ? goldenPathActionLabel(i18n, goldenPath.nextAction)
                  : workflowNextActionLabel(i18n, activeLoopStep?.id ?? "research")}
              </button>
              {goldenPathActionHint ? (
                <small className={`golden-path-action-hint ${researchPipelinePreflight.status}`}>
                  {goldenPathActionHint}
                </small>
              ) : null}
            </div>
          </section>

          <section className="watchlist-strip">
            {workspace.watchlist.map((instrument) => (
              <button
                className={`ticker ${
                  workspace.selectedInstrument.symbol === instrument.symbol &&
                  workspace.selectedInstrument.market === instrument.market
                    ? "active"
                    : ""
                }`}
                key={`${instrument.market}-${instrument.symbol}`}
                onClick={() => selectInstrument(instrument)}
              >
                <span>{i18n.marketLabel(instrument.market)}</span>
                <strong>{instrument.symbol}</strong>
                <span className="ticker-price">{formatInstrumentPrice(instrument.price)}</span>
                <em className={instrument.changePct >= 0 ? "up" : "down"}>
                  {instrument.changePct >= 0 ? "+" : ""}
                  {instrument.changePct.toFixed(2)}%
                </em>
              </button>
            ))}
            <button
              className={`compact-action watchlist-save-action ${
                hasUnsavedWatchlistChanges ? "dirty" : "saved"
              }`}
              disabled={isSavingWatchlist || !workspace.watchlist.length}
              onClick={saveCurrentWatchlist}
              title={
                hasUnsavedWatchlistChanges
                  ? i18n.t("watchlist.unsavedDetail")
                  : i18n.t("watchlist.savedDetail")
              }
              type="button"
            >
              {isSavingWatchlist ? <RefreshCw className="spin" size={15} /> : <BookmarkPlus size={15} />}
              <span>
                {hasUnsavedWatchlistChanges
                  ? i18n.t("action.saveWatchlistChanges")
                  : i18n.t("action.saveWatchlist")}
              </span>
              <em>{hasUnsavedWatchlistChanges ? i18n.t("watchlist.unsaved") : i18n.t("watchlist.saved")}</em>
            </button>
          </section>

          <section className="metrics-row">
            {workspace.metrics.map((metric) => (
              <article className={`metric-card ${metric.tone}`} key={metric.label}>
                <span>{i18n.metricLabel(metric.label)}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </section>
        </section>

        <section className={`center-grid workflow-layout product-workspace-layout ${activeLoopStepId}-layout ${activeWorkAreaId}-layout`}>
          {renderActiveProductWorkspace()}
        </section>
      </main>

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

type AppI18n = ReturnType<typeof createI18n>;

function workflowNextActionLabel(i18n: AppI18n, stepId: string): string {
  if (stepId === "strategy") {
    return i18n.t("aiAction.strategyDraft");
  }
  if (stepId === "agent-review") {
    return i18n.t("aiAction.debate");
  }
  if (stepId === "paper") {
    return i18n.t("execution.submitPaper");
  }
  return i18n.t("action.runPipeline");
}

function productWorkAreasWithGoldenPath(
  areas: ProductWorkArea[],
  goldenPath: GoldenPathStatus | undefined
): ProductWorkArea[] {
  if (!goldenPath) {
    return areas;
  }
  const statusByWorkspace = new Map(goldenPath.workspaces.map((workspace) => [workspace.id, workspace.status]));
  return areas.map((area) => {
    const status = statusByWorkspace.get(area.id);
    return status ? { ...area, status } : area;
  });
}

function goldenPathStatusLabel(i18n: AppI18n, status: GoldenPathStatus["status"]): string {
  if (i18n.locale === "en-US") {
    return { ready: "Ready", review: "Review", blocked: "Blocked" }[status];
  }
  return { ready: "就绪", review: "待复核", blocked: "阻断" }[status];
}

function goldenPathProgressLabel(i18n: AppI18n, goldenPath: GoldenPathStatus): string {
  const progress = `${goldenPath.summary.passedSteps}/${goldenPath.summary.totalSteps}`;
  return `${goldenPathStatusLabel(i18n, goldenPath.status)} · ${i18n.locale === "en-US" ? progress : `${progress}步`}`;
}

function p0PlatformReadinessHeadline(i18n: AppI18n, summary: P0PlatformReadinessSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      blocked: "黄金路径阻断",
      live_ready: "实盘链路已就绪",
      paper_ready: "模拟链路已可用",
      review: "黄金路径待复核",
      unknown: "等待可用性证据"
    } satisfies Record<P0PlatformReadinessSummary["state"], string>
  )[summary.state];
}

function p0PlatformReadinessDetail(i18n: AppI18n, summary: P0PlatformReadinessSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "unknown") {
    return "黄金路径状态尚未加载。";
  }
  const progress = `${summary.passedSteps}/${summary.totalSteps} 个 P0 步骤通过`;
  if (summary.state === "paper_ready") {
    return `${progress} · 模拟研究链路已可用 · 实盘仍阻断`;
  }
  if (summary.state === "live_ready") {
    return `${progress} · 实盘闸门显示已就绪`;
  }
  const gap = summary.currentGap
    ? goldenPathStepLabel(i18n, summary.currentGap.stepId, summary.currentGap.label)
    : "证据";
  return `${progress} · 当前缺口：${gap}`;
}

function p0PlatformReadinessLiveBoundary(i18n: AppI18n, summary: P0PlatformReadinessSummary): string {
  if (i18n.locale === "en-US") {
    return summary.liveBoundary.detail;
  }
  if (summary.liveBoundary.liveTradingAllowed) {
    return "黄金路径显示实盘闸门打开；路由资金前仍需人工确认。";
  }
  if (summary.state === "unknown") {
    return "加载黄金路径后再评估执行边界。";
  }
  return "P0 可用于审计研究、评审和模拟执行；实盘交易保持阻断。";
}

function p0PlatformActionOutcomeLabel(i18n: AppI18n, outcome: P0PlatformActionOutcome): string {
  if (i18n.locale === "en-US") {
    return outcome.label;
  }
  return (
    {
      "Waiting for P0 action evidence": "等待 P0 动作证据",
      "Audited run available": "审计运行可用",
      "Audited run live gate open": "审计运行实盘闸门已开",
      "Paper execution recorded": "模拟执行已入账"
    }[outcome.label] ?? outcome.label
  );
}

function p0PlatformActionOutcomeDetail(i18n: AppI18n, outcome: P0PlatformActionOutcome): string {
  if (i18n.locale === "en-US") {
    return outcome.detail;
  }
  return outcome.detail
    .replace("Golden Path audit run loaded for paper execution", "已为模拟执行加载黄金路径审计运行")
    .replace("Run an audited pipeline to create traceable P0 evidence.", "运行审计流水线后生成可追踪 P0 证据。")
    .replace("orders", "笔委托")
    .replace("order", "笔委托")
    .replace("gates passed", "个闸门通过");
}

function p0PlatformActionOutcomeNextStep(i18n: AppI18n, outcome: P0PlatformActionOutcome): string {
  if (i18n.locale === "en-US") {
    return outcome.nextStep;
  }
  return (
    {
      "Review the execution handoff and promotion gates; live trading remains blocked.":
        "继续复核执行交接和晋级闸门；实盘仍保持阻断。",
      "Continue with AI review or paper execution from the P0 backlog.":
        "继续从 P0 待办运行 AI 评审或模拟执行。",
      "Require explicit operator confirmation before any live routing.":
        "任何实盘路由前都必须再次人工确认。",
      "Start with market data refresh and an audited research pipeline.":
        "先刷新行情数据并运行审计研究流水线。"
    }[outcome.nextStep] ?? outcome.nextStep
  );
}

function p0PaperExecutionPreflightHeadline(
  i18n: AppI18n,
  preflight: ReturnType<typeof buildP0PaperExecutionPreflight>
): string {
  if (i18n.locale === "en-US") {
    return preflight.headline;
  }
  return (
    {
      "Audited run required": "需要审计运行",
      "Bind latest audited run": "绑定最新审计运行",
      "Paper execution recorded": "模拟执行已入账",
      "Paper order ready": "模拟委托可提交",
      "Risk approval required": "需要风控审批"
    }[preflight.headline] ?? preflight.headline
  );
}

function p0PaperExecutionPreflightDetail(
  i18n: AppI18n,
  preflight: ReturnType<typeof buildP0PaperExecutionPreflight>
): string {
  if (i18n.locale === "en-US") {
    return preflight.detail;
  }
  return preflight.detail
    .replace(/^Golden Path has (.+) ready; load it before submitting a paper order\.$/u, "黄金路径已有 $1；先加载该运行再提交模拟委托。")
    .replace("Run an audited pipeline before submitting a paper order.", "提交模拟委托前先运行审计流水线。")
    .replace(/^Audited run (.+) can stage paper orders; live trading remains blocked until (\d+) gates pass\.$/u, "审计运行 $1 可创建模拟委托；实盘仍需 $2 个闸门通过。")
    .replace("orders", "笔委托")
    .replace("order", "笔委托")
    .replace("gates passed", "个闸门通过");
}

function p0PaperExecutionPreflightActionLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Load latest audited run": "加载最新审计运行",
      "Review paper execution": "复核模拟执行",
      "Review risk gates": "复核风控闸门",
      "Run audited pipeline": "运行审计流水线",
      "Submit paper order": "提交模拟委托"
    }[label] ?? label
  );
}

function p0PaperExecutionPreflightGateLabel(i18n: AppI18n, gate: P0PaperExecutionPreflightGate): string {
  if (i18n.locale === "en-US") {
    return gate.label;
  }
  return (
    {
      "audited-run": "审计运行",
      "live-boundary": "实盘边界",
      "paper-execution": "模拟执行",
      "risk-approval": "风控审批"
    }[gate.id] ?? gate.label
  );
}

function p0PaperExecutionPreflightGateValue(i18n: AppI18n, gate: P0PaperExecutionPreflightGate): string {
  if (i18n.locale === "en-US") {
    return gate.value;
  }
  return gate.value
    .replace("missing", "缺失")
    .replace("not recorded", "未入账")
    .replace("ready to submit", "可提交")
    .replace("paper only", "仅模拟盘")
    .replace("live gate open", "实盘闸门已开")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("Paper execution approved", "模拟执行已批准")
    .replace("execution gates", "个执行闸门");
}

function p0PaperExecutionPreflightGateDetail(i18n: AppI18n, gate: P0PaperExecutionPreflightGate): string {
  if (i18n.locale === "en-US") {
    return gate.detail;
  }
  return gate.detail
    .replace("Latest Golden Path run can be rebound into the current workspace.", "最新黄金路径运行可重新绑定到当前工作区。")
    .replace("No matching audited run is bound to the current workspace.", "当前工作区尚未绑定匹配的审计运行。")
    .replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。")
    .replace("Paper order has not been submitted for the latest audited run.", "最新审计运行尚未提交模拟委托。")
    .replace("Live routing remains blocked while paper execution is prepared.", "准备模拟执行期间，实盘路由保持阻断。")
    .replace("Paper execution is linked to an audited research run.", "模拟执行已绑定审计研究运行。")
    .replace("Paper execution captured its execution gate evidence.", "模拟执行已捕获执行闸门证据。")
    .replace("Paper order can be submitted after the operator confirms this paper-only route.", "操作者确认仅模拟盘路径后即可提交模拟委托。")
    .replace("Paper route can stage; live routing still requires explicit gate approval.", "模拟通道可创建委托；实盘仍需显式闸门审批。")
    .replace("Paper execution remains paper-only unless live gates are explicitly opened.", "除非显式打开实盘闸门，否则模拟执行保持 paper-only。")
    .replace("Golden Path reports live gates open; require explicit human confirmation before routing capital.", "黄金路径显示实盘闸门打开；路由资金前仍需人工确认。")
    .replace("orders recorded in paper mode.", "笔委托已在模拟盘入账。")
    .replace("order recorded in paper mode.", "笔委托已在模拟盘入账。");
}

function paperExecutionDeepLinkStatusLabel(
  i18n: AppI18n,
  status: PaperExecutionDeepLinkStatus["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        failed: "Failed",
        idle: "Ready to load",
        loaded: "Loaded",
        loading: "Loading"
      }[status] ?? status
    );
  }
  return (
    {
      failed: "加载失败",
      idle: "等待加载",
      loaded: "已恢复",
      loading: "加载中"
    }[status] ?? status
  );
}

function p0PlatformBacklogPriorityLabel(i18n: AppI18n, item: P0PlatformBacklogItem): string {
  if (i18n.locale === "en-US") {
    if (item.priority === "current") {
      return "Current";
    }
    return item.priority === "blocked" ? "Blocked" : "Review";
  }
  if (item.priority === "current") {
    return "当前";
  }
  return item.priority === "blocked" ? "阻断" : "复核";
}

function p0PlatformBacklogDetail(i18n: AppI18n, item: P0PlatformBacklogItem): string {
  const action = item.actionLabel
    ? goldenPathRunbookActionLabel(i18n, {
        actionLabel: item.actionLabel,
        current: item.priority === "current",
        detail: item.detail,
        label: item.label,
        status: item.status,
        stepId: item.stepId,
        workspaceId: item.workspaceId
      })
    : "";
  const detail = translateGoldenPathDetail(i18n, item.detail);
  return action ? `${action} · ${detail}` : detail;
}

function p0PlatformBacklogActionButtonLabel(i18n: AppI18n, item: P0PlatformBacklogItem): string {
  if (!item.actionLabel) {
    return i18n.locale === "zh-CN" ? "查看" : "View";
  }
  return goldenPathRunbookActionLabel(i18n, {
    actionLabel: item.actionLabel,
    current: item.priority === "current",
    detail: item.detail,
    label: item.label,
    status: item.status,
    stepId: item.stepId,
    workspaceId: item.workspaceId
  });
}

function p0PlatformBacklogActionHint(
  i18n: AppI18n,
  item: P0PlatformBacklogItem,
  isActionDisabled: boolean,
  preflight: ResearchPipelinePreflight
): string | null {
  const preflightHint = goldenPathActionPreflightHint(i18n, item.actionId, preflight);
  if (preflightHint) {
    return preflightHint;
  }
  if (!isActionDisabled) {
    return null;
  }
  if (!item.actionId) {
    return i18n.locale === "zh-CN" ? "该缺口目前只能先进入工作区复核。" : "Open the workspace to review this gap first.";
  }
  if (item.actionId === "submit-paper-order") {
    return i18n.locale === "zh-CN"
      ? "需要匹配当前上下文的审计运行、AI 证据和模拟执行闸门。"
      : "Requires a matching audited run, AI evidence, and paper execution gates.";
  }
  if (item.actionId === "refresh-data" || item.actionId === "refresh-watchlist-cache") {
    return i18n.locale === "zh-CN" ? "行情缓存刷新正在占用数据通道。" : "Market cache refresh is already using the data lane.";
  }
  return i18n.locale === "zh-CN" ? "等待当前任务完成后再执行。" : "Wait for the current task to finish before running this action.";
}

function goldenPathRunbookActionHint(
  i18n: AppI18n,
  item: GoldenPathStatus["runbook"][number],
  isActionDisabled: boolean,
  preflight: ResearchPipelinePreflight
): string | null {
  const preflightHint = goldenPathActionPreflightHint(i18n, item.actionId, preflight);
  if (preflightHint) {
    return preflightHint;
  }
  if (!isActionDisabled || item.passed || !item.actionId) {
    return null;
  }
  if (item.actionId === "submit-paper-order") {
    return i18n.locale === "zh-CN"
      ? "需要匹配当前上下文的审计运行、AI 证据和模拟执行闸门。"
      : "Requires a matching audited run, AI evidence, and paper execution gates.";
  }
  if (item.actionId === "refresh-data" || item.actionId === "refresh-watchlist-cache") {
    return i18n.locale === "zh-CN" ? "行情缓存刷新正在占用数据通道。" : "Market cache refresh is already using the data lane.";
  }
  return i18n.locale === "zh-CN" ? "等待当前任务完成后再执行。" : "Wait for the current task to finish before running this action.";
}

function goldenPathStepLabel(i18n: AppI18n, stepId: string, fallback: string): string {
  if (i18n.locale === "en-US") {
    return fallback;
  }
  return (
    {
      "market-data": "行情数据",
      "research-run": "审计研究",
      "backtest-report": "回测证据",
      "ai-review": "AI 评审",
      "paper-execution": "模拟执行",
      "live-gate": "实盘闸门"
    }[stepId] ?? fallback
  );
}

function goldenPathActionLabel(i18n: AppI18n, action: NonNullable<GoldenPathStatus["nextAction"]>): string {
  if (i18n.locale === "en-US") {
    return action.label;
  }
  return (
    {
      "refresh-data": "刷新行情",
      "refresh-watchlist-cache": "刷新自选缓存",
      "run-pipeline": "运行流水线",
      "run-ai-review": "运行 AI 评审",
      "fix-paper-handoff": "修复执行交接",
      "submit-paper-order": "提交模拟委托",
      "certify-live-adapter": "查看实盘闸门"
    }[action.id] ?? action.label
  );
}

function goldenPathRunbookActionLabel(i18n: AppI18n, item: GoldenPathRunbookPreviewItem): string {
  if (!item.actionLabel) {
    return item.current ? goldenPathStatusLabel(i18n, "blocked") : goldenPathStatusLabel(i18n, "review");
  }
  if (i18n.locale === "en-US") {
    return item.actionLabel;
  }
  return (
    {
      "Refresh market data": "刷新行情",
      "Refresh watchlist cache": "刷新自选缓存",
      "Run research pipeline": "运行流水线",
      "Run AI review": "运行 AI 评审",
      "Fix paper handoff": "修复交接",
      "Submit paper order": "提交委托",
      "Certify live adapter": "查看闸门"
    }[item.actionLabel] ?? item.actionLabel
  );
}

function goldenPathRunbookDetail(i18n: AppI18n, item: GoldenPathRunbookPreviewItem): string {
  if (i18n.locale === "en-US") {
    return item.detail;
  }
  const translatedDetail = translateGoldenPathDetail(i18n, item.detail);
  if (translatedDetail !== item.detail) {
    return translatedDetail;
  }
  return (
    {
      "market-data": "补齐或刷新当前标的 K 线缓存。",
      "research-run": "绑定行情、策略、回测和 AI 证据。",
      "backtest-report": "等待审计回测报告生成。",
      "ai-review": "等待基于审计 run 的 AI 评审。",
      "paper-execution": "提交并绑定模拟委托成交记录。",
      "live-gate": "保持实盘阻断，等待认证和确认。"
    }[item.stepId] ?? item.detail
  );
}

function translateGoldenPathDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const freshCache = detail.match(/^(\d+) fresh cached K-line rows are available for audited research\.$/);
  if (freshCache) {
    return `${freshCache[1]} 根新鲜 K 线缓存可支撑审计研究。`;
  }
  const staleCache = detail.match(/^(\d+) cached rows are stale\. Refresh market data before audited research\.$/);
  if (staleCache) {
    return `${staleCache[1]} 根缓存已过期，先刷新行情数据后再运行审计研究。`;
  }
  if (
    detail ===
    "No cached K-line context exists for the selected instrument. Refresh market data before audited research."
  ) {
    return "当前标的还没有 K 线缓存上下文，先刷新行情数据后再运行审计研究。";
  }
  if (
    detail ===
    "The selected context has no usable cached K-line rows. Refresh market data before audited research."
  ) {
    return "当前上下文没有可用 K 线缓存，先刷新行情数据后再运行审计研究。";
  }
  const missingRefreshEvidence = detail.match(
    /^(\d+) fresh cached K-line rows are available, but no matching watchlist cache refresh evidence covers (.+)\. Refresh watchlist cache before audited research\.$/
  );
  if (missingRefreshEvidence) {
    return `${missingRefreshEvidence[1]} 根新鲜 K 线缓存可用，但 ${missingRefreshEvidence[2]} 还没有匹配的自选刷新证据；先刷新自选缓存后再运行审计研究。`;
  }
  const readyRefreshEvidence = detail.match(
    /^(\d+) fresh cached K-line rows are available\. Matching watchlist cache refresh evidence (.+) confirms (\d+) rows from (.+)\.$/
  );
  if (readyRefreshEvidence) {
    return `${readyRefreshEvidence[1]} 根新鲜 K 线缓存可用，自选刷新证据 ${readyRefreshEvidence[2]} 已确认 ${readyRefreshEvidence[3]} 行来自 ${readyRefreshEvidence[4]}。`;
  }
  const reviewRefreshEvidence = detail.match(
    /^(\d+) fresh cached K-line rows are available, but watchlist cache refresh evidence (.+) requires review: (.+)\. Refresh watchlist cache before audited research\.$/
  );
  if (reviewRefreshEvidence) {
    return `${reviewRefreshEvidence[1]} 根新鲜 K 线缓存可用，但自选刷新证据 ${reviewRefreshEvidence[2]} 需要复核：${reviewRefreshEvidence[3]}；先刷新自选缓存后再运行审计研究。`;
  }
  return detail;
}

function auditRunbookStatusLabel(i18n: AppI18n, item: GoldenPathStatus["runbook"][number]): string {
  if (item.passed) {
    return i18n.locale === "zh-CN" ? "已通过" : "Passed";
  }
  return item.current
    ? goldenPathStatusLabel(i18n, "blocked")
    : goldenPathStatusLabel(i18n, item.status === "passed" ? "ready" : item.status);
}

function auditRunbookActionLabel(i18n: AppI18n, item: GoldenPathStatus["runbook"][number]): string {
  if (item.passed) {
    return i18n.locale === "zh-CN" ? "已完成" : "Done";
  }
  return goldenPathRunbookActionLabel(i18n, {
    stepId: item.stepId,
    label: item.label,
    workspaceId: item.workspaceId,
    status: item.status,
    current: item.current,
    detail: item.blocker ?? item.detail,
    actionLabel: item.actionLabel
  });
}

function auditRunbookDetail(i18n: AppI18n, item: GoldenPathStatus["runbook"][number]): string {
  const detail = item.blocker ?? item.detail;
  return goldenPathRunbookDetail(i18n, {
    stepId: item.stepId,
    label: item.label,
    workspaceId: item.workspaceId,
    status: item.status,
    current: item.current,
    detail,
    actionLabel: item.actionLabel
  });
}

function goldenPathWorkspaceContextLabel(i18n: AppI18n, context: GoldenPathWorkspaceContext): string {
  const progress = `${context.passedStepCount}/${context.totalStepCount}`;
  return `${i18n.productWorkAreaStatus(context.status)} · ${i18n.locale === "en-US" ? progress : `${progress}步`}`;
}

function goldenPathWorkspaceContextActionLabel(i18n: AppI18n, context: GoldenPathWorkspaceContext): string {
  if (!context.actionLabel) {
    return i18n.productWorkAreaStatus(context.status);
  }
  return goldenPathRunbookActionLabel(i18n, {
    stepId: context.primaryStepId ?? "",
    label: context.primaryStepLabel ?? "",
    workspaceId: context.workspaceId,
    status: goldenPathRunbookStatusFromWorkspaceStatus(context.status),
    current: context.current,
    detail: context.detail,
    actionLabel: context.actionLabel
  });
}

function goldenPathRunbookStatusFromWorkspaceStatus(status: GoldenPathWorkspaceContext["status"]) {
  if (status === "ready") {
    return "passed";
  }
  return status === "blocked" ? "blocked" : "review";
}

function goldenPathWorkspaceContextDetail(i18n: AppI18n, context: GoldenPathWorkspaceContext): string {
  if (i18n.locale === "en-US") {
    return context.detail || context.reason;
  }
  if (!context.primaryStepId) {
    return context.reason;
  }
  return (
    {
      "market-data": "本工作区负责补齐当前标的行情缓存。",
      "research-run": "本工作区负责生成可复现审计运行。",
      "backtest-report": "本工作区等待或展示审计回测报告。",
      "ai-review": "本工作区只基于审计证据运行 AI 评审。",
      "paper-execution": "本工作区负责模拟委托和执行交接。",
      "live-gate": "本工作区负责实盘适配器和安全闸门。"
    }[context.primaryStepId] ?? context.detail ?? context.reason
  );
}

function goldenPathDetail(
  i18n: AppI18n,
  step: GoldenPathStatus["steps"][number] | undefined,
  fallback?: string
): string {
  if (i18n.locale === "en-US") {
    return step?.detail ?? fallback ?? "";
  }
  if (!step) {
    return "当前上下文已完成 P0 模拟闭环，实盘仍需认证。";
  }
  if (step.id === "paper-execution" && step.status === "blocked") {
    return "模拟执行交接未通过，请先修复数据质量或结构化风控。";
  }
  const translatedDetail = translateGoldenPathDetail(i18n, step.detail);
  if (translatedDetail !== step.detail) {
    return translatedDetail;
  }
  return (
    {
      "market-data": "当前标的缺少可用 K 线缓存，先刷新行情数据。",
      "research-run": "先运行流水线，绑定行情、策略、回测和 AI 证据。",
      "backtest-report": "回测证据缺失，重新运行流水线生成审计报告。",
      "ai-review": "AI 评审证据缺失，先完成基于审计 run 的解释记录。",
      "paper-execution": "审计证据已就绪，下一步提交模拟委托并绑定成交记录。",
      "live-gate": "实盘通道继续阻断，需要适配器认证、风控审批和人工确认。"
    }[step.id] ?? fallback ?? step.detail
  );
}

function ChartDataStrip({
  i18n,
  latestChartBar,
  state
}: {
  i18n: AppI18n;
  latestChartBar: MarketKlinesResult["bars"][number] | undefined;
  state: MarketKlinesResult;
}) {
  return (
    <div className="chart-data-strip">
      <span>{i18n.t("chart.symbol")}: {state.symbol}</span>
      {latestChartBar ? <span>{i18n.t("chart.latestClose")}: {latestChartBar.close.toFixed(2)}</span> : null}
      {latestChartBar ? <span>{i18n.t("chart.asOf")}: {formatChartDate(latestChartBar.timestamp)}</span> : null}
      <span>{i18n.t("chart.source")}: {state.quality.source}</span>
      <span>{i18n.t("chart.bars", { count: state.bars.length })}</span>
    </div>
  );
}

function StrategySummary({
  draft,
  i18n,
  isSavingStrategy,
  library,
  onApplyStrategyTemplate,
  onLoadStrategyVersion,
  onSaveStrategyVersion,
  onUpdateStrategyRuleDraftField,
  readinessGates,
  rows,
  templates,
  validationSource,
  workspace
}: {
  draft: StrategyRuleDraft;
  i18n: AppI18n;
  isSavingStrategy: boolean;
  library: StrategyLibraryItem[];
  onApplyStrategyTemplate: (templateId: StrategyTemplateId) => void;
  onLoadStrategyVersion: (strategy: StrategyLibraryItem) => void;
  onSaveStrategyVersion: () => void;
  onUpdateStrategyRuleDraftField: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  readinessGates: StrategyReadinessGate[];
  rows: StrategyRuleRow[];
  templates: StrategyTemplateOption[];
  validationSource: WorkspaceLoadResult["source"];
  workspace: TerminalWorkspace;
}) {
  return (
    <div className="strategy-workbench">
      <div className="strategy-structured-editor">
        <div className="strategy-builder-title">
          <span>{i18n.t("strategy.builder")}</span>
          <strong>{workspace.researchRun ? workspace.researchRun.strategyRevision : i18n.t("strategy.auditRequired")}</strong>
        </div>
        <StrategyTemplatePicker
          activeDraft={draft}
          i18n={i18n}
          onApply={onApplyStrategyTemplate}
          templates={templates}
        />
        <label>
          <span>{i18n.t("strategy.name")}</span>
          <input
            onChange={(event) => onUpdateStrategyRuleDraftField("name", event.currentTarget.value)}
            value={draft.name}
          />
        </label>
        <div className="strategy-draft-grid">
          <StrategyConditionField
            field="entryKind"
            i18n={i18n}
            kind={draft.entryKind}
            label={i18n.t("strategy.entryCondition")}
            onUpdate={onUpdateStrategyRuleDraftField}
            options={["close_above_sma", "rsi_below"]}
            threshold={draft.entryThreshold}
            thresholdField="entryThreshold"
            window={draft.entryWindow}
            windowField="entryWindow"
          />
          <StrategyRsiConfirmField
            field="entryRsiConfirm"
            i18n={i18n}
            isEnabled={draft.entryRsiConfirm}
            label={i18n.t("strategy.rsiConfirm")}
            onUpdate={onUpdateStrategyRuleDraftField}
            threshold={draft.entryRsiThreshold}
            thresholdField="entryRsiThreshold"
            window={draft.entryRsiWindow}
            windowField="entryRsiWindow"
          />
          <StrategyVolumeConfirmField
            field="entryVolumeConfirm"
            i18n={i18n}
            isEnabled={draft.entryVolumeConfirm}
            label={i18n.t("strategy.volumeConfirm")}
            onUpdate={onUpdateStrategyRuleDraftField}
            value={draft.entryVolumeWindow}
            windowField="entryVolumeWindow"
          />
          <StrategyConditionField
            field="exitKind"
            i18n={i18n}
            kind={draft.exitKind}
            label={i18n.t("strategy.exitCondition")}
            onUpdate={onUpdateStrategyRuleDraftField}
            options={["close_below_sma", "rsi_above"]}
            threshold={draft.exitThreshold}
            thresholdField="exitThreshold"
            window={draft.exitWindow}
            windowField="exitWindow"
          />
          <StrategyNumberField
            field="positionPct"
            i18n={i18n}
            label={i18n.t("strategy.positionPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.positionPct}
          />
          <StrategyNumberField
            field="stopLossPct"
            i18n={i18n}
            label={i18n.t("strategy.stopLossPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.stopLossPct}
          />
          <StrategyNumberField
            field="takeProfitPct"
            i18n={i18n}
            label={i18n.t("strategy.takeProfitPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.takeProfitPct}
          />
          <StrategyNumberField
            field="maxDrawdownPct"
            i18n={i18n}
            label={i18n.t("strategy.maxDrawdownPct")}
            onUpdate={onUpdateStrategyRuleDraftField}
            suffix="%"
            value={draft.maxDrawdownPct}
          />
        </div>
        <div className="strategy-generated-snapshot">
          <span>{i18n.t("strategy.generatedSnapshot")}</span>
          <strong>{i18n.strategyText(workspace.strategy.entry)}</strong>
          <strong>{i18n.strategyText(workspace.strategy.exit)}</strong>
          <small>{i18n.strategyText(workspace.strategy.risk)}</small>
        </div>
        <div className="strategy-readiness-list">
          <div className="strategy-rule-title">
            <span>{i18n.t("strategy.readiness")}</span>
            <strong>
              {readinessGates.filter((gate) => gate.status === "passed").length}/{readinessGates.length}
              <em className="strategy-validation-source">{strategyValidationSourceLabel(i18n, validationSource)}</em>
            </strong>
          </div>
          {readinessGates.map((gate) => (
            <article className={`strategy-readiness-gate ${gate.tone}`} data-status={gate.status} key={gate.id}>
              <span>
                {strategyReadinessGateLabel(i18n, gate.label)}
                <em>{strategyReadinessGateStatusLabel(i18n, gate.status)}</em>
              </span>
              <strong>{i18n.strategyText(gate.value)}</strong>
              <p>{i18n.strategyText(gate.detail)}</p>
            </article>
          ))}
        </div>
        <div className="strategy-library-actions">
          <button disabled={isSavingStrategy} onClick={onSaveStrategyVersion} type="button">
            <GitBranch size={15} />
            <span>{isSavingStrategy ? i18n.t("strategy.saving") : i18n.t("strategy.saveVersion")}</span>
          </button>
        </div>
      </div>
      <div className="strategy-rule-board">
        <div className="strategy-rule-title">
          <span>{i18n.t("strategy.rules")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="strategy-rule-grid">
          <div className="strategy-rule-row strategy-rule-head">
            <span>{i18n.t("strategy.rules")}</span>
            <span>{i18n.t("strategy.condition")}</span>
            <span>{i18n.t("strategy.parameter")}</span>
            <span>{i18n.t("strategy.status")}</span>
          </div>
          {rows.map((row) => (
            <article className={`strategy-rule-row ${row.tone}`} key={row.id}>
              <span>
                <strong>{strategyRuleGroupLabel(i18n, row.group)}</strong>
                <em>{strategyRuleLabel(i18n, row.label)}</em>
              </span>
              <span>{i18n.strategyText(row.condition)}</span>
              <span>{strategyRuleParameterLabel(i18n, row.parameter)}</span>
              <span>{strategyRuleStatusLabel(i18n, row.status)}</span>
            </article>
          ))}
        </div>
      </div>
      <div className="strategy-library-list">
        <div className="strategy-rule-title">
          <span>{i18n.t("strategy.library")}</span>
          <strong>{library.length}</strong>
        </div>
        {library.length ? (
          library.map((item) => {
            const diffRows = buildStrategyVersionDiffRows(workspace, item);
            const changedRows = diffRows.filter((row) => row.changed);
            const isCurrentDraft =
              item.market === workspace.selectedInstrument.market &&
              item.symbol === workspace.selectedInstrument.symbol &&
              item.timeframe === workspace.selectedTimeframe &&
              item.strategySnapshot.name === workspace.strategy.name &&
              item.strategySnapshot.entry === workspace.strategy.entry &&
              item.strategySnapshot.exit === workspace.strategy.exit &&
              item.strategySnapshot.position === workspace.strategy.position &&
              item.strategySnapshot.risk === workspace.strategy.risk;

            return (
              <article className={`strategy-library-card ${item.status}`} key={item.revision}>
                <span>
                  <strong>{item.name}</strong>
                  <em>{item.revision}</em>
                  <small>
                    {i18n.t("strategy.context")}: {item.market.toUpperCase()} · {item.symbol} · {item.timeframe}
                  </small>
                  <small>
                    {i18n.t("strategy.auditRun")}: {item.auditRunId ?? i18n.t("strategy.auditRequired")}
                  </small>
                  <small>
                    {i18n.t("strategy.diff")}:{" "}
                    {changedRows.length
                      ? i18n.t("strategy.diffChanged", { count: changedRows.length })
                      : i18n.t("strategy.diffSame")}
                  </small>
                  <div className="strategy-library-diff" aria-label={i18n.t("strategy.diff")}>
                    {(changedRows.length ? changedRows.slice(0, 3) : diffRows.slice(0, 2)).map((row) => (
                      <span className={`strategy-diff-chip ${row.tone}`} key={row.id}>
                        {strategyDiffRowLabel(i18n, row)}
                      </span>
                    ))}
                  </div>
                </span>
                <span>{strategyLibraryStatusLabel(i18n, item.status)}</span>
                <button disabled={isCurrentDraft} onClick={() => onLoadStrategyVersion(item)} type="button">
                  {isCurrentDraft ? i18n.t("strategy.loadedVersion") : i18n.t("strategy.loadVersion")}
                </button>
              </article>
            );
          })
        ) : (
          <p className="strategy-library-empty">{i18n.t("strategy.libraryEmpty")}</p>
        )}
      </div>
    </div>
  );
}

function StrategyTemplatePicker({
  activeDraft,
  i18n,
  onApply,
  templates
}: {
  activeDraft: StrategyRuleDraft;
  i18n: AppI18n;
  onApply: (templateId: StrategyTemplateId) => void;
  templates: StrategyTemplateOption[];
}) {
  return (
    <section className="strategy-template-picker" aria-label={i18n.t("strategy.templates")}>
      <div className="strategy-template-title">
        <span>{i18n.t("strategy.templates")}</span>
        <strong>{templates.length}</strong>
      </div>
      <div className="strategy-template-grid">
        {templates.map((template) => {
          const isActive =
            activeDraft.name === template.draft.name &&
            activeDraft.entryKind === template.draft.entryKind &&
            activeDraft.entryWindow === template.draft.entryWindow &&
            activeDraft.entryThreshold === template.draft.entryThreshold &&
            activeDraft.entryRsiConfirm === template.draft.entryRsiConfirm &&
            activeDraft.entryRsiWindow === template.draft.entryRsiWindow &&
            activeDraft.entryRsiThreshold === template.draft.entryRsiThreshold &&
            activeDraft.entryVolumeConfirm === template.draft.entryVolumeConfirm &&
            activeDraft.entryVolumeWindow === template.draft.entryVolumeWindow &&
            activeDraft.exitKind === template.draft.exitKind &&
            activeDraft.exitWindow === template.draft.exitWindow &&
            activeDraft.exitThreshold === template.draft.exitThreshold &&
            activeDraft.positionPct === template.draft.positionPct &&
            activeDraft.stopLossPct === template.draft.stopLossPct &&
            activeDraft.takeProfitPct === template.draft.takeProfitPct &&
            activeDraft.maxDrawdownPct === template.draft.maxDrawdownPct;

          return (
            <button
              className={`strategy-template-card ${isActive ? "active" : ""}`}
              disabled={isActive}
              key={template.id}
              onClick={() => onApply(template.id)}
              type="button"
            >
              <strong>{strategyTemplateName(i18n, template)}</strong>
              <span>{strategyTemplateDescription(i18n, template)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StrategyConditionField({
  field,
  i18n,
  kind,
  label,
  onUpdate,
  options,
  threshold,
  thresholdField,
  window,
  windowField
}: {
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  kind: StrategyConditionKind;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  options: StrategyConditionKind[];
  threshold: number;
  thresholdField: StrategyRuleDraftField;
  window: number;
  windowField: StrategyRuleDraftField;
}) {
  const isRsi = kind === "rsi_below" || kind === "rsi_above";
  return (
    <label className={`strategy-draft-field strategy-condition-field ${isRsi ? "rsi" : "sma"}`}>
      <span>{label}</span>
      <div className={`strategy-condition-editor ${isRsi ? "rsi" : "sma"}`}>
        <select
          className="strategy-condition-select"
          onChange={(event) => onUpdate(field, event.currentTarget.value)}
          value={kind}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {strategyConditionOptionLabel(i18n, option)}
            </option>
          ))}
        </select>
        <input
          aria-label={`${label} window`}
          max={250}
          min={1}
          onChange={(event) => onUpdate(windowField, Number(event.currentTarget.value))}
          step={1}
          type="number"
          value={window}
        />
        {isRsi ? (
          <input
            aria-label={`${label} threshold`}
            className="strategy-threshold-field"
            max={100}
            min={0}
            onChange={(event) => onUpdate(thresholdField, Number(event.currentTarget.value))}
            step={1}
            type="number"
            value={threshold}
          />
        ) : (
          <em>SMA</em>
        )}
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </label>
  );
}

function StrategyVolumeConfirmField({
  field,
  i18n,
  isEnabled,
  label,
  onUpdate,
  value,
  windowField
}: {
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  isEnabled: boolean;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  value: number;
  windowField: StrategyRuleDraftField;
}) {
  return (
    <label className={`strategy-draft-field strategy-volume-field ${isEnabled ? "enabled" : "disabled"}`}>
      <span>{label}</span>
      <div className="strategy-volume-toggle">
        <input
          aria-label={label}
          checked={isEnabled}
          onChange={(event) => onUpdate(field, event.currentTarget.checked)}
          type="checkbox"
        />
        <input
          aria-label={i18n.t("strategy.volumeWindow")}
          disabled={!isEnabled}
          max={250}
          min={1}
          onChange={(event) => onUpdate(windowField, Number(event.currentTarget.value))}
          step={1}
          type="number"
          value={value}
        />
        <em>VOL</em>
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </label>
  );
}

function StrategyRsiConfirmField({
  field,
  i18n,
  isEnabled,
  label,
  onUpdate,
  threshold,
  thresholdField,
  window,
  windowField
}: {
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  isEnabled: boolean;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  threshold: number;
  thresholdField: StrategyRuleDraftField;
  window: number;
  windowField: StrategyRuleDraftField;
}) {
  return (
    <label className={`strategy-draft-field strategy-rsi-field ${isEnabled ? "enabled" : "disabled"}`}>
      <span>{label}</span>
      <div className="strategy-rsi-toggle">
        <input
          aria-label={label}
          checked={isEnabled}
          onChange={(event) => onUpdate(field, event.currentTarget.checked)}
          type="checkbox"
        />
        <input
          aria-label={i18n.t("strategy.rsiWindow")}
          disabled={!isEnabled}
          max={250}
          min={1}
          onChange={(event) => onUpdate(windowField, Number(event.currentTarget.value))}
          step={1}
          type="number"
          value={window}
        />
        <input
          aria-label={i18n.t("strategy.rsiThreshold")}
          disabled={!isEnabled}
          max={100}
          min={0}
          onChange={(event) => onUpdate(thresholdField, Number(event.currentTarget.value))}
          step={1}
          type="number"
          value={threshold}
        />
        <em>RSI</em>
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </label>
  );
}

function StrategyNumberField({
  field,
  i18n,
  label,
  onUpdate,
  suffix,
  value
}: {
  field: StrategyRuleDraftField;
  i18n: AppI18n;
  label: string;
  onUpdate: (field: StrategyRuleDraftField, value: number | string | boolean) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="strategy-draft-field">
      <span>{label}</span>
      <div>
        <input
          min={field === "entryWindow" || field === "exitWindow" ? 1 : 0}
          max={field === "entryWindow" || field === "exitWindow" ? 250 : 100}
          onChange={(event) => onUpdate(field, Number(event.currentTarget.value))}
          step={1}
          type="number"
          value={value}
        />
        <em>{suffix}</em>
      </div>
      <small>{strategyDraftHint(i18n, field)}</small>
    </label>
  );
}

function BacktestReportPanel({
  assumptionRows,
  className,
  evidenceCards,
  i18n,
  onExportMarkdown,
  onStageParameterCandidate,
  onUpdateAssumption,
  parameterScanRows,
  parameterScanSummary,
  report,
  readinessGates,
  runComparisonMatrixRows,
  runComparisonMatrixSummary,
  rows
}: {
  assumptionRows: BacktestAssumptionRow[];
  className?: string;
  evidenceCards: BacktestEvidenceCard[];
  i18n: AppI18n;
  onExportMarkdown?: () => void;
  onStageParameterCandidate: (candidateId: string) => void;
  onUpdateAssumption: (field: BacktestAssumptionField, value: number) => void;
  parameterScanRows: BacktestParameterScanRow[];
  parameterScanSummary: BacktestParameterScanSummary | null;
  report: BacktestReport;
  readinessGates: BacktestReadinessGate[];
  runComparisonMatrixRows: BacktestRunComparisonMatrixRow[];
  runComparisonMatrixSummary: BacktestRunComparisonMatrixSummary | null;
  rows: BacktestTradeRow[];
}) {
  const [runComparisonMatrixQuery, setRunComparisonMatrixQuery] = useState("");
  const diagnosticCard = evidenceCards.find((card) => card.id === "diagnostics");
  const reportCards = evidenceCards.filter((card) => card.id !== "diagnostics");
  const diagnostics = report.diagnostics.length ? report.diagnostics : [];
  const equityStart = report.equityCurve[0]?.equity ?? null;
  const equityEnd = report.equityCurve.at(-1)?.equity ?? null;
  const filteredRunComparisonMatrixRows = filterBacktestRunComparisonMatrixRows(
    runComparisonMatrixRows,
    runComparisonMatrixQuery
  );
  const currentComparisonRow = runComparisonMatrixSummary?.currentRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.currentRunId) ?? null
    : null;
  const bestReturnComparisonRow = runComparisonMatrixSummary?.bestReturnRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.bestReturnRunId) ?? null
    : null;
  const lowestDrawdownComparisonRow = runComparisonMatrixSummary?.lowestDrawdownRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.lowestDrawdownRunId) ?? null
    : null;
  const previousComparisonRow = runComparisonMatrixSummary?.previousRunId
    ? runComparisonMatrixRows.find((row) => row.runId === runComparisonMatrixSummary.previousRunId) ?? null
    : null;

  return (
    <Panel
      title={i18n.t("panel.backtest.title")}
      subtitle={i18n.t("panel.backtest.subtitle")}
      className={className}
      action={
        onExportMarkdown ? (
          <button
            className="report-export-button"
            disabled={!report.runId}
            onClick={onExportMarkdown}
            title={i18n.t("backtest.exportMarkdown")}
            type="button"
          >
            <Download size={13} />
            <span>{i18n.t("backtest.exportMarkdown")}</span>
          </button>
        ) : undefined
      }
    >
      <div className="backtest-report">
        <div className="backtest-report-hero" data-status={report.status}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "审计回测报告" : "Audited Backtest Report"}</span>
            <strong>{backtestReportHeadline(i18n, report)}</strong>
            <p>{backtestReportSummary(i18n, report)}</p>
          </div>
          <em>{report.runId ?? (i18n.locale === "zh-CN" ? "等待运行编号" : "No run id")}</em>
        </div>

        <div className="backtest-benchmark-strip" data-tone={report.benchmark.tone}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "基准对比" : "Benchmark comparison"}</span>
            <strong>{backtestBenchmarkLabel(i18n, report.benchmark.label)}</strong>
            <p>{backtestBenchmarkDetail(i18n, report.benchmark.detail)}</p>
          </div>
          <dl>
            <div>
              <dt>{i18n.locale === "zh-CN" ? "策略" : "Strategy"}</dt>
              <dd>{report.benchmark.strategyReturn}</dd>
            </div>
            <div>
              <dt>{i18n.locale === "zh-CN" ? "持有" : "Hold"}</dt>
              <dd>{backtestBenchmarkValue(i18n, report.benchmark.benchmarkReturn)}</dd>
            </div>
            <div>
              <dt>Alpha</dt>
              <dd>{report.benchmark.alpha}</dd>
            </div>
          </dl>
        </div>

        <div className="backtest-report-grid">
          {report.metrics.map((metric) => (
            <article className={metric.tone} key={metric.label}>
              <span>{i18n.metricLabel(metric.label)}</span>
              <strong>{metric.value}</strong>
              <p>{i18n.locale === "zh-CN" ? "来自当前审计回测。" : "From the current audited backtest."}</p>
            </article>
          ))}
          <article className={report.aiReviewReady ? "positive" : "risk"}>
            <span>{i18n.locale === "zh-CN" ? "AI 评审准备" : "AI review readiness"}</span>
            <strong>{report.aiReviewReady ? (i18n.locale === "zh-CN" ? "已就绪" : "Ready") : i18n.locale === "zh-CN" ? "阻断" : "Blocked"}</strong>
            <p>{i18n.locale === "zh-CN" ? "AI 只能引用这份已审计报告。" : "AI may cite only this audited report."}</p>
          </article>
          <article className={report.executionReady ? "positive" : "warning"}>
            <span>{i18n.locale === "zh-CN" ? "执行交接" : "Execution handoff"}</span>
            <strong>{report.executionReady ? (i18n.locale === "zh-CN" ? "可交接" : "Ready") : i18n.locale === "zh-CN" ? "需复核" : "Review"}</strong>
            <p>{i18n.locale === "zh-CN" ? "实盘仍必须通过后续闸门。" : "Live trading still requires downstream gates."}</p>
          </article>
        </div>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "运行对比矩阵" : "Run comparison matrix"}</span>
            <strong>{runComparisonMatrixRows.length}</strong>
          </div>
          {runComparisonMatrixSummary ? (
            <div className="backtest-run-comparison-summary" data-tone={runComparisonMatrixSummary.tone}>
              <article>
                <span>{i18n.locale === "zh-CN" ? "同类上下文" : "Comparable context"}</span>
                <strong>{runComparisonMatrixSummary.context}</strong>
                <p>{backtestRunComparisonSummaryDetail(i18n, runComparisonMatrixSummary)}</p>
              </article>
              <article>
                <span>{i18n.locale === "zh-CN" ? "当前运行" : "Current run"}</span>
                <strong>{currentComparisonRow?.runId ?? "N/A"}</strong>
                <p>{currentComparisonRow ? `${currentComparisonRow.returnPct} · ${currentComparisonRow.maxDrawdownPct}` : "N/A"}</p>
              </article>
              <article>
                <span>{i18n.locale === "zh-CN" ? "最佳收益" : "Best return"}</span>
                <strong>{bestReturnComparisonRow?.runId ?? "N/A"}</strong>
                <p>{bestReturnComparisonRow ? `${bestReturnComparisonRow.returnPct} · DD ${bestReturnComparisonRow.maxDrawdownPct}` : "N/A"}</p>
              </article>
              <article>
                <span>{i18n.locale === "zh-CN" ? "最低回撤" : "Lowest drawdown"}</span>
                <strong>{lowestDrawdownComparisonRow?.runId ?? "N/A"}</strong>
                <p>{lowestDrawdownComparisonRow ? `${lowestDrawdownComparisonRow.maxDrawdownPct} · ${lowestDrawdownComparisonRow.returnPct}` : "N/A"}</p>
              </article>
            </div>
          ) : null}
          <div className="backtest-run-comparison-toolbar">
            <label>
              <Search size={13} />
              <input
                aria-label={i18n.locale === "zh-CN" ? "搜索运行对比矩阵" : "Search run comparison matrix"}
                onChange={(event) => setRunComparisonMatrixQuery(event.currentTarget.value)}
                placeholder={i18n.locale === "zh-CN" ? "搜索运行、版本、标签或质量状态" : "Search run, revision, badge, or quality"}
                type="search"
                value={runComparisonMatrixQuery}
              />
            </label>
            <span>
              {i18n.locale === "zh-CN"
                ? `显示 ${filteredRunComparisonMatrixRows.length}/${runComparisonMatrixRows.length}`
                : `${filteredRunComparisonMatrixRows.length}/${runComparisonMatrixRows.length} shown`}
            </span>
          </div>
          <div className="backtest-run-comparison-matrix">
            <div className="backtest-run-comparison-row backtest-run-comparison-head">
              <span>{i18n.locale === "zh-CN" ? "运行" : "Run"}</span>
              <span>{i18n.locale === "zh-CN" ? "标签" : "Badges"}</span>
              <span>{i18n.metricLabel("Return")}</span>
              <span>{i18n.metricLabel("Max DD")}</span>
              <span>{i18n.metricLabel("Win rate")}</span>
              <span>{i18n.metricLabel("Trades")}</span>
              <span>{i18n.locale === "zh-CN" ? "数据质量" : "Data quality"}</span>
              <span>{i18n.locale === "zh-CN" ? "假设" : "Assumptions"}</span>
            </div>
            {filteredRunComparisonMatrixRows.length ? (
              filteredRunComparisonMatrixRows.map((row) => (
                <article className="backtest-run-comparison-row" data-tone={row.tone} key={row.id}>
                  <span>
                    <strong>{row.runId}</strong>
                    <em>{row.strategyName} · {row.strategyRevision}</em>
                  </span>
                  <span className="backtest-run-comparison-badges">
                    {row.badges.map((badge) => (
                      <b key={badge}>{backtestRunComparisonBadgeLabel(i18n, badge)}</b>
                    ))}
                  </span>
                  <span>{row.returnPct}</span>
                  <span>{row.maxDrawdownPct}</span>
                  <span>{row.winRatePct}</span>
                  <span>{row.tradeCount}</span>
                  <span>{row.dataQualityLabel}</span>
                  <span>{row.assumptions}</span>
                </article>
              ))
            ) : (
              <article className="backtest-run-comparison-row" data-tone="neutral">
                <span>
                  {i18n.locale === "zh-CN"
                    ? "没有匹配的同上下文审计运行。"
                    : "No comparable audited runs match the filter."}
                </span>
              </article>
            )}
          </div>
          {previousComparisonRow ? (
            <p className="backtest-run-comparison-note">
              {i18n.locale === "zh-CN"
                ? `上一轮可比运行：${previousComparisonRow.runId}。矩阵仅用于复盘历史证据，不构成投资建议。`
                : `Previous comparable run: ${previousComparisonRow.runId}. Matrix is historical evidence only, not investment advice.`}
            </p>
          ) : null}
        </section>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "证据包" : "Evidence package"}</span>
            <strong>{reportCards.length}</strong>
          </div>
          <div className="backtest-evidence-grid">
            {reportCards.map((card) => (
              <article className={card.tone} key={card.id}>
                <span>{backtestEvidenceLabel(i18n, card)}</span>
                <strong>{backtestEvidenceValue(i18n, card)}</strong>
                <p>{backtestEvidenceDetail(i18n, card)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "准备闸门" : "Readiness gates"}</span>
            <strong>{readinessGates.length}</strong>
          </div>
          <div className="backtest-readiness-list">
            {readinessGates.map((gate) => (
              <article className={gate.tone} key={gate.id}>
                <span>{backtestGateLabel(i18n, gate)}</span>
                <strong>{backtestGateStatusLabel(i18n, gate.status)}</strong>
                <p>{backtestGateDetail(i18n, gate.detail)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="backtest-report-section">
          <div className="backtest-replay-title">
            <span>{i18n.locale === "zh-CN" ? "权益与诊断" : "Equity and diagnostics"}</span>
            <strong>{report.equityPointCount} / {report.diagnosticCount}</strong>
          </div>
          <div className="backtest-report-grid compact">
            <article className="neutral">
              <span>{i18n.locale === "zh-CN" ? "权益起点" : "Equity start"}</span>
              <strong>{equityStart === null ? "N/A" : equityStart.toLocaleString("en-US")}</strong>
              <p>{report.equityCurve[0]?.timestamp ?? (i18n.locale === "zh-CN" ? "等待权益曲线" : "Pending equity curve")}</p>
            </article>
            <article className={equityEnd !== null && equityStart !== null && equityEnd >= equityStart ? "positive" : "warning"}>
              <span>{i18n.locale === "zh-CN" ? "权益终点" : "Equity end"}</span>
              <strong>{equityEnd === null ? "N/A" : equityEnd.toLocaleString("en-US")}</strong>
              <p>{report.equityCurve.at(-1)?.timestamp ?? (i18n.locale === "zh-CN" ? "等待权益曲线" : "Pending equity curve")}</p>
            </article>
          </div>
          {diagnosticCard ? (
            <div className="backtest-diagnostic-strip" data-tone={diagnosticCard.tone}>
              <span>{backtestEvidenceLabel(i18n, diagnosticCard)}</span>
              <strong>{backtestEvidenceValue(i18n, diagnosticCard)}</strong>
              <p>{backtestEvidenceDetail(i18n, diagnosticCard)}</p>
            </div>
          ) : null}
          {diagnostics.length ? (
            <div className="backtest-diagnostic-list">
              {diagnostics.map((diagnostic) => (
                <article className={diagnostic.tone} key={diagnostic.id}>
                  <span>{diagnostic.label}</span>
                  <strong>{diagnostic.value}</strong>
                  <p>{diagnostic.detail}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <div className="backtest-assumptions">
          <div className="backtest-replay-title">
            <span>{i18n.t("backtest.assumptions")}</span>
            <strong>{report.assumptionRows.length}</strong>
          </div>
          <div className="backtest-assumption-grid">
            {assumptionRows.map((row) => (
              <label key={row.field}>
                <span>{backtestAssumptionLabel(i18n, row.field, row.label)}</span>
                <div className="assumption-input">
                  <input
                    min={row.min}
                    onChange={(event) => onUpdateAssumption(row.field, Number(event.currentTarget.value))}
                    step={row.step}
                    type="number"
                    value={row.value}
                  />
                  <em>{backtestAssumptionSuffixLabel(i18n, row.suffix)}</em>
                </div>
              </label>
            ))}
          </div>
        </div>

        <section className="backtest-report-section parameter-scan-section">
          <div className="backtest-replay-title">
            <span>{i18n.t("backtest.parameterScan")}</span>
            <strong>{parameterScanRows.length}</strong>
          </div>
          {parameterScanRows.length ? (
            <>
              {parameterScanSummary ? (
                <div className="parameter-scan-summary" data-tone={parameterScanSummary.tone}>
                  <article>
                    <span>{i18n.locale === "zh-CN" ? "当前排名" : "Current rank"}</span>
                    <strong>
                      {parameterScanSummary.currentRank
                        ? `${parameterScanSummary.currentRank}/${parameterScanSummary.totalRows}`
                        : "N/A"}
                    </strong>
                    <p>{parameterScanSummary.currentCondition ?? (i18n.locale === "zh-CN" ? "等待当前参数" : "Waiting for current row")}</p>
                  </article>
                  <article>
                    <span>{i18n.locale === "zh-CN" ? "复审候选" : "Re-audit candidate"}</span>
                    <strong>{parameterScanSummary.bestCandidateCondition ?? "N/A"}</strong>
                    <p>
                      {parameterScanSummary.bestCandidateReturnPct} · {parameterScanSummary.bestCandidateDelta} ·{" "}
                      {parameterScanSummary.bestCandidateMaxDrawdownPct}
                    </p>
                  </article>
                  <article>
                    <span>{i18n.locale === "zh-CN" ? "候选分布" : "Candidate mix"}</span>
                    <strong>
                      {parameterScanSummary.candidateCount} / {parameterScanSummary.totalRows}
                    </strong>
                    <p>
                      {i18n.locale === "zh-CN"
                        ? `${parameterScanSummary.positiveCount} 个正向，${parameterScanSummary.riskCount} 个回撤风险`
                        : `${parameterScanSummary.positiveCount} positive, ${parameterScanSummary.riskCount} drawdown-risk`}
                    </p>
                  </article>
                </div>
              ) : null}
              <div className="parameter-scan-table">
                <div className="parameter-scan-row parameter-scan-head">
                  <span>{i18n.t("strategy.condition")}</span>
                  <span>{i18n.metricLabel("Return")}</span>
                  <span>{i18n.metricLabel("Max DD")}</span>
                  <span>{i18n.metricLabel("Trades")}</span>
                  <span>{i18n.locale === "zh-CN" ? "较当前" : "Delta"}</span>
                  <span>{i18n.t("execution.status")}</span>
                  <span>{i18n.locale === "zh-CN" ? "动作" : "Action"}</span>
                </div>
                {parameterScanRows.map((row) => (
                  <article className={`parameter-scan-row ${row.tone}`} key={row.id}>
                    <span>{row.condition}</span>
                    <span>{row.returnPct}</span>
                    <span>{row.maxDrawdownPct}</span>
                    <span>{row.tradeCount}</span>
                    <span>{row.alphaVsCurrent}</span>
                    <span>{parameterScanStatusLabel(i18n, row.status)}</span>
                    <button
                      disabled={row.status === "current"}
                      onClick={() => onStageParameterCandidate(row.id)}
                      type="button"
                    >
                      {i18n.t("backtest.stageCandidate")}
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="parameter-scan-empty">
              {i18n.locale === "zh-CN"
                ? "运行流水线并绑定审计 K 线后，才会生成参数敏感性扫描。"
                : "Run Pipeline with an audited K-line snapshot to generate parameter sensitivity."}
            </div>
          )}
        </section>

        <div className="backtest-replay-title">
          <span>{i18n.t("backtest.replay")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="backtest-table">
          <div className="backtest-row backtest-head">
            <span>{i18n.t("backtest.time")}</span>
            <span>{i18n.t("execution.side")}</span>
            <span>{i18n.t("execution.status")}</span>
            <span>{i18n.t("execution.price")}</span>
            <span>{i18n.t("execution.quantity")}</span>
            <span>{i18n.t("backtest.exposure")}</span>
            <span>{i18n.t("backtest.pnl")}</span>
            <span>{i18n.t("execution.reason")}</span>
          </div>
          {rows.map((row) => (
            <article className={`backtest-row ${row.tone}`} key={row.id}>
              <span>{row.timestamp}</span>
              <span>{backtestSideLabel(i18n, row.side)}</span>
              <span>{backtestStatusLabel(i18n, row.status)}</span>
              <span>{row.price}</span>
              <span>{row.quantity}</span>
              <span>{backtestExposureLabel(i18n, row.exposure)}</span>
              <span>{row.pnl}</span>
              <span>{i18n.strategyText(row.reason)}</span>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function MarketCalendarStatusCard({
  calendar,
  className,
  error,
  i18n,
  source
}: {
  calendar?: MarketCalendarStatus;
  className?: string;
  error?: string;
  i18n: AppI18n;
  source: "core" | "fallback";
}) {
  const status = calendar?.status ?? "unknown";
  const warningCount = calendar?.warnings.length ?? 0;
  const nextEvent = marketCalendarNextEventLabel(i18n, calendar);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "交易日历" : "Market Calendar"}
      subtitle={calendar ? `${i18n.marketLabel(calendar.market)} · ${calendar.timezone}` : source}
      className={`market-calendar-card ${status} ${className ?? ""}`}
    >
      <div className="market-calendar-head">
        <span>{i18n.locale === "zh-CN" ? "当前市场状态" : "Current session"}</span>
        <strong>{marketCalendarStatusLabel(i18n, status)}</strong>
        <em>{calendar?.session ?? "unknown"}</em>
      </div>
      <div className="market-calendar-grid">
        <article>
          <span>{i18n.locale === "zh-CN" ? "交易日" : "Trading day"}</span>
          <strong>{calendar?.tradingDay || "n/a"}</strong>
          <small>{calendar?.asOf || (i18n.locale === "zh-CN" ? "等待本地核心" : "Awaiting local core")}</small>
        </article>
        <article>
          <span>{i18n.locale === "zh-CN" ? "下一事件" : "Next event"}</span>
          <strong>{nextEvent.value}</strong>
          <small>{nextEvent.label}</small>
        </article>
        <article>
          <span>{i18n.locale === "zh-CN" ? "日历来源" : "Calendar source"}</span>
          <strong>{calendar?.source ?? source}</strong>
          <small>{source === "core" ? (i18n.locale === "zh-CN" ? "本地核心" : "Local core") : error ?? "fallback"}</small>
        </article>
        <article>
          <span>{i18n.locale === "zh-CN" ? "限制提示" : "Limits"}</span>
          <strong>{warningCount}</strong>
          <small>{calendar?.warnings[0] ?? (i18n.locale === "zh-CN" ? "无额外提示" : "No additional warning")}</small>
        </article>
      </div>
      {calendar?.detail || error ? <p className="market-calendar-detail">{calendar?.detail ?? error}</p> : null}
    </Panel>
  );
}

function marketCalendarStatusLabel(i18n: AppI18n, status: MarketCalendarStatus["status"] | "unknown"): string {
  const labels: Record<string, { zh: string; en: string }> = {
    open: { zh: "开市", en: "Open" },
    closed: { zh: "休市", en: "Closed" },
    break: { zh: "盘中休市", en: "Break" },
    always_open: { zh: "连续交易", en: "Always open" },
    unknown: { zh: "未知", en: "Unknown" }
  };
  const label = labels[status] ?? labels.unknown;
  return i18n.locale === "zh-CN" ? label.zh : label.en;
}

function marketCalendarNextEventLabel(
  i18n: AppI18n,
  calendar: MarketCalendarStatus | undefined
): { label: string; value: string } {
  if (!calendar) {
    return {
      label: i18n.locale === "zh-CN" ? "等待日历状态" : "Awaiting calendar status",
      value: "n/a"
    };
  }
  if (calendar.nextClose) {
    return {
      label: i18n.locale === "zh-CN" ? "下一次收盘" : "Next close",
      value: calendar.nextClose
    };
  }
  if (calendar.nextOpen) {
    return {
      label: i18n.locale === "zh-CN" ? "下一次开盘" : "Next open",
      value: calendar.nextOpen
    };
  }
  return {
    label: i18n.locale === "zh-CN" ? "连续交易或无计划事件" : "Continuous or no scheduled event",
    value: calendar.status === "always_open" ? "24/7" : "n/a"
  };
}

function MarketDataRefreshOverrideControl({
  auditStatus = { state: "idle" },
  i18n,
  onApplyOverride,
  onClearOverride,
  overrideReason,
  refreshGuard
}: {
  auditStatus?: MarketDataRefreshOverrideAuditStatus;
  i18n: AppI18n;
  onApplyOverride?: (reason: string) => void | Promise<void>;
  onClearOverride?: () => void;
  overrideReason?: string | null;
  refreshGuard?: MarketDataRefreshGuard;
}) {
  const [draftReason, setDraftReason] = useState(overrideReason ?? "");
  const isVisible = Boolean(refreshGuard && (refreshGuard.status === "cooldown" || refreshGuard.overrideApplied));
  const normalizedReason = draftReason.trim();

  useEffect(() => {
    setDraftReason(overrideReason ?? "");
  }, [overrideReason, refreshGuard?.status]);

  if (!isVisible || !onApplyOverride) {
    return null;
  }

  return (
    <div className={`market-refresh-override${refreshGuard?.overrideApplied ? " active" : ""}`}>
      <label>
        <span>{i18n.locale === "zh-CN" ? "覆盖原因" : "Override reason"}</span>
        <input
          onChange={(event) => setDraftReason(event.target.value)}
          placeholder={
            i18n.locale === "zh-CN"
              ? "例如：已确认上游恢复，本次手动刷新"
              : "Example: upstream recovered, refresh this run"
          }
          value={draftReason}
        />
      </label>
      <button
        className="market-refresh-override-apply"
        disabled={!normalizedReason || auditStatus.state === "saving"}
        onClick={() => void onApplyOverride(normalizedReason)}
        type="button"
      >
        <ShieldCheck size={13} />
        <span>
          {auditStatus.state === "saving"
            ? i18n.locale === "zh-CN"
              ? "记录中"
              : "Recording"
            : i18n.locale === "zh-CN"
              ? "本次仍刷新"
              : "Manual override"}
        </span>
      </button>
      {refreshGuard?.overrideApplied ? (
        <button className="market-refresh-override-clear" onClick={onClearOverride} type="button">
          {i18n.locale === "zh-CN" ? "取消覆盖" : "Clear"}
        </button>
      ) : null}
      {auditStatus.state !== "idle" ? (
        <p className={`market-refresh-override-audit-status ${auditStatus.state}`}>
          {marketDataRefreshOverrideAuditStatusLabel(i18n, auditStatus)}
        </p>
      ) : null}
    </div>
  );
}

function marketDataRefreshOverrideAuditStatusLabel(
  i18n: AppI18n,
  status: MarketDataRefreshOverrideAuditStatus
): string {
  if (status.state === "saving") {
    return i18n.locale === "zh-CN" ? "覆盖审计写入中，写入成功后才会放行刷新。" : "Recording override audit before refresh is enabled.";
  }
  if (status.state === "saved") {
    return i18n.locale === "zh-CN"
      ? `覆盖审计已记录：${status.eventId}`
      : `Override audit recorded: ${status.eventId}`;
  }
  if (status.state === "failed") {
    return i18n.locale === "zh-CN"
      ? `覆盖审计失败：${status.error}`
      : `Override audit failed: ${status.error}`;
  }
  return "";
}

function MarketDataHealthPanel({
  cacheContext,
  className,
  i18n,
  isRefreshingCache = false,
  isRefreshingWatchlistCache = false,
  latestWatchlistCacheRefresh,
  refreshGuard,
  refreshOverrideAuditStatus,
  refreshOverrideReason,
  onApplyRefreshOverride,
  onClearRefreshOverride,
  onRefreshCache,
  onRefreshWatchlistCache,
  onOpenCoverageResearch,
  onSelectWatchlistCacheRefreshRun,
  onSelectWatchlistCacheRefreshItem,
  state,
  watchlistCacheRefreshCoverageRow,
  watchlistCacheRefreshItemRows = [],
  watchlistCacheRefreshHistoryRows = [],
  watchlistCacheSummary,
  workspace
}: {
  cacheContext?: PlatformSettingsStatus["cache"]["contexts"][number];
  className?: string;
  i18n: AppI18n;
  isRefreshingCache?: boolean;
  isRefreshingWatchlistCache?: boolean;
  latestWatchlistCacheRefresh?: CacheWatchlistRefreshRun | null;
  refreshGuard?: MarketDataRefreshGuard;
  refreshOverrideAuditStatus?: MarketDataRefreshOverrideAuditStatus;
  refreshOverrideReason?: string | null;
  onApplyRefreshOverride?: (reason: string) => void;
  onClearRefreshOverride?: () => void;
  onRefreshCache?: () => void;
  onRefreshWatchlistCache?: () => void;
  onOpenCoverageResearch?: () => void;
  onSelectWatchlistCacheRefreshRun?: (row: WatchlistCacheRefreshHistoryRow) => void;
  onSelectWatchlistCacheRefreshItem?: (row: WatchlistCacheRefreshItemRow) => void;
  state: MarketKlinesResult;
  watchlistCacheRefreshCoverageRow?: WatchlistCacheRefreshCoverageRow | null;
  watchlistCacheRefreshItemRows?: WatchlistCacheRefreshItemRow[];
  watchlistCacheRefreshHistoryRows?: WatchlistCacheRefreshHistoryRow[];
  watchlistCacheSummary: WatchlistCacheSummary;
  workspace: TerminalWorkspace;
}) {
  const warnings = state.quality.warnings.length ? state.quality.warnings : ["No source warnings reported."];
  const freshness = state.quality.isComplete ? "Complete" : "Needs review";
  const cacheRows = cacheContext
    ? i18n.locale === "zh-CN"
      ? cacheContext.rowCount.toLocaleString("zh-CN")
      : cacheContext.rowCount.toLocaleString("en-US")
    : "0";
  const cacheFreshness = cacheContext
    ? cacheFreshnessLabel(i18n, cacheContext.freshness, cacheContext.ageHours)
    : i18n.locale === "zh-CN"
      ? "未缓存当前上下文"
      : "No cache for current context";
  const watchlistTone =
    watchlistCacheSummary.empty > 0 ? "risk" : watchlistCacheSummary.stale > 0 ? "warning" : "positive";
  const watchlistSummaryDetail =
    i18n.locale === "zh-CN"
      ? `${watchlistCacheSummary.fresh} 新鲜 · ${watchlistCacheSummary.stale} 过期 · ${watchlistCacheSummary.empty} 缺失 · ${watchlistCacheSummary.rows.toLocaleString("zh-CN")} 行`
      : `${watchlistCacheSummary.fresh} fresh · ${watchlistCacheSummary.stale} stale · ${watchlistCacheSummary.empty} missing · ${watchlistCacheSummary.rows.toLocaleString("en-US")} rows`;
  const latestRefreshLabel = latestWatchlistCacheRefresh
    ? i18n.locale === "zh-CN"
      ? `${latestWatchlistCacheRefresh.summary.refreshed}/${latestWatchlistCacheRefresh.summary.totalSymbols} 已刷新 · ${latestWatchlistCacheRefresh.summary.failed} 失败`
      : `${latestWatchlistCacheRefresh.summary.refreshed}/${latestWatchlistCacheRefresh.summary.totalSymbols} refreshed · ${latestWatchlistCacheRefresh.summary.failed} failed`
    : i18n.locale === "zh-CN"
      ? "暂无自选刷新记录"
      : "No watchlist refresh run yet";
  const latestRefreshDetail = latestWatchlistCacheRefresh
    ? i18n.locale === "zh-CN"
      ? `${latestWatchlistCacheRefresh.runId} · ${latestWatchlistCacheRefresh.summary.upsertedRows.toLocaleString("zh-CN")} 行入库`
      : `${latestWatchlistCacheRefresh.runId} · ${latestWatchlistCacheRefresh.summary.upsertedRows.toLocaleString("en-US")} rows cached`
    : i18n.locale === "zh-CN"
      ? "批量刷新后会生成可追踪 run。"
      : "Bulk refreshes create a traceable run.";
  const isRefreshBlocked = Boolean(refreshGuard?.blocked);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "数据源健康" : "Data Source Health"}
      subtitle={`${i18n.marketLabel(workspace.selectedInstrument.market)} · ${workspace.selectedInstrument.symbol}`}
      className={className}
      action={
        onRefreshCache || onRefreshWatchlistCache ? (
          <div className="market-cache-actions">
            {onRefreshCache ? (
              <button
                className="market-cache-refresh"
                disabled={isRefreshingCache || isRefreshBlocked}
                onClick={onRefreshCache}
                type="button"
              >
                <RefreshCw size={13} />
                <span>
                  {isRefreshingCache
                    ? i18n.locale === "zh-CN"
                      ? "刷新中"
                      : "Refreshing"
                    : i18n.locale === "zh-CN"
                      ? "刷新当前缓存"
                      : "Refresh current cache"}
                </span>
              </button>
            ) : null}
            {onRefreshWatchlistCache ? (
              <button
                className="market-cache-bulk-refresh"
                disabled={isRefreshingWatchlistCache || !workspace.watchlist.length || isRefreshBlocked}
                onClick={onRefreshWatchlistCache}
                type="button"
              >
                <RefreshCw size={13} />
                <span>
                  {isRefreshingWatchlistCache
                    ? i18n.locale === "zh-CN"
                      ? "刷新自选中"
                      : "Refreshing watchlist"
                    : i18n.locale === "zh-CN"
                      ? "刷新自选缓存"
                      : "Refresh watchlist cache"}
                </span>
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      {refreshGuard?.blocked || refreshGuard?.overrideApplied ? (
        <p className="market-refresh-guard-note">{marketDataRefreshGuardLabel(i18n, refreshGuard)}</p>
      ) : null}
      <MarketDataRefreshOverrideControl
        auditStatus={refreshOverrideAuditStatus}
        i18n={i18n}
        onApplyOverride={onApplyRefreshOverride}
        onClearOverride={onClearRefreshOverride}
        overrideReason={refreshOverrideReason}
        refreshGuard={refreshGuard}
      />
      <div className="health-grid">
        <article className={state.quality.isComplete ? "positive" : "warning"}>
          <span>{i18n.locale === "zh-CN" ? "数据源" : "Source"}</span>
          <strong>{state.quality.source}</strong>
          <p>{i18n.locale === "zh-CN" ? "当前图表和研究流水线共用这个数据上下文。" : "Chart and research pipeline share this data context."}</p>
        </article>
        <article className="neutral">
          <span>{i18n.locale === "zh-CN" ? "数据行数" : "Rows"}</span>
          <strong>{state.quality.rows || state.bars.length}</strong>
          <p>{`${state.timeframe} · ${state.symbol}`}</p>
        </article>
        <article className={state.quality.isComplete ? "positive" : "risk"}>
          <span>{i18n.locale === "zh-CN" ? "质量状态" : "Quality"}</span>
          <strong>{i18n.locale === "zh-CN" ? (state.quality.isComplete ? "完整" : "需复核") : freshness}</strong>
          <p>{warnings[0]}</p>
        </article>
        <article
          className={
            cacheContext?.freshness === "fresh" ? "positive" : cacheContext?.freshness === "stale" ? "warning" : "risk"
          }
        >
          <span>{i18n.locale === "zh-CN" ? "本地缓存" : "Local cache"}</span>
          <strong>{cacheRows}</strong>
          <p>{cacheFreshness}</p>
        </article>
        <article className={watchlistTone}>
          <span>{i18n.locale === "zh-CN" ? "自选缓存" : "Watchlist cache"}</span>
          <strong>{`${watchlistCacheSummary.fresh}/${watchlistCacheSummary.total}`}</strong>
          <p>{watchlistSummaryDetail}</p>
        </article>
        <article className={latestWatchlistCacheRefresh?.summary.failed ? "warning" : "neutral"}>
          <span>{i18n.locale === "zh-CN" ? "最近自选刷新" : "Latest watchlist refresh"}</span>
          <strong>{latestRefreshLabel}</strong>
          <p>{latestRefreshDetail}</p>
        </article>
      </div>
      {watchlistCacheRefreshCoverageRow ? (
        <div className={`watchlist-refresh-coverage ${watchlistCacheRefreshCoverageRow.tone}`}>
          <div>
            <span>{watchlistCacheRefreshCoverageLabel(i18n, watchlistCacheRefreshCoverageRow)}</span>
            <strong>{watchlistCacheRefreshCoverageValue(i18n, watchlistCacheRefreshCoverageRow)}</strong>
            <p>{watchlistCacheRefreshCoverageDetail(i18n, watchlistCacheRefreshCoverageRow)}</p>
          </div>
          {watchlistCacheRefreshCoverageRow.canOpenResearch ? (
            <button onClick={onOpenCoverageResearch} type="button">
              {i18n.locale === "zh-CN" ? "回到研究" : "Open Research"}
            </button>
          ) : null}
        </div>
      ) : null}
      {watchlistCacheRefreshHistoryRows.length ? (
        <div className="watchlist-refresh-history">
          <div className="watchlist-refresh-history-head">
            <span>{i18n.locale === "zh-CN" ? "自选刷新历史" : "Watchlist refresh history"}</span>
            <strong>{watchlistCacheRefreshHistoryRows.length}</strong>
          </div>
          <div className="watchlist-refresh-history-list">
            {watchlistCacheRefreshHistoryRows.map((row) => (
              <button
                aria-pressed={row.selected}
                className={`watchlist-refresh-history-row ${row.tone}${row.selected ? " selected" : ""}`}
                key={row.id}
                onClick={() => onSelectWatchlistCacheRefreshRun?.(row)}
                title={
                  i18n.locale === "zh-CN"
                    ? `查看 ${row.runId} 明细`
                    : `Inspect ${row.runId} details`
                }
                type="button"
              >
                <div>
                  <strong>{watchlistCacheRefreshHistoryValue(i18n, row)}</strong>
                  <span>{row.label}</span>
                </div>
                <p>{watchlistCacheRefreshHistoryDetail(i18n, row)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {watchlistCacheRefreshItemRows.length ? (
        <div className="watchlist-refresh-items">
          <div className="watchlist-refresh-history-head">
            <span>{i18n.locale === "zh-CN" ? "选中运行明细" : "Selected run details"}</span>
            <strong>{watchlistCacheRefreshItemRows.length}</strong>
          </div>
          <div className="watchlist-refresh-item-list">
            {watchlistCacheRefreshItemRows.map((row) => (
              <button
                className={`watchlist-refresh-item-row ${row.tone}`}
                key={row.id}
                onClick={() => onSelectWatchlistCacheRefreshItem?.(row)}
                title={
                  i18n.locale === "zh-CN"
                    ? `切换到 ${row.name} ${row.symbol} ${row.timeframe}`
                    : `Open ${row.name} ${row.symbol} ${row.timeframe}`
                }
                type="button"
              >
                <div>
                  <strong>{row.symbol}</strong>
                  <span>{row.name} · {row.timeframe}</span>
                </div>
                <em>
                  <Search size={13} />
                  {watchlistCacheRefreshItemStatusLabel(i18n, row)}
                </em>
                <p>{watchlistCacheRefreshItemDetail(i18n, row)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function watchlistCacheRefreshHistoryValue(i18n: AppI18n, row: WatchlistCacheRefreshHistoryRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.value;
  }
  return `${row.refreshed}/${row.total} 已刷新`;
}

function watchlistCacheRefreshHistoryDetail(i18n: AppI18n, row: WatchlistCacheRefreshHistoryRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.detail;
  }
  return `${row.upsertedRows.toLocaleString("zh-CN")} 行入库 · ${row.skipped} 跳过 · ${row.failed} 失败`;
}

function watchlistCacheRefreshCoverageLabel(i18n: AppI18n, row: WatchlistCacheRefreshCoverageRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.label;
  }
  return "当前上下文覆盖";
}

function watchlistCacheRefreshCoverageValue(i18n: AppI18n, row: WatchlistCacheRefreshCoverageRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.value;
  }
  if (row.value === "not current context") {
    return "未覆盖当前上下文";
  }
  return row.value
    .replace("covered", "已覆盖")
    .replace("review", "需复核")
    .replace("refreshed", "已刷新")
    .replace("skipped", "已跳过")
    .replace("failed", "失败");
}

function watchlistCacheRefreshCoverageDetail(i18n: AppI18n, row: WatchlistCacheRefreshCoverageRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.detail;
  }
  if (row.value === "not current context") {
    return row.detail
      .replace("Selected run does not include ", "选中的刷新 run 未包含 ")
      .replace("; choose a matching run or refresh the watchlist cache.", "；请选择匹配 run 或刷新自选缓存。");
  }
  return row.detail
    .replace(" covered by ", " 已由 ")
    .replace(" rows cached", " 行入库")
    .replace("refresh skipped", "刷新已跳过")
    .replace("refresh failed", "刷新失败")
    .replace("refresh quality incomplete", "刷新质量不完整")
    .replace("source requires review", "数据源需复核")
    .replace("refresh requires review", "刷新证据需复核");
}

function watchlistCacheRefreshItemStatusLabel(i18n: AppI18n, row: WatchlistCacheRefreshItemRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.statusLabel;
  }
  if (row.status === "refreshed") {
    return "已刷新";
  }
  if (row.status === "skipped") {
    return "已跳过";
  }
  return "失败";
}

function watchlistCacheRefreshItemDetail(i18n: AppI18n, row: WatchlistCacheRefreshItemRow): string {
  if (i18n.locale !== "zh-CN") {
    return `${row.value} · ${row.detail}`;
  }
  const rows = row.upsertedRows.toLocaleString("zh-CN");
  return `${rows} 行入库 · ${row.detail}`;
}

function ResearchContextReadinessPanel({
  className,
  i18n,
  isRefreshingCache = false,
  isRefreshingWatchlistCache = false,
  refreshGuard,
  refreshOverrideAuditStatus,
  refreshOverrideReason,
  isSavingNote = false,
  isSavingWatchlist = false,
  isSavingWorkspace = false,
  onApplyRefreshOverride,
  onClearRefreshOverride,
  onRefreshCache,
  onRefreshWatchlistCache,
  onInspectRefreshEvidence,
  onSaveNote,
  onSaveWatchlist,
  onSaveWorkspace,
  evidenceRows,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isRefreshingCache?: boolean;
  isRefreshingWatchlistCache?: boolean;
  refreshGuard?: MarketDataRefreshGuard;
  refreshOverrideAuditStatus?: MarketDataRefreshOverrideAuditStatus;
  refreshOverrideReason?: string | null;
  isSavingNote?: boolean;
  isSavingWatchlist?: boolean;
  isSavingWorkspace?: boolean;
  onApplyRefreshOverride?: (reason: string) => void;
  onClearRefreshOverride?: () => void;
  onRefreshCache?: () => void;
  onRefreshWatchlistCache?: () => void;
  onInspectRefreshEvidence?: (runId: string) => void;
  onSaveNote?: () => void;
  onSaveWatchlist?: () => void;
  onSaveWorkspace?: () => void;
  evidenceRows: ResearchContextEvidenceRow[];
  rows: ResearchContextReadinessRow[];
}) {
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "研究上下文就绪" : "Research Context Readiness"}
      subtitle={
        i18n.locale === "zh-CN"
          ? "阶段 1 · 标的、自选、K线、缓存、刷新证据、笔记、工作区、审计运行"
          : "Stage 1 · symbol, watchlist, K-lines, cache, refresh evidence, notes, workspace, audited run"
      }
      className={className}
    >
      {refreshGuard?.blocked || refreshGuard?.overrideApplied ? (
        <p className="market-refresh-guard-note">{marketDataRefreshGuardLabel(i18n, refreshGuard)}</p>
      ) : null}
      <MarketDataRefreshOverrideControl
        auditStatus={refreshOverrideAuditStatus}
        i18n={i18n}
        onApplyOverride={onApplyRefreshOverride}
        onClearOverride={onClearRefreshOverride}
        overrideReason={refreshOverrideReason}
        refreshGuard={refreshGuard}
      />
      <div className="research-context-checklist">
        {rows.map((row, index) => {
          const action = row.action;
          const refreshEvidenceRunId = row.id === "refresh" ? row.evidenceRunId : undefined;
          return (
            <article className={`research-context-row ${row.tone}`} key={row.id}>
              <span className="research-context-index">{index + 1}</span>
              <div>
                <strong>
                  {researchContextReadinessLabel(i18n, row)}
                  <span>{researchContextReadinessValue(i18n, row)}</span>
                </strong>
                <p>{researchContextReadinessDetail(i18n, row)}</p>
              </div>
              <div className="research-context-actions">
                <em>{researchContextReadinessStatusLabel(i18n, row.status)}</em>
                {refreshEvidenceRunId ? (
                  <button onClick={() => onInspectRefreshEvidence?.(refreshEvidenceRunId)} type="button">
                    {i18n.locale === "zh-CN" ? "查看明细" : "Details"}
                  </button>
                ) : null}
                {action ? (
                  <button
                    disabled={isResearchContextActionDisabled(
                      action,
                      isRefreshingCache,
                      isRefreshingWatchlistCache,
                      Boolean(refreshGuard?.blocked),
                      isSavingNote,
                      isSavingWatchlist,
                      isSavingWorkspace
                    )}
                    onClick={() =>
                      runResearchContextReadinessAction(
                        action,
                        onRefreshCache,
                        onRefreshWatchlistCache,
                        onSaveNote,
                        onSaveWatchlist,
                        onSaveWorkspace
                      )
                    }
                    type="button"
                  >
                    {researchContextReadinessActionLabel(
                      i18n,
                      action,
                      isRefreshingCache,
                      isRefreshingWatchlistCache,
                      Boolean(refreshGuard?.blocked),
                      isSavingNote,
                      isSavingWatchlist,
                      isSavingWorkspace
                    )}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        {evidenceRows.map((row, index) => (
          <article className={`research-context-row ${row.tone}`} key={row.id}>
            <span className="research-context-index">{rows.length + index + 1}</span>
            <div>
              <strong>
                {researchContextEvidenceLabel(i18n, row)}
                <span>{researchContextEvidenceValue(i18n, row)}</span>
              </strong>
              <p>{researchContextEvidenceDetail(i18n, row)}</p>
            </div>
            <div className="research-context-actions">
              <em>{researchContextReadinessStatusLabel(i18n, row.status)}</em>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function researchContextReadinessActionLabel(
  i18n: AppI18n,
  action: NonNullable<ResearchContextReadinessRow["action"]>,
  isRefreshingCache: boolean,
  isRefreshingWatchlistCache: boolean,
  isRefreshGuardBlocked: boolean,
  isSavingNote: boolean,
  isSavingWatchlist: boolean,
  isSavingWorkspace: boolean
): string {
  if (action === "refresh-cache") {
    if (isRefreshGuardBlocked) {
      return i18n.locale === "zh-CN" ? "冷却中" : "Cooldown";
    }
    if (isRefreshingCache) {
      return i18n.locale === "zh-CN" ? "刷新中" : "Refreshing";
    }
    return i18n.locale === "zh-CN" ? "刷新缓存" : "Refresh cache";
  }
  if (action === "refresh-watchlist-cache") {
    if (isRefreshGuardBlocked) {
      return i18n.locale === "zh-CN" ? "冷却中" : "Cooldown";
    }
    if (isRefreshingWatchlistCache) {
      return i18n.locale === "zh-CN" ? "刷新中" : "Refreshing";
    }
    return i18n.locale === "zh-CN" ? "刷新自选缓存" : "Refresh watchlist";
  }
  if (action === "save-workspace") {
    if (isSavingWorkspace) {
      return i18n.locale === "zh-CN" ? "保存中" : "Saving";
    }
    return i18n.locale === "zh-CN" ? "保存工作区" : "Save workspace";
  }
  if (action === "save-watchlist") {
    if (isSavingWatchlist) {
      return i18n.locale === "zh-CN" ? "保存中" : "Saving";
    }
    return i18n.locale === "zh-CN" ? "保存自选" : "Save watchlist";
  }
  if (isSavingNote) {
    return i18n.locale === "zh-CN" ? "保存中" : "Saving";
  }
  return i18n.locale === "zh-CN" ? "保存笔记" : "Save note";
}

function isResearchContextActionDisabled(
  action: NonNullable<ResearchContextReadinessRow["action"]>,
  isRefreshingCache: boolean,
  isRefreshingWatchlistCache: boolean,
  isRefreshGuardBlocked: boolean,
  isSavingNote: boolean,
  isSavingWatchlist: boolean,
  isSavingWorkspace: boolean
): boolean {
  if (action === "refresh-cache") {
    return isRefreshingCache || isRefreshGuardBlocked;
  }
  if (action === "refresh-watchlist-cache") {
    return isRefreshingWatchlistCache || isRefreshGuardBlocked;
  }
  if (action === "save-workspace") {
    return isSavingWorkspace;
  }
  if (action === "save-watchlist") {
    return isSavingWatchlist;
  }
  return isSavingNote;
}

function runResearchContextReadinessAction(
  action: NonNullable<ResearchContextReadinessRow["action"]>,
  onRefreshCache?: () => void,
  onRefreshWatchlistCache?: () => void,
  onSaveNote?: () => void,
  onSaveWatchlist?: () => void,
  onSaveWorkspace?: () => void
): void {
  if (action === "refresh-cache") {
    onRefreshCache?.();
    return;
  }
  if (action === "refresh-watchlist-cache") {
    onRefreshWatchlistCache?.();
    return;
  }
  if (action === "save-workspace") {
    onSaveWorkspace?.();
    return;
  }
  if (action === "save-watchlist") {
    onSaveWatchlist?.();
    return;
  }
  onSaveNote?.();
}

function researchContextReadinessLabel(i18n: AppI18n, row: ResearchContextReadinessRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.label;
  }
  const labels: Record<ResearchContextReadinessRow["id"], string> = {
    instrument: "标的",
    watchlist: "自选状态",
    calendar: "交易日历",
    klines: "K线数据",
    cache: "本地缓存",
    refresh: "刷新证据",
    note: "研究笔记",
    workspace: "工作区状态"
  };
  return labels[row.id];
}

function researchContextReadinessValue(i18n: AppI18n, row: ResearchContextReadinessRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.value;
  }
  if (row.id === "klines") {
    return row.value.replace(" bars", " 根K线");
  }
  if (row.id === "cache") {
    return row.value
      .replace("fresh", "新鲜")
      .replace("stale", "过期")
      .replace("empty", "空")
      .replace("missing", "缺失")
      .replace(" rows", " 行");
  }
  if (row.id === "refresh") {
    if (row.value === "no matching refresh") {
      return "无匹配刷新";
    }
    return row.value
      .replace("refreshed", "已刷新")
      .replace("skipped", "已跳过")
      .replace("failed", "失败");
  }
  if (row.id === "note") {
    if (row.value === "saved") {
      return "已保存";
    }
    if (row.value === "unsaved changes") {
      return "未保存更改";
    }
    if (row.value === "draft not saved") {
      return "草稿未保存";
    }
    return "未保存";
  }
  if (row.id === "workspace") {
    if (row.value === "saved") {
      return "已保存";
    }
    if (row.value === "unsaved changes") {
      return "未保存更改";
    }
    return "未保存";
  }
  if (row.id === "watchlist") {
    return row.value === "saved" ? "已保存" : "未保存更改";
  }
  if (row.id === "calendar") {
    return row.value
      .replace("always_open", "连续交易")
      .replace("open", "开市")
      .replace("closed", "休市")
      .replace("break", "盘中休市")
      .replace("unknown", "未知");
  }
  return row.value;
}

function researchContextReadinessStatusLabel(
  i18n: AppI18n,
  status: ResearchContextReadinessRow["status"] | ResearchContextEvidenceRow["status"]
): string {
  if (i18n.locale !== "zh-CN") {
    return status === "ready" ? "Ready" : status === "review" ? "Review" : "Blocked";
  }
  return status === "ready" ? "就绪" : status === "review" ? "复核" : "阻断";
}

function researchContextEvidenceLabel(i18n: AppI18n, row: ResearchContextEvidenceRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.label;
  }
  return "审计运行";
}

function researchContextEvidenceValue(i18n: AppI18n, row: ResearchContextEvidenceRow): string {
  if (i18n.locale !== "zh-CN" || row.value !== "no audited run") {
    return row.value;
  }
  return "无审计运行";
}

function researchContextEvidenceDetail(i18n: AppI18n, row: ResearchContextEvidenceRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.detail;
  }
  if (row.detail === "Run Pipeline to bind a matching audited research run.") {
    return "运行流水线以绑定匹配当前上下文的审计运行。";
  }
  const matched = row.detail.match(/^Audited run (.+) matches the selected research context\.$/);
  if (matched) {
    return `审计运行 ${matched[1]} 匹配当前研究上下文。`;
  }
  const mismatched = row.detail.match(/^Audited run (.+) belongs to (.+), not (.+)\.$/);
  if (mismatched) {
    return `审计运行 ${mismatched[1]} 属于 ${mismatched[2]}，而不是 ${mismatched[3]}。`;
  }
  return row.detail;
}

function researchPipelinePreflightStatusLabel(i18n: AppI18n, preflight: ResearchPipelinePreflight): string {
  if (preflight.status === "ready") {
    return i18n.locale === "zh-CN" ? "研究上下文已就绪，可以运行流水线。" : preflight.summary;
  }
  if (preflight.status === "review") {
    return i18n.locale === "zh-CN"
      ? `研究上下文有 ${preflight.issues.length} 项需复核，运行前需要确认。`
      : preflight.summary;
  }
  return i18n.locale === "zh-CN"
    ? `研究上下文有 ${preflight.issues.filter((issue) => issue.status === "blocked").length} 项阻断，先修复后再运行流水线。`
    : preflight.summary;
}

function researchPipelinePreflightIssueDetail(i18n: AppI18n, preflight: ResearchPipelinePreflight): string {
  const issueSummary = preflight.issues
    .slice(0, 3)
    .map((issue) => `${researchPipelinePreflightIssueLabel(i18n, issue)}: ${issue.value}`)
    .join(" · ");
  const summary = researchPipelinePreflightStatusLabel(i18n, preflight);
  return issueSummary ? `${summary} ${issueSummary}` : summary;
}

function goldenPathActionPreflightHint(
  i18n: AppI18n,
  actionId: string | null | undefined,
  preflight: ResearchPipelinePreflight
): string | null {
  if (actionId !== "run-pipeline" || preflight.status === "ready") {
    return null;
  }
  return researchPipelinePreflightIssueDetail(i18n, preflight);
}

function researchPipelinePreflightConfirmMessage(i18n: AppI18n, preflight: ResearchPipelinePreflight): string {
  const issues = preflight.issues
    .map((issue) => `- ${researchPipelinePreflightIssueLabel(i18n, issue)}: ${issue.value}`)
    .join("\n");
  if (i18n.locale === "zh-CN") {
    return `研究上下文仍有 ${preflight.issues.length} 项需复核：\n${issues}\n\n仍然运行审计流水线吗？`;
  }
  return `${preflight.summary}\n${issues}\n\nRun the audited pipeline anyway?`;
}

function researchPipelinePreflightIssueLabel(
  i18n: AppI18n,
  issue: ResearchPipelinePreflight["issues"][number]
): string {
  const labels: Record<ResearchContextReadinessRow["id"], string> = {
    instrument: "当前标的",
    watchlist: "自选状态",
    calendar: "交易日历",
    klines: "K线数据",
    cache: "本地缓存",
    refresh: "刷新证据",
    note: "研究笔记",
    workspace: "工作区状态"
  };
  return i18n.locale === "zh-CN" ? labels[issue.id] : issue.label;
}

function researchContextReadinessDetail(i18n: AppI18n, row: ResearchContextReadinessRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.detail;
  }
  if (
    row.detail ===
    "No current-timeframe cache coverage yet. Use search suggestion refresh or refresh current cache before audited research."
  ) {
    return "当前周期还没有缓存覆盖。请在搜索建议中刷新缓存，或刷新当前缓存后再运行审计研究。";
  }
  if (row.detail === "Save a note to bind the research hypothesis to this symbol and timeframe.") {
    return "保存笔记，把研究假设绑定到当前标的和周期。";
  }
  if (row.id === "cache") {
    return row.detail
      .replace("Ready for audited research", "可运行审计研究")
      .replace("Latest cache", "最新缓存")
      .replace("Cache is stale.", "缓存已过期。")
      .replace("Cache is empty.", "缓存为空。")
      .replace(
        "Refresh from search suggestions or current cache before audited research",
        "请从搜索建议或当前缓存入口刷新后再运行审计研究"
      )
      .replace("latest timestamp unknown", "最新时间未知")
      .replace("age unknown", "缓存年龄未知")
      .replace("h old", " 小时前")
      .replace("latest", "最新");
  }
  if (row.id === "workspace") {
    return row.detail
      .replace(/^Saved /, "已保存 ")
      .replace("time unknown", "时间未知")
      .replace("research entry", "研究入口")
      .replace("market entry", "行情入口")
      .replace(/^Save /, "保存 ")
      .replace(" before relying on this workspace context.", " 后再信任这个工作区上下文。")
      .replace(" · research", " · 研究入口")
      .replace(" · market", " · 行情入口");
  }
  if (row.id === "watchlist") {
    return row.detail
      .replace(/^Save /, "保存 ")
      .replace(" watched symbols before relying on this research context.", " 个自选标的后再信任这个研究上下文。")
      .replace(" watched symbols are persisted for local research.", " 个自选标的已为本地研究持久化。");
  }
  if (row.id === "refresh") {
    return row.detail
      .replace(/^Run watchlist cache refresh for /, "为 ")
      .replace(" before relying on this context.", " 运行自选缓存刷新后再信任当前上下文。")
      .replace(" rows cached", " 行已缓存")
      .replace("refresh skipped", "刷新已跳过")
      .replace("refresh failed", "刷新失败")
      .replace("refresh quality incomplete", "刷新质量不完整")
      .replace("source requires review", "来源需复核")
      .replace("refresh requires review", "刷新需复核");
  }
  if (row.id === "calendar") {
    return row.detail
      .replace("next close", "下一次收盘")
      .replace("next open", "下一次开盘")
      .replace("continuous trading", "连续交易")
      .replace("no scheduled event", "无计划事件")
      .replace("Static session template only; exchange holiday calendar is not configured.", "仅静态时段模板；未配置交易所节假日历。")
      .replace("static-session-template", "静态时段模板");
  }
  return row.detail
    .replace("Draft not saved", "草稿未保存")
    .replace("Unsaved changes since", "自上次保存后有未保存更改")
    .replace("Saved", "已保存")
    .replace("source requires review", "来源需复核")
    .replace("complete", "完整")
    .replace("review", "需复核")
    .replace("watched", "个自选")
    .replace("Latest cache", "最新缓存")
    .replace("latest timestamp unknown", "最新时间未知")
    .replace("age unknown", "缓存年龄未知")
    .replace("h old", " 小时前")
    .replace("Cache is stale", "缓存已过期")
    .replace("latest", "最新");
}

function ResearchNotesPanel({
  className,
  draft,
  i18n,
  isSaving,
  note,
  onChange,
  onSave,
  workspace
}: {
  className?: string;
  draft: string;
  i18n: AppI18n;
  isSaving: boolean;
  note: ResearchNoteResult;
  onChange: (value: string) => void;
  onSave: () => void;
  workspace: TerminalWorkspace;
}) {
  const updatedAt = note.note?.updatedAt
    ? new Date(note.note.updatedAt).toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")
    : null;
  const statusText = note.source === "core"
    ? updatedAt ?? (i18n.locale === "zh-CN" ? "尚未保存" : "Not saved yet")
    : note.error ?? (i18n.locale === "zh-CN" ? "本地核心不可用" : "Core unavailable");

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "研究笔记" : "Research Notes"}
      subtitle={`${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`}
      className={className}
    >
      <div className="research-note-editor">
        <textarea
          aria-label={i18n.locale === "zh-CN" ? "研究笔记" : "Research note"}
          maxLength={20000}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            i18n.locale === "zh-CN"
              ? "记录这个标的、周期、数据质量、观察假设或后续验证点。"
              : "Capture thesis, data quality, observations, or follow-up checks for this context."
          }
          value={draft}
        />
        <div className="research-note-meta">
          <span>{statusText}</span>
          <button disabled={isSaving} onClick={onSave} type="button">
            {isSaving ? (i18n.locale === "zh-CN" ? "保存中" : "Saving") : i18n.locale === "zh-CN" ? "保存笔记" : "Save note"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function PlatformSettingsPanel({
  adapterCertificationApplyConfirmations,
  adapterCertificationApplyRows,
  adapterCertificationRows,
  adapterHealthProbeRows,
  adapterRows,
  adapterLedgerRows,
  applyingAdapterCertificationId,
  className,
  i18n,
  isRefreshingAdapterHealthProbe,
  onApplyAdapterCertification,
  onApplyConfirmationChange,
  onHumanConfirmationChange,
  onOrchestrationDryRunConfirmationChange,
  onOrchestrationExecutionConfirmationChange,
  onSandboxProbeExecutionConfirmationChange,
  onSandboxProbePlanConfirmationChange,
  onSandboxProbeReviewConfirmationChange,
  onProductionRouteReviewConfirmationChange,
  onRecordAdapterCertification,
  onRecordHumanConfirmation,
  onRecordOrchestrationDryRun,
  onRecordOrchestrationExecution,
  onRecordProductionRouteReview,
  onRecordRuntimeReloadAcceptance,
  onRecordSandboxProbeExecution,
  onRecordSandboxProbePlan,
  onRecordSandboxProbeReview,
  onRefreshAdapterHealthProbe,
  onRefreshContext,
  onOpenMarketDataAdapterWorkflow,
  onRuntimeReloadAcceptanceConfirmationChange,
  recordingAdapterCertificationId,
  recordingHumanConfirmationId,
  recordingOrchestrationDryRunId,
  recordingOrchestrationExecutionId,
  recordingRuntimeReloadAcceptanceId,
  recordingSandboxProbeExecutionId,
  recordingSandboxProbePlanId,
  recordingSandboxProbeReviewId,
  recordingProductionRouteReviewId,
  humanConfirmationConfirmations,
  humanConfirmationRows,
  orchestrationDryRunConfirmations,
  orchestrationDryRunRows,
  orchestrationExecutionConfirmations,
  orchestrationExecutionRows,
  refreshingCacheKey,
  runtimeReloadAcceptanceConfirmations,
  runtimeReloadAcceptanceRows,
  runtimeReloadExecutionRows,
  sandboxProbeExecutionConfirmations,
  sandboxProbeExecutionRows,
  sandboxProbePlanConfirmations,
  sandboxProbePlanRows,
  sandboxProbeReviewConfirmations,
  sandboxProbeReviewRows,
  productionRouteReviewConfirmations,
  productionRouteReviewRows,
  settings,
  state,
  workspace
}: {
  adapterCertificationApplyConfirmations: Record<string, ExecutionAdapterCertificationApplyConfirmations>;
  adapterCertificationApplyRows: ExecutionAdapterCertificationApplyRow[];
  adapterCertificationRows: ExecutionAdapterCertificationRow[];
  adapterHealthProbeRows: ExecutionAdapterHealthProbeRow[];
  adapterRows: BrokerAdapterRow[];
  adapterLedgerRows: ExecutionAdapterLedgerRow[];
  applyingAdapterCertificationId?: string | null;
  className?: string;
  i18n: AppI18n;
  isRefreshingAdapterHealthProbe?: boolean;
  onApplyAdapterCertification?: (row: ExecutionAdapterCertificationRow) => void;
  onApplyConfirmationChange?: (
    certificationId: string,
    key: ExecutionAdapterCertificationApplyConfirmationKey,
    checked: boolean
  ) => void;
  onHumanConfirmationChange?: (
    orchestrationExecutionId: string,
    key: keyof ExecutionAdapterHumanConfirmationConfirmations,
    checked: boolean
  ) => void;
  onOrchestrationDryRunConfirmationChange?: (
    acceptanceId: string,
    key: keyof ExecutionAdapterOrchestrationDryRunConfirmations,
    checked: boolean
  ) => void;
  onOrchestrationExecutionConfirmationChange?: (
    dryRunId: string,
    key: keyof ExecutionAdapterOrchestrationExecutionConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbeExecutionConfirmationChange?: (
    sandboxProbePlanId: string,
    key: keyof ExecutionAdapterSandboxProbeExecutionConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbePlanConfirmationChange?: (
    humanConfirmationId: string,
    key: keyof ExecutionAdapterSandboxProbePlanConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbeReviewConfirmationChange?: (
    sandboxProbeExecutionId: string,
    key: keyof ExecutionAdapterSandboxProbeReviewConfirmations,
    checked: boolean
  ) => void;
  onProductionRouteReviewConfirmationChange?: (
    sandboxProbeReviewId: string,
    key: keyof ExecutionAdapterProductionRouteReviewConfirmations,
    checked: boolean
  ) => void;
  onRecordAdapterCertification?: (adapter: PlatformSettingsStatus["executionAdapters"][number]) => void;
  onRecordHumanConfirmation?: (row: ExecutionAdapterOrchestrationExecutionRow) => void;
  onRecordOrchestrationDryRun?: (row: ExecutionAdapterRuntimeReloadAcceptanceRow) => void;
  onRecordOrchestrationExecution?: (row: ExecutionAdapterOrchestrationDryRunRow) => void;
  onRecordProductionRouteReview?: (row: ExecutionAdapterSandboxProbeReviewRow) => void;
  onRecordRuntimeReloadAcceptance?: (row: ExecutionAdapterRuntimeReloadExecutionRow) => void;
  onRecordSandboxProbeExecution?: (row: ExecutionAdapterSandboxProbePlanRow) => void;
  onRecordSandboxProbePlan?: (row: ExecutionAdapterHumanConfirmationRow) => void;
  onRecordSandboxProbeReview?: (row: ExecutionAdapterSandboxProbeExecutionRow) => void;
  onRefreshAdapterHealthProbe?: () => void;
  onRefreshContext?: (context: PlatformSettingsStatus["cache"]["contexts"][number]) => void;
  onOpenMarketDataAdapterWorkflow?: (adapter: PlatformSettingsStatus["marketDataAdapters"][number]) => void;
  onRuntimeReloadAcceptanceConfirmationChange?: (
    executionId: string,
    key: keyof ExecutionAdapterRuntimeReloadAcceptanceConfirmations,
    checked: boolean
  ) => void;
  recordingAdapterCertificationId?: string | null;
  recordingHumanConfirmationId?: string | null;
  recordingOrchestrationDryRunId?: string | null;
  recordingOrchestrationExecutionId?: string | null;
  recordingRuntimeReloadAcceptanceId?: string | null;
  recordingSandboxProbeExecutionId?: string | null;
  recordingSandboxProbePlanId?: string | null;
  recordingSandboxProbeReviewId?: string | null;
  recordingProductionRouteReviewId?: string | null;
  humanConfirmationConfirmations: Record<string, ExecutionAdapterHumanConfirmationConfirmations>;
  humanConfirmationRows: ExecutionAdapterHumanConfirmationRow[];
  orchestrationDryRunConfirmations: Record<string, ExecutionAdapterOrchestrationDryRunConfirmations>;
  orchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[];
  orchestrationExecutionConfirmations: Record<string, ExecutionAdapterOrchestrationExecutionConfirmations>;
  orchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[];
  refreshingCacheKey?: string | null;
  runtimeReloadAcceptanceConfirmations: Record<string, ExecutionAdapterRuntimeReloadAcceptanceConfirmations>;
  runtimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[];
  runtimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[];
  sandboxProbeExecutionConfirmations: Record<string, ExecutionAdapterSandboxProbeExecutionConfirmations>;
  sandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[];
  sandboxProbePlanConfirmations: Record<string, ExecutionAdapterSandboxProbePlanConfirmations>;
  sandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[];
  sandboxProbeReviewConfirmations: Record<string, ExecutionAdapterSandboxProbeReviewConfirmations>;
  sandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[];
  productionRouteReviewConfirmations: Record<string, ExecutionAdapterProductionRouteReviewConfirmations>;
  productionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[];
  settings?: PlatformSettingsStatus;
  state: MarketKlinesResult;
  workspace: TerminalWorkspace;
}) {
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const dataSources = settings?.dataSources ?? [
    {
      market: workspace.selectedInstrument.market,
      label: i18n.marketLabel(workspace.selectedInstrument.market),
      quoteSource: state.quality.source,
      klineSource: state.quality.source,
      status: state.quality.isComplete ? "ready" : "degraded",
      optionalKeyName: null,
      optionalKeyConfigured: false,
      note:
        state.quality.warnings[0] ??
        (i18n.locale === "zh-CN"
          ? "当前图表数据源状态来自本地页面回退。"
          : "Current chart source status comes from the local page fallback.")
    }
  ];
  const marketDataAdapters = settings?.marketDataAdapters ?? [];
  const executionAdapters = settings?.executionAdapters ?? adapterRows.map((row) => ({
    id: row.id,
    market: row.market,
    adapter: row.adapter,
    route: row.route,
    status: row.status,
    certification: row.certification,
    liveTradingAllowed: false,
    note: row.nextStep
  }));
  const liveAdapterCount =
    settings?.executionAdapters.filter((row) => row.route === "live").length ??
    adapterRows.filter((row) => row.route === "live").length;
  const cacheStatus = settings?.cache;
  const cacheLatestLabel = cacheStatus?.latestTimestamp
    ? formatChartDate(cacheStatus.latestTimestamp)
    : i18n.locale === "zh-CN"
      ? "暂无 K 线"
      : "No bars yet";
  const cacheStatsLabel = cacheStatus
    ? i18n.locale === "zh-CN"
      ? `${cacheStatus.rowCount.toLocaleString("zh-CN")} 行 · ${cacheStatus.contextCount.toLocaleString(
          "zh-CN"
        )} 个上下文 · 最新 ${cacheLatestLabel}`
      : `${cacheStatus.rowCount.toLocaleString("en-US")} rows · ${cacheStatus.contextCount.toLocaleString(
          "en-US"
        )} contexts · latest ${cacheLatestLabel}`
    : "";
  const cacheFreshnessSummary = cacheStatus?.freshnessSummary;
  const cacheFreshnessSummaryLabel = cacheFreshnessSummary
    ? i18n.locale === "zh-CN"
      ? `新鲜 ${cacheFreshnessSummary.fresh.toLocaleString("zh-CN")} · 过期 ${cacheFreshnessSummary.stale.toLocaleString(
          "zh-CN"
        )} · 空 ${cacheFreshnessSummary.empty.toLocaleString("zh-CN")}`
      : `Fresh ${cacheFreshnessSummary.fresh.toLocaleString("en-US")} · Stale ${cacheFreshnessSummary.stale.toLocaleString(
          "en-US"
        )} · Empty ${cacheFreshnessSummary.empty.toLocaleString("en-US")}`
    : "";
  const cacheRowTone =
    cacheStatus && cacheStatus.exists && cacheFreshnessSummary && cacheFreshnessSummary.stale === 0 && cacheFreshnessSummary.empty === 0
      ? "positive"
      : "warning";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "平台设置" : "Platform Settings"}
      subtitle={i18n.locale === "zh-CN" ? "数据源、API Key、安全闸门" : "Data sources, API keys, safety gates"}
      className={className}
    >
      <div className="settings-grid">
        <article className="positive">
          <span>{i18n.locale === "zh-CN" ? "行情源" : "Market data"}</span>
          <strong>{dataSources.length}</strong>
          <p>{i18n.locale === "zh-CN" ? "A 股 / 美股 / 加密货币通过统一 OHLCV schema 接入，并显示可用性。" : "A shares, US equities, and crypto expose shared OHLCV readiness."}</p>
        </article>
        <article className="warning">
          <span>{i18n.locale === "zh-CN" ? "API Key" : "API keys"}</span>
          <strong>{dataSources.filter((row) => row.optionalKeyConfigured).length}</strong>
          <p>{i18n.locale === "zh-CN" ? "只显示是否配置，不把密钥值返回给浏览器。" : "Only configured flags are shown; secret values never return to the browser."}</p>
        </article>
        <article className="risk">
          <span>{i18n.locale === "zh-CN" ? "实盘闸门" : "Live gates"}</span>
          <strong>{blockedGateCount}</strong>
          <p>{i18n.locale === "zh-CN" ? "适配器认证、风控审批、人工确认缺一不可。" : "Adapter certification, risk approval, and human confirmation are all required."}</p>
        </article>
        <article className="neutral">
          <span>{i18n.locale === "zh-CN" ? "适配器" : "Adapters"}</span>
          <strong>{liveAdapterCount}</strong>
          <p>{i18n.locale === "zh-CN" ? "实盘适配器目前仅保留接口和认证状态。" : "Live adapters currently expose contracts and certification state only."}</p>
        </article>
      </div>
      <div className="settings-source-list">
        {dataSources.map((row) => (
          <article className={`settings-source-row ${row.status}`} key={`source-${row.market}`}>
            <span>{i18n.marketLabel(row.market)}</span>
            <strong>{row.label}</strong>
            <p>{row.quoteSource} · {row.klineSource}</p>
            <em>
              {settingsStatusLabel(i18n, row.status)} ·{" "}
              {settingsKeyStatusLabel(i18n, row.optionalKeyName, row.optionalKeyConfigured)}
            </em>
          </article>
        ))}
      </div>
      {marketDataAdapters.length ? (
        <div className="settings-source-list adapters">
          {marketDataAdapters.map((row) => (
            <article className={`settings-source-row ${row.status}`} key={`market-adapter-${row.id}`}>
              <span>{i18n.marketLabel(row.market)}</span>
              <strong>{row.adapter}</strong>
              <p>{row.provider} · {row.route} · {row.cacheScope}</p>
              <em>
                {settingsStatusLabel(i18n, row.status)} ·{" "}
                {row.requiresApiKey || row.requiresTradingKey
                  ? i18n.locale === "zh-CN"
                    ? "需要配置密钥"
                    : "Key required"
                  : i18n.locale === "zh-CN"
                    ? "无需交易密钥"
                    : "No trading key"}
              </em>
              <small>
                {marketDataAdapterExternalTelemetryLabel(i18n, row.externalTelemetry)} ·{" "}
                {marketDataAdapterProviderHealthLabel(i18n, row.externalTelemetry.providerHealth)} ·{" "}
                {marketDataAdapterInstallGuidanceLabel(i18n, row.externalTelemetry.installGuidance)} ·{" "}
                {marketDataAdapterCacheDiagnosticsLabel(i18n, row.cacheDiagnostics)} · {row.capabilities.join(" / ")} ·{" "}
                {row.timeframes.join(" / ")}
              </small>
              <MarketDataProviderHealthTrendStrip i18n={i18n} health={row.externalTelemetry.providerHealth} />
              {row.externalTelemetry.lastProviderError ? (
                <small>{marketDataAdapterProviderErrorLabel(i18n, row.externalTelemetry.lastProviderError)}</small>
              ) : null}
              {onOpenMarketDataAdapterWorkflow ? (
                <button
                  className="adapter-certification-button"
                  onClick={() => onOpenMarketDataAdapterWorkflow(row)}
                  type="button"
                >
                  <RefreshCw size={13} />
                  {i18n.locale === "zh-CN" ? "打开缓存工作流" : "Open cache workflow"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      <div className="settings-source-list adapters">
        {executionAdapters.map((row) => (
          <article className={`settings-source-row ${row.status}`} key={`adapter-${row.id}`}>
            <span>
              {row.route === "live" ? (i18n.locale === "zh-CN" ? "实盘" : "Live") : i18n.locale === "zh-CN" ? "模拟" : "Paper"}
            </span>
            <strong>{row.adapter}</strong>
            <p>{row.certification}</p>
            <em>
              {settingsStatusLabel(i18n, row.status)} ·{" "}
              {row.liveTradingAllowed
                ? i18n.locale === "zh-CN"
                  ? "允许实盘"
                  : "Live allowed"
                : i18n.locale === "zh-CN"
                  ? "实盘关闭"
                  : "Live blocked"}
            </em>
            {row.route === "live" && onRecordAdapterCertification ? (
              <button
                className="adapter-certification-button"
                disabled={recordingAdapterCertificationId === row.id}
                onClick={() => onRecordAdapterCertification(row)}
                type="button"
              >
                <ShieldCheck size={13} />
                {recordingAdapterCertificationId === row.id
                  ? i18n.locale === "zh-CN"
                    ? "记录中"
                    : "Recording"
                  : i18n.locale === "zh-CN"
                    ? "记录认证"
                    : "Record evidence"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <div className="adapter-health-probe-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "真实适配器健康检查" : "Real adapter health"}</span>
          <button
            className="adapter-certification-button"
            disabled={isRefreshingAdapterHealthProbe || !onRefreshAdapterHealthProbe}
            onClick={onRefreshAdapterHealthProbe}
            type="button"
          >
            <RefreshCw size={13} />
            {isRefreshingAdapterHealthProbe
              ? i18n.locale === "zh-CN"
                ? "检查中"
                : "Checking"
              : i18n.locale === "zh-CN"
                ? "刷新"
                : "Refresh"}
          </button>
        </div>
        {adapterHealthProbeRows.length ? (
          adapterHealthProbeRows.map((row) => (
            <article className={`adapter-health-probe-row ${row.tone}`} key={row.id}>
              <div>
                <strong>
                  {row.provider.toUpperCase()} {row.exchangeId} · {adapterHealthProbeStatusLabel(i18n, row.statusLabel)}
                </strong>
                <span>
                  {row.marketSummary} · {adapterHealthProbeCredentialSummaryLabel(i18n, row.credentialSummary)}
                </span>
              </div>
              <p>
                {adapterHealthProbeCheckSummaryLabel(i18n, row.checkSummary)} ·{" "}
                {adapterHealthProbeBoundaryLabel(i18n, row.boundary)}
              </p>
              <em>{adapterHealthProbeBlockerLabel(i18n, row.blockerSummary)}</em>
              <div className="adapter-health-probe-checks">
                {row.checks.slice(0, 4).map((check) => (
                  <span className={`adapter-health-probe-check ${check.status}`} key={`${row.id}-${check.id}`}>
                    {check.label}: {adapterHealthProbeCheckStatusLabel(i18n, check.status)}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待本地核心返回 ccxt sandbox/testnet 只读健康检查。"
              : "Waiting for the local core to return the ccxt sandbox/testnet read-only health probe."}
          </p>
        )}
      </div>
      {adapterLedgerRows.length ? (
        <div className="adapter-ledger-list">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "适配器状态账本" : "Adapter state ledger"}</span>
            <strong>{adapterLedgerRows.length}</strong>
          </div>
          {adapterLedgerRows.map((row) => (
            <article className={`adapter-ledger-row ${row.tone}`} key={row.id}>
              <div>
                <strong>{adapterLedgerLabel(i18n, row)}</strong>
                <span>
                  {adapterLedgerAdapterName(i18n, row)} · {adapterLedgerGateSummary(i18n, row.gateSummary)}
                </span>
              </div>
              <p>{adapterLedgerReason(i18n, row)}</p>
              <em>{adapterLedgerNextStep(i18n, row)}</em>
            </article>
          ))}
        </div>
      ) : null}
      {adapterCertificationRows.length ? (
        <div className="adapter-certification-list">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "适配器认证流水" : "Adapter certification evidence"}</span>
            <strong>{adapterCertificationRows.length}</strong>
          </div>
          {adapterCertificationRows.map((row) => (
            <article className={`adapter-certification-row ${row.tone}`} key={row.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <span>{formatChartDate(row.timestamp)}</span>
              </div>
              <p>{adapterCertificationBoundaryLabel(i18n, row.boundary)}</p>
              <em>
                {adapterCertificationCheckSummary(i18n, row.checkSummary)} · {row.auditEventId}
              </em>
              {onApplyConfirmationChange ? (
                <div className="adapter-certification-apply-confirmations">
                  {buildExecutionAdapterCertificationApplyConfirmationRows(
                    adapterCertificationApplyConfirmations[row.id] ??
                      createDefaultExecutionAdapterCertificationApplyConfirmations()
                  ).map((confirmation) => (
                    <label className={`adapter-certification-apply-confirmation ${confirmation.tone}`} key={confirmation.id}>
                      <input
                        checked={confirmation.checked}
                        onChange={(event) => onApplyConfirmationChange(row.id, confirmation.key, event.currentTarget.checked)}
                        type="checkbox"
                      />
                      <span>
                        <strong>{adapterCertificationApplyConfirmationLabel(i18n, confirmation.label)}</strong>
                        <em>{adapterCertificationApplyConfirmationDetail(i18n, confirmation.detail)}</em>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
              {onApplyAdapterCertification ? (
                <button
                  className="adapter-certification-apply-button"
                  disabled={applyingAdapterCertificationId === row.id}
                  onClick={() => onApplyAdapterCertification(row)}
                  type="button"
                >
                  <RefreshCw size={13} />
                  {applyingAdapterCertificationId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "预检中"
                      : "Checking"
                    : i18n.locale === "zh-CN"
                      ? "应用预检"
                      : "Apply preflight"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {adapterCertificationApplyRows.length ? (
        <div className="adapter-certification-apply-list">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "应用预检结果" : "Apply preflight results"}</span>
            <strong>{adapterCertificationApplyRows.length}</strong>
          </div>
          {adapterCertificationApplyRows.map((row) => (
            <article className={`adapter-certification-apply-row ${row.tone}`} key={row.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationApplyStatusLabel(i18n, row.statusLabel)}
                </strong>
                <span>{formatChartDate(row.timestamp)}</span>
              </div>
              <p>{adapterCertificationBoundaryLabel(i18n, row.boundary)}</p>
              <em>
                {adapterCertificationApplyConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                {adapterCertificationApplyModeLabel(i18n, row.applyMode)} · {row.auditEventId}
              </em>
            </article>
          ))}
        </div>
      ) : null}
      <div className="adapter-runtime-reload-acceptance-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "运行时重载最终验收" : "Runtime reload final acceptance"}</span>
          <strong>{runtimeReloadExecutionRows.length}</strong>
        </div>
        {runtimeReloadExecutionRows.length ? (
          runtimeReloadExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              runtimeReloadAcceptanceConfirmations[row.id] ??
              createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations();
            const acceptance = runtimeReloadAcceptanceRows.find(
              (item) => item.adapterId === row.adapterId && item.executionId === row.id
            );
            return (
              <article className={`adapter-runtime-reload-acceptance-row ${acceptance?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterRuntimeReloadExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterRuntimeReloadExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-runtime-reload-acceptance-confirmations">
                  {executionAdapterRuntimeReloadAcceptanceConfirmationRows.map((confirmation) => (
                    <label
                      className={`adapter-runtime-reload-acceptance-confirmation ${
                        confirmations[confirmation.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${confirmation.key}`}
                    >
                      <input
                        checked={confirmations[confirmation.key]}
                        onChange={(event) =>
                          onRuntimeReloadAcceptanceConfirmationChange?.(
                            row.id,
                            confirmation.key,
                            event.currentTarget.checked
                          )
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? confirmation.labelZh : confirmation.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingRuntimeReloadAcceptanceId === row.id || !onRecordRuntimeReloadAcceptance}
                  onClick={() => onRecordRuntimeReloadAcceptance?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingRuntimeReloadAcceptanceId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "验收中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录最终验收"
                      : "Record acceptance"}
                </button>
                {acceptance ? (
                  <div className={`adapter-runtime-reload-acceptance-result ${acceptance.tone}`}>
                    <strong>{adapterRuntimeReloadAcceptanceStatusLabel(i18n, acceptance.statusLabel)}</strong>
                    <span>
                      {adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, acceptance.confirmationSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, acceptance.boundary)}
                    </span>
                    <em>{acceptance.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待录入最终验收；录入后仍保持实盘阻断。"
                      : "Waiting for final acceptance; live routing stays blocked after recording."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待运行时重载执行证据；记录执行证据后才能录入最终验收。"
              : "Waiting for runtime reload execution evidence before final acceptance can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-orchestration-dry-run-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "适配器编排 dry-run" : "Adapter orchestration dry run"}</span>
          <strong>{runtimeReloadAcceptanceRows.length}</strong>
        </div>
        {runtimeReloadAcceptanceRows.length ? (
          runtimeReloadAcceptanceRows.slice(0, 4).map((row) => {
            const confirmations =
              orchestrationDryRunConfirmations[row.id] ??
              createDefaultExecutionAdapterOrchestrationDryRunConfirmations();
            const dryRun = orchestrationDryRunRows.find(
              (item) => item.adapterId === row.adapterId && item.acceptanceId === row.id
            );
            return (
              <article className={`adapter-orchestration-dry-run-row ${dryRun?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterRuntimeReloadAcceptanceStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-orchestration-dry-run-confirmations">
                  {executionAdapterOrchestrationDryRunConfirmationRows.map((confirmation) => (
                    <label
                      className={`adapter-orchestration-dry-run-confirmation ${
                        confirmations[confirmation.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${confirmation.key}`}
                    >
                      <input
                        checked={confirmations[confirmation.key]}
                        onChange={(event) =>
                          onOrchestrationDryRunConfirmationChange?.(
                            row.id,
                            confirmation.key,
                            event.currentTarget.checked
                          )
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? confirmation.labelZh : confirmation.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingOrchestrationDryRunId === row.id || !onRecordOrchestrationDryRun}
                  onClick={() => onRecordOrchestrationDryRun?.(row)}
                  type="button"
                >
                  <Play size={13} />
                  {recordingOrchestrationDryRunId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录 dry-run"
                      : "Record dry run"}
                </button>
                {dryRun ? (
                  <div className={`adapter-orchestration-dry-run-result ${dryRun.tone}`}>
                    <strong>{adapterOrchestrationDryRunStatusLabel(i18n, dryRun.statusLabel)}</strong>
                    <span>
                      {adapterOrchestrationDryRunConfirmationSummary(i18n, dryRun.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, dryRun.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, dryRun.boundary)}
                    </span>
                    <em>{dryRun.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待录入编排 dry-run；录入后仍不连接券商、不路由实盘订单。"
                      : "Waiting for orchestration dry-run; recording still avoids broker connections and live orders."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待运行时重载最终验收；验收完成后才能录入适配器编排 dry-run。"
              : "Waiting for runtime reload final acceptance before adapter orchestration dry-run can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-orchestration-execution-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "受控编排执行证据" : "Controlled orchestration execution"}</span>
          <strong>{orchestrationDryRunRows.length}</strong>
        </div>
        {orchestrationDryRunRows.length ? (
          orchestrationDryRunRows.slice(0, 4).map((row) => {
            const confirmations =
              orchestrationExecutionConfirmations[row.id] ??
              createDefaultExecutionAdapterOrchestrationExecutionConfirmations();
            const execution = orchestrationExecutionRows.find(
              (item) => item.adapterId === row.adapterId && item.dryRunId === row.id
            );
            return (
              <article className={`adapter-orchestration-execution-row ${execution?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterOrchestrationDryRunStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterOrchestrationDryRunConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-orchestration-execution-confirmations">
                  {executionAdapterOrchestrationExecutionConfirmationRows.map((confirmation) => (
                    <label
                      className={`adapter-orchestration-execution-confirmation ${
                        confirmations[confirmation.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${confirmation.key}`}
                    >
                      <input
                        checked={confirmations[confirmation.key]}
                        onChange={(event) =>
                          onOrchestrationExecutionConfirmationChange?.(
                            row.id,
                            confirmation.key,
                            event.currentTarget.checked
                          )
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? confirmation.labelZh : confirmation.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingOrchestrationExecutionId === row.id || !onRecordOrchestrationExecution}
                  onClick={() => onRecordOrchestrationExecution?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingOrchestrationExecutionId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录执行证据"
                      : "Record execution evidence"}
                </button>
                {execution ? (
                  <div className={`adapter-orchestration-execution-result ${execution.tone}`}>
                    <strong>{adapterOrchestrationExecutionStatusLabel(i18n, execution.statusLabel)}</strong>
                    <span>
                      {adapterOrchestrationExecutionConfirmationSummary(i18n, execution.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, execution.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, execution.boundary)}
                    </span>
                    <em>{execution.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待录入受控编排执行证据；录入仍不会连接券商或路由任何订单。"
                      : "Waiting for controlled orchestration execution evidence; recording still avoids broker connections and all order routing."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待适配器编排 dry-run；dry-run 完整后才能记录受控执行证据。"
              : "Waiting for adapter orchestration dry-run before controlled execution evidence can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-human-confirmation-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "最终人工确认" : "Final human confirmation"}</span>
          <strong>{orchestrationExecutionRows.length}</strong>
        </div>
        {orchestrationExecutionRows.length ? (
          orchestrationExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              humanConfirmationConfirmations[row.id] ??
              createDefaultExecutionAdapterHumanConfirmationConfirmations();
            const confirmation = humanConfirmationRows.find(
              (item) => item.adapterId === row.adapterId && item.orchestrationExecutionId === row.id
            );
            return (
              <article className={`adapter-human-confirmation-row ${confirmation?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterOrchestrationExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterOrchestrationExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-human-confirmation-confirmations">
                  {executionAdapterHumanConfirmationConfirmationRows.map((item) => (
                    <label
                      className={`adapter-human-confirmation-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onHumanConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingHumanConfirmationId === row.id || !onRecordHumanConfirmation}
                  onClick={() => onRecordHumanConfirmation?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingHumanConfirmationId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "确认中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录最终确认"
                      : "Record final confirmation"}
                </button>
                {confirmation ? (
                  <div className={`adapter-human-confirmation-result ${confirmation.tone}`}>
                    <strong>{adapterHumanConfirmationStatusLabel(i18n, confirmation.statusLabel)}</strong>
                    <span>
                      {adapterHumanConfirmationConfirmationSummary(i18n, confirmation.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, confirmation.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, confirmation.boundary)}
                    </span>
                    <em>{confirmation.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待最终人工确认；确认记录只关闭审计闸门，实盘交易仍保持阻断。"
                      : "Waiting for final human confirmation; recording closes the audit gate only while live trading stays blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待受控编排执行证据；执行证据记录后才能录入最终人工确认。"
              : "Waiting for controlled orchestration execution evidence before final human confirmation can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-plan-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针计划" : "Sandbox probe plan"}</span>
          <strong>{humanConfirmationRows.length}</strong>
        </div>
        {humanConfirmationRows.length ? (
          humanConfirmationRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbePlanConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbePlanConfirmations();
            const probePlan = sandboxProbePlanRows.find(
              (item) => item.adapterId === row.adapterId && item.humanConfirmationId === row.id
            );
            return (
              <article className={`adapter-sandbox-probe-plan-row ${probePlan?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterHumanConfirmationStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterHumanConfirmationConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-plan-confirmations">
                  {executionAdapterSandboxProbePlanConfirmationRows.map((item) => (
                    <label
                      className={`adapter-sandbox-probe-plan-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onSandboxProbePlanConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbePlanId === row.id || !onRecordSandboxProbePlan}
                  onClick={() => onRecordSandboxProbePlan?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbePlanId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针计划"
                      : "Record probe plan"}
                </button>
                {probePlan ? (
                  <div className={`adapter-sandbox-probe-plan-result ${probePlan.tone}`}>
                    <strong>{adapterSandboxProbePlanStatusLabel(i18n, probePlan.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbePlanConfirmationSummary(i18n, probePlan.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probePlan.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probePlan.boundary)}
                    </span>
                    <em>{probePlan.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox 探针计划；这一步只记录测试计划，不连接券商、不提交订单。"
                      : "Waiting for a sandbox probe plan; this records the test plan only, with no broker connection or order submission."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待最终人工确认；确认后才能记录 sandbox/testnet 探针计划。"
              : "Waiting for final human confirmation before recording a sandbox/testnet probe plan."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-execution-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针执行" : "Sandbox probe execution"}</span>
          <strong>{sandboxProbePlanRows.length}</strong>
        </div>
        {sandboxProbePlanRows.length ? (
          sandboxProbePlanRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbeExecutionConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbeExecutionConfirmations();
            const probeExecution = sandboxProbeExecutionRows.find(
              (item) => item.adapterId === row.adapterId && item.sandboxProbePlanId === row.id
            );
            return (
              <article className={`adapter-sandbox-probe-execution-row ${probeExecution?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbePlanStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbePlanConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-execution-confirmations">
                  {executionAdapterSandboxProbeExecutionConfirmationRows.map((item) => (
                    <label
                      className={`adapter-sandbox-probe-execution-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onSandboxProbeExecutionConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbeExecutionId === row.id || !onRecordSandboxProbeExecution}
                  onClick={() => onRecordSandboxProbeExecution?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbeExecutionId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针执行"
                      : "Record probe execution"}
                </button>
                {probeExecution ? (
                  <div className={`adapter-sandbox-probe-execution-result ${probeExecution.tone}`}>
                    <strong>{adapterSandboxProbeExecutionStatusLabel(i18n, probeExecution.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbeExecutionConfirmationSummary(i18n, probeExecution.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probeExecution.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probeExecution.boundary)}
                    </span>
                    <em>{probeExecution.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox/testnet 只读探针执行；这一步只记录握手和订单 schema 证据，不提交任何订单。"
                      : "Waiting for a read-only sandbox/testnet probe execution; this records handshake and order-schema evidence only, with no order submission."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 sandbox/testnet 探针计划；计划记录后才能录入只读探针执行证据。"
              : "Waiting for a sandbox/testnet probe plan before read-only probe execution evidence can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-review-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针复核" : "Sandbox probe review"}</span>
          <strong>{sandboxProbeExecutionRows.length}</strong>
        </div>
        {sandboxProbeExecutionRows.length ? (
          sandboxProbeExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbeReviewConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbeReviewConfirmations();
            const probeReview = sandboxProbeReviewRows.find(
              (item) => item.adapterId === row.adapterId && item.sandboxProbeExecutionId === row.id
            );
            return (
              <article className={`adapter-sandbox-probe-review-row ${probeReview?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbeExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbeExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-review-confirmations">
                  {executionAdapterSandboxProbeReviewConfirmationRows.map((item) => (
                    <label
                      className={`adapter-sandbox-probe-review-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onSandboxProbeReviewConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbeReviewId === row.id || !onRecordSandboxProbeReview}
                  onClick={() => onRecordSandboxProbeReview?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbeReviewId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "复核中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针复核"
                      : "Record probe review"}
                </button>
                {probeReview ? (
                  <div className={`adapter-sandbox-probe-review-result ${probeReview.tone}`}>
                    <strong>{adapterSandboxProbeReviewStatusLabel(i18n, probeReview.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbeReviewConfirmationSummary(i18n, probeReview.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probeReview.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probeReview.boundary)}
                    </span>
                    <em>{probeReview.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox/testnet 探针复核；复核只确认只读证据已归档，生产路由仍保持阻断。"
                      : "Waiting for sandbox/testnet probe review; review only attests read-only evidence is archived while production routing stays blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待只读探针执行证据；执行记录后才能录入复核。"
              : "Waiting for read-only probe execution evidence before recording a review."}
          </p>
        )}
      </div>
      <div className="adapter-production-route-review-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "生产路由策略复核" : "Production route review"}</span>
          <strong>{sandboxProbeReviewRows.length}</strong>
        </div>
        {sandboxProbeReviewRows.length ? (
          sandboxProbeReviewRows.slice(0, 4).map((row) => {
            const confirmations =
              productionRouteReviewConfirmations[row.id] ??
              createDefaultExecutionAdapterProductionRouteReviewConfirmations();
            const routeReview = productionRouteReviewRows.find((item) => item.sandboxProbeReviewId === row.id);
            return (
              <article className={`adapter-production-route-review-row ${routeReview?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbeReviewStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbeReviewConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-production-route-review-confirmations">
                  {executionAdapterProductionRouteReviewConfirmationRows.map((item) => (
                    <label
                      className={`adapter-production-route-review-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onProductionRouteReviewConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingProductionRouteReviewId === row.id || !onRecordProductionRouteReview}
                  onClick={() => onRecordProductionRouteReview?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingProductionRouteReviewId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "复核中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录生产路由复核"
                      : "Record route review"}
                </button>
                {routeReview ? (
                  <div className={`adapter-production-route-review-result ${routeReview.tone}`}>
                    <strong>{adapterProductionRouteReviewStatusLabel(i18n, routeReview.statusLabel)}</strong>
                    <span>
                      {adapterProductionRouteReviewConfirmationSummary(i18n, routeReview.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, routeReview.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, routeReview.boundary)}
                    </span>
                    <em>{routeReview.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待生产路由策略复核；该复核只记录急停、仓位限额、路由禁用和回滚责任，实盘路由仍保持阻断。"
                      : "Waiting for production route policy review; this only records kill-switch, position-limit, routing-disabled, and rollback-owner checks while live routing remains blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 sandbox 探针复核；前置复核记录后才能录入生产路由策略复核。"
              : "Waiting for sandbox probe review before production route policy review can be recorded."}
          </p>
        )}
      </div>
      {cacheStatus ? (
        <div className={`settings-cache-row ${cacheRowTone}`}>
          <span>{i18n.locale === "zh-CN" ? "本地缓存" : "Local cache"}</span>
          <strong>{cacheStatus.engine} · {cacheStatus.scope}</strong>
          <p>{cacheStatus.path}</p>
          <p className="settings-cache-stats">{cacheStatsLabel}</p>
          <p className="settings-cache-health">{cacheFreshnessSummaryLabel}</p>
        </div>
      ) : null}
      {cacheStatus?.contexts.length ? (
        <div className="settings-cache-contexts">
          <span>{i18n.locale === "zh-CN" ? "缓存上下文" : "Cache contexts"}</span>
          <div>
            {cacheStatus.contexts.map((context) => (
              <article className={context.freshness} key={`${context.market}-${context.symbol}-${context.timeframe}`}>
                <strong>
                  {i18n.marketLabel(context.market)} · {context.symbol} · {context.timeframe}
                </strong>
                <p>
                  {i18n.locale === "zh-CN"
                    ? `${context.rowCount.toLocaleString("zh-CN")} 行 · ${formatCacheContextRange(context.startTimestamp, context.endTimestamp)}`
                    : `${context.rowCount.toLocaleString("en-US")} rows · ${formatCacheContextRange(context.startTimestamp, context.endTimestamp)}`}
                </p>
                <div className="settings-cache-context-actions">
                  <em>{cacheFreshnessLabel(i18n, context.freshness, context.ageHours)}</em>
                  {onRefreshContext ? (
                    <button
                      type="button"
                      className="settings-cache-refresh"
                      disabled={refreshingCacheKey === cacheContextKey(context)}
                      onClick={() => onRefreshContext(context)}
                    >
                      <RefreshCw size={12} />
                      {refreshingCacheKey === cacheContextKey(context)
                        ? i18n.locale === "zh-CN"
                          ? "刷新中"
                          : "Refreshing"
                        : i18n.locale === "zh-CN"
                          ? "刷新"
                          : "Refresh"}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function CompactWorkflowNodes({
  activeStageId,
  i18n,
  runState,
  stages
}: {
  activeStageId: string;
  i18n: AppI18n;
  runState: WorkflowRunState;
  stages: WorkflowStageView[];
}) {
  const selectedStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];

  return (
    <div className="workflow-workspace compact">
      <div className="workflow-canvas-label">{i18n.t("module.workflow.canvas")}</div>
      <div className="workflow-canvas-large">
        {stages.map((stage) => {
          const translated = i18n.workflowNode(stage.id, stage.label, stage.detail);
          return (
            <article
              className={`workflow-stage ${stage.status} ${stage.id === selectedStage?.id ? "selected" : ""}`}
              key={stage.id}
            >
              <small>{workflowStageStatusLabel(i18n, stage.status)}</small>
              <strong>{translated.label}</strong>
              <span>{i18n.strategyText(stage.output)}</span>
            </article>
          );
        })}
      </div>
      {selectedStage ? (
        <div className="workflow-artifacts">
          <span>{i18n.t("module.workflow.artifacts")}</span>
          <div className="workflow-artifact-grid">
            {selectedStage.artifacts.map((artifact) => (
              <article className={`workflow-artifact ${artifact.tone}`} key={`${artifact.label}-${artifact.value}`}>
                <span>{workflowArtifactLabel(i18n, artifact.label)}</span>
                <strong>{i18n.strategyText(artifact.value)}</strong>
                <p>{i18n.strategyText(artifact.detail)}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className="workflow-log">
        <span>{i18n.t("module.workflow.log")}</span>
        {runState.log.length ? (
          <div className="workflow-log-list">
            {runState.log.map((entry) => (
              <article className={`workflow-log-entry ${entry.level}`} key={entry.id}>
                <small>{workflowArtifactLabel(i18n, entry.stageId)}</small>
                <span>{i18n.strategyText(entry.message)}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="workflow-log-empty">{i18n.t("module.workflow.idle")}</p>
        )}
      </div>
    </div>
  );
}

function workflowStageStatusLabel(i18n: AppI18n, status: WorkflowStageView["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return (
    {
      active: "待运行",
      ready: "待运行",
      blocked: "阻断",
      running: "运行中",
      completed: "完成",
      failed: "失败"
    } satisfies Record<WorkflowStageView["status"], string>
  )[status];
}

function workflowArtifactLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      Instrument: "标的",
      Timeframe: "周期",
      Rows: "数据",
      Entry: "入场",
      Exit: "出场",
      Risk: "风控",
      Return: "收益率",
      "Max DD": "最大回撤",
      "Win Rate": "胜率",
      Trades: "交易数",
      "Initial cash": "初始资金",
      Fee: "手续费",
      Slippage: "滑点",
      Mode: "模式",
      "Live gates": "实盘闸门",
      data: "数据",
      factor: "因子",
      backtest: "回测",
      agent: "智能体",
      execution: "执行"
    } as Record<string, string>
  )[label] ?? label;
}

function AiReviewDossierBoard({ dossier, i18n }: { dossier: AiReviewDossier; i18n: AppI18n }) {
  return (
    <div className="ai-dossier">
      <div className={`ai-dossier-head ${dossier.status}`}>
        <span>{i18n.locale === "zh-CN" ? "AI 评审档案" : "AI review dossier"}</span>
        <strong>{aiDossierText(i18n, dossier.headline)}</strong>
        <p>{aiDossierText(i18n, dossier.summary)}</p>
      </div>
      <div className="ai-dossier-grid">
        {dossier.citations.map((citation) => (
          <article className={`ai-dossier-card ${citation.tone}`} key={citation.id}>
            <span>{aiCitationLabel(i18n, citation)}</span>
            <strong>{aiCitationValue(i18n, citation)}</strong>
            <p>{aiCitationDetail(i18n, citation.detail)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AiReviewRunRecordHistory({
  i18n,
  isLoading,
  onNextPage,
  onPreviousPage,
  onSelectRecord,
  pagination,
  query,
  records,
  selectedRecordId,
  totalRecords
}: {
  i18n: AppI18n;
  isLoading?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onSelectRecord?: (recordId: string) => void;
  pagination?: AiReviewRunHistoryPagination | null;
  query: string;
  records: AiReviewRunRecordEnvelope[];
  selectedRecordId?: string | null;
  totalRecords: number;
}) {
  const visibleRecords = records.slice(0, 3);
  const isSelectable = Boolean(onSelectRecord);
  const RecordTag = isSelectable ? "button" : "article";
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + records.length, pagination.total) : records.length;
  const countLabel = pagination
    ? `${pageStart}-${pageEnd}/${pagination.total}`
    : records.length !== totalRecords
      ? `${records.length}/${totalRecords}`
      : `${totalRecords}`;
  const canPageBack = Boolean(pagination && onPreviousPage && pagination.offset > 0);
  const canPageForward = Boolean(pagination && onNextPage && pagination.offset + pagination.limit < pagination.total);
  const emptyTitle =
    totalRecords > 0 ? (i18n.locale === "zh-CN" ? "没有匹配记录" : "No matching records") : i18n.t("aiReview.noSavedRecords");
  const emptyDetail =
    totalRecords > 0
      ? i18n.locale === "zh-CN"
        ? `未找到匹配「${query}」的已保存 AI 评审记录。`
        : `No saved AI review record matches "${query}".`
      : i18n.t("aiReview.noSavedRecordsDetail");

  return (
    <div className="ai-review-records">
      <div className="agent-rounds-title">
        <span>{i18n.t("aiReview.savedRecords")}</span>
        <strong>{countLabel}</strong>
      </div>
      {pagination ? (
        <div className="ai-review-record-pagination">
          <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
            {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
          </button>
          <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : countLabel}</span>
          <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
            {i18n.locale === "zh-CN" ? "下一页" : "Next"}
          </button>
        </div>
      ) : null}
      {visibleRecords.length ? (
        visibleRecords.map((item) => (
          <RecordTag
            className={`ai-review-record ${item.record.status}${
              isSelectable && item.aiReviewId === selectedRecordId ? " selected" : ""
            }`}
            key={item.aiReviewId}
            onClick={isSelectable ? () => onSelectRecord?.(item.aiReviewId) : undefined}
            {...(isSelectable ? { type: "button" as const } : {})}
          >
            <header>
              <strong>{item.record.strategyRevision}</strong>
              <span>{formatChartDate(item.createdAt)}</span>
            </header>
            <p>{aiDossierText(i18n, item.record.dossier.headline)}</p>
            <small>
              {item.record.summary.citationCount} {i18n.t("aiReview.citations")} · {item.record.summary.roundCount}{" "}
              {i18n.t("aiReview.rounds")} ·{" "}
              {item.record.summary.liveExecutionBlocked ? i18n.t("aiReview.boundary") : item.record.executionMode}
            </small>
          </RecordTag>
        ))
      ) : (
        <article className="ai-review-record empty">
          <strong>{emptyTitle}</strong>
          <p>{emptyDetail}</p>
        </article>
      )}
    </div>
  );
}

function AiReviewAuditComparison({
  currentCitationCount,
  currentRunId,
  currentStatus,
  currentStrategyRevision,
  i18n,
  latestRecord,
  liveExecutionBlocked,
  roundCount
}: {
  currentCitationCount: number;
  currentRunId: string | null;
  currentStatus: AiReviewDossier["status"];
  currentStrategyRevision: string;
  i18n: AppI18n;
  latestRecord: AiReviewRunRecordEnvelope | null;
  liveExecutionBlocked: boolean;
  roundCount: number;
}) {
  const emptyValue = i18n.locale === "zh-CN" ? "未保存" : "Not saved";
  const currentRunLabel = currentRunId ?? (i18n.locale === "zh-CN" ? "等待审计运行" : "Pending audited run");
  const selectedRecordLabel = i18n.locale === "zh-CN" ? "选中保存" : "Selected saved";
  const savedRecord = latestRecord?.record ?? null;
  const rows = [
    {
      id: "run",
      label: i18n.locale === "zh-CN" ? "审计运行" : "Audit run",
      current: currentRunLabel,
      saved: latestRecord?.runId ?? emptyValue,
      changed: Boolean(currentRunId && latestRecord && currentRunId !== latestRecord.runId)
    },
    {
      id: "revision",
      label: i18n.locale === "zh-CN" ? "策略版本" : "Strategy revision",
      current: currentStrategyRevision,
      saved: savedRecord?.strategyRevision ?? emptyValue,
      changed: Boolean(savedRecord && currentStrategyRevision !== savedRecord.strategyRevision)
    },
    {
      id: "status",
      label: i18n.locale === "zh-CN" ? "档案状态" : "Dossier status",
      current: aiReviewAuditStatusLabel(i18n, currentStatus),
      saved: savedRecord ? aiReviewAuditStatusLabel(i18n, savedRecord.status) : emptyValue,
      changed: Boolean(savedRecord && currentStatus !== savedRecord.status)
    },
    {
      id: "citations",
      label: i18n.locale === "zh-CN" ? "引用证据" : "Citations",
      current: currentCitationCount.toLocaleString(i18n.locale),
      saved: savedRecord ? savedRecord.summary.citationCount.toLocaleString(i18n.locale) : emptyValue,
      changed: Boolean(savedRecord && currentCitationCount !== savedRecord.summary.citationCount)
    },
    {
      id: "rounds",
      label: i18n.locale === "zh-CN" ? "委员会轮次" : "Committee rounds",
      current: roundCount.toLocaleString(i18n.locale),
      saved: savedRecord ? savedRecord.summary.roundCount.toLocaleString(i18n.locale) : emptyValue,
      changed: Boolean(savedRecord && roundCount !== savedRecord.summary.roundCount)
    },
    {
      id: "boundary",
      label: i18n.locale === "zh-CN" ? "实盘边界" : "Live boundary",
      current: aiReviewAuditBoundaryLabel(i18n, liveExecutionBlocked),
      saved: savedRecord ? aiReviewAuditBoundaryLabel(i18n, savedRecord.summary.liveExecutionBlocked) : emptyValue,
      changed: Boolean(savedRecord && liveExecutionBlocked !== savedRecord.summary.liveExecutionBlocked)
    }
  ];

  return (
    <div className="audit-ai-comparison">
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "证据对照" : "Evidence Comparison"}</span>
        <strong>{latestRecord ? formatChartDate(latestRecord.createdAt) : emptyValue}</strong>
      </div>
      <div className="audit-ai-comparison-grid">
        <div className="audit-ai-comparison-row audit-ai-comparison-head">
          <span>{i18n.locale === "zh-CN" ? "维度" : "Dimension"}</span>
          <span>{i18n.locale === "zh-CN" ? "当前证据" : "Current evidence"}</span>
          <span>{selectedRecordLabel}</span>
        </div>
        {rows.map((row) => (
          <article className={`audit-ai-comparison-row ${row.changed ? "changed" : "matched"}`} key={row.id}>
            <span>{row.label}</span>
            <strong>{row.current}</strong>
            <em>{row.saved}</em>
          </article>
        ))}
      </div>
    </div>
  );
}

function AiReviewRiskReferenceBoard({ approval, i18n }: { approval: RiskApprovalSummary; i18n: AppI18n }) {
  return (
    <div className={`audit-ai-risk-reference ${approval.status}`}>
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "风控引用" : "Risk References"}</span>
        <strong>{riskApprovalHeadline(i18n, approval)}</strong>
      </div>
      <p>{riskApprovalSummaryText(i18n, approval)}</p>
      <div className="audit-ai-risk-gates">
        {approval.gates.map((gate) => (
          <article className={`audit-ai-risk-gate ${gate.tone}`} key={gate.id}>
            <span>{riskApprovalGateLabel(i18n, gate)}</span>
            <strong>{riskApprovalGateValue(i18n, gate)}</strong>
            <em>{riskApprovalGateStatus(i18n, gate.status)}</em>
            <p>{riskApprovalGateDetail(i18n, gate)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AiReviewRecordDriftSummary({
  i18n,
  onQueryChange,
  query,
  rows,
  totalRows
}: {
  i18n: AppI18n;
  onQueryChange: (query: string) => void;
  query: string;
  rows: AiReviewRecordDriftRow[];
  totalRows: number;
}) {
  const visibleRows = rows.slice(0, 5);
  const driftCount = rows.filter((row) => row.status === "drift").length;
  const countLabel = rows.length !== totalRows ? `${rows.length}/${totalRows}` : `${totalRows}`;
  const summaryValue = totalRows
    ? `${countLabel} · ${
        driftCount
          ? i18n.locale === "zh-CN"
            ? `${driftCount} 漂移`
            : `${driftCount} drift`
          : i18n.locale === "zh-CN"
            ? "全部匹配"
            : "All matched"
      }`
    : i18n.locale === "zh-CN"
      ? "无记录"
      : "No records";

  return (
    <div className="audit-ai-drift-summary">
      <div className="audit-ai-drift-toolbar">
        <div className="agent-rounds-title">
          <span>{i18n.locale === "zh-CN" ? "保存记录漂移" : "Saved Record Drift"}</span>
          <strong>{summaryValue}</strong>
        </div>
        <input
          className="audit-ai-drift-search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={i18n.locale === "zh-CN" ? "搜索版本、ID、漂移原因" : "Search revision, ID, drift reason"}
          type="search"
          value={query}
        />
      </div>
      <div className="audit-ai-drift-list">
        {visibleRows.length ? (
          visibleRows.map((row) => (
            <article className={`audit-ai-drift-row ${row.status}`} key={row.aiReviewId}>
              <span>
                <strong>{row.strategyRevision}</strong>
                <em>{formatChartDate(row.createdAt)}</em>
              </span>
              <p>{aiReviewDriftReasonText(i18n, row)}</p>
              <strong>{aiReviewDriftStatusText(i18n, row)}</strong>
            </article>
          ))
        ) : (
          <article className="audit-ai-drift-row empty">
            <span>
              <strong>
                {totalRows ? (i18n.locale === "zh-CN" ? "没有匹配记录" : "No matching records") : i18n.t("aiReview.noSavedRecords")}
              </strong>
              <em>{query ? query : i18n.locale === "zh-CN" ? "等待保存" : "Waiting"}</em>
            </span>
            <p>
              {totalRows
                ? i18n.locale === "zh-CN"
                  ? "换一个关键词，或清空搜索查看全部保存记录。"
                  : "Try another keyword, or clear search to see all saved records."
                : i18n.t("aiReview.noSavedRecordsDetail")}
            </p>
            <strong>{i18n.locale === "zh-CN" ? "未开始" : "Pending"}</strong>
          </article>
        )}
      </div>
    </div>
  );
}

function AiReviewAuditTimelineBoard({
  i18n,
  items,
  onSelectRecord,
  onSelectWorkspace
}: {
  i18n: AppI18n;
  items: AiReviewAuditTimelineItem[];
  onSelectRecord: (recordId: string) => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
}) {
  function handleTimelineAction(item: AiReviewAuditTimelineItem) {
    if (item.targetRecordId) {
      onSelectRecord(item.targetRecordId);
      return;
    }
    if (item.targetWorkspaceId) {
      onSelectWorkspace(item.targetWorkspaceId);
    }
  }

  return (
    <div className="audit-ai-timeline">
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "审计时间线" : "Audit Timeline"}</span>
        <strong>{items.length}</strong>
      </div>
      <div className="audit-ai-timeline-list">
        {items.map((item) => (
          <article className={`audit-ai-timeline-row ${item.status} ${item.tone}`} key={item.id}>
            <span>{auditTimelineKindLabel(i18n, item.kind)}</span>
            <strong>{auditTimelineValue(i18n, item)}</strong>
            <em>{item.reference}</em>
            <button className="audit-ai-timeline-action" onClick={() => handleTimelineAction(item)} type="button">
              {auditTimelineActionLabel(i18n, item)}
            </button>
            <small className="audit-ai-timeline-anchor">{item.exportAnchor}</small>
            <p>{auditTimelineDetail(i18n, item)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AiReviewExportEvidenceIndexBoard({
  i18n,
  onQueryChange,
  query,
  rows,
  totalRows
}: {
  i18n: AppI18n;
  onQueryChange: (query: string) => void;
  query: string;
  rows: AiReviewExportEvidenceIndexRow[];
  totalRows: number;
}) {
  return (
    <div className="audit-ai-evidence-index">
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "导出证据索引" : "Export Evidence Index"}</span>
        <strong>{rows.length !== totalRows ? `${rows.length}/${totalRows}` : totalRows}</strong>
      </div>
      <div className="audit-ai-evidence-index-toolbar">
        <input
          aria-label={i18n.locale === "zh-CN" ? "搜索导出证据索引" : "Search export evidence index"}
          className="audit-ai-evidence-index-search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={i18n.locale === "zh-CN" ? "搜索 anchor / exportPath / 引用" : "Search anchor / exportPath / reference"}
          type="search"
          value={query}
        />
      </div>
      <div className="audit-ai-evidence-index-list">
        {rows.length ? (
          rows.map((row) => (
            <article className={`audit-ai-evidence-index-row ${row.tone}`} key={row.id}>
              <span>{aiReviewEvidenceIndexGroupLabel(i18n, row.group)}</span>
              <strong>{row.anchor}</strong>
              <em>{row.exportPath}</em>
              <small>{row.reference}</small>
              <p>{aiReviewEvidenceIndexDetail(i18n, row.detail)}</p>
            </article>
          ))
        ) : (
          <article className="audit-ai-evidence-index-row empty">
            <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
            <strong>{i18n.locale === "zh-CN" ? "清空搜索查看全部锚点" : "Clear search to see all anchors"}</strong>
            <em>-</em>
            <p>{i18n.locale === "zh-CN" ? "当前查询没有命中导出证据索引。" : "The current query did not match the export evidence index."}</p>
          </article>
        )}
      </div>
    </div>
  );
}

function ResearchRunExportPreviewPanel({
  className,
  i18n,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  rows: ResearchRunExportPreviewRow[];
}) {
  const [query, setQuery] = useState("");
  const filteredRows = filterResearchRunExportPreviewRows(rows, query);
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "复现包预览" : "Export Package Preview"}
      subtitle={
        i18n.locale === "zh-CN"
          ? "研究运行、证据和执行闸门的导出就绪度"
          : "Export readiness for run evidence and execution gates"
      }
      className={className}
    >
      <div className="research-export-preview">
        <div className="research-export-preview-toolbar">
          <div className="research-export-preview-summary">
            <span>
              {i18n.locale === "zh-CN" ? "就绪" : "Ready"} <strong>{readyCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "总项" : "Total"} <strong>{rows.length}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索复现包预览" : "Search export package preview"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索 artifact / anchor / exportPath" : "Search artifact / anchor / exportPath"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-export-preview-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-export-preview-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{researchExportPreviewLabel(i18n, row)}</span>
                <strong>{researchExportPreviewDetail(i18n, row.detail)}</strong>
                <em>{row.count}</em>
                <small>{row.exportPath}</small>
                <b>{researchExportPreviewStatusLabel(i18n, row.status)}</b>
                <p>{row.anchor}</p>
              </article>
            ))
          ) : (
            <article className="research-export-preview-row empty">
              <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
              <strong>{i18n.locale === "zh-CN" ? "清空搜索查看全部导出项" : "Clear search to see every export item"}</strong>
              <em>-</em>
              <small>-</small>
              <b>{i18n.locale === "zh-CN" ? "过滤中" : "Filtered"}</b>
              <p>{i18n.locale === "zh-CN" ? "当前查询没有命中复现包预览。" : "The current query did not match this export package preview."}</p>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ResearchRunExportPackageBrowserPanel({
  className,
  deepLinkStatus,
  evidenceSummary,
  i18n,
  isEvidenceReportCopied,
  isEvidenceSummaryCopied,
  isLoading,
  onCopyEvidenceReport,
  onCopyEvidenceSummary,
  onDownloadEvidenceReport,
  onRetryDeepLink,
  onQueryChange,
  query,
  rows
}: {
  className?: string;
  deepLinkStatus?: ImportAuditEvidenceDeepLinkStatus | null;
  evidenceSummary: AuditEvidenceSummary;
  i18n: AppI18n;
  isEvidenceReportCopied: boolean;
  isEvidenceSummaryCopied: boolean;
  isLoading: boolean;
  onCopyEvidenceReport: () => void;
  onCopyEvidenceSummary: () => void;
  onDownloadEvidenceReport: () => void;
  onRetryDeepLink?: () => void;
  onQueryChange: (query: string) => void;
  query: string;
  rows: ResearchRunExportBrowserRow[];
}) {
  const filteredRows = filterResearchRunExportBrowserRows(rows, query);
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const missingCount = rows.filter((row) => row.status === "missing").length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "复现包浏览器" : "Export Package Browser"}
      subtitle={
        i18n.locale === "zh-CN"
          ? "Manifest、integrity 与 artifact 数量校验"
          : "Manifest, integrity, and artifact count checks"
      }
      className={className}
      action={isLoading ? <RefreshCw className="spin" size={15} /> : undefined}
    >
      <div className="research-export-browser">
        <div className="research-export-browser-toolbar">
          <div className="research-export-browser-summary">
            <span>
              {i18n.locale === "zh-CN" ? "就绪" : "Ready"} <strong>{readyCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "缺失" : "Missing"} <strong>{missingCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "总项" : "Total"} <strong>{rows.length}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索复现包浏览器" : "Search export package browser"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索 manifest / exportPath / 状态" : "Search manifest / exportPath / status"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-audit-evidence-summary">
          <div>
            <span>{i18n.locale === "zh-CN" ? "审计摘要" : "Audit summary"}</span>
            <strong>{evidenceSummary.runId}</strong>
            <p>
              {i18n.locale === "zh-CN" ? "流水" : "Ledger"} {evidenceSummary.auditQuery || "-"} ·{" "}
              {i18n.locale === "zh-CN" ? "包命中" : "Package"} {evidenceSummary.packageMatchedCount}/
              {evidenceSummary.packageTotalCount} · {i18n.locale === "zh-CN" ? "Diff 阻断" : "Diff blocked"}{" "}
              {evidenceSummary.importDiffBlockedCount}
            </p>
            <em>
              {i18n.locale === "zh-CN" ? "当前焦点" : "Current focus"} {evidenceSummary.focusQuery || "-"} ·{" "}
              {i18n.locale === "zh-CN" ? "深链" : "Deep link"}{" "}
              {researchExportDeepLinkStatusLabel(i18n, evidenceSummary.deepLinkStatus)} ·{" "}
              {i18n.locale === "zh-CN" ? "验签" : "Verification"} {evidenceSummary.importVerificationVerifiedCount}/
              {evidenceSummary.importVerificationInvalidCount}
            </em>
          </div>
          <div className="research-audit-evidence-actions">
            <button onClick={onCopyEvidenceSummary} type="button">
              <Copy size={13} />
              {isEvidenceSummaryCopied
                ? i18n.locale === "zh-CN"
                  ? "已复制"
                  : "Copied"
                : i18n.locale === "zh-CN"
                  ? "复制摘要"
                  : "Copy summary"}
            </button>
            <button onClick={onCopyEvidenceReport} type="button">
              <Download size={13} />
              {isEvidenceReportCopied
                ? i18n.locale === "zh-CN"
                  ? "报告已复制"
                  : "Report copied"
                : i18n.locale === "zh-CN"
                  ? "复制报告"
                  : "Copy report"}
            </button>
            <button onClick={onDownloadEvidenceReport} type="button">
              <Download size={13} />
              {i18n.locale === "zh-CN" ? "下载报告" : "Download report"}
            </button>
          </div>
        </div>
        {deepLinkStatus ? (
          <div className={`research-export-deep-link ${deepLinkStatus.status}`}>
            <div>
              <span>{i18n.locale === "zh-CN" ? "审计深链" : "Audit deep link"}</span>
              <strong>{researchExportDeepLinkStatusLabel(i18n, deepLinkStatus.status)}</strong>
              <p>
                {deepLinkStatus.runId} · {deepLinkStatus.focusQuery}
              </p>
              {deepLinkStatus.error ? <em>{deepLinkStatus.error}</em> : null}
            </div>
            <button
              disabled={!onRetryDeepLink || deepLinkStatus.status === "loading" || isLoading}
              onClick={onRetryDeepLink}
              type="button"
            >
              <RefreshCw size={13} />
              {i18n.locale === "zh-CN" ? "重试" : "Retry"}
            </button>
          </div>
        ) : null}
        <div className="research-export-browser-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-export-browser-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{researchExportBrowserLabel(i18n, row)}</span>
                <strong>{researchExportBrowserDetail(i18n, row.detail)}</strong>
                <em>{row.value}</em>
                <small>{row.exportPath}</small>
                <b>{researchExportBrowserStatusLabel(i18n, row.status)}</b>
              </article>
            ))
          ) : (
            <article className="research-export-browser-row empty">
              <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
              <strong>{i18n.locale === "zh-CN" ? "清空搜索查看全部 manifest 项" : "Clear search to see every manifest item"}</strong>
              <em>-</em>
              <small>-</small>
              <b>{i18n.locale === "zh-CN" ? "过滤中" : "Filtered"}</b>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ResearchRunImportDiffPanel({
  className,
  i18n,
  isImporting = false,
  onCancelImport,
  onConfirmImport,
  onQueryChange,
  pendingFileName,
  query,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isImporting?: boolean;
  onCancelImport?: () => void;
  onConfirmImport?: () => void;
  onQueryChange: (query: string) => void;
  pendingFileName?: string | null;
  query: string;
  rows: ResearchRunImportDiffRow[];
}) {
  const filteredRows = filterResearchRunImportDiffRows(rows, query);
  const changeCount = rows.filter((row) => row.status === "change" || row.status === "replace").length;
  const addCount = rows.filter((row) => row.status === "add").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const canConfirmImport = Boolean(pendingFileName && onConfirmImport) && blockedCount === 0;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "导入影响预检" : "Import Impact Diff"}
      subtitle={i18n.locale === "zh-CN" ? "导入前对比当前工作区和复现包字段" : "Compare current workspace fields before import"}
      className={className}
    >
      <div className="research-import-diff">
        <div className="research-import-diff-toolbar">
          <div className="research-import-diff-summary">
            <span>
              {i18n.locale === "zh-CN" ? "变更" : "Changes"} <strong>{changeCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "新增" : "Adds"} <strong>{addCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "字段" : "Fields"} <strong>{rows.length}</strong>
            </span>
          </div>
          <div className="research-import-diff-actions">
            <span>{pendingFileName ?? (i18n.locale === "zh-CN" ? "未选择外部文件" : "No external file")}</span>
            <button disabled={!pendingFileName || isImporting} onClick={onCancelImport} type="button">
              {i18n.locale === "zh-CN" ? "取消" : "Cancel"}
            </button>
            <button disabled={!canConfirmImport || isImporting} onClick={onConfirmImport} type="button">
              {isImporting ? <RefreshCw className="spin" size={13} /> : <Upload size={13} />}
              {i18n.locale === "zh-CN" ? "确认导入" : "Apply import"}
            </button>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索导入差异" : "Search import diff"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索字段 / hash / exportPath / 状态" : "Search field / hash / exportPath / status"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-import-diff-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-import-diff-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{researchImportDiffLabel(i18n, row)}</span>
                <b>{researchImportDiffStatusLabel(i18n, row.status)}</b>
                <strong>{researchImportDiffValue(i18n, row.current)}</strong>
                <em>{researchImportDiffValue(i18n, row.incoming)}</em>
                <p>
                  {researchImportDiffDetail(i18n, row.detail)}
                  <small>{row.exportPath}</small>
                </p>
              </article>
            ))
          ) : (
            <article className="research-import-diff-row empty">
              <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
              <b>{i18n.locale === "zh-CN" ? "过滤中" : "Filtered"}</b>
              <strong>-</strong>
              <em>-</em>
              <p>{i18n.locale === "zh-CN" ? "当前查询没有命中导入差异字段。" : "The current query did not match any import diff fields."}</p>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function MarketDataRefreshOverrideAuditLedgerPanel({
  className,
  i18n,
  isLoading,
  onNextPage,
  onPreviousPage,
  onQueryChange,
  pagination,
  query,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isLoading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onQueryChange: (query: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
  rows: MarketDataRefreshOverrideAuditLedgerRow[];
}) {
  const summary = buildMarketDataRefreshOverrideAuditLedgerSummary(rows);
  const visibleRows = filterMarketDataRefreshOverrideAuditLedgerRows(rows, query);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + rows.length, pagination.total) : visibleRows.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${visibleRows.length}/${rows.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "行情覆盖审计" : "Refresh overrides"}
      subtitle={i18n.locale === "zh-CN" ? "provider 冷却期人工刷新覆盖流水" : "Manual refresh overrides during provider cooldown"}
      className={className}
    >
      <div className="market-refresh-audit">
        <div className="market-refresh-audit-toolbar">
          <div className="market-refresh-audit-summary">
            <span>
              {i18n.locale === "zh-CN" ? "覆盖审计" : "Overrides"} <strong>{summary.total}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已记录" : "Recorded"} <strong>{summary.recorded}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "实盘阻断" : "Live blocked"} <strong>{summary.liveBlocked}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "覆盖失败" : "Blocked"} <strong>{summary.blocked}</strong>
            </span>
            {summary.latestEventId ? (
              <span title={summary.latestReason}>
                {i18n.locale === "zh-CN" ? "最新" : "Latest"}{" "}
                <strong>
                  {summary.latestSymbol} · {summary.latestTimeframe}
                </strong>
              </span>
            ) : null}
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索行情覆盖审计" : "Search refresh override audit"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索代码 / 原因 / 操作员" : "Search symbol / reason / operator"}
            type="search"
            value={query}
          />
        </div>
        {pagination ? (
          <div className="market-refresh-audit-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="market-refresh-audit-list">
          {visibleRows.length ? (
            visibleRows.map((row) => (
              <article className={`market-refresh-audit-row ${row.tone}`} key={row.id}>
                <span>{marketRefreshOverrideAuditStatusLabel(i18n, row.statusLabel)}</span>
                <strong>
                  {row.name || row.symbol} · {row.symbol}
                  <small>
                    {i18n.marketLabel(row.market)} · {row.timeframe}
                  </small>
                </strong>
                <p>
                  <b>{row.overrideReason}</b>
                  <small>{row.detail}</small>
                  <em>{row.boundary}</em>
                </p>
                <div>
                  <small>
                    {row.operator || "local-operator"} · {row.actionScope || "manual_cache_refresh"}
                  </small>
                  <small>
                    {row.providerHealthStatus || "unknown"} · {row.providerHealthReason || "n/a"} ·{" "}
                    {row.retryAfterSeconds}s · {row.recentErrorCount}
                  </small>
                  <small>{row.affectedSymbolsLabel || row.affectedContextsLabel || "current market"}</small>
                  <time dateTime={row.createdAt}>{researchImportAuditTimeLabel(row.createdAt)}</time>
                  <em>{marketRefreshOverrideAuditLiveBoundaryLabel(i18n, row.liveTradingAllowed)}</em>
                </div>
              </article>
            ))
          ) : (
            <article className="market-refresh-audit-row empty">
              <span>{i18n.locale === "zh-CN" ? "无记录" : "No records"}</span>
              <strong>{i18n.locale === "zh-CN" ? "等待覆盖审计" : "Waiting for overrides"}</strong>
              <p>
                {i18n.locale === "zh-CN"
                  ? "冷却期人工覆盖会先写入这里，再放行一次刷新。"
                  : "Cooldown overrides are recorded here before one refresh is unlocked."}
              </p>
              <div>
                <small>{i18n.locale === "zh-CN" ? "非实盘授权" : "No live authorization"}</small>
              </div>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function marketRefreshOverrideAuditStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      "Override recorded": "覆盖已记录",
      "Override blocked": "覆盖被阻断"
    }[statusLabel] ?? statusLabel
  );
}

function marketRefreshOverrideAuditLiveBoundaryLabel(i18n: AppI18n, liveTradingAllowed: boolean): string {
  if (liveTradingAllowed) {
    return i18n.locale === "zh-CN" ? "实盘允许" : "Live allowed";
  }
  return i18n.locale === "zh-CN" ? "实盘阻断" : "Live blocked";
}

function AuditEvidenceReportLedgerPanel({
  className,
  i18n,
  isLoading,
  onNextPage,
  onCopyEvidenceLink,
  onOpenEvidenceLink,
  onPreviousPage,
  onQueryChange,
  onRevokeReport,
  onSignReport,
  onVerifyReport,
  pagination,
  query,
  rows,
  revokingEventId,
  signingEventId,
  verifyingEventId
}: {
  className?: string;
  i18n: AppI18n;
  isLoading: boolean;
  onNextPage: () => void;
  onCopyEvidenceLink: (search: string) => void;
  onOpenEvidenceLink: (search: string) => void;
  onPreviousPage: () => void;
  onQueryChange: (query: string) => void;
  onRevokeReport: (eventId: string) => void;
  onSignReport: (eventId: string) => void;
  onVerifyReport: (eventId: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
  rows: AuditEvidenceReportLedgerRow[];
  revokingEventId: string | null;
  signingEventId: string | null;
  verifyingEventId: string | null;
}) {
  const summary = buildAuditEvidenceReportLedgerSummary(rows);
  const visibleRows = filterAuditEvidenceReportLedgerRows(rows, query);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + rows.length, pagination.total) : visibleRows.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${visibleRows.length}/${rows.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "审计报告历史" : "Audit Report Ledger"}
      subtitle={i18n.locale === "zh-CN" ? "从后端账本回读 Markdown 报告 hash" : "Read report hashes back from the backend ledger"}
      className={className}
    >
      <div className="audit-report-ledger">
        <div className="audit-report-ledger-toolbar">
          <div className="audit-report-ledger-summary">
            <span>
              {i18n.locale === "zh-CN" ? "报告" : "Reports"} <strong>{summary.total}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已记录" : "Recorded"} <strong>{summary.ready}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "需签名" : "Signing chain"} <strong>{summary.signingEligible}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "审计辅助" : "Audit aids"} <strong>{summary.auditAid}</strong>
            </span>
            {summary.latestAuditAidRunId ? (
              <span title={summary.latestAuditAidEvidenceLink || summary.latestAuditAidEvidenceLabel}>
                {i18n.locale === "zh-CN" ? "最新辅助" : "Latest aid"}{" "}
                <strong>{summary.latestAuditAidRunId}</strong>
                {summary.latestAuditAidEvidenceLink ? (
                  <button onClick={() => onOpenEvidenceLink(summary.latestAuditAidEvidenceLink)} type="button">
                    {i18n.locale === "zh-CN" ? "打开最新辅助" : "Open latest aid"}
                  </button>
                ) : null}
                {summary.latestAuditAidEvidenceLink ? (
                  <button onClick={() => onCopyEvidenceLink(summary.latestAuditAidEvidenceLink)} type="button">
                    {i18n.locale === "zh-CN" ? "复制最新辅助" : "Copy latest aid"}
                  </button>
                ) : null}
                {summary.latestAuditAidPreflightLabel ? (
                  <span
                    className="audit-report-ledger-preflight"
                    title={summary.latestAuditAidPreflightActionId || summary.latestAuditAidPreflightState}
                  >
                    {i18n.locale === "zh-CN" ? "最新预检" : "Latest preflight"} ·{" "}
                    {summary.latestAuditAidPreflightLabel}
                  </span>
                ) : null}
                {summary.latestAuditAidPreflightActionLabel ? (
                  <span title={summary.latestAuditAidPreflightActionId}>
                    {i18n.locale === "zh-CN" ? "下一步" : "Next action"}{" "}
                    <strong>
                      {p0PaperExecutionPreflightActionLabel(i18n, summary.latestAuditAidPreflightActionLabel)}
                    </strong>
                  </span>
                ) : null}
                {summary.latestAuditAidPreflightAttention > 0 ? (
                  <span title={summary.latestAuditAidPreflightLabel}>
                    {i18n.locale === "zh-CN" ? "预检关注" : "Preflight attention"}{" "}
                    <strong>{summary.latestAuditAidPreflightAttention}</strong>
                  </span>
                ) : null}
              </span>
            ) : null}
            <span>
              {i18n.locale === "zh-CN" ? "未签名" : "Unsigned"} <strong>{summary.unsigned}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已签名" : "Signed"} <strong>{summary.signed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已验证" : "Verified"} <strong>{summary.verified}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "导入验签" : "Import verify"}{" "}
              <strong>
                {summary.importVerificationVerified}/{summary.importVerificationInvalid}
              </strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "需关注" : "Attention"} <strong>{summary.attention}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "最新" : "Latest"}{" "}
              {summary.latestReportLabel ? (
                <small title={summary.latestReportKind}>
                  {auditReportLedgerReportKindLabel(i18n, summary.latestReportLabel)}
                </small>
              ) : null}{" "}
              <strong>{summary.latestHash ? summary.latestHash.slice(0, 12) : "n/a"}</strong>
              {summary.latestReportQuery ? (
                <button onClick={() => onQueryChange(summary.latestReportQuery)} type="button">
                  {i18n.locale === "zh-CN" ? "定位最新" : "Focus latest"}
                </button>
              ) : null}
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索审计报告历史" : "Search audit report ledger"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索 run / hash / focus" : "Search run / hash / focus"}
            type="search"
            value={query}
          />
        </div>
        {pagination ? (
          <div className="audit-report-ledger-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="audit-report-ledger-list">
          {visibleRows.length ? (
            visibleRows.map((row) => (
              <article className={`audit-report-ledger-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{auditReportLedgerStatusLabel(i18n, row.statusLabel)}</span>
                <strong>
                  {row.fileName}
                  <small>{row.runId}</small>
                </strong>
                <p>
                  <b>{row.shortHash}</b>
                  <small>{row.detail}</small>
                  <em>
                    {row.reportKind === "backtest_report"
                      ? `${row.reportKind} · ${row.focusQuery || "focus:none"}`
                      : row.focusQuery || "focus:none"}
                  </em>
                  {row.evidenceLinkLabel ? (
                    <span className="audit-report-ledger-evidence" title={row.evidenceLinkDecodedSearch}>
                      {row.evidenceLinkLabel}
                    </span>
                  ) : null}
                  {row.paperPreflightLabel ? (
                    <span
                      className="audit-report-ledger-preflight"
                      title={row.paperPreflightActionId || row.paperPreflightState}
                    >
                      {row.paperPreflightLabel}
                    </span>
                  ) : null}
                </p>
                <em>
                  {row.packageMatched}/{row.packageTotal} · {row.importDiffBlocked}/{row.importDiffTotal}
                  {row.importVerificationDetail ? (
                    <span title={row.importVerificationDetail}>
                      {" "}
                      · {i18n.locale === "zh-CN" ? "导入验签" : "Import verify"} {row.importVerificationVerified}/
                      {row.importVerificationInvalid}
                    </span>
                  ) : null}
                </em>
                <div>
                  <small>{auditReportLedgerSignatureLabel(i18n, row.signatureLabel)}</small>
                  <small>
                    {auditReportLedgerSigningPolicyDetail(i18n, row) ||
                      (row.signatureStatus === "revoked" && row.signatureRevokedReason
                        ? row.signatureRevokedReason
                        : row.signatureDetail && row.chainId
                          ? `${row.signatureDetail} · ${row.chainId}`
                          : row.signatureDetail || row.chainId || row.signatureRevokedReason || row.signatureStatus)}
                  </small>
                  <time dateTime={row.signatureSignedAt || row.signatureVerifiedAt || row.createdAt}>
                    {researchImportAuditTimeLabel(row.signatureSignedAt || row.signatureVerifiedAt || row.createdAt)}
                  </time>
                  <span className="audit-report-ledger-actions">
                    {row.evidenceLinkSearch ? (
                      <button onClick={() => onOpenEvidenceLink(row.evidenceLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "打开证据" : "Open evidence"}
                      </button>
                    ) : null}
                    {row.evidenceLinkSearch ? (
                      <button onClick={() => onCopyEvidenceLink(row.evidenceLinkSearch)} type="button">
                        {i18n.locale === "zh-CN" ? "复制证据链接" : "Copy evidence link"}
                      </button>
                    ) : null}
                    <button
                      disabled={
                        signingEventId === row.id ||
                        verifyingEventId === row.id ||
                        revokingEventId === row.id ||
                        row.status === "invalid" ||
                        row.importVerificationInvalid > 0 ||
                        row.reportKind === "p0_readiness_report" ||
                        row.signatureStatus === "revoked"
                      }
                      onClick={() => onSignReport(row.id)}
                      type="button"
                    >
                      {signingEventId === row.id ? (i18n.locale === "zh-CN" ? "签名中" : "Signing") : i18n.locale === "zh-CN" ? "签名" : "Sign"}
                    </button>
                    <button
                      disabled={
                        signingEventId === row.id ||
                        verifyingEventId === row.id ||
                        revokingEventId === row.id ||
                        row.reportKind === "p0_readiness_report" ||
                        row.signatureStatus === "unsigned" ||
                        row.signatureStatus === "revoked"
                      }
                      onClick={() => onVerifyReport(row.id)}
                      type="button"
                    >
                      {verifyingEventId === row.id
                        ? i18n.locale === "zh-CN"
                          ? "验签中"
                          : "Verifying"
                        : i18n.locale === "zh-CN"
                          ? "验签"
                          : "Verify"}
                    </button>
                    <button
                      disabled={
                        signingEventId === row.id ||
                        verifyingEventId === row.id ||
                        revokingEventId === row.id ||
                        row.signatureStatus === "unsigned" ||
                        row.signatureStatus === "invalid" ||
                        row.reportKind === "p0_readiness_report" ||
                        row.signatureStatus === "revoked"
                      }
                      onClick={() => onRevokeReport(row.id)}
                      type="button"
                    >
                      {revokingEventId === row.id ? (i18n.locale === "zh-CN" ? "撤销中" : "Revoking") : i18n.locale === "zh-CN" ? "撤销" : "Revoke"}
                    </button>
                  </span>
                </div>
              </article>
            ))
          ) : (
            <article className="audit-report-ledger-row empty">
              <span>{i18n.locale === "zh-CN" ? "暂无报告" : "No reports"}</span>
              <strong>
                {i18n.locale === "zh-CN" ? "生成审计报告" : "Generate an audit report"}
                <small>{i18n.locale === "zh-CN" ? "下载或导出后会入账" : "Download or export writes to the ledger"}</small>
              </strong>
              <p>
                <b>hash:n/a</b>
                <small>
                  {i18n.locale === "zh-CN"
                    ? "报告历史会保留 SHA-256、焦点和导入 diff 摘要。"
                    : "Report history keeps SHA-256, focus, and import diff summary."}
                </small>
                <em>focus:none</em>
              </p>
              <em>0/0 · 0/0</em>
              <div>
                <small>{i18n.locale === "zh-CN" ? "等待报告" : "Awaiting report"}</small>
                <time>-</time>
              </div>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function auditReportLedgerSigningPolicyDetail(i18n: AppI18n, row: AuditEvidenceReportLedgerRow): string {
  if (row.reportKind === "p0_readiness_report") {
    return i18n.locale === "zh-CN"
      ? "P0 就绪报告只作为审计辅助材料入账，不进入签名链或实盘授权"
      : "P0 readiness reports are audit aids only; they do not enter the signing chain or live authorization";
  }
  if (row.importVerificationInvalid <= 0) {
    return "";
  }
  return i18n.locale === "zh-CN" ? "导入验签失败，需先更正证据再签名" : "Import verification failed; correct evidence before signing";
}

function AuditSigningKeyRegistryPanel({
  className,
  error,
  environmentBinding,
  environmentBindingConfirmations,
  environmentBindingError,
  environmentBindingMaterializationId,
  i18n,
  isApplyingRotation,
  isRecordingEnvironmentBinding,
  isRecordingRuntimeReloadExecution,
  isRecordingRuntimeReloadPlan,
  isRecordingRotationAcceptance,
  isPreparingRotation,
  isRecordingRestartEvidence,
  isRecordingSecretMaterialization,
  onApplyConfirmationChange,
  onApplyRotation,
  onEnvironmentBindingConfirmationChange,
  onPrepareRotation,
  onRecordEnvironmentBinding,
  onRecordRuntimeReloadExecution,
  onRecordRuntimeReloadPlan,
  onRecordRotationAcceptance,
  onRecordRestartEvidence,
  onRecordSecretMaterialization,
  onRotationAcceptanceConfirmationChange,
  onRuntimeReloadExecutionConfirmationChange,
  onRuntimeReloadPlanConfirmationChange,
  onRestartEvidenceConfirmationChange,
  onSecretMaterializationConfirmationChange,
  registry,
  restartEvidence,
  restartEvidenceApplyEventId,
  restartEvidenceConfirmations,
  restartEvidenceError,
  secretMaterialization,
  secretMaterializationConfirmations,
  secretMaterializationError,
  secretMaterializationPlanEventId,
  rotationApply,
  rotationApplyConfirmations,
  rotationApplyError,
  rotationError,
  rotationAcceptance,
  rotationAcceptanceConfirmations,
  rotationAcceptanceError,
  rotationAcceptanceExecutionId,
  rotationChainSummary,
  rotationHistoryRows,
  rotationHistoryState,
  rotationLedgerStatus,
  rotationPlan,
  runtimeReloadPlan,
  runtimeReloadPlanBindingId,
  runtimeReloadPlanConfirmations,
  runtimeReloadPlanError,
  runtimeReloadExecution,
  runtimeReloadExecutionConfirmations,
  runtimeReloadExecutionError,
  runtimeReloadExecutionPlanId,
  source
}: {
  className?: string;
  error?: string;
  environmentBinding?: AuditSigningKeyEnvironmentBinding;
  environmentBindingConfirmations: AuditSigningKeyEnvironmentBindingConfirmations;
  environmentBindingError?: string;
  environmentBindingMaterializationId: string | null;
  i18n: AppI18n;
  isApplyingRotation: boolean;
  isRecordingEnvironmentBinding: boolean;
  isRecordingRuntimeReloadExecution: boolean;
  isRecordingRuntimeReloadPlan: boolean;
  isRecordingRotationAcceptance: boolean;
  isPreparingRotation: boolean;
  isRecordingRestartEvidence: boolean;
  isRecordingSecretMaterialization: boolean;
  onApplyConfirmationChange: (field: keyof AuditSigningKeyRotationApplyConfirmations, value: boolean) => void;
  onApplyRotation: () => void;
  onEnvironmentBindingConfirmationChange: (
    field: keyof AuditSigningKeyEnvironmentBindingConfirmations,
    value: boolean
  ) => void;
  onPrepareRotation: () => void;
  onRecordEnvironmentBinding: () => void;
  onRecordRuntimeReloadExecution: () => void;
  onRecordRuntimeReloadPlan: () => void;
  onRecordRotationAcceptance: () => void;
  onRecordRestartEvidence: () => void;
  onRecordSecretMaterialization: () => void;
  onRotationAcceptanceConfirmationChange: (
    field: keyof AuditSigningKeyRotationAcceptanceConfirmations,
    value: boolean
  ) => void;
  onRuntimeReloadExecutionConfirmationChange: (
    field: keyof AuditSigningKeyRuntimeReloadExecutionConfirmations,
    value: boolean
  ) => void;
  onRuntimeReloadPlanConfirmationChange: (
    field: keyof AuditSigningKeyRuntimeReloadPlanConfirmations,
    value: boolean
  ) => void;
  onRestartEvidenceConfirmationChange: (field: keyof AuditSigningKeyRestartEvidenceConfirmations, value: boolean) => void;
  onSecretMaterializationConfirmationChange: (
    field: keyof AuditSigningKeySecretMaterializationConfirmations,
    value: boolean
  ) => void;
  registry?: AuditSigningKeyRegistry;
  restartEvidence?: AuditSigningKeyControlledRestartEvidence;
  restartEvidenceApplyEventId: string | null;
  restartEvidenceConfirmations: AuditSigningKeyRestartEvidenceConfirmations;
  restartEvidenceError?: string;
  secretMaterialization?: AuditSigningKeySecretMaterialization;
  secretMaterializationConfirmations: AuditSigningKeySecretMaterializationConfirmations;
  secretMaterializationError?: string;
  secretMaterializationPlanEventId: string | null;
  rotationApply?: AuditSigningKeyRotationApply;
  rotationApplyConfirmations: AuditSigningKeyRotationApplyConfirmations;
  rotationApplyError?: string;
  rotationError?: string;
  rotationAcceptance?: AuditSigningKeyRotationAcceptance;
  rotationAcceptanceConfirmations: AuditSigningKeyRotationAcceptanceConfirmations;
  rotationAcceptanceError?: string;
  rotationAcceptanceExecutionId: string | null;
  rotationChainSummary: AuditSigningKeyRotationChainSummary;
  rotationHistoryRows: AuditSigningKeyRotationLedgerRow[];
  rotationHistoryState: "loading" | "ready";
  rotationLedgerStatus: AuditSigningKeyRotationLedgerStatus;
  rotationPlan?: AuditSigningKeyRotationPlan;
  runtimeReloadPlan?: AuditSigningKeyRuntimeReloadPlan;
  runtimeReloadPlanBindingId: string | null;
  runtimeReloadPlanConfirmations: AuditSigningKeyRuntimeReloadPlanConfirmations;
  runtimeReloadPlanError?: string;
  runtimeReloadExecution?: AuditSigningKeyRuntimeReloadExecution;
  runtimeReloadExecutionConfirmations: AuditSigningKeyRuntimeReloadExecutionConfirmations;
  runtimeReloadExecutionError?: string;
  runtimeReloadExecutionPlanId: string | null;
  source: AuditSigningKeyRegistryResult["source"];
}) {
  const activeKey = registry?.keys.find((key) => key.keyId === registry.activeKeyId) ?? registry?.keys[0] ?? null;
  const verifiableCount = registry?.keys.filter((key) => key.canVerify).length ?? 0;
  const statusCopy =
    source === "core"
      ? i18n.locale === "zh-CN"
        ? "核心服务"
        : "Core service"
      : i18n.locale === "zh-CN"
        ? "离线快照"
        : "Offline";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "签名 Key 注册表" : "Signing Key Registry"}
      subtitle={i18n.locale === "zh-CN" ? "审计报告验签与历史 key 追溯" : "Audit report verification and legacy key traceability"}
      className={className}
      action={
        <button className="compact-action" disabled={isPreparingRotation} onClick={onPrepareRotation} type="button">
          {isPreparingRotation ? <RefreshCw className="spin" size={13} /> : <GitBranch size={13} />}
          {i18n.locale === "zh-CN" ? "生成轮换计划" : "Prepare rotation"}
        </button>
      }
    >
      <div className="audit-signing-keys">
        <div className="audit-signing-key-grid">
          <article className={`audit-signing-key-summary ${registry?.rotationRequired ? "warning" : "positive"}`}>
            <span>{i18n.locale === "zh-CN" ? "活跃 Key" : "Active key"}</span>
            <strong>{activeKey?.keyId ?? "n/a"}</strong>
            <p>
              {activeKey
                ? `${auditSigningKeyStatusLabel(i18n, activeKey.status)} · ${activeKey.fingerprint}`
                : i18n.locale === "zh-CN"
                  ? "等待核心服务返回注册表"
                  : "Awaiting registry from core"}
            </p>
          </article>
          <article className={`audit-signing-key-summary ${registry?.rotationRequired ? "risk" : "neutral"}`}>
            <span>{i18n.locale === "zh-CN" ? "轮换状态" : "Rotation"}</span>
            <strong>
              {registry?.rotationRequired
                ? i18n.locale === "zh-CN"
                  ? "需要轮换"
                  : "Required"
                : i18n.locale === "zh-CN"
                  ? "已配置"
                  : "Configured"}
            </strong>
            <p>
              {i18n.locale === "zh-CN"
                ? `${verifiableCount} 个 key 可验签 · ${statusCopy}`
                : `${verifiableCount} verifiable keys · ${statusCopy}`}
            </p>
          </article>
        </div>
        <div className="audit-signing-key-list">
          {registry?.keys.length ? (
            registry.keys.map((key) => (
              <article className={`audit-signing-key-row ${key.status}`} key={key.keyId}>
                <span>{auditSigningKeyStatusLabel(i18n, key.status)}</span>
                <strong>{key.keyId}</strong>
                <em>{key.fingerprint}</em>
                <small>{key.chainId}</small>
                <b>{auditSigningKeyCapabilityLabel(i18n, key.canSign, key.canVerify)}</b>
              </article>
            ))
          ) : (
            <article className="audit-signing-key-row empty">
              <span>{i18n.locale === "zh-CN" ? "未连接" : "Disconnected"}</span>
              <strong>{i18n.locale === "zh-CN" ? "暂无注册表" : "No registry"}</strong>
              <em>fingerprint:n/a</em>
              <small>{error ?? (i18n.locale === "zh-CN" ? "核心服务未返回签名 key 状态。" : "Core did not return signing key state.")}</small>
              <b>{statusCopy}</b>
            </article>
          )}
        </div>
        <div className={`audit-signing-key-rotation-chain ${rotationChainSummary.state}`}>
          <div className="audit-signing-key-rotation-chain-head">
            <span>{i18n.locale === "zh-CN" ? "轮换证据链" : "Rotation evidence chain"}</span>
            <strong>{auditSigningKeyRotationChainHeadline(i18n, rotationChainSummary)}</strong>
            <p>{auditSigningKeyRotationChainDetail(i18n, rotationChainSummary)}</p>
          </div>
          <div className="audit-signing-key-rotation-chain-stages">
            {rotationChainSummary.stages.map((stage) => (
              <article className={`audit-signing-key-rotation-chain-stage ${stage.status}`} key={stage.id}>
                <span>{auditSigningKeyRotationChainStageStatusLabel(i18n, stage.status)}</span>
                <strong>{auditSigningKeyRotationChainStageLabel(i18n, stage.id, stage.label)}</strong>
                <small>{stage.rowId || (i18n.locale === "zh-CN" ? "等待证据入账" : "Awaiting evidence")}</small>
                <b>{stage.createdAt ? formatChartDate(stage.createdAt) : "n/a"}</b>
              </article>
            ))}
          </div>
        </div>
        <div className="audit-signing-key-rotation-history">
          <div className="audit-signing-key-rotation-history-head">
            <span>{i18n.locale === "zh-CN" ? "轮换历史" : "Rotation history"}</span>
            <strong>
              {rotationHistoryState === "loading"
                ? i18n.locale === "zh-CN"
                  ? "读取中"
                  : "Loading"
                : `${rotationHistoryRows.length}`}
            </strong>
          </div>
          {rotationHistoryRows.length ? (
            rotationHistoryRows.map((row) => (
              <article className={`audit-signing-key-rotation-history-row ${row.tone}`} key={row.id}>
                <span>{auditSigningKeyRotationLedgerRowStatusLabel(i18n, row.statusLabel)}</span>
                <strong>{row.proposedKeyId || "n/a"}</strong>
                <em>{row.eventKind === "plan" ? row.templateShortHash : row.applyMode || row.eventKind}</em>
                <small>{row.blockedReasonLabel}</small>
                <b>
                  {row.eventKind === "plan"
                    ? i18n.locale === "zh-CN"
                      ? `${row.environmentUpdateCount} 变量 / ${row.stepCount} 步`
                      : `${row.environmentUpdateCount} vars / ${row.stepCount} steps`
                    : i18n.locale === "zh-CN"
                      ? `${row.confirmedConfirmationCount}/${row.stepCount} 确认`
                      : `${row.confirmedConfirmationCount}/${row.stepCount} checks`}
                </b>
              </article>
            ))
          ) : (
            <article className="audit-signing-key-rotation-history-row empty">
              <span>{i18n.locale === "zh-CN" ? "暂无历史" : "No history"}</span>
              <strong>{i18n.locale === "zh-CN" ? "等待轮换计划入账" : "Awaiting ledger event"}</strong>
              <em>hash:n/a</em>
              <small>{i18n.locale === "zh-CN" ? "生成计划后会自动回读。" : "History appears after a plan is saved."}</small>
              <b>0</b>
            </article>
          )}
        </div>
        {rotationPlan ? (
          <div className="audit-signing-key-rotation-plan">
            {rotationLedgerStatus.state !== "idle" ? (
              <div className={`audit-signing-key-rotation-ledger ${rotationLedgerStatus.state}`}>
                <span>
                  {rotationLedgerStatusLabel(i18n, rotationLedgerStatus.state)}
                </span>
                <strong>{rotationLedgerStatus.detail || (i18n.locale === "zh-CN" ? "等待审计账本返回" : "Awaiting ledger")}</strong>
              </div>
            ) : null}
            <div className="audit-signing-key-rotation-head">
              <span>{i18n.locale === "zh-CN" ? "轮换计划" : "Rotation plan"}</span>
              <strong>{rotationPlan.proposedActiveKey.keyId}</strong>
              <small>
                {rotationPlan.requiresRestart
                  ? i18n.locale === "zh-CN"
                    ? "需要重启核心服务"
                    : "Core restart required"
                  : i18n.locale === "zh-CN"
                    ? "无需重启"
                    : "No restart required"}
              </small>
            </div>
            <div className="audit-signing-key-env-list">
              {rotationPlan.environmentUpdates.map((update) => (
                <article className={`audit-signing-key-env-row ${update.sensitivity}`} key={update.name}>
                  <span>{update.name}</span>
                  <code>{update.value}</code>
                  <em>{update.sensitivity === "secret" ? (i18n.locale === "zh-CN" ? "本地填写" : "Fill locally") : i18n.locale === "zh-CN" ? "可复制" : "Public"}</em>
                </article>
              ))}
            </div>
            <div className="audit-signing-key-rotation-steps">
              {rotationPlan.steps.map((step) => (
                <article className={`audit-signing-key-step ${step.status}`} key={step.id}>
                  <span>{step.status}</span>
                  <strong>{auditSigningKeyRotationStepTitle(i18n, step.title)}</strong>
                  <p>{auditSigningKeyRotationStepDetail(i18n, step.detail)}</p>
                </article>
              ))}
            </div>
            <pre>{rotationPlan.legacyRegistryTemplate}</pre>
            <div className="audit-signing-key-secret-materialization">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "Secret-store 物化清单" : "Secret-store materialization"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录本地清单，不传 secret"
                    : "Record local manifest only, no secret"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={secretMaterializationConfirmations.localSecretStoreWriteVerified}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange(
                        "localSecretStoreWriteVerified",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "本地 secret-store 写入已核验" : "Local secret-store write verified"}</span>
                </label>
                <label>
                  <input
                    checked={secretMaterializationConfirmations.noRawSecretInPayload}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange("noRawSecretInPayload", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "payload 不含 raw secret" : "Payload contains no raw secret"}</span>
                </label>
                <label>
                  <input
                    checked={secretMaterializationConfirmations.envBindingPlanDocumented}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange("envBindingPlanDocumented", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "环境绑定计划已记录" : "Environment binding plan documented"}</span>
                </label>
                <label>
                  <input
                    checked={secretMaterializationConfirmations.rollbackPlanDocumented}
                    onChange={(event) =>
                      onSecretMaterializationConfirmationChange("rollbackPlanDocumented", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚计划已记录" : "Rollback plan documented"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingSecretMaterialization || !secretMaterializationPlanEventId}
                onClick={onRecordSecretMaterialization}
                type="button"
              >
                {isRecordingSecretMaterialization ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录物化清单" : "Record materialization"}
              </button>
              {secretMaterialization ? (
                <div className={`audit-signing-key-rotation-apply-result ${secretMaterialization.status}`}>
                  <span>{auditSigningKeySecretMaterializationStatusLabel(i18n, secretMaterialization.status)}</span>
                  <strong>{secretMaterialization.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {secretMaterialization.blockedReasons.length
                      ? secretMaterialization.blockedReasons
                          .map((reason) => auditSigningKeySecretMaterializationReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "清单已入账，实盘仍保持阻断"
                        : "Manifest recorded; live remains blocked"}
                  </small>
                  <em>{secretMaterialization.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {secretMaterializationError ? <p className="audit-signing-key-error">{secretMaterializationError}</p> : null}
            </div>
            <div className="audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "环境绑定证据" : "Environment binding evidence"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录运行映射，不写 env"
                    : "Record runtime mapping only, no env write"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={environmentBindingConfirmations.runtimeEnvMappingVerified}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange(
                        "runtimeEnvMappingVerified",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "运行环境映射已核验" : "Runtime env mapping verified"}</span>
                </label>
                <label>
                  <input
                    checked={environmentBindingConfirmations.configReloadPlanDocumented}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange(
                        "configReloadPlanDocumented",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "配置重载计划已记录" : "Config reload plan documented"}</span>
                </label>
                <label>
                  <input
                    checked={environmentBindingConfirmations.noRawSecretInPayload}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange("noRawSecretInPayload", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "payload 不含 raw secret" : "Payload contains no raw secret"}</span>
                </label>
                <label>
                  <input
                    checked={environmentBindingConfirmations.rollbackSnapshotRecorded}
                    onChange={(event) =>
                      onEnvironmentBindingConfirmationChange(
                        "rollbackSnapshotRecorded",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚快照已记录" : "Rollback snapshot recorded"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingEnvironmentBinding || !environmentBindingMaterializationId}
                onClick={onRecordEnvironmentBinding}
                type="button"
              >
                {isRecordingEnvironmentBinding ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录环境绑定" : "Record binding"}
              </button>
              {environmentBinding ? (
                <div className={`audit-signing-key-rotation-apply-result ${environmentBinding.status}`}>
                  <span>{auditSigningKeyEnvironmentBindingStatusLabel(i18n, environmentBinding.status)}</span>
                  <strong>{environmentBinding.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {environmentBinding.blockedReasons.length
                      ? environmentBinding.blockedReasons
                          .map((reason) => auditSigningKeyEnvironmentBindingReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "环境绑定已入账，仍需受控重载"
                        : "Binding recorded; controlled reload still required"}
                  </small>
                  <em>{environmentBinding.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {environmentBindingError ? <p className="audit-signing-key-error">{environmentBindingError}</p> : null}
            </div>
            <div className="audit-signing-key-runtime-reload-plan audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "运行时重载计划" : "Runtime reload plan"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录计划，不重启容器"
                    : "Record plan only, no container restart"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.maintenanceWindowApproved}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange(
                        "maintenanceWindowApproved",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "维护窗口已批准" : "Maintenance window approved"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.healthBaselineCaptured}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange("healthBaselineCaptured", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载前健康基线已捕获" : "Pre-reload health baseline captured"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.configDiffReviewed}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange("configDiffReviewed", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "配置 diff 已复核" : "Configuration diff reviewed"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.postReloadSmokePlanDocumented}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange(
                        "postReloadSmokePlanDocumented",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载后 smoke 计划已记录" : "Post-reload smoke plan documented"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadPlanConfirmations.rollbackOwnerAssigned}
                    onChange={(event) =>
                      onRuntimeReloadPlanConfirmationChange("rollbackOwnerAssigned", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚负责人已指定" : "Rollback owner assigned"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingRuntimeReloadPlan || !runtimeReloadPlanBindingId}
                onClick={onRecordRuntimeReloadPlan}
                type="button"
              >
                {isRecordingRuntimeReloadPlan ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录重载计划" : "Record reload plan"}
              </button>
              {runtimeReloadPlan ? (
                <div className={`audit-signing-key-rotation-apply-result ${runtimeReloadPlan.status}`}>
                  <span>{auditSigningKeyRuntimeReloadPlanStatusLabel(i18n, runtimeReloadPlan.status)}</span>
                  <strong>{runtimeReloadPlan.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {runtimeReloadPlan.blockedReasons.length
                      ? runtimeReloadPlan.blockedReasons
                          .map((reason) => auditSigningKeyRuntimeReloadPlanReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "重载计划已入账，仍不执行重启"
                        : "Reload plan recorded; restart is still manual"}
                  </small>
                  <em>{runtimeReloadPlan.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {runtimeReloadPlanError ? <p className="audit-signing-key-error">{runtimeReloadPlanError}</p> : null}
            </div>
            <div className="audit-signing-key-runtime-reload-execution audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "运行时重载执行证据" : "Runtime reload execution evidence"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录执行证据，不执行重启"
                    : "Record execution evidence only, no restart"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.preReloadHealthVerified}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange(
                        "preReloadHealthVerified",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载前健康已复核" : "Pre-reload health verified"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.reloadActionRecorded}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange("reloadActionRecorded", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载动作已记录" : "Reload action recorded"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.postReloadSmokePassed}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange("postReloadSmokePassed", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "重载后 smoke 已通过" : "Post-reload smoke passed"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.rollbackReadinessConfirmed}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange(
                        "rollbackReadinessConfirmed",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚就绪已确认" : "Rollback readiness confirmed"}</span>
                </label>
                <label>
                  <input
                    checked={runtimeReloadExecutionConfirmations.operatorConfirmedLiveBlocked}
                    onChange={(event) =>
                      onRuntimeReloadExecutionConfirmationChange(
                        "operatorConfirmedLiveBlocked",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "操作员确认实盘仍阻断" : "Operator confirmed live remains blocked"}</span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingRuntimeReloadExecution || !runtimeReloadExecutionPlanId}
                onClick={onRecordRuntimeReloadExecution}
                type="button"
              >
                {isRecordingRuntimeReloadExecution ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录执行证据" : "Record execution evidence"}
              </button>
              {runtimeReloadExecution ? (
                <div className={`audit-signing-key-rotation-apply-result ${runtimeReloadExecution.status}`}>
                  <span>{auditSigningKeyRuntimeReloadExecutionStatusLabel(i18n, runtimeReloadExecution.status)}</span>
                  <strong>{runtimeReloadExecution.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {runtimeReloadExecution.blockedReasons.length
                      ? runtimeReloadExecution.blockedReasons
                          .map((reason) => auditSigningKeyRuntimeReloadExecutionReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "执行证据已入账，仍不启用新 key"
                        : "Execution evidence recorded; key activation remains blocked"}
                  </small>
                  <em>{runtimeReloadExecution.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {runtimeReloadExecutionError ? (
                <p className="audit-signing-key-error">{runtimeReloadExecutionError}</p>
              ) : null}
            </div>
            <div className="audit-signing-key-rotation-acceptance audit-signing-key-environment-binding">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "最终验收闸门" : "Final acceptance gate"}</span>
                <strong>
                  {i18n.locale === "zh-CN"
                    ? "只记录人工验收，不启用新 key"
                    : "Record acceptance only, no key activation"}
                </strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.executionEvidenceReviewed}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange(
                        "executionEvidenceReviewed",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "执行证据已复核" : "Execution evidence reviewed"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.signatureProbeVerified}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange("signatureProbeVerified", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "签名探针已验证" : "Signature probe verified"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.legacyVerificationConfirmed}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange(
                        "legacyVerificationConfirmed",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "历史报告验签已确认" : "Legacy verification confirmed"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.rollbackWindowStillOpen}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange("rollbackWindowStillOpen", event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "回滚窗口仍开放" : "Rollback window still open"}</span>
                </label>
                <label>
                  <input
                    checked={rotationAcceptanceConfirmations.operatorConfirmedActivationBlocked}
                    onChange={(event) =>
                      onRotationAcceptanceConfirmationChange(
                        "operatorConfirmedActivationBlocked",
                        event.currentTarget.checked
                      )
                    }
                    type="checkbox"
                  />
                  <span>
                    {i18n.locale === "zh-CN"
                      ? "操作员确认新 key 仍阻断"
                      : "Operator confirmed activation remains blocked"}
                  </span>
                </label>
              </div>
              <button
                className="compact-action"
                disabled={isRecordingRotationAcceptance || !rotationAcceptanceExecutionId}
                onClick={onRecordRotationAcceptance}
                type="button"
              >
                {isRecordingRotationAcceptance ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "记录最终验收" : "Record acceptance"}
              </button>
              {rotationAcceptance ? (
                <div className={`audit-signing-key-rotation-apply-result ${rotationAcceptance.status}`}>
                  <span>{auditSigningKeyRotationAcceptanceStatusLabel(i18n, rotationAcceptance.status)}</span>
                  <strong>{rotationAcceptance.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {rotationAcceptance.blockedReasons.length
                      ? rotationAcceptance.blockedReasons
                          .map((reason) => auditSigningKeyRotationAcceptanceReasonLabel(i18n, reason))
                          .join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "最终验收已入账，新 key 仍未启用"
                        : "Acceptance recorded; new key remains inactive"}
                  </small>
                  <em>{rotationAcceptance.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                </div>
              ) : null}
              {rotationAcceptanceError ? (
                <p className="audit-signing-key-error">{rotationAcceptanceError}</p>
              ) : null}
            </div>
            <div className="audit-signing-key-rotation-apply">
              <div className="audit-signing-key-rotation-apply-head">
                <span>{i18n.locale === "zh-CN" ? "应用预检" : "Apply preflight"}</span>
                <strong>{i18n.locale === "zh-CN" ? "只检查，不写入 secret" : "Check only, no secret write"}</strong>
              </div>
              <div className="audit-signing-key-rotation-apply-checks">
                <label>
                  <input
                    checked={rotationApplyConfirmations.newSecretMaterialStored}
                    onChange={(event) => onApplyConfirmationChange("newSecretMaterialStored", event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "新 secret 已在本地安全保存" : "New secret stored locally"}</span>
                </label>
                <label>
                  <input
                    checked={rotationApplyConfirmations.legacySecretStored}
                    onChange={(event) => onApplyConfirmationChange("legacySecretStored", event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "当前 secret 已写入 legacy 注册表" : "Current secret stored in legacy registry"}</span>
                </label>
                <label>
                  <input
                    checked={rotationApplyConfirmations.operatorReviewedPlan}
                    onChange={(event) => onApplyConfirmationChange("operatorReviewedPlan", event.currentTarget.checked)}
                    type="checkbox"
                  />
                  <span>{i18n.locale === "zh-CN" ? "已人工复核 key、指纹和重启影响" : "Operator reviewed key, fingerprint, restart impact"}</span>
                </label>
              </div>
              <button className="compact-action" disabled={isApplyingRotation} onClick={onApplyRotation} type="button">
                {isApplyingRotation ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                {i18n.locale === "zh-CN" ? "提交应用预检" : "Run apply preflight"}
              </button>
              {rotationApply ? (
                <div className={`audit-signing-key-rotation-apply-result ${rotationApply.status}`}>
                  <span>{auditSigningKeyRotationApplyStatusLabel(i18n, rotationApply.status)}</span>
                  <strong>{rotationApply.proposedActiveKeyId || "n/a"}</strong>
                  <small>
                    {rotationApply.blockedReasons.length
                      ? rotationApply.blockedReasons.map((reason) => auditSigningKeyRotationApplyReasonLabel(i18n, reason)).join(" / ")
                      : i18n.locale === "zh-CN"
                        ? "可进入本地重启流程"
                        : "Ready for local restart"}
                  </small>
                  <em>
                    {i18n.locale === "zh-CN"
                      ? `${rotationApply.secretPlaceholderNames.length} 个本地 secret 项`
                      : `${rotationApply.secretPlaceholderNames.length} local secret items`}
                  </em>
                </div>
              ) : null}
              {rotationApply?.status === "ready_for_restart" || restartEvidence ? (
                <div className="audit-signing-key-restart-evidence">
                  <div className="audit-signing-key-rotation-apply-head">
                    <span>{i18n.locale === "zh-CN" ? "受控重启证据" : "Controlled restart evidence"}</span>
                    <strong>
                      {i18n.locale === "zh-CN"
                        ? "记录证据，仍不放行 live"
                        : "Record evidence, live remains blocked"}
                    </strong>
                  </div>
                  <div className="audit-signing-key-rotation-apply-checks">
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.restartWindowExecuted}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("restartWindowExecuted", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "受控重启窗口已执行" : "Restart window executed"}</span>
                    </label>
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.rollbackPlanConfirmed}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("rollbackPlanConfirmed", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "回滚计划已确认" : "Rollback plan confirmed"}</span>
                    </label>
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.postRestartValidationPassed}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("postRestartValidationPassed", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "重启后验收已通过" : "Post-restart validation passed"}</span>
                    </label>
                    <label>
                      <input
                        checked={restartEvidenceConfirmations.operatorReviewedRestartLogs}
                        onChange={(event) =>
                          onRestartEvidenceConfirmationChange("operatorReviewedRestartLogs", event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? "操作员已复核重启日志" : "Operator reviewed restart logs"}</span>
                    </label>
                  </div>
                  <button
                    className="compact-action"
                    disabled={isRecordingRestartEvidence || !restartEvidenceApplyEventId}
                    onClick={onRecordRestartEvidence}
                    type="button"
                  >
                    {isRecordingRestartEvidence ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
                    {i18n.locale === "zh-CN" ? "记录重启证据" : "Record restart evidence"}
                  </button>
                  {restartEvidence ? (
                    <div className={`audit-signing-key-rotation-apply-result ${restartEvidence.status}`}>
                      <span>{auditSigningKeyRestartEvidenceStatusLabel(i18n, restartEvidence.status)}</span>
                      <strong>{restartEvidence.proposedActiveKeyId || "n/a"}</strong>
                      <small>
                        {restartEvidence.blockedReasons.length
                          ? restartEvidence.blockedReasons
                              .map((reason) => auditSigningKeyRestartEvidenceReasonLabel(i18n, reason))
                              .join(" / ")
                          : i18n.locale === "zh-CN"
                            ? "证据已入账，实盘仍保持阻断"
                            : "Evidence recorded; live remains blocked"}
                      </small>
                      <em>{restartEvidence.liveTradingAllowed ? "live=true" : "live=false / paper-only"}</em>
                    </div>
                  ) : null}
                  {restartEvidenceError ? <p className="audit-signing-key-error">{restartEvidenceError}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {rotationApplyError ? <p className="audit-signing-key-error">{rotationApplyError}</p> : null}
        {rotationError ? <p className="audit-signing-key-error">{rotationError}</p> : null}
        {error ? <p className="audit-signing-key-error">{error}</p> : null}
      </div>
    </Panel>
  );
}

function ResearchRunImportAuditEventPanel({
  className,
  copiedEvidenceEventId,
  events,
  focusedEventId,
  i18n,
  isLoading,
  onCopyEvidenceAnchor,
  onInspectRunPackage,
  onNextPage,
  onPreviousPage,
  onQueryChange,
  onReplayRollbackRun,
  onUndoImport,
  pagination,
  query
}: {
  className?: string;
  copiedEvidenceEventId: string | null;
  events: ResearchRunImportAuditEvent[];
  focusedEventId: string | null;
  i18n: AppI18n;
  isLoading: boolean;
  onCopyEvidenceAnchor: (event: ResearchRunImportAuditEvent) => void;
  onInspectRunPackage: (event: ResearchRunImportAuditEvent) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onQueryChange: (query: string) => void;
  onReplayRollbackRun: (runId: string) => void;
  onUndoImport: (undoToken: string, expectedRunId: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
}) {
  const [stageFilter, setStageFilter] = useState<ResearchRunImportAuditFilter>("all");
  const [pendingImportUndoToken, setPendingImportUndoToken] = useState<string | null>(null);
  const focusedEventRef = useRef<HTMLElement | null>(null);
  const aggregation = buildResearchRunImportAuditAggregation(events);
  const filteredEvents = filterResearchRunImportAuditEvents(events, "", stageFilter);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + events.length, pagination.total) : filteredEvents.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${filteredEvents.length}/${events.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);
  const filters: Array<{ id: ResearchRunImportAuditFilter; label: string; count: number }> = [
    { id: "all", label: i18n.locale === "zh-CN" ? "全部" : "All", count: aggregation.total },
    { id: "needs-review", label: i18n.locale === "zh-CN" ? "待复核" : "Needs review", count: aggregation.needsReview },
    { id: "undoable", label: i18n.locale === "zh-CN" ? "可撤销" : "Undoable", count: aggregation.undoable },
    { id: "recoverable", label: i18n.locale === "zh-CN" ? "可恢复" : "Recoverable", count: aggregation.recoverable },
    { id: "undone", label: i18n.locale === "zh-CN" ? "已撤销" : "Undone", count: aggregation.undone }
  ];

  useEffect(() => {
    if (!focusedEventId) {
      return;
    }
    focusedEventRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusedEventId, filteredEvents.length, stageFilter]);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "导入审计流水" : "Import Audit Ledger"}
      subtitle={i18n.locale === "zh-CN" ? "记录外部复现包的预检、阻断、确认和失败" : "Track preflight, blocked, applied, and failed imports"}
      className={className}
    >
      <div className="research-import-events">
        <div className="research-import-events-toolbar">
          <div className="research-import-events-summary">
            <span>
              {i18n.locale === "zh-CN" ? "已确认" : "Applied"} <strong>{aggregation.confirmed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{aggregation.blocked}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "失败" : "Failed"} <strong>{aggregation.failed + aggregation.undoFailed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "撤销失败" : "Undo failed"} <strong>{aggregation.undoFailed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "事件" : "Events"} <strong>{aggregation.total}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索导入审计流水" : "Search import audit ledger"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索文件 / run / contract / exportPath" : "Search file / run / contract / exportPath"}
            type="search"
            value={query}
          />
        </div>
        {pagination ? (
          <div className="research-import-events-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="research-import-events-filters" aria-label={i18n.locale === "zh-CN" ? "导入审计阶段筛选" : "Import audit stage filters"}>
          {filters.map((filter) => (
            <button
              data-active={stageFilter === filter.id}
              key={filter.id}
              onClick={() => setStageFilter(filter.id)}
              type="button"
            >
              <span>{filter.label}</span>
              <strong>{filter.count}</strong>
            </button>
          ))}
        </div>
        {aggregation.failureBuckets.length || aggregation.blockedEvidenceBuckets.length || aggregation.verifiedReportSignatureBuckets.length ? (
          <div className="research-import-failure-buckets">
            {aggregation.failureBuckets.map((bucket) => (
              <article className={`research-import-failure-bucket ${bucket.tone}`} key={bucket.category}>
                <span>{researchImportAuditFailureBucketLabel(i18n, bucket)}</span>
                <strong>{bucket.count}</strong>
                <small>
                  {bucket.latestFileName} · {bucket.latestRunId}
                </small>
                <p>{researchImportAuditRecoveryLabel(i18n, bucket.recoveryHint)}</p>
              </article>
            ))}
            {aggregation.blockedEvidenceBuckets.map((bucket) => (
              <article className={`research-import-failure-bucket ${bucket.tone}`} key={`blocked-${bucket.category}`}>
                <span>{researchImportBlockedEvidenceBucketLabel(i18n, bucket)}</span>
                <strong>{bucket.count}</strong>
                <small>
                  {bucket.latestFileName} · {bucket.latestRunId}
                </small>
                <p>
                  {bucket.latestExportPath} · {bucket.latestDetail}
                </p>
              </article>
            ))}
            {aggregation.verifiedReportSignatureBuckets.map((bucket) => (
              <article
                className={`research-import-failure-bucket research-import-verification-bucket ${bucket.tone}`}
                key={`verified-${bucket.status}`}
              >
                <span>{researchImportVerifiedReportSignatureBucketLabel(i18n, bucket)}</span>
                <strong>{bucket.count}</strong>
                <small>
                  {bucket.latestFileName} · {bucket.latestRunId}
                </small>
                <p>
                  {bucket.latestExportPath} · {bucket.latestReason}
                </p>
              </article>
            ))}
          </div>
        ) : null}
        <div className="research-import-events-list">
          {filteredEvents.length ? (
            filteredEvents.map((event) => {
              const undoConfirmation = buildResearchRunImportUndoConfirmation(event);
              const isConfirmingUndo = pendingImportUndoToken === undoConfirmation?.undoToken;
              const canInspectRunPackage = event.stage === "confirmed" || event.stage === "undone" || event.stage === "undo-failed";
              const isEvidenceAnchorCopied = copiedEvidenceEventId === event.id;
              const isFocusedEvent = focusedEventId === event.id;
              return (
                <article
                  className={`research-import-event-row ${event.tone} ${event.stage} ${isFocusedEvent ? "focused" : ""}`}
                  key={event.id}
                  ref={isFocusedEvent ? focusedEventRef : undefined}
                >
                  <span>{researchImportAuditStageLabel(i18n, event.stage)}</span>
                  <strong>
                    {event.fileName}
                    <small>{event.runId}</small>
                  </strong>
                  <p>
                    <b>{researchImportAuditSummaryLabel(i18n, event.summary)}</b>
                    <small>{researchImportAuditDetailLabel(i18n, event.detail)}</small>
                    {event.blockedRows.length ? (
                      <small>
                        {event.blockedRows
                          .map((row) => `${row.label}: ${row.incoming}`)
                          .join(" · ")}
                      </small>
                    ) : null}
                    {event.verifiedReportSignatures.length ? (
                      <small>
                        {event.verifiedReportSignatures
                          .map(
                            (row) =>
                              `${researchImportVerifiedReportSignatureLabel(i18n, row)}: ${researchImportAuditDetailLabel(i18n, row.detail)}`
                          )
                          .join(" · ")}
                      </small>
                    ) : null}
                    <em>{event.exportPath}</em>
                  </p>
                  <em>
                    {event.blockedCount}/{event.changeCount}
                  </em>
                  <div className="research-import-event-recovery">
                    <small>{researchImportAuditRecoveryLabel(i18n, event.recoveryHint)}</small>
                    <button onClick={() => onCopyEvidenceAnchor(event)} type="button">
                      {isEvidenceAnchorCopied ? <Check size={13} /> : <Copy size={13} />}
                      {isEvidenceAnchorCopied
                        ? i18n.locale === "zh-CN"
                          ? "已复制"
                          : "Copied"
                        : i18n.locale === "zh-CN"
                          ? "复制锚点"
                          : "Copy anchor"}
                    </button>
                    {canInspectRunPackage ? (
                      <button onClick={() => onInspectRunPackage(event)} type="button">
                        {i18n.locale === "zh-CN" ? "打开证据" : "Open evidence"}
                      </button>
                    ) : null}
                    {event.stage !== "undone" && event.undoToken && undoConfirmation ? (
                      isConfirmingUndo ? (
                        <div className="research-import-undo-confirmation">
                          <strong>{researchImportUndoConfirmationMessage(i18n, undoConfirmation.message)}</strong>
                          <span>{researchImportUndoConfirmationDetail(i18n, undoConfirmation.detail)}</span>
                          <div className="research-import-undo-confirmation-actions">
                            <button
                              onClick={() => {
                                onUndoImport(undoConfirmation.undoToken, undoConfirmation.runId);
                                setPendingImportUndoToken(null);
                              }}
                              type="button"
                            >
                              {i18n.locale === "zh-CN" ? "确认撤销" : "Confirm undo"}
                            </button>
                            <button onClick={() => setPendingImportUndoToken(null)} type="button">
                              {i18n.locale === "zh-CN" ? "取消" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setPendingImportUndoToken(event.undoToken);
                          }}
                          type="button"
                        >
                          {i18n.locale === "zh-CN" ? "撤销导入" : "Undo import"}
                        </button>
                      )
                    ) : null}
                    {event.rollbackTargetRunId ? (
                      <button
                        onClick={() => {
                          if (event.rollbackTargetRunId) {
                            onReplayRollbackRun(event.rollbackTargetRunId);
                          }
                        }}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "回放旧 run" : "Replay previous"}
                      </button>
                    ) : null}
                  </div>
                  <time dateTime={event.createdAt}>{researchImportAuditTimeLabel(event.createdAt)}</time>
                </article>
              );
            })
          ) : (
            <article className="research-import-event-row empty">
              <span>{i18n.locale === "zh-CN" ? "暂无事件" : "No events"}</span>
              <strong>
                {i18n.locale === "zh-CN" ? "选择外部复现包" : "Choose an external package"}
                <small>{i18n.locale === "zh-CN" ? "预检后会记录流水" : "Events appear after preflight"}</small>
              </strong>
              <p>
                <b>{i18n.locale === "zh-CN" ? "等待导入动作" : "Waiting for import action"}</b>
                <small>
                  {i18n.locale === "zh-CN"
                    ? "导入流水会写入后端审计库，并保留恢复提示。"
                    : "This ledger writes to the backend audit store and keeps recovery hints."}
                </small>
              </p>
              <em>0/0</em>
              <div className="research-import-event-recovery">
                <small>{i18n.locale === "zh-CN" ? "等待预检" : "Awaiting preflight"}</small>
              </div>
              <time>-</time>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ResearchRunExportIndexPanel({
  className,
  i18n,
  isLoading,
  onIndexPackages,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isLoading: boolean;
  onIndexPackages: () => void;
  rows: ResearchRunExportIndexRow[];
}) {
  const [query, setQuery] = useState("");
  const filteredRows = filterResearchRunExportIndexRows(rows, query);
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const reviewCount = rows.filter((row) => row.status === "review").length;
  const readyCount = rows.filter((row) => row.status === "ready").length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "近期复现包索引" : "Recent Export Package Index"}
      subtitle={i18n.locale === "zh-CN" ? "跨运行搜索 run、hash、artifact 与执行交接" : "Search runs, hashes, artifacts, and handoff"}
      className={className}
      action={
        <button className="report-export-button" disabled={isLoading} onClick={onIndexPackages} type="button">
          {isLoading ? <RefreshCw className="spin" size={13} /> : <Search size={13} />}
          <span>{i18n.locale === "zh-CN" ? "索引近期包" : "Index recent"}</span>
        </button>
      }
    >
      <div className="research-export-index">
        <div className="research-export-index-toolbar">
          <div className="research-export-index-summary">
            <span>
              {i18n.locale === "zh-CN" ? "实盘就绪" : "Live ready"} <strong>{readyCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "待复核" : "Review"} <strong>{reviewCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已索引" : "Indexed"} <strong>{rows.length}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索近期复现包索引" : "Search recent export package index"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索 run / 标的 / hash / 阻断原因" : "Search run / symbol / hash / block reason"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-export-index-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-export-index-row ${row.tone} ${row.status}`} key={row.id}>
                <span>
                  <strong>{row.context}</strong>
                  <em>{row.runId}</em>
                </span>
                <small>{row.strategyRevision}</small>
                <strong>{researchExportIndexDetail(i18n, row.detail)}</strong>
                <em>{row.artifacts}</em>
                <small>{row.execution}</small>
                <b>{researchExportIndexStatusLabel(i18n, row.status)}</b>
                <p>
                  {row.integrity} · {row.dataHash} · {row.exportPath} · {researchExportIndexDate(i18n, row.exportedAt)}
                </p>
              </article>
            ))
          ) : (
            <article className="research-export-index-row empty">
              <span>
                <strong>{i18n.locale === "zh-CN" ? "暂无索引" : "No index"}</strong>
                <em>{i18n.locale === "zh-CN" ? "先点击索引近期包" : "Click Index recent first"}</em>
              </span>
              <small>-</small>
              <strong>{i18n.locale === "zh-CN" ? "还没有加载近期复现包。" : "No recent export packages have been loaded."}</strong>
              <em>-</em>
              <small>-</small>
              <b>{i18n.locale === "zh-CN" ? "等待" : "Waiting"}</b>
              <p>{i18n.locale === "zh-CN" ? "索引只读取运行历史中的复现包，不会修改审计记录。" : "Indexing reads packages from run history without changing audit records."}</p>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

function AiReviewAuditTrailPanel({
  className,
  currentRecord,
  currentRunId,
  currentStrategyRevision,
  dataSnapshot,
  dossier,
  historyPagination,
  historyQuery,
  i18n,
  isLoadingHistory,
  liveExecutionBlocked,
  marketCalendar,
  preparationEvidence,
  onHistoryQueryChange,
  onNextHistoryPage,
  onPreviousHistoryPage,
  onSelectWorkspace,
  records,
  riskApproval,
  roundCount
}: {
  className?: string;
  currentRecord: AiReviewRunRecord | null;
  currentRunId: string | null;
  currentStrategyRevision: string;
  dataSnapshot: ResearchRunDataSnapshot | null;
  dossier: AiReviewDossier;
  historyPagination: AiReviewRunHistoryPagination | null;
  historyQuery: string;
  i18n: AppI18n;
  isLoadingHistory: boolean;
  liveExecutionBlocked: boolean;
  marketCalendar: ResearchContextMarketCalendar | null;
  preparationEvidence: ResearchRunDataPreparationEvidence | null;
  onHistoryQueryChange: (query: string) => void;
  onNextHistoryPage: () => void;
  onPreviousHistoryPage: () => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
  records: AiReviewRunRecordEnvelope[];
  riskApproval: RiskApprovalSummary;
  roundCount: number;
}) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const latestRecord = records[0] ?? null;
  const selectedRecord = records.find((record) => record.aiReviewId === selectedRecordId) ?? latestRecord;
  const driftRows = buildAiReviewRecordDriftRows({
    currentCitationCount: dossier.citations.length,
    currentRunId,
    currentStatus: dossier.status,
    currentStrategyRevision,
    liveExecutionBlocked,
    records: records.map((record) => record.record),
    roundCount
  });
  const timelineItems = buildAiReviewAuditTimelineItems({
    aiBoundary: currentRecord?.boundary ?? "",
    citationCount: dossier.citations.length,
    currentRunId,
    currentStrategyRevision,
    dataSnapshot,
    decisionCount: currentRecord?.summary.decisionCount ?? 0,
    dossier,
    marketCalendar,
    preparationEvidence,
    records: records.map((record) => record.record),
    roundCount,
    riskApproval
  });
  const [evidenceIndexQuery, setEvidenceIndexQuery] = useState("");
  const evidenceIndexRows = buildAiReviewExportEvidenceIndexRows({
    currentRecord,
    records: records.map((record) => record.record),
    timelineItems
  });
  const filteredEvidenceIndexRows = filterAiReviewExportEvidenceIndexRows(evidenceIndexRows, evidenceIndexQuery);
  const totalHistoryRecords = historyPagination?.total ?? records.length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "AI 评审审计" : "AI Review Audit"}
      subtitle={i18n.locale === "zh-CN" ? "保存记录、引用证据与风控边界" : "Saved records, citations, and risk boundary"}
      className={className}
    >
      <div className="audit-ai-trail-grid">
        <AiReviewAuditComparison
          currentCitationCount={dossier.citations.length}
          currentRunId={currentRunId}
          currentStatus={dossier.status}
          currentStrategyRevision={currentStrategyRevision}
          i18n={i18n}
          latestRecord={selectedRecord}
          liveExecutionBlocked={liveExecutionBlocked}
          roundCount={roundCount}
        />
        <AiReviewAuditTimelineBoard
          i18n={i18n}
          items={timelineItems}
          onSelectRecord={setSelectedRecordId}
          onSelectWorkspace={onSelectWorkspace}
        />
        <AiReviewExportEvidenceIndexBoard
          i18n={i18n}
          onQueryChange={setEvidenceIndexQuery}
          query={evidenceIndexQuery}
          rows={filteredEvidenceIndexRows}
          totalRows={evidenceIndexRows.length}
        />
        <AiReviewRiskReferenceBoard approval={riskApproval} i18n={i18n} />
        <AiReviewRecordDriftSummary
          i18n={i18n}
          onQueryChange={onHistoryQueryChange}
          query={historyQuery}
          rows={driftRows}
          totalRows={totalHistoryRecords}
        />
        <AiReviewRunRecordHistory
          i18n={i18n}
          isLoading={isLoadingHistory}
          onNextPage={onNextHistoryPage}
          onPreviousPage={onPreviousHistoryPage}
          onSelectRecord={setSelectedRecordId}
          pagination={historyPagination}
          query={historyQuery}
          records={records}
          selectedRecordId={selectedRecord?.aiReviewId ?? null}
          totalRecords={totalHistoryRecords}
        />
        <div className="audit-ai-citation-list">
          <div className="agent-rounds-title">
            <span>{i18n.locale === "zh-CN" ? "引用证据" : "Citations"}</span>
            <strong>{dossier.citations.length}</strong>
          </div>
          {dossier.citations.map((citation) => (
            <article className={`audit-ai-citation ${citation.tone}`} key={citation.id}>
              <span>{aiCitationLabel(i18n, citation)}</span>
              <strong>{aiCitationValue(i18n, citation)}</strong>
              <p>{aiCitationDetail(i18n, citation.detail)}</p>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function auditTimelineKindLabel(i18n: AppI18n, kind: AiReviewAuditTimelineItem["kind"]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        "current-evidence": "Current evidence",
        "citation-bundle-evidence": "Citation bundle",
        "strategy-revision-evidence": "Strategy revision",
        "committee-rounds-evidence": "Committee rounds",
        "decision-log-evidence": "Decision log",
        "ai-boundary-evidence": "AI boundary",
        "data-snapshot-evidence": "Data snapshot",
        "data-preparation-evidence": "Data preparation",
        "market-calendar-evidence": "Market calendar",
        "saved-review": "Saved review",
        "risk-approval": "Risk approval"
      } satisfies Record<AiReviewAuditTimelineItem["kind"], string>
    )[kind];
  }
  return (
    {
      "current-evidence": "当前证据",
      "citation-bundle-evidence": "引用证据",
      "strategy-revision-evidence": "策略版本",
      "committee-rounds-evidence": "委员会轮次",
      "decision-log-evidence": "决策日志",
      "ai-boundary-evidence": "AI 边界",
      "data-snapshot-evidence": "数据快照",
      "data-preparation-evidence": "数据准备",
      "market-calendar-evidence": "交易日历",
      "saved-review": "保存评审",
      "risk-approval": "风控审批"
    } satisfies Record<AiReviewAuditTimelineItem["kind"], string>
  )[kind];
}

function auditTimelineValue(i18n: AppI18n, item: AiReviewAuditTimelineItem): string {
  if (i18n.locale === "en-US") {
    return item.value;
  }
  return item.value
    .replace("Current audit evidence", "当前审计证据")
    .replace("Saved AI review", "保存 AI 评审")
    .replace("Paper execution approved", "模拟执行已审批")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("Certified live route ready", "认证实盘通道就绪")
    .replace("Risk approval", "风控审批")
    .replace("citations", "条引用")
    .replace("rounds", "轮")
    .replace("no audited run", "无审计运行");
}

function auditTimelineDetail(i18n: AppI18n, item: AiReviewAuditTimelineItem): string {
  if (i18n.locale === "en-US") {
    return item.detail;
  }
  return item.detail
    .replace("Audited evidence required", "需要先绑定审计证据")
    .replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。")
    .replace("Evidence dossier is ready", "证据档案已就绪")
    .replace("Evidence dossier blocked", "证据档案阻断")
    .replace("Paper execution approved", "模拟执行已审批")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("Certified live route ready", "认证实盘通道就绪")
    .replace("can stage paper orders", "可提交模拟委托")
    .replace("live trading remains blocked", "实盘仍保持阻断")
    .replace("needs risk review before staging execution", "提交执行前仍需风控复核");
}

function auditTimelineActionLabel(i18n: AppI18n, item: AiReviewAuditTimelineItem): string {
  if (i18n.locale === "en-US") {
    return item.actionLabel;
  }
  return item.actionLabel
    .replace("Open backtest evidence", "查看回测证据")
    .replace("Compare saved review", "对照保存评审")
    .replace("Open execution approval", "查看执行审批");
}

function aiReviewEvidenceIndexGroupLabel(
  i18n: AppI18n,
  group: AiReviewExportEvidenceIndexRow["group"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        "current-record": "Current record",
        "saved-record": "Saved record",
        timeline: "Timeline"
      } satisfies Record<AiReviewExportEvidenceIndexRow["group"], string>
    )[group];
  }
  return (
    {
      "current-record": "当前记录",
      "saved-record": "保存记录",
      timeline: "审计时间线"
    } satisfies Record<AiReviewExportEvidenceIndexRow["group"], string>
  )[group];
}

function aiReviewEvidenceIndexDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Current AI review record", "当前 AI 评审记录")
    .replace("Saved AI review record", "保存 AI 评审记录")
    .replace("Evidence dossier is ready", "证据档案已就绪")
    .replace("Evidence dossier blocked", "证据档案阻断")
    .replace("Paper execution approved", "模拟执行已审批")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("live trading remains blocked", "实盘仍保持阻断");
}

function researchExportPreviewLabel(i18n: AppI18n, row: ResearchRunExportPreviewRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return (
    {
      "research-run": "研究运行",
      "data-snapshot": "数据快照",
      "market-calendar": "交易日历",
      "preparation-evidence": "准备证据",
      "strategy-config": "策略配置",
      "research-note": "研究笔记",
      "backtest-trades": "回测流水",
      "paper-executions": "模拟执行",
      "promotion-candidate": "晋级候选",
      "ai-review-runs": "AI 评审记录",
      "execution-handoff": "执行交接"
    } satisfies Record<ResearchRunExportPreviewRow["id"], string>
  )[row.id];
}

function researchExportPreviewStatusLabel(
  i18n: AppI18n,
  status: ResearchRunExportPreviewRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        ready: "Ready",
        missing: "Missing",
        blocked: "Blocked"
      } satisfies Record<ResearchRunExportPreviewRow["status"], string>
    )[status];
  }
  return (
    {
      ready: "就绪",
      missing: "缺失",
      blocked: "阻断"
    } satisfies Record<ResearchRunExportPreviewRow["status"], string>
  )[status];
}

function researchExportPreviewDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const runDetail = detail.match(/^(.+) · (.+) · (.+) · (\d+) bars$/);
  if (runDetail) {
    return `${runDetail[1]} · ${runDetail[2]} · ${runDetail[3]} · ${runDetail[4]} 根K线`;
  }
  const snapshotDetail = detail.match(/^(.+) · (.+) · (\d+) warnings$/);
  if (snapshotDetail) {
    return `${snapshotDetail[1]} · ${snapshotDetail[2]} · ${snapshotDetail[3]} 条告警`;
  }
  const strategyDetail = detail.match(/^(.+) · v(\d+) · (.+)$/);
  if (strategyDetail) {
    return `${strategyDetail[1]} · v${strategyDetail[2]} · ${strategyDetail[3]}`;
  }
  const executionDetail = detail.match(/^(.+) · (\d+)\/(\d+) gates passed$/);
  if (executionDetail) {
    return `${executionDetail[1]} · ${executionDetail[2]}/${executionDetail[3]} 个闸门通过`;
  }
  return detail
    .replace("Run Pipeline before an export package can be reproduced.", "先运行流水线，才能生成可复现导出包。")
    .replace("The audited run did not include a local data snapshot hash.", "审计运行没有包含本地数据快照哈希。")
    .replace("A research run is required before data can be exported.", "需要先生成研究运行，才能导出数据。")
    .replace("The export can replay the run, but structured strategy rules are missing.", "导出包可以回放运行，但缺少结构化策略规则。")
    .replace("Run Pipeline after saving a strategy to bind structured rules.", "保存策略后运行流水线，绑定结构化规则。")
    .replace("No research note is attached to this run; add one for stronger replay context.", "当前运行没有绑定研究笔记；添加后复现上下文会更完整。")
    .replace("Research notes are bound after a run is created.", "研究笔记会在研究运行创建后绑定。")
    .replace("Trade blotter and equity curve are available for replay.", "交易流水和权益曲线可用于回放。")
    .replace("The run summary is bound, but the trade blotter or equity curve is missing.", "运行摘要已绑定，但交易流水或权益曲线缺失。")
    .replace("Run Pipeline before backtest replay artifacts are exported.", "先运行流水线，再导出回测回放材料。")
    .replace("Saved AI review records are attached to this export package.", "已保存的 AI 评审记录会随导出包附带。")
    .replace("Current AI evidence is ready, but it has not been saved into the export package yet.", "当前 AI 证据已就绪，但尚未保存进导出包。")
    .replace("Run and save an AI review record before relying on exported AI evidence.", "先运行并保存 AI 评审记录，再依赖导出的 AI 证据。")
    .replace("A research run is required before AI review records can be exported.", "需要先生成研究运行，才能导出 AI 评审记录。")
    .replace("Submit a paper order to attach execution evidence to the run package.", "提交模拟委托后，执行证据会附加到运行包。")
    .replace("Paper execution waits for an audited run.", "模拟执行等待审计运行。")
    .replace("Promotion evidence is attached, but live execution remains blocked.", "晋级证据已附加，但实盘执行仍保持阻断。")
    .replace("Create a paper execution before promotion evidence can be attached.", "先创建模拟执行，才能附加晋级证据。")
    .replace("Promotion evidence waits for a research run.", "晋级证据等待研究运行。")
    .replace("Execution handoff gates are created after an audited run is available.", "审计运行可用后会生成执行交接闸门。")
    .replace("Audited run can stage paper orders", "审计运行可提交模拟委托")
    .replace("live trading remains blocked", "实盘仍保持阻断")
    .replace("needs risk review before staging execution", "提交执行前仍需风控复核");
}

function researchExportBrowserLabel(i18n: AppI18n, row: ResearchRunExportBrowserRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return (
    {
      package: "导出包",
      integrity: "完整性",
      data: "数据快照",
      "market-calendar": "交易日历",
      "preparation-evidence": "准备证据",
      backtest: "回测回放",
      "backtest-report": "回测报告",
      "research-note": "研究笔记",
      "paper-executions": "模拟执行",
      "portfolio-paper-orders": "组合模拟委托",
      "promotion-candidate": "晋级候选",
      "ai-reviews": "AI 评审",
      "audit-summary": "审计摘要",
      "audit-report": "审计报告",
      "execution-handoff": "执行交接"
    } satisfies Record<ResearchRunExportBrowserRow["id"], string>
  )[row.id];
}

function researchExportBrowserStatusLabel(
  i18n: AppI18n,
  status: ResearchRunExportBrowserRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        ready: "Ready",
        missing: "Missing",
        blocked: "Blocked"
      } satisfies Record<ResearchRunExportBrowserRow["status"], string>
    )[status];
  }
  return (
    {
      ready: "就绪",
      missing: "缺失",
      blocked: "阻断"
    } satisfies Record<ResearchRunExportBrowserRow["status"], string>
  )[status];
}

function researchExportDeepLinkStatusLabel(
  i18n: AppI18n,
  status: AuditEvidenceSummary["deepLinkStatus"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        none: "No deep link",
        idle: "Ready to load",
        loading: "Loading package",
        loaded: "Evidence loaded",
        failed: "Load failed"
      } satisfies Record<AuditEvidenceSummary["deepLinkStatus"], string>
    )[status];
  }
  return (
    {
      none: "未使用深链",
      idle: "等待加载",
      loading: "正在加载复现包",
      loaded: "证据已加载",
      failed: "加载失败"
    } satisfies Record<AuditEvidenceSummary["deepLinkStatus"], string>
  )[status];
}

function researchExportBrowserDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const packageDetail = detail.match(/^(.+) · (.+) · exported (.+)$/);
  if (packageDetail) {
    return `${packageDetail[1]} · ${packageDetail[2]} · 导出 ${packageDetail[3]}`;
  }
  const decisionDetail = detail.match(/^(.+) decisions · (.+) AI risks$/);
  if (decisionDetail) {
    return `${decisionDetail[1]} 条决策 · ${decisionDetail[2]} 条 AI 风险`;
  }
  return detail
    .replace("Inspect a run from history to load its manifest and artifact counts.", "在运行历史中点击查看包，加载 manifest 和 artifact 数量。")
    .replace("Canonical SHA-256 integrity metadata is present.", "标准 SHA-256 完整性元数据已存在。")
    .replace("Integrity metadata is missing or malformed.", "完整性元数据缺失或格式异常。")
    .replace("Manifest and package data snapshot counts match.", "Manifest 与包内数据快照数量一致。")
    .replace("Manifest data snapshot count does not match the package payload.", "Manifest 数据快照数量与包内载荷不一致。")
    .replace("Manifest and package backtest artifact counts match.", "Manifest 与包内回测 artifact 数量一致。")
    .replace("Manifest backtest artifact count does not match the package payload.", "Manifest 回测 artifact 数量与包内载荷不一致。")
    .replace("Locked research context is attached to the package.", "锁定研究上下文已附加到导出包。")
    .replace("No locked research note is attached to this package.", "当前导出包没有附加锁定研究笔记。")
    .replace("Manifest and package paper execution counts match.", "Manifest 与包内模拟执行数量一致。")
    .replace("Manifest paper execution count does not match the package payload.", "Manifest 模拟执行数量与包内载荷不一致。")
    .replace("No paper execution payload is attached.", "没有附加模拟执行载荷。")
    .replace("Portfolio paper order batch count matches the export package payload.", "Portfolio 组合模拟委托批次数量与导出包载荷一致。")
    .replace("Portfolio paper order manifest count does not match the package payload.", "Portfolio 组合模拟委托批次数量与包内载荷不一致。")
    .replace("Promotion candidate is attached to the package.", "晋级候选证据已附加到导出包。")
    .replace("No promotion candidate payload is attached.", "没有附加晋级候选载荷。")
    .replace("Manifest and package AI review counts match.", "Manifest 与包内 AI 评审数量一致。")
    .replace("Manifest AI review count does not match the package payload.", "Manifest AI 评审数量与包内载荷不一致。")
    .replace("No saved AI review record is attached.", "没有附加保存的 AI 评审记录。")
    .replace("Live execution handoff is allowed by the package gates.", "包内闸门允许实盘执行交接。")
    .replace("Package remains paper-only; live execution is blocked.", "导出包仍为仅模拟盘；实盘执行保持阻断。");
}

function researchImportDiffLabel(i18n: AppI18n, row: ResearchRunImportDiffRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return (
    {
      "package-integrity": "复现包完整性",
      "artifact-counts": "Artifact 数量",
      "run-id": "研究运行",
      context: "市场 / 标的",
      timeframe: "周期",
      "data-snapshot": "数据快照",
      "market-calendar": "交易日历",
      "preparation-evidence": "准备证据",
      "strategy-revision": "策略版本",
      "research-note": "研究笔记",
      "paper-executions": "模拟执行",
      "portfolio-paper-orders": "组合模拟委托",
      "ai-review-runs": "AI 评审记录",
      "audit-summary": "导入审计摘要",
      "audit-report": "导入审计报告",
      "backtest-report": "导入回测报告",
      "live-boundary": "实盘边界"
    } satisfies Record<ResearchRunImportDiffRow["id"], string>
  )[row.id];
}

function researchImportVerifiedReportSignatureLabel(
  i18n: AppI18n,
  row: ResearchRunImportAuditEvent["verifiedReportSignatures"][number]
): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return row.id === "audit-report" ? "导入审计报告" : "导入回测报告";
}

function researchImportDiffStatusLabel(
  i18n: AppI18n,
  status: ResearchRunImportDiffRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        same: "Same",
        add: "Add",
        change: "Change",
        replace: "Replace",
        blocked: "Blocked"
      } satisfies Record<ResearchRunImportDiffRow["status"], string>
    )[status];
  }
  return (
    {
      same: "一致",
      add: "新增",
      change: "变更",
      replace: "替换",
      blocked: "阻断"
    } satisfies Record<ResearchRunImportDiffRow["status"], string>
  )[status];
}

function researchImportDiffValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  return value
    .replace("Local verification required", "本地校验必需")
    .replace("No integrity hash", "无完整性 hash")
    .replace("Counts match", "数量一致")
    .replace("Manifest versus package payload", "Manifest 对比包内载荷")
    .replace("mismatch", "处不一致")
    .replace("No audited run", "无审计运行")
    .replace("No package selected", "未选择复现包")
    .replace("No data snapshot", "无数据快照")
    .replace("No audited strategy", "无审计策略")
    .replace("No local note", "无本地笔记")
    .replace("No package note", "无包内笔记")
    .replace("No local package summary", "无本地包摘要")
    .replace("no focus", "无焦点")
    .replace("No package selected", "未选择复现包")
    .replace("Local live enabled", "本地实盘已开启")
    .replace("Local paper boundary", "本地模拟盘边界")
    .replace("Package claims live handoff", "复现包声明实盘交接")
    .replace("Package remains paper-only", "复现包仅模拟盘")
    .replaceAll("rows", "行")
    .replaceAll("saved", "条保存")
    .replaceAll("manifest", "manifest");
}

function researchImportDiffDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Inspect or choose a research run export package before importing.", "导入前先查看或选择一个研究运行复现包。")
    .replace("Canonical SHA-256 metadata is present before import.", "导入前已存在标准 SHA-256 完整性元数据。")
    .replace("Import must stop until the package has valid canonical SHA-256 metadata.", "复现包缺少有效标准 SHA-256 元数据时必须阻断导入。")
    .replace("Manifest artifact counts match the package payloads that will be restored.", "Manifest artifact 数量与即将恢复的包内载荷一致。")
    .replace("Import will refresh the existing audited run payload.", "导入会刷新现有审计运行载荷。")
    .replace("Import will replace the current replay context with the package run.", "导入会用包内运行替换当前回放上下文。")
    .replace("Import will add an audited run to the local workspace.", "导入会向本地工作区新增一条审计运行。")
    .replace("Import will bind the terminal to the package market and symbol.", "导入会把终端绑定到复现包的市场和标的。")
    .replace("Current research context already matches the package timeframe.", "当前研究上下文已经匹配复现包周期。")
    .replace("Current research context will switch to the package timeframe.", "当前研究上下文会切换到复现包周期。")
    .replace("Import will replay the package data hash and row count as the audited snapshot.", "导入会把包内数据 hash 和行数作为审计快照回放。")
    .replace("Import will restore the package strategy revision as an audited Strategy Lab version.", "导入会把包内策略版本恢复为 Strategy Lab 的 audited 版本。")
    .replace("Import will write the package research note back to the local note store.", "导入会把包内研究笔记写回本地笔记库。")
    .replace("Package does not include a locked research note.", "复现包没有包含锁定研究笔记。")
    .replace("Import will restore paper execution records attached to the package run.", "导入会恢复附加在包内运行上的模拟执行记录。")
    .replace("Import will restore saved AI review records and their evidence anchors.", "导入会恢复保存的 AI 评审记录及其证据锚点。")
    .replace(
      "Audit evidence summary run id does not match the import package manifest.",
      "审计证据摘要 run id 与导入包 manifest 不一致。"
    )
    .replace(
      /Audit focus carries (\d+)\/(\d+) package matches and (\d+) import diff blockers\./u,
      "审计焦点携带 $1/$2 条包检查命中和 $3 个导入差异阻断。"
    )
    .replace(
      "Package includes a portable Audit Markdown report bound to this manifest.",
      "复现包包含已绑定该 manifest 的便携 Audit Markdown 报告。"
    )
    .replace(
      "Package includes a portable Backtest Markdown report bound to this manifest.",
      "复现包包含已绑定该 manifest 的便携 Backtest Markdown 报告。"
    )
    .replace("Local core import verification: verified", "本地核心导入验签：通过")
    .replace("Local core import verification: invalid", "本地核心导入验签：失败")
    .replace("Local import must reject packages that claim live trading permission.", "本地导入必须拒绝声明实盘权限的复现包。")
    .replace("Import keeps the package inside the paper-only execution boundary.", "导入会把复现包保持在仅模拟盘执行边界内。");
}

function researchRunImportAuditEvidenceAnchorQuery(runId: string, exportPath: string): string {
  const normalizedExportPath = exportPath.trim();
  if (normalizedExportPath.startsWith("manifest:")) {
    return runId;
  }
  return normalizedExportPath || runId;
}

function researchRunImportAuditEvidenceQuery(event: ResearchRunImportAuditEvent): string {
  return researchRunImportAuditEvidenceAnchorQuery(event.runId, event.exportPath);
}

function buildResearchRunImportAuditEvidenceUrl(event: ResearchRunImportAuditEvent): string {
  const url =
    typeof window === "undefined"
      ? new URL("http://aiqt.local/?workspace=audit")
      : new URL(window.location.href);
  url.searchParams.set("workspace", "audit");
  url.searchParams.set("auditEvent", event.id);
  url.searchParams.set("runId", event.runId);
  url.searchParams.set("exportPath", event.exportPath);
  url.searchParams.delete("workflow");
  return typeof window === "undefined" ? `${url.pathname}?${url.searchParams.toString()}` : url.toString();
}

function researchRunImportAuditEventToAuditEventRecord(event: ResearchRunImportAuditEvent): AuditEventRecord {
  return {
    schemaVersion: 1,
    eventId: event.id,
    eventType: "research_run_import",
    runId: event.runId === "unknown" ? null : event.runId,
    createdAt: event.createdAt,
    stage: event.stage,
    source: "web",
    summary: event.summary,
    detail: event.detail,
    metadata: {
      fileName: event.fileName,
      previousRunId: event.previousRunId,
      rollbackTargetRunId: event.rollbackTargetRunId,
      undoToken: event.undoToken,
      failureCategory: event.failureCategory,
      recoveryHint: event.recoveryHint,
      blockedCount: event.blockedCount,
      blockedRows: event.blockedRows,
      changeCount: event.changeCount,
      exportPath: event.exportPath,
      tone: event.tone,
      verifiedReportSignatures: event.verifiedReportSignatures
    }
  };
}

function auditEventRecordToResearchRunImportEvent(record: AuditEventRecord): ResearchRunImportAuditEvent | null {
  if (record.eventType !== "research_run_import" || !isResearchRunImportAuditEventStage(record.stage)) {
    return null;
  }
  return {
    id: record.eventId,
    stage: record.stage,
    runId: record.runId ?? "unknown",
    previousRunId: auditMetadataNullableString(record.metadata.previousRunId),
    rollbackTargetRunId: auditMetadataNullableString(record.metadata.rollbackTargetRunId),
    undoToken: auditMetadataNullableString(record.metadata.undoToken),
    fileName: auditMetadataString(record.metadata.fileName, "unknown"),
    createdAt: record.createdAt,
    summary: record.summary,
    detail: record.detail,
    failureCategory: auditMetadataFailureCategory(record.metadata.failureCategory),
    recoveryHint: auditMetadataString(record.metadata.recoveryHint, ""),
    blockedCount: auditMetadataNumber(record.metadata.blockedCount),
    blockedRows: auditMetadataBlockedRows(record.metadata.blockedRows),
    changeCount: auditMetadataNumber(record.metadata.changeCount),
    exportPath: auditMetadataString(record.metadata.exportPath, `auditEvent:${record.eventId}`),
    tone: auditMetadataTone(record.metadata.tone),
    verifiedReportSignatures: auditMetadataVerifiedReportSignatures(record.metadata.verifiedReportSignatures)
  };
}

function isResearchRunImportAuditEventStage(value: string): value is ResearchRunImportAuditEvent["stage"] {
  return (
    value === "preview" ||
    value === "blocked" ||
    value === "confirmed" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "undone" ||
    value === "undo-failed"
  );
}

function auditMetadataString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function auditMetadataNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function auditMetadataNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function auditMetadataBlockedRows(value: unknown): ResearchRunImportAuditEvent["blockedRows"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = row.id;
      const label = auditMetadataString(row.label, "");
      const detail = auditMetadataString(row.detail, "");
      const exportPath = auditMetadataString(row.exportPath, "");
      const incoming = auditMetadataString(row.incoming, "");
      if (
        !isResearchRunImportDiffRowId(id) ||
        !label ||
        !detail ||
        !exportPath ||
        !incoming
      ) {
        return null;
      }
      return {
        id,
        label,
        detail,
        exportPath,
        incoming
      };
    })
    .filter((row): row is ResearchRunImportAuditEvent["blockedRows"][number] => Boolean(row));
}

function auditMetadataVerifiedReportSignatures(value: unknown): ResearchRunImportAuditEvent["verifiedReportSignatures"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = row.id;
      const label = auditMetadataString(row.label, "");
      const detail = auditMetadataString(row.detail, "");
      const exportPath = auditMetadataString(row.exportPath, "");
      const incoming = auditMetadataString(row.incoming, "");
      const reason = auditMetadataString(row.reason, "");
      const source = row.source;
      const status = row.status;
      if (
        (id !== "audit-report" && id !== "backtest-report") ||
        !label ||
        !detail ||
        !exportPath ||
        !incoming ||
        !reason ||
        source !== "local-core" ||
        (status !== "verified" && status !== "invalid")
      ) {
        return null;
      }
      return {
        id,
        label,
        detail,
        exportPath,
        incoming,
        reason,
        source,
        status
      };
    })
    .filter((row): row is ResearchRunImportAuditEvent["verifiedReportSignatures"][number] => Boolean(row));
}

function isResearchRunImportDiffRowId(value: unknown): value is ResearchRunImportDiffRow["id"] {
  return (
    value === "package-integrity" ||
    value === "artifact-counts" ||
    value === "run-id" ||
    value === "context" ||
    value === "timeframe" ||
    value === "data-snapshot" ||
    value === "preparation-evidence" ||
    value === "strategy-revision" ||
    value === "research-note" ||
    value === "paper-executions" ||
    value === "ai-review-runs" ||
    value === "audit-summary" ||
    value === "audit-report" ||
    value === "backtest-report" ||
    value === "live-boundary"
  );
}

function auditMetadataFailureCategory(value: unknown): ResearchRunImportFailureCategory | null {
  return value === "schema" || value === "integrity" || value === "artifact-counts" || value === "core" || value === "unknown"
    ? value
    : null;
}

function auditMetadataTone(value: unknown): ResearchRunImportAuditEvent["tone"] {
  return value === "positive" ||
    value === "warning" ||
    value === "neutral" ||
    value === "risk" ||
    value === "ai"
    ? value
    : "neutral";
}

function auditReportLedgerStatusLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Backtest report hash recorded": "回测报告 hash 已记录",
      "Report hash recorded": "报告 hash 已记录",
      "Report hash invalid": "报告 hash 异常"
    }[label] ?? label
  );
}

function auditReportLedgerReportKindLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Audit evidence report": "审计证据报告",
      "Backtest report": "回测报告",
      "P0 readiness report": "P0 可用性报告",
      "Portfolio report": "组合报告"
    }[label] ?? label
  );
}

function auditReportLedgerSignatureLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Unsigned report hash": "报告 hash 尚未签名",
      "Signed report hash": "报告 hash 已签名",
      "Verified signature": "签名已验证",
      "Revoked signature": "签名已撤销",
      "Signature chain blocked": "签名链阻断"
    }[label] ?? label
  );
}

function auditSigningKeyStatusLabel(i18n: AppI18n, status: "active" | "retired" | "revoked"): string {
  if (i18n.locale === "en-US") {
    return (
      {
        active: "Active",
        retired: "Retired",
        revoked: "Revoked"
      } satisfies Record<typeof status, string>
    )[status];
  }
  return (
    {
      active: "活跃",
      retired: "已退役",
      revoked: "已撤销"
    } satisfies Record<typeof status, string>
  )[status];
}

function auditSigningKeyCapabilityLabel(i18n: AppI18n, canSign: boolean, canVerify: boolean): string {
  if (i18n.locale === "en-US") {
    if (canSign) {
      return "Can sign";
    }
    return canVerify ? "Verify only" : "Disabled";
  }
  if (canSign) {
    return "可签名";
  }
  return canVerify ? "仅验签" : "已禁用";
}

function rotationLedgerStatusLabel(i18n: AppI18n, state: AuditSigningKeyRotationLedgerStatus["state"]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        failed: "Ledger failed",
        idle: "Ledger idle",
        saved: "Ledger saved",
        saving: "Saving ledger"
      } satisfies Record<typeof state, string>
    )[state];
  }
  return (
    {
      failed: "入账失败",
      idle: "等待入账",
      saved: "已入审计账本",
      saving: "正在入账"
    } satisfies Record<typeof state, string>
  )[state];
}

function auditSigningKeyRotationLedgerRowStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      "Rotation plan blocked": "轮换计划阻断",
      "Rotation plan prepared": "轮换计划已准备",
      "Rotation apply blocked": "应用预检阻断",
      "Rotation apply ready": "应用预检就绪",
      "Controlled restart evidence blocked": "受控重启证据阻断",
      "Controlled restart evidence recorded": "受控重启证据已记录",
      "Secret materialization blocked": "物化清单阻断",
      "Secret materialization recorded": "物化清单已记录",
      "Environment binding blocked": "环境绑定阻断",
      "Environment binding recorded": "环境绑定已记录",
      "Runtime reload plan blocked": "运行时重载计划阻断",
      "Runtime reload plan recorded": "运行时重载计划已记录",
      "Runtime reload execution blocked": "运行时重载执行阻断",
      "Runtime reload execution recorded": "运行时重载执行已记录",
      "Rotation acceptance blocked": "最终验收阻断",
      "Rotation acceptance recorded": "最终验收已记录"
    }[statusLabel] ?? statusLabel
  );
}

function auditSigningKeyRotationChainHeadline(
  i18n: AppI18n,
  summary: AuditSigningKeyRotationChainSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      blocked: "证据链阻断",
      complete: "证据链已验收",
      empty: "暂无证据链",
      in_progress: "证据链推进中"
    } satisfies Record<AuditSigningKeyRotationChainSummary["state"], string>
  )[summary.state];
}

function auditSigningKeyRotationChainDetail(
  i18n: AppI18n,
  summary: AuditSigningKeyRotationChainSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "empty") {
    return "尚无签名 Key 轮换证据";
  }
  const progress = `${summary.completedCount}/${summary.totalCount} 个证据阶段已入账`;
  if (summary.state === "complete") {
    return `${progress} · 实盘仍保持阻断`;
  }
  const nextStage = summary.stages.find((stage) => stage.id === summary.nextStageId);
  if (summary.state === "blocked") {
    return `${progress} · 阻断：${nextStage ? auditSigningKeyRotationChainStageLabel(i18n, nextStage.id, nextStage.label) : "证据"}`;
  }
  return `${progress} · 下一步：${nextStage ? auditSigningKeyRotationChainStageLabel(i18n, nextStage.id, nextStage.label) : "证据"}`;
}

function auditSigningKeyRotationChainStageLabel(
  i18n: AppI18n,
  stageId: AuditSigningKeyRotationChainSummary["stages"][number]["id"],
  fallback: string
): string {
  if (i18n.locale === "en-US") {
    return fallback;
  }
  return (
    {
      environment_binding: "环境绑定",
      rotation_acceptance: "最终验收闸门",
      rotation_plan: "轮换计划",
      runtime_reload_execution: "重载执行证据",
      runtime_reload_plan: "运行时重载计划",
      secret_materialization: "Secret 物化清单"
    } satisfies Record<AuditSigningKeyRotationChainSummary["stages"][number]["id"], string>
  )[stageId];
}

function auditSigningKeyRotationChainStageStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRotationChainSummary["stages"][number]["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        blocked: "Blocked",
        complete: "Complete",
        missing: "Missing"
      } satisfies Record<typeof status, string>
    )[status];
  }
  return (
    {
      blocked: "阻断",
      complete: "完成",
      missing: "缺失"
    } satisfies Record<typeof status, string>
  )[status];
}

function auditSigningKeyRotationApplyStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRotationApply["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Apply blocked" : "Ready for restart";
  }
  return status === "blocked" ? "应用阻断" : "可重启生效";
}

function auditSigningKeyRotationApplyReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      current_key_fingerprint_mismatch: "当前 key 指纹不匹配",
      current_key_mismatch: "当前 key 不匹配",
      legacy_secret_not_confirmed: "legacy secret 未确认",
      new_secret_material_not_confirmed: "新 secret 未确认",
      operator_review_not_confirmed: "人工复核未确认",
      proposed_key_already_exists_in_registry: "拟启用 key 已在注册表",
      proposed_key_matches_current_active_key: "拟启用 key 与当前 key 相同",
      proposed_key_required: "缺少拟启用 key"
    }[reason] ?? reason
  );
}

function auditSigningKeyRestartEvidenceStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyControlledRestartEvidence["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Evidence blocked" : "Evidence recorded";
  }
  return status === "blocked" ? "证据阻断" : "证据已记录";
}

function auditSigningKeyRestartEvidenceReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      controlled_restart_not_required: "无需受控重启",
      ready_apply_event_required: "缺少就绪的应用预检事件",
      restart_logs_not_confirmed: "重启日志未复核",
      restart_window_not_confirmed: "重启窗口未确认",
      rollback_plan_not_confirmed: "回滚计划未确认",
      post_restart_validation_not_confirmed: "重启后验收未确认"
    }[reason] ?? reason
  );
}

function auditSigningKeySecretMaterializationStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeySecretMaterialization["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Materialization blocked" : "Manifest recorded";
  }
  return status === "blocked" ? "物化阻断" : "清单已记录";
}

function auditSigningKeySecretMaterializationReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      secret_materialization_env_binding_plan_missing: "环境绑定计划缺失",
      secret_materialization_local_store_not_verified: "本地 secret-store 未核验",
      secret_materialization_plan_not_prepared: "轮换计划未准备",
      secret_materialization_raw_secret_boundary_not_confirmed: "raw secret 边界未确认",
      secret_materialization_rollback_plan_missing: "回滚计划缺失"
    }[reason] ?? reason
  );
}

function auditSigningKeyEnvironmentBindingStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyEnvironmentBinding["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Binding blocked" : "Binding recorded";
  }
  return status === "blocked" ? "绑定阻断" : "绑定已记录";
}

function auditSigningKeyEnvironmentBindingReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      audit_signing_key_environment_binding_materialization_id_required: "缺少物化清单 ID",
      environment_binding_config_reload_plan_missing: "配置重载计划缺失",
      environment_binding_materialization_not_recorded: "物化清单未记录",
      environment_binding_raw_secret_boundary_not_confirmed: "raw secret 边界未确认",
      environment_binding_rollback_snapshot_missing: "回滚快照缺失",
      environment_binding_runtime_env_mapping_missing: "运行环境映射未核验"
    }[reason] ?? reason
  );
}

function auditSigningKeyRuntimeReloadPlanStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRuntimeReloadPlan["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Reload plan blocked" : "Reload plan recorded";
  }
  return status === "blocked" ? "重载计划阻断" : "重载计划已记录";
}

function auditSigningKeyRuntimeReloadPlanReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      runtime_reload_config_diff_missing: "配置 diff 未复核",
      runtime_reload_environment_binding_not_recorded: "环境绑定未记录",
      runtime_reload_health_baseline_missing: "健康基线未捕获",
      runtime_reload_maintenance_window_missing: "维护窗口未批准",
      runtime_reload_rollback_owner_missing: "回滚负责人未指定",
      runtime_reload_smoke_plan_missing: "重载后 smoke 计划缺失"
    }[reason] ?? reason
  );
}

function auditSigningKeyRuntimeReloadExecutionStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRuntimeReloadExecution["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Execution blocked" : "Execution recorded";
  }
  return status === "blocked" ? "执行证据阻断" : "执行证据已记录";
}

function auditSigningKeyRuntimeReloadExecutionReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      runtime_reload_execution_action_record_missing: "重载动作记录缺失",
      runtime_reload_execution_live_block_boundary_missing: "实盘阻断边界确认缺失",
      runtime_reload_execution_plan_not_recorded: "重载计划尚未入账",
      runtime_reload_execution_post_smoke_missing: "重载后 smoke 缺失",
      runtime_reload_execution_pre_health_missing: "重载前健康复核缺失",
      runtime_reload_execution_rollback_readiness_missing: "回滚就绪确认缺失"
    }[reason] ?? reason
  );
}

function auditSigningKeyRotationAcceptanceStatusLabel(
  i18n: AppI18n,
  status: AuditSigningKeyRotationAcceptance["status"]
): string {
  if (i18n.locale === "en-US") {
    return status === "blocked" ? "Acceptance blocked" : "Acceptance recorded";
  }
  return status === "blocked" ? "最终验收阻断" : "最终验收已记录";
}

function auditSigningKeyRotationAcceptanceReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason.replaceAll("_", " ");
  }
  return (
    {
      rotation_acceptance_activation_boundary_missing: "新 key 激活阻断边界未确认",
      rotation_acceptance_execution_evidence_not_reviewed: "执行证据未复核",
      rotation_acceptance_legacy_verification_missing: "历史报告验签未确认",
      rotation_acceptance_rollback_window_missing: "回滚窗口未确认",
      rotation_acceptance_signature_probe_missing: "签名探针缺失",
      runtime_reload_execution_not_recorded: "运行时重载执行证据未入账"
    }[reason] ?? reason
  );
}

function auditSigningKeyRotationStepTitle(i18n: AppI18n, title: string): string {
  if (i18n.locale === "en-US") {
    return title;
  }
  return (
    {
      "Set new active signing key": "设置新的活跃签名 Key",
      "Retire current key into legacy registry": "把当前 Key 退役进 legacy 注册表",
      "Restart local core": "重启本地核心服务",
      "Verify legacy reports": "验签历史审计报告"
    }[title] ?? title
  );
}

function auditSigningKeyRotationStepDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return (
    {
      "Update active signing key environment variables with new locally generated key material.":
        "用本地生成的新 key material 更新活跃签名环境变量。",
      "Keep the current active key in AIQT_AUDIT_SIGNING_KEYS_JSON so old reports remain verifiable.":
        "把当前活跃 Key 保留在 AIQT_AUDIT_SIGNING_KEYS_JSON 中，让旧报告继续可验签。",
      "Restart API and web containers after changing signing environment variables.":
        "修改签名环境变量后重启 API 和 Web 容器。",
      "Run Audit report verification on old signed reports before removing any retired key.":
        "移除任何退役 Key 前，先对旧签名报告运行验签。"
    }[detail] ?? detail
  );
}

function researchImportAuditStageLabel(i18n: AppI18n, stage: ResearchRunImportAuditEvent["stage"]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        preview: "Preview",
        blocked: "Blocked",
        confirmed: "Applied",
        failed: "Failed",
        cancelled: "Cancelled",
        undone: "Undone",
        "undo-failed": "Undo failed"
      } satisfies Record<ResearchRunImportAuditEvent["stage"], string>
    )[stage];
  }
  return (
    {
      preview: "预检",
      blocked: "阻断",
      confirmed: "已确认",
      failed: "失败",
      cancelled: "已取消",
      undone: "已撤销",
      "undo-failed": "撤销失败"
    } satisfies Record<ResearchRunImportAuditEvent["stage"], string>
  )[stage];
}

function researchImportAuditFailureBucketLabel(
  i18n: AppI18n,
  bucket: ResearchRunImportAuditFailureBucket
): string {
  if (i18n.locale === "en-US") {
    return bucket.label;
  }
  return (
    {
      "Preflight blocked": "预检阻断",
      "Schema contract": "契约格式",
      "Integrity check": "完整性校验",
      "Artifact counts": "证据数量",
      "Core rejection": "核心拒绝",
      "Unknown failure": "未知失败"
    }[bucket.label] ?? bucket.label
  );
}

function researchImportBlockedEvidenceBucketLabel(
  i18n: AppI18n,
  bucket: ResearchRunImportBlockedEvidenceBucket
): string {
  if (i18n.locale === "en-US") {
    return bucket.label;
  }
  return (
    {
      "Import verification": "导入验签",
      "Report signature": "报告签名",
      "Package integrity": "复现包完整性",
      "Artifact counts": "证据数量",
      "Live boundary": "实盘边界",
      "Data snapshot": "数据快照",
      "Other blocked evidence": "其他阻断证据"
    }[bucket.label] ?? bucket.label
  );
}

function researchImportVerifiedReportSignatureBucketLabel(
  i18n: AppI18n,
  bucket: ResearchRunImportVerifiedReportSignatureBucket
): string {
  if (i18n.locale === "en-US") {
    return bucket.label;
  }
  return (
    {
      "Local core verified": "本地核心验签通过",
      "Local core invalid": "本地核心验签失败"
    }[bucket.label] ?? bucket.label
  );
}

function researchImportAuditSummaryLabel(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace("Import preview blocked", "导入预检已阻断")
    .replace("Import preview ready", "导入预检已就绪")
    .replace("Import applied", "导入已写入")
    .replace("Import undo failed", "导入撤销失败")
    .replace("Import undone", "导入已撤销")
    .replace("Import failed", "导入失败")
    .replace("Import cancelled", "导入已取消");
}

function researchImportAuditDetailLabel(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Import preview found blocked preflight gates.", "导入预检发现阻断闸门。")
    .replace("Import preview passed preflight.", "导入预检已通过。")
    .replace("Research run import wrote to the local audit store.", "研究运行导入已写入本地审计库。")
    .replace("Research run import undo restored the previous audited stores.", "研究运行导入撤销已恢复导入前的审计存储。")
    .replace(
      "Research run import undo failed before the previous audited stores could be restored.",
      "导入撤销在恢复导入前审计存储之前失败。"
    )
    .replace("Import preview was discarded before writing to the local audit store.", "导入预检已放弃，没有写入本地审计库。")
    .replace("Import failed before the package could be applied.", "复现包写入前导入失败。")
    .replace("Invalid research run export contract", "研究运行导出契约无效")
    .replace("Research run import failed", "研究运行导入失败")
    .replaceAll("blocked", "阻断")
    .replaceAll("changes", "处变更")
    .replaceAll("change", "处变更");
}

function researchImportAuditRecoveryLabel(i18n: AppI18n, recoveryHint: string): string {
  if (i18n.locale === "en-US") {
    return recoveryHint;
  }
  return recoveryHint
    .replace(/^Undo import (.+) to restore the audited stores\.$/u, "撤销导入 $1，恢复导入前的审计存储。")
    .replace(/^Import undo has already consumed (.+)\.$/u, "导入撤销已消费 $1。")
    .replace(
      "Review the undo rejection detail, replay the previous audited run if needed, then retry with the matching import event.",
      "请检查撤销拒绝细节，必要时回放旧的已审计 run，再使用匹配的导入事件重试。"
    )
    .replace(/^Replay previous audited run (.+) to roll back the workspace context\.$/u, "回放旧的已审计 run $1，以恢复导入前的工作台上下文。")
    .replace(
      "No previous audited run was bound before import; replay a run from history to change context.",
      "导入前没有绑定旧的已审计 run；可从历史记录回放其他 run 来切换上下文。"
    )
    .replace(
      "Choose a valid aiqt.researchRun.export package or a wrapped { export } payload.",
      "请选择有效的 aiqt.researchRun.export 复现包，或包含 { export } 的包装 payload。"
    )
    .replace(
      "Re-export the run or choose a package whose canonical SHA-256 integrity matches its payload.",
      "请重新导出该 run，或选择 canonical SHA-256 完整性与 payload 匹配的复现包。"
    )
    .replace(
      "Re-export the run and ensure manifest artifact counts match the included payload arrays.",
      "请重新导出该 run，并确认 manifest 里的产物数量与 payload 数组一致。"
    )
    .replace(
      "Review the Python core rejection detail, fix the package, and run import preflight again.",
      "请查看 Python 核心拒绝原因，修复复现包后重新运行导入预检。"
    )
    .replace(
      "Inspect the import error, then retry with a verified research run export package.",
      "请检查导入错误，再使用已验证的研究运行复现包重试。"
    )
    .replace("Import not applied; fix blocked preflight rows before confirming.", "导入尚未写入；请先修复预检阻断项再确认。")
    .replace("Import not applied; no rollback is required.", "导入尚未写入；无需回滚。")
    .replace("Import not applied yet; confirm only after reviewing diff rows.", "导入尚未写入；请审阅差异行后再确认。");
}

function researchImportUndoConfirmationMessage(i18n: AppI18n, message: string): string {
  if (i18n.locale === "en-US") {
    return message;
  }
  return message.replace("Confirm import undo", "确认撤销导入");
}

function researchImportUndoConfirmationDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail.replace(
    /^Undo import (.+) will restore previous audited stores and cannot be repeated\.$/u,
    "撤销导入 $1 会恢复导入前的审计存储，且不能重复执行。"
  );
}

function researchImportAuditTimeLabel(createdAt: string): string {
  if (!createdAt) {
    return "-";
  }
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return createdAt;
  }
  return parsed.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  });
}

function researchExportIndexStatusLabel(
  i18n: AppI18n,
  status: ResearchRunExportIndexRow["status"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        ready: "Ready",
        review: "Review",
        blocked: "Blocked"
      } satisfies Record<ResearchRunExportIndexRow["status"], string>
    )[status];
  }
  return (
    {
      ready: "就绪",
      review: "复核",
      blocked: "阻断"
    } satisfies Record<ResearchRunExportIndexRow["status"], string>
  )[status];
}

function researchExportIndexDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Integrity missing", "完整性缺失")
    .replace("Data snapshot mismatch", "数据快照不一致")
    .replace("Paper execution count mismatch", "模拟执行数量不一致")
    .replace("Promotion candidate count mismatch", "晋级候选数量不一致")
    .replace("AI review count mismatch", "AI 评审数量不一致")
    .replace("Package is consistent and live handoff is open.", "复现包一致，实盘交接闸门已开启。")
    .replace("Package is consistent; paper-only handoff requires review.", "复现包一致；仅模拟盘交接需要复核。");
}

function researchExportIndexDate(i18n: AppI18n, exportedAt: string): string {
  if (!exportedAt) {
    return i18n.locale === "zh-CN" ? "无导出时间" : "No export time";
  }
  return i18n.locale === "zh-CN" ? `导出 ${exportedAt}` : `exported ${exportedAt}`;
}

function aiReviewDriftStatusText(i18n: AppI18n, row: AiReviewRecordDriftRow): string {
  if (row.status === "matched") {
    return i18n.locale === "zh-CN" ? "匹配" : "Matched";
  }
  return i18n.locale === "zh-CN" ? `${row.driftCount} 项漂移` : `${row.driftCount} drift`;
}

function aiReviewDriftReasonText(i18n: AppI18n, row: AiReviewRecordDriftRow): string {
  if (!row.driftReasons.length) {
    return i18n.locale === "zh-CN"
      ? `引用 ${row.citationCount} 条 · 委员会 ${row.roundCount} 轮 · ${aiReviewAuditBoundaryLabel(i18n, row.liveExecutionBlocked)}`
      : `${row.citationCount} citations · ${row.roundCount} rounds · ${aiReviewAuditBoundaryLabel(
          i18n,
          row.liveExecutionBlocked
        )}`;
  }
  return row.driftReasons.map((reason) => aiReviewDriftReasonLabel(i18n, reason)).join(i18n.locale === "zh-CN" ? "、" : ", ");
}

function aiReviewDriftReasonLabel(i18n: AppI18n, reason: AiReviewRecordDriftRow["driftReasons"][number]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        run: "run",
        strategy: "strategy revision",
        status: "dossier status",
        citations: "citations",
        rounds: "committee rounds",
        boundary: "live boundary"
      } satisfies Record<AiReviewRecordDriftRow["driftReasons"][number], string>
    )[reason];
  }
  return (
    {
      run: "审计运行",
      strategy: "策略版本",
      status: "档案状态",
      citations: "引用证据",
      rounds: "委员会轮次",
      boundary: "实盘边界"
    } satisfies Record<AiReviewRecordDriftRow["driftReasons"][number], string>
  )[reason];
}

function aiReviewAuditStatusLabel(i18n: AppI18n, status: AiReviewDossier["status"]): string {
  if (status === "ready") {
    return i18n.locale === "zh-CN" ? "可评审" : "Ready";
  }
  return i18n.locale === "zh-CN" ? "阻断" : "Blocked";
}

function aiReviewAuditBoundaryLabel(i18n: AppI18n, blocked: boolean): string {
  if (blocked) {
    return i18n.locale === "zh-CN" ? "仅模拟盘" : "Paper only";
  }
  return i18n.locale === "zh-CN" ? "实盘闸门开启" : "Live gates open";
}

function AgentEvidenceBoard({ cards, i18n }: { cards: AiEvidenceCard[]; i18n: AppI18n }) {
  return (
    <div className="agent-evidence">
      <div className="agent-rounds-title">
        <span>{i18n.t("panel.agent.evidence")}</span>
        <strong>{cards.length}</strong>
      </div>
      <div className="agent-evidence-grid">
        {cards.map((card) => (
          <article className={`agent-evidence-card ${card.tone}`} key={card.id}>
            <span>{agentEvidenceLabel(i18n, card)}</span>
            <strong>{agentEvidenceValue(i18n, card)}</strong>
            <p>{agentEvidenceDetail(i18n, card)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AgentCommitteeBoard({ i18n, rounds }: { i18n: AppI18n; rounds: AgentCommitteeRound[] }) {
  return (
    <div className="agent-rounds">
      <div className="agent-rounds-title">
        <span>{i18n.t("panel.agent.rounds")}</span>
        <strong>{rounds.length}</strong>
      </div>
      {rounds.map((round) => (
        <article className={`agent-round ${round.tone}`} key={round.id}>
          <header>
            <span>{agentPhaseLabel(i18n, round.phase)}</span>
            <strong>{i18n.decisionAgent(round.agent)}</strong>
            <em>{round.confidence}%</em>
          </header>
          <p>{agentRoundThesis(i18n, round)}</p>
          <small>
            {agentVerdictLabel(i18n, round.verdict)} · {agentRoundEvidence(i18n, round.evidence)}
          </small>
        </article>
      ))}
    </div>
  );
}

function DecisionLogPanel({
  className,
  entries,
  i18n
}: {
  className?: string;
  entries: TerminalWorkspace["decisionLog"];
  i18n: AppI18n;
}) {
  return (
    <Panel title={i18n.t("panel.decision.title")} subtitle={i18n.t("panel.decision.subtitle")} className={className}>
      <div className="decision-log">
        {entries.map((entry) => (
          <article className={`decision-entry ${entry.tone}`} key={`${entry.agent}-${entry.message}`}>
            <strong>{i18n.decisionAgent(entry.agent)}</strong>
            <p>{i18n.decisionMessage(entry.message)}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function RunHistoryPanel({
  className,
  i18n,
  onExport,
  onInspectExport,
  onImportFile,
  onReplay,
  runComparisonRows,
  runHistory,
  workspace
}: {
  className?: string;
  i18n: AppI18n;
  onExport: (run: ResearchRunAudit) => void;
  onInspectExport: (run: ResearchRunAudit) => void;
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onReplay: (run: ResearchRunAudit) => void;
  runComparisonRows: ResearchRunComparisonRow[];
  runHistory: ResearchRunAudit[];
  workspace: TerminalWorkspace;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <Panel
      title={i18n.t("panel.history.title")}
      subtitle={i18n.t("panel.history.subtitle")}
      className={className}
      action={
        <div className="history-panel-actions">
          <input
            accept="application/json,.json"
            className="history-import-input"
            onChange={onImportFile}
            ref={importInputRef}
            type="file"
          />
          <button className="history-import-button" onClick={() => importInputRef.current?.click()} type="button">
            <Upload size={13} />
            <span>{i18n.t("history.import")}</span>
          </button>
        </div>
      }
    >
      <div className="history-panel-body">
        {runComparisonRows.length ? <RunComparisonBoard i18n={i18n} rows={runComparisonRows} /> : null}
        <div className="run-history">
          {runHistory.length ? (
            runHistory.map((run) => (
              <RunHistoryRow
                key={run.runId}
                i18n={i18n}
                run={run}
                isActive={workspace.researchRun?.runId === run.runId}
                onExport={onExport}
                onInspectExport={onInspectExport}
                onReplay={onReplay}
              />
            ))
          ) : (
            <span className="empty-state">{i18n.t("empty.noAuditedRuns")}</span>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ExecutionPanel({
  approval,
  approvingPortfolioOrderId = null,
  className,
  i18n,
  isSubmitting = false,
  onApprovePortfolioOrder,
  onRejectPortfolioOrder,
  onSimulatePortfolioOrder,
  onSubmit,
  portfolioOrderApprovalRows = [],
  portfolioOrderLatestSimulationSummary = null,
  portfolioOrderReplayPositionRows = [],
  portfolioOrderReplaySummaryTiles = [],
  portfolioOrderRows = [],
  portfolioOrderSimulationRouteRows = [],
  portfolioOrderSimulations = [],
  portfolioOrderStateHistoryRows = [],
  rows,
  simulatingPortfolioOrderId = null,
  summaryTiles,
  workspace
}: {
  approval: RiskApprovalSummary;
  approvingPortfolioOrderId?: string | null;
  className?: string;
  i18n: AppI18n;
  isSubmitting?: boolean;
  onApprovePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onRejectPortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSimulatePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSubmit?: () => void;
  portfolioOrderApprovalRows?: PortfolioPaperOrderApprovalRow[];
  portfolioOrderLatestSimulationSummary?: PortfolioPaperOrderLatestSimulationSummary | null;
  portfolioOrderReplayPositionRows?: PortfolioPaperOrderReplayPositionRow[];
  portfolioOrderReplaySummaryTiles?: PortfolioPaperOrderReplaySummaryTile[];
  portfolioOrderRows?: PortfolioPaperOrderLifecycleRow[];
  portfolioOrderSimulationRouteRows?: PortfolioPaperOrderSimulationRouteRow[];
  portfolioOrderSimulations?: PortfolioPaperOrderSimulation[];
  portfolioOrderStateHistoryRows?: PortfolioPaperOrderStateHistoryRow[];
  rows: PaperTradingRow[];
  simulatingPortfolioOrderId?: string | null;
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
  const [portfolioOrderFocusedStateId, setPortfolioOrderFocusedStateId] = useState<string | null>(null);

  return (
    <Panel
      title={i18n.t("panel.execution.title")}
      subtitle={i18n.t("panel.execution.subtitle")}
      className={className}
      action={
        onSubmit ? (
          <button
            className="run-button compact"
            disabled={isSubmitting || approval.status === "blocked"}
            onClick={onSubmit}
            title={i18n.t("execution.submitPaper")}
            type="button"
          >
            {isSubmitting ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}
            {i18n.t("execution.submitPaper")}
          </button>
        ) : undefined
      }
    >
      <RiskApprovalBoard approval={approval} i18n={i18n} />
      <div className="execution-grid">
        {summaryTiles.map((tile) => (
          <ExecutionTile
            detail={paperExecutionTileDetail(i18n, tile)}
            icon={paperExecutionTileIcon(tile.id)}
            key={tile.id}
            label={paperExecutionTileLabel(i18n, tile)}
            tone={tile.tone}
            value={paperExecutionTileValue(i18n, tile)}
          />
        ))}
      </div>
      {portfolioOrderReplaySummaryTiles.length ? (
        <div className="execution-grid portfolio-replay-grid">
          {portfolioOrderReplaySummaryTiles.map((tile) => (
            <ExecutionTile
              detail={portfolioReplayTileDetail(i18n, tile)}
              icon={portfolioReplayTileIcon(tile.id)}
              key={tile.id}
              label={portfolioReplayTileLabel(i18n, tile)}
              tone={tile.tone}
              value={portfolioReplayTileValue(i18n, tile)}
            />
          ))}
        </div>
      ) : null}
      <div className="gate-list">
        {workspace.execution.gates.map((gate) => (
          <span key={gate.id} className={gate.passed ? "passed" : "blocked"}>
            {i18n.gateLabel(gate.id, gate.label)}
          </span>
        ))}
      </div>
      {portfolioOrderLatestSimulationSummary ? (
        <div className={`portfolio-order-latest-simulation ${portfolioOrderLatestSimulationSummary.tone}`}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "最近模拟成交" : "Latest paper fill"}</span>
            <strong>{portfolioOrderLatestSimulationSummary.fillLabel}</strong>
            <p>{portfolioOrderLatestSimulationSummary.orderLabel}</p>
          </div>
          <div>
            <span>{i18n.locale === "zh-CN" ? "账户回放" : "Replay account"}</span>
            <strong>{portfolioOrderLatestSimulationSummary.accountLabel}</strong>
            <p>{portfolioOrderLatestSimulationSummary.timelineLabel}</p>
          </div>
          <button
            className="portfolio-order-latest-simulation-action"
            disabled={!portfolioOrderLatestSimulationSummary.stateEventId}
            onClick={() => setPortfolioOrderFocusedStateId(portfolioOrderLatestSimulationSummary.stateEventId)}
            title={portfolioOrderLatestSimulationSummary.focusQuery}
            type="button"
          >
            <Search size={13} />
            {i18n.locale === "zh-CN" ? "定位流水" : "Focus timeline"}
          </button>
          <em>{portfolioOrderLatestSimulationSummary.boundaryLabel}</em>
        </div>
      ) : null}
      <div className="paper-blotter">
        <div className="paper-blotter-title">
          <span>{i18n.t("execution.paperBlotter")}</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="paper-blotter-table">
          <div className="paper-blotter-row paper-blotter-head">
            <span>{i18n.t("chart.symbol")}</span>
            <span>{i18n.t("execution.side")}</span>
            <span>{i18n.t("execution.quantity")}</span>
            <span>{i18n.t("execution.price")}</span>
            <span>{i18n.t("execution.notional")}</span>
            <span>{i18n.t("execution.status")}</span>
            <span>{i18n.t("execution.reason")}</span>
          </div>
          {rows.map((row) => (
            <div className={`paper-blotter-row ${row.tone}`} key={row.id}>
              <span>{row.symbol}</span>
              <span>{paperSideLabel(i18n, row.side)}</span>
              <span>{row.quantity}</span>
              <span>{row.price}</span>
              <span>{paperNotionalLabel(i18n, row.notional)}</span>
              <span>{paperStatusLabel(i18n, row.status)}</span>
              <span>{paperReasonLabel(i18n, row.reason)}</span>
            </div>
          ))}
        </div>
      </div>
      {portfolioOrderRows.length ? (
        <div className="paper-blotter portfolio-order-lifecycle">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合委托批次" : "Portfolio order batches"}</span>
            <strong>{portfolioOrderRows.length}</strong>
          </div>
          <div className="paper-blotter-table">
            <div className="paper-blotter-row paper-blotter-head portfolio-order-row">
              <span>{i18n.locale === "zh-CN" ? "组合" : "Portfolio"}</span>
              <span>{i18n.locale === "zh-CN" ? "批次" : "Batch"}</span>
              <span>{i18n.t("execution.notional")}</span>
              <span>{i18n.t("execution.status")}</span>
              <span>{i18n.locale === "zh-CN" ? "状态机" : "State machine"}</span>
              <span>{i18n.locale === "zh-CN" ? "审计事件" : "Audit event"}</span>
            </div>
            {portfolioOrderRows.map((row) => (
              <div className={`paper-blotter-row portfolio-order-row ${row.tone}`} key={row.id}>
                <span>{row.portfolioName}</span>
                <span>{row.batchId}</span>
                <span>{formatPlainNumber(row.notionalValue)}</span>
                <span>{portfolioOrderLifecycleStatusLabel(i18n, row)}</span>
                <span>{portfolioOrderExecutionStateLabel(i18n, row)}</span>
                <span>{row.auditEventId}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderStateHistoryRows.length ? (
        <div className="portfolio-order-state-history">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "委托状态时间线" : "Order state timeline"}</span>
            <strong>{portfolioOrderStateHistoryRows.length}</strong>
          </div>
          <div className="portfolio-order-state-list">
            {portfolioOrderStateHistoryRows.map((row) => (
              <article
                className={`portfolio-order-state-row ${row.tone}${
                  portfolioOrderFocusedStateId === row.id ? " focused" : ""
                }`}
                key={row.id}
              >
                <div>
                  <strong>
                    {row.symbol} · {portfolioOrderStateLabel(i18n, row)}
                  </strong>
                  <span>{row.orderId}</span>
                </div>
                <p>{portfolioOrderStateReason(i18n, row)}</p>
                <em>
                  {formatChartDate(row.timestamp)} · {row.actor || row.source}
                </em>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderSimulationRouteRows.length ? (
        <div className="portfolio-simulation-route">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "模拟路由检查" : "Simulation route checks"}</span>
            <strong>{portfolioOrderSimulationRouteRows.filter((row) => row.canSimulate).length}</strong>
          </div>
          <div className="portfolio-simulation-route-list">
            {portfolioOrderSimulationRouteRows.map((row) => (
              <article className={`portfolio-simulation-route-row ${row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {row.symbol} · {portfolioTradeReviewSideLabel(i18n, row.side)}
                  </strong>
                  <span>{row.orderId}</span>
                </div>
                <div>
                  <span>{portfolioSimulationRouteStatusLabel(i18n, row)}</span>
                  <p>{portfolioSimulationRouteDetail(i18n, row)}</p>
                </div>
                <em title={row.focusQuery}>{portfolioSimulationRouteStateLabel(i18n, row)}</em>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderApprovalRows.length ? (
        <div className="portfolio-order-approval">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合委托审批" : "Portfolio order approvals"}</span>
            <strong>{portfolioOrderApprovalRows.length}</strong>
          </div>
          <div className="portfolio-order-approval-list">
            {portfolioOrderApprovalRows.map((row) => {
              const isApproving = approvingPortfolioOrderId === row.id;
              const isSimulating = simulatingPortfolioOrderId === row.id;
              const alreadySimulated = portfolioOrderSimulations.some(
                (simulation) => simulation.batchId === row.batchId && simulation.orderId === row.orderId
              );
              return (
                <article className={`portfolio-order-approval-row ${row.tone}`} key={row.id}>
                  <div>
                    <strong>
                      {row.symbol} · {portfolioTradeReviewSideLabel(i18n, row.side)}
                    </strong>
                    <span>{row.orderId}</span>
                    <p>{portfolioPaperOrderApprovalHint(i18n, row)}</p>
                  </div>
                  <div className="portfolio-order-approval-meta">
                    <span>
                      <small>{i18n.t("execution.quantity")}</small>
                      {formatPlainNumber(row.quantity)}
                    </span>
                    <span>
                      <small>{i18n.t("execution.notional")}</small>
                      {formatPlainNumber(row.notionalValue)}
                    </span>
                    <span>
                      <small>{i18n.locale === "zh-CN" ? "状态机" : "State"}</small>
                      {portfolioOrderApprovalStateLabel(i18n, row)}
                    </span>
                  </div>
                  <div className="portfolio-order-approval-actions">
                    <button
                      className="approve"
                      disabled={!row.canApprove || isApproving || !onApprovePortfolioOrder}
                      onClick={() => onApprovePortfolioOrder?.(row)}
                      type="button"
                    >
                      {isApproving ? <RefreshCw className="spin" size={13} /> : <Check size={13} />}
                      {i18n.locale === "zh-CN" ? "批准" : "Approve"}
                    </button>
                    <button
                      className="reject"
                      disabled={!row.canReject || isApproving || !onRejectPortfolioOrder}
                      onClick={() => onRejectPortfolioOrder?.(row)}
                      type="button"
                    >
                      <X size={13} />
                      {i18n.locale === "zh-CN" ? "拒绝" : "Reject"}
                    </button>
                    <button
                      className="simulate"
                      disabled={
                        row.state !== "ready_for_simulation" ||
                        alreadySimulated ||
                        isSimulating ||
                        !onSimulatePortfolioOrder
                      }
                      onClick={() => onSimulatePortfolioOrder?.(row)}
                      type="button"
                    >
                      {isSimulating ? <RefreshCw className="spin" size={13} /> : <Play size={13} />}
                      {alreadySimulated
                        ? i18n.locale === "zh-CN"
                          ? "已成交"
                          : "Filled"
                        : i18n.locale === "zh-CN"
                          ? "模拟成交"
                          : "Simulate"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
      {portfolioOrderReplayPositionRows.length ? (
        <div className="portfolio-order-replay">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合模拟账户持仓" : "Portfolio replay positions"}</span>
            <strong>{portfolioOrderReplayPositionRows.length}</strong>
          </div>
          <div className="portfolio-order-replay-table">
            <div className="portfolio-order-replay-row portfolio-order-replay-head">
              <span>{i18n.t("chart.symbol")}</span>
              <span>{i18n.t("execution.quantity")}</span>
              <span>{i18n.t("portfolio.avgCost")}</span>
              <span>{i18n.t("portfolio.markPrice")}</span>
              <span>{i18n.t("portfolio.marketValue")}</span>
              <span>{i18n.t("portfolio.unrealizedPnl")}</span>
            </div>
            {portfolioOrderReplayPositionRows.map((row) => (
              <div className={`portfolio-order-replay-row ${row.tone}`} key={row.id}>
                <span>{row.symbol}</span>
                <span>{row.quantity}</span>
                <span>{row.avgCost}</span>
                <span>{row.lastPrice}</span>
                <span>{row.marketValue}</span>
                <span>{row.unrealizedPnl}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {portfolioOrderSimulations.length ? (
        <div className="portfolio-order-simulation">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "组合模拟成交" : "Portfolio simulated fills"}</span>
            <strong>{portfolioOrderSimulations.length}</strong>
          </div>
          <div className="portfolio-order-simulation-list">
            {portfolioOrderSimulations.map((simulation) => (
              <article className="portfolio-order-simulation-row" key={simulation.simulationId}>
                <strong>
                  {simulation.symbol} · {portfolioTradeReviewSideLabel(i18n, simulation.side)}
                </strong>
                <span>{simulation.orderId}</span>
                <span>{formatPlainNumber(simulation.quantity)}</span>
                <span>{formatPlainNumber(simulation.fillPrice)}</span>
                <span>{formatPlainNumber(simulation.notionalValue)}</span>
                <em>{i18n.locale === "zh-CN" ? "paper-only 已成交" : "paper-only filled"}</em>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function ScannerWorkspace({
  candidates,
  className = "module-workspace-panel",
  i18n,
  onSelectInstrument
}: {
  candidates: ScannerCandidate[];
  className?: string;
  i18n: AppI18n;
  onSelectInstrument: (instrument: TerminalWorkspace["selectedInstrument"]) => void;
}) {
  return (
    <Panel title={i18n.t("module.scanner.title")} subtitle={i18n.t("module.scanner.subtitle")} className={className}>
      <div className="module-toolbar">
        <span>{i18n.t("module.scanner.filters")}: watchlist · momentum · risk</span>
        <strong>{candidates.length}</strong>
      </div>
      <div className="scanner-table">
        <div className="scanner-row scanner-head">
          <span>{i18n.t("chart.symbol")}</span>
          <span>{i18n.t("module.scanner.score")}</span>
          <span>{i18n.t("module.scanner.signal")}</span>
          <span>{i18n.t("module.scanner.risk")}</span>
          <span>{i18n.t("module.scanner.research")}</span>
        </div>
        {candidates.map((candidate) => (
          <div className="scanner-row" key={`${candidate.instrument.market}-${candidate.instrument.symbol}`}>
            <span>
              <strong>{candidate.instrument.symbol}</strong>
              <em>{candidate.instrument.name}</em>
            </span>
            <span>
              <b>{candidate.score}</b>
              <i style={{ width: `${candidate.score}%` }} />
            </span>
            <span>{scannerSignalLabel(i18n, candidate.signal)}</span>
            <span className={`risk-chip ${candidate.risk}`}>{riskLabel(i18n, candidate.risk)}</span>
            <button onClick={() => onSelectInstrument(candidate.instrument)} type="button">
              <Search size={14} />
              {i18n.t("module.scanner.research")}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PortfolioWorkspace({
  approvingPortfolioOrderId = null,
  className = "module-workspace-panel",
  executionClassName,
  i18n,
  isPreparingPortfolioPeers = false,
  isRecordingPortfolioPaperOrders = false,
  isRunningPortfolioBacktest = false,
  isSubmittingPaperExecution = false,
  onExportPortfolioMarkdown,
  onApprovePortfolioOrder,
  onPreparePortfolioPeers,
  onRecordPortfolioPaperOrders,
  onRejectPortfolioOrder,
  onRunPortfolioBacktest,
  onSimulatePortfolioOrder,
  onSubmitPaperExecution,
  paperRows,
  positionRows,
  portfolioBacktestDraft,
  portfolioBacktestDiagnosticRows,
  portfolioBacktestResult,
  portfolioPaperOrderBatches,
  portfolioPaperOrderApprovalRows,
  portfolioPaperOrderHistoryError,
  portfolioPaperOrderLifecycleRows,
  portfolioPaperOrderLatestSimulationSummary,
  portfolioPaperOrderReplayPositionRows,
  portfolioPaperOrderReplaySummaryTiles,
  portfolioPaperOrderSimulationRouteRows,
  portfolioPaperOrderSimulations,
  portfolioPaperOrderStateHistoryRows,
  portfolioPeerAuditPlan,
  riskApproval,
  rows,
  simulatingPortfolioOrderId = null,
  summaryTiles,
  workspace
}: {
  approvingPortfolioOrderId?: string | null;
  className?: string;
  executionClassName?: string;
  i18n: AppI18n;
  isPreparingPortfolioPeers?: boolean;
  isRecordingPortfolioPaperOrders?: boolean;
  isRunningPortfolioBacktest?: boolean;
  isSubmittingPaperExecution?: boolean;
  onApprovePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onExportPortfolioMarkdown?: () => void;
  onPreparePortfolioPeers?: () => void;
  onRecordPortfolioPaperOrders?: () => void;
  onRejectPortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onRunPortfolioBacktest?: () => void;
  onSimulatePortfolioOrder?: (row: PortfolioPaperOrderApprovalRow) => void;
  onSubmitPaperExecution?: () => void;
  paperRows: PaperTradingRow[];
  positionRows: PaperPositionRow[];
  portfolioBacktestDraft: PortfolioBacktestDraft;
  portfolioBacktestDiagnosticRows: PortfolioBacktestDiagnosticRow[];
  portfolioBacktestResult: PortfolioBacktestResult;
  portfolioPaperOrderBatches: PortfolioPaperOrderBatch[];
  portfolioPaperOrderApprovalRows: PortfolioPaperOrderApprovalRow[];
  portfolioPaperOrderHistoryError: string | null;
  portfolioPaperOrderLifecycleRows: PortfolioPaperOrderLifecycleRow[];
  portfolioPaperOrderLatestSimulationSummary: PortfolioPaperOrderLatestSimulationSummary | null;
  portfolioPaperOrderReplayPositionRows: PortfolioPaperOrderReplayPositionRow[];
  portfolioPaperOrderReplaySummaryTiles: PortfolioPaperOrderReplaySummaryTile[];
  portfolioPaperOrderSimulationRouteRows: PortfolioPaperOrderSimulationRouteRow[];
  portfolioPaperOrderSimulations: PortfolioPaperOrderSimulation[];
  portfolioPaperOrderStateHistoryRows: PortfolioPaperOrderStateHistoryRow[];
  portfolioPeerAuditPlan: PortfolioPeerAuditPlan;
  riskApproval: RiskApprovalSummary;
  rows: PortfolioRiskRow[];
  simulatingPortfolioOrderId?: string | null;
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
  const portfolioBacktest = portfolioBacktestResult.portfolio;
  const canExportPortfolioMarkdown = Boolean(portfolioBacktest && onExportPortfolioMarkdown);
  const canRunPortfolioBacktest = portfolioBacktestDraft.status === "ready" && Boolean(onRunPortfolioBacktest);
  const canRecordPortfolioPaperOrders = Boolean(
    portfolioBacktest?.paperOrderEvents?.length && onRecordPortfolioPaperOrders
  );
  const canPreparePortfolioPeers =
    portfolioPeerAuditPlan.status === "ready" && portfolioPeerAuditPlan.missingCount > 0 && Boolean(onPreparePortfolioPeers);

  return (
    <>
      <Panel title={i18n.t("module.portfolio.title")} subtitle={i18n.t("module.portfolio.subtitle")} className={className}>
        <div className="risk-ledger">
          {rows.map((row) => (
            <article className={`risk-ledger-row ${row.tone}`} key={row.id}>
              <span>{portfolioRiskLabel(i18n, row)}</span>
              <strong>{portfolioRiskValue(i18n, row)}</strong>
              <p>{portfolioRiskDetail(i18n, row)}</p>
            </article>
          ))}
        </div>
        <section className={`portfolio-backtest-panel ${portfolioBacktestDraft.status}`}>
          <div className="portfolio-backtest-header">
            <div>
              <span>{i18n.t("portfolio.backtest")}</span>
              <strong>{portfolioBacktestHeadline(i18n, portfolioBacktestDraft.headline)}</strong>
              <p>{portfolioBacktestSummary(i18n, portfolioBacktestDraft.summary)}</p>
            </div>
            <div className="portfolio-backtest-actions">
              <button
                className="run-button compact"
                disabled={!canPreparePortfolioPeers || isPreparingPortfolioPeers}
                onClick={onPreparePortfolioPeers}
                type="button"
              >
                <RefreshCw size={14} />
                {isPreparingPortfolioPeers ? i18n.t("portfolio.peerAuditsRunning") : i18n.t("portfolio.peerAuditsRun")}
              </button>
              <button
                className="run-button compact"
                disabled={!canRunPortfolioBacktest || isRunningPortfolioBacktest}
                onClick={onRunPortfolioBacktest}
                type="button"
              >
                <Play size={14} />
                {isRunningPortfolioBacktest ? i18n.t("portfolio.backtestRunning") : i18n.t("portfolio.backtestRun")}
              </button>
              <button
                className="run-button compact portfolio-report-action"
                disabled={!canExportPortfolioMarkdown}
                onClick={onExportPortfolioMarkdown}
                title={i18n.t("portfolio.exportMarkdown")}
                type="button"
              >
                <Download size={14} />
                {i18n.t("portfolio.exportMarkdown")}
              </button>
              <button
                className="run-button compact portfolio-record-action"
                disabled={!canRecordPortfolioPaperOrders || isRecordingPortfolioPaperOrders}
                onClick={onRecordPortfolioPaperOrders}
                title={i18n.t("portfolio.recordPaperOrders")}
                type="button"
              >
                <Check size={14} />
                {isRecordingPortfolioPaperOrders
                  ? i18n.t("portfolio.recordPaperOrdersRunning")
                  : i18n.t("portfolio.recordPaperOrders")}
              </button>
            </div>
          </div>
          <div className={`portfolio-peer-audit-plan ${portfolioPeerAuditPlan.status}`}>
            <div className="portfolio-backtest-title">
              <span>{i18n.t("portfolio.peerAudits")}</span>
              <strong>
                {portfolioPeerAuditPlan.auditedCount}/{portfolioPeerAuditPlan.candidates.length}
              </strong>
            </div>
            <p>{portfolioPeerAuditSummary(i18n, portfolioPeerAuditPlan.summary)}</p>
            <div className="portfolio-peer-audit-list">
              {portfolioPeerAuditPlan.candidates.map((candidate) => (
                <span className={candidate.status} key={`${candidate.market}:${candidate.symbol}`}>
                  <b>{candidate.symbol}</b>
                  <em>{portfolioPeerAuditStatusLabel(i18n, candidate.status)}</em>
                </span>
              ))}
            </div>
          </div>
          <div className="portfolio-backtest-content">
            <div className="portfolio-backtest-section">
              <div className="portfolio-backtest-title">
                <span>{i18n.t("portfolio.backtestDraft")}</span>
                <strong>{portfolioBacktestDraft.rows.length}</strong>
              </div>
              <div className="portfolio-backtest-leg-table">
                {portfolioBacktestDraft.rows.map((row) => (
                  <div className={`portfolio-backtest-leg-row ${row.current ? "current" : ""}`} key={row.runId}>
                    <span>
                      {row.symbol}
                      {row.current ? <em>{i18n.locale === "zh-CN" ? "当前" : "Current"}</em> : null}
                    </span>
                    <span>
                      <small>{i18n.t("portfolio.weight")}</small>
                      {row.weightLabel}
                    </span>
                    <span>
                      <small>{i18n.t("portfolio.totalReturn")}</small>
                      {row.totalReturnPct}
                    </span>
                    <span>
                      <small>{i18n.t("portfolio.maxDrawdown")}</small>
                      {row.maxDrawdownPct}
                    </span>
                  </div>
                ))}
                {!portfolioBacktestDraft.rows.length ? (
                  <p className="portfolio-backtest-empty">
                    {portfolioBacktestSummary(i18n, portfolioBacktestDraft.summary)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="portfolio-backtest-section">
              <div className="portfolio-backtest-title">
                <span>{i18n.t("portfolio.backtestResult")}</span>
                <strong>{portfolioBacktest?.legs.length ?? 0}</strong>
              </div>
              {portfolioBacktest ? (
                <>
                  <div className="portfolio-backtest-metrics">
                    <article>
                      <span>{i18n.t("portfolio.totalReturn")}</span>
                      <strong>{formatSignedPercent(portfolioBacktest.metrics.totalReturnPct)}</strong>
                    </article>
                    <article>
                      <span>{i18n.t("portfolio.maxDrawdown")}</span>
                      <strong>{formatPlainPercent(portfolioBacktest.metrics.maxDrawdownPct)}</strong>
                    </article>
                    <article>
                      <span>{i18n.t("portfolio.cash")}</span>
                      <strong>{formatPlainPercent(portfolioBacktest.cashWeight * 100)}</strong>
                    </article>
                    <article>
                      <span>{i18n.t("portfolio.dataRows")}</span>
                      <strong>{portfolioBacktest.equityCurve.length}</strong>
                    </article>
                  </div>
                  {portfolioBacktestDiagnosticRows.length ? (
                    <div className="portfolio-diagnostic-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.diagnostics")}</span>
                        <strong>{portfolioBacktestDiagnosticRows.length}</strong>
                      </div>
                      <div className="portfolio-diagnostic-grid">
                        {portfolioBacktestDiagnosticRows.map((row) => (
                          <article className={`risk-ledger-row ${row.tone}`} key={row.id}>
                            <span>{portfolioDiagnosticLabel(i18n, row)}</span>
                            <strong>{row.value}</strong>
                            <p>{portfolioDiagnosticDetail(i18n, row)}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="portfolio-backtest-leg-table result">
                    {portfolioBacktest.legs.map((leg) => (
                      <div className="portfolio-backtest-leg-row" key={leg.symbol}>
                        <span>{leg.symbol}</span>
                        <span>
                          <small>{i18n.t("portfolio.weight")}</small>
                          {formatPlainPercent(leg.targetWeight * 100)}
                        </span>
                        <span>
                          <small>{i18n.t("portfolio.contribution")}</small>
                          {formatSignedPercent(leg.contributionReturnPct)}
                        </span>
                        <span>
                          <small>{i18n.t("portfolio.tradeCount")}</small>
                          {leg.tradeCount}
                        </span>
                      </div>
                    ))}
                  </div>
                  {portfolioBacktest.allocationEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.allocationLedger")}</span>
                        <strong>{portfolioBacktest.allocationEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.allocationEvents.map((event, index) => (
                          <div className="portfolio-backtest-leg-row" key={`${event.eventType}:${event.symbol}:${index}`}>
                            <span>
                              {event.symbol}
                              <em>{portfolioAllocationEventTypeLabel(i18n, event.eventType)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.sourceRun")}</small>
                              {event.sourceRunId ?? "-"}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.weight")}</small>
                              {formatPlainPercent(event.targetWeight * 100)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(event.notionalValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.rebalanceEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.rebalanceReviewLedger")}</span>
                        <strong>{portfolioBacktest.rebalanceEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.rebalanceEvents.map((event, index) => (
                          <div className={`portfolio-backtest-leg-row ${event.status}`} key={`${event.eventType}:${event.symbol}:${index}`}>
                            <span>
                              {event.symbol}
                              <em>{portfolioRebalanceStatusLabel(i18n, event.status)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.endingWeight")}</small>
                              {formatPlainPercent(event.endingWeight * 100)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.deltaValue")}</small>
                              {formatSignedNumber(event.deltaValue)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.sourceRun")}</small>
                              {event.sourceRunId ?? "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.tradeReviewEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.tradeReviewLedger")}</span>
                        <strong>{portfolioBacktest.tradeReviewEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.tradeReviewEvents.map((event, index) => (
                          <div className={`portfolio-backtest-leg-row ${event.status}`} key={`${event.eventType}:${event.symbol}:${index}`}>
                            <span>
                              {event.symbol}
                              <em>{portfolioTradeReviewSideLabel(i18n, event.side)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(event.notionalValue)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.endingWeight")}</small>
                              {formatPlainPercent(event.endingWeight * 100)}
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioTradeReviewStatusLabel(i18n, event.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.preTradeRiskChecks?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.preTradeRiskChecks")}</span>
                        <strong>{portfolioBacktest.preTradeRiskChecks.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.preTradeRiskChecks.map((check, index) => (
                          <div className={`portfolio-backtest-leg-row ${check.status}`} key={`${check.checkId}:${check.symbol ?? "portfolio"}:${index}`}>
                            <span>
                              {check.symbol ?? i18n.t("portfolio.scopePortfolio")}
                              <em>{portfolioPreTradeRiskCheckLabel(i18n, check.checkId)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioPreTradeRiskStatusLabel(i18n, check.status)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.preTradeRiskValue")}</small>
                              {formatPlainNumber(check.value)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.preTradeRiskLimit")}</small>
                              {formatPlainNumber(check.limit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioBacktest.paperOrderEvents?.length ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.paperOrderEvents")}</span>
                        <strong>{portfolioBacktest.paperOrderEvents.length}</strong>
                      </div>
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioBacktest.paperOrderEvents.map((event) => (
                          <div className={`portfolio-backtest-leg-row paper-order ${event.status}`} key={event.orderId}>
                            <span>
                              {event.symbol}
                              <em>{portfolioTradeReviewSideLabel(i18n, event.side)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(event.notionalValue)}
                            </span>
                            <span>
                              <small>{i18n.t("execution.quantity")}</small>
                              {formatPlainNumber(event.quantity)}
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioPaperOrderStatusLabel(i18n, event.status)}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.riskStatus")}</small>
                              {portfolioPreTradeRiskStatusLabel(i18n, event.riskStatus)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {portfolioPaperOrderBatches.length || portfolioPaperOrderHistoryError ? (
                    <div className="portfolio-allocation-ledger">
                      <div className="portfolio-backtest-title">
                        <span>{i18n.t("portfolio.paperOrderHistory")}</span>
                        <strong>{portfolioPaperOrderBatches.length}</strong>
                      </div>
                      {portfolioPaperOrderHistoryError ? (
                        <p className="portfolio-backtest-empty">{portfolioPaperOrderHistoryError}</p>
                      ) : null}
                      <div className="portfolio-backtest-leg-table allocation">
                        {portfolioPaperOrderBatches.map((batch) => (
                          <div className="portfolio-backtest-leg-row paper-order-batch" key={batch.batchId}>
                            <span>
                              {batch.portfolioName}
                              <em>{formatChartDate(batch.createdAt)}</em>
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.paperOrderBatch")}</small>
                              {batch.batchId}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.paperOrderCount")}</small>
                              {batch.summary.totalOrders}
                            </span>
                            <span>
                              <small>{i18n.t("portfolio.notional")}</small>
                              {formatPlainNumber(batch.summary.totalNotionalValue)}
                            </span>
                            <span>
                              <small>{i18n.t("strategy.status")}</small>
                              {portfolioPaperOrderBatchStatusLabel(i18n, batch)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="portfolio-backtest-empty">
                  {portfolioBacktestResult.error ?? i18n.t("portfolio.backtestNoResult")}
                </p>
              )}
            </div>
          </div>
        </section>
        <div className="paper-position-ledger">
          <div className="paper-position-title">
            <span>{i18n.t("portfolio.paperPositions")}</span>
            <strong>{positionRows.length}</strong>
          </div>
          <div className="paper-position-table">
            <div className="paper-position-row paper-position-head">
              <span>{i18n.t("chart.symbol")}</span>
              <span>{i18n.t("execution.quantity")}</span>
              <span>{i18n.t("portfolio.avgCost")}</span>
              <span>{i18n.t("portfolio.markPrice")}</span>
              <span>{i18n.t("portfolio.marketValue")}</span>
              <span>{i18n.t("portfolio.unrealizedPnl")}</span>
              <span>{i18n.t("portfolio.returnPct")}</span>
              <span>{i18n.t("execution.status")}</span>
            </div>
            {positionRows.map((row) => (
              <div className={`paper-position-row ${row.tone}`} key={row.id}>
                <span>{row.symbol}</span>
                <span>{row.quantity}</span>
                <span>{row.avgCost}</span>
                <span>{row.markPrice}</span>
                <span>{row.marketValue}</span>
                <span>{row.unrealizedPnl}</span>
                <span>{row.returnPct}</span>
                <span>{paperPositionStatusLabel(i18n, row.status)}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <ExecutionPanel
        approval={riskApproval}
        approvingPortfolioOrderId={approvingPortfolioOrderId}
        className={executionClassName}
        i18n={i18n}
        isSubmitting={isSubmittingPaperExecution}
        onApprovePortfolioOrder={onApprovePortfolioOrder}
        onRejectPortfolioOrder={onRejectPortfolioOrder}
        onSimulatePortfolioOrder={onSimulatePortfolioOrder}
        onSubmit={onSubmitPaperExecution}
        portfolioOrderApprovalRows={portfolioPaperOrderApprovalRows}
        portfolioOrderLatestSimulationSummary={portfolioPaperOrderLatestSimulationSummary}
        portfolioOrderReplayPositionRows={portfolioPaperOrderReplayPositionRows}
        portfolioOrderReplaySummaryTiles={portfolioPaperOrderReplaySummaryTiles}
        portfolioOrderSimulationRouteRows={portfolioPaperOrderSimulationRouteRows}
        portfolioOrderRows={portfolioPaperOrderLifecycleRows}
        portfolioOrderSimulations={portfolioPaperOrderSimulations}
        portfolioOrderStateHistoryRows={portfolioPaperOrderStateHistoryRows}
        rows={paperRows}
        simulatingPortfolioOrderId={simulatingPortfolioOrderId}
        summaryTiles={summaryTiles}
        workspace={workspace}
      />
    </>
  );
}

function BrokerWorkspace({
  adapterRows,
  executionRows,
  i18n,
  isSubmittingPaperExecution,
  onSubmitPaperExecution,
  riskApproval,
  summaryTiles,
  workspace
}: {
  adapterRows: BrokerAdapterRow[];
  executionRows: PaperTradingRow[];
  i18n: AppI18n;
  isSubmittingPaperExecution: boolean;
  onSubmitPaperExecution: () => void;
  riskApproval: RiskApprovalSummary;
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
  return (
    <>
      <BrokerAdapterPanel adapterRows={adapterRows} className="module-workspace-panel" i18n={i18n} />
      <ExecutionPanel
        approval={riskApproval}
        i18n={i18n}
        isSubmitting={isSubmittingPaperExecution}
        onSubmit={onSubmitPaperExecution}
        rows={executionRows}
        summaryTiles={summaryTiles}
        workspace={workspace}
      />
    </>
  );
}

function PromotionQueuePanel({
  adapterCertificationApplyRows,
  adapterControlledRestartEvidenceRows,
  adapterEnvironmentBindingRows,
  adapterHumanConfirmationRows,
  adapterOrchestrationDryRunRows,
  adapterOrchestrationExecutionRows,
  adapterRestartAcceptanceRows,
  adapterRuntimeReloadAcceptanceRows,
  adapterRuntimeReloadExecutionRows,
  adapterRuntimeReloadPlanRows,
  adapterSandboxProbeExecutionRows,
  adapterSandboxProbePlanRows,
  adapterSandboxProbeReviewRows,
  adapterProductionRouteReviewRows,
  adapterSecretMaterializationRows,
  adapterSecretReferenceRows,
  adapterCertificationRows,
  className,
  i18n,
  readiness
}: {
  adapterCertificationApplyRows: ExecutionAdapterCertificationApplyRow[];
  adapterControlledRestartEvidenceRows: ExecutionAdapterControlledRestartEvidenceRow[];
  adapterEnvironmentBindingRows: ExecutionAdapterEnvironmentBindingRow[];
  adapterHumanConfirmationRows: ExecutionAdapterHumanConfirmationRow[];
  adapterOrchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[];
  adapterOrchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[];
  adapterRestartAcceptanceRows: ExecutionAdapterRestartAcceptanceRow[];
  adapterRuntimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[];
  adapterRuntimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[];
  adapterRuntimeReloadPlanRows: ExecutionAdapterRuntimeReloadPlanRow[];
  adapterSandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[];
  adapterSandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[];
  adapterSandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[];
  adapterProductionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[];
  adapterSecretMaterializationRows: ExecutionAdapterSecretMaterializationRow[];
  adapterSecretReferenceRows: ExecutionAdapterSecretReferenceRow[];
  adapterCertificationRows: ExecutionAdapterCertificationRow[];
  className?: string;
  i18n: AppI18n;
  readiness: PromotionReadiness;
}) {
  const recentCertificationRows = adapterCertificationRows.slice(0, 3);
  const recentApplyRows = adapterCertificationApplyRows.slice(0, 3);
  const recentRestartEvidenceRows = adapterControlledRestartEvidenceRows.slice(0, 3);
  const recentRestartAcceptanceRows = adapterRestartAcceptanceRows.slice(0, 3);
  const recentEnvironmentBindingRows = adapterEnvironmentBindingRows.slice(0, 3);
  const recentRuntimeReloadPlanRows = adapterRuntimeReloadPlanRows.slice(0, 3);
  const recentRuntimeReloadExecutionRows = adapterRuntimeReloadExecutionRows.slice(0, 3);
  const recentRuntimeReloadAcceptanceRows = adapterRuntimeReloadAcceptanceRows.slice(0, 3);
  const recentOrchestrationDryRunRows = adapterOrchestrationDryRunRows.slice(0, 3);
  const recentOrchestrationExecutionRows = adapterOrchestrationExecutionRows.slice(0, 3);
  const recentHumanConfirmationRows = adapterHumanConfirmationRows.slice(0, 3);
  const recentSandboxProbePlanRows = adapterSandboxProbePlanRows.slice(0, 3);
  const recentSandboxProbeExecutionRows = adapterSandboxProbeExecutionRows.slice(0, 3);
  const recentSandboxProbeReviewRows = adapterSandboxProbeReviewRows.slice(0, 3);
  const recentProductionRouteReviewRows = adapterProductionRouteReviewRows.slice(0, 3);
  const recentSecretReferenceRows = adapterSecretReferenceRows.slice(0, 3);
  const recentSecretMaterializationRows = adapterSecretMaterializationRows.slice(0, 3);
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "晋级队列" : "Promotion Queue"}
      subtitle={i18n.locale === "zh-CN" ? "模拟盘到实盘准备" : "Paper to live readiness"}
      className={className}
    >
      <div className={`promotion-queue ${readiness.status}`}>
        <div className="promotion-summary">
          <span>{promotionStatusLabel(i18n, readiness.status)}</span>
          <strong>{promotionHeadline(i18n, readiness.headline)}</strong>
          <p>{promotionSummaryText(i18n, readiness.summary)}</p>
        </div>
        <div className="promotion-stage-list">
          {readiness.stages.map((stage) => (
            <article className={`promotion-stage ${stage.tone}`} key={stage.id}>
              <span>{promotionStageLabel(i18n, stage)}</span>
              <strong>{promotionStageValue(i18n, stage.value)}</strong>
              <em>{promotionStageStatusLabel(i18n, stage.status)}</em>
              <p>{promotionStageDetail(i18n, stage.detail)}</p>
            </article>
          ))}
        </div>
        {recentCertificationRows.length ? (
          <div className="promotion-certification-evidence">
            <span>
              {i18n.locale === "zh-CN" ? "最近适配器认证证据" : "Recent adapter certification evidence"}
            </span>
            {recentCertificationRows.map((row) => (
              <article className={`promotion-certification-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{promotionCertificationBoundaryLabel(i18n, row.boundary)}</p>
                <em>
                  {adapterCertificationCheckSummary(i18n, row.checkSummary)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentSecretReferenceRows.length ? (
          <div className="promotion-secret-reference-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近密钥引用证据" : "Recent secret reference evidence"}</span>
            {recentSecretReferenceRows.map((row) => (
              <article className={`promotion-secret-reference-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSecretReferenceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSecretReferenceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.backend} ·{" "}
                  {row.envVarSummary} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentSecretMaterializationRows.length ? (
          <div className="promotion-secret-materialization-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近密钥物化证据" : "Recent secret materialization evidence"}</span>
            {recentSecretMaterializationRows.map((row) => (
              <article className={`promotion-secret-materialization-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSecretMaterializationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSecretMaterializationConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.backend} ·{" "}
                  {row.envVarSummary} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentEnvironmentBindingRows.length ? (
          <div className="promotion-environment-binding-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近环境绑定证据" : "Recent environment binding evidence"}</span>
            {recentEnvironmentBindingRows.map((row) => (
              <article className={`promotion-environment-binding-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterEnvironmentBindingStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterEnvironmentBindingConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.bindingMode)} · {row.envVarSummary} ·{" "}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRuntimeReloadPlanRows.length ? (
          <div className="promotion-runtime-reload-plan-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近运行时重载计划" : "Recent runtime reload plan evidence"}</span>
            {recentRuntimeReloadPlanRows.map((row) => (
              <article className={`promotion-runtime-reload-plan-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRuntimeReloadPlanStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRuntimeReloadPlanConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reloadMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRuntimeReloadExecutionRows.length ? (
          <div className="promotion-runtime-reload-execution-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近运行时重载执行证据" : "Recent runtime reload execution evidence"}</span>
            {recentRuntimeReloadExecutionRows.map((row) => (
              <article className={`promotion-runtime-reload-execution-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRuntimeReloadExecutionStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRuntimeReloadExecutionConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.executionMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reloadMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRuntimeReloadAcceptanceRows.length ? (
          <div className="promotion-runtime-reload-acceptance-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近运行时重载最终验收" : "Recent runtime reload acceptance evidence"}</span>
            {recentRuntimeReloadAcceptanceRows.map((row) => (
              <article className={`promotion-runtime-reload-acceptance-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRuntimeReloadAcceptanceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.acceptanceMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.executionMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reloadMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentOrchestrationDryRunRows.length ? (
          <div className="promotion-orchestration-dry-run-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近适配器编排 dry-run" : "Recent adapter orchestration dry run"}</span>
            {recentOrchestrationDryRunRows.map((row) => (
              <article className={`promotion-orchestration-dry-run-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterOrchestrationDryRunStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterOrchestrationDryRunConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.orchestrationMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.acceptanceMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        <div className="promotion-orchestration-execution-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近受控编排执行证据" : "Recent controlled orchestration execution"}</span>
          {recentOrchestrationExecutionRows.length ? (
            recentOrchestrationExecutionRows.map((row) => (
              <article className={`promotion-orchestration-execution-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterOrchestrationExecutionStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterOrchestrationExecutionConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.orchestrationExecutionMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.orchestrationMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-orchestration-execution-empty">
              {i18n.locale === "zh-CN"
                ? "等待受控编排执行证据。先在设置中完成适配器编排 dry-run，再记录不会连接券商或下单的受控执行证据。"
                : "Waiting for controlled orchestration execution evidence. Complete an adapter orchestration dry run in Settings, then record controlled evidence that does not connect to brokers or place orders."}
            </p>
          )}
        </div>
        <div className="promotion-human-confirmation-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近最终人工确认" : "Recent final human confirmation"}</span>
          {recentHumanConfirmationRows.length ? (
            recentHumanConfirmationRows.map((row) => (
              <article className={`promotion-human-confirmation-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterHumanConfirmationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterHumanConfirmationConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.confirmationMode)} · {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-human-confirmation-empty">
              {i18n.locale === "zh-CN"
                ? "等待最终人工确认。受控编排执行证据记录后，需要在设置中完成五项人工确认。"
                : "Waiting for final human confirmation. After controlled execution evidence is recorded, complete the five manual checks in Settings."}
            </p>
          )}
        </div>
        <div className="promotion-sandbox-probe-plan-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近 sandbox 探针计划" : "Recent sandbox probe plan"}</span>
          {recentSandboxProbePlanRows.length ? (
            recentSandboxProbePlanRows.map((row) => (
              <article className={`promotion-sandbox-probe-plan-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSandboxProbePlanStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSandboxProbePlanConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.probeMode)} · {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-sandbox-probe-plan-empty">
              {i18n.locale === "zh-CN"
                ? "等待 sandbox/testnet 探针计划。最终人工确认后，先记录受控测试计划，仍不连接券商或提交订单。"
                : "Waiting for a sandbox/testnet probe plan. After final human confirmation, record the controlled test plan before any broker connection or order submission."}
            </p>
          )}
        </div>
        <div className="promotion-sandbox-probe-execution-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近 sandbox 探针执行" : "Recent sandbox probe execution"}</span>
          {recentSandboxProbeExecutionRows.length ? (
            recentSandboxProbeExecutionRows.map((row) => (
              <article className={`promotion-sandbox-probe-execution-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSandboxProbeExecutionStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSandboxProbeExecutionConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.probeExecutionMode)} · {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-sandbox-probe-execution-empty">
              {i18n.locale === "zh-CN"
                ? "等待只读 sandbox/testnet 探针执行。计划记录后，只能记录握手和订单 schema 证据，不提交任何订单。"
                : "Waiting for read-only sandbox/testnet probe execution. After planning, record handshake and order-schema evidence only, with no order submission."}
            </p>
          )}
        </div>
        <div className="promotion-sandbox-probe-review-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近 sandbox 探针复核" : "Recent sandbox probe review"}</span>
          {recentSandboxProbeReviewRows.length ? (
            recentSandboxProbeReviewRows.map((row) => (
              <article className={`promotion-sandbox-probe-review-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSandboxProbeReviewStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSandboxProbeReviewConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reviewMode)} · {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-sandbox-probe-review-empty">
              {i18n.locale === "zh-CN"
                ? "等待 sandbox/testnet 探针复核。只读执行证据记录后，需要复核证据归档、schema 风险和生产路由阻断状态。"
              : "Waiting for sandbox/testnet probe review. After read-only execution evidence is recorded, review archived evidence, schema risk, and production-route blocking."}
            </p>
          )}
        </div>
        <div className="promotion-production-route-review-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近生产路由策略复核" : "Recent production route review"}</span>
          {recentProductionRouteReviewRows.length ? (
            recentProductionRouteReviewRows.map((row) => (
              <article className={`promotion-production-route-review-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterProductionRouteReviewStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterProductionRouteReviewConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reviewMode)} · {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-production-route-review-empty">
              {i18n.locale === "zh-CN"
                ? "等待生产路由策略复核。sandbox 探针复核后，需要复核急停、限额、路由禁用和回滚责任。"
                : "Waiting for production route policy review. After sandbox probe review, verify kill switch, limits, disabled routing, and rollback ownership."}
            </p>
          )}
        </div>
        {recentApplyRows.length ? (
          <div className="promotion-certification-apply-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近应用预检证据" : "Recent apply preflight evidence"}</span>
            {recentApplyRows.map((row) => (
              <article className={`promotion-certification-apply-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationApplyStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterCertificationApplyConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.applyMode)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRestartEvidenceRows.length ? (
          <div className="promotion-controlled-restart-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近受控重启证据" : "Recent controlled restart evidence"}</span>
            {recentRestartEvidenceRows.map((row) => (
              <article className={`promotion-controlled-restart-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterControlledRestartEvidenceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterControlledRestartEvidenceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.evidenceMode)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRestartAcceptanceRows.length ? (
          <div className="promotion-restart-acceptance">
            <span>{i18n.locale === "zh-CN" ? "最近重启后验收证据" : "Recent restart acceptance evidence"}</span>
            {recentRestartAcceptanceRows.map((row) => (
              <article className={`promotion-restart-acceptance-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRestartAcceptanceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRestartAcceptanceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.acceptanceMode)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function BrokerAdapterPanel({
  adapterRows,
  className,
  i18n
}: {
  adapterRows: BrokerAdapterRow[];
  className?: string;
  i18n: AppI18n;
}) {
  return (
    <Panel title={i18n.t("module.broker.title")} subtitle={i18n.t("module.broker.subtitle")} className={className}>
      <div className="broker-adapter-table">
        <div className="broker-adapter-row broker-adapter-head">
          <span>{i18n.t("broker.adapter")}</span>
          <span>{i18n.t("broker.market")}</span>
          <span>{i18n.t("broker.route")}</span>
          <span>{i18n.t("broker.status")}</span>
          <span>{i18n.t("broker.certification")}</span>
          <span>{i18n.t("broker.nextStep")}</span>
        </div>
        {adapterRows.map((row) => (
          <article className={`broker-adapter-row ${row.tone}`} key={row.id}>
            <span>{brokerAdapterName(i18n, row)}</span>
            <span>{i18n.marketLabel(row.market)}</span>
            <span>{brokerRouteLabel(i18n, row.route)}</span>
            <span>{brokerStatusLabel(i18n, row.status)}</span>
            <span>{brokerCertificationLabel(i18n, row.certification)}</span>
            <span>{brokerNextStepLabel(i18n, row.nextStep)}</span>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function MarketDataProviderHealthTrendStrip({
  health,
  i18n
}: {
  health: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"];
  i18n: AppI18n;
}) {
  const rows = buildMarketDataProviderHealthTrendRows(health);
  const summary = buildMarketDataProviderHealthTrendSummary(health);
  return (
    <div className={`provider-health-trend ${summary.tone}`} title={summary.detail}>
      <div className="provider-health-trend-summary">
        <span>{i18n.locale === "zh-CN" ? "Provider 趋势" : "Provider trend"}</span>
        <strong>{providerHealthTrendMomentumLabel(i18n, summary.momentum)}</strong>
        <em>
          {summary.totalErrors.toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")}{" "}
          {i18n.locale === "zh-CN" ? "次错误" : "errors"} ·{" "}
          {providerHealthTrendLatestLabel(i18n, summary.latestErrorAt)}
        </em>
      </div>
      <div className="provider-health-trend-bars">
        {rows.map((row) => (
          <div
            className={`provider-health-trend-window level-${row.intensityLevel} ${row.tone}`}
            key={`provider-health-trend-${row.id}`}
            title={`${providerHealthTrendWindowLabel(i18n, row.id)} · ${row.errorCount} · ${providerHealthTrendCategoryLabel(i18n, row.dominantCategory)}`}
          >
            <span>{providerHealthTrendWindowLabel(i18n, row.id)}</span>
            <strong>{row.errorCount.toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")}</strong>
            <i className="provider-health-trend-track">
              <b className="provider-health-trend-fill" />
            </i>
            <em>{providerHealthTrendCategoryLabel(i18n, row.dominantCategory)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function promotionStatusLabel(i18n: AppI18n, status: PromotionReadiness["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    blocked: "晋级阻断",
    paper_pending: "等待模拟成交",
    certification_pending: "等待认证",
    live_ready: "实盘准备就绪"
  }[status];
}

function promotionHeadline(i18n: AppI18n, headline: string): string {
  if (i18n.locale === "en-US") {
    return headline;
  }
  return {
    "Promotion queue blocked": "晋级队列阻断",
    "Paper execution required": "需要模拟执行",
    "Live promotion pending certification": "等待实盘认证",
    "Live promotion ready": "实盘晋级就绪"
  }[headline] ?? headline;
}

function promotionSummaryText(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace(
      "A strategy needs audited evidence and risk approval before it can enter execution promotion.",
      "策略需要先绑定审计证据并通过风控审批，才能进入执行晋级。"
    )
    .replace(
      "The audited run is risk-approved for paper trading, but no filled paper execution is bound yet.",
      "审计运行已通过模拟盘风控审批，但尚未绑定已成交模拟执行。"
    )
    .replace(
      "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
      "模拟执行已经通过；实盘通道仍需适配器认证和人工确认。"
    )
    .replace(
      "Audited evidence, paper execution, certified adapter, and human confirmation are all bound.",
      "审计证据、模拟执行、认证适配器和人工确认均已绑定。"
    );
}

function promotionStageLabel(i18n: AppI18n, stage: PromotionQueueStage): string {
  if (i18n.locale === "en-US") {
    return stage.label;
  }
  return {
    "audited-run": "审计运行",
    "risk-approval": "风控审批",
    "paper-execution": "模拟执行",
    "adapter-certification": "适配器认证",
    "human-confirmation": "人工确认"
  }[stage.id];
}

function promotionStageValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  const filledOrders = value.match(/^(\d+) filled orders?$/);
  if (filledOrders) {
    return `${filledOrders[1]} 笔已成交`;
  }
  const certifiedAdapters = value.match(/^(\d+) certified live adapters?$/);
  if (certifiedAdapters) {
    return `${certifiedAdapters[1]} 个认证实盘适配器`;
  }
  return value
    .replace("No audited run", "缺少审计运行")
    .replace("paper approved", "模拟已批准")
    .replace("live approved", "实盘已批准")
    .replace("risk blocked", "风控阻断")
    .replace("No paper fill", "缺少模拟成交")
    .replace("manual approval recorded", "人工确认已记录")
    .replace("manual approval required", "需要人工确认");
}

function promotionStageStatusLabel(i18n: AppI18n, status: PromotionQueueStage["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", blocked: "阻断", review: "复核" }[status];
}

function promotionStageDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const boundRun = detail.match(/^(\d+) (.+) bars are bound to the promotion queue\.$/);
  if (boundRun) {
    return `${boundRun[1]} 根 ${boundRun[2]} K线已绑定到晋级队列。`;
  }
  const paperSnapshot = detail.match(/^Paper snapshot (.+) passed local risk checks before live promotion\.$/);
  if (paperSnapshot) {
    return `模拟快照 ${paperSnapshot[1]} 已在实盘晋级前通过本地风控检查。`;
  }
  return detail
    .replace("Run Pipeline before a strategy can enter the promotion queue.", "策略进入晋级队列前需要先运行流水线。")
    .replace("Audited strategy risk configuration is incomplete; paper-to-live promotion is blocked.", "审计策略风控配置不完整，模拟到实盘晋级已阻断。")
    .replace("Paper execution exists, but a filled order and passing risk check are both required.", "已有模拟执行，但仍需要已成交委托和通过的风控检查。")
    .replace("Submit a paper order from the active audited run before live promotion review.", "实盘晋级评审前，请先基于当前审计运行提交模拟委托。")
    .replace("A certified live adapter is available for the selected market.", "当前市场已有可用的认证实盘适配器。")
    .replace("Live adapters remain interface-only or configuration-required until certification passes.", "认证通过前，实盘适配器仍保持仅接口或需配置状态。")
    .replace("A human operator confirmed this promotion path.", "人工操作员已确认该晋级路径。")
    .replace("Live promotion requires explicit human confirmation after adapter certification.", "适配器认证后，实盘晋级仍需要明确人工确认。")
    .replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。");
}

function promotionCertificationBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return adapterCertificationBoundaryLabel(i18n, boundary);
}

function scannerSignalLabel(i18n: AppI18n, signal: ScannerCandidate["signal"]): string {
  if (i18n.locale === "en-US") {
    return signal;
  }
  return {
    "Momentum watch": "动量观察",
    "Baseline watch": "基准观察",
    "Risk review": "风险复核"
  }[signal];
}

function riskLabel(i18n: AppI18n, risk: ScannerCandidate["risk"]): string {
  if (i18n.locale === "en-US") {
    return risk;
  }
  return { low: "低", medium: "中", high: "高" }[risk];
}

function strategyRuleGroupLabel(i18n: AppI18n, group: StrategyRuleRow["group"]): string {
  if (i18n.locale === "en-US") {
    return group;
  }
  return { entry: "入场", exit: "出场", position: "仓位", risk: "风控" }[group];
}

function strategyRuleLabel(i18n: AppI18n, label: StrategyRuleRow["label"]): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return {
    "Entry signal": "入场信号",
    "Exit signal": "出场信号",
    "Position sizing": "仓位规则",
    "Risk guardrail": "风险闸门"
  }[label] ?? label;
}

function strategyRuleParameterLabel(i18n: AppI18n, parameter: string): string {
  if (i18n.locale === "en-US") {
    return parameter;
  }
  const exposureCap = parameter.match(/^(\d+(?:\.\d+)?)% exposure cap$/);
  if (exposureCap) {
    return `${exposureCap[1]}% 暴露上限`;
  }
  return parameter
    .replace("SMA20 / relative strength", "SMA20 / 相对强度")
    .replace("Trend support / risk downgrade", "趋势支撑 / 风险下调")
    .replace("Exposure cap / paper sizing", "暴露上限 / 模拟定仓")
    .replace("Stop / drawdown / execution mode", "止损 / 回撤 / 执行模式")
    .replace("Stop / take profit / drawdown / execution mode", "止损 / 止盈 / 回撤 / 执行模式");
}

function strategyRuleStatusLabel(i18n: AppI18n, status: StrategyRuleRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { active: "启用", pending: "待生成", guardrail: "保护" }[status];
}

function strategyConditionOptionLabel(i18n: AppI18n, kind: StrategyConditionKind): string {
  const key = {
    close_above_sma: "strategy.condition.closeAboveSma",
    close_below_sma: "strategy.condition.closeBelowSma",
    rsi_below: "strategy.condition.rsiBelow",
    rsi_above: "strategy.condition.rsiAbove"
  }[kind] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key);
}

function strategyTemplateName(i18n: AppI18n, template: StrategyTemplateOption): string {
  const key = {
    sma_trend: "strategy.template.smaTrend",
    rsi_reversal: "strategy.template.rsiReversal",
    volume_breakout: "strategy.template.volumeBreakout"
  }[template.id] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key);
}

function strategyTemplateDescription(i18n: AppI18n, template: StrategyTemplateOption): string {
  const key = {
    sma_trend: "strategy.template.smaTrend.description",
    rsi_reversal: "strategy.template.rsiReversal.description",
    volume_breakout: "strategy.template.volumeBreakout.description"
  }[template.id] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key);
}

function strategyReadinessGateLabel(i18n: AppI18n, label: StrategyReadinessGate["label"]): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return {
    "Strategy schema": "策略结构",
    "Risk controls": "风控参数",
    "Execution mode": "执行模式",
    "Audit evidence": "审计证据"
  }[label];
}

function strategyReadinessGateStatusLabel(i18n: AppI18n, status: StrategyReadinessGate["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", review: "待复核", blocked: "阻断" }[status];
}

function strategyValidationSourceLabel(i18n: AppI18n, source: WorkspaceLoadResult["source"]): string {
  if (i18n.locale === "en-US") {
    return source === "core" ? "core validation" : "local fallback";
  }
  return source === "core" ? "核心校验" : "本地兜底";
}

function strategyDiffRowLabel(i18n: AppI18n, row: StrategyVersionDiffRow): string {
  const labels: Record<StrategyVersionDiffRow["id"], string> = {
    context: i18n.t("strategy.context"),
    name: i18n.t("strategy.name"),
    entry: i18n.t("strategy.entry"),
    exit: i18n.t("strategy.exit"),
    position: i18n.t("strategy.position"),
    risk: i18n.t("strategy.risk")
  };
  if (!row.changed) {
    return i18n.locale === "zh-CN" ? `${labels[row.id]}一致` : `${labels[row.id]} same`;
  }
  return i18n.locale === "zh-CN" ? `${labels[row.id]}不同` : `${labels[row.id]} changed`;
}

function strategyLibraryStatusLabel(i18n: AppI18n, status: StrategyLibraryItem["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { draft: "草稿", audited: "已审计" }[status];
}

function strategyDraftHint(i18n: AppI18n, field: StrategyRuleDraftField): string {
  if (i18n.locale === "en-US") {
    return {
      name: "Strategy version name",
      entryKind: "Entry condition type",
      entryWindow: "Entry: close above SMA",
      entryThreshold: "RSI entry threshold",
      entryRsiConfirm: "Optional RSI momentum gate",
      entryRsiWindow: "RSI confirmation window",
      entryRsiThreshold: "RSI must be above this value",
      entryVolumeConfirm: "Optional volume gate",
      entryVolumeWindow: "Volume moving average window",
      exitKind: "Exit condition type",
      exitWindow: "Exit: close below SMA",
      exitThreshold: "RSI exit threshold",
      positionPct: "Capital cap per run",
      stopLossPct: "Trade-level stop",
      takeProfitPct: "Trade-level target",
      maxDrawdownPct: "Backtest drawdown guard"
    }[field];
  }
  return {
    name: "策略版本名称",
    entryKind: "入场条件类型",
    entryWindow: "入场：收盘价上穿 SMA",
    entryThreshold: "RSI 入场阈值",
    entryRsiConfirm: "可选 RSI 动量闸门",
    entryRsiWindow: "RSI 确认窗口",
    entryRsiThreshold: "RSI 需要高于该值",
    entryVolumeConfirm: "可选成交量闸门",
    entryVolumeWindow: "成交量均线窗口",
    exitKind: "出场条件类型",
    exitWindow: "出场：收盘价跌破 SMA",
    exitThreshold: "RSI 出场阈值",
    positionPct: "单次资金上限",
    stopLossPct: "单笔止损",
    takeProfitPct: "单笔止盈",
    maxDrawdownPct: "回测回撤保护"
  }[field];
}

function backtestSideLabel(i18n: AppI18n, side: BacktestTradeRow["side"]): string {
  if (i18n.locale === "en-US") {
    return side;
  }
  return { BUY: "买入", SELL: "卖出", RISK: "风控", HOLD: "持有" }[side];
}

function backtestStatusLabel(i18n: AppI18n, status: BacktestTradeRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { filled: "已成交", open: "观察中", review: "复核", blocked: "已阻断" }[status];
}

function parameterScanStatusLabel(i18n: AppI18n, status: BacktestParameterScanRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { current: "当前", candidate: "候选" }[status];
}

function backtestRunComparisonBadgeLabel(i18n: AppI18n, badge: BacktestRunComparisonMatrixBadge): string {
  if (i18n.locale === "en-US") {
    return badge.replace("_", " ");
  }
  return {
    best_return: "最佳收益",
    current: "当前",
    history: "历史",
    lowest_drawdown: "最低回撤",
    previous_run: "上一轮"
  }[badge];
}

function backtestRunComparisonSummaryDetail(
  i18n: AppI18n,
  summary: BacktestRunComparisonMatrixSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  return `${summary.totalRows} 个同市场、同标的、同周期的已审计运行；只做历史证据对比，不构成投资建议。`;
}

function backtestExposureLabel(i18n: AppI18n, exposure: string): string {
  if (i18n.locale === "en-US") {
    return exposure;
  }
  return exposure.replace("drawdown", "回撤").replace("paper", "模拟");
}

function backtestAssumptionLabel(i18n: AppI18n, field: BacktestAssumptionField, fallback: string): string {
  const key = {
    initialCash: "backtest.initialCash",
    feeBps: "backtest.feeBps",
    slippageBps: "backtest.slippageBps"
  }[field] as Parameters<AppI18n["t"]>[0];
  return i18n.t(key) || fallback;
}

function backtestAssumptionSuffixLabel(i18n: AppI18n, suffix: string): string {
  if (i18n.locale === "zh-CN") {
    return suffix === "CNY" ? "资金" : "基点";
  }
  return suffix;
}

function backtestBenchmarkLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return label === "Buy and hold" ? "同标的买入持有" : label;
}

function backtestBenchmarkValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US" || value !== "Pending snapshot") {
    return value;
  }
  return "等待快照";
}

function backtestBenchmarkDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const auditedBars = detail.match(/^(\d+) audited bars from (.+) · (.+) to (.+)\.$/);
  if (auditedBars) {
    return `${auditedBars[1]} 根审计K线 · 来源 ${auditedBars[2]} · ${auditedBars[3]} 至 ${auditedBars[4]}`;
  }
  if (detail === "Run Pipeline must include a data snapshot before benchmark comparison.") {
    return "先运行流水线并锁定数据快照，再计算基准对比。";
  }
  return detail;
}

function backtestReportHeadline(i18n: AppI18n, report: BacktestReport): string {
  if (i18n.locale === "en-US") {
    return report.headline;
  }
  if (report.headline === "Backtest report needs an audited run") {
    return "回测报告需要审计运行";
  }
  const bound = report.headline.match(/^Backtest report bound to (.+)$/);
  return bound ? `回测报告已绑定 ${bound[1]}` : report.headline;
}

function backtestReportSummary(i18n: AppI18n, report: BacktestReport): string {
  if (i18n.locale === "en-US") {
    return report.summary;
  }
  if (report.summary === "Run Pipeline to create a reproducible backtest before AI review or execution.") {
    return "先运行流水线生成可复现回测，再进入 AI 评审或执行。";
  }
  return report.summary
    .replace("bars", "根K线")
    .replace("trades", "笔交易")
    .replace("AI review ready", "AI 评审已就绪")
    .replace("AI review blocked", "AI 评审已阻断");
}

function backtestEvidenceLabel(i18n: AppI18n, card: BacktestEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.label;
  }
  return (
    {
      run: "运行包",
      strategy: "策略版本",
      costs: "费用模型",
      diagnostics: "诊断"
    }[card.id] ?? card.label
  );
}

function backtestEvidenceValue(i18n: AppI18n, card: BacktestEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.value;
  }
  if (card.value === "Draft workspace") {
    return "本地草稿";
  }
  if (card.value === "Local draft") {
    return "本地版本";
  }
  return card.value.replace(/checks?/u, "项检查").replaceAll("bps", "基点");
}

function backtestEvidenceDetail(i18n: AppI18n, card: BacktestEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.detail;
  }
  return card.detail
    .replace("Run Pipeline to bind a reproducible run id.", "运行流水线以绑定可复现运行编号。")
    .replace("No core diagnostics supplied yet.", "核心服务尚未返回诊断。")
    .replace("Cash", "资金")
    .replace("bars", "根K线")
    .replace("paper_only", "仅模拟盘")
    .replace("certified_live", "认证实盘")
    .replace("blocked_live", "实盘阻断");
}

function backtestGateLabel(i18n: AppI18n, gate: BacktestReadinessGate): string {
  if (i18n.locale === "en-US") {
    return gate.label;
  }
  return (
    {
      data: "数据快照",
      strategy: "策略结构",
      costs: "费用模型",
      execution: "执行晋级"
    }[gate.id] ?? gate.label
  );
}

function backtestGateStatusLabel(i18n: AppI18n, status: BacktestReadinessGate["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", blocked: "阻断", review: "复核" }[status];
}

function backtestGateDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Run Pipeline to bind a reproducible OHLCV snapshot.", "运行流水线以绑定可复现 OHLCV 快照。")
    .replace("Complete entry, exit, position, and risk rules before audit.", "审计前需要补齐入场、出场、仓位和风控规则。")
    .replace("Paper execution waits for an audited run id.", "模拟执行等待可审计运行编号。")
    .replace("Paper execution can be staged; live adapters remain gated.", "可以创建模拟执行；实盘适配器仍受闸门限制。")
    .replace("is parseable.", "已可解析。")
    .replace("Audited", "已审计")
    .replace("bars are bound.", "根K线已绑定。")
    .replace("Cash", "资金")
    .replace("fee", "手续费")
    .replace("slippage", "滑点")
    .replaceAll("bps", "基点");
}

function portfolioRiskLabel(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return {
    "paper-exposure": "模拟盘暴露",
    "selected-risk": "当前标的",
    "live-gates": "实盘闸门"
  }[row.id] ?? row.label;
}

function portfolioRiskValue(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.value;
  }
  return row.value.replace("watched", "个观察").replace("blocked", "个阻断").replace("open", "已开启");
}

function portfolioRiskDetail(i18n: AppI18n, row: PortfolioRiskRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  if (row.id === "paper-exposure") {
    return "当前工作台没有连接已认证实盘持仓。";
  }
  if (row.id === "selected-risk") {
    return `${row.value} 在新的审计运行通过闸门前保持模拟盘。`;
  }
  if (row.id === "live-gates") {
    return "需要完成适配器认证、风控审批和人工确认。";
  }
  return row.detail;
}

function portfolioDiagnosticLabel(i18n: AppI18n, row: PortfolioBacktestDiagnosticRow): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return (
    {
      concentration: "集中度",
      "cash-buffer": "现金缓冲",
      "exposure-utilization": "总暴露",
      "rebalance-drift": "再平衡漂移",
      "risk-contribution": "风险贡献",
      "covariance-risk": "协方差风险",
      "correlation-risk": "相关性风险",
      "negative-contribution": "负贡献",
      "data-quality": "数据质量"
    }[row.id] ?? row.label
  );
}

function portfolioDiagnosticDetail(i18n: AppI18n, row: PortfolioBacktestDiagnosticRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  if (row.id === "concentration") {
    if (row.status === "passed") {
      return "最大组合腿未超过 50% 集中度复核阈值。";
    }
    if (row.status === "blocked") {
      return "最大组合腿超过 75% 硬性集中度阈值。";
    }
    return "最大组合腿超过 50% 集中度复核阈值。";
  }
  if (row.id === "cash-buffer") {
    if (row.detail.includes("under-invested")) {
      return "现金缓冲偏高，组合可能没有充分配置。";
    }
    if (row.detail.includes("thin")) {
      return "现金缓冲偏薄，执行滑点或整手约束需要复核。";
    }
    return "现金缓冲处于静态权重复核区间内。";
  }
  if (row.id === "exposure-utilization") {
    if (row.status === "blocked") {
      return "总目标暴露超过 100%，晋级前必须重新调整权重。";
    }
    if (row.detail.includes("fully invested")) {
      return "总目标暴露接近满仓，现金和滑点缓冲需要复核。";
    }
    if (row.detail.includes("under-invested")) {
      return "总目标暴露偏低，组合可能没有充分配置。";
    }
    return "总目标暴露保留了现金和滑点缓冲。";
  }
  if (row.id === "rebalance-drift") {
    if (row.status === "blocked") {
      return "期末权重漂移超过 10 个百分点硬性再平衡阈值。";
    }
    if (row.status === "review") {
      return "期末权重漂移超过 2 个百分点再平衡复核阈值。";
    }
    return "期末权重漂移仍在 2 个百分点再平衡复核阈值内。";
  }
  if (row.id === "risk-contribution") {
    if (row.status === "blocked") {
      return "最大风险预算贡献超过 75% 硬性集中度阈值。";
    }
    if (row.status === "review") {
      return "最大风险预算贡献超过 60% 复核阈值。";
    }
    return "最大风险预算贡献仍在 60% 复核阈值内。";
  }
  if (row.id === "covariance-risk") {
    if (row.status === "blocked") {
      return "最大协方差风险贡献超过 75% 硬性集中度阈值。";
    }
    if (row.status === "review") {
      return "最大协方差风险贡献超过 60% 复核阈值。";
    }
    return "最大协方差风险贡献仍在 60% 复核阈值内。";
  }
  if (row.id === "correlation-risk") {
    if (row.status === "blocked") {
      return "最高成对相关性超过 0.95 硬性聚集阈值。";
    }
    if (row.status === "review") {
      return "最高成对相关性超过 0.85 复核阈值。";
    }
    return "最高成对相关性仍在 0.85 复核阈值内。";
  }
  if (row.id === "negative-contribution") {
    return row.status === "passed"
      ? "本次组合聚合未发现负贡献标的。"
      : `${row.value} 对组合产生负贡献，需要复核权重或策略证据。`;
  }
  if (row.id === "data-quality") {
    if (row.status === "passed") {
      return "组合聚合数据质量完整。";
    }
    return `组合数据质量需要复核：${row.detail
      .replace("Portfolio data quality is incomplete", "不完整")
      .replace("Portfolio data quality has warnings", "存在告警")
      .replace("review source completeness before promotion", "晋级前复核来源完整性")}`;
  }
  return row.detail;
}

function formatSignedPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatPlainPercent(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "N/A";
}

function formatPlainNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

function formatSignedNumber(value: number): string {
  return Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}` : "N/A";
}

function portfolioBacktestHeadline(i18n: AppI18n, headline: string): string {
  if (i18n.locale === "en-US") {
    return headline;
  }
  return (
    {
      "Portfolio backtest ready": "组合回测就绪",
      "Portfolio backtest blocked": "组合回测阻断",
      "Portfolio backtest needs peers": "组合回测需要对照标的"
    }[headline] ?? headline
  );
}

function portfolioBacktestSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  if (summary === "Run at least one audited research pipeline first.") {
    return "先至少运行一次审计研究流水线。";
  }
  if (summary === "Need at least two audited runs from the same market and timeframe with equity curves.") {
    return "需要至少两个同市场、同周期且带权益曲线的审计运行。";
  }
  const ready = summary.match(/^(\d+) audited runs from (ashare|us|crypto) (1d|1m|5m|15m|30m|60m); cash buffer (.+)\.$/u);
  if (ready) {
    return `${ready[1]} 个同市场同周期审计运行 · ${i18n.marketLabel(ready[2] as Market)} ${ready[3]} · 现金缓冲 ${ready[4]}。`;
  }
  return summary;
}

function portfolioPeerAuditSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  if (summary === "Run the selected instrument pipeline before preparing portfolio peers.") {
    return "先运行当前标的流水线，再生成组合对照审计。";
  }
  if (summary === "Add another same-market watchlist instrument before preparing a portfolio backtest.") {
    return "先添加另一个同市场自选标的，再准备组合回测。";
  }
  const complete = summary.match(/^(\d+) audited portfolio legs are ready for a static-weight portfolio backtest\.$/u);
  if (complete) {
    return `${complete[1]} 个组合腿已完成审计，可以运行静态权重组合回测。`;
  }
  const ready = summary.match(/^(\d+) peer audits? can be generated from the current watchlist\.$/u);
  if (ready) {
    return `可从当前自选列表生成 ${ready[1]} 个对照审计。`;
  }
  return summary;
}

function portfolioPeerAuditStatusLabel(
  i18n: AppI18n,
  status: "audited" | "missing"
): string {
  return status === "audited" ? i18n.t("portfolio.peerAudited") : i18n.t("portfolio.peerMissing");
}

function portfolioAllocationEventTypeLabel(i18n: AppI18n, eventType: "allocate" | "cash_buffer"): string {
  return eventType === "allocate" ? i18n.t("portfolio.allocationAllocate") : i18n.t("portfolio.allocationCashBuffer");
}

function portfolioRebalanceStatusLabel(i18n: AppI18n, status: "within_band" | "review" | "blocked"): string {
  if (status === "blocked") {
    return i18n.t("portfolio.rebalanceBlocked");
  }
  if (status === "review") {
    return i18n.t("portfolio.rebalanceReview");
  }
  return i18n.t("portfolio.rebalanceWithinBand");
}

function portfolioTradeReviewStatusLabel(i18n: AppI18n, status: "paper_review" | "blocked" | "no_action"): string {
  if (status === "blocked") {
    return i18n.t("portfolio.tradeReviewBlocked");
  }
  if (status === "paper_review") {
    return i18n.t("portfolio.tradeReviewPaperReview");
  }
  return i18n.t("portfolio.tradeReviewNoAction");
}

function portfolioTradeReviewSideLabel(i18n: AppI18n, side: "buy" | "sell" | "hold"): string {
  if (side === "buy") {
    return i18n.t("portfolio.tradeSideBuy");
  }
  if (side === "sell") {
    return i18n.t("portfolio.tradeSideSell");
  }
  return i18n.t("portfolio.tradeSideHold");
}

function portfolioPreTradeRiskStatusLabel(i18n: AppI18n, status: "passed" | "review" | "blocked"): string {
  if (status === "passed") {
    return i18n.t("portfolio.preTradeRiskPassed");
  }
  if (status === "review") {
    return i18n.t("portfolio.preTradeRiskReview");
  }
  return i18n.t("portfolio.preTradeRiskBlocked");
}

function portfolioPreTradeRiskCheckLabel(
  i18n: AppI18n,
  checkId: "portfolio_data_quality" | "trade_review_status" | "trade_notional_limit"
): string {
  if (checkId === "portfolio_data_quality") {
    return i18n.t("portfolio.preTradeRiskDataQuality");
  }
  if (checkId === "trade_review_status") {
    return i18n.t("portfolio.preTradeRiskTradeStatus");
  }
  return i18n.t("portfolio.preTradeRiskNotional");
}

function portfolioPaperOrderStatusLabel(
  i18n: AppI18n,
  status: "pending_review" | "rejected" | "skipped"
): string {
  if (status === "pending_review") {
    return i18n.t("portfolio.paperOrderPendingReview");
  }
  if (status === "rejected") {
    return i18n.t("portfolio.paperOrderRejected");
  }
  return i18n.t("portfolio.paperOrderSkipped");
}

function portfolioPaperOrderBatchStatusLabel(i18n: AppI18n, batch: PortfolioPaperOrderBatch): string {
  const statusEntries = Object.entries(batch.summary.statusCounts).filter(([, count]) => count > 0);
  if (!statusEntries.length) {
    return i18n.t("portfolio.paperOrderRecorded");
  }
  return statusEntries
    .map(([status, count]) => {
      const label =
        status === "pending_review" || status === "rejected" || status === "skipped"
          ? portfolioPaperOrderStatusLabel(i18n, status)
          : status;
      return `${label} ${count}`;
    })
    .join(" · ");
}

function portfolioOrderLifecycleStatusLabel(i18n: AppI18n, row: PortfolioPaperOrderLifecycleRow): string {
  if (!row.statusLabel) {
    return row.status === "ready"
      ? i18n.t("portfolio.paperOrderRecorded")
      : row.status === "blocked"
        ? i18n.t("portfolio.paperOrderRejected")
        : i18n.t("portfolio.paperOrderPendingReview");
  }
  return row.statusLabel
    .replace("review", i18n.t("portfolio.paperOrderPendingReview"))
    .replace("rejected", i18n.t("portfolio.paperOrderRejected"))
    .replace("skipped", i18n.t("portfolio.paperOrderSkipped"));
}

function portfolioOrderExecutionStateLabel(i18n: AppI18n, row: PortfolioPaperOrderLifecycleRow): string {
  const label = row.executionStateLabel || (row.routableOrders > 0 ? `${row.routableOrders} ready for simulation` : "");
  if (!label) {
    return i18n.locale === "zh-CN" ? "无可路由委托" : "No routable orders";
  }
  if (i18n.locale !== "zh-CN") {
    return label;
  }
  return label
    .replace("ready for simulation", "可模拟路由")
    .replace("awaiting review", "待人工复核")
    .replace("risk review", "待风控复核")
    .replace("risk rejected", "风控拒绝")
    .replace("operator rejected", "人工拒绝")
    .replace("invalid", "无效委托")
    .replace("skipped", "已跳过");
}

function portfolioOrderApprovalStateLabel(i18n: AppI18n, row: PortfolioPaperOrderApprovalRow): string {
  const labels: Record<PortfolioPaperOrderApprovalRow["state"], string> =
    i18n.locale === "zh-CN"
      ? {
          awaiting_operator_review: "待人工复核",
          ready_for_simulation: "可模拟路由",
          risk_rejected: "风控拒绝",
          operator_rejected: "人工拒绝",
          risk_review: "待风控复核",
          invalid_order: "无效委托",
          skipped: "已跳过"
        }
      : {
          awaiting_operator_review: "Awaiting review",
          ready_for_simulation: "Ready for simulation",
          risk_rejected: "Risk rejected",
          operator_rejected: "Operator rejected",
          risk_review: "Risk review",
          invalid_order: "Invalid order",
          skipped: "Skipped"
        };
  return labels[row.state];
}

function portfolioOrderStateLabel(i18n: AppI18n, row: PortfolioPaperOrderStateHistoryRow): string {
  const labels: Record<string, string> =
    i18n.locale === "zh-CN"
      ? {
          created: "已创建",
          awaiting_operator_review: "待人工复核",
          operator_approved: "人工批准",
          operator_rejected: "人工拒绝",
          ready_for_simulation: "可模拟路由",
          simulation_filled: "模拟成交",
          simulation_recorded: "模拟记录",
          live_blocked: "实盘阻断",
          risk_rejected: "风控拒绝",
          risk_review: "待风控复核",
          invalid_order: "无效委托",
          skipped: "已跳过"
        }
      : {};
  return labels[row.state] ?? row.label;
}

function portfolioOrderStateReason(i18n: AppI18n, row: PortfolioPaperOrderStateHistoryRow): string {
  if (i18n.locale === "en-US") {
    return row.reason;
  }
  return row.reason
    .replace("Live execution remains blocked; this timeline records paper-only simulation evidence.", "实盘仍被阻断；此时间线只记录 paper-only 模拟证据。")
    .replace("Paper-only simulation filled the approved portfolio order; live execution remains blocked.", "已对批准的组合委托完成 paper-only 模拟成交；实盘仍阻断。")
    .replace("Operator approved this paper-only portfolio order for simulation.", "人工批准该 paper-only 组合委托进入模拟成交。")
    .replace("Operator rejected this paper-only portfolio order before simulation.", "人工在模拟成交前拒绝该 paper-only 组合委托。");
}

function portfolioSimulationRouteStatusLabel(i18n: AppI18n, row: PortfolioPaperOrderSimulationRouteRow): string {
  if (i18n.locale === "en-US") {
    return row.statusLabel;
  }
  return (
    {
      "Ready for simulator": "可进入模拟器",
      "Waiting for operator review": "等待人工复核",
      "Waiting for risk review": "等待风控复核",
      "Already simulated": "已模拟成交",
      "Risk blocked": "风控阻断",
      "Operator rejected": "人工拒绝",
      "Invalid order": "无效委托",
      Skipped: "已跳过"
    }[row.statusLabel] ?? row.statusLabel
  );
}

function portfolioSimulationRouteDetail(i18n: AppI18n, row: PortfolioPaperOrderSimulationRouteRow): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  return row.detail
    .replace(
      "Approved paper-only order can use the local simulator; live broker route remains blocked.",
      "已批准的 paper-only 委托可进入本地模拟器；真实券商通道仍保持阻断。"
    )
    .replace(/^Filled by (.+); duplicate simulator route is blocked\.$/u, "已由 $1 成交；重复模拟路由已阻断。")
    .replace("Approval evidence is required before the local simulator can be used.", "需要审批证据后才能使用本地模拟器。")
    .replace("Hold or skipped orders are not routed to the simulator.", "持有或跳过委托不会进入模拟器。")
    .replace("Risk or operator state blocks the local simulator route.", "风控或人工状态阻断本地模拟器路由。")
    .replace(/^Risk blocked\.$/u, "风控阻断。")
    .replace(/^Awaiting operator\.$/u, "等待人工复核。")
    .replace(/^Ready\.$/u, "可进入模拟器。");
}

function portfolioSimulationRouteStateLabel(i18n: AppI18n, row: PortfolioPaperOrderSimulationRouteRow): string {
  if (i18n.locale === "en-US") {
    return row.latestStateLabel;
  }
  return row.latestStateLabel
    .replace("Ready for simulation", "可模拟路由")
    .replace("Paper simulation filled", "模拟成交")
    .replace("No timeline event yet", "暂无状态流水")
    .replace("operator-a", "operator-a")
    .replace("operator-b", "operator-b");
}

function portfolioPaperOrderApprovalHint(i18n: AppI18n, row: PortfolioPaperOrderApprovalRow): string {
  if (i18n.locale === "en-US") {
    return row.actionHint;
  }
  return row.actionHint
    .replace(/^Approved by (.+); ready for paper simulation\.$/u, "已由 $1 批准，可进入模拟撮合。")
    .replace(/^Operator rejected this paper-only order: /u, "人工拒绝该 paper-only 委托：")
    .replace(/^Risk rejected this paper-only order: /u, "风控拒绝该 paper-only 委托：")
    .replace("No paper order action is required for this row.", "该行无需生成模拟委托。")
    .replace(/^Invalid paper order: /u, "无效模拟委托：")
    .replace(
      "Risk review is still required before this approved order can be simulated.",
      "该委托仍需风控复核后才能进入模拟撮合。"
    )
    .replace(
      "Operator approval or rejection is required before this paper-only order can move on.",
      "该 paper-only 委托需要人工批准或拒绝后才能继续。"
    );
}

function riskApprovalHeadline(i18n: AppI18n, approval: RiskApprovalSummary): string {
  if (i18n.locale === "en-US") {
    return approval.headline;
  }
  return {
    "Risk approval blocked": "风控审批阻断",
    "Paper execution approved": "模拟执行已批准",
    "Certified live route ready": "认证实盘通道就绪"
  }[approval.headline] ?? approval.headline;
}

function riskApprovalSummaryText(i18n: AppI18n, approval: RiskApprovalSummary): string {
  if (i18n.locale === "en-US") {
    return approval.summary;
  }
  const paperReady = approval.summary.match(
    /^Audited run (.+) can stage paper orders; live trading remains blocked until (\d+) gates pass\.$/
  );
  if (paperReady) {
    return `审计运行 ${paperReady[1]} 可创建模拟委托；实盘仍需 ${paperReady[2]} 个闸门通过。`;
  }
  const liveReady = approval.summary.match(/^Audited run (.+) can route through certified live execution\.$/);
  if (liveReady) {
    return `审计运行 ${liveReady[1]} 可进入认证实盘通道。`;
  }
  const blockedRun = approval.summary.match(/^Audited run (.+) needs risk review before staging execution\.$/);
  if (blockedRun) {
    return `审计运行 ${blockedRun[1]} 需要风控复核后才能进入执行。`;
  }
  return approval.summary.replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。");
}

function riskApprovalGateLabel(i18n: AppI18n, gate: RiskApprovalGate): string {
  if (i18n.locale === "en-US") {
    return gate.label;
  }
  return {
    "audited-run": "审计运行",
    "ai-evidence": "AI 证据",
    "data-quality": "数据质量",
    "position-limit": "仓位上限",
    "drawdown-limit": "回撤闸门",
    "execution-route": "执行通道"
  }[gate.id];
}

function riskApprovalGateValue(i18n: AppI18n, gate: RiskApprovalGate): string {
  if (i18n.locale === "en-US") {
    return gate.value;
  }
  return gate.value
    .replace("No audited run", "缺少审计运行")
    .replace("Evidence dossier blocked", "证据包阻断")
    .replace("Evidence locked", "证据已锁定")
    .replace("Not attached", "未附加")
    .replace("complete", "完整")
    .replace("review", "复核")
    .replace("paper blocked", "模拟阻断")
    .replace("paper only", "仅模拟盘")
    .replace("data blocked", "数据阻断")
    .replace("certified live", "认证实盘")
    .replace("cap", "上限")
    .replace("guard", "闸门");
}

function riskApprovalGateStatus(i18n: AppI18n, status: RiskApprovalGate["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", blocked: "阻断", review: "复核" }[status];
}

function riskApprovalGateDetail(i18n: AppI18n, gate: RiskApprovalGate): string {
  if (i18n.locale === "en-US") {
    return gate.detail;
  }
  const liveBlocked = gate.detail.match(/^Paper route can stage; (\d+) live gates still blocked\.$/);
  if (liveBlocked) {
    return `模拟通道可创建委托；仍有 ${liveBlocked[1]} 个实盘闸门阻断。`;
  }
  return gate.detail
    .replace("Run Pipeline must produce a reproducible research run before execution.", "执行前必须先由流水线生成可复现研究运行。")
    .replace("Run Pipeline before agent debate, explanation, or strategy promotion.", "先运行流水线，再进行智能体辩论、解释或策略晋级。")
    .replace(
      "Audited run metadata did not include data quality; rerun pipeline before paper execution.",
      "审计运行缺少数据质量元数据；请重新运行流水线后再进入模拟执行。"
    )
    .replace(
      /^Paper execution requires complete audited market data; current source (.+) is review-only\.$/u,
      "模拟执行要求完整的审计行情数据；当前来源 $1 仅可复核。"
    )
    .replace(/(\d+) rows are approved for paper execution; (.+)\./u, "$1 行数据已允许进入模拟执行；$2。")
    .replace("Position cap is parsed but cannot be approved without audited evidence.", "已解析仓位上限，但缺少审计证据时不能批准。")
    .replace("Drawdown is provisional until a run snapshot is bound.", "绑定运行快照前，回撤仅作为临时参考。")
    .replace("Paper route waits for audited evidence; live route remains gated.", "模拟通道等待审计证据；实盘通道继续受闸门限制。")
    .replace("Sizing uses the current strategy position guardrail.", "下单规模使用当前策略仓位护栏。")
    .replace("Audited drawdown is inside the configured guardrail.", "审计回撤位于已配置护栏内。")
    .replace("Audited drawdown breaches the configured guardrail.", "审计回撤突破已配置护栏。")
    .replace("All execution gates passed; live route is available after human confirmation.", "全部执行闸门已通过；人工确认后可使用实盘通道。")
    .replace("bars", "根K线")
    .replace("paper_only", "仅模拟盘")
    .replace("certified_live", "认证实盘")
    .replace("blocked_live", "实盘阻断");
}

function paperExecutionTileIcon(id: PaperExecutionSummaryTile["id"]): typeof Database {
  if (id === "account-sync") {
    return Database;
  }
  if (id === "paper-positions") {
    return WalletCards;
  }
  return ShieldCheck;
}

function paperExecutionTileLabel(i18n: AppI18n, tile: PaperExecutionSummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.label;
  }
  return {
    "account-sync": "账户同步",
    "paper-positions": "模拟持仓",
    "risk-gates": "执行闸门"
  }[tile.id];
}

function paperExecutionTileValue(i18n: AppI18n, tile: PaperExecutionSummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.value;
  }
  const liveGatesBlocked = tile.value.match(/^(\d+) live gates blocked$/);
  if (liveGatesBlocked) {
    return `${liveGatesBlocked[1]} 个实盘闸门阻断`;
  }
  return tile.value
    .replace("No paper execution", "尚无模拟执行")
    .replace("Cash", "现金")
    .replace("Equity", "权益")
    .replace("paper", "模拟")
    .replace("live", "实盘")
    .replace("passed", "通过")
    .replace("blocked", "阻断")
    .replace("live route enabled", "实盘通道已开启");
}

function paperExecutionTileDetail(i18n: AppI18n, tile: PaperExecutionSummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.detail;
  }
  return tile.detail
    .replace("Run Pipeline and submit a paper order to create a local account snapshot.", "运行流水线并提交模拟委托后，会生成本地账户快照。")
    .replace("No filled paper positions are linked to the active audited run.", "当前审计运行尚未绑定已成交模拟持仓。")
    .replace("Snapshot", "快照")
    .replace("paper_only", "仅模拟盘")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过")
    .replace("Audit run bound: passed", "审计运行绑定：通过")
    .replace("Paper risk check: passed", "模拟风控检查：通过")
    .replace("Live route blocked: blocked", "实盘通道：阻断");
}

function portfolioReplayTileIcon(id: PortfolioPaperOrderReplaySummaryTile["id"]): typeof Database {
  if (id === "portfolio-account") {
    return Database;
  }
  if (id === "portfolio-positions") {
    return WalletCards;
  }
  return ShieldCheck;
}

function portfolioReplayTileLabel(i18n: AppI18n, tile: PortfolioPaperOrderReplaySummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.label;
  }
  return {
    "portfolio-account": "组合账户",
    "portfolio-positions": "回放持仓",
    "portfolio-replay-boundary": "执行边界"
  }[tile.id];
}

function portfolioReplayTileValue(i18n: AppI18n, tile: PortfolioPaperOrderReplaySummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.value;
  }
  return tile.value
    .replace("No portfolio replay", "尚无组合回放")
    .replace("Cash", "现金")
    .replace("Equity", "权益")
    .replace("positions", "持仓")
    .replace("position", "持仓")
    .replace("fills", "成交")
    .replace("fill", "成交")
    .replace("Paper only", "仅模拟盘")
    .replace("Live route open", "实盘通道开启");
}

function portfolioReplayTileDetail(i18n: AppI18n, tile: PortfolioPaperOrderReplaySummaryTile): string {
  if (i18n.locale === "en-US") {
    return tile.detail;
  }
  return tile.detail
    .replace("Simulate approved portfolio orders to rebuild paper cash and positions.", "模拟已批准的组合委托后，会重建本地现金与持仓。")
    .replace("No applied paper fills are linked to this portfolio run yet.", "当前组合运行尚未绑定已应用的模拟成交。")
    .replace("Live execution remains blocked until adapter certification and human confirmation pass.", "实盘执行仍需适配器认证与人工确认通过。")
    .replace("Replay", "回放")
    .replace("portfolio_paper_order_replay", "组合模拟委托回放")
    .replace("Buy", "买入")
    .replace("Sell", "卖出")
    .replace("Net", "净额")
    .replace("Replay is derived from approved local paper fills; no broker route is used.", "回放仅来自本地已批准模拟成交，不使用券商通道。")
    .replace("replay warning", "条回放警告")
    .replace("replay warnings", "条回放警告");
}

function paperPositionStatusLabel(i18n: AppI18n, status: PaperPositionRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { paper: "模拟", flat: "空仓", blocked: "已阻断" }[status];
}

function agentPhaseLabel(i18n: AppI18n, phase: AgentCommitteeRound["phase"]): string {
  if (i18n.locale === "en-US") {
    return phase;
  }
  return { analysis: "分析", debate: "辩论", risk: "风控", decision: "决策" }[phase];
}

function agentVerdictLabel(i18n: AppI18n, verdict: AgentCommitteeRound["verdict"]): string {
  if (i18n.locale === "en-US") {
    return verdict;
  }
  return { support: "支持", challenge: "质疑", risk: "风险", watch: "观察" }[verdict];
}

function agentRoundThesis(i18n: AppI18n, round: AgentCommitteeRound): string {
  if (i18n.locale === "en-US") {
    return round.thesis;
  }
  const bullCase = round.thesis.match(/^Bull case requires (.+)\.$/);
  if (bullCase) {
    return `多头观点需要：${i18n.strategyText(bullCase[1])}。`;
  }
  const bearCase = round.thesis.match(/^Bear case challenges the setup if (.+)\.$/);
  if (bearCase) {
    return `空头观点在以下条件下质疑配置：${i18n.strategyText(bearCase[1])}。`;
  }
  return i18n.decisionMessage(round.thesis);
}

function agentRoundEvidence(i18n: AppI18n, evidence: string): string {
  if (i18n.locale === "en-US") {
    return evidence;
  }
  const positionRule = evidence.match(/^Position rule: (.+)\.$/);
  if (positionRule) {
    return `仓位规则：${i18n.strategyText(positionRule[1])}。`;
  }
  const riskRule = evidence.match(/^Risk rule: (.+)\.$/);
  if (riskRule) {
    return `风控规则：${i18n.strategyText(riskRule[1])}。`;
  }
  const auditedRun = evidence.match(/^Audited run (.+) · (.+) bars$/);
  if (auditedRun) {
    return `审计运行 ${auditedRun[1]} · ${auditedRun[2]} 根K线`;
  }
  return evidence
    .replace("Return", "收益率")
    .replace("Max DD", "最大回撤")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过")
    .replace("No audited run is bound to this research context yet.", "当前研究上下文尚未绑定审计运行。");
}

function aiDossierText(i18n: AppI18n, text: string): string {
  if (i18n.locale === "en-US") {
    return text;
  }
  if (text === "Audited evidence required") {
    return "需要审计证据";
  }
  if (text === "Run Pipeline before agent debate, explanation, or strategy promotion.") {
    return "运行流水线后，才能进行智能体辩论、解释或策略晋级。";
  }
  const bound = text.match(/^AI review bound to (.+)$/);
  if (bound) {
    return `AI 评审已绑定 ${bound[1]}`;
  }
  const summary = text.match(/^Agents may explain evidence for (.+), but live execution remains gated\.$/);
  if (summary) {
    return `智能体可以解释 ${summary[1]} 的证据，但实盘执行仍受闸门限制。`;
  }
  return text;
}

function aiCitationLabel(i18n: AppI18n, citation: AiReviewCitation): string {
  if (i18n.locale === "en-US") {
    return citation.label;
  }
  return (
    {
      run: "运行编号",
      metrics: "回测指标",
      "benchmark": "基准 Alpha",
      "parameter-scan": "参数扫描",
      strategy: "策略版本",
      "data-quality": "数据质量",
      "research-note": "研究笔记",
      "risk-gates": "风控闸门"
    }[citation.id] ?? citation.label
  );
}

function aiCitationValue(i18n: AppI18n, citation: AiReviewCitation): string {
  if (i18n.locale === "en-US") {
    return citation.value;
  }
  if (citation.value === "Missing audited run") {
    return "缺少审计运行";
  }
  if (citation.value === "Unavailable") {
    return "不可用";
  }
  if (citation.value === "Not attached") {
    return "未附加";
  }
  if (citation.value === "Locked note snapshot") {
    return "已锁定笔记快照";
  }
  return citation.value
    .replace("candidate for re-audit", "复审候选")
    .replace("No candidate cleared for re-audit", "暂无通过复审候选")
    .replace("Live gates open", "实盘闸门已开启")
    .replace("complete", "完整")
    .replace("review", "需复核")
    .replace("trades", "笔交易")
    .replace("blocked gates", "个阻断闸门");
}

function aiCitationDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const benchmark = detail.match(/^Strategy (.+) vs buy-and-hold (.+) over (\d+) audited bars\.$/);
  if (benchmark) {
    return `策略 ${benchmark[1]} 对比买入持有 ${benchmark[2]} · ${benchmark[3]} 根审计K线`;
  }
  if (detail === "Benchmark comparison waits for an audited data snapshot.") {
    return "基准对比等待审计数据快照。";
  }
  return detail
    .replace("No reproducible backtest is bound to this context.", "当前上下文尚未绑定可复现回测。")
    .replace("Data quality is only trusted after an audited run is loaded.", "数据质量只在加载审计运行后可信。")
    .replace("Run metadata did not include data quality details.", "运行元数据未包含数据质量详情。")
    .replace("no guaranteed outcome.", "不保证结果。")
    .replace("this is not investment advice.", "这不是投资建议。")
    .replace("Current parameter row is missing from the locked scan.", "锁定扫描中缺少当前参数行。")
    .replace("is the top non-current candidate for re-audit", "是排名最高的非当前复审候选")
    .replace("No non-current candidate is available for re-audit", "暂无非当前参数可进入复审")
    .replace("on the locked snapshot.", "，基于锁定快照。")
    .replace("drawdown-risk rows", "条回撤风险行")
    .replace("positive rows", "条正向行")
    .replace("candidates", "个候选")
    .replace("Current", "当前")
    .replace("ranks", "排名")
    .replace("Win rate", "胜率")
    .replace("rows", "行")
    .replace("warnings", "条告警")
    .replace("warning", "条告警")
    .replace("bars", "根K线")
    .replace("paper_only", "仅模拟盘")
    .replace("certified_live", "认证实盘")
    .replace("blocked_live", "实盘阻断")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过");
}

function paperTradingRowsFromExecutionRecord(record: PaperExecutionRecord): PaperTradingRow[] {
  const orderRows = record.orders.map((order) => ({
    id: order.orderId,
    symbol: order.symbol,
    side: order.side === "sell" ? "SELL" : "BUY",
    quantity: String(order.quantity),
    price: order.price.toFixed(2),
    notional: (order.quantity * order.price).toFixed(2),
    status: order.status === "filled" ? "filled" : "blocked",
    reason: order.reason,
    tone: order.status === "filled" ? "positive" : "risk"
  })) satisfies PaperTradingRow[];

  const gateRows = record.gates.map((gate) => ({
    id: `gate-${gate.id}`,
    symbol: "PAPER",
    side: "RISK",
    quantity: "-",
    price: "-",
    notional: "-",
    status: gate.passed ? "paper" : "blocked",
    reason: `${gate.label}: ${gate.reason}`,
    tone: gate.passed ? "neutral" : "warning"
  })) satisfies PaperTradingRow[];

  return [...orderRows, ...gateRows];
}

function paperSideLabel(i18n: AppI18n, side: PaperTradingRow["side"]): string {
  if (i18n.locale === "en-US") {
    return side;
  }
  return { BUY: "买入", SELL: "卖出", RISK: "风控", SYNC: "同步" }[side];
}

function paperStatusLabel(i18n: AppI18n, status: PaperTradingRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { queued: "待处理", filled: "已成交", blocked: "已阻断", paper: "模拟" }[status];
}

function paperNotionalLabel(i18n: AppI18n, notional: string): string {
  if (i18n.locale === "en-US" || notional === "-") {
    return notional;
  }
  return `${notional} 模拟资金`;
}

function paperReasonLabel(i18n: AppI18n, reason: string): string {
  if (i18n.locale === "en-US") {
    return reason;
  }
  if (reason === "Run Pipeline before staging a paper order.") {
    return "请先运行流水线生成审计结果，再创建模拟委托。";
  }
  if (reason === "No audited research run is bound; paper route remains blocked.") {
    return "当前没有绑定审计研究运行；模拟通道保持阻断。";
  }
  if (reason === "Risk approval blocked before staging paper execution.") {
    return "风控审批阻断，不能创建模拟委托。";
  }
  if (reason === "Audited drawdown breaches the configured guardrail.") {
    return "审计回撤突破已配置护栏。";
  }
  const stagedAuditedOrder = reason.match(/^Paper order staged from (.+) using audited run (.+); no live route is used\.$/);
  if (stagedAuditedOrder) {
    return `已从 ${i18n.strategyText(stagedAuditedOrder[1])} 基于审计运行 ${stagedAuditedOrder[2]} 生成模拟委托；不使用实盘通道。`;
  }
  const stagedOrder = reason.match(/^Paper order staged from (.+); no live route is used\.$/);
  if (stagedOrder) {
    return `已从 ${i18n.strategyText(stagedOrder[1])} 生成模拟委托；不使用实盘通道。`;
  }
  const blockedGate = reason.match(/^(\d+) live gates blocked; paper route remains available\.$/);
  if (blockedGate) {
    return `${blockedGate[1]} 个实盘闸门阻断；模拟盘通道可用。`;
  }
  return reason
    .replace("filled_immediately", "已模拟成交")
    .replace("max_position_value_exceeded", "超过单标的模拟仓位上限")
    .replace("insufficient_cash", "模拟现金不足")
    .replace("Audit run bound: ", "审计运行绑定：")
    .replace("Paper risk check: ", "模拟风控检查：")
    .replace("Live route blocked: ", "实盘通道阻断：")
    .replace(/^Paper execution is linked to audited run (.+)\.$/, "模拟执行已绑定审计运行 $1。")
    .replace("Live execution is blocked; this record is paper-only.", "实盘执行已阻断；该记录仅用于模拟盘。")
    .replace("Certified live route is available but this run stays paper-first.", "认证实盘通道可用，但本次仍优先模拟盘。")
    .replace("Local paper account only; broker account synchronization is not connected.", "仅本地模拟账户；尚未连接券商账户同步。");
}

function brokerAdapterName(i18n: AppI18n, row: BrokerAdapterRow): string {
  if (i18n.locale === "en-US") {
    return row.adapter;
  }
  return (
    {
      "paper-local": "本地模拟交易",
      "ashare-live": "A 股券商接口",
      "us-live": "IBKR / Alpaca 适配器形态",
      "crypto-live": "ccxt 交易所适配器形态"
    }[row.id] ?? row.adapter
  );
}

function brokerRouteLabel(i18n: AppI18n, route: BrokerAdapterRow["route"]): string {
  if (i18n.locale === "en-US") {
    return route;
  }
  return { paper: "模拟", live: "实盘" }[route];
}

function brokerStatusLabel(i18n: AppI18n, status: BrokerAdapterRow["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    paper_ready: "模拟可用",
    interface_only: "仅接口",
    config_required: "需配置",
    blocked: "已阻断"
  }[status];
}

function brokerCertificationLabel(i18n: AppI18n, certification: string): string {
  if (i18n.locale === "en-US") {
    return certification;
  }
  return certification
    .replace("Simulated fills, order log, and risk checks are available locally.", "本地已具备模拟成交、委托日志和风控检查。")
    .replace("No certified A-share broker API is connected.", "尚未连接已认证 A 股券商 API。")
    .replace("Adapter shape is reserved; paper credentials are not configured.", "已预留适配器形态；尚未配置模拟账户凭据。")
    .replace("Exchange adapter shape is reserved; API keys are not configured.", "已预留交易所适配器形态；尚未配置 API Key。");
}

function brokerNextStepLabel(i18n: AppI18n, nextStep: string): string {
  if (i18n.locale === "en-US") {
    return nextStep;
  }
  return nextStep
    .replace("Use paper execution for research runs before certifying live adapters.", "实盘适配器认证前，研究运行统一走模拟执行。")
    .replace("Keep live trading blocked until a legal broker adapter passes certification.", "合法券商适配器通过认证前，继续阻断实盘交易。")
    .replace(
      "Configure a paper account and certify submit, cancel, fill, reject, and reconnect paths.",
      "先配置模拟账户，并认证下单、撤单、成交、拒单和重连路径。"
    )
    .replace(
      "Start with sandbox or testnet routes plus max order and emergency-stop limits.",
      "先使用 sandbox/testnet，并配置最大订单和紧急停止限制。"
    );
}

function adapterLedgerLabel(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  const label =
    i18n.locale === "zh-CN"
      ? {
          paper_ready: "模拟适配器可用",
          live_ready: "实盘通道就绪",
          live_blocked: "实盘通道阻断",
          blocked: "通道阻断",
          config_required: "需要配置"
        }[row.state] ?? row.label
      : row.label;
  return `${row.market === "multi" ? (i18n.locale === "zh-CN" ? "多市场" : "Multi-market") : i18n.marketLabel(row.market)} · ${label}`;
}

function adapterLedgerAdapterName(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  if (i18n.locale === "en-US") {
    return row.adapter;
  }
  return (
    {
      "paper-local": "本地模拟交易",
      "ashare-live": "A 股券商接口",
      "us-live": "IBKR / Alpaca 适配器形态",
      "crypto-live": "ccxt 交易所适配器形态"
    }[row.adapterId] ?? row.adapter
  );
}

function adapterLedgerGateSummary(i18n: AppI18n, gateSummary: string): string {
  return i18n.locale === "zh-CN" ? gateSummary.replace("gates", "个闸门") : gateSummary;
}

function adapterLedgerReason(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  if (i18n.locale === "en-US") {
    return row.reason;
  }
  return row.reason
    .replace("Paper execution is available locally after audited run and risk checks.", "审计运行和风控检查通过后，本地模拟执行可用。")
    .replace("Paper execution is available locally.", "本地模拟执行可用。")
    .replace("Paper execution is available locally after audited run and risk handoff checks.", "审计运行和风险交接检查通过后，本地模拟执行可用。")
    .replace("Local paper execution is available after audited run and risk handoff checks.", "审计运行和风险交接检查通过后，本地模拟执行可用。")
    .replace("Real A-share trading stays blocked until a legal broker adapter is certified.", "合法券商适配器认证前，A 股实盘交易保持阻断。")
    .replace("US live adapters require sandbox credentials, order lifecycle tests, and manual confirmation.", "美股实盘适配器需要 sandbox 凭证、订单生命周期测试和人工确认。")
    .replace("Exchange trading keys are not read by this status endpoint and live routing remains blocked.", "该状态接口不读取交易密钥；实盘路由保持阻断。")
    .replace("Live execution remains blocked until adapter certification, risk approval, and human confirmation pass.", "适配器认证、风控审批和人工确认全部通过前，实盘执行保持阻断。");
}

function adapterLedgerNextStep(i18n: AppI18n, row: ExecutionAdapterLedgerRow): string {
  if (i18n.locale === "en-US") {
    return row.nextStep;
  }
  return row.nextStep
    .replace("Use paper execution for audited research runs before certifying live adapters.", "认证实盘适配器前，审计研究运行统一使用模拟执行。")
    .replace("Real A-share trading stays blocked until a legal broker adapter is certified.", "合法券商适配器认证前，继续阻断 A 股实盘交易。")
    .replace("Configure sandbox credentials, order lifecycle tests, and emergency-stop limits before certification.", "认证前先配置 sandbox 凭证、订单生命周期测试和紧急停止限制。")
    .replace("Keep human confirmation and risk approval gates attached to every promoted order.", "每笔晋级订单都必须绑定人工确认和风控审批闸门。")
    .replace("Keep live trading blocked until a legal adapter certification passes.", "合法适配器认证通过前，继续阻断实盘交易。");
}

function adapterCertificationAdapterName(i18n: AppI18n, adapterId: string): string {
  if (i18n.locale === "en-US") {
    return adapterId;
  }
  return (
    {
      "ashare-live": "A 股券商接口",
      "crypto-live": "加密交易所接口",
      "paper-local": "本地模拟盘",
      "us-live": "美股实盘接口"
    }[adapterId] ?? adapterId
  );
}

function adapterCertificationStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      Failed: "失败",
      Passed: "通过",
      Review: "待复核"
    }[statusLabel] ?? statusLabel
  );
}

function adapterCertificationApplyStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Ready for restart": "待受控重启"
    }[statusLabel] ?? statusLabel
  );
}

function adapterControlledRestartEvidenceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Evidence recorded": "证据已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterRestartAcceptanceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Acceptance recorded": "验收已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterSecretReferenceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Reference recorded": "引用已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterSecretMaterializationStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Manifest recorded": "物化清单已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterEnvironmentBindingStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Binding recorded": "绑定已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterRuntimeReloadPlanStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Plan recorded": "计划已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterRuntimeReloadExecutionStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Execution recorded": "执行证据已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterRuntimeReloadAcceptanceStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Acceptance recorded": "最终验收已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterOrchestrationDryRunStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Dry run recorded": "Dry-run 已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterOrchestrationExecutionStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Execution recorded": "执行证据已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterHumanConfirmationStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Confirmation recorded": "最终确认已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterCertificationBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary
    .replace("Paper only · live trading blocked", "仅记录模拟/沙盒证据，实盘交易保持阻断")
    .replace("Live trading allowed", "实盘交易已允许")
    .replace("Live trading blocked", "实盘交易保持阻断");
}

function adapterCertificationCheckSummary(i18n: AppI18n, checkSummary: string): string {
  if (i18n.locale === "en-US") {
    return checkSummary;
  }
  return checkSummary
    .replace("passed", "通过")
    .replace("blocked", "阻断")
    .replace("failed", "失败")
    .replace("review", "复核")
    .replace("checks", "项检查");
}

function adapterCertificationApplyConfirmationSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary.replace("confirmed", "已确认").replace("missing", "缺失");
}

function adapterControlledRestartEvidenceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterRestartAcceptanceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterSecretReferenceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterSecretMaterializationConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterEnvironmentBindingConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterRuntimeReloadPlanConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterRuntimeReloadExecutionConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterRuntimeReloadAcceptanceConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterOrchestrationDryRunConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterOrchestrationExecutionConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterHumanConfirmationConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterSandboxProbePlanConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterSandboxProbeExecutionConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterSandboxProbeReviewConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterProductionRouteReviewConfirmationSummary(i18n: AppI18n, summary: string): string {
  return adapterCertificationApplyConfirmationSummary(i18n, summary);
}

function adapterSandboxProbePlanStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Probe plan recorded": "探针计划已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterSandboxProbeExecutionStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Probe execution recorded": "探针执行已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterSandboxProbeReviewStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Probe review recorded": "探针复核已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterProductionRouteReviewStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Blocked: "阻断",
      "Route review recorded": "路由复核已记录"
    }[statusLabel] ?? statusLabel
  );
}

function adapterHealthProbeStatusLabel(i18n: AppI18n, statusLabel: string): string {
  if (i18n.locale === "en-US") {
    return statusLabel;
  }
  return (
    {
      Ready: "可用",
      "Review required": "待复核",
      Blocked: "阻断"
    }[statusLabel] ?? statusLabel
  );
}

function adapterHealthProbeCredentialSummaryLabel(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace("API key missing", "API Key 未配置")
    .replace("secret missing", "Secret 未配置")
    .replace("API key", "API Key")
    .replace("secret", "Secret");
}

function adapterHealthProbeCheckSummaryLabel(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary.replace("passed", "通过").replace("review", "复核").replace("blocked", "阻断");
}

function adapterHealthProbeBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return boundary.replace("Paper only", "仅模拟盘").replace("order routing disabled", "订单路由关闭");
}

function adapterHealthProbeBlockerLabel(i18n: AppI18n, blockerSummary: string): string {
  if (i18n.locale === "en-US") {
    return blockerSummary;
  }
  return blockerSummary === "No blockers" ? "无阻断" : blockerSummary;
}

function adapterHealthProbeCheckStatusLabel(i18n: AppI18n, status: string): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return (
    {
      passed: "通过",
      review: "复核",
      blocked: "阻断",
      skipped: "跳过"
    }[status] ?? status
  );
}

function adapterCertificationApplyBlockerSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace("No blockers", "无阻断")
    .replace("1 blocker", "1 个阻断")
    .replace("blockers", "个阻断");
}

function adapterCertificationApplyModeLabel(i18n: AppI18n, mode: string): string {
  if (i18n.locale === "en-US") {
    return mode.replaceAll("_", " ");
  }
  return (
    {
      manual_preflight: "人工预检",
      manual_secret_store: "密钥存储预检",
      manual_controlled_restart: "受控重启证据",
      manual_post_restart_acceptance: "重启后验收",
      local_runtime_env: "本地运行时环境绑定",
      manual_runtime_reload: "人工运行时重载",
      manual_controlled_reload: "人工受控重载执行",
      manual_runtime_reload_acceptance: "人工运行时重载最终验收",
      manual_adapter_orchestration_dry_run: "人工适配器编排 dry-run",
      manual_adapter_orchestration_execution: "人工适配器编排执行证据",
      manual_final_human_confirmation: "最终人工确认",
      manual_sandbox_probe_plan: "人工 sandbox 探针计划",
      manual_readonly_sandbox_probe: "人工只读 sandbox 探针",
      manual_sandbox_probe_review: "人工 sandbox 探针复核",
      manual_production_route_review: "人工生产路由复核"
    }[mode] ?? mode.replaceAll("_", " ")
  );
}

function adapterCertificationApplyConfirmationLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return (
    {
      "Secret-store reference saved": "密钥引用已本地保存",
      "Controlled restart window approved": "受控重启窗口已批准",
      "Operator reviewed certification": "操作员已复核认证"
    }[label] ?? label
  );
}

function adapterCertificationApplyConfirmationDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return (
    {
      "Confirm the real credential reference is stored outside this UI.": "确认真实凭证引用已保存在 UI 之外。",
      "Confirm an operator-approved restart window exists before applying.": "确认应用前已有操作员批准的重启窗口。",
      "Confirm the certification evidence and restart impact were reviewed.": "确认已复核认证证据和重启影响。"
    }[detail] ?? detail
  );
}

function settingsStatusLabel(i18n: AppI18n, status: PlatformSettingsStatus["dataSources"][number]["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    ready: "就绪",
    degraded: "降级",
    blocked: "阻断",
    config_required: "需配置",
    interface_only: "仅接口",
    paper_ready: "模拟可用"
  }[status];
}

function settingsKeyStatusLabel(i18n: AppI18n, keyName: string | null, isConfigured: boolean): string {
  if (!keyName) {
    return i18n.locale === "zh-CN" ? "无需 Key" : "No key required";
  }
  if (isConfigured) {
    return i18n.locale === "zh-CN" ? `${keyName} 已配置` : `${keyName} configured`;
  }
  return i18n.locale === "zh-CN" ? `${keyName} 未配置` : `${keyName} not configured`;
}

function marketDataAdapterCacheDiagnosticsLabel(
  i18n: AppI18n,
  diagnostics: PlatformSettingsStatus["marketDataAdapters"][number]["cacheDiagnostics"]
): string {
  if (diagnostics.freshness === "empty") {
    return i18n.locale === "zh-CN"
      ? `无缓存 · ${diagnostics.contextCount.toLocaleString("zh-CN")} 上下文`
      : `No cache · ${diagnostics.contextCount.toLocaleString("en-US")} contexts`;
  }
  const freshness =
    diagnostics.freshness === "fresh"
      ? i18n.locale === "zh-CN"
        ? "新鲜"
        : "Fresh"
      : i18n.locale === "zh-CN"
        ? "过期"
        : "Stale";
  const rows =
    i18n.locale === "zh-CN"
      ? `${diagnostics.rowCount.toLocaleString("zh-CN")} 行`
      : `${diagnostics.rowCount.toLocaleString("en-US")} rows`;
  const contexts =
    i18n.locale === "zh-CN"
      ? `${diagnostics.contextCount.toLocaleString("zh-CN")} 上下文`
      : `${diagnostics.contextCount.toLocaleString("en-US")} contexts`;
  return `${freshness} · ${rows} · ${contexts}`;
}

function marketDataAdapterExternalTelemetryLabel(
  i18n: AppI18n,
  telemetry: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]
): string {
  if (telemetry.status === "ok") {
    return i18n.locale === "zh-CN"
      ? `依赖可用 · ${telemetry.dependency} · ${telemetry.retryState}`
      : `Dependency ready · ${telemetry.dependency} · ${telemetry.retryState}`;
  }
  if (telemetry.status === "degraded") {
    return i18n.locale === "zh-CN"
      ? `外部源降级 · ${telemetry.dependency} · ${telemetry.retryState}`
      : `Provider degraded · ${telemetry.dependency} · ${telemetry.retryState}`;
  }
  if (telemetry.retryState === "dependency_missing") {
    return i18n.locale === "zh-CN"
      ? `依赖缺失 · ${telemetry.dependency}`
      : `Dependency missing · ${telemetry.dependency}`;
  }
  return i18n.locale === "zh-CN"
    ? `外部源未知 · ${telemetry.dependency}`
    : `External source unknown · ${telemetry.dependency}`;
}

function marketDataAdapterInstallGuidanceLabel(
  i18n: AppI18n,
  guidance: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["installGuidance"]
): string {
  if (i18n.locale === "zh-CN") {
    return `安装建议 · Docker ${guidance.dockerBuildArg} · ${guidance.packageInstallCommand}`;
  }
  return `Install · Docker ${guidance.dockerBuildArg} · ${guidance.packageInstallCommand}`;
}

function providerHealthTrendMomentumLabel(
  i18n: AppI18n,
  momentum: ReturnType<typeof buildMarketDataProviderHealthTrendSummary>["momentum"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        quiet: "Quiet",
        historical_only: "Historical only",
        easing: "Easing",
        active_errors: "Active errors",
        recent_spike: "Recent spike",
        cooldown_pressure: "Cooldown pressure"
      }[momentum] ?? momentum
    );
  }
  return (
    {
      quiet: "安静",
      historical_only: "仅历史错误",
      easing: "正在缓和",
      active_errors: "仍有错误",
      recent_spike: "近期抬升",
      cooldown_pressure: "冷却压力"
    }[momentum] ?? momentum
  );
}

function providerHealthTrendWindowLabel(i18n: AppI18n, windowId: string): string {
  if (i18n.locale === "en-US") {
    return (
      {
        oneHour: "1h",
        twentyFourHours: "24h",
        sevenDays: "7d"
      }[windowId] ?? windowId
    );
  }
  return (
    {
      oneHour: "1小时",
      twentyFourHours: "24小时",
      sevenDays: "7天"
    }[windowId] ?? windowId
  );
}

function providerHealthTrendLatestLabel(i18n: AppI18n, latestErrorAt: string | null): string {
  if (!latestErrorAt) {
    return i18n.locale === "zh-CN" ? "无最近错误" : "No latest error";
  }
  return i18n.locale === "zh-CN" ? `最新 ${formatChartDate(latestErrorAt)}` : `Latest ${formatChartDate(latestErrorAt)}`;
}

function providerHealthTrendCategoryLabel(i18n: AppI18n, category: string | null): string {
  if (!category) {
    return i18n.locale === "zh-CN" ? "无主因" : "none";
  }
  const labels: Record<string, { zh: string; en: string }> = {
    rate_limit: { zh: "限流", en: "Rate limit" },
    dependency: { zh: "依赖", en: "Dependency" },
    network: { zh: "网络", en: "Network" },
    upstream: { zh: "上游", en: "Upstream" },
    incomplete_data: { zh: "数据不完整", en: "Incomplete data" },
    unknown: { zh: "未知", en: "Unknown" }
  };
  const label = labels[category] ?? { zh: category, en: category };
  return i18n.locale === "zh-CN" ? label.zh : label.en;
}

function marketDataAdapterProviderHealthLabel(
  i18n: AppI18n,
  health: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]
): string {
  const statusLabel = marketDataAdapterProviderHealthStatusLabel(i18n, health.status);
  const categoryLabel = marketDataAdapterProviderHealthCategoryLabel(i18n, health.dominantCategory);
  const trendLabel = marketDataAdapterProviderHealthWindowSummaryLabel(i18n, health.windowSummary);
  const affected =
    health.affectedSymbols.length > 0
      ? health.affectedSymbols.slice(0, 3).join("/")
      : i18n.locale === "zh-CN"
        ? "无"
        : "none";
  const backoff =
    health.retryAfterSeconds > 0
      ? i18n.locale === "zh-CN"
        ? `${health.retryAfterSeconds} 秒`
        : `${health.retryAfterSeconds}s`
      : i18n.locale === "zh-CN"
        ? "无"
        : "none";
  return i18n.locale === "zh-CN"
    ? `健康 · ${statusLabel} · 错误 ${health.recentErrorCount} · 主因 ${categoryLabel} · 影响 ${affected} · ${trendLabel} · 建议退避 ${backoff}`
    : `Provider health · ${statusLabel} · errors ${health.recentErrorCount} · Primary ${categoryLabel} · affected ${affected} · ${trendLabel} · Backoff ${backoff}`;
}

function marketDataAdapterProviderHealthWindowSummaryLabel(
  i18n: AppI18n,
  windowSummary: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["windowSummary"]
): string {
  const trend = `${windowSummary.oneHour.errorCount}/${windowSummary.twentyFourHours.errorCount}/${windowSummary.sevenDays.errorCount}`;
  return i18n.locale === "zh-CN" ? `趋势 1h/24h/7d ${trend}` : `Trend 1h/24h/7d ${trend}`;
}

function marketDataAdapterProviderHealthStatusLabel(
  i18n: AppI18n,
  status: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return (
    {
      ok: "正常",
      watch: "观察",
      cooldown: "冷却",
      blocked: "阻断"
    }[status] ?? status
  );
}

function marketDataAdapterProviderHealthCategoryLabel(
  i18n: AppI18n,
  category: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["dominantCategory"]
): string {
  if (category === null) {
    return i18n.locale === "zh-CN" ? "无" : "none";
  }
  return marketDataAdapterProviderErrorCategoryLabel(i18n, category);
}

function marketDataRefreshGuardLabel(i18n: AppI18n, guard: MarketDataRefreshGuard): string {
  if (guard.overrideApplied) {
    const reason = guard.overrideReason ?? (i18n.locale === "zh-CN" ? "已记录人工确认" : "operator confirmation recorded");
    return i18n.locale === "zh-CN"
      ? `数据源冷却已手动覆盖：${reason}。本次刷新仍会执行。`
      : `Provider cooldown manually overridden: ${reason}. This refresh can proceed.`;
  }
  const affectedSymbols = guard.affectedSymbols.length
    ? guard.affectedSymbols.slice(0, 3).join("/")
    : i18n.locale === "zh-CN"
      ? "当前市场"
      : "current market";
  const retryAfter =
    guard.retryAfterSeconds > 0
      ? i18n.locale === "zh-CN"
        ? `${guard.retryAfterSeconds} 秒`
        : `${guard.retryAfterSeconds}s`
      : i18n.locale === "zh-CN"
        ? "稍后"
        : "later";
  return i18n.locale === "zh-CN"
    ? `数据源冷却：${affectedSymbols} 暂停手动刷新，建议 ${retryAfter} 后再试。`
    : `Provider cooldown: ${affectedSymbols} manual refresh is paused; retry after ${retryAfter}.`;
}

function marketDataAdapterProviderErrorLabel(
  i18n: AppI18n,
  error: NonNullable<PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["lastProviderError"]>
): string {
  const target = `${error.market.toUpperCase()} ${error.symbol} ${error.timeframe}`;
  const category = marketDataAdapterProviderErrorCategoryLabel(i18n, error.category);
  return i18n.locale === "zh-CN"
    ? `最近错误 · ${category} · ${error.source} · ${error.context} · ${target} · ${error.message}`
    : `Latest error · ${category} · ${error.source} · ${error.context} · ${target} · ${error.message}`;
}

function marketDataAdapterProviderErrorCategoryLabel(
  i18n: AppI18n,
  category: NonNullable<
    PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["lastProviderError"]
  >["category"]
): string {
  const labels = {
    rate_limit: { zh: "限流", en: "Rate limit" },
    dependency: { zh: "依赖", en: "Dependency" },
    network: { zh: "网络", en: "Network" },
    upstream: { zh: "上游", en: "Upstream" },
    incomplete_data: { zh: "数据不完整", en: "Incomplete data" },
    unknown: { zh: "未知", en: "Unknown" }
  } satisfies Record<typeof category, { zh: string; en: string }>;
  const label = labels[category] ?? labels.unknown;
  return i18n.locale === "zh-CN" ? label.zh : label.en;
}

function marketSearchCacheSummary(i18n: AppI18n, cache: NonNullable<MarketSearchSuggestion["cache"]>): string {
  if (cache.freshness === "empty") {
    return i18n.locale === "zh-CN" ? "当前周期无缓存" : "No cache for this timeframe";
  }
  const freshnessLabel = cacheFreshnessLabel(i18n, cache.freshness, cache.ageHours);
  const rowsLabel =
    i18n.locale === "zh-CN"
      ? `${cache.rowCount.toLocaleString("zh-CN")} 行`
      : `${cache.rowCount.toLocaleString("en-US")} rows`;
  return `${freshnessLabel} · ${rowsLabel} · ${formatCacheContextRange(cache.startTimestamp, cache.endTimestamp)}`;
}

function canRefreshSearchSuggestionCache(suggestion: MarketSearchSuggestion): boolean {
  return Boolean(suggestion.cache && suggestion.cache.freshness !== "fresh");
}

function cacheFreshnessLabel(
  i18n: AppI18n,
  freshness: PlatformSettingsStatus["cache"]["contexts"][number]["freshness"],
  ageHours: number | null
): string {
  if (freshness === "empty") {
    return i18n.locale === "zh-CN" ? "无缓存数据" : "No cached data";
  }
  const ageLabel =
    ageHours === null
      ? "n/a"
      : i18n.locale === "zh-CN"
        ? `${ageHours.toLocaleString("zh-CN")} 小时`
        : `${ageHours.toLocaleString("en-US")}h`;
  if (freshness === "fresh") {
    return i18n.locale === "zh-CN" ? `新鲜 · ${ageLabel}` : `Fresh · ${ageLabel}`;
  }
  return i18n.locale === "zh-CN" ? `过期 · ${ageLabel}` : `Stale · ${ageLabel}`;
}

function buildWatchlistCacheSummary(
  settings: PlatformSettingsStatus | undefined,
  workspace: TerminalWorkspace
): WatchlistCacheSummary {
  return workspace.watchlist.reduce<WatchlistCacheSummary>(
    (summary, instrument) => {
      const context = settings?.cache.contexts.find(
        (item) =>
          item.market === instrument.market &&
          item.symbol === instrument.symbol &&
          item.timeframe === workspace.selectedTimeframe
      );
      const freshness = context?.freshness ?? "empty";
      summary.total += 1;
      summary.rows += context?.rowCount ?? 0;
      if (freshness === "fresh") {
        summary.fresh += 1;
      } else if (freshness === "stale") {
        summary.stale += 1;
      } else {
        summary.empty += 1;
      }
      return summary;
    },
    { total: 0, fresh: 0, stale: 0, empty: 0, rows: 0 }
  );
}

function cacheContextKey(
  context: Pick<PlatformSettingsStatus["cache"]["contexts"][number], "market" | "symbol" | "timeframe">
): string {
  return `${context.market}:${context.symbol}:${context.timeframe}`;
}

function agentEvidenceLabel(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.label;
  }
  return (
    {
      context: "研究上下文",
      backtest: "回测证据",
      "benchmark": "基准 Alpha",
      "research-note": "研究笔记",
      risk: "风控闸门",
      safety: "AI 边界"
    }[card.id] ?? card.label
  );
}

function agentEvidenceValue(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.value;
  }
  if (card.value === "Pending audited run") {
    return "等待审计运行";
  }
  if (card.value === "No buy/sell advice") {
    return "不输出买卖建议";
  }
  if (card.value === "Live gates open") {
    return "实盘闸门已开启";
  }
  if (card.value === "Locked note snapshot") {
    return "已锁定笔记快照";
  }
  return card.value.replace("bars", "根K线").replace("blocked gates", "个阻断闸门");
}

function agentEvidenceDetail(i18n: AppI18n, card: AiEvidenceCard): string {
  if (i18n.locale === "en-US") {
    return card.detail;
  }
  const context = card.detail.match(/^(.+) · price (.+)$/);
  if (context) {
    return `${i18n.marketLabel(context[1] as Market)} · 价格 ${context[2]}`;
  }
  const auditedRun = card.detail.match(/^Audited run (.+) · revision (.+)$/);
  if (auditedRun) {
    return `审计运行 ${auditedRun[1]} · 版本 ${auditedRun[2]}`;
  }
  if (card.detail === "Run Pipeline before trusting AI review.") {
    return "先运行流水线，再信任 AI 评审。";
  }
  if (card.detail === "AI can explain supplied evidence only; no guaranteed outcome.") {
    return "AI 只能解释已提供证据；不保证结果。";
  }
  const benchmark = card.detail.match(/^Strategy (.+) vs buy-and-hold (.+) over (\d+) audited bars\.$/);
  if (benchmark) {
    return `策略 ${benchmark[1]} 对比买入持有 ${benchmark[2]} · ${benchmark[3]} 根审计K线`;
  }
  if (card.detail === "Benchmark comparison waits for an audited data snapshot.") {
    return "基准对比等待审计数据快照。";
  }
  return card.detail
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过");
}

function KlineChartCanvas({
  bars,
  locale,
  market,
  onLoadHistorical,
  symbol,
  timeframe
}: {
  bars: MarketKlinesResult["bars"];
  locale: Locale;
  market: Market;
  onLoadHistorical?: (beforeTimestampMs: number) => Promise<MarketKlinesResult["bars"]>;
  symbol: string;
  timeframe: Timeframe;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const contextKeyRef = useRef("");
  const historicalLoaderRef = useRef(onLoadHistorical);

  useEffect(() => {
    historicalLoaderRef.current = onLoadHistorical;
  }, [onLoadHistorical]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const chart = init(containerRef.current, {
      locale,
      styles: "dark",
      timezone: "Asia/Shanghai"
    });
    chartRef.current = chart;
    chart?.setPriceVolumePrecision(4, 2);
    chart?.setMaxOffsetRightDistance(chartRightBoundaryDistance);
    chart?.setOffsetRightDistance(chartRightBoundaryDistance);
    chart?.setRightMinVisibleBarCount(2);
    chart?.createIndicator("VOL", false, { height: 72, minHeight: 48 });
    chart?.setLoadDataCallback(({ type, data, callback }) => {
      if (type === LoadDataType.Forward && data?.timestamp) {
        const loader = historicalLoaderRef.current;
        if (!loader) {
          callback([], false);
          return;
        }
        void loader(data.timestamp)
          .then((loadedBars) => callback(toKlineChartData(loadedBars), loadedBars.length > 0))
          .catch(() => callback([], false));
        return;
      }
      if (type === LoadDataType.Backward) {
        chart.setOffsetRightDistance(chartRightBoundaryDistance);
      }
      callback([], false);
    });
    const clampFutureScroll = () => {
      if (chart && chart.getOffsetRightDistance() > chartRightBoundaryDistance) {
        chart.setOffsetRightDistance(chartRightBoundaryDistance);
      }
    };
    chart?.subscribeAction(ActionType.OnScroll, clampFutureScroll);
    chart?.subscribeAction(ActionType.OnVisibleRangeChange, clampFutureScroll);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            chart?.resize();
          });
    if (resizeObserver) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      chart?.unsubscribeAction(ActionType.OnScroll, clampFutureScroll);
      chart?.unsubscribeAction(ActionType.OnVisibleRangeChange, clampFutureScroll);
      resizeObserver?.disconnect();
      if (containerRef.current) {
        dispose(containerRef.current);
      } else if (chart) {
        dispose(chart);
      }
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setLocale(locale);
  }, [locale]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    const contextKey = `${market}:${symbol}:${timeframe}`;
    const isNewContext = contextKeyRef.current !== contextKey;
    contextKeyRef.current = contextKey;
    chart.applyNewData(toKlineChartData(bars), true, () => {
      chart.setMaxOffsetRightDistance(chartRightBoundaryDistance);
      if (isNewContext) {
        chart.setOffsetRightDistance(chartRightBoundaryDistance);
        chart.scrollToRealTime(0);
      }
    });
  }, [bars, market, symbol, timeframe]);

  return <div className="chart-canvas" ref={containerRef} aria-label={`${symbol} ${timeframe} K-line chart`} />;
}

function toKlineChartData(bars: MarketKlinesResult["bars"]): KLineData[] {
  return bars.map((bar) => ({
    timestamp: bar.timestampMs,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume
  }));
}

function formatChartDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function formatCacheContextRange(startTimestamp: string | null, endTimestamp: string | null): string {
  if (!startTimestamp || !endTimestamp) {
    return "n/a";
  }
  const start = formatChartDate(startTimestamp);
  const end = formatChartDate(endTimestamp);
  return start === end ? end : `${start} -> ${end}`;
}

function Panel({
  title,
  subtitle,
  action,
  className,
  children
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`terminal-panel ${className ?? ""}`}>
      <header>
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function GoldenPathRunbookPanel({
  className,
  i18n,
  isActionDisabled,
  onRunAction,
  onSelectWorkspace,
  preflight,
  runbook
}: {
  className?: string;
  i18n: AppI18n;
  isActionDisabled: (actionId: string | null | undefined) => boolean;
  onRunAction: (actionId: string | null | undefined, targetWorkspace?: string | null) => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
  preflight: ResearchPipelinePreflight;
  runbook: GoldenPathStatus["runbook"];
}) {
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "黄金路径审计清单" : "Golden Path Runbook"}
      subtitle={i18n.locale === "zh-CN" ? "从行情到模拟执行的可操作闸门" : "Actionable gates from market data to paper execution"}
      className={`audit-runbook-panel ${className ?? ""}`}
    >
      <div className="audit-runbook-list">
        {runbook.length ? (
          runbook.map((item, index) => {
            const workspaceId = productWorkAreaIds.includes(item.workspaceId as ProductWorkAreaId)
              ? (item.workspaceId as ProductWorkAreaId)
              : null;
            const canRunAction = Boolean(item.actionId) && !item.passed;
            const isRunbookActionDisabled = !canRunAction || isActionDisabled(item.actionId);
            const actionHint = goldenPathRunbookActionHint(i18n, item, isRunbookActionDisabled, preflight);
            const actionHintTone = item.actionId === "run-pipeline" ? preflight.status : item.status;
            return (
              <article
                className={`audit-runbook-row ${item.status} ${item.current ? "current" : ""}`}
                key={item.stepId}
              >
                <span className="audit-runbook-index">{index + 1}</span>
                <div className="audit-runbook-main">
                  <strong>{goldenPathStepLabel(i18n, item.stepId, item.label)}</strong>
                  <small>{auditRunbookDetail(i18n, item)}</small>
                  {actionHint ? (
                    <small className={`audit-runbook-action-hint ${actionHintTone}`}>{actionHint}</small>
                  ) : null}
                </div>
                <em>{auditRunbookStatusLabel(i18n, item)}</em>
                <div className="audit-runbook-actions">
                  <button disabled={!workspaceId} onClick={() => workspaceId && onSelectWorkspace(workspaceId)} type="button">
                    {i18n.locale === "zh-CN" ? "工作区" : "Workspace"}
                  </button>
                  <button
                    disabled={isRunbookActionDisabled}
                    onClick={() => onRunAction(item.actionId, item.targetWorkspace ?? item.workspaceId)}
                    type="button"
                  >
                    {auditRunbookActionLabel(i18n, item)}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN" ? "等待本地核心返回黄金路径状态。" : "Waiting for the local core to return golden path status."}
          </p>
        )}
      </div>
    </Panel>
  );
}

function RunHistoryRow({
  run,
  isActive,
  onExport,
  onInspectExport,
  onReplay,
  i18n
}: {
  run: ResearchRunAudit;
  isActive: boolean;
  onExport: (run: ResearchRunAudit) => void;
  onInspectExport: (run: ResearchRunAudit) => void;
  onReplay: (run: ResearchRunAudit) => void;
  i18n: AppI18n;
}) {
  return (
    <article
      aria-current={isActive ? "true" : undefined}
      className={`history-row ${isActive ? "active" : ""}`}
    >
      <button className="history-row-main" onClick={() => onReplay(run)} type="button">
        <strong>{i18n.researchRunHistoryLabel(run)}</strong>
        <span>{historyRunDetailLabel(i18n, run)}</span>
        <span>{run.runId}</span>
      </button>
      <div className="history-row-actions">
        <button onClick={() => onReplay(run)} type="button">
          <Play size={13} />
          <small>{isActive ? i18n.t("history.active") : i18n.t("history.replay")}</small>
        </button>
        <button onClick={() => onExport(run)} type="button">
          <Download size={13} />
          <small>{i18n.t("history.export")}</small>
        </button>
        <button onClick={() => onInspectExport(run)} type="button">
          <Search size={13} />
          <small>{i18n.locale === "zh-CN" ? "查看包" : "Inspect"}</small>
        </button>
      </div>
    </article>
  );
}

function RunComparisonBoard({ i18n, rows }: { i18n: AppI18n; rows: ResearchRunComparisonRow[] }) {
  return (
    <div className="history-comparison">
      <div className="history-comparison-title">
        <span>{i18n.t("history.comparison")}</span>
        <strong>{rows.length}</strong>
      </div>
      <div className="history-comparison-grid">
        <div className="history-comparison-row history-comparison-head">
          <span>{i18n.t("history.delta")}</span>
          <span>{i18n.t("history.current")}</span>
          <span>{i18n.t("history.previous")}</span>
        </div>
        {rows.map((row) => (
          <article className={`history-comparison-row ${row.tone}`} key={row.id}>
            <span>
              <strong>{historyComparisonLabel(i18n, row.label)}</strong>
              <em>{historyComparisonDeltaLabel(i18n, row.delta)}</em>
            </span>
            <span>{historyComparisonValue(i18n, row.current)}</span>
            <span>{historyComparisonValue(i18n, row.previous)}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

function RiskApprovalBoard({ approval, i18n }: { approval: RiskApprovalSummary; i18n: AppI18n }) {
  return (
    <section className={`risk-approval ${approval.status}`}>
      <div className="risk-approval-head">
        <span>{i18n.locale === "en-US" ? "Execution approval" : "执行前审批"}</span>
        <strong>{riskApprovalHeadline(i18n, approval)}</strong>
        <p>{riskApprovalSummaryText(i18n, approval)}</p>
      </div>
      <div className="risk-approval-grid">
        {approval.gates.map((gate) => (
          <article className={`risk-approval-gate ${gate.tone}`} key={gate.id}>
            <span>{riskApprovalGateLabel(i18n, gate)}</span>
            <strong>{riskApprovalGateValue(i18n, gate)}</strong>
            <em>{riskApprovalGateStatus(i18n, gate.status)}</em>
            <p>{riskApprovalGateDetail(i18n, gate)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function historyRunDetailLabel(i18n: AppI18n, run: ResearchRunAudit): string {
  const rows = i18n.t("history.rows", { count: run.dataRows });
  const revision = `${i18n.t("history.revision")}: ${run.strategyRevision}`;
  const execution = `${i18n.t("history.execution")}: ${historyExecutionModeLabel(i18n, run.executionMode)}`;
  const assumptions = historyAssumptionLabel(i18n, run);
  return assumptions ? `${rows} · ${revision} · ${execution} · ${assumptions}` : `${rows} · ${revision} · ${execution}`;
}

function historyExecutionModeLabel(i18n: AppI18n, mode: string): string {
  if (i18n.locale === "zh-CN") {
    return mode.replace("paper_only", "模拟盘").replace("certified_live", "认证实盘").replace("blocked_live", "实盘阻断");
  }
  return mode;
}

function historyAssumptionLabel(i18n: AppI18n, run: ResearchRunAudit): string | null {
  if (!run.backtestAssumptions) {
    return null;
  }
  const cash = run.backtestAssumptions.initialCash.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (i18n.locale === "zh-CN") {
    return `资金 ${cash} / 手续费 ${run.backtestAssumptions.feeBps}基点 / 滑点 ${run.backtestAssumptions.slippageBps}基点`;
  }
  return `Cash ${cash} / Fee ${run.backtestAssumptions.feeBps}bps / Slippage ${run.backtestAssumptions.slippageBps}bps`;
}

function historyComparisonLabel(i18n: AppI18n, label: string): string {
  if (label === "Assumptions") {
    return i18n.locale === "zh-CN" ? "回测假设" : label;
  }
  return i18n.metricLabel(label);
}

function historyComparisonDeltaLabel(i18n: AppI18n, delta: string): string {
  if (delta === "changed") {
    return i18n.t("history.changed");
  }
  if (delta === "same") {
    return i18n.t("history.unchanged");
  }
  return delta;
}

function historyComparisonValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  return value.replace("Cash", "资金").replace("Fee", "手续费").replace("Slippage", "滑点").replaceAll("bps", "基点");
}

function ExecutionTile({
  detail,
  icon: Icon,
  label,
  tone,
  value
}: {
  detail: string;
  icon: typeof Database;
  label: string;
  tone: PaperExecutionSummaryTile["tone"];
  value: string;
}) {
  return (
    <article className={`execution-tile ${tone}`}>
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
