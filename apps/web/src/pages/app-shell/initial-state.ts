import { type AiReviewDecision, type AuthoritativeAiReviewRun, type LegacyAiReviewHistoryRecord } from "../../lib/ai-review-stage3";
import { AuditSigningKeyControlledRestartEvidenceResult, AuditSigningKeyEnvironmentBindingResult, AuditSigningKeyRegistryResult, AuditSigningKeyRotationAcceptanceResult, AuditSigningKeyRotationApplyResult, AuditSigningKeyRotationPlanResult, AuditSigningKeyRuntimeReloadExecutionResult, AuditSigningKeyRuntimeReloadPlanResult, AuditSigningKeySecretMaterializationResult, DesktopReleaseLatestResult, ExecutionAdapterHealthProbeLoadResult, ExecutionAdapterLedgerResult, GoldenPathStatusResult, HandoffNotesResult, MarketCalendarResult, MarketDataReadinessResult, MarketKlinesResult, P0AcceptanceLatestResult, P1AcceptanceLatestResult, P2ManifestChainPreflightLatestResult, P2PaperReplayLatestResult, P2PreLiveAcceptanceLatestResult, P2ReadinessAcceptanceLatestResult, PlatformSettingsResult, PortfolioBacktestResult, ProductionStrategyHandoffResult, ResearchNoteResult, ResearchRunHistoryResult, Stage1BootstrapPreflightLatestResult, Stage1DailyUseLatestResult, StrategyLibraryItem, StrategyLibraryResult, StrategyProductionBindingResult, StrategyValidationResult, WorkspaceLoadResult, resolveQuantCoreBaseUrl } from "../../lib/terminal-api";
import { Market, Stage1P0DailyUseShareDeepLinkStatus, Timeframe, resolveAiReviewRunIdFromUrl, resolveLocalReviewCoverageNextActionDeepLinkState, resolveP0CompletionGapDeepLinkState, resolveP0CurrentGapActionDeepLinkState, resolveStage1P0DailyUseShareDeepLinkState, resolveStage1P0DailyUseShareDeepLinkStatus, resolveStrategyExperimentIdFromUrl } from "../../lib/terminal-workbench";
import { type AuditSigningKeyRotationLedgerStatus } from "../audit/AuditLedgerFormatters";
import { localReviewCoverageNextActionLoadedStatusLabel, stage1P0DailyUseShareLinkInvalidStatusLabel, stage1P0DailyUseShareLinkLoadedStatusLabel } from "../stage1/local-review-formatters";
import { buildInitialTerminalWorkspace } from "./url-state";

export const quantCoreBaseUrl = resolveQuantCoreBaseUrl({
  VITE_QUANT_API_BASE: import.meta.env.VITE_QUANT_API_BASE
});

export const VISIBLE_PAGE_REFRESH_INTERVAL_MS = 35_000;

export const initialP0CurrentGapActionDeepLinkState =
  typeof window === "undefined" ? null : resolveP0CurrentGapActionDeepLinkState(window.location.search);

export const initialP0CompletionGapDeepLinkState =
  typeof window === "undefined" ? null : resolveP0CompletionGapDeepLinkState(window.location.search);

export const initialLocalReviewCoverageNextActionDeepLinkState =
  typeof window === "undefined" ? null : resolveLocalReviewCoverageNextActionDeepLinkState(window.location.search);

export const emptyStage1P0DailyUseShareDeepLinkStatus: Stage1P0DailyUseShareDeepLinkStatus = {
  reason: null,
  state: null,
  status: "none"
};

export const initialStage1P0DailyUseShareDeepLinkStatus =
  typeof window === "undefined"
    ? emptyStage1P0DailyUseShareDeepLinkStatus
    : resolveStage1P0DailyUseShareDeepLinkStatus(window.location.search);

export const initialStage1P0DailyUseShareDeepLinkState =
  typeof window === "undefined" ? null : resolveStage1P0DailyUseShareDeepLinkState(window.location.search);

export const initialStrategyExperimentId =
  typeof window === "undefined" ? null : resolveStrategyExperimentIdFromUrl(window.location.search);

export const initialAiReviewRunId =
  typeof window === "undefined" ? null : resolveAiReviewRunIdFromUrl(window.location.search);

export const initialWorkspaceState: WorkspaceLoadResult = {
  workspace: buildInitialTerminalWorkspace(),
  source: "fallback",
  statusLabel: initialP0CurrentGapActionDeepLinkState
    ? `P0 next-step link loaded: ${initialP0CurrentGapActionDeepLinkState.actionId} -> ${initialP0CurrentGapActionDeepLinkState.targetWorkspaceId}`
    : initialP0CompletionGapDeepLinkState
      ? `P0 completion gap link loaded -> ${initialP0CompletionGapDeepLinkState.targetWorkspaceId}`
    : initialLocalReviewCoverageNextActionDeepLinkState
      ? localReviewCoverageNextActionLoadedStatusLabel(initialLocalReviewCoverageNextActionDeepLinkState)
      : initialStage1P0DailyUseShareDeepLinkState
        ? stage1P0DailyUseShareLinkLoadedStatusLabel(initialStage1P0DailyUseShareDeepLinkState)
        : initialStage1P0DailyUseShareDeepLinkStatus.status === "invalid"
          ? stage1P0DailyUseShareLinkInvalidStatusLabel(initialStage1P0DailyUseShareDeepLinkStatus)
        : "Offline snapshot"
};

