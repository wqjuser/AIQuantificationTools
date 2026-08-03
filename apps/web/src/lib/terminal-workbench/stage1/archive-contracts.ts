import type { WorkflowStageArtifact, WorkflowStageStatus } from "../audit/execution-contracts";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterOpsStateRow, ExecutionAdapterPaperExecutionRow, ExecutionAdapterPreLiveCertificationInputRow, ExecutionAdapterPreLiveHealthProbeInputRow, ExecutionAdapterPreLiveHumanConfirmationInputRow, ExecutionAdapterPreLiveLedgerInputRow, ExecutionAdapterPreLivePaperOrderLifecycleInputRow, ExecutionAdapterPreLiveProductionRouteReviewInputRow, ExecutionAdapterPreLiveRunbookInputRow, ExecutionAdapterPreLiveRuntimeAcceptanceInputRow, ExecutionAdapterPreLiveSandboxOrderSchemaDryRunInputRow, ExecutionAdapterPreLiveSecretManifestInputRow } from "../execution/ops-contracts";
import type { ExecutionAdapterPaperRouteRunbookRow } from "../execution/validation-contracts";
import type { ResearchRunDataSnapshot, ResearchRunStrategyConfig, WatchlistCacheRefreshRunSnapshot } from "../research/workspace-contracts";
import type { DesktopReleaseSummary, Market, P0AcceptanceSummary, P1AcceptanceSummary, ProductWorkAreaId, Stage1BootstrapPreflightSummary, Stage1BootstrapPreflightSummaryCheckSource, Stage1BootstrapPreflightSummarySource, Stage1DailyUseSummary, Timeframe } from "./foundation-contracts";
import type { DailyStartBrief } from "./review-contracts";

export type ExecutionAdapterPreLivePaperRouteRunbookInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterPaperRouteRunbookRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "id"
    | "market"
    | "route"
    | "routeExecuted"
    | "runbookStepSummary"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLiveOpsStateInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterOpsStateRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "id"
    | "market"
    | "opsStepSummary"
    | "route"
    | "routeExecuted"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export type ExecutionAdapterPreLivePaperExecutionInputRow = ExecutionAdapterPreLiveRunbookInputRow<
  Pick<
    ExecutionAdapterPaperExecutionRow,
    | "adapterId"
    | "auditEventId"
    | "boundary"
    | "fillSummary"
    | "id"
    | "liveOrderSubmitted"
    | "market"
    | "orderSubmitted"
    | "paperFillRecorded"
    | "route"
    | "routeExecuted"
    | "status"
    | "statusLabel"
    | "timestamp"
  >
>;

export interface ExecutionAdapterPreLiveRunbookInput {
  workspace: TerminalWorkspace;
  adapterLedgerRows?: ReadonlyArray<ExecutionAdapterPreLiveLedgerInputRow>;
  certificationRows?: ReadonlyArray<ExecutionAdapterPreLiveCertificationInputRow>;
  secretManifestValidationRows?: ReadonlyArray<ExecutionAdapterPreLiveSecretManifestInputRow>;
  runtimeReloadAcceptanceRows?: ReadonlyArray<ExecutionAdapterPreLiveRuntimeAcceptanceInputRow>;
  humanConfirmationRows?: ReadonlyArray<ExecutionAdapterPreLiveHumanConfirmationInputRow>;
  productionRouteReviewRows?: ReadonlyArray<ExecutionAdapterPreLiveProductionRouteReviewInputRow>;
  healthProbeRows?: ReadonlyArray<ExecutionAdapterPreLiveHealthProbeInputRow>;
  sandboxOrderSchemaDryRunRows?: ReadonlyArray<ExecutionAdapterPreLiveSandboxOrderSchemaDryRunInputRow>;
  paperOrderLifecycleRows?: ReadonlyArray<ExecutionAdapterPreLivePaperOrderLifecycleInputRow>;
  paperRouteRunbookRows?: ReadonlyArray<ExecutionAdapterPreLivePaperRouteRunbookInputRow>;
  opsStateRows?: ReadonlyArray<ExecutionAdapterPreLiveOpsStateInputRow>;
  paperExecutionRows?: ReadonlyArray<ExecutionAdapterPreLivePaperExecutionInputRow>;
}

