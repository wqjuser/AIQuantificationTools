import type { P0CurrentGapActionReadinessReason } from "./deep-link-queries";
import type { PaperExecutionSnapshot } from "./execution-contracts";
import type { ResearchRunAudit } from "../core/workspace-contracts";
import type { ExecutionAdapterPaperExecutionSnapshot } from "../execution/ops-contracts";
import type { PortfolioPaperOrderApprovalSnapshot, PortfolioPaperOrderBatchSnapshot, PortfolioPaperOrderLifecycleSnapshot, PortfolioPaperOrderSimulationSnapshot, ResearchRunExportAuditEventSnapshot, ResearchRunExportBrowserManifest, ResearchRunExportBrowserStatus, ResearchRunExportHandoffNoteSnapshot, ResearchRunExportPreviewAiReviewEnvelope, ResearchRunExportPreviewPromotionCandidate } from "../portfolio/paper-contracts";
import type { Market, P0AcceptanceSummaryState, ProductWorkAreaId, Timeframe } from "../stage1/foundation-contracts";
import type { P0CompletionCriterionStatus } from "../stage1/review-contracts";
import type { AiReviewDecision, AiReviewRunArchiveRecord } from "../../ai-review-stage3";

export interface PortfolioPaperOrderApprovalLockedLedgerStateResult {
  approval?: unknown;
  existingApproval?: PortfolioPaperOrderApprovalSnapshot;
  existingSimulation?: PortfolioPaperOrderSimulationSnapshot;
  approvals?: readonly unknown[];
  lifecycle?: readonly PortfolioPaperOrderLifecycleSnapshot[];
  error?: string;
}

export interface ResearchRunExportBrowserPackage {
  kind: "aiqt.researchRun.export";
  packageVersion: number;
  exportedAt: string;
  integrity?: {
    algorithm: "sha256";
    hash: string;
  };
  manifest: ResearchRunExportBrowserManifest;
  executionHandoff: {
    mode: string;
    paperOnly: boolean;
    liveTradingAllowed: boolean;
    requiredGates: Array<{
      id: string;
      label: string;
      passed: boolean;
      reason: string;
    }>;
  };
  researchRun?: ResearchRunAudit;
  paperExecutions?: PaperExecutionSnapshot[];
  adapterPaperExecutions?: ExecutionAdapterPaperExecutionSnapshot[];
  portfolioPaperOrderBatches?: PortfolioPaperOrderBatchSnapshot[];
  portfolioPaperOrderApprovals?: PortfolioPaperOrderApprovalSnapshot[];
  portfolioPaperOrderSimulations?: PortfolioPaperOrderSimulationSnapshot[];
  promotionCandidate?: ResearchRunExportPreviewPromotionCandidate | null;
  aiReviewRuns?: ResearchRunExportPreviewAiReviewEnvelope[];
  aiReviewRunsV2?: Array<{
    aiReviewId: string;
    runId: string;
    createdAt: string;
    record: AiReviewRunArchiveRecord;
  }>;
  aiReviewDecisions?: Array<{
    decisionId: string;
    aiReviewId: string;
    createdAt: string;
    record: AiReviewDecision;
  }>;
  auditEvents?: ResearchRunExportAuditEventSnapshot[];
  handoffNotes?: ResearchRunExportHandoffNoteSnapshot[];
  p0PackageCompleteness?: {
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
    criteria: Array<{
      id: string;
      label: string;
      status: "passed" | "review" | "blocked";
      detail: string;
      evidence: string;
      evidencePath: string;
    }>;
  };
  auditEvidenceSummary?: {
    kind: "aiqt.auditEvidenceSummary";
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    auditQuery: string;
    packageQuery: string;
    importDiffQuery: string;
    focusQuery: string;
    deepLinkStatus: AuditEvidenceDeepLinkStatus;
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
      buckets: AuditEvidenceImportVerificationBucket[];
    };
    copyText: string;
  };
  auditReport?: {
    kind: "aiqt.auditReport";
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    format: "text/markdown";
    fileName: string;
    contentSha256: {
      algorithm: "sha256";
      hash: string;
    };
    contentMarkdown: string;
    signature?: Record<string, unknown>;
    evidenceSummary: ResearchRunExportBrowserPackage["auditEvidenceSummary"];
  };
  backtestReport?: {
    kind: "aiqt.backtestReport";
    schemaVersion: 1;
    runId: string;
    generatedAt: string;
    format: "text/markdown";
    fileName: string;
    contentSha256: {
      algorithm: "sha256";
      hash: string;
    };
    contentMarkdown: string;
    market: Market;
    symbol: string;
    timeframe: Timeframe;
    strategyRevision: string;
    executionMode: string;
    dataRows: number;
    runComparisonRows: number;
    signature?: Record<string, unknown>;
    boundary: "historical audited evidence only; no investment advice";
  };
}

