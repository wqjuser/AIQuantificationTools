import { buildP0CurrentGapActionReadiness, isExecutableP0CurrentGapActionId, localReviewCoverageNextActionQueryHasSingleStructure, localReviewCoverageQueryIncludesToken, localReviewCoverageQueryTokenCount, normalizeP0CurrentGapActionId, resolveP0CurrentGapActionLinkWorkspace } from "./execution-contracts";
import { auditReportLedgerLatestAuditAidBacklogReadinessQuery, auditReportLedgerLatestAuditAidCompletionQuery, auditReportLedgerLatestAuditAidCurrentGapReadinessQuery } from "./local-review-bundle";
import type { AuditEvidenceReportLedgerLocalReviewBundleCoverageState, AuditEvidenceReportLedgerRow } from "./report-contracts";
import { auditReportLedgerLatestAuditAidBaseQuery, auditReportLedgerLatestAuditAidPreflightQuery, auditReportLedgerLatestAuditAidReportQuery } from "./report-queries";
import { auditReportLedgerProductWorkAreaId } from "../research-package/import-audit";
import type { ProductWorkAreaId } from "../stage1/foundation-contracts";
import type { P0CompletionCriterionStatus } from "../stage1/review-contracts";

export interface AuditEvidenceReportLedgerSummary {
  attention: number;
  auditAid: number;
  chainStatus: "empty" | "unsigned" | "verified" | "attention";
  importVerificationInvalid: number;
  importVerificationVerified: number;
  invalid: number;
  latestAuditAidEventId: string;
  latestAuditAidCurrentGapActionId: string;
  latestAuditAidCurrentGapActionLabel: string;
  latestAuditAidCurrentGapCanExecute: boolean;
  latestAuditAidCurrentGapDeepLinkSearch: string;
  latestAuditAidCurrentGapExecutableActionId: string;
  latestAuditAidCurrentGapReadinessQuery: string;
  latestAuditAidCurrentGapReadinessReason: P0CurrentGapActionReadinessReason;
  latestAuditAidCurrentGapReadinessTitle: string;
  latestAuditAidCurrentGapTargetWorkspaceId: ProductWorkAreaId | null;
  latestAuditAidCurrentGapWorkspaceId: ProductWorkAreaId | null;
  latestAuditAidBacklogExecutableCount: number;
  latestAuditAidBacklogNotExecutableCount: number;
  latestAuditAidBacklogReadinessLabel: string;
  latestAuditAidBacklogReadinessQuery: string;
  latestAuditAidBacklogReadinessRecorded: boolean;
  latestAuditAidBacklogReadinessSummary: string;
  latestAuditAidBacklogReadinessTitle: string;
  latestAuditAidBacklogTotalCount: number;
  latestAuditAidCompletionLabel: string;
  latestAuditAidCompletionQuery: string;
  latestAuditAidCompletionCurrentCriterionActionLabel: string;
  latestAuditAidCompletionCurrentCriterionId: string;
  latestAuditAidCompletionCurrentCriterionLabel: string;
  latestAuditAidCompletionCurrentCriterionStatus: P0CompletionCriterionStatus | "";
  latestAuditAidCompletionCurrentCriterionTargetWorkspaceId: ProductWorkAreaId | null;
  latestAuditAidCompletionRecorded: boolean;
  latestAuditAidCompletionTitle: string;
  latestAuditAidEvidenceLabel: string;
  latestAuditAidEvidenceLink: string;
  latestAuditAidPreflightActionId: string;
  latestAuditAidPreflightActionLabel: string;
  latestAuditAidPreflightAttention: number;
  latestAuditAidPreflightLabel: string;
  latestAuditAidPreflightQuery: string;
  latestAuditAidPreflightState: string;
  latestAuditAidProgressLabel: string;
  latestAuditAidProgressQuery: string;
  latestAuditAidPreparationEvidenceLabel: string;
  latestAuditAidPreparationEvidenceRunId: string;
  latestAuditAidReportQuery: string;
  latestAuditAidRunId: string;
  latestAuditAidShortHash: string;
  latestDailyOpsControlRoomReviewEventId: string;
  latestDailyOpsControlRoomReviewLabel: string;
  latestDailyOpsControlRoomReviewQuery: string;
  latestDailyOpsControlRoomReviewShortHash: string;
  latestDailyOpsControlRoomReviewTitle: string;
  latestDailyStartBriefReviewEventId: string;
  latestDailyStartBriefReviewLabel: string;
  latestDailyStartBriefReviewQuery: string;
  latestDailyStartBriefReviewShortHash: string;
  latestDailyStartBriefReviewTitle: string;
  latestStage1DailyArchiveReviewEventId: string;
  latestStage1DailyArchiveReviewLabel: string;
  latestStage1DailyArchiveReviewQuery: string;
  latestStage1DailyArchiveReviewShortHash: string;
  latestStage1DailyArchiveReviewTitle: string;
  latestPersonalTeamReadinessReviewEventId: string;
  latestPersonalTeamReadinessReviewLabel: string;
  latestPersonalTeamReadinessReviewQuery: string;
  latestPersonalTeamReadinessReviewShortHash: string;
  latestPersonalTeamReadinessReviewTitle: string;
  latestPreLiveRunbookAdapterId: string;
  latestPreLiveRunbookContextLabel: string;
  latestPreLiveRunbookEvidenceCount: number;
  latestPreLiveRunbookEvidenceLabel: string;
  latestPreLiveRunbookEventId: string;
  latestPreLiveRunbookGateLabel: string;
  latestPreLiveRunbookQuery: string;
  latestPreLiveRunbookShortHash: string;
  latestPreLiveRunbookStatus: string;
  latestP2ReadinessLinkedAcceptanceReviewEventId: string;
  latestP2ReadinessLinkedAcceptanceReviewQuery: string;
  latestP2ReadinessLinkedCoverageReviewEventId: string;
  latestP2ReadinessLinkedCoverageReviewLabel: string;
  latestP2ReadinessLinkedCoverageReviewQuery: string;
  latestP2ReadinessReviewChainLabel: string;
  latestP2ReadinessReviewChainQuery: string;
  latestP2ReadinessReviewChainGapEventId: string;
  latestP2ReadinessReviewChainGapLabel: string;
  latestP2ReadinessReviewChainGapQuery: string;
  p2ReadinessReviewChainCount: number;
  p2ReadinessReviewChainGapCount: number;
  p2ReadinessReviewChainGapsQuery: string;
  p2ReadinessReviewChainHealthContextCount: number;
  p2ReadinessReviewChainHealthContextQuery: string;
  p2ReadinessReviewChainHealthContextTitle: string;
  p2ReadinessReviewChainHealthLabel: string;
  p2ReadinessReviewChainHealthQuery: string;
  p2ReadinessReviewChainHealthState: "empty" | "loaded" | "gaps";
  p2ReadinessReviewChainHealthTitle: string;
  p2ReadinessReviewChainLoadedCount: number;
  p2ReadinessReviewChainMissingAcceptanceCount: number;
  p2ReadinessReviewChainMissingAcceptanceQuery: string;
  p2ReadinessReviewChainMissingCoverageCount: number;
  p2ReadinessReviewChainMissingCoverageQuery: string;
  p2ReadinessReviewChainsQuery: string;
  latestResearchContextReportEventId: string;
  latestResearchContextReportLabel: string;
  latestResearchContextReportLinkSearch: string;
  latestResearchContextReportPreflightStatus: string;
  latestResearchContextReportPreparationEvidenceRunId: string;
  latestResearchContextReportQuery: string;
  latestResearchContextReportRunId: string;
  latestResearchContextReportShortHash: string;
  localReviewBundleCount: number;
  localReviewBundleCoverageLabel: string;
  localReviewBundleCoverageNextActionLabel: string;
  localReviewBundleCoverageNextActionQuery: string;
  localReviewBundleCoverageNextActionTargetWorkspaceId: ProductWorkAreaId | null;
  localReviewBundleCoverageNextActionTitle: string;
  localReviewBundleCoverageQuery: string;
  localReviewBundleCoverageState: AuditEvidenceReportLedgerLocalReviewBundleCoverageState;
  localReviewBundleCoverageTitle: string;
  localReviewBundleDailyOpsCount: number;
  localReviewBundleDailyStartCount: number;
  localReviewBundleStage1ArchiveCount: number;
  localReviewBundleLatestEventId: string;
  localReviewBundleLatestLabel: string;
  localReviewBundleLatestQuery: string;
  localReviewBundleLatestTitle: string;
  localReviewBundlePersonalTeamCount: number;
  localReviewBundleQuery: string;
  localReviewBundleTitle: string;
  latestHash: string;
  latestReportKind: AuditEvidenceReportLedgerRow["reportKind"] | "";
  latestReportLabel: string;
  latestReportQuery: string;
  ready: number;
  revoked: number;
  signed: number;
  signingEligible: number;
  total: number;
  unsigned: number;
  verified: number;
}

