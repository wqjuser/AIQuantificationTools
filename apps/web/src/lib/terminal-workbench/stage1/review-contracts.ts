import type { AuditEvidenceReportLedgerSummary } from "../audit/deep-link-queries";
import type { RiskApprovalSummary } from "../audit/execution-contracts";
import type { AuditEvidenceReportLedgerRow } from "../audit/report-contracts";
import type { ResearchRunContextBinding } from "../core/workspace-contracts";
import type { PreLiveReadinessChecklist } from "../execution/ops-contracts";
import type { Stage1P0DailyUseClosure, Stage1P0DailyUseRefreshOutcome } from "./archive-contracts";
import type { Market, P0AcceptanceSummary, P0PlatformBacklogItem, P0PlatformReadinessSource, P0PlatformReadinessSummary, P1AcceptanceSummary, P2ManifestChainPreflightSummary, P2PaperReplaySummary, P2PreLiveAcceptanceSummary, P2ReadinessAcceptanceRowStatus, P2ReadinessAcceptanceStatus, P2ReadinessAcceptanceTone, P2ReadinessEvidenceCoverage, PanelId, ProductWorkAreaId, Timeframe } from "./foundation-contracts";

export type P2ReadinessAcceptanceRowId =
  | "p1-acceptance"
  | "paper-execution-replay"
  | "pre-live-checklist"
  | "p2-pre-live-manifest"
  | "readiness-evidence-coverage"
  | "live-blocked-boundary";

export interface P2ReadinessAcceptanceRow {
  id: P2ReadinessAcceptanceRowId;
  label: string;
  status: P2ReadinessAcceptanceRowStatus;
  tone: P2ReadinessAcceptanceTone;
  evidence: string;
  detail: string;
  sourceId: string | null;
}

export interface P2ReadinessAcceptanceSummary {
  status: P2ReadinessAcceptanceStatus;
  tone: P2ReadinessAcceptanceTone;
  headline: string;
  detail: string;
  evidenceCoverageReviewAuditEventId?: string;
  acceptedCount: number;
  totalCount: number;
  blockingCount: number;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  liveOrderSubmitted: false;
  routeExecuted: false;
  rows: P2ReadinessAcceptanceRow[];
}

export interface P2ReadinessAcceptanceSummaryInput {
  evidenceCoverage: P2ReadinessEvidenceCoverage;
  evidenceCoverageReviewAuditEventId?: string | null;
  p1Acceptance: P1AcceptanceSummary;
  p2PaperReplay: P2PaperReplaySummary;
  p2PreLiveAcceptance: P2PreLiveAcceptanceSummary;
  preLiveChecklist: PreLiveReadinessChecklist;
}

export type PersonalTeamUsabilityReadinessState = "ready" | "attention" | "blocked";

export type PersonalTeamUsabilityReadinessTone = "positive" | "warning" | "risk";

export type PersonalTeamUsabilityReadinessItemStatus = "ready" | "review" | "blocked";

export type PersonalTeamUsabilityReadinessItemId =
  | "p0-local-loop"
  | "p1-research-ops"
  | "p2-prelive-chain"
  | "audit-traceability"
  | "team-handoff-runbook"
  | "backup-restore-drill";

export interface PersonalTeamUsabilityReadinessItem {
  id: PersonalTeamUsabilityReadinessItemId;
  label: string;
  status: PersonalTeamUsabilityReadinessItemStatus;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
}

export interface PersonalTeamUsabilityReadinessSummary {
  state: PersonalTeamUsabilityReadinessState;
  tone: PersonalTeamUsabilityReadinessTone;
  headline: string;
  detail: string;
  personalPercent: number;
  teamPercent: number;
  readyCount: number;
  totalCount: number;
  items: PersonalTeamUsabilityReadinessItem[];
  openItems: PersonalTeamUsabilityReadinessItem[];
  nextActionLabel: string;
  nextActionWorkspaceId: ProductWorkAreaId;
  liveBoundaryLabel: string;
}

