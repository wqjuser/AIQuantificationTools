import { buildAuditEvidenceReportLedgerBaseFields } from "./ledger-base-fields";
import { buildAuditEvidenceReportLedgerDailyReviewFields } from "./ledger-daily-review-fields";
import { buildAuditEvidenceReportLedgerP0Fields } from "./ledger-p0-fields";
import { buildAuditEvidenceReportLedgerP2Fields } from "./ledger-p2-fields";
import { buildAuditEvidenceReportLedgerResearchRunbookFields } from "./ledger-research-runbook-fields";
import { buildAuditEvidenceReportLedgerVerificationFields } from "./ledger-verification-fields";
import { linkP2ReadinessEvidenceCoverageLedgerRowsToAcceptanceReviews, markLatestLocalReviewBundleLedgerRow, markLocalReviewBundleContextTitleLedgerRows, markLocalReviewBundleCoverageLedgerRows } from "./local-review-markers";
import type { AuditEvidenceReportLedgerEventRecord, AuditEvidenceReportLedgerRow } from "./report-contracts";
import { auditReportLedgerEvidenceLinkLabel } from "./report-queries";
import { auditReportLedgerMetadataBoolean, auditReportLedgerMetadataNumber, auditReportLedgerMetadataText, auditReportLedgerSignatureDetail, auditReportLedgerSignatureTone } from "./signing-key-ledger";