export type PreLiveRunbookAuditCoverageStatus = "matched" | "missing" | "stale";

export interface PreLiveRunbookAuditCoverage {
  currentGateLabel: string;
  detail: string;
  gateLabel: string;
  latestEventId: string;
  mismatchLabel: string;
  query: string;
  shortHash: string;
  status: PreLiveRunbookAuditCoverageStatus;
  statusLabel: string;
}

export type OperatorRunbookAuditCoverageStatus = "matched" | "missing" | "stale";

export interface OperatorRunbookAuditCoverage {
  currentSectionLabel: string;
  detail: string;
  latestEventId: string;
  mismatchLabel: string;
  query: string;
  sectionLabel: string;
  shortHash: string;
  status: OperatorRunbookAuditCoverageStatus;
  statusLabel: string;
}

export interface LatestAuditAidCurrentGapActionDescriptor {
  actionId: string;
  actionLabel: string;
  deepLinkSearch: string;
  executableActionId: string;
  query: string;
  targetWorkspaceId: ProductWorkAreaId | null;
  workspaceId: ProductWorkAreaId | null;
}

export interface P0CurrentGapActionDeepLinkState {
  actionId: string;
  auditReportQuery: string;
  executableActionId: string;
  targetWorkspaceId: ProductWorkAreaId;
}