export interface PersonalTeamUsabilityReadinessSummaryInput {
  auditEvidenceReportLedgerSummary: AuditEvidenceReportLedgerSummary;
  handoffNoteCount?: number;
  p0AcceptanceSummary: P0AcceptanceSummary;
  p0PlatformReadinessSummary: P0PlatformReadinessSummary;
  p1AcceptanceSummary: P1AcceptanceSummary;
  p2ManifestChainPreflightSummary: P2ManifestChainPreflightSummary;
  p2ReadinessAcceptanceSummary: P2ReadinessAcceptanceSummary;
  p2ReadinessEvidenceCoverage: P2ReadinessEvidenceCoverage;
}

export type PersonalTeamUsabilityReadinessReviewReferenceStatus = "current" | "stale" | "missing";

export interface PersonalTeamUsabilityReadinessReviewReference {
  createdAt: string;
  detail: string;
  eventId: string;
  label: string;
  query: string;
  row: AuditEvidenceReportLedgerRow | null;
  status: PersonalTeamUsabilityReadinessReviewReferenceStatus;
}

export type DailyOpsControlRoomState = "ready" | "attention" | "blocked";

export type DailyOpsControlRoomTone = "positive" | "warning" | "risk";

export type DailyOpsControlRoomQueueItemStatus = "ready" | "review" | "blocked";

export type DailyOpsControlRoomQueueItemId = "current-action" | "audit-context" | "team-handoff" | "backup-restore";

export interface DailyOpsControlRoomQueueItem {
  id: DailyOpsControlRoomQueueItemId;
  label: string;
  status: DailyOpsControlRoomQueueItemStatus;
  tone: DailyOpsControlRoomTone;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  auditQuery: string;
  auditQueryTitle?: string;
}

export interface DailyOpsControlRoomSummary {
  state: DailyOpsControlRoomState;
  tone: DailyOpsControlRoomTone;
  headline: string;
  detail: string;
  primaryActionLabel: string;
  primaryActionWorkspaceId: ProductWorkAreaId;
  auditQueryLabel: string;
  auditQuery: string;
  auditQueryTitle?: string;
  readyCount: number;
  reviewCount: number;
  blockingCount: number;
  totalCount: number;
  queueItems: DailyOpsControlRoomQueueItem[];
  openItems: DailyOpsControlRoomQueueItem[];
  liveBoundaryLabel: string;
}

export type DailyOpsControlRoomReviewReferenceStatus = "current" | "stale" | "missing";

export interface DailyOpsControlRoomReviewReference {
  createdAt: string;
  detail: string;
  eventId: string;
  label: string;
  query: string;
  row: AuditEvidenceReportLedgerRow | null;
  status: DailyOpsControlRoomReviewReferenceStatus;
}

export type DailyStartBriefState = "ready" | "attention" | "blocked";

export type DailyStartBriefTone = "positive" | "warning" | "risk";

export type DailyStartBriefLocalReviewStatus = "current" | "stale" | "missing";

export type DailyStartBriefCheckpointStatus = "ready" | "review" | "blocked" | "current" | "stale" | "missing";

export type DailyStartBriefCheckpointId =
  | "ops-queue"
  | "personal-team-review"
  | "daily-ops-review"
  | "live-boundary";

export interface DailyStartBriefCheckpoint {
  id: DailyStartBriefCheckpointId;
  label: string;
  status: DailyStartBriefCheckpointStatus;
  detail: string;
  actionLabel: string;
  targetWorkspaceId: ProductWorkAreaId;
  query: string;
  queryTitle?: string;
}

export interface DailyStartBrief {
  state: DailyStartBriefState;
  tone: DailyStartBriefTone;
  headline: string;
  detail: string;
  primaryActionLabel: string;
  primaryActionWorkspaceId: ProductWorkAreaId;
  auditActionLabel: string;
  auditQuery: string;
  auditQueryTitle?: string;
  localReviewStatus: DailyStartBriefLocalReviewStatus;
  localReviewActionLabel: string;
  localReviewDetail: string;
  localReviewQuery: string;
  localReviewWorkspaceId: ProductWorkAreaId;
  currentReviewCount: number;
  staleReviewCount: number;
  missingReviewCount: number;
  openOpsItemCount: number;
  checkpoints: DailyStartBriefCheckpoint[];
  liveBoundaryLabel: string;
}

