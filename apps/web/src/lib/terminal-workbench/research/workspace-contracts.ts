import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { MarketDataRefreshGuard, ResearchContextMarketCalendar, ResearchContextReadinessAction, ResearchContextReadinessRow, ResearchContextReadinessStatus, ResearchRunDataCoverage, ResearchRunDataQuality, ResearchRunDataQualityIssue, Stage1P0DailyUseClosureActionId, Stage1P0DailyUseClosureRow, Stage1P0DailyUseClosureRowDraft, Stage1P0DailyUseClosureStatus } from "../stage1/archive-contracts";
import type { DesktopReleaseSummary, Market, P0AcceptanceSummary, P1AcceptanceSummary, ProductWorkAreaId, Stage1BootstrapPreflightSummary, Stage1DailyUseSummary, Timeframe } from "../stage1/foundation-contracts";
import type { BacktestAssumptions, DailyStartBrief, Instrument } from "../stage1/review-contracts";

export function buildDailyUseReportBackedRow(
  dailyUseReport: Stage1DailyUseSummary | null,
  rowId: "market-refresh-recovery" | "research-entry" | "daily-start",
  fallback: () => Stage1P0DailyUseClosureRowDraft,
  config: {
    label: string;
    readyActionId: Stage1P0DailyUseClosureActionId;
    reviewActionId: Stage1P0DailyUseClosureActionId;
    blockedActionId: Stage1P0DailyUseClosureActionId;
    readyActionLabel: string;
    reviewActionLabel: string;
    blockedActionLabel: string;
    targetWorkspaceId: ProductWorkAreaId;
  }
): Stage1P0DailyUseClosureRowDraft {
  const reportRow = dailyUseReport?.rows.find((row) => row.id === rowId);
  if (!dailyUseReport || !reportRow || dailyUseReport.state === "missing" || dailyUseReport.state === "invalid") {
    return fallback();
  }
  const status = reportRow.status;
  return {
    id: rowId,
    label: config.label,
    value: reportRow.value,
    detail: dailyUseReport.generatedAt
      ? `${reportRow.summary} Report generated ${dailyUseReport.generatedAt}.`
      : reportRow.summary,
    status,
    tone: dailyUseClosureTone(status),
    actionId:
      status === "ready" ? config.readyActionId : status === "review" ? config.reviewActionId : config.blockedActionId,
    actionLabel:
      status === "ready"
        ? config.readyActionLabel
        : status === "review"
          ? config.reviewActionLabel
          : config.blockedActionLabel,
    targetWorkspaceId: config.targetWorkspaceId
  };
}

export function buildDailyUseCleanOpenRow(
  p0Acceptance: P0AcceptanceSummary,
  p1Acceptance: P1AcceptanceSummary,
  dailyUseReport: Stage1DailyUseSummary | null,
  bootstrapPreflight: Stage1BootstrapPreflightSummary | null
): Stage1P0DailyUseClosureRowDraft {
  if (bootstrapPreflight && bootstrapPreflight.state !== "ready") {
    const status = stage1BootstrapPreflightClosureStatus(bootstrapPreflight);
    return {
      id: "clean-open",
      label: "Clean environment open",
      value: bootstrapPreflight.nextAction,
      detail: `${bootstrapPreflight.headline}. ${bootstrapPreflight.detail}`,
      status,
      tone: dailyUseClosureTone(status),
      actionId: "review-bootstrap-preflight",
      actionLabel: bootstrapPreflight.actionLabel,
      targetWorkspaceId: bootstrapPreflight.targetWorkspaceId
    };
  }
  const reportRow = dailyUseReport?.rows.find((row) => row.id === "clean-open");
  if (dailyUseReport && reportRow && dailyUseReport.state !== "missing" && dailyUseReport.state !== "invalid") {
    const status = reportRow.status;
    return {
      id: "clean-open",
      label: "Clean environment open",
      value: reportRow.value,
      detail: dailyUseReport.generatedAt
        ? `${reportRow.summary} Report generated ${dailyUseReport.generatedAt}.`
        : reportRow.summary,
      status,
      tone: dailyUseClosureTone(status),
      actionId: status === "blocked" ? "refresh-p0-acceptance" : status === "review" ? "review-p1-acceptance" : "open-research-entry",
      actionLabel: status === "blocked" ? "Refresh P0 acceptance" : status === "review" ? "Review P1 acceptance" : "Open research",
      targetWorkspaceId: status === "ready" ? "research" : "audit"
    };
  }
  const status: Stage1P0DailyUseClosureStatus =
    p0Acceptance.state !== "passed" ? "blocked" : p1Acceptance.state !== "passed" ? "review" : "ready";
  const actionId: Stage1P0DailyUseClosureActionId =
    p0Acceptance.state !== "passed" ? "refresh-p0-acceptance" : p1Acceptance.state !== "passed" ? "review-p1-acceptance" : "open-research-entry";
  return {
    id: "clean-open",
    label: "Clean environment open",
    value:
      status === "ready"
        ? "P0/P1 acceptance ready"
        : p0Acceptance.state !== "passed"
          ? "P0 acceptance missing"
          : "P1 acceptance needs review",
    detail:
      status === "ready"
        ? "Clean local or Docker environment has recorded P0 and P1 acceptance evidence."
        : p0Acceptance.detail || p1Acceptance.detail,
    status,
    tone: dailyUseClosureTone(status),
    actionId,
    actionLabel: p0Acceptance.state !== "passed" ? "Refresh P0 acceptance" : p1Acceptance.state !== "passed" ? "Review P1 acceptance" : "Open research",
    targetWorkspaceId: p0Acceptance.state !== "passed" || p1Acceptance.state !== "passed" ? "audit" : "research"
  };
}

