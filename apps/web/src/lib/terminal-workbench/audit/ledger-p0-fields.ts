import { buildP0CurrentGapActionUrlSearch } from "./deep-link-queries";
import { buildP0CurrentGapActionReadiness, resolveP0CurrentGapActionLinkWorkspace } from "./execution-contracts";
import { buildAuditEvidenceReportLedgerBaseFields } from "./ledger-base-fields";
import { buildAuditEvidenceReportLedgerVerificationFields } from "./ledger-verification-fields";
import { auditReportLedgerPaperPreflightLabel } from "./local-review-markers";
import type { AuditEvidenceReportLedgerEventRecord } from "./report-contracts";
import { auditReportLedgerMetadataBoolean, auditReportLedgerMetadataHas, auditReportLedgerMetadataNumber, auditReportLedgerMetadataText, auditReportLedgerP0CompletionCriterionStatus, auditReportLedgerP0ReadinessReason } from "./signing-key-ledger";
import { auditReportLedgerProductWorkAreaId } from "../research-package/import-audit";

export function buildAuditEvidenceReportLedgerP0Fields(
  event: AuditEvidenceReportLedgerEventRecord,
  context: ReturnType<typeof buildAuditEvidenceReportLedgerBaseFields> & ReturnType<typeof buildAuditEvidenceReportLedgerVerificationFields>
) {
  const { reportKind, contentSha256, artifactKind, fileName, shortHash, focusQuery, isHashReady, status, signature, signatureStatus, signatureLabel, importVerificationVerified, importVerificationInvalid, importVerificationDetail } = context;
  const paperPreflightState =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "paperPreflightState") : "";
  const paperPreflightActionId =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "paperPreflightActionId") : "";
  const paperPreflightActionLabel =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "paperPreflightActionLabel") : "";
  const paperPreflightGateTotal =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "paperPreflightGateTotal") : 0;
  const paperPreflightGatePassedCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "paperPreflightGatePassedCount") : 0;
  const paperPreflightGateReviewCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "paperPreflightGateReviewCount") : 0;
  const paperPreflightGateBlockedCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "paperPreflightGateBlockedCount") : 0;
  const paperPreflightLiveBoundary =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "paperPreflightLiveBoundary") : "";
  const p0PreparationEvidenceRunId =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerMetadataText(event.metadata, "latestEvidencePreparationRunId")
      : "";
  const p0BacklogReadinessRecorded =
    reportKind === "p0_readiness_report" &&
    [
      "backlogCount",
      "backlogExecutableCount",
      "backlogNotExecutableCount",
      "firstBacklogCanExecute",
      "firstBacklogExecutableActionId",
      "firstBacklogReadinessReason",
      "firstBacklogStepId",
      "backlogReadinessSummary"
    ].some((key) => auditReportLedgerMetadataHas(event.metadata, key));
  const p0BacklogReadinessSummary =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "backlogReadinessSummary") : "";
  const p0BacklogExecutableCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "backlogExecutableCount") : 0;
  const p0BacklogNotExecutableCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "backlogNotExecutableCount") : 0;
  const p0BacklogTotalCount =
    reportKind === "p0_readiness_report"
      ? Math.max(
          auditReportLedgerMetadataNumber(event.metadata, "backlogCount"),
          p0BacklogExecutableCount + p0BacklogNotExecutableCount
        )
      : 0;
  const p0CompletionReadinessRecorded =
    reportKind === "p0_readiness_report" &&
    [
      "completionBlockedCount",
      "completionCurrentCriterionId",
      "completionCurrentCriterionLabel",
      "completionCurrentCriterionStatus",
      "completionOpenCriterionIds",
      "completionPassedCount",
      "completionProgressPct",
      "completionReviewCount",
      "completionSummary",
      "completionTotalCount"
    ].some((key) => auditReportLedgerMetadataHas(event.metadata, key));
  const p0CompletionBlockedCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "completionBlockedCount") : 0;
  const p0CompletionCurrentCriterionActionLabel =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerMetadataText(event.metadata, "completionCurrentCriterionActionLabel")
      : "";
  const p0CompletionCurrentCriterionId =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "completionCurrentCriterionId") : "";
  const p0CompletionCurrentCriterionLabel =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "completionCurrentCriterionLabel") : "";
  const p0CompletionCurrentCriterionStatus =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerP0CompletionCriterionStatus(
          auditReportLedgerMetadataText(event.metadata, "completionCurrentCriterionStatus")
        )
      : "";
  const p0CompletionCurrentCriterionTargetWorkspaceId =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerProductWorkAreaId(
          auditReportLedgerMetadataText(event.metadata, "completionCurrentCriterionTargetWorkspaceId")
        )
      : null;
  const p0CompletionOpenCriterionIds =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "completionOpenCriterionIds") : "";
  const p0CompletionPassedCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "completionPassedCount") : 0;
  const p0CompletionProgressPct =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "completionProgressPct") : 0;
  const p0CompletionReviewCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "completionReviewCount") : 0;
  const p0CompletionSummary =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "completionSummary") : "";
  const p0CompletionTotalCount =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataNumber(event.metadata, "completionTotalCount") : 0;
  const p0FirstBacklogCanExecute =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataBoolean(event.metadata, "firstBacklogCanExecute") : false;
  const p0FirstBacklogExecutableActionId =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "firstBacklogExecutableActionId") : "";
  const p0FirstBacklogReadinessReason =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerP0ReadinessReason(
          auditReportLedgerMetadataText(event.metadata, "firstBacklogReadinessReason"),
          "missing-action"
        )
      : "not-ready-report";
  const p0CurrentGapActionId =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "currentGapActionId") : "";
  const p0CurrentGapActionLabel =
    reportKind === "p0_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "currentGapActionLabel") : "";
  const p0CurrentGapTargetWorkspaceId =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerProductWorkAreaId(auditReportLedgerMetadataText(event.metadata, "currentGapTargetWorkspaceId"))
      : null;
  const p0CurrentGapWorkspaceId =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerProductWorkAreaId(auditReportLedgerMetadataText(event.metadata, "currentGapWorkspaceId"))
      : null;
  const p0CurrentGapFallbackParams = new URLSearchParams();
  p0CurrentGapFallbackParams.set("workspace", p0CurrentGapTargetWorkspaceId ?? p0CurrentGapWorkspaceId ?? "audit");
  p0CurrentGapFallbackParams.set(
    "auditReportQuery",
    [
      reportKind,
      event.runId ?? "unknown",
      shortHash,
      fileName,
      p0PreparationEvidenceRunId,
      p0CurrentGapActionId,
      p0CurrentGapTargetWorkspaceId ?? ""
    ]
      .filter(Boolean)
      .join(" ")
  );
  p0CurrentGapFallbackParams.set("p0Action", p0CurrentGapActionId);
  const p0CurrentGapDeepLinkSearch =
    reportKind === "p0_readiness_report"
    ? buildP0CurrentGapActionUrlSearch(auditReportLedgerMetadataText(event.metadata, "currentGapDeepLinkSearch")) ??
      buildP0CurrentGapActionUrlSearch(p0CurrentGapFallbackParams) ??
      ""
    : "";
  const p0CurrentGapDeepLinkWorkspaceId = resolveP0CurrentGapActionLinkWorkspace(p0CurrentGapDeepLinkSearch);
  const p0CurrentGapComputedReadiness = buildP0CurrentGapActionReadiness({
    actionId: p0CurrentGapActionId,
    targetWorkspaceId: p0CurrentGapTargetWorkspaceId ?? p0CurrentGapWorkspaceId ?? p0CurrentGapDeepLinkWorkspaceId,
    workspaceId: p0CurrentGapWorkspaceId ?? p0CurrentGapDeepLinkWorkspaceId
  });
  const p0CurrentGapExecutableActionId =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerMetadataText(event.metadata, "currentGapExecutableActionId") ||
        p0CurrentGapComputedReadiness.executableActionId
      : "";
  const p0CurrentGapCanExecute =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerMetadataBoolean(event.metadata, "currentGapCanExecute", p0CurrentGapComputedReadiness.canExecute)
      : false;
  const p0CurrentGapReadinessReason =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerP0ReadinessReason(
          auditReportLedgerMetadataText(event.metadata, "currentGapReadinessReason"),
          p0CurrentGapComputedReadiness.reason
        )
      : "not-ready-report";
  const paperPreflightLabel = auditReportLedgerPaperPreflightLabel({
    actionLabel: paperPreflightActionLabel,
    blocked: paperPreflightGateBlockedCount,
    liveBoundary: paperPreflightLiveBoundary,
    passed: paperPreflightGatePassedCount,
    review: paperPreflightGateReviewCount,
    state: paperPreflightState,
    total: paperPreflightGateTotal
  });
  const p0SearchText =
    reportKind === "p0_readiness_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "currentGapStepId"),
          auditReportLedgerMetadataText(event.metadata, "currentGapLabel"),
          auditReportLedgerMetadataText(event.metadata, "currentGapStatus"),
          p0CurrentGapWorkspaceId ?? "",
          p0CurrentGapActionId,
          p0CurrentGapActionLabel,
          p0CurrentGapExecutableActionId,
          "current-gap",
          p0CurrentGapCanExecute ? "current-gap-executable" : "current-gap-not-executable",
          p0CurrentGapCanExecute ? "executable" : "not-executable",
          p0CurrentGapReadinessReason,
          "backlog",
          p0BacklogReadinessRecorded ? "backlog-recorded" : "backlog-not-recorded",
          `backlog total ${p0BacklogTotalCount}`,
          `executable ${p0BacklogExecutableCount}`,
          `not-executable ${p0BacklogNotExecutableCount}`,
          p0FirstBacklogCanExecute ? "first-backlog-executable" : "first-backlog-not-executable",
          p0FirstBacklogExecutableActionId,
          p0FirstBacklogReadinessReason,
          p0BacklogReadinessSummary.trim() ? "backlog-summary-recorded" : "backlog-summary-missing",
          p0BacklogReadinessSummary,
          "p0-completion-focus",
          "completion",
          p0CompletionReadinessRecorded ? "completion-recorded" : "completion-not-recorded",
          `completion ${p0CompletionPassedCount}/${p0CompletionTotalCount}`,
          `completion-progress ${p0CompletionProgressPct}`,
          `completion-review ${p0CompletionReviewCount}`,
          `completion-blocked ${p0CompletionBlockedCount}`,
          p0CompletionCurrentCriterionId,
          p0CompletionCurrentCriterionLabel,
          p0CompletionCurrentCriterionStatus,
          p0CompletionCurrentCriterionActionLabel,
          p0CompletionCurrentCriterionTargetWorkspaceId ?? "",
          p0CompletionOpenCriterionIds,
          p0CompletionSummary.trim() ? "completion-summary-recorded" : "completion-summary-missing",
          p0CompletionSummary,
          p0CurrentGapDeepLinkSearch,
          p0CurrentGapTargetWorkspaceId ?? "",
          auditReportLedgerMetadataText(event.metadata, "firstBacklogStepId"),
          auditReportLedgerMetadataText(event.metadata, "latestEvidenceState"),
          auditReportLedgerMetadataText(event.metadata, "latestEvidenceLink"),
          auditReportLedgerMetadataText(event.metadata, "liveBoundary"),
          "p0-progress-focus",
          focusQuery ? "p0-state" : "",
          focusQuery,
          auditReportLedgerMetadataNumber(event.metadata, "totalSteps") > 0
            ? `p0-progress ${auditReportLedgerMetadataNumber(event.metadata, "passedSteps")}/${auditReportLedgerMetadataNumber(
                event.metadata,
                "totalSteps"
              )}`
            : "",
          paperPreflightState || paperPreflightGateTotal > 0 ? "p0-preflight-focus" : "",
          paperPreflightState,
          paperPreflightActionId,
          paperPreflightActionLabel,
          paperPreflightLabel,
          `preflight attention ${paperPreflightGateReviewCount + paperPreflightGateBlockedCount}`,
          paperPreflightLiveBoundary,
          p0PreparationEvidenceRunId,
          auditReportLedgerMetadataText(event.metadata, "boundary")
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  return { paperPreflightState, paperPreflightActionId, paperPreflightActionLabel, paperPreflightGateTotal, paperPreflightGatePassedCount, paperPreflightGateReviewCount, paperPreflightGateBlockedCount, paperPreflightLiveBoundary, p0PreparationEvidenceRunId, p0BacklogReadinessRecorded, p0BacklogReadinessSummary, p0BacklogExecutableCount, p0BacklogNotExecutableCount, p0BacklogTotalCount, p0CompletionReadinessRecorded, p0CompletionBlockedCount, p0CompletionCurrentCriterionActionLabel, p0CompletionCurrentCriterionId, p0CompletionCurrentCriterionLabel, p0CompletionCurrentCriterionStatus, p0CompletionCurrentCriterionTargetWorkspaceId, p0CompletionOpenCriterionIds, p0CompletionPassedCount, p0CompletionProgressPct, p0CompletionReviewCount, p0CompletionSummary, p0CompletionTotalCount, p0FirstBacklogCanExecute, p0FirstBacklogExecutableActionId, p0FirstBacklogReadinessReason, p0CurrentGapActionId, p0CurrentGapActionLabel, p0CurrentGapTargetWorkspaceId, p0CurrentGapWorkspaceId, p0CurrentGapFallbackParams, p0CurrentGapDeepLinkSearch, p0CurrentGapDeepLinkWorkspaceId, p0CurrentGapComputedReadiness, p0CurrentGapExecutableActionId, p0CurrentGapCanExecute, p0CurrentGapReadinessReason, paperPreflightLabel, p0SearchText };
}