export type DailyStartBriefReviewReferenceStatus = "current" | "stale" | "missing";

export interface DailyStartBriefReviewReference {
  createdAt: string;
  detail: string;
  eventId: string;
  label: string;
  query: string;
  row: AuditEvidenceReportLedgerRow | null;
  status: DailyStartBriefReviewReferenceStatus;
}

export type Stage1P0DailyUseArchiveReviewReferenceStatus = "current" | "stale" | "missing";

export interface Stage1P0DailyUseArchiveReviewReference {
  createdAt: string;
  copyText: string;
  detail: string;
  eventId: string;
  fileName: string;
  label: string;
  query: string;
  row: AuditEvidenceReportLedgerRow | null;
  status: Stage1P0DailyUseArchiveReviewReferenceStatus;
}

export interface Stage1P0DailyUseStartupSnapshot {
  archiveReferenceStatus: Stage1P0DailyUseArchiveReviewReference["status"];
  copyText: string;
  fileName: string;
  primaryActionId: Stage1P0DailyUseClosure["primaryActionId"];
  primaryActionLabel: string;
  primaryTargetWorkspaceId: ProductWorkAreaId;
  readyCount: number;
  refreshOutcomeState: Stage1P0DailyUseRefreshOutcome["state"] | "not-generated";
  state: Stage1P0DailyUseClosure["state"];
  totalCount: number;
}

export interface DailyStartBriefInput {
  dailyOpsControlRoom: DailyOpsControlRoomSummary;
  dailyOpsControlRoomReviewReference: DailyOpsControlRoomReviewReference;
  personalTeamReadinessReviewReference: PersonalTeamUsabilityReadinessReviewReference;
  personalTeamUsabilityReadiness: PersonalTeamUsabilityReadinessSummary;
}

export interface DailyOpsControlRoomSummaryInput {
  auditEvidenceReportLedgerSummary: AuditEvidenceReportLedgerSummary;
  personalTeamUsabilityReadiness: PersonalTeamUsabilityReadinessSummary;
  p0CompletionChecklist: P0CompletionChecklist;
}

export type P2ReadinessAcceptanceReviewStatus = "accepted" | "missing" | "invalid";

export interface P2ReadinessAcceptanceReviewSource {
  kind: string;
  schemaVersion: number;
  status: P2ReadinessAcceptanceReviewStatus;
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: Timeframe | null;
  adapterId: string | null;
  p1AcceptanceRunId: string | null;
  p2PreLiveAcceptanceRunId: string | null;
  p2PaperReplayRunId: string | null;
  operatorRunbookAuditEventId: string | null;
  readinessCoverageStatus: string | null;
  acceptedCriterionCount: number;
  totalCriterionCount: number;
  blockingCriterionCount: number;
  criterionIds: string[];
  auditEventIds: string[];
  manifestPaths: {
    p1Acceptance: string | null;
    p2PreLiveAcceptance: string | null;
    p2PaperReplay: string | null;
  };
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  manifest: unknown;
}

export type P0CompletionCriterionId =
  | "product-workspaces"
  | "golden-path"
  | "data-quality"
  | "strategy-versioning"
  | "audited-backtest"
  | "ai-evidence"
  | "paper-execution"
  | "replay"
  | "export-import"
  | "automated-tests";

export type P0CompletionCriterionStatus = "passed" | "review" | "blocked";

export interface P0CompletionCriterion {
  id: P0CompletionCriterionId;
  label: string;
  status: P0CompletionCriterionStatus;
  detail: string;
  evidence: string;
  actionLabel: string | null;
  targetWorkspaceId: ProductWorkAreaId;
}