export interface ResearchRunExportBrowserRow {
  id:
    | "package"
    | "integrity"
    | "data"
    | "market-calendar"
    | "preparation-evidence"
    | "backtest"
    | "backtest-report"
    | "research-note"
    | "handoff-notes"
    | "paper-executions"
    | "adapter-paper-executions"
    | "portfolio-paper-orders"
    | "promotion-candidate"
    | "ai-reviews"
    | "ai-reviews-v2"
    | "ai-review-decisions"
    | "stage5-shadow-sessions"
    | "stage5-sandbox-readiness-decisions"
    | "stage5-sandbox-authorization-preflights"
    | "stage5-sandbox-authorization-reviews"
    | "audit-events"
    | "p0-completeness"
    | "audit-summary"
    | "audit-report"
    | "execution-handoff";
  label: string;
  status: ResearchRunExportBrowserStatus;
  value: string;
  detail: string;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type ResearchRunExportIndexStatus = "ready" | "review" | "blocked";

export interface ResearchRunExportIndexRow {
  id: string;
  runId: string;
  context: string;
  strategyRevision: string;
  exportedAt: string;
  status: ResearchRunExportIndexStatus;
  integrity: string;
  dataHash: string;
  artifacts: string;
  execution: string;
  detail: string;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type ResearchRunImportDiffStatus = "same" | "add" | "change" | "replace" | "blocked";

export type ResearchRunImportDiffRowId =
    | "package-integrity"
    | "artifact-counts"
    | "run-id"
    | "context"
    | "timeframe"
    | "data-snapshot"
    | "market-calendar"
    | "preparation-evidence"
    | "strategy-revision"
    | "research-note"
    | "handoff-notes"
    | "paper-executions"
    | "adapter-paper-executions"
    | "portfolio-paper-orders"
    | "ai-review-runs"
    | "stage4-portfolio-workflows"
    | "stage5-shadow-sessions"
    | "stage5-sandbox-readiness-decisions"
    | "stage5-sandbox-authorization-preflights"
    | "stage5-sandbox-authorization-reviews"
    | "audit-summary"
    | "audit-report"
    | "backtest-report"
    | "live-boundary"
    | `ai-review-run-v2:${number}`
    | `ai-review-decision:${number}`;

export interface ResearchRunImportDiffRow {
  id: ResearchRunImportDiffRowId;
  label: string;
  status: ResearchRunImportDiffStatus;
  current: string;
  incoming: string;
  detail: string;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
}

export type AuditEvidenceDeepLinkStatus = "none" | "idle" | "loading" | "loaded" | "failed";

export interface AuditEvidenceImportVerificationBucket {
  count: number;
  latestExportPath: string;
  latestReason: string;
  source: "local-core";
  status: "verified" | "invalid";
}

export interface AuditEvidenceImportPolicyBlockerBucket {
  category: ResearchRunImportBlockedEvidenceBucketCategory;
  count: number;
  label: string;
  latestDetail: string;
  latestExportPath: string;
  latestFileName: string;
  latestRunId: string;
  tone: "risk" | "warning";
}

export interface AuditEvidenceMatchedEvidenceFocus {
  area: "Export package" | "Import diff";
  detail: string;
  exportPath: string;
  label: string;
}

export interface AuditEvidenceSummary {
  auditQuery: string;
  copyText: string;
  deepLinkError: string | null;
  deepLinkStatus: AuditEvidenceDeepLinkStatus;
  focusQuery: string;
  importDiffAddCount: number;
  importDiffBlockedCount: number;
  importDiffChangeCount: number;
  importDiffMatchedCount: number;
  importDiffQuery: string;
  importDiffTotalCount: number;
  importPolicyBlockedCount: number;
  importPolicyBlockerBuckets: AuditEvidenceImportPolicyBlockerBucket[];
  importVerificationBuckets: AuditEvidenceImportVerificationBucket[];
  importVerificationInvalidCount: number;
  importVerificationVerifiedCount: number;
  matchedEvidenceFocus?: AuditEvidenceMatchedEvidenceFocus[];
  packageBlockedCount: number;
  packageMatchedCount: number;
  packageMissingCount: number;
  packageQuery: string;
  packageReadyCount: number;
  packageTotalCount: number;
  runId: string;
}

export type ResearchRunImportAuditEventStage =
  | "preview"
  | "blocked"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "undone"
  | "undo-failed";

export type ResearchRunImportFailureCategory = "schema" | "integrity" | "artifact-counts" | "core" | "unknown";

export interface ResearchRunImportAuditBlockedRow {
  id: ResearchRunImportDiffRow["id"];
  label: string;
  detail: string;
  exportPath: string;
  incoming: string;
}

export interface ResearchRunImportAuditArtifactRow {
  id: ResearchRunImportDiffRow["id"];
  label: string;
  status: Exclude<ResearchRunImportDiffStatus, "blocked">;
  detail: string;
  exportPath: string;
  incoming: string;
}

export interface ResearchRunImportVerifiedReportSignature {
  id: Extract<ResearchRunImportDiffRow["id"], "audit-report" | "backtest-report">;
  label: string;
  detail: string;
  exportPath: string;
  incoming: string;
  reason: string;
  source: "local-core";
  status: "verified" | "invalid";
}

export interface ResearchRunImportAuditEvent {
  id: string;
  stage: ResearchRunImportAuditEventStage;
  runId: string;
  previousRunId: string | null;
  rollbackTargetRunId: string | null;
  undoToken: string | null;
  fileName: string;
  createdAt: string;
  summary: string;
  detail: string;
  failureCategory: ResearchRunImportFailureCategory | null;
  recoveryHint: string;
  blockedCount: number;
  blockedRows: ResearchRunImportAuditBlockedRow[];
  artifactRows: ResearchRunImportAuditArtifactRow[];
  changeCount: number;
  exportPath: string;
  tone: "positive" | "warning" | "neutral" | "risk" | "ai";
  verifiedReportSignatures: ResearchRunImportVerifiedReportSignature[];
}

export interface ResearchRunImportUndoConfirmation {
  undoToken: string;
  runId: string;
  fileName: string;
  message: string;
  detail: string;
}

export type ResearchRunImportAuditFilter =
  | "all"
  | "needs-review"
  | "undoable"
  | "recoverable"
  | ResearchRunImportAuditEventStage;

export type ResearchRunImportAuditFailureBucketCategory = ResearchRunImportFailureCategory | "blocked";

export interface ResearchRunImportAuditFailureBucket {
  category: ResearchRunImportAuditFailureBucketCategory;
  label: string;
  count: number;
  latestRunId: string;
  latestFileName: string;
  latestCreatedAt: string;
  recoveryHint: string;
  stageCounts: Partial<Record<ResearchRunImportAuditEventStage, number>>;
  tone: "risk" | "warning";
}

export type ResearchRunImportBlockedEvidenceBucketCategory =
  | "import-verification"
  | "report-signature"
  | "package-integrity"
  | "artifact-counts"
  | "live-boundary"
  | "data-snapshot"
  | "unknown";

export interface ResearchRunImportBlockedEvidenceBucket {
  category: ResearchRunImportBlockedEvidenceBucketCategory;
  label: string;
  count: number;
  latestRunId: string;
  latestFileName: string;
  latestCreatedAt: string;
  latestDetail: string;
  latestExportPath: string;
  rowIds: ResearchRunImportDiffRow["id"][];
  tone: "risk" | "warning";
}

export interface ResearchRunImportVerifiedReportSignatureBucket {
  status: ResearchRunImportVerifiedReportSignature["status"];
  label: string;
  count: number;
  latestRunId: string;
  latestFileName: string;
  latestCreatedAt: string;
  latestDetail: string;
  latestExportPath: string;
  latestReason: string;
  rowIds: ResearchRunImportVerifiedReportSignature["id"][];
  source: "local-core";
  tone: "positive" | "risk";
}

export interface ResearchRunImportAuditAggregation {
  total: number;
  preview: number;
  blocked: number;
  confirmed: number;
  failed: number;
  cancelled: number;
  undone: number;
  undoFailed: number;
  needsReview: number;
  undoable: number;
  recoverable: number;
  failureBuckets: ResearchRunImportAuditFailureBucket[];
  blockedEvidenceBuckets: ResearchRunImportBlockedEvidenceBucket[];
  verifiedReportSignatureBuckets: ResearchRunImportVerifiedReportSignatureBucket[];
}

export interface AuditEvidenceReportLedgerEventRecord {
  schemaVersion: number;
  eventId: string;
  eventType: string;
  runId: string | null;
  createdAt: string;
  stage: string;
  source: string;
  summary: string;
  detail: string;
  metadata: Record<string, unknown>;
}

export type AuditEvidenceReportLedgerStatus = "ready" | "invalid";

export type AuditEvidenceReportSignatureStatus =
  | "unsigned"
  | "signed"
  | "verified"
  | "revoked"
  | "invalid";

export interface AuditEvidenceReportLedgerRow {
  id: string;
  artifactKind: string;
  runId: string;
  createdAt: string;
  fileName: string;
  contentSha256: string;
  shortHash: string;
  focusQuery: string;
  evidenceLinkDecodedSearch: string;
  evidenceLinkLabel: string;
  evidenceLinkSearch: string;
  evidenceLinkStatus: string;
  evidenceTargetWorkspaceId: ProductWorkAreaId | null;
  packageMatched: number;
  packageTotal: number;
  importDiffBlocked: number;
  importDiffTotal: number;
  importVerificationDetail: string;
  importVerificationInvalid: number;
  importVerificationVerified: number;
  p0BacklogExecutableCount: number;
  p0BacklogNotExecutableCount: number;
  p0BacklogReadinessRecorded: boolean;
  p0BacklogReadinessSummary: string;
  p0BacklogTotalCount: number;
  p0CompletionBlockedCount: number;
  p0CompletionCurrentCriterionActionLabel: string;
  p0CompletionCurrentCriterionId: string;
  p0CompletionCurrentCriterionLabel: string;
  p0CompletionCurrentCriterionStatus: P0CompletionCriterionStatus | "";
  p0CompletionCurrentCriterionTargetWorkspaceId: ProductWorkAreaId | null;
  p0CompletionOpenCriterionIds: string;
  p0CompletionPassedCount: number;
  p0CompletionProgressPct: number;
  p0CompletionReadinessRecorded: boolean;
  p0CompletionReviewCount: number;
  p0CompletionSummary: string;
  p0CompletionTotalCount: number;
  p0CurrentGapActionId: string;
  p0CurrentGapActionLabel: string;
  p0CurrentGapCanExecute: boolean;
  p0CurrentGapDeepLinkSearch: string;
  p0CurrentGapExecutableActionId: string;
  p0CurrentGapReadinessReason: P0CurrentGapActionReadinessReason;
  p0CurrentGapTargetWorkspaceId: ProductWorkAreaId | null;
  p0CurrentGapWorkspaceId: ProductWorkAreaId | null;
  p0FirstBacklogCanExecute: boolean;
  p0FirstBacklogExecutableActionId: string;
  p0FirstBacklogReadinessReason: P0CurrentGapActionReadinessReason;
  paperPreflightActionId: string;
  paperPreflightActionLabel: string;
  paperPreflightGateBlockedCount: number;
  paperPreflightGatePassedCount: number;
  paperPreflightGateReviewCount: number;
  paperPreflightGateTotal: number;
  paperPreflightLabel: string;
  paperPreflightLiveBoundary: string;
  paperPreflightState: string;
  p0PreparationEvidenceRunId: string;
  researchContextMarket: string;
  researchContextLinkDecodedSearch: string;
  researchContextLinkLabel: string;
  researchContextLinkSearch: string;
  researchContextNextAction: string;
  researchContextPreflightStatus: string;
  researchContextPreparationEvidenceRunId: string;
  researchContextSymbol: string;
  researchContextTimeframe: string;
  operatorRunbookAdapterId: string;
  operatorRunbookCompletedSections: number;
  operatorRunbookControlSnapshot: string[];
  operatorRunbookMarket: string;
  operatorRunbookNextActionId: string;
  operatorRunbookSectionEvidence: string[];
  operatorRunbookSectionIds: string[];
  operatorRunbookSectionStatuses: string[];
  operatorRunbookStatus: string;
  operatorRunbookSymbol: string;
  operatorRunbookTimeframe: string;
  operatorRunbookTotalSections: number;
  preLiveRunbookAdapterId: string;
  preLiveRunbookCompletedSteps: number;
  preLiveRunbookEvidenceIds: string[];
  preLiveRunbookMarket: string;
  preLiveRunbookNextStep: string;
  preLiveRunbookNextStepId: string;
  preLiveRunbookStatus: string;
  preLiveRunbookSymbol: string;
  preLiveRunbookTimeframe: string;
  preLiveRunbookTotalSteps: number;
  personalTeamReadinessReviewState: string;
  personalTeamReadinessReviewPersonalPercent: number;
  personalTeamReadinessReviewTeamPercent: number;
  personalTeamReadinessReviewReadyCount: number;
  personalTeamReadinessReviewTotalCount: number;
  personalTeamReadinessReviewItemIds: string[];
  personalTeamReadinessReviewItemStatuses: string[];
  personalTeamReadinessReviewOpenItemIds: string[];
  personalTeamReadinessReviewNextActionLabel: string;
  personalTeamReadinessReviewNextActionWorkspaceId: string;
  dailyOpsControlRoomReviewState: string;
  dailyOpsControlRoomReviewReadyCount: number;
  dailyOpsControlRoomReviewReviewCount: number;
  dailyOpsControlRoomReviewBlockingCount: number;
  dailyOpsControlRoomReviewTotalCount: number;
  dailyOpsControlRoomReviewQueueItemIds: string[];
  dailyOpsControlRoomReviewQueueItemStatuses: string[];
  dailyOpsControlRoomReviewOpenItemIds: string[];
  dailyOpsControlRoomReviewPrimaryActionLabel: string;
  dailyOpsControlRoomReviewPrimaryActionWorkspaceId: string;
  dailyOpsControlRoomReviewAuditQueryLabel: string;
  dailyOpsControlRoomReviewAuditQuery: string;
  dailyOpsControlRoomReviewAuditQueryTitle: string;
  dailyStartBriefReviewState: string;
  dailyStartBriefReviewCurrentReviewCount: number;
  dailyStartBriefReviewStaleReviewCount: number;
  dailyStartBriefReviewMissingReviewCount: number;
  dailyStartBriefReviewOpenOpsItemCount: number;
  dailyStartBriefReviewPrimaryActionLabel: string;
  dailyStartBriefReviewPrimaryActionWorkspaceId: string;
  dailyStartBriefReviewAuditQuery: string;
  dailyStartBriefReviewAuditQueryTitle: string;
  dailyStartBriefReviewLocalReviewStatus: string;
  dailyStartBriefReviewLocalReviewActionLabel: string;
  dailyStartBriefReviewLocalReviewQuery: string;
  dailyStartBriefReviewCheckpointIds: string[];
  dailyStartBriefReviewCheckpointStatuses: string[];
  stage1DailyArchiveReviewState: string;
  stage1DailyArchiveReviewReadyCount: number;
  stage1DailyArchiveReviewTotalCount: number;
  stage1DailyArchiveReviewPrimaryActionId: string;
  stage1DailyArchiveReviewPrimaryActionLabel: string;
  stage1DailyArchiveReviewPrimaryTargetWorkspaceId: string;
  stage1DailyArchiveReviewRowIds: string[];
  stage1DailyArchiveReviewRowLabels: string[];
  stage1DailyArchiveReviewRowStatuses: string[];
  stage1DailyArchiveReviewRowTargetWorkspaceIds: string[];
  stage1DailyArchiveReviewRefreshOutcomeState: string;
  stage1DailyArchiveReviewShareKind: string;
  stage1DailyArchiveReviewShareFocus: string;
  stage1DailyArchiveReviewShareTargetWorkspaceId: string;
  stage1DailyArchiveReviewInvalidShareStatus: string;
  stage1DailyArchiveReviewInvalidShareReason: string;
  stage1DailyArchiveReviewArchiveBodySha256: string;
  stage1DailyArchiveReviewBootstrapPreflightCheckIds: string[];
  stage1DailyArchiveReviewBootstrapPreflightCheckStatuses: string[];
  stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths: string[];
  stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath: string;
  localReviewBundleContextLabel: string;
  localReviewBundleContextQuery: string;
  localReviewBundleContextTitle: string;
  localReviewBundleCoverageQuery: string;
  localReviewBundleCoverageTitle: string;
  localReviewBundleCoverageNextActionQuery: string;
  localReviewBundleCoverageNextActionTargetWorkspaceId: ProductWorkAreaId | null;
  localReviewBundleCoverageNextActionTitle: string;
  localReviewBundleLatestLabel: string;
  localReviewBundleLatestQuery: string;
  localReviewBundleLatestTitle: string;
  p2ReadinessAcceptanceCoverageReviewLinkLabel: string;
  p2ReadinessAcceptanceCoverageReviewLinkQuery: string;
  p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel: string;
  p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery: string;
  p2ReadinessReviewChainLabel: string;
  p2ReadinessReviewChainQuery: string;
  p2ReadinessReviewChainAcceptanceLoaded: boolean;
  p2ReadinessReviewChainCoverageLoaded: boolean;
  p2ReadinessReviewChainHealthContextQuery: string;
  p2ReadinessReviewChainHealthContextTitle: string;
  p2ReadinessReviewChainStatusLabel: string;
  p2ReadinessReviewChainStatusQuery: string;
  p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId: string;
  deepLinkStatus: string;
  status: AuditEvidenceReportLedgerStatus;
  statusLabel: string;
  chainId: string;
  signer: string;
  signatureAlgorithm: string;
  signatureDetail: string;
  signatureKeyId: string;
  signatureRevokedReason: string;
  signatureSignedAt: string;
  signatureStatus: AuditEvidenceReportSignatureStatus;
  signatureLabel: string;
  signatureVerifiedAt: string;
  detail: string;
  reportKind:
    | "audit_evidence_report"
    | "backtest_report"
    | "portfolio_report"
    | "p0_readiness_report"
    | "p2_manifest_chain_preflight"
    | "p2_manifest_chain_preflight_review"
    | "p2_readiness_evidence_coverage_review"
    | "p2_readiness_acceptance_generated"
    | "p2_readiness_acceptance_review"
    | "personal_team_readiness_review"
    | "daily_ops_control_room_review"
    | "daily_start_brief_review"
    | "stage1_daily_archive_review"
    | "operator_runbook_report"
    | "pre_live_runbook_report"
    | "research_context_readiness_report";
  searchText: string;
  tone: "ai" | "positive" | "risk";
}

export type EvidencePackageControlRoomStatus =
  | "import_blocked"
  | "package_blocked"
  | "acceptance_missing"
  | "stale_signature"
  | "unsigned"
  | "ready_for_archive"
  | "complete";

export type EvidencePackageControlRoomAction =
  | "inspect-package"
  | "open-import-audit"
  | "open-acceptance"
  | "open-signature-ledger"
  | "open-archive";

export interface EvidencePackageControlRoomRow {
  id: string;
  runId: string;
  context: string;
  updatedAt: string;
  status: EvidencePackageControlRoomStatus;
  statusLabel: string;
  packageStatus: ResearchRunExportIndexStatus | "missing";
  packageDetail: string;
  signatureStatus: AuditEvidenceReportSignatureStatus | "missing";
  signatureDetail: string;
  importStatus: ResearchRunImportAuditEventStage | "none";
  importDetail: string;
  acceptanceStatus: P0AcceptanceSummaryState;
  acceptanceDetail: string;
  evidenceCoverage: string;
  exportPath: string;
  focusQuery: string;
  nextActionId: EvidencePackageControlRoomAction;
  nextActionLabel: string;
  tone: "positive" | "warning" | "risk" | "ai";
}

export interface EvidencePackageControlRoomSummary {
  total: number;
  complete: number;
  readyForArchive: number;
  needsAction: number;
  importBlocked: number;
  packageBlocked: number;
  acceptanceMissing: number;
  staleSignature: number;
  unsigned: number;
  signedRuns: number;
  latestUpdatedAt: string;
}

export interface EvidencePackageControlRoom {
  rows: EvidencePackageControlRoomRow[];
  summary: EvidencePackageControlRoomSummary;
}

export type AuditEvidenceReportLedgerLocalReviewBundleCoverageState = "empty" | "partial" | "complete";
