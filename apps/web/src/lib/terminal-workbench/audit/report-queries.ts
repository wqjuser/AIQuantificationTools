import { auditReportLedgerOperatorRunbookSectionLabel, auditReportLedgerPreLiveRunbookEvidenceLabel } from "./evidence-control-room";
import { auditReportLedgerDeduplicatedQueryText } from "./local-review-bundle";
import type { AuditEvidenceReportLedgerRow } from "./report-contracts";
import { resolveResearchContextUrlState } from "../core/workspace-operations";
import type { ProductWorkAreaId } from "../stage1/foundation-contracts";

export function auditReportLedgerUrlSearch(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }
  try {
    const url = new URL(trimmedValue);
    return url.searchParams.toString();
  } catch {
    const queryText = trimmedValue.includes("?") ? trimmedValue.slice(trimmedValue.indexOf("?") + 1) : trimmedValue;
    const cleanQueryText = queryText.split("#", 1)[0].replace(/^\?/u, "");
    return new URLSearchParams(cleanQueryText).toString();
  }
}

export function auditReportLedgerResearchContextLabel({
  fallbackMarket,
  fallbackSymbol,
  fallbackTimeframe,
  search
}: {
  fallbackMarket: string;
  fallbackSymbol: string;
  fallbackTimeframe: string;
  search: string;
}): string {
  const urlState = resolveResearchContextUrlState(search);
  const market = urlState?.market ?? fallbackMarket;
  const symbol = urlState?.symbol ?? fallbackSymbol;
  const timeframe = urlState?.timeframe ?? fallbackTimeframe;
  return market && symbol && timeframe ? `Research context · ${market} ${symbol} ${timeframe}` : "";
}

export function auditReportLedgerEvidenceLinkLabel(
  workspaceId: ProductWorkAreaId | null,
  status: string
): string {
  if (!workspaceId) {
    return "";
  }
  const workspaceLabel =
    workspaceId === "audit"
      ? "Audit evidence"
      : workspaceId === "execution"
        ? "Execution evidence"
        : `${workspaceId} evidence`;
  return status ? `${workspaceLabel} · ${status}` : workspaceLabel;
}

export function auditReportLedgerReportKindLabel(kind: AuditEvidenceReportLedgerRow["reportKind"] | ""): string {
  return (
    {
      audit_evidence_report: "Audit evidence report",
      backtest_report: "Backtest report",
      operator_runbook_report: "Operator runbook report",
      p0_readiness_report: "P0 readiness report",
      p2_manifest_chain_preflight: "P2 manifest chain preflight",
      p2_manifest_chain_preflight_review: "P2 manifest chain preflight review",
      p2_readiness_evidence_coverage_review: "P2 readiness evidence coverage review",
      p2_readiness_acceptance_generated: "P2 readiness acceptance generation",
      p2_readiness_acceptance_review: "P2 readiness acceptance review",
      personal_team_readiness_review: "Personal and small-team readiness review",
      daily_ops_control_room_review: "Daily ops control room review",
      daily_start_brief_review: "Daily start brief review",
      stage1_daily_archive_review: "Stage 1 daily-use archive review",
      pre_live_runbook_report: "Pre-live runbook report",
      portfolio_report: "Portfolio report",
      research_context_readiness_report: "Research context readiness report",
      "": ""
    } satisfies Record<AuditEvidenceReportLedgerRow["reportKind"] | "", string>
  )[kind];
}

export function auditReportLedgerLatestReportQuery(row: AuditEvidenceReportLedgerRow | undefined): string {
  if (!row) {
    return "";
  }
  return [row.reportKind, row.runId, row.shortHash, row.fileName].filter(Boolean).join(" ");
}