export interface P0CompletionChecklistInput {
  goldenPath?: P0PlatformReadinessSource | null;
  summary: P0PlatformReadinessSummary;
  outcome: P0PlatformActionOutcome;
  paperPreflight?: P0PaperExecutionPreflight | null;
  productWorkAreaCount: number;
  strategyVersionReady?: boolean;
  replayReady?: boolean;
  exportImportReady?: boolean;
  automatedTestsVerified?: boolean;
}

export interface P0CompletionChecklist {
  total: number;
  passed: number;
  review: number;
  blocked: number;
  progressPct: number;
  headline: string;
  detail: string;
  criteria: P0CompletionCriterion[];
  openCriteria: P0CompletionCriterion[];
  currentGap: P0CompletionCriterion | null;
}

export type P0PlatformActionOutcomeState = "waiting" | "audit_run" | "paper_execution" | "live_ready";

export type P0PlatformActionOutcomeTone = "positive" | "warning" | "ai";

export interface P0PlatformActionOutcomePaperExecution {
  executionId: string;
  runId: string;
  mode: string;
  orders?: readonly unknown[];
  gates?: readonly {
    passed: boolean;
  }[];
  preparationEvidence?: {
    runId?: string | null;
    upsertedRows?: number | null;
    quality?: {
      source?: string | null;
    } | null;
  } | null;
}

export interface P0PlatformActionOutcomeSource {
  goldenPath?: {
    latestRunId?: string | null;
    status?: P0PlatformReadinessSource["status"];
    summary?: {
      liveTradingAllowed?: boolean;
    };
  } | null;
  paperExecution?: P0PlatformActionOutcomePaperExecution | null;
  statusLabel?: string | null;
}

export interface P0PlatformActionOutcome {
  state: P0PlatformActionOutcomeState;
  label: string;
  detail: string;
  evidenceId: string | null;
  runId: string | null;
  preparationEvidenceRunId?: string | null;
  targetWorkspaceId: ProductWorkAreaId;
  tone: P0PlatformActionOutcomeTone;
  nextStep: string;
}

export interface P0PlatformActionOutcomeEvidenceLink {
  evidenceId: string;
  label: string;
  search: string;
  targetWorkspaceId: ProductWorkAreaId;
}

export type P0PaperExecutionPreflightState = "blocked" | "ready" | "recorded";

export type P0PaperExecutionPreflightGateStatus = "passed" | "blocked" | "review";

export type P0PaperExecutionPreflightGateTone = "positive" | "warning" | "risk";

export type P0PaperExecutionPreflightGateId =
  | "audited-run"
  | "risk-approval"
  | "paper-execution"
  | "live-boundary";

export interface P0PaperExecutionPreflightGate {
  id: P0PaperExecutionPreflightGateId;
  label: string;
  value: string;
  detail: string;
  status: P0PaperExecutionPreflightGateStatus;
  tone: P0PaperExecutionPreflightGateTone;
}

export interface P0PaperExecutionPreflightSource {
  goldenPath?: {
    latestRunId?: string | null;
    currentStepId?: string | null;
    nextAction?: {
      id?: string | null;
      label?: string | null;
      targetWorkspace?: string | null;
      reason?: string | null;
    } | null;
    summary?: {
      liveTradingAllowed?: boolean;
    } | null;
  } | null;
  paperExecution?: P0PlatformActionOutcomePaperExecution | null;
  researchBinding?: ResearchRunContextBinding | null;
  riskApproval?: RiskApprovalSummary | null;
}

export interface P0PaperExecutionPreflight {
  state: P0PaperExecutionPreflightState;
  headline: string;
  detail: string;
  primaryActionLabel: string;
  primaryActionId: string | null;
  primaryActionTargetWorkspaceId: ProductWorkAreaId;
  canSubmitPaperOrder: boolean;
  canRebindLatestRun: boolean;
  targetWorkspaceId: ProductWorkAreaId;
  gates: P0PaperExecutionPreflightGate[];
}

