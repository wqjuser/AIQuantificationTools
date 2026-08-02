import { executionAcceptanceAuditEventTypes } from "../../../components/ExecutionStage9ProductionAdmissionSection";
import { createI18n, Locale, resolveInitialLocale } from "../../../lib/i18n";
import { AiReviewArchiveImportSnapshot, AuditEventHistoryPagination, AuditEventRecord, DesktopReleaseLatestResult, generateP2ManifestChainPreflight, generateP2ReadinessAcceptance, generateStage1BootstrapPreflight, generateStage1DailyUse, GoldenPathStatusResult, loadAuditEvents, loadDesktopReleaseLatest, loadGoldenPathStatus, loadP0AcceptanceLatest, loadP1AcceptanceLatest, loadP2ManifestChainPreflightLatest, loadP2PaperReplayLatest, loadP2PreLiveAcceptanceLatest, loadP2ReadinessAcceptanceLatest, loadStage1BootstrapPreflightLatest, loadStage1DailyUseLatest, P0AcceptanceLatestResult, P0PaperSimulationResponse, P1AcceptanceLatestResult, P2ManifestChainPreflightLatestResult, P2PaperReplayLatestResult, P2PreLiveAcceptanceLatestResult, P2ReadinessAcceptanceLatestResult, PromotionCandidateRecord, ResearchRunExportPackage, Stage1BootstrapPreflightLatestResult, Stage1DailyUseLatestResult } from "../../../lib/terminal-api";
import { AiWorkbenchAction, buildAiActionWorkflowState, buildAiEvidenceCards, buildAuditEvidenceReportLedgerRows, buildAuditEvidenceReportLedgerSummary, buildBacktestAssumptionRows, buildBacktestEvidenceCards, buildBacktestReadinessGates, buildBacktestReport, buildBacktestTradeRows, buildDesktopReleaseSummary, buildGoldenPathRunbookPreview, buildGoldenPathWorkspaceContext, buildLatestAuditAidCurrentGapActionDescriptor, buildLatestAuditAidCurrentGapActionReadiness, buildP0AcceptanceReviewMarkdown, buildP0AcceptanceSummary, buildP0CurrentGapActionUrlSearch, buildP0PlatformActionOutcome, buildP0PlatformActionOutcomeEvidenceLink, buildP0PlatformBacklogItems, buildP0PlatformReadinessSummary, buildP1AcceptanceSummary, buildP2ManifestChainPreflightReviewMarkdown, buildP2ManifestChainPreflightSummary, buildP2PaperReplaySummary, buildP2PreLiveAcceptanceSummary, buildPaperTradingRows, buildProductWorkAreas, buildRiskApprovalSummary, buildStage1BootstrapPreflightSummary, buildStage1DailyUseSummary, buildStage1P0DailyUseRefreshOutcome, buildWorkflowStages, findLatestP2ManifestChainPreflightAuditLedgerRow, findLatestP2ReadinessAcceptanceAuditLedgerRow, ProductWorkAreaId, resolveP2ManifestChainPreflightAuditEventReference, resolveP2ReadinessAcceptanceAuditEventReference, resolveProductWorkAreaSelection, Stage1BootstrapPreflightSummary, Stage1DailyUseSummary, Stage1P0DailyUseRefreshOutcome, WorkflowRunState, workspaceWithAiAction } from "../../../lib/terminal-workbench";
import { type ColorScheme, resolveStoredTextScale, resolveSystemColorScheme } from "../../../lib/theme";
import { p2PreLiveAcceptanceSummaryHeadline } from "../../backtest/p2-readiness-formatters";
import { latestRecordedProductionRouteReviewIdForAdapter } from "../../execution/certification-evidence";
import { productWorkAreasWithGoldenPath } from "../../stage1/platform-overview-formatters";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, initialDesktopReleaseLatestState, initialGoldenPathStatusState, initialP0AcceptanceLatestState, initialP1AcceptanceLatestState, initialP2ManifestChainPreflightLatestState, initialP2PaperReplayLatestState, initialP2PreLiveAcceptanceLatestState, initialP2ReadinessAcceptanceLatestState, initialStage1BootstrapPreflightLatestState, initialStage1DailyUseLatestState, initialWorkspaceState, quantCoreBaseUrl } from "../initial-state";
import { automatedTradingWorkAreaIds, workflowAccentByStep } from "../navigation";
import { replaceAuditEvidenceReportQueryUrlParam, resolveInitialAuditEvidenceReportQuery, resolveInitialWorkAreaSelection } from "../url-state";
import { createWorkflowRunState } from "../workflow-runtime";
import { useCallback, useMemo, useRef, useState } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "executionAdapterProductionRouteReviews" | "paperExecutionRecord" | "setExecutionAdapterProductionRouteReviews" | "setPaperExecutionRecord">;
type Result = Pick<AppControllerBindings, "workspace" | "source" | "statusLabel" | "error" | "setWorkspaceState" | "goldenPathState" | "setGoldenPathState" | "isAutomatedTradingWorkflowRunning" | "setIsAutomatedTradingWorkflowRunning" | "automatedTradingWorkflowStatus" | "setAutomatedTradingWorkflowStatus" | "desktopReleaseLatestState" | "setDesktopReleaseLatestState" | "stage1BootstrapPreflightLatestState" | "setStage1BootstrapPreflightLatestState" | "stage1DailyUseLatestState" | "setStage1DailyUseLatestState" | "stage1P0DailyUseRefreshOutcome" | "setStage1P0DailyUseRefreshOutcome" | "p0AcceptanceLatestState" | "setP0AcceptanceLatestState" | "p1AcceptanceLatestState" | "setP1AcceptanceLatestState" | "p2PaperReplayLatestState" | "setP2PaperReplayLatestState" | "p2PreLiveAcceptanceLatestState" | "setP2PreLiveAcceptanceLatestState" | "p2ReadinessAcceptanceLatestState" | "setP2ReadinessAcceptanceLatestState" | "p2ReadinessAcceptanceAuditEvent" | "setP2ReadinessAcceptanceAuditEvent" | "p2ReadinessAcceptanceReviewAuditEvent" | "setP2ReadinessAcceptanceReviewAuditEvent" | "p2ReadinessEvidenceCoverageReviewAuditEvent" | "setP2ReadinessEvidenceCoverageReviewAuditEvent" | "p2ManifestChainPreflightLatestState" | "setP2ManifestChainPreflightLatestState" | "p2ManifestChainPreflightAuditEvent" | "setP2ManifestChainPreflightAuditEvent" | "p2ManifestChainPreflightReviewAuditEvent" | "setP2ManifestChainPreflightReviewAuditEvent" | "locale" | "setLocale" | "colorSchemePreference" | "setColorSchemePreference" | "textScale" | "setTextScale" | "systemColorScheme" | "setSystemColorScheme" | "colorScheme" | "initialWorkAreaSelection" | "activeWorkAreaId" | "setActiveWorkAreaId" | "activeLoopStepId" | "setActiveLoopStepId" | "activeWorkflowStageId" | "setActiveWorkflowStageId" | "workflowRunState" | "setWorkflowRunState" | "workflowStages" | "isSearchOpen" | "setIsSearchOpen" | "isRefreshing" | "setIsRefreshing" | "isRunning" | "setIsRunning" | "isLoadingDesktopRelease" | "setIsLoadingDesktopRelease" | "isGeneratingStage1BootstrapPreflight" | "setIsGeneratingStage1BootstrapPreflight" | "isGeneratingStage1DailyUse" | "setIsGeneratingStage1DailyUse" | "isLoadingP0Acceptance" | "setIsLoadingP0Acceptance" | "isLoadingP1Acceptance" | "setIsLoadingP1Acceptance" | "isLoadingP2PaperReplay" | "setIsLoadingP2PaperReplay" | "isLoadingP2PreLiveAcceptance" | "setIsLoadingP2PreLiveAcceptance" | "isLoadingP2ReadinessAcceptance" | "setIsLoadingP2ReadinessAcceptance" | "isGeneratingP2ReadinessAcceptance" | "setIsGeneratingP2ReadinessAcceptance" | "isLoadingP2ManifestChainPreflight" | "setIsLoadingP2ManifestChainPreflight" | "isGeneratingP2ManifestChainPreflight" | "setIsGeneratingP2ManifestChainPreflight" | "p0PaperSimulationRecord" | "setP0PaperSimulationRecord" | "promotionCandidateRecord" | "setPromotionCandidateRecord" | "inspectedExportArchiveSnapshot" | "setInspectedExportArchiveSnapshot" | "pendingImportPackage" | "setPendingImportPackage" | "auditEvidenceReportEvents" | "setAuditEvidenceReportEvents" | "executionAcceptanceAuditEvents" | "setExecutionAcceptanceAuditEvents" | "auditEvidenceReportPagination" | "setAuditEvidenceReportPagination" | "auditEvidenceReportQuery" | "setAuditEvidenceReportQuery" | "auditEvidenceReportOffset" | "setAuditEvidenceReportOffset" | "copiedP0ActionOutcomeEvidenceId" | "setCopiedP0ActionOutcomeEvidenceId" | "copiedP0AcceptanceReview" | "setCopiedP0AcceptanceReview" | "copiedP2ReadinessAcceptanceReview" | "setCopiedP2ReadinessAcceptanceReview" | "copiedP2ReadinessEvidenceCoverageReview" | "setCopiedP2ReadinessEvidenceCoverageReview" | "copiedP2ManifestChainPreflightReview" | "setCopiedP2ManifestChainPreflightReview" | "copiedPersonalTeamReadinessReview" | "setCopiedPersonalTeamReadinessReview" | "copiedDailyOpsControlRoomReview" | "setCopiedDailyOpsControlRoomReview" | "copiedDailyStartBriefReview" | "setCopiedDailyStartBriefReview" | "copiedStage1P0DailyUsePrimaryLink" | "setCopiedStage1P0DailyUsePrimaryLink" | "copiedStage1P0ShareLinkBundle" | "setCopiedStage1P0ShareLinkBundle" | "copiedStage1P0DailyUseArchive" | "setCopiedStage1P0DailyUseArchive" | "copiedStage1P0DailyUseStartupSnapshot" | "setCopiedStage1P0DailyUseStartupSnapshot" | "copiedStage1P0InvalidShareDiagnostics" | "setCopiedStage1P0InvalidShareDiagnostics" | "copiedStage1P0DailyUseRefreshOutcome" | "setCopiedStage1P0DailyUseRefreshOutcome" | "copiedStage1P0DailyUseRefreshOutcomeLink" | "setCopiedStage1P0DailyUseRefreshOutcomeLink" | "copiedP0ReadinessReport" | "setCopiedP0ReadinessReport" | "copiedPreLiveRunbook" | "setCopiedPreLiveRunbook" | "isRecordingPreLiveRunbook" | "setIsRecordingPreLiveRunbook" | "savingP0ReadinessReport" | "setSavingP0ReadinessReport" | "savingP0AcceptanceReview" | "setSavingP0AcceptanceReview" | "savingP2ReadinessAcceptanceReview" | "setSavingP2ReadinessAcceptanceReview" | "savingP2ReadinessEvidenceCoverageReview" | "setSavingP2ReadinessEvidenceCoverageReview" | "savingP2ManifestChainPreflightReview" | "setSavingP2ManifestChainPreflightReview" | "savingPersonalTeamReadinessReview" | "setSavingPersonalTeamReadinessReview" | "savingDailyOpsControlRoomReview" | "setSavingDailyOpsControlRoomReview" | "savingDailyStartBriefReview" | "setSavingDailyStartBriefReview" | "savingStage1P0DailyUseArchive" | "setSavingStage1P0DailyUseArchive" | "copiedAuditEvidenceSummary" | "setCopiedAuditEvidenceSummary" | "copiedAuditEvidenceReport" | "setCopiedAuditEvidenceReport" | "isApplyingImportPackage" | "setIsApplyingImportPackage" | "isLoadingAuditEvidenceReportEvents" | "setIsLoadingAuditEvidenceReportEvents" | "manualSelectionVersionRef" | "workspaceRef" | "workspaceQuoteRequestIdRef" | "workflowRunIdRef" | "automatedTradingWorkflowRunIdRef" | "automatedTradingWorkflowContextRef" | "automatedTradingWorkflowActionKeyRef" | "automatedTradingWorkflowActionInFlightRef" | "automatedTradingWorkflowActionErrorRef" | "auditEvidenceReportRequestIdRef" | "executionAcceptanceAuditRequestIdRef" | "auditEvidenceSummaryCopyResetTimerRef" | "auditEvidenceReportCopyResetTimerRef" | "preLiveRunbookCopyResetTimerRef" | "workspaceScrollPositionsRef" | "activeWorkAreaIdRef" | "activeWorkspaceSurfaceRef" | "rememberActiveWorkspaceScrollPosition" | "i18n" | "goldenPath" | "productWorkAreas" | "automatedTradingWorkAreas" | "activeWorkArea" | "activeLoopStep" | "activeWorkflowAccent" | "aiEvidenceCards" | "riskApprovalSummary" | "paperTradingRows" | "latestCcxtProductionRouteReviewId" | "auditEvidenceReportLedgerRows" | "auditEvidenceReportLedgerSummary" | "latestAuditAidCurrentGapAction" | "latestAuditAidCurrentGapActionReadiness" | "backtestAssumptionRows" | "backtestEvidenceCards" | "backtestReport" | "backtestReadinessGates" | "backtestTradeRows" | "goldenPathCurrentStep" | "goldenPathRunbookPreview" | "activeWorkspaceContext" | "p0PlatformReadinessSummary" | "p0PlatformBacklogItems" | "p0PlatformActionOutcome" | "p0ActionOutcomeEvidenceLink" | "p0AcceptanceSummary" | "p1AcceptanceSummary" | "desktopReleaseSummary" | "stage1BootstrapPreflightSummary" | "stage1DailyUseSummary" | "p2PaperReplaySummary" | "p2PreLiveAcceptanceSummary" | "p2ManifestChainPreflightSummary" | "p2ManifestChainPreflightAuditContext" | "latestP2ManifestChainPreflightAuditRow" | "latestP2ManifestChainPreflightReviewAuditRow" | "p2ReadinessAcceptanceAuditContext" | "latestP2ReadinessAcceptanceGeneratedAuditRow" | "p2ReadinessAcceptanceGeneratedAuditEventReference" | "p2ReadinessAcceptanceGeneratedAuditEventId" | "p2ReadinessAcceptanceGeneratedAuditEventSource" | "p2ManifestChainPreflightAuditReference" | "p2ManifestChainPreflightReviewAuditEventReference" | "p2ManifestChainPreflightAuditEventId" | "p2ManifestChainPreflightAuditEventSource" | "p2ManifestChainPreflightReviewAuditEventId" | "p2ManifestChainPreflightReviewAuditEventSource" | "p2PreLiveAcceptanceSummaryHeadlineText" | "p2ManifestChainPreflightReviewMarkdown" | "p0AcceptanceReviewMarkdown" | "refreshDesktopReleaseLatest" | "refreshStage1DailyUseLatest" | "refreshStage1BootstrapPreflightLatest" | "refreshStage1DailyUseReport" | "refreshP0AcceptanceLatest" | "refreshP1AcceptanceLatest" | "refreshP2PaperReplayLatest" | "refreshP2PreLiveAcceptanceLatest" | "refreshP2ReadinessAcceptanceLatest" | "generateP2ReadinessAcceptanceReport" | "refreshP2ManifestChainPreflightLatest" | "generateP2ManifestChainPreflightReport" | "refreshAuditEvidenceReportEvents" | "refreshExecutionAcceptanceAuditEvents" | "refreshGoldenPathStatus" | "updateAuditEvidenceReportQuery" | "previousAuditEvidenceReportPage" | "nextAuditEvidenceReportPage" | "runAiWorkbenchAction" | "commitProductWorkAreaSelection" | "copyP0CurrentGapActionLink"> & Pick<AppControllerBindings, "changeLocale" | "changeTextScale" | "toggleColorScheme">;