export function stage1BootstrapPreflightClosureStatus(
  bootstrapPreflight: Stage1BootstrapPreflightSummary
): Stage1P0DailyUseClosureStatus {
  if (bootstrapPreflight.state === "ready") {
    return "ready";
  }
  if (bootstrapPreflight.state === "review") {
    return "review";
  }
  return "blocked";
}

export function buildDailyUseMarketRefreshRecoveryRow(
  guard: MarketDataRefreshGuard
): Stage1P0DailyUseClosureRowDraft {
  const status: Stage1P0DailyUseClosureStatus = guard.blocked ? "blocked" : guard.overrideApplied || guard.recentErrorCount > 0 ? "review" : "ready";
  return {
    id: "market-refresh-recovery",
    label: "Market refresh recovery",
    value: guard.blocked ? "provider cooldown" : guard.overrideApplied ? "override recorded" : "refresh available",
    detail: guard.detail,
    status,
    tone: dailyUseClosureTone(status),
    actionId: guard.blocked ? "review-provider-cooldown" : "refresh-cache",
    actionLabel: guard.blocked ? "Review cooldown" : "Refresh cache",
    targetWorkspaceId: "market"
  };
}

export function buildDailyUseResearchEntryRow(
  issue: ResearchContextReadinessRow | null
): Stage1P0DailyUseClosureRowDraft {
  const status: Stage1P0DailyUseClosureStatus =
    issue?.status === "blocked" ? "blocked" : issue?.status === "review" ? "review" : "ready";
  return {
    id: "research-entry",
    label: "Research entry",
    value: issue ? issue.value : "ready",
    detail: issue ? issue.detail : "Current symbol, timeframe, cache, calendar, notes, and workspace context are ready.",
    status,
    tone: dailyUseClosureTone(status),
    actionId: issue?.action ?? "open-research-entry",
    actionLabel: issue?.action ? stage1P0DailyUseResearchActionLabel(issue.action) : "Open research",
    targetWorkspaceId: "research"
  };
}

export function stage1P0DailyUseResearchActionLabel(action: ResearchContextReadinessAction): string {
  if (action === "refresh-cache") {
    return "Refresh cache";
  }
  if (action === "refresh-watchlist-cache") {
    return "Refresh watchlist";
  }
  if (action === "save-workspace") {
    return "Save workspace";
  }
  if (action === "save-watchlist") {
    return "Save watchlist";
  }
  return "Save note";
}

export function buildDailyUseDailyStartRow(brief: DailyStartBrief): Stage1P0DailyUseClosureRowDraft {
  const status: Stage1P0DailyUseClosureStatus =
    brief.state === "blocked" ? "blocked" : brief.state === "attention" ? "review" : "ready";
  const needsReview = brief.localReviewStatus !== "current";
  return {
    id: "daily-start",
    label: "Daily start path",
    value: brief.headline,
    detail: brief.detail,
    status,
    tone: dailyUseClosureTone(status),
    actionId: needsReview ? "record-daily-start-review" : "open-daily-start",
    actionLabel: needsReview ? brief.localReviewActionLabel : brief.primaryActionLabel,
    targetWorkspaceId: needsReview ? brief.localReviewWorkspaceId : brief.primaryActionWorkspaceId
  };
}

