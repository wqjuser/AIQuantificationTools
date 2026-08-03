import type { AuditEvidenceReportLedgerSummary } from "./deep-link-queries";
import { buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle, buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel, buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle, buildAuditEvidenceReportLedgerRowP0CompletionLabel, buildAuditEvidenceReportLedgerRowP0CompletionTitle, buildAuditEvidenceReportLedgerRowP0ProgressQuery } from "./deep-link-queries";
import { auditReportLedgerPreLiveRunbookEvidenceLabel, evidencePackageCoverageDetail, evidencePackageSignatureState } from "./evidence-control-room";
import { auditReportLedgerLatestAuditAidBacklogReadinessQuery, auditReportLedgerLatestAuditAidCompletionQuery, auditReportLedgerLatestAuditAidCurrentGapReadinessQuery, auditReportLedgerLatestResearchContextReportQuery, auditReportLedgerLocalReviewBundleCoverage, auditReportLedgerPreparationEvidenceLabel, buildAuditEvidenceReportLedgerRowP0ProgressLabel } from "./local-review-bundle";
import { auditReportLedgerLocalReviewBundleTitle, auditReportLedgerP2ReviewChainHealthContextSummaryTitle, auditReportLedgerP2ReviewChainHealthSummaryTitle } from "./local-review-markers";
import type { AuditEvidenceReportLedgerEventRecord, AuditEvidenceReportLedgerRow, AuditEvidenceReportSignatureStatus, EvidencePackageControlRoom, EvidencePackageControlRoomAction, EvidencePackageControlRoomRow, EvidencePackageControlRoomStatus, EvidencePackageControlRoomSummary, ResearchRunExportIndexRow, ResearchRunExportIndexStatus, ResearchRunImportAuditEvent, ResearchRunImportAuditEventStage } from "./report-contracts";
import { auditReportLedgerLatestAuditAidPreflightQuery, auditReportLedgerLatestAuditAidReportQuery, auditReportLedgerLatestReportQuery, auditReportLedgerLocalReviewBundleLatestLabel, auditReportLedgerLocalReviewBundleLatestQuery, auditReportLedgerLocalReviewBundleLatestTitle, auditReportLedgerReportKindLabel, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery, buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery, buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle, buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery, buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery, buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle, buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle } from "./report-queries";
import { auditReportLedgerMetadataText, timestampSortValue } from "./signing-key-ledger";
import type { P0AcceptanceSummary, P0AcceptanceSummaryState } from "../stage1/foundation-contracts";