export type P0GoldenPathJourneyStepId =
  | "data"
  | "strategy"
  | "backtest"
  | "ai-review"
  | "paper-simulation"
  | "replay"
  | "export";

export type P0GoldenPathJourneyStepState = "done" | "current" | "blocked" | "ready";

export interface P0GoldenPathJourneyStep {
  id: P0GoldenPathJourneyStepId;
  label: string;
  state: P0GoldenPathJourneyStepState;
  workspaceId: ProductWorkAreaId;
  evidenceId: string;
  nextActionId: string;
  detail: string;
}

export interface P0GoldenPathJourney {
  steps: P0GoldenPathJourneyStep[];
  currentStepId: P0GoldenPathJourneyStepId;
  nextActionId: string;
  nextActionTargetWorkspaceId: ProductWorkAreaId;
  liveTradingAllowed: false;
  liveBoundaryLabel: string;
  detail: string;
}

export interface P0GoldenPathJourneyInput {
  goldenPath?: P0PlatformReadinessSource | null;
  summary?: P0PlatformReadinessSummary | null;
  outcome?: P0PlatformActionOutcome | null;
  paperPreflight?: P0PaperExecutionPreflight | null;
  completionChecklist?: P0CompletionChecklist | null;
}

export interface P0PlatformReadinessReportInput {
  summary: P0PlatformReadinessSummary;
  backlogItems: readonly P0PlatformBacklogItem[];
  outcome: P0PlatformActionOutcome;
  evidenceLink?: P0PlatformActionOutcomeEvidenceLink | null;
  paperPreflight?: P0PaperExecutionPreflight | null;
  completionChecklist?: P0CompletionChecklist | null;
  generatedAt?: string;
}

export interface QuantLoopNavigationTarget {
  moduleId: string;
  workflowStageId: string;
}

export interface QuantLoopSelection {
  stepId: string;
  target: QuantLoopNavigationTarget;
}

export interface TerminalPanel {
  id: PanelId;
  title: string;
  visible: boolean;
}

export interface AgentRole {
  id: string;
  label: string;
  stance: "analysis" | "debate" | "risk" | "decision";
}

export interface ExecutionGate {
  id: string;
  label: string;
  passed: boolean;
}

export interface ExecutionState {
  mode: "paper_only" | "certified_live" | "blocked_live";
  liveEnabled: boolean;
  gates: ExecutionGate[];
}

export interface Instrument {
  symbol: string;
  name: string;
  market: Market;
  changePct: number;
  price?: number | null;
  quoteSource?: string | null;
  quoteAsOf?: string | null;
}

export interface StrategySnapshot {
  name: string;
  entry: string;
  exit: string;
  position: string;
  risk: string;
}

export type StrategyField = keyof StrategySnapshot;

export interface StrategyLibraryDraftItem {
  name: string;
  revision: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  status: "draft" | "audited";
  auditRunId?: string | null;
  strategySnapshot: StrategySnapshot;
}

export interface StrategyVersionDiffRow {
  id: "context" | StrategyField;
  label: string;
  current: string;
  saved: string;
  changed: boolean;
  tone: "neutral" | "warning";
}

export interface StrategyReadinessGate {
  id: "schema" | "risk" | "execution" | "audit";
  label: "Strategy schema" | "Risk controls" | "Execution mode" | "Audit evidence";
  value: string;
  detail: string;
  status: "passed" | "review" | "blocked";
  tone: "positive" | "warning" | "risk";
}

export type StrategyGovernanceQueueStage =
  | "current_draft"
  | "blocked"
  | "needs_reaudit"
  | "stale"
  | "audited"
  | "imported";

export type StrategyGovernanceQueueActionId = "save-current-version" | "load-version" | "load-and-rerun";