export function buildDailyUseDesktopReleaseRow(
  desktopRelease: DesktopReleaseSummary | null | undefined,
  desktopBuildReady: boolean,
  dailyUseReport: Stage1DailyUseSummary | null
): Stage1P0DailyUseClosureRowDraft {
  const reportRow = dailyUseReport?.rows.find((row) => row.id === "desktop-release");
  if (dailyUseReport && reportRow && dailyUseReport.state !== "missing" && dailyUseReport.state !== "invalid") {
    const status = reportRow.status;
    return {
      id: "desktop-release",
      label: "Desktop release",
      value: reportRow.value,
      detail: dailyUseReport.generatedAt
        ? `${reportRow.summary} Report generated ${dailyUseReport.generatedAt}.`
        : reportRow.summary,
      status,
      tone: dailyUseClosureTone(status),
      actionId: "run-desktop-build",
      actionLabel: status === "ready" ? "Validate daily report" : "Review desktop build",
      targetWorkspaceId: "settings"
    };
  }
  if (desktopRelease) {
    const status: Stage1P0DailyUseClosureStatus =
      desktopRelease.state === "passed" ? "ready" : desktopRelease.state === "invalid" ? "blocked" : "review";
    return {
      id: "desktop-release",
      label: "Desktop release",
      value:
        desktopRelease.state === "passed"
          ? `${desktopRelease.platform || "local"} desktop release ready`
          : desktopRelease.state === "invalid"
            ? "desktop release manifest invalid"
            : "desktop release manifest missing",
      detail: desktopRelease.sourceSummary || desktopRelease.detail,
      status,
      tone: dailyUseClosureTone(status),
      actionId: "run-desktop-build",
      actionLabel: desktopRelease.actionLabel,
      targetWorkspaceId: desktopRelease.targetWorkspaceId
    };
  }

  const status: Stage1P0DailyUseClosureStatus = desktopBuildReady ? "ready" : "review";
  return {
    id: "desktop-release",
    label: "Desktop release",
    value: desktopBuildReady ? "desktop build ready" : "desktop build checklist pending",
    detail: desktopBuildReady
      ? "Desktop package has a recorded local build check for the current release."
      : "Run npm run desktop:build after the local Tauri/Cargo toolchain check passes.",
    status,
    tone: dailyUseClosureTone(status),
    actionId: "run-desktop-build",
    actionLabel: "Review desktop build",
    targetWorkspaceId: "settings"
  };
}

export function dailyUseClosureHeadline(primaryRow: Stage1P0DailyUseClosureRow): string {
  if (primaryRow.actionId === "review-bootstrap-preflight") {
    return primaryRow.status === "review"
      ? "Stage 1 bootstrap preflight needs review"
      : "Stage 1 bootstrap preflight is blocked";
  }
  if (primaryRow.id === "clean-open") {
    return primaryRow.status === "ready" ? "Clean environment is ready" : "Clean environment acceptance is missing";
  }
  if (primaryRow.id === "market-refresh-recovery") {
    return primaryRow.status === "ready" ? "Market refresh is ready" : "Market refresh recovery needs attention";
  }
  if (primaryRow.id === "research-entry") {
    return primaryRow.status === "ready" ? "Research entry is ready" : "Research entry needs preparation";
  }
  if (primaryRow.id === "daily-start") {
    return primaryRow.status === "ready" ? "Daily start path is ready" : "Daily start path needs review";
  }
  return primaryRow.status === "ready" ? "Desktop release is ready" : "Desktop release checklist needs review";
}

export function dailyUseClosureTone(status: Stage1P0DailyUseClosureStatus): "positive" | "warning" | "risk" {
  return status === "ready" ? "positive" : status === "blocked" ? "risk" : "warning";
}

export interface ResearchContextEvidenceRow {
  id: "audit-run";
  label: string;
  value: string;
  detail: string;
  status: ResearchContextReadinessStatus;
  tone: "positive" | "warning" | "risk";
}