export function buildAuditEvidenceReportLedgerSummary(
  rows: AuditEvidenceReportLedgerRow[]
): AuditEvidenceReportLedgerSummary {
  const signingEligibleRows = rows.filter(auditReportLedgerRowIsSigningEligible);
  const readyRows = rows.filter((row) => row.status === "ready");
  const ready = readyRows.length;
  const invalid = rows.filter((row) => row.status === "invalid").length;
  const unsigned = signingEligibleRows.filter((row) => row.signatureStatus === "unsigned").length;
  const signed = signingEligibleRows.filter((row) => row.signatureStatus === "signed").length;
  const verified = signingEligibleRows.filter((row) => row.signatureStatus === "verified").length;
  const revoked = signingEligibleRows.filter((row) => row.signatureStatus === "revoked").length;
  const signingInvalid = signingEligibleRows.filter((row) => row.status === "invalid").length;
  const importVerificationVerified = rows.reduce((total, row) => total + row.importVerificationVerified, 0);
  const importVerificationInvalid = rows.reduce((total, row) => total + row.importVerificationInvalid, 0);
  const attention = invalid + revoked;
  const signingAttention = signingInvalid + revoked;
  const auditAidRows = rows.filter(
    (row) =>
      row.reportKind === "p0_readiness_report" ||
      row.reportKind === "operator_runbook_report" ||
      row.reportKind === "pre_live_runbook_report" ||
      row.reportKind === "research_context_readiness_report"
  );
  const p0AuditAidRows = rows.filter((row) => row.reportKind === "p0_readiness_report");
  const actionableAuditAidRows = p0AuditAidRows.filter((row) => row.status === "ready");
  const latestAuditAidRow = actionableAuditAidRows.reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, undefined);
  const latestResearchContextReportRow = rows
    .filter((row) => row.reportKind === "research_context_readiness_report" && row.status === "ready")
    .reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
      if (!latest) {
        return row;
      }
      return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
    }, undefined);
  const latestPreLiveRunbookRow = rows
    .filter((row) => row.reportKind === "pre_live_runbook_report" && row.status === "ready")
    .reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
      if (!latest) {
        return row;
      }
      return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
    }, undefined);
  const latestPersonalTeamReadinessReviewRow = rows
    .filter((row) => row.reportKind === "personal_team_readiness_review" && row.status === "ready")
    .reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
      if (!latest) {
        return row;
      }
      return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
    }, undefined);
  const latestDailyOpsControlRoomReviewRow = rows
    .filter((row) => row.reportKind === "daily_ops_control_room_review" && row.status === "ready")
    .reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
      if (!latest) {
        return row;
      }
      return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
    }, undefined);
  const latestDailyStartBriefReviewRow = rows
    .filter((row) => row.reportKind === "daily_start_brief_review" && row.status === "ready")
    .reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
      if (!latest) {
        return row;
      }
      return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
    }, undefined);
  const latestStage1DailyArchiveReviewRow = rows
    .filter((row) => row.reportKind === "stage1_daily_archive_review" && row.status === "ready")
    .reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
      if (!latest) {
        return row;
      }
      return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
    }, undefined);
  const localReviewBundleRows = readyRows.filter(
    (row) =>
      row.reportKind === "personal_team_readiness_review" ||
      row.reportKind === "daily_ops_control_room_review" ||
      row.reportKind === "daily_start_brief_review" ||
      row.reportKind === "stage1_daily_archive_review"
  );
  const localReviewBundlePersonalTeamCount = localReviewBundleRows.filter(
    (row) => row.reportKind === "personal_team_readiness_review"
  ).length;
  const localReviewBundleDailyOpsCount = localReviewBundleRows.filter(
    (row) => row.reportKind === "daily_ops_control_room_review"
  ).length;
  const localReviewBundleDailyStartCount = localReviewBundleRows.filter(
    (row) => row.reportKind === "daily_start_brief_review"
  ).length;
  const localReviewBundleStage1ArchiveCount = localReviewBundleRows.filter(
    (row) => row.reportKind === "stage1_daily_archive_review"
  ).length;
  const localReviewBundleCoverage = auditReportLedgerLocalReviewBundleCoverage({
    dailyOpsCount: localReviewBundleDailyOpsCount,
    dailyStartCount: localReviewBundleDailyStartCount,
    personalTeamCount: localReviewBundlePersonalTeamCount,
    stage1ArchiveCount: localReviewBundleStage1ArchiveCount
  });
  const latestLocalReviewBundleRow = localReviewBundleRows.reduce<AuditEvidenceReportLedgerRow | undefined>(
    (latest, row) => {
      if (!latest) {
        return row;
      }
      return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
    },
    undefined
  );
  const p2ReadinessLinkedAcceptanceReviewRows = rows.filter(
    (row) =>
      row.reportKind === "p2_readiness_acceptance_review" &&
      row.status === "ready" &&
      Boolean(row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId.trim())
  );
  const p2ReadinessReviewChainLoadedRows = p2ReadinessLinkedAcceptanceReviewRows.filter(
    (row) => row.p2ReadinessReviewChainCoverageLoaded
  );
  const p2ReadinessReviewChainMissingCoverageRows = p2ReadinessLinkedAcceptanceReviewRows.filter(
    (row) => !row.p2ReadinessReviewChainCoverageLoaded
  );
  const p2ReadinessReviewChainMissingAcceptanceRows = rows.filter(
    (row) =>
      row.reportKind === "p2_readiness_evidence_coverage_review" &&
      row.status === "ready" &&
      row.p2ReadinessReviewChainCoverageLoaded &&
      !row.p2ReadinessReviewChainAcceptanceLoaded
  );
  const p2ReadinessReviewChainGapRows = [
    ...p2ReadinessReviewChainMissingCoverageRows,
    ...p2ReadinessReviewChainMissingAcceptanceRows
  ];
  const p2ReadinessReviewChainHealthContextRows = rows.filter((row) =>
    Boolean(row.p2ReadinessReviewChainHealthContextQuery.trim())
  );
  const p2ReadinessReviewChainGapCount = p2ReadinessReviewChainGapRows.length;
  const latestP2ReadinessReviewChainGapRow = p2ReadinessReviewChainGapRows.reduce<
    AuditEvidenceReportLedgerRow | undefined
  >((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, undefined);
  const p2ReadinessReviewChainHealthState: AuditEvidenceReportLedgerSummary["p2ReadinessReviewChainHealthState"] =
    p2ReadinessReviewChainGapCount > 0
      ? "gaps"
      : p2ReadinessReviewChainLoadedRows.length > 0
        ? "loaded"
        : "empty";
  const p2ReadinessReviewChainHealthLabel =
    p2ReadinessReviewChainHealthState === "gaps"
      ? `review chain gaps · ${p2ReadinessReviewChainGapCount}`
      : p2ReadinessReviewChainHealthState === "loaded"
        ? `review chain loaded · ${p2ReadinessReviewChainLoadedRows.length}`
        : "";
  const p2ReadinessReviewChainHealthQuery =
    p2ReadinessReviewChainHealthState === "gaps"
      ? "review-chain-health review-chain-gap"
      : p2ReadinessReviewChainHealthState === "loaded"
        ? "review-chain-health review-chain-loaded"
        : "";
  const p2ReadinessReviewChainHealthContextTitle =
    auditReportLedgerP2ReviewChainHealthContextSummaryTitle({
      contextRows: p2ReadinessReviewChainHealthContextRows.length,
      gapRows: p2ReadinessReviewChainGapCount,
      latestGapEventId: latestP2ReadinessReviewChainGapRow?.id,
      loadedChains: p2ReadinessReviewChainLoadedRows.length,
      missingAcceptance: p2ReadinessReviewChainMissingAcceptanceRows.length,
      missingCoverage: p2ReadinessReviewChainMissingCoverageRows.length
    });
  const p2ReadinessReviewChainHealthTitle = auditReportLedgerP2ReviewChainHealthSummaryTitle({
    contextRows: p2ReadinessReviewChainHealthContextRows.length,
    gapRows: p2ReadinessReviewChainGapCount,
    latestGapEventId: latestP2ReadinessReviewChainGapRow?.id,
    loadedChains: p2ReadinessReviewChainLoadedRows.length,
    missingAcceptance: p2ReadinessReviewChainMissingAcceptanceRows.length,
    missingCoverage: p2ReadinessReviewChainMissingCoverageRows.length,
    query: p2ReadinessReviewChainHealthQuery,
    state: p2ReadinessReviewChainHealthState
  });
  const latestP2ReadinessLinkedAcceptanceReviewRow = p2ReadinessLinkedAcceptanceReviewRows.reduce<
    AuditEvidenceReportLedgerRow | undefined
  >((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, undefined);
  const latestReadyRow = readyRows.reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, undefined);
  return {
    attention,
    auditAid: auditAidRows.length,
    chainStatus:
      signingEligibleRows.length === 0
        ? "empty"
        : signingAttention > 0
          ? "attention"
          : unsigned > 0
            ? "unsigned"
            : "verified",
    importVerificationInvalid,
    importVerificationVerified,
    invalid,
    latestAuditAidEventId: latestAuditAidRow?.id ?? "",
    latestAuditAidCurrentGapActionId: latestAuditAidRow?.p0CurrentGapActionId ?? "",
    latestAuditAidCurrentGapActionLabel: latestAuditAidRow?.p0CurrentGapActionLabel ?? "",
    latestAuditAidCurrentGapCanExecute: latestAuditAidRow?.p0CurrentGapCanExecute ?? false,
    latestAuditAidCurrentGapDeepLinkSearch: latestAuditAidRow?.p0CurrentGapDeepLinkSearch ?? "",
    latestAuditAidCurrentGapExecutableActionId: latestAuditAidRow?.p0CurrentGapExecutableActionId ?? "",
    latestAuditAidCurrentGapReadinessQuery: auditReportLedgerLatestAuditAidCurrentGapReadinessQuery(latestAuditAidRow),
    latestAuditAidCurrentGapReadinessReason: latestAuditAidRow?.p0CurrentGapReadinessReason ?? "not-ready-report",
    latestAuditAidCurrentGapReadinessTitle: buildAuditEvidenceReportLedgerRowCurrentGapReadinessTitle(latestAuditAidRow),
    latestAuditAidCurrentGapTargetWorkspaceId: latestAuditAidRow?.p0CurrentGapTargetWorkspaceId ?? null,
    latestAuditAidCurrentGapWorkspaceId: latestAuditAidRow?.p0CurrentGapWorkspaceId ?? null,
    latestAuditAidBacklogExecutableCount: latestAuditAidRow?.p0BacklogExecutableCount ?? 0,
    latestAuditAidBacklogNotExecutableCount: latestAuditAidRow?.p0BacklogNotExecutableCount ?? 0,
    latestAuditAidBacklogReadinessLabel: buildAuditEvidenceReportLedgerRowP0BacklogReadinessLabel(latestAuditAidRow),
    latestAuditAidBacklogReadinessQuery: auditReportLedgerLatestAuditAidBacklogReadinessQuery(latestAuditAidRow),
    latestAuditAidBacklogReadinessRecorded: latestAuditAidRow?.p0BacklogReadinessRecorded ?? false,
    latestAuditAidBacklogReadinessSummary: latestAuditAidRow?.p0BacklogReadinessSummary ?? "",
    latestAuditAidBacklogReadinessTitle: buildAuditEvidenceReportLedgerRowP0BacklogReadinessTitle(latestAuditAidRow),
    latestAuditAidBacklogTotalCount: latestAuditAidRow?.p0BacklogTotalCount ?? 0,
    latestAuditAidCompletionLabel: buildAuditEvidenceReportLedgerRowP0CompletionLabel(latestAuditAidRow),
    latestAuditAidCompletionQuery: auditReportLedgerLatestAuditAidCompletionQuery(latestAuditAidRow),
    latestAuditAidCompletionCurrentCriterionActionLabel:
      latestAuditAidRow?.p0CompletionCurrentCriterionActionLabel ?? "",
    latestAuditAidCompletionCurrentCriterionId: latestAuditAidRow?.p0CompletionCurrentCriterionId ?? "",
    latestAuditAidCompletionCurrentCriterionLabel: latestAuditAidRow?.p0CompletionCurrentCriterionLabel ?? "",
    latestAuditAidCompletionCurrentCriterionStatus: latestAuditAidRow?.p0CompletionCurrentCriterionStatus ?? "",
    latestAuditAidCompletionCurrentCriterionTargetWorkspaceId:
      latestAuditAidRow?.p0CompletionCurrentCriterionTargetWorkspaceId ?? null,
    latestAuditAidCompletionRecorded: latestAuditAidRow?.p0CompletionReadinessRecorded ?? false,
    latestAuditAidCompletionTitle: buildAuditEvidenceReportLedgerRowP0CompletionTitle(latestAuditAidRow),
    latestAuditAidEvidenceLabel: latestAuditAidRow?.evidenceLinkLabel || latestAuditAidRow?.focusQuery || "",
    latestAuditAidEvidenceLink:
      latestAuditAidRow?.evidenceLinkDecodedSearch || latestAuditAidRow?.evidenceLinkSearch || "",
    latestAuditAidPreflightActionId: latestAuditAidRow?.paperPreflightActionId ?? "",
    latestAuditAidPreflightActionLabel: latestAuditAidRow?.paperPreflightActionLabel ?? "",
    latestAuditAidPreflightAttention: latestAuditAidRow
      ? latestAuditAidRow.paperPreflightGateReviewCount + latestAuditAidRow.paperPreflightGateBlockedCount
      : 0,
    latestAuditAidPreflightLabel: latestAuditAidRow?.paperPreflightLabel ?? "",
    latestAuditAidPreflightQuery: auditReportLedgerLatestAuditAidPreflightQuery(latestAuditAidRow),
    latestAuditAidPreflightState: latestAuditAidRow?.paperPreflightState ?? "",
    latestAuditAidProgressLabel: buildAuditEvidenceReportLedgerRowP0ProgressLabel(latestAuditAidRow),
    latestAuditAidProgressQuery: buildAuditEvidenceReportLedgerRowP0ProgressQuery(latestAuditAidRow),
    latestAuditAidPreparationEvidenceLabel: auditReportLedgerPreparationEvidenceLabel(
      latestAuditAidRow?.p0PreparationEvidenceRunId ?? ""
    ),
    latestAuditAidPreparationEvidenceRunId: latestAuditAidRow?.p0PreparationEvidenceRunId ?? "",
    latestAuditAidReportQuery: auditReportLedgerLatestAuditAidReportQuery(latestAuditAidRow),
    latestAuditAidRunId: latestAuditAidRow?.runId ?? "",
    latestAuditAidShortHash: latestAuditAidRow?.shortHash ?? "",
    latestDailyOpsControlRoomReviewEventId: latestDailyOpsControlRoomReviewRow?.id ?? "",
    latestDailyOpsControlRoomReviewLabel:
      buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel(latestDailyOpsControlRoomReviewRow),
    latestDailyOpsControlRoomReviewQuery:
      buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery(latestDailyOpsControlRoomReviewRow),
    latestDailyOpsControlRoomReviewShortHash: latestDailyOpsControlRoomReviewRow?.shortHash ?? "",
    latestDailyOpsControlRoomReviewTitle:
      buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle(latestDailyOpsControlRoomReviewRow),
    latestDailyStartBriefReviewEventId: latestDailyStartBriefReviewRow?.id ?? "",
    latestDailyStartBriefReviewLabel:
      buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel(latestDailyStartBriefReviewRow),
    latestDailyStartBriefReviewQuery:
      buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery(latestDailyStartBriefReviewRow),
    latestDailyStartBriefReviewShortHash: latestDailyStartBriefReviewRow?.shortHash ?? "",
    latestDailyStartBriefReviewTitle:
      buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle(latestDailyStartBriefReviewRow),
    latestStage1DailyArchiveReviewEventId: latestStage1DailyArchiveReviewRow?.id ?? "",
    latestStage1DailyArchiveReviewLabel:
      buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel(latestStage1DailyArchiveReviewRow),
    latestStage1DailyArchiveReviewQuery:
      buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery(latestStage1DailyArchiveReviewRow),
    latestStage1DailyArchiveReviewShortHash: latestStage1DailyArchiveReviewRow?.shortHash ?? "",
    latestStage1DailyArchiveReviewTitle:
      buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle(latestStage1DailyArchiveReviewRow),
    latestPersonalTeamReadinessReviewEventId: latestPersonalTeamReadinessReviewRow?.id ?? "",
    latestPersonalTeamReadinessReviewLabel:
      buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel(latestPersonalTeamReadinessReviewRow),
    latestPersonalTeamReadinessReviewQuery:
      buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery(latestPersonalTeamReadinessReviewRow),
    latestPersonalTeamReadinessReviewShortHash: latestPersonalTeamReadinessReviewRow?.shortHash ?? "",
    latestPersonalTeamReadinessReviewTitle:
      buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle(latestPersonalTeamReadinessReviewRow),
    latestPreLiveRunbookAdapterId: latestPreLiveRunbookRow?.preLiveRunbookAdapterId ?? "",
    latestPreLiveRunbookContextLabel: latestPreLiveRunbookRow
      ? [
          latestPreLiveRunbookRow.preLiveRunbookMarket,
          latestPreLiveRunbookRow.preLiveRunbookSymbol,
          latestPreLiveRunbookRow.preLiveRunbookTimeframe
        ]
          .filter(Boolean)
          .join(" ")
      : "",
    latestPreLiveRunbookEvidenceCount: latestPreLiveRunbookRow?.preLiveRunbookEvidenceIds.length ?? 0,
    latestPreLiveRunbookEvidenceLabel: latestPreLiveRunbookRow
      ? auditReportLedgerPreLiveRunbookEvidenceLabel(latestPreLiveRunbookRow.preLiveRunbookEvidenceIds.length)
      : "",
    latestPreLiveRunbookEventId: latestPreLiveRunbookRow?.id ?? "",
    latestPreLiveRunbookGateLabel: latestPreLiveRunbookRow
      ? `${latestPreLiveRunbookRow.preLiveRunbookCompletedSteps}/${latestPreLiveRunbookRow.preLiveRunbookTotalSteps} gates`
      : "",
    latestPreLiveRunbookQuery: buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery(latestPreLiveRunbookRow),
    latestPreLiveRunbookShortHash: latestPreLiveRunbookRow?.shortHash ?? "",
    latestPreLiveRunbookStatus: latestPreLiveRunbookRow?.preLiveRunbookStatus ?? "",
    latestP2ReadinessLinkedAcceptanceReviewEventId: latestP2ReadinessLinkedAcceptanceReviewRow?.id ?? "",
    latestP2ReadinessLinkedAcceptanceReviewQuery:
      buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery(
        latestP2ReadinessLinkedAcceptanceReviewRow
      ),
    latestP2ReadinessLinkedCoverageReviewEventId:
      latestP2ReadinessLinkedAcceptanceReviewRow?.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId ?? "",
    latestP2ReadinessLinkedCoverageReviewLabel:
      latestP2ReadinessLinkedAcceptanceReviewRow?.p2ReadinessAcceptanceCoverageReviewLinkLabel ?? "",
    latestP2ReadinessLinkedCoverageReviewQuery:
      latestP2ReadinessLinkedAcceptanceReviewRow?.p2ReadinessAcceptanceCoverageReviewLinkQuery ?? "",
    latestP2ReadinessReviewChainLabel: latestP2ReadinessLinkedAcceptanceReviewRow
      ? `linked review chain · ${latestP2ReadinessLinkedAcceptanceReviewRow.id} -> ${latestP2ReadinessLinkedAcceptanceReviewRow.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId}`
      : "",
    latestP2ReadinessReviewChainQuery: buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery(
      latestP2ReadinessLinkedAcceptanceReviewRow
    ),
    latestP2ReadinessReviewChainGapEventId: latestP2ReadinessReviewChainGapRow?.id ?? "",
    latestP2ReadinessReviewChainGapLabel: latestP2ReadinessReviewChainGapRow?.p2ReadinessReviewChainStatusLabel ?? "",
    latestP2ReadinessReviewChainGapQuery: latestP2ReadinessReviewChainGapRow?.p2ReadinessReviewChainStatusQuery ?? "",
    p2ReadinessReviewChainCount: p2ReadinessLinkedAcceptanceReviewRows.length,
    p2ReadinessReviewChainGapCount,
    p2ReadinessReviewChainGapsQuery: p2ReadinessReviewChainGapCount > 0 ? "review-chain-gap" : "",
    p2ReadinessReviewChainHealthContextCount: p2ReadinessReviewChainHealthContextRows.length,
    p2ReadinessReviewChainHealthContextQuery:
      p2ReadinessReviewChainHealthContextRows.length > 0 ? "review-chain-health" : "",
    p2ReadinessReviewChainHealthContextTitle,
    p2ReadinessReviewChainHealthLabel,
    p2ReadinessReviewChainHealthQuery,
    p2ReadinessReviewChainHealthState,
    p2ReadinessReviewChainHealthTitle,
    p2ReadinessReviewChainLoadedCount: p2ReadinessReviewChainLoadedRows.length,
    p2ReadinessReviewChainMissingAcceptanceCount: p2ReadinessReviewChainMissingAcceptanceRows.length,
    p2ReadinessReviewChainMissingAcceptanceQuery:
      p2ReadinessReviewChainMissingAcceptanceRows.length > 0 ? "review-chain-acceptance-missing" : "",
    p2ReadinessReviewChainMissingCoverageCount: p2ReadinessReviewChainMissingCoverageRows.length,
    p2ReadinessReviewChainMissingCoverageQuery:
      p2ReadinessReviewChainMissingCoverageRows.length > 0 ? "review-chain-coverage-missing" : "",
    p2ReadinessReviewChainsQuery: p2ReadinessLinkedAcceptanceReviewRows.length > 0 ? "linked-review-chain" : "",
    latestResearchContextReportEventId: latestResearchContextReportRow?.id ?? "",
    latestResearchContextReportLabel: latestResearchContextReportRow?.researchContextLinkLabel ?? "",
    latestResearchContextReportLinkSearch:
      latestResearchContextReportRow?.researchContextLinkDecodedSearch ||
      latestResearchContextReportRow?.researchContextLinkSearch ||
      "",
    latestResearchContextReportPreflightStatus: latestResearchContextReportRow?.researchContextPreflightStatus ?? "",
    latestResearchContextReportPreparationEvidenceRunId:
      latestResearchContextReportRow?.researchContextPreparationEvidenceRunId ?? "",
    latestResearchContextReportQuery: auditReportLedgerLatestResearchContextReportQuery(latestResearchContextReportRow),
    latestResearchContextReportRunId: latestResearchContextReportRow?.runId ?? "",
    latestResearchContextReportShortHash: latestResearchContextReportRow?.shortHash ?? "",
    localReviewBundleCount: localReviewBundleRows.length,
    localReviewBundleCoverageLabel: localReviewBundleCoverage.label,
    localReviewBundleCoverageNextActionLabel: localReviewBundleCoverage.nextActionLabel,
    localReviewBundleCoverageNextActionQuery: localReviewBundleCoverage.nextActionQuery,
    localReviewBundleCoverageNextActionTargetWorkspaceId: localReviewBundleCoverage.nextActionTargetWorkspaceId,
    localReviewBundleCoverageNextActionTitle: localReviewBundleCoverage.nextActionTitle,
    localReviewBundleCoverageQuery: localReviewBundleCoverage.query,
    localReviewBundleCoverageState: localReviewBundleCoverage.state,
    localReviewBundleCoverageTitle: localReviewBundleCoverage.title,
    localReviewBundleDailyOpsCount,
    localReviewBundleDailyStartCount,
    localReviewBundleStage1ArchiveCount,
    localReviewBundleLatestEventId: latestLocalReviewBundleRow?.id ?? "",
    localReviewBundleLatestLabel:
      latestLocalReviewBundleRow?.localReviewBundleLatestLabel ||
      auditReportLedgerLocalReviewBundleLatestLabel(latestLocalReviewBundleRow),
    localReviewBundleLatestQuery:
      latestLocalReviewBundleRow?.localReviewBundleLatestQuery ||
      auditReportLedgerLocalReviewBundleLatestQuery(latestLocalReviewBundleRow),
    localReviewBundleLatestTitle:
      latestLocalReviewBundleRow?.localReviewBundleLatestTitle ||
      auditReportLedgerLocalReviewBundleLatestTitle(latestLocalReviewBundleRow),
    localReviewBundlePersonalTeamCount,
    localReviewBundleQuery: localReviewBundleRows.length > 0 ? "local-review-bundle" : "",
    localReviewBundleTitle: auditReportLedgerLocalReviewBundleTitle({
      dailyOpsCount: localReviewBundleDailyOpsCount,
      dailyStartCount: localReviewBundleDailyStartCount,
      latestEventId: latestLocalReviewBundleRow?.id ?? "",
      latestTitle:
        latestLocalReviewBundleRow?.localReviewBundleLatestTitle ||
        auditReportLedgerLocalReviewBundleLatestTitle(latestLocalReviewBundleRow),
      personalTeamCount: localReviewBundlePersonalTeamCount,
      stage1ArchiveCount: localReviewBundleStage1ArchiveCount,
      totalCount: localReviewBundleRows.length
    }),
    latestHash: latestReadyRow?.contentSha256 ?? "",
    latestReportKind: latestReadyRow?.reportKind ?? "",
    latestReportLabel: auditReportLedgerReportKindLabel(latestReadyRow?.reportKind ?? ""),
    latestReportQuery: auditReportLedgerLatestReportQuery(latestReadyRow),
    ready,
    revoked,
    signed,
    signingEligible: signingEligibleRows.length,
    total: rows.length,
    unsigned,
    verified
  };
}