export interface P0CompletionGapDeepLinkState {
  auditReportQuery: string;
  targetWorkspaceId: ProductWorkAreaId;
}

export type LocalReviewCoverageNextActionId =
  | "record-daily-ops-review"
  | "record-daily-start-review"
  | "record-stage1-archive-review"
  | "record-personal-team-review"
  | "unknown";

export type LocalReviewCoverageMissingReviewKind =
  | "daily-ops"
  | "daily-start"
  | "stage1-archive"
  | "personal-team"
  | "empty"
  | "unknown";

export interface LocalReviewCoverageNextActionDeepLinkState {
  actionId: LocalReviewCoverageNextActionId;
  auditReportQuery: string;
  missingReviewKind: LocalReviewCoverageMissingReviewKind;
  targetWorkspaceId: ProductWorkAreaId;
}

export type P0CurrentGapActionReadinessReason =
  | "missing-action"
  | "missing-workspace"
  | "not-ready-report"
  | "ready"
  | "unknown-action";

export interface P0CurrentGapActionReadiness {
  actionId: string;
  canExecute: boolean;
  executableActionId: string;
  reason: P0CurrentGapActionReadinessReason;
  targetWorkspaceId: ProductWorkAreaId | null;
  workspaceId: ProductWorkAreaId | null;
}

export function buildLatestAuditAidCurrentGapActionDescriptor(
  summary: AuditEvidenceReportLedgerSummary
): LatestAuditAidCurrentGapActionDescriptor | null {
  const actionId = summary.latestAuditAidCurrentGapActionId.trim();
  const actionLabel = summary.latestAuditAidCurrentGapActionLabel.trim();
  const recordedDeepLinkSearch = buildP0CurrentGapActionUrlSearch(summary.latestAuditAidCurrentGapDeepLinkSearch);
  const recordedDeepLinkState = resolveP0CurrentGapActionDeepLinkState(summary.latestAuditAidCurrentGapDeepLinkSearch);
  const readiness = buildLatestAuditAidCurrentGapActionReadiness(summary);
  if (!readiness.canExecute) {
    return null;
  }
  const fallbackQuery = [
    "p0_readiness_report",
    summary.latestAuditAidRunId,
    summary.latestAuditAidShortHash,
    actionId,
    readiness.targetWorkspaceId ?? ""
  ]
    .filter(Boolean)
    .join(" ");
  const query = recordedDeepLinkState?.auditReportQuery || summary.latestAuditAidReportQuery || fallbackQuery;
  const deepLinkParams = new URLSearchParams();
  deepLinkParams.set("workspace", readiness.targetWorkspaceId ?? readiness.workspaceId ?? "audit");
  if (query) {
    deepLinkParams.set("auditReportQuery", query);
  }
  if (actionId) {
    deepLinkParams.set("p0Action", actionId);
  }
  return {
    actionId,
    actionLabel: actionLabel || actionId,
    deepLinkSearch: recordedDeepLinkSearch ?? buildP0CurrentGapActionUrlSearch(deepLinkParams) ?? deepLinkParams.toString(),
    executableActionId: readiness.executableActionId,
    query,
    targetWorkspaceId: readiness.targetWorkspaceId,
    workspaceId: readiness.workspaceId
  };
}