export interface WatchlistCacheRefreshRunSnapshot {
  runId: string;
  createdAt: string;
  timeframe: Timeframe;
  requestedLimit: number;
  overrideAuditEventId?: string | null;
  summary: {
    totalSymbols: number;
    refreshed: number;
    skipped: number;
    failed: number;
    upsertedRows: number;
  };
  items: WatchlistCacheRefreshItemSnapshot[];
}

export interface WatchlistCacheRefreshItemSnapshot {
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  requestedLimit: number;
  upsertedRows: number;
  status: "refreshed" | "skipped" | "failed";
  quality: {
    source: string;
    isComplete: boolean;
    warnings: string[];
    rows: number;
  };
  error: string | null;
}

export interface WatchlistCacheRefreshHistoryRow {
  id: string;
  runId: string;
  createdAt: string;
  timeframe: Timeframe;
  label: string;
  total: number;
  refreshed: number;
  skipped: number;
  failed: number;
  upsertedRows: number;
  value: string;
  detail: string;
  selected: boolean;
  tone: "positive" | "warning" | "risk" | "neutral";
}

export interface WatchlistCacheRefreshItemRow {
  id: string;
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  instrument: Instrument;
  status: WatchlistCacheRefreshItemSnapshot["status"];
  statusLabel: string;
  source: string;
  rows: number;
  upsertedRows: number;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "risk";
}

export interface WatchlistCacheRefreshCoverageRow {
  id: string;
  runId: string;
  label: string;
  value: string;
  detail: string;
  status: ResearchContextReadinessStatus;
  tone: "positive" | "warning" | "risk";
  canOpenResearch: boolean;
}

export interface ResearchPipelinePreflightIssue {
  id: ResearchContextReadinessRow["id"];
  label: string;
  value: string;
  detail: string;
  status: Exclude<ResearchContextReadinessStatus, "ready">;
  action?: ResearchContextReadinessAction;
}

export interface ResearchPipelineLockedPreparationEvidence {
  runId: string;
  label: string;
  value: string;
  detail: string;
}

export interface ResearchPipelinePreflight {
  status: ResearchContextReadinessStatus;
  canRun: boolean;
  requiresConfirmation: boolean;
  summary: string;
  primaryAction?: ResearchContextReadinessAction;
  issues: ResearchPipelinePreflightIssue[];
  lockedPreparationEvidence: ResearchPipelineLockedPreparationEvidence | null;
}

export interface ResearchContextReadinessReportInput {
  workspace: Pick<TerminalWorkspace, "selectedInstrument" | "selectedTimeframe">;
  rows: readonly ResearchContextReadinessRow[];
  evidenceRows?: readonly ResearchContextEvidenceRow[];
  preflight?: ResearchPipelinePreflight | null;
  generatedAt?: string | null;
  contextLink?: string | null;
}

export interface ResearchContextReadinessReportFileNameInput {
  workspace: Pick<TerminalWorkspace, "selectedInstrument" | "selectedTimeframe">;
  generatedAt?: string | null;
}

export interface ResearchContextReadinessReportArchive {
  fileName: string;
  contentMarkdown: string;
  contentSha256: {
    algorithm: "sha256";
    hash: string;
  };
  generatedAt: string;
  context: {
    market: Market;
    symbol: string;
    timeframe: Timeframe;
  };
  preflightStatus: ResearchContextReadinessStatus;
  nextAction: ResearchContextReadinessAction | "none";
  lockedPreparationEvidenceRunId: string | null;
  readinessCounts: {
    ready: number;
    review: number;
    blocked: number;
  };
  contextLink: string | null;
}

export interface ResearchPipelinePreparationEvidenceSelection {
  preflight: ResearchPipelinePreflight;
  selectedCoverageRunId?: string | null;
}