export function useAppKernel(controller: Dependencies): Result {
  const {
    executionAdapterProductionRouteReviews, paperExecutionRecord, setExecutionAdapterProductionRouteReviews, setPaperExecutionRecord
  } = controller;
  const [{ workspace, source, statusLabel, error }, setWorkspaceState] = useState(initialWorkspaceState);
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
  const changeLocale = useCallback((nextLocale: Locale) => setLocale(nextLocale), []);
  const changeTextScale = useCallback((scale: number) => setTextScale(scale), []);
  const toggleColorScheme = useCallback(
    () => setColorSchemePreference(colorScheme === "dark" ? "light" : "dark"),
    [colorScheme],
  );
  const initialWorkAreaSelection = resolveInitialWorkAreaSelection(workspace);
  const [activeWorkAreaId, setActiveWorkAreaId] = useState<ProductWorkAreaId>(() => initialWorkAreaSelection.areaId);
  const [activeLoopStepId, setActiveLoopStepId] = useState(() => initialWorkAreaSelection.quantLoopStepId);
  const [activeWorkflowStageId, setActiveWorkflowStageId] = useState(
      () => initialWorkAreaSelection.workflowStageId
    );
  const [workflowRunState, setWorkflowRunState] = useState<WorkflowRunState>(() => createWorkflowRunState());
  const workflowStages = buildWorkflowStages(workspace, workflowRunState);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
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
  const [p0PaperSimulationRecord, setP0PaperSimulationRecord] = useState<P0PaperSimulationResponse | null>(null);
  const [promotionCandidateRecord, setPromotionCandidateRecord] = useState<PromotionCandidateRecord | null>(null);
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
  const [auditEvidenceReportEvents, setAuditEvidenceReportEvents] = useState<AuditEventRecord[]>([]);
  const [executionAcceptanceAuditEvents, setExecutionAcceptanceAuditEvents] =
      useState<AuditEventRecord[]>([]);
  const [auditEvidenceReportPagination, setAuditEvidenceReportPagination] =
      useState<AuditEventHistoryPagination | null>(null);
  const [auditEvidenceReportQuery, setAuditEvidenceReportQuery] = useState(resolveInitialAuditEvidenceReportQuery);
  const [auditEvidenceReportOffset, setAuditEvidenceReportOffset] = useState(0);
  const [copiedP0ActionOutcomeEvidenceId, setCopiedP0ActionOutcomeEvidenceId] = useState<string | null>(null);
  const [copiedP0AcceptanceReview, setCopiedP0AcceptanceReview] = useState(false);
  const [copiedP2ReadinessAcceptanceReview, setCopiedP2ReadinessAcceptanceReview] = useState(false);
  const [copiedP2ReadinessEvidenceCoverageReview, setCopiedP2ReadinessEvidenceCoverageReview] = useState(false);
  const [copiedP2ManifestChainPreflightReview, setCopiedP2ManifestChainPreflightReview] = useState(false);
  const [copiedPersonalTeamReadinessReview, setCopiedPersonalTeamReadinessReview] = useState(false);
  const [copiedDailyOpsControlRoomReview, setCopiedDailyOpsControlRoomReview] = useState(false);
  const [copiedDailyStartBriefReview, setCopiedDailyStartBriefReview] = useState(false);
  const [copiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUsePrimaryLink] = useState(false);
  const [copiedStage1P0ShareLinkBundle, setCopiedStage1P0ShareLinkBundle] = useState(false);
  const [copiedStage1P0DailyUseArchive, setCopiedStage1P0DailyUseArchive] = useState(false);
  const [copiedStage1P0DailyUseStartupSnapshot, setCopiedStage1P0DailyUseStartupSnapshot] = useState(false);
  const [copiedStage1P0InvalidShareDiagnostics, setCopiedStage1P0InvalidShareDiagnostics] = useState(false);
  const [copiedStage1P0DailyUseRefreshOutcome, setCopiedStage1P0DailyUseRefreshOutcome] = useState(false);
  const [copiedStage1P0DailyUseRefreshOutcomeLink, setCopiedStage1P0DailyUseRefreshOutcomeLink] = useState(false);
  const [copiedP0ReadinessReport, setCopiedP0ReadinessReport] = useState(false);
  const [copiedPreLiveRunbook, setCopiedPreLiveRunbook] = useState(false);
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
  const [isApplyingImportPackage, setIsApplyingImportPackage] = useState(false);
  const [isLoadingAuditEvidenceReportEvents, setIsLoadingAuditEvidenceReportEvents] = useState(false);
  const manualSelectionVersionRef = useRef(0);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const workspaceQuoteRequestIdRef = useRef(0);
  const workflowRunIdRef = useRef(0);
  const automatedTradingWorkflowRunIdRef = useRef(0);
  const automatedTradingWorkflowContextRef = useRef<string | null>(null);
  const automatedTradingWorkflowActionKeyRef = useRef<string | null>(null);
  const automatedTradingWorkflowActionInFlightRef = useRef(false);
  const automatedTradingWorkflowActionErrorRef = useRef<string | null>(null);
  const auditEvidenceReportRequestIdRef = useRef(0);
  const executionAcceptanceAuditRequestIdRef = useRef(0);
  const auditEvidenceSummaryCopyResetTimerRef = useRef<number | null>(null);
  const auditEvidenceReportCopyResetTimerRef = useRef<number | null>(null);
  const preLiveRunbookCopyResetTimerRef = useRef<number | null>(null);
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
  const i18n = createI18n(locale);
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
  const aiEvidenceCards = buildAiEvidenceCards(workspace);
  const riskApprovalSummary = buildRiskApprovalSummary(workspace);
  const paperTradingRows = buildPaperTradingRows(workspace);
  const latestCcxtProductionRouteReviewId = latestRecordedProductionRouteReviewIdForAdapter(
      executionAdapterProductionRouteReviews,
      "ccxt-live"
    );
  const auditEvidenceReportLedgerRows = buildAuditEvidenceReportLedgerRows(auditEvidenceReportEvents);
  const auditEvidenceReportLedgerSummary = buildAuditEvidenceReportLedgerSummary(auditEvidenceReportLedgerRows);
  const latestAuditAidCurrentGapAction = buildLatestAuditAidCurrentGapActionDescriptor(auditEvidenceReportLedgerSummary);
  const latestAuditAidCurrentGapActionReadiness =
      buildLatestAuditAidCurrentGapActionReadiness(auditEvidenceReportLedgerSummary);
  const backtestAssumptionRows = buildBacktestAssumptionRows(workspace);
  const backtestEvidenceCards = buildBacktestEvidenceCards(workspace);
  const backtestReport = buildBacktestReport(workspace);
  const backtestReadinessGates = buildBacktestReadinessGates(workspace);
  const backtestTradeRows = buildBacktestTradeRows(workspace);
  const goldenPathCurrentStep = goldenPath?.steps.find((step) => step.id === goldenPath.currentStepId);
  const goldenPathRunbookPreview = buildGoldenPathRunbookPreview(goldenPath);
  const activeWorkspaceContext = buildGoldenPathWorkspaceContext(goldenPath, activeWorkAreaId);
  const p0PlatformReadinessSummary = buildP0PlatformReadinessSummary(goldenPath);
  const p0PlatformBacklogItems = buildP0PlatformBacklogItems(goldenPath);
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
  const latestP2ReadinessAcceptanceGeneratedAuditRow = useMemo(
      () =>
        findLatestP2ReadinessAcceptanceAuditLedgerRow(
          auditEvidenceReportLedgerRows,
          "p2_readiness_acceptance_generated",
          p2ReadinessAcceptanceAuditContext
        ),
      [auditEvidenceReportLedgerRows, p2ReadinessAcceptanceAuditContext]
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
  const p2ReadinessAcceptanceGeneratedAuditEventId = p2ReadinessAcceptanceGeneratedAuditEventReference.eventId;
  const p2ReadinessAcceptanceGeneratedAuditEventSource = p2ReadinessAcceptanceGeneratedAuditEventReference.source;
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
  const p0AcceptanceReviewMarkdown = useMemo(
      () =>
        buildP0AcceptanceReviewMarkdown({
          acceptance: p0AcceptanceLatestState.acceptance ?? null,
          summary: p0AcceptanceSummary
        }),
      [p0AcceptanceLatestState.acceptance, p0AcceptanceSummary]
    );
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
  const refreshGoldenPathStatus = useCallback(async () => {
      const result = await loadGoldenPathStatus(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      });
      setGoldenPathState(result);
      return result;
    }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol, workspace.selectedTimeframe]);
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
  return {
    workspace, source, statusLabel, error, setWorkspaceState, goldenPathState,
    setGoldenPathState, isAutomatedTradingWorkflowRunning, setIsAutomatedTradingWorkflowRunning, automatedTradingWorkflowStatus, setAutomatedTradingWorkflowStatus, desktopReleaseLatestState,
    setDesktopReleaseLatestState, stage1BootstrapPreflightLatestState, setStage1BootstrapPreflightLatestState, stage1DailyUseLatestState, setStage1DailyUseLatestState, stage1P0DailyUseRefreshOutcome,
    setStage1P0DailyUseRefreshOutcome, p0AcceptanceLatestState, setP0AcceptanceLatestState, p1AcceptanceLatestState, setP1AcceptanceLatestState, p2PaperReplayLatestState,
    setP2PaperReplayLatestState, p2PreLiveAcceptanceLatestState, setP2PreLiveAcceptanceLatestState, p2ReadinessAcceptanceLatestState, setP2ReadinessAcceptanceLatestState, p2ReadinessAcceptanceAuditEvent,
    setP2ReadinessAcceptanceAuditEvent, p2ReadinessAcceptanceReviewAuditEvent, setP2ReadinessAcceptanceReviewAuditEvent, p2ReadinessEvidenceCoverageReviewAuditEvent, setP2ReadinessEvidenceCoverageReviewAuditEvent, p2ManifestChainPreflightLatestState,
    setP2ManifestChainPreflightLatestState, p2ManifestChainPreflightAuditEvent, setP2ManifestChainPreflightAuditEvent, p2ManifestChainPreflightReviewAuditEvent, setP2ManifestChainPreflightReviewAuditEvent, locale,
    setLocale, colorSchemePreference, setColorSchemePreference, textScale, setTextScale, systemColorScheme,
    setSystemColorScheme, colorScheme, initialWorkAreaSelection, activeWorkAreaId, setActiveWorkAreaId, activeLoopStepId,
    setActiveLoopStepId, activeWorkflowStageId, setActiveWorkflowStageId, workflowRunState, setWorkflowRunState, workflowStages,
    isSearchOpen, setIsSearchOpen, isRefreshing, setIsRefreshing, isRunning, setIsRunning,
    isLoadingDesktopRelease, setIsLoadingDesktopRelease, isGeneratingStage1BootstrapPreflight, setIsGeneratingStage1BootstrapPreflight, isGeneratingStage1DailyUse, setIsGeneratingStage1DailyUse,
    isLoadingP0Acceptance, setIsLoadingP0Acceptance, isLoadingP1Acceptance, setIsLoadingP1Acceptance, isLoadingP2PaperReplay, setIsLoadingP2PaperReplay,
    isLoadingP2PreLiveAcceptance, setIsLoadingP2PreLiveAcceptance, isLoadingP2ReadinessAcceptance, setIsLoadingP2ReadinessAcceptance, isGeneratingP2ReadinessAcceptance, setIsGeneratingP2ReadinessAcceptance,
    isLoadingP2ManifestChainPreflight, setIsLoadingP2ManifestChainPreflight, isGeneratingP2ManifestChainPreflight, setIsGeneratingP2ManifestChainPreflight, p0PaperSimulationRecord, setP0PaperSimulationRecord,
    promotionCandidateRecord, setPromotionCandidateRecord, inspectedExportArchiveSnapshot, setInspectedExportArchiveSnapshot, pendingImportPackage, setPendingImportPackage,
    auditEvidenceReportEvents, setAuditEvidenceReportEvents, executionAcceptanceAuditEvents, setExecutionAcceptanceAuditEvents, auditEvidenceReportPagination, setAuditEvidenceReportPagination,
    auditEvidenceReportQuery, setAuditEvidenceReportQuery, auditEvidenceReportOffset, setAuditEvidenceReportOffset, copiedP0ActionOutcomeEvidenceId, setCopiedP0ActionOutcomeEvidenceId,
    copiedP0AcceptanceReview, setCopiedP0AcceptanceReview, copiedP2ReadinessAcceptanceReview, setCopiedP2ReadinessAcceptanceReview, copiedP2ReadinessEvidenceCoverageReview, setCopiedP2ReadinessEvidenceCoverageReview,
    copiedP2ManifestChainPreflightReview, setCopiedP2ManifestChainPreflightReview, copiedPersonalTeamReadinessReview, setCopiedPersonalTeamReadinessReview, copiedDailyOpsControlRoomReview, setCopiedDailyOpsControlRoomReview,
    copiedDailyStartBriefReview, setCopiedDailyStartBriefReview, copiedStage1P0DailyUsePrimaryLink, setCopiedStage1P0DailyUsePrimaryLink, copiedStage1P0ShareLinkBundle, setCopiedStage1P0ShareLinkBundle,
    copiedStage1P0DailyUseArchive, setCopiedStage1P0DailyUseArchive, copiedStage1P0DailyUseStartupSnapshot, setCopiedStage1P0DailyUseStartupSnapshot, copiedStage1P0InvalidShareDiagnostics, setCopiedStage1P0InvalidShareDiagnostics,
    copiedStage1P0DailyUseRefreshOutcome, setCopiedStage1P0DailyUseRefreshOutcome, copiedStage1P0DailyUseRefreshOutcomeLink, setCopiedStage1P0DailyUseRefreshOutcomeLink, copiedP0ReadinessReport, setCopiedP0ReadinessReport,
    copiedPreLiveRunbook, setCopiedPreLiveRunbook, isRecordingPreLiveRunbook, setIsRecordingPreLiveRunbook, savingP0ReadinessReport, setSavingP0ReadinessReport,
    savingP0AcceptanceReview, setSavingP0AcceptanceReview, savingP2ReadinessAcceptanceReview, setSavingP2ReadinessAcceptanceReview, savingP2ReadinessEvidenceCoverageReview, setSavingP2ReadinessEvidenceCoverageReview,
    savingP2ManifestChainPreflightReview, setSavingP2ManifestChainPreflightReview, savingPersonalTeamReadinessReview, setSavingPersonalTeamReadinessReview, savingDailyOpsControlRoomReview, setSavingDailyOpsControlRoomReview,
    savingDailyStartBriefReview, setSavingDailyStartBriefReview, savingStage1P0DailyUseArchive, setSavingStage1P0DailyUseArchive, copiedAuditEvidenceSummary, setCopiedAuditEvidenceSummary,
    copiedAuditEvidenceReport, setCopiedAuditEvidenceReport, isApplyingImportPackage, setIsApplyingImportPackage, isLoadingAuditEvidenceReportEvents, setIsLoadingAuditEvidenceReportEvents,
    manualSelectionVersionRef, workspaceRef, workspaceQuoteRequestIdRef, workflowRunIdRef, automatedTradingWorkflowRunIdRef, automatedTradingWorkflowContextRef,
    automatedTradingWorkflowActionKeyRef, automatedTradingWorkflowActionInFlightRef, automatedTradingWorkflowActionErrorRef, auditEvidenceReportRequestIdRef, executionAcceptanceAuditRequestIdRef, auditEvidenceSummaryCopyResetTimerRef,
    auditEvidenceReportCopyResetTimerRef, preLiveRunbookCopyResetTimerRef, workspaceScrollPositionsRef, activeWorkAreaIdRef, activeWorkspaceSurfaceRef, rememberActiveWorkspaceScrollPosition,
    i18n, goldenPath, productWorkAreas, automatedTradingWorkAreas, activeWorkArea, activeLoopStep,
    activeWorkflowAccent, aiEvidenceCards, riskApprovalSummary, paperTradingRows, latestCcxtProductionRouteReviewId, auditEvidenceReportLedgerRows,
    auditEvidenceReportLedgerSummary, latestAuditAidCurrentGapAction, latestAuditAidCurrentGapActionReadiness, backtestAssumptionRows, backtestEvidenceCards, backtestReport,
    backtestReadinessGates, backtestTradeRows, goldenPathCurrentStep, goldenPathRunbookPreview, activeWorkspaceContext, p0PlatformReadinessSummary,
    p0PlatformBacklogItems, p0PlatformActionOutcome, p0ActionOutcomeEvidenceLink, p0AcceptanceSummary, p1AcceptanceSummary, desktopReleaseSummary,
    stage1BootstrapPreflightSummary, stage1DailyUseSummary, p2PaperReplaySummary, p2PreLiveAcceptanceSummary, p2ManifestChainPreflightSummary, p2ManifestChainPreflightAuditContext,
    latestP2ManifestChainPreflightAuditRow, latestP2ManifestChainPreflightReviewAuditRow, p2ReadinessAcceptanceAuditContext, latestP2ReadinessAcceptanceGeneratedAuditRow, p2ReadinessAcceptanceGeneratedAuditEventReference, p2ReadinessAcceptanceGeneratedAuditEventId,
    p2ReadinessAcceptanceGeneratedAuditEventSource, p2ManifestChainPreflightAuditReference, p2ManifestChainPreflightReviewAuditEventReference, p2ManifestChainPreflightAuditEventId, p2ManifestChainPreflightAuditEventSource, p2ManifestChainPreflightReviewAuditEventId,
    p2ManifestChainPreflightReviewAuditEventSource, p2PreLiveAcceptanceSummaryHeadlineText, p2ManifestChainPreflightReviewMarkdown, p0AcceptanceReviewMarkdown, refreshDesktopReleaseLatest, refreshStage1DailyUseLatest,
    refreshStage1BootstrapPreflightLatest, refreshStage1DailyUseReport, refreshP0AcceptanceLatest, refreshP1AcceptanceLatest, refreshP2PaperReplayLatest, refreshP2PreLiveAcceptanceLatest,
    refreshP2ReadinessAcceptanceLatest, generateP2ReadinessAcceptanceReport, refreshP2ManifestChainPreflightLatest, generateP2ManifestChainPreflightReport, refreshAuditEvidenceReportEvents, refreshExecutionAcceptanceAuditEvents,
    refreshGoldenPathStatus, updateAuditEvidenceReportQuery, previousAuditEvidenceReportPage, nextAuditEvidenceReportPage, runAiWorkbenchAction, commitProductWorkAreaSelection,
    copyP0CurrentGapActionLink, changeLocale, changeTextScale, toggleColorScheme
  };
}