export function buildLatestAuditAidCurrentGapActionReadiness(
  summary: AuditEvidenceReportLedgerSummary
): P0CurrentGapActionReadiness {
  const recordedWorkspaceId = resolveP0CurrentGapActionLinkWorkspace(summary.latestAuditAidCurrentGapDeepLinkSearch);
  const computedReadiness = buildP0CurrentGapActionReadiness({
    actionId: summary.latestAuditAidCurrentGapActionId,
    targetWorkspaceId:
      summary.latestAuditAidCurrentGapTargetWorkspaceId ??
      summary.latestAuditAidCurrentGapWorkspaceId ??
      recordedWorkspaceId,
    workspaceId: summary.latestAuditAidCurrentGapWorkspaceId ?? recordedWorkspaceId
  });
  if (!summary.latestAuditAidEventId) {
    return computedReadiness;
  }
  return {
    ...computedReadiness,
    canExecute: summary.latestAuditAidCurrentGapCanExecute,
    executableActionId: summary.latestAuditAidCurrentGapExecutableActionId || computedReadiness.executableActionId,
    reason: summary.latestAuditAidCurrentGapReadinessReason
  };
}

export function buildAuditEvidenceReportLedgerRowCurrentGapActionDescriptor(
  row: AuditEvidenceReportLedgerRow | null | undefined
): LatestAuditAidCurrentGapActionDescriptor | null {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return null;
  }
  const actionId = row.p0CurrentGapActionId.trim();
  const actionLabel = row.p0CurrentGapActionLabel.trim();
  const recordedDeepLinkSearch = buildP0CurrentGapActionUrlSearch(row.p0CurrentGapDeepLinkSearch);
  const recordedDeepLinkState = resolveP0CurrentGapActionDeepLinkState(row.p0CurrentGapDeepLinkSearch);
  const readiness = buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness(row);
  if (!readiness.canExecute) {
    return null;
  }
  const fallbackQuery = auditReportLedgerLatestAuditAidReportQuery(row);
  const query = recordedDeepLinkState?.auditReportQuery || fallbackQuery;
  const deepLinkParams = new URLSearchParams();
  deepLinkParams.set("workspace", readiness.targetWorkspaceId ?? readiness.workspaceId ?? "audit");
  if (query) {
    deepLinkParams.set("auditReportQuery", query);
  }
  if (actionId) {
    deepLinkParams.set("p0Action", actionId);
  }
  return {
    actionId,
    actionLabel: actionLabel || actionId,
    deepLinkSearch: recordedDeepLinkSearch ?? buildP0CurrentGapActionUrlSearch(deepLinkParams) ?? deepLinkParams.toString(),
    executableActionId: readiness.executableActionId,
    query,
    targetWorkspaceId: readiness.targetWorkspaceId,
    workspaceId: readiness.workspaceId
  };
}

export function buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness(
  row: AuditEvidenceReportLedgerRow | null | undefined
): P0CurrentGapActionReadiness {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return {
      actionId: row?.p0CurrentGapActionId?.trim() ?? "",
      canExecute: false,
      executableActionId: normalizeP0CurrentGapActionId(row?.p0CurrentGapActionId ?? ""),
      reason: "not-ready-report",
      targetWorkspaceId: null,
      workspaceId: null
    };
  }
  const recordedWorkspaceId = resolveP0CurrentGapActionLinkWorkspace(row.p0CurrentGapDeepLinkSearch);
  const computedReadiness = buildP0CurrentGapActionReadiness({
    actionId: row.p0CurrentGapActionId,
    targetWorkspaceId: row.p0CurrentGapTargetWorkspaceId ?? row.p0CurrentGapWorkspaceId ?? recordedWorkspaceId,
    workspaceId: row.p0CurrentGapWorkspaceId ?? recordedWorkspaceId
  });
  return {
    ...computedReadiness,
    canExecute: row.p0CurrentGapCanExecute,
    executableActionId: row.p0CurrentGapExecutableActionId || computedReadiness.executableActionId,
    reason: row.p0CurrentGapReadinessReason
  };
}