export const initialRunHistoryState: ResearchRunHistoryResult = {
  runs: [],
  source: "fallback"
};

export const initialKlinesState: MarketKlinesResult = {
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

export const initialMarketDataReadinessState: MarketDataReadinessResult = {
  source: "fallback",
  error: "Market data readiness not loaded"
};

export function buildFallbackMarketCalendarState(market: Market, error?: string): MarketCalendarResult {
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

export const initialStrategyLibraryState: StrategyLibraryResult = {
  strategies: [],
  source: "fallback"
};

export const initialStrategyProductionBindingState: StrategyProductionBindingResult = {
  source: "fallback"
};

export const initialProductionStrategyHandoffState: ProductionStrategyHandoffResult = {
  source: "fallback"
};

export type ProductionStrategyBindingTarget = Pick<
  StrategyLibraryItem,
  "revision" | "auditRunId" | "status"
>;

export const initialStrategyValidationState: StrategyValidationResult = {
  source: "fallback"
};

export const initialResearchNoteState: ResearchNoteResult = {
  source: "fallback"
};

export const initialHandoffNotesState: HandoffNotesResult = {
  handoffNotes: [],
  source: "fallback"
};

export const initialSettingsStatusState: PlatformSettingsResult = {
  source: "fallback"
};

export const initialExecutionAdapterLedgerState: ExecutionAdapterLedgerResult = {
  source: "fallback"
};

export const initialExecutionAdapterHealthProbeState: ExecutionAdapterHealthProbeLoadResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRegistryState: AuditSigningKeyRegistryResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRotationPlanState: AuditSigningKeyRotationPlanResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRotationApplyState: AuditSigningKeyRotationApplyResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRestartEvidenceState: AuditSigningKeyControlledRestartEvidenceResult = {
  source: "fallback"
};

export const initialAuditSigningKeySecretMaterializationState: AuditSigningKeySecretMaterializationResult = {
  source: "fallback"
};

export const initialAuditSigningKeyEnvironmentBindingState: AuditSigningKeyEnvironmentBindingResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRuntimeReloadPlanState: AuditSigningKeyRuntimeReloadPlanResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRuntimeReloadExecutionState: AuditSigningKeyRuntimeReloadExecutionResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRotationAcceptanceState: AuditSigningKeyRotationAcceptanceResult = {
  source: "fallback"
};

export const initialAuditSigningKeyRotationLedgerStatus: AuditSigningKeyRotationLedgerStatus = {
  detail: "",
  state: "idle"
};

export const initialGoldenPathStatusState: GoldenPathStatusResult = {
  source: "fallback"
};

export const initialDesktopReleaseLatestState: DesktopReleaseLatestResult = {
  source: "fallback"
};

export const initialStage1BootstrapPreflightLatestState: Stage1BootstrapPreflightLatestResult = {
  source: "fallback"
};

export const initialStage1DailyUseLatestState: Stage1DailyUseLatestResult = {
  source: "fallback"
};

export const initialP0AcceptanceLatestState: P0AcceptanceLatestResult = {
  source: "fallback"
};

export const initialP1AcceptanceLatestState: P1AcceptanceLatestResult = {
  source: "fallback"
};

export const initialP2PaperReplayLatestState: P2PaperReplayLatestResult = {
  source: "fallback"
};

export const initialP2PreLiveAcceptanceLatestState: P2PreLiveAcceptanceLatestResult = {
  source: "fallback"
};

export const initialP2ReadinessAcceptanceLatestState: P2ReadinessAcceptanceLatestResult = {
  source: "fallback"
};

export const initialP2ManifestChainPreflightLatestState: P2ManifestChainPreflightLatestResult = {
  source: "fallback"
};

export const initialPortfolioBacktestState: PortfolioBacktestResult = {
  source: "fallback"
};

export const timeframeOptions: Timeframe[] = ["1d", "1w", "1m", "5m", "15m", "30m", "60m"];

export const AI_REVIEW_HISTORY_PAGE_SIZE = 5;

export const AUDIT_REPORT_EVENTS_PAGE_SIZE = 8;

export const MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE = 8;

export const PORTFOLIO_PAPER_ORDER_AUDIT_EVENTS_PAGE_SIZE = 8;

export const EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENTS_PAGE_SIZE = 8;

export const EXECUTION_ADAPTER_PAPER_EXECUTION_AUDIT_EVENT_TYPES = "execution_adapter_paper_execution";

export const PORTFOLIO_PAPER_ORDER_AUDIT_EVENT_TYPES =
  "portfolio_paper_order_batch,portfolio_paper_order_approval,portfolio_paper_order_simulation";

export const AUDIT_SIGNING_KEY_ROTATION_EVENTS_PAGE_SIZE = 5;

export const IMPORT_AUDIT_EVENTS_PAGE_SIZE = 12;

export interface AiReviewArchivePreviewState {
  aiReviewDecisions: AiReviewDecision[];
  authoritativeAiReviewRecords: AuthoritativeAiReviewRun[];
  error: string | null;
  legacyAiReviewRecords: LegacyAiReviewHistoryRecord[];
  runId: string | null;
  status: "idle" | "loading" | "ready" | "failed";
}

export interface ResearchRunExportPackageInspectionResult {
  error?: string;
  ok: boolean;
}