export function auditReportLedgerLatestAuditAidBaseQuery(row: AuditEvidenceReportLedgerRow | undefined): string {
  const baseQuery = auditReportLedgerLatestReportQuery(row);
  return [
    baseQuery,
    row?.p0PreparationEvidenceRunId,
    row?.p0CurrentGapActionId,
    row?.p0CurrentGapTargetWorkspaceId ?? ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function auditReportLedgerLatestAuditAidReportQuery(row: AuditEvidenceReportLedgerRow | undefined): string {
  const baseQuery = auditReportLedgerLatestAuditAidBaseQuery(row);
  const progressQuery =
    row?.reportKind === "p0_readiness_report"
      ? [
          row.focusQuery ? "p0-state" : "",
          row.focusQuery,
          row.packageTotal > 0 ? `p0-progress ${row.packageMatched}/${row.packageTotal}` : ""
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  const preflightQuery = auditReportLedgerLatestAuditAidPreflightTerms(row);
  return [baseQuery, progressQuery, preflightQuery].filter(Boolean).join(" ");
}

export function auditReportLedgerLatestAuditAidPreflightTerms(row: AuditEvidenceReportLedgerRow | undefined): string {
  if (!row || row.reportKind !== "p0_readiness_report" || !(row.paperPreflightState || row.paperPreflightGateTotal > 0)) {
    return "";
  }
  return [
    "preflight",
    row.paperPreflightState,
    row.paperPreflightActionId,
    `attention ${row.paperPreflightGateReviewCount + row.paperPreflightGateBlockedCount}`,
    `gates ${row.paperPreflightGatePassedCount}/${row.paperPreflightGateReviewCount}/${row.paperPreflightGateBlockedCount}`,
    row.paperPreflightLiveBoundary
  ]
    .filter(Boolean)
    .join(" ");
}

export function auditReportLedgerLatestAuditAidPreflightQuery(row: AuditEvidenceReportLedgerRow | undefined): string {
  const preflightTerms = auditReportLedgerLatestAuditAidPreflightTerms(row);
  if (!preflightTerms) {
    return "";
  }
  return [auditReportLedgerLatestAuditAidBaseQuery(row), "p0-preflight-focus", preflightTerms]
    .filter(Boolean)
    .join(" ");
}

export function buildAuditEvidenceReportLedgerRowResearchContextReportQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row) {
    return "";
  }
  return [
    row.reportKind,
    row.runId,
    row.shortHash,
    row.focusQuery
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildAuditEvidenceReportLedgerRowOperatorRunbookQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "operator_runbook_report") {
    return "";
  }
  return [
    row.reportKind,
    row.operatorRunbookAdapterId,
    row.operatorRunbookMarket,
    row.operatorRunbookSymbol,
    row.operatorRunbookTimeframe,
    row.operatorRunbookStatus,
    `${row.operatorRunbookCompletedSections}/${row.operatorRunbookTotalSections}`,
    auditReportLedgerOperatorRunbookSectionLabel(row.operatorRunbookSectionStatuses.length),
    row.operatorRunbookSectionStatuses.join(" "),
    row.shortHash
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildAuditEvidenceReportLedgerRowPreLiveRunbookQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "pre_live_runbook_report") {
    return "";
  }
  return [
    row.reportKind,
    row.preLiveRunbookAdapterId,
    row.preLiveRunbookMarket,
    row.preLiveRunbookSymbol,
    row.preLiveRunbookTimeframe,
    row.preLiveRunbookStatus,
    `${row.preLiveRunbookCompletedSteps}/${row.preLiveRunbookTotalSteps}`,
    auditReportLedgerPreLiveRunbookEvidenceLabel(row.preLiveRunbookEvidenceIds.length),
    row.preLiveRunbookEvidenceIds.join(" "),
    row.shortHash
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p2_manifest_chain_preflight") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.fileName,
    row.focusQuery,
    row.detail,
    row.searchText
  ]);
}

export function buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p2_manifest_chain_preflight_review") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.fileName,
    row.focusQuery,
    row.detail,
    row.searchText
  ]);
}

export function buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p2_readiness_evidence_coverage_review") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.fileName,
    row.focusQuery,
    row.detail,
    row.searchText
  ]);
}

export function buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceGeneratedQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p2_readiness_acceptance_generated") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.fileName,
    row.focusQuery,
    row.detail,
    row.searchText
  ]);
}

export function buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p2_readiness_acceptance_review") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.fileName,
    row.focusQuery,
    row.detail,
    row.searchText
  ]);
}

export function buildAuditEvidenceReportLedgerRowP2ReadinessAcceptanceLinkedCoverageReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const linkedCoverageReviewAuditEventId =
    row?.reportKind === "p2_readiness_acceptance_review"
      ? row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId.trim()
      : "";
  if (!linkedCoverageReviewAuditEventId) {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    "linked-coverage-review",
    "p2_readiness_evidence_coverage_review",
    linkedCoverageReviewAuditEventId,
    row?.id,
    row?.createdAt
  ]);
}

export function buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const linkedCoverageReviewAuditEventId =
    row?.reportKind === "p2_readiness_acceptance_review"
      ? row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId.trim()
      : "";
  if (!row || row.reportKind !== "p2_readiness_acceptance_review" || !linkedCoverageReviewAuditEventId) {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    "linked-acceptance-review",
    row.reportKind,
    row.id,
    linkedCoverageReviewAuditEventId,
    row.createdAt
  ]);
}