export function auditReportLedgerRowIsSigningEligible(row: AuditEvidenceReportLedgerRow): boolean {
  return (
    row.reportKind !== "p0_readiness_report" &&
    row.reportKind !== "operator_runbook_report" &&
    row.reportKind !== "p2_manifest_chain_preflight" &&
    row.reportKind !== "p2_manifest_chain_preflight_review" &&
    row.reportKind !== "p2_readiness_evidence_coverage_review" &&
    row.reportKind !== "p2_readiness_acceptance_generated" &&
    row.reportKind !== "p2_readiness_acceptance_review" &&
    row.reportKind !== "personal_team_readiness_review" &&
    row.reportKind !== "daily_ops_control_room_review" &&
    row.reportKind !== "daily_start_brief_review" &&
    row.reportKind !== "stage1_daily_archive_review" &&
    row.reportKind !== "pre_live_runbook_report" &&
    row.reportKind !== "research_context_readiness_report"
  );
}

export function buildEvidencePackageControlRoomRows({
  acceptanceReviewEvents = [],
  auditLedgerRows = [],
  exportIndexRows = [],
  importAuditEvents = [],
  p0AcceptanceSummary = null
}: {
  acceptanceReviewEvents?: AuditEvidenceReportLedgerEventRecord[];
  auditLedgerRows?: AuditEvidenceReportLedgerRow[];
  exportIndexRows?: ResearchRunExportIndexRow[];
  importAuditEvents?: ResearchRunImportAuditEvent[];
  p0AcceptanceSummary?: P0AcceptanceSummary | null;
}): EvidencePackageControlRoom {
  const latestExportByRun = new Map<string, ResearchRunExportIndexRow>();
  const ledgerRowsByRun = new Map<string, AuditEvidenceReportLedgerRow[]>();
  const importEventsByRun = new Map<string, ResearchRunImportAuditEvent[]>();
  const acceptanceByRun = new Map<
    string,
    { state: P0AcceptanceSummaryState; detail: string; updatedAt: string }
  >();
  const runIds = new Set<string>();

  for (const row of exportIndexRows) {
    runIds.add(row.runId);
    const current = latestExportByRun.get(row.runId);
    if (!current || timestampSortValue(row.exportedAt) > timestampSortValue(current.exportedAt)) {
      latestExportByRun.set(row.runId, row);
    }
  }

  for (const row of auditLedgerRows) {
    runIds.add(row.runId);
    const rows = ledgerRowsByRun.get(row.runId) ?? [];
    rows.push(row);
    ledgerRowsByRun.set(row.runId, rows);
  }

  for (const event of importAuditEvents) {
    runIds.add(event.runId);
    const events = importEventsByRun.get(event.runId) ?? [];
    events.push(event);
    importEventsByRun.set(event.runId, events);
  }

  for (const event of acceptanceReviewEvents) {
    if (event.eventType !== "p0_acceptance_review" || !event.runId) {
      continue;
    }
    runIds.add(event.runId);
    const state = evidencePackageAcceptanceState(event);
    const current = acceptanceByRun.get(event.runId);
    if (!current || timestampSortValue(event.createdAt) > timestampSortValue(current.updatedAt)) {
      acceptanceByRun.set(event.runId, {
        state,
        detail:
          event.detail ||
          `${event.summary || "P0 acceptance review"} · ${auditReportLedgerMetadataText(
            event.metadata,
            "checkCount"
          )}/${auditReportLedgerMetadataText(event.metadata, "requiredCheckCount")} checks`,
        updatedAt: event.createdAt
      });
    }
  }

  if (p0AcceptanceSummary?.runId) {
    runIds.add(p0AcceptanceSummary.runId);
    const current = acceptanceByRun.get(p0AcceptanceSummary.runId);
    if (!current) {
      acceptanceByRun.set(p0AcceptanceSummary.runId, {
        state: p0AcceptanceSummary.state,
        detail: p0AcceptanceSummary.detail,
        updatedAt: ""
      });
    }
  }

  const rows = [...runIds]
    .map((runId): EvidencePackageControlRoomRow => {
      const exportRow = latestExportByRun.get(runId);
      const ledgerRows = ledgerRowsByRun.get(runId) ?? [];
      const latestLedgerRow = latestEvidencePackageLedgerRow(ledgerRows);
      const latestImportEvent = latestEvidencePackageImportEvent(importEventsByRun.get(runId) ?? []);
      const acceptance = acceptanceByRun.get(runId) ?? {
        state: "missing" as P0AcceptanceSummaryState,
        detail: "No P0 acceptance review has been recorded for this run.",
        updatedAt: ""
      };
      const signature = evidencePackageSignatureState(ledgerRows);
      const importStatus = latestImportEvent?.stage ?? "none";
      const packageStatus = exportRow?.status ?? "missing";
      const status = evidencePackageControlStatus({
        acceptanceStatus: acceptance.state,
        importStatus,
        packageStatus,
        signatureStatus: signature.status,
        staleSignature: signature.stale
      });
      const updatedAt = latestEvidencePackageUpdatedAt([
        exportRow?.exportedAt ?? "",
        latestLedgerRow?.createdAt ?? "",
        latestImportEvent?.createdAt ?? "",
        acceptance.updatedAt
      ]);

      return {
        id: `evidence-package-control-${runId}`,
        runId,
        context: exportRow?.context || latestLedgerRow?.focusQuery || runId,
        updatedAt,
        status,
        statusLabel: evidencePackageControlStatusLabel(status),
        packageStatus,
        packageDetail: exportRow?.detail || "No export package index row is available for this run.",
        signatureStatus: signature.status,
        signatureDetail: signature.detail,
        importStatus,
        importDetail: latestImportEvent?.detail || "No import audit event is recorded for this run.",
        acceptanceStatus: acceptance.state,
        acceptanceDetail: acceptance.detail,
        evidenceCoverage: evidencePackageCoverageDetail(ledgerRows),
        exportPath: exportRow?.exportPath || latestImportEvent?.exportPath || "",
        focusQuery: evidencePackageControlFocusQuery(runId, exportRow, latestLedgerRow),
        nextActionId: evidencePackageControlAction(status),
        nextActionLabel: evidencePackageControlActionLabel(status),
        tone: evidencePackageControlTone(status)
      };
    })
    .sort((left, right) => {
      const rankDelta = evidencePackageControlStatusRank(left.status) - evidencePackageControlStatusRank(right.status);
      if (rankDelta !== 0) {
        return rankDelta;
      }
      return timestampSortValue(right.updatedAt) - timestampSortValue(left.updatedAt) || left.runId.localeCompare(right.runId);
    });

  const summary: EvidencePackageControlRoomSummary = {
    total: rows.length,
    complete: rows.filter((row) => row.status === "complete").length,
    readyForArchive: rows.filter((row) => row.status === "ready_for_archive").length,
    needsAction: rows.filter((row) => evidencePackageControlStatusRank(row.status) < evidencePackageControlStatusRank("ready_for_archive")).length,
    importBlocked: rows.filter((row) => row.status === "import_blocked").length,
    packageBlocked: rows.filter((row) => row.status === "package_blocked").length,
    acceptanceMissing: rows.filter((row) => row.status === "acceptance_missing").length,
    staleSignature: rows.filter((row) => row.status === "stale_signature").length,
    unsigned: rows.filter((row) => row.status === "unsigned").length,
    signedRuns: rows.filter((row) => row.signatureStatus === "signed" || row.signatureStatus === "verified").length,
    latestUpdatedAt: latestEvidencePackageUpdatedAt(rows.map((row) => row.updatedAt))
  };

  return { rows, summary };
}

