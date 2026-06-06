import {
  BarChart3,
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
  Search,
  ShieldCheck,
  Timer,
  Upload,
  WalletCards,
  X
} from "lucide-react";
import { ActionType, dispose, init, LoadDataType, type Chart, type KLineData } from "klinecharts";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  buildLoadingMarketKlinesResult,
  loadGoldenPathStatus,
  importResearchRunExport,
  undoResearchRunImport,
  loadAuditEvents,
  loadAuditSigningKeys,
  applyAuditSigningKeyRotationPlan,
  prepareAuditSigningKeyRotationPlan,
  loadResearchRunAiReviews,
  loadMarketKlines,
  loadMarketSearch,
  loadLatestResearchRunPaperExecution,
  loadResearchRunDetail,
  loadResearchRunExport,
  loadResearchRunHistory,
  loadResearchRunPromotion,
  loadResearchNote,
  loadPlatformSettings,
  runPortfolioBacktest,
  refreshMarketCache,
  refreshMarketCacheBatch,
  loadStrategyLibrary,
  loadTerminalWorkspace,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  normalizeResearchRunExportPackagePayload,
  buildAuditEvidenceReportAuditEvent,
  buildBacktestReportAuditEvent,
  buildPortfolioBacktestReportAuditEvent,
  buildAuditSigningKeyRotationApplyAuditEvent,
  buildAuditSigningKeyRotationPlanAuditEvent,
  buildResearchRunExportAuditReport,
  withResearchRunExportAuditEvidenceArtifacts,
  withVerifiedResearchRunExportPackageReportSignatures,
  withResearchRunExportReportSignatures,
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
  AuditSigningKeyRotationApply,
  AuditSigningKeyRotationApplyResult,
  AuditSigningKeyRotationPlan,
  AuditSigningKeyRotationPlanResult,
  GoldenPathStatus,
  GoldenPathStatusResult,
  PlatformSettingsResult,
  PlatformSettingsStatus,
  PortfolioBacktestResult,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  ResearchRunExportAuditReport,
  ResearchRunExportPackage,
  ResearchRunHistoryResult,
  ResearchNoteResult,
  saveResearchNote,
  saveAuditEvent,
  signAuditReportEvent,
  revokeAuditReportEvent,
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
  buildGoldenPathRunbookPreview,
  buildGoldenPathWorkspaceContext,
  buildPaperExecutionSummaryTiles,
  buildPaperPositionRows,
  buildPaperTradingRows,
  buildPortfolioBacktestDraft,
  buildPortfolioBacktestDiagnosticRows,
  buildPortfolioBacktestReportMarkdown,
  buildPortfolioPeerAuditPlan,
  buildPortfolioRiskRows,
  buildProductWorkAreas,
  buildPromotionReadiness,
  buildResearchRunComparisonRows,
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
  buildWorkflowStages,
  buildInstrumentFromSymbol,
  filterAiReviewExportEvidenceIndexRows,
  filterBacktestRunComparisonMatrixRows,
  filterResearchRunExportPreviewRows,
  filterResearchRunExportBrowserRows,
  filterResearchRunExportIndexRows,
  filterAuditEvidenceReportLedgerRows,
  filterAuditSigningKeyRotationLedgerRows,
  filterResearchRunImportAuditEvents,
  filterResearchRunImportDiffRows,
  formatInstrumentPrice,
  mergeResearchRunImportAuditEvents,
  researchRunEvidenceLogLabel,
  resolveProductWorkAreaSelection,
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
  AuditSigningKeyRotationLedgerRow,
  Market,
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
  GoldenPathWorkspaceContext,
  GoldenPathRunbookPreviewItem,
  PaperPositionRow,
  PaperExecutionSummaryTile,
  PaperTradingRow,
  PortfolioBacktestDraft,
  PortfolioBacktestDiagnosticRow,
  PortfolioPeerAuditPlan,
  PortfolioRiskRow,
  PromotionQueueStage,
  PromotionReadiness,
  ProductWorkArea,
  ProductWorkAreaId,
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
  WorkflowRunLogEntry,
  WorkflowRunState,
  WorkflowStageView,
  workspaceFromResearchRunAudit,
  workspaceWithAiAction,
  workspaceWithBacktestAssumption,
  workspaceWithBacktestParameterCandidate,
  workspaceWithPreservedInteractiveState,
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
  workspace: buildTerminalWorkspace(),
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
const initialAuditSigningKeyRegistryState: AuditSigningKeyRegistryResult = {
  source: "fallback"
};
const initialAuditSigningKeyRotationPlanState: AuditSigningKeyRotationPlanResult = {
  source: "fallback"
};
const initialAuditSigningKeyRotationApplyState: AuditSigningKeyRotationApplyResult = {
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

type ImportAuditEvidenceDeepLinkStatus = InitialImportAuditEvidenceDeepLink & {
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

function resolveInitialWorkAreaSelection(workspace: TerminalWorkspace) {
  return resolveProductWorkAreaSelection(workspace, resolveInitialWorkAreaId("research"));
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

function waitForWorkflowStep() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, workflowStepDelayMs));
}