export function buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report") {
    return "";
  }
  if (!row.p0BacklogReadinessRecorded) {
    return "P0 backlog readiness: not recorded";
  }
  const recordedSummary = row.p0BacklogReadinessSummary.trim();
  if (recordedSummary) {
    return `P0 backlog readiness: ${recordedSummary}`;
  }
  const executableCount = Math.max(0, row.p0BacklogExecutableCount);
  const notExecutableCount = Math.max(0, row.p0BacklogNotExecutableCount);
  const totalCount = Math.max(0, row.p0BacklogTotalCount, executableCount + notExecutableCount);
  if (totalCount <= 0) {
    return "P0 backlog readiness: 0/0 executable, 0 not executable · no open backlog";
  }
  const firstBacklogAction = row.p0FirstBacklogExecutableActionId.trim() || row.p0FirstBacklogReadinessReason;
  return `P0 backlog readiness: ${executableCount}/${totalCount} executable, ${notExecutableCount} not executable · first ${firstBacklogAction} ${row.p0FirstBacklogReadinessReason}`;
}

export function buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const label = buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel(row);
  if (!label) {
    return "";
  }
  if (!row || row.reportKind !== "p0_readiness_report") {
    return label;
  }
  if (!row.p0BacklogReadinessRecorded) {
    return `${label} · source: legacy report`;
  }
  return `${label} · source: ${
    row.p0BacklogReadinessSummary.trim() ? "metadata backlogReadinessSummary" : "derived backlog counters"
  }`;
}

export function buildAuditEvidenceReportLedgerRowP0BacklogReadinessQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return "";
  }
  return auditReportLedgerLatestAuditAidBacklogReadinessQuery(row);
}

export function buildAuditEvidenceReportLedgerRowP0CompletionLabel(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report") {
    return "";
  }
  if (!row.p0CompletionReadinessRecorded) {
    return "P0 completion: not recorded";
  }
  const recordedSummary = row.p0CompletionSummary.trim();
  if (recordedSummary) {
    return `P0 completion: ${recordedSummary}`;
  }
  const currentCriterion = row.p0CompletionCurrentCriterionId || row.p0CompletionCurrentCriterionLabel || "none";
  const currentStatus = row.p0CompletionCurrentCriterionStatus || "unknown";
  return `P0 completion: ${row.p0CompletionPassedCount}/${row.p0CompletionTotalCount} passed, ${row.p0CompletionReviewCount} review, ${row.p0CompletionBlockedCount} blocked · current ${currentCriterion} ${currentStatus}`;
}

export function buildAuditEvidenceReportLedgerRowP0CompletionTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const label = buildAuditEvidenceReportLedgerRowP0CompletionLabel(row);
  if (!label) {
    return "";
  }
  if (!row || row.reportKind !== "p0_readiness_report") {
    return label;
  }
  if (!row.p0CompletionReadinessRecorded) {
    return `${label} · source: legacy report`;
  }
  return `${label} · source: ${
    row.p0CompletionSummary.trim() ? "metadata completionSummary" : "derived completion counters"
  }`;
}

export function buildAuditEvidenceReportLedgerRowP0CompletionQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return "";
  }
  return auditReportLedgerLatestAuditAidCompletionQuery(row);
}

export function buildAuditEvidenceReportLedgerRowP0ReadinessReportQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return "";
  }
  return auditReportLedgerLatestAuditAidReportQuery(row);
}

export function buildAuditEvidenceReportLedgerRowP0ProgressQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return "";
  }
  const baseQuery = auditReportLedgerLatestAuditAidBaseQuery(row);
  const progressQuery = [
    "p0-progress-focus",
    row.focusQuery ? "p0-state" : "",
    row.focusQuery,
    row.packageTotal > 0 ? `p0-progress ${row.packageMatched}/${row.packageTotal}` : ""
  ]
    .filter(Boolean)
    .join(" ");
  return [baseQuery, progressQuery].filter(Boolean).join(" ");
}