export function evidencePackageControlStatus({
  acceptanceStatus,
  importStatus,
  packageStatus,
  signatureStatus,
  staleSignature
}: {
  acceptanceStatus: P0AcceptanceSummaryState;
  importStatus: ResearchRunImportAuditEventStage | "none";
  packageStatus: ResearchRunExportIndexStatus | "missing";
  signatureStatus: AuditEvidenceReportSignatureStatus | "missing";
  staleSignature: boolean;
}): EvidencePackageControlRoomStatus {
  if (importStatus === "blocked" || importStatus === "failed" || importStatus === "undo-failed") {
    return "import_blocked";
  }
  if (packageStatus === "missing" || packageStatus === "blocked") {
    return "package_blocked";
  }
  if (acceptanceStatus !== "passed") {
    return "acceptance_missing";
  }
  if (staleSignature) {
    return "stale_signature";
  }
  if (signatureStatus === "missing" || signatureStatus === "unsigned") {
    return "unsigned";
  }
  return importStatus === "confirmed" ? "complete" : "ready_for_archive";
}

export function evidencePackageControlStatusRank(status: EvidencePackageControlRoomStatus): number {
  return (
    {
      import_blocked: 0,
      package_blocked: 1,
      acceptance_missing: 2,
      stale_signature: 3,
      unsigned: 4,
      ready_for_archive: 5,
      complete: 6
    } satisfies Record<EvidencePackageControlRoomStatus, number>
  )[status];
}