export function buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const linkedCoverageReviewAuditEventId =
    row?.reportKind === "p2_readiness_acceptance_review"
      ? row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId.trim()
      : "";
  if (!row || row.reportKind !== "p2_readiness_acceptance_review" || !linkedCoverageReviewAuditEventId) {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    "linked-review-chain",
    row.id,
    linkedCoverageReviewAuditEventId,
    row.createdAt
  ]);
}

export function buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "personal_team_readiness_review") {
    return "";
  }
  return `${row.personalTeamReadinessReviewState || "unknown"} ${row.personalTeamReadinessReviewReadyCount}/${row.personalTeamReadinessReviewTotalCount} · personal ${row.personalTeamReadinessReviewPersonalPercent}% · team ${row.personalTeamReadinessReviewTeamPercent}%`;
}

export function buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const label = buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewLabel(row);
  if (!row || row.reportKind !== "personal_team_readiness_review" || !label) {
    return "";
  }
  const openItems = row.personalTeamReadinessReviewOpenItemIds.length
    ? row.personalTeamReadinessReviewOpenItemIds.join(", ")
    : "none";
  const nextAction = row.personalTeamReadinessReviewNextActionLabel
    ? `${row.personalTeamReadinessReviewNextActionLabel} -> ${row.personalTeamReadinessReviewNextActionWorkspaceId || "unknown"}`
    : "none";
  return `Personal/team readiness review: ${label} · open ${openItems} · next ${nextAction}`;
}

export function buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "personal_team_readiness_review") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.personalTeamReadinessReviewState,
    `${row.personalTeamReadinessReviewReadyCount}/${row.personalTeamReadinessReviewTotalCount}`,
    "personal",
    `${row.personalTeamReadinessReviewPersonalPercent}%`,
    "team",
    `${row.personalTeamReadinessReviewTeamPercent}%`,
    row.personalTeamReadinessReviewNextActionLabel,
    row.personalTeamReadinessReviewNextActionWorkspaceId,
    row.personalTeamReadinessReviewOpenItemIds.join(" ")
  ]);
}

export function buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "daily_ops_control_room_review") {
    return "";
  }
  return `${row.dailyOpsControlRoomReviewState || "unknown"} ${row.dailyOpsControlRoomReviewReadyCount}/${row.dailyOpsControlRoomReviewTotalCount} · review ${row.dailyOpsControlRoomReviewReviewCount} · blocked ${row.dailyOpsControlRoomReviewBlockingCount}`;
}

export function buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const label = buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewLabel(row);
  if (!row || row.reportKind !== "daily_ops_control_room_review" || !label) {
    return "";
  }
  const openItems = row.dailyOpsControlRoomReviewOpenItemIds.length
    ? row.dailyOpsControlRoomReviewOpenItemIds.join(", ")
    : "none";
  const primaryAction = row.dailyOpsControlRoomReviewPrimaryActionLabel
    ? `${row.dailyOpsControlRoomReviewPrimaryActionLabel} -> ${row.dailyOpsControlRoomReviewPrimaryActionWorkspaceId || "unknown"}`
    : "none";
  const auditContext = row.dailyOpsControlRoomReviewAuditQueryTitle
    ? ` · audit ${row.dailyOpsControlRoomReviewAuditQueryTitle}`
    : "";
  return `Daily ops review: ${label} · open ${openItems} · primary ${primaryAction}${auditContext}`;
}

export function buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "daily_ops_control_room_review") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.dailyOpsControlRoomReviewState,
    `${row.dailyOpsControlRoomReviewReadyCount}/${row.dailyOpsControlRoomReviewTotalCount}`,
    "review",
    row.dailyOpsControlRoomReviewReviewCount,
    "blocked",
    row.dailyOpsControlRoomReviewBlockingCount,
    row.dailyOpsControlRoomReviewPrimaryActionLabel,
    row.dailyOpsControlRoomReviewPrimaryActionWorkspaceId,
    row.dailyOpsControlRoomReviewAuditQuery,
    row.dailyOpsControlRoomReviewAuditQueryTitle,
    row.dailyOpsControlRoomReviewOpenItemIds.join(" ")
  ]);
}

export function buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "daily_start_brief_review") {
    return "";
  }
  return `${row.dailyStartBriefReviewState || "unknown"} · local reviews ${row.dailyStartBriefReviewCurrentReviewCount}/2 · open ops ${row.dailyStartBriefReviewOpenOpsItemCount}`;
}