export function buildAuditEvidenceReportLedgerRowP0PreflightQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return "";
  }
  return auditReportLedgerLatestAuditAidPreflightQuery(row);
}

export function buildAuditEvidenceReportLedgerRowCurrentGapReadinessQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return "";
  }
  return auditReportLedgerLatestAuditAidCurrentGapReadinessQuery(row);
}

export function buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report" || row.status !== "ready") {
    return "";
  }
  const readiness = buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness(row);
  const state = readiness.canExecute ? "executable" : "not executable";
  const workspace = readiness.targetWorkspaceId ?? readiness.workspaceId;
  return [
    `P0 current-gap readiness: ${state}`,
    readiness.executableActionId,
    readiness.reason,
    workspace ? `workspace ${workspace}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

export function resolveP0CurrentGapActionDeepLinkState(
  search: string | URLSearchParams | null | undefined
): P0CurrentGapActionDeepLinkState | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!auditDeepLinkSearchParamsHaveSingleValues(params, ["workspace", "auditReportQuery", "p0Action"])) {
    return null;
  }
  const actionId = params.get("p0Action")?.trim() ?? "";
  const auditReportQuery = params.get("auditReportQuery")?.trim() ?? "";
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(params.get("workspace")?.trim() ?? "");
  const executableActionId = normalizeP0CurrentGapActionId(actionId);
  if (
    !targetWorkspaceId ||
    !auditReportQuery ||
    !/^[A-Za-z0-9._:-]{1,120}$/u.test(actionId) ||
    !isExecutableP0CurrentGapActionId(actionId)
  ) {
    return null;
  }
  return {
    actionId,
    auditReportQuery,
    executableActionId,
    targetWorkspaceId
  };
}

export function buildP0CurrentGapActionUrlSearch(search: string | URLSearchParams | null | undefined): string | null {
  const state = resolveP0CurrentGapActionDeepLinkState(search);
  if (!state) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("workspace", state.targetWorkspaceId);
  params.set("auditReportQuery", state.auditReportQuery);
  params.set("p0Action", state.actionId);
  return params.toString();
}

export function resolveP0CompletionGapDeepLinkState(
  search: string | URLSearchParams | null | undefined
): P0CompletionGapDeepLinkState | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!auditDeepLinkSearchParamsHaveSingleValues(params, ["workspace", "auditReportQuery"])) {
    return null;
  }
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(params.get("workspace")?.trim() ?? "");
  const auditReportQuery = params.get("auditReportQuery")?.trim() ?? "";
  if (!targetWorkspaceId || !auditReportQuery || !auditReportQuery.includes("p0-completion-focus")) {
    return null;
  }
  return {
    auditReportQuery,
    targetWorkspaceId
  };
}

export function buildP0CompletionGapUrlSearch(input: {
  auditReportQuery: string | null | undefined;
  targetWorkspaceId: ProductWorkAreaId | string | null | undefined;
}): string | null {
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(input.targetWorkspaceId?.trim() ?? "");
  const auditReportQuery = input.auditReportQuery?.trim() ?? "";
  if (!targetWorkspaceId || !auditReportQuery || !auditReportQuery.includes("p0-completion-focus")) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("workspace", targetWorkspaceId);
  params.set("auditReportQuery", auditReportQuery);
  return params.toString();
}

export function resolveLocalReviewCoverageNextActionDeepLinkState(
  search: string | URLSearchParams | null | undefined
): LocalReviewCoverageNextActionDeepLinkState | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!auditDeepLinkSearchParamsHaveSingleValues(params, ["workspace", "auditReportQuery"])) {
    return null;
  }
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(params.get("workspace")?.trim() ?? "");
  const auditReportQuery = params.get("auditReportQuery")?.trim() ?? "";
  if (!targetWorkspaceId || !localReviewCoverageNextActionQueryHasSingleStructure(auditReportQuery)) {
    return null;
  }
  if (targetWorkspaceId !== LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID) {
    return null;
  }
  const actionId = resolveLocalReviewCoverageNextActionId(auditReportQuery);
  const missingReviewKind = resolveLocalReviewCoverageMissingReviewKind(auditReportQuery);
  if (
    actionId === "unknown" ||
    missingReviewKind === "unknown" ||
    !localReviewCoverageNextActionMatchesMissingReviewKind(actionId, missingReviewKind, auditReportQuery)
  ) {
    return null;
  }
  return {
    actionId,
    auditReportQuery,
    missingReviewKind,
    targetWorkspaceId
  };
}

export function auditDeepLinkSearchParamsHaveSingleValues(params: URLSearchParams, keys: string[]): boolean {
  return keys.every((key) => params.getAll(key).length === 1);
}

export const LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID: ProductWorkAreaId = "research";

export function resolveLocalReviewCoverageNextActionId(auditReportQuery: string): LocalReviewCoverageNextActionId {
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "record-daily-ops-review")) {
    return "record-daily-ops-review";
  }
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "record-daily-start-review")) {
    return "record-daily-start-review";
  }
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "record-stage1-archive-review")) {
    return "record-stage1-archive-review";
  }
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "record-personal-team-review")) {
    return "record-personal-team-review";
  }
  return "unknown";
}

export function resolveLocalReviewCoverageMissingReviewKind(
  auditReportQuery: string
): LocalReviewCoverageMissingReviewKind {
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "local-review-bundle-empty")) {
    return "empty";
  }
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "local-review-bundle-daily-ops-missing")) {
    return "daily-ops";
  }
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "local-review-bundle-daily-start-missing")) {
    return "daily-start";
  }
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "local-review-bundle-stage1-archive-missing")) {
    return "stage1-archive";
  }
  if (localReviewCoverageQueryIncludesToken(auditReportQuery, "local-review-bundle-personal-missing")) {
    return "personal-team";
  }
  return "unknown";
}

export function localReviewCoverageNextActionMatchesMissingReviewKind(
  actionId: LocalReviewCoverageNextActionId,
  missingReviewKind: LocalReviewCoverageMissingReviewKind,
  auditReportQuery: string
): boolean {
  const dailyOpsMissingCount = localReviewCoverageQueryTokenCount(
    auditReportQuery,
    "local-review-bundle-daily-ops-missing"
  );
  const personalMissingCount = localReviewCoverageQueryTokenCount(
    auditReportQuery,
    "local-review-bundle-personal-missing"
  );
  const dailyStartMissingCount = localReviewCoverageQueryTokenCount(
    auditReportQuery,
    "local-review-bundle-daily-start-missing"
  );
  const stage1ArchiveMissingCount = localReviewCoverageQueryTokenCount(
    auditReportQuery,
    "local-review-bundle-stage1-archive-missing"
  );
  const emptyBundleCount = localReviewCoverageQueryTokenCount(auditReportQuery, "local-review-bundle-empty");

  if (actionId === "record-daily-ops-review") {
    return (
      missingReviewKind === "daily-ops" &&
      dailyOpsMissingCount === 1 &&
      personalMissingCount === 0 &&
      dailyStartMissingCount === 0 &&
      stage1ArchiveMissingCount === 0 &&
      emptyBundleCount === 0
    );
  }
  if (actionId === "record-daily-start-review") {
    return (
      missingReviewKind === "daily-start" &&
      dailyStartMissingCount === 1 &&
      dailyOpsMissingCount === 0 &&
      personalMissingCount === 0 &&
      stage1ArchiveMissingCount === 0 &&
      emptyBundleCount === 0
    );
  }
  if (actionId === "record-stage1-archive-review") {
    return (
      missingReviewKind === "stage1-archive" &&
      stage1ArchiveMissingCount === 1 &&
      dailyStartMissingCount === 0 &&
      dailyOpsMissingCount === 0 &&
      personalMissingCount === 0 &&
      emptyBundleCount === 0
    );
  }
  if (actionId === "record-personal-team-review" && missingReviewKind === "personal-team") {
    return (
      personalMissingCount === 1 &&
      dailyOpsMissingCount === 0 &&
      dailyStartMissingCount === 0 &&
      stage1ArchiveMissingCount === 0 &&
      emptyBundleCount === 0
    );
  }
  if (actionId === "record-personal-team-review" && missingReviewKind === "empty") {
    return (
      emptyBundleCount === 1 &&
      personalMissingCount === 1 &&
      dailyOpsMissingCount === 0 &&
      dailyStartMissingCount === 0 &&
      stage1ArchiveMissingCount === 0
    );
  }
  return false;
}