export interface ModuleNewsEvent {
  id: string;
  source: string;
  title: string;
  impact: "positive" | "warning" | "risk" | "ai";
  detail: string;
}

export interface WorkflowStageView {
  id: string;
  label: string;
  detail: string;
  status: WorkflowStageStatus;
  output: string;
  artifacts: WorkflowStageArtifact[];
}

export type AiWorkbenchAction = "debate" | "explain";

export interface ResearchRunSummary {
  runId: string;
  createdAt: string;
  market?: Market;
  symbol?: string;
  timeframe: Timeframe;
  strategyRevision: string;
  dataRows: number;
  executionMode: string;
  dataQuality?: ResearchRunDataQuality;
  dataSnapshot?: ResearchRunDataSnapshot;
  researchNote?: ResearchRunNote;
  strategyConfig?: ResearchRunStrategyConfig;
}

export interface ResearchRunNote {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  body: string;
  updatedAt: string | null;
}

export interface ResearchRunDataQuality {
  source: string;
  originSource?: string | null;
  isComplete: boolean;
  warnings: string[];
  rows: number;
  observedAt?: string | null;
  marketTime?: string | null;
  calendarId?: string | null;
  adjustmentMode?: string;
  freshness?: string;
  coverage?: ResearchRunDataCoverage;
  canonicalHash?: string;
  issues?: ResearchRunDataQualityIssue[];
}

export interface ResearchRunDataCoverage {
  actualRows: number;
  expectedRows: number;
  gapCount: number;
  ratio: number;
}

export interface ResearchRunDataQualityIssue {
  code: string;
  severity: "warning" | "blocked" | string;
  count: number;
  message: string;
}

export type ResearchContextMarketCalendarStatus = "open" | "closed" | "break" | "always_open" | "unknown";