export function buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const label = buildAuditEvidenceReportLedgerRowDailyStartBriefReviewLabel(row);
  if (!row || row.reportKind !== "daily_start_brief_review" || !label) {
    return "";
  }
  const primaryAction = row.dailyStartBriefReviewPrimaryActionLabel
    ? `${row.dailyStartBriefReviewPrimaryActionLabel} -> ${row.dailyStartBriefReviewPrimaryActionWorkspaceId || "unknown"}`
    : "none";
  const localAction = row.dailyStartBriefReviewLocalReviewActionLabel || "none";
  const auditContext = row.dailyStartBriefReviewAuditQueryTitle
    ? ` · audit ${row.dailyStartBriefReviewAuditQueryTitle}`
    : "";
  return `Daily start review: ${label} · primary ${primaryAction} · local ${localAction}${auditContext}`;
}

export function buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "daily_start_brief_review") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.dailyStartBriefReviewState,
    "local-reviews",
    `${row.dailyStartBriefReviewCurrentReviewCount}/2`,
    `stale-reviews-${row.dailyStartBriefReviewStaleReviewCount}`,
    `missing-reviews-${row.dailyStartBriefReviewMissingReviewCount}`,
    "open-ops",
    row.dailyStartBriefReviewOpenOpsItemCount,
    row.dailyStartBriefReviewPrimaryActionLabel,
    row.dailyStartBriefReviewPrimaryActionWorkspaceId,
    row.dailyStartBriefReviewLocalReviewStatus,
    row.dailyStartBriefReviewLocalReviewActionLabel,
    row.dailyStartBriefReviewLocalReviewQuery,
    row.dailyStartBriefReviewAuditQuery,
    row.dailyStartBriefReviewAuditQueryTitle,
    row.dailyStartBriefReviewCheckpointIds.join(" "),
    "checkpoint-statuses",
    row.dailyStartBriefReviewCheckpointStatuses.join(" ")
  ]);
}

export function buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "stage1_daily_archive_review") {
    return "";
  }
  return `${row.stage1DailyArchiveReviewState || "unknown"} ${row.stage1DailyArchiveReviewReadyCount}/${row.stage1DailyArchiveReviewTotalCount} · refresh ${row.stage1DailyArchiveReviewRefreshOutcomeState || "unknown"} · share ${row.stage1DailyArchiveReviewShareKind || "none"}`;
}

export function buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  const label = buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewLabel(row);
  if (!row || row.reportKind !== "stage1_daily_archive_review" || !label) {
    return "";
  }
  const primaryAction = row.stage1DailyArchiveReviewPrimaryActionLabel
    ? `${row.stage1DailyArchiveReviewPrimaryActionLabel} -> ${row.stage1DailyArchiveReviewPrimaryTargetWorkspaceId || "unknown"}`
    : "none";
  const shareContext = row.stage1DailyArchiveReviewShareKind
    ? `${row.stage1DailyArchiveReviewShareKind}/${row.stage1DailyArchiveReviewShareFocus || "none"} -> ${row.stage1DailyArchiveReviewShareTargetWorkspaceId || "none"}`
    : "none";
  const rowStatuses = row.stage1DailyArchiveReviewRowStatuses.length
    ? row.stage1DailyArchiveReviewRowStatuses.join(", ")
    : "none";
  const archiveBodyHash = row.stage1DailyArchiveReviewArchiveBodySha256
    ? ` · Archive body SHA-256 ${row.stage1DailyArchiveReviewArchiveBodySha256.slice(0, 12)}`
    : "";
  const p2ChainSource = row.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath
    ? ` · P2 chain ${row.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath}`
    : "";
  return `Stage 1 archive review: ${label} · primary ${primaryAction} · rows ${rowStatuses} · share ${shareContext}${p2ChainSource}${archiveBodyHash}`;
}

export function buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "stage1_daily_archive_review") {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    row.reportKind,
    row.id,
    row.shortHash,
    row.fileName,
    row.stage1DailyArchiveReviewArchiveBodySha256 ? row.stage1DailyArchiveReviewArchiveBodySha256.slice(0, 12) : "",
    row.stage1DailyArchiveReviewState,
    `${row.stage1DailyArchiveReviewReadyCount}/${row.stage1DailyArchiveReviewTotalCount}`,
    row.stage1DailyArchiveReviewPrimaryActionId,
    row.stage1DailyArchiveReviewPrimaryActionLabel,
    row.stage1DailyArchiveReviewPrimaryTargetWorkspaceId,
    "refresh",
    row.stage1DailyArchiveReviewRefreshOutcomeState,
    "share",
    row.stage1DailyArchiveReviewShareKind,
    row.stage1DailyArchiveReviewShareFocus,
    row.stage1DailyArchiveReviewShareTargetWorkspaceId,
    "invalid-share",
    row.stage1DailyArchiveReviewInvalidShareStatus,
    row.stage1DailyArchiveReviewInvalidShareReason,
    "bootstrap-preflight",
    row.stage1DailyArchiveReviewBootstrapPreflightCheckIds.join(" "),
    row.stage1DailyArchiveReviewBootstrapPreflightCheckStatuses.join(" "),
    row.stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths.join(" "),
    "p2-chain",
    row.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath,
    row.stage1DailyArchiveReviewRowIds.join(" "),
    row.stage1DailyArchiveReviewRowStatuses.join(" "),
    row.stage1DailyArchiveReviewRowTargetWorkspaceIds.join(" ")
  ]);
}