export function evidencePackageControlStatusLabel(status: EvidencePackageControlRoomStatus): string {
  return (
    {
      import_blocked: "Import blocked",
      package_blocked: "Export package blocked",
      acceptance_missing: "P0 acceptance missing",
      stale_signature: "Signature stale or invalid",
      unsigned: "Unsigned report",
      ready_for_archive: "Ready for archive",
      complete: "Complete evidence package"
    } satisfies Record<EvidencePackageControlRoomStatus, string>
  )[status];
}

export function evidencePackageControlAction(status: EvidencePackageControlRoomStatus): EvidencePackageControlRoomAction {
  if (status === "import_blocked") {
    return "open-import-audit";
  }
  if (status === "package_blocked") {
    return "inspect-package";
  }
  if (status === "acceptance_missing") {
    return "open-acceptance";
  }
  if (status === "stale_signature" || status === "unsigned") {
    return "open-signature-ledger";
  }
  return "open-archive";
}

export function evidencePackageControlActionLabel(status: EvidencePackageControlRoomStatus): string {
  return (
    {
      "inspect-package": "Inspect package",
      "open-acceptance": "Open P0 acceptance",
      "open-archive": "Archive evidence",
      "open-import-audit": "Open import audit",
      "open-signature-ledger": "Open signature ledger"
    } satisfies Record<EvidencePackageControlRoomAction, string>
  )[evidencePackageControlAction(status)];
}