export function App() {
  const [{ workspace, source, statusLabel, error }, setWorkspaceState] = useState(initialWorkspaceState);
  const [{ runs: runHistory }, setRunHistoryState] = useState(initialRunHistoryState);
  const [strategyLibraryState, setStrategyLibraryState] = useState<StrategyLibraryResult>(initialStrategyLibraryState);
  const [strategyValidationState, setStrategyValidationState] =
    useState<StrategyValidationResult>(initialStrategyValidationState);
  const [researchNoteState, setResearchNoteState] = useState<ResearchNoteResult>(initialResearchNoteState);
  const [settingsStatus, setSettingsStatus] = useState<PlatformSettingsResult>(initialSettingsStatusState);
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
  const [auditSigningKeyRotationLedgerStatus, setAuditSigningKeyRotationLedgerStatus] =
    useState<AuditSigningKeyRotationLedgerStatus>(initialAuditSigningKeyRotationLedgerStatus);
  const [goldenPathState, setGoldenPathState] = useState<GoldenPathStatusResult>(initialGoldenPathStatusState);
  const [portfolioBacktestState, setPortfolioBacktestState] =
    useState<PortfolioBacktestResult>(initialPortfolioBacktestState);
  const [researchNoteDraft, setResearchNoteDraft] = useState("");
  const [klinesState, setKlinesState] = useState(initialKlinesState);
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
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const [isSavingResearchNote, setIsSavingResearchNote] = useState(false);
  const [isSubmittingPaperExecution, setIsSubmittingPaperExecution] = useState(false);
  const [isRunningPortfolioBacktest, setIsRunningPortfolioBacktest] = useState(false);
  const [isPreparingPortfolioPeers, setIsPreparingPortfolioPeers] = useState(false);
  const [isSavingAiReviewRecord, setIsSavingAiReviewRecord] = useState(false);
  const [isLoadingAiReviewHistory, setIsLoadingAiReviewHistory] = useState(false);
  const [isInspectingExportPackage, setIsInspectingExportPackage] = useState(false);
  const [isIndexingExportPackages, setIsIndexingExportPackages] = useState(false);
  const [refreshingCacheKey, setRefreshingCacheKey] = useState<string | null>(null);
  const [isRefreshingWatchlistCache, setIsRefreshingWatchlistCache] = useState(false);
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
  const [auditEvidenceReportEvents, setAuditEvidenceReportEvents] = useState<AuditEventRecord[]>([]);
  const [auditSigningKeyRotationEvents, setAuditSigningKeyRotationEvents] = useState<AuditEventRecord[]>([]);
  const [auditEvidenceReportPagination, setAuditEvidenceReportPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [auditEvidenceReportQuery, setAuditEvidenceReportQuery] = useState("");
  const [auditEvidenceReportOffset, setAuditEvidenceReportOffset] = useState(0);
  const [researchRunImportAuditEvents, setResearchRunImportAuditEvents] = useState<ResearchRunImportAuditEvent[]>([]);
  const [researchRunImportAuditPagination, setResearchRunImportAuditPagination] =
    useState<AuditEventHistoryPagination | null>(null);
  const [researchRunImportAuditQuery, setResearchRunImportAuditQuery] = useState(resolveInitialImportAuditEvidenceQuery);
  const [researchRunImportAuditOffset, setResearchRunImportAuditOffset] = useState(0);
  const [focusedImportAuditEventId, setFocusedImportAuditEventId] = useState<string | null>(() => resolveInitialImportAuditEventId());
  const [copiedImportAuditEvidenceEventId, setCopiedImportAuditEvidenceEventId] = useState<string | null>(null);
  const [copiedAuditEvidenceSummary, setCopiedAuditEvidenceSummary] = useState(false);
  const [copiedAuditEvidenceReport, setCopiedAuditEvidenceReport] = useState(false);
  const [importAuditEvidenceDeepLinkStatus, setImportAuditEvidenceDeepLinkStatus] =
    useState<ImportAuditEvidenceDeepLinkStatus | null>(
      initialImportAuditEvidenceDeepLink ? { ...initialImportAuditEvidenceDeepLink, status: "idle", error: null } : null
    );
  const [researchRunExportBrowserQuery, setResearchRunExportBrowserQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");
  const [researchRunImportDiffQuery, setResearchRunImportDiffQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");
  const [indexedExportPackages, setIndexedExportPackages] = useState<ResearchRunExportPackage[]>([]);
  const [aiReviewHistoryPagination, setAiReviewHistoryPagination] = useState<AiReviewRunHistoryPagination | null>(null);
  const [aiReviewHistoryQuery, setAiReviewHistoryQuery] = useState("");
  const [aiReviewHistoryOffset, setAiReviewHistoryOffset] = useState(0);
  const [isApplyingImportPackage, setIsApplyingImportPackage] = useState(false);
  const [isLoadingAuditEvidenceReportEvents, setIsLoadingAuditEvidenceReportEvents] = useState(false);
  const [isLoadingAuditSigningKeyRotationEvents, setIsLoadingAuditSigningKeyRotationEvents] = useState(false);
  const [isLoadingResearchRunImportAudit, setIsLoadingResearchRunImportAudit] = useState(false);
  const [isApplyingAuditSigningKeyRotationPlan, setIsApplyingAuditSigningKeyRotationPlan] = useState(false);
  const [isPreparingAuditSigningKeyRotationPlan, setIsPreparingAuditSigningKeyRotationPlan] = useState(false);
  const [signingAuditReportEventId, setSigningAuditReportEventId] = useState<string | null>(null);
  const [verifyingAuditReportEventId, setVerifyingAuditReportEventId] = useState<string | null>(null);
  const [revokingAuditReportEventId, setRevokingAuditReportEventId] = useState<string | null>(null);
  const manualSelectionVersionRef = useRef(0);
  const chartRequestIdRef = useRef(0);
  const workflowRunIdRef = useRef(0);
  const strategyValidationRequestIdRef = useRef(0);
  const aiReviewHistoryRequestIdRef = useRef(0);
  const auditEvidenceReportRequestIdRef = useRef(0);
  const researchRunImportAuditRequestIdRef = useRef(0);
  const importAuditCopyResetTimerRef = useRef<number | null>(null);
  const auditEvidenceSummaryCopyResetTimerRef = useRef<number | null>(null);
  const auditEvidenceReportCopyResetTimerRef = useRef<number | null>(null);
  const initialImportAuditEvidenceDeepLinkRef = useRef(initialImportAuditEvidenceDeepLink);
  const klinesStateRef = useRef(initialKlinesState);
  const historicalKlineRequestRef = useRef<string | null>(null);
  const symbolSearchRequestIdRef = useRef(0);
  const skipNextSymbolSearchRef = useRef(false);
  const i18n = createI18n(locale);
  const goldenPath = goldenPathState.goldenPath;
  const productWorkAreas = productWorkAreasWithGoldenPath(buildProductWorkAreas(workspace), goldenPath);
  const activeWorkArea =
    productWorkAreas.find((area) => area.id === activeWorkAreaId) ?? productWorkAreas.find((area) => area.id === "research");
  const activeLoopStep = workspace.quantLoop.find((step) => step.id === activeLoopStepId) ?? workspace.quantLoop[0];
  const activeWorkflowAccent = activeWorkArea?.accent ?? workflowAccentByStep[activeLoopStep?.id ?? "research"] ?? "market";
  const latestChartBar = klinesState.bars.at(-1);
  const agentCommitteeRounds = buildAgentCommitteeRounds(workspace);
  const aiEvidenceCards = buildAiEvidenceCards(workspace);
  const aiReviewDossier = buildAiReviewDossier(workspace);
  const currentAiReviewRunRecord = buildAiReviewRunRecord(workspace);
  const scannerCandidates = buildScannerCandidates(workspace);
  const portfolioRiskRows = buildPortfolioRiskRows(workspace);
  const portfolioBacktestDiagnosticRows = buildPortfolioBacktestDiagnosticRows(portfolioBacktestState.portfolio);
  const portfolioBacktestDraft = buildPortfolioBacktestDraft(runHistory, workspace.researchRun?.runId ?? null);
  const portfolioBacktestDraftKey =
    portfolioBacktestDraft.request?.legs.map((leg) => `${leg.runId}:${leg.targetWeight}`).join("|") ??
    portfolioBacktestDraft.status;
  const portfolioPeerAuditPlan = buildPortfolioPeerAuditPlan(workspace, runHistory);
  const riskApprovalSummary = buildRiskApprovalSummary(workspace);
  const activePaperExecutionRecord =
    paperExecutionRecord?.runId && paperExecutionRecord.runId === workspace.researchRun?.runId ? paperExecutionRecord : null;
  const activePromotionCandidateRecord =
    promotionCandidateRecord?.runId && promotionCandidateRecord.runId === workspace.researchRun?.runId
      ? promotionCandidateRecord
      : null;
  const activeAiReviewRunRecords = workspace.researchRun?.runId
    ? aiReviewRunRecords.filter((record) => record.runId === workspace.researchRun?.runId)
    : [];
  const paperExecutionSummaryTiles = buildPaperExecutionSummaryTiles(workspace, activePaperExecutionRecord);
  const paperPositionRows = buildPaperPositionRows(workspace, activePaperExecutionRecord);
  const paperTradingRows = buildPaperTradingRows(workspace);
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
  const auditSigningKeyRotationLedgerRows = filterAuditSigningKeyRotationLedgerRows(
    buildAuditSigningKeyRotationLedgerRows(auditSigningKeyRotationEvents),
    ""
  ).slice(0, AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE);
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
  const strategyReadinessGates = strategyValidationState.validation?.gates ?? localStrategyReadinessGates;
  const strategyRuleRows = buildStrategyRuleRows(workspace);
  const visibleStrategyLibrary = strategyLibraryState.strategies;
  const backtestAssumptionRows = buildBacktestAssumptionRows(workspace);
  const backtestEvidenceCards = buildBacktestEvidenceCards(workspace);
  const backtestParameterScanRows = buildBacktestParameterScanRows(workspace);
  const backtestParameterScanSummary = buildBacktestParameterScanSummary(workspace);
  const backtestReport = buildBacktestReport(workspace);
  const backtestRunComparisonMatrixRows = buildBacktestRunComparisonMatrixRows(runHistory, workspace.researchRun?.runId ?? null);
  const backtestRunComparisonMatrixSummary = buildBacktestRunComparisonMatrixSummary(backtestRunComparisonMatrixRows);
  const backtestReadinessGates = buildBacktestReadinessGates(workspace);
  const backtestTradeRows = buildBacktestTradeRows(workspace);
  const brokerAdapterRows = buildBrokerAdapterRows(workspace);
  const promotionReadiness =
    activePromotionCandidateRecord ?? buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows);
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
  const watchlistCacheSummary = buildWatchlistCacheSummary(settingsStatus.settings, workspace);
  const goldenPathCurrentStep = goldenPath?.steps.find((step) => step.id === goldenPath.currentStepId);
  const goldenPathRunbookPreview = buildGoldenPathRunbookPreview(goldenPath);
  const activeWorkspaceContext = buildGoldenPathWorkspaceContext(goldenPath, activeWorkAreaId);

  useEffect(() => {
    klinesStateRef.current = klinesState;
  }, [klinesState]);

  useEffect(() => {
    setPortfolioBacktestState(initialPortfolioBacktestState);
  }, [portfolioBacktestDraftKey]);

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
      eventType: "audit_evidence_report,backtest_report,portfolio_report",
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

  const refreshAuditSigningKeyRotationEvents = useCallback(async () => {
    setIsLoadingAuditSigningKeyRotationEvents(true);
    const [rotationPlanHistory, rotationApplyHistory] = await Promise.all([
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_rotation_plan",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      }),
      loadAuditEvents(quantCoreBaseUrl, {
        eventType: "audit_signing_key_rotation_apply",
        limit: AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE,
        offset: 0
      })
    ]);
    if (rotationPlanHistory.source === "core" || rotationApplyHistory.source === "core") {
      const rotationEvents = [
        ...(rotationPlanHistory.source === "core" ? rotationPlanHistory.events : []),
        ...(rotationApplyHistory.source === "core" ? rotationApplyHistory.events : [])
      ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
      setAuditSigningKeyRotationEvents(
        rotationEvents
      );
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
    void refreshAuditSigningKeyRotationEvents();
    void refreshResearchRunImportAuditEvents();
  }, [
    activeWorkAreaId,
    refreshAuditEvidenceReportEvents,
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

  const refreshSettingsStatus = useCallback(async () => {
    setSettingsStatus(await loadPlatformSettings(quantCoreBaseUrl));
  }, []);

  const refreshAuditSigningKeys = useCallback(async () => {
    setAuditSigningKeyRegistry(await loadAuditSigningKeys(quantCoreBaseUrl));
  }, []);

  const updateAuditSigningKeyRotationApplyConfirmation = useCallback(
    (field: keyof AuditSigningKeyRotationApplyConfirmations, value: boolean) => {
      setAuditSigningKeyRotationApplyConfirmations((current) => ({ ...current, [field]: value }));
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

  const applyAuditSigningKeyRotationPlanForAudit = useCallback(async () => {
    if (!auditSigningKeyRotationPlan.rotationPlan) {
      return;
    }
    setIsApplyingAuditSigningKeyRotationPlan(true);
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
          setAuditSigningKeyRotationEvents((current) => mergeAuditEvidenceReportEvent(current, ledgerResult.event!));
        }
      }
    } finally {
      setIsApplyingAuditSigningKeyRotationPlan(false);
    }
  }, [auditSigningKeyRotationApplyConfirmations, auditSigningKeyRotationPlan.rotationPlan, quantCoreBaseUrl]);

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
    setWorkspaceState((current) => {
      if (manualSelectionVersionRef.current === startedSelectionVersion) {
        return result;
      }
      return {
        ...result,
        workspace: workspaceWithPreservedInteractiveState(result.workspace, current.workspace),
        statusLabel: current.statusLabel
      };
    });
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

  const refreshCacheContext = useCallback(
    async (context: PlatformSettingsStatus["cache"]["contexts"][number]) => {
      const key = cacheContextKey(context);
      setRefreshingCacheKey(key);
      const result = await refreshMarketCache(quantCoreBaseUrl, {
        market: context.market,
        symbol: context.symbol,
        timeframe: context.timeframe,
        limit: chartKlineLimit
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
      setRefreshingCacheKey(null);
    },
    [
      refreshChart,
      refreshGoldenPathStatus,
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
    setIsRefreshingWatchlistCache(true);
    try {
      const result = await refreshMarketCacheBatch(
        quantCoreBaseUrl,
        workspace.watchlist.map((instrument) => ({
          market: instrument.market,
          symbol: instrument.symbol,
          timeframe: workspace.selectedTimeframe,
          limit: chartKlineLimit
        }))
      );
      setSettingsStatus((current) => ({
        settings: result.settings ?? current.settings,
        source: result.source,
        error: result.error
      }));
      if (
        result.refreshes.some(
          (refresh) =>
            refresh.market === workspace.selectedInstrument.market &&
            refresh.symbol === workspace.selectedInstrument.symbol &&
            refresh.timeframe === workspace.selectedTimeframe
        )
      ) {
        await refreshChart();
      }
      await refreshGoldenPathStatus();
    } finally {
      setIsRefreshingWatchlistCache(false);
    }
  }, [
    refreshChart,
    refreshGoldenPathStatus,
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
        limit: chartKlineLimit
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
  }, [refreshRunHistory, refreshStrategyLibrary, resetAiReviewHistoryState, workspace]);

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
      manualSelectionVersionRef.current += 1;
      workflowRunIdRef.current += 1;
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
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
    [resetAiReviewHistoryState]
  );

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
    const runId = workspace.researchRun?.runId;
    if (!runId) {
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Paper execution failed",
        error: "Run the pipeline before submitting a paper execution."
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
  }, [workspace.researchRun?.runId]);

  const selectProductWorkArea = useCallback(
    (areaId: ProductWorkAreaId) => {
      const selection = resolveProductWorkAreaSelection(workspace, areaId, activeWorkAreaId);
      setActiveWorkAreaId(selection.areaId);
      setActiveLoopStepId(selection.quantLoopStepId);
      setActiveWorkflowStageId(selection.workflowStageId);
    },
    [activeWorkAreaId, workspace]
  );

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
    if (url.searchParams.get("workspace") === activeWorkAreaId && !url.searchParams.has("workflow")) {
      return;
    }
    url.searchParams.set("workspace", activeWorkAreaId);
    url.searchParams.delete("workflow");
    window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }, [activeWorkAreaId]);

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
      const result = await loadMarketSearch(quantCoreBaseUrl, { market: marketDraft, query, limit: 8 });
      if (symbolSearchRequestIdRef.current === requestId) {
        setSearchSuggestions(result.results);
        setIsSearchOpen(true);
        setIsSymbolSearching(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [marketDraft, symbolDraft]);

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
        void submitPaperExecution();
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
    runGoldenPathActionById(activeWorkspaceContext.actionId, activeWorkspaceContext.workspaceId);
  }, [activeWorkspaceContext, runGoldenPathActionById]);

  const isGoldenPathActionDisabledById = useCallback(
    (actionId: string | null | undefined) => {
      if (isRefreshing || isRunning) {
        return true;
      }
      if (actionId === "refresh-data") {
        return Boolean(refreshingCacheKey);
      }
      if (actionId === "submit-paper-order") {
        return isSubmittingPaperExecution || !workspace.researchRun?.runId;
      }
      return false;
    },
    [isRefreshing, isRunning, isSubmittingPaperExecution, refreshingCacheKey, workspace.researchRun?.runId]
  );

  const goldenPathActionId = goldenPath?.nextAction?.id;
  const isGoldenPathActionDisabled = isGoldenPathActionDisabledById(goldenPathActionId);
  const workspaceContextActionId = activeWorkspaceContext?.actionId;
  const isWorkspaceContextActionDisabled =
    !workspaceContextActionId || isGoldenPathActionDisabledById(workspaceContextActionId);

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
            onRefreshCache={refreshSelectedMarketCache}
            onRefreshWatchlistCache={refreshWatchlistMarketCache}
            state={klinesState}
            watchlistCacheSummary={watchlistCacheSummary}
            workspace={workspace}
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
            isRunningPortfolioBacktest={isRunningPortfolioBacktest}
            isSubmittingPaperExecution={isSubmittingPaperExecution}
            onExportPortfolioMarkdown={exportPortfolioBacktestMarkdown}
            onPreparePortfolioPeers={preparePortfolioPeerAudits}
            onRunPortfolioBacktest={runPortfolioBacktestDraft}
            onSubmitPaperExecution={submitPaperExecution}
            paperRows={visiblePaperTradingRows}
            positionRows={paperPositionRows}
            portfolioBacktestDraft={portfolioBacktestDraft}
            portfolioBacktestDiagnosticRows={portfolioBacktestDiagnosticRows}
            portfolioBacktestResult={portfolioBacktestState}
            portfolioPeerAuditPlan={portfolioPeerAuditPlan}
            riskApproval={riskApprovalSummary}
            rows={portfolioRiskRows}
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
            rows={visiblePaperTradingRows}
            summaryTiles={paperExecutionSummaryTiles}
            workspace={workspace}
          />
          <PromotionQueuePanel
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
          <AuditEvidenceReportLedgerPanel
            className="workflow-report-ledger-panel"
            i18n={i18n}
            isLoading={isLoadingAuditEvidenceReportEvents}
            onNextPage={nextAuditEvidenceReportPage}
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
            onApplyConfirmationChange={updateAuditSigningKeyRotationApplyConfirmation}
            onApplyRotation={applyAuditSigningKeyRotationPlanForAudit}
            onPrepareRotation={prepareAuditSigningKeyRotationPlanForAudit}
            registry={auditSigningKeyRegistry.registry}
            rotationApply={auditSigningKeyRotationApply.rotationApply}
            rotationApplyConfirmations={auditSigningKeyRotationApplyConfirmations}
            rotationApplyError={auditSigningKeyRotationApply.error}
            rotationError={auditSigningKeyRotationPlan.error}
            rotationHistoryRows={auditSigningKeyRotationLedgerRows}
            rotationHistoryState={isLoadingAuditSigningKeyRotationEvents ? "loading" : "ready"}
            rotationLedgerStatus={auditSigningKeyRotationLedgerStatus}
            rotationPlan={auditSigningKeyRotationPlan.rotationPlan}
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
            adapterRows={brokerAdapterRows}
            className="workflow-settings-panel"
            i18n={i18n}
            onRefreshContext={refreshCacheContext}
            refreshingCacheKey={refreshingCacheKey}
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
                  title={`${i18n.productWorkAreaLabel(area)} · ${i18n.productWorkAreaDescription(area)}`}
                  type="button"
                >
                  <span className="work-area-index">{index + 1}</span>
                  <Icon size={15} />
                  <span className="work-area-copy">
                    <strong>{i18n.productWorkAreaLabel(area)}</strong>
                    <small>{i18n.productWorkAreaDescription(area)}</small>
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
                          <button
                            key={`${suggestion.market}-${suggestion.symbol}-${suggestion.source}`}
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
                          </button>
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
            <button className="run-button" disabled={isRefreshing || isRunning} onClick={runPipeline}>
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
            <button className="run-button compact" disabled={isGoldenPathActionDisabled} onClick={runGoldenPathAction} type="button">
              {isRefreshing || isRunning || isSubmittingPaperExecution ? <RefreshCw className="spin" size={15} /> : <Play size={15} />}
              {goldenPath?.nextAction
                ? goldenPathActionLabel(i18n, goldenPath.nextAction)
                : workflowNextActionLabel(i18n, activeLoopStep?.id ?? "research")}
            </button>
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

function MarketDataHealthPanel({
  cacheContext,
  className,
  i18n,
  isRefreshingCache = false,
  isRefreshingWatchlistCache = false,
  onRefreshCache,
  onRefreshWatchlistCache,
  state,
  watchlistCacheSummary,
  workspace
}: {
  cacheContext?: PlatformSettingsStatus["cache"]["contexts"][number];
  className?: string;
  i18n: AppI18n;
  isRefreshingCache?: boolean;
  isRefreshingWatchlistCache?: boolean;
  onRefreshCache?: () => void;
  onRefreshWatchlistCache?: () => void;
  state: MarketKlinesResult;
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

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "数据源健康" : "Data Source Health"}
      subtitle={`${i18n.marketLabel(workspace.selectedInstrument.market)} · ${workspace.selectedInstrument.symbol}`}
      className={className}
      action={
        onRefreshCache || onRefreshWatchlistCache ? (
          <div className="market-cache-actions">
            {onRefreshCache ? (
              <button className="market-cache-refresh" disabled={isRefreshingCache} onClick={onRefreshCache} type="button">
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
                disabled={isRefreshingWatchlistCache || !workspace.watchlist.length}
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
      </div>
    </Panel>
  );
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
  adapterRows,
  className,
  i18n,
  onRefreshContext,
  refreshingCacheKey,
  settings,
  state,
  workspace
}: {
  adapterRows: BrokerAdapterRow[];
  className?: string;
  i18n: AppI18n;
  onRefreshContext?: (context: PlatformSettingsStatus["cache"]["contexts"][number]) => void;
  refreshingCacheKey?: string | null;
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
          </article>
        ))}
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

function AuditEvidenceReportLedgerPanel({
  className,
  i18n,
  isLoading,
  onNextPage,
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
              {i18n.locale === "zh-CN" ? "最新" : "Latest"} <strong>{summary.latestHash ? summary.latestHash.slice(0, 12) : "n/a"}</strong>
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
                    <button
                      disabled={
                        signingEventId === row.id ||
                        verifyingEventId === row.id ||
                        revokingEventId === row.id ||
                        row.status === "invalid" ||
                        row.importVerificationInvalid > 0 ||
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
  if (row.importVerificationInvalid <= 0) {
    return "";
  }
  return i18n.locale === "zh-CN" ? "导入验签失败，需先更正证据再签名" : "Import verification failed; correct evidence before signing";
}

function AuditSigningKeyRegistryPanel({
  className,
  error,
  i18n,
  isApplyingRotation,
  isPreparingRotation,
  onApplyConfirmationChange,
  onApplyRotation,
  onPrepareRotation,
  registry,
  rotationApply,
  rotationApplyConfirmations,
  rotationApplyError,
  rotationError,
  rotationHistoryRows,
  rotationHistoryState,
  rotationLedgerStatus,
  rotationPlan,
  source
}: {
  className?: string;
  error?: string;
  i18n: AppI18n;
  isApplyingRotation: boolean;
  isPreparingRotation: boolean;
  onApplyConfirmationChange: (field: keyof AuditSigningKeyRotationApplyConfirmations, value: boolean) => void;
  onApplyRotation: () => void;
  onPrepareRotation: () => void;
  registry?: AuditSigningKeyRegistry;
  rotationApply?: AuditSigningKeyRotationApply;
  rotationApplyConfirmations: AuditSigningKeyRotationApplyConfirmations;
  rotationApplyError?: string;
  rotationError?: string;
  rotationHistoryRows: AuditSigningKeyRotationLedgerRow[];
  rotationHistoryState: "loading" | "ready";
  rotationLedgerStatus: AuditSigningKeyRotationLedgerStatus;
  rotationPlan?: AuditSigningKeyRotationPlan;
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
                <em>{row.eventKind === "apply" ? row.applyMode || "apply" : row.templateShortHash}</em>
                <small>{row.blockedReasonLabel}</small>
                <b>
                  {row.eventKind === "apply"
                    ? i18n.locale === "zh-CN"
                      ? `${row.confirmedConfirmationCount}/${row.stepCount} 确认`
                      : `${row.confirmedConfirmationCount}/${row.stepCount} checks`
                    : i18n.locale === "zh-CN"
                      ? `${row.environmentUpdateCount} 变量 / ${row.stepCount} 步`
                      : `${row.environmentUpdateCount} vars / ${row.stepCount} steps`}
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
  dossier,
  historyPagination,
  historyQuery,
  i18n,
  isLoadingHistory,
  liveExecutionBlocked,
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
  dossier: AiReviewDossier;
  historyPagination: AiReviewRunHistoryPagination | null;
  historyQuery: string;
  i18n: AppI18n;
  isLoadingHistory: boolean;
  liveExecutionBlocked: boolean;
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
    currentRunId,
    currentStrategyRevision,
    dossier,
    records: records.map((record) => record.record),
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
        "saved-review": "Saved review",
        "risk-approval": "Risk approval"
      } satisfies Record<AiReviewAuditTimelineItem["kind"], string>
    )[kind];
  }
  return (
    {
      "current-evidence": "当前证据",
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
      backtest: "回测回放",
      "backtest-report": "回测报告",
      "research-note": "研究笔记",
      "paper-executions": "模拟执行",
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
      "strategy-revision": "策略版本",
      "research-note": "研究笔记",
      "paper-executions": "模拟执行",
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
      "Rotation apply ready": "应用预检就绪"
    }[statusLabel] ?? statusLabel
  );
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
  className,
  i18n,
  isSubmitting = false,
  onSubmit,
  rows,
  summaryTiles,
  workspace
}: {
  approval: RiskApprovalSummary;
  className?: string;
  i18n: AppI18n;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  rows: PaperTradingRow[];
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
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
      <div className="gate-list">
        {workspace.execution.gates.map((gate) => (
          <span key={gate.id} className={gate.passed ? "passed" : "blocked"}>
            {i18n.gateLabel(gate.id, gate.label)}
          </span>
        ))}
      </div>
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
  className = "module-workspace-panel",
  executionClassName,
  i18n,
  isPreparingPortfolioPeers = false,
  isRunningPortfolioBacktest = false,
  isSubmittingPaperExecution = false,
  onExportPortfolioMarkdown,
  onPreparePortfolioPeers,
  onRunPortfolioBacktest,
  onSubmitPaperExecution,
  paperRows,
  positionRows,
  portfolioBacktestDraft,
  portfolioBacktestDiagnosticRows,
  portfolioBacktestResult,
  portfolioPeerAuditPlan,
  riskApproval,
  rows,
  summaryTiles,
  workspace
}: {
  className?: string;
  executionClassName?: string;
  i18n: AppI18n;
  isPreparingPortfolioPeers?: boolean;
  isRunningPortfolioBacktest?: boolean;
  isSubmittingPaperExecution?: boolean;
  onExportPortfolioMarkdown?: () => void;
  onPreparePortfolioPeers?: () => void;
  onRunPortfolioBacktest?: () => void;
  onSubmitPaperExecution?: () => void;
  paperRows: PaperTradingRow[];
  positionRows: PaperPositionRow[];
  portfolioBacktestDraft: PortfolioBacktestDraft;
  portfolioBacktestDiagnosticRows: PortfolioBacktestDiagnosticRow[];
  portfolioBacktestResult: PortfolioBacktestResult;
  portfolioPeerAuditPlan: PortfolioPeerAuditPlan;
  riskApproval: RiskApprovalSummary;
  rows: PortfolioRiskRow[];
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
  const portfolioBacktest = portfolioBacktestResult.portfolio;
  const canExportPortfolioMarkdown = Boolean(portfolioBacktest && onExportPortfolioMarkdown);
  const canRunPortfolioBacktest = portfolioBacktestDraft.status === "ready" && Boolean(onRunPortfolioBacktest);
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
        className={executionClassName}
        i18n={i18n}
        isSubmitting={isSubmittingPaperExecution}
        onSubmit={onSubmitPaperExecution}
        rows={paperRows}
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
  className,
  i18n,
  readiness
}: {
  className?: string;
  i18n: AppI18n;
  readiness: PromotionReadiness;
}) {
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
  runbook
}: {
  className?: string;
  i18n: AppI18n;
  isActionDisabled: (actionId: string | null | undefined) => boolean;
  onRunAction: (actionId: string | null | undefined, targetWorkspace?: string | null) => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
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
            return (
              <article
                className={`audit-runbook-row ${item.status} ${item.current ? "current" : ""}`}
                key={item.stepId}
              >
                <span className="audit-runbook-index">{index + 1}</span>
                <div className="audit-runbook-main">
                  <strong>{goldenPathStepLabel(i18n, item.stepId, item.label)}</strong>
                  <small>{auditRunbookDetail(i18n, item)}</small>
                </div>
                <em>{auditRunbookStatusLabel(i18n, item)}</em>
                <div className="audit-runbook-actions">
                  <button disabled={!workspaceId} onClick={() => workspaceId && onSelectWorkspace(workspaceId)} type="button">
                    {i18n.locale === "zh-CN" ? "工作区" : "Workspace"}
                  </button>
                  <button
                    disabled={isRunbookActionDisabled}
                    onClick={() => onRunAction(item.actionId, item.workspaceId)}
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