export interface StrategyGovernanceQueueRow {
  id: string;
  name: string;
  revision: string;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  status: "current" | StrategyLibraryDraftItem["status"];
  stage: StrategyGovernanceQueueStage;
  tone: "positive" | "warning" | "neutral" | "risk";
  contextLabel: string;
  contextMismatch: boolean;
  importProvenance: string;
  validationStatus: "ready" | "review" | "blocked";
  validationDetail: string;
  auditRunId: string | null;
  latestAuditRunId: string | null;
  changedFieldCount: number;
  changedFields: StrategyVersionDiffRow["id"][];
  nextActionId: StrategyGovernanceQueueActionId;
  nextActionLabel: string;
  detail: string;
}

export interface StrategyGovernanceQueueSummary {
  totalRows: number;
  currentDraftCount: number;
  auditedCount: number;
  importedCount: number;
  staleCount: number;
  needsReauditCount: number;
  blockedCount: number;
}

export interface StrategyGovernanceQueue {
  rows: StrategyGovernanceQueueRow[];
  summary: StrategyGovernanceQueueSummary;
}

export type StrategyConditionKind = "close_above_sma" | "close_below_sma" | "rsi_below" | "rsi_above";

export type StrategyRuleDraftField =
  | "name"
  | "entryKind"
  | "entryWindow"
  | "entryThreshold"
  | "entryRsiConfirm"
  | "entryRsiWindow"
  | "entryRsiThreshold"
  | "entryVolumeConfirm"
  | "entryVolumeWindow"
  | "exitKind"
  | "exitWindow"
  | "exitThreshold"
  | "positionPct"
  | "stopLossPct"
  | "takeProfitPct"
  | "maxDrawdownPct";

export interface StrategyRuleDraft {
  name: string;
  entryKind: StrategyConditionKind;
  entryWindow: number;
  entryThreshold: number;
  entryRsiConfirm: boolean;
  entryRsiWindow: number;
  entryRsiThreshold: number;
  entryVolumeConfirm: boolean;
  entryVolumeWindow: number;
  exitKind: StrategyConditionKind;
  exitWindow: number;
  exitThreshold: number;
  positionPct: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxDrawdownPct: number;
  paperOnly: boolean;
}

export type StrategyTemplateId = "sma_trend" | "rsi_reversal" | "volume_breakout";

export interface StrategyTemplateOption {
  id: StrategyTemplateId;
  name: string;
  description: string;
  draft: StrategyRuleDraft;
}

export interface StrategyRuleRow {
  id: string;
  group: "entry" | "exit" | "position" | "risk";
  label: string;
  condition: string;
  parameter: string;
  status: "active" | "pending" | "guardrail";
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestMetric {
  label: string;
  value: string;
  tone: "positive" | "warning" | "neutral";
}

export interface BacktestTradeRow {
  id: string;
  timestamp: string;
  symbol: string;
  side: "BUY" | "SELL" | "RISK" | "HOLD";
  status: "filled" | "open" | "review" | "blocked";
  price: string;
  quantity: string;
  exposure: string;
  pnl: string;
  reason: string;
  tone: "positive" | "warning" | "neutral" | "risk";
  proposalId?: string | null;
  signalId?: string | null;
  snapshotHash?: string | null;
}

export interface BacktestEquityPoint {
  timestamp: string;
  equity: number;
}

export interface BacktestDiagnostic {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestAssumptions {
  initialCash: number;
  feeBps: number;
  slippageBps: number;
}

export type BacktestAssumptionField = keyof BacktestAssumptions;

export interface BacktestAssumptionRow {
  field: BacktestAssumptionField;
  label: string;
  value: number;
  suffix: string;
  min: number;
  step: number;
}

export interface BacktestEvidenceCard {
  id: "run" | "strategy" | "costs" | "diagnostics";
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestReadinessGate {
  id: "data" | "strategy" | "costs" | "execution";
  label: string;
  status: "passed" | "blocked" | "review";
  detail: string;
  tone: "positive" | "warning" | "neutral" | "risk";
}

export interface BacktestBenchmark {
  label: string;
  symbol: string;
  strategyReturn: string;
  benchmarkReturn: string;
  alpha: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
  sampleBars: number;
  source: string;
}