export function evidencePackageControlTone(status: EvidencePackageControlRoomStatus): EvidencePackageControlRoomRow["tone"] {
  if (status === "complete") {
    return "positive";
  }
  if (status === "ready_for_archive" || status === "unsigned" || status === "acceptance_missing") {
    return "warning";
  }
  return "risk";
}

export function evidencePackageControlFocusQuery(
  runId: string,
  exportRow: ResearchRunExportIndexRow | undefined,
  ledgerRow: AuditEvidenceReportLedgerRow | null
): string {
  return [runId, exportRow?.exportPath, ledgerRow?.focusQuery, ledgerRow?.shortHash].filter(Boolean).join(" ");
}

export function latestEvidencePackageLedgerRow(rows: AuditEvidenceReportLedgerRow[]): AuditEvidenceReportLedgerRow | null {
  return rows.reduce<AuditEvidenceReportLedgerRow | null>((latest, row) => {
    if (!latest) {
      return row;
    }
    return timestampSortValue(row.createdAt) > timestampSortValue(latest.createdAt) ? row : latest;
  }, null);
}

export function latestEvidencePackageImportEvent(events: ResearchRunImportAuditEvent[]): ResearchRunImportAuditEvent | null {
  return events.reduce<ResearchRunImportAuditEvent | null>((latest, event) => {
    if (!latest) {
      return event;
    }
    return timestampSortValue(event.createdAt) > timestampSortValue(latest.createdAt) ? event : latest;
  }, null);
}

export function latestEvidencePackageUpdatedAt(timestamps: string[]): string {
  return timestamps
    .filter(Boolean)
    .sort((left, right) => timestampSortValue(right) - timestampSortValue(left))[0] ?? "";
}

export function evidencePackageAcceptanceState(event: AuditEvidenceReportLedgerEventRecord): P0AcceptanceSummaryState {
  const state = (auditReportLedgerMetadataText(event.metadata, "state") || event.stage).toLowerCase();
  if (state === "passed") {
    return "passed";
  }
  if (state === "invalid") {
    return "invalid";
  }
  return "missing";
}