export function auditReportLedgerLocalReviewBundleContextTitle(
  reportKind: AuditEvidenceReportLedgerRow["reportKind"],
  eventId: string,
  rowTitle = ""
): string {
  const reviewLabel = auditReportLedgerLocalReviewBundleReviewLabel(reportKind);
  if (!reviewLabel) {
    return "";
  }
  return ["local-review-bundle", reviewLabel, eventId, rowTitle].filter(Boolean).join(" · ");
}

export function auditReportLedgerLocalReviewBundleContextLabel(
  reportKind: AuditEvidenceReportLedgerRow["reportKind"]
): string {
  const reviewLabel = auditReportLedgerLocalReviewBundleReviewLabel(reportKind);
  return reviewLabel ? `local review bundle · ${reviewLabel}` : "";
}

export function auditReportLedgerLocalReviewBundleReviewLabel(reportKind: AuditEvidenceReportLedgerRow["reportKind"]): string {
  return reportKind === "personal_team_readiness_review"
    ? "personal/team readiness review"
    : reportKind === "daily_ops_control_room_review"
      ? "daily ops review"
      : reportKind === "daily_start_brief_review"
        ? "daily start review"
        : reportKind === "stage1_daily_archive_review"
          ? "stage1 archive review"
      : "";
}

export function auditReportLedgerLocalReviewBundleLatestLabel(row: AuditEvidenceReportLedgerRow | null | undefined): string {
  const reviewLabel = row ? auditReportLedgerLocalReviewBundleReviewLabel(row.reportKind) : "";
  return reviewLabel ? `latest local review · ${reviewLabel}` : "";
}

export function auditReportLedgerLocalReviewBundleLatestReviewQuery(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row) {
    return "";
  }
  if (row.reportKind === "personal_team_readiness_review") {
    return buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewQuery(row);
  }
  if (row.reportKind === "daily_ops_control_room_review") {
    return buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewQuery(row);
  }
  if (row.reportKind === "daily_start_brief_review") {
    return buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery(row);
  }
  if (row.reportKind === "stage1_daily_archive_review") {
    return buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery(row);
  }
  return "";
}

export function auditReportLedgerLocalReviewBundleLatestReviewTitle(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row) {
    return "";
  }
  if (row.reportKind === "personal_team_readiness_review") {
    return buildAuditEvidenceReportLedgerRowPersonalTeamReadinessReviewTitle(row);
  }
  if (row.reportKind === "daily_ops_control_room_review") {
    return buildAuditEvidenceReportLedgerRowDailyOpsControlRoomReviewTitle(row);
  }
  if (row.reportKind === "daily_start_brief_review") {
    return buildAuditEvidenceReportLedgerRowDailyStartBriefReviewTitle(row);
  }
  if (row.reportKind === "stage1_daily_archive_review") {
    return buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewTitle(row);
  }
  return "";
}

export function auditReportLedgerLocalReviewBundleLatestQuery(row: AuditEvidenceReportLedgerRow | null | undefined): string {
  const reviewLabel = row ? auditReportLedgerLocalReviewBundleReviewLabel(row.reportKind) : "";
  if (!row || !reviewLabel) {
    return "";
  }
  return auditReportLedgerDeduplicatedQueryText([
    "local-review-bundle-latest",
    reviewLabel,
    row.id,
    row.createdAt,
    auditReportLedgerLocalReviewBundleLatestReviewQuery(row)
  ]);
}

export function auditReportLedgerLocalReviewBundleLatestTitle(row: AuditEvidenceReportLedgerRow | null | undefined): string {
  const reviewLabel = row ? auditReportLedgerLocalReviewBundleReviewLabel(row.reportKind) : "";
  if (!row || !reviewLabel) {
    return "";
  }
  return [
    "local-review-bundle-latest",
    reviewLabel,
    row.id,
    row.createdAt,
    auditReportLedgerLocalReviewBundleLatestReviewTitle(row)
  ]
    .filter(Boolean)
    .join(" · ");
}