export interface ResearchRunDataSnapshotBar {
  timestamp: string;
  timestampMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ResearchRunDataPreparationEvidence {
  kind: "watchlist_cache_refresh";
  runId: string;
  createdAt: string | null;
  overrideAuditEventId?: string | null;
  market: Market;
  symbol: string;
  name: string;
  timeframe: Timeframe;
  status: "refreshed" | "skipped" | "failed" | string;
  requestedLimit: number;
  upsertedRows: number;
  quality: ResearchRunDataQuality;
  error: string | null;
}

export interface ResearchRunMarketAiSelectionEvidence {
  selectionId: string;
  auditEventId: string;
  candidateEvidenceId: string;
  selectionRecordHash: string;
  candidateEvidenceHash: string;
  marketSnapshotHash: string;
  market: Market;
  symbol: string;
  timeframe: "1d";
  profile: "balanced" | "quality_growth" | "value" | "trend";
  horizon: "short" | "medium" | "long";
  horizonBars: number;
  rank: number;
  tier: "priority_research" | "watch" | "insufficient_evidence";
  referenceAt: string;
  referencePrice: number;
  generatedAt: string;
  researchOnly: true;
  recordHash: string;
}

export interface ResearchRunDataSnapshot {
  hashVersion?: "aiqt-data-v2";
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
  start: string | null;
  end: string | null;
  hash: string;
  snapshotHash?: string;
  bars: ResearchRunDataSnapshotBar[];
  observedAt?: string | null;
  marketTime?: string | null;
  calendarId?: string | null;
  adjustmentMode?: string;
  freshness?: string;
  coverage?: ResearchRunDataCoverage;
  qualityIssues?: ResearchRunDataQualityIssue[];
  offlineReplay?: {
    status: "verified";
    mode: "embedded_snapshot";
    rows: number;
    canonicalHash: string;
    networkRequired: false;
  };
  sourceComparison?: ResearchRunSourceComparison;
  preparationEvidence?: ResearchRunDataPreparationEvidence;
  marketAiSelectionEvidence?: ResearchRunMarketAiSelectionEvidence;
  marketCalendar?: ResearchContextMarketCalendar;
}

export interface ResearchRunSourceComparison {
  schemaVersion: 1;
  status: "agreement" | "warning" | "blocked" | "unavailable";
  primarySource: string;
  secondarySource: string;
  primaryRows: number;
  secondaryRows: number;
  overlapRows: number;
  overlapRatio: number;
  fields: Record<
    string,
    {
      classification: "agreement" | "warning" | "blocked";
      maxRelativeDifference: number;
      warningThreshold: number;
      blockedThreshold: number;
    }
  >;
  differences: Array<{
    timestamp: string;
    field: string;
    relativeDifference: number;
    classification: "warning" | "blocked";
  }>;
  valuesMerged: false;
  reason: string | null;
  reportHash: string;
}

export interface ResearchRunStrategyCondition {
  kind: string;
  params: Record<string, string | number | boolean | null>;
}

export interface ResearchRunStrategyRisk {
  positionPct: number | null;
  stopLossPct: number | null;
  takeProfitPct: number | null;
  maxDrawdownPct: number | null;
}

export interface ResearchRunStrategyConfig {
  name: string;
  revision: string;
  market: Market;
  symbols: string[];
  timeframe: Timeframe;
  version: number;
  entryConditions: ResearchRunStrategyCondition[];
  exitConditions: ResearchRunStrategyCondition[];
  risk: ResearchRunStrategyRisk;
}

export type StrategyExperimentStatus = "completed" | "failed";

export type StrategyExperimentErrorCode =
  | "invalid_strategy_experiment"
  | "strategy_not_found"
  | "research_run_not_found"
  | "strategy_experiment_not_found"
  | "source_snapshot_reaudit_required"
  | "strategy_experiment_conflict"
  | "test_holdout_consumed"
  | "strategy_experiment_failed";

export interface StrategyExperimentMetricSet {
  totalReturnPct: number;
  annualReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  tradeCount: number;
}

export interface StrategyExperimentDimension {
  conditionSide: "entry" | "exit";
  conditionIndex: number;
  parameter: "window" | "threshold";
  values: number[];
}

export interface StrategyExperimentParameterPatch {
  conditionSide: "entry" | "exit";
  conditionIndex: number;
  parameter: "window" | "threshold";
  value: number;
}

export interface StrategyExperimentGuardrails {
  minimumTradeCount: number;
  maximumDrawdownPct: number | null;
}

export interface StrategyExperimentWalkForward {
  trainBars: number;
  validationBars: number;
  stepBars: number;
}

export const DEFAULT_STRATEGY_EXPERIMENT_WALK_FORWARD: StrategyExperimentWalkForward = {
  trainBars: 80,
  validationBars: 20,
  stepBars: 60,
};

export interface StrategyExperimentWalkForwardWindow {
  index: number;
  trainStartIndex: number;
  trainEndIndex: number;
  validationStartIndex: number;
  validationEndIndex: number;
  trainMetrics: StrategyExperimentMetricSet;
  validationMetrics: StrategyExperimentMetricSet;
}

export interface StrategyExperimentWalkForwardEvidence {
  windows: StrategyExperimentWalkForwardWindow[];
  validationWindowCount: number;
  positiveReturnCount: number;
  medianReturnPct: number | null;
  worstDrawdownPct: number | null;
}

export interface StrategyExperimentDefinition {
  baseStrategy: ResearchRunStrategyConfig;
  strategyRevision: string;
  sourceRunId: string;
  snapshotId: string;
  canonicalDataHash: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  assumptions: BacktestAssumptions;
  split: {
    trainPct: 60;
    validationPct: 20;
    testPct: 20;
  };
  dimensions: StrategyExperimentDimension[];
  guardrails: StrategyExperimentGuardrails;
  walkForward: StrategyExperimentWalkForward | null;
  evaluationBudget: number;
  engineVersion: "backtest-v1";
  resultSchemaVersion: 1;
}

export interface StrategyExperimentCandidate {
  candidateId: string;
  candidateRevision: string;
  parameters: StrategyExperimentParameterPatch[];
  trainMetrics: StrategyExperimentMetricSet;
  validationMetrics: StrategyExperimentMetricSet;
  testMetrics: StrategyExperimentMetricSet | null;
  walkForward: StrategyExperimentWalkForwardEvidence;
  eligible: boolean;
  rank: number | null;
}

export interface StrategyExperimentListItem {
  experimentId: string;
  createdAt: string;
  status: StrategyExperimentStatus;
  definitionHash: string;
  holdoutKey: string;
  strategyLineageKey: string;
  strategyRevision: string;
  sourceRunId: string;
  snapshotId: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  definition: StrategyExperimentDefinition;
  evaluationCount: number;
  selectedCandidateId: string | null;
  completionReason: "selected" | "no_eligible_candidate" | null;
  resultHash: string | null;
  errorCode: string | null;
  errorDetail: string | null;
}

export interface AiReviewStage3ContextKeyInput {
  workspaceId: string;
  researchWorkspaceId: string | null;
  market: string;
  symbol: string;
  timeframe: string;
  sourceRunId: string | null;
  strategyRevision: string | null;
}

export function buildAiReviewStage3ContextKey(input: AiReviewStage3ContextKeyInput): string {
  return [
    input.workspaceId,
    input.researchWorkspaceId ?? "none",
    input.market,
    input.symbol,
    input.timeframe,
    input.sourceRunId ?? "none",
    input.strategyRevision ?? "none"
  ].map((value) => value.trim()).join(":");
}

export function buildAiReviewStage3CandidateKey(
  activeExperimentId: string | null,
  experiments: readonly Pick<StrategyExperimentListItem, "experimentId" | "status" | "resultHash">[]
): string {
  const evidence = experiments
    .map((experiment) => `${experiment.experimentId}:${experiment.status}:${experiment.resultHash ?? "none"}`)
    .sort()
    .join("|");
  return `${activeExperimentId ?? "none"}::${evidence}`;
}

export function resolveAiReviewDraftExperiment(
  experimentId: string | null,
  experiments: readonly StrategyExperimentListItem[],
  dimensions: readonly StrategyExperimentDimension[],
  guardrails: StrategyExperimentGuardrails,
  walkForward: StrategyExperimentWalkForward | null
): StrategyExperimentListItem | null {
  const experiment = experiments.find((candidate) => (
    candidate.experimentId === experimentId && candidate.status === "completed"
  ));
  if (!experiment) return null;
  return JSON.stringify([
    experiment.definition.dimensions,
    experiment.definition.guardrails,
    experiment.definition.walkForward
  ]) === JSON.stringify([dimensions, guardrails, walkForward]) ? experiment : null;
}

export interface StrategyExperimentSnapshot {
  snapshotId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  canonicalDataHash: string;
  rows: number;
  startAt: string;
  endAt: string;
  bars: ResearchRunDataSnapshotBar[];
  testDefinitionHash: string | null;
  testOwnerExperimentId: string | null;
  testConsumedAt: string | null;
}

export type StrategyExperimentHoldoutStatus = "unconsumed" | "consumed" | "consumed_by_other_definition";

export interface StrategyExperimentDetail extends StrategyExperimentListItem {
  holdoutStatus: StrategyExperimentHoldoutStatus;
  snapshot: StrategyExperimentSnapshot;
  candidates: StrategyExperimentCandidate[];
}