export interface ResearchContextMarketCalendar {
  market: Market;
  timezone: string;
  status: ResearchContextMarketCalendarStatus;
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

export type ResearchContextReadinessStatus = "ready" | "review" | "blocked";

export interface ResearchContextReadinessCacheContext {
  rowCount: number;
  freshness: string;
  ageHours?: number | null;
  latestTimestamp?: string | null;
}

export interface ResearchContextReadinessNoteInput {
  source: string;
  body: string;
  savedBody?: string | null;
  updatedAt: string | null;
  error?: string | null;
}

export interface ResearchContextReadinessInput {
  workspace: TerminalWorkspace;
  barCount: number;
  dataQuality: ResearchRunDataQuality;
  activeWorkAreaId?: ProductWorkAreaId;
  watchlist?: {
    hasUnsavedChanges: boolean;
  } | null;
  marketCalendar?: ResearchContextMarketCalendar | null;
  cacheContext?: ResearchContextReadinessCacheContext | null;
  watchlistRefreshRuns?: WatchlistCacheRefreshRunSnapshot[] | null;
  note?: ResearchContextReadinessNoteInput | null;
}

export type ResearchContextReadinessAction =
  | "refresh-cache"
  | "refresh-watchlist-cache"
  | "save-note"
  | "save-watchlist"
  | "save-workspace";

export interface ResearchContextReadinessRow {
  id: "instrument" | "watchlist" | "calendar" | "klines" | "cache" | "refresh" | "note" | "workspace";
  label: string;
  value: string;
  detail: string;
  status: ResearchContextReadinessStatus;
  tone: "positive" | "warning" | "risk" | "neutral";
  action?: ResearchContextReadinessAction;
  evidenceRunId?: string;
}

export type MarketDataProviderHealthStatus = "ok" | "watch" | "cooldown" | "blocked";

export interface MarketDataProviderHealthSnapshot {
  status: MarketDataProviderHealthStatus;
  recentErrorCount: number;
  lastErrorAt: string | null;
  affectedSymbols: readonly string[];
  affectedContexts: readonly string[];
  retryAfterSeconds: number;
  reason: string;
}

export type MarketDataProviderHealthTrendWindowId = "oneHour" | "twentyFourHours" | "sevenDays";

export type MarketDataProviderHealthTrendMomentum =
  | "quiet"
  | "historical_only"
  | "easing"
  | "active_errors"
  | "recent_spike"
  | "cooldown_pressure";

export interface MarketDataProviderHealthTrendWindowSource {
  errorCount: number;
  latestErrorAt: string | null;
  dominantCategory?: string | null;
  categorySummary?: Record<string, number> | null;
}

export interface MarketDataProviderHealthTrendSource extends MarketDataProviderHealthSnapshot {
  dominantCategory?: string | null;
  windowSummary?: Record<MarketDataProviderHealthTrendWindowId, MarketDataProviderHealthTrendWindowSource> | null;
}

export interface MarketDataProviderHealthTrendRow {
  id: MarketDataProviderHealthTrendWindowId;
  label: string;
  shortLabel: string;
  errorCount: number;
  latestErrorAt: string | null;
  dominantCategory: string | null;
  intensity: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
  tone: "positive" | "warning" | "risk" | "neutral";
  detail: string;
  searchText: string;
}

export interface MarketDataProviderHealthTrendSummary {
  totalErrors: number;
  currentWindowErrors: number;
  peakWindowId: MarketDataProviderHealthTrendWindowId;
  peakErrorCount: number;
  latestErrorAt: string | null;
  dominantCategory: string | null;
  momentum: MarketDataProviderHealthTrendMomentum;
  tone: "positive" | "warning" | "risk" | "neutral";
  detail: string;
  searchText: string;
}

export const marketDataProviderHealthTrendWindows = [
  { id: "oneHour", label: "1 hour", shortLabel: "1h" },
  { id: "twentyFourHours", label: "24 hours", shortLabel: "24h" },
  { id: "sevenDays", label: "7 days", shortLabel: "7d" }
] as const satisfies readonly {
  id: MarketDataProviderHealthTrendWindowId;
  label: string;
  shortLabel: string;
}[];

export function buildMarketDataProviderHealthTrendRows(
  health: MarketDataProviderHealthTrendSource | null | undefined
): MarketDataProviderHealthTrendRow[] {
  const windows = marketDataProviderHealthTrendWindows.map((window) => {
    const source = health?.windowSummary?.[window.id];
    return {
      ...window,
      errorCount: Math.max(0, Math.trunc(source?.errorCount ?? 0)),
      latestErrorAt: source?.latestErrorAt ?? null,
      dominantCategory: source?.dominantCategory ?? null
    };
  });
  const maxErrors = Math.max(1, ...windows.map((window) => window.errorCount));
  return windows.map((window) => {
    const intensity = window.errorCount / maxErrors;
    const intensityLevel = providerHealthTrendIntensityLevel(window.errorCount, intensity);
    const tone = providerHealthTrendRowTone(intensityLevel);
    return {
      ...window,
      intensity,
      intensityLevel,
      tone,
      detail: `${window.shortLabel}: ${window.errorCount} provider error${window.errorCount === 1 ? "" : "s"}; primary ${
        window.dominantCategory ?? "none"
      }.`,
      searchText: [
        window.id,
        window.label,
        window.shortLabel,
        window.errorCount,
        window.latestErrorAt,
        window.dominantCategory,
        tone,
        health?.status,
        health?.reason,
        ...(health?.affectedSymbols ?? []),
        ...(health?.affectedContexts ?? [])
      ]
        .filter((value) => value !== null && value !== undefined && `${value}`.trim().length > 0)
        .join(" ")
        .toLowerCase()
    };
  });
}

export function buildMarketDataProviderHealthTrendSummary(
  health: MarketDataProviderHealthTrendSource | null | undefined
): MarketDataProviderHealthTrendSummary {
  const rows = buildMarketDataProviderHealthTrendRows(health);
  const totalErrors = rows.reduce((total, row) => total + row.errorCount, 0);
  const peak = rows.reduce((currentPeak, row) => (row.errorCount > currentPeak.errorCount ? row : currentPeak), rows[0]);
  const currentWindowErrors = rows.find((row) => row.id === "oneHour")?.errorCount ?? 0;
  const twentyFourHourErrors = rows.find((row) => row.id === "twentyFourHours")?.errorCount ?? 0;
  const sevenDayErrors = rows.find((row) => row.id === "sevenDays")?.errorCount ?? 0;
  const dominantCategory = health?.dominantCategory ?? peak.dominantCategory;
  const latestErrorAt =
    health?.lastErrorAt ??
    rows
      .map((row) => row.latestErrorAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ??
    null;
  const momentum = providerHealthTrendMomentum(
    health?.status ?? "ok",
    currentWindowErrors,
    twentyFourHourErrors,
    sevenDayErrors
  );
  const tone = providerHealthTrendSummaryTone(health?.status ?? "ok", totalErrors, peak.errorCount, momentum);
  const detail = providerHealthTrendSummaryDetail(
    momentum,
    currentWindowErrors,
    twentyFourHourErrors,
    sevenDayErrors,
    dominantCategory
  );
  return {
    totalErrors,
    currentWindowErrors,
    peakWindowId: peak.id,
    peakErrorCount: peak.errorCount,
    latestErrorAt,
    dominantCategory,
    momentum,
    tone,
    detail,
    searchText: [
      momentum,
      tone,
      detail,
      health?.status,
      health?.reason,
      health?.retryAfterSeconds,
      dominantCategory,
      latestErrorAt,
      ...(health?.affectedSymbols ?? []),
      ...(health?.affectedContexts ?? []),
      ...rows.map((row) => row.searchText)
    ]
      .filter((value) => value !== null && value !== undefined && `${value}`.trim().length > 0)
      .join(" ")
      .toLowerCase()
  };
}

export function providerHealthTrendIntensityLevel(errorCount: number, intensity: number): 0 | 1 | 2 | 3 | 4 {
  if (errorCount <= 0) {
    return 0;
  }
  return Math.min(4, Math.max(1, Math.ceil(intensity * 4))) as 1 | 2 | 3 | 4;
}

export function providerHealthTrendRowTone(
  intensityLevel: MarketDataProviderHealthTrendRow["intensityLevel"]
): MarketDataProviderHealthTrendRow["tone"] {
  if (intensityLevel === 0) {
    return "positive";
  }
  return intensityLevel >= 3 ? "risk" : "warning";
}

export function providerHealthTrendMomentum(
  status: MarketDataProviderHealthStatus,
  oneHourErrors: number,
  twentyFourHourErrors: number,
  sevenDayErrors: number
): MarketDataProviderHealthTrendMomentum {
  if (status === "cooldown" || status === "blocked") {
    return "cooldown_pressure";
  }
  if (oneHourErrors === 0 && twentyFourHourErrors === 0 && sevenDayErrors === 0) {
    return "quiet";
  }
  if (oneHourErrors === 0 && twentyFourHourErrors === 0 && sevenDayErrors > 0) {
    return "historical_only";
  }
  if (oneHourErrors === 0 && twentyFourHourErrors > 0) {
    return "easing";
  }
  if (oneHourErrors > 0 && oneHourErrors >= Math.max(2, Math.ceil(twentyFourHourErrors / 2))) {
    return "recent_spike";
  }
  return "active_errors";
}

export function providerHealthTrendSummaryTone(
  status: MarketDataProviderHealthStatus,
  totalErrors: number,
  peakErrorCount: number,
  momentum: MarketDataProviderHealthTrendMomentum
): MarketDataProviderHealthTrendSummary["tone"] {
  if (status === "blocked" || status === "cooldown" || peakErrorCount >= 3) {
    return "risk";
  }
  if (momentum === "quiet" || totalErrors === 0) {
    return "positive";
  }
  return "warning";
}

export function providerHealthTrendSummaryDetail(
  momentum: MarketDataProviderHealthTrendMomentum,
  oneHourErrors: number,
  twentyFourHourErrors: number,
  sevenDayErrors: number,
  dominantCategory: string | null
): string {
  const primary = dominantCategory ?? "none";
  if (momentum === "cooldown_pressure") {
    return `Provider cooldown pressure: ${oneHourErrors} errors in 1h, ${twentyFourHourErrors} in 24h, ${sevenDayErrors} in 7d; primary ${primary}.`;
  }
  if (momentum === "quiet") {
    return "Provider trend quiet: no errors in 1h, 24h, or 7d.";
  }
  if (momentum === "historical_only") {
    return `Provider trend historical only: 0 errors in 1h/24h, ${sevenDayErrors} in 7d; primary ${primary}.`;
  }
  if (momentum === "easing") {
    return `Provider trend easing: 0 errors in 1h, ${twentyFourHourErrors} in 24h, ${sevenDayErrors} in 7d; primary ${primary}.`;
  }
  if (momentum === "recent_spike") {
    return `Provider recent spike: ${oneHourErrors} errors in 1h, ${twentyFourHourErrors} in 24h, ${sevenDayErrors} in 7d; primary ${primary}.`;
  }
  return `Provider active errors: ${oneHourErrors} errors in 1h, ${twentyFourHourErrors} in 24h, ${sevenDayErrors} in 7d; primary ${primary}.`;
}

export interface MarketDataRefreshOverride {
  enabled: boolean;
  market: Market;
  reason: string;
  auditEventId?: string;
}

export interface MarketDataRefreshGuardAdapterSnapshot {
  market: Market;
  externalTelemetry?: {
    providerHealth?: MarketDataProviderHealthSnapshot | null;
  } | null;
}

export interface MarketDataRefreshGuard {
  blocked: boolean;
  status: MarketDataProviderHealthStatus;
  recentErrorCount: number;
  retryAfterSeconds: number;
  affectedSymbols: string[];
  affectedContexts: string[];
  reason: string;
  overrideApplied: boolean;
  overrideReason: string | null;
  detail: string;
}

export function buildMarketDataRefreshGuard(
  market: Market,
  adapters: readonly MarketDataRefreshGuardAdapterSnapshot[] | null | undefined,
  override?: MarketDataRefreshOverride | null
): MarketDataRefreshGuard {
  const health = adapters?.find((adapter) => adapter.market === market)?.externalTelemetry?.providerHealth;
  if (!health || health.status !== "cooldown") {
    return {
      blocked: false,
      status: health?.status ?? "ok",
      recentErrorCount: health?.recentErrorCount ?? 0,
      retryAfterSeconds: Math.max(0, Math.trunc(health?.retryAfterSeconds ?? 0)),
      affectedSymbols: health?.affectedSymbols.slice() ?? [],
      affectedContexts: health?.affectedContexts.slice() ?? [],
      reason: health?.reason ?? "provider_refresh_available",
      overrideApplied: false,
      overrideReason: null,
      detail: `Provider refresh available for ${market}.`
    };
  }

  const retryAfterSeconds = Math.max(0, Math.trunc(health.retryAfterSeconds));
  const affectedSymbols = health.affectedSymbols.slice();
  const affectedLabel = affectedSymbols.length ? affectedSymbols.slice(0, 3).join("/") : "none";
  const overrideReason = override?.enabled && override.market === market ? override.reason.trim() : "";
  if (overrideReason) {
    return {
      blocked: false,
      status: "cooldown",
      recentErrorCount: health.recentErrorCount,
      retryAfterSeconds,
      affectedSymbols,
      affectedContexts: health.affectedContexts.slice(),
      reason: "provider_cooldown_manual_override",
      overrideApplied: true,
      overrideReason,
      detail: `Provider cooldown override for ${market}: ${overrideReason}; original retry after ${retryAfterSeconds}s; affected ${affectedLabel}.`
    };
  }
  return {
    blocked: true,
    status: "cooldown",
    recentErrorCount: health.recentErrorCount,
    retryAfterSeconds,
    affectedSymbols,
    affectedContexts: health.affectedContexts.slice(),
    reason: health.reason,
    overrideApplied: false,
    overrideReason: null,
    detail: `Provider cooldown for ${market}: ${health.recentErrorCount} recent errors; retry after ${retryAfterSeconds}s; affected ${affectedLabel}.`
  };
}

export type Stage1P0DailyUseClosureRowId =
  | "clean-open"
  | "market-refresh-recovery"
  | "research-entry"
  | "daily-start"
  | "desktop-release";

export type Stage1P0DailyUseClosureStatus = "ready" | "review" | "blocked";

export type Stage1P0DailyUseClosureActionId =
  | "refresh-p0-acceptance"
  | "review-p1-acceptance"
  | "review-bootstrap-preflight"
  | "review-provider-cooldown"
  | ResearchContextReadinessAction
  | "open-research-entry"
  | "record-daily-start-review"
  | "open-daily-start"
  | "run-desktop-build";

export interface Stage1P0DailyUseClosureRow {
  id: Stage1P0DailyUseClosureRowId;
  label: string;
  value: string;
  detail: string;
  status: Stage1P0DailyUseClosureStatus;
  tone: "positive" | "warning" | "risk";
  actionId: Stage1P0DailyUseClosureActionId;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  workspaceLink: string;
}

export type Stage1P0DailyUseClosureRowDraft = Omit<Stage1P0DailyUseClosureRow, "workspaceLink">;

export interface Stage1P0DailyUseClosure {
  state: Stage1P0DailyUseClosureStatus;
  tone: "positive" | "warning" | "risk";
  headline: string;
  detail: string;
  copyText: string;
  readyCount: number;
  totalCount: number;
  primaryActionId: Stage1P0DailyUseClosureActionId;
  primaryActionLabel: string;
  primaryTargetWorkspaceId: ProductWorkAreaId;
  primaryWorkspaceLink: string;
  bootstrapPreflightChecks?: Stage1BootstrapPreflightSummaryCheckSource[];
  bootstrapPreflightSourcePaths?: Stage1BootstrapPreflightSummarySource["sourcePaths"];
  bootstrapPreflightStaleSourcePaths: string[];
  bootstrapPreflightStaleSourceSummary: string | null;
  staleSourcePaths: string[];
  staleSourceSummary: string | null;
  rows: Stage1P0DailyUseClosureRow[];
}

export interface Stage1P0DailyUseClosureInput {
  bootstrapPreflight?: Stage1BootstrapPreflightSummary | null;
  dailyStartBrief: DailyStartBrief;
  dailyUseReport?: Stage1DailyUseSummary | null;
  desktopBuildReady?: boolean;
  desktopRelease?: DesktopReleaseSummary | null;
  marketRefreshGuard: MarketDataRefreshGuard;
  p0Acceptance: P0AcceptanceSummary;
  p1Acceptance: P1AcceptanceSummary;
  researchReadinessRows: readonly ResearchContextReadinessRow[];
}

export type Stage1P0DailyUseRefreshOutcomeState = "ready" | "review" | "blocked";

export type Stage1P0DailyUseRefreshOutcomeSource = "core" | "fallback";

export interface Stage1P0DailyUseRefreshOutcomeEntry {
  id: "daily-use" | "bootstrap-preflight" | "desktop-release";
  label: string;
  status: Stage1P0DailyUseRefreshOutcomeState;
  tone: "positive" | "warning" | "risk";
  source: Stage1P0DailyUseRefreshOutcomeSource;
  sourceLabel: string;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  workspaceLink: string;
}

export interface Stage1P0DailyUseRefreshOutcome {
  state: Stage1P0DailyUseRefreshOutcomeState;
  tone: "positive" | "warning" | "risk";
  headline: string;
  detail: string;
  readyCount: number;
  totalCount: number;
  actionLabel: string;
  copyText: string;
  targetWorkspaceId: ProductWorkAreaId;
  targetWorkspaceLink: string;
  entries: Stage1P0DailyUseRefreshOutcomeEntry[];
}

export interface Stage1P0DailyUseRefreshOutcomeInput {
  bootstrapPreflight: Stage1BootstrapPreflightSummary | null;
  bootstrapPreflightError?: string | null;
  bootstrapPreflightSource: Stage1P0DailyUseRefreshOutcomeSource;
  dailyUseError?: string | null;
  dailyUseReport: Stage1DailyUseSummary | null;
  dailyUseSource: Stage1P0DailyUseRefreshOutcomeSource;
  desktopRelease: DesktopReleaseSummary | null;
  desktopReleaseError?: string | null;
  desktopReleaseSource: Stage1P0DailyUseRefreshOutcomeSource;
}

export type Stage1P0DailyUseShareFocus = "primary" | Stage1P0DailyUseClosureRowId;

export type Stage1P0DailyUseRefreshReceiptFocus = "next" | Stage1P0DailyUseRefreshOutcomeEntry["id"];

export interface Stage1P0DailyUseShareDeepLinkState {
  kind: "daily-use" | "refresh-receipt";
  focus: Stage1P0DailyUseShareFocus | Stage1P0DailyUseRefreshReceiptFocus;
  targetWorkspaceId: ProductWorkAreaId;
}

export type Stage1P0DailyUseShareDeepLinkIssueReason =
  | "missing-workspace"
  | "duplicate-workspace"
  | "ambiguous-focus"
  | "invalid-workspace"
  | "invalid-daily-focus"
  | "invalid-refresh-focus";

export type Stage1P0DailyUseShareDeepLinkStatus =
  | { reason: null; state: null; status: "none" }
  | { reason: null; state: Stage1P0DailyUseShareDeepLinkState; status: "ready" }
  | { reason: Stage1P0DailyUseShareDeepLinkIssueReason; state: null; status: "invalid" };

export function buildStage1P0InvalidShareDiagnosticsCopyText({
  incomingSearch,
  primaryActionLabel,
  primaryTargetWorkspaceId,
  replacementLink,
  status
}: {
  incomingSearch: string | null | undefined;
  primaryActionLabel: string;
  primaryTargetWorkspaceId: ProductWorkAreaId;
  replacementLink: string | null | undefined;
  status: Stage1P0DailyUseShareDeepLinkStatus;
}): string {
  const normalizedIncomingSearch = incomingSearch?.trim() || "none";
  const normalizedReplacementLink = replacementLink?.trim() || "none";
  const reason = status.status === "invalid" ? status.reason : "none";
  return [
    "# Stage 1/P0 Invalid Share Link Diagnostics",
    `Status: ${status.status}`,
    `Reason: ${reason}`,
    `Incoming search: ${normalizedIncomingSearch}`,
    `Replacement link: ${normalizedReplacementLink}`,
    `Safe action: ${primaryActionLabel} -> ${primaryTargetWorkspaceId}`,
    "",
    "No workspace was restored from the invalid link.",
    "Copy/open the replacement link manually after reviewing the daily-use card.",
    "Live trading remains blocked."
  ].join("\n");
}