export function buildAuditEvidenceReportLedgerRows(
  events: AuditEvidenceReportLedgerEventRecord[]
): AuditEvidenceReportLedgerRow[] {
  const rows = events
    .filter(
      (event) =>
        event.eventType === "audit_evidence_report" ||
        event.eventType === "backtest_report" ||
        event.eventType === "portfolio_report" ||
        event.eventType === "p0_readiness_report" ||
        event.eventType === "p2_manifest_chain_preflight" ||
        event.eventType === "p2_manifest_chain_preflight_review" ||
        event.eventType === "p2_readiness_evidence_coverage_review" ||
        event.eventType === "p2_readiness_acceptance_generated" ||
        event.eventType === "p2_readiness_acceptance_review" ||
        event.eventType === "personal_team_readiness_review" ||
        event.eventType === "daily_ops_control_room_review" ||
        event.eventType === "daily_start_brief_review" ||
        event.eventType === "stage1_daily_archive_review" ||
        event.eventType === "operator_runbook_report" ||
        event.eventType === "pre_live_runbook_report" ||
        event.eventType === "research_context_readiness_report"
    )
    .map((event) => {
      const baseFields = buildAuditEvidenceReportLedgerBaseFields(event);
      const verificationFields = buildAuditEvidenceReportLedgerVerificationFields(event, { ...baseFields });
      const p0Fields = buildAuditEvidenceReportLedgerP0Fields(event, { ...baseFields, ...verificationFields });
      const researchRunbookFields = buildAuditEvidenceReportLedgerResearchRunbookFields(event, { ...baseFields, ...verificationFields, ...p0Fields });
      const p2Fields = buildAuditEvidenceReportLedgerP2Fields(event, { ...baseFields, ...verificationFields, ...p0Fields, ...researchRunbookFields });
      const dailyReviewFields = buildAuditEvidenceReportLedgerDailyReviewFields(event, { ...baseFields, ...verificationFields, ...p0Fields, ...researchRunbookFields, ...p2Fields });
      const { reportKind, contentSha256, artifactKind, fileName, shortHash, focusQuery, isHashReady, status, signature, signatureStatus, signatureLabel, importVerificationVerified, importVerificationInvalid, importVerificationDetail, paperPreflightState, paperPreflightActionId, paperPreflightActionLabel, paperPreflightGateTotal, paperPreflightGatePassedCount, paperPreflightGateReviewCount, paperPreflightGateBlockedCount, paperPreflightLiveBoundary, p0PreparationEvidenceRunId, p0BacklogReadinessRecorded, p0BacklogReadinessSummary, p0BacklogExecutableCount, p0BacklogNotExecutableCount, p0BacklogTotalCount, p0CompletionReadinessRecorded, p0CompletionBlockedCount, p0CompletionCurrentCriterionActionLabel, p0CompletionCurrentCriterionId, p0CompletionCurrentCriterionLabel, p0CompletionCurrentCriterionStatus, p0CompletionCurrentCriterionTargetWorkspaceId, p0CompletionOpenCriterionIds, p0CompletionPassedCount, p0CompletionProgressPct, p0CompletionReviewCount, p0CompletionSummary, p0CompletionTotalCount, p0FirstBacklogCanExecute, p0FirstBacklogExecutableActionId, p0FirstBacklogReadinessReason, p0CurrentGapActionId, p0CurrentGapActionLabel, p0CurrentGapTargetWorkspaceId, p0CurrentGapWorkspaceId, p0CurrentGapFallbackParams, p0CurrentGapDeepLinkSearch, p0CurrentGapDeepLinkWorkspaceId, p0CurrentGapComputedReadiness, p0CurrentGapExecutableActionId, p0CurrentGapCanExecute, p0CurrentGapReadinessReason, paperPreflightLabel, p0SearchText, preLiveRunbookSearchText, researchContextMarket, researchContextSymbol, researchContextTimeframe, researchContextPreflightStatus, researchContextNextAction, researchContextPreparationEvidenceRunId, researchContextRecordedLink, researchContextFallbackParams, researchContextLinkSearch, researchContextLinkDecodedSearch, researchContextLinkLabel, researchContextSearchText, evidenceLinkSearch, evidenceLinkStatus, evidenceTargetWorkspaceId, evidenceLinkDecodedSearch, operatorRunbookAdapterId, operatorRunbookMarket, operatorRunbookSymbol, operatorRunbookTimeframe, operatorRunbookStatus, operatorRunbookCompletedSections, operatorRunbookTotalSections, operatorRunbookNextActionId, operatorRunbookSectionIds, operatorRunbookSectionStatuses, operatorRunbookSectionEvidence, operatorRunbookControlSnapshot, operatorRunbookSearchText, preLiveRunbookAdapterId, preLiveRunbookMarket, preLiveRunbookSymbol, preLiveRunbookTimeframe, preLiveRunbookStatus, preLiveRunbookCompletedSteps, preLiveRunbookTotalSteps, preLiveRunbookNextStep, preLiveRunbookNextStepId, preLiveRunbookEvidenceIds, isP2ManifestChainPreflightReport, p2ManifestChainPreflightStatus, p2ManifestChainPreflightNextAction, p2ManifestChainPreflightBlockers, p2ManifestChainPreflightValidStages, p2ManifestChainPreflightTotalStages, p2ManifestChainPreflightSafeBoundary, p2ManifestChainPreflightSearchText, p2ReadinessEvidenceCoverageReviewStatus, p2ReadinessEvidenceCoverageReviewSafeBoundary, p2ReadinessEvidenceCoverageReviewSearchText, p2ReadinessAcceptanceGeneratedStatus, p2ReadinessAcceptanceGeneratedRunId, p2ReadinessAcceptanceGeneratedAcceptedCriteria, p2ReadinessAcceptanceGeneratedTotalCriteria, p2ReadinessAcceptanceGeneratedMarket, p2ReadinessAcceptanceGeneratedSymbol, p2ReadinessAcceptanceGeneratedTimeframe, p2ReadinessAcceptanceGeneratedSafeBoundary, p2ReadinessAcceptanceGeneratedSearchText, p2ReadinessAcceptanceReviewStatus, p2ReadinessAcceptanceReviewRunId, p2ReadinessAcceptanceReviewSafeBoundary, p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId, p2ReadinessAcceptanceCoverageReviewLinkLabel, p2ReadinessAcceptanceCoverageReviewLinkQuery, p2ReadinessReviewChainLabel, p2ReadinessReviewChainQuery, p2ReadinessAcceptanceReviewSearchText, personalTeamReadinessReviewState, personalTeamReadinessReviewPersonalPercent, personalTeamReadinessReviewTeamPercent, personalTeamReadinessReviewReadyCount, personalTeamReadinessReviewTotalCount, personalTeamReadinessReviewItemIds, personalTeamReadinessReviewItemStatuses, personalTeamReadinessReviewOpenItemIds, personalTeamReadinessReviewNextActionLabel, personalTeamReadinessReviewNextActionWorkspaceId, personalTeamReadinessReviewSearchText, dailyOpsControlRoomReviewState, dailyOpsControlRoomReviewReadyCount, dailyOpsControlRoomReviewReviewCount, dailyOpsControlRoomReviewBlockingCount, dailyOpsControlRoomReviewTotalCount, dailyOpsControlRoomReviewQueueItemIds, dailyOpsControlRoomReviewQueueItemStatuses, dailyOpsControlRoomReviewOpenItemIds, dailyOpsControlRoomReviewPrimaryActionLabel, dailyOpsControlRoomReviewPrimaryActionWorkspaceId, dailyOpsControlRoomReviewAuditQueryLabel, dailyOpsControlRoomReviewAuditQuery, dailyOpsControlRoomReviewAuditQueryTitle, dailyOpsControlRoomReviewSearchText, dailyStartBriefReviewState, dailyStartBriefReviewCurrentReviewCount, dailyStartBriefReviewStaleReviewCount, dailyStartBriefReviewMissingReviewCount, dailyStartBriefReviewOpenOpsItemCount, dailyStartBriefReviewPrimaryActionLabel, dailyStartBriefReviewPrimaryActionWorkspaceId, dailyStartBriefReviewAuditQuery, dailyStartBriefReviewAuditQueryTitle, dailyStartBriefReviewLocalReviewStatus, dailyStartBriefReviewLocalReviewActionLabel, dailyStartBriefReviewLocalReviewQuery, dailyStartBriefReviewCheckpointIds, dailyStartBriefReviewCheckpointStatuses, dailyStartBriefReviewSearchText, stage1DailyArchiveReviewState, stage1DailyArchiveReviewReadyCount, stage1DailyArchiveReviewTotalCount, stage1DailyArchiveReviewPrimaryActionId, stage1DailyArchiveReviewPrimaryActionLabel, stage1DailyArchiveReviewPrimaryTargetWorkspaceId, stage1DailyArchiveReviewRowIds, stage1DailyArchiveReviewRowLabels, stage1DailyArchiveReviewRowStatuses, stage1DailyArchiveReviewRowTargetWorkspaceIds, stage1DailyArchiveReviewRefreshOutcomeState, stage1DailyArchiveReviewShareKind, stage1DailyArchiveReviewShareFocus, stage1DailyArchiveReviewShareTargetWorkspaceId, stage1DailyArchiveReviewInvalidShareStatus, stage1DailyArchiveReviewInvalidShareReason, stage1DailyArchiveReviewArchiveBodySha256, stage1DailyArchiveReviewBootstrapPreflightCheckIds, stage1DailyArchiveReviewBootstrapPreflightCheckStatuses, stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths, stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath, stage1DailyArchiveReviewSearchText, localReviewBundleContextQuery, localReviewBundleContextLabel, localReviewBundleContextTitle } = { ...baseFields, ...verificationFields, ...p0Fields, ...researchRunbookFields, ...p2Fields, ...dailyReviewFields };
      return {
              id: event.eventId,
              artifactKind,
              runId: event.runId ?? "unknown",
              createdAt: event.createdAt,
              fileName,
              contentSha256,
              shortHash,
              focusQuery,
              evidenceLinkDecodedSearch,
              evidenceLinkLabel: auditReportLedgerEvidenceLinkLabel(evidenceTargetWorkspaceId, evidenceLinkStatus),
              evidenceLinkSearch,
              evidenceLinkStatus,
              evidenceTargetWorkspaceId,
              packageMatched:
                reportKind === "p0_readiness_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "passedSteps")
                  : isP2ManifestChainPreflightReport
                  ? p2ManifestChainPreflightValidStages
                  : reportKind === "p2_readiness_evidence_coverage_review"
                  ? auditReportLedgerMetadataNumber(event.metadata, "coveredCount")
                  : reportKind === "p2_readiness_acceptance_generated"
                  ? p2ReadinessAcceptanceGeneratedAcceptedCriteria
                  : reportKind === "p2_readiness_acceptance_review"
                  ? auditReportLedgerMetadataNumber(event.metadata, "acceptedCriterionCount")
                  : reportKind === "personal_team_readiness_review"
                  ? personalTeamReadinessReviewReadyCount
                  : reportKind === "daily_ops_control_room_review"
                  ? auditReportLedgerMetadataNumber(event.metadata, "readyCount")
                  : reportKind === "daily_start_brief_review"
                  ? dailyStartBriefReviewCurrentReviewCount
                  : reportKind === "stage1_daily_archive_review"
                  ? stage1DailyArchiveReviewReadyCount
                  : reportKind === "operator_runbook_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "completedSections")
                  : reportKind === "pre_live_runbook_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "completedSteps")
                  : reportKind === "research_context_readiness_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "readinessReadyCount")
                  : reportKind === "portfolio_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "legCount")
                  : reportKind === "backtest_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "runComparisonRows")
                  : auditReportLedgerMetadataNumber(event.metadata, "packageMatched"),
              packageTotal:
                reportKind === "p0_readiness_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "totalSteps")
                  : isP2ManifestChainPreflightReport
                  ? p2ManifestChainPreflightTotalStages
                  : reportKind === "p2_readiness_evidence_coverage_review"
                  ? auditReportLedgerMetadataNumber(event.metadata, "totalCount")
                  : reportKind === "p2_readiness_acceptance_generated"
                  ? p2ReadinessAcceptanceGeneratedTotalCriteria
                  : reportKind === "p2_readiness_acceptance_review"
                  ? auditReportLedgerMetadataNumber(event.metadata, "totalCriterionCount")
                  : reportKind === "personal_team_readiness_review"
                  ? personalTeamReadinessReviewTotalCount
                  : reportKind === "daily_ops_control_room_review"
                  ? auditReportLedgerMetadataNumber(event.metadata, "totalCount")
                  : reportKind === "daily_start_brief_review"
                  ? 2
                  : reportKind === "stage1_daily_archive_review"
                  ? stage1DailyArchiveReviewTotalCount
                  : reportKind === "operator_runbook_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "totalSections")
                  : reportKind === "pre_live_runbook_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "totalSteps")
                  : reportKind === "research_context_readiness_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "readinessReadyCount") +
                    auditReportLedgerMetadataNumber(event.metadata, "readinessReviewCount") +
                    auditReportLedgerMetadataNumber(event.metadata, "readinessBlockedCount")
                  : reportKind === "portfolio_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "equityRows")
                  : reportKind === "backtest_report"
                  ? auditReportLedgerMetadataNumber(event.metadata, "dataRows")
                  : auditReportLedgerMetadataNumber(event.metadata, "packageTotal"),
              importDiffBlocked:
                reportKind === "backtest_report" ||
                reportKind === "portfolio_report" ||
                reportKind === "operator_runbook_report" ||
                reportKind === "p0_readiness_report" ||
                reportKind === "p2_manifest_chain_preflight" ||
                reportKind === "p2_manifest_chain_preflight_review" ||
                reportKind === "p2_readiness_evidence_coverage_review" ||
                reportKind === "p2_readiness_acceptance_generated" ||
                reportKind === "p2_readiness_acceptance_review" ||
                reportKind === "personal_team_readiness_review" ||
                reportKind === "daily_ops_control_room_review" ||
                reportKind === "daily_start_brief_review" ||
                reportKind === "stage1_daily_archive_review" ||
                reportKind === "pre_live_runbook_report" ||
                reportKind === "research_context_readiness_report"
                  ? 0
                  : auditReportLedgerMetadataNumber(event.metadata, "importDiffBlocked"),
              importDiffTotal:
                reportKind === "backtest_report" ||
                reportKind === "portfolio_report" ||
                reportKind === "operator_runbook_report" ||
                reportKind === "p0_readiness_report" ||
                reportKind === "p2_manifest_chain_preflight" ||
                reportKind === "p2_manifest_chain_preflight_review" ||
                reportKind === "p2_readiness_evidence_coverage_review" ||
                reportKind === "p2_readiness_acceptance_generated" ||
                reportKind === "p2_readiness_acceptance_review" ||
                reportKind === "personal_team_readiness_review" ||
                reportKind === "daily_ops_control_room_review" ||
                reportKind === "daily_start_brief_review" ||
                reportKind === "stage1_daily_archive_review" ||
                reportKind === "pre_live_runbook_report" ||
                reportKind === "research_context_readiness_report"
                  ? 0
                  : auditReportLedgerMetadataNumber(event.metadata, "importDiffTotal"),
              importVerificationDetail,
              importVerificationInvalid,
              importVerificationVerified,
              p0BacklogExecutableCount,
              p0BacklogNotExecutableCount,
              p0BacklogReadinessRecorded,
              p0BacklogReadinessSummary,
              p0BacklogTotalCount,
              p0CompletionBlockedCount,
              p0CompletionCurrentCriterionActionLabel,
              p0CompletionCurrentCriterionId,
              p0CompletionCurrentCriterionLabel,
              p0CompletionCurrentCriterionStatus,
              p0CompletionCurrentCriterionTargetWorkspaceId,
              p0CompletionOpenCriterionIds,
              p0CompletionPassedCount,
              p0CompletionProgressPct,
              p0CompletionReadinessRecorded,
              p0CompletionReviewCount,
              p0CompletionSummary,
              p0CompletionTotalCount,
              p0CurrentGapActionId,
              p0CurrentGapActionLabel,
              p0CurrentGapCanExecute,
              p0CurrentGapDeepLinkSearch,
              p0CurrentGapExecutableActionId,
              p0CurrentGapReadinessReason,
              p0CurrentGapTargetWorkspaceId,
              p0CurrentGapWorkspaceId,
              p0FirstBacklogCanExecute,
              p0FirstBacklogExecutableActionId,
              p0FirstBacklogReadinessReason,
              paperPreflightActionId,
              paperPreflightActionLabel,
              paperPreflightGateBlockedCount,
              paperPreflightGatePassedCount,
              paperPreflightGateReviewCount,
              paperPreflightGateTotal,
              paperPreflightLabel,
              paperPreflightLiveBoundary,
              paperPreflightState,
              p0PreparationEvidenceRunId,
              researchContextMarket,
              researchContextLinkDecodedSearch,
              researchContextLinkLabel,
              researchContextLinkSearch,
              researchContextNextAction,
              researchContextPreflightStatus,
              researchContextPreparationEvidenceRunId,
              researchContextSymbol,
              researchContextTimeframe,
              operatorRunbookAdapterId,
              operatorRunbookCompletedSections,
              operatorRunbookControlSnapshot,
              operatorRunbookMarket,
              operatorRunbookNextActionId,
              operatorRunbookSectionEvidence,
              operatorRunbookSectionIds,
              operatorRunbookSectionStatuses,
              operatorRunbookStatus,
              operatorRunbookSymbol,
              operatorRunbookTimeframe,
              operatorRunbookTotalSections,
              preLiveRunbookAdapterId,
              preLiveRunbookCompletedSteps,
              preLiveRunbookEvidenceIds,
              preLiveRunbookMarket,
              preLiveRunbookNextStep,
              preLiveRunbookNextStepId,
              preLiveRunbookStatus,
              preLiveRunbookSymbol,
              preLiveRunbookTimeframe,
              preLiveRunbookTotalSteps,
              personalTeamReadinessReviewState,
              personalTeamReadinessReviewPersonalPercent,
              personalTeamReadinessReviewTeamPercent,
              personalTeamReadinessReviewReadyCount,
              personalTeamReadinessReviewTotalCount,
              personalTeamReadinessReviewItemIds,
              personalTeamReadinessReviewItemStatuses,
              personalTeamReadinessReviewOpenItemIds,
              personalTeamReadinessReviewNextActionLabel,
              personalTeamReadinessReviewNextActionWorkspaceId,
              dailyOpsControlRoomReviewState,
              dailyOpsControlRoomReviewReadyCount,
              dailyOpsControlRoomReviewReviewCount,
              dailyOpsControlRoomReviewBlockingCount,
              dailyOpsControlRoomReviewTotalCount,
              dailyOpsControlRoomReviewQueueItemIds,
              dailyOpsControlRoomReviewQueueItemStatuses,
              dailyOpsControlRoomReviewOpenItemIds,
              dailyOpsControlRoomReviewPrimaryActionLabel,
              dailyOpsControlRoomReviewPrimaryActionWorkspaceId,
              dailyOpsControlRoomReviewAuditQueryLabel,
              dailyOpsControlRoomReviewAuditQuery,
              dailyOpsControlRoomReviewAuditQueryTitle,
              dailyStartBriefReviewState,
              dailyStartBriefReviewCurrentReviewCount,
              dailyStartBriefReviewStaleReviewCount,
              dailyStartBriefReviewMissingReviewCount,
              dailyStartBriefReviewOpenOpsItemCount,
              dailyStartBriefReviewPrimaryActionLabel,
              dailyStartBriefReviewPrimaryActionWorkspaceId,
              dailyStartBriefReviewAuditQuery,
              dailyStartBriefReviewAuditQueryTitle,
              dailyStartBriefReviewLocalReviewStatus,
              dailyStartBriefReviewLocalReviewActionLabel,
              dailyStartBriefReviewLocalReviewQuery,
              dailyStartBriefReviewCheckpointIds,
              dailyStartBriefReviewCheckpointStatuses,
              stage1DailyArchiveReviewState,
              stage1DailyArchiveReviewReadyCount,
              stage1DailyArchiveReviewTotalCount,
              stage1DailyArchiveReviewPrimaryActionId,
              stage1DailyArchiveReviewPrimaryActionLabel,
              stage1DailyArchiveReviewPrimaryTargetWorkspaceId,
              stage1DailyArchiveReviewRowIds,
              stage1DailyArchiveReviewRowLabels,
              stage1DailyArchiveReviewRowStatuses,
              stage1DailyArchiveReviewRowTargetWorkspaceIds,
              stage1DailyArchiveReviewRefreshOutcomeState,
              stage1DailyArchiveReviewShareKind,
              stage1DailyArchiveReviewShareFocus,
              stage1DailyArchiveReviewShareTargetWorkspaceId,
              stage1DailyArchiveReviewInvalidShareStatus,
              stage1DailyArchiveReviewInvalidShareReason,
              stage1DailyArchiveReviewArchiveBodySha256,
              stage1DailyArchiveReviewBootstrapPreflightCheckIds,
              stage1DailyArchiveReviewBootstrapPreflightCheckStatuses,
              stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths,
              stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath,
              localReviewBundleContextLabel,
              localReviewBundleContextQuery,
              localReviewBundleContextTitle,
              localReviewBundleCoverageQuery: "",
              localReviewBundleCoverageTitle: "",
              localReviewBundleCoverageNextActionQuery: "",
              localReviewBundleCoverageNextActionTargetWorkspaceId: null,
              localReviewBundleCoverageNextActionTitle: "",
              localReviewBundleLatestLabel: "",
              localReviewBundleLatestQuery: "",
              localReviewBundleLatestTitle: "",
              p2ReadinessAcceptanceCoverageReviewLinkLabel,
              p2ReadinessAcceptanceCoverageReviewLinkQuery,
              p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel: "",
              p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery: "",
              p2ReadinessReviewChainLabel,
              p2ReadinessReviewChainQuery,
              p2ReadinessReviewChainAcceptanceLoaded: false,
              p2ReadinessReviewChainCoverageLoaded: false,
              p2ReadinessReviewChainHealthContextQuery: "",
              p2ReadinessReviewChainHealthContextTitle: "",
              p2ReadinessReviewChainStatusLabel: "",
              p2ReadinessReviewChainStatusQuery: "",
              p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId,
              deepLinkStatus:
                reportKind === "p0_readiness_report"
                  ? "p0-readiness-report"
                  : reportKind === "p2_manifest_chain_preflight"
                  ? "p2-manifest-chain-preflight"
                  : reportKind === "p2_manifest_chain_preflight_review"
                  ? "p2-manifest-chain-preflight-review"
                  : reportKind === "p2_readiness_evidence_coverage_review"
                  ? "p2-readiness-evidence-coverage-review"
                  : reportKind === "p2_readiness_acceptance_generated"
                  ? "p2-readiness-acceptance-generated"
                  : reportKind === "p2_readiness_acceptance_review"
                  ? "p2-readiness-acceptance-review"
                  : reportKind === "personal_team_readiness_review"
                  ? "personal-team-readiness-review"
                  : reportKind === "daily_ops_control_room_review"
                  ? "daily-ops-control-room-review"
                  : reportKind === "daily_start_brief_review"
                  ? "daily-start-brief-review"
                  : reportKind === "stage1_daily_archive_review"
                  ? "stage1-daily-archive-review"
                  : reportKind === "operator_runbook_report"
                  ? "operator-runbook-report"
                  : reportKind === "pre_live_runbook_report"
                  ? "pre-live-runbook-report"
                  : reportKind === "research_context_readiness_report"
                  ? "research-context-readiness-report"
                  : reportKind === "portfolio_report"
                  ? "portfolio-report"
                  : reportKind === "backtest_report"
                  ? "backtest-report"
                  : auditReportLedgerMetadataText(event.metadata, "deepLinkStatus") || "unknown",
              status,
              statusLabel:
                status === "ready"
                  ? reportKind === "p0_readiness_report"
                  ? "P0 readiness report hash recorded"
                  : reportKind === "p2_manifest_chain_preflight"
                  ? "P2 manifest chain preflight hash recorded"
                  : reportKind === "p2_manifest_chain_preflight_review"
                    ? "P2 manifest chain preflight review hash recorded"
                  : reportKind === "p2_readiness_evidence_coverage_review"
                    ? "P2 readiness evidence coverage review hash recorded"
                  : reportKind === "p2_readiness_acceptance_generated"
                    ? "P2 readiness acceptance generation hash recorded"
                  : reportKind === "p2_readiness_acceptance_review"
                    ? "P2 readiness acceptance review hash recorded"
                  : reportKind === "personal_team_readiness_review"
                    ? "Personal/team readiness review hash recorded"
                  : reportKind === "daily_ops_control_room_review"
                    ? "Daily ops control room review hash recorded"
                  : reportKind === "daily_start_brief_review"
                    ? "Daily start brief review hash recorded"
                  : reportKind === "stage1_daily_archive_review"
                    ? "Stage 1 daily-use archive review hash recorded"
                  : reportKind === "operator_runbook_report"
                    ? "Operator runbook report hash recorded"
                  : reportKind === "pre_live_runbook_report"
                    ? "Pre-live runbook report hash recorded"
                  : reportKind === "research_context_readiness_report"
                    ? "Research context readiness report hash recorded"
                    : reportKind === "portfolio_report"
                    ? "Portfolio report hash recorded"
                    : reportKind === "backtest_report"
                    ? "Backtest report hash recorded"
                    : "Report hash recorded"
                  : "Report hash invalid",
              chainId: auditReportLedgerMetadataText(signature, "chainId"),
              signer: auditReportLedgerMetadataText(signature, "signer"),
              signatureAlgorithm: auditReportLedgerMetadataText(signature, "algorithm"),
              signatureDetail: auditReportLedgerSignatureDetail(signature),
              signatureKeyId: auditReportLedgerMetadataText(signature, "keyId"),
              signatureRevokedReason: auditReportLedgerMetadataText(signature, "revokedReason"),
              signatureSignedAt: auditReportLedgerMetadataText(signature, "signedAt"),
              signatureStatus,
              signatureLabel,
              signatureVerifiedAt: auditReportLedgerMetadataText(signature, "verifiedAt"),
              detail: event.detail,
              reportKind,
              searchText: [
                p0SearchText,
                p2ManifestChainPreflightSearchText,
                p2ReadinessEvidenceCoverageReviewSearchText,
                p2ReadinessAcceptanceGeneratedSearchText,
                p2ReadinessAcceptanceReviewSearchText,
                personalTeamReadinessReviewSearchText,
                dailyOpsControlRoomReviewSearchText,
                dailyStartBriefReviewSearchText,
                stage1DailyArchiveReviewSearchText,
                localReviewBundleContextLabel,
                localReviewBundleContextQuery,
                localReviewBundleContextTitle,
                operatorRunbookSearchText,
                preLiveRunbookSearchText,
                researchContextSearchText
              ]
                .filter(Boolean)
                .join(" "),
              tone:
                isP2ManifestChainPreflightReport
                  ? p2ManifestChainPreflightStatus === "ready" && p2ManifestChainPreflightSafeBoundary
                    ? "positive"
                    : "risk"
                  : reportKind === "p2_readiness_evidence_coverage_review"
                  ? p2ReadinessEvidenceCoverageReviewStatus === "covered" && p2ReadinessEvidenceCoverageReviewSafeBoundary
                    ? "positive"
                    : "risk"
                  : reportKind === "p2_readiness_acceptance_generated"
                  ? p2ReadinessAcceptanceGeneratedStatus === "accepted" && p2ReadinessAcceptanceGeneratedSafeBoundary
                    ? "positive"
                    : "risk"
                  : reportKind === "personal_team_readiness_review"
                  ? auditReportLedgerMetadataText(event.metadata, "state") === "ready" &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveOrderSubmitted") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "routeExecuted") &&
                    auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary")
                    ? "positive"
                    : "risk"
                  : reportKind === "daily_ops_control_room_review"
                  ? !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveOrderSubmitted") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "routeExecuted") &&
                    auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary")
                    ? "positive"
                    : "risk"
                  : reportKind === "daily_start_brief_review"
                  ? !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveOrderSubmitted") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "routeExecuted") &&
                    auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary")
                    ? "positive"
                    : "risk"
                  : reportKind === "stage1_daily_archive_review"
                  ? !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "liveOrderSubmitted") &&
                    !auditReportLedgerMetadataBoolean(event.metadata, "routeExecuted") &&
                    auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary")
                    ? "positive"
                    : "risk"
                : auditReportLedgerSignatureTone(signatureStatus)
            };
    });
  return markLatestLocalReviewBundleLedgerRow(
    markLocalReviewBundleCoverageLedgerRows(
      markLocalReviewBundleContextTitleLedgerRows(linkP2ReadinessEvidenceCoverageLedgerRowsToAcceptanceReviews(rows))
    )
  );
}
