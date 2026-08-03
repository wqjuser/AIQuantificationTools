import { buildAuditEvidenceReportLedgerBaseFields } from "./ledger-base-fields";
import { buildAuditEvidenceReportLedgerP0Fields } from "./ledger-p0-fields";
import { buildAuditEvidenceReportLedgerResearchRunbookFields } from "./ledger-research-runbook-fields";
import { buildAuditEvidenceReportLedgerVerificationFields } from "./ledger-verification-fields";
import { auditReportLedgerDeduplicatedQueryText } from "./local-review-bundle";
import type { AuditEvidenceReportLedgerEventRecord } from "./report-contracts";
import { auditReportLedgerMetadataBoolean, auditReportLedgerMetadataNumber, auditReportLedgerMetadataStringList, auditReportLedgerMetadataText } from "./signing-key-ledger";

export function buildAuditEvidenceReportLedgerP2Fields(
  event: AuditEvidenceReportLedgerEventRecord,
  context: ReturnType<typeof buildAuditEvidenceReportLedgerBaseFields> & ReturnType<typeof buildAuditEvidenceReportLedgerVerificationFields> & ReturnType<typeof buildAuditEvidenceReportLedgerP0Fields> & ReturnType<typeof buildAuditEvidenceReportLedgerResearchRunbookFields>
) {
  const { reportKind, contentSha256, artifactKind, fileName, shortHash, focusQuery, isHashReady, status, signature, signatureStatus, signatureLabel, importVerificationVerified, importVerificationInvalid, importVerificationDetail, paperPreflightState, paperPreflightActionId, paperPreflightActionLabel, paperPreflightGateTotal, paperPreflightGatePassedCount, paperPreflightGateReviewCount, paperPreflightGateBlockedCount, paperPreflightLiveBoundary, p0PreparationEvidenceRunId, p0BacklogReadinessRecorded, p0BacklogReadinessSummary, p0BacklogExecutableCount, p0BacklogNotExecutableCount, p0BacklogTotalCount, p0CompletionReadinessRecorded, p0CompletionBlockedCount, p0CompletionCurrentCriterionActionLabel, p0CompletionCurrentCriterionId, p0CompletionCurrentCriterionLabel, p0CompletionCurrentCriterionStatus, p0CompletionCurrentCriterionTargetWorkspaceId, p0CompletionOpenCriterionIds, p0CompletionPassedCount, p0CompletionProgressPct, p0CompletionReviewCount, p0CompletionSummary, p0CompletionTotalCount, p0FirstBacklogCanExecute, p0FirstBacklogExecutableActionId, p0FirstBacklogReadinessReason, p0CurrentGapActionId, p0CurrentGapActionLabel, p0CurrentGapTargetWorkspaceId, p0CurrentGapWorkspaceId, p0CurrentGapFallbackParams, p0CurrentGapDeepLinkSearch, p0CurrentGapDeepLinkWorkspaceId, p0CurrentGapComputedReadiness, p0CurrentGapExecutableActionId, p0CurrentGapCanExecute, p0CurrentGapReadinessReason, paperPreflightLabel, p0SearchText, preLiveRunbookSearchText, researchContextMarket, researchContextSymbol, researchContextTimeframe, researchContextPreflightStatus, researchContextNextAction, researchContextPreparationEvidenceRunId, researchContextRecordedLink, researchContextFallbackParams, researchContextLinkSearch, researchContextLinkDecodedSearch, researchContextLinkLabel, researchContextSearchText, evidenceLinkSearch, evidenceLinkStatus, evidenceTargetWorkspaceId, evidenceLinkDecodedSearch, operatorRunbookAdapterId, operatorRunbookMarket, operatorRunbookSymbol, operatorRunbookTimeframe, operatorRunbookStatus, operatorRunbookCompletedSections, operatorRunbookTotalSections, operatorRunbookNextActionId, operatorRunbookSectionIds, operatorRunbookSectionStatuses, operatorRunbookSectionEvidence, operatorRunbookControlSnapshot, operatorRunbookSearchText, preLiveRunbookAdapterId, preLiveRunbookMarket, preLiveRunbookSymbol, preLiveRunbookTimeframe, preLiveRunbookStatus, preLiveRunbookCompletedSteps, preLiveRunbookTotalSteps, preLiveRunbookNextStep, preLiveRunbookNextStepId, preLiveRunbookEvidenceIds } = context;
  const isP2ManifestChainPreflightReport =
    reportKind === "p2_manifest_chain_preflight" || reportKind === "p2_manifest_chain_preflight_review";
  const p2ManifestChainPreflightStatus = isP2ManifestChainPreflightReport
    ? auditReportLedgerMetadataText(event.metadata, "preflightStatus") ||
      auditReportLedgerMetadataText(event.metadata, "state") ||
      event.stage
    : "";
  const p2ManifestChainPreflightNextAction = isP2ManifestChainPreflightReport
    ? auditReportLedgerMetadataText(event.metadata, "nextAction")
    : "";
  const p2ManifestChainPreflightBlockers = isP2ManifestChainPreflightReport
    ? auditReportLedgerMetadataStringList(event.metadata, "blockerIds")
    : [];
  const p2ManifestChainPreflightValidStages = isP2ManifestChainPreflightReport
    ? auditReportLedgerMetadataNumber(event.metadata, "validStageCount")
    : 0;
  const p2ManifestChainPreflightTotalStages = isP2ManifestChainPreflightReport
    ? auditReportLedgerMetadataNumber(event.metadata, "totalStageCount")
    : 0;
  const p2ManifestChainPreflightSafeBoundary =
    !isP2ManifestChainPreflightReport ||
    (auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "liveOrderSubmitted") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "routeExecuted"));
  const p2ManifestChainPreflightSearchText =
    isP2ManifestChainPreflightReport
      ? [
          reportKind,
          p2ManifestChainPreflightStatus,
          `${p2ManifestChainPreflightValidStages}/${p2ManifestChainPreflightTotalStages}`,
          p2ManifestChainPreflightNextAction,
          p2ManifestChainPreflightBlockers.join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "stageIds").join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "stageStatuses").join(" "),
          auditReportLedgerMetadataText(event.metadata, "sourcePath"),
          p2ManifestChainPreflightSafeBoundary ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const p2ReadinessEvidenceCoverageReviewStatus =
    reportKind === "p2_readiness_evidence_coverage_review"
      ? auditReportLedgerMetadataText(event.metadata, "coverageStatus") ||
        auditReportLedgerMetadataText(event.metadata, "state") ||
        event.stage
      : "";
  const p2ReadinessEvidenceCoverageReviewSafeBoundary =
    reportKind !== "p2_readiness_evidence_coverage_review" ||
    (auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed"));
  const p2ReadinessEvidenceCoverageReviewSearchText =
    reportKind === "p2_readiness_evidence_coverage_review"
      ? [
          "p2_readiness_evidence_coverage_review",
          p2ReadinessEvidenceCoverageReviewStatus,
          `${auditReportLedgerMetadataNumber(event.metadata, "coveredCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalCount"
          )}`,
          auditReportLedgerMetadataStringList(event.metadata, "rowIds").join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "rowStatuses").join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "sourceTypes").join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "sourceIds").join(" "),
          p2ReadinessEvidenceCoverageReviewSafeBoundary ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const p2ReadinessAcceptanceGeneratedStatus =
    reportKind === "p2_readiness_acceptance_generated"
      ? auditReportLedgerMetadataText(event.metadata, "acceptanceStatus") ||
        auditReportLedgerMetadataText(event.metadata, "status") ||
        auditReportLedgerMetadataText(event.metadata, "state")
      : "";
  const p2ReadinessAcceptanceGeneratedRunId =
    reportKind === "p2_readiness_acceptance_generated"
      ? auditReportLedgerMetadataText(event.metadata, "runId") || event.runId || ""
      : "";
  const p2ReadinessAcceptanceGeneratedAcceptedCriteria =
    reportKind === "p2_readiness_acceptance_generated"
      ? auditReportLedgerMetadataNumber(event.metadata, "acceptedCriterionCount")
      : 0;
  const p2ReadinessAcceptanceGeneratedTotalCriteria =
    reportKind === "p2_readiness_acceptance_generated"
      ? auditReportLedgerMetadataNumber(event.metadata, "totalCriterionCount")
      : 0;
  const p2ReadinessAcceptanceGeneratedMarket =
    reportKind === "p2_readiness_acceptance_generated" ? auditReportLedgerMetadataText(event.metadata, "market") : "";
  const p2ReadinessAcceptanceGeneratedSymbol =
    reportKind === "p2_readiness_acceptance_generated" ? auditReportLedgerMetadataText(event.metadata, "symbol") : "";
  const p2ReadinessAcceptanceGeneratedTimeframe =
    reportKind === "p2_readiness_acceptance_generated" ? auditReportLedgerMetadataText(event.metadata, "timeframe") : "";
  const p2ReadinessAcceptanceGeneratedSafeBoundary =
    reportKind !== "p2_readiness_acceptance_generated" ||
    (auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "liveOrderSubmitted") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "routeExecuted"));
  const p2ReadinessAcceptanceGeneratedSearchText =
    reportKind === "p2_readiness_acceptance_generated"
      ? [
          "p2_readiness_acceptance_generated",
          p2ReadinessAcceptanceGeneratedStatus,
          `${p2ReadinessAcceptanceGeneratedAcceptedCriteria}/${p2ReadinessAcceptanceGeneratedTotalCriteria}`,
          p2ReadinessAcceptanceGeneratedRunId,
          p2ReadinessAcceptanceGeneratedMarket,
          p2ReadinessAcceptanceGeneratedSymbol,
          p2ReadinessAcceptanceGeneratedTimeframe,
          auditReportLedgerMetadataText(event.metadata, "adapterId"),
          auditReportLedgerMetadataText(event.metadata, "sourcePath"),
          auditReportLedgerMetadataStringList(event.metadata, "criterionIds").join(" "),
          auditReportLedgerMetadataBoolean(event.metadata, "paperOnly") ? "paper-only" : "",
          p2ReadinessAcceptanceGeneratedSafeBoundary ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const p2ReadinessAcceptanceReviewStatus =
    reportKind === "p2_readiness_acceptance_review"
      ? auditReportLedgerMetadataText(event.metadata, "state") ||
        auditReportLedgerMetadataText(event.metadata, "status") ||
        event.stage
      : "";
  const p2ReadinessAcceptanceReviewRunId =
    reportKind === "p2_readiness_acceptance_review"
      ? auditReportLedgerMetadataText(event.metadata, "runId") || event.runId || ""
      : "";
  const p2ReadinessAcceptanceReviewSafeBoundary =
    reportKind !== "p2_readiness_acceptance_review" ||
    (auditReportLedgerMetadataBoolean(event.metadata, "liveBlockedBoundary") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "orderSubmissionEnabled") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "liveOrderSubmitted") &&
      !auditReportLedgerMetadataBoolean(event.metadata, "routeExecuted"));
  const p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId =
    reportKind === "p2_readiness_acceptance_review"
      ? auditReportLedgerMetadataText(event.metadata, "currentEvidenceCoverageReviewAuditEventId")
      : "";
  const p2ReadinessAcceptanceCoverageReviewLinkLabel = p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId
    ? `linked coverage review · ${p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId}`
    : "";
  const p2ReadinessAcceptanceCoverageReviewLinkQuery = p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId
    ? auditReportLedgerDeduplicatedQueryText([
        "linked-coverage-review",
        "p2_readiness_evidence_coverage_review",
        p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId,
        event.eventId,
        event.createdAt
      ])
    : "";
  const p2ReadinessReviewChainLabel = p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId
    ? `linked review chain · ${event.eventId} -> ${p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId}`
    : "";
  const p2ReadinessReviewChainQuery = p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId
    ? auditReportLedgerDeduplicatedQueryText([
        "linked-review-chain",
        event.eventId,
        p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId,
        event.createdAt
      ])
    : "";
  const p2ReadinessAcceptanceReviewSearchText =
    reportKind === "p2_readiness_acceptance_review"
      ? [
          "p2_readiness_acceptance_review",
          p2ReadinessAcceptanceReviewStatus,
          `${auditReportLedgerMetadataNumber(event.metadata, "acceptedCriterionCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalCriterionCount"
          )}`,
          p2ReadinessAcceptanceReviewRunId,
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "adapterId"),
          auditReportLedgerMetadataText(event.metadata, "sourcePath"),
          p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId,
          p2ReadinessAcceptanceCoverageReviewLinkLabel,
          p2ReadinessAcceptanceCoverageReviewLinkQuery,
          p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId ? "linked acceptance review" : "",
          p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId ? "linked-acceptance-review" : "",
          p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId ? "linked review chain" : "",
          p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId ? "linked-review-chain" : "",
          p2ReadinessReviewChainLabel,
          p2ReadinessReviewChainQuery,
          auditReportLedgerMetadataStringList(event.metadata, "criterionIds").join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "auditEventIds").join(" "),
          p2ReadinessAcceptanceReviewSafeBoundary ? "live-blocked-boundary" : "unsafe-boundary"
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  return { isP2ManifestChainPreflightReport, p2ManifestChainPreflightStatus, p2ManifestChainPreflightNextAction, p2ManifestChainPreflightBlockers, p2ManifestChainPreflightValidStages, p2ManifestChainPreflightTotalStages, p2ManifestChainPreflightSafeBoundary, p2ManifestChainPreflightSearchText, p2ReadinessEvidenceCoverageReviewStatus, p2ReadinessEvidenceCoverageReviewSafeBoundary, p2ReadinessEvidenceCoverageReviewSearchText, p2ReadinessAcceptanceGeneratedStatus, p2ReadinessAcceptanceGeneratedRunId, p2ReadinessAcceptanceGeneratedAcceptedCriteria, p2ReadinessAcceptanceGeneratedTotalCriteria, p2ReadinessAcceptanceGeneratedMarket, p2ReadinessAcceptanceGeneratedSymbol, p2ReadinessAcceptanceGeneratedTimeframe, p2ReadinessAcceptanceGeneratedSafeBoundary, p2ReadinessAcceptanceGeneratedSearchText, p2ReadinessAcceptanceReviewStatus, p2ReadinessAcceptanceReviewRunId, p2ReadinessAcceptanceReviewSafeBoundary, p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId, p2ReadinessAcceptanceCoverageReviewLinkLabel, p2ReadinessAcceptanceCoverageReviewLinkQuery, p2ReadinessReviewChainLabel, p2ReadinessReviewChainQuery, p2ReadinessAcceptanceReviewSearchText };
}
