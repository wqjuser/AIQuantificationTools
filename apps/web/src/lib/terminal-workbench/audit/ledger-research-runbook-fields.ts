import { auditReportLedgerOperatorRunbookSectionLabel, auditReportLedgerPreLiveRunbookEvidenceLabel } from "./evidence-control-room";
import { buildAuditEvidenceReportLedgerBaseFields } from "./ledger-base-fields";
import { buildAuditEvidenceReportLedgerP0Fields } from "./ledger-p0-fields";
import { buildAuditEvidenceReportLedgerVerificationFields } from "./ledger-verification-fields";
import type { AuditEvidenceReportLedgerEventRecord } from "./report-contracts";
import { auditReportLedgerResearchContextLabel, auditReportLedgerUrlSearch } from "./report-queries";
import { auditReportLedgerMetadataNumber, auditReportLedgerMetadataStringList, auditReportLedgerMetadataText } from "./signing-key-ledger";
import { auditReportLedgerDecodedSearchText, auditReportLedgerEvidenceTargetWorkspaceId } from "../research-package/import-audit";

export function buildAuditEvidenceReportLedgerResearchRunbookFields(
  event: AuditEvidenceReportLedgerEventRecord,
  context: ReturnType<typeof buildAuditEvidenceReportLedgerBaseFields> & ReturnType<typeof buildAuditEvidenceReportLedgerVerificationFields> & ReturnType<typeof buildAuditEvidenceReportLedgerP0Fields>
) {
  const { reportKind, contentSha256, artifactKind, fileName, shortHash, focusQuery, isHashReady, status, signature, signatureStatus, signatureLabel, importVerificationVerified, importVerificationInvalid, importVerificationDetail, paperPreflightState, paperPreflightActionId, paperPreflightActionLabel, paperPreflightGateTotal, paperPreflightGatePassedCount, paperPreflightGateReviewCount, paperPreflightGateBlockedCount, paperPreflightLiveBoundary, p0PreparationEvidenceRunId, p0BacklogReadinessRecorded, p0BacklogReadinessSummary, p0BacklogExecutableCount, p0BacklogNotExecutableCount, p0BacklogTotalCount, p0CompletionReadinessRecorded, p0CompletionBlockedCount, p0CompletionCurrentCriterionActionLabel, p0CompletionCurrentCriterionId, p0CompletionCurrentCriterionLabel, p0CompletionCurrentCriterionStatus, p0CompletionCurrentCriterionTargetWorkspaceId, p0CompletionOpenCriterionIds, p0CompletionPassedCount, p0CompletionProgressPct, p0CompletionReviewCount, p0CompletionSummary, p0CompletionTotalCount, p0FirstBacklogCanExecute, p0FirstBacklogExecutableActionId, p0FirstBacklogReadinessReason, p0CurrentGapActionId, p0CurrentGapActionLabel, p0CurrentGapTargetWorkspaceId, p0CurrentGapWorkspaceId, p0CurrentGapFallbackParams, p0CurrentGapDeepLinkSearch, p0CurrentGapDeepLinkWorkspaceId, p0CurrentGapComputedReadiness, p0CurrentGapExecutableActionId, p0CurrentGapCanExecute, p0CurrentGapReadinessReason, paperPreflightLabel, p0SearchText } = context;
  const preLiveRunbookSearchText =
    reportKind === "pre_live_runbook_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "adapterId"),
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "status"),
          auditReportLedgerMetadataText(event.metadata, "nextStepId"),
          auditReportLedgerMetadataText(event.metadata, "nextStep"),
          `${auditReportLedgerMetadataNumber(event.metadata, "completedSteps")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalSteps"
          )}`,
          auditReportLedgerPreLiveRunbookEvidenceLabel(
            auditReportLedgerMetadataStringList(event.metadata, "evidenceIds").length
          ),
          auditReportLedgerMetadataStringList(event.metadata, "evidenceIds").join(" "),
          auditReportLedgerMetadataText(event.metadata, "boundary")
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const researchContextMarket =
    reportKind === "research_context_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "market") : "";
  const researchContextSymbol =
    reportKind === "research_context_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "symbol") : "";
  const researchContextTimeframe =
    reportKind === "research_context_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "timeframe") : "";
  const researchContextPreflightStatus =
    reportKind === "research_context_readiness_report"
      ? auditReportLedgerMetadataText(event.metadata, "preflightStatus")
      : "";
  const researchContextNextAction =
    reportKind === "research_context_readiness_report" ? auditReportLedgerMetadataText(event.metadata, "nextAction") : "";
  const researchContextPreparationEvidenceRunId =
    reportKind === "research_context_readiness_report"
      ? auditReportLedgerMetadataText(event.metadata, "lockedPreparationEvidenceRunId")
      : "";
  const researchContextRecordedLink = auditReportLedgerMetadataText(event.metadata, "contextLink");
  const researchContextFallbackParams = new URLSearchParams();
  if (reportKind === "research_context_readiness_report" && researchContextMarket && researchContextSymbol && researchContextTimeframe) {
    researchContextFallbackParams.set("workspace", "research");
    researchContextFallbackParams.set("market", researchContextMarket);
    researchContextFallbackParams.set("symbol", researchContextSymbol);
    researchContextFallbackParams.set("timeframe", researchContextTimeframe);
    if (researchContextPreparationEvidenceRunId) {
      researchContextFallbackParams.set("watchlistRefreshRun", researchContextPreparationEvidenceRunId);
    }
  }
  const researchContextLinkSearch =
    reportKind === "research_context_readiness_report"
      ? auditReportLedgerUrlSearch(researchContextRecordedLink) || researchContextFallbackParams.toString()
      : "";
  const researchContextLinkDecodedSearch = auditReportLedgerDecodedSearchText(researchContextLinkSearch);
  const researchContextLinkLabel =
    reportKind === "research_context_readiness_report"
      ? auditReportLedgerResearchContextLabel({
          fallbackMarket: researchContextMarket,
          fallbackSymbol: researchContextSymbol,
          fallbackTimeframe: researchContextTimeframe,
          search: researchContextLinkSearch
        })
      : "";
  const researchContextSearchText =
    reportKind === "research_context_readiness_report"
      ? [
          researchContextMarket,
          researchContextSymbol,
          researchContextTimeframe,
          researchContextPreflightStatus,
          researchContextNextAction,
          researchContextPreparationEvidenceRunId,
          researchContextLinkSearch,
          researchContextLinkDecodedSearch,
          researchContextLinkLabel,
          researchContextRecordedLink ? "research-context-link-recorded" : "research-context-link-derived",
          auditReportLedgerMetadataText(event.metadata, "boundary")
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const evidenceLinkSearch =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerMetadataText(event.metadata, "latestEvidenceLink")
      : "";
  const evidenceLinkStatus =
    reportKind === "p0_readiness_report"
      ? auditReportLedgerMetadataText(event.metadata, "latestEvidenceState")
      : "";
  const evidenceTargetWorkspaceId = auditReportLedgerEvidenceTargetWorkspaceId(evidenceLinkSearch);
  const evidenceLinkDecodedSearch = auditReportLedgerDecodedSearchText(evidenceLinkSearch);
  const operatorRunbookAdapterId =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "adapterId") : "";
  const operatorRunbookMarket =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "market") : "";
  const operatorRunbookSymbol =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "symbol") : "";
  const operatorRunbookTimeframe =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "timeframe") : "";
  const operatorRunbookStatus =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "status") : "";
  const operatorRunbookCompletedSections =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataNumber(event.metadata, "completedSections") : 0;
  const operatorRunbookTotalSections =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataNumber(event.metadata, "totalSections") : 0;
  const operatorRunbookNextActionId =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "nextActionId") : "";
  const operatorRunbookSectionIds =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataStringList(event.metadata, "sectionIds") : [];
  const operatorRunbookSectionStatuses =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataStringList(event.metadata, "sectionStatuses") : [];
  const operatorRunbookSectionEvidence =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataStringList(event.metadata, "sectionEvidence") : [];
  const operatorRunbookControlSnapshot =
    reportKind === "operator_runbook_report" ? auditReportLedgerMetadataStringList(event.metadata, "controlSnapshot") : [];
  const operatorRunbookSearchText =
    reportKind === "operator_runbook_report"
      ? [
          operatorRunbookAdapterId,
          operatorRunbookMarket,
          operatorRunbookSymbol,
          operatorRunbookTimeframe,
          operatorRunbookStatus,
          operatorRunbookNextActionId,
          `${operatorRunbookCompletedSections}/${operatorRunbookTotalSections}`,
          auditReportLedgerOperatorRunbookSectionLabel(operatorRunbookSectionStatuses.length),
          operatorRunbookSectionIds.join(" "),
          operatorRunbookSectionStatuses.join(" "),
          operatorRunbookSectionEvidence.join(" "),
          operatorRunbookControlSnapshot.join(" "),
          auditReportLedgerMetadataText(event.metadata, "boundary")
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const preLiveRunbookAdapterId =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "adapterId") : "";
  const preLiveRunbookMarket =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "market") : "";
  const preLiveRunbookSymbol =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "symbol") : "";
  const preLiveRunbookTimeframe =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "timeframe") : "";
  const preLiveRunbookStatus =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "status") : "";
  const preLiveRunbookCompletedSteps =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataNumber(event.metadata, "completedSteps") : 0;
  const preLiveRunbookTotalSteps =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataNumber(event.metadata, "totalSteps") : 0;
  const preLiveRunbookNextStep =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "nextStep") : "";
  const preLiveRunbookNextStepId =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataText(event.metadata, "nextStepId") : "";
  const preLiveRunbookEvidenceIds =
    reportKind === "pre_live_runbook_report" ? auditReportLedgerMetadataStringList(event.metadata, "evidenceIds") : [];
  return { preLiveRunbookSearchText, researchContextMarket, researchContextSymbol, researchContextTimeframe, researchContextPreflightStatus, researchContextNextAction, researchContextPreparationEvidenceRunId, researchContextRecordedLink, researchContextFallbackParams, researchContextLinkSearch, researchContextLinkDecodedSearch, researchContextLinkLabel, researchContextSearchText, evidenceLinkSearch, evidenceLinkStatus, evidenceTargetWorkspaceId, evidenceLinkDecodedSearch, operatorRunbookAdapterId, operatorRunbookMarket, operatorRunbookSymbol, operatorRunbookTimeframe, operatorRunbookStatus, operatorRunbookCompletedSections, operatorRunbookTotalSections, operatorRunbookNextActionId, operatorRunbookSectionIds, operatorRunbookSectionStatuses, operatorRunbookSectionEvidence, operatorRunbookControlSnapshot, operatorRunbookSearchText, preLiveRunbookAdapterId, preLiveRunbookMarket, preLiveRunbookSymbol, preLiveRunbookTimeframe, preLiveRunbookStatus, preLiveRunbookCompletedSteps, preLiveRunbookTotalSteps, preLiveRunbookNextStep, preLiveRunbookNextStepId, preLiveRunbookEvidenceIds };
}
