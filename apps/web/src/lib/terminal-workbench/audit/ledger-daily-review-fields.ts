import { buildAuditEvidenceReportLedgerBaseFields } from "./ledger-base-fields";
import { buildAuditEvidenceReportLedgerP0Fields } from "./ledger-p0-fields";
import { buildAuditEvidenceReportLedgerP2Fields } from "./ledger-p2-fields";
import { buildAuditEvidenceReportLedgerResearchRunbookFields } from "./ledger-research-runbook-fields";
import { buildAuditEvidenceReportLedgerVerificationFields } from "./ledger-verification-fields";
import type { AuditEvidenceReportLedgerEventRecord } from "./report-contracts";
import { auditReportLedgerLocalReviewBundleContextLabel, auditReportLedgerLocalReviewBundleContextTitle } from "./report-queries";
import { auditReportLedgerMetadataBoolean, auditReportLedgerMetadataNumber, auditReportLedgerMetadataStringList, auditReportLedgerMetadataText } from "./signing-key-ledger";

export function buildAuditEvidenceReportLedgerDailyReviewFields(
  event: AuditEvidenceReportLedgerEventRecord,
  context: ReturnType<typeof buildAuditEvidenceReportLedgerBaseFields> & ReturnType<typeof buildAuditEvidenceReportLedgerVerificationFields> & ReturnType<typeof buildAuditEvidenceReportLedgerP0Fields> & ReturnType<typeof buildAuditEvidenceReportLedgerResearchRunbookFields> & ReturnType<typeof buildAuditEvidenceReportLedgerP2Fields>
) {
  const { reportKind, contentSha256, artifactKind, fileName, shortHash, focusQuery, isHashReady, status, signature, signatureStatus, signatureLabel, importVerificationVerified, importVerificationInvalid, importVerificationDetail, paperPreflightState, paperPreflightActionId, paperPreflightActionLabel, paperPreflightGateTotal, paperPreflightGatePassedCount, paperPreflightGateReviewCount, paperPreflightGateBlockedCount, paperPreflightLiveBoundary, p0PreparationEvidenceRunId, p0BacklogReadinessRecorded, p0BacklogReadinessSummary, p0BacklogExecutableCount, p0BacklogNotExecutableCount, p0BacklogTotalCount, p0CompletionReadinessRecorded, p0CompletionBlockedCount, p0CompletionCurrentCriterionActionLabel, p0CompletionCurrentCriterionId, p0CompletionCurrentCriterionLabel, p0CompletionCurrentCriterionStatus, p0CompletionCurrentCriterionTargetWorkspaceId, p0CompletionOpenCriterionIds, p0CompletionPassedCount, p0CompletionProgressPct, p0CompletionReviewCount, p0CompletionSummary, p0CompletionTotalCount, p0FirstBacklogCanExecute, p0FirstBacklogExecutableActionId, p0FirstBacklogReadinessReason, p0CurrentGapActionId, p0CurrentGapActionLabel, p0CurrentGapTargetWorkspaceId, p0CurrentGapWorkspaceId, p0CurrentGapFallbackParams, p0CurrentGapDeepLinkSearch, p0CurrentGapDeepLinkWorkspaceId, p0CurrentGapComputedReadiness, p0CurrentGapExecutableActionId, p0CurrentGapCanExecute, p0CurrentGapReadinessReason, paperPreflightLabel, p0SearchText, preLiveRunbookSearchText, researchContextMarket, researchContextSymbol, researchContextTimeframe, researchContextPreflightStatus, researchContextNextAction, researchContextPreparationEvidenceRunId, researchContextRecordedLink, researchContextFallbackParams, researchContextLinkSearch, researchContextLinkDecodedSearch, researchContextLinkLabel, researchContextSearchText, evidenceLinkSearch, evidenceLinkStatus, evidenceTargetWorkspaceId, evidenceLinkDecodedSearch, operatorRunbookAdapterId, operatorRunbookMarket, operatorRunbookSymbol, operatorRunbookTimeframe, operatorRunbookStatus, operatorRunbookCompletedSections, operatorRunbookTotalSections, operatorRunbookNextActionId, operatorRunbookSectionIds, operatorRunbookSectionStatuses, operatorRunbookSectionEvidence, operatorRunbookControlSnapshot, operatorRunbookSearchText, preLiveRunbookAdapterId, preLiveRunbookMarket, preLiveRunbookSymbol, preLiveRunbookTimeframe, preLiveRunbookStatus, preLiveRunbookCompletedSteps, preLiveRunbookTotalSteps, preLiveRunbookNextStep, preLiveRunbookNextStepId, preLiveRunbookEvidenceIds, isP2ManifestChainPreflightReport, p2ManifestChainPreflightStatus, p2ManifestChainPreflightNextAction, p2ManifestChainPreflightBlockers, p2ManifestChainPreflightValidStages, p2ManifestChainPreflightTotalStages, p2ManifestChainPreflightSafeBoundary, p2ManifestChainPreflightSearchText, p2ReadinessEvidenceCoverageReviewStatus, p2ReadinessEvidenceCoverageReviewSafeBoundary, p2ReadinessEvidenceCoverageReviewSearchText, p2ReadinessAcceptanceGeneratedStatus, p2ReadinessAcceptanceGeneratedRunId, p2ReadinessAcceptanceGeneratedAcceptedCriteria, p2ReadinessAcceptanceGeneratedTotalCriteria, p2ReadinessAcceptanceGeneratedMarket, p2ReadinessAcceptanceGeneratedSymbol, p2ReadinessAcceptanceGeneratedTimeframe, p2ReadinessAcceptanceGeneratedSafeBoundary, p2ReadinessAcceptanceGeneratedSearchText, p2ReadinessAcceptanceReviewStatus, p2ReadinessAcceptanceReviewRunId, p2ReadinessAcceptanceReviewSafeBoundary, p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId, p2ReadinessAcceptanceCoverageReviewLinkLabel, p2ReadinessAcceptanceCoverageReviewLinkQuery, p2ReadinessReviewChainLabel, p2ReadinessReviewChainQuery, p2ReadinessAcceptanceReviewSearchText } = context;
  const personalTeamReadinessReviewState =
    reportKind === "personal_team_readiness_review"
      ? auditReportLedgerMetadataText(event.metadata, "state") || event.stage
      : "";
  const personalTeamReadinessReviewPersonalPercent =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataNumber(event.metadata, "personalPercent") : 0;
  const personalTeamReadinessReviewTeamPercent =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataNumber(event.metadata, "teamPercent") : 0;
  const personalTeamReadinessReviewReadyCount =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataNumber(event.metadata, "readyCount") : 0;
  const personalTeamReadinessReviewTotalCount =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataNumber(event.metadata, "totalCount") : 0;
  const personalTeamReadinessReviewItemIds =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataStringList(event.metadata, "itemIds") : [];
  const personalTeamReadinessReviewItemStatuses =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataStringList(event.metadata, "itemStatuses") : [];
  const personalTeamReadinessReviewOpenItemIds =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataStringList(event.metadata, "openItemIds") : [];
  const personalTeamReadinessReviewNextActionLabel =
    reportKind === "personal_team_readiness_review" ? auditReportLedgerMetadataText(event.metadata, "nextActionLabel") : "";
  const personalTeamReadinessReviewNextActionWorkspaceId =
    reportKind === "personal_team_readiness_review"
      ? auditReportLedgerMetadataText(event.metadata, "nextActionWorkspaceId")
      : "";
  const personalTeamReadinessReviewSearchText =
    reportKind === "personal_team_readiness_review"
      ? [
          "personal_team_readiness_review",
          "local-review-bundle",
          personalTeamReadinessReviewState,
          `${personalTeamReadinessReviewReadyCount}/${personalTeamReadinessReviewTotalCount}`,
          `personal ${personalTeamReadinessReviewPersonalPercent}`,
          `team ${personalTeamReadinessReviewTeamPercent}`,
          personalTeamReadinessReviewNextActionLabel,
          personalTeamReadinessReviewNextActionWorkspaceId,
          personalTeamReadinessReviewItemIds.join(" "),
          personalTeamReadinessReviewItemStatuses.join(" "),
          personalTeamReadinessReviewOpenItemIds.join(" "),
          auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const dailyOpsControlRoomReviewState =
    reportKind === "daily_ops_control_room_review"
      ? auditReportLedgerMetadataText(event.metadata, "state") || event.stage
      : "";
  const dailyOpsControlRoomReviewReadyCount =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataNumber(event.metadata, "readyCount") : 0;
  const dailyOpsControlRoomReviewReviewCount =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataNumber(event.metadata, "reviewCount") : 0;
  const dailyOpsControlRoomReviewBlockingCount =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataNumber(event.metadata, "blockingCount") : 0;
  const dailyOpsControlRoomReviewTotalCount =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataNumber(event.metadata, "totalCount") : 0;
  const dailyOpsControlRoomReviewQueueItemIds =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataStringList(event.metadata, "queueItemIds") : [];
  const dailyOpsControlRoomReviewQueueItemStatuses =
    reportKind === "daily_ops_control_room_review"
      ? auditReportLedgerMetadataStringList(event.metadata, "queueItemStatuses")
      : [];
  const dailyOpsControlRoomReviewOpenItemIds =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataStringList(event.metadata, "openItemIds") : [];
  const dailyOpsControlRoomReviewPrimaryActionLabel =
    reportKind === "daily_ops_control_room_review"
      ? auditReportLedgerMetadataText(event.metadata, "primaryActionLabel")
      : "";
  const dailyOpsControlRoomReviewPrimaryActionWorkspaceId =
    reportKind === "daily_ops_control_room_review"
      ? auditReportLedgerMetadataText(event.metadata, "primaryActionWorkspaceId")
      : "";
  const dailyOpsControlRoomReviewAuditQueryLabel =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataText(event.metadata, "auditQueryLabel") : "";
  const dailyOpsControlRoomReviewAuditQuery =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataText(event.metadata, "auditQuery") : "";
  const dailyOpsControlRoomReviewAuditQueryTitle =
    reportKind === "daily_ops_control_room_review" ? auditReportLedgerMetadataText(event.metadata, "auditQueryTitle") : "";
  const dailyOpsControlRoomReviewSearchText =
    reportKind === "daily_ops_control_room_review"
      ? [
          "daily_ops_control_room_review",
          "local-review-bundle",
          dailyOpsControlRoomReviewState,
          `${dailyOpsControlRoomReviewReadyCount}/${dailyOpsControlRoomReviewTotalCount}`,
          `review ${dailyOpsControlRoomReviewReviewCount}`,
          `blocked ${dailyOpsControlRoomReviewBlockingCount}`,
          dailyOpsControlRoomReviewPrimaryActionLabel,
          dailyOpsControlRoomReviewPrimaryActionWorkspaceId,
          dailyOpsControlRoomReviewAuditQueryLabel,
          dailyOpsControlRoomReviewAuditQuery,
          dailyOpsControlRoomReviewAuditQueryTitle,
          dailyOpsControlRoomReviewQueueItemIds.join(" "),
          dailyOpsControlRoomReviewQueueItemStatuses.join(" "),
          dailyOpsControlRoomReviewOpenItemIds.join(" "),
          auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const dailyStartBriefReviewState =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "state") || event.stage : "";
  const dailyStartBriefReviewCurrentReviewCount =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataNumber(event.metadata, "currentReviewCount") : 0;
  const dailyStartBriefReviewStaleReviewCount =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataNumber(event.metadata, "staleReviewCount") : 0;
  const dailyStartBriefReviewMissingReviewCount =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataNumber(event.metadata, "missingReviewCount") : 0;
  const dailyStartBriefReviewOpenOpsItemCount =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataNumber(event.metadata, "openOpsItemCount") : 0;
  const dailyStartBriefReviewPrimaryActionLabel =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "primaryActionLabel") : "";
  const dailyStartBriefReviewPrimaryActionWorkspaceId =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "primaryActionWorkspaceId") : "";
  const dailyStartBriefReviewAuditQuery =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "auditQuery") : "";
  const dailyStartBriefReviewAuditQueryTitle =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "auditQueryTitle") : "";
  const dailyStartBriefReviewLocalReviewStatus =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "localReviewStatus") : "";
  const dailyStartBriefReviewLocalReviewActionLabel =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "localReviewActionLabel") : "";
  const dailyStartBriefReviewLocalReviewQuery =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataText(event.metadata, "localReviewQuery") : "";
  const dailyStartBriefReviewCheckpointIds =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataStringList(event.metadata, "checkpointIds") : [];
  const dailyStartBriefReviewCheckpointStatuses =
    reportKind === "daily_start_brief_review" ? auditReportLedgerMetadataStringList(event.metadata, "checkpointStatuses") : [];
  const dailyStartBriefReviewSearchText =
    reportKind === "daily_start_brief_review"
      ? [
          "daily_start_brief_review",
          dailyStartBriefReviewState,
          `local-reviews ${dailyStartBriefReviewCurrentReviewCount}/2`,
          `stale ${dailyStartBriefReviewStaleReviewCount}`,
          `stale-reviews-${dailyStartBriefReviewStaleReviewCount}`,
          `missing ${dailyStartBriefReviewMissingReviewCount}`,
          `missing-reviews-${dailyStartBriefReviewMissingReviewCount}`,
          `open-ops ${dailyStartBriefReviewOpenOpsItemCount}`,
          dailyStartBriefReviewPrimaryActionLabel,
          dailyStartBriefReviewPrimaryActionWorkspaceId,
          dailyStartBriefReviewAuditQuery,
          dailyStartBriefReviewAuditQueryTitle,
          dailyStartBriefReviewLocalReviewStatus,
          dailyStartBriefReviewLocalReviewActionLabel,
          dailyStartBriefReviewLocalReviewQuery,
          dailyStartBriefReviewCheckpointIds.join(" "),
          "checkpoint-statuses",
          dailyStartBriefReviewCheckpointStatuses.join(" "),
          auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const stage1DailyArchiveReviewState =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "state") || event.stage : "";
  const stage1DailyArchiveReviewReadyCount =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataNumber(event.metadata, "readyCount") : 0;
  const stage1DailyArchiveReviewTotalCount =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataNumber(event.metadata, "totalCount") : 0;
  const stage1DailyArchiveReviewPrimaryActionId =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "primaryActionId") : "";
  const stage1DailyArchiveReviewPrimaryActionLabel =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "primaryActionLabel") : "";
  const stage1DailyArchiveReviewPrimaryTargetWorkspaceId =
    reportKind === "stage1_daily_archive_review"
      ? auditReportLedgerMetadataText(event.metadata, "primaryTargetWorkspaceId")
      : "";
  const stage1DailyArchiveReviewRowIds =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataStringList(event.metadata, "rowIds") : [];
  const stage1DailyArchiveReviewRowLabels =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataStringList(event.metadata, "rowLabels") : [];
  const stage1DailyArchiveReviewRowStatuses =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataStringList(event.metadata, "rowStatuses") : [];
  const stage1DailyArchiveReviewRowTargetWorkspaceIds =
    reportKind === "stage1_daily_archive_review"
      ? auditReportLedgerMetadataStringList(event.metadata, "rowTargetWorkspaceIds")
      : [];
  const stage1DailyArchiveReviewRefreshOutcomeState =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "refreshOutcomeState") : "";
  const stage1DailyArchiveReviewShareKind =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "shareKind") : "";
  const stage1DailyArchiveReviewShareFocus =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "shareFocus") : "";
  const stage1DailyArchiveReviewShareTargetWorkspaceId =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "shareTargetWorkspaceId") : "";
  const stage1DailyArchiveReviewInvalidShareStatus =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "invalidShareStatus") : "";
  const stage1DailyArchiveReviewInvalidShareReason =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "invalidShareReason") : "";
  const stage1DailyArchiveReviewArchiveBodySha256 =
    reportKind === "stage1_daily_archive_review" ? auditReportLedgerMetadataText(event.metadata, "archiveBodySha256") : "";
  const stage1DailyArchiveReviewBootstrapPreflightCheckIds =
    reportKind === "stage1_daily_archive_review"
      ? auditReportLedgerMetadataStringList(event.metadata, "bootstrapPreflightCheckIds")
      : [];
  const stage1DailyArchiveReviewBootstrapPreflightCheckStatuses =
    reportKind === "stage1_daily_archive_review"
      ? auditReportLedgerMetadataStringList(event.metadata, "bootstrapPreflightCheckStatuses")
      : [];
  const stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths =
    reportKind === "stage1_daily_archive_review"
      ? auditReportLedgerMetadataStringList(event.metadata, "bootstrapPreflightCheckSourcePaths")
      : [];
  const stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath =
    reportKind === "stage1_daily_archive_review"
      ? auditReportLedgerMetadataText(event.metadata, "bootstrapPreflightP2ManifestChainPreflightSourcePath")
      : "";
  const stage1DailyArchiveReviewSearchText =
    reportKind === "stage1_daily_archive_review"
      ? [
          "stage1_daily_archive_review",
          "stage1 archive review",
          "local-review-bundle",
          stage1DailyArchiveReviewState,
          `${stage1DailyArchiveReviewReadyCount}/${stage1DailyArchiveReviewTotalCount}`,
          stage1DailyArchiveReviewPrimaryActionId,
          stage1DailyArchiveReviewPrimaryActionLabel,
          stage1DailyArchiveReviewPrimaryTargetWorkspaceId,
          "refresh",
          stage1DailyArchiveReviewRefreshOutcomeState,
          "share",
          stage1DailyArchiveReviewShareKind,
          stage1DailyArchiveReviewShareFocus,
          stage1DailyArchiveReviewShareTargetWorkspaceId,
          "invalid-share",
          stage1DailyArchiveReviewInvalidShareStatus,
          stage1DailyArchiveReviewInvalidShareReason,
          stage1DailyArchiveReviewArchiveBodySha256,
          "bootstrap-preflight",
          stage1DailyArchiveReviewBootstrapPreflightCheckIds.join(" "),
          stage1DailyArchiveReviewBootstrapPreflightCheckStatuses.join(" "),
          stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths.join(" "),
          "p2-chain",
          stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath,
          stage1DailyArchiveReviewRowIds.join(" "),
          stage1DailyArchiveReviewRowLabels.join(" "),
          stage1DailyArchiveReviewRowStatuses.join(" "),
          stage1DailyArchiveReviewRowTargetWorkspaceIds.join(" "),
          auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const localReviewBundleContextQuery =
    reportKind === "personal_team_readiness_review" ||
    reportKind === "daily_ops_control_room_review" ||
    reportKind === "daily_start_brief_review" ||
    reportKind === "stage1_daily_archive_review"
      ? "local-review-bundle"
      : "";
  const localReviewBundleContextLabel = localReviewBundleContextQuery
    ? auditReportLedgerLocalReviewBundleContextLabel(reportKind)
    : "";
  const localReviewBundleContextTitle = localReviewBundleContextQuery
    ? auditReportLedgerLocalReviewBundleContextTitle(reportKind, event.eventId)
    : "";
  return { personalTeamReadinessReviewState, personalTeamReadinessReviewPersonalPercent, personalTeamReadinessReviewTeamPercent, personalTeamReadinessReviewReadyCount, personalTeamReadinessReviewTotalCount, personalTeamReadinessReviewItemIds, personalTeamReadinessReviewItemStatuses, personalTeamReadinessReviewOpenItemIds, personalTeamReadinessReviewNextActionLabel, personalTeamReadinessReviewNextActionWorkspaceId, personalTeamReadinessReviewSearchText, dailyOpsControlRoomReviewState, dailyOpsControlRoomReviewReadyCount, dailyOpsControlRoomReviewReviewCount, dailyOpsControlRoomReviewBlockingCount, dailyOpsControlRoomReviewTotalCount, dailyOpsControlRoomReviewQueueItemIds, dailyOpsControlRoomReviewQueueItemStatuses, dailyOpsControlRoomReviewOpenItemIds, dailyOpsControlRoomReviewPrimaryActionLabel, dailyOpsControlRoomReviewPrimaryActionWorkspaceId, dailyOpsControlRoomReviewAuditQueryLabel, dailyOpsControlRoomReviewAuditQuery, dailyOpsControlRoomReviewAuditQueryTitle, dailyOpsControlRoomReviewSearchText, dailyStartBriefReviewState, dailyStartBriefReviewCurrentReviewCount, dailyStartBriefReviewStaleReviewCount, dailyStartBriefReviewMissingReviewCount, dailyStartBriefReviewOpenOpsItemCount, dailyStartBriefReviewPrimaryActionLabel, dailyStartBriefReviewPrimaryActionWorkspaceId, dailyStartBriefReviewAuditQuery, dailyStartBriefReviewAuditQueryTitle, dailyStartBriefReviewLocalReviewStatus, dailyStartBriefReviewLocalReviewActionLabel, dailyStartBriefReviewLocalReviewQuery, dailyStartBriefReviewCheckpointIds, dailyStartBriefReviewCheckpointStatuses, dailyStartBriefReviewSearchText, stage1DailyArchiveReviewState, stage1DailyArchiveReviewReadyCount, stage1DailyArchiveReviewTotalCount, stage1DailyArchiveReviewPrimaryActionId, stage1DailyArchiveReviewPrimaryActionLabel, stage1DailyArchiveReviewPrimaryTargetWorkspaceId, stage1DailyArchiveReviewRowIds, stage1DailyArchiveReviewRowLabels, stage1DailyArchiveReviewRowStatuses, stage1DailyArchiveReviewRowTargetWorkspaceIds, stage1DailyArchiveReviewRefreshOutcomeState, stage1DailyArchiveReviewShareKind, stage1DailyArchiveReviewShareFocus, stage1DailyArchiveReviewShareTargetWorkspaceId, stage1DailyArchiveReviewInvalidShareStatus, stage1DailyArchiveReviewInvalidShareReason, stage1DailyArchiveReviewArchiveBodySha256, stage1DailyArchiveReviewBootstrapPreflightCheckIds, stage1DailyArchiveReviewBootstrapPreflightCheckStatuses, stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths, stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath, stage1DailyArchiveReviewSearchText, localReviewBundleContextQuery, localReviewBundleContextLabel, localReviewBundleContextTitle };
}
